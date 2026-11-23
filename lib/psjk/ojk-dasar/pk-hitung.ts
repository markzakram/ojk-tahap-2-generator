import type { Rng } from '../../core/rng';
import type { Family } from '../../core/types';
import { bahasPg, periksaFormatPg, susunOpsi, type JawabanPg, type PilihanGandaItem, type Tingkat } from '../../core/pilihan-ganda';
import { chapterById } from '../../data/chapters';
import { INSTRUKSI_PSJK, type SumberFakta } from '../umum';
import { kapital } from './relasi';
import { BSC, EB_PK, SLK9 } from './sumber';

// Perencanaan Keuangan — hitungan sederhana (VARIASI). Bukan familyKurasi: setiap soal dibangun dari angka acak, kunci
// dihitung ulang oleh solver dari angka yang tampil di soal (`data.angka`), dan pengecoh berasal dari jalur kesalahan hitung
// yang lazim (lupa satu pos, lupa saldo, bunga sederhana, porsi yang tertukar, pembagi keliru). Rumus dari e-book tim
// (subbab 3.1.4–3.1.13) dan buku OJK; tokoh dan nama pos hanya konteks. Sidik = jenis hitungan + varian struktur
// (jumlah pos, kelipatan, periode), bukan angka.

type Jenis =
  | 'arus-kas' | 'kekurangan-tabungan' | 'kekayaan-bersih' | 'target-darurat' | 'waktu-darurat'
  | 'rasio-cicilan' | 'fv-inflasi' | 'setoran-bulanan' | 'porsi-sisihkan' | 'rasio-utang-aset';
type Satuan = 'rupiah' | 'persen' | 'bulan';

export interface DataHitung extends SumberFakta {
  jenis: Jenis;
  varian: string;
  /** Angka yang tampil di soal; satu-satunya masukan solver. */
  angka: Record<string, number>;
  satuan: Satuan;
  alasanSalah: Record<string, string>;
  konsep: string;
  kataKunci: string;
  langkah: string[];
  caraCepat: string;
}

export type ItemHitung = PilihanGandaItem<DataHitung>;

const ID = 'PSJK-PK-HITUNG';
const NAMA = ['Andi', 'Rina', 'Dodi', 'Sari', 'Bima', 'Lestari', 'Fajar', 'Maya', 'Yusuf', 'Nadia', 'Rudi', 'Dina'];
const RB = 1_000;
const JT = 1_000_000;

/** Rupiah tanpa desimal dengan titik pemisah ribuan (tidak bergantung pada ICU). */
export function rp(n: number): string {
  const s = String(Math.round(Math.abs(n)));
  return `${n < 0 ? '−' : ''}Rp${s.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}
function persen(x: number): string {
  const r = Math.round(x * 10) / 10;
  return Number.isInteger(r) ? `${r}%` : `${r.toFixed(1).replace('.', ',')}%`;
}
export function formatNilai(satuan: Satuan, x: number): string {
  if (satuan === 'rupiah') return rp(x);
  if (satuan === 'persen') return persen(x);
  return `${x} bulan`;
}

/** Kelipatan `langkah` di [min, max]. */
const kel = (r: Rng, min: number, max: number, langkah: number) => r.int(Math.ceil(min / langkah), Math.floor(max / langkah)) * langkah;
const jumlah = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const daftar = (xs: string[]) => (xs.length <= 2 ? xs.join(' dan ') : `${xs.slice(0, -1).join(', ')}, dan ${xs[xs.length - 1]}`);

// ---------- solver independen: hanya membaca jenis + angka yang tampil di soal ----------

function selesaikan(jenis: Jenis, a: Record<string, number>): number {
  const pos = (awalan: string) => Object.keys(a).filter((k) => k.startsWith(awalan)).sort().map((k) => a[k]);
  switch (jenis) {
    case 'arus-kas': return a.pendapatan - jumlah(pos('keluar'));
    case 'kekurangan-tabungan': return a.target - (a.pendapatan - jumlah(pos('keluar')));
    case 'kekayaan-bersih': return jumlah(pos('aset')) - jumlah(pos('utang'));
    case 'target-darurat': return a.kelipatan * a.esensial;
    case 'waktu-darurat': return (a.kelipatan * a.esensial - a.saldo) / a.setoran;
    case 'rasio-cicilan': return Math.round((jumlah(pos('cicilan')) / a.pendapatan) * 100);
    case 'fv-inflasi': return Math.round(a.pv * Math.pow(1 + a.persen / 100, a.tahun));
    case 'setoran-bulanan': return (a.target - a.saldo) / a.bulan;
    case 'porsi-sisihkan': return (a.penghasilan * a.porsiPersen) / 100;
    case 'rasio-utang-aset': return Math.round((jumlah(pos('utang')) / jumlah(pos('aset'))) * 100);
  }
}

// ---------- pembangun per jenis ----------

interface Rancangan {
  jenis: Jenis;
  varian: string;
  tingkat: Tingkat;
  satuan: Satuan;
  pertanyaan: string;
  angka: Record<string, number>;
  benar: number;
  salah: { nilai: number; alasan: string }[];
  konsep: string;
  kataKunci: string;
  langkah: string[];
  caraCepat: string;
  sumber: string;
  berlakuPer?: string;
}

const POS_KELUAR = ['kebutuhan pokok', 'cicilan', 'transportasi', 'biaya pendidikan', 'biaya lain-lain'];

function arusKas(r: Rng, nama: string): Rancangan | null {
  const n = r.pick([3, 4]);
  const label = r.sample(POS_KELUAR, n);
  const pendapatan = kel(r, 4.5 * JT, 9 * JT, 100 * RB);
  const keluar = label.map((l) => (l === 'kebutuhan pokok' ? kel(r, 1.8 * JT, 3.5 * JT, 100 * RB) : kel(r, 300 * RB, 1.4 * JT, 100 * RB)));
  const total = jumlah(keluar);
  const surplus = pendapatan - total;
  if (surplus < 300 * RB || surplus > 2 * JT) return null;
  const angka: Record<string, number> = { pendapatan };
  keluar.forEach((x, i) => (angka[`keluar${i}`] = x));
  const iBesar = keluar.indexOf(Math.max(...keluar));
  const salah = [
    { nilai: total, alasan: `${rp(total)} adalah total pengeluaran, bukan arus kas bersih.` },
    ...keluar.map((x, i) => ({ nilai: surplus + x, alasan: `${rp(surplus + x)} diperoleh bila pos ${label[i]} (${rp(x)}) lupa dikurangkan.` })),
    { nilai: surplus - keluar[iBesar], alasan: `${rp(surplus - keluar[iBesar])} diperoleh bila pos ${label[iBesar]} dikurangkan dua kali.` },
  ];
  return {
    jenis: 'arus-kas', varian: `${n}pos`, tingkat: n === 3 ? 'dasar' : 'menengah', satuan: 'rupiah',
    pertanyaan: `Pendapatan bulanan ${nama} ${rp(pendapatan)}. Pengeluarannya setiap bulan: ${daftar(label.map((l, i) => `${l} ${rp(keluar[i])}`))}. Arus kas bersih bulanan ${nama} adalah ....`,
    angka, benar: surplus, salah,
    konsep: 'Arus kas bersih periode tertentu = total pemasukan − total pengeluaran; hasil positif berarti surplus.',
    kataKunci: 'arus kas bersih',
    langkah: [`Total pengeluaran = ${keluar.map(rp).join(' + ')} = ${rp(total)}.`, `Arus kas bersih = ${rp(pendapatan)} − ${rp(total)} = ${rp(surplus)} (surplus).`],
    caraCepat: 'Jumlahkan semua pengeluaran dahulu, baru kurangkan dari pendapatan.',
    sumber: `${EB_PK}, subbab 3.1.4, 3.1.13, dan contoh soal 4.3`,
  };
}

function kekuranganTabungan(r: Rng, nama: string): Rancangan | null {
  const label = r.sample(POS_KELUAR.filter((l) => l !== 'biaya pendidikan'), 3);
  const pendapatan = kel(r, 4 * JT, 8 * JT, 100 * RB);
  const keluar = label.map((l) => (l === 'kebutuhan pokok' ? kel(r, 1.8 * JT, 3.2 * JT, 100 * RB) : kel(r, 400 * RB, 1.3 * JT, 100 * RB)));
  const surplus = pendapatan - jumlah(keluar);
  const target = kel(r, 500 * RB, 1.5 * JT, 100 * RB);
  const kurang = target - surplus;
  if (surplus < 100 * RB || kurang < 100 * RB) return null;
  const angka: Record<string, number> = { pendapatan, target };
  keluar.forEach((x, i) => (angka[`keluar${i}`] = x));
  const iKecil = keluar.indexOf(Math.min(...keluar));
  const salah = [
    { nilai: surplus, alasan: `${rp(surplus)} adalah sisa pendapatan (surplus), bukan kekurangan terhadap target.` },
    { nilai: target, alasan: `${rp(target)} adalah target tabungan itu sendiri; surplus yang ada belum dikurangkan.` },
    { nilai: target + surplus, alasan: `${rp(target + surplus)} diperoleh bila surplus dijumlahkan dengan target, padahal seharusnya dikurangkan.` },
    { nilai: kurang - keluar[iKecil], alasan: `${rp(kurang - keluar[iKecil])} diperoleh bila pos ${label[iKecil]} lupa dihitung sebagai pengeluaran.` },
  ];
  return {
    jenis: 'kekurangan-tabungan', varian: '3pos', tingkat: 'menantang', satuan: 'rupiah',
    pertanyaan: `Pendapatan bulanan ${nama} ${rp(pendapatan)}, dengan pengeluaran ${daftar(label.map((l, i) => `${l} ${rp(keluar[i])}`))}. ${nama} menargetkan menabung ${rp(target)} per bulan. Jika pos lain tidak diubah, kekurangan dana agar target tabungan tercapai adalah ....`,
    angka, benar: kurang, salah,
    konsep: 'Target tabungan dibandingkan dengan surplus arus kas; bila target melebihi surplus, target perlu disesuaikan atau pengeluaran dikurangi.',
    kataKunci: 'target tabungan melebihi surplus',
    langkah: [`Surplus = ${rp(pendapatan)} − (${keluar.map(rp).join(' + ')}) = ${rp(surplus)}.`, `Kekurangan = target − surplus = ${rp(target)} − ${rp(surplus)} = ${rp(kurang)}.`],
    caraCepat: 'Hitung surplus dulu, lalu bandingkan dengan target.',
    sumber: `${EB_PK}, subbab 3.1.4 dan contoh soal 4.8`,
  };
}

function kekayaanBersih(r: Rng, nama: string): Rancangan | null {
  const banyakAset = r.pick([3, 4]);
  const banyakUtang = banyakAset === 3 ? 1 : 2;
  const labelAset = ['tabungan', 'investasi reksa dana', 'kendaraan (nilai wajar)', 'perhiasan'].slice(0, banyakAset);
  const labelUtang = ['sisa kredit kendaraan', 'tagihan kartu kredit'].slice(0, banyakUtang);
  const aset = [kel(r, 3 * JT, 20 * JT, 500 * RB), kel(r, 2 * JT, 15 * JT, 500 * RB), kel(r, 10 * JT, 30 * JT, JT), kel(r, 1 * JT, 6 * JT, 500 * RB)].slice(0, banyakAset);
  const utang = [kel(r, 4 * JT, 18 * JT, 500 * RB), kel(r, 500 * RB, 4 * JT, 500 * RB)].slice(0, banyakUtang);
  const totA = jumlah(aset);
  const totU = jumlah(utang);
  const nw = totA - totU;
  if (nw < 2 * JT) return null;
  const angka: Record<string, number> = {};
  aset.forEach((x, i) => (angka[`aset${i}`] = x));
  utang.forEach((x, i) => (angka[`utang${i}`] = x));
  const salah = [
    { nilai: totA, alasan: `${rp(totA)} adalah total aset; kewajiban belum dikurangkan.` },
    { nilai: totA + totU, alasan: `${rp(totA + totU)} diperoleh bila utang dijumlahkan dengan aset.` },
    { nilai: nw - aset[2], alasan: `${rp(nw - aset[2])} diperoleh bila kendaraan tidak dihitung; kendaraan tetap aset meski tidak selikuid kas.` },
    { nilai: totU, alasan: `${rp(totU)} adalah total kewajiban, bukan kekayaan bersih.` },
    ...(banyakUtang === 2 ? [{ nilai: totA - utang[0], alasan: `${rp(totA - utang[0])} diperoleh bila ${labelUtang[1]} lupa dikurangkan.` }] : []),
  ];
  return {
    jenis: 'kekayaan-bersih', varian: `a${banyakAset}u${banyakUtang}`, tingkat: banyakAset === 3 ? 'dasar' : 'menengah', satuan: 'rupiah',
    pertanyaan: `Pada akhir bulan, ${nama} memiliki ${daftar(labelAset.map((l, i) => `${l} ${rp(aset[i])}`))}. Kewajibannya: ${daftar(labelUtang.map((l, i) => `${l} ${rp(utang[i])}`))}. Kekayaan bersih ${nama} adalah ....`,
    angka, benar: nw, salah,
    konsep: 'Kekayaan bersih (net worth) = total aset − total kewajiban, dihitung pada tanggal tertentu.',
    kataKunci: 'kekayaan bersih',
    langkah: [`Total aset = ${aset.map(rp).join(' + ')} = ${rp(totA)}.`, `Total kewajiban = ${rp(totU)}.`, `Kekayaan bersih = ${rp(totA)} − ${rp(totU)} = ${rp(nw)}.`],
    caraCepat: 'Net worth = aset − utang; kendaraan tetap masuk aset.',
    sumber: `${EB_PK}, subbab 3.1.6 dan contoh soal 4.4; ${SLK9}, Bab 2 Tahap 2 (Neraca Pribadi)`,
  };
}

function targetDarurat(r: Rng, nama: string): Rancangan | null {
  const k = r.pick([3, 6]);
  const esensial = kel(r, 2 * JT, 5 * JT, 250 * RB);
  const pilihan = kel(r, 500 * RB, 1.5 * JT, 250 * RB);
  const benar = k * esensial;
  const salah = [
    { nilai: k * (esensial + pilihan), alasan: `${rp(k * (esensial + pilihan))} memasukkan pengeluaran pilihan; target dana darurat memakai biaya esensial.` },
    { nilai: k * pilihan, alasan: `${rp(k * pilihan)} hanya mengalikan pengeluaran pilihan.` },
    { nilai: 12 * esensial, alasan: `${rp(12 * esensial)} adalah 12 bulan pengeluaran esensial, bukan ${k} bulan sesuai target.` },
    { nilai: esensial + pilihan, alasan: `${rp(esensial + pilihan)} adalah pengeluaran satu bulan, belum dikalikan ${k}.` },
  ];
  return {
    jenis: 'target-darurat', varian: `k${k}`, tingkat: 'dasar', satuan: 'rupiah',
    pertanyaan: `Pengeluaran esensial bulanan ${nama} ${rp(esensial)}, sedangkan pengeluaran pilihan (hiburan dan belanja tidak rutin) ${rp(pilihan)}. Jika target dana darurat ditetapkan ${k} kali pengeluaran esensial bulanan, besarnya target adalah ....`,
    angka: { kelipatan: k, esensial, pilihan }, benar, salah,
    konsep: 'Target dana darurat = biaya esensial bulanan × jumlah bulan target; kelipatan dalam contoh edukatif adalah asumsi, bukan angka wajib.',
    kataKunci: 'dana darurat dari biaya esensial',
    langkah: [`Target = ${k} × ${rp(esensial)} = ${rp(benar)}.`, 'Pengeluaran pilihan tidak dimasukkan karena target dihitung dari biaya esensial.'],
    caraCepat: 'Gunakan biaya esensial, bukan seluruh belanja.',
    sumber: `${EB_PK}, subbab 3.1.7, 3.1.13, dan contoh soal 4.5; ${SLK9}, Tabel 5 (likuiditas 3–6 kali)`,
  };
}

function waktuDarurat(r: Rng, nama: string): Rancangan | null {
  const k = r.pick([3, 6]);
  const setoran = r.pick([500 * RB, 1 * JT]);
  const esensial = kel(r, 2 * JT, 4.5 * JT, 500 * RB);
  const pilihan = kel(r, 500 * RB, 1.5 * JT, 500 * RB);
  const saldo = kel(r, 1 * JT, 8 * JT, setoran);
  const target = k * esensial;
  if (saldo >= target - 2 * setoran) return null;
  const benar = (target - saldo) / setoran;
  if (benar > 36) return null;
  const kandidat = [
    { nilai: target / setoran, alasan: `${target / setoran} bulan diperoleh bila saldo yang sudah terkumpul lupa dikurangkan.` },
    { nilai: (target + saldo) / setoran, alasan: `${(target + saldo) / setoran} bulan diperoleh bila saldo justru ditambahkan pada target.` },
    { nilai: (k * (esensial + pilihan) - saldo) / setoran, alasan: `${(k * (esensial + pilihan) - saldo) / setoran} bulan diperoleh bila target memasukkan pengeluaran pilihan.` },
    { nilai: k, alasan: `${k} adalah kelipatan target dana darurat, bukan lama menabung.` },
  ];
  if ([benar, ...kandidat.map((c) => c.nilai)].some((x) => !Number.isInteger(x) || x <= 0)) return null;
  return {
    jenis: 'waktu-darurat', varian: `k${k}`, tingkat: 'menantang', satuan: 'bulan',
    pertanyaan: `Pengeluaran esensial bulanan ${nama} ${rp(esensial)} dan pengeluaran pilihannya ${rp(pilihan)}. Ia menargetkan dana darurat ${k} kali pengeluaran esensial bulanan dan sudah memiliki ${rp(saldo)}. Jika ia menabung ${rp(setoran)} setiap bulan tanpa memperhitungkan bunga, target tercapai dalam waktu ....`,
    angka: { kelipatan: k, esensial, pilihan, saldo, setoran }, benar, salah: kandidat,
    konsep: 'Waktu mencapai target = (target − saldo terkumpul) ÷ setoran per periode, dengan asumsi tanpa hasil bunga dan tanpa perubahan biaya.',
    kataKunci: 'kekurangan target ÷ setoran',
    langkah: [`Target = ${k} × ${rp(esensial)} = ${rp(target)}.`, `Kekurangan = ${rp(target)} − ${rp(saldo)} = ${rp(target - saldo)}.`, `Waktu = ${rp(target - saldo)} ÷ ${rp(setoran)} = ${benar} bulan.`],
    caraCepat: 'Hitung kekurangan dahulu, bukan target total.',
    sumber: `${EB_PK}, subbab 3.1.7, 3.1.13, dan contoh soal 4.6`,
  };
}

function rasioCicilan(r: Rng, nama: string): Rancangan | null {
  const dua = r.pick([false, true]);
  const rasio = r.pick([15, 20, 25, 30, 35, 40]);
  const pendapatan = kel(r, 4 * JT, 12 * JT, 500 * RB);
  const total = (pendapatan * rasio) / 100;
  if (total % (50 * RB) !== 0) return null;
  const c1 = dua ? kel(r, total * 0.35, total * 0.7, 50 * RB) : total;
  const c2 = total - c1;
  if (dua && (c1 <= 0 || c2 <= 0 || c1 === c2)) return null;
  const pokok = kel(r, pendapatan * 0.3, pendapatan * 0.5, 100 * RB);
  const angka: Record<string, number> = dua ? { pendapatan, cicilan0: c1, cicilan1: c2, pokok } : { pendapatan, cicilan0: c1, pokok };
  const cicilanTeks = dua ? `cicilan KPR ${rp(c1)} dan cicilan kendaraan ${rp(c2)}` : `cicilan kendaraan ${rp(c1)}`;
  // semua opsi dibulatkan ke persen bulat (disebut di soal) agar kunci tidak menonjol sebagai satu-satunya bilangan bulat
  const salah = [
    { nilai: (total / (pendapatan - total)) * 100, alasan: 'Hasil itu diperoleh bila cicilan dibagi sisa penghasilan setelah cicilan, bukan dibagi penghasilan.' },
    { nilai: (total / pokok) * 100, alasan: 'Hasil itu diperoleh bila cicilan dibagi pengeluaran pokok, bukan penghasilan.' },
    { nilai: ((total + pokok) / pendapatan) * 100, alasan: 'Hasil itu memasukkan pengeluaran pokok ke pembilang; rasio cicilan hanya memakai cicilan.' },
    ...(dua
      ? [
          { nilai: (c1 / pendapatan) * 100, alasan: 'Hasil itu hanya memakai cicilan KPR; rasio memakai total seluruh cicilan.' },
          { nilai: (c2 / pendapatan) * 100, alasan: 'Hasil itu hanya memakai cicilan kendaraan; rasio memakai total seluruh cicilan.' },
        ]
      : []),
    { nilai: (total / (pendapatan - pokok)) * 100, alasan: 'Hasil itu diperoleh bila cicilan dibagi penghasilan yang sudah dikurangi pengeluaran pokok.' },
    { nilai: (total / (pokok + total)) * 100, alasan: 'Hasil itu membagi cicilan dengan total pengeluaran (pokok + cicilan), bukan dengan penghasilan.' },
  ].map((x) => ({ ...x, nilai: Math.round(x.nilai) }));
  return {
    jenis: 'rasio-cicilan', varian: dua ? '2cicilan' : '1cicilan', tingkat: dua ? 'menengah' : 'dasar', satuan: 'persen',
    pertanyaan: `Penghasilan bulanan ${nama} ${rp(pendapatan)}, pengeluaran pokoknya ${rp(pokok)}, dan ia membayar ${cicilanTeks} setiap bulan. Rasio cicilan terhadap penghasilan ${nama} (dibulatkan ke persen terdekat) adalah ....`,
    angka, benar: rasio, salah,
    konsep: 'Rasio cicilan = total cicilan per bulan ÷ pendapatan bulanan × 100%; batas yang lazim dipakai maksimal 30%. Rasio ini indikator, bukan keputusan akhir.',
    kataKunci: 'rasio cicilan terhadap penghasilan',
    langkah: [
      ...(dua ? [`Total cicilan = ${rp(c1)} + ${rp(c2)} = ${rp(total)}.`] : []),
      `Rasio = ${rp(total)} ÷ ${rp(pendapatan)} × 100% = ${rasio}%.`,
      'Pengeluaran pokok tidak dipakai dalam rumus rasio cicilan, tetapi tetap penting untuk menilai kemampuan bayar.',
    ],
    caraCepat: 'Pembilang = semua cicilan; penyebut = penghasilan.',
    sumber: `${EB_PK}, subbab 3.1.8, 3.1.13, dan contoh soal 4.7; ${BSC}, Bab II (Rasio Keuangan)`,
  };
}

const TUJUAN_FV = ['biaya tugas akhir', 'biaya pendidikan', 'biaya pernikahan', 'uang muka rumah', 'biaya kursus profesi'];

function fvInflasi(r: Rng, nama: string): Rancangan | null {
  const tahun = r.pick([2, 3]);
  const persenNaik = r.pick([4, 5, 6, 8, 10]);
  const pv = r.pick([5, 8, 10, 12, 15, 20, 25, 30]) * JT;
  const tujuan = r.pick(TUJUAN_FV);
  const f = (n: number) => Math.round(pv * Math.pow(1 + persenNaik / 100, n));
  const benar = f(tahun);
  const salah = [
    { nilai: pv * (1 + (tahun * persenNaik) / 100), alasan: `${rp(pv * (1 + (tahun * persenNaik) / 100))} memakai kenaikan sederhana (${tahun} × ${persenNaik}%), bukan majemuk.` },
    { nilai: f(1), alasan: `${rp(f(1))} hanya kenaikan satu tahun.` },
    { nilai: f(tahun + 1), alasan: `${rp(f(tahun + 1))} menghitung ${tahun + 1} tahun, bukan ${tahun} tahun.` },
    { nilai: benar - pv, alasan: `${rp(benar - pv)} hanya besar kenaikannya, bukan nilai biaya pada akhir periode.` },
  ];
  const langkah: string[] = [];
  for (let t = 1; t <= tahun; t++) langkah.push(`Tahun ${t}: ${rp(f(t - 1))} × ${(1 + persenNaik / 100).toFixed(2).replace('.', ',')} = ${rp(f(t))}.`);
  langkah.push(`Jadi FV = ${rp(pv)} × (1 + ${persenNaik}%)^${tahun} = ${rp(benar)}.`);
  return {
    jenis: 'fv-inflasi', varian: `n${tahun}`, tingkat: tahun === 2 ? 'menengah' : 'menantang', satuan: 'rupiah',
    pertanyaan: `${tujuan[0].toUpperCase()}${tujuan.slice(1)} yang direncanakan ${nama} saat ini ${rp(pv)}. Dengan asumsi biaya naik ${persenNaik}% per tahun secara majemuk, proyeksi biaya tersebut ${tahun} tahun lagi adalah ....`,
    angka: { pv, persen: persenNaik, tahun }, benar, salah, langkah,
    konsep: 'Proyeksi biaya masa depan: FV = PV × (1 + i)^n, dengan i tingkat kenaikan per periode dan n jumlah periode; asumsi tetap, bukan ramalan pasti.',
    kataKunci: 'kenaikan majemuk',
    caraCepat: 'Kalikan (1 + i) sebanyak n kali; jangan sekadar menjumlahkan persen.',
    sumber: `${EB_PK}, subbab 3.1.11 dan contoh soal 4.11; ${SLK9}, Bab 2 Tahap 1 (Tabel 1)`,
  };
}

function setoranBulanan(r: Rng, nama: string): Rancangan | null {
  const bulan = r.pick([6, 10, 12, 18, 24]);
  const setoran = kel(r, 300 * RB, 1.5 * JT, 50 * RB);
  const saldo = kel(r, 1 * JT, 5 * JT, 500 * RB);
  const target = setoran * bulan + saldo;
  const salah = [
    { nilai: target / bulan, alasan: `${rp(target / bulan)} diperoleh bila saldo awal lupa dikurangkan.` },
    { nilai: (target + saldo) / bulan, alasan: `${rp((target + saldo) / bulan)} diperoleh bila saldo awal justru ditambahkan.` },
    { nilai: target - saldo, alasan: `${rp(target - saldo)} adalah kekurangan total; belum dibagi ${bulan} bulan.` },
    ...(bulan !== 12 ? [{ nilai: (target - saldo) / 12, alasan: `${rp((target - saldo) / 12)} membagi dengan 12 bulan, padahal tenggatnya ${bulan} bulan.` }] : []),
    { nilai: saldo / bulan, alasan: `${rp(saldo / bulan)} hanya membagi saldo awal.` },
  ];
  if (salah.some((s) => !Number.isInteger(s.nilai))) return null;
  return {
    jenis: 'setoran-bulanan', varian: 'saldo', tingkat: 'menengah', satuan: 'rupiah',
    pertanyaan: `${nama} menargetkan dana ${rp(target)} dalam ${bulan} bulan dan sudah memiliki saldo awal ${rp(saldo)}. Tanpa memperhitungkan bunga, setoran rata-rata yang diperlukan setiap bulan adalah ....`,
    angka: { target, saldo, bulan }, benar: setoran, salah,
    konsep: 'Setoran periodik sederhana = (target − saldo terkumpul) ÷ jumlah periode, dengan asumsi tanpa hasil investasi dan target tetap.',
    kataKunci: 'setoran rata-rata per bulan',
    langkah: [`Kekurangan = ${rp(target)} − ${rp(saldo)} = ${rp(target - saldo)}.`, `Setoran = ${rp(target - saldo)} ÷ ${bulan} = ${rp(setoran)} per bulan.`],
    caraCepat: 'Kurangkan saldo awal, lalu bagi dengan jumlah bulan.',
    sumber: `${EB_PK}, subbab 3.1.11 dan 3.1.13`,
  };
}

const PORSI: Record<string, { persen: number; teks: string; tanya: string }> = {
  sosial: { persen: 10, teks: 'dana sosial', tanya: 'besar alokasi untuk dana sosial' },
  investasi: { persen: 20, teks: 'investasi (batas minimal)', tanya: 'batas minimal alokasi untuk investasi' },
  cicilan: { persen: 30, teks: 'cicilan utang (batas maksimal)', tanya: 'batas maksimal alokasi untuk membayar cicilan utang' },
  kebutuhan: { persen: 40, teks: 'kebutuhan sehari-hari', tanya: 'besar alokasi untuk kebutuhan sehari-hari' },
};

function porsiSisihkan(r: Rng, nama: string): Rancangan | null {
  const pos = r.pick(Object.keys(PORSI));
  const { persen: p, teks, tanya } = PORSI[pos];
  const penghasilan = kel(r, 4 * JT, 15 * JT, 500 * RB);
  const lain = Object.entries(PORSI).filter(([k]) => k !== pos);
  const salah = [
    ...lain.map(([, v]) => ({ nilai: (penghasilan * v.persen) / 100, alasan: `${rp((penghasilan * v.persen) / 100)} adalah ${v.persen}% untuk ${v.teks}, bukan porsi yang ditanyakan.` })),
    { nilai: (penghasilan * (100 - p)) / 100, alasan: `${rp((penghasilan * (100 - p)) / 100)} adalah sisa penghasilan setelah porsi ${teks}.` },
  ];
  return {
    jenis: 'porsi-sisihkan', varian: pos, tingkat: 'menengah', satuan: 'rupiah',
    pertanyaan: `Penghasilan bulanan ${nama} ${rp(penghasilan)}. Ia memakai prinsip "sisihkan, bukan sisakan" dengan pembagian sekitar 10% untuk dana sosial, minimal 20% untuk investasi, maksimal 30% untuk cicilan utang, dan 40% untuk kebutuhan sehari-hari. ${kapital(tanya)} adalah ....`,
    angka: { penghasilan, porsiPersen: p }, benar: (penghasilan * p) / 100, salah,
    konsep: 'Sisihkan sekitar 10% untuk dana sosial, minimal 20% untuk investasi, maksimal 30% untuk cicilan utang, dan sisa 40% untuk kebutuhan sehari-hari.',
    kataKunci: `porsi ${teks}`,
    langkah: [`Porsi ${teks} = ${p}%.`, `${p}% × ${rp(penghasilan)} = ${rp((penghasilan * p) / 100)}.`],
    caraCepat: 'Ingat urutan 10–20–30–40: sosial, investasi, cicilan, kebutuhan.',
    sumber: `${BSC}, Bab II (Sisihkan vs Sisakan)`,
  };
}

function rasioUtangAset(r: Rng, nama: string): Rancangan | null {
  const rasio = r.pick([20, 25, 30, 40, 45, 50, 60]);
  const totA = r.pick([40, 50, 60, 80, 100, 120, 160, 200]) * JT;
  const totU = (totA * rasio) / 100;
  if (totU % (500 * RB) !== 0) return null;
  const u0 = kel(r, totU * 0.5, totU * 0.85, 500 * RB);
  const u1 = totU - u0;
  const a0 = kel(r, totA * 0.1, totA * 0.25, JT);
  const a1 = kel(r, totA * 0.15, totA * 0.35, JT);
  const a2 = totA - a0 - a1;
  if (u1 <= 0 || a2 <= 0) return null;
  const salah = [
    { nilai: ((totA - totU) / totA) * 100, alasan: 'Hasil itu adalah rasio solvensi (kekayaan bersih ÷ total aset), bukan rasio utang.' },
    { nilai: (u0 / totA) * 100, alasan: 'Hasil itu hanya memakai sisa KPR; rasio memakai seluruh utang.' },
    { nilai: (u1 / totA) * 100, alasan: 'Hasil itu hanya memakai pinjaman kendaraan; rasio memakai seluruh utang.' },
    { nilai: (totU / (totA - totU)) * 100, alasan: 'Hasil itu membagi utang dengan kekayaan bersih, bukan dengan total aset.' },
    { nilai: (totU / (totA + totU)) * 100, alasan: 'Hasil itu menambahkan utang ke penyebut; penyebutnya cukup total aset.' },
  ].map((x) => ({ ...x, nilai: Math.round(x.nilai) }));
  return {
    jenis: 'rasio-utang-aset', varian: 'u2a3', tingkat: 'menantang', satuan: 'persen',
    pertanyaan: `${nama} memiliki tabungan ${rp(a0)}, investasi ${rp(a1)}, dan rumah senilai ${rp(a2)}. Utangnya terdiri atas sisa KPR ${rp(u0)} dan pinjaman kendaraan ${rp(u1)}. Rasio utang terhadap aset ${nama} (dibulatkan ke persen terdekat) adalah ....`,
    angka: { aset0: a0, aset1: a1, aset2: a2, utang0: u0, utang1: u1 }, benar: rasio, salah,
    konsep: 'Rasio utang terhadap aset = total utang ÷ total aset × 100%; batas sehatnya di bawah 50% (paling tinggi 50%).',
    kataKunci: 'rasio utang terhadap aset',
    langkah: [`Total aset = ${rp(a0)} + ${rp(a1)} + ${rp(a2)} = ${rp(totA)}.`, `Total utang = ${rp(u0)} + ${rp(u1)} = ${rp(totU)}.`, `Rasio = ${rp(totU)} ÷ ${rp(totA)} × 100% = ${rasio}%.`],
    caraCepat: 'Utang di atas, aset di bawah.',
    sumber: `${SLK9}, Bab 2 Tahap 2 (Tabel 5); ${BSC}, Bab II (Rasio Keuangan)`,
  };
}

const PEMBANGUN: ((r: Rng, nama: string) => Rancangan | null)[] = [
  arusKas, kekuranganTabungan, kekayaanBersih, targetDarurat, waktuDarurat, rasioCicilan, fvInflasi, setoranBulanan, porsiSisihkan, rasioUtangAset,
];

// ---------- family ----------

function periksaHitung(item: ItemHitung, j: JawabanPg): string[] {
  const m = periksaFormatPg(item);
  if (item.opsi.length !== 5) m.push('PSJK memakai lima opsi');
  if (!item.data.sumber.trim()) m.push('sumber fakta kosong');
  for (const o of item.opsi) if (o.label !== j && !item.data.alasanSalah[o.teks]) m.push(`opsi ${o.label} tanpa alasan salah`);
  if (item.opsi.some((o) => /^−/.test(o.teks.replace('Rp', '')))) m.push('opsi bernilai negatif');
  return m;
}

export const pkHitung: Family<ItemHitung, JawabanPg> = {
  id: ID,
  versi: 2,
  nama: 'Hitungan perencanaan keuangan',
  chapter: chapterById('perencanaan-keuangan'),
  label: 'VARIASI',
  sumber: `${EB_PK}, subbab 3.1.4–3.1.13 (rangkuman model hitung) dan contoh soal 4.3–4.11; ${SLK9}, Bab 2; ${BSC}, Bab II`,
  ringkas: 'Sepuluh jenis hitungan (arus kas, kekurangan target tabungan, kekayaan bersih, target dan lama dana darurat, rasio cicilan, proyeksi biaya dengan kenaikan majemuk, setoran bulanan, porsi "sisihkan", rasio utang terhadap aset). Solver menghitung ulang dari angka soal; pengecoh dari jalur kesalahan hitung.',
  bangun(r) {
    const nama = r.pick(NAMA);
    const rc = r.pick(PEMBANGUN)(r, nama);
    if (!rc) return null;
    const teksBenar = formatNilai(rc.satuan, rc.benar);
    // pengecoh: buang yang tidak sah atau kembar, lalu ambil empat
    const lihat = new Set([teksBenar]);
    const sah = rc.salah.filter((s) => {
      const t = formatNilai(rc.satuan, s.nilai);
      // persentase ≥ 100% bukan pengecoh yang masuk akal untuk rasio cicilan/utang
      if (s.nilai <= 0 || (rc.satuan === 'persen' && s.nilai >= 100) || lihat.has(t)) return false;
      lihat.add(t);
      return true;
    });
    if (sah.length < 4) return null;
    const pilih = r.sample(sah, 4);
    const { opsi, kunci } = susunOpsi(r.shuffle, teksBenar, pilih.map((s) => formatNilai(rc.satuan, s.nilai)), (t) => t);
    const item: ItemHitung = {
      jenis: 'pilihan-ganda', instruksi: INSTRUKSI_PSJK, pertanyaan: rc.pertanyaan, stimulus: [], opsi, tingkat: rc.tingkat,
      kaidah: rc.jenis, konteks: 'perencanaan-keuangan',
      data: {
        jenis: rc.jenis, varian: rc.varian, angka: rc.angka, satuan: rc.satuan,
        alasanSalah: Object.fromEntries(pilih.map((s) => [formatNilai(rc.satuan, s.nilai), s.alasan])),
        konsep: rc.konsep, kataKunci: rc.kataKunci, langkah: rc.langkah, caraCepat: rc.caraCepat, sumber: rc.sumber, berlakuPer: rc.berlakuPer,
      },
    };
    return { item, jawaban: kunci };
  },
  pecahkan(item) {
    const t = formatNilai(item.data.satuan, selesaikan(item.data.jenis, item.data.angka));
    return item.opsi.filter((o) => o.teks === t).map((o) => o.label);
  },
  kunci: (j) => j,
  periksa: periksaHitung,
  bahas(item, j) {
    const d = item.data;
    const opsiSalah: Record<string, string> = {};
    for (const o of item.opsi) if (o.label !== j) opsiSalah[o.label] = d.alasanSalah[o.teks];
    const p = bahasPg({ item, kunci: j, konsep: d.konsep, kataKunci: d.kataKunci, alasan: d.langkah, opsiSalah, caraCepat: d.caraCepat });
    if (!p) return null;
    return p; // sumber penyusunan tetap di item.data.sumber (metadata internal), tidak dicetak di pembahasan peserta (QC T09)
  },
  sidik: (item) => `${ID}|${item.data.jenis}|${item.data.varian}`,
};
