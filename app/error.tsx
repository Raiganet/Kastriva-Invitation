'use client';
export default function ErrorPage({reset}:{reset:()=>void}) {return <main className="container empty-state page-space"><h1>Halaman belum dapat dimuat.</h1><p>Periksa koneksi atau konfigurasi Supabase. Data tidak dianggap kosong dan tidak dihapus.</p><button className="button" onClick={reset}>Coba lagi</button></main>;}
