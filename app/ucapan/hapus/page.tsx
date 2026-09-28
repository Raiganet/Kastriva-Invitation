import WithdrawWish from '@/components/wishes/WithdrawWish';
export const metadata={title:'Hapus ucapan pribadi',robots:{index:false,follow:false},referrer:'no-referrer' as const};
export default function RemoveWish(){return <main className="container prose page-space"><span className="eyebrow">KENDALI ATAS UCAPAN ANDA</span><h1>Hapus ucapan.</h1><p>Gunakan kode penghapusan yang Anda simpan setelah mengirim. Tidak perlu login. Kode tidak boleh dibagikan kepada orang lain.</p><WithdrawWish/></main>;}
