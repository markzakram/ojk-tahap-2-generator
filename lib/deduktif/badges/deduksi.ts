// Penalaran langkah demi langkah untuk pembahasan Badges: tabel kemungkinan nama × posisi yang menyempit.
// Satu langkah memakai satu petunjuk, kedua petunjuk pada satu kartu, atau gabungan dua petunjuk dari kartu berbeda yang
// menyebut orang yang sama (mis. dua jarak tepat dari orang yang sama, atau relasi atas + jarak pada pasangan yang sama),
// disusul aturan "setiap lencana dipakai sekali". Bila tidak ada langkah yang masih mempersempit, dilakukan uji
// kemungkinan per kasus pada orang yang pilihannya paling sedikit ("Elvi di peringkat 3 atau 4": kasus yang bertentangan
// dicoret). Alasan suatu langkah hanya menyebut fakta yang memang mengubah hasil (uji kontrafaktual per fakta). Setelah
// itu langkah yang tidak diperlukan dibuang dan pemakaian berurutan kartu yang sama digabung (diputar ulang dari awal,
// dipertahankan bila pembahasan menjadi lebih pendek). Mesin ini terpisah dari solver enumerasi; hasil akhirnya harus sama
// dengan kunci, bila tidak pembahasan ditolak.
import type { LangkahPembahasan } from '../../core/types';
import { daftarKata } from '../../data/nama';
import { cocok, teksPetunjuk, pelaku, type BadgesItem, type Peringkat, type Petunjuk } from './model';

type Dom = number[];

const bit = (v: number) => 1 << v;
const nilai = (m: number, n: number) => { const h: number[] = []; for (let v = 1; v <= n; v++) if (m & bit(v)) h.push(v); return h; };
const ukuran = (m: number) => { let c = 0; while (m) { m &= m - 1; c++; } return c; };
const tunggal = (m: number) => m !== 0 && (m & (m - 1)) === 0;
const satuNilai = (m: number) => Math.round(Math.log2(m));
const jumlahPasti = (D: Dom) => D.filter(tunggal).length;
const besar = (s: string) => s[0].toUpperCase() + s.slice(1);

/** "1–3", "1 atau 3–6", "1, 3, atau 5". */
export function himpunan(vs: number[]): string {
  const ruas: string[] = [];
  for (let i = 0; i < vs.length;) {
    let j = i;
    while (j + 1 < vs.length && vs[j + 1] === vs[j] + 1) j++;
    if (j - i >= 2) ruas.push(`${vs[i]}–${vs[j]}`);
    else for (let t = i; t <= j; t++) ruas.push(String(vs[t]));
    i = j + 1;
  }
  if (ruas.length <= 1) return ruas.join('');
  if (ruas.length === 2) return `${ruas[0]} atau ${ruas[1]}`;
  return `${ruas.slice(0, -1).join(', ')}, atau ${ruas[ruas.length - 1]}`;
}

/** Satuan langkah: satu petunjuk, dua petunjuk satu kartu, atau dua petunjuk lintas kartu yang berbagi orang. */
interface Grup {
  c: number[];
  orang: number[];
  jenis: 'satu' | 'kartu' | 'gabung';
  bobot: number;
}

interface Saringan { dukung: number[]; jumlah: number; contoh: number[][] }

interface Konteks {
  n: number;
  penuh: number;
  ids: string[];
  nama: string[];
  pos: string;
  kendala: Petunjuk[];
  idx: number[][];
  item: BadgesItem;
  grup: Grup[];
  /** Nomor petunjuk di kartunya (0 = pertama) dan banyak petunjuk kartu itu. */
  urutKartu: number[];
  isiKartu: number[];
  cache: Map<string, Saringan>;
}

/** Seluruh susunan bersama (nilai berbeda) untuk orang-orang grup yang memenuhi semua petunjuk grup. */
function saringan(k: Konteks, gi: number, D: Dom): Saringan {
  const g = k.grup[gi];
  const kunci = `${gi}|${g.orang.map((o) => D[o]).join(',')}`;
  const ada = k.cache.get(kunci);
  if (ada) return ada;
  const dukung = g.orang.map(() => 0);
  const contoh: number[][] = [];
  let jumlah = 0;
  const r: Record<string, number> = {};
  const pakai: number[] = [];
  const telusur = (j: number) => {
    if (j === g.orang.length) {
      if (g.c.every((i) => cocok(k.kendala[i], r, k.n))) {
        jumlah++;
        if (contoh.length < 5) contoh.push(pakai.slice());
        pakai.forEach((v, t) => (dukung[t] |= bit(v)));
      }
      return;
    }
    for (const v of nilai(D[g.orang[j]], k.n)) {
      if (pakai.includes(v)) continue;
      r[k.ids[g.orang[j]]] = v; pakai.push(v);
      telusur(j + 1);
      pakai.pop();
    }
  };
  telusur(0);
  const hasil = { dukung, jumlah, contoh };
  k.cache.set(kunci, hasil);
  return hasil;
}

function saring(k: Konteks, gi: number, D: Dom): Dom {
  const s = saringan(k, gi, D);
  const baru = D.slice();
  k.grup[gi].orang.forEach((o, t) => (baru[o] = D[o] & s.dukung[t]));
  return baru;
}

interface Tutup { D: Dom; kalimat: string[]; buntu: string | null }

/** Aturan lencana unik: posisi yang sudah pasti dicoret dari orang lain; posisi yang hanya cocok untuk satu orang ditetapkan. */
function tutupUnik(k: Konteks, D: Dom): Tutup {
  const E = D.slice();
  const kalimat: string[] = [];
  const kosong = E.findIndex((m) => !m);
  if (kosong >= 0) return { D: E, kalimat, buntu: `${k.nama[kosong]} tidak memiliki ${k.pos} yang tersisa` };
  const bentrok = (): string | null => {
    for (let p = 0; p < k.n; p++) for (let q = p + 1; q < k.n; q++)
      if (tunggal(E[p]) && E[p] === E[q]) return `${k.nama[p]} dan ${k.nama[q]} sama-sama hanya dapat di ${k.pos} ${satuNilai(E[p])}, mustahil`;
    return null;
  };
  const b0 = bentrok();
  if (b0) return { D: E, kalimat, buntu: b0 };
  for (let maju = true; maju;) {
    maju = false;
    for (let p = 0; p < k.n; p++) {
      if (!tunggal(E[p])) continue;
      const v = satuNilai(E[p]);
      const kena: number[] = [];
      for (let q = 0; q < k.n; q++) if (q !== p && E[q] & bit(v)) { E[q] &= ~bit(v); kena.push(q); }
      if (!kena.length) continue;
      maju = true;
      const awal = `${k.pos} ${v} sudah milik ${k.nama[p]}`;
      const habis = kena.find((q) => !E[q]);
      if (habis !== undefined) return { D: E, kalimat, buntu: `${awal}, sehingga ${k.nama[habis]} tidak memiliki ${k.pos} yang tersisa` };
      const baruPasti = kena.filter((q) => tunggal(E[q]));
      // Dua orang yang kini sama-sama hanya dapat di posisi yang sama (atau di posisi yang sudah milik orang lain).
      for (const q of baruPasti) {
        const lain = E.findIndex((m, r) => r !== q && m === E[q]);
        if (lain >= 0) {
          const [x, y] = lain < q && baruPasti.includes(lain) ? [lain, q] : [q, lain];
          return {
            D: E, kalimat,
            buntu: baruPasti.includes(lain)
              ? `${awal}, jadi ${k.nama[x]} dan ${k.nama[y]} sama-sama hanya dapat di ${k.pos} ${satuNilai(E[q])}, mustahil`
              : `${awal}, jadi ${k.nama[q]} hanya dapat di ${k.pos} ${satuNilai(E[q])}, padahal ${k.pos} itu sudah milik ${k.nama[lain]}`,
          };
        }
      }
      if (baruPasti.length) kalimat.push(`${awal}, jadi ${baruPasti.map((q) => `${k.nama[q]} pasti di ${k.pos} ${satuNilai(E[q])}`).join(' dan ')}`);
    }
    for (let v = 1; v <= k.n; v++) {
      const bisa = E.map((m, p) => (m & bit(v) ? p : -1)).filter((p) => p >= 0);
      if (!bisa.length) return { D: E, kalimat, buntu: `${k.pos} ${v} tidak dapat ditempati siapa pun` };
      if (bisa.length === 1 && !tunggal(E[bisa[0]])) {
        E[bisa[0]] = bit(v); maju = true;
        kalimat.push(`hanya ${k.nama[bisa[0]]} yang masih mungkin menempati ${k.pos} ${v}, jadi ${k.nama[bisa[0]]} pasti di ${k.pos} ${v}`);
      }
    }
  }
  return { D: E, kalimat, buntu: null };
}

const hapus = (A: Dom, B: Dom) => A.reduce((s, m, p) => s + ukuran(m & ~B[p]), 0);

function keadaan(k: Konteks, p: number, m: number): string {
  if (!m) return `${k.nama[p]} tidak memiliki ${k.pos} yang tersisa`;
  const vs = nilai(m, k.n);
  return vs.length === 1 ? `${k.nama[p]} pasti di ${k.pos} ${vs[0]}` : `${k.nama[p]} hanya mungkin di ${k.pos} ${himpunan(vs)}`;
}

const namaId = (k: Konteks, id: string) => k.nama[k.ids.indexOf(id)];
const teksKartu = (k: Konteks, i: number) => teksPetunjuk(k.kendala[i], (id) => namaId(k, id), k.item.bahasa, k.n);
const pemilikKartu = (k: Konteks, i: number) => namaId(k, k.kendala[i].kartu);

/** Kepala langkah utama: petunjuk dikutip seperti tertulis di kartu. */
function kepala(k: Konteks, g: Grup): string {
  const [i, j] = g.c;
  if (g.jenis === 'satu') return `Kartu ${pemilikKartu(k, i)} (“${teksKartu(k, i)}”)`;
  if (g.jenis === 'kartu') return `Kartu ${pemilikKartu(k, i)} (“${teksKartu(k, i)}”; “${teksKartu(k, j)}”)`;
  return `Gabungkan kartu ${pemilikKartu(k, i)} (“${teksKartu(k, i)}”) dan kartu ${pemilikKartu(k, j)} (“${teksKartu(k, j)}”)`;
}

/** Rujukan singkat tanpa kutipan (dipakai di dalam uji kemungkinan): "kartu Dika", "petunjuk kedua kartu Dika". */
function rujuk(k: Konteks, i: number): string {
  if (k.isiKartu[i] === 1) return `kartu ${pemilikKartu(k, i)}`;
  return `petunjuk ${k.urutKartu[i] === 0 ? 'pertama' : 'kedua'} kartu ${pemilikKartu(k, i)}`;
}
function rujukGrup(k: Konteks, g: Grup): string {
  if (g.jenis === 'satu') return rujuk(k, g.c[0]);
  if (g.jenis === 'kartu') return `kedua petunjuk kartu ${pemilikKartu(k, g.c[0])}`;
  return `${rujuk(k, g.c[0])} dan ${rujuk(k, g.c[1])}`;
}

interface Langkah { gi: number; B: Dom; t: Tutup; skor: number }

/** Banyak susunan bersama paling banyak yang masih ditulis satu per satu pada langkah gabungan. */
const MAKS_SUSUNAN = 4;

/**
 * Langkah paling menentukan: nilai = 3 × tambahan orang berposisi pasti + banyak kemungkinan yang tercoret, dibagi bobot
 * grup (satu petunjuk lebih ringan daripada gabungan). `hanyaSatu`: gabungan baru dipakai bila tidak ada satu petunjuk
 * pun yang masih mempersempit.
 */
function langkahTerbaik(k: Konteks, D: Dom, hanyaSatu = false): Langkah | null {
  let terbaik: Langkah | null = null;
  for (const fase of hanyaSatu ? [true, false] : [false]) {
    for (let gi = 0; gi < k.grup.length; gi++) {
      const g = k.grup[gi];
      if (fase && g.jenis !== 'satu') continue;
      // Gabungan lintas kartu hanya bila susunan bersamanya cukup sedikit untuk ditulis (dapat diperiksa pembaca).
      if (g.jenis === 'gabung' && saringan(k, gi, D).jumlah > MAKS_SUSUNAN) continue;
      const B = saring(k, gi, D);
      if (!hapus(D, B)) continue;
      const t = tutupUnik(k, B);
      const nilaiLangkah = t.buntu ? 1000 : 3 * (jumlahPasti(t.D) - jumlahPasti(D)) + hapus(D, t.D);
      const skor = nilaiLangkah / g.bobot;
      if (!terbaik || skor > terbaik.skor + 1e-9 || (Math.abs(skor - terbaik.skor) < 1e-9 && g.bobot < k.grup[terbaik.gi].bobot)) terbaik = { gi, B, t, skor };
    }
    if (terbaik) return terbaik;
  }
  return terbaik;
}

/** Rantai akibat dari pemisalan orang p di posisi v (maks. `batas` langkah). Hasil: kalimat rantai yang berakhir pada pertentangan. */
function rantai(k: Konteks, D0: Dom, p: number, v: number, batas: number): string[] | null {
  const A = D0.slice();
  A[p] = bit(v);
  const jejak: string[] = [];
  let t = tutupUnik(k, A);
  jejak.push(...t.kalimat);
  if (t.buntu) { jejak.push(t.buntu); return jejak; }
  let D = t.D;
  for (let s = 0; s < batas; s++) {
    // Utamakan petunjuk yang langsung tidak dapat dipenuhi (satu petunjuk lebih dulu daripada gabungan).
    for (const jenis of ['satu', 'kartu', 'gabung'] as const) {
      for (let gi = 0; gi < k.grup.length; gi++) {
        const g = k.grup[gi];
        if (g.jenis !== jenis) continue;
        if (saringan(k, gi, D).jumlah === 0) {
          jejak.push(`${rujukGrup(k, g)} tidak dapat dipenuhi${g.jenis === 'satu' ? '' : ' bersamaan'}`);
          return jejak;
        }
      }
    }
    const l = langkahTerbaik(k, D, true);
    if (!l) return null;
    const g = k.grup[l.gi];
    const berubah = g.orang.filter((o) => l.B[o] !== D[o]);
    jejak.push(`${rujukGrup(k, g)} membuat ${daftarKata(berubah.map((o) => keadaan(k, o, l.B[o])))}`);
    t = l.t;
    jejak.push(...t.kalimat);
    if (t.buntu) { jejak.push(t.buntu); return jejak; }
    D = t.D;
  }
  return null;
}

const BATAS_RANTAI = 6;
/** Uji kemungkinan hanya pada orang yang tinggal sedikit pilihan ("Elvi di peringkat 3 atau 4"). */
const MAKS_KASUS = 3;

/** Uji kemungkinan per kasus pada orang p: setiap posisi p yang mengarah ke pertentangan dicoret. */
function ujiKasus(k: Konteks, D: Dom, p: number, batas: number): { buang: number[]; jejak: string[][] } | null {
  const buang: number[] = [];
  const jejak: string[][] = [];
  for (const v of nilai(D[p], k.n)) {
    const j = rantai(k, D, p, v, batas);
    if (j) { buang.push(v); jejak.push(j); }
  }
  return buang.length && buang.length < ukuran(D[p]) ? { buang, jejak } : null;
}

type Aksi = { jenis: 'grup'; gi: number } | { jenis: 'uji'; p: number };

interface Putar { teks: string[]; D: Dom; uji: number; gabungan: number; biaya: number }

/**
 * Fakta pendukung yang diperlukan untuk satu langkah grup (uji kontrafaktual per fakta): sebuah fakta hanya disebut bila
 * menghilangkannya mengubah hasil penyaringan untuk orang yang berubah. `minimal = false`: semua fakta dipertahankan.
 */
function alasanLangkah(k: Konteks, gi: number, D: Dom, B: Dom, minimal = true) {
  const g = k.grup[gi];
  const O = g.orang;
  const berubah = O.filter((o) => B[o] !== D[o]);
  const pemilik = (v: number) => D.findIndex((m) => tunggal(m) && m === bit(v));
  const terisiLain = (o: number) => {
    let m = 0;
    for (let v = 1; v <= k.n; v++) { const q = pemilik(v); if (q >= 0 && q !== o) m |= bit(v); }
    return m;
  };
  // Fakta: (a) kemungkinan pelaku yang sudah dibatasi oleh hal selain posisi terisi; (b) posisi yang sudah milik orang di luar grup.
  const R = O.filter((o) => (D[o] | terisiLain(o)) !== k.penuh);
  const Occ: number[] = [];
  for (let v = 1; v <= k.n; v++) {
    const q = pemilik(v);
    if (q >= 0 && !O.includes(q) && O.some((o) => !(D[o] & bit(v)))) Occ.push(v);
  }
  const pakaiR = new Set(R);
  const pakaiOcc = new Set(Occ);
  const longgar = (): Dom => {
    const E = D.slice();
    let tutup = 0;
    for (const v of pakaiOcc) tutup |= bit(v);
    for (const o of O) E[o] = pakaiR.has(o) ? D[o] : k.penuh & ~tutup;
    return E;
  };
  const cukup = () => {
    const S = saring(k, gi, longgar());
    return berubah.every((o) => S[o] === B[o]);
  };
  if (minimal) {
    for (const v of [...Occ]) { pakaiOcc.delete(v); if (!cukup()) pakaiOcc.add(v); }
    for (const o of R.filter((o) => !berubah.includes(o))) { pakaiR.delete(o); if (!cukup()) pakaiR.add(o); }
    for (const o of R.filter((o) => berubah.includes(o))) { pakaiR.delete(o); if (!cukup()) pakaiR.add(o); }
  }
  const occ = [...pakaiOcc].sort((a, b) => a - b);
  const alasan = [
    ...(occ.length === 1 ? [`${k.pos} ${occ[0]} sudah milik ${k.nama[pemilik(occ[0])]}`] : occ.length
      ? [`${k.pos} ${daftarKata(occ.map(String))} sudah terisi (${occ.map((v) => k.nama[pemilik(v)]).join(', ')})`] : []),
    ...O.filter((o) => pakaiR.has(o) && !berubah.includes(o)).map((o) => keadaan(k, o, D[o])),
  ];
  return { alasan, berubah, sebelumnya: new Set(berubah.filter((o) => pakaiR.has(o))), susunan: saringan(k, gi, longgar()) };
}

/** Putar ulang daftar aksi dari keadaan awal. Hasilkan teks langkah, atau `null` bila aksi tidak lagi sah/tidak tuntas. */
function putar(k: Konteks, aksi: Aksi[]): Putar | null {
  let D: Dom = k.ids.map(() => k.penuh);
  const teks: string[] = [];
  let uji = 0;
  let gabungan = 0;
  for (const a of aksi) {
    if (a.jenis === 'grup') {
      const B = saring(k, a.gi, D);
      if (!hapus(D, B)) continue; // tidak lagi mempersempit: lewati
      const g = k.grup[a.gi];
      if (g.jenis === 'gabung' && saringan(k, a.gi, D).jumlah > MAKS_SUSUNAN) return null;
      const t = tutupUnik(k, B);
      if (t.buntu) return null;
      let al = alasanLangkah(k, a.gi, D, B);
      // Gabungan: susunan bersama ditulis supaya alasannya dapat diperiksa. Bila dengan fakta minimal susunannya terlalu
      // banyak, pakai seluruh fakta yang diketahui.
      if (g.jenis !== 'satu' && al.susunan.jumlah > MAKS_SUSUNAN && saringan(k, a.gi, D).jumlah <= MAKS_SUSUNAN) al = alasanLangkah(k, a.gi, D, B, false);
      const { alasan, berubah, sebelumnya, susunan } = al;
      const isi = daftarKata(berubah.map((o) => `${keadaan(k, o, B[o])}${sebelumnya.has(o) ? ` (sebelumnya ${himpunan(nilai(D[o], k.n))})` : ''}`));
      const kolom = `(${g.orang.map((o) => k.nama[o]).join(', ')})`;
      const baris = (s: Saringan) => {
        const b = s.contoh.map((x) => `(${x.join(', ')})`);
        return b.length === 1 ? b[0] : b.length === 2 ? `${b[0]} atau ${b[1]}` : `${b.slice(0, -1).join(', ')}, atau ${b[b.length - 1]}`;
      };
      const daftarSusunan = g.jenis !== 'satu' && susunan.jumlah <= MAKS_SUSUNAN
        ? `susunan ${kolom} yang memenuhi ${g.jenis === 'kartu' ? 'kedua petunjuk' : 'keduanya'} hanya ${baris(susunan)}, jadi ` : '';
      const akibatDari = (t: Tutup) => (t.kalimat.length ? ` Akibatnya, ${t.kalimat.join('; ')}.` : '');
      let kalimat = `${kepala(k, g)}: ${alasan.length ? `karena ${daftarKata(alasan)}, ` : ''}${daftarSusunan}${isi}.${akibatDari(t)}`;
      D = t.D;
      // Petunjuk yang sama masih mempersempit setelah akibatnya: lanjutkan di langkah yang sama (tidak dikutip ulang).
      for (let ulang = 0; ulang < 4; ulang++) {
        const B2 = saring(k, a.gi, D);
        if (!hapus(D, B2)) break;
        const s2 = saringan(k, a.gi, D);
        if (g.jenis === 'gabung' && s2.jumlah > MAKS_SUSUNAN) break;
        const t2 = tutupUnik(k, B2);
        if (t2.buntu) return null;
        const isi2 = daftarKata(g.orang.filter((o) => B2[o] !== D[o]).map((o) => keadaan(k, o, B2[o])));
        kalimat += g.jenis !== 'satu' && s2.jumlah <= MAKS_SUSUNAN
          ? ` Kini susunan ${kolom} tinggal ${baris(s2)}, jadi ${isi2}.${akibatDari(t2)}`
          : ` Dengan ${g.jenis === 'satu' ? 'petunjuk' : 'kedua petunjuk'} yang sama, kini ${isi2}.${akibatDari(t2)}`;
        D = t2.D;
      }
      teks.push(kalimat);
      if (g.jenis === 'gabung') gabungan++;
    } else {
      if (tunggal(D[a.p])) continue;
      if (ukuran(D[a.p]) > MAKS_KASUS) return null;
      const u = ujiKasus(k, D, a.p, BATAS_RANTAI);
      if (!u) return null;
      uji++;
      const B = D.slice();
      for (const v of u.buang) B[a.p] &= ~bit(v);
      const t = tutupUnik(k, B);
      if (t.buntu) return null;
      const nm = k.nama[a.p];
      const pembuka = D[a.p] === k.penuh ? `Uji kemungkinan untuk ${nm}.` : `Uji kemungkinan: ${keadaan(k, a.p, D[a.p])}.`;
      const kasus = u.buang.map((v, i) => `Misalkan ${nm} di ${k.pos} ${v}; maka ${u.jejak[i].join('; ')}.`).join(' ');
      const tutupKasus = u.buang.length === 1 ? 'Ini bertentangan' : u.buang.length === 2 ? 'Kedua kemungkinan itu bertentangan' : 'Semua kemungkinan itu bertentangan';
      const akibat = t.kalimat.length ? ` Akibatnya, ${t.kalimat.join('; ')}.` : '';
      teks.push(`${pembuka} ${kasus} ${tutupKasus}, jadi ${keadaan(k, a.p, B[a.p])}.${akibat}`);
      D = t.D;
    }
  }
  if (!D.every(tunggal)) return null;
  // Biaya = panjang teks + beban per langkah; uji kemungkinan diberi beban tambahan.
  const biaya = teks.reduce((s, x) => s + x.length, 0) + 90 * teks.length + 250 * uji;
  return { teks, D, uji, gabungan, biaya };
}

/** Susun aksi secara rakus. `hanyaSatu`: gabungan hanya bila tidak ada satu petunjuk pun yang masih mempersempit. */
function rakus(k: Konteks, hanyaSatu: boolean): Aksi[] | null {
  let D: Dom = k.ids.map(() => k.penuh);
  const aksi: Aksi[] = [];
  for (let putaran = 0; putaran < 80 && !D.every(tunggal); putaran++) {
    const l = langkahTerbaik(k, D, hanyaSatu);
    if (l) {
      if (l.t.buntu) return null;
      aksi.push({ jenis: 'grup', gi: l.gi });
      D = l.t.D;
      continue;
    }
    // Tidak ada langkah yang mempersempit: uji kemungkinan per kasus. Utamakan orang yang pilihannya paling sedikit,
    // kasus yang menyisakan satu posisi, dan rantai pertentangan terpendek.
    const calon = ids(k).filter((p) => !tunggal(D[p]) && ukuran(D[p]) <= MAKS_KASUS).sort((a, b) => ukuran(D[a]) - ukuran(D[b]) || a - b);
    let pilih: { p: number; skor: number; B: Dom } | null = null;
    for (const batas of [3, BATAS_RANTAI]) {
      for (const p of calon) {
        const u = ujiKasus(k, D, p, batas);
        if (!u) continue;
        const sisa = ukuran(D[p]) - u.buang.length;
        const skor = (sisa === 1 ? 0 : 40) + u.jejak.reduce((s, j) => s + j.length, 0) * 3 + ukuran(D[p]);
        if (!pilih || skor < pilih.skor) {
          const B = D.slice();
          for (const v of u.buang) B[p] &= ~bit(v);
          pilih = { p, skor, B };
        }
      }
      if (pilih) break;
    }
    if (!pilih) return null;
    aksi.push({ jenis: 'uji', p: pilih.p });
    const t = tutupUnik(k, pilih.B);
    if (t.buntu) return null;
    D = t.D;
  }
  return D.every(tunggal) ? aksi : null;
}

const ids = (k: Konteks) => k.ids.map((_, p) => p);

/** Buang aksi yang tidak diperlukan dan gabungkan pemakaian berurutan dua petunjuk menjadi satu langkah, selama biaya turun. */
function rapikan(k: Konteks, aksi: Aksi[]): { jalan: Aksi[]; hasil: Putar } | null {
  let jalan = aksi;
  let hasil = putar(k, jalan);
  if (!hasil) return null;
  for (let ulang = true; ulang;) {
    ulang = false;
    for (let i = 0; i < jalan.length;) {
      const coba = [...jalan.slice(0, i), ...jalan.slice(i + 1)];
      const h = putar(k, coba);
      if (h && h.biaya < hasil.biaya) { jalan = coba; hasil = h; ulang = true; } else i++;
    }
    for (let i = 0; i + 1 < jalan.length; i++) {
      const a = jalan[i], b = jalan[i + 1];
      if (a.jenis !== 'grup' || b.jenis !== 'grup') continue;
      const ga = k.grup[a.gi], gb = k.grup[b.gi];
      if (ga.jenis !== 'satu' || gb.jenis !== 'satu') continue;
      const pasangan = [ga.c[0], gb.c[0]].sort((x, y) => x - y);
      const gi = k.grup.findIndex((g) => g.c.length === 2 && g.c[0] === pasangan[0] && g.c[1] === pasangan[1]);
      if (gi < 0) continue;
      const coba: Aksi[] = [...jalan.slice(0, i), { jenis: 'grup', gi }, ...jalan.slice(i + 2)];
      const h = putar(k, coba);
      if (h && h.biaya < hasil.biaya) { jalan = coba; hasil = h; ulang = true; }
    }
  }
  return { jalan, hasil };
}

/** Selesai dengan satu petunjuk per langkah (tanpa gabungan dan tanpa uji kemungkinan)? */
function cukupLangsung(k: Konteks): boolean {
  let D: Dom = k.ids.map(() => k.penuh);
  for (let maju = true; maju;) {
    maju = false;
    for (let gi = 0; gi < k.grup.length; gi++) {
      if (k.grup[gi].jenis !== 'satu') continue;
      const B = saring(k, gi, D);
      if (!hapus(D, B)) continue;
      const t = tutupUnik(k, B);
      if (t.buntu) return false;
      D = t.D; maju = true;
    }
  }
  return D.every(tunggal);
}

export interface HasilDeduksi {
  langkah: LangkahPembahasan[];
  /** Banyak uji kemungkinan pada pembahasan (0 = cukup dengan penyempitan langsung dan gabungan). */
  ujiKemungkinan: number;
  /** Banyak langkah gabungan dua petunjuk lintas kartu pada pembahasan. */
  gabungan: number;
  /** Penyempitan satu petunjuk per langkah saja tidak cukup (perlu gabungan atau uji kemungkinan). */
  perluLanjut: boolean;
  /** Total karakter langkah deduksi (pembuka + langkah); kalimat penutup "Urutan akhir …" ditambahkan oleh pola.ts. */
  karakter: number;
  hasil: Peringkat;
}

/** Penalaran lengkap dari isi soal. `null` bila tidak dapat diselesaikan dengan langkah yang dapat dijelaskan. */
export function deduksi(item: BadgesItem, kendala: Petunjuk[] = item.kendala): HasilDeduksi | null {
  const n = item.lencana;
  const idsOrang = item.orang.map((o) => o.id);
  const idx = kendala.map((c) => pelaku(c).map((id) => idsOrang.indexOf(id)));
  const urutKartu = kendala.map((c, i) => kendala.slice(0, i).filter((x) => x.kartu === c.kartu).length);
  const isiKartu = kendala.map((c) => kendala.filter((x) => x.kartu === c.kartu).length);
  const grup: Grup[] = kendala.map((_, i) => ({ c: [i], orang: idx[i], jenis: 'satu' as const, bobot: 1 }));
  for (let i = 0; i < kendala.length; i++) for (let j = i + 1; j < kendala.length; j++) {
    const orang = [...new Set([...idx[i], ...idx[j]])];
    if (orang.length > 4) continue;
    const satuKartu = kendala[i].kartu === kendala[j].kartu;
    if (!satuKartu && !idx[i].some((o) => idx[j].includes(o))) continue;
    grup.push({ c: [i, j], orang, jenis: satuKartu ? 'kartu' : 'gabung', bobot: satuKartu ? 1.2 : 1.5 });
  }
  const k: Konteks = {
    n, penuh: Array.from({ length: n }, (_, i) => i + 1).reduce((m, v) => m | bit(v), 0),
    ids: idsOrang, nama: item.orang.map((o) => o.nama), pos: item.bahasa.pos, kendala, idx, item, grup, urutKartu, isiKartu,
    cache: new Map(),
  };
  // Soal yang selesai dengan satu petunjuk per langkah dibahas tanpa gabungan lintas kartu (cukup penyempitan langsung,
  // boleh membaca kedua petunjuk satu kartu sekaligus).
  const perluLanjut = !cukupLangsung(k);
  if (!perluLanjut) { k.grup = k.grup.filter((g) => g.jenis !== 'gabung'); k.cache.clear(); }
  // Dua strategi rakus (gabungan sejak awal / gabungan hanya bila buntu); ambil pembahasan termurah setelah dirapikan.
  let terbaik: Putar | null = null;
  for (const hanyaSatu of [false, true]) {
    const aksi = rakus(k, hanyaSatu);
    if (!aksi) continue;
    const r = rapikan(k, aksi);
    if (r && (!terbaik || r.hasil.biaya < terbaik.biaya)) terbaik = r.hasil;
  }
  if (!terbaik) return null;
  const hasil: Peringkat = {};
  idsOrang.forEach((id, p) => (hasil[id] = satuNilai(terbaik!.D[p])));
  const langkah: LangkahPembahasan[] = [
    { teks: `Ada ${n} orang dan ${n} lencana yang masing-masing dipakai sekali, jadi setiap ${k.pos} 1–${n} ditempati tepat satu orang. Catat ${k.pos} yang masih mungkin untuk setiap orang, lalu pakai petunjuk yang paling menentukan lebih dulu.` },
    ...terbaik.teks.map((teks) => ({ teks })),
  ];
  return {
    langkah, ujiKemungkinan: terbaik.uji, gabungan: terbaik.gabungan, perluLanjut,
    karakter: langkah.reduce((s, l) => s + l.teks.length, 0), hasil,
  };
}
