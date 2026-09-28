# Final Browser CI Fix v1.9.3

Patch ini hanya mengganti `e2e/public.spec.ts`.

Perubahan:
- Test semua tema mengenali heading Elementor Luxury yang memiliki dekorasi CSS `✧` pada accessible name.
- Test demo memastikan `.inv-content` sudah terbuka, bukan bergantung pada scroll-reveal.
- Test simulasi RSVP memakai selector form/nama field yang stabil dan `selectOption(..., {force:true})` untuk menguji perilaku form, bukan pointer actionability.

Tidak mengubah source production, Supabase, harga, tema, atau data pelanggan.
