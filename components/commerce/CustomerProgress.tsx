import Link from 'next/link';
import type {Sale,Publication} from '@/lib/commerce';
import {customerJourney} from '@/lib/customer-journey';
export default function CustomerProgress({sale,publication,enabled=true,detailHref='',compact=false}:{sale?:Sale;publication?:Publication|null;enabled?:boolean;detailHref?:string;compact?:boolean}){
 const {active,stopped,step,message}=customerJourney(sale,publication||null,enabled,Date.now());
 return <section className={'customer-progress no-print'+(compact?' compact-progress':'')} aria-label="Tahapan undangan ini"><ol>{['Isi undangan','Bayar','Verifikasi','Terbitkan','Bagikan'].map((label,i)=><li key={label} aria-current={!stopped&&i===step?'step':undefined} className={!stopped&&i<step?'complete':''}><span aria-hidden="true">{!stopped&&i<step?'✓':i+1}</span>{label}</li>)}</ol><p>{message}</p>
 {sale&&!stopped&&sale.status==='paid'&&enabled&&<Link className="button small" href={detailHref+(active?'#bagikan':'#publikasi')}>{active?'Bagikan undangan':'Periksa & terbitkan'}</Link>}</section>;
}
