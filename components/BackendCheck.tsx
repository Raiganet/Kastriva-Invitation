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
      if (!Array.isArray(result.checks)) throw new Error('Balasan pemeriksaan belum lengkap.');
      setReport(result);
    } catch (reason) { setError(reason instanceof Error && reason.name === 'AbortError' ? 'Koneksi terlalu lama merespons. Periksa server dan coba kembali.' : 'Pemeriksaan belum berhasil. Periksa koneksi lalu coba kembali.'); }
    finally { clearTimeout(timeout); lock.current = false; setBusy(false); }
  }
  return <section className="panel setup-check"><span className="eyebrow">PEMERIKSAAN BACA-SAJA</span><h2>Apakah backend sudah terhubung?</h2>
    <p>Pemeriksaan ini tidak membuat akun, mengubah database, atau menampilkan key.</p>
    <button type="button" className="button" disabled={busy} onClick={check}>{busy ? 'Memeriksa koneksi…' : 'Periksa koneksi Supabase'}</button>
    <div aria-live="polite">{error && <p className="notice error">{error}</p>}
    {report && <><div className="check-list">{report.checks.map(item => <article key={item.id} className={`check-item check-${item.state}`}><span className="badge">{states[item.state]}</span><div><h3>{item.label}</h3><p>{item.detail}</p></div></article>)}</div>
      <p className={`notice ${report.readyForAccountTest ? 'success' : ''}`}>{report.readyForAccountTest ? 'Koneksi dasar berhasil. Selanjutnya uji daftar, email konfirmasi, login, dan dua akun yang berbeda.' : 'Selesaikan bagian yang belum berhasil sebelum menguji akun.'}</p>
      <small>Diperiksa: {new Date(report.checkedAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB. Bukan bukti seluruh fitur siap produksi.</small></>}
    </div></section>;
}
