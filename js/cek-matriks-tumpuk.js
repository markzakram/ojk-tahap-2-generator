/*
 * cek-matriks-tumpuk.js — pemeriksa independen untuk keluarga di matriks-tumpuk.js (dipanggil validator.js).
 *
 * Membaca matriks 3x3 dan kelima opsi yang TAMPIL (model gambar soal dan gambar opsi), lalu
 * menyimpulkan sendiri aturan penumpukannya tanpa memakai kode atau data aturan penyusun:
 *
 *   - unsur dibaca per jenis (ruas garis 0-19, titik hitam / lingkaran putih / tanda silang pada
 *     titik bantu 0-8); setiap jenis diperiksa terpisah, jadi aturan boleh berbeda per jenis;
 *   - pustaka aturan: fungsi per unsur f ∈ {gabung, irisan, selisih, kurang, kurang terbalik},
 *     hasilnya di kotak ke-k (k = 1, 2, atau 3) dengan dua kotak lainnya sebagai operan, dibaca per
 *     baris dan per kolom (30 aturan per jenis unsur);
 *   - aturan yang berlaku pada kedua baris/kolom lengkap diterapkan pada baris/kolom tanda tanya:
 *     untuk setiap unsur dicoba kedua kemungkinan (ada / tidak ada) di kotak "?" dan dicatat mana
 *     yang membuat aturan berlaku; aturan yang tidak dapat dipenuhi sama sekali dibuang;
 *   - setiap unsur harus punya tepat satu nilai yang diterima SEMUA aturan yang tersisa (bila ada
 *     unsur tanpa nilai: aturan saling bertentangan; dua nilai: isi "?" tidak tunggal), dan
 *     sedikitnya satu aturan sendirian sudah menentukan seluruh isi "?" — keduanya "ambigu";
 *   - tepat satu opsi sama persis dengan isi ramalan itu.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory();
    module.exports = api;
  } else {
    api = factory();
    root.CekMatriksTumpuk = api;
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var KANAL = ['garis', 'titik', 'bulat', 'silang'];
  var UKURAN = { garis: 20, titik: 9, bulat: 9, silang: 9 };
  var NAMA = { garis: 'ruas garis', titik: 'titik hitam', bulat: 'lingkaran putih', silang: 'tanda silang' };
  var FUNGSI = {
    gabung: function (x, y) { return x || y; },
    irisan: function (x, y) { return x && y; },
    selisih: function (x, y) { return x !== y; },
    kurang: function (x, y) { return x && !y; },
    'kurang terbalik': function (x, y) { return y && !x; }
  };

  function vektor(daftar, n) {
    var v = [];
    for (var i = 0; i < n; i++) v.push(false);
    daftar.forEach(function (e) { v[e] = true; });
    return v;
  }

  /** Satu kotak/opsi: tepat jenis unsur `kanal`, daftar unsur bulat, naik, tanpa ganda, dalam batas. */
  function bentukSah(f, kanal, nama, m) {
    if (!f || typeof f !== 'object') { m.push(nama + ' tidak berisi data unsur'); return false; }
    var kunci = Object.keys(f);
    if (kunci.length !== kanal.length || kanal.some(function (ch) { return !Array.isArray(f[ch]); })) { m.push(nama + ' memuat jenis unsur yang berbeda dari kotak lain'); return false; }
    var ok = kanal.every(function (ch) {
      return f[ch].every(function (e, i) { return e === Math.floor(e) && e >= 0 && e < UKURAN[ch] && (i === 0 || e > f[ch][i - 1]); });
    });
    if (!ok) { m.push(nama + ' memuat unsur di luar kerangka atau tidak terurut'); return false; }
    var terisi = {}, tumpuk = false, jumlah = 0;
    kanal.forEach(function (ch) {
      jumlah += f[ch].length;
      if (ch === 'garis') return;
      f[ch].forEach(function (e) { if (terisi[e]) tumpuk = true; terisi[e] = 1; });
    });
    if (tumpuk) { m.push(nama + ' memuat dua simbol pada satu titik bantu'); return false; }
    if (!jumlah) { m.push(nama + ' kosong'); return false; }
    return true;
  }

  function garisan(V, arah, i) { return arah === 'baris' ? [V[i][0], V[i][1], V[i][2]] : [V[0][i], V[1][i], V[2][i]]; }

  /**
   * Ramalan isi kotak "?" (mr, mc) untuk satu jenis unsur. V: matriks 3x3 vektor ada/tidak per unsur
   * (null di kotak "?"). @returns {{nilai:Array<number>}|{masalah:string}}
   */
  function ramalJenis(V, mr, mc, n) {
    var berlaku = [];
    ['baris', 'kolom'].forEach(function (arah) {
      var h = arah === 'baris' ? mr : mc, j = arah === 'baris' ? mc : mr;
      var L = [0, 1, 2].map(function (i) { return garisan(V, arah, i); });
      Object.keys(FUNGSI).forEach(function (nf) {
        var f = FUNGSI[nf];
        for (var k = 0; k < 3; k++) {
          var op = [0, 1, 2].filter(function (t) { return t !== k; });
          var cocok = true, i, e;
          for (i = 0; i < 3 && cocok; i++) {
            if (i === h) continue;
            for (e = 0; e < n && cocok; e++) if (L[i][k][e] !== f(L[i][op[0]][e], L[i][op[1]][e])) cocok = false;
          }
          if (!cocok) continue;
          var mungkin = [], dapat = true;
          for (e = 0; e < n && dapat; e++) {
            var nilai = [false, true].filter(function (v) {
              var x = [0, 1, 2].map(function (t) { return t === j ? v : L[h][t][e]; });
              return x[k] === f(x[op[0]], x[op[1]]);
            });
            if (!nilai.length) dapat = false;
            mungkin.push(nilai);
          }
          if (dapat) berlaku.push({ nama: nf + ' per ' + arah + ' (hasil di kotak ke-' + (k + 1) + ')', mungkin: mungkin });
        }
      });
    });
    if (!berlaku.length) return { masalah: 'tidak ada aturan penumpukan yang berlaku pada kedua baris maupun kedua kolom lengkap' };
    var hasil = [], bentrok = [], ganda = [];
    for (var e = 0; e < n; e++) {
      var boleh = [false, true].filter(function (v) { return berlaku.every(function (a) { return a.mungkin[e].indexOf(v) >= 0; }); });
      if (!boleh.length) bentrok.push(e);
      else if (boleh.length > 1) ganda.push(e);
      else if (boleh[0]) hasil.push(e);
    }
    var nama = berlaku.map(function (a) { return a.nama; }).join(', ');
    if (bentrok.length) return { masalah: 'ambigu, aturan yang berlaku saling bertentangan (' + nama + ')' };
    if (ganda.length) return { masalah: 'ambigu, isi tanda tanya tidak tunggal (aturan yang berlaku: ' + nama + ')' };
    var langsung = berlaku.some(function (a) {
      return a.mungkin.every(function (mg, e) { return mg.length === 1 && mg[0] === (hasil.indexOf(e) >= 0); });
    });
    if (!langsung) return { masalah: 'ambigu, tidak ada satu aturan pun yang sendirian menentukan isi tanda tanya (aturan yang berlaku: ' + nama + ')' };
    return { nilai: hasil };
  }

  function teksFig(f) { return Object.keys(f).sort().map(function (ch) { return ch + ':' + f[ch].join('.'); }).join('|'); }

  function periksa(b, m, alat) {
    var t = alat.bacaTampilan(b, m, 'tumpuk-soal', 'tumpuk-opsi', function (x) { return x.fig || null; });
    if (!t) return;
    var sj = alat.sj, H = alat.HURUF, g = t.soal.grid;
    if (sj(g) !== sj(b.model.grid)) m.push('matriks yang tergambar berbeda dari data model');
    if (!Array.isArray(g) || g.length !== 3 || g.some(function (row) { return !Array.isArray(row) || row.length !== 3; })) { m.push('matriks penumpukan harus berukuran 3x3'); return; }
    var lubang = [], contoh = null;
    g.forEach(function (row, r) { row.forEach(function (x, c) { if (x === null) lubang.push([r, c]); else if (!contoh) contoh = x; }); });
    if (lubang.length !== 1 || !contoh) { m.push('matriks harus memuat tepat satu kotak tanda tanya'); return; }
    var mr = lubang[0][0], mc = lubang[0][1];
    var kanal = Object.keys(contoh).sort(function (x, y) { return KANAL.indexOf(x) - KANAL.indexOf(y); });
    if (!kanal.length || kanal.some(function (ch) { return KANAL.indexOf(ch) < 0; })) { m.push('jenis unsur kotak tidak dikenal'); return; }
    var sah = true;
    g.forEach(function (row, r) { row.forEach(function (x, c) { if (x !== null && !bentukSah(x, kanal, 'kotak baris ' + (r + 1) + ' kolom ' + (c + 1), m)) sah = false; }); });
    t.opsi.forEach(function (f, i) { if (!bentukSah(f, kanal, 'opsi ' + H[i], m)) sah = false; });
    if (!sah) return;

    var ramalan = {}, lengkap = true;
    kanal.forEach(function (ch) {
      var V = g.map(function (row) { return row.map(function (x) { return x === null ? null : vektor(x[ch], UKURAN[ch]); }); });
      var r = ramalJenis(V, mr, mc, UKURAN[ch]);
      if (r.masalah) { m.push('matriks penumpukan, ' + NAMA[ch] + ': ' + r.masalah); lengkap = false; }
      else ramalan[ch] = r.nilai;
    });
    if (!lengkap) return;
    var dipakai = {}, tumpuk = false;
    kanal.forEach(function (ch) { if (ch !== 'garis') ramalan[ch].forEach(function (e) { if (dipakai[e]) tumpuk = true; dipakai[e] = 1; }); });
    if (tumpuk) { m.push('matriks penumpukan: ramalan menempatkan dua simbol pada satu titik bantu'); return; }
    if (!kanal.some(function (ch) { return ramalan[ch].length; })) { m.push('matriks penumpukan: ramalan isi tanda tanya kosong'); return; }
    var cocok = [];
    t.opsi.forEach(function (f, i) { if (kanal.every(function (ch) { return sj(f[ch]) === sj(ramalan[ch]); })) cocok.push(i); });
    alat.tepatSatu(b, m, cocok, 'aturan penumpukan');
  }

  /** Matriks UTUH (tanda tanya diisi kunci): sembilan kotak sebagai teks. */
  function sidik(b) {
    var md = b.model, k = md.pilihan[md.kunciIndex];
    return [].concat.apply([], md.grid.map(function (row) { return row.map(function (x) { return teksFig(x === null ? k : x); }); }));
  }

  return {
    TIPE: {
      'matriks-tumpuk': { periksa: periksa, sidik: sidik, batas: 1 }
    }
  };
});
