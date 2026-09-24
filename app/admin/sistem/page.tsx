import Link from 'next/link';
import RefreshButton from '@/components/RefreshButton';
import { requireAdmin } from '@/lib/server-auth';
import { systemChecks } from '@/lib/system-status';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Status Sistem', robots: { index: false, follow: false } };
export default async function SystemPage() {
  const { db } = await requireAdmin();
  const { data, error } = await db.rpc('ki_system_status');
  const checks = error ? [] : systemChecks(data);
  return <main className="container workspace"><div className="workspace-heading"><div><span className="eyebrow">ADMIN / TAHAP 7</span><h1>Status sistem.</h1><p>Pemeriksaan konfigurasi langsung dari database, hanya untuk akun admin.</p></div><div className="button-row"><Link className="button ghost" href="/admin">← Admin</Link><Link className="button ghost" href="/setup">Panduan koneksi</Link><Link className="button ghost" href="/admin/transaksi">Pengaturan transaksi</Link><RefreshButton/></div></div>
    <p className="notice">Indikator berhasil bukan jaminan seluruh kebijakan benar. Uji dua akun, email, dan foto tetap diperlukan. Halaman ini tidak mengaktifkan pesanan atau pembayaran.</p>
    {error ? <p className="notice error">Diagnostik belum dapat dimuat. Jalankan 007_release_hardening.sql setelah 001–006 pada proyek yang sama dan pastikan akun ini admin. Tidak ada detail SQL atau secret yang ditampilkan.</p> : <div className="system-grid">{checks.map(check => <article key={check.id} className={`panel check-item check-${check.state}`}><span className="badge">{check.state === 'pass' ? 'Berhasil' : check.state === 'warn' ? 'Periksa' : 'Belum berhasil'}</span><div><h2>{check.label}</h2><p>{check.detail}</p></div></article>)}</div>}
    <p className="muted">Versi aplikasi 1.7.0 · Flag server permintaan: {process.env.ENABLE_ORDER_REQUESTS === 'true' ? 'aktif' : 'nonaktif'} · Pembayaran manual & publikasi dikendalikan terpisah pada Pengaturan transaksi.</p>
  </main>;
}
