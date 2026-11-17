import type { Tingkat } from '../../core/pilihan-ganda';
import type { Rng } from '../../core/rng';
import type { Family, Label, Pembahasan } from '../../core/types';
import { chapterById } from '../../data/chapters';
import { daftarKata } from '../../data/nama';
import { deduksi, type HasilDeduksi } from './deduksi';
import {
  KONTEKS, NAMA_BADGES, cocok, instruksiBadges, kanonik, kunciPeringkat, pelaku, semuaPeringkat, semuaUrutan, sidikBadges,
  solusiTanpaMasingMasing, teksPetunjuk, uraiPetunjuk,
  type BadgesItem, type JenisKendala, type KendalaBadges, type KonteksBadges, type Peringkat, type Petunjuk,
} from './model';

// Badges (Logical Ranking). Belum ada blueprint resmi; acuan = mesin Badges SHL Tahap 1 (js/badges-shl.js, cek-peringkat.js)
// dan tangkapan layar SHL yang dianalisis di sana: enam orang, petunjuk posisi verbal murni. Semua family memakai enam
// orang; tingkat diatur lewat jenis dan banyak petunjuk.
//   SHL  : mekanisme tiga templat Tahap 1 (Arrival Times, Office Arrival Times + satu relasi, Gaji). Jenis dan banyak
//          petunjuk setiap templat tetap; pelaku setiap petunjuk, posisi/arah (termasuk cermin r → 7 − r: lebih awal ↔
//          lebih lambat, paruh pertama ↔ paruh kedua, tidak genap ↔ tidak ganjil, tiga teratas ↔ tiga terbawah,
//          "jika … ke-4" ↔ "ke-3") dan letak kartu dicari ulang untuk setiap soal sehingga strukturnya beragam.
//   VARIASI: pembangun acak — urutan acak → ambil petunjuk benar dari pustaka → tambah sampai jawaban tunggal → pangkas
//           petunjuk yang tidak berfungsi (setiap petunjuk wajib: tanpa petunjuk itu jawaban tidak lagi tunggal).

const N_ORANG = 6;
/** Batas pembahasan (±1,5 menit per soal): uji kemungkinan, banyak langkah (termasuk pembuka dan penutup), karakter. */
export const BATAS_BAHAS = { uji: 3, langkah: 12, karakter: 2500 };

// ───────────────────────── Bantuan bersama ─────────────────────────

const TAK_LANGSUNG: JenisKendala[] = ['jarak-tepat', 'jarak-min', 'atas-min', 'di-antara', 'paritas', 'atas-k', 'bawah-k', 'lebih-jauh', 'jika'];

/** Calon pemilik kartu: petunjuk ditulis pada kartu salah satu orang yang disebut. */
function calonKartu(c: KendalaBadges): string[] {
  switch (c.jenis) {
    case 'atas': case 'atas-tepat': case 'atas-min': case 'jarak-tepat': case 'jarak-min': return [c.a, c.b];
    case 'lebih-jauh': case 'jika': return [c.a, c.b, c.c];
    default: return [c.a];
  }
}

/** Sebar petunjuk ke kartu: maks. dua per kartu, kartu kosong sesedikit mungkin (pencarian terbatas, deterministik per rng). */
function aturKartu(r: Rng, kendala: KendalaBadges[], ids: string[]): { kartu: string[]; kosong: number } | null {
  const urut = kendala.map((c, i) => ({ i, opsi: r.shuffle(calonKartu(c)) })).sort((x, y) => x.opsi.length - y.opsi.length);
  const beban = new Map(ids.map((id) => [id, 0]));
  const pilih: string[] = new Array(kendala.length);
  let terbaik: { kartu: string[]; kosong: number } | null = null;
  const batasBawah = Math.max(0, ids.length - kendala.length);
  let simpul = 0;
  const cari = (j: number) => {
    if (terbaik && terbaik.kosong === batasBawah) return;
    if (++simpul > 4000) return;
    if (j === urut.length) {
      const kosong = ids.filter((id) => beban.get(id) === 0).length;
      if (!terbaik || kosong < terbaik.kosong) terbaik = { kartu: pilih.slice(), kosong };
      return;
    }
    const { i, opsi } = urut[j];
    const opsiUrut = [...opsi].sort((x, y) => beban.get(x)! - beban.get(y)!);
    for (const o of opsiUrut) {
      if (beban.get(o)! >= 2) continue;
      beban.set(o, beban.get(o)! + 1); pilih[i] = o;
      cari(j + 1);
      beban.set(o, beban.get(o)! - 1);
    }
  };
  cari(0);
  return terbaik;
}

/** Rakit item dari kendala ber-kartu: teks kartu dirender dari kendala, urutan petunjuk dalam kartu mengikuti `kendala`. */
function rakit(k: KonteksBadges, tingkat: Tingkat, ids: string[], nama: string[], kendala: Petunjuk[]): BadgesItem {
  const n = ids.length;
  const nm = (id: string) => nama[ids.indexOf(id)];
  const urut = ids.flatMap((id) => kendala.filter((c) => c.kartu === id));
  return {
    jenis: 'logical-ranking',
    judul: k.judul,
    konteks: k.id,
    tingkat,
    instruksi: instruksiBadges(k, n),
    lencana: n,
    bahasa: k.bahasa,
    orang: ids.map((id, i) => ({
      id, nama: nama[i], foto: `orang/${nama[i]}.png`,
      petunjuk: urut.filter((c) => c.kartu === id).map((c) => teksPetunjuk(c, nm, k.bahasa, n)),
    })),
    kendala: urut,
  };
}

/** Pilih redaksi setara secara acak (tidak memengaruhi makna maupun sidik). */
function varianAcak(r: Rng, c: Petunjuk, n: number): Petunjuk {
  if (c.jenis === 'paritas' && r.next() < 0.5) return { ...c, varian: 'negasi' };
  if ((c.jenis === 'atas-k' || c.jenis === 'bawah-k') && n % 2 === 0 && c.k === n / 2 && r.next() < 0.5) return { ...c, varian: 'paruh' };
  if (c.jenis === 'bukan' && (c.p === 1 || c.p === n) && r.next() < 0.7) return { ...c, varian: 'ujung' };
  return c;
}

const idOrang = (n: number) => Array.from({ length: n }, (_, i) => `p${i + 1}`);

const cacheRekaman = new Map<number, Peringkat[]>();
/** Seluruh n! urutan sebagai peta p1..pn → nomor (disimpan per n). */
function rekamanUrutan(n: number): Peringkat[] {
  let ada = cacheRekaman.get(n);
  if (!ada) {
    const ids = idOrang(n);
    ada = semuaUrutan(n).map((p) => Object.fromEntries(ids.map((id, i) => [id, p[i]])) as Peringkat);
    cacheRekaman.set(n, ada);
  }
  return ada;
}

// ───────────────────────── Analisis (deduksi + pembahasan), disimpan per item ─────────────────────────

interface Analisis { d: HasilDeduksi; pembahasan: Pembahasan }
const cacheAnalisis = new WeakMap<BadgesItem, Analisis | null>();

/** Deduksi dari TEKS kartu (bukan `item.kendala`) dan pembahasan lengkapnya; dipakai pembangun, pemeriksa, dan `bahas`. */
function analisis(item: BadgesItem): Analisis | null {
  if (cacheAnalisis.has(item)) return cacheAnalisis.get(item)!;
  let hasil: Analisis | null = null;
  const baca = uraiPetunjuk(item);
  const d = baca && deduksi(item, baca);
  if (baca && d) {
    const urut = [...item.orang].sort((x, y) => d.hasil[x.id] - d.hasil[y.id]);
    const daftar = urut.map((o) => `${d.hasil[o.id]}. ${o.nama}`).join('; ');
    hasil = {
      d,
      pembahasan: {
        jawaban: daftar,
        langkah: [
          ...d.langkah,
          { teks: `Urutan akhir menurut ${item.bahasa.daftar}: ${daftar}. Setiap orang mendapat satu lencana dan seluruh ${baca.length} petunjuk terpenuhi.` },
        ],
        caraCepat: caraCepat(item, baca, d),
      },
    };
  }
  cacheAnalisis.set(item, hasil);
  return hasil;
}

/** Cara cepat disusun hanya dari jenis petunjuk yang ada di soal dan teknik yang dipakai pembahasannya. */
function caraCepat(item: BadgesItem, baca: Petunjuk[], d: HasilDeduksi): string {
  const jenis = new Set(baca.map((c) => c.jenis));
  const ada = (...j: JenisKendala[]) => j.some((x) => jenis.has(x));
  const b = item.bahasa;
  const pos = b.pos;
  const ujungK = ada('atas-k') && ada('bawah-k') ? `${b.awal}/${b.ujung}` : ada('atas-k') ? b.awal : b.ujung;
  const posisi = [
    ada('tetap') && `${pos} tertentu`, ada('bukan') && `larangan ${pos} tertentu`, ada('paritas') && `${pos} ganjil/genap`,
    ada('atas-k', 'bawah-k') && `beberapa ${pos} ${ujungK}`,
  ].filter((x): x is string => !!x);
  const cepat: string[] = [];
  if (posisi.length) cepat.push(`kerjakan dulu petunjuk ${daftarKata(posisi)}`);
  if (ada('atas-tepat', 'jarak-tepat')) cepat.push('pasangan berjarak tepat hanya punya sedikit letak yang mungkin, jadi cocokkan dengan posisi yang sudah diketahui');
  if (ada('atas', 'atas-min')) cepat.push(`rangkai petunjuk “${b.lebih}” dan “${b.bawah.replace(/ daripada$/, '')}” menjadi satu rantai`);
  const lanjut = [
    ada('di-antara') && '“di antara”', ada('atas-min', 'jarak-min') && '“sedikitnya”', ada('lebih-jauh') && 'perbandingan selisih', ada('jika') && '“jika”',
  ].filter((x): x is string => !!x);
  if (lanjut.length) cepat.push(`petunjuk ${daftarKata(lanjut)} dipakai setelah sebagian posisi tersempit`);
  if (d.gabungan) cepat.push('bila satu petunjuk saja tidak cukup, gabungkan dua petunjuk yang menyebut orang yang sama');
  if (d.ujiKemungkinan) cepat.push('bila masih buntu, uji kasus pada orang yang pilihannya paling sedikit dan coret kasus yang bertentangan');
  return `Buat tabel nama × ${pos} 1–${item.lencana}; ${cepat.join('; ')}.`;
}

// ───────────────────────── Pemeriksaan mutu bersama ─────────────────────────

function periksaUmum(item: BadgesItem, jawaban: Peringkat): string[] {
  const masalah: string[] = [];
  const n = item.lencana;
  const ids = item.orang.map((o) => o.id);
  if (n !== N_ORANG || item.orang.length !== n) masalah.push('jumlah orang bukan enam atau tidak sama dengan jumlah lencana');
  if (new Set(item.orang.map((o) => o.nama)).size !== n || new Set(ids).size !== n) masalah.push('nama/id orang ganda');
  if (new Set(item.orang.map((o) => o.nama[0])).size !== n) masalah.push('inisial orang ganda');
  if (Object.keys(jawaban).length !== n || new Set(Object.values(jawaban)).size !== n || Object.values(jawaban).some((v) => v < 1 || v > n)) masalah.push('kunci bukan permutasi 1..n');
  if (!item.instruksi.some((s) => s.includes(`lencana 1 untuk orang yang ${item.bahasa.satu}`) && s.includes(`lencana ${n} untuk orang yang ${item.bahasa.akhir}`))) masalah.push('arti lencana 1 dan lencana terakhir tidak dinyatakan');
  if (item.orang.some((o) => o.petunjuk.length > 2)) masalah.push('ada kartu dengan lebih dari dua petunjuk');
  if (item.orang.filter((o) => !o.petunjuk.length).length > 2) masalah.push('lebih dari dua kartu kosong');
  if (item.orang.some((o) => o.petunjuk.some((t) => !/^[A-Z].*\.$/.test(t) || /\.\s/.test(t)))) masalah.push('petunjuk bukan satu kalimat');
  // Pemilik kartu tidak menyebut namanya sendiri.
  if (item.orang.some((o) => o.petunjuk.some((t) => new RegExp(`(^|[^A-Za-z])${o.nama}([^A-Za-z]|$)`).test(t)))) masalah.push('petunjuk menyebut nama pemilik kartunya sendiri');
  // Teks ↔ model, dua arah: yang dibaca dari kartu harus sama persis maknanya dengan kendala terstruktur.
  const baca = uraiPetunjuk(item);
  if (!baca) { masalah.push('ada kalimat kartu yang tidak dapat dibaca solver'); return masalah; }
  const a = baca.map(kanonik).sort().join('\n');
  const b = item.kendala.map(kanonik).sort().join('\n');
  if (a !== b) masalah.push('teks kartu tidak sama makna dengan kendala');
  for (const c of baca) {
    const p = pelaku(c);
    if (new Set(p).size !== p.length || p.some((x) => !ids.includes(x))) masalah.push('petunjuk menyebut orang yang sama dua kali / tidak dikenal');
    if ('k' in c && (c.k < 0 || c.k > n - 2)) masalah.push('jarak petunjuk di luar batas');
    if ('p' in c && (c.p < 1 || c.p > n)) masalah.push('posisi petunjuk di luar batas');
  }
  // Tidak boleh ada petunjuk yang langsung menyebut peringkat semua orang: paling banyak satu "berada di posisi ke-k".
  if (baca.filter((c) => c.jenis === 'tetap').length > 1) masalah.push('lebih dari satu petunjuk posisi tetap');
  // Setiap petunjuk punya fungsi: tanpa petunjuk itu, urutan tidak lagi tunggal.
  const tanpa = solusiTanpaMasingMasing(ids, baca);
  tanpa.forEach((s, i) => { if (s < 2) masalah.push(`petunjuk tidak berfungsi: ${item.orang.find((o) => o.id === baca[i].kartu)!.nama}`); });
  // Pembahasan harus dapat diturunkan dan cukup ringkas.
  const an = analisis(item);
  if (an) {
    if (an.d.ujiKemungkinan > BATAS_BAHAS.uji) masalah.push(`pembahasan perlu lebih dari ${BATAS_BAHAS.uji} uji kemungkinan`);
    if (an.pembahasan.langkah.length > BATAS_BAHAS.langkah) masalah.push(`pembahasan lebih dari ${BATAS_BAHAS.langkah} langkah`);
    if (an.pembahasan.langkah.reduce((s, l) => s + l.teks.length, 0) > BATAS_BAHAS.karakter) masalah.push(`pembahasan lebih dari ${BATAS_BAHAS.karakter} karakter`);
  }
  return masalah;
}

function bahas(item: BadgesItem, jawaban: Peringkat): Pembahasan | null {
  const an = analisis(item);
  if (!an || item.orang.some((o) => an.d.hasil[o.id] !== jawaban[o.id])) return null;
  return an.pembahasan;
}

interface DefBadges {
  id: string; nama: string; label: Label; sumber: string; ringkas: string;
  bangun: (r: Rng) => { item: BadgesItem; jawaban: Peringkat } | null;
  periksa?: (item: BadgesItem, jawaban: Peringkat) => string[];
  maksPercobaan?: number;
}

function family(p: DefBadges): Family<BadgesItem, Peringkat> {
  return {
    id: p.id, versi: 2, nama: p.nama, label: p.label, sumber: p.sumber, ringkas: p.ringkas,
    chapter: chapterById('badges'),
    maksPercobaan: p.maksPercobaan,
    bangun: p.bangun,
    // Solver independen: membaca ulang teks kartu (bukan `item.kendala`), lalu enumerasi seluruh n! urutan.
    pecahkan(item) {
      const baca = uraiPetunjuk(item);
      return baca ? semuaPeringkat(item.orang.map((o) => o.id), baca) : [];
    },
    kunci: kunciPeringkat,
    periksa: (item, jawaban) => [...periksaUmum(item, jawaban), ...(p.periksa?.(item, jawaban) ?? [])],
    bahas,
    sidik: sidikBadges,
  };
}

/** Tingkat dari profil penalaran: perlu gabungan/uji kemungkinan → menantang; selain itu menengah. */
function tingkatDari(d: HasilDeduksi): Tingkat {
  return d.perluLanjut ? 'menantang' : 'menengah';
}

// ───────────────────────── SHL: mekanisme templat Tahap 1 ─────────────────────────

/** Satu slot templat: seluruh petunjuk jenis itu yang BENAR untuk peringkat `rank`. */
type Slot = (ids: string[], rank: Peringkat) => KendalaBadges[];

const pasangan = (ids: string[]) => ids.flatMap((a) => ids.filter((b) => b !== a).map((b) => [a, b] as const));
const slotAtas: Slot = (ids, r) => pasangan(ids).filter(([a, b]) => r[a] < r[b]).map(([a, b]) => ({ jenis: 'atas', a, b }));
const slotAtasTepat = (ks: number[]): Slot => (ids, r) =>
  pasangan(ids).filter(([a, b]) => r[b] > r[a] && ks.includes(r[b] - r[a] - 1)).map(([a, b]) => ({ jenis: 'atas-tepat', a, b, k: r[b] - r[a] - 1 }));
const slotAtasMin = (ks: number[]): Slot => (ids, r) =>
  pasangan(ids).flatMap(([a, b]) => ks.filter((k) => r[b] - r[a] >= k + 1).map((k) => ({ jenis: 'atas-min' as const, a, b, k })));
const slotJarakTepat = (ks: number[]): Slot => (ids, r) =>
  pasangan(ids).filter(([a, b]) => a < b && ks.includes(Math.abs(r[a] - r[b]) - 1)).map(([a, b]) => ({ jenis: 'jarak-tepat', a, b, k: Math.abs(r[a] - r[b]) - 1 }));
const slotParitas: Slot = (ids, r) => ids.map((a) => ({ jenis: 'paritas', a, ganjil: r[a] % 2 === 1 }));
/** Paruh atas/bawah (n = 6): setiap orang tepat berada di salah satu paruh. */
const slotParuh: Slot = (ids, r) => ids.map((a) => (r[a] <= ids.length / 2 ? { jenis: 'atas-k', a, k: ids.length / 2 } : { jenis: 'bawah-k', a, k: ids.length / 2 }));
const slotTigaSisi = (sisi: 'atas' | 'bawah'): Slot => (ids, r) =>
  ids.filter((a) => (sisi === 'atas' ? r[a] <= 3 : r[a] >= ids.length - 2)).map((a) => (sisi === 'atas' ? { jenis: 'atas-k', a, k: 3 } : { jenis: 'bawah-k', a, k: 3 }));
const slotLebihJauh: Slot = (ids, r) => {
  const h: KendalaBadges[] = [];
  for (const a of ids) for (const [b, c] of pasangan(ids)) if (a !== b && a !== c && Math.abs(r[a] - r[b]) > Math.abs(r[a] - r[c])) h.push({ jenis: 'lebih-jauh', a, b, c });
  return h;
};
const slotJika = (ps: number[]): Slot => (ids, r) => {
  const h: KendalaBadges[] = [];
  for (const a of ids) for (const p of ps) for (const [b, c] of pasangan(ids)) if (a !== b && a !== c && (r[a] !== p || r[b] < r[c])) h.push({ jenis: 'jika', a, p, b, c });
  return h;
};

interface TemplatSHL {
  konteks: string[];
  /** Daftar slot (jenis petunjuk tetap); `r` memilih sisi cermin bila templat punya petunjuk posisi bersisi. */
  slot: (r: Rng) => Slot[];
  /** Redaksi tetap templat (mis. "tidak genap" dan "paruh pertama" seperti SHL). */
  varian?: (c: KendalaBadges) => Petunjuk['varian'];
}

const samaKendala = (x: KendalaBadges, y: KendalaBadges) => JSON.stringify(x) === JSON.stringify(y);

/**
 * Cari satu struktur untuk peringkat `rank`: setiap slot diisi satu petunjuk benar (urutan calon diacak), setiap petunjuk
 * wajib mempersempit, daun wajib tunggal dan setiap petunjuk berfungsi. Pencarian mendalam terbatas (deterministik per rng).
 */
function cariStruktur(r: Rng, slot: Slot[], ids: string[], rank: Peringkat, batas = 2500): KendalaBadges[] | null {
  const n = ids.length;
  const calon = slot.map((s) => r.shuffle(s(ids, rank)));
  let simpul = 0;
  const dfs = (j: number, sisa: Peringkat[], pilih: KendalaBadges[]): KendalaBadges[] | null => {
    if (j === slot.length) return sisa.length === 1 && solusiTanpaMasingMasing(ids, pilih).every((s) => s >= 2) ? pilih : null;
    for (const c of calon[j]) {
      if (++simpul > batas) return null;
      if (pilih.some((x) => samaKendala(x, c))) continue;
      const baru = sisa.filter((s) => cocok(c, s, n));
      if (baru.length === sisa.length || (j === slot.length - 1 && baru.length !== 1)) continue;
      const h = dfs(j + 1, baru, [...pilih, c]);
      if (h) return h;
    }
    return null;
  };
  return dfs(0, rekamanUrutan(n), []);
}

// Arrival Times (Tahap 1 acuanShl 1): satu orang "tidak di urutan genap/ganjil", satu orang di paruh pertama/kedua, tepat
// dua orang di antara dua orang tertentu, dan tiga relasi lebih awal/lebih lambat. Tahap 1 menaruh relasi "tepat dua orang
// di antara" pada pertanyaan; di sini relasi itu ditulis pada kartu salah satu pelakunya.
const SHL_TIBA: TemplatSHL = {
  konteks: ['tiba-kantor', 'tiba-rapat', 'tiba-pelatihan'],
  slot: () => [slotParuh, slotParitas, slotJarakTepat([2]), slotAtas, slotAtas, slotAtas],
  varian: (c) => (c.jenis === 'paritas' ? 'negasi' : c.jenis === 'atas-k' || c.jenis === 'bawah-k' ? 'paruh' : undefined),
};

// Office Arrival Times (Tahap 1 acuanShl 2): dua pasangan "tepat dua orang di antara", dua relasi lebih awal/lambat, satu
// "lebih awal dengan sedikitnya satu orang di antara", ditambah satu relasi (Tahap 1: sumber masih punya tiga urutan, satu
// relasi tambahan membuatnya tunggal). Relasi tambahan dipilih dari jenis relasi yang sama dengan Tahap 1.
const SHL_KANTOR: TemplatSHL = {
  konteks: ['tiba-kantor'],
  slot: () => [
    slotJarakTepat([2]), slotJarakTepat([2]), slotAtasMin([1]), slotAtas, slotAtas,
    (ids, r) => [...slotAtas(ids, r), ...slotAtasTepat([0, 1, 2])(ids, r), ...slotAtasMin([1, 2])(ids, r), ...slotJarakTepat([0, 1, 2, 3])(ids, r)],
  ],
};

// Gaji (Tahap 1 acuanShl 0): dua orang di tiga peringkat teratas (cermin: terbawah), dua relasi, satu kondisi "jika …
// berada di peringkat ke-4" (cermin: ke-3), tepat satu orang di antara dua orang, dan perbandingan selisih peringkat
// (Tahap 1 menaruhnya di pertanyaan; di sini di kartu salah satu pelakunya).
const SHL_GAJI: TemplatSHL = {
  konteks: ['gaji'],
  slot: (r) => {
    const sisi = r.pick(['atas', 'bawah'] as const);
    return [slotTigaSisi(sisi), slotTigaSisi(sisi), slotAtasTepat([1]), slotJika([3, 4]), slotLebihJauh, slotAtas, slotAtas];
  },
};

function bangunSHL(t: TemplatSHL) {
  return (r: Rng): { item: BadgesItem; jawaban: Peringkat } | null => {
    const ids = idOrang(N_ORANG);
    const urutan = r.shuffle(Array.from({ length: N_ORANG }, (_, i) => i + 1));
    const rank: Peringkat = Object.fromEntries(ids.map((id, i) => [id, urutan[i]]));
    const struktur = cariStruktur(r, t.slot(r), ids, rank);
    if (!struktur) return null;
    const kartu = aturKartu(r, struktur, ids);
    if (!kartu || kartu.kosong > 2) return null;
    const kendala = r.shuffle(struktur.map((c, i) => {
      const varian = t.varian?.(c);
      return { ...c, kartu: kartu.kartu[i], ...(varian ? { varian } : {}) } as Petunjuk;
    }));
    const item = rakit(KONTEKS[r.pick(t.konteks)], 'menengah', ids, r.sample(NAMA_BADGES, N_ORANG), kendala);
    const an = analisis(item);
    if (!an) return null;
    item.tingkat = tingkatDari(an.d);
    return { item, jawaban: rank };
  };
}

// ───────────────────────── VARIASI: pembangun acak ─────────────────────────

interface AturVariasi {
  tingkat: Tingkat;
  /** Bobot pemilihan per jenis petunjuk; jenis tanpa bobot tidak dipakai. */
  bobot: Partial<Record<JenisKendala, number>>;
  petunjuk: [number, number];
  minJenis: number;
  minTakLangsung: number;
  maksTetap: number;
  /** Batas kartu tanpa petunjuk. */
  maksKosong: number;
  /** Syarat profil penalaran. */
  syarat: (d: HasilDeduksi) => boolean;
}

/** Seluruh petunjuk yang BENAR untuk peringkat `rank`, per jenis yang diizinkan. */
function pustaka(ids: string[], rank: Peringkat, bobot: AturVariasi['bobot']): KendalaBadges[] {
  const n = ids.length;
  const hasil: KendalaBadges[] = [];
  const boleh = (j: JenisKendala) => (bobot[j] ?? 0) > 0;
  for (const a of ids) for (const b of ids) {
    if (a === b) continue;
    const d = rank[b] - rank[a];
    if (d > 0) {
      if (boleh('atas')) hasil.push({ jenis: 'atas', a, b });
      if (boleh('atas-tepat') && d - 1 <= 2) hasil.push({ jenis: 'atas-tepat', a, b, k: d - 1 });
      if (boleh('atas-min')) for (let k = 1; k <= Math.min(2, d - 1); k++) hasil.push({ jenis: 'atas-min', a, b, k });
    }
    if (a < b) {
      const j = Math.abs(d) - 1;
      if (boleh('jarak-tepat') && j <= 3) hasil.push({ jenis: 'jarak-tepat', a, b, k: j });
      if (boleh('jarak-min')) for (let k = 1; k <= Math.min(2, j); k++) hasil.push({ jenis: 'jarak-min', a, b, k });
    }
  }
  if (boleh('di-antara')) for (const a of ids) for (const b of ids) for (const c of ids) {
    if (a === b || a === c || b >= c) continue;
    if ((rank[b] - rank[a]) * (rank[c] - rank[a]) < 0) hasil.push({ jenis: 'di-antara', a, b, c });
  }
  for (const a of ids) {
    const v = rank[a];
    if (boleh('tetap')) hasil.push({ jenis: 'tetap', a, p: v });
    if (boleh('bukan')) for (const p of [1, n]) if (p !== v) hasil.push({ jenis: 'bukan', a, p });
    for (const k of [2, 3]) {
      if (boleh('atas-k') && v <= k) hasil.push({ jenis: 'atas-k', a, k });
      if (boleh('bawah-k') && v >= n - k + 1) hasil.push({ jenis: 'bawah-k', a, k });
    }
    if (boleh('paritas')) hasil.push({ jenis: 'paritas', a, ganjil: v % 2 === 1 });
  }
  return hasil;
}

function bangunVariasi(cfg: AturVariasi) {
  return (r: Rng): { item: BadgesItem; jawaban: Peringkat } | null => {
    const n = N_ORANG;
    const ids = idOrang(n);
    const urutan = r.shuffle(Array.from({ length: n }, (_, i) => i + 1));
    const rank: Peringkat = Object.fromEntries(ids.map((id, i) => [id, urutan[i]]));
    const pool = pustaka(ids, rank, cfg.bobot);
    // Urutan acak berbobot (Efraimidis–Spirakis): peluang tiap JENIS sebanding bobotnya, bukan banyak calonnya.
    const banyak = new Map<JenisKendala, number>();
    for (const c of pool) banyak.set(c.jenis, (banyak.get(c.jenis) ?? 0) + 1);
    const antre = pool
      .map((c) => ({ c, kunci: Math.pow(r.next(), 1 / ((cfg.bobot[c.jenis] ?? 0) / banyak.get(c.jenis)!)) }))
      .sort((x, y) => y.kunci - x.kunci)
      .map((x) => x.c);
    const semua = rekamanUrutan(n);
    let sisa = semua;
    const pilih: KendalaBadges[] = [];
    const unarPer = new Map<string, number>();
    for (const c of antre) {
      if (sisa.length === 1 || pilih.length >= 30) break;
      if (c.jenis === 'tetap' && pilih.filter((x) => x.jenis === 'tetap').length >= cfg.maksTetap) continue;
      const unar = pelaku(c).length === 1;
      if (unar && (unarPer.get(c.a) ?? 0) >= 1) continue;
      const saring = sisa.filter((s) => cocok(c, s, n));
      if (saring.length === sisa.length) continue;
      pilih.push(c);
      if (unar) unarPer.set(c.a, (unarPer.get(c.a) ?? 0) + 1);
      sisa = saring;
    }
    if (sisa.length !== 1) return null;
    // Pangkas: buang petunjuk (urutan acak) selama jawaban tetap tunggal → setiap petunjuk yang tersisa wajib.
    // Topeng per urutan: bit i = petunjuk ke-i terpenuhi; jawaban tunggal ⇔ tepat satu urutan memenuhi seluruh bit aktif.
    const topeng = semua.map((s) => pilih.reduce((m, c, i) => (cocok(c, s, n) ? m | (1 << i) : m), 0));
    let aktif = (1 << pilih.length) - 1;
    for (const i of r.shuffle(pilih.map((_, i) => i))) {
      const coba = aktif & ~(1 << i);
      let hitung = 0;
      for (const m of topeng) if ((m & coba) === coba && ++hitung > 1) break;
      if (hitung === 1) aktif = coba;
    }
    const akhir = pilih.filter((_, i) => aktif & (1 << i));
    const [lo, hi] = cfg.petunjuk;
    if (akhir.length < lo || akhir.length > hi) return null;
    if (new Set(akhir.map((c) => c.jenis)).size < cfg.minJenis) return null;
    if (akhir.filter((c) => TAK_LANGSUNG.includes(c.jenis)).length < cfg.minTakLangsung) return null;
    const disebut = new Set(akhir.flatMap(pelaku));
    if (ids.filter((id) => !disebut.has(id)).length > 1) return null;
    const kartu = aturKartu(r, akhir, ids);
    if (!kartu || kartu.kosong > cfg.maksKosong) return null;
    const kendala = r.shuffle(akhir.map((c, i) => varianAcak(r, { ...c, kartu: kartu.kartu[i] } as Petunjuk, n)));
    const item = rakit(KONTEKS[r.pick(Object.keys(KONTEKS))], cfg.tingkat, ids, r.sample(NAMA_BADGES, n), kendala);
    const an = analisis(item);
    if (!an || !cfg.syarat(an.d)) return null;
    return { item, jawaban: rank };
  };
}

// ───────────────────────── Family ─────────────────────────

export const badgesShlTiba = family({
  id: 'BDG-SHL-TIBA', nama: 'Urutan kedatangan (Arrival Times)', label: 'SHL',
  sumber: 'Tahap 1 js/badges-shl.js acuan 1 · tangkapan layar SHL "Arrival Times" (611/612)',
  ringkas: 'Enam orang. Satu orang tidak di urutan genap (atau tidak di urutan ganjil), satu orang di paruh pertama (atau paruh kedua), tepat dua orang di antara dua orang tertentu, dan tiga relasi lebih awal/lambat. Pelaku setiap petunjuk dan letak kartu dicari ulang per soal.',
  bangun: bangunSHL(SHL_TIBA),
});

export const badgesShlKantor = family({
  id: 'BDG-SHL-KANTOR', nama: 'Kedatangan di kantor + satu relasi (Office Arrival Times)', label: 'SHL',
  sumber: 'Tahap 1 js/badges-shl.js acuan 2 · tangkapan layar SHL "Office Arrival Times" (613); sumber punya tiga urutan, ditambah satu relasi',
  ringkas: 'Enam orang. Dua pasangan "tepat dua orang di antara", dua relasi lebih awal/lambat, satu "lebih awal dengan sedikitnya satu orang di antara", ditambah satu relasi yang membuat urutan tunggal. Setiap petunjuk wajib berfungsi.',
  bangun: bangunSHL(SHL_KANTOR),
});

export const badgesShlGaji = family({
  id: 'BDG-SHL-GAJI', nama: 'Peringkat gaji: tiga teratas, kondisi jika, selisih peringkat', label: 'SHL',
  sumber: 'Tahap 1 js/badges-shl.js acuan 0 · dua tangkapan layar SHL pola gaji (README Tahap 1, Badges / Logical Ranking)',
  ringkas: 'Enam orang. Dua orang di tiga peringkat teratas (atau terbawah), dua relasi, satu kondisi "jika … berada di peringkat ke-4/ke-3", tepat satu orang di antara dua orang, dan perbandingan selisih peringkat.',
  maksPercobaan: 600,
  bangun: bangunSHL(SHL_GAJI),
});

export const badgesDasar = family({
  id: 'BDG-V-DASAR', nama: 'Pembangun acak — dasar (6 orang, petunjuk langsung)', label: 'VARIASI',
  sumber: 'Pengembangan dari pustaka petunjuk templat SHL Tahap 1; tidak diklaim pernah keluar di SHL',
  ringkas: 'Enam orang; petunjuk langsung (lebih atas/bawah, bersebelahan langsung atau berselang satu/dua, posisi tertentu, bukan pertama/terakhir, dua/tiga posisi teratas/terbawah). Selesai dengan satu petunjuk per langkah, tanpa gabungan atau uji kemungkinan.',
  bangun: bangunVariasi({
    tingkat: 'dasar',
    bobot: { atas: 4, 'atas-tepat': 2, tetap: 0.6, bukan: 1, 'atas-k': 1, 'bawah-k': 1 },
    petunjuk: [5, 8], minJenis: 2, minTakLangsung: 0, maksTetap: 1, maksKosong: 2,
    syarat: (d) => !d.perluLanjut,
  }),
});

export const badgesMenengah = family({
  id: 'BDG-V-MENENGAH', nama: 'Pembangun acak — menengah (6 orang)', label: 'VARIASI',
  sumber: 'Pengembangan dari pustaka petunjuk templat SHL Tahap 1; tidak diklaim pernah keluar di SHL',
  ringkas: 'Enam orang; seluruh pustaka petunjuk kecuali kondisi jika dan perbandingan selisih, minimal dua petunjuk tak langsung (jarak tanpa arah, sedikitnya k di antara, ganjil/genap, di antara dua orang, k teratas/terbawah). Selesai dengan satu petunjuk per langkah.',
  bangun: bangunVariasi({
    tingkat: 'menengah',
    bobot: { atas: 3, 'atas-tepat': 1.5, 'atas-min': 1, 'jarak-tepat': 1.5, 'jarak-min': 1, 'di-antara': 1, tetap: 0.4, bukan: 0.7, 'atas-k': 1, 'bawah-k': 1, paritas: 1 },
    petunjuk: [5, 9], minJenis: 3, minTakLangsung: 2, maksTetap: 1, maksKosong: 2,
    syarat: (d) => !d.perluLanjut,
  }),
});

export const badgesMenantang = family({
  id: 'BDG-V-MENANTANG', nama: 'Pembangun acak — menantang (6 orang, kendala tak langsung)', label: 'VARIASI',
  sumber: 'Pengembangan dari pustaka petunjuk templat SHL Tahap 1; tidak diklaim pernah keluar di SHL',
  ringkas: `Enam orang, tanpa posisi tetap; minimal empat jenis dan tiga petunjuk tak langsung. Satu petunjuk per langkah saja tidak cukup: perlu menggabungkan dua petunjuk atau uji kemungkinan (paling banyak ${BATAS_BAHAS.uji} uji, ${BATAS_BAHAS.langkah} langkah, ${BATAS_BAHAS.karakter} karakter pembahasan).`,
  maksPercobaan: 600,
  bangun: bangunVariasi({
    tingkat: 'menantang',
    bobot: { atas: 2, 'atas-tepat': 1, 'atas-min': 1.2, 'jarak-tepat': 2, 'jarak-min': 1.2, 'di-antara': 1.2, bukan: 0.4, 'atas-k': 0.8, 'bawah-k': 0.8, paritas: 1.2 },
    petunjuk: [5, 10], minJenis: 4, minTakLangsung: 3, maksTetap: 0, maksKosong: 2,
    syarat: (d) => d.perluLanjut,
  }),
});

export const BADGES_FAMILY_DAFTAR = [badgesShlTiba, badgesShlKantor, badgesShlGaji, badgesDasar, badgesMenengah, badgesMenantang];
