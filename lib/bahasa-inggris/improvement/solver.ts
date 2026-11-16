import { bentukKata, namaBentuk, namaTense, urai, type Bacaan, type Diatesis } from './analisis';
import { VERB, jumlahInti, tagVerb, type BentukKata } from './leksikon';

// Solver berbasis aturan: menilai satu potongan verb (opsi tanpa ekor yang sama) pada konteks rentang yang dicatat
// anotasi `slot`. Keputusan diturunkan dari leksikon dan analisis frasa milik solver: preposisi → gerund; pola complement
// verb; penanda infinitive; bentuk unsur lain dalam rangkaian paralel; jumlah inti subjek + penanda waktu + diatesis.
// Status 'ragu' = solver tidak dapat menolak bentuk itu dengan kaidah yang jelas (variasi yang mungkin diterima); soal
// dengan opsi ragu dianggap berkunci ganda dan ditolak.

/** Pembuka rangkaian paralel: menentukan bentuk yang sah bersama bentuk unsur lain. */
export type Pembuka = 'to' | 'modal' | 'gerund' | 'lampau' | 'kini' | 'pasif' | 'korelatif';

export type Slot =
  /** Rentang tepat setelah preposisi (termasuk to sebagai preposisi): butuh gerund. */
  | { jenis: 'preposisi'; pemicu: string; preposisi: string; diatesis: Diatesis }
  /** Rentang = complement verb `verb` (objek: verb + objek + complement, mis. require staff to submit). */
  | { jenis: 'komplemen'; pemicu: string; verb: string; objek: boolean; diatesis: Diatesis }
  /** Rentang tepat setelah to penanda infinitive milik `verb` (plans to ___). */
  | { jenis: 'setelah-to'; pemicu: string; verb: string; diatesis: Diatesis }
  /** Rentang = satu unsur rangkaian; `unsur` = potongan verb unsur lain seperti tercetak. */
  | { jenis: 'paralel'; pemicu: string; pembuka: Pembuka; unsur: string[] }
  /** Rentang = predikat finite; `inti` = kata inti subjek, `penanda` = keterangan waktu yang mengikat tense (atau null). */
  | { jenis: 'predikat'; pemicu: string; inti: string; penanda: string | null; diatesis: Diatesis };

export interface Nilai { status: 'benar' | 'salah' | 'ragu'; alasan: string }

const kap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const q = (s: string) => `"${s}"`;

const satuKata = (p: string) => !/\s/.test(p.trim());

/** Deskripsi singkat bentuk potongan untuk pembahasan (V1, V2/V3, to-infinitive, present perfect, …). */
function deskripsi(p: string, b: Bacaan[]): string {
  if (satuKata(p) && tagVerb(p).length) return namaBentuk(bentukKata(p));
  const f = b.find((x) => x.jenis === 'finit');
  if (f && f.jenis === 'finit') return `bentuk finite ${namaTense(f)}`;
  if (b.some((x) => x.jenis === 'to-inf')) return 'to-infinitive';
  if (b.some((x) => x.jenis === 'to-ing')) return 'to + V-ing';
  if (b.some((x) => x.jenis === 'gerund')) return 'gerund';
  if (b.some((x) => x.jenis === 'partisip')) return 'V3 (past participle)';
  if (b.some((x) => x.jenis === 'dasar')) return satuKata(p) ? 'bentuk dasar (V1)' : 'bentuk dasar tanpa auxiliary finite (is/are/was/were/has/have)';
  return 'susunan yang tidak berterima';
}

const cacatDari = (b: Bacaan[]) => b.find((x): x is Extract<Bacaan, { jenis: 'cacat' }> => x.jenis === 'cacat');

// ───────────────────────────── preposisi + gerund ─────────────────────────────
function nilaiPreposisi(s: Extract<Slot, { jenis: 'preposisi' }>, p: string): Nilai {
  const b = urai(p);
  const X = kap(p);
  const butuh = s.diatesis === 'pasif' ? 'being + V3' : 'V-ing (gerund)';
  if (b.some((x) => x.jenis === 'gerund' && x.diatesis === s.diatesis)) {
    const awal = s.pemicu.toLowerCase() === s.preposisi ? `${kap(s.preposisi)} adalah preposisi` : `Pada ${q(s.pemicu)}, ${s.preposisi} adalah preposisi`;
    return { status: 'benar', alasan: `${awal} sehingga kegiatan sesudahnya dinyatakan dengan ${butuh}${s.diatesis === 'pasif' ? ' karena subjek menerima tindakan' : ''}.` };
  }
  if (b.some((x) => x.jenis === 'gerund')) {
    return s.diatesis === 'pasif'
      ? { status: 'salah', alasan: `${X} berbentuk gerund aktif, padahal subjek kalimat menerima tindakan itu; diperlukan being + V3.` }
      : { status: 'salah', alasan: `${X} bermakna pasif, padahal subjek kalimat sendiri yang melakukan tindakan.` };
  }
  if (p.trim().toLowerCase().startsWith('to ')) {
    return s.preposisi === 'to'
      ? { status: 'salah', alasan: `${X} menggandakan to sehingga kalimat menjadi ${q(`${s.pemicu} ${p}`)}.` }
      : { status: 'salah', alasan: `${X} memakai to, padahal setelah preposisi ${s.preposisi} tidak dapat muncul infinitive; diperlukan ${butuh}.` };
  }
  if (b.some((x) => x.jenis === 'dasar') && satuKata(p)) {
    return s.preposisi === 'to'
      ? { status: 'salah', alasan: `${X} adalah V1. Pada ${q(s.pemicu)}, to adalah preposisi, bukan penanda infinitive, sehingga diperlukan ${butuh}.` }
      : { status: 'salah', alasan: `${X} adalah V1; setelah preposisi ${s.preposisi} diperlukan ${butuh}.` };
  }
  if (b.some((x) => x.jenis === 'dasar')) {
    return s.preposisi === 'to'
      ? { status: 'salah', alasan: `${X} adalah bentuk dasar be + V3 (infinitive pasif). Pada ${q(s.pemicu)}, to adalah preposisi sehingga diperlukan ${butuh}.` }
      : { status: 'salah', alasan: `${X} adalah bentuk dasar be + V3; setelah preposisi ${s.preposisi} diperlukan ${butuh}.` };
  }
  if (satuKata(p) && bentukKata(p).includes('s')) return { status: 'salah', alasan: `${X} adalah verb finite berakhiran -s yang memerlukan subjek sendiri, sehingga tidak dapat menjadi objek preposisi ${s.preposisi}.` };
  if (satuKata(p) && tagVerb(p).length) return { status: 'salah', alasan: `${X} adalah ${namaBentuk(bentukKata(p))}, bukan gerund yang dapat menjadi objek preposisi ${s.preposisi}.` };
  const c = cacatDari(b);
  if (c && !b.some((x) => x.jenis === 'finit')) return { status: 'salah', alasan: `${X} salah bentuk (${c.alasan}); setelah preposisi ${s.preposisi} diperlukan ${butuh}.` };
  return { status: 'salah', alasan: `${X} adalah ${deskripsi(p, b)} dan tidak dapat menjadi objek preposisi ${s.preposisi}; diperlukan ${butuh}.` };
}

// ───────────────────────────── complement verb ─────────────────────────────
const cocokKebutuhan = (b: Bacaan[], jenis: 'gerund' | 'to-inf', d: Diatesis) => b.some((x) => x.jenis === jenis && x.diatesis === d && x.aspek === 'simple');

function nilaiKomplemen(s: Extract<Slot, { jenis: 'komplemen' }>, p: string): Nilai {
  const e = VERB.get(s.verb);
  const b = urai(p);
  const X = kap(p);
  if (!e || (!s.objek && !e.pola) || (s.objek && !e.objInf)) return { status: 'ragu', alasan: `Pola complement ${s.verb} tidak tercatat di leksikon.` };
  const gerund = cocokKebutuhan(b, 'gerund', s.diatesis);
  const toInf = cocokKebutuhan(b, 'to-inf', s.diatesis);
  if (!s.objek && e.pola === 'keduanya' && (gerund || toInf)) return { status: 'ragu', alasan: `${s.verb} menerima gerund maupun to-infinitive.` };
  const perlu: 'gerund' | 'to-inf' = s.objek ? 'to-inf' : e.pola === 'gerund' ? 'gerund' : 'to-inf';
  const namaPerlu = perlu === 'gerund' ? 'gerund (V-ing)' : 'to-infinitive (to + V1)';
  const pola = s.objek ? `pola ${s.verb} + objek memerlukan ${namaPerlu}` : `${s.verb} diikuti ${namaPerlu}, bukan ${perlu === 'gerund' ? 'to-infinitive' : 'gerund'}`;
  if ((perlu === 'gerund' && gerund) || (perlu === 'to-inf' && toInf)) {
    return { status: 'benar', alasan: `${kap(pola)}; ${q(`${s.pemicu} ${p}`)} memenuhi pola itu.` };
  }
  if (b.some((x) => x.jenis === 'to-ing')) {
    if (!s.objek && e.prepTo) return { status: 'ragu', alasan: `Setelah ${s.verb}, to juga dapat berfungsi sebagai preposisi.` };
    return { status: 'salah', alasan: perlu === 'gerund' ? `${X} memakai to, padahal ${s.verb} langsung diikuti V-ing tanpa to; to + V-ing juga tidak membentuk infinitive.` : `${X} tidak membentuk infinitive: setelah to penanda infinitive diperlukan V1.` };
  }
  if (perlu === 'gerund' && toInf) return { status: 'salah', alasan: `${X} adalah to-infinitive, padahal ${s.verb} hanya diikuti gerund (V-ing).` };
  if (perlu === 'to-inf' && gerund) return { status: 'salah', alasan: `${X} adalah V-ing, padahal ${s.verb} hanya diikuti to-infinitive (to + V1).` };
  if (b.some((x) => x.jenis === 'dasar') && satuKata(p)) return { status: 'salah', alasan: `${X} adalah V1${perlu === 'to-inf' ? ' tanpa to' : ''}, padahal ${pola}.` };
  if (satuKata(p) && tagVerb(p).length) return { status: 'salah', alasan: `${X} adalah ${namaBentuk(bentukKata(p))}, bukan complement yang dapat mengikuti ${q(s.pemicu)}; diperlukan ${namaPerlu}.` };
  return { status: 'salah', alasan: `${X} adalah ${deskripsi(p, b)}; ${s.pemicu} memerlukan ${namaPerlu}.` };
}

// ───────────────────────────── setelah to penanda infinitive ─────────────────────────────
function nilaiSetelahTo(s: Extract<Slot, { jenis: 'setelah-to' }>, p: string): Nilai {
  const e = VERB.get(s.verb);
  const b = urai(p);
  const X = kap(p);
  if (!e || e.pola !== 'inf') return { status: 'ragu', alasan: `Pola ${s.verb} + to tidak tercatat sebagai infinitive saja.` };
  if (b.some((x) => x.jenis === 'dasar' && x.diatesis === s.diatesis && x.aspek === 'simple')) {
    return { status: 'benar', alasan: `Pada ${q(s.pemicu)}, to adalah penanda infinitive sehingga diikuti ${s.diatesis === 'pasif' ? 'be + V3' : 'V1 (bentuk dasar)'}.` };
  }
  if (b.some((x) => x.jenis === 'gerund')) {
    if (e.prepTo) return { status: 'ragu', alasan: `Setelah ${s.verb}, to juga dapat berfungsi sebagai preposisi.` };
    return { status: 'salah', alasan: `${X} adalah V-ing. Pada ${q(s.pemicu)}, to adalah penanda infinitive, bukan preposisi, sehingga diikuti V1.` };
  }
  if (p.trim().toLowerCase().startsWith('to ')) return { status: 'salah', alasan: `${X} menggandakan to sehingga kalimat menjadi ${q(`${s.pemicu} ${p}`)}.` };
  if (satuKata(p) && bentukKata(p).includes('s')) return { status: 'salah', alasan: `${X} membawa akhiran -s; setelah penanda infinitive to diperlukan V1.` };
  if (satuKata(p) && tagVerb(p).length) return { status: 'salah', alasan: `${X} adalah ${namaBentuk(bentukKata(p))}; setelah penanda infinitive to diperlukan V1.` };
  return { status: 'salah', alasan: `${X} adalah ${deskripsi(p, b)}; setelah penanda infinitive to diperlukan V1.` };
}

// ───────────────────────────── struktur paralel ─────────────────────────────
type Ciri = BentukKata | 'to-dasar' | 'to-ing' | 'lain';

/** Ciri bentuk satu unsur rangkaian: bentuk kata tunggal, to + V1, to + V-ing, atau lain. */
function ciri(p: string): Set<Ciri> {
  const t = p.trim().toLowerCase().split(/\s+/);
  if (t.length === 1 && tagVerb(t[0]).length) return new Set(bentukKata(t[0]));
  if (t.length === 2 && t[0] === 'to') {
    const b = bentukKata(t[1]);
    if (b.includes('dasar')) return new Set(['to-dasar']);
    if (b.includes('ing')) return new Set(['to-ing']);
  }
  return new Set(['lain']);
}

const SARING: Record<Pembuka, Ciri[] | null> = {
  to: ['dasar'], modal: ['dasar'], gerund: ['ing'], lampau: ['v2'], kini: ['s', 'dasar'], pasif: ['v3'], korelatif: null,
};

const NAMA_CIRI: Record<Ciri, string> = {
  dasar: 'V1', s: 'verb berakhiran -s', v2: 'V2', v3: 'V3', ing: 'V-ing', 'to-dasar': 'to + V1', 'to-ing': 'to + V-ing', lain: 'frasa verb yang berbeda susunannya',
};
const namaCiri = (c: Set<Ciri>) => (c.has('v2') && c.has('v3') ? ['V2/V3', ...[...c].filter((x) => x !== 'v2' && x !== 'v3').map((x) => NAMA_CIRI[x])] : [...c].map((x) => NAMA_CIRI[x])).join('/');

function nilaiParalel(s: Extract<Slot, { jenis: 'paralel' }>, p: string): Nilai {
  if (!s.unsur.length) return { status: 'ragu', alasan: 'Unsur pembanding rangkaian tidak tercatat.' };
  let sah = ciri(s.unsur[0]);
  for (const u of s.unsur.slice(1)) sah = new Set([...sah].filter((c) => ciri(u).has(c)));
  const saring = SARING[s.pembuka];
  if (saring) sah = new Set([...sah].filter((c) => saring.includes(c as BentukKata)));
  sah.delete('lain');
  if (!sah.size) return { status: 'ragu', alasan: 'Unsur lain rangkaian tidak memiliki bentuk bersama.' };
  const c = ciri(p);
  const X = kap(p);
  const daftar = s.unsur.map(q).join(', ');
  if ([...c].some((x) => sah.has(x))) {
    return { status: 'benar', alasan: `Unsur lain dalam rangkaian (${daftar}) berbentuk ${namaCiri(sah)}; ${p} menyamakan bentuk itu sehingga rangkaian sejajar.` };
  }
  if (s.pembuka === 'to' && c.has('to-dasar')) return { status: 'ragu', alasan: 'Pengulangan to pada satu unsur tidak otomatis salah.' };
  if (s.pembuka === 'korelatif' && sah.has('to-dasar') && c.has('dasar')) return { status: 'ragu', alasan: 'V1 setelah pasangan conjunction dapat dibaca berbagi to.' };
  const bentuk = c.has('lain') ? 'frasa verb yang berbeda susunannya' : namaCiri(c);
  return { status: 'salah', alasan: `${X} berbentuk ${bentuk}, sedangkan unsur lain (${daftar}) berbentuk ${namaCiri(sah)}; rangkaian menjadi tidak sejajar.` };
}

// ───────────────────────────── predikat: agreement + tense + diatesis ─────────────────────────────
interface Aturan { nama: string; benar: string[]; ragu: string[] }

const HARI = 'monday|tuesday|wednesday|thursday|friday|saturday|sunday|week|weekend|month|year|quarter|night|spring|summer|autumn|winter|semester';

/** Leksikon penanda waktu milik solver (Azar bab 1–4; Materi bagian 5). `null` = penanda tidak dikenal. */
export function aturanPenanda(teks: string): Aturan | null {
  const t = teks.toLowerCase().trim();
  const kata = t.replace(/[.,]/g, '').split(/\s+/);
  const depan: Aturan = { nama: 'future perfect (will have + V3)', benar: ['future-perfect', 'future-perfect-progressive', 'future-simple'], ragu: ['present-simple', 'present-progressive', 'future-progressive'] };
  if (/^since\b/.test(t)) return { nama: 'present perfect (has/have + V3)', benar: ['present-perfect', 'present-perfect-progressive'], ragu: ['past-perfect', 'past-perfect-progressive'] };
  if (/^by the time\b/.test(t)) {
    const lampau = kata.some((w) => w === 'was' || w === 'were' || (tagVerb(w).some((x) => x.bentuk === 'v2') && !tagVerb(w).some((x) => x.bentuk === 'dasar')));
    const kini = kata.some((w) => w === 'is' || w === 'are' || tagVerb(w).some((x) => x.bentuk === 's'));
    if (lampau && !kini) return { nama: 'past perfect (had + V3)', benar: ['past-perfect', 'past-perfect-progressive'], ragu: ['past-simple', 'past-progressive'] };
    if (kini && !lampau) return depan;
    return null;
  }
  if (/^by (the end of )?next\b/.test(t) || /^by tomorrow\b/.test(t)) return depan;
  if (/\b(yesterday|ago)\b/.test(t) || new RegExp(`\\blast (${HARI})\\b`).test(t) || /\bin (19|20)\d\d\b/.test(t)) {
    return { nama: 'past simple', benar: ['past-simple'], ragu: ['past-progressive', 'past-perfect', 'past-perfect-progressive'] };
  }
  if (/\b(at the moment|right now|at present)\b/.test(t)) return { nama: 'present progressive (am/is/are + V-ing)', benar: ['present-progressive'], ragu: ['present-simple', 'present-perfect', 'present-perfect-progressive'] };
  return null;
}

function nilaiPredikat(s: Extract<Slot, { jenis: 'predikat' }>, p: string): Nilai {
  const jumlah = jumlahInti(s.inti);
  if (!jumlah) return { status: 'ragu', alasan: `Jumlah inti subjek ${s.inti} tidak tercatat.` };
  const aturan = s.penanda ? aturanPenanda(s.penanda) : null;
  if (s.penanda && !aturan) return { status: 'ragu', alasan: `Penanda waktu ${q(s.penanda)} tidak dikenal.` };
  const b = urai(p);
  const X = kap(p);
  const namaJumlah = jumlah === 'tunggal' ? 'tunggal' : jumlah === 'jamak' ? 'jamak' : 'kolektif';
  let terbaik: { masalah: string[]; ragu: boolean } | null = null;
  let benar: Extract<Bacaan, { jenis: 'finit' }> | null = null;
  for (const x of b) {
    if (x.jenis !== 'finit') continue;
    const masalah: string[] = [];
    let ragu = false;
    const kata = x.aux[0] ?? p.split(/\s+/)[0];
    if (x.persona === 'sg1') masalah.push(`${kata} hanya dipakai dengan I`);
    if (x.persona === 'sg3' && jumlah === 'jamak') masalah.push(`${kata} dipakai untuk subjek tunggal, sedangkan inti subjek ${q(s.inti)} jamak`);
    if (x.persona === 'jamak' && jumlah === 'tunggal') masalah.push(`${kata} dipakai untuk subjek jamak, sedangkan inti subjek ${q(s.inti)} tunggal`);
    if (aturan) {
      const sig = `${x.kala}-${x.aspek}`;
      if (aturan.ragu.includes(sig)) ragu = true;
      else if (!aturan.benar.includes(sig)) masalah.push(`${namaTense(x)} tidak cocok dengan penanda waktu ${q(s.penanda!)}, yang memerlukan ${aturan.nama}`);
    }
    if (x.diatesis !== s.diatesis && x.lemma !== 'be') {
      masalah.push(s.diatesis === 'pasif' ? `bentuk aktif menjadikan ${q(s.inti)} pelaku, padahal subjek menerima tindakan (diperlukan be + V3)` : `bentuk passive menjadikan ${q(s.inti)} penerima tindakan, padahal subjek yang melakukannya`);
    }
    if (VERB.get(x.lemma)?.statif && (x.aspek === 'progressive' || x.aspek === 'perfect-progressive')) masalah.push(`${x.lemma} adalah verb keadaan yang tidak lazim dalam progressive`);
    if (!masalah.length && !ragu) { benar = x; break; }
    if (!terbaik || masalah.length < terbaik.masalah.length || (masalah.length === terbaik.masalah.length && ragu && !terbaik.ragu)) terbaik = { masalah, ragu };
  }
  if (benar) {
    const bagian: string[] = [];
    if (aturan) bagian.push(`penanda ${q(s.penanda!)} memerlukan ${aturan.nama}, dan ${p} memenuhinya`);
    if (benar.persona !== 'semua') bagian.push(`inti subjek ${q(s.inti)} ${namaJumlah} sehingga cocok dengan ${benar.aux[0] ?? p.split(/\s+/)[0]}`);
    else if (!aturan) bagian.push(`${p} (${namaTense(benar)}) tidak berubah menurut jumlah subjek`);
    if (benar.diatesis === 'pasif') bagian.push('subjek menerima tindakan sehingga dipakai passive (be + V3)');
    return { status: 'benar', alasan: `${kap(bagian.join('; '))}.` };
  }
  if (terbaik && !terbaik.masalah.length && terbaik.ragu) return { status: 'ragu', alasan: `${X} masih mungkin diterima dengan penanda ${q(s.penanda ?? '')}.` };
  if (terbaik) {
    const isi = terbaik.masalah.join('; ');
    return { status: 'salah', alasan: satuKata(p) && isi.toLowerCase().startsWith(`${p.toLowerCase()} `) ? `${kap(isi)}.` : `${X}: ${isi}.` };
  }
  const c = cacatDari(b);
  if (c) return { status: 'salah', alasan: `${X} salah bentuk: ${c.alasan}.` };
  return { status: 'salah', alasan: `${X} adalah ${deskripsi(p, b)}, bukan verb finite, sehingga kalimat tidak memiliki predikat.` };
}

/** Nilai satu potongan verb pada slotnya. */
export function nilai(slot: Slot, potongan: string): Nilai {
  switch (slot.jenis) {
    case 'preposisi': return nilaiPreposisi(slot, potongan);
    case 'komplemen': return nilaiKomplemen(slot, potongan);
    case 'setelah-to': return nilaiSetelahTo(slot, potongan);
    case 'paralel': return nilaiParalel(slot, potongan);
    case 'predikat': return nilaiPredikat(slot, potongan);
  }
}
