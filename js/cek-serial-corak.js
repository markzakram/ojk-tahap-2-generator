/*
 * cek-serial-corak.js — pemeriksa independen untuk keluarga di serial-corak.js (dipanggil validator.js).
 *
 * Pemeriksa TIDAK memakai kode penyusun maupun corak.js. Ia membaca kotak yang TAMPIL (model gambar soal:
 * tata, bentuk luar, banyak bagian, kode corak tiap bagian per lapis) dan gambar opsi, lalu menyimpulkan
 * sendiri aturan tiap lapis dari kotak-kotak itu. Kedua keluarga (corak berpindah dan corak berganti)
 * diperiksa dengan pustaka aturan yang SAMA, jadi penjelasan dari jenis lain pun ikut dicoba:
 *
 *   A. pergeseran seluruh lapis: untuk tiap peralihan dicari semua besar geser (0..n-1 bagian) yang
 *      mengubah kotak itu menjadi kotak berikutnya, dengan arah corak tetap atau ikut berputar kaku
 *      (pemetaan arah garis dan kotak-kotak dihitung sendiri: garis bersudut a menjadi a - sudut putar,
 *      kotak-kotak tegak dan miring bertukar bila diputar 45°); lalu dicocokkan pola langkah tetap,
 *      bertambah (beda ±1, ±2), dan bergantian
 *   B. pergeseran k bagian disertai penggantian corak yang tetap (fungsi corak -> corak dari semua peralihan)
 *   C. satu bagian diam, bagian lain bergeser pada putaran n-1 bagian dengan langkah tetap
 *   D. siklus tertutup: setiap urutan melingkar atas SEMUA corak yang tampak di lapis itu (2-5 corak);
 *      setiap peralihan harus memajukan semua bagian dengan langkah yang sama (boleh disertai geser k);
 *      pola langkah tetap, bertambah, atau bergantian
 *   E. satu corak menjalar: himpunan bagian bercorak itu adalah busur berurutan yang bertambah tetap 1 atau
 *      2 bagian dari pangkal yang sama, bagian lain bercorak tetap
 *   F. lapis berulang tiap 1-3 kotak (sedikitnya dua kali terlihat berulang)
 * Bentuk luar: berulang tiap 1-3 kotak dengan syarat yang sama.
 *
 * Ramalan setiap lapis harus tunggal (beberapa aturan yang cocok tetapi meramalkan susunan berbeda -> "ambigu"),
 * lalu tepat satu opsi harus sama dengan ramalan itu, dan opsi itu harus kunci.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory();
    module.exports = api;
  } else {
    api = factory();
    root.CekSerialCorak = api;
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var KODE = ['hitam', 'putih', 'titik', 'bintang', 'bulatan', 'kotak', 'kotak-miring', 'arsir-0', 'arsir-45', 'arsir-90', 'arsir-135'];
  var BERARAH = { kotak: 1, 'kotak-miring': 1, 'arsir-0': 1, 'arsir-45': 1, 'arsir-90': 1, 'arsir-135': 1 };
  var TATA = {
    sinar: { lapis: 1, n: [4, 6, 8], luar: ['persegi', 'lingkaran', 'belah-ketupat', 'segienam', 'segidelapan'] },
    sekat: { lapis: 2, n: [4], luar: ['persegi'] },
    bingkai: { lapis: 2, n: [4], luar: ['persegi'] },
    cincin: { lapis: 2, n: [4], luar: ['lingkaran'] }
  };

  function md(a, n) { var r = a % n; return r < 0 ? r + n : r; }
  function punya(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }

  /** Corak setelah bagiannya diputar `deg` derajat searah jarum jam; null bila tak terwakili. */
  function putarCorak(c, deg) {
    if (!BERARAH[c]) return c;
    if (deg % 45 !== 0) return null;
    if (c === 'kotak' || c === 'kotak-miring') return md(deg, 90) === 45 ? (c === 'kotak' ? 'kotak-miring' : 'kotak') : c;
    return 'arsir-' + md(parseInt(c.slice(6), 10) - deg, 180);
  }

  /** Susunan A digeser d bagian searah jarum jam; kaku = arah corak ikut berputar. */
  function rot(A, d, kaku, n) {
    var B = [], deg = md(d, n) * 360 / n;
    for (var i = 0; i < n; i++) {
      var c = kaku ? putarCorak(A[i], deg) : A[i];
      if (c === null) return null;
      B[md(i + d, n)] = c;
    }
    return B;
  }

  function sama(A, B) {
    if (!A || !B || A.length !== B.length) return false;
    for (var i = 0; i < A.length; i++) if (A[i] !== B[i]) return false;
    return true;
  }

  /** Semua urutan melingkar atas himpunan U (dibangun dari permutasi lengkap, putaran yang sama dibuang). */
  function lingkaran(U) {
    var hasil = [], lihat = {};
    (function perm(awal, sisa) {
      if (!sisa.length) {
        var i0 = awal.indexOf(U[0]), kanon = awal.slice(i0).concat(awal.slice(0, i0)).join('|');
        if (!lihat[kanon]) { lihat[kanon] = 1; hasil.push(kanon.split('|')); }
        return;
      }
      for (var i = 0; i < sisa.length; i++) perm(awal.concat([sisa[i]]), sisa.slice(0, i).concat(sisa.slice(i + 1)));
    })([], U.slice());
    return hasil;
  }

  /** Ramalan susunan satu lapis; mengembalikan daftar susunan berbeda (sebagai teks "a,b,c"). */
  function ramalLapis(seq, n) {
    var V = seq.length, T = V - 1, akhir = seq[V - 1], hasil = {}, t, i, k;
    function catat(A) { if (A) hasil[A.join(',')] = 1; }

    // A. pergeseran berpola
    [false, true].forEach(function (kaku) {
      var D = [];
      for (var u = 0; u < T; u++) {
        var d = [];
        for (var x = 0; x < n; x++) if (sama(rot(seq[u], x, kaku, n), seq[u + 1])) d.push(x);
        if (!d.length) return;
        D.push(d);
      }
      function ada(u, x) { return D[u].indexOf(md(x, n)) >= 0; }
      D[0].forEach(function (x) {
        var ok = true;
        for (var u2 = 1; u2 < T; u2++) if (!ada(u2, x)) { ok = false; break; }
        if (ok) catat(rot(akhir, x, kaku, n));
      });
      D[0].forEach(function (x0) {
        if (x0 === 0) return;
        [1, 2, -1, -2].forEach(function (e) {
          for (var u2 = 1; u2 < T; u2++) if (!ada(u2, x0 + e * u2)) return;
          catat(rot(akhir, x0 + e * T, kaku, n));
        });
      });
      if (T >= 2) {
        D[0].forEach(function (x) {
          D[1].forEach(function (y) {
            if (x === y) return;
            for (var u2 = 2; u2 < T; u2++) if (!ada(u2, u2 % 2 ? y : x)) return;
            catat(rot(akhir, T % 2 ? y : x, kaku, n));
          });
        });
      }
    });

    // B. geser k bagian + penggantian corak tetap
    for (k = 0; k < n; k++) {
      var peta = {}, cocok = true;
      for (t = 0; cocok && t < T; t++) {
        for (i = 0; i < n; i++) {
          var dari = seq[t][i], ke = seq[t + 1][md(i + k, n)];
          if (!punya(peta, dari)) peta[dari] = ke;
          else if (peta[dari] !== ke) { cocok = false; break; }
        }
      }
      if (!cocok || akhir.some(function (c) { return !punya(peta, c); })) continue;
      var P = [];
      for (i = 0; i < n; i++) P[md(i + k, n)] = peta[akhir[i]];
      catat(P);
    }

    // C. satu bagian diam
    for (var p = 0; p < n; p++) {
      if (seq.some(function (A) { return A[p] !== seq[0][p]; })) continue;
      var m1 = n - 1, R = seq.map(function (A) { var r = []; for (var j = 1; j < n; j++) r.push(A[md(p + j, n)]); return r; });
      for (var x = 1; x < m1; x++) {
        var ok = true;
        for (t = 0; ok && t < T; t++) for (var j = 0; j < m1; j++) if (R[t + 1][md(j + x, m1)] !== R[t][j]) { ok = false; break; }
        if (!ok) continue;
        var Q = akhir.slice();
        for (j = 0; j < m1; j++) Q[md(p + 1 + md(j + x, m1), n)] = R[T][j];
        catat(Q);
      }
    }

    // D. siklus tertutup
    var U = [];
    seq.forEach(function (A) { A.forEach(function (c) { if (U.indexOf(c) < 0) U.push(c); }); });
    if (U.length >= 2 && U.length <= 5) {
      lingkaran(U).forEach(function (S) {
        var L = S.length, ix = {};
        S.forEach(function (c, j) { ix[c] = j; });
        var I = seq.map(function (A) { return A.map(function (c) { return ix[c]; }); });
        for (var kk = 0; kk < n; kk++) {
          var d = [], ok = true;
          for (var u = 0; ok && u < T; u++) {
            var dt = null;
            for (var q = 0; q < n; q++) {
              var x = md(I[u + 1][md(q + kk, n)] - I[u][q], L);
              if (dt === null) dt = x; else if (dt !== x) { ok = false; break; }
            }
            d.push(dt);
          }
          if (!ok) continue;
          var maju = [];
          if (d[0] !== 0 && d.every(function (x) { return x === d[0]; })) maju.push(d[0]);
          if (kk === 0 && T >= 2) {
            var e = md(d[1] - d[0], L);
            if (d[0] !== 0 && e !== 0 && d.every(function (x, u2) { return x === md(d[0] + e * u2, L); })) maju.push(md(d[0] + e * T, L));
            if (d[0] !== d[1] && d.every(function (x, u2) { return x === d[u2 % 2]; })) maju.push(d[T % 2]);
          }
          maju.forEach(function (dd) {
            var P2 = [];
            for (var q2 = 0; q2 < n; q2++) P2[md(q2 + kk, n)] = S[md(I[T][q2] + dd, L)];
            catat(P2);
          });
        }
      });
    }

    // E. satu corak menjalar
    U.forEach(function (X) {
      var C = seq.map(function (A) { var s = []; A.forEach(function (c, q) { if (c === X) s.push(q); }); return s; });
      var cnt = C.map(function (s) { return s.length; });
      [1, 2].forEach(function (m) {
        for (var u = 0; u < V; u++) if (cnt[u] !== Math.min(n, cnt[0] + m * u)) return;
        for (var s0 = 0; s0 < n; s0++) {
          [1, -1].forEach(function (dir) {
            function busur(c) { var b = []; for (var j = 0; j < Math.min(n, c); j++) b.push(md(s0 + dir * j, n)); return b.sort(function (a, b2) { return a - b2; }); }
            for (var u2 = 0; u2 < V; u2++) if (busur(cnt[u2]).join(',') !== C[u2].join(',')) return;
            var dasar = {};
            for (u2 = 0; u2 < V; u2++) {
              for (var q = 0; q < n; q++) {
                if (C[u2].indexOf(q) >= 0) continue;
                if (punya(dasar, q) && dasar[q] !== seq[u2][q]) return;
                dasar[q] = seq[u2][q];
              }
            }
            var b = busur(cnt[T] + m), P3 = [];
            for (q = 0; q < n; q++) P3[q] = b.indexOf(q) >= 0 ? X : dasar[q];
            catat(P3);
          });
        }
      });
    });

    // F. berulang
    for (var pp = 1; pp <= 3; pp++) {
      if (V < pp + 2) continue;
      var ul = true;
      for (t = pp; t < V; t++) if (!sama(seq[t], seq[t - pp])) { ul = false; break; }
      if (ul) catat(seq[V - pp]);
    }
    return Object.keys(hasil);
  }

  function ramalBentuk(seq) {
    var V = seq.length, hasil = {};
    for (var p = 1; p <= 3; p++) {
      if (V < p + 2) continue;
      var ok = true;
      for (var t = p; t < V; t++) if (seq[t] !== seq[t - p]) { ok = false; break; }
      if (ok) hasil[seq[V - p]] = 1;
    }
    return Object.keys(hasil);
  }

  /** Bangun sah: tata dikenal, bentuk luar sesuai, banyak lapis dan bagian sesuai, semua kode corak dikenal. */
  function bangunSah(f) {
    var tt = f && TATA[f.tata];
    if (!tt || tt.n.indexOf(f.n) < 0 || tt.luar.indexOf(f.luar) < 0 || typeof f.awal !== 'number') return false;
    if (!Array.isArray(f.lapis) || f.lapis.length !== tt.lapis) return false;
    return f.lapis.every(function (A) { return Array.isArray(A) && A.length === f.n && A.every(function (c) { return KODE.indexOf(c) >= 0; }); });
  }

  function periksa(b, m, alat) {
    var H = alat.HURUF, sj = alat.sj;
    var t = alat.bacaTampilan(b, m, 'scorak-deret', 'scorak-opsi', function (x) { return x.fig || null; });
    if (!t) return;
    var kotak = t.soal.kotak;
    if (sj(kotak) !== sj(b.model.kotak)) m.push('deret bangun yang tergambar berbeda dari data model');
    if (!Array.isArray(kotak) || kotak.length < 4 || kotak.length > 5) { m.push('deret harus berisi 4-5 kotak tampak'); return; }
    if (!kotak.every(bangunSah)) { m.push('ada kotak dengan tata, bentuk luar, pembagian, atau kode corak yang tidak dikenal'); return; }
    var f0 = kotak[0];
    if (kotak.some(function (f) { return f.tata !== f0.tata || f.n !== f0.n || f.awal !== f0.awal; })) { m.push('pembagian bangun tidak sama pada semua kotak'); return; }
    if (f0.tata !== 'sinar' && kotak.some(function (f) { return f.luar !== f0.luar; })) { m.push('bentuk luar bangun dua lapis berubah'); return; }
    for (var i = 1; i < kotak.length; i++) if (sj(kotak[i].lapis) === sj(kotak[i - 1].lapis) && kotak[i].luar === kotak[i - 1].luar) { m.push('kotak ' + (i + 1) + ' sama dengan kotak sebelumnya'); return; }
    var ramal = [];
    for (var l = 0; l < f0.lapis.length; l++) {
      var r = ramalLapis(kotak.map(function (f) { return f.lapis[l]; }), f0.n);
      if (!r.length) { m.push('lapis ' + (l + 1) + ' tidak cocok dengan aturan perpindahan atau pergantian corak mana pun'); return; }
      if (r.length > 1) { m.push('ambigu: lapis ' + (l + 1) + ' cocok dengan beberapa aturan yang meramalkan ' + r.length + ' susunan berbeda'); return; }
      ramal.push(r[0]);
    }
    var rb = ramalBentuk(kotak.map(function (f) { return f.luar; }));
    if (rb.length !== 1) { m.push(rb.length ? 'ambigu: bentuk luar dapat berlanjut ke ' + rb.join(' atau ') : 'bentuk luar tidak mengikuti pola berulang'); return; }
    var cocok = [];
    t.opsi.forEach(function (f, j) {
      if (!bangunSah(f) || f.tata !== f0.tata || f.n !== f0.n || f.awal !== f0.awal) { m.push('opsi ' + H[j] + ' tidak berpembagian sama dengan deret'); return; }
      if (f.luar === rb[0] && f.lapis.every(function (A, l2) { return A.join(',') === ramal[l2]; })) cocok.push(j);
    });
    alat.tepatSatu(b, m, cocok, 'aturan perpindahan dan pergantian corak');
  }

  /** Sidik: pembagian bangun, lalu setiap kotak (yang tampak dan kunci) sebagai bentuk luar + corak. */
  function sidik(b) {
    var md2 = b.model, kunci = md2.pilihan[md2.kunciIndex], f0 = md2.kotak[0];
    return [f0.tata + ':' + f0.n + ':' + f0.awal].concat(md2.kotak.concat([kunci]).map(function (f) {
      return f.luar + ':' + f.lapis.map(function (A) { return A.join(','); }).join('/');
    }));
  }

  var TIPE_CEK = { periksa: periksa, sidik: sidik, batas: 1 };
  return {
    TIPE: { 'serial-corak-putar': TIPE_CEK, 'serial-corak-ganti': TIPE_CEK },
    ramalLapis: ramalLapis
  };
});
