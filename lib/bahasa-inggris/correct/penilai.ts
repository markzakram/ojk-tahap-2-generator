import { bunyiVokal } from '../model';
import { noun, PRONOMINA, PRONOMINA_TAK_BAKU, verba, type Jumlah, type KasusPronomina } from './leksikon';
import { render, type DataGcs, type Klausa, type OpsiGcs, type Unsur, type UnsurNp, type UnsurPronomina, type UnsurSubjek } from './tipe';

// Penilai (solver) Grammatically Correct Sentence. Setiap kalimat diperiksa ulang dari anotasinya dengan aturan milik penilai
// sendiri (blueprint bagian 5, 7, 10; Materi §2–4, §6–7, §9–10): agreement dari kata inti/ungkapan jumlah subjek, bentuk
// rangkaian verb setelah modal/auxiliary dan kecocokan voice, urutan subjek–verb dalam noun clause, preposisi dari jenis
// keterangan waktu, kecocokan quantifier dengan countable/uncountable noun, serta kasus pronoun. Penilai tidak pernah
// membaca bentuk "benar" yang dipakai pembangun; ia menurunkan bentuk yang sah dari fitur kalimat lalu membandingkannya.

export type JenisRelasi = 'struktur' | 'setuju' | 'rantai' | 'urutan' | 'waktu' | 'np' | 'pronomina';

export interface Relasi {
  kunci: string;
  jenis: JenisRelasi;
  /** Kosong = relasi terpenuhi. Setiap butir = satu kesalahan yang dapat ditunjuk. */
  kesalahan: string[];
  /** Penjelasan bila relasi terpenuhi (dipakai untuk alasan opsi benar). */
  benar: string;
  kataKunci: string[];
  /** Ringkasan "petunjuk → bentuk" untuk Cara Cepat. */
  ringkas: string;
}

export interface HasilOpsi { label: string; relasi: Relasi[]; kesalahan: string[] }

export const kap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const kata = (s: string) => s.trim().split(/\s+/).filter(Boolean);
const relasi = (kunci: string, jenis: JenisRelasi, kesalahan: string[], benar = '', kataKunci: string[] = [], ringkas = ''): Relasi =>
  ({ kunci, jenis, kesalahan, benar, kataKunci, ringkas });

// ——— Subjek dan agreement (Azar 5-2, 5-4, 5-5; Materi §4) ———

type AturanPenentu = { verb: Jumlah | 'ikut'; noun: 'tunggal' | 'jamak' | 'jamak-atau-takhitung' };
const PENENTU: Record<string, AturanPenentu> = {
  'each of the': { verb: 'tunggal', noun: 'jamak' },
  'one of the': { verb: 'tunggal', noun: 'jamak' },
  'the number of': { verb: 'tunggal', noun: 'jamak' },
  every: { verb: 'tunggal', noun: 'tunggal' },
  'a number of': { verb: 'jamak', noun: 'jamak' },
  'all of the': { verb: 'ikut', noun: 'jamak-atau-takhitung' },
  'most of the': { verb: 'ikut', noun: 'jamak-atau-takhitung' },
  'half of the': { verb: 'ikut', noun: 'jamak-atau-takhitung' },
  'some of the': { verb: 'ikut', noun: 'jamak-atau-takhitung' },
};

interface InfoSubjek { jumlah: Jumlah; dasar: string; tambahan: string; pendek: string; frasa: string; kataKunci: string[] }

/** Teks subjek dari awal sampai kata inti (mis. "each of the new employees"), huruf awal kecil. */
function frasaInti(s: UnsurSubjek): string {
  const k = kata(s.teks);
  const i = k.findIndex((w) => w.toLowerCase() === s.inti.toLowerCase());
  const f = (i >= 0 ? k.slice(0, i + 1) : k).join(' ');
  return f[0].toLowerCase() + f.slice(1);
}

function infoSubjek(s: UnsurSubjek): InfoSubjek | string {
  const teks = s.teks.toLowerCase();
  const n = noun(s.inti);
  if (!n || !n.baku) return `Inti subjek ${s.inti} tidak dikenali.`;
  if (!kata(teks).includes(s.inti.toLowerCase())) return `Inti subjek ${s.inti} tidak terdapat pada subjek.`;
  if (s.pewatas && !teks.includes(s.pewatas.toLowerCase())) return 'Modifier subjek tidak terdapat pada subjek.';
  const tambahan = s.pewatas ? ` Modifier ${s.pewatas} tidak mengubah jumlah subjek.` : '';
  const namaN = n.hitung ? n.jumlah : 'uncountable, dihitung tunggal';
  const frasa = frasaInti(s);
  const kataKunci = [s.penentu ? frasa : s.inti, ...(s.pewatas ? [s.pewatas] : [])];
  if (!s.penentu) {
    return { jumlah: n.jumlah, dasar: `Inti subjek adalah ${s.inti} (${namaN})`, tambahan, pendek: `${s.inti} yang ${n.hitung ? n.jumlah : 'uncountable'}`, frasa, kataKunci };
  }
  const p = s.penentu.toLowerCase();
  const a = PENENTU[p];
  if (!a || !teks.startsWith(`${p} `)) return `Ungkapan ${s.penentu} tidak dikenali.`;
  const cocok = a.noun === 'tunggal' ? n.hitung && n.jumlah === 'tunggal'
    : a.noun === 'jamak' ? n.hitung && n.jumlah === 'jamak'
    : !(n.hitung && n.jumlah === 'tunggal');
  if (!cocok) return `Ungkapan ${s.penentu} tidak cocok dengan ${s.inti}.`;
  const jumlah: Jumlah = a.verb === 'ikut' ? n.jumlah : a.verb;
  const dasar =
    p === 'each of the' ? `Subjek ${frasa} memerlukan verb tunggal karena each merujuk pada setiap anggota kelompok satu per satu`
    : p === 'one of the' ? `Subjek ${frasa} berpusat pada one (tunggal), bukan pada ${s.inti}`
    : p === 'the number of' ? `Subjek ${frasa} berpusat pada number (tunggal), bukan pada ${s.inti}`
    : p === 'every' ? `Every diikuti noun tunggal ${s.inti} dan memerlukan verb tunggal`
    : p === 'a number of' ? `A number of berarti "sejumlah" dan diikuti noun jamak ${s.inti}; subjeknya jamak`
    : `Pada ${p} + noun, jumlah verb mengikuti noun setelah of; ${s.inti} ${namaN}`;
  return { jumlah, dasar, tambahan, pendek: `subjek ${frasa} yang memerlukan verb ${jumlah}`, frasa, kataKunci };
}

const SETUJU = new Map<string, Jumlah>([['is', 'tunggal'], ['was', 'tunggal'], ['has', 'tunggal'], ['does', 'tunggal'], ['are', 'jamak'], ['were', 'jamak'], ['have', 'jamak'], ['do', 'jamak']]);
const PASANGAN = new Map<string, string>([['is', 'are'], ['are', 'is'], ['was', 'were'], ['were', 'was'], ['has', 'have'], ['have', 'has'], ['does', 'do'], ['do', 'does']]);

function relasiSetuju(k: Klausa, s: UnsurSubjek, toks: string[]): Relasi | null {
  const t = toks[0];
  let perlu = SETUJU.get(t);
  let ganti = PASANGAN.get(t) ?? '';
  const v = verba(k.lema);
  if (!perlu && v && t === v.s) { perlu = 'tunggal'; ganti = v.lema; }
  else if (!perlu && v && t === v.lema) { perlu = 'jamak'; ganti = v.s; }
  if (!perlu) return null; // modal, did, dan V2 tidak berubah menurut jumlah subjek
  const kunci = `setuju:${k.id}`;
  const info = infoSubjek(s);
  if (typeof info === 'string') return relasi(kunci, 'setuju', [info]);
  if (info.jumlah !== perlu) return relasi(kunci, 'setuju', [`${kap(t)} tidak sesuai dengan ${info.pendek}; gunakan ${ganti}.`]);
  return relasi(kunci, 'setuju', [], `${info.dasar}, sehingga verb yang tepat adalah ${t}.${info.tambahan}`, info.kataKunci, `${info.frasa} → ${t}`);
}

// ——— Rangkaian verb: modal, auxiliary, voice (Azar 9–11; Materi §6–7) ———

const MODAL = new Set(['can', 'could', 'may', 'might', 'must', 'should', 'will', 'would', 'cannot']);
const BE_FINIT = new Set(['am', 'is', 'are', 'was', 'were']);
const BE_SEMUA = new Set([...BE_FINIT, 'be', 'been']);
const HAVE_FINIT = new Set(['has', 'have', 'had']);
const DO = new Set(['do', 'does', 'did']);

interface HasilRantai { kesalahan: string[]; pasif: boolean }

function uraiRantai(toks: string[], k: Klausa, inti: string): HasilRantai {
  const err: string[] = [];
  const kopula = k.lema === 'be';
  const v = kopula ? undefined : verba(k.lema);
  if (!kopula && !v) return { kesalahan: [`Verb ${k.lema} tidak dikenali.`], pasif: false };
  type Keadaan = 'awal' | 'modal' | 'to' | 'perfect' | 'be' | 'being' | 'do' | 'utama';
  let s = 'awal' as Keadaan;
  let sebelum = '';
  let modal = '';
  let pasif = false;
  let utamaAda = false;
  let utamaSalah = false; // kesalahan sudah ditunjuk tepat pada verb utama (voice tidak dinilai dua kali)
  const utama = (t: string) => !!v && [v.lema, v.s, v.v2, v.v3, v.ing].includes(t);
  const penerima = k.peran === 'penerima';

  for (const t of toks) {
    // Keadaan sesudah token yang salah tempat: lanjutkan penguraian sesuai kelas token itu.
    const lanjut = (): Keadaan => {
      if (MODAL.has(t)) { modal = t; return 'modal'; }
      if (t === 'to') return 'to';
      if (t === 'being') return 'being';
      if (BE_SEMUA.has(t)) return 'be';
      if (HAVE_FINIT.has(t)) return 'perfect';
      if (DO.has(t)) return 'do';
      if (utama(t)) { utamaAda = true; utamaSalah = true; return 'utama'; }
      return s;
    };
    const salah = (pesan: string) => { err.push(pesan); s = lanjut(); };
    const tak = `${kap(t)} tidak dikenali dalam rangkaian verb.`;
    switch (s) {
      case 'awal':
        if (MODAL.has(t)) { modal = t; s = 'modal'; }
        else if (BE_FINIT.has(t)) { if (kopula) { s = 'utama'; utamaAda = true; } else s = 'be'; }
        else if (HAVE_FINIT.has(t)) s = 'perfect';
        else if (DO.has(t)) s = 'do';
        else if (v && (t === v.s || t === v.lema || t === v.v2)) { s = 'utama'; utamaAda = true; }
        else salah(`${kap(t)} tidak dapat menjadi verb utama tanpa auxiliary yang sesuai; kalimat ini belum memiliki verb finit.`);
        break;
      case 'modal':
        if (t === 'be') s = 'be';
        else if (t === 'have') s = 'perfect';
        else if (v && t === v.lema) { s = 'utama'; utamaAda = true; }
        else if (t === 'to') salah(`${kap(modal)} tidak diikuti to; setelah modal langsung dipakai bentuk dasar.`);
        else if (t === 'been' || t === 'being') salah(`${kap(t)} tidak dapat langsung mengikuti ${modal}.`);
        else if (HAVE_FINIT.has(t)) salah(`${kap(t)} tidak dapat mengikuti ${modal}; setelah modal dipakai bentuk dasar have.`);
        else if (BE_FINIT.has(t)) salah(`${kap(t)} tidak dapat mengikuti ${modal}; setelah modal dipakai bentuk dasar be.`);
        else if (v && (t === v.v3 || t === v.v2)) salah(penerima
          ? `${kap(t)} tidak dapat langsung mengikuti ${modal}; passive memerlukan ${modal} be ${v.v3}.`
          : `${kap(t)} tidak dapat mengikuti ${modal}; setelah modal diperlukan bentuk dasar ${v.lema}.`);
        else if (v && t === v.s) salah(`Setelah ${modal}, verb tidak berakhiran -s; gunakan ${v.lema}.`);
        else if (v && t === v.ing) salah(`${kap(t)} tidak dapat langsung mengikuti ${modal}; setelah modal diperlukan bentuk dasar ${v.lema}.`);
        else salah(tak);
        break;
      case 'to':
        if (t === 'be') s = 'be';
        else if (t === 'have') s = 'perfect';
        else if (v && t === v.lema) { s = 'utama'; utamaAda = true; }
        else salah(`Setelah to diperlukan bentuk dasar${v ? ` ${v.lema}` : ''}, bukan ${t}.`);
        break;
      case 'perfect':
        if (t === 'been') s = 'be';
        else if (v && t === v.v3) { s = 'utama'; utamaAda = true; }
        else if (t === 'be' || t === 'being') salah(`${kap(t)} tidak dapat mengikuti ${sebelum}; bentuk perfect memakai ${sebelum} been.`);
        else if (v && utama(t)) salah(`${kap(t)} bukan V3; setelah ${sebelum} diperlukan V3 (${v.v3}).`);
        else salah(tak);
        break;
      case 'be':
        if (t === 'being' && BE_FINIT.has(sebelum)) s = 'being';
        else if (v && t === v.v3) { s = 'utama'; utamaAda = true; pasif = true; }
        else if (v && t === v.ing) { s = 'utama'; utamaAda = true; }
        else if (BE_SEMUA.has(t) || t === 'being') salah(`${kap(t)} tidak dapat mengikuti ${sebelum}.`);
        else if (v && utama(t)) salah(`${kap(t)} belum berbentuk V3; setelah ${sebelum} diperlukan V3 (${v.v3}).`);
        else salah(tak);
        break;
      case 'being':
        if (v && t === v.v3) { s = 'utama'; utamaAda = true; pasif = true; }
        else if (v && utama(t)) salah(`${kap(t)} belum berbentuk V3; setelah being diperlukan V3 (${v.v3}).`);
        else salah(tak);
        break;
      case 'do':
        if (v && t === v.lema) { s = 'utama'; utamaAda = true; }
        else if (v && (t === v.v2 || t === v.v3)) salah(penerima
          ? `${kap(sebelum)} tidak membentuk passive, dan ${t} tidak dapat mengikuti ${sebelum}.`
          : `${kap(t)} tidak dapat mengikuti ${sebelum}; setelah ${sebelum} diperlukan V1 (${v.lema}).`);
        else if (v && t === v.s) salah(`Setelah ${sebelum} diperlukan V1 (${v.lema}), bukan bentuk berakhiran -s.`);
        else salah(tak);
        break;
      case 'utama':
        err.push(`Rangkaian verb tidak dikenali setelah ${sebelum}.`);
        break;
    }
    sebelum = t;
  }
  if (!utamaAda) err.push('Rangkaian verb belum memiliki verb utama.');

  // Voice: dinilai hanya bila verb utama diterima tanpa kesalahan bentuk (kesalahan bentuk di verb utama sudah menjelaskannya).
  if (!kopula && v && utamaAda && !utamaSalah) {
    const rantai = toks.join(' ');
    if (penerima && !pasif) {
      const aux = toks.find((t) => DO.has(t));
      const sebelumUtama = toks[toks.length - 2];
      if (aux) err.push(`${kap(aux)} tidak membentuk passive; ${inti} menerima tindakan, sehingga diperlukan be + V3 (${v.v3}).`);
      else if (toks[toks.length - 1] === v.ing) err.push(`${kap(rantai)} bermakna aktif (subjek sedang melakukan tindakan), padahal ${inti} menerima tindakan; passive memerlukan be + V3 (${v.v3}).`);
      else if (sebelumUtama && (HAVE_FINIT.has(sebelumUtama) || sebelumUtama === 'have')) {
        err.push(`${kap(rantai)} tanpa been bermakna aktif, padahal ${inti} menerima tindakan; passive memerlukan been sebelum ${v.v3}.`);
      } else err.push(`${kap(rantai)} bermakna aktif, padahal ${inti} menerima tindakan; passive memerlukan be + V3 (${v.v3}).`);
    } else if (!penerima && pasif) err.push(`Bentuk passive ${rantai} tidak sesuai karena ${inti} melakukan tindakan.`);
  }
  return { kesalahan: err, pasif };
}

function namaPola(toks: string[], pasif: boolean): { pola: string; nama: string } {
  const f = toks[0];
  if (MODAL.has(f)) {
    if (toks[1] === 'have') return pasif ? { pola: `${f} + have + been + V3`, nama: 'passive dengan modal perfect' } : { pola: `${f} + have + V3`, nama: 'modal perfect' };
    return pasif ? { pola: `${f} + be + V3`, nama: 'passive dengan modal' } : { pola: `${f} + V1`, nama: 'modal + bentuk dasar' };
  }
  if (HAVE_FINIT.has(f)) return pasif ? { pola: `${f} + been + V3`, nama: f === 'had' ? 'past perfect passive' : 'present perfect passive' } : { pola: `${f} + V3`, nama: 'perfect' };
  if (BE_FINIT.has(f) && pasif) return toks[1] === 'being' ? { pola: `${f} + being + V3`, nama: 'passive progressive' } : { pola: `${f} + V3`, nama: 'passive' };
  if (DO.has(f)) return { pola: `${f} + V1`, nama: 'do-support' };
  return { pola: 'verb finit', nama: 'verb finit' };
}

function relasiRantai(k: Klausa, s: UnsurSubjek, toks: string[]): Relasi {
  const kunci = `rantai:${k.id}`;
  const inti = frasaInti(s);
  const h = uraiRantai(toks, k, inti);
  if (h.kesalahan.length) return relasi(kunci, 'rantai', h.kesalahan);
  const rantai = toks.join(' ');
  const { pola, nama } = namaPola(toks, h.pasif);
  // Auxiliary dijadikan kata kunci bila ia penentu bentuk (modal, have/has/had, atau rangkaian tiga kata seperti are being).
  const aux = toks.length > 1 && (MODAL.has(toks[0]) || HAVE_FINIT.has(toks[0]) || toks.length > 2) ? toks.slice(0, -1).join(' ') : '';
  const kataKunci = [...(aux ? [aux] : []), inti];
  if (k.peran === 'penerima' && h.pasif) return relasi(kunci, 'rantai', [], `${kap(inti)} menerima tindakan, sehingga diperlukan ${nama}: pola ${pola} (${rantai}).`, kataKunci, `${pola} (${rantai})`);
  if (MODAL.has(toks[0])) return relasi(kunci, 'rantai', [], `Setelah ${toks[0]}, verb dipakai dalam bentuk dasar tanpa to dan tanpa akhiran: ${rantai}.`, kataKunci, `${pola} (${rantai})`);
  if (toks.length === 1) {
    return relasi(kunci, 'rantai', [], `${kap(rantai)} langsung menjadi verb finit klausa ini, tanpa auxiliary do/does/did.`, [], `${rantai} tanpa do/does`);
  }
  return relasi(kunci, 'rantai', [], `Rangkaian ${rantai} lengkap dan sesuai dengan subjeknya.`, kataKunci, `${pola} (${rantai})`);
}

// ——— Urutan noun clause (Azar 12-2–12-5; Materi §10) ———

function relasiUrutan(k: Klausa, unsur: Unsur[], s: UnsurSubjek, toks: string[]): Relasi {
  const kunci = `urutan:${k.id}`;
  const iS = unsur.indexOf(s);
  const iV = unsur.findIndex((u) => u.peran === 'verba' && u.klausa === k.id);
  const subj = s.teks;
  if (iV < iS) {
    const depan = unsur[iV].teks;
    const pertama = kata(depan)[0].toLowerCase();
    return relasi(kunci, 'urutan', [DO.has(pertama)
      ? `${kap(depan)} ${subj} memakai do-support dan inversi pertanyaan langsung; di dalam noun clause, subjek langsung diikuti verb tanpa ${pertama}.`
      : `${kap(depan)} ${subj} memakai inversi pertanyaan langsung; di dalam noun clause, subjek mendahului verb.`]);
  }
  const rantai = toks.join(' ');
  const verbInduk = (k.induk ?? '').replace(new RegExp(`\\s*${k.pengantar}$`), '');
  return relasi(kunci, 'urutan', [],
    `Noun clause yang diawali ${k.pengantar} (objek dari ${verbInduk}) memakai urutan pernyataan: ${k.pengantar} + subjek (${subj}) + verb (${rantai}), bukan inversi pertanyaan.`,
    [k.induk ?? '', subj].filter(Boolean), `${k.pengantar} + ${subj} + ${rantai}`);
}

// ——— Preposisi waktu (Materi §9) ———

const HARI = '(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)';
const BULAN = '(?:January|February|March|April|May|June|July|August|September|October|November|December)';
const POLA_WAKTU: { re: RegExp; prep: string; nama: string; catatan?: string }[] = [
  { re: new RegExp(`^${HARI}s?$`), prep: 'on', nama: 'nama hari' },
  { re: new RegExp(`^${HARI} (?:morning|afternoon|evening)$`), prep: 'on', nama: 'nama hari dengan bagian hari', catatan: ' Bagian hari yang melekat pada nama hari tetap memakai on, bukan in.' },
  { re: new RegExp(`^\\d{1,2} ${BULAN}(?: \\d{4})?$`), prep: 'on', nama: 'tanggal' },
  { re: new RegExp(`^${BULAN} \\d{4}$`), prep: 'in', nama: 'bulan dan tahun' },
  { re: new RegExp(`^${BULAN}$`), prep: 'in', nama: 'nama bulan' },
  { re: /^(?:19|20)\d{2}$/, prep: 'in', nama: 'tahun' },
  { re: /^(?:\d{1,2}(?:\.\d{2})? (?:a\.m\.|p\.m\.)|noon|midnight)$/, prep: 'at', nama: 'jam' },
  { re: /^the (?:morning|afternoon|evening)$/, prep: 'in', nama: 'bagian hari' },
];

/** Jenis keterangan waktu menurut penilai (dipakai juga untuk mencocokkan anotasi pembangun). */
export function jenisWaktu(ket: string): { prep: string; nama: string } | null {
  const p = POLA_WAKTU.find((x) => x.re.test(ket.trim()));
  return p ? { prep: p.prep, nama: p.nama } : null;
}

function relasiWaktu(n: number, prep: string, ket: string): Relasi {
  const kunci = `waktu:${n}`;
  const p = POLA_WAKTU.find((x) => x.re.test(ket.trim()));
  if (!p) return relasi(kunci, 'waktu', [`Keterangan waktu ${ket} tidak dikenali.`]);
  const tok = prep.trim().toLowerCase();
  if (tok !== p.prep) return relasi(kunci, 'waktu', [`${kap(tok)} tidak tepat sebelum ${p.nama} ${ket}; gunakan ${p.prep}.`]);
  return relasi(kunci, 'waktu', [], `${kap(p.nama)} ${ket} didahului ${p.prep}.${p.catatan ?? ''}`, [ket], `${ket} → ${p.prep}`);
}

// ——— Countable/uncountable dan quantifier (Azar 6-5–6-11; Materi §2) ———

const DET: Record<string, 'tunggal' | 'jamak' | 'takhitung' | 'bebas'> = {
  a: 'tunggal', an: 'tunggal',
  many: 'jamak', 'a few': 'jamak', few: 'jamak', several: 'jamak', 'very few': 'jamak', 'very many': 'jamak', 'a number of': 'jamak',
  much: 'takhitung', 'a little': 'takhitung', little: 'takhitung', 'very little': 'takhitung', 'a great deal of': 'takhitung',
  some: 'bebas', 'a lot of': 'bebas', more: 'bebas', any: 'bebas', 'plenty of': 'bebas',
};

function relasiNp(n: number, u: UnsurNp): Relasi {
  const kunci = `np:${n}`;
  const teks = u.teks.trim();
  const det = u.det.toLowerCase();
  const k = kata(teks);
  const dk = kata(det);
  if (k.slice(0, dk.length).join(' ').toLowerCase() !== det || k[k.length - 1].toLowerCase() !== u.noun.toLowerCase() || k.length <= dk.length) {
    return relasi(kunci, 'np', ['Anotasi noun phrase tidak sesuai dengan teks.']);
  }
  const e = noun(u.noun);
  const aturan = DET[det];
  if (!e || !aturan) return relasi(kunci, 'np', [`Noun phrase ${teks} tidak dikenali.`]);
  const err: string[] = [];
  if (!e.baku) err.push(`${kap(e.lema)} adalah uncountable noun dan tidak dijamakkan menjadi ${u.noun}.`);
  if (aturan === 'tunggal') {
    if (!e.hitung) err.push(`${kap(det)} memerlukan countable noun tunggal, sedangkan ${e.lema} uncountable.`);
    else if (e.jumlah === 'jamak') err.push(`${kap(det)} memerlukan noun tunggal, bukan ${u.noun}.`);
    const sesudah = k[dk.length];
    if (bunyiVokal(sesudah) !== (det === 'an')) err.push(`${kap(det)} tidak sesuai dengan bunyi awal ${sesudah}; gunakan ${det === 'an' ? 'a' : 'an'}.`);
  } else if (aturan === 'jamak') {
    if (!e.hitung) err.push(`${kap(det)} memerlukan countable noun jamak, sedangkan ${e.lema} uncountable.`);
    else if (e.jumlah === 'tunggal') err.push(`${kap(det)} memerlukan noun jamak (${e.jamak}).`);
  } else if (aturan === 'takhitung') {
    if (e.hitung) err.push(`${kap(det)} dipakai dengan uncountable noun, sedangkan ${e.lema} countable.`);
  } else if (e.hitung && e.jumlah === 'tunggal') err.push(`${kap(det)} tidak dipakai dengan countable noun tunggal ${u.noun} dalam makna jumlah.`);
  if (err.length) return relasi(kunci, 'np', err);
  const benar = !e.hitung
    ? `${kap(e.lema)} adalah uncountable noun, sehingga tetap tanpa akhiran -s dan dapat didahului ${det}: ${teks}.`
    : e.jumlah === 'jamak' ? `${kap(e.lema)} adalah countable noun; ${det} diikuti bentuk jamak: ${teks}.`
    : `${kap(e.lema)} adalah countable noun tunggal; ${det} sesuai: ${teks}.`;
  return relasi(kunci, 'np', [], benar, [u.noun], !e.hitung ? `${e.lema} (uncountable) → ${det} ${e.lema}` : `${e.lema} (countable) → ${det} ${u.noun}`);
}

// ——— Pronoun (Azar 8-1, 8-4; Materi §3) ———

const NAMA_KASUS: Record<KasusPronomina, string> = {
  subjek: 'subject pronoun',
  objek: 'object pronoun',
  penentu: 'possessive adjective yang harus diikuti noun',
  milik: 'possessive pronoun yang berdiri sendiri',
  refleksif: 'reflexive pronoun',
  kontraksi: "singkatan pronoun + is/are (it's = it is, they're = they are, who's = who is)",
};

function relasiPronomina(n: number, u: UnsurPronomina): Relasi {
  const kunci = `pronomina:${n}`;
  const tok = u.teks.trim();
  const low = tok === 'I' ? 'I' : tok.toLowerCase();
  const takBaku = PRONOMINA_TAK_BAKU[low];
  const cocok: [string, KasusPronomina][] = [];
  for (const [p, bentuk] of Object.entries(PRONOMINA)) for (const [c, b] of Object.entries(bentuk)) if (b === low || (b === "I'm" && tok === "I'm")) cocok.push([p, c as KasusPronomina]);
  // Bentuk baku pada posisi yang sesuai lebih dulu: kontraksi (it's, they're, who's) sah pada posisi pronoun + is/are.
  if (cocok.some(([, c]) => c === u.fungsi)) {
    return relasi(kunci, 'pronomina', [], `${kap(tok)} adalah ${NAMA_KASUS[u.fungsi]} dan tepat sebagai ${u.posisi}.`, [u.pemicu], `${u.pemicu} → ${tok}`);
  }
  if (takBaku) {
    const benar = PRONOMINA[takBaku.persona][u.fungsi];
    return relasi(kunci, 'pronomina', [takBaku.kasus === u.fungsi || !benar ? takBaku.catatan : `${takBaku.catatan} Posisi ${u.posisi} memerlukan ${benar}.`]);
  }
  if (!cocok.length) return relasi(kunci, 'pronomina', [`Pronoun ${tok} tidak dikenali.`]);
  const [p, c] = cocok[0];
  const benar = PRONOMINA[p][u.fungsi];
  return relasi(kunci, 'pronomina', [benar
    ? `${kap(tok)} adalah ${NAMA_KASUS[c]}; posisi ${u.posisi} memerlukan ${benar}.`
    : `${kap(tok)} tidak dapat menempati posisi ${u.posisi}.`]);
}

// ——— Penilaian satu kalimat ———

/** Nilai satu opsi: semua relasi beranotasi beserta kesalahannya. Kalimat sah bila tidak ada kesalahan sama sekali. */
export function nilaiOpsi(data: DataGcs, opsi: OpsiGcs, teks: string): HasilOpsi {
  const rel: Relasi[] = [];
  const u = opsi.unsur;
  if (render(u) !== teks) rel.push(relasi('struktur', 'struktur', ['Teks kalimat tidak sesuai dengan anotasinya.']));
  const idKlausa = new Set(data.klausa.map((k) => k.id));
  if (u.some((x) => (x.peran === 'subjek' || x.peran === 'verba') && !idKlausa.has(x.klausa))) rel.push(relasi('struktur', 'struktur', ['Unsur merujuk klausa yang tidak ada.']));
  for (const k of data.klausa) {
    const subj = u.filter((x): x is UnsurSubjek => x.peran === 'subjek' && x.klausa === k.id);
    const vb = u.filter((x) => x.peran === 'verba' && x.klausa === k.id);
    if (subj.length !== 1 || !vb.length) { rel.push(relasi(`struktur:${k.id}`, 'struktur', [`Klausa ${k.id} tidak memiliki tepat satu subjek dan verb.`])); continue; }
    const toks = vb.flatMap((x) => kata(x.teks).map((t) => t.toLowerCase()));
    const setuju = relasiSetuju(k, subj[0], toks);
    if (setuju) rel.push(setuju);
    rel.push(relasiRantai(k, subj[0], toks));
    if (k.jenis === 'nc') rel.push(relasiUrutan(k, u, subj[0], toks));
  }
  let nWaktu = 0, nNp = 0, nPron = 0;
  u.forEach((x, i) => {
    if (x.peran === 'prep-waktu') {
      const ket = u[i + 1];
      rel.push(ket?.peran === 'ket-waktu' ? relasiWaktu(nWaktu, x.teks, ket.teks) : relasi(`waktu:${nWaktu}`, 'waktu', ['Preposisi waktu tidak diikuti keterangan waktu.']));
      nWaktu++;
    } else if (x.peran === 'ket-waktu' && u[i - 1]?.peran !== 'prep-waktu') rel.push(relasi('struktur', 'struktur', ['Keterangan waktu tanpa preposisi.']));
    else if (x.peran === 'np') rel.push(relasiNp(nNp++, x));
    else if (x.peran === 'pronomina') rel.push(relasiPronomina(nPron++, x));
  });
  return { label: opsi.label, relasi: rel, kesalahan: rel.flatMap((r) => r.kesalahan) };
}

/** Nilai kelima opsi soal; urutan mengikuti `item.opsi`. Opsi yang anotasinya hilang dianggap salah struktur. */
export function nilaiSemua(data: DataGcs, opsi: { label: string; teks: string }[]): HasilOpsi[] {
  return opsi.map((o) => {
    const d = data.opsi.find((x) => x.label === o.label);
    return d ? nilaiOpsi(data, d, o.teks) : { label: o.label, relasi: [], kesalahan: ['Anotasi opsi tidak ditemukan.'] };
  });
}
