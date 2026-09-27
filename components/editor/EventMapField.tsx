'use client';
import {useId} from 'react';
import {googleMapsSearch,mapLink} from '@/lib/maps';

export default function EventMapField({value,venue,address,onChange}:{value:string;venue:string;address:string;onChange:(value:string)=>void}) {
 const hintId=useId(),link=mapLink(value),invalid=!!value.trim()&&!link.href;
 return <section className="editor-map-field">
  <div className="editor-map-heading"><h3>Pin lokasi Google Maps</h3><a className="text-link" href={googleMapsSearch(venue,address)} target="_blank" rel="noopener noreferrer">Cari lokasi ↗</a></div>
  <p>Buka lokasi yang tepat di Google Maps, pilih <strong>Bagikan → Salin link</strong>, lalu tempel di bawah.</p>
  <label>Link Google Maps<input type="url" value={value} maxLength={1000} inputMode="url" autoCapitalize="none" autoComplete="off" spellCheck={false} placeholder="https://maps.app.goo.gl/…" aria-describedby={hintId} aria-invalid={invalid||undefined} onChange={e=>onChange(e.target.value)} onBlur={()=>{if(value!==value.trim())onChange(value.trim());}}/></label>
  <p id={hintId} className={invalid?'map-field-error':'editor-hint'}>{invalid?'Gunakan link lengkap yang diawali https://, bukan kode iframe atau teks alamat.':'Akad dan resepsi dapat memakai link lokasi yang berbeda. Nama tempat dan alamat tetap diisi pada kolom di atas.'}</p>
  {link.href&&<div className="map-field-check"><a className="button ghost small" href={link.href} target="_blank" rel="noopener noreferrer">Periksa titik lokasi ↗</a><small>Buka link untuk memastikan pin sudah benar. Simpan draft, lalu terbitkan versi terbaru agar tamu melihat perubahan.</small></div>}
 </section>;
}
