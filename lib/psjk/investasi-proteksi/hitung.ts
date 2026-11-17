import type { Family, Label } from '../../core/types';
import { bahasPg, periksaFormatPg, susunOpsi, type JawabanPg, type PilihanGandaItem, type Tingkat } from '../../core/pilihan-ganda';
import { chapterById } from '../../data/chapters';
import { INSTRUKSI_PSJK, type SumberFakta } from '../umum';

// Family hitungan sederhana PSJK (kelompok Investasi dan Proteksi): risiko sendiri, kontribusi, kupon, NAB/UP, margin
// murabahah, bagi hasil, manfaat pensiun, dst. Bentuk tetap PilihanGandaItem 5 opsi. Kunci dihitung ulang oleh solver dari
// parameter yang tercetak di soal (rumus template), bukan dari label yang dipilih pembangun. Pengecoh berasal dari jalur
// kesalahan hitung yang lazim (lupa satu komponen, dasar perhitungan tertukar, arah terbalik), masing-masing beralasan.
//
// Parameter dikurasi (bukan acak bebas) agar angka rapi dan setiap jalur salah menghasilkan nilai yang berbeda; satu set
// parameter = satu struktur (sidik = template + nomor set).

export type Param = Record<string, number>;

export interface JalurSalah {
  /** Nilai hasil jalur kesalahan hitung. */
  nilai: (p: Param) => number;
  /** Mengapa nilai itu salah (ditampilkan di "Alasan opsi salah"). */
  alasan: (p: Param) => string;
}

export interface TemplateHitung extends SumberFakta {
  id: string;
  topik: string;
  tingkat: Tingkat;
  /** Set parameter yang dikurasi; setiap set menjadi satu struktur soal. */
  set: Param[];
  pertanyaan: (p: Param) => string;
  /** Rumus jawaban benar. */
  hitung: (p: Param) => number;
  /** Teks opsi untuk suatu nilai (rupiah, persen, hari, dst.). */
  format: (v: number, p: Param) => string;
  /** Sedikitnya empat jalur salah; setiap soal mengambil empat yang nilainya berbeda dari kunci dan satu sama lain. */
  salah: JalurSalah[];
  /** Nilai nol/negatif boleh tampil (mis. perubahan harga "turun"). Bawaan: hanya nilai positif. */
  bolehNegatif?: boolean;
  konsep: string;
  kataKunci: string;
  langkah: (p: Param) => string[];
  caraCepat: string;
}

export interface DataHitung extends SumberFakta {
  template: string;
  param: Param;
  alasanSalah: Record<string, string>;
  sidik: string;
  konsep: string;
  kataKunci: string;
  alasan: string[];
  caraCepat: string;
}

export type ItemHitung = PilihanGandaItem<DataHitung>;

interface InfoHitung {
  id: string;
  versi?: number;
  nama: string;
  chapter: string;
  label: Label;
  sumber: string;
  ringkas: string;
}

const norm = (t: string) => t.trim().toLowerCase().replace(/\s+/g, ' ');

/** Angka gaya Indonesia: titik pemisah ribuan, koma desimal (paling banyak dua angka di belakang koma). */
export function angka(v: number): string {
  const neg = v < 0;
  const bulat = Math.round(Math.abs(v) * 100) / 100;
  const [utuh, pecahan] = bulat.toFixed(2).split('.');
  const ribuan = utuh.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const desimal = pecahan.replace(/0+$/, '');
  return `${neg ? '−' : ''}${ribuan}${desimal ? ',' + desimal : ''}`;
}

export const rp = (v: number) => (v < 0 ? `−Rp${angka(-v)}` : `Rp${angka(v)}`);
export const persen = (v: number) => `${angka(v)}%`;

export function familyHitung(info: InfoHitung, templates: TemplateHitung[]): Family<ItemHitung, JawabanPg> {
  const ids = new Set<string>();
  for (const t of templates) {
    if (ids.has(t.id)) throw new Error(`${info.id}: id template ganda ${t.id}`);
    ids.add(t.id);
    if (t.salah.length < 4) throw new Error(`${info.id}/${t.id}: jalur salah kurang dari empat`);
    if (!t.set.length) throw new Error(`${info.id}/${t.id}: tanpa set parameter`);
  }
  const peta = new Map(templates.map((t) => [t.id, t]));
  const struktur = templates.flatMap((t) => t.set.map((p, i) => ({ t, p, i })));
  const boleh = (t: TemplateHitung, v: number) => Number.isFinite(v) && (t.bolehNegatif || v > 0);
  const pengecohSah = (t: TemplateHitung, p: Param) => {
    const benar = norm(t.format(t.hitung(p), p));
    const calon = new Map<string, string>();
    for (const s of t.salah) {
      const v = s.nilai(p);
      if (!boleh(t, v)) continue;
      const teks = t.format(v, p);
      if (norm(teks) === benar || calon.has(teks)) continue;
      calon.set(teks, s.alasan(p));
    }
    return calon;
  };
  // setiap set parameter wajib menghasilkan kunci sah dan sedikitnya empat pengecoh berbeda (diperiksa saat dimuat)
  for (const { t, p, i } of struktur) {
    if (!boleh(t, t.hitung(p))) throw new Error(`${info.id}/${t.id}#${i}: kunci tidak sah`);
    if (pengecohSah(t, p).size < 4) throw new Error(`${info.id}/${t.id}#${i}: pengecoh berbeda kurang dari empat`);
  }

  return {
    id: info.id, versi: info.versi ?? 1, nama: info.nama, chapter: chapterById(info.chapter), label: info.label, sumber: info.sumber, ringkas: info.ringkas,
    bangun(r) {
      const { t, p, i } = r.pick(struktur);
      const benar = t.format(t.hitung(p), p);
      const calon = pengecohSah(t, p);
      if (calon.size < 4) return null;
      const peng = r.sample([...calon.keys()], 4);
      const { opsi, kunci } = susunOpsi(r.shuffle, benar, peng, (x) => x);
      const item: ItemHitung = {
        jenis: 'pilihan-ganda', instruksi: INSTRUKSI_PSJK, pertanyaan: t.pertanyaan(p), stimulus: [], opsi, tingkat: t.tingkat, kaidah: t.topik, konteks: info.chapter,
        data: {
          sumber: t.sumber, berlakuPer: t.berlakuPer, template: t.id, param: { ...p },
          alasanSalah: Object.fromEntries(peng.map((x) => [x, calon.get(x)!])), sidik: `${info.id}|${t.id}|${i}`,
          konsep: t.konsep, kataKunci: t.kataKunci, alasan: t.langkah(p), caraCepat: t.caraCepat,
        },
      };
      return { item, jawaban: kunci };
    },
    // solver: hitung ulang rumus template dari parameter soal, lalu cari opsi yang teksnya sama
    pecahkan(item) {
      const t = peta.get(item.data.template);
      if (!t) return [];
      const benar = norm(t.format(t.hitung(item.data.param), item.data.param));
      return item.opsi.filter((o) => norm(o.teks) === benar && !item.data.alasanSalah[o.teks]).map((o) => o.label);
    },
    kunci: (j) => j,
    periksa(item, j) {
      const m = periksaFormatPg(item);
      if (item.opsi.length !== 5) m.push('PSJK memakai lima opsi');
      if (!item.data.sumber.trim()) m.push('sumber fakta kosong');
      for (const o of item.opsi) if (o.label !== j && !item.data.alasanSalah[o.teks]) m.push(`opsi ${o.label} tanpa alasan salah`);
      const kunci = item.opsi.find((o) => o.label === j)!.teks.length;
      const lain = item.opsi.filter((o) => o.label !== j).map((o) => o.teks.length);
      if (kunci > 1.8 * Math.max(...lain) && kunci > 40) m.push('kunci jauh lebih panjang dari semua opsi lain');
      return m;
    },
    bahas(item, j) {
      const d = item.data;
      const opsiSalah: Record<string, string> = {};
      for (const o of item.opsi) if (o.label !== j) opsiSalah[o.label] = d.alasanSalah[o.teks];
      const p = bahasPg({ item, kunci: j, konsep: d.konsep, kataKunci: d.kataKunci, alasan: d.alasan, opsiSalah, caraCepat: d.caraCepat });
      if (!p) return null;
      return { ...p, langkah: [...p.langkah, { teks: `Sumber: ${d.sumber}${d.berlakuPer ? ` (berlaku per ${d.berlakuPer})` : ''}.` }] };
    },
    sidik: (item) => item.data.sidik,
  };
}
