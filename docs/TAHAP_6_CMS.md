# Kastriva Invitation — Tahap 6 / v1.6.0

Tanggal paket: 24 September 2026. Basis: `Kastriva-Invitation-Tahap-5-v1.5.0.zip`.

**Kode CMS, katalog database, dan operasional admin telah ditambahkan. Belum diterapkan ke akun Diky. Build Next.js lengkap dan SQL/Supabase nyata belum terverifikasi.** Paket ini bukan bukti siap transaksi. Tidak ada deployment, pemasangan SQL, pengiriman pesan, atau perpindahan uang yang dilakukan penyusun.

## 1. Pemasangan dengan cadangan

Ekstrak ke folder baru. Simpan folder tahap 5. Salin `.env.local` Next.js tahap sebelumnya secara lokal hanya jika konfigurasinya sudah benar. Jangan menyalin environment Express, `node_modules`, `.next`, atau lockfile Express. Jangan kirim key, token, password, atau tautan tamu lengkap ke chat/GitHub.

Gunakan **Node 22.x**, buka PowerShell pada folder yang berisi `package.json`:

```powershell
node -v
if (!(Test-Path .env.local)) { Copy-Item .env.example .env.local }
npm install
npm test
npm run check:syntax
npm run typecheck
npm run build
```

Hentikan dan perbaiki bila install/typecheck/build gagal. Paket belum mempunyai lockfile tervalidasi karena registry npm tidak terjangkau saat penyusunan. Setelah instalasi serta pengujian berhasil, commit `package-lock.json` yang benar-benar dihasilkan dan gunakan `npm ci` berikutnya. Jangan mengganti semua dependensi menjadi `latest` atau mematikan typecheck untuk melewati error. Pin dependensi tetap sama dengan tahap 5; keberhasilan resolusi kombinasi paket belum dibuktikan melalui instalasi.

## 2. Migrasi database yang sama

Cadangkan dahulu proyek Supabase Invitation yang sama. Jangan menggunakan database aplikasi lain atau menghapus tabel. Coba pada staging khusus sebelum produksi.

| Kondisi | SQL yang dijalankan |
|---|---|
| 001–005 sudah berhasil dipasang | **Hanya `006_cms_operations.sql`.** |
| Sebagian migrasi belum dipasang | Lengkapi sesuai urutan lalu jalankan 006. |
| Proyek Invitation benar-benar baru | 001 → 002 → 003 → 004 → 005 → 006, masing-masing file lengkap. |

Lokasi: `supabase/migrations/006_cms_operations.sql`. Jangan menjalankan ulang 001–005 setelah 006, jangan downgrade source, dan jangan menonaktifkan RLS untuk mengatasi error. 006 menerima skema 5/6, memakai transaksi, menambah tiga tabel CMS dan urutan katalog. Script disertakan, **belum dieksekusi pada engine PostgreSQL oleh penyusun**.

Seed CMS mengambil **harga/nama/deskripsi/status yang sudah ada di database**, bukan mengembalikan semua harga ke JSON. Delapan slug asli harus tetap ada dan datanya harus valid. Data custom tidak valid, jumlah tema berubah, harga di luar batas atau deskripsi kosong dapat membuat migrasi ditolak dan rollback. Periksa data yang disebut error; jangan mereset tabel pelanggan. Re-run 006 pada versi 6 tidak dimaksudkan mereset draft/published, tetapi tetap uji di staging.

```sql
select public.ki_schema_version(); -- hasil yang diharapkan: 6
select revision, published_revision from public.ki_cms where id=1;
```

Tabel baru: `ki_cms`, `ki_cms_history`, `ki_cms_events`. RLS aktif, akses tabel langsung role browser ditutup. Fungsi admin memeriksa UID di `ki_admins` dan email terkonfirmasi. Pelanggan tidak dapat menjadi admin melalui metadata signup. Operator database/secret berhak tinggi tetap mempunyai kemampuan berbeda; batasi aksesnya.

## 3. Konfigurasi: tidak ada key atau flag baru

URL/key publik, email Auth, dan secret server foto dari tahap sebelumnya tetap dipakai. **Tidak ada secret baru untuk CMS.** Bucket `ki-media` tetap privat. Jangan meletakkan secret server di variabel `NEXT_PUBLIC_`.

Kontak publik sekarang diatur lewat **CMS → Brand & kontak**. Email dan WhatsApp pada seed CMS awal sengaja kosong. Nilai `NEXT_PUBLIC_CONTACT_EMAIL` dan `NEXT_PUBLIC_WHATSAPP_NUMBER` lama hanya menjadi fallback demo/gagal baca, bukan sumber kontak CMS live. Isi dan publish kontak yang benar sebelum meluncurkan situs.

Gerbang checkout, publikasi dan RSVP **tidak diaktifkan oleh 006**. Nilai `.env.example` tetap false. Mengaktifkan CMS bukan menyetujui pembayaran atau menerbitkan undangan pelanggan.

```powershell
npm run check:env
npm run check:supabase
npm run dev
```

Buka `http://localhost:3000/setup`, harus membaca skema 6. Status ini bukan bukti email/isolasi akun telah benar. Login admin dan periksa `/admin/sistem`; tes dua akun tahap sebelumnya tetap wajib. Halaman `/admin/cms` sendiri harus berhasil membaca draft/live/history.

## 4. Navigasi admin

| Halaman | Fungsi |
|---|---|
| `/admin/ringkasan` | Ringkasan pesanan, pernah diverifikasi, pelanggan pemesan, publikasi belum kedaluwarsa, dan yang berakhir dalam 7 hari. |
| `/admin` | Pesanan, filter status dan filter akun pelanggan. |
| `/admin/pelanggan` | Cari nama/email dan lihat pesanan pelanggan, 20 akun per halaman. |
| `/admin/cms` | Edit teks, kontak, SEO, dan metadata/harga delapan tema. |
| `/admin/cms/preview` | Preview privat **draft CMS tersimpan**, bukan perubahan formulir yang belum disimpan. |
| `/admin/transaksi` | Rekening, durasi layanan, gerbang checkout/publikasi yang sudah ada. |
| `/admin/tamu` | Gerbang RSVP platform; bukan membaca buku tamu seluruh pelanggan. |
| `/panduan#admin-cms` | Petunjuk CMS di dalam webapp. |

Daftar pelanggan hanya memuat akun **yang pernah membuat pesanan**. Nama/email mengikuti pesanan terbaru; ini bukan daftar seluruh akun Supabase. Draft pribadi, foto, buku tamu, dan ucapan privat tidak ditambahkan ke akses admin ini.

Akumulasi tagihan terverifikasi adalah nominal pesanan yang **pernah disetujui admin**, termasuk akses yang kemudian dicabut. Bukan saldo bank, laba bersih, kas masuk terkonfirmasi otomatis, atau laporan setelah refund. Hitungan publikasi tidak otomatis berarti URL terbuka jika gerbang layanan sedang ditutup. Perbarui halaman untuk mengambil data terbaru; bukan realtime push atau notifikasi otomatis.

## 5. Alur CMS yang disarankan

**Perbarui data server → Muat Published → edit → Preview isian → Simpan draft → Preview draft server → periksa harga/kontak → centang persetujuan → Publish website.**

`Muat Published` memakai salinan live yang terakhir dimuat halaman. Gunakan **Perbarui data server** untuk mengambil kondisi terbaru, terutama setelah konflik/tab lain berubah. Dialog memperingatkan penggantian edit yang belum disimpan. `Muat draft server` mengembalikan formulir ke draft terakhir dari pembacaan tersebut.

Simpan draft **manual**, tidak autosave. Draft CMS terpisah dari dokumen undangan pelanggan. Memuat Published, mengimpor JSON, memuat sejarah, atau melihat preview tidak langsung menyimpan/menerbitkan.

`Preview isian` mengikuti formulir saat ini. `Preview draft server` dibuka pada tab privat admin dan memakai draft tersimpan. Konten halaman depan menggunakan komponen yang sama, tetapi header/footer preview menampilkan ringkasan, bukan seluruh tampilan navigasi produksi. Periksa halaman publik, katalog, footer, metadata, dan harga setelah publish.

Publish memakai draft server dengan nomor versi yang cocok, **bukan JSON baru yang ikut dikirim saat publish**. Teks dan harga/status/urutan katalog diperbarui dalam satu transaksi database. Halaman publik mengambil data terbit dari server tanpa cache persisten aplikasi. Tab publik yang sudah terbuka tidak berubah otomatis: muat ulang penuh untuk memeriksa. Checkout memeriksa ulang kuotasi yang berubah.

## 6. Bagian yang dapat diedit

| Bagian CMS | Cakupan |
|---|---|
| Hero | Label, judul, aksen, deskripsi dan label dua tombol. Tujuan tombol tetap katalog/demo. |
| Tentang & keunggulan | Judul/deskripsi tentang dan 1–6 kartu manfaat. |
| Koleksi & cara kerja | Judul/deskripsi koleksi dan tepat tiga langkah. |
| FAQ | Judul serta 1–8 pertanyaan/jawaban. |
| CTA | Judul, deskripsi dan label tombol katalog. |
| Brand & kontak | Nama brand, subjudul, kalimat footer, email, WhatsApp, origin website utama. |
| SEO | Judul/deskripsi beranda dan izin indeks halaman pemasaran. |
| Tema & harga | Nama, deskripsi, harga IDR, urutan dan status tersedia untuk delapan slug yang sudah ada. |
| Riwayat | 20 publikasi terbaru, dapat dimuat sebagai draft. |

CMS menerima teks biasa, bukan HTML/JavaScript, CSS, atau embed bebas. Batas karakter ditampilkan pada isian. Emoji tertentu memakai dua unit karakter. Maksimal dokumen frontend 28 KB; salinan JSON maksimal 128 KB saat dimuat. Harga bilangan bulat Rp1.000–Rp100.000.000 merupakan batas teknis, bukan rekomendasi harga. WhatsApp memakai format `628...` tanpa tanda +/spasi. Website utama harus origin HTTPS, tidak boleh memakai path/query/port.

Tidak ada angka pelanggan, testimoni atau rating buatan yang dihasilkan CMS. Tulis hanya manfaat dan klaim bisnis yang benar. Gambar/logo/fon, struktur halaman, warna, nama slug, renderer tema dan teks kebijakan privasi/copyright tetap dalam source. CMS ini **bukan editor desain bebas** dan tidak membuat kategori/render baru.

## 7. Harga, tema nonaktif, dan pesanan lama

Katalog, halaman harga, halaman memilih tema, dan pilihan editor membaca metadata database. Checkout juga memakai database tersebut; perubahan saat tab checkout masih terbuka harus menghasilkan permintaan meninjau kuotasi ulang.

**Pesanan yang sudah dibuat mempertahankan harga, rekening, durasi dan nama tema snapshot-nya.** Ini berlaku juga pada pesanan menunggu pembayaran. Publish katalog tidak mengubah tagihan lama, masa aktif, atau salinan undangan publik.

Tema nonaktif hilang dari katalog/pilihan baru dan checkout baru ditutup. Draft lama tetap dapat memakai **tema sama milik pemiliknya**, dan undangan yang sudah dibeli/diterbitkan tidak otomatis dicabut. Memilih ulang tema yang sudah disembunyikan dari draft lain bukan hak otomatis. Jika tab lama mencoba memilih tema yang baru dinonaktifkan, server tetap memeriksa keabsahannya.

Lima tema pernikahan didukung editor/pembelian. Tiga kategori nonpernikahan tetap demo; mengaktifkannya di CMS tidak menciptakan editor atau checkout baru.

Jangan mengedit `data/templates.json` untuk mengubah harga live. File dipertahankan sebagai referensi/demo dan metadata visual. Saat backend terkonfigurasi tetapi gagal dibaca, **harga tidak diam-diam diganti angka JSON lama**; katalog ditandai tidak tersedia. Saat backend benar-benar kosong, mode demo memakai harga referensi dengan pemberitahuan.

## 8. Konflik, retry, riwayat dan backup

Mutasi dicatat di `sessionStorage` berdasarkan akun sebelum dikirim. Satu permintaan pada satu waktu. Timeout/5xx/balasan salah dianggap belum pasti; **Coba ulang permintaan yang sama** menggunakan ID dan payload asli. Jangan membuat tindakan baru sampai status jelas. Refresh tab yang sama dapat memulihkan permintaan tertunda, tetapi menutup tab/clear storage bisa menghilangkannya.

Penyimpanan sesi yang diblokir/penuh menahan pengiriman. Catatan dan salinan CMS tidak dienkripsi. Ketikan yang belum dikirim **tidak otomatis dipulihkan setelah refresh**, berbeda dari editor undangan tahap 3; simpan manual atau unduh JSON sebelum meninggalkan halaman. Backup hanya dapat dibuat untuk dokumen valid, jadi perbaiki isian sementara yang ditolak dulu.

Konflik versi tidak memaksa overwrite. Unduh perubahan → perbarui data server → cocokkan → simpan lagi. Perubahan harga melalui SQL di luar CMS dideteksi dengan sidik katalog dan ditolak pada simpan/publish yang memakai versi baca lama. `Muat Published` setelah pembacaan baru memasukkan katalog live ke formulir. Hindari perubahan SQL manual saat admin sedang bekerja.

Riwayat menyimpan versi terbit; UI menampilkan 20 terbaru. Memuat sejarah mengisi formulir saja. Untuk mengembalikan versi: tinjau harga lama/kontak → Simpan draft → Preview draft server → Publish. Ini menerbitkan versi baru, bukan menghapus jejak dan bukan rollback transaksi pelanggan.

Salinan JSON berisi konten situs dan metadata/harga tema, bukan akun, undangan, foto, token tamu, atau pesanan. Tidak menggantikan backup Supabase. Data tidak dienkripsi. Riwayat dan jurnal server belum dibersihkan otomatis; retensi/backup menjadi pekerjaan sebelum produksi.

## 9. SEO

Default izin indeks **false**. Setelah konten, hosting, layanan, dan privasi siap, aktifkan di tab SEO lalu publish. Metadata beranda/katalog/harga dan `robots.txt` menggunakan pengaturan yang sama. Akses crawlers dibuka hanya pada jalur pemasaran yang ditentukan beserta asetnya; admin, akun, demo dan undangan tamu tetap tidak ditawarkan untuk indeks. Robots/noindex tidak menjamin URL hilang dari indeks dan bukan kontrol akses.

Judul/deskripsi CMS tidak mengubah judul pada semua halaman secara bebas, tidak menjamin ranking, dan tidak memasang Analytics atau Search Console. Staging tetap memerlukan perlindungan akses yang sesuai. Penggantian domain/URL email masih menggunakan environment, bukan CMS website utama.

## 10. Pengujian sebelum rilis

Ikuti `UJI_CMS_TAHAP6.md` serta uji akun/editor/pembayaran/RSVP sebelumnya. Opsional SQL `supabase/tests/006_cms_integration.sql` hanya pada staging khusus sebagai postgres, **seluruh file BEGIN–ROLLBACK**. Script itu belum dijalankan penyusun. Jangan menghitungnya sebagai tes lulus hanya karena tersedia. Sequences dapat tetap maju; custom triggers dapat berjalan.

Belum ada paket Basic/Pro dengan kuota terpisah yang bisa diedit, editor desain baru, musik, hadiah, gateway/refund otomatis, QR check-in, WhatsApp blast, hapus akun, backup/retensi otomatis, kuota total akun, audit dependensi lengkap, uji beban atau rate-limit HTTP menyeluruh. CMS membatasi 30 mutasi admin per menit di database; itu bukan perlindungan DDoS.

**Tahap 7 perlu memprioritaskan instalasi/build sebenarnya, SQL staging, browser end-to-end dan pengamanan sebelum pelanggan nyata.** Source tahap 1–6 tidak berarti seluruh gerbang sudah lolos.

## Rujukan mekanisme

Diperiksa 24 September 2026; bukan bukti konfigurasi Diky atau keberhasilan tes aplikasi.
- https://supabase.com/docs/guides/database/functions
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://nextjs.org/docs/app/api-reference/functions/fetch
- https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
