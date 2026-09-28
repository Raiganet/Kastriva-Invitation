import {publicationAvailable,SALE_LABEL,type Sale,type Publication} from './commerce.ts';
export function customerJourney(sale:Pick<Sale,'status'|'expires_at'>|undefined,publication:Pick<Publication,'active'>|null,enabled:boolean,now:number){
 const active=!!sale&&publicationAvailable(sale,publication,enabled,now);
 const expired=sale?.status==='paid'&&(!sale.expires_at||!Number.isFinite(Date.parse(sale.expires_at))||Date.parse(sale.expires_at)<=now);
 const stopped=sale?.status==='cancelled'||sale?.status==='revoked'||expired;
 const step=!sale?0:sale.status==='awaiting_review'?2:sale.status==='paid'?(active?4:3):1;
 const label=expired?'MASA AKTIF BERAKHIR':active?'TERBIT':sale?.status==='paid'&&!enabled?'PUBLIKASI DITUTUP':sale?SALE_LABEL[sale.status]:'DRAFT PRIVAT';
 const message=stopped?(expired?'Masa aktif telah berakhir. Hubungi pengelola.':'Pesanan tidak aktif. Periksa detail pesanan atau hubungi pengelola.'):active?'Undangan sudah terbit. Salin tautannya untuk mengundang tamu.':sale?.status==='paid'?(enabled?'Pembayaran diterima. Periksa checklist, lalu terbitkan undangan Anda.':'Pembayaran diterima. Publikasi sedang dinonaktifkan pengelola.'):sale?.status==='awaiting_review'?'Konfirmasi Anda sedang diperiksa admin. Tidak perlu transfer ulang.':sale?.status==='rejected'?'Konfirmasi perlu diperbaiki. Baca catatan admin sebelum mengirim ulang.':sale?'Lakukan transfer sesuai rincian pesanan, lalu kirim konfirmasi.':'Mulai dengan melengkapi pasangan dan acara, lalu periksa preview.';
 return {active,expired,stopped,step,label,message};
}
