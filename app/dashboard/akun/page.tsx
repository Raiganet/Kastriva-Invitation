import Link from 'next/link';
import { requireUser } from '@/lib/server-auth';
import LogoutButton from '@/components/LogoutButton';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Akun Saya', robots: { index: false, follow: false } };
export default async function AccountPage() {
  const { db, user } = await requireUser('/dashboard/akun');
  const { data: admin, error } = await db.rpc('ki_is_admin');
  const displayName = typeof user.user_metadata?.display_name === 'string' ? user.user_metadata.display_name.slice(0,100) : 'Pemilik akun';
  return <main className="container workspace"><div className="workspace-heading"><div><span className="eyebrow">AKUN & AKSES</span><h1>Akun saya.</h1><p>Informasi akun yang sedang masuk, bukan data dari local storage.</p></div><div className="button-row"><Link className="button ghost" href="/dashboard">← Dashboard</Link><LogoutButton/></div></div>
  <section className="panel account-panel"><h2>{displayName}</h2><dl className="account-details"><dt>Email</dt><dd>{user.email || 'Belum tersedia'}</dd><dt>Konfirmasi email</dt><dd>{user.email_confirmed_at ? 'Sudah dikonfirmasi' : 'Belum dikonfirmasi'}</dd><dt>Peran aplikasi</dt><dd>{error ? 'Belum dapat diverifikasi' : admin === true ? 'Admin' : 'Pelanggan'}</dd><dt>User UID</dt><dd><code>{user.id}</code></dd></dl>
  <p className="muted">UID dapat digunakan pemilik proyek untuk memberi akses admin melalui SQL. Tidak ada tombol mengangkat diri sendiri menjadi admin.</p>
  <div className="button-row"><Link className="button ghost" href="/lupa-password">Ubah kata sandi melalui email</Link>{!user.email_confirmed_at && <Link className="button ghost" href="/kirim-konfirmasi">Kirim ulang konfirmasi</Link>}{admin === true && <Link className="button" href="/admin/sistem">Status sistem ↗</Link>}</div></section>
  <p className="notice">Hapus draft tersedia pada dashboard. Penghapusan akun dan pembersihan seluruh media belum otomatis pada tahap ini.</p></main>;
}
