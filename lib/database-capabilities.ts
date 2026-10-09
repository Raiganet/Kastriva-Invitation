/** Public diagnostics return booleans/counts only, never customer data or secret values. */
import contract from '../data/database-contract.json' with { type: 'json' };
import { ALL_THEME_SLUGS } from './theme-registry.ts';
import type { ReadinessCheck } from './readiness.ts';
export const BASE_SCHEMA_VERSION = contract.baseSchemaVersion;
export const CAPABILITY_PROTOCOL = contract.capabilityProtocol;
export const DIAGNOSTICS_MIGRATION = contract.diagnosticsMigration;
export const CAPABILITY_DEFINITIONS = [
  { key: 'legacy_content', label: 'Kompatibilitas draft lama', fix: 'Periksa validator konten dan urutan migrasi 001–008.' },
  { key: 'invitation_extras', label: 'Musik & amplop digital (008)', fix: 'Periksa 008_invitation_extras.sql dan validator musik/hadiah.' },
  { key: 'heritage_themes', label: 'Tema Islami & adat (009)', fix: 'Periksa 009_heritage_themes.sql; jangan menjalankan ulang migrasi lama setelah versi lebih baru.' },
  { key: 'luxury_theme', label: 'Luxury Emerald (010)', fix: 'Periksa 010_luxury_emerald.sql dan keberadaan tema di katalog database.' },
  { key: 'botanical_theme', label: 'Botanical Blush (011)', fix: 'Periksa 011_botanical_blush.sql dan keberadaan tema di katalog database.' },
  { key: 'aurora_premium_music', label: 'Aurora Luxe Motion & koleksi musik (016)', fix: 'Periksa 016_aurora_premium_music.sql, katalog Aurora, dan validator pilihan musik.' },
  { key: 'cms_catalog_complete', label: `CMS dan registry ${ALL_THEME_SLUGS.length} tema`, fix: 'Periksa katalog, validator CMS, dokumen draft/published, dan migrasi occasion_collection. Tema nonaktif tetap dihitung; jangan mereset harga.' },
] as const;
type CapabilityKey = typeof CAPABILITY_DEFINITIONS[number]['key'];
export type FeatureReadiness = {
  contract_version: number; base_schema_version: number; diagnostics_migration: number;
  known_templates: number; capabilities: Record<CapabilityKey, boolean>;
};
function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
export function parseFeatureReadiness(raw: unknown): FeatureReadiness | null {
  if (!record(raw) || raw.contract_version !== CAPABILITY_PROTOCOL || raw.base_schema_version !== BASE_SCHEMA_VERSION
    || raw.diagnostics_migration !== DIAGNOSTICS_MIGRATION || !Number.isInteger(raw.known_templates)
    || (raw.known_templates as number) < 0 || (raw.known_templates as number) > ALL_THEME_SLUGS.length
    || !record(raw.capabilities)) return null;
  const capabilities = {} as Record<CapabilityKey, boolean>;
  for (const { key } of CAPABILITY_DEFINITIONS) {
    if (typeof raw.capabilities[key] !== 'boolean') return null;
    capabilities[key] = raw.capabilities[key];
  }
  // Projection deliberately excludes unrecognized upstream data.
  return { contract_version: CAPABILITY_PROTOCOL, base_schema_version: BASE_SCHEMA_VERSION,
    diagnostics_migration: DIAGNOSTICS_MIGRATION, known_templates: raw.known_templates as number, capabilities };
}
export function featureChecks(raw: unknown): ReadinessCheck[] {
  const data = parseFeatureReadiness(raw);
  const checks: ReadinessCheck[] = [{ id: 'feature_audit', label: 'Diagnostik fitur (012)', state: data ? 'pass' : 'fail',
    detail: data ? 'Kontrak diagnostik terbaca. Kemampuan diuji secara baca-saja; ini bukan catatan seluruh migrasi pernah dijalankan.'
      : 'Diagnostik belum tersedia atau balasannya tidak sesuai. Ikuti panduan upgrade sampai 016_aurora_premium_music.sql; jangan menganggap skema dasar 7 sudah mencakup semua fitur.' }];
  for (const {key,label,fix} of CAPABILITY_DEFINITIONS) {
    const ok = data?.capabilities[key] === true && (key !== 'cms_catalog_complete' || data.known_templates === ALL_THEME_SLUGS.length);
    checks.push({ id: key, label, state: ok ? 'pass' : 'fail', detail: ok
      ? key === 'cms_catalog_complete' ? `${data!.known_templates} identitas tema tersedia, termasuk tema yang sengaja dinonaktifkan. Harga dan status pesanan tidak diubah.`
        : 'Kemampuan terdeteksi oleh pemeriksaan database. Perilaku akun dan browser tetap perlu diuji.'
      : data ? fix : 'Belum dapat diverifikasi sebelum diagnostik fitur berhasil.' });
  }
  return checks;
}
export function activeCatalogCheck(raw: unknown): ReadinessCheck {
  const base = { id: 'catalog', label: 'Katalog yang terlihat pengunjung' };
  if (!Array.isArray(raw) || raw.length > ALL_THEME_SLUGS.length) return { ...base, state: 'fail', detail: 'Balasan katalog tidak sesuai registry aplikasi. Periksa Data API dan versi kode.' };
  const slugs = raw.map(row => record(row) ? row.slug : null);
  const valid = slugs.every(slug => typeof slug === 'string' && (ALL_THEME_SLUGS as readonly string[]).includes(slug))
    && new Set(slugs).size === slugs.length;
  if (!valid) return { ...base, state: 'fail', detail: 'Identitas tema tidak dikenal atau terduplikasi. Data tidak diganti dengan katalog contoh.' };
  return { ...base, state: slugs.length ? 'pass' : 'warn', detail: slugs.length
    ? `${slugs.length} tema aktif terbaca dari database. Tema nonaktif tidak dianggap hilang; checkout memeriksa harga database kembali.`
    : 'Tidak ada tema aktif. Ini dapat merupakan pengaturan CMS yang disengaja, bukan kegagalan migrasi. Aktifkan tema sebelum menguji pesanan baru.' };
}
