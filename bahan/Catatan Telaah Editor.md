# Catatan Telaah Editor

Hal yang ditemukan QC independen (November 2026) tetapi tidak diputuskan sendiri oleh generator, karena butuh keputusan editor, pengajar, atau sumber primer. Butir yang terdampak sudah diberi `berlakuPer`, dikeluarkan dari bank, atau ditandai di kode. Setelah memutuskan, ubah butirnya di folder yang disebut, naikkan `versi` family, lalu jalankan `npm run verify` dan `npm run paket`.

## PSJK — OJK dan Dasar Keuangan (`lib/psjk/ojk-dasar/`)

1. **Fakta AFPI** (nomor 150505, pengaduan@afpi.or.id) dikutip dari Buku Saku Cerdas Mengelola Keuangan Bab IX; teks di Drive terpotong di Bab V sehingga belum dicek.
2. **UU 4/2026**: pengecoh baru menyatakan bursa karbon dan aset kripto sudah menjadi tugas OJK sejak UU 4/2023, bukan tambahan UU 4/2026. E-book tidak menyatakannya secara eksplisit — mohon dikonfirmasi.
3. **Fakta 2026 hanya bersumber dari e-book tim**: UU 4/2026 (berlaku 17 Juni 2026), Kepala Eksekutif Bursa Mineral dan Komoditas Strategis, PDK OJK 4/2026.
4. **Dikeluarkan karena sumber bertentangan**: jumlah anggota Dewan Komisioner setelah UU 4/2026; jumlah kementerian/lembaga anggota Satgas (2015 vs 2021); batas jangka waktu tujuan keuangan pendek/menengah (Buku 9 vs Buku Saku Cerdas); jumlah tahap perencanaan keuangan (4 vs 6).
5. **Contoh penerapan tujuh prinsip POJK 22/2023** dirumuskan generator karena e-book hanya memberi nama prinsip; telaah terutama "persaingan sehat" dan "perlakuan adil".
6. Banyak pengecoh berupa "mandat lembaga lain" sehingga mudah dieliminasi; pertimbangkan pengecoh dari ranah yang sama. Tabel Kepala Eksekutif bersifat tautologis (nilai mengulang kata subjek).
7. Data bertanggal (Kontak 157 Januari–April 2024, susunan Satgas Waspada Investasi 2015) perlu dikinikan bila ada data baru; hasil SNLIK setelah 2019 tidak ada di Drive.

## PSJK — Perbankan dan Pembiayaan (`lib/psjk/perbankan-pembiayaan/`)

1. **Status pengawasan bank** ("normal, intensif, khusus", Buku 2 2019) dikeluarkan. Tulis ulang dari POJK 5/2024 (bank umum) dan POJK 28/2023 (BPR/BPRS) bila dikehendaki.
2. **Pola KECUALI**: 7 dari 10 butir KECUALI berkunci "simpanan/giro/LPS"; ragamkan dengan larangan lain yang bersumber.
3. **Fakta yang hanya terverifikasi lewat e-book**: batas LPS Rp2 miliar dan kriteria 3T (Buku Saku 2021), manfaat ekonomi LPBBTI 0,275/0,1/0,3/0,2% per hari dan rasio 30% sejak 2026, jam penagihan 08.00–20.00, angka LKM POJK 41/2024 (rancangan perubahannya sedang konsultasi publik Agustus 2026), tenggat klaim 15 hari kerja (POJK 11/2025), penaksir per kantor cabang (POJK 39/2024), CET1 4,5% dan Tier 1 6%.
4. **Dikeluarkan karena rawan berubah**: ambang transfer SKNI/RTGS, angka GWM, bobot CAMEL BPR, batas modal kerja 2 tahun dan fasilitas Rp500 juta (POJK 35/2018), porsi pinjaman gadai ≥51%, cakupan "lembaga pembiayaan" (Buku 5 vs e-book), Askrindo.
5. Pengecoh lemah yang belum diganti: CAR terbalik (>500%), "selisih dibagi dua" pada untung/rugi divestasi, alasan pengecoh 50%/40% pada `rasio-30`.
6. Harga emas ilustratif (Rp960 ribu–Rp1,44 juta per gram) jauh di bawah harga 2026; status badan hukum "Perum Jamkrindo" perlu dicek.
7. Tiga butir relasi ambang: "pinjaman gadai" vs gadai angsuran; OJK vs Satgas PASTI untuk "pemberantasan aktivitas keuangan ilegal"; "hak tagih" vs "klaim".

## PSJK — Investasi dan Proteksi (`lib/psjk/investasi-proteksi/`)

1. **Komposisi reksa dana 80%/79%** dan "reksa dana syariah hanya efek DES" dari Buku Saku Pasar Modal 2023; cocokkan dengan Buku Saku Edisi 2025 atau POJK pengelolaan investasi terbaru (`RD_DEF`, `RD_BERLAKU` di `pasar-modal.ts`). Batang soal kini menyebut "Menurut Buku Saku Pasar Modal OJK (2023)".
2. **Regulasi 2026 yang hanya ada di e-book**: KEP-54/D.05/2026, PADK 3/2026, UU 4/2026 Pasal 221A–221F, POJK 2/2026, POJK 4/2026, POJK 36/2025 (co-payment 5%, batas Rp300 ribu/Rp3 juta), Fatwa 166/DSN-MUI/II/2026, Roadmap Bulion 2026–2031, tanggal 20 Januari, 17 Juni, dan 1 September 2026.
3. **Dua baris baru dari UU 40/2014 Pasal 1** (pialang reasuransi, penilai kerugian asuransi) tidak ada di e-book — pertahankan atau hapus.
4. **Anjak piutang → hiwalah** dihapus dari tabel akad karena Fatwa DSN 67/2008 memakai wakalah bil ujrah dan Buku 8 menyebut talangan qardh. Pulihkan hanya bila batang soal dijangkarkan ke "Tabel 3 Buku 8".
5. **Pengangkatan DPS**: kunci memakai "rekomendasi MUI" (UU 21/2008), Buku 8 menulis "DSN-MUI". Pilih satu gaya.
6. **DAPEN-RELASI tabel "jenis"** mencampur lembaga (DPPK/DPLK) dan program (PPMP/PPIP) mengikuti e-book, sehingga peserta yang jeli dapat mempersempit ke dua opsi.
7. **Ejaan antarbab**: "tabarru'" vs "tabarru", "wadi'ah" vs "wadiah", "maysir" vs "maisir" (KBBI: maisir).
8. Batas definisi salam vs istishna, dan rumus dividend yield/imbal hasil total (dinyatakan di soal karena tidak tertulis di sumber).
9. **Dikeluarkan karena usang**: DPLK hanya oleh bank/asuransi jiwa (kini POJK 35/2024), UU 11/1992 sebagai dasar hukum berlaku, ketentuan iuran/hak era UU 11/1992, PPN komisi dan pajak penjualan saham, masa berlaku izin WPPE/WMI/ASPM, batas pembubaran reksa dana, jumlah pelaku kripto berizin, contoh pelaku bulion, sejarah Djasa Raharja/Taspen/ASABRI/ASTEK.

## Bahasa Inggris (`lib/bahasa-inggris/`)

1. Isi bank (terutama matriks makna Sentence Completion dan bacaan Reading) sebaiknya ditelaah sampel oleh pengajar atau penutur asli; uji buta model dua putaran tidak menemukan kunci salah atau ganda.
2. Reading belum punya blueprint resmi dari tim; generator mengikuti `bahan/Blueprint Reading Comprehension (usulan).md`. Mohon disahkan atau dikoreksi (jumlah soal per bacaan, tipe soal, panjang bacaan, varian ejaan British).
3. RC-SHL (bacaan pendek gaya SHL, 1–2 soal) tidak masuk paket karena bagian Reading butuh 3–4 soal dari satu bacaan. Bila Mapping mengizinkan bagian Reading berisi dua bacaan pendek, perakit paket perlu disesuaikan.
4. Sisa catatan uji buta yang belum dihapus seluruhnya: kebocoran ringan antarsoal pada bacaan tarif kemacetan dan tabungan otomatis; SI-AGREEMENT "are having" sebagai pengecoh yang kentara (pengganti yang lebih halus berisiko kunci ganda); heuristik "pilih yang paling tidak menyimpang" pada GCS masih sedikit di atas peluang acak (25–33%).
5. Format jumlah opsi mengikuti blueprint: Sentence Completion, Sentence Arrangement, dan Reading 4 opsi; Sentence Improvement dan Grammatically Correct Sentence 5 opsi.
6. **Soal global Reading masih dapat ditebak pembaca yang kuat tanpa bacaan.** Setelah tiga putaran perbaikan, isyarat permukaan sudah hilang (simulasi "pilih paling berpagar/terpanjang/buang mutlak" 9–32%, satu soal global per bacaan, pengecoh berupa tesis wajar bercakupan sama). Namun peserta model tanpa bacaan tetap menebak 14 dari 15 soal judul/gagasan utama/tujuan/sikap dengan memilih tesis yang paling sesuai pengetahuan umum tentang topiknya (mis. restorasi karang membantu tetapi kalah cepat dari pemanasan). Menghilangkannya berarti menulis bacaan yang simpulannya tidak tertebak dari pengetahuan umum — keputusan redaksi, bukan teknis. Soal detail, kosakata, hubungan, dan inferensi tidak bermasalah ini.

## Badges (`lib/deduktif/badges/`)

1. Cara cepat masih cukup panjang bila soal memuat banyak jenis petunjuk.
2. Label tingkat tampil di judul soal di Studio; pertimbangkan menyembunyikannya bila komponen dipakai di tryout.
3. Nama terbatas pada 26 nama bank foto; konteks BDG-SHL-KANTOR dan BDG-SHL-GAJI masing-masing satu konteks (sesuai SHL).

## QC 1 PCAM Tahap 2 (19 November 2026) — sisa tindak lanjut

Temuan QC TO-01 yang sudah diterapkan pada family tercatat di README (bagian "QC 1 PCAM Tahap 2"). Yang berikut belum selesai atau butuh keputusan:

1. **Visual pembahasan belum dibuat**: T01 (Fill Shape per objek — Hijau 1/Hijau 2/Ungu 1, lintasan G1–G5 dengan objek lain diredupkan, gabungan G5 sama dengan kunci), T04 (Drag the Line — jalur jawaban beranotasi per sambungan, awalan dikunci, komponen penentu disorot), dan T07 (Deduktif — irisan hari tersedia pada Calendar, penempatan bertahap pada denah Room, lajur urutan Badges, skala waktu dengan blok yang digeser pada Timeline/Timeslot). Pembahasan saat ini masih berupa langkah teks.
2. **Finance lease dan sale and leaseback** tetap ditanyakan karena merupakan inti chapter Perusahaan Pembiayaan; QC menandainya PENGAYAAN (definisi dan pembeda skema belum diuraikan materi folder). Mohon materi folder ditambah uraiannya, atau putuskan butir ini dikeluarkan (tabel relasi cara pembiayaan perlu lima baris).
3. **Drag the Line 2 Character tanpa family SHL**: satu-satunya family SHL (DL-SELANG, contoh blueprint hlm. 9) berbasis deret huruf–angka, sehingga dikeluarkan bersama DL-BERTINGKAT, DL-SISIP, DL-OPERASI, dan DL-SIKLIS sesuai T03. Chapter ini kini memakai DL-DOMINO dan DL-SAMBUNG-UJUNG (VARIASI). Bila tim tetap ingin pola SHL hlm. 9, mohon konfirmasi bahwa T03 tidak berlaku untuk chapter ini.
4. **Cakupan materi folder belum diperiksa menyeluruh**: pengayaan yang dikeluarkan hanya 13 butir yang disebut QC untuk TO-01. Butir SJK lain di bank belum dicocokkan satu per satu dengan 16 materi folder acuan.
5. **Ekspor SiAdu 6 bentuk interaktif**: Fill Shape, Node Arrow Navigation, Calendar Date Selection, Place and Room Allocations, Timeline Scheduling, dan Timeslot Scheduling belum punya template Auto Input. Ekspor saat ini berupa berkas usulan (tabel data + kunci). Mohon tangkapan layar formulir SiAdu untuk bentuk tersebut agar ekspor disesuaikan dengan kolomnya.
6. **Uji tampilan pada perangkat peserta** (T02/T08, F06): jarak aman ruas Drag the Line (≥ 0,85 satuan dari pusat simpul lain) dan font simpul sudah diterapkan di generator, tetapi belum diuji pada aplikasi/ukuran layar peserta yang sebenarnya.

## QC 2 PCAM Tahap 2 (24 November 2026) — sisa tindak lanjut

Perbaikan QC 2 tercatat di README (bagian "QC 2 PCAM Tahap 2"). Butir 1, 2, dan 4 pada daftar QC 1 di atas sudah selesai. Yang masih butuh orang:

1. **Pemeriksaan cakupan**: teks 12 materi folder (Pengenalan OJK, Perencanaan Keuangan, Perbankan, Perusahaan Pembiayaan, Pergadaian, Pasar Modal, Asuransi, Dana Pensiun, Keuangan Syariah, Fintech, Aset Kripto, Digital Financial Literacy) sudah dicocokkan dengan kunci setiap butir secara otomatis (kata kunci yang tidak ada di teks), dan butir bersumber campuran di chapter itu dibaca. Empat materi (Lembaga Keuangan Mikro, Lembaga Penjaminan, Perusahaan Modal Ventura, Bulion) belum dibaca ulang; butirnya seluruhnya mencantumkan e-book sebagai sumber. Pencocokan otomatis tidak menggantikan telaah isi oleh editor.
2. **Pensiun ditunda** dikeluarkan sesuai QC 2 (SJK 36). Versi materi Dana Pensiun yang dibaca 25 November 2026 memuat pensiun ditunda pada tabel subbab 3.1.9 dan 3.1.11. Bila tim menganggapnya sudah diajarkan, hapus dua baris `pensiun ditunda` di `lib/psjk/cakupan.ts` agar butirnya kembali.
3. **SBPO/IBP** (arti indeks di atas/di bawah 50) tetap ditanyakan karena menjadi contoh soal 4.15 dan 4.22 materi Perbankan; nama dan isi publikasi tidak ditanyakan (T09).
4. **Uji perangkat peserta (T02/T08)**: ukuran simpul, garis, label, dan area sentuh pada aplikasi ini sudah sama dengan `tampilan` di JSON; tampilan pada aplikasi tryout peserta yang sebenarnya tetap perlu diuji dengan angka itu.
5. **Gambar di Pembahasan Word**: belum diuji pada importir SiAdu. Bila importir menolak gambar, kirim contoh format yang diterima.
6. **Visual** diperiksa pada contoh tiap family (63 family) dan semua soal diperiksa mesin (ada, tidak kosong, tanpa nilai rusak). Telaah desain oleh tim tetap diperlukan sebelum rilis.
