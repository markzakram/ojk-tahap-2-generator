// Uji emas Bahasa Inggris non-reading: contoh pada bahan/Blueprint Bahasa Inggris.md dipakai KATA PER KATA untuk menguji
// solver setiap bentuk soal, tetapi tidak terbit sebagai butir bank (butir bank memakai kalimat baru dengan mekanisme yang
// sama). Berkas ini tidak diimpor aplikasi. Jalankan: npx tsx lib/bahasa-inggris/uji-emas.ts
//
// Setiap uji menyusun soal dengan opsi persis seperti blueprint, lalu memeriksa bahwa solver menemukan tepat satu jawaban,
// yaitu kunci blueprint. Untuk Sentence Completion, soal dibangkitkan lewat engine dari kerangka emas (tiga pengecoh
// tetap) agar pemeriksaan mutu dan pembahasan ikut diuji.

import { bangkitkan } from '../core/engine';
import { rng } from '../core/rng';
import { EMAS_ADJECTIVE } from './completion/kerangka-adjective';
import { EMAS_NOUN } from './completion/kerangka-noun';
import { EMAS_VERB } from './completion/kerangka-verb';
import { familyMakna, type KerangkaMakna } from './completion/makna';
import { EMAS_PREP, KERANGKA_GERUND } from './improvement/gerund';
import { KERANGKA_PARALEL } from './improvement/paralel';
import { EMAS_AGREEMENT, KERANGKA_PREDIKAT } from './improvement/predikat';
import { pecahkanSI, rakit as rakitSI, TEKS_E, type Rancangan } from './improvement/umum';
import { pecahkanGcs, rakit as rakitGcs, INSTRUKSI as INSTRUKSI_GCS, type KerangkaGcs } from './correct/kerangka';
import { EMAS_NOUN_CLAUSE } from './correct/noun-clause';
import { EMAS_SVA_WAKTU } from './correct/sva-waktu';
import { render, type ItemGcs } from './correct/tipe';
import { tokenFragmen, type ArrangementItem } from './arrangement/family';
import { EMAS_FRASA, familyFrasa } from './arrangement/frasa';
import { EMAS_INFINITIF, familyInfinitif } from './arrangement/infinitif';
import { EMAS_KLAUSA, familyKlausa } from './arrangement/klausa';
import { urutanSah } from './arrangement/tata-bahasa';
import { HURUF } from './model';

const gagal: string[] = [];
let jumlah = 0;
function cek(nama: string, solusi: string[], kunci: string) {
  jumlah++;
  const ok = solusi.length === 1 && solusi[0] === kunci;
  console.log(`${ok ? '✓' : '✗'} ${nama}: solver ${JSON.stringify(solusi)}, kunci blueprint ${kunci}`);
  if (!ok) gagal.push(nama);
}

// ── Sentence Completion: kerangka emas memakai tiga pengecoh blueprint (excessive diganti selective, lihat catatan) ──
for (const [id, k] of [['EMAS-SC-ADJ', EMAS_ADJECTIVE], ['EMAS-SC-NOUN', EMAS_NOUN], ['EMAS-SC-VERB', EMAS_VERB]] as [string, KerangkaMakna[]][]) {
  // Pengecoh blueprint dipakai apa adanya, sehingga aturan polaritas (wajib pengecoh searah) dimatikan untuk kerangka emas.
  const f = familyMakna({ id, nama: id, sumber: 'blueprint', ringkas: 'uji emas', kerangka: k, caraCepat: '-', polaritas: false });
  for (let i = 0; i < 4; i++) {
    const s = bangkitkan(f, `emas-${i}`);
    const teks = s.item.opsi.find((o) => o.label === s.jawaban)?.teks;
    jumlah++;
    if (teks !== k[0].kunci) { gagal.push(`${id} seed ${i}`); console.log(`✗ ${id}: kunci ${teks}`); }
  }
  console.log(`✓ ${id}: ${k[0].teks.replace('___', `[${k[0].kunci}]`)} (4 seed lolos engine)`);
}

// ── Sentence Improvement: opsi A–E persis blueprint, rentang miring persis blueprint ──
function soalSI(rc: Rancangan, miring: string, opsi: string[]) {
  const dasar = rakitSI(rng('emas'), rc, rc.awal?.includes(rc.kunci) ? 1 : 0);
  if (!dasar) throw new Error(`uji emas SI ${rc.kerangka}: rancangan tidak dapat dirakit`);
  const item = dasar.item;
  item.stimulus = item.stimulus.map((p) => (p.gaya === 'miring' ? { ...p, teks: miring } : p));
  item.opsi = [...opsi.map((teks, i) => ({ label: HURUF[i], teks })), { label: 'E', teks: TEKS_E }];
  return item;
}
const agreement = KERANGKA_PREDIKAT.rancang(EMAS_AGREEMENT[0]);
cek('SI agreement "Each of the applicants has submitted"',
  pecahkanSI(soalSI(agreement, 'has submitted', ['have submitted', 'have submit', 'has submitting', 'have submitting'])), 'E');
cek('SI gerund "responsible for prepare the monthly report"',
  pecahkanSI(soalSI(KERANGKA_GERUND.rancang(EMAS_PREP[0], EMAS_PREP[0].isi[0]), 'prepare the monthly report',
    ['to prepare the monthly report', 'preparing the monthly report', 'prepared the monthly report', 'prepares the monthly report'])), 'B');
cek('SI paralel "record transactions, checking balances, and generate reports"',
  pecahkanSI(soalSI(KERANGKA_PARALEL.rancang(KERANGKA_PARALEL.EMAS_PARALEL[0], 1), 'checking balances',
    ['checks balances', 'to checking balances', 'check balances', 'checked balances'])), 'C');

// ── Grammatically Correct Sentence: lima kalimat blueprint disusun dari varian kerangka emas ──
function soalGcs(k: KerangkaGcs, pilihan: number[][]): ItemGcs {
  const opsi = pilihan.map((p, i) => ({ label: HURUF[i], unsur: rakitGcs(k, p) }));
  return {
    jenis: 'pilihan-ganda', instruksi: INSTRUKSI_GCS, stimulus: [], tingkat: k.tingkat, kaidah: k.kaidah, konteks: k.konteks,
    opsi: opsi.map((o) => ({ label: o.label, teks: render(o.unsur) })),
    data: { kerangka: k.id, sasaran: k.sasaran, konsep: k.konsep, klausa: k.klausa, uji: k.uji, opsi },
  };
}
// Varian titik waktu: [on, in, at]; varian verb: [were, was].
const sva = soalGcs(EMAS_SVA_WAKTU[0][0], [[1, 0], [0, 2], [0, 1], [1, 2], [0, 0]]);
cek(`GCS agreement + preposisi waktu (${sva.opsi[4].teks})`, pecahkanGcs(sva), 'E');
const nc = soalGcs(EMAS_NOUN_CLAUSE[0][0], [[1], [0], [2], [3], [4]]);
cek(`GCS urutan noun clause (${nc.opsi[1].teks})`, pecahkanGcs(nc), 'B');

// ── Sentence Arrangement: lima fragmen dan empat opsi urutan persis blueprint ──
function soalSA(fragmen: Record<string, string>, opsi: string[]): ArrangementItem {
  const fr = Object.entries(fragmen).map(([label, teks]) => ({ label, teks }));
  return {
    jenis: 'pilihan-ganda', instruksi: '', stimulus: [], fragmen: fr, tingkat: 'dasar', kaidah: '', konteks: '',
    opsi: opsi.map((teks, i) => ({ label: HURUF[i], teks: teks.split('–').join(' – ') })),
    data: { kerangka: 'emas', token: fr.map((f) => tokenFragmen(f.teks)), fungsi: {}, kait: [], konsep: '', kataKunci: '', caraCepat: '' },
  };
}
function cekSA(nama: string, f: { pecahkan: (i: ArrangementItem) => string[] }, frag: string[], label: string[], opsi: string[], kunci: string) {
  const item = soalSA(Object.fromEntries(label.map((l, i) => [l, frag[i]])), opsi);
  cek(`SA ${nama}`, f.pecahkan(item), kunci);
  const sah = urutanSah(item.data.token);
  jumlah++;
  if (sah.length !== 1) { gagal.push(`SA ${nama}: ${sah.length} urutan sah dari 120`); console.log(`✗ SA ${nama}: ${sah.length} urutan sah dari 120`); }
}
// Fragmen kerangka emas dalam urutan benar dipetakan ke label blueprint.
cekSA('noun phrase dan complement (compliance officer)', familyFrasa, EMAS_FRASA[0].fragmen, ['C', 'B', 'D', 'E', 'A'],
  ['C–B–E–D–A', 'C–D–B–E–A', 'C–B–D–E–A', 'E–A–C–B–D'], 'C');
cekSA('noun clause (supervisor/whether)', familyKlausa, EMAS_KLAUSA[0].fragmen, ['B', 'D', 'A', 'C', 'E'],
  ['B–D–A–C–E', 'B–A–D–C–E', 'A–B–D–C–E', 'B–D–C–A–E'], 'A');
cekSA('verb dan infinitive (revised policy)', familyInfinitif, EMAS_INFINITIF[0].fragmen, ['D', 'B', 'E', 'A', 'C'],
  ['D–E–B–A–C', 'D–B–A–E–C', 'A–C–D–B–E', 'D–B–E–A–C'], 'D');

console.log(gagal.length ? `\n✗ ${gagal.length} uji emas gagal: ${gagal.join('; ')}` : `\n✓ Semua uji emas lolos (${jumlah} pemeriksaan)`);
if (gagal.length) process.exit(1);
