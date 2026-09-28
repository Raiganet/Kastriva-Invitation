/** Read-only probes: separate base account compatibility from current feature support. */
import { BASE_SCHEMA_VERSION, activeCatalogCheck, featureChecks } from './database-capabilities.ts';
export type CheckState = 'pass' | 'warn' | 'fail' | 'skip';
export type ReadinessCheck = { id: string; label: string; state: CheckState; detail: string };
export type ReadinessReport = { checkedAt: string; configured: boolean; readyForAccountTest: boolean; readyForFeatureTest: boolean; checks: ReadinessCheck[] };
export type PublicConfig = { url: string; key: string };
type ProbeOptions = { fetcher?: typeof fetch; timeoutMs?: number };
export function backendHeaders(key: string): Record<string, string> {
  return { apikey: key, ...(key.startsWith('sb_publishable_') ? {} : { Authorization: `Bearer ${key}` }), 'Content-Type': 'application/json' };
}
export async function probeBackend(config: PublicConfig | null, options: ProbeOptions = {}): Promise<ReadinessReport> {
  const checkedAt = new Date().toISOString();
  if (!config) return { checkedAt, configured: false, readyForAccountTest: false, readyForFeatureTest: false, checks: [
    { id: 'environment', label: 'Konfigurasi aplikasi', state: 'skip', detail: 'Mode demo. Isi URL dan publishable key Supabase lalu restart/redeploy.' },
  ] };
  const connection: PublicConfig = config;
  const fetcher = options.fetcher ?? fetch;
  async function probe(path: string, method = 'GET'): Promise<{ ok: boolean; status: number; body: unknown }> {
    const controller = new AbortController(); let timer: ReturnType<typeof setTimeout> | undefined;
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
    try {
      return await Promise.race([
        (async () => {
          const response = await fetcher(connection.url.replace(/\/$/, '') + path, {
            method, headers: backendHeaders(connection.key), cache: 'no-store', redirect: 'error',
            signal: controller.signal, ...(method === 'POST' ? { body: '{}' } : {}),
          });
          if (response.redirected) throw new Error('REDIRECT');
          if (!/^application\/json(?:\s*;|$)/i.test(response.headers.get('content-type') || '')) throw new Error('NOT_JSON');
          reader = response.body?.getReader();
          if (!reader) throw new Error('EMPTY_BODY');
          const chunks: Uint8Array[] = []; let size = 0;
          while (true) {
            const part = await reader.read(); if (part.done) break;
            size += part.value.length;
            if (size > 32768) throw new Error('PROBE_RESPONSE_TOO_LARGE');
            chunks.push(part.value);
          }
          const bytes = new Uint8Array(size); let offset = 0;
          for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
          const body: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
          return { ok: response.ok, status: response.status, body };
        })(),
        new Promise<never>((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new Error('TIMEOUT')); }, options.timeoutMs ?? 8000); }),
      ]);
    } finally {
      if (timer) clearTimeout(timer); controller.abort();
      // A broken upstream cancel promise must not hold the response open.
      if (reader) void reader.cancel().catch(() => {});
    }
  }
  const jobs = await Promise.allSettled([
    probe('/auth/v1/settings'),
    probe('/rest/v1/rpc/ki_schema_version', 'POST'),
    probe('/rest/v1/ki_templates?select=slug&active=eq.true&limit=100'),
    probe('/rest/v1/rpc/ki_feature_readiness', 'POST'),
    probe('/rest/v1/rpc/ki_open_wish_version', 'POST'),
  ]);
  const checks: ReadinessCheck[] = [{ id: 'environment', label: 'Konfigurasi aplikasi', state: 'pass', detail: 'Konfigurasi publik tersedia. Nilai key tidak ditampilkan.' }];
  const names = ['Layanan akun', 'Kompatibilitas skema dasar', 'Katalog yang terlihat pengunjung', 'Diagnostik fitur (012)', 'Ucapan umum (013)'];
  const ids = ['auth', 'schema', 'catalog', 'feature_audit', 'open_wishes'];
  jobs.forEach((job, index) => {
    const base = { id: ids[index], label: names[index] };
    if (job.status === 'rejected') { checks.push({ ...base, state: 'fail', detail: 'Layanan tidak merespons atau balasannya tidak valid. Periksa koneksi dan status proyek.' }); return; }
    const result = job.value;
    if (!result.ok) {
      const detail = [401, 403].includes(result.status) ? 'Akses ditolak. Periksa pasangan URL/key dan izin database; jangan memakai service-role key pada konfigurasi publik.'
        : index === 1 && result.status === 404 ? 'RPC dasar belum ditemukan. Pasang migrasi 001, 002, dan seterusnya secara berurutan mengikuti panduan upgrade.'
        : index === 3 && result.status === 404 ? 'RPC diagnostik belum ditemukan. Ikuti panduan sampai 012_feature_readiness.sql; schema 7 saja belum membuktikan fitur 008–011 tersedia.'
        : index === 4 && result.status === 404 ? 'Ucapan umum belum terpasang. Jalankan 013_public_wishes.sql setelah 012; tidak perlu mengulang migrasi lama.'
        : 'Pemeriksaan gagal. Periksa migrasi, Data API, dan status proyek Supabase.';
      checks.push({ ...base, state: 'fail', detail }); return;
    }
    if (index === 0) {
      const body = result.body as { external?: { email?: boolean }; disable_signup?: boolean } | null;
      const email = body?.external?.email === true;
      checks.push({ ...base, state: email && body?.disable_signup === false ? 'pass' : 'warn', detail: email && body?.disable_signup === false
        ? 'Provider email dan pendaftaran terbuka. Pengiriman email tetap perlu diuji langsung.'
        : 'Auth merespons, tetapi provider email atau pendaftaran perlu diperiksa di Authentication.' });
    } else if (index === 1) {
      checks.push({ ...base, state: result.body === BASE_SCHEMA_VERSION ? 'pass' : 'fail', detail: result.body === BASE_SCHEMA_VERSION
        ? 'Kontrak dasar schema 7 cocok. Dukungan musik/hadiah dan tema terbaru diperiksa terpisah di bawah.'
        : 'Versi dasar database tidak cocok. Periksa urutan migrasi; jangan mengubah penanda versi secara manual.' });
    } else if (index === 2) checks.push(activeCatalogCheck(result.body));
    else if(index === 3) checks.push(...featureChecks(result.body));
    else checks.push({...base,state:result.body===1?'pass':'fail',detail:result.body===1?'Protokol ucapan umum tersedia. Penerimaan, moderasi, privasi, dan gateway tetap perlu diuji.':'Protokol ucapan umum tidak sesuai. Periksa migrasi 013, bukan mengganti schema dasar.'});
  });
  const readyForAccountTest = ['environment', 'auth', 'schema'].every(id => checks.some(c => c.id === id && c.state === 'pass'));
  const readyForFeatureTest = readyForAccountTest && checks.some(c => c.id === 'cms_catalog_complete')
    && checks.every(c => c.state === 'pass' || (c.id === 'catalog' && c.state === 'warn'));
  return { checkedAt, configured: true, readyForAccountTest, readyForFeatureTest, checks };
}
