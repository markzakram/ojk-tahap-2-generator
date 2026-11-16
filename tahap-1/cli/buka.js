#!/usr/bin/env node
/*
 * buka.js — menyalakan Generator Soal OJK PCAM Tahap 1 lewat server web lokal.
 *
 *   node cli/buka.js [--port <n>] [--lokal]
 *
 * Melayani folder generator (index.html, js/, css/, contoh-keluaran/) di http://localhost:<port>.
 * Isinya sama dengan membuka index.html dari disk: seluruh pembuatan soal tetap berjalan di
 * peramban. Dipakai tombol "Buka Generator OJK" di Agent Office, atau langsung dari terminal.
 * Tanpa pustaka luar dan tanpa internet (Node.js 20 atau lebih baru).
 *
 * Aturan server:
 *
 *   - mendengar di 0.0.0.0 untuk akses satu jaringan; --lokal membatasi ke 127.0.0.1;
 *     Host hanya menerima localhost, alamat loopback, dan IP antarmuka jaringan komputer ini;
 *   - hanya GET dan HEAD, tanpa daftar isi folder, semua jawaban Cache-Control: no-store;
 *   - tidak pernah melayani berkas di luar folder generator: ".." (juga %2e%2e), garis miring
 *     terbalik, path absolut, huruf drive Windows, nama berawalan titik (.git, .claude), nama
 *     perangkat Windows (CON, NUL, ...), dan tautan yang menuju keluar folder ditolak;
 *   - % yang rusak di alamat dijawab 400 dan server tetap hidup.
 *
 * Port baku 3300. Kalau sudah dipakai (di 127.0.0.1 maupun ::1, jadi "localhost" tidak mendarat
 * di program lain), dicoba port berikutnya sampai 10 kali. Setelah siap, satu baris dicetak
 * berisi alamatnya; Agent Office mengenali aplikasi sudah menyala dari baris ini:
 *
 *   Generator OJK Tahap 1 berjalan di http://localhost:3300
 *
 * Link jaringan dicetak setelahnya. Regex Agent Office hanya menangkap alamat localhost.
 * Berhenti rapi
 * dengan Ctrl+C (SIGINT) atau SIGTERM; kode keluar 0. Kegagalan mencetak "GAGAL: ..." (keluar 1).
 *
 * Sebagai modul: require('./buka.js').mulai({ port, akar, cadangan, lokal }) -> Promise<{ server,
 * port, url, jaringan, dilewati, tutup() }>. Dipakai uji/server.js.
 */
'use strict';

var fs = require('fs');
var http = require('http');
var net = require('net');
var os = require('os');
var path = require('path');
var stream = require('stream');

var JUDUL = 'Generator OJK Tahap 1';
var AKAR = path.resolve(__dirname, '..');
var PORT_BAKU = 3300;
var CADANGAN = 10;

var BANTUAN = [
  'Generator Soal OJK PCAM Tahap 1 - server lokal',
  '',
  'Menyalakan antarmuka generator (index.html) lewat server web di komputer ini, supaya bisa',
  'dibuka dari Agent Office atau peramban, termasuk perangkat dalam satu jaringan kantor.',
  'Isinya sama dengan membuka index.html dari disk;',
  'pembuatan soal tetap berjalan di peramban. Tanpa internet dan tanpa pustaka luar.',
  '',
  'Pemakaian:',
  '  node cli/buka.js [opsi]',
  '',
  'Opsi:',
  '  --port <n>             Nomor port, 1 sampai 65535, atau 0 untuk port acak. Baku: 3300.',
  '                         Kalau port itu sudah dipakai, dicoba port berikutnya sampai 10 kali',
  '                         (3300, 3301, ... 3310).',
  '  --lokal               Hanya komputer ini (127.0.0.1). Bawaan: akses satu jaringan aktif.',
  '  --bantuan, --help, -h  Tampilkan bantuan ini.',
  '',
  'Server mendengar di 0.0.0.0 dan menampilkan link IP komputer untuk satu jaringan.',
  'Hanya GET dan HEAD, tanpa daftar isi folder, dan tidak melayani berkas di luar generator.',
  '',
  'Keluaran: alamat komputer ini, lalu link jaringan yang dapat dibagikan, mis.',
  '  Generator OJK Tahap 1 berjalan di http://localhost:3300',
  '  Jaringan kantor (Wi-Fi): http://192.168.1.10:3300',
  'Berhenti dengan Ctrl+C. Di Agent Office, matikan lewat tombol Matikan.',
  '',
  'Kegagalan (opsi salah, tidak ada port kosong) mencetak "GAGAL: <alasan>" dengan kode keluar 1.',
  '',
  'Contoh:',
  '  node cli/buka.js',
  '  node cli/buka.js --port 3400',
  '  node cli/buka.js --lokal'
].join('\n');

var UTF8 = '; charset=utf-8';
var MIME = {
  '.html': 'text/html' + UTF8,
  '.htm': 'text/html' + UTF8,
  '.js': 'text/javascript' + UTF8,
  '.mjs': 'text/javascript' + UTF8,
  '.css': 'text/css' + UTF8,
  '.json': 'application/json' + UTF8,
  '.map': 'application/json' + UTF8,
  '.txt': 'text/plain' + UTF8,
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/vnd.microsoft.icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.pdf': 'application/pdf',
  '.zip': 'application/zip'
};

// Host loopback tetap sah; mode jaringan juga menerima IP antarmuka komputer ini.
var HOST_SAH = /^(?:localhost|127\.0\.0\.1|\[::1\])(?::\d{1,5})?$/i;
// Karakter yang tidak boleh ada di nama berkas mana pun: kontrol, NUL, <>:"|?*, dan garis miring
// terbalik. ":" menutup huruf drive Windows (C:) dan aliran data NTFS (berkas::$DATA).
var KARAKTER_TERLARANG = /[\u0000-\u001f\u007f<>:"|?*\\]/;
// Nama perangkat Windows (CON, NUL, COM1, LPT1 ...) dengan atau tanpa ekstensi.
var NAMA_PERANGKAT = /^(?:con|prn|aux|nul|com[0-9¹²³]|lpt[0-9¹²³])(?:\.|$)/i;

function Galat(pesan) { var e = new Error(pesan); e.galatPengguna = true; return e; }

function cetak(teks) { process.stdout.write(teks + '\n'); }

// ------------------------------------------------------------------ opsi

function urai(argv) {
  var o = { port: PORT_BAKU, lokal: false }, i = 0;
  while (i < argv.length) {
    var a = String(argv[i++]);
    var nama = a, nilai = null, sama = a.indexOf('=');
    if (sama > 0) { nama = a.slice(0, sama); nilai = a.slice(sama + 1); }
    if (nama === '--lokal') {
      if (nilai !== null) throw Galat('--lokal tidak menerima nilai');
      o.lokal = true;
      continue;
    }
    if (nama !== '--port') {
      throw Galat(a.slice(0, 1) === '-' ? 'opsi tidak dikenal: ' + nama + ' (lihat --help)' : 'argumen tidak dikenal: "' + a + '" (semua opsi diawali --; lihat --help)');
    }
    if (nilai === null) {
      if (i >= argv.length) throw Galat('opsi --port memerlukan nilai');
      nilai = String(argv[i++]);
    }
    if (!/^\d{1,5}$/.test(nilai) || Number(nilai) > 65535) throw Galat('--port harus bilangan bulat 0 sampai 65535, bukan "' + nilai + '"');
    o.port = Number(nilai);
  }
  return o;
}

// Satu link per IPv4 yang bisa dipakai di jaringan. Nama adaptor membantu memilih Wi-Fi/LAN
// ketika komputer juga memiliki VPN atau adaptor virtual. Abaikan loopback dan link-local.
function daftarJaringan(antarmuka) {
  antarmuka = antarmuka || os.networkInterfaces();
  var hasil = [], terlihat = new Set();
  Object.keys(antarmuka).forEach(function (nama) {
    (antarmuka[nama] || []).forEach(function (a) {
      if (a.internal || (a.family !== 'IPv4' && a.family !== 4) || !net.isIPv4(a.address) ||
          /^(?:127\.|169\.254\.|0\.)/.test(a.address) || terlihat.has(a.address)) return;
      terlihat.add(a.address);
      hasil.push({ nama: nama, alamat: a.address });
    });
  });
  return hasil;
}

function hostSah(host, jaringan) {
  if (HOST_SAH.test(host)) return true;
  var m = /^(\d+\.\d+\.\d+\.\d+)(?::\d{1,5})?$/.exec(host);
  return !!m && jaringan.some(function (a) { return a.alamat === m[1]; });
}

// ---------------------------------------------------------------- jalur

/**
 * Alamat permintaan -> daftar nama folder dan berkas di dalam folder generator.
 * Hasil: { segmen: [...] } bila aman ([] berarti "/"), atau { status, pesan } bila ditolak.
 * Tidak menyentuh disk; dipisah supaya mudah diuji.
 */
function uraiJalur(alamat) {
  var mentah = String(alamat).split('#')[0].split('?')[0];
  if (mentah.charAt(0) !== '/') return { status: 400, pesan: 'Alamat tidak sah' };
  var jalur;
  try { jalur = decodeURIComponent(mentah); } catch (e) { return { status: 400, pesan: 'Alamat tidak sah' }; }
  var segmen = [], bagian = jalur.split('/');
  for (var i = 0; i < bagian.length; i++) {
    var s = bagian[i];
    if (s === '' || s === '.') continue;
    // ".." dan semua yang mirip: titik/spasi di ujung nama dibuang diam-diam oleh Windows, nama
    // berawalan titik (.git, .claude, .env) bukan bagian aplikasi
    if (s === '..' || s.charAt(0) === '.' || /[. ]$/.test(s) || KARAKTER_TERLARANG.test(s)) return { status: 403, pesan: 'Jalur ditolak' };
    if (NAMA_PERANGKAT.test(s)) return { status: 404, pesan: 'Tidak ditemukan' };
    segmen.push(s);
  }
  return { segmen: segmen };
}

function didalam(akar, nyata) {
  if (process.platform === 'win32') { akar = akar.toLowerCase(); nyata = nyata.toLowerCase(); }
  return nyata === akar || nyata.slice(0, akar.length + 1) === akar + path.sep;
}

// ------------------------------------------------------------------ server

function jawab(req, res, status, pesan, tambahan) {
  var isi = pesan + '\n';
  var kepala = { 'Content-Type': 'text/plain' + UTF8, 'Content-Length': Buffer.byteLength(isi), 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
  Object.keys(tambahan || {}).forEach(function (k) { kepala[k] = tambahan[k]; });
  res.writeHead(status, kepala);
  res.end(req.method === 'HEAD' ? undefined : isi);
}

function kirim(req, res, nyata, st) {
  var ekstensi = path.extname(nyata).toLowerCase();
  var tipe = Object.prototype.hasOwnProperty.call(MIME, ekstensi) ? MIME[ekstensi] : 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': tipe, 'Content-Length': st.size, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  if (req.method === 'HEAD') { res.end(); return; }
  // pipeline menutup berkas bila peramban membatalkan di tengah jalan
  stream.pipeline(fs.createReadStream(nyata), res, function () { /* putus di tengah jalan: abaikan */ });
}

function layani(req, res, akar, akarNyata, jaringan) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return jawab(req, res, 405, 'Hanya GET dan HEAD', { Allow: 'GET, HEAD' });
  if (req.headers.host !== undefined && !hostSah(req.headers.host, jaringan)) return jawab(req, res, 403, 'Host tidak diizinkan');
  var u = uraiJalur(req.url);
  if (u.status) return jawab(req, res, u.status, u.pesan);
  var berkas = path.join.apply(path, [akar].concat(u.segmen.length ? u.segmen : ['index.html']));
  // realpath mengikuti tautan simbolik dan junction: yang menuju keluar folder ditolak
  fs.realpath(berkas, function (e1, nyata) {
    try {
      if (e1) {
        // Chrome selalu meminta /favicon.ico; jawaban 404 tercatat di konsol sebagai galat. Aplikasi ini
        // tidak punya ikon, jadi dijawab "tidak ada isi" (204) yang tidak dicatat sebagai galat.
        if (u.segmen.length === 1 && u.segmen[0].toLowerCase() === 'favicon.ico') {
          res.writeHead(204, { 'Cache-Control': 'no-store' });
          return res.end();
        }
        return jawab(req, res, 404, 'Tidak ditemukan');
      }
      if (!didalam(akarNyata, nyata)) return jawab(req, res, 403, 'Jalur ditolak');
      fs.stat(nyata, function (e2, st) {
        try {
          // folder tidak pernah dilistkan
          if (e2 || !st.isFile()) return jawab(req, res, 404, 'Tidak ditemukan');
          kirim(req, res, nyata, st);
        } catch (x) { res.destroy(); }
      });
    } catch (x) { res.destroy(); }
  });
}

function buatServer(akar, akarNyata, jaringan) {
  var server = http.createServer(function (req, res) {
    try { layani(req, res, akar, akarNyata, jaringan); } catch (e) {
      try { jawab(req, res, 500, 'Galat server'); } catch (x) { res.destroy(); }
    }
  });
  server.on('clientError', function (e, soket) {
    if (!soket.writable) { soket.destroy(); return; }
    var status = e && e.code === 'HPE_HEADER_OVERFLOW' ? '431 Request Header Fields Too Large' : '400 Bad Request';
    soket.end('HTTP/1.1 ' + status + '\r\nCache-Control: no-store\r\nConnection: close\r\nContent-Length: 0\r\n\r\n');
  });
  return server;
}

// -------------------------------------------------------------------- port

// Ada program lain yang menerima sambungan di port ini, di 127.0.0.1 atau ::1? Mencoba bind saja tidak
// cukup: program yang mendengar di ::1 (mis. server dev Node memakai "localhost") tidak bentrok dengan
// 127.0.0.1, padahal peramban membuka "localhost" ke ::1 lebih dulu dan akan mendarat di program itu.
function adaPendengar(port) {
  return Promise.all(['127.0.0.1', '::1'].map(function (alamat) {
    return new Promise(function (selesai) {
      var sudah = false, batas = null, soket = net.connect({ host: alamat, port: port });
      function akhir(ada) {
        if (sudah) return;
        sudah = true;
        clearTimeout(batas);
        soket.destroy();
        selesai(ada);
      }
      batas = setTimeout(function () { akhir(false); }, 500);
      soket.on('connect', function () { akhir(true); });
      soket.on('error', function () { akhir(false); });
    });
  })).then(function (hasil) { return hasil[0] || hasil[1]; });
}

function dengarkan(server, port, host) {
  return new Promise(function (selesai, gagal) {
    function salah(e) { gagal(e); }
    server.once('error', salah);
    server.listen({ port: port, host: host }, function () {
      server.removeListener('error', salah);
      selesai();
    });
  });
}

/**
 * Menyalakan server. opsi.port: baku 3300, 0 = port acak dari sistem. opsi.cadangan: berapa port
 * berikutnya yang dicoba bila port terpakai (baku 10). opsi.akar: folder yang dilayani (baku folder
 * generator). opsi.lokal: true = hanya komputer ini, bawaan false = satu jaringan.
 * Hasil: { server, port, url, jaringan: [{ nama, alamat, url }], dilewati, tutup() }.
 */
function mulai(opsi) {
  opsi = opsi || {};
  var akar = path.resolve(opsi.akar || AKAR);
  var host = opsi.lokal ? '127.0.0.1' : '0.0.0.0';
  var jaringan = opsi.lokal ? [] : daftarJaringan();
  var awal = opsi.port === undefined ? PORT_BAKU : opsi.port;
  var cadangan = opsi.cadangan === undefined ? CADANGAN : opsi.cadangan;
  var batas = awal === 0 ? 0 : Math.min(awal + cadangan, 65535);
  var akarNyata;
  try { akarNyata = fs.realpathSync(akar); } catch (e) { return Promise.reject(Galat('folder tidak ditemukan: ' + akar)); }
  var dilewati = [];

  function coba(port) {
    if (port > batas) {
      return Promise.reject(Galat('port ' + awal + (batas > awal ? ' sampai ' + batas : '') + ' sedang dipakai; pilih nomor lain dengan --port <n>'));
    }
    return (port === 0 ? Promise.resolve(false) : adaPendengar(port)).then(function (ada) {
      if (ada) { dilewati.push(port); return coba(port + 1); }
      var server = buatServer(akar, akarNyata, jaringan);
      return dengarkan(server, port, host).then(function () {
        var nyata = server.address().port;
        return {
          server: server,
          port: nyata,
          url: 'http://localhost:' + nyata,
          jaringan: jaringan.map(function (a) { return { nama: a.nama, alamat: a.alamat, url: 'http://' + a.alamat + ':' + nyata }; }),
          dilewati: dilewati,
          // berhenti rapi: tidak menerima sambungan baru, sambungan menganggur ditutup, sisanya diberi
          // 1 detik sebelum dipaksa tutup
          tutup: function () {
            return new Promise(function (selesai) {
              var paksa = setTimeout(function () { server.closeAllConnections(); }, 1000);
              server.close(function () { clearTimeout(paksa); selesai(); });
              server.closeIdleConnections();
            });
          }
        };
      }, function (e) {
        // EACCES: di Windows juga muncul untuk port yang dicadangkan sistem
        if (e && (e.code === 'EADDRINUSE' || e.code === 'EACCES')) { dilewati.push(port); return coba(port + 1); }
        throw e;
      });
    });
  }
  return coba(awal);
}

// ----------------------------------------------------------------- utama

function pasangPenghenti(sv) {
  var sedang = false;
  function henti(nama) {
    if (sedang) process.exit(0); // sinyal kedua: berhenti sekarang juga
    sedang = true;
    cetak(JUDUL + ' dihentikan (' + nama + ').');
    // pengaman bila ada sambungan yang macet; tidak menahan proses yang sudah selesai
    setTimeout(function () { process.exit(0); }, 3000).unref();
    sv.tutup().then(function () { process.exitCode = 0; });
  }
  // SIGBREAK dan SIGHUP hanya ada di Windows (Ctrl+Break, jendela konsol ditutup); di sistem lain
  // pemasangannya diabaikan
  ['SIGINT', 'SIGTERM', 'SIGBREAK', 'SIGHUP'].forEach(function (nama) {
    try { process.on(nama, function () { henti(nama); }); } catch (e) { /* sinyal tidak ada di sistem ini */ }
  });
}

async function utama(argv) {
  if (argv.some(function (a) { return a === '--help' || a === '--bantuan' || a === '-h'; })) { cetak(BANTUAN); return; }
  var o = urai(argv);
  var major = Number(String(process.versions.node).split('.')[0]);
  if (major < 20) throw Galat('diperlukan Node.js 20 atau lebih baru (terpasang ' + process.versions.node + ')');

  var sv = await mulai(o);
  sv.server.on('error', function (e) {
    cetak('GAGAL: server berhenti karena galat: ' + e.message);
    process.exitCode = 1;
    sv.tutup();
  });
  if (sv.dilewati.length) {
    var pertama = sv.dilewati[0], terakhir = sv.dilewati[sv.dilewati.length - 1];
    cetak('Port ' + (pertama === terakhir ? pertama : pertama + '-' + terakhir) + ' sedang dipakai; memakai port ' + sv.port + '.');
  }
  cetak(JUDUL + ' berjalan di ' + sv.url);
  sv.jaringan.forEach(function (a) { cetak('Jaringan kantor (' + a.nama + '): ' + a.url); });
  if (o.lokal) cetak('Mode lokal: hanya bisa dibuka dari komputer ini.');
  else if (!sv.jaringan.length) cetak('Link jaringan belum tersedia. Sambungkan Wi-Fi/LAN lalu jalankan ulang server.');
  else cetak('Bagikan link Jaringan kantor ke perangkat pada Wi-Fi/LAN yang sama.');
  cetak('Tekan Ctrl+C untuk menghentikan.');
  pasangPenghenti(sv);
}

module.exports = { mulai: mulai, urai: urai, uraiJalur: uraiJalur, daftarJaringan: daftarJaringan, MIME: MIME, PORT_BAKU: PORT_BAKU, CADANGAN: CADANGAN, JUDUL: JUDUL };

if (require.main === module) {
  utama(process.argv.slice(2)).catch(function (e) {
    var pesan = e && e.galatPengguna ? e.message : 'galat tak terduga: ' + (e && e.message ? e.message : String(e));
    if (e && !e.galatPengguna && e.stack && process.env.OJK_DEBUG) process.stderr.write(e.stack + '\n');
    cetak('GAGAL: ' + pesan);
    process.exitCode = 1;
  });
}
