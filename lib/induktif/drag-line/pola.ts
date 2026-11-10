import type { Rng } from '../../core/rng';
import type { Family, Label } from '../../core/types';
import { chapterById } from '../../data/chapters';
import { KELAS, LUBANG, hitungLubang, kelasById, semuaJalur } from './aturan';

// Blueprint Induktif — Drag the Line (SIADU: Node Arrow Navigation). Peserta menarik garis dari simpul awalan dan memakai
// setiap simpul tepat sekali. Posisi simpul diatur dengan koordinat (x, y); jari-jari simpul 0,5 satuan (Rancangan Fitur TKU).

export interface Simpul { id: string; kode: string; x: number; y: number }
export interface DragLineItem {
  jenis: 'drag-line';
  simpul: Simpul[];
  /** Id simpul yang sudah tersambung (dikunci), berurutan dari simpul awal. */
  awalan: string[];
  lebar: number;
  tinggi: number;
}

export const JARI_JARI = 0.5;
const LEBAR = 10, TINGGI = 6.4;

/** Sebar n simpul acak di kanvas, jarak antarpusat ≥ 1,9 satuan, tepi ≥ 0,8 satuan. */
function tata(r: Rng, n: number): { x: number; y: number }[] | null {
  const pos: { x: number; y: number }[] = [];
  for (let coba = 0; coba < 4000 && pos.length < n; coba++) {
    const p = { x: +(0.8 + r.next() * (LEBAR - 1.6)).toFixed(2), y: +(0.8 + r.next() * (TINGGI - 1.6)).toFixed(2) };
    if (pos.every((q) => Math.hypot(p.x - q.x, p.y - q.y) >= 1.9)) pos.push(p);
  }
  return pos.length === n ? pos : null;
}

const ALNUM = [...'23456789ABCDEFGHJKLMNPQRSTUVWXYZ'];
const HURUF = (i: number) => String.fromCharCode(65 + i);

interface CfgDL {
  id: string;
  nama: string;
  chapter: string;
  label: Label;
  sumber: string;
  ringkas: string;
  /** Aturan pustaka yang menjadi penjelasan utama family ini. */
  kelas: string;
  awalan: number;
  /** Kode simpul dalam urutan jawaban, atau null bila kandidat ditolak. */
  bangun(r: Rng): string[] | null;
  /** Kode kembar diizinkan (mis. OOO dua kali); identitas simpul dibedakan oleh awalan. */
  kembar?: boolean;
  sidik?(kode: string[]): string;
  caraCepat?: string;
}

const PANJANG_CHAPTER: Record<string, number> = { 'drag-the-line-2': 2, 'drag-the-line-3': 3, 'drag-the-line-4': 4 };

function buat(cfg: CfgDL): Family<DragLineItem, string[]> {
  const kodeUrut = (item: DragLineItem, jawaban: string[]) => jawaban.map((id) => item.simpul.find((s) => s.id === id)!.kode);
  return {
    id: cfg.id, versi: 1, nama: cfg.nama, chapter: chapterById(cfg.chapter), label: cfg.label, sumber: cfg.sumber, ringkas: cfg.ringkas,
    maksPercobaan: 800,
    bangun(r) {
      const kode = cfg.bangun(r);
      if (!kode) return null;
      const pos = tata(r, kode.length);
      if (!pos) return null;
      const acak = r.shuffle(kode.map((_, i) => i));
      const simpul: Simpul[] = acak.map((asal, j) => ({ id: `s${j + 1}`, kode: kode[asal], ...pos[j] }));
      const jawaban = kode.map((_, i) => simpul[acak.indexOf(i)].id);
      return { item: { jenis: 'drag-line', simpul, awalan: jawaban.slice(0, cfg.awalan), lebar: LEBAR, tinggi: TINGGI }, jawaban };
    },
    pecahkan: (item) => semuaJalur(item.simpul, item.awalan),
    kunci: (j) => j.join('>'),
    periksa(item, jawaban) {
      const m: string[] = [];
      const kode = item.simpul.map((s) => s.kode);
      const L = PANJANG_CHAPTER[cfg.chapter];
      if (L && kode.some((k) => k.length !== L)) m.push(`kode harus ${L} karakter`);
      if (cfg.chapter === 'drag-the-line-special' && kode.filter((k) => /^[A-Za-z0-9]+$/.test(k)).length > 1) m.push('chapter Special Character harus memakai simbol khusus');
      if (!cfg.kembar && new Set(kode).size !== kode.length) m.push('ada kode kembar');
      if (item.awalan.length < 1 || item.awalan.length >= jawaban.length - 1) m.push('awalan tidak wajar');
      return m;
    },
    bahas(item, jawaban) {
      const urut = kodeUrut(item, jawaban);
      const kelas = kelasById(cfg.kelas);
      const baris = kelas.cocok(urut);
      if (!baris) return null;
      const langkah = [{ teks: `Awalan yang dikunci: ${urut.slice(0, cfg.awalan).join(' → ')}.` }, ...baris.map((teks) => ({ teks }))];
      // Kunci pemilihan untuk aturan lokal: simpul lain yang juga cocok di suatu langkah tetapi membuat rantai buntu.
      if (kelas.sambung) {
        const pakai = new Set(urut.slice(0, cfg.awalan));
        for (let t = cfg.awalan - 1; t < urut.length - 1; t++) {
          const pengecoh = item.simpul.filter((s) => !pakai.has(s.kode) && s.kode !== urut[t + 1] && kelas.sambung!(urut[t], s.kode));
          if (pengecoh.length) langkah.push({ teks: `Setelah ${urut[t]}, ${pengecoh.map((s) => s.kode).join(' atau ')} juga cocok, tetapi memilihnya membuat rantai buntu sebelum semua simpul terpakai; pilih ${urut[t + 1]}.` });
          pakai.add(urut[t + 1]);
        }
      }
      const lain = KELAS.filter((k) => k.id !== cfg.kelas && k.berlaku(item.simpul.map((s) => s.kode)) && k.cocok(urut)).map((k) => k.nama);
      if (lain.length) langkah.push({ teks: `Jalur yang sama juga memenuhi aturan: ${lain.join(', ')}.` });
      return { jawaban: urut.join(' → '), langkah, caraCepat: cfg.caraCepat };
    },
    sidik: (item, jawaban) => `${cfg.awalan}|${(cfg.sidik ?? ((k: string[]) => k.join(' ')))(kodeUrut(item, jawaban))}`,
  };
}

/** Deret nilai dari awal + daftar langkah; null bila keluar rentang. */
/** Deret dengan titik awal acak yang dijamin muat di rentang [min, maks]; null bila langkahnya terlalu lebar. */
function deretMuat(r: Rng, langkah: number[], min: number, maks: number): number[] | null {
  let x = 0, bawah = 0, atas = 0;
  for (const d of langkah) { x += d; bawah = Math.min(bawah, x); atas = Math.max(atas, x); }
  if (atas - bawah > maks - min) return null;
  return jalankan(r.int(min - bawah, maks - atas), langkah, min, maks);
}
function jalankan(awal: number, langkah: number[], min: number, maks: number): number[] | null {
  const v = [awal];
  for (const d of langkah) { const x = v[v.length - 1] + d; if (x < min || x > maks) return null; v.push(x); }
  return v;
}
const unik = (k: string[]) => (new Set(k).size === k.length ? k : null);
/** Huruf I dan O ditolak di kode campuran huruf–angka karena mudah tertukar dengan angka 1 dan 0. */
const jelas = (k: string[] | null) => (k && k.every((x) => !/[IO]/.test(x)) ? k : null);
const BUKAN_NOL = [-3, -2, -1, 1, 2, 3];

// ═══ 2 Character ═════════════════════════════════════════════════════════════════════════════════════
const CH2 = 'drag-the-line-2';

export const dlSelang = buat({
  id: 'DL-SELANG', nama: 'Deret huruf–angka berselang-seling', chapter: CH2, label: 'SHL', kelas: 'deret', awalan: 2,
  sumber: 'Blueprint Drag the Line 1 · induktif.pdf hlm. 9',
  ringkas: 'Kode huruf + angka. Huruf bergeser dengan dua langkah bergantian (mis. −1, +2) dan angka juga (mis. −2, +1); kedua aturan berjalan bersamaan.',
  caraCepat: 'Periksa setiap posisi sebagai deret sendiri.',
  bangun(r) {
    const [a1, a2] = r.sample(BUKAN_NOL, 2), [d1, d2] = r.sample(BUKAN_NOL, 2);
    if (a1 + a2 === 0 || d1 + d2 === 0) return null;
    const hl = deretMuat(r, [0, 1, 2, 3, 4, 5, 6].map((i) => (i % 2 ? a2 : a1)), 0, 25);
    const ag = deretMuat(r, [0, 1, 2, 3, 4, 5, 6].map((i) => (i % 2 ? d2 : d1)), 0, 9);
    if (!hl || !ag) return null;
    return jelas(unik(hl.map((h, i) => HURUF(h) + ag[i])));
  },
});

export const dlBertingkat = buat({
  id: 'DL-BERTINGKAT', nama: 'Selisih bertingkat pada huruf dan angka', chapter: CH2, label: 'VARIASI', kelas: 'deret', awalan: 2,
  sumber: 'Blueprint Drag the Line, variasi A',
  ringkas: 'Langkah huruf membesar (mis. +1, +2, +3, +4); angka berubah dengan langkah tetap atau ikut membesar.',
  bangun(r) {
    const a = r.int(1, 3), sa = r.pick([1, -1]);
    const hl = deretMuat(r, [0, 1, 2, 3].map((k) => sa * (a + k)), 0, 25);
    const sd = r.pick([1, -1]);
    const langkahAngka = r.next() < 0.5 ? [0, 1, 2, 3].map((k) => sd * k) : Array(4).fill(r.pick([-2, -1, 1, 2]));
    const ag = deretMuat(r, langkahAngka, 0, 9);
    if (!hl || !ag) return null;
    return jelas(unik(hl.map((h, i) => HURUF(h) + ag[i])));
  },
});

export const dlSisip = buat({
  id: 'DL-SISIP', nama: 'Dua deret disisipkan bergantian', chapter: CH2, label: 'VARIASI', kelas: 'deret', awalan: 3,
  sumber: 'Blueprint Drag the Line, variasi B',
  ringkas: 'Bilangan dua angka. Suku ganjil dan suku genap masing-masing membentuk deret dengan langkah tetap yang berbeda.',
  caraCepat: 'Bila selisih antarsimpul tampak tidak teratur, periksa suku ganjil dan genap secara terpisah.',
  bangun(r) {
    const [p, q] = r.sample([-9, -7, -6, -5, -4, -3, -2, 2, 3, 4, 5, 6, 7, 9], 2);
    const ganjil = jalankan(r.int(10, 99), [p, p, p], 10, 99), genap = jalankan(r.int(10, 99), [q, q, q], 10, 99);
    if (!ganjil || !genap) return null;
    return unik([0, 1, 2, 3, 4, 5, 6, 7].map((i) => String(i % 2 ? genap[(i - 1) / 2] : ganjil[i / 2])));
  },
});

export const dlOperasi = buat({
  id: 'DL-OPERASI', nama: 'Operasi hitung bergantian', chapter: CH2, label: 'VARIASI', kelas: 'operasi-ganti', awalan: 3,
  sumber: 'Blueprint Drag the Line, variasi C',
  ringkas: 'Bilangan dua angka. Dua operasi (mis. ×2 lalu −3) dipakai bergantian; simbol operasi tidak tertulis pada simpul.',
  bangun(r) {
    const k = r.int(1, 9) * r.pick([1, -1]);
    const kaliDulu = r.next() < 0.6;
    const v = [r.int(10, 30)];
    for (let i = 0; i < 6; i++) {
      const x = v[i];
      const y = (i % 2 === 0) === kaliDulu ? x * 2 : x + k;
      if (y < 10 || y > 99) break;
      v.push(y);
    }
    if (v.length < 5) return null;
    return unik(v.map(String));
  },
});

// ═══ 3 Character ═════════════════════════════════════════════════════════════════════════════════════
const CH3 = 'drag-the-line-3';

export const dlSimbol = buat({
  id: 'DL-SIMBOL', nama: 'Perubahan simbol menurut posisi', chapter: CH3, label: 'SHL', kelas: 'simbol', awalan: 2, kembar: true,
  sumber: 'Blueprint Drag the Line 2 · induktif.pdf hlm. 11',
  ringkas: 'Kode tiga simbol O/X. Setiap langkah tepat satu simbol diganti; posisi yang diganti bergiliran dengan urutan tetap. Dua kode kembar adalah simpul berbeda.',
  caraCepat: 'Cari posisi yang berubah pada awalan, lalu ulangi giliran posisinya.',
  bangun(r) {
    let s = Array.from({ length: 3 }, () => r.pick(['O', 'X']));
    const giliran = r.shuffle([0, 1, 2]);
    const kode = [s.join('')];
    for (let t = 0; t < 7; t++) { s = [...s]; s[giliran[t % 3]] = s[giliran[t % 3]] === 'O' ? 'X' : 'O'; kode.push(s.join('')); }
    return kode;
  },
});

export const dlRantai = buat({
  id: 'DL-RANTAI', nama: 'Rantai kecocokan karakter', chapter: CH3, label: 'SHL', kelas: 'berbagi', awalan: 2,
  sumber: 'Blueprint Drag the Line 3 · induktif.pdf hlm. 13',
  ringkas: 'Dua kode bertetangga memiliki tepat satu karakter yang sama, posisinya bebas. Sebagian simpul juga cocok di tempat lain, tetapi membuat rantai buntu.',
  caraCepat: 'Sebelum memilih, pastikan pilihan itu tidak membuat simpul lain tertinggal.',
  bangun(r) {
    const link: string[] = [];
    for (let t = 0; t < 6; t++) {
      const larang = new Set([link[t - 1], link[t - 2]]);
      const pakai = link.filter((c) => !larang.has(c));
      link.push(pakai.length && r.next() < 0.3 ? r.pick(pakai) : r.pick(ALNUM.filter((c) => !larang.has(c) && !link.includes(c))));
    }
    const isi = r.shuffle(ALNUM.filter((c) => !link.includes(c)));
    const kode = [0, 1, 2, 3, 4, 5, 6].map((t) => {
      const c = t === 0 ? [link[0], isi.pop()!, isi.pop()!] : t === 6 ? [link[5], isi.pop()!, isi.pop()!] : [link[t - 1], link[t], isi.pop()!];
      return r.shuffle(c).join('');
    });
    return unik(kode);
  },
});

export const dlGeser = buat({
  id: 'DL-GESER', nama: 'Selisih angka menggeser alfabet', chapter: CH3, label: 'SHL', kelas: 'geser', awalan: 2,
  sumber: 'Blueprint Drag the Line 8 · induktif.pdf hlm. 26',
  ringkas: 'Kode angka–huruf–angka. Selisih angka kanan − kiri menggeser huruf tengah untuk menentukan huruf tengah kode berikutnya; alfabet berputar A–Z.',
  caraCepat: 'Hitung huruf tengah berikutnya dari simpul saat ini, lalu cari simpul yang huruf tengahnya cocok.',
  bangun(r) {
    let h = r.int(0, 25);
    const kode: string[] = [];
    for (let t = 0; t < 7; t++) {
      const a = r.int(1, 9), b = r.int(1, 9);
      kode.push(`${a}${HURUF(h)}${b}`);
      h = (((h + b - a) % 26) + 26) % 26;
    }
    return jelas(unik(kode));
  },
});

export const dlAkhirAwal = buat({
  id: 'DL-AKHIR-AWAL', nama: 'Rantai karakter akhir–awal', chapter: CH3, label: 'VARIASI', kelas: 'akhir-awal', awalan: 2,
  sumber: 'Blueprint Drag the Line, variasi D',
  ringkas: 'Karakter terakhir suatu kode harus sama dengan karakter pertama kode berikutnya.',
  bangun(r) {
    const n = r.int(5, 6);
    const rantai = r.sample(ALNUM, n + 1);
    const isi = r.shuffle(ALNUM.filter((c) => !rantai.includes(c)));
    return unik(Array.from({ length: n }, (_, t) => rantai[t] + (r.next() < 0.3 ? r.pick(rantai) : isi.pop()!) + rantai[t + 1]));
  },
});

export const dlBiner = buat({
  id: 'DL-BINER', nama: 'Penghitungan biner tiga posisi', chapter: CH3, label: 'VARIASI', kelas: 'biner', awalan: 2,
  sumber: 'Blueprint Drag the Line, variasi F',
  ringkas: 'Kode 0/1 dibaca sebagai bilangan biner yang bertambah (atau berkurang) satu setiap langkah.',
  bangun(r) {
    const n = r.int(5, 6), naik = r.next() < 0.5;
    const s = naik ? r.int(0, 8 - n) : r.int(n - 1, 7);
    return [...Array(n).keys()].map((t) => (naik ? s + t : s - t).toString(2).padStart(3, '0'));
  },
});

// ═══ 4 Character ═════════════════════════════════════════════════════════════════════════════════════
const CH4 = 'drag-the-line-4';
const TANPA_LUBANG = [...'CEFGHIJKLMNSTUVWXYZ'];
const SATU_LUBANG = Object.keys(LUBANG).filter((c) => LUBANG[c] === 1);

export const dlLubang = buat({
  id: 'DL-LUBANG', nama: 'Menghitung ruang tertutup huruf', chapter: CH4, label: 'SHL', kelas: 'lubang', awalan: 2,
  sumber: 'Blueprint Drag the Line 7 · induktif.pdf hlm. 25',
  ringkas: 'Kode empat huruf. Jumlah ruang tertutup (lubang) pada bentuk huruf bertambah satu setiap langkah; B punya dua lubang.',
  caraCepat: 'Hitung lubang, bukan huruf yang berlubang atau jumlah vokal.',
  bangun(r) {
    const h0 = r.int(0, 2);
    const kode = [0, 1, 2, 3, 4].map((t) => {
      const target = h0 + t;
      const b = target >= 2 && r.next() < 0.4 ? r.int(1, Math.min(2, Math.floor(target / 2))) : 0;
      const satu = target - 2 * b;
      if (b + satu > 4) return '';
      const huruf = [...Array(b).fill('B'), ...Array.from({ length: satu }, () => r.pick(SATU_LUBANG)), ...Array.from({ length: 4 - b - satu }, () => r.pick(TANPA_LUBANG))];
      return r.shuffle(huruf).join('');
    });
    if (kode.some((k) => k.length !== 4 || hitungLubang(k) < 0)) return null;
    return unik(kode);
  },
});

export const dlSiklis = buat({
  id: 'DL-SIKLIS', nama: 'Pengurutan angka secara siklis (hipotesis)', chapter: CH4, label: 'VARIASI', kelas: 'siklis', awalan: 2,
  sumber: 'Blueprint Drag the Line 5 · induktif.pdf hlm. 17 (VARIASI/HIPOTESIS)',
  ringkas: 'Kode angka–huruf–huruf–angka. Angka kiri menurun siklis, angka kanan naik siklis (maks. satu putaran), kapitalisasi huruf bergantian kecil–BESAR / BESAR–kecil.',
  bangun(r) {
    const n = 6;
    const turun = Array.from({ length: n - 1 }, () => r.int(1, 3)), naik = Array.from({ length: n - 1 }, () => r.int(1, 3));
    if (turun.reduce((a, b) => a + b) > 10 || naik.reduce((a, b) => a + b) > 10) return null;
    let kiri = r.int(0, 9), kanan = r.int(0, 9);
    const mulaiKecil = r.next() < 0.5;
    const kode: string[] = [];
    for (let t = 0; t < n; t++) {
      const [x, y] = r.sample([...'ABDEFGHJKLMNQRTUWY'], 2);
      const kecilDulu = (t % 2 === 0) === mulaiKecil;
      kode.push(`${kiri}${kecilDulu ? x.toLowerCase() + y : x + y.toLowerCase()}${kanan}`);
      if (t < n - 1) { kiri = (kiri - turun[t] + 10) % 10; kanan = (kanan + naik[t]) % 10; }
    }
    return unik(kode);
  },
});

export const dlRotasi = buat({
  id: 'DL-ROTASI', nama: 'Rotasi posisi karakter', chapter: CH4, label: 'VARIASI', kelas: 'rotasi', awalan: 2,
  sumber: 'Blueprint Drag the Line, variasi E',
  ringkas: 'Empat karakter tetap; setiap langkah karakter paling kiri pindah ke ujung kanan (atau sebaliknya).',
  bangun(r) {
    const c = r.sample(ALNUM, 4).join('');
    const n = r.pick([1, 3]);
    const kode = [c];
    for (let t = 0; t < 3; t++) kode.push(kode[t].slice(n) + kode[t].slice(0, n));
    return kode;
  },
});

// ═══ Special Character ═══════════════════════════════════════════════════════════════════════════════
const CHS = 'drag-the-line-special';

function rantaiHitung(r: Rng, ops: string[]): string[] | null {
  let a = r.int(2, 9);
  const kode: string[] = [];
  for (let t = 0; t < 4; t++) {
    const pilihan = ops.flatMap((op) => {
      if (op === '×') return [2, 3, 4, 5].filter((b) => a * b <= 60).map((b) => ({ op, b, h: a * b }));
      if (op === '÷') return [2, 3, 4, 5, 6].filter((b) => a % b === 0 && a / b >= 1).map((b) => ({ op, b, h: a / b }));
      if (op === '+') return [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((b) => a + b <= 60).map((b) => ({ op, b, h: a + b }));
      return [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((b) => a - b >= 1).map((b) => ({ op, b, h: a - b }));
    });
    if (!pilihan.length) return null;
    const p = r.pick(pilihan);
    kode.push(`${a}${p.op}${p.b}`);
    a = p.h;
  }
  kode.push(String(a));
  return new Set(kode.slice(0, -1).map((k) => k[k.search(/[×÷+−]/)])).size >= Math.min(2, ops.length) ? unik(kode) : null;
}

export const dlHitung = buat({
  id: 'DL-HITUNG', nama: 'Hasil hitungan menjadi penghubung', chapter: CHS, label: 'SHL', kelas: 'hitung', awalan: 1,
  sumber: 'Blueprint Drag the Line 4 · induktif.pdf hlm. 15',
  ringkas: 'Simpul berisi operasi × atau ÷; hasilnya menjadi angka awal simpul berikutnya. Simpul akhir berupa satu angka.',
  bangun: (r) => rantaiHitung(r, ['×', '÷']),
});

export const dlHitungCampur = buat({
  id: 'DL-HITUNG-CAMPUR', nama: 'Rantai operasi + − × ÷', chapter: CHS, label: 'VARIASI', kelas: 'hitung', awalan: 1,
  sumber: 'Blueprint Drag the Line 4, variasi: menambah jenis operasi',
  ringkas: 'Seperti hlm. 15, tetapi operasi dapat berupa +, −, × atau ÷.',
  bangun: (r) => rantaiHitung(r, ['×', '÷', '+', '−']),
});

function rantaiArah(r: Rng, simbol: Record<string, number>, n: number, maks: number): string[] | null {
  const daftar = Object.entries(simbol);
  const v = [r.int(1, maks)];
  const s: string[] = [];
  for (let t = 0; t < n - 1; t++) {
    const boleh = daftar.filter(([, d]) => { const x = v[t] + d; return x >= 1 && x <= maks && !v.includes(x); });
    if (!boleh.length) return null;
    const [sym, d] = r.pick(boleh);
    s.push(sym); v.push(v[t] + d);
  }
  s.push(r.pick(daftar)[0]);
  if (new Set(s).size < Math.min(3, daftar.length)) return null;
  return v.map((x, i) => `${x}${s[i]}`);
}

export const dlArah = buat({
  id: 'DL-ARAH', nama: 'Simbol arah sebagai instruksi langkah', chapter: CHS, label: 'SHL', kelas: 'arah', awalan: 1,
  sumber: 'Blueprint Drag the Line 6 · induktif.pdf hlm. 19',
  ringkas: '> berarti tambah 1, >> tambah 2, < kurang 1. Terapkan instruksi pada angka simpul saat ini untuk mendapat angka simpul berikutnya.',
  bangun: (r) => rantaiArah(r, { '>': 1, '>>': 2, '<': -1 }, 8, 9),
});

export const dlArahLebar = buat({
  id: 'DL-ARAH-LEBAR', nama: 'Simbol arah dengan langkah lebih besar', chapter: CHS, label: 'VARIASI', kelas: 'arah', awalan: 1,
  sumber: 'Blueprint Drag the Line 6, variasi: mengubah besar langkah',
  ringkas: 'Jumlah simbol menyatakan besar langkah: > +1, >> +2, >>> +3, < −1, << −2.',
  bangun: (r) => rantaiArah(r, { '>': 1, '>>': 2, '>>>': 3, '<': -1, '<<': -2 }, 8, 12),
});

export const DRAG_LINE_FAMILIES = [
  dlSelang, dlBertingkat, dlSisip, dlOperasi,
  dlSimbol, dlRantai, dlGeser, dlAkhirAwal, dlBiner,
  dlLubang, dlSiklis, dlRotasi,
  dlHitung, dlArah, dlArahLebar, dlHitungCampur,
];
