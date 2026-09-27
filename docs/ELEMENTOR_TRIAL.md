# Elementor pilot: LUXURY 1

The owner's Elementor 0.4 export is inspected at build/development time. The first converted theme is **Luxury Emerald** (`elementor-luxury-1`). The owner approved its initial Rp200.000 price. After migration 010 it is available in the public catalog, customer editor, checkout, and publication renderer. The sandbox at `/admin/tema/elementor` still requires admin authentication and never saves or creates orders.

`data/imported/luxury-1.json` records the source SHA-256, 77 nodes, six widget types, seven sections, 24 image references, palette and heading font. The original file and complete PLR pack are kept outside the repository. Run `node --experimental-strip-types scripts/inspect-elementor.mjs <source.json> <report.json>` to inspect another export. This is an inventory tool and one reviewed native adaptation, not a general Elementor renderer or bulk importer.

The source has `#002420` background, `#EFA947` accent and Great Vibes headings. On 27 September 2026 the referenced `demo.ucapanspesial.com` asset host failed DNS resolution. Its raster ornaments were therefore reconstructed in SVG from the supplied preview. There are no runtime requests to that host. Original couple photographs are replaced by initials or a local user-selected photograph. The conversion is not pixel-identical to the original pack.

Maps, dates, story, gallery, music and gift UI use Kastriva components. Legacy dates, addresses, health-protocol notices, author footer, WordPress widgets, shortcodes, embedded HTML and scripts are not imported into customer data. Unsupported widgets are reported. JSON values are never treated as executable code or arbitrary CSS/HTML. The source is capped at 4 MB in the CLI and the walker limits depth and node count.

The preview accepts local names, guest, date, venue/address, Maps link, optional photo and music toggle. It does not persist or submit these values. Blob photo URLs are revoked when replaced or on unmount. Public RSVP uses only the existing demo simulation. Purchase links are suppressed inside this sandbox. The public demo uses the normal customer path. Schema capability, RLS, payment checks, private photos and publication consent requirements are unchanged.

Great Vibes is self-hosted from Google Fonts (`google/fonts`, `ofl/greatvibes/GreatVibes-Regular.ttf`), with the original SIL Open Font License saved alongside it. The owner's `License-terms.pdf` is retained in the original pack; no raw JSON pack or source raster photos are republished.

Validate the parser tests, production build, admin access, mobile cover, long-name wrapping, local-photo replacement, Maps validation, opening/replay, music control, gift disclosure and Escape/fullscreen behavior before rollout.

## Release order

1. Deploy code that supports all 14 renderer identities and reads exact historical 8- and 13-theme CMS documents.
2. Apply `010_luxury_emerald.sql` after migration 009. It adds one catalog row at Rp200.000 and appends its metadata to the current draft/published CMS documents without publishing unrelated draft edits. Existing orders, prices and access settings are preserved. Repeating the migration leaves current prices intact.
3. Verify the public demo `/demo/elementor-luxury-1`, order entry, editor dropdown and CMS. The shared stylesheet is imported by the root layout so public requests do not depend on visiting the admin preview first.

Historical backups merge missing renderer metadata from the live catalog. SQL rejects an old/partial generation when saving after expansion. Old invitation and order content is not migrated or republished.
