// Cetak satu soal: `npm run generate -- CDS-A0 abc123` (tambahkan --json untuk keluaran mentah).
// Tanpa argumen: tampilkan daftar family.
import { bangkitkan } from '../lib/core/engine';
import { FAMILIES, familyById } from '../lib/core/registry';

const [id, seed = 'contoh', ...sisa] = process.argv.slice(2);
if (!id) {
  console.log('Family tersedia:');
  for (const f of FAMILIES) console.log(`  ${f.id.padEnd(14)} ${f.label.padEnd(8)} ${f.chapter.nama} — ${f.nama}`);
  process.exit(0);
}
const soal = bangkitkan(familyById(id), seed);
if (sisa.includes('--json')) {
  console.log(JSON.stringify(soal, null, 2));
} else {
  const item = soal.item as { judul: string; instruksi?: string[]; paragraf?: string[]; pertanyaan?: string; orang?: { nama: string; petunjuk: string[] }[] };
  console.log(`${soal.uid}  (percobaan ${soal.percobaan + 1}, ${soal.label})\n`);
  const it = soal.item as { jenis: string; simpul?: { id: string; kode: string }[]; awalan?: string[]; frame?: number[][]; geometri?: string };
  if (it.jenis === 'drag-line') console.log(`Simpul: ${it.simpul!.map((s) => s.kode).join('  ')}
Awalan: ${it.awalan!.map((id) => it.simpul!.find((s) => s.id === id)!.kode).join(' → ')}`);
  if (it.jenis === 'fill-shape') it.frame!.forEach((f, t) => console.log(`G${t + 1} ${f.map((w) => 'WHU'[w]).join('')}`));
  if (item.judul) console.log(`# ${item.judul}`);
  for (const s of [...(item.instruksi ?? []), ...(item.paragraf ?? [])]) console.log(s);
  if (item.pertanyaan) console.log(item.pertanyaan);
  console.log();
  for (const o of item.orang ?? []) console.log(`  ${o.nama.padEnd(10)} ${o.petunjuk.join(' ')}`);
  console.log(`\nJawaban: ${soal.pembahasan.jawaban}`);
  soal.pembahasan.langkah.forEach((l, i) => console.log(`  ${i + 1}. ${l.teks}`));
  if (soal.pembahasan.caraCepat) console.log(`Cara cepat: ${soal.pembahasan.caraCepat}`);
  console.log(`\nSidik: ${soal.sidik}`);
}
