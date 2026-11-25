import type { Family } from './types';

// QC 1 PCAM Tahap 2 (T09, 19 November 2026): soal dan pembahasan yang terlihat peserta Pengetahuan Sektor Jasa Keuangan
// menguji pengetahuan, bukan isi buku. Stimulus tidak memakai pengantar "Menurut Buku …", tidak menanyakan isi/nama
// publikasi (mis. LSPI), dan pembahasan tidak menyebut e-book atau materi tim sebagai alasan. Sumber penyusunan tetap
// tersimpan di metadata internal (`item.data.sumber`, `family.sumber`) untuk QC dan tidak ditampilkan kepada peserta.
// QC 2 (R03, R06): stem juga tidak memakai "Dalam materi …"/"menurut materi …", dan klaim CPD dihapus.
export const POLA_ATRIBUSI = /\be-?book\b|materi tim|\btim (PCAM|JadiOJK|MLE)\b|\bBuku Saku\b|\bSeri Literasi\b|\bBuku \d+\b|menurut (uraian )?buku|\bLSPI\b|Surveillance Perbankan|(dalam|menurut) (kriteria umum dalam )?materi\b|menurut (referensi|sumber)\b|\bCPD\b/i;

/** Semua string di dalam nilai (rekursif), kecuali kunci metadata internal. */
function kumpulkan(v: unknown, keluar: string[], kunci = ''): void {
  if (['sumber', 'berlakuPer', 'catatan', 'sidik'].includes(kunci)) return;
  if (typeof v === 'string') keluar.push(v);
  else if (Array.isArray(v)) for (const x of v) kumpulkan(x, keluar);
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) kumpulkan(x, keluar, k);
}

/** Teks yang terlihat peserta: isi item (tanpa metadata internal) dan seluruh pembahasan. */
export function teksPeserta(item: unknown, pembahasan: unknown): string[] {
  const t: string[] = [];
  kumpulkan(item, t);
  kumpulkan(pembahasan, t);
  return t;
}

/** Pelanggaran T09 pada soal SJK; kosong bila bersih. Hanya berlaku untuk subtes Pengetahuan Sektor Jasa Keuangan. */
export function pelanggaranAtribusi(family: Family<any, any>, item: unknown, pembahasan: unknown): string | null {
  if (family.chapter.subtes !== 'sjk') return null;
  const kena = teksPeserta(item, pembahasan).find((s) => POLA_ATRIBUSI.test(s));
  return kena ? `teks peserta menyebut buku/e-book/publikasi: "${kena.slice(0, 90)}"` : null;
}
