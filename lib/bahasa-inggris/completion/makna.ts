import type { Family } from '../../core/types';
import { chapterById } from '../../data/chapters';
import { bahasPg, kalimat, susunOpsi, type JawabanPg, type PilihanGandaItem, type Tingkat } from '../model';
import { analisis, arti, kapital, NAMA_KELAS } from './leksikon';
import { berulang, cocokSlot, INSTRUKSI, KONTEKS, NAMA_SLOT, periksaDasar, stimulusDari, type KodeKonteks, type Slot } from './umum';

// Pola teramati Sentence Completion (Blueprint Bahasa Inggris bagian 3, "Pola teramati: makna kata dan kolokasi"):
// adjective dalam konteks, noun dan tujuan/hubungan abstrak, verb dan preposisi/kolokasi.
//
// Setiap kerangka adalah MATRIKS KETERTERIMAAN yang dikurasi: kata sasaran, petunjuk makna yang terlihat di kalimat,
// daftar kata yang DITERIMA (sinonim dekat yang wajar bagi penutur asli; tidak pernah dijadikan pengecoh), dan kumpulan
// kata yang DITOLAK beserta alasannya. Pengecoh diacak dari kumpulan ditolak; sidik = family + kerangka + kata sasaran.

/**
 * Alasan kata ditolak: 'm' = makna tidak sesuai dengan gagasan yang dibutuhkan, 'a' = arah hubungan berlawanan dengan
 * petunjuk, 'k' = tidak membentuk kolokasi dengan kata pasangannya. Teks lain = alasan khusus yang ditulis utuh.
 */
export type AlasanTolak = 'm' | 'a' | 'k' | string;

export interface KerangkaMakna {
  id: string;
  tingkat: Tingkat;
  konteks: KodeKonteks;
  kaidah: string;
  slot: Slot;
  /** Kalimat dengan tepat satu `___`. */
  teks: string;
  kunci: string;
  /** Kata lain yang dapat diterima pada posisi ini (dikecualikan dari pengecoh). */
  diterima: string[];
  ditolak: Record<string, AlasanTolak>;
  /** Bagian kalimat yang menjadi petunjuk (harus muncul persis di kalimat). */
  petunjuk: string[];
  /** Gagasan yang dibutuhkan bagian kosong, dalam bahasa Indonesia, mis. "cakupan yang menyeluruh". */
  gagasan: string;
  /** Kata pasangan kolokasi, mis. "with" atau "of". */
  pasangan?: string;
  konsep: string;
  /** Alasan kunci tepat (setelah "<Kunci> berarti <arti>."). */
  alasan: string;
  caraCepat?: string;
}

/** Anotasi yang dibawa soal: matriks keterterimaan untuk opsi yang tampil. */
export interface DataMakna {
  kerangka: string;
  slot: Slot;
  diterima: string[];
  ditolak: Record<string, AlasanTolak>;
  petunjuk: string[];
  gagasan: string;
  pasangan?: string;
  konsep: string;
  alasan: string;
  caraCepat: string;
}

type ItemMakna = PilihanGandaItem<DataMakna>;

const kecil = (s: string) => s.trim().toLowerCase();

function alasanSalah(d: DataMakna, kata: string): string {
  const kode = d.ditolak[kecil(kata)];
  const a = arti(kata);
  const K = kapital(kata);
  if (kode === 'm') return `${K} berarti ${a}; makna ini tidak menyatakan ${d.gagasan}.`;
  if (kode === 'a') return `${K} berarti ${a}; arahnya berlawanan dengan petunjuk "${d.petunjuk[0]}".`;
  if (kode === 'k') return `${K} berarti ${a}, tetapi tidak berpasangan dengan "${d.pasangan}" untuk menyatakan ${d.gagasan}.`;
  return kode;
}

export function familyMakna(cfg: { id: string; nama: string; sumber: string; ringkas: string; kerangka: KerangkaMakna[]; caraCepat: string }): Family<ItemMakna, JawabanPg> {
  const { id, kerangka } = cfg;
  const ids = new Set<string>();
  for (const f of kerangka) {
    if (ids.has(f.id)) throw new Error(`${id}: id kerangka ganda ${f.id}`);
    ids.add(f.id);
    if (Object.keys(f.ditolak).length < 3) throw new Error(`${id}/${f.id}: kumpulan ditolak kurang dari tiga`);
  }
  return {
    id,
    versi: 1,
    nama: cfg.nama,
    chapter: chapterById('sentence-completion'),
    label: 'SHL',
    sumber: cfg.sumber,
    ringkas: cfg.ringkas,

    bangun(r) {
      const f = r.pick(kerangka);
      const pengecoh = r.sample(Object.keys(f.ditolak), 3);
      const { opsi, kunci } = susunOpsi(r.shuffle, f.kunci, pengecoh, (x) => x);
      const item: ItemMakna = {
        jenis: 'pilihan-ganda',
        instruksi: INSTRUKSI,
        stimulus: stimulusDari(f.teks),
        opsi,
        tingkat: f.tingkat,
        kaidah: f.kaidah,
        konteks: KONTEKS[f.konteks],
        data: {
          kerangka: f.id,
          slot: f.slot,
          diterima: [f.kunci, ...f.diterima].map(kecil),
          ditolak: Object.fromEntries(pengecoh.map((w) => [kecil(w), f.ditolak[w]])),
          petunjuk: f.petunjuk,
          gagasan: f.gagasan,
          pasangan: f.pasangan,
          konsep: f.konsep,
          alasan: f.alasan,
          caraCepat: f.caraCepat ?? cfg.caraCepat,
        },
      };
      return { item, jawaban: kunci };
    },

    // Solver: opsi benar ⇔ (1) leksikon solver mengenalinya dengan kelas + infleksi yang dituntut posisi kosong, dan
    // (2) matriks keterterimaan kerangka menerimanya, dan (3) tidak tercatat ditolak. Harus tepat satu.
    pecahkan(item) {
      const d = item.data;
      return item.opsi
        .filter((o) => {
          const w = kecil(o.teks);
          return analisis(w).some((a) => cocokSlot(a, d.slot)) && d.diterima.includes(w) && !(w in d.ditolak);
        })
        .map((o) => o.label);
    },

    kunci: (j) => j,

    periksa(item, j) {
      const d = item.data;
      const m = periksaDasar(item);
      const teks = kalimat(item.stimulus, '____');
      for (const o of item.opsi) {
        const w = kecil(o.teks);
        if (!analisis(w).length) m.push(`kata "${w}" tidak dikenal leksikon`);
        else if (!analisis(w).some((a) => cocokSlot(a, d.slot))) m.push(`opsi "${w}" tidak sekelas/infleksi dengan ${NAMA_SLOT[d.slot]}`);
        if (o.label !== j && !(w in d.ditolak)) m.push(`opsi "${w}" tanpa alasan ditolak`);
        if (berulang(item, w)) m.push(`opsi "${w}" berulang dari kalimat`);
      }
      if (d.diterima.some((w) => w in d.ditolak)) m.push('kata yang sama diterima sekaligus ditolak');
      for (const p of d.petunjuk) if (!teks.includes(p)) m.push(`petunjuk "${p}" tidak ada di kalimat`);
      // Panjang opsi mencolok: kunci jauh lebih panjang/pendek daripada semua opsi lain.
      const kunciTeks = item.opsi.find((o) => o.label === j)?.teks ?? '';
      const lain = item.opsi.filter((o) => o.label !== j).map((o) => o.teks.length);
      if (kunciTeks.length - Math.max(...lain) >= 5 || Math.min(...lain) - kunciTeks.length >= 5) m.push('panjang kunci mencolok');
      return m;
    },

    bahas(item, j) {
      const d = item.data;
      const k = item.opsi.find((o) => o.label === j);
      if (!k) return null;
      const an = analisis(k.teks).find((a) => cocokSlot(a, d.slot));
      if (!an) return null;
      const cefr = an.cefr ? ` (${NAMA_KELAS[an.kelas]}, ${an.cefr} pada daftar Oxford)` : '';
      // Bila alasan kerangka sudah diawali kunci (mis. "Comply with berarti ..."), arti leksikon tidak diulang.
      const awal = d.alasan.toLowerCase().startsWith(kecil(k.teks))
        ? (an.cefr ? `${kapital(k.teks)} tercantum sebagai ${NAMA_KELAS[an.kelas]} ${an.cefr} pada daftar Oxford. ` : '')
        : `${kapital(k.teks)}${cefr} berarti ${an.arti}. `;
      const opsiSalah: Record<string, string> = {};
      for (const o of item.opsi) if (o.label !== j) opsiSalah[o.label] = alasanSalah(d, o.teks);
      return bahasPg({
        item,
        kunci: j,
        konsep: d.konsep,
        kataKunci: d.petunjuk.join('; '),
        alasan: [`${awal}${d.alasan}`, `Kalimat lengkap: ${kalimat(item.stimulus, k.teks)}`],
        opsiSalah,
        caraCepat: d.caraCepat,
      });
    },

    sidik: (item) => `${id}|${item.data.kerangka}|${item.data.diterima[0]}`,
  };
}
