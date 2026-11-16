/*
 * matriks-corak.js — Kemampuan Umum > Figural > Kotak 3x3 (PENGAYAAN): bangun bercorak bergaya matriks
 * 2x2 bersekat (contoh riset BAB V soal 4), disusun dalam matriks 3x3 dengan satu kotak "?".
 *
 *   matriks-belahan     Tiap kotak berisi bangun (lingkaran, persegi, segi enam, belah ketupat, perisai,
 *                       kubah) yang dibelah dua oleh garis tegak, mendatar, atau miring. Belahan PERTAMA
 *                       adalah belahan di sisi atas garis belah (sisi kiri bila garisnya tegak), belahan
 *                       KEDUA di sisi lainnya (hanya label penyimpanan data); tiap belahan bercorak. Aturan corak per baris atau per kolom
 *                       (kotak ke-0, ke-1, ke-2 sepanjang garis aturan):
 *                         gabung         kotak 2 = belahan pertama kotak 0 + belahan kedua kotak 1
 *                         gabung-silang  kotak 2 = belahan kedua kotak 1 (pertama) + belahan pertama kotak 0
 *                         geser          belahan kedua kotak k menjadi belahan pertama kotak k+1, belahan
 *                                        pertama kotak 0 menjadi belahan kedua kotak 2 (melingkar)
 *                         geser-balik    belahan pertama kotak k menjadi belahan kedua kotak k+1, belahan
 *                                        kedua kotak 0 menjadi belahan pertama kotak 2
 *                         tukar          kotak 1 = kotak 0 dengan kedua belahan bertukar; kotak 2 menukarnya
 *                                        kembali
 *                       Arah garis belah SELALU sama di sepanjang setiap garis aturan (boleh berbeda antargaris),
 *                       sehingga belahan dibandingkan sisi demi sisi tanpa konvensi tersembunyi; antara arah yang
 *                       berbeda, penyusun mencoba semua cara memasangkan sisi dan menolak soal yang jawabannya
 *                       bergantung pada cara itu. Bentuk bangun punya pola sendiri (sama, per baris, per kolom, latin).
 *                       mudah  : gabung per baris, "?" di kanan bawah, bentuk/garis belah sederhana
 *                       sedang : geser/tukar per baris atau kolom (atau gabung per kolom), bentuk latin/bersilang,
 *                                "?" di tepi kanan/bawah
 *                       sulit  : kelima aturan (juga gabung-silang, geser-balik), bentuk berpola sendiri, "?" di
 *                                mana pun
 *
 *   matriks-corak-pola  Tiap kotak berisi bangun (persegi, lingkaran, segi delapan, belah ketupat, segi enam)
 *                       yang dibagi menjadi 4 bagian: garis tegak + mendatar ("+": kanan atas, kanan bawah,
 *                       kiri bawah, kiri atas) atau dua garis miring ("x": atas, kanan, bawah, kiri). Tiap
 *                       bagian bercorak, keempat corak dalam satu kotak selalu berbeda (tidak ada susunan yang
 *                       sama setelah diputar atau dicerminkan). Aturan corak:
 *                         putar        susunan corak berputar satu bagian searah/berlawanan jarum jam tiap
 *                                      kotak (per baris atau per kolom)
 *                         putar arsir  sama, dan setiap bagian ikut berputar 90° sehingga arah garis arsir
 *                                      berubah (mendatar <-> tegak, miring naik <-> miring turun)
 *                         jalan        corak dasar tetap, satu bagian "berjalan" menjadi hitam penuh
 *                         latin        corak tiap bagian mengikuti latin (tiga corak berbeda per baris/kolom)
 *                       Bentuk luar: sama, per baris, per kolom, atau latin.
 *                       mudah  : putar atau jalan per baris, bentuk sama, "?" di kanan bawah
 *                       sedang : putar/jalan per kolom atau baris, latin per bagian, bentuk berpola sederhana,
 *                                "?" di tepi kanan/bawah
 *                       sulit  : dua aturan sekaligus: bentuk latin + aturan corak, atau putar dengan arah
 *                                arsir ikut berputar; "?" di mana pun
 *
 * Penyusun membangun matriks menurut aturan, lalu menebak ulang isi "?" dari delapan kotak yang tampak dengan
 * pustaka aturannya sendiri (pola letak, langkah melingkar, pemetaan belahan sebaris/sekolom, putaran dan
 * pencerminan susunan, hitam berjalan) dan hanya memakai soal yang tebakannya TUNGGAL dan sama dengan kunci,
 * tanpa pola yang patah. Pemeriksa independennya ada di cek-matriks-corak.js.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./rng.js'), require('./svg.js'), require('./bentuk.js'), require('./corak.js'), require('./butir.js'), require('./format.js'), require('./metrik.js'));
    module.exports = api;
  } else {
    api = factory(root.Rng, root.Svg, root.Bentuk, root.Corak, root.Butir, root.Fmt, root.Metrik);
    root.MatriksCorak = api;
  }
})(typeof self !== 'undefined' ? self : this, function (Rng, S, Bentuk, Corak, Butir, Fmt, Metrik) {
  'use strict';

  var PERINTAH = 'Gunakan gambar di bagian atas untuk menentukan jawaban yang benar dari pilihan di bawah. Pilih jawaban yang menggantikan tanda tanya. Jika tidak ada tanda tanya, pilih jawaban yang merupakan kelanjutan dari urutan tersebut.';
  var TEPI = '#4a5266', BINGKAI = '#7b8499', LATAR_TANYA = '#f4f6fb';
  var BH = S.BAHAS, R2 = Math.SQRT1_2;
  var U = 112, PAD = 6, U_OPSI = 148, JARI = 0.4;
  var WARNA_JEJAK = [BH.sorot, BH.panah, '#8e44ad', '#0e7c86'];
  var CATATAN = 'Bangun bercorak bergaya matriks bersekat contoh riset soal 4, diterapkan pada aturan baris dan kolom matriks 3x3; bentuk ini tidak ada pada contoh riset BAB V.';

  // =================================================================== alat umum

  function salin(x) { return JSON.parse(JSON.stringify(x)); }
  function sj(x) { return JSON.stringify(x); }
  function mod(a, n) { return ((a % n) + n) % n; }
  function transpos(G) { return [0, 1, 2].map(function (r) { return [0, 1, 2].map(function (c) { return G[c][r]; }); }); }
  function isiLubang(G, tr, tc, x) { return G.map(function (b, r) { return b.map(function (y, c) { return r === tr && c === tc ? x : y; }); }); }
  function petaGrid(G, f) { return G.map(function (b) { return b.map(function (x) { return x == null ? null : f(x); }); }); }
  function letak(ar, l, i) { return ar === 'baris' ? [l, i] : [i, l]; }
  function garis(G, ar, l) { return [0, 1, 2].map(function (i) { var p = letak(ar, l, i); return G[p[0]][p[1]]; }); }
  function lainArah(ar) { return ar === 'baris' ? 'kolom' : 'baris'; }
  function unik(xs) { return xs.filter(function (v, i) { return xs.indexOf(v) === i; }); }

  function teksB(s, x, y, o) {
    o = o || {};
    return S.teks(s, x, y, { ukuran: o.ukuran || 11, tebal: o.tebal, isi: o.isi || BH.teks, rata: o.rata });
  }

  function paragrafB(s, x, y, lebar, o) {
    o = o || {};
    var uk = o.ukuran || 11, baris = Metrik.penggal(s, lebar, uk, o.tebal);
    return { svg: baris.map(function (b, i) { return teksB(b, x, y + i * (uk + 3), o); }).join(''), baris: baris.length };
  }

  function lebarJudul(judul, W) { return Math.max(W, Math.ceil(Metrik.lebar(judul, 13, true)) + 24); }

  var NAMA_BENTUK = { lingkaran: 'lingkaran', persegi: 'persegi', segienam: 'segi enam', segidelapan: 'segi delapan', 'belah-ketupat': 'belah ketupat', perisai: 'perisai', kubah: 'kubah' };
  function NB(b) { return NAMA_BENTUK[b]; }
  function NC(k) { return Corak.nama(k); }
  function namaLetak(r, c) { return 'baris ' + (r + 1) + ', kolom ' + (c + 1); }
  var POS_NAMA = { baris: ['kiri', 'tengah', 'kanan'], kolom: ['atas', 'tengah', 'bawah'] };
  var JAM = { 1: 'searah jarum jam', 3: 'berlawanan arah jarum jam' };

  // =================================================================== geometri bangun

  var UKURAN = { lingkaran: 1.02, persegi: 1.06, segienam: 0.98, segidelapan: 1.0, 'belah-ketupat': 0.94, perisai: 1.0, kubah: 1.0 };

  /** Perisai dan kubah (seperti matriks-sekat.js), poligon cembung di sekitar (cx, cy). */
  function poliKhusus(nama, cx, cy, s) {
    var p = [], i, t;
    if (nama === 'kubah') {
      p.push([cx - 0.75 * s, cy + 0.85 * s], [cx + 0.75 * s, cy + 0.85 * s]);
      for (i = 0; i <= 24; i++) { t = -Math.PI * i / 24; p.push([cx + 0.75 * s * Math.cos(t), cy - 0.1 * s + 0.75 * s * Math.sin(t)]); }
      return p;
    }
    p.push([cx - 0.78 * s, cy - 0.85 * s], [cx + 0.78 * s, cy - 0.85 * s], [cx + 0.78 * s, cy + 0.05 * s]);
    for (i = 1; i <= 16; i++) {
      t = i / 16;
      p.push([cx + ((1 - t) * (1 - t) * 0.78 + 2 * (1 - t) * t * 0.72) * s, cy + ((1 - t) * (1 - t) * 0.05 + 2 * (1 - t) * t * 0.62 + t * t * 0.92) * s]);
    }
    for (i = 15; i >= 0; i--) {
      t = i / 16;
      p.push([cx - ((1 - t) * (1 - t) * 0.78 + 2 * (1 - t) * t * 0.72) * s, cy + ((1 - t) * (1 - t) * 0.05 + 2 * (1 - t) * t * 0.62 + t * t * 0.92) * s]);
    }
    return p;
  }

  function poliBangun(nama, cx, cy, s) {
    s = s * (UKURAN[nama] || 1);
    if (nama === 'perisai' || nama === 'kubah') return poliKhusus(nama, cx, cy, s);
    return Corak.bentuk(nama, cx, cy, s);
  }

  function bingkai(x, y, u, o) {
    o = o || {};
    return S.rect(x + 0.8, y + 0.8, u - 1.6, u - 1.6, { isi: o.latar || '#ffffff', garis: o.tepi || BINGKAI, tebal: o.tebal || 1.6 });
  }

  function kotakTanya(x, y, u) {
    return S.rect(x + 0.8, y + 0.8, u - 1.6, u - 1.6, { isi: LATAR_TANYA, garis: BINGKAI, tebal: 1.6 }) +
      S.teks('?', x + u / 2, y + u * 0.68, { ukuran: Math.round(u * 0.52), tebal: true, isi: TEPI, rata: 'middle' });
  }

  /** Matriks 3x3 dengan satu kotak "?" (tanya = [baris, kolom]). */
  function svgMatriks(grid, tanya, gambarSel) {
    var o = [];
    for (var r = 0; r < 3; r++) {
      for (var c = 0; c < 3; c++) {
        var x = PAD + c * U, y = PAD + r * U;
        if (r === tanya[0] && c === tanya[1]) o.push(kotakTanya(x, y, U));
        else o.push(bingkai(x, y, U) + gambarSel(grid[r][c], x + U / 2, y + U / 2, JARI * U));
      }
    }
    o.push(S.rect(PAD, PAD, 3 * U, 3 * U, { isi: 'none', garis: TEPI, tebal: 2.4 }));
    var W = PAD * 2 + 3 * U;
    return { svg: S.doc(o.join(''), W, W, { latar: '#ffffff' }), lebar: W, tinggi: W };
  }

  function svgOpsi(sel, gambarSel) {
    var p = 4, W = U_OPSI + 2 * p;
    return { svg: S.doc(bingkai(p, p, U_OPSI) + gambarSel(sel, p + U_OPSI / 2, p + U_OPSI / 2, JARI * U_OPSI), W, W, { latar: '#ffffff' }), lebar: W, tinggi: W };
  }

  // ---------------------------------------------------------------- belahan

  var BENTUK_B = ['lingkaran', 'persegi', 'segienam', 'belah-ketupat', 'perisai', 'kubah'];
  var ARAH = [0, 45, 90, 135];
  var NAMA_ARAH = { 0: 'mendatar', 45: 'miring naik ke kanan', 90: 'tegak', 135: 'miring turun ke kanan' };
  var SISI_A = { 0: 'atas', 45: 'kiri atas', 90: 'kiri', 135: 'kanan atas' };
  var SISI_B = { 0: 'bawah', 45: 'kanan bawah', 90: 'kanan', 135: 'kiri bawah' };
  // normal (dari pusat) ke arah belahan pertama: sisi atas garis belah, sisi kiri bila garisnya tegak
  var NORMAL_A = { 0: [0, -1], 45: [-R2, -R2], 90: [-1, 0], 135: [R2, -R2] };

  function selB(bentuk, arah, A, B) { return { bentuk: bentuk, arah: arah, corak: [A, B] }; }

  function belahPoli(sel, cx, cy, s) {
    var P = poliBangun(sel.bentuk, cx, cy, s), n = NORMAL_A[sel.arah], c = n[0] * cx + n[1] * cy;
    return { luar: P, A: Bentuk.potongBidang(P, n[0], n[1], c), B: Bentuk.potongBidang(P, -n[0], -n[1], -c) };
  }

  function gambarBelahan(sel, cx, cy, s) {
    var p = belahPoli(sel, cx, cy, s);
    return Corak.gambar([{ poli: p.A, kode: sel.corak[0] }, { poli: p.B, kode: sel.corak[1] }], { luar: p.luar, tebal: 1.7, tebalLuar: 2.4 });
  }

  /** Garis tepi bangun dan garis belahnya saja (gambar pembahasan kanal). */
  function kerangkaBelahan(sel, cx, cy, s, o) {
    o = o || {};
    var p = belahPoli(sel, cx, cy, s), out = [];
    if (o.bentuk !== false) out.push(S.poli(p.luar, { tutup: true, isi: '#ffffff', garis: Corak.TINTA, tebal: 1.8, sambung: 'round' }));
    if (o.belah !== false) {
      var n = NORMAL_A[sel.arah], d = [-n[1], n[0]], ruas = Bentuk.potongGaris(Bentuk.sisiDalam(p.luar), [cx, cy], d);
      if (o.bentuk === false) out.push(S.poli(p.luar, { tutup: true, isi: '#ffffff', garis: '#b9c0cc', tebal: 1.2, sambung: 'round' }));
      if (ruas) out.push(S.garis(ruas[0][0], ruas[0][1], ruas[1][0], ruas[1][1], { garis: BH.panah, tebal: 2.4, ujung: 'round' }));
    }
    return out.join('');
  }

  // ---------------------------------------------------------------- pola empat bagian

  var BENTUK_P = ['persegi', 'lingkaran', 'segidelapan', 'belah-ketupat', 'segienam'];
  var AWAL = { '+': 0, x: -45 };
  var BAGIAN = { '+': ['kanan atas', 'kanan bawah', 'kiri bawah', 'kiri atas'], x: ['atas', 'kanan', 'bawah', 'kiri'] };
  var JARI_P = 0.41;

  function selP(bentuk, bagi, corak) { return { bentuk: bentuk, bagi: bagi, corak: corak.slice() }; }

  function bagiPoli(sel, cx, cy, s) {
    var P = poliBangun(sel.bentuk, cx, cy, s);
    return { luar: P, bagian: Corak.bagi(P, cx, cy, 4, AWAL[sel.bagi]) };
  }

  function gambarPola(sel, cx, cy, s) {
    var p = bagiPoli(sel, cx, cy, s * JARI_P / JARI);
    return Corak.gambar(p.bagian.map(function (q, k) { return { poli: q, kode: sel.corak[k] }; }), { luar: p.luar, tebal: 1.7, tebalLuar: 2.4 });
  }

  function kerangkaPola(sel, cx, cy, s) {
    var p = bagiPoli(sel, cx, cy, s);
    return p.bagian.map(function (q) { return S.poli(q, { tutup: true, isi: '#ffffff', garis: Corak.TINTA, tebal: 1.4, sambung: 'round' }); }).join('') +
      S.poli(p.luar, { tutup: true, isi: 'none', garis: Corak.TINTA, tebal: 2, sambung: 'round' });
  }

  /** Contoh kecil satu corak (persegi berpinggir), untuk tabel dan pasangan corak di pembahasan. */
  function contohCorak(kode, x, y, w, o) {
    o = o || {};
    var P = [[x, y], [x + w, y], [x + w, y + w], [x, y + w]];
    return Corak.isi(P, kode, { skala: 0.85 }) + S.poli(P, { tutup: true, isi: 'none', garis: o.garis || Corak.TINTA, tebal: o.tebal || 1.4 });
  }

  // =================================================================== pustaka tebakan penyusun

  function beda3(b) { return b[0] !== b[1] && b[0] !== b[2] && b[1] !== b[2]; }
  function himp(b) { return b.map(String).sort().join('|'); }
  function diagSama(V, t) {
    var wakil = {};
    for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) {
      var g = mod(c + t * r, 3);
      if (wakil[g] === undefined) wakil[g] = V[r][c]; else if (wakil[g] !== V[r][c]) return false;
    }
    return true;
  }

  var POLA = {
    'sama semua': function (V) { return V.every(function (b) { return b.every(function (x) { return x === V[0][0]; }); }); },
    'baris tetap': function (V) { return V.every(function (b) { return b[0] === b[1] && b[1] === b[2]; }); },
    'kolom tetap': function (V) { return POLA['baris tetap'](transpos(V)); },
    'latin baris': function (V) { return V.every(beda3) && himp(V[0]) === himp(V[1]) && himp(V[1]) === himp(V[2]); },
    'latin kolom': function (V) { return POLA['latin baris'](transpos(V)); },
    'diagonal turun': function (V) { return diagSama(V, -1); },
    'diagonal naik': function (V) { return diagSama(V, 1); }
  };
  var POLA_GARIS = { 'baris tetap': 'baris', 'kolom tetap': 'kolom', 'latin baris': 'baris', 'latin kolom': 'kolom' };

  /** Langkah melingkar sepanjang tiap garis: sama di semua garis (k bukan 0) atau bebas per garis. */
  function langkahGaris(W, ar, urut, bebas) {
    var n = urut.length, k0 = null;
    for (var l = 0; l < 3; l++) {
      var g = garis(W, ar, l).map(function (v) { return urut.indexOf(v); });
      if (g.some(function (i) { return i < 0; })) return false;
      var d1 = mod(g[1] - g[0], n), d2 = mod(g[2] - g[1], n);
      if (d1 !== d2) return false;
      if (!bebas) { if (d1 === 0) return false; if (k0 === null) k0 = d1; else if (k0 !== d1) return false; }
    }
    return true;
  }

  /**
   * Calon nilai satu kanal di kotak "?" menurut semua aturan pustaka yang berlaku: pola letak, langkah
   * melingkar (bila `siklus`), dan pemetaan antarkotak sebaris/sekolom dengan kanal sejenis (bila `sejenis`,
   * daftar grid kanal sejenis lain; [] = hanya kanal itu sendiri; null = tanpa pemetaan).
   */
  function calonKanal(V, tr, tc, ranah, siklus, sejenis) {
    var calon = ranah.slice();
    function iris(boleh) { if (boleh.length) calon = calon.filter(function (v) { return boleh.indexOf(v) >= 0; }); }
    function uji(f) { return ranah.filter(function (v) { return f(isiLubang(V, tr, tc, v)); }); }
    Object.keys(POLA).forEach(function (nm) { iris(uji(POLA[nm])); });
    if (siklus) {
      ['baris', 'kolom'].forEach(function (ar) {
        [false, true].forEach(function (bebas) { iris(uji(function (W) { return langkahGaris(W, ar, siklus, bebas); })); });
      });
    }
    if (sejenis) {
      [V].concat(sejenis).forEach(function (Q) {
        ['baris', 'kolom'].forEach(function (ar) {
          var ql = ar === 'baris' ? tr : tc, m = ar === 'baris' ? tc : tr;
          for (var j = 0; j < 3; j++) {
            if (j === m) continue;
            var ok = true;
            for (var l = 0; l < 3 && ok; l++) if (l !== ql && garis(V, ar, l)[m] !== garis(Q, ar, l)[j]) ok = false;
            if (ok) iris([garis(Q, ar, ql)[j]]);
          }
        });
      });
    }
    return calon;
  }

  /**
   * Pola patah: aturan per garis (pola letak, langkah, pemetaan antarkotak) yang berlaku pada kedua garis
   * lengkap tetapi sudah dilanggar kotak tampak pada garis bertanda tanya. Soal seperti ini dibuang.
   */
  function putusKanal(V, tr, tc, ranah, siklus, sejenis) {
    var rL = tr === 0 ? 1 : 0, cL = tc === 0 ? 1 : 0;
    var gB = V.map(function (b, r) { return (r === tr ? V[rL] : b).slice(); });
    var gK = V.map(function (b) { return b.map(function (x, c) { return c === tc ? b[cL] : x; }); });
    function patah(f, ar) { return f(ar === 'baris' ? gB : gK) && !ranah.some(function (v) { return f(isiLubang(V, tr, tc, v)); }); }
    if (Object.keys(POLA_GARIS).some(function (nm) { return patah(POLA[nm], POLA_GARIS[nm]); })) return true;
    if (siklus && ['baris', 'kolom'].some(function (ar) { return [false, true].some(function (bebas) { return patah(function (W) { return langkahGaris(W, ar, siklus, bebas); }, ar); }); })) return true;
    if (!sejenis) return false;
    return [V].concat(sejenis).some(function (Q) {
      return ['baris', 'kolom'].some(function (ar) {
        var ql = ar === 'baris' ? tr : tc, m = ar === 'baris' ? tc : tr;
        for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) {
          if (i === m || j === m || (Q === V && i >= j)) continue;
          var ok = true;
          for (var l = 0; l < 3 && ok; l++) if (l !== ql && garis(V, ar, l)[i] !== garis(Q, ar, l)[j]) ok = false;
          if (ok && garis(V, ar, ql)[i] !== garis(Q, ar, ql)[j]) return true;
        }
        return false;
      });
    });
  }

  /** Tanda kesamaan satu garis untuk sekelompok kanal: tiap pasangan ujung (kotak, kanal) 1, 0, atau ?. */
  function tandaGaris(kanal, ar, l) {
    var ujung = [], t = [];
    for (var i = 0; i < 3; i++) kanal.forEach(function (V) { ujung.push(garis(V, ar, l)[i]); });
    for (var p = 0; p < ujung.length; p++) for (var q = p + 1; q < ujung.length; q++) {
      t.push(ujung[p] == null || ujung[q] == null ? '?' : (ujung[p] === ujung[q] ? '1' : '0'));
    }
    return t;
  }

  /**
   * Pola utuh: ada arah (baris atau kolom) yang kedua garis lengkapnya bertanda kesamaan sama, dan garis "?" cocok.
   * `bermakna`: tanda itu harus memuat sedikitnya satu kesamaan (corak belahan yang berpindah antarkotak).
   */
  function utuh(kanal, tr, tc, bermakna) {
    return ['baris', 'kolom'].some(function (ar) {
      var iT = ar === 'baris' ? tr : tc, tanda = [0, 1, 2].map(function (l) { return tandaGaris(kanal, ar, l); });
      var lengkap = [0, 1, 2].filter(function (l) { return l !== iT; }).map(function (l) { return tanda[l]; });
      if (lengkap[0].join() !== lengkap[1].join()) return false;
      if (bermakna && lengkap[0].indexOf('1') < 0) return false;
      return tanda[iT].every(function (v, k) { return v === '?' || v === lengkap[0][k]; });
    });
  }

  /** Grid nilai menurut pola letak: sama, baris (tetap per baris), kolom, latin. */
  function gridPola(a, jenis, ranah) {
    var v = a.ambil(ranah, 3), s = a.pilih([1, 2]);
    return [0, 1, 2].map(function (r) {
      return [0, 1, 2].map(function (c) { return jenis === 'sama' ? v[0] : jenis === 'baris' ? v[r] : jenis === 'kolom' ? v[c] : v[mod(c + s * r, 3)]; });
    });
  }

  /** Pola relatif terhadap arah garis aturan: garis (tetap sepanjang garis aturan), silang (tetap pada arah lain). */
  function mutlak(rel, ar) { return rel === 'garis' ? ar : rel === 'silang' ? lainArah(ar) : rel; }

  /** Uraian pola letak sebuah kanal (bentuk atau garis belah) untuk pembahasan. */
  function uraiPolaKanal(info, V, tr, tc, nilai, fmt, kata) {
    var j = info.jenis, wakil = function (ar, l) { var g = garis(V, ar, l); for (var i = 0; i < 3; i++) if (g[i] != null) return g[i]; return null; };
    if (j === 'sama') return kata.semua + ' ' + fmt(nilai) + '.';
    if (j === 'baris' || j === 'kolom') {
      var isi = [0, 1, 2].map(function (l) { return j + ' ' + (l + 1) + ' ' + fmt(wakil(j, l)); });
      return kata.subjek + ' sama dalam satu ' + j + ': ' + isi.join(', ') + '. Kotak yang dicari berada di ' + j + ' ' + ((j === 'baris' ? tr : tc) + 1) + ', jadi ' + kata.hasil + ' ' + fmt(nilai) + '.';
    }
    var semua = unik([].concat.apply([], V).filter(function (x) { return x != null; }));
    var ada = V[tr].filter(function (x, c) { return c !== tc; });
    return 'Setiap baris dan setiap kolom memuat ketiga ' + kata.jamak + ' (' + semua.map(fmt).join(', ') + ') tepat satu kali. Baris ' + (tr + 1) + ' sudah memuat ' + ada.map(fmt).join(' dan ') + ', jadi ' + kata.hasil + ' ' + fmt(nilai) + '.';
  }

  // =================================================================== MATRIKS BELAHAN

  // relasi tiap aturan pada satu garis: [[kotak tujuan, belahan], [kotak asal, belahan]]
  var MEK_B = {
    gabung: { rel: [[[2, 'A'], [0, 'A']], [[2, 'B'], [1, 'B']]], n: 4, ujung: true, isi: function (v) { return [[v[0], v[1]], [v[2], v[3]], [v[0], v[3]]]; } },
    'gabung-silang': { rel: [[[2, 'A'], [1, 'B']], [[2, 'B'], [0, 'A']]], n: 4, ujung: true, isi: function (v) { return [[v[0], v[1]], [v[2], v[3]], [v[3], v[0]]]; } },
    geser: { rel: [[[1, 'A'], [0, 'B']], [[2, 'A'], [1, 'B']], [[2, 'B'], [0, 'A']]], n: 3, isi: function (v) { return [[v[0], v[1]], [v[1], v[2]], [v[2], v[0]]]; } },
    'geser-balik': { rel: [[[1, 'B'], [0, 'A']], [[2, 'B'], [1, 'A']], [[2, 'A'], [0, 'B']]], n: 3, isi: function (v) { return [[v[0], v[1]], [v[2], v[0]], [v[1], v[2]]]; } },
    tukar: { rel: [[[1, 'A'], [0, 'B']], [[1, 'B'], [0, 'A']], [[2, 'A'], [1, 'B']], [[2, 'B'], [1, 'A']]], n: 2, isi: function (v) { return [[v[0], v[1]], [v[1], v[0]], [v[0], v[1]]]; } }
  };
  function ke(X) { return X === 'A' ? 0 : 1; }
  function sisi(X, arah) { return X === 'A' ? SISI_A[arah] : SISI_B[arah]; }

  function kanalB(G) {
    return {
      bentuk: petaGrid(G, function (x) { return x.bentuk; }), arah: petaGrid(G, function (x) { return x.arah; }),
      A: petaGrid(G, function (x) { return x.corak[0]; }), B: petaGrid(G, function (x) { return x.corak[1]; })
    };
  }

  /**
   * Belahan hanya dapat dibandingkan langsung antara bangun yang arah garis belahnya sama. Antara arah garis
   * belah yang berbeda, sisi mana yang bersesuaian tidak tertulis di soal, jadi tebakan dicoba untuk SEMUA cara
   * memasangkan sisi: balik[arah] = label kedua belahan pada arah itu ditukar. Hasil: [corak pertama, kedua]
   * dalam label penyimpanan, atau null bila aturan corak tidak terbaca tunggal, patah, atau tidak utuh.
   */
  function tebakCorakB(G, tr, tc, balik, arahQ) {
    var K = kanalB(petaGrid(G, function (x) { return balik[x.arah] ? selB(x.bentuk, x.arah, x.corak[1], x.corak[0]) : x; }));
    var A = calonKanal(K.A, tr, tc, Corak.KODE, null, [K.B]), B = calonKanal(K.B, tr, tc, Corak.KODE, null, [K.A]);
    if (A.length !== 1 || B.length !== 1 || A[0] === B[0]) return null;
    if (putusKanal(K.A, tr, tc, Corak.KODE, null, [K.B]) || putusKanal(K.B, tr, tc, Corak.KODE, null, [K.A]) || !utuh([K.A, K.B], tr, tc, true)) return null;
    return balik[arahQ] ? [B[0], A[0]] : [A[0], B[0]];
  }

  function ramalBelahan(G, tr, tc) {
    var K = kanalB(G);
    var b = calonKanal(K.bentuk, tr, tc, BENTUK_B, null, []), r = calonKanal(K.arah, tr, tc, ARAH, ARAH, []);
    if (b.length !== 1 || r.length !== 1) return null;
    var arahQ = r[0], nilai = unik([].concat.apply([], K.arah).filter(function (v) { return v != null; }).concat([arahQ])).sort(function (x, y) { return x - y; });
    var hasil = [];
    for (var mask = 0; mask < (1 << (nilai.length - 1)); mask++) {
      var balik = {};
      nilai.forEach(function (v, i) { balik[v] = i > 0 && ((mask >> (i - 1)) & 1) === 1; });
      var t = tebakCorakB(G, tr, tc, balik, arahQ);
      if (mask === 0 && !t) return null;                 // pemasangan sisi apa adanya harus berlaku
      if (t && !hasil.some(function (h) { return h[0] === t[0] && h[1] === t[1]; })) hasil.push(t);
    }
    return hasil.length === 1 ? selB(b[0], r[0], hasil[0][0], hasil[0][1]) : null;
  }

  /**
   * Garis aturan corak = arah (baris/kolom) yang di setiap garisnya dua kotak tertentu berbagi corak. Pada arah itu
   * garis belah harus sama di sepanjang setiap garis. true bila tidak ada garis aturan atau arahnya berubah.
   */
  function arahBerubahB(Gp) {
    var ada = false, berubah = false;
    ['baris', 'kolom'].forEach(function (ar) {
      var terkait = false;
      for (var i = 0; i < 3; i++) for (var j = i + 1; j < 3; j++) {
        if ([0, 1, 2].every(function (l) { var g = garis(Gp, ar, l); return g[i].corak.some(function (v) { return g[j].corak.indexOf(v) >= 0; }); })) terkait = true;
      }
      if (!terkait) return;
      ada = true;
      if ([0, 1, 2].some(function (l) { var g = garis(Gp, ar, l); return g[0].arah !== g[1].arah || g[1].arah !== g[2].arah; })) berubah = true;
    });
    return !ada || berubah;
  }

  function cacatBelahan(G, tr, tc, kunci) {
    var K = kanalB(G);
    return putusKanal(K.bentuk, tr, tc, BENTUK_B, null, []) || putusKanal(K.arah, tr, tc, ARAH, ARAH, []) ||
      putusKanal(K.A, tr, tc, Corak.KODE, null, [K.B]) || putusKanal(K.B, tr, tc, Corak.KODE, null, [K.A]) ||
      !utuh([K.A, K.B], tr, tc, true) || !utuh([K.bentuk], tr, tc) || !utuh([K.arah], tr, tc) || arahBerubahB(isiLubang(G, tr, tc, kunci));
  }

  function rencanaBelahan(a, level, dipakai) {
    var semua = [];
    function tambah(mek, ar, arah, bentuk, bobot) { for (var i = 0; i < (bobot || 1); i++) semua.push({ mek: mek, ar: ar, arah: arah, bentuk: bentuk }); }
    if (level === 'mudah') {
      ['sama', 'garis', 'silang'].forEach(function (bt) { tambah('gabung', 'baris', 'sama', bt, 2); tambah('gabung', 'baris', 'garis', bt, 1); });
    } else if (level === 'sedang') {
      ['geser', 'geser-balik', 'tukar'].forEach(function (mk) {
        ['baris', 'kolom'].forEach(function (ar) {
          tambah(mk, ar, 'garis', a.pilih(['latin', 'silang']), mk === 'tukar' ? 1 : 2);
          tambah(mk, ar, 'sama', a.pilih(['latin', 'garis']), 1);
        });
      });
      tambah('gabung', 'kolom', 'garis', a.pilih(['latin', 'silang']), 2);
      tambah('gabung', 'kolom', 'sama', 'latin', 1);
    } else {
      ['gabung', 'gabung-silang', 'geser', 'geser-balik', 'tukar'].forEach(function (mk) {
        ['baris', 'kolom'].forEach(function (ar) {
          tambah(mk, ar, a.pilih(['garis', 'garis', 'sama']), a.pilih(['latin', 'garis', 'silang']), mk === 'tukar' ? 1 : 2);
        });
      });
    }
    var inti = function (p) { return 'matriks-belahan:' + p.mek + '-' + p.ar + '+'; };
    var baru = semua.filter(function (p) { return !(dipakai || []).some(function (d) { return d.indexOf(inti(p)) === 0; }); });
    var p = salin(a.pilih(baru.length ? baru : semua));
    p.pola = inti(p) + 'arah-' + p.arah + '+bentuk-' + p.bentuk;
    return p;
  }

  /**
   * Corak tiap garis aturan. Garis-garis memakai kumpulan corak berbeda, dan corak yang sama tidak muncul pada
   * belahan yang sama di kotak yang sejajar (supaya tidak timbul pola kebetulan pada arah lain).
   */
  function corakGarisB(a, mek) {
    var info = MEK_B[mek], lihat = {}, out = [];
    function bentrok(isi) {
      return out.some(function (lama) { return lama.some(function (x, i) { return x[0] === isi[i][0] || x[1] === isi[i][1]; }); });
    }
    for (var l = 0; l < 3; l++) {
      var isi = null, kunci = null, ok = false;
      for (var coba = 0; coba < 40 && !ok; coba++) {
        var v = a.ambil(Corak.KODE, info.n);
        kunci = v.slice().sort().join('|'); isi = info.isi(v);
        // dua belahan bergaris sejajar beda arah (mis. "/" dan "\") sulit dibedakan sekilas: paling banyak satu belahan berarsir
        ok = !lihat[kunci] && !bentrok(isi) && !isi.some(function (x) { return /^arsir/.test(x[0]) && /^arsir/.test(x[1]); });
      }
      if (!ok) return null;
      lihat[kunci] = 1;
      out.push(isi);
    }
    return out;
  }

  /**
   * Arah garis belah: SELALU sama di sepanjang setiap garis aturan corak ('sama' = satu arah untuk semua kotak,
   * 'garis' = satu arah per garis aturan). Pada gabung, kotak tampak di garis "?" tidak memperlihatkan sisi mana
   * berasal dari kotak mana, jadi arah garis "?" disamakan dengan salah satu garis lengkap.
   */
  function arahGrid(a, jenis, ar, ql, ujung) {
    var v, G = [[], [], []];
    if (jenis === 'sama') { var x = a.pilih(ARAH); v = [x, x, x]; }
    else if (ujung) {
      var d = a.ambil(ARAH, 2), lain = [0, 1, 2].filter(function (l) { return l !== ql; });
      v = []; v[lain[0]] = d[0]; v[lain[1]] = d[1]; v[ql] = a.pilih(d);
    } else v = a.ambil(ARAH, 3);
    for (var l = 0; l < 3; l++) for (var i = 0; i < 3; i++) { var p = letak(ar, l, i); G[p[0]][p[1]] = v[l]; }
    return { jenis: jenis === 'sama' ? 'sama' : ar, grid: G, ar: ar };
  }

  function tanyaBelahan(a, level, rc) {
    if (level === 'mudah') return [2, 2];
    if (MEK_B[rc.mek].ujung) { var l = level === 'sedang' ? a.pilih([2, 2, 1, 0]) : a.bulat(0, 2); return rc.ar === 'baris' ? [l, 2] : [2, l]; }
    if (level === 'sedang') return a.pilih([[2, 2], [2, 2], [0, 2], [1, 2], [2, 0], [2, 1]]);
    return a.untung(0.3) ? [1, 1] : [a.bulat(0, 2), a.bulat(0, 2)];
  }

  function namaTetangga(tr, tc, r, c) {
    if (r === tr) return 'kotak di sebelah ' + (c < tc ? 'kiri' : 'kanan') + 'nya';
    return 'kotak di ' + (r < tr ? 'atas' : 'bawah') + 'nya';
  }

  function uraiSelB(x) {
    return NB(x.bentuk) + ' dengan garis belah ' + NAMA_ARAH[x.arah] + ', belahan ' + SISI_A[x.arah] + ' ' + NC(x.corak[0]) + ' dan belahan ' + SISI_B[x.arah] + ' ' + NC(x.corak[1]);
  }

  function pengecohBelahan(a, level, G, tr, tc, kunci, rc) {
    var calon = [], ar = rc.ar, ql = ar === 'baris' ? tr : tc, m = ar === 'baris' ? tc : tr, gs = garis(G, ar, ql);
    var A = kunci.corak[0], B = kunci.corak[1], sA = SISI_A[kunci.arah], sB = SISI_B[kunci.arah], kb = kunci.bentuk, ka = kunci.arah;
    function tambah(sel, jenis, alasan) { if (sel.corak[0] !== sel.corak[1]) calon.push({ sel: sel, jenis: jenis, alasan: alasan }); }
    tambah(selB(kb, ka, B, A), 'tertukar', 'kedua coraknya benar tetapi letaknya tertukar; belahan ' + sA + ' seharusnya ' + NC(A) + ' dan belahan ' + sB + ' ' + NC(B));
    var nilaiGaris = [];
    gs.forEach(function (x) { if (x) nilaiGaris.push(x.corak[0], x.corak[1]); });
    unik(nilaiGaris).forEach(function (v) {
      if (v === A || v === B) return;
      tambah(selB(kb, ka, v, B), 'asal', 'belahan ' + sA + ' diambil dari belahan yang salah; menurut aturan ' + ar + ' itu belahan ' + sA + ' bercorak ' + NC(A) + ', bukan ' + NC(v));
      tambah(selB(kb, ka, A, v), 'asal', 'belahan ' + sB + ' diambil dari belahan yang salah; menurut aturan ' + ar + ' itu belahan ' + sB + ' bercorak ' + NC(B) + ', bukan ' + NC(v));
    });
    [0, 1, 2].forEach(function (l) {
      if (l === ql) return;
      var x = garis(G, ar, l)[m];
      if (!x) return;
      if (x.corak[0] !== A) tambah(selB(kb, ka, x.corak[0], B), 'garis-lain', 'belahan ' + sA + ' disalin dari kotak yang sejajar di ' + ar + ' ' + (l + 1) + ', padahal aturan pada ' + ar + ' ' + (ql + 1) + ' menghasilkan ' + NC(A));
      if (x.corak[1] !== B) tambah(selB(kb, ka, A, x.corak[1]), 'garis-lain', 'belahan ' + sB + ' disalin dari kotak yang sejajar di ' + ar + ' ' + (l + 1) + ', padahal aturan pada ' + ar + ' ' + (ql + 1) + ' menghasilkan ' + NC(B));
    });
    var tampakBentuk = unik([].concat.apply([], G).filter(Boolean).map(function (x) { return x.bentuk; }));
    unik(tampakBentuk.concat(BENTUK_B)).forEach(function (bt) {
      if (bt === kb) return;
      tambah(selB(bt, ka, A, B), tampakBentuk.indexOf(bt) >= 0 ? 'bentuk' : 'bentuk-jauh', 'coraknya benar tetapi bentuknya ' + NB(bt) + ', padahal pola bentuk menghendaki ' + NB(kb));
    });
    ARAH.forEach(function (r) {
      if (r === ka) return;
      tambah(selB(kb, r, A, B), 'arah', 'coraknya benar tetapi garis belahnya ' + NAMA_ARAH[r] + ', padahal pola garis belah menghendaki garis ' + NAMA_ARAH[ka]);
    });
    [[tr, tc - 1], [tr, tc + 1], [tr - 1, tc], [tr + 1, tc]].forEach(function (rc2) {
      var r = rc2[0], c = rc2[1];
      if (r < 0 || r > 2 || c < 0 || c > 2) return;
      tambah(salin(G[r][c]), 'salin', 'hanya menyalin ' + namaTetangga(tr, tc, r, c) + ' (' + uraiSelB(G[r][c]) + ')');
    });
    if (level === 'sulit') {
      var r2 = a.pilih(ARAH.filter(function (r) { return r !== ka; }));
      tambah(selB(kb, r2, B, A), 'arah-tertukar', 'garis belahnya ' + NAMA_ARAH[r2] + ' (seharusnya ' + NAMA_ARAH[ka] + ') dan kedua coraknya tertukar letak');
    }
    var lihat = {}, hasil = [];
    lihat[sj(kunci)] = 1;
    function ambil(jenis) {
      var c = a.kocok(calon.filter(function (x) { return !lihat[sj(x.sel)] && (!jenis || jenis.split('|').indexOf(x.jenis) >= 0); }))[0];
      if (!c || hasil.length >= 4) return;
      lihat[sj(c.sel)] = 1;
      hasil.push(c);
    }
    var arahBerubah = rc.arah !== 'sama', bentukBerubah = rc.bentuk !== 'sama';
    if (level === 'mudah') { ambil('tertukar'); ambil('asal'); ambil('salin'); ambil(bentukBerubah ? 'bentuk' : (arahBerubah ? 'arah' : 'garis-lain')); }
    else if (level === 'sedang') { ambil('tertukar'); ambil('asal'); ambil(arahBerubah ? 'arah' : 'garis-lain'); ambil('bentuk'); ambil('salin'); }
    else { ambil('tertukar'); ambil('arah|arah-tertukar'); ambil('asal'); ambil('bentuk'); ambil('salin|garis-lain'); }
    ambil('asal|garis-lain|salin|bentuk|arah');
    for (var i = 0; i < 6 && hasil.length < 4; i++) ambil(null);
    return hasil.length === 4 ? hasil : null;
  }

  /** Aturan corak dengan nama sisi menurut arah garis belah `arah` (arah garis contoh). */
  function uraiAturanB(mek, ar, arah) {
    var P = POS_NAMA[ar], kesitu = ar === 'baris' ? 'di sebelah kanannya' : 'di bawahnya', a1 = SISI_A[arah], b1 = SISI_B[arah];
    switch (mek) {
      case 'gabung': return 'kotak ' + P[2] + ' adalah gabungan dua kotak lainnya: belahan ' + a1 + '-nya sama dengan belahan ' + a1 + ' kotak ' + P[0] + ', dan belahan ' + b1 + '-nya sama dengan belahan ' + b1 + ' kotak ' + P[1];
      case 'gabung-silang': return 'belahan ' + a1 + ' kotak ' + P[2] + ' sama dengan belahan ' + b1 + ' kotak ' + P[1] + ', dan belahan ' + b1 + ' kotak ' + P[2] + ' sama dengan belahan ' + a1 + ' kotak ' + P[0] + ' (kedua corak berpindah sisi)';
      case 'geser': return 'belahan ' + b1 + ' suatu kotak menjadi belahan ' + a1 + ' kotak ' + kesitu + ', dan belahan ' + a1 + ' kotak ' + P[0] + ' menjadi belahan ' + b1 + ' kotak ' + P[2] + ' (ketiga corak bergeser melingkar)';
      case 'geser-balik': return 'belahan ' + a1 + ' suatu kotak menjadi belahan ' + b1 + ' kotak ' + kesitu + ', dan belahan ' + b1 + ' kotak ' + P[0] + ' menjadi belahan ' + a1 + ' kotak ' + P[2] + ' (ketiga corak bergeser melingkar)';
      default: return 'kotak ' + P[1] + ' adalah kotak ' + P[0] + ' dengan corak belahan ' + a1 + ' dan belahan ' + b1 + ' bertukar, lalu kotak ' + P[2] + ' menukarnya kembali sehingga coraknya sama dengan kotak ' + P[0];
    }
  }

  /** Ujung lain relasi yang menyentuh (kotak m, belahan X) pada garis aturan. */
  function pasanganRel(mek, m, X) {
    var rel = MEK_B[mek].rel;
    for (var i = 0; i < rel.length; i++) {
      var pr = rel[i];
      if (pr[0][0] === m && pr[0][1] === X && pr[1][0] !== m) return pr[1];
      if (pr[1][0] === m && pr[1][1] === X && pr[0][0] !== m) return pr[0];
    }
    return null;
  }

  // ------------------------------------------------- gambar pembahasan belahan

  function legenda(o, baris, x, y) {
    baris.forEach(function (t, i) { o.push(teksB(t, x, y + i * 14, { ukuran: 10, isi: BH.teksRedup })); });
  }

  /**
   * Satu garis aturan (baris mendatar, kolom tegak): tiga kotak, belahan yang berpindah bergaris tepi warna
   * coraknya (warna sama = corak sama), panah dari belahan asal ke belahan tujuan; kotak jawaban hijau.
   */
  function svgGarisBelahan(m, judul) {
    var u = 104, g = 50, tegak = m.ar === 'kolom', pad = 12, kiri = 64, o = [];
    var y0 = pad + 26 + (tegak ? 6 : 20), x0 = pad + (tegak ? kiri : 0);
    var sel = m.sel.map(function (x) { return x || m.jawaban; });
    var pos = [0, 1, 2].map(function (i) { return tegak ? [x0, y0 + i * (u + g)] : [x0 + i * (u + g), y0]; });
    var lajur = tegak ? x0 + u + 22 : y0 + u + 22;
    var leg = ['Warna yang sama menandai corak yang sama; panah menunjuk dari belahan asal.', 'Dalam satu ' + m.ar + ' arah garis belahnya sama, jadi belahan dibandingkan sisi demi sisi.'];
    var W0 = tegak ? x0 + u + 46 : pad * 2 + 3 * u + 2 * g;
    var W = lebarJudul(judul, Math.max(W0, Math.ceil(Math.max(Metrik.lebar(leg[0], 10), Metrik.lebar(leg[1], 10))) + 2 * pad + 4));
    var yLeg = tegak ? y0 + 3 * u + 2 * g + 22 : lajur + 24, H = yLeg + 14 + pad + 4;
    o.push(teksB(judul, pad, pad + 13, { ukuran: 13, tebal: true }));
    var poli = sel.map(function (x, i) { return belahPoli(x, pos[i][0] + u / 2, pos[i][1] + u / 2, JARI * u); });
    pos.forEach(function (p, i) {
      var jawab = i === m.jawab;
      o.push(bingkai(p[0], p[1], u, jawab ? { latar: BH.latarJawab, tepi: BH.jawab, tebal: 3 } : {}));
      o.push(gambarBelahan(sel[i], p[0] + u / 2, p[1] + u / 2, JARI * u));
      var w = jawab ? BH.jawab : BH.teks;
      if (tegak) o.push(teksB(m.label[i], pad, p[1] + u / 2 + 4, { ukuran: 11, tebal: true, isi: w }));
      else o.push(teksB(m.label[i], p[0] + u / 2, y0 - 7, { ukuran: 11, tebal: true, isi: w, rata: 'middle' }));
    });
    var rel = MEK_B[m.mek].rel, warna = {}, n = 0;
    function nilai(e) { return sel[e[0]].corak[ke(e[1])]; }
    rel.forEach(function (pr) { var v = nilai(pr[1]); if (warna[v] === undefined) warna[v] = WARNA_JEJAK[n++ % WARNA_JEJAK.length]; });
    rel.forEach(function (pr) {
      var w = warna[nilai(pr[1])];
      [pr[0], pr[1]].forEach(function (e) { o.push(S.poli(poli[e[0]][e[1]], { tutup: true, isi: 'none', garis: w, tebal: 3.4, sambung: 'round' })); });
    });
    // panah lurus antarkotak bertetangga digeser tegak lurus arah garis (per pasangan kotak) supaya tidak berimpit
    var kelompok = {};
    rel.forEach(function (pr, k) { if (Math.abs(pr[0][0] - pr[1][0]) === 1) (kelompok[Math.min(pr[0][0], pr[1][0])] = kelompok[Math.min(pr[0][0], pr[1][0])] || []).push(k); });
    rel.forEach(function (pr, k) {
      var tuj = pr[0], asal = pr[1], w = warna[nilai(asal)];
      var p0 = Bentuk.beratTitik(poli[asal[0]][asal[1]]), p1 = Bentuk.beratTitik(poli[tuj[0]][tuj[1]]);
      if (Math.abs(tuj[0] - asal[0]) === 1) {
        var pas = Math.min(tuj[0], asal[0]), anggota = kelompok[pas], urut = anggota.indexOf(k);
        var geser = (pas === 0 ? -7 : 7) + (urut - (anggota.length - 1) / 2) * 16;
        var dx = tegak ? geser : 0, dy = tegak ? 0 : geser;
        o.push(S.panah(p0[0] + dx, p0[1] + dy, p1[0] + dx, p1[1] + dy, { warna: w, tebal: 2.6, kepala: 10, halo: true }));
        return;
      }
      var jalur = tegak ? [p0, [lajur, p0[1]], [lajur, p1[1]]] : [p0, [p0[0], lajur], [p1[0], lajur]];
      o.push(S.poli(jalur, { garis: '#ffffff', tebal: 6.5, ujung: 'round', sambung: 'round' }));
      o.push(S.poli(jalur, { garis: w, tebal: 2.6, putus: '7 4', sambung: 'round' }));
      o.push(S.panah(jalur[2][0], jalur[2][1], p1[0], p1[1], { warna: w, tebal: 2.6, kepala: 10, halo: true }));
    });
    legenda(o, leg, pad, yLeg);
    return { svg: S.doc(o.join(''), W, H, { latar: '#ffffff' }), lebar: W, tinggi: H };
  }

  /** Arsir latar baris/kolom penentu pada matriks kecil. */
  function sorotGaris(o, jenis, ar, tr, tc, px, py, mc, sela) {
    var lebar = 3 * mc + 2 * sela + 10;
    var baris = function () { o.push(S.rect(px(0) - 5, py(tr) - 5, lebar, mc + 10, { rx: 6, isi: BH.latarPanah })); };
    var kolom = function () { o.push(S.rect(px(tc) - 5, py(0) - 5, mc + 10, lebar, { rx: 6, isi: BH.latarPanah })); };
    if (jenis === 'baris' || jenis === 'latin') baris();
    if (jenis === 'kolom' || jenis === 'latin') kolom();
  }

  function ringkasPola(info, subjek) {
    if (info.jenis === 'sama') return subjek + ' sama di semua kotak';
    if (info.jenis === 'baris') return subjek + ' sama dalam satu baris';
    if (info.jenis === 'kolom') return subjek + ' sama dalam satu kolom';
    return 'tiap baris dan kolom memuat ketiga ' + (subjek === 'bentuk' ? 'bentuk' : 'arah');
  }

  /** Matriks kecil bentuk bangun dan/atau garis belah (tanpa corak); garis penentu diarsir, kotak jawaban hijau. */
  function svgKanalBelahan(m, judul) {
    var pad = 12, mc = 44, sela = 8, lebarPanel = 3 * mc + 2 * sela + 20, y0 = pad + 26, o = [];
    var panel = [];
    if (m.bentuk.jenis !== 'sama') panel.push({ kanal: 'bentuk', judul: 'Bentuk bangun', info: m.bentuk });
    if (m.arah.jenis !== 'sama') panel.push({ kanal: 'arah', judul: 'Garis belah', info: m.arah });
    var W = lebarJudul(judul, pad * 2 + panel.length * lebarPanel + (panel.length - 1) * 24), tinggi = 0;
    var G = m.grid.map(function (b, r) { return b.map(function (x, c) { return r === m.tanya[0] && c === m.tanya[1] ? m.jawaban : x; }); });
    var tr = m.tanya[0], tc = m.tanya[1];
    o.push(teksB(judul, pad, pad + 13, { ukuran: 13, tebal: true }));
    panel.forEach(function (pn, ki) {
      var x0 = pad + ki * (lebarPanel + 24);
      o.push(teksB(pn.judul, x0, y0 + 12, { tebal: true }));
      var urai = paragrafB(ringkasPola(pn.info, pn.kanal === 'bentuk' ? 'bentuk' : 'arah'), x0, y0 + 27, lebarPanel - 4, { ukuran: 10, isi: BH.panah, tebal: true });
      o.push(urai.svg);
      var gy = y0 + 42 + (urai.baris - 1) * 13;
      var px = function (c) { return x0 + 8 + c * (mc + sela); }, py = function (r) { return gy + r * (mc + sela); };
      sorotGaris(o, pn.info.jenis, pn.info.ar, tr, tc, px, py, mc, sela);
      for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) {
        var jawab = r === tr && c === tc;
        o.push(S.rect(px(c), py(r), mc, mc, { rx: 4, isi: jawab ? BH.latarJawab : '#ffffff', garis: jawab ? BH.jawab : '#c4cad6', tebal: jawab ? 2.4 : 1 }));
        o.push(kerangkaBelahan(G[r][c], px(c) + mc / 2, py(r) + mc / 2, mc * 0.4, pn.kanal === 'bentuk' ? { belah: false } : { bentuk: false }));
      }
      var bawah = py(2) + mc + 18;
      var ket = paragrafB('Kotak jawaban: ' + (pn.kanal === 'bentuk' ? NB(m.jawaban.bentuk) : 'garis ' + NAMA_ARAH[m.jawaban.arah]), x0, bawah, lebarPanel - 4, { ukuran: 10, tebal: true, isi: BH.jawab });
      o.push(ket.svg);
      tinggi = Math.max(tinggi, bawah + (ket.baris - 1) * 13 + pad);
    });
    return { svg: S.doc(o.join(''), W, tinggi, { latar: '#ffffff' }), lebar: W, tinggi: tinggi };
  }

  // ------------------------------------------------- rakit butir belahan

  function labelGaris(ar, tr, tc) {
    return [0, 1, 2].map(function (i) { return ar === 'baris' ? 'kolom ' + (i + 1) : 'baris ' + (i + 1); });
  }

  function buatBelahan(id, level, benih, opsi) {
    var a = Rng.alat(benih);
    var target = opsi.target == null ? a.bulat(0, 4) : opsi.target;
    for (var coba = 0; coba < 60; coba++) {
      var rc = rencanaBelahan(a, level, opsi.polaDipakai);
      var cor = corakGarisB(a, rc.mek);
      if (!cor) continue;
      var tanya = tanyaBelahan(a, level, rc), tr = tanya[0], tc = tanya[1];
      var bInfo = { jenis: mutlak(rc.bentuk, rc.ar), ar: rc.ar }, Bg = gridPola(a, bInfo.jenis, BENTUK_B);
      var aInfo = arahGrid(a, rc.arah, rc.ar, rc.ar === 'baris' ? tr : tc, !!MEK_B[rc.mek].ujung);
      var grid = [[], [], []];
      for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) {
        var l = rc.ar === 'baris' ? r : c, i = rc.ar === 'baris' ? c : r;
        grid[r][c] = selB(Bg[r][c], aInfo.grid[r][c], cor[l][i][0], cor[l][i][1]);
      }
      var kunci = grid[tr][tc];
      var tampak = grid.map(function (b, r2) { return b.map(function (x, c2) { return r2 === tr && c2 === tc ? null : x; }); });
      var ramal = ramalBelahan(tampak, tr, tc);
      if (!ramal || sj(ramal) !== sj(kunci) || cacatBelahan(tampak, tr, tc, kunci)) continue;
      var peng = pengecohBelahan(a, level, tampak, tr, tc, kunci, rc);
      if (!peng) continue;

      var ar = rc.ar, ql = ar === 'baris' ? tr : tc, m = ar === 'baris' ? tc : tr, P = POS_NAMA[ar];
      // garis contoh: garis lengkap yang arah garis belahnya sama dengan garis "?" bila ada
      var lengkap = [0, 1, 2].filter(function (l) { return l !== ql; }), aQ = kunci.arah;
      var lc = lengkap.filter(function (l) { return garis(grid, ar, l)[0].arah === aQ; }).concat(lengkap)[0], contoh = garis(grid, ar, lc), aC = contoh[0].arah;
      var gq = garis(tampak, ar, ql), pem = [];
      pem.push('Setiap kotak berisi sebuah bangun yang dibelah dua oleh sebuah garis, dan setiap belahan bercorak. Pada setiap ' + ar + ', ketiga bangun dibelah dengan arah garis yang sama, jadi belahannya dibandingkan sisi demi sisi. Kotak yang dicari berada pada ' + namaLetak(tr, tc) + '.');
      pem.push('Aturan corak, dilihat pada ' + ar + ' ' + (lc + 1) + ' (garis belah ' + NAMA_ARAH[aC] + '): pada setiap ' + ar + ', ' + uraiAturanB(rc.mek, ar, aC) + '.');
      pem.push('Isi ' + ar + ' ' + (lc + 1) + ' (' + (ar === 'baris' ? 'dari kiri ke kanan' : 'dari atas ke bawah') + '): ' + contoh.map(function (x, k) { return 'kotak ' + P[k] + ' belahan ' + SISI_A[aC] + ' ' + NC(x.corak[0]) + ' dan belahan ' + SISI_B[aC] + ' ' + NC(x.corak[1]); }).join('; ') +
        '. Gambar 1 menandai belahan yang berpindah dengan garis berwarna (warna yang sama berarti corak yang sama) dan panah dari asalnya.');
      var kalSisi;
      if (aQ === aC) kalSisi = 'Garis belah pada ' + ar + ' ' + (ql + 1) + ' juga ' + NAMA_ARAH[aQ] + ', jadi sisinya sama persis dengan ' + ar + ' ' + (lc + 1) + '.';
      else {
        // relasi yang tampak di garis "?" memperlihatkan sisi mana yang bersesuaian
        var rq = MEK_B[rc.mek].rel.filter(function (pr) { return pr[0][0] !== m && pr[1][0] !== m; })[0];
        kalSisi = 'Garis belah pada ' + ar + ' ' + (ql + 1) + ' ' + NAMA_ARAH[aQ] + '. Di ' + ar + ' itu corak ' + NC(gq[rq[1][0]].corak[ke(rq[1][1])]) + ' pada belahan ' + sisi(rq[1][1], aQ) + ' kotak ' + P[rq[1][0]] +
          ' muncul lagi pada belahan ' + sisi(rq[0][1], aQ) + ' kotak ' + P[rq[0][0]] + ', jadi sisi ' + SISI_A[aQ] + ' di sini berperan seperti sisi ' + SISI_A[aC] + ' pada ' + ar + ' ' + (lc + 1) + ', dan sisi ' + SISI_B[aQ] + ' seperti sisi ' + SISI_B[aC] + '.';
      }
      var terap = ['A', 'B'].map(function (X) {
        var e = pasanganRel(rc.mek, m, X), asal = gq[e[0]];
        return 'belahan ' + sisi(X, aQ) + ' kotak yang dicari sama dengan belahan ' + sisi(e[1], aQ) + ' kotak ' + P[e[0]] + ', yaitu ' + NC(asal.corak[ke(e[1])]);
      });
      pem.push(kalSisi + ' Menurut aturan itu, ' + terap.join('; ') + '. Gambar 2 memperlihatkan penerapannya; kotak jawaban berlatar hijau.');
      var Kb = kanalB(tampak), kalimat = [];
      kalimat.push(uraiPolaKanal(bInfo, Kb.bentuk, tr, tc, kunci.bentuk, NB, { semua: 'Semua bangun berbentuk', subjek: 'Bentuk bangun', jamak: 'bentuk', hasil: 'bentuk kotak yang dicari adalah' }));
      kalimat.push(uraiPolaKanal(aInfo, Kb.arah, tr, tc, kunci.arah, function (v) { return NAMA_ARAH[v]; }, { semua: 'Semua garis belah', subjek: 'Arah garis belah', jamak: 'arah garis belah', hasil: 'garis belah kotak yang dicari' }));
      var adaKanal = bInfo.jenis !== 'sama' || aInfo.jenis !== 'sama';
      pem.push(kalimat.join(' ') + (adaKanal ? ' Gambar 3 memperlihatkan ' + (bInfo.jenis !== 'sama' && aInfo.jenis !== 'sama' ? 'bentuk dan garis belah' : (bInfo.jenis !== 'sama' ? 'bentuk' : 'garis belah')) + ' setiap kotak tanpa coraknya; garis penentu diarsir biru.' : ''));
      pem.push('Jadi kotak pengganti tanda tanya berisi ' + uraiSelB(kunci) + '.');

      var daftar = a.kocok(peng.map(function (p) { return { sel: p.sel, alasan: p.alasan, kunci: false }; }));
      daftar.splice(target, 0, { sel: kunci, alasan: null, kunci: true });
      var opsiGambar = daftar.map(function (d, k) {
        return { teks: 'Gambar opsi ' + Fmt.huruf(k), nilai: k, alasan: d.alasan ? Fmt.kapital(d.alasan) + '.' : null, kunci: d.kunci,
          gambar: { id: 'opsi-' + Fmt.huruf(k).toLowerCase(), jenis: 'mcorak-belahan-opsi', model: { fig: d.sel }, judul: 'Opsi ' + Fmt.huruf(k) } };
      });
      var utuhStr = grid.map(function (b) { return b.map(function (x) { return [x.bentuk, x.arah, x.corak.join('+')].join('.'); }).join('/'); }).join('//');
      var ctx = { subtes: 'ku', submateri: 'figural', keluarga: id, level: level, benih: benih, a: a };
      var butir = Butir.rakitPg(ctx, {
        jenisSoal: 'Figural Matriks - Kotak 3x3 (belahan bercorak)',
        judul: 'Figural Matriks - Kotak 3x3', teks: [], pertanyaan: '', perintah: PERINTAH,
        gambar: [{ id: 'soal', jenis: 'mcorak-belahan', model: { grid: tampak, tanya: [tr, tc] }, judul: 'Matriks 3x3 belahan bercorak' }],
        pilihanJadi: { opsi: opsiGambar, kunciIndex: target }, tulisKunci: false,
        langkah: [], pembahasan: pem,
        model: { topik: 'Figural', tipe: 'matriks-belahan', grid: tampak, tanya: [tr, tc], pilihan: daftar.map(function (d) { return d.sel; }), kunciIndex: target },
        sidik: { inti: 'matriks-belahan|' + utuhStr + '|' + tr + tc, param: [], entitas: rc.pola }
      });
      if (!butir) continue;
      var lab = labelGaris(ar);
      var selQ = gq;
      butir.gambarPembahasan = [
        { id: 'bahas-1', jenis: 'mcorak-belahan-garis', judul: 'Gambar 1. Contoh aturan corak pada ' + ar + ' ' + (lc + 1), model: { sel: contoh, ar: ar, mek: rc.mek, label: lab, jawab: -1 } },
        { id: 'bahas-2', jenis: 'mcorak-belahan-garis', judul: 'Gambar 2. Aturan yang sama pada ' + ar + ' ' + (ql + 1), model: { sel: selQ, ar: ar, mek: rc.mek, label: lab, jawab: m, jawaban: kunci } }
      ];
      if (adaKanal) {
        butir.gambarPembahasan.push({ id: 'bahas-3', jenis: 'mcorak-belahan-kanal', judul: 'Gambar 3. ' + (bInfo.jenis !== 'sama' && aInfo.jenis !== 'sama' ? 'Bentuk dan garis belah' : (bInfo.jenis !== 'sama' ? 'Bentuk bangun' : 'Garis belah')) + ' tiap kotak',
          model: { grid: tampak, tanya: [tr, tc], bentuk: bInfo, arah: { jenis: aInfo.jenis, ar: aInfo.ar }, jawaban: kunci } });
      }
      butir.pola = rc.pola;
      butir.kategoriRiset = 'pengayaan';
      butir.catatanRiset = CATATAN;
      return butir;
    }
    return null;
  }

  // =================================================================== MATRIKS POLA CORAK

  var TETAP90 = ['hitam', 'putih', 'titik', 'bintang', 'bulatan', 'kotak', 'kotak-miring'];
  var ARSIR = ['arsir-0', 'arsir-45', 'arsir-90', 'arsir-135'];
  var DASAR_JALAN = ['putih', 'titik', 'bintang', 'kotak', 'kotak-miring', 'arsir-0', 'arsir-45', 'arsir-90', 'arsir-135'];

  function beda4(c) { return c.length === 4 && unik(c).length === 4; }

  /** Putar susunan k bagian searah jarum jam (k negatif = berlawanan); `ikut`: arah arsir ikut berputar. */
  function putarSusun(c, k, ikut) {
    var o = [];
    for (var p = 0; p < 4; p++) o[mod(p + k, 4)] = ikut ? Corak.putarKode(c[p], 90 * k) : c[p];
    return o;
  }

  /** Cermin susunan: bagian p pindah ke bagian (cc - p); sumbu cerminnya menurut cara pembagian. */
  function cerminSusun(c, cc, bagi, ikut) {
    var beta = bagi === '+' ? 45 * (cc + 1) : 45 * cc, sumbu = mod(90 - beta, 180), o = [];
    for (var p = 0; p < 4; p++) o[mod(cc - p, 4)] = ikut ? Corak.cerminKode(c[p], sumbu) : c[p];
    return o;
  }

  var TRANS = {};
  ['+', 'x'].forEach(function (bagi) {
    var t = [];
    [0, 1, 2, 3].forEach(function (k) {
      [false, true].forEach(function (ikut) {
        if (k === 0 && ikut) return;
        t.push({ f: function (c) { return putarSusun(c, k, ikut); }, inv: function (c) { return putarSusun(c, -k, ikut); } });
      });
    });
    [0, 1, 2, 3].forEach(function (cc) {
      [false, true].forEach(function (ikut) {
        var f = function (c) { return cerminSusun(c, cc, bagi, ikut); };
        t.push({ f: f, inv: f });
      });
    });
    TRANS[bagi] = t;
  });

  function samaSusun(x, y) { return x.join(',') === y.join(','); }

  /**
   * Aturan susunan per garis (tiap transformasi putar/cermin, dengan atau tanpa arah arsir ikut berubah):
   *   langkah  kotak berikutnya = T(kotak sebelumnya) pada setiap garis
   *   ujung    kotak terakhir = T(kotak pertama) pada setiap garis
   * Mengembalikan { ramal: [susunan], putus: boolean }.
   */
  function aturanSusun(C, tr, tc, bagi) {
    var ramal = [], putus = false, langkahBerlaku = false;
    TRANS[bagi].forEach(function (T) {
      ['baris', 'kolom'].forEach(function (ar) {
        var ql = ar === 'baris' ? tr : tc, m = ar === 'baris' ? tc : tr, l, g;
        // langkah
        var ok = true;
        for (l = 0; l < 3 && ok; l++) {
          if (l === ql) continue;
          g = garis(C, ar, l);
          if (!samaSusun(T.f(g[0]), g[1]) || !samaSusun(T.f(g[1]), g[2])) ok = false;
        }
        if (ok) {
          g = garis(C, ar, ql);
          var cal = [], cocok = true;
          for (var i = 0; i < 2; i++) if (g[i] && g[i + 1] && !samaSusun(T.f(g[i]), g[i + 1])) cocok = false;
          if (m > 0) cal.push(T.f(g[m - 1]));
          if (m < 2) cal.push(T.inv(g[m + 1]));
          if (cal.length === 2 && !samaSusun(cal[0], cal[1])) cocok = false;
          if (cocok) { ramal.push(cal[0]); langkahBerlaku = true; } else putus = true;
        }
        // ujung
        ok = true;
        for (l = 0; l < 3 && ok; l++) {
          if (l === ql) continue;
          g = garis(C, ar, l);
          if (!samaSusun(T.f(g[0]), g[2])) ok = false;
        }
        if (ok) {
          g = garis(C, ar, ql);
          if (m === 1) { if (!samaSusun(T.f(g[0]), g[2])) putus = true; }
          else ramal.push(m === 2 ? T.f(g[0]) : T.inv(g[2]));
        }
      });
    });
    return { ramal: ramal, putus: putus, langkah: langkahBerlaku };
  }

  /** Hitam berjalan: tepat satu bagian hitam per kotak, maju k bagian tiap kotak; bagian lain tetap sepanjang garis. */
  function ramalJalan(C, tr, tc, ar, k) {
    var ql = ar === 'baris' ? tr : tc, m = ar === 'baris' ? tc : tr, i, j, p;
    function hitam(t) { var h = -1, n = 0; t.forEach(function (v, q) { if (v === 'hitam') { h = q; n++; } }); return n === 1 ? h : -1; }
    for (var l = 0; l < 3; l++) {
      var g = garis(C, ar, l), h = g.map(function (t) { return t ? hitam(t) : null; });
      for (i = 0; i < 3; i++) if (g[i] && h[i] < 0) return null;
      for (i = 0; i < 3; i++) for (j = i + 1; j < 3; j++) {
        if (!g[i] || !g[j]) continue;
        if (mod(h[j] - h[i] - k * (j - i), 4) !== 0) return null;
        for (p = 0; p < 4; p++) if (p !== h[i] && p !== h[j] && g[i][p] !== g[j][p]) return null;
      }
    }
    var gq = garis(C, ar, ql), hq = gq.map(function (t) { return t ? hitam(t) : null; }), out = [null, null, null, null], hm = null;
    for (j = 0; j < 3; j++) if (gq[j]) { hm = mod(hq[j] + k * (m - j), 4); break; }
    out[hm] = 'hitam';
    for (p = 0; p < 4; p++) {
      if (p === hm) continue;
      for (j = 0; j < 3; j++) if (gq[j] && hq[j] !== p) { out[p] = gq[j][p]; break; }
    }
    return out;
  }

  function kanalP(G) {
    return { bentuk: petaGrid(G, function (x) { return x.bentuk; }), bagi: petaGrid(G, function (x) { return x.bagi; }), C: petaGrid(G, function (x) { return x.corak; }) };
  }

  /** Tebakan susunan corak "?" menurut seluruh pustaka; null bila tidak tunggal atau saling bertentangan. */
  function ramalSusun(K, tr, tc, bagi) {
    var tetap = [null, null, null, null], gagal = false;
    function pasang(t) {
      t.forEach(function (v, p) { if (v == null) return; if (tetap[p] == null) tetap[p] = v; else if (tetap[p] !== v) gagal = true; });
    }
    var at = aturanSusun(K.C, tr, tc, bagi), jelas = at.langkah, perBagian = 0;
    at.ramal.forEach(pasang);
    ['baris', 'kolom'].forEach(function (ar) { [1, 3].forEach(function (k) { var r = ramalJalan(K.C, tr, tc, ar, k); if (r) { pasang(r); jelas = true; } }); });
    // pola letak susunan utuh
    var Su = petaGrid(K.C, function (t) { return t.join(','); });
    var tampakSu = unik([].concat.apply([], Su).filter(function (x) { return x != null; }));
    Object.keys(POLA).forEach(function (nm) {
      var boleh = tampakSu.filter(function (v) { return POLA[nm](isiLubang(Su, tr, tc, v)); });
      if (boleh.length === 1) pasang(boleh[0].split(','));
      else if (boleh.length > 1) gagal = true;
    });
    // pola letak tiap bagian
    for (var p = 0; p < 4; p++) {
      var Vp = petaGrid(K.C, function (t) { return t[p]; }), cal = calonKanal(Vp, tr, tc, Corak.KODE, null, null);
      if (cal.length < Corak.KODE.length) perBagian++;
      if (tetap[p] != null) { if (cal.indexOf(tetap[p]) < 0) gagal = true; }
      else if (cal.length === 1) tetap[p] = cal[0];
    }
    // susunan harus terjelaskan seluruhnya: aturan langkah/hitam berjalan berlaku, atau setiap bagian berpola letak
    if (!jelas && perBagian < 4) gagal = true;
    if (gagal || tetap.some(function (v) { return v == null; }) || !beda4(tetap)) return null;
    return tetap;
  }

  function ramalPola(G, tr, tc) {
    var K = kanalP(G);
    var b = calonKanal(K.bentuk, tr, tc, BENTUK_P, null, []), d = calonKanal(K.bagi, tr, tc, ['+', 'x'], null, []);
    if (b.length !== 1 || d.length !== 1) return null;
    var t = ramalSusun(K, tr, tc, d[0]);
    return t ? selP(b[0], d[0], t) : null;
  }

  function cacatPola(G, tr, tc) {
    var K = kanalP(G), bagi = G[tr === 0 ? 1 : 0][tc].bagi;
    return putusKanal(K.bentuk, tr, tc, BENTUK_P, null, []) || putusKanal(K.bagi, tr, tc, ['+', 'x'], null, []) ||
      !utuh([K.bentuk], tr, tc) || aturanSusun(K.C, tr, tc, bagi).putus;
  }

  function rencanaPola(a, level, dipakai) {
    var semua = [];
    function tambah(mek, ar, k, ikut, bentuk, bobot) { for (var i = 0; i < (bobot || 1); i++) semua.push({ mek: mek, ar: ar, k: k, ikut: ikut, bentuk: bentuk }); }
    if (level === 'mudah') {
      tambah('putar', 'baris', 1, false, 'sama', 2); tambah('putar', 'baris', 3, false, 'sama', 2);
      tambah('jalan', 'baris', 1, false, 'sama', 1); tambah('jalan', 'baris', 3, false, 'sama', 1);
    } else if (level === 'sedang') {
      [1, 3].forEach(function (k) {
        tambah('putar', 'kolom', k, false, a.pilih(['sama', 'garis']), 1);
        tambah('putar', 'baris', k, false, 'silang', 1);
        tambah('jalan', 'kolom', k, false, a.pilih(['sama', 'silang']), 1);
      });
      tambah('latin', 'baris', null, false, a.pilih(['sama', 'baris', 'kolom']), 2);
    } else {
      [1, 3].forEach(function (k) {
        tambah('putar', a.pilih(['baris', 'kolom']), k, false, 'latin', 1);
        tambah('putar', a.pilih(['baris', 'kolom']), k, true, a.pilih(['sama', 'silang', 'latin']), 2);
        tambah('jalan', a.pilih(['baris', 'kolom']), k, false, 'latin', 1);
      });
      tambah('latin', 'baris', null, false, 'latin', 1);
    }
    var nama = function (p) { return p.mek === 'latin' ? 'latin-bagian' : p.mek === 'jalan' ? 'hitam-berjalan-' + p.ar : (p.ikut ? 'putar-arsir-' : 'putar-') + (p.k === 1 ? 'searah' : 'berlawanan') + '-' + p.ar; };
    var inti = function (p) { return 'matriks-corak-pola:' + nama(p) + '+'; };
    var baru = semua.filter(function (p) { return !(dipakai || []).some(function (d) { return d.indexOf(inti(p)) === 0; }); });
    var p = salin(a.pilih(baru.length ? baru : semua));
    p.pola = inti(p) + 'bentuk-' + p.bentuk;
    return p;
  }

  /** Susunan awal tiap garis (putar): empat corak berbeda; pada putar arsir tiap susunan memuat corak arsir. */
  function susunAwalPutar(a, ikut) {
    var out = [];
    for (var l = 0; l < 3; l++) {
      var t;
      if (ikut) { var nA = a.pilih([1, 1, 2]); t = a.kocok(a.ambil(ARSIR, nA).concat(a.ambil(TETAP90, 4 - nA))); }
      else t = a.ambil(TETAP90, 4);
      out.push(t);
    }
    return out;
  }

  function bangunCorakPola(a, rc) {
    var G = [[], [], []], l, i, p, pos;
    if (rc.mek === 'putar') {
      var awal = susunAwalPutar(a, rc.ikut);
      for (l = 0; l < 3; l++) for (i = 0; i < 3; i++) { pos = letak(rc.ar, l, i); G[pos[0]][pos[1]] = putarSusun(awal[l], rc.k * i, rc.ikut); }
      return { C: G, awal: awal };
    }
    if (rc.mek === 'jalan') {
      var mulai = a.ambil([0, 1, 2, 3], 3), dasar = [];
      for (l = 0; l < 3; l++) {
        var d = a.ambil(DASAR_JALAN, 4);
        dasar.push(d);
        for (i = 0; i < 3; i++) {
          var t = d.slice();
          t[mod(mulai[l] + rc.k * i, 4)] = 'hitam';
          pos = letak(rc.ar, l, i); G[pos[0]][pos[1]] = t;
        }
      }
      return { C: G, dasar: dasar, mulai: mulai };
    }
    // latin tiap bagian
    for (var coba = 0; coba < 300; coba++) {
      var palet = a.ambil(Corak.KODE, a.pilih([6, 7, 8])), Sp = [], Lp = [], ok = true;
      for (p = 0; p < 4; p++) { Sp.push(a.ambil(palet, 3)); Lp.push({ a: a.pilih([1, 2]), b: a.pilih([1, 2]), o: a.bulat(0, 2) }); }
      for (var r = 0; r < 3 && ok; r++) for (var c = 0; c < 3 && ok; c++) {
        var tt = [0, 1, 2, 3].map(function (q) { var L = Lp[q]; return Sp[q][mod(L.a * r + L.b * c + L.o, 3)]; });
        if (!beda4(tt)) ok = false; else G[r][c] = tt;
      }
      if (ok) return { C: G, himpunan: Sp };
    }
    return null;
  }

  function tanyaPola(a, level) {
    if (level === 'mudah') return [2, 2];
    if (level === 'sedang') return a.pilih([[2, 2], [2, 2], [0, 2], [1, 2], [2, 0], [2, 1]]);
    return a.untung(0.3) ? [1, 1] : [a.bulat(0, 2), a.bulat(0, 2)];
  }

  function uraiSusun(c, bagi) { return BAGIAN[bagi].map(function (nm, p) { return nm + ' ' + NC(c[p]); }).join(', '); }

  function pengecohPola(a, level, G, tr, tc, kunci, rc, info) {
    var calon = [], ar = rc.ar, ql = ar === 'baris' ? tr : tc, m = ar === 'baris' ? tc : tr, gs = garis(G, ar, ql), K = kunci.corak, bg = kunci.bagi, NBG = BAGIAN[bg];
    function tambah(susun, jenis, alasan, bentuk) {
      var sel = selP(bentuk || kunci.bentuk, bg, susun);
      if (beda4(sel.corak)) calon.push({ sel: sel, jenis: jenis, alasan: alasan });
    }
    var tampakBentuk = unik([].concat.apply([], G).filter(Boolean).map(function (x) { return x.bentuk; }));
    unik(tampakBentuk.concat(BENTUK_P)).forEach(function (bt) {
      if (bt === kunci.bentuk) return;
      tambah(K, tampakBentuk.indexOf(bt) >= 0 ? 'bentuk' : 'bentuk-jauh', 'susunan coraknya benar tetapi bentuknya ' + NB(bt) + ', padahal pola bentuk menghendaki ' + NB(kunci.bentuk), bt);
    });
    [[tr, tc - 1], [tr, tc + 1], [tr - 1, tc], [tr + 1, tc]].forEach(function (rc2) {
      var r = rc2[0], c = rc2[1];
      if (r < 0 || r > 2 || c < 0 || c > 2) return;
      calon.push({ sel: salin(G[r][c]), jenis: 'salin', alasan: 'hanya menyalin ' + namaTetangga(tr, tc, r, c) + ' tanpa menerapkan aturannya' });
    });
    for (var p = 0; p < 4; p++) {
      var t = K.slice(), q = mod(p + 1, 4), x = t[p]; t[p] = t[q]; t[q] = x;
      tambah(t, 'tukar', 'corak bagian ' + NBG[p] + ' dan bagian ' + NBG[q] + ' tertukar; seharusnya bagian ' + NBG[p] + ' ' + NC(K[p]) + ' dan bagian ' + NBG[q] + ' ' + NC(K[q]));
    }
    if (rc.mek === 'putar') {
      var maju = m > 0, src = (maju ? gs[m - 1] : gs[m + 1]).corak, s = maju ? 1 : -1;
      var jam = JAM[rc.k], lawan = JAM[4 - rc.k];
      tambah(putarSusun(src, -s * rc.k, rc.ikut), 'arah-putar', 'susunannya diputar ' + lawan + ', padahal aturannya berputar ' + jam);
      tambah(putarSusun(src, 2 * rc.k, rc.ikut), 'langkah', 'susunannya diputar dua bagian sekaligus, padahal tiap kotak hanya berputar satu bagian');
      if (rc.ikut) tambah(putarSusun(src, s * rc.k, false), 'arsir', 'letak coraknya sudah berputar dengan benar, tetapi arah garis arsirnya tidak ikut berputar 90°');
      if (!rc.ikut && K.some(function (v) { return v === 'kotak' || v === 'kotak-miring'; })) {
        var tk = K.map(function (v) { return v === 'kotak' ? 'kotak-miring' : v === 'kotak-miring' ? 'kotak' : v; });
        tambah(tk, 'kotak', 'letak coraknya benar tetapi corak berkotak-kotak berubah arah; corak itu tidak berubah ketika bagiannya berputar 90°');
      }
      tambah(cerminSusun(K, a.bulat(0, 3), bg, rc.ikut), 'cermin', 'susunannya dicerminkan, padahal aturannya memutar susunan corak');
    } else if (rc.mek === 'jalan') {
      var h = K.indexOf('hitam'), dasar = info.dasarQ;
      [mod(h - rc.k, 4), mod(h + rc.k, 4), mod(h + 2, 4)].forEach(function (h2, n) {
        var t2 = dasar.slice(); t2[h2] = 'hitam';
        tambah(t2, n === 0 ? 'hitam-tetap' : 'hitam-salah', 'bagian hitamnya berada di bagian ' + NBG[h2] + ', padahal bagian hitam berpindah satu bagian ' + JAM[rc.k] + ' sehingga berada di bagian ' + NBG[h]);
      });
      var lain = DASAR_JALAN.filter(function (v) { return K.indexOf(v) < 0; });
      [0, 1, 2, 3].forEach(function (p2) {
        if (p2 === h) return;
        var t3 = K.slice(); t3[p2] = a.pilih(lain);
        tambah(t3, 'dasar', 'bagian hitamnya benar tetapi bagian ' + NBG[p2] + ' bercorak ' + NC(t3[p2]) + ', padahal corak dasarnya ' + NC(K[p2]));
      });
      tambah(dasar, 'tanpa-hitam', 'corak dasarnya benar tetapi bagian hitamnya tidak ada');
    } else {
      [0, 1, 2, 3].forEach(function (p2) {
        info.himpunan[p2].forEach(function (v) {
          if (v === K[p2]) return;
          var t4 = K.slice(); t4[p2] = v;
          tambah(t4, 'satu', 'bagian ' + NBG[p2] + ' bercorak ' + NC(v) + ', padahal corak itu sudah ada pada bagian ' + NBG[p2] + ' kotak lain di ' + ar + ' itu; yang belum ada adalah ' + NC(K[p2]));
        });
      });
      tambah(putarSusun(K, 1, false), 'putar', 'susunannya diputar satu bagian, padahal corak tiap bagian ditentukan sendiri-sendiri oleh pola barisnya');
    }
    var lihat = {}, hasil = [];
    lihat[sj(kunci)] = 1;
    function ambil(jenis) {
      var c = a.kocok(calon.filter(function (x) { return !lihat[sj(x.sel)] && (!jenis || jenis.split('|').indexOf(x.jenis) >= 0); }))[0];
      if (!c || hasil.length >= 4) return;
      lihat[sj(c.sel)] = 1;
      hasil.push(c);
    }
    var bentukBerubah = rc.bentuk !== 'sama';
    if (rc.mek === 'putar') {
      if (rc.ikut) { ambil('arsir'); ambil('arah-putar'); ambil(bentukBerubah ? 'bentuk' : 'langkah'); ambil('tukar|cermin|langkah'); }
      else if (level === 'mudah') { ambil('arah-putar'); ambil('langkah'); ambil('salin'); ambil('tukar|kotak'); }
      else { ambil('arah-putar'); ambil(bentukBerubah ? 'bentuk' : 'langkah'); ambil('kotak|tukar|cermin'); ambil('langkah|salin'); }
    } else if (rc.mek === 'jalan') { ambil('hitam-tetap'); ambil('hitam-salah'); ambil('dasar'); ambil(bentukBerubah ? 'bentuk' : 'salin|tanpa-hitam'); }
    else { ambil('satu'); ambil('satu'); ambil(bentukBerubah ? 'bentuk' : 'tukar'); ambil('salin|putar|tukar'); }
    ambil('salin|tukar|bentuk|satu|dasar|langkah');
    for (var i = 0; i < 6 && hasil.length < 4; i++) ambil(null);
    return hasil.length === 4 ? hasil : null;
  }

  // ------------------------------------------------- gambar pembahasan pola

  function hitamDi(t) { return t.indexOf('hitam'); }

  /** Bagian yang dilacak pada kotak pertama garis contoh: corak paling mudah dikenali (tidak berarah). */
  function pilihJejak(t) {
    var urut = ['hitam', 'bulatan', 'bintang', 'titik', 'putih', 'kotak', 'kotak-miring'];
    for (var i = 0; i < urut.length; i++) { var p = t.indexOf(urut[i]); if (p >= 0) return p; }
    return 0;
  }

  /**
   * Satu garis aturan pola corak: tiga kotak; di antara kotak panah dengan ikon putaran. Bagian yang dilacak
   * bergaris tepi jingga (putar: satu corak yang berpindah; jalan: bagian hitam), dan pada putar arsir bagian
   * berarsir bergaris tepi biru. Kotak jawaban hijau.
   */
  function svgGarisPola(m, judul) {
    var u = 104, g = 62, tegak = m.ar === 'kolom', pad = 12, kiri = 64, o = [];
    var y0 = pad + 26 + (tegak ? 6 : 20), x0 = pad + (tegak ? kiri : 0);
    var sel = m.sel.map(function (x) { return x || m.jawaban; });
    var pos = [0, 1, 2].map(function (i) { return tegak ? [x0, y0 + i * (u + g)] : [x0 + i * (u + g), y0]; });
    var leg = m.mek === 'jalan' ? ['Garis jingga: bagian hitam yang berpindah satu bagian tiap kotak.'] :
      ['Garis jingga: satu corak yang diikuti perpindahannya.'].concat(m.ikut ? ['Garis biru: bagian berarsir; arah garisnya ikut berputar 90°.'] : []);
    var W0 = tegak ? x0 + u + 120 : pad * 2 + 3 * u + 2 * g;
    var W = lebarJudul(judul, Math.max(W0, Math.ceil(Metrik.lebar(leg[0], 10)) + 2 * pad, leg[1] ? Math.ceil(Metrik.lebar(leg[1], 10)) + 2 * pad : 0));
    var yLeg = tegak ? y0 + 3 * u + 2 * g + 20 : y0 + u + 24, H = yLeg + leg.length * 14 + pad;
    o.push(teksB(judul, pad, pad + 13, { ukuran: 13, tebal: true }));
    var bag = sel.map(function (x, i) { return bagiPoli(x, pos[i][0] + u / 2, pos[i][1] + u / 2, JARI_P * u).bagian; });
    pos.forEach(function (p, i) {
      var jawab = i === m.jawab;
      o.push(bingkai(p[0], p[1], u, jawab ? { latar: BH.latarJawab, tepi: BH.jawab, tebal: 3 } : {}));
      o.push(gambarPola(sel[i], p[0] + u / 2, p[1] + u / 2, JARI * u));
      var w = jawab ? BH.jawab : BH.teks;
      if (tegak) o.push(teksB(m.label[i], pad, p[1] + u / 2 + 4, { ukuran: 11, tebal: true, isi: w }));
      else o.push(teksB(m.label[i], p[0] + u / 2, y0 - 7, { ukuran: 11, tebal: true, isi: w, rata: 'middle' }));
    });
    // bagian yang dilacak
    var jejak = [], biru = [];
    if (m.mek === 'jalan') jejak = sel.map(function (x) { return hitamDi(x.corak); });
    else {
      var p0 = pilihJejak(sel[0].corak);
      jejak = [0, 1, 2].map(function (i) { return mod(p0 + m.k * i, 4); });
      if (m.ikut) {
        var q0 = -1;
        sel[0].corak.forEach(function (v, q) { if (q0 < 0 && /^arsir-/.test(v)) q0 = q; });
        if (q0 >= 0) biru = [0, 1, 2].map(function (i) { return mod(q0 + m.k * i, 4); });
      }
    }
    jejak.forEach(function (p, i) { if (p >= 0) o.push(S.poli(bag[i][p], { tutup: true, isi: 'none', garis: BH.sorot, tebal: 3.4, sambung: 'round' })); });
    biru.forEach(function (p, i) { o.push(S.poli(bag[i][p], { tutup: true, isi: 'none', garis: BH.panah, tebal: 3.4, sambung: 'round' })); });
    // panah antarkotak dan ikon putaran
    for (var i = 0; i < 2; i++) {
      var a0, a1, ik, tk;
      if (tegak) {
        var xm = x0 + u / 2, ya = pos[i][1] + u + 6, yb = pos[i + 1][1] - 6;
        a0 = [xm, ya]; a1 = [xm, yb]; ik = [xm + 34, (ya + yb) / 2]; tk = [xm + 52, (ya + yb) / 2 + 4];
      } else {
        var ym = y0 + u / 2, xa = pos[i][0] + u + 6, xb = pos[i + 1][0] - 6;
        a0 = [xa, ym + 10]; a1 = [xb, ym + 10]; ik = [(xa + xb) / 2, ym - 16]; tk = [(xa + xb) / 2, ym + 30];
      }
      o.push(S.panah(a0[0], a0[1], a1[0], a1[1], { warna: BH.panah, tebal: 2.2, kepala: 8 }));
      var cw = m.k === 1;
      o.push(S.busurPanah(ik[0], ik[1], 10, cw ? -120 : 120, cw ? 150 : -150, { warna: BH.sorot, tebal: 2, kepala: 7 }));
      o.push(teksB(m.mek === 'jalan' ? '1 bagian' : '90°', tk[0], tk[1], { ukuran: 10, tebal: true, isi: BH.sorot, rata: tegak ? 'start' : 'middle' }));
    }
    legenda(o, leg, pad, yLeg);
    return { svg: S.doc(o.join(''), W, H, { latar: '#ffffff' }), lebar: W, tinggi: H };
  }

  /**
   * Latin tiap bagian: empat matriks kecil (satu per bagian) berisi contoh corak bagian itu di setiap kotak;
   * kotak jawaban bergaris hijau.
   */
  function svgLatinPola(m, judul) {
    var pad = 12, w = 28, sela = 5, mat = 3 * w + 2 * sela, jarak = 30, y0 = pad + 26 + 20, o = [];
    var G = m.grid.map(function (b, r) { return b.map(function (x, c) { return r === m.tanya[0] && c === m.tanya[1] ? m.jawaban : x; }); });
    var nama = BAGIAN[m.jawaban.bagi];
    var leg = 'Tiap baris dan tiap kolom memuat tiga corak berbeda untuk bagian yang sama.';
    var W = lebarJudul(judul, Math.max(pad * 2 + 4 * mat + 3 * jarak, Math.ceil(Metrik.lebar(leg, 10)) + 2 * pad)), H = y0 + mat + 46;
    o.push(teksB(judul, pad, pad + 13, { ukuran: 13, tebal: true }));
    for (var p = 0; p < 4; p++) {
      var x0 = pad + p * (mat + jarak);
      o.push(teksB('bagian ' + nama[p], x0 + mat / 2, y0 - 8, { ukuran: 11, tebal: true, rata: 'middle' }));
      for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) {
        var jawab = r === m.tanya[0] && c === m.tanya[1], x = x0 + c * (w + sela), y = y0 + r * (w + sela);
        if (jawab) o.push(S.rect(x - 3, y - 3, w + 6, w + 6, { rx: 3, isi: BH.latarJawab, garis: BH.jawab, tebal: 2.4 }));
        o.push(contohCorak(G[r][c].corak[p], x, y, w));
      }
    }
    o.push(teksB(leg, pad, y0 + mat + 26, { ukuran: 10, isi: BH.teksRedup }));
    return { svg: S.doc(o.join(''), W, H, { latar: '#ffffff' }), lebar: W, tinggi: H };
  }

  /** Panel bentuk bangun (matriks kecil kerangka) dan/atau pasangan arah arsir sebelum-sesudah diputar 90°. */
  function svgKanalPola(m, judul) {
    var pad = 12, y0 = pad + 26, o = [], x = pad, tinggi = 0;
    var G = m.grid.map(function (b, r) { return b.map(function (xx, c) { return r === m.tanya[0] && c === m.tanya[1] ? m.jawaban : xx; }); });
    var tr = m.tanya[0], tc = m.tanya[1];
    o.push(teksB(judul, pad, pad + 13, { ukuran: 13, tebal: true }));
    if (m.bentuk.jenis !== 'sama') {
      var mc = 44, sela = 8, lebarPanel = 3 * mc + 2 * sela + 20;
      o.push(teksB('Bentuk bangun', x, y0 + 12, { tebal: true }));
      var urai = paragrafB(ringkasPola(m.bentuk, 'bentuk'), x, y0 + 27, lebarPanel - 4, { ukuran: 10, isi: BH.panah, tebal: true });
      o.push(urai.svg);
      var gy = y0 + 42 + (urai.baris - 1) * 13, x0 = x;
      var px = function (c) { return x0 + 8 + c * (mc + sela); }, py = function (r) { return gy + r * (mc + sela); };
      sorotGaris(o, m.bentuk.jenis, m.bentuk.ar, tr, tc, px, py, mc, sela);
      for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) {
        var jawab = r === tr && c === tc;
        o.push(S.rect(px(c), py(r), mc, mc, { rx: 4, isi: jawab ? BH.latarJawab : '#ffffff', garis: jawab ? BH.jawab : '#c4cad6', tebal: jawab ? 2.4 : 1 }));
        o.push(kerangkaPola(G[r][c], px(c) + mc / 2, py(r) + mc / 2, mc * 0.4));
      }
      var bawah = py(2) + mc + 18;
      o.push(teksB('Kotak jawaban: ' + NB(m.jawaban.bentuk), x0, bawah, { ukuran: 10, tebal: true, isi: BH.jawab }));
      tinggi = Math.max(tinggi, bawah + pad);
      x += lebarPanel + 24;
    }
    if (m.ikut) {
      var sw = 34, lebarP = 250;
      o.push(teksB('Arah arsir ikut berputar 90°', x, y0 + 12, { tebal: true }));
      var yy = y0 + 30;
      m.pasangan.forEach(function (ps) {
        o.push(contohCorak(ps[0], x, yy, sw));
        o.push(S.panah(x + sw + 8, yy + sw / 2, x + sw + 44, yy + sw / 2, { warna: BH.panah, tebal: 2, kepala: 8 }));
        o.push(contohCorak(ps[1], x + sw + 52, yy, sw, { garis: BH.jawab, tebal: 2 }));
        var t = paragrafB(NC(ps[0]) + ' menjadi ' + NC(ps[1]), x + 2 * sw + 62, yy + 14, lebarP - 2 * sw - 64, { ukuran: 10, isi: BH.teks });
        o.push(t.svg);
        yy += sw + 14;
      });
      o.push(teksB('Corak lain tidak berubah.', x, yy + 10, { ukuran: 10, isi: BH.teksRedup }));
      tinggi = Math.max(tinggi, yy + 10 + pad + 6);
      x += lebarP;
    }
    var W = lebarJudul(judul, x + pad);
    return { svg: S.doc(o.join(''), W, tinggi, { latar: '#ffffff' }), lebar: W, tinggi: tinggi };
  }

  // ------------------------------------------------- rakit butir pola corak

  function uraiAturanPola(rc) {
    var arah = rc.ar === 'baris' ? 'dari kiri ke kanan' : 'dari atas ke bawah';
    if (rc.mek === 'putar') {
      return 'Aturan corak: pada setiap ' + rc.ar + ', susunan corak berputar satu bagian ' + JAM[rc.k] + ' dari kotak ke kotak (' + arah + ').' +
        (rc.ikut ? ' Setiap bagian ikut berputar 90°, sehingga arah garis arsirnya berubah: garis mendatar menjadi tegak, garis tegak menjadi mendatar, garis miring naik ke kanan menjadi miring turun ke kanan, dan sebaliknya; corak lain tetap.' : '');
    }
    if (rc.mek === 'jalan') return 'Aturan corak: pada setiap ' + rc.ar + ', keempat bagian memakai corak dasar yang sama, tetapi satu bagian diganti hitam penuh, dan bagian hitam itu berpindah satu bagian ' + JAM[rc.k] + ' dari kotak ke kotak (' + arah + ').';
    return 'Aturan corak: setiap bagian diperhatikan sendiri-sendiri. Pada setiap baris dan setiap kolom, corak suatu bagian pada ketiga kotak selalu berbeda, dan ketiga corak itu sama di semua baris.';
  }

  function buatPola(id, level, benih, opsi) {
    var a = Rng.alat(benih);
    var target = opsi.target == null ? a.bulat(0, 4) : opsi.target;
    for (var coba = 0; coba < 60; coba++) {
      var rc = rencanaPola(a, level, opsi.polaDipakai);
      var bagi = a.pilih(['+', 'x']);
      var bc = bangunCorakPola(a, rc);
      if (!bc) continue;
      var bInfo = { jenis: mutlak(rc.bentuk, rc.ar), ar: rc.ar }, Bg = gridPola(a, bInfo.jenis, BENTUK_P);
      var grid = [[], [], []], semuaSel = {};
      for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) { grid[r][c] = selP(Bg[r][c], bagi, bc.C[r][c]); semuaSel[sj(grid[r][c])] = 1; }
      if (Object.keys(semuaSel).length < 9) continue;
      var tanya = tanyaPola(a, level), tr = tanya[0], tc = tanya[1], kunci = grid[tr][tc];
      var tampak = grid.map(function (b, r2) { return b.map(function (x, c2) { return r2 === tr && c2 === tc ? null : x; }); });
      var ramal = ramalPola(tampak, tr, tc);
      if (!ramal || sj(ramal) !== sj(kunci) || cacatPola(tampak, tr, tc)) continue;
      var ar = rc.ar, ql = ar === 'baris' ? tr : tc, m = ar === 'baris' ? tc : tr, P = POS_NAMA[ar];
      var info = { himpunan: bc.himpunan };
      if (rc.mek === 'jalan') info.dasarQ = bc.dasar[ql];
      var peng = pengecohPola(a, level, tampak, tr, tc, kunci, rc, info);
      if (!peng) continue;

      var NBG = BAGIAN[bagi], lc = ql === 0 ? 1 : 0, contoh = garis(grid, ar, lc), gq = garis(tampak, ar, ql);
      var pem = [];
      pem.push('Setiap kotak berisi sebuah bangun yang dibagi oleh ' + (bagi === '+' ? 'garis tegak dan garis mendatar' : 'dua garis miring') + ' menjadi empat bagian (' + NBG.join(', ') + '), dan setiap bagian bercorak. Kotak yang dicari berada pada ' + namaLetak(tr, tc) + '.');
      pem.push(uraiAturanPola(rc));
      var gambarN = 1, sebut = [];
      if (rc.mek === 'putar') {
        var p0 = pilihJejak(contoh[0].corak), t0 = contoh[0].corak[p0];
        pem.push('Contoh pada ' + ar + ' ' + (lc + 1) + ': corak ' + NC(t0) + ' berada di bagian ' + NBG[p0] + ' pada kotak ' + P[0] + ', di bagian ' + NBG[mod(p0 + rc.k, 4)] + ' pada kotak ' + P[1] + ', dan di bagian ' + NBG[mod(p0 + 2 * rc.k, 4)] + ' pada kotak ' + P[2] +
          '. Gambar 1 menandai perpindahan corak itu dengan garis jingga' + (rc.ikut ? ' dan bagian berarsir dengan garis biru' : '') + '.');
        var src;
        if (m > 0) { src = gq[m - 1]; pem.push('Pada ' + ar + ' ' + (ql + 1) + ', kotak sebelum kotak yang dicari (kotak ' + P[m - 1] + ') bersusun: ' + uraiSusun(src.corak, bagi) + '. Setelah diputar satu bagian ' + JAM[rc.k] + (rc.ikut ? ' (arah arsir ikut berputar)' : '') + ', susunannya menjadi: ' + uraiSusun(kunci.corak, bagi) + '. Gambar 2 memperlihatkan penerapan itu; kotak jawaban berlatar hijau.'); }
        else { src = gq[1]; pem.push('Kotak yang dicari berada di awal ' + ar + ' ' + (ql + 1) + ', jadi susunan kotak ' + P[1] + ' (' + uraiSusun(src.corak, bagi) + ') diputar mundur satu bagian, yaitu ' + JAM[4 - rc.k] + (rc.ikut ? ' (arah arsir ikut berputar)' : '') + ', sehingga hasilnya: ' + uraiSusun(kunci.corak, bagi) + '. Gambar 2 memperlihatkan penerapan itu; kotak jawaban berlatar hijau.'); }
        sebut = [
          { id: 'bahas-1', jenis: 'mcorak-pola-garis', judul: 'Gambar 1. Contoh putaran corak pada ' + ar + ' ' + (lc + 1), model: { sel: contoh, ar: ar, mek: 'putar', k: rc.k, ikut: rc.ikut, label: labelGaris(ar), jawab: -1 } },
          { id: 'bahas-2', jenis: 'mcorak-pola-garis', judul: 'Gambar 2. Putaran yang sama pada ' + ar + ' ' + (ql + 1), model: { sel: gq, ar: ar, mek: 'putar', k: rc.k, ikut: rc.ikut, label: labelGaris(ar), jawab: m, jawaban: kunci } }
        ];
        gambarN = 3;
      } else if (rc.mek === 'jalan') {
        var hs = contoh.map(function (x) { return hitamDi(x.corak); }), dasarC = bc.dasar[lc], dasarQ = bc.dasar[ql];
        pem.push('Contoh pada ' + ar + ' ' + (lc + 1) + ': bagian hitam berada di bagian ' + NBG[hs[0]] + ' pada kotak ' + P[0] + ', di bagian ' + NBG[hs[1]] + ' pada kotak ' + P[1] + ', dan di bagian ' + NBG[hs[2]] + ' pada kotak ' + P[2] +
          ', sedangkan bagian lain tetap mengikuti corak dasar ' + ar + ' itu (' + uraiSusun(dasarC, bagi) + '). Gambar 1 menandai bagian hitam dengan garis jingga.');
        var hq = [], kalH = [];
        gq.forEach(function (x, i) { if (x) { hq.push(i); kalH.push('bagian ' + NBG[hitamDi(x.corak)] + ' pada kotak ' + P[i]); } });
        pem.push('Pada ' + ar + ' ' + (ql + 1) + ', corak dasarnya (terlihat pada kotak-kotak lain di ' + ar + ' itu) adalah ' + uraiSusun(dasarQ, bagi) + '. Bagian hitamnya berada di ' + kalH.join(' dan ') + ', jadi pada kotak yang dicari bagian hitam berada di bagian ' + NBG[hitamDi(kunci.corak)] +
          ' dan bagian lain mengikuti corak dasar. Gambar 2 memperlihatkan penerapan itu; kotak jawaban berlatar hijau.');
        sebut = [
          { id: 'bahas-1', jenis: 'mcorak-pola-garis', judul: 'Gambar 1. Contoh bagian hitam berjalan pada ' + ar + ' ' + (lc + 1), model: { sel: contoh, ar: ar, mek: 'jalan', k: rc.k, ikut: false, label: labelGaris(ar), jawab: -1 } },
          { id: 'bahas-2', jenis: 'mcorak-pola-garis', judul: 'Gambar 2. Aturan yang sama pada ' + ar + ' ' + (ql + 1), model: { sel: gq, ar: ar, mek: 'jalan', k: rc.k, ikut: false, label: labelGaris(ar), jawab: m, jawaban: kunci } }
        ];
        gambarN = 3;
      } else {
        var perBagian = NBG.map(function (nm, p) {
          var ada = tampak[tr].filter(function (x, c2) { return c2 !== tc; }).map(function (x) { return NC(x.corak[p]); });
          return 'bagian ' + nm + ' pada dua kotak lainnya sudah ' + ada.join(' dan ') + ', jadi pada kotak yang dicari ' + NC(kunci.corak[p]);
        });
        pem.push('Contoh bagian ' + NBG[0] + ': ketiga coraknya ' + unik([0, 1, 2].map(function (c2) { return NC((tampak[lc][c2] || kunci).corak[0]); })).join(', ') + ' pada baris ' + (lc + 1) + ', dan ketiga corak yang sama muncul di setiap baris dengan urutan berbeda. Gambar 1 memperlihatkan corak setiap bagian di kesembilan kotak dalam empat matriks kecil; kotak jawaban bergaris hijau.');
        pem.push('Pada baris ' + (tr + 1) + ': ' + perBagian.join('; ') + '. Gambar 2 memperlihatkan baris itu dengan kotak jawaban berlatar hijau.');
        sebut = [
          { id: 'bahas-1', jenis: 'mcorak-pola-latin', judul: 'Gambar 1. Corak tiap bagian di kesembilan kotak', model: { grid: tampak, tanya: [tr, tc], jawaban: kunci } },
          { id: 'bahas-2', jenis: 'mcorak-pola-baris', judul: 'Gambar 2. Baris ' + (tr + 1) + ' dengan kotak jawaban', model: { sel: tampak[tr], label: labelGaris('baris'), jawab: tc, jawaban: kunci } }
        ];
        gambarN = 3;
      }
      var Kp = kanalP(tampak), adaBentuk = bInfo.jenis !== 'sama', pasangan = [];
      if (rc.ikut) {
        var sumber = m > 0 ? gq[m - 1].corak : kunci.corak;
        unik(sumber.filter(function (v) { return /^arsir-/.test(v); })).forEach(function (v) { pasangan.push([v, Corak.putarKode(v, 90)]); });
      }
      var kal = uraiPolaKanal(bInfo, Kp.bentuk, tr, tc, kunci.bentuk, NB, { semua: 'Semua bangun berbentuk', subjek: 'Bentuk bangun', jamak: 'bentuk', hasil: 'bentuk kotak yang dicari adalah' });
      if (adaBentuk || rc.ikut) {
        pem.push(kal + ' Gambar ' + gambarN + ' memperlihatkan ' + (adaBentuk ? 'bentuk setiap kotak (garis penentu diarsir biru)' : '') + (adaBentuk && rc.ikut ? ' dan ' : '') + (rc.ikut ? 'perubahan arah arsir ketika bagiannya diputar 90°' : '') + '.');
        sebut.push({ id: 'bahas-' + gambarN, jenis: 'mcorak-pola-kanal', judul: 'Gambar ' + gambarN + '. ' + (adaBentuk && rc.ikut ? 'Bentuk bangun dan arah arsir' : (adaBentuk ? 'Bentuk bangun tiap kotak' : 'Arah arsir setelah diputar')),
          model: { grid: tampak, tanya: [tr, tc], bentuk: bInfo, ikut: !!rc.ikut, pasangan: pasangan, jawaban: kunci } });
      } else pem.push(kal);
      pem.push('Jadi kotak pengganti tanda tanya berisi ' + NB(kunci.bentuk) + ' dengan bagian ' + uraiSusun(kunci.corak, bagi).split(', ').join(', bagian ') + '.');

      var daftar = a.kocok(peng.map(function (p) { return { sel: p.sel, alasan: p.alasan, kunci: false }; }));
      daftar.splice(target, 0, { sel: kunci, alasan: null, kunci: true });
      var opsiGambar = daftar.map(function (d, k) {
        return { teks: 'Gambar opsi ' + Fmt.huruf(k), nilai: k, alasan: d.alasan ? Fmt.kapital(d.alasan) + '.' : null, kunci: d.kunci,
          gambar: { id: 'opsi-' + Fmt.huruf(k).toLowerCase(), jenis: 'mcorak-pola-opsi', model: { fig: d.sel }, judul: 'Opsi ' + Fmt.huruf(k) } };
      });
      var utuhStr = grid.map(function (b) { return b.map(function (x) { return [x.bentuk, x.bagi, x.corak.join('+')].join('.'); }).join('/'); }).join('//');
      var ctx = { subtes: 'ku', submateri: 'figural', keluarga: id, level: level, benih: benih, a: a };
      var butir = Butir.rakitPg(ctx, {
        jenisSoal: 'Figural Matriks - Kotak 3x3 (pola corak empat bagian)',
        judul: 'Figural Matriks - Kotak 3x3', teks: [], pertanyaan: '', perintah: PERINTAH,
        gambar: [{ id: 'soal', jenis: 'mcorak-pola', model: { grid: tampak, tanya: [tr, tc] }, judul: 'Matriks 3x3 pola corak' }],
        pilihanJadi: { opsi: opsiGambar, kunciIndex: target }, tulisKunci: false,
        langkah: [], pembahasan: pem,
        model: { topik: 'Figural', tipe: 'matriks-corak-pola', grid: tampak, tanya: [tr, tc], pilihan: daftar.map(function (d) { return d.sel; }), kunciIndex: target },
        sidik: { inti: 'matriks-corak-pola|' + utuhStr + '|' + tr + tc, param: [], entitas: rc.pola }
      });
      if (!butir) continue;
      butir.gambarPembahasan = sebut;
      butir.pola = rc.pola;
      butir.kategoriRiset = 'pengayaan';
      butir.catatanRiset = CATATAN;
      return butir;
    }
    return null;
  }

  /** Satu baris matriks pola (latin): tiga kotak, kotak jawaban hijau. */
  function svgBarisPola(m, judul) {
    var u = 104, g = 24, pad = 12, y0 = pad + 26 + 20, o = [];
    var W = lebarJudul(judul, pad * 2 + 3 * u + 2 * g), H = y0 + u + pad + 4;
    o.push(teksB(judul, pad, pad + 13, { ukuran: 13, tebal: true }));
    for (var i = 0; i < 3; i++) {
      var x = pad + i * (u + g), jawab = i === m.jawab, sel = m.sel[i] || m.jawaban;
      o.push(bingkai(x, y0, u, jawab ? { latar: BH.latarJawab, tepi: BH.jawab, tebal: 3 } : {}));
      o.push(gambarPola(sel, x + u / 2, y0 + u / 2, JARI * u));
      o.push(teksB(m.label[i], x + u / 2, y0 - 7, { ukuran: 11, tebal: true, isi: jawab ? BH.jawab : BH.teks, rata: 'middle' }));
    }
    return { svg: S.doc(o.join(''), W, H, { latar: '#ffffff' }), lebar: W, tinggi: H };
  }

  // =================================================================== antarmuka

  function buat(id, level, benih, opsi) {
    opsi = opsi || {};
    if (id === 'matriks-belahan') return buatBelahan(id, level, benih, opsi);
    if (id === 'matriks-corak-pola') return buatPola(id, level, benih, opsi);
    return null;
  }

  var KELUARGA = [
    { id: 'matriks-belahan', nama: 'Matriks 3x3 belahan bercorak (gabung, geser, tukar belahan; bentuk dan garis belah berpola)', submateri: 'figural', kolam: 'matriks' },
    { id: 'matriks-corak-pola', nama: 'Matriks 3x3 pola corak empat bagian (putar, hitam berjalan, latin per bagian)', submateri: 'figural', kolam: 'matriks' }
  ];

  var GAMBAR = {
    'mcorak-belahan': function (m) { return svgMatriks(m.grid, m.tanya, gambarBelahan); },
    'mcorak-belahan-opsi': function (m) { return svgOpsi(m.fig, gambarBelahan); },
    'mcorak-belahan-garis': svgGarisBelahan,
    'mcorak-belahan-kanal': svgKanalBelahan,
    'mcorak-pola': function (m) { return svgMatriks(m.grid, m.tanya, gambarPola); },
    'mcorak-pola-opsi': function (m) { return svgOpsi(m.fig, gambarPola); },
    'mcorak-pola-garis': svgGarisPola,
    'mcorak-pola-latin': svgLatinPola,
    'mcorak-pola-baris': svgBarisPola,
    'mcorak-pola-kanal': svgKanalPola
  };

  return { KELUARGA: KELUARGA, PERINTAH: PERINTAH, buat: buat, GAMBAR: GAMBAR };
});
