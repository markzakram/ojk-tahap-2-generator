import { bangkitkan } from '../core/engine';
import { familyById, FAMILIES } from '../core/registry';
import type { Soal } from '../core/types';
import { geometriTampilan, type DragLineItem } from '../induktif/drag-line/pola';
import { gambarPembahasan } from '../visual';
import { CHAPTERS, chapterById, NAMA_SUBTES } from '../data/chapters';
import DATA from '../data/paket.json';
import { hitungBocor, ringkasPaket, type HasilSusun, type Paket, type SlotPaket } from './susun';

// Fungsi bersama halaman Generator (Buat paket, Hasil paket, Ekspor): paket resmi, pembangkitan ulang isi slot,
// pemeriksaan hasil, dan ekspor JSON/CSV.

export const RESMI = DATA as unknown as HasilSusun;

/** Hasil yang sedang dibuka: data paket, penanda paket resmi, dan judul singkat. */
export interface Hasil { data: HasilSusun; resmi: boolean; judul: string }

export const hasilResmi = (): Hasil => ({ data: RESMI, resmi: true, judul: `${RESMI.paket.filter((p) => p.jenis === 'tryout').length} tryout dan ${RESMI.paket.filter((p) => p.jenis === 'latsol').length} latsol resmi` });

const cache = new Map<string, Soal | null>();
/** Isi soal satu slot (soal, kunci, pembahasan) dibangkitkan ulang dari uid; disimpan sementara per uid. */
export function bangunSlot(s: SlotPaket): Soal | null {
  if (!s.uid || !s.familyId || !s.seed) return null;
  if (cache.has(s.uid)) return cache.get(s.uid)!;
  let soal: Soal | null = null;
  try { soal = bangkitkan(familyById(s.familyId), s.seed); } catch { soal = null; }
  cache.set(s.uid, soal);
  return soal;
}

export const huruf = (s: SlotPaket) => (s.kunci && /^[A-E]$/.test(s.kunci) ? s.kunci : undefined);

/** Soal lengkap untuk JSON: pembahasan memuat visual (SVG) dan Drag the Line memuat geometri tampilannya (QC 2 R02, T02/T08). */
function soalJson(soal: Soal) {
  const gambar = gambarPembahasan(soal);
  return {
    ...soal,
    ...((soal.item as { jenis: string }).jenis === 'drag-line' ? { tampilan: geometriTampilan(soal.item as DragLineItem, soal.jawaban as string[]) } : {}),
    pembahasan: gambar.length ? { ...soal.pembahasan, gambar } : soal.pembahasan,
  };
}

/** Isi lengkap satu paket untuk JSON. */
export function isiLengkap(p: Paket) {
  return {
    id: p.id, nama: p.nama, jenis: p.jenis,
    bagian: p.bagian.map((b) => ({
      subtes: b.subtes, nama: b.nama, menit: b.menit,
      soal: b.slot.map((s, i) => {
        const c = chapterById(s.chapterId);
        const soal = bangunSlot(s);
        const mapping = { category: c.category, lesson: c.lesson, chapter: c.chapter, bentukSoal: c.bentuk, siadu: c.siadu };
        return soal ? { nomor: i + 1, ...mapping, ...soalJson(soal) } : { nomor: i + 1, ...mapping, kosong: s.alasan ?? 'gagal dibangkitkan' };
      }),
    })),
  };
}

/** Daftar slot (satu baris per soal) dengan kolom Mapping, untuk input atau pemeriksaan di spreadsheet. */
export function csvSlot(h: HasilSusun): string {
  const sel = (v: unknown) => { const t = String(v ?? ''); return /[",\n;]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t; };
  const baris = [['paket', 'jenis', 'subtes', 'nomor', 'category', 'lesson', 'chapter', 'bentuk_soal', 'kode_siadu', 'label', 'family', 'versi', 'seed', 'uid', 'tingkat', 'kunci']];
  for (const p of h.paket) for (const b of p.bagian) b.slot.forEach((s, i) => {
    const c = chapterById(s.chapterId);
    baris.push([p.nama, p.jenis, NAMA_SUBTES[b.subtes], String(i + 1), c.category, c.lesson, c.chapter, c.bentuk, c.siadu ?? '', s.label ?? '', s.familyId ?? '', String(s.versi ?? ''), s.seed ?? '', s.uid ?? '', s.tingkat ?? '', huruf(s) ?? (s.uid ? 'interaktif' : '')]);
  });
  return '﻿' + baris.map((r) => r.map(sel).join(',')).join('\n') + '\n';
}

/** Pemeriksaan hasil: slot terisi, struktur kembar, kebocoran antarsoal, sebaran label/tingkat/kunci, bacaan utuh, deret kunci. */
export function periksaHasil(h: HasilSusun) {
  const r = ringkasPaket(h);
  const isi = h.paket.flatMap((p) => p.bagian.flatMap((b) => b.slot)).filter((s) => s.uid);
  const hitung = <T extends string>(daftar: readonly T[], f: (s: SlotPaket) => string | undefined) => daftar.map((k) => [k, isi.filter((s) => f(s) === k).length] as const);
  let deret3 = 0, bacaanPecah = 0, adaBacaan = false;
  for (const p of h.paket) for (const b of p.bagian) {
    const rc = b.slot.map((s, i) => ({ s, i })).filter((x) => x.s.bacaan);
    if (rc.length) {
      adaBacaan = true;
      if (new Set(rc.map((x) => x.s.bacaan)).size !== 1 || rc[rc.length - 1].i - rc[0].i !== rc.length - 1) bacaanPecah++;
    }
    for (let i = 2; i < b.slot.length; i++) { const k = huruf(b.slot[i]); if (k && k === huruf(b.slot[i - 1]) && k === huruf(b.slot[i - 2])) deret3++; }
  }
  const perChapter = CHAPTERS.map((c) => {
    const s = isi.filter((x) => x.chapterId === c.id);
    const t = (n: string) => s.filter((x) => x.tingkat === n).length;
    return { c, shl: s.filter((x) => x.label === 'SHL').length, variasi: s.filter((x) => x.label === 'VARIASI').length, dasar: t('dasar'), menengah: t('menengah'), menantang: t('menantang') };
  }).filter((x) => x.shl + x.variasi > 0);
  const versiLama = isi.filter((s) => FAMILIES.find((f) => f.id === s.familyId)?.versi !== s.versi).length;
  const tanpaFamily = isi.filter((s) => !FAMILIES.some((f) => f.id === s.familyId)).length;
  const bocor = hitungBocor(h, (s) => bangunSlot(s) ?? undefined);
  return {
    ...r, deret3, bacaanPecah, adaBacaan, perChapter, versiLama, tanpaFamily, bocor,
    label: hitung(['SHL', 'VARIASI'] as const, (s) => s.label),
    tingkat: hitung(['dasar', 'menengah', 'menantang'] as const, (s) => s.tingkat),
    kunci: hitung(['A', 'B', 'C', 'D', 'E'] as const, huruf),
    lolos: r.kosong === 0 && r.kembar === 0 && bacaanPecah === 0 && versiLama === 0 && bocor === 0,
  };
}
export type Pemeriksaan = ReturnType<typeof periksaHasil>;

export function unduhBerkas(nama: string, isi: string | Uint8Array, jenis: string) {
  const url = URL.createObjectURL(new Blob([typeof isi === 'string' ? isi : new Uint8Array(isi)], { type: jenis }));
  const a = document.createElement('a');
  a.href = url; a.download = nama; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
