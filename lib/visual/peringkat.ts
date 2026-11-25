import { teksPetunjuk, type BadgesItem, type Peringkat, type Petunjuk } from '../deduktif/badges/model';
import { C, bungkus, dokumen, garis, kotak, teks, teksBaris, type GambarPembahasan } from './alat';

// Visual pembahasan Badges (QC 2 R02): lajur urutan 1..n. Baris pertama = susunan akhir; setiap petunjuk mendapat satu lajur yang
// menyorot orang yang disebut, arah hubungannya, dan posisi yang diizinkan.

const KIRI = 250;

export function visualPeringkat(it: BadgesItem, a: Peringkat): GambarPembahasan[] {
  const n = it.lencana;
  const SEL = Math.max(84, Math.floor(540 / n));
  const W = KIRI + n * SEL + 12;
  const nama = (id: string) => it.orang.find((o) => o.id === id)!.nama;
  const X = (p: number) => KIRI + (p - 1) * SEL + SEL / 2;
  const A = 34, H0 = 44, H = 54;
  let s = teks(10, 22, 'Petunjuk', { tebal: true });
  for (let p = 1; p <= n; p++) s += teks(X(p), 14, String(p), { tebal: true, rata: 'middle', ukuran: 14 });
  s += teks(X(1), 28, it.bahasa.satu, { rata: 'middle', ukuran: 9, warna: C.abu }) + teks(X(n), 28, it.bahasa.akhir, { rata: 'middle', ukuran: 9, warna: C.abu });
  s += kotak(6, A, W - 12, H0, { isi: '#eff6ff', garis: C.biru });
  s += teks(12, A + 27, 'Susunan akhir', { tebal: true, ukuran: 13 });
  for (const o of it.orang) s += kotak(X(a[o.id]) - SEL / 2 + 5, A + 7, SEL - 10, H0 - 14, { isi: C.biru, sudut: 5 }) + teks(X(a[o.id]), A + 27, o.nama, { rata: 'middle', tebal: true, ukuran: 12.5, warna: '#ffffff' });

  const petak = (id: string, y: number, isi = C.oranyeMuda, gr = C.oranye) =>
    kotak(X(a[id]) - SEL / 2 + 6, y + 9, SEL - 12, 24, { isi, garis: gr, tebal: 1.6, sudut: 4 }) + teks(X(a[id]), y + 26, nama(id), { rata: 'middle', tebal: true, ukuran: 12 });
  const izinkan = (y: number, boleh: (p: number) => boolean) => {
    let q = '';
    for (let p = 1; p <= n; p++) if (boleh(p)) q += kotak(X(p) - SEL / 2 + 3, y + 5, SEL - 6, 32, { isi: C.hijauMuda, garis: C.hijau, putus: '4 3', sudut: 4 });
    return q;
  };
  const busur = (p: number, q: number, y: number, ket: string, panah = true) => {
    const x1 = X(p), x2 = X(q), arah = x2 > x1 ? 1 : -1;
    return garis(x1 + arah * 10, y + 40, x2 - arah * 10, y + 40, C.oranye, 1.8, { panah }) + (ket ? teks((x1 + x2) / 2, y + 50, ket, { rata: 'middle', ukuran: 9, warna: C.oranye, halo: true }) : '');
  };

  const lajur = (c: Petunjuk, y: number): string => {
    let q = '';
    switch (c.jenis) {
      case 'atas': q += petak(c.a, y) + petak(c.b, y) + busur(a[c.a], a[c.b], y, ''); break;
      case 'atas-tepat': q += petak(c.a, y) + petak(c.b, y) + busur(a[c.a], a[c.b], y, c.k === 0 ? 'bersebelahan' : `tepat ${c.k} di antara`); break;
      case 'atas-min': q += petak(c.a, y) + petak(c.b, y) + busur(a[c.a], a[c.b], y, `sedikitnya ${c.k} di antara`); break;
      case 'jarak-tepat': q += petak(c.a, y) + petak(c.b, y) + busur(Math.min(a[c.a], a[c.b]), Math.max(a[c.a], a[c.b]), y, c.k === 0 ? 'bersebelahan' : `tepat ${c.k} di antara`, false); break;
      case 'jarak-min': q += petak(c.a, y) + petak(c.b, y) + busur(Math.min(a[c.a], a[c.b]), Math.max(a[c.a], a[c.b]), y, `sedikitnya ${c.k} di antara`, false); break;
      case 'di-antara': q += petak(c.b, y, '#ffffff', C.abu) + petak(c.c, y, '#ffffff', C.abu) + petak(c.a, y) + busur(a[c.b], a[c.a], y, '') + busur(a[c.c], a[c.a], y, ''); break;
      case 'tetap': q += izinkan(y, (p) => p === c.p) + petak(c.a, y); break;
      case 'bukan': q += izinkan(y, (p) => p !== c.p) + petak(c.a, y); break;
      case 'atas-k': q += izinkan(y, (p) => p <= c.k) + petak(c.a, y); break;
      case 'bawah-k': q += izinkan(y, (p) => p > n - c.k) + petak(c.a, y); break;
      case 'paritas': q += izinkan(y, (p) => (p % 2 === 1) === c.ganjil) + petak(c.a, y); break;
      case 'lebih-jauh': q += petak(c.b, y, '#ffffff', C.abu) + petak(c.c, y, '#ffffff', C.abu) + petak(c.a, y) + busur(a[c.a], a[c.b], y, '') + teks(X(a[c.b]), y + 50, `selisih ${Math.abs(a[c.a] - a[c.b])}`, { rata: 'middle', ukuran: 9, warna: C.oranye, halo: true }) + teks(X(a[c.c]), y + 50, `selisih ${Math.abs(a[c.a] - a[c.c])}`, { rata: 'middle', ukuran: 9, warna: C.oranye, halo: true }); break;
      case 'jika': q += petak(c.a, y, a[c.a] === c.p ? C.oranyeMuda : '#ffffff', a[c.a] === c.p ? C.oranye : C.abu) + petak(c.b, y, '#ffffff', C.abu) + petak(c.c, y, '#ffffff', C.abu) + (a[c.a] === c.p ? busur(a[c.b], a[c.c], y, 'syarat berlaku') : teks(X(a[c.a]), y + 47, 'syarat tidak terjadi', { rata: 'middle', ukuran: 9, warna: C.abu })); break;
    }
    return q;
  };
  it.kendala.forEach((c, i) => {
    const y = A + H0 + i * H;
    s += kotak(6, y, W - 12, H, { isi: i % 2 ? '#ffffff' : C.redup, garis: C.garis });
    s += teks(12, y + 15, `${nama(c.kartu)}:`, { tebal: true, ukuran: 11 });
    s += teksBaris(12, y + 27, bungkus(teksPetunjuk(c, nama, it.bahasa, n), 46, 3), 11, { ukuran: 9.8 });
    s += lajur(c, y);
  });
  const h = A + H0 + it.kendala.length * H + 24;
  s += teks(10, h - 8, 'Kotak cokelat = orang yang dibahas; panah = arah urutan; kotak hijau putus-putus = posisi yang diizinkan petunjuk.', { ukuran: 11, warna: C.abu });
  const urut = [...it.orang].sort((x, y) => a[x.id] - a[y.id]);
  return [{ id: 'lajur', judul: 'Lajur urutan dan petunjuknya', alt: `Susunan akhir: ${urut.map((o) => `${a[o.id]}. ${o.nama}`).join('; ')}.`, lebar: W, tinggi: h, svg: dokumen(W, h, s, 'Lajur urutan dan petunjuknya') }];
}
