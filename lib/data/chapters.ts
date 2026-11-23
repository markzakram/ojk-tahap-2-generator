import type { Chapter } from '../core/types';

// Sumber: Mapping Tahap 2 PCAM OJK 2026, sheet "PCAM 10 OJK" (salinan: bahan/Mapping Tahap 2 - PCAM 10 OJK.csv).
// `perTryout` = kolom Distribusi Tryout (jumlah soal per tryout), `perLatsol` = kolom Distribusi Latsol.
export interface ChapterMapping extends Chapter {
  perTryout: number;
  perLatsol: number;
  siadu?: string;
  /** Keterangan bila chapter belum punya family (mis. blueprint belum ada). */
  catatan?: string;
  /** Kelompok latsol pada Mapping (PSJK: tiga kelompok "Soal Ke-OJK-an - …"). */
  kelompok?: string;
  /** Kolom Category, Lesson, dan Chapter Mapping apa adanya (dipakai tampilan dan ekspor SiAdu). */
  category: string;
  lesson: string;
  /** Nama chapter persis seperti kolom Chapter Mapping (Reading: "4 Option" di bawah Lesson Reading Comprehension). */
  chapter: string;
}

/** Kolom Tes, Category, dan Lesson Mapping per subtes (Reading Comprehension memakai Lesson sendiri). */
export const TES = 'Tes Kemampuan Umum (TKU)';
const KLASIFIKASI: Record<Chapter['subtes'], { category: string; lesson: string }> = {
  induktif: { category: 'Penalaran Spasial', lesson: 'SHL Induktif Interaktif' },
  deduktif: { category: 'Penalaran Verbal', lesson: 'SHL Deduktif Interaktif' },
  'bahasa-inggris': { category: 'Bahasa Inggris', lesson: 'Grammar and Vocabulary' },
  sjk: { category: 'Pengetahuan', lesson: 'Pengetahuan Ke-OJK-an' },
};
/** Kolom "Navigation; Urutan Soal" Mapping. */
export const NAVIGASI: Record<Chapter['subtes'], string> = {
  induktif: 'Navigation: Disable · Urutan Soal: Random Full',
  deduktif: 'Navigation: Disable · Urutan Soal: Random Full',
  'bahasa-inggris': 'Navigation: Disable · Urutan Soal: urutan chapter tetap, soal diambil acak, kecuali Reading',
  sjk: 'Navigation: Disable · Urutan Soal: Random Full',
};
/** Kolom Sistem Penilaian Mapping. */
export const PENILAIAN = { subtes: '(Total soal benar)/(Total soal) × 100', tes: 'Rata-rata nilai ke-4 subtes' };

type BarisMapping = Omit<ChapterMapping, 'category' | 'lesson' | 'chapter'> & Partial<Pick<ChapterMapping, 'category' | 'lesson' | 'chapter'>>;
const lengkapi = (c: BarisMapping): ChapterMapping => ({ ...KLASIFIKASI[c.subtes], chapter: c.nama, ...c } as ChapterMapping);

export const CHAPTERS: ChapterMapping[] = ([
  // Tes Penalaran Induktif — 15 soal, 18 menit
  { id: 'fill-shape-six-pointed-star', subtes: 'induktif', nama: 'Fill Shape - Six-pointed Star', bentuk: 'Fill Shape', perTryout: 2, perLatsol: 3, siadu: '3413' },
  { id: 'fill-shape-square', subtes: 'induktif', nama: 'Fill Shape - Square', bentuk: 'Fill Shape', perTryout: 2, perLatsol: 3, siadu: '3414' },
  { id: 'fill-shape-inverted-pentagram', subtes: 'induktif', nama: 'Fill Shape - Inverted Pentagram', bentuk: 'Fill Shape', perTryout: 2, perLatsol: 2, siadu: '3415' },
  { id: 'fill-shape-triangle', subtes: 'induktif', nama: 'Fill Shape - Triangle', bentuk: 'Fill Shape', perTryout: 1, perLatsol: 2, siadu: '3416' },
  { id: 'drag-the-line-2', subtes: 'induktif', nama: 'Drag the Line - 2 Character', bentuk: 'Node Arrow Navigation', perTryout: 1, perLatsol: 2, siadu: '3417' },
  { id: 'drag-the-line-3', subtes: 'induktif', nama: 'Drag the Line - 3 Character', bentuk: 'Node Arrow Navigation', perTryout: 3, perLatsol: 3, siadu: '3418' },
  { id: 'drag-the-line-4', subtes: 'induktif', nama: 'Drag the Line - 4 Character', bentuk: 'Node Arrow Navigation', perTryout: 2, perLatsol: 3, siadu: '3419' },
  { id: 'drag-the-line-special', subtes: 'induktif', nama: 'Drag the Line - Special Character', bentuk: 'Node Arrow Navigation', perTryout: 2, perLatsol: 2, siadu: '3420' },
  // Tes Penalaran Deduktif — 12 soal, 18 menit
  { id: 'calendar-date-selection', subtes: 'deduktif', nama: 'Calendar Date Selection', bentuk: 'Calendar Date Selection', perTryout: 3, perLatsol: 10, siadu: '3409' },
  { id: 'room-allocations', subtes: 'deduktif', nama: 'Room Allocations', bentuk: 'Place and Room Allocations', perTryout: 2, perLatsol: 10, siadu: '3410' },
  { id: 'timeline-scheduling', subtes: 'deduktif', nama: 'Timeline Scheduling', bentuk: 'Timeline Scheduling', perTryout: 2, perLatsol: 10, siadu: '3411' },
  { id: 'badges', subtes: 'deduktif', nama: 'Badges', bentuk: 'Logical Ranking', perTryout: 3, perLatsol: 10, siadu: '3309' },
  { id: 'timeslot-scheduling', subtes: 'deduktif', nama: 'Timeslot Scheduling', bentuk: 'Timeslot Scheduling', perTryout: 2, perLatsol: 10, siadu: '3412' },
  // Tes Bahasa Inggris — 12 soal, 15 menit (urutan chapter tetap, soal diacak, kecuali Reading)
  { id: 'sentence-completion', subtes: 'bahasa-inggris', nama: 'Sentence Completion - 4 Option', bentuk: 'Option New', perTryout: 4, perLatsol: 3, siadu: '3405' },
  { id: 'sentence-improvement', subtes: 'bahasa-inggris', nama: 'Sentence Improvement', bentuk: 'Option New', perTryout: 2, perLatsol: 2, siadu: '3406' },
  { id: 'grammatically-correct-sentence', subtes: 'bahasa-inggris', nama: 'Grammatically Correct Sentence', bentuk: 'Option New', perTryout: 1, perLatsol: 1, siadu: '3407' },
  { id: 'sentence-arrangement', subtes: 'bahasa-inggris', nama: 'Sentence Arrangement - 4 Option', bentuk: 'Option New', perTryout: 1, perLatsol: 1, siadu: '3408' },
  { id: 'reading-comprehension', subtes: 'bahasa-inggris', nama: 'Reading Comprehension - 4 Option', lesson: 'Reading Comprehension', chapter: '4 Option', bentuk: 'Option New', perTryout: 4, perLatsol: 3, siadu: '3220' },
  // Tes Pengetahuan Sektor Jasa Keuangan — 50 soal, 60 menit; latsol per kelompok (10 soal, 10 menit)
  { id: 'pengenalan-ojk', subtes: 'sjk', nama: 'Pengenalan OJK dan Waspada Investasi', bentuk: 'Option New', perTryout: 8, perLatsol: 7, siadu: '3389', kelompok: 'OJK dan Dasar Keuangan' },
  { id: 'perencanaan-keuangan', subtes: 'sjk', nama: 'Perencanaan Keuangan', bentuk: 'Option New', perTryout: 3, perLatsol: 3, siadu: '3390', kelompok: 'OJK dan Dasar Keuangan' },
  { id: 'perbankan', subtes: 'sjk', nama: 'Perbankan', bentuk: 'Option New', perTryout: 7, perLatsol: 3, siadu: '3391', kelompok: 'Perbankan dan Pembiayaan' },
  { id: 'perusahaan-pembiayaan', subtes: 'sjk', nama: 'Perusahaan Pembiayaan', bentuk: 'Option New', perTryout: 3, perLatsol: 1, siadu: '3392', kelompok: 'Perbankan dan Pembiayaan' },
  { id: 'pergadaian', subtes: 'sjk', nama: 'Pergadaian', bentuk: 'Option New', perTryout: 2, perLatsol: 1, siadu: '3393', kelompok: 'Perbankan dan Pembiayaan' },
  { id: 'lembaga-keuangan-mikro', subtes: 'sjk', nama: 'Lembaga Keuangan Mikro', bentuk: 'Option New', perTryout: 1, perLatsol: 1, siadu: '3394', kelompok: 'Perbankan dan Pembiayaan' },
  { id: 'lembaga-penjaminan', subtes: 'sjk', nama: 'Lembaga Penjaminan', bentuk: 'Option New', perTryout: 1, perLatsol: 1, siadu: '3395', kelompok: 'Perbankan dan Pembiayaan' },
  { id: 'modal-ventura', subtes: 'sjk', nama: 'Perusahaan Modal Ventura', bentuk: 'Option New', perTryout: 1, perLatsol: 1, siadu: '3396', kelompok: 'Perbankan dan Pembiayaan' },
  { id: 'digital-financial-literacy', subtes: 'sjk', nama: 'Digital Financial Literacy', bentuk: 'Option New', perTryout: 2, perLatsol: 1, siadu: '3397', kelompok: 'Perbankan dan Pembiayaan' },
  { id: 'fintech', subtes: 'sjk', nama: 'Fintech', bentuk: 'Option New', perTryout: 3, perLatsol: 1, siadu: '3398', kelompok: 'Perbankan dan Pembiayaan' },
  { id: 'asuransi', subtes: 'sjk', nama: 'Asuransi', bentuk: 'Option New', perTryout: 4, perLatsol: 2, siadu: '3399', kelompok: 'Investasi dan Proteksi' },
  { id: 'dana-pensiun', subtes: 'sjk', nama: 'Dana Pensiun', bentuk: 'Option New', perTryout: 2, perLatsol: 1, siadu: '3400', kelompok: 'Investasi dan Proteksi' },
  { id: 'pasar-modal', subtes: 'sjk', nama: 'Pasar Modal', bentuk: 'Option New', perTryout: 6, perLatsol: 3, siadu: '3401', kelompok: 'Investasi dan Proteksi' },
  { id: 'bulion', subtes: 'sjk', nama: 'Bulion', bentuk: 'Option New', perTryout: 1, perLatsol: 1, siadu: '3402', kelompok: 'Investasi dan Proteksi' },
  { id: 'aset-kripto', subtes: 'sjk', nama: 'Aset Kripto', bentuk: 'Option New', perTryout: 2, perLatsol: 1, siadu: '3403', kelompok: 'Investasi dan Proteksi' },
  { id: 'keuangan-syariah', subtes: 'sjk', nama: 'Keuangan Syariah', bentuk: 'Option New', perTryout: 4, perLatsol: 2, siadu: '3404', kelompok: 'Investasi dan Proteksi' },
] as BarisMapping[]).map(lengkapi);

/** Subtes yang kuotanya belum dirinci per chapter di Mapping (kosong: PSJK kini punya 16 chapter). */
export const TARGET_TANPA_CHAPTER: { subtes: Chapter['subtes']; perTryout: number; perLatsol: number; catatan: string }[] = [];

export const JUMLAH_TRYOUT = 10;
export const JUMLAH_LATSOL = 5;

export const chapterById = (id: string) => {
  const c = CHAPTERS.find((x) => x.id === id);
  if (!c) throw new Error(`Chapter tidak dikenal: ${id}`);
  return c;
};

export const NAMA_SUBTES: Record<Chapter['subtes'], string> = {
  induktif: 'Tes Penalaran Induktif',
  deduktif: 'Tes Penalaran Deduktif',
  'bahasa-inggris': 'Tes Bahasa Inggris',
  sjk: 'Tes Pengetahuan Sektor Jasa Keuangan',
};
