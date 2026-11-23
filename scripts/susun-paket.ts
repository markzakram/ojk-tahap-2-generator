// Susun 10 tryout dan 5 latsol per kelompok dari family yang tersedia: `npm run paket` (atau `npx tsx scripts/susun-paket.ts [benih]`).
// Hasil (uid soal per slot) ditulis ke lib/data/paket.json dan dibaca halaman Paket. Jalankan ulang setelah family
// bertambah atau versinya naik. Laporan: slot terisi/kosong per chapter, struktur kembar (harus 0), sebaran label,
// tingkat, dan huruf kunci soal pilihan ganda per subtes.
import { writeFileSync } from 'node:fs';
import { FAMILIES } from '../lib/core/registry';
import { CHAPTERS } from '../lib/data/chapters';
import { bangunSlot } from '../lib/paket/hasil';
import { hitungBocor, ringkasPaket, susunPaket } from '../lib/paket/susun';

const benih = process.argv[2] ?? 'pcam-10';
const t0 = Date.now();
const hasil = susunPaket(FAMILIES, benih);
const r = ringkasPaket(hasil);
writeFileSync('lib/data/paket.json', JSON.stringify(hasil, null, 1) + '\n');

const slot = hasil.paket.flatMap((p) => p.bagian.flatMap((b) => b.slot.map((s) => ({ ...s, subtes: b.subtes }))));
console.log(`Paket: ${hasil.paket.filter((p) => p.jenis === 'tryout').length} tryout, ${hasil.paket.filter((p) => p.jenis === 'latsol').length} latsol (benih ${benih}, ${((Date.now() - t0) / 1000).toFixed(1)} dtk)`);
console.log(`Slot ${r.slot}: terisi ${r.terisi}, kosong ${r.kosong}; struktur kembar ${r.kembar}\n`);
for (const c of CHAPTERS) {
  const s = slot.filter((x) => x.chapterId === c.id);
  const isi = s.filter((x) => x.uid);
  const label = `SHL ${isi.filter((x) => x.label === 'SHL').length}/VAR ${isi.filter((x) => x.label === 'VARIASI').length}`;
  const tingkat = ['dasar', 'menengah', 'menantang'].map((t) => isi.filter((x) => x.tingkat === t).length).join('/');
  console.log(`${c.nama.padEnd(42)} ${String(isi.length).padStart(4)}/${String(s.length).padEnd(4)} ${label.padEnd(16)} ${isi.some((x) => x.tingkat) ? 'tingkat ' + tingkat : ''}${r.kosongPerChapter[c.id] ? '  ✗ ' + r.kosongPerChapter[c.id] + ' kosong' : ''}`);
}
for (const st of ['bahasa-inggris', 'sjk'] as const) {
  const k = slot.filter((x) => x.subtes === st && x.uid && /^[A-E]$/.test(x.kunci ?? ''));
  if (k.length) console.log(`\nHuruf kunci ${st}: ${['A', 'B', 'C', 'D', 'E'].map((h) => `${h} ${k.filter((x) => x.kunci === h).length}`).join(' · ')}`);
}
// Pemeriksaan mutu susunan (tahap QC paket): bacaan utuh, deret kunci, family terpakai, dan keseimbangan antartryout.
const galat: string[] = [];
let deret3 = 0;
for (const p of hasil.paket) {
  for (const b of p.bagian) {
    const rc = b.slot.map((s, i) => ({ s, i })).filter((x) => x.s.bacaan);
    if (rc.length && new Set(rc.map((x) => x.s.bacaan)).size !== 1) galat.push(`${p.id}: soal Reading dari lebih dari satu bacaan`);
    if (rc.length && rc[rc.length - 1].i - rc[0].i !== rc.length - 1) galat.push(`${p.id}: soal Reading tidak berurutan`);
    for (let i = 2; i < b.slot.length; i++) {
      const k = b.slot[i].kunci;
      if (k && /^[A-E]$/.test(k) && k === b.slot[i - 1].kunci && k === b.slot[i - 2].kunci) deret3++;
    }
  }
}
const terpakai = new Set(slot.map((s) => s.familyId).filter(Boolean));
const tidakTerpakai = FAMILIES.filter((f) => !terpakai.has(f.id)).map((f) => f.id);
// QC F03: dua soal satu paket tidak boleh saling membocorkan (kunci yang satu muncul di batang soal yang lain)
const bocor = hitungBocor(hasil, (s) => bangunSlot(s) ?? undefined);
if (bocor) galat.push(`${bocor} pasangan soal saling membocorkan di dalam paket (QC F03)`);
console.log(`\nPemeriksaan: Reading utuh ${galat.some((g) => g.includes('Reading')) ? '✗' : '✓'} · deret 3 kunci sama ${deret3} · soal saling membocorkan ${bocor} · family tidak terpakai: ${tidakTerpakai.join(', ') || '-'}`);
const tryout = hasil.paket.filter((p) => p.jenis === 'tryout');
for (const st of ['induktif', 'deduktif', 'bahasa-inggris', 'sjk'] as const) {
  const per = tryout.map((p) => p.bagian.find((b) => b.subtes === st)!.slot);
  const rentang = (f: (s: (typeof per)[number]) => number) => { const v = per.map(f); return `${Math.min(...v)}–${Math.max(...v)}`; };
  const t = (n: string) => rentang((s) => s.filter((x) => x.tingkat === n).length);
  console.log(`  per tryout ${st.padEnd(15)} SHL ${rentang((s) => s.filter((x) => x.label === 'SHL').length).padEnd(6)}${per[0].some((x) => x.tingkat) ? ` dasar ${t('dasar')} menengah ${t('menengah')} menantang ${t('menantang')}` : ''}`);
}
for (const g of galat) console.log('  ✗ ' + g);
console.log(`\nDitulis ke lib/data/paket.json`);
process.exit(r.kembar || galat.length ? 1 : 0);
