import type { Rng } from './rng';

/** Subtes TKU Tahap 2 sesuai Mapping PCAM 10 OJK. */
export type Subtes = 'induktif' | 'deduktif' | 'bahasa-inggris' | 'sjk';

/** Chapter sesuai kolom "Chapter" pada Mapping; `bentuk` = kolom "Bentuk Soal" (nama tipe di SIADU). */
export interface Chapter {
  id: string;
  subtes: Subtes;
  nama: string;
  bentuk: string;
}

/**
 * SHL = mekanisme yang punya contoh pada latihan SHL yang dianalisis blueprint (porsi utama).
 * VARIASI = pengembangan dekat sumber atau hipotesis; tidak boleh diklaim pernah keluar di SHL.
 */
export type Label = 'SHL' | 'VARIASI';

export interface LangkahPembahasan {
  /** Kalimat kesimpulan untuk satu langkah. */
  teks: string;
}

export interface Pembahasan {
  jawaban: string;
  langkah: LangkahPembahasan[];
  caraCepat?: string;
}

/**
 * Family = satu mekanisme soal dari blueprint. Satu family + satu seed = satu soal yang selalu sama.
 *
 * Alur wajib (blueprint Deduktif, "Ketentuan lintas chapter"):
 *   bangun solusi sah → turunkan petunjuk → tulis redaksi → pecahkan ulang hanya dari informasi yang terlihat
 *   peserta dengan solver enumerasi penuh → terbitkan hanya jika jawabannya tepat satu.
 *
 * `I` = isi soal yang dilihat peserta (termasuk kendala terstruktur yang dirender menjadi teks).
 * `A` = bentuk jawaban (himpunan tanggal, alokasi ruangan, dst.).
 */
export interface Family<I = unknown, A = unknown> {
  id: string;
  /** Naikkan setiap kali isi pembangkit berubah, agar seed lama tetap bisa dikenali asal versinya. */
  versi: number;
  nama: string;
  chapter: Chapter;
  label: Label;
  /** Rujukan sumber pada blueprint/SHL (nama berkas dan halaman). */
  sumber: string;
  /** Ringkasan mekanisme untuk ditampilkan di pustaka family. */
  ringkas: string;
  /** Batas percobaan khusus untuk family yang banyak kandidatnya ditolak validator (bawaan: MAKS_PERCOBAAN di engine). */
  maksPercobaan?: number;
  /** Membangun satu kandidat soal beserta jawaban yang dimaksud penyusun. `null` = kandidat ditolak, coba lagi. */
  bangun(r: Rng): { item: I; jawaban: A } | null;
  /** Solver independen: SELURUH jawaban yang memenuhi isi soal. Tidak boleh memakai data internal pembangun. */
  pecahkan(item: I): A[];
  /** Bentuk kanonik jawaban untuk dibandingkan (urutan klik/penempatan tidak berpengaruh). */
  kunci(jawaban: A): string;
  /** Pemeriksaan mutu tambahan khusus family (mis. setiap petunjuk punya fungsi). Kembalikan daftar masalah. */
  periksa?(item: I, jawaban: A): string[];
  /** Pembahasan hanya dari informasi soal. `null` = tidak dapat dijelaskan langkah demi langkah → kandidat ditolak. */
  bahas(item: I, jawaban: A): Pembahasan | null;
  /** Sidik struktur: dua soal yang hanya berbeda nama/konteks harus punya sidik sama. */
  sidik(item: I, jawaban: A): string;
}

export interface Soal<I = unknown, A = unknown> {
  /** `${familyId}@v${versi}:${seed}` — cukup untuk membangkitkan ulang soal yang sama persis. */
  uid: string;
  familyId: string;
  versi: number;
  seed: string;
  /** Percobaan ke berapa yang lolos (kandidat sebelumnya ditolak validator). Deterministik per seed. */
  percobaan: number;
  chapterId: string;
  label: Label;
  item: I;
  jawaban: A;
  kunci: string;
  pembahasan: Pembahasan;
  sidik: string;
}
