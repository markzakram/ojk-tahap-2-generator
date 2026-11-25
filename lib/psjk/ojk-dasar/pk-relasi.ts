import type { BarisRelasi } from '../umum';
import { kapital, type TabelKalimat } from './relasi';
import { BSC, EB_PK, SLK9 } from './sumber';

// Perencanaan Keuangan — tabel relasi dua arah (VARIASI). QC 2 R01: tabel rasio FPSB (makna dan standar) bersumber Seri
// Literasi saja sehingga disaring; penggantinya tabel model hitung materi folder (subbab 3.1.13).

/** `jenis`: nama rumusan (arah nilai); `makna`: kalimat makna opsi subjek yang salah (arah subjek). */
const salah = (jenis: string, makna: (x: BarisRelasi) => string) => (benar: BarisRelasi, x: BarisRelasi, arah: 'nilai' | 'subjek') =>
  arah === 'nilai' ? `Rumusan itu adalah ${jenis} "${x.subjek}", bukan "${benar.subjek}".` : makna(x);

const S9_T5 = `${SLK9}, Bab 2 Tahap 2 (Tabel 5 Rasio Kesehatan Keuangan)`;

export const TABEL_PK: TabelKalimat[] = [
  {
    id: 'makna-rasio', topik: 'rasio',
    kalimat: (b) => `${kapital(b.subjek)} mengukur ${b.nilai}.`,
    tanyaNilai: (s) => `Dalam pemeriksaan kesehatan keuangan pribadi, ${s} digunakan untuk mengukur ....`,
    tanyaSubjek: (n) => `Rasio kesehatan keuangan yang mengukur ${n} adalah ....`,
    alasanSalah: salah('fungsi', (x) => `${kapital(x.subjek)} mengukur ${x.nilai}.`),
    konsep: 'Rasio kesehatan keuangan (FPSB Indonesia): likuiditas, lancar, tabungan, utang, pelunasan utang, solvensi, dan investasi.',
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
    tanyaNilai: (s) => `Standar ${s} yang sehat adalah ....`,
    tanyaSubjek: (n) => `Standar sehat "${n}" berlaku untuk ....`,
    alasanSalah: (benar, x, arah) => arah === 'nilai'
      ? `"${x.nilai}" adalah standar ${x.subjek}, bukan ${benar.subjek}.`
      : `Standar ${x.subjek} adalah ${x.nilai}.`,
    konsep: 'Standar rasio: likuiditas 3–6 kali pengeluaran bulanan; lancar > 1; tabungan > 10% pendapatan; utang < 50% aset; cicilan < 30% penghasilan.',
    caraCepat: 'Bulan → likuiditas; "> 1" → lancar; 10% → tabungan; 30% → cicilan; 50% → utang terhadap aset.',
    baris: [
      { id: 'likuiditas', subjek: 'rasio likuiditas (dana darurat)', nilai: '3–6 kali pengeluaran bulanan', tingkat: 'menengah', sumber: `${S9_T5}; ${BSC}, Bab II` },
      { id: 'lancar', subjek: 'rasio lancar', nilai: 'lebih dari 1', tingkat: 'menantang', sumber: S9_T5 },
      { id: 'tabungan', subjek: 'rasio tabungan', nilai: 'lebih dari 10% pendapatan', tingkat: 'menengah', sumber: `${S9_T5}; ${BSC}, Bab II` },
      { id: 'utang', subjek: 'rasio utang terhadap aset', nilai: 'kurang dari 50% total aset', tingkat: 'menengah', sumber: `${S9_T5}; ${BSC}, Bab II` },
      { id: 'pelunasan', subjek: 'rasio pelunasan utang (cicilan)', nilai: 'kurang dari 30% penghasilan', tingkat: 'menengah', sumber: `${S9_T5}; ${BSC}, Bab II` },
    ],
  },
  {
    id: 'rumus-model', topik: 'model-hitung',
    kalimat: (b) => `${kapital(b.subjek)} dihitung dari ${b.nilai}.`,
    tanyaNilai: (s) => `Dalam perencanaan keuangan, ${s} dihitung dari ....`,
    tanyaSubjek: (n) => `Dalam perencanaan keuangan, hasil dari ${n} disebut ....`,
    alasanSalah: (benar, x, arah) => arah === 'nilai' ? `Itu cara menghitung ${x.subjek}, bukan ${benar.subjek}.` : `${kapital(x.subjek)} dihitung dari ${x.nilai}.`,
    konsep: 'Model hitung perencanaan keuangan: arus kas bersih, kekayaan bersih, rasio cicilan, target cadangan, kekurangan target, setoran periodik sederhana, dan proyeksi biaya masa depan.',
    caraCepat: 'Masuk − keluar → arus kas; aset − kewajiban → kekayaan bersih; cicilan ÷ pendapatan → rasio cicilan; biaya esensial × bulan → cadangan; target − saldo → kekurangan; kekurangan ÷ periode → setoran; PV × (1+i)ⁿ → proyeksi.',
    baris: [
      { id: 'arus-kas', subjek: 'arus kas bersih', nilai: 'pendapatan dikurangi pengeluaran', tingkat: 'dasar', sumber: `${EB_PK}, subbab 3.1.4 dan 3.1.13` },
      { id: 'kekayaan', subjek: 'kekayaan bersih', nilai: 'total aset dikurangi total kewajiban', tingkat: 'dasar', sumber: `${EB_PK}, subbab 3.1.6 dan 3.1.13` },
      { id: 'rasio', subjek: 'rasio cicilan', nilai: 'cicilan dibagi pendapatan dikali 100%', tingkat: 'dasar', sumber: `${EB_PK}, subbab 3.1.8 dan 3.1.13` },
      { id: 'cadangan', subjek: 'target cadangan', nilai: 'biaya esensial bulanan dikali jumlah bulan target', tingkat: 'menengah', sumber: `${EB_PK}, subbab 3.1.7 dan 3.1.13` },
      { id: 'kekurangan', subjek: 'kekurangan target', nilai: 'target dikurangi saldo terkumpul', tingkat: 'dasar', sumber: `${EB_PK}, subbab 3.1.13` },
      { id: 'setoran', subjek: 'setoran periodik sederhana', nilai: 'sisa dana yang dibutuhkan dibagi jumlah periode', tingkat: 'menengah', sumber: `${EB_PK}, subbab 3.1.11 dan 3.1.13` },
      { id: 'proyeksi', subjek: 'proyeksi biaya masa depan', nilai: 'nilai sekarang dikali (1 + tingkat kenaikan) pangkat banyak periode', tingkat: 'menengah', sumber: `${EB_PK}, subbab 3.1.11 dan 3.1.13` },
    ],
  },
  {
    id: 'kegunaan-model', topik: 'model-hitung',
    kalimat: (b) => `${kapital(b.subjek)} dipakai untuk ${b.nilai}.`,
    tanyaNilai: (s) => `Dalam perencanaan keuangan, ${s} dipakai untuk ....`,
    tanyaSubjek: (n) => `Model hitung yang dipakai untuk ${n} adalah ....`,
    alasanSalah: (benar, x, arah) => arah === 'nilai' ? `Itu kegunaan ${x.subjek}, bukan ${benar.subjek}.` : `${kapital(x.subjek)} dipakai untuk ${x.nilai}.`,
    konsep: 'Setiap model hitung menjawab pertanyaan berbeda: surplus periode, posisi pada suatu tanggal, beban utang, dana darurat, sisa dana, setoran rutin, atau kebutuhan masa depan.',
    caraCepat: 'Periode → arus kas; tanggal → kekayaan bersih; beban utang → rasio cicilan; darurat → cadangan; sisa → kekurangan target; rutin → setoran; kenaikan harga → proyeksi.',
    baris: [
      { id: 'arus-kas', subjek: 'arus kas bersih', nilai: 'menilai surplus atau defisit suatu periode', tingkat: 'dasar', sumber: `${EB_PK}, subbab 3.1.4 dan 3.1.13` },
      { id: 'kekayaan', subjek: 'kekayaan bersih', nilai: 'mengukur posisi keuangan pada suatu tanggal', tingkat: 'dasar', sumber: `${EB_PK}, subbab 3.1.6 dan 3.1.13` },
      { id: 'rasio', subjek: 'rasio cicilan', nilai: 'melihat beban utang terhadap pendapatan', tingkat: 'dasar', sumber: `${EB_PK}, subbab 3.1.8 dan 3.1.13` },
      { id: 'cadangan', subjek: 'target cadangan', nilai: 'merencanakan dana darurat', tingkat: 'dasar', sumber: `${EB_PK}, subbab 3.1.7 dan 3.1.13` },
      { id: 'kekurangan', subjek: 'kekurangan target', nilai: 'menentukan sisa dana yang masih harus dikumpulkan', tingkat: 'dasar', sumber: `${EB_PK}, subbab 3.1.13` },
      { id: 'setoran', subjek: 'setoran periodik sederhana', nilai: 'memperkirakan simpanan rutin tanpa hasil investasi', tingkat: 'menengah', sumber: `${EB_PK}, subbab 3.1.13` },
      { id: 'proyeksi', subjek: 'proyeksi biaya masa depan', nilai: 'memperkirakan kebutuhan dana dengan asumsi inflasi tetap', tingkat: 'menengah', sumber: `${EB_PK}, subbab 3.1.11 dan 3.1.13` },
    ],
  },
];
