// Verifikasi seluruh family: `npm run verify` (default 300 seed per family), `npm run verify -- 1000`,
// atau hanya family berawalan tertentu: `npm run verify -- 300 FS-`.
// Yang diperiksa per seed:
//  1. soal berhasil dibangkitkan;
//  2. deterministik — seed yang sama dibangkitkan dua kali menghasilkan JSON identik;
//  3. validator independen menerima ulang soal (jawaban tunggal, kunci cocok, lolos pemeriksaan mutu, pembahasan ada);
//  4. kontrol negatif — kunci soal lain (yang berbeda) harus ditolak untuk soal ini.
// Laporan juga menghitung sidik unik: banyaknya soal yang benar-benar berbeda struktur, bukan sekadar beda nama.
// Hasil per family disimpan ke lib/data/kapasitas.json (digabung dengan hasil sebelumnya) dan dibaca halaman Ringkasan.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { bangkitkan, GagalBangun, periksaKandidat } from '../lib/core/engine';
import { FAMILIES } from '../lib/core/registry';
import type { CatatanKapasitas } from '../lib/data/kapasitas';

const BERKAS_KAPASITAS = 'lib/data/kapasitas.json';
const kapasitas: Record<string, CatatanKapasitas> = existsSync(BERKAS_KAPASITAS) ? JSON.parse(readFileSync(BERKAS_KAPASITAS, 'utf8')) : {};

const N = Number(process.argv[2] ?? 300);
const AWALAN = process.argv[3] ?? '';
const DIPERIKSA = FAMILIES.filter((f) => f.id.startsWith(AWALAN));
let gagalTotal = 0;
const baris: string[] = [];

for (const f of DIPERIKSA) {
  const sidik = new Set<string>();
  const masalah: string[] = [];
  let percobaan = 0;
  let maksPercobaan = 0;
  let kontrolNegatif = 0;
  let sebelumnya: { kunci: string; jawaban: unknown } | null = null;
  const t0 = Date.now();
  for (let i = 0; i < N; i++) {
    const seed = `uji-${i}`;
    try {
      const soal = bangkitkan(f, seed);
      const ulang = bangkitkan(f, seed);
      if (JSON.stringify(soal) !== JSON.stringify(ulang)) masalah.push(`${seed}: tidak deterministik`);
      const cek = periksaKandidat(f, soal.item, soal.jawaban);
      if (!cek.ok) masalah.push(`${seed}: validator menolak soal tersimpan (${cek.alasan})`);
      if (sebelumnya && sebelumnya.kunci !== soal.kunci) {
        const salah = periksaKandidat(f, soal.item, sebelumnya.jawaban);
        if (salah.ok) masalah.push(`${seed}: kontrol negatif lolos — kunci soal lain diterima`);
        else kontrolNegatif++;
      }
      sebelumnya = { kunci: soal.kunci, jawaban: soal.jawaban };
      sidik.add(soal.sidik);
      percobaan += soal.percobaan + 1;
      maksPercobaan = Math.max(maksPercobaan, soal.percobaan + 1);
    } catch (e) {
      masalah.push(e instanceof GagalBangun ? `${seed}: gagal bangun ${JSON.stringify(e.alasan)}` : `${seed}: ${(e as Error).message}`);
    }
  }
  gagalTotal += masalah.length;
  const ms = Date.now() - t0;
  kapasitas[f.id] = {
    versi: f.versi, seed: N, lolos: N - masalah.length, sidik: sidik.size,
    percobaanRata: +(percobaan / Math.max(1, N)).toFixed(1), diuji: new Date().toISOString().slice(0, 10),
  };
  baris.push([
    f.id.padEnd(14), f.label.padEnd(8), `${N - masalah.length}/${N} lolos`.padEnd(15),
    `sidik unik ${sidik.size}`.padEnd(17), `percobaan rata2 ${(percobaan / Math.max(1, N)).toFixed(1)} maks ${maksPercobaan}`.padEnd(30),
    `kontrol negatif ${kontrolNegatif}`.padEnd(20), `${ms} ms`,
  ].join(' '));
  for (const m of masalah.slice(0, 5)) baris.push('   ✗ ' + m);
  if (masalah.length > 5) baris.push(`   … dan ${masalah.length - 5} masalah lain`);
}

console.log(`Verifikasi ${DIPERIKSA.length} family × ${N} seed\n`);
console.log(baris.join('\n'));
console.log(gagalTotal ? `\n✗ ${gagalTotal} masalah ditemukan` : '\n✓ Semua family lolos');
const urut = Object.fromEntries(Object.keys(kapasitas).sort().map((k) => [k, kapasitas[k]]));
writeFileSync(BERKAS_KAPASITAS, JSON.stringify(urut, null, 2) + '\n');
console.log(`Kapasitas disimpan ke ${BERKAS_KAPASITAS}`);
process.exit(gagalTotal ? 1 : 0);
