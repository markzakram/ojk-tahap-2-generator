import type { BarisRelasi, Pengecoh } from '../umum';
import type { Tingkat } from '../../core/pilihan-ganda';

// Alat bantu bersama kelompok "Investasi dan Proteksi": nama sumber (Drive "OJK - Tahap 2/Pengetahuan Sektor Jasa
// Keuangan", subfolder "Investasi dan Proteksi", dan "Materi by OJK Official"), pembuat pengecoh, dan pembuat baris relasi.

const EBOOK = (judul: string) => `E-book tim PCAM/MLE OJK 2026 "Investasi dan Proteksi – ${judul}"`;

export const SUMBER = {
  ebAsuransi: EBOOK('Asuransi'),
  ebDapen: EBOOK('Dana Pensiun'),
  ebPasarModal: EBOOK('Pasar Modal'),
  ebBulion: EBOOK('Bulion'),
  ebKripto: EBOOK('Aset Kripto'),
  ebSyariah: EBOOK('Keuangan Syariah'),
  buku4: 'OJK, Seri Literasi Keuangan Perguruan Tinggi Buku 4 – Perasuransian, Bab 3 (Teori Risiko dan Asuransi)',
  buku4Bab1: 'OJK, Seri Literasi Keuangan Perguruan Tinggi Buku 4 – Perasuransian, Bab 1 (Pendahuluan)',
  buku6: 'OJK, Seri Literasi Keuangan Perguruan Tinggi Buku 6 – Program Pensiun (2019)',
  buku8: 'OJK, Seri Literasi Keuangan Perguruan Tinggi Buku 8 – Industri Jasa Keuangan Syariah',
  bspm: 'OJK, Buku Saku Pasar Modal 2023',
} as const;

export const P = (teks: string, alasan: string): Pengecoh => ({ teks, alasan });

/** Pembuat baris relasi dengan sumber yang sama. */
export const pembuatBaris = (sumber: string, berlakuPer?: string) =>
  (id: string, subjek: string, nilai: string, tingkat: Tingkat = 'dasar', khusus?: { sumber?: string; berlakuPer?: string }): BarisRelasi => ({
    id, subjek, nilai, tingkat, sumber: khusus?.sumber ?? sumber, berlakuPer: khusus?.berlakuPer ?? berlakuPer,
  });

/** Huruf pertama kapital (untuk kalimat pembahasan yang diawali istilah berhuruf kecil). */
export const kapital = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** Alasan pengecoh relasi yang umum: opsi lain adalah ciri/fungsi baris lain. */
export const alasanRelasi = (b: BarisRelasi, s: BarisRelasi, arah: 'nilai' | 'subjek') =>
  arah === 'nilai'
    ? `Uraian itu adalah ciri ${s.subjek}, bukan ${b.subjek}.`
    : `${kapital(s.subjek)} berarti ${s.nilai}; uraian pada soal menunjuk ${b.subjek}.`;

/** Kalimat pembahasan baris yang benar: "Istilah: uraian." dengan huruf awal kapital. */
export const kalimatRelasi = (b: BarisRelasi) => `${kapital(b.subjek)}: ${b.nilai}.`;
