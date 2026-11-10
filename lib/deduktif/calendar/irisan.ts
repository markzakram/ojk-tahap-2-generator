import type { Rng } from '../../core/rng';
import type { Family, Label, LangkahPembahasan } from '../../core/types';
import { chapterById } from '../../data/chapters';
import { HARI, NAMA_KALENDER, daftarKata } from '../../data/nama';
import {
  MAKS_PILIHAN, hariDari, hariKerja, tanggalCocok, teksKartu, teksKendala, terapkan,
  type CalendarItem, type Kalender, type KendalaTanggal, type Operator,
} from './model';

// Blueprint Calendar Date Selection — profil CDS-A "Irisan ketersediaan".
// Sumber TERAMATI: contoh 1.pdf hlm. 1 (Team Schedule). Empat orang, empat kartu: tiga kartu satu klausa dan satu kartu dua klausa.
// Isi kartu: dua ketersediaan mingguan positif, satu hari tidak tersedia, dua rentang cuti pada dua orang.
// Kalender versi pertama dipertahankan seperti sumber: 30 hari, tanggal 1 jatuh pada Minggu.

const KALENDER_A: Kalender = { jumlahHari: 30, hariPertama: 0 };
const JUDUL = ['Jadwal Tim', 'Rapat Koordinasi', 'Pertemuan Proyek', 'Rapat Evaluasi Tim'];
const KATA_ANGKA = ['nol', 'satu', 'dua', 'tiga', 'empat', 'lima'];
const HARI_KERJA = [1, 2, 3, 4, 5];

function pertanyaan(op: Operator): string {
  switch (op.jenis) {
    case 'paling-awal': return 'Pilih tanggal hari kerja paling awal ketika seluruh anggota tim dapat bertemu.';
    case 'paling-akhir': return 'Pilih tanggal hari kerja paling akhir pada bulan ini ketika seluruh anggota tim dapat bertemu.';
    case 'semua': return 'Pilih semua tanggal hari kerja pada bulan ini ketika seluruh anggota tim dapat bertemu.';
    case 'k-pertama': return `Pilih ${KATA_ANGKA[op.k]} tanggal hari kerja pertama ketika seluruh anggota tim dapat bertemu.`;
  }
}

/** Tanggal hari kerja yang lolos semua aturan mingguan (sebelum cuti diterapkan). */
const lolosMingguan = (item: CalendarItem) => tanggalCocok(item, item.kendala.filter((k) => k.jenis !== 'cuti'));

function bangunIrisan(r: Rng, op: Operator): { item: CalendarItem; jawaban: number[] } | null {
  const sorted = (xs: number[]) => [...xs].sort((a, b) => a - b);
  const pos1 = sorted(r.sample(HARI_KERJA, r.pick([1, 2])));
  const pos2 = sorted(r.sample(HARI_KERJA, r.pick([2, 3])));
  const neg = sorted(r.sample(HARI_KERJA, r.pick([1, 2])));
  if (pos1.join() === pos2.join()) return null;
  const bersama = HARI_KERJA.filter((h) => pos1.includes(h) && pos2.includes(h) && !neg.includes(h));
  if (bersama.length < 1 || bersama.length > 2) return null;

  // Bangun solusi dulu, baru turunkan petunjuk: tentukan kandidat mingguan W, lalu letakkan dua rentang cuti yang sengaja
  // menggugurkan kandidat tertentu (sumber: cuti 2–13 menggugurkan tanggal 3 dan 10; cuti 24–26 menggugurkan 24).
  const W: number[] = [];
  for (let t = 1; t <= KALENDER_A.jumlahHari; t++) if (bersama.includes(hariDari(KALENDER_A, t))) W.push(t);
  const n = W.length;
  const m = r.pick([1, 2]);
  let gugurAwal: [number, number]; // indeks W [lo, hi] yang digugurkan cuti pertama
  let gugurLain: [number, number];
  switch (op.jenis) {
    case 'paling-awal':
    case 'k-pertama': {
      const sisa = op.jenis === 'k-pertama' ? op.k : 1;
      if (n < m + sisa + 1) return null;
      gugurAwal = [0, m - 1];
      const j = r.int(m + 1, n - 1);
      gugurLain = [j, j];
      break;
    }
    case 'paling-akhir': {
      if (n < m + 2) return null;
      gugurLain = [n - m, n - 1];
      const j = r.int(0, n - m - 2);
      gugurAwal = [j, j];
      break;
    }
    case 'semua': {
      const a = r.int(0, n - 3);
      gugurAwal = [a, a];
      const b = r.int(a + 2, n - 1);
      gugurLain = [b, b];
      break;
    }
  }
  // Rentang tanggal yang mencakup W[lo..hi] tanpa menyentuh kandidat tetangga, diperlebar 0–3 hari secara acak.
  const rentang = ([lo, hi]: [number, number]) => {
    const kiri = lo > 0 ? W[lo - 1] + 1 : 1;
    const kanan = hi < n - 1 ? W[hi + 1] - 1 : KALENDER_A.jumlahHari;
    const dari = Math.max(kiri, W[lo] - r.int(0, 3));
    const sampai = Math.min(kanan, W[hi] + r.int(0, 3));
    return sampai > dari ? { dari, sampai } : null;
  };
  const cutiB = rentang(gugurAwal);
  const cutiA = rentang(gugurLain);
  if (!cutiA || !cutiB) return null;

  const nama = r.sample(NAMA_KALENDER, 4);
  const [pa, pb, pc, pd] = ['o1', 'o2', 'o3', 'o4'];
  const [posC, posD] = r.pick([[pos1, pos2], [pos2, pos1]]);
  // Struktur kartu sumber: (hari tidak tersedia + cuti), (cuti), (hanya hari), (hanya hari). Cuti mana yang menempel
  // pada kartu dua klausa diacak.
  const [cutiDua, cutiSatu] = r.pick([[cutiA, cutiB], [cutiB, cutiA]]);
  const kartu: { id: string; kendala: KendalaTanggal[] }[] = [
    { id: pa, kendala: [{ jenis: 'tidak-hari', orang: pa, hari: neg }, { jenis: 'cuti', orang: pa, ...cutiDua }] },
    { id: pb, kendala: [{ jenis: 'cuti', orang: pb, ...cutiSatu }] },
    { id: pc, kendala: [{ jenis: 'hanya-hari', orang: pc, hari: posC }] },
    { id: pd, kendala: [{ jenis: 'hanya-hari', orang: pd, hari: posD }] },
  ];
  const urutan = r.shuffle(kartu);
  const item: CalendarItem = {
    jenis: 'calendar-date',
    profil: 'A',
    judul: r.pick(JUDUL),
    paragraf: [],
    pertanyaan: pertanyaan(op),
    kalender: KALENDER_A,
    maksPilihan: MAKS_PILIHAN,
    orang: urutan.map((k, i) => ({ id: k.id, nama: nama[i], petunjuk: teksKartu(k.kendala.map(teksKendala)) })),
    kendala: urutan.flatMap((k) => k.kendala),
    operator: op,
  };
  const jawaban = terapkan(op, tanggalCocok(item, item.kendala));
  return jawaban ? { item, jawaban } : null;
}

function periksa(item: CalendarItem, jawaban: number[]): string[] {
  const masalah: string[] = [];
  const mingguan = lolosMingguan(item);
  const cocok = tanggalCocok(item, item.kendala);
  const cuti = item.kendala.filter((k): k is Extract<KendalaTanggal, { jenis: 'cuti' }> => k.jenis === 'cuti');
  if (item.orang.length !== 4) masalah.push('jumlah orang bukan empat');
  if (jawaban.length < 1 || jawaban.length > MAKS_PILIHAN) masalah.push('panjang kunci di luar 1–5');
  // Setiap rentang cuti harus menggugurkan minimal satu tanggal yang lolos aturan mingguan (punya fungsi penyaringan).
  for (const c of cuti) if (!mingguan.some((t) => t >= c.dari && t <= c.sampai)) masalah.push('ada cuti yang tidak menyaring');
  if (cuti.length === 2 && cuti[0].dari <= cuti[1].sampai && cuti[1].dari <= cuti[0].sampai) masalah.push('rentang cuti bertumpuk');
  switch (item.operator.jenis) {
    case 'paling-awal':
    case 'k-pertama':
      // "Buat kandidat lebih awal gugur oleh kendala yang diberikan" — tanggal pertama yang lolos aturan mingguan harus gugur karena cuti.
      if (cocok[0] === mingguan[0]) masalah.push('kandidat paling awal tidak gugur oleh cuti');
      if (item.operator.jenis === 'k-pertama' && cocok.length <= item.operator.k) masalah.push('kandidat tidak lebih banyak dari k');
      break;
    case 'paling-akhir':
      if (cocok[cocok.length - 1] === mingguan[mingguan.length - 1]) masalah.push('kandidat paling akhir tidak gugur oleh cuti');
      break;
    case 'semua':
      if (cocok.length < 2) masalah.push('jawaban "semua tanggal" hanya satu');
      break;
  }
  return masalah;
}

function bahas(item: CalendarItem, jawaban: number[]) {
  const nama = (id: string) => item.orang.find((o) => o.id === id)!.nama;
  const langkah: LangkahPembahasan[] = [];
  const mingguanK = item.kendala.filter((k) => k.jenis !== 'cuti');
  const hariBersama = [1, 2, 3, 4, 5].filter((h) => mingguanK.every((k) => k.jenis === 'hanya-hari' ? k.hari.includes(h) : k.jenis === 'tidak-hari' ? !k.hari.includes(h) : true));
  const aturan = mingguanK.map((k) => `${nama(k.orang)} ${k.jenis === 'hanya-hari' ? 'hanya' : 'tidak'} ${daftarKata((k as { hari: number[] }).hari.map((h) => HARI[h]))}`);
  langkah.push({ teks: `Aturan mingguan: ${daftarKata(aturan)}. Hari kerja yang cocok untuk semua anggota: ${daftarKata(hariBersama.map((h) => HARI[h]))}.` });
  const mingguan = lolosMingguan(item);
  langkah.push({ teks: `Tanggal hari ${daftarKata(hariBersama.map((h) => HARI[h]))} pada kalender: ${daftarKata(mingguan.map(String))}.` });
  for (const k of item.kendala) if (k.jenis === 'cuti') {
    const gugur = mingguan.filter((t) => t >= k.dari && t <= k.sampai);
    langkah.push({ teks: `${nama(k.orang)} cuti tanggal ${k.dari}–${k.sampai}, sehingga tanggal ${daftarKata(gugur.map(String))} gugur.` });
  }
  const cocok = tanggalCocok(item, item.kendala);
  if (!hariBersama.length || cocok.some((t) => !hariKerja(item.kalender, t))) return null;
  langkah.push({ teks: `Tanggal yang tersisa: ${daftarKata(cocok.map(String))}.` });
  const op = item.operator;
  const akhir = op.jenis === 'paling-awal' ? `Yang paling awal adalah tanggal ${jawaban[0]}.`
    : op.jenis === 'paling-akhir' ? `Yang paling akhir adalah tanggal ${jawaban[0]}.`
    : op.jenis === 'semua' ? `Seluruh tanggal tersebut dipilih (${jawaban.length} tanggal).`
    : `${KATA_ANGKA[op.k][0].toUpperCase() + KATA_ANGKA[op.k].slice(1)} tanggal pertama adalah ${daftarKata(jawaban.map(String))}.`;
  langkah.push({ teks: akhir });
  return {
    jawaban: `Tanggal ${daftarKata(jawaban.map(String))} (${daftarKata([...new Set(jawaban.map((t) => HARI[hariDari(item.kalender, t)]))])})`,
    langkah,
    caraCepat: 'Tentukan dulu hari yang lolos semua aturan mingguan, lalu coret tanggal yang jatuh pada masa cuti.',
  };
}

function sidik(item: CalendarItem): string {
  const kartu = item.orang.map((o) => item.kendala.filter((k) => k.orang === o.id).map((k) => {
    const { orang: _o, ...isi } = k;
    return JSON.stringify(isi);
  }).sort().join('+')).sort();
  return `cds-a:${JSON.stringify(item.operator)}:${kartu.join('|')}`;
}

function familyIrisan(id: string, nama: string, label: Label, operator: (r: Rng) => Operator, ringkas: string, sumber: string): Family<CalendarItem, number[]> {
  return {
    id, versi: 1, nama, label, ringkas, sumber,
    chapter: chapterById('calendar-date-selection'),
    bangun: (r) => bangunIrisan(r, operator(r)),
    pecahkan(item) {
      const hasil = terapkan(item.operator, tanggalCocok(item, item.kendala));
      return hasil ? [hasil] : [];
    },
    kunci: (a) => [...a].sort((x, y) => x - y).join(','),
    periksa,
    bahas,
    sidik,
  };
}

const SUMBER = 'Blueprint Calendar Date Selection §2 CDS-A · contoh 1.pdf hlm. 1 (Team Schedule)';
const RINGKAS = 'Empat orang: dua kartu "hanya tersedia pada hari …", satu "tidak tersedia pada hari …", dan dua rentang cuti. Kalender 30 hari, tanggal 1 hari Minggu.';

export const calendarIrisanA0 = familyIrisan('CDS-A0', 'Irisan ketersediaan — tanggal paling awal', 'SHL', () => ({ jenis: 'paling-awal' }), RINGKAS + ' Kunci satu tanggal.', SUMBER);
export const calendarIrisanA1 = familyIrisan('CDS-A1', 'Irisan ketersediaan — tanggal paling akhir', 'VARIASI', () => ({ jenis: 'paling-akhir' }), RINGKAS + ' Variasi: tanggal paling akhir.', SUMBER + ' · variasi A1 (§7)');
export const calendarIrisanA2 = familyIrisan('CDS-A2', 'Irisan ketersediaan — semua tanggal', 'VARIASI', () => ({ jenis: 'semua' }), RINGKAS + ' Variasi: semua tanggal yang cocok (2–5 tanggal).', SUMBER + ' · variasi A2 (§7)');
export const calendarIrisanA3 = familyIrisan('CDS-A3', 'Irisan ketersediaan — k tanggal pertama', 'VARIASI', (r) => ({ jenis: 'k-pertama', k: r.pick([2, 3]) }), RINGKAS + ' Variasi: dua atau tiga tanggal pertama.', SUMBER + ' · variasi A3 (§7)');
