# Inspeksi opsional, bukan aplikasi produksi

Alat ini membuat snapshot HTML dengan adapter JSX/hook sederhana. Tidak menggunakan runtime React/Next, tidak mengirim request Supabase, dan tidak menguji state, routing, hydration, maupun sessionStorage di origin aplikasi.

Persyaratan tambahan: dependensi TypeScript terpasang, Python dengan Playwright, dan Chromium. Tidak diperlukan untuk menjalankan webapp atau npm test. Jalankan dari akar proyek:

```text
node docs/testing-tools/render-static.cjs
python docs/testing-tools/inspect-browser.py
```

Berkas sementara berada di test-results/stage3-static. Laporan dan gambar pada docs diperbarui oleh alat ini. Gunakan CHROMIUM_PATH untuk memilih executable bila perlu. Fixture nama/status bukan pelanggan atau balasan server. Tahap pemrosesan foto memakai implementasi preparePhoto yang sebenarnya pada Canvas/File browser; tetap bukan upload Storage.

Untuk uji aplikasi sebenarnya, install semua dependensi lalu ikuti UJI_EDITOR_TAHAP3.md pada server Next dan Supabase staging. Adapter ini tidak menggantikan pengujian tersebut.
