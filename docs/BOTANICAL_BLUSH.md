# Botanical Blush

Second reviewed Elementor adaptation, based on `WTC 25.json` from the owner's WEB INVITATION PACK 2. The report in `data/imported/wtc-25.json` records its SHA-256, 102 nodes, seven sections, cream palette and Great Vibes headings. The web design adapts the cream paper, framing and floral arrangement; it is not a pixel-identical import. Original WordPress widgets, people, contact details and legacy links are not executed or copied into invitation data.

The peach rose comes from `POWER POINT WEDDING INVITATION/File Pendukung/Ornamen/rose-3416596_960_720.png`. Only this selected ornament is included, resized to a transparent WebP. The local pack's `License-terms.pdf` includes modification and sale rights; the original pack and license remain with the owner. No complete pack, source photos, commercial songs, personal-use fonts or unrelated files are republished. Great Vibes uses the existing self-hosted, OFL-licensed font; the existing optional instrumental supplies music.

`data/imported/botanical-blush-assets.json` records source/output checksums and dimensions. Reproduce with `node scripts/prepare-botanical-assets.mjs <File Pendukung folder>`. This processes only the named ornament, never traverses or imports the complete folder. Both source folders stay unchanged.

The shared artwork and stylesheet serve the catalog, editor, demo and public invitation. Cover photography uses the customer's own photo; empty photos use initials. Music, event Maps, gifts, gallery, RSVP and publication follow the existing controls, including reduced-motion support. Initial catalog price is Rp200.000, following the owner's current price convention.

Deploy the compatible 15-renderer application before applying `011_botanical_blush.sql`. The migration appends just this theme to the database and the independent draft/published CMS documents, preserves existing prices and unpublished text, and retains valid 8/13/14-theme history. It does not change privileges, feature gates, payments or customer publications. Verify demo, order entry, editor selection and CMS reads after activation.
