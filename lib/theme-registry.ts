/** Renderer identities are code-owned; CMS controls their public metadata and prices. */
export const LEGACY_THEME_SLUGS=['elegant-rose','modern-minimalist','tropical-paradise','rustic-wood','galaxy-night','sweet-birthday','aqiqah-blessing','corporate-event'] as const;
export const HERITAGE_THEME_SLUGS=['islami-sakinah','adat-sunda','adat-minang','adat-jawa','adat-bali'] as const;
export const ALL_THEME_SLUGS=[...LEGACY_THEME_SLUGS,...HERITAGE_THEME_SLUGS] as const;
export const WEDDING_THEME_SLUGS:readonly string[]=[...LEGACY_THEME_SLUGS.slice(0,5),...HERITAGE_THEME_SLUGS];
export function isHeritageTheme(slug:string){return (HERITAGE_THEME_SLUGS as readonly string[]).includes(slug);}
