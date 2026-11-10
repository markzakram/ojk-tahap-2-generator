import type { Rng } from '../../core/rng';
import type { Family, Label } from '../../core/types';
import { chapterById } from '../../data/chapters';
import { ramalkan, terapkanOp, type JenisAturan } from './aturan';
import {
  H, U, W, geometri, kunciFrame, opDenganKode, samaFrame, uraiFrame,
  type Frame, type Geometri, type GeometriId, type Warna,
} from './geometri';

// Blueprint Induktif — Fill Shape. Peserta melihat G1–G4 lalu mewarnai G5 (klik bidang: putih → hijau → ungu).
// Komposisi 70% SHL / 30% VARIASI dihitung per paket saat penyusunan, bukan per family.

export interface FillShapeItem {
  jenis: 'fill-shape';
  geometri: GeometriId;
  /** G1–G4 (stimulus). G5 = jawaban. */
  frame: Frame[];
}

const mod = (a: number, n: number) => ((a % n) + n) % n;
const lain = (w: Warna): Warna => (w === H ? U : H);
const kosong = (n: number) => new Array(n).fill(W) as Frame;

/** Isi acak hijau/ungu dengan minimal `min` bidang untuk tiap warna. */
function acakHU(r: Rng, n: number, min: number): Frame {
  for (;;) {
    const f = Array.from({ length: n }, () => (r.next() < 0.5 ? H : U)) as Frame;
    const h = f.filter((x) => x === H).length;
    if (h >= min && n - h >= min) return f;
  }
}

interface CfgFS {
  id: string;
  nama: string;
  chapter: string;
  label: Label;
  sumber: string;
  ringkas: string;
  geometri: GeometriId;
  /** Jenis aturan pustaka yang menjadi penjelasan utama family ini (dipakai pembahasan). */
  jenis: JenisAturan[];
  /** Lima frame G1–G5 menurut mekanisme family, atau null bila kandidat ditolak. */
  bangun(r: Rng, geo: Geometri): Frame[] | null;
  periksa?(F: Frame[], geo: Geometri): string[];
  caraCepat?: string;
}

function buat(cfg: CfgFS): Family<FillShapeItem, Frame> {
  return {
    id: cfg.id, versi: 1, nama: cfg.nama, chapter: chapterById(cfg.chapter), label: cfg.label, sumber: cfg.sumber, ringkas: cfg.ringkas,
    maksPercobaan: 600,
    bangun(r) {
      const geo = geometri(cfg.geometri);
      const F = cfg.bangun(r, geo);
      if (!F) return null;
      return { item: { jenis: 'fill-shape', geometri: cfg.geometri, frame: F.slice(0, 4) }, jawaban: F[4] };
    },
    pecahkan(item) {
      const geo = geometri(item.geometri);
      const unik = new Map<string, Frame>();
      for (const x of ramalkan(geo, item.frame)) unik.set(kunciFrame(x.g5), x.g5);
      return [...unik.values()];
    },
    kunci: kunciFrame,
    periksa(item, jawaban) {
      const geo = geometri(item.geometri);
      const m: string[] = [];
      const F = [...item.frame, jawaban];
      for (let t = 0; t < 3; t++) if (samaFrame(F[t], F[t + 1])) m.push('dua gambar stimulus berurutan sama');
      if (F.slice(0, 4).some((f) => f.every((x) => x === W))) m.push('ada gambar stimulus yang seluruhnya putih');
      if (F.slice(0, 4).every((f) => samaFrame(f, F[0]))) m.push('stimulus tidak berubah');
      if (jawaban.every((x) => x === W)) m.push('G5 seluruhnya putih (peserta tidak perlu mewarnai apa pun)');
      return [...m, ...(cfg.periksa?.(F, geo) ?? [])];
    },
    bahas(item, jawaban) {
      const geo = geometri(item.geometri);
      const semua = ramalkan(geo, item.frame);
      const utama = semua.find((x) => cfg.jenis.includes(x.jenis) && samaFrame(x.g5, jawaban));
      if (!utama) return null;
      const lainnya = [...new Set(semua.filter((x) => x !== utama).map((x) => x.jenis))];
      const langkah = [
        ...utama.uraian.map((teks) => ({ teks })),
        { teks: `G5 — ${uraiFrame(geo, jawaban)}.` },
      ];
      if (lainnya.length) langkah.push({ teks: `Aturan lain yang juga cocok dengan G1–G4 (${lainnya.join(', ')}) menghasilkan G5 yang sama, jadi jawabannya tunggal.` });
      return { jawaban: uraiFrame(geo, jawaban), langkah, caraCepat: cfg.caraCepat };
    },
    sidik(item, jawaban) {
      // Warna hijau/ungu dinamai menurut kemunculan pertama: soal yang hanya menukar kedua warna dianggap struktur sama.
      const F = [...item.frame, jawaban];
      let pertama: Warna | null = null;
      for (const f of F) for (const x of f) if (x !== W && pertama === null) pertama = x;
      return `${item.geometri}|${F.map((f) => f.map((x) => (x === W ? '.' : x === pertama ? 'a' : 'b')).join('')).join('/')}`;
    },
  };
}

/** Lima frame dari F0 dengan operasi berselang-seling (A, B, A, B). */
const selangSeling = (F0: Frame, A: { perm: number[] }, B: { perm: number[] }) => {
  const F = [F0];
  for (let t = 0; t < 4; t++) F.push(terapkanOp(t % 2 === 0 ? A : B, F[t]));
  return F;
};
const tampak = (F: Frame[]) => F.slice(0, Math.min(4, F.length)).every((f, t) => F.slice(0, t).every((g) => !samaFrame(f, g)));

// ═══ Six-pointed Star ════════════════════════════════════════════════════════════════════════════════
const CH_BINTANG = 'fill-shape-six-pointed-star';
const lam6 = (i: number) => (i < 6 ? i + 6 : i - 6);
const rot6 = (i: number, d: number) => (i < 6 ? mod(i + d, 6) : 6 + mod(i - 6 + d, 6));

export const fsBintangJalur = buat({
  id: 'FS-HEX-JALUR', nama: 'Beberapa unsur dengan lintasan berbeda', chapter: CH_BINTANG, label: 'SHL',
  sumber: 'Blueprint Fill Shape D · induktif.pdf hlm. 1',
  ringkas: 'Tiga unsur bergerak sendiri-sendiri: satu bolak-balik ujung ↔ segitiga dalam, satu berputar di satu lapisan, satu zig-zag berganti lapisan. Warna sama belum tentu satu kelompok.',
  geometri: 'bintang-enam', jenis: ['jejak'],
  caraCepat: 'Pisahkan aturan per unsur; telusuri identitas dua bidang berwarna sama dari lintasan yang paling konsisten.',
  bangun(r) {
    const s = [r.int(0, 11), r.int(0, 11), r.int(0, 11)];
    const d2 = r.pick([1, -1]), d3 = r.pick([1, -1]);
    const posisi = (u: number, t: number) => {
      if (u === 0) return t % 2 === 0 ? s[0] : lam6(s[0]);
      if (u === 1) return rot6(s[1], d2 * t);
      let x = s[2];
      for (let k = 0; k < t; k++) x = lam6(rot6(x, d3));
      return x;
    };
    const solo = r.int(0, 2);
    const wSolo = r.pick([H, U]);
    const F: Frame[] = [];
    for (let t = 0; t < 5; t++) {
      const f = kosong(12);
      const p = [0, 1, 2].map((u) => posisi(u, t));
      if (new Set(p).size < 3) return null;
      p.forEach((x, u) => (f[x] = u === solo ? wSolo : lain(wSolo)));
      F.push(f);
    }
    return tampak(F) ? F : null;
  },
});

export const fsBintangTukar = buat({
  id: 'FS-HEX-TUKAR', nama: 'Tukar lapisan dan cermin bergantian', chapter: CH_BINTANG, label: 'SHL',
  sumber: 'Blueprint Fill Shape D · induktif.pdf hlm. 7 (mekanisme sama pada wadah bintang enam yang hubungan bidangnya setara)',
  ringkas: 'Seluruh 12 bidang terisi. Aturan A = tukar isi ujung ↔ segitiga dalam pada arah yang sama; aturan B = cermin terhadap sumbu vertikal; A dan B berselang-seling.',
  geometri: 'bintang-enam', jenis: ['operasi'],
  caraCepat: 'Kedua operasi membatalkan dirinya sendiri setelah dua kali, sehingga rangkaian A–B–A–B berperiode empat.',
  bangun(r, geo) {
    const A = opDenganKode(geo, 'tukar');
    const B = opDenganKode(geo, 'cermin:0');
    const F = r.next() < 0.5 ? selangSeling(acakHU(r, 12, 4), A, B) : selangSeling(acakHU(r, 12, 4), B, A);
    return tampak(F) ? F : null;
  },
});

export const fsBintangKecepatan = buat({
  id: 'FS-HEX-KECEPATAN', nama: 'Dua warna dengan kecepatan berbeda', chapter: CH_BINTANG, label: 'VARIASI',
  sumber: 'Blueprint Fill Shape D, variasi: dua warna bergerak dengan kecepatan berbeda',
  ringkas: 'Satu warna berputar di ujung luar, warna lain berputar di segitiga dalam dengan besar langkah berbeda.',
  geometri: 'bintang-enam', jenis: ['jejak'],
  bangun(r) {
    const [da, db] = r.sample([-2, -1, 1, 2], 2);
    const wa = r.pick([H, U]);
    const luar = r.sample([0, 1, 2, 3, 4, 5], r.int(1, 2));
    const dalam = r.sample([0, 1, 2, 3, 4, 5], r.int(1, 2));
    const F: Frame[] = [];
    for (let t = 0; t < 5; t++) {
      const f = kosong(12);
      for (const i of luar) f[mod(i + da * t, 6)] = wa;
      for (const i of dalam) f[6 + mod(i + db * t, 6)] = lain(wa);
      F.push(f);
    }
    return tampak(F) ? F : null;
  },
});

export const fsBintangPutarTukar = buat({
  id: 'FS-HEX-PUTAR-TUKAR', nama: 'Putaran diselingi tukar lapisan', chapter: CH_BINTANG, label: 'VARIASI',
  sumber: 'Blueprint Fill Shape D, variasi: rotasi diselingi pertukaran lapisan',
  ringkas: 'Aturan A = tukar isi ujung ↔ segitiga dalam; aturan B = putar seluruh gambar 60° atau 120°; A dan B berselang-seling.',
  geometri: 'bintang-enam', jenis: ['operasi'],
  bangun(r, geo) {
    const A = opDenganKode(geo, 'tukar');
    const k = r.pick([1, 2, 4, 5]);
    const B = opDenganKode(geo, `putar:${k}`);
    const F0 = acakHU(r, 12, 4);
    for (const i of r.sample([...Array(12).keys()], r.int(0, 2))) F0[i] = W;
    const F = r.next() < 0.5 ? selangSeling(F0, A, B) : selangSeling(F0, B, A);
    return tampak(F) ? F : null;
  },
});

// ═══ Square ══════════════════════════════════════════════════════════════════════════════════════════
const CH_PERSEGI = 'fill-shape-square';
const irisan = (pos: number[], w: Warna): Frame[] => pos.map((s) => { const f = kosong(16); f[s] = w; f[s + 8] = w; return f; });

export const fsPersegiLintas = buat({
  id: 'FS-SQ-LINTAS', nama: 'Perpindahan melalui jalur luar–dalam', chapter: CH_PERSEGI, label: 'SHL',
  sumber: 'Blueprint Fill Shape A · contoh 1.pdf hlm. 1',
  ringkas: 'Persegi bersarang dibagi atas–bawah (atau kiri–kanan). Setiap kelompok warna berpindah satu langkah pada lintasan empat posisi luar → dalam → dalam → luar.',
  geometri: 'persegi-bersarang', jenis: ['operasi', 'jejak'],
  caraCepat: 'Kiri dan kanan pada satu tingkat berubah bersama; baca sebagai satu kelompok yang menempuh lintasan berulang, bukan putaran seluruh gambar.',
  bangun(r, geo) {
    const atasBawah = r.next() < 0.5;
    const jalur = opDenganKode(geo, `lintas:${atasBawah ? 'atas-bawah' : 'kiri-kanan'}${r.next() < 0.5 ? '' : '-balik'}`);
    const pita = atasBawah ? [[0, 1], [4, 5], [7, 6], [3, 2]] : [[0, 3], [4, 7], [5, 6], [1, 2]];
    const isi = r.shuffle([H, U, W, r.pick([W, W, H, U])] as Warna[]);
    const F0 = kosong(8);
    pita.forEach((p, j) => p.forEach((i) => (F0[i] = isi[j])));
    const F = [F0];
    for (let t = 0; t < 4; t++) F.push(terapkanOp(jalur, F[t]));
    return tampak(F) ? F : null;
  },
});

export const fsPersegiLangkah = buat({
  id: 'FS-SQ-LANGKAH', nama: 'Perpindahan dengan besar langkah bertambah', chapter: CH_PERSEGI, label: 'SHL',
  sumber: 'Blueprint Fill Shape A · induktif.pdf hlm. 5',
  ringkas: 'Satu irisan (sektor luar + dalam) berpindah di delapan sektor dengan langkah a, 2a, 3a, lalu 4a sektor.',
  geometri: 'persegi-16', jenis: ['jejak'],
  caraCepat: 'Bedakan posisi dari perubahan posisi: hitung selisih sektor antargambar, lalu teruskan deret selisihnya.',
  bangun(r) {
    const s0 = r.int(0, 7), a = r.pick([1, 2, 3, 5, 6, 7]);
    const pos = [0, 1, 2, 3, 4].map((t) => mod(s0 + (a * t * (t + 1)) / 2, 8));
    if (pos.slice(0, 4).some((p, t) => t > 0 && p === pos[t - 1])) return null;
    return irisan(pos, r.pick([H, U]));
  },
});

export const fsPersegiTukar = buat({
  id: 'FS-SQ-TUKAR', nama: 'Pertukaran lapisan dan pencerminan bergantian', chapter: CH_PERSEGI, label: 'SHL',
  sumber: 'Blueprint Fill Shape D · induktif.pdf hlm. 7',
  ringkas: 'Delapan sektor luar + delapan sektor dalam terisi hijau/ungu. A = tukar isi pasangan luar–dalam; B = cermin terhadap sumbu vertikal; A–B–A–B.',
  geometri: 'persegi-16', jenis: ['operasi'],
  caraCepat: 'Kedua operasi membatalkan dirinya setelah dua penerapan dan dapat dipertukarkan, sehingga G5 = G1.',
  bangun(r, geo) {
    const A = opDenganKode(geo, 'tukar');
    const B = opDenganKode(geo, 'cermin:7');
    const F = r.next() < 0.5 ? selangSeling(acakHU(r, 16, 5), A, B) : selangSeling(acakHU(r, 16, 5), B, A);
    return tampak(F) ? F : null;
  },
});

export const fsPersegiPutarTukar = buat({
  id: 'FS-SQ-PUTAR-TUKAR', nama: 'Putaran diselingi pertukaran lapisan', chapter: CH_PERSEGI, label: 'VARIASI',
  sumber: 'Blueprint Fill Shape D, variasi: rotasi diselingi pertukaran lapisan',
  ringkas: 'A = tukar isi sektor luar ↔ dalam; B = geser seluruh gambar 1–3 sektor; A dan B berselang-seling.',
  geometri: 'persegi-16', jenis: ['operasi'],
  bangun(r, geo) {
    const A = opDenganKode(geo, 'tukar');
    const k = r.pick([1, 2, 3, 5, 6, 7]);
    const B = opDenganKode(geo, `putar:${k}`);
    const F = r.next() < 0.5 ? selangSeling(acakHU(r, 16, 5), A, B) : selangSeling(acakHU(r, 16, 5), B, A);
    return tampak(F) ? F : null;
  },
});

export const fsPersegiBergantian = buat({
  id: 'FS-SQ-BERGANTIAN', nama: 'Langkah bergantian', chapter: CH_PERSEGI, label: 'VARIASI',
  sumber: 'Blueprint Fill Shape A, variasi: langkah bergantian +1, +2',
  ringkas: 'Satu irisan berpindah dengan dua besar langkah yang bergantian (mis. +1, +3, +1, +3 sektor).',
  geometri: 'persegi-16', jenis: ['jejak'],
  bangun(r) {
    const s0 = r.int(0, 7);
    const [a, b] = r.sample([1, 2, 3, 5, 6, 7], 2);
    if ((a + b) % 8 === 0) return null;
    const pos = [0, 1, 2, 3, 4].map((t) => mod(s0 + a * Math.ceil(t / 2) + b * Math.floor(t / 2), 8));
    return irisan(pos, r.pick([H, U]));
  },
});

export const fsPersegiKecepatan = buat({
  id: 'FS-SQ-KECEPATAN', nama: 'Dua warna dengan kecepatan berbeda', chapter: CH_PERSEGI, label: 'VARIASI',
  sumber: 'Blueprint Fill Shape D, variasi: dua warna bergerak dengan kecepatan berbeda',
  ringkas: 'Satu warna berputar di sektor luar, warna lain di sektor dalam, dengan besar langkah berbeda.',
  geometri: 'persegi-16', jenis: ['jejak'],
  bangun(r) {
    const [da, db] = r.sample([-3, -2, -1, 1, 2, 3], 2);
    const wa = r.pick([H, U]);
    const luar = r.sample([...Array(8).keys()], r.int(1, 2));
    const dalam = r.sample([...Array(8).keys()], r.int(1, 2));
    const F: Frame[] = [];
    for (let t = 0; t < 5; t++) {
      const f = kosong(16);
      for (const i of luar) f[mod(i + da * t, 8)] = wa;
      for (const i of dalam) f[8 + mod(i + db * t, 8)] = lain(wa);
      F.push(f);
    }
    return tampak(F) ? F : null;
  },
});

// ═══ Triangle ════════════════════════════════════════════════════════════════════════════════════════
const CH_SEGITIGA = 'fill-shape-triangle';
/** Warna dasar acak untuk n bidang, hijau dan ungu sama-sama muncul. */
const dasarHU = (r: Rng, n: number) => acakHU(r, n, 1);
const denganKosong = (dasar: Frame, pos: number[]) => pos.map((p) => dasar.map((x, i) => (i === p ? W : x)) as Frame);

export const fsSegitigaKosong = buat({
  id: 'FS-TRI-KOSONG', nama: 'Pergiliran bidang kosong, warna dasar tetap', chapter: CH_SEGITIGA, label: 'SHL',
  sumber: 'Blueprint Fill Shape B · induktif.pdf hlm. 23',
  ringkas: 'Empat bidang memiliki warna dasar tetap; satu bidang dikosongkan bergiliran mengunjungi keempatnya dengan urutan tetap.',
  geometri: 'segitiga', jenis: ['kosong'],
  caraCepat: 'Lacak kekosongannya, bukan warnanya: jumlah hijau/ungu berubah hanya karena bidang yang sedang dikosongkan.',
  bangun(r) {
    const dasar = dasarHU(r, 4);
    const urut = r.shuffle([0, 1, 2, 3]);
    return denganKosong(dasar, [0, 1, 2, 3, 4].map((t) => urut[t % 4]));
  },
});

export const fsSegitigaSiklus = buat({
  id: 'FS-TRI-SIKLUS', nama: 'Isi berganti W → H → U tanpa perpindahan', chapter: CH_SEGITIGA, label: 'VARIASI',
  sumber: 'Blueprint Fill Shape B, variasi: isi tetap berganti W→H→U tanpa perpindahan',
  ringkas: 'Setiap bidang mengganti warnanya satu langkah dalam siklus putih → hijau → ungu (atau sebaliknya); sudut dapat ikut berputar.',
  geometri: 'segitiga', jenis: ['operasi'],
  bangun(r, geo) {
    const F0 = Array.from({ length: 4 }, () => r.pick([W, H, U])) as Frame;
    if (new Set(F0).size < 2) return null;
    const putar = geo.operasi[r.int(0, 2)];
    const peta: Warna[] = r.next() < 0.5 ? [1, 2, 0] : [2, 0, 1];
    const F = [F0];
    for (let t = 0; t < 4; t++) F.push(terapkanOp({ perm: putar.perm, peta }, F[t]));
    // Siklus tiga warna berperiode tiga: G4 = G1 adalah bagian mekanismenya, cukup G1–G3 berbeda.
    return tampak(F.slice(0, 3)) ? F : null;
  },
});

export const fsSegitigaPantul = buat({
  id: 'FS-TRI-PANTUL', nama: 'Bidang kosong memantul', chapter: CH_SEGITIGA, label: 'VARIASI',
  sumber: 'Blueprint Fill Shape A/B, variasi: gerak memantul pada bidang kosong',
  ringkas: 'Bidang putih memantul pada lintasan sudut → tengah → sudut lain → tengah → …; bidang lain warna dasar tetap.',
  geometri: 'segitiga', jenis: ['kosong'],
  bangun(r) {
    const dasar = dasarHU(r, 4);
    const [c1, c2] = r.sample([0, 1, 2], 2);
    const seq = [c1, 3, c2, 3];
    const fase = r.int(0, 1);
    return denganKosong(dasar, [0, 1, 2, 3, 4].map((t) => seq[(fase + t) % 4]));
  },
});

// ═══ Inverted Pentagram ══════════════════════════════════════════════════════════════════════════════
const CH_PENTA = 'fill-shape-inverted-pentagram';
function pentaKosong(r: Rng, langkah: number[], lag: number[]): Frame[] {
  const dasar = dasarHU(r, 5);
  const d = r.pick(langkah), s0 = r.int(0, 4), l = r.pick(lag);
  const p = (t: number) => mod(s0 + d * t, 5);
  return [0, 1, 2, 3, 4].map((t) => {
    const f = [...dasar, dasar[p(t + l)]] as Frame;
    f[p(t)] = W;
    return f;
  });
}

export const fsPentaKosong = buat({
  id: 'FS-PENTA-KOSONG', nama: 'Bidang kosong berpindah + warna pusat', chapter: CH_PENTA, label: 'SHL',
  sumber: 'Blueprint Fill Shape B · induktif.pdf hlm. 21',
  ringkas: 'Satu ujung putih bergerak satu ujung per langkah; ujung lain kembali ke warna dasar; pusat menampilkan warna dasar ujung yang sedang dikosongkan.',
  geometri: 'pentagram-terbalik', jenis: ['kosong'],
  caraCepat: 'Lacak ruang kosong, lalu audit pusat: perubahan pusat berhubungan dengan ujung yang dikosongkan, bukan aturan bebas.',
  bangun: (r) => pentaKosong(r, [1, -1], [0]),
});

export const fsPentaPusat = buat({
  id: 'FS-PENTA-PUSAT', nama: 'Pusat mengikuti ujung berikutnya/sebelumnya', chapter: CH_PENTA, label: 'VARIASI',
  sumber: 'Blueprint Fill Shape B, variasi: pusat memakai aturan lain selain warna bidang yang dikosongkan',
  ringkas: 'Ujung putih bergerak 1 atau 2 ujung per langkah; pusat menampilkan warna dasar ujung yang akan dikosongkan berikutnya atau yang dikosongkan sebelumnya.',
  geometri: 'pentagram-terbalik', jenis: ['kosong'],
  bangun: (r) => pentaKosong(r, [1, -1, 2, -2], [1, -1]),
});

export const fsPentaLapis = buat({
  id: 'FS-PENTA-LAPIS', nama: 'Dua lapisan dengan ritme berbeda', chapter: CH_PENTA, label: 'SHL',
  sumber: 'Blueprint Fill Shape C · induktif.pdf hlm. 28',
  ringkas: 'Kelima ujung berganti serempak setiap langkah; pusat berubah lebih lambat, setiap warna bertahan dua langkah.',
  geometri: 'pentagram-terbalik', jenis: ['ritme'],
  caraCepat: 'Pisahkan kelompok yang berubah bersama, lalu cari ritme cepat dan lambat.',
  bangun(r) {
    const [a, b] = r.sample([W, H, U] as Warna[], 2);
    const [x, y, z] = r.shuffle([W, H, U] as Warna[]);
    const pusat = [x, y, y, z, z];
    return [0, 1, 2, 3, 4].map((t) => [...Array(5).fill(t % 2 ? b : a), pusat[t]] as Frame);
  },
});

export const fsPentaTiga = buat({
  id: 'FS-PENTA-TIGA', nama: 'Pusat berubah tiap tiga langkah', chapter: CH_PENTA, label: 'VARIASI',
  sumber: 'Blueprint Fill Shape C, variasi: pusat berubah tiap tiga langkah',
  ringkas: 'Ujung berganti setiap langkah (siklus dua atau tiga warna); pusat bertahan tiga langkah sebelum berganti.',
  geometri: 'pentagram-terbalik', jenis: ['ritme'],
  bangun(r) {
    const tiga = r.next() < 0.5;
    const siklus = r.sample([W, H, U] as Warna[], tiga ? 3 : 2);
    const [x, y] = r.sample([W, H, U] as Warna[], 2);
    const pusat = [x, x, x, y, y];
    return [0, 1, 2, 3, 4].map((t) => [...Array(5).fill(siklus[t % siklus.length]), pusat[t]] as Frame);
  },
});

export const FILL_SHAPE_FAMILIES = [
  fsBintangJalur, fsBintangTukar, fsBintangKecepatan, fsBintangPutarTukar,
  fsPersegiLintas, fsPersegiLangkah, fsPersegiTukar, fsPersegiPutarTukar, fsPersegiBergantian, fsPersegiKecepatan,
  fsSegitigaKosong, fsSegitigaSiklus, fsSegitigaPantul,
  fsPentaKosong, fsPentaPusat, fsPentaLapis, fsPentaTiga,
];

