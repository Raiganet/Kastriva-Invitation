# Premium collection

| Tema | Kategori | Ornamen |
| --- | --- | --- |
| Seraphine Garden | Pernikahan | Peony berlapis, foliage, gerbang taman, bingkai champagne |
| Jubilee Carousel | Ulang tahun | Carousel, balon pastel, bendera pesta, kertas berbingkai |
| Nur Eden | Aqiqah | Lentera ivory, taman sage, bulan, lengkung arsitektural |
| Nocturne Gala | Acara kantor | Art deco emas, kipas geometris, kristal gantung |

Semua ilustrasi adalah SVG lokal orisinal; tidak ada aset eksternal atau dependensi tambahan. Ornamen berada di margin dan tidak menangkap klik. Animasi mengikuti reduced motion, berhenti di luar viewport atau saat tab disembunyikan. Foto utuh, nama responsif, musik demo, ucapan contoh, dan kontrol gulir memakai alur bersama.

Rilis kode aplikasi lebih dahulu, lalu jalankan `20261009135319_premium_editions.sql` setelah `occasion_collection`. Kode menerima katalog historis 20 tema maupun katalog 24 tema; jangan menambahkan baris produksi sebelum kode siap. Migrasi mempertahankan metadata/harga/status seluruh tema lama, draft CMS yang belum diterbitkan, serta seluruh generasi backup. Fixture SQL 020 memeriksa penambahan dan replay tanpa perubahan ulang.

Keempat tema premium kini mendukung editor dan pemesanan sesuai kategorinya. Lihat [aktivasi kategori](NON_WEDDING_ORDERS.md) untuk migrasi dan verifikasi.
