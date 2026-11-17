import type { Family, Label } from '../core/types';
import { bahasPg, periksaFormatPg, susunOpsi, type JawabanPg, type PilihanGandaItem, type Tingkat } from '../core/pilihan-ganda';
import { chapterById } from '../data/chapters';

// Mesin bersama soal Pengetahuan Sektor Jasa Keuangan (PSJK): pilihan ganda 5 opsi (A–E, mengikuti e-book materi tim).
// Pengetahuan faktual tidak dapat "dipecahkan" dari isi soal seperti soal logika, jadi kebenarannya bersandar pada bank
// yang dikurasi dan bersumber. Mesin ini menjaga hal yang dapat diperiksa mesin: tepat satu opsi termasuk jawaban yang
// diterima, setiap pengecoh punya alasan, tidak ada opsi kembar, sumber dan tanggal berlaku tercatat.
//
//   familyKurasi  soal yang ditulis utuh (pertanyaan, jawaban, kumpulan pengecoh beralasan). Bila pengecoh lebih dari
//                 empat, setiap seed mengambil empat yang berbeda; sidik = id butir.
//   familyRelasi  tabel relasi (mis. lembaga → fungsi, istilah → definisi). Setiap baris menjadi soal dua arah; pengecoh
//                 diambil dari baris lain yang nilainya berbeda. Solver memeriksa tabel: opsi benar ⇔ pasangannya ada di tabel.

export const INSTRUKSI_PSJK = 'Pilih satu jawaban yang paling tepat.';

export interface SumberFakta {
  /** Nama dokumen dan bagian, mis. "E-book Perbankan (tim), bab 2" atau "Buku Saku OJK, hlm. 12". */
  sumber: string;
  /** Tanggal atau regulasi acuan bila isi bergantung pada aturan yang dapat berubah, mis. "UU 4/2023 (P2SK)". */
  berlakuPer?: string;
}

export interface Pengecoh {
  teks: string;
  /** Mengapa opsi ini salah (ditampilkan di "Alasan opsi salah"). */
  alasan: string;
}

export interface ButirKurasi extends SumberFakta {
  /** Id unik dalam family; dipakai sebagai sidik. Jangan diganti setelah dipakai. */
  id: string;
  tingkat: Tingkat;
  /** Tema kecil di dalam chapter, untuk rotasi dalam paket. */
  topik: string;
  pertanyaan: string;
  jawaban: string;
  /** Jawaban lain yang juga benar dan karena itu tidak boleh muncul sebagai pengecoh (mis. sinonim, singkatan). */
  jugaBenar?: string[];
  /** Sedikitnya empat; bila lebih, empat diambil per seed. */
  pengecoh: Pengecoh[];
  konsep: string;
  kataKunci: string;
  alasan: string[];
  caraCepat: string;
}

/** Data soal PSJK yang disimpan di item untuk solver dan pemeriksaan. */
export interface DataPsjk extends SumberFakta {
  /** Seluruh teks jawaban yang diterima (kunci + jugaBenar), dari bank. */
  diterima: string[];
  /** Alasan per teks pengecoh yang ditampilkan. */
  alasanSalah: Record<string, string>;
  sidik: string;
  konsep: string;
  kataKunci: string;
  alasan: string[];
  caraCepat: string;
}

export type ItemPsjk = PilihanGandaItem<DataPsjk>;

const norm = (t: string) => t.trim().toLowerCase().replace(/\s+/g, ' ');

/** Solver bersama: opsi benar ⇔ teksnya termasuk jawaban yang diterima dan bukan pengecoh beralasan. */
function pecahkanPsjk(item: ItemPsjk): JawabanPg[] {
  const terima = new Set(item.data.diterima.map(norm));
  const salah = new Set(Object.keys(item.data.alasanSalah).map(norm));
  return item.opsi.filter((o) => terima.has(norm(o.teks)) && !salah.has(norm(o.teks))).map((o) => o.label);
}

/** Pemeriksaan bersama: format, lima opsi, sumber tercatat, setiap pengecoh beralasan, kunci tidak mencolok panjangnya. */
function periksaPsjk(item: ItemPsjk, j: JawabanPg): string[] {
  const m = periksaFormatPg(item);
  if (item.opsi.length !== 5) m.push('PSJK memakai lima opsi');
  if (!item.data.sumber.trim()) m.push('sumber fakta kosong');
  for (const o of item.opsi) if (o.label !== j && !item.data.alasanSalah[o.teks]) m.push(`opsi ${o.label} tanpa alasan salah`);
  const panjang = item.opsi.map((o) => o.teks.length);
  const kunci = item.opsi.find((o) => o.label === j)!.teks.length;
  const lain = panjang.filter((_, i) => item.opsi[i].label !== j);
  if (kunci > 1.8 * Math.max(...lain) && kunci > 40) m.push('kunci jauh lebih panjang dari semua opsi lain');
  if (item.opsi.some((o) => /^(semua|tidak ada) (jawaban|pilihan)/i.test(o.teks))) m.push('opsi "semua/tidak ada jawaban" tidak dipakai');
  return m;
}

function bahasPsjk(item: ItemPsjk, j: JawabanPg) {
  const d = item.data;
  const opsiSalah: Record<string, string> = {};
  for (const o of item.opsi) if (o.label !== j) opsiSalah[o.label] = d.alasanSalah[o.teks];
  const p = bahasPg({ item, kunci: j, konsep: d.konsep, kataKunci: d.kataKunci, alasan: d.alasan, opsiSalah, caraCepat: d.caraCepat });
  if (!p) return null;
  return { ...p, langkah: [...p.langkah, { teks: `Sumber: ${d.sumber}${d.berlakuPer ? ` (berlaku per ${d.berlakuPer})` : ''}.` }] };
}

interface InfoFamily {
  id: string;
  versi?: number;
  nama: string;
  /** Id chapter Mapping (lib/data/chapters.ts, subtes 'sjk'). */
  chapter: string;
  label: Label;
  sumber: string;
  ringkas: string;
}

/** Family dari soal kurasi. */
export function familyKurasi(info: InfoFamily, butir: ButirKurasi[]): Family<ItemPsjk, JawabanPg> {
  const ids = new Set<string>();
  for (const b of butir) {
    if (ids.has(b.id)) throw new Error(`${info.id}: id butir ganda ${b.id}`);
    ids.add(b.id);
    if (b.pengecoh.length < 4) throw new Error(`${info.id}/${b.id}: pengecoh kurang dari empat`);
  }
  return {
    id: info.id, versi: info.versi ?? 1, nama: info.nama, chapter: chapterById(info.chapter), label: info.label, sumber: info.sumber, ringkas: info.ringkas,
    bangun(r) {
      const b = r.pick(butir);
      const peng = r.sample(b.pengecoh, 4);
      const { opsi, kunci } = susunOpsi(r.shuffle, b.jawaban, peng.map((p) => p.teks), (t) => t);
      const item: ItemPsjk = {
        jenis: 'pilihan-ganda', instruksi: INSTRUKSI_PSJK, pertanyaan: b.pertanyaan, stimulus: [], opsi, tingkat: b.tingkat, kaidah: b.topik, konteks: info.chapter,
        data: {
          sumber: b.sumber, berlakuPer: b.berlakuPer, diterima: [b.jawaban, ...(b.jugaBenar ?? [])],
          alasanSalah: Object.fromEntries(peng.map((p) => [p.teks, p.alasan])), sidik: `${info.id}|${b.id}`,
          konsep: b.konsep, kataKunci: b.kataKunci, alasan: b.alasan, caraCepat: b.caraCepat,
        },
      };
      return { item, jawaban: kunci };
    },
    pecahkan: pecahkanPsjk,
    kunci: (j) => j,
    periksa: periksaPsjk,
    bahas: bahasPsjk,
    sidik: (item) => item.data.sidik,
  };
}

/** Satu baris tabel relasi: subjek (mis. nama lembaga/istilah) dan nilai (fungsi/definisi). */
export interface BarisRelasi extends SumberFakta {
  id: string;
  subjek: string;
  nilai: string;
  tingkat: Tingkat;
}

export interface TabelRelasi {
  id: string;
  topik: string;
  /** Kalimat tanya dari subjek ke nilai, mis. (s) => `Fungsi utama ${s} adalah ...`. */
  tanyaNilai: (subjek: string) => string;
  /** Kalimat tanya dari nilai ke subjek, mis. (n) => `Lembaga yang bertugas ${n} adalah ...`. Kosong = satu arah. */
  tanyaSubjek?: (nilai: string) => string;
  /** Alasan bila opsi pengecoh (subjek/nilai baris lain) dipilih. */
  alasanSalah: (benar: BarisRelasi, salah: BarisRelasi, arah: 'nilai' | 'subjek') => string;
  konsep: string;
  caraCepat: string;
  /** Kalimat pembahasan untuk baris yang benar (kedua arah). Kosong = "subjek: nilai." */
  kalimat?: (b: BarisRelasi) => string;
  baris: BarisRelasi[];
}

/**
 * Family dari tabel relasi: setiap baris menjadi soal (dua arah bila `tanyaSubjek` ada), pengecoh dari baris lain.
 * Syarat tabel: subjek unik dan nilai unik (relasi satu-satu), sedikitnya lima baris.
 */
export function familyRelasi(info: InfoFamily, tabel: TabelRelasi[]): Family<ItemPsjk, JawabanPg> {
  for (const t of tabel) {
    if (t.baris.length < 5) throw new Error(`${info.id}/${t.id}: tabel relasi perlu sedikitnya lima baris`);
    if (new Set(t.baris.map((b) => norm(b.subjek))).size !== t.baris.length) throw new Error(`${info.id}/${t.id}: subjek tidak unik`);
    if (new Set(t.baris.map((b) => norm(b.nilai))).size !== t.baris.length) throw new Error(`${info.id}/${t.id}: nilai tidak unik`);
  }
  const soal = tabel.flatMap((t) => t.baris.flatMap((b) => [{ t, b, arah: 'nilai' as const }, ...(t.tanyaSubjek ? [{ t, b, arah: 'subjek' as const }] : [])]));
  return {
    id: info.id, versi: info.versi ?? 1, nama: info.nama, chapter: chapterById(info.chapter), label: info.label, sumber: info.sumber, ringkas: info.ringkas,
    bangun(r) {
      const { t, b, arah } = r.pick(soal);
      const lain = r.sample(t.baris.filter((x) => x.id !== b.id), 4);
      const ambil = (x: BarisRelasi) => (arah === 'nilai' ? x.nilai : x.subjek);
      const { opsi, kunci } = susunOpsi(r.shuffle, ambil(b), lain.map(ambil), (x) => x);
      const pertanyaan = arah === 'nilai' ? t.tanyaNilai(b.subjek) : t.tanyaSubjek!(b.nilai);
      // tabel lengkap disimpan supaya solver dapat menurunkan sendiri pasangan yang benar dari pertanyaan
      const item: ItemPsjk = {
        jenis: 'pilihan-ganda', instruksi: INSTRUKSI_PSJK, pertanyaan, stimulus: [], opsi, tingkat: b.tingkat, kaidah: t.topik, konteks: info.chapter,
        data: {
          sumber: b.sumber, berlakuPer: b.berlakuPer,
          diterima: t.baris.filter((x) => (arah === 'nilai' ? norm(x.subjek) === norm(b.subjek) : norm(x.nilai) === norm(b.nilai))).map(ambil),
          alasanSalah: Object.fromEntries(lain.map((x) => [ambil(x), t.alasanSalah(b, x, arah)])),
          sidik: `${info.id}|${t.id}|${b.id}|${arah}`, konsep: t.konsep,
          kataKunci: arah === 'nilai' ? b.subjek : b.nilai,
          alasan: [t.kalimat ? t.kalimat(b) : `${b.subjek}: ${b.nilai}.`],
          caraCepat: t.caraCepat,
        },
      };
      return { item, jawaban: kunci };
    },
    pecahkan: pecahkanPsjk,
    kunci: (j) => j,
    periksa: periksaPsjk,
    bahas: bahasPsjk,
    sidik: (item) => item.data.sidik,
  };
}
