import { buatFamily, tetap, titikPrep, type KerangkaGcs } from './kerangka';
import { bulan, bulanTahun, bagian, hari, jam, tahun, tanggal, type Waktu } from './sva-waktu';
import type { Unsur } from './tipe';

// Blueprint §5 (preposisi pada contoh teramati) dan Materi §9: at untuk jam, on untuk hari/tanggal, in untuk bulan/tahun/
// bagian hari. Tingkat dasar: satu kaidah, kalimat pendek, dua keterangan waktu → 3 × 3 kombinasi preposisi.

interface SpekWaktu { id: string; konteks: string; varian: (string | Waktu)[][] }

const SPEK: SpekWaktu[] = [
  { id: 'volunteer-training', konteks: 'pendidikan & pelatihan', varian: [
    ['The training session for new volunteers starts', jam('9 a.m.'), hari('Monday')],
    ['The training session for new volunteers starts', jam('2 p.m.'), tanggal('14 March')],
  ] },
  { id: 'system-update', konteks: 'teknologi', varian: [
    ['The scheduled system update will begin', jam('midnight'), hari('Sunday')],
    ['The scheduled system update will begin', jam('10 p.m.'), tanggal('30 June')],
  ] },
  { id: 'course-registration', konteks: 'pendidikan & pelatihan', varian: [
    ['Registration for the course opened', bulan('January'), 'and closed', tanggal('15 March')],
  ] },
  { id: 'solar-pilot', konteks: 'lingkungan & energi', varian: [
    ['The solar panel pilot project started', tahun('2023'), 'and ended', bulanTahun('June 2024')],
  ] },
  { id: 'staff-meeting', konteks: 'kantor & proyek', varian: [
    ['The annual staff meeting will take place', jam('10 a.m.'), tanggal('14 March')],
    ['The annual staff meeting will take place', jam('3 p.m.'), hari('Thursday')],
  ] },
  { id: 'recycling-rules', konteks: 'kebijakan & kepatuhan', varian: [
    ['The new recycling rules came into effect', tanggal('1 January'), 'and will be reviewed', bulan('July')],
  ] },
  { id: 'help-desk-calls', konteks: 'layanan pelanggan', varian: [
    ['The help desk receives most of its calls', bagian('the morning'), 'and closes', jam('6 p.m.')],
  ] },
  { id: 'public-lectures', konteks: 'kegiatan masyarakat', varian: [
    ['Public lectures at the science centre are held', hari('Thursdays'), bulan('October')],
  ] },
  { id: 'soil-samples', konteks: 'riset', varian: [
    ['The research team will collect the first soil samples', jam('7 a.m.'), tanggal('3 June')],
  ] },
  { id: 'annual-report', konteks: 'laporan & data', varian: [
    ['The annual report was first published', tahun('2019'), 'and is updated', bulan('December'), 'each year'],
  ] },
  { id: 'farmers-market', konteks: 'ekonomi umum', varian: [
    ["The local farmers' market in the town square opens", jam('6 a.m.'), hari('Saturdays')],
  ] },
];

function wujud(s: SpekWaktu, bagianKalimat: (string | Waktu)[]): KerangkaGcs {
  const pola: (Unsur | number)[] = [];
  const titik: KerangkaGcs['titik'] = [];
  const jenis: string[] = [];
  for (const b of bagianKalimat) {
    if (typeof b === 'string') { pola.push(tetap(b)); continue; }
    pola.push(titik.length, { teks: b.teks, peran: 'ket-waktu' });
    titik.push(titikPrep(b.prep));
    jenis.push(b.jenis);
  }
  return {
    id: `waktu-${s.id}`,
    sasaran: jenis.join('+'),
    tingkat: 'dasar',
    konteks: s.konteks,
    kaidah: 'preposisi-waktu',
    konsep: 'Preposisi waktu (at, on, in)',
    klausa: [],
    pola,
    titik,
    uji: titik.map((_, i) => `waktu:${i}`),
  };
}

export const KERANGKA_WAKTU: KerangkaGcs[][] = SPEK.map((s) => s.varian.map((v) => wujud(s, v)));

export const gcsWaktu = buatFamily({
  id: 'GCS-WAKTU',
  nama: 'Preposisi waktu',
  label: 'SHL',
  sumber: 'Blueprint Bahasa Inggris §5 (preposisi pada contoh teramati), §9 tingkat dasar · Materi §9 (at/on/in untuk jam, hari/tanggal, bulan/tahun)',
  ringkas: 'Satu kalimat pendek dengan dua keterangan waktu (jam, hari, tanggal, bulan, tahun, bagian hari). Titik uji: preposisi pada kedua keterangan; hanya satu kalimat yang memakai at/on/in dengan tepat di kedua tempat.',
  kelompok: KERANGKA_WAKTU,
  caraCepat: (rel) => `Kelompokkan keterangan waktunya: jam → at; hari dan tanggal → on; bulan, tahun, dan bagian hari → in. Pada soal ini: ${rel.map((r) => r.ringkas).join(' dan ')}.`,
});
