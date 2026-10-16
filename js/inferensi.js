/*
 * inferensi.js — menebak aturan pola figural dari kotak-kotak yang TERLIHAT.
 *
 * Inilah yang dilakukan peserta, dan inilah yang dipakai validator untuk
 * memastikan sebuah soal figural punya jawaban tunggal: dari nilai yang tampak
 * pada satu kanal (bentuk, isi, arah, titik, jumlah, penanda), daftarkan SEMUA
 * aturan dalam pustaka yang cocok dengan semua kotak yang terlihat, lalu hitung
 * nilai kotak yang hilang menurut tiap aturan itu.
 *
 *   status 'unik'       semua aturan yang cocok memberi nilai yang sama
 *   status 'ambigu'     ada aturan cocok yang memberi nilai lain  -> soal cacat
 *   status 'tidak-ada'  tidak ada aturan pustaka yang cocok         -> soal cacat
 *
 * Pustaka aturan (nilai kanal berupa bilangan bulat 0..n-1):
 *
 *   deret      siklus p (berulang tiap p kotak; harus ada satu pengulangan yang
 *              terlihat), langkah k (menambah k tiap kotak, modulo n pada kanal
 *              siklik), pantul (bolak-balik pada 0..n-1), tambah d (kanal bilangan)
 *   matriks 3x3  latin (tiap baris dan kolom memuat tiga nilai berbeda),
 *              baris-tetap, kolom-tetap, langkah-baris, langkah-kolom, xor-baris
 *              (kanal biner), jumlah-baris dan jumlah-kolom (kanal bilangan)
 *   matriks 2x2  penambahan: kotak kanan-bawah = kanan-atas + kiri-bawah - kiri-atas
 *
 * Berkas ini sengaja tidak mengimpor penyusun soal: kalau penyusun dan
 * pemeriksa berbagi kode yang sama, keduanya hanya mengulangi asumsi yang sama.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Inferensi = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /** Sifat tiap kanal: banyak nilai dan jenisnya. */
  var KANAL = {
    bentuk: { n: 4, tipe: 'nominal' },
    isi: { n: 3, tipe: 'siklik' },
    arah: { n: 8, tipe: 'siklik' },
    titik: { n: 2, tipe: 'siklik' },
    jumlah: { n: 6, tipe: 'bilangan' },
    penanda: { n: 4, tipe: 'siklik' }
  };

  function mod(a, n) { return ((a % n) + n) % n; }

  function ringkas(kandidat) {
    var nilai = [];
    kandidat.forEach(function (k) { if (nilai.indexOf(k.prediksi) < 0) nilai.push(k.prediksi); });
    var status = kandidat.length === 0 ? 'tidak-ada' : (nilai.length === 1 ? 'unik' : 'ambigu');
    return { status: status, nilai: status === 'unik' ? nilai[0] : null, semua: nilai, kandidat: kandidat };
  }

  function bolehNilai(info, v) { return v >= 0 && v < info.n; }

  // =============================================================== deret

  function pantulIndeks(i, m) {
    var periode = 2 * (m - 1), r = mod(i, periode);
    return r < m ? r : periode - r;
  }

  /**
   * @param {object} info sifat kanal ({n, tipe})
   * @param {Array<number>} v nilai kotak yang terlihat, berurutan
   * @returns kandidat aturan dan nilai kotak berikutnya
   */
  function deret(info, v) {
    var L = v.length, kandidat = [], i, p, k;
    // siklus p: harus ada setidaknya satu pengulangan yang terlihat (L > p)
    for (p = 1; p < L; p++) {
      var ok = true;
      for (i = p; i < L; i++) if (v[i] !== v[i - p]) { ok = false; break; }
      if (ok) kandidat.push({ aturan: 'siklus-' + p, prediksi: v[L - p] });
    }
    if (info.tipe === 'siklik') {
      for (k = 1; k < info.n; k++) {
        var ok2 = true;
        for (i = 0; i < L; i++) if (v[i] !== mod(v[0] + k * i, info.n)) { ok2 = false; break; }
        if (ok2) kandidat.push({ aturan: 'langkah-' + k, prediksi: mod(v[0] + k * L, info.n) });
      }
      // pantul 0..n-1 (hanya bermakna bila n >= 3)
      if (info.n >= 3) {
        var periode = 2 * (info.n - 1);
        for (var fase = 0; fase < periode; fase++) {
          var ok3 = true;
          for (i = 0; i < L; i++) if (v[i] !== pantulIndeks(fase + i, info.n)) { ok3 = false; break; }
          if (ok3) kandidat.push({ aturan: 'pantul-' + fase, prediksi: pantulIndeks(fase + L, info.n) });
        }
      }
    }
    if (info.tipe === 'bilangan' && L >= 2) {
      var d = v[1] - v[0];
      if (d !== 0) {
        var ok4 = true;
        for (i = 0; i < L; i++) if (v[i] !== v[0] + d * i) { ok4 = false; break; }
        var nilai = v[0] + d * L;
        if (ok4 && bolehNilai(info, nilai)) kandidat.push({ aturan: 'tambah-' + d, prediksi: nilai });
      }
    }
    return ringkas(kandidat);
  }

  // ========================================================== matriks 3x3

  function sel(g, r, c) { return g[r][c]; }

  function transposisi(g) {
    return [[g[0][0], g[1][0], g[2][0]], [g[0][1], g[1][1], g[2][1]], [g[0][2], g[1][2], g[2][2]]];
  }

  function bedaBaris(info, a, b) { return info.tipe === 'siklik' ? mod(b - a, info.n) : b - a; }

  /** Aturan "langkah" pada baris (bila `kolom` = false) dengan g sudah ditranspos untuk kolom. */
  function langkahBaris(info, g, mr, mc, nama) {
    var kandidat = [], k = null, ada = true, r, c;
    for (r = 0; r < 3 && ada; r++) {
      for (c = 0; c < 2; c++) {
        if (g[r][c] === null || g[r][c + 1] === null) continue;
        var d = bedaBaris(info, g[r][c], g[r][c + 1]);
        if (k === null) k = d; else if (d !== k) { ada = false; break; }
      }
    }
    if (!ada || k === null || k === 0) return kandidat;
    var asal = null;
    if (mc > 0 && g[mr][mc - 1] !== null) asal = info.tipe === 'siklik' ? mod(g[mr][mc - 1] + k, info.n) : g[mr][mc - 1] + k;
    var asal2 = null;
    if (mc < 2 && g[mr][mc + 1] !== null) asal2 = info.tipe === 'siklik' ? mod(g[mr][mc + 1] - k, info.n) : g[mr][mc + 1] - k;
    if (asal === null && asal2 === null) return kandidat;
    if (asal !== null && asal2 !== null && asal !== asal2) return kandidat;
    var nilai = asal !== null ? asal : asal2;
    if (!bolehNilai(info, nilai)) return kandidat;
    // setiap baris yang lengkap harus memenuhi langkah yang sama pada kedua pasangan
    kandidat.push({ aturan: nama + '-' + k, prediksi: nilai });
    return kandidat;
  }

  function tetapBaris(info, g, mr, mc, nama) {
    var r, c, nilaiBaris = [];
    for (r = 0; r < 3; r++) {
      var tahu = g[r].filter(function (x) { return x !== null; });
      if (!tahu.length) return [];
      if (tahu.some(function (x) { return x !== tahu[0]; })) return [];
      nilaiBaris.push(tahu[0]);
    }
    // sel yang hilang harus punya sedikitnya dua sel lain pada barisnya (kini selalu benar: 2 sel)
    return [{ aturan: nama, prediksi: nilaiBaris[mr] }];
  }

  function jumlahBaris(info, g, mr, mc, nama) {
    var K = null, r;
    for (r = 0; r < 3; r++) {
      if (g[r].some(function (x) { return x === null; })) continue;
      var s = g[r][0] + g[r][1] + g[r][2];
      if (K === null) K = s; else if (K !== s) return [];
    }
    if (K === null) return [];
    var sisa = K - g[mr].reduce(function (s2, x) { return x === null ? s2 : s2 + x; }, 0);
    if (!bolehNilai(info, sisa)) return [];
    return [{ aturan: nama + '-' + K, prediksi: sisa }];
  }

  function xorBaris(info, g, mr, mc) {
    if (info.n !== 2) return [];
    var r, tahu;
    for (r = 0; r < 3; r++) {
      if (g[r].some(function (x) { return x === null; })) {
        continue;
      }
      if ((g[r][0] ^ g[r][1]) !== g[r][2]) return [];
    }
    var lain = g[mr].filter(function (x) { return x !== null; });
    return [{ aturan: 'xor-baris', prediksi: lain[0] ^ lain[1] }];
  }

  function latin(info, g, mr, mc) {
    var r, c, S = [];
    for (r = 0; r < 3; r++) for (c = 0; c < 3; c++) {
      if (g[r][c] !== null && S.indexOf(g[r][c]) < 0) S.push(g[r][c]);
    }
    if (S.length !== 3) return [];
    function barisSah(arr) {
      var tahu = arr.filter(function (x) { return x !== null; });
      var unik = tahu.filter(function (x, i) { return tahu.indexOf(x) === i; });
      return unik.length === tahu.length;
    }
    var t = transposisi(g);
    for (r = 0; r < 3; r++) if (!barisSah(g[r]) || !barisSah(t[r])) return [];
    var tahuB = g[mr].filter(function (x) { return x !== null; }), tahuK = t[mc].filter(function (x) { return x !== null; });
    var sisaB = S.filter(function (x) { return tahuB.indexOf(x) < 0; }), sisaK = S.filter(function (x) { return tahuK.indexOf(x) < 0; });
    if (sisaB.length !== 1 || sisaK.length !== 1 || sisaB[0] !== sisaK[0]) return [];
    return [{ aturan: 'latin', prediksi: sisaB[0] }];
  }

  /**
   * @param {object} info sifat kanal
   * @param {Array<Array<number|null>>} g matriks 3x3 dengan satu null (sel hilang)
   * @param {number} mr baris sel hilang
   * @param {number} mc kolom sel hilang
   */
  function matriks3(info, g, mr, mc) {
    var kandidat = [], t = transposisi(g);
    kandidat = kandidat.concat(latin(info, g, mr, mc));
    kandidat = kandidat.concat(tetapBaris(info, g, mr, mc, 'baris-tetap'));
    kandidat = kandidat.concat(tetapBaris(info, t, mc, mr, 'kolom-tetap'));
    if (info.tipe !== 'nominal') {
      kandidat = kandidat.concat(langkahBaris(info, g, mr, mc, 'langkah-baris'));
      kandidat = kandidat.concat(langkahBaris(info, t, mc, mr, 'langkah-kolom'));
    }
    kandidat = kandidat.concat(xorBaris(info, g, mr, mc));
    if (info.tipe === 'bilangan') {
      kandidat = kandidat.concat(jumlahBaris(info, g, mr, mc, 'jumlah-baris'));
      kandidat = kandidat.concat(jumlahBaris(info, t, mc, mr, 'jumlah-kolom'));
    }
    return ringkas(kandidat);
  }

  // ========================================================== matriks 2x2

  /**
   * g = [[a, b], [c, null]]: kotak kanan-bawah = b + c - a (modulo n pada kanal siklik,
   * bilangan bulat pada kanal bilangan, dan dua nilai bertukar pada kanal nominal).
   */
  function matriks2(info, g) {
    var a = g[0][0], b = g[0][1], c = g[1][0], nilai;
    if (info.tipe === 'siklik') nilai = mod(b + c - a, info.n);
    else if (info.tipe === 'bilangan') nilai = b + c - a;
    else {
      // nominal: hanya dua nilai yang dipakai; petakan ke 0/1
      var nilaiDua = [];
      [a, b, c].forEach(function (x) { if (nilaiDua.indexOf(x) < 0) nilaiDua.push(x); });
      if (nilaiDua.length !== 2) return ringkas([]);
      var m = function (x) { return x === nilaiDua[0] ? 0 : 1; };
      nilai = nilaiDua[mod(m(b) + m(c) - m(a), 2)];
      return ringkas([{ aturan: 'tambah-2x2', prediksi: nilai }]);
    }
    if (!bolehNilai(info, nilai)) return ringkas([]);
    return ringkas([{ aturan: 'tambah-2x2', prediksi: nilai }]);
  }

  return {
    KANAL: KANAL, mod: mod, deret: deret, matriks3: matriks3, matriks2: matriks2,
    pantulIndeks: pantulIndeks
  };
});
