/*
 * corak.js — corak isian bersama untuk figural bercorak (gaya matriks 2x2 bersekat, contoh riset BAB V soal 4).
 *
 * Bangun dibagi menjadi beberapa BAGIAN cembung (sektor cakram, belahan, segitiga sekat), dan tiap bagian
 * diisi satu corak. Corak disimpan sebagai KODE (data murni) dan selalu digambar ulang dari kodenya:
 *
 *   hitam, putih, titik, bintang, bulatan        tidak berarah
 *   kotak, kotak-miring                          kotak-kotak tegak-datar / miring; bertukar bila diputar 45°
 *   arsir-0, arsir-45, arsir-90, arsir-135       garis sejajar bersudut 0/45/90/135° dari mendatar, diukur
 *                                                berlawanan jarum jam: arsir-45 = "/", arsir-135 = "\"
 *
 * Corak berarah ikut berubah bila bagiannya diputar atau dicerminkan: garis mendatar menjadi tegak bila
 * diputar 90°, garis "/" menjadi "\" bila dicerminkan terhadap garis tegak. `putarKode` dan `cerminKode`
 * memberi kode hasilnya; keduanya untuk PENYUSUN soal. Pemeriksa (cek-*.js) wajib menghitung sendiri.
 *
 * Sudut bangun dan sektor: derajat, 0 = arah atas, bertambah SEARAH jarum jam (seperti jarum jam). Sudut
 * garis cermin memakai cara arsir: 0 = mendatar, 90 = tegak, 45 = "/", 135 = "\".
 *
 * Yang digambar hanya poligon, garis, dan lingkaran (dimengerti svgraster.js), jadi PNG, Word, dan PDF sama
 * dengan yang tampil di peramban.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./svg.js'), require('./bentuk.js'));
    module.exports = api;
  } else {
    api = factory(root.Svg, root.Bentuk);
    root.Corak = api;
  }
})(typeof self !== 'undefined' ? self : this, function (S, Bentuk) {
  'use strict';

  var TINTA = '#1d1d1d', TEPI = '#4a5266';

  var DAFTAR = [
    { kode: 'hitam', nama: 'hitam penuh', berarah: false },
    { kode: 'putih', nama: 'putih polos', berarah: false },
    { kode: 'titik', nama: 'bertitik-titik', berarah: false },
    { kode: 'bintang', nama: 'putih berbintang', berarah: false },
    { kode: 'bulatan', nama: 'hitam berbulatan putih', berarah: false },
    { kode: 'kotak', nama: 'berkotak-kotak', berarah: true },
    { kode: 'kotak-miring', nama: 'berkotak-kotak miring', berarah: true },
    { kode: 'arsir-0', nama: 'bergaris mendatar', berarah: true },
    { kode: 'arsir-45', nama: 'bergaris miring naik ke kanan', berarah: true },
    { kode: 'arsir-90', nama: 'bergaris tegak', berarah: true },
    { kode: 'arsir-135', nama: 'bergaris miring turun ke kanan', berarah: true }
  ];
  var KODE = DAFTAR.map(function (d) { return d.kode; });
  var INFO = {};
  DAFTAR.forEach(function (d) { INFO[d.kode] = d; });

  function cekKode(kode) { if (!INFO[kode]) throw new Error('corak tidak dikenal: ' + kode); }
  function nama(kode) { cekKode(kode); return INFO[kode].nama; }
  function berarah(kode) { cekKode(kode); return INFO[kode].berarah; }
  function gelap(kode) { return kode === 'hitam' || kode === 'bulatan'; }
  function mod(a, n) { return ((a % n) + n) % n; }

  /** Kode corak setelah bagiannya diputar `derajat` SEARAH jarum jam (kelipatan 45). */
  function putarKode(kode, derajat) {
    cekKode(kode);
    if (derajat % 45) throw new Error('putaran corak harus kelipatan 45°');
    var m = /^arsir-(\d+)$/.exec(kode);
    if (m) return 'arsir-' + mod(+m[1] - derajat, 180);
    if ((kode === 'kotak' || kode === 'kotak-miring') && mod(derajat, 90) === 45) return kode === 'kotak' ? 'kotak-miring' : 'kotak';
    return kode;
  }

  /** Kode corak setelah bagiannya dicerminkan terhadap garis bersudut `sumbu` (0 mendatar, 90 tegak, 45 "/", 135 "\"). */
  function cerminKode(kode, sumbu) {
    cekKode(kode);
    if (sumbu % 45) throw new Error('garis cermin corak harus kelipatan 45°');
    var m = /^arsir-(\d+)$/.exec(kode);
    if (m) return 'arsir-' + mod(2 * sumbu - +m[1], 180);
    return kode;                                       // kotak-kotak tegak-datar dan miring simetris terhadap keempat garis
  }

  // ------------------------------------------------------------------ geometri

  /** Titik pada jarak r dari pusat ke arah `sudut` (0 = atas, searah jarum jam). */
  function titikArah(cx, cy, r, sudut) {
    var t = sudut * Math.PI / 180;
    return [cx + r * Math.sin(t), cy - r * Math.cos(t)];
  }

  /** Poligon sektor cakram dari sudut a0 ke a1 (searah jarum jam), termasuk titik pusat. */
  function sektor(cx, cy, r, a0, a1, langkah) {
    var p = [[cx, cy]], n = Math.max(2, Math.ceil(Math.abs(a1 - a0) / (langkah || 5)));
    for (var i = 0; i <= n; i++) p.push(titikArah(cx, cy, r, a0 + (a1 - a0) * i / n));
    return p;
  }

  /** Poligon sebuah bangun: lingkaran, persegi, segienam, segidelapan, belah-ketupat, segitiga (lihat bentuk.js). */
  function bentuk(namaBentuk, cx, cy, s) {
    if (namaBentuk === 'lingkaran') return Bentuk.titik('lingkaran', cx, cy, s, 72);
    if (namaBentuk === 'segidelapan') {
      var p = [];
      for (var i = 0; i < 8; i++) p.push(titikArah(cx, cy, 0.92 * s, 22.5 + i * 45));
      return p;
    }
    return Bentuk.titik(namaBentuk, cx, cy, s);
  }

  /** Setengah bidang di sisi SEARAH jarum jam dari sinar bersudut a yang berpangkal di (cx, cy). */
  function potongSinar(p, cx, cy, a) {
    var t = a * Math.PI / 180, nx = Math.cos(t), ny = Math.sin(t);
    return Bentuk.potongBidang(p, nx, ny, nx * cx + ny * cy);
  }

  /**
   * Bagi poligon cembung menjadi n bagian dengan sinar dari (cx, cy): bagian ke-k mencakup sudut
   * awal + k*360/n sampai awal + (k+1)*360/n (searah jarum jam). n = 1 mengembalikan poligon utuh.
   */
  function bagi(poli, cx, cy, n, awal) {
    awal = awal || 0;
    if (n <= 1) return [poli.slice()];
    var out = [], lebar = 360 / n;
    for (var k = 0; k < n; k++) {
      var a0 = awal + k * lebar, a1 = a0 + lebar;
      var q = potongSinar(poli, cx, cy, a0);
      q = Bentuk.potongBidang(q, -Math.cos(a1 * Math.PI / 180), -Math.sin(a1 * Math.PI / 180), -(Math.cos(a1 * Math.PI / 180) * cx + Math.sin(a1 * Math.PI / 180) * cy));
      out.push(q);
    }
    return out;
  }

  // --------------------------------------------------------------------- corak

  function arsir(sisi, g, sudut, jarak, tebal) {
    var t = sudut * Math.PI / 180, d = [Math.cos(t), -Math.sin(t)], n = [-d[1], d[0]], o = [], K = 40;
    for (var k = -K; k <= K; k++) {
      var p0 = [g[0] + n[0] * k * jarak, g[1] + n[1] * k * jarak], ruas = Bentuk.potongGaris(sisi, p0, d);
      if (!ruas || Math.hypot(ruas[1][0] - ruas[0][0], ruas[1][1] - ruas[0][1]) < 1.6) continue;
      o.push(S.garis(ruas[0][0], ruas[0][1], ruas[1][0], ruas[1][1], { garis: TINTA, tebal: tebal }));
    }
    return o.join('');
  }

  /** Titik-titik kisi (berselang tiap baris) yang berjarak sedikitnya `tepi` dari sisi poligon. */
  function kisi(sisi, g, jx, jy, tepi) {
    var out = [];
    for (var gy = -30; gy <= 30; gy++) {
      for (var gx = -30; gx <= 30; gx++) {
        var x = g[0] + gx * jx + (mod(gy, 2) ? jx / 2 : 0), y = g[1] + gy * jy;
        if (Bentuk.jarakDalam(sisi, x, y) >= tepi) out.push([x, y]);
      }
    }
    return out;
  }

  function bintangKecil(x, y, j, tebal) {
    var o = [];
    for (var a = 0; a < 4; a++) {
      var t = a * Math.PI / 4;
      o.push(S.garis(x - j * Math.cos(t), y - j * Math.sin(t), x + j * Math.cos(t), y + j * Math.sin(t), { garis: TINTA, tebal: tebal, ujung: 'round' }));
    }
    return o.join('');
  }

  /**
   * Satu bagian (poligon cembung) berisi corak, tanpa garis tepi.
   * @param {object} o { skala: pengali kerapatan dan ukuran corak (baku 1) }
   */
  function isi(poli, kode, o) {
    cekKode(kode);
    o = o || {};
    var k = o.skala || 1, out = [];
    if (poli.length < 3 || Math.abs(Bentuk.luas(poli)) < 1) return '';
    out.push(S.poli(poli, { tutup: true, isi: gelap(kode) ? TINTA : '#ffffff' }));
    var sisi = Bentuk.sisiDalam(poli), g = Bentuk.beratTitik(poli), ruang = Bentuk.jarakDalam(sisi, g[0], g[1]);
    var m = /^arsir-(\d+)$/.exec(kode);
    if (m) out.push(arsir(sisi, g, +m[1], 4.4 * k, 1.1 * k));
    else if (kode === 'kotak') { out.push(arsir(sisi, g, 0, 5.6 * k, 1.05 * k)); out.push(arsir(sisi, g, 90, 5.6 * k, 1.05 * k)); }
    else if (kode === 'kotak-miring') { out.push(arsir(sisi, g, 45, 5.6 * k, 1.05 * k)); out.push(arsir(sisi, g, 135, 5.6 * k, 1.05 * k)); }
    else if (kode === 'titik') {
      kisi(sisi, g, 6.2 * k, 5.4 * k, 2.6 * k).forEach(function (p) { out.push(S.lingkaran(p[0], p[1], 1.3 * k, { isi: TINTA })); });
    } else if (kode === 'bintang' || kode === 'bulatan') {
      var bintang = kode === 'bintang', jx = (bintang ? 13 : 11) * k, jari = (bintang ? 3.2 : 2.3) * k;
      var titik = kisi(sisi, g, jx, jx * 0.87, jari + 1.6 * k);
      if (!titik.length && ruang > 2.2) titik = [g];  // bagian kecil: satu tanda di titik beratnya
      titik.forEach(function (p) {
        var r = titik.length === 1 ? Math.max(1.8, Math.min(jari * 1.4, ruang - 1.2)) : jari;
        out.push(bintang ? bintangKecil(p[0], p[1], r, 1.3 * k) : S.lingkaran(p[0], p[1], r, { isi: '#ffffff' }));
      });
    }
    return out.join('');
  }

  /**
   * Bangun bercorak utuh: semua bagian beserta garis batasnya. Batas bagian gelap digambar putih supaya
   * dua bagian hitam yang bersebelahan tetap terlihat terpisah; `o.luar` (poligon) menjadi garis tepi luar.
   * @param {Array<{poli:Array, kode:string}>} bagian
   * @param {object} o { skala, luar, tebal (garis batas, baku 1.6), tebalLuar (baku 2.2) }
   */
  function gambar(bagian, o) {
    o = o || {};
    var out = [], tebal = o.tebal || 1.6;
    bagian.forEach(function (b) { out.push(isi(b.poli, b.kode, o)); });
    bagian.forEach(function (b) { if (gelap(b.kode) && b.poli.length >= 3) out.push(S.poli(b.poli, { tutup: true, isi: 'none', garis: '#ffffff', tebal: tebal * 0.9, sambung: 'round' })); });
    bagian.forEach(function (b) { if (!gelap(b.kode) && b.poli.length >= 3) out.push(S.poli(b.poli, { tutup: true, isi: 'none', garis: TINTA, tebal: tebal, sambung: 'round' })); });
    if (o.luar) out.push(S.poli(o.luar, { tutup: true, isi: 'none', garis: TINTA, tebal: o.tebalLuar || 2.2, sambung: 'round' }));
    return out.join('');
  }

  return {
    TINTA: TINTA, TEPI: TEPI, DAFTAR: DAFTAR, KODE: KODE,
    nama: nama, berarah: berarah, gelap: gelap, putarKode: putarKode, cerminKode: cerminKode,
    titikArah: titikArah, sektor: sektor, bentuk: bentuk, bagi: bagi, isi: isi, gambar: gambar
  };
});
