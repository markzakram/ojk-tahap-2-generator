import type { Rng } from '../../core/rng';
import type { Family, Label, LangkahPembahasan } from '../../core/types';
import { chapterById } from '../../data/chapters';
import { daftarKata } from '../../data/nama';
import { MAKS_PILIHAN, hariKerja, type CalendarTampilan, type Kalender } from './model';

// Blueprint Calendar Date Selection — profil CDS-C "Sesi beberapa hari dengan jeda dan ketergantungan".
// Sumber TERAMATI: deduktif.pdf hlm. 21–22 (Training Schedule). Empat sesi, tiap sesi tiga hari kerja berturut-turut, jeda dua
// hari kerja setelah sesi kedua, dua tanggal larangan global; kartu: satu "sesudah", satu "tidak tepat sebelum/sesudah",
// satu rentang tidak tersedia, satu "tidak boleh pertama". Kalender 28 hari, tanggal 1 hari Rabu.
//
// PERLU DIJELASKAN (§2 "Makna kalender yang wajib dikunci"): sumber tidak menyatakan awal jadwal dan kebijakan celah, sehingga
// kuncinya tidak boleh diterbitkan ulang. Generator ini menyatakan aturannya secara eksplisit di soal:
//  - jadwal dimulai tanggal 1; sesi dilaksanakan satu per satu;
//  - setiap sesi dimulai pada hari kerja paling awal yang memungkinkan setelah sesi sebelumnya selesai;
//  - jeda dua hari kerja dihitung setelah hari terakhir sesi kedua (akhir pekan dilewati);
//  - tanggal larangan tetap hari kerja (ikut terhitung dalam jeda), tetapi tidak boleh dipakai sesi; tiga hari "berturut-turut"
//    tidak boleh melompati tanggal larangan;
//  - rentang tidak tersedia milik satu sesi membuat sesi itu menunggu sampai rentangnya lewat.

export type KendalaSesi =
  | { jenis: 'sesudah'; sesi: string; acuan: string }
  | { jenis: 'tidak-berdampingan'; sesi: string; acuan: string }
  | { jenis: 'tidak-tersedia'; sesi: string; dari: number; sampai: number }
  | { jenis: 'tidak-pertama'; sesi: string };

export type TanyaSesi = 'semua' | 'mulai' | 'selesai' | 'mulai-selesai';

export interface SesiItem extends CalendarTampilan {
  profil: 'C';
  hariPerSesi: number;
  jedaSetelahSesiKe: number;
  jeda: number;
  larangan: number[];
  kendala: KendalaSesi[];
  target: string;
  tanya: TanyaSesi;
}

const KALENDER_C: Kalender = { jumlahHari: 28, hariPertama: 3 };
const SET_SESI = [
  { judul: 'Jadwal Pelatihan', sesi: ['Orientasi', 'Kebijakan Perusahaan', 'Perlindungan Data', 'Keamanan TI'] },
  { judul: 'Pelatihan Pegawai Baru', sesi: ['Pengenalan Produk', 'Etika Kerja', 'Manajemen Risiko', 'Sistem Pelaporan'] },
  { judul: 'Pelatihan Keuangan', sesi: ['Dasar Akuntansi', 'Perpajakan', 'Audit Internal', 'Pelaporan Keuangan'] },
  { judul: 'Pelatihan Layanan', sesi: ['Layanan Nasabah', 'Penanganan Keluhan', 'Kerahasiaan Data', 'Aplikasi Layanan'] },
];

const hariKerjaBulan = (k: Kalender) => Array.from({ length: k.jumlahHari }, (_, i) => i + 1).filter((t) => hariKerja(k, t));
const permutasi = (xs: string[]): string[][] =>
  xs.length <= 1 ? [xs] : xs.flatMap((x, i) => permutasi([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p]));

/** Jadwal deterministik untuk satu urutan sesi menurut aturan yang tertulis di soal; `null` bila tidak muat dalam bulan. */
export function jadwalUrutan(item: Pick<SesiItem, 'kalender' | 'hariPerSesi' | 'jedaSetelahSesiKe' | 'jeda' | 'larangan' | 'kendala'>, urut: string[]): number[][] | null {
  const W = hariKerjaBulan(item.kalender);
  const hasil: number[][] = [];
  let pos = 0;
  for (let k = 0; k < urut.length; k++) {
    if (k === item.jedaSetelahSesiKe) pos += item.jeda;
    const tt = item.kendala.filter((x): x is Extract<KendalaSesi, { jenis: 'tidak-tersedia' }> => x.jenis === 'tidak-tersedia' && x.sesi === urut[k]);
    const boleh = (t: number) => !item.larangan.includes(t) && tt.every((x) => t < x.dari || t > x.sampai);
    let p = pos;
    while (p + item.hariPerSesi <= W.length && !W.slice(p, p + item.hariPerSesi).every(boleh)) p++;
    if (p + item.hariPerSesi > W.length) return null;
    hasil.push(W.slice(p, p + item.hariPerSesi));
    pos = p + item.hariPerSesi;
  }
  return hasil;
}

function cocokUrutan(k: KendalaSesi, urut: string[]): boolean {
  const i = (s: string) => urut.indexOf(s);
  switch (k.jenis) {
    case 'sesudah': return i(k.sesi) > i(k.acuan);
    case 'tidak-berdampingan': return Math.abs(i(k.sesi) - i(k.acuan)) !== 1;
    case 'tidak-pertama': return i(k.sesi) !== 0;
    case 'tidak-tersedia': return true;
  }
}

export function semuaJadwal(item: SesiItem): { urut: string[]; jadwal: number[][] }[] {
  return permutasi(item.orang.map((o) => o.id))
    .filter((u) => item.kendala.every((k) => cocokUrutan(k, u)))
    .map((u) => ({ urut: u, jadwal: jadwalUrutan(item, u) }))
    .filter((x): x is { urut: string[]; jadwal: number[][] } => x.jadwal !== null);
}

const proyeksi = (tanya: TanyaSesi, d: number[]) =>
  tanya === 'semua' ? [...d] : tanya === 'mulai' ? [d[0]] : tanya === 'selesai' ? [d[d.length - 1]] : [d[0], d[d.length - 1]];

function teks(k: KendalaSesi, nama: (id: string) => string): string {
  switch (k.jenis) {
    case 'sesudah': return `Dilaksanakan sesudah sesi ${nama(k.acuan)}.`;
    case 'tidak-berdampingan': return `Tidak boleh tepat sebelum atau tepat sesudah sesi ${nama(k.acuan)}.`;
    case 'tidak-tersedia': return `Tidak dapat dilaksanakan tanggal ${k.dari}–${k.sampai}.`;
    case 'tidak-pertama': return 'Tidak boleh menjadi sesi pertama.';
  }
}

function pertanyaan(tanya: TanyaSesi, n: string) {
  return tanya === 'semua' ? `Pilih semua tanggal pelaksanaan sesi ${n}.`
    : tanya === 'mulai' ? `Pilih tanggal mulai sesi ${n}.`
    : tanya === 'selesai' ? `Pilih tanggal selesai sesi ${n}.`
    : `Pilih tanggal mulai dan tanggal selesai sesi ${n}.`;
}

function bangun(r: Rng, tanya: TanyaSesi): { item: SesiItem; jawaban: number[] } | null {
  const set = r.pick(SET_SESI);
  const ids = ['s1', 's2', 's3', 's4'];
  const urut = r.shuffle(ids);
  const W = hariKerjaBulan(KALENDER_C);
  const larangan = r.sample(W.slice(0, -3), 2).sort((a, b) => a - b);
  // Kartu: satu per sesi. Pemilik "tidak pertama" bukan sesi pertama; "sesudah" mengacu sesi yang lebih awal; "tidak berdampingan"
  // mengacu sesi yang tidak bersebelahan dalam urutan; rentang tidak tersedia tidak menyentuh jadwal sesi itu sendiri.
  let peran: string[] | null = null;
  for (let coba = 0; coba < 20 && !peran; coba++) {
    const [pS, pB, , pP] = r.shuffle(ids);
    const adaJauh = ids.some((x) => x !== pB && Math.abs(urut.indexOf(x) - urut.indexOf(pB)) > 1);
    if (urut.indexOf(pP) !== 0 && urut.indexOf(pS) > 0 && adaJauh) peran = [pS, pB, ids.find((x) => ![pS, pB, pP].includes(x))!, pP];
  }
  if (!peran) return null;
  const [pSesudah, pBerdampingan, pRentang, pPertama] = peran;
  const sebelumnya = urut.slice(0, urut.indexOf(pSesudah));
  const jauh = ids.filter((x) => x !== pBerdampingan && Math.abs(urut.indexOf(x) - urut.indexOf(pBerdampingan)) > 1);
  const pekan = [[6, 10], [13, 17], [20, 24]];
  const [a, b] = r.pick(pekan);
  const dari = a + r.int(0, 1);
  const sampai = b - r.int(0, 1);
  const kendala: KendalaSesi[] = [
    { jenis: 'sesudah', sesi: pSesudah, acuan: r.pick(sebelumnya) },
    { jenis: 'tidak-berdampingan', sesi: pBerdampingan, acuan: r.pick(jauh) },
    { jenis: 'tidak-tersedia', sesi: pRentang, dari, sampai },
    { jenis: 'tidak-pertama', sesi: pPertama },
  ];
  const nama = (id: string) => set.sesi[ids.indexOf(id)];
  const tampil = r.shuffle(ids);
  const target = r.pick(ids);
  const item: SesiItem = {
    jenis: 'calendar-date',
    profil: 'C',
    judul: set.judul,
    paragraf: [
      'Empat sesi pelatihan dilaksanakan satu per satu mulai tanggal 1, hanya pada hari kerja (Senin–Jumat).',
      'Setiap sesi berlangsung tiga hari kerja berturut-turut dan dimulai pada hari kerja paling awal yang memungkinkan setelah sesi sebelumnya selesai.',
      'Setelah dua sesi pertama selesai, ada jeda dua hari kerja sebelum sesi ketiga dimulai.',
      `Tanggal ${larangan[0]} dan ${larangan[1]} tidak boleh dipakai untuk sesi, tetapi tetap dihitung sebagai hari kerja.`,
    ],
    pertanyaan: pertanyaan(tanya, nama(target)),
    kalender: KALENDER_C,
    maksPilihan: MAKS_PILIHAN,
    orang: tampil.map((id) => ({ id, nama: nama(id), petunjuk: [teks(kendala.find((k) => k.sesi === id)!, nama)] })),
    hariPerSesi: 3,
    jedaSetelahSesiKe: 2,
    jeda: 2,
    larangan,
    kendala: tampil.map((id) => kendala.find((k) => k.sesi === id)!),
    target,
    tanya,
  };
  const jadwal = jadwalUrutan(item, urut);
  if (!jadwal) return null;
  return { item, jawaban: proyeksi(tanya, jadwal[urut.indexOf(target)]) };
}

function bahas(item: SesiItem, jawaban: number[]) {
  const nama = (id: string) => item.orang.find((o) => o.id === id)!.nama;
  const langkah: LangkahPembahasan[] = [];
  const lolosUrutan = permutasi(item.orang.map((o) => o.id)).filter((u) => item.kendala.every((k) => cocokUrutan(k, u)));
  langkah.push({ teks: `Kartu urutan (sesudah, tidak berdampingan, tidak pertama) menyisakan ${lolosUrutan.length} urutan: ${lolosUrutan.map((u) => u.map(nama).join(' – ')).join('; ')}.` });
  let akhir: { urut: string[]; jadwal: number[][] } | null = null;
  for (const u of lolosUrutan) {
    const j = jadwalUrutan(item, u);
    if (!j) { langkah.push({ teks: `Urutan ${u.map(nama).join(' – ')} gugur: dengan tanggal larangan, jeda, dan rentang tidak tersedia, sesi terakhir tidak muat sampai tanggal ${item.kalender.jumlahHari}.` }); continue; }
    if (akhir) return null;
    akhir = { urut: u, jadwal: j };
  }
  if (!akhir) return null;
  const W = hariKerjaBulan(item.kalender);
  const akhirSesi2 = akhir.jadwal[1][2];
  const jeda = W.slice(W.indexOf(akhirSesi2) + 1, W.indexOf(akhirSesi2) + 1 + item.jeda);
  langkah.push({ teks: `Urutan yang tersisa: ${akhir.urut.map(nama).join(' – ')}. Jadwalnya: ${akhir.urut.map((s, i) => `${nama(s)} ${daftarKata(akhir!.jadwal[i].map(String))}`).join('; ')}.` });
  langkah.push({ teks: `Pemeriksaan: jeda setelah sesi kedua jatuh pada tanggal ${daftarKata(jeda.map(String))}; tanggal ${daftarKata(item.larangan.map(String))} tidak dipakai sesi mana pun; semua kartu terpenuhi.` });
  const d = akhir.jadwal[akhir.urut.indexOf(item.target)];
  langkah.push({ teks: `Sesi ${nama(item.target)} berlangsung tanggal ${daftarKata(d.map(String))}.` });
  if (proyeksi(item.tanya, d).join() !== jawaban.join()) return null;
  return {
    jawaban: `Tanggal ${daftarKata(jawaban.map(String))}`,
    langkah,
    caraCepat: 'Saring urutan sesi dengan kartu urutan dulu, lalu susun tanggalnya satu per satu; urutan yang tidak muat sampai akhir bulan gugur.',
  };
}

function familySesi(id: string, nm: string, label: Label, tanya: TanyaSesi, ringkas: string, sumber: string): Family<SesiItem, number[]> {
  return {
    id, versi: 1, nama: nm, label, ringkas, sumber, maksPercobaan: 2000,
    chapter: chapterById('calendar-date-selection'),
    bangun: (r) => bangun(r, tanya),
    pecahkan: (item) => semuaJadwal(item).map(({ urut, jadwal }) => proyeksi(item.tanya, jadwal[urut.indexOf(item.target)])),
    kunci: (a) => [...a].sort((x, y) => x - y).join(','),
    periksa(item) {
      const masalah: string[] = [];
      // Utamakan jadwal lengkap yang unik agar pembahasan pasti.
      if (semuaJadwal(item).length !== 1) masalah.push('jadwal lengkap tidak tunggal');
      // Rentang tidak tersedia harus berpengaruh: tanpa kartu itu, jadwal tidak lagi tunggal atau berubah.
      const tanpa = semuaJadwal({ ...item, kendala: item.kendala.filter((k) => k.jenis !== 'tidak-tersedia') });
      const dengan = semuaJadwal(item);
      if (tanpa.length === 1 && JSON.stringify(tanpa[0]) === JSON.stringify(dengan[0])) masalah.push('rentang tidak tersedia tidak berfungsi');
      return masalah;
    },
    bahas,
    sidik(item) {
      const [sol] = semuaJadwal(item);
      const pos = (id: string) => sol.urut.indexOf(id);
      const k = item.kendala.map((x) => x.jenis === 'tidak-tersedia' ? `t${pos(x.sesi)}:${x.dari}-${x.sampai}` : x.jenis === 'tidak-pertama' ? `p${pos(x.sesi)}` : `${x.jenis[0]}${x.jenis[6] ?? ''}${pos(x.sesi)}${pos(x.acuan)}`).sort().join(',');
      return `cds-c:${item.tanya}:${pos(item.target)}:${item.larangan.join('-')}:${k}`;
    },
  };
}

const SUMBER = 'Blueprint Calendar Date Selection §2 CDS-C · deduktif.pdf hlm. 21–22 (Training Schedule; aturan awal jadwal dan celah dinyatakan eksplisit)';
const RINGKAS = 'Empat sesi, masing-masing tiga hari kerja berturut-turut, jeda dua hari kerja setelah sesi kedua, dua tanggal larangan. Kartu: sesudah, tidak berdampingan, rentang tidak tersedia, tidak pertama. Kalender 28 hari, tanggal 1 hari Rabu.';

export const calendarSesiC0 = familySesi('CDS-C0', 'Sesi beberapa hari — semua tanggal sesi', 'SHL', 'semua', RINGKAS + ' Kunci tiga tanggal.', SUMBER);
export const calendarSesiC1 = familySesi('CDS-C1', 'Sesi beberapa hari — tanggal mulai', 'VARIASI', 'mulai', RINGKAS + ' Variasi: tanggal mulai.', SUMBER + ' · variasi C1 (§7)');
export const calendarSesiC2 = familySesi('CDS-C2', 'Sesi beberapa hari — tanggal selesai', 'VARIASI', 'selesai', RINGKAS + ' Variasi: tanggal selesai.', SUMBER + ' · variasi C2 (§7)');
export const calendarSesiC3 = familySesi('CDS-C3', 'Sesi beberapa hari — tanggal mulai dan selesai', 'VARIASI', 'mulai-selesai', RINGKAS + ' Variasi: dua tanggal batas.', SUMBER + ' · variasi C3 (§7)');
