#!/usr/bin/env node
/*
 * generate.js — pembuat paket soal OJK PCAM Tahap 1 (Tes Potensi Dasar) dari baris perintah.
 *
 *   node cli/generate.js --paket 5 --subtes semua --format docx,pdf,xlsx,json --benih 2026
 *
 * Tanpa pustaka luar dan tanpa internet (Node.js 20 atau lebih baru). Alur:
 *
 *   1. paket dibuat dari benih (hasil dapat diulang persis),
 *   2. VALIDATOR menghitung ulang setiap butir dari nol dan memeriksa tidak ada butir
 *      kembar; bila ada yang gagal, tidak satu berkas pun ditulis,
 *   3. berkas ditulis ke <keluaran>/<waktu>/ : Word dan PDF per paket, PNG gambar,
 *      Excel dan JSON untuk semua paket, ringkasan.txt, dan ZIP bila diminta.
 *
 * Baris terakhir selalu "HASIL: ..." (berhasil, keluar 0) atau "GAGAL: ..." (gagal,
 * keluar 1). Berkas penting dicetak sebagai "BERKAS -> <path>" sebelum baris HASIL.
 */
'use strict';

var fs = require('fs');
var path = require('path');

var VERSI = '1.1.0';
var AKAR = path.resolve(__dirname, '..');
var JS = path.join(AKAR, 'js');
var FORMAT = ['docx', 'pdf', 'xlsx', 'json'];
var NAMA_DASAR = 'soal-ojk-tahap1';

var BANTUAN = [
  'Generator Soal OJK PCAM Tahap 1 (Tes Potensi Dasar) - versi ' + VERSI,
  '',
  'Pemakaian:',
  '  node cli/generate.js [opsi]',
  '',
  'Subtes: ku = Kemampuan Umum (verbal, soal cerita, tabel, grafik, figural; pilihan ganda A-E),',
  '        pn = Penalaran Numerik (soal interaktif: bar chart, tabel, line graph, pie chart).',
  '',
  'Opsi utama:',
  '  --paket <n>            Jumlah paket, bilangan bulat 1 sampai 500. Baku: 1.',
  '  --subtes <ku|pn|semua> Subtes yang dibuat. Baku: semua.',
  '  --format <daftar>      Format keluaran, dipisah koma: docx, pdf, xlsx, json, atau semua.',
  '                         Baku: semua (docx,pdf,xlsx,json). Pintasan: --docx --pdf --xlsx --json',
  '                         (boleh digabung dengan --format).',
  '  --zip                  Bungkus semua hasil menjadi satu berkas ZIP (soal-ojk-tahap1.zip).',
  '  --benih <n>            Bilangan bulat 0 sampai 4294967295. Benih dan opsi yang sama menghasilkan',
  '                         paket identik pada versi bank yang sama. Tanpa --benih, benih diacak.',
  '  --keluaran <folder>    Folder induk hasil. Baku: output (di folder generator). Hasil ditulis ke',
  '                         <folder>/<waktu>/ dengan waktu berbentuk 2026-10-15_101530.',
  '  --tanpa-waktu          Tulis langsung ke folder --keluaran, tanpa subfolder waktu.',
  '',
  'Opsi isi paket:',
  '  --tingkat <t>          campur (baku), mudah, sedang, atau sulit.',
  '  --proporsi <m:s:u>     Perbandingan mudah:sedang:sulit saat tingkat campur. Baku: 3:5:2.',
  '  --komposisi-ku <daftar>  Jumlah butir per submateri Kemampuan Umum, mis.',
  '                         verbal=2,cerita=2,tabel=3,grafik=1,serial=2,matriks=2 (baku).',
  '                         Submateri yang tidak disebut memakai nilai baku; isi 0 untuk meniadakan.',
  '  --komposisi-pn <daftar>  Jumlah butir per submateri Penalaran Numerik, mis.',
  '                         bar=3,tabel=3,garis=2,pie=2 (baku).',
  '',
  'Opsi lain:',
  '  --skala <n>            Skala gambar PNG 1 sampai 4. Baku: 2.',
  '  --svg-json             Sertakan teks SVG tiap gambar di berkas JSON (ukuran jauh lebih besar).',
  '  --periksa-saja         Hanya membuat dan memeriksa paket; tidak ada berkas yang ditulis.',
  '  --versi                Cetak versi.',
  '  --bantuan, --help, -h  Tampilkan bantuan ini.',
  '',
  'Hasil (di <folder>/<waktu>/):',
  '  paket-001/paket-001-kemampuan-umum.docx     Word format input SiAdu, satu berkas per subtes',
  '  paket-001/paket-001-penalaran-numerik.docx  (Soal N, Tingkat Kesulitan, Bentuk Soal, Jawaban, Pembahasan)',
  '  paket-001/paket-001.pdf    naskah baca: soal, jawaban, dan pembahasan tiap nomor (PDF)',
  '  paket-001/gambar/*.png     gambar soal dan kondisi kunci (nama sama dengan kolom berkas_gambar)',
  '  soal-ojk-tahap1.xlsx       satu baris per soal untuk semua paket (+ lembar Ringkasan)',
  '  soal-ojk-tahap1.json       seluruh data soal, kunci, pembahasan, dan hasil validator',
  '  ringkasan.txt              ringkasan paket, hasil validator, dan perintah untuk mengulang',
  '  soal-ojk-tahap1.zip        semua di atas, bila --zip',
  '',
  'Keluaran program: baris "BERKAS -> <path>" untuk berkas utama, lalu satu baris',
  '"HASIL: ..." bila berhasil, atau "GAGAL: ..." (kode keluar 1) bila gagal.',
  '',
  'Contoh:',
  '  node cli/generate.js --paket 3 --subtes semua --format docx,pdf,xlsx,json --benih 2026',
  '  node cli/generate.js --paket 100 --subtes ku --format xlsx,json --zip',
  '  node cli/generate.js --paket 20 --tingkat mudah --xlsx --json',
  '  node cli/generate.js --paket 10 --proporsi 1:1:1 --keluaran D:/soal --tanpa-waktu',
  '  node cli/generate.js --paket 50 --periksa-saja'
].join('\n');

var OPSI_NILAI = ['--paket', '--subtes', '--format', '--benih', '--keluaran', '--tingkat', '--proporsi', '--komposisi-ku', '--komposisi-pn', '--skala'];
var OPSI_TANDA = ['--docx', '--pdf', '--xlsx', '--json', '--zip', '--svg-json', '--tanpa-waktu', '--periksa-saja', '--versi', '--bantuan', '--help', '-h'];

function Galat(pesan) { this.message = pesan; this.galatPengguna = true; }

function cetak(teks) { process.stdout.write(teks + '\n'); }

function jeda() { return new Promise(function (selesai) { setImmediate(selesai); }); }

// ------------------------------------------------------------------ opsi

function urai(argv) {
  var o = {}, i = 0;
  while (i < argv.length) {
    var a = String(argv[i++]);
    if (a.slice(0, 2) !== '--' && a !== '-h') throw new Galat('argumen tidak dikenal: "' + a + '" (semua opsi diawali --; lihat --help)');
    var nama = a, nilai = null, sama = a.indexOf('=');
    if (sama > 0) { nama = a.slice(0, sama); nilai = a.slice(sama + 1); }
    if (OPSI_NILAI.indexOf(nama) >= 0) {
      if (nilai === null) {
        if (i >= argv.length) throw new Galat('opsi ' + nama + ' memerlukan nilai');
        nilai = String(argv[i++]);
      }
      o[nama] = nilai;
    } else if (OPSI_TANDA.indexOf(nama) >= 0) {
      if (nilai !== null) throw new Galat('opsi ' + nama + ' tidak memakai nilai');
      o[nama] = true;
    } else {
      throw new Galat('opsi tidak dikenal: ' + nama + ' (lihat --help)');
    }
  }
  return o;
}

function bilanganBulat(nama, teks, min, maks) {
  var t = String(teks).trim();
  if (!/^\d+$/.test(t)) throw new Galat(nama + ' harus bilangan bulat ' + min + ' sampai ' + maks + ', bukan "' + teks + '"');
  var n = Number(t);
  if (n < min || n > maks) throw new Galat(nama + ' harus bilangan bulat ' + min + ' sampai ' + maks + ', bukan ' + n);
  return n;
}

function daftarKomposisi(nama, teks, kunciSah) {
  var out = {};
  String(teks).split(',').forEach(function (bagian) {
    bagian = bagian.trim();
    if (!bagian) return;
    var m = /^([a-z]+)\s*=\s*(\d+)$/i.exec(bagian);
    if (!m) throw new Galat(nama + ': "' + bagian + '" bukan bentuk nama=jumlah (contoh ' + kunciSah[0] + '=2)');
    var k = m[1].toLowerCase();
    if (kunciSah.indexOf(k) < 0) throw new Galat(nama + ': submateri "' + k + '" tidak dikenal (pilih ' + kunciSah.join(', ') + ')');
    var v = Number(m[2]);
    if (v > 60) throw new Galat(nama + ': jumlah butir ' + k + ' paling banyak 60, bukan ' + v);
    out[k] = v;
  });
  return out;
}

function formatDipilih(o) {
  var pilih = {};
  if (o['--format'] != null) {
    String(o['--format']).split(',').forEach(function (x) {
      x = x.trim().toLowerCase();
      if (!x) return;
      if (x === 'semua') { FORMAT.forEach(function (f) { pilih[f] = true; }); return; }
      if (FORMAT.indexOf(x) < 0) throw new Galat('format tidak dikenal: "' + x + '" (pilih docx, pdf, xlsx, json, atau semua)');
      pilih[x] = true;
    });
  }
  FORMAT.forEach(function (f) { if (o['--' + f]) pilih[f] = true; });
  if (!Object.keys(pilih).length) FORMAT.forEach(function (f) { pilih[f] = true; });
  return FORMAT.filter(function (f) { return pilih[f]; });
}

/** Ubah opsi baris perintah menjadi pengaturan yang sudah diperiksa. */
function bacaPengaturan(o, Bank) {
  var p = {};
  p.paket = o['--paket'] == null ? 1 : bilanganBulat('--paket', o['--paket'], 1, 500);
  var subtes = String(o['--subtes'] == null ? 'semua' : o['--subtes']).trim().toLowerCase();
  if (['ku', 'pn', 'semua'].indexOf(subtes) < 0) throw new Galat('--subtes harus ku, pn, atau semua, bukan "' + o['--subtes'] + '"');
  p.subtes = subtes;
  p.format = formatDipilih(o);
  p.benihDiberi = o['--benih'] != null;
  p.benih = p.benihDiberi ? bilanganBulat('--benih', o['--benih'], 0, 4294967295) : Math.floor(Math.random() * 4294967296);
  p.tingkat = String(o['--tingkat'] == null ? 'campur' : o['--tingkat']).trim().toLowerCase();
  if (['campur', 'mudah', 'sedang', 'sulit'].indexOf(p.tingkat) < 0) throw new Galat('--tingkat harus campur, mudah, sedang, atau sulit, bukan "' + o['--tingkat'] + '"');
  p.proporsi = null;
  if (o['--proporsi'] != null) {
    var m = /^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/.exec(String(o['--proporsi']).trim());
    if (!m) throw new Galat('--proporsi harus berbentuk mudah:sedang:sulit, mis. 3:5:2, bukan "' + o['--proporsi'] + '"');
    p.proporsi = { mudah: Number(m[1]), sedang: Number(m[2]), sulit: Number(m[3]) };
    if (p.proporsi.mudah + p.proporsi.sedang + p.proporsi.sulit <= 0) throw new Galat('--proporsi tidak boleh nol semua');
  }
  p.komposisi = { ku: {}, pn: {} };
  if (o['--komposisi-ku'] != null) p.komposisi.ku = daftarKomposisi('--komposisi-ku', o['--komposisi-ku'], Bank.URUTAN.ku);
  if (o['--komposisi-pn'] != null) p.komposisi.pn = daftarKomposisi('--komposisi-pn', o['--komposisi-pn'], Bank.URUTAN.pn);
  p.skala = o['--skala'] == null ? 2 : bilanganBulat('--skala', o['--skala'], 1, 4);
  p.zip = !!o['--zip'];
  p.svgJson = !!o['--svg-json'];
  p.tanpaWaktu = !!o['--tanpa-waktu'];
  p.periksaSaja = !!o['--periksa-saja'];
  p.keluaran = o['--keluaran'] == null ? path.join(AKAR, 'output') : path.resolve(String(o['--keluaran']));
  if (!String(p.keluaran).trim()) throw new Galat('--keluaran tidak boleh kosong');
  return p;
}

// ------------------------------------------------------------- pembantu

function ukuran(n) {
  if (n < 1024) return n + ' B';
  if (n < 1048576) return Math.round(n / 1024) + ' KB';
  return (n / 1048576).toFixed(1).replace('.', ',') + ' MB';
}

function detik(ms) { return (ms / 1000).toFixed(1).replace('.', ',') + ' dtk'; }

function dua(n) { return (n < 10 ? '0' : '') + n; }

function stempelWaktu(d) {
  return d.getFullYear() + '-' + dua(d.getMonth() + 1) + '-' + dua(d.getDate()) + '_' + dua(d.getHours()) + dua(d.getMinutes()) + dua(d.getSeconds());
}

function nomor(n, lebar) { var s = String(n); while (s.length < lebar) s = '0' + s; return s; }

function siapkanFolder(p) {
  if (fs.existsSync(p.keluaran) && !fs.statSync(p.keluaran).isDirectory()) throw new Galat('--keluaran bukan folder: ' + p.keluaran);
  if (p.tanpaWaktu) {
    fs.mkdirSync(p.keluaran, { recursive: true });
    return p.keluaran;
  }
  var dasar = path.join(p.keluaran, stempelWaktu(new Date())), folder = dasar, k = 1;
  while (fs.existsSync(folder)) { k++; folder = dasar + '-' + k; }
  fs.mkdirSync(folder, { recursive: true });
  return folder;
}

function tulisBerkas(folder, rel, data) {
  var tujuan = path.join(folder, rel);
  fs.mkdirSync(path.dirname(tujuan), { recursive: true });
  fs.writeFileSync(tujuan, data);
  return { rel: rel.replace(/\\/g, '/'), abs: tujuan, ukuran: data.length };
}

/** Perintah yang mengulang hasil yang sama persis. */
function perintahUlang(p) {
  var a = ['node cli/generate.js', '--paket ' + p.paket, '--subtes ' + p.subtes, '--format ' + p.format.join(','), '--benih ' + p.benih, '--tingkat ' + p.tingkat];
  if (p.proporsi) a.push('--proporsi ' + p.proporsi.mudah + ':' + p.proporsi.sedang + ':' + p.proporsi.sulit);
  ['ku', 'pn'].forEach(function (st) {
    var k = Object.keys(p.komposisi[st]);
    if (k.length) a.push('--komposisi-' + st + ' ' + k.map(function (x) { return x + '=' + p.komposisi[st][x]; }).join(','));
  });
  if (p.skala !== 2) a.push('--skala ' + p.skala);
  if (p.svgJson) a.push('--svg-json');
  return a.join(' ');
}

function tulisZip(Zip, tujuan, berkas) {
  var fd = fs.openSync(tujuan, 'w');
  var penulis = Zip.penulis(function (u8) {
    var geser = 0;
    while (geser < u8.length) geser += fs.writeSync(fd, u8, geser, u8.length - geser);
  });
  var rantai = Promise.resolve();
  berkas.forEach(function (f) {
    rantai = rantai.then(function () { return penulis.tambah(f.rel, fs.readFileSync(f.abs), /\.(json|txt)$/.test(f.rel)); });
  });
  return rantai.then(function () { return penulis.selesai(); }).then(
    function () { fs.closeSync(fd); },
    function (e) { try { fs.closeSync(fd); fs.unlinkSync(tujuan); } catch (x) { /* abaikan */ } throw e; }
  );
}

// ----------------------------------------------------------------- utama

async function utama(argv) {
  var mulaiMs = Date.now();
  var o = urai(argv);
  if (o['--bantuan'] || o['--help'] || o['-h']) { cetak(BANTUAN); return 0; }
  if (o['--versi']) { cetak('Generator Soal OJK PCAM Tahap 1, versi ' + VERSI); return 0; }
  var major = Number(String(process.versions.node).split('.')[0]);
  if (major < 20) throw new Galat('diperlukan Node.js 20 atau lebih baru (terpasang ' + process.versions.node + ')');

  var Bank = require(path.join(JS, 'bank.js'));
  var Paket = require(path.join(JS, 'paket.js'));
  var Validator = require(path.join(JS, 'validator.js'));
  var p = bacaPengaturan(o, Bank);

  cetak('Generator Soal OJK PCAM Tahap 1, versi ' + VERSI);
  cetak('Pengaturan: ' + p.paket + ' paket, subtes ' + p.subtes + ', tingkat ' + p.tingkat +
    (p.proporsi ? ' (' + p.proporsi.mudah + ':' + p.proporsi.sedang + ':' + p.proporsi.sulit + ')' : '') +
    ', benih ' + p.benih + (p.benihDiberi ? '' : ' (diacak)') + ', format ' + (p.periksaSaja ? '(hanya periksa)' : p.format.join(', ') + (p.zip ? ', zip' : '')));

  // 1. membuat paket
  var pembangun;
  try {
    pembangun = Paket.mulai({ benih: p.benih, jumlahPaket: p.paket, subtes: p.subtes, tingkat: p.tingkat, proporsi: p.proporsi || undefined, komposisi: p.komposisi });
  } catch (e) { throw new Galat(e.message); }
  var langkahLapor = Math.max(1, Math.floor(p.paket / 10)), tPaket = Date.now();
  cetak('Membuat ' + p.paket + ' paket ...');
  try {
    while (pembangun.berikut()) {
      var n = pembangun.selesai();
      if (n === p.paket || n % langkahLapor === 0) cetak('  ' + n + '/' + p.paket + ' paket dibuat (' + detik(Date.now() - tPaket) + ')');
      await jeda();
    }
  } catch (e) { throw new Galat(e.message); }
  var hasil = pembangun.hasil();

  // 2. validator
  cetak('Memeriksa dengan validator (hitung ulang dari nol, cari butir kembar) ...');
  var persenTerakhir = -1;
  var validasi = await Validator.periksaHasilAsinkron(hasil, {
    irisanMs: 200,
    saatKemajuan: function (k) {
      // butir 50%, sidik 10%, pencarian kembar 40%; dilaporkan tiap 25% supaya log tetap singkat
      var bagian = k.fase === 'butir' ? 0.5 * k.selesai / k.total : (k.fase === 'sidik' ? 0.5 + 0.1 * k.selesai / k.total : 0.6 + 0.4 * k.selesai / Math.max(1, k.total));
      var langkah = Math.floor(bagian * 4) * 25;
      if (hasil.paket.length >= 100 && langkah > persenTerakhir && langkah < 100) { persenTerakhir = langkah; cetak('  validator ' + langkah + '% ...'); }
    }
  });
  var Ekspor = require(path.join(JS, 'ekspor.js'));
  var baris = Ekspor.ringkasan(hasil, validasi);
  baris.forEach(function (b) { cetak('  ' + b); });
  if (!validasi.lulus) {
    var rincian = [];
    validasi.gagal.slice(0, 5).forEach(function (g) { rincian.push(g.id + ': ' + (g.masalah || []).slice(0, 2).join('; ')); });
    validasi.paketGagal.slice(0, 3).forEach(function (g) { rincian.push('paket ' + g.paket + ': ' + g.masalah.slice(0, 2).join('; ')); });
    validasi.kembar.slice(0, 3).forEach(function (k) { rincian.push('kembar ' + k.a + ' ~ ' + k.b + ' (' + k.jenis + ')'); });
    rincian.forEach(function (r) { cetak('  ! ' + r); });
    throw new Galat('validator menolak hasil (' + validasi.gagal.length + ' butir gagal, ' + validasi.paketGagal.length + ' paket tidak konsisten, ' + validasi.kembar.length + ' kembar); tidak ada berkas yang ditulis');
  }
  var ringkas = hasil.paket.length + ' paket, ' + validasi.butir + ' butir, validator lulus ' + validasi.butirLulus + '/' + validasi.butir + ', 0 kembar, benih ' + p.benih;

  if (p.periksaSaja) {
    cetak('HASIL: ' + ringkas + ' (hanya diperiksa, tidak ada berkas ditulis)');
    return 0;
  }

  // 3. menulis berkas
  var folder = siapkanFolder(p);
  cetak('Menulis berkas ke ' + folder);
  var tertulis = [];
  var perluDokumen = p.format.indexOf('docx') >= 0 || p.format.indexOf('pdf') >= 0;

  if (p.format.indexOf('xlsx') >= 0) {
    var xl = await Ekspor.xlsx(hasil);
    tertulis.push(tulisBerkas(folder, NAMA_DASAR + '.xlsx', xl));
    cetak('  ' + NAMA_DASAR + '.xlsx (' + ukuran(xl.length) + ')');
  }
  if (p.format.indexOf('json') >= 0) {
    var js = Buffer.from(Ekspor.json(hasil, { svg: p.svgJson }, validasi), 'utf8');
    tertulis.push(tulisBerkas(folder, NAMA_DASAR + '.json', js));
    cetak('  ' + NAMA_DASAR + '.json (' + ukuran(js.length) + ')');
  }

  var jmlGambar = 0, tGambar = Date.now();
  for (var i = 0; i < hasil.paket.length; i++) {
    var t0 = Date.now(), paket = hasil.paket[i];
    var berkas = await Ekspor.berkasPaket(paket, {
      docx: p.format.indexOf('docx') >= 0, pdf: p.format.indexOf('pdf') >= 0, gambar: true, skala: p.skala, benih: p.benih
    });
    var ket = [], png = 0;
    berkas.forEach(function (b) {
      var t = tulisBerkas(folder, b.nama, b.data);
      tertulis.push(t);
      if (b.jenis === 'png') png++; else ket.push(b.jenis + ' ' + ukuran(b.data.length));
    });
    jmlGambar += png;
    var baru = i + 1;
    if (baru === hasil.paket.length || baru % langkahLapor === 0 || hasil.paket.length <= 10) {
      cetak('  paket-' + nomor(paket.no, 3) + ': ' + png + ' gambar' + (ket.length ? ', ' + ket.join(', ') : '') + ' (' + detik(Date.now() - t0) + '; ' + baru + '/' + hasil.paket.length + ')');
    }
    await jeda();
  }

  var teksRingkasan = [
    'Generator Soal OJK PCAM Tahap 1 - ringkasan (versi ' + VERSI + ')',
    'Dibuat       : ' + new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
    'Benih        : ' + p.benih,
    'Paket        : ' + hasil.paket.length,
    'Subtes       : ' + hasil.meta.subtes.join(', '),
    'Tingkat      : ' + p.tingkat + ' (mudah:sedang:sulit = ' + hasil.meta.proporsi.mudah + ':' + hasil.meta.proporsi.sedang + ':' + hasil.meta.proporsi.sulit + ')',
    'Komposisi KU : ' + Object.keys(hasil.meta.komposisi.ku).map(function (k) { return k + '=' + hasil.meta.komposisi.ku[k]; }).join(', '),
    'Komposisi PN : ' + Object.keys(hasil.meta.komposisi.pn).map(function (k) { return k + '=' + hasil.meta.komposisi.pn[k]; }).join(', '),
    'Format       : ' + p.format.join(', '),
    'Gambar PNG   : ' + jmlGambar + ' berkas (skala ' + p.skala + ')',
    'Validator    : ' + validasi.butir + ' butir, lulus ' + validasi.butirLulus + ', gagal ' + validasi.gagal.length + ', kembar ' + validasi.kembar.length,
    ''
  ].concat(baris, [
    '',
    'Untuk mengulang hasil yang sama persis:',
    '  ' + perintahUlang(p),
    ''
  ]);
  tertulis.push(tulisBerkas(folder, 'ringkasan.txt', Buffer.from(teksRingkasan.join('\n'), 'utf8')));

  if (p.zip) {
    cetak('Membungkus ZIP (' + tertulis.length + ' berkas) ...');
    await jeda();
    var Zip = require(path.join(JS, 'zip.js'));
    var tujuanZip = path.join(folder, NAMA_DASAR + '.zip');
    await tulisZip(Zip, tujuanZip, tertulis);
    tertulis.push({ rel: NAMA_DASAR + '.zip', abs: tujuanZip, ukuran: fs.statSync(tujuanZip).size });
    cetak('  ' + NAMA_DASAR + '.zip (' + ukuran(fs.statSync(tujuanZip).size) + ')');
  }

  // 4. laporan akhir
  var utamaBerkas = tertulis.filter(function (f) { return /^[^\/]+\.(xlsx|json|zip)$/.test(f.rel); });
  if (hasil.paket.length <= 3) utamaBerkas = utamaBerkas.concat(tertulis.filter(function (f) { return /\.(docx|pdf)$/.test(f.rel); }));
  utamaBerkas.forEach(function (f) { cetak('BERKAS -> ' + f.abs); });
  var total = tertulis.reduce(function (s, f) { return s + f.ukuran; }, 0);
  cetak('HASIL: ' + ringkas + '; ' + tertulis.length + ' berkas (' + ukuran(total) + ') dalam ' + detik(Date.now() - mulaiMs) + '; folder ' + folder);
  return 0;
}

utama(process.argv.slice(2)).then(
  function (kode) { process.exitCode = kode; },
  function (e) {
    var pesan = e && e.galatPengguna ? e.message : 'galat tak terduga: ' + (e && e.message ? e.message : String(e));
    if (e && !e.galatPengguna && e.stack && process.env.OJK_DEBUG) process.stderr.write(e.stack + '\n');
    cetak('GAGAL: ' + pesan);
    process.exitCode = 1;
  }
);
