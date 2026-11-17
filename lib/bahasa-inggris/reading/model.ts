import { HURUF, periksaFormatPg, type Opsi, type PilihanGandaItem, type Tingkat } from '../model';

// Model Reading Comprehension (4 opsi A–D). Tidak ada blueprint resmi; bentuk mengikuti riset OJK §5.2.3 (satu bacaan
// ±4 paragraf, empat soal: tujuan, inferensi sikap, makna kalimat, judul), gaya SHL (bacaan ±100 kata, satu pertanyaan
// detail), dan arsip PCS/PCT 2025 (fakta eksplisit, hubungan antaride, detail tersirat, solusi/tindakan). Usulan aturan:
// bahan/Blueprint Reading Comprehension (usulan).md.
//
// Bank ditulis manual. Setiap opsi membawa ANOTASI hubungannya dengan bacaan: didukung (dengan kalimat bukti dan
// parafrase yang dicatat) atau jenis ketidaksesuaian (bertentangan, tidak disebut, terlalu luas/sempit, detail keliru,
// salah tafsir). Solver tidak membaca kunci: ia memecah ulang bacaan yang tampil menjadi kalimat, lalu memverifikasi
// setiap anotasi terhadap teks itu. Opsi yang anotasinya tidak dapat dibuktikan berstatus 'ragu' dan dianggap calon
// jawaban, sehingga soal berkunci ganda/kosong ditolak engine.

export type TipeSoal =
  | 'gagasan-utama' | 'judul' | 'tujuan' | 'detail' | 'inferensi' | 'makna-kalimat' | 'hubungan' | 'penerapan'
  | 'not' | 'sikap-penulis' | 'kosakata';

export type JenisOpsi =
  | 'didukung' | 'bertentangan' | 'tidak-disebut' | 'terlalu-luas' | 'terlalu-sempit' | 'detail-salah' | 'salah-tafsir';

export const NAMA_TIPE: Record<TipeSoal, string> = {
  'gagasan-utama': 'Gagasan utama/tujuan bacaan',
  judul: 'Judul terbaik',
  tujuan: 'Tujuan yang dinyatakan bacaan',
  detail: 'Detail eksplisit',
  inferensi: 'Inferensi',
  'makna-kalimat': 'Makna kalimat dalam konteks',
  hubungan: 'Hubungan antaride (sebab-akibat/urutan)',
  penerapan: 'Penerapan solusi/tindakan',
  not: 'NOT/EXCEPT (informasi yang tidak disebut)',
  'sikap-penulis': 'Sikap/nada penulis',
  kosakata: 'Kosakata dalam konteks',
};

const KONSEP: Record<TipeSoal, string> = {
  'gagasan-utama': 'jawaban harus mencakup gagasan seluruh paragraf, tidak hanya satu bagian dan tidak melampaui isi bacaan.',
  judul: 'judul terbaik merangkum seluruh bacaan; judul yang hanya memuat satu paragraf terlalu sempit, sedangkan judul umum yang melampaui bacaan terlalu luas.',
  tujuan: 'tujuan dinyatakan langsung oleh bacaan, biasanya dengan penanda seperti goal, aim, to, atau in order to.',
  detail: 'jawaban dinyatakan langsung dalam bacaan, biasanya dengan kata lain (parafrase).',
  inferensi: 'jawaban tidak tertulis persis, tetapi merupakan kesimpulan yang langsung didukung kalimat bacaan tanpa asumsi tambahan.',
  'makna-kalimat': 'makna kalimat ditentukan oleh hubungan klausa utama dan klausa pendukungnya; parafrase yang benar mempertahankan hubungan itu.',
  hubungan: 'pertanyaan menanyakan hubungan antaride: sebab-akibat, urutan langkah, atau masalah dan tanggapannya.',
  penerapan: 'tindakan yang dipilih harus sejalan dengan masalah dan solusi yang dijelaskan bacaan.',
  not: 'tiga opsi disebut dalam bacaan; jawabannya satu-satunya opsi yang tidak disebut atau bertentangan dengan bacaan.',
  'sikap-penulis': 'sikap penulis dibaca dari kata bernilai dan penyeimbang (however, although, promising) di beberapa bagian bacaan.',
  kosakata: 'arti kata ditentukan oleh kalimatnya, bukan oleh arti yang paling umum.',
};

const CARA_CEPAT: Record<TipeSoal, string> = {
  'gagasan-utama': 'Baca kalimat pertama setiap paragraf dan kalimat penutup, rumuskan satu gagasan yang menyatukan semuanya, lalu coret opsi yang hanya memuat satu paragraf atau melampaui bacaan.',
  judul: 'Uji setiap judul: apakah ia cocok untuk semua paragraf? Coret judul yang hanya cocok untuk satu paragraf, yang terlalu umum, dan yang berlawanan dengan nada bacaan.',
  tujuan: 'Cari penanda tujuan (goal, aim, purpose, to, in order to) di sekitar kata kunci pertanyaan, lalu pilih parafrasenya.',
  detail: 'Pindai bacaan untuk kata kunci pertanyaan, baca utuh kalimat tempat kata itu muncul, lalu pilih opsi yang menyatakan isi kalimat tersebut dengan kata lain.',
  inferensi: 'Temukan kalimat yang paling dekat dengan pertanyaan, lalu pilih kesimpulan yang paling sedikit memerlukan asumsi; waspadai kata mutlak seperti always, never, atau completely.',
  'makna-kalimat': 'Pisahkan kalimat menjadi klausa utama dan klausa pendukung (although, because, so), pahami hubungan keduanya, lalu pilih parafrase yang mempertahankan hubungan itu.',
  hubungan: 'Tandai penanda sebab-akibat dan urutan (because, as a result, led to, first, then, after) di bacaan, lalu ikuti rantainya sampai ke yang ditanyakan.',
  penerapan: 'Rumuskan masalah dan solusi yang diberikan bacaan dalam satu kalimat, lalu pilih tindakan yang menerapkan solusi itu.',
  not: 'Cocokkan opsi satu per satu dengan bacaan dan coret yang disebut; opsi yang tersisa adalah jawabannya.',
  'sikap-penulis': 'Kumpulkan kata bernilai di beberapa bagian bacaan, lalu cocokkan setiap bagian opsi (concerned … but hopeful) dengan bacaan; opsi yang seimbang pun bisa salah arah.',
  kosakata: 'Ganti kata sasaran dengan setiap opsi di kalimat aslinya; pilih yang mempertahankan makna kalimat.',
};

export const NAMA_JENIS: Record<JenisOpsi, string> = {
  didukung: 'Disebut dalam bacaan',
  bertentangan: 'Bertentangan dengan bacaan',
  'tidak-disebut': 'Tidak disebut dalam bacaan',
  'terlalu-luas': 'Terlalu luas',
  'terlalu-sempit': 'Terlalu sempit',
  'detail-salah': 'Detail keliru',
  'salah-tafsir': 'Salah tafsir',
};

/** Tipe yang kuncinya harus merangkum beberapa paragraf. */
const TIPE_CAKUPAN: TipeSoal[] = ['gagasan-utama', 'judul'];

/**
 * Tipe yang pasangan opsi–bacaannya berupa dukungan, bukan kesetaraan makna (judul "Gains" didukung oleh "fell by about a
 * third"; inferensi "less likely to run smoothly" didukung oleh "frequently interrupted"). Pembahasan memakai "←", bukan "=".
 */
const TIPE_DUKUNGAN: TipeSoal[] = [...TIPE_CAKUPAN, 'sikap-penulis', 'inferensi', 'penerapan'];

/** Daftar parafrase untuk pembahasan: "=" hanya untuk parafrase setara, "←" untuk unsur opsi dan kalimat pendukungnya. */
export function teksPadanan(tipe: TipeSoal, pasangan: [string, string][]): string {
  return TIPE_DUKUNGAN.includes(tipe)
    ? `Unsur opsi dan kalimat pendukungnya: ${pasangan.map(([o, s]) => `"${o}" ← "${s}"`).join('; ')}.`
    : `Padanan opsi–bacaan: ${pasangan.map(([o, s]) => `"${o}" = "${s}"`).join('; ')}.`;
}

// ───────────────────────────── petunjuk bentuk opsi (pola QC P1–P3) ─────────────────────────────
// Pemeriksaan ini simetris agar tidak menjadi petunjuk baru: penanda yang dilarang berlaku untuk kunci DAN pengecoh, dan
// ciri bentuk (titik dua, bentuk seimbang) tidak boleh dimiliki atau tidak dimiliki oleh tepat satu opsi, dan kata pembuka
// bingkai harus dipakai kunci dan pengecoh sekaligus.

/** Penanda global/mutlak yang dulu menumpuk di pengecoh (P1, P3, S6); dilarang di semua opsi. */
export const PENANDA_GLOBAL = /\b(world|worldwide|globally|global|everywhere|altogether|universally|always|never|completely|entirely|totally|forever)\b/i;

/**
 * Penanda opsi BERPAGAR (dua sisi, bersyarat, atau takaran): penyeimbang (but, though, while), pasangan untung–rugi
 * (results and limits, costs and benefits, for and against, X and its Y), takaran (mostly, partly), rangkuman dua bagian
 * (… and what/how …), dan sikap seimbang (even-handed, mixed, cautious, concerned, hopeful). Daftar ini sengaja luas: ia
 * dipakai simulasi peserta "pilih opsi paling berpagar", sehingga yang dihitung adalah kesan dua sisi, bukan maknanya.
 */
const RE_BERPAGAR = [
  String.raw`\b(but|though|although|yet|whereas|while|despite|however|against|limits?|limited|gaps?|drawbacks?|downsides?|weakness(es)?|challenges?|trade-offs?|falls? short)\b`,
  String.raw`\b(mostly|partly|largely|partially|somewhat|both|balanced|even-handed|mixed|cautious(ly)?|hopeful|concerned|uncertain|unsure)\b`,
  String.raw`\b(pros and cons|for and against|two ways|two approaches|more than one|no single|rather than)\b`,
  String.raw`\b(results|gains|benefits|costs|promise|strengths|successes|risks) and\b|\band (its|their|what|how)\b|\bstands? in (its|their) way\b`,
];
export const BENTUK_SEIMBANG = new RegExp(RE_BERPAGAR.join('|'), 'i');

/** Banyaknya penanda berpagar pada teks (simulasi "pilih opsi paling berpagar" memakai jumlah, bukan hanya ada/tidak). */
export const skorBerpagar = (t: string) => (t.match(new RegExp(RE_BERPAGAR.join('|'), 'gi')) ?? []).length;
export const berpagar = (t: string) => BENTUK_SEIMBANG.test(t);

/** Kata tegas/mutlak yang dipakai peserta untuk mencoret opsi ("buang yang bermutlak"). */
export const PENANDA_MUTLAK = /\b(all|every|only|solely|cannot|can't|no longer|must|sure|certain(ly)?|convinced|proven?|solved?|replace[sd]?|replacement|impossible|none|nothing|no one|fully|wholly|guaranteed?|strongly|firmly|clearly|plainly|undoubtedly|definitely)\b/i;

/** Tipe yang opsinya berupa rangkuman/penilaian, tempat pola bentuk paling mudah dipelajari peserta. */
const TIPE_POLA: TipeSoal[] = ['judul', 'gagasan-utama', 'tujuan', 'sikap-penulis'];

/**
 * Soal global: kuncinya menilai atau merangkum bacaan atau menyatakan tujuannya (judul, gagasan utama/tujuan bacaan,
 * tujuan yang dinyatakan, sikap penulis). Uji buta putaran 3: dua soal global pada satu bacaan saling membenarkan (judul ↔
 * tujuan, sikap ↔ tujuan), sehingga setiap bacaan memuat paling banyak satu soal global.
 */
export const TIPE_GLOBAL: TipeSoal[] = ['judul', 'gagasan-utama', 'tujuan', 'sikap-penulis'];

/** Peluang benar (nilai harapan) peserta yang memilih opsi berskor tertinggi; seri ditebak acak di antara yang seri. */
export function peluangHeuristik(skor: number[], iKunci = 0): number {
  const maks = Math.max(...skor);
  const seri = skor.filter((s) => s === maks).length;
  return skor[iKunci] === maks ? 1 / seri : 0;
}

/**
 * Empat peserta tebak tanpa membaca untuk soal global: "pilih paling berpagar", "pilih terpanjang", "buang yang bermutlak
 * lalu pilih yang tersisa paling berpagar", dan "hindari yang berpagar" (peserta yang belajar dari koreksi berlebih
 * putaran 2, ketika bentuk "X but Y" selalu salah). Nilai = rata-rata peluang benar (opsi[0] = kunci).
 */
export function simulasiGlobal(soal: { opsi: { t: string }[] }[]): { berpagar: number; terpanjang: number; tanpaMutlak: number; hindariPagar: number } {
  const n = Math.max(1, soal.length);
  let a = 0, b = 0, c = 0, d = 0;
  for (const s of soal) {
    const t = s.opsi.map((o) => o.t);
    a += peluangHeuristik(t.map(skorBerpagar));
    b += peluangHeuristik(t.map((x) => x.length));
    const sisa = t.map((x) => !PENANDA_MUTLAK.test(x));
    const pakai = sisa.some(Boolean) ? sisa : t.map(() => true);
    c += peluangHeuristik(t.map((x, i) => (pakai[i] ? skorBerpagar(x) : -1)));
    d += peluangHeuristik(t.map((x) => -skorBerpagar(x)));
  }
  return { berpagar: a / n, terpanjang: b / n, tanpaMutlak: c / n, hindariPagar: d / n };
}

/** Kata pembuka yang bersifat bingkai (bukan isi): Why/How/What/The/A dan "To" + verb pelapor. */
const PEMBUKA_BINGKAI = new Set(['why', 'how', 'what', 'the', 'a', 'an', ...[
  'explain', 'describe', 'show', 'argue', 'prove', 'persuade', 'weigh', 'outline', 'compare', 'report', 'discuss', 'warn',
  'suggest', 'examine', 'propose', 'criticise', 'encourage', 'highlight', 'question', 'present', 'consider', 'review',
].map((v) => `to ${v}`)]);

export function pembuka(teks: string): string {
  const k = teks.trim().split(/\s+/).map((w) => w.toLowerCase().replace(/[^a-z'-]/g, ''));
  return k[0] === 'to' && k[1] ? `to ${k[1]}` : k[0] ?? '';
}

/**
 * Apakah tepat satu opsi berbeda dari tiga opsi lain menurut `ciri` (satu-satunya yang memilikinya atau satu-satunya yang
 * tidak). Aturan ini sengaja berlaku untuk opsi mana pun, bukan hanya kunci: bila hanya kunci yang dilarang menyendiri,
 * peserta dapat belajar bahwa opsi yang menyendiri pasti pengecoh.
 */
function adaOpsiMenyendiri(opsi: Opsi[], ciri: (t: string) => boolean): boolean {
  const n = opsi.filter((o) => ciri(o.teks)).length;
  return n === 1 || n === opsi.length - 1;
}

/** Bentuk soal bank yang dipakai pemeriksaan tingkat bank (tanpa bergantung pada family). */
interface SoalPola { id: string; tipe: TipeSoal; opsi: { t: string }[]; cermin?: [number, number][] }

/** Kemiripan kata isi dua opsi (indeks Jaccard atas stem kata isi). */
export function kemiripan(a: string, b: string): number {
  const x = kataIsi(a), y = kataIsi(b);
  const sama = [...x].filter((w) => y.has(w)).length;
  return sama / Math.max(1, x.size + y.size - sama);
}

/** Dua opsi yang kata isinya sebanyak ini sama dianggap kembar (satu kalimat dengan satu rincian diubah). */
export const AMBANG_KEMBAR = 0.5;

/** Tipe yang tidak diperiksa cermin: opsi NOT memang tiga parafrase bacaan, opsi kosakata hanya satu–tiga kata. */
const TANPA_CERMIN: TipeSoal[] = ['not', 'kosakata'];

/**
 * Pasangan cermin satu soal (indeks opsi, 0 = kunci): anotasi `cermin` di bank (pasangan berlawanan makna yang kata-katanya
 * berbeda, mis. "less serious" ↔ "worse") ditambah pasangan kembar leksikal yang terdeteksi otomatis.
 */
export function pasanganCermin(s: SoalPola): [number, number][] {
  const p: [number, number][] = (s.cermin ?? []).map(([a, b]) => (a < b ? [a, b] : [b, a]));
  for (let i = 0; i < s.opsi.length; i++) {
    for (let j = i + 1; j < s.opsi.length; j++) {
      if (!p.some(([a, b]) => a === i && b === j) && kemiripan(s.opsi[i].t, s.opsi[j].t) >= AMBANG_KEMBAR) p.push([i, j]);
    }
  }
  return p;
}

/**
 * Pemeriksaan pola tingkat bank (seluruh bacaan Reading digabung, karena peserta melihat semuanya): soal judul tidak
 * boleh didominasi kunci bertitik dua; kata pembuka bingkai kunci harus juga muncul di pengecoh tipe yang sama, dan
 * pembuka bingkai yang sering dipakai pengecoh harus juga dipakai kunci.
 */
export function periksaPolaBank(bacaan: { id: string; soal: SoalPola[] }[]): string[] {
  const m: string[] = [];
  const semua = bacaan.flatMap((b) => b.soal.map((s) => ({ ...s, id: `${b.id}/${s.id}` })));
  // Paling banyak satu soal global per bacaan (uji buta putaran 3: soal global satu bacaan saling membenarkan).
  for (const b of bacaan) {
    const g = b.soal.filter((s) => TIPE_GLOBAL.includes(s.tipe));
    if (g.length > 1) m.push(`${b.id}: ${g.length} soal global (${g.map((s) => s.id).join(', ')}); maks satu per bacaan`);
  }
  // Pasangan cermin: bila kunci punya kembaran/lawan di opsi, harus ada pasangan cermin lain di antara pengecoh, agar
  // peserta tidak cukup memilih salah satu dari dua opsi yang saling berlawanan.
  for (const s of semua) {
    if (TANPA_CERMIN.includes(s.tipe)) continue;
    const p = pasanganCermin(s);
    for (const [a, b] of s.cermin ?? []) if (a === b || [a, b].some((i) => i < 0 || i >= s.opsi.length)) m.push(`${s.id}: anotasi cermin [${a}, ${b}] tidak sah`);
    const kunci = p.filter(([a]) => a === 0);
    if (kunci.length && !p.some(([a, b]) => a !== 0 && b !== 0)) {
      m.push(`${s.id}: kunci berpasangan cermin dengan opsi ${kunci.map(([, b]) => b + 1).join(', ')} tanpa pasangan cermin lain di antara pengecoh`);
    }
  }
  const judul = semua.filter((s) => s.tipe === 'judul');
  if (judul.length) {
    const kunciKolon = judul.filter((s) => s.opsi[0].t.includes(':')).length;
    const pengecohKolon = judul.flatMap((s) => s.opsi.slice(1)).filter((o) => o.t.includes(':')).length;
    if (kunciKolon > judul.length / 2) m.push(`kunci judul bertitik dua ${kunciKolon}/${judul.length} (maks separuh)`);
    if (pengecohKolon < 2) m.push(`pengecoh judul bertitik dua hanya ${pengecohKolon} (min 2)`);
  }
  for (const tipe of TIPE_POLA) {
    const soal = semua.filter((s) => s.tipe === tipe);
    const hitung = (xs: string[]) => xs.reduce((acc, p) => acc.set(p, (acc.get(p) ?? 0) + 1), new Map<string, number>());
    const diKunci = hitung(soal.map((s) => pembuka(s.opsi[0].t)));
    const diPengecoh = hitung(soal.flatMap((s) => s.opsi.slice(1).map((o) => pembuka(o.t))));
    for (const s of soal) {
      const p = pembuka(s.opsi[0].t);
      if (PEMBUKA_BINGKAI.has(p) && !diPengecoh.get(p)) m.push(`${s.id}: pembuka kunci "${p}" tidak pernah dipakai pengecoh tipe ${tipe}`);
    }
    for (const [p, n] of diPengecoh) if (PEMBUKA_BINGKAI.has(p) && n >= 3 && !diKunci.get(p)) m.push(`pembuka "${p}" dipakai ${n} pengecoh tipe ${tipe} tetapi tidak pernah dipakai kunci`);
  }
  // Soal global (uji buta putaran 2: 17/17 tertebak dari bentuk; putaran 3: bentuk "X but Y" selalu salah pada judul):
  // bentuk berpagar harus menjadi kunci pada sebagian soal (25–60%) dan pengecoh pada sebagian lain, setiap soal global
  // memuat pengecoh berpagar, dan tiga peserta tebak tanpa membaca tidak boleh melampaui 40%.
  const global = semua.filter((s) => TIPE_GLOBAL.includes(s.tipe));
  if (global.length) {
    const kunciPagar = global.filter((s) => berpagar(s.opsi[0].t)).length;
    const pengecoh = global.flatMap((s) => s.opsi.slice(1));
    const pengecohPagar = pengecoh.filter((o) => berpagar(o.t)).length;
    if (kunciPagar > 0.6 * global.length) m.push(`kunci soal global berpagar ${kunciPagar}/${global.length} (maks 60%)`);
    if (kunciPagar < 0.25 * global.length) m.push(`kunci soal global berpagar hanya ${kunciPagar}/${global.length} (min 25%): bentuk berpagar menjadi tanda pengecoh`);
    if (pengecohPagar < 0.25 * pengecoh.length) m.push(`pengecoh soal global berpagar ${pengecohPagar}/${pengecoh.length} (min 25%)`);
    for (const s of global) if (!s.opsi.slice(1).some((o) => berpagar(o.t))) m.push(`${s.id}: soal global tanpa pengecoh berpagar`);
    const sim = simulasiGlobal(global);
    for (const [nama, p] of Object.entries(sim)) if (p > 0.4) m.push(`peserta tebak "${nama}" benar ${Math.round(100 * p)}% pada soal global (maks 40%)`);
  }
  // Tanda titik akhir opsi seragam di dalam satu bacaan (satu aturan per bacaan, berlaku untuk semua tipe soalnya).
  for (const b of bacaan) {
    const titik = new Set(b.soal.flatMap((s) => s.opsi.map((o) => /[.?!]$/.test(o.t.trim()))));
    if (titik.size > 1) m.push(`${b.id}: tanda titik akhir opsi tidak seragam di dalam bacaan`);
  }
  return m;
}

// ───────────────────────────── bentuk bank (ditulis manual) ─────────────────────────────

export interface OpsiBank {
  /** Teks opsi. */
  t: string;
  j: JenisOpsi;
  /** Kutipan bukti: potongan persis dari SATU kalimat bacaan (harus unik di bacaan). */
  b?: string[];
  /** Parafrase yang dicatat: [frasa di opsi, frasa di kalimat bukti]. Wajib untuk opsi `didukung`. */
  f?: [string, string][];
  /** Alasan (bahasa Indonesia): mengapa opsi benar, atau mengapa opsi salah menurut jenisnya. */
  a: string;
}

export interface SoalBank {
  id: string;
  tipe: TipeSoal;
  tingkat: Tingkat;
  tanya: string;
  /** makna-kalimat: kutipan unik dari kalimat yang ditanyakan; seluruh kalimat ditampilkan miring. */
  kalimat?: string;
  /** kosakata: kata sasaran (muncul di pertanyaan dalam tanda kutip dan di kalimat bukti kunci). */
  sasaran?: string;
  /** opsi[0] = kunci; tiga sisanya pengecoh. Pada soal NOT, kunci = satu-satunya opsi yang tidak didukung. */
  opsi: [OpsiBank, OpsiBank, OpsiBank, OpsiBank];
  /**
   * Pasangan opsi yang saling berlawanan makna (indeks 0–3, 0 = kunci) tetapi kata-katanya berbeda sehingga tidak
   * terdeteksi sebagai kembar leksikal. Bila kunci termasuk pasangan cermin, harus ada pasangan cermin lain di antara
   * pengecoh (periksaPolaBank).
   */
  cermin?: [number, number][];
  cepat?: string;
}

export interface BacaanBank {
  id: string;
  /** Nama internal bacaan (tidak ditampilkan agar soal judul terbaik tetap sah). */
  judul: string;
  konteks: string;
  paragraf: string[];
  soal: SoalBank[];
}

// ───────────────────────────── data soal (dibawa item) ─────────────────────────────

/** Indeks paragraf dan kalimat (mulai 0) + kutipan persis dari kalimat itu. */
export interface Bukti { p: number; k: number; kutipan: string }

export interface AnotasiOpsi {
  teks: string;
  jenis: JenisOpsi;
  bukti: Bukti[];
  parafrase: [string, string][];
  alasan: string;
}

export type Format = 'panjang' | 'pendek';

export interface DataReading {
  bacaan: string;
  judulBacaan: string;
  soal: string;
  /** Nomor soal di bacaannya (soal satu bacaan ditampilkan berurutan). */
  urutan: number;
  jumlahSoal: number;
  format: Format;
  tipe: TipeSoal;
  polaritas: 'positif' | 'negatif';
  sasaran?: string;
  /** Sejajar dengan item.opsi (indeks i ↔ label HURUF[i]). */
  anotasi: AnotasiOpsi[];
  caraCepat: string;
}

export type ItemReading = PilihanGandaItem<DataReading>;

export const INSTRUKSI = 'Read the following passage and answer the question.';

export const BATAS_FORMAT: Record<Format, { kata: [number, number]; paragraf: [number, number] }> = {
  panjang: { kata: [180, 320], paragraf: [3, 4] },
  pendek: { kata: [80, 130], paragraf: [1, 1] },
};

// ───────────────────────────── utilitas teks ─────────────────────────────

/** Pecah paragraf menjadi kalimat: titik/tanya/seru diikuti spasi dan huruf kapital atau angka. */
export function pecahKalimat(paragraf: string): string[] {
  return paragraf.trim().split(/(?<=[.!?]["”’']?)\s+(?=["“‘']?[A-Z0-9])/).map((s) => s.trim()).filter(Boolean);
}

export const kecil = (s: string) => s.toLowerCase().replace(/[’‘]/g, "'");

export function token(s: string): string[] {
  return kecil(s).replace(/[^a-z0-9' ]+/g, ' ').replace(/'s\b/g, '').replace(/'/g, '').split(/\s+/).filter(Boolean);
}

const STOP = new Set(`a an the and or but if of to in on at by for with from as into onto over under about than then that this these those
it its they them their there here is are was were be been being has have had do does did done will would can could may might must
should shall not no nor so such very more most less least also only just even still yet all any each every some many much few
one two own other others another which who whom whose what when where why how while because although though after before during
until since both either neither whether we our you your he she his her i me my us up out off too again further once same between
through against among within without per via rather already often now new well like make made get got way ways thing things lot`.split(/\s+/));

/** Stem kasar (dipakai konsisten di semua pembanding): jamak, -ed, -ing, -e akhir, -y → -i. */
export function stem(w: string): string {
  let s = w;
  if (s.length >= 5 && s.endsWith('ies')) s = s.slice(0, -3) + 'i';
  else if (s.length >= 6 && s.endsWith('ing')) s = s.slice(0, -3);
  else if (s.length >= 5 && s.endsWith('ed')) s = s.slice(0, -2);
  else if (s.length >= 5 && s.endsWith('es')) s = s.slice(0, -2);
  else if (s.length >= 4 && s.endsWith('s') && !s.endsWith('ss')) s = s.slice(0, -1);
  if (s.length >= 5 && s.endsWith('e')) s = s.slice(0, -1);
  if (s.length >= 4 && s.endsWith('y')) s = s.slice(0, -1) + 'i';
  return s;
}

/** Kata isi (tanpa kata fungsi, panjang ≥ 3 atau angka), dalam bentuk stem. */
export function kataIsi(s: string): Set<string> {
  return new Set(token(s).filter((w) => (w.length >= 3 || /\d/.test(w)) && !STOP.has(w)).map(stem));
}

const bagianDari = (a: Set<string>, b: Set<string>) => a.size > 0 && [...a].every((x) => b.has(x));
const irisan = (a: Set<string>, b: Set<string>) => [...a].filter((x) => b.has(x)).length;

/** Frasa ≥ n kata di `teks` yang juga muncul berurutan di salah satu kalimat bacaan. */
export function salinFrasa(teks: string, kalimat: string[], n = 4): string | null {
  const t = token(teks);
  const sumber = kalimat.map((k) => ` ${token(k).join(' ')} `);
  for (let i = 0; i + n <= t.length; i++) {
    const g = t.slice(i, i + n).join(' ');
    if (sumber.some((s) => s.includes(` ${g} `))) return g;
  }
  return null;
}

export const jumlahKata = (paragraf: string[]) => paragraf.join(' ').split(/\s+/).filter(Boolean).length;

const memuatKata = (kalimat: string, kata: string) => new RegExp(`\\b${kata.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(kalimat);

// ───────────────────────────── solver: verifikasi anotasi ─────────────────────────────

export type Status = 'ya' | 'tidak' | 'ragu';
export interface Nilai { status: Status; alasan: string }

/**
 * Status satu opsi terhadap bacaan YANG TAMPIL (bukan bank): 'ya' = terbukti didukung bacaan; 'tidak' = terbukti tidak
 * didukung (jenis ketidaksesuaiannya dapat diverifikasi); 'ragu' = klaim ketidaksesuaian tidak dapat dibuktikan.
 */
export function nilaiOpsi(item: ItemReading, an: AnotasiOpsi | undefined): Nilai {
  if (!an) return { status: 'ragu', alasan: 'opsi tanpa anotasi' };
  const d = item.data;
  const kal = (item.bacaan?.paragraf ?? []).map(pecahKalimat);
  const semua = kal.flat();
  const kalimatBukti = an.bukti.map((b) => kal[b.p]?.[b.k]);
  const buktiAda = an.bukti.length > 0 && an.bukti.every((b, i) => kalimatBukti[i] !== undefined && kalimatBukti[i]!.includes(b.kutipan));
  const gabung = kataIsi(kalimatBukti.filter(Boolean).join(' '));
  const isi = kataIsi(an.teks);
  const paragrafBukti = new Set(an.bukti.map((b) => b.p)).size;

  switch (an.jenis) {
    case 'didukung': {
      if (!buktiAda) return { status: 'tidak', alasan: 'kalimat bukti tidak ditemukan di bacaan' };
      const teks = kecil(an.teks);
      const parafraseOk = an.parafrase.length > 0 && an.parafrase.every(([o, s]) => teks.includes(kecil(o)) && kalimatBukti.some((k) => kecil(k!).includes(kecil(s))));
      if (!parafraseOk) return { status: 'tidak', alasan: 'parafrase tidak cocok dengan opsi/kalimat bukti' };
      if (TIPE_CAKUPAN.includes(d.tipe)) {
        const butuh = Math.max(2, Math.ceil(kal.length / 2));
        if (paragrafBukti < butuh) return { status: 'tidak', alasan: `bukti hanya mencakup ${paragrafBukti} paragraf (butuh ${butuh})` };
      }
      if (d.tipe === 'sikap-penulis' && an.bukti.length < 2) return { status: 'tidak', alasan: 'sikap penulis butuh sedikitnya dua kalimat bukti' };
      if (d.tipe === 'kosakata') {
        if (!d.sasaran || !kalimatBukti.some((k) => memuatKata(k!, d.sasaran!))) return { status: 'tidak', alasan: 'kata sasaran tidak ada di kalimat bukti' };
        if (kecil(an.teks) === kecil(d.sasaran)) return { status: 'tidak', alasan: 'opsi sama dengan kata sasaran' };
      }
      return { status: 'ya', alasan: 'didukung kalimat bukti dan parafrase' };
    }
    case 'tidak-disebut':
    case 'terlalu-luas': {
      const sama = semua.find((k) => bagianDari(isi, kataIsi(k)));
      return sama ? { status: 'ragu', alasan: `semua kata isi opsi ada di satu kalimat bacaan: "${sama}"` } : { status: 'tidak', alasan: 'tidak ada kalimat bacaan yang memuat isi opsi' };
    }
    case 'bertentangan':
      if (!buktiAda) return { status: 'ragu', alasan: 'kalimat yang dipertentangkan tidak ditemukan' };
      return irisan(isi, gabung) ? { status: 'tidak', alasan: 'bertentangan dengan kalimat bukti' } : { status: 'ragu', alasan: 'opsi tidak berkaitan dengan kalimat yang dipertentangkan' };
    case 'detail-salah':
      if (!buktiAda) return { status: 'ragu', alasan: 'kalimat sumber detail tidak ditemukan' };
      if (!irisan(isi, gabung)) return { status: 'ragu', alasan: 'opsi tidak berkaitan dengan kalimat sumber detail' };
      return bagianDari(isi, gabung) ? { status: 'ragu', alasan: 'semua kata isi opsi ada di kalimat sumber (detail tidak berubah)' } : { status: 'tidak', alasan: 'detail diubah dari kalimat sumber' };
    case 'terlalu-sempit':
      if (!TIPE_CAKUPAN.includes(d.tipe)) return { status: 'ragu', alasan: 'jenis terlalu sempit hanya untuk gagasan utama/judul' };
      if (!buktiAda || paragrafBukti !== 1) return { status: 'ragu', alasan: 'opsi sempit harus bersumber dari tepat satu paragraf' };
      return irisan(isi, gabung) ? { status: 'tidak', alasan: 'hanya mencakup satu paragraf' } : { status: 'ragu', alasan: 'opsi tidak berkaitan dengan paragraf sumbernya' };
    case 'salah-tafsir':
      if (!buktiAda) return { status: 'ragu', alasan: 'kalimat yang disalahtafsirkan tidak ditemukan' };
      if (d.tipe === 'kosakata' && d.sasaran && kecil(an.teks) === kecil(d.sasaran)) return { status: 'ragu', alasan: 'opsi sama dengan kata sasaran' };
      return { status: 'tidak', alasan: 'menafsirkan kalimat bukti secara keliru' };
  }
}

/** Anotasi untuk opsi tampil dicari lewat teksnya (bukan lewat posisi), agar opsi yang tertukar terdeteksi. */
export const anotasiUntuk = (item: ItemReading, o: Opsi) => item.data.anotasi.find((a) => a.teks === o.teks);

/** Solver: soal positif → opsi yang terbukti didukung (atau ragu); soal NOT → opsi yang tidak terbukti didukung. */
export function pecahkanReading(item: ItemReading): string[] {
  return item.opsi
    .filter((o) => {
      const s = nilaiOpsi(item, anotasiUntuk(item, o)).status;
      return item.data.polaritas === 'positif' ? s !== 'tidak' : s !== 'ya';
    })
    .map((o) => o.label);
}

// ───────────────────────────── pemeriksaan mutu ─────────────────────────────

export function periksaReading(item: ItemReading, kunci: string): string[] {
  const m = periksaFormatPg(item);
  const d = item.data;
  const paragraf = item.bacaan?.paragraf ?? [];
  const kal = paragraf.map(pecahKalimat);
  const semua = kal.flat();
  const batas = BATAS_FORMAT[d.format];
  if (item.opsi.length !== 4) m.push('opsi bukan empat');
  if (d.anotasi.length !== item.opsi.length) m.push('anotasi tidak sejajar dengan opsi');
  item.opsi.forEach((o, i) => { if (d.anotasi[i]?.teks !== o.teks) m.push(`anotasi opsi ${o.label} tidak cocok dengan teksnya`); });
  const n = jumlahKata(paragraf);
  if (n < batas.kata[0] || n > batas.kata[1]) m.push(`bacaan ${n} kata di luar ${batas.kata[0]}–${batas.kata[1]}`);
  if (paragraf.length < batas.paragraf[0] || paragraf.length > batas.paragraf[1]) m.push(`bacaan ${paragraf.length} paragraf di luar ${batas.paragraf.join('–')}`);
  if (semua.some((k) => k.split(/\s+/).length < 4)) m.push('ada kalimat bacaan kurang dari empat kata (pemecahan kalimat meragukan)');
  if (item.instruksi !== INSTRUKSI) m.push('instruksi tidak seragam');
  if (!item.pertanyaan?.trim()) m.push('pertanyaan kosong');

  // Status setiap opsi harus pasti dan sesuai perannya.
  const k = item.opsi.find((o) => o.label === kunci);
  if (!k) return [...m, 'label kunci tidak ada'];
  for (const o of item.opsi) {
    const an = anotasiUntuk(item, o);
    const nilai = nilaiOpsi(item, an);
    if (nilai.status === 'ragu') m.push(`opsi ${o.label} tidak terverifikasi: ${nilai.alasan}`);
    if (!an?.alasan.trim()) m.push(`opsi ${o.label} tanpa alasan`);
    if (an && an.jenis !== 'tidak-disebut' && an.jenis !== 'terlalu-luas' && !an.bukti.length) m.push(`opsi ${o.label} (${an.jenis}) tanpa kalimat bukti`);
    const benar = d.polaritas === 'positif' ? nilai.status === 'ya' : nilai.status === 'tidak';
    if ((o.label === kunci) !== benar) m.push(`peran opsi ${o.label} tidak sesuai statusnya (${nilai.alasan})`);
  }
  const anK = anotasiUntuk(item, k);
  if (d.polaritas === 'positif' && item.opsi.filter((o) => anotasiUntuk(item, o)?.jenis === 'didukung').length !== 1) m.push('soal positif harus punya tepat satu opsi didukung');
  if (d.polaritas === 'negatif') {
    if (!/\b(NOT|EXCEPT)\b/.test(item.pertanyaan ?? '')) m.push('soal NOT harus menulis NOT/EXCEPT dengan huruf kapital');
    if (item.opsi.filter((o) => anotasiUntuk(item, o)?.jenis === 'didukung').length !== 3) m.push('soal NOT harus punya tepat tiga opsi didukung');
  }

  // Petunjuk dari bentuk opsi: panjang mencolok, titik akhir tidak seragam, kunci satu-satunya yang menyalin bacaan.
  const panjang = item.opsi.map((o) => o.teks.length);
  const pk = k.teks.length;
  const lain = item.opsi.filter((o) => o.label !== kunci).map((o) => o.teks.length);
  if (pk > Math.max(...lain) && pk >= 1.2 * Math.max(...lain)) m.push('kunci terpanjang mencolok');
  if (Math.max(...panjang) > 2.5 * Math.min(...panjang)) m.push('panjang opsi tidak seimbang');
  const titik = item.opsi.map((o) => /[.?!]$/.test(o.teks.trim()));
  if (titik.some((t) => t !== titik[0])) m.push('tanda baca akhir opsi tidak seragam');
  if (d.polaritas === 'positif' && /\b(always|never|completely|entirely|totally)\b/i.test(k.teks)) m.push('kunci memakai kata mutlak');
  // Pola QC P1–P3 (simetris): penanda global/mutlak dilarang di semua opsi; titik dua dan bentuk seimbang tidak boleh
  // menjadi ciri yang memisahkan satu opsi (kunci atau pengecoh) dari tiga opsi lain.
  for (const o of item.opsi) {
    const g = o.teks.match(PENANDA_GLOBAL);
    if (g) m.push(`opsi ${o.label} memuat penanda global/mutlak "${g[0]}"`);
  }
  if (adaOpsiMenyendiri(item.opsi, (t) => t.includes(':'))) m.push('tepat satu opsi berbeda dalam pemakaian titik dua');
  if (TIPE_POLA.includes(d.tipe) && adaOpsiMenyendiri(item.opsi, (t) => BENTUK_SEIMBANG.test(t))) m.push('tepat satu opsi berbeda dalam bentuk seimbang (dua sisi)');
  const salinKunci = salinFrasa(k.teks, semua);
  if (salinKunci && item.opsi.every((o) => o.label === kunci || !salinFrasa(o.teks, semua))) m.push(`hanya kunci yang menyalin frasa bacaan ("${salinKunci}")`);

  // Ketentuan per tipe.
  const buktiK = anK?.bukti ?? [];
  const rujukan = item.pertanyaan?.match(/\bparagraph (\d)\b/);
  if (rujukan && !buktiK.some((b) => b.p === Number(rujukan[1]) - 1)) m.push(`pertanyaan merujuk paragraf ${rujukan[1]}, tetapi bukti kunci di paragraf lain`);
  if (d.tipe === 'makna-kalimat') {
    const s = item.stimulus.find((p) => p.gaya === 'miring')?.teks;
    if (!s || !semua.includes(s)) m.push('kalimat yang ditanyakan tidak ada di bacaan');
    if (s && !buktiK.some((b) => kal[b.p]?.[b.k] === s)) m.push('bukti kunci bukan kalimat yang ditanyakan');
  } else if (item.stimulus.length) m.push('stimulus hanya untuk soal makna kalimat');
  if (d.tipe === 'kosakata') {
    if (!d.sasaran || !item.pertanyaan?.includes(`"${d.sasaran}"`)) m.push('kata sasaran tidak dikutip di pertanyaan');
    if (!rujukan) m.push('soal kosakata harus menyebut paragrafnya');
    if (item.opsi.some((o) => o.teks.trim().split(/\s+/).length > 3)) m.push('opsi kosakata lebih dari tiga kata');
  }
  return m;
}

// ───────────────────────────── pembahasan ─────────────────────────────

const lokasi = (b: Bukti) => `paragraf ${b.p + 1}, kalimat ${b.k + 1}`;

export function bahasReading(item: ItemReading, kunci: string) {
  const d = item.data;
  const kal = (item.bacaan?.paragraf ?? []).map(pecahKalimat);
  const k = item.opsi.find((o) => o.label === kunci);
  const anK = k && anotasiUntuk(item, k);
  if (!k || !anK) return null;
  const polaritas = d.polaritas;
  // Bukti soal NOT: kalimat yang memuat ketiga opsi lain; bukti soal positif: kalimat pendukung kunci.
  const didukung = item.opsi.filter((o) => anotasiUntuk(item, o)?.jenis === 'didukung').map((o) => ({ o, an: anotasiUntuk(item, o)! }));
  const kataKunci = (polaritas === 'positif' ? anK.bukti : didukung.flatMap((x) => x.an.bukti)).map((b) => `"${b.kutipan}" (${lokasi(b)})`).join('; ');
  const alasan: string[] = [anK.alasan];
  if (polaritas === 'positif') {
    const kutip = TIPE_CAKUPAN.includes(d.tipe) || anK.bukti.length > 2;
    for (const b of anK.bukti) alasan.push(`Bukti ${lokasi(b)}: "${kutip ? b.kutipan : kal[b.p][b.k]}"`);
    alasan.push(teksPadanan(d.tipe, anK.parafrase));
  } else {
    alasan.push(`Ketiga opsi lain disebut dalam bacaan: ${didukung.map(({ o, an }) => `${o.label} (${an.bukti.map(lokasi).join(' dan ')})`).join(', ')}.`);
  }
  const opsiSalah: Record<string, string> = {};
  for (const o of item.opsi) {
    if (o.label === kunci) continue;
    const an = anotasiUntuk(item, o);
    if (!an) return null;
    const rujuk = an.bukti.length ? ` (${an.bukti.map((b) => `${lokasi(b)}: "${b.kutipan}"`).join('; ')})` : '';
    const para = an.jenis === 'didukung' ? ` ${teksPadanan(d.tipe, an.parafrase)}` : '';
    opsiSalah[o.label] = `${NAMA_JENIS[an.jenis]}. ${an.alasan}${rujuk}${para}`;
  }
  const k0 = KONSEP[d.tipe];
  return { konsep: `${NAMA_TIPE[d.tipe]}. ${k0.charAt(0).toUpperCase()}${k0.slice(1)}`, kataKunci, alasan, opsiSalah, caraCepat: d.caraCepat };
}

export const caraCepatBawaan = (t: TipeSoal) => CARA_CEPAT[t];
export { HURUF };
