import { periksaKandidat } from '../../core/engine';
import type { Rng } from '../../core/rng';
import type { Family, Label } from '../../core/types';
import { chapterById } from '../../data/chapters';
import { bahasPg, susunOpsi, type JawabanPg } from '../model';
import {
  bahasReading, BATAS_FORMAT, caraCepatBawaan, INSTRUKSI, jumlahKata, pecahKalimat, pecahkanReading, periksaReading,
  type AnotasiOpsi, type BacaanBank, type Bukti, type DataReading, type Format, type ItemReading, type OpsiBank, type SoalBank,
} from './model';

// Pembangun family Reading: bank bacaan kurasi → satu soal per seed (bacaan + satu pertanyaan + empat opsi teracak).
// Kutipan bukti di bank diterjemahkan ke indeks paragraf + kalimat saat modul dimuat; kutipan yang tidak ada atau
// muncul di lebih dari satu kalimat langsung menggagalkan pemuatan (kesalahan bank, bukan soal yang ditolak).

interface SoalSiap {
  bacaan: BacaanBank;
  soal: SoalBank;
  urutan: number;
  anotasi: AnotasiOpsi[];
  kalimat?: string;
}

function cariBukti(b: BacaanBank, kal: string[][], kutipan: string, asal: string): Bukti {
  const temu: Bukti[] = [];
  kal.forEach((ks, p) => ks.forEach((s, k) => { if (s.includes(kutipan)) temu.push({ p, k, kutipan }); }));
  if (temu.length !== 1) throw new Error(`${b.id}/${asal}: kutipan "${kutipan}" ditemukan di ${temu.length} kalimat`);
  return temu[0];
}

function siapkan(bank: BacaanBank[], format: Format, familyId: string): SoalSiap[] {
  const hasil: SoalSiap[] = [];
  const ids = new Set<string>();
  for (const b of bank) {
    if (ids.has(b.id)) throw new Error(`${familyId}: id bacaan ganda ${b.id}`);
    ids.add(b.id);
    if (/\b(e\.g|i\.e|etc|Mr|Mrs|Ms|Dr|St|U\.S|vs)\./.test(b.paragraf.join(' '))) throw new Error(`${b.id}: singkatan bertitik mengacaukan pemecahan kalimat`);
    const n = jumlahKata(b.paragraf);
    const [min, maks] = BATAS_FORMAT[format].kata;
    if (n < min || n > maks) throw new Error(`${b.id}: ${n} kata di luar ${min}–${maks}`);
    const kal = b.paragraf.map(pecahKalimat);
    const idSoal = new Set<string>();
    b.soal.forEach((s, i) => {
      if (idSoal.has(s.id)) throw new Error(`${b.id}: id soal ganda ${s.id}`);
      idSoal.add(s.id);
      const anotasi = s.opsi.map((o: OpsiBank, j) => ({
        teks: o.t,
        jenis: o.j,
        bukti: (o.b ?? []).map((q) => cariBukti(b, kal, q, `${s.id}/opsi ${j + 1}`)),
        parafrase: o.f ?? [],
        alasan: o.a,
      }));
      let kalimat: string | undefined;
      if (s.tipe === 'makna-kalimat') {
        if (!s.kalimat) throw new Error(`${b.id}/${s.id}: soal makna kalimat tanpa kalimat`);
        const bk = cariBukti(b, kal, s.kalimat, `${s.id}/kalimat`);
        kalimat = kal[bk.p][bk.k];
      }
      hasil.push({ bacaan: b, soal: s, urutan: i + 1, anotasi, kalimat });
    });
  }
  // Petunjuk panjang di tingkat bank: kunci tidak boleh terlalu sering menjadi opsi terpanjang (seri dihitung) atau
  // terpendek, karena peserta dapat menebak dari pola itu walaupun setiap soal lolos batas per soal.
  const panjang = hasil.map((x) => x.anotasi.map((a) => a.teks.length));
  const terpanjang = panjang.filter((p) => p.every((n) => n <= p[0])).length / hasil.length;
  const terpendek = panjang.filter((p) => p.every((n) => n >= p[0])).length / hasil.length;
  if (terpanjang > 0.35) throw new Error(`${familyId}: kunci menjadi opsi terpanjang pada ${Math.round(terpanjang * 100)}% soal (maks 35%)`);
  if (terpendek > 0.35) throw new Error(`${familyId}: kunci menjadi opsi terpendek pada ${Math.round(terpendek * 100)}% soal (maks 35%)`);
  return hasil;
}

export function familyReading(cfg: {
  id: string; versi: number; nama: string; label: Label; sumber: string; ringkas: string; format: Format; bank: BacaanBank[];
}): Family<ItemReading, JawabanPg> {
  const { id } = cfg;
  const daftar = siapkan(cfg.bank, cfg.format, id);
  const family: Family<ItemReading, JawabanPg> = {
    id,
    versi: cfg.versi,
    nama: cfg.nama,
    chapter: chapterById('reading-comprehension'),
    label: cfg.label,
    sumber: cfg.sumber,
    ringkas: cfg.ringkas,

    bangun(r) {
      const x = r.pick(daftar);
      const s = x.soal;
      const [kunci, ...pengecoh] = x.anotasi;
      const { opsi, urut, kunci: label } = susunOpsi(r.shuffle, kunci, pengecoh, (a) => a.teks);
      const data: DataReading = {
        bacaan: x.bacaan.id,
        judulBacaan: x.bacaan.judul,
        soal: s.id,
        urutan: x.urutan,
        jumlahSoal: x.bacaan.soal.length,
        format: cfg.format,
        tipe: s.tipe,
        polaritas: s.tipe === 'not' ? 'negatif' : 'positif',
        sasaran: s.sasaran,
        anotasi: urut.map((a) => ({ ...a, bukti: a.bukti.map((b) => ({ ...b })), parafrase: a.parafrase.map(([o, q]) => [o, q] as [string, string]) })),
        caraCepat: s.cepat ?? caraCepatBawaan(s.tipe),
      };
      const item: ItemReading = {
        jenis: 'pilihan-ganda',
        instruksi: INSTRUKSI,
        bacaan: { paragraf: [...x.bacaan.paragraf] },
        pertanyaan: s.tanya,
        stimulus: x.kalimat ? [{ teks: x.kalimat, gaya: 'miring' }] : [],
        opsi,
        tingkat: s.tingkat,
        kaidah: `reading-${s.tipe}`,
        konteks: x.bacaan.konteks,
        data,
      };
      return { item, jawaban: label };
    },

    // Solver independen dari kunci tersimpan: lihat nilaiOpsi() di model.ts.
    pecahkan: pecahkanReading,

    kunci: (j) => j,

    periksa: periksaReading,

    bahas(item, j) {
      const b = bahasReading(item, j);
      if (!b) return null;
      return bahasPg({ item, kunci: j, ...b });
    },

    sidik: (item) => `${id}|${item.data.bacaan}|${item.data.soal}`,
  };
  // Setiap soal bank harus lolos pemeriksaan engine (susunan opsi bawaan; pemeriksaannya tidak bergantung urutan). Tanpa
  // penjaga ini soal yang selalu ditolak (mis. kunci terpanjang mencolok, jawaban ganda) hilang diam-diam: engine
  // mencoba soal lain, verify tetap lolos, dan hanya sidik unik yang berkurang.
  daftar.forEach((x, i) => {
    const r = { pick: <T,>(xs: readonly T[]) => xs[i], shuffle: <T,>(xs: readonly T[]) => [...xs] } as unknown as Rng;
    const kandidat = family.bangun(r);
    if (!kandidat) throw new Error(`${id}: soal ${x.bacaan.id}/${x.soal.id} tidak dapat dibangun`);
    const cek = periksaKandidat(family, kandidat.item, kandidat.jawaban);
    if (!cek.ok) throw new Error(`${id}: soal ${x.bacaan.id}/${x.soal.id} selalu ditolak engine (${cek.alasan})`);
  });
  return family;
}
