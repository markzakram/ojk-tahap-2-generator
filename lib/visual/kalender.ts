import { HARI } from '../data/nama';
import { blokGiliran, semuaUrutan, type GiliranItem } from '../deduktif/calendar/giliran';
import { hariDari, hariKerja, tersediaOrang, type CalendarItem, type Kalender } from '../deduktif/calendar/model';
import { semuaJadwal, type SesiItem } from '../deduktif/calendar/sesi';
import { C, bungkus, dokumen, garis, kotak, teks, teksBaris, type GambarPembahasan } from './alat';

// Visual pembahasan Calendar (QC 2 R02): kalender eliminasi dengan alasan gugur per orang (profil A), pembagian giliran dan
// tabel penyaringan (profil B), serta jadwal sesi dengan jeda dan tanggal larangan (profil C).

const SEL = 100, TINGGI = 70, KIRI = 10, ATAS = 34;

function kerangka(k: Kalender, isi: (t: number, x: number, y: number) => string): { svg: string; w: number; h: number } {
  const baris = Math.ceil((k.hariPertama + k.jumlahHari) / 7);
  const w = KIRI * 2 + 7 * SEL, h = ATAS + baris * TINGGI + 6;
  let s = '';
  for (let d = 0; d < 7; d++) {
    const libur = d === 0 || d === 6;
    s += kotak(KIRI + d * SEL, 6, SEL, 24, { isi: libur ? '#f3f4f6' : C.biruMuda, garis: C.garis });
    s += teks(KIRI + d * SEL + SEL / 2, 22, HARI[d], { rata: 'middle', tebal: true, ukuran: 11.5, warna: libur ? C.abu : C.teks });
  }
  for (let t = 1; t <= k.jumlahHari; t++) {
    const i = k.hariPertama + t - 1;
    const x = KIRI + (i % 7) * SEL, y = ATAS + Math.floor(i / 7) * TINGGI;
    const kerja = hariKerja(k, t);
    s += kotak(x, y, SEL, TINGGI, { isi: kerja ? '#ffffff' : '#f3f4f6', garis: C.garis });
    s += teks(x + 6, y + 15, String(t), { ukuran: 12.5, tebal: true, warna: kerja ? C.teks : C.abu });
    s += isi(t, x, y);
  }
  return { svg: s, w, h };
}
const bingkaiKunci = (x: number, y: number) => kotak(x + 2, y + 2, SEL - 4, TINGGI - 4, { garis: C.biru, tebal: 3, sudut: 4 }) + teks(x + SEL - 7, y + 15, 'JAWABAN', { ukuran: 9.5, tebal: true, rata: 'end', warna: C.biru });

/** Kotak kecil bernomor orang: isi penuh = tersedia, garis silang = tidak tersedia. */
function penanda(x: number, y: number, no: number, ada: boolean): string {
  let s = kotak(x, y, 19, 18, { isi: ada ? C.hijauMuda : '#ffffff', garis: ada ? C.hijau : C.abu, tebal: ada ? 1.6 : 1, sudut: 3 });
  s += teks(x + 9.5, y + 13, String(no), { ukuran: 11, tebal: true, rata: 'middle', warna: ada ? C.hijau : C.abu });
  if (!ada) s += garis(x + 2, y + 16, x + 17, y + 2, C.merah, 1.6) + garis(x + 2, y + 2, x + 17, y + 16, C.merah, 1.6);
  return s;
}

function irisan(item: CalendarItem, jawaban: number[]): GambarPembahasan[] {
  const k = kerangka(item.kalender, (t, x, y) => {
    if (!hariKerja(item.kalender, t)) return teks(x + SEL / 2, y + 44, 'libur', { ukuran: 10, rata: 'middle', warna: C.abu });
    const ada = item.orang.map((o) => tersediaOrang(item.kendala, o.id, item.kalender, t));
    const semua = ada.every(Boolean);
    let s = ada.map((v, i) => penanda(x + 6 + i * 22, y + 24, i + 1, v)).join('');
    s += teks(x + SEL / 2, y + 60, semua ? 'cocok' : 'gugur', { ukuran: 10, rata: 'middle', tebal: semua, warna: semua ? C.hijau : C.abu });
    if (jawaban.includes(t)) s += bingkaiKunci(x, y);
    return s;
  });
  const kaki = item.orang.flatMap((o, i) => bungkus(`${i + 1} = ${o.nama}: ${o.petunjuk.join(' ')}`, 108));
  const h = k.h + 12 + (kaki.length + 1) * 15;
  const svg = k.svg + teksBaris(KIRI, k.h + 14, ['Kotak bernomor hijau = orang itu tersedia; silang merah = tidak tersedia. Hari kerja tanpa silang ditandai "cocok".', ...kaki], 15, { ukuran: 11 });
  return [{
    id: 'eliminasi', judul: 'Kalender eliminasi: ketersediaan setiap orang',
    alt: `Tanggal yang cocok untuk semua orang dan jawaban: ${jawaban.join(', ')}.`, lebar: k.w, tinggi: Math.ceil(h), svg: dokumen(k.w, h, svg, 'Kalender eliminasi ketersediaan'),
  }];
}

const LATAR = ['#e0e7ff', '#fef3c7', '#dcfce7', '#fce7f3', '#e0f2fe'];

function giliran(item: GiliranItem, jawaban: number[]): GambarPembahasan[] {
  const blok = blokGiliran(item.kalender, item.hariPerGiliran);
  const urut = semuaUrutan(item)[0];
  if (!urut) return [];
  const nama = (id: string) => item.orang.find((o) => o.id === id)!.nama;
  const g = (t: number) => blok.findIndex((b) => b.includes(t));
  const k = kerangka(item.kalender, (t, x, y) => {
    const i = g(t);
    if (i < 0) return '';
    let s = kotak(x + 1, y + 20, SEL - 2, TINGGI - 22, { isi: LATAR[i] });
    s += teks(x + SEL / 2, y + 38, `Giliran ${i + 1}`, { ukuran: 10.5, rata: 'middle', warna: C.abu });
    s += teks(x + SEL / 2, y + 56, nama(urut[i]), { ukuran: 12, rata: 'middle', tebal: true });
    if (jawaban.includes(t)) s += bingkaiKunci(x, y);
    return s;
  });
  const gambar1: GambarPembahasan = {
    id: 'giliran', judul: 'Pembagian giliran pada kalender',
    alt: `Urutan giliran: ${urut.map(nama).join(', ')}. Jawaban: tanggal ${jawaban.join(', ')}.`, lebar: k.w, tinggi: k.h, svg: dokumen(k.w, k.h, k.svg, 'Pembagian giliran pada kalender'),
  };
  // tabel penyaringan: orang × giliran, alasan gugur dibaca dari kartu orang itu sendiri atau dari kartu yang menyebutnya
  const W = 720, B = 46, A = 34;
  const ids = item.orang.map((o) => o.id);
  let s = teks(10, 22, 'Orang', { tebal: true });
  blok.forEach((b, i) => { s += teks(190 + i * 106 + 50, 15, `Giliran ${i + 1}`, { tebal: true, rata: 'middle', ukuran: 11.5 }) + teks(190 + i * 106 + 50, 28, `${b[0]}–${b.at(-1)}, akhir ${HARI[hariDari(item.kalender, b.at(-1)!)]}`, { rata: 'middle', ukuran: 9.5, warna: C.abu }); });
  ids.forEach((id, r) => {
    const y = A + r * B;
    s += kotak(6, y, W - 12, B, { isi: r % 2 ? '#ffffff' : C.redup, garis: C.garis });
    s += teks(12, y + 16, nama(id), { tebal: true }) + teksBaris(12, y + 29, bungkus(item.orang[r].petunjuk.join(' '), 36, 2), 10, { ukuran: 9, warna: C.abu });
    blok.forEach((b, i) => {
      const x = 190 + i * 106 + 50;
      if (urut[i] === id) { s += kotak(x - 44, y + 6, 88, B - 12, { isi: LATAR[i], garis: C.biru, tebal: 2, sudut: 5 }) + teks(x, y + 28, '✓ di sini', { rata: 'middle', tebal: true, ukuran: 12, warna: C.biru }); return; }
      let why = '';
      for (const c of item.kendala) {
        if (c.jenis === 'hari-terakhir' && c.orang === id && hariDari(item.kalender, b.at(-1)!) !== c.hari) why = `bukan ${HARI[c.hari]}`;
        if (c.jenis === 'tidak-tersedia' && c.orang === id && b.some((t) => t >= c.dari && t <= c.sampai)) why = 'tidak tersedia';
      }
      if (!why) for (const c of item.kendala) {
        if (c.jenis !== 'sebelum' && c.jenis !== 'sesudah') continue;
        const pos = (x2: string) => urut.indexOf(x2);
        const rel = c.orang === id ? c.dengan : c.dengan === id ? c.orang : null;
        if (!rel) continue;
        const sebelum = c.jenis === 'sebelum' ? c.orang === id : c.dengan === id;
        if (sebelum && i >= pos(rel)) why = `sebelum ${nama(rel)}`;
        if (!sebelum && i <= pos(rel)) why = `sesudah ${nama(rel)}`;
        if (why) break;
      }
      if (!why) why = `giliran ${nama(urut[i])}`;
      s += teks(x, y + 20, '×', { rata: 'middle', tebal: true, ukuran: 14, warna: C.merah }) + teks(x, y + 36, why, { rata: 'middle', ukuran: 9.5, warna: C.abu });
    });
  });
  const h = A + ids.length * B + 8;
  return [gambar1, { id: 'penyaringan', judul: 'Tabel penyaringan giliran', alt: `Setiap orang dan giliran yang tersisa: ${ids.map((id) => `${nama(id)} giliran ${urut.indexOf(id) + 1}`).join('; ')}.`, lebar: W, tinggi: h, svg: dokumen(W, h, s, 'Tabel penyaringan giliran') }];
}

function sesi(item: SesiItem, jawaban: number[]): GambarPembahasan[] {
  const j = semuaJadwal(item)[0];
  if (!j) return [];
  const nama = (id: string) => item.orang.find((o) => o.id === id)!.nama;
  const kerja = Array.from({ length: item.kalender.jumlahHari }, (_, i) => i + 1).filter((t) => hariKerja(item.kalender, t));
  const akhir2 = j.jadwal[item.jedaSetelahSesiKe - 1].at(-1)!;
  const jeda = kerja.slice(kerja.indexOf(akhir2) + 1, kerja.indexOf(akhir2) + 1 + item.jeda);
  const k = kerangka(item.kalender, (t, x, y) => {
    if (!hariKerja(item.kalender, t)) return '';
    const i = j.jadwal.findIndex((d) => d.includes(t));
    let s = '';
    if (i >= 0) {
      s += kotak(x + 1, y + 20, SEL - 2, TINGGI - 22, { isi: LATAR[i] });
      s += teks(x + SEL / 2, y + 34, `Sesi ${i + 1}`, { ukuran: 10, rata: 'middle', warna: C.abu });
      s += teksBaris(x + SEL / 2, y + 48, bungkus(nama(j.urut[i]), 13, 2), 12, { ukuran: 10.5, rata: 'middle', tebal: true });
    } else if (item.larangan.includes(t)) s += teks(x + SEL / 2, y + 46, '× larangan', { ukuran: 11, rata: 'middle', tebal: true, warna: C.merah });
    else if (jeda.includes(t)) s += teks(x + SEL / 2, y + 46, 'jeda', { ukuran: 11, rata: 'middle', warna: C.oranye, tebal: true });
    if (jawaban.includes(t)) s += bingkaiKunci(x, y);
    return s;
  });
  const kaki = item.orang.map((o) => `${o.nama}: ${o.petunjuk.join(' ')}`);
  const h = k.h + 12 + kaki.length * 15;
  const svg = k.svg + teksBaris(KIRI, k.h + 14, kaki, 15, { ukuran: 11 });
  return [{ id: 'jadwal', judul: 'Jadwal sesi, jeda, dan tanggal larangan', alt: `Urutan sesi: ${j.urut.map(nama).join(', ')}. Jawaban: tanggal ${jawaban.join(', ')}.`, lebar: k.w, tinggi: Math.ceil(h), svg: dokumen(k.w, h, svg, 'Jadwal sesi, jeda, dan tanggal larangan') }];
}

export function visualKalender(item: CalendarItem | GiliranItem | SesiItem, jawaban: number[]): GambarPembahasan[] {
  return item.profil === 'A' ? irisan(item, jawaban) : item.profil === 'B' ? giliran(item, jawaban) : sesi(item, jawaban);
}
