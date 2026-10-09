/** Keep the full names readable by assistive technology while arranging the display. */
export default function InvitationNames({groom,bride,wedding,as:Heading='h1'}:{groom:string;bride:string;wedding:boolean;as?:'h1'|'h2'}){
 const first=groom.trim(),second=wedding?bride.trim():'';
 const label=[first,second].filter(Boolean).join(' & ')||(wedding?'Nama pasangan':'Nama acara');
 const length=Math.max(first.length,second.length);
 const long=length>18;
 const extended=length>36;
 return <Heading className={`inv-names${wedding&&first&&second?' inv-names-pair':''}${length<=10?' inv-names-short':''}${long?' inv-names-long':''}${extended?' inv-names-extended':''}`} aria-label={label}>
  <span className="inv-names-layout" aria-hidden="true">{wedding&&first&&second?<><span className="inv-name-first">{first}</span><span className="inv-name-join">&</span><span className="inv-name-second">{second}</span></>:<span className="inv-name-first">{label}</span>}</span>
 </Heading>;
}
