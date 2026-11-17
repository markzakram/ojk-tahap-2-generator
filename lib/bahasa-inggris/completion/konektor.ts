import type { Family } from '../../core/types';
import { chapterById } from '../../data/chapters';
import { bahasPg, kalimat, susunOpsi, type JawabanPg, type PilihanGandaItem, type Tingkat } from '../model';
import { kapital } from './leksikon';
import { berulang, INSTRUKSI, KONTEKS, periksaDasar, sisi, stimulusDari, type KodeKonteks } from './umum';

// VARIASI — connective (Blueprint §3 perluasan; Materi §13; Azar bab 17–19). Penghubung harus sesuai MAKNA hubungan
// (pertentangan, sebab, akibat, syarat, tambahan, waktu) DAN JENIS unsur sesudahnya (klausa vs noun phrase; subordinator
// vs adverb penghubung setelah titik koma). Solver: leksikon penghubung milik solver × anotasi relasi dan struktur posisi.

export type Relasi = 'kontras' | 'sebab' | 'akibat' | 'syarat' | 'syarat-negatif' | 'tambahan' | 'waktu';
type Jenis = 'subordinator' | 'preposisi' | 'adverb' | 'koordinator';
/**
 * sub-awal   : awal kalimat, diikuti klausa lalu koma dan klausa utama.
 * sub-tengah : setelah klausa utama tanpa tanda baca, diikuti klausa.
 * prep       : diikuti noun phrase (awal atau tengah kalimat).
 * titik-koma : "; ____, klausa".
 * koma       : ", ____ klausa" (menyambung dua klausa lengkap).
 */
export type PosisiKonektor = 'sub-awal' | 'sub-tengah' | 'prep' | 'titik-koma' | 'koma';

const LEKSIKON: Record<string, { relasi: Relasi[]; jenis: Jenis[]; arti: string }> = {
  although: { relasi: ['kontras'], jenis: ['subordinator'], arti: 'meskipun' },
  though: { relasi: ['kontras'], jenis: ['subordinator'], arti: 'meskipun' },
  while: { relasi: ['kontras', 'waktu'], jenis: ['subordinator'], arti: 'sementara atau meskipun' },
  whereas: { relasi: ['kontras'], jenis: ['subordinator'], arti: 'sedangkan' },
  because: { relasi: ['sebab'], jenis: ['subordinator'], arti: 'karena' },
  since: { relasi: ['sebab', 'waktu'], jenis: ['subordinator', 'preposisi'], arti: 'karena atau sejak' },
  as: { relasi: ['sebab', 'waktu'], jenis: ['subordinator'], arti: 'karena atau ketika' },
  unless: { relasi: ['syarat-negatif'], jenis: ['subordinator'], arti: 'kecuali jika' },
  if: { relasi: ['syarat'], jenis: ['subordinator'], arti: 'jika' },
  once: { relasi: ['waktu'], jenis: ['subordinator'], arti: 'begitu atau setelah' },
  when: { relasi: ['waktu'], jenis: ['subordinator'], arti: 'ketika' },
  until: { relasi: ['waktu'], jenis: ['subordinator', 'preposisi'], arti: 'sampai' },
  before: { relasi: ['waktu'], jenis: ['subordinator', 'preposisi'], arti: 'sebelum' },
  after: { relasi: ['waktu'], jenis: ['subordinator', 'preposisi'], arti: 'setelah' },
  despite: { relasi: ['kontras'], jenis: ['preposisi'], arti: 'meskipun ada' },
  during: { relasi: ['waktu'], jenis: ['preposisi'], arti: 'selama' },
  therefore: { relasi: ['akibat'], jenis: ['adverb'], arti: 'oleh karena itu' },
  consequently: { relasi: ['akibat'], jenis: ['adverb'], arti: 'akibatnya' },
  however: { relasi: ['kontras'], jenis: ['adverb'], arti: 'namun' },
  nevertheless: { relasi: ['kontras'], jenis: ['adverb'], arti: 'meskipun demikian' },
  moreover: { relasi: ['tambahan'], jenis: ['adverb'], arti: 'selain itu' },
  furthermore: { relasi: ['tambahan'], jenis: ['adverb'], arti: 'selain itu' },
  otherwise: { relasi: ['syarat-negatif'], jenis: ['adverb'], arti: 'jika tidak' },
  so: { relasi: ['akibat'], jenis: ['koordinator'], arti: 'sehingga' },
  but: { relasi: ['kontras'], jenis: ['koordinator'], arti: 'tetapi' },
  yet: { relasi: ['kontras'], jenis: ['koordinator'], arti: 'namun' },
};

/** Jenis penghubung yang secara struktur dapat mengisi posisi. */
const JENIS_SAH: Record<PosisiKonektor, Jenis[]> = {
  'sub-awal': ['subordinator'],
  'sub-tengah': ['subordinator'],
  prep: ['preposisi'],
  'titik-koma': ['adverb'],
  koma: ['koordinator', 'subordinator'],
};

const NAMA_RELASI: Record<Relasi, string> = {
  kontras: 'pertentangan', sebab: 'sebab', akibat: 'akibat', syarat: 'syarat', 'syarat-negatif': 'syarat negatif', tambahan: 'tambahan informasi', waktu: 'waktu',
};
const NAMA_JENIS: Record<Jenis, string> = {
  subordinator: 'conjunction yang diikuti klausa (subjek + verb)',
  preposisi: 'preposisi yang diikuti noun phrase',
  adverb: 'adverb penghubung yang dipakai setelah titik koma atau di awal kalimat baru',
  koordinator: 'coordinating conjunction yang menyambung dua klausa setelah koma',
};
const KEBUTUHAN: Record<PosisiKonektor, string> = {
  'sub-awal': 'sesudah bagian kosong terdapat klausa lengkap yang diikuti klausa utama',
  'sub-tengah': 'sesudah bagian kosong terdapat klausa lengkap',
  prep: 'sesudah bagian kosong terdapat noun phrase, bukan klausa',
  'titik-koma': 'bagian kosong berada setelah titik koma dan diikuti koma, sehingga diperlukan adverb penghubung',
  koma: 'bagian kosong menyambung dua klausa lengkap setelah koma',
};

export interface KerangkaKonektor {
  id: string;
  tingkat: Tingkat;
  konteks: KodeKonteks;
  teks: string;
  kunci: string;
  /** Pengecoh yang ditolak (struktur atau relasi); diacak tiga. */
  ditolak: string[];
  posisi: PosisiKonektor;
  relasi: Relasi;
  petunjuk: string[];
  /** Hubungan makna kedua bagian kalimat, bahasa Indonesia. */
  hubungan: string;
}

export interface DataKonektor { kerangka: string; posisi: PosisiKonektor; relasi: Relasi; petunjuk: string[]; hubungan: string }
type ItemKonektor = PilihanGandaItem<DataKonektor>;

/** Kata pembuka noun phrase (determiner/adjective) yang diterima solver setelah preposisi. */
const PEMBUKA_FRASA = new Set(['the', 'a', 'an', 'its', 'their', 'his', 'her', 'our', 'this', 'these', 'those', 'some', 'heavy', 'strong']);

/** Periksa anotasi posisi terhadap tanda baca dan kata di sekitar bagian kosong. */
function posisiSah(item: ItemKonektor): boolean {
  const i = item.stimulus.findIndex((p) => p.gaya === 'kosong');
  const kiri = item.stimulus.slice(0, i).map((p) => p.teks).join('');
  const kanan = item.stimulus.slice(i + 1).map((p) => p.teks).join('');
  const { kiri: tk, kanan: tn } = sisi(item);
  switch (item.data.posisi) {
    case 'sub-awal': return tk.length === 0 && kanan.indexOf(',') > 10;
    case 'prep': return PEMBUKA_FRASA.has(tn[0] ?? '') && !/^,/.test(kanan);
    case 'sub-tengah': return tk.length > 0 && !/[,;]\s*$/.test(kiri) && tn.length >= 3;
    case 'titik-koma': return /;\s*$/.test(kiri) && /^,/.test(kanan);
    case 'koma': return /,\s*$/.test(kiri) && !/^,/.test(kanan);
  }
}

const cocok = (w: string, d: DataKonektor) => {
  const e = LEKSIKON[w.toLowerCase()];
  return !!e && e.jenis.some((j) => JENIS_SAH[d.posisi].includes(j)) && e.relasi.includes(d.relasi);
};

export function familyKonektor(kerangka: KerangkaKonektor[]): Family<ItemKonektor, JawabanPg> {
  const id = 'SC-KONEKTOR';
  return {
    id,
    versi: 2,
    nama: 'Connective: makna dan struktur',
    chapter: chapterById('sentence-completion'),
    label: 'VARIASI',
    sumber: 'Blueprint Bahasa Inggris §3 (perluasan: connective), Materi §13 · Azar bab 17–19',
    ringkas: 'Empat penghubung (although/because/despite/therefore …). Kunci harus cocok dengan hubungan makna kedua bagian kalimat dan dengan jenis unsur sesudahnya (klausa, noun phrase, atau klausa setelah titik koma).',

    bangun(r) {
      const f = r.pick(kerangka);
      const pengecoh = r.sample(f.ditolak, 3);
      const { opsi, kunci } = susunOpsi(r.shuffle, f.kunci, pengecoh, (x) => x);
      const item: ItemKonektor = {
        jenis: 'pilihan-ganda', instruksi: INSTRUKSI, stimulus: stimulusDari(f.teks), opsi,
        tingkat: f.tingkat, kaidah: `connective-${f.relasi}`, konteks: KONTEKS[f.konteks],
        data: { kerangka: f.id, posisi: f.posisi, relasi: f.relasi, petunjuk: f.petunjuk, hubungan: f.hubungan },
      };
      return { item, jawaban: kunci };
    },

    pecahkan(item) {
      if (!posisiSah(item)) return [];
      return item.opsi.filter((o) => cocok(o.teks, item.data)).map((o) => o.label);
    },

    kunci: (j) => j,

    periksa(item) {
      const m = periksaDasar(item);
      const teks = kalimat(item.stimulus, '____');
      for (const o of item.opsi) {
        if (!LEKSIKON[o.teks.toLowerCase()]) m.push(`penghubung "${o.teks}" tidak dikenal leksikon`);
        if (berulang(item, o.teks)) m.push(`penghubung "${o.teks}" berulang dari kalimat`);
      }
      const awal = item.stimulus[0].teks.trim() === '';
      if (item.opsi.some((o) => (o.teks[0] === o.teks[0].toUpperCase()) !== awal)) m.push('kapitalisasi opsi tidak seragam dengan posisi');
      for (const p of item.data.petunjuk) if (!teks.includes(p)) m.push(`petunjuk "${p}" tidak ada di kalimat`);
      return m;
    },

    bahas(item, j) {
      const d = item.data;
      const k = item.opsi.find((o) => o.label === j);
      if (!k || !posisiSah(item)) return null;
      const ek = LEKSIKON[k.teks.toLowerCase()];
      const jenisK = ek.jenis.find((x) => JENIS_SAH[d.posisi].includes(x))!;
      const opsiSalah: Record<string, string> = {};
      for (const o of item.opsi) {
        if (o.label === j) continue;
        const e = LEKSIKON[o.teks.toLowerCase()];
        const strukturOk = e.jenis.some((x) => JENIS_SAH[d.posisi].includes(x));
        const relasiOk = e.relasi.includes(d.relasi);
        const bagian: string[] = [];
        if (!strukturOk) bagian.push(`${kapital(o.teks)} adalah ${NAMA_JENIS[e.jenis[0]]}, padahal ${KEBUTUHAN[d.posisi]}`);
        else if (!relasiOk) bagian.push(`${kapital(o.teks)} menyatakan ${e.relasi.map((x) => NAMA_RELASI[x]).join(' atau ')} (${e.arti}), padahal ${d.hubungan}`);
        opsiSalah[o.label] = bagian.join('; ') + '.';
      }
      return bahasPg({
        item, kunci: j,
        konsep: `Connective ${NAMA_RELASI[d.relasi]} dan struktur sesudahnya`,
        kataKunci: d.petunjuk.join('; '),
        alasan: [
          `${kapital(k.teks)} (${ek.arti}) adalah ${NAMA_JENIS[jenisK]} dan menyatakan ${NAMA_RELASI[d.relasi]}. Hubungannya: ${d.hubungan}; ${KEBUTUHAN[d.posisi]}.`,
          `Kalimat lengkap: ${kalimat(item.stimulus, k.teks)}`,
        ],
        opsiSalah,
        caraCepat: 'Lakukan dua pemeriksaan: (1) hubungan makna kedua bagian kalimat — pertentangan, sebab, akibat, syarat, atau tambahan; (2) unsur sesudah bagian kosong — klausa, noun phrase, atau klausa setelah titik koma.',
      });
    },

    sidik: (item, j) => `${id}|${item.data.kerangka}|${item.opsi.find((o) => o.label === j)?.teks.toLowerCase()}`,
  };
}
