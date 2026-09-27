import {publicationAvailable,type Sale} from './commerce.ts';

export function orderNextStep(sale:Pick<Sale,'status'|'expires_at'>,publication:{active:boolean}|null,enabled:boolean,known:boolean,now:number){
 if(sale.status==='paid'){
  const expiry=Date.parse(sale.expires_at||'');
  if(!Number.isFinite(expiry))return {label:'Periksa masa aktif',action:'Periksa detail',hash:''};
  if(expiry<=now)return {label:'Masa aktif berakhir',action:'Periksa detail',hash:''};
  if(!known)return {label:'Status publikasi belum tersedia',action:'Periksa detail',hash:''};
  if(!enabled)return {label:'Publikasi sedang dinonaktifkan',action:'Periksa detail',hash:''};
  if(publicationAvailable(sale,publication,enabled,now))return {label:'Undangan terbit',action:'Bagikan undangan',hash:'#bagikan'};
  return {label:publication?'Undangan ditarik dari publik':'Belum diterbitkan',action:'Periksa & terbitkan',hash:'#publikasi'};
 }
 if(sale.status==='awaiting_payment')return {label:'Menunggu transfer dan konfirmasi',action:'Lihat cara bayar',hash:''};
 if(sale.status==='awaiting_review')return {label:'Konfirmasi sedang diperiksa',action:'Periksa pembayaran',hash:''};
 if(sale.status==='rejected')return {label:'Baca catatan admin sebelum mengirim ulang',action:'Perbaiki konfirmasi',hash:'#konfirmasi-transfer'};
 return {label:'Pesanan tidak aktif',action:'Lihat detail',hash:''};
}
