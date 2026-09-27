# Cinematic invitation, music, and gifts

Galaxy Night uses a black/gold portrait layout inspired by the reference supplied by the owner. Uploaded cover photos fill both cover and hero; customer pictures are never substituted by the demo asset. Story paragraphs separated by blank lines form timeline chapters; a leading `2024 —` supplies the year.

Apply `008_invitation_extras.sql` after 001–007, before deploying the editor. It replaces two existing validators, preserves their permissions, and validates synthetic documents inside the same transaction. It does not update customer data, grants, RLS, or schema capability 7.

Optional `music` is `none` or `serenade`. Optional `gifts` contains at most three `{bank, account, holder}` objects. Numbers remain strings, including leading zeroes. Partial accounts are allowed in private drafts but rejected when publishing. Published accounts are part of the existing consented public snapshot; checkout bank details remain independent. QRIS and uploaded songs are not implemented.

Serenade is an original eight-bar instrumental synthesized locally with Web Audio. Audio starts only from the opening/music button. Pausing, leaving the tab, changing the selection, expiration, or unmounting closes the audio context. There are no external music requests.

## Demo asset provenance

`public/images/galaxy-garden.webp` was generated with the built-in ImageGen tool and optimized to WebP. The original generation was saved under the local Codex generated-images directory. It is a fictional wedding setting, not a customer photograph.

Prompt: “Use case: photorealistic-natural. Asset type: portrait background photo for a premium black and antique-gold Indonesian wedding invitation website demo. Generate an editorial photograph of an elegant wedding setting at twilight: a graceful arch in a historic garden, ivory roses and restrained gold details at the edges, softly illuminated candles along the aisle, moody charcoal background and warm champagne highlights. No people. Vertical 2:3 framing, spacious calm darker central region suitable for white wedding names and invitation text overlaid later in HTML. Real photographic textures, subtle film grain, refined romantic mood, realistic lighting. Not a website mockup, no text, no letters, no watermark, no logos, no borders embedded in the photo.”
