# Browser CI fix v1.9.3

Hanya memperbarui E2E tests agar sesuai UI production:
- `e2e/public.spec.ts`: gunakan reduced motion + scroll ke section sebelum assertion/interaksi.
- `e2e/public-wishes.spec.ts`: klik `Tampilkan kode` sebelum membaca kode privat; consent=false tetap diuji sebagai pesan privat.

Tidak mengubah source production, Supabase, harga, tema, atau data pelanggan.
