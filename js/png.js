/*
 * png.js — penulis PNG tanpa pustaka luar.
 *
 * Menerima piksel mentah { lebar, tinggi, data, kanal } (1 = abu-abu, 3 = RGB)
 * dari `svgraster.js` atau kanvas, lalu menulis berkas PNG 8 bit. Tiap baris
 * dipilih filternya (None/Sub/Up) menurut jumlah mutlak terkecil, seperti
 * heuristik libpng, sehingga grafik berlatar datar mengecil banyak.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./kempis.js'));
    module.exports = api;
  } else {
    api = factory(root.Kempis);
    root.Png = api;
  }
})(typeof self !== 'undefined' ? self : this, function (Kempis) {
  'use strict';

  var TANDA = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];

  function saring(img) {
    var w = img.lebar, h = img.tinggi, bpp = img.kanal, rb = w * bpp, d = img.data;
    var out = new Uint8Array((rb + 1) * h), y, i, nol = new Uint8Array(rb);
    for (y = 0; y < h; y++) {
      var baris = d.subarray(y * rb, (y + 1) * rb);
      var atas = y ? d.subarray((y - 1) * rb, y * rb) : nol;
      var sN = 0, sS = 0, sU = 0, v, t;
      for (i = 0; i < rb; i++) {
        v = baris[i];
        sN += v < 128 ? v : 256 - v;
        t = (v - (i >= bpp ? baris[i - bpp] : 0)) & 255;
        sS += t < 128 ? t : 256 - t;
        t = (v - atas[i]) & 255;
        sU += t < 128 ? t : 256 - t;
      }
      var o = y * (rb + 1);
      if (sN <= sS && sN <= sU) {
        out[o] = 0;
        for (i = 0; i < rb; i++) out[o + 1 + i] = baris[i];
      } else if (sS <= sU) {
        out[o] = 1;
        for (i = 0; i < rb; i++) out[o + 1 + i] = (baris[i] - (i >= bpp ? baris[i - bpp] : 0)) & 255;
      } else {
        out[o] = 2;
        for (i = 0; i < rb; i++) out[o + 1 + i] = (baris[i] - atas[i]) & 255;
      }
    }
    return out;
  }

  function petak(jenis, isi) {
    var panjang = isi.length, u = new Uint8Array(12 + panjang), v = new DataView(u.buffer);
    v.setUint32(0, panjang);
    for (var i = 0; i < 4; i++) u[4 + i] = jenis.charCodeAt(i);
    u.set(isi, 8);
    var crc = Kempis.crc32(u.subarray(4, 8 + panjang));
    v.setUint32(8 + panjang, crc);
    return u;
  }

  function rakit(img, idat) {
    var ihdr = new Uint8Array(13), v = new DataView(ihdr.buffer);
    v.setUint32(0, img.lebar); v.setUint32(4, img.tinggi);
    ihdr[8] = 8; ihdr[9] = img.kanal === 1 ? 0 : 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
    var bagian = [new Uint8Array(TANDA), petak('IHDR', ihdr), petak('IDAT', idat), petak('IEND', new Uint8Array(0))];
    var jml = bagian.reduce(function (a, b) { return a + b.length; }, 0), out = new Uint8Array(jml), pos = 0;
    bagian.forEach(function (b) { out.set(b, pos); pos += b.length; });
    return out;
  }

  /** @returns {Promise<Uint8Array>} berkas PNG */
  function kode(img) {
    var mentah = saring(img);
    return Kempis.deflate(mentah, 6).then(function (padat) {
      if (!padat) throw new Error('pemampat tidak tersedia untuk menulis PNG');
      return rakit(img, padat);
    });
  }

  /** Versi sinkron untuk Node. */
  function kodeSync(img) {
    var padat = Kempis.deflateSync(saring(img), 6);
    if (!padat) throw new Error('zlib tidak tersedia');
    return rakit(img, padat);
  }

  /** Ukuran piksel sebuah PNG: lebar pada byte 16-19, tinggi pada byte 20-23. */
  function ukuran(u8) {
    var v = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
    return { lebar: v.getUint32(16), tinggi: v.getUint32(20) };
  }

  return { kode: kode, kodeSync: kodeSync, ukuran: ukuran };
});
