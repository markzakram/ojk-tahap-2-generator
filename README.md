# Generator Soal OJK PCAM Tahap 1 (Tes Potensi Dasar)

Membuat **paket soal** Tes Potensi Dasar OJK PCAM Tahap 1 lengkap dengan kunci dan pembahasan langkah demi langkah:

- **Kemampuan Umum** (pilihan ganda A-E): verbal, soal cerita, tabel, grafik batang, dan figural (serial dan matriks).
- **Penalaran Numerik** (soal interaktif): bar chart, tabel, line graph, dan pie chart. Jawabannya berupa *kondisi akhir tampilan*, bukan huruf.

Setiap soal dibuat dari angka dan fakta yang dihitung, lalu **dicek ulang dari nol oleh validator independen**. Hasil baru tampil atau ditulis ke berkas kalau semuanya lulus, dan tidak ada dua soal yang sama atau nyaris sama dalam satu kali generate, baik dalam satu paket maupun antarpaket.

Berjalan **tanpa instalasi apa pun dan tanpa internet**: tidak ada `npm install`, tidak ada pustaka luar. Antarmuka cukup dibuka dari `index.html` (atau lewat server lokal `node cli/buka.js`, juga dari Agent Office); CLI butuh Node.js 20 atau lebih baru.

## Cara pakai

### 1. Di peramban

Buka `index.html` (klik dua kali; tidak perlu server). Bisa juga lewat alamat `http://localhost` dengan `node cli/buka.js` atau tombol Agent Office (lihat bagian 3 dan 4); isinya sama.

1. **Subtes**: Kemampuan Umum, Penalaran Numerik, atau keduanya.
2. **Soal tiap submateri**: jumlah soal per submateri dalam satu paket (baku: Kemampuan Umum 12 soal, Penalaran Numerik 10 soal). Tombol *Baku* mengembalikan komposisi awal.
3. **Tingkat kesulitan**: campur (mudah:sedang:sulit = 3:5:2, bisa diubah) atau satu tingkat saja.
4. **Jumlah paket dan benih**: 1 sampai 500 paket. Benih dan pengaturan yang sama pada versi bank yang sama menghasilkan paket yang sama persis. Kosong atau tombol *Acak* memakai benih acak; nilainya tetap ditampilkan supaya bisa diulang.
5. **Generate paket**. Paket dibuat bertahap dengan penunjuk kemajuan, lalu diperiksa validator (juga bertahap, jadi layar tidak membeku; 500 paket sekitar 30 detik). Kalau ada yang gagal, tidak ada paket yang ditampilkan.
6. Di tengah ada **pratinjau**: pilih paket dan subtes, centang *Tampilkan kunci dan pembahasan*, atau klik pilihan A-E untuk berlatih (jawaban salah/benar langsung ditandai).
7. Soal **Penalaran Numerik**: tekan *Coba interaktif*. Seret lingkaran pada batang, titik, atau batas irisan (menempel ke kelipatan yang sah), atau isi kolom angkanya, tekan *Periksa jawaban*, *Lihat kunci*, atau *Ulang dari awal*. Pada tabel, pilih tab Orang A-D lalu pilih jawabannya.
8. **Unduh** di panel kanan: Word format input SiAdu (dua berkas, satu per subtes) dan PDF untuk paket yang sedang dilihat; Excel dan JSON untuk semua paket; ZIP berisi gabungan (Word, PDF, Excel, JSON, gambar PNG). Di bawah gambar soal ada tombol PNG dan SVG. Panel kanan juga menampilkan **perintah CLI yang setara** dengan pengaturan di layar.

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
paket-001/paket-001-kemampuan-umum.docx      Word format input SiAdu, satu berkas per subtes
paket-001/paket-001-penalaran-numerik.docx   (Soal N, Tingkat Kesulitan, Bentuk Soal, Jawaban, Pembahasan)
paket-001/paket-001.pdf        isi yang sama dalam PDF
paket-001/gambar/*.png         gambar soal dan kondisi kunci, mis. P001-KU-05-tabel.png
soal-ojk-tahap1.xlsx           satu baris per soal untuk semua paket, plus lembar Ringkasan
soal-ojk-tahap1.json           seluruh data soal, kunci, pembahasan, dan hasil validator
ringkasan.txt                  ringkasan, hasil validator, dan perintah untuk mengulang persis
soal-ojk-tahap1.zip            semuanya, bila memakai --zip
```

Sepasang Word, PDF, dan gambar satu paket memakan sekitar 3 detik; membuat paketnya sendiri jauh lebih cepat (500 paket sekitar 45 detik termasuk pemeriksaan validator). Contoh hasil dua paket ada di `contoh-keluaran/` (dibuat dengan `node cli/generate.js --paket 2 --benih 2026 --keluaran contoh-keluaran --tanpa-waktu`).

### 3. Lewat server lokal (`cli/buka.js`)

Di terminal VS Code, pastikan folder aktif adalah `G:\Ali\code\Tes OJK Generator\Tahap 1`, lalu jalankan:

```powershell
npm run dev
```

Perintah ini menjalankan `node cli/buka.js` dan menampilkan link komputer ini serta link satu jaringan kantor. Tidak perlu `npm install` karena tidak ada dependensi tambahan. Untuk port lain gunakan `npm run dev -- --port 3400`; untuk akses hanya dari komputer ini gunakan `npm run dev -- --lokal`.

Perintah Node.js langsung juga tetap tersedia:

```
node cli/buka.js               # link komputer ini + link satu jaringan kantor
node cli/buka.js --port 3400   # port lain (0 = port acak dari sistem)
node cli/buka.js --lokal       # hanya komputer ini
```

Server kecil tanpa pustaka luar (Node.js 20 atau lebih baru) yang melayani folder generator, jadi antarmuka yang sama terbuka di `http://localhost:<port>` tanpa `file://`. Pembuatan paket, mode coba interaktif, dan semua unduhan (Word, PDF, Excel, JSON, ZIP, PNG) berjalan persis seperti dari `index.html`; semuanya tetap dihitung di peramban. Setelah siap, tampil link komputer ini dan link jaringan, misalnya:

```text
Generator OJK Tahap 1 berjalan di http://localhost:3300
Jaringan kantor (Wi-Fi): http://192.168.1.10:3300
Bagikan link Jaringan kantor ke perangkat pada Wi-Fi/LAN yang sama.
Tekan Ctrl+C untuk menghentikan.
```

Alamat IP di atas hanya contoh; gunakan link yang benar-benar dicetak saat server dijalankan. Bagikan link **Jaringan kantor** kepada rekan sekantor. Komputer yang menjalankan generator harus tetap menyala dan server tetap berjalan. Jika ada beberapa adaptor, pilih link Wi-Fi/Ethernet yang terhubung ke jaringan kantor. Jika jaringan/IP berubah, jalankan ulang server agar link diperbarui.

- **Akses satu jaringan.** Bawaan mendengar di `0.0.0.0` dan menampilkan semua alamat IPv4 jaringan yang tersedia. Host yang diterima hanya `localhost`, `127.0.0.1`, `[::1]`, dan IP adaptor komputer ini. Jika tidak ada IP jaringan, muncul petunjuk untuk menyambungkan Wi-Fi/LAN lalu menjalankan ulang server.
- **Hanya komputer ini.** Tambahkan `--lokal` agar server hanya mendengar di `127.0.0.1` dan hanya mencetak link localhost.
- **Jika perangkat lain belum bisa membuka.** Pastikan keduanya terhubung ke Wi-Fi/LAN kantor yang sama. Jika Windows Firewall meminta izin Node.js, izinkan pada jaringan Privat kantor. Jaringan tamu atau pengaturan kantor yang mengisolasi perangkat dapat membatasi koneksi; minta bantuan pengelola jaringan bila perlu.
- **Port.** Baku 3300. Kalau sudah dipakai program lain (di `127.0.0.1` maupun `::1`), dicoba port berikutnya sampai 3310 dan server mencetak `Port 3300 sedang dipakai; memakai port 3301.` Kalau semuanya terpakai: `GAGAL: ...` (kode keluar 1).
- **Aman.** Hanya `GET` dan `HEAD`, tanpa daftar isi folder, `Cache-Control: no-store`. Berkas di luar folder generator tidak pernah dilayani: `..` (juga `%2e%2e`), garis miring terbalik, path absolut dan huruf drive Windows, nama berawalan titik (`.git`, `.claude`), dan tautan yang menuju keluar folder ditolak (403 atau 404); tanda `%` yang rusak dijawab 400 tanpa mematikan server.
- **Pengaturan per alamat.** Pengaturan terakhir (jumlah paket, benih, dan lain-lain) disimpan di penyimpanan peramban menurut alamat, jadi di `http://localhost:3300`, port lain, dan `file://` pengaturannya terpisah.

### 4. Lewat Agent Office (tanpa token)

`agent-office.json` mendaftarkan tiga pekerjaan untuk karyawan operator project ini:

- **Buka Generator OJK Tahap 1** (`cli/buka.js --port=3300`, tombol cepat *Buka Generator OJK*): menyalakan server di belakang layar. Begitu alamatnya tercetak, tombol cepat berubah menjadi *Buka Generator OJK · menyala* dan di obrolan ada tombol *Buka* (`http://localhost:3300`, atau port berikutnya kalau 3300 terpakai) dan *Matikan*. Keluaran server juga memuat link **Jaringan kantor** untuk dibagikan ke perangkat pada Wi-Fi/LAN yang sama. Tombol *Buka* tetap memakai localhost; servernya ikut mati saat Agent Office ditutup. Kalimat seperti "buka generator ojk" atau "nyalakan aplikasi ojk" menjalankannya; "uji generator ojk" tetap ke pekerjaan uji.
- **Buat paket OJK Tahap 1** (`cli/generate.js`): isian *Subtes*, *Jumlah paket*, *Tingkat kesulitan*, *Proporsi*, *Soal per submateri* (Kemampuan Umum dan Penalaran Numerik), *Benih*, dan centang format Word, PDF, Excel, JSON, serta ZIP. Berkas Excel, JSON, dan ZIP muncul sebagai tombol *Buka hasil*; ringkasan HASIL menjadi laporan.
- **Uji generator OJK Tahap 1** (`uji/semua.js`): centang *Mode cepat* (sekitar 1 menit) atau jalankan uji lengkap (sekitar 1,5 menit); *Tambah uji kapasitas* menambah sekitar 3 menit.

Kalau opsi CLI berubah, perbarui `agent-office.json` di perubahan yang sama (aturan project ini); uji `uji/semua.js` memeriksa bahwa tiap opsi di sana ada di `--help` dan di isi script. Untuk pekerjaan aplikasi, uji itu juga memeriksa bahwa regex `alamat` menangkap baris yang dicetak `cli/buka.js` dan bahwa port baku di perintah dan catatan sama dengan port baku di script, jadi mengganti port baku berarti mengubah `cli/buka.js` dan `agent-office.json` bersama-sama. Pekerjaan aplikasi tidak memakai `batas_menit`: servernya dibiarkan menyala sampai dimatikan.

## Bentuk soal per submateri

Tiap soal punya **stimulus, pertanyaan, pilihan A-E** (atau bentuk isian), **kunci**, **pembahasan langkah demi langkah** yang hanya menjelaskan jawaban benar (jalur kesalahan tiap pengecoh tetap tersimpan di data opsi dan diperiksa validator), **klasifikasi Kerangka Course** (Category, Lesson, Chapter, Subchapter), dan **tingkat kesulitan** (mudah, sedang, sulit). Ada **53 keluarga soal aktif** dan **20 topik bacaan verbal**. Setiap soal juga mencatat **pola** penalarannya dan **kategori riset**: `acuan` bila bentuknya mengikuti contoh riset BAB V, `pengayaan` bila merupakan pengembangan tim (disertai catatan singkat alasannya).

### Revisi QC paket-002 (bank versi 5, 21 Oktober 2026)

Panduan revisi paket-002 dari tim akademik:

| Bagian | Revisi |
|---|---|
| Klasifikasi | Tiap soal diberi `Category / Lesson / Chapter / Subchapter` persis dari tab Kerangka Course (`js/kerangka.js`): Category selalu Tes Potensi Dasar; Lesson Kemampuan Umum atau Penalaran Numerik; Chapter Verbal, Numerik, Figural, Bar Chart, Table Decision, Line Graph, atau Pie Chart; Subchapter menurut konsep utama yang diuji (verbal dari pola pernyataannya, numerik dan figural dari keluarganya). Penalaran Numerik tanpa Subchapter. Keluarga yang materinya tidak ada di Kerangka Course (peluang, himpunan, barisan-deret) dan konversi kurs dinonaktifkan |
| Mata uang | Semua uang dalam USD ($): £ dan € dihapus dari soal cerita, tabel, grafik, dan Table Decision (tabel harga per sentimeter kubik tanpa kurs; nominal Bonus Petugas Kredit kini puluhan ribu dolar) |
| Equation | Rumus, pecahan, pangkat, dan langkah hitung pada pembahasan ditulis sebagai baris persamaan (`js/rumus.js`, notasi LaTeX sederhana berawalan `§ `). Word mencetaknya sebagai Equation Word (OMML, dikonversi SiAdu ke MathML), PDF/Excel/JSON sebagai teks Unicode, antarmuka sebagai HTML dengan pecahan bertingkat |
| Pembahasan hitungan | Soal cerita, tabel, grafik, dan soal interaktif yang memerlukan hitungan memakai `Diketahui`, `Ditanyakan`, `Pengerjaan` (rumus umum lalu substitusi bertahap, asal angka turunan dijelaskan), dan `Kesimpulan` (jawaban, satuan, dan huruf opsi; untuk soal interaktif: pengaturan akhir kontrolnya). Analisis opsi salah ("Pilihan lain yang menjebak") dihapus |
| Perbaikan per soal | Penjelasan batas waktu verbal menyebut titik awal tiap tenggat; konversi 1 m³ = (100 cm)³; pertumbuhan Sₙ = a(0,8)ⁿ dengan perbandingan tahun ke-4 dan ke-5; "seluruh bahan yang dibeli" bila tidak ada retur; rincian penjumlahan target cabang dan laba empat bulan; rumus rata-rata dengan substitusi; arti tanda negatif pada persentase perubahan; proporsi bar sebagai pembagian; interval kategori Table Decision; langkah harian line graph; rumus persen pie dengan contoh |
| Figural | Tiap soal punya 1-3 **gambar pembahasan** yang memperlihatkan proses: tabel pola per kanal (deret atribut), deret dengan sudut/pojok/jumlah titik dan peta perpindahan pojok atau kotak 4 → 5 dengan busur rotasi 45° dan titik pusat (The Next Box), arti tiap belah ketupat dan kode aktif kotak 4 → 5 (Double Box), isian 5x5 bertahap dengan baris/kolom penentu, hitungan simbol-sambungan (3x3), asal belahan dan penggabungannya (2x2 bersekat), sel sasaran dan aturan tiap kanal (3x3 atribut), hitungan bentuk per kolom (5x6). Teks pembahasan merujuk "Gambar n" |
| Word SiAdu | Identitas tebal `Soal N`, `Category`, `Lesson`, `Chapter`, `Subchapter`, lalu `Tingkat Kesulitan`, `Bentuk Soal`, satu baris kosong, baru teks soal. Gambar pembahasan figural masuk ke kolom pembahasan |

### Revisi lanjutan QC (bank versi 4, 21 Oktober 2026)

- **Kesulitan:** perbandingan verbal berantai dua hubungan menjadi sedang; kontradiksi perbandingan langsung menjadi mudah. Grafik majemuk dengan transaksi serta tabel laba produksi/garansi minimal sedang. Perakit menukar penempatan tingkat atau memilih keluarga yang sesuai, sehingga kuota tingkat pengguna tetap dipenuhi. Label ini merupakan penilaian berdasarkan struktur penalaran; kalibrasi empiris tetap memerlukan hasil uji peserta.
- **Kotak ganda:** paket yang memuat setidaknya dua soal serial dan jatah sedang/sulit selalu menyertakan kotak ganda dengan kombinasi kode pada contoh transisi dan kotak sasaran. Paket khusus mudah tetap memakai satu kode.
- **Dolar:** tabel penjualan memakai rentang per konteks. Elektronik: kulkas $400–$1.800, mesin cuci $300–$1.200, pendingin ruangan $400–$2.000; motor $1.500–$12.000 sesuai tipe; RV tetap puluhan ribu dolar. Ini rentang editorial untuk soal rekaan, bukan harga pasar. Seluruh kunci dan pengecoh dihitung dari nominal tersebut.
- **Redaksi:** `pesertanya` dan `sukarelawannya` ditulis tanpa tanda hubung.
- **Ekspor:** setiap nomor langsung berisi soal, opsi, `Jawaban: A. teks jawaban`, dan `Pembahasan: ...`. Soal interaktif memuat kondisi akhir/nilai sebagai jawaban. Excel dan JSON juga menyediakan `naskah_lengkap` dengan urutan ini. Tidak ada bagian kunci dan pembahasan terpisah di akhir PDF. Word kemudian diganti menjadi format input SiAdu (lihat *Format ekspor*).

### Revisi QC sebelumnya (bank versi 3)

Bank versi 3 menangani catatan tim akademik dan QC Riset pada paket P001 (benih 2824819757, komposisi 30 soal Kemampuan Umum dan 20 soal Penalaran Numerik), dilanjutkan dengan revisi versi 4 di atas:

| Bagian | Revisi |
|---|---|
| Naskah | Pernyataan verbal dicetak polos di bawah bacaan, tanpa label "Pernyataan:" dan tanpa kalimat "Berdasarkan bacaan di atas, ..." (seperti contoh riset). Kalimat pertanyaan tidak lagi dicetak tebal. Tidak ada penulisan skala "juta"/"ribu" pada soal: nominal ditulis utuh, mis. $52.500 |
| Variasi dalam paket | Dalam satu paket, soal sesubmateri tidak mengulang pola penalaran yang sama (mis. dua jebakan syarat cukup, dua deret dengan mekanisme rotasi yang sama, dua bar chart berpola sama) selama pola lain masih tersedia |
| Verbal | Bacaan informatif yang mengalir, berpusat pada fakta yang ditanyakan dengan 2-3 fakta setema sebagai pengecoh; pembuka "studi kasus rekaan ... ketentuan ... rancangan" dihapus dan enam topik tambahan ditulis ulang menjadi bacaan biasa. Kalimat ambang (jam/sesi "atau lebih otomatis ...") dan batas waktu hanya muncul bila pernyataannya bergantung padanya. Pola baru: batas waktu, generalisasi dari temuan setempat, perbandingan bercabang. Tingkat dikalibrasi: golongan dua langkah kini sedang, sulit hanya untuk jebakan sungguhan |
| Soal cerita, tabel, grafik | Semua pengecoh berasal dari **jalur kesalahan yang dapat diulang**, ditulis beserta hitungannya (mis. "mengabaikan waktu berhenti: 480 ÷ 7 = 68,57 km/jam"); alasan generik "salah hitung pada salah satu langkah" dihapus. Dua persamaan tiga benda kini benar-benar memerlukan substitusi; bulan lunas memakai uang muka dan semua pilihan bulan jatuh setelah pembelian; pilihan bersatuan lengkap ("$4.004 per mesin"); kenaikan laba produk menyebut asumsi produksi maksimum dan seluruh unit terjual. Empat keluarga baru: pengukuran dan konversi satuan wadah, perbandingan waktu tempuh, tabel pertumbuhan majemuk, tabel rata-rata gabungan |
| Figural | Matriks 2x2 biasa dihapus (bentuk 2x2 hanya yang bersekat diagonal). Matriks 3x3 baru meniru hubungan simbol-sambungan contoh riset; matriks 3x3 lama ditandai pengayaan. Deret berputar punya empat mekanisme (putar, pindah posisi, jumlah titik, isian titik). Deret kotak ganda tingkat sedang/sulit memuat transisi dan kotak sasaran dengan dua kode aktif. Daerah "?" matriks 5x5 selalu potongan 2 kotak, 3 kotak (lurus atau L), atau blok 2x2. Simbol pilihan 5x6 digambar lebih besar dan pilihan yang melebar disusun tiga kolom |
| Bar chart | Pola dipilih menurut tingkat: mudah (total dan bagian naik dengan persen yang sama, atau persen bagian diberikan), sedang (satu bagian berubah persen/nominal lalu bagian lain dicari, seperti contoh Asuransi dan Pendapatan Penjualan), sulit (selisih nominal antarbagian, atau kedua bagian berubah dan total periode kedua dicari) |
| Table | Kalimat syarat kedua dirapikan ("... sekurang-kurangnya 50% lebih tinggi daripada rata-rata target premi pada tiga bulan yang sama"); istilah tiap tema konsisten di ketentuan, label tabel, dan pembahasan (mis. pengajuan, pengajuan batal, pengajuan bersih, rata-rata nilai kredit per pengajuan bersih); kategori empat opsi ditandai pengayaan |
| Line graph | Kunci area cakupan diperbaiki: setiap kejadian sekali-jadi dan perubahan laju kini tertulis di soal, dan validator menolak kejadian yang dihitung tetapi tidak tertulis. Rentang sumbu paling banyak 120 langkah geser. Tiga keluarga dari contoh riset dipisah (perubahan tetap, persen dari nilai awal, persediaan). Pertumbuhan majemuk memakai angka sederhana dan ditandai pengayaan. Nama jenis soal sesuai isinya ("tambahan tetap berulang", "pertambahan dengan besaran bergantian") |
| Pie chart | Keterangan disajikan dalam empat kotak kategori berwarna sama dengan irisannya; pada bentuk "1 informasi kosong" kotak dasar tetap tampil dengan judulnya tetapi isinya kosong. Tingkat sedang/sulit memakai relasi berantai dan selisih tetap |

Untuk hasil berbeda pada generate berikutnya, tekan **Acak** pada benih. Benih dan pengaturan yang sama pada **versi bank yang sama** tetap menghasilkan paket identik. Bank terbaru menyimpan `meta.versi: 5`; benih dari versi sebelumnya dapat menghasilkan susunan berbeda setelah pembaruan ini.

### Kemampuan Umum (12 soal baku, 10 menit)

| Submateri | Bentuk | Keluarga soal |
|---|---|---|
| Verbal (2) | Bacaan informatif 120-180 kata (umumnya 125-155) yang berpusat pada fakta yang ditanyakan, ditambah 2-3 fakta setema sebagai pengecoh dan kalimat latar, diikuti satu pernyataan polos (tanpa label dan tanpa kalimat perintah) yang harus **disimpulkan**: **Benar / Salah / Tidak Diketahui** (tiga pilihan). 20 topik: 10 umum (penerbangan sipil, upah minimum, bank sampah, pembelajaran jarak jauh, telemedisin, listrik surya atap, angkutan perkotaan, irigasi pertanian, desa wisata, hutan mangrove), 4 keuangan (literasi keuangan, asuransi mikro, pinjaman daring, perbankan digital), dan 6 topik tambahan (penanganan pengaduan konsumen, keamanan akun digital, pengelolaan arsip digital, distribusi pangan segar, perpustakaan digital, audit energi gedung). | 1 keluarga, 57 jenis pernyataan dalam 14 pola. Mudah: anggota daftar (juga dengan kata lain), daftar terbuka ("seperti", "antara lain") dan "satu-satunya", cakupan dan pengecualian, kuantor sederhana, status teori/terbukti yang tertulis, urutan "pertama", temuan setempat. Sedang: golongan dua langkah, kuantor ("tidak semua", "sebagian" vs "sebagian besar"), "secara teori" vs "terbukti", urutan "sebelum", arah sebab-akibat langsung, daftar "hanya", penerapan syarat, batas waktu ("paling lambat"), perbandingan berantai. Sulit: rantai sebab-akibat (juga dibalik), perbandingan bercabang, syarat perlu/cukup yang tidak menentukan (angka kasus di pernyataan), sebab-akibat terbalik, generalisasi dari temuan setempat |
| Numerik: Soal cerita (2) | Cerita hitungan, 5 pilihan angka; tiap pengecoh dari jalur kesalahan yang ditulis hitungannya | 15 keluarga aktif: pecahan dan persen pada sisa zat, persentase peningkatan kecepatan, dua persamaan tiga benda (dengan substitusi), balik modal mesin, bulan lunas dengan laba naik dan uang muka, selisih pendapatan penjual, perbandingan campuran, diskon berlapis, pengukuran dan konversi satuan wadah, perbandingan waktu tempuh, kerja bersama, kecepatan rata-rata, rata-rata gabungan, harga sebelum diskon, bunga tunggal. Konversi mata uang, peluang, barisan, dan irisan kelompok dinonaktifkan (di luar Kerangka Course atau bertentangan dengan ketentuan USD) |
| Numerik: Tabel (3) | Tabel data (gambar) + pertanyaan | 13 keluarga: perbandingan dua baris, persentase gabungan dua kelompok, tahun sampai melampaui, biaya rata-rata per mesin, kenaikan laba produk (dengan asumsi produksi maksimum terjual), unit terjual yang hilang, harga per sentimeter kubik dan per liter (termasuk selisih harga per liter dua tangki, semuanya dalam dolar tanpa kurs), persentase perubahan, pertumbuhan majemuk, rata-rata gabungan, biaya rata-rata tertimbang dan retur, pencapaian target cabang, produktivitas per orang per jam |
| Numerik: Grafik batang (1) | Grafik batang (gambar) + pertanyaan | 6 keluarga: tim dengan hasil baik terbanyak, perubahan total dua seri, persen sumbangan batang, perbandingan dua batang, laba/margin dari dua seri, rata-rata yang diperlukan untuk mencapai target |
| Figural: Serial (2) | Deret kotak + "?" , pilihan A-E berupa gambar | deret atribut (bentuk wadah, warna, arah panah, titik, jumlah kotak kecil, penanda pojok), deret bentuk ("The Next Box") dengan empat mekanisme yang dapat digabung: **putar**, **pindah posisi** di pojok kotak, **jumlah titik**, dan **isian titik** (mudah satu mekanisme, sedang dua, sulit tiga), dan **deret kotak ganda** ("The Next Double Box": bagian atas berisi empat lingkaran, panah, penanda, dan kadang bingkai; tiga belah ketupat di bagian bawah adalah kode perubahan, abu-abu berarti bagian itu berubah dibanding kotak sebelumnya; mudah satu kode aktif per transisi, sedang dan sulit memuat transisi dan kotak sasaran dengan **dua kode aktif**; "?" di bagian atas kotak kelima) |
| Figural: Matriks (2) | Matriks dengan daerah "?", pilihan A-E berupa gambar | **matriks 3x3 simbol-sambungan** (persegi, lingkaran putih, lingkaran hitam dengan garis sambung mendatar/tegak; tiap kotak memenuhi hubungan jumlah yang sama, mis. lingkaran hitam = sambungan mendatar, sedangkan sambungan tegak menjadi pengecoh; sulit memakai dua hubungan sekaligus), matriks 3x3 umum (latin, baris/kolom tetap, langkah, xor, jumlah; pengayaan), **matriks 5x5** (hati, lingkaran, persegi, segitiga, bintang; tiap baris dan kolom memuat kelimanya; "?" menutup potongan 2 kotak, 3 kotak lurus atau L, atau blok 2x2; pilihan berupa potongan berbentuk sama), **matriks 5x6** (segitiga, persegi, segi enam, lingkaran hitam/putih; tiap kolom memuat keempat bentuk ditambah satu bentuk yang sama di semua kolom, dan warna mengikuti bentuk, bergantian per baris/kolom menurut golongan bentuk, atau papan catur; "?" menutup 2-4 kotak sebaris), dan **matriks 2x2 bersekat** (tiap kuadran disekat menjadi segitiga dalam dan segitiga pojok; belahan bercorak gambar dalam pindah ke gambar pojok kuadran tetangga yang dihadapinya, bentuk pojok mengikuti pola 2x2; "?" di salah satu pojok) |

Bentuk matriks 5x5, 5x6, 2x2 bersekat, 3x3 simbol-sambungan, dan deret kotak ganda mengikuti contoh riset BAB V (soal figural 2, 3, 4, 5, dan 6); matriks 2x2 biasa tidak dibuat lagi karena bentuk itu tidak ada pada contoh. Aturan 5x6 dibaca dari contoh riset: setiap kolomnya memuat keempat bentuk ditambah satu persegi, dan baris ganjil menghitamkan persegi dan segi enam sedangkan baris genap menghitamkan segitiga dan lingkaran; menurut aturan itu kunci contoh riset adalah D, dan pengecohnya cocok dengan aturan tersebut (A bentuknya benar tetapi warnanya terbalik, B dan C warnanya benar tetapi bentuknya salah). Aturan 2x2 bersekat juga dibaca dari contoh riset (belahan gambar dalam pindah ke pojok tetangga). Logika "kode" kotak ganda pada contoh riset tidak dapat dipastikan dari satu soal, jadi generator memakai aturan kode perubahan yang dijelaskan di atas.

### Penalaran Numerik (10 soal baku, 18 menit), interaktif

| Submateri | Yang dilakukan peserta | Bentuk |
|---|---|---|
| Bar chart (3) | Mengatur **total** dua batang bertumpuk (kelipatan sesuai soal) dan **persentase** kedua bagiannya (kelipatan 5%) | 10 bingkai topik (asuransi, pendapatan, anggaran, produksi, kredit, klaim, dana pihak ketiga, dompet digital, reksa dana, pajak daerah), nominal ditulis utuh; pola per tingkat: mudah = total dan bagian naik persen yang sama atau persen bagian diberikan, sedang = satu bagian berubah persen/nominal lalu bagian lain dicari, sulit = selisih nominal antarbagian atau kedua bagian berubah dan total periode kedua dicari |
| Table (3) | Memilih jawaban di **tab Orang A-D** | mencapai target atau tidak (2 opsi, dua syarat); kategori komisi/insentif/bonus (3 opsi seperti contoh riset, atau 4 opsi sebagai pengayaan) dari rata-rata nilai per transaksi bersih, dengan istilah yang sama di ketentuan, tabel, dan pembahasan |
| Line graph (2) | Menggeser **lima titik** atau mengisi kolom angka tiap titik; sumbu paling banyak 120 langkah geser | 5 keluarga: perubahan tetap per periode (area cakupan, saldo tabungan, suhu), persen dari nilai awal (rekening saham), persediaan gudang, perubahan bergantian (gudang, tangki air, ruang arsip), dan pertumbuhan majemuk dari nilai hari sebelumnya (pengayaan); mudah = perubahan rutin saja, sedang = ditambah satu kejadian sekali-jadi, sulit = laju berubah mulai titik tertentu dan ada satu kejadian; setiap kejadian tertulis di soal |
| Pie chart (2) | Menggeser **batas irisan** (kelipatan 1%) sampai keempat persentase sesuai keterangan | keterangan dalam empat kotak kategori berwarna sama dengan irisannya; informasi penuh, atau satu informasi kosong (kotak dasar tanpa isi; dasar dicari dari jumlah dan hubungan antaririsan, berantai pada tingkat sedang/sulit) |

Di naskah Word/PDF soal interaktif ditulis sebagai **tampilan awal + lembar isian**, dan kondisi akhir (kunci) tampil sebagai gambar di bagian pembahasan.

## Cara kerja

### Pembuatan soal dan benih

Semua pengacakan diturunkan dari benih utama, nomor paket, subtes, nomor soal, dan nomor percobaan (pengacak berbenih sendiri). Pada versi bank yang sama, hasil bisa diulang persis dan **paket nomor N tidak bergantung pada jumlah paket yang diminta**. Keluarga soal diundi tanpa pengulangan dalam setiap siklus submateri, sehingga pasangan keluarga tidak selalu bertetangga dalam katalog dan tidak ada dua soal sekeluarga selama pilihannya masih cukup. Di dalam satu subtes, **pola** soal yang sudah dipakai dikirim ke penyusun (`polaDipakai`) dan calon dengan pola yang sama ditolak pada 30 percobaan pertama, kecuali penyusun menandai bahwa semua pola tingkat itu memang sudah terpakai (`polaTerpaksa`). Tingkat kesulitan dibagi menurut proporsi, dan **huruf kunci A-E dibuat merata** (tiap huruf hampir sama banyak per paket): posisi kunci dikejar pada 24 percobaan pertama, dan bila tetap meleset (pengecoh jalur kesalahan tidak selalu bisa mengapit kunci di posisi rencana) huruf rencana butir itu ditukar dengan butir berikutnya yang direncanakan berhuruf sama.

### Validator independen (`js/validator.js`)

Validator tidak memercayai kunci yang tersimpan dan tidak memanggil kode penyusun soal. Ia menghitung ulang dari data dan gambar yang benar-benar tampil, memakai **pecahan eksak** (BigInt), bukan bilangan kambang:

- **Soal cerita**: mengevaluasi ulang langkah hitung dengan parser rumus sendiri, mencocokkan setiap angka yang tercetak di soal dengan angka yang dihitung, dan memastikan **hanya satu opsi** yang bernilai sama dengan hasil. Setiap angka yang tercetak harus tercatat sebagai data dan harus **memengaruhi jawaban** (angka yang tidak terpakai, seperti berat mur pada catatan QC nomor 8, ditolak). Setiap pengecoh harus punya alasan (di data opsi) yang menuliskan hitungan jalur kesalahannya dan nilai pilihannya; alasan generik ditolak. Pembahasan wajib memuat `Diketahui`, `Ditanyakan`, `Pengerjaan`, `Kesimpulan` tepat sekali dan berurutan; Pengerjaan memuat baris persamaan; Kesimpulan menyebut nilai dan huruf kunci; setiap baris persamaan diperiksa tata tulisnya dan **setiap relasinya dihitung ulang dengan pecahan eksak** (`=` harus tepat, `≈` hanya selisih pembulatan angka yang tercetak, `<`/`≤`/`>`/`≥` harus benar). Uang hanya dalam dolar: £, €, atau kata kurs/euro/pound ditolak di mana pun.
- **Tabel dan grafik**: membaca sel dan batang dari **SVG yang digambar** (batang diukur terhadap garis bantu), lalu menghitung.
- **Verbal**: menurunkan Benar/Salah/Tidak Diketahui dengan aturannya sendiri dari **fakta berstruktur** yang dipakai merakit bacaan (golongan, cakupan dan pengecualian, daftar terbuka/tertutup, sebab-akibat berantai, kuantor, "secara teori", syarat perlu/cukup, batas waktu "paling lambat", temuan setempat vs generalisasi, urutan, perbandingan berantai dan bercabang). Istilah di pernyataan harus sama dengan istilah di bacaan, dan batas waktu untuk tahap lain yang dinyatakan tidak diketahui tidak boleh disebut di bacaan. Pasangan yang jawabannya bergantung pada makna tersirat (mis. memakai "sebagian" untuk menyimpulkan "tidak semua") ditolak. Bacaan harus tersusun tepat dari kalimat fakta, kata penanda tiap fakta ("tidak termasuk", "hanya", "seperti", "tidak semua", "secara teori", "sekurang-kurangnya", kata kerja naik/turun) harus tertulis di kalimatnya, dan hal yang dinyatakan tidak diketahui tidak boleh tertulis di bacaan.
- **Figural**: menebak aturan tiap kanal dari kotak yang tampak (`js/inferensi.js`, sengaja tidak berbagi kode dengan penyusun) dan memastikan **tepat satu opsi** memenuhi semua aturan; untuk deret berputar, yang diperiksa adalah gambar deret dan gambar opsi yang tampil. Bentuk riset diperiksa dari gambar soal dan gambar opsi yang tampil: matriks 5x5 dengan mencoba **semua** cara mengisi daerah "?" (harus tepat satu); matriks 5x6 dengan pustaka aturan bentuk dan warna (aturan yang dapat dipenuhi kotak tampak dianggap berlaku, dan hanya satu deret pengganti boleh memenuhi semuanya); 2x2 bersekat dengan pustaka asal belahan (kiriman tetangga, tertukar, belahan yang menghadap ke tempat lain, salinan gambar dalam atau pojok lain) yang harus menunjuk gambar pojok yang sama; deret kotak ganda dengan menjelaskan tiap bagian gambar atas sebagai "tetap", "berubah tiap kotak", atau "berubah bila belah ketupat ke-d abu-abu" (semua penjelasan yang cocok harus memberi kotak kelima yang sama); matriks 3x3 simbol-sambungan dengan pustaka hubungan jumlah, pola posisi, dan jenis ujung sambungan (`Inf.sambung`) yang harus menunjuk satu pilihan yang sama; deret berputar diperiksa arah, posisi, jumlah, dan isian titiknya.
- **Interaktif**: menghitung ulang kondisi akhir (total dan persen batang, nilai tiap titik, persentase irisan lewat sistem persamaan linear eksak, keputusan tiap tab tabel), dan memastikan tampilan awal tidak sudah benar. Line graph: rumus hanya boleh memakai parameter yang tertulis di soal (bilangan lain hanya pengali banyak langkah dan /100), setiap kejadian sekali-jadi harus punya kalimat yang memuat waktu dan besarnya, dan rentang sumbu paling banyak 120 langkah geser. Pie chart: empat kotak keterangan dengan judul dan warna irisannya, setiap relasi tertulis di kotak irisannya, dan kotak dasar bentuk kosong benar-benar kosong.
- **Pengecoh**: semuanya berbeda satu sama lain dan dijamin salah.
- **Paket dan hasil**: komposisi, nomor, dan id konsisten; **tidak ada butir kembar**.

Validator juga diuji **terbalik** (`uji/negatif.js`): soal yang sengaja dirusak (kunci digeser, dua opsi sama-benar, angka tabel, grafik, atau parameter diubah, kondisi awal disamakan dengan kunci, fakta verbal dibuang atau polaritasnya dibalik, polaritas pernyataan verbal dibalik, kalimat bacaan verbal dihapus, alasan pengecoh diganti kalimat generik atau dihapus, angka tak terpakai disisipkan ke soal, soal QC nomor 8 yang asli, kalimat kejadian line graph dihapus atau kejadiannya ditanam sebagai bilangan di rumus, sumbu line graph terlalu rinci, kotak keterangan pie dikosongkan atau warnanya ditukar, kode kotak ganda dibalik, potongan 5x5 ditukar, hubungan matriks simbol-sambungan dirusak, deret berputar diputar/digeser/dibalik isiannya, id ganda, butir kembar) harus ditolak semuanya. Setiap keluarga figural juga dibuat langsung dari bank pada ketiga tingkat, jadi "kunci digeser" dan "dua opsi sama-benar" pasti mengenai semua bentuk figural, dan bentuk riset dirusak isinya (kotak 5x5 diganti, warna atau bentuk 5x6 diubah, belahan gambar bersekat ditukar, kode belah ketupat kotak kelima dibalik). Uji itu pernah menemukan dua celah (deret berputar dan pie), yang sudah ditutup.

### Anti-kembar

Dua butir dinyatakan kembar kalau: sidik inti sama persis; atau (figural) kotak yang tampak sama dengan paling banyak satu kotak berbeda (matriks 5x5: empat kotak, matriks 5x6: tiga kotak; bentuk riset dibandingkan dalam keadaan utuh, jadi gambar yang sama dengan letak "?" berbeda tetap dianggap kembar); atau 3-gram kata teks (angka ikut dihitung; kotak keterangan pie ikut dihitung) mirip sekurang-kurangnya 85%; atau kerangka dan pelaku sama dan hanya satu angka yang berbeda. Penjaga ini dijalankan **saat soal dipilih** (lintas paket dalam satu kali generate) dan sekali lagi oleh validator terhadap seluruh hasil.

### Gambar tanpa dependensi

Soal hanya menyimpan **model** gambar (data murni); SVG dirakit saat dibutuhkan. Untuk PNG, Word, dan PDF ada penggambar piksel sendiri (`js/svgraster.js`: penguraian SVG, isian, garis, teks dari font garis, anti-alias) dan penulis PNG sendiri. Di peramban, PNG dibuat oleh kanvas bawaan (huruf sistem). Arsiran pada matriks bersekat (garis, titik, kotak-kotak, bintang) dihitung sendiri sebagai garis dan titik biasa yang dipotong ke dalam belahannya (`js/bentuk.js`), bukan pola SVG, sehingga PNG buatan CLI sama dengan tampilan peramban. Word (`js/docx.js`), PDF (`js/pdf.js`, tata letak sendiri, font standar Helvetica), Excel (`js/xlsx.js`), dan ZIP (`js/zip.js`) ditulis tanpa pustaka.

## Format ekspor

- **Word = format input SiAdu** (satu berkas per subtes: `paket-NNN-kemampuan-umum.docx` dan `paket-NNN-penalaran-numerik.docx`, karena importir membaca semua teks setelah `Pembahasan:` sampai `Soal N` berikutnya sebagai pembahasan, jadi judul subtes tidak boleh berada di antara soal). Teks sebelum `Soal 1` hanya pengantar dan diabaikan importir. Tiap soal ditulis persis mengikuti template SiAdu:

  ```
  Soal N                         (tebal)
  Category: Tes Potensi Dasar    (tebal)
  Lesson: Kemampuan Umum         (tebal)
  Chapter: Numerik               (tebal)
  Subchapter: Aritmatika Keuangan (tebal; tidak ada untuk Penalaran Numerik)
  Tingkat Kesulitan: Mudah | Sedang | Sulit
  Bentuk Soal: Option New | Bar Chart | Line Chart | Pie Chart | Table Decision

  <teks soal>
  ...
  Jawaban: ...
  Pembahasan:
  <isi pembahasan>
  ```

  | Bentuk Soal | Isi |
  |---|---|
  | Option New (Kemampuan Umum) | Bacaan/teks, gambar tabel, grafik, atau figural disisipkan di soal, lalu pertanyaan, pilihan `A.` sampai `E.` (verbal `A.` sampai `C.`; pilihan figural berisi gambar sebaris), dan `Jawaban: <huruf>`. Tidak ada tabel Word di soal pilihan ganda supaya tidak terbaca sebagai bentuk Table |
  | Bar Chart | Judul, keterangan berawalan `- `, `Pertanyaan`, `Pengaturan: Sumbu Y 0 - <maks>; Garis bantu <n>; Kelipatan nilai <n>; Kelipatan persen 5`, `Variabel: <bagian 1> 50%; <bagian 2> 50%`, lalu tabel `Kategori \| Nilai Awal \| Kunci Nilai \| <bagian 1> \| <bagian 2>` (kolom bagian berisi kunci persen, total 100) |
  | Line Chart | Judul, keterangan, `Pertanyaan`, `Pengaturan: Sumbu Y <min> - <maks>; Garis bantu <n>; Kelipatan nilai <n>`, lalu tabel `Titik \| Kunci Nilai` |
  | Pie Chart | Judul, kalimat pembuka (tanpa nama warna, karena SiAdu memberi warna irisan sendiri), tabel informasi 2x2 `Kategori: keterangan` (kotak dasar bentuk kosong hanya berisi judulnya), `Pertanyaan`, `Pengaturan: Kelipatan nilai 1; Nilai minimum 1`, lalu tabel `Bagian \| Nilai Awal \| Kunci Nilai` |
  | Table Decision | Judul, ketentuan berawalan `- `, `Pertanyaan`, `Label Keputusan: ...`, `Opsi: A. ...; B. ...`, lalu tiap tab `Tab: Orang A` diikuti tabel Word datanya, dan `Jawaban: Orang A: A; Orang B: B; ...` |

  Pembahasan hitungan berisi `Diketahui`, `Ditanyakan`, `Pengerjaan`, `Kesimpulan` (tebal) dengan setiap rumus sebagai Equation Word dalam paragrafnya sendiri; pembahasan figural diawali gambar tahapan polanya. Untuk grafik, gambar tampilan awal tidak disisipkan (grafiknya dibuat SiAdu dari tabel) dan `Jawaban:` dibiarkan kosong karena kuncinya ada di kolom `Kunci Nilai`. Pembahasan ditulis tanpa baris "Jenis soal" dan "Tampilan awal" karena SiAdu menuliskan kuncinya sendiri. `uji/siadu.js` membaca balik setiap berkas Word seperti importir dan mencocokkan nomor, identitas Kerangka Course (tebal), tingkat, bentuk, pilihan, tabel kunci, jawaban, jumlah persamaan Word, dan gambar pembahasan dengan data soal. Word terbuka dalam mode normal, bukan Mode Kompatibilitas.
- **PDF** (per paket, naskah baca): tiap subtes mulai di halaman baru. Tiap nomor memuat soal, opsi, **Jawaban: A. teks jawaban**, lalu **Pembahasan:** langkah demi langkah. Jawaban interaktif berupa nilai/kondisi akhir dengan gambar kunci setelah label pembahasan. Kotak keterangan pie ditulis sebagai tabel 2x2 berwarna.
- **Excel** (`soal-ojk-tahap1.xlsx`), lembar *Soal*, **satu baris per soal**. Kolom wajib: `no, paket, subtes, submateri, level, soal, opsi_a, opsi_b, opsi_c, opsi_d, opsi_e, jawaban_benar, pembahasan, berkas_gambar`. Tambahan: `id, benih, keluarga, bentuk_isian, kunci_isian, berkas_gambar_pembahasan, pola, kategori_riset, catatan_riset, category, lesson, chapter, subchapter` (kategori riset `acuan` atau `pengayaan`; empat kolom terakhir dari Kerangka Course). Baris persamaan pembahasan ditulis sebagai teks Unicode. Kotak keterangan pie ditulis di kolom `soal` sebagai baris "Judul: isi" (kotak kosong ditandai "-"). Untuk soal bergambar, `berkas_gambar` dan opsi menuliskan nama berkas PNG yang ada di `paket-NNN/gambar/`. Lembar *Ringkasan* menghitung soal per paket, submateri, dan tingkat.
- **JSON**: seluruh paket dan soal (stimulus termasuk `kartu` pie, pertanyaan, opsi, kunci, langkah hitung, pembahasan, model gambar, bentuk isian dan nilai jawaban untuk soal interaktif, `pola`, `kategoriRiset`, `catatanRiset`) plus hasil validator.
- **PNG**: gambar soal dan gambar kondisi kunci, diberi nama `<id soal>-<id gambar>.png`.
- **ZIP**: gabungan di atas (ZIP biasa, tanpa ZIP64: paling banyak sekitar 4 GB dan 65.534 berkas).

## Kapasitas dan kecepatan

Diuji pada bank versi 2 dengan Node.js 24, benih 2026 dan komposisi baku (19 Oktober 2026):

| Pengaturan | Hasil |
|---|---|
| 500 paket `semua`, tingkat campur (11.000 butir) | Validator lulus 11.000/11.000, 0 kembar |
| 500 paket `semua`, tingkat mudah (11.000 butir) | Validator lulus 11.000/11.000, 0 kembar; kapasitas bertambah dibanding bank lama yang pada benih ini berhenti sekitar paket 300 |
| Uji langsung bank tambahan | 900 soal numerik/interaktif dan 540 soal verbal dari seluruh tingkat lulus; 1.440 salinan dengan kunci yang sengaja diubah semuanya ditolak |

Komposisi kustom yang memusatkan banyak soal pada satu submateri, atau tingkat tunggal dengan paket sangat banyak, bisa menghabiskan bank soal lebih cepat. Pembuatan paket lalu berhenti dengan pesan `butir ... gagal disusun ... kapasitas bank untuk submateri ini mungkin habis`; kurangi jumlah paket, ganti benih, atau longgarkan komposisi.

## Struktur folder

```
index.html            antarmuka peramban
css/style.css
js/                   modul (script klasik, bentuk UMD: jalan di peramban dan Node)
  rng.js metrik.js format.js hitung.js     pengacak berbenih, huruf, format angka Indonesia, pecahan eksak
  rumus.js kerangka.js                     baris persamaan pembahasan (OMML/teks/HTML), klasifikasi Kerangka Course
  svg.js font.js svgraster.js png.js kempis.js raster.js    gambar SVG dan PNG tanpa dependensi
  chart.js kamus.js pilihan.js butir.js    grafik/tabel SVG, perakit butir, pengecoh
  cerita.js tabelku.js grafikku.js verbal.js figural.js serial-putar.js inferensi.js
  variasi.js verbal-topik.js     keluarga tambahan (cerita, tabel, grafik, garis) dan 6 topik verbal tambahan
  serial-ganda.js matriks-latin.js matriks-isi.js matriks-sekat.js bentuk.js
                                           bentuk figural riset: kotak ganda, 5x5, 5x6, 2x2 bersekat, bentuk dasar
  figure.js families.js render.js          mesin bentuk figural (disalin dari Figural Kesesuaian Generator)
  pn-bar.js pn-tabel.js pn-garis.js pn-pie.js   Penalaran Numerik
  gambar.js bank.js paket.js               deskriptor gambar, daftar keluarga soal, perakit paket
  validator.js                             pemeriksa independen
  dokumen.js docx.js pdf.js xlsx.js zip.js ekspor.js   penulis berkas
  coba.js app.js                           mode coba interaktif dan perekat antarmuka
cli/generate.js       perintah baris
cli/buka.js           server lokal untuk index.html (node cli/buka.js; tombol Agent Office)
uji/                  uji: semua.js (jalankan ini), negatif.js, qc.js, siadu.js, variasi.js, berkas.js, browser.js, peramban.js, server.js
contoh-keluaran/      contoh dua paket (Word, PDF, Excel, JSON, PNG)
agent-office.json     pekerjaan tanpa token untuk Agent Office
output/               dibuat saat CLI dijalankan (diabaikan git)
```

## Uji

```
node uji/semua.js              # lengkap: sekitar 1,5 menit
node uji/semua.js --cepat      # sekitar 1 menit
node uji/semua.js --besar      # tambah uji kapasitas 500 paket (sekitar 3 menit lebih lama)
node uji/variasi.js            # keluarga/topik baru, acuan hitung terpisah, mutasi kunci, variasi paket
node uji/semua.js --tanpa-peramban
node uji/negatif.js            # hanya validator negatif
node uji/qc.js                 # hanya regresi revisi QC paket P001
node uji/siadu.js              # hanya Word format input SiAdu, dibaca balik seperti importir
node uji/browser.js            # hanya antarmuka lewat file:// (perlu Chrome atau Edge dan Node.js 22+)
node uji/server.js             # hanya server lokal dan antarmuka lewat http:// (bagian peramban perlu Chrome atau Edge dan Node.js 22+)
```

`uji/semua.js` memeriksa: (1) paket per subtes dengan beberapa benih berbeda (validator, kembar, komposisi, kunci A-E); (2) benih dan komposisi; (2b) bank tambahan; (2c) regresi revisi QC paket P001 (`uji/qc.js`: tanpa label/petunjuk verbal, pertanyaan tidak tebal, tanpa "juta"/"ribu", line graph dapat digeser tepat, kotak pie, tanpa matriks 2x2 biasa, pengecoh dari jalur kesalahan, metadata riset); (3) validator negatif; (4) logika mode coba; (5) isi berkas Word, PDF, PNG, Excel, JSON, dan ZIP (ZIP dibuka dan CRC dicocokkan, XML diperiksa, Word bukan Mode Kompatibilitas, Word satu berkas per subtes dan terbaca sesuai template SiAdu, subtes kedua PDF mulai di halaman baru, tabel xref PDF dicek, data PNG didekompresi); (6) CLI termasuk semua jalur gagal; (7) `agent-office.json`; (8) `contoh-keluaran/`; (9) antarmuka di Chrome/Edge tanpa kepala, termasuk menyeret widget dengan mouse sungguhan dan mengunduh semua jenis berkas; (10) server lokal `cli/buka.js` (`uji/server.js`): MIME, penjaga path (traversal, path absolut, drive Windows, `%` rusak, tautan keluar folder), pemilihan port, berhenti rapi, dan perintahnya, lalu seluruh antarmuka (butir 9) diulang lewat `http://localhost` dengan dua unduhan Blob sungguhan. Server uji selalu menyala di port acak, tidak pernah di 3300. Hasil sementara ditulis ke folder sementara sistem, bukan ke project. Baris terakhir `HASIL: ...` atau `GAGAL: ...`.

## Batasan dan hal yang perlu dipertimbangkan

- **Bentuk soal dipelajari dari riset**, bukan salinan soal OJK. Komposisi baku (12 soal Kemampuan Umum, 10 soal Penalaran Numerik; 10 dan 18 menit) adalah asumsi dari riset dan bisa diubah per paket; sebaiknya dicocokkan dengan kisi-kisi resmi terbaru.
- **Verbal dirakit dari kerangka kalimat dan fakta**, bukan ditulis bebas. Bacaan disusun dari fakta yang ditanyakan, 2-3 fakta setema, dan kalimat latar, jadi tidak lagi memuat semua jenis fakta sekaligus; kalimat ambang dan batas waktu hanya muncul bila pernyataannya bergantung padanya. Kuncinya tetap pasti, tetapi tiap topik memakai kerangka yang sama (versi kalimat, anggota daftar, angka, dan kalimat yang dipakai diacak), sehingga bacaan setopik masih bisa terasa mirip bila banyak paket dikerjakan berurutan. Kalimat pendapat ("dinilai", "berpendapat", "sejumlah studi menyimpulkan") hanya menjadi latar dan pernyataan tidak pernah bergantung pada makna tersirat; karena itu jebakan seperti menyimpulkan sikap atau motif dari kalimat pendapat sengaja tidak dibuat. Pernyataan Tidak Diketahui tetap menuntut peserta mengabaikan pengetahuan di luar bacaan (mis. kegunaan yang benar di dunia nyata tetapi tidak disebut).
- **Huruf pada PNG buatan CLI** memakai font garis sendiri (mirip Helvetica), sedikit berbeda dari huruf sistem yang dipakai peramban. Isi Word dan PDF tidak terpengaruh: keduanya memuat gambar yang sama.
- **Word format SiAdu dibaca balik oleh uji** (`uji/siadu.js`) menurut aturan template, tetapi belum diimpor ke SiAdu sungguhan dari lingkungan uji; lakukan satu kali impor percobaan sebelum dipakai massal. Template grafik memakai contoh tingkat "Hots"; generator menulis Mudah/Sedang/Sulit sesuai tingkat soal.
- **Word dan PDF diuji strukturnya** (ZIP, XML, tabel xref, gambar) dan PDF dirender untuk pemeriksaan visual. Contoh Word di `contoh-keluaran/` dibuat ulang dengan benih 2026 setelah bentuk figural riset dan bacaan verbal gaya baru digabung, lalu dibuka di Microsoft Word 16 (16 Okt 2026): terbuka tanpa perbaikan otomatis, dalam mode normal, dan tata letaknya (36 dan 34 halaman; PDF buatan generator 37 dan 37 halaman) diperiksa dari PDF ekspor Word. Paket 3 dan 4 benih 2026, yang memuat matriks 5x6, 2x2 bersekat, dan deret kotak ganda, juga dibuka di Word dengan hasil yang sama, jadi keempat bentuk figural riset dan bacaan verbal gaya baru sudah dilihat di Word. Uji otomatis tidak menjalankan Word. Beberapa halaman PDF/Word memuat ruang kosong karena soal dijaga agar tidak terpotong antarhalaman.
- **Soal interaktif** di Word/PDF tidak bisa diklik; yang interaktif hanya antarmuka peramban.
- **Urutan pilihan numerik**: pilihan diurutkan naik. Bila posisi kunci yang direncanakan tidak dapat dicapai dengan urutan naik (semua jalur kesalahan jatuh di satu sisi kunci), pilihan diurutkan **menurun** supaya huruf kunci A-E tetap merata; sekitar sepertiga soal numerik tampil menurun. Tanpa itu kunci menumpuk di C dan jarang di E.
- **Label tingkat kesulitan** adalah perkiraan berdasarkan banyaknya langkah dan jebakan; QC menyarankan kalibrasi lewat uji coba peserta.
- **Mata uang**: mengikuti tim akademik, soal tidak memakai "juta"/"ribu" (nominal ditulis utuh). Contoh riset sendiri memuat kedua gaya ($1.500 pada Bar Chart Asuransi dan $120 juta pada Pendapatan Penjualan).
- **Batas ZIP**: tanpa ZIP64, jadi ZIP semua Word, PDF, dan PNG untuk ratusan paket bisa mendekati batas 4 GB. Pakai `--format xlsx,json` untuk ratusan paket.
- **Kapasitas bank** terbatas (lihat bagian Kapasitas); paket tingkat `mudah` saja yang memuat Penalaran Numerik dibatasi sekitar 300 paket.
- Uji antarmuka butuh Chrome atau Edge terpasang dan Node.js 22+ (WebSocket bawaan); kalau tidak ada, bagian itu dilewati.
