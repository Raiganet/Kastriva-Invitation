> **Riwayat tahap sebelumnya.** Untuk pemasangan sekarang gunakan `UPGRADE_v1.8.0.md`: schema dasar tetap 7, fitur008–011 dan diagnostik012. Jangan memakai nomor versi atau keterangan fitur lama di bawah untuk downgrade.

# Upgrade v1.4.0 → v1.5.0

1. Cadangkan source dan database; ekstrak ke folder baru. Gunakan konfigurasi Next.js proyek yang sama.
2. Tambahkan `ENABLE_RSVP=false`. Secret/URL/key lama tidak diganti dan tidak dibagikan.
3. Install → test → syntax → typecheck → build harus berhasil.
4. Jika001–004 sudah terpasang, jalankan `supabase/migrations/005_guestbook_rsvp.sql` saja. Jangan reset/mengulang migrasi lama.
5. `/setup` dan `/admin/sistem` harus membaca skema5. Uji ulang akun/editor/pesanan/publication.
6. Aktivasi staging: ENABLE_RSVP dan ENABLE_PUBLIC_INVITATIONS true; `/admin/tamu` database enabled; pemilik buka Terima RSVP. Paid/published/expiry tetap wajib.
7. Ikuti `UJI_TAMU_TAHAP5.md`. Jangan membuka pelanggan nyata dari hasil unit saja.

Tidak ada perubahan harga/rekening/masaaktif otomatis, tidak ada import database pelanggan, tidak ada deployment oleh penyusun. Detail utama di `TAHAP_5_TAMU_RSVP.md`.
