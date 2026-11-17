import type { BarisRelasi } from '../umum';
import { kapital, type TabelKalimat } from './relasi';
import { BSC, SLK9 } from './sumber';

// Perencanaan Keuangan — tabel relasi dua arah (VARIASI): unsur SMART, makna rasio kesehatan keuangan, dan standar rasio.

/** `jenis`: nama rumusan (arah nilai); `makna`: kalimat makna opsi subjek yang salah (arah subjek). */
const salah = (jenis: string, makna: (x: BarisRelasi) => string) => (benar: BarisRelasi, x: BarisRelasi, arah: 'nilai' | 'subjek') =>
  arah === 'nilai' ? `Rumusan itu adalah ${jenis} "${x.subjek}", bukan "${benar.subjek}".` : makna(x);

const S9_T5 = `${SLK9}, Bab 2 Tahap 2 (Tabel 5 Rasio Kesehatan Keuangan)`;

export const TABEL_PK: TabelKalimat[] = [
  {
    id: 'smart', topik: 'tujuan',
    kalimat: (b) => `Unsur ${b.subjek} berarti tujuan ${b.nilai}.`,
    tanyaNilai: (s) => `Dalam perumusan tujuan keuangan SMART, unsur "${s}" berarti tujuan ....`,
    tanyaSubjek: (n) => `Tujuan keuangan yang ${n} memenuhi unsur SMART ....`,
    alasanSalah: salah('makna unsur', (x) => `Unsur ${x.subjek} berarti tujuan ${x.nilai}.`),
    konsep: 'SMART: Specific, Measurable, Attainable, Realistic, Timely.',
    caraCepat: 'Lugas → Specific; angka → Measurable; prioritas → Attainable; sesuai kemampuan → Realistic; tenggat → Timely.',
    baris: [
      { id: 'specific', subjek: 'Specific', nilai: 'dirumuskan dengan kata-kata lugas tanpa makna ganda', tingkat: 'dasar', sumber: `${SLK9}, Bab 2 Tahap 1` },
      { id: 'measurable', subjek: 'Measurable', nilai: 'hasilnya terukur dalam angka dan mata uang yang jelas', tingkat: 'dasar', sumber: `${SLK9}, Bab 2 Tahap 1` },
      { id: 'attainable', subjek: 'Attainable', nilai: 'dapat dicapai dengan skala prioritas bila ada beberapa tujuan sekaligus', tingkat: 'menengah', sumber: `${SLK9}, Bab 2 Tahap 1` },
      { id: 'realistic', subjek: 'Realistic', nilai: 'tidak terlalu muluk dan mempertimbangkan kemampuan yang ada', tingkat: 'menengah', sumber: `${SLK9}, Bab 2 Tahap 1` },
      { id: 'timely', subjek: 'Timely', nilai: 'memiliki batas waktu pencapaian yang jelas', tingkat: 'dasar', sumber: `${SLK9}, Bab 2 Tahap 1` },
    ],
  },
  {
    id: 'makna-rasio', topik: 'rasio',
    kalimat: (b) => `${kapital(b.subjek)} mengukur ${b.nilai}.`,
    tanyaNilai: (s) => `Dalam pemeriksaan kesehatan keuangan pribadi, ${s} digunakan untuk mengukur ....`,
    tanyaSubjek: (n) => `Rasio kesehatan keuangan yang mengukur ${n} adalah ....`,
    alasanSalah: salah('fungsi', (x) => `${kapital(x.subjek)} mengukur ${x.nilai}.`),
    konsep: 'Rasio kesehatan keuangan (FPSB Indonesia, Buku 9): likuiditas, lancar, tabungan, utang, pelunasan utang, solvensi, dan investasi.',
    caraCepat: 'Cocokkan pembilang rasio: kas → likuiditas/lancar; tabungan → tabungan; utang → utang/pelunasan; kekayaan bersih → solvensi; aset investasi → investasi.',
    baris: [
      { id: 'likuiditas', subjek: 'rasio likuiditas', nilai: 'kecukupan aset lancar untuk kebutuhan mendadak atau keadaan darurat', tingkat: 'menengah', sumber: S9_T5 },
      { id: 'lancar', subjek: 'rasio lancar', nilai: 'kecukupan aset lancar untuk melunasi utang jangka pendek', tingkat: 'menantang', sumber: S9_T5 },
      { id: 'tabungan', subjek: 'rasio tabungan', nilai: 'kemampuan menabung yang disisihkan dari penghasilan', tingkat: 'dasar', sumber: S9_T5 },
      { id: 'utang', subjek: 'rasio utang terhadap aset', nilai: 'seberapa besar harta yang diperoleh dari utang', tingkat: 'menengah', sumber: S9_T5 },
      { id: 'pelunasan', subjek: 'rasio pelunasan utang', nilai: 'besarnya alokasi penghasilan untuk membayar cicilan utang', tingkat: 'menengah', sumber: S9_T5 },
      { id: 'solvensi', subjek: 'rasio solvensi', nilai: 'kemampuan membayar seluruh utang dengan kekayaan bersih yang dimiliki', tingkat: 'menantang', sumber: S9_T5 },
      { id: 'investasi', subjek: 'rasio investasi', nilai: 'seberapa besar aset dipakai secara produktif untuk mengakumulasi kekayaan', tingkat: 'menantang', sumber: S9_T5 },
    ],
  },
  {
    id: 'standar-rasio', topik: 'rasio',
    kalimat: (b) => `Standar sehat ${b.subjek} adalah ${b.nilai}.`,
    tanyaNilai: (s) => `Menurut buku Seri Literasi Keuangan OJK, standar ${s} yang sehat adalah ....`,
    tanyaSubjek: (n) => `Menurut buku Seri Literasi Keuangan OJK, standar sehat "${n}" berlaku untuk ....`,
    alasanSalah: (benar, x, arah) => arah === 'nilai'
      ? `"${x.nilai}" adalah standar ${x.subjek}, bukan ${benar.subjek}.`
      : `Standar ${x.subjek} adalah ${x.nilai}.`,
    konsep: 'Standar rasio (Buku 9, Tabel 5): likuiditas 3–6 kali pengeluaran bulanan; lancar > 1; tabungan > 10% pendapatan; utang < 50% aset; cicilan < 30% penghasilan.',
    caraCepat: 'Bulan → likuiditas; "> 1" → lancar; 10% → tabungan; 30% → cicilan; 50% → utang terhadap aset.',
    baris: [
      { id: 'likuiditas', subjek: 'rasio likuiditas (dana darurat)', nilai: '3–6 kali pengeluaran bulanan', tingkat: 'menengah', sumber: `${S9_T5}; ${BSC}, Bab II` },
      { id: 'lancar', subjek: 'rasio lancar', nilai: 'lebih dari 1', tingkat: 'menantang', sumber: S9_T5 },
      { id: 'tabungan', subjek: 'rasio tabungan', nilai: 'lebih dari 10% pendapatan', tingkat: 'menengah', sumber: `${S9_T5}; ${BSC}, Bab II` },
      { id: 'utang', subjek: 'rasio utang terhadap aset', nilai: 'kurang dari 50% total aset', tingkat: 'menengah', sumber: `${S9_T5}; ${BSC}, Bab II` },
      { id: 'pelunasan', subjek: 'rasio pelunasan utang (cicilan)', nilai: 'kurang dari 30% penghasilan', tingkat: 'menengah', sumber: `${S9_T5}; ${BSC}, Bab II` },
    ],
  },
];
