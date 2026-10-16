/*
 * metrik.js — lebar huruf Helvetica/Arial dan pemetaan teks ke WinAnsi.
 *
 * Satu sumber ukuran untuk SEMUA yang menyusun teks:
 *   - tabel dan grafik (menentukan lebar kolom dan label),
 *   - penggambar piksel Node (kemajuan huruf pada font garis),
 *   - PDF (pemenggalan baris dan perataan).
 * Arial dirancang sepadan dengan Helvetica, jadi SVG yang dilihat di peramban
 * (Arial) dan hasil rasternya (font garis berukuran sama) memakai lebar huruf
 * yang sama. Pengukur kanvas sengaja tidak dipakai supaya hasil di Node dan di
 * peramban identik.
 *
 * Angka di bawah adalah lebar AFM Helvetica dan Helvetica-Bold per 1000 satuan.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Metrik = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ASCII 32..126
  var REGULER = [
    278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278,
    556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556,
    1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778,
    667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556,
    333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556,
    556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584
  ];
  var TEBAL = [
    278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278,
    556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611,
    975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778,
    667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556,
    333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611,
    611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584
  ];

  // Di luar ASCII: [reguler, tebal]
  var TAMBAHAN = {
    '£': [556, 556], '€': [556, 556], '¥': [556, 556], '°': [400, 400], '±': [584, 584],
    '¹': [333, 333], '²': [333, 333], '³': [333, 333], '·': [278, 278], '×': [584, 584], '÷': [584, 584],
    '½': [834, 834], '¼': [834, 834], '¾': [834, 834], '–': [556, 556], '—': [1000, 1000],
    '‘': [222, 278], '’': [222, 278], '“': [333, 500], '”': [333, 500], '•': [350, 350],
    '…': [1000, 1000], '≈': [549, 549], '≤': [549, 549], '≥': [549, 549], '→': [1000, 1000],
    '−': [584, 584], '≠': [549, 549], ' ': [278, 278], 'é': [556, 556], 'ñ': [556, 611]
  };

  /** Lebar satu huruf per 1000 satuan. */
  function lebarHuruf(c, tebal) {
    var k = c.charCodeAt(0);
    if (k >= 32 && k <= 126) return (tebal ? TEBAL : REGULER)[k - 32];
    var t = TAMBAHAN[c];
    if (t) return t[tebal ? 1 : 0];
    return 556;
  }

  /** Lebar teks dalam satuan yang sama dengan `ukuran` (mis. piksel atau pt). */
  function lebar(teks, ukuran, tebal) {
    teks = String(teks == null ? '' : teks);
    var jml = 0;
    for (var i = 0; i < teks.length; i++) jml += lebarHuruf(teks.charAt(i), tebal);
    return jml * ukuran / 1000;
  }

  /**
   * Penggal satu paragraf menjadi baris-baris yang muat selebar `lebarMaks`.
   * Kata yang lebih panjang dari satu baris dipotong paksa.
   */
  function penggal(teks, lebarMaks, ukuran, tebal) {
    var kata = String(teks == null ? '' : teks).split(/[ \t]+/).filter(function (k) { return k !== ''; });
    var baris = [], kini = '';
    function dorong(k) {
      // kata yang melebihi lebar satu baris dipotong per huruf
      while (lebar(k, ukuran, tebal) > lebarMaks && k.length > 1) {
        var n = k.length - 1;
        while (n > 1 && lebar(k.slice(0, n), ukuran, tebal) > lebarMaks) n--;
        baris.push(k.slice(0, n));
        k = k.slice(n);
      }
      kini = k;
    }
    kata.forEach(function (k) {
      var coba = kini ? kini + ' ' + k : k;
      if (kini && lebar(coba, ukuran, tebal) > lebarMaks) { baris.push(kini); kini = ''; dorong(k); }
      else if (!kini && lebar(coba, ukuran, tebal) > lebarMaks) dorong(k);
      else kini = coba;
    });
    if (kini) baris.push(kini);
    return baris.length ? baris : [''];
  }

  // ------------------------------------------------------------- WinAnsi (PDF)

  var WIN = {
    '€': 0x80, '‚': 0x82, 'ƒ': 0x83, '„': 0x84, '…': 0x85, '†': 0x86, '‡': 0x87,
    'ˆ': 0x88, '‰': 0x89, '‹': 0x8b, '‘': 0x91, '’': 0x92, '“': 0x93, '”': 0x94,
    '•': 0x95, '–': 0x96, '—': 0x97, '˜': 0x98, '™': 0x99, '›': 0x9b
  };

  // Karakter yang tidak ada di WinAnsi diganti padanan ASCII yang masuk akal.
  var GANTI = {
    '≈': '~', '≤': '<=', '≥': '>=', '→': '->', '←': '<-', '↔': '<->', '≠': '!=',
    '−': '-', '‑': '-', ' ': ' ', ' ': ' ', '✓': 'v', '✔': 'v', '✗': 'x'
  };

  /**
   * Ubah teks Unicode menjadi "string biner" WinAnsi (satu karakter = satu byte)
   * yang aman ditulis ke aliran PDF. Karakter di luar WinAnsi menjadi "?".
   */
  function keWinAnsi(teks) {
    var s = String(teks == null ? '' : teks), out = '';
    for (var i = 0; i < s.length; i++) {
      var c = s.charAt(i), k = c.charCodeAt(0);
      if (GANTI[c] !== undefined) {
        out += keWinAnsi(GANTI[c]);
        continue;
      }
      if (k >= 32 && k <= 126) out += c;
      else if (k >= 0xa0 && k <= 0xff) out += c;
      else if (WIN[c] !== undefined) out += String.fromCharCode(WIN[c]);
      else if (k === 9) out += ' ';
      else out += '?';
    }
    return out;
  }

  /** Lolos dari kurung dan garis miring untuk string literal PDF. */
  function teksPdf(teks) {
    return keWinAnsi(teks).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  }

  return {
    lebarHuruf: lebarHuruf, lebar: lebar, penggal: penggal,
    keWinAnsi: keWinAnsi, teksPdf: teksPdf
  };
});
