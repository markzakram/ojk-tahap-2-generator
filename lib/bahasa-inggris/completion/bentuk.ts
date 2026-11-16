import type { Family } from '../../core/types';
import { chapterById } from '../../data/chapters';
import { bahasPg, kalimat, susunOpsi, type JawabanPg, type PilihanGandaItem, type Tingkat } from '../model';
import { analisis, arti, kapital, NAMA_KELAS, type Kelas } from './leksikon';
import { berulang, cuplikan, INSTRUKSI, KONTEKS, periksaDasar, sisi, stimulusDari, type KodeKonteks } from './umum';

// VARIASI — bentuk kata (Blueprint §3 "Perluasan berbasis buku: bentuk kata"; Materi §1 dan §15; Azar Appendix A-1–A-4).
// Opsi = empat anggota satu keluarga kata (mis. decision/decide/decisive/decisively). Solver berbasis aturan: anotasi
// posisi kosong diperiksa terhadap kata di sekitarnya, lalu diterjemahkan menjadi kelas kata yang dituntut; leksikon
// solver menentukan kelas setiap opsi; hanya satu opsi yang boleh memenuhi.

/**
 * n-inti      : inti frasa noun setelah determiner/adjective dan sebelum preposisi (the ___ of).
 * adj-pred    : complement setelah linking verb, boleh diselingi adverb penguat (remained remarkably ___).
 * adj-penguat : antara adverb penguat dan noun (a highly ___ exhibition).
 * adv-cara    : menerangkan cara tindakan verb (responded ___).
 * adv-aux     : antara auxiliary dan verb utama (has ___ completed).
 * adv-adj     : menerangkan adjective sesudahnya (___ shorter).
 * v-modal     : setelah modal (will ___).
 * v-to        : infinitive setelah verb + to (hope to ___).
 */
export type PosisiBentuk = 'n-inti' | 'adj-pred' | 'adj-penguat' | 'adv-cara' | 'adv-aux' | 'adv-adj' | 'v-modal' | 'v-to';

export interface KerangkaBentuk {
  id: string;
  tingkat: Tingkat;
  konteks: KodeKonteks;
  teks: string;
  /** Empat bentuk; yang pertama kunci. */
  opsi: [string, string, string, string];
  posisi: PosisiBentuk;
  /** Verb yang diterangkan (adv-cara) atau noun inti (adj-penguat); harus muncul di kalimat. */
  jangkar?: string;
}

export interface DataBentuk {
  kerangka: string;
  posisi: PosisiBentuk;
  jangkar?: string;
}
type ItemBentuk = PilihanGandaItem<DataBentuk>;

// Daftar milik solver.
const DETERMINER = new Set(['the', 'a', 'an', 'its', 'their', 'his', 'her', 'our', 'your', 'my', 'this', 'that', 'these', 'those', "school's", "company's"]);
const PREPOSISI = new Set(['of', 'for', 'in', 'on', 'at', 'to', 'with', 'by', 'from', 'about', 'across', 'along', 'into', 'over', 'between', 'among', 'during', 'through', 'without', 'within']);
const LINKING = new Set(['is', 'are', 'was', 'were', 'be', 'been', 'seem', 'seems', 'seemed', 'remain', 'remains', 'remained', 'become', 'becomes', 'became', 'appear', 'appears', 'appeared', 'prove', 'proves', 'proved', 'stay', 'stays', 'stayed']);
const PENGUAT = new Set(['very', 'so', 'too', 'quite', 'highly', 'extremely', 'remarkably', 'particularly', 'especially', 'surprisingly', 'fairly', 'rather', 'increasingly']);
const MODAL = new Set(['can', 'could', 'may', 'might', 'must', 'shall', 'should', 'will', 'would']);
const AUX = new Set(['has', 'have', 'had', 'is', 'are', 'was', 'were', 'be', 'been']);
const VERB_INFINITIF = new Set(['hope', 'hopes', 'hoped', 'plan', 'plans', 'planned', 'decide', 'decides', 'decided', 'aim', 'aims', 'aimed', 'want', 'wants', 'wanted', 'need', 'needs', 'needed', 'agree', 'agreed', 'intend', 'intends', 'intended', 'try', 'tries', 'tried', 'promise', 'promised', 'expect', 'expects', 'expected']);

const punyaKelas = (w: string, k: Kelas) => analisis(w).some((a) => a.kelas === k);

/** Kelas (dan bentuk verb) yang dituntut posisi, setelah anotasi diperiksa terhadap kata di sekitar bagian kosong. */
export function tuntutan(item: ItemBentuk): { kelas: Kelas; v1?: boolean } | null {
  const { kiri, kanan } = sisi(item);
  const [p1, p2] = [kiri[kiri.length - 1] ?? '', kiri[kiri.length - 2] ?? ''];
  const n1 = kanan[0] ?? '';
  const d = item.data;
  switch (d.posisi) {
    case 'n-inti':
      return (DETERMINER.has(p1) || punyaKelas(p1, 'adj')) && PREPOSISI.has(n1) ? { kelas: 'n' } : null;
    case 'adj-pred':
      return LINKING.has(p1) || (PENGUAT.has(p1) && LINKING.has(p2)) ? { kelas: 'adj' } : null;
    case 'adj-penguat':
      return PENGUAT.has(p1) && DETERMINER.has(p2) && !!d.jangkar && n1 === d.jangkar ? { kelas: 'adj' } : null;
    case 'adv-cara':
      return !!d.jangkar && kiri.includes(d.jangkar) && !LINKING.has(p1) ? { kelas: 'adv' } : null;
    case 'adv-aux':
      return AUX.has(p1) && analisis(n1).some((a) => a.kelas === 'v' && (a.bentuk === 'v3' || a.bentuk === 'ving')) ? { kelas: 'adv' } : null;
    case 'adv-adj':
      return punyaKelas(n1, 'adj') ? { kelas: 'adv' } : null;
    case 'v-modal':
      return MODAL.has(p1) ? { kelas: 'v', v1: true } : null;
    case 'v-to':
      return p1 === 'to' && VERB_INFINITIF.has(p2) ? { kelas: 'v', v1: true } : null;
  }
}

const memenuhi = (w: string, t: { kelas: Kelas; v1?: boolean }) => analisis(w).some((a) => a.kelas === t.kelas && (!t.v1 || a.bentuk === 'v1'));

const PERAN: Record<Kelas, string> = {
  n: 'noun yang menamai benda atau gagasan',
  adj: 'adjective yang menerangkan noun atau keadaan subjek',
  adv: 'adverb yang menerangkan verb, adjective, atau adverb lain',
  v: 'verb',
};

const FUNGSI: Record<Kelas, string> = {
  n: 'noun menamai benda atau gagasan',
  adj: 'adjective menerangkan noun',
  adv: 'adverb menerangkan verb, adjective, atau adverb lain',
  v: 'verb menyatakan tindakan',
};

/** Fungsi posisi kosong, untuk alasan opsi salah. */
function tujuan(item: ItemBentuk): string {
  const { kiri, kanan } = sisi(item);
  const [p1, n1] = [kiri[kiri.length - 1], kanan[0]];
  switch (item.data.posisi) {
    case 'n-inti': return `menjadi inti frasa ${p1} ____ ${n1}`;
    case 'adj-pred': return 'menerangkan keadaan subjek setelah linking verb';
    case 'adj-penguat': return `menerangkan noun ${n1}`;
    case 'adv-cara': return `menerangkan cara ${item.data.jangkar}`;
    case 'adv-aux': return `menerangkan verb ${n1}`;
    case 'adv-adj': return `menerangkan adjective ${n1}`;
    case 'v-modal': return `menjadi predikat setelah modal ${p1}`;
    case 'v-to': return 'membentuk infinitive setelah to';
  }
}

function penjelasan(item: ItemBentuk): { konsep: string; alasan: string; caraCepat: string } {
  const { kiri, kanan } = sisi(item);
  const [p1, p2, n1] = [kiri[kiri.length - 1], kiri[kiri.length - 2], kanan[0]];
  const d = item.data;
  switch (d.posisi) {
    case 'n-inti': return {
      konsep: 'Bentuk kata: noun sebagai inti frasa',
      alasan: `Bagian kosong berada setelah ${p1} dan sebelum preposisi ${n1}, sehingga posisinya adalah inti frasa noun.`,
      caraCepat: 'Determiner atau adjective + ____ + preposisi (the ____ of) hampir selalu menuntut noun.',
    };
    case 'adj-pred': return {
      konsep: 'Bentuk kata: adjective setelah linking verb',
      alasan: PENGUAT.has(p1)
        ? `${kapital(p2)} berfungsi sebagai linking verb dan ${p1} adalah adverb penguat; kata sesudahnya menerangkan keadaan subjek, jadi diperlukan adjective.`
        : `${kapital(p1)} berfungsi sebagai linking verb; kata sesudahnya menerangkan keadaan subjek, jadi diperlukan adjective.`,
      caraCepat: 'Setelah be, remain, seem, prove, atau stay yang menyatakan keadaan, pilih adjective — bukan adverb.',
    };
    case 'adj-penguat': return {
      konsep: 'Bentuk kata: adjective di antara adverb penguat dan noun',
      alasan: `Adverb ${p1} menerangkan kata berikutnya, dan kata itu menerangkan noun ${n1}; posisi ini membutuhkan adjective.`,
      caraCepat: 'Pola a/the + very/highly + ____ + noun menuntut adjective.',
    };
    case 'adv-cara': return {
      konsep: 'Bentuk kata: adverb cara',
      alasan: `Kata yang dibutuhkan menerangkan cara tindakan ${d.jangkar}, sehingga diperlukan adverb.`,
      caraCepat: 'Tanyakan "bagaimana tindakan itu dilakukan?". Jika bagian kosong menjawabnya, pilih adverb (biasanya berakhiran -ly).',
    };
    case 'adv-aux': return {
      konsep: 'Bentuk kata: adverb di antara auxiliary dan verb',
      alasan: `Bagian kosong berada di antara auxiliary ${p1} dan verb ${n1}; kata yang menerangkan verb di posisi ini adalah adverb.`,
      caraCepat: 'Auxiliary + ____ + V3/V-ing: posisi di tengah rangkaian verb diisi adverb.',
    };
    case 'adv-adj': return {
      konsep: 'Bentuk kata: adverb yang menerangkan adjective',
      alasan: `Bagian kosong menerangkan adjective ${n1}; kata yang menerangkan adjective adalah adverb.`,
      caraCepat: 'Jika kata sesudah bagian kosong adalah adjective, bagian kosong diisi adverb.',
    };
    case 'v-modal': return {
      konsep: 'Bentuk kata: verb bentuk dasar setelah modal',
      alasan: `Modal ${p1} diikuti verb bentuk dasar (V1); kalimat membutuhkan tindakan sebagai predikat.`,
      caraCepat: 'Setelah modal (can, will, must, should), pilih verb bentuk dasar.',
    };
    case 'v-to': return {
      konsep: 'Bentuk kata: verb dalam infinitive',
      alasan: `${kapital(p2)} to diikuti infinitive, yaitu to + verb bentuk dasar.`,
      caraCepat: 'Hope/plan/decide + to + V1: setelah to infinitive, pilih verb bentuk dasar.',
    };
  }
}

export function familyBentuk(kerangka: KerangkaBentuk[]): Family<ItemBentuk, JawabanPg> {
  const id = 'SC-BENTUK';
  return {
    id,
    versi: 1,
    nama: 'Bentuk kata (word form)',
    chapter: chapterById('sentence-completion'),
    label: 'VARIASI',
    sumber: 'Blueprint Bahasa Inggris §3 (perluasan: bentuk kata), Materi §1 dan §15 · Azar Appendix A-1–A-4',
    ringkas: 'Empat anggota satu keluarga kata (noun/verb/adjective/adverb). Posisi kosong (inti frasa noun, setelah linking verb, adverb cara, setelah modal, dst.) menentukan satu kelas kata.',

    bangun(r) {
      const f = r.pick(kerangka);
      const [kunciKata, ...lain] = f.opsi;
      const { opsi, kunci } = susunOpsi(r.shuffle, kunciKata, lain, (x) => x);
      const item: ItemBentuk = {
        jenis: 'pilihan-ganda', instruksi: INSTRUKSI, stimulus: stimulusDari(f.teks), opsi,
        tingkat: f.tingkat, kaidah: `bentuk-kata-${f.posisi}`, konteks: KONTEKS[f.konteks],
        data: { kerangka: f.id, posisi: f.posisi, jangkar: f.jangkar },
      };
      return { item, jawaban: kunci };
    },

    pecahkan(item) {
      const t = tuntutan(item);
      if (!t) return [];
      return item.opsi.filter((o) => memenuhi(o.teks.toLowerCase(), t)).map((o) => o.label);
    },

    kunci: (j) => j,

    periksa(item) {
      const m = periksaDasar(item);
      for (const o of item.opsi) if (!analisis(o.teks).length) m.push(`kata "${o.teks}" tidak dikenal leksikon`);
      // Keluarga kata: semua opsi berbagi dua huruf awal (awalan negatif in- diabaikan).
      const akar = item.opsi.map((o) => o.teks.toLowerCase().replace(/^in(?=ac|ef)/, '').slice(0, 2));
      if (new Set(akar).size !== 1) m.push('opsi bukan satu keluarga kata');
      if (item.opsi.some((o) => berulang(item, o.teks))) m.push('keluarga kata berulang dari kalimat');
      return m;
    },

    bahas(item, j) {
      const t = tuntutan(item);
      const k = item.opsi.find((o) => o.label === j);
      if (!t || !k) return null;
      const p = penjelasan(item);
      const opsiSalah: Record<string, string> = {};
      for (const o of item.opsi) {
        if (o.label === j) continue;
        const kelas = [...new Set(analisis(o.teks).map((a) => a.kelas))];
        const nama = kelas.map((c) => NAMA_KELAS[c]).join(' atau ');
        opsiSalah[o.label] = `${kapital(o.teks)} adalah ${nama}; ${FUNGSI[kelas[0]]}, sedangkan posisi ini membutuhkan ${NAMA_KELAS[t.kelas]}${t.v1 ? ' bentuk dasar' : ''} untuk ${tujuan(item)}.`;
      }
      return bahasPg({
        item, kunci: j, konsep: p.konsep, kataKunci: cuplikan(item, ['v-modal', 'adv-aux', 'adv-adj'].includes(item.data.posisi) ? 1 : 2),
        alasan: [`${kapital(k.teks)} adalah ${PERAN[t.kelas]}${t.v1 ? ' dalam bentuk dasar' : ''} (${arti(k.teks, t.kelas)}). ${p.alasan}`, `Kalimat lengkap: ${kalimat(item.stimulus, k.teks)}`],
        opsiSalah, caraCepat: p.caraCepat,
      });
    },

    sidik: (item, j) => `${id}|${item.data.kerangka}|${item.opsi.find((o) => o.label === j)?.teks.toLowerCase()}`,
  };
}
