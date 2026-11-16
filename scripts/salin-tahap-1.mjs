#!/usr/bin/env node
/*
 * salin-tahap-1.mjs — menyalin halaman generator Tahap 1 (folder tahap-1/, hasil git subtree) ke
 * public/tahap-1/ supaya situs ini (dan Vercel) melayani Tahap 1 di /tahap-1/index.html.
 *
 *   node scripts/salin-tahap-1.mjs            dijalankan otomatis oleh "npm run dev" dan "npm run build"
 *
 * Yang disalin hanya berkas yang dibutuhkan peramban: index.html, css/, js/, dan aset gambar Badges.
 * CLI, uji, dan contoh keluaran tidak ikut. js/situs.js di salinan diberi alamat kedua tahap sehingga
 * bilah atas Tahap 1 menampilkan tab "Tahap 1 | Tahap 2". Folder tujuan dibuat ulang setiap kali dan
 * tidak masuk git (.gitignore).
 *
 * Sumber lain untuk uji lokal: TAHAP1_SUMBER="../Tahap 1" node scripts/salin-tahap-1.mjs
 */
import { cpSync, existsSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const akar = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sumber = resolve(akar, process.env.TAHAP1_SUMBER || 'tahap-1');
const tujuan = join(akar, 'public', 'tahap-1');
const SALIN = ['index.html', 'css', 'js', 'assets', 'bank_aset_badges'];
// alamat di situs gabungan; tanpa basePath karena build Vercel melayani dari akar domain
const SITUS = { tahap1: '/tahap-1/index.html', tahap2: '/studio' };

function gagal(pesan) { process.stdout.write('GAGAL: ' + pesan + '\n'); process.exit(1); }

rmSync(tujuan, { recursive: true, force: true });
// ekspor untuk ../Portal: Portal melayani Tahap 1 langsung dari foldernya, jadi salinan tidak diperlukan
if (process.env.TKU_PORTAL === '1') { process.stdout.write('HASIL: mode portal, halaman Tahap 1 tidak disalin\n'); process.exit(0); }
if (!existsSync(join(sumber, 'index.html'))) gagal('halaman Tahap 1 tidak ditemukan di ' + sumber);
mkdirSync(tujuan, { recursive: true });
for (const nama of SALIN) {
  if (existsSync(join(sumber, nama))) cpSync(join(sumber, nama), join(tujuan, nama), { recursive: true });
}

const berkasSitus = join(tujuan, 'js', 'situs.js');
if (existsSync(berkasSitus)) {
  const isi = readFileSync(berkasSitus, 'utf8'), baris = /^var OJK_SITUS = null;$/m;
  if (!baris.test(isi)) gagal('js/situs.js Tahap 1 tidak memuat baris "var OJK_SITUS = null;"');
  writeFileSync(berkasSitus, isi.replace(baris, 'var OJK_SITUS = ' + JSON.stringify(SITUS) + ';'));
} else {
  process.stdout.write('Catatan: tahap-1/js/situs.js belum ada (subtree lama), jadi tab antartahap tidak tampil di halaman Tahap 1.\n');
}
process.stdout.write('HASIL: halaman Tahap 1 disalin dari ' + sumber + ' ke ' + tujuan + '\n');
