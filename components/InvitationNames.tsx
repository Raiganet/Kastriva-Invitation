/** Keep the full names readable by assistive technology while arranging the display. */
export default function InvitationNames({groom,bride,wedding}:{groom:string;bride:string;wedding:boolean}){
 const first=groom.trim(),second=bride.trim();
 const label=[first,second].filter(Boolean).join(' & ')||'Nama pasangan';
 return <h1 className={wedding&&first&&second?'inv-names inv-names-pair':'inv-names'} aria-label={label}>
  {wedding&&first&&second?<span className="inv-names-layout" aria-hidden="true"><span className="inv-name-first">{first}</span><span className="inv-name-join">&</span><span className="inv-name-second">{second}</span></span>:label}
 </h1>;
}
