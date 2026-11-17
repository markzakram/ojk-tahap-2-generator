import type { Tingkat } from '../model';
import { buatFamily, tetap, varian, type KerangkaGcs } from './kerangka';
import { urai, type Unsur, type UnsurSubjek } from './tipe';

// Blueprint §5 "Contoh Correct Sentence — urutan noun clause (perluasan)" dan §7 (Noun clause 12-2–12-5); Materi §10.
// Noun clause setelah verb induk memakai urutan subjek–verb; pengecoh memakai inversi pertanyaan langsung (aux/do sebelum
// subjek), agreement yang salah, atau bentuk V1/V3 yang salah. Varian ditulis sebagai templat: {S} = subjek, [..] = verb.

interface SpekNc {
  id: string;
  tingkat: Tingkat;
  konteks: string;
  konsep: string;
  /** Klausa utama sebelum noun clause. */
  awal: string;
  pengantar: string;
  induk: string;
  subjek: { teks: string; inti: string; pewatas?: string };
  lema: string;
  peran: 'penerima' | 'pelaku';
  /** Templat noun clause dan jumlah kesalahannya; templat pertama = bentuk benar. */
  varian: [string, number][];
  ekor?: string;
}

/** Contoh blueprint bagian 5, dipakai kata per kata hanya sebagai uji emas solver (lib/bahasa-inggris/uji-emas.ts). */
const SPEK_EMAS: SpekNc[] = [
  { id: 'emas-payment', tingkat: 'menengah', konteks: 'ekonomi umum', konsep: 'Urutan noun clause dan passive',
    awal: 'The officer explained', pengantar: 'why', induk: 'explained why', subjek: { teks: 'the payment', inti: 'payment' }, lema: 'delay', peran: 'penerima',
    varian: [['why {S} [was delayed]', 0], ['why [was] {S} [delayed]', 1], ['why {S} [were delayed]', 1], ['why {S} [was delay]', 1], ['why {S} [did delayed]', 1]] },
];

const SPEK: SpekNc[] = [
  // Mekanisme sama dengan contoh blueprint §5 (urutan noun clause + passive), kalimat baru.
  { id: 'payment', tingkat: 'menengah', konteks: 'ekonomi umum', konsep: 'Urutan noun clause dan passive',
    awal: 'The accountant explained', pengantar: 'why', induk: 'explained why', subjek: { teks: 'the final invoice', inti: 'invoice' }, lema: 'delay', peran: 'penerima',
    varian: [['why {S} [was delayed]', 0], ['why [was] {S} [delayed]', 1], ['why {S} [were delayed]', 1], ['why {S} [was delay]', 1], ['why {S} [did delayed]', 1],
      ['why [were] {S} [delayed]', 2], ['why [was] {S} [delay]', 2], ['why {S} [were delay]', 2]],
    ekor: 'by two weeks' },
  { id: 'software', tingkat: 'menengah', konteks: 'teknologi', konsep: 'Urutan noun clause dan passive dengan modal',
    awal: 'The manager asked', pengantar: 'when', induk: 'asked when', subjek: { teks: 'the new software', inti: 'software' }, lema: 'install', peran: 'penerima',
    varian: [['when {S} [would be installed]', 0], ['when [would] {S} [be installed]', 1], ['when {S} [would installed]', 1], ['when {S} [would be install]', 1],
      ['when {S} [would been installed]', 1], ['when [would] {S} [been installed]', 2], ['when [would] {S} [be install]', 2]],
    ekor: 'in the main office' },
  { id: 'contracts', tingkat: 'menengah', konteks: 'kebijakan & kepatuhan', konsep: 'Urutan noun clause, agreement, dan passive',
    awal: 'Nobody in the office knows', pengantar: 'where', induk: 'knows where', subjek: { teks: 'the original contracts', inti: 'contracts' }, lema: 'store', peran: 'penerima',
    varian: [['where {S} [are stored]', 0], ['where [are] {S} [stored]', 1], ['where {S} [is stored]', 1], ['where {S} [are store]', 1],
      ['where [is] {S} [stored]', 2], ['where {S} [is store]', 2], ['where [are] {S} [store]', 2]] },
  { id: 'coordinator', tingkat: 'menengah', konteks: 'kegiatan masyarakat', konsep: 'Urutan noun clause dan agreement (tanpa do-support)',
    awal: 'The new volunteers want to know', pengantar: 'where', induk: 'want to know where', subjek: { teks: 'the coordinator', inti: 'coordinator' }, lema: 'work', peran: 'pelaku',
    varian: [['where {S} usually [works]', 0], ['where {S} usually [work]', 1], ['where [does] {S} usually [work]', 1], ['where [does] {S} usually [works]', 2], ['where [do] {S} usually [work]', 2]],
    ekor: 'on Fridays' },
  { id: 'service-desk', tingkat: 'menengah', konteks: 'layanan pelanggan', konsep: 'Urutan noun clause, agreement, dan passive',
    awal: 'Many visitors do not know', pengantar: 'where', induk: 'know where', subjek: { teks: 'the new customer service desk', inti: 'desk' }, lema: 'locate', peran: 'penerima',
    varian: [['where {S} [is located]', 0], ['where [is] {S} [located]', 1], ['where {S} [are located]', 1], ['where {S} [is locate]', 1],
      ['where [are] {S} [located]', 2], ['where {S} [are locate]', 2]] },
  { id: 'community-meetings', tingkat: 'menengah', konteks: 'kegiatan masyarakat', konsep: 'Urutan noun clause, agreement, dan passive',
    awal: 'The residents wanted to know', pengantar: 'why', induk: 'wanted to know why', subjek: { teks: 'the two community meetings', inti: 'meetings' }, lema: 'postpone', peran: 'penerima',
    varian: [['why {S} [were postponed]', 0], ['why [were] {S} [postponed]', 1], ['why {S} [was postponed]', 1], ['why {S} [were postpone]', 1], ['why {S} [did postponed]', 1],
      ['why [was] {S} [postponed]', 2], ['why {S} [was postpone]', 2]],
    ekor: 'until May' },
  { id: 'documents-signed', tingkat: 'menantang', konteks: 'kebijakan & kepatuhan', konsep: 'Urutan noun clause dan past perfect passive',
    awal: 'The auditor asked', pengantar: 'whether', induk: 'asked whether', subjek: { teks: 'the supplier contracts', inti: 'contracts' }, lema: 'sign', peran: 'penerima',
    varian: [['whether {S} [had been] properly [signed]', 0], ['whether [had] {S} [been] properly [signed]', 1], ['whether {S} [had] properly [signed]', 1],
      ['whether {S} [had be] properly [signed]', 1], ['whether {S} [had been] properly [sign]', 1], ['whether [had] {S} properly [signed]', 2], ['whether [had] {S} [be] properly [signed]', 2]],
    ekor: 'by both parties' },
  { id: 'targets', tingkat: 'menantang', konteks: 'laporan & data', konsep: 'Urutan noun clause, agreement, dan passive',
    awal: 'The report does not explain', pengantar: 'how', induk: 'explain how', subjek: { teks: 'the new targets', inti: 'targets' }, lema: 'calculate', peran: 'penerima',
    varian: [['how {S} [were calculated]', 0], ['how [were] {S} [calculated]', 1], ['how {S} [was calculated]', 1], ['how {S} [were calculate]', 1], ['how {S} [did calculated]', 1],
      ['how [was] {S} [calculated]', 2], ['how {S} [was calculate]', 2], ['how [did] {S} [calculate]', 2]],
    ekor: 'by the regional teams' },
  { id: 'shuttle-bus', tingkat: 'menantang', konteks: 'kantor & proyek', konsep: 'Urutan noun clause dan agreement (tanpa do-support)',
    awal: 'The schedule does not show', pengantar: 'what time', induk: 'show what time', subjek: { teks: 'the shuttle bus for conference participants', inti: 'bus', pewatas: 'for conference participants' }, lema: 'leave', peran: 'pelaku',
    varian: [['what time {S} [leaves]', 0], ['what time {S} [leave]', 1], ['what time [does] {S} [leave]', 1], ['what time [does] {S} [leaves]', 2], ['what time [do] {S} [leave]', 2]],
    ekor: 'on Monday' },
  { id: 'proposal-approved', tingkat: 'menantang', konteks: 'riset', konsep: 'Urutan noun clause, agreement, dan present perfect passive',
    awal: 'The applicants have asked', pengantar: 'whether', induk: 'asked whether', subjek: { teks: 'their proposal', inti: 'proposal' }, lema: 'approve', peran: 'penerima',
    varian: [['whether {S} [has been approved]', 0], ['whether [has] {S} [been approved]', 1], ['whether {S} [have been approved]', 1], ['whether {S} [has approved]', 1],
      ['whether {S} [has been approve]', 1], ['whether [have] {S} [been approved]', 2], ['whether {S} [have approved]', 2]],
    ekor: 'by the review panel' },
  { id: 'printers-repaired', tingkat: 'menengah', konteks: 'teknologi', konsep: 'Urutan noun clause dan passive dengan modal',
    awal: 'The staff want to know', pengantar: 'when', induk: 'want to know when', subjek: { teks: 'the broken printers', inti: 'printers' }, lema: 'repair', peran: 'penerima',
    varian: [['when {S} [will be repaired]', 0], ['when [will] {S} [be repaired]', 1], ['when {S} [will repaired]', 1], ['when {S} [will be repair]', 1],
      ['when {S} [will been repaired]', 1], ['when [will] {S} [be repair]', 2], ['when [will] {S} [been repaired]', 2]],
    ekor: 'by the technician' },
  { id: 'complaints-recorded', tingkat: 'menengah', konteks: 'layanan pelanggan', konsep: 'Urutan noun clause dan passive dengan modal',
    awal: 'The new guidelines explain', pengantar: 'how', induk: 'explain how', subjek: { teks: 'customer complaints', inti: 'complaints' }, lema: 'record', peran: 'penerima',
    varian: [['how {S} [should be recorded]', 0], ['how [should] {S} [be recorded]', 1], ['how {S} [should recorded]', 1], ['how {S} [should be record]', 1],
      ['how {S} [should been recorded]', 1], ['how [should] {S} [be record]', 2], ['how [should] {S} [been recorded]', 2]],
    ekor: 'in the online system' },
  { id: 'technician-starts', tingkat: 'menantang', konteks: 'kantor & proyek', konsep: 'Urutan noun clause dan agreement (tanpa do-support)',
    awal: 'Nobody has told us', pengantar: 'when', induk: 'told us when', subjek: { teks: 'the new technician', inti: 'technician' }, lema: 'start', peran: 'pelaku',
    varian: [['when {S} [starts]', 0], ['when {S} [start]', 1], ['when [does] {S} [start]', 1], ['when [does] {S} [starts]', 2], ['when [do] {S} [start]', 2]],
    ekor: 'work at the main office' },
];

function wujud(s: SpekNc): KerangkaGcs {
  const subjek: UnsurSubjek = { teks: s.subjek.teks, peran: 'subjek', klausa: 'nc', inti: s.subjek.inti };
  if (s.subjek.pewatas) subjek.pewatas = s.subjek.pewatas;
  const pola: (Unsur | number)[] = [tetap(s.awal), 0];
  if (s.ekor) pola.push(tetap(s.ekor));
  return {
    id: `nc-${s.id}`,
    sasaran: s.pengantar,
    tingkat: s.tingkat,
    konteks: s.konteks,
    kaidah: 'urutan-noun-clause',
    konsep: s.konsep,
    klausa: [{ id: 'nc', jenis: 'nc', lema: s.lema, peran: s.peran, pengantar: s.pengantar, induk: s.induk }],
    pola,
    titik: [s.varian.map(([t, g]) => varian(urai(t, subjek, 'nc'), g))],
    uji: ['urutan:nc'],
  };
}

export const KERANGKA_NOUN_CLAUSE: KerangkaGcs[][] = SPEK.map((s) => [wujud(s)]);
export const EMAS_NOUN_CLAUSE: KerangkaGcs[][] = SPEK_EMAS.map((s) => [wujud(s)]);

export const gcsNounClause = buatFamily({
  id: 'GCS-NOUN-CLAUSE',
  versi: 2,
  nama: 'Urutan noun clause',
  label: 'VARIASI',
  sumber: 'Blueprint Bahasa Inggris §5 (contoh urutan noun clause, perluasan), §7 Noun clause · Materi §10 · Azar 12-2–12-5',
  ringkas: 'Noun clause setelah verb induk (explained why, asked whether, know where, ...). Pengecoh memakai inversi pertanyaan langsung atau do-support, agreement yang salah, atau bentuk verb yang salah; satu kalimat memakai urutan subjek–verb dengan rangkaian verb yang tepat.',
  kelompok: KERANGKA_NOUN_CLAUSE,
  caraCepat: (rel, item) => {
    const k = item.data.klausa[0];
    const u = rel.find((x) => x.jenis === 'urutan');
    const lain = rel.filter((x) => x.jenis !== 'urutan').map((x) => x.ringkas);
    return `Setelah ${k.induk}, letakkan subjek lebih dahulu, baru verb: ${u?.ringkas}. Setelah urutan benar, cek ${lain.length ? lain.join(' dan ') : 'bentuk verb-nya'}.`;
  },
});
