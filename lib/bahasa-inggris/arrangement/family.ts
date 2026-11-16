import type { Family, Label } from '../../core/types';
import type { Rng } from '../../core/rng';
import { chapterById } from '../../data/chapters';
import { bahasPg, HURUF, periksaFormatPg, susunOpsi, type JawabanPg, type Opsi, type PilihanGandaItem, type Tingkat } from '../model';
import { bacaanKata } from './leksikon';
import { kalimatSah, titikGagal, urutanSah, type Token } from './tata-bahasa';

// Sentence Arrangement (blueprint Bahasa Inggris bagian 6): lima fragmen A–E, empat opsi urutan A–D.
// Alur: kerangka beranotasi (kalimat utuh dipecah lima) → label fragmen diacak → pengecoh dipilih dari urutan yang ditolak
// tata bahasa → solver memeriksa ulang SELURUH 120 urutan dari token beranotasi saja.

export const INSTRUKSI = 'Arrange the fragments to form a complete sentence.';
const PEMISAH = ' – ';

/** Satu kalimat sasaran yang ditulis penyusun, sudah dipecah menjadi lima fragmen dalam urutan benar. */
export interface Kerangka {
  id: string;
  tingkat: Tingkat;
  /** Pola yang diuji (dipakai untuk rotasi paket). */
  kaidah: string;
  konteks: string;
  fragmen: [string, string, string, string, string];
  /** Fungsi tiap fragmen pada kalimat (urutan benar), untuk pembahasan. */
  fungsi: [string, string, string, string, string];
  /**
   * Alasan sambungan fragmen ke-i dengan ke-(i+1) pada urutan benar, ditulis sebagai klausa yang dapat berdiri setelah
   * "Padahal, …" (mis. "adjective responsible berpasangan dengan preposisi for").
   */
  kait: [string, string, string, string];
  konsep: string;
  kataKunci: string;
  caraCepat: string;
}

/** Anotasi yang ikut tersimpan pada soal. Solver hanya memakai `token`; sisanya bahan pembahasan. */
export interface DataArrangement {
  kerangka: string;
  /** Token beranotasi tiap fragmen, sejajar dengan `item.fragmen` (label A–E). */
  token: Token[][];
  /** Fungsi tiap fragmen menurut label. */
  fungsi: Record<string, string>;
  /** Sambungan pada kalimat yang dimaksud penyusun (dipakai pembahasan, bukan solver). */
  kait: { dari: string; ke: string; alasan: string }[];
  konsep: string;
  kataKunci: string;
  caraCepat: string;
}

export type ArrangementItem = PilihanGandaItem<DataArrangement>;

// ---------------------------------------------------------------------------------------------------------------------
// Bagian solver: hanya membaca teks opsi dan token beranotasi.

/** Urutan label pada teks opsi ("C – A – E – B – D"), atau null bila bukan permutasi lima label fragmen. */
export function bacaUrutan(teks: string, label: string[]): string[] | null {
  const u = teks.split('–').map((x) => x.trim());
  if (u.length !== label.length || new Set(u).size !== u.length || u.some((x) => !label.includes(x))) return null;
  return u;
}

function tokenUrutan(item: ArrangementItem, urutan: string[]): Token[] {
  return urutan.flatMap((l) => item.data.token[item.fragmen!.findIndex((f) => f.label === l)]);
}

/** Kapitalisasi: kata pertama kalimat berhuruf kapital, kata lain tidak (bank tidak memakai nama diri). */
function kapitalSah(token: Token[]): boolean {
  return token.every((t, i) => (i === 0 ? /^[A-Z]/.test(t.w) : !/^[A-Z]/.test(t.w) || t.w === 'I'));
}

function pecahkan(item: ArrangementItem): JawabanPg[] {
  const label = item.fragmen!.map((f) => f.label);
  return item.opsi.filter((o) => {
    const u = bacaUrutan(o.teks, label);
    if (!u) return false;
    const t = tokenUrutan(item, u);
    return kapitalSah(t) && kalimatSah(t);
  }).map((o) => o.label);
}

const CACHE_SAH = new Map<string, string[][]>();
/** Seluruh urutan (dalam label) yang sah menurut tata bahasa tanpa memandang kapitalisasi — pemeriksaan 120 urutan. */
function semuaUrutanSah(item: ArrangementItem): string[][] {
  const label = item.fragmen!.map((f) => f.label);
  const kunci = JSON.stringify(item.data.token.map((ts, i) => [label[i], ts]));
  let hasil = CACHE_SAH.get(kunci);
  if (!hasil) {
    hasil = urutanSah(item.data.token).map((u) => u.map((i) => label[i]));
    CACHE_SAH.set(kunci, hasil);
  }
  return hasil;
}

// ---------------------------------------------------------------------------------------------------------------------
// Pemeriksaan mutu khusus tipe.

const jumlahKata = (s: string) => s.trim().split(/\s+/).length;

function periksa(item: ArrangementItem, jawaban: JawabanPg): string[] {
  const m = periksaFormatPg(item);
  const fr = item.fragmen ?? [];
  const label = fr.map((f) => f.label);
  if (fr.length !== 5) m.push('jumlah fragmen bukan lima');
  if (item.opsi.length !== 4) m.push('jumlah opsi bukan empat');
  if (item.data.token.length !== fr.length) m.push('anotasi token tidak sejajar dengan fragmen');
  fr.forEach((f, i) => {
    const n = jumlahKata(f.teks);
    if (n < 1 || n > 7) m.push(`fragmen ${f.label} berisi ${n} kata (batas 1–7)`);
    const ts = item.data.token[i] ?? [];
    if (ts.map((t) => t.w).join(' ') !== f.teks.trim()) m.push(`anotasi fragmen ${f.label} tidak cocok dengan teksnya`);
    if (ts.some((t) => !t.b.length)) m.push(`ada kata tanpa bacaan pada fragmen ${f.label}`);
  });
  const total = fr.reduce((s, f) => s + jumlahKata(f.teks), 0);
  if (total < 10 || total > 22) m.push(`kalimat berisi ${total} kata (batas 10–22)`);
  if (new Set(fr.map((f) => f.teks.toLowerCase())).size !== fr.length) m.push('fragmen kembar');
  const kapital = fr.filter((f) => /^[A-Z]/.test(f.teks));
  if (kapital.length !== 1) m.push('harus tepat satu fragmen berhuruf kapital (awal kalimat)');
  if (fr.some((f) => /[.!?]$/.test(f.teks))) m.push('tanda baca akhir tidak boleh ada di fragmen');
  const urutanOpsi = item.opsi.map((o) => bacaUrutan(o.teks, label));
  if (urutanOpsi.some((u) => !u)) m.push('opsi bukan permutasi lima label fragmen');
  // Blueprint bagian 6: uji seluruh 120 urutan, bukan hanya empat opsi; tanpa bergantung pada kapitalisasi.
  const sah = semuaUrutanSah(item);
  if (sah.length !== 1) m.push(sah.length ? `${sah.length} urutan membentuk kalimat sah` : 'tidak ada urutan yang membentuk kalimat sah');
  else {
    const satu = sah[0].join();
    const memuat = urutanOpsi.filter((u) => u && u.join() === satu).length;
    if (memuat !== 1) m.push('urutan sah tidak muncul tepat sekali di opsi');
    const k = item.opsi.find((o) => o.label === jawaban);
    if (!k || bacaUrutan(k.teks, label)?.join() !== satu) m.push('kunci bukan satu-satunya urutan sah');
    if (!kapitalSah(tokenUrutan(item, sah[0]))) m.push('urutan sah tidak diawali fragmen berhuruf kapital');
  }
  // Kapitalisasi tidak boleh menjadi penentu utama: paling banyak satu opsi yang tidak diawali fragmen berhuruf kapital.
  const awalKapital = kapital[0]?.label;
  if (urutanOpsi.filter((u) => u && u[0] !== awalKapital).length > 1) m.push('lebih dari satu opsi dapat digugurkan hanya dari huruf kapital');
  return m;
}

// ---------------------------------------------------------------------------------------------------------------------
// Pembahasan.

const kapitalAwal = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function bahas(item: ArrangementItem, jawaban: JawabanPg) {
  const fr = item.fragmen!;
  const label = fr.map((f) => f.label);
  const teks = (l: string) => fr.find((f) => f.label === l)!.teks;
  const sebut = (l: string) => `${l} (${teks(l)})`;
  const kOpsi = item.opsi.find((o) => o.label === jawaban);
  const kunci = kOpsi && bacaUrutan(kOpsi.teks, label);
  if (!kunci) return null;
  // Sambungan pembahasan harus tepat sama dengan urutan kunci.
  const kait = new Map(item.data.kait.map((x) => [`${x.dari}>${x.ke}`, x.alasan]));
  for (let i = 0; i < 4; i++) if (!kait.has(`${kunci[i]}>${kunci[i + 1]}`)) return null;
  if (kait.size !== 4) return null;
  const sesudah = (l: string) => kunci[kunci.indexOf(l) + 1];
  const sebelum = (l: string) => kunci[kunci.indexOf(l) - 1];
  const alasanKait = (a: string, b: string) => kait.get(`${a}>${b}`)!;

  const kal = kapitalAwal(kunci.map(teks).join(' ')) + '.';
  const alasan = [
    `Urutan ${kunci.join(PEMISAH)} menghasilkan kalimat: ${kal}`,
    `Fungsi fragmen: ${kunci.map((l) => `${sebut(l)} ${item.data.fungsi[l]}`).join('; ')}.`,
    `Sambungannya: ${kunci.slice(0, 4).map((l, i) => `${l}–${kunci[i + 1]}: ${alasanKait(l, kunci[i + 1])}`).join('; ')}.`,
  ];

  const opsiSalah: Record<string, string> = {};
  for (const o of item.opsi) {
    if (o.label === jawaban) continue;
    const d = bacaUrutan(o.teks, label);
    if (!d) return null;
    opsiSalah[o.label] = jelaskanSalah(d, kunci, { sebut, sesudah, sebelum, alasanKait });
  }
  return bahasPg({
    item,
    kunci: jawaban,
    konsep: item.data.konsep,
    kataKunci: item.data.kataKunci,
    alasan,
    opsiSalah,
    caraCepat: item.data.caraCepat,
  });
}

interface Alat {
  sebut: (l: string) => string;
  sesudah: (l: string) => string;
  sebelum: (l: string) => string;
  alasanKait: (a: string, b: string) => string;
}

/** Jenis kesalahan urutan pengecoh dibandingkan urutan kunci. */
export function jenisSalah(d: string[], kunci: string[]): { jenis: 'tukar' | 'awal' | 'putus'; i: number } {
  for (let i = 0; i < 4; i++) {
    const t = [...kunci];
    [t[i], t[i + 1]] = [t[i + 1], t[i]];
    if (t.join() === d.join()) return { jenis: 'tukar', i };
  }
  if (d[0] !== kunci[0]) return { jenis: 'awal', i: 0 };
  for (let i = 0; i < 4; i++) if (kunci[kunci.indexOf(d[i]) + 1] !== d[i + 1]) return { jenis: 'putus', i };
  return { jenis: 'putus', i: 0 };
}

function jelaskanSalah(d: string[], kunci: string[], a: Alat): string {
  const j = jenisSalah(d, kunci);
  if (j.jenis === 'tukar') {
    // Dua fragmen bertetangga tertukar. Bila ada fragmen sebelumnya (p), sambungan p–x juga putus: sebutkan keduanya.
    const [x, y] = [kunci[j.i], kunci[j.i + 1]];
    const p = j.i > 0 ? kunci[j.i - 1] : null;
    const alasan = p ? `${a.alasanKait(p, x)}, dan ${a.alasanKait(x, y)}` : a.alasanKait(x, y);
    return `Urutan ${a.sebut(x)} dan ${a.sebut(y)} tertukar. Padahal, ${alasan}.`;
  }
  if (j.jenis === 'awal') {
    const p = a.sebelum(d[0]);
    return `${a.sebut(d[0])} diletakkan di awal kalimat. Padahal, ${a.alasanKait(p, d[0])}, sehingga ${d[0]} harus langsung mengikuti ${p}.`;
  }
  const [x, w] = [d[j.i], d[j.i + 1]];
  const y = a.sesudah(x);
  return `${a.sebut(x)} langsung diikuti ${a.sebut(w)}. Padahal, ${a.alasanKait(x, y)}, sehingga ${x} harus langsung diikuti ${y}.`;
}

// ---------------------------------------------------------------------------------------------------------------------
// Pembangun.

export function tokenFragmen(teks: string): Token[] {
  return teks.trim().split(/\s+/).map((w) => {
    const b = bacaanKata(w);
    if (!b) throw new Error(`Kata "${w}" belum ada di leksikon Sentence Arrangement`);
    return { w, b: [...b] };
  });
}

function permutasiDekat(kunci: string[]): string[][] {
  const hasil = new Map<string, string[]>();
  const tambah = (u: string[]) => { const s = u.join(); if (s !== kunci.join()) hasil.set(s, u); };
  for (let i = 0; i < 4; i++) { const t = [...kunci]; [t[i], t[i + 1]] = [t[i + 1], t[i]]; tambah(t); }
  for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
    if (i === j) continue;
    const t = [...kunci];
    const [x] = t.splice(i, 1);
    t.splice(j, 0, x);
    tambah(t);
  }
  for (let i = 1; i < 5; i++) tambah([...kunci.slice(i), ...kunci.slice(0, i)]);
  return [...hasil.values()];
}

/**
 * Pengecoh: urutan dekat kunci (tukar dua fragmen bertetangga, pindah satu fragmen, atau potongan akhir dipindah ke awal)
 * yang DITOLAK tata bahasa. Diutamakan yang patah tepat pada sambungan pertama yang salah sehingga mudah dijelaskan; paling
 * banyak satu pengecoh tidak diawali fragmen subjek, agar huruf kapital tidak cukup untuk menggugurkan opsi.
 */
function pilihPengecoh(r: Rng, kunci: string[], tokenLabel: (u: string[]) => Token[], panjang: (l: string) => number): string[][] | null {
  type Calon = { u: string[]; jenis: string; sambung: string; tegas: boolean };
  const calon: Calon[] = [];
  for (const u of permutasiDekat(kunci)) {
    const gagal = titikGagal(tokenLabel(u));
    if (gagal < 0) return null; // urutan lain sah → kerangka tidak berkunci tunggal
    const j = jenisSalah(u, kunci);
    // Sambungan pertama yang salah dan posisi kata awal fragmen sesudahnya.
    let i = 0;
    while (i < 4 && kunci[kunci.indexOf(u[i]) + 1] === u[i + 1]) i++;
    let awalFragmen = 0;
    for (let x = 0; x <= i; x++) awalFragmen += panjang(u[x]);
    const tegas = j.jenis !== 'awal' && gagal >= awalFragmen && gagal < awalFragmen + panjang(u[i + 1] ?? u[i]);
    calon.push({ u, jenis: j.jenis, sambung: j.jenis === 'tukar' ? `t${j.i}` : `${u[i]}>${u[i + 1]}`, tegas });
  }
  const awal = r.shuffle(calon.filter((c) => c.jenis === 'awal' || c.u[0] !== kunci[0]));
  const tengah = r.shuffle(calon.filter((c) => c.u[0] === kunci[0]));
  const pilih: Calon[] = [];
  if (awal.length && r.next() < 0.75) pilih.push(awal[0]);
  const urutTengah = [...tengah.filter((c) => c.tegas), ...tengah.filter((c) => !c.tegas)];
  for (const c of urutTengah) {
    if (pilih.length === 3) break;
    if (pilih.some((p) => p.sambung === c.sambung)) continue;
    pilih.push(c);
  }
  for (const c of urutTengah) { if (pilih.length === 3) break; if (!pilih.includes(c)) pilih.push(c); }
  return pilih.length === 3 ? pilih.map((c) => c.u) : null;
}

function bangunDari(k: Kerangka, r: Rng): { item: ArrangementItem; jawaban: JawabanPg } | null {
  const susunan = r.shuffle([0, 1, 2, 3, 4]);
  const labelPosisi = k.fragmen.map((_, i) => HURUF[susunan[i]]); // label fragmen ke-i pada urutan benar
  const kunci = [...labelPosisi];
  const fragmen: Opsi[] = HURUF.map((l) => ({ label: l, teks: k.fragmen[labelPosisi.indexOf(l)] }));
  const token = fragmen.map((f) => tokenFragmen(f.teks));
  const tokenLabel = (u: string[]) => u.flatMap((l) => token[HURUF.indexOf(l as typeof HURUF[number])]);
  const panjang = (l: string) => token[HURUF.indexOf(l as typeof HURUF[number])].length;
  const pengecoh = pilihPengecoh(r, kunci, tokenLabel, panjang);
  if (!pengecoh) return null;
  const { opsi, kunci: jawaban } = susunOpsi(r.shuffle, kunci, pengecoh, (u) => u.join(PEMISAH));
  const fungsi: Record<string, string> = {};
  labelPosisi.forEach((l, i) => (fungsi[l] = k.fungsi[i]));
  const item: ArrangementItem = {
    jenis: 'pilihan-ganda',
    instruksi: INSTRUKSI,
    stimulus: [],
    fragmen,
    opsi,
    tingkat: k.tingkat,
    kaidah: k.kaidah,
    konteks: k.konteks,
    data: {
      kerangka: k.id,
      token,
      fungsi,
      kait: k.kait.map((alasan, i) => ({ dari: labelPosisi[i], ke: labelPosisi[i + 1], alasan })),
      konsep: k.konsep,
      kataKunci: k.kataKunci,
      caraCepat: k.caraCepat,
    },
  };
  return { item, jawaban };
}

export function buatFamily(o: { id: string; nama: string; label: Label; sumber: string; ringkas: string; kerangka: Kerangka[] }): Family<ArrangementItem, JawabanPg> {
  return {
    id: o.id,
    versi: 1,
    nama: o.nama,
    chapter: chapterById('sentence-arrangement'),
    label: o.label,
    sumber: o.sumber,
    ringkas: o.ringkas,
    bangun: (r) => bangunDari(r.pick(o.kerangka), r),
    pecahkan,
    kunci: (j) => j,
    periksa,
    bahas,
    sidik: (item) => `${o.id}|${item.data.kerangka}`,
  };
}
