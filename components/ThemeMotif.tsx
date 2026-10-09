import {BlushRose} from './BotanicalBlushArtwork';
import {HeritageMotif} from './HeritageArtwork';
import {isHeritageTheme,isOccasionTheme,isPremiumEditionTheme} from '@/lib/theme-registry';
import {OccasionMotif} from './OccasionArtwork';
import {PremiumEditionMotif} from './PremiumEditionArtwork';
import {LuxuryRosette} from './ElementorLuxuryArtwork';
/** Decorative vector artwork, shared by catalog previews and invitation covers. */
export default function ThemeMotif({slug}:{slug:string}) {
 if(isPremiumEditionTheme(slug))return <PremiumEditionMotif slug={slug}/>;
 if(isOccasionTheme(slug))return <OccasionMotif slug={slug}/>;
 if(slug==='botanical-blush')return <BlushRose className="theme-motif"/>;
 if(isHeritageTheme(slug))return <HeritageMotif slug={slug}/>;
 if(slug==='elementor-luxury-1')return <LuxuryRosette className="theme-motif"/>;
 if(slug==='aurora-modern')return <svg className="theme-motif" viewBox="0 0 120 100" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true"><ellipse cx="60" cy="50" rx="39" ry="18" transform="rotate(-18 60 50)"/><ellipse cx="60" cy="50" rx="27" ry="39" transform="rotate(32 60 50)" strokeDasharray="3 5"/><circle cx="60" cy="50" r="9" fill="currentColor" fillOpacity=".08"/><path d="m60 34 3 10 10 3-10 3-3 10-3-10-10-3 10-3Zm31-17 2 6 6 2-6 2-2 6-2-6-6-2 6-2Z"/></svg>;
 const leaves=slug==='tropical-paradise'||slug==='rustic-wood';
 const rose=slug==='elegant-rose';
 return <svg className="theme-motif" viewBox="0 0 120 100" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
 {rose?<><path d="M60 69c-24-4-34-19-27-32 3-6 10-8 16-6 2-15 21-17 27-4 15-4 24 11 16 22-7 12-17 18-32 20Z" fill="currentColor" fillOpacity=".06"/><path d="M60 64c-16-6-23-14-18-24 5-8 15-6 19 1 9-12 23-7 22 5-1 9-10 16-23 18Zm0-2c-11-8-11-16-3-18 9-3 15 8 3 18ZM60 69v23M60 83C43 85 33 75 35 70c12-1 20 4 25 13Zm1-6c15 0 23-7 23-14-11 0-19 5-23 14Z"/></>:leaves?<><path d="M32 90C46 65 65 40 87 12"/><path d="M45 70C21 68 18 50 20 40c19 0 31 10 25 30Zm9-14C37 49 39 30 45 21c16 7 19 23 9 35Zm14-18C57 25 64 10 75 5c9 12 6 23-7 33ZM46 70c24 6 38-5 43-17-20-7-35 0-43 17Zm15-23c20 3 34-8 38-20-21-3-33 6-38 20Z" fill="currentColor" fillOpacity=".07"/><path d="m24 46 18 19m4-38 7 23m32 7-30 12m40-37-27 12" opacity=".5"/></>:slug==='galaxy-night'||slug==='aqiqah-blessing'?<><path d="M76 13A35 35 0 1 0 92 73 30 30 0 0 1 76 13Z" fill="currentColor" fillOpacity=".08"/><path d="m91 18 3 9 9 3-9 3-3 9-3-9-9-3 9-3Zm-8 33 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z"/></>:slug==='modern-minimalist'||slug==='corporate-event'?<><circle cx="48" cy="49" r="24"/><circle cx="73" cy="49" r="24"/><path d="M60 10v12m0 55v13M13 49h9m76 0h9"/><path d="m60 36 10 13-10 13-10-13Z" fill="currentColor" fillOpacity=".08"/></>:<><path d="M22 72h76M29 66l-9-34 25 17 15-29 15 29 25-17-9 34Z" fill="currentColor" fillOpacity=".07"/><path d="M35 79h50M60 8v5M9 25l5 4m97-4-5 4"/><circle cx="60" cy="57" r="4"/></>}
 </svg>;
}
