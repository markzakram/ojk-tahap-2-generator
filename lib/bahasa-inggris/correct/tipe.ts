import type { PilihanGandaItem } from '../model';
import type { KasusPronomina } from './leksikon';

// Anotasi kalimat Grammatically Correct Sentence. Setiap opsi disimpan sebagai deretan unsur (konstituen) sesuai urutan
// tampil. Unsur bertanda `peran` diperiksa penilai; unsur tanpa peran adalah bagian tetap yang sama pada kelima kalimat.

export interface UnsurTetap { teks: string; peran?: undefined }
/** Subjek klausa. `inti` = kata inti yang mengendalikan agreement; `penentu` = ungkapan jumlah di depan (each of the, ...). */
export interface UnsurSubjek { teks: string; peran: 'subjek'; klausa: string; inti: string; penentu?: string; pewatas?: string }
/** Bagian rangkaian verb klausa (boleh beberapa kata, mis. "must be submitted"); diurai per kata oleh penilai. */
export interface UnsurVerba { teks: string; peran: 'verba'; klausa: string }
export interface UnsurPrepWaktu { teks: string; peran: 'prep-waktu' }
export interface UnsurKetWaktu { teks: string; peran: 'ket-waktu' }
/** Noun phrase dengan quantifier/article: teks = det + (adjective) + noun. */
export interface UnsurNp { teks: string; peran: 'np'; det: string; noun: string }
/** Pronoun pada posisi tertentu. `posisi` = uraian fungsi untuk pembahasan; `pemicu` = kata di kalimat yang menentukannya. */
export interface UnsurPronomina { teks: string; peran: 'pronomina'; fungsi: KasusPronomina; posisi: string; pemicu: string }

export type Unsur = UnsurTetap | UnsurSubjek | UnsurVerba | UnsurPrepWaktu | UnsurKetWaktu | UnsurNp | UnsurPronomina;

/**
 * Klausa yang diperiksa. `jenis: 'nc'` = noun clause (urutan subjek–verb wajib). `lema` = verb utama klausa ("be" untuk
 * kalimat be + adjective); `peran` = apakah subjek menerima tindakan (passive) atau melakukannya.
 */
export interface Klausa {
  id: string;
  jenis: 'utama' | 'nc';
  lema: string;
  peran: 'penerima' | 'pelaku';
  /** Noun clause: kata pengantar (why, where, whether, ...) dan verb induk + pengantar untuk pembahasan. */
  pengantar?: string;
  induk?: string;
}

export interface OpsiGcs { label: string; unsur: Unsur[] }

export interface DataGcs {
  kerangka: string;
  /** Kata/jenis sasaran pembeda struktur (mis. jenis keterangan waktu); dipakai untuk sidik. */
  sasaran: string;
  konsep: string;
  klausa: Klausa[];
  /** Kunci relasi yang wajib membedakan opsi (setiap titik yang diuji harus salah pada sedikitnya satu kalimat). */
  uji: string[];
  opsi: OpsiGcs[];
}

export type ItemGcs = PilihanGandaItem<DataGcs>;

/** Teks kalimat dari deretan unsur: dipisah spasi, koma menempel, diakhiri titik (titik singkatan "a.m." dipakai bersama). */
export function render(unsur: Unsur[]): string {
  const isi = unsur.map((u) => u.teks.trim()).filter(Boolean).join(' ').replace(/\s+,/g, ',').replace(/\s+/g, ' ');
  return isi.endsWith('.') ? isi : `${isi}.`;
}

/**
 * Urai templat ringkas menjadi unsur: `{S}` = subjek klausa, `[...]` = potongan verb klausa, teks lain = bagian tetap.
 * Contoh: `why [was] {S} [delayed]`.
 */
export function urai(templat: string, subjek: UnsurSubjek, klausa: string): Unsur[] {
  const hasil: Unsur[] = [];
  const re = /\{S\}|\[([^\]]+)\]|([^[{]+)/g;
  for (const m of templat.matchAll(re)) {
    if (m[0] === '{S}') hasil.push(subjek);
    else if (m[1] !== undefined) hasil.push({ teks: m[1].trim(), peran: 'verba', klausa });
    else if (m[2].trim()) hasil.push({ teks: m[2].trim() });
  }
  return hasil;
}
