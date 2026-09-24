import Link from 'next/link';
export default function NotFound(){return <main className="container empty-state page-space"><span className="eyebrow">404</span><h1>Halaman tidak ditemukan.</h1><p>Tautan mungkin salah, draft bukan milik akun Anda, atau fitur belum diterbitkan.</p><Link className="button" href="/tema">Kembali ke koleksi tema</Link></main>;}
