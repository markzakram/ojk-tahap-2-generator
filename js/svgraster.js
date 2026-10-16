/*
 * svgraster.js — penggambar piksel perangkat lunak untuk SVG buatan generator ini.
 *
 * Di peramban, `raster.js` memakai kanvas bawaan. Di Node tidak ada kanvas, dan
 * generator wajib jalan tanpa instalasi apa pun, jadi berkas ini membaca
 * himpunan SVG yang memang dipakai generator — rect, line, polyline, polygon,
 * circle, ellipse, path (M L H V A C Q Z), text, dan g dengan transform — lalu
 * menggambarnya sendiri dengan anti-aliasing.
 *
 * Cara kerja:
 *   - Bentuk diratakan menjadi poligon pada koordinat piksel.
 *   - Isi: pengisian scanline aturan "nonzero" dengan SS sub-garis per baris dan
 *     liputan horizontal yang eksak, jadi tepi miring halus tanpa pustaka.
 *   - Garis tepi dibangun menjadi poligon (persegi panjang per ruas + sambungan
 *     miter/bulat + ujung) yang SEMUANYA berorientasi sama lalu diisi sekali
 *     dengan aturan nonzero — gabungannya eksak, tanpa celah di sambungan.
 *   - Teks digambar dari goresan `font.js` dengan lebar maju yang sama dengan
 *     Helvetica, jadi tata letaknya sama dengan di peramban.
 *
 * Latar putih (sama seperti kanvas pada raster.js). Hasilnya RGB, atau satu kanal
 * abu-abu bila gambarnya hitam-putih saja (datanya sepertiga).
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./font.js'));
    module.exports = api;
  } else {
    api = factory(root.Font);
    root.SvgRaster = api;
  }
})(typeof self !== 'undefined' ? self : this, function (Font) {
  'use strict';

  var SS = 5;             // sub-garis per baris piksel

  // ------------------------------------------------------------------ warna

  var NAMA = {
    white: [255, 255, 255], black: [0, 0, 0], red: [255, 0, 0], green: [0, 128, 0],
    blue: [0, 0, 255], gray: [128, 128, 128], grey: [128, 128, 128], orange: [255, 165, 0],
    yellow: [255, 255, 0], silver: [192, 192, 192], navy: [0, 0, 128]
  };

  function warna(s) {
    if (s == null) return undefined;
    s = String(s).trim().toLowerCase();
    if (s === '' || s === 'none' || s === 'transparent') return null;
    if (NAMA[s]) return NAMA[s];
    var m;
    if ((m = /^#([0-9a-f]{6})$/.exec(s))) {
      return [parseInt(m[1].slice(0, 2), 16), parseInt(m[1].slice(2, 4), 16), parseInt(m[1].slice(4, 6), 16)];
    }
    if ((m = /^#([0-9a-f]{3})$/.exec(s))) {
      return [parseInt(m[1][0] + m[1][0], 16), parseInt(m[1][1] + m[1][1], 16), parseInt(m[1][2] + m[1][2], 16)];
    }
    if ((m = /^rgb\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)\s*\)$/.exec(s))) return [+m[1], +m[2], +m[3]];
    return null;
  }

  // -------------------------------------------------------------- pengurai XML

  var ENTITAS = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
  function bukaEntitas(s) {
    return s.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-z]+);/g, function (_, e) {
      if (e.charAt(0) === '#') {
        var k = e.charAt(1) === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        return String.fromCharCode(k);
      }
      return ENTITAS[e] !== undefined ? ENTITAS[e] : '&' + e + ';';
    });
  }

  /** Urai SVG menjadi pohon { tag, attr, anak, teks }. */
  function urai(svg) {
    var akar = { tag: '#akar', attr: {}, anak: [], teks: '' };
    var tumpuk = [akar];
    var re = /<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<(\/?)([A-Za-z][\w:-]*)((?:\s+[\w:-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>|([^<]+)/g;
    var m;
    while ((m = re.exec(svg))) {
      var atas = tumpuk[tumpuk.length - 1];
      if (m[5] !== undefined) { atas.teks += bukaEntitas(m[5]); continue; }
      if (m[2] === undefined) continue;                    // komentar / instruksi
      if (m[1] === '/') {
        if (tumpuk.length > 1) tumpuk.pop();
        continue;
      }
      var attr = {}, ra = /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g, a;
      while ((a = ra.exec(m[3]))) attr[a[1]] = bukaEntitas(a[2] !== undefined ? a[2] : a[3]);
      var simpul = { tag: m[2], attr: attr, anak: [], teks: '' };
      atas.anak.push(simpul);
      if (m[4] !== '/') tumpuk.push(simpul);
    }
    return akar;
  }

  // ------------------------------------------------------------------ matriks

  function kaliM(a, b) {      // a x b: terapkan b dulu, baru a
    return [
      a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1],
      a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3],
      a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5]
    ];
  }

  function uraiTransform(s) {
    var m = [1, 0, 0, 1, 0, 0];
    if (!s) return m;
    var re = /(translate|scale|rotate|matrix)\s*\(([^)]*)\)/g, t;
    while ((t = re.exec(s))) {
      var n = t[2].split(/[\s,]+/).filter(function (x) { return x !== ''; }).map(parseFloat);
      var l;
      if (t[1] === 'translate') l = [1, 0, 0, 1, n[0] || 0, n[1] || 0];
      else if (t[1] === 'scale') l = [n[0], 0, 0, n.length > 1 ? n[1] : n[0], 0, 0];
      else if (t[1] === 'matrix') l = n.slice(0, 6);
      else {
        var a = (n[0] || 0) * Math.PI / 180, c = Math.cos(a), si = Math.sin(a);
        l = [c, si, -si, c, 0, 0];
        if (n.length >= 3) {
          l = kaliM(kaliM([1, 0, 0, 1, n[1], n[2]], l), [1, 0, 0, 1, -n[1], -n[2]]);
        }
      }
      m = kaliM(m, l);
    }
    return m;
  }

  function terap(m, p) { return [m[0] * p[0] + m[2] * p[1] + m[4], m[1] * p[0] + m[3] * p[1] + m[5]]; }
  function skalaM(m) { return Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2])) || 1; }

  // ---------------------------------------------------------- bentuk -> titik

  function lingkaranTitik(cx, cy, rx, ry, jml) {
    var out = [];
    for (var i = 0; i < jml; i++) {
      var a = 2 * Math.PI * i / jml;
      out.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
    }
    return out;
  }

  /** Jumlah segmen untuk busur sepanjang `r` piksel: cukup halus untuk mata. */
  function segmenUntuk(rPiksel, sudutRad) {
    var n = Math.ceil(Math.abs(sudutRad) * Math.max(rPiksel, 1) / 1.6);
    return Math.max(6, Math.min(300, n));
  }

  /** Busur SVG (parameter titik akhir) menjadi titik-titik, sesuai lampiran F.6.5 spesifikasi. */
  function busurSvg(x1, y1, rx, ry, phiDeg, besar, sapu, x2, y2, skala) {
    var out = [];
    if (rx === 0 || ry === 0 || (x1 === x2 && y1 === y2)) return [[x2, y2]];
    rx = Math.abs(rx); ry = Math.abs(ry);
    var phi = phiDeg * Math.PI / 180, cp = Math.cos(phi), sp = Math.sin(phi);
    var dx = (x1 - x2) / 2, dy = (y1 - y2) / 2;
    var x1p = cp * dx + sp * dy, y1p = -sp * dx + cp * dy;
    var lam = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
    if (lam > 1) { var k = Math.sqrt(lam); rx *= k; ry *= k; }
    var pembilang = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
    var penyebut = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
    var koef = Math.sqrt(Math.max(0, pembilang / penyebut));
    if (besar === sapu) koef = -koef;
    var cxp = koef * rx * y1p / ry, cyp = -koef * ry * x1p / rx;
    var cx = cp * cxp - sp * cyp + (x1 + x2) / 2;
    var cy = sp * cxp + cp * cyp + (y1 + y2) / 2;
    function sudut(ux, uy, vx, vy) {
      var a = Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
      return a;
    }
    var th1 = sudut(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
    var dth = sudut((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
    if (!sapu && dth > 0) dth -= 2 * Math.PI;
    else if (sapu && dth < 0) dth += 2 * Math.PI;
    var n = segmenUntuk(Math.max(rx, ry) * (skala || 1), dth);
    for (var i = 1; i <= n; i++) {
      var t = th1 + dth * i / n;
      var ex = rx * Math.cos(t), ey = ry * Math.sin(t);
      out.push([cp * ex - sp * ey + cx, sp * ex + cp * ey + cy]);
    }
    return out;
  }

  /** Ratakan atribut `d` sebuah path menjadi daftar { pts, tutup } pada koordinat pengguna. */
  function ratakanPath(d, skala) {
    var tok = [], re = /([MmLlHhVvAaZzCcQqSsTt])|(-?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?)/g, m;
    while ((m = re.exec(d))) tok.push(m[1] !== undefined ? m[1] : parseFloat(m[2]));
    var sub = [], kini = null, i = 0, cmd = '', x = 0, y = 0, awalX = 0, awalY = 0;
    var cpx = 0, cpy = 0;
    function mulai(px, py) {
      kini = { pts: [[px, py]], tutup: false };
      sub.push(kini);
      awalX = px; awalY = py;
    }
    function angka() { return tok[i++]; }
    while (i < tok.length) {
      if (typeof tok[i] === 'string') cmd = tok[i++];
      else if (cmd === 'M') cmd = 'L'; else if (cmd === 'm') cmd = 'l';
      var rel = cmd === cmd.toLowerCase(), C = cmd.toUpperCase();
      if (C === 'Z') {
        if (kini) { kini.tutup = true; x = awalX; y = awalY; }
        continue;
      }
      if (C === 'M') {
        var mx = angka(), my = angka();
        if (rel) { mx += x; my += y; }
        mulai(mx, my); x = mx; y = my;
      } else if (C === 'L') {
        var lx = angka(), ly = angka();
        if (rel) { lx += x; ly += y; }
        if (!kini) mulai(x, y);
        kini.pts.push([lx, ly]); x = lx; y = ly;
      } else if (C === 'H') {
        var hx = angka(); if (rel) hx += x;
        if (!kini) mulai(x, y);
        kini.pts.push([hx, y]); x = hx;
      } else if (C === 'V') {
        var vy = angka(); if (rel) vy += y;
        if (!kini) mulai(x, y);
        kini.pts.push([x, vy]); y = vy;
      } else if (C === 'A') {
        var rx = angka(), ry = angka(), rot = angka(), fb = angka(), fs = angka(), ax = angka(), ay = angka();
        if (rel) { ax += x; ay += y; }
        if (!kini) mulai(x, y);
        busurSvg(x, y, rx, ry, rot, !!fb, !!fs, ax, ay, skala).forEach(function (p) { kini.pts.push(p); });
        x = ax; y = ay;
      } else if (C === 'C') {
        var c1x = angka(), c1y = angka(), c2x = angka(), c2y = angka(), ex = angka(), ey = angka();
        if (rel) { c1x += x; c1y += y; c2x += x; c2y += y; ex += x; ey += y; }
        if (!kini) mulai(x, y);
        for (var s = 1; s <= 16; s++) {
          var t = s / 16, u = 1 - t;
          kini.pts.push([
            u * u * u * x + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * ex,
            u * u * u * y + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * ey]);
        }
        cpx = c2x; cpy = c2y; x = ex; y = ey;
      } else if (C === 'Q') {
        var qx = angka(), qy = angka(), qex = angka(), qey = angka();
        if (rel) { qx += x; qy += y; qex += x; qey += y; }
        if (!kini) mulai(x, y);
        for (var s2 = 1; s2 <= 12; s2++) {
          var t2 = s2 / 12, u2 = 1 - t2;
          kini.pts.push([u2 * u2 * x + 2 * u2 * t2 * qx + t2 * t2 * qex, u2 * u2 * y + 2 * u2 * t2 * qy + t2 * t2 * qey]);
        }
        x = qex; y = qey;
      } else {
        i = tok.length;            // perintah yang tidak didukung: berhenti dengan aman
      }
    }
    return sub;
  }

  function persegiBulat(x, y, w, h, rx, ry, skala) {
    rx = Math.min(rx, w / 2); ry = Math.min(ry, h / 2);
    if (rx <= 0 || ry <= 0) return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
    var n = segmenUntuk(Math.max(rx, ry) * skala, Math.PI / 2);
    var pts = [], sudut = [[x + w - rx, y + ry, -90], [x + w - rx, y + h - ry, 0], [x + rx, y + h - ry, 90], [x + rx, y + ry, 180]];
    sudut.forEach(function (c) {
      for (var i = 0; i <= n; i++) {
        var a = (c[2] + 90 * i / n) * Math.PI / 180;
        pts.push([c[0] + rx * Math.cos(a), c[1] + ry * Math.sin(a)]);
      }
    });
    return pts;
  }

  // ------------------------------------------------------------- garis tepi

  function luas(poli) {
    var a = 0;
    for (var i = 0, j = poli.length - 1; i < poli.length; j = i++) {
      a += (poli[j][0] * poli[i][1]) - (poli[i][0] * poli[j][1]);
    }
    return a / 2;
  }

  function tegakkan(poli) {           // semua poligon berorientasi sama (luas positif)
    if (luas(poli) < 0) poli.reverse();
    return poli;
  }

  function bulatan(cx, cy, r) {
    var n = Math.max(8, Math.min(48, Math.ceil(Math.PI * r / 0.9)));
    return tegakkan(lingkaranTitik(cx, cy, r, r, n));
  }

  /**
   * Poligon-poligon garis tepi untuk satu goresan (garis patah).
   * @param {Array} pts titik pada piksel
   * @param {boolean} tutup
   * @param {number} hw setengah tebal garis (piksel)
   * @param {string} ujung 'butt' | 'round' | 'square'
   * @param {string} sambung 'miter' | 'round' | 'bevel'
   */
  function garisTepi(pts, tutup, hw, ujung, sambung) {
    var out = [];
    // buang titik yang berhimpit
    var p = [];
    for (var i = 0; i < pts.length; i++) {
      if (!p.length || Math.abs(pts[i][0] - p[p.length - 1][0]) > 1e-9 || Math.abs(pts[i][1] - p[p.length - 1][1]) > 1e-9) p.push(pts[i]);
    }
    if (tutup && p.length > 1 && Math.abs(p[0][0] - p[p.length - 1][0]) < 1e-9 && Math.abs(p[0][1] - p[p.length - 1][1]) < 1e-9) p.pop();
    if (!p.length) return out;
    if (p.length === 1) {
      if (ujung === 'round') out.push(bulatan(p[0][0], p[0][1], hw));
      return out;
    }
    var n = p.length, ruas = tutup ? n : n - 1, arah = [], k;
    for (k = 0; k < ruas; k++) {
      var a = p[k], b = p[(k + 1) % n];
      var dx = b[0] - a[0], dy = b[1] - a[1], pj = Math.hypot(dx, dy);
      arah.push([dx / pj, dy / pj]);
    }
    for (k = 0; k < ruas; k++) {
      var s0 = p[k], s1 = p[(k + 1) % n], u = arah[k], nx = -u[1] * hw, ny = u[0] * hw;
      var a0 = s0, a1 = s1;
      if (!tutup && ujung === 'square') {
        if (k === 0) a0 = [s0[0] - u[0] * hw, s0[1] - u[1] * hw];
        if (k === ruas - 1) a1 = [s1[0] + u[0] * hw, s1[1] + u[1] * hw];
      }
      out.push(tegakkan([[a0[0] + nx, a0[1] + ny], [a1[0] + nx, a1[1] + ny], [a1[0] - nx, a1[1] - ny], [a0[0] - nx, a0[1] - ny]]));
    }
    // sambungan
    var awal = tutup ? 0 : 1, akhir = tutup ? n : n - 1;
    for (k = awal; k < akhir; k++) {
      var v = p[k], u0 = arah[(k - 1 + ruas) % ruas], u1 = arah[k % ruas];
      var cross = u0[0] * u1[1] - u0[1] * u1[0], dot = u0[0] * u1[0] + u0[1] * u1[1];
      if (Math.abs(cross) < 1e-7 && dot > 0) continue;
      if (sambung === 'round') { out.push(bulatan(v[0], v[1], hw)); continue; }
      var sg = cross > 0 ? -1 : 1;
      var n0 = [-u0[1] * sg * hw, u0[0] * sg * hw], n1 = [-u1[1] * sg * hw, u1[0] * sg * hw];
      var pa = [v[0] + n0[0], v[1] + n0[1]], pb = [v[0] + n1[0], v[1] + n1[1]];
      var nn = (n0[0] * n1[0] + n0[1] * n1[1]) / (hw * hw);
      var rasio = Math.sqrt(2 / Math.max(1e-9, 1 + nn));
      if (sambung === 'miter' && rasio <= 4 && 1 + nn > 1e-6) {
        var f = 1 / (1 + nn);
        out.push(tegakkan([[v[0], v[1]], pa, [v[0] + (n0[0] + n1[0]) * f, v[1] + (n0[1] + n1[1]) * f], pb]));
      } else {
        out.push(tegakkan([[v[0], v[1]], pa, pb]));
      }
    }
    if (!tutup && ujung === 'round') {
      out.push(bulatan(p[0][0], p[0][1], hw));
      out.push(bulatan(p[n - 1][0], p[n - 1][1], hw));
    }
    return out;
  }

  /** Pecah garis patah menurut pola putus-putus (piksel). Kembalikan daftar garis patah terbuka. */
  function putusPutus(pts, tutup, pola, geser) {
    var daftar = tutup ? pts.concat([pts[0]]) : pts;
    var jml = pola.reduce(function (a, b) { return a + b; }, 0);
    if (!(jml > 0)) return [daftar];
    var out = [], idx = 0, sisa = pola[0], nyala = true;
    geser = ((geser || 0) % jml + jml) % jml;
    while (geser > 0) {
      if (geser >= sisa) { geser -= sisa; idx = (idx + 1) % pola.length; sisa = pola[idx]; nyala = !nyala; }
      else { sisa -= geser; geser = 0; }
    }
    var kini = nyala ? [daftar[0]] : null;
    for (var i = 0; i + 1 < daftar.length; i++) {
      var a = daftar[i], b = daftar[i + 1], pj = Math.hypot(b[0] - a[0], b[1] - a[1]), pos = 0;
      if (pj === 0) continue;
      while (pj - pos > sisa + 1e-9) {
        pos += sisa;
        var q = [a[0] + (b[0] - a[0]) * pos / pj, a[1] + (b[1] - a[1]) * pos / pj];
        if (nyala) { kini.push(q); out.push(kini); kini = null; }
        else kini = [q];
        nyala = !nyala;
        idx = (idx + 1) % pola.length; sisa = pola[idx];
        if (!(sisa > 0)) sisa = 1e-6;
      }
      sisa -= (pj - pos);
      if (nyala) kini.push(b);
    }
    if (nyala && kini && kini.length > 1) out.push(kini);
    return out;
  }

  // ------------------------------------------------------------------ pengisi

  function Kanvas(w, h) {
    this.w = w; this.h = h;
    this.px = new Uint8Array(w * h * 3);
    this.px.fill(255);
    this.cov = new Float32Array(w + 3);
    this.run = new Float32Array(w + 3);
  }

  /**
   * Isi sekumpulan poligon (aturan nonzero) dengan satu warna.
   * @param {Kanvas} kv
   * @param {Array} poligon daftar poligon; tiap poligon daftar titik [x, y]
   */
  Kanvas.prototype.isi = function (poligon, rgb, alpha) {
    if (!rgb || !(alpha > 0)) return;
    var W = this.w, H = this.h, px = this.px, cov = this.cov, run = this.run;
    var ex0 = [], ey0 = [], ex1 = [], ey1 = [], emiring = [], earah = [];
    var minY = Infinity, maxY = -Infinity, p, q, i, j;
    for (i = 0; i < poligon.length; i++) {
      var po = poligon[i], n = po.length;
      if (n < 3) continue;
      for (j = 0; j < n; j++) {
        p = po[j]; q = po[(j + 1) % n];
        if (p[1] === q[1]) continue;
        var arah = 1;
        if (p[1] > q[1]) { var t = p; p = q; q = t; arah = -1; }
        ex0.push(p[0]); ey0.push(p[1]); ex1.push(q[0]); ey1.push(q[1]);
        emiring.push((q[0] - p[0]) / (q[1] - p[1])); earah.push(arah);
        if (p[1] < minY) minY = p[1];
        if (q[1] > maxY) maxY = q[1];
      }
    }
    var m = ex0.length;
    if (!m) return;
    var y0 = Math.max(0, Math.floor(minY)), y1 = Math.min(H - 1, Math.ceil(maxY));
    if (y1 < y0) return;
    var urut = new Array(m);
    for (i = 0; i < m; i++) urut[i] = i;
    urut.sort(function (a, b) { return ey0[a] - ey0[b]; });

    var aktif = [], berikut = 0, xs = [], ds = [], w1 = 1 / SS;
    var r = rgb[0], g = rgb[1], b = rgb[2];
    for (var y = y0; y <= y1; y++) {
      var minX = W + 1, maxX = -1;
      for (var s = 0; s < SS; s++) {
        var yy = y + (s + 0.5) / SS;
        while (berikut < m && ey0[urut[berikut]] <= yy) aktif.push(urut[berikut++]);
        var c = 0;
        for (var k = aktif.length - 1; k >= 0; k--) {
          var e = aktif[k];
          if (ey1[e] <= yy) { aktif[k] = aktif[aktif.length - 1]; aktif.pop(); continue; }
          var x = ex0[e] + (yy - ey0[e]) * emiring[e], d = earah[e], z = c++;
          while (z > 0 && xs[z - 1] > x) { xs[z] = xs[z - 1]; ds[z] = ds[z - 1]; z--; }
          xs[z] = x; ds[z] = d;
        }
        var lilit = 0, mulaiX = 0;
        for (var ci = 0; ci < c; ci++) {
          var sebelum = lilit;
          lilit += ds[ci];
          if (sebelum === 0 && lilit !== 0) mulaiX = xs[ci];
          else if (sebelum !== 0 && lilit === 0) {
            var xa = mulaiX < 0 ? 0 : mulaiX, xb = xs[ci] > W ? W : xs[ci];
            if (xb <= xa) continue;
            var ia = Math.floor(xa), ib = Math.floor(xb);
            if (ia < minX) minX = ia;
            if (ib > maxX) maxX = ib;
            if (ia === ib) cov[ia] += (xb - xa) * w1;
            else {
              cov[ia] += (ia + 1 - xa) * w1;
              run[ia + 1] += w1; run[ib] -= w1;
              cov[ib] += (xb - ib) * w1;
            }
          }
        }
      }
      if (maxX >= 0) {
        var acc = 0, base = y * W;
        var xe = maxX > W - 1 ? W - 1 : maxX;
        for (var xi = minX; xi <= maxX + 1; xi++) {
          acc += run[xi];
          if (xi > xe) { cov[xi] = 0; run[xi] = 0; continue; }
          var cv = cov[xi] + acc;
          cov[xi] = 0; run[xi] = 0;
          if (cv > 0.003) {
            var a = (cv > 1 ? 1 : cv) * alpha, o = (base + xi) * 3;
            if (a >= 0.999) { px[o] = r; px[o + 1] = g; px[o + 2] = b; }
            else {
              px[o] = (px[o] + (r - px[o]) * a + 0.5) | 0;
              px[o + 1] = (px[o + 1] + (g - px[o + 1]) * a + 0.5) | 0;
              px[o + 2] = (px[o + 2] + (b - px[o + 2]) * a + 0.5) | 0;
            }
          }
        }
        cov[W + 1] = 0; run[W + 1] = 0; cov[W + 2] = 0; run[W + 2] = 0;
      }
    }
  };

  // ------------------------------------------------------------- penjelajah

  var WARISAN = {
    fill: '#000000', stroke: 'none', 'stroke-width': '1', 'stroke-linecap': 'butt',
    'stroke-linejoin': 'miter', 'stroke-dasharray': 'none', 'stroke-dashoffset': '0',
    'font-size': '16', 'font-weight': 'normal', 'text-anchor': 'start',
    'fill-opacity': '1', 'stroke-opacity': '1'
  };

  function angkaAttr(v, awal) {
    var n = parseFloat(v);
    return isFinite(n) ? n : awal;
  }

  /**
   * Gambar SVG ke kanvas piksel.
   * @param {string} svg
   * @param {number} [skala] pembesaran terhadap ukuran SVG (baku 2)
   * @returns {{lebar:number, tinggi:number, data:Uint8Array, kanal:1|3}}
   */
  function gambar(svg, skala) {
    skala = skala || 2;
    var akar = urai(svg), el = null;
    for (var i = 0; i < akar.anak.length; i++) if (akar.anak[i].tag === 'svg') { el = akar.anak[i]; break; }
    if (!el) throw new Error('bukan dokumen SVG');
    var vb = (el.attr.viewBox || '').split(/[\s,]+/).map(parseFloat);
    var lebarSvg = angkaAttr(el.attr.width, vb.length === 4 ? vb[2] : 300);
    var tinggiSvg = angkaAttr(el.attr.height, vb.length === 4 ? vb[3] : 150);
    var W = Math.max(1, Math.round(lebarSvg * skala)), H = Math.max(1, Math.round(tinggiSvg * skala));
    var kv = new Kanvas(W, H);
    var dasar = [skala, 0, 0, skala, 0, 0];
    if (vb.length === 4 && vb[2] > 0 && vb[3] > 0) {
      dasar = [W / vb[2], 0, 0, H / vb[3], -vb[0] * W / vb[2], -vb[1] * H / vb[3]];
    }

    function gaya(induk, attr) {
      var s = Object.assign({}, induk);
      Object.keys(WARISAN).forEach(function (k) { if (attr[k] !== undefined) s[k] = attr[k]; });
      if (attr.style) {
        attr.style.split(';').forEach(function (pair) {
          var kv2 = pair.split(':');
          if (kv2.length === 2) s[kv2[0].trim()] = kv2[1].trim();
        });
      }
      s._opacity = (induk._opacity === undefined ? 1 : induk._opacity) * (attr.opacity !== undefined ? angkaAttr(attr.opacity, 1) : 1);
      return s;
    }

    function gambarBentuk(sub, s, m) {
      // sub: daftar { pts (koordinat pengguna), tutup }
      var sk = skalaM(m);
      var perluIsi = warna(s.fill), perluGaris = warna(s.stroke);
      var devs = sub.map(function (u) {
        return { pts: u.pts.map(function (p) { return terap(m, p); }), tutup: u.tutup };
      });
      if (perluIsi) {
        var aIsi = angkaAttr(s['fill-opacity'], 1) * s._opacity;
        kv.isi(devs.filter(function (u) { return u.pts.length >= 3; }).map(function (u) { return u.pts; }), perluIsi, aIsi);
      }
      if (perluGaris) {
        var lebarGaris = angkaAttr(s['stroke-width'], 1) * sk;
        if (lebarGaris > 0) {
          var aGaris = angkaAttr(s['stroke-opacity'], 1) * s._opacity;
          var pola = null;
          if (s['stroke-dasharray'] && s['stroke-dasharray'] !== 'none') {
            pola = s['stroke-dasharray'].split(/[\s,]+/).filter(function (x) { return x !== ''; }).map(function (x) { return parseFloat(x) * sk; });
            if (pola.length % 2) pola = pola.concat(pola);
            if (pola.some(function (x) { return !(x >= 0); }) || pola.reduce(function (a, b) { return a + b; }, 0) <= 0) pola = null;
          }
          var polis = [];
          devs.forEach(function (u) {
            var potong = pola ? putusPutus(u.pts, u.tutup, pola, angkaAttr(s['stroke-dashoffset'], 0) * sk) : null;
            if (potong) {
              potong.forEach(function (pt) {
                garisTepi(pt, false, lebarGaris / 2, s['stroke-linecap'], s['stroke-linejoin']).forEach(function (g) { polis.push(g); });
              });
            } else {
              garisTepi(u.pts, u.tutup, lebarGaris / 2, s['stroke-linecap'], s['stroke-linejoin']).forEach(function (g) { polis.push(g); });
            }
          });
          kv.isi(polis, perluGaris, aGaris);
        }
      }
    }

    function gambarTeks(node, s, m) {
      var rgb = warna(s.fill);
      if (!rgb) return;
      var tebal = /^(bold|[6-9]00)$/.test(String(s['font-weight']));
      var ukuran = angkaAttr(s['font-size'], 16);
      var x = angkaAttr(node.attr.x, 0), y = angkaAttr(node.attr.y, 0);
      var isi = node.teks.replace(/\s+/g, ' ').replace(/^ | $/g, '');
      var t = Font.garisTeks(isi, x, y, ukuran, tebal, s['text-anchor']);
      var sk = skalaM(m), polis = [];
      var strokes = t.garis.map(function (st) { return st.map(function (p) { return terap(m, p); }); });
      strokes.forEach(function (st) {
        garisTepi(st, false, t.tebalGaris * sk / 2, 'round', 'round').forEach(function (g) { polis.push(g); });
      });
      kv.isi(polis, rgb, angkaAttr(s['fill-opacity'], 1) * s._opacity);
    }

    function jelajah(node, induk, m) {
      var s = gaya(induk, node.attr);
      var mm = node.attr.transform ? kaliM(m, uraiTransform(node.attr.transform)) : m;
      var a = node.attr, sk = skalaM(mm), k;
      switch (node.tag) {
        case 'g':
        case 'svg':
          node.anak.forEach(function (c) { jelajah(c, s, mm); });
          break;
        case 'rect': {
          var rx = angkaAttr(a.rx, NaN), ry = angkaAttr(a.ry, NaN);
          if (isNaN(rx) && !isNaN(ry)) rx = ry;
          if (isNaN(ry) && !isNaN(rx)) ry = rx;
          if (isNaN(rx)) { rx = 0; ry = 0; }
          var rw = angkaAttr(a.width, 0), rh = angkaAttr(a.height, 0);
          if (rw > 0 && rh > 0) {
            gambarBentuk([{ pts: persegiBulat(angkaAttr(a.x, 0), angkaAttr(a.y, 0), rw, rh, rx, ry, sk), tutup: true }], s, mm);
          }
          break;
        }
        case 'line':
          gambarBentuk([{ pts: [[angkaAttr(a.x1, 0), angkaAttr(a.y1, 0)], [angkaAttr(a.x2, 0), angkaAttr(a.y2, 0)]], tutup: false }],
            Object.assign({}, s, { fill: 'none' }), mm);
          break;
        case 'polyline':
        case 'polygon': {
          var nums = (a.points || '').split(/[\s,]+/).filter(function (x) { return x !== ''; }).map(parseFloat), pts = [];
          for (k = 0; k + 1 < nums.length; k += 2) pts.push([nums[k], nums[k + 1]]);
          if (pts.length) gambarBentuk([{ pts: pts, tutup: node.tag === 'polygon' }], s, mm);
          break;
        }
        case 'circle':
        case 'ellipse': {
          var cr = node.tag === 'circle' ? angkaAttr(a.r, 0) : angkaAttr(a.rx, 0);
          var cr2 = node.tag === 'circle' ? cr : angkaAttr(a.ry, 0);
          if (cr > 0 && cr2 > 0) {
            var n = segmenUntuk(Math.max(cr, cr2) * sk, 2 * Math.PI);
            gambarBentuk([{ pts: lingkaranTitik(angkaAttr(a.cx, 0), angkaAttr(a.cy, 0), cr, cr2, n), tutup: true }], s, mm);
          }
          break;
        }
        case 'path':
          gambarBentuk(ratakanPath(a.d || '', sk), s, mm);
          break;
        case 'text':
          gambarTeks(node, s, mm);
          break;
        default:
          break;                                   // defs, title, desc, dll. diabaikan
      }
    }

    var awal = Object.assign({ _opacity: 1 }, WARISAN);
    jelajah(el, awal, dasar);

    return keKeluaran(kv);
  }

  /** Satu kanal abu-abu bila setiap piksel r = g = b; selain itu tiga kanal RGB. */
  function keKeluaran(kv) {
    var px = kv.px, n = kv.w * kv.h, abu = true, i, j;
    for (i = 0; i < n * 3; i += 3) {
      if (px[i] !== px[i + 1] || px[i + 1] !== px[i + 2]) { abu = false; break; }
    }
    if (abu) {
      var g = new Uint8Array(n);
      for (i = 0, j = 0; j < n; i += 3, j++) g[j] = px[i];
      return { lebar: kv.w, tinggi: kv.h, data: g, kanal: 1 };
    }
    return { lebar: kv.w, tinggi: kv.h, data: px, kanal: 3 };
  }

  return { gambar: gambar, urai: urai, warna: warna, SS: SS };
});
