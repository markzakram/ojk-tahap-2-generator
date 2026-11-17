import type { Family } from '../../core/types';
import { FAMILIES_PERBANKAN } from './perbankan';
import { FAMILIES_PERUSAHAAN_PEMBIAYAAN } from './perusahaan-pembiayaan';
import { FAMILIES_PERGADAIAN } from './pergadaian';
import { FAMILIES_LKM } from './lkm';
import { FAMILIES_PENJAMINAN } from './penjaminan';
import { FAMILIES_MODAL_VENTURA } from './modal-ventura';
import { FAMILIES_DFL } from './dfl';
import { FAMILIES_FINTECH } from './fintech';

// Kelompok "Perbankan dan Pembiayaan": Perbankan, Perusahaan Pembiayaan, Pergadaian, LKM, Lembaga Penjaminan,
// Modal Ventura, Digital Financial Literacy, Fintech. Sumber: e-book materi tim folder Drive "Perbankan dan Pembiayaan"
// dan bahan resmi OJK di "Materi by OJK Official" (Booklet Perbankan Indonesia 2024, Buku Saku Cerdas Mengelola Keuangan,
// Seri Literasi Keuangan Perguruan Tinggi Buku 2, 5, dan 7).
export const PSJK_PERBANKAN_PEMBIAYAAN: Family<any, any>[] = [
  ...FAMILIES_PERBANKAN,
  ...FAMILIES_PERUSAHAAN_PEMBIAYAAN,
  ...FAMILIES_PERGADAIAN,
  ...FAMILIES_LKM,
  ...FAMILIES_PENJAMINAN,
  ...FAMILIES_MODAL_VENTURA,
  ...FAMILIES_DFL,
  ...FAMILIES_FINTECH,
];
