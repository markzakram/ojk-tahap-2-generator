import type { Tingkat } from '../model';
import { buatFamily, tetap, varian, type KerangkaGcs } from './kerangka';
import type { KasusPronomina } from './leksikon';
import type { Unsur } from './tipe';

// Blueprint §5 (pronoun, perluasan) dan §7 (Pronoun 8-1, 8-4); Materi §3. Dua pronoun dalam satu kalimat dengan rujukan
// yang jelas; setiap titik punya bentuk benar dan dua bentuk yang jelas salah untuk posisinya (kasus subject/object/
// possessive adjective/possessive pronoun/reflexive, atau bentuk tak baku it's, theirselves). 3 × 3 kombinasi.
// Bentuk yang sah pada makna lain dihindari (mis. "send us weekly reports" sah sebagai ditransitive, "to hers" sah sebagai
// possessive pronoun), sehingga setiap pengecoh salah pada posisinya, bukan sekadar bermakna lain.

interface TitikPron { fungsi: KasusPronomina; posisi: string; pemicu: string; bentuk: [string, string, string] }

interface SpekPron {
  id: string;
  tingkat: Tingkat;
  konteks: string;
  /** `{0}`, `{1}` = titik pronoun. */
  templat: string;
  titik: TitikPron[];
}

const SPEK: SpekPron[] = [
  { id: 'coordinator-reports', tingkat: 'dasar', konteks: 'kantor & proyek', templat: 'The coordinator asked {0} to send {1} weekly reports to her before Friday', titik: [
    { fungsi: 'objek', posisi: 'objek asked', pemicu: 'asked', bentuk: ['us', 'we', 'our'] },
    { fungsi: 'penentu', posisi: 'penentu sebelum weekly reports', pemicu: 'weekly reports', bentuk: ['our', 'ours', 'we'] },
  ] },
  { id: 'company-website', tingkat: 'dasar', konteks: 'teknologi', templat: 'The company updated {0} website and sent the new login details to {1} by email', titik: [
    { fungsi: 'penentu', posisi: 'penentu sebelum website', pemicu: 'website', bentuk: ['its', "it's", 'it'] },
    { fungsi: 'objek', posisi: 'objek preposisi to', pemicu: 'to', bentuk: ['us', 'we', 'our'] },
  ] },
  { id: 'students-materials', tingkat: 'dasar', konteks: 'pendidikan & pelatihan', templat: 'The students prepared the materials {0} and asked {1} teacher to check the final drafts', titik: [
    { fungsi: 'refleksif', posisi: 'reflexive pronoun yang merujuk the students', pemicu: 'the students', bentuk: ['themselves', 'theirselves', 'them'] },
    { fungsi: 'penentu', posisi: 'penentu sebelum teacher', pemicu: 'teacher', bentuk: ['their', 'theirs', 'they'] },
  ] },
  { id: 'colleague-findings', tingkat: 'menengah', konteks: 'riset', templat: 'My colleague and {0} presented our findings, and the director thanked {1} after the session', titik: [
    { fungsi: 'subjek', posisi: 'bagian subjek setelah my colleague and', pemicu: 'my colleague and', bentuk: ['I', 'me', 'my'] },
    { fungsi: 'objek', posisi: 'objek thanked', pemicu: 'thanked', bentuk: ['us', 'we', 'our'] },
  ] },
  { id: 'decision-ours', tingkat: 'menengah', konteks: 'kebijakan & kepatuhan', templat: 'The final decision is {0}, so the director asked {1} to present it to her team', titik: [
    { fungsi: 'milik', posisi: 'pelengkap setelah is tanpa noun', pemicu: 'is', bentuk: ['ours', 'our', 'ourselves'] },
    { fungsi: 'objek', posisi: 'objek asked', pemicu: 'asked', bentuk: ['us', 'we', 'our'] },
  ] },
  { id: 'customer-ticket', tingkat: 'menengah', konteks: 'layanan pelanggan', templat: 'The customer told us that {0} had lost {1} ticket and needed help at the counter', titik: [
    { fungsi: 'subjek', posisi: 'subjek klausa that sebelum had lost', pemicu: 'that ... had lost', bentuk: ['he', 'him', 'his'] },
    { fungsi: 'penentu', posisi: 'penentu sebelum ticket', pemicu: 'ticket', bentuk: ['his', 'him', 'he'] },
  ] },
];

function wujud(s: SpekPron): KerangkaGcs {
  const pola: (Unsur | number)[] = s.templat.split(/(\{\d\})/).filter((x) => x.trim()).map((x) => (/^\{\d\}$/.test(x) ? Number(x[1]) : tetap(x.trim())));
  const titik = s.titik.map((t) => t.bentuk.map((b, i) => varian([{ teks: b, peran: 'pronomina', fungsi: t.fungsi, posisi: t.posisi, pemicu: t.pemicu }], i === 0 ? 0 : 1)));
  return {
    id: `pron-${s.id}`,
    sasaran: s.titik.map((t) => t.fungsi).join('+'),
    tingkat: s.tingkat,
    konteks: s.konteks,
    kaidah: 'pronoun-case',
    konsep: 'Bentuk pronoun (subject, object, possessive, reflexive)',
    klausa: [],
    pola,
    titik,
    uji: titik.map((_, i) => `pronomina:${i}`),
  };
}

export const KERANGKA_PRONOMINA: KerangkaGcs[][] = SPEK.map((s) => [wujud(s)]);

export const gcsPronomina = buatFamily({
  id: 'GCS-PRONOMINA',
  nama: 'Bentuk pronoun',
  label: 'VARIASI',
  sumber: 'Blueprint Bahasa Inggris §5 (pronoun, perluasan), §7 Pronoun · Materi §3 · Azar 8-1, 8-4',
  ringkas: 'Dua pronoun dalam satu kalimat dengan rujukan jelas (objek verb/preposisi, penentu sebelum noun, subjek, possessive pronoun berdiri sendiri, reflexive). Penilai menentukan kasus yang diminta posisi dan mencocokkannya dengan tabel bentuk baku.',
  kelompok: KERANGKA_PRONOMINA,
  caraCepat: (rel) => `Tentukan fungsi tiap pronoun dari kata di sekitarnya, lalu pilih bentuknya: ${rel.map((r) => r.ringkas).join('; ')}.`,
});
