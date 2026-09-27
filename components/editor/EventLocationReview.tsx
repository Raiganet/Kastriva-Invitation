'use client';
import Link from 'next/link';
import {mapLink} from '@/lib/maps';
import type {InvitationEvent} from '@/lib/types';

export default function EventLocationReview({events,onEdit,editHref}:{events:Pick<InvitationEvent,'id'|'label'|'venue'|'address'|'mapUrl'>[];onEdit?:()=>void;editHref?:string}) {
 const rows=events.map(event=>({...event,link:mapLink(event.mapUrl)}));
 const linked=rows.filter(event=>event.link.href).length;
 return <section className="location-review" aria-label="Periksa lokasi acara">
  <div className="location-review-heading"><div><span className="eyebrow">SEBELUM MENGUNDANG TAMU</span><h3>Periksa lokasi acara</h3></div><span className="location-review-count">{linked}/{rows.length} link terisi</span></div>
  <p className="location-review-intro">Alamat lengkap wajib diisi. Link Maps opsional; buka setiap tautan untuk memastikan pin sesuai tempat acara.</p>
  <ol>{rows.map((event,i)=><li key={event.id}>
   <span className="location-review-number" aria-hidden="true">{String(i+1).padStart(2,'0')}</span>
   <div className="location-review-detail"><h4>{event.label.trim()||`Acara ${i+1}`}</h4><strong>{event.venue.trim()||'Nama tempat belum diisi'}</strong><p className="location-review-address">{event.address.trim()||'Alamat lengkap belum diisi.'}</p>
    {event.link.href?<a className="button ghost small" href={event.link.href} target="_blank" rel="noopener noreferrer" aria-label={`Periksa peta ${event.label.trim()||`acara ${i+1}`}`}>Periksa peta <span aria-hidden="true">↗</span></a>:<p className="location-review-missing">{event.mapUrl.trim()?'Link peta belum valid. Perbaiki sebelum menyimpan.':'Link Maps belum diisi. Tamu hanya akan melihat alamat.'}</p>}
   </div>
  </li>)}</ol>
  {onEdit?<button type="button" className="text-button" onClick={onEdit}>Lengkapi atau ubah lokasi →</button>:editHref?<Link className="text-link" href={editHref}>Lengkapi atau ubah lokasi →</Link>:null}
 </section>;
}
