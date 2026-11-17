import type { Pembahasan } from './types';

// Model bersama soal pilihan ganda teks (bentuk SIADU "Option New"): Bahasa Inggris, Reading Comprehension, dan
// Pengetahuan Sektor Jasa Keuangan. Blueprint Bahasa Inggris bagian 2: Sentence Completion 4 opsi (A–D); Sentence Improvement 5 opsi (E = "No improvement
// needed"); Grammatically Correct Sentence 5 opsi; Sentence Arrangement 5 fragmen (A–E) dan 4 opsi urutan (A–D).

/** Tingkat kesulitan blueprint bagian 9 (usulan editorial, bukan ketentuan OJK). */
export type Tingkat = 'dasar' | 'menengah' | 'menantang';

/** Potongan teks stimulus: biasa, bagian kosong (Completion), atau rentang bercetak miring (Improvement). */
export interface Potongan {
  teks: string;
  gaya?: 'kosong' | 'miring';
}

export interface Opsi {
  label: string;
  teks: string;
}

/**
 * Isi soal pilihan ganda yang dilihat peserta, ditambah `data`: anotasi terstruktur (kelas kata, fitur grammar, kategori
 * fragmen, matriks keterterimaan) yang dipakai solver family untuk memeriksa SETIAP opsi secara mandiri dari pembangunnya.
 */
export interface PilihanGandaItem<D = unknown> {
  jenis: 'pilihan-ganda';
  /** Instruksi soal (bahasa Inggris, boleh dicetak miring). */
  instruksi: string;
  /** Bacaan (Reading Comprehension): judul opsional dan paragraf, ditampilkan sebelum pertanyaan. */
  bacaan?: { judul?: string; paragraf: string[] };
  /** Pertanyaan yang berdiri sendiri (Reading, PSJK); Bahasa Inggris non-reading memakai `stimulus`. */
  pertanyaan?: string;
  /** Kalimat soal; kosong untuk Grammatically Correct Sentence (kalimat ada di opsi). */
  stimulus: Potongan[];
  /** Sentence Arrangement: fragmen berlabel A–E (berbeda dari label opsi A–D). */
  fragmen?: Opsi[];
  opsi: Opsi[];
  tingkat: Tingkat;
  /** Kaidah atau pola yang diuji, mis. "gerund-setelah-preposisi"; dipakai untuk sidik dan rotasi paket. */
  kaidah: string;
  /** Konteks tema (kebijakan, laporan, proyek, layanan, ...), untuk rotasi konteks dalam paket. */
  konteks: string;
  data: D;
}

/** Jawaban soal pilihan ganda = label opsi kunci ("A" … "E"). */
export type JawabanPg = string;

export const HURUF = ['A', 'B', 'C', 'D', 'E'] as const;

export const NAMA_TINGKAT: Record<Tingkat, string> = { dasar: 'Dasar', menengah: 'Menengah', menantang: 'Menantang' };

/** Teks kalimat lengkap dari stimulus, dengan bagian kosong/miring diganti `isi` bila diberikan. */
export function kalimat(stimulus: Potongan[], isi?: string): string {
  return stimulus.map((p) => (p.gaya && isi !== undefined ? isi : p.teks)).join('').replace(/\s+/g, ' ').trim();
}

/**
 * Susun opsi dari kunci dan pengecoh, diacak dengan pengacak soal. Mengembalikan opsi berlabel dan label kunci.
 * Urutan pengecoh asli disimpan oleh pemanggil bila dibutuhkan untuk pembahasan.
 */
export function susunOpsi<T>(acak: <U>(xs: readonly U[]) => U[], kunci: T, pengecoh: T[], teks: (x: T) => string): { opsi: Opsi[]; urut: T[]; kunci: JawabanPg } {
  const urut = acak([kunci, ...pengecoh]);
  return { opsi: urut.map((x, i) => ({ label: HURUF[i], teks: teks(x) })), urut, kunci: HURUF[urut.indexOf(kunci)] };
}

const VOKAL = /^[aeiou]/i;
// kata yang ejaannya diawali vokal tetapi bunyinya konsonan, dan sebaliknya (cukup untuk kosakata bank awal)
const BUNYI_KONSONAN = /^(uni|use|usu|euro|one|once)/i;
const BUNYI_VOKAL = /^(hour|honest|honou?r|heir)/i;

/** Apakah kata diawali bunyi vokal (untuk mendeteksi petunjuk a/an yang tidak disengaja). */
export function bunyiVokal(kata: string): boolean {
  if (BUNYI_VOKAL.test(kata)) return true;
  if (BUNYI_KONSONAN.test(kata)) return false;
  return VOKAL.test(kata);
}

/**
 * Pemeriksaan format yang berlaku untuk semua soal pilihan ganda (blueprint bagian 10): label berurutan, tidak ada opsi
 * kosong atau kembar, dan bagian kosong yang didahului "a"/"an" tidak membocorkan kunci lewat bunyi awal opsi.
 */
export function periksaFormatPg(item: PilihanGandaItem): string[] {
  const m: string[] = [];
  item.opsi.forEach((o, i) => { if (o.label !== HURUF[i]) m.push('label opsi tidak berurutan'); if (!o.teks.trim()) m.push('opsi kosong'); });
  const teks = item.opsi.map((o) => o.teks.trim().toLowerCase());
  if (new Set(teks).size !== teks.length) m.push('opsi kembar');
  const iKosong = item.stimulus.findIndex((p) => p.gaya === 'kosong');
  if (iKosong > 0) {
    const sebelum = item.stimulus[iKosong - 1].teks.trimEnd().split(/\s+/).pop()?.toLowerCase();
    if (sebelum === 'a' || sebelum === 'an') {
      const vokal = item.opsi.map((o) => bunyiVokal(o.teks.trim()));
      if (vokal.some((v) => v !== vokal[0])) m.push('artikel a/an sebelum bagian kosong membocorkan kunci');
    }
  }
  if (item.fragmen) {
    item.fragmen.forEach((f, i) => { if (f.label !== HURUF[i]) m.push('label fragmen tidak berurutan'); });
  }
  return m;
}

/** Pembahasan berformat blueprint bagian 10: Jawaban, Konsep, Kata Kunci, alasan, alasan opsi salah, Cara Cepat. */
export function bahasPg(p: {
  item: PilihanGandaItem;
  kunci: JawabanPg;
  konsep: string;
  kataKunci: string;
  alasan: string[];
  /** Alasan untuk setiap label opsi selain kunci. */
  opsiSalah: Record<string, string>;
  caraCepat: string;
}): Pembahasan | null {
  const k = p.item.opsi.find((o) => o.label === p.kunci);
  if (!k || !p.alasan.length) return null;
  const salah = p.item.opsi.filter((o) => o.label !== p.kunci);
  if (salah.some((o) => !p.opsiSalah[o.label])) return null;
  return {
    jawaban: `${k.label}. ${k.teks}`,
    konsep: p.konsep,
    kataKunci: p.kataKunci,
    langkah: p.alasan.map((teks) => ({ teks })),
    opsiSalah: salah.map((o) => `${o.label}. ${p.opsiSalah[o.label]}`),
    caraCepat: p.caraCepat,
  };
}
