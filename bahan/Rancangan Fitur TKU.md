# JadiOJK - Rancangan Fitur TKU (Tahap 2 PCAM OJK)

Sumber: https://docs.google.com/document/d/10dlHfSw8pDwCI7mUqJP1WE5JFH1V9f4Ut_48MINroYk/edit
(fileId: 10dlHfSw8pDwCI7mUqJP1WE5JFH1V9f4Ut_48MINroYk; diambil 2026-11-09 via Google Drive MCP; dokumen tidak memiliki komentar)

Catatan: penanda `[image]` = gambar/tangkapan layar di dokumen asli (tidak ikut terekstrak sebagai teks).

---

# PENALARAN INDUKTIF

## Fill Shape

Siadu: Fill Shape

Di aplikasi JadiOJK:

[image]

- 3 Shape warna: Putih, Hijau, Ungu

Di SHL:

[image]

- 3 Shape warna sedikit berbeda: Putih, Hijau (#4a8508), Ungu Polkadot (#827bde)

**Pengembangan:**

- Mengganti warna ungu sesuai dengan warna SHL

## Drag the Line

Siadu: Node Arrow Navigation

Di aplikasi JadiOJK:

[image]

- Posisi node melingkar.
- Node dan arrow berwarna merah.

Di SHL:

[image]

- Posisi node acak.
- Node dan arrow berwarna hijau.

**Pengembangan:**

- Posisi node bisa diatur berdasarkan koordinat (x,y). Jari-jari node berukuran 0.5 satuan panjang.

# PENALARAN DEDUKTIF

## Calendar Date Selection

Siadu: Calendar Date Selection

Di aplikasi JadiOJK:

[image]

- Maksimal pilihan adalah sesuai jumlah kunci jawaban. Misalnya kunci jawaban ada 3, maka maksimal memilih tanggal adalah 3 juga.

Di SHL:

[image]

- Maksimal pilihan adalah selalu 5 meskipun kunci jawaban kurang dari 5.

**Pengembangan:**

- Setting maksimal pilihan adalah 5 meskipun kunci jawaban kurang dari 5.

## Room Allocations

Siadu: Place and Room Allocations

Di aplikasi JadiOJK:

[image]

- Satu ruang dapat diisi oleh berapapun variabel jawaban.
- Ada ruang kosong yang tidak ada keterangan nama ruangan.

Di SHL:

[image]

- Satu ruang maksimal diisi oleh 3 variabel jawaban.
- Tidak ada ruang kosong yang tidak ada keterangan nama ruangan.

**Pengembangan:**

- Fitur seperti excel untuk membuat kotak ruangan.

## Timeline Scheduling

Siadu: Timeline Scheduling

Di aplikasi JadiOJK:

[image]

- Tidak ada hover keterangan kegiatan pada masing-masing variabel soal.
- Tidak ada warna abu pada grid timeline.

Di SHL:

[image]

- Ada hover keterangan kegiatan pada masing-masing variabel soal.
- Ada warna abu pada grid timeline.

**Pengembangan:**

- Bisa menambahkan deskripsi kegiatan di setiap sel abu-abu
- Menambahkan sel abu pada jawaban.

## Badges

Siadu: Logical Ranking

Di aplikasi JadiOJK:

[image]

- Tidak terlihat lingkaran badges saat di drag.

Di SHL:

[image]

- Terlihat lingkaran badges saat di drag.

**Pengembangan:**

- Terlihat lingkaran badges saat di drag.

## Timeslot Scheduling

Siadu: Timeslot Scheduling

Di aplikasi JadiOJK:

[image]

- Tidak ada hover keterangan kegiatan pada variabel soal.
- Saat di drag, tidak terlihat masing-masing timeslot akan mengisi berapa kotak.
- Timeslot yang sudah diisi tidak dapat dipindahkan.

Di SHL:

[image]

- Ada hover keterangan kegiatan pada variabel soal.
- Saat di drag, terlihat masing-masing timeslot akan mengisi berapa kotak.
- Timeslot yang sudah diisi dapat dipindahkan.

**Pengembangan:**

- Ada hover keterangan kegiatan pada variabel soal.
- Saat di drag, terlihat masing-masing timeslot akan mengisi berapa kotak.
- Timeslot yang sudah diisi dapat dipindahkan.
