import type { Rng } from '../../core/rng';
import type { Family, Label, LangkahPembahasan } from '../../core/types';
import { chapterById } from '../../data/chapters';
import { HARI, NAMA_KALENDER, daftarKata } from '../../data/nama';
import { MAKS_PILIHAN, hariDari, hariKerja, type CalendarTampilan, type Kalender } from './model';

// Blueprint Calendar Date Selection — profil CDS-B "Giliran berurutan dalam blok hari kerja".
// Sumber TERAMATI: deduktif.pdf hlm. 5–8 (Letter Distribution / Meeting Notes, satu template).
// Lima orang, masing-masing empat hari kerja berturut-turut; lima kartu satu klausa: satu rentang tidak tersedia,
// tiga relasi urutan (sebelum/sesudah = urutan umum, BUKAN "tepat"), satu nama hari untuk hari terakhir orang tertentu.
// Kalender sumber: 29 hari, tanggal 1 Minggu → 20 hari kerja (2–6, 9–13, 16–20, 23–27) tertutup penuh oleh lima giliran.

export type KendalaGiliran =
  | { jenis: 'tidak-tersedia'; orang: string; dari: number; sampai: number }
  | { jenis: 'sebelum'; orang: string; dengan: string }
  | { jenis: 'sesudah'; orang: string; dengan: string }
  | { jenis: 'hari-terakhir'; orang: string; hari: number };

export type TanyaGiliran = 'awal-akhir' | 'awal' | 'akhir' | 'semua';

export interface GiliranItem extends CalendarTampilan {
  profil: 'B';
  hariPerGiliran: number;
  kendala: KendalaGiliran[];
  target: string;
  tanya: TanyaGiliran;
}

const KALENDER_B: Kalender = { jumlahHari: 29, hariPertama: 0 };
const HARI_PER_GILIRAN = 4;
const KONTEKS = [
  { judul: 'Distribusi Surat', tugas: 'mendistribusikan surat' },
  { judul: 'Notulen Rapat', tugas: 'mencatat notulen rapat harian' },
  { judul: 'Meja Layanan', tugas: 'menjaga meja layanan' },
  { judul: 'Pemeriksaan Laporan', tugas: 'memeriksa laporan harian' },
];

/** Lima giliran berurutan yang menutup seluruh hari kerja dalam bulan (cakupan penuh, tanpa celah). */
export function blokGiliran(k: Kalender, hariPerGiliran: number): number[][] {
  const kerja: number[] = [];
  for (let t = 1; t <= k.jumlahHari; t++) if (hariKerja(k, t)) kerja.push(t);
  const blok: number[][] = [];
  for (let i = 0; i + hariPerGiliran <= kerja.length; i += hariPerGiliran) blok.push(kerja.slice(i, i + hariPerGiliran));
  return blok;
}

const permutasi = (xs: string[]): string[][] =>
  xs.length <= 1 ? [xs] : xs.flatMap((x, i) => permutasi([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p]));

function cocok(k: KendalaGiliran, urut: string[], blok: number[][], kal: Kalender): boolean {
  const g = (id: string) => urut.indexOf(id);
  switch (k.jenis) {
    case 'tidak-tersedia': return blok[g(k.orang)].every((t) => t < k.dari || t > k.sampai);
    case 'sebelum': return g(k.orang) < g(k.dengan);
    case 'sesudah': return g(k.orang) > g(k.dengan);
    case 'hari-terakhir': { const b = blok[g(k.orang)]; return hariDari(kal, b[b.length - 1]) === k.hari; }
  }
}

/** Seluruh urutan giliran (orang di giliran 1..5) yang memenuhi semua kartu. */
export function semuaUrutan(item: GiliranItem): string[][] {
  const blok = blokGiliran(item.kalender, item.hariPerGiliran);
  return permutasi(item.orang.map((o) => o.id)).filter((u) => item.kendala.every((k) => cocok(k, u, blok, item.kalender)));
}

const proyeksi = (tanya: TanyaGiliran, b: number[]) =>
  tanya === 'awal-akhir' ? [b[0], b[b.length - 1]] : tanya === 'awal' ? [b[0]] : tanya === 'akhir' ? [b[b.length - 1]] : [...b];

function teksKendala(k: KendalaGiliran, nama: (id: string) => string): string {
  switch (k.jenis) {
    case 'tidak-tersedia': return `Tidak tersedia tanggal ${k.dari}–${k.sampai}.`;
    case 'sebelum': return `Bertugas sebelum ${nama(k.dengan)}.`;
    case 'sesudah': return `Bertugas sesudah ${nama(k.dengan)}.`;
    case 'hari-terakhir': return `Hari terakhir tugasnya jatuh pada hari ${HARI[k.hari]}.`;
  }
}

function pertanyaan(tanya: TanyaGiliran, nama: string): string {
  switch (tanya) {
    case 'awal-akhir': return `Pilih tanggal pertama dan terakhir tugas ${nama}.`;
    case 'awal': return `Pilih tanggal pertama tugas ${nama}.`;
    case 'akhir': return `Pilih tanggal terakhir tugas ${nama}.`;
    case 'semua': return `Pilih semua tanggal bertugas ${nama}.`;
  }
}

function bangun(r: Rng, tanya: TanyaGiliran): { item: GiliranItem; jawaban: number[] } | null {
  const blok = blokGiliran(KALENDER_B, HARI_PER_GILIRAN);
  const nama = r.sample(NAMA_KALENDER, 5);
  const ids = ['o1', 'o2', 'o3', 'o4', 'o5'];
  const urut = r.shuffle(ids); // urut[g] = orang pada giliran g
  const g = (id: string) => urut.indexOf(id);
  const [pemilikHari, pemilikRentang, ...pemilikRelasi] = r.shuffle(ids);

  const kendalaPer: Record<string, KendalaGiliran> = {};
  const akhir = blok[g(pemilikHari)];
  kendalaPer[pemilikHari] = { jenis: 'hari-terakhir', orang: pemilikHari, hari: hariDari(KALENDER_B, akhir[akhir.length - 1]) };

  // Rentang tidak tersedia: satu pekan kerja (Senin–Jumat) penuh atau sebagian, tidak menyentuh giliran pemiliknya sendiri.
  const pekan = [[2, 6], [9, 13], [16, 20], [23, 27]];
  const [awalPekan, akhirPekan] = r.pick(pekan);
  const dari = awalPekan + r.int(0, 1);
  const sampai = akhirPekan - r.int(0, 1);
  if (blok[g(pemilikRentang)].some((t) => t >= dari && t <= sampai)) return null;
  kendalaPer[pemilikRentang] = { jenis: 'tidak-tersedia', orang: pemilikRentang, dari, sampai };

  for (const p of pemilikRelasi) {
    const q = r.pick(ids.filter((x) => x !== p));
    kendalaPer[p] = g(p) < g(q) ? { jenis: 'sebelum', orang: p, dengan: q } : { jenis: 'sesudah', orang: p, dengan: q };
  }
  const namaDari = (id: string) => nama[ids.indexOf(id)];
  // Target bukan pemilik kartu "hari terakhir" (jawabannya akan langsung terbaca dari satu kartu).
  const target = r.pick(ids.filter((x) => x !== pemilikHari));
  const konteks = r.pick(KONTEKS);
  const tampilUrut = r.shuffle(ids);
  const item: GiliranItem = {
    jenis: 'calendar-date',
    profil: 'B',
    judul: konteks.judul,
    paragraf: [
      `Lima staf bergiliran ${konteks.tugas} pada bulan ini, satu orang setiap hari.`,
      `Setiap orang bertugas ${HARI_PER_GILIRAN === 4 ? 'empat' : HARI_PER_GILIRAN} hari kerja (Senin–Jumat) berturut-turut; giliran pertama dimulai tanggal ${blok[0][0]} dan giliran berikutnya langsung menyambung tanpa jeda sampai tanggal ${blok[blok.length - 1].at(-1)}.`,
    ],
    pertanyaan: pertanyaan(tanya, namaDari(target)),
    kalender: KALENDER_B,
    maksPilihan: MAKS_PILIHAN,
    orang: tampilUrut.map((id) => ({ id, nama: namaDari(id), petunjuk: [teksKendala(kendalaPer[id], namaDari)] })),
    hariPerGiliran: HARI_PER_GILIRAN,
    kendala: tampilUrut.map((id) => kendalaPer[id]),
    target,
    tanya,
  };
  return { item, jawaban: proyeksi(tanya, blok[g(target)]) };
}

function bahas(item: GiliranItem, jawaban: number[]) {
  const blok = blokGiliran(item.kalender, item.hariPerGiliran);
  const nama = (id: string) => item.orang.find((o) => o.id === id)!.nama;
  const ids = item.orang.map((o) => o.id);
  const dom = new Map(ids.map((id) => [id, new Set(blok.map((_, i) => i))]));
  const langkah: LangkahPembahasan[] = [];
  const teksBlok = (i: number) => `giliran ${i + 1} (${blok[i].join(', ')}; berakhir ${HARI[hariDari(item.kalender, blok[i].at(-1)!)]})`;
  langkah.push({ teks: `Hari kerja dibagi lima giliran: ${blok.map((_, i) => teksBlok(i)).join('; ')}.` });
  const hapus = (id: string, nilai: number[]) => { const d = dom.get(id)!; const ada = nilai.filter((v) => d.has(v)); ada.forEach((v) => d.delete(v)); return ada; };
  const pasti = (id: string) => (dom.get(id)!.size === 1 ? [...dom.get(id)!][0] : null);

  for (const k of item.kendala) {
    if (k.jenis === 'hari-terakhir') {
      const boleh = blok.map((b, i) => (hariDari(item.kalender, b.at(-1)!) === k.hari ? i : -1)).filter((i) => i >= 0);
      hapus(k.orang, blok.map((_, i) => i).filter((i) => !boleh.includes(i)));
      langkah.push({ teks: `Hari terakhir ${nama(k.orang)} jatuh pada ${HARI[k.hari]}; hanya ${boleh.map((i) => `giliran ${i + 1}`).join(' dan ')} yang berakhir hari ${HARI[k.hari]}, jadi ${nama(k.orang)} di ${boleh.map((i) => `giliran ${i + 1}`).join('/')}.` });
    }
    if (k.jenis === 'tidak-tersedia') {
      const kena = blok.map((b, i) => (b.some((t) => t >= k.dari && t <= k.sampai) ? i : -1)).filter((i) => i >= 0);
      const terhapus = hapus(k.orang, kena);
      if (terhapus.length) langkah.push({ teks: `${nama(k.orang)} tidak tersedia tanggal ${k.dari}–${k.sampai}, sehingga tidak bisa di ${terhapus.map((i) => `giliran ${i + 1}`).join(' maupun ')}.` });
    }
  }
  for (let maju = true, putaran = 0; maju && putaran < 30; putaran++) {
    maju = false;
    // Satu giliran hanya untuk satu orang.
    for (const id of ids) {
      const v = pasti(id);
      if (v === null) continue;
      for (const lain of ids) if (lain !== id && hapus(lain, [v]).length) maju = true;
    }
    for (const k of item.kendala) {
      if (k.jenis !== 'sebelum' && k.jenis !== 'sesudah') continue;
      const [awal, akhir] = k.jenis === 'sebelum' ? [k.orang, k.dengan] : [k.dengan, k.orang];
      const dA = dom.get(awal)!, dB = dom.get(akhir)!;
      const maksB = Math.max(...dB), minA = Math.min(...dA);
      const hA = hapus(awal, [...dA].filter((v) => v >= maksB));
      const hB = hapus(akhir, [...dB].filter((v) => v <= minA));
      if (hA.length || hB.length) {
        maju = true;
        const relasi = k.jenis === 'sebelum' ? `${nama(k.orang)} bertugas sebelum ${nama(k.dengan)}` : `${nama(k.orang)} bertugas sesudah ${nama(k.dengan)}`;
        const hasil = [awal, akhir].filter((id) => (id === awal ? hA : hB).length)
          .map((id) => `${nama(id)} ${pasti(id) !== null ? `di giliran ${pasti(id)! + 1}` : `hanya mungkin di giliran ${[...dom.get(id)!].map((v) => v + 1).join('/')}`}`);
        langkah.push({ teks: `${relasi}, jadi ${daftarKata(hasil)}.` });
      }
    }
    // Giliran yang hanya bisa diisi satu orang.
    for (let i = 0; i < blok.length; i++) {
      const calon = ids.filter((id) => dom.get(id)!.has(i));
      if (calon.length === 1 && dom.get(calon[0])!.size > 1) {
        dom.set(calon[0], new Set([i]));
        langkah.push({ teks: `Giliran ${i + 1} hanya dapat diisi ${nama(calon[0])}.` });
        maju = true;
      }
    }
  }
  if (ids.some((id) => pasti(id) === null)) return null;
  const urut = [...ids].sort((a, b) => pasti(a)! - pasti(b)!);
  const bt = blok[pasti(item.target)!];
  if (proyeksi(item.tanya, bt).join() !== jawaban.join()) return null;
  langkah.push({ teks: `Urutan giliran: ${urut.map(nama).join(' – ')}. Semua kartu terpenuhi.` });
  langkah.push({ teks: `${nama(item.target)} bertugas tanggal ${daftarKata(bt.map(String))}.` });
  return {
    jawaban: `Tanggal ${daftarKata(jawaban.map(String))}`,
    langkah,
    caraCepat: 'Tulis lima giliran beserta hari terakhirnya lebih dulu; kartu "hari terakhir" biasanya langsung mengunci satu orang.',
  };
}

function familyGiliran(id: string, nama: string, label: Label, tanya: TanyaGiliran, ringkas: string, sumber: string): Family<GiliranItem, number[]> {
  return {
    id, versi: 1, nama, label, ringkas, sumber,
    chapter: chapterById('calendar-date-selection'),
    bangun: (r) => bangun(r, tanya),
    pecahkan(item) {
      const blok = blokGiliran(item.kalender, item.hariPerGiliran);
      return semuaUrutan(item).map((u) => proyeksi(item.tanya, blok[u.indexOf(item.target)]));
    },
    kunci: (a) => [...a].sort((x, y) => x - y).join(','),
    periksa(item) {
      const masalah: string[] = [];
      const hitung = (j: string) => item.kendala.filter((k) => k.jenis === j).length;
      if (item.orang.length !== 5) masalah.push('jumlah orang bukan lima');
      if (hitung('tidak-tersedia') !== 1 || hitung('hari-terakhir') !== 1 || hitung('sebelum') + hitung('sesudah') !== 3) masalah.push('komposisi kartu tidak sesuai profil B');
      // Utamakan jadwal lengkap yang unik agar pembahasannya pasti.
      if (semuaUrutan(item).length !== 1) masalah.push('jadwal lengkap tidak tunggal');
      // Rentang tidak tersedia harus menyaring minimal satu giliran.
      const blok = blokGiliran(item.kalender, item.hariPerGiliran);
      const tt = item.kendala.find((k) => k.jenis === 'tidak-tersedia') as Extract<KendalaGiliran, { jenis: 'tidak-tersedia' }>;
      if (!blok.some((b) => b.some((t) => t >= tt.dari && t <= tt.sampai))) masalah.push('rentang tidak tersedia tidak menyaring');
      return masalah;
    },
    bahas,
    sidik(item) {
      const idx = new Map(item.orang.map((o) => [o.id, 0]));
      // Nama orang diganti dengan posisi gilirannya pada jawaban, sehingga penamaan ulang tidak mengubah sidik.
      const [urut] = semuaUrutan(item);
      urut.forEach((id, i) => idx.set(id, i));
      const k = item.kendala.map((x) => x.jenis === 'tidak-tersedia' ? `t${idx.get(x.orang)}:${x.dari}-${x.sampai}`
        : x.jenis === 'hari-terakhir' ? `h${idx.get(x.orang)}:${x.hari}` : `${x.jenis === 'sebelum' ? 'b' : 'a'}${idx.get(x.orang)}${idx.get(x.dengan)}`).sort().join(',');
      return `cds-b:${item.tanya}:${idx.get(item.target)}:${k}`;
    },
  };
}

const SUMBER = 'Blueprint Calendar Date Selection §2 CDS-B · deduktif.pdf hlm. 5–8 (Letter Distribution, Meeting Notes)';
const RINGKAS = 'Lima orang bergiliran empat hari kerja berturut-turut. Kartu: satu rentang tidak tersedia, tiga relasi sebelum/sesudah, satu nama hari untuk hari terakhir. Kalender 29 hari, tanggal 1 hari Minggu.';

export const calendarGiliranB0 = familyGiliran('CDS-B0', 'Giliran berurutan — tanggal pertama dan terakhir', 'SHL', 'awal-akhir', RINGKAS + ' Kunci dua tanggal batas.', SUMBER);
export const calendarGiliranB1 = familyGiliran('CDS-B1', 'Giliran berurutan — tanggal pertama', 'VARIASI', 'awal', RINGKAS + ' Variasi: hanya tanggal pertama.', SUMBER + ' · variasi B1 (§7)');
export const calendarGiliranB2 = familyGiliran('CDS-B2', 'Giliran berurutan — tanggal terakhir', 'VARIASI', 'akhir', RINGKAS + ' Variasi: hanya tanggal terakhir.', SUMBER + ' · variasi B2 (§7)');
export const calendarGiliranB3 = familyGiliran('CDS-B3', 'Giliran berurutan — semua tanggal tugas', 'VARIASI', 'semua', RINGKAS + ' Variasi: keempat tanggal tugas.', SUMBER + ' · variasi B3 (§7)');
