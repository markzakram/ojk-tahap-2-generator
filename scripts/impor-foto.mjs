#!/usr/bin/env node
/*
 * impor-foto.mjs — memasang foto orang dari folder "Asset Generator" (Google Drive tim) untuk Calendar Date Selection
 * dan Room Allocations, menggantikan inisial berwarna.
 *
 *   1. Di Google Drive, unduh folder "Asset Generator" (klik kanan → Download), lalu ekstrak ZIP-nya.
 *   2. node scripts/impor-foto.mjs "C:/Users/<nama>/Downloads/Asset Generator"
 *
 * Skrip mencari subfolder "Calendar Date Selection" dan "Room Allocations", menyalin PNG yang namanya cocok dengan daftar
 * nama di lib/data/nama.ts ke public/foto/kalender/ dan public/foto/ruangan/, lalu menulis daftar foto yang tersedia ke
 * lib/data/foto.json. Nama yang tidak punya foto tetap tampil sebagai inisial. Jalankan ulang bila aset berubah.
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const akar = resolve(dirname(fileURLToPath(import.meta.url)), '..');
function gagal(pesan) { process.stdout.write('GAGAL: ' + pesan + '\n'); process.exit(1); }

const sumber = process.argv[2];
if (!sumber) gagal('sebutkan folder Asset Generator yang sudah diekstrak, mis. node scripts/impor-foto.mjs "C:/Users/saya/Downloads/Asset Generator"');
if (!existsSync(sumber) || !statSync(sumber).isDirectory()) gagal('folder tidak ditemukan: ' + sumber);

// daftar nama dibaca dari lib/data/nama.ts supaya hanya nama yang dipakai soal yang dipasang
const teksNama = readFileSync(join(akar, 'lib', 'data', 'nama.ts'), 'utf8');
function daftar(konstanta) {
  const m = new RegExp(`export const ${konstanta} = \\[([\\s\\S]*?)\\] as const`).exec(teksNama);
  if (!m) gagal(`daftar ${konstanta} tidak ditemukan di lib/data/nama.ts`);
  return [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]);
}
const BAGIAN = [
  { folder: 'Calendar Date Selection', tujuan: 'kalender', nama: daftar('NAMA_KALENDER') },
  { folder: 'Room Allocations', tujuan: 'ruangan', nama: daftar('NAMA_RUANGAN') },
];

/** Cari subfolder dengan nama tertentu (tidak peka huruf besar) sampai dua tingkat di bawah sumber. */
function cariFolder(dasar, nama, tingkat = 2) {
  for (const isi of readdirSync(dasar, { withFileTypes: true })) {
    if (!isi.isDirectory()) continue;
    const p = join(dasar, isi.name);
    if (isi.name.toLowerCase() === nama.toLowerCase()) return p;
    if (tingkat > 1) { const dalam = cariFolder(p, nama, tingkat - 1); if (dalam) return dalam; }
  }
  return null;
}

const manifest = {};
let jumlah = 0;
for (const b of BAGIAN) {
  const folder = basename(resolve(sumber)).toLowerCase() === b.folder.toLowerCase() ? sumber : cariFolder(sumber, b.folder);
  if (!folder) { process.stdout.write(`Catatan: subfolder "${b.folder}" tidak ditemukan; dilewati.\n`); continue; }
  const tujuan = join(akar, 'public', 'foto', b.tujuan);
  rmSync(tujuan, { recursive: true, force: true });
  mkdirSync(tujuan, { recursive: true });
  const berkas = readdirSync(folder).filter((f) => ['.png', '.jpg', '.jpeg', '.webp'].includes(extname(f).toLowerCase()));
  const hilang = [];
  for (const n of b.nama) {
    const f = berkas.find((x) => basename(x, extname(x)).trim().toLowerCase() === n.toLowerCase());
    if (!f) { hilang.push(n); continue; }
    const keluar = `${n}${extname(f).toLowerCase()}`;
    copyFileSync(join(folder, f), join(tujuan, keluar));
    manifest[n] = `/foto/${b.tujuan}/${keluar}`;
    jumlah++;
  }
  process.stdout.write(`${b.folder}: ${b.nama.length - hilang.length}/${b.nama.length} foto dipasang${hilang.length ? ` (tanpa foto: ${hilang.join(', ')})` : ''}\n`);
}
writeFileSync(join(akar, 'lib', 'data', 'foto.json'), JSON.stringify(manifest, null, 2) + '\n');
process.stdout.write(`HASIL: ${jumlah} foto dipasang; daftar ditulis ke lib/data/foto.json\n`);
