import type { Family } from '../../core/types';
import { familyKurasi } from '../umum';
import { familyRelasiKalimat } from './relasi';
import { BUTIR_OJK_KASUS } from './ojk-kasus';
import { BUTIR_OJK_KONSUMEN } from './ojk-konsumen';
import { BUTIR_OJK_LEMBAGA } from './ojk-lembaga';
import { TABEL_OJK_KONSUMEN, TABEL_OJK_LEMBAGA } from './ojk-relasi';
import { pkHitung } from './pk-hitung';
import { BUTIR_PK_KASUS } from './pk-kasus';
import { BUTIR_PK_KONSEP } from './pk-konsep';
import { TABEL_PK } from './pk-relasi';
import { BSC, BS_OJK, EB_OJK, EB_PK, MAJ, MPSJKI, SLK1, SLK9 } from './sumber';

// Kelompok "OJK dan Dasar Keuangan": Pengenalan OJK dan Waspada Investasi (kebutuhan 115), Perencanaan Keuangan
// (kebutuhan 45). Setiap chapter punya family SHL (fakta langsung seperti contoh soal bahan) dan VARIASI (kasus,
// pernyataan majemuk, relasi dua arah, hitungan). Bank dipecah per topik agar setiap family ≤ ~60 struktur.

const OJK = 'pengenalan-ojk';
const PK = 'perencanaan-keuangan';

export const psjkOjkLembaga = familyKurasi({
  id: 'PSJK-OJK-LEMBAGA', versi: 2, nama: 'Kelembagaan OJK', chapter: OJK, label: 'SHL',
  sumber: `${EB_OJK}, subbab 3.1.1–3.1.6 dan contoh soal 4.1–4.7; ${BS_OJK}, Bab 1; ${SLK1}, Bab 1–4; ${BSC}, Bab I`,
  ringkas: 'Fakta langsung kelembagaan: dasar hukum (UU 21/2011, UU P2SK, UU 4/2026), sejarah pengawasan, tujuan, fungsi, tugas, wewenang, visi-misi, independensi, struktur Dewan Komisioner, acuan standar internasional.',
}, BUTIR_OJK_LEMBAGA);

export const psjkOjkKonsumen = familyKurasi({
  id: 'PSJK-OJK-KONSUMEN', versi: 2, nama: 'Pelindungan konsumen dan waspada investasi', chapter: OJK, label: 'SHL',
  sumber: `${EB_OJK}, subbab 3.1.9–3.1.17 dan contoh soal 4.9–4.16; ${SLK1}, Bab 5–6; ${BS_OJK}, Bab 1 D–E; ${MPSJKI}; ${MAJ}`,
  ringkas: 'Fakta langsung: POJK 22/2023, Satgas PASTI, prinsip 2L dan tanda bahaya, kanal pengaduan (157, WhatsApp, situs resmi), market conduct, hubungan OJK–BI–LPS, KSSK, survei literasi-inklusi 2013/2019, MPSJKI 2021–2025, peralihan aset kripto.',
}, BUTIR_OJK_KONSUMEN);

export const psjkOjkKasus = familyKurasi({
  id: 'PSJK-OJK-KASUS', versi: 2, nama: 'Kasus dan pernyataan majemuk OJK', chapter: OJK, label: 'VARIASI',
  sumber: `${EB_OJK}, subbab 3.1.2–3.1.17; ${SLK1}; ${BSC}, Bab I; ${MPSJKI}`,
  ringkas: 'Kasus penerapan (kewenangan, benturan kepentingan, alur pengaduan, tawaran investasi mencurigakan, OTP dan tautan tiruan, pinjaman online, OJK–BI–LPS, konglomerasi, aset kripto) dan pernyataan majemuk (1)–(4).',
}, BUTIR_OJK_KASUS);

export const psjkOjkRelasiLembaga = familyRelasiKalimat({
  id: 'PSJK-OJK-RELASI-LEMBAGA', versi: 2, nama: 'Relasi kelembagaan OJK', chapter: OJK, label: 'VARIASI',
  sumber: `${BS_OJK}, Bab 1; ${EB_OJK}, subbab 3.1.4–3.1.16; ${SLK1}`,
  ringkas: 'Relasi dua arah: nilai strategis ↔ makna, asas ↔ rumusan, Kepala Eksekutif ↔ objek pengawasan, lembaga ↔ mandat, peristiwa ↔ waktu.',
}, TABEL_OJK_LEMBAGA);

export const psjkOjkRelasiKonsumen = familyRelasiKalimat({
  id: 'PSJK-OJK-RELASI-KONSUMEN', versi: 2, nama: 'Relasi pelindungan konsumen dan pengawasan', chapter: OJK, label: 'VARIASI',
  sumber: `${EB_OJK}, subbab 3.1.10; ${SLK1}, Bab 1, 3, 5, 6; ${BSC}`,
  ringkas: 'Relasi dua arah: prinsip POJK 22/2023 ↔ contoh penerapan, layanan konsumen ↔ fungsi, istilah pengawasan ↔ pengertian, tahap product life cycle ↔ cakupan.',
}, TABEL_OJK_KONSUMEN);

export const psjkPkKonsep = familyKurasi({
  id: 'PSJK-PK-KONSEP', versi: 2, nama: 'Konsep perencanaan keuangan', chapter: PK, label: 'SHL',
  sumber: `${EB_PK}, subbab 3.1.1–3.1.11 dan contoh soal 4.2; ${SLK9}, Bab 1–4; ${BSC}, Bab II dan IV`,
  ringkas: 'Fakta langsung: definisi FPSB dan cakupannya, tahapan perencanaan, kebutuhan-keinginan, sisihkan vs sisakan, neraca dan jenis aset, dana darurat, utang baik, inflasi dan nilai waktu uang, profil risiko dan contoh instrumen, proteksi, sertifikasi perencana keuangan.',
}, BUTIR_PK_KONSEP);

export const psjkPkKasus = familyKurasi({
  id: 'PSJK-PK-KASUS', versi: 2, nama: 'Kasus perencanaan keuangan', chapter: PK, label: 'VARIASI',
  sumber: `${EB_PK}, subbab 3.1.2–3.1.12 dan contoh soal 4.1, 4.7–4.12; ${SLK9}, Bab 2; ${BSC}, Bab I–II`,
  ringkas: 'Kasus prioritas, horizon dan likuiditas, evaluasi menyeluruh, pencatatan arus kas, biaya tidak rutin, proteksi, utang baik/buruk, rasio cicilan vs sisa anggaran, serta pernyataan majemuk (1)–(4).',
}, BUTIR_PK_KASUS);

export const psjkPkRelasi = familyRelasiKalimat({
  id: 'PSJK-PK-RELASI', versi: 2, nama: 'Relasi rasio kesehatan keuangan', chapter: PK, label: 'VARIASI',
  sumber: `${SLK9}, Bab 2 (SMART, Tabel 5 Rasio Kesehatan Keuangan); ${BSC}, Bab II`,
  ringkas: 'Relasi dua arah: rasio kesehatan keuangan ↔ yang diukur, rasio ↔ standar sehat. Unsur SMART dikeluarkan (QC F01: tidak diuraikan materi folder).',
}, TABEL_PK);

export const PSJK_OJK_DASAR: Family<any, any>[] = [
  psjkOjkLembaga, psjkOjkKonsumen, psjkOjkKasus, psjkOjkRelasiLembaga, psjkOjkRelasiKonsumen,
  psjkPkKonsep, psjkPkKasus, psjkPkRelasi, pkHitung,
];
