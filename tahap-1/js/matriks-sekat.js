/*
 * matriks-sekat.js — Kemampuan Umum > Figural > Matriks kotak 2x2 bersekat
 * (contoh riset BAB V, soal 4).
 *
 * Persegi besar dibagi menjadi empat kuadran, dan tiap kuadran disekat garis miring
 * (sisi belah ketupat yang menghubungkan titik tengah sisi persegi) menjadi segitiga
 * DALAM (dekat pusat) dan segitiga POJOK. Tiap segitiga berisi satu gambar yang dibelah
 * dua oleh garis miring; tiap belahan punya corak (hitam, putih, titik, garis datar,
 * garis tegak, garis miring, kotak-kotak, bintang, bulatan). Satu gambar pojok diganti "?".
 *
 * Aturan (dibaca dari contoh riset): setiap belahan gambar DALAM pindah ke gambar POJOK
 * kuadran tetangga yang dihadapinya. Gambar dalam kuadran kiri atas, misalnya, dibelah
 * menjadi belahan kanan atas (menghadap kuadran kanan atas) dan belahan kiri bawah
 * (menghadap kuadran kiri bawah); belahan kanan atas itu muncul lagi di pojok kuadran
 * kanan atas, di sisi yang menghadap balik ke kiri. Jadi gambar pojok tiap kuadran
 * tersusun dari satu belahan kiriman tetangga samping dan satu belahan kiriman tetangga
 * atas/bawah. Bentuk gambar pojok (persegi atau lingkaran) mengikuti pola 2x2: sama
 * semua (mudah), atau sama per baris, per kolom, atau bersilang (sedang dan sulit).
 *
 * Kedelapan belahan gambar dalam selalu bercorak berbeda, sehingga asal tiap belahan
 * gambar pojok terbaca tegas. Pengecoh: belahan yang menghadap ke tempat lain, belahan
 * tertukar letak, salinan gambar dalam kuadran sendiri, bentuk pojok salah, salinan pojok
 * seberang, atau hanya satu belahan yang benar.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./rng.js'), require('./svg.js'), require('./bentuk.js'), require('./butir.js'), require('./format.js'), require('./metrik.js'));
    module.exports = api;
  } else {
    api = factory(root.Rng, root.Svg, root.Bentuk, root.Butir, root.Fmt, root.Metrik);
    root.MatriksSekat = api;
  }
})(typeof self !== 'undefined' ? self : this, function (Rng, S, Bentuk, Butir, Fmt, Metrik) {
  'use strict';

  var PERINTAH = 'Gunakan gambar di bagian atas untuk menentukan jawaban yang benar dari pilihan di bawah. Pilih jawaban yang menggantikan tanda tanya. Jika tidak ada tanda tanya, pilih jawaban yang merupakan kelanjutan dari urutan tersebut.';
  var CORAK = ['hitam', 'putih', 'titik', 'garis datar', 'garis tegak', 'garis miring', 'kotak-kotak', 'bintang', 'bulatan'];
  var NAMA_CORAK = ['hitam penuh', 'putih polos', 'bertitik-titik', 'bergaris mendatar', 'bergaris tegak', 'bergaris miring', 'berkotak-kotak', 'putih berbintang', 'hitam berlubang bulat'];
  var POJOK = ['persegi', 'lingkaran'];
  var DALAM = ['kubah', 'perisai', 'lensa'];
  var KUADRAN = ['kiri atas', 'kanan atas', 'kanan bawah', 'kiri bawah'];
  // tetangga mendatar, tegak, dan seberang tiap kuadran (0 kiri atas, 1 kanan atas, 2 kanan bawah, 3 kiri bawah)
  var H = [1, 0, 3, 2], V = [3, 2, 1, 0], D = [2, 3, 0, 1];
  // nama belahan yang menghadap tetangga mendatar / tegak
  var SISI_H = ['kanan-atas', 'kiri-atas', 'kiri-bawah', 'kanan-bawah'];
  var SISI_V = ['kiri-bawah', 'kanan-bawah', 'kanan-atas', 'kiri-atas'];

  var L = 300, Q = 150, PAD = 6, R0 = Q * (2 - Math.SQRT2) / 2, SKALA = 31;
  var TINTA = '#1d1d1d', TEPI = '#4a5266';

  // --------------------------------------------------------------- geometri

  function pusatPojok(q) { return [[R0, R0], [L - R0, R0], [L - R0, L - R0], [R0, L - R0]][q]; }
  function pusatDalam(q) { return [[Q - R0, Q - R0], [Q + R0, Q - R0], [Q + R0, Q + R0], [Q - R0, Q + R0]][q]; }

  /** Poligon cembung sebuah bentuk gambar. */
  function poligon(bentuk, cx, cy, s) {
    var p = [], i, t;
    if (bentuk === 'persegi' || bentuk === 'lingkaran') return Bentuk.titik(bentuk, cx, cy, s, 72);
    if (bentuk === 'kubah') {
      p.push([cx - 0.75 * s, cy + 0.85 * s], [cx + 0.75 * s, cy + 0.85 * s]);
      for (i = 0; i <= 24; i++) { t = -Math.PI * i / 24; p.push([cx + 0.75 * s * Math.cos(t), cy - 0.1 * s + 0.75 * s * Math.sin(t)]); }
      return p;
    }
    if (bentuk === 'perisai') {
      p.push([cx - 0.78 * s, cy - 0.85 * s], [cx + 0.78 * s, cy - 0.85 * s], [cx + 0.78 * s, cy + 0.05 * s]);
      for (i = 1; i <= 16; i++) {                       // kurva kuadrat ke ujung bawah, lalu cerminnya
        t = i / 16;
        p.push([cx + ((1 - t) * (1 - t) * 0.78 + 2 * (1 - t) * t * 0.72) * s, cy + ((1 - t) * (1 - t) * 0.05 + 2 * (1 - t) * t * 0.62 + t * t * 0.92) * s]);
      }
      for (i = 15; i >= 0; i--) {
        t = i / 16;
        p.push([cx - ((1 - t) * (1 - t) * 0.78 + 2 * (1 - t) * t * 0.72) * s, cy + ((1 - t) * (1 - t) * 0.05 + 2 * (1 - t) * t * 0.62 + t * t * 0.92) * s]);
      }
      return p;
    }
    // lensa tegak
    for (i = 0; i <= 24; i++) { t = -1 + 2 * i / 24; p.push([cx + 0.64 * s * (1 - t * t), cy + 0.92 * s * t]); }
    for (i = 23; i >= 1; i--) { t = -1 + 2 * i / 24; p.push([cx - 0.64 * s * (1 - t * t), cy + 0.92 * s * t]); }
    return p;
  }

  /** Setengah bidang tiap belahan: nx*x + ny*y >= c. */
  function bidangBelahan(nama, cx, cy) {
    if (nama === 'kanan-atas') return [1, -1, cx - cy];
    if (nama === 'kiri-bawah') return [-1, 1, cy - cx];
    if (nama === 'kanan-bawah') return [1, 1, cx + cy];
    return [-1, -1, -(cx + cy)];                      // kiri-atas
  }

  // --------------------------------------------------------------- corak

  function garisArsir(sisi, cx, cy, arah, jarak) {
    var o = [], d = arah, n = [-d[1], d[0]], K = 14;
    for (var k = -K; k <= K; k++) {
      var p0 = [cx + n[0] * k * jarak, cy + n[1] * k * jarak], ruas = Bentuk.potongGaris(sisi, p0, d);
      if (!ruas || Math.hypot(ruas[1][0] - ruas[0][0], ruas[1][1] - ruas[0][1]) < 1.6) continue;
      o.push(S.garis(ruas[0][0], ruas[0][1], ruas[1][0], ruas[1][1], { garis: TINTA, tebal: 1.1 }));
    }
    return o.join('');
  }

  /** Satu belahan (poligon cembung) dengan coraknya. */
  function corakSvg(hp, corak, cx, cy) {
    var o = [], hitam = corak === 0 || corak === 8;
    o.push(S.poli(hp, { tutup: true, isi: hitam ? TINTA : '#ffffff' }));
    var sisi = Bentuk.sisiDalam(hp), r2 = Math.SQRT1_2;
    if (corak === 2) {
      for (var gx = -6; gx <= 6; gx++) {
        for (var gy = -6; gy <= 6; gy++) {
          var x = cx + gx * 6.2 + (gy % 2 ? 3.1 : 0), y = cy + gy * 5.4;
          if (Bentuk.jarakDalam(sisi, x, y) >= 2.6) o.push(S.lingkaran(x, y, 1.3, { isi: TINTA }));
        }
      }
    } else if (corak === 3) o.push(garisArsir(sisi, cx, cy, [1, 0], 4.4));
    else if (corak === 4) o.push(garisArsir(sisi, cx, cy, [0, 1], 4.4));
    else if (corak === 5) o.push(garisArsir(sisi, cx, cy, [r2, -r2], 4.4));
    else if (corak === 6) { o.push(garisArsir(sisi, cx, cy, [1, 0], 5.6)); o.push(garisArsir(sisi, cx, cy, [0, 1], 5.6)); }
    else if (corak === 7 || corak === 8) {
      var g = Bentuk.beratTitik(hp), ruang = Bentuk.jarakDalam(sisi, g[0], g[1]);
      if (corak === 7) {
        var j = Math.max(2.5, Math.min(5, ruang - 1.2));
        for (var a = 0; a < 3; a++) {
          var t = a * Math.PI / 3;
          o.push(S.garis(g[0] - j * Math.cos(t), g[1] - j * Math.sin(t), g[0] + j * Math.cos(t), g[1] + j * Math.sin(t), { garis: TINTA, tebal: 1.3, ujung: 'round' }));
        }
      } else o.push(S.lingkaran(g[0], g[1], Math.max(2.2, Math.min(4.2, ruang - 1.4)), { isi: '#ffffff' }));
    }
    return o.join('');
  }

  /** Gambar terbelah: kedua belahan bercorak, garis tepi, dan garis belahnya. */
  function figurSvg(fig, cx, cy, s) {
    var P = poligon(fig.bentuk, cx, cy, s), o = [];
    Object.keys(fig.belahan).forEach(function (nama) {
      var b = bidangBelahan(nama, cx, cy), hp = Bentuk.potongBidang(P, b[0], b[1], b[2]);
      if (hp.length >= 3) o.push(corakSvg(hp, fig.belahan[nama], cx, cy));
    });
    o.push(S.poli(P, { tutup: true, isi: 'none', garis: TINTA, tebal: 1.8, sambung: 'round' }));
    var miring = fig.belahan['kanan-atas'] !== undefined ? [Math.SQRT1_2, Math.SQRT1_2] : [Math.SQRT1_2, -Math.SQRT1_2];
    var ruas = Bentuk.potongGaris(Bentuk.sisiDalam(P), [cx, cy], miring);
    // dua belahan gelap (hitam, bulatan): garis belah putih supaya batasnya tetap terlihat
    var gelap = Object.keys(fig.belahan).every(function (k) { return fig.belahan[k] === 0 || fig.belahan[k] === 8; });
    if (ruas) o.push(S.garis(ruas[0][0], ruas[0][1], ruas[1][0], ruas[1][1], { garis: gelap ? '#ffffff' : TINTA, tebal: gelap ? 1.8 : 1.5 }));
    return o.join('');
  }

  function segitigaPojok(q) {
    return [[[0, 0], [Q, 0], [0, Q]], [[L, 0], [L, Q], [Q, 0]], [[L, L], [Q, L], [L, Q]], [[0, L], [0, Q], [Q, L]]][q];
  }

  function geser(pts, dx, dy) { return pts.map(function (p) { return [p[0] + dx, p[1] + dy]; }); }

  /** Persegi bersekat dengan satu pojok "?". */
  function svgSekat(pojok, dalam, tanya) {
    var o = ['<g transform="translate(' + PAD + ',' + PAD + ')">'];
    var t = segitigaPojok(tanya), pt = pusatPojok(tanya);
    o.push(S.poli(t, { tutup: true, isi: '#f4f6fb' }));
    for (var q = 0; q < 4; q++) {
      var cd = pusatDalam(q);
      o.push(figurSvg(dalam[q], cd[0], cd[1], SKALA));
      if (q === tanya) continue;
      var cp = pusatPojok(q);
      o.push(figurSvg(pojok[q], cp[0], cp[1], SKALA));
    }
    o.push(S.teks('?', pt[0], pt[1] + 13, { ukuran: 36, tebal: true, isi: '#4a5266', rata: 'middle' }));
    o.push(S.garis(Q, 0, Q, L, { garis: TEPI, tebal: 1.6 }));
    o.push(S.garis(0, Q, L, Q, { garis: TEPI, tebal: 1.6 }));
    o.push(S.poli([[Q, 0], [L, Q], [Q, L], [0, Q]], { tutup: true, isi: 'none', garis: TEPI, tebal: 1.6 }));
    o.push(S.rect(0, 0, L, L, { isi: 'none', garis: TEPI, tebal: 2.4 }));
    o.push('</g>');
    var W = L + PAD * 2;
    return { svg: S.doc(o.join(''), W, W, { latar: '#ffffff' }), lebar: W, tinggi: W };
  }

  /** Pilihan jawaban: segitiga pojok kuadran q beserta gambarnya. */
  function svgPojok(fig, q) {
    var dx = q === 1 || q === 2 ? -Q : 0, dy = q === 2 || q === 3 ? -Q : 0;
    var t = geser(segitigaPojok(q), dx + PAD, dy + PAD), p = pusatPojok(q);
    var o = [S.poli(t, { tutup: true, isi: '#ffffff', garis: TEPI, tebal: 1.6, sambung: 'round' }), figurSvg(fig, p[0] + dx + PAD, p[1] + dy + PAD, SKALA)];
    var W = Q + PAD * 2;
    return { svg: S.doc(o.join(''), W, W, { latar: '#ffffff' }), lebar: W, tinggi: W };
  }

  // --------------------------------------------------------- gambar pembahasan

  /*
   *   sekat-asal    gambar soal; kedua belahan asal (di gambar dalam kuadran tetangga) digaris tepi
   *                 jingga dan biru, dan panah berwarna sama menuju sisi pojok "?" tempat belahan itu
   *                 masuk (sisi itu diarsir warna yang sama di dalam garis bentuk pojoknya)
   *   sekat-gabung  kedua belahan sebelum digabung (masing-masing di sisinya, bentuk pojok putus-putus),
   *                 lalu gabungannya sebagai gambar jawaban
   */
  var BH = S.BAHAS, WARNA_ASAL = [BH.sorot, BH.panah];

  function teksB(s, x, y, o) {
    o = o || {};
    return S.teks(s, x, y, { ukuran: o.ukuran || 11, tebal: o.tebal, isi: o.isi || BH.teks, rata: o.rata });
  }

  /** Poligon satu belahan gambar (bentuk dipotong garis belahnya). */
  function poliBelahan(bentuk, nama, cx, cy) {
    var b = bidangBelahan(nama, cx, cy);
    return Bentuk.potongBidang(poligon(bentuk, cx, cy, SKALA), b[0], b[1], b[2]);
  }

  /** Satu belahan bercorak; garis bentuk utuhnya putus-putus abu-abu. */
  function belahanSvg(bentuk, nama, corak, cx, cy) {
    var hp = poliBelahan(bentuk, nama, cx, cy);
    return S.poli(poligon(bentuk, cx, cy, SKALA), { tutup: true, isi: 'none', garis: '#aab2c2', tebal: 1.2, putus: '4 3' }) + corakSvg(hp, corak, cx, cy) +
      S.poli(hp, { tutup: true, isi: 'none', garis: TINTA, tebal: 1.8, sambung: 'round' });
  }

  /** Asal kedua belahan pojok kuadran q: [{ dari, nama asal, nama tujuan }] (mendatar lalu tegak). */
  function asalBelahan(q) {
    return [{ dari: H[q], asal: SISI_H[H[q]], tujuan: SISI_H[q] }, { dari: V[q], asal: SISI_V[V[q]], tujuan: SISI_V[q] }];
  }

  function svgAsal(m, judul) {
    var q = m.tanya, o = ['<g transform="translate(' + PAD + ',' + (PAD + 26) + ')">'];
    var t = segitigaPojok(q), pt = pusatPojok(q), asal = asalBelahan(q);
    o.push(S.poli(t, { tutup: true, isi: BH.latarJawab }));
    for (var k = 0; k < 4; k++) {
      var cd = pusatDalam(k);
      o.push(figurSvg(m.dalam[k], cd[0], cd[1], SKALA));
      if (k !== q) { var cp = pusatPojok(k); o.push(figurSvg(m.pojok[k], cp[0], cp[1], SKALA)); }
    }
    // tempat kedatangan di pojok "?": sisi tiap belahan diarsir warnanya, bentuk pojok putus-putus
    asal.forEach(function (a, i) { o.push(S.poli(poliBelahan(m.jawaban.bentuk, a.tujuan, pt[0], pt[1]), { tutup: true, isi: i ? BH.latarPanah : BH.latarSorot })); });
    o.push(S.poli(poligon(m.jawaban.bentuk, pt[0], pt[1], SKALA), { tutup: true, isi: 'none', garis: '#7b8499', tebal: 1.4, putus: '4 3' }));
    o.push(S.garis(Q, 0, Q, L, { garis: TEPI, tebal: 1.6 }));
    o.push(S.garis(0, Q, L, Q, { garis: TEPI, tebal: 1.6 }));
    o.push(S.poli([[Q, 0], [L, Q], [Q, L], [0, Q]], { tutup: true, isi: 'none', garis: TEPI, tebal: 1.6 }));
    o.push(S.rect(0, 0, L, L, { isi: 'none', garis: TEPI, tebal: 2.4 }));
    asal.forEach(function (a, i) {
      var cd = pusatDalam(a.dari), hp = poliBelahan(m.dalam[a.dari].bentuk, a.asal, cd[0], cd[1]);
      o.push(S.poli(hp, { tutup: true, isi: 'none', garis: WARNA_ASAL[i], tebal: 3.2, sambung: 'round' }));
      var p0 = Bentuk.beratTitik(hp), p1 = Bentuk.beratTitik(poliBelahan(m.jawaban.bentuk, a.tujuan, pt[0], pt[1]));
      o.push(S.panah(p0[0], p0[1], p1[0], p1[1], { warna: WARNA_ASAL[i], tebal: 2.6, kepala: 11, halo: true }));
    });
    o.push('</g>');
    var W = Math.max(L + PAD * 2, Math.ceil(Metrik.lebar(judul, 13, true)) + 18), H = L + PAD * 2 + 26;
    return { svg: S.doc(teksB(judul, PAD, PAD + 13, { ukuran: 13, tebal: true }) + o.join(''), W, H, { latar: '#ffffff' }), lebar: W, tinggi: H };
  }

  function svgGabung(m, judul) {
    var q = m.tanya, asal = asalBelahan(q), pad = 8, u = 96, sela = 34, y0 = pad + 26 + 30, o = [teksB(judul, pad, pad + 13, { ukuran: 13, tebal: true })];
    var W = Math.max(pad * 2 + 3 * u + 2 * sela, Math.ceil(Metrik.lebar(judul, 13, true)) + 18), H = y0 + u + 36 + pad;
    var panel = asal.map(function (a, i) { return { judul: 'dari kuadran', sub: KUADRAN[a.dari], warna: WARNA_ASAL[i], isi: belahanSvg(m.jawaban.bentuk, a.tujuan, m.jawaban.belahan[a.tujuan], u / 2, u / 2) }; });
    panel.push({ judul: 'gabungannya', sub: m.jawaban.bentuk + ' (jawaban)', warna: BH.jawab, isi: figurSvg(m.jawaban, u / 2, u / 2, SKALA), jawab: true });
    panel.forEach(function (p, i) {
      var x = pad + i * (u + sela);
      o.push(teksB(p.judul, x + u / 2, y0 - 20, { ukuran: 10, rata: 'middle', isi: p.warna }));
      o.push(teksB(p.sub, x + u / 2, y0 - 7, { ukuran: 11, tebal: true, rata: 'middle', isi: p.warna }));
      o.push(S.rect(x, y0, u, u, { rx: 5, isi: p.jawab ? BH.latarJawab : '#ffffff', garis: p.warna, tebal: p.jawab ? 2.6 : 1.8 }));
      o.push('<g transform="translate(' + x + ',' + y0 + ')">' + p.isi + '</g>');
      o.push(teksB(i < 2 ? 'di ' + bagian(asal[i].tujuan) : '', x + u / 2, y0 + u + 15, { ukuran: 10, rata: 'middle', isi: BH.teksRedup }));
      if (i < 2) o.push(teksB(i === 0 ? '+' : '=', x + u + sela / 2, y0 + u / 2 + 8, { ukuran: 22, tebal: true, rata: 'middle', isi: BH.teks }));
    });
    o.push(teksB('Bentuk pojok: ' + m.jawaban.bentuk + ' (pola bentuk gambar pojok).', pad, y0 + u + 32, { ukuran: 10, isi: BH.teksRedup }));
    return { svg: S.doc(o.join(''), W, H, { latar: '#ffffff' }), lebar: W, tinggi: H };
  }

  // --------------------------------------------------------------- penyusunan

  function fig(bentuk, q, h, v) { var b = {}; b[SISI_H[q]] = h; b[SISI_V[q]] = v; return { bentuk: bentuk, belahan: b }; }
  function hOf(f, q) { return f.belahan[SISI_H[q]]; }
  function vOf(f, q) { return f.belahan[SISI_V[q]]; }
  function sidikFig(f) { return f.bentuk + ':' + Object.keys(f.belahan).sort().map(function (k) { return k + '=' + f.belahan[k]; }).join(','); }
  function bagian(nama) { return 'bagian ' + nama.replace('-', ' '); }

  function bentukPojok(a, level, dipakai) {
    var semua = level === 'mudah' ? ['sama'] : ['sama', 'baris', 'kolom', 'silang', 'baris', 'kolom', 'silang'];
    var baru = semua.filter(function (p) { return (dipakai || []).indexOf('matriks-sekat:' + p) < 0; });
    var pola = a.pilih(baru.length ? baru : semua);
    var xy = a.kocok(POJOK), X = xy[0], Y = xy[1];
    var b = { sama: [X, X, X, X], baris: [X, X, Y, Y], kolom: [X, Y, Y, X], silang: [X, Y, X, Y] }[pola];
    return { pola: pola, bentuk: b, X: X, Y: Y };
  }

  function uraianBentuk(bp, q) {
    var kal;
    if (bp.pola === 'sama') kal = 'Semua gambar pojok berbentuk ' + bp.X;
    else if (bp.pola === 'baris') kal = 'Gambar pojok baris atas berbentuk ' + bp.X + ' dan baris bawah berbentuk ' + bp.Y;
    else if (bp.pola === 'kolom') kal = 'Gambar pojok kolom kiri berbentuk ' + bp.X + ' dan kolom kanan berbentuk ' + bp.Y;
    else kal = 'Gambar pojok bersilang: kiri atas dan kanan bawah berbentuk ' + bp.X + ', kanan atas dan kiri bawah berbentuk ' + bp.Y;
    return kal + ', jadi pojok ' + KUADRAN[q] + ' berbentuk ' + bp.bentuk[q] + '.';
  }

  var URUT_PENGECOH = {
    mudah: ['salin', 'bentuk', 'silang', 'sisa', 'tertukar', 'satu-v', 'satu-h'],
    sedang: ['tertukar', 'sisa', 'salin', 'bentuk', 'satu-v', 'silang', 'satu-h'],
    sulit: ['sisa', 'tertukar', 'satu-h', 'satu-v', 'bentuk', 'salin', 'silang']
  };

  function buatPengecoh(a, level, pojok, dalam, q, kunci, bp) {
    var hq = H[q], vq = V[q], dq = D[q], lain = POJOK.filter(function (x) { return x !== kunci.bentuk; })[0];
    var sisaH = vOf(dalam[hq], hq), sisaV = hOf(dalam[vq], vq);
    var calon = {
      sisa: { f: fig(kunci.bentuk, q, sisaH, sisaV), alasan: 'kedua belahannya diambil dari belahan tetangga yang menghadap ke kuadran lain, bukan yang menghadap ke kuadran ' + KUADRAN[q] },
      tertukar: { f: fig(kunci.bentuk, q, vOf(kunci, q), hOf(kunci, q)), alasan: 'kedua coraknya benar tetapi letaknya tertukar; belahan kiriman kuadran ' + KUADRAN[hq] + ' harus berada di sisi yang menghadap ke kuadran itu' },
      salin: { f: fig(kunci.bentuk, q, hOf(dalam[q], q), vOf(dalam[q], q)), alasan: 'hanya menyalin corak gambar segitiga dalam pada kuadran ' + KUADRAN[q] + ' sendiri' },
      bentuk: { f: fig(lain, q, hOf(kunci, q), vOf(kunci, q)), alasan: 'coraknya benar tetapi bentuknya ' + lain + ', padahal pola bentuk gambar pojok menghendaki ' + kunci.bentuk },
      // kuadran seberang punya arah belah yang sama, jadi gambarnya bisa disalin persis
      silang: { f: { bentuk: kunci.bentuk, belahan: Object.assign({}, pojok[dq].belahan) }, alasan: 'menyalin gambar pojok kuadran seberangnya (' + KUADRAN[dq] + ')' },
      'satu-h': { f: fig(kunci.bentuk, q, sisaH, vOf(kunci, q)), alasan: 'belahan di ' + bagian(SISI_H[q]) + ' salah: kuadran ' + KUADRAN[hq] + ' mengirim belahan ' + NAMA_CORAK[hOf(kunci, q)] + ', bukan ' + NAMA_CORAK[sisaH] },
      'satu-v': { f: fig(kunci.bentuk, q, hOf(kunci, q), sisaV), alasan: 'belahan di ' + bagian(SISI_V[q]) + ' salah: kuadran ' + KUADRAN[vq] + ' mengirim belahan ' + NAMA_CORAK[vOf(kunci, q)] + ', bukan ' + NAMA_CORAK[sisaV] }
    };
    var urut = URUT_PENGECOH[level] || URUT_PENGECOH.sedang;
    urut = a.kocok(urut.slice(0, 4)).concat(urut.slice(4));
    var hasil = [], lihat = {};
    lihat[sidikFig(kunci)] = 1;
    urut.forEach(function (nm) {
      if (hasil.length >= 4) return;
      var c = calon[nm], sd = sidikFig(c.f);
      if (lihat[sd]) return;
      lihat[sd] = 1;
      hasil.push({ fig: c.f, alasan: c.alasan, jenis: nm });
    });
    return hasil.length === 4 ? hasil : null;
  }

  // --------------------------------------------------------------------- butir

  function buat(id, level, benih, opsi) {
    opsi = opsi || {};
    var a = Rng.alat(benih);
    var target = opsi.target == null ? a.bulat(0, 4) : opsi.target;
    for (var coba = 0; coba < 20; coba++) {
      var corak = a.ambil([0, 1, 2, 3, 4, 5, 6, 7, 8], 8);
      var dalam = [0, 1, 2, 3].map(function (q) { return fig(a.pilih(DALAM), q, corak[2 * q], corak[2 * q + 1]); });
      var bp = bentukPojok(a, level, opsi.polaDipakai);
      var pojok = [0, 1, 2, 3].map(function (q) { return fig(bp.bentuk[q], q, hOf(dalam[H[q]], H[q]), vOf(dalam[V[q]], V[q])); });
      var tanya = a.bulat(0, 3), kunci = pojok[tanya];
      var peng = buatPengecoh(a, level, pojok, dalam, tanya, kunci, bp);
      if (!peng) continue;

      var contoh = a.pilih([0, 1, 2, 3].filter(function (q) { return q !== tanya; }));
      var hq = H[tanya], vq = V[tanya];
      var pem = ['Persegi besar terbagi menjadi empat kuadran. Tiap kuadran disekat garis miring menjadi segitiga dalam (dekat pusat) dan segitiga pojok, dan setiap gambar di dalamnya dibelah dua oleh garis miring.',
        'Aturannya: setiap belahan gambar di segitiga dalam pindah ke gambar pojok kuadran tetangga yang dihadapinya. Belahan yang menghadap ke samping masuk ke pojok kuadran di sampingnya, belahan yang menghadap ke atas atau ke bawah masuk ke pojok kuadran di atas atau di bawahnya, dan di sana belahan itu tetap berada di sisi yang menghadap ke kuadran asalnya.',
        'Contoh pada kuadran ' + KUADRAN[contoh] + ': gambar pojoknya berisi belahan ' + NAMA_CORAK[hOf(pojok[contoh], contoh)] + ' (di ' + bagian(SISI_H[contoh]) + ') kiriman gambar dalam kuadran ' + KUADRAN[H[contoh]] +
          ', dan belahan ' + NAMA_CORAK[vOf(pojok[contoh], contoh)] + ' (di ' + bagian(SISI_V[contoh]) + ') kiriman gambar dalam kuadran ' + KUADRAN[V[contoh]] + '.',
        'Untuk pojok kuadran ' + KUADRAN[tanya] + ': gambar dalam kuadran ' + KUADRAN[hq] + ' mengirim belahannya yang menghadap ke sini, yaitu ' + NAMA_CORAK[hOf(kunci, tanya)] + ', dan gambar dalam kuadran ' + KUADRAN[vq] + ' mengirim ' + NAMA_CORAK[vOf(kunci, tanya)] +
          '. Jadi gambar pojoknya ' + NAMA_CORAK[hOf(kunci, tanya)] + ' di ' + bagian(SISI_H[tanya]) + ' dan ' + NAMA_CORAK[vOf(kunci, tanya)] + ' di ' + bagian(SISI_V[tanya]) + '.',
        'Gambar 1 menandai kedua belahan asal itu (garis jingga pada gambar dalam kuadran ' + KUADRAN[hq] + ', garis biru pada gambar dalam kuadran ' + KUADRAN[vq] + ') dan panah menuju sisi pojok ' + KUADRAN[tanya] + ' yang ditempatinya. Gambar 2 memperlihatkan kedua belahan sebelum digabung, lalu gabungannya.',
        'Bentuk: ' + uraianBentuk(bp, tanya)];

      var daftar = a.kocok(peng.map(function (p) { return { fig: p.fig, alasan: p.alasan, kunci: false }; }));
      daftar.splice(target, 0, { fig: kunci, alasan: null, kunci: true });
      var opsiGambar = daftar.map(function (d, i) {
        return { teks: 'Gambar opsi ' + Fmt.huruf(i), nilai: i, alasan: d.alasan, kunci: d.kunci,
          gambar: { id: 'opsi-' + Fmt.huruf(i).toLowerCase(), jenis: 'sekat-opsi', model: { fig: d.fig, q: tanya }, judul: 'Opsi ' + Fmt.huruf(i) } };
      });
      var tampakPojok = pojok.map(function (f, q) { return q === tanya ? null : f; });
      var ctx = { subtes: 'ku', submateri: 'figural', keluarga: id, level: level, benih: benih, a: a };
      var butir = Butir.rakitPg(ctx, {
        jenisSoal: 'Figural Matriks - Kotak 2x2 Bersekat',
        judul: 'Figural Matriks - Kotak 2x2 Bersekat', teks: [], pertanyaan: '', perintah: PERINTAH,
        gambar: [{ id: 'soal', jenis: 'sekat', model: { pojok: tampakPojok, dalam: dalam, tanya: tanya }, judul: 'Matriks 2x2 bersekat' }],
        pilihanJadi: { opsi: opsiGambar, kunciIndex: target }, tulisKunci: false,
        langkah: [], pembahasan: pem,
        model: {
          topik: 'Figural', tipe: 'matriks-sekat', pojok: tampakPojok, dalam: dalam, tanya: tanya, pola: bp.pola,
          pilihan: daftar.map(function (d) { return d.fig; }), kunciIndex: target
        },
        sidik: { inti: 'matriks-sekat|' + dalam.map(sidikFig).join('/') + '|' + pojok.map(sidikFig).join('/') + '|' + tanya, param: [], entitas: bp.pola }
      });
      if (!butir) continue;
      butir.gambarPembahasan = [
        { id: 'bahas-1', jenis: 'sekat-asal', judul: 'Gambar 1. Asal kedua belahan pojok ' + KUADRAN[tanya], model: { dalam: dalam, pojok: tampakPojok, tanya: tanya, jawaban: kunci } },
        { id: 'bahas-2', jenis: 'sekat-gabung', judul: 'Gambar 2. Kedua belahan sebelum dan sesudah digabung', model: { tanya: tanya, jawaban: kunci } }
      ];
      butir.pola = 'matriks-sekat:' + bp.pola;
      butir.kategoriRiset = 'acuan';
      return butir;
    }
    return null;
  }

  var KELUARGA = [{ id: 'matriks-sekat', nama: 'Matriks 2x2 bersekat (belahan bercorak pindah ke pojok tetangga)', submateri: 'figural' }];

  return { KELUARGA: KELUARGA, CORAK: CORAK, PERINTAH: PERINTAH, buat: buat, svgSekat: svgSekat, svgPojok: svgPojok, svgAsal: svgAsal, svgGabung: svgGabung };
});
