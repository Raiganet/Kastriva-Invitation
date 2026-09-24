'use client';
export default function PublicError({reset}:{reset:()=>void}){return <main className="container empty-state page-space"><h1>Undangan belum dapat dimuat.</h1><p>Layanan sedang sibuk atau konfigurasi belum selesai. Tunggu sebentar lalu coba lagi. Hubungi pengirim bila kendala berlanjut.</p><button className="button" onClick={reset}>Coba lagi</button></main>;}
