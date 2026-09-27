import type {DraftContent} from './types.ts';
import {invitationEvents,safeGuest} from './domain.ts';

/** Only approved public names and the first event date belong in link previews. */
export function invitationShareText(content:DraftContent){
 const names=[content.groom,content.bride].map(n=>n.trim()).filter(Boolean).join(' & ');
 const date=invitationEvents(content)[0]?.eventDate;
 const parsed=date?new Date(date+'T12:00:00Z'):null;
 const label=parsed&&Number.isFinite(parsed.valueOf())?parsed.toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}):'';
 return {title:('Undangan '+names).slice(0,150),description:[label,'Dengan bahagia, kami mengundang Anda untuk hadir. Buka undangan untuk melihat detail acara.'].filter(Boolean).join(' · ')};
}

/** Compose from the published snapshot, never from unpublished draft edits. */
export function invitationMessage(content:DraftContent,url:string,guest=''){
 const recipient=guest.replace(/[\u0000-\u001f]/g,'').trim()?safeGuest(guest):'Bapak/Ibu/Saudara/i';
 const preview=invitationShareText(content);
 return `Kepada Yth. ${recipient}\n\n${preview.title}\n${preview.description}\n\n${url}\n\nMerupakan kebahagiaan bagi kami apabila Anda berkenan hadir. Terima kasih.`;
}
