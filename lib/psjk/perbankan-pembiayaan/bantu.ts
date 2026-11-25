import type { Tingkat } from '../../core/pilihan-ganda';
import type { BarisRelasi, ButirKurasi } from '../umum';

// Helper kecil kelompok "Perbankan dan Pembiayaan": nama sumber Drive yang dipakai, penulis butir kurasi yang ringkas,
// baris tabel relasi, dan alasan pengecoh tabel relasi.

/** Nama dokumen sumber (folder Drive PSJK "Perbankan dan Pembiayaan" dan "Materi by OJK Official"). */
export const SUMBER = {
  ebBank: 'E-book PSJK "Perbankan dan Pembiayaan – Perbankan" (materi tim, Nov 2026)',
  ebPp: 'E-book PSJK "Perbankan dan Pembiayaan – Perusahaan Pembiayaan" (materi tim, Nov 2026)',
  ebGadai: 'E-book PSJK "Perbankan dan Pembiayaan – Pergadaian" (materi tim, Nov 2026)',
  ebLkm: 'E-book PSJK "Perbankan dan Pembiayaan – Lembaga Keuangan Mikro" (materi tim, Nov 2026)',
  ebJamin: 'E-book PSJK "Perbankan dan Pembiayaan – Lembaga Penjaminan" (materi tim, Nov 2026)',
  ebMv: 'E-book PSJK "Perbankan dan Pembiayaan – Perusahaan Modal Ventura" (materi tim, Nov 2026)',
  ebDfl: 'E-book PSJK "Perbankan dan Pembiayaan – Digital Financial Literacy" (materi tim, Nov 2026)',
  ebFintech: 'E-book PSJK "Perbankan dan Pembiayaan – Fintech" (materi tim, Nov 2026)',
  ebPm: 'E-book tim PCAM/MLE OJK 2026 "Investasi dan Proteksi – Pasar Modal"',
  bpi: 'Booklet Perbankan Indonesia 2024 (OJK)',
  bsc: 'Buku Saku Cerdas Mengelola Keuangan (OJK, 2021)',
  buku2: 'Seri Literasi Keuangan Perguruan Tinggi, Buku 2 – Perbankan (OJK, 2019)',
  buku5: 'Seri Literasi Keuangan Perguruan Tinggi, Buku 5 – Lembaga Pembiayaan (OJK, 2019)',
  buku7: 'Seri Literasi Keuangan Perguruan Tinggi, Buku 7 – Lembaga Jasa Keuangan Lainnya (OJK)',
} as const;

export interface IsiButir {
  tanya: string;
  jawab: string;
  /** Pengecoh beralasan: [teks, alasan]. Sedikitnya empat. */
  salah: [string, string][];
  konsep: string;
  kunci: string;
  alasan: string | string[];
  cepat: string;
  sumber: string;
  berlaku?: string;
  jugaBenar?: string[];
}

/** Butir kurasi dalam bentuk ringkas. */
export function butir(id: string, tingkat: Tingkat, topik: string, x: IsiButir): ButirKurasi {
  return {
    id, tingkat, topik,
    pertanyaan: x.tanya,
    jawaban: x.jawab,
    ...(x.jugaBenar ? { jugaBenar: x.jugaBenar } : {}),
    pengecoh: x.salah.map(([teks, alasan]) => ({ teks, alasan })),
    konsep: x.konsep,
    kataKunci: x.kunci,
    alasan: Array.isArray(x.alasan) ? x.alasan : [x.alasan],
    caraCepat: x.cepat,
    sumber: x.sumber,
    ...(x.berlaku ? { berlakuPer: x.berlaku } : {}),
  };
}

/** Baris tabel relasi. */
export function baris(id: string, subjek: string, nilai: string, tingkat: Tingkat, sumber: string, berlakuPer?: string): BarisRelasi {
  return { id, subjek, nilai, tingkat, sumber, ...(berlakuPer ? { berlakuPer } : {}) };
}

/** Huruf pertama kapital (untuk awal kalimat). */
export const kapital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Alasan pengecoh tabel relasi. `kata` = penghubung subjek–nilai (mis. "adalah", "mengukur", "disebabkan oleh");
 * `awalan` = kata sebelum subjek bila perlu (mis. "akad").
 * Arah "nilai": opsi salah adalah uraian milik subjek lain. Arah "subjek": opsi salah adalah istilah lain beserta artinya.
 */
export const alasanRelasi = (kata: string, awalan = '') => (benar: BarisRelasi, salah: BarisRelasi, arah: 'nilai' | 'subjek') => {
  const sebut = (x: BarisRelasi) => (awalan ? `${awalan} ${x.subjek}` : x.subjek);
  return arah === 'nilai'
    ? `Uraian itu menggambarkan ${sebut(salah)}, bukan ${sebut(benar)}.`
    : `${kapital(sebut(salah))} ${kata} ${salah.nilai}.`;
};

/** Kalimat pembahasan baris yang benar (opsi `kalimat` TabelRelasi): "Subjek <kata> nilai." */
export const kalimatRelasi = (kata: string, awalan = '') => (b: BarisRelasi) =>
  `${kapital(awalan ? `${awalan} ${b.subjek}` : b.subjek)} ${kata} ${b.nilai}.`;
