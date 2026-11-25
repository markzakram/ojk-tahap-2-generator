import type { Family } from '../core/types';
import { PSJK_INVESTASI_PROTEKSI } from './investasi-proteksi';
import { PSJK_OJK_DASAR } from './ojk-dasar';
import { PSJK_PERBANKAN_PEMBIAYAAN } from './perbankan-pembiayaan';

// Tes Pengetahuan Sektor Jasa Keuangan: 16 chapter Mapping dalam tiga kelompok latsol.
// QC 1 PCAM Tahap 2 (19 November 2026) mengubah semua soal PSJK: pembahasan tanpa baris "Sumber" dan tanpa atribusi
// buku/e-book (T09), stimulus tanpa pengantar "Menurut Buku …", serta penggantian butir F01–F07 dan PENGAYAAN. Versi semua
// family PSJK naik satu sekaligus di sini (objek family diubah di tempat agar semua rujukan memakai versi yang sama).
// QC 2 (24 November 2026) menyaring butir di luar cakupan materi folder (lib/psjk/cakupan.ts) dan memperbaiki redaksi
// R03–R07: versi semua family naik satu lagi. Family yang seluruh isinya di luar cakupan (`kosong`) tidak didaftarkan.
const REVISI_QC = 2;
export const PSJK_FAMILIES: Family<any, any>[] = [
  ...PSJK_OJK_DASAR,
  ...PSJK_PERBANKAN_PEMBIAYAAN,
  ...PSJK_INVESTASI_PROTEKSI,
].filter((f) => !(f as { kosong?: boolean }).kosong).map((f) => Object.assign(f, { versi: f.versi + REVISI_QC }));
