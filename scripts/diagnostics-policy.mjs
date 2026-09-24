/** Diagnostic policy has no writes, .env reads, installs, or account connections. */
export function classifyFailure(value) {
  const code=String(value?.code||value?.cause?.code||'');
  const text=code+' '+String(value?.message||value||'');
  if(/EAI_AGAIN|ENOTFOUND/i.test(text))return {code:'DNS_UNAVAILABLE',advice:'Nama registry belum dapat dihubungi. Periksa koneksi/DNS/VPN pada mesin yang menjalankan perintah; jangan mengganti semua versi paket.'};
  if(/ETARGET|E404|NO_MATCHING_VERSION/i.test(text))return {code:'PACKAGE_VERSION_UNAVAILABLE',advice:'Versi paket tidak ditemukan pada registry yang diperiksa. Catat nama/versinya; jangan otomatis memakai latest atau menurunkan versi keamanan.'};
  if(/CERT_|CERTIFICATE|UNABLE_TO_VERIFY|SELF_SIGNED/i.test(text))return {code:'TLS_VERIFICATION_FAILED',advice:'Periksa jam sistem, sertifikat/proxy jaringan. Jangan mematikan strict-ssl atau verifikasi TLS.'};
  if(/AbortError|TimeoutError|ETIMEDOUT|UND_ERR_CONNECT_TIMEOUT/i.test(text))return {code:'NETWORK_TIMEOUT',advice:'Koneksi melewati batas waktu. Periksa jaringan kemudian ulangi; belum ada bukti paket tidak tersedia.'};
  if(/E401|E403/i.test(text))return {code:'REGISTRY_ACCESS_DENIED',advice:'Registry menolak akses. Periksa proxy dan konfigurasi npm tanpa membagikan token atau isi .npmrc.'};
  if(/E429/i.test(text))return {code:'REGISTRY_RATE_LIMIT',advice:'Registry membatasi permintaan. Ulangi setelah pembatasan berakhir.'};
  if(/ERESOLVE/i.test(text))return {code:'DEPENDENCY_CONFLICT',advice:'Dependensi tidak cocok. Periksa paket yang disebut; jangan menggunakan --force atau --legacy-peer-deps untuk menyembunyikan konflik.'};
  if(/ECONNREFUSED|ECONNRESET|E5\d\d/i.test(text))return {code:'NETWORK_UNAVAILABLE',advice:'Koneksi registry gagal. Ini tidak membuktikan versi paket salah.'};
  return {code:'CHECK_FAILED',advice:'Pemeriksaan belum berhasil. Periksa ringkasan lokal; jangan menganggap instalasi atau build sudah lulus.'};
}
export function redactLog(value) {
  return String(value)
    .replace(/\x1b\[[0-9;]*m/g,'')
    .replace(/(https?:\/\/)[^\s/@:]+:[^\s/@]+@/gi,'$1[REDACTED]@')
    .replace(/sb_(?:secret|publishable)_[A-Za-z0-9_-]+/g,'[REDACTED_KEY]')
    .replace(/\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g,'[REDACTED_JWT]')
    .replace(/((?:token_hash|access_token|refresh_token|code|guest)=)[^&\s"'<>]+/gi,'$1[REDACTED]')
    .replace(/((?:_authToken|SUPABASE_SECRET_KEY|RATE_LIMIT_HMAC_KEY|PGPASSWORD)\s*[=:]\s*)[^\r\n\s]+/gi,'$1[REDACTED]')
    .replace(/(Authorization\s*:\s*Bearer\s+)\S+/gi,'$1[REDACTED]');
}
export function supportsNode(version) { return /^v?22\.\d+\.\d+$/.test(version); }
// Restricted to manifest forms used in this project; unknown expressions fail closed.
export function matchesVersion(actual,requested) {
  const parse=s=>/^(\d+)\.(\d+)\.(\d+)$/.exec(s)?.slice(1).map(Number);
  const a=parse(actual||''),b=parse(String(requested||'').replace(/^[~^]/,''));if(!a||!b)return false;
  if(!/^[~^]/.test(requested))return actual===requested;
  const atLeast=a[0]>b[0]||a[0]===b[0]&&(a[1]>b[1]||a[1]===b[1]&&a[2]>=b[2]);
  if(!atLeast)return false;
  if(requested[0]==='~')return a[0]===b[0]&&a[1]===b[1];
  if(b[0]>0)return a[0]===b[0];
  return b[1]>0?a[0]===0&&a[1]===b[1]:actual===requested.slice(1);
}
export function packageRequirements(pkg) {
  return Object.entries({...pkg.dependencies,...pkg.devDependencies}).map(([name,requested])=>{
    if(!/^(?:@[a-z0-9_-]+\/)?[a-z0-9_.-]+$/.test(name)||typeof requested!=='string')throw new Error('INVALID_MANIFEST');
    return {name,requested,exact:/^\d+\.\d+\.\d+$/.test(requested)};
  });
}
export async function probePackage({name,requested},fetcher=fetch,timeoutMs=8000) {
  if(!/^\d+\.\d+\.\d+$/.test(requested))return {name,requested,state:'skip',code:'RANGE_RESOLVED_BY_NPM'};
  const controller=new AbortController();let timer;let reader;let stopped=false;
  const cancel=()=>{stopped=true;controller.abort();if(reader)void reader.cancel().catch(()=>{});};
  try {
    return await Promise.race([
      new Promise((_,reject)=>{timer=setTimeout(()=>{cancel();reject(Object.assign(new Error('TimeoutError'),{code:'ETIMEDOUT'}));},timeoutMs);}),
      (async()=>{
        const r=await fetcher('https://registry.npmjs.org/'+encodeURIComponent(name)+'/'+encodeURIComponent(requested),{signal:controller.signal,redirect:'error',headers:{Accept:'application/json'},cache:'no-store'});
        if(stopped){void r.body?.cancel().catch(()=>{});throw new Error('TimeoutError');}
        if(!r.ok){void r.body?.cancel().catch(()=>{});throw Object.assign(new Error('REGISTRY_HTTP'),{code:'E'+r.status});}
        if(!r.body)throw new Error('EMPTY_REGISTRY_RESPONSE');reader=r.body.getReader();const parts=[];let size=0;
        while(!stopped){const {value,done}=await reader.read();if(stopped)throw new Error('TimeoutError');if(done)break;size+=value.byteLength;if(size>256*1024)throw new Error('REGISTRY_RESPONSE_TOO_LARGE');parts.push(value);}
        const raw=new Uint8Array(size);let offset=0;for(const p of parts){raw.set(p,offset);offset+=p.byteLength;}
        const data=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(raw));
        if(data.name!==name||data.version!==requested)throw new Error('REGISTRY_METADATA_MISMATCH');
        return {name,requested,state:'pass',code:'EXACT_VERSION_FOUND'};
      })(),
    ]);
  }catch(e){return {name,requested,state:'fail',...classifyFailure(e)};}
  finally {clearTimeout(timer);cancel();}
}
