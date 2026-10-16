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
 * Bentuk soal riset yang tidak terurai menjadi kanal (masing-masing satu fungsi):
 *
 *   latinLubang  matriks 5x5: semua cara mengisi lubang sehingga tiap baris dan kolom
 *                tetap memuat lambang yang berbeda; harus tepat satu
 *   bentukWarna  matriks 5x6: pustaka aturan bentuk (isi kolom sama, isi baris sama,
 *                kolom/baris saling geser) dan aturan warna (menurut bentuk, bentuk dan
 *                paritas baris/kolom, papan catur, per baris, per kolom). Aturan BERLAKU
 *                bila ada pengisian lubang yang memenuhinya; jawaban adalah pengisian yang
 *                memenuhi SEMUA aturan yang berlaku, dan harus tepat satu
 *   sekat        matriks 2x2 bersekat: pustaka asal belahan gambar pojok (kiriman
 *                tetangga, kiriman tetangga yang tertukar atau yang menghadap ke tempat
 *                lain, salinan gambar dalam sendiri atau seberang, salinan pojok lain) dan
 *                pola bentuk pojok 2x2
 *   ganda        deret kotak ganda: tiap bagian gambar atas dijelaskan oleh "tetap",
 *                "berubah tiap kotak", atau "berubah bila belah ketupat ke-d abu-abu"
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

  // ===================================================== matriks latin (5x5)

  function hasil(status, nilai, lain) {
    var o = { status: status, nilai: status === 'unik' ? nilai : null };
    Object.keys(lain || {}).forEach(function (k) { o[k] = lain[k]; });
    return o;
  }

  /**
   * Isi lubang matriks n x n sehingga setiap baris dan kolom memuat lambang 0..n-1 yang
   * berbeda. Aturan hanya dianggap terlihat bila kotak yang tampak sudah memenuhinya dan
   * sedikitnya satu baris dan satu kolom tampak utuh.
   * @param {Array<Array<number|null>>} g null = kotak lubang
   * @returns {{status, nilai: Array<number> (nilai lubang urut baris), lubang: Array<[r,c]>, semua}}
   */
  function latinLubang(g, n) {
    var lubang = [], r, c, k;
    if (!Array.isArray(g) || g.length !== n || g.some(function (row) { return !Array.isArray(row) || row.length !== n; })) return hasil('tidak-ada', null, { pesan: 'matriks bukan ' + n + 'x' + n });
    for (r = 0; r < n; r++) {
      for (c = 0; c < n; c++) {
        var v = g[r][c];
        if (v === null) lubang.push([r, c]);
        else if (!(v >= 0 && v < n && v % 1 === 0)) return hasil('tidak-ada', null, { pesan: 'lambang di luar domain: ' + v });
      }
    }
    function bedaSemua(xs) { var t = xs.filter(function (x) { return x !== null; }); return t.every(function (x, i) { return t.indexOf(x) === i; }); }
    var utuhB = 0, utuhK = 0;
    for (k = 0; k < n; k++) {
      var bar = g[k], kol = g.map(function (row) { return row[k]; });
      if (!bedaSemua(bar) || !bedaSemua(kol)) return hasil('tidak-ada', null, { pesan: 'ada lambang berulang pada baris/kolom ' + (k + 1), lubang: lubang });
      if (bar.indexOf(null) < 0) utuhB++;
      if (kol.indexOf(null) < 0) utuhK++;
    }
    if (!lubang.length || !utuhB || !utuhK) return hasil('tidak-ada', null, { pesan: 'aturan tidak terlihat (tak ada baris/kolom utuh atau tak ada lubang)', lubang: lubang });
    var h = g.map(function (row) { return row.slice(); }), semua = [], isi = [];
    function boleh(rr, cc, v) {
      for (var j = 0; j < n; j++) if (h[rr][j] === v || h[j][cc] === v) return false;
      return true;
    }
    (function cari(i) {
      if (semua.length > 4) return;
      if (i === lubang.length) { semua.push(isi.slice()); return; }
      var rr = lubang[i][0], cc = lubang[i][1];
      for (var v = 0; v < n; v++) {
        if (!boleh(rr, cc, v)) continue;
        h[rr][cc] = v; isi.push(v);
        cari(i + 1);
        isi.pop(); h[rr][cc] = null;
      }
    })(0);
    return hasil(semua.length === 1 ? 'unik' : (semua.length ? 'ambigu' : 'tidak-ada'), semua[0], { lubang: lubang, semua: semua });
  }

  // ======================================================= matriks 5x6 (bentuk dan warna)

  function urutGabung(xs) { return xs.slice().sort().join(','); }
  function putaranDari(a, b) {
    if (a.length !== b.length) return false;
    var sa = a.join(','), dua = b.concat(b).join(',');
    return (',' + dua + ',').indexOf(',' + sa + ',') >= 0;
  }
  function kolomDari(G, c) { return G.map(function (row) { return row[c]; }); }

  /** Aturan bentuk: predikat pada matriks bentuk B (lengkap). */
  var ATURAN_BENTUK = {
    'kolom-sama': function (B) { var s0 = urutGabung(kolomDari(B, 0)); for (var c = 1; c < B[0].length; c++) if (urutGabung(kolomDari(B, c)) !== s0) return false; return true; },
    'baris-sama': function (B) { var s0 = urutGabung(B[0]); for (var r = 1; r < B.length; r++) if (urutGabung(B[r]) !== s0) return false; return true; },
    'kolom-geser': function (B) { var k0 = kolomDari(B, 0); for (var c = 1; c < B[0].length; c++) if (!putaranDari(kolomDari(B, c), k0)) return false; return true; },
    'baris-geser': function (B) { for (var r = 1; r < B.length; r++) if (!putaranDari(B[r], B[0])) return false; return true; }
  };

  /**
   * Aturan warna berbentuk "warna XOR geser = f(kelompok)": tiap kotak (r, c, bentuk b) masuk
   * satu kelompok, dan warnanya setelah di-XOR dengan `x` harus sama dalam satu kelompok.
   */
  var ATURAN_WARNA = {
    'warna-bentuk': function (r, c, b) { return [b, 0]; },
    'warna-bentuk-baris': function (r, c, b) { return [b, r % 2]; },
    'warna-bentuk-kolom': function (r, c, b) { return [b, c % 2]; },
    'warna-catur': function (r, c) { return [0, (r + c) % 2]; },
    'warna-baris': function (r) { return [r, 0]; },
    'warna-kolom': function (r, c) { return [c, 0]; }
  };

  /** Tabel kelompok -> warna dari kotak yang tampak; null bila kotak tampak sudah bertentangan. */
  function tabelWarna(kunci, G) {
    var peta = {};
    for (var r = 0; r < G.length; r++) {
      for (var c = 0; c < G[r].length; c++) {
        if (G[r][c] === null) continue;
        var k = kunci(r, c, G[r][c].b), v = G[r][c].i ^ k[1];
        if (peta[k[0]] === undefined) peta[k[0]] = v; else if (peta[k[0]] !== v) return null;
      }
    }
    return peta;
  }

  /**
   * @param {Array<Array<{b,i}|null>>} G matriks bentuk (b: 0..nBentuk-1) dan warna (i: 0/1); null = lubang
   * @returns {{status, nilai: Array<{b,i}> (urut baris), lubang, aturan: Array<string>}}
   */
  function bentukWarna(G, nBentuk) {
    var lubang = [], r, c;
    if (!Array.isArray(G) || !G.length || G.some(function (row) { return !Array.isArray(row) || row.length !== G[0].length; })) return hasil('tidak-ada', null, { pesan: 'matriks tidak persegi panjang' });
    for (r = 0; r < G.length; r++) {
      for (c = 0; c < G[r].length; c++) {
        var x = G[r][c];
        if (x === null) { lubang.push([r, c]); continue; }
        if (!x || !(x.b >= 0 && x.b < nBentuk && x.b % 1 === 0) || (x.i !== 0 && x.i !== 1)) return hasil('tidak-ada', null, { pesan: 'kotak (' + (r + 1) + ',' + (c + 1) + ') tidak sah' });
      }
    }
    if (!lubang.length || lubang.length > 6) return hasil('tidak-ada', null, { pesan: 'banyak kotak lubang tidak sah: ' + lubang.length });
    var B = G.map(function (row) { return row.map(function (x) { return x ? x.b : null; }); });
    var namaB = Object.keys(ATURAN_BENTUK), k = lubang.length;
    // aturan warna yang tidak bertentangan dengan kotak tampak, beserta tabelnya
    var namaW = [], tabel = {};
    Object.keys(ATURAN_WARNA).forEach(function (nm) { var p = tabelWarna(ATURAN_WARNA[nm], G); if (p) { namaW.push(nm); tabel[nm] = p; } });
    function cocokWarna(nm, sb, sw) {
      var kunci = ATURAN_WARNA[nm], peta = tabel[nm], sementara = {};
      for (var jj = 0; jj < k; jj++) {
        var kk = kunci(lubang[jj][0], lubang[jj][1], sb[jj]), v = sw[jj] ^ kk[1];
        if (peta[kk[0]] !== undefined && peta[kk[0]] !== v) return false;
        if (sementara[kk[0]] !== undefined && sementara[kk[0]] !== v) return false;
        sementara[kk[0]] = v;
      }
      return true;
    }
    var calon = [], adaB = {}, adaW = {}, nb = Math.pow(nBentuk, k), nw = Math.pow(2, k), i, j;
    for (i = 0; i < nb; i++) {
      var sb = [], t = i;
      for (j = 0; j < k; j++) { sb.push(t % nBentuk); t = Math.floor(t / nBentuk); B[lubang[j][0]][lubang[j][1]] = sb[j]; }
      var okB = namaB.filter(function (nm) { return ATURAN_BENTUK[nm](B); });
      okB.forEach(function (nm) { adaB[nm] = 1; });
      for (var f = 0; f < nw; f++) {
        var sw = [];
        for (j = 0; j < k; j++) sw.push((f >> j) & 1);
        var okW = namaW.filter(function (nm) { return cocokWarna(nm, sb, sw); });
        okW.forEach(function (nm) { adaW[nm] = 1; });
        calon.push({ b: sb, w: sw, okB: okB, okW: okW });
      }
    }
    var berlakuB = namaB.filter(function (nm) { return adaB[nm]; }), berlakuW = namaW.filter(function (nm) { return adaW[nm]; });
    var cocok = calon.filter(function (x) {
      return berlakuB.every(function (nm) { return x.okB.indexOf(nm) >= 0; }) && berlakuW.every(function (nm) { return x.okW.indexOf(nm) >= 0; });
    });
    var nilai = cocok.length ? cocok[0].b.map(function (b, jj) { return { b: b, i: cocok[0].w[jj] }; }) : null;
    var status = !berlakuB.length || !berlakuW.length || !cocok.length ? 'tidak-ada' : (cocok.length === 1 ? 'unik' : 'ambigu');
    return hasil(status, nilai, { lubang: lubang, aturan: berlakuB.concat(berlakuW), banyak: cocok.length });
  }

  // ========================================================= matriks 2x2 bersekat

  var LETAK_KUADRAN = [[0, 0], [0, 1], [1, 1], [1, 0]];   // kiri atas, kanan atas, kanan bawah, kiri bawah
  function kuadranDi(br, kl) { for (var q = 0; q < 4; q++) if (LETAK_KUADRAN[q][0] === br && LETAK_KUADRAN[q][1] === kl) return q; return -1; }

  /**
   * Peran kedua belahan gambar f di kuadran q: belahan yang menghadap tetangga mendatar
   * (h) dan yang menghadap tetangga tegak (v). null bila letak belahannya tidak begitu.
   */
  function peranBelahan(f, q) {
    if (!f || !f.belahan) return null;
    var nama = Object.keys(f.belahan);
    if (nama.length !== 2) return null;
    var kl = LETAK_KUADRAN[q][1], br = LETAK_KUADRAN[q][0], keH = kl === 0 ? 'kanan' : 'kiri', keV = br === 0 ? 'bawah' : 'atas';
    var h = null, v = null;
    for (var i = 0; i < 2; i++) {
      var p = nama[i].split('-');
      if (p.length !== 2 || ['kiri', 'kanan'].indexOf(p[0]) < 0 || ['atas', 'bawah'].indexOf(p[1]) < 0) return null;
      var hadapH = p[0] === keH, hadapV = p[1] === keV;
      if (hadapH && !hadapV) h = nama[i]; else if (hadapV && !hadapH) v = nama[i]; else return null;
    }
    if (!h || !v) return null;
    return { h: f.belahan[h], v: f.belahan[v], namaH: h, namaV: v };
  }

  /**
   * @param {Array<object|null>} pojok gambar pojok tiap kuadran (null pada `tanya`)
   * @param {Array<object>} dalam gambar segitiga dalam tiap kuadran
   * @returns {{status, nilai: {bentuk, h, v}, aturan: Array<string>}}
   */
  function sekat(pojok, dalam, tanya) {
    if (!Array.isArray(pojok) || !Array.isArray(dalam) || pojok.length !== 4 || dalam.length !== 4 || !(tanya >= 0 && tanya < 4)) return hasil('tidak-ada', null, { pesan: 'struktur tidak sah' });
    if (pojok[tanya] !== null) return hasil('tidak-ada', null, { pesan: 'pojok yang ditanyakan tidak kosong' });
    var pd = [], pp = [], q;
    for (q = 0; q < 4; q++) {
      pd.push(peranBelahan(dalam[q], q));
      if (!pd[q]) return hasil('tidak-ada', null, { pesan: 'belahan gambar dalam kuadran ' + (q + 1) + ' tidak menghadap kedua tetangganya' });
      if (q === tanya) { pp.push(null); continue; }
      pp.push(peranBelahan(pojok[q], q));
      if (!pp[q]) return hasil('tidak-ada', null, { pesan: 'belahan gambar pojok kuadran ' + (q + 1) + ' tidak menghadap kedua tetangganya' });
    }
    function tH(x) { return kuadranDi(LETAK_KUADRAN[x][0], 1 - LETAK_KUADRAN[x][1]); }
    function tV(x) { return kuadranDi(1 - LETAK_KUADRAN[x][0], LETAK_KUADRAN[x][1]); }
    function tD(x) { return kuadranDi(1 - LETAK_KUADRAN[x][0], 1 - LETAK_KUADRAN[x][1]); }
    function salinPojok(y, tukar) { return pp[y] ? (tukar ? [pp[y].v, pp[y].h] : [pp[y].h, pp[y].v]) : null; }
    // tiap aturan: kuadran x -> [h, v] ramalan, atau null bila tak bisa diramal
    // ("tertukar" pada kuadran seberang sama dengan menyalin gambar persis, karena arah belahnya sama)
    var ATURAN = {
      'geser': function (x) { return [pd[tH(x)].h, pd[tV(x)].v]; },
      'geser-tertukar': function (x) { return [pd[tV(x)].v, pd[tH(x)].h]; },
      'geser-sisa': function (x) { return [pd[tH(x)].v, pd[tV(x)].h]; },
      'geser-sisa-tertukar': function (x) { return [pd[tV(x)].h, pd[tH(x)].v]; },
      'salin-dalam': function (x) { return [pd[x].h, pd[x].v]; },
      'salin-dalam-tertukar': function (x) { return [pd[x].v, pd[x].h]; },
      'dalam-seberang': function (x) { return [pd[tD(x)].h, pd[tD(x)].v]; },
      'dalam-seberang-tertukar': function (x) { return [pd[tD(x)].v, pd[tD(x)].h]; },
      'pojok-seberang': function (x) { return salinPojok(tD(x), false); },
      'pojok-seberang-tertukar': function (x) { return salinPojok(tD(x), true); },
      'pojok-samping': function (x) { return salinPojok(tH(x), false); },
      'pojok-samping-tertukar': function (x) { return salinPojok(tH(x), true); },
      'pojok-atas-bawah': function (x) { return salinPojok(tV(x), false); },
      'pojok-atas-bawah-tertukar': function (x) { return salinPojok(tV(x), true); }
    };
    var berlaku = [], ramalan = [];
    Object.keys(ATURAN).forEach(function (nm) {
      var teruji = 0, cocok = true;
      for (var x = 0; x < 4 && cocok; x++) {
        if (x === tanya) continue;
        var r = ATURAN[nm](x);
        if (!r || r[0] === undefined || r[1] === undefined) continue;
        teruji++;
        if (r[0] !== pp[x].h || r[1] !== pp[x].v) cocok = false;
      }
      if (!cocok || !teruji) return;
      var rt = ATURAN[nm](tanya);
      if (!rt || rt[0] === undefined || rt[1] === undefined) return;
      berlaku.push(nm);
      ramalan.push(rt[0] + '|' + rt[1]);
    });
    if (!berlaku.length) return hasil('tidak-ada', null, { pesan: 'tak satu pun aturan pustaka cocok dengan ketiga pojok yang tampak', aturan: [] });
    var beda = ramalan.filter(function (x, i) { return ramalan.indexOf(x) === i; });
    // bentuk pojok: pola 2x2 (sama, per baris, per kolom, atau bersilang) dibaca sebagai analogi
    var bH = pojok[tH(tanya)].bentuk, bV = pojok[tV(tanya)].bentuk, bD = pojok[tD(tanya)].bentuk;
    var dua = [bH, bV, bD].filter(function (x, i, arr) { return arr.indexOf(x) === i; });
    if (dua.length > 2) return hasil('tidak-ada', null, { pesan: 'bentuk gambar pojok lebih dari dua macam', aturan: berlaku });
    var bentuk;
    if (bH === bD) bentuk = bV;
    else bentuk = bV === bH ? bD : bH;
    if (beda.length !== 1) return hasil('ambigu', null, { aturan: berlaku, semua: beda });
    var hv = beda[0].split('|').map(Number);
    return hasil('unik', { bentuk: bentuk, h: hv[0], v: hv[1] }, { aturan: berlaku });
  }

  // ============================================================ deret kotak ganda

  function ubahWarna(w, jenis) {
    var m3 = function (x, k) { return ((x + k) % 3 + 3) % 3; };
    switch (jenis) {
      case 'putar+1': return [w[3], w[0], w[1], w[2]];
      case 'putar-1': return [w[1], w[2], w[3], w[0]];
      case 'putar+2': return [w[2], w[3], w[0], w[1]];
      case 'siklus+1': return w.map(function (x) { return m3(x, 1); });
      case 'siklus-1': return w.map(function (x) { return m3(x, -1); });
      case 'tukar-baris': return [w[3], w[2], w[1], w[0]];
      case 'tukar-kolom': return [w[1], w[0], w[3], w[2]];
    }
    return null;
  }

  var UBAH_GANDA = {
    warna: ['putar+1', 'putar-1', 'putar+2', 'siklus+1', 'siklus-1', 'tukar-baris', 'tukar-kolom'].map(function (j) { return { id: j, f: function (w) { return ubahWarna(w, j); } }; }),
    panah: [1, -1, 2].map(function (k) { return { id: 'geser' + k, f: function (x) { return mod(x + k, 4); } }; }),
    penanda: [1, -1, 2].map(function (k) { return { id: 'geser' + k, f: function (x) { return mod(x + k, 4); } }; }),
    bingkai: [1, -1, 2].map(function (k) { return { id: 'geser' + k, f: function (x) { return x < 0 ? x : mod(x + k, 4); } }; })
  };

  function sahAtas(at) {
    return at && Array.isArray(at.warna) && at.warna.length === 4 && at.warna.every(function (x) { return x === 0 || x === 1 || x === 2; }) &&
      [0, 1, 2, 3].indexOf(at.panah) >= 0 && [0, 1, 2, 3].indexOf(at.penanda) >= 0 && [-1, 0, 1, 2, 3].indexOf(at.bingkai) >= 0;
  }

  /**
   * @param {Array<object>} atas bagian atas kotak 1..m (yang tampak)
   * @param {Array<Array<0|1>>} bawah kode belah ketupat kotak 1..m+1
   * @returns {{status, nilai: object (bagian atas kotak berikutnya), rinci: {bagian: {status, aturan}}}}
   */
  function ganda(atas, bawah) {
    if (!Array.isArray(atas) || !Array.isArray(bawah) || atas.length < 3 || bawah.length !== atas.length + 1) return hasil('tidak-ada', null, { pesan: 'struktur deret tidak sah' });
    if (!atas.every(sahAtas)) return hasil('tidak-ada', null, { pesan: 'bagian atas kotak tidak sah' });
    var nK = bawah[0].length;
    if (!bawah.every(function (b) { return Array.isArray(b) && b.length === nK && b.every(function (x) { return x === 0 || x === 1; }); })) return hasil('tidak-ada', null, { pesan: 'kode belah ketupat tidak sah' });
    var m = atas.length, rinci = {}, nilai = {}, status = 'unik';
    ['warna', 'panah', 'penanda', 'bingkai'].forEach(function (bg) {
      var seri = atas.map(function (at) { return at[bg]; }), sj = function (x) { return JSON.stringify(x); };
      var hip = [], t;
      if (seri.every(function (x) { return sj(x) === sj(seri[0]); })) hip.push({ aturan: 'tetap', ramal: seri[m - 1] });
      UBAH_GANDA[bg].forEach(function (u) {
        var ok = true;
        for (t = 1; t < m && ok; t++) if (sj(u.f(seri[t - 1])) !== sj(seri[t])) ok = false;
        if (ok) hip.push({ aturan: 'tiap-kotak:' + u.id, ramal: u.f(seri[m - 1]) });
        for (var d = 0; d < nK; d++) {
          var ok2 = true;
          for (t = 1; t < m && ok2; t++) if (sj(bawah[t][d] ? u.f(seri[t - 1]) : seri[t - 1]) !== sj(seri[t])) ok2 = false;
          if (ok2) hip.push({ aturan: 'kode-' + d + ':' + u.id, ramal: bawah[m][d] ? u.f(seri[m - 1]) : seri[m - 1] });
        }
      });
      var beda = hip.map(function (h) { return sj(h.ramal); }).filter(function (x, i, arr) { return arr.indexOf(x) === i; });
      var st = !hip.length ? 'tidak-ada' : (beda.length === 1 ? 'unik' : 'ambigu');
      rinci[bg] = { status: st, aturan: hip.map(function (h) { return h.aturan; }) };
      if (st === 'unik') nilai[bg] = hip[0].ramal;
      else if (status === 'unik' || st === 'tidak-ada') status = st;
    });
    return hasil(status, nilai, { rinci: rinci });
  }

  return {
    KANAL: KANAL, mod: mod, deret: deret, matriks3: matriks3, matriks2: matriks2,
    pantulIndeks: pantulIndeks, latinLubang: latinLubang, bentukWarna: bentukWarna, sekat: sekat, peranBelahan: peranBelahan, ganda: ganda
  };
});
