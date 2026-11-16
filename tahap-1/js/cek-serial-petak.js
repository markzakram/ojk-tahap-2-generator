/*
 * cek-serial-petak.js — pemeriksa independen untuk keluarga di serial-petak.js (dipanggil validator.js).
 *
 * Pemeriksa TIDAK memakai kode penyusun maupun aturan yang disimpannya. Ia membaca kotak yang TAMPIL
 * (model gambar soal) dan gambar opsi, lalu menyimpulkan sendiri gerakan tiap benda/penanda:
 *
 *   serial-petak  Untuk tiap benda (dikenali dari bentuknya) dicoba semua lintasan wajar pada petak
 *                 n x n — cincin tepi dan cincin dalam, baris/kolom berulang, baris/kolom bolak-balik,
 *                 menyusuri baris/kolom (membaca) berulang atau bolak-balik, zig-zag, zig-zag bolak-balik,
 *                 diagonal berulang,
 *                 diagonal memantul — masing-masing dalam kedelapan putaran/cerminan persegi dan dengan
 *                 setiap titik awal, dipadukan dengan pola langkah: tetap (-4..4 petak), bertambah
 *                 (awal 1-3, beda 1-2, kedua arah), dan bergantian dua langkah. Lintasan ditulis sebagai
 *                 rumus posisi, bukan daftar petak. Langkah bukan nol yang tidak memindahkan benda (memantul
 *                 kembali ke petak yang sama) dianggap tidak wajar. Bila aturan-aturan yang cocok meramalkan
 *                 petak yang berbeda untuk kotak berikutnya, soal "ambigu".
 *   serial-jarum  Untuk tiap penanda, langkah sudut antarkotak (kelipatan 45°, modulo 360°) dicocokkan
 *                 dengan pola: tetap, aritmetika, berulang tiap dua/tiga kotak, Fibonacci, berlipat dua,
 *                 dan selisih kedua tetap. Pola hanya dihitung bila langkah tampak lebih banyak dari
 *                 parameternya; ramalan harus tunggal.
 *
 * Lalu tepat satu opsi harus memuat ramalan semua benda/penanda, dan opsi itu harus kunci.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory();
    module.exports = api;
  } else {
    api = factory();
    root.CekSerialPetak = api;
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function md(a, n) { var r = a % n; return r < 0 ? r + n : r; }

  // ------------------------------------------------------------------ petak

  /** Gelombang segitiga 0..m-1..0 berperiode 2(m-1): posisi pada garis yang dipantulkan di kedua ujung. */
  function pantul(x, m) {
    if (m <= 1) return 0;
    var P = 2 * (m - 1), y = md(x, P);
    return y >= m ? P - y : y;
  }

  /** Putaran 90° searah jarum jam sebanyak `putar` kali, didahului cerminan kiri-kanan bila `cermin`. */
  function ubah(p, n, k) {
    var r = p[0], c = p[1], cermin = k >= 4, putar = k % 4, t;
    if (cermin) c = n - 1 - c;
    for (var i = 0; i < putar; i++) { t = r; r = c; c = n - 1 - t; }
    return r * n + c;
  }

  /** Petak ke-i pada cincin m x m bergeser `lapis`, searah jarum jam dari pojok kiri atas cincin. */
  function cincin(i, m, lapis) {
    var sisi = Math.floor(i / (m - 1)), j = i % (m - 1), p;
    if (sisi === 0) p = [0, j];
    else if (sisi === 1) p = [j, m - 1];
    else if (sisi === 2) p = [m - 1, m - 1 - j];
    else p = [m - 1 - j, 0];
    return [p[0] + lapis, p[1] + lapis];
  }

  var KEL = {};

  /** Keluarga lintasan dasar sebagai rumus pos(parameter, langkah kumulatif). */
  function keluargaLintasan(n) {
    if (KEL[n]) return KEL[n];
    var F = [], N2 = n * n, P = 2 * (n - 1);
    function tambah(banyak, pos) { F.push({ banyak: banyak, pos: pos }); }
    for (var lapis = 0; 2 * lapis < n - 1; lapis++) {
      (function (lp) {
        var m = n - 2 * lp, L = 4 * (m - 1);
        tambah(L, function (s, T) { return cincin(md(s + T, L), m, lp); });
      })(lapis);
    }
    // baris berulang dan baris bolak-balik (kolom didapat dari putaran)
    tambah(n * n, function (p, T) { return [Math.floor(p / n), md(p % n + T, n)]; });
    tambah(n * P, function (p, T) { return [Math.floor(p / P), pantul(p % P + T, n)]; });
    // menyusuri baris seperti membaca (berulang atau bolak-balik), zig-zag, dan zig-zag bolak-balik
    tambah(N2, function (s, T) { var i = md(s + T, N2); return [Math.floor(i / n), i % n]; });
    tambah(2 * (N2 - 1), function (s, T) { var i = pantul(s + T, N2); return [Math.floor(i / n), i % n]; });
    function zigzag(i) { var r = Math.floor(i / n), c = i % n; return [r, r % 2 ? n - 1 - c : c]; }
    tambah(N2, function (s, T) { return zigzag(md(s + T, N2)); });
    tambah(2 * (N2 - 1), function (s, T) { return zigzag(pantul(s + T, N2)); });
    // diagonal berulang (menembus tepi) dan diagonal memantul
    tambah(N2, function (p, T) { return [md(Math.floor(p / n) + T, n), md(p % n + T, n)]; });
    tambah(P * P, function (p, T) { return [pantul(Math.floor(p / P) + T, n), pantul(p % P + T, n)]; });
    return (KEL[n] = F);
  }

  var POLA = {};

  /** Pola langkah kumulatif untuk V kotak tampak (indeks 0..V). */
  function polaLangkah(V) {
    if (POLA[V]) return POLA[V];
    var hasil = [];
    function dari(f) { var T = [0], t; for (t = 1; t <= V; t++) T[t] = T[t - 1] + f(t); hasil.push(T); }
    [-4, -3, -2, -1, 0, 1, 2, 3, 4].forEach(function (k) { dari(function () { return k; }); });
    [1, 2, 3].forEach(function (x) {
      [1, 2].forEach(function (e) { [1, -1].forEach(function (sg) { dari(function (t) { return sg * (x + e * (t - 1)); }); }); });
    });
    for (var x = -4; x <= 4; x++) {
      for (var y = -4; y <= 4; y++) {
        if (x === y) continue;
        (function (x, y) { dari(function (t) { return t % 2 === 1 ? x : y; }); })(x, y);
      }
    }
    return (POLA[V] = hasil);
  }

  /** Ramalan petak (r*n+c) pada kotak berikutnya dari semua aturan yang cocok dengan `obs` (r*n+c). */
  function ramalanPetak(n, obs) {
    var F = keluargaLintasan(n), pola = polaLangkah(obs.length), V = obs.length, ramal = {};
    F.forEach(function (f) {
      for (var p = 0; p < f.banyak; p++) {
        for (var k = 0; k < 8; k++) {
          if (ubah(f.pos(p, 0), n, k) !== obs[0]) continue;
          for (var q = 0; q < pola.length; q++) {
            var T = pola[q], t;
            for (t = 1; t < V; t++) if (ubah(f.pos(p, T[t]), n, k) !== obs[t] || (T[t] !== T[t - 1] && obs[t] === obs[t - 1])) break;
            if (t === V) ramal[ubah(f.pos(p, T[V]), n, k)] = 1;
          }
        }
      }
    });
    return Object.keys(ramal).map(Number);
  }

  var URUT_BENDA = ['hitam', 'putih', 'segitiga', 'bintang', 'persegi', 'silang'];

  function periksaPetak(b, m, alat) {
    var H = alat.HURUF, sj = alat.sj;
    var t = alat.bacaTampilan(b, m, 'petak-deret', 'petak-opsi', function (x) { return x.fig || null; });
    if (!t) return;
    var s = t.soal, n = s.n, kotak = s.kotak;
    if (sj(kotak) !== sj(b.model.kotak) || n !== b.model.n) m.push('deret petak yang tergambar berbeda dari data model');
    if (!(n >= 3 && n <= 6) || !Array.isArray(kotak) || kotak.length < 4 || kotak.length > 5) { m.push('deret petak harus berisi 4-5 kotak petak 3x3 sampai 6x6'); return; }
    var V = kotak.length;
    var jenis = kotak[0].map(function (x) { return x.b; });
    if (!jenis.length || jenis.some(function (j, i) { return URUT_BENDA.indexOf(j) < 0 || jenis.indexOf(j) !== i; })) { m.push('benda pada kotak pertama tidak dikenal atau berulang'); return; }
    var kunciJenis = jenis.slice().sort().join(',');
    var jalur = {};
    for (var i = 0; i < V; i++) {
      var bd = kotak[i];
      if (bd.map(function (x) { return x.b; }).sort().join(',') !== kunciJenis) { m.push('kotak ' + (i + 1) + ' tidak memuat benda yang sama dengan kotak lain'); return; }
      for (var j = 0; j < bd.length; j++) {
        var x = bd[j];
        if (!(x.r >= 0 && x.r < n && x.c >= 0 && x.c < n)) { m.push('benda ' + x.b + ' di luar petak pada kotak ' + (i + 1)); return; }
        (jalur[x.b] = jalur[x.b] || []).push(x.r * n + x.c);
      }
    }
    var ramal = {};
    for (var k = 0; k < jenis.length; k++) {
      var r = ramalanPetak(n, jalur[jenis[k]]);
      if (!r.length) { m.push('gerakan ' + jenis[k] + ' tidak cocok dengan lintasan dan langkah mana pun'); return; }
      if (r.length > 1) { m.push('ambigu: gerakan ' + jenis[k] + ' cocok dengan beberapa aturan yang meramalkan ' + r.length + ' petak berbeda'); return; }
      ramal[jenis[k]] = r[0];
    }
    var cocok = [];
    t.opsi.forEach(function (f, i) {
      if (!f || f.n !== n || !Array.isArray(f.benda)) { m.push('opsi ' + H[i] + ' bukan petak ' + n + 'x' + n); return; }
      if (f.benda.map(function (x) { return x.b; }).sort().join(',') !== kunciJenis) { m.push('benda pada opsi ' + H[i] + ' tidak sama dengan benda deret'); return; }
      if (f.benda.every(function (x) { return x.r * n + x.c === ramal[x.b]; })) cocok.push(i);
    });
    alat.tepatSatu(b, m, cocok, 'lintasan dan langkah tiap benda');
  }

  function sidikPetak(b) {
    var md2 = b.model, kunci = md2.pilihan[md2.kunciIndex];
    var semua = md2.kotak.concat([kunci.benda]);
    return ['n' + md2.n].concat(semua.map(function (bd) {
      return bd.map(function (x) { return x.b + '@' + x.r + ',' + x.c; }).sort().join(';');
    }));
  }

  // ------------------------------------------------------------------ jarum

  /**
   * Ramalan arah berikutnya (0..7) dari deret arah tampak. Setiap pola: [banyak parameter, fungsi yang
   * memberi langkah ke-i (0-based) dari langkah-langkah sebelumnya, atau null bila belum terdefinisi].
   */
  function ramalanJarum(arah) {
    var L = [], i;
    for (i = 1; i < arah.length; i++) L.push(md(arah[i] - arah[i - 1], 8));
    var n = L.length, hasil = {};
    var pola = [
      { p: 1, f: function (d, i) { return d[0]; } },
      { p: 2, f: function (d, i) { var e = md(d[1] - d[0], 8); return e === 0 ? null : d[0] + i * e; } },
      { p: 2, f: function (d, i) { return d[0] === d[1] ? null : d[i % 2]; } },
      { p: 3, f: function (d, i) { return d[i % 3]; } },
      { p: 2, f: function (d, i) { var a = d[0], b = d[1]; for (var k = 2; k <= i; k++) { var c = a + b; a = b; b = c; } return i === 0 ? d[0] : b; } },
      { p: 1, f: function (d, i) { return d[0] * Math.pow(2, i); } },
      { p: 3, f: function (d, i) { var s1 = d[1] - d[0], s2 = d[2] - 2 * d[1] + d[0]; return d[0] + i * s1 + s2 * i * (i - 1) / 2; } }
    ];
    pola.forEach(function (q) {
      if (n <= q.p) return;
      for (var k = 0; k < n; k++) {
        var v = q.f(L, k);
        if (v === null || md(v, 8) !== L[k]) return;
      }
      var lanjut = q.f(L, n);
      if (lanjut === null) return;
      hasil[md(arah[arah.length - 1] + lanjut, 8)] = 1;
    });
    return Object.keys(hasil).map(Number);
  }

  var URUT_PENANDA = ['panjang', 'pendek', 'titik', 'bulatan', 'segitiga'];

  function periksaJarum(b, m, alat) {
    var H = alat.HURUF, sj = alat.sj;
    var t = alat.bacaTampilan(b, m, 'jarum-deret', 'jarum-opsi', function (x) { return x.fig || null; });
    if (!t) return;
    var kotak = t.soal.kotak;
    if (sj(kotak) !== sj(b.model.kotak)) m.push('deret muka jam yang tergambar berbeda dari data model');
    if (!Array.isArray(kotak) || kotak.length < 4 || kotak.length > 5) { m.push('deret muka jam harus berisi 4-5 kotak'); return; }
    var jenis = kotak[0].map(function (p) { return p.j; });
    if (jenis.length < 2 || jenis.length > 4 || jenis.some(function (j, i) { return URUT_PENANDA.indexOf(j) < 0 || jenis.indexOf(j) !== i; })) { m.push('penanda pada kotak pertama tidak dikenal, berulang, atau banyaknya bukan 2-4'); return; }
    // titik hitam dan bulatan putih menempati tepi yang sama; bila keduanya ada, keduanya bisa bertumpuk
    if (jenis.indexOf('titik') >= 0 && jenis.indexOf('bulatan') >= 0) { m.push('titik hitam dan bulatan putih tidak boleh dipakai bersama'); return; }
    var kj = jenis.slice().sort().join(','), deret = {};
    for (var i = 0; i < kotak.length; i++) {
      if (kotak[i].map(function (p) { return p.j; }).sort().join(',') !== kj) { m.push('kotak ' + (i + 1) + ' tidak memuat penanda yang sama dengan kotak lain'); return; }
      for (var k = 0; k < kotak[i].length; k++) {
        var p = kotak[i][k];
        if (!(p.a >= 0 && p.a < 8 && p.a === Math.floor(p.a))) { m.push('arah penanda ' + p.j + ' bukan kelipatan 45°'); return; }
        (deret[p.j] = deret[p.j] || []).push(p.a);
      }
    }
    var ramal = {};
    for (var q = 0; q < jenis.length; q++) {
      var r = ramalanJarum(deret[jenis[q]]);
      if (!r.length) { m.push('putaran ' + jenis[q] + ' tidak mengikuti pola langkah mana pun'); return; }
      if (r.length > 1) { m.push('ambigu: putaran ' + jenis[q] + ' cocok dengan beberapa pola yang meramalkan ' + r.length + ' arah berbeda'); return; }
      ramal[jenis[q]] = r[0];
    }
    var cocok = [];
    t.opsi.forEach(function (f, i) {
      if (!f || !Array.isArray(f.penanda) || f.penanda.map(function (p) { return p.j; }).sort().join(',') !== kj) { m.push('penanda pada opsi ' + H[i] + ' tidak sama dengan penanda deret'); return; }
      if (f.penanda.every(function (p) { return p.a === ramal[p.j]; })) cocok.push(i);
    });
    alat.tepatSatu(b, m, cocok, 'langkah putar tiap penanda');
  }

  function sidikJarum(b) {
    var md2 = b.model, kunci = md2.pilihan[md2.kunciIndex];
    return md2.kotak.concat([kunci.penanda]).map(function (pn) {
      return pn.map(function (p) { return p.j + ':' + p.a; }).sort().join(';');
    });
  }

  return {
    TIPE: {
      'serial-petak': { periksa: periksaPetak, sidik: sidikPetak, batas: 1 },
      'serial-jarum': { periksa: periksaJarum, sidik: sidikJarum, batas: 1 }
    },
    ramalanPetak: ramalanPetak, ramalanJarum: ramalanJarum
  };
});
