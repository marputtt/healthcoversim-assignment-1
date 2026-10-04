# Assignment 1 Plan

**HealthCoverSim - Marsya Putra**
**4 October 2026 · Aplikasi sudah dibuat di `Assignment 1/`; rekaman video dan submission masih menunggu.**
Source: [[Assignment_1_HealthCoverSim.pdf]], seluruh 7 halaman.

## Bentuk Aplikasi

React + Node.js/Express + SQLite + CSS biasa, sesuai assignment. Cukup **satu tabel `quotes`**. Simpan input, lalu hitung premi dengan satu fungsi backend saat quote ditampilkan. Tidak perlu tabel customer, applicant, pricing atau payment terpisah.

UI cukup empat tampilan: list, create, detail dan edit. Create/edit memakai form yang sama. Detail menampilkan breakdown serta tombol edit/delete. Applicant 2 muncul hanya untuk Couple/Family. Tidak perlu login, dashboard, integrasi insurer atau deployment untuk memenuhi brief.

Gunakan React/Vite, Express dan `better-sqlite3`, JavaScript dan CSS biasa. Node yang tersedia `22.23.1` memenuhi [persyaratan Vite](https://vite.dev/guide/). Implementasi telah disetujui dan source aplikasi berada di `Assignment 1/`. Repo: [marputtt/healthcoversim-assignment-1](https://github.com/marputtt/healthcoversim-assignment-1), private.

## Satu Tabel

Field mengikuti contoh PDF halaman 5:

```text
quotes
  id
  customer_name
  cover_type
  applicant1_age
  applicant1_cover_history
  applicant2_age
  applicant2_cover_history
  hospital_cover
  extras_cover
  payment_frequency
  annual_discount
  notes
  created_at
```

`applicant2_age` dan `applicant2_cover_history` harus NULL untuk Single. Sediakan `db.js` untuk membuat tabel jika belum ada; jangan reset data saat server dinyalakan. Pakai parameter SQL untuk input pengguna. Simpan input saja, bukan total premi yang dapat tertinggal setelah edit.

## Aturan Hitung

Harga per adult per month:

| Hospital | None | Basic | Bronze | Silver | Gold |
| --- | ---: | ---: | ---: | ---: | ---: |
| Harga ($) | 0 | 90 | 120 | 160 | 220 |

| Extras | None | Basic | Standard | Premium |
| --- | ---: | ---: | ---: | ---: |
| Harga ($) | 0 | 25 | 45 | 70 |

- Single = 1 adult; Couple/Family = 2 adults. Family menambah **$30/bulan sekali**, tanpa input usia anak.
- LHC per applicant = `(age - 30) × 2%` hanya jika age >30, history No dan hospital dipilih. History Yes atau hospital None = 0%. Tidak ada loading cap pada simulator ini.
- History Not sure = 0% dan warning untuk applicant tersebut bahwa quote mungkin tidak akurat.
- Hospital dihitung per applicant dengan loading masing-masing. Extras = harga tier × jumlah adult, tanpa loading.
- Monthly = hospital total + extras total + Family fee. Yearly before = monthly ×12.
- Diskon 0-10% hanya mengurangi yearly total saat payment Yearly; monthly tetap sama. Monthly payment tidak mendapat diskon.
- Perhitungkan uang dalam cents dan bulatkan yearly after discount ke cents agar tampilan konsisten. `annual_discount` menggunakan angka persen, misalnya 5 berarti 5%.

Detail menampilkan monthly, yearly before, yearly after jika Yearly, hospital/extras terpisah, LHC masing-masing applicant, Family fee, discount, final total dengan periode yang jelas, warning dan penjelasan singkat. Sertakan kalimat wajib persis:

> Lifetime Health Cover loading applies only to hospital cover. It does not apply to extras cover.

Sertakan pemberitahuan singkat bahwa ini learning simulator, bukan financial advice. Nama, notes, usia anak dan harga insurer nyata tidak memengaruhi perhitungan.

## Validasi dan CRUD

Nama dan semua pilihan wajib; age integer 18-100; discount 0-10%; Applicant 2 age/history wajib untuk Couple/Family. Notes opsional. Form dan backend menolak input invalid dengan pesan jelas, tanpa menghitung final quote atau mengubah data. Single mengosongkan Applicant 2; Monthly tidak memakai diskon. Bedakan pilihan None yang valid dari pilihan kosong. Jangan membaca Applicant 2 tanpa null check.

API cukup GET `/api/quotes`, GET `/api/quotes/:id`, POST create, PUT update dan DELETE. Data invalid mendapat 400, id tidak ditemukan mendapat 404; jangan crash karena field null atau JSON invalid. Gunakan native fetch dan React state. Data tersimpan harus tetap ada setelah server restart.

## Urutan Kerja

- [x] Buat calculator dan cek worked example terlebih dahulu.
- [x] Buat `db.js`, satu tabel, dan API CRUD; cek data tetap ada setelah restart.
- [x] Buat form bersama, list/detail/edit dan breakdown dengan CSS sederhana.
- [x] Uji input invalid dari form dan langsung ke API; cek navigasi dan tampilan.
- [x] Setelah aplikasi selesai dan diuji, tulis README lengkap dan `Video Script.md` sesuai tampilan aplikasi yang benar-benar tersedia.
- [x] Verifikasi setup dari clean checkout dan siapkan source ZIP (`Assignment 1/HealthCoverSim_Source.zip`).
- [ ] Pemilik memeriksa kode/perhitungan sendiri, merekam video 3-5 menit, memberikan akses marker dan mengunggah submission.

Struktur aplikasi di `Assignment 1/`: `server/` untuk API/database/calculator, `shared/` untuk validasi, `frontend/` untuk React/CSS dan `test/` untuk pemeriksaan. Satu package dan lockfile; jalankan perintah dari folder tersebut.

## Pemeriksaan Wajib

Patokan utama dari PDF: Family, usia 40/No + 35/Yes, Silver, Standard, Yearly 5%:

| Komponen | Hasil |
| --- | ---: |
| Applicant 1 / Applicant 2 LHC | 20% / 0% |
| Hospital | $352 |
| Extras | $90 |
| Family fee | $30 |
| Monthly | **$472** |
| Yearly before | **$5,664** |
| Yearly after | **$5,380.80** |

Cek juga Monthly tidak didiskon; usia 30 vs 31; extras-only tanpa LHC; Not sure dengan warning per applicant; Couple/Family tanpa Applicant 2; usia negatif/0/di luar 18-100; discount di luar batas; Single dengan field Applicant 2 lama; edit memperbarui breakdown; dan invalid request langsung ke API. Untuk pilihan eksplisit None/None, PDF tidak melarangnya: total dasar 0 ditambah Family fee jika Family. Revisi bila dosen memberi klarifikasi lain.

Gunakan test runner bawaan Node untuk calculator/API dan pemeriksaan browser untuk CRUD serta form. Hasil aktual: 55 pemeriksaan otomatis lulus, build berhasil, dan CRUD serta contoh perhitungan sudah diperiksa melalui browser. Detail ada di [[Assignment 1/README]]. Target rubrik: CRUD/submission 35, explanation 20, calculation/validation 25, UI/presentation 20. Utamakan benar dan mudah dijelaskan.

## README Akhir

README ditulis setelah app selesai agar langkah dan perintah sesuai implementasi, bukan perkiraan. Harus mencakup:

1. **Project overview:** tujuan simulator dan stack yang digunakan.
2. **Prerequisites:** versi Node/npm dan kebutuhan lokal yang benar-benar dipakai.
3. **Install:** clone/download repo, masuk folder dan install dependencies dari lockfile. Jelaskan langkahnya berurutan.
4. **Database setup:** file `db.js`/`init.sql`, perintah atau proses inisialisasi yang sebenarnya, lokasi SQLite, satu tabel `quotes`, dan bahwa startup tidak menghapus data.
5. **Run:** perintah backend dan frontend, apakah membutuhkan dua terminal, alamat browser/API serta konfigurasi port bila ada. Cantumkan build/start jika diimplementasikan.
6. **Quote calculation:** tabel base price, jumlah adult, LHC per applicant hanya pada hospital, Family fee $30, annual-only discount dan kebijakan rounding.
7. **Worked example:** tunjukkan $472, $5,664 dan $5,380.80 beserta komponen pembentuknya.
8. **Validation and checks:** apa yang ditolak, arti Not sure, serta cara menjalankan pemeriksaan yang tersedia.
9. **One limitation:** memakai harga dan LHC sederhana; tidak menyamai insurer atau seluruh aturan LHC nyata.
10. **Assistance statement:** singkat dan jujur sesuai PDF halaman 5-6: tool, bantuan yang diterima, pekerjaan/pemeriksaan pribadi yang benar-benar dilakukan, dan satu keputusan yang dibuat sendiri oleh pemilik.

Ikuti README dari clean checkout/database kosong. Jangan mengklaim instalasi, pengujian atau pekerjaan pribadi yang belum dilakukan.

## Script Video Setelah Aplikasi Jadi

Buat `Video Script.md` setelah app bekerja. Isinya harus berupa naskah siap dipakai: timestamp, aksi klik/input di layar dan narasi bahasa Inggris yang sederhana, ditulis sesuai label serta perilaku app sebenarnya. Target sekitar 4 menit, tetap dalam batas wajib 3-5 menit. Video dapat memakai Zoom atau screen recording.

| Waktu perkiraan | Aksi dan isi narasi |
| --- | --- |
| 0:00-0:20 | Perkenalkan HealthCoverSim, stack dan quote list |
| 0:20-1:20 | Create contoh Family di atas, save, buka detail; jelaskan dua applicant, loading 20%/0%, hospital/extras terpisah dan fee $30 |
| 1:20-1:55 | Tunjukkan monthly $472, yearly before $5,664, diskon 5% dan yearly after $5,380.80 |
| 1:55-2:40 | Edit menjadi Monthly, save/update, buka hasil; jelaskan monthly tetap sama dan annual discount tidak diterapkan |
| 2:40-3:20 | Edit salah satu history menjadi Not sure; tampilkan warning dan jelaskan tidak ada loading otomatis |
| 3:20-3:40 | Bila waktunya cukup, tunjukkan invalid Applicant 2 yang ditolak |
| 3:40-4:00 | Delete quote dan tunjukkan list setelah penghapusan |

Naskah wajib memperlihatkan create/view, monthly/yearly, edit/update/delete, contoh LHC yang berlaku dan perubahan yearly akibat annual discount. Tidak perlu menjelaskan seluruh codebase di video; pemilik tetap harus bisa menjelaskan kode dan rumus sendiri. Setelah rekaman, periksa durasi, audio, keterbacaan angka dan seluruh aksi wajib. Naskah tidak menggantikan video rekaman.

## Submission

- Repo berisi source, README dan database setup, dapat diakses marker.
- Source ZIP ke LMS, tanpa `node_modules` dan build. Keluarkan juga secrets, `.git`, database lokal dan editor/workflow state.
- Video rekaman 3-5 menit ke LMS; putar ulang sebelum upload.
- Repo private memerlukan akses marker sebelum deadline. Konfirmasi akunnya terlebih dahulu; belum ada invitation atau LMS submission.
- Deadline, student identifier dan batas upload tidak tercantum di PDF; cek course portal sebelum submission. Jangan mengarang detailnya.

## Related Notes

[[Cloud Web Class Index]] · [[Assignment 1/README]] · [[Assignment 1/Video Script]]
