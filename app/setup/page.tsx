import Link from 'next/link';
import BackendCheck from '@/components/BackendCheck';
import {APP_VERSION} from '@/lib/release';
export const metadata = {title:'Aktivasi Supabase',robots:{index:false,follow:false}};
export default function Setup(){return <main className="container prose page-space">
 <span className="eyebrow">RILIS {APP_VERSION} / KONEKSI & FITUR DATABASE</span><h1>Hubungkan ruang<br/><em>cerita Anda.</em></h1>
 <p>Skema dasar tetap <strong>7</strong>. Musik, amplop digital, dan 15 tema memerlukan migrasi tambahan 008–011; pemeriksaan baca-sajanya ditambahkan melalui 012. Nomor ini berbeda dari versi aplikasi.</p><BackendCheck/>
 <section className="panel"><h2>1. Lengkapi migrasi yang belum terpasang</h2>
 <p>Gunakan proyek Supabase khusus Invitation yang sama. Cadangkan database dan foto, lalu uji upgrade di staging. File berada di <code>supabase/migrations</code>.</p>
 <p><strong>Sudah sampai 011?</strong> Cukup jalankan <code>012_feature_readiness.sql</code>. Jika masih 007, lengkapi 008 → 009 → 010 → 011 → 012 sesuai panduan. Proyek baru menjalankan 001–012 secara berurutan.</p>
 <p>Jangan menghapus tabel, mereset harga, atau menjalankan migrasi lama setelah yang lebih baru. Jika tidak tahu posisi migrasi, ikuti <code>docs/UPGRADE_v1.8.0.md</code>, bukan menebak dari schema 7.</p>
 <h2>2. Pertahankan konfigurasi yang benar</h2><p>Tidak ada key atau flag baru pada rilis ini. Jangan memasukkan password database atau secret server ke variabel publik. Email konfirmasi, Site URL, dan redirect tetap perlu diuji.</p>
 <h2>3. Bedakan hasil pemeriksaan</h2><p>Koneksi akun memeriksa Auth dan skema dasar. Pemeriksaan fitur menguji validator serta katalog, termasuk tema nonaktif. Hasilnya tidak membuktikan pengiriman email, keamanan dua akun, keberhasilan pembayaran, atau kelulusan browser.</p>
 <p>Tema yang sengaja disembunyikan tidak dianggap hilang. Jangan mengaktifkan semua tema hanya untuk membuat pemeriksaan terlihat berhasil.</p>
 <div className="button-row"><Link className="button" href="/login">Masuk untuk uji akun</Link><Link className="button ghost" href="/panduan">Baca panduan</Link><Link className="button ghost" href="/admin/rilis">Kesiapan rilis admin</Link></div></section>
 </main>;}
