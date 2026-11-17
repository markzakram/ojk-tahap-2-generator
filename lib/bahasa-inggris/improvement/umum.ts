import type { Rng } from '../../core/rng';
import type { Family, Label, Pembahasan } from '../../core/types';
import { chapterById } from '../../data/chapters';
import { HURUF, bahasPg, kalimat, periksaFormatPg, susunOpsi, type JawabanPg, type Opsi, type PilihanGandaItem, type Tingkat } from '../model';
import { RAGAM_EJAAN } from './leksikon';
import { nilai, type Nilai, type Slot } from './solver';

// Kerangka bersama Sentence Improvement (blueprint bagian 4): satu kalimat, satu rentang miring 1–12 kata, opsi A–D =
// pengganti rentang, E = "No improvement needed" (selalu E, tidak ikut diacak). E menjadi kunci hanya bila kalimat awal
// benar; saat itu keempat A–D salah. Bila kalimat awal salah, tepat satu A–D benar.

export const INSTRUKSI = 'Choose the best replacement for the italicised part. If it needs no change, choose E.';
export const TEKS_E = 'No improvement needed';
/** Peluang kalimat awal sudah benar (target 15–20% soal; blueprint bagian 9: tidak dipaksakan demi keseimbangan huruf). */
export const PELUANG_E = 0.18;

export interface DataSI {
  /** id kerangka kalimat (untuk sidik). */
  kerangka: string;
  /** lemma kata sasaran dalam rentang. */
  sasaran: string;
  /** bagian akhir rentang yang sama pada semua opsi (objek/keterangan); '' bila rentang hanya verb. */
  ekor: string;
  /** konteks rentang yang dibaca solver. */
  slot: Slot;
}
export type ItemSI = PilihanGandaItem<DataSI>;

/** Rancangan satu soal dari family: kalimat di kiri/kanan rentang, potongan kunci, dan kumpulan potongan salah. */
export interface Rancangan {
  kerangka: string;
  sasaran: string;
  kiri: string;
  kanan: string;
  ekor: string;
  slot: Slot;
  /** potongan verb yang benar (tanpa ekor). */
  kunci: string;
  /** potongan verb salah: kesalahan khas (to + V1, V1, V2/V3, agreement terbalik, tense tidak cocok penanda). */
  salah: string[];
  /** bentuk salah yang dipakai sebagai kalimat awal (bawaan: semua `salah`). */
  awal?: string[];
  tingkat: Tingkat;
  kaidah: string;
  konteks: string;
}

const gabung = (pot: string, ekor: string) => (ekor ? `${pot} ${ekor}` : pot);

/** Potongan verb dari teks opsi: buang ekor bersama. `null` bila opsi tidak diakhiri ekor itu. */
export function potongan(teks: string, ekor: string): string | null {
  const t = teks.trim();
  if (!ekor) return t;
  if (!t.toLowerCase().endsWith(` ${ekor.toLowerCase()}`)) return null;
  return t.slice(0, t.length - ekor.length).trim();
}

export function rakit(r: Rng, rc: Rancangan, peluangE = PELUANG_E): { item: ItemSI; jawaban: JawabanPg } | null {
  const kunci = rc.kunci.trim();
  const pool = [...new Set(rc.salah.map((s) => s.trim()))].filter((s) => s.toLowerCase() !== kunci.toLowerCase());
  const asliBenar = r.next() < peluangE;
  let asli: string;
  let opsi: Opsi[];
  let jawaban: JawabanPg;
  if (asliBenar) {
    if (pool.length < 4) return null;
    asli = kunci;
    opsi = r.sample(pool, 4).map((p, i) => ({ label: HURUF[i], teks: gabung(p, rc.ekor) }));
    jawaban = 'E';
  } else {
    const awal = (rc.awal ?? pool).filter((s) => pool.includes(s.trim()));
    if (!awal.length) return null;
    asli = r.pick(awal).trim();
    const sisa = pool.filter((s) => s !== asli);
    if (sisa.length < 3) return null;
    const s = susunOpsi(r.shuffle, kunci, r.sample(sisa, 3), (p) => gabung(p, rc.ekor));
    opsi = s.opsi;
    jawaban = s.kunci;
  }
  opsi.push({ label: 'E', teks: TEKS_E });
  const item: ItemSI = {
    jenis: 'pilihan-ganda',
    instruksi: INSTRUKSI,
    stimulus: [{ teks: rc.kiri }, { teks: gabung(asli, rc.ekor), gaya: 'miring' }, { teks: rc.kanan }],
    opsi,
    tingkat: rc.tingkat,
    kaidah: rc.kaidah,
    konteks: rc.konteks,
    data: { kerangka: rc.kerangka, sasaran: rc.sasaran, ekor: rc.ekor, slot: rc.slot },
  };
  return { item, jawaban };
}

const teksMiring = (item: ItemSI) => item.stimulus.find((p) => p.gaya === 'miring')?.teks ?? '';
const jumlahKata = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

/** Penilaian solver untuk setiap label: A–D = kalimat dengan opsi itu; E = kalimat asli. */
export function nilaiSemua(item: ItemSI): Record<string, Nilai> {
  const hasil: Record<string, Nilai> = {};
  for (const o of item.opsi) {
    const teks = o.label === 'E' ? teksMiring(item) : o.teks;
    const p = potongan(teks, item.data.ekor);
    hasil[o.label] = p === null ? { status: 'salah', alasan: 'Opsi tidak mempertahankan bagian rentang yang sama.' } : nilai(item.data.slot, p);
  }
  return hasil;
}

/** Solver independen: semua label yang tidak dapat ditolak dengan kaidah yang jelas (benar atau ragu). */
export function pecahkanSI(item: ItemSI): JawabanPg[] {
  const n = nilaiSemua(item);
  return Object.keys(n).filter((l) => n[l].status !== 'salah');
}

export function periksaSI(item: ItemSI, jawaban: JawabanPg): string[] {
  const m = periksaFormatPg(item);
  if (item.opsi.length !== 5) m.push('jumlah opsi bukan lima');
  if (item.opsi[4]?.label !== 'E' || item.opsi[4]?.teks !== TEKS_E) m.push(`opsi E bukan "${TEKS_E}"`);
  if (!(HURUF as readonly string[]).includes(jawaban)) m.push('label kunci tidak dikenal');
  const miring = item.stimulus.filter((p) => p.gaya === 'miring');
  if (miring.length !== 1) m.push('rentang miring bukan satu');
  if (item.stimulus.some((p) => p.gaya === 'kosong')) m.push('stimulus memuat bagian kosong');
  const asli = teksMiring(item);
  const nKata = jumlahKata(asli);
  if (nKata < 1 || nKata > 12) m.push('rentang miring di luar 1–12 kata');
  const utuh = kalimat(item.stimulus);
  const nKalimat = jumlahKata(utuh);
  // Blueprint bagian 4 menyasar 12–25 kata; contoh blueprint sendiri ada yang 8–11 kata, maka batas bawah 8.
  if (nKalimat < 8 || nKalimat > 25) m.push('panjang kalimat di luar 8–25 kata');
  if (!/^[A-Z]/.test(utuh) || !/[.]$/.test(utuh)) m.push('kalimat tidak diawali huruf besar atau tidak diakhiri titik');
  if (item.stimulus[0]?.gaya) m.push('rentang miring di awal kalimat');
  if (potongan(asli, item.data.ekor) === null) m.push('rentang asli tidak diakhiri ekor bersama');
  const ad = item.opsi.slice(0, 4);
  for (const o of ad) {
    if (potongan(o.teks, item.data.ekor) === null) m.push(`opsi ${o.label} tidak diakhiri ekor bersama`);
    if (o.teks.trim().toLowerCase() === asli.trim().toLowerCase()) m.push(`opsi ${o.label} identik dengan rentang awal`);
  }
  const panjang = ad.map((o) => jumlahKata(o.teks));
  if (Math.max(...panjang) - Math.min(...panjang) > 2) m.push('panjang opsi mencolok');
  for (const t of [utuh, ...item.opsi.map((o) => o.teks)]) {
    const v = t.match(RAGAM_EJAAN);
    if (v) m.push(`ejaan bergantung ragam BrE/AmE: ${v[0]}`);
  }
  return m;
}

const q = (s: string) => `"${s}"`;

export function bahasSI(item: ItemSI, jawaban: JawabanPg, teks: { konsep: string; kataKunci: string; caraCepat: string }): Pembahasan | null {
  const n = nilaiSemua(item);
  const kunci = n[jawaban];
  if (!kunci || kunci.status !== 'benar') return null;
  const asli = teksMiring(item);
  const opsiSalah: Record<string, string> = {};
  for (const o of item.opsi) {
    if (o.label === jawaban) continue;
    const x = n[o.label];
    if (x.status !== 'salah') return null;
    opsiSalah[o.label] = o.label === 'E' ? `Bentuk awal ${q(asli)} perlu diganti. ${x.alasan}` : x.alasan;
  }
  const alasan = jawaban === 'E'
    ? [`Bentuk awal ${q(asli)} sudah tepat. ${kunci.alasan}`, `Kalimat awal tidak perlu diubah: ${kalimat(item.stimulus)}`]
    : [kunci.alasan, `Kalimat lengkap: ${kalimat(item.stimulus, item.opsi.find((o) => o.label === jawaban)!.teks)} Bagian di luar rentang miring tetap.`];
  return bahasPg({ item, kunci: jawaban, konsep: teks.konsep, kataKunci: teks.kataKunci, alasan, opsiSalah, caraCepat: teks.caraCepat });
}

export function sidikSI(familyId: string, item: ItemSI, jawaban: JawabanPg): string {
  return `${familyId}|${item.data.kerangka}|${item.data.sasaran}|${jawaban === 'E' ? 'asli-benar' : 'asli-salah'}`;
}

/** Kata kunci bawaan dari slot. */
export function kataKunciSlot(slot: Slot): string {
  switch (slot.jenis) {
    case 'predikat': return [slot.pemicu, slot.penanda].filter(Boolean).join('; ');
    case 'paralel': return `${slot.pemicu}; unsur lain: ${slot.unsur.join(', ')}`;
    default: return slot.pemicu;
  }
}

export function buatFamily(cfg: {
  id: string;
  /** Naikkan bila isi bank berubah (seed lama tidak lagi menghasilkan soal yang sama). */
  versi?: number;
  nama: string;
  label: Label;
  sumber: string;
  ringkas: string;
  rancang: (r: Rng) => Rancangan | null;
  teks: (item: ItemSI) => { konsep: string; caraCepat: string };
  peluangE?: number;
}): Family<ItemSI, JawabanPg> {
  return {
    id: cfg.id,
    versi: cfg.versi ?? 1,
    nama: cfg.nama,
    chapter: chapterById('sentence-improvement'),
    label: cfg.label,
    sumber: cfg.sumber,
    ringkas: cfg.ringkas,
    bangun(r) {
      const rc = cfg.rancang(r);
      return rc ? rakit(r, rc, cfg.peluangE) : null;
    },
    pecahkan: pecahkanSI,
    kunci: (j) => j,
    periksa: periksaSI,
    bahas: (item, j) => bahasSI(item, j, { ...cfg.teks(item), kataKunci: kataKunciSlot(item.data.slot) }),
    sidik: (item, j) => sidikSI(cfg.id, item, j),
  };
}
