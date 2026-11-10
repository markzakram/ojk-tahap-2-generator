// Model bersama Calendar Date Selection. Kalender satu bulan, tujuh kolom Minggu–Sabtu; peserta memilih 1–5 tanggal.
// Penilaian: himpunan tanggal terpilih harus sama persis dengan kunci (urutan klik bebas).

import { HARI, daftarKata } from '../../data/nama';

export type KendalaTanggal =
  | { jenis: 'hanya-hari'; orang: string; hari: number[] }
  | { jenis: 'tidak-hari'; orang: string; hari: number[] }
  | { jenis: 'cuti'; orang: string; dari: number; sampai: number };

export type Operator =
  | { jenis: 'paling-awal' }
  | { jenis: 'paling-akhir' }
  | { jenis: 'semua' }
  | { jenis: 'k-pertama'; k: number };

export interface Kalender {
  jumlahHari: number;
  /** Hari untuk tanggal 1: 0 = Minggu … 6 = Sabtu. */
  hariPertama: number;
}

/** Bagian yang dilihat peserta, sama untuk semua profil kalender (A/B/C). Dipakai komponen CalendarSoal. */
export interface CalendarTampilan {
  jenis: 'calendar-date';
  profil: 'A' | 'B' | 'C';
  judul: string;
  /** Kalimat konteks sebelum pertanyaan (A: kosong; B: dua kalimat; C: empat kalimat). */
  paragraf: string[];
  pertanyaan: string;
  kalender: Kalender;
  /** Batas antarmuka selalu lima, tidak disesuaikan dengan banyaknya tanggal kunci (Rancangan Fitur TKU). */
  maksPilihan: number;
  /** Kartu petunjuk: orang (A/B) atau sesi (C). */
  orang: { id: string; nama: string; petunjuk: string[] }[];
}

export interface CalendarItem extends CalendarTampilan {
  profil: 'A';
  kendala: KendalaTanggal[];
  operator: Operator;
}

export const MAKS_PILIHAN = 5;

export const hariDari = (k: Kalender, tanggal: number) => (k.hariPertama + tanggal - 1) % 7;
export const hariKerja = (k: Kalender, tanggal: number) => { const h = hariDari(k, tanggal); return h >= 1 && h <= 5; };

export function tersediaOrang(kendala: KendalaTanggal[], orang: string, k: Kalender, t: number): boolean {
  const h = hariDari(k, t);
  return kendala.filter((x) => x.orang === orang).every((x) =>
    x.jenis === 'hanya-hari' ? x.hari.includes(h) : x.jenis === 'tidak-hari' ? !x.hari.includes(h) : t < x.dari || t > x.sampai);
}

/** Semua tanggal hari kerja ketika SELURUH orang tersedia menurut kendala yang terlihat. */
export function tanggalCocok(item: Pick<CalendarItem, 'kalender' | 'orang'>, kendala: KendalaTanggal[]): number[] {
  const hasil: number[] = [];
  for (let t = 1; t <= item.kalender.jumlahHari; t++) {
    if (!hariKerja(item.kalender, t)) continue;
    if (item.orang.every((o) => tersediaOrang(kendala, o.id, item.kalender, t))) hasil.push(t);
  }
  return hasil;
}

/** Terapkan operator pertanyaan. `null` = operator tidak menghasilkan himpunan sah (kosong, >5, atau kurang dari k). */
export function terapkan(op: Operator, cocok: number[]): number[] | null {
  if (!cocok.length) return null;
  switch (op.jenis) {
    case 'paling-awal': return [cocok[0]];
    case 'paling-akhir': return [cocok[cocok.length - 1]];
    case 'semua': return cocok.length <= MAKS_PILIHAN ? cocok : null;
    case 'k-pertama': return cocok.length >= op.k ? cocok.slice(0, op.k) : null;
  }
}

export function teksKendala(k: KendalaTanggal): string {
  switch (k.jenis) {
    case 'hanya-hari': return `Hanya tersedia pada hari ${daftarKata(k.hari.map((h) => HARI[h]))}`;
    case 'tidak-hari': return `Tidak tersedia pada hari ${daftarKata(k.hari.map((h) => HARI[h]))}`;
    case 'cuti': return `Cuti tanggal ${k.dari}–${k.sampai}`;
  }
}

/** Kartu satu orang: klausa digabung dengan titik koma, seperti kartu dua klausa pada sumber. */
export const teksKartu = (klausa: string[]) => [klausa.map((s, i) => (i ? s[0].toLowerCase() + s.slice(1) : s)).join('; ') + '.'];
