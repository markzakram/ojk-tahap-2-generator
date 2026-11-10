# TKU Studio — Generator Soal OJK Tahap 2

Generator soal Tes Kemampuan Umum (TKU) Tahap 2 PCAM 10 OJK 2026. Bahan riset, blueprint, dan mapping ada di [`bahan/`](bahan/00%20-%20Ringkasan%20Bahan.md).

```bash
npm install
npm run dev -- -p 3100      # Ringkasan di http://localhost:3100, Studio di /studio
npm run verify              # 300 seed per family; `npm run verify -- 1000 FS-` untuk family tertentu
npm run generate            # daftar family
npm run generate -- CDS-A0 abc123   # cetak satu soal + kunci + pembahasan
```

Tampilan mengikuti desain "C + A" dari kanvas [Desain TKU Studio](https://claude.ai/artifact/EBoaLFiR6rhc52gZbg2MDW):
- **Ringkasan (`/`)**: berisi
  - target 1.440 soal dan jumlah soal yang sudah punya generator;
  - kebutuhan per subtes dan kapasitas per chapter;
  - slot paket dan daftar hal yang perlu diputuskan.

  Semua angka dihitung dari Mapping, daftar family, dan [`lib/data/kapasitas.json`](lib/data/kapasitas.json). Berkas itu ditulis otomatis oleh `npm run verify` dan digabung per family; hasil untuk versi family yang lama diabaikan.
- **Studio (`/studio?f=…&s=…`)**: sidebar per chapter yang bisa dicari, soal interaktif, serta panel kunci, pembahasan, dan kapasitas di sampingnya.

## Konsep: family + seed

- **Family** = satu mekanisme soal dari blueprint (mis. `CDS-A0` Calendar irisan ketersediaan, `RA-SAMA-BEDA` Room Allocations). Setiap family berlabel **SHL** (mekanisme teramati di latihan SHL) atau **VARIASI** (pengembangan dekat sumber).
- **Seed** = string bebas. `family + versi + seed` selalu menghasilkan soal yang sama persis; `uid` soal (`CDS-A0@v1:abc123`) cukup untuk membangkitkannya ulang. Di Studio, seed tersimpan di URL (`/studio?f=CDS-A0&s=abc123`).
- Setiap kandidat soal melewati alur blueprint: **bangun solusi → turunkan petunjuk → pecahkan ulang dengan solver enumerasi penuh hanya dari isi soal → terbitkan bila jawabannya tepat satu**. Kandidat yang gagal ditolak lalu dicoba lagi dengan pengacak turunan `#k` (tetap deterministik).
- **Sidik struktur** menyamakan soal yang hanya berbeda nama/konteks. Seed tidak terbatas, tetapi struktur tidak: contohnya `RA-SAMA-BEDA` hanya punya 25 struktur berbeda. Pakai sidik untuk mencegah soal kembar dalam satu paket/antarpaket.
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

## Status

Angka dalam kurung = sidik struktur unik per 300 seed untuk Deduktif dan per 1.000 seed untuk Induktif (`npm run verify -- 1000 FS-`). Angka kecil yang sama pada 300 dan 1.000 seed berarti family itu sudah jenuh: itulah seluruh struktur yang mungkin.

| Chapter | Family |
|---|---|
| Calendar Date Selection | CDS-A0 irisan ketersediaan (SHL, 300), A1/A2/A3 (VARIASI); CDS-B0 giliran berurutan (SHL, 286), B1/B2/B3 (VARIASI); CDS-C0 sesi beberapa hari (SHL, 284), C1/C2/C3 (VARIASI) |
| Room Allocations | RA-SAMA-BEDA v2 (SHL, 25), RA-KANTOR divisi + denah (SHL, 177), RA-DURASI durasi rapat (SHL, 27) |
| Timeline Scheduling | TL-RAPAT (SHL, 300), TL-RUANG (SHL, 300), TL-PETUGAS (SHL, 65); TL-RAPAT-PANJANG, TL-RAPAT-AKHIR, TL-PETUGAS-BEBAS, TL-PETUGAS-AMBANG (VARIASI) |
| Timeslot Scheduling | TS-P1 urutan + target sedini (SHL, 221), TS-P2 tenggat + terakhir (SHL, 269), TS-P3 sumber daya (SHL, 229); TS-D1…D5 pengembangan (VARIASI) |
| Badges (Logical Ranking) | belum dibuat — belum ada blueprint |
| Fill Shape - Six-pointed Star | FS-HEX-JALUR beberapa unsur dengan lintasan berbeda (SHL, 823), FS-HEX-TUKAR tukar lapisan + cermin (SHL, 830); FS-HEX-KECEPATAN, FS-HEX-PUTAR-TUKAR (VARIASI) |
| Fill Shape - Square | FS-SQ-LINTAS jalur luar–dalam (SHL, 56), FS-SQ-LANGKAH langkah bertambah (SHL, 16), FS-SQ-TUKAR tukar lapisan + cermin (SHL, 992); FS-SQ-PUTAR-TUKAR, FS-SQ-BERGANTIAN, FS-SQ-KECEPATAN (VARIASI) |
| Fill Shape - Inverted Pentagram | FS-PENTA-KOSONG bidang kosong + warna pusat (SHL, 110), FS-PENTA-LAPIS ritme dua lapisan (SHL, 8); FS-PENTA-PUSAT, FS-PENTA-TIGA (VARIASI) |
| Fill Shape - Triangle | FS-TRI-KOSONG pergiliran bidang kosong (SHL, 168); FS-TRI-SIKLUS, FS-TRI-PANTUL (VARIASI) |
| Drag the Line - 2 Character | DL-SELANG huruf–angka berselang-seling (SHL, 879); DL-BERTINGKAT, DL-SISIP, DL-OPERASI (VARIASI) |
| Drag the Line - 3 Character | DL-SIMBOL O/X bergiliran (SHL, 48), DL-RANTAI satu karakter sama (SHL, 1000), DL-GESER selisih menggeser alfabet (SHL, 1000); DL-AKHIR-AWAL, DL-BINER (VARIASI) |
| Drag the Line - 4 Character | DL-LUBANG ruang tertutup huruf (SHL, 1000); DL-SIKLIS hipotesis hlm. 17, DL-ROTASI (VARIASI) |
| Drag the Line - Special Character | DL-HITUNG rantai × ÷ (SHL, 825), DL-ARAH simbol arah (SHL, 241); DL-ARAH-LEBAR, DL-HITUNG-CAMPUR (VARIASI) |
| Bahasa Inggris | belum dibuat — lihat `bahan/00 - Ringkasan Bahan.md` §3 |

Catatan tafsir yang dikunci di kode dan ditulis eksplisit di soal: CDS-C memakai jadwal mulai tanggal 1, setiap sesi dimulai pada hari kerja paling awal yang memungkinkan, tanggal larangan tetap hari kerja (ikut terhitung dalam jeda) — kunci sumber hlm. 21–22 tidak diterbitkan ulang; TL-RUANG memakai pembongkaran 30/60 menit (sumber 45 menit tidak muat di grid 30 menit); TL-PETUGAS menjadwalkan tim jawaban hanya saat kurang dengan total minimum; "semua kegiatan sedini mungkin" (TS-P3) = susunan yang tidak dapat dipercepat tanpa memperlambat kegiatan lain (Pareto); "Ruang Pertemuan hanya jika tidak ada ruang biasa yang memenuhi" (RA-KANTOR) dinilai setelah semua ketentuan lain, per orang, tanpa bergantung urutan seret.

Catatan Induktif:
- Model "tiga fase + penanda" hlm. 3 tidak dibangun; blueprint menyatakannya belum terverifikasi.
- FS-HEX-TUKAR memakai mekanisme hlm. 7 pada bintang enam. Blueprint mengizinkan label SHL bila wadahnya punya hubungan bidang yang setara.
- FS-SQ-LANGKAH hanya punya 16 struktur. Hanya langkah ±2, ±4, ±6 sektor (sama dengan sumber) yang lolos; langkah lain juga cocok dengan "cermin lalu geser bergantian", sehingga ditolak sebagai jawaban ganda.
- FS-PENTA-LAPIS hanya punya 8 struktur. Potongan stimulus harus dimulai di akhir satu warna pusat, dan tidak boleh ada gambar yang seluruhnya putih.
- Dalam pustaka aturan, operasi berselang-seling hanya boleh berupa operasi bidang, tidak boleh berupa pergantian warna.
- DL-SIKLIS diberi label VARIASI. Pembahasannya menyatakan bahwa jawaban berlaku menurut aturan yang diasumsikan.
- Huruf I/O ditolak pada kode campuran huruf dan angka karena mudah tertukar dengan 1/0.

Foto orang masih berupa inisial; PNG ada di folder Asset Generator (Google Drive). Ekspor ke SIADU belum dibuat karena format input tipe interaktif belum diketahui.
