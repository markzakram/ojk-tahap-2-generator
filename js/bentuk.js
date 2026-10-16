/*
 * bentuk.js — bentuk dasar dan alat geometri kecil untuk soal figural hasil riset
 * (matriks 5x5, matriks 5x6, matriks 2x2 bersekat, deret kotak ganda).
 *
 * Bentuk digambar di sekitar titik pusat (cx, cy) dengan "jari" s, yaitu setengah
 * lebar kotak pembatasnya. Yang dipakai hanya tag yang dimengerti penggambar piksel
 * `svgraster.js` (polygon, circle, path M C Z), jadi PNG, Word, dan PDF sama dengan
 * yang tampil di peramban.
 *
 *   hati lingkaran persegi segitiga bintang segienam belah-ketupat
 *
 * Alat geometri untuk poligon cembung: luas bertanda, titik berat, potong dengan
 * setengah bidang, potong garis tak hingga (garis arsir), dan jarak titik ke tepi
 * (titik-titik arsir yang tidak menyentuh tepi).
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./svg.js'));
    module.exports = api;
  } else {
    api = factory(root.Svg);
    root.Bentuk = api;
  }
})(typeof self !== 'undefined' ? self : this, function (S) {
  'use strict';

  // ------------------------------------------------------------------ bentuk

  /** Titik sudut poligon sebuah bentuk (lingkaran didekati segi-n). */
  function titik(nama, cx, cy, s, n) {
    var p = [], i, a;
    switch (nama) {
      case 'persegi':
        a = 0.8 * s;
        return [[cx - a, cy - a], [cx + a, cy - a], [cx + a, cy + a], [cx - a, cy + a]];
      case 'segitiga':
        return [[cx, cy - 0.92 * s], [cx + 0.96 * s, cy + 0.74 * s], [cx - 0.96 * s, cy + 0.74 * s]];
      case 'segienam':
        for (i = 0; i < 6; i++) { a = i * Math.PI / 3; p.push([cx + 0.96 * s * Math.cos(a), cy + 0.96 * s * Math.sin(a)]); }
        return p;
      case 'belah-ketupat':
        return [[cx, cy - s], [cx + s, cy], [cx, cy + s], [cx - s, cy]];
      case 'bintang':
        for (i = 0; i < 10; i++) {
          a = -Math.PI / 2 + i * Math.PI / 5;
          var r = i % 2 === 0 ? s : 0.42 * s;
          p.push([cx + r * Math.cos(a), cy + 0.06 * s + r * Math.sin(a)]);
        }
        return p;
      case 'lingkaran':
        n = n || 64;
        for (i = 0; i < n; i++) { a = 2 * Math.PI * i / n; p.push([cx + 0.86 * s * Math.cos(a), cy + 0.86 * s * Math.sin(a)]); }
        return p;
      default:
        throw new Error('bentuk tidak dikenal: ' + nama);
    }
  }

  /** Lintasan hati (kurva Bezier kubik) dalam satuan s. */
  function jalurHati(cx, cy, s) {
    var k = 0.94 * s;
    function t(x, y) { return S.num(cx + x * k) + ' ' + S.num(cy + y * k); }
    return 'M' + t(0, 0.92) +
      ' C' + t(-0.12, 0.78) + ' ' + t(-1, 0.28) + ' ' + t(-1, -0.28) +
      ' C' + t(-1, -0.72) + ' ' + t(-0.62, -0.92) + ' ' + t(-0.33, -0.92) +
      ' C' + t(-0.14, -0.92) + ' ' + t(-0.03, -0.8) + ' ' + t(0, -0.62) +
      ' C' + t(0.03, -0.8) + ' ' + t(0.14, -0.92) + ' ' + t(0.33, -0.92) +
      ' C' + t(0.62, -0.92) + ' ' + t(1, -0.72) + ' ' + t(1, -0.28) +
      ' C' + t(1, 0.28) + ' ' + t(0.12, 0.78) + ' ' + t(0, 0.92) + ' Z';
  }

  /**
   * Satu bentuk sebagai elemen SVG.
   * @param {object} gaya pilihan svg.js: isi, garis, tebal, sambung
   */
  function svg(nama, cx, cy, s, gaya) {
    gaya = Object.assign({ sambung: 'round' }, gaya || {});
    if (nama === 'lingkaran') return S.lingkaran(cx, cy, 0.86 * s, gaya);
    if (nama === 'hati') return '<path d="' + jalurHati(cx, cy, s) + '"' + S.gaya(gaya) + '/>';
    return S.poli(titik(nama, cx, cy, s), Object.assign({ tutup: true }, gaya));
  }

  // --------------------------------------------------------------- geometri

  function luas(p) {
    var a = 0;
    for (var i = 0; i < p.length; i++) { var q = p[i], r = p[(i + 1) % p.length]; a += q[0] * r[1] - r[0] * q[1]; }
    return a / 2;
  }

  /** Titik berat poligon. */
  function beratTitik(p) {
    var a = luas(p), x = 0, y = 0;
    if (Math.abs(a) < 1e-9) {
      p.forEach(function (q) { x += q[0]; y += q[1]; });
      return [x / p.length, y / p.length];
    }
    for (var i = 0; i < p.length; i++) {
      var q = p[i], r = p[(i + 1) % p.length], c = q[0] * r[1] - r[0] * q[1];
      x += (q[0] + r[0]) * c; y += (q[1] + r[1]) * c;
    }
    return [x / (6 * a), y / (6 * a)];
  }

  /** Bagian poligon cembung yang memenuhi nx*x + ny*y >= c (Sutherland-Hodgman satu sisi). */
  function potongBidang(p, nx, ny, c) {
    var out = [];
    for (var i = 0; i < p.length; i++) {
      var a = p[i], b = p[(i + 1) % p.length];
      var da = nx * a[0] + ny * a[1] - c, db = nx * b[0] + ny * b[1] - c;
      if (da >= 0) out.push(a);
      if ((da >= 0) !== (db >= 0)) {
        var t = da / (da - db);
        out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      }
    }
    return out;
  }

  /** Normal ke dalam tiap sisi poligon cembung: [{nx, ny, c}] dengan nx*x + ny*y >= c di dalam. */
  function sisiDalam(p) {
    var arah = luas(p) >= 0 ? 1 : -1, out = [];
    for (var i = 0; i < p.length; i++) {
      var a = p[i], b = p[(i + 1) % p.length], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
      if (L < 1e-9) continue;
      // untuk orientasi positif (koordinat layar: searah jarum jam) bagian dalam ada di kanan sisi
      var nx = -dy / L * arah, ny = dx / L * arah;
      out.push({ nx: nx, ny: ny, c: nx * a[0] + ny * a[1] });
    }
    return out;
  }

  /** Jarak bertanda terkecil titik ke sisi poligon cembung (positif = di dalam). */
  function jarakDalam(sisi, x, y) {
    var m = Infinity;
    sisi.forEach(function (e) { m = Math.min(m, e.nx * x + e.ny * y - e.c); });
    return m;
  }

  /** Ruas garis p0 + t*d yang berada di dalam poligon cembung, atau null. */
  function potongGaris(sisi, p0, d) {
    var t0 = -Infinity, t1 = Infinity;
    for (var i = 0; i < sisi.length; i++) {
      var e = sisi[i], awal = e.nx * p0[0] + e.ny * p0[1] - e.c, laju = e.nx * d[0] + e.ny * d[1];
      if (Math.abs(laju) < 1e-12) { if (awal < 0) return null; continue; }
      var t = -awal / laju;
      if (laju > 0) t0 = Math.max(t0, t); else t1 = Math.min(t1, t);
      if (t0 > t1) return null;
    }
    if (!(t1 - t0 > 1e-6) || !isFinite(t0) || !isFinite(t1)) return null;
    return [[p0[0] + d[0] * t0, p0[1] + d[1] * t0], [p0[0] + d[0] * t1, p0[1] + d[1] * t1]];
  }

  return {
    titik: titik, svg: svg, jalurHati: jalurHati,
    luas: luas, beratTitik: beratTitik, potongBidang: potongBidang, sisiDalam: sisiDalam, jarakDalam: jarakDalam, potongGaris: potongGaris
  };
});
