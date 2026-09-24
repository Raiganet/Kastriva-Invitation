/** Read-only Supabase probes. No service key, customer data or tokens enter the report. */
export type CheckState = 'pass' | 'warn' | 'fail' | 'skip';
export type ReadinessCheck = { id: string; label: string; state: CheckState; detail: string };
export type ReadinessReport = { checkedAt: string; configured: boolean; readyForAccountTest: boolean; checks: ReadinessCheck[] };
export type PublicConfig = { url: string; key: string };
type ProbeOptions = { fetcher?: typeof fetch; timeoutMs?: number };
export function backendHeaders(key: string): Record<string, string> {
  return { apikey: key, ...(key.startsWith('sb_publishable_') ? {} : { Authorization: `Bearer ${key}` }), 'Content-Type': 'application/json' };
}
export async function probeBackend(config: PublicConfig | null, options: ProbeOptions = {}): Promise<ReadinessReport> {
  const checkedAt = new Date().toISOString();
  if (!config) return { checkedAt, configured: false, readyForAccountTest: false, checks: [
    { id: 'environment', label: 'Konfigurasi aplikasi', state: 'skip', detail: 'Mode demo. Isi URL dan publishable key Supabase lalu restart/redeploy.' },
  ] };
  const fetcher = options.fetcher ?? fetch;
  async function probe(path: string, method = 'GET'): Promise<{ ok: boolean; status: number; body: unknown }> {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        (async () => {
          const response = await fetcher(config!.url.replace(/\/$/, '') + path, {
            method, headers: backendHeaders(config!.key), cache: 'no-store', redirect: 'error',
            signal: controller.signal, ...(method === 'POST' ? { body: '{}' } : {}),
          });
          let body: unknown = null;
          // These endpoints return small metadata, never rows containing personal data.
          const reader = response.body?.getReader();
          if (reader) {
            const chunks: Uint8Array[] = []; let size = 0;
            while (true) {
              const part = await reader.read(); if (part.done) break;
              size += part.value.length;
              if (size > 32768) { await reader.cancel(); throw new Error('PROBE_RESPONSE_TOO_LARGE'); }
              chunks.push(part.value);
            }
            const bytes = new Uint8Array(size); let offset = 0;
            for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
            try { body = JSON.parse(new TextDecoder().decode(bytes)); } catch { /* Classified below. */ }
          }
          return { ok: response.ok, status: response.status, body };
        })(),
        new Promise<never>((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new Error('TIMEOUT')); }, options.timeoutMs ?? 8000); }),
      ]);
    } finally { if (timer) clearTimeout(timer); controller.abort(); }
  }
  const jobs = await Promise.allSettled([
    probe('/auth/v1/settings'),
    probe('/rest/v1/rpc/ki_schema_version', 'POST'),
    probe('/rest/v1/ki_templates?select=slug&active=eq.true&limit=8'),
  ]);
  const checks: ReadinessCheck[] = [{ id: 'environment', label: 'Konfigurasi aplikasi', state: 'pass', detail: 'Konfigurasi publik tersedia. Nilai key tidak ditampilkan.' }];
  const names = ['Layanan akun', 'Migrasi tahap 7', 'Katalog di database'];
  const ids = ['auth', 'schema', 'catalog'];
  jobs.forEach((job, index) => {
    const base = { id: ids[index], label: names[index] };
    if (job.status === 'rejected') { checks.push({ ...base, state: 'fail', detail: 'Layanan tidak merespons atau balasannya tidak valid. Periksa koneksi dan status proyek.' }); return; }
    const result = job.value;
    if (!result.ok) {
      const detail = [401, 403].includes(result.status) ? 'Akses ditolak. Periksa pasangan URL/key dan izin database; jangan memakai service-role key.'
        : index === 1 && result.status === 404 ? 'RPC tahap 7 belum ditemukan. Jalankan migrasi 001, 002, 003, 004, 005, 006, kemudian 007 dan coba kembali.'
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
      checks.push({ ...base, state: result.body === 7 ? 'pass' : 'fail', detail: result.body === 7
        ? 'RPC melaporkan schema versi 7. Ini bukan audit lengkap RLS atau Storage.'
        : 'Versi database tidak cocok dengan kode tahap 7. Periksa urutan migrasi.' });
    } else {
      const slugs = Array.isArray(result.body) ? result.body.map(row => row && typeof row === 'object' && 'slug' in row ? row.slug : null) : [];
      const valid = slugs.length > 0 && slugs.every(slug => typeof slug === 'string' && /^[a-z0-9-]{1,60}$/.test(slug));
      checks.push({ ...base, state: valid ? 'pass' : 'fail', detail: valid
        ? `${slugs.length} tema aktif berhasil dibaca. Harga checkout dibaca kembali dari database; harga di editor adalah referensi katalog.`
        : 'Tidak ada tema aktif yang dapat diverifikasi. Periksa seed katalog dan kebijakan SELECT.' });
    }
  });
  return { checkedAt, configured: true, readyForAccountTest: checks.every(check => check.state === 'pass'), checks };
}
