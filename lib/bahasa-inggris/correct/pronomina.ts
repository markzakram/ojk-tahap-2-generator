import type { Tingkat } from '../model';
import { buatFamily, tetap, varian, type KerangkaGcs } from './kerangka';
import type { KasusPronomina } from './leksikon';
import type { Unsur } from './tipe';

// Blueprint §5 (pronoun, perluasan) dan §7 (Pronoun 8-1, 8-4); Materi §3. Dua pronoun dalam satu kalimat dengan rujukan
// yang jelas. Pengecoh diambil dari kesalahan yang lazim dibuat pembelajar, bukan bentuk yang mustahil dipakai siapa pun:
// I/me/myself pada frasa majemuk (my colleague and I, between you and me), it's/its, who's/whose, they're/their,
// ours/our's, theirs/their's, hers/her's, possessive pronoun sebelum noun (ours results), theirselves/hisself,
// who/whom pada posisi subjek, dan we/us sebelum noun (we new employees).
// Bentuk yang sah pada makna lain dihindari, dan pengecoh tidak pernah salah persona (themselves untuk we), karena penilai
// memeriksa kasus pronoun, bukan kecocokan persona.
//
// Penulisan bentuk: "[x]" menandai pronoun di dalam varian yang membawa kata tetap (mis. "[Me] and my colleague"), sehingga
// urutan kata dalam frasa majemuk ikut menjadi varian. Bentuk tanpa kurung seluruhnya pronoun.

interface TitikPron { fungsi: KasusPronomina; posisi: string; pemicu: string; bentuk: string[] }

interface SpekPron {
  id: string;
  tingkat: Tingkat;
  konteks: string;
  /** `{0}`, `{1}` = titik pronoun (dua titik: dengan tiga titik kunci hampir selalu menjadi kalimat paling mirip dengan semua kalimat lain). */
  templat: string;
  titik: TitikPron[];
}

const SUBJ_COLLEAGUE = ['My colleague and [I]', 'My colleague and [me]', '[Me] and my colleague'];
const OBJ_AKU = ['me', 'I', 'myself'];

const SPEK: SpekPron[] = [
  { id: 'colleague-results', tingkat: 'dasar', konteks: 'riset', templat: '{0} presented {1} results to the director and her team', titik: [
    { fungsi: 'subjek', posisi: 'bagian subjek majemuk bersama my colleague', pemicu: 'my colleague and', bentuk: SUBJ_COLLEAGUE },
    { fungsi: 'penentu', posisi: 'penentu sebelum results', pemicu: 'results', bentuk: ['our', 'ours', "our's"] },
  ] },
  { id: 'between-records', tingkat: 'menengah', konteks: 'kantor & proyek', templat: 'The manager wants the news to stay between you and {0} until the company has updated {1} records', titik: [
    { fungsi: 'objek', posisi: 'objek preposisi between (you and …)', pemicu: 'between you and', bentuk: OBJ_AKU },
    { fungsi: 'penentu', posisi: 'penentu sebelum records', pemicu: 'records', bentuk: ['its', "it's"] },
  ] },
  { id: 'client-account', tingkat: 'menengah', konteks: 'layanan pelanggan', templat: 'The client {0} account was closed last week has asked us to explain {1} decision in writing', titik: [
    { fungsi: 'penentu', posisi: 'pronoun relatif kepemilikan sebelum account', pemicu: 'account', bentuk: ['whose', "who's", 'who'] },
    { fungsi: 'penentu', posisi: 'penentu sebelum decision', pemicu: 'decision', bentuk: ['our', 'ours'] },
  ] },
  { id: 'teams-ours', tingkat: 'dasar', konteks: 'kantor & proyek', templat: "The other two teams have finished {0} reports, but {1} is still waiting for the manager's approval", titik: [
    { fungsi: 'penentu', posisi: 'penentu sebelum reports', pemicu: 'reports', bentuk: ['their', "they're", 'theirs'] },
    { fungsi: 'milik', posisi: 'subjek tanpa noun (laporan kami) sebelum is', pemicu: 'is', bentuk: ['ours', "our's", 'our'] },
  ] },
  { id: 'technician-printer', tingkat: 'dasar', konteks: 'teknologi', templat: 'The new technician repaired the printer {0} and then showed my colleague and {1} how to change the toner', titik: [
    { fungsi: 'refleksif', posisi: 'reflexive pronoun yang merujuk the new technician', pemicu: 'the new technician', bentuk: ['himself', 'hisself'] },
    { fungsi: 'objek', posisi: 'bagian objek majemuk showed my colleague and …', pemicu: 'showed my colleague and', bentuk: OBJ_AKU },
  ] },
  { id: 'volunteers-who', tingkat: 'menengah', konteks: 'kegiatan masyarakat', templat: 'The volunteers {0} organised the festival set up the stalls {1} before the guests arrived', titik: [
    { fungsi: 'subjek', posisi: 'pronoun relatif sebagai subjek organised', pemicu: 'organised', bentuk: ['who', 'whom'] },
    { fungsi: 'refleksif', posisi: 'reflexive pronoun yang merujuk the volunteers', pemicu: 'the volunteers', bentuk: ['themselves', 'theirselves', 'themself'] },
  ] },
  { id: 'we-employees', tingkat: 'menengah', konteks: 'pendidikan & pelatihan', templat: '{0} new employees were asked to bring {1} own laptops to the first training session', titik: [
    { fungsi: 'subjek', posisi: 'subjek sebelum new employees', pemicu: 'new employees were asked', bentuk: ['We', 'Us'] },
    { fungsi: 'penentu', posisi: 'penentu sebelum own laptops', pemicu: 'own laptops', bentuk: ['our', 'ours', "our's"] },
  ] },
  { id: 'officer-told', tingkat: 'menengah', konteks: 'kebijakan & kepatuhan', templat: 'The officer {0} checked the documents told my manager and {1} that one form was missing', titik: [
    { fungsi: 'subjek', posisi: 'pronoun relatif sebagai subjek checked', pemicu: 'checked', bentuk: ['who', 'whom'] },
    { fungsi: 'objek', posisi: 'bagian objek majemuk told my manager and …', pemicu: 'told my manager and', bentuk: OBJ_AKU },
  ] },
  { id: 'company-website', tingkat: 'dasar', konteks: 'teknologi', templat: 'The company has updated {0} website, so customers can now check {1} orders online', titik: [
    { fungsi: 'penentu', posisi: 'penentu sebelum website', pemicu: 'website', bentuk: ['its', "it's"] },
    { fungsi: 'penentu', posisi: 'penentu sebelum orders', pemicu: 'orders', bentuk: ['their', "they're", 'theirs'] },
  ] },
  { id: 'supervisor-folder', tingkat: 'dasar', konteks: 'kantor & proyek', templat: 'The supervisor said that the blue folder is {0}, but the files inside it belong to {1} assistant', titik: [
    { fungsi: 'milik', posisi: 'pelengkap setelah is tanpa noun', pemicu: 'is', bentuk: ['hers', "her's", 'her'] },
    { fungsi: 'penentu', posisi: 'penentu sebelum assistant', pemicu: 'assistant', bentuk: ['her', 'hers'] },
  ] },
  { id: 'office-theirs', tingkat: 'menengah', konteks: 'kantor & proyek', templat: 'Our office has already moved to the new building, but our colleagues in sales say {0} will move after {1} manager returns', titik: [
    { fungsi: 'milik', posisi: 'subjek tanpa noun (kantor mereka) sebelum will move', pemicu: 'will move', bentuk: ['theirs', "their's", 'their'] },
    { fungsi: 'penentu', posisi: 'penentu sebelum manager', pemicu: 'manager', bentuk: ['their', "they're"] },
  ] },
  { id: 'trainees-whose', tingkat: 'menengah', konteks: 'pendidikan & pelatihan', templat: 'The trainees {0} names are on the list should collect {1} badges from the front desk', titik: [
    { fungsi: 'penentu', posisi: 'pronoun relatif kepemilikan sebelum names', pemicu: 'names', bentuk: ['whose', "who's", 'who'] },
    { fungsi: 'penentu', posisi: 'penentu sebelum badges', pemicu: 'badges', bentuk: ['their', 'theirs', "they're"] },
  ] },
  // Kontraksi sebagai kunci (uji buta putaran 2: semua bentuk beraposfrof selalu salah sehingga "coret yang beraposfrof"
  // tidak pernah gagal). It's/they're/who's benar pada posisi pronoun + is/are; its/their/whose/there menjadi pengecoh.
  { id: 'interns-ready', tingkat: 'dasar', konteks: 'pendidikan & pelatihan', templat: 'The new interns say {0} ready to start, but {1} laptops have not been set up yet', titik: [
    { fungsi: 'kontraksi', posisi: 'subjek + are sebelum ready (they are)', pemicu: 'ready', bentuk: ["they're", 'their', 'there'] },
    { fungsi: 'penentu', posisi: 'penentu sebelum laptops', pemicu: 'laptops', bentuk: ['their', "they're", 'there'] },
  ] },
  { id: 'director-time', tingkat: 'menengah', konteks: 'kegiatan masyarakat', templat: 'The director says {0} time to thank the volunteers {1} work made the festival possible', titik: [
    { fungsi: 'kontraksi', posisi: 'subjek + is sebelum time (it is)', pemicu: 'time', bentuk: ["it's", 'its'] },
    { fungsi: 'penentu', posisi: 'pronoun relatif kepemilikan sebelum work', pemicu: 'work', bentuk: ['whose', "who's", 'who'] },
  ] },
  { id: 'engineer-leading', tingkat: 'menengah', konteks: 'kantor & proyek', templat: 'The engineer {0} leading the project has asked the suppliers to send {1} prices by Friday', titik: [
    { fungsi: 'kontraksi', posisi: 'pronoun relatif + is sebelum leading (who is)', pemicu: 'leading', bentuk: ["who's", 'whose'] },
    { fungsi: 'penentu', posisi: 'penentu sebelum prices', pemicu: 'prices', bentuk: ['their', "they're", 'there'] },
  ] },
  { id: 'neighbours-moving', tingkat: 'dasar', konteks: 'kegiatan masyarakat', templat: 'Our neighbours told us {0} moving next month, so {1} house will be for sale soon', titik: [
    { fungsi: 'kontraksi', posisi: 'subjek + are sebelum moving (they are)', pemicu: 'moving', bentuk: ["they're", 'their', 'there'] },
    { fungsi: 'penentu', posisi: 'penentu sebelum house', pemicu: 'house', bentuk: ['their', "they're", 'there'] },
  ] },
  { id: 'manager-and-i', tingkat: 'dasar', konteks: 'kebijakan & kepatuhan', templat: 'My manager and {0} reviewed the plan, and the board approved {1} final version on Friday', titik: [
    { fungsi: 'subjek', posisi: 'bagian subjek majemuk bersama my manager', pemicu: 'my manager and', bentuk: ['I', 'me', 'myself'] },
    { fungsi: 'penentu', posisi: 'penentu sebelum final version', pemicu: 'final version', bentuk: ['its', "it's"] },
  ] },
];

/** Unsur satu varian: teks di luar "[...]" menjadi bagian tetap, isi kurung (atau seluruh teks) menjadi pronoun. */
function unsurVarian(t: TitikPron, bentuk: string): Unsur[] {
  const m = bentuk.match(/^(.*?)\[([^\]]+)\](.*)$/);
  const [depan, inti, belakang] = m ? [m[1].trim(), m[2], m[3].trim()] : ['', bentuk, ''];
  return [
    ...(depan ? [tetap(depan)] : []),
    { teks: inti, peran: 'pronomina', fungsi: t.fungsi, posisi: t.posisi, pemicu: t.pemicu },
    ...(belakang ? [tetap(belakang)] : []),
  ];
}

function wujud(s: SpekPron): KerangkaGcs {
  const pola: (Unsur | number)[] = s.templat.split(/(\{\d\})/).filter((x) => x.trim()).map((x) => (/^\{\d\}$/.test(x) ? Number(x[1]) : tetap(x.trim())));
  const titik = s.titik.map((t) => t.bentuk.map((b, i) => varian(unsurVarian(t, b), i === 0 ? 0 : 1)));
  return {
    id: `pron-${s.id}`,
    sasaran: s.titik.map((t) => t.fungsi).join('+'),
    tingkat: s.tingkat,
    konteks: s.konteks,
    kaidah: 'pronoun-case',
    konsep: 'Bentuk pronoun (subject, object, possessive, reflexive, relative)',
    klausa: [],
    pola,
    titik,
    uji: titik.map((_, i) => `pronomina:${i}`),
  };
}

export const KERANGKA_PRONOMINA: KerangkaGcs[][] = SPEK.map((s) => [wujud(s)]);

export const gcsPronomina = buatFamily({
  id: 'GCS-PRONOMINA',
  versi: 3,
  nama: 'Bentuk pronoun',
  label: 'VARIASI',
  sumber: 'Blueprint Bahasa Inggris §5 (pronoun, perluasan), §7 Pronoun · Materi §3 · Azar 8-1, 8-4',
  ringkas: 'Dua pronoun dalam satu kalimat dengan rujukan jelas. Kontraksi (it\'s, they\'re, who\'s) dapat menjadi kunci pada posisi pronoun + is/are. Pengecoh adalah kesalahan pembelajar yang lazim: my colleague and me/me and my colleague, between you and I, it\'s/its, who\'s/whose, they\'re/their, ours/our\'s, possessive pronoun sebelum noun, theirselves/hisself, whom sebagai subjek, us new employees. Penilai menentukan kasus yang diminta posisi dan mencocokkannya dengan tabel bentuk baku.',
  kelompok: KERANGKA_PRONOMINA,
  caraCepat: (rel) => `Tentukan fungsi tiap pronoun dari kata di sekitarnya (tutup sementara kata lain pada frasa majemuk), lalu pilih bentuknya: ${rel.map((r) => r.ringkas).join('; ')}.`,
});
