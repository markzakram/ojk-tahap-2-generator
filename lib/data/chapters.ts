import type { Chapter } from '../core/types';

// Sumber: Mapping Tahap 2 PCAM OJK 2026, sheet "PCAM 10 OJK" (salinan: bahan/Mapping Tahap 2 - PCAM 10 OJK.csv).
// `perTryout` = kolom Distribusi Tryout (jumlah soal per tryout), `perLatsol` = kolom Distribusi Latsol.
export interface ChapterMapping extends Chapter {
  perTryout: number;
  perLatsol: number;
  siadu?: string;
  /** Keterangan bila chapter belum punya family (mis. blueprint belum ada). */
  catatan?: string;
}

export const CHAPTERS: ChapterMapping[] = [
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
  { id: 'badges', subtes: 'deduktif', nama: 'Badges', bentuk: 'Logical Ranking', perTryout: 3, perLatsol: 10, siadu: '3309', catatan: 'Belum ada blueprint' },
  { id: 'timeslot-scheduling', subtes: 'deduktif', nama: 'Timeslot Scheduling', bentuk: 'Timeslot Scheduling', perTryout: 2, perLatsol: 10, siadu: '3412' },
  // Tes Bahasa Inggris — 12 soal, 15 menit (urutan chapter tetap, soal diacak, kecuali Reading)
  { id: 'sentence-completion', subtes: 'bahasa-inggris', nama: 'Sentence Completion - 4 Option', bentuk: 'Option New', perTryout: 4, perLatsol: 3, siadu: '3405', catatan: 'Menyusul' },
  { id: 'sentence-improvement', subtes: 'bahasa-inggris', nama: 'Sentence Improvement', bentuk: 'Option New', perTryout: 2, perLatsol: 2, siadu: '3406', catatan: 'Menyusul' },
  { id: 'grammatically-correct-sentence', subtes: 'bahasa-inggris', nama: 'Grammatically Correct Sentence', bentuk: 'Option New', perTryout: 1, perLatsol: 1, siadu: '3407', catatan: 'Menyusul' },
  { id: 'sentence-arrangement', subtes: 'bahasa-inggris', nama: 'Sentence Arrangement - 4 Option', bentuk: 'Option New', perTryout: 1, perLatsol: 1, siadu: '3408', catatan: 'Menyusul' },
  { id: 'reading-comprehension', subtes: 'bahasa-inggris', nama: 'Reading Comprehension - 4 Option', bentuk: 'Option New', perTryout: 4, perLatsol: 3, siadu: '3220', catatan: 'Belum ada blueprint' },
];

/**
 * Subtes yang kuotanya belum dirinci per chapter di salinan Mapping lokal.
 * Pengetahuan Sektor Jasa Keuangan: 50 soal per tryout (Mapping); 30 per latsol adalah sisa target 550 soal latsol
 * setelah tiga subtes lain (Mapping: 1.440 = 890 tryout + 550 latsol). Cek ulang di sheet asli sebelum dipakai.
 */
export const TARGET_TANPA_CHAPTER: { subtes: Chapter['subtes']; perTryout: number; perLatsol: number; catatan: string }[] = [
  { subtes: 'sjk', perTryout: 50, perLatsol: 30, catatan: 'Belum ada blueprint' },
];

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
