/*
 * lipat-kertas.js — Kemampuan Umum > Figural > Macam-macam Transformasi Figural:
 * selembar kertas persegi dilipat, dilubangi, lalu dibuka kembali (lipatan = pencerminan berulang).
 *
 * Keluarga `lipat-lubang` (kolam serial). Gambar soal berupa deret panel dari kiri ke kanan: kertas
 * dengan garis lipat pertama (putus-putus), bagian yang akan dilipat berwarna abu-abu tipis dan panah
 * lengkung arah melipat; panel berikutnya kertas yang sudah terlipat dengan lipatan berikutnya; panel
 * terakhir kertas terlipat yang sudah dilubangi. Peserta memilih kertas setelah dibuka kembali.
 *
 * Model: kertas [0, 16] x [0, 16] (sumbu y ke bawah). Setiap lipatan adalah garis simetri bentuk
 * kertas saat itu (tegak, mendatar, atau miring 45°), jadi bagian yang dilipat menumpuk tepat pada
 * bagian yang diam dan lubang menembus semua lapisan. Membuka lipatan = mencerminkan setiap lubang
 * terhadap garis lipat, mulai dari lipatan terakhir. Lubang {bentuk, x, y, arah}:
 *   bulat, persegi, ketupat, silang       simetris (tanpa arah)
 *   segitiga, bintang, setengah-bulat     tidak simetris; arahnya (ujung segitiga/bintang, lengkung
 *                                         setengah lingkaran) ikut dicerminkan
 *   siku                                  huruf L, arah "tiang/kaki" (mis. "atas/kanan"); bayangan
 *                                         cerminnya tidak bisa diperoleh dengan memutar
 *   setengah-* / seperempat-*             potongan yang menempel pada tepi lipatan / pojok pertemuan
 *                                         dua garis lipat; saat dibuka menyatu dengan bayangannya
 *                                         menjadi bentuk utuh (setengah lingkaran -> lingkaran,
 *                                         segitiga di tepi lipatan -> belah ketupat, dst.)
 *
 * Mekanisme (pola) per tingkat:
 *   mudah   satu-tegak, satu-datar (1 lipatan, 2-3 lubang), satu-tepi (1 lipatan + lubang di tepi lipatan)
 *   sedang  dua-setengah (dua lipatan bersilang), dua-searah (dua lipatan sejajar -> pita),
 *           diagonal (1 lipatan miring, bentuk berarah), tepi-lipatan (2 lipatan + lubang di tepi)
 *   sulit   diagonal-ganda (miring lalu dilipat lagi), tiga-campur (tegak/datar, silang, miring),
 *           tiga-diagonal (miring, miring, lurus), tiga-lurus (tiga lipatan lurus),
 *           pojok-lipatan (potongan seperempat di pojok pertemuan dua garis lipat),
 *           silang-arah (dua lipatan bersilang, semua lubang dalam berarah: segitiga, bintang, huruf L, ...)
 *
 * Pengecoh dari jalur kesalahan: lupa mencerminkan, hanya membuka lipatan terakhir/pertama, setiap
 * garis lipat hanya mencerminkan lubang asli, sumbu cermin salah, lubang digeser atau diputar
 * (bukan dicerminkan), arah bentuk tak simetris tidak dibalik, lubang tepi dihitung dua atau
 * dibiarkan setengah, urutan membuka terbalik, satu lipatan terlewat, lubang tambahan.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./rng.js'), require('./svg.js'), require('./bentuk.js'), require('./butir.js'), require('./format.js'), require('./metrik.js'));
    module.exports = api;
  } else {
    api = factory(root.Rng, root.Svg, root.Bentuk, root.Butir, root.Fmt, root.Metrik);
    root.LipatKertas = api;
  }
})(typeof self !== 'undefined' ? self : this, function (Rng, S, Bentuk, Butir, Fmt, Metrik) {
  'use strict';

  var ID = 'lipat-lubang';
  var N = 16;                                   // sisi kertas (satuan model)
  var SK = 1.1;                                 // skala bentuk lubang (jari lingkaran = 0,9 x SK)
  var JARAK_TEPI = 0.45, JARAK_LUBANG = 0.7;    // jarak bebas lubang ke tepi bagian terlipat / antarlubang
  var JARAK_KERTAS = 0.8;                       // jarak bebas lubang ke tepi kertas asli
  var BATAS_LUBANG = 16;                        // paling banyak lubang pada kertas yang sudah dibuka
  var TINTA = '#1d1d1d', TEPI = '#4a5266', ABU = '#dde1ea', HANTU = '#c3c8d4', BH = S.BAHAS;
  var JENIS_SOAL = 'Figural - Lipat dan Lubangi Kertas';
  var PERINTAH = 'Gambar di bagian atas menunjukkan selembar kertas persegi yang dilipat berurutan dari kiri ke kanan: garis putus-putus adalah garis lipatan, panah menunjukkan arah melipat, dan bagian abu-abu adalah bagian kertas yang dilipat. Panel terakhir menunjukkan kertas terlipat yang dilubangi.';
  var PERTANYAAN = 'Selembar kertas dilipat seperti gambar, lalu dilubangi. Bagaimana bentuk kertas setelah dibuka kembali?';

  var ARAH = { kanan: [1, 0], 'kanan-bawah': [1, 1], bawah: [0, 1], 'kiri-bawah': [-1, 1], kiri: [-1, 0], 'kiri-atas': [-1, -1], atas: [0, -1], 'kanan-atas': [1, -1] };
  var SEMUA_ARAH = Object.keys(ARAH), ARAH_LURUS = ['kanan', 'bawah', 'kiri', 'atas'];
  var SIMETRIS = ['bulat', 'persegi', 'ketupat', 'silang'], TAKSIMETRIS = ['segitiga', 'bintang', 'setengah-bulat', 'siku'];
  var ARAH_SIKU = [];
  ARAH_LURUS.forEach(function (t) { ARAH_LURUS.forEach(function (k) { var a = ARAH[t], b = ARAH[k]; if (a[0] * b[0] + a[1] * b[1] === 0) ARAH_SIKU.push(t + '/' + k); }); });
  var JARI_UTUH = { bulat: 0.9 * SK, persegi: 0.75 * Math.SQRT2 * SK, ketupat: SK, silang: Math.hypot(0.95, 0.32) * SK };
  var NAMA = {
    bulat: 'lingkaran', persegi: 'persegi', ketupat: 'belah ketupat', silang: 'tanda tambah', segitiga: 'segitiga', bintang: 'bintang', siku: 'huruf L',
    'setengah-bulat': 'setengah lingkaran', 'setengah-persegi': 'setengah persegi', 'setengah-ketupat': 'setengah belah ketupat', 'setengah-silang': 'setengah tanda tambah',
    'seperempat-bulat': 'seperempat lingkaran', 'seperempat-persegi': 'seperempat persegi', 'seperempat-ketupat': 'seperempat belah ketupat'
  };

  // ------------------------------------------------------------------ angka dan arah

  function bulat6(v) { return Math.round(v * 1e6) / 1e6; }
  function bulat4(v) { return Math.round(v * 1e4) / 1e4; }
  function snap(v) { return Math.round(v * 2) / 2; }
  function tanda(v) { var r = Math.round(v * 1e6); return r > 0 ? 1 : r < 0 ? -1 : 0; }
  function arahDari(v) {
    var x = tanda(v[0]), y = tanda(v[1]);
    for (var i = 0; i < SEMUA_ARAH.length; i++) { var d = ARAH[SEMUA_ARAH[i]]; if (d[0] === x && d[1] === y) return SEMUA_ARAH[i]; }
    return null;
  }
  function lawan(nama) { var d = ARAH[nama]; return arahDari([-d[0], -d[1]]); }
  /** Arah lubang setelah diputar setengah putaran (siku: tiang dan kaki sama-sama berbalik). */
  function putarArah(arah) { return arah.split('/').map(lawan).join('/'); }
  /** Arah lubang setelah dicerminkan terhadap garis L. */
  function cerminArah(L, arah) { return arah.split('/').map(function (x) { return arahDari(cerminVek(L, ARAH[x])); }).join('/'); }
  function arahSah(bentuk, arah) {
    if (bentuk === 'siku') return ARAH_SIKU.indexOf(arah) >= 0;
    if (bentuk === 'bintang') return ARAH_LURUS.indexOf(arah) >= 0;
    return !!ARAH[arah];
  }
  function teksArah(nama) { return nama.replace('-', ' '); }
  function induk(b) { var m = /^(setengah|seperempat)-(.+)$/.exec(b); return m ? m[2] : b; }
  /** 4 utuh, 2 setengah, 1 seperempat, 0 bentuk tunggal berarah (segitiga, bintang, siku). */
  function porsi(b) { return /^setengah-/.test(b) ? 2 : /^seperempat-/.test(b) ? 1 : (SIMETRIS.indexOf(b) >= 0 ? 4 : 0); }

  // ------------------------------------------------------------------ garis lipat

  function nilai(L, p) { return L.a * p[0] + L.b * p[1] - L.c; }
  function cermin(L, p) { var k = 2 * nilai(L, p) / (L.a * L.a + L.b * L.b); return [bulat6(p[0] - k * L.a), bulat6(p[1] - k * L.b)]; }
  function cerminVek(L, d) { var k = 2 * (L.a * d[0] + L.b * d[1]) / (L.a * L.a + L.b * L.b); return [d[0] - k * L.a, d[1] - k * L.b]; }
  function jenisGaris(L) { return L.b === 0 ? 'tegak' : L.a === 0 ? 'mendatar' : 'miring'; }
  function namaGaris(L) {
    if (L.b === 0) return 'garis tegak';
    if (L.a === 0) return 'garis mendatar';
    return L.b < 0 ? 'garis miring dari kiri atas ke kanan bawah' : 'garis miring dari kanan atas ke kiri bawah';
  }
  /** Garis dari ruas yang tergambar: a, b dinormalkan (1,0), (0,1), (1,1), atau (1,-1). */
  function garisDariRuas(g) {
    var dx = g[1][0] - g[0][0], dy = g[1][1] - g[0][1], a = tanda(dy), b = tanda(-dx);
    if (a < 0 || (a === 0 && b < 0)) { a = -a; b = -b; }
    return { a: a, b: b, c: bulat6(a * g[0][0] + b * g[0][1]) };
  }

  // ------------------------------------------------------------------ poligon kertas

  function kotak() { return [[0, 0], [N, 0], [N, N], [0, N]]; }

  /** Rapikan poligon kertas: titik ke kisi 0,5, buang titik kembar dan titik segaris. */
  function rapikan(P) {
    var out = [];
    P.forEach(function (p) {
      var q = [snap(p[0]), snap(p[1])], u = out[out.length - 1];
      if (!u || u[0] !== q[0] || u[1] !== q[1]) out.push(q);
    });
    if (out.length > 1 && out[0][0] === out[out.length - 1][0] && out[0][1] === out[out.length - 1][1]) out.pop();
    var hasil = [];
    for (var i = 0; i < out.length; i++) {
      var a = out[(i + out.length - 1) % out.length], b = out[i], c = out[(i + 1) % out.length];
      if (Math.abs((b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0])) > 1e-9) hasil.push(b);
    }
    return hasil;
  }
  function potongKertas(P, L, s) { return rapikan(Bentuk.potongBidang(P, s * L.a, s * L.b, s * L.c)); }
  function kunciPoli(P) { return P.map(function (p) { return bulat4(p[0]) + ',' + bulat4(p[1]); }).sort().join(' '); }

  /** Sisi poligon cembung beserta normal ke dalam (jarak bertanda positif di dalam). */
  function sisiPoli(P) {
    var ar = Bentuk.luas(P) >= 0 ? 1 : -1, out = [];
    for (var i = 0; i < P.length; i++) {
      var a = P[i], b = P[(i + 1) % P.length], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
      if (L < 1e-9) continue;
      var nx = -dy / L * ar, ny = dx / L * ar;
      out.push({ p: a, q: b, nx: nx, ny: ny, c: nx * a[0] + ny * a[1] });
    }
    return out;
  }
  function jarakSisi(e, v) { return e.nx * v[0] + e.ny * v[1] - e.c; }

  /**
   * Satu lipatan pada bentuk S: garis simetri berarah ab yang melalui titik berat S, bagian bertanda s
   * (s * nilai > 0) dilipat menumpuk pada bagian lain. null bila garis itu bukan garis simetri S.
   */
  function lipat(S, ab, s) {
    var g = Bentuk.beratTitik(S), L = { a: ab[0], b: ab[1], c: snap(ab[0] * g[0] + ab[1] * g[1]) };
    if (Math.abs(L.c - (ab[0] * g[0] + ab[1] * g[1])) > 1e-6) return null;
    var M = potongKertas(S, L, s), T = potongKertas(S, L, -s);
    if (M.length < 3 || T.length < 3) return null;
    if (kunciPoli(M.map(function (p) { return cermin(L, p); })) !== kunciPoli(T)) return null;
    var ujung = M.filter(function (p) { return Math.abs(nilai(L, p)) < 1e-6; });
    if (ujung.length !== 2) return null;
    ujung.sort(function (u, v) { return u[1] - v[1] || u[0] - v[0]; });
    var dari = Bentuk.beratTitik(M), ke = cermin(L, dari);
    return {
      L: L, s: s, sebelum: S, gerak: M, sesudah: T, garis: ujung,
      dari: [bulat4(dari[0]), bulat4(dari[1])], ke: [bulat4(ke[0]), bulat4(ke[1])], arah: arahDari([ke[0] - dari[0], ke[1] - dari[1]])
    };
  }

  /** Bangun ulang tahapan lipatan dari model gambar (ruas garis lipat dan titik awal panah). */
  function langkahDariModel(m) {
    var Sx = kotak(), out = [];
    m.lipatan.forEach(function (f) {
      var L = garisDariRuas(f.garis), s = nilai(L, f.dari) > 0 ? 1 : -1;
      var M = potongKertas(Sx, L, s), T = potongKertas(Sx, L, -s);
      out.push({ L: L, s: s, sebelum: Sx, gerak: M, sesudah: T, garis: f.garis, dari: f.dari, ke: f.ke });
      Sx = T;
    });
    return { langkah: out, akhir: Sx };
  }

  // ------------------------------------------------------------------ bentuk lubang

  /**
   * Bentuk dasar dalam satuan "jari" (dikalikan SK): titik lokal (a, b) dengan a searah u dan b searah v.
   * Lingkaran berjari 0,9; persegi bersisi 1,5; belah ketupat berdiagonal 2; tanda tambah lengan 0,95.
   */
  var LOKAL = {
    persegi: [[-0.75, -0.75], [0.75, -0.75], [0.75, 0.75], [-0.75, 0.75]],
    ketupat: [[0, -1], [1, 0], [0, 1], [-1, 0]],
    silang: [[-0.32, -0.95], [0.32, -0.95], [0.32, -0.32], [0.95, -0.32], [0.95, 0.32], [0.32, 0.32], [0.32, 0.95], [-0.32, 0.95], [-0.32, 0.32], [-0.95, 0.32], [-0.95, -0.32], [-0.32, -0.32]],
    segitiga: [[1.1, 0], [-0.65, 0.62], [-0.65, -0.62]],              // ramping supaya arah ujungnya jelas
    // huruf L: tiang sepanjang u (ujung tiang ke arah u), kaki ke arah v di pangkal tiang
    siku: [[0.95, -0.6], [0.95, -0.1], [-0.45, -0.1], [-0.45, 0.6], [-0.95, 0.6], [-0.95, -0.6]]
  };
  function taruh(lokal, x, y, u, v) { return lokal.map(function (q) { return [x + SK * (q[0] * u[0] + q[1] * v[0]), y + SK * (q[0] * u[1] + q[1] * v[1])]; }); }

  function poliUtuh(nama, x, y) {
    if (nama === 'bulat') { var p = []; for (var i = 0; i < 48; i++) { var t = i * Math.PI / 24; p.push([x + SK * 0.9 * Math.cos(t), y + SK * 0.9 * Math.sin(t)]); } return p; }
    return taruh(LOKAL[nama], x, y, [1, 0], [0, 1]);
  }

  /** Poligon lubang (satuan model). */
  function poliLubang(h) {
    var b = h.bentuk, x = h.x, y = h.y, d, u, p = [], i;
    if (b === 'segitiga') { d = ARAH[h.arah]; var L = Math.hypot(d[0], d[1]); u = [d[0] / L, d[1] / L]; return taruh(LOKAL.segitiga, x, y, u, [-u[1], u[0]]); }
    if (b === 'siku') { var pa = h.arah.split('/'); return taruh(LOKAL.siku, x, y, ARAH[pa[0]], ARAH[pa[1]]); }
    if (b === 'bintang') {
      d = ARAH[h.arah]; var t0 = Math.atan2(d[1], d[0]);
      for (i = 0; i < 10; i++) { var r = SK * (i % 2 ? 0.42 : 1.0), t = t0 + i * Math.PI / 5; p.push([x + r * Math.cos(t), y + r * Math.sin(t)]); }
      return p;
    }
    var P = poliUtuh(induk(b), x, y), k = porsi(b);
    if (k === 4) return P;
    d = ARAH[h.arah];
    if (k === 2) return Bentuk.potongBidang(P, d[0], d[1], d[0] * x + d[1] * y);
    // seperempat: dua setengah bidang yang mengapit arah
    var n1 = [d[0] - d[1], d[1] + d[0]], n2 = [d[0] + d[1], d[1] - d[0]];
    P = Bentuk.potongBidang(P, n1[0], n1[1], n1[0] * x + n1[1] * y);
    return Bentuk.potongBidang(P, n2[0], n2[1], n2[0] * x + n2[1] * y);
  }

  /** Lingkaran pembatas lubang (dari poligonnya). */
  function lingkup(h) {
    var P = poliLubang(h), g = Bentuk.beratTitik(P), r = 0;
    P.forEach(function (p) { r = Math.max(r, Math.hypot(p[0] - g[0], p[1] - g[1])); });
    return { x: g[0], y: g[1], r: r };
  }
  /** Saat menempatkan: potongan tepi/pojok dihitung sebagai bentuk utuhnya (setelah dibuka). */
  function lingkupPenuh(h) {
    if (h.asal === 'tepi' || h.asal === 'pojok') return { x: h.x, y: h.y, r: JARI_UTUH[induk(h.bentuk)] };
    return lingkup(h);
  }
  function renggang(A, B, jarak) { return Math.hypot(A.x - B.x, A.y - B.y) - A.r - B.r >= jarak; }

  // ------------------------------------------------------------------ cermin dan gabung lubang

  function lubang(bentuk, x, y, arah, asal) {
    var h = { bentuk: bentuk, x: bulat6(x), y: bulat6(y) };
    if (arah) h.arah = arah;
    if (asal) h.asal = asal;
    return h;
  }

  function cerminLubang(L, h, arahTetap) {
    var p = cermin(L, [h.x, h.y]), arah = h.arah;
    if (arah && !(arahTetap && h.asal === 'dalam')) arah = cerminArah(L, arah);
    return lubang(h.bentuk, p[0], p[1], arah, h.asal);
  }

  /** Potongan tepi/pojok yang titik acuannya tepat pada garis L (menyatu dengan bayangannya). */
  function diGaris(L, h) { return h.asal !== 'dalam' && porsi(h.bentuk) > 0 && porsi(h.bentuk) < 4 && Math.abs(nilai(L, [h.x, h.y])) < 1e-6; }

  /** Gabungan dua potongan sekeluarga di titik yang sama, atau null bila bertumpuk/tak serasi. */
  function gabungDua(p, q) {
    if (p.asal === 'dalam' || q.asal === 'dalam' || induk(p.bentuk) !== induk(q.bentuk)) return null;
    var kp = porsi(p.bentuk), kq = porsi(q.bentuk);
    if (!(kp > 0 && kp < 4 && kq > 0 && kq < 4) || kp !== kq) return null;
    var dp = ARAH[p.arah], dq = ARAH[q.arah];
    if (kp === 2) return dp[0] === -dq[0] && dp[1] === -dq[1] ? lubang(induk(p.bentuk), p.x, p.y, null, p.asal) : null;
    // dua seperempat bersebelahan -> setengah
    if (dp[0] * dq[0] + dp[1] * dq[1] !== 0) return null;
    return lubang('setengah-' + induk(p.bentuk), p.x, p.y, arahDari([dp[0] + dq[0], dp[1] + dq[1]]), p.asal);
  }

  /** Gabungkan lubang yang bertemu di titik yang sama; null bila ada yang bertumpuk. */
  function gabungSemua(daftar) {
    var kel = {}, urut = [];
    daftar.forEach(function (h) {
      var k = bulat4(h.x) + ',' + bulat4(h.y);
      if (!kel[k]) { kel[k] = []; urut.push(k); }
      kel[k].push(h);
    });
    var hasil = [];
    for (var i = 0; i < urut.length; i++) {
      var g = kel[urut[i]].slice();
      var lanjut = true;
      while (g.length > 1 && lanjut) {
        lanjut = false;
        for (var a = 0; a < g.length && !lanjut; a++) {
          for (var b = a + 1; b < g.length && !lanjut; b++) {
            var m = gabungDua(g[a], g[b]);
            if (m) { g.splice(b, 1); g.splice(a, 1, m); lanjut = true; }
          }
        }
      }
      if (g.length > 1) return null;
      hasil.push(g[0]);
    }
    return hasil;
  }

  function bersih(h) { var o = { bentuk: h.bentuk, x: h.x, y: h.y }; if (h.arah) o.arah = h.arah; return o; }
  function urutLubang(p, q) { return p.y - q.y || p.x - q.x || (p.bentuk < q.bentuk ? -1 : p.bentuk > q.bentuk ? 1 : 0) || ((p.arah || '') < (q.arah || '') ? -1 : (p.arah || '') > (q.arah || '') ? 1 : 0); }
  /** Bentuk kanonik isi gambar (fig): lubang terurut menurut y, x, bentuk, arah. */
  function kanon(daftar) { return daftar.map(bersih).sort(urutLubang); }
  function sidikLubang(h) { return h.bentuk + (h.arah ? '>' + h.arah : '') + '@' + h.x + ',' + h.y; }
  function sidikFig(f) { return f.map(sidikLubang).join(';'); }

  /** Buka semua lipatan dengan benar (lipatan terakhir lebih dulu), dengan catatan tiap tahap. */
  function bukaBenar(H0, lip) {
    var cur = gabungSemua(H0.slice()), tahap = [];
    if (!cur) return null;
    for (var k = lip.length - 1; k >= 0; k--) {
      var L = lip[k].L, baru = [], pasangan = [], gabung = [];
      cur.forEach(function (h) {
        var img = cerminLubang(L, h);
        baru.push(img);
        if (diGaris(L, h)) gabung.push({ asal: h, bayangan: img });
        else pasangan.push({ asal: h, bayangan: img });
      });
      var hasil = gabungSemua(cur.concat(baru));
      if (!hasil) return null;
      gabung.forEach(function (g) { g.jadi = hasil.filter(function (h) { return Math.abs(h.x - g.asal.x) < 1e-6 && Math.abs(h.y - g.asal.y) < 1e-6; })[0]; });
      tahap.push({ k: k, lama: cur, baru: baru, pasangan: pasangan, gabung: gabung, hasil: hasil });
      cur = hasil;
    }
    return { tahap: tahap, akhir: cur };
  }

  /**
   * Membuka dengan jalur kesalahan. o: { urutan: indeks lipatan menurut urutan dibuka, ganti: {k: fungsi
   * pengganti cermin untuk lubang biasa}, tetap (potongan tepi tidak dicerminkan), dua (potongan tepi
   * menjadi dua lubang utuh), arahTetap (arah bentuk tak simetris tidak dibalik), buang (lubang yang
   * seluruhnya di luar kertas dibuang) }.
   */
  function bukaSalah(H0, lip, o) {
    var cur = gabungSemua(H0.slice());
    if (!cur) return null;
    var urutan = o.urutan || lip.map(function (x, i) { return i; }).reverse();
    for (var i = 0; i < urutan.length; i++) {
      var k = urutan[i], L = lip[k].L, imgs = [], hapus = [];
      cur.forEach(function (h) {
        if (diGaris(L, h)) {
          if (o.tetap) return;
          if (o.dua && porsi(h.bentuk) === 2) {
            var nrm = Math.hypot(L.a, L.b), geser = JARI_UTUH[induk(h.bentuk)] + 0.15, ux = L.a / nrm * geser, uy = L.b / nrm * geser;
            hapus.push(h);
            imgs.push(lubang(induk(h.bentuk), h.x + ux, h.y + uy, null, 'dalam'), lubang(induk(h.bentuk), h.x - ux, h.y - uy, null, 'dalam'));
            return;
          }
          imgs.push(cerminLubang(L, h));
          return;
        }
        imgs.push(o.ganti && o.ganti[k] ? o.ganti[k](h) : cerminLubang(L, h, o.arahTetap));
      });
      cur = gabungSemua(cur.filter(function (h) { return hapus.indexOf(h) < 0; }).concat(imgs));
      if (!cur) return null;
    }
    if (o.buang) {
      var sisa = [];
      for (var j = 0; j < cur.length; j++) {
        var P = poliLubang(cur[j]), dalam = P.filter(function (p) { return p[0] > 0 && p[0] < N && p[1] > 0 && p[1] < N; }).length;
        if (dalam === P.length) sisa.push(cur[j]);
        else if (dalam > 0) return null;
      }
      cur = sisa;
    }
    return cur;
  }

  /** Isi gambar sah: di dalam kertas, tidak bertumpuk, potongan berarah lengkap. */
  function sahFig(daftar, jarak) {
    if (!daftar || !daftar.length) return false;
    var lk = [];
    for (var i = 0; i < daftar.length; i++) {
      var h = daftar[i];
      if (porsi(h.bentuk) !== 4 && !arahSah(h.bentuk, h.arah)) return false;
      var P = poliLubang(h);
      if (P.some(function (p) { return p[0] < 0.15 || p[0] > N - 0.15 || p[1] < 0.15 || p[1] > N - 0.15; })) return false;
      lk.push(lingkup(h));
    }
    for (var a = 0; a < lk.length; a++) for (var b = a + 1; b < lk.length; b++) if (!renggang(lk[a], lk[b], jarak)) return false;
    return true;
  }

  // ------------------------------------------------------------------ mekanisme

  var MEKANISME = {
    mudah: ['satu-tegak', 'satu-datar', 'satu-tepi'],
    sedang: ['dua-setengah', 'dua-searah', 'diagonal', 'tepi-lipatan'],
    sulit: ['diagonal-ganda', 'tiga-campur', 'tiga-diagonal', 'tiga-lurus', 'pojok-lipatan', 'silang-arah']
  };
  // tiga lipatan menyisakan bagian terlipat yang sempit (ragam letak lubangnya sedikit), jadi lebih jarang diundi
  var BOBOT_MEKANISME = { 'tiga-campur': 0.6, 'tiga-diagonal': 0.6, 'tiga-lurus': 0.6 };

  function pilihMekanisme(a, level, dipakai) {
    var semua = MEKANISME[level] || MEKANISME.sedang;
    var baru = semua.filter(function (p) { return (dipakai || []).indexOf(ID + ':' + p) < 0; });
    var d = baru.length ? baru : semua;
    return a.bobot(d, d.map(function (p) { return BOBOT_MEKANISME[p] || 1; }));
  }

  function polaLipat(a, mek) {
    var x = a.pilih(['tegak', 'datar']);
    switch (mek) {
      case 'satu-tegak': return ['tegak'];
      case 'satu-datar': return ['datar'];
      case 'satu-tepi': return [x];
      case 'dua-setengah': case 'pojok-lipatan': case 'silang-arah': return [x, 'silang'];
      case 'dua-searah': return [x, 'sama'];
      case 'diagonal': return ['miring'];
      case 'tepi-lipatan': return a.untung(0.65) ? [x, 'silang'] : [x, 'sama'];
      case 'diagonal-ganda': return ['miring', 'sumbu'];
      case 'tiga-campur': return [x, 'silang', 'miring'];
      case 'tiga-diagonal': return ['miring', 'sumbu', 'sumbu'];
      default: return a.untung(0.5) ? [x, 'silang', 'lurus'] : [x, 'sama', 'silang'];     // tiga-lurus
    }
  }

  function calonArahGaris(sel, sebelum) {
    if (sel === 'tegak') return [[1, 0]];
    if (sel === 'datar') return [[0, 1]];
    if (sel === 'miring') return [[1, 1], [1, -1]];
    if (sel === 'lurus') return [[1, 0], [0, 1]];
    if (sel === 'sama') return [sebelum];
    if (sel === 'silang') return [[sebelum[1], sebelum[0]]];
    return [[1, 0], [0, 1], [1, 1], [1, -1]];
  }

  function susunLipatan(a, mek) {
    var pola = polaLipat(a, mek), Sx = kotak(), lip = [], ab = null;
    for (var i = 0; i < pola.length; i++) {
      var pilihan = [];
      a.kocok(calonArahGaris(pola[i], ab)).forEach(function (f) { a.kocok([1, -1]).forEach(function (s) { pilihan.push([f, s]); }); });
      var st = null;
      for (var j = 0; j < pilihan.length && !st; j++) st = lipat(Sx, pilihan[j][0], pilihan[j][1]);
      if (!st) return null;
      lip.push(st); ab = [st.L.a, st.L.b]; Sx = st.sesudah;
    }
    return lip;
  }

  /**
   * Banyak lubang: pojok, tepi, dalam WAJIB; tepiPlus dan dalamPlus dicoba bila masih muat.
   * asim = banyak lubang dalam yang tidak simetris (segitiga, bintang, setengah lingkaran).
   */
  function resep(a, mek) {
    var r = { pojok: 0, tepi: 0, dalam: 0, tepiPlus: 0, dalamPlus: 0, asim: 0 };
    function isi(o) { Object.keys(o).forEach(function (k) { r[k] = o[k]; }); return r; }
    switch (mek) {
      case 'satu-tegak': case 'satu-datar': return isi({ dalam: 2, dalamPlus: a.pilih([0, 1, 1, 1]), asim: a.pilih([0, 1, 1]) });
      case 'satu-tepi': return isi({ tepi: 1, dalam: 1, dalamPlus: a.pilih([0, 1, 1, 1]), asim: a.pilih([0, 0, 1]) });
      case 'dua-setengah': return isi({ dalam: 2, dalamPlus: a.pilih([0, 1, 1, 1]), asim: a.pilih([0, 1, 1, 2]) });
      case 'dua-searah': return isi({ dalam: 2, dalamPlus: 1, asim: a.pilih([0, 1, 1, 2]) });
      case 'diagonal': return isi({ dalam: 2, dalamPlus: a.pilih([0, 1, 1]), asim: a.pilih([1, 1, 2]) });
      case 'tepi-lipatan': return isi({ tepi: 1, dalam: 1, tepiPlus: a.pilih([0, 1]), dalamPlus: 1, asim: a.pilih([0, 1]) });
      case 'diagonal-ganda': return a.untung(0.5) ? isi({ dalam: 2, tepiPlus: 1, asim: a.pilih([1, 2]) }) : isi({ tepi: 1, dalam: 1, dalamPlus: 1, asim: a.pilih([0, 1, 1]) });
      case 'tiga-campur': case 'tiga-diagonal': case 'tiga-lurus':
        // bagian terlipat kecil (1/8 kertas): ragam susunan lubang supaya butir tidak mirip satu sama lain;
        // dua lubang dalam letaknya nyaris tetap, jadi dipakai satu lubang dalam dan potongan tepi
        return isi({ tepi: 1, dalam: 1, tepiPlus: 1, asim: a.pilih([0, 1, 1]) });
      case 'silang-arah': return isi({ dalam: 2, dalamPlus: 1, tepiPlus: a.pilih([0, 1]), asim: 3 });   // semua lubang dalam berarah
      default: return isi({ pojok: 1, dalam: 1, tepiPlus: 1, dalamPlus: 1, asim: a.pilih([1, 1, 2]) });     // pojok-lipatan
    }
  }

  // ------------------------------------------------------------------ penempatan lubang

  /** Sisi bagian terlipat yang berupa garis lipat, dengan normal ke dalam (vektor tanda). */
  function tepiLipatan(sisi, lip) {
    var out = [];
    sisi.forEach(function (e) {
      for (var k = 0; k < lip.length; k++) {
        var L = lip[k].L;
        if (Math.abs(nilai(L, e.p)) < 1e-6 && Math.abs(nilai(L, e.q)) < 1e-6) { out.push({ e: e, L: L, arah: arahDari([e.nx, e.ny]), miring: L.a !== 0 && L.b !== 0 }); break; }
      }
    });
    return out;
  }

  /** Semua potongan lubang dari bukaBenar sudah utuh (tidak ada setengah di tepi kertas). */
  function menyatuPenuh(h, lip) {
    var r = bukaBenar([h], lip);
    return !!r && r.akhir.every(function (x) { return porsi(x.bentuk) === 4; });
  }

  /** Tepi kertas asli (bukan garis lipat): lubang diberi jarak lebih lebar supaya tidak tampak menempel. */
  function tepiKertas(e) {
    return (e.p[0] === e.q[0] && (e.p[0] === 0 || e.p[0] === N)) || (e.p[1] === e.q[1] && (e.p[1] === 0 || e.p[1] === N));
  }

  function muat(P, sisi, kecuali, jarak) {
    for (var i = 0; i < sisi.length; i++) {
      var e = sisi[i], batas = kecuali.indexOf(e) >= 0 ? -1e-6 : tepiKertas(e) ? Math.max(jarak, JARAK_KERTAS) : jarak;
      for (var j = 0; j < P.length; j++) if (jarakSisi(e, P[j]) < batas) return false;
    }
    return true;
  }

  function titikKisi(T) {
    var x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, out = [];
    T.forEach(function (p) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); });
    for (var x = snap(x0); x <= x1 + 1e-9; x += 0.5) for (var y = snap(y0); y <= y1 + 1e-9; y += 0.5) out.push([x, y]);
    return out;
  }

  function pilihArah(a, bentuk, Lterakhir) {
    var daftar = a.kocok(bentuk === 'bintang' ? ARAH_LURUS : bentuk === 'siku' ? ARAH_SIKU : SEMUA_ARAH);
    // dahulukan arah yang berubah saat lipatan terakhir dibuka (orientasi ikut diuji)
    var berubah = daftar.filter(function (n) { return cerminArah(Lterakhir, n) !== n; });
    var tetap = daftar.filter(function (n) { return berubah.indexOf(n) < 0; });
    return a.untung(0.85) ? berubah.concat(tetap) : daftar;
  }

  function tempatkan(a, mek, lip) {
    var T = lip[lip.length - 1].sesudah, sisi = sisiPoli(T), tepi = tepiLipatan(sisi, lip), Lakhir = lip[lip.length - 1].L;
    var r = resep(a, mek), H = [], lk = [], n = lip.length;
    function tambah(h) { H.push(h); lk.push(lingkupPenuh(h)); }
    /** Banyak lubang yang dihasilkan sebuah lubang setelah semua lipatan dibuka. */
    function bayangan(asal) { return Math.pow(2, n - (asal === 'tepi' ? 1 : asal === 'pojok' ? 2 : 0)); }
    function jumlah() { var j = 0; H.forEach(function (x) { j += bayangan(x.asal); }); return j; }
    function masih(asal, cadangan) { return jumlah() + bayangan(asal) + (cadangan || 0) <= BATAS_LUBANG; }
    function bebas(h) { var c = lingkupPenuh(h); return lk.every(function (x) { return renggang(x, c, JARAK_LUBANG); }); }

    // potongan seperempat di pojok pertemuan dua garis lipat yang tegak lurus
    for (var i = 0; i < r.pojok; i++) {
      var calonP = [];
      tepi.forEach(function (t1) {
        tepi.forEach(function (t2) {
          if (t1 === t2 || Math.abs(t1.e.nx * t2.e.nx + t1.e.ny * t2.e.ny) > 1e-6) return;
          if (Math.abs(t1.e.q[0] - t2.e.p[0]) > 1e-9 || Math.abs(t1.e.q[1] - t2.e.p[1]) > 1e-9) return;
          var v = t1.e.q, arah = arahDari([t1.e.nx + t2.e.nx, t1.e.ny + t2.e.ny]);
          // seperempat tanda tambah tidak dipakai: bentuknya mirip huruf L
          (t1.miring ? ['seperempat-bulat'] : ['seperempat-bulat', 'seperempat-persegi', 'seperempat-ketupat']).forEach(function (b) {
            var h = lubang(b, v[0], v[1], arah, 'pojok');
            if (muat(poliLubang(h), sisi, [t1.e, t2.e], JARAK_TEPI) && bebas(h) && menyatuPenuh(h, lip)) calonP.push(h);
          });
        });
      });
      if (!calonP.length) return null;
      tambah(a.pilih(calonP));
    }
    // potongan setengah yang menempel pada tepi lipatan
    function pasangTepi() {
      var urutTepi = a.kocok(tepi);
      for (var t = 0; t < urutTepi.length; t++) {
        var tp = urutTepi[t], bentukT = a.kocok(tp.miring ? ['setengah-bulat', 'setengah-persegi', 'setengah-ketupat'] : ['setengah-bulat', 'setengah-ketupat', 'setengah-persegi', 'setengah-silang']);
        for (var bi = 0; bi < bentukT.length; bi++) {
          var calonT = [], d = [tp.e.q[0] - tp.e.p[0], tp.e.q[1] - tp.e.p[1]], langkah = Math.max(Math.abs(d[0]), Math.abs(d[1])) / 0.5;
          for (var j = 1; j < langkah; j++) {
            var h = lubang(bentukT[bi], tp.e.p[0] + d[0] * j / langkah, tp.e.p[1] + d[1] * j / langkah, tp.arah, 'tepi');
            if (muat(poliLubang(h), sisi, [tp.e], JARAK_TEPI) && bebas(h)) calonT.push(h);
          }
          calonT = a.kocok(calonT);
          for (var c = 0; c < calonT.length; c++) if (menyatuPenuh(calonT[c], lip)) return calonT[c];
        }
      }
      return null;
    }
    // lubang biasa di dalam bagian terlipat
    var kisi = titikKisi(T);
    function pasangDalam(b) {
      var daftarArah = porsi(b) === 4 ? [null] : pilihArah(a, b, Lakhir).slice(0, 4);
      for (var ai = 0; ai < daftarArah.length; ai++) {
        var calonD = [];
        kisi.forEach(function (p) {
          var h = lubang(b, p[0], p[1], daftarArah[ai], 'dalam');
          if (muat(poliLubang(h), sisi, [], JARAK_TEPI) && bebas(h)) calonD.push(h);
        });
        if (calonD.length) return a.pilih(calonD);
      }
      return null;
    }
    var nDalam = r.dalam + r.dalamPlus, nAsim = Math.min(r.asim, nDalam);
    var bentukD = a.kocok(a.kocok(TAKSIMETRIS).slice(0, nAsim).concat(a.kocok(SIMETRIS).slice(0, nDalam - nAsim)));
    var h;
    for (i = 0; i < r.tepi; i++) { h = pasangTepi(); if (!h) return null; tambah(h); }
    // potongan tepi tambahan dipasang lebih dulu; bila lubang dalam yang wajib tidak muat lagi, dilepas
    var nWajib = H.length;
    for (i = 0; i < r.tepiPlus; i++) { if (!masih('tepi', r.dalam * bayangan('dalam'))) break; h = pasangTepi(); if (h) tambah(h); }
    // lubang dalam yang wajib: beberapa kali dicoba (letak lubang pertama bisa menghalangi yang berikutnya)
    var ok = false;
    for (var ulang = 0; ulang < 6 && !ok; ulang++) {
      if (ulang === 3 && H.length > nWajib) { H.length = nWajib; lk.length = nWajib; }
      var simpanH = H.length;
      ok = true;
      for (i = 0; i < r.dalam && ok; i++) { h = pasangDalam(bentukD[i]); if (h) tambah(h); else ok = false; }
      if (!ok) { H.length = simpanH; lk.length = simpanH; }
    }
    if (!ok) return null;
    for (i = r.dalam; i < nDalam; i++) { if (!masih('dalam')) break; h = pasangDalam(bentukD[i]); if (h) tambah(h); }
    return jumlah() <= BATAS_LUBANG ? H : null;
  }

  // ------------------------------------------------------------------ pengecoh

  var URUT_PENGECOH = {
    mudah: ['tanpa-cermin', 'sumbu-salah', 'geser', 'putar', 'arah-salah', 'tepi-dua', 'tepi-tetap', 'tambahan'],
    sedang: ['akhir-saja', 'satu-kali', 'sumbu-salah', 'arah-salah', 'tepi-dua', 'geser', 'putar', 'pertama-saja', 'tepi-tetap', 'tambahan', 'urutan', 'tanpa-cermin'],
    sulit: ['akhir-saja', 'satu-kali', 'sumbu-salah', 'arah-salah', 'tepi-dua', 'tepi-tetap', 'lipat-hilang', 'urutan', 'putar', 'pertama-saja', 'geser', 'tambahan']
  };

  function garisSilang(st) {
    var m = [(st.garis[0][0] + st.garis[1][0]) / 2, (st.garis[0][1] + st.garis[1][1]) / 2], L = st.L;
    if (L.b === 0) return { a: 0, b: 1, c: m[1] };
    if (L.a === 0) return { a: 1, b: 0, c: m[0] };
    return L.b === 1 ? { a: 1, b: -1, c: m[0] - m[1] } : { a: 1, b: 1, c: m[0] + m[1] };
  }

  function buatPengecoh(a, level, H0, lip, kunci) {
    var n = lip.length, idx = lip.map(function (x, i) { return i; }), mundur = idx.slice().reverse();
    var adaTepi = H0.some(function (h) { return h.asal !== 'dalam'; });
    var adaArah = H0.some(function (h) { return h.asal === 'dalam' && h.arah; });
    var langkahAcak = [n - 1].concat(a.kocok(idx.slice(0, n - 1)));
    function ke(k) { return 'lipatan ' + (k + 1); }

    var buatJenis = {
      'tanpa-cermin': function () {
        return [{ f: H0, alasan: 'Lubang hanya digambar di tempat kertas dilubangi; saat dibuka, setiap lubang juga muncul pada bagian yang tadinya terlipat sebagai bayangan cerminnya.' }];
      },
      'akhir-saja': function () {
        return n < 2 ? [] : [{ f: bukaSalah(H0, lip, { urutan: [n - 1] }), alasan: 'Hanya lipatan terakhir yang dibuka; lipatan sebelumnya tidak ikut dibuka sehingga jumlah lubangnya kurang.' }];
      },
      'pertama-saja': function () {
        return n < 2 ? [] : [{ f: bukaSalah(H0, lip, { urutan: [0] }), alasan: 'Lubang hanya dicerminkan terhadap garis lipatan pertama; lipatan berikutnya diabaikan sehingga jumlah lubangnya kurang.' }];
      },
      'satu-kali': function () {
        if (n < 2) return [];
        // potongan tepi/pojok dilengkapi lebih dulu (menyatu dengan bayangannya), lalu setiap garis lipat
        // hanya mencerminkan lubang asli itu, tanpa mencerminkan lagi bayangan dari lipatan lain
        var dasar = [];
        for (var i = 0; i < H0.length; i++) {
          var g = [H0[i]];
          for (var k = n - 1; k >= 0 && g; k--) if (diGaris(lip[k].L, g[0])) g = gabungSemua(g.concat([cerminLubang(lip[k].L, g[0])]));
          if (!g) return [];
          dasar.push(g[0]);
        }
        var semua = dasar.slice();
        lip.forEach(function (st) {
          dasar.forEach(function (h) {
            var img = cerminLubang(st.L, h);
            if (!(Math.abs(img.x - h.x) < 1e-6 && Math.abs(img.y - h.y) < 1e-6 && porsi(h.bentuk) === 4)) semua.push(img);
          });
        });
        return [{ f: gabungSemua(semua), alasan: 'Setiap garis lipat hanya mencerminkan lubang asli, padahal bayangan yang muncul saat sebuah lipatan dibuka ikut dicerminkan lagi saat lipatan berikutnya dibuka.' }];
      },
      'lipat-hilang': function () {
        return n < 3 ? [] : [{ f: bukaSalah(H0, lip, { urutan: [2, 0] }), alasan: 'Lipatan 2 terlewat saat membuka, sehingga lubang tidak dicerminkan terhadap garis lipatan itu dan jumlahnya kurang.' }];
      },
      urutan: function () {
        return n < 2 ? [] : [{ f: bukaSalah(H0, lip, { urutan: idx, buang: true }), alasan: 'Lipatan dibuka dengan urutan terbalik (lipatan pertama lebih dulu), sehingga lubang dicerminkan terhadap garis lipat pada keadaan yang salah.' }];
      },
      'sumbu-salah': function () {
        return langkahAcak.map(function (k) {
          var Ls = garisSilang(lip[k]), g = {};
          g[k] = function (h) { return cerminLubang(Ls, h); };
          return { f: bukaSalah(H0, lip, { ganti: g }), alasan: 'Saat membuka ' + ke(k) + ', lubang dicerminkan terhadap ' + namaGaris(Ls) + ', padahal garis lipatnya ' + namaGaris(lip[k].L) + '.' };
        });
      },
      geser: function () {
        return langkahAcak.filter(function (k) { return jenisGaris(lip[k].L) !== 'miring'; }).map(function (k) {
          var gb = Bentuk.beratTitik(lip[k].sesudah), gc = cermin(lip[k].L, gb), t = [gc[0] - gb[0], gc[1] - gb[1]], g = {};
          g[k] = function (h) { return lubang(h.bentuk, h.x + t[0], h.y + t[1], h.arah, h.asal); };
          return { f: bukaSalah(H0, lip, { ganti: g }), alasan: 'Saat membuka ' + ke(k) + ', lubang hanya digeser ke bagian yang tadinya terlipat tanpa dicerminkan, sehingga letak' + (adaArah ? ' dan arah' : '') + ' bayangannya keliru.' };
        });
      },
      putar: function () {
        return langkahAcak.map(function (k) {
          var st = lip[k], c = [(st.garis[0][0] + st.garis[1][0]) / 2, (st.garis[0][1] + st.garis[1][1]) / 2], g = {};
          g[k] = function (h) { return lubang(h.bentuk, 2 * c[0] - h.x, 2 * c[1] - h.y, h.arah ? putarArah(h.arah) : null, h.asal); };
          return { f: bukaSalah(H0, lip, { ganti: g }), alasan: 'Saat membuka ' + ke(k) + ', lubang diputar setengah putaran terhadap titik tengah garis lipat, padahal membuka lipatan berarti mencerminkan lubang terhadap garis lipat.' };
        });
      },
      'arah-salah': function () {
        return !adaArah ? [] : [{ f: bukaSalah(H0, lip, { arahTetap: true }), alasan: 'Letak lubangnya benar, tetapi bentuk yang tidak simetris tidak ikut dicerminkan sehingga arah bayangannya salah (arahnya sama dengan lubang asal).' }];
      },
      'tepi-dua': function () {
        return !adaTepi ? [] : [{ f: bukaSalah(H0, lip, { dua: true }), alasan: 'Lubang yang menempel pada garis lipat dihitung menjadi dua lubang utuh, padahal potongan itu menyatu dengan bayangannya menjadi satu lubang utuh.' }];
      },
      'tepi-tetap': function () {
        return !adaTepi ? [] : [{ f: bukaSalah(H0, lip, { tetap: true }), alasan: 'Lubang yang menempel pada garis lipat dibiarkan terpotong, padahal saat dibuka potongan itu bertemu dengan bayangannya menjadi satu lubang utuh.' }];
      },
      tambahan: function () {
        var dipakai = lip.map(function (st) { return st.L.a + ',' + st.L.b + ',' + st.L.c; });
        return a.kocok([{ a: 1, b: 0, c: N / 2 }, { a: 0, b: 1, c: N / 2 }, { a: 1, b: -1, c: 0 }, { a: 1, b: 1, c: N }]).filter(function (L) { return dipakai.indexOf(L.a + ',' + L.b + ',' + L.c) < 0; }).map(function (L) {
          return { f: gabungSemua(kunci.concat(kunci.map(function (h) { return cerminLubang(L, h); }))), alasan: 'Ada lubang tambahan hasil pencerminan terhadap ' + namaGaris(L) + ' di tengah kertas, padahal kertas tidak pernah dilipat pada garis itu.' };
        });
      }
    };

    var urut = (URUT_PENGECOH[level] || URUT_PENGECOH.sedang).slice();
    // jalur kesalahan yang paling relevan dengan isi soal didahulukan
    function depan(nama) { var i = urut.indexOf(nama); if (i > 0) { urut.splice(i, 1); urut.unshift(nama); } }
    if (adaArah && a.untung(0.8)) depan('arah-salah');
    if (adaTepi) depan(a.untung(0.6) ? 'tepi-dua' : 'tepi-tetap');
    urut = a.kocok(urut.slice(0, 4)).concat(urut.slice(4));

    var hasil = [], lihat = {};
    lihat[sidikFig(kunci)] = 1;
    for (var i = 0; i < urut.length && hasil.length < 4; i++) {
      var varian = buatJenis[urut[i]]();
      for (var v = 0; v < varian.length; v++) {
        var f = varian[v].f;
        if (!f) continue;
        f = kanon(f);
        var sd = sidikFig(f);
        if (lihat[sd] || !sahFig(f, 0.25)) continue;
        lihat[sd] = 1;
        hasil.push({ fig: f, alasan: varian[v].alasan, jenis: urut[i] });
        break;
      }
    }
    return hasil.length === 4 ? hasil : null;
  }

  // ------------------------------------------------------------------ teks

  /** Uraian arah bentuk tak simetris, mis. "ujungnya menunjuk ke kanan". */
  function teksOrientasi(bentuk, arah) {
    if (bentuk === 'segitiga') return 'ujungnya menunjuk ke ' + teksArah(arah);
    if (bentuk === 'bintang') return 'satu ujungnya menghadap ke ' + teksArah(arah);
    if (bentuk === 'siku') { var p = arah.split('/'); return 'tiangnya mengarah ke ' + teksArah(p[0]) + ' dan kakinya ke ' + teksArah(p[1]); }
    return 'lengkungnya menghadap ke ' + teksArah(arah);
  }

  function uraiLubang(h) {
    if (h.asal === 'dalam' && h.arah) return NAMA[h.bentuk] + ' yang ' + teksOrientasi(h.bentuk, h.arah);
    if (h.asal === 'tepi') {
      var miring = !!(ARAH[h.arah][0] && ARAH[h.arah][1]);
      var rupa = { 'setengah-ketupat': miring ? ' (berbentuk persegi panjang miring)' : ' (berbentuk segitiga)', 'setengah-persegi': miring ? ' (berbentuk segitiga siku-siku)' : ' (berbentuk persegi panjang)', 'setengah-silang': ' (berbentuk huruf T)' }[h.bentuk] || '';
      return NAMA[h.bentuk] + rupa + ' yang menempel pada garis lipat';
    }
    if (h.asal === 'pojok') return NAMA[h.bentuk] + (h.bentuk === 'seperempat-ketupat' ? ' (berbentuk segitiga siku-siku)' : h.bentuk === 'seperempat-persegi' ? ' (berbentuk persegi kecil)' : '') + ' di pojok pertemuan dua garis lipat';
    return NAMA[h.bentuk];
  }

  function daftarKalimat(x) { return x.length <= 1 ? (x[0] || '') : x.slice(0, -1).join(', ') + ' dan ' + x[x.length - 1]; }

  function komposisi(daftar) {
    var hit = {}, urut = [];
    daftar.forEach(function (h) { var nm = NAMA[h.bentuk]; if (!hit[nm]) { hit[nm] = 0; urut.push(nm); } hit[nm]++; });
    return daftarKalimat(urut.map(function (nm) { return hit[nm] + ' ' + nm; }));
  }

  function teksLipat(st, i) {
    return 'lipatan ' + (i + 1) + ' dari ' + teksArah(lawan(st.arah)) + ' ke ' + teksArah(st.arah) + ' pada garis lipat ' + jenisGaris(st.L);
  }

  function susunPembahasan(H0, lip, buka, kunci) {
    var n = lip.length, adaTepi = H0.some(function (h) { return h.asal !== 'dalam'; }), adaArah = H0.some(function (h) { return h.asal === 'dalam' && h.arah; });
    var pem = [];
    pem.push('Kertas persegi dilipat ' + (n === 1 ? 'satu kali' : n + ' kali berurutan') + ': ' + lip.map(teksLipat).join('; ') + '. Kertas yang sudah terlipat lalu dilubangi: ' + daftarKalimat(H0.map(uraiLubang)) + '.');
    var aturan = 'Lubang menembus semua lapisan kertas, jadi membuka sebuah lipatan sama dengan mencerminkan setiap lubang terhadap garis lipat itu: lubang muncul lagi di sisi seberang garis dengan jarak yang sama ke garis.';
    if (adaArah) aturan += ' Bentuk yang tidak simetris ikut terbalik arahnya, seperti bayangan di cermin.';
    if (adaTepi) aturan += ' Lubang yang menempel pada garis lipat bertemu dengan bayangannya sendiri sehingga menyatu menjadi satu lubang utuh.';
    if (n > 1) aturan += ' Lipatan dibuka mulai dari lipatan yang terakhir.';
    pem.push(aturan);
    buka.tahap.forEach(function (t, j) {
      var st = lip[t.k], bagian = [];
      if (t.pasangan.length) bagian.push(t.pasangan.length + ' lubang dicerminkan ke bagian ' + teksArah(lawan(st.arah)) + ' kertas');
      var gab = {}, gabUrut = [];
      t.gabung.forEach(function (g) {
        var s = NAMA[g.asal.bentuk] + ' yang menempel pada garis lipat menyatu dengan bayangannya menjadi ' + (porsi(g.jadi.bentuk) === 4 ? NAMA[g.jadi.bentuk] + ' utuh' : NAMA[g.jadi.bentuk]);
        if (!gab[s]) { gab[s] = 1; gabUrut.push(s); }
      });
      bagian = bagian.concat(gabUrut);
      var arah = {}, arahUrut = [];
      t.pasangan.forEach(function (p) {
        if (p.asal.asal !== 'dalam' || !p.asal.arah || p.asal.arah === p.bayangan.arah) return;
        var s = NAMA[p.asal.bentuk] + ' yang ' + teksOrientasi(p.asal.bentuk, p.asal.arah) + ' menjadi ' + teksOrientasi(p.bayangan.bentuk, p.bayangan.arah);
        if (!arah[s]) { arah[s] = 1; arahUrut.push(s); }
      });
      if (arahUrut.length > 2) bagian.push('arah bentuk yang tidak simetris ikut terbalik terhadap garis lipat, misalnya ' + arahUrut.slice(0, 2).join('; '));
      else if (arahUrut.length) bagian.push('arah bentuknya terbalik: ' + arahUrut.join('; '));
      pem.push('Langkah ' + (j + 1) + ', membuka lipatan ' + (t.k + 1) + ' (garis lipat ' + jenisGaris(st.L) + '): ' + daftarKalimat(bagian) + '. Sekarang ada ' + t.hasil.length + ' lubang (Gambar ' + (j + 1) + ').');
    });
    pem.push('Jadi, setelah kertas dibuka kembali terdapat ' + kunci.length + ' lubang, yaitu ' + komposisi(kunci) + ', yang letaknya simetris terhadap setiap garis lipat. Gambar ' + n + ' (berlatar hijau) memperlihatkan kertas yang sudah terbuka penuh.');
    return pem;
  }

  // ------------------------------------------------------------------ butir

  function buat(id, level, benih, opsi) {
    opsi = opsi || {};
    var a = Rng.alat(benih);
    var target = opsi.target == null ? a.bulat(0, 4) : opsi.target;
    var mek = pilihMekanisme(a, level, opsi.polaDipakai);
    for (var coba = 0; coba < 40; coba++) {
      if (coba === 25) mek = a.pilih(MEKANISME[level] || MEKANISME.sedang);
      var lip = susunLipatan(a, mek);
      if (!lip) continue;
      var H0 = tempatkan(a, mek, lip);
      if (!H0) continue;
      var buka = bukaBenar(H0, lip);
      if (!buka) continue;
      // kunci: potongan tepi sudah utuh semua, tidak bertumpuk, di dalam kertas
      if (buka.akhir.some(function (h) { return h.asal !== 'dalam' && porsi(h.bentuk) !== 4; })) continue;
      var kunci = kanon(buka.akhir);
      if (!sahFig(kunci, 0.4)) continue;
      var peng = buatPengecoh(a, level, H0, lip, kunci);
      if (!peng) continue;

      var modelSoal = {
        ukuran: N,
        lipatan: lip.map(function (st) { return { garis: st.garis, dari: st.dari, ke: st.ke }; }),
        lubang: kanon(H0)
      };
      var daftar = a.kocok(peng.map(function (p) { return { fig: p.fig, alasan: p.alasan, kunci: false }; }));
      daftar.splice(target, 0, { fig: kunci, alasan: null, kunci: true });
      var opsiGambar = daftar.map(function (d, i) {
        return { teks: 'Gambar opsi ' + Fmt.huruf(i), nilai: i, alasan: d.alasan, kunci: d.kunci,
          gambar: { id: 'opsi-' + Fmt.huruf(i).toLowerCase(), jenis: 'lipat-lubang-opsi', model: { fig: d.fig, ukuran: N }, judul: 'Opsi ' + Fmt.huruf(i) } };
      });
      var ctx = { subtes: 'ku', submateri: 'figural', keluarga: id, level: level, benih: benih, a: a };
      var butir = Butir.rakitPg(ctx, {
        jenisSoal: JENIS_SOAL, judul: JENIS_SOAL, teks: [], perintah: PERINTAH, pertanyaan: PERTANYAAN,
        gambar: [{ id: 'soal', jenis: 'lipat-lubang-soal', model: modelSoal, judul: 'Kertas dilipat lalu dilubangi' }],
        pilihanJadi: { opsi: opsiGambar, kunciIndex: target }, tulisKunci: false,
        langkah: [], pembahasan: susunPembahasan(H0, lip, buka, kunci),
        model: {
          topik: 'Figural', tipe: ID, ukuran: N, lipatan: modelSoal.lipatan, lubang: modelSoal.lubang, mekanisme: mek,
          pilihan: daftar.map(function (d) { return d.fig; }), kunciIndex: target
        },
        sidik: {
          inti: ID + '|' + lip.map(function (st) { return st.L.a + ',' + st.L.b + ',' + st.L.c + ':' + st.s; }).join(';') + '|' + sidikFig(modelSoal.lubang),
          param: [], entitas: mek
        }
      });
      if (!butir) continue;
      butir.gambarPembahasan = buka.tahap.map(function (t, j) {
        var st = lip[t.k], akhir = j === buka.tahap.length - 1;
        var m = {
          ukuran: N, lipatKe: t.k + 1, akhir: akhir,
          sebelum: { bentuk: st.sesudah, lubang: kanon(t.lama) },
          sesudah: {
            bentuk: st.sebelum, sayap: st.gerak, garis: st.garis, lama: kanon(t.lama), baru: kanon(t.baru),
            pasangan: t.pasangan.map(function (p) { return [p.asal.x, p.asal.y, p.bayangan.x, p.bayangan.y]; })
          }
        };
        if (akhir) m.jawaban = kunci;
        return {
          id: 'bahas-' + (j + 1), jenis: 'lipat-lubang-bahas', model: m,
          judul: 'Gambar ' + (j + 1) + '. Membuka lipatan ' + (t.k + 1) + (akhir ? ': kertas terbuka penuh (jawaban)' : '')
        };
      });
      butir.pola = ID + ':' + mek;
      butir.kategoriRiset = 'pengayaan';
      butir.catatanRiset = 'Bentuk lipat dan lubangi kertas dari bab Macam-macam Transformasi Figural di Kerangka Course (lipatan = pencerminan berulang); tidak ada pada contoh riset BAB V.';
      return butir;
    }
    return null;
  }

  // ------------------------------------------------------------------ gambar

  function teksB(s, x, y, o) {
    o = o || {};
    return S.teks(s, x, y, { ukuran: o.ukuran || 11, tebal: o.tebal, isi: o.isi || BH.teks, rata: o.rata });
  }

  function jarakRuas(p, a, b) {
    var dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy, t = L2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2)) : 0;
    return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
  }

  function peta(ox, oy, k) { return function (p) { return [ox + p[0] * k, oy + p[1] * k]; }; }

  function svgLubang(h, f, k, warna) {
    if (h.bentuk === 'bulat') { var c = f([h.x, h.y]); return S.lingkaran(c[0], c[1], 0.9 * SK * k, { isi: warna }); }
    return S.poli(poliLubang(h).map(f), { tutup: true, isi: warna, garis: warna, tebal: 0.8, sambung: 'round' });
  }

  /** Panah lengkung dari p0 ke p1 (piksel) yang menonjol ke atas (atau ke kiri). */
  /**
   * Panah lengkung dari p0 ke p1 (piksel). Tonjolannya ke sisi o.sisi (+1/-1 terhadap normal kiri ruas),
   * atau bila tidak diberikan ke atas (atau ke kiri); tinggi tonjolan o.tonjol x panjang ruas.
   */
  function panahLengkung(p0, p1, o) {
    var dx = p1[0] - p0[0], dy = p1[1] - p0[1], Lc = Math.hypot(dx, dy);
    if (Lc < 6) return '';
    var w = [-dy / Lc, dx / Lc];
    if (o.sisi) w = [w[0] * o.sisi, w[1] * o.sisi];
    else if (w[1] > 1e-9 || (Math.abs(w[1]) <= 1e-9 && w[0] > 0)) w = [-w[0], -w[1]];
    var h = (o.tonjol || 0.3) * Lc, R = (Lc * Lc / 4 + h * h) / (2 * h), mx = (p0[0] + p1[0]) / 2, my = (p0[1] + p1[1]) / 2;
    var cx = mx - w[0] * (R - h), cy = my - w[1] * (R - h);
    function sud(p) { return Math.atan2(p[0] - cx, -(p[1] - cy)) * 180 / Math.PI; }
    var a0 = sud(p0), a1 = sud(p1);
    while (a1 - a0 > 180) a1 -= 360;
    while (a1 - a0 < -180) a1 += 360;
    return S.busurPanah(cx, cy, R, a0, a1, { warna: o.warna, tebal: o.tebal, kepala: o.kepala, halo: true });
  }

  function hantu(f, k) { var p = f([0, 0]); return S.rect(p[0], p[1], N * k, N * k, { isi: 'none', garis: HANTU, tebal: 1.2, putus: '4 3' }); }

  /**
   * Gambar soal: deret panel lipatan lalu kertas terlipat yang dilubangi. Panel terakhir digambar
   * sedikit lebih besar supaya lubang pada bagian terlipat yang kecil tetap jelas; garis putus-putus
   * abu-abu muda menandai letak kertas utuh.
   */
  function svgSoal(m) {
    var n = m.lipatan.length, Pf = [150, 130, 108][n - 1], Pa = [170, 160, 150][n - 1], sela = [30, 28, 24][n - 1], pad = 8;
    var b = langkahDariModel(m), o = [], ox = pad, dasar = pad + Pa + 18;
    var W = pad * 2 + n * Pf + Pa + n * sela, H = pad + Pa + 26;
    for (var i = 0; i <= n; i++) {
      var P = i < n ? Pf : Pa, k = P / m.ukuran, oy = pad + (Pa - P) / 2, f = peta(ox, oy, k);
      if (i > 0) o.push(hantu(f, k));
      if (i < n) {
        var st = b.langkah[i];
        o.push(S.poli(st.sebelum.map(f), { tutup: true, isi: '#ffffff' }));
        o.push(S.poli(st.gerak.map(f), { tutup: true, isi: ABU }));
        o.push(S.poli(st.sebelum.map(f), { tutup: true, isi: 'none', garis: TINTA, tebal: 1.8, sambung: 'round' }));
        var g0 = f(st.garis[0]), g1 = f(st.garis[1]);
        o.push(S.garis(g0[0], g0[1], g1[0], g1[1], { garis: TEPI, tebal: 1.8, putus: '6 4' }));
        o.push(panahLengkung(f(st.dari), f(st.ke), { warna: TINTA, tebal: 2, kepala: 9 }));
        o.push(teksB('Lipatan ' + (i + 1), ox + P / 2, dasar, { ukuran: 11, rata: 'middle', isi: BH.teksRedup }));
        o.push(S.panah(ox + P + 5, pad + Pa / 2, ox + P + sela - 5, pad + Pa / 2, { warna: BH.redup, tebal: 1.6, kepala: 7 }));
      } else {
        o.push(S.poli(b.akhir.map(f), { tutup: true, isi: '#ffffff' }));
        m.lubang.forEach(function (h) { o.push(svgLubang(h, f, k, TINTA)); });
        o.push(S.poli(b.akhir.map(f), { tutup: true, isi: 'none', garis: TINTA, tebal: 1.8, sambung: 'round' }));
        o.push(teksB('Dilubangi', ox + P / 2, dasar, { ukuran: 11, rata: 'middle', isi: BH.teksRedup }));
      }
      ox += P + sela;
    }
    return { svg: S.doc(o.join(''), W, H, { latar: '#ffffff' }), lebar: W, tinggi: H };
  }

  /** Pilihan jawaban: kertas terbuka dengan pola lubangnya. */
  function svgOpsi(m) {
    var pad = 6, P = 150, k = P / (m.ukuran || N), W = P + pad * 2, f = peta(pad, pad, k), o = [];
    o.push(S.rect(pad, pad, P, P, { isi: '#ffffff' }));
    m.fig.forEach(function (h) { o.push(svgLubang(h, f, k, TINTA)); });
    o.push(S.rect(pad, pad, P, P, { isi: 'none', garis: TEPI, tebal: 2 }));
    return { svg: S.doc(o.join(''), W, W, { latar: '#ffffff' }), lebar: W, tinggi: W };
  }

  /**
   * Gambar pembahasan satu tahap membuka lipatan: kiri kertas sebelum dibuka, kanan sesudah dibuka
   * (garis lipat putus-putus biru, bagian yang terbuka jingga muda, lubang baru jingga dengan panah
   * pasangan dari lubang asalnya). Tahap terakhir: kertas terbuka penuh berlatar hijau muda.
   */
  function svgBahas(m, judul) {
    var pad = 8, P = 150, sela = 78, k = P / m.ukuran, y0 = pad + 26 + 18, o = [];
    var W = Math.max(pad * 2 + 2 * P + sela, Math.ceil(Metrik.lebar(judul, 13, true)) + 18), H = y0 + P + pad + 4;
    o.push(teksB(judul, pad, pad + 13, { ukuran: 13, tebal: true }));
    var x1 = pad, x2 = pad + P + sela, f1 = peta(x1, y0, k), f2 = peta(x2, y0, k);
    // sebelum dibuka
    o.push(teksB('sebelum dibuka', x1 + P / 2, y0 - 7, { ukuran: 11, rata: 'middle', isi: BH.teksRedup }));
    o.push(hantu(f1, k));
    o.push(S.poli(m.sebelum.bentuk.map(f1), { tutup: true, isi: '#ffffff' }));
    m.sebelum.lubang.forEach(function (h) { o.push(svgLubang(h, f1, k, TINTA)); });
    o.push(S.poli(m.sebelum.bentuk.map(f1), { tutup: true, isi: 'none', garis: TINTA, tebal: 1.8, sambung: 'round' }));
    // panah "buka"
    o.push(teksB('buka lipatan ' + m.lipatKe, x1 + P + sela / 2, y0 + P / 2 - 10, { ukuran: 10, rata: 'middle', isi: BH.panah }));
    o.push(S.panah(x1 + P + 8, y0 + P / 2, x2 - 8, y0 + P / 2, { warna: BH.panah, tebal: 2.2, kepala: 9 }));
    // sesudah dibuka
    var s = m.sesudah;
    o.push(teksB(m.akhir ? 'kertas terbuka (jawaban)' : 'sesudah dibuka', x2 + P / 2, y0 - 7, { ukuran: 11, tebal: m.akhir, rata: 'middle', isi: m.akhir ? BH.jawab : BH.teksRedup }));
    if (!m.akhir) o.push(hantu(f2, k));
    o.push(S.poli(s.bentuk.map(f2), { tutup: true, isi: m.akhir ? BH.latarJawab : '#ffffff' }));
    if (!m.akhir) o.push(S.poli(s.sayap.map(f2), { tutup: true, isi: BH.latarSorot }));
    var g0 = f2(s.garis[0]), g1 = f2(s.garis[1]);
    o.push(S.garis(g0[0], g0[1], g1[0], g1[1], { garis: BH.panah, tebal: 1.8, putus: '6 4' }));
    s.lama.forEach(function (h) { o.push(svgLubang(h, f2, k, TINTA)); });
    s.baru.forEach(function (h) { o.push(svgLubang(h, f2, k, BH.sorot)); });
    o.push(S.poli(s.bentuk.map(f2), { tutup: true, isi: 'none', garis: m.akhir ? BH.jawab : TINTA, tebal: m.akhir ? 2.6 : 1.8, sambung: 'round' }));
    // panah pasangan (lubang asal -> bayangannya): lurus bila tidak melintasi lubang lain, bila
    // terhalang melengkung ke samping; yang tetap terhalang tidak digambar (sedikitnya satu panah)
    var pusat = s.lama.concat(s.baru), panah = [], cadang = null;
    s.pasangan.forEach(function (p) {
      var dx = p[2] - p[0], dy = p[3] - p[1], L = Math.hypot(dx, dy), u = 1.25 * SK;
      if (L - 2 * u < 0.5) return;
      var q0 = [p[0] + dx / L * u, p[1] + dy / L * u], q1 = [p[2] - dx / L * u, p[3] - dy / L * u];
      function terhalang(titik) {
        return titik.some(function (t) { return t[0] < 0 || t[0] > N || t[1] < 0 || t[1] > N; }) || pusat.some(function (h) {
          if (Math.hypot(h.x - p[0], h.y - p[1]) < 1e-6 || Math.hypot(h.x - p[2], h.y - p[3]) < 1e-6) return false;
          for (var i = 0; i + 1 < titik.length; i++) if (jarakRuas([h.x, h.y], titik[i], titik[i + 1]) < 1.15 * SK) return true;
          return false;
        });
      }
      if (!terhalang([q0, q1])) { panah.push({ q0: q0, q1: q1 }); return; }
      if (!cadang || L < cadang.L) cadang = { q0: q0, q1: q1, L: L };
      var Lq = Math.hypot(q1[0] - q0[0], q1[1] - q0[1]), w = [-(q1[1] - q0[1]) / Lq, (q1[0] - q0[0]) / Lq];
      for (var sisi = 1; sisi >= -1; sisi -= 2) {
        var titik = [];
        for (var j = 0; j <= 12; j++) {
          var t = j / 12, tinggi = 0.28 * Lq * 4 * t * (1 - t) * sisi;
          titik.push([q0[0] + (q1[0] - q0[0]) * t + w[0] * tinggi, q0[1] + (q1[1] - q0[1]) * t + w[1] * tinggi]);
        }
        if (!terhalang(titik)) { panah.push({ q0: q0, q1: q1, sisi: sisi }); return; }
      }
    });
    if (!panah.length && cadang) panah.push(cadang);
    panah.forEach(function (r) {
      var a0 = f2(r.q0), a1 = f2(r.q1);
      if (r.sisi) o.push(panahLengkung(a0, a1, { warna: BH.panah, tebal: 1.6, kepala: 7, sisi: r.sisi, tonjol: 0.28 }));
      else o.push(S.panah(a0[0], a0[1], a1[0], a1[1], { warna: BH.panah, tebal: 1.6, kepala: 7, halo: true }));
    });
    return { svg: S.doc(o.join(''), W, H, { latar: '#ffffff' }), lebar: W, tinggi: H };
  }

  var KELUARGA = [{ id: ID, nama: 'Lipat dan lubangi kertas (lipatan = pencerminan berulang)', submateri: 'figural', kolam: 'serial' }];

  return {
    KELUARGA: KELUARGA, PERINTAH: PERINTAH, buat: buat,
    GAMBAR: { 'lipat-lubang-soal': svgSoal, 'lipat-lubang-opsi': svgOpsi, 'lipat-lubang-bahas': svgBahas }
  };
});
