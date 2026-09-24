# Menghubungkan Supabase — lakukan setelah tampilan lokal lolos uji

Belum ada perubahan dilakukan pada akun Supabase Diky. SQL dan konfigurasi di bawah disiapkan, tetapi **belum dieksekusi terhadap Supabase nyata** oleh penyusun.

## 1. Proyek khusus

Gunakan proyek kosong khusus Kastriva Invitation, jangan jalankan pada database aplikasi Kastriva lain. Catat project URL dan publishable key. Password database dan `sb_secret_…`/`service_role` bukan nilai untuk `NEXT_PUBLIC_*`.

Buka SQL Editor, salin seluruh isi `supabase/migrations/001_foundation.sql`, lalu jalankan satu kali. Skrip membuat 6 tabel berawalan `ki_`, 8 tema, fungsi RPC, kebijakan RLS, dan bucket `ki-media` privat. Tidak ada DROP/TRUNCATE. Jika gagal, jangan menganggap migrasi setengah jadi sudah benar; baca pesan error, jangan membuka pemesanan, dan kirimkan pesan error tanpa secret.

Cek tabel `ki_settings`: baris id=1 harus `accept_order_requests=false`. Bucket `ki-media` harus PRIVATE. Periksa policy lain pada proyek: policy permisif tambahan dapat membuka akses meskipun skrip ini memasang policy pemilik.

Skrip awal bersifat create-if-not-exists; bukan alat untuk membetulkan schema/policy asing yang sudah ada. Perubahan schema selanjutnya sebaiknya melalui migrasi baru, bukan terus menjalankan ulang seed.

## 2. Environment lokal

Pada `.env.local`:

```dotenv
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT-ANDA.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=ISI_PUBLISHABLE_KEY
ENABLE_ORDER_REQUESTS=false
NEXT_PUBLIC_WHATSAPP_NUMBER=
NEXT_PUBLIC_CONTACT_EMAIL=
```

Email/WhatsApp boleh kosong sampai Diky mengisi kontak yang benar. Nomor WhatsApp memakai awalan 62 tanpa tanda +/spasi. Anon key JWT lama didukung melalui `NEXT_PUBLIC_SUPABASE_ANON_KEY` apabila proyek masih menggunakannya; jangan isi dengan service-role.

Jalankan `npm run check:env`. PASS berarti format/key diperiksa, **bukan** bukti koneksi database berhasil. Restart dev server setelah menyunting environment.

## 3. Pengaturan Auth dan email

Di Authentication, aktifkan provider email dan konfirmasi email. Sesuaikan kebijakan password minimal 12 karakter dengan UI. Untuk pengguna nyata, konfigurasi pengiriman email/SMTP dan pembatasan Auth sesuai layanan. Jangan menganggap email berhasil diterima hanya karena form selesai.

Site URL lokal: `http://localhost:3000`. Izinkan redirect di origin yang benar:

```text
http://localhost:3000/auth/confirm**
http://localhost:3000/auth/callback**
```

Untuk deployment, tambahkan origin HTTPS aplikasi milik Diky dengan jalur yang sama, bukan wildcard semua domain. Set `NEXT_PUBLIC_SITE_URL` sama dengan origin tersebut dan restart/redeploy. Gunakan proyek staging dan URL yang sesuai saat menguji preview, jangan mengarahkan recovery staging ke situs produksi.

### Template email yang sesuai handler ini

Aplikasi mengirim `RedirectTo` yang sudah memiliki `?type=email&next=...` untuk daftar dan `?type=recovery` untuk lupa password. Pada template **Confirm sign up** dan **Reset password**, contoh link yang mendukung verifikasi token hash:

```html
<h2>Kastriva Invitation</h2>
<p>Lanjutkan permintaan akun Anda melalui tautan berikut.</p>
<p><a href="{{ .RedirectTo }}&amp;token_hash={{ .TokenHash }}">Lanjutkan ke Kastriva</a></p>
<p>Abaikan email ini bila Anda tidak mengajukan permintaan.</p>
```

Jangan menambahkan token ke link sembarang: contoh ini untuk permintaan yang dibuat aplikasi ini dan redirect origin yang sudah diizinkan. Handler `/auth/confirm` memvalidasi `type` hanya email/recovery. Link default Supabase yang kembali membawa PKCE `code` juga ditangani; PKCE perlu verifier browser tempat permintaan dibuat. Uji signup dan recovery sampai selesai, termasuk kedaluwarsa/penggunaan ulang link. Jangan membagikan link email karena memuat token.

Dokumentasi resmi: https://supabase.com/docs/guides/auth/auth-email-templates dan https://supabase.com/docs/guides/auth/redirect-urls

## 4. Membuat admin tanpa password bawaan

Daftarkan akun Diky melalui aplikasi, konfirmasi email, lalu temukan **User UID** milik Diky di Authentication → Users. Hanya pemilik proyek/trusted operator yang menjalankan SQL ini; ganti UUID contoh dengan UID yang benar:

```sql
insert into public.ki_admins(user_id)
values ('GANTI-DENGAN-USER-UUID-DIKY'::uuid)
on conflict (user_id) do nothing;
```

Contoh sengaja bukan UUID valid agar tidak salah memberi akses kepada akun lain. Tidak perlu memberi `role: admin` dari form signup atau metadata pengguna. Setelah itu, login lalu buka `/admin`.

Pencabutan akses administratif, hanya bila benar-benar diperlukan:

```sql
-- Ganti UID dengan akun yang akses adminnya ingin dicabut.
delete from public.ki_admins
where user_id = 'GANTI-DENGAN-USER-UUID'::uuid;
```

## 5. Uji dua akun sebelum membuka permintaan

Ikuti `UJI_MANUAL.md`. Akun A tidak boleh membaca/menyimpan draft akun B, walaupun ID ditebak/diketahui. Foto A tidak boleh dibaca B. Akun biasa tidak boleh menjadi admin lewat metadata atau request. Tidak cukup melihat hanya satu akun berhasil.

Setelah pengujian berhasil dan proses bantuan manual siap, permintaan opsional memerlukan **dua sakelar**:

```sql
update public.ki_settings set accept_order_requests=true where id=1;
```

```dotenv
ENABLE_ORDER_REQUESTS=true
```

Flag database tetap otoritatif untuk RPC langsung; flag server menyembunyikan/menolak fitur dari aplikasi. Membuka keduanya hanya menerima PERMINTAAN PENGERJAAN, bukan pembayaran atau publikasi. Mematikan database flag menutup RPC sekalipun deployment belum diperbarui. Batas draft 20/akun; satu permintaan per draft; pembatalan tidak otomatis mengizinkan permintaan baru untuk draft yang sama.

## 6. Storage dan penghapusan

Bucket dibuat privat dengan batas 5 MB per objek serta MIME JPEG/PNG/WebP. Editor mengubah gambar ke WebP dan membatasi 6 foto per draft. Validasi gambar di browser bisa dilewati pengguna teknis; sebelum produksi tambahkan verifikasi server, kuota total akun, dan perlindungan penyalahgunaan.

Melepas foto dari draft belum menghapus berkas Storage. Lakukan cleanup terkontrol oleh pengelola setelah memastikan berkas tidak dipakai. Fitur hapus akun, retensi, dan backup belum otomatis. Tabel order mempunyai relasi ke draft: penghapusan administratif perlu memperhatikan urutan/relasi dan media, jangan sekadar menghapus akun lalu menganggap semua file ikut hilang.
