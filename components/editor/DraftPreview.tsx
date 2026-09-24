'use client';
import {useState} from 'react';
import Link from 'next/link';
import InvitationView from '@/components/InvitationView';
import {usePrivatePhotos} from './usePrivatePhotos';
import {safeGuest} from '@/lib/domain';
import type {DraftContent,Template} from '@/lib/types';
export default function DraftPreview({id,revision,content,template}:{id:string;revision:number;content:DraftContent;template:Template}){
 const {urls,error,reload}=usePrivatePhotos(content.photoPaths); const [guest,setGuest]=useState('Tamu Undangan');
 return <><section className="container preview-settings"><Link className="button ghost small" href={'/dashboard/undangan/'+id}>← Kembali ke editor</Link><span>Versi server {revision} · privat</span><label>Contoh nama tamu<input value={guest} maxLength={100} onChange={e=>setGuest(e.target.value)}/></label>{error&&<div role="status" className="notice error">{error}<button className="text-button" onClick={reload}>Muat ulang foto</button></div>}</section><InvitationView mode="draft" template={template} content={content} guest={safeGuest(guest)} photoUrls={content.photoPaths.map(path=>urls[path]).filter(Boolean)} coverUrl={urls[content.photoPaths[0]]||''}/></>;
}
