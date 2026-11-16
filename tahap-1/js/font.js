/*
 * font.js — font garis (stroke font) untuk penggambar piksel Node.
 *
 * Di peramban teks SVG dirender oleh huruf sistem. Di Node tidak ada mesin
 * huruf, jadi setiap huruf di sini didefinisikan sebagai beberapa goresan
 * (garis lurus dan busur elips) pada kisi 14 satuan per em:
 *
 *     tinggi huruf kapital & angka = 10, tinggi huruf kecil = 7,
 *     batang atas = 10, turunan = -3, garis dasar = 0.
 *
 * Lebar maju (advance) tiap huruf DIAMBIL dari tabel Helvetica di `Metrik`,
 * jadi tata letak teks di PNG sama dengan di peramban; hanya bentuk hurufnya
 * yang lebih sederhana (seperti font teknik, tanpa serif dan tanpa kontras
 * tebal-tipis). Bentuk tiap huruf mengikuti lebar majunya sehingga huruf
 * tebal yang lebih lebar tetap proporsional.
 *
 * Keluaran `garisTeks` adalah daftar goresan siap digambar sebagai garis
 * bertebal (ujung dan sambungan bulat) oleh `svgraster.js`.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./metrik.js'));
    module.exports = api;
  } else {
    api = factory(root.Metrik);
    root.Font = api;
  }
})(typeof self !== 'undefined' ? self : this, function (Metrik) {
  'use strict';

  var SATUAN = 14;       // satuan per em

  // ---------------------------------------------------------------- alat goresan

  /** Garis patah dari pasangan koordinat: L(x0, y0, x1, y1, ...). */
  function L() {
    var a = arguments, s = [];
    for (var i = 0; i + 1 < a.length; i += 2) s.push([a[i], a[i + 1]]);
    return s;
  }

  /**
   * Busur elips: pusat (cx, cy), jari-jari rx dan ry, sudut a0 ke a1 dalam derajat
   * (berlawanan arah jarum jam dari sumbu x positif, y ke atas). Sudut menurun =
   * searah jarum jam.
   */
  function A(cx, cy, rx, ry, a0, a1) {
    var n = Math.max(5, Math.ceil(Math.abs(a1 - a0) / 18));
    var s = [];
    for (var i = 0; i <= n; i++) {
      var a = (a0 + (a1 - a0) * i / n) * Math.PI / 180;
      s.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
    }
    return s;
  }

  /** Sambung dua goresan (titik awal goresan kedua dianggap sama dengan akhir yang pertama). */
  function J(a, b) { return a.concat(b); }

  function titik(x, y) { return L(x, y, x, y + 0.05); }

  /** Cerminkan goresan pada x -> w - x (dipakai 9 dari 6, dan ')' dari '('). */
  function cerminX(strokes, w) {
    return strokes.map(function (s) { return s.map(function (p) { return [w - p[0], p[1]]; }); });
  }

  /** Putar 180 derajat terhadap (w/2, 5). */
  function putar180(strokes, w) {
    return strokes.map(function (s) { return s.map(function (p) { return [w - p[0], 10 - p[1]]; }); });
  }

  function skalaGeser(strokes, k, dx, dy) {
    return strokes.map(function (s) { return s.map(function (p) { return [p[0] * k + dx, p[1] * k + dy]; }); });
  }

  // ------------------------------------------------------------------ glyph

  var GLYPH = {};

  function d(c, fn) { GLYPH[c] = fn; }

  // ---- huruf kapital
  d('A', function (w) {
    var l = 0.5, r = w - 0.5, m = w / 2, y = 3.6;
    var xl = l + (m - l) * (y / 10);
    return [L(l, 0, m, 10, r, 0), L(xl, y, w - xl, y)];
  });
  d('B', function (w) {
    var l = 1.0, r = w - 0.8, rb = 2.9, bx = r - rb;
    return [L(l, 0, l, 10),
      J(J(L(l, 10, bx, 10), A(bx, 7.55, rb * 0.92, 2.45, 90, -90)), L(l, 5.1)),
      J(J(L(l, 5.1, bx, 5.1), A(bx, 2.55, rb, 2.55, 90, -90)), L(l, 0))];
  });
  d('C', function (w) {
    var rx = (w - 1.6) / 2;
    return [A(w / 2, 5, rx, 5, 42, 318)];
  });
  d('D', function (w) {
    var l = 1.0, r = w - 0.8, rx = Math.min(5, r - l - 1.5), xd = r - rx;
    return [J(J(L(l, 0, l, 10, xd, 10), A(xd, 5, rx, 5, 90, -90)), L(l, 0))];
  });
  d('E', function (w) {
    var l = 1.0, r = w - 0.8;
    return [L(r, 10, l, 10, l, 0, r, 0), L(l, 5.1, r - 0.9, 5.1)];
  });
  d('F', function (w) {
    var l = 1.0, r = w - 0.8;
    return [L(r, 10, l, 10, l, 0), L(l, 5.1, r - 0.9, 5.1)];
  });
  d('G', function (w) {
    var rx = (w - 1.6) / 2, cx = w / 2;
    return [J(A(cx, 5, rx, 5, 42, 360), L(cx + rx, 5, cx + 0.2, 5))];
  });
  d('H', function (w) {
    var l = 1.0, r = w - 1.0;
    return [L(l, 0, l, 10), L(r, 0, r, 10), L(l, 5.1, r, 5.1)];
  });
  d('I', function (w) { return [L(w / 2, 0, w / 2, 10)]; });
  d('J', function (w) {
    var r = w - 1.0;
    return [J(L(r, 10, r, 2.6), A(r - 2.3, 2.6, 2.3, 2.6, 0, -165))];
  });
  d('K', function (w) {
    var l = 1.0, r = w - 0.5;
    return [L(l, 0, l, 10), L(r, 10, l, 3.8), L(l + 1.8, 5.5, r, 0)];
  });
  d('L', function (w) { return [L(1.0, 10, 1.0, 0, w - 0.5, 0)]; });
  d('M', function (w) {
    var l = 1.0, r = w - 1.0;
    return [L(l, 0, l, 10, w / 2, 1.0, r, 10, r, 0)];
  });
  d('N', function (w) {
    var l = 1.0, r = w - 1.0;
    return [L(l, 0, l, 10, r, 0, r, 10)];
  });
  d('O', function (w) { return [A(w / 2, 5, (w - 1.6) / 2, 5, 0, 360)]; });
  d('P', function (w) {
    var l = 1.0, r = w - 0.8, rb = 2.9, bx = r - rb;
    return [L(l, 0, l, 10),
      J(J(L(l, 10, bx, 10), A(bx, 7.4, rb, 2.6, 90, -90)), L(l, 4.8))];
  });
  d('Q', function (w) {
    return [A(w / 2, 5, (w - 1.6) / 2, 5, 0, 360), L(w * 0.58, 2.8, w - 0.4, -0.8)];
  });
  d('R', function (w) {
    var l = 1.0, r = w - 0.8, rb = 2.9, bx = r - rb;
    return [L(l, 0, l, 10),
      J(J(L(l, 10, bx, 10), A(bx, 7.4, rb, 2.6, 90, -90)), L(l, 4.8)),
      L(l + 3.0, 4.8, r, 0)];
  });
  d('S', function (w) {
    var cx = w / 2, rx = (w - 1.8) / 2;
    return [J(A(cx, 7.55, rx, 2.45, 28, 270), A(cx, 2.55, rx, 2.55, 90, -152))];
  });
  d('T', function (w) { return [L(0.4, 10, w - 0.4, 10), L(w / 2, 10, w / 2, 0)]; });
  d('U', function (w) {
    var l = 1.0, r = w - 1.0;
    return [J(J(L(l, 10, l, 3.4), A(w / 2, 3.4, (r - l) / 2, 3.4, 180, 360)), L(r, 10))];
  });
  d('V', function (w) { return [L(0.3, 10, w / 2, 0, w - 0.3, 10)]; });
  d('W', function (w) {
    return [L(0.3, 10, w * 0.27, 0, w / 2, 7.6, w * 0.73, 0, w - 0.3, 10)];
  });
  d('X', function (w) { return [L(0.6, 0, w - 0.6, 10), L(0.6, 10, w - 0.6, 0)]; });
  d('Y', function (w) { return [L(0.4, 10, w / 2, 4.8, w - 0.4, 10), L(w / 2, 4.8, w / 2, 0)]; });
  d('Z', function (w) { return [L(0.8, 10, w - 0.8, 10, 0.8, 0, w - 0.8, 0)]; });

  // ---- huruf kecil
  d('a', function (w) {
    var rx = (w - 1.8) / 2.2, r = w - 0.9;
    return [A(r - rx - 0.2, 3.5, rx, 3.5, 0, 360), L(r - 0.2, 7, r - 0.2, 0)];
  });
  d('b', function (w) {
    var l = 0.9, rx = (w - 1.8) / 2;
    return [L(l, 10, l, 0), A(l + rx, 3.5, rx, 3.5, 0, 360)];
  });
  d('c', function (w) {
    var rx = (w - 1.6) / 2;
    return [A(w / 2 + 0.1, 3.5, rx, 3.5, 42, 318)];
  });
  d('d', function (w) {
    var r = w - 0.9, rx = (w - 1.8) / 2;
    return [L(r, 10, r, 0), A(r - rx, 3.5, rx, 3.5, 0, 360)];
  });
  d('e', function (w) {
    var cx = w / 2, rx = (w - 1.6) / 2;
    return [J(L(cx - rx, 3.5, cx + rx, 3.5), A(cx, 3.5, rx, 3.5, 0, 322))];
  });
  d('f', function (w) {
    var x = w * 0.38;
    return [J(L(x, 0, x, 8.1), A(x + 1.9, 8.1, 1.9, 1.9, 180, 62)), L(0.3, 7, w - 0.2, 7)];
  });
  d('g', function (w) {
    var r = w - 0.9, rx = (w - 1.8) / 2;
    return [A(r - rx, 3.5, rx, 3.5, 0, 360),
      J(L(r, 7, r, -0.9), A(r - 2.1, -0.9, 2.1, 1.9, 0, -172))];
  });
  d('h', function (w) {
    var l = 0.9, r = w - 0.9, rx = (r - l) / 2;
    return [L(l, 0, l, 10), J(A(l + rx, 4.7, rx, 2.4, 180, 0), L(r, 0))];
  });
  d('i', function (w) { return [L(w / 2, 0, w / 2, 7), titik(w / 2, 9.3)]; });
  d('j', function (w) {
    var x = w * 0.62;
    return [J(L(x, 7, x, -0.9), A(x - 2.0, -0.9, 2.0, 1.9, 0, -172)), titik(x, 9.3)];
  });
  d('k', function (w) {
    var l = 0.9, r = w - 0.4;
    return [L(l, 0, l, 10), L(r, 7, l, 2.9), L(l + 1.6, 4.2, r, 0)];
  });
  d('l', function (w) { return [L(w / 2, 0, w / 2, 10)]; });
  d('m', function (w) {
    var l = 0.9, r = w - 0.9, mid = (l + r) / 2, rx = (r - l) / 4;
    return [L(l, 0, l, 7),
      J(A(l + rx, 4.7, rx, 2.3, 180, 0), L(mid, 0)),
      J(A(mid + rx, 4.7, rx, 2.3, 180, 0), L(r, 0))];
  });
  d('n', function (w) {
    var l = 0.9, r = w - 0.9, rx = (r - l) / 2;
    return [L(l, 0, l, 7), J(A(l + rx, 4.7, rx, 2.3, 180, 0), L(r, 0))];
  });
  d('o', function (w) { return [A(w / 2, 3.5, (w - 1.6) / 2, 3.5, 0, 360)]; });
  d('p', function (w) {
    var l = 0.9, rx = (w - 1.8) / 2;
    return [L(l, 7, l, -3), A(l + rx, 3.5, rx, 3.5, 0, 360)];
  });
  d('q', function (w) {
    var r = w - 0.9, rx = (w - 1.8) / 2;
    return [L(r, 7, r, -3), A(r - rx, 3.5, rx, 3.5, 0, 360)];
  });
  d('r', function (w) {
    var l = 0.9;
    return [L(l, 0, l, 7), A(l + 2.4, 4.8, 2.4, 2.2, 180, 62)];
  });
  d('s', function (w) {
    var cx = w / 2, rx = (w - 1.6) / 2;
    return [J(A(cx, 5.3, rx, 1.8, 28, 270), A(cx, 1.75, rx, 1.75, 90, -150))];
  });
  d('t', function (w) {
    var x = w * 0.36;
    return [J(L(x, 9.4, x, 1.9), A(x + 1.7, 1.9, 1.7, 1.9, 180, 262)), L(0.3, 7, w - 0.2, 7)];
  });
  d('u', function (w) {
    var l = 0.9, r = w - 0.9, rx = (r - l) / 2;
    return [J(L(l, 7, l, 2.5), A(l + rx, 2.5, rx, 2.5, 180, 360)), L(r, 7, r, 0)];
  });
  d('v', function (w) { return [L(0.3, 7, w / 2, 0, w - 0.3, 7)]; });
  d('w', function (w) {
    return [L(0.3, 7, w * 0.27, 0, w / 2, 5.2, w * 0.73, 0, w - 0.3, 7)];
  });
  d('x', function (w) { return [L(0.4, 7, w - 0.4, 0), L(0.4, 0, w - 0.4, 7)]; });
  d('y', function (w) { return [L(0.3, 7, w / 2, 0.6), L(w - 0.3, 7, w * 0.3, -3)]; });
  d('z', function (w) { return [L(0.7, 7, w - 0.7, 7, 0.7, 0, w - 0.7, 0)]; });

  // ---- angka
  d('0', function (w) { return [A(w / 2, 5, (w - 1.6) / 2, 5, 0, 360)]; });
  d('1', function (w) { return [L(w * 0.2, 7.9, w * 0.55, 10, w * 0.55, 0)]; });
  d('2', function (w) {
    var cx = w / 2, rx = (w - 1.8) / 2;
    var arc = A(cx, 7.3, rx, 2.7, 168, -38);
    return [J(arc, L(0.8, 0, w - 0.8, 0))];
  });
  d('3', function (w) {
    var cx = w / 2 - 0.1, rx = (w - 1.8) / 2;
    return [J(A(cx, 7.5, rx * 0.93, 2.5, 152, -90), A(cx, 2.5, rx, 2.5, 90, -152))];
  });
  d('4', function (w) {
    var x = w * 0.7;
    return [L(x, 0, x, 10, 0.5, 3.1, w - 0.4, 3.1)];
  });
  d('5', function (w) {
    var cx = w / 2, rx = (w - 1.8) / 2;
    return [J(L(w - 0.9, 10, 1.1, 10, 0.9, 5.5), A(cx, 3.4, rx, 3.4, 138, -150))];
  });
  d('6', function (w) {
    var cx = w / 2, rx = (w - 1.8) / 2, l = cx - rx, r = cx + rx;
    return [A(cx, 3.3, rx, 3.3, 0, 360),
      L(l, 3.3, l + 0.1, 6.3, l + 1.0, 8.6, cx + 0.7, 9.9, r - 0.2, 9.4)];
  });
  d('7', function (w) { return [L(0.7, 10, w - 0.7, 10, w * 0.38, 0)]; });
  d('8', function (w) {
    var cx = w / 2, rx = (w - 1.8) / 2;
    return [A(cx, 7.55, rx * 0.86, 2.45, 0, 360), A(cx, 2.6, rx, 2.6, 0, 360)];
  });
  d('9', function (w) {
    return putar180(GLYPH['6'](w), w);
  });

  // ---- tanda baca dan simbol
  d(' ', function () { return []; });
  d(' ', function () { return []; });
  d('.', function (w) { return [titik(w / 2, 0.45)]; });
  d(',', function (w) { return [L(w / 2 + 0.1, 0.6, w / 2 - 0.6, -2.0)]; });
  d(':', function (w) { return [titik(w / 2, 0.45), titik(w / 2, 5.2)]; });
  d(';', function (w) { return [L(w / 2 + 0.1, 0.6, w / 2 - 0.6, -2.0), titik(w / 2, 5.2)]; });
  d('!', function (w) { return [L(w / 2, 10, w / 2, 3.2), titik(w / 2, 0.45)]; });
  d('?', function (w) {
    var cx = w / 2, rx = (w - 1.8) / 2;
    return [J(A(cx, 7.4, rx, 2.6, 165, -35), L(cx, 4.6, cx, 3.2)), titik(cx, 0.45)];
  });
  d('-', function (w) { return [L(0.9, 3.7, w - 0.9, 3.7)]; });
  d('–', function (w) { return [L(0.2, 3.7, w - 0.2, 3.7)]; });
  d('−', function (w) { return [L(0.9, 4.6, w - 0.9, 4.6)]; });
  d('—', function (w) { return [L(0.2, 3.7, w - 0.2, 3.7)]; });
  d('+', function (w) {
    var l = 1.0, r = w - 1.0, c = w / 2, h = (r - l) / 2;
    return [L(l, 4.6, r, 4.6), L(c, 4.6 - h, c, 4.6 + h)];
  });
  d('=', function (w) { return [L(1.0, 3.4, w - 1.0, 3.4), L(1.0, 5.9, w - 1.0, 5.9)]; });
  d('×', function (w) {
    var c = w / 2, h = (w - 2.4) / 2;
    return [L(c - h, 4.6 - h, c + h, 4.6 + h), L(c - h, 4.6 + h, c + h, 4.6 - h)];
  });
  d('÷', function (w) {
    return [L(1.0, 4.6, w - 1.0, 4.6), titik(w / 2, 7.0), titik(w / 2, 2.2)];
  });
  d('<', function (w) { return [L(w - 1.2, 7.6, 1.2, 4.6, w - 1.2, 1.6)]; });
  d('>', function (w) { return [L(1.2, 7.6, w - 1.2, 4.6, 1.2, 1.6)]; });
  d('%', function (w) {
    return [A(2.6, 7.9, 1.7, 2.0, 0, 360), A(w - 2.6, 2.1, 1.7, 2.0, 0, 360), L(w - 1.0, 10, 1.0, 0)];
  });
  d('$', function (w) {
    var cx = w / 2, rx = (w - 1.8) / 2;
    return [J(A(cx, 7.4, rx, 2.3, 28, 270), A(cx, 2.8, rx, 2.4, 90, -152)), L(cx, 10.9, cx, -0.9)];
  });
  d('£', function (w) {
    var r = w - 0.8, l = 0.8, a = 2.4;
    return [J(J(A(l + 1.9 + a, 7.6, a, 2.4, 20, 180), L(l + 1.9, 7.6, l + 1.9, 1.8)), L(l + 0.2, 0, r, 0)),
      L(l + 0.6, 4.4, r - 1.2, 4.4)];
  });
  d('€', function (w) {
    var cx = w / 2 + 0.3, rx = (w - 1.9) / 2;
    return [A(cx, 5, rx, 5, 45, 315), L(0.2, 6.4, cx + 0.2, 6.4), L(0.2, 3.6, cx + 0.2, 3.6)];
  });
  d('(', function (w) {
    var l = 1.0, r = w - 0.8;
    return [L(r, 10.6, l + 1.0, 7.4, l + 0.2, 3.6, l + 1.0, -0.2, r, -3.4)];
  });
  d(')', function (w) { return cerminX(GLYPH['('](w), w); });
  d('[', function (w) { return [L(w - 1.0, 10.6, 1.2, 10.6, 1.2, -3, w - 1.0, -3)]; });
  d(']', function (w) { return cerminX(GLYPH['['](w), w); });
  d('{', function (w) {
    var c = w / 2;
    return [L(w - 0.8, 10.6, c + 0.4, 10.2, c + 0.4, 6.2, 0.8, 3.8, c + 0.4, 1.4, c + 0.4, -2.6, w - 0.8, -3)];
  });
  d('}', function (w) { return cerminX(GLYPH['{'](w), w); });
  d('/', function (w) { return [L(0.2, -0.6, w - 0.2, 10.4)]; });
  d('\\', function (w) { return [L(0.2, 10.4, w - 0.2, -0.6)]; });
  d('|', function (w) { return [L(w / 2, -2.8, w / 2, 10.6)]; });
  d('_', function (w) { return [L(0, -1.8, w, -1.8)]; });
  d('\'', function (w) { return [L(w / 2, 10, w / 2, 7.6)]; });
  d('"', function (w) { return [L(w * 0.34, 10, w * 0.34, 7.6), L(w * 0.66, 10, w * 0.66, 7.6)]; });
  d('’', function (w) { return [L(w / 2 + 0.3, 10, w / 2 - 0.3, 7.8)]; });
  d('‘', function (w) { return [L(w / 2 - 0.3, 10, w / 2 + 0.3, 7.8)]; });
  d('“', function (w) { return GLYPH['"'](w); });
  d('”', function (w) { return GLYPH['"'](w); });
  d('`', function (w) { return [L(w * 0.35, 10, w * 0.62, 8.2)]; });
  d('^', function (w) { return [L(1.0, 4.6, w / 2, 9.6, w - 1.0, 4.6)]; });
  d('~', function (w) {
    return [L(0.8, 4.0, 1.9, 5.3, 3.3, 5.3, 4.6, 4.2, 6.0, 4.2, w - 0.8, 5.4)];
  });
  d('#', function (w) {
    return [L(w * 0.36, 0.5, w * 0.46, 9.5), L(w * 0.66, 0.5, w * 0.76, 9.5),
      L(0.6, 3.4, w - 0.6, 3.4), L(0.8, 6.6, w - 0.8, 6.6)];
  });
  d('*', function (w) {
    var c = w / 2, y = 7.8, h = 1.9;
    return [L(c, y + h, c, y - h), L(c - h * 0.87, y + h * 0.5, c + h * 0.87, y - h * 0.5),
      L(c - h * 0.87, y - h * 0.5, c + h * 0.87, y + h * 0.5)];
  });
  d('&', function (w) {
    return [J(J(L(w - 0.5, 0, 1.4, 6.0), A(2.9, 8.2, 1.9, 1.9, 200, -30)), L(1.8, 3.8)),
      J(A(2.7, 2.2, 2.2, 2.2, 140, 360), L(w - 0.9, 3.4))];
  });
  d('@', function (w) {
    var cx = w / 2;
    return [A(cx, 3.8, (w - 1.0) / 2, 5.4, 0, 340), A(cx + 0.3, 3.8, 1.7, 1.9, 0, 360),
      L(cx + 2.0, 5.7, cx + 2.0, 2.2, w - 1.0, 2.8)];
  });
  d('°', function (w) { return [A(w / 2, 8.2, 1.5, 1.6, 0, 360)]; });
  d('·', function (w) { return [titik(w / 2, 4.6)]; });
  d('•', function (w) { return [A(w / 2, 4.6, 1.2, 1.2, 0, 360), titik(w / 2, 4.6)]; });
  d('…', function (w) { return [titik(2.0, 0.45), titik(w / 2, 0.45), titik(w - 2.0, 0.45)]; });
  d('±', function (w) {
    var c = w / 2, h = (w - 2.4) / 2;
    return [L(1.0, 3.0, w - 1.0, 3.0), L(1.0, 6.0, w - 1.0, 6.0), L(c, 6.0, c, 6.0 + h)];
  });
  d('≈', function (w) {
    return [L(0.9, 3.0, 2.0, 4.2, 3.4, 4.2, 4.8, 3.0, 6.2, 3.0, w - 0.9, 4.2),
      L(0.9, 5.8, 2.0, 7.0, 3.4, 7.0, 4.8, 5.8, 6.2, 5.8, w - 0.9, 7.0)];
  });
  d('≤', function (w) {
    return [L(w - 1.2, 8.2, 1.2, 5.6, w - 1.2, 3.0), L(1.2, 1.4, w - 1.2, 1.4)];
  });
  d('≥', function (w) {
    return [L(1.2, 8.2, w - 1.2, 5.6, 1.2, 3.0), L(1.2, 1.4, w - 1.2, 1.4)];
  });
  d('≠', function (w) {
    return [L(1.0, 3.4, w - 1.0, 3.4), L(1.0, 5.9, w - 1.0, 5.9), L(w * 0.7, 8.0, w * 0.3, 1.4)];
  });
  d('→', function (w) {
    return [L(0.6, 4.6, w - 0.6, 4.6), L(w - 3.2, 7.4, w - 0.6, 4.6, w - 3.2, 1.8)];
  });
  d('¹', function (w) { return skalaGeser(GLYPH['1'](w / 0.55), 0.55, 0.2, 5.0); });
  d('²', function (w) { return skalaGeser(GLYPH['2'](w / 0.55), 0.55, 0.2, 5.0); });
  d('³', function (w) { return skalaGeser(GLYPH['3'](w / 0.55), 0.55, 0.2, 5.0); });
  d('½', function (w) {
    return skalaGeser(GLYPH['1'](w * 0.5), 0.5, 0.2, 5.3)
      .concat([L(w * 0.2, 0.2, w * 0.7, 9.8)])
      .concat(skalaGeser(GLYPH['2'](w * 0.55), 0.5, w * 0.5, -0.3));
  });
  d('é', function (w) {
    return GLYPH.e(w).concat([L(w * 0.4, 9.6, w * 0.65, 8.2)]);
  });

  // ------------------------------------------------------------------ API

  var CACHE = {};

  /** Goresan satu huruf (satuan font) untuk lebar maju `w` satuan; null bila tak dikenal. */
  function goresan(c, tebal) {
    var kunci = (tebal ? 'b' : 'r') + c;
    if (CACHE[kunci]) return CACHE[kunci];
    var w = Metrik.lebarHuruf(c, tebal) * SATUAN / 1000;
    var fn = GLYPH[c];
    var s;
    if (fn) s = fn(w);
    else s = [L(0.8, 0, 0.8, 10, w - 0.8, 10, w - 0.8, 0, 0.8, 0)];      // kotak "tak dikenal"
    CACHE[kunci] = { strokes: s, maju: w };
    return CACHE[kunci];
  }

  /**
   * Susun teks menjadi goresan pada koordinat layar.
   * @param {string} teks
   * @param {number} x      titik awal (atau tengah/akhir menurut `rata`)
   * @param {number} y      garis dasar
   * @param {number} ukuran font-size dalam piksel
   * @param {boolean} tebal
   * @param {string} rata   'start' | 'middle' | 'end'
   * @returns {{garis:Array, lebar:number, tebalGaris:number}}
   */
  function garisTeks(teks, x, y, ukuran, tebal, rata) {
    var s = ukuran / SATUAN;
    var lebar = Metrik.lebar(teks, ukuran, tebal);
    var x0 = x;
    if (rata === 'middle') x0 = x - lebar / 2;
    else if (rata === 'end') x0 = x - lebar;
    var out = [], kursor = 0;
    String(teks == null ? '' : teks).split('').forEach(function (c) {
      var g = goresan(c, tebal);
      g.strokes.forEach(function (st) {
        out.push(st.map(function (p) { return [x0 + kursor + p[0] * s, y - p[1] * s]; }));
      });
      kursor += g.maju * s;
    });
    return { garis: out, lebar: lebar, tebalGaris: ukuran * (tebal ? 0.108 : 0.076) };
  }

  return { SATUAN: SATUAN, garisTeks: garisTeks, goresan: goresan, ADA: GLYPH };
});
