/*
 * raster.js — mengubah SVG menjadi piksel/PNG untuk Word, PDF, dan berkas gambar.
 *
 *   Peramban  kanvas bawaan (huruf sistem, paling halus).
 *   Node      `svgraster.js` — penggambar perangkat lunak tanpa dependensi.
 *
 * Keduanya mengembalikan bentuk yang sama, jadi docx.js dan pdf.js tidak perlu
 * tahu dari mana pikselnya datang. Di peramban penggambar perangkat lunak bisa
 * dipaksa lewat `Raster.pakaiPerangkatLunak(true)` — dipakai untuk memeriksa
 * bahwa keduanya menghasilkan gambar yang sepadan.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./svgraster.js'), require('./png.js'));
    module.exports = api;
  } else {
    api = factory(root.SvgRaster, root.Png);
    root.Raster = api;
  }
})(typeof self !== 'undefined' ? self : this, function (SvgRaster, Png) {
  'use strict';

  var adaKanvas = typeof document !== 'undefined' && typeof document.createElement === 'function';
  var paksaLunak = false;
  var kanvas = null;

  function pakaiKanvas() { return adaKanvas && !paksaLunak; }

  function pakaiPerangkatLunak(ya) { paksaLunak = !!ya; }

  function mode() { return pakaiKanvas() ? 'kanvas' : 'perangkat-lunak'; }

  function svgKeDataUrl(svg) {
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  function muatGambar(src) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { reject(new Error('gambar gagal dimuat')); };
      img.src = src;
    });
  }

  function ukuranSvg(svg) {
    var w = /<svg[^>]*\swidth="([\d.]+)"/.exec(svg), h = /<svg[^>]*\sheight="([\d.]+)"/.exec(svg);
    return { w: w ? parseFloat(w[1]) : 300, h: h ? parseFloat(h[1]) : 150 };
  }

  /** Gambar SVG ke kanvas peramban; mengembalikan konteks dan ukurannya. */
  function gambarKanvas(svg, skala) {
    return muatGambar(svgKeDataUrl(svg)).then(function (img) {
      if (!kanvas) kanvas = document.createElement('canvas');
      var uk = ukuranSvg(svg);
      var w = Math.max(1, Math.round((img.width || uk.w) * skala));
      var h = Math.max(1, Math.round((img.height || uk.h) * skala));
      kanvas.width = w;
      kanvas.height = h;
      var ctx = kanvas.getContext('2d', { willReadFrequently: true });
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      return { ctx: ctx, w: w, h: h };
    });
  }

  /**
   * Piksel mentah sebuah SVG. Gambar hitam-putih dikirim sebagai satu kanal
   * abu-abu — hasilnya sama persis tetapi datanya sepertiga dibanding RGB.
   * @returns {Promise<{lebar:number, tinggi:number, data:Uint8Array, kanal:1|3}>}
   */
  function svgKePiksel(svg, skala) {
    skala = skala || 2;
    if (!pakaiKanvas()) {
      try { return Promise.resolve(SvgRaster.gambar(svg, skala)); }
      catch (e) { return Promise.reject(e); }
    }
    return gambarKanvas(svg, skala).then(function (k) {
      var rgba = k.ctx.getImageData(0, 0, k.w, k.h).data;
      var n = k.w * k.h, i, j, abuSaja = true;
      for (i = 0, j = 0; j < n; i += 4, j++) {
        if (rgba[i] !== rgba[i + 1] || rgba[i + 1] !== rgba[i + 2]) { abuSaja = false; break; }
      }
      var data;
      if (abuSaja) {
        data = new Uint8Array(n);
        for (i = 0, j = 0; j < n; i += 4, j++) data[j] = rgba[i];
        return { lebar: k.w, tinggi: k.h, data: data, kanal: 1 };
      }
      data = new Uint8Array(n * 3);
      for (i = 0, j = 0; j < n * 3; i += 4, j += 3) {
        data[j] = rgba[i]; data[j + 1] = rgba[i + 1]; data[j + 2] = rgba[i + 2];
      }
      return { lebar: k.w, tinggi: k.h, data: data, kanal: 3 };
    });
  }

  /** @returns {Promise<Uint8Array>} berkas PNG */
  function svgKePng(svg, skala) {
    skala = skala || 2;
    if (!pakaiKanvas()) {
      return svgKePiksel(svg, skala).then(function (p) { return Png.kode(p); });
    }
    return gambarKanvas(svg, skala).then(function (k) {
      var url = kanvas.toDataURL('image/png');
      var bin = atob(url.slice(url.indexOf(',') + 1));
      var out = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
      return out;
    });
  }

  function unduhBlob(blob, namaFile) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = namaFile;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
  }

  return {
    svgKeDataUrl: svgKeDataUrl, svgKePiksel: svgKePiksel, svgKePng: svgKePng,
    unduhBlob: unduhBlob, pakaiPerangkatLunak: pakaiPerangkatLunak, mode: mode
  };
});
