/** Asset-only branding patch. No API, environment, or customer data dependencies. */
export const BRAND_ASSETS = {
  horizontal: '/brand/crest-v1/logo-horizontal.webp',
  emblem: '/brand/crest-v1/emblem.webp',
  favicon16: '/brand/crest-v1/favicon-16x16.png',
  favicon32: '/brand/crest-v1/favicon-32x32.png',
  apple: '/brand/crest-v1/apple-touch-icon.png',
} as const;

/** Do not freeze a custom CMS brand name into a picture of the default wordmark. */
export function usesKastrivaWordmark(brandName: string, tagline: string): boolean {
  const name = brandName.trim().toLowerCase().replace(/\s+/g, ' ');
  return (name === 'kastriva' || name === 'kastriva invitation' || name === 'kastriva-invitation')
    && tagline.trim().toLowerCase() === 'invitation';
}

export function brandHomeLabel(brandName: string, tagline: string): string {
  const name = brandName.trim();
  const tag = tagline.trim();
  const title = tag && !name.toLowerCase().endsWith(tag.toLowerCase()) ? `${name} ${tag}` : name;
  return `${title || 'Kastriva Invitation'} — Beranda`;
}
