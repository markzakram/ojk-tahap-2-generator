import type { Rng } from '../../core/rng';
import type { Chapter, Family, Label, Pembahasan } from '../../core/types';
import { chapterById } from '../../data/chapters';
import { bahasPg, HURUF, periksaFormatPg, susunOpsi, type JawabanPg, type Tingkat } from '../model';
import { nilaiOpsi, nilaiSemua, type HasilOpsi, type Relasi } from './penilai';
import { render, type DataGcs, type ItemGcs, type Klausa, type Unsur } from './tipe';

// Desain faktorial Grammatically Correct Sentence (blueprint bagian 5): satu kerangka kalimat dengan beberapa titik uji.
// Setiap titik punya varian; varian ke-0 adalah bentuk yang dimaksud benar, varian lain membawa `galat` kesalahan (1–2).
// Kunci = semua titik pada varian 0; pengecoh = kombinasi lain dengan total 1–2 kesalahan. Penilai (penilai.ts) kemudian
// menilai kelima kalimat dari anotasinya sendiri tanpa melihat nomor varian atau `galat`.

export const INSTRUKSI = 'Identify the sentence that is grammatically correct.';
export const CHAPTER_GCS: Chapter = chapterById('grammatically-correct-sentence');

export interface Varian { unsur: Unsur[]; galat: number }

export interface KerangkaGcs {
  id: string;
  /** Pembeda struktur di dalam kerangka (jenis keterangan waktu, pasangan titik, ...); bagian dari sidik. */
  sasaran: string;
  tingkat: Tingkat;
  konteks: string;
  kaidah: string;
  konsep: string;
  klausa: Klausa[];
  /** Urutan unsur; angka = indeks titik. */
  pola: (Unsur | number)[];
  titik: Varian[][];
  /** Relasi penilai yang wajib membedakan opsi (satu per titik). */
  uji: string[];
}

export const rakit = (k: KerangkaGcs, pilih: number[]): Unsur[] => k.pola.flatMap((p) => (typeof p === 'number' ? k.titik[p][pilih[p]].unsur : [p]));
export const galatKombinasi = (k: KerangkaGcs, pilih: number[]) => pilih.reduce((s, v, i) => s + k.titik[i][v].galat, 0);

export function semuaKombinasi(k: KerangkaGcs): number[][] {
  let hasil: number[][] = [[]];
  for (const t of k.titik) hasil = hasil.flatMap((p) => t.map((_, i) => [...p, i]));
  return hasil;
}

const tokenOpsi = (teks: string) => teks.toLowerCase().replace(/[.,]/g, '').split(/\s+/).filter(Boolean);

function jarak(a: string[], b: string[]): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  }
  return d[a.length][b.length];
}

/**
 * Petunjuk format yang tidak boleh muncul (blueprint bagian 10, "ditebak dari format"): kunci bukan satu-satunya kalimat
 * yang paling dekat dengan kalimat lain (medoid jarak kata), dan bukan satu-satunya yang terpanjang atau terpendek dalam
 * jumlah kata. Selisih beberapa huruf akibat infleksi (were/was, being/been) tidak dianggap panjang mencolok.
 * `iKunci` = indeks kunci.
 */
export function petunjukFormat(teks: string[], iKunci: number): string | null {
  const tok = teks.map(tokenOpsi);
  const total = tok.map((a) => tok.reduce((s, b) => s + jarak(a, b), 0));
  const satuSatunya = (xs: number[], pilih: (a: number, b: number) => boolean) => xs.every((x, i) => i === iKunci || pilih(xs[iKunci], x));
  if (satuSatunya(total, (k, x) => k < x)) return 'kunci adalah satu-satunya kalimat paling mirip dengan kalimat lain';
  const pj = tok.map((t) => t.length);
  if (satuSatunya(pj, (k, x) => k > x)) return 'kunci adalah satu-satunya kalimat terpanjang';
  if (satuSatunya(pj, (k, x) => k < x)) return 'kunci adalah satu-satunya kalimat terpendek';
  return null;
}

/**
 * Bentuk yang dipakai satu kalimat pada setiap titik uji: quantifier dan noun tiap noun phrase, setiap pronoun,
 * preposisi waktu, kata-kata rangkaian verb per klausa, dan urutan subjek–verb per klausa. Dipakai pemeriksaan "kisi"
 * (uji buta putaran 2, GCS-KUANTIFIER: pengecoh several/many × software/softwares dan hanya kunci memakai some): setiap
 * bentuk kunci harus juga dipakai sedikitnya satu pengecoh, sehingga kunci tidak dapat ditemukan sebagai opsi yang
 * menyimpang dari kisi pengecoh.
 */
export function bentukOpsi(unsur: Unsur[]): Set<string> {
  const c = new Set<string>();
  const n = { np: 0, pron: 0, prep: 0 };
  const urut: Record<string, string> = {};
  for (const u of unsur) {
    if (u.peran === 'np') { c.add(`np${n.np}:det:${u.det.toLowerCase()}`); c.add(`np${n.np++}:noun:${u.noun.toLowerCase()}`); }
    else if (u.peran === 'pronomina') c.add(`pron${n.pron++}:${u.teks.trim().toLowerCase()}`);
    else if (u.peran === 'prep-waktu') c.add(`prep${n.prep++}:${u.teks.trim().toLowerCase()}`);
    else if (u.peran === 'verba') {
      for (const w of u.teks.toLowerCase().split(/\s+/).filter(Boolean)) c.add(`v:${u.klausa}:${w}`);
      if (!urut[u.klausa]?.endsWith('V')) urut[u.klausa] = (urut[u.klausa] ?? '') + 'V';
    } else if (u.peran === 'subjek') urut[u.klausa] = (urut[u.klausa] ?? '') + 'S';
  }
  for (const [k, s] of Object.entries(urut)) c.add(`urut:${k}:${s}`);
  return c;
}

/** Bentuk kunci yang tidak dipakai pengecoh mana pun (kosong = kunci bukan pemilik tunggal bentuk apa pun). */
export function bentukTunggalKunci(kunci: Unsur[], pengecoh: Unsur[][]): string[] {
  const lain = pengecoh.map(bentukOpsi);
  return [...bentukOpsi(kunci)].filter((b) => !lain.some((s) => s.has(b)));
}

const CACHE = new Map<string, number[][][]>();

/** Relasi uji yang menjadi satu-satunya kesalahan sebuah kalimat (kalimat itu hanya dapat digugurkan dengan kaidah tersebut). */
export function ujiTunggal(h: HasilOpsi): string | null {
  const gagal = new Set(h.relasi.filter((r) => r.kesalahan.length).map((r) => r.kunci));
  return gagal.size === 1 ? [...gagal][0] : null;
}

/**
 * Semua himpunan empat pengecoh yang sah untuk kerangka (cache per kerangka konkret; murni, deterministik). Kombinasi
 * dipakai hanya bila jumlah kesalahan menurut penilai sama dengan `galat` yang dinyatakan penulis (dua sumber sepakat).
 * Syarat himpunan: setiap titik uji punya pengecoh yang salah HANYA pada titik itu (blueprint §5: kalimat dapat benar pada
 * satu aspek tetapi salah pada aspek lain), sehingga kunci tidak dapat ditemukan dengan menguasai satu kaidah saja; dan
 * tidak ada petunjuk format. Penilai tidak memilih kunci: kunci selalu kombinasi varian 0.
 */
export function himpunanPengecoh(k: KerangkaGcs): number[][][] {
  const kunci = k.titik.map(() => 0);
  const id = `${k.id}|${render(rakit(k, kunci))}`;
  const ada = CACHE.get(id);
  if (ada) return ada;
  const data: DataGcs = { kerangka: k.id, sasaran: k.sasaran, konsep: k.konsep, klausa: k.klausa, uji: k.uji, opsi: [] };
  const kolam = semuaKombinasi(k).filter((p) => {
    const g = galatKombinasi(k, p);
    if (g < 1 || g > 2) return false;
    const unsur = rakit(k, p);
    return nilaiOpsi(data, { label: 'X', unsur }, render(unsur)).kesalahan.length === g;
  });
  const teks = [kunci, ...kolam].map((p) => render(rakit(k, p)));
  const tunggal = kolam.map((p) => { const unsur = rakit(k, p); return ujiTunggal(nilaiOpsi(data, { label: 'X', unsur }, render(unsur))); });
  const hasil: number[][][] = [];
  const n = kolam.length;
  const bentukKunci = [...bentukOpsi(rakit(k, kunci))];
  const bentukKolam = kolam.map((p) => bentukOpsi(rakit(k, p)));
  for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) for (let c = b + 1; c < n; c++) for (let d = c + 1; d < n; d++) {
    const pil = [a, b, c, d];
    if (k.uji.some((u) => !pil.some((j) => tunggal[j] === u))) continue;
    if (bentukKunci.some((x) => !pil.some((j) => bentukKolam[j].has(x)))) continue;
    if (petunjukFormat([teks[0], ...pil.map((j) => teks[j + 1])], 0)) continue;
    hasil.push(pil.map((j) => kolam[j]));
  }
  // Kebalikan petunjuk kisi: bila kunci satu-satunya opsi yang semua bentuknya dimiliki opsi lain, peserta dapat memilih
  // "opsi yang paling tidak menyimpang". Utamakan himpunan yang sedikitnya satu pengecohnya juga tidak menyimpang.
  const tanpaSimpang = (pil: number[][]) => {
    const b = [kunci, ...pil].map((p) => bentukOpsi(rakit(k, p)));
    return b.slice(1).some((x, i) => [...x].every((y) => b.some((z, j) => j !== i + 1 && z.has(y))));
  };
  const utama = hasil.filter(tanpaSimpang);
  if (utama.length) { CACHE.set(id, utama); return utama; }
  CACHE.set(id, hasil);
  return hasil;
}

export function bangunDariKerangka(r: Rng, k: KerangkaGcs): { item: ItemGcs; jawaban: JawabanPg } | null {
  const pilihan = himpunanPengecoh(k);
  if (!pilihan.length) return null;
  const pengecoh = r.pick(pilihan);
  const kunci = k.titik.map(() => 0);
  const { opsi, urut, kunci: label } = susunOpsi(r.shuffle, kunci, pengecoh, (p) => render(rakit(k, p)));
  const data: DataGcs = {
    kerangka: k.id, sasaran: k.sasaran, konsep: k.konsep, klausa: k.klausa, uji: k.uji,
    opsi: urut.map((p, i) => ({ label: HURUF[i], unsur: rakit(k, p) })),
  };
  const item: ItemGcs = { jenis: 'pilihan-ganda', instruksi: INSTRUKSI, stimulus: [], opsi, tingkat: k.tingkat, kaidah: k.kaidah, konteks: k.konteks, data };
  return { item, jawaban: label };
}

// ——— Solver, pemeriksaan, pembahasan ———

export const pecahkanGcs = (item: ItemGcs): JawabanPg[] =>
  nilaiSemua(item.data, item.opsi).filter((h) => h.relasi.length > 0 && h.kesalahan.length === 0).map((h) => h.label);

/** Relasi yang membedakan opsi: gagal pada sedikitnya satu kalimat. */
const relasiDiuji = (hasil: HasilOpsi[]) => new Set(hasil.flatMap((h) => h.relasi.filter((r) => r.kesalahan.length).map((r) => r.kunci)));

export function periksaGcs(item: ItemGcs, jawaban: JawabanPg): string[] {
  const m = periksaFormatPg(item);
  if (item.stimulus.length) m.push('stimulus Grammatically Correct Sentence harus kosong');
  if (item.opsi.length !== 5) m.push('opsi bukan lima kalimat');
  for (const o of item.opsi) {
    const n = o.teks.split(/\s+/).filter(Boolean).length;
    if (n < 10 || n > 25) m.push(`opsi ${o.label} ${n} kata (sasaran 10–25)`);
    if (!/^[A-Z]/.test(o.teks)) m.push(`opsi ${o.label} tidak diawali huruf kapital`);
    if (!o.teks.endsWith('.')) m.push(`opsi ${o.label} tidak diakhiri titik`);
  }
  const hasil = nilaiSemua(item.data, item.opsi);
  for (const h of hasil) {
    if (h.label === jawaban) continue;
    if (!h.kesalahan.length) m.push(`opsi ${h.label} tidak memiliki kesalahan yang dapat ditunjuk`);
    if (h.kesalahan.length > 2) m.push(`opsi ${h.label} memiliki lebih dari dua kesalahan`);
    if (h.relasi.some((r) => r.jenis === 'struktur')) m.push(`anotasi opsi ${h.label} rusak`);
  }
  const diuji = relasiDiuji(hasil);
  for (const u of item.data.uji) {
    if (!diuji.has(u)) m.push(`titik ${u} tidak diuji oleh pengecoh mana pun`);
    else if (!hasil.some((h) => h.label !== jawaban && ujiTunggal(h) === u)) m.push(`tidak ada pengecoh yang salah hanya pada titik ${u}`);
  }
  const iKunci = item.opsi.findIndex((o) => o.label === jawaban);
  if (iKunci >= 0) { const p = petunjukFormat(item.opsi.map((o) => o.teks), iKunci); if (p) m.push(p); }
  const uKunci = item.data.opsi.find((o) => o.label === jawaban)?.unsur;
  if (uKunci) {
    const tunggalKunci = bentukTunggalKunci(uKunci, item.data.opsi.filter((o) => o.label !== jawaban).map((o) => o.unsur));
    if (tunggalKunci.length) m.push(`bentuk kunci tidak dipakai pengecoh mana pun (${tunggalKunci.join(', ')})`);
  }
  return m;
}

export type CaraCepat = (relasiKunci: Relasi[], item: ItemGcs) => string;

/** Urutan penjelasan dalam pembahasan: struktur klausa dulu, lalu agreement, bentuk verb, dan titik lain. */
const URUT_RELASI: Relasi['jenis'][] = ['urutan', 'setuju', 'rantai', 'waktu', 'np', 'pronomina', 'struktur'];

export function bahasGcs(item: ItemGcs, jawaban: JawabanPg, caraCepat: CaraCepat): Pembahasan | null {
  const hasil = nilaiSemua(item.data, item.opsi);
  const kunci = hasil.find((h) => h.label === jawaban);
  if (!kunci || kunci.kesalahan.length) return null;
  const diuji = relasiDiuji(hasil);
  const rel = kunci.relasi.filter((r) => diuji.has(r.kunci)).sort((a, b) => URUT_RELASI.indexOf(a.jenis) - URUT_RELASI.indexOf(b.jenis));
  if (!rel.length) return null;
  // Kata kunci unik; kata yang termuat dalam frasa kata kunci lain (mis. "benches" dalam "the new benches") diganti frasa itu.
  const mentah = rel.flatMap((r) => r.kataKunci);
  const memuat = (a: string, b: string) => a !== b && new RegExp(`\\b${b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(a);
  const kataKunci = [...new Set(mentah.map((b) => mentah.filter((a) => memuat(a, b)).sort((x, y) => y.length - x.length)[0] ?? b))].join(', ');
  const opsiSalah: Record<string, string> = {};
  for (const h of hasil) if (h.label !== jawaban) opsiSalah[h.label] = h.kesalahan.join(' ');
  return bahasPg({ item, kunci: jawaban, konsep: item.data.konsep, kataKunci, alasan: rel.map((r) => r.benar), opsiSalah, caraCepat: caraCepat(rel, item) });
}

export function buatFamily(p: {
  id: string; versi?: number; nama: string; label: Label; sumber: string; ringkas: string;
  /** Kerangka dikelompokkan per kalimat dasar; anggota kelompok = varian konkret (mis. jenis keterangan waktu). */
  kelompok: KerangkaGcs[][];
  caraCepat: CaraCepat;
}): Family<ItemGcs, JawabanPg> {
  return {
    id: p.id,
    versi: p.versi ?? 1,
    nama: p.nama,
    chapter: CHAPTER_GCS,
    label: p.label,
    sumber: p.sumber,
    ringkas: p.ringkas,
    bangun: (r) => bangunDariKerangka(r, r.pick(r.pick(p.kelompok))),
    pecahkan: pecahkanGcs,
    kunci: (j) => j,
    periksa: periksaGcs,
    bahas: (item, j) => bahasGcs(item, j, p.caraCepat),
    sidik: (item) => `${p.id}|${item.data.kerangka}|${item.data.sasaran}`,
  };
}

// ——— Pembantu penyusun varian ———

export const tetap = (teks: string): Unsur => ({ teks });
export const varian = (unsur: Unsur[], galat: number): Varian => ({ unsur, galat });
/** Titik preposisi waktu: varian 0 = preposisi yang dinyatakan penulis, dua lainnya masing-masing satu kesalahan. */
export function titikPrep(benar: 'on' | 'in' | 'at'): Varian[] {
  return [benar, ...(['on', 'in', 'at'] as const).filter((x) => x !== benar)].map((p, i) => varian([{ teks: p, peran: 'prep-waktu' }], i === 0 ? 0 : 1));
}
