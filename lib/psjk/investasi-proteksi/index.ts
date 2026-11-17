import type { Family } from '../../core/types';
import { ASURANSI } from './asuransi';
import { DANA_PENSIUN } from './dana-pensiun';
import { PASAR_MODAL } from './pasar-modal';
import { BULION } from './bulion';
import { ASET_KRIPTO } from './aset-kripto';
import { KEUANGAN_SYARIAH } from './keuangan-syariah';

// Kelompok "Investasi dan Proteksi": Asuransi, Dana Pensiun, Pasar Modal, Bulion, Aset Kripto, Keuangan Syariah.
// Setiap chapter punya satu family SHL (fakta langsung bergaya contoh soal e-book) dan beberapa family VARIASI (relasi dua
// arah, kasus/pernyataan majemuk, hitungan sederhana). Sumber: e-book tim subfolder "Investasi dan Proteksi" dan bahan
// resmi OJK di "Materi by OJK Official" (Buku Saku Pasar Modal 2023, Seri Literasi Keuangan Buku 4, 6, 8).
export const PSJK_INVESTASI_PROTEKSI: Family<any, any>[] = [
  ...ASURANSI,
  ...DANA_PENSIUN,
  ...PASAR_MODAL,
  ...BULION,
  ...ASET_KRIPTO,
  ...KEUANGAN_SYARIAH,
];
