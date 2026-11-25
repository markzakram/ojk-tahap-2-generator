import { H, NAMA_WARNA, U, W, geometri, type Frame, type Geometri, type Warna } from '../induktif/fill-shape/geometri';
import { aturanPembahasan, type FillShapeItem } from '../induktif/fill-shape/pola';
import type { DataAturan } from '../induktif/fill-shape/aturan';
import { C, bungkus, dokumen, garis, kapital, kotak, n2, teks, teksBaris, type GambarPembahasan } from './alat';

// Visual pembahasan Fill Shape (QC 2 R02, QC 1 T01): satu lajur per unsur/kelompok/lapisan dengan miniatur Gambar 1–5 yang
// geometri dan orientasinya sama dengan soal. Bidang yang dibahas digambar penuh dengan garis tebal dan label; bidang lain
// diredupkan. Lajur terakhir menggabungkan semuanya menjadi Gambar 5 (jawaban).

const LABEL = 122, SEL = 108, R = 40, KEPALA = 30;
const X = (t: number) => LABEL + t * SEL + SEL / 2;
const LEBAR = LABEL + 5 * SEL + 10;
const KAKI = 108;

const titikTengah = (geo: Geometri, i: number): [number, number] => {
  const p = geo.bidang[i].titik;
  const x = p.reduce((s, q) => s + q[0], 0) / p.length, y = p.reduce((s, q) => s + q[1], 0) / p.length;
  // bidang L (bingkai luar persegi bersarang): rata-rata titik jatuh di sudut dalam, geser ke badan bidang
  return p.length === 6 ? [x * 1.5, y * 1.5] : [x, y];
};
const hurufWarna = (w: Warna) => NAMA_WARNA[w][0].toUpperCase();

interface OpsiMini {
  /** Bidang yang dibahas; kosong = gambar penuh tanpa peredupan. */
  sorot?: number[];
  /** Label pendek di bidang (mis. "U1"). */
  tanda?: Map<number, string>;
  /** Posisi sebelumnya dan sekarang (panah perpindahan). */
  pindah?: [number, number][];
  /** Bidang yang hanya diberi garis putus-putus. */
  putus?: number[];
}

const warnaIsi = (w: Warna, pola: string) => (w === H ? '#4a8508' : w === U ? `url(#${pola})` : '#ffffff');

function mini(geo: Geometri, f: Frame, cx: number, cy: number, r: number, pola: string, o: OpsiMini = {}): string {
  const P = (q: [number, number]) => `${n2(cx + q[0] * r)},${n2(cy + q[1] * r)}`;
  const poli = (i: number, atribut: string) => `<polygon points="${geo.bidang[i].titik.map(P).join(' ')}" ${atribut}/>`;
  const sorot = o.sorot ? new Set(o.sorot) : null;
  let s = '';
  geo.bidang.forEach((_, i) => {
    if (sorot && !sorot.has(i)) s += poli(i, `fill="${f[i] === H ? '#4a8508' : f[i] === U ? '#827bde' : '#ffffff'}" fill-opacity="${f[i] === W ? 1 : 0.14}" stroke="${C.garis}" stroke-width="0.8"`);
    else if (!sorot) s += poli(i, `fill="${warnaIsi(f[i], pola)}" stroke="${C.tinta}" stroke-width="1"`);
  });
  for (const i of o.putus ?? []) s += poli(i, `fill="none" stroke="${C.abu}" stroke-width="1.4" stroke-dasharray="3 2"`);
  if (sorot) for (const i of sorot) s += poli(i, `fill="${warnaIsi(f[i], pola)}" stroke="${C.tinta}" stroke-width="2.6" stroke-linejoin="round"`);
  for (const [a, b] of o.pindah ?? []) {
    if (a === b) continue;
    const p = titikTengah(geo, a), q = titikTengah(geo, b);
    s += garis(cx + p[0] * r, cy + p[1] * r, cx + q[0] * r, cy + q[1] * r, C.oranye, 1.6, { panah: true, halo: true });
  }
  for (const [i, t] of o.tanda ?? []) {
    const p = titikTengah(geo, i);
    s += teks(cx + p[0] * r, cy + p[1] * r + 3.5, t, { ukuran: 10, tebal: true, rata: 'middle', halo: true, warna: C.tinta });
  }
  return s;
}

interface Lajur {
  label: string;
  sub?: string;
  /** Miniatur gambar ke-t dengan pusat vertikal cy. */
  mini: (t: number, cy: number) => string;
  kapsi?: (t: number) => string | string[];
  /** Hanya digambar pada kolom ini (tanpa panah antargambar). */
  hanya?: number[];
  catatan?: string;
  /** Label di atas panah antargambar. */
  antara?: (t: number) => string;
}

const tinggiLajur = (l: Lajur) => (l.kapsi ? KAKI + 18 : KAKI - 2);

function susun(lajur: Lajur[], kaki: string[], judul: string, pola: string): { svg: string; tinggi: number } {
  const badan = lajur.reduce((a, l) => a + tinggiLajur(l), 0);
  const total = KEPALA + badan + (kaki.length ? 12 + kaki.length * 15 : 6);
  let s = `<defs><pattern id="${pola}" patternUnits="userSpaceOnUse" width="6.4" height="6.4"><rect width="6.4" height="6.4" fill="#827bde"/><circle cx="1.6" cy="1.6" r="0.9" fill="#ffffff"/><circle cx="4.8" cy="4.8" r="0.9" fill="#ffffff"/></pattern></defs>`;
  s += kotak(X(4) - SEL / 2 + 1, 3, SEL - 2, KEPALA + badan - 6, { isi: '#eff6ff', garis: C.biru, tebal: 1.2, putus: '5 3', sudut: 8 });
  for (let t = 0; t < 5; t++) s += teks(X(t), 20, t === 4 ? 'Gambar 5 (jawaban)' : `Gambar ${t + 1}`, { ukuran: t === 4 ? 10 : 11.5, tebal: true, rata: 'middle', warna: t === 4 ? C.biru : C.teks });
  let y = KEPALA;
  for (const l of lajur) {
    const cy = y + 50;
    s += garis(6, y, LEBAR - 6, y, C.garis, 1);
    s += teks(8, y + 32, l.label, { ukuran: 12.5, tebal: true });
    if (l.sub) s += teksBaris(8, y + 48, bungkus(l.sub, 19, 4), 13, { ukuran: 10.5, warna: C.abu });
    for (let t = 0; t < 5; t++) {
      if (l.hanya && !l.hanya.includes(t)) continue;
      s += l.mini(t, cy);
      if (l.kapsi) { const k = l.kapsi(t); s += teksBaris(X(t), y + KAKI - 2, Array.isArray(k) ? k : bungkus(k, 20, 2), 11, { ukuran: 9.5, rata: 'middle' }); }
    }
    if (!l.hanya) for (let t = 0; t < 4; t++) {
      const xm = (X(t) + X(t + 1)) / 2;
      s += garis(xm - 8, cy, xm + 8, cy, C.abu, 1.6, { panah: true });
      if (l.antara) s += teks(xm, cy - 8, l.antara(t), { ukuran: 9.5, tebal: true, rata: 'middle', warna: C.oranye, halo: true });
    }
    if (l.catatan) s += teksBaris(LABEL + SEL + 12, y + 34, bungkus(l.catatan, 56, 5), 14, { ukuran: 11 });
    y += tinggiLajur(l);
  }
  s += garis(6, y, LEBAR - 6, y, C.garis, 1);
  if (kaki.length) s += teksBaris(8, y + 18, kaki, 15, { ukuran: 11 });
  return { svg: dokumen(LEBAR, total, s, judul), tinggi: Math.ceil(total) };
}

const ringkasNama = (t: string) => t.replace('segitiga dalam', 'dalam').replace('sektor ', '').replace('bingkai ', '').replace('persegi ', '').replace('ujung ', '').replace('segitiga ', '');

function lajurDari(geo: Geometri, F: Frame[], data: DataAturan, pola: string): { lajur: Lajur[]; kaki: string[]; judul: string } {
  const nama = (i: number) => geo.bidang[i].nama;
  const gambar = (t: number, cy: number, o?: OpsiMini) => mini(geo, F[t], X(t), cy, R, pola, o);
  const gabungan: Lajur = { label: 'Gabungan', sub: 'semua unsur disatukan', mini: (t, cy) => gambar(t, cy) };

  switch (data.jenis) {
    case 'jejak': {
      const lajur: Lajur[] = data.unsur.map((u) => {
        const kode = `${u.nama[0]}${u.nama.match(/\d+$/)?.[0] ?? ''}`;
        return {
          label: u.nama, sub: `mulai di ${nama(u.pos[0])}`,
          kapsi: (t) => nama(u.pos[t]),
          mini: (t, cy) => gambar(t, cy, {
            sorot: [u.pos[t]], tanda: new Map([[u.pos[t], kode]]),
            ...(t && u.pos[t - 1] !== u.pos[t] ? { putus: [u.pos[t - 1]], pindah: [[u.pos[t - 1], u.pos[t]]] as [number, number][] } : {}),
          }),
        };
      });
      return { lajur: [...lajur, gabungan], kaki: ['Garis tebal = unsur yang dibahas; garis putus-putus = posisi pada gambar sebelumnya; panah = perpindahannya.'], judul: 'Lintasan setiap unsur dari Gambar 1 sampai Gambar 5' };
    }
    case 'operasi': {
      const op = (t: number) => data.aturan[t % data.aturan.length];
      const dua = data.aturan.length > 1;
      const sebut = (t: number) => (dua ? `aturan ${(t % 2) + 1}` : 'aturan');
      const lacak = (i: number) => { const p = [i]; for (let t = 0; t < 4; t++) p.push(op(t).perm[p[t]]); return p; };
      // wadah sedikit bidang (segitiga): lajur per isi bidang, termasuk siklus warnanya
      if (geo.bidang.length <= 4) {
        const diam = data.aturan.every((a) => a.perm.every((x, i) => x === i));
        const lajur: Lajur[] = geo.bidang.map((b, i) => {
          const p = lacak(i);
          return {
            label: kapital(ringkasNama(b.nama)), sub: diam ? 'siklus warna bidang ini' : 'isi bidang ini pada Gambar 1',
            kapsi: (t) => (diam ? [NAMA_WARNA[F[t][i]]] : [`di ${ringkasNama(nama(p[t]))}`, NAMA_WARNA[F[t][p[t]]]]),
            mini: (t, cy) => gambar(t, cy, { sorot: [p[t]], tanda: new Map([[p[t], hurufWarna(F[t][p[t]])]]), ...(t && p[t - 1] !== p[t] ? { putus: [p[t - 1]], pindah: [[p[t - 1], p[t]]] as [number, number][] } : {}) }),
          };
        });
        return {
          lajur: [...lajur, gabungan],
          kaki: [...data.aturan.flatMap((a, k) => bungkus(`${dua ? `Aturan ${k + 1}` : 'Aturan setiap langkah'}: ${a.nama}.`, 100)), 'Huruf P, H, U = putih, hijau, ungu.'],
          judul: diam ? 'Siklus warna setiap bidang dari Gambar 1 sampai Gambar 5' : 'Perpindahan dan siklus warna setiap isi bidang',
        };
      }
      // penanda: satu bidang per warna dilacak melalui permutasi aturan
      // (dipilih bidang yang paling banyak berpindah supaya perubahannya terlihat)
      const ragam = (i: number) => new Set(lacak(i)).size;
      const calon = ([H, U] as Warna[]).map((w) => F[0].flatMap((x, i) => (x === w ? [i] : [])).sort((x, y) => ragam(y) - ragam(x))[0]).filter((i) => i !== undefined);
      const jejak = calon.map(lacak);
      const lajur: Lajur[] = [
        { label: 'Seluruh gambar', sub: dua ? 'aturan 1 dan 2 bergantian' : 'aturan yang sama', mini: (t, cy) => gambar(t, cy), antara: sebut },
        {
          label: 'Penanda', sub: jejak.map((p, k) => `${'ab'[k]} = ${ringkasNama(nama(p[0]))}`).join('; '),
          kapsi: (t) => jejak.map((p, k) => `${'ab'[k]}: ${ringkasNama(nama(p[t]))}`),
          antara: sebut,
          mini: (t, cy) => gambar(t, cy, {
            sorot: jejak.map((p) => p[t]), tanda: new Map(jejak.map((p, k) => [p[t], 'ab'[k]])),
            ...(t ? { putus: jejak.map((p) => p[t - 1]), pindah: jejak.map((p) => [p[t - 1], p[t]] as [number, number]) } : {}),
          }),
        },
        ...geo.lapisan.map((l): Lajur => ({ label: kapital(l.nama), sub: 'kelompok ini saja', mini: (t, cy) => gambar(t, cy, { sorot: l.bidang }) })),
      ];
      const kaki = data.aturan.flatMap((a, k) => bungkus(`${dua ? `Aturan ${k + 1}` : 'Aturan setiap langkah'}: ${a.nama}.`, 100));
      return { lajur, kaki: [...kaki, 'Penanda a dan b mengikuti isi dua bidang tertentu; garis putus-putus = posisi pada gambar sebelumnya.'], judul: 'Perubahan seluruh gambar dan setiap kelompok bidang' };
    }
    case 'kosong': {
      const dasar = data.dasar.map((x) => (x >= 0 ? x : 0)) as Frame;
      const ac = data.acuan;
      const pusat = geo.pusat;
      const uraiDasar = ([H, U] as Warna[]).map((w) => {
        const b = data.dasar.flatMap((x, i) => (x === w && !(ac && i === pusat) ? [nama(i)] : []));
        return b.length ? `${NAMA_WARNA[w]} untuk ${b.join(', ')}` : '';
      }).filter(Boolean).join('; ');
      const lajur: Lajur[] = [
        {
          label: 'Bidang putih', sub: 'perpindahannya',
          kapsi: (t) => nama(data.putih[t]),
          mini: (t, cy) => gambar(t, cy, {
            sorot: [data.putih[t]], tanda: new Map([[data.putih[t], 'P']]),
            ...(t ? { putus: [data.putih[t - 1]], pindah: [[data.putih[t - 1], data.putih[t]]] as [number, number][] } : {}),
          }),
        },
        {
          label: 'Warna dasar', sub: 'setiap bidang', hanya: [0],
          catatan: `Bidang yang tidak sedang putih selalu kembali ke warna dasarnya: ${uraiDasar}.`,
          mini: (t, cy) => mini(geo, dasar, X(t), cy, R, pola, { tanda: new Map(data.dasar.flatMap((x, i): [number, string][] => (x > 0 && !(ac && i === pusat) ? [[i, hurufWarna(x as Warna)]] : []))) }),
        },
      ];
      if (ac && pusat !== undefined) lajur.push({
        label: 'Pusat', sub: `mengikuti ujung ${data.kataAcuan}`,
        kapsi: (t) => `acuan ${ringkasNama(nama(ac[t]))} (${NAMA_WARNA[data.dasar[ac[t]] as Warna]})`,
        mini: (t, cy) => gambar(t, cy, { sorot: [pusat, ac[t]], tanda: new Map([[pusat, hurufWarna(F[t][pusat])], [ac[t], '•']]), pindah: [[ac[t], pusat]] }),
      });
      return {
        lajur: [...lajur, gabungan],
        kaki: [ac ? 'P = bidang putih; titik (•) = ujung acuan; huruf H/U = hijau/ungu. Panah pada lajur Pusat menunjuk asal warna pusat.' : 'P = bidang putih; huruf H/U = warna dasar hijau/ungu; garis putus-putus = posisi putih sebelumnya.'],
        judul: ac ? 'Perpindahan bidang putih dan asal warna pusat' : 'Perpindahan bidang putih dan warna dasar',
      };
    }
    case 'ritme': {
      const lajur: Lajur[] = data.kelompok.map((k) => ({
        label: kapital(k.nama), sub: 'warna kelompok ini',
        kapsi: (t) => NAMA_WARNA[k.warna[t]],
        mini: (t, cy) => gambar(t, cy, { sorot: k.bidang, tanda: new Map(k.bidang.map((i) => [i, hurufWarna(k.warna[t])])) }),
      }));
      return { lajur: [...lajur, gabungan], kaki: ['Setiap kelompok dilacak sendiri. Huruf P, H, U = putih, hijau, ungu.'], judul: 'Urutan warna setiap kelompok bidang' };
    }
    case 'periodik':
      return { lajur: [{ label: 'Seluruh gambar', sub: `berulang setiap ${data.p} langkah`, mini: (t, cy) => gambar(t, cy) }], kaki: [`Gambar 5 sama dengan Gambar ${5 - data.p}.`], judul: 'Pengulangan gambar' };
  }
}

export function visualFillShape(familyId: string, item: FillShapeItem, jawaban: Frame, kode: string): GambarPembahasan[] {
  const a = aturanPembahasan(familyId, item, jawaban);
  if (!a) return [];
  const { lajur, kaki, judul } = lajurDari(geometri(item.geometri), [...item.frame, jawaban], a.data, `fs${kode}`);
  const { svg, tinggi } = susun(lajur, kaki, judul, `fs${kode}`);
  return [{ id: 'lintasan', judul, alt: `${judul}. ${a.uraian.join(' ')}`, lebar: LEBAR, tinggi, svg }];
}
