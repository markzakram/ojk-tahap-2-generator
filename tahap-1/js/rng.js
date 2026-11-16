/*
 * rng.js — pengacak berbenih (seeded).
 *
 * Seluruh butir dibangkitkan dari sebuah nomor benih. Benih yang sama SELALU
 * menghasilkan butir yang sama, jadi paket bisa dibuat ulang persis dari
 * nomornya saja — penting untuk menelusuri butir yang bermasalah dan untuk
 * menguji ulang hasil generator tanpa menyimpan gambarnya.
 *
 * Disalin dari Figural Kesesuaian Generator (mulberry32 + pengaduk splitmix32),
 * lalu ditambah `turunan` (menggabungkan beberapa bilangan/teks menjadi satu
 * benih), `bobot`, dan `kocok` yang stabil.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Rng = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /**
   * Aduk benih sebelum dipakai.
   *
   * Benih berurutan (1000, 1001, 1002, ...) menghasilkan keluaran PERTAMA
   * mulberry32 yang masih berkorelasi. Pengaduk finalizer splitmix32 memutus
   * korelasi itu, lalu tiga keluaran pertama dibuang sebagai pemanasan.
   */
  function adukBenih(x) {
    x = (x >>> 0) + 0x9e3779b9;
    x = Math.imul(x ^ (x >>> 16), 0x21f0aaad);
    x = Math.imul(x ^ (x >>> 15), 0x735a2d97);
    return (x ^ (x >>> 15)) >>> 0;
  }

  /** Sidik FNV-1a 32 bit dari sebuah teks. */
  function hashTeks(s) {
    var h = 0x811c9dc5;
    s = String(s);
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
  }

  /**
   * Gabungkan beberapa bagian (bilangan atau teks) menjadi satu benih 32 bit.
   * Urutan bagian berpengaruh: turunan(1, 2) != turunan(2, 1).
   */
  function turunan() {
    var h = 0x9e3779b9;
    for (var i = 0; i < arguments.length; i++) {
      var a = arguments[i];
      var x = typeof a === 'string' ? hashTeks(a) : (a >>> 0);
      h = adukBenih((h ^ x) + Math.imul(i + 1, 0x85ebca6b));
    }
    return h >>> 0;
  }

  /**
   * @param {number} benih bilangan bulat apa pun
   * @returns {function():number} pengacak 0 <= x < 1
   */
  function buat(benih) {
    var a = adukBenih(benih) || 0x9e3779b9;
    var r = function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    r(); r(); r();
    return r;
  }

  /** Pembungkus dengan pemilih yang sering dipakai. */
  function alat(benih) {
    var r = buat(benih);
    var a = {
      acak: r,
      /** bilangan pecahan pada [lo, hi) */
      antara: function (lo, hi) { return lo + r() * (hi - lo); },
      /** bilangan bulat pada [lo, hi] */
      bulat: function (lo, hi) { return lo + Math.floor(r() * (hi - lo + 1)); },
      /** bilangan bulat kelipatan `langkah` pada [lo, hi] */
      kelipatan: function (lo, hi, langkah) {
        var n = Math.floor((hi - lo) / langkah);
        return lo + Math.floor(r() * (n + 1)) * langkah;
      },
      /** satu anggota daftar */
      pilih: function (daftar) { return daftar[Math.floor(r() * daftar.length)]; },
      /** benar dengan peluang p */
      untung: function (p) { return r() < p; },
      /** -1 atau 1 */
      tanda: function () { return r() < 0.5 ? -1 : 1; },
      /** salinan daftar yang urutannya diacak (Fisher-Yates) */
      kocok: function (daftar) {
        var d = daftar.slice();
        for (var i = d.length - 1; i > 0; i--) {
          var j = Math.floor(r() * (i + 1));
          var t = d[i]; d[i] = d[j]; d[j] = t;
        }
        return d;
      },
      /** ambil n anggota berbeda dari daftar */
      ambil: function (daftar, n) { return a.kocok(daftar).slice(0, n); },
      /** pilih satu anggota menurut bobot */
      bobot: function (daftar, bobot) {
        var jml = 0, i;
        for (i = 0; i < bobot.length; i++) jml += bobot[i];
        var x = r() * jml;
        for (i = 0; i < daftar.length; i++) {
          x -= bobot[i];
          if (x < 0) return daftar[i];
        }
        return daftar[daftar.length - 1];
      }
    };
    return a;
  }

  /** Benih acak sungguhan — dipakai tombol "Benih acak" di antarmuka. */
  function benihBaru() {
    return (Math.floor(Math.random() * 0xffffffff) >>> 0);
  }

  return {
    buat: buat, alat: alat, benihBaru: benihBaru, adukBenih: adukBenih,
    hashTeks: hashTeks, turunan: turunan
  };
});
