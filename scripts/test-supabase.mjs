/** Optional STAGING-only integration. Creates two isolated fixtures; cleans only its own UUIDs.
 * No signup, email changes, migrations, role changes, uploads, payments, or publishing.
 * Login tokens remain in memory and are never printed. Needs confirmed non-admin test accounts.
 */
import { randomUUID } from 'node:crypto';
import { loadProjectEnv, validateEnvironment } from './env-tools.mjs';
import { backendHeaders } from '../lib/readiness.ts';
import { blankContent, invitationEvents, withEvents } from '../lib/domain.ts';
const env = loadProjectEnv({ mode: 'test' });
const { errors, config } = validateEnvironment(env);
const keys = ['KI_TEST_EMAIL_A','KI_TEST_PASSWORD_A','KI_TEST_EMAIL_B','KI_TEST_PASSWORD_B','KI_TEST_PROJECT_REF'];
if (!process.argv.includes('--write') || env.KI_TEST_ALLOW_WRITES !== 'true') {
  console.log('SKIP: tidak ada perubahan server. Baca docs/UJI_SUPABASE_TAHAP2.md, gunakan proyek staging dan dua akun uji.');
  console.log('Sesudah siap, isi .env.test.local dan jalankan npm run test:supabase -- --write.');
  process.exit(2);
}
if (errors.length || !config || keys.some(key => !env[key]) || env.KI_TEST_EMAIL_A?.toLowerCase() === env.KI_TEST_EMAIL_B?.toLowerCase()
  || new URL(config.url).hostname !== `${env.KI_TEST_PROJECT_REF}.supabase.co`) {
  console.error('STOP: konfigurasi pengujian tidak lengkap, dua akun sama, atau project ref tidak cocok. Nilai rahasia tidak dicetak.');
  process.exit(2);
}
const sessions = []; const fixtures = []; let passed = 0;
async function call(path, { token, method = 'GET', body } = {}) {
  let response;
  try {
    response = await fetch(config.url.replace(/\/$/,'') + path, {
      method, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(12000),
      headers: { ...backendHeaders(config.key), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch { throw new Error('Koneksi pengujian gagal/timeout. Tidak ada token yang dicetak.'); }
  let data = null; try { data = await response.json(); } catch {}
  return { ok: response.ok, status: response.status, data };
}
const rpc = (name, token, body = {}) => call(`/rest/v1/rpc/${name}`, { method: 'POST', token, body });
function expect(ok, label) { if (!ok) throw new Error('FAIL: ' + label); passed++; console.log('PASS: ' + label); }
async function login(letter) {
  const result = await call('/auth/v1/token?grant_type=password', { method: 'POST', body: { email: env[`KI_TEST_EMAIL_${letter}`], password: env[`KI_TEST_PASSWORD_${letter}`] } });
  if (!result.ok || !result.data?.access_token) throw new Error('Login akun uji belum berhasil. Periksa kredensial/konfirmasi email tanpa membagikannya.');
  const session = { token: result.data.access_token, user: result.data.user }; sessions.push(session);
  const identity = await call('/auth/v1/user', { token: session.token });
  expect(identity.ok && identity.data?.id === session.user?.id && !!identity.data?.email_confirmed_at, `Identitas akun ${letter} diverifikasi server`);
  const admin = await rpc('ki_is_admin', session.token);
  expect(admin.ok && admin.data === false, `Akun ${letter} bukan admin`);
  return session;
}
async function read(token, id) { return call(`/rest/v1/ki_invitations?select=id,revision& id=eq.${id}`.replace('& id=', '&id='), { token }); }
try {
  const version = await rpc('ki_schema_version'); expect(version.ok && version.data === 7, 'Migrasi tahap 7 tersedia');
  const A = await login('A'), B = await login('B'); expect(A.user.id !== B.user.id, 'Dua identitas berbeda');
  for (const [label, session] of [['A',A],['B',B]]) {
    const fixture = { id: randomUUID(), token: session.token, revision: 1, request: randomUUID(), label };
    // Register for cleanup BEFORE sending: a timed-out write may already be committed.
    fixtures.push(fixture);
    const payload = { p_id: fixture.id, p_theme: 'elegant-rose', p_content: withEvents({ ...blankContent, groom: `TEST TAHAP3 ${label}`, bride: 'DATA UJI', photoPaths: [] }, [invitationEvents(blankContent)[0], {...invitationEvents(blankContent)[0],id:'reception',label:'Resepsi',eventDate:'2026-12-26'}]), p_expected_revision: 0, p_request_id: fixture.request };
    fixture.payload = payload;
    const result = await rpc('ki_save_draft', session.token, payload);
    expect(result.ok && result.data?.id === fixture.id && result.data?.revision === 1, `Simpan draft fixture ${label}`);
    const retry = await rpc('ki_save_draft', session.token, payload);
    expect(retry.ok && retry.data?.revision === 1, `Retry ${label} tidak menggandakan revision`);
  }
  const [a,b] = fixtures;
  for (const [session, other, own, label] of [[A,B,a,'A'],[B,A,b,'B']]) {
    const self = await read(session.token,own.id); expect(self.ok && Array.isArray(self.data) && self.data.length === 1, `Akun ${label} bisa membaca fixture sendiri`);
    const cross = await read(other.token,own.id); expect(cross.ok && Array.isArray(cross.data) && cross.data.length === 0, `Fixture ${label} tidak terlihat oleh akun lain`);
  }
  const anon = await read(undefined,a.id); expect([401,403].includes(anon.status), 'Pengunjung tanpa akun tidak mendapat akses tabel draft');
  const crossWrite = await rpc('ki_save_draft',B.token,{ ...a.payload, p_request_id: randomUUID() });
  expect(!crossWrite.ok && crossWrite.data?.code === '42501','RPC menolak menimpa draft akun lain');
  const conflict = await rpc('ki_save_draft',A.token,{ ...a.payload, p_request_id: randomUUID() });
  expect(!conflict.ok && conflict.data?.code === '40001','Simpan versi lama menghasilkan konflik');
  const wrongDelete = await rpc('ki_delete_draft',B.token,{p_id:a.id,p_expected_revision:1});
  const stillThere = await read(A.token,a.id);
  expect(wrongDelete.ok && stillThere.ok && stillThere.data?.length === 1,'Hapus ID akun lain tidak menghapus data pemilik');
  const staleDelete = await rpc('ki_delete_draft',A.token,{p_id:a.id,p_expected_revision:2});
  expect(!staleDelete.ok && staleDelete.data?.code === '40001','Hapus dengan versi salah ditolak');
  const system = await rpc('ki_system_status',A.token);
  expect(!system.ok && system.data?.code === '42501','Diagnostik admin ditolak untuk pelanggan');
  const removed = await rpc('ki_delete_draft',A.token,{p_id:a.id,p_expected_revision:1});
  expect(removed.ok && removed.data?.deleted === true,'Pemilik dapat menghapus fixture sendiri');
  const resurrection = await rpc('ki_save_draft',A.token,a.payload);
  expect(!resurrection.ok && resurrection.data?.code === '40001','Retry lama tidak menghidupkan draft yang telah dihapus');
  console.log(`${passed} pemeriksaan integrasi lulus. Ini belum mencakup email delivery, Storage, browser, atau pembayaran.`);
} catch (error) {
  // Only our controlled messages are exposed, not response payloads from Auth/PostgREST.
  console.error(error instanceof Error ? error.message : 'Pengujian belum berhasil.'); process.exitCode = 1;
} finally {
  for (const fixture of fixtures) {
    try {
      const cleanup = await rpc('ki_delete_draft',fixture.token,{p_id:fixture.id,p_expected_revision:fixture.revision});
      if (!cleanup.ok || cleanup.data?.deleted !== true) throw new Error();
      console.log(`CLEANUP: fixture ${fixture.label} dihapus atau sudah tidak ada.`);
    } catch { console.error(`PERIKSA CLEANUP: draft fixture ${fixture.id}. Jangan hapus draft lainnya.`); process.exitCode = 1; }
  }
  for (const session of sessions) {
    try { const logout = await call('/auth/v1/logout?scope=local',{method:'POST',token:session.token}); if (!logout.ok) throw new Error(); }
    catch { console.error('PERIKSA: logout sesi uji belum dapat dipastikan.'); process.exitCode = 1; }
  }
  console.log('Akun uji dan marker ID penghapusan tetap ada. Tidak ada foto/pesanan yang dibuat.');
}
