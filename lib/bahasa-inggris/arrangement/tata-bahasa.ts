// Tata bahasa milik solver Sentence Arrangement (blueprint Bahasa Inggris bagian 6, 7, 10).
//
// Solver tidak mengetahui urutan kunci. Ia hanya menerima kelima fragmen beserta bacaan kelas kata tiap kata (anotasi di
// `item.data`, diambil dari leksikon), lalu memeriksa SETIAP urutan dengan tata bahasa bebas konteks di bawah melalui
// pengurai Earley. Urutan sah = seluruh rangkaian kata dapat diurai sebagai satu kalimat deklaratif lengkap.
//
// Arah kehati-hatian: tata bahasa sengaja longgar pada konstruksi yang sering menghasilkan urutan alternatif (keterangan
// PP di awal/akhir klausa, PP sebagai modifier noun, reduced relative, relative clause tanpa that, that-clause tanpa that,
// to-infinitive tujuan, adverb sebelum/sesudah verb). Kelonggaran hanya bisa membuat soal DITOLAK (dianggap berkunci
// ganda), tidak pernah meloloskan soal berkunci ganda. Batas makna ("makna wajar", blueprint bagian 6) hanya berupa dua
// kelas noun — h (orang/lembaga) dan n (selain itu) — untuk subjek dan objek verb/adjective/participle yang jelas memilih
// kelasnya ("asked" menuntut penanya manusia, "signed" menuntut dokumen, "explain" menuntut objek benda/gagasan), serta
// lisensi leksikal noun untuk PP+gerund, to-infinitive, dan PP "to". Fronting bertanda, inversi, dan elipsis tidak dipakai
// sebagai dasar penilaian (blueprint bagian 6).

export interface Token {
  /** Kata seperti tampil pada fragmen (kapitalisasi dipertahankan). */
  w: string;
  /** Bacaan kelas kata dari leksikon, mis. "N.p.n", "V.3s.h>np,np_inf/h", "P.for". */
  b: string[];
}

interface Bacaan { c: string; f: Set<string>; s: Set<string> }

export function uraiBacaan(kode: string): Bacaan {
  const [kiri, kanan] = kode.split('>');
  const [c, ...f] = kiri.split('.');
  return { c, f: new Set(f), s: new Set(kanan ? kanan.split(',') : []) };
}

type Kls = 'h' | 'n';
/** Terminal: kategori + fitur wajib + subkategorisasi + kelas subjek (kls) dan kelas objek (ok) yang harus cocok. */
interface Term { c: string; f?: string[]; s?: string; kls?: Kls; ok?: Kls; tanpa?: string[] }
type Sym = string | Term;
interface Aturan { kiri: string; kanan: Sym[] }

const NUM = ['s', 'p'] as const;
const KLS = ['h', 'n'] as const;

/** Preposisi yang dikenal tata bahasa (leksikon tidak boleh memakai preposisi di luar daftar ini). */
export const PREPOSISI = ['about', 'across', 'after', 'against', 'among', 'at', 'before', 'between', 'by', 'despite', 'during', 'following',
  'for', 'from', 'in', 'into', 'near', 'of', 'on', 'over', 'since', 'through', 'throughout', 'to', 'towards', 'under', 'until', 'with', 'within', 'without'] as const;
/** Kata tanya/penghubung noun clause yang dikenal. */
export const KATA_TANYA = ['whether', 'if', 'why', 'how', 'when', 'where', 'what', 'who', 'which'] as const;

/** Preposisi yang dapat membentuk keterangan bebas di awal kalimat (tanpa koma) bila objeknya noun phrase. */
const AWAL_NP = ['after', 'before', 'by', 'during', 'in', 'on', 'at', 'near', 'since', 'until', 'within', 'throughout', 'following', 'despite',
  'under', 'across', 'without', 'through', 'over', 'from', 'among', 'between'];
/** Preposisi + gerund yang dapat menjadi keterangan bebas (awal atau akhir klausa). */
const KET_GERUND = ['after', 'before', 'by', 'since', 'without', 'despite', 'through', 'in', 'on'];
/** PP pewatas noun yang dapat menerangkan noun kelas apa pun ("applicants with experience", "the office in the city"). */
const POST_SEMUA = ['of', 'with', 'from', 'in', 'on', 'at', 'near', 'for', 'without'];
/** PP pewatas yang hanya wajar untuk noun benda/gagasan/peristiwa ("details about", "the delay during"). */
const POST_BENDA = ['about', 'by', 'during', 'after', 'before', 'until', 'since', 'within', 'throughout', 'following', 'between', 'among',
  'into', 'over', 'towards', 'under', 'across', 'through', 'despite', 'against'];

/**
 * Sakelar audit (hanya untuk pemeriksaan manual kerangka; solver memakai tata bahasa bawaan):
 *  - `tanpaKelas`: matikan pembatas kelas subjek/objek h/n;
 *  - `tanpaLisensi`: semua noun menerima PP+gerund, to-infinitive, dan PP to; semua noun boleh menjadi pewatas; PP apa pun
 *    boleh menerangkan noun apa pun; adjective atributif boleh predikatif; semua preposisi (kecuali of) boleh menjadi
 *    keterangan bebas di awal/akhir klausa.
 */
export interface OpsiTataBahasa {
  tanpaKelas?: boolean;
  tanpaLisensi?: boolean;
}

function bangunAturan(op: OpsiTataBahasa): Aturan[] {
  const R: Aturan[] = [];
  const add = (kiri: string, ...kanan: Sym[]) => R.push({ kiri, kanan });
  const longgar = !!op.tanpaLisensi;
  const kls = (k: Kls): Kls | undefined => (op.tanpaKelas ? undefined : k);
  const V = (f: string, k: Kls, s?: string, ok?: Kls): Term => ({ c: 'V', f: [f], s, kls: kls(k), ok: ok && kls(ok) });
  const A = (k: Kls, s?: string): Term => ({ c: 'A', s, kls: kls(k), tanpa: longgar ? undefined : ['attr'] });
  const P = (p: string): Term => ({ c: 'P', f: [p] });
  const WH = (w: string): Term => ({ c: 'WH', f: [w] });
  const BE = (f: string): Term => ({ c: 'BE', f: [f] });
  const HAVE = (f: string): Term => ({ c: 'HAVE', f: [f] });
  const MOD: Term = { c: 'MOD' };
  const ADV: Term = { c: 'ADV' };
  const NOT: Term = { c: 'NOT' };
  const TO: Term = { c: 'TO' };
  const finV = { s: ['3s', 'past'], p: ['pl', 'past'] } as const;
  const finBE = { s: ['3s', 'pastS'], p: ['pl', 'pastP'] } as const;
  const finHAVE = { s: ['3s', 'past'], p: ['pl', 'past'] } as const;
  const BENTUK = ['base', 'pl', '3s', 'past', 'en', 'ing'] as const;
  const bukanOf = PREPOSISI.filter((p) => p !== 'of');
  const KET_NP = bukanOf;
  const KET_GER = longgar ? bukanOf : KET_GERUND;
  const AWAL = longgar ? bukanOf : AWAL_NP;
  const AWAL_GER = longgar ? bukanOf : KET_GERUND;
  const postUntuk = (k: Kls) => (longgar ? [...PREPOSISI] : k === 'h' ? POST_SEMUA : [...POST_SEMUA, ...POST_BENDA]);

  // ---- Kalimat dan klausa ----
  for (const n of NUM) for (const k of KLS) {
    add('S', `CL.${n}.${k}`);
    add('S', 'KETAWAL', `CL.${n}.${k}`);
    add('S', ADV, `CL.${n}.${k}`);
    add(`CL.${n}.${k}`, `SUBJ.${n}.${k}`, `VF.${n}.${k}`);
    add(`SUBJ.${n}.${k}`, `NP.${n}.${k}`);
    add('CLANY', `CL.${n}.${k}`);
  }
  add('SUBJ.s.n', 'NCL');
  add('SUBJ.s.n', 'GERP');
  for (const p of AWAL) add('KETAWAL', P(p), 'NPANY');
  for (const p of AWAL_GER) add('KETAWAL', P(p), 'GERP');

  // ---- Verb finit (agreement subjek) dan rangkaian auxiliary ----
  for (const n of NUM) for (const k of KLS) {
    const vf = `VF.${n}.${k}`;
    for (const f of finV[n]) add(vf, `VA.${f}.${k}`);
    for (const f of finBE[n]) add(vf, BE(f), `PRED.${k}`);
    for (const f of finHAVE[n]) add(vf, HAVE(f), `PERF.${k}`);
    add(vf, MOD, `BASE.${k}`);
    add(vf, ADV, vf);
  }
  for (const k of KLS) {
    add(`BASE.${k}`, `VA.base.${k}`);
    add(`BASE.${k}`, BE('base'), `PRED.${k}`);
    add(`BASE.${k}`, HAVE('base'), `PERF.${k}`);
    add(`BASE.${k}`, ADV, `BASE.${k}`);
    add(`BASE.${k}`, NOT, `BASE.${k}`);
    add(`PERF.${k}`, `VA.en.${k}`);
    add(`PERF.${k}`, BE('en'), `PRED.${k}`);
    add(`PERF.${k}`, ADV, `PERF.${k}`);
    add(`PERF.${k}`, NOT, `PERF.${k}`);
    // Predikat setelah be: adjective, passive, progressive, noun phrase, PP, infinitive, noun clause.
    const pr = `PRED.${k}`;
    add(pr, `AP.${k}`);
    add(pr, `PAS.${k}`);
    add(pr, `VA.ing.${k}`);
    add(pr, BE('ing'), `PAS.${k}`);
    add(pr, 'NPANY');
    for (const p of bukanOf) add(pr, `PP.${p}`);
    add(pr, 'INF');
    add(pr, 'NCL');
    add(pr, ADV, pr);
    add(pr, NOT, pr);
    add(pr, pr, 'KET');
  }

  // ---- Frasa verb aktif per bentuk dan subkategorisasi (objek dibatasi kelasnya bila leksikon menandai "/h" atau "/n") ----
  for (const f of BENTUK) for (const k of KLS) {
    const va = `VA.${f}.${k}`;
    add(va, V(f, k, '0'));
    add(va, V(f, k, 'inf'), 'INF');
    add(va, V(f, k, 'wh'), 'NCL');
    add(va, V(f, k, 'to_wh'), 'PP.to', 'NCL');
    add(va, V(f, k, 'ger'), 'GERP');
    add(va, V(f, k, 'that'), 'THATCL');
    add(va, V(f, k, 'to_that'), 'PP.to', 'THATCL');
    add(va, V(f, k, 'adj'), `AP.${k}`);
    for (const p of PREPOSISI) add(va, V(f, k, `pp:${p}`), `PP.${p}`);
    for (const c of KLS) {
      const o = `NPK.${c}`;
      add(va, V(f, k, 'np', c), o);
      add(va, V(f, k, 'np_np', c), o, 'NPANY');
      add(va, V(f, k, 'np_inf', c), o, 'INF');
      add(va, V(f, k, 'np_wh', c), o, 'NCL');
      for (const p of PREPOSISI) add(va, V(f, k, `np_pp:${p}`, c), o, `PP.${p}`);
    }
    add(va, va, 'KET');
    add(va, ADV, va);
  }
  // Keterangan akhir frasa verb: PP bebas, adverb, dan to-infinitive tujuan ("met to discuss the plan").
  for (const p of KET_NP) add('KET', P(p), 'NPANY');
  for (const p of KET_GER) add('KET', P(p), 'GERP');
  add('KET', ADV);
  add('KET', 'INF');

  // ---- Passive participle ----
  for (const k of KLS) {
    const ps = `PAS.${k}`;
    add(ps, V('pas', k, '0'));
    add(ps, V('pas', k, 'inf'), 'INF');
    add(ps, V('pas', k, 'wh'), 'NCL');
    add(ps, V('pas', k, 'that'), 'THATCL');
    add(ps, V('pas', k, 'np'), 'NPANY');
    for (const p of PREPOSISI) add(ps, V('pas', k, `pp:${p}`), `PP.${p}`);
    add(ps, ADV, ps);
    add(ps, ps, 'KET');
  }

  // ---- Adjective phrase predikatif dan adjective phrase berpelengkap (pewatas sesudah noun) ----
  for (const k of KLS) {
    const ap = `AP.${k}`;
    const apc = `APC.${k}`;
    add(ap, A(k));
    add(ap, apc);
    add(apc, A(k, 'inf'), 'INF');
    add(apc, A(k, 'wh'), 'NCL');
    add(apc, A(k, 'that'), 'THATCL');
    for (const p of PREPOSISI) add(apc, A(k, `pp:${p}`), `PP.${p}`);
    add(ap, ADV, ap);
    add(apc, ADV, apc);
  }

  // ---- Infinitive, gerund, PP, that-clause ----
  for (const k of KLS) add('INF', TO, `BASE.${k}`);
  for (const k of KLS) {
    add('GERP', `VA.ing.${k}`);
    add('GERP', BE('ing'), `PAS.${k}`);
    add('GERP', HAVE('ing'), `PERF.${k}`);
  }
  for (const p of PREPOSISI) {
    add(`PP.${p}`, P(p), 'NPANY');
    add(`PP.${p}`, P(p), 'GERP');
    add(`PP.${p}`, P(p), 'NCL');
  }
  add('THATCL', { c: 'COMP' }, 'CLANY');
  add('THATCL', 'CLANY');

  // ---- Noun clause ----
  for (const w of ['whether', 'if', 'why', 'how', 'when', 'where']) add('NCL', WH(w), 'CLANY');
  for (const w of ['whether', 'how', 'what', 'when', 'where', 'which', 'who']) add('NCL', WH(w), 'INF');
  add('NCL', WH('what'), 'CLG.n');
  add('NCL', WH('what'), 'VF.s.n');
  add('NCL', WH('who'), 'VF.s.h');
  add('NCL', WH('who'), 'VF.p.h');
  add('NCL', WH('who'), 'CLG.h');
  add('NCL', WH('how'), ADV, 'CLANY');
  for (const w of ['what', 'which']) for (const n of NUM) for (const k of KLS) {
    add('NCL', WH(w), `NOM.${n}.${k}`, `CLG.${k}`);
    add('NCL', WH(w), `NOM.${n}.${k}`, `VF.${n}.${k}`);
    add('NCL', WH(w), `NOM.${n}.${k}`, 'INF');
  }

  // ---- Noun phrase ----
  for (const c of KLS) { add(`NPK.${c}`, `NP.s.${c}`); add(`NPK.${c}`, `NP.p.${c}`); add('NPANY', `NPK.${c}`); }
  for (const n of NUM) for (const k of KLS) {
    const np = `NP.${n}.${k}`;
    const nom = `NOM.${n}.${k}`;
    add(np, { c: 'D', f: [n] }, nom);
    add(np, { c: 'D', f: ['x'] }, nom);
    add(np, 'GENP', nom);
    if (n === 'p') {
      // Jamak tanpa determiner; bacaan jamak collective noun (kol: "the council are") tidak boleh berdiri tanpa determiner.
      add(np, `NOMX.${k}`);
      add(np, { c: 'D', f: ['x'] }, { c: 'NUM' }, `NOMX.${k}`);
      add(np, { c: 'NUM' }, `NOMX.${k}`);
      add(np, 'GENP', { c: 'NUM' }, `NOMX.${k}`);
      const nx = `NOMX.${k}`;
      const kepalaX = (lis?: string): Term => ({ c: 'N', f: longgar || !lis ? ['p', k] : ['p', k, lis], tanpa: ['kol'] });
      add(nx, kepalaX());
      add(nx, 'PRE', nx);
      add(nx, kepalaX('pg'), 'PPG');
      add(nx, kepalaX('inf'), 'INF');
      add(nx, kepalaX('to'), 'PP.to');
    } else add(np, `NOMM.${k}`);
    // Pewatas sesudah noun.
    add(np, np, `POST.${k}`);
    add(np, np, `PAS.${k}`);
    add(np, np, `VA.ing.${k}`);
    add(np, np, `APC.${k}`);
    add(np, np, { c: 'REL', f: [k === 'h' ? 'who' : 'which'] }, `VF.${n}.${k}`);
    add(np, np, { c: 'REL', f: ['that'] }, `VF.${n}.${k}`);
    add(np, np, { c: 'REL' }, `CLG.${k}`);
    add(np, np, `CLG.${k}`);
    // Inti noun beserta pewatas di depannya; pewatas berlisensi menempel langsung pada inti.
    const kepala = (lis?: string): Term => ({ c: 'N', f: longgar || !lis ? [n, k] : [n, k, lis] });
    add(nom, kepala());
    add(nom, 'PRE', nom);
    add(nom, kepala('pg'), 'PPG');
    add(nom, kepala('inf'), 'INF');
    add(nom, kepala('to'), 'PP.to');
    if (n === 's') {
      const nm = `NOMM.${k}`;
      const massa = (lis?: string): Term => ({ c: 'N', f: longgar || !lis ? ['s', 'm', k] : ['s', 'm', k, lis] });
      add(nm, massa());
      add(nm, 'PRE', nm);
      add(nm, massa('pg'), 'PPG');
      add(nm, massa('to'), 'PP.to');
    }
  }
  for (const k of KLS) for (const p of postUntuk(k)) {
    add(`POST.${k}`, P(p), 'NPANY');
    add(`POST.${k}`, P(p), 'NCL');
  }
  for (const p of PREPOSISI) add('PPG', P(p), 'GERP');
  add('PRE', { c: 'A' });
  add('PRE', ADV, { c: 'A' });
  add('PRE', { c: 'NM' });
  add('PRE', { c: 'V', f: ['pas'] });
  add('PRE', ADV, { c: 'V', f: ['pas'] });
  if (longgar) { add('PRE', { c: 'N', f: ['s'] }); add('PRE', { c: 'N', f: ['p'] }); }
  // Posesif: penanda 's milik noun tunggal memerlukan determiner ("the company's"); milik noun jamak boleh tanpa ("children's").
  for (const n of NUM) {
    add(`GENB.${n}`, { c: 'GEN', f: [n] });
    add(`GENB.${n}`, 'PRE', `GENB.${n}`);
    add('GENP', { c: 'D', f: [n] }, `GENB.${n}`);
    add('GENP', { c: 'D', f: ['x'] }, `GENB.${n}`);
  }
  add('GENP', 'GENB.p');

  // ---- Klausa dengan objek rumpang (object relative clause, "what …"): "the report (that) the team prepared" ----
  // CLG.g: g = kelas noun yang menempati rumpang (kepala relative clause atau "what" = benda).
  for (const g of KLS) {
    for (const n of NUM) for (const k of KLS) {
      add(`CLG.${g}`, `SUBJ.${n}.${k}`, `VG.${n}.${k}.${g}`);
      const vg = `VG.${n}.${k}.${g}`;
      for (const f of finV[n]) add(vg, `VGA.${f}.${k}.${g}`);
      for (const f of finBE[n]) add(vg, BE(f), `PREDG.${k}.${g}`);
      for (const f of finHAVE[n]) add(vg, HAVE(f), `PERFG.${k}.${g}`);
      add(vg, MOD, `BASEG.${k}.${g}`);
      add(vg, ADV, vg);
    }
    for (const k of KLS) {
      add(`BASEG.${k}.${g}`, `VGA.base.${k}.${g}`);
      add(`BASEG.${k}.${g}`, BE('base'), `PREDG.${k}.${g}`);
      add(`BASEG.${k}.${g}`, HAVE('base'), `PERFG.${k}.${g}`);
      add(`BASEG.${k}.${g}`, NOT, `BASEG.${k}.${g}`);
      add(`PERFG.${k}.${g}`, `VGA.en.${k}.${g}`);
      add(`PERFG.${k}.${g}`, BE('en'), `PREDG.${k}.${g}`);
      add(`PERFG.${k}.${g}`, NOT, `PERFG.${k}.${g}`);
      add(`PREDG.${k}.${g}`, `VGA.ing.${k}.${g}`);
      for (const p of PREPOSISI) add(`PREDG.${k}.${g}`, A(k, `pp:${p}`), P(p));
      for (const p of PREPOSISI) add(`PREDG.${k}.${g}`, V('pas', k, `pp:${p}`), P(p));
      add(`PREDG.${k}.${g}`, `PREDG.${k}.${g}`, 'KET');
      add(`INFG.${g}`, TO, `BASEG.${k}.${g}`);
    }
    for (const f of BENTUK) for (const k of KLS) {
      const vg = `VGA.${f}.${k}.${g}`;
      add(vg, V(f, k, 'np', g));
      add(vg, V(f, k, 'np_np', g), 'NPANY');
      add(vg, V(f, k, 'np_np'), 'NPANY');
      add(vg, V(f, k, 'np_inf', g), 'INF');
      add(vg, V(f, k, 'np_wh', g), 'NCL');
      add(vg, V(f, k, 'np_inf'), 'NPANY', `INFG.${g}`);
      add(vg, V(f, k, 'inf'), `INFG.${g}`);
      for (const p of PREPOSISI) {
        add(vg, V(f, k, `np_pp:${p}`, g), `PP.${p}`);
        add(vg, V(f, k, `np_pp:${p}`), 'NPANY', P(p));
        add(vg, V(f, k, `pp:${p}`), P(p));
      }
      add(vg, vg, 'KET');
      add(vg, ADV, vg);
    }
  }
  return R;
}

// ---------------------------------------------------------------------------------------------------------------------
// Pengurai Earley inkremental (tanpa aturan kosong). Bagan dapat diperpanjang kata demi kata dan dipotong kembali, sehingga
// penelusuran 120 urutan berbagi awalan yang sama dan memangkas awalan yang sudah mati.

interface TataBahasa { aturan: Aturan[]; perKiri: Map<string, number[]> }

const CACHE_TB = new Map<string, TataBahasa>();
function tataBahasa(op: OpsiTataBahasa): TataBahasa {
  const kunci = `${op.tanpaKelas ? 1 : 0}${op.tanpaLisensi ? 1 : 0}`;
  let tb = CACHE_TB.get(kunci);
  if (!tb) {
    const aturan = bangunAturan(op);
    const perKiri = new Map<string, number[]>();
    aturan.forEach((a, i) => { if (!perKiri.has(a.kiri)) perKiri.set(a.kiri, []); perKiri.get(a.kiri)!.push(i); });
    tb = { aturan, perKiri };
    CACHE_TB.set(kunci, tb);
  }
  return tb;
}

type Butir = [number, number, number]; // [aturan, titik, asal]

interface Himpunan {
  butir: Butir[];
  ada: Set<string>;
  /** Butir yang menunggu nonterminal tertentu (untuk langkah complete). */
  tunggu: Map<string, Butir[]>;
  /** Butir yang menunggu terminal (untuk langkah scan). */
  pindai: Butir[];
  diprediksi: Set<string>;
}

class Bagan {
  readonly h: Himpunan[] = [];
  constructor(private tb: TataBahasa) {
    const awal = this.himpunanBaru();
    this.h.push(awal);
    this.prediksi(awal, 'S', 0);
    this.tutup(0);
  }
  private himpunanBaru(): Himpunan { return { butir: [], ada: new Set(), tunggu: new Map(), pindai: [], diprediksi: new Set() }; }
  private tambah(hs: Himpunan, b: Butir) {
    const k = `${b[0]},${b[1]},${b[2]}`;
    if (hs.ada.has(k)) return;
    hs.ada.add(k);
    hs.butir.push(b);
  }
  private prediksi(hs: Himpunan, nt: string, i: number) {
    if (hs.diprediksi.has(nt)) return;
    hs.diprediksi.add(nt);
    for (const r of this.tb.perKiri.get(nt) ?? []) this.tambah(hs, [r, 0, i]);
  }
  /** Lengkapi himpunan ke-i dengan predict/complete. Tanpa aturan kosong, butir yang selesai selalu berasal dari himpunan sebelumnya. */
  private tutup(i: number) {
    const hs = this.h[i];
    for (let j = 0; j < hs.butir.length; j++) {
      const [r, d, o] = hs.butir[j];
      const at = this.tb.aturan[r];
      if (d === at.kanan.length) {
        for (const w of this.h[o].tunggu.get(at.kiri) ?? []) this.tambah(hs, [w[0], w[1] + 1, w[2]]);
        continue;
      }
      const sym = at.kanan[d];
      if (typeof sym === 'string') {
        if (!hs.tunggu.has(sym)) hs.tunggu.set(sym, []);
        hs.tunggu.get(sym)!.push(hs.butir[j]);
        this.prediksi(hs, sym, i);
      } else hs.pindai.push(hs.butir[j]);
    }
  }
  get panjang() { return this.h.length - 1; }
  /** Tambahkan satu kata. Mengembalikan false bila tidak ada butir yang bertahan (awalan ini mati). */
  maju(bacaan: Bacaan[]): boolean {
    const i = this.h.length - 1;
    const baru = this.himpunanBaru();
    for (const b of this.h[i].pindai) {
      const t = this.tb.aturan[b[0]].kanan[b[1]] as Term;
      if (bacaan.some((x) => cocokTerm(t, x))) this.tambah(baru, [b[0], b[1] + 1, b[2]]);
    }
    this.h.push(baru);
    if (!baru.butir.length) return false;
    this.tutup(i + 1);
    return true;
  }
  mundur(sampai: number) { this.h.length = sampai + 1; }
  diterima(): boolean {
    const hs = this.h[this.h.length - 1];
    return hs.butir.some(([r, d, o]) => o === 0 && this.tb.aturan[r].kiri === 'S' && d === this.tb.aturan[r].kanan.length);
  }
  punya(r: number, d: number, o: number, j: number) { return this.h[j].ada.has(`${r},${d},${o}`); }
}

function cocokTerm(t: Term, b: Bacaan): boolean {
  if (b.c !== t.c) return false;
  if (t.f && !t.f.every((x) => b.f.has(x))) return false;
  if (t.tanpa && t.tanpa.some((x) => b.f.has(x))) return false;
  if (t.s !== undefined) {
    // Subkategori "np/n" = objek harus noun kelas n; tanpa tanda kelas = objek kelas apa pun.
    const ada = b.s.has(t.s) || (t.ok ? b.s.has(`${t.s}/${t.ok}`) : b.s.has(`${t.s}/h`) || b.s.has(`${t.s}/n`));
    if (!ada) return false;
  }
  if (t.kls && b.f.has(t.kls === 'h' ? 'n' : 'h')) return false;
  return true;
}

// ---------------------------------------------------------------------------------------------------------------------

const CACHE_BACAAN = new Map<string, Bacaan>();
function bacaanToken(t: Token): Bacaan[] {
  return t.b.map((k) => { let x = CACHE_BACAAN.get(k); if (!x) { x = uraiBacaan(k); CACHE_BACAAN.set(k, x); } return x; });
}

/** Apakah rangkaian token (sudah berurutan) membentuk satu kalimat menurut tata bahasa solver. */
export function kalimatSah(token: Token[], op: OpsiTataBahasa = {}): boolean {
  const bg = new Bagan(tataBahasa(op));
  for (const t of token) if (!bg.maju(bacaanToken(t))) return false;
  return bg.diterima();
}

/**
 * Indeks kata pertama yang tidak dapat lagi menyambung awalan kalimat sah (0-based), `token.length` bila semua kata dapat
 * disambung tetapi kalimat belum lengkap, atau -1 bila kalimat sah.
 */
export function titikGagal(token: Token[], op: OpsiTataBahasa = {}): number {
  const bg = new Bagan(tataBahasa(op));
  for (let i = 0; i < token.length; i++) if (!bg.maju(bacaanToken(token[i]))) return i;
  return bg.diterima() ? -1 : token.length;
}

/**
 * Seluruh urutan fragmen (indeks ke `fragmen`) yang menghasilkan kalimat sah. Penelusuran mendalam dengan bagan bersama:
 * awalan yang mati langsung dipangkas sehingga 120 urutan tidak diurai satu per satu dari awal.
 */
export function urutanSah(fragmen: Token[][], op: OpsiTataBahasa = {}): number[][] {
  const bg = new Bagan(tataBahasa(op));
  const hasil: number[][] = [];
  const pakai: boolean[] = fragmen.map(() => false);
  const jalur: number[] = [];
  const telusur = () => {
    if (jalur.length === fragmen.length) { if (bg.diterima()) hasil.push([...jalur]); return; }
    for (let i = 0; i < fragmen.length; i++) {
      if (pakai[i]) continue;
      const titik = bg.panjang;
      let hidup = true;
      for (const t of fragmen[i]) if (!bg.maju(bacaanToken(t))) { hidup = false; break; }
      if (hidup) { pakai[i] = true; jalur.push(i); telusur(); jalur.pop(); pakai[i] = false; }
      bg.mundur(titik);
    }
  };
  telusur();
  return hasil;
}

/** Alat bantu audit: satu pohon urai (bracket) untuk kalimat sah, atau null. Tidak dipakai solver. */
export function pohonUrai(token: Token[], op: OpsiTataBahasa = {}): string | null {
  const tb = tataBahasa(op);
  const bg = new Bagan(tb);
  for (const t of token) if (!bg.maju(bacaanToken(t))) return null;
  if (!bg.diterima()) return null;
  const memo = new Map<string, string | null>();
  const nt = (x: string, i: number, j: number): string | null => {
    const kunci = `${x},${i},${j}`;
    if (memo.has(kunci)) return memo.get(kunci)!;
    memo.set(kunci, null);
    for (const r of tb.perKiri.get(x) ?? []) {
      const n = tb.aturan[r].kanan.length;
      if (!bg.punya(r, n, i, j)) continue;
      const anak = rhs(r, n, i, j);
      if (anak) { const s = `[${x} ${anak.join(' ')}]`; memo.set(kunci, s); return s; }
    }
    return null;
  };
  const rhs = (r: number, d: number, i: number, j: number): string[] | null => {
    if (d === 0) return i === j ? [] : null;
    const sym = tb.aturan[r].kanan[d - 1];
    if (typeof sym !== 'string') {
      if (j - 1 < i || !bg.punya(r, d - 1, i, j - 1)) return null;
      if (!bacaanToken(token[j - 1]).some((b) => cocokTerm(sym, b))) return null;
      const kiri = rhs(r, d - 1, i, j - 1);
      return kiri ? [...kiri, token[j - 1].w] : null;
    }
    for (let k = j - 1; k >= i; k--) {
      if (!bg.punya(r, d - 1, i, k)) continue;
      const sub = nt(sym, k, j);
      if (!sub) continue;
      const kiri = rhs(r, d - 1, i, k);
      if (kiri) return [...kiri, sub];
    }
    return null;
  };
  return nt('S', 0, token.length);
}
