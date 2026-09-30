/** Renderer identities are code-owned; CMS controls their public metadata and prices. */
export const LEGACY_THEME_SLUGS=['elegant-rose','modern-minimalist','tropical-paradise','rustic-wood','galaxy-night','sweet-birthday','aqiqah-blessing','corporate-event'] as const;
export const HERITAGE_THEME_SLUGS=['islami-sakinah','adat-sunda','adat-minang','adat-jawa','adat-bali'] as const;
export const HERITAGE_CATALOG_SLUGS=[...LEGACY_THEME_SLUGS,...HERITAGE_THEME_SLUGS] as const;
export const LUXURY_CATALOG_SLUGS=[...HERITAGE_CATALOG_SLUGS,'elementor-luxury-1'] as const;
export const BOTANICAL_CATALOG_SLUGS=[...LUXURY_CATALOG_SLUGS,'botanical-blush'] as const;
export const IMPORTED_THEME_SLUGS=['elementor-luxury-1','botanical-blush','aurora-modern'] as const;
export const ALL_THEME_SLUGS=[...BOTANICAL_CATALOG_SLUGS,'aurora-modern'] as const;
/** Only complete historical generations are valid backups; arbitrary subsets are not. */
export const CMS_CATALOG_GENERATIONS:readonly (readonly string[])[]=[LEGACY_THEME_SLUGS,HERITAGE_CATALOG_SLUGS,LUXURY_CATALOG_SLUGS,BOTANICAL_CATALOG_SLUGS,ALL_THEME_SLUGS];
export const WEDDING_THEME_SLUGS:readonly string[]=[...LEGACY_THEME_SLUGS.slice(0,5),...HERITAGE_THEME_SLUGS,...IMPORTED_THEME_SLUGS];
export function isHeritageTheme(slug:string){return (HERITAGE_THEME_SLUGS as readonly string[]).includes(slug);}
