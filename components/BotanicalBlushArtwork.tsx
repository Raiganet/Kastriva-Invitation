import InvitationPhoto from './InvitationPhoto';
const ROSE='/images/themes/botanical-blush/peach-roses.webp';

/** One reviewed local ornament, shared by the catalog, editor and public renderer. */
export function BlushRose({className=''}:{className?:string}){
 return <img className={'blush-rose '+className} src={ROSE} width={720} height={488} alt="" aria-hidden="true" decoding="async" draggable={false}/>;
}
export default function BotanicalBlushArtwork({slug,portrait=false,photo,names}:{slug:string;portrait?:boolean;photo?:string;names?:string[]}){
 if(slug!=='botanical-blush')return null;
 if(portrait)return <div className="blush-portrait"><div className="blush-portrait-window"><InvitationPhoto src={photo} alt="Foto sampul pasangan" initials={(names||[]).map(name=>Array.from(name.trim())[0]).filter(Boolean).join(' · ')} className="blush-portrait-image"/></div><BlushRose className="blush-portrait-rose"/></div>;
 return <div className="blush-scene" aria-hidden="true"><span className="blush-paper-frame"/><BlushRose className="blush-corner blush-top"/><BlushRose className="blush-corner blush-bottom"/></div>;
}
