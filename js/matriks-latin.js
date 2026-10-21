/*
 * matriks-latin.js — Kemampuan Umum > Figural > Matriks kotak 5x5 (contoh riset BAB V, soal 2).
 *
 * Lima bentuk garis (hati, lingkaran, persegi, segitiga, bintang) tersusun dalam matriks
 * 5x5 sehingga setiap baris dan setiap kolom memuat kelimanya tepat satu kali (persegi
 * latin). Sebagian kotak ditutup satu tanda tanya, dan pilihan A-E berupa POTONGAN beberapa
 * kotak yang menggantikannya, dengan urutan letak yang harus tepat (seperti contoh riset):
 *
 *   mudah   dua kotak bersebelahan, tegak atau mendatar (seperti contoh riset); tiap kotak
 *           dapat ditentukan dari satu baris atau satu kolom
 *   sedang  tiga kotak: lurus (tegak/mendatar) atau berbentuk siku (L, tiga kotak dari blok
 *           2x2); pada siku, satu kotak baru dapat ditentukan setelah kotak lain diisi
 *   sulit   blok 2x2: dua baris dan dua kolomnya sama-sama kekurangan dua bentuk, jadi setiap
 *           kotak harus dicari dari irisan baris dan kolomnya
 *
 * Daerah lubang disimpan sebagai kotak pembatas { r, c, h, w } dan, untuk siku, daftar kotak
 * yang termasuk lubang (`sel`, relatif terhadap pojok kiri atas kotak pembatas). Potongan
 * pilihan sebentuk dengan kotak pembatas; kotak yang bukan lubang bernilai null dan tidak
 * digambar.
 *
 * Persegi latin dibangkitkan dengan runut-balik berbenih. Blok 2x2 yang isinya bisa
 * ditukar silang (a b / b a) ditolak karena jawabannya tidak tunggal. Pengecoh dibuat
 * dengan menukar urutan kotak jawaban atau mengganti bentuknya dengan bentuk yang sudah
 * ada di baris/kolom yang sama; alasan tiap pengecoh ditulis dari pelanggaran yang
 * benar-benar terjadi.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./rng.js'), require('./svg.js'), require('./bentuk.js'), require('./butir.js'), require('./format.js'), require('./metrik.js'));
    module.exports = api;
  } else {
    api = factory(root.Rng, root.Svg, root.Bentuk, root.Butir, root.Fmt, root.Metrik);
    root.MatriksLatin = api;
  }
})(typeof self !== 'undefined' ? self : this, function (Rng, S, Bentuk, Butir, Fmt, Metrik) {
  'use strict';

  var PERINTAH = 'Gunakan gambar di bagian atas untuk menentukan jawaban yang benar dari pilihan di bawah. Pilih jawaban yang menggantikan tanda tanya. Jika tidak ada tanda tanya, pilih jawaban yang merupakan kelanjutan dari urutan tersebut.';
  var BENTUK = ['hati', 'lingkaran', 'persegi', 'segitiga', 'bintang'];
  var N = 5;
  var TINTA = '#1d1d1d', TEPI = '#4a5266';

  // --------------------------------------------------------------- menggambar

  function isiSel(v, x, y, s) {
    return Bentuk.svg(BENTUK[v], x + s / 2, y + s / 2, s * 0.3, { isi: '#ffffff', garis: TINTA, tebal: 2.2 });
  }

  /** Apakah kotak (r, c) termasuk daerah lubang l (kotak pembatas, dikurangi kotak di luar `sel`)? */
  function dalamLubang(l, r, c) {
    if (!(r >= l.r && r < l.r + l.h && c >= l.c && c < l.c + l.w)) return false;
    return !l.sel || l.sel.some(function (x) { return x[0] === r - l.r && x[1] === c - l.c; });
  }

  /** Garis tepi luar sekumpulan kotak (sisi kotak yang tidak bertetangga dengan kotak sekumpulan). */
  function tepiLuar(ada, baris, kolom, x0, y0, s, tebal) {
    var o = [];
    for (var r = 0; r < baris; r++) {
      for (var c = 0; c < kolom; c++) {
        if (!ada(r, c)) continue;
        var x = x0 + c * s, y = y0 + r * s, g = { garis: TEPI, tebal: tebal, ujung: 'square' };
        if (!ada(r - 1, c)) o.push(S.garis(x, y, x + s, y, g));
        if (!ada(r + 1, c)) o.push(S.garis(x, y + s, x + s, y + s, g));
        if (!ada(r, c - 1)) o.push(S.garis(x, y, x, y + s, g));
        if (!ada(r, c + 1)) o.push(S.garis(x + s, y, x + s, y + s, g));
      }
    }
    return o.join('');
  }

  /** Matriks dengan satu daerah "?" (kotak-kotak lubang digabung tanpa garis di antaranya). */
  function svgMatriks(grid, lubang, ukuran) {
    var s = ukuran || 58, pad = 6, n = grid.length, m = grid[0].length, bag = [], sx = 0, sy = 0, k = 0;
    for (var r = 0; r < n; r++) {
      for (var c = 0; c < m; c++) {
        var x = pad + c * s, y = pad + r * s;
        if (dalamLubang(lubang, r, c)) { bag.push(S.rect(x, y, s, s, { isi: '#f4f6fb' })); sx += x; sy += y; k++; continue; }
        bag.push(S.rect(x, y, s, s, { isi: '#ffffff', garis: TEPI, tebal: 1.4 }));
        bag.push(isiSel(grid[r][c], x, y, s));
      }
    }
    bag.push(tepiLuar(function (r, c) { return dalamLubang(lubang, r, c); }, n, m, pad, pad, s, 1.4));
    // "?" di tengah daerah persegi panjang; pada siku, di kotak sudutnya (titik tengah siku jatuh di tepi)
    var px = sx / k, py = sy / k;
    if (lubang.sel) {
      var sudut = lubang.sel.filter(function (a) { return lubang.sel.filter(function (b) { return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1; }).length === 2; })[0] || lubang.sel[0];
      px = pad + (lubang.c + sudut[1]) * s; py = pad + (lubang.r + sudut[0]) * s;
    }
    var uk = s * (k >= 4 ? 0.95 : 0.7);
    bag.push(S.teks('?', px + s / 2, py + s / 2 + uk * 0.36, { ukuran: uk, tebal: true, isi: '#4a5266', rata: 'middle' }));
    bag.push(S.rect(pad, pad, m * s, n * s, { isi: 'none', garis: TEPI, tebal: 2.4 }));
    var W = pad * 2 + m * s, H = pad * 2 + n * s;
    return { svg: S.doc(bag.join(''), W, H, { latar: '#ffffff' }), lebar: W, tinggi: H };
  }

  /** Potongan pilihan jawaban (sebentuk dengan lubang; null = bukan bagian potongan); lebar kanvas = sisi terpanjang. */
  function svgPotongan(isi, ukuran) {
    var s = ukuran || 58, pad = 5, h = isi.length, w = isi[0].length, lebar = Math.max(h, w) * s;
    var x0 = pad + (lebar - w * s) / 2, bag = [];
    var ada = function (r, c) { return r >= 0 && r < h && c >= 0 && c < w && isi[r][c] !== null; };
    for (var r = 0; r < h; r++) {
      for (var c = 0; c < w; c++) {
        if (!ada(r, c)) continue;
        var x = x0 + c * s, y = pad + r * s;
        bag.push(S.rect(x, y, s, s, { isi: '#ffffff', garis: TEPI, tebal: 1.4 }));
        bag.push(isiSel(isi[r][c], x, y, s));
      }
    }
    bag.push(tepiLuar(ada, h, w, x0, pad, s, 2.2));
    var W = lebar + pad * 2, H = h * s + pad * 2;
    return { svg: S.doc(bag.join(''), W, H, { latar: '#ffffff' }), lebar: W, tinggi: H };
  }

  // --------------------------------------------------------- gambar pembahasan

  /*
   * latin-tahap: satu panel per kotak lubang, menurut urutan pengisiannya. Pada tiap panel kotak yang
   * sedang diisi berbingkai jingga, kotak lubang yang sudah terisi berwarna jingga muda, dan baris
   * dan/atau kolom yang menentukan isinya diarsir biru (bila satu baris saja sudah cukup, hanya
   * baris itu yang diarsir). Nomor baris dan kolom ditulis di tepi.
   */
  var BH = S.BAHAS;

  function teksB(s, x, y, o) {
    o = o || {};
    return S.teks(s, x, y, { ukuran: o.ukuran || 10, tebal: o.tebal, isi: o.isi || BH.teks, rata: o.rata });
  }

  function svgTahap(m, judul) {
    var t = m.tahap, n = t.length, kol = n === 4 ? 2 : n, u = 26, pad = 8, kiri = 16, atas = 14, sela = 18;
    var panelW = kiri + 5 * u, panelH = atas + 5 * u + 44, y0 = pad + 26, nBaris = Math.ceil(n / kol);
    var W = Math.max(pad * 2 + kol * panelW + (kol - 1) * sela, Math.ceil(Metrik.lebar(judul, 13, true)) + 18), H = y0 + nBaris * panelH + (nBaris - 1) * 10 + pad;
    var o = [S.teks(judul, pad, pad + 13, { ukuran: 13, tebal: true, isi: BH.teks })];
    t.forEach(function (st, i) {
      var px = pad + (i % kol) * (panelW + sela), py = y0 + Math.floor(i / kol) * (panelH + 10), mx = px + kiri, my = py + atas;
      if (st.baris) o.push(S.rect(mx - 2, my + st.r * u - 2, 5 * u + 4, u + 4, { rx: 3, isi: BH.latarPanah }));
      if (st.kolom) o.push(S.rect(mx + st.c * u - 2, my - 2, u + 4, 5 * u + 4, { rx: 3, isi: BH.latarPanah }));
      for (var k = 0; k < 5; k++) {
        o.push(teksB(String(k + 1), mx + k * u + u / 2, py + 9, { ukuran: 9, rata: 'middle', tebal: k === st.c, isi: k === st.c && st.kolom ? BH.panah : BH.teksRedup }));
        o.push(teksB(String(k + 1), px + 6, my + k * u + u / 2 + 3, { ukuran: 9, rata: 'middle', tebal: k === st.r, isi: k === st.r && st.baris ? BH.panah : BH.teksRedup }));
      }
      for (var r = 0; r < 5; r++) {
        for (var c = 0; c < 5; c++) {
          var x = mx + c * u, y = my + r * u;
          if (!dalamLubang(m.lubang, r, c)) {
            o.push(S.rect(x, y, u, u, { isi: 'none', garis: '#c4cad6', tebal: 0.8 }));
            o.push(Bentuk.svg(BENTUK[m.grid[r][c]], x + u / 2, y + u / 2, u * 0.3, { isi: '#ffffff', garis: TINTA, tebal: 1.2 }));
            continue;
          }
          var kini = r === st.r && c === st.c, lalu = t.slice(0, i).filter(function (q) { return q.r === r && q.c === c; })[0];
          if (kini || lalu) {
            o.push(S.rect(x + 0.5, y + 0.5, u - 1, u - 1, { isi: BH.latarSorot, garis: kini ? BH.sorot : '#e7b98e', tebal: kini ? 2.2 : 1 }));
            o.push(Bentuk.svg(BENTUK[kini ? st.v : lalu.v], x + u / 2, y + u / 2, u * 0.3, { isi: '#ffffff', garis: BH.sorot, tebal: kini ? 1.8 : 1.2 }));
          } else {
            o.push(S.rect(x + 0.5, y + 0.5, u - 1, u - 1, { isi: '#eef1f6', garis: '#c4cad6', tebal: 0.8 }));
            o.push(teksB('?', x + u / 2, y + u / 2 + 4, { ukuran: 11, tebal: true, rata: 'middle', isi: '#9aa3b5' }));
          }
        }
      }
      o.push(S.rect(mx, my, 5 * u, 5 * u, { isi: 'none', garis: TEPI, tebal: 1.4 }));
      var yt = my + 5 * u + 13, penentu = st.baris && st.kolom ? 'irisan baris ' + (st.r + 1) + ' dan kolom ' + (st.c + 1) : (st.baris ? 'cukup dari baris ' + (st.r + 1) : 'cukup dari kolom ' + (st.c + 1));
      o.push(teksB((i + 1) + '. Baris ' + (st.r + 1) + ', kolom ' + (st.c + 1) + ': ' + BENTUK[st.v], px, yt, { tebal: true, isi: BH.sorot }));
      o.push(teksB(penentu, px, yt + 13, { isi: BH.panah }));
    });
    return { svg: S.doc(o.join(''), W, H, { latar: '#ffffff' }), lebar: W, tinggi: H };
  }

  // --------------------------------------------------------------- pembangunan

  /** Persegi latin 5x5 acak (runut-balik dengan urutan coba yang diacak). */
  function persegiLatin(a) {
    var g = [], i;
    for (i = 0; i < N; i++) g.push([-1, -1, -1, -1, -1]);
    function boleh(r, c, v) {
      for (var k = 0; k < N; k++) if (g[r][k] === v || g[k][c] === v) return false;
      return true;
    }
    function isi(pos) {
      if (pos === N * N) return true;
      var r = Math.floor(pos / N), c = pos % N, urut = a.kocok([0, 1, 2, 3, 4]);
      for (var k = 0; k < urut.length; k++) {
        if (!boleh(r, c, urut[k])) continue;
        g[r][c] = urut[k];
        if (isi(pos + 1)) return true;
        g[r][c] = -1;
      }
      return false;
    }
    return isi(0) ? g : null;
  }

  /** Bentuk daerah "?" per tingkat; nama bentuk juga menjadi `pola` butir. */
  var BENTUK_LUBANG = { mudah: ['dua-kotak'], sedang: ['tiga-lurus', 'siku', 'siku'], sulit: ['blok-2x2'] };

  function pilihBentukLubang(a, level, dipakai) {
    var semua = BENTUK_LUBANG[level] || BENTUK_LUBANG.sedang;
    var baru = semua.filter(function (b) { return (dipakai || []).indexOf('matriks-latin:' + b) < 0; });
    return a.pilih(baru.length ? baru : semua);
  }

  function pilihLubang(a, bentuk, g) {
    for (var coba = 0; coba < 60; coba++) {
      var l;
      if (bentuk === 'dua-kotak') l = a.untung(0.6) ? { r: a.bulat(0, 3), c: a.bulat(0, 4), h: 2, w: 1 } : { r: a.bulat(0, 4), c: a.bulat(0, 3), h: 1, w: 2 };
      else if (bentuk === 'tiga-lurus') l = a.untung(0.5) ? { r: a.bulat(0, 2), c: a.bulat(0, 4), h: 3, w: 1 } : { r: a.bulat(0, 4), c: a.bulat(0, 2), h: 1, w: 3 };
      else if (bentuk === 'siku') {
        // tiga kotak dari blok 2x2: satu pojok blok dibiarkan tampak
        var buang = a.bulat(0, 3), sel = [[0, 0], [0, 1], [1, 1], [1, 0]].filter(function (_, i) { return i !== buang; });
        l = { r: a.bulat(0, 3), c: a.bulat(0, 3), h: 2, w: 2, sel: sel.sort(function (x, y) { return x[0] - y[0] || x[1] - y[1]; }) };
      } else l = { r: a.bulat(0, 3), c: a.bulat(0, 3), h: 2, w: 2 };
      // blok "a b / b a" dapat ditukar silang tanpa melanggar aturan: jawabannya dua
      if (!l.sel && l.h === 2 && l.w === 2 && g[l.r][l.c] === g[l.r + 1][l.c + 1] && g[l.r][l.c + 1] === g[l.r + 1][l.c]) continue;
      return l;
    }
    return null;
  }

  /** Isi lubang sebentuk kotak pembatas; kotak yang bukan lubang bernilai null. */
  function potong(g, l) {
    var o = [];
    for (var r = 0; r < l.h; r++) { var row = []; for (var c = 0; c < l.w; c++) row.push(dalamLubang(l, l.r + r, l.c + c) ? g[l.r + r][l.c + c] : null); o.push(row); }
    return o;
  }

  /** Kotak-kotak lubang (urut baris) sebagai [i, j] relatif terhadap kotak pembatas. */
  function selLubang(l) {
    var o = [];
    for (var i = 0; i < l.h; i++) for (var j = 0; j < l.w; j++) if (dalamLubang(l, l.r + i, l.c + j)) o.push([i, j]);
    return o;
  }

  function sidikPotongan(p) { return p.map(function (row) { return row.join(''); }).join('/'); }

  function namaDaftar(vs) {
    var n = vs.map(function (v) { return BENTUK[v]; });
    if (n.length <= 1) return n.join('');
    return n.slice(0, -1).join(', ') + ' dan ' + n[n.length - 1];
  }

  /** Bentuk yang belum ada di baris r / kolom c (hanya dari kotak yang tampak). */
  function kurangBaris(g, l, r) {
    var ada = [];
    for (var c = 0; c < N; c++) if (!dalamLubang(l, r, c)) ada.push(g[r][c]);
    return [0, 1, 2, 3, 4].filter(function (v) { return ada.indexOf(v) < 0; });
  }
  function kurangKolom(g, l, c) {
    var ada = [];
    for (var r = 0; r < N; r++) if (!dalamLubang(l, r, c)) ada.push(g[r][c]);
    return [0, 1, 2, 3, 4].filter(function (v) { return ada.indexOf(v) < 0; });
  }

  /**
   * Pelanggaran aturan yang terjadi bila potongan `p` dipasang pada lubang: bentuk yang
   * sudah ada di baris/kolom yang sama (di luar lubang), atau dua kotak potongan yang
   * sebaris/sekolom berisi bentuk yang sama.
   */
  function pelanggaran(g, l, p) {
    var out = [], sel = selLubang(l);
    sel.forEach(function (ij, n) {
      var i = ij[0], j = ij[1], v = p[i][j], r = l.r + i, c = l.c + j, k;
      for (k = 0; k < N; k++) {
        if (!dalamLubang(l, r, k) && g[r][k] === v) { out.push('baris ' + (r + 1) + ' sudah memuat ' + BENTUK[v] + ' (kolom ' + (k + 1) + ')'); break; }
      }
      for (k = 0; k < N; k++) {
        if (!dalamLubang(l, k, c) && g[k][c] === v) { out.push('kolom ' + (c + 1) + ' sudah memuat ' + BENTUK[v] + ' (baris ' + (k + 1) + ')'); break; }
      }
      // dua kotak potongan yang sebaris atau sekolom tidak boleh berisi bentuk yang sama
      sel.slice(0, n).forEach(function (ij2) {
        if (p[ij2[0]][ij2[1]] !== v) return;
        if (ij2[0] === i) out.push('dua kotak di baris ' + (r + 1) + ' sama-sama berisi ' + BENTUK[v]);
        if (ij2[1] === j) out.push('dua kotak di kolom ' + (c + 1) + ' sama-sama berisi ' + BENTUK[v]);
      });
    });
    return out.filter(function (x, i) { return out.indexOf(x) === i; });
  }

  /** Empat pengecoh yang semuanya melanggar aturan, berbeda satu sama lain dan dari kunci. */
  function buatPengecoh(a, g, l, kunci) {
    var calon = [], h = l.h, w = l.w, sel = selLubang(l);
    function tambah(p, sebab) { calon.push({ isi: p, sebab: sebab }); }
    function salin(p) { return p.map(function (row) { return row.slice(); }); }
    var lain = function (kecuali) { return [0, 1, 2, 3, 4].filter(function (v) { return kecuali.indexOf(v) < 0; }); };
    if (sel.length === 3) {
      // tiga kotak (lurus atau siku): urutan diputar atau dua kotak ditukar, lalu satu bentuk diganti
      var nilai = sel.map(function (ij) { return kunci[ij[0]][ij[1]]; });
      var pasang = function (vs) { var p = salin(kunci); sel.forEach(function (ij, n) { p[ij[0]][ij[1]] = vs[n]; }); return p; };
      tambah(pasang([nilai[1], nilai[2], nilai[0]]), 'urutannya bergeser satu kotak');
      tambah(pasang([nilai[2], nilai[0], nilai[1]]), 'urutannya bergeser satu kotak');
      tambah(pasang([nilai[1], nilai[0], nilai[2]]), 'dua kotak pertama tertukar');
      tambah(pasang([nilai[0], nilai[2], nilai[1]]), 'dua kotak terakhir tertukar');
      tambah(pasang([nilai[2], nilai[1], nilai[0]]), 'urutannya terbalik');
      for (var t3 = 0; t3 < 10; t3++) {
        var p3 = salin(kunci), ij3 = a.pilih(sel);
        p3[ij3[0]][ij3[1]] = a.pilih(lain([kunci[ij3[0]][ij3[1]]]));
        tambah(p3, null);
      }
    } else if (h * w === 2) {
      var x = kunci[0][0], y = h === 2 ? kunci[1][0] : kunci[0][1];
      var pasang = function (p, q) { return h === 2 ? [[p], [q]] : [[p, q]]; };
      tambah(pasang(y, x), 'urutannya tertukar');
      a.kocok(lain([x, y])).forEach(function (v) {
        tambah(pasang(x, v), null);
        tambah(pasang(v, y), null);
        tambah(pasang(y, v), null);
        tambah(pasang(v, x), null);
      });
    } else {
      var k = kunci, p;
      tambah([[k[0][1], k[0][0]], [k[1][1], k[1][0]]], 'kedua kolomnya tertukar');
      tambah([[k[1][0], k[1][1]], [k[0][0], k[0][1]]], 'kedua barisnya tertukar');
      tambah([[k[0][0], k[1][0]], [k[0][1], k[1][1]]], 'baris dan kolomnya bertukar tempat');
      tambah([[k[1][1], k[1][0]], [k[0][1], k[0][0]]], 'potongannya terputar 180 derajat');
      for (var t = 0; t < 12; t++) {
        p = salin(k);
        var i = a.bulat(0, 1), j = a.bulat(0, 1);
        p[i][j] = a.pilih(lain([k[i][j]]));
        tambah(p, null);
      }
    }
    var hasil = [], lihat = {};
    lihat[sidikPotongan(kunci)] = 1;
    // pengecoh berpola (urutan tertukar, baris/kolom tertukar) didahulukan, sisanya acak
    var urut;
    if (h * w === 1) urut = a.kocok(calon);
    else if (sel.length === 3) {
      // dua urutan yang keliru dan dua bentuk yang keliru, supaya kunci tidak tertebak dari himpunan bentuknya saja
      var pola3 = a.kocok(calon.slice(0, 5)), ganti3 = a.kocok(calon.slice(5));
      urut = pola3.slice(0, 2).concat(ganti3.slice(0, 2), pola3.slice(2), ganti3.slice(2));
    } else if (h * w === 2) urut = [calon[0]].concat(a.kocok(calon.slice(1)));
    else urut = a.kocok(calon.slice(0, 4)).concat(a.kocok(calon.slice(4)));
    for (var q = 0; q < urut.length && hasil.length < 4; q++) {
      var c = urut[q], sd = sidikPotongan(c.isi);
      if (lihat[sd]) continue;
      var langgar = pelanggaran(g, l, c.isi);
      if (!langgar.length) continue;                       // (tak mungkin: jawaban latin tunggal)
      lihat[sd] = 1;
      hasil.push({ isi: c.isi, alasan: (c.sebab ? c.sebab + ': ' : '') + langgar.slice(0, 2).join('; ') });
    }
    return hasil.length === 4 ? hasil : null;
  }

  /**
   * Penalaran untuk pembahasan: isi dulu kotak lubang yang kemungkinannya tinggal satu
   * (bentuk yang belum ada di barisnya DAN di kolomnya), lalu ulangi.
   */
  function jejak(g, l) {
    var terisi = {}, baris = [], banyak = selLubang(l).length, tahap = [];
    for (var putaran = 0; putaran < 6 && Object.keys(terisi).length < banyak; putaran++) {
      for (var i = 0; i < l.h; i++) {
        for (var j = 0; j < l.w; j++) {
          var r = l.r + i, c = l.c + j, kunciSel = r + ',' + c;
          if (terisi[kunciSel] !== undefined || !dalamLubang(l, r, c)) continue;
          var kb = kurangBaris(g, l, r), kk = kurangKolom(g, l, c), sudah = [];
          Object.keys(terisi).forEach(function (s) {
            var rc = s.split(',').map(Number);
            if ((rc[0] === r || rc[1] === c) && sudah.indexOf(terisi[s]) < 0) sudah.push(terisi[s]);
          });
          var cocok = kb.filter(function (v) { return kk.indexOf(v) >= 0 && sudah.indexOf(v) < 0; });
          if (cocok.length !== 1) continue;
          terisi[kunciSel] = cocok[0];
          var kal = '• Baris ' + (r + 1) + ', kolom ' + (c + 1) + ': baris ' + (r + 1) + ' belum memuat ' + namaDaftar(kb) +
            (kb.length === 1 && kk.length === 1 ? ' dan kolom ' + (c + 1) + ' juga belum memuat ' + namaDaftar(kk) : ', kolom ' + (c + 1) + ' belum memuat ' + namaDaftar(kk));
          if (sudah.length && kb.filter(function (v) { return kk.indexOf(v) >= 0; }).length > 1) kal += ', sedangkan ' + namaDaftar(sudah.filter(function (v) { return kb.indexOf(v) >= 0 && kk.indexOf(v) >= 0; })) + ' sudah dipakai kotak lain pada lubang yang sebaris atau sekolom';
          kal += '; jadi kotak ini berisi ' + BENTUK[cocok[0]] + '.';
          baris.push(kal);
          // penentu untuk gambar pembahasan: baris saja, kolom saja, atau irisan keduanya
          var dipakaiDi = function (sb) { return Object.keys(terisi).filter(function (s) { var rc = s.split(',').map(Number); return s !== kunciSel && rc[sb] === (sb ? c : r); }).map(function (s) { return terisi[s]; }); };
          var sbB = dipakaiDi(0), sbK = dipakaiDi(1);
          var sisaB = kb.filter(function (v) { return sbB.indexOf(v) < 0; }), sisaK = kk.filter(function (v) { return sbK.indexOf(v) < 0; });
          // kolom/baris yang langsung tinggal satu kekurangan didahulukan (sama dengan kalimat pembahasannya)
          var hanyaK = kk.length === 1 || (kb.length !== 1 && sisaK.length === 1 && sisaB.length !== 1);
          var hanyaB = !hanyaK && (kb.length === 1 || sisaB.length === 1);
          tahap.push({ r: r, c: c, v: cocok[0], baris: !hanyaK, kolom: !hanyaB });
        }
      }
    }
    if (Object.keys(terisi).length !== banyak) return null;
    baris.tahap = tahap;
    return baris;
  }

  // --------------------------------------------------------------------- butir

  function buat(id, level, benih, opsi) {
    opsi = opsi || {};
    var a = Rng.alat(benih);
    var target = opsi.target == null ? a.bulat(0, 4) : opsi.target;
    var bentuk = pilihBentukLubang(a, level, opsi.polaDipakai);
    for (var coba = 0; coba < 20; coba++) {
      var g = persegiLatin(a);
      if (!g) continue;
      var l = pilihLubang(a, bentuk, g);
      if (!l) continue;
      var kunci = potong(g, l);
      var peng = buatPengecoh(a, g, l, kunci);
      if (!peng) continue;
      var langkah = jejak(g, l);
      if (!langkah) continue;

      var tampak = g.map(function (row, r) { return row.map(function (v, c) { return dalamLubang(l, r, c) ? null : v; }); });
      var daftar = a.kocok(peng.map(function (p) { return { isi: p.isi, alasan: p.alasan, kunci: false }; }));
      daftar.splice(target, 0, { isi: kunci, alasan: null, kunci: true });

      var sel = selLubang(l), nama = function (ij) { return BENTUK[kunci[ij[0]][ij[1]]]; };
      var letak = bentuk === 'dua-kotak' ? 'dua kotak ' + (l.h === 2 ? 'bertumpuk (dibaca dari atas ke bawah)' : 'berdampingan (dibaca dari kiri ke kanan)') :
        (bentuk === 'tiga-lurus' ? 'tiga kotak ' + (l.h === 3 ? 'bertumpuk (dibaca dari atas ke bawah)' : 'berdampingan (dibaca dari kiri ke kanan)') :
          (bentuk === 'siku' ? 'tiga kotak berbentuk siku (tiga dari empat kotak blok 2x2)' : 'blok 2x2'));
      var pem = ['Setiap baris dan setiap kolom memuat kelima bentuk (hati, lingkaran, persegi, segitiga, bintang) tepat satu kali; tidak ada bentuk yang berulang dalam satu baris atau satu kolom.',
        'Tanda tanya menutup ' + letak + ' mulai baris ' + (l.r + 1) + ', kolom ' + (l.c + 1) + '. Isi tiap kotaknya dengan bentuk yang belum ada di baris dan kolomnya. Gambar 1 mengisinya satu per satu: kotak yang sedang diisi berbingkai jingga, baris atau kolom yang menentukan isinya diarsir biru, dan kotak yang sudah terisi berwarna jingga muda.'];
      langkah.forEach(function (x) { pem.push(x); });
      var potongan;
      if (l.w === 1) potongan = 'dari atas ke bawah ' + sel.map(nama).join(', ');
      else if (l.h === 1) potongan = 'dari kiri ke kanan ' + sel.map(nama).join(', ');
      else potongan = [0, 1].map(function (i) {
        var isi = sel.filter(function (ij) { return ij[0] === i; });
        return 'baris ' + (i === 0 ? 'atas' : 'bawah') + ' ' + (isi.length === 2 ? isi.map(nama).join(', ') : nama(isi[0]) + ' (di ' + (isi[0][1] === 0 ? 'kiri' : 'kanan') + ')');
      }).join('; ');
      pem.push('Potongan yang tepat: ' + potongan + '.');

      var opsiGambar = daftar.map(function (d, i) {
        return { teks: 'Gambar opsi ' + Fmt.huruf(i), nilai: i, alasan: d.alasan, kunci: d.kunci,
          gambar: { id: 'opsi-' + Fmt.huruf(i).toLowerCase(), jenis: 'latin-opsi', model: { isi: d.isi }, judul: 'Opsi ' + Fmt.huruf(i) } };
      });
      var ctx = { subtes: 'ku', submateri: 'figural', keluarga: id, level: level, benih: benih, a: a };
      var butir = Butir.rakitPg(ctx, {
        jenisSoal: 'Figural Matriks - Kotak 5x5',
        judul: 'Figural Matriks - Kotak 5x5', teks: [], pertanyaan: '', perintah: PERINTAH,
        gambar: [{ id: 'soal', jenis: 'latin', model: { grid: tampak, lubang: l }, judul: 'Matriks 5x5' }],
        pilihanJadi: { opsi: opsiGambar, kunciIndex: target }, tulisKunci: false,
        langkah: [], pembahasan: pem,
        model: {
          topik: 'Figural', tipe: 'matriks-latin', grid: tampak, lubang: l,
          pilihan: daftar.map(function (d) { return d.isi; }), kunciIndex: target
        },
        sidik: { inti: 'matriks-latin|' + g.map(function (row) { return row.join(''); }).join('/') + '|' + l.r + l.c + l.h + l.w + (l.sel ? JSON.stringify(l.sel) : ''), param: [], entitas: 'latin' }
      });
      if (!butir) continue;
      butir.gambarPembahasan = [{ id: 'bahas-1', jenis: 'latin-tahap', judul: 'Gambar 1. Mengisi daerah tanda tanya langkah demi langkah', model: { grid: tampak, lubang: l, tahap: langkah.tahap, jawaban: kunci } }];
      butir.pola = 'matriks-latin:' + bentuk;
      butir.kategoriRiset = 'acuan';
      return butir;
    }
    return null;
  }

  var KELUARGA = [{ id: 'matriks-latin', nama: 'Matriks 5x5 (lima bentuk, berbeda tiap baris dan kolom)', submateri: 'figural' }];

  return { KELUARGA: KELUARGA, BENTUK: BENTUK, PERINTAH: PERINTAH, buat: buat, svgMatriks: svgMatriks, svgPotongan: svgPotongan, svgTahap: svgTahap };
});
