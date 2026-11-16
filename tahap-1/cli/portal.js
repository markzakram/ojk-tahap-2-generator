#!/usr/bin/env node
/*
 * portal.js — menyalakan Portal Generator OJK (Tahap 1 dan Tahap 2 dalam satu alamat, dipisah tab) dari
 * folder Tahap 1, untuk tombol "Buka Portal OJK" di Agent Office (skrip pekerjaan harus berada di folder
 * project ini). Isinya hanya meneruskan ke ../../Portal/buka.js, jadi opsi dan keluarannya sama persis:
 *
 *   node cli/portal.js [--port <n>] [--lokal]
 *
 * Port baku 3200; baris siap "Portal Generator OJK berjalan di http://localhost:3200". Tab Tahap 2 memerlukan
 * ekspor statis (node Portal/bangun.js di folder Tes OJK Generator). Lihat Portal/README.md.
 */
'use strict';

var fs = require('fs');
var path = require('path');

var JALUR = path.resolve(__dirname, '..', '..', 'Portal', 'buka.js');

if (!fs.existsSync(JALUR)) {
  if (require.main === module) {
    process.stdout.write('GAGAL: Portal tidak ditemukan (' + JALUR + ')\n');
    process.exitCode = 1;
  }
  module.exports = null;
} else {
  module.exports = require(JALUR);
  if (require.main === module) module.exports.jalankan(process.argv.slice(2));
}
