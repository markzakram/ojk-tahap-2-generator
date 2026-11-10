import { FAMILIES } from '../core/registry';
import type { Chapter, Label } from '../core/types';
import { CHAPTERS, JUMLAH_LATSOL, JUMLAH_TRYOUT, NAMA_SUBTES, TARGET_TANPA_CHAPTER } from './chapters';
import { kapasitasFamily } from './kapasitas';

// Data halaman Ringkasan: kebutuhan soal dari Mapping, family yang tersedia, dan kapasitas dari `npm run verify` terakhir.

export type StatusChapter = 'cukup' | 'tipis' | 'tanpa-variasi' | 'belum-diuji' | 'belum';

export interface BarisChapter {
  id: string;
  nama: string;
  subtes: Chapter['subtes'];
  kebutuhan: number;
  jumlahShl: number;
  jumlahVariasi: number;
  /** Jumlah sidik unik family SHL / VARIASI; null bila ada family yang belum diuji untuk versinya sekarang. */
  strukturShl: number | null;
  strukturVariasi: number | null;
  status: StatusChapter;
  catatan?: string;
  familyPertama?: string;
}

export interface BarisSubtes {
  subtes: Chapter['subtes'];
  nama: string;
  kebutuhan: number;
  tertangani: number;
  catatan?: string;
}

export interface Ringkasan {
  target: number;
  targetTryout: number;
  targetLatsol: number;
  tertangani: number;
  family: { total: number; perSubtes: { nama: string; jumlah: number }[] };
  subtes: BarisSubtes[];
  chapter: BarisChapter[];
  keputusan: { teks: string; jumlah: string }[];
  diujiTerakhir: string | null;
}

const kebutuhan = (perTryout: number, perLatsol: number) => perTryout * JUMLAH_TRYOUT + perLatsol * JUMLAH_LATSOL;

function struktur(ids: { id: string; versi: number }[]): number | null {
  let total = 0;
  for (const f of ids) {
    const k = kapasitasFamily(f.id, f.versi);
    if (!k) return null;
    total += k.sidik;
  }
  return total;
}

export function hitungRingkasan(): Ringkasan {
  const chapter: BarisChapter[] = CHAPTERS.map((c) => {
    const fams = FAMILIES.filter((f) => f.chapter.id === c.id);
    const per = (l: Label) => fams.filter((f) => f.label === l);
    const shl = per('SHL'), variasi = per('VARIASI');
    const butuh = kebutuhan(c.perTryout, c.perLatsol);
    const sShl = struktur(shl), sVar = struktur(variasi);
    let status: StatusChapter;
    if (!fams.length) status = 'belum';
    else if (sShl === null || sVar === null) status = 'belum-diuji';
    else if (sShl + sVar < butuh) status = 'tipis';
    else if (!variasi.length) status = 'tanpa-variasi';
    else status = 'cukup';
    return {
      id: c.id, nama: c.nama, subtes: c.subtes, kebutuhan: butuh, jumlahShl: shl.length, jumlahVariasi: variasi.length,
      strukturShl: sShl, strukturVariasi: sVar, status, catatan: c.catatan, familyPertama: fams[0]?.id,
    };
  });

  const urutSubtes: Chapter['subtes'][] = ['induktif', 'deduktif', 'bahasa-inggris', 'sjk'];
  const subtes: BarisSubtes[] = urutSubtes.map((st) => {
    const baris = chapter.filter((c) => c.subtes === st);
    const lain = TARGET_TANPA_CHAPTER.find((t) => t.subtes === st);
    const butuh = baris.reduce((s, c) => s + c.kebutuhan, 0) + (lain ? kebutuhan(lain.perTryout, lain.perLatsol) : 0);
    const tertangani = baris.filter((c) => c.status !== 'belum').reduce((s, c) => s + c.kebutuhan, 0);
    const kosong = baris.filter((c) => c.status === 'belum');
    const kecil = (t?: string) => t && t.charAt(0).toLowerCase() + t.slice(1);
    const catatan = lain ? kecil(lain.catatan) : kosong.length === baris.length && kosong.length ? kecil(kosong[0].catatan)
      : kosong.length ? `${kosong.map((c) => c.nama).join(', ')} ${kecil(kosong[0].catatan)}` : undefined;
    return { subtes: st, nama: NAMA_SUBTES[st], kebutuhan: butuh, tertangani, catatan };
  });

  const keputusan: Ringkasan['keputusan'] = [];
  for (const t of TARGET_TANPA_CHAPTER) keputusan.push({ teks: `${t.catatan}: ${NAMA_SUBTES[t.subtes].replace(/^Tes /, '')}`, jumlah: `${kebutuhan(t.perTryout, t.perLatsol)} soal` });
  for (const c of chapter.filter((x) => x.status === 'belum' && x.catatan === 'Belum ada blueprint')) keputusan.push({ teks: `Belum ada blueprint: ${c.nama}`, jumlah: `${c.kebutuhan} soal` });
  keputusan.push({ teks: 'Format input SIADU untuk 7 tipe interaktif', jumlah: 'ekspor' });
  for (const c of chapter.filter((x) => x.status === 'tanpa-variasi')) keputusan.push({ teks: `${c.nama} belum punya family VARIASI`, jumlah: `${c.kebutuhan} soal` });
  for (const c of chapter.filter((x) => x.status === 'tipis')) keputusan.push({ teks: `Kapasitas ${c.nama} lebih kecil dari kebutuhan`, jumlah: `${c.kebutuhan} soal` });

  const tanggal = FAMILIES.map((f) => kapasitasFamily(f.id, f.versi)?.diuji).filter((x): x is string => !!x).sort();
  const perSubtes = urutSubtes.map((st) => ({ nama: NAMA_SUBTES[st].replace(/^Tes (Penalaran |Pengetahuan )?/, ''), jumlah: FAMILIES.filter((f) => f.chapter.subtes === st).length })).filter((x) => x.jumlah);
  return {
    target: subtes.reduce((s, x) => s + x.kebutuhan, 0),
    targetTryout: CHAPTERS.reduce((s, c) => s + c.perTryout, 0) * JUMLAH_TRYOUT + TARGET_TANPA_CHAPTER.reduce((s, t) => s + t.perTryout, 0) * JUMLAH_TRYOUT,
    targetLatsol: CHAPTERS.reduce((s, c) => s + c.perLatsol, 0) * JUMLAH_LATSOL + TARGET_TANPA_CHAPTER.reduce((s, t) => s + t.perLatsol, 0) * JUMLAH_LATSOL,
    tertangani: subtes.reduce((s, x) => s + x.tertangani, 0),
    family: { total: FAMILIES.length, perSubtes },
    subtes, chapter, keputusan,
    diujiTerakhir: tanggal.length ? tanggal[tanggal.length - 1] : null,
  };
}
