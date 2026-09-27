import Link from 'next/link';
import {publicationAvailable, type Sale, type Publication} from '@/lib/commerce';

export default function CustomerProgress({sale,publication,enabled=true}:{sale?:Sale;publication?:Publication|null;enabled?:boolean}) {
 const active=!!sale&&publicationAvailable(sale,publication||null,enabled,Date.now());
 const expired=sale?.status==='paid'&&(!sale.expires_at||Date.parse(sale.expires_at)<=Date.now());
 const stopped=sale?.status==='cancelled'||sale?.status==='revoked'||expired;
 const step=!sale?0:sale.status==='awaiting_review'?2:sale.status==='paid'?(active?4:3):1;
 const message=stopped?(expired?'Masa aktif telah berakhir. Hubungi pengelola.':'Pesanan tidak aktif. Periksa detail pesanan atau hubungi pengelola.'):active?'Undangan sudah terbit. Salin tautannya untuk mengundang tamu.':sale?.status==='paid'?(enabled?'Pembayaran diterima. Periksa checklist, lalu terbitkan undangan Anda.':'Pembayaran diterima. Publikasi sedang dinonaktifkan pengelola.'):sale?.status==='awaiting_review'?'Konfirmasi Anda sedang diperiksa admin. Tidak perlu transfer ulang.':sale?.status==='rejected'?'Konfirmasi perlu diperbaiki. Baca catatan admin sebelum mengirim ulang.':sale?'Lakukan transfer sesuai rincian pesanan, lalu kirim konfirmasi.':'Mulai dengan melengkapi pasangan dan acara, lalu periksa preview.';
 return <section className="customer-progress no-print" aria-label="Tahapan undangan"><ol>{['Isi undangan','Bayar','Verifikasi','Terbitkan','Bagikan'].map((label,i)=><li key={label} aria-current={!stopped&&i===step?'step':undefined} className={!stopped&&i<step?'complete':''}><span aria-hidden="true">{!stopped&&i<step?'✓':i+1}</span>{label}</li>)}</ol><p>{message}</p>{sale&&!stopped&&sale.status==='paid'&&enabled&&<Link className="button small" href={active?'#bagikan':'#publikasi'}>{active?'Bagikan undangan':'Periksa & terbitkan'}</Link>}</section>;
}
