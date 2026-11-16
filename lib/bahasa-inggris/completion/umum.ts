import { kalimat, periksaFormatPg, type PilihanGandaItem, type Potongan, type Tingkat } from '../model';
import { analisis, type Analisis, type Bentuk, type Kelas } from './leksikon';

// Ketentuan bersama Sentence Completion (Blueprint Bahasa Inggris bagian 3): satu kalimat, satu bagian kosong satu kata,
// empat opsi A–D satu kata. Panjang 18–35 kata; 12–17 kata hanya untuk latihan dasar.

export const INSTRUKSI = 'Choose the word that best completes the sentence.';

export const KONTEKS = {
  kebijakan: 'kebijakan & kepatuhan',
  laporan: 'laporan & data',
  kantor: 'kantor & proyek',
  layanan: 'layanan pelanggan',
  pendidikan: 'pendidikan & pelatihan',
  teknologi: 'teknologi',
  lingkungan: 'lingkungan & energi',
  riset: 'riset',
  ekonomi: 'ekonomi umum',
  masyarakat: 'kegiatan masyarakat',
} as const;
export type KodeKonteks = keyof typeof KONTEKS;

/**
 * Tuntutan posisi kosong pada pola makna: kelas kata + infleksi.
 * n = noun tunggal countable atau uncountable (setelah the/its/…); n-sg = countable tunggal; n-u = uncountable; n-pl = plural.
 */
export type Slot = 'adj' | 'adv' | 'n' | 'n-sg' | 'n-u' | 'n-pl' | 'v1' | 'vs' | 'v2' | 'v3' | 'ving';

export function cocokSlot(a: Analisis, slot: Slot): boolean {
  switch (slot) {
    case 'adj': return a.kelas === 'adj';
    case 'adv': return a.kelas === 'adv';
    case 'n': return a.kelas === 'n' && (a.bentuk === 'c' || a.bentuk === 'u');
    case 'n-sg': return a.kelas === 'n' && a.bentuk === 'c';
    case 'n-u': return a.kelas === 'n' && a.bentuk === 'u';
    case 'n-pl': return a.kelas === 'n' && a.bentuk === 'p';
    default: return a.kelas === 'v' && a.bentuk === slot;
  }
}

export const NAMA_SLOT: Record<Slot, string> = {
  adj: 'adjective', adv: 'adverb', n: 'noun', 'n-sg': 'noun tunggal countable', 'n-u': 'noun uncountable', 'n-pl': 'noun plural',
  v1: 'verb bentuk dasar', vs: 'verb present orang ketiga tunggal', v2: 'verb bentuk lampau (V2)', v3: 'past participle (V3)', ving: 'verb bentuk -ing',
};

/** Kalimat dengan penanda `___` menjadi stimulus tiga potongan. */
export function stimulusDari(teks: string): Potongan[] {
  const bagian = teks.split('___');
  if (bagian.length !== 2) throw new Error(`Kerangka harus punya tepat satu ___: ${teks}`);
  return [{ teks: bagian[0] }, { teks: '', gaya: 'kosong' }, { teks: bagian[1] }];
}

/** Token huruf kecil tanpa tanda baca (apostrof dan tanda hubung dipertahankan). */
export function token(s: string): string[] {
  return s.toLowerCase().replace(/[^a-z0-9'\- ]+/g, ' ').split(/\s+/).filter(Boolean);
}

/** Token di kiri dan kanan bagian kosong. */
export function sisi(item: PilihanGandaItem): { kiri: string[]; kanan: string[] } {
  const i = item.stimulus.findIndex((p) => p.gaya === 'kosong');
  return {
    kiri: token(item.stimulus.slice(0, i).map((p) => p.teks).join(' ')),
    kanan: token(item.stimulus.slice(i + 1).map((p) => p.teks).join(' ')),
  };
}

/** Kata kunci posisi: dua token sebelum dan satu token sesudah bagian kosong, mis. "must ____ with". */
export function cuplikan(item: PilihanGandaItem, kiriN = 2, kananN = 1): string {
  const i = item.stimulus.findIndex((p) => p.gaya === 'kosong');
  const kiri = item.stimulus.slice(0, i).map((p) => p.teks).join('').trim().split(/\s+/).filter(Boolean).slice(-kiriN);
  const kanan = item.stimulus.slice(i + 1).map((p) => p.teks).join('').trim().split(/\s+/).filter(Boolean).slice(0, kananN);
  return [...kiri, '____', ...kanan].join(' ').replace(/[,.;]$/, '');
}

export const jumlahKata = (item: PilihanGandaItem) => kalimat(item.stimulus, 'X').split(/\s+/).filter(Boolean).length;

const BATAS: Record<Tingkat, [number, number]> = { dasar: [12, 35], menengah: [18, 35], menantang: [18, 35] };

/** Apakah kata opsi (atau awal katanya) muncul lagi di kalimat — petunjuk tak sengaja. */
export function berulang(item: PilihanGandaItem, kata: string): boolean {
  const w = kata.toLowerCase();
  const kalimatToken = token(kalimat(item.stimulus, ''));
  return kalimatToken.some((t) => t === w || (w.length >= 5 && t.length >= 5 && t.slice(0, 5) === w.slice(0, 5)));
}

/**
 * Pemeriksaan bersama semua family Completion: format PG (label, opsi kembar, a/an), tepat satu bagian kosong,
 * empat opsi satu kata, dan panjang kalimat sesuai tingkat.
 */
export function periksaDasar(item: PilihanGandaItem): string[] {
  const m = periksaFormatPg(item);
  if (item.stimulus.filter((p) => p.gaya === 'kosong').length !== 1) m.push('bagian kosong bukan tepat satu');
  if (item.opsi.length !== 4) m.push('opsi bukan empat');
  if (item.opsi.some((o) => /\s/.test(o.teks.trim()))) m.push('opsi lebih dari satu kata');
  const n = jumlahKata(item);
  const [min, maks] = BATAS[item.tingkat];
  if (n < min || n > maks) m.push(`panjang kalimat ${n} kata di luar ${min}–${maks} untuk tingkat ${item.tingkat}`);
  return m;
}

/** Opsi dengan analisis kelas + bentuk tertentu. */
export const punya = (kata: string, kelas: Kelas, bentuk?: Bentuk) => analisis(kata).some((a) => a.kelas === kelas && (!bentuk || a.bentuk === bentuk));
