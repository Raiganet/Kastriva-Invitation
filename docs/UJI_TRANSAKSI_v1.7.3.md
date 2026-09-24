# Uji browser staging — v1.7.3

**Belum dijalankan penyusun.** Memerlukan dependensi, build, akun staging, dan skema 7 yang benar. Gunakan fixture/pesanan uji, bukan uang atau data pelanggan. Jangan membuka aturan Auth/RLS atau mengubah secret untuk membuat tes lolos.

1. Checkout dari draft tersimpan. Klik cepat dua kali; periksa bahwa backend hanya menghasilkan satu pesanan. Cetak dan muat ulang statusnya.
2. Pada DevTools/interception staging, tunda respons tindakan. Pindah halaman, kemudian biarkan respons selesai. Respons lama tidak boleh mengarahkan halaman baru atau menghapus catatan milik operasi berbeda. Server tetap mungkin menyelesaikan operasi pertama: baca statusnya.
3. Uji ganti akun A ke B. Jangan menerima akses pesanan A dari B. Catatan A tidak otomatis dikirim dari B.
4. Simulasikan HTTP 408/429/503, HTML200, atau body terputus. UI harus menampilkan hasil belum pasti. Retry mempertahankan request ID dan payload semula; jangan transfer uang ulang.
5. Muat ulang tab yang sama saat ada pending. Catatan valid muncul dan tidak dikirim otomatis. Klik Coba ulang lalu periksa server. Tab baru/tutup tab bukan backup yang dijamin.
6. Simulasikan sessionStorage penuh/diblokir sebelum kirim: tidak ada request baru. Simulasikan gagal removeItem sesudah ACK: tombol tindakan baru ditahan dan status server tidak disebut gagal.
7. Uji controller stop/start (Strict Mode) dan komponen transaksi yang berganti revision. Respons generasi sebelumnya tidak membersihkan operasi generasi baru.
8. Simulasikan callback refresh/navigasi melempar error sesudah ACK pada lingkungan pengujian. Tombol tidak tetap busy; notifikasi menjelaskan konfirmasi server dan kegagalan tampilan.
9. Uji publikasi/penarikan dan pengaturan rekening dengan tab lama. Revision conflict tetap ditolak server; harga/tagihan lama tidak berubah.
10. Uji HP/desktop: pesan terbaca, tombol Retry dinonaktifkan saat sibuk atau penyimpanan diblokir, dan tidak ada error hydration pada konsol.

Jangan menghitung checklist ini sebagai lulus hanya karena disertakan. Simpan bukti tanpa secret/token/PII.
