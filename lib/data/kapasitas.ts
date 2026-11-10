import data from './kapasitas.json';

/** Hasil `npm run verify` terakhir untuk satu family (ditulis otomatis ke kapasitas.json). */
export interface CatatanKapasitas {
  /** Versi family saat diuji; hasil dianggap usang bila versi family sudah naik. */
  versi: number;
  /** Banyak seed yang diuji. */
  seed: number;
  lolos: number;
  /** Sidik struktur unik dari seed yang diuji (batas bawah kapasitas sebenarnya). */
  sidik: number;
  percobaanRata: number;
  /** Tanggal uji (YYYY-MM-DD). */
  diuji: string;
}

export const KAPASITAS = data as Record<string, CatatanKapasitas>;

/** Kapasitas yang masih berlaku untuk versi family saat ini, atau null. */
export function kapasitasFamily(id: string, versi: number): CatatanKapasitas | null {
  const k = KAPASITAS[id];
  return k && k.versi === versi ? k : null;
}
