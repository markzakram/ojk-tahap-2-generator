# TKU Studio — Generator Soal OJK Tahap 2

Generator soal Tes Kemampuan Umum (TKU) Tahap 2 PCAM 10 OJK 2026. Bahan riset, blueprint, dan mapping ada di [`bahan/`](bahan/00%20-%20Ringkasan%20Bahan.md).

```bash
npm install
npm run dev -- -p 3100      # generator di http://localhost:3100, Pustaka soal di /studio, Tahap 1 di /tahap-1
npm run verify              # 300 seed per family; `npm run verify -- 1000 FS-` untuk family tertentu
npm run generate            # daftar family
npm run generate -- CDS-A0 abc123   # cetak satu soal + kunci + pembahasan
npm run paket               # susun 10 tryout + latsol ke lib/data/paket.json
npm run siadu               # Word SiAdu paket resmi ke output/siadu/ (atau: npm run siadu -- TO-01)
```

Tampilan mengikuti **UTBK Generator** dan **SKD Generator**: menu samping (Dasbor, Buat paket, Hasil paket, Ekspor, Pustaka soal) dan kartu bernomor, dengan aksen biru Tahap 1 agar kedua tahap serasi. Tab **Tahap 2** di Tahap 1 dan Portal membuka halaman utama (`/`).
- **Buat paket** (`/`): kartu 1 jenis paket (Paket resmi Mapping, Tryout, Latsol, Per chapter); 2 jumlah paket dan subtes/kelompok/materi; 3 soal per chapter dalam tabel Subtes › Category › Lesson (nama dan Bentuk Soal dari Mapping, struktur unik, kebutuhan, tanda ⚠ bila melebihi stok); 4 tingkat kesulitan dan benih. Panel kanan meringkas jumlah soal, kesiapan per subtes, dan tombol **Buat N paket**.
- **Hasil paket** (`/?v=hasil`, juga `/paket`): matriks paket × subtes (klik sel), pembaca soal per nomor atau semua soal, kunci dan pembahasan, serta hasil pemeriksaan (soal terisi, struktur kembar, soal saling membocorkan, bacaan Reading utuh, deret kunci, sebaran label/tingkat/kunci).
- **Ekspor** (`/?v=ekspor`): Word SiAdu (lihat [Ekspor SiAdu](#ekspor-siadu)), JSON lengkap, dan CSV daftar soal; satu berkas diunduh langsung, beberapa berkas dalam ZIP.
- **Dasbor** (`/?v=dasbor`, juga `/ringkasan`): target 1.440 soal, family aktif, struktur unik, kesiapan per subtes, kapasitas per chapter (Category › Lesson › Chapter), dan hal yang perlu diputuskan. Angka kapasitas dari [`lib/data/kapasitas.json`](lib/data/kapasitas.json) yang ditulis `npm run verify`.
- **Pustaka soal** (`/studio?f=…&s=…`): Studio tiga panel di dalam kerangka yang sama — pilih family, atur seed, kerjakan soal, lihat kunci/pembahasan dan kapasitas family.

Nama **Tes, Category, Lesson, Chapter, dan Bentuk Soal** mengikuti Mapping Tahap 2 PCAM OJK 2026 (`lib/data/chapters.ts`: `category`, `lesson`, `chapter`, `bentuk`), termasuk Lesson **Reading Comprehension** dengan Chapter **4 Option**, serta Navigation/Urutan Soal per subtes (`NAVIGASI`).

## Situs gabungan dengan Tahap 1

Folder [`tahap-1/`](tahap-1/) adalah generator Tahap 1 (Tes Potensi Dasar) yang dimasukkan lewat `git subtree`; pengembangannya tetap di repo/folder Tahap 1. Situs ini melayani halamannya di **`/tahap-1`** (dialihkan ke `/tahap-1/index.html`), jadi satu proyek Vercel memuat kedua tahap.

- `npm run dev` dan `npm run build` (juga build Vercel) lebih dulu menjalankan [`scripts/salin-tahap-1.mjs`](scripts/salin-tahap-1.mjs), yang menyalin `index.html`, `css/`, `js/`, dan aset gambar Badges dari `tahap-1/` ke `public/tahap-1/`. Folder itu dibuat ulang setiap kali dan tidak masuk git. CLI, uji, dan contoh keluaran Tahap 1 tidak ikut disalin.
- Di salinan itu `js/situs.js` diberi alamat kedua tahap, sehingga bilah atas Tahap 1 juga menampilkan tab **Tahap 1 | Tahap 2**. Bila dibuka sendiri (folder Tahap 1, `cli/buka.js`, Portal), tab itu tidak tampil.
- Memperbarui Tahap 1 dari foldernya (setelah perubahan di sana di-commit):

  ```bash
  git subtree pull --prefix=tahap-1 "/g/Ali/code/Tes OJK Generator/Tahap 1" main -m "Perbarui tahap-1"
  ```

- Ekspor untuk Portal lokal (`TKU_PORTAL=1`, lihat `next.config.mjs`) tidak menyalin Tahap 1, karena Portal melayani Tahap 1 langsung dari foldernya. Di dalam bingkai Portal, tab antartahap disembunyikan karena Portal sudah punya tabnya sendiri.

## Konsep: family + seed

- **Family** = satu mekanisme soal dari blueprint (mis. `CDS-A0` Calendar irisan ketersediaan, `RA-SAMA-BEDA` Room Allocations). Setiap family berlabel **SHL** (mekanisme teramati di latihan SHL) atau **VARIASI** (pengembangan dekat sumber).
- **Seed** = string bebas. `family + versi + seed` selalu menghasilkan soal yang sama persis; `uid` soal (`CDS-A0@v1:abc123`) cukup untuk membangkitkannya ulang. Di Studio, seed tersimpan di URL (`/studio?f=CDS-A0&s=abc123`).
- Setiap kandidat soal melewati alur blueprint: **bangun solusi → turunkan petunjuk → pecahkan ulang dengan solver enumerasi penuh hanya dari isi soal → terbitkan bila jawabannya tepat satu**. Kandidat yang gagal ditolak lalu dicoba lagi dengan pengacak turunan `#k` (tetap deterministik).
- **Sidik struktur** menyamakan soal yang hanya berbeda nama/konteks. Seed tidak terbatas, tetapi struktur tidak: contohnya `RA-SAMA-BEDA` hanya punya 25 struktur berbeda. Pakai sidik untuk mencegah soal kembar dalam satu paket/antarpaket.
- Untuk soal pilihan ganda, `npm run verify` juga menghitung seberapa sering kunci menjadi satu-satunya opsi **terpanjang** atau **terpendek** (per struktur unik). Di atas 40% (atau dua kali peluang acak) muncul peringatan ⚠, karena peserta bisa menebak dari panjang opsi.
- Menaikkan `versi` wajib setiap kali isi pembangkit berubah, supaya `uid` lama tidak diam-diam menghasilkan soal lain.
- **Penalaran Induktif** tidak punya "kendala" tertulis, jadi solvernya berupa **pustaka aturan alternatif** (blueprint: "uji aturan alternatif sederhana"):
  - **Fill Shape** ([`lib/induktif/fill-shape/aturan.ts`](lib/induktif/fill-shape/aturan.ts)): pustaka berisi lima jenis aturan, dan setiap jenis dicoba dengan semua nilai parameternya terhadap G1–G4. Soal hanya terbit bila semua aturan yang cocok meramalkan G5 yang sama.
    - **periodik**: gambar berulang setiap beberapa langkah.
    - **operasi seluruh gambar**: putar, cermin, tukar lapisan, lintasan, atau tukar warna; boleh satu operasi tetap atau dua operasi bidang yang berselang-seling.
    - **jejak unsur**: tiap bidang berwarna bergerak sendiri dengan pola gerak tetap, langkah bertambah, langkah bergantian, bolak-balik, atau memantul.
    - **bidang kosong berpindah**: satu bidang putih berpindah, bidang lain kembali ke warna dasarnya; pusat dapat ikut menampilkan warna ujung tertentu.
    - **ritme lapisan**: tiap lapisan punya siklus warnanya sendiri dengan lama bertahan 1–3 langkah.
  - **Drag the Line** ([`lib/induktif/drag-line/aturan.ts`](lib/induktif/drag-line/aturan.ts)): solver menelusuri semua jalur dari awalan yang memakai setiap simpul sekali. Jalur dianggap sah bila memenuhi salah satu dari 12 aturan pustaka, misalnya deret per posisi, simbol bergiliran, biner, satu karakter sama, akhir–awal, rotasi, lubang huruf, geser alfabet, rantai operasi, simbol arah, angka siklis, atau operasi bergantian. Soal hanya terbit bila tepat satu jalur yang sah.
  - Pembahasan ditulis dari aturan yang ditemukan solver, termasuk "kunci pemilihan": simpul lain yang juga cocok di suatu langkah tetapi membuat rantai buntu.

## Menambah family

1. Buat berkas di `lib/<subtes>/<chapter>/`, ekspor objek `Family` (lihat `lib/core/types.ts`): `bangun`, `pecahkan` (solver independen), `kunci`, `periksa` (aturan mutu blueprint), `bahas` (pembahasan langkah demi langkah), `sidik`.
2. Daftarkan di `lib/core/registry.ts`.
3. Jalankan `npm run verify`; semua seed harus lolos, deterministik, dan lulus kontrol negatif.
4. Bila tipe interaksinya baru, tambahkan komponen di `components/` dan cabangnya di `components/Studio.tsx`.

## Bahasa Inggris

Empat bentuk non-reading dari [Blueprint Bahasa Inggris](bahan/Blueprint%20Bahasa%20Inggris.md) (sama dengan versi Google Drive) ada di `lib/bahasa-inggris/`: soal pilihan ganda teks (bentuk SIADU *Option New*) yang ditampilkan `components/PilihanGandaSoal.tsx`.

| Bentuk | Opsi | Isi |
|---|---|---|
| Sentence Completion | 4 (A–D) | 1 kalimat, 1 bagian kosong satu kata; opsi sekelas dan seinfleksi |
| Sentence Improvement | 5; E = *No improvement needed* | rentang bercetak miring; E menjadi kunci hanya bila kalimat awal benar (sekitar 18%) |
| Grammatically Correct Sentence | 5 (A–E) | lima kalimat lengkap, tepat satu benar; setiap kalimat salah memuat 1–2 kesalahan yang bisa ditunjuk |
| Sentence Arrangement | 4 urutan (A–D) | 5 fragmen berlabel A–E; ke-120 urutan diuji, tepat satu membentuk kalimat sah |

- **Label**: SHL = pola yang *teramati* pada contoh riset (makna/kolokasi, gerund setelah preposisi, agreement + preposisi waktu, susunan frasa); VARIASI = *perluasan berbasis buku* (Azar & Hagen, edisi 5).
- **Solver** tiap tipe menilai SETIAP opsi sendiri, bukan membaca kunci pembangun. Completion makna memakai matriks keterterimaan yang dikurasi: kata sasaran, petunjuk yang terlihat, sinonim yang diterima (tidak pernah jadi pengecoh), dan kata yang ditolak beserta alasannya. Bentuk kata, tense, dan penghubung dicek dengan aturan dan leksikon fitur. Improvement mengurai bentuk verb setiap opsi lalu menerapkan aturan posisi (setelah preposisi, setelah verb tertentu, rangkaian paralel, agreement, penanda waktu). Correct Sentence menilai kelima kalimat dari anotasi (inti subjek, rangkaian verb, peran subjek, keterangan waktu). Arrangement memakai tata bahasa bebas konteks (parser Earley) yang sengaja longgar agar urutan alternatif tertangkap.
- **Pemeriksaan format**: tidak ada opsi kembar, artikel *a/an* tidak membocorkan kunci, panjang kalimat sesuai tingkat, kunci tidak dapat ditebak dari bentuk opsi, dan ejaan BrE/AmE tidak pernah menjadi pembeda.
- **Pembahasan** mengikuti format blueprint bagian 10: Jawaban, Konsep, Kata Kunci, alasan, alasan setiap opsi salah, dan Cara Cepat.
- **Tingkat** Dasar/Menengah/Menantang (blueprint bagian 9) tersimpan di tiap soal untuk perakit paket.
- **Pemeriksaan pola tebakan** (hasil QC dan uji buta): pada Grammatically Correct Sentence setiap bentuk yang dipakai kunci juga muncul di sedikitnya satu pengecoh (kunci tidak pernah "beda sendiri" dari kisi pengecoh), dan kontraksi yang benar (*it's*, *they're*, *who's*) kadang menjadi kunci; pada Sentence Completion makna, sedikitnya satu pengecoh searah maknanya dengan kunci; pada Sentence Arrangement pengecoh dipilih yang gagal paling akhir (nyaris sah) dan keempat opsi diawali fragmen berhuruf kapital.
- Contoh blueprint dan contoh dokumen tim (Drive) disimpan sebagai **uji emas** di [`lib/bahasa-inggris/uji-emas.ts`](lib/bahasa-inggris/uji-emas.ts) (`npx tsx lib/bahasa-inggris/uji-emas.ts`) dan tidak terbit kata per kata; butir bank memakai kalimat baru dengan mekanisme yang sama. Contoh adjective blueprint §3 (*a ___* dengan opsi *excessive*) ditolak pemeriksa karena *a/an* membocorkan kunci.

### Reading Comprehension

Blueprint Reading belum ada dari tim; generator mengikuti [usulan blueprint](bahan/Blueprint%20Reading%20Comprehension%20(usulan).md) yang disusun dari contoh SHL dan arsip 2025, di `lib/bahasa-inggris/reading/`:
- **RC-OJK** (SHL, 40 soal) dan **RC-VAR** (VARIASI, 28 soal): bacaan 190–260 kata tingkat B2–C1 berisi 3–4 soal (detail, kosakata, makna kalimat, hubungan, inferensi, tujuan, gagasan utama, judul, sikap penulis). **RC-SHL** (SHL, 26 soal): bacaan pendek gaya SHL berisi 1–2 soal; karena tidak dapat mengisi satu bagian Reading utuh, family ini dipakai di Studio tetapi tidak masuk paket.
- Soal satu bacaan berurutan tetap (`data.urutan`) dan perakit paket mengambil satu bacaan utuh per tryout (4 soal) atau latsol (3 soal); 17 bacaan punya ≥4 soal.
- Solver menilai setiap opsi terhadap kalimat bukti bacaan (padanan kata yang dikurasi). Pembahasan menunjukkan letak bukti; tanda "=" hanya untuk parafrase setara, sedangkan untuk judul, gagasan utama, dan sikap ditulis `Unsur opsi dan kalimat pendukungnya: "X" ← "Y"`.
- `periksaPolaBank` memeriksa seluruh bank agar soal tidak dapat ditebak dari bentuk opsi: kunci bertitik dua paling banyak separuh, kata pembuka kunci juga dipakai pengecoh, tidak ada penanda global/mutlak, kunci berpagar ("… but …", "Results and Limits") paling banyak 60% dan pengecoh berpagar sedikitnya 25%, serta simulasi peserta "pilih paling berpagar", "pilih terpanjang", dan "buang yang mutlak" masing-masing ≤40%. Bacaan memakai ejaan British secara konsisten (gaya SHL); stem dan opsi dibuat netral.
- Paling banyak satu soal global (judul, gagasan utama, tujuan, sikap) per bacaan; pengecoh soal global berupa tesis wajar bercakupan sama yang hanya tersingkir oleh bacaan; pasangan opsi cermin tidak boleh hanya melibatkan kunci. Semuanya diperiksa saat bank dimuat, termasuk penjaga yang menolak soal bank yang selalu gagal dibangun.
- Hasil uji buta (peserta tanpa kunci, tiga putaran): tidak ada kunci salah atau ganda (93/93, 94/94, dan 81/81 + 77/77 non-reading). Soal global masih dapat ditebak pembaca yang kuat dari pengetahuan umum tentang topiknya — lihat [Catatan Telaah Editor](bahan/Catatan%20Telaah%20Editor.md). Isi bank tetap sebaiknya ditelaah sampel oleh pengajar atau penutur asli.

## Badges (Logical Ranking)

Penalaran Deduktif bentuk *Logical Ranking* ada di [`lib/deduktif/badges/`](lib/deduktif/badges/) dan ditampilkan [`components/BadgesSoal.tsx`](components/BadgesSoal.tsx): enam kartu orang (foto dari `tahap-1/bank_aset_badges/orang/`), masing-masing berisi 0–2 petunjuk, dan lencana 1–6 yang diseret atau diklik ke kartu. Kartu dan baki juga dapat dipakai dengan papan ketik (Tab, Enter/Spasi), dan di layar sempit baki tetap terlihat di atas.

- **Family**: BDG-SHL-TIBA, BDG-SHL-KANTOR, BDG-SHL-GAJI mengikuti jenis petunjuk soal SHL (urutan tiba, tiba di kantor, peringkat gaji termasuk petunjuk "jika"); BDG-V-DASAR/MENENGAH/MENANTANG mengatur tingkat lewat jenis dan gabungan petunjuk. Semua soal 6 orang.
- **Solver** mencoba seluruh 720 urutan dari teks petunjuk; soal terbit hanya bila tepat satu urutan memenuhi dan setiap petunjuk berfungsi (tanpa petunjuk itu jawabannya tidak tunggal). Kartu tidak pernah menyebut nama pemiliknya sendiri.
- **Pembahasan** ditulis mesin deduksi [`deduksi.ts`](lib/deduktif/badges/deduksi.ts): satu petunjuk, dua petunjuk satu kartu, atau dua petunjuk lintas kartu yang berbagi orang per langkah; uji kemungkinan hanya per kasus pada orang yang tinggal ≤3 pilihan. Alasan "karena …" hanya menyebut fakta yang memang mengubah hasil. Kandidat dengan >3 uji, >12 langkah, atau pembahasan >2.500 karakter ditolak (±1,5 menit per soal di tryout).
- **Tingkat**: dasar dan menengah selesai dengan satu petunjuk per langkah; menantang memerlukan gabungan petunjuk atau uji kemungkinan.

## Pengetahuan Sektor Jasa Keuangan

Tes PSJK (50 soal, 60 menit) mencakup 16 chapter dalam tiga kelompok latsol, di [`lib/psjk/`](lib/psjk/): `ojk-dasar/` (Pengenalan OJK dan Waspada Investasi, Perencanaan Keuangan), `perbankan-pembiayaan/` (Perbankan, Perusahaan Pembiayaan, Pergadaian, LKM, Lembaga Penjaminan, Modal Ventura, Digital Financial Literacy, Fintech), dan `investasi-proteksi/` (Asuransi, Dana Pensiun, Pasar Modal, Bulion, Aset Kripto, Keuangan Syariah). Soal pilihan ganda 5 opsi (A–E) dengan pembahasan format blueprint ditambah baris **Sumber**.

Pengetahuan faktual tidak dapat "dipecahkan" dari isi soal, jadi kebenarannya bersandar pada bank yang dikurasi dan bersumber. Mesin bersama [`lib/psjk/umum.ts`](lib/psjk/umum.ts) menjaga hal yang dapat diperiksa mesin:
- **Kurasi** (`familyKurasi`): butir ditulis utuh dengan pertanyaan, jawaban, dan ≥4 pengecoh yang masing-masing beralasan; seed mengambil 4 pengecoh. Termasuk soal kasus, KECUALI, dan pernyataan (1)–(4).
- **Relasi** (`familyRelasi`): tabel satu-satu (lembaga ↔ fungsi, istilah ↔ definisi) yang ditanyakan dua arah; pengecoh dari baris lain, solver memeriksa pasangan di tabel.
- **Hitung**: solver menghitung ulang rumus dari angka di soal; pengecoh berasal dari jalur salah hitung yang masuk akal (lupa satu pos, bunga sederhana, porsi tertukar). Sidik = jenis hitungan, jadi soal yang hanya berbeda angka dihitung satu struktur.
- Setiap butir mencatat `sumber` (e-book tim atau bahan resmi OJK di folder Drive riset, dengan bab/halaman) dan `berlakuPer` bila isinya bergantung pada aturan yang dapat berubah (UU 4/2023 P2SK beserta perubahan 2026, POJK, SEOJK, fatwa DSN-MUI). Fakta yang sumbernya bertentangan atau rawan usang dikeluarkan dari bank.

Ketiga kelompok sudah ditelaah QC independen terhadap e-book dan bahan resmi (kunci, jawaban ganda, fakta usang, kebocoran pola, bahasa, hitungan). Hal yang masih menunggu keputusan editor dicatat di [`bahan/Catatan Telaah Editor.md`](bahan/Catatan%20Telaah%20Editor.md).

## Paket tryout dan latsol

`npm run paket` ([`scripts/susun-paket.ts`](scripts/susun-paket.ts), logika di [`lib/paket/susun.ts`](lib/paket/susun.ts)) menyusun seluruh paket Mapping PCAM 10 OJK ke [`lib/data/paket.json`](lib/data/paket.json):
- **10 tryout** × 89 soal: Induktif 15 (18 menit), Deduktif 12 (18 menit), Bahasa Inggris 12 (15 menit), PSJK 50 (60 menit).
- **5 latsol** untuk setiap kelompok latsol Mapping (11 kelompok: Fill Shape, Drag the Line, lima bentuk Deduktif, Bahasa Inggris, dan tiga kelompok Ke-OJK-an) × 10 soal, 10 menit.
- Setiap slot diisi soal dari family chapter-nya; family dirotasi (SHL dua kali lebih sering bila ada). Satu struktur (family + sidik) hanya dipakai **sekali** di seluruh paket, jadi tidak ada soal kembar di dalam maupun antarpaket. Soal Reading diambil satu bacaan utuh dengan urutan soal tetap.
- Soal setiap chapter dibagi **merata** ke semua paket: campuran SHL/VARIASI dan tingkat dasar/menengah/menantang sebanding antartryout, huruf kunci setiap bagian seimbang (cadangan ±25% calon dipakai untuk itu), dan tiga kunci sama berturut-turut dihindari.
- Paket hanya menyimpan `uid` soal; halaman Paket membangkitkan ulang isi lengkap (soal, kunci, pembahasan) saat ditampilkan dan diunduh. Jalankan ulang `npm run paket` setelah family bertambah atau versinya naik; halaman Paket memperingatkan bila ada slot dari versi lama.
- Halaman Paket memakai perakit yang sama (`langkahSusun` dengan rencana dari `rencanaTryout`/`rencanaLatsol`) untuk paket lain: jumlah 1–20 paket, komposisi chapter dapat diubah, set bebas per chapter (`rencanaSet`), bobot tingkat opsional (kuota per tingkat + cadangan 25%; Reading tetap satu bacaan utuh), dan benih bebas. Tingkat yang strukturnya kurang meninggalkan slot kosong yang dilaporkan per chapter. Pengaturan baku dengan benih `pcam-10` menampilkan paket resmi dari `paket.json`; pengaturan lain disusun di peramban (10 tryout ±10 detik) dan hanya tersimpan bila diunduh. Satu struktur tetap hanya dipakai sekali di dalam satu hasil.

## QC 1 PCAM Tahap 2 (19 November 2026)

Hasil QC TO-01 diterapkan pada family, jadi berlaku untuk semua soal yang dibangkitkan, bukan hanya TO-01:
- **T09 SJK**: pembahasan peserta tidak lagi memuat baris "Sumber" maupun atribusi e-book/buku ("E-book menyebut…", "Buku 9:"); stimulus tanpa pengantar "Menurut Buku …"; soal tentang publikasi (LSPI dan tabel publikasi perbankan) dikeluarkan. Sumber penyusunan tetap di `item.data.sumber` (JSON/Studio). Penjaga [`lib/core/teks-peserta.ts`](lib/core/teks-peserta.ts) menolak soal SJK yang teks pesertanya masih menyebut buku, e-book, materi tim, atau LSPI.
- **F01** SMART (Attainable vs Realistic) dikeluarkan; kasus tujuan keuangan dijawab dari fakta stimulus. **F02** fidusia tidak disamakan dengan sertifikat tanah. **F03** perakit memisahkan dua soal satu paket yang saling membocorkan (kunci yang satu muncul di batang soal lain): tukar antarpaket, lalu ganti dengan calon cadangan bila perlu; `npm run paket` melaporkan jumlahnya (harus 0). **F07** asumsi bunga bulanan dan klausul pertanggungan di bawah harga dinyatakan di soal. **F08** alasan opsi salah Reading dibatasi pada isi bacaan.
- **PENGAYAAN**: butir susunan KSSK, istilah market confidence, LCR/NSFR, santunan asuransi sosial, pihak kontrak KIK, sekuritisasi/true sale, profesi penunjang/ASPM, dan nama mudharabah muqayyadah dikeluarkan. Finance lease/sale and leaseback dikeluarkan pada QC 2 (tidak ada di materi folder).
- **F04** Timeline: "Demo Aplikasi Klien" hanya disebut bila kegiatan itu ada di kalender. **T05** Room: batas tiga orang per ruangan menjadi kendali internal — tidak ditulis di soal/pembahasan; solver tidak memakainya, validator menolak jawaban yang melebihinya, dan RA-DURASI membuktikan pembagian 3–2 dari durasi.
- **T02** Drag the Line: tata letak diulang sampai setiap ruas jalur jawaban berjarak ≥ jari-jari simpul + 0,35 dari simpul lain. **T03** family berbasis deret (DL-SELANG, DL-BERTINGKAT, DL-SISIP, DL-OPERASI, DL-SIKLIS) dikeluarkan; Drag the Line 2 Character memakai DL-DOMINO (karakter bersama) dan DL-SAMBUNG-UJUNG (akhir–awal). **F05** DL-SIMBOL mengunci tiga simpul. **F06** kode simpul memakai font sans standar.
- Visual pembahasan (T01, T04, T07) dikerjakan pada QC 2, lihat di bawah.

## QC 2 PCAM Tahap 2 (24 November 2026)

Temuan QC paket a2e3derv (TO-01) diterapkan pada family, jadi berlaku untuk semua soal yang dibangkitkan:
- **R01 cakupan SJK**: butir yang bersumber hanya dari bahan di luar 16 materi folder tidak lagi dibangkitkan. Aturannya di [`lib/psjk/cakupan.ts`](lib/psjk/cakupan.ts): sumber butir harus menyebut e-book materi folder; butir bersumber campuran yang ternyata tidak ada di teks materi didaftar di `DIKELUARKAN` beserta alasannya. Penyaringnya dipasang di `familyKurasi`, `familyRelasi`, dan `familyHitung`, jadi butir lama tetap tersimpan dan dapat dipakai lagi bila materi folder ditambah. Penggantinya ditulis dari materi folder untuk Pengenalan OJK, Perencanaan Keuangan, Perbankan, Perusahaan Pembiayaan, Pergadaian, dan Pasar Modal. Nama rasio FPSB/SMART, sekuritisasi, wali amanat, penasihat investasi, DINFRA, LCR/NSFR, cara pembiayaan (finance lease dkk.), dan indeks survei tidak ditanyakan.
- **R02 visual pembahasan**: setiap soal Induktif dan Deduktif punya gambar pembahasan (SVG) dari [`lib/visual/`](lib/visual/index.ts): lajur per unsur/kelompok dan gabungan Gambar 1–5 (Fill Shape), papan jalur bernomor dan tabel penghubung (Drag the Line; kode kembar dibedakan label (a)/(b) dan letaknya), kalender eliminasi/giliran/sesi (Calendar), denah dan tabel penyaringan (Room), garis waktu sebelum–sesudah (Timeline), lajur urutan (Badges), serta blok durasi dan celah (Timeslot). Warna selalu disertai label, pola, atau garis. Gambar tampil di aplikasi (tombol Perbesar), di JSON (`pembahasan.gambar`), dan di Word. Label stimulus dan pembahasan memakai "Gambar 1"–"Gambar 5 (jawaban)", bukan G1–G5.
- **R03** CPD dihapus. **R04** Timeline rapat: ketiga peserta kosong pada waktu rapat semula (dijaga saat soal dibangun dan diperiksa validator). **R05** cara cepat Bentuk Kata menjelaskan fungsi kata pada kalimat itu. **R06** stem tanpa "Dalam materi …"; penjaga [`lib/core/teks-peserta.ts`](lib/core/teks-peserta.ts) juga menolak "menurut/dalam materi", "menurut referensi/sumber", dan CPD. **R07** klaim risiko reksa dana yang mutlak dihapus, cara cepat Timeslot memakai sisa waktu dan celah soal itu sendiri, dan klaim ketunggalan Fill Shape dibatasi pada keluarga aturan yang diperiksa.
- **T02/T08**: JSON Drag the Line memuat `tampilan` (jari-jari simpul, tebal garis dan tepi, ukuran font, kotak label, area sentuh, jarak ruas terdekat, ruang bebas). Angkanya berasal dari `TAMPILAN_DL` yang juga dipakai komponen penggambar, jadi sama dengan yang dilihat peserta di aplikasi ini.
- `npm run verify` kini juga menolak soal Induktif/Deduktif tanpa visual, dan setiap soal yang pembahasan Word-nya tidak memuat semua bagian yang tampil di aplikasi (Konsep, Kata kunci, langkah bernomor, alasan opsi salah, cara cepat, visual). Bagian pembahasan baru yang belum ditulis ke Word juga dilaporkan (`periksaPembahasanWord` di [`lib/ekspor/siadu.ts`](lib/ekspor/siadu.ts)).

## Ekspor SiAdu

Naskah Word mengikuti template Auto Input SiAdu yang juga dipakai Tahap 1, SKD, dan UTBK ([`lib/ekspor/siadu.ts`](lib/ekspor/siadu.ts)): `Soal N`, `Category`, `Lesson`, `Chapter` (tebal, dari Mapping), `Tingkat Kesulitan` (dasar → Mudah, menengah → Sedang, menantang → Sulit), `Bentuk Soal`, teks soal, pilihan `A.`–`E.`, `Jawaban`, dan `Pembahasan`; Times New Roman 12 pt, spasi 1,5. Satu berkas = satu paket × satu subtes, karena importir membaca semua teks setelah "Pembahasan:" sampai "Soal N" berikutnya.
- **Option New** (Bahasa Inggris dan PSJK, 820 soal): bacaan Reading diulang per soal; fragmen Sentence Arrangement ditulis "(A) …" agar tidak terbaca sebagai pilihan.
- **Logical Ranking** (Badges): tabel Nama | Deskripsi | Gambar | Posisi Urut dengan foto tersemat; kartu tanpa petunjuk diberi deskripsi netral karena SiAdu menolak deskripsi kosong.
- **Enam bentuk interaktif lain** (Fill Shape, Node Arrow Navigation, Calendar Date Selection, Place and Room Allocations, Timeline Scheduling, Timeslot Scheduling) belum punya template importir. Bentuk ini ditulis ke berkas `…-usulan.docx` terpisah: teks soal, baris Pengaturan, tabel data, dan kunci, untuk input manual sampai format resmi SiAdu diketahui.
- Pembahasan Word mengikuti urutan di aplikasi: jawaban, **Konsep**, **Kata kunci** (soal Bahasa Inggris dan Pengetahuan Sektor Jasa Keuangan), langkah bernomor "1.", "2.", … dengan indentasi gantung, visual, **Alasan opsi salah**, lalu **Cara cepat**. Nomor ditulis sebagai teks agar tetap terbaca oleh importir yang hanya mengambil teks.
- Visual pembahasan disisipkan sebagai PNG setelah langkah pembahasan ("Gambar: …").
- Impor ke SiAdu sungguhan belum diuji, termasuk gambar di dalam Pembahasan; struktur berkas diperiksa dengan membaca ulang XML Word.

## Foto orang

Calendar Date Selection dan Room Allocations memakai foto dari folder **Asset Generator** di Google Drive tim: 26 foto Calendar dan 26 foto Room sudah terpasang di `public/foto/` (November 2026). Nama tanpa foto tampil sebagai inisial berwarna. Bila aset di Drive berubah, pasang ulang:
1. Di Google Drive tim, unduh folder **Asset Generator** (klik kanan → Download) lalu ekstrak ZIP-nya.
2. Jalankan:

   ```bash
   node scripts/impor-foto.mjs "C:/Users/<nama>/Downloads/Asset Generator"
   ```

Skrip menyalin PNG yang namanya cocok dengan daftar nama di `lib/data/nama.ts` ke `public/foto/kalender/` dan `public/foto/ruangan/`, lalu menulis `lib/data/foto.json`. Foto Calendar berasal dari tangkapan layar SHL dan foto Room dari randomuser.me; pastikan hak pakainya sebelum situs dibuka untuk umum. Badges memakai foto bank aset Tahap 1.

## Status

Angka dalam kurung = sidik struktur unik per 300 seed untuk Deduktif, Bahasa Inggris, dan PSJK, dan per 1.000 seed untuk Induktif (`npm run verify -- 1000 FS-`). Angka kecil yang sama pada 300 dan 1.000 seed berarti family itu sudah jenuh: itulah seluruh struktur yang mungkin.

| Chapter | Family |
|---|---|
| Calendar Date Selection | CDS-A0 irisan ketersediaan (SHL, 300), A1/A2/A3 (VARIASI); CDS-B0 giliran berurutan (SHL, 286), B1/B2/B3 (VARIASI); CDS-C0 sesi beberapa hari (SHL, 284), C1/C2/C3 (VARIASI) |
| Room Allocations | RA-SAMA-BEDA v2 (SHL, 25), RA-KANTOR divisi + denah (SHL, 177), RA-DURASI durasi rapat (SHL, 27) |
| Timeline Scheduling | TL-RAPAT (SHL, 300), TL-RUANG (SHL, 300), TL-PETUGAS (SHL, 65); TL-RAPAT-PANJANG, TL-RAPAT-AKHIR, TL-PETUGAS-BEBAS, TL-PETUGAS-AMBANG (VARIASI) |
| Timeslot Scheduling | TS-P1 urutan + target sedini (SHL, 221), TS-P2 tenggat + terakhir (SHL, 269), TS-P3 sumber daya (SHL, 229); TS-D1…D5 pengembangan (VARIASI) |
| Badges (Logical Ranking) | BDG-SHL-TIBA urutan tiba (SHL, 140), BDG-SHL-KANTOR tiba di kantor (SHL, 262), BDG-SHL-GAJI peringkat gaji + "jika" (SHL, 286); BDG-V-DASAR (297), BDG-V-MENENGAH (300), BDG-V-MENANTANG (300) (VARIASI) |
| Fill Shape - Six-pointed Star | FS-HEX-JALUR beberapa unsur dengan lintasan berbeda (SHL, 823), FS-HEX-TUKAR tukar lapisan + cermin (SHL, 830); FS-HEX-KECEPATAN, FS-HEX-PUTAR-TUKAR (VARIASI) |
| Fill Shape - Square | FS-SQ-LINTAS jalur luar–dalam (SHL, 56), FS-SQ-LANGKAH langkah bertambah (SHL, 16), FS-SQ-TUKAR tukar lapisan + cermin (SHL, 992); FS-SQ-PUTAR-TUKAR, FS-SQ-BERGANTIAN, FS-SQ-KECEPATAN (VARIASI) |
| Fill Shape - Inverted Pentagram | FS-PENTA-KOSONG bidang kosong + warna pusat (SHL, 110), FS-PENTA-LAPIS ritme dua lapisan (SHL, 8); FS-PENTA-PUSAT, FS-PENTA-TIGA (VARIASI) |
| Fill Shape - Triangle | FS-TRI-KOSONG pergiliran bidang kosong (SHL, 168); FS-TRI-SIKLUS, FS-TRI-PANTUL (VARIASI) |
| Drag the Line - 2 Character | DL-SELANG huruf–angka berselang-seling (SHL, 879); DL-BERTINGKAT, DL-SISIP, DL-OPERASI (VARIASI) |
| Drag the Line - 3 Character | DL-SIMBOL O/X bergiliran (SHL, 48), DL-RANTAI satu karakter sama (SHL, 1000), DL-GESER selisih menggeser alfabet (SHL, 1000); DL-AKHIR-AWAL, DL-BINER (VARIASI) |
| Drag the Line - 4 Character | DL-LUBANG ruang tertutup huruf (SHL, 1000); DL-SIKLIS hipotesis hlm. 17, DL-ROTASI (VARIASI) |
| Drag the Line - Special Character | DL-HITUNG rantai × ÷ (SHL, 825), DL-ARAH simbol arah (SHL, 241); DL-ARAH-LEBAR, DL-HITUNG-CAMPUR (VARIASI) |
| Sentence Completion | SC-ADJ adjective dalam konteks (SHL, 23), SC-NOUN noun + tujuan/kolokasi (SHL, 20), SC-VERB verb + preposisi/kolokasi (SHL, 21); SC-BENTUK bentuk kata (23), SC-VERBA tense/passive/agreement (18), SC-KONEKTOR penghubung (14) (VARIASI) |
| Sentence Improvement | SI-GER-PREP gerund setelah preposisi (SHL, 75), SI-GER-TO to sebagai preposisi (SHL, 47); SI-KOMPLEMEN (82), SI-PARALEL (50), SI-AGREEMENT (34), SI-TENSE (28) (VARIASI) |
| Grammatically Correct Sentence | GCS-SVA-WAKTU agreement + preposisi waktu (SHL, 69), GCS-WAKTU (SHL, 14); GCS-MODAL-PASIF (14), GCS-NOUN-CLAUSE (13), GCS-KUANTIFIER (12), GCS-PRONOMINA (17) (VARIASI) |
| Sentence Arrangement | SA-FRASA noun phrase dan complement (SHL, 12); SA-KLAUSA noun clause (12), SA-INFINITIF verb + infinitive (12) (VARIASI) |
| Reading Comprehension | RC-OJK bacaan 3–4 soal (SHL, 40), RC-SHL bacaan pendek 1–2 soal (SHL, 26, tidak masuk paket); RC-VAR (VARIASI, 28) — 30 bacaan |

Catatan tafsir yang dikunci di kode dan ditulis eksplisit di soal: CDS-C memakai jadwal mulai tanggal 1, setiap sesi dimulai pada hari kerja paling awal yang memungkinkan, tanggal larangan tetap hari kerja (ikut terhitung dalam jeda) — kunci sumber hlm. 21–22 tidak diterbitkan ulang; TL-RUANG memakai pembongkaran 30/60 menit (sumber 45 menit tidak muat di grid 30 menit); TL-PETUGAS menjadwalkan tim jawaban hanya saat kurang dengan total minimum; "semua kegiatan sedini mungkin" (TS-P3) = susunan yang tidak dapat dipercepat tanpa memperlambat kegiatan lain (Pareto); "Ruang Pertemuan hanya jika tidak ada ruang biasa yang memenuhi" (RA-KANTOR) dinilai setelah semua ketentuan lain, per orang, tanpa bergantung urutan seret.

Catatan Induktif:
- Model "tiga fase + penanda" hlm. 3 tidak dibangun; blueprint menyatakannya belum terverifikasi.
- FS-HEX-TUKAR memakai mekanisme hlm. 7 pada bintang enam. Blueprint mengizinkan label SHL bila wadahnya punya hubungan bidang yang setara.
- FS-SQ-LANGKAH hanya punya 16 struktur. Hanya langkah ±2, ±4, ±6 sektor (sama dengan sumber) yang lolos; langkah lain juga cocok dengan "cermin lalu geser bergantian", sehingga ditolak sebagai jawaban ganda.
- FS-PENTA-LAPIS hanya punya 8 struktur. Potongan stimulus harus dimulai di akhir satu warna pusat, dan tidak boleh ada gambar yang seluruhnya putih.
- Dalam pustaka aturan, operasi berselang-seling hanya boleh berupa operasi bidang, tidak boleh berupa pergantian warna.
- DL-SIKLIS diberi label VARIASI. Pembahasannya menyatakan bahwa jawaban berlaku menurut aturan yang diasumsikan.
- Huruf I/O ditolak pada kode campuran huruf dan angka karena mudah tertukar dengan 1/0.

PSJK (angka = sidik struktur unik per 300 seed; kebutuhan paket dalam kurung siku). Setiap chapter punya family SHL (fakta/istilah langsung) dan VARIASI (kasus, relasi, hitung):

| Chapter | Family |
|---|---|
| Pengenalan OJK dan Waspada Investasi [115] | PSJK-OJK-LEMBAGA (SHL, 33), PSJK-OJK-KONSUMEN (SHL, 37); PSJK-OJK-KASUS (33), PSJK-OJK-RELASI-LEMBAGA (61), PSJK-OJK-RELASI-KONSUMEN (48) |
| Perencanaan Keuangan [45] | PSJK-PK-KONSEP (SHL, 32); PSJK-PK-KASUS (20), PSJK-PK-RELASI (34), PSJK-PK-HITUNG (19) |
| Perbankan [85] | PSJK-BANK-ISTILAH (SHL, 58), PSJK-BANK-LEMBAGA (SHL, 48); PSJK-BANK-KASUS (38), PSJK-BANK-HITUNG (10) |
| Perusahaan Pembiayaan [35] | PSJK-PP-ISTILAH (SHL, 20); PSJK-PP-KASUS (28), PSJK-PP-HITUNG (7) |
| Pergadaian [25] | PSJK-GADAI-ISTILAH (SHL, 26); PSJK-GADAI-KASUS (18), PSJK-GADAI-HITUNG (6) |
| Lembaga Keuangan Mikro [15] | PSJK-LKM-ISTILAH (SHL, 24); PSJK-LKM-KASUS (18), PSJK-LKM-HITUNG (4) |
| Lembaga Penjaminan [15] | PSJK-JAMIN-ISTILAH (SHL, 26); PSJK-JAMIN-KASUS (18), PSJK-JAMIN-HITUNG (3) |
| Perusahaan Modal Ventura [15] | PSJK-MV-ISTILAH (SHL, 26); PSJK-MV-KASUS (12), PSJK-MV-HITUNG (6) |
| Digital Financial Literacy [25] | PSJK-DFL-ISTILAH (SHL, 26); PSJK-DFL-KASUS (17), PSJK-DFL-HITUNG (3) |
| Fintech [35] | PSJK-FINTECH-ISTILAH (SHL, 28); PSJK-FINTECH-KASUS (22), PSJK-FINTECH-HITUNG (4) |
| Asuransi [50] | PSJK-ASR-FAKTA (SHL, 15); PSJK-ASR-RELASI (60), PSJK-ASR-KASUS (20), PSJK-ASR-HITUNG (28) |
| Dana Pensiun [25] | PSJK-DAPEN-FAKTA (SHL, 10); PSJK-DAPEN-RELASI (30), PSJK-DAPEN-KASUS (14), PSJK-DAPEN-HITUNG (12) |
| Pasar Modal [75] | PSJK-PM-FAKTA (SHL, 14); PSJK-PM-PELAKU (38), PSJK-PM-ISTILAH (54), PSJK-PM-KASUS (18), PSJK-PM-HITUNG (24) |
| Bulion [15] | PSJK-BULION-FAKTA (SHL, 8); PSJK-BULION-RELASI (12), PSJK-BULION-KASUS (10), PSJK-BULION-HITUNG (12) |
| Aset Kripto [25] | PSJK-KRIPTO-FAKTA (SHL, 8); PSJK-KRIPTO-RELASI (44), PSJK-KRIPTO-KASUS (12), PSJK-KRIPTO-HITUNG (8) |
| Keuangan Syariah [50] | PSJK-SYARIAH-FAKTA (SHL, 14); PSJK-SYARIAH-RELASI (44), PSJK-SYARIAH-KASUS (19), PSJK-SYARIAH-HITUNG (20) |

Ekspor ke SIADU belum dibuat karena format input tipe interaktif belum diketahui.
