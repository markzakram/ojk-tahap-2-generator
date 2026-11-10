// Model bersama Timeslot Scheduling. Satu papan 09.00–18.00 = 18 kotak × 30 menit. Empat kegiatan berwarna wajib ditempatkan
// utuh (1–3 kotak), tidak menumpuk, tidak menimpa kegiatan tetap (abu-abu), dan tidak melewati 18.00.
// Kunci = waktu mulai keempat kegiatan. Soal sah hanya bila tepat satu susunan lengkap memenuhi semua syarat dan sasaran.

export const JUMLAH_KOTAK = 18;
/** Warna opsi pertama sampai keempat (Blueprint Timeslot §3), tidak diacak. */
export const WARNA_OPSI = ['#4C4CFF', '#007300', '#FFA500', '#40E0D0'];

export const jam = (kotak: number) => {
  const menit = 9 * 60 + kotak * 30;
  return `${String(Math.floor(menit / 60)).padStart(2, '0')}.${String(menit % 60).padStart(2, '0')}`;
};
export const rentang = (mulai: number, panjang: number) => `${jam(mulai)}–${jam(mulai + panjang)}`;
export const menit = (kotak: number) => `${kotak * 30} menit`;

export interface Opsi { id: string; nama: string; durasi: number }
export interface Tetap { id: string; nama: string; mulai: number; durasi: number }

export type KendalaSlot =
  /** `a` selesai sebelum (atau tepat saat) `b` dimulai — boleh ada jeda. */
  | { jenis: 'sebelum'; a: string; b: string }
  /** `b` dimulai tepat ketika `a` selesai. */
  | { jenis: 'langsung-setelah'; a: string; b: string }
  /** `b` dimulai tepat `jeda` kotak setelah `a` selesai. */
  | { jenis: 'jeda-tepat'; a: string; b: string; jeda: number }
  | { jenis: 'langsung-setelah-tetap'; a: string; tetap: string }
  | { jenis: 'langsung-sebelum-tetap'; a: string; tetap: string }
  /** `a` baru boleh dimulai setelah kegiatan tetap (mis. Pengambilan Laptop) selesai. */
  | { jenis: 'setelah-tetap'; a: string; tetap: string }
  /** Semua kegiatan selesai paling lambat kotak `batas`. */
  | { jenis: 'tenggat'; batas: number }
  | { jenis: 'jendela'; a: string; mulai: number; selesai: number }
  /** `a` selesai paling akhir di antara keempat opsi. */
  | { jenis: 'terakhir'; a: string }
  /** `a` dimulai paling awal di antara keempat opsi. */
  | { jenis: 'pertama'; a: string };

export type Sasaran =
  | { jenis: 'tidak-ada' }
  /** Satu kegiatan dijadwalkan sedini mungkin. */
  | { jenis: 'sedini'; a: string }
  /** Setiap kegiatan sedini mungkin: susunan yang tidak dapat dipercepat tanpa memperlambat kegiatan lain (Pareto). */
  | { jenis: 'semua-sedini' }
  /** Waktu selesai kegiatan terakhir sedini mungkin. */
  | { jenis: 'selesai-sedini' };

export interface TimeslotItem {
  jenis: 'timeslot';
  judul: string;
  paragraf: string[];
  opsi: Opsi[];
  tetap: Tetap[];
  kendala: KendalaSlot[];
  sasaran: Sasaran;
}

/** opsiId → kotak mulai */
export type Susunan = Record<string, number>;

export const kunciSusunan = (s: Susunan) => Object.keys(s).sort().map((k) => `${k}@${s[k]}`).join(',');

function cocok(item: TimeslotItem, k: KendalaSlot, s: Susunan): boolean {
  const dur = (id: string) => item.opsi.find((o) => o.id === id)!.durasi;
  const akhir = (id: string) => s[id] + dur(id);
  const tetap = (id: string) => item.tetap.find((t) => t.id === id)!;
  switch (k.jenis) {
    case 'sebelum': return akhir(k.a) <= s[k.b];
    case 'langsung-setelah': return akhir(k.a) === s[k.b];
    case 'jeda-tepat': return akhir(k.a) + k.jeda === s[k.b];
    case 'langsung-setelah-tetap': { const t = tetap(k.tetap); return s[k.a] === t.mulai + t.durasi; }
    case 'langsung-sebelum-tetap': return akhir(k.a) === tetap(k.tetap).mulai;
    case 'setelah-tetap': { const t = tetap(k.tetap); return s[k.a] >= t.mulai + t.durasi; }
    case 'tenggat': return item.opsi.every((o) => akhir(o.id) <= k.batas);
    case 'jendela': return s[k.a] >= k.mulai && akhir(k.a) <= k.selesai;
    case 'terakhir': return item.opsi.every((o) => o.id === k.a || akhir(o.id) < akhir(k.a));
    case 'pertama': return item.opsi.every((o) => o.id === k.a || s[o.id] > s[k.a]);
  }
}

/** Semua susunan sah (tanpa sasaran): telusuri seluruh kotak mulai yang mungkin untuk keempat opsi. */
export function semuaSusunanSah(item: TimeslotItem, kendala: KendalaSlot[] = item.kendala): Susunan[] {
  const terisi = new Array(JUMLAH_KOTAK).fill(false);
  for (const t of item.tetap) for (let i = t.mulai; i < t.mulai + t.durasi; i++) terisi[i] = true;
  const hasil: Susunan[] = [];
  const s: Susunan = {};
  const pasang = (i: number) => {
    if (i === item.opsi.length) { if (kendala.every((k) => cocok(item, k, s))) hasil.push({ ...s }); return; }
    const o = item.opsi[i];
    for (let m = 0; m + o.durasi <= JUMLAH_KOTAK; m++) {
      let bebas = true;
      for (let x = m; x < m + o.durasi; x++) if (terisi[x]) { bebas = false; break; }
      if (!bebas) continue;
      for (let x = m; x < m + o.durasi; x++) terisi[x] = true;
      s[o.id] = m;
      pasang(i + 1);
      for (let x = m; x < m + o.durasi; x++) terisi[x] = false;
    }
    delete s[o.id];
  };
  pasang(0);
  return hasil;
}

/** Terapkan sasaran pada susunan sah. */
export function terapkanSasaran(item: TimeslotItem, sah: Susunan[]): Susunan[] {
  const sa = item.sasaran;
  const akhir = (s: Susunan, id: string) => s[id] + item.opsi.find((o) => o.id === id)!.durasi;
  if (sa.jenis === 'tidak-ada' || !sah.length) return sah;
  if (sa.jenis === 'sedini') { const m = Math.min(...sah.map((s) => s[sa.a])); return sah.filter((s) => s[sa.a] === m); }
  if (sa.jenis === 'selesai-sedini') {
    const f = (s: Susunan) => Math.max(...item.opsi.map((o) => akhir(s, o.id)));
    const m = Math.min(...sah.map(f));
    return sah.filter((s) => f(s) === m);
  }
  // semua-sedini: buang susunan yang didominasi (ada susunan lain dengan setiap kegiatan selesai tidak lebih lambat dan minimal satu lebih awal).
  const mendominasi = (x: Susunan, y: Susunan) =>
    item.opsi.every((o) => akhir(x, o.id) <= akhir(y, o.id)) && item.opsi.some((o) => akhir(x, o.id) < akhir(y, o.id));
  return sah.filter((y) => !sah.some((x) => mendominasi(x, y)));
}

export const pecahkanTimeslot = (item: TimeslotItem) => terapkanSasaran(item, semuaSusunanSah(item));

/** Celah kosong (rangkaian kotak bukan abu-abu) sebelum kotak `sampai`. */
export function celahKosong(item: Pick<TimeslotItem, 'tetap'>, sampai = JUMLAH_KOTAK): { mulai: number; panjang: number }[] {
  const terisi = new Array(JUMLAH_KOTAK).fill(false);
  for (const t of item.tetap) for (let i = t.mulai; i < t.mulai + t.durasi; i++) terisi[i] = true;
  const celah: { mulai: number; panjang: number }[] = [];
  for (let i = 0; i < sampai; i++) {
    if (terisi[i]) continue;
    if (celah.length && celah[celah.length - 1].mulai + celah[celah.length - 1].panjang === i) celah[celah.length - 1].panjang++;
    else celah.push({ mulai: i, panjang: 1 });
  }
  return celah;
}
