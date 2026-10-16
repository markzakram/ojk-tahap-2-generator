# Generator Soal OJK PCAM Tahap 1 (Tes Potensi Dasar)

Membuat **paket soal** Tes Potensi Dasar OJK PCAM Tahap 1 lengkap dengan kunci dan pembahasan langkah demi langkah:

- **Kemampuan Umum** (pilihan ganda A-E): verbal, soal cerita, tabel, grafik batang, dan figural (serial dan matriks).
- **Penalaran Numerik** (soal interaktif): bar chart, tabel, line graph, dan pie chart. Jawabannya berupa *kondisi akhir tampilan*, bukan huruf.

Setiap soal dibuat dari angka dan fakta yang dihitung, lalu **dicek ulang dari nol oleh validator independen**. Hasil baru tampil atau ditulis ke berkas kalau semuanya lulus, dan tidak ada dua soal yang sama atau nyaris sama dalam satu kali generate, baik dalam satu paket maupun antarpaket.

Berjalan **tanpa instalasi apa pun dan tanpa internet**: tidak ada `npm install`, tidak ada pustaka luar. Antarmuka cukup dibuka dari `index.html`; CLI butuh Node.js 20 atau lebih baru.

## Cara pakai

### 1. Di peramban

Buka `index.html` (klik dua kali; tidak perlu server).

1. **Subtes**: Kemampuan Umum, Penalaran Numerik, atau keduanya.
2. **Soal tiap submateri**: jumlah soal per submateri dalam satu paket (baku: Kemampuan Umum 12 soal, Penalaran Numerik 10 soal). Tombol *Baku* mengembalikan komposisi awal.
3. **Tingkat kesulitan**: campur (mudah:sedang:sulit = 3:5:2, bisa diubah) atau satu tingkat saja.
4. **Jumlah paket dan benih**: 1 sampai 500 paket. Benih yang sama dengan pengaturan yang sama selalu menghasilkan paket yang sama persis. Kosong atau tombol *Acak* memakai benih acak; nilainya tetap ditampilkan supaya bisa diulang.
5. **Generate paket**. Paket dibuat bertahap dengan penunjuk kemajuan, lalu diperiksa validator (juga bertahap, jadi layar tidak membeku; 500 paket sekitar 30 detik). Kalau ada yang gagal, tidak ada paket yang ditampilkan.
6. Di tengah ada **pratinjau**: pilih paket dan subtes, centang *Tampilkan kunci dan pembahasan*, atau klik pilihan A-E untuk berlatih (jawaban salah/benar langsung ditandai).
7. Soal **Penalaran Numerik**: tekan *Coba interaktif*. Seret lingkaran pada batang, titik, atau batas irisan (menempel ke kelipatan yang sah), atau isi kolom angkanya, tekan *Periksa jawaban*, *Lihat kunci*, atau *Ulang dari awal*. Pada tabel, pilih tab Orang A-D lalu pilih jawabannya.
8. **Unduh** di panel kanan: Word dan PDF untuk paket yang sedang dilihat; Excel dan JSON untuk semua paket; ZIP berisi gabungan (Word, PDF, Excel, JSON, gambar PNG). Di bawah gambar soal ada tombol PNG dan SVG. Panel kanan juga menampilkan **perintah CLI yang setara** dengan pengaturan di layar.

Word dan PDF diunduh per paket. ZIP yang berisi Word, PDF, atau gambar PNG dibatasi **40 paket** di peramban (memori); untuk lebih banyak pakai CLI, atau buat ZIP yang hanya berisi Excel dan JSON.

### 2. Dari baris perintah (CLI)

```
node cli/generate.js --paket 5 --subtes semua --format docx,pdf,xlsx,json --benih 2026
```

| Opsi | Arti |
|---|---|
| `--paket <n>` | Jumlah paket, 1 sampai 500. Baku 1. |
| `--subtes <ku\|pn\|semua>` | Subtes yang dibuat. Baku `semua`. |
| `--format <daftar>` | Format keluaran dipisah koma: `docx`, `pdf`, `xlsx`, `json`, atau `semua`. Baku semua. Pintasan: `--docx --pdf --xlsx --json`. |
| `--zip` | Tambahkan satu berkas ZIP berisi semua hasil. |
| `--benih <n>` | Bilangan bulat 0 sampai 4294967295. Tanpa opsi ini benih diacak dan dicetak di akhir. |
| `--keluaran <folder>` | Folder induk hasil. Baku `output` (di folder generator). Hasil ditulis ke `<folder>/<waktu>/`, mis. `output/2026-10-15_101530/`. |
| `--tanpa-waktu` | Tulis langsung ke folder `--keluaran`, tanpa subfolder waktu. |
| `--tingkat <t>` | `campur` (baku), `mudah`, `sedang`, atau `sulit`. |
| `--proporsi <m:s:u>` | Perbandingan mudah:sedang:sulit saat tingkat campur. Baku `3:5:2`. |
| `--komposisi-ku <daftar>` | Soal per submateri Kemampuan Umum, mis. `verbal=4,cerita=2,tabel=2,grafik=1,serial=2,matriks=1`. Yang tidak disebut memakai nilai baku; isi `0` untuk meniadakan. |
| `--komposisi-pn <daftar>` | Soal per submateri Penalaran Numerik, mis. `bar=3,tabel=3,garis=2,pie=2`. |
| `--skala <n>` | Skala gambar PNG 1 sampai 4. Baku 2. |
| `--svg-json` | Sertakan teks SVG tiap gambar di JSON. |
| `--periksa-saja` | Hanya membuat dan memeriksa paket; tidak ada berkas yang ditulis. |
| `--help` | Bantuan lengkap. |

Contoh lain:

```
node cli/generate.js --paket 100 --subtes ku --format xlsx,json --zip     # ratusan paket: Excel dan JSON saja
node cli/generate.js --paket 20 --tingkat mudah --xlsx --json
node cli/generate.js --paket 10 --proporsi 1:1:1 --keluaran D:/soal --tanpa-waktu
node cli/generate.js --paket 50 --periksa-saja                             # cek kapasitas dan validator saja
```

**Keluaran program.** Selama bekerja dicetak kemajuan. Berkas utama dicetak sebagai `BERKAS -> <path>`, dan baris terakhir selalu:

- `HASIL: 5 paket, 110 butir, validator lulus 110/110, 0 kembar, benih 2026; ...; folder <path>` (kode keluar 0), atau
- `GAGAL: <alasan>` (kode keluar 1), misalnya `GAGAL: --paket harus bilangan bulat 1 sampai 500, bukan 0` atau `GAGAL: validator menolak hasil (...); tidak ada berkas yang ditulis`.

**Isi folder hasil** (`output/<waktu>/`):

```
paket-001/paket-001.docx       naskah soal, kunci jawaban, dan pembahasan (Word)
paket-001/paket-001.pdf        isi yang sama dalam PDF
paket-001/gambar/*.png         gambar soal dan kondisi kunci, mis. P001-KU-05-tabel.png
soal-ojk-tahap1.xlsx           satu baris per soal untuk semua paket, plus lembar Ringkasan
soal-ojk-tahap1.json           seluruh data soal, kunci, pembahasan, dan hasil validator
ringkasan.txt                  ringkasan, hasil validator, dan perintah untuk mengulang persis
soal-ojk-tahap1.zip            semuanya, bila memakai --zip
```

Sepasang Word, PDF, dan gambar satu paket memakan sekitar 3 detik; membuat paketnya sendiri jauh lebih cepat (500 paket sekitar 40 detik termasuk pemeriksaan validator). Contoh hasil dua paket ada di `contoh-keluaran/` (dibuat dengan `node cli/generate.js --paket 2 --benih 2026 --keluaran contoh-keluaran --tanpa-waktu`).

### 3. Lewat Agent Office (tanpa token)

`agent-office.json` mendaftarkan dua pekerjaan untuk karyawan operator project ini:

- **Buat paket OJK Tahap 1** (`cli/generate.js`): isian *Subtes*, *Jumlah paket*, *Tingkat kesulitan*, *Proporsi*, *Soal per submateri* (Kemampuan Umum dan Penalaran Numerik), *Benih*, dan centang format Word, PDF, Excel, JSON, serta ZIP. Berkas Excel, JSON, dan ZIP muncul sebagai tombol *Buka hasil*; ringkasan HASIL menjadi laporan.
- **Uji generator OJK Tahap 1** (`uji/semua.js`): centang *Mode cepat* (sekitar 30 detik) atau jalankan uji lengkap (sekitar 1 menit); *Tambah uji kapasitas* menambah sekitar 3 menit.

Kalau opsi CLI berubah, perbarui `agent-office.json` di perubahan yang sama (aturan project ini); uji `uji/semua.js` memeriksa bahwa tiap opsi di sana ada di `--help` dan di isi script.

## Bentuk soal per submateri

Tiap soal punya **stimulus, pertanyaan, pilihan A-E** (atau bentuk isian), **kunci**, **pembahasan langkah demi langkah** dengan alasan mengapa tiap pengecoh keliru, dan **tingkat kesulitan** (mudah, sedang, sulit). Ada 32 keluarga soal.

### Kemampuan Umum (12 soal baku, 10 menit)

| Submateri | Bentuk | Keluarga soal |
|---|---|---|
| Verbal (2) | Bacaan pendek lalu satu pernyataan: **Benar / Salah / Tidak Diketahui** (tiga pilihan). Tujuh topik: perbankan digital, asuransi, pasar modal, pembiayaan berbasis teknologi, literasi keuangan daerah, energi terbarukan, transportasi. | 1 keluarga; jenis pernyataan: nilai, perbandingan, jumlah, sifat, daftar, tahun, syarat perlu |
| Numerik: Soal cerita (2) | Cerita hitungan, 5 pilihan angka | pecahan dan persen pada sisa zat, persentase peningkatan kecepatan, dua persamaan tiga benda, balik modal mesin, bulan lunas dengan laba naik, selisih pendapatan penjual, perbandingan campuran, diskon berlapis, konversi mata uang (£, €, $) |
| Numerik: Tabel (3) | Tabel data (gambar) + pertanyaan | perbandingan dua baris, persentase gabungan dua kelompok, tahun sampai melampaui, biaya rata-rata per mesin, kenaikan laba produk, unit terjual yang hilang, harga per satuan dan konversi mata uang, persentase perubahan |
| Numerik: Grafik batang (1) | Grafik batang (gambar) + pertanyaan | tim dengan hasil baik terbanyak, perubahan total dua seri, persen sumbangan batang, perbandingan dua batang |
| Figural: Serial (2) | Deret kotak + "?" , pilihan A-E berupa gambar | deret atribut (bentuk wadah, warna, arah panah, titik, jumlah kotak kecil, penanda pojok) dan deret bentuk yang **berputar** ("The Next Box") |
| Figural: Matriks (2) | Matriks dengan satu kotak "?", pilihan A-E berupa gambar | matriks 3x3 (latin, baris/kolom tetap, langkah, xor, jumlah) dan matriks 2x2 (penambahan) |

### Penalaran Numerik (10 soal baku, 18 menit), interaktif

| Submateri | Yang dilakukan peserta | Bentuk |
|---|---|---|
| Bar chart (3) | Mengatur **total** dua batang bertumpuk (kelipatan sesuai soal) dan **persentase** kedua bagiannya (kelipatan 5%) | 10 bingkai topik (asuransi, pendapatan, anggaran, produksi, kredit, klaim, dana pihak ketiga, dompet digital, reksa dana, pajak daerah); hubungan: total naik/turun persen atau nominal, bagian naik persen/nominal, atau sekian persen dari total |
| Table (3) | Memilih jawaban di **tab Orang A-D** | mencapai target atau tidak (2 opsi, dua syarat); kategori komisi/insentif/bonus (3-4 opsi) dari rata-rata nilai penjualan bersih |
| Line graph (2) | Menggeser **lima titik** ke nilainya (menempel ke kelipatan yang sah) | nilai rekening saham, stok gudang, saldo tabungan, suhu ruang pendingin, area cakupan; dengan perubahan tetap atau persen dan peristiwa tambahan |
| Pie chart (2) | Menggeser **batas irisan** (kelipatan 1%) sampai keempat persentase sesuai keterangan | informasi penuh, atau satu informasi kosong (dasar dicari dari jumlah dan hubungan antaririsan) |

Di naskah Word/PDF soal interaktif ditulis sebagai **tampilan awal + lembar isian**, dan kondisi akhir (kunci) tampil sebagai gambar di bagian pembahasan.

## Cara kerja

### Pembuatan soal dan benih

Semua pengacakan diturunkan dari benih utama, nomor paket, subtes, nomor soal, dan nomor percobaan (pengacak berbenih sendiri). Akibatnya hasil bisa diulang persis dan **paket nomor N tidak bergantung pada jumlah paket yang diminta**. Keluarga soal berputar di dalam submateri supaya tidak ada dua soal sekeluarga dalam satu paket selama keluarganya masih cukup, tingkat kesulitan dibagi menurut proporsi, dan **huruf kunci A-E dibuat merata** (tiap huruf hampir sama banyak per paket).

### Validator independen (`js/validator.js`)

Validator tidak memercayai kunci yang tersimpan dan tidak memanggil kode penyusun soal. Ia menghitung ulang dari data dan gambar yang benar-benar tampil, memakai **pecahan eksak** (BigInt), bukan bilangan kambang:

- **Soal cerita**: mengevaluasi ulang langkah hitung dengan parser rumus sendiri, mencocokkan setiap angka yang tercetak di soal dengan angka yang dihitung, dan memastikan **hanya satu opsi** yang bernilai sama dengan hasil.
- **Tabel dan grafik**: membaca sel dan batang dari **SVG yang digambar** (batang diukur terhadap garis bantu), lalu menghitung.
- **Verbal**: menurunkan Benar/Salah/Tidak Diketahui dari **fakta** yang dipakai merakit bacaan, dan memastikan fakta pengecoh tidak menyentuh atribut yang ditanyakan.
- **Figural**: menebak aturan tiap kanal dari kotak yang tampak (`js/inferensi.js`, sengaja tidak berbagi kode dengan penyusun) dan memastikan **tepat satu opsi** memenuhi semua aturan; untuk deret berputar, yang diperiksa adalah gambar deret dan gambar opsi yang tampil.
- **Interaktif**: menghitung ulang kondisi akhir (total dan persen batang, nilai tiap titik, persentase irisan lewat sistem persamaan linear eksak, keputusan tiap tab tabel), dan memastikan tampilan awal tidak sudah benar.
- **Pengecoh**: semuanya berbeda satu sama lain dan dijamin salah.
- **Paket dan hasil**: komposisi, nomor, dan id konsisten; **tidak ada butir kembar**.

Validator juga diuji **terbalik** (`uji/negatif.js`): soal yang sengaja dirusak (kunci digeser, dua opsi sama-benar, angka tabel, grafik, atau parameter diubah, kondisi awal disamakan dengan kunci, id ganda, butir kembar) harus ditolak semuanya. Uji itu pernah menemukan dua celah (deret berputar dan pie), yang sudah ditutup.

### Anti-kembar

Dua butir dinyatakan kembar kalau: sidik inti sama persis; atau (figural) kotak yang tampak sama dengan paling banyak satu kotak berbeda; atau 3-gram kata teks (angka ikut dihitung) mirip sekurang-kurangnya 85%; atau kerangka dan pelaku sama dan hanya satu angka yang berbeda. Penjaga ini dijalankan **saat soal dipilih** (lintas paket dalam satu kali generate) dan sekali lagi oleh validator terhadap seluruh hasil.

### Gambar tanpa dependensi

Soal hanya menyimpan **model** gambar (data murni); SVG dirakit saat dibutuhkan. Untuk PNG, Word, dan PDF ada penggambar piksel sendiri (`js/svgraster.js`: penguraian SVG, isian, garis, teks dari font garis, anti-alias) dan penulis PNG sendiri. Di peramban, PNG dibuat oleh kanvas bawaan (huruf sistem). Word (`js/docx.js`), PDF (`js/pdf.js`, tata letak sendiri, font standar Helvetica), Excel (`js/xlsx.js`), dan ZIP (`js/zip.js`) ditulis tanpa pustaka.

## Format ekspor

- **Word dan PDF** (per paket): naskah soal per subtes (tiap subtes mulai di halaman baru), **kunci jawaban** (tabel ringkas), lalu **pembahasan** langkah demi langkah dengan gambar kondisi kunci untuk soal interaktif. Word terbuka dalam mode normal, bukan Mode Kompatibilitas.
- **Excel** (`soal-ojk-tahap1.xlsx`), lembar *Soal*, **satu baris per soal**. Kolom wajib: `no, paket, subtes, submateri, level, soal, opsi_a, opsi_b, opsi_c, opsi_d, opsi_e, jawaban_benar, pembahasan, berkas_gambar`. Tambahan: `id, benih, keluarga, bentuk_isian, kunci_isian, berkas_gambar_pembahasan`. Untuk soal bergambar, `berkas_gambar` dan opsi menuliskan nama berkas PNG yang ada di `paket-NNN/gambar/`. Lembar *Ringkasan* menghitung soal per paket, submateri, dan tingkat.
- **JSON**: seluruh paket dan soal (stimulus, pertanyaan, opsi, kunci, langkah hitung, pembahasan, model gambar, bentuk isian dan nilai jawaban untuk soal interaktif) plus hasil validator.
- **PNG**: gambar soal dan gambar kondisi kunci, diberi nama `<id soal>-<id gambar>.png`.
- **ZIP**: gabungan di atas (ZIP biasa, tanpa ZIP64: paling banyak sekitar 4 GB dan 65.534 berkas).

## Kapasitas dan kecepatan

Terukur di komputer pengembangan (Node.js 24):

| Pengaturan | Hasil |
|---|---|
| 500 paket `semua` (11.000 butir) | berhasil, validator lulus 11.000/11.000, 0 kembar, kunci A-E merata; sekitar 40 detik termasuk validator |
| 500 paket `ku` (6.000 butir) dan `pn` (5.000 butir) | berhasil, 0 kembar; sekitar 13 dan 30 detik |
| 500 paket dengan tingkat `sedang` saja atau `sulit` saja | berhasil (pembuatan sekitar 22 detik) |
| tingkat `mudah` saja | 300 paket berhasil (250 paket, 5.500 butir, lulus validator tanpa kembar dalam sekitar 17 detik); batasnya sekitar 308 paket (Line graph tingkat mudah paling sempit), lebih dari itu berhenti dengan pesan jelas |
| Word + PDF + gambar | sekitar 3 detik dan 6 MB per paket |

Komposisi kustom yang memusatkan banyak soal pada satu submateri, atau tingkat tunggal dengan paket sangat banyak, bisa menghabiskan bank soal lebih cepat. Pembuatan paket lalu berhenti dengan pesan `butir ... gagal disusun ... kapasitas bank untuk submateri ini mungkin habis`; kurangi jumlah paket, ganti benih, atau longgarkan komposisi.

## Struktur folder

```
index.html            antarmuka peramban
css/style.css
js/                   modul (script klasik, bentuk UMD: jalan di peramban dan Node)
  rng.js metrik.js format.js hitung.js     pengacak berbenih, huruf, format angka Indonesia, pecahan eksak
  svg.js font.js svgraster.js png.js kempis.js raster.js    gambar SVG dan PNG tanpa dependensi
  chart.js kamus.js pilihan.js butir.js    grafik/tabel SVG, perakit butir, pengecoh
  cerita.js tabelku.js grafikku.js verbal.js figural.js serial-putar.js inferensi.js
  figure.js families.js render.js          mesin bentuk figural (disalin dari Figural Kesesuaian Generator)
  pn-bar.js pn-tabel.js pn-garis.js pn-pie.js   Penalaran Numerik
  gambar.js bank.js paket.js               deskriptor gambar, daftar keluarga soal, perakit paket
  validator.js                             pemeriksa independen
  dokumen.js docx.js pdf.js xlsx.js zip.js ekspor.js   penulis berkas
  coba.js app.js                           mode coba interaktif dan perekat antarmuka
cli/generate.js       perintah baris
uji/                  uji: semua.js (jalankan ini), negatif.js, berkas.js, browser.js, peramban.js
contoh-keluaran/      contoh dua paket (Word, PDF, Excel, JSON, PNG)
agent-office.json     pekerjaan tanpa token untuk Agent Office
output/               dibuat saat CLI dijalankan (diabaikan git)
```

## Uji

```
node uji/semua.js              # lengkap: sekitar 1 menit
node uji/semua.js --cepat      # sekitar 30 detik
node uji/semua.js --besar      # tambah uji kapasitas 500 paket (sekitar 3 menit lebih lama)
node uji/semua.js --tanpa-peramban
node uji/negatif.js            # hanya validator negatif
node uji/browser.js            # hanya antarmuka (perlu Chrome atau Edge dan Node.js 22+)
```

`uji/semua.js` memeriksa: (1) paket per subtes dengan beberapa benih berbeda (validator, kembar, komposisi, kunci A-E); (2) benih dan komposisi; (3) validator negatif; (4) logika mode coba; (5) isi berkas Word, PDF, PNG, Excel, JSON, dan ZIP (ZIP dibuka dan CRC dicocokkan, XML diperiksa, Word bukan Mode Kompatibilitas, subtes kedua mulai di halaman baru, tabel xref PDF dicek, data PNG didekompresi); (6) CLI termasuk semua jalur gagal; (7) `agent-office.json`; (8) `contoh-keluaran/`; (9) antarmuka di Chrome/Edge tanpa kepala, termasuk menyeret widget dengan mouse sungguhan dan mengunduh semua jenis berkas. Hasil sementara ditulis ke folder sementara sistem, bukan ke project. Baris terakhir `HASIL: ...` atau `GAGAL: ...`.

## Batasan dan hal yang perlu dipertimbangkan

- **Bentuk soal dipelajari dari riset**, bukan salinan soal OJK. Komposisi baku (12 soal Kemampuan Umum, 10 soal Penalaran Numerik; 10 dan 18 menit) adalah asumsi dari riset dan bisa diubah per paket; sebaiknya dicocokkan dengan kisi-kisi resmi terbaru.
- **Verbal dirakit dari fakta dan templat**, bukan ditulis bebas. Kebenarannya pasti, tetapi gaya bahasanya cenderung seragam dan topiknya terbatas pada tujuh tema.
- **Huruf pada PNG buatan CLI** memakai font garis sendiri (mirip Helvetica), sedikit berbeda dari huruf sistem yang dipakai peramban. Isi Word dan PDF tidak terpengaruh: keduanya memuat gambar yang sama.
- **Word dan PDF diuji strukturnya** (ZIP, XML, tabel xref, gambar) dan PDF dirender untuk pemeriksaan visual. Contoh Word di `contoh-keluaran/` juga sudah dibuka di Microsoft Word 16 (16 Okt 2026): terbuka tanpa perbaikan otomatis, dalam mode normal, dan tata letaknya (35 dan 34 halaman) diperiksa dari PDF ekspor Word. Uji otomatis tidak menjalankan Word. Beberapa halaman PDF/Word memuat ruang kosong karena soal dijaga agar tidak terpotong antarhalaman.
- **Soal interaktif** di Word/PDF tidak bisa diklik; yang interaktif hanya antarmuka peramban.
- **Batas ZIP**: tanpa ZIP64, jadi ZIP semua Word, PDF, dan PNG untuk ratusan paket bisa mendekati batas 4 GB. Pakai `--format xlsx,json` untuk ratusan paket.
- **Kapasitas bank** terbatas (lihat bagian Kapasitas); paket tingkat `mudah` saja dibatasi sekitar 308 paket.
- Uji antarmuka butuh Chrome atau Edge terpasang dan Node.js 22+ (WebSocket bawaan); kalau tidak ada, bagian itu dilewati.
