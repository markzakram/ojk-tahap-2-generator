import { H, NAMA_WARNA, U, W, kunciFrame, samaFrame, terapkan, type Frame, type Geometri, type Warna } from './geometri';

// Solver independen Fill Shape = enumerasi pustaka aturan sederhana (Blueprint Fill Shape, "Uji aturan alternatif sederhana").
// Setiap aturan dengan seluruh nilai parameternya dicocokkan terhadap G1–G4; yang cocok meramalkan G5.
// Soal hanya terbit bila SEMUA aturan yang cocok meramalkan G5 yang sama, dan G5 itu sama dengan kunci penyusun.
//
// Pustaka aturan:
//  - periodik    : gambar berulang setiap 1–3 langkah.
//  - operasi     : satu operasi seluruh gambar (putar, cermin, tukar lapisan, lintasan, tukar warna) atau dua operasi berselang-seling.
//  - jejak       : setiap bidang berwarna = unsur yang bergerak sendiri (gerak tetap, langkah bertambah, langkah bergantian,
//                  bolak-balik, memantul); warna sama boleh punya lintasan berbeda.
//  - kosong      : tepat satu bidang putih yang berpindah, bidang lain warna dasar tetap; untuk wadah berpusat, pusat boleh
//                  menampilkan warna dasar ujung yang dikosongkan (sekarang/berikutnya/sebelumnya).
//  - ritme       : kelompok bidang (lapisan) selalu seragam; tiap kelompok punya siklus warna dengan lama bertahan 1–3 langkah.

export type JenisAturan = 'periodik' | 'operasi' | 'jejak' | 'kosong' | 'ritme';
export interface Ramalan { jenis: JenisAturan; uraian: string[]; g5: Frame }

const mod = (a: number, n: number) => ((a % n) + n) % n;
const G = (t: number) => `G${t + 1}`;
const tanda = (x: number) => (x > 0 ? `+${x}` : x < 0 ? `−${-x}` : '0');
const normal = (x: number, n: number) => { const m = mod(x, n); return m > n / 2 ? m - n : m; };

const PERM_WARNA: { nama: string; peta: Warna[] }[] = [
  { nama: '', peta: [0, 1, 2] },
  { nama: 'warna hijau dan ungu bertukar', peta: [0, 2, 1] },
  { nama: 'setiap bidang berganti warna putih → hijau → ungu → putih', peta: [1, 2, 0] },
  { nama: 'setiap bidang berganti warna putih → ungu → hijau → putih', peta: [2, 0, 1] },
  { nama: 'warna putih dan hijau bertukar', peta: [1, 0, 2] },
  { nama: 'warna putih dan ungu bertukar', peta: [2, 1, 0] },
];

interface OpLengkap { nama: string; perm: number[]; peta: Warna[] }
const CACHE_OP = new Map<string, OpLengkap[]>();
function opsLengkap(geo: Geometri): OpLengkap[] {
  let ops = CACHE_OP.get(geo.id);
  if (!ops) {
    ops = [];
    for (const pw of PERM_WARNA) for (const o of geo.operasi) {
      const nama = !pw.nama ? o.nama : o.nama === 'tetap' ? pw.nama : `${o.nama}, sambil ${pw.nama}`;
      ops.push({ nama, perm: o.perm, peta: pw.peta });
    }
    CACHE_OP.set(geo.id, ops);
  }
  return ops;
}
export const terapkanOp = (o: { perm: number[]; peta?: Warna[] }, f: Frame): Frame => {
  const g = terapkan(o.perm, f);
  return o.peta ? (g.map((w) => o.peta![w]) as Frame) : g;
};

// ── periodik ─────────────────────────────────────────────────────────────────────────────────────────────
function periodik(F: Frame[], tambah: Tambah) {
  for (let p = 1; p <= 3; p++) {
    let ok = true;
    for (let t = p; t < 4; t++) if (!samaFrame(F[t], F[t - p])) ok = false;
    if (!ok) continue;
    const pasangan = Array.from({ length: 4 - p }, (_, k) => `${G(k + p)} = ${G(k)}`).join(', ');
    tambah('periodik', [`Gambar berulang setiap ${p} langkah (${pasangan}).`, `Karena itu G5 sama dengan ${G(4 - p)}.`], F[4 - p]);
  }
}

// ── operasi seluruh gambar ───────────────────────────────────────────────────────────────────────────────
function operasi(geo: Geometri, F: Frame[], tambah: Tambah) {
  // Satu operasi boleh disertai pergantian warna; dua operasi berselang-seling hanya untuk operasi bidang (putar, cermin,
  // tukar lapisan, lintasan) tanpa pergantian warna, karena selang-seling dua penukaran warna bukan aturan sederhana.
  const ops = opsLengkap(geo);
  const A = ops.filter((o) => samaFrame(terapkanOp(o, F[0]), F[1]) && samaFrame(terapkanOp(o, F[2]), F[3]));
  if (!A.length) return;
  const tetapWarna = (o: OpLengkap) => o.peta[0] === 0 && o.peta[1] === 1 && o.peta[2] === 2;
  for (const B of ops) {
    if (!samaFrame(terapkanOp(B, F[1]), F[2])) continue;
    const g5 = terapkanOp(B, F[3]);
    const pasangan = A.filter((a) => tetapWarna(a) && tetapWarna(B));
    if (!A.includes(B) && !pasangan.length) continue;
    if (A.includes(B)) {
      tambah('operasi', [
        `Setiap langkah gambar berubah dengan aturan yang sama: ${B.nama}.`,
        `Aturan ini cocok untuk G1 → G2, G2 → G3, dan G3 → G4; terapkan sekali lagi pada G4 untuk memperoleh G5.`,
      ], g5);
    } else {
      tambah('operasi', [
        `G1 → G2 dan G3 → G4 memakai aturan pertama: ${pasangan[0].nama}.`,
        `G2 → G3 memakai aturan kedua: ${B.nama}.`,
        `Kedua aturan berselang-seling, jadi G4 → G5 kembali memakai aturan kedua.`,
      ], g5);
    }
  }
}

// ── lintasan satu unsur ──────────────────────────────────────────────────────────────────────────────────
/** pos[k] = posisi pada t = k − 1 (t = −1 … 5). */
interface Jejak { pos: number[]; uraian: string }

function kandidatJejak(geo: Geometri, r: number, S: Set<number>[], opsi: { siklusPenuh?: boolean } = {}): Jejak[] {
  const nama = (i: number) => geo.bidang[i].nama;
  const hasil: Jejak[] = [];
  const lihat = new Set<string>();
  const coba = (pos: number[], uraian: string) => {
    if (pos[1] !== r) return;
    for (let t = 1; t <= 3; t++) if (!S[t].has(pos[t + 1])) return;
    const k = pos.join(',');
    if (lihat.has(k)) return;
    lihat.add(k);
    hasil.push({ pos, uraian });
  };
  // bolak-balik dua posisi (dicoba lebih dulu agar gerak berperiode dua dijelaskan sebagai bolak-balik)
  for (const x of S[1]) if (x !== r) coba([x, r, x, r, x, r, x], `bolak-balik antara ${nama(r)} dan ${nama(x)}`);
  // gerak tetap (permutasi yang sama setiap langkah)
  for (const g of geo.gerak) {
    const inv = new Array(g.perm.length); g.perm.forEach((t, i) => (inv[t] = i));
    const pos = [inv[r], r];
    for (let t = 1; t <= 5; t++) pos.push(g.perm[pos[pos.length - 1]]);
    coba(pos, g.nama === 'tetap' ? 'diam di tempat' : `${g.nama} setiap langkah`);
  }
  for (const c of geo.cincin) {
    const n = c.bidang.length;
    const i0 = c.bidang.indexOf(r);
    if (i0 < 0) continue;
    const di = (x: number) => c.bidang[mod(i0 + x, n)];
    // langkah bertambah tetap: a, a+b, a+2b, …
    for (let a = 0; a < n; a++) for (let b = 1; b < n; b++) {
      const pos = [-1, 0, 1, 2, 3, 4, 5].map((t) => di(a * t + (b * t * (t - 1)) / 2));
      const an = normal(a, n), bn = normal(b, n);
      const langkah = [0, 1, 2, 3].map((k) => tanda(an + k * bn));
      coba(pos, `bergerak di ${c.nama} dengan langkah ${langkah.slice(0, 3).join(', ')} ${c.satuan} (positif = searah jarum jam); besar langkah berubah ${tanda(bn)} setiap kali, jadi langkah berikutnya ${langkah[3]} ${c.satuan}`);
    }
    // langkah bergantian a, b, a, b
    for (let a = 1; a < n; a++) for (let b = 1; b < n; b++) {
      if (a === b) continue;
      const pos = [-1, 0, 1, 2, 3, 4, 5].map((t) => (t < 0 ? di(-b) : di(a * Math.ceil(t / 2) + b * Math.floor(t / 2))));
      coba(pos, `bergerak di ${c.nama} dengan langkah bergantian ${tanda(normal(a, n))} lalu ${tanda(normal(b, n))} ${c.satuan} (positif = searah jarum jam)`);
    }
  }
  // memantul pada lintasan tiga posisi
  for (const a of S[1]) for (const b of S[2]) {
    if (a === r || b === r || a === b) continue;
    coba([a, r, a, b, a, r, a], `memantul ${nama(r)} → ${nama(a)} → ${nama(b)} → ${nama(a)} → ${nama(r)}`);
  }
  for (const a of S[1]) for (const b of S[3]) {
    if (a === r || b === r || a === b) continue;
    coba([b, r, a, r, b, r, a], `memantul bolak-balik dengan ${nama(r)} di tengah: ${nama(r)} → ${nama(a)} → ${nama(r)} → ${nama(b)} → ${nama(r)}`);
  }
  if (opsi.siklusPenuh && geo.lintasanPenuh) {
    const p = [...S].map((s) => [...s][0]);
    if (new Set(p).size === geo.lintasanPenuh.length && p.every((x) => geo.lintasanPenuh!.includes(x))) {
      coba([p[3], p[0], p[1], p[2], p[3], p[0], p[1]], `bergiliran mengunjungi keempat bidang dengan urutan tetap (${p.map(nama).join(' → ')}), lalu mengulang dari awal`);
    }
  }
  return hasil;
}

function hipotesisJejak(geo: Geometri, F: Frame[], tambah: Tambah) {
  const n = F[0].length;
  const warna = ([H, U] as Warna[]).filter((c) => F[0].includes(c));
  if (!warna.length) return;
  for (const c of warna) {
    const k = F[0].filter((x) => x === c).length;
    if (k > 4 || F.some((f) => f.filter((x) => x === c).length !== k)) return;
  }
  if (F[0].filter((x) => x !== W).length > 6) return;
  const nama = (i: number) => geo.bidang[i].nama;
  const perWarna: { pos: number[]; uraian: string[] }[][] = [];
  for (const c of warna) {
    const S = F.map((f) => new Set(f.flatMap((x, i) => (x === c ? [i] : []))));
    const reg = [...S[0]];
    const kand = reg.map((r) => kandidatJejak(geo, r, S));
    if (kand.some((k) => !k.length)) return;
    const hasil = new Map<string, { pos: number[]; uraian: string[] }>();
    const pilih: Jejak[] = [];
    const dfs = (j: number) => {
      if (hasil.size > 6) return;
      if (j === reg.length) {
        const pos = pilih.map((x) => x.pos[5]);
        if (new Set(pos).size !== pos.length) return;
        const kunci = [...pos].sort((a, b) => a - b).join(',');
        if (!hasil.has(kunci)) {
          hasil.set(kunci, {
            pos,
            uraian: pilih.map((x) => `Unsur ${NAMA_WARNA[c]} yang pada G1 berada di ${nama(x.pos[1])} ${x.uraian}: ${[1, 2, 3, 4].map((t) => nama(x.pos[t])).join(' → ')}, sehingga pada G5 berada di ${nama(x.pos[5])}.`),
          });
        }
        return;
      }
      for (const x of kand[j]) {
        let bentrok = false;
        for (const y of pilih) for (let t = 2; t <= 4; t++) if (x.pos[t] === y.pos[t]) bentrok = true;
        if (bentrok) continue;
        pilih.push(x); dfs(j + 1); pilih.pop();
      }
    };
    dfs(0);
    if (!hasil.size) return;
    perWarna.push([...hasil.values()]);
  }
  const gabung = (i: number, g5: Frame, uraian: string[]) => {
    if (i === perWarna.length) {
      tambah('jejak', [`Setiap bidang berwarna dilacak sebagai unsur yang bergerak sendiri; warna yang sama belum tentu bergerak bersama.`, ...uraian], g5);
      return;
    }
    for (const p of perWarna[i]) {
      if (p.pos.some((x) => g5[x] !== W)) continue;
      const g = [...g5] as Frame;
      p.pos.forEach((x) => (g[x] = warna[i]));
      gabung(i + 1, g, [...uraian, ...p.uraian]);
    }
  };
  gabung(0, new Array(n).fill(W) as Frame, []);
}

// ── bidang kosong berpindah ──────────────────────────────────────────────────────────────────────────────
function hipotesisKosong(geo: Geometri, F: Frame[], tambah: Tambah) {
  const n = F[0].length;
  const p = F.map((f) => { const w = f.flatMap((x, i) => (x === W ? [i] : [])); return w.length === 1 ? w[0] : -1; });
  if (p.some((x) => x < 0)) return;
  const nama = (i: number) => geo.bidang[i].nama;
  const awal = `Setiap gambar memiliki tepat satu bidang putih: ${p.map((x, t) => `${G(t)} ${nama(x)}`).join(', ')}.`;
  const jejak = kandidatJejak(geo, p[0], p.map((x) => new Set([x])), { siklusPenuh: true });
  const dasarDari = (abaikan: number | undefined) => {
    const dasar: number[] = new Array(n).fill(-1);
    for (let t = 0; t < 4; t++) for (let i = 0; i < n; i++) {
      if (i === p[t] || i === abaikan) continue;
      if (dasar[i] === -1) dasar[i] = F[t][i];
      else if (dasar[i] !== F[t][i]) return null;
    }
    return dasar;
  };
  const uraiDasar = (dasar: number[], kecuali: number[]) => ([H, U] as Warna[]).map((w) => {
    const b = dasar.flatMap((x, i) => (x === w && !kecuali.includes(i) ? [nama(i)] : []));
    return b.length ? `${NAMA_WARNA[w]} untuk ${b.join(', ')}` : '';
  }).filter(Boolean).join('; ');
  for (const tr of jejak) {
    const p4 = tr.pos[5];
    const dasar = dasarDari(undefined);
    if (dasar && dasar.every((x, i) => x >= 0 || i === p4)) {
      const g5 = dasar.map((x, i) => (i === p4 ? W : x)) as Frame;
      tambah('kosong', [awal, `Bidang putih ${tr.uraian}; pada G5 putih berada di ${nama(p4)}.`,
        `Bidang yang tidak sedang putih selalu kembali ke warna dasarnya: ${uraiDasar(dasar, [])}.`], g5);
    }
    if (geo.pusat === undefined || !geo.ujung || !tr.pos.every((x) => geo.ujung!.includes(x))) continue;
    const pusat = geo.pusat;
    const d2 = dasarDari(pusat);
    if (!d2) continue;
    for (const lag of [0, 1, -1]) {
      let ok = true;
      for (let t = 0; t < 4 && ok; t++) { const b = d2[tr.pos[t + 1 + lag]]; if (b < 0 || F[t][pusat] !== b) ok = false; }
      const b5 = d2[tr.pos[5 + lag]];
      if (!ok || b5 < 0 || !geo.ujung.every((i) => i === p4 || d2[i] >= 0)) continue;
      const g5 = new Array(n).fill(W) as Frame;
      for (const i of geo.ujung) g5[i] = (i === p4 ? W : d2[i]) as Warna;
      g5[pusat] = b5 as Warna;
      const kata = lag === 0 ? 'yang sedang dikosongkan' : lag === 1 ? 'yang akan dikosongkan pada gambar berikutnya' : 'yang dikosongkan pada gambar sebelumnya';
      tambah('kosong', [awal, `Bidang putih ${tr.uraian}; pada G5 putih berada di ${nama(p4)}.`,
        `Ujung yang tidak sedang putih selalu kembali ke warna dasarnya: ${uraiDasar(d2, [pusat])}.`,
        `Pusat menampilkan warna dasar ujung ${kata}: ${[0, 1, 2, 3].map((t) => `${G(t)} ${NAMA_WARNA[F[t][pusat]]}`).join(', ')}.`,
        `Ujung ${kata} pada G5 adalah ${nama(tr.pos[5 + lag])} yang berwarna dasar ${NAMA_WARNA[b5]}, jadi pusat G5 ${NAMA_WARNA[b5]}.`], g5);
    }
  }
}

// ── ritme lapisan ────────────────────────────────────────────────────────────────────────────────────────
const SIKLUS: Warna[][] = [[0], [1], [2], [0, 1], [1, 0], [0, 2], [2, 0], [1, 2], [2, 1], [0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
function hipotesisRitme(geo: Geometri, F: Frame[], tambah: Tambah) {
  const kel = geo.lapisan;
  if (!F.every((f) => kel.every((g) => g.bidang.every((i) => f[i] === f[g.bidang[0]])))) return;
  const perKel = kel.map((g) => {
    const s = F.map((f) => f[g.bidang[0]]);
    const ram = new Map<Warna, string>();
    const urut = s.map((w) => NAMA_WARNA[w]).join(' → ');
    for (const C of SIKLUS) for (let d = 1; d <= (C.length === 1 ? 1 : 3); d++) for (let o = 0; o < d * C.length; o++) {
      const w = (t: number) => C[Math.floor((t + o) / d) % C.length];
      if (![0, 1, 2, 3].every((t) => w(t) === s[t])) continue;
      const x = w(4);
      if (ram.has(x)) continue;
      const i0 = C.indexOf(s[0]);
      const nmC = [...C.slice(i0), ...C.slice(0, i0), s[0]].map((c) => NAMA_WARNA[c]).join(' → ');
      const Nama = g.nama[0].toUpperCase() + g.nama.slice(1);
      const akhir = s[2] === s[3] ? `warna ${NAMA_WARNA[s[3]]} masih bertahan` : `warna ${NAMA_WARNA[s[3]]} baru muncul di G4`;
      ram.set(x, C.length === 1 ? `${Nama} selalu ${NAMA_WARNA[x]}.`
        : d === 1 ? `${Nama} berganti setiap langkah dengan siklus ${nmC}: ${urut}, jadi G5 ${NAMA_WARNA[x]}.`
          : `${Nama} berubah lebih lambat: setiap warna bertahan ${d} langkah dengan siklus ${nmC}. Yang terlihat ${urut}; ${akhir}, jadi G5 ${NAMA_WARNA[x]}.`);
    }
    return [...ram.entries()];
  });
  if (perKel.some((p) => !p.length)) return;
  const gabung = (i: number, g5: Frame, uraian: string[]) => {
    if (i === kel.length) {
      tambah('ritme', [`Bidang terbagi menjadi kelompok yang selalu berwarna seragam: ${kel.map((g) => g.nama).join(' dan ')}. Lacak setiap kelompok secara terpisah.`, ...uraian], g5);
      return;
    }
    for (const [w, u] of perKel[i]) {
      const g = [...g5] as Frame;
      kel[i].bidang.forEach((b) => (g[b] = w));
      gabung(i + 1, g, [...uraian, u]);
    }
  };
  gabung(0, [...F[0]] as Frame, []);
}

type Tambah = (jenis: JenisAturan, uraian: string[], g5: Frame) => void;

/** Semua ramalan G5 dari aturan yang cocok dengan G1–G4 (satu entri per jenis aturan × G5 berbeda). */
export function ramalkan(geo: Geometri, F: Frame[]): Ramalan[] {
  const out: Ramalan[] = [];
  const lihat = new Set<string>();
  const tambah: Tambah = (jenis, uraian, g5) => {
    const k = jenis + kunciFrame(g5);
    if (lihat.has(k)) return;
    lihat.add(k);
    out.push({ jenis, uraian, g5 });
  };
  periodik(F, tambah);
  operasi(geo, F, tambah);
  hipotesisJejak(geo, F, tambah);
  hipotesisKosong(geo, F, tambah);
  hipotesisRitme(geo, F, tambah);
  return out;
}
