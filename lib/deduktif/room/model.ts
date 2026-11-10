// Model bersama Room Allocations (Place and Room Allocations di SIADU).
// Ketentuan blueprint: tepat lima orang, tiap orang tepat satu ruangan tujuan, maksimal tiga orang per ruangan,
// semua ruangan dan area berlabel, fasilitas bukan tujuan, dan hanya satu alokasi lengkap yang memenuhi seluruh ketentuan.

export type KendalaRuang =
  // Relasi per orang (kartu)
  | { jenis: 'di'; orang: string; ruang: string }
  | { jenis: 'sama'; orang: string; dengan: string }
  | { jenis: 'beda'; orang: string; dengan: string }
  | { jenis: 'sendirian'; orang: string }
  /** Tidak boleh di ruangan yang tepat bersebelahan dengan fasilitas (kedekatan dibaca dari `sebelah` pada denah). */
  | { jenis: 'tidak-sebelah'; orang: string; fasilitas: string }
  /** Kartu tanpa pembatas pribadi (selalu terpenuhi; ada agar setiap kartu punya padanan kendala). */
  | { jenis: 'bebas'; orang: string }
  // Data kartu
  | { jenis: 'durasi'; orang: string; jam: number }
  | { jenis: 'divisi'; orang: string; divisi: string }
  // Aturan umum
  | { jenis: 'maks-jam'; jam: number }
  | { jenis: 'tanpa-campur' }
  /** Ruang hanya untuk `divisi`, dan hanya bila tidak ada ruangan biasa yang memenuhi seluruh ketentuan untuk orang tersebut. */
  | { jenis: 'ruang-cadangan'; ruang: string; divisi: string };

export interface Orang {
  id: string;
  nama: string;
  /** Teks pada kartu orang, satu baris per klausa (dirender dari `kendala`). */
  petunjuk: string[];
  /** Label singkat di kartu, mis. nama divisi atau durasi rapat. */
  tag?: string;
}

export interface Ruang {
  id: string;
  nama: string;
}

/** Posisi area pada denah (grid). */
export interface PosisiDenah { id: string; x: number; y: number; w: number; h: number }

export interface RoomItem {
  jenis: 'room-allocation';
  judul: string;
  /** Paragraf umum: perintah penempatan + aturan umum + kapasitas. */
  instruksi: string[];
  /** Ruangan tujuan penempatan. */
  ruang: Ruang[];
  /** Area pendukung yang berlabel tetapi tidak menerima orang (Mesin Fotokopi, Koridor). */
  fasilitas?: Ruang[];
  denah?: PosisiDenah[];
  /** Pasangan area yang tepat bersebelahan menurut garis batas denah. */
  sebelah?: [string, string][];
  kapasitas: number;
  orang: Orang[];
  /** Kendala terstruktur. Teks kartu dirender dari sini, dan solver hanya membaca ini + ruang + kapasitas + denah. */
  kendala: KendalaRuang[];
}

/** orangId → ruangId */
export type Alokasi = Record<string, string>;

export const kunciAlokasi = (a: Alokasi) => Object.keys(a).sort().map((o) => `${o}=${a[o]}`).join(',');

const dataOrang = <T extends 'durasi' | 'divisi'>(kendala: KendalaRuang[], jenis: T, orang: string) =>
  kendala.find((k) => k.jenis === jenis && 'orang' in k && k.orang === orang) as Extract<KendalaRuang, { jenis: T }> | undefined;

export const durasiOrang = (kendala: KendalaRuang[], orang: string) => dataOrang(kendala, 'durasi', orang)?.jam ?? 0;
export const divisiOrang = (kendala: KendalaRuang[], orang: string) => dataOrang(kendala, 'divisi', orang)?.divisi;

export function ruangSebelah(item: Pick<RoomItem, 'sebelah'>, area: string): string[] {
  return (item.sebelah ?? []).flatMap(([a, b]) => (a === area ? [b] : b === area ? [a] : []));
}

/** Semua kendala kecuali aturan ruang cadangan, dievaluasi pada alokasi lengkap. */
function memenuhiDasar(item: RoomItem, k: KendalaRuang, a: Alokasi): boolean {
  const isi = (r: string) => Object.keys(a).filter((o) => a[o] === r);
  switch (k.jenis) {
    case 'di': return a[k.orang] === k.ruang;
    case 'sama': return a[k.orang] === a[k.dengan];
    case 'beda': return a[k.orang] !== a[k.dengan];
    case 'sendirian': return isi(a[k.orang]).length === 1;
    case 'tidak-sebelah': return !ruangSebelah(item, k.fasilitas).includes(a[k.orang]);
    case 'bebas': case 'durasi': case 'divisi': case 'ruang-cadangan': return true;
    case 'maks-jam': return item.ruang.every((r) => isi(r.id).reduce((s, o) => s + durasiOrang(item.kendala, o), 0) <= k.jam);
    case 'tanpa-campur': return item.ruang.every((r) => new Set(isi(r.id).map((o) => divisiOrang(item.kendala, o))).size <= 1);
  }
}

const dalamKapasitas = (item: RoomItem, a: Alokasi) => item.ruang.every((r) => Object.values(a).filter((x) => x === r.id).length <= item.kapasitas);

export function memenuhiSemua(item: RoomItem, kendala: KendalaRuang[], a: Alokasi): boolean {
  if (!dalamKapasitas(item, a)) return false;
  const dasar = kendala.filter((k) => k.jenis !== 'ruang-cadangan');
  if (!dasar.every((k) => memenuhiDasar(item, k, a))) return false;
  for (const k of kendala) {
    if (k.jenis !== 'ruang-cadangan') continue;
    for (const o of Object.keys(a)) {
      if (a[o] !== k.ruang) continue;
      if (divisiOrang(item.kendala, o) !== k.divisi) return false;
      // Dinilai setelah semua ketentuan lain: pindahkan orang ini ke setiap ruangan biasa; jika ada yang sah, cadangan tidak boleh dipakai.
      const ruangBiasa = item.ruang.filter((r) => r.id !== k.ruang);
      const adaAlternatif = ruangBiasa.some((r) => {
        const b = { ...a, [o]: r.id };
        return dalamKapasitas(item, b) && dasar.every((x) => memenuhiDasar(item, x, b));
      });
      if (adaAlternatif) return false;
    }
  }
  return true;
}

/** Enumerasi penuh |ruang|^|orang| penempatan; kembalikan semua yang memenuhi kapasitas dan seluruh kendala. */
export function semuaAlokasi(item: RoomItem, kendala: KendalaRuang[] = item.kendala): Alokasi[] {
  const hasil: Alokasi[] = [];
  const n = item.orang.length;
  const m = item.ruang.length;
  for (let kode = 0; kode < m ** n; kode++) {
    const a: Alokasi = {};
    let x = kode;
    for (let i = 0; i < n; i++) { a[item.orang[i].id] = item.ruang[x % m].id; x = Math.floor(x / m); }
    if (memenuhiSemua(item, kendala, a)) hasil.push(a);
  }
  return hasil;
}

/** Teks satu klausa kartu. `null` = kendala data/umum yang tidak dirender sebagai klausa kartu. */
export function teksKendala(k: KendalaRuang, nama: (id: string) => string): string | null {
  switch (k.jenis) {
    case 'di': return `Harus di ${nama(k.ruang)}.`;
    case 'sama': return `Satu ruangan dengan ${nama(k.dengan)}.`;
    case 'beda': return `Berbeda ruangan dari ${nama(k.dengan)}.`;
    case 'sendirian': return 'Harus sendirian di ruangannya.';
    case 'tidak-sebelah': return `Tidak boleh di ruangan yang tepat bersebelahan dengan ${nama(k.fasilitas)}.`;
    case 'bebas': return 'Tidak memiliki ketentuan khusus.';
    default: return null;
  }
}
