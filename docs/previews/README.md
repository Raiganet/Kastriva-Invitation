# Batas gambar preview

`stage3/` berisi tiga gambar editor yang diperiksa pada v1.3.0. HTML dibuat dari source TSX memakai adapter JSX/hook **statis**, bukan React/Next runtime. Gambar membantu meninjau tampilan, bukan bukti hydration, state, route, login, autosave jaringan, atau Storage berjalan. Data nama dan status simpan adalah fixture uji, bukan pelanggan/hasil simpan server nyata.

Gambar pada akar folder ini berasal dari v1.1.0. Tidak digunakan sebagai bukti runtime v1.3.0. Laporan terbaru ada pada `../TEST_REPORT.md` dan log `../test-results/stage3/browser-inspection.json`.
