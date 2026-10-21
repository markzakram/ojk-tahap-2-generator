/*
 * browser.js — uji antarmuka `index.html` di Chrome/Edge tanpa kepala.
 *
 * Membuka index.html lewat file:// (seperti dipakai pengguna), lalu memeriksa: semua skrip
 * termuat tanpa galat, generate dan validator berjalan, pratinjau dan kunci tampil, pilihan
 * A-E memberi umpan, keempat jenis widget interaktif Penalaran Numerik dapat DISERET/DIKLIK
 * sampai sesuai kunci (lewat peristiwa mouse sungguhan), dan semua tombol unduh menghasilkan
 * berkas yang utuh (diperiksa oleh `berkas.js`).
 *
 * Perlu Chrome atau Edge terpasang dan Node.js 22+ (WebSocket bawaan). Bila tidak ada,
 * uji dilewati dengan keterangan, bukan gagal. Dapat dijalankan sendiri:
 *
 *   node uji/browser.js [--cepat] [--layar <folder>]
 *
 * Sebagai modul, jalankan({ cek, cetak, cepat, layar, alamat, awalan }): bila `alamat` diberikan
 * (mis. http://localhost:3300/ dari cli/buka.js) halaman dibuka dari alamat itu, bukan file://;
 * `awalan` ditambahkan di depan nama tiap pemeriksaan. Dipakai uji/server.js.
 */
'use strict';

var fs = require('fs');
var path = require('path');
var url = require('url');
var Peramban = require('./peramban.js');
var Berkas = require('./berkas.js');

var AKAR = path.resolve(__dirname, '..');
var GLOBAL_WAJIB = ['Rng', 'Metrik', 'Fmt', 'Hitung', 'Svg', 'SvgRaster', 'Kempis', 'Png', 'Raster', 'Chart', 'Kamus', 'Pilihan', 'Butir', 'Cerita', 'TabelKu',
  'GrafikKu', 'Verbal', 'TopikVerbalTambahan', 'Variasi', 'Inferensi', 'Figural', 'SerialPutar', 'Bentuk', 'SerialGanda', 'MatriksLatin', 'MatriksIsi', 'MatriksSekat', 'PnBar', 'PnTabel', 'PnGaris', 'PnPie', 'Gambar', 'Bank', 'Validator', 'Paket', 'Dokumen',
  'Zip', 'Docx', 'Pdf', 'Xlsx', 'Ekspor', 'Coba', 'AppOjk'];

/** Fungsi yang dijalankan DI DALAM halaman: cari butir menurut id. */
function cariButir(id) {
  var r = null;
  AppOjk.state.hasil.paket.forEach(function (p) { p.subtes.forEach(function (s) { s.butir.forEach(function (b) { if (b.id === id) r = b; }); }); });
  return r;
}

async function jalankan(ctx) {
  var awalan = ctx.awalan || '';
  var cek = awalan ? function (ok, nama, info) { ctx.cek(ok, awalan + nama, info); } : ctx.cek, cetak = ctx.cetak || function () {};
  var cepat = !!ctx.cepat;
  var exe = Peramban.cariPeramban();
  if (!exe) { cetak('  (dilewati) Chrome/Edge tidak ditemukan; set CHROME_PATH untuk mengujinya'); return { dilewati: true }; }
  if (typeof WebSocket === 'undefined') { cetak('  (dilewati) Node.js ' + process.versions.node + ' tidak punya WebSocket bawaan (perlu 22+)'); return { dilewati: true }; }

  var alamat = ctx.alamat || url.pathToFileURL(path.join(AKAR, 'index.html')).href;
  var p = await Peramban.buka(alamat, { lebar: 1500, tinggi: 1800 });
  await p.ukuran(1500, 1800);
  var ringkas = {};
  function dalam(fn, arg) {
    return p.evaluasi('(function () { var cariButir = ' + cariButir.toString() + '; return (' + fn.toString() + ')(' + JSON.stringify(arg === undefined ? null : arg) + '); })()');
  }
  async function foto(selector, nama) {
    if (!ctx.layar) return;
    fs.mkdirSync(ctx.layar, { recursive: true });
    var r = await dalam(function (sel) { var e = document.querySelector(sel); e.scrollIntoView({ block: 'start' }); var b = e.getBoundingClientRect(); return { x: b.x, y: b.y, width: b.width, height: b.height }; }, selector);
    var res = await p.kirim('Page.captureScreenshot', { format: 'png', clip: { x: r.x, y: r.y, width: r.width, height: Math.min(r.height, 1700), scale: 1 } });
    fs.writeFileSync(path.join(ctx.layar, nama + '.png'), Buffer.from(res.data, 'base64'));
  }

  try {
    // ------------------------------------------------------------ muat
    var hilang = await p.evaluasi('(' + JSON.stringify(GLOBAL_WAJIB) + ').filter(function (n) { return typeof window[n] === "undefined"; })');
    cek(hilang.length === 0, 'peramban: semua modul termuat via ' + (ctx.alamat ? 'http://' : 'file://'), hilang.length ? 'hilang: ' + hilang.join(', ') : '');
    cek(p.konsol.length === 0, 'peramban: tidak ada galat konsol saat dimuat', p.konsol.join(' | '));

    var garisBaru = await dalam(function () {
      var gagal = [], wadah = document.createElement('div'); document.body.appendChild(wadah);
      try {
        ['garis-bergantian', 'garis-majemuk'].forEach(function (id) {
          ['mudah', 'sedang', 'sulit'].forEach(function (level) {
            var b = Variasi.buat(id, level, 2026), k = Coba.pasang(wadah, b);
            var inputs = wadah.querySelectorAll('input[type="number"]');
            inputs.forEach(function (input, i) { input.value = b.isian.kunci.nilai[i]; input.dispatchEvent(new Event('change', { bubbles: true })); });
            if (!k.periksa().benar) gagal.push(id + '/' + level + ': jawaban benar ditolak');
            inputs[0].value = b.isian.kunci.nilai[0] + b.model.snap; inputs[0].dispatchEvent(new Event('change', { bubbles: true }));
            if (k.periksa().benar) gagal.push(id + '/' + level + ': jawaban salah diterima');
            k.ulang(); if (k.ambil().nilai.some(function (v) { return v !== null; })) gagal.push(id + '/' + level + ': reset gagal');
          });
        });
      } finally { wadah.remove(); }
      return gagal;
    });
    cek(garisBaru.length === 0, 'peramban: dua keluarga grafik garis baru, tiga tingkat, isian angka, jawaban salah, dan reset', garisBaru.join('; '));

    // masukan tidak sah ditolak
    await p.evaluasi('(async function () { document.getElementById("jumlah").value = 0; await AppOjk.generate(); return 1; })()');
    var st = await p.evaluasi('({ status: document.getElementById("status").textContent, hasil: !!AppOjk.state.hasil })');
    cek(!st.hasil && /1 sampai 500/.test(st.status), 'peramban: jumlah paket 0 ditolak dengan pesan jelas', st.status);
    await p.evaluasi('(async function () { document.getElementById("jumlah").value = 1; document.getElementById("benih").value = "-5"; await AppOjk.generate(); return 1; })()');
    st = await p.evaluasi('({ status: document.getElementById("status").textContent, hasil: !!AppOjk.state.hasil })');
    cek(!st.hasil && /benih/.test(st.status), 'peramban: benih negatif ditolak', st.status);

    // ------------------------------------------------------------ generate
    var t0 = Date.now();
    await p.evaluasi('(async function () { document.getElementById("jumlah").value = 2; document.getElementById("benih").value = 2026; await AppOjk.generate(); return 1; })()');
    st = await p.evaluasi('({ status: document.getElementById("status").textContent, lulus: AppOjk.state.validasi && AppOjk.state.validasi.lulus, butir: AppOjk.state.validasi && AppOjk.state.validasi.butir, kartu: document.querySelectorAll(".soal").length })');
    cek(st.lulus === true && st.butir === 44, 'peramban: generate 2 paket lulus validator (44 butir)', st.status);
    cek(st.kartu === 12, 'peramban: pratinjau menampilkan 12 soal Kemampuan Umum', 'kartu=' + st.kartu);
    ringkas.generate2Ms = Date.now() - t0;

    // jawaban pilihan ganda
    var uji = await dalam(function () {
      var kartu = document.querySelectorAll('.soal')[2], ops = kartu.querySelectorAll('.opsi');
      var b = cariButir(kartu.id.replace('soal-', '')), salah = (b.kunci + 1) % b.opsi.length;
      ops[salah].click();
      return { salah: ops[salah].classList.contains('salah'), benar: ops[b.kunci].classList.contains('benar'), teks: kartu.querySelector('.umpan').textContent, terbuka: getComputedStyle(kartu.querySelector('.kunci-blok')).display };
    });
    cek(uji.salah && uji.benar && /Kurang tepat/.test(uji.teks) && uji.terbuka === 'block', 'peramban: klik opsi salah menandai opsi dan membuka pembahasan', JSON.stringify(uji));
    var kunciTampil = await dalam(function () {
      var cb = document.getElementById('tampil-kunci'), k = document.querySelectorAll('.soal')[0];
      var sebelum = getComputedStyle(k.querySelector('.kunci-blok')).display;
      cb.checked = true; cb.dispatchEvent(new Event('change'));
      return { sebelum: sebelum, sesudah: getComputedStyle(k.querySelector('.kunci-blok')).display, chip: getComputedStyle(k.querySelector('.kunci-chip')).display };
    });
    cek(kunciTampil.sebelum === 'none' && kunciTampil.sesudah === 'block' && kunciTampil.chip !== 'none', 'peramban: kunci dan pembahasan tersembunyi lalu tampil lewat kotak centang', JSON.stringify(kunciTampil));
    await foto('#soal-P001-KU-05', 'ku-tabel');
    await foto('#soal-P001-KU-09', 'ku-figural');

    // ganti paket dan tab
    var tab = await p.evaluasi('(function () { document.getElementById("btn-sesudah").click(); var a = document.getElementById("pilih-paket").value; var b = Array.from(document.querySelectorAll("#tab-subtes button")).filter(function (x) { return /Penalaran/.test(x.textContent); })[0]; b.click(); return { paket: a, kartu: document.querySelectorAll(".soal").length, id: document.querySelector(".soal").id }; })()');
    cek(tab.paket === '2' && tab.kartu === 10 && /P002-PN-01/.test(tab.id), 'peramban: pindah ke paket 2 dan tab Penalaran Numerik (10 soal)', JSON.stringify(tab));

    // ------------------------------------------------------------ widget interaktif
    var jenisId = await dalam(function () {
      var out = {};
      AppOjk.state.hasil.paket[1].subtes.filter(function (s) { return s.kode === 'pn'; })[0].butir.forEach(function (b) { if (!out[b.isian.jenis]) out[b.isian.jenis] = b.id; });
      return out;
    });
    cek(Object.keys(jenisId).length === 4, 'peramban: keempat jenis soal interaktif ada di paket 2', JSON.stringify(jenisId));

    async function buka(id) {
      await dalam(function (id) { document.getElementById('soal-' + id).querySelector('.coba-buka').click(); return 1; }, id);
      await p.tunggu(120);
    }
    async function periksa(id) { return dalam(function (id) { return document.querySelector('#soal-' + id + ' .wadah-coba').kendaliCoba.periksa(); }, id); }
    async function ambil(id) { return dalam(function (id) { return document.querySelector('#soal-' + id + ' .wadah-coba').kendaliCoba.ambil(); }, id); }
    async function aksi(id, nama) { return dalam(function (a) { document.querySelector('#soal-' + a.id + ' .wadah-coba').kendaliCoba[a.nama](); return 1; }, { id: id, nama: nama }); }

    // --- bar tumpuk
    var id = jenisId['bar-tumpuk'];
    await buka(id);
    await foto('#soal-' + id, 'coba-bar-awal');
    var h = await periksa(id);
    cek(!h.benar, 'coba bar: tampilan awal belum benar');
    var n = await dalam(function (id) { return cariButir(id).isian.kategori.length; }, id), t;
    for (var k = 0; k < n; k++) {
      for (var jenis of ['total', 'bagi']) {
        t = await dalam(function (a) {
          var is = cariButir(a.id).isian, w = document.querySelector('#soal-' + a.id + ' .wadah-coba');
          var geo = Gambar.svg({ jenis: 'bar-tumpuk', model: is.model, state: is.kunci }).geometri; w.scrollIntoView({ block: 'center' }); var m = w.querySelector('.coba-lapis').getScreenCTM();
          var yTop = geo.yDasar - is.kunci.total[a.k] * geo.px;
          var yT = a.jenis === 'total' ? yTop : yTop + (geo.yDasar - yTop) * (1 - is.kunci.persen[a.k] / 100);
          var r = w.querySelectorAll('.pegangan')[2 * a.k + (a.jenis === 'total' ? 0 : 1)].getBoundingClientRect();
          return { x1: r.x + r.width / 2, y1: r.y + r.height / 2, y2: m.d * yT + m.f };
        }, { id: id, k: k, jenis: jenis });
        await p.seret(t.x1, t.y1, t.x1, t.y2, 6);
        await p.tunggu(25);
      }
    }
    h = await periksa(id);
    cek(h.benar, 'coba bar: lingkaran total dan pembagi diseret sampai sesuai kunci', JSON.stringify(h.rinci.filter(function (x) { return !x.benar; })));
    await foto('#soal-' + id, 'coba-bar-benar');
    await dalam(function (id) { var inp = document.querySelector('#soal-' + id + ' .wadah-coba').querySelectorAll('.coba-angka input')[1]; inp.value = '5'; inp.dispatchEvent(new Event('change')); return 1; }, id);
    cek(!(await periksa(id)).benar, 'coba bar: mengubah kolom persen membuat jawaban salah lagi');
    await aksi(id, 'kunci');
    cek((await periksa(id)).benar, 'coba bar: Lihat kunci menampilkan jawaban benar');
    await aksi(id, 'ulang');
    cek(!(await periksa(id)).benar, 'coba bar: Ulang dari awal mengembalikan tampilan awal');

    // --- garis
    id = jenisId['garis'];
    await buka(id);
    for (k = 0; k < 5; k++) {
      t = await dalam(function (a) {
        var is = cariButir(a.id).isian, w = document.querySelector('#soal-' + a.id + ' .wadah-coba');
        var geo = Gambar.svg({ jenis: 'garis', model: is.model, state: is.kunci }).geometri; w.scrollIntoView({ block: 'center' }); var m = w.querySelector('.coba-lapis').getScreenCTM();
        var r = w.querySelectorAll('.pegangan')[a.k].getBoundingClientRect();
        return { x1: r.x + r.width / 2, y1: r.y + r.height / 2, y2: m.d * (geo.yDasar - (is.kunci.nilai[a.k] - geo.lo) * geo.px) + m.f };
      }, { id: id, k: k });
      await p.seret(t.x1, t.y1, t.x1, t.y2, 8);
      await p.tunggu(25);
    }
    h = await periksa(id);
    cek(h.benar, 'coba garis: kelima titik diseret ke nilai kunci (menempel ke kelipatan)', JSON.stringify(await ambil(id)));
    await foto('#soal-' + id, 'coba-garis-benar');
    t = await dalam(function (a) {
      var w = document.querySelector('#soal-' + a.id + ' .wadah-coba'); w.scrollIntoView({ block: 'center' }); var m = w.querySelector('.coba-lapis').getScreenCTM();
      var is = cariButir(a.id).isian, geo = Gambar.svg({ jenis: 'garis', model: is.model, state: is.kunci }).geometri, r = w.querySelectorAll('.pegangan')[2].getBoundingClientRect();
      return { x1: r.x + r.width / 2, y1: r.y + r.height / 2, y2: m.d * (geo.yDasar + 56) + m.f };
    }, { id: id });
    await p.seret(t.x1, t.y1, t.x1, t.y2, 6);
    cek((await ambil(id)).nilai[2] === null, 'coba garis: titik ditarik ke bawah sumbu menjadi belum diletakkan');

    // --- pie
    id = jenisId['pie'];
    await buka(id);
    for (var pass = 0; pass < 4; pass++) {
      for (var j = 1; j <= 3; j++) {
        t = await dalam(function (a) {
          var is = cariButir(a.id).isian, w = document.querySelector('#soal-' + a.id + ' .wadah-coba');
          var geo = Gambar.svg({ jenis: 'pie', model: is.model, state: is.kunci }).geometri; w.scrollIntoView({ block: 'center' }); var m = w.querySelector('.coba-lapis').getScreenCTM();
          var kum = 0; for (var i = 0; i < a.j; i++) kum += is.kunci.persen[i];
          var ang = kum * 3.6 * Math.PI / 180, px = geo.cx + geo.r * Math.sin(ang), py = geo.cy - geo.r * Math.cos(ang);
          var r = w.querySelectorAll('.pegangan')[a.j - 1].getBoundingClientRect();
          return { x1: r.x + r.width / 2, y1: r.y + r.height / 2, x2: m.a * px + m.e, y2: m.d * py + m.f };
        }, { id: id, j: j });
        await p.seret(t.x1, t.y1, t.x2, t.y2, 8);
        await p.tunggu(20);
      }
      h = await periksa(id);
      if (h.benar) break;
    }
    cek(h.benar, 'coba pie: batas irisan diseret (menempel ke 1%) sampai sesuai kunci', JSON.stringify(await ambil(id)));
    await foto('#soal-' + id, 'coba-pie-benar');
    await dalam(function (id) { var inp = document.querySelector('#soal-' + id + ' .wadah-coba').querySelectorAll('.coba-angka input')[0]; inp.value = '10'; inp.dispatchEvent(new Event('change')); return 1; }, id);
    var per = (await ambil(id)).persen;
    cek(per[0] === 10 && per.reduce(function (a, b) { return a + b; }, 0) === 100, 'coba pie: mengisi kolom persen menjaga jumlah tetap 100%', JSON.stringify(per));

    // --- tabel
    id = jenisId['tabel'];
    await buka(id);
    var kunciTabel = await dalam(function (id) { return cariButir(id).isian.kunci; }, id);
    for (k = 0; k < kunciTabel.length; k++) {
      await dalam(function (a) { var w = document.querySelector('#soal-' + a.id + ' .wadah-coba'); w.querySelectorAll('.coba-tab-btn')[a.k].click(); w.querySelectorAll('.coba-radio input')[a.q].click(); return 1; }, { id: id, k: k, q: kunciTabel[k] });
    }
    cek((await periksa(id)).benar, 'coba tabel: pilihan di keempat tab sesuai kunci');
    await foto('#soal-' + id, 'coba-tabel-benar');
    await dalam(function (id) { var w = document.querySelector('#soal-' + id + ' .wadah-coba'); w.querySelectorAll('.coba-tab-btn')[1].click(); var r = w.querySelectorAll('.coba-radio input'), q = 0; r.forEach(function (x, i) { if (x.checked) q = i; }); r[(q + 1) % r.length].click(); return 1; }, id);
    cek(!(await periksa(id)).benar, 'coba tabel: mengganti satu pilihan membuat jawaban salah');

    // ------------------------------------------------------------ unduhan
    await p.evaluasi('(function () { window.__unduhan = []; Raster.unduhBlob = function (blob, nama) { window.__unduhan.push({ nama: nama, blob: blob }); }; return 1; })()');
    async function tekan(idTombol) {
      await p.evaluasi('document.getElementById("' + idTombol + '").click()');
      return ambilUnduhan();
    }
    async function ambilUnduhan() {
      for (var i = 0; i < 1200 && !(await p.evaluasi('window.__unduhan.length')); i++) await p.tunggu(200);
      var r = await p.evaluasi('(async function () { var u = window.__unduhan.shift(); if (!u) return null; var buf = new Uint8Array(await u.blob.arrayBuffer()); var s = ""; for (var i = 0; i < buf.length; i += 32768) s += String.fromCharCode.apply(null, buf.subarray(i, i + 32768)); return { nama: u.nama, b64: btoa(s) }; })()');
      if (!r) return null;
      return { nama: r.nama, data: Buffer.from(r.b64, 'base64') };
    }
    var f = await tekan('btn-xlsx');
    var lembar = null;
    try { lembar = f && Berkas.periksaXlsx(f.data); } catch (e) { cek(false, 'unduh Excel di peramban utuh', e.message); }
    cek(!!lembar && lembar.Soal.length === 45, 'unduh Excel di peramban: satu baris per soal (44 soal + judul) dan lembar Ringkasan', lembar ? 'baris=' + lembar.Soal.length : 'tidak terunduh');
    f = await tekan('btn-json');
    var js = null;
    try { js = f && JSON.parse(f.data.toString('utf8')); } catch (e) { /* diperiksa di bawah */ }
    cek(!!js && js.validator && js.validator.lulus === true && js.paket.length === 2, 'unduh JSON di peramban: terbaca, memuat hasil validator dan 2 paket');
    await p.evaluasi('document.getElementById("pilih-paket").value = "1"; document.getElementById("pilih-paket").dispatchEvent(new Event("change"))');
    // Word format input SiAdu: satu berkas per subtes, jadi tombol Word memberi dua unduhan
    f = await tekan('btn-docx');
    var f2 = await ambilUnduhan();
    try {
      var d = Berkas.periksaDocx(f.data), d2 = Berkas.periksaDocx(f2.data);
      cek(/kemampuan-umum\.docx$/.test(f.nama) && /penalaran-numerik\.docx$/.test(f2.nama) && d.gambarUnik > 20, 'unduh Word di peramban utuh (jalur kanvas): dua berkas input SiAdu per subtes', f.nama + ', ' + f2.nama + ' ' + JSON.stringify(d));
    } catch (e) { cek(false, 'unduh Word di peramban utuh', e.message); }
    f = await tekan('btn-pdf');
    try { var pd = Berkas.periksaPdf(f.data); cek(pd.halaman > 20, 'unduh PDF di peramban utuh (jalur kanvas)', JSON.stringify(pd)); } catch (e) { cek(false, 'unduh PDF di peramban utuh', e.message); }
    if (!cepat) {
      f = await tekan('btn-zip');
      try {
        var z = Berkas.bacaZip(f.data), nama = z.map(function (x) { return x.nama; });
        var png = z.filter(function (x) { return /\.png$/.test(x.nama); });
        png.slice(0, 20).forEach(function (x) { Berkas.periksaPng(x.data); });
        // jumlah gambar = gambar soal, opsi, dan pembahasan yang tercatat di JSON dalam ZIP itu
        var jsZip = JSON.parse(z.filter(function (x) { return x.nama === 'soal-ojk-tahap1.json'; })[0].data.toString('utf8')), harapPng = {};
        jsZip.paket.forEach(function (pk) { pk.subtes.forEach(function (st) { st.butir.forEach(function (b) {
          (b.stimulus.gambar || []).concat(b.gambarPembahasan || [], b.opsi.map(function (o) { return o.gambar; }).filter(Boolean)).forEach(function (g) { harapPng[g.berkas] = true; });
        }); }); });
        var jmlPng = Object.keys(harapPng).length;
        cek(nama.indexOf('soal-ojk-tahap1.xlsx') >= 0 && nama.indexOf('soal-ojk-tahap1.json') >= 0 && nama.indexOf('paket-002/paket-002.pdf') >= 0 && png.length === jmlPng && nama.indexOf('ringkasan.txt') >= 0,
          'unduh ZIP di peramban utuh: Excel, JSON, Word, PDF, ' + jmlPng + ' gambar PNG, ringkasan', nama.length + ' anggota, png=' + png.length);
      } catch (e) { cek(false, 'unduh ZIP di peramban utuh', e.message); }
    }
    // PNG satu gambar
    await p.evaluasi('(function () { document.querySelector(".gambar-aksi button.mini").click(); return 1; })()');
    for (var q = 0; q < 100 && !(await p.evaluasi('window.__unduhan.length')); q++) await p.tunggu(100);
    var png1 = await p.evaluasi('(async function () { var u = window.__unduhan.shift(); if (!u) return null; var buf = new Uint8Array(await u.blob.arrayBuffer()); var s = ""; for (var i = 0; i < buf.length; i += 32768) s += String.fromCharCode.apply(null, buf.subarray(i, i + 32768)); return { nama: u.nama, b64: btoa(s) }; })()');
    try { var info = Berkas.periksaPng(Buffer.from(png1.b64, 'base64')); cek(info.lebar > 100, 'unduh PNG satu gambar di peramban utuh', png1.nama + ' ' + info.lebar + 'x' + info.tinggi); } catch (e) { cek(false, 'unduh PNG satu gambar di peramban utuh', e.message); }

    // ------------------------------------------------------------ skala
    var banyak = cepat ? 20 : 60;
    t0 = Date.now();
    // pengukur "layar membeku": selang terpanjang antara dua detik pewaktu selama generate dan validator
    await p.evaluasi('(function () { window.__celah = 0; var akhir = performance.now(); window.__pewaktu = setInterval(function () { var n = performance.now(); window.__celah = Math.max(window.__celah, n - akhir); akhir = n; }, 10); return 1; })()');
    await p.evaluasi('(async function () { document.getElementById("jumlah").value = ' + banyak + '; document.getElementById("benih").value = 31; await AppOjk.generate(); return 1; })()');
    var celah = await p.evaluasi('(function () { clearInterval(window.__pewaktu); return window.__celah; })()');
    var st2 = await p.evaluasi('({ lulus: AppOjk.state.validasi && AppOjk.state.validasi.lulus, butir: AppOjk.state.validasi && AppOjk.state.validasi.butir, kembar: AppOjk.state.validasi && AppOjk.state.validasi.kembar.length })');
    cek(celah < 600, 'peramban: layar tidak membeku saat generate dan validator ' + banyak + ' paket (selang terpanjang ' + Math.round(celah) + ' ms)', Math.round(celah) + ' ms');
    ringkas.generateBanyakMs = Date.now() - t0;
    cek(st2.lulus === true && st2.kembar === 0 && st2.butir === banyak * 22, 'peramban: generate ' + banyak + ' paket (' + banyak * 22 + ' butir) lulus tanpa kembar', ((Date.now() - t0) / 1000).toFixed(1) + ' dtk');

    if (!cepat) {
      var batas = await p.evaluasi('(async function () { window.__unduhan.length = 0; document.getElementById("btn-zip").click(); await new Promise(function (r) { setTimeout(r, 300); }); return { status: document.getElementById("status-unduh").textContent, unduhan: window.__unduhan.length }; })()');
      cek(/terlalu berat/.test(batas.status) && batas.unduhan === 0, 'peramban: ZIP berisi Word/PDF/PNG untuk 60 paket ditolak dengan petunjuk memakai CLI', batas.status);
    }

    // ------------------------------------------------------------ pengaturan: subtes, komposisi, tingkat
    var tunggalKu = await p.evaluasi('(async function () { Array.from(document.querySelectorAll("#pilih-subtes button")).filter(function (b) { return b.dataset.subtes === "ku"; })[0].click(); ' +
      'var e = document.getElementById("k-ku-verbal"); e.value = 5; e.dispatchEvent(new Event("change")); e = document.getElementById("k-ku-cerita"); e.value = 0; e.dispatchEvent(new Event("change")); ' +
      'var t = document.getElementById("tingkat"); t.value = "sulit"; t.dispatchEvent(new Event("change")); ' +
      'document.getElementById("jumlah").value = 2; document.getElementById("benih").value = 5; await AppOjk.generate(); ' +
      'var h = AppOjk.state.hasil; return { subtes: h.paket[0].subtes.map(function (s) { return s.kode + ":" + s.jumlah; }), tab: document.querySelectorAll("#tab-subtes button").length, level: h.paket[0].subtes[0].butir.map(function (b) { return b.level; }).filter(function (x, i, a) { return a.indexOf(x) === i; }), verbal: h.paket[0].subtes[0].butir.filter(function (b) { return b.submateriKomposisi === "verbal"; }).length, cerita: h.paket[0].subtes[0].butir.filter(function (b) { return b.submateriKomposisi === "cerita"; }).length, cli: document.getElementById("perintah-cli").value }; })()');
    cek(tunggalKu.subtes.join() === 'ku:13' && tunggalKu.tab === 1 && tunggalKu.level.join() === 'sulit' && tunggalKu.verbal === 5 && tunggalKu.cerita === 0, 'peramban: subtes hanya Kemampuan Umum, verbal 5, soal cerita 0, tingkat sulit dipatuhi', JSON.stringify(tunggalKu));
    cek(/--subtes ku/.test(tunggalKu.cli) && /--tingkat sulit/.test(tunggalKu.cli) && /--komposisi-ku verbal=5,cerita=0/.test(tunggalKu.cli) && /--benih 5/.test(tunggalKu.cli), 'peramban: perintah CLI setara mengikuti pengaturan', tunggalKu.cli);
    var tunggalPn = await p.evaluasi('(async function () { Array.from(document.querySelectorAll("#pilih-subtes button")).filter(function (b) { return b.dataset.subtes === "pn"; })[0].click(); document.getElementById("btn-baku").click(); ' +
      'var t = document.getElementById("tingkat"); t.value = "campur"; t.dispatchEvent(new Event("change")); document.getElementById("jumlah").value = 2; await AppOjk.generate(); var h = AppOjk.state.hasil; ' +
      'return { subtes: h.paket[0].subtes.map(function (s) { return s.kode + ":" + s.jumlah; }), kartu: document.querySelectorAll(".soal").length, lulus: AppOjk.state.validasi.lulus }; })()');
    cek(tunggalPn.subtes.join() === 'pn:10' && tunggalPn.kartu === 10 && tunggalPn.lulus === true, 'peramban: subtes hanya Penalaran Numerik menampilkan 10 soal interaktif', JSON.stringify(tunggalPn));

    cek(p.konsol.length === 0, 'peramban: tidak ada galat konsol selama seluruh uji', p.konsol.join(' | '));
  } finally {
    await p.tutup();
  }
  return ringkas;
}

module.exports = { jalankan: jalankan };

if (require.main === module) {
  var gagal = 0, lulus = 0, layar = null, argv = process.argv.slice(2);
  if (argv.indexOf('--layar') >= 0) layar = path.resolve(argv[argv.indexOf('--layar') + 1]);
  jalankan({
    cepat: argv.indexOf('--cepat') >= 0, layar: layar, cetak: console.log,
    cek: function (ok, nama, info) { if (ok) lulus++; else gagal++; console.log((ok ? '  ok    ' : '  GAGAL ') + nama + (info && !ok ? ' — ' + info : '')); }
  }).then(function () {
    if (gagal) { console.log('GAGAL: ' + gagal + ' pemeriksaan antarmuka gagal'); process.exitCode = 1; }
    else console.log('HASIL: ' + lulus + ' pemeriksaan antarmuka lulus');
  }).catch(function (e) { console.log('GAGAL: ' + (e && e.message ? e.message : e)); process.exitCode = 1; });
}
