# Generator Soal OJK PCAM Tahap 1 (Tes Potensi Dasar)

Membuat **paket soal** Tes Potensi Dasar OJK PCAM Tahap 1 lengkap dengan kunci dan pembahasan langkah demi langkah:

- **Kemampuan Umum** (pilihan ganda A-E): verbal, soal cerita, tabel, grafik batang, dan figural (serial dan matriks).
- **Penalaran Numerik** (soal interaktif): bar chart, tabel, Badges, line graph, dan pie chart. Jawabannya berupa *kondisi akhir tampilan*, bukan huruf.

Setiap soal dibuat dari angka dan fakta yang dihitung, lalu **dicek ulang dari nol oleh validator independen**. Hasil baru tampil atau ditulis ke berkas kalau semuanya lulus, dan tidak ada dua soal yang sama atau nyaris sama dalam satu kali generate, baik dalam satu paket maupun antarpaket.

Berjalan **tanpa instalasi apa pun dan tanpa internet**: tidak ada `npm install`, tidak ada pustaka luar. Antarmuka cukup dibuka dari `index.html` (atau lewat server lokal `node cli/buka.js`, juga dari Agent Office); CLI butuh Node.js 20 atau lebih baru.

## Badges / Logical Ranking (QC akademik 28 Oktober 2026)

Bank versi 23 mengikuti template `soal-logical-ranking-template.docx`: satu tabel **Nama | Deskripsi | Gambar | Posisi Urut** per soal. Sel Gambar berisi PNG tertanam, Posisi Urut berisi kunci 1–N, dan `Jawaban:` kosong. **Deskripsi terisi hanya satu kalimat dalam satu baris**, dengan font tabel tetap 10 pt. Deskripsi boleh kosong maksimal dua nama; ada juga soal tanpa deskripsi kosong. Header tabel diulang bila tabel melewati halaman; satu baris nama/foto tidak terpotong.

Naskah soal tidak lagi memuat petunjuk yang mengajari cara menalar atau menghitung: definisi arah peringkat, penjelasan sel kosong, urutan perkalian/tambahan, atau instruksi mengalikan dua angka dihapus. Konteks, satuan, arah pengurutan, dan fakta hubungan antarvariabel tetap tersedia. Penjelasan metode hanya ada di pembahasan. Laba bulanan menyebut unit/bulan dan laba/unit langsung pada deskripsi, sehingga tidak memerlukan paragraf penjelas tambahan.

Pada variasi deskripsi kosong, seluruh petunjuk yang diperlukan tetap tampil pada kartu lain atau pertanyaan; tidak ada informasi yang hanya disimpan pada kunci. Sel kosong benar-benar kosong, tanpa kalimat pengganti, sedangkan nama, gambar, dan lencana tetap tersedia. Petunjuk logika yang dipindahkan menyebut subjek lengkap agar tidak rancu. Soal perhitungan tetap memuat data lengkap. Batas 0–2 berlaku untuk setiap soal; validator membaca narasi aktual dan harus menemukan **tepat satu urutan**.

Subpola baru pada keluarga selisih posisi dikembangkan dari empat gambar SHL pengguna (dua gambar merupakan pola gaji yang sama): gaji dengan kelompok tiga teratas, kondisi jika, dan perbandingan jarak; kedatangan dengan peringkat ganjil/kelompok teratas; kedatangan kantor dengan jarak tanpa arah dan jarak minimum. Soal dikembangkan dalam bahasa Indonesia memakai nama/foto bank pengguna. Pola kantor pada contoh asli masih memiliki tiga kemungkinan; satu relasi tambahan membuat pengembangannya tunggal. Ekstensi ke 7/8 nama menambahkan pegawai dengan petunjuk peringkat yang eksplisit. Ini tetap Chapter **Badges**, tanpa menambah mapping atau mengklaim semua variasi adalah format tes resmi.

Pembahasan kendala campuran memakai tabel kemungkinan nama × peringkat. Setelah setiap petunjuk, tampilkan posisi yang masih mungkin dan jumlah urutan yang tersisa; hanya kandidat yang memenuhi petunjuk sampai langkah itu yang ditampilkan. Akhirnya setiap nama memiliki satu peringkat. Pemecah validator terpisah dari penyusun dan pembuat visual, termasuk pemeriksaan makna kondisi jika serta petunjuk pada pertanyaan.

Redaksi singkat memakai nama lengkap sebagai rujukan, tanpa kode nama atau persamaan. Pecahan angka seperti "3/4 dari" tidak dipakai pada deskripsi; hubungan dinyatakan dengan persentase, selisih waktu atau nilai langsung yang setara. Contoh: "13 jam lebih lama dari Perusahaan Cemerlang." dan "Menjual 120 unit; harga $35, biaya 80% harga jual." Hubungan panjang tetap dapat dijelaskan pada pembahasan. Fakta logika yang tidak ditempatkan pada kartu tercantum pada pertanyaan. Penyebaran fakta mempertahankan jumlah sel kosong dan solusi tunggal. Pengurai terpisah (`cek-kartu-badges.js`) membaca ulang **semua fakta yang tampil**, termasuk pada pertanyaan.

Semua soal baru memakai **6–8 variabel**: mudah 6, sedang 7, sulit 8; laba bulanan mudah 6 dan sedang 7 atau 8. Contoh angka akademik asli tetap 6. Pengujian juga menolak petunjuk ambigu, bertentangan, rujukan melingkar, rujukan nama tidak dikenal, nilai seri, dan jumlah variabel di luar batas. Visual pembahasan tetap dari kondisi awal sampai final; keuntungan mingguan tetap satu langkah per nama dengan seluruh kolom dihitung sekaligus.

Bank aktif memakai **75 pasangan nama–gambar** dari `bank_aset_badges/manifest.json`: 26 orang, 17 produk, serta masing-masing 8 kendaraan, hewan, tumbuhan dan perusahaan. Satu soal memakai satu kategori dengan ukuran pembanding yang dijelaskan. Seluruh nama dan gambar tetap mengikuti manifest di kartu, mode coba, Word, PNG dan setiap visual pembahasan. Kategori dipilih otomatis; pemanggilan `Bank.buat` dapat menetapkan `opsi.kategoriEntitas` untuk membuat contoh tertentu. Warna, jenis objek atau urutan alfabet bukan sumber kunci. Seluruh nilai uang USD ($).

Bank ini memakai lima pola yang sudah tersedia; konteks objek memperluas variasi latihan tanpa mengklaim semua variasi pernah muncul pada tes asli. Ekspor khusus Badges diberi judul **Bank Latihan Badges**. Nomor paket mengikuti identitas paket, termasuk P003 pada contoh QC ini. Mapping Category/Lesson/Chapter dan bentuk Logical Ranking tetap mengikuti gambar acuan pengguna.

Untuk memperbarui bundel offline setelah mengubah manifest/aset, jalankan `python cli/bundel-aset-badges.py` (Pillow diperlukan hanya saat membangun bundel). Gambar sumber tidak diubah; salinan untuk tampilan disesuaikan menjadi 128×128 dengan latar putih. SHA-256 sumber disimpan untuk memeriksa pasangan aset. Generator tetap berjalan tanpa dependensi tambahan atau internet setelah bundel tersedia. Renderer Node juga mendukung gambar bank di dalam SVG, sehingga foto/ikon tidak hilang pada ekspor CLI.

`node uji/contoh-qc-badges-kosong.js` menghasilkan `../hasil-badges-v23/review-12-soal/` dan `../hasil-badges-v23/paket-003-50-soal/`. Review mencakup tiga subpola dari contoh SHL, ketiga kuota kosong, lima keluarga Badges, dan enam kategori. Paket lengkap memuat 50 contoh baru. `node uji/qc-badges-ringkas.js` menguji satu kalimat/satu baris, ketiadaan petunjuk metode/pecahan pada deskripsi, fakta pada pertanyaan, dan kesetaraan hasil hitungan. `uji/qc-badges-kosong.js` dan `uji/qc-badges-003.js` tetap memeriksa variasi kosong, pola SHL, 420 variasi lintas kategori serta uji negatif. `node uji/browser-qc-badges-003.js` memeriksa satu baris pada font 14 px, foto, diagram, interaksi dan tampilan mobile. `python uji/cek-narasi-pdf-badges.py <folder> --satu-baris` membaca hasil render Word, memeriksa satu baris pada font tabel 10 pt dan menambahkan bookmark per soal. Folder versi sebelumnya menjadi arsip QC.

**Semua keluarga Badges** kini memakai visual setiap langkah, dari kondisi awal hingga lencana final. Perbandingan menunjukkan rantai yang disambungkan petunjuk demi petunjuk; rantai yang terpisah belum dibandingkan. Waktu menunjukkan konversi dan hitungan rujukan disertai grafik kemajuan dalam jam. Keuntungan mingguan memakai **satu langkah per nama**: jumlah, harga, biaya, dan keuntungan dihitung sekaligus; satu baris tabel langsung selesai. Enam sampai delapan nama memakai enam sampai delapan langkah, di luar kondisi awal/final. Rujukan antarnama dikerjakan lebih dahulu; rujukan dalam satu nama (misalnya biaya berupa persen harga) dihitung dalam langkah yang sama. Laba produk mengalikan unit bulanan dengan laba per unit. Nilai baru ditandai jingga, data rujukan biru, dan peringkat final hijau. Validator mengaudit setiap operasi/relasi menggunakan petunjuk dan hitungan independen.

Jalankan `node uji/contoh-badges-semua-visual.js` untuk satu contoh setiap keluarga di `../hasil-badges-v19/semua-fam-visual/` (lima soal, 41 visual, Word dengan Equation Word, PDF, Excel, JSON, PNG, SVG). Word menjaga teks langkah, persamaan, dan diagramnya dalam satu halaman bila muat. JSON menyimpan `mulai` untuk awal langkah yang memuat beberapa paragraf, serta `setelah` untuk paragraf sebelum gambar. Pada keuntungan mingguan, `kolomBaru` berisi keempat kolom satu orang dan `operasi.hitung` menyimpan seluruh perhitungan inputnya. Pengujian khusus: `node uji/badges-langkah.js` dan `node uji/browser-badges-langkah.js`.

Pembahasan **selisih posisi** kini memiliki visual setelah setiap langkah: kondisi awal, titik acuan, penempatan satu orang per petunjuk, lalu konversi posisi relatif menjadi nomor peringkat. Orang rujukan ditandai biru, orang baru jingga, dan lencana akhir hijau; label tetap menjelaskan peran tanpa bergantung pada warna. Posisi relatif boleh negatif. Gambar antara hanya menampilkan posisi yang sudah diturunkan, tanpa memakai batas urutan akhir. Validator memeriksa jejak terhadap petunjuk asli dan solusi independen.

Visual yang sama ditampilkan di aplikasi, Word, PDF, dan PNG. JSON menyimpan `gambarPembahasan[].setelah` untuk menghubungkan gambar dengan paragraf langkah; Excel mencatat PNG berurutan di `berkas_gambar_pembahasan`. Jalankan `node uji/contoh-peringkat-langkah.js` untuk dua contoh (contoh delapan nama dari pengguna dan kasus posisi negatif) di `../hasil-badges-v17/visual-posisi/`. Jalankan `node uji/peringkat-langkah.js` dan `node uji/browser-peringkat-langkah.js` untuk pemeriksaan khusus.

Arsip versi 16 memakai delapan tokoh fiktif Andi, Budi, Eko, Farhan, Citra, Dewi, Lili, Tiara pada `assets/foto-badges/`. Arsip ini dipertahankan untuk contoh dan uji lama; generator aktif versi 20 memilih dari manifest pengguna di `bank_aset_badges/`. JSON mencatat profil sumber dan `gambarIsian`; Excel mencatat lokasi PNG pada `berkas_gambar`; Word menyematkan gambarnya langsung di tabel.

Jalankan `node uji/contoh-badges-siadu.js` untuk enam contoh pada lima keluarga, Word SiAdu, PDF latihan/pratinjau, Excel, JSON, dan delapan foto. Hasil berada di `../hasil-badges-v16/contoh-siadu/`. `node uji/siadu-badges.js` memeriksa metadata gender, isi sel, kunci, dan byte PNG terhadap foto tokoh; `node uji/browser-foto-badges.js` memeriksa foto serta Word yang dibuat dari browser.

Bank versi 15 menambahkan keluarga **Laba penjualan produk (riset akademik)** (`peringkat-produk`). Enam produk A–F disajikan dalam tabel dua kolom: rata-rata unit terjual per bulan dan laba per unit dalam USD. Peserta memasangkan lencana 1 (laba bulanan tertinggi) hingga 6 (terendah). Pembahasan menghitung **unit terjual × laba per unit**, lalu membandingkan hasil keenam produk. Data dolar sudah merupakan laba per unit. Ilustrasi produk membantu membedakan label; tidak memengaruhi hitungan. Jawaban awal kosong dan laba seri ditolak.

Keluarga ini tersedia pada tingkat mudah dan sedang. Mudah memakai unit ribuan dan laba satuan sederhana; sedang memakai unit kelipatan 500, laba per unit hingga dua angka desimal, serta setidaknya dua hasil laba berdekatan. Hitungan langsung ini tidak diberi label sulit. Empat keluarga sebelumnya tetap tersedia, termasuk narasi keuntungan mingguan per orang dengan pecahan/persen dan biaya produksi. Semua keluarga berada dalam Chapter **Badges**, Bentuk Soal **Logical Ranking**, tanpa Subchapter tambahan.

Untuk menghasilkan satu soal dengan data persis contoh akademik dan tiga variasinya dalam Word, PDF, Excel, dan JSON: `node uji/contoh-badges-produk.js`. Hasil berada di `../hasil-badges-v15/laba-produk/`. Kunci contoh akademik: Produk E, A, D, F, C, B. Validator menghitung ulang secara independen dan pembaca ekspor memeriksa tabel serta angkanya.

Untuk membuat enam contoh khusus keluarga ini (dua mudah, dua sedang, dua sulit) beserta Word, PDF, Excel, dan JSON: `node uji/contoh-badges.js ../hasil-badges-v14/keuntungan-penjualan --laba`.

Pilih **Per Chapter/Subchapter → Numerik/ Kuantitatif → SHL Interaktif → Badges**, isi jumlah, lalu Generate soal. Subchapter kosong sesuai mapping terbaru. Lima pola berada dalam Chapter yang sama: perbandingan penjualan, selisih posisi, waktu penyelesaian proyek, keuntungan bersih per orang, dan laba bulanan produk. Generator menggilir pola yang tersedia; pilih minimal lima soal pada tingkat mudah atau sedang untuk mencakup kelimanya.

Klik kartu nama untuk membaca petunjuk. Pasangkan badge nomor ke nama dengan klik nomor lalu nama, seret badge, atau pilih nomor lewat keyboard. Nomor yang sudah terpakai bertukar tempat. Jawaban awal kosong; tersedia Periksa jawaban, Lihat kunci, dan Ulang dari awal.

Pada generator aktif versi 21, empat keluarga selain laba bulanan memakai enam nama pada mudah, tujuh pada sedang, dan delapan pada sulit. Laba bulanan memakai enam pada mudah dan tujuh atau delapan pada sedang. Semua petunjuk harus menghasilkan satu urutan, tanpa nilai seri. Validator memecahkan relasi secara independen dan menghitung waktu/keuntungan dengan pecahan eksak. Nominal keuntungan memakai dolar AS, dan biaya per unit pada soal keuntungan mingguan mencakup seluruh biaya.

Komposisi baku mengikuti gambar terbaru: KU 3 verbal, 2 cerita, 2 tabel, 1 grafik, 2 serial, 2 matriks. PN 2 Bar Chart, masing-masing 1 Table Decision 2 Opsi dan 3-4 Opsi, 2 Badges, 2 Line Graph, serta masing-masing 1 Pie Chart penuh dan kosong. Total tetap 12 KU (10 menit) dan 10 PN (18 menit). Dua matriks mencakup satu 3x3/2x2 bersekat dan satu 5x5/5x6. Komposisi kustom lama dipertahankan; untuk mengikuti komposisi terbaru klik **Baku**. Pada komposisi PN kustom CLI, tulis `peringkat=2` untuk menyertakan Badges; jika tidak disebut, nilainya 0 untuk kompatibilitas komposisi lama.

Word menulis `Bentuk Soal: Logical Ranking`, pengantar, pertanyaan, tabel Nama/Deskripsi/Gambar/Posisi Urut, Jawaban kosong, dan Pembahasan. PDF latihan menyediakan lembar peringkat kosong dan pembahasan. Excel memuat kolom `bentuk_soal`; JSON memuat `bentukSoal` serta kartu, profil, pengaturan, dan kunci di `isian`. Naskah Word diverifikasi dengan pembacaan ulang; impor Logical Ranking ke aplikasi SiAdu eksternal belum diuji.

```powershell
node cli/generate.js --materi pn-peringkat=12 --paket 1 --benih 20261026 --format semua --zip
node uji/peringkat.js
node uji/contoh-badges.js ../hasil-badges-v13/contoh-badges
```

## Cara pakai

### Generate per Chapter/Subchapter (bank versi 12, 23 Oktober 2026)

Pilih **Mode generate → Per Chapter/Subchapter**, lalu pilih Category, Lesson, Chapter, dan Subchapter sesuai mapping akademik. Pilih **Semua Subchapter** untuk mengambil soal dari seluruh Chapter. Chapter tanpa Subchapter menampilkan **Tanpa Subchapter**. Isi **Soal per set** (1-60), lalu klik **Tambahkan**; ulangi untuk materi lain. Jumlah tiap materi bisa diedit atau dihapus di daftar pilihan.

Atur tingkat kesulitan dan **Jumlah set** (baku 1 saat pertama beralih ke mode ini), lalu klik **Generate soal**. Setiap set memenuhi jumlah tiap materi; tidak ada tambahan dari komposisi tryout. Mode ini tidak mencantumkan durasi tryout. Word, PDF, Excel, JSON, ZIP, kunci, pembahasan, dan mode coba interaktif tetap tersedia. Pengaturan pilihan disimpan pada peramban.

Tidak semua materi memiliki soal mudah: **SHL_Analisis Tabel / Aritmatika Keuangan** dan **SHL_Analisis Tabel / Aljabar Dasar** hanya sedang/sulit. Pada mode campur, bobot dibagi ulang di tingkat yang tersedia untuk setiap pilihan; memilih tingkat yang tidak tersedia menghasilkan pesan untuk mengubah pengaturan. Seluruh Chapter dan salah satu Subchapter-nya tidak dapat dipilih bersamaan agar kuotanya tidak tumpang tindih. Pilihan beberapa Subchapter berbeda dalam satu Chapter diperbolehkan.

Contoh lewat CLI:

```
node cli/generate.js --daftar-materi
node cli/generate.js --materi ku-serial=5 --paket 1 --zip
node cli/generate.js --materi ku-cerita/aljabar-dasar=10,pn-pie-penuh=5 --paket 2 --zip
```

`--materi` memakai daftar ID dari `--daftar-materi`; jangan digabung dengan `--subtes` atau `--komposisi-ku/--komposisi-pn`. `--paket` berarti jumlah set saat mode materi. Agent Office menyediakan pekerjaan **Buat soal per Chapter/Subchapter** dengan pilihan yang sama. JSON mencatat `meta.mode`, `meta.materi`, dan durasi `null` pada mode materi. Validator memeriksa kuota dan menolak soal di luar pilihan. `node uji/materi.js` memeriksa katalog, tingkat, determinisme, ekspor, serta CLI.

Istilah figural **titik di pangkal panah** diperbaiki menjadi **titik di tengah bidang** pada teks dan gambar pembahasan, karena titik tersebut juga muncul pada gambar tanpa panah.

### 1. Di peramban

Buka `index.html` (klik dua kali; tidak perlu server). Bisa juga lewat alamat `http://localhost` dengan `node cli/buka.js` atau tombol Agent Office (lihat bagian 3 dan 4); isinya sama.

Generator ini juga tampil di situs gabungan Tahap 1 + Tahap 2 (repo `ojk-tahap-2-generator`, folder `tahap-1/`, dilayani di `/tahap-1`). Di sana bilah atas menampilkan tab **Tahap 1 | Tahap 2** (`js/situs.js`, alamatnya diisi saat build situs gabungan); bila dibuka sendiri, tab itu tidak tampil.

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
| `--materi <id=jumlah,...>` | Hanya Chapter/Subchapter pilihan; jumlah 1-60 tiap pilihan per set. Lihat bagian di atas. |
| `--daftar-materi` | Menampilkan ID, nama Chapter/Subchapter, dan tingkat yang tersedia, lalu selesai. |
| `--format <daftar>` | Format keluaran dipisah koma: `docx`, `pdf`, `xlsx`, `json`, atau `semua`. Baku semua. Pintasan: `--docx --pdf --xlsx --json`. |
| `--zip` | Tambahkan satu berkas ZIP berisi semua hasil. |
| `--benih <n>` | Bilangan bulat 0 sampai 4294967295. Tanpa opsi ini benih diacak dan dicetak di akhir. |
| `--keluaran <folder>` | Folder induk hasil. Baku `output` (di folder generator). Hasil ditulis ke `<folder>/<waktu>/`, mis. `output/2026-10-15_101530/`. |
| `--tanpa-waktu` | Tulis langsung ke folder `--keluaran`, tanpa subfolder waktu. |
| `--tingkat <t>` | `campur` (baku), `mudah`, `sedang`, atau `sulit`. |
| `--proporsi <m:s:u>` | Perbandingan mudah:sedang:sulit saat tingkat campur. Baku `3:5:2`. |
| `--komposisi-ku <daftar>` | Soal per submateri Kemampuan Umum, mis. `verbal=4,cerita=2,tabel=2,grafik=1,serial=2,matriks=1`. Yang tidak disebut memakai nilai baku; isi `0` untuk meniadakan. |
| `--komposisi-pn <daftar>` | Soal per submateri Penalaran Numerik, mis. `bar=2,tabel=2,peringkat=2,garis=2,pie=2`. |
| `--skala <n>` | Skala gambar PNG 1 sampai 4. Baku 2. |
| `--rumus <latex\|equation>` | Cara Word menulis rumus pembahasan. `latex` (baku): teks LaTeX `$$...$$` di paragrafnya sendiri. `equation`: Equation Word (OMML), yang dikonversi SiAdu ke MathML. Excel dan JSON selalu LaTeX; PDF selalu menata rumusnya sendiri. |
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

`agent-office.json` mendaftarkan pekerjaan berikut untuk karyawan operator project ini:

- **Buka Generator OJK Tahap 1** (`cli/buka.js --port=3300`, tombol cepat *Buka Generator OJK*): menyalakan server di belakang layar. Begitu alamatnya tercetak, tombol cepat berubah menjadi *Buka Generator OJK · menyala* dan di obrolan ada tombol *Buka* (`http://localhost:3300`, atau port berikutnya kalau 3300 terpakai) dan *Matikan*. Keluaran server juga memuat link **Jaringan kantor** untuk dibagikan ke perangkat pada Wi-Fi/LAN yang sama. Tombol *Buka* tetap memakai localhost; servernya ikut mati saat Agent Office ditutup. Kalimat seperti "buka generator ojk" atau "nyalakan aplikasi ojk" menjalankannya; "uji generator ojk" tetap ke pekerjaan uji.
- **Buka Portal Generator OJK (Tahap 1 + Tahap 2)** (`cli/portal.js --port=3200`, tombol cepat *Buka Portal OJK*): menyalakan portal gabungan di `http://localhost:3200` dengan tab Tahap 1 dan Tahap 2. `cli/portal.js` hanya meneruskan ke `../Portal/buka.js` (skrip pekerjaan Agent Office harus berada di folder project ini). Tab Tahap 2 memakai ekspor statis TKU Studio: setelah Tahap 2 diperbarui, jalankan `node Portal/bangun.js` di folder `Tes OJK Generator`. Kalimat seperti "buka portal ojk" atau "buka tahap 2" menjalankannya; "buka generator ojk" tetap membuka Tahap 1 saja. Lihat `../Portal/README.md`.
- **Buat paket OJK Tahap 1** (`cli/generate.js`): isian *Subtes*, *Jumlah paket*, *Tingkat kesulitan*, *Proporsi*, *Soal per submateri* (Kemampuan Umum dan Penalaran Numerik), *Benih*, *Rumus pembahasan di Word* (`latex` atau `equation`), dan centang format Word, PDF, Excel, JSON, serta ZIP. Berkas Excel, JSON, dan ZIP muncul sebagai tombol *Buka hasil*; ringkasan HASIL menjadi laporan.
- **Uji generator OJK Tahap 1** (`uji/semua.js`): centang *Mode cepat* (sekitar 1 menit) atau jalankan uji lengkap (sekitar 1,5 menit); *Tambah uji kapasitas* menambah sekitar 3 menit.

Kalau opsi CLI berubah, perbarui `agent-office.json` di perubahan yang sama (aturan project ini); uji `uji/semua.js` memeriksa bahwa tiap opsi di sana ada di `--help` dan di isi script. Untuk pekerjaan aplikasi, uji itu juga memeriksa bahwa regex `alamat` menangkap baris yang dicetak `cli/buka.js` dan bahwa port baku di perintah dan catatan sama dengan port baku di script, jadi mengganti port baku berarti mengubah `cli/buka.js` dan `agent-office.json` bersama-sama. Pekerjaan aplikasi tidak memakai `batas_menit`: servernya dibiarkan menyala sampai dimatikan.

## Bentuk soal per submateri

Tiap soal punya **stimulus, pertanyaan, pilihan A-E** (atau bentuk isian), **kunci**, **pembahasan langkah demi langkah** yang hanya menjelaskan jawaban benar (jalur kesalahan tiap pengecoh tetap tersimpan di data opsi dan diperiksa validator), **klasifikasi Kerangka Course** (Category, Lesson, Chapter, Subchapter), dan **tingkat kesulitan** (mudah, sedang, sulit). Ada **56 keluarga soal aktif** (6 di antaranya bentuk figural) dan **20 topik bacaan verbal**. Setiap soal juga mencatat **pola** penalarannya dan **kategori riset**: `acuan` bila bentuknya mengikuti contoh riset BAB V, `pengayaan` bila merupakan pengembangan tim (disertai catatan singkat alasannya).

### Pembahasan verbal (bank versi 11, 22 Oktober 2026)

Pembahasan mengikuti susunan contoh verbal yang diberikan pengguna: bacaan diulang utuh dengan nomor kalimat `(1)`, `(2)`, dan seterusnya; kalimat yang menjadi bukti dicetak tebal berwarna biru/hijau. **Penjelasan singkat** merujuk nomor kalimat bukti dan menerangkan hubungan bukti dengan pernyataan, lalu menyimpulkan Benar, Salah, atau Tidak Diketahui. **Cara Cepat** memberi petunjuk menemukan dan membandingkan informasi sesuai pola penalarannya. Warna menandai bukti, bukan kategori jawaban.

Format ini tampil pada pratinjau, Word, PDF, dan sel pembahasan Excel. JSON tetap memuat teks pembahasan serta menambahkan `pembahasanVerbal` (nomor dan teks kalimat, warna, indeks bukti, penjelasan singkat, dan cara cepat), sehingga tampilan berwarna dapat dibangun kembali. Pada soal nonverbal, nilai tambahan ini `null`. Klasifikasi tetap memakai mapping terbaru di bawah.

`node uji/verbal-bahas.js` memeriksa 57 jenis pernyataan dan 20 topik, menguji penolakan metadata/bukti yang rusak, serta membaca kembali hasil Word, Excel, dan JSON. Validator memastikan bukti yang disorot cukup untuk menghasilkan keputusan yang sama dengan pemeriksaan seluruh fakta bacaan.

### Rumus pembahasan dalam LaTeX (21 Oktober 2026)

Baris persamaan pembahasan (berawalan `§ ` di data, notasi LaTeX sederhana di `js/rumus.js`) kini keluar sebagai LaTeX supaya rapi dan mudah disalin:

| Keluaran | Bentuk rumus |
|---|---|
| Excel dan JSON | Teks LaTeX `$$...$$`, mis. `$$\frac{120}{4} = 30$$` atau `$$1{,}25 \times 1{,}6 = 2\ \text{m}^{3}$$` (`{,}` = koma desimal). Kolom `naskah_lengkap` juga |
| Word SiAdu | Baku: paragraf teks LaTeX `$$...$$`. Dengan `--rumus equation`: Equation Word (OMML) seperti sebelumnya |
| PDF | Ditata seperti persamaan: pecahan bertingkat dengan garis, pangkat dan indeks lebih kecil, simbol ×, ÷, ≈, ≤, ≥, → dari font Symbol. Rumus yang lebih lebar dari kolom ditulis sebagai teks biasa |
| Antarmuka peramban | HTML dengan pecahan bertingkat (tidak berubah) |

Baris `Diketahui`, `Ditanyakan`, `Pengerjaan`, dan `Kesimpulan` serta kalimat penjelas tetap teks biasa; hanya baris persamaan yang menjadi LaTeX.

### Revisi QC paket-002 (bank versi 5, 21 Oktober 2026)

Panduan revisi paket-002 dari tim akademik:

| Bagian | Revisi |
|---|---|
| Klasifikasi | Bank versi 10 memakai empat kolom pada gambar terakhir pengguna (lihat mapping di bawah). Tes dan Subtes tidak lagi dipakai sebagai Category/Lesson. Nilai kosong tetap kosong; semua ekspor mengambil klasifikasi yang sama dari `js/kerangka.js`. Keluarga peluang, himpunan, barisan-deret, dan konversi kurs tetap nonaktif |
| Mata uang | Semua uang dalam USD ($): £ dan € dihapus dari soal cerita, tabel, grafik, dan Table Decision (tabel harga per sentimeter kubik tanpa kurs; nominal Bonus Petugas Kredit kini puluhan ribu dolar) |
| Equation | Rumus, pecahan, pangkat, dan langkah hitung pada pembahasan ditulis sebagai baris persamaan (`js/rumus.js`, notasi LaTeX sederhana berawalan `§ `). Bentuk keluarannya kini LaTeX (lihat *Rumus pembahasan dalam LaTeX* di atas); Equation Word tetap tersedia lewat `--rumus equation` |
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

Untuk hasil berbeda pada generate berikutnya, tekan **Acak** pada benih. Benih dan pengaturan yang sama pada **versi bank yang sama** tetap menghasilkan paket identik. Bank terbaru menyimpan `meta.versi: 12`; benih dari versi sebelumnya dapat menghasilkan susunan berbeda setelah pembaruan ini.

### Kemampuan Umum (12 soal baku, 10 menit)

| Submateri | Bentuk | Keluarga soal |
|---|---|---|
| Verbal (3) | Bacaan informatif 120-180 kata (umumnya 125-155) yang berpusat pada fakta yang ditanyakan, ditambah 2-3 fakta setema sebagai pengecoh dan kalimat latar, diikuti satu pernyataan polos (tanpa label dan tanpa kalimat perintah) yang harus **disimpulkan**: **Benar / Salah / Tidak Diketahui** (tiga pilihan). 20 topik: 10 umum (penerbangan sipil, upah minimum, bank sampah, pembelajaran jarak jauh, telemedisin, listrik surya atap, angkutan perkotaan, irigasi pertanian, desa wisata, hutan mangrove), 4 keuangan (literasi keuangan, asuransi mikro, pinjaman daring, perbankan digital), dan 6 topik tambahan (penanganan pengaduan konsumen, keamanan akun digital, pengelolaan arsip digital, distribusi pangan segar, perpustakaan digital, audit energi gedung). | 1 keluarga, 57 jenis pernyataan dalam 14 pola. Mudah: anggota daftar (juga dengan kata lain), daftar terbuka ("seperti", "antara lain") dan "satu-satunya", cakupan dan pengecualian, kuantor sederhana, status teori/terbukti yang tertulis, urutan "pertama", temuan setempat. Sedang: golongan dua langkah, kuantor ("tidak semua", "sebagian" vs "sebagian besar"), "secara teori" vs "terbukti", urutan "sebelum", arah sebab-akibat langsung, daftar "hanya", penerapan syarat, batas waktu ("paling lambat"), perbandingan berantai. Sulit: rantai sebab-akibat (juga dibalik), perbandingan bercabang, syarat perlu/cukup yang tidak menentukan (angka kasus di pernyataan), sebab-akibat terbalik, generalisasi dari temuan setempat |
| Numerik: Soal cerita (2) | Cerita hitungan, 5 pilihan angka; tiap pengecoh dari jalur kesalahan yang ditulis hitungannya | 15 keluarga aktif: pecahan dan persen pada sisa zat, persentase peningkatan kecepatan, dua persamaan tiga benda (dengan substitusi), balik modal mesin, bulan lunas dengan laba naik dan uang muka, selisih pendapatan penjual, perbandingan campuran, diskon berlapis, pengukuran dan konversi satuan wadah, perbandingan waktu tempuh, kerja bersama, kecepatan rata-rata, rata-rata gabungan, harga sebelum diskon, bunga tunggal. Konversi mata uang, peluang, barisan, dan irisan kelompok dinonaktifkan (di luar Kerangka Course atau bertentangan dengan ketentuan USD) |
| Numerik: Tabel (2) | Tabel data (gambar) + pertanyaan | 13 keluarga: perbandingan dua baris, persentase gabungan dua kelompok, tahun sampai melampaui, biaya rata-rata per mesin, kenaikan laba produk (dengan asumsi produksi maksimum terjual), unit terjual yang hilang, harga per sentimeter kubik dan per liter (termasuk selisih harga per liter dua tangki, semuanya dalam dolar tanpa kurs), persentase perubahan, pertumbuhan majemuk, rata-rata gabungan, biaya rata-rata tertimbang dan retur, pencapaian target cabang, produktivitas per orang per jam |
| Numerik: Grafik batang (1) | Grafik batang (gambar) + pertanyaan | 6 keluarga: tim dengan hasil baik terbanyak, perubahan total dua seri, persen sumbangan batang, perbandingan dua batang, laba/margin dari dua seri, rata-rata yang diperlukan untuk mencapai target |
| Figural: Serial (2) | The Next Box dan The Next Double Box | Variasi bentuk, posisi, rotasi, jumlah, ukuran, corak/isian, dan kode kotak ganda. Hanya dua bentuk serial pada mapping; lihat batas riset di bawah. |
| Figural: Matriks (2) | Kotak 3x3, 2x2 bersekat, 5x5, dan 5x6 | Distribusi bentuk/warna, perpindahan, gabung/kurang unsur, hubungan antarkuadran, potongan dua kotak atau dua posisi terpisah, dan bagian baris/kolom kosong. |

Acuan aktif figural adalah tujuh PDF dan mapping kiriman 22 Oktober 2026. Matriks simbol-sambungan dan pengayaan pada bank versi lama tidak lagi masuk paket. Aturan kode pada kotak ganda mempertahankan revisi QC sebelumnya: jawaban sedang/sulit melibatkan dua kode aktif. Rincian variasi yang diimplementasikan tercantum berikut.

### Mapping akademik terbaru (bank versi 10, 22 Oktober 2026)

Nama pada gambar terakhir digunakan persis, termasuk huruf besar/kecil, `[BS]`, awalan `SHL_` pada Chapter numerik/verbal Kemampuan Umum, dan `Figural`. Keenam Chapter interaktif memakai nama tanpa awalan `SHL_`; Lesson-nya tetap `SHL Interaktif`. Tes tetap **Tes Potensi Dasar (TPD)**; subtes tetap **Kemampuan Umum** atau **Penalaran Numerik**. Keduanya terpisah dari empat kolom klasifikasi.

| Subtes | Category | Lesson | Chapter | Subchapter |
|---|---|---|---|---|
| Kemampuan Umum | Penalaran Verbal | Analitis | SHL_Verbal Reasoning | kosong |
| Kemampuan Umum | Numerik/ Kuantitatif | Soal Cerita [BS] | SHL_Soal Cerita | Bilangan dan Perbandingan; Aljabar Dasar; Laju dan Waktu; Aritmatika Keuangan |
| Kemampuan Umum | Numerik/ Kuantitatif | Tabel dan Grafik [BS] | SHL_Analisis Tabel | Bilangan dan Perbandingan; Persentase dan Pertumbuhan; Rata-rata; Aritmatika Keuangan; Aljabar Dasar; Pengukuran dan Konversi Satuan |
| Kemampuan Umum | Numerik/ Kuantitatif | Tabel dan Grafik [BS] | SHL_Interpretasi Grafik | Persentase dan Pertumbuhan |
| Kemampuan Umum | Penalaran Spasial | Bangun Datar | keenam Chapter Figural pada tabel di bawah | kosong |
| Penalaran Numerik | Numerik/ Kuantitatif | SHL Interaktif | Bar Chart | kosong |
| Penalaran Numerik | Numerik/ Kuantitatif | SHL Interaktif | Badges | kosong |
| Penalaran Numerik | Numerik/ Kuantitatif | SHL Interaktif | Table Decision - 2 Opsi | kosong |
| Penalaran Numerik | Numerik/ Kuantitatif | SHL Interaktif | Table Decision - 3-4 Opsi | kosong |
| Penalaran Numerik | Numerik/ Kuantitatif | SHL Interaktif | Line Graph | kosong |
| Penalaran Numerik | Numerik/ Kuantitatif | SHL Interaktif | Pie Chart - Informasi Penuh | kosong |
| Penalaran Numerik | Numerik/ Kuantitatif | SHL Interaktif | Pie Chart - 1 Informasi Kosong | kosong |

Pemisahan Chapter Table Decision membaca jumlah opsi aktual (2, 3, atau 4); Pie Chart membaca bentuk informasi penuh/kosong. Untuk grafik KU, seluruh keluarga ditempatkan pada satu Subchapter yang tersedia dalam gambar. Konsep lama yang lebih rinci tetap dapat ditelusuri lewat `keluarga` dan `pola`: misalnya rata-rata dan pengukuran dalam cerita masuk Bilangan dan Perbandingan, sedangkan produktivitas dalam tabel masuk Bilangan dan Perbandingan. Pemetaan tidak mengubah isi soal atau komposisi paket.

Subchapter kosong disimpan sebagai `null` pada JSON, sel kosong pada Excel, dan tanpa baris Subchapter pada Word SiAdu. **Kelipatan persen Bar Chart dan Pie Chart adalah 1%** pada mode coba dan hasil ekspor; kelipatan nominal/sumbu tetap mengikuti soal. `node uji/mapping.js` memeriksa seluruh 56 keluarga pada setiap tingkat serta membaca balik Word/Excel/JSON dari 57 contoh (termasuk Table Decision 2, 3, dan 4 opsi).

### Batas riset figural (bank versi 8, 22 Oktober 2026)

Bank aktif hanya memuat **enam bentuk** pada mapping yang diberikan pengguna. Jalurnya adalah **Tes Potensi Dasar (TPD) → Kemampuan Umum → Penalaran Spasial**. Jumlah pola bertambah di dalam bentuk; bobot pemilihan tetap dua bentuk serial dan empat bentuk matriks.

| Lesson | Chapter pada mapping | Pola yang tersedia | Acuan PDF dan halaman |
|---|---|---|---|
| Bangun Datar | Figural Serial - The Next Box | Pergantian bentuk/isian, perpindahan posisi, rotasi 45/90/135/180 derajat, jumlah objek, ukuran, isian bertambah, kombinasi pola; 4–6 kotak termasuk tanda tanya | 01 The Next Box, hlm. 2–13; 00 Macam-Macam Transformasi Figural, hlm. 3–18 |
| Bangun Datar | Figural Serial - The Next Double Box | Bagian bawah mengodekan perubahan bagian atas; satu kode pada mudah, dua kode aktif pada jawaban sedang/sulit | The Next Double Box, hlm. 3–6; revisi QC akademik kotak ganda |
| Bangun Datar | Figural Matriks - Kotak 3x3 | Distribusi bentuk dan warna, perpindahan lima objek dan isian, penggabungan/pengurangan unsur gambar | 02 Matriks 3x3, hlm. 2–7; Transformasi Figural, hlm. 20 untuk pengurangan |
| Bangun Datar | Figural Matriks - Kotak 2x2 Bersekat | Hubungan corak antarkuadran dan penentuan bentuk sudut yang hilang | Kotak 2x2, hlm. 3–6 |
| Bangun Datar | Figural Matriks - Kotak 5x5 | Lima simbol sekali per baris/kolom dengan potongan dua kotak vertikal; pergeseran bentuk dan isian papan catur pada dua posisi terpisah | Kotak 5x5, hlm. 5–8 |
| Bangun Datar | Figural Matriks - Kotak 5x6 | Distribusi empat bentuk dan pola hitam/putih dengan bagian baris kosong; pergeseran enam bentuk dengan satu kolom kosong | Kotak 5x6, hlm. 5–8 |

`js/riset-figural.js` adalah satu pintu pemilihan. Lipatan kertas, analogi, memilih gambar berbeda, transformasi berdiri sendiri, matriks simbol-sambungan, dan pengayaan lain tidak ikut undian. Materi **Macam-Macam Transformasi Figural** menjadi pustaka aturan, bukan bentuk soal ketujuh. Tidak semua contoh dalam PDF dibuat ulang; tabel di atas menyatakan pola yang sudah diimplementasikan. Perbedaan angka langkah, simbol, letak kosong, isian, dan gabungan aturan memperluas variasi dalam batas tersebut.

Setiap butir figural memiliki `riset`: sumber, halaman acuan, varian, dan `pemetaan` enam kolom sesuai gambar. Metadata ini ikut JSON; Excel menambahkan `acuan_figural` dan `mapping_figural`. Empat kolom klasifikasi Word, Excel, dan JSON mengikuti gambar terakhir pengguna: seluruh figural memakai Lesson `Bangun Datar`, nama Chapter berawalan `Figural`, dan Subchapter kosong. `riset.pemetaan` memakai identitas yang sama.

Pemeriksa baru di `js/cek-pola-riset.js` menyimpulkan jawaban dari gambar yang tampak, tanpa membaca aturan atau kunci penyusun. Validator paket menolak keluarga di luar enam bentuk maupun butir tanpa metadata riset. Berkas modul pengayaan lama tetap disimpan untuk membaca/merender keluaran lama, tetapi tidak didaftarkan dalam bank aktif.

Tingkat kesulitan didasarkan pada banyaknya aturan yang harus diperiksa: pola tunggal untuk variasi dasar, dua aturan untuk sedang, dan kombinasi lebih banyak untuk sulit. Label ini masih perkiraan desain dan tetap perlu kalibrasi hasil pengerjaan peserta.

### Penalaran Numerik (10 soal baku, 18 menit), interaktif

| Submateri | Yang dilakukan peserta | Bentuk |
|---|---|---|
| Bar chart (2) | Mengatur **total** dua batang bertumpuk (kelipatan sesuai soal) dan **persentase** kedua bagiannya (kelipatan 1%) | 10 bingkai topik (asuransi, pendapatan, anggaran, produksi, kredit, klaim, dana pihak ketiga, dompet digital, reksa dana, pajak daerah), nominal ditulis utuh; pola per tingkat: mudah = total dan bagian naik persen yang sama atau persen bagian diberikan, sedang = satu bagian berubah persen/nominal lalu bagian lain dicari, sulit = selisih nominal antarbagian atau kedua bagian berubah dan total periode kedua dicari |
| Table (2) | Memilih jawaban di **tab Orang A-D** | mencapai target atau tidak (2 opsi, dua syarat); kategori komisi/insentif/bonus (3 opsi seperti contoh riset, atau 4 opsi sebagai pengayaan) dari rata-rata nilai per transaksi bersih, dengan istilah yang sama di ketentuan, tabel, dan pembahasan |
| Line graph (2) | Menggeser **lima titik** atau mengisi kolom angka tiap titik; sumbu paling banyak 120 langkah geser | 5 keluarga: perubahan tetap per periode (area cakupan, saldo tabungan, suhu), persen dari nilai awal (rekening saham), persediaan gudang, perubahan bergantian (gudang, tangki air, ruang arsip), dan pertumbuhan majemuk dari nilai hari sebelumnya (pengayaan); mudah = perubahan rutin saja, sedang = ditambah satu kejadian sekali-jadi, sulit = laju berubah mulai titik tertentu dan ada satu kejadian; setiap kejadian tertulis di soal |
| Pie chart (2) | Menggeser **batas irisan** (kelipatan 1%) sampai keempat persentase sesuai keterangan | keterangan dalam empat kotak kategori berwarna sama dengan irisannya; informasi penuh, atau satu informasi kosong (kotak dasar tanpa isi; dasar dicari dari jumlah dan hubungan antaririsan, berantai pada tingkat sedang/sulit) |

PDF menyediakan tampilan awal dan lembar isian; Word mengikuti tabel input tiap bentuk. Untuk Badges, keduanya memuat seluruh petunjuk dan peringkat. Grafik memiliki gambar kunci pada pembahasan PDF.

## Cara kerja

### Pembuatan soal dan benih

Semua pengacakan diturunkan dari benih utama, nomor paket, subtes, nomor soal, dan nomor percobaan (pengacak berbenih sendiri). Pada versi bank yang sama, hasil bisa diulang persis dan **paket nomor N tidak bergantung pada jumlah paket yang diminta**. Keluarga soal diundi tanpa pengulangan dalam setiap siklus submateri, sehingga pasangan keluarga tidak selalu bertetangga dalam katalog dan tidak ada dua soal sekeluarga selama pilihannya masih cukup. Di dalam satu subtes, **pola** soal yang sudah dipakai dikirim ke penyusun (`polaDipakai`) dan calon dengan pola yang sama ditolak pada 30 percobaan pertama, kecuali penyusun menandai bahwa semua pola tingkat itu memang sudah terpakai (`polaTerpaksa`). Tingkat kesulitan dibagi menurut proporsi, dan **huruf kunci A-E dibuat merata** (tiap huruf hampir sama banyak per paket): posisi kunci dikejar pada 24 percobaan pertama, dan bila tetap meleset (pengecoh jalur kesalahan tidak selalu bisa mengapit kunci di posisi rencana) huruf rencana butir itu ditukar dengan butir berikutnya yang direncanakan berhuruf sama.

### Validator independen (`js/validator.js`)

Validator tidak memercayai kunci yang tersimpan dan tidak memanggil kode penyusun soal. Ia menghitung ulang dari data dan gambar yang benar-benar tampil, memakai **pecahan eksak** (BigInt), bukan bilangan kambang:

- **Soal cerita**: mengevaluasi ulang langkah hitung dengan parser rumus sendiri, mencocokkan setiap angka yang tercetak di soal dengan angka yang dihitung, dan memastikan **hanya satu opsi** yang bernilai sama dengan hasil. Setiap angka yang tercetak harus tercatat sebagai data dan harus **memengaruhi jawaban** (angka yang tidak terpakai, seperti berat mur pada catatan QC nomor 8, ditolak). Setiap pengecoh harus punya alasan (di data opsi) yang menuliskan hitungan jalur kesalahannya dan nilai pilihannya; alasan generik ditolak. Pembahasan wajib memuat `Diketahui`, `Ditanyakan`, `Pengerjaan`, `Kesimpulan` tepat sekali dan berurutan; Pengerjaan memuat baris persamaan; Kesimpulan menyebut nilai dan huruf kunci; setiap baris persamaan diperiksa tata tulisnya dan **setiap relasinya dihitung ulang dengan pecahan eksak** (`=` harus tepat, `≈` hanya selisih pembulatan angka yang tercetak, `<`/`≤`/`>`/`≥` harus benar). Uang hanya dalam dolar: £, €, atau kata kurs/euro/pound ditolak di mana pun.
- **Tabel dan grafik**: membaca sel dan batang dari **SVG yang digambar** (batang diukur terhadap garis bantu), lalu menghitung.
- **Verbal**: menurunkan Benar/Salah/Tidak Diketahui dengan aturannya sendiri dari **fakta berstruktur** yang dipakai merakit bacaan (golongan, cakupan dan pengecualian, daftar terbuka/tertutup, sebab-akibat berantai, kuantor, "secara teori", syarat perlu/cukup, batas waktu "paling lambat", temuan setempat vs generalisasi, urutan, perbandingan berantai dan bercabang). Istilah di pernyataan harus sama dengan istilah di bacaan, dan batas waktu untuk tahap lain yang dinyatakan tidak diketahui tidak boleh disebut di bacaan. Pasangan yang jawabannya bergantung pada makna tersirat (mis. memakai "sebagian" untuk menyimpulkan "tidak semua") ditolak. Bacaan harus tersusun tepat dari kalimat fakta, kata penanda tiap fakta ("tidak termasuk", "hanya", "seperti", "tidak semua", "secara teori", "sekurang-kurangnya", kata kerja naik/turun) harus tertulis di kalimatnya, dan hal yang dinyatakan tidak diketahui tidak boleh tertulis di bacaan.
- **Figural**: menebak aturan tiap kanal dari kotak yang tampak (`js/inferensi.js`, sengaja tidak berbagi kode dengan penyusun) dan memastikan **tepat satu opsi** memenuhi semua aturan; Bentuk riset diperiksa dari gambar soal dan gambar opsi yang tampil: matriks 5x5 dengan mencoba **semua** cara mengisi daerah "?" (harus tepat satu); matriks 5x6 dengan pustaka aturan bentuk dan warna (aturan yang dapat dipenuhi kotak tampak dianggap berlaku, dan hanya satu deret pengganti boleh memenuhi semuanya); 2x2 bersekat dengan pustaka asal belahan (kiriman tetangga, tertukar, belahan yang menghadap ke tempat lain, salinan gambar dalam atau pojok lain) yang harus menunjuk gambar pojok yang sama; deret kotak ganda dengan menjelaskan tiap bagian gambar atas sebagai "tetap", "berubah tiap kotak", atau "berubah bila belah ketupat ke-d abu-abu" (semua penjelasan yang cocok harus memberi kotak kelima yang sama); matriks 3x3 simbol-sambungan dengan pustaka hubungan jumlah, pola posisi, dan jenis ujung sambungan (`Inf.sambung`) yang harus menunjuk satu pilihan yang sama. Keluarga figural tambahan punya pemeriksa sendiri di `js/cek-*.js` yang tidak memakai kode penyusun: putaran dan pencerminan bangun bercorak dihitung ulang pada data bagian dan coraknya (sudut dan sumbu dibaca dari teks pertanyaan dan gambar soal, arah arsir dipetakan sendiri, bangun yang simetris ditolak), analogi menyimpulkan transformasi kotak 1 → 2 dengan pustaka sendiri (lebih dari satu kemungkinan dengan hasil berbeda berarti ambigu), deret dan matriks bercorak disimpulkan dengan pustaka pergeseran, siklus, gabung/geser/tukar belahan, dan pola letak, lipatan kertas dibuka ulang dalam urutan terbalik termasuk arah bentuk lubang dan lubang yang menyatu di garis lipat, gerakan benda dan jarum disimpulkan dari kotak yang tampak dengan pustaka lintasan dan langkah, dan matriks luar-dalam/jumlah mencoba seluruh pustaka aturan per baris dan per kolom. Semuanya harus menghasilkan tepat satu opsi.
- **Interaktif**: menghitung ulang kondisi akhir (total dan persen batang, nilai tiap titik, persentase irisan lewat sistem persamaan linear eksak, keputusan tiap tab tabel), dan memastikan tampilan awal tidak sudah benar. Line graph: rumus hanya boleh memakai parameter yang tertulis di soal (bilangan lain hanya pengali banyak langkah dan /100), setiap kejadian sekali-jadi harus punya kalimat yang memuat waktu dan besarnya, dan rentang sumbu paling banyak 120 langkah geser. Pie chart: empat kotak keterangan dengan judul dan warna irisannya, setiap relasi tertulis di kotak irisannya, dan kotak dasar bentuk kosong benar-benar kosong.
- **Pengecoh**: semuanya berbeda satu sama lain dan dijamin salah.
- **Paket dan hasil**: komposisi, nomor, dan id konsisten; **tidak ada butir kembar**.

Validator juga diuji **terbalik** (`uji/negatif.js`): soal yang sengaja dirusak (kunci digeser, dua opsi sama-benar, angka tabel, grafik, atau parameter diubah, kondisi awal disamakan dengan kunci, fakta verbal dibuang atau polaritasnya dibalik, polaritas pernyataan verbal dibalik, kalimat bacaan verbal dihapus, alasan pengecoh diganti kalimat generik atau dihapus, angka tak terpakai disisipkan ke soal, soal QC nomor 8 yang asli, kalimat kejadian line graph dihapus atau kejadiannya ditanam sebagai bilangan di rumus, sumbu line graph terlalu rinci, kotak keterangan pie dikosongkan atau warnanya ditukar, kode kotak ganda dibalik, potongan 5x5 ditukar, hubungan matriks simbol-sambungan dirusak, id ganda, butir kembar) harus ditolak semuanya. Setiap keluarga figural juga dibuat langsung dari bank pada ketiga tingkat, jadi "kunci digeser" dan "dua opsi sama-benar" pasti mengenai semua bentuk figural, dan bentuk riset dirusak isinya (kotak 5x5 diganti, warna atau bentuk 5x6 diubah, belahan gambar bersekat ditukar, kode belah ketupat kotak kelima dibalik). Uji itu pernah menemukan dua celah (deret berputar dan pie), yang sudah ditutup.

### Anti-kembar

Dua butir dinyatakan kembar kalau: sidik inti sama persis; atau (figural) kotak yang tampak sama dengan paling banyak satu kotak berbeda (matriks 5x5: empat kotak, matriks 5x6: tiga kotak; bentuk riset dibandingkan dalam keadaan utuh, jadi gambar yang sama dengan letak "?" berbeda tetap dianggap kembar); atau 3-gram kata teks (angka ikut dihitung; kotak keterangan pie ikut dihitung) mirip sekurang-kurangnya 85%; atau kerangka dan pelaku sama dan hanya satu angka yang berbeda. Penjaga ini dijalankan **saat soal dipilih** (lintas paket dalam satu kali generate) dan sekali lagi oleh validator terhadap seluruh hasil.

### Gambar tanpa dependensi

Soal hanya menyimpan **model** gambar (data murni); SVG dirakit saat dibutuhkan. Untuk PNG, Word, dan PDF ada penggambar piksel sendiri (`js/svgraster.js`: penguraian SVG, isian, garis, teks dari font garis, anti-alias) dan penulis PNG sendiri. Di peramban, PNG dibuat oleh kanvas bawaan (huruf sistem). Arsiran pada matriks bersekat (garis, titik, kotak-kotak, bintang) dihitung sendiri sebagai garis dan titik biasa yang dipotong ke dalam belahannya (`js/bentuk.js`), bukan pola SVG, sehingga PNG buatan CLI sama dengan tampilan peramban. Word (`js/docx.js`), PDF (`js/pdf.js`, tata letak sendiri, font standar Helvetica), Excel (`js/xlsx.js`), dan ZIP (`js/zip.js`) ditulis tanpa pustaka.

## Format ekspor

- **Word = format input SiAdu** (satu berkas per subtes: `paket-NNN-kemampuan-umum.docx` dan `paket-NNN-penalaran-numerik.docx`, karena importir membaca semua teks setelah `Pembahasan:` sampai `Soal N` berikutnya sebagai pembahasan, jadi judul subtes tidak boleh berada di antara soal). Teks sebelum `Soal 1` hanya pengantar dan diabaikan importir. Tiap soal ditulis persis mengikuti template SiAdu:

  ```
  Soal N                         (tebal)
  Category: Numerik/ Kuantitatif   (tebal)
  Lesson: Soal Cerita [BS]         (tebal)
  Chapter: SHL_Soal Cerita         (tebal)
  Subchapter: Aritmatika Keuangan  (tebal; hanya untuk numerik KU)
  Tingkat Kesulitan: Mudah | Sedang | Sulit
  Bentuk Soal: Option New | Bar Chart | Line Chart | Pie Chart | Table Decision | Logical Ranking

  <teks soal>
  ...
  Jawaban: ...
  Pembahasan:
  <isi pembahasan>
  ```

  | Bentuk Soal | Isi |
  |---|---|
  | Option New (Kemampuan Umum) | Bacaan/teks, gambar tabel, grafik, atau figural disisipkan di soal, lalu pertanyaan, pilihan `A.` sampai `E.` (verbal `A.` sampai `C.`; pilihan figural berisi gambar sebaris), dan `Jawaban: <huruf>`. Tidak ada tabel Word di soal pilihan ganda supaya tidak terbaca sebagai bentuk Table |
  | Bar Chart | Judul, keterangan berawalan `- `, `Pertanyaan`, `Pengaturan: Sumbu Y 0 - <maks>; Garis bantu <n>; Kelipatan nilai <n>; Kelipatan persen 1`, `Variabel: <bagian 1> 50%; <bagian 2> 50%`, lalu tabel `Kategori \| Nilai Awal \| Kunci Nilai \| <bagian 1> \| <bagian 2>` (kolom bagian berisi kunci persen, total 100) |
  | Line Chart | Judul, keterangan, `Pertanyaan`, `Pengaturan: Sumbu Y <min> - <maks>; Garis bantu <n>; Kelipatan nilai <n>`, lalu tabel `Titik \| Kunci Nilai` |
  | Pie Chart | Judul, kalimat pembuka (tanpa nama warna, karena SiAdu memberi warna irisan sendiri), tabel informasi 2x2 `Kategori: keterangan` (kotak dasar bentuk kosong hanya berisi judulnya), `Pertanyaan`, `Pengaturan: Kelipatan nilai 1; Nilai minimum 1`, lalu tabel `Bagian \| Nilai Awal \| Kunci Nilai` |
  | Table Decision | Judul, ketentuan berawalan `- `, `Pertanyaan`, `Label Keputusan: ...`, `Opsi: A. ...; B. ...`, lalu tiap tab `Tab: Orang A` diikuti tabel Word datanya, dan `Jawaban: Orang A: A; Orang B: B; ...` |

  Pembahasan hitungan berisi `Diketahui`, `Ditanyakan`, `Pengerjaan`, `Kesimpulan` (tebal) dengan setiap rumus dalam paragrafnya sendiri, baku sebagai teks LaTeX `$$...$$` atau sebagai Equation Word bila memakai `--rumus equation`; pembahasan figural diawali gambar tahapan polanya. Untuk grafik, gambar tampilan awal tidak disisipkan (grafiknya dibuat SiAdu dari tabel) dan `Jawaban:` dibiarkan kosong karena kuncinya ada di kolom `Kunci Nilai`. Pembahasan ditulis tanpa baris "Jenis soal" dan "Tampilan awal" karena SiAdu menuliskan kuncinya sendiri. `uji/siadu.js` membaca balik setiap berkas Word seperti importir dan mencocokkan nomor, identitas Kerangka Course (tebal), tingkat, bentuk, pilihan, tabel kunci, jawaban, jumlah persamaan (mode LaTeX dan mode Equation sama-sama diuji), dan gambar pembahasan dengan data soal. Word terbuka dalam mode normal, bukan Mode Kompatibilitas.
- **PDF** (per paket, naskah baca): tiap subtes mulai di halaman baru. Tiap nomor memuat soal, opsi, **Jawaban: A. teks jawaban**, lalu **Pembahasan:** langkah demi langkah. Jawaban interaktif berupa nilai/kondisi akhir dengan gambar kunci setelah label pembahasan. Kotak keterangan pie ditulis sebagai tabel 2x2 berwarna. Rumus pembahasan ditata seperti persamaan (pecahan bertingkat, pangkat, simbol matematika).
- **Excel** (`soal-ojk-tahap1.xlsx`), lembar *Soal*, **satu baris per soal**. Kolom wajib: `no, paket, subtes, submateri, level, soal, opsi_a, opsi_b, opsi_c, opsi_d, opsi_e, jawaban_benar, pembahasan, berkas_gambar`. Tambahan: `id, benih, keluarga, bentuk_isian, kunci_isian, berkas_gambar_pembahasan, pola, kategori_riset, catatan_riset, category, lesson, chapter, subchapter` (kategori riset `acuan` atau `pengayaan`; empat kolom terakhir dari Kerangka Course). Baris persamaan pembahasan ditulis sebagai LaTeX `$$...$$`. Kotak keterangan pie ditulis di kolom `soal` sebagai baris "Judul: isi" (kotak kosong ditandai "-"). Untuk soal bergambar, `berkas_gambar` dan opsi menuliskan nama berkas PNG yang ada di `paket-NNN/gambar/`. Lembar *Ringkasan* menghitung soal per paket, submateri, dan tingkat.
- **JSON**: seluruh paket dan soal (stimulus termasuk `kartu` pie, pertanyaan, opsi, kunci, langkah hitung, pembahasan, model gambar, bentuk isian dan nilai jawaban untuk soal interaktif, `pola`, `kategoriRiset`, `catatanRiset`) plus hasil validator. Baris persamaan pembahasan berupa LaTeX `$$...$$`.
- **PNG**: gambar soal dan gambar kondisi kunci, diberi nama `<id soal>-<id gambar>.png`.
- **ZIP**: gabungan di atas (ZIP biasa, tanpa ZIP64: paling banyak sekitar 4 GB dan 65.534 berkas).

## Kapasitas dan kecepatan

Diuji pada bank versi 2 dengan Node.js 24, benih 2026 dan komposisi baku (19 Oktober 2026):

| Pengaturan | Hasil |
|---|---|
| 500 paket `semua`, tingkat campur (11.000 butir) | Validator lulus 11.000/11.000, 0 kembar |
| 500 paket `semua`, tingkat mudah (11.000 butir) | Validator lulus 11.000/11.000, 0 kembar; kapasitas bertambah dibanding bank lama yang pada benih ini berhenti sekitar paket 300 |
| Uji langsung bank tambahan | 900 soal numerik/interaktif dan 540 soal verbal dari seluruh tingkat lulus; 1.440 salinan dengan kunci yang sengaja diubah semuanya ditolak |

Uji ulang pada bank versi 23 (56 keluarga aktif, komposisi baku termasuk Badges; 16 November 2026): `node uji/semua.js --besar --tanpa-peramban` lulus 436 pemeriksaan. 500 paket `semua` tingkat campur (11.000 butir), 500 paket `semua` khusus mudah (11.000 butir), 500 paket `ku` (6.000 butir), dan 500 paket `pn` (5.000 butir) semuanya lulus validator tanpa butir kembar; huruf kunci A-E tetap merata (sekitar 1.200 per huruf pada 500 paket). Uji lengkap dengan peramban (`node uji/semua.js`) lulus 535 pemeriksaan.

Catatan historis: setelah keluarga figural tambahan masuk (bank versi 6, 21 Oktober 2026), uji `--besar` juga lulus. Keluarga figural tambahan, termasuk keluarga bercorak, tidak ikut undian sejak bank versi 8, tetapi modulnya tetap diuji terpisah: `node uji/figural-baru.js --n 100` membuat 300 butir per keluarga untuk ke-13 keluarga, semuanya lulus validator tanpa pasangan kembar.

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
  cerita.js tabelku.js grafikku.js verbal.js figural.js inferensi.js
  variasi.js verbal-topik.js     keluarga tambahan (cerita, tabel, grafik, garis) dan 6 topik verbal tambahan
  serial-ganda.js matriks-latin.js matriks-isi.js matriks-sekat.js bentuk.js
                                           bentuk figural riset: kotak ganda, 5x5, 5x6, 2x2 bersekat, bentuk dasar
  corak.js                                 corak isian bersama untuk figural bercorak
  transformasi-corak.js analogi-corak.js serial-corak.js matriks-corak.js
  lipat-kertas.js serial-petak.js matriks-bentuk.js
                                           keluarga figural tambahan (pengayaan)
  cek-*.js                                 pemeriksa independen keluarga figural tambahan (dipanggil validator.js)
  pn-bar.js pn-tabel.js pn-garis.js pn-pie.js   Penalaran Numerik
  riset-figural.js pola-riset.js cek-pola-riset.js   enam bentuk aktif, variasi, dan inferensi independen
  gambar.js bank.js paket.js               deskriptor gambar, daftar keluarga soal, perakit paket
  validator.js                             pemeriksa independen
  dokumen.js docx.js pdf.js xlsx.js zip.js ekspor.js   penulis berkas
  coba.js app.js                           mode coba interaktif dan perekat antarmuka
  situs.js                                 tab Tahap 1 | Tahap 2 di situs gabungan (kosong bila berdiri sendiri)
cli/generate.js       perintah baris
cli/buka.js           server lokal untuk index.html (node cli/buka.js; tombol Agent Office)
uji/                  uji: semua.js (jalankan ini), negatif.js, qc.js, siadu.js, variasi.js, figural-baru.js, berkas.js, browser.js, peramban.js, server.js
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
node uji/riset-figural.js      # enam bentuk aktif, semua variasi/tingkat, mutasi kunci, pembatas riset
node uji/figural-baru.js       # uji kompatibilitas modul lama; tidak berarti aktif di bank
node uji/browser.js            # hanya antarmuka lewat file:// (perlu Chrome atau Edge dan Node.js 22+)
node uji/server.js             # hanya server lokal dan antarmuka lewat http:// (bagian peramban perlu Chrome atau Edge dan Node.js 22+)
```

`uji/semua.js` memeriksa: (1) paket per subtes dengan beberapa benih berbeda (validator, kembar, komposisi, kunci A-E); (2) benih dan komposisi; (2b) bank tambahan; (2c) regresi revisi QC paket P001 (`uji/qc.js`: tanpa label/petunjuk verbal, pertanyaan tidak tebal, tanpa "juta"/"ribu", line graph dapat digeser tepat, kotak pie, tanpa matriks 2x2 biasa, pengecoh dari jalur kesalahan, metadata riset); (2d) batas enam bentuk riset (`uji/riset-figural.js`: tiap keluarga dan tingkat dibuat langsung, lulus validator, kunci di posisi yang diminta, isi opsi kunci yang ditukar ke pengecoh harus ditolak, gambar dirasterkan, teks bersih, tanpa butir kembar); (3) validator negatif; (4) logika mode coba; (5) isi berkas Word, PDF, PNG, Excel, JSON, dan ZIP (ZIP dibuka dan CRC dicocokkan, XML diperiksa, Word bukan Mode Kompatibilitas, Word satu berkas per subtes dan terbaca sesuai template SiAdu, subtes kedua PDF mulai di halaman baru, tabel xref PDF dicek, data PNG didekompresi); (6) CLI termasuk semua jalur gagal; (7) `agent-office.json`; (8) `contoh-keluaran/`; (9) antarmuka di Chrome/Edge tanpa kepala, termasuk menyeret widget dengan mouse sungguhan dan mengunduh semua jenis berkas; (10) server lokal `cli/buka.js` (`uji/server.js`): MIME, penjaga path (traversal, path absolut, drive Windows, `%` rusak, tautan keluar folder), pemilihan port, berhenti rapi, dan perintahnya, lalu seluruh antarmuka (butir 9) diulang lewat `http://localhost` dengan dua unduhan Blob sungguhan. Server uji selalu menyala di port acak, tidak pernah di 3300. Hasil sementara ditulis ke folder sementara sistem, bukan ke project. Baris terakhir `HASIL: ...` atau `GAGAL: ...`.

## Batasan dan hal yang perlu dipertimbangkan

- **Bentuk soal dipelajari dari riset**, bukan salinan soal OJK. Komposisi baku (12 soal Kemampuan Umum, 10 soal Penalaran Numerik; 10 dan 18 menit) adalah asumsi dari riset dan bisa diubah per paket; sebaiknya dicocokkan dengan kisi-kisi resmi terbaru.
- **Verbal dirakit dari kerangka kalimat dan fakta**, bukan ditulis bebas. Bacaan disusun dari fakta yang ditanyakan, 2-3 fakta setema, dan kalimat latar, jadi tidak lagi memuat semua jenis fakta sekaligus; kalimat ambang dan batas waktu hanya muncul bila pernyataannya bergantung padanya. Kuncinya tetap pasti, tetapi tiap topik memakai kerangka yang sama (versi kalimat, anggota daftar, angka, dan kalimat yang dipakai diacak), sehingga bacaan setopik masih bisa terasa mirip bila banyak paket dikerjakan berurutan. Kalimat pendapat ("dinilai", "berpendapat", "sejumlah studi menyimpulkan") hanya menjadi latar dan pernyataan tidak pernah bergantung pada makna tersirat; karena itu jebakan seperti menyimpulkan sikap atau motif dari kalimat pendapat sengaja tidak dibuat. Pernyataan Tidak Diketahui tetap menuntut peserta mengabaikan pengetahuan di luar bacaan (mis. kegunaan yang benar di dunia nyata tetapi tidak disebut).
- **Huruf pada PNG buatan CLI** memakai font garis sendiri (mirip Helvetica), sedikit berbeda dari huruf sistem yang dipakai peramban. Isi Word dan PDF tidak terpengaruh: keduanya memuat gambar yang sama.
- **Word format SiAdu dibaca balik oleh uji** (`uji/siadu.js`) menurut aturan template, tetapi belum diimpor ke SiAdu sungguhan dari lingkungan uji; lakukan satu kali impor percobaan sebelum dipakai massal. Template grafik memakai contoh tingkat "Hots"; generator menulis Mudah/Sedang/Sulit sesuai tingkat soal.
- **Rumus LaTeX di Word** ditulis sebagai teks `$$...$$`, jadi di Word sendiri tampil sebagai kode, bukan rumus jadi. Belum dipastikan apakah importir SiAdu merender LaTeX; panduan revisi paket-002 meminta Equation Word. Bila hasil impor percobaan menampilkan kode mentah, buat ulang dengan `--rumus equation`.
- **Word dan PDF diuji strukturnya** (ZIP, XML, tabel xref, gambar) dan PDF dirender untuk pemeriksaan visual. Contoh Word di `contoh-keluaran/` dibuat ulang dengan benih 2026 setelah bentuk figural riset dan bacaan verbal gaya baru digabung, lalu dibuka di Microsoft Word 16 (16 Okt 2026): terbuka tanpa perbaikan otomatis, dalam mode normal, dan tata letaknya (36 dan 34 halaman; PDF buatan generator 37 dan 37 halaman) diperiksa dari PDF ekspor Word. Paket 3 dan 4 benih 2026, yang memuat matriks 5x6, 2x2 bersekat, dan deret kotak ganda, juga dibuka di Word dengan hasil yang sama, jadi keempat bentuk figural riset dan bacaan verbal gaya baru sudah dilihat di Word. Uji otomatis tidak menjalankan Word. Beberapa halaman PDF/Word memuat ruang kosong karena soal dijaga agar tidak terpotong antarhalaman.
- **Soal interaktif** di Word/PDF tidak bisa diklik; yang interaktif hanya antarmuka peramban.
- **Urutan pilihan numerik**: pilihan diurutkan naik. Bila posisi kunci yang direncanakan tidak dapat dicapai dengan urutan naik (semua jalur kesalahan jatuh di satu sisi kunci), pilihan diurutkan **menurun** supaya huruf kunci A-E tetap merata; sekitar sepertiga soal numerik tampil menurun. Tanpa itu kunci menumpuk di C dan jarang di E.
- **Label tingkat kesulitan** adalah perkiraan berdasarkan banyaknya langkah dan jebakan; QC menyarankan kalibrasi lewat uji coba peserta.
- **Mata uang**: mengikuti tim akademik, soal tidak memakai "juta"/"ribu" (nominal ditulis utuh). Contoh riset sendiri memuat kedua gaya ($1.500 pada Bar Chart Asuransi dan $120 juta pada Pendapatan Penjualan).
- **Batas ZIP**: tanpa ZIP64, jadi ZIP semua Word, PDF, dan PNG untuk ratusan paket bisa mendekati batas 4 GB. Pakai `--format xlsx,json` untuk ratusan paket.
- **Kapasitas bank** terbatas (lihat bagian Kapasitas); paket tingkat `mudah` saja yang memuat Penalaran Numerik dibatasi sekitar 300 paket.
- Uji antarmuka butuh Chrome atau Edge terpasang dan Node.js 22+ (WebSocket bawaan); kalau tidak ada, bagian itu dilewati.
