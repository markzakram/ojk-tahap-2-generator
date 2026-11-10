// Pustaka aturan Drag the Line (Blueprint Induktif — Drag the Line). Solver independen: telusuri SEMUA jalur dari awalan yang
// memakai setiap simpul tepat sekali; jalur sah bila ada SATU aturan dalam pustaka (dengan parameter apa pun) yang cocok
// untuk seluruh sambungan. Soal terbit hanya bila tepat satu jalur sah. Setiap aturan punya uji prefiks (`layak`) untuk
// memangkas penelusuran, dan uji penuh (`cocok`) yang sekaligus menghasilkan pembahasan.

export interface Kelas {
  id: string;
  nama: string;
  berlaku(kode: string[]): boolean;
  /** Prefiks masih mungkin diteruskan menjadi jalur yang memenuhi aturan ini. */
  layak(urut: string[]): boolean;
  /** Jalur lengkap memenuhi aturan → baris pembahasan; selain itu null. */
  cocok(urut: string[]): string[] | null;
  /** Untuk aturan yang hanya bergantung pada dua simpul bertetangga. */
  sambung?(a: string, b: string): boolean;
}

const mod = (a: number, n: number) => ((a % n) + n) % n;
const tanda = (x: number) => (x > 0 ? `+${x}` : x < 0 ? `−${-x}` : '0');
const selisih = (v: number[]) => v.slice(1).map((x, i) => x - v[i]);
const semuaSama = (v: number[]) => v.every((x) => x === v[0]);
const HURUF = (i: number) => String.fromCharCode(65 + mod(i, 26));
const alnum = (k: string) => /^[A-Za-z0-9]+$/.test(k);
const panah = (u: string[]) => u.join(' → ');

// ── deret per posisi ─────────────────────────────────────────────────────────────────────────────────────
type Seg = { jenis: 'L' | 'N'; nilai: number };
function segmen(k: string): Seg[] | null {
  if (!/^[A-Z0-9]+$/.test(k)) return null;
  return (k.match(/[A-Z]|\d+/g) ?? []).map((s) => (/\d/.test(s) ? { jenis: 'N', nilai: Number(s) } : { jenis: 'L', nilai: s.charCodeAt(0) - 65 }));
}
const tandaSeg = (s: Seg[]) => s.map((x) => x.jenis).join('');

/** Pola deret yang cocok untuk satu posisi. `penuh=false` → hanya uji kelayakan prefiks. */
function polaDeret(v: number[], penuh: boolean, tampil: (x: number) => string): string | null {
  const d = selisih(v);
  const urut = panah(v.map(tampil));
  const tetap = semuaSama(d);
  if (tetap && (!penuh || d.length >= 2)) return `${urut}; langkahnya tetap ${tanda(d[0] ?? 0)}`;
  const ganti = d.every((x, i) => x === d[i % 2]);
  if (ganti && (!penuh || (d.length >= 3 && d[0] !== d[1]))) return `${urut}; langkahnya ${tanda(d[0])}, ${tanda(d[1])} bergantian`;
  const dd = selisih(d);
  if (semuaSama(dd) && (!penuh || (d.length >= 3 && dd[0] !== 0))) return `${urut}; besar langkahnya ${d.map(tanda).join(', ')} (berubah ${tanda(dd[0])} setiap kali)`;
  const genap = v.filter((_, i) => i % 2 === 0), ganjil = v.filter((_, i) => i % 2 === 1);
  if (semuaSama(selisih(genap)) && semuaSama(selisih(ganjil)) && (!penuh || (genap.length >= 3 && ganjil.length >= 3))) {
    return `${urut}; suku ke-1, 3, 5, … membentuk ${panah(genap.map(tampil))} (${tanda(genap[1] - genap[0])}) dan suku ke-2, 4, 6, … membentuk ${panah(ganjil.map(tampil))} (${tanda(ganjil[1] - ganjil[0])})`;
  }
  return null;
}

const deret: Kelas = {
  id: 'deret', nama: 'Deret pada setiap posisi',
  berlaku(kode) {
    const s = kode.map(segmen);
    return s.every(Boolean) && s.every((x) => tandaSeg(x!) === tandaSeg(s[0]!));
  },
  layak(urut) {
    const s = urut.map((k) => segmen(k)!);
    return s[0].every((seg, j) => polaDeret(s.map((x) => x[j].nilai), false, String) !== null);
  },
  cocok(urut) {
    const s = urut.map((k) => segmen(k)!);
    const baris: string[] = [];
    let berubah = false;
    for (let j = 0; j < s[0].length; j++) {
      const v = s.map((x) => x[j].nilai);
      const huruf = s[0][j].jenis === 'L';
      const p = polaDeret(v, true, huruf ? HURUF : String);
      if (!p) return null;
      if (!semuaSama(v)) berubah = true;
      const label = s[0].length === 1 ? 'Nilai' : `${huruf ? 'Huruf' : 'Angka'} posisi ke-${j + 1}`;
      baris.push(`${label}: ${p}.`);
    }
    if (!berubah) return null;
    if (s[0].length > 1) baris.push('Semua aturan posisi berjalan bersamaan pada setiap sambungan.');
    return baris;
  },
};

// ── simbol berganti menurut posisi (hlm. 11) ─────────────────────────────────────────────────────────────
const namaPosisi = (L: number, i: number) => (L === 3 ? ['kiri', 'tengah', 'kanan'][i] : `ke-${i + 1}`);
const duaSimbol = (kode: string[]) => new Set(kode.join('')).size === 2 && kode.every((k) => k.length === kode[0].length && k.length >= 2);
function posisiBalik(a: string, b: string): number {
  let p = -1;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) { if (p >= 0) return -2; p = i; }
  return p;
}
const simbol: Kelas = {
  id: 'simbol', nama: 'Satu simbol berganti, posisinya bergiliran',
  berlaku: duaSimbol,
  layak(urut) {
    const L = urut[0].length;
    const f = urut.slice(1).map((k, i) => posisiBalik(urut[i], k));
    if (f.some((x) => x < 0)) return false;
    if (new Set(f.slice(0, L)).size !== Math.min(L, f.length)) return false;
    return f.every((x, t) => t < L || x === f[t - L]);
  },
  cocok(urut) {
    const L = urut[0].length;
    if (urut.length - 1 <= L || !simbol.layak(urut)) return null;
    const f = urut.slice(1).map((k, i) => posisiBalik(urut[i], k));
    const [a, b] = [...new Set(urut.join(''))];
    return [
      `Setiap sambungan mengganti tepat satu simbol (${a} ↔ ${b}).`,
      `Posisi yang diganti bergiliran ${f.slice(0, L).map((x) => namaPosisi(L, x)).join(', ')}, lalu berulang: ${f.map((x) => namaPosisi(L, x)).join(', ')}.`,
      `Urutan: ${panah(urut)}. Simbol dengan kode sama adalah simpul berbeda; setiap simpul dipakai sekali.`,
    ];
  },
};

// ── bilangan biner ───────────────────────────────────────────────────────────────────────────────────────
function nilaiBiner(urut: string[]) {
  const [a, b] = [...new Set(urut.join(''))].sort();
  return [[a, b], [b, a]].map(([nol, satu]) => ({ nol, satu, v: urut.map((k) => parseInt([...k].map((c) => (c === satu ? '1' : '0')).join(''), 2)) }));
}
const biner: Kelas = {
  id: 'biner', nama: 'Bilangan biner',
  berlaku: duaSimbol,
  layak: (urut) => nilaiBiner(urut).some(({ v }) => semuaSama(selisih(v)) && (v.length < 2 || v[1] !== v[0])),
  cocok(urut) {
    for (const { nol, satu, v } of nilaiBiner(urut)) {
      const d = selisih(v);
      if (d.length >= 2 && semuaSama(d) && d[0] !== 0) {
        return [`Baca ${satu} sebagai 1 dan ${nol} sebagai 0, lalu baca kode sebagai bilangan biner: ${panah(v.map(String))}.`,
          `Nilainya ${d[0] > 0 ? 'bertambah' : 'berkurang'} ${Math.abs(d[0])} setiap langkah; ketika satu posisi sudah 1 dan harus bertambah, posisi itu kembali 0 dan membawa 1 ke kirinya.`];
      }
    }
    return null;
  },
};

// ── rantai penghubung ────────────────────────────────────────────────────────────────────────────────────
const kayaKarakter = (kode: string[]) => kode.every(alnum) && kode.every((k) => k.length >= 2) && new Set(kode.join('')).size >= 6;
function karakterSama(a: string, b: string): string[] {
  const sisa = [...b];
  const sama: string[] = [];
  for (const c of a) { const i = sisa.indexOf(c); if (i >= 0) { sama.push(c); sisa.splice(i, 1); } }
  return sama;
}
function kelasLokal(id: string, nama: string, berlaku: (k: string[]) => boolean, sambung: (a: string, b: string) => boolean, urai: (urut: string[]) => string[]): Kelas {
  return {
    id, nama, berlaku, sambung,
    layak: (urut) => urut.slice(1).every((k, i) => sambung(urut[i], k)),
    cocok: (urut) => (urut.slice(1).every((k, i) => sambung(urut[i], k)) ? urai(urut) : null),
  };
}
const berbagi = kelasLokal('berbagi', 'Satu karakter sama antarkode', kayaKarakter,
  (a, b) => karakterSama(a, b).length === 1,
  (urut) => [
    'Dua kode bertetangga selalu memiliki tepat satu karakter yang sama; posisinya boleh berbeda.',
    `Penghubungnya: ${urut.slice(1).map((k, i) => `${urut[i]}–${k} (${karakterSama(urut[i], k)[0]})`).join(', ')}.`,
  ]);
const akhirAwal = kelasLokal('akhir-awal', 'Karakter akhir = karakter awal berikutnya', kayaKarakter,
  (a, b) => a[a.length - 1] === b[0],
  (urut) => [
    'Karakter terakhir suatu kode harus sama dengan karakter pertama kode berikutnya.',
    `Penghubungnya: ${urut.slice(1).map((k, i) => `${urut[i]} → ${k} (${k[0]})`).join(', ')}.`,
  ]);

// ── rotasi posisi karakter ───────────────────────────────────────────────────────────────────────────────
const putarKiri = (k: string, n: number) => k.slice(n) + k.slice(0, n);
const rotasi: Kelas = {
  id: 'rotasi', nama: 'Rotasi posisi karakter',
  berlaku: (kode) => kode.every((k) => k.length === kode[0].length && k.length >= 3 && [...k].sort().join('') === [...kode[0]].sort().join('')),
  layak(urut) {
    const L = urut[0].length;
    return Array.from({ length: L - 1 }, (_, i) => i + 1).some((n) => urut.slice(1).every((k, i) => putarKiri(urut[i], n) === k));
  },
  cocok(urut) {
    const L = urut[0].length;
    for (let n = 1; n < L; n++) {
      if (!urut.slice(1).every((k, i) => putarKiri(urut[i], n) === k)) continue;
      const kata = n === 1 ? 'pindahkan karakter paling kiri ke ujung kanan' : n === L - 1 ? 'pindahkan karakter paling kanan ke ujung kiri' : `pindahkan ${n} karakter paling kiri ke ujung kanan`;
      return [`Karakternya tetap; yang berubah hanya posisinya. Setiap langkah: ${kata}.`, `Urutan: ${panah(urut)}.`];
    }
    return null;
  },
};

// ── ruang tertutup huruf (hlm. 25) ───────────────────────────────────────────────────────────────────────
export const LUBANG: Record<string, number> = { A: 1, B: 2, D: 1, O: 1, P: 1, Q: 1, R: 1 };
export const hitungLubang = (k: string) => [...k].reduce((s, c) => s + (LUBANG[c] ?? 0), 0);
const lubang: Kelas = {
  id: 'lubang', nama: 'Jumlah ruang tertutup huruf',
  berlaku: (kode) => kode.every((k) => /^[A-Z]+$/.test(k)),
  layak: (urut) => { const d = selisih(urut.map(hitungLubang)); return semuaSama(d) && (d.length === 0 || d[0] !== 0); },
  cocok(urut) {
    const h = urut.map(hitungLubang);
    const d = selisih(h);
    if (d.length < 2 || !semuaSama(d) || d[0] === 0) return null;
    const rinci = (k: string) => { const p = [...k].filter((c) => LUBANG[c]); return p.length ? p.map((c) => `${c}${LUBANG[c] > 1 ? ` (${LUBANG[c]})` : ''}`).join(', ') : 'tidak ada'; };
    return [
      'Hitung ruang tertutup (lubang) pada bentuk huruf, bukan jumlah huruf yang berlubang: A, D, O, P, Q, R masing-masing 1; B 2; huruf lain 0.',
      ...urut.map((k, i) => `${k} = ${h[i]} (${rinci(k)}).`),
      `Jumlah ruang tertutup ${d[0] > 0 ? 'bertambah' : 'berkurang'} ${Math.abs(d[0])} pada setiap langkah: ${panah(h.map(String))}.`,
    ];
  },
};

// ── selisih angka menggeser huruf (hlm. 26) ──────────────────────────────────────────────────────────────
const POLA_GESER = /^\d[A-Z]\d$/;
const geserBerikut = (a: string) => HURUF(a.charCodeAt(1) - 65 + Number(a[2]) - Number(a[0]));
const geser = kelasLokal('geser', 'Selisih angka menggeser huruf', (kode) => kode.every((k) => POLA_GESER.test(k)),
  (a, b) => geserBerikut(a) === b[1],
  (urut) => [
    'Selisih = angka kanan − angka kiri. Geser huruf tengah sebanyak selisih itu untuk mendapat huruf tengah kode berikutnya (positif maju, negatif mundur, nol tetap; setelah Z kembali ke A dan sebelum A adalah Z).',
    ...urut.slice(0, -1).map((k, i) => {
      const s = Number(k[2]) - Number(k[0]);
      return s ? `${k}: ${k[2]} − ${k[0]} = ${tanda(s)}, jadi ${k[1]} ${tanda(s)} = ${urut[i + 1][1]} (${urut[i + 1]}).` : `${k}: ${k[2]} − ${k[0]} = 0, jadi huruf ${k[1]} tetap (${urut[i + 1]}).`;
    }),
  ]);

// ── hasil operasi menjadi angka awal (hlm. 15) ──────────────────────────────────────────────────────────
const POLA_HITUNG = /^(\d+)([×÷+−])(\d+)$/;
export function hasilOperasi(k: string): number | null {
  const m = POLA_HITUNG.exec(k);
  if (!m) return /^\d+$/.test(k) ? null : NaN;
  const a = Number(m[1]), b = Number(m[3]);
  switch (m[2]) {
    case '×': return a * b;
    case '÷': return b && a % b === 0 ? a / b : NaN;
    case '+': return a + b;
    default: return a - b;
  }
}
const angkaAwal = (k: string) => Number(/^\d+/.exec(k)?.[0] ?? NaN);
const hitung = kelasLokal('hitung', 'Hasil operasi menjadi angka awal berikutnya',
  (kode) => kode.every((k) => POLA_HITUNG.test(k) || /^\d+$/.test(k)) && kode.filter((k) => POLA_HITUNG.test(k)).length >= kode.length - 1,
  (a, b) => { const h = hasilOperasi(a); return h !== null && !Number.isNaN(h) && h === angkaAwal(b); },
  (urut) => [
    'Hasil operasi pada satu simpul menjadi angka awal simpul berikutnya.',
    `Perhitungan: ${urut.slice(0, -1).map((k) => `${k} = ${hasilOperasi(k)}`).join('; ')}.`,
    `${urut[urut.length - 1]} menjadi simpul akhir.`,
  ]);

// ── simbol arah sebagai instruksi (hlm. 19) ─────────────────────────────────────────────────────────────
const POLA_ARAH = /^(\d+)(>+|<+)$/;
export const nilaiArah = (s: string) => (s[0] === '>' ? s.length : -s.length);
const arah = kelasLokal('arah', 'Simbol arah sebagai instruksi langkah', (kode) => kode.every((k) => POLA_ARAH.test(k)),
  (a, b) => { const m = POLA_ARAH.exec(a)!; return Number(m[1]) + nilaiArah(m[2]) === angkaAwal(b); },
  (urut) => {
    const jenis = [...new Set(urut.map((k) => POLA_ARAH.exec(k)![2]))].sort((x, y) => nilaiArah(y) - nilaiArah(x));
    return [
      `Arti simbol: ${jenis.map((s) => `${s} berarti ${nilaiArah(s) > 0 ? 'tambah' : 'kurang'} ${Math.abs(nilaiArah(s))}`).join(', ')}. Terapkan instruksi pada angka simpul saat ini untuk mendapat angka simpul berikutnya.`,
      `Perhitungan: ${urut.slice(0, -1).map((k) => { const m = POLA_ARAH.exec(k)!; const v = nilaiArah(m[2]); return `${m[1]} ${v > 0 ? '+' : '−'} ${Math.abs(v)} = ${Number(m[1]) + v}`; }).join('; ')}.`,
      `Berhenti pada ${urut[urut.length - 1]} karena seluruh simpul sudah dipakai.`,
    ];
  });

// ── angka siklis + kapitalisasi (hlm. 17, hipotesis) ────────────────────────────────────────────────────
const POLA_SIKLIS = /^(\d)([a-zA-Z])([a-zA-Z])(\d)$/;
const polaHuruf = (k: string) => { const m = POLA_SIKLIS.exec(k)!; const besar = (c: string) => c === c.toUpperCase(); return besar(m[2]) === besar(m[3]) ? 'sama' : besar(m[2]) ? 'Bk' : 'kB'; };
function cekSiklis(urut: string[]) {
  const m = urut.map((k) => POLA_SIKLIS.exec(k)!);
  const turun = m.slice(1).map((x, i) => mod(Number(m[i][1]) - Number(x[1]), 10));
  const naik = m.slice(1).map((x, i) => mod(Number(x[4]) - Number(m[i][4]), 10));
  const pola = urut.map(polaHuruf);
  const ok = turun.every((d) => d >= 1) && naik.every((d) => d >= 1) && turun.reduce((a, b) => a + b, 0) <= 10 && naik.reduce((a, b) => a + b, 0) <= 10
    && pola.every((p) => p !== 'sama') && pola.slice(1).every((p, i) => p !== pola[i]);
  return { ok, m };
}
const siklis: Kelas = {
  id: 'siklis', nama: 'Angka siklis dan kapitalisasi bergantian',
  berlaku: (kode) => kode.every((k) => POLA_SIKLIS.test(k)),
  layak: (urut) => cekSiklis(urut).ok,
  cocok(urut) {
    const { ok, m } = cekSiklis(urut);
    if (!ok || urut.length < 4) return null;
    return [
      `Angka kiri menurun secara siklis (boleh melewati 0 ke 9) tanpa melebihi satu putaran: ${panah(m.map((x) => x[1]))}.`,
      `Angka kanan naik secara siklis (boleh melewati 9 ke 0) tanpa melebihi satu putaran: ${panah(m.map((x) => x[4]))}.`,
      `Kapitalisasi pasangan huruf bergantian kecil–BESAR dan BESAR–kecil: ${panah(m.map((x) => x[2] + x[3]))}.`,
      'Jawaban ini berlaku berdasarkan aturan yang diasumsikan (hipotesis halaman 17), bukan kunci resmi SHL.',
    ];
  },
};

// ── operasi hitung bergantian (variasi C) ──────────────────────────────────────────────────────────────
type Op = { s: string; f: (x: number) => number };
function opDari(a: number, b: number): Op[] {
  const ops: Op[] = [];
  if (b > a) ops.push({ s: `+${b - a}`, f: (x) => x + (b - a) });
  if (b < a) ops.push({ s: `−${a - b}`, f: (x) => x - (a - b) });
  if (a > 0 && b % a === 0 && b / a >= 2) ops.push({ s: `×${b / a}`, f: (x) => x * (b / a) });
  if (b > 0 && a % b === 0 && a / b >= 2) { const k = a / b; ops.push({ s: `÷${k}`, f: (x) => (x % k === 0 ? x / k : NaN) }); }
  return ops;
}
function cariOpGanti(v: number[]): [Op, Op] | null {
  if (v.length < 3) return null;
  for (const p of opDari(v[0], v[1])) for (const q of opDari(v[1], v[2])) {
    if (p.s === q.s) continue;
    if (v.slice(1).every((x, i) => (i % 2 === 0 ? p : q).f(v[i]) === x)) return [p, q];
  }
  return null;
}
const operasiGanti: Kelas = {
  id: 'operasi-ganti', nama: 'Dua operasi hitung bergantian',
  berlaku: (kode) => kode.every((k) => /^\d+$/.test(k)),
  layak: (urut) => urut.length < 3 || cariOpGanti(urut.map(Number)) !== null,
  cocok(urut) {
    const v = urut.map(Number);
    if (v.length < 5) return null;
    const pq = cariOpGanti(v);
    if (!pq) return null;
    return [`Dua operasi dipakai bergantian: ${pq[0].s}, lalu ${pq[1].s}; ulangi pasangan operasi tersebut.`,
      `Perhitungan: ${v.slice(1).map((x, i) => `${v[i]} ${(i % 2 === 0 ? pq[0] : pq[1]).s} = ${x}`).join('; ')}.`];
  },
};

export const KELAS: Kelas[] = [deret, simbol, biner, berbagi, akhirAwal, rotasi, lubang, geser, hitung, arah, siklis, operasiGanti];
export const kelasById = (id: string) => KELAS.find((k) => k.id === id)!;

/**
 * Semua jalur lengkap (urutan id simpul) dari awalan yang memenuhi minimal satu aturan pustaka.
 * Penelusuran dipangkas: prefiks dipertahankan hanya selama masih ada aturan yang layak.
 */
export function semuaJalur(simpul: { id: string; kode: string }[], awalan: string[]): string[][] {
  const kode = new Map(simpul.map((s) => [s.id, s.kode]));
  const kelas = KELAS.filter((k) => k.berlaku(simpul.map((s) => s.kode)));
  const hasil: string[][] = [];
  const jalur = [...awalan];
  const sisa = simpul.map((s) => s.id).filter((id) => !awalan.includes(id));
  const dfs = (aktif: Kelas[]) => {
    if (hasil.length > 5) return;
    const k = jalur.map((id) => kode.get(id)!);
    if (!sisa.length) {
      if (aktif.some((c) => c.cocok(k))) hasil.push([...jalur]);
      return;
    }
    for (let i = 0; i < sisa.length; i++) {
      const id = sisa[i];
      // Simpul berkode sama yang dicoba pada posisi yang sama menghasilkan jalur kembar menurut kode, tetapi tetap jalur
      // berbeda menurut id; keduanya dihitung supaya duplikat yang tidak dikunci awalan terdeteksi sebagai jawaban ganda.
      jalur.push(id); sisa.splice(i, 1);
      const kk = [...k, kode.get(id)!];
      const lanjut = aktif.filter((c) => c.layak(kk));
      if (lanjut.length) dfs(lanjut);
      sisa.splice(i, 0, id); jalur.pop();
    }
  };
  const awal = kelas.filter((c) => c.layak(awalan.map((id) => kode.get(id)!)));
  if (awal.length) dfs(awal);
  return hasil;
}
