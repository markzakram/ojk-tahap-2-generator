/*
 * svg.js — pembangun SVG kecil, tanpa pustaka luar.
 *
 * Seluruh gambar butir (tabel, grafik, panel figural) adalah teks SVG biasa.
 * Himpunan tag yang dipakai sengaja kecil — rect, line, polyline, polygon,
 * circle, path (M L A Z), text, g — supaya penggambar piksel Node
 * (`svgraster.js`) cukup mengerti himpunan itu dan hasilnya sama dengan yang
 * dilihat di peramban.
 *
 * Pilihan penggaya memakai nama Indonesia:
 *   isi (fill)  garis (stroke)  tebal (stroke-width)  putus (dasharray)
 *   ujung (linecap)  sambung (linejoin)  buram (opacity)  data (atribut data-*)
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Svg = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var HURUF = 'Arial, Helvetica, sans-serif';

  /** Bilangan ringkas: maksimal 2 angka di belakang titik, tanpa nol tak perlu. */
  function num(v) {
    return String(Math.round(v * 100) / 100);
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /** Susun atribut gaya dari pilihan. Nilai null/undefined dilewati. */
  function gaya(o) {
    o = o || {};
    var s = '';
    if (o.isi !== undefined) s += ' fill="' + o.isi + '"';
    if (o.garis !== undefined) s += ' stroke="' + o.garis + '"';
    if (o.tebal !== undefined) s += ' stroke-width="' + num(o.tebal) + '"';
    if (o.putus) s += ' stroke-dasharray="' + o.putus + '"';
    if (o.ujung) s += ' stroke-linecap="' + o.ujung + '"';
    if (o.sambung) s += ' stroke-linejoin="' + o.sambung + '"';
    if (o.buram !== undefined) s += ' opacity="' + num(o.buram) + '"';
    if (o.data) {
      Object.keys(o.data).forEach(function (k) {
        s += ' data-' + k + '="' + esc(o.data[k]) + '"';
      });
    }
    return s;
  }

  function rect(x, y, w, h, o) {
    o = o || {};
    return '<rect x="' + num(x) + '" y="' + num(y) + '" width="' + num(w) + '" height="' + num(h) + '"' +
      (o.rx ? ' rx="' + num(o.rx) + '"' : '') + gaya(o) + '/>';
  }

  function garis(x1, y1, x2, y2, o) {
    o = o || {};
    if (o.garis === undefined) o.garis = '#111111';
    return '<line x1="' + num(x1) + '" y1="' + num(y1) + '" x2="' + num(x2) + '" y2="' + num(y2) + '"' +
      gaya(o) + '/>';
  }

  function titikStr(pts) {
    return pts.map(function (p) { return num(p[0]) + ',' + num(p[1]); }).join(' ');
  }

  /** Garis patah (terbuka) atau poligon (o.tutup). */
  function poli(pts, o) {
    o = o || {};
    var tag = o.tutup ? 'polygon' : 'polyline';
    var b = Object.assign({}, o);
    if (b.isi === undefined) b.isi = 'none';
    return '<' + tag + ' points="' + titikStr(pts) + '"' + gaya(b) + '/>';
  }

  function lingkaran(cx, cy, r, o) {
    return '<circle cx="' + num(cx) + '" cy="' + num(cy) + '" r="' + num(r) + '"' + gaya(o) + '/>';
  }

  /** Titik pada lingkaran; sudut dalam derajat, 0 di atas (jam 12), searah jarum jam. */
  function titikSudut(cx, cy, r, derajat) {
    var a = derajat * Math.PI / 180;
    return [cx + r * Math.sin(a), cy - r * Math.cos(a)];
  }

  /** Irisan lingkaran (pie): dari sudut a0 ke a1 (derajat, searah jarum jam dari jam 12). */
  function sektor(cx, cy, r, a0, a1, o) {
    var sapu = a1 - a0;
    if (sapu >= 359.999) return lingkaran(cx, cy, r, o);
    if (sapu <= 0.0001) return '';
    var p0 = titikSudut(cx, cy, r, a0), p1 = titikSudut(cx, cy, r, a1);
    var d = 'M' + num(cx) + ' ' + num(cy) + ' L' + num(p0[0]) + ' ' + num(p0[1]) +
      ' A' + num(r) + ' ' + num(r) + ' 0 ' + (sapu > 180 ? 1 : 0) + ' 1 ' +
      num(p1[0]) + ' ' + num(p1[1]) + ' Z';
    return '<path d="' + d + '"' + gaya(o) + '/>';
  }

  /**
   * Teks.
   * @param {object} o { ukuran, tebal (true = bold), rata ('start'|'middle'|'end'),
   *                     isi, putar (derajat terhadap titik teks), miring }
   */
  function teks(s, x, y, o) {
    o = o || {};
    var tf = o.putar ? ' transform="rotate(' + num(o.putar) + ' ' + num(x) + ' ' + num(y) + ')"' : '';
    return '<text x="' + num(x) + '" y="' + num(y) + '" fill="' + (o.isi || '#111111') +
      '" font-size="' + num(o.ukuran || 14) + '" font-family="' + HURUF + '"' +
      (o.tebal ? ' font-weight="700"' : '') +
      (o.miring ? ' font-style="italic"' : '') +
      ' text-anchor="' + (o.rata || 'start') + '"' + tf + '>' + esc(s) + '</text>';
  }

  /** Kelompok dengan translasi dan (opsional) skala. */
  function kelompok(inner, tx, ty, skala) {
    var t = 'translate(' + num(tx || 0) + ',' + num(ty || 0) + ')';
    if (skala && skala !== 1) t += ' scale(' + (Math.round(skala * 10000) / 10000) + ')';
    return '<g transform="' + t + '">' + inner + '</g>';
  }

  /** Bungkus menjadi dokumen SVG utuh. */
  function doc(inner, w, h, o) {
    o = o || {};
    var bg = o.latar ? '<rect x="0" y="0" width="' + num(w) + '" height="' + num(h) + '" fill="' + o.latar + '"/>' : '';
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + num(w) + '" height="' + num(h) +
      '" viewBox="0 0 ' + num(w) + ' ' + num(h) + '">' + bg + inner + '</svg>';
  }

  return {
    HURUF: HURUF, num: num, esc: esc, gaya: gaya, rect: rect, garis: garis, poli: poli,
    lingkaran: lingkaran, sektor: sektor, titikSudut: titikSudut, teks: teks,
    kelompok: kelompok, doc: doc
  };
});
