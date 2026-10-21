/*
 * server.js — uji server lokal cli/buka.js dan antarmuka yang dibuka lewat http://.
 *
 *   node uji/server.js [--cepat] [--tanpa-peramban]
 *
 * Tanpa pustaka luar dan tanpa internet. Semua server menyala di port acak yang diberikan sistem
 * (tidak pernah di port baku 3300 atau port program lain), dan semua hasil sementara ditulis ke
 * folder sementara yang dihapus lagi.
 *
 * Bagian node (selalu jalan, beberapa detik):
 *   1. Folder generator yang asli: GET / dan semua skrip/stylesheet yang dirujuk index.html -> 200
 *      dengan MIME dan isi yang benar; contoh-keluaran (json, xlsx, docx, pdf, txt, png) bisa
 *      diunduh utuh; HEAD, 405, 404, tanpa daftar isi folder, Cache-Control: no-store, favicon 204.
 *   2. Mode bawaan menerima akses jaringan; --lokal hanya 127.0.0.1; Host asing ditolak.
 *   3. Tabel MIME (html, js, css, json, png, svg, ico, woff, woff2, docx, pdf, xlsx, zip, txt).
 *   4. Penjaga path: traversal (.., %2e%2e, garis miring terbalik, path absolut, huruf drive,
 *      UNC, NUL, aliran NTFS), berkas berawalan titik, tautan keluar folder, % yang rusak (400),
 *      permintaan aneh. Berkas "rahasia" di luar folder tidak pernah bocor dan server tetap hidup.
 *   5. Port: terpakai -> port berikutnya (juga bila yang memakai mendengar di 0.0.0.0 atau ::1),
 *      semua terpakai -> galat yang jelas.
 *   6. Berhenti rapi: tutup() mengakhiri sambungan menganggur dan yang macet, lalu port bebas.
 *   7. Perintah node cli/buka.js: --help keluar seketika, opsi salah -> GAGAL (keluar 1), baris
 *      alamat yang dicetak cocok dengan "alamat" di agent-office.json, port terpakai -> port
 *      berikutnya, SIGTERM menghentikan proses dan melepas port.
 *
 * Bagian peramban (perlu Chrome/Edge dan Node.js 22+; dilewati bila tidak ada): seluruh uji
 * antarmuka uji/browser.js dijalankan ulang lewat http://localhost:<port>/ (pembuatan paket, mode
 * coba interaktif, unduhan), lalu halaman dibuka lewat 127.0.0.1 dan IP jaringan tanpa galat
 * konsol; unduhan Blob sungguhan (klik tombol, berkas masuk folder) diperiksa isinya.
 */
'use strict';

var fs = require('fs');
var os = require('os');
var path = require('path');
var http = require('http');
var net = require('net');
var cp = require('child_process');
var crypto = require('crypto');
var Buka = require('../cli/buka.js');
var Berkas = require('./berkas.js');

var AKAR = path.resolve(__dirname, '..');
var SKRIP_BUKA = path.join(AKAR, 'cli', 'buka.js');
var AMAN = [400, 403, 404];
var BARIS_SIAP = /berjalan di http:\/\/localhost:\d+/;

function tunggu(ms) { return new Promise(function (selesai) { setTimeout(selesai, ms); }); }
function hash(buf) { return crypto.createHash('sha256').update(buf).digest('hex'); }
function portDari(baris) { return Number(/localhost:(\d+)/.exec(baris)[1]); }

/** Permintaan HTTP (bawaan 127.0.0.1). jalur dikirim apa adanya. */
function minta(port, o) {
  o = o || {};
  return new Promise(function (selesai, gagal) {
    var req;
    try {
      req = http.request({ host: o.host || '127.0.0.1', port: port, method: o.metode || 'GET', path: o.jalur === undefined ? '/' : o.jalur, headers: o.kepala || {}, agent: o.agen || false, timeout: 15000 }, function (res) {
        var potong = [];
        res.on('data', function (d) { potong.push(d); });
        res.on('end', function () { selesai({ status: res.statusCode, kepala: res.headers, isi: Buffer.concat(potong) }); });
        res.on('error', gagal);
      });
    } catch (e) { gagal(e); return; }
    req.on('timeout', function () { req.destroy(new Error('waktu habis')); });
    req.on('error', gagal);
    req.end();
  });
}

/** Kirim teks mentah lewat soket dan kumpulkan jawabannya sampai server menutup (atau waktu habis). */
function mentah(port, teks, batasMs) {
  return new Promise(function (selesai) {
    var keluar = '', soket = net.connect({ host: '127.0.0.1', port: port });
    var timer = setTimeout(function () { soket.destroy(); }, batasMs || 3000);
    soket.on('connect', function () { soket.write(teks, 'latin1'); });
    soket.on('data', function (d) { keluar += d.toString('latin1'); });
    soket.on('error', function () { /* dinilai dari isi */ });
    soket.on('close', function () { clearTimeout(timer); selesai(keluar); });
  });
}

/** Apakah ada yang menerima sambungan di alamat dan port ini? */
function tersambung(port, host) {
  return new Promise(function (selesai) {
    var s = net.connect({ host: host || '127.0.0.1', port: port });
    var timer = setTimeout(function () { s.destroy(); selesai(false); }, 2000);
    s.on('connect', function () { clearTimeout(timer); s.destroy(); selesai(true); });
    s.on('error', function () { clearTimeout(timer); selesai(false); });
  });
}

/** Server tiruan yang menempati satu port (host dan port tertentu; port 0 = dipilih sistem). */
function tempati(host, port) {
  return new Promise(function (selesai, gagal) {
    var s = net.createServer(function (soket) { soket.destroy(); });
    s.once('error', gagal);
    s.listen({ host: host, port: port || 0 }, function () { selesai({ server: s, port: s.address().port, tutup: function () { return lepas(s); } }); });
  });
}
function lepas(s) { return new Promise(function (selesai) { try { s.close(function () { selesai(); }); } catch (e) { selesai(); } }); }

function cariFile(dir, pola, out) {
  out = out || [];
  fs.readdirSync(dir, { withFileTypes: true }).forEach(function (e) {
    var p = path.join(dir, e.name);
    if (e.isDirectory()) cariFile(p, pola, out); else if (pola.test(p)) out.push(p);
  });
  return out;
}

/** Proses `node cli/buka.js <args>` dengan keluaran per baris. */
function lancar(args) {
  var anak = cp.spawn(process.execPath, [SKRIP_BUKA].concat(args), { cwd: os.tmpdir(), stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  var baris = [], sisa = '', galat = '', keluar = null, pengamat = [];
  function periksa() {
    pengamat = pengamat.filter(function (w) {
      var l = baris.filter(function (x) { return w.re.test(x); })[0];
      if (l !== undefined) { clearTimeout(w.timer); w.selesai(l); return false; }
      if (keluar) { clearTimeout(w.timer); w.gagal(new Error('proses berhenti (kode ' + keluar.kode + ') sebelum ' + w.re + ' muncul; keluaran: ' + baris.join(' | ').slice(0, 200))); return false; }
      return true;
    });
  }
  anak.stdout.setEncoding('utf8');
  anak.stdout.on('data', function (d) {
    sisa += d;
    var bagian = sisa.split(/\r?\n/);
    sisa = bagian.pop();
    bagian.forEach(function (l) { baris.push(l); });
    periksa();
  });
  anak.stderr.on('data', function (d) { galat += d; });
  anak.on('exit', function (kode, sinyal) { keluar = { kode: kode, sinyal: sinyal }; });
  anak.on('close', function () { if (sisa) { baris.push(sisa); sisa = ''; } periksa(); });
  return {
    anak: anak,
    baris: baris,
    galat: function () { return galat; },
    sudahKeluar: function () { return keluar; },
    tutup: function () { try { anak.kill('SIGKILL'); } catch (e) { /* sudah mati */ } return Promise.resolve(); },
    tunggu: function (re, ms) {
      return new Promise(function (selesai, gagal) {
        var w = { re: re, selesai: selesai, gagal: gagal, timer: null };
        w.timer = setTimeout(function () { pengamat = pengamat.filter(function (x) { return x !== w; }); gagal(new Error(re + ' tidak muncul dalam ' + (ms || 10000) + ' ms; keluaran: ' + baris.join(' | ').slice(0, 200))); }, ms || 10000);
        pengamat.push(w);
        periksa();
      });
    },
    berhenti: function (sinyal) {
      return new Promise(function (selesai) {
        if (keluar) { selesai(keluar); return; }
        var timer = setTimeout(function () { try { anak.kill('SIGKILL'); } catch (e) { /* abaikan */ } }, 8000);
        anak.once('exit', function (kode, sig) { clearTimeout(timer); selesai({ kode: kode, sinyal: sig }); });
        try { anak.kill(sinyal || 'SIGTERM'); } catch (e) { /* sudah mati */ }
      });
    }
  };
}

// ============================================== 1. folder generator yang asli + 2. alamat dan Host

async function ujiFolderAsli(k) {
  var cek = k.cek;
  var sv = await k.nyalakan({ port: 0, lokal: true });
  var alamat = sv.server.address();
  cek(alamat.address === '127.0.0.1' && alamat.family === 'IPv4' && sv.port > 0 && sv.url === 'http://localhost:' + sv.port, 'server menyala di port acak ' + sv.port + ' dan hanya di 127.0.0.1', JSON.stringify(alamat));

  var indeks = fs.readFileSync(path.join(AKAR, 'index.html'));
  k.indeks = indeks;
  var r = await minta(sv.port, { jalur: '/' });
  cek(r.status === 200 && /^text\/html; charset=utf-8$/i.test(r.kepala['content-type'] || '') && r.isi.equals(indeks), 'GET / -> 200 text/html dan isinya sama dengan index.html', r.status + ' ' + r.kepala['content-type']);
  r = await minta(sv.port, { jalur: '/index.html?x=1#bagian' });
  cek(r.status === 200 && r.isi.equals(indeks), 'GET /index.html (dengan query dan fragmen) -> 200, isi sama');
  cek(r.kepala['cache-control'] === 'no-store' && r.kepala['x-content-type-options'] === 'nosniff', 'jawaban memuat Cache-Control: no-store dan X-Content-Type-Options: nosniff', r.kepala['cache-control']);

  var rujukan = [];
  String(indeks).replace(/<(?:script|link)\b[^>]*?\b(?:src|href)="([^"]+)"/g, function (_, u) {
    if (!/^[a-z][a-z0-9+.-]*:|^\/\//i.test(u) && u.charAt(0) !== '#') rujukan.push(u);
    return _;
  });
  var salahAset = [], utuh = 0;
  for (var i = 0; i < rujukan.length; i++) {
    var ra = await minta(sv.port, { jalur: '/' + rujukan[i].replace(/^\.?\//, '') });
    var ekst = path.extname(rujukan[i]), tipe = ra.kepala['content-type'] || '';
    var tipeOk = ekst === '.js' ? tipe === 'text/javascript; charset=utf-8' : ekst === '.css' ? tipe === 'text/css; charset=utf-8' : true;
    if (ra.status === 200 && tipeOk && ra.isi.equals(fs.readFileSync(path.join(AKAR, rujukan[i])))) utuh++; else salahAset.push(rujukan[i] + ' (' + ra.status + ' ' + tipe + ')');
  }
  cek(rujukan.length >= 40 && salahAset.length === 0, utuh + ' skrip dan stylesheet yang dirujuk index.html terlayani 200 dengan MIME benar dan isi sama dengan di disk', salahAset.slice(0, 3).join(', ') || 'rujukan ' + rujukan.length);

  var contoh = path.join(AKAR, 'contoh-keluaran'), salahContoh = [], jenisContoh = [];
  var mimeContoh = {
    json: /^application\/json/, xlsx: /^application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet$/, docx: /^application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document$/,
    pdf: /^application\/pdf$/, txt: /^text\/plain; charset=utf-8$/, png: /^image\/png$/
  };
  if (fs.existsSync(contoh)) {
    for (var ekstContoh of Object.keys(mimeContoh)) {
      var f = cariFile(contoh, new RegExp('\\.' + ekstContoh + '$'))[0];
      if (!f) continue;
      var rel = path.relative(AKAR, f).split(path.sep).map(encodeURIComponent).join('/');
      var rc = await minta(sv.port, { jalur: '/' + rel });
      if (rc.status === 200 && mimeContoh[ekstContoh].test(rc.kepala['content-type'] || '') && hash(rc.isi) === hash(fs.readFileSync(f))) jenisContoh.push(ekstContoh); else salahContoh.push(rel + ' (' + rc.status + ' ' + rc.kepala['content-type'] + ')');
    }
    cek(salahContoh.length === 0 && jenisContoh.length >= 4, 'unduhan dari contoh-keluaran/ utuh dengan MIME benar (' + jenisContoh.join(', ') + ')', salahContoh.join(', '));
  }

  var hd = await minta(sv.port, { jalur: '/', metode: 'HEAD' });
  cek(hd.status === 200 && hd.isi.length === 0 && Number(hd.kepala['content-length']) === indeks.length, 'HEAD / -> 200 tanpa isi, Content-Length sesuai');
  var po = await minta(sv.port, { jalur: '/', metode: 'POST' });
  cek(po.status === 405 && /GET/.test(po.kepala.allow || '') && !po.isi.includes('<html'), 'POST dan metode lain -> 405 dengan Allow: GET, HEAD', po.status + ' ' + po.kepala.allow);
  var tidakAda = await minta(sv.port, { jalur: '/js/tidak-ada.js' });
  cek(tidakAda.status === 404 && tidakAda.kepala['cache-control'] === 'no-store', 'berkas yang tidak ada -> 404 (juga Cache-Control: no-store)');
  var daftar = [];
  for (var folder of ['/js', '/js/', '/css/', '/contoh-keluaran/', '/uji/', '/cli/']) {
    var rd = await minta(sv.port, { jalur: folder });
    if (rd.status !== 404 || /app\.js|style\.css|soal-ojk|generate\.js/.test(rd.isi.toString())) daftar.push(folder + ' ' + rd.status);
  }
  cek(daftar.length === 0, 'folder tidak pernah dilistkan (js/, css/, contoh-keluaran/, uji/, cli/ -> 404 tanpa daftar isi)', daftar.join(', '));
  var fav = await minta(sv.port, { jalur: '/favicon.ico' });
  cek(fav.status === 204 && fav.isi.length === 0, '/favicon.ico (aplikasi tidak punya ikon) -> 204, bukan 404 yang tercatat Chrome sebagai galat konsol', String(fav.status));

  // --- alamat jaringan dan header Host
  var luar = [];
  var antarmuka = os.networkInterfaces();
  Object.keys(antarmuka).forEach(function (n) { antarmuka[n].forEach(function (a) { if (a.family === 'IPv4' && !a.internal) luar.push(a.address); }); });
  var terjangkau = [];
  for (var ip of luar.slice(0, 2)) if (await tersambung(sv.port, ip)) terjangkau.push(ip);
  if (await tersambung(sv.port, '::1')) terjangkau.push('::1');
  // alamat IP komputer sengaja tidak dicetak ke log uji (hanya jumlahnya)
  cek(terjangkau.length === 0, 'tidak bisa dijangkau lewat alamat jaringan komputer ini (' + Math.min(luar.length, 2) + ' alamat IPv4 dicoba) maupun ::1', terjangkau.length + ' alamat berhasil tersambung');
  var hostSalah = [];
  for (var hs of ['evil.example', 'evil.example:' + sv.port, 'localhost.evil.com', '127.0.0.1.evil.com:' + sv.port, '192.168.1.5:' + sv.port, 'localhostx']) {
    var rh = await minta(sv.port, { jalur: '/', kepala: { Host: hs } });
    if (rh.status !== 403 || rh.isi.includes('<html')) hostSalah.push(JSON.stringify(hs) + ' -> ' + rh.status);
  }
  // Host kosong atau hilang tidak bisa dikirim klien http Node (diganti Host bawaan): pakai soket mentah
  for (var teksHost of ['Host: \r\n', '']) {
    var rawHost = await mentah(sv.port, 'GET / HTTP/1.1\r\n' + teksHost + 'Connection: close\r\n\r\n');
    if (!/^HTTP\/1\.1 (?:400|403)/.test(rawHost) || rawHost.indexOf('<html') >= 0) hostSalah.push(JSON.stringify(teksHost) + ' (mentah) -> ' + rawHost.split('\r\n')[0]);
  }
  cek(hostSalah.length === 0, 'header Host asing, kosong, atau hilang ditolak (403 atau 400): perlindungan DNS rebinding', hostSalah.join(', '));
  var hostBaik = [];
  for (var hb of ['localhost:' + sv.port, 'LOCALHOST:' + sv.port, '127.0.0.1:' + sv.port, '[::1]:' + sv.port, 'localhost']) {
    var rb = await minta(sv.port, { jalur: '/', kepala: { Host: hb } });
    if (rb.status !== 200) hostBaik.push(hb + ' -> ' + rb.status);
  }
  cek(hostBaik.length === 0, 'Host localhost, 127.0.0.1, dan [::1] diterima', hostBaik.join(', '));

  var serempak = await Promise.all(Array.from({ length: 30 }, function (_, n) { return minta(sv.port, { jalur: n % 2 ? '/js/app.js' : '/css/style.css' }); }));
  cek(serempak.every(function (x) { return x.status === 200 && x.isi.length > 1000; }), '30 permintaan serentak semuanya 200');
}

async function ujiJaringan(k) {
  var cek = k.cek;
  var contoh = Buka.daftarJaringan({
    loopback: [{ family: 'IPv4', internal: true, address: '127.0.0.1' }],
    'Wi-Fi': [{ family: 'IPv4', internal: false, address: '192.168.1.10' }, { family: 'IPv6', internal: false, address: 'fe80::1' }],
    Ethernet: [{ family: 4, internal: false, address: '10.0.0.5' }],
    lainnya: [{ family: 'IPv4', internal: false, address: '192.168.1.10' }, { family: 'IPv4', internal: false, address: '169.254.1.2' }],
    kosong: null
  });
  cek(contoh.length === 2 && contoh[0].nama === 'Wi-Fi' && contoh[0].alamat === '192.168.1.10' && contoh[1].alamat === '10.0.0.5' && Buka.daftarJaringan({}).length === 0,
    'link jaringan: Wi-Fi/LAN IPv4 unik, tanpa loopback, IPv6, link-local, atau duplikat; mendukung tanpa jaringan');

  var sv = await k.nyalakan({ port: 0 });
  cek(sv.server.address().address === '0.0.0.0', 'bawaan menerima koneksi satu jaringan di 0.0.0.0');
  var salah = [];
  for (var a of sv.jaringan) {
    var halaman = await minta(sv.port, { host: a.alamat });
    var skrip = await minta(sv.port, { host: a.alamat, jalur: '/js/app.js' });
    var palsu = await minta(sv.port, { host: a.alamat, kepala: { Host: a.alamat + '.evil.example:' + sv.port } });
    if (a.url !== 'http://' + a.alamat + ':' + sv.port || halaman.status !== 200 || !halaman.isi.equals(k.indeks) ||
        skrip.status !== 200 || palsu.status !== 403) salah.push(a.nama);
  }
  cek(salah.length === 0, 'link IP jaringan melayani index.html dan JavaScript, menolak Host palsu (' + sv.jaringan.length + ' alamat diuji)', salah.join(', '));
  var asing = await minta(sv.port, { kepala: { Host: 'evil.example' } });
  cek(asing.status === 403, 'mode jaringan tetap menolak Host domain asing');
}

// ====================================================== 3. tabel MIME + 4. penjaga path (situs sementara)

async function ujiSitus(k) {
  var cek = k.cek;
  var KANARI = 'KANARI-' + crypto.randomBytes(8).toString('hex');
  var situs = path.join(k.tmp, 'situs');
  k.situs = situs;
  fs.mkdirSync(path.join(situs, 'js'), { recursive: true });
  fs.mkdirSync(path.join(situs, '.git'));
  var rahasia = path.join(k.tmp, 'rahasia.txt'); // di luar folder yang dilayani
  fs.writeFileSync(rahasia, KANARI);
  fs.writeFileSync(path.join(situs, 'index.html'), '<!DOCTYPE html><title>situs uji</title>');
  fs.writeFileSync(path.join(situs, 'js', 'a.js'), 'var a = 1;');
  fs.writeFileSync(path.join(situs, '.env'), KANARI);
  fs.writeFileSync(path.join(situs, '.git', 'config'), KANARI);
  var tabelMime = [
    ['a.html', /^text\/html; charset=utf-8$/], ['a.js', /^text\/javascript; charset=utf-8$/], ['a.css', /^text\/css; charset=utf-8$/], ['a.json', /^application\/json; charset=utf-8$/],
    ['a.png', /^image\/png$/], ['a.svg', /^image\/svg\+xml$/], ['a.ico', /^image\/(?:vnd\.microsoft\.icon|x-icon)$/], ['a.woff', /^font\/woff$/], ['a.woff2', /^font\/woff2$/],
    ['a.docx', /^application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document$/], ['a.pdf', /^application\/pdf$/],
    ['a.xlsx', /^application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet$/], ['a.zip', /^application\/zip$/], ['a.txt', /^text\/plain; charset=utf-8$/],
    ['B.JS', /^text\/javascript; charset=utf-8$/], ['c.xyz', /^application\/octet-stream$/], ['sans-ekstensi', /^application\/octet-stream$/]
  ];
  tabelMime.forEach(function (t) { fs.writeFileSync(path.join(situs, t[0]), 'isi ' + t[0]); });
  // tautan ke luar folder (junction di Windows tidak butuh izin khusus; tautan berkas bisa butuh)
  var tautan = [];
  try { fs.symlinkSync(k.tmp, path.join(situs, 'keluar'), 'junction'); tautan.push('/keluar/rahasia.txt'); k.tautanDibuat.push(path.join(situs, 'keluar')); } catch (e) { /* tanpa izin */ }
  try { fs.symlinkSync(rahasia, path.join(situs, 'tautan.txt'), 'file'); tautan.push('/tautan.txt'); k.tautanDibuat.push(path.join(situs, 'tautan.txt')); } catch (e) { /* tanpa izin */ }

  var sv = await k.nyalakan({ port: 0, akar: situs });
  var salahMime = [];
  for (var m of tabelMime) {
    var rm = await minta(sv.port, { jalur: '/' + m[0] });
    if (rm.status !== 200 || !m[1].test(rm.kepala['content-type'] || '') || rm.isi.toString() !== 'isi ' + m[0]) salahMime.push(m[0] + ' -> ' + rm.status + ' ' + rm.kepala['content-type']);
  }
  cek(salahMime.length === 0, 'tabel MIME benar untuk ' + tabelMime.length + ' jenis berkas (html, js, css, json, png, svg, ico, woff, woff2, docx, pdf, xlsx, zip, txt, ekstensi huruf besar, tanpa ekstensi)', salahMime.join(', '));
  var r = await minta(sv.port, { jalur: '/' });
  cek(r.status === 200 && /situs uji/.test(r.isi.toString()), 'GET / mengarah ke index.html di folder yang dilayani (bukan folder generator)');
  fs.writeFileSync(path.join(situs, 'favicon.ico'), 'ikon');
  r = await minta(sv.port, { jalur: '/favicon.ico' });
  cek(r.status === 200 && /icon/.test(r.kepala['content-type']) && r.isi.toString() === 'ikon', 'favicon.ico yang ada di folder dilayani biasa (200), bukan 204');

  var mutlak = '/' + rahasia.replace(/\\/g, '/');
  var jahat = [
    '/../rahasia.txt', '/..%2frahasia.txt', '/..%2Frahasia.txt', '/%2e%2e/rahasia.txt', '/%2E%2E/rahasia.txt', '/%2e%2e%2frahasia.txt', '/.%2e/rahasia.txt', '/%2e./rahasia.txt',
    '/..%5crahasia.txt', '/..\\rahasia.txt', '/%2e%2e%5crahasia.txt', '/js/../../rahasia.txt', '/js/%2e%2e/%2e%2e/rahasia.txt', '/....//rahasia.txt', '/./../rahasia.txt', '/..;/rahasia.txt',
    '/%252e%252e/rahasia.txt', '/%c0%ae%c0%ae/rahasia.txt', '/%u002e%u002e/rahasia.txt', '/../../../../../../../../Windows/win.ini', '/../../../../../../../../etc/passwd',
    '/%2e%2e/%2e%2e/%2e%2e/%2e%2e/etc/passwd',
    '/C:/Windows/win.ini', '/C%3A/Windows/win.ini', '/c:\\windows\\win.ini', '/C:rahasia.txt', '/%5c%5cserver%5cshare%5crahasia.txt', '/\\\\server\\share\\rahasia.txt', '//server/share/rahasia.txt',
    mutlak, '/%2f' + mutlak.slice(1),
    '/index.html%00.png', '/index.html%00', '/index.html::$DATA', '/index.html:ads', '/index.html.', '/index.html%20', '/js/a.js.', '/js/a.js%20%20',
    '/.env', '/%2eenv', '/.git/config', '/.git/', '/.git', '/js/.env',
    '/CON', '/nul', '/aux.txt', '/js/com1.js', '/lpt1',
    'http://evil.example/index.html', 'http://127.0.0.1:' + sv.port + '/../rahasia.txt', '*'
  ].concat(tautan);
  var bocor = [], salahStatus = [], ditutup = 0;
  for (var j of jahat) {
    var rj;
    try { rj = await minta(sv.port, { jalur: j }); } catch (err) { ditutup++; continue; /* sambungan ditutup: tidak melayani apa pun */ }
    if (rj.isi.toString('latin1').indexOf(KANARI) >= 0) bocor.push(j);
    if (AMAN.indexOf(rj.status) < 0) salahStatus.push(j + ' -> ' + rj.status);
  }
  cek(bocor.length === 0, 'isi berkas di luar folder dan berkas berawalan titik tidak pernah bocor (' + jahat.length + ' alamat: traversal, path absolut, drive, UNC, NUL, aliran NTFS, perangkat, tautan)', bocor.join(', '));
  cek(salahStatus.length === 0, 'semua alamat berbahaya dijawab 400, 403, atau 404 (tidak pernah 200 atau 500)', salahStatus.join(', '));
  if (tautan.length) {
    var salahTautan = [];
    for (var tt of tautan) { var rt = await minta(sv.port, { jalur: tt }); if (rt.status !== 403 && rt.status !== 404) salahTautan.push(tt + ' -> ' + rt.status); }
    cek(salahTautan.length === 0, 'tautan simbolik atau junction yang menuju keluar folder ditolak (' + tautan.join(', ') + ')', salahTautan.join(', '));
  } else k.cetak('  (info) sistem ini tidak mengizinkan membuat tautan simbolik; uji tautan dilewati');
  var raw = await mentah(sv.port, 'GET /../rahasia.txt HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n');
  cek(/^HTTP\/1\.1 403/.test(raw) && raw.indexOf(KANARI) < 0, 'GET /../rahasia.txt lewat soket mentah (tanpa normalisasi klien) -> 403', raw.split('\r\n')[0]);

  var rusak = [];
  for (var pct of ['/%', '/%zz', '/%E0%A4%A', '/%C0%AE', '/js/%FF.js', '/a%', '/%%20', '/%u00e9', '/%80']) { var rr = await minta(sv.port, { jalur: pct }); if (rr.status !== 400) rusak.push(pct + ' -> ' + rr.status); }
  cek(rusak.length === 0, 'tanda % yang rusak di alamat -> 400 (9 kasus), server tidak mati', rusak.join(', '));
  var absolut = await minta(sv.port, { jalur: 'http://127.0.0.1:' + sv.port + '/index.html' });
  cek(absolut.status === 400, 'alamat bentuk absolut (http://...) ditolak 400', String(absolut.status));
  var panjang;
  try { panjang = (await minta(sv.port, { jalur: '/' + 'a'.repeat(30000) })).status; } catch (err) { panjang = 'sambungan ditutup'; }
  var sedang = (await minta(sv.port, { jalur: '/' + 'b'.repeat(4000) })).status;
  cek(AMAN.concat([414, 431, 'sambungan ditutup']).indexOf(panjang) >= 0 && sedang === 404, 'alamat sangat panjang tidak mematikan server (30000 karakter -> ' + panjang + ', 4000 karakter -> ' + sedang + ')');
  var sampah = await mentah(sv.port, 'BUKAN HTTP SAMA SEKALI\r\n\r\n');
  await mentah(sv.port, 'GET /index.html HTTP/9.9\r\nHost: localhost\r\n\r\n');
  await mentah(sv.port, '\u0000\u0001\u0002\u0003\u00ff\u00fe\r\n\r\n');
  var hidup = await minta(sv.port, { jalur: '/js/a.js' });
  cek(/^HTTP\/1\.1 400/.test(sampah) && hidup.status === 200 && hidup.isi.toString() === 'var a = 1;', 'permintaan yang bukan HTTP dijawab 400 dan server tetap hidup; berkas sah tetap terlayani setelah semua percobaan', sampah.split('\r\n')[0]);
}

// ========================================================================== 5. port terpakai

async function ujiPort(k) {
  var cek = k.cek;
  var pakai = await tempati('127.0.0.1', 0);
  k.penutup.push(pakai);
  var sv = await k.nyalakan({ port: pakai.port, akar: k.situs });
  cek(sv.port > pakai.port && sv.port <= pakai.port + Buka.CADANGAN && sv.dilewati[0] === pakai.port && (await minta(sv.port, { jalur: '/' })).status === 200,
    'port terpakai (' + pakai.port + ') -> memakai port berikutnya (' + sv.port + '), paling jauh +' + Buka.CADANGAN, 'dilewati ' + sv.dilewati.join(','));

  var lebar = await tempati('0.0.0.0', 0);
  k.penutup.push(lebar);
  var svLebar = await k.nyalakan({ port: lebar.port, akar: k.situs });
  cek(svLebar.port !== lebar.port && svLebar.dilewati.indexOf(lebar.port) >= 0, 'port yang dipegang program lain di 0.0.0.0 juga dilewati (' + lebar.port + ' -> ' + svLebar.port + ')');

  var v6 = null;
  try { v6 = await tempati('::1', 0); k.penutup.push(v6); } catch (err) { v6 = null; }
  if (v6) {
    var svV6 = await k.nyalakan({ port: v6.port, akar: k.situs });
    cek(svV6.port !== v6.port && svV6.dilewati.indexOf(v6.port) >= 0, 'port yang dipegang program lain di ::1 juga dilewati, supaya "localhost" tidak mendarat di program itu (' + v6.port + ' -> ' + svV6.port + ')');
  } else k.cetak('  (info) IPv6 loopback tidak tersedia di sistem ini; uji port ::1 dilewati');

  // semua port dalam jangkauan terpakai -> galat yang jelas
  var blok = null;
  for (var coba = 0; coba < 25 && !blok; coba++) {
    var a0 = await tempati('127.0.0.1', 0), diambil = [a0];
    try { diambil.push(await tempati('127.0.0.1', a0.port + 1)); diambil.push(await tempati('127.0.0.1', a0.port + 2)); blok = { awal: a0.port, diambil: diambil }; } catch (err) { for (var x of diambil) await x.tutup(); }
  }
  if (blok) {
    blok.diambil.forEach(function (x) { k.penutup.push(x); });
    var galat = null;
    try { var kosong = await Buka.mulai({ port: blok.awal, cadangan: 2, akar: k.situs }); await kosong.tutup(); } catch (err) { galat = err; }
    cek(!!galat && galat.galatPengguna === true && new RegExp('port ' + blok.awal + ' sampai ' + (blok.awal + 2) + ' sedang dipakai').test(galat.message), 'semua port dalam jangkauan terpakai -> galat yang jelas', galat ? galat.message : 'tidak ada galat');
  } else k.cetak('  (info) tidak menemukan tiga port berurutan yang kosong; uji "semua port terpakai" dilewati');
}

// ========================================================================== 6. berhenti rapi

async function ujiTutup(k) {
  var cek = k.cek;
  var sv = await k.nyalakan({ port: 0, akar: k.situs });
  var agen = new http.Agent({ keepAlive: true, maxSockets: 1 });
  var rk = await minta(sv.port, { jalur: '/', agen: agen }); // sambungan keep-alive menganggur
  var macet = net.connect({ host: '127.0.0.1', port: sv.port });
  macet.on('error', function () { /* ditutup server */ });
  await new Promise(function (ok) { macet.on('connect', ok); });
  macet.write('GET / HTTP/1.1\r\nHost: localhost\r\n'); // kepala belum lengkap: permintaan macet
  await tunggu(100);
  var t0 = Date.now();
  await sv.tutup();
  var lama = Date.now() - t0;
  agen.destroy();
  macet.destroy();
  cek(rk.status === 200 && lama < 3000 && !(await tersambung(sv.port)), 'tutup(): sambungan keep-alive dan permintaan yang macet diakhiri (' + lama + ' ms), lalu port bebas');
  var dua = await Promise.race([sv.tutup().then(function () { return 'ok'; }), tunggu(2000).then(function () { return 'macet'; })]);
  cek(dua === 'ok', 'tutup() dipanggil dua kali tidak macet dan tidak melempar galat');
}

// ============================================================ 7. perintah node cli/buka.js

async function ujiPerintah(k) {
  var cek = k.cek;
  var bantuan = cp.spawnSync(process.execPath, [SKRIP_BUKA, '--help'], { encoding: 'utf8', cwd: os.tmpdir(), timeout: 20000 });
  cek(bantuan.status === 0 && !bantuan.error && /--port/.test(bantuan.stdout) && /--lokal/.test(bantuan.stdout) && /3300/.test(bantuan.stdout) && /GAGAL/.test(bantuan.stdout),
    '--help langsung keluar (kode 0); menjelaskan --port, --lokal, port baku 3300, dan GAGAL', String(bantuan.status) + ' ' + (bantuan.error ? bantuan.error.code : ''));
  var salahOpsi = [];
  [[['--port', 'abc'], /--port harus/], [['--port', '70000'], /--port harus/], [['--port', '-1'], /--port harus/], [['--port'], /memerlukan nilai/], [['--foo'], /opsi tidak dikenal/], [['sembarang'], /argumen tidak dikenal/], [['--lokal=false'], /tidak menerima nilai/]].forEach(function (g) {
    var x = cp.spawnSync(process.execPath, [SKRIP_BUKA].concat(g[0]), { encoding: 'utf8', cwd: os.tmpdir(), timeout: 20000 });
    var akhir = (x.stdout || '').split(/\r?\n/).filter(Boolean).pop() || '';
    if (x.status !== 1 || !/^GAGAL: /.test(akhir) || !g[1].test(akhir)) salahOpsi.push(g[0].join(' ') + ' -> ' + x.status + ' ' + akhir.slice(0, 60));
  });
  cek(salahOpsi.length === 0, 'opsi yang salah -> "GAGAL: ..." dengan kode keluar 1 (7 kasus)', salahOpsi.join(' | '));

  // argumen persis seperti perintah pekerjaan aplikasi di agent-office.json, hanya port bakunya diganti 0 (acak)
  // supaya uji tidak menyalakan apa pun di port 3300
  var argumenJob = k.pekerjaanApp ? k.pekerjaanApp.perintah.slice(1).map(function (t) { return String(t).replace(/^--port=\d+$/, '--port=0'); }) : [];
  if (!argumenJob.some(function (t) { return /^--port(?:=|$)/.test(t); })) argumenJob.push('--port=0');
  var proses = lancar(argumenJob);
  k.anak.push(proses);
  var barisSiap = await proses.tunggu(BARIS_SIAP);
  await proses.tunggu(/Ctrl\+C/);
  var port = portDari(barisSiap);
  cek(barisSiap === Buka.JUDUL + ' berjalan di http://localhost:' + port, 'baris siap persis "' + Buka.JUDUL + ' berjalan di http://localhost:<port>"', barisSiap);
  var beralamat = proses.baris.filter(function (l) { return /https?:\/\//.test(l); });
  var jaringan = Buka.daftarJaringan();
  cek(beralamat.length === 1 + jaringan.length && beralamat[0] === barisSiap && proses.galat() === '' &&
    jaringan.every(function (a) { return beralamat.indexOf('Jaringan kantor (' + a.nama + '): http://' + a.alamat + ':' + port) >= 0; }),
    'CLI mencetak localhost lalu link tiap adaptor jaringan dengan port sebenarnya', beralamat.length + ' baris; stderr: ' + proses.galat().slice(0, 80));
  if (k.pekerjaanApp) {
    var re = new RegExp(k.pekerjaanApp.alamat), cocok = proses.baris.map(function (l) { return re.exec(l); }).filter(Boolean);
    cek(cocok.length === 1 && cocok[0][1] === 'http://localhost:' + port, 'regex "alamat" pekerjaan aplikasi di agent-office.json menangkap alamat yang dicetak (' + cocok.map(function (c) { return c[1]; }).join(',') + ')', k.pekerjaanApp.alamat);
  } else cek(false, 'agent-office.json memuat pekerjaan "aplikasi"');
  var jawab = await minta(port, { jalur: '/' });
  cek(jawab.status === 200 && jawab.isi.equals(k.indeks), 'proses cli/buka.js melayani index.html dari folder generator walau dijalankan dari folder lain');
  var akhir = await proses.berhenti('SIGTERM');
  await tunggu(150);
  var windows = process.platform === 'win32';
  var rapi = windows || (akhir.kode === 0 && proses.baris.some(function (l) { return /dihentikan/.test(l); }));
  cek(!(await tersambung(port)) && !!proses.sudahKeluar() && rapi, 'SIGTERM menghentikan proses dan melepas port' + (windows ? ' (Windows mematikan proses tanpa menjalankan penangan sinyal; jalur rapinya diuji lewat tutup() di atas)' : ' dengan kode keluar 0 dan baris "dihentikan"'), 'kode ' + akhir.kode + ' sinyal ' + akhir.sinyal);

  var pegang = await tempati('127.0.0.1', 0);
  k.penutup.push(pegang);
  var pindah = lancar(['--port=' + pegang.port]);
  k.anak.push(pindah);
  var barisPindah = await pindah.tunggu(BARIS_SIAP);
  await pindah.tunggu(/Ctrl\+C/);
  var portPindah = portDari(barisPindah);
  var pesan = pindah.baris.filter(function (l) { return /sedang dipakai/.test(l); })[0] || '';
  var urlPindah = pindah.baris.filter(function (l) { return /https?:\/\//.test(l); });
  cek(portPindah > pegang.port && portPindah <= pegang.port + Buka.CADANGAN && urlPindah.length === 1 + jaringan.length &&
    urlPindah.every(function (l) { return l.endsWith(':' + portPindah); }) && pindah.baris.indexOf(pesan) >= 0 && pindah.baris.indexOf(pesan) < pindah.baris.indexOf(barisPindah) &&
    new RegExp('^Port ' + pegang.port + '(?:-\\d+)? sedang dipakai; memakai port ' + portPindah + '\\.$').test(pesan),
  'port terpakai -> pesan pindah port, localhost dan semua link jaringan memakai port berikutnya', pesan + ' | ' + barisPindah);
  await pindah.berhenti('SIGTERM');
  await tunggu(150);
  cek(!(await tersambung(portPindah)), 'port dilepas setelah proses kedua dihentikan');

  var lokal = lancar(['--port', '0', '--lokal']);
  k.anak.push(lokal);
  var barisLokal = await lokal.tunggu(BARIS_SIAP);
  await lokal.tunggu(/Ctrl\+C/);
  var portLokal = portDari(barisLokal), lolosLokal = (await minta(portLokal)).status === 200;
  for (var ip of jaringan) {
    if (await tersambung(portLokal, ip.alamat)) lolosLokal = false;
    if ((await minta(portLokal, { kepala: { Host: ip.alamat + ':' + portLokal } })).status !== 403) lolosLokal = false;
  }
  cek(lolosLokal && lokal.baris.filter(function (l) { return /http:\/\//.test(l); }).length === 1 && lokal.baris.some(function (l) { return /Mode lokal/.test(l); }),
    '--lokal: hanya mencetak link localhost, melayani loopback dan menolak koneksi/Host jaringan');
  await lokal.berhenti('SIGTERM');

  var dua = await Promise.all([lancar(['--port', '0']), lancar(['--port', '0'])].map(function (x) {
    k.anak.push(x);
    return x.tunggu(BARIS_SIAP).then(function (l) { return { x: x, port: portDari(l) }; });
  }));
  cek(dua[0].port !== dua[1].port, 'dua proses dengan --port 0 mendapat port yang berbeda', dua[0].port + ' dan ' + dua[1].port);
  await Promise.all(dua.map(function (d) { return d.x.berhenti('SIGTERM'); }));
}

// ===================================================================== peramban lewat http://

/** Halaman lewat loopback/IP jaringan dan unduhan Blob sungguhan (berkas masuk folder). */
async function ujiUnduhan(sv, cek, jaringan) {
  var Peramban = require('./peramban.js');
  var folder = fs.mkdtempSync(path.join(os.tmpdir(), 'ojk-unduh-'));
  var alamat = jaringan ? sv.jaringan[0].url : 'http://127.0.0.1:' + sv.port;
  var p = await Peramban.buka(alamat + '/', { lebar: 1300, tinggi: 900 });
  try {
    var info = await p.evaluasi('({ alamat: location.href, aman: isSecureContext, skrip: document.scripts.length, app: typeof AppOjk })');
    cek(info.app === 'object' && info.aman === !jaringan && p.konsol.length === 0, (jaringan ? 'HTTP jaringan' : 'HTTP localhost') + ': halaman dan AppOjk termuat tanpa galat konsol', JSON.stringify(info) + ' ' + p.konsol.join(' | '));
    await p.kirim('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: folder });
    await p.evaluasi('(async function () { document.getElementById("jumlah").value = 2; document.getElementById("benih").value = 2026; await AppOjk.generate(); return 1; })()');
    var unduh = async function (idTombol) {
      var sebelum = fs.readdirSync(folder);
      await p.evaluasi('document.getElementById("' + idTombol + '").click()');
      var nama = null;
      for (var i = 0; i < 150 && !nama; i++) {
        await p.tunggu(200);
        nama = fs.readdirSync(folder).filter(function (x) { return sebelum.indexOf(x) < 0 && !/\.crdownload$|\.tmp$/.test(x); })[0] || null;
      }
      if (!nama) return null;
      await p.tunggu(100);
      return { nama: nama, data: fs.readFileSync(path.join(folder, nama)) };
    };
    var x = await unduh('btn-xlsx'), lembar = null;
    try { lembar = x && Berkas.periksaXlsx(x.data); } catch (e) { /* dinilai di bawah */ }
    cek(!!x && x.nama === 'soal-ojk-tahap1.xlsx' && !!lembar && lembar.Soal.length === 45, 'unduhan Blob sungguhan (klik "Excel", berkas masuk folder unduhan) utuh: soal-ojk-tahap1.xlsx, 44 soal + judul', x ? x.nama + ' ' + x.data.length + ' bita' : 'tidak ada berkas');
    var js = await unduh('btn-json'), doc = null;
    try { doc = js && JSON.parse(js.data.toString('utf8')); } catch (e) { /* dinilai di bawah */ }
    cek(!!js && js.nama === 'soal-ojk-tahap1.json' && !!doc && doc.validator.lulus === true && doc.paket.length === 2, 'unduhan Blob sungguhan (JSON) utuh: memuat hasil validator dan 2 paket', js ? js.nama : 'tidak ada berkas');
    cek(p.konsol.length === 0, (jaringan ? 'HTTP jaringan' : 'HTTP localhost') + ': tidak ada galat konsol setelah generate dan unduhan', p.konsol.join(' | '));
  } finally {
    await p.tutup();
    try { fs.rmSync(folder, { recursive: true, force: true }); } catch (e) { /* abaikan */ }
  }
}

// ===================================================================================== utama

async function jalankan(ctx) {
  var cek = ctx.cek, cetak = ctx.cetak || function () {};
  var cfg = null;
  try { cfg = JSON.parse(fs.readFileSync(path.join(AKAR, 'agent-office.json'), 'utf8')); } catch (e) { /* dinilai di ujiPerintah */ }
  var k = {
    cek: cek, cetak: cetak, tmp: fs.mkdtempSync(path.join(os.tmpdir(), 'ojk-server-')), penutup: [], anak: [], tautanDibuat: [], indeks: null, situs: null,
    pekerjaanApp: cfg && cfg.pekerjaan.filter(function (j) { return j.id === 'aplikasi'; })[0],
    nyalakan: function (opsi) { return Buka.mulai(opsi).then(function (sv) { k.penutup.push(sv); return sv; }); }
  };
  try {
    await ujiFolderAsli(k);
    await ujiJaringan(k);
    await ujiSitus(k);
    await ujiPort(k);
    await ujiTutup(k);
    await ujiPerintah(k);
  } finally {
    for (var a = 0; a < k.anak.length; a++) await k.anak[a].tutup();
    for (var n = 0; n < k.penutup.length; n++) { try { await k.penutup[n].tutup(); } catch (e) { /* abaikan */ } }
    // tautan dilepas dulu supaya penghapusan folder sementara tidak pernah mengikutinya
    k.tautanDibuat.forEach(function (t) { try { fs.unlinkSync(t); } catch (e) { try { fs.rmdirSync(t); } catch (e2) { /* abaikan */ } } });
    try { fs.rmSync(k.tmp, { recursive: true, force: true }); } catch (e) { /* abaikan */ }
  }

  if (ctx.tanpaPeramban) return { dilewati: true };
  var Peramban = require('./peramban.js'), Browser = require('./browser.js');
  if (!Peramban.cariPeramban()) { cetak('  (dilewati) Chrome/Edge tidak ditemukan; set CHROME_PATH untuk mengujinya'); return { dilewati: true }; }
  if (typeof WebSocket === 'undefined') { cetak('  (dilewati) Node.js ' + process.versions.node + ' tidak punya WebSocket bawaan (perlu 22+)'); return { dilewati: true }; }
  var sv = await Buka.mulai({ port: 0 });
  try {
    cetak('  -- seluruh uji antarmuka (uji/browser.js) lewat ' + sv.url + '/ --');
    await Browser.jalankan({ cek: cek, cetak: cetak, cepat: !!ctx.cepat, layar: ctx.layar, alamat: sv.url + '/', awalan: '[http] ' });
    await ujiUnduhan(sv, cek);
    if (sv.jaringan.length) await ujiUnduhan(sv, cek, true);
    else cetak('  (dilewati) Uji peramban lewat IP jaringan: tidak ada adaptor IPv4 aktif.');
  } finally {
    await sv.tutup();
  }
  return {};
}

module.exports = { jalankan: jalankan };

if (require.main === module) {
  var argv = process.argv.slice(2), gagal = [], lulus = 0, mulaiWaktu = Date.now();
  jalankan({
    cepat: argv.indexOf('--cepat') >= 0, tanpaPeramban: argv.indexOf('--tanpa-peramban') >= 0, cetak: console.log,
    cek: function (ok, nama, info) { if (ok) lulus++; else gagal.push(nama + (info ? ' (' + info + ')' : '')); console.log((ok ? '  ok    ' : '  GAGAL ') + nama + (info && !ok ? ' - ' + info : '')); }
  }).then(function () {
    var waktu = ((Date.now() - mulaiWaktu) / 1000).toFixed(1).replace('.', ',') + ' dtk';
    if (gagal.length) { console.log('GAGAL: ' + gagal.length + ' pemeriksaan server gagal (' + waktu + '): ' + gagal.slice(0, 3).join(' | ')); process.exitCode = 1; }
    else console.log('HASIL: ' + lulus + ' pemeriksaan server lulus (' + waktu + ')');
  }).catch(function (e) { console.log('GAGAL: ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join(' / ') : e)); process.exitCode = 1; });
}
