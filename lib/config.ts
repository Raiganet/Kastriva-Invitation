export const site = {
  name: 'Kastriva Invitation', company: 'Kastriva', companyUrl: 'https://www.kastriva.web.id',
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || '',
  whatsapp: /^62\d{8,13}$/.test(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '') ? process.env.NEXT_PUBLIC_WHATSAPP_NUMBER! : '',
};
export function siteUrl() {
  try { const url = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'); if (!['https:','http:'].includes(url.protocol)) throw new Error(); return url.origin; }
  catch { return 'http://localhost:3000'; }
}
export function publicBackend() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!url || !key || key.startsWith('sb_secret_')) return null;
  try { const u = new URL(url); if (u.protocol !== 'https:' || u.username || u.password || u.search || u.hash || u.pathname !== '/') return null; } catch { return null; }
  // Reject accidentally pasted legacy service_role keys from NEXT_PUBLIC_*.
  if (key.split('.').length === 3) {
    try { const raw = key.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'); const parsed = JSON.parse(atob(raw)); if (parsed.role !== 'anon') return null; } catch { return null; }
  } else if (!key.startsWith('sb_publishable_') || key.length <= 'sb_publishable_'.length || /\s/.test(key)) return null;
  return { url, key };
}
