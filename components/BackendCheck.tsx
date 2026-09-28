'use client';
import { useRef, useState } from 'react';
import type { ReadinessReport } from '@/lib/readiness';
const states = { pass: 'Berhasil', warn: 'Periksa', fail: 'Belum berhasil', skip: 'Belum diatur' };
export default function BackendCheck() {
  const [report, setReport] = useState<ReadinessReport | null>(null);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const lock = useRef(false);
  async function check() {
    if (lock.current) return; lock.current = true; setBusy(true); setError(''); setReport(null);
    const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch('/api/setup/check', { method: 'POST', signal: controller.signal, cache: 'no-store' });
      if (!response.ok) throw new Error('Pemeriksaan belum berhasil. Muat ulang halaman dan coba kembali.');
      const result: ReadinessReport = await response.json();
      if (!Array.isArray(result.checks) || typeof result.readyForAccountTest !== 'boolean' || typeof result.readyForFeatureTest !== 'boolean') throw new Error('Balasan pemeriksaan belum lengkap.');
      setReport(result);
    } catch (reason) { setError(reason instanceof Error && reason.name === 'AbortError' ? 'Koneksi terlalu lama merespons. Periksa server dan coba kembali.' : 'Pemeriksaan belum berhasil. Periksa koneksi lalu coba kembali.'); }
    finally { clearTimeout(timeout); lock.current = false; setBusy(false); }
  }
  return <section className="panel setup-check"><span className="eyebrow">PEMERIKSAAN BACA-SAJA</span><h2>Apakah backend sudah terhubung?</h2>
    <p>Pemeriksaan ini tidak membuat akun, mengubah database, atau menampilkan key.</p>
    <button type="button" className="button" disabled={busy} onClick={check}>{busy ? 'Memeriksa koneksi…' : 'Periksa koneksi Supabase'}</button>
    <div aria-live="polite">{error && <p className="notice error">{error}</p>}
    {report && <><div className="check-list">{report.checks.map(item => <article key={item.id} className={`check-item check-${item.state}`}><span className="badge">{states[item.state]}</span><div><h3>{item.label}</h3><p>{item.detail}</p></div></article>)}</div>
      <p className={`notice ${report.readyForAccountTest ? 'success' : ''}`}><strong>Koneksi akun:</strong> {report.readyForAccountTest ? 'Dasar akun kompatibel. Uji daftar, email konfirmasi, login, dan dua akun berbeda.' : 'Belum siap diuji. Periksa konfigurasi, Auth, dan skema dasar.'}</p>
      <p className={`notice ${report.readyForFeatureTest ? 'success' : ''}`}><strong>Fitur terbaru:</strong> {report.readyForFeatureTest ? 'Kemampuan musik/hadiah, tema, dan CMS terdeteksi. Lanjutkan pengujian staging; belum berarti siap produksi.' : 'Belum lengkap atau belum dapat diverifikasi. Ikuti panduan migrasi 008–012; koneksi akun berhasil tidak otomatis berarti fitur terbaru tersedia.'}</p>
      <small>Diperiksa: {new Date(report.checkedAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB. Bukan bukti seluruh fitur siap produksi.</small></>}
    </div></section>;
}
