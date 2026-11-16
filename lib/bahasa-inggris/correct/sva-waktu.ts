import type { Tingkat } from '../model';
import { buatFamily, tetap, titikPrep, varian, type KerangkaGcs } from './kerangka';
import { verba, type Jumlah } from './leksikon';
import type { Unsur, UnsurSubjek } from './tipe';

// Blueprint Bahasa Inggris §5 "Contoh Correct Sentence — agreement dan preposisi waktu" (pola teramati): subjek yang
// dipisahkan modifier atau diawali ungkapan jumlah + preposisi on/in/at sebelum keterangan waktu. Dua titik uji:
// bentuk verb finit (agreement) × preposisi waktu → 6 kombinasi; kunci + 4 dari 5 kombinasi salah.

export interface Waktu { teks: string; prep: 'on' | 'in' | 'at'; jenis: string; ekor?: string }
export const hari = (teks: string, ekor?: string): Waktu => ({ teks, prep: 'on', jenis: 'hari', ekor });
export const hariBagian = (teks: string, ekor?: string): Waktu => ({ teks, prep: 'on', jenis: 'hari-bagian', ekor });
export const tanggal = (teks: string, ekor?: string): Waktu => ({ teks, prep: 'on', jenis: 'tanggal', ekor });
export const bulan = (teks: string, ekor?: string): Waktu => ({ teks, prep: 'in', jenis: 'bulan', ekor });
export const bulanTahun = (teks: string, ekor?: string): Waktu => ({ teks, prep: 'in', jenis: 'bulan-tahun', ekor });
export const tahun = (teks: string, ekor?: string): Waktu => ({ teks, prep: 'in', jenis: 'tahun', ekor });
export const jam = (teks: string, ekor?: string): Waktu => ({ teks, prep: 'at', jenis: 'jam', ekor });
export const bagian = (teks: string, ekor?: string): Waktu => ({ teks, prep: 'in', jenis: 'bagian', ekor });

type VerbaSpek =
  | { jenis: 'pasif'; kala: 'kini' | 'lampau'; lema: string }
  | { jenis: 'kopula'; kala: 'kini' | 'lampau'; pelengkap: string }
  | { jenis: 'leksikal'; lema: string };

interface SpekSva {
  id: string;
  tingkat: Tingkat;
  konteks: string;
  /** `jumlah` = pernyataan penulis tentang subjek; penilai menurunkannya sendiri dari kata inti dan ungkapan jumlah. */
  subjek: { teks: string; inti: string; penentu?: string; pewatas?: string; jumlah: Jumlah };
  verba: VerbaSpek;
  /** Teks tetap antara rangkaian verb dan preposisi waktu. */
  sela?: string;
  waktu: Waktu[];
  ekor?: string;
}

const BE = { kini: { tunggal: 'is', jamak: 'are' }, lampau: { tunggal: 'was', jamak: 'were' } } as const;

function finit(v: VerbaSpek, jumlah: Jumlah): [string, string] {
  const lawan: Jumlah = jumlah === 'tunggal' ? 'jamak' : 'tunggal';
  if (v.jenis === 'leksikal') { const e = verba(v.lema)!; return jumlah === 'tunggal' ? [e.s, e.lema] : [e.lema, e.s]; }
  return [BE[v.kala][jumlah], BE[v.kala][lawan]];
}

const SPEK: SpekSva[] = [
  // — Menengah: inti subjek dipisahkan modifier (frasa preposisi/participle) yang memuat noun berjumlah lain —
  { id: 'cabinet', tingkat: 'menengah', konteks: 'laporan & data', // contoh blueprint §5 (uji emas)
    subjek: { teks: 'The reports stored in the cabinet', inti: 'reports', pewatas: 'stored in the cabinet', jumlah: 'jamak' },
    verba: { jenis: 'pasif', kala: 'lampau', lema: 'review' },
    waktu: [hari('Monday'), tanggal('14 March'), bulan('June'), tahun('2025'), jam('9 a.m.')] },
  { id: 'feedback-forms', tingkat: 'menengah', konteks: 'pendidikan & pelatihan',
    subjek: { teks: 'The feedback forms from the first training session', inti: 'forms', pewatas: 'from the first training session', jumlah: 'jamak' },
    verba: { jenis: 'pasif', kala: 'lampau', lema: 'collect' },
    waktu: [hariBagian('Friday afternoon'), tanggal('3 June'), jam('4 p.m.'), bagian('the afternoon')] },
  { id: 'supplier-list', tingkat: 'menengah', konteks: 'kantor & proyek',
    subjek: { teks: 'The list of approved suppliers', inti: 'list', pewatas: 'of approved suppliers', jumlah: 'tunggal' },
    verba: { jenis: 'pasif', kala: 'lampau', lema: 'update' },
    waktu: [hari('Wednesday'), bulan('March'), tahun('2025'), tanggal('3 June')], ekor: 'by the procurement team' },
  { id: 'module-schedule', tingkat: 'menengah', konteks: 'pendidikan & pelatihan',
    subjek: { teks: 'The schedule for the new online modules', inti: 'schedule', pewatas: 'for the new online modules', jumlah: 'tunggal' },
    verba: { jenis: 'pasif', kala: 'lampau', lema: 'announce' },
    waktu: [hari('Thursday'), tanggal('21 September'), jam('noon'), bulan('September')] },
  { id: 'volunteer-workshop', tingkat: 'menengah', konteks: 'kegiatan masyarakat',
    subjek: { teks: 'The first workshop for new volunteers', inti: 'workshop', pewatas: 'for new volunteers', jumlah: 'tunggal' },
    verba: { jenis: 'leksikal', lema: 'start' },
    waktu: [jam('9 a.m.'), hari('Monday'), tanggal('14 March')], ekor: 'in the community hall' },
  { id: 'water-quality', tingkat: 'menengah', konteks: 'lingkungan & energi',
    subjek: { teks: 'The quality of the water samples', inti: 'quality', pewatas: 'of the water samples', jumlah: 'tunggal' },
    verba: { jenis: 'pasif', kala: 'kini', lema: 'check' },
    waktu: [jam('8 a.m.', 'every day'), bagian('the morning', 'every day'), hari('Mondays', 'and Thursdays')] },
  { id: 'survey-results', tingkat: 'menengah', konteks: 'layanan pelanggan',
    subjek: { teks: 'The results of the customer survey', inti: 'results', pewatas: 'of the customer survey', jumlah: 'jamak' },
    verba: { jenis: 'pasif', kala: 'lampau', lema: 'publish' },
    waktu: [bulan('June'), tahun('2025')], ekor: 'on the company website' },
  { id: 'meeting-printer', tingkat: 'menengah', konteks: 'teknologi',
    subjek: { teks: 'The new printer for the meeting rooms', inti: 'printer', pewatas: 'for the meeting rooms', jumlah: 'tunggal' },
    verba: { jenis: 'pasif', kala: 'lampau', lema: 'install' },
    waktu: [hariBagian('Tuesday morning'), jam('noon'), tanggal('3 June'), bulan('March')] },
  { id: 'branch-reports', tingkat: 'menengah', konteks: 'ekonomi umum',
    subjek: { teks: 'The monthly sales reports from each regional branch', inti: 'reports', pewatas: 'from each regional branch', jumlah: 'jamak' },
    verba: { jenis: 'kopula', kala: 'kini', pelengkap: 'due' },
    waktu: [hari('Friday'), jam('noon'), tanggal('30 June')] },
  { id: 'donated-laptops', tingkat: 'menengah', konteks: 'pendidikan & pelatihan',
    subjek: { teks: 'The laptops donated by a local company', inti: 'laptops', pewatas: 'donated by a local company', jumlah: 'jamak' },
    verba: { jenis: 'pasif', kala: 'lampau', lema: 'deliver' }, sela: 'to the school',
    waktu: [bulan('September'), tahun('2024'), hari('Thursday'), tanggal('21 September')] },

  // — Menantang: ungkapan jumlah (each of, one of, the number of, a number of, every, most of, half of) atau relative clause —
  { id: 'each-employee', tingkat: 'menantang', konteks: 'kantor & proyek',
    subjek: { teks: 'Each of the new employees', inti: 'employees', penentu: 'Each of the', jumlah: 'tunggal' },
    verba: { jenis: 'pasif', kala: 'lampau', lema: 'introduce' }, sela: 'to the department heads',
    waktu: [hari('Monday'), tanggal('3 June'), jam('9 a.m.'), bagian('the morning')] },
  { id: 'one-laptop', tingkat: 'menantang', konteks: 'teknologi',
    subjek: { teks: 'One of the laptops in the training room', inti: 'laptops', penentu: 'One of the', pewatas: 'in the training room', jumlah: 'tunggal' },
    verba: { jenis: 'pasif', kala: 'lampau', lema: 'repair' },
    waktu: [hariBagian('Thursday afternoon'), jam('2 p.m.'), tanggal('21 September'), bulan('March')] },
  { id: 'number-complaints', tingkat: 'menantang', konteks: 'layanan pelanggan',
    subjek: { teks: 'The number of complaints received by the help desk', inti: 'complaints', penentu: 'The number of', pewatas: 'received by the help desk', jumlah: 'tunggal' },
    verba: { jenis: 'kopula', kala: 'lampau', pelengkap: 'unusually high' },
    waktu: [bulan('March'), tahun('2025'), hari('Monday'), bagian('the afternoon')] },
  { id: 'number-residents', tingkat: 'menantang', konteks: 'kegiatan masyarakat',
    subjek: { teks: 'A number of residents from the northern district', inti: 'residents', penentu: 'A number of', pewatas: 'from the northern district', jumlah: 'jamak' },
    verba: { jenis: 'pasif', kala: 'lampau', lema: 'interview' },
    waktu: [hari('Saturday'), tanggal('12 May'), bulan('May'), jam('10 a.m.')] },
  { id: 'printer-technician', tingkat: 'menantang', konteks: 'teknologi',
    subjek: { teks: 'The technician who repairs the office printers', inti: 'technician', pewatas: 'who repairs the office printers', jumlah: 'tunggal' },
    verba: { jenis: 'kopula', kala: 'kini', pelengkap: 'available' },
    waktu: [hari('Wednesdays'), bagian('the afternoon'), jam('10 a.m.')] },
  { id: 'lab-equipment', tingkat: 'menantang', konteks: 'riset',
    subjek: { teks: 'Most of the equipment in the new laboratories', inti: 'equipment', penentu: 'Most of the', pewatas: 'in the new laboratories', jumlah: 'tunggal' },
    verba: { jenis: 'pasif', kala: 'lampau', lema: 'deliver' },
    waktu: [bulan('September'), tahun('2025'), tanggal('21 September'), hari('Tuesday')] },
  { id: 'every-invoice', tingkat: 'menantang', konteks: 'kantor & proyek',
    subjek: { teks: 'Every invoice sent by the two suppliers', inti: 'invoice', penentu: 'Every', pewatas: 'sent by the two suppliers', jumlah: 'tunggal' },
    verba: { jenis: 'pasif', kala: 'lampau', lema: 'check' },
    waktu: [tanggal('14 March'), hari('Friday'), bulan('March'), jam('3 p.m.')] },
  { id: 'half-trainees', tingkat: 'menantang', konteks: 'pendidikan & pelatihan',
    subjek: { teks: 'Half of the trainees in each group', inti: 'trainees', penentu: 'Half of the', pewatas: 'in each group', jumlah: 'jamak' },
    verba: { jenis: 'kopula', kala: 'lampau', pelengkap: 'absent' },
    waktu: [hariBagian('Monday morning'), bagian('the afternoon'), tanggal('12 May')] },
  { id: 'candidate-list', tingkat: 'menantang', konteks: 'pendidikan & pelatihan',
    subjek: { teks: 'The list of candidates who passed the written tests', inti: 'list', pewatas: 'of candidates who passed the written tests', jumlah: 'tunggal' },
    verba: { jenis: 'pasif', kala: 'lampau', lema: 'announce' },
    waktu: [jam('4 p.m.'), hari('Friday'), tanggal('3 June')] },
];

function wujud(s: SpekSva, w: Waktu): KerangkaGcs {
  const subjek: UnsurSubjek = { teks: s.subjek.teks, peran: 'subjek', klausa: 'u', inti: s.subjek.inti };
  if (s.subjek.penentu) subjek.penentu = s.subjek.penentu;
  if (s.subjek.pewatas) subjek.pewatas = s.subjek.pewatas;
  const vb = (teks: string): Unsur => ({ teks, peran: 'verba', klausa: 'u' });
  const [benar, salah] = finit(s.verba, s.subjek.jumlah);
  const lema = s.verba.jenis === 'kopula' ? 'be' : s.verba.lema;
  const pola: (Unsur | number)[] = [subjek, 0];
  if (s.verba.jenis === 'pasif') pola.push(vb(verba(lema)!.v3));
  if (s.verba.jenis === 'kopula') pola.push(tetap(s.verba.pelengkap));
  if (s.sela) pola.push(tetap(s.sela));
  pola.push(1, { teks: w.teks, peran: 'ket-waktu' });
  const ekor = w.ekor ?? s.ekor;
  if (ekor) pola.push(tetap(ekor));
  return {
    id: `sva-waktu-${s.id}`,
    sasaran: w.jenis,
    tingkat: s.tingkat,
    konteks: s.konteks,
    kaidah: 'agreement-preposisi-waktu',
    konsep: 'Subject-verb agreement dan preposisi waktu',
    klausa: [{ id: 'u', jenis: 'utama', lema, peran: s.verba.jenis === 'pasif' ? 'penerima' : 'pelaku' }],
    pola,
    titik: [[varian([vb(benar)], 0), varian([vb(salah)], 1)], titikPrep(w.prep)],
    uji: ['setuju:u', 'waktu:0'],
  };
}

export const KERANGKA_SVA_WAKTU: KerangkaGcs[][] = SPEK.map((s) => s.waktu.map((w) => wujud(s, w)));

export const gcsSvaWaktu = buatFamily({
  id: 'GCS-SVA-WAKTU',
  nama: 'Agreement dan preposisi waktu',
  label: 'SHL',
  sumber: 'Blueprint Bahasa Inggris §5 (contoh agreement + preposisi waktu, teramati), §7 Agreement, §9 · Materi §4 dan §9 · Azar 5-2, 5-4, 5-5',
  ringkas: 'Lima kalimat dari satu kerangka: inti subjek dipisahkan modifier atau diawali ungkapan jumlah (each of, the number of, a number of, most of, ...) dan keterangan waktu (hari, tanggal, bulan, tahun, jam). Titik uji: bentuk verb finit × on/in/at; hanya satu kalimat benar pada kedua titik.',
  kelompok: KERANGKA_SVA_WAKTU,
  caraCepat: (rel, item) => {
    const s = rel.find((r) => r.jenis === 'setuju');
    const w = rel.find((r) => r.jenis === 'waktu');
    const subj = item.data.opsi[0].unsur.find((u): u is UnsurSubjek => u.peran === 'subjek');
    const awal = subj?.penentu
      ? `Tentukan jumlah subjek dari ungkapan ${subj.penentu.toLowerCase()} di awal`
      : `Coret sementara ${subj?.pewatas ?? 'keterangan setelah subjek'}`;
    return `${awal}, lalu cek dua titik secara terpisah: ${s?.ringkas} dan ${w?.ringkas}.`;
  },
});
