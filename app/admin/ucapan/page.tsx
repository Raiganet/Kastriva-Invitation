import {requireAdmin} from '@/lib/server-auth';
import {parseWishPlatform} from '@/lib/open-wishes';
import {publicWishesAppEnabled} from '@/lib/open-wish-server';
import WishPlatformSettings from '@/components/wishes/WishPlatformSettings';
export const dynamic='force-dynamic';export const metadata={title:'Layanan ucapan umum',robots:{index:false,follow:false}};
export default async function WishAdmin(){const {db,user}=await requireAdmin();const {data,error}=await db.rpc('ki_open_wish_admin');
 return <main className="container workspace"><span className="eyebrow">PENGATURAN PLATFORM</span><h1>Ucapan & doa umum.</h1><p>Aktifkan layanan secara terpisah dari RSVP personal. Admin platform tidak diberi akses membaca ucapan privat milik pelanggan lain melalui halaman ini.</p>
 {error||!data?<p className="notice error">Pengaturan belum dapat dibaca. Periksa migrasi 013_public_wishes.sql dan koneksi. Kegagalan tidak dianggap layanan kosong.</p>:<WishPlatformSettings owner={user.id} initial={parseWishPlatform(data)} appEnabled={publicWishesAppEnabled()}/>}
 <section className="panel"><h2>Batas versi ini</h2><p>Nama 80 karakter, pesan 500 karakter, maksimum 2.000 kiriman termasuk penanda penghapusan per undangan. Gateway membatasi trafik; database membatasi 5 kiriman per identitas jaringan harian per undangan dengan jeda 30 detik. Wi-Fi bersama dapat berbagi kuota.</p><p>Ini bukan verifikasi identitas, CAPTCHA, atau perlindungan DDoS menyeluruh. Tinjau pemakaian, moderasi, retensi, dan beban sebelum membuka untuk banyak pelanggan.</p></section></main>;}
