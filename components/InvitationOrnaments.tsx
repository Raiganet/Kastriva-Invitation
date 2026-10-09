import ThemeMotif from './ThemeMotif';
import InvitationCornerArtwork from './InvitationCornerArtwork';

type OrnamentStyle = 'floral' | 'palm' | 'wheat' | 'celestial' | 'celebration' | 'geometric' | 'lattice' | 'orbit';

const styles: Record<string, OrnamentStyle> = {
  'elegant-rose': 'floral',
  'modern-minimalist': 'geometric',
  'tropical-paradise': 'palm',
  'rustic-wood': 'wheat',
  'galaxy-night': 'celestial',
  'sweet-birthday': 'celebration',
  'aqiqah-blessing': 'celestial',
  'corporate-event': 'geometric',
  'islami-sakinah': 'lattice',
  'adat-sunda': 'floral',
  'adat-minang': 'lattice',
  'adat-jawa': 'lattice',
  'adat-bali': 'floral',
  'elementor-luxury-1': 'geometric',
  'botanical-blush': 'floral',
  'aurora-modern': 'orbit',
};

/** Local vector artwork. Kept outside the text flow and hidden from assistive technology. */
export default function InvitationOrnaments({slug,section=false}: {slug: string;section?:boolean}) {
  const style = styles[slug] ?? 'floral';
  return <div className={`inv-ornaments inv-ornaments-${style}${section?' inv-ornaments-section':''}`} data-ornament-theme={slug} aria-hidden="true">
    <span className="inv-ornament-corner inv-ornament-start"><InvitationCornerArtwork slug={slug}/></span>
    <span className="inv-ornament-corner inv-ornament-end"><InvitationCornerArtwork slug={slug}/></span>
    <span className="inv-ornament-speck speck-a"/><span className="inv-ornament-speck speck-b"/><span className="inv-ornament-speck speck-c"/>
  </div>;
}

export function InvitationDivider({slug}: {slug: string}) {
  return <div className="inv-section-divider" aria-hidden="true"><span/><ThemeMotif slug={slug}/><span/></div>;
}
