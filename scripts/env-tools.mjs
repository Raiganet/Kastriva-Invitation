import fs from 'node:fs';
import path from 'node:path';
// Intentionally single-line configuration. Next interpolation in NEXT_PUBLIC_* is rejected.
export function loadProjectEnv({ root = process.cwd(), mode = process.env.NODE_ENV || 'development', base = process.env } = {}) {
  const env = { ...base };
  const names = [`.env.${mode}.local`, ...(mode === 'test' ? [] : ['.env.local']), `.env.${mode}`, '.env'];
  for (const name of names) {
    const file = path.join(root, name); if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const match = /^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
      if (!match || env[match[1]] !== undefined) continue;
      let value = match[2];
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
      else value = value.replace(/\s+#.*$/, '');
      env[match[1]] = value;
    }
  }
  return env;
}
export function validateEnvironment(env) {
  const errors = [];
  for (const [name, value] of Object.entries(env)) {
    if (!name.startsWith('NEXT_PUBLIC_') || !value) continue;
    if (value.includes('$')) errors.push(`${name}: isi nilai langsung, bukan referensi/interpolasi variabel.`);
    let privileged = value.startsWith('sb_secret_');
    if (value.split('.').length === 3) { try { privileged ||= JSON.parse(Buffer.from(value.split('.')[1], 'base64url').toString()).role === 'service_role'; } catch {} }
    if (privileged) errors.push(`${name} berisi kunci privat/service_role. Hapus dan rotasi kunci jika pernah dipublikasikan. Nilainya tidak dicetak.`);
  }
  const url = env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (Boolean(url) !== Boolean(key)) errors.push('Isi URL dan publishable/anon key Supabase bersamaan, atau kosongkan keduanya untuk mode demo.');
  if (url) { try { const u = new URL(url); if (u.protocol !== 'https:' || u.username || u.password || u.search || u.hash || u.pathname !== '/') throw new Error(); } catch { errors.push('NEXT_PUBLIC_SUPABASE_URL harus origin https tanpa path, query, atau kredensial.'); } }
  if (key) {
    let valid = key.startsWith('sb_publishable_') && key.length > 'sb_publishable_'.length && !/\s/.test(key);
    if (!valid) { try { valid = key.split('.').length === 3 && JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString()).role === 'anon'; } catch {} }
    if (!valid) errors.push('Gunakan publishable key lengkap atau JWT anon, bukan password database.');
  }
  if (env.NEXT_PUBLIC_SITE_URL) { try { const u = new URL(env.NEXT_PUBLIC_SITE_URL); if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password || u.search || u.hash || u.pathname !== '/') throw new Error(); if (u.protocol === 'http:' && !['localhost', '127.0.0.1'].includes(u.hostname)) throw new Error(); } catch { errors.push('NEXT_PUBLIC_SITE_URL harus origin aplikasi: https://domain atau http://localhost:3000, tanpa path/query.'); } }
  if (url && env.VERCEL === '1') {
    try { const u = new URL(env.NEXT_PUBLIC_SITE_URL || ''); if (u.protocol !== 'https:' || ['localhost','127.0.0.1'].includes(u.hostname)) throw new Error(); }
    catch { errors.push('Deployment Vercel dengan Supabase memerlukan NEXT_PUBLIC_SITE_URL HTTPS aplikasi agar email tidak mengarah ke localhost.'); }
  }
  if (env.ENABLE_ORDER_REQUESTS && !['true', 'false'].includes(env.ENABLE_ORDER_REQUESTS)) errors.push('ENABLE_ORDER_REQUESTS hanya true atau false.');
  if (env.ENABLE_ORDER_REQUESTS === 'true' && (!url || !key)) errors.push('Permintaan pengerjaan tidak dapat aktif tanpa konfigurasi Supabase.');
  for(const flag of ['ENABLE_CHECKOUT','ENABLE_PUBLIC_INVITATIONS','ENABLE_RSVP']){if(env[flag]&&!['true','false'].includes(env[flag]))errors.push(flag+' hanya true atau false.');if(env[flag]==='true'&&(!url||!key))errors.push(flag+' membutuhkan konfigurasi Supabase.');}
  if(env.ENABLE_RSVP==='true'&&env.ENABLE_PUBLIC_INVITATIONS!=='true')errors.push('ENABLE_RSVP membutuhkan ENABLE_PUBLIC_INVITATIONS=true.');
  const secret=env.SUPABASE_SECRET_KEY||'';if(secret){let valid=/^sb_secret_\S{10,}$/.test(secret);try{valid ||= secret.split('.').length===3 && JSON.parse(Buffer.from(secret.split('.')[1],'base64url').toString()).role==='service_role';}catch{}if(!valid)errors.push('SUPABASE_SECRET_KEY harus server secret/service_role lengkap, bukan publishable key. Nilainya tidak dicetak.');if(!url)errors.push('Key privat harus dipasangkan dengan proyek Supabase yang sama.');}
  const rateKey=env.RATE_LIMIT_HMAC_KEY||'';
  if(rateKey && (!/^[0-9a-fA-F]{64}$/.test(rateKey)||new Set(rateKey.toLowerCase()).size<8))errors.push('RATE_LIMIT_HMAC_KEY harus 32 byte acak dalam format hex (64 karakter). Nilainya tidak dicetak.');
  if(env.NEXT_PUBLIC_RATE_LIMIT_HMAC_KEY)errors.push('RATE_LIMIT_HMAC_KEY hanya untuk server; hapus varian NEXT_PUBLIC_ dan rotasi bila sudah terpapar.');
  if(env.ENABLE_PUBLIC_INVITATIONS==='true'){
    if(!secret)errors.push('Undangan publik tahap 7 memerlukan SUPABASE_SECRET_KEY server, termasuk undangan tanpa foto.');
    if(!rateKey)errors.push('Undangan publik memerlukan RATE_LIMIT_HMAC_KEY server untuk pembatasan trafik.');
    let local=false;try{local=['localhost','127.0.0.1','[::1]'].includes(new URL(env.NEXT_PUBLIC_SITE_URL||'').hostname);}catch{}
    if(env.VERCEL!=='1'&&!local)errors.push('Gateway publik mendukung Vercel atau localhost. Reverse proxy lain perlu integrasi alamat tepercaya tersendiri.');
  }
  if (env.NEXT_PUBLIC_WHATSAPP_NUMBER && !/^62\d{8,13}$/.test(env.NEXT_PUBLIC_WHATSAPP_NUMBER)) errors.push('Nomor WhatsApp harus 62 diikuti angka saja.');
  return { errors, config: url && key && !errors.length ? { url, key } : null };
}
