// Peta bidang wadah Fill Shape (Blueprint Induktif — Fill Shape). Koordinat dalam satuan bebas di sekitar (0,0), sumbu y ke bawah (SVG).
// Setiap wadah menyimpan: poligon tiap bidang, operasi seluruh gambar (putar/cermin/tukar lapisan/lintasan), gerak per unsur,
// cincin (urutan melingkar untuk langkah sektor), dan lapisan (kelompok bidang yang dapat berubah serempak).

export type Warna = 0 | 1 | 2;
export const W: Warna = 0;
export const H: Warna = 1;
export const U: Warna = 2;
export const NAMA_WARNA = ['putih', 'hijau', 'ungu'] as const;
export const HURUF_WARNA = ['W', 'H', 'U'] as const;
export type Frame = Warna[];

export type GeometriId = 'bintang-enam' | 'persegi-16' | 'persegi-bersarang' | 'segitiga' | 'pentagram-terbalik';

export interface Bidang { nama: string; titik: [number, number][] }
/** `perm[i]` = bidang tujuan isi bidang i. `kode` = penanda stabil untuk pembangkit (mis. 'putar:2', 'tukar', 'cermin:7'). */
export interface Operasi { nama: string; perm: number[]; kode?: string }
export interface Cincin { nama: string; bidang: number[]; satuan: string }

export interface Geometri {
  id: GeometriId;
  nama: string;
  bidang: Bidang[];
  /** Operasi seluruh gambar (termasuk identitas). */
  operasi: Operasi[];
  /** Gerak satu unsur per langkah (dipakai pelacakan lintasan unsur). */
  gerak: Operasi[];
  cincin: Cincin[];
  lapisan: { nama: string; bidang: number[] }[];
  /** Bidang yang dilalui bidang kosong bila ia bergiliran mengunjungi semuanya (segitiga). */
  lintasanPenuh?: number[];
  pusat?: number;
  ujung?: number[];
}

const rad = (d: number) => (d * Math.PI) / 180;
const pol = (r: number, deg: number): [number, number] => [+(r * Math.sin(rad(deg))).toFixed(4), +(-r * Math.cos(rad(deg))).toFixed(4)];
const mod = (a: number, n: number) => ((a % n) + n) % n;
const identitas = (n: number) => Array.from({ length: n }, (_, i) => i);

/** "putar 60° searah jarum jam" / "putar 120° berlawanan arah jarum jam" (k dinormalkan ke arah terdekat). */
export function namaPutaran(k: number, n: number, satuan?: string): string {
  const m = mod(k, n);
  if (m === 0) return 'tetap';
  const kn = m > n / 2 ? m - n : m;
  const arah = kn > 0 ? 'searah jarum jam' : 'berlawanan arah jarum jam';
  const derajat = (Math.abs(kn) * 360) / n;
  return satuan ? `geser ${Math.abs(kn)} ${satuan} (${derajat}°) ${arah}` : `putar ${derajat}° ${arah}`;
}
/** Nama gerak satu unsur: "bergeser 1 ujung searah jarum jam". */
const namaGeser = (k: number, n: number, satuan: string) => {
  const m = mod(k, n), kn = m > n / 2 ? m - n : m;
  return `bergeser ${Math.abs(kn)} ${satuan} ${kn > 0 ? 'searah' : 'berlawanan arah'} jarum jam`;
};

/** Operasi untuk wadah dua lapisan × n sektor (indeks 0..n-1 luar/ujung, n..2n-1 dalam). */
function operasiDuaLapis(n: number, cermin: { c: number; nama: string }[], o: { satuanPutar?: string; namaTukar: string; satuan: string; gantiLapis: string }) {
  const putar = (k: number) => identitas(2 * n).map((i) => (i < n ? mod(i + k, n) : n + mod(i - n + k, n)));
  const cer = (c: number) => identitas(2 * n).map((i) => (i < n ? mod(c - i, n) : n + mod(c - (i - n), n)));
  const tukar = identitas(2 * n).map((i) => (i < n ? i + n : i - n));
  const lalu = (p: number[], q: number[]) => p.map((x) => q[x]);
  const operasi: Operasi[] = [];
  const gerak: Operasi[] = [];
  for (let k = 0; k < n; k++) {
    const np = namaPutaran(k, n, o.satuanPutar);
    operasi.push({ kode: `putar:${k}`, nama: np, perm: putar(k) });
    operasi.push({ kode: k === 0 ? 'tukar' : `tukar+putar:${k}`, nama: k === 0 ? o.namaTukar : `${o.namaTukar}, lalu ${np}`, perm: lalu(tukar, putar(k)) });
    gerak.push({ kode: `putar:${k}`, nama: k === 0 ? 'tetap' : namaGeser(k, n, o.satuan), perm: putar(k) });
    gerak.push({ kode: k === 0 ? 'tukar' : `tukar+putar:${k}`, nama: k === 0 ? o.gantiLapis : `zig-zag: ${o.gantiLapis} sambil ${namaGeser(k, n, o.satuan)}`, perm: lalu(tukar, putar(k)) });
  }
  for (const { c, nama } of cermin) {
    operasi.push({ kode: `cermin:${c}`, nama, perm: cer(c) });
    operasi.push({ kode: `tukar+cermin:${c}`, nama: `${o.namaTukar}, lalu ${nama}`, perm: lalu(tukar, cer(c)) });
  }
  return { operasi, gerak };
}

// ── Bintang enam (Six-pointed Star): 6 ujung luar + 6 segitiga pusat, 0–5 searah jarum jam mulai atas ─────────────────
const ARAH6 = ['atas', 'kanan-atas', 'kanan-bawah', 'bawah', 'kiri-bawah', 'kiri-atas'];
function bintangEnam(): Geometri {
  const r = 1 / Math.sqrt(3);
  const bidang: Bidang[] = [];
  for (let k = 0; k < 6; k++) bidang.push({ nama: `ujung ${ARAH6[k]}`, titik: [pol(1, 60 * k), pol(r, 60 * k + 30), pol(r, 60 * k - 30)] });
  for (let k = 0; k < 6; k++) bidang.push({ nama: `segitiga dalam ${ARAH6[k]}`, titik: [[0, 0], pol(r, 60 * k - 30), pol(r, 60 * k + 30)] });
  const { operasi, gerak } = operasiDuaLapis(
    6,
    [0, 1, 2, 3, 4, 5].map((c) => ({ c, nama: c === 0 ? 'cerminkan terhadap sumbu vertikal'
      : c % 2 ? `cerminkan terhadap sumbu di antara ujung ${ARAH6[(c - 1) / 2]} dan ujung ${ARAH6[(c + 1) / 2]}` : `cerminkan terhadap sumbu melalui ujung ${ARAH6[c / 2]}` })),
    { namaTukar: 'tukar isi ujung dan segitiga dalam pada arah yang sama', satuan: 'posisi', gantiLapis: 'berganti lapisan (ujung ↔ segitiga dalam)' },
  );
  return {
    id: 'bintang-enam', nama: 'Bintang enam', bidang, operasi, gerak,
    cincin: [{ nama: 'ujung luar', bidang: [0, 1, 2, 3, 4, 5], satuan: 'ujung' }, { nama: 'segitiga dalam', bidang: [6, 7, 8, 9, 10, 11], satuan: 'segitiga' }],
    lapisan: [{ nama: 'ujung luar', bidang: [0, 1, 2, 3, 4, 5] }, { nama: 'segitiga dalam', bidang: [6, 7, 8, 9, 10, 11] }],
  };
}

// ── Persegi 16 bidang (Square, induktif.pdf hlm. 5 dan 7): 8 sektor luar + 8 sektor dalam, 0 = sisi atas kanan pusat ────────
const ARAH8 = ['atas-kanan', 'kanan-atas', 'kanan-bawah', 'bawah-kanan', 'bawah-kiri', 'kiri-bawah', 'kiri-atas', 'atas-kiri'];
function persegi16(): Geometri {
  const P: [number, number][] = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
  const p = P.map(([x, y]) => [x / 2, y / 2] as [number, number]);
  const bidang: Bidang[] = [];
  for (let i = 0; i < 8; i++) bidang.push({ nama: `sektor luar ${ARAH8[i]}`, titik: [p[i], P[i], P[(i + 1) % 8], p[(i + 1) % 8]] });
  for (let i = 0; i < 8; i++) bidang.push({ nama: `sektor dalam ${ARAH8[i]}`, titik: [[0, 0], p[i], p[(i + 1) % 8]] });
  const { operasi, gerak } = operasiDuaLapis(
    8,
    [{ c: 7, nama: 'cerminkan terhadap sumbu vertikal' }, { c: 3, nama: 'cerminkan terhadap sumbu horizontal' },
      { c: 1, nama: 'cerminkan terhadap diagonal kanan-atas–kiri-bawah' }, { c: 5, nama: 'cerminkan terhadap diagonal kiri-atas–kanan-bawah' }],
    { satuanPutar: 'sektor', namaTukar: 'tukar isi sektor luar dan dalam pada arah yang sama', satuan: 'sektor', gantiLapis: 'berganti lapisan (luar ↔ dalam)' },
  );
  return {
    id: 'persegi-16', nama: 'Persegi 16 bidang', bidang, operasi, gerak,
    cincin: [{ nama: 'sektor luar', bidang: [0, 1, 2, 3, 4, 5, 6, 7], satuan: 'sektor' }, { nama: 'sektor dalam', bidang: [8, 9, 10, 11, 12, 13, 14, 15], satuan: 'sektor' }],
    lapisan: [{ nama: 'lapisan luar', bidang: [0, 1, 2, 3, 4, 5, 6, 7] }, { nama: 'lapisan dalam', bidang: [8, 9, 10, 11, 12, 13, 14, 15] }],
  };
}

// ── Persegi bersarang (Square, contoh 1.pdf hlm. 1): bingkai luar 4 kuadran + persegi dalam 4 kuadran ───────────────────
const KUADRAN = ['kiri-atas', 'kanan-atas', 'kanan-bawah', 'kiri-bawah'];
export const LINTASAN_BERSARANG = {
  // luar-atas → dalam-atas → dalam-bawah → luar-bawah → luar-atas (kiri dan kanan berubah bersama)
  atasBawah: [4, 5, 1, 0, 7, 6, 2, 3],
  // luar-kiri → dalam-kiri → dalam-kanan → luar-kanan → luar-kiri
  kiriKanan: [4, 0, 3, 7, 5, 1, 2, 6],
};
function persegiBersarang(): Geometri {
  const bidang: Bidang[] = [
    { nama: 'bingkai luar kiri-atas', titik: [[-1, -1], [0, -1], [0, -0.5], [-0.5, -0.5], [-0.5, 0], [-1, 0]] },
    { nama: 'bingkai luar kanan-atas', titik: [[0, -1], [1, -1], [1, 0], [0.5, 0], [0.5, -0.5], [0, -0.5]] },
    { nama: 'bingkai luar kanan-bawah', titik: [[1, 0], [1, 1], [0, 1], [0, 0.5], [0.5, 0.5], [0.5, 0]] },
    { nama: 'bingkai luar kiri-bawah', titik: [[0, 1], [-1, 1], [-1, 0], [-0.5, 0], [-0.5, 0.5], [0, 0.5]] },
    { nama: 'persegi dalam kiri-atas', titik: [[-0.5, -0.5], [0, -0.5], [0, 0], [-0.5, 0]] },
    { nama: 'persegi dalam kanan-atas', titik: [[0, -0.5], [0.5, -0.5], [0.5, 0], [0, 0]] },
    { nama: 'persegi dalam kanan-bawah', titik: [[0, 0], [0.5, 0], [0.5, 0.5], [0, 0.5]] },
    { nama: 'persegi dalam kiri-bawah', titik: [[-0.5, 0], [0, 0], [0, 0.5], [-0.5, 0.5]] },
  ];
  const { operasi, gerak: gerakDasar } = operasiDuaLapis(
    4,
    [{ c: 1, nama: 'cerminkan terhadap sumbu vertikal' }, { c: 3, nama: 'cerminkan terhadap sumbu horizontal' },
      { c: 0, nama: 'cerminkan terhadap diagonal kiri-atas–kanan-bawah' }, { c: 2, nama: 'cerminkan terhadap diagonal kanan-atas–kiri-bawah' }],
    { namaTukar: 'tukar isi bingkai luar dan persegi dalam', satuan: 'kuadran', gantiLapis: 'berganti lapisan (bingkai luar ↔ persegi dalam)' },
  );
  const balik = (p: number[]) => { const q = new Array(p.length); p.forEach((t, i) => (q[t] = i)); return q; };
  const lintasan: Operasi[] = [
    { kode: 'lintas:atas-bawah', nama: 'pindah satu langkah pada lintasan luar-atas → dalam-atas → dalam-bawah → luar-bawah → luar-atas', perm: LINTASAN_BERSARANG.atasBawah },
    { kode: 'lintas:atas-bawah-balik', nama: 'pindah satu langkah pada lintasan luar-atas → luar-bawah → dalam-bawah → dalam-atas → luar-atas', perm: balik(LINTASAN_BERSARANG.atasBawah) },
    { kode: 'lintas:kiri-kanan', nama: 'pindah satu langkah pada lintasan luar-kiri → dalam-kiri → dalam-kanan → luar-kanan → luar-kiri', perm: LINTASAN_BERSARANG.kiriKanan },
    { kode: 'lintas:kiri-kanan-balik', nama: 'pindah satu langkah pada lintasan luar-kiri → luar-kanan → dalam-kanan → dalam-kiri → luar-kiri', perm: balik(LINTASAN_BERSARANG.kiriKanan) },
  ];
  return {
    id: 'persegi-bersarang', nama: 'Persegi bersarang', bidang: bidang.map((b, i) => ({ ...b, nama: b.nama || KUADRAN[i % 4] })),
    operasi: [...operasi, ...lintasan], gerak: [...gerakDasar, ...lintasan],
    cincin: [{ nama: 'bingkai luar', bidang: [0, 1, 2, 3], satuan: 'kuadran' }, { nama: 'persegi dalam', bidang: [4, 5, 6, 7], satuan: 'kuadran' }],
    lapisan: [{ nama: 'bingkai luar', bidang: [0, 1, 2, 3] }, { nama: 'persegi dalam', bidang: [4, 5, 6, 7] }],
  };
}

// ── Segitiga (Triangle, induktif.pdf hlm. 23): atas, kanan-bawah, kiri-bawah, tengah ────────────────────────────────
function segitiga(): Geometri {
  const T: [number, number] = [0, -1], BR = pol(1, 120), BL = pol(1, 240);
  const mid = (a: [number, number], b: [number, number]): [number, number] => [+((a[0] + b[0]) / 2).toFixed(4), +((a[1] + b[1]) / 2).toFixed(4)];
  const mTR = mid(T, BR), mB = mid(BR, BL), mTL = mid(BL, T);
  const bidang: Bidang[] = [
    { nama: 'segitiga atas', titik: [T, mTR, mTL] },
    { nama: 'segitiga kanan-bawah', titik: [mTR, BR, mB] },
    { nama: 'segitiga kiri-bawah', titik: [mTL, mB, BL] },
    { nama: 'segitiga tengah', titik: [mTL, mTR, mB] },
  ];
  const putar = (k: number) => [mod(k, 3), mod(1 + k, 3), mod(2 + k, 3), 3];
  const cer = (c: number) => [mod(c, 3), mod(c - 1, 3), mod(c - 2, 3), 3];
  const operasi: Operasi[] = [
    { kode: 'putar:0', nama: 'tetap', perm: putar(0) },
    { kode: 'putar:1', nama: 'putar 120° searah jarum jam', perm: putar(1) },
    { kode: 'putar:2', nama: 'putar 120° berlawanan arah jarum jam', perm: putar(2) },
    { kode: 'cermin:0', nama: 'cerminkan terhadap sumbu vertikal', perm: cer(0) },
    { kode: 'cermin:2', nama: 'cerminkan terhadap sumbu melalui sudut kanan-bawah', perm: cer(2) },
    { kode: 'cermin:1', nama: 'cerminkan terhadap sumbu melalui sudut kiri-bawah', perm: cer(1) },
  ];
  const gerak = [0, 1, 2].map((k) => ({ kode: `putar:${k}`, nama: k === 0 ? 'tetap' : namaGeser(k, 3, 'sudut'), perm: putar(k) }));
  return {
    id: 'segitiga', nama: 'Segitiga', bidang, operasi, gerak,
    cincin: [{ nama: 'tiga sudut', bidang: [0, 1, 2], satuan: 'sudut' }],
    lapisan: [{ nama: 'tiga sudut', bidang: [0, 1, 2] }, { nama: 'segitiga tengah', bidang: [3] }],
    lintasanPenuh: [0, 1, 2, 3],
  };
}

// ── Pentagram terbalik (Inverted Pentagram, induktif.pdf hlm. 21 dan 28): 5 ujung + pusat ───────────────────────────
const ARAH5 = ['kanan-atas', 'kanan', 'bawah', 'kiri', 'kiri-atas'];
function pentagramTerbalik(): Geometri {
  const r = Math.cos(rad(72)) / Math.cos(rad(36));
  const bidang: Bidang[] = [];
  for (let k = 0; k < 5; k++) { const a = 36 + 72 * k; bidang.push({ nama: `ujung ${ARAH5[k]}`, titik: [pol(1, a), pol(r, a + 36), pol(r, a - 36)] }); }
  bidang.push({ nama: 'pusat', titik: [0, 1, 2, 3, 4].map((j) => pol(r, 72 * j)) });
  const putar = (k: number) => [0, 1, 2, 3, 4].map((i) => mod(i + k, 5)).concat(5);
  const cer = (c: number) => [0, 1, 2, 3, 4].map((i) => mod(c - i, 5)).concat(5);
  const operasi: Operasi[] = [
    ...[0, 1, 2, 3, 4].map((k) => ({ kode: `putar:${k}`, nama: namaPutaran(k, 5), perm: putar(k) })),
    ...[0, 1, 2, 3, 4].map((c) => ({ kode: `cermin:${c}`, nama: c === 4 ? 'cerminkan terhadap sumbu vertikal' : `cerminkan terhadap sumbu melalui ujung ${ARAH5[(3 * c) % 5]}`, perm: cer(c) })),
  ];
  const gerak = [0, 1, 2, 3, 4].map((k) => ({ kode: `putar:${k}`, nama: k === 0 ? 'tetap' : namaGeser(k, 5, 'ujung'), perm: putar(k) }));
  return {
    id: 'pentagram-terbalik', nama: 'Pentagram terbalik', bidang, operasi, gerak,
    cincin: [{ nama: 'lima ujung', bidang: [0, 1, 2, 3, 4], satuan: 'ujung' }],
    lapisan: [{ nama: 'lima ujung', bidang: [0, 1, 2, 3, 4] }, { nama: 'pusat', bidang: [5] }],
    pusat: 5, ujung: [0, 1, 2, 3, 4],
  };
}

const CACHE: Partial<Record<GeometriId, Geometri>> = {};
const PEMBUAT: Record<GeometriId, () => Geometri> = {
  'bintang-enam': bintangEnam, 'persegi-16': persegi16, 'persegi-bersarang': persegiBersarang, segitiga, 'pentagram-terbalik': pentagramTerbalik,
};
export function geometri(id: GeometriId): Geometri {
  return (CACHE[id] ??= PEMBUAT[id]());
}

export function opDenganKode(geo: Geometri, kode: string): Operasi {
  const o = geo.operasi.find((x) => x.kode === kode);
  if (!o) throw new Error(`Operasi "${kode}" tidak ada pada ${geo.id}`);
  return o;
}

export const terapkan = (perm: number[], f: Frame): Frame => { const g = new Array(f.length) as Frame; f.forEach((w, i) => (g[perm[i]] = w)); return g; };
export const samaFrame = (a: Frame, b: Frame) => a.every((x, i) => x === b[i]);
export const kunciFrame = (f: Frame) => f.map((w) => HURUF_WARNA[w]).join('');

/** "hijau: ujung atas, segitiga dalam bawah; ungu: …; bidang lain putih." */
export function uraiFrame(geo: Geometri, f: Frame): string {
  const bag = ([H, U] as Warna[]).map((w) => {
    const b = f.map((x, i) => (x === w ? geo.bidang[i].nama : null)).filter(Boolean);
    return b.length ? `${NAMA_WARNA[w]}: ${b.join(', ')}` : null;
  }).filter(Boolean);
  const putih = f.filter((x) => x === W).length;
  return `${bag.join('; ')}${putih ? (putih === f.length ? 'semua bidang putih' : '; bidang lain putih') : '; tidak ada bidang putih'}`;
}
