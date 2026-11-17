import type { Family } from '../core/types';
import { PSJK_INVESTASI_PROTEKSI } from './investasi-proteksi';
import { PSJK_OJK_DASAR } from './ojk-dasar';
import { PSJK_PERBANKAN_PEMBIAYAAN } from './perbankan-pembiayaan';

// Tes Pengetahuan Sektor Jasa Keuangan: 16 chapter Mapping dalam tiga kelompok latsol.
export const PSJK_FAMILIES: Family<any, any>[] = [
  ...PSJK_OJK_DASAR,
  ...PSJK_PERBANKAN_PEMBIAYAAN,
  ...PSJK_INVESTASI_PROTEKSI,
];
