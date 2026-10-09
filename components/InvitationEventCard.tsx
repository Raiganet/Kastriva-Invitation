import {useId,useState} from 'react';
import type {InvitationEvent} from '@/lib/types';
import {eventDateLabel,validDate} from '@/lib/domain';
import InvitationLocation from './InvitationLocation';
import ThemeMotif from './ThemeMotif';

const timezones={'Asia/Jakarta':['WIB','Waktu Indonesia Barat'],'Asia/Makassar':['WITA','Waktu Indonesia Tengah'],'Asia/Jayapura':['WIT','Waktu Indonesia Timur']};
export default function InvitationEventCard({event,index,slug,title,demo,onDownload}:{event:InvitationEvent;index:number;slug:string;title:string;demo:boolean;onDownload:(event:InvitationEvent)=>string}){
 const heading=useId(),[status,setStatus]=useState('');
 const date=validDate(event.eventDate)?new Date(`${event.eventDate}T00:00:00Z`):null;
 const weekday=date?new Intl.DateTimeFormat('id-ID',{weekday:'long',timeZone:'UTC'}).format(date):'';
 const month=date?new Intl.DateTimeFormat('id-ID',{month:'long',year:'numeric',timeZone:'UTC'}).format(date):'';
 const [zone,zoneName]=timezones[event.timezone]??timezones['Asia/Jakarta'];
 return <li className="event-box inv-event-card" aria-labelledby={heading}>
  <span className="inv-event-connector" aria-hidden="true"><i/></span>
  <div className="inv-event-paper">
   <div className="inv-event-heading"><span className="event-sequence">ACARA {String(index+1).padStart(2,'0')}</span><span className="inv-event-emblem" aria-hidden="true"><ThemeMotif slug={slug}/></span></div>
   <h3 id={heading}>{title}</h3>
   <div className="inv-event-when">
    {date?<time className="inv-event-date" dateTime={event.eventDate} aria-label={eventDateLabel(event.eventDate)}><span className="inv-event-day" aria-hidden="true">{String(date.getUTCDate()).padStart(2,'0')}</span><span aria-hidden="true"><b>{weekday}</b><small>{month}</small></span></time>:<p className="inv-event-date-empty">Tanggal belum lengkap</p>}
    <p className="inv-event-time"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/></svg><span>{event.eventTime||'--:--'} – {event.endTime||'--:--'} <abbr title={zoneName}>{zone}</abbr></span></p>
   </div>
   <InvitationLocation venue={event.venue} address={event.address} url={event.mapUrl} demo={demo}/>
   <div className="inv-event-actions"><button type="button" className="inv-button outline" disabled={!date} onClick={()=>setStatus(onDownload(event))}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true"><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M8 2v6m8-6v6M4 10h16m-8 3v5m-2.5-2.5h5"/></svg>Simpan tanggal</button></div>
   <p className="inv-event-status" role="status">{status}</p>
  </div>
 </li>;
}
