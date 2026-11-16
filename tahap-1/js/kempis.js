/*
 * kempis.js — CRC-32 dan pemampat deflate tanpa pustaka luar.
 *
 * Tiga pengguna: penulis PNG, penulis ZIP (docx/xlsx/zip), dan PDF (aliran gambar).
 *
 *   Node       zlib bawaan (`deflateSync`) — selalu tersedia.
 *   Peramban   CompressionStream bawaan bila ada; kalau tidak, hasilnya null dan
 *              pemanggil menyimpan isinya apa adanya (ZIP metode 0, PDF tanpa filter).
 *
 * Semua fungsi pemampat mengembalikan Promise supaya satu kode jalan di keduanya.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Kempis = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var TABEL = null;
  function crc32(u8, awal) {
    if (!TABEL) {
      TABEL = new Uint32Array(256);
      for (var n = 0; n < 256; n++) {
        var c = n;
        for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        TABEL[n] = c >>> 0;
      }
    }
    var crc = awal === undefined ? 0xFFFFFFFF : (awal ^ 0xFFFFFFFF) >>> 0;
    for (var i = 0; i < u8.length; i++) crc = TABEL[(crc ^ u8[i]) & 0xFF] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  var zlib = null;
  try {
    if (typeof process !== 'undefined' && process.versions && process.versions.node && typeof require === 'function') {
      zlib = require('zlib');
    }
  } catch (e) { zlib = null; }

  function dariAliran(u8, format) {
    if (typeof CompressionStream !== 'function' || typeof Blob !== 'function' || typeof Response !== 'function') {
      return Promise.resolve(null);
    }
    try {
      var aliran = new Blob([u8]).stream().pipeThrough(new CompressionStream(format));
      return new Response(aliran).arrayBuffer()
        .then(function (buf) { return new Uint8Array(buf); })
        .catch(function () { return null; });
    } catch (e) {
      return Promise.resolve(null);
    }
  }

  /** Deflate berformat zlib (dipakai PNG dan PDF FlateDecode). */
  function deflate(u8, tingkat) {
    if (zlib) return Promise.resolve(new Uint8Array(zlib.deflateSync(u8, { level: tingkat == null ? 6 : tingkat })));
    return dariAliran(u8, 'deflate');
  }

  /** Deflate mentah (dipakai anggota ZIP metode 8). */
  function deflateMentah(u8, tingkat) {
    if (zlib) return Promise.resolve(new Uint8Array(zlib.deflateRawSync(u8, { level: tingkat == null ? 6 : tingkat })));
    return dariAliran(u8, 'deflate-raw');
  }

  /** Versi sinkron (hanya Node); null bila tidak tersedia. */
  function deflateSync(u8, tingkat) {
    return zlib ? new Uint8Array(zlib.deflateSync(u8, { level: tingkat == null ? 6 : tingkat })) : null;
  }

  return {
    crc32: crc32, deflate: deflate, deflateMentah: deflateMentah, deflateSync: deflateSync,
    adaZlib: !!zlib
  };
});
