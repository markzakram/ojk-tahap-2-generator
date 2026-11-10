// Model bersama Timeline Scheduling. Empat baris × 18 kotak (09.00–18.00, 30 menit per kotak): tiga baris diketahui dan satu
// baris jawaban. Setiap kegiatan 1–3 kotak dan diperlakukan utuh. Jawaban disimpan sebagai daftar kotak terurut.

export const KOTAK_TL = 18;

export interface KegiatanTL {
  id: string;
  nama: string;
  mulai: number;
  durasi: number;
  /** Boleh digeser 30 menit sebagai satu blok (hanya pada profil rapat; maksimal satu kegiatan per orang). */
  bisaGeser: boolean;
  /** Penanda tampilan khusus, mis. rapat target pada jadwal semula. */
  peran?: 'target-semula';
}

export interface BarisTL {
  id: string;
  nama: string;
  /** Keterangan singkat di samping nama, mis. "4 orang". */
  keterangan?: string;
  kegiatan: KegiatanTL[];
}

export type AturanTL =
  | {
      jenis: 'rapat';
      /** id kegiatan rapat target pada baris jawaban (dilepas saat menguji waktu baru). */
      target: string;
      /** 'lebih-awal' = tepat satu waktu lebih awal yang sah; 'paling-akhir' = waktu mulai paling akhir yang selesai ≤ batas. */
      tanya: 'lebih-awal' | 'paling-akhir';
      batas?: number;
    }
  | {
      jenis: 'ruangan';
      fase: { nama: string; durasi: number; pelatihan: boolean }[];
      /** Baris ruangan yang juga harus kosong sepanjang reservasi. */
      pendukung: string;
      /** Nama kegiatan yang tidak boleh bersamaan dengan fase pelatihan. */
      larangan: string;
    }
  | {
      jenis: 'petugas';
      anggota: Record<string, number>;
      anggotaJawaban: number;
      acara: [number, number];
      tutup: [number, number];
      /** Kebutuhan minimal petugas per rentang kotak [mulai, selesai). */
      ambang: { mulai: number; selesai: number; min: number }[];
    };

export interface TimelineItem {
  jenis: 'timeline';
  judul: string;
  paragraf: string[];
  pertanyaan: string;
  baris: BarisTL[];
  jawaban: BarisTL;
  legenda: { abu: string; pilihan: string };
  pilih: { mode: 'blok'; panjang: number; label?: string[] } | { mode: 'kotak' };
  /** Penanda waktu di luar acara / penutupan (hanya informasi, tidak dihitung sebagai kegiatan). */
  penanda?: { mulai: number; durasi: number; nama: string }[];
  aturan: AturanTL;
}

export const jamTL = (k: number) => {
  const m = 9 * 60 + k * 30;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}.${String(m % 60).padStart(2, '0')}`;
};
export const rentangTL = (mulai: number, durasi: number) => `${jamTL(mulai)}–${jamTL(mulai + durasi)}`;
export const blok = (mulai: number, panjang: number) => Array.from({ length: panjang }, (_, i) => mulai + i);

const tumpang = (a0: number, a1: number, b0: number, b1: number) => a0 < b1 && b0 < a1;
const terisi = (b: BarisTL, m0: number, m1: number, kecuali?: string) =>
  b.kegiatan.filter((k) => k.id !== kecuali && tumpang(k.mulai, k.mulai + k.durasi, m0, m1));

/** Kelayakan satu orang untuk rentang [m0, m1): bebas, atau cukup menggeser satu kegiatan yang boleh digeser sejauh 30 menit. */
export function cekOrang(b: BarisTL, m0: number, m1: number): { ok: true; geser?: { k: KegiatanTL; ke: number } } | { ok: false; alasan: string } {
  const kena = terisi(b, m0, m1);
  if (!kena.length) return { ok: true };
  if (kena.length > 1) return { ok: false, alasan: `${b.nama} punya ${kena.length} kegiatan pada rentang itu (${kena.map((k) => `${k.nama} ${rentangTL(k.mulai, k.durasi)}`).join(', ')}); hanya satu kegiatan yang boleh digeser` };
  const k = kena[0];
  if (!k.bisaGeser) return { ok: false, alasan: `${b.nama} ada ${k.nama} ${rentangTL(k.mulai, k.durasi)} yang tidak boleh dipindah` };
  for (const ke of [k.mulai - 1, k.mulai + 1]) {
    if (ke < 0 || ke + k.durasi > KOTAK_TL) continue;
    if (tumpang(ke, ke + k.durasi, m0, m1)) continue;
    if (terisi(b, ke, ke + k.durasi, k.id).length) continue;
    return { ok: true, geser: { k, ke } };
  }
  return { ok: false, alasan: `${b.nama} ada ${k.nama} ${rentangTL(k.mulai, k.durasi)}; digeser 30 menit ke arah mana pun tetap bertabrakan` };
}

export function waktuRapatSah(item: TimelineItem): number[] {
  const a = item.aturan;
  if (a.jenis !== 'rapat') return [];
  const t = item.jawaban.kegiatan.find((k) => k.id === a.target)!;
  const hasil: number[] = [];
  for (let m = 0; m + t.durasi <= KOTAK_TL; m++) {
    if (a.tanya === 'lebih-awal' && m >= t.mulai) continue;
    if (a.tanya === 'paling-akhir' && m + t.durasi > a.batas!) continue;
    if (terisi(item.jawaban, m, m + t.durasi, t.id).length) continue;
    if (item.baris.every((b) => cekOrang(b, m, m + t.durasi).ok)) hasil.push(m);
  }
  return hasil;
}

export function reservasiSah(item: TimelineItem): number[] {
  const a = item.aturan;
  if (a.jenis !== 'ruangan') return [];
  const L = a.fase.reduce((s, f) => s + f.durasi, 0);
  const pendukung = item.baris.find((b) => b.id === a.pendukung)!;
  const hasil: number[] = [];
  for (let m = 0; m + L <= KOTAK_TL; m++) if (cekReservasi(item, m, L, pendukung).ok) hasil.push(m);
  return hasil;
}

export function cekReservasi(item: TimelineItem, m: number, L: number, pendukung: BarisTL): { ok: boolean; alasan?: string } {
  const a = item.aturan as Extract<AturanTL, { jenis: 'ruangan' }>;
  const r4 = terisi(item.jawaban, m, m + L);
  if (r4.length) return { ok: false, alasan: `${item.jawaban.nama} terisi ${r4[0].nama} ${rentangTL(r4[0].mulai, r4[0].durasi)}` };
  const rp = terisi(pendukung, m, m + L);
  if (rp.length) return { ok: false, alasan: `${pendukung.nama} terisi ${rp[0].nama} ${rentangTL(rp[0].mulai, rp[0].durasi)}` };
  let x = m;
  for (const f of a.fase) {
    if (f.pelatihan) for (const b of item.baris) for (const k of terisi(b, x, x + f.durasi)) {
      if (k.nama === a.larangan) return { ok: false, alasan: `${f.nama} ${rentangTL(x, f.durasi)} bersamaan dengan ${k.nama} di ${b.nama} ${rentangTL(k.mulai, k.durasi)}` };
    }
    x += f.durasi;
  }
  return { ok: true };
}

/** Jumlah petugas aktif per kotak dari tiga tim diketahui. */
export function petugasPerKotak(item: TimelineItem): number[] {
  const a = item.aturan as Extract<AturanTL, { jenis: 'petugas' }>;
  const n = new Array(KOTAK_TL).fill(0);
  for (const b of item.baris) for (const k of b.kegiatan) for (let i = k.mulai; i < k.mulai + k.durasi; i++) n[i] += a.anggota[b.id];
  return n;
}

export const kotakAktif = (a: Extract<AturanTL, { jenis: 'petugas' }>, i: number) => i >= a.acara[0] && i < a.acara[1] && !(i >= a.tutup[0] && i < a.tutup[1]);
export const ambangDi = (a: Extract<AturanTL, { jenis: 'petugas' }>, i: number) => a.ambang.find((x) => i >= x.mulai && i < x.selesai)?.min ?? 0;

/** Himpunan kotak minimum untuk tim jawaban; `null` bila tim jawaban pun tidak dapat menutup kekurangan. */
export function kotakPetugas(item: TimelineItem): number[] | null {
  const a = item.aturan as Extract<AturanTL, { jenis: 'petugas' }>;
  const n = petugasPerKotak(item);
  const hasil: number[] = [];
  for (let i = 0; i < KOTAK_TL; i++) {
    if (!kotakAktif(a, i)) continue;
    const min = ambangDi(a, i);
    if (n[i] >= min) continue;
    if (n[i] + a.anggotaJawaban < min) return null;
    hasil.push(i);
  }
  return hasil;
}

/** Solver independen: semua jawaban (daftar kotak) yang memenuhi perintah soal. */
export function pecahkanTimeline(item: TimelineItem): number[][] {
  const a = item.aturan;
  if (a.jenis === 'rapat') {
    const t = item.jawaban.kegiatan.find((k) => k.id === a.target)!;
    const sah = waktuRapatSah(item);
    const dipilih = a.tanya === 'paling-akhir' && sah.length ? [Math.max(...sah)] : sah;
    return dipilih.map((m) => blok(m, t.durasi));
  }
  if (a.jenis === 'ruangan') {
    const L = a.fase.reduce((s, f) => s + f.durasi, 0);
    return reservasiSah(item).map((m) => blok(m, L));
  }
  const k = kotakPetugas(item);
  return k && k.length ? [k] : [];
}

export const kunciTL = (kotak: number[]) => [...kotak].sort((x, y) => x - y).join(',');

/** Rangkaian kotak berurutan → [mulai, panjang][] */
export function rangkaian(kotak: number[]): [number, number][] {
  const s = [...kotak].sort((x, y) => x - y);
  const hasil: [number, number][] = [];
  for (const k of s) {
    const akhir = hasil[hasil.length - 1];
    if (akhir && akhir[0] + akhir[1] === k) akhir[1]++;
    else hasil.push([k, 1]);
  }
  return hasil;
}
