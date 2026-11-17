import type { Family, Label } from '../../core/types';
import { bahasPg, HURUF, periksaFormatPg, type JawabanPg, type PilihanGandaItem, type Tingkat } from '../../core/pilihan-ganda';
import { chapterById } from '../../data/chapters';
import { INSTRUKSI_PSJK } from '../umum';

// Family hitungan sederhana PSJK (bunga flat, rasio, margin, taksiran, porsi saham, dst.). Berbeda dari familyKurasi,
// kunci tidak diambil dari bank: parameter soal disimpan di item dan solver menghitung ulang jawabannya dengan rumus
// template, lalu mencocokkan teks opsi. Pengecoh berasal dari jalur salah hitung yang umum (lupa bunga, lupa uang muka,
// salah basis waktu, pembagi terbalik), masing-masing dengan alasannya. Opsi angka diurutkan naik seperti contoh soal
// e-book. Sidik = family + template (soal yang hanya berbeda angka dianggap satu struktur).

export type Param = Record<string, number>;

export interface Salah {
  nilai: number;
  alasan: string;
}

export interface TemplateHitung {
  /** Id unik dalam family; menjadi bagian sidik. */
  id: string;
  tingkat: Tingkat;
  topik: string;
  sumber: string;
  berlakuPer?: string;
  /** Semua kombinasi parameter yang sah (sudah disaring agar hasilnya bulat dan masuk akal). */
  parameter: Param[];
  pertanyaan(p: Param): string;
  /** Rumus jawaban; dipakai pembangun dan solver. */
  hitung(p: Param): number;
  /** Jalur salah hitung; nilai yang sama dengan kunci atau kembar dibuang otomatis. */
  pengecoh(p: Param): Salah[];
  /** Penulisan opsi; bawaan rupiah. */
  format?: (n: number) => string;
  konsep: string;
  kataKunci: string;
  alasan(p: Param): string[];
  caraCepat: string;
}

export interface DataHitung {
  template: string;
  param: Param;
  sumber: string;
  berlakuPer?: string;
  alasanSalah: Record<string, string>;
  konsep: string;
  kataKunci: string;
  alasan: string[];
  caraCepat: string;
  sidik: string;
}

export type ItemHitung = PilihanGandaItem<DataHitung>;

const kelompok = (n: number) => Math.round(Math.abs(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
/** Rupiah bulat, mis. Rp1.120.000. */
export const rp = (n: number) => `${n < 0 ? '−' : ''}Rp${kelompok(n)}`;
/** Angka desimal gaya Indonesia (koma), paling banyak `maks` angka di belakang koma. */
export const desimal = (n: number, maks = 3) => String(+n.toFixed(maks)).replace('.', ',');
/** Nilai dalam miliar rupiah dengan pemisah ribuan titik dan desimal koma, mis. Rp1.200 miliar, Rp17,6 miliar. */
export const miliar = (n: number) => {
  const [bulatan, pecahan] = String(+n.toFixed(2)).split('.');
  return `Rp${bulatan.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}${pecahan ? `,${pecahan}` : ''} miliar`;
};
export const persen = (n: number) => `${desimal(n)}%`;
export const persen2 = (n: number) => `${desimal(n, 2)}%`;
export const kali = (n: number) => `${desimal(n, 2)} kali`;

/** Semua kombinasi nilai parameter (produk Kartesius), lalu disaring. */
export function kombinasi(ruang: Record<string, number[]>, sah: (p: Param) => boolean = () => true): Param[] {
  let hasil: Param[] = [{}];
  for (const [k, nilai] of Object.entries(ruang)) hasil = hasil.flatMap((p) => nilai.map((v) => ({ ...p, [k]: v })));
  return hasil.filter(sah);
}

/** Bilangan bulat (toleransi galat pecahan biner). */
export const bulat = (n: number) => Math.abs(n - Math.round(n)) < 1e-6;

interface InfoFamily {
  id: string;
  versi?: number;
  nama: string;
  chapter: string;
  label: Label;
  sumber: string;
  ringkas: string;
}

export function familyHitung(info: InfoFamily, templates: TemplateHitung[]): Family<ItemHitung, JawabanPg> {
  const ids = new Set<string>();
  for (const t of templates) {
    if (ids.has(t.id)) throw new Error(`${info.id}: id template ganda ${t.id}`);
    ids.add(t.id);
    if (!t.parameter.length) throw new Error(`${info.id}/${t.id}: tidak ada parameter sah`);
  }
  const peta = new Map(templates.map((t) => [t.id, t]));
  const teks = (t: TemplateHitung, n: number) => (t.format ?? rp)(n);
  return {
    id: info.id, versi: info.versi ?? 1, nama: info.nama, chapter: chapterById(info.chapter), label: info.label, sumber: info.sumber, ringkas: info.ringkas,
    bangun(r) {
      const t = r.pick(templates);
      const p = r.pick(t.parameter);
      const benar = t.hitung(p);
      if (!Number.isFinite(benar) || benar <= 0) return null;
      const kunciTeks = teks(t, benar);
      const unik = new Map<string, Salah>();
      for (const s of t.pengecoh(p)) {
        if (!Number.isFinite(s.nilai) || s.nilai <= 0) continue;
        const x = teks(t, s.nilai);
        if (x !== kunciTeks && !unik.has(x)) unik.set(x, s);
      }
      if (unik.size < 4) return null;
      const pilih = r.sample([...unik.entries()], 4);
      const urut = [{ teks: kunciTeks, nilai: benar }, ...pilih.map(([x, s]) => ({ teks: x, nilai: s.nilai }))].sort((a, b) => a.nilai - b.nilai);
      const opsi = urut.map((o, i) => ({ label: HURUF[i], teks: o.teks }));
      const kunci = HURUF[urut.findIndex((o) => o.teks === kunciTeks)];
      const item: ItemHitung = {
        jenis: 'pilihan-ganda', instruksi: INSTRUKSI_PSJK, pertanyaan: t.pertanyaan(p), stimulus: [], opsi, tingkat: t.tingkat, kaidah: t.topik, konteks: info.chapter,
        data: {
          template: t.id, param: p, sumber: t.sumber, ...(t.berlakuPer ? { berlakuPer: t.berlakuPer } : {}),
          alasanSalah: Object.fromEntries(pilih.map(([x, s]) => [x, s.alasan])),
          konsep: t.konsep, kataKunci: t.kataKunci, alasan: t.alasan(p), caraCepat: t.caraCepat, sidik: `${info.id}|${t.id}`,
        },
      };
      return { item, jawaban: kunci };
    },
    // Solver: hitung ulang dari parameter soal dengan rumus template, lalu cari opsi yang teksnya sama.
    pecahkan(item) {
      const t = peta.get(item.data.template);
      if (!t) return [];
      const benar = teks(t, t.hitung(item.data.param));
      return item.opsi.filter((o) => o.teks === benar).map((o) => o.label);
    },
    kunci: (j) => j,
    periksa(item, j) {
      const m = periksaFormatPg(item);
      if (item.opsi.length !== 5) m.push('PSJK memakai lima opsi');
      if (!item.data.sumber.trim()) m.push('sumber fakta kosong');
      for (const o of item.opsi) if (o.label !== j && !item.data.alasanSalah[o.teks]) m.push(`opsi ${o.label} tanpa alasan salah`);
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
