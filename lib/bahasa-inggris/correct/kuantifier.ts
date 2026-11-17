import type { Tingkat } from '../model';
import { buatFamily, tetap, varian, type KerangkaGcs } from './kerangka';
import type { Unsur, UnsurNp } from './tipe';

// Blueprint §5 (article/countability, perluasan) dan §7 (Noun, quantifier, article 6-5–6-11); Materi §2. Titik uji: noun
// phrase quantifier + noun. Uncountable (advice, equipment, feedback, information, furniture) tidak dijamakkan dan tidak
// memakai a/an, many, a few, several; countable jamak tidak memakai much/a little. Tingkat menengah: dua noun phrase.

/** Varian noun phrase: [quantifier, noun, jumlah kesalahan]. */
type VarianNp = [string, string, number];

interface SpekNp {
  id: string;
  tingkat: Tingkat;
  konteks: string;
  /** `{0}`, `{1}` = titik noun phrase. */
  templat: string;
  /** Adjective tetap di antara quantifier dan noun untuk tiap titik ('' bila tidak ada). */
  sifat: string[];
  titik: VarianNp[][];
}

const SPEK: SpekNp[] = [
  { id: 'trainer-advice', tingkat: 'dasar', konteks: 'pendidikan & pelatihan', templat: 'The trainer gave the new staff {0} about preparing the final presentation', sifat: ['useful'],
    titik: [[['some', 'advice', 0], ['a', 'advice', 1], ['some', 'advices', 1], ['many', 'advice', 1], ['a few', 'advice', 1], ['many', 'advices', 2], ['a few', 'advices', 2]]] },
  { id: 'lab-equipment', tingkat: 'dasar', konteks: 'riset', templat: 'The laboratory received {0} for the water quality project last month', sifat: ['new'],
    titik: [[['a lot of', 'equipment', 0], ['a', 'equipment', 1], ['many', 'equipment', 1], ['several', 'equipment', 1], ['a lot of', 'equipments', 1], ['many', 'equipments', 2], ['several', 'equipments', 2]]] },
  { id: 'report-errors', tingkat: 'dasar', konteks: 'laporan & data', templat: 'The reviewers found {0} in the final version of the annual report', sifat: [''],
    titik: [[['a few', 'errors', 0], ['a few', 'error', 1], ['many', 'error', 1], ['several', 'error', 1], ['a great deal of', 'errors', 1], ['a little', 'errors', 1]]] },
  { id: 'festival-feedback', tingkat: 'dasar', konteks: 'kegiatan masyarakat', templat: 'The organisers received {0} from local residents after the festival', sifat: ['positive'],
    titik: [[['a lot of', 'feedback', 0], ['a', 'feedback', 1], ['many', 'feedback', 1], ['several', 'feedback', 1], ['a lot of', 'feedbacks', 1], ['many', 'feedbacks', 2], ['several', 'feedbacks', 2]]] },
  { id: 'parking-information', tingkat: 'dasar', konteks: 'layanan pelanggan', templat: 'The help desk has {0} about the new parking rules', sifat: [''],
    titik: [[['very little', 'information', 0], ['very few', 'information', 1], ['very little', 'informations', 1], ['very many', 'information', 1], ['an', 'information', 1], ['very few', 'informations', 2], ['very many', 'informations', 2]]] },
  { id: 'office-order', tingkat: 'menengah', konteks: 'kantor & proyek', templat: 'The office ordered {0} and {1} for the training room', sifat: ['new', ''],
    titik: [
      [['some', 'furniture', 0], ['a', 'furniture', 1], ['some', 'furnitures', 1], ['many', 'furniture', 1]],
      [['a few', 'laptops', 0], ['a few', 'laptop', 1], ['a little', 'laptops', 1], ['much', 'laptops', 1]],
    ] },
  { id: 'onboarding', tingkat: 'menengah', konteks: 'pendidikan & pelatihan', templat: 'The new employees received {0} and {1} during their first week', sifat: ['', 'useful'],
    titik: [
      [['a lot of', 'advice', 0], ['an', 'advice', 1], ['a lot of', 'advices', 1], ['many', 'advice', 1]],
      [['several', 'documents', 0], ['several', 'document', 1], ['much', 'documents', 1], ['a little', 'documents', 1]],
    ] },
  { id: 'new-software', tingkat: 'dasar', konteks: 'teknologi', templat: 'The IT team installed {0} on every computer in the training room', sifat: ['new'],
    titik: [[['some', 'software', 0], ['a', 'software', 1], ['several', 'software', 1], ['some', 'softwares', 1], ['many', 'software', 1], ['several', 'softwares', 2], ['many', 'softwares', 2]]] },
  { id: 'river-samples', tingkat: 'dasar', konteks: 'riset', templat: 'The technicians tested {0} from the river before the end of the week', sifat: [''],
    titik: [[['several', 'samples', 0], ['several', 'sample', 1], ['much', 'samples', 1], ['a little', 'samples', 1], ['many', 'sample', 1], ['a few', 'sample', 1]]] },
  { id: 'trainee-feedback', tingkat: 'dasar', konteks: 'kantor & proyek', templat: 'The manager gave each trainee {0} on the first draft of the report', sifat: ['detailed'],
    titik: [[['some', 'feedback', 0], ['a', 'feedback', 1], ['some', 'feedbacks', 1], ['many', 'feedback', 1], ['a few', 'feedback', 1], ['many', 'feedbacks', 2], ['a few', 'feedbacks', 2]]] },
  { id: 'visitor-pack', tingkat: 'menengah', konteks: 'layanan pelanggan', templat: 'Each visitor pack contains {0} about the building and {1} for the guided tour', sifat: ['', ''],
    titik: [
      [['some', 'information', 0], ['an', 'information', 1], ['some', 'informations', 1], ['many', 'information', 1]],
      [['a few', 'forms', 0], ['a few', 'form', 1], ['a little', 'forms', 1], ['much', 'forms', 1]],
    ] },
  { id: 'classroom-furniture', tingkat: 'menengah', konteks: 'pendidikan & pelatihan', templat: 'The school bought {0} for the library and {1} for the new classrooms', sifat: ['', 'extra'],
    titik: [
      [['a lot of', 'furniture', 0], ['a', 'furniture', 1], ['a lot of', 'furnitures', 1], ['several', 'furniture', 1]],
      [['several', 'desks', 0], ['several', 'desk', 1], ['much', 'desks', 1], ['a little', 'desks', 1]],
    ] },
];

function wujud(s: SpekNp): KerangkaGcs {
  const pola: (Unsur | number)[] = s.templat.split(/(\{\d\})/).filter((x) => x.trim()).map((x) => (/^\{\d\}$/.test(x) ? Number(x[1]) : tetap(x.trim())));
  const titik = s.titik.map((t, i) => t.map(([det, noun, galat]) => {
    const u: UnsurNp = { teks: [det, s.sifat[i], noun].filter(Boolean).join(' '), peran: 'np', det, noun };
    return varian([u], galat);
  }));
  return {
    id: `np-${s.id}`,
    sasaran: s.titik.map((t) => t[0][1]).join('+'),
    tingkat: s.tingkat,
    konteks: s.konteks,
    kaidah: 'countable-quantifier',
    konsep: 'Countable/uncountable noun dan quantifier',
    klausa: [],
    pola,
    titik,
    uji: titik.map((_, i) => `np:${i}`),
  };
}

export const KERANGKA_KUANTIFIER: KerangkaGcs[][] = SPEK.map((s) => [wujud(s)]);

export const gcsKuantifier = buatFamily({
  id: 'GCS-KUANTIFIER',
  versi: 3,
  nama: 'Countable/uncountable dan quantifier',
  label: 'VARIASI',
  sumber: 'Blueprint Bahasa Inggris §5 (article/countability, perluasan), §7 Noun, quantifier, article · Materi §2 · Azar 6-5–6-11',
  ringkas: 'Lima kalimat yang berbeda pada noun phrase quantifier + noun (some advice, a lot of equipment, a few errors, ...). Penilai mengelompokkan noun (countable/uncountable, jamak baku/tak baku) dan quantifier (a/an, many/a few/several, much/a little, some/a lot of) lalu memeriksa kecocokannya.',
  kelompok: KERANGKA_KUANTIFIER,
  caraCepat: (rel) => `Klasifikasikan noun lebih dahulu (countable atau uncountable), lalu cocokkan quantifier-nya: ${rel.map((r) => r.ringkas).join('; ')}.`,
});
