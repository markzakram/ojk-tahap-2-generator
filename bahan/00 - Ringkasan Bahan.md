# Ringkasan Bahan — Generator OJK Tahap 2 (TKU, PCAM 10 OJK 2026)

Disusun 9 November 2026 dari bahan Google Drive (shared drive JadiOJK). File lain di folder ini adalah salinan teks sumber.

## 1. Sumber

| Bahan | Lokasi | Salinan lokal |
|---|---|---|
| Folder Blueprint (JadiOJK) | drive.google.com/drive/folders/1Sf8AH4vcMnlDQiuiR9btRFG6mPYEa10s | — |
| Blueprint Penalaran Induktif (Fill Shape, Drag the Line) | Docs `1KvJXzIXvmPPdkKrXsRB0gjLiwlqlkvagLtIG7cDSB7E` | [Blueprint Penalaran Induktif.md](Blueprint%20Penalaran%20Induktif.md) |
| Blueprint Penalaran Deduktif | Docs `1cyjSgqmwe_kaAeOCiMibLQ9FQGmgz7ETeTKFN0i-TAw` | `Blueprint Penalaran Deduktif.md` |
| Blueprint Bahasa Inggris | Docs `15Kp-3yV0wtRUu8tqLOBLcD1aGu-LDqOA7GMRZ_yGbhg` | `Blueprint Bahasa Inggris.md` |
| Riset PCAM dan MLE OJK 2026 | Docs `1AfikMn29se77gMzCgMM9n7wf7TnhVbE3Bzcw3DAnUl4` | belum disalin |
| Rancangan Fitur TKU (Tahap 2) | Docs `10dlHfSw8pDwCI7mUqJP1WE5JFH1V9f4Ut_48MINroYk` (folder OJK_SHL) | `Rancangan Fitur TKU.md` |
| Mapping Tahap 2 PCAM OJK 2026 | Sheets `1gbLje0bYQAQT6lN0QjSSd05OaPMGMdIRm6vRzo0zR-s` | `Mapping Tahap 2 - PCAM 10 OJK.csv` |
| Sumber SHL (PDF/video) | folder OJK_SHL → SHL_Inductive/Deductive Reasoning Test (Interactive) | — |
| Asset Generator (foto Calendar, Room) | folder JadiOJK → Asset Generator | — |
| Materi tim per chapter | folder "OJK - Tahap 2" (Induktif/Deduktif/Numerik/Bahasa Inggris) | — |

## 2. Struktur tes TKU dan kebutuhan soal (Mapping)

Target: **10 Tryout + 5 Latsol = 1.440 soal** (890 tryout + 550 latsol). Ketersediaan di SIADU saat ini **0** untuk semua chapter.
Nilai subtes = (benar/total) × 100; nilai tes = rata-rata 4 subtes.

| Subtes | Chapter (Bentuk Soal di SIADU) | Soal/TO | Durasi TO | Navigasi/urutan |
|---|---|---|---|---|
| Penalaran Induktif | Fill Shape: Six-pointed Star 2, Square 2, Inverted Pentagram 2, Triangle 1 (Fill Shape) · Drag the Line: 2 Character 1, 3 Character 3, 4 Character 2, Special Character 2 (Node Arrow Navigation) | 15 | 18' | Disable; random penuh |
| Penalaran Deduktif | Calendar Date Selection 3 · Room Allocations 2 (Place and Room Allocations) · Timeline Scheduling 2 · Badges 3 (Logical Ranking) · Timeslot Scheduling 2 | 12 | 18' | (kosong di mapping) |
| Bahasa Inggris | Sentence Completion 4 · Sentence Improvement 2 · Grammatically Correct Sentence 1 · Sentence Arrangement 1 · Reading Comprehension 4 (Option New) | 12 | 15' | Disable; urutan chapter tetap, soal random, kecuali Reading |
| Pengetahuan Sektor Jasa Keuangan | 16 topik (OJK & Waspada Investasi 8, Perbankan 7, Pasar Modal 6, Asuransi 4, Keuangan Syariah 4, dst.) (Option New) | 50 | 60' | Disable; random penuh |

Catatan: beberapa baris CSV blok Sektor Jasa Keuangan bergeser kolom; cek ulang di sheet asli sebelum dipakai sebagai kuota.

## 3. Cakupan blueprint

| Subtes | Status blueprint | Komposisi |
|---|---|---|
| Induktif — Fill Shape | Lengkap: 4 kategori (perpindahan posisi, isi/bidang kosong, siklus berlapis, gabungan/transformasi), transkripsi per bidang, prediksi G5 | 70% SHL / 30% variasi |
| Induktif — Drag the Line | Lengkap: 7 mekanisme SHL (hlm. 9, 11, 13, 15, 19, 25, 26) + hlm. 17 hipotesis + 6 variasi A–F | 70/30 |
| Deduktif — Calendar Date Selection | Lengkap: profil A (irisan ketersediaan), B (giliran berurutan), C (sesi beberapa hari) + variasi; maks. 5 tanggal | belum ditetapkan |
| Deduktif — Room Allocations | Lengkap: sama/berbeda ruangan, kantor divisi+denah, durasi rapat; 5 orang, maks. 3/ruang | belum ditetapkan |
| Deduktif — Timeline Scheduling | Lengkap: pemajuan rapat, pelatihan+ruangan, pemenuhan petugas; grid 18 kotak × 30' | belum ditetapkan |
| Deduktif — Timeslot Scheduling | Lengkap: P1–P3 terverifikasi + 5 pengembangan | 60/40 |
| Deduktif — **Badges (Logical Ranking)** | **Tidak ada di blueprint.** Kandidat acuan: doc "Badges" di folder OJK - Tahap 2/Penalaran Numerik | — |
| Bahasa Inggris — 4 tipe non-reading | Lengkap: format, CEFR B2/C1, rujukan Azar & Oxford, format pembahasan | 40/25/20/15 (editorial) |
| Bahasa Inggris — **Reading Comprehension** | **Sengaja tidak dicakup** | — |
| **Pengetahuan Sektor Jasa Keuangan** | **Tidak ada blueprint** | — |

Prinsip bersama semua blueprint: label sumber SHL vs variasi; bangun solusi → turunkan petunjuk → pecahkan ulang dengan solver enumerasi penuh hanya dari info yang terlihat peserta → terbitkan bila jawaban tepat satu; tidak ada kendala tersembunyi; setiap perubahan memaksa pemecahan ulang. Tidak ada blueprint yang menetapkan skema data, skor parsial, atau level kesulitan (kecuali Bahasa Inggris: Dasar/Menengah/Menantang).

## 4. UI interaktif (Rancangan Fitur TKU)

Dokumen berupa gap analysis JadiOJK vs SHL, bukan spesifikasi data:
- Fill Shape: warna Putih, Hijau `#4a8508`, Ungu polkadot `#827bde`.
- Node Arrow Navigation: posisi node dengan koordinat (x,y), jari-jari node 0,5.
- Calendar: batas pilihan selalu 5 walau kunci < 5.
- Room: maks. 3 variabel/ruang, semua ruang bernama (SHL).
- Timeline: hover keterangan kegiatan, sel abu-abu.
- Badges: lingkaran badge terlihat saat drag.
- Timeslot: hover, pratinjau jumlah kotak saat drag, blok bisa dipindah.
Belum ada: struktur data, skoring, dan **format input SIADU untuk tipe interaktif**.

## 5. Preseden: SKD-Generator (JadiASN SKD Studio v2.2)

`..\SKD-Generator` — Next.js 16, generator lokal deterministik tanpa API, validator independen per soal, workspace review/QC di IndexedDB, ekspor PDF/Word/CSV/JSON dan Word SIADU (`lib/siadu.ts`, mengikuti "kontrak importir OJK Tahap 1"), userscript importer SIADU (hanya `option`/`option_new` teks — belum mendukung tipe interaktif). Modul yang layak diadaptasi: `rng`, `binding`, pola `Proof`+audit, `mapping`/`blueprint`/`bagi`, `posisi-model` (solver urutan/jadwal), `figural/render` (SVG), `export`, `siadu`, komponen Workbench/ReviewQueue/QuestionCard. Validator di sana mewajibkan 5 opsi, sehingga butuh tipe item interaktif baru.

## 6. Pertanyaan terbuka

1. Format input SIADU untuk 7 tipe interaktif (Fill Shape, Node Arrow Navigation, Calendar Date Selection, Place and Room Allocations, Timeline Scheduling, Logical Ranking, Timeslot Scheduling).
2. Blueprint Badges (Deduktif), Reading Comprehension, dan Pengetahuan Sektor Jasa Keuangan.
3. Komposisi SHL/variasi untuk Calendar, Room, Timeline; level kesulitan; skor parsial.
4. Hak pakai foto (cuplikan SHL untuk Calendar; randomuser.me untuk Room).
