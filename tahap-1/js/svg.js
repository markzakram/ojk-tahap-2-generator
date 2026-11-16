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

  /**
   * Palet gambar pembahasan figural (sama di semua bentuk soal): jawaban hijau, unsur yang berubah
   * atau diisi jingga, unsur pembanding merah, arah dan urutan biru, yang tetap/redup abu-abu.
   */
  var BAHAS = {
    jawab: '#12805c', latarJawab: '#e6f4ee', sorot: '#d35400', latarSorot: '#fdebd9', acuan: '#c0392b',
    panah: '#1f6fd0', latarPanah: '#e3edfb', redup: '#9aa3b5', teks: '#1d2333', teksRedup: '#5b6478'
  };

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

  /** Mata panah tertutup dengan ujung di (x, y), menghadap arah satuan (ux, uy). */
  function mataPanah(x, y, ux, uy, k, warna) {
    var bx = x - ux * k, by = y - uy * k, lb = k * 0.5;
    return poli([[x, y], [bx - uy * lb, by + ux * lb], [bx + uy * lb, by - ux * lb]], { tutup: true, isi: warna, garis: warna, tebal: 1, sambung: 'round' });
  }

  /**
   * Panah lurus (gambar pembahasan figural): garis dari (x1, y1) dan mata panah tertutup di (x2, y2).
   * @param {object} o { warna, tebal, kepala (panjang mata panah), putus, halo (alas putih supaya
   *                     panah tetap terbaca di atas gambar) }
   */
  function panah(x1, y1, x2, y2, o) {
    o = o || {};
    var w = o.warna || '#1f6fd0', t = o.tebal || 2, k = o.kepala || Math.max(7, t * 3.4);
    var dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
    var ax = x2 - ux * k * 0.8, ay = y2 - uy * k * 0.8, out = '';
    if (o.halo) {
      out += garis(x1, y1, ax, ay, { garis: '#ffffff', tebal: t + 4, ujung: 'round' });
      out += mataPanah(x2 + ux * 1.5, y2 + uy * 1.5, ux, uy, k + 3, '#ffffff');
    }
    out += garis(x1, y1, ax, ay, { garis: w, tebal: t, ujung: 'round', putus: o.putus });
    return out + mataPanah(x2, y2, ux, uy, k, w);
  }

  /**
   * Busur berpanah pada lingkaran (cx, cy, r) dari sudut a0 ke a1 (derajat, 0 di atas, searah jarum
   * jam bila a1 > a0, sama dengan `titikSudut`). Mata panah di ujung a1.
   * @param {object} o { warna, tebal, kepala, halo }
   */
  function busurPanah(cx, cy, r, a0, a1, o) {
    o = o || {};
    var w = o.warna || '#1f6fd0', t = o.tebal || 2, k = o.kepala || Math.max(7, t * 3.4);
    var arah = a1 >= a0 ? 1 : -1, kurang = Math.min(Math.abs(a1 - a0) * 0.6, k * 0.8 / r * 180 / Math.PI);
    var aAkhir = a1 - arah * kurang, p0 = titikSudut(cx, cy, r, a0), p1 = titikSudut(cx, cy, r, aAkhir), pu = titikSudut(cx, cy, r, a1);
    var d = 'M' + num(p0[0]) + ' ' + num(p0[1]) + ' A' + num(r) + ' ' + num(r) + ' 0 ' + (Math.abs(aAkhir - a0) > 180 ? 1 : 0) + ' ' + (arah > 0 ? 1 : 0) + ' ' + num(p1[0]) + ' ' + num(p1[1]);
    var dx = pu[0] - p1[0], dy = pu[1] - p1[1], L = Math.hypot(dx, dy) || 1, out = '';
    if (o.halo) out += '<path d="' + d + '"' + gaya({ isi: 'none', garis: '#ffffff', tebal: t + 4, ujung: 'round' }) + '/>';
    out += '<path d="' + d + '"' + gaya({ isi: 'none', garis: w, tebal: t, ujung: 'round' }) + '/>';
    return out + mataPanah(pu[0], pu[1], dx / L, dy / L, k, w);
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
    HURUF: HURUF, BAHAS: BAHAS, num: num, esc: esc, gaya: gaya, rect: rect, garis: garis, poli: poli,
    lingkaran: lingkaran, sektor: sektor, titikSudut: titikSudut, teks: teks,
    panah: panah, busurPanah: busurPanah, kelompok: kelompok, doc: doc
  };
});
