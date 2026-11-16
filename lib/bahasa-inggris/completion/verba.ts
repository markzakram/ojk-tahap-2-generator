import type { Family } from '../../core/types';
import { chapterById } from '../../data/chapters';
import { bahasPg, kalimat, susunOpsi, type JawabanPg, type PilihanGandaItem, type Tingkat } from '../model';
import { analisis, kapital, type Bentuk } from './leksikon';
import { berulang, cuplikan, INSTRUKSI, KONTEKS, periksaDasar, sisi, stimulusDari, token, type KodeKonteks } from './umum';

// VARIASI — bentuk verb: tense dengan penanda waktu eksplisit, modal + V1, perfect + V3, passive be + V3, progressive
// be + V-ing, dan subject-verb agreement (Blueprint §3 perluasan; Materi §4–§7; Azar bab 1–5, 9, 11).
// Opsi = empat bentuk satu verb (termasuk is/are/was/were). Solver berbasis aturan: anotasi posisi diperiksa pada kata
// di sekitar bagian kosong, inti subjek dan penanda waktu dicari di kalimat, lalu setiap opsi diuji fiturnya.

export type PosisiVerba = 'finit' | 'modal' | 'perfect' | 'pasif' | 'progresif';

export interface KerangkaVerba {
  id: string;
  tingkat: Tingkat;
  konteks: KodeKonteks;
  kaidah: string;
  teks: string;
  /** Opsi pertama = kunci. */
  opsi: [string, string, string, string];
  posisi: PosisiVerba;
  /** Inti subjek (finit, pasif, progresif). */
  subjek?: string;
  /** Penanda waktu eksplisit (finit), harus ada di daftar milik solver. */
  penanda?: string;
}

export interface DataVerba { kerangka: string; posisi: PosisiVerba; subjek?: string; penanda?: string }
type ItemVerba = PilihanGandaItem<DataVerba>;

// --- Pengetahuan milik solver ---
const MODAL = new Set(['can', 'could', 'may', 'might', 'must', 'shall', 'should', 'will', 'would']);
const HAVE = new Set(['has', 'have', 'had']);
const BE = new Set(['is', 'are', 'was', 'were', 'be', 'been', 'being', 'am']);
const ADVERB_TENGAH = new Set(['already', 'just', 'recently', 'never', 'also', 'currently', 'still', 'always', 'often', 'now']);
const PREPOSISI = new Set(['of', 'for', 'in', 'on', 'at', 'to', 'with', 'by', 'from', 'along', 'across', 'into', 'over', 'during', 'before', 'after', 'until', 'through']);
/** Jumlah inti subjek. */
const JUMLAH: Record<string, 'sg' | 'pl'> = {
  garden: 'sg', team: 'sg', books: 'pl', winners: 'pl', technicians: 'pl', visitors: 'pl', library: 'sg', list: 'sg', results: 'pl',
  each: 'sg', museum: 'sg', performance: 'sg', company: 'sg', benches: 'pl', application: 'sg', schools: 'pl', members: 'pl', town: 'sg',
  forms: 'pl', report: 'sg', committee: 'sg', samples: 'pl', office: 'sg', volunteers: 'pl', shop: 'sg',
};
const PENANDA_LAMPAU = [/\blast (year|week|month|night|spring|summer|autumn|winter)\b/, /\byesterday\b/, /\bago\b/, /\bin (1[89]\d\d|20[0-2]\d)\b/];
const PENANDA_KINI = [/\bthese days\b/, /\bnowadays\b/, /\bat present\b/, /\bcurrently\b/];

type Waktu = 'kini' | 'lampau';
/** Fitur satu bentuk: finit (dengan waktu dan jumlah) atau nonfinit. */
interface Fitur { bentuk: string; finit: boolean; waktu?: Waktu; jumlah?: 'sg' | 'pl' | 'semua' }

function fitur(kata: string): Fitur[] {
  const w = kata.toLowerCase();
  const BE_FITUR: Record<string, Fitur[]> = {
    is: [{ bentuk: 'is', finit: true, waktu: 'kini', jumlah: 'sg' }],
    are: [{ bentuk: 'are', finit: true, waktu: 'kini', jumlah: 'pl' }],
    was: [{ bentuk: 'was', finit: true, waktu: 'lampau', jumlah: 'sg' }],
    were: [{ bentuk: 'were', finit: true, waktu: 'lampau', jumlah: 'pl' }],
    be: [{ bentuk: 'v1', finit: false }],
    being: [{ bentuk: 'ving', finit: false }],
    been: [{ bentuk: 'v3', finit: false }],
  };
  if (BE_FITUR[w]) return BE_FITUR[w];
  const hasil: Fitur[] = [];
  for (const a of analisis(w)) {
    if (a.kelas !== 'v') continue;
    const b: Bentuk = a.bentuk;
    if (b === 'vs') hasil.push({ bentuk: b, finit: true, waktu: 'kini', jumlah: 'sg' });
    else if (b === 'v2') hasil.push({ bentuk: b, finit: true, waktu: 'lampau', jumlah: 'semua' });
    else if (b === 'v1') { hasil.push({ bentuk: b, finit: false }); hasil.push({ bentuk: 'v1-kini', finit: true, waktu: 'kini', jumlah: 'pl' }); }
    else hasil.push({ bentuk: b, finit: false });
  }
  return hasil;
}

interface Tuntutan { jenis: PosisiVerba; aux?: string; waktu?: Waktu; jumlah?: 'sg' | 'pl'; penanda?: string; objek?: string; /** Ada modifier antara inti subjek dan bagian kosong. */ jarak?: boolean }

/** Tuntutan posisi yang diturunkan dari kalimat; null bila anotasi tidak sesuai dengan kata di sekitar bagian kosong. */
export function tuntutanVerba(item: ItemVerba): Tuntutan | null {
  const { kiri, kanan } = sisi(item);
  const d = item.data;
  const p1 = kiri[kiri.length - 1] ?? '';
  const p2 = kiri[kiri.length - 2] ?? '';
  const auxDekat = (S: Set<string>) => (S.has(p1) ? p1 : ADVERB_TENGAH.has(p1) && S.has(p2) ? p2 : null);
  const jumlah = d.subjek ? JUMLAH[d.subjek] : undefined;
  if (d.subjek && (!jumlah || !kiri.includes(d.subjek))) return null;
  switch (d.posisi) {
    case 'modal': return MODAL.has(p1) ? { jenis: 'modal', aux: p1 } : null;
    case 'perfect': { const a = auxDekat(HAVE); return a ? { jenis: 'perfect', aux: a } : null; }
    case 'pasif': { const a = auxDekat(BE); return a && (PREPOSISI.has(kanan[0] ?? '') || !kanan.length) ? { jenis: 'pasif', aux: a, jumlah } : null; }
    case 'progresif': {
      const a = auxDekat(BE);
      const akhir = kanan.findIndex((w) => PREPOSISI.has(w));
      const objek = kanan.slice(0, akhir < 0 ? 4 : Math.min(akhir, 4)).join(' ');
      return a && objek ? { jenis: 'progresif', aux: a, objek } : null;
    }
    case 'finit': {
      if (!jumlah || MODAL.has(p1) || HAVE.has(p1) || BE.has(p1)) return null;
      const teks = token(kalimat(item.stimulus, '')).join(' ');
      let waktu: Waktu | undefined;
      if (d.penanda) {
        const p = d.penanda.toLowerCase();
        if (!teks.includes(p)) return null;
        if (PENANDA_LAMPAU.some((r) => r.test(p))) waktu = 'lampau';
        else if (PENANDA_KINI.some((r) => r.test(p))) waktu = 'kini';
        else return null;
      }
      return { jenis: 'finit', jumlah, waktu, penanda: d.penanda, jarak: kiri[kiri.length - 1] !== d.subjek };
    }
  }
}

function sah(f: Fitur, t: Tuntutan): boolean {
  switch (t.jenis) {
    case 'modal': return f.bentuk === 'v1';
    case 'perfect': return f.bentuk === 'v3';
    case 'pasif': return f.bentuk === 'v3';
    case 'progresif': return f.bentuk === 'ving';
    case 'finit': return f.finit && (f.jumlah === 'semua' || f.jumlah === t.jumlah) && (!t.waktu || f.waktu === t.waktu);
  }
}

const NAMA_BENTUK: Record<string, string> = {
  is: 'bentuk present be untuk subjek tunggal', are: 'bentuk present be untuk subjek jamak', was: 'bentuk lampau be untuk subjek tunggal', were: 'bentuk lampau be untuk subjek jamak',
  v1: 'bentuk dasar (V1)', 'v1-kini': 'bentuk dasar (V1)', vs: 'bentuk present orang ketiga tunggal (V1 + -s)', v2: 'bentuk lampau (V2)', v3: 'past participle (V3)', ving: 'bentuk -ing',
};
const namaFitur = (fs: Fitur[]) => [...new Set(fs.map((f) => NAMA_BENTUK[f.bentuk]))].join(' atau ');
const JML = { sg: 'tunggal', pl: 'jamak' } as const;

function alasanKunci(t: Tuntutan, d: DataVerba): string {
  switch (t.jenis) {
    case 'modal': return `Setelah modal ${t.aux} diperlukan verb bentuk dasar (V1).`;
    case 'perfect': return `Setelah ${t.aux} pada bentuk perfect diperlukan past participle (V3).`;
    case 'pasif': return `Subjek ${d.subjek} menerima tindakan dan tidak ada objek sesudah bagian kosong, sehingga ${t.aux} + V3 membentuk passive.`;
    case 'progresif': return `${kapital(t.aux!)} diikuti objek "${t.objek}", jadi subjek ${d.subjek} sedang melakukan tindakan: ${t.aux} + V-ing (progressive aktif).`;
    case 'finit': {
      const waktu = t.waktu === 'lampau' ? `Penanda ${t.penanda} menunjukkan kejadian lampau yang sudah selesai, sehingga diperlukan bentuk lampau.`
        : t.waktu === 'kini' ? `Penanda ${t.penanda} menunjukkan keadaan sekarang, sehingga diperlukan simple present.` : '';
      const modifier = t.jarak ? ` Frasa sesudah ${d.subjek} hanya menerangkan inti subjek dan tidak mengubah jumlahnya.` : '';
      return `Bagian kosong adalah verb utama dengan inti subjek ${d.subjek} (${JML[t.jumlah!]}).${modifier} ${waktu}`.trim();
    }
  }
}

function alasanSalah(fs: Fitur[], t: Tuntutan, d: DataVerba, kata: string): string {
  const K = `${kapital(kata)} adalah ${namaFitur(fs)}`;
  switch (t.jenis) {
    case 'modal': return `${K}; setelah modal ${t.aux} tidak dipakai bentuk ini, hanya V1.`;
    case 'perfect': return `${K}; setelah ${t.aux} pada bentuk perfect diperlukan V3.`;
    case 'pasif': return fs.some((f) => f.bentuk === 'ving')
      ? `${K}; ${t.aux} + V-ing membentuk progressive aktif yang memerlukan objek, padahal subjek ${d.subjek} menerima tindakan.`
      : `${K}; passive memerlukan ${t.aux} + V3.`;
    case 'progresif': return fs.some((f) => f.bentuk === 'v3')
      ? `${K}; ${t.aux} + V3 membentuk passive, padahal sesudah bagian kosong ada objek "${t.objek}".`
      : `${K}; tindakan yang sedang berlangsung memerlukan ${t.aux} + V-ing.`;
    case 'finit': {
      const finit = fs.filter((f) => f.finit);
      if (!finit.length) return `${K}; bentuk ini tidak dapat menjadi verb utama tanpa auxiliary.`;
      const salahJumlah = finit.every((f) => f.jumlah !== 'semua' && f.jumlah !== t.jumlah);
      const salahWaktu = !!t.waktu && finit.every((f) => f.waktu !== t.waktu);
      const bagian: string[] = [];
      if (salahWaktu) bagian.push(`tidak sesuai dengan penanda waktu ${t.penanda}`);
      if (salahJumlah) bagian.push(`tidak sesuai dengan inti subjek ${d.subjek} yang ${JML[t.jumlah!]}`);
      return `${K}; ${bagian.join(' dan ') || 'bentuk ini tidak memenuhi tuntutan posisi'}.`;
    }
  }
}

const CARA_CEPAT: Record<PosisiVerba, string> = {
  finit: 'Temukan inti subjek (abaikan frasa of ... di belakangnya) dan penanda waktu, lalu cocokkan jumlah dan tense verb utama.',
  modal: 'Setelah modal, selalu pilih verb bentuk dasar tanpa -s, -ed, atau -ing.',
  perfect: 'Has/have/had (boleh diselingi already/just) selalu diikuti V3; hafalkan V3 tak beraturan seperti written, begun, chosen.',
  pasif: 'Tanyakan apakah subjek melakukan atau menerima tindakan. Jika menerima dan tidak ada objek, pilih be + V3.',
  progresif: 'Jika sesudah bagian kosong ada objek, subjek adalah pelaku: be + V-ing.',
};

export function familyVerba(kerangka: KerangkaVerba[]): Family<ItemVerba, JawabanPg> {
  const id = 'SC-VERBA';
  return {
    id,
    versi: 1,
    nama: 'Bentuk verb: tense, passive, agreement',
    chapter: chapterById('sentence-completion'),
    label: 'VARIASI',
    sumber: 'Blueprint Bahasa Inggris §3 (perluasan: tense, agreement, passive), Materi §4–§7 · Azar bab 1–5, 5-2/5-4, 9, 11-1–11-4',
    ringkas: 'Empat bentuk satu verb (V1, V1-s, V2, V3, V-ing, atau is/are/was/were). Penanda waktu eksplisit, modal, has/had, be + objek/tanpa objek, dan inti subjek menentukan satu bentuk.',

    bangun(r) {
      const f = r.pick(kerangka);
      const [kunciKata, ...lain] = f.opsi;
      const { opsi, kunci } = susunOpsi(r.shuffle, kunciKata, lain, (x) => x);
      const item: ItemVerba = {
        jenis: 'pilihan-ganda', instruksi: INSTRUKSI, stimulus: stimulusDari(f.teks), opsi,
        tingkat: f.tingkat, kaidah: f.kaidah, konteks: KONTEKS[f.konteks],
        data: { kerangka: f.id, posisi: f.posisi, subjek: f.subjek, penanda: f.penanda },
      };
      return { item, jawaban: kunci };
    },

    pecahkan(item) {
      const t = tuntutanVerba(item);
      if (!t) return [];
      return item.opsi.filter((o) => fitur(o.teks).some((f) => sah(f, t))).map((o) => o.label);
    },

    kunci: (j) => j,

    periksa(item) {
      const m = periksaDasar(item);
      for (const o of item.opsi) if (!fitur(o.teks).length) m.push(`bentuk "${o.teks}" tidak dikenal leksikon`);
      const lemma = new Set(item.opsi.map((o) => (['is', 'are', 'was', 'were', 'be', 'being', 'been'].includes(o.teks) ? 'be' : analisis(o.teks).find((a) => a.kelas === 'v')?.lemma)));
      if (lemma.size !== 1) m.push('opsi bukan bentuk satu verb');
      if (item.opsi.some((o) => o.teks.length > 3 && berulang(item, o.teks))) m.push('verb berulang dari kalimat');
      return m;
    },

    bahas(item, j) {
      const t = tuntutanVerba(item);
      const k = item.opsi.find((o) => o.label === j);
      if (!t || !k) return null;
      const d = item.data;
      const opsiSalah: Record<string, string> = {};
      for (const o of item.opsi) if (o.label !== j) opsiSalah[o.label] = alasanSalah(fitur(o.teks), t, d, o.teks);
      const fk = fitur(k.teks).filter((f) => sah(f, t));
      const { kiri } = sisi(item);
      const kataKunci = (d.posisi === 'finit'
        ? [`inti subjek ${d.subjek}`, d.penanda ? `penanda waktu ${d.penanda}` : '']
        : [cuplikan(item, ADVERB_TENGAH.has(kiri[kiri.length - 1]) ? 2 : 1), d.subjek ? `inti subjek ${d.subjek}` : '']).filter(Boolean).join('; ');
      return bahasPg({
        item, kunci: j,
        konsep: { finit: d.penanda ? 'Tense dengan penanda waktu dan subject-verb agreement' : 'Subject-verb agreement', modal: 'Modal + verb bentuk dasar', perfect: 'Perfect tense: have/has/had + V3', pasif: 'Passive voice: be + V3', progresif: 'Progressive aktif: be + V-ing' }[d.posisi],
        kataKunci,
        alasan: [`${kapital(k.teks)} adalah ${namaFitur(fk)}. ${alasanKunci(t, d)}`, `Kalimat lengkap: ${kalimat(item.stimulus, k.teks)}`],
        opsiSalah,
        caraCepat: CARA_CEPAT[d.posisi],
      });
    },

    sidik: (item, j) => `${id}|${item.data.kerangka}|${item.opsi.find((o) => o.label === j)?.teks.toLowerCase()}`,
  };
}
