// Ekspor naskah Word SiAdu dari paket resmi (lib/data/paket.json): `npm run siadu` (semua paket) atau
// `npm run siadu -- TO-01 LS-01-deduktif-badges` (paket tertentu). Hasil di output/siadu/<paket>-<subtes>-siadu.docx,
// ditambah <paket>-<subtes>-usulan.docx untuk bentuk interaktif yang belum punya template importir SiAdu.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import DATA from '../lib/data/paket.json';
import { docxSiadu, dokumenSiadu } from '../lib/ekspor/siadu';
import type { HasilSusun } from '../lib/paket/susun';

const pilih = process.argv.slice(2);
const keluar = join('output', 'siadu');
mkdirSync(keluar, { recursive: true });
// foto Badges dibaca dari salinan bank aset Tahap 1 di repo ini
const muat = async (src: string) => {
  try { return new Uint8Array(readFileSync(join('.', src.replace(/^\/tahap-1\//, 'tahap-1/')))); } catch { return null; }
};

// sharp terpasang bersama Next; bila tidak ada, naskah memuat uraian teks gambar sebagai gantinya
const svgKePng = async (svg: string) => {
  try { const { default: sharp } = await import('sharp'); return new Uint8Array(await sharp(Buffer.from(svg), { density: 144 }).png().toBuffer()); } catch { return null; }
};

async function utama() {
  const dok = dokumenSiadu(DATA as unknown as HasilSusun, pilih.length ? pilih : null);
  let soal = 0;
  for (const d of dok) {
    writeFileSync(join(keluar, d.nama), await docxSiadu(d, muat, svgKePng));
    soal += d.jumlahSoal;
  }
  const siadu = dok.filter((d) => !d.usulan), usulan = dok.filter((d) => d.usulan);
  console.log(`Ditulis ke ${keluar}: ${siadu.length} berkas SiAdu (${siadu.reduce((a, d) => a + d.jumlahSoal, 0)} soal) dan ${usulan.length} berkas usulan (${usulan.reduce((a, d) => a + d.jumlahSoal, 0)} soal); total ${soal} soal.`);
}
utama();
