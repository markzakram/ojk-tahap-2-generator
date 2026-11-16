/*
 * transformasi-corak.js — Kemampuan Umum > Figural > Macam-macam Transformasi Figural: bangun bercorak
 * diputar, dicerminkan, dan gambar yang berbeda sendiri (pengayaan, gaya matriks 2x2 bersekat).
 *
 * BANGUN BERCORAK (data model, juga isi `fig` gambar opsi):
 *   { bentuk, n, awal, corak:[kode per bagian], cincin, penanda }
 *   bentuk   lingkaran | persegi | belah-ketupat | segienam | segidelapan (selalu tegak, tidak diputar)
 *   n, awal  bangun dibagi n bagian oleh sinar dari pusat; bagian ke-k mencakup sudut awal + k*360/n sampai
 *            awal + (k+1)*360/n (0 = atas, searah jarum jam; lihat Corak.bagi)
 *   corak    kode corak (corak.js) tiap bagian
 *   cincin   null, atau lingkaran kecil di tengah { n: 1|4, awal, corak:[...] } (terbagi 1 atau 4)
 *   penanda  null, atau indeks bagian yang memuat titik penanda kecil
 *
 * Setiap transformasi adalah unsur grup dihedral e = { r, c }: r = 0 memutar sudut bagian phi menjadi
 * phi + c (searah jarum jam), r = 1 mencerminkan phi menjadi c - phi (cermin bersudut alpha: c = 180 - 2*alpha).
 * Transformasi hanya dipakai bila memetakan garis tepi bangun dan garis bagi ke dirinya sendiri, sehingga
 * kelima opsi selalu berbentuk dan berpembagian sama; yang berbeda hanya letak dan arah coraknya. Corak
 * berarah (garis arsir, kotak-kotak) ikut berputar atau tercermin (Corak.putarKode, Corak.cerminKode).
 * Bangun yang simetris terhadap salah satu unsur grup bingkainya ditolak (jawaban bisa ganda).
 *
 *   corak-putar (kolam serial) — bangun + busur panah dan sudut; "hasil diputar 90° searah jarum jam?"
 *     mudah  90° searah atau 180°, corak yang rupanya tidak berubah (letak corak yang diuji)
 *     sedang 90° berlawanan arah, 270°, 90° dengan corak bergaris, atau 45°/135° pada bangun 8 bagian
 *     sulit  dua langkah: putar lalu cermin, cermin lalu putar, atau dua putaran; corak berarah
 *     pengecoh: arah terbalik, sudut salah, letak benar tetapi arah garis tidak ikut berputar, bayangan
 *     cermin, dua corak bertukar, tidak berubah, hanya langkah pertama, urutan langkah terbalik
 *   corak-cermin (kolam serial) — bangun + garis cermin putus-putus
 *     mudah  garis tegak/datar, corak yang tidak berubah rupa bila dicerminkan
 *     sedang garis miring (persegi, belah ketupat, cakram, segi delapan) atau tegak/datar dengan garis
 *            miring; corak berarah ikut tercermin
 *     sulit  dua garis cermin bernomor berurutan (saling tegak lurus atau membentuk 45°)
 *     pengecoh: hasil putar, sumbu lain, letak tercermin tetapi arah garis tidak, tidak berubah, hanya
 *     cermin pertama/kedua, urutan terbalik, dua corak bertukar
 *   corak-beda (kolam serial) — tanpa gambar soal; empat dari lima opsi bangun yang sama yang hanya diputar
 *     mudah  satu corak diganti atau dua corak bertukar, putaran kelipatan 90°
 *     sedang bayangan cermin (corak tak berarah, atau dengan garis arsir yang ikut berputar)
 *     sulit  bayangan cermin atau arah arsir tidak ikut berputar, bangun 8 bagian, putaran kelipatan 45°
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./rng.js'), require('./svg.js'), require('./bentuk.js'), require('./butir.js'), require('./format.js'), require('./metrik.js'), require('./corak.js'));
    module.exports = api;
  } else {
    api = factory(root.Rng, root.Svg, root.Bentuk, root.Butir, root.Fmt, root.Metrik, root.Corak);
    root.TransformasiCorak = api;
  }
})(typeof self !== 'undefined' ? self : this, function (Rng, S, Bentuk, Butir, Fmt, Metrik, Corak) {
  'use strict';

  var TINTA = '#1d1d1d', TEPI = '#4a5266', BINGKAI_PANEL = '#c9d0de', BH = S.BAHAS;
  var WARNA_ACUAN = [BH.sorot, BH.panah];
  var TAK = ['hitam', 'putih', 'titik', 'bintang', 'bulatan'];
  var KOTAK = ['kotak', 'kotak-miring'];
  var ARSIR = ['arsir-0', 'arsir-45', 'arsir-90', 'arsir-135'];

  var PERINTAH_PUTAR = 'Perhatikan gambar berikut. Seluruh gambar, termasuk corak di dalamnya, diputar terhadap titik pusatnya menurut arah dan besar sudut yang disebutkan. Pilihlah gambar hasilnya.';
  var PERINTAH_PUTAR_CERMIN = 'Perhatikan gambar berikut. Seluruh gambar, termasuk corak di dalamnya, diputar terhadap titik pusatnya dan dicerminkan terhadap garis putus-putus sesuai urutan langkah pada pertanyaan. Pilihlah gambar hasil akhirnya.';
  var PERINTAH_CERMIN = 'Perhatikan gambar berikut. Garis putus-putus adalah garis cermin. Seluruh gambar, termasuk corak di dalamnya, dicerminkan terhadap garis itu. Pilihlah gambar hasilnya.';
  var PERINTAH_BEDA = 'Perhatikan kelima gambar pilihan berikut. Empat gambar adalah bangun bercorak yang sama yang hanya diputar dengan sudut berbeda-beda, sedangkan satu gambar berbeda.';

  var CATATAN = {
    'corak-putar': 'Bangun bercorak bergaya matriks bersekat contoh riset soal 4, diterapkan pada rotasi dari bab Macam-macam Transformasi Figural; bentuk ini tidak ada pada contoh riset BAB V.',
    'corak-cermin': 'Bangun bercorak bergaya matriks bersekat contoh riset soal 4, diterapkan pada pencerminan dari bab Macam-macam Transformasi Figural; bentuk ini tidak ada pada contoh riset BAB V.',
    'corak-beda': 'Bangun bercorak bergaya matriks bersekat contoh riset soal 4, diterapkan pada soal gambar yang berbeda sendiri (rotasi dan pencerminan); bentuk ini tidak ada pada contoh riset BAB V.'
  };

  function mod(a, n) { return ((a % n) + n) % n; }
  function bulat(x) { return Math.abs(x - Math.round(x)) < 1e-7; }
  function sj(x) { return JSON.stringify(x); }

  // ------------------------------------------------------------------ bangun

  // s: pengali "jari" Corak.bentuk; dalam/luar: jari-jari lingkaran dalam/luar bangun (kali R)
  var UKUR = {
    lingkaran: { s: 1 / 0.86, dalam: 1, luar: 1 },
    persegi: { s: 0.87 / 0.8, dalam: 0.87, luar: 0.87 * Math.SQRT2 },
    'belah-ketupat': { s: 1.12, dalam: 1.12 * Math.SQRT1_2, luar: 1.12 },
    segienam: { s: 1.05 / 0.96, dalam: 1.05 * Math.cos(Math.PI / 6), luar: 1.05 },
    segidelapan: { s: 1.04 / 0.92, dalam: 1.04 * Math.cos(Math.PI / 8), luar: 1.04 }
  };
  // sudut putar terkecil yang memetakan garis tepi ke dirinya (lingkaran digambar sebagai segi-72)
  var SIMETRI = { lingkaran: 5, persegi: 90, 'belah-ketupat': 90, segienam: 60, segidelapan: 45 };
  var NAMA_BENTUK = { lingkaran: 'lingkaran', persegi: 'persegi', 'belah-ketupat': 'belah ketupat', segienam: 'segi enam', segidelapan: 'segi delapan' };

  var BINGKAI = [
    { bentuk: 'lingkaran', n: 4, awal: 0 }, { bentuk: 'lingkaran', n: 4, awal: 45 },
    { bentuk: 'lingkaran', n: 6, awal: 0 }, { bentuk: 'lingkaran', n: 6, awal: 30 },
    { bentuk: 'lingkaran', n: 8, awal: 0 }, { bentuk: 'lingkaran', n: 8, awal: 22.5 },
    { bentuk: 'persegi', n: 4, awal: 0 }, { bentuk: 'persegi', n: 4, awal: 45 }, { bentuk: 'persegi', n: 8, awal: 0 },
    { bentuk: 'belah-ketupat', n: 4, awal: 0 }, { bentuk: 'belah-ketupat', n: 4, awal: 45 }, { bentuk: 'belah-ketupat', n: 8, awal: 0 },
    { bentuk: 'segienam', n: 6, awal: 0 }, { bentuk: 'segienam', n: 6, awal: 30 },
    { bentuk: 'segidelapan', n: 4, awal: 0 }, { bentuk: 'segidelapan', n: 4, awal: 45 },
    { bentuk: 'segidelapan', n: 8, awal: 0 }, { bentuk: 'segidelapan', n: 8, awal: 22.5 }
  ];

  function fig(bentuk, n, awal, corak, cincin, penanda) {
    return { bentuk: bentuk, n: n, awal: awal, corak: corak, cincin: cincin || null, penanda: penanda == null ? null : penanda };
  }
  function sidikFig(f) { return sj(f); }

  // ------------------------------------------------------------- transformasi

  function el(r, c) { return { r: r, c: mod(c, 360) }; }
  function elPutar(sudut, arah) { return el(0, arah === 'berlawanan' ? -sudut : sudut); }
  function elCermin(sumbu) { return el(1, 180 - 2 * sumbu); }
  /** e1 lalu e2. */
  function gabung(e1, e2) { return e2.r ? el(1 - e1.r, e2.c - e1.c) : el(e1.r, e1.c + e2.c); }
  function elLangkah(l) { return l.jenis === 'putar' ? elPutar(l.sudut, l.arah) : elCermin(l.sumbu); }
  function elUrutan(ls) { return ls.reduce(function (e, l) { return gabung(e, elLangkah(l)); }, el(0, 0)); }
  function identitas(e) { return !e.r && mod(Math.round(e.c), 360) === 0; }

  /** Indeks bagian tujuan bagian k (pembagian n, sudut awal) oleh unsur e, atau -1 bila garis bagi tidak tetap. */
  function indeksT(n, awal, k, e) {
    if (n === 1) return 0;
    var w = 360 / n, j = e.r ? (e.c - 2 * awal) / w - (k + 1) : e.c / w + k;
    return bulat(j) ? mod(Math.round(j), n) : -1;
  }

  /** Kode corak setelah bagiannya dikenai unsur e; null bila arahnya tidak ada dalam daftar corak. */
  function kodeT(kode, e) {
    if (!Corak.berarah(kode)) return kode;
    if (!bulat(e.c / 45)) return null;
    return Corak.putarKode(e.r ? Corak.cerminKode(kode, 90) : kode, Math.round(e.c));
  }

  /** Bangun hasil unsur e (ikut === false: letak bagian berpindah, tetapi kode corak tidak ikut berubah). */
  function terapkan(f, e, ikut) {
    if (!f || !bulat(e.c / SIMETRI[f.bentuk])) return null;
    var corak = [], k, j, kk;
    for (k = 0; k < f.n; k++) {
      j = indeksT(f.n, f.awal, k, e);
      kk = ikut === false ? f.corak[k] : kodeT(f.corak[k], e);
      if (j < 0 || kk == null) return null;
      corak[j] = kk;
    }
    var cin = null;
    if (f.cincin) {
      var cc = [];
      for (k = 0; k < f.cincin.n; k++) {
        j = indeksT(f.cincin.n, f.cincin.awal, k, e);
        kk = ikut === false ? f.cincin.corak[k] : kodeT(f.cincin.corak[k], e);
        if (j < 0 || kk == null) return null;
        cc[j] = kk;
      }
      cin = { n: f.cincin.n, awal: f.cincin.awal, corak: cc };
    }
    return fig(f.bentuk, f.n, f.awal, corak, cin, f.penanda == null ? null : indeksT(f.n, f.awal, f.penanda, e));
  }

  function jalankan(f, langkah, ikut) {
    var g = f;
    for (var i = 0; i < langkah.length && g; i++) g = terapkan(g, elLangkah(langkah[i]), ikut);
    return g;
  }

  function bingkaiTetap(f, e) {
    if (!bulat(e.c / SIMETRI[f.bentuk]) || indeksT(f.n, f.awal, 0, e) < 0) return false;
    return !f.cincin || indeksT(f.cincin.n, f.cincin.awal, 0, e) >= 0;
  }

  /** Semua unsur (putar dan cermin, kelipatan 7,5°) yang memetakan bingkai bangun ke dirinya. */
  function grup(f) {
    var out = [];
    for (var r = 0; r < 2; r++) for (var c = 0; c < 360; c += 7.5) { var e = el(r, c); if (bingkaiTetap(f, e)) out.push(e); }
    return out;
  }

  /** Bangun tidak kembali ke dirinya oleh unsur grup bingkainya mana pun selain identitas. */
  function asimetris(f) {
    return grup(f).every(function (e) {
      if (!e.r && e.c === 0) return true;
      var g = terapkan(f, e);
      return !g || sidikFig(g) !== sidikFig(f);
    });
  }

  /** Putaran (c, searah jarum jam) yang sah untuk bangun ini: bingkai tetap dan semua kodenya terpetakan. */
  function putaranSah(f) {
    return grup(f).filter(function (e) { return !e.r && terapkan(f, e); }).map(function (e) { return e.c; });
  }

  function banyakBerubah(f, e) {
    var n = 0, k;
    for (k = 0; k < f.n; k++) if (kodeT(f.corak[k], e) !== f.corak[k]) n++;
    if (f.cincin) for (k = 0; k < f.cincin.n; k++) if (kodeT(f.cincin.corak[k], e) !== f.cincin.corak[k]) n++;
    return n;
  }

  // -------------------------------------------------------------- kata-kata

  var ARAH8 = ['atas', 'kanan atas', 'kanan', 'kanan bawah', 'bawah', 'kiri bawah', 'kiri', 'kiri atas'];
  var ARAH16 = ['atas sebelah kanan', 'kanan sebelah atas', 'kanan sebelah bawah', 'bawah sebelah kanan', 'bawah sebelah kiri', 'kiri sebelah bawah', 'kiri sebelah atas', 'atas sebelah kiri'];
  var PENDEK = {
    hitam: 'hitam', putih: 'putih', titik: 'bertitik', bintang: 'berbintang', bulatan: 'berbulatan', kotak: 'kotak-kotak',
    'kotak-miring': 'kotak miring', 'arsir-0': 'garis datar', 'arsir-45': 'garis miring /', 'arsir-90': 'garis tegak', 'arsir-135': 'garis miring \\'
  };
  var SEDANG = {
    hitam: 'hitam', putih: 'putih', titik: 'bertitik', bintang: 'berbintang', bulatan: 'berbulatan', kotak: 'kotak-kotak',
    'kotak-miring': 'kotak-kotak miring', 'arsir-0': 'garis mendatar', 'arsir-45': 'garis miring naik', 'arsir-90': 'garis tegak', 'arsir-135': 'garis miring turun'
  };
  var NAMA_SUMBU = { 0: 'datar', 90: 'tegak', 45: 'miring dari kiri bawah ke kanan atas', 135: 'miring dari kiri atas ke kanan bawah' };
  var SUMBU_PENDEK = { 0: 'garis datar', 90: 'garis tegak', 45: 'garis miring /', 135: 'garis miring \\' };

  function letak(n, awal, k) {
    var mid = mod(awal + (k + 0.5) * 360 / n, 360);
    if (bulat((mid - 22.5) / 45)) return ARAH16[mod(Math.round((mid - 22.5) / 45), 8)];
    return ARAH8[mod(Math.round(mid / 45), 8)];
  }
  function letakCincin(c, k) { return c.n === 1 ? 'lingkaran kecil di tengah' : 'seperempat lingkaran tengah di ' + letak(c.n, c.awal, k); }
  function namaArah(arah) { return arah === 'berlawanan' ? 'berlawanan arah jarum jam' : 'searah jarum jam'; }
  function lawan(arah) { return arah === 'berlawanan' ? 'searah' : 'berlawanan'; }
  function teksPutar(sudut, arah) { return sudut === 180 ? '180°' : sudut + '° ' + namaArah(arah); }
  function teksLangkah(l) { return l.jenis === 'putar' ? 'diputar ' + teksPutar(l.sudut, l.arah) : 'dicerminkan terhadap garis ' + NAMA_SUMBU[l.sumbu]; }
  function teksLangkahPendek(l) { return l.jenis === 'putar' ? 'putaran ' + teksPutar(l.sudut, l.arah) : 'pencerminan terhadap garis ' + NAMA_SUMBU[l.sumbu]; }
  /** Putaran c (searah jarum jam, 0..360) dalam kata, dengan sudut terkecil. */
  function teksSudutC(c) {
    c = mod(c, 360);
    if (c === 0) return 'tidak diputar';
    if (c === 180) return 'diputar 180°';
    return c < 180 ? 'diputar ' + c + '° searah jarum jam' : 'diputar ' + (360 - c) + '° berlawanan arah jarum jam';
  }
  function gabungKata(d) { return d.length <= 1 ? (d[0] || '') : d.slice(0, -1).join(', ') + ' dan ' + d[d.length - 1]; }

  function uraiBangun(f) {
    var s = NAMA_BENTUK[f.bentuk] + ' yang dibagi menjadi ' + f.n + ' bagian bercorak';
    if (f.cincin) s += f.cincin.n === 1 ? ', dengan lingkaran kecil bercorak di tengahnya' : ', dengan lingkaran kecil di tengah yang juga terbagi empat';
    if (f.penanda != null) s += (f.cincin ? ' serta' : ', dengan') + ' sebuah titik penanda';
    return s;
  }

  /** Rincian isi bangun dalam kata (untuk kesimpulan). */
  function uraiIsi(f, acuan) {
    var d = [];
    if (f.n <= 6) for (var k = 0; k < f.n; k++) d.push(letak(f.n, f.awal, k) + ' ' + Corak.nama(f.corak[k]));
    else acuan.forEach(function (k) { d.push(letak(f.n, f.awal, k) + ' ' + Corak.nama(f.corak[k])); });
    var s = gabungKata(d);
    if (f.n > 6) s += '; bagian lainnya mengikuti urutan yang sama';
    if (f.cincin) {
      if (f.cincin.n === 1) s += '; lingkaran kecil di tengah ' + Corak.nama(f.cincin.corak[0]);
      else s += '; lingkaran tengah: ' + gabungKata(f.cincin.corak.map(function (kd, k) { return letak(4, f.cincin.awal, k) + ' ' + Corak.nama(kd); }));
    }
    if (f.penanda != null) s += '; titik penanda di bagian ' + letak(f.n, f.awal, f.penanda);
    return s;
  }

  /** Kalimat perubahan arah corak berarah oleh unsur e (kode berbeda saja). */
  function uraiArah(f, e) {
    var lihat = {}, d = [];
    var semua = f.corak.concat(f.cincin ? f.cincin.corak : []);
    semua.forEach(function (kd) {
      if (lihat[kd]) return;
      lihat[kd] = 1;
      var h = kodeT(kd, e);
      if (h !== kd) d.push(Corak.nama(kd) + ' menjadi ' + Corak.nama(h));
    });
    return d;
  }

  // ------------------------------------------------------------------- gambar

  function teksB(s, x, y, o) {
    o = o || {};
    return S.teks(s, x, y, { ukuran: o.ukuran || 11, tebal: o.tebal, isi: o.isi || BH.teks, rata: o.rata });
  }

  function poliBentuk(bentuk, cx, cy, R) { return Corak.bentuk(bentuk, cx, cy, R * UKUR[bentuk].s); }
  function poliBagian(f, cx, cy, R) { return Corak.bagi(poliBentuk(f.bentuk, cx, cy, R), cx, cy, f.n, f.awal); }
  function jariCincin(f, R) { return (f.cincin && f.cincin.n > 1 ? 0.5 : 0.45) * UKUR[f.bentuk].dalam * R; }
  function poliLingkaran(cx, cy, r) {
    var p = [];
    for (var i = 0; i < 60; i++) { var t = i * Math.PI / 30; p.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]); }
    return p;
  }
  function tengahBagian(f, k) { return f.awal + (k + 0.5) * 360 / f.n; }
  function titikPenanda(f, cx, cy, R) {
    var rd = UKUR[f.bentuk].dalam * R, r = f.cincin ? (jariCincin(f, R) + rd) / 2 + 1 : 0.6 * rd;
    return Corak.titikArah(cx, cy, r, tengahBagian(f, f.penanda));
  }

  /** Bangun bercorak utuh berpusat (cx, cy) dengan ukuran nominal R. */
  var TANDA = { titik: 1, bintang: 1, bulatan: 1 };

  /**
   * Potongan cembung bagian (irisan sudut a0..a1) yang berjarak sedikitnya h dari pusat: tempat tanda corak
   * (titik, bintang, bulatan) supaya tidak ada tanda yang terpotong lingkaran tengah. Irisan lebar dibelah dua.
   */
  function potongCincin(p, cx, cy, a0, a1, h) {
    var belah = a1 - a0 > 50 ? 2 : 1, out = [];
    for (var q = 0; q < belah; q++) {
      var b0 = a0 + q * (a1 - a0) / belah, b1 = b0 + (a1 - a0) / belah, x = p, t;
      if (belah > 1) {
        t = b0 * Math.PI / 180;
        x = Bentuk.potongBidang(x, Math.cos(t), Math.sin(t), Math.cos(t) * cx + Math.sin(t) * cy);
        t = b1 * Math.PI / 180;
        x = Bentuk.potongBidang(x, -Math.cos(t), -Math.sin(t), -(Math.cos(t) * cx + Math.sin(t) * cy));
      }
      t = (b0 + b1) / 2 * Math.PI / 180;
      var ux = Math.sin(t), uy = -Math.cos(t);
      x = Bentuk.potongBidang(x, ux, uy, ux * cx + uy * cy + h);
      if (x.length >= 3 && Math.abs(Bentuk.luas(x)) > 4) out.push(x);
    }
    return out;
  }

  function svgBangun(f, cx, cy, R) {
    var sk = Math.max(0.85, Math.min(1.2, R / 60)), luar = poliBentuk(f.bentuk, cx, cy, R);
    var bag = Corak.bagi(luar, cx, cy, f.n, f.awal), out = [], tebal = 1.6, w = 360 / f.n;
    if (!f.cincin) out.push(Corak.gambar(bag.map(function (p, k) { return { poli: p, kode: f.corak[k] }; }), { luar: luar, skala: sk, tebal: tebal, tebalLuar: R >= 70 ? 2.6 : 2.3 }));
    else {
      var h = jariCincin(f, R) + 2.4;
      bag.forEach(function (p, k) {
        var kd = f.corak[k];
        if (!TANDA[kd]) { out.push(Corak.isi(p, kd, { skala: sk })); return; }
        out.push(Corak.isi(p, Corak.gelap(kd) ? 'hitam' : 'putih', { skala: sk }));
        potongCincin(p, cx, cy, f.awal + k * w, f.awal + (k + 1) * w, h).forEach(function (q) { out.push(Corak.isi(q, kd, { skala: sk })); });
      });
      // garis batas seperti Corak.gambar: batas bagian gelap putih, lainnya hitam, lalu garis tepi luar
      bag.forEach(function (p, k) { if (Corak.gelap(f.corak[k])) out.push(S.poli(p, { tutup: true, isi: 'none', garis: '#ffffff', tebal: tebal * 0.9, sambung: 'round' })); });
      bag.forEach(function (p, k) { if (!Corak.gelap(f.corak[k])) out.push(S.poli(p, { tutup: true, isi: 'none', garis: TINTA, tebal: tebal, sambung: 'round' })); });
      out.push(S.poli(luar, { tutup: true, isi: 'none', garis: TINTA, tebal: R >= 70 ? 2.6 : 2.3, sambung: 'round' }));
    }
    if (f.cincin) {
      var rc = jariCincin(f, R), lg = poliLingkaran(cx, cy, rc), bc = Corak.bagi(lg, cx, cy, f.cincin.n, f.cincin.awal);
      // celah putih tipis di sekeliling lingkaran tengah supaya tetap terpisah dari bagian luar yang gelap
      out.push(S.lingkaran(cx, cy, rc + 1, { isi: 'none', garis: '#ffffff', tebal: 2.8 }));
      out.push(Corak.gambar(bc.map(function (p, k) { return { poli: p, kode: f.cincin.corak[k] }; }), { luar: lg, skala: sk * 0.9, tebal: 1.5, tebalLuar: 2 }));
    }
    if (f.penanda != null) {
      var p = titikPenanda(f, cx, cy, R), rp = Math.max(5.2, 6.4 * R / 60);
      out.push(S.lingkaran(p[0], p[1], rp, { isi: '#ffffff', garis: TINTA, tebal: 2.2 }));
      out.push(S.lingkaran(p[0], p[1], rp * 0.36, { isi: TINTA }));
    }
    return out.join('');
  }

  var R_OPSI = 60, W_OPSI = 156;

  function svgOpsi(m) {
    var o = svgBangun(m.fig, W_OPSI / 2, W_OPSI / 2, R_OPSI);
    return { svg: S.doc(o, W_OPSI, W_OPSI, { latar: '#ffffff' }), lebar: W_OPSI, tinggi: W_OPSI };
  }

  function lingkaranNomor(no, x, y) {
    return S.lingkaran(x, y, 10, { isi: '#ffffff', garis: TEPI, tebal: 1.8 }) + S.teks(String(no), x, y + 4.6, { ukuran: 13, tebal: true, isi: TEPI, rata: 'middle' });
  }

  /** Gambar soal: bangun beserta tanda tiap langkah (busur panah dan sudut, atau garis cermin putus-putus). */
  function svgSoal(m) {
    var f = m.fig, R = 76, luar = UKUR[f.bentuk].luar * R, banyak = m.langkah.length, nomor = banyak > 1;
    var nBusur = m.langkah.filter(function (l) { return l.jenis === 'putar'; }).length;
    var half = Math.ceil(nBusur ? luar + 16 + (nBusur > 1 ? 18 : 0) + 34 : luar + 22 + (nomor ? 24 : 12)), W = 2 * half, cx = half, cy = half, out = [svgBangun(f, cx, cy, R)];
    var iBusur = 0;
    m.langkah.forEach(function (l, i) {
      if (l.jenis === 'cermin') {
        var t = l.sumbu * Math.PI / 180, ux = Math.cos(t), uy = -Math.sin(t), L = luar + 22;
        out.push(S.garis(cx - ux * L, cy - uy * L, cx + ux * L, cy + uy * L, { garis: TEPI, tebal: 2.2, putus: '9 6' }));
        if (nomor) {
          // ujung garis yang jauh dari tanda busur (busur pertama di kanan atas)
          var sg = nBusur && (ux - uy) > 0 ? -1 : 1, ex = cx + sg * ux * (L + 6), ey = cy + sg * uy * (L + 6);
          out.push(lingkaranNomor(i + 1, ex + (Math.abs(uy) > 0.9 ? 14 : 0), ey + (Math.abs(uy) > 0.9 ? 0 : (sg * uy > 0 ? 13 : -13))));
        }
        return;
      }
      var r = luar + 16 + (iBusur ? 18 : 0), mid = iBusur ? 225 : 45, d = l.sudut, a0, a1;
      if (l.arah === 'berlawanan') { a0 = mid + d / 2; a1 = mid - d / 2; } else { a0 = mid - d / 2; a1 = mid + d / 2; }
      out.push(S.busurPanah(cx, cy, r, a0, a1, { warna: TEPI, tebal: 2.4, kepala: 11, halo: true }));
      var pt = Corak.titikArah(cx, cy, r + 19, mid);
      out.push(S.teks(l.sudut + '°', pt[0], pt[1] + 5, { ukuran: 15, tebal: true, isi: TEPI, rata: 'middle' }));
      // nomor langkah di sisi teks yang menjauhi busur
      if (nomor) out.push(lingkaranNomor(i + 1, pt[0] + (mid < 180 ? 1 : -1) * (Metrik.lebar(l.sudut + '°', 15, true) / 2 + 14), pt[1]));
      iBusur++;
    });
    return { svg: S.doc(out.join(''), W, W, { latar: '#ffffff' }), lebar: W, tinggi: W };
  }

  /*
   * Gambar pembahasan
   *   tcorak-tahap  bangun tiap tahap (awal, sesudah langkah 1, hasil): bagian acuan bergaris tepi jingga/biru,
   *                 panah dari letak lama ke letak baru (busur untuk putaran, panah lurus menyeberangi garis
   *                 cermin), nama corak acuan di bawah tiap tahap; tahap akhir (jawaban) berlatar hijau muda
   *   tcorak-arsir  contoh corak berarah sebelum dan sesudah tiap langkah
   *   tcorak-beda   baris atas: kelima opsi; baris bawah: semuanya diputar searah opsi acuan, bagian yang
   *                 tidak cocok pada opsi kunci disorot
   */
  var P_TAHAP = 176, R_TAHAP = 52, GAP_TAHAP = 92;

  function teksPanah(l) {
    if (l.jenis === 'putar') return l.sudut === 180 ? ['putar 180°'] : ['putar ' + l.sudut + '°', l.arah === 'berlawanan' ? 'berlawanan' : 'searah', l.arah === 'berlawanan' ? 'arah jarum jam' : 'jarum jam'];
    return ['cermin', SUMBU_PENDEK[l.sumbu]];
  }

  function svgTahap(m, judul) {
    var np = m.panel.length, pad = 10, lebarIsi = np * P_TAHAP + (np - 1) * GAP_TAHAP;
    var W = Math.max(pad * 2 + lebarIsi, Math.ceil(Metrik.lebar(judul, 13, true)) + 18), x0 = (W - lebarIsi) / 2;
    var yL = pad + 26 + 12, y0 = yL + 8, nA = m.acuan.length, H = y0 + P_TAHAP + 10 + nA * 15 + pad;
    var o = [teksB(judul, pad, pad + 13, { ukuran: 13, tebal: true })];
    // indeks bagian acuan pada tiap tahap
    var idx = [m.acuan.slice()];
    for (var i = 0; i < m.langkah.length; i++) {
      var e = elLangkah(m.langkah[i]), f0 = m.panel[i];
      idx.push(idx[i].map(function (k) { return indeksT(f0.n, f0.awal, k, e); }));
    }
    m.panel.forEach(function (f, i) {
      var x = x0 + i * (P_TAHAP + GAP_TAHAP), jawab = i === np - 1, cx = x + P_TAHAP / 2, cy = y0 + P_TAHAP / 2;
      o.push(teksB(m.label[i], cx, yL, { ukuran: 11, tebal: true, rata: 'middle', isi: jawab ? BH.jawab : BH.teks }));
      o.push(S.rect(x, y0, P_TAHAP, P_TAHAP, { rx: 6, isi: jawab ? BH.latarJawab : '#ffffff', garis: jawab ? BH.jawab : BINGKAI_PANEL, tebal: jawab ? 2.6 : 1.4 }));
      o.push(svgBangun(f, cx, cy, R_TAHAP));
      var bag = poliBagian(f, cx, cy, R_TAHAP);
      idx[i].forEach(function (k, j) { o.push(S.poli(bag[k], { tutup: true, isi: 'none', garis: WARNA_ACUAN[j], tebal: 3.4, sambung: 'round' })); });
      if (i < np - 1) {
        var l = m.langkah[i], luar = UKUR[f.bentuk].luar * R_TAHAP;
        if (l.jenis === 'putar') {
          var dS = l.arah === 'berlawanan' ? -l.sudut : l.sudut;
          idx[i].forEach(function (k, j) {
            var a = tengahBagian(f, k), r = luar + 7 + 8 * j;
            o.push(S.busurPanah(cx, cy, r, a, a + dS, { warna: WARNA_ACUAN[j], tebal: 2.4, kepala: 9, halo: true }));
          });
        } else {
          var t = l.sumbu * Math.PI / 180, ux = Math.cos(t), uy = -Math.sin(t), L = luar + 10;
          o.push(S.garis(cx - ux * L, cy - uy * L, cx + ux * L, cy + uy * L, { garis: BH.teksRedup, tebal: 1.8, putus: '7 5' }));
          idx[i].forEach(function (k, j) {
            var p0 = Bentuk.beratTitik(bag[k]), p1 = Bentuk.beratTitik(bag[idx[i + 1][j]]);
            var dx = p1[0] - p0[0], dy = p1[1] - p0[1], dd = Math.hypot(dx, dy);
            if (dd < 8) return;
            var s0 = Math.min(6, dd * 0.15);
            o.push(S.panah(p0[0] + dx / dd * s0, p0[1] + dy / dd * s0, p1[0] - dx / dd * s0, p1[1] - dy / dd * s0, { warna: WARNA_ACUAN[j], tebal: 2.4, kepala: 9, halo: true }));
          });
        }
        var tx = teksPanah(l), ax = x + P_TAHAP + 8, bx = x + P_TAHAP + GAP_TAHAP - 8;
        o.push(S.panah(ax, cy + 12, bx, cy + 12, { warna: BH.panah, tebal: 2.4, kepala: 10 }));
        tx.forEach(function (s, q) { o.push(teksB(s, (ax + bx) / 2, cy + 2 - (tx.length - 1 - q) * 13, { ukuran: q ? 10 : 11, tebal: !q, rata: 'middle', isi: BH.panah })); });
      }
      idx[i].forEach(function (k, j) { o.push(teksB(PENDEK[f.corak[k]], cx, y0 + P_TAHAP + 16 + 15 * j, { ukuran: 11, tebal: true, rata: 'middle', isi: WARNA_ACUAN[j] })); });
    });
    return { svg: S.doc(o.join(''), W, H, { latar: '#ffffff' }), lebar: W, tinggi: H };
  }

  function svgArsir(m, judul) {
    var pad = 10, kw = 112, gap = 56, nk = m.kolom.length, lebarIsi = nk * kw + (nk - 1) * gap, sw = 46, rh = 82;
    var W = Math.max(pad * 2 + lebarIsi, Math.ceil(Metrik.lebar(judul, 13, true)) + 18), x0 = (W - lebarIsi) / 2;
    var yH = pad + 26 + 14, y0 = yH + 10, H = y0 + m.baris.length * rh + pad;
    var o = [teksB(judul, pad, pad + 13, { ukuran: 13, tebal: true })];
    m.kolom.forEach(function (s, i) { o.push(teksB(s, x0 + i * (kw + gap) + kw / 2, yH, { ukuran: 11, tebal: true, rata: 'middle', isi: i === nk - 1 ? BH.jawab : BH.teks })); });
    m.baris.forEach(function (b, r) {
      var y = y0 + r * rh;
      b.forEach(function (kd, i) {
        var x = x0 + i * (kw + gap) + (kw - sw) / 2, kotak = [[x, y], [x + sw, y], [x + sw, y + sw], [x, y + sw]];
        o.push(Corak.isi(kotak, kd, { skala: 1 }));
        o.push(S.rect(x, y, sw, sw, { isi: 'none', garis: i === nk - 1 ? BH.jawab : TINTA, tebal: i === nk - 1 ? 2.4 : 1.8 }));
        o.push(teksB(PENDEK[kd], x + sw / 2, y + sw + 15, { ukuran: 11, rata: 'middle', isi: BH.teks }));
        if (i < nk - 1) {
          var ax = x0 + i * (kw + gap) + kw - 4, bx = x0 + (i + 1) * (kw + gap) + 4;
          o.push(S.panah(ax, y + sw / 2, bx, y + sw / 2, { warna: BH.panah, tebal: 2.2, kepala: 9 }));
        }
      });
    });
    return { svg: S.doc(o.join(''), W, H, { latar: '#ffffff' }), lebar: W, tinggi: H };
  }

  function svgBeda(m, judul) {
    var pad = 10, P = 124, gap = 14, R = 43, lebarIsi = 5 * P + 4 * gap;
    var W = Math.max(pad * 2 + lebarIsi, Math.ceil(Metrik.lebar(judul, 13, true)) + 18), x0 = (W - lebarIsi) / 2;
    var y1L = pad + 26 + 12, y1 = y1L + 22, y2L = y1 + P + 34, y2 = y2L + 10, H = y2 + P + 24 + pad;
    var o = [teksB(judul, pad, pad + 13, { ukuran: 13, tebal: true })];
    o.push(teksB('Pilihan seperti tercetak', x0, y1L, { ukuran: 11, tebal: true, isi: BH.teksRedup }));
    o.push(teksB('Semua diputar searah gambar ' + Fmt.huruf(m.acuan) + ' (bagian acuan bergaris biru)', x0, y2L, { ukuran: 11, tebal: true, isi: BH.teksRedup }));
    m.pilihan.forEach(function (f, i) {
      var x = x0 + i * (P + gap), kunci = i === m.kunci, cx = x + P / 2;
      o.push(teksB(Fmt.huruf(i), cx, y1 - 6, { ukuran: 13, tebal: true, rata: 'middle', isi: kunci ? BH.jawab : BH.teks }));
      o.push(S.rect(x, y1, P, P, { rx: 6, isi: kunci ? BH.latarJawab : '#ffffff', garis: kunci ? BH.jawab : BINGKAI_PANEL, tebal: kunci ? 2.6 : 1.4 }));
      o.push(svgBangun(f, cx, y1 + P / 2, R));
      var g = terapkan(f, el(0, m.putar[i])), cy = y2 + P / 2;
      o.push(S.rect(x, y2, P, P, { rx: 6, isi: '#ffffff', garis: kunci ? BH.sorot : BINGKAI_PANEL, tebal: kunci ? 2.4 : 1.4 }));
      o.push(svgBangun(g, cx, cy, R));
      var bag = poliBagian(g, cx, cy, R);
      if (kunci && m.beda.length * 2 <= g.n) m.beda.forEach(function (k) { o.push(S.poli(bag[k], { tutup: true, isi: 'none', garis: BH.sorot, tebal: 3, sambung: 'round' })); });
      if (m.patok[i] >= 0) o.push(S.poli(bag[m.patok[i]], { tutup: true, isi: 'none', garis: BH.panah, tebal: 3, sambung: 'round' }));
      var ket = i === m.acuan ? 'acuan' : (kunci ? m.ketKunci : (m.putar[i] === 0 ? 'tetap' : teksSudutC(m.putar[i]).replace('diputar ', 'putar ').replace(' jarum jam', '').replace('berlawanan arah', 'berlawanan')));
      o.push(teksB(ket, cx, y2 + P + 16, { ukuran: 11, tebal: kunci, rata: 'middle', isi: kunci ? BH.sorot : BH.teksRedup }));
    });
    return { svg: S.doc(o.join(''), W, H, { latar: '#ffffff' }), lebar: W, tinggi: H };
  }

  // ------------------------------------------------------------- penyusunan

  function pilihPola(a, semua, id, dipakai) {
    var baru = semua.filter(function (p) { return (dipakai || []).indexOf(id + ':' + p) < 0; });
    return a.pilih(baru.length ? baru : semua);
  }

  /** Kode corak n bagian: nArah kode berarah berbeda + kode tak berarah; dua bagian bersebelahan tidak sama. */
  function pilihCorak(a, n, spek) {
    var lo = Math.min(spek.nArah[0], spek.arah.length, n), hi = Math.min(spek.nArah[1], spek.arah.length, n - 1);
    var nb = a.bulat(lo, Math.max(lo, hi)), d = a.ambil(spek.arah, nb), sisa = n - nb;
    if (sisa <= spek.tak.length) d = d.concat(a.ambil(spek.tak, sisa));
    else { var t = spek.tak.slice(); while (t.length < sisa) t.push(a.pilih(spek.tak)); d = d.concat(t); }
    for (var coba = 0; coba < 30; coba++) {
      var x = a.kocok(d), ok = true;
      for (var k = 0; k < n && ok; k++) if (x[k] === x[(k + 1) % n]) ok = false;
      if (ok) return x;
    }
    return null;
  }

  function cocokBingkai(b, unsur) {
    var f = fig(b.bentuk, b.n, b.awal, [], null, null);
    return unsur.every(function (e) { return bingkaiTetap(f, e); });
  }

  /**
   * Bangun acak pada salah satu bingkai yang tetap oleh semua `unsur`.
   * spek: { tak, arah, nArah, n:[...], cincinEmpat (boleh terbagi 4), penanda (peluang), berubah: {e, min} }
   */
  function buatBangun(a, spek, unsur) {
    var calon = BINGKAI.filter(function (b) { return spek.n.indexOf(b.n) >= 0 && (!spek.bentuk || spek.bentuk.indexOf(b.bentuk) >= 0) && cocokBingkai(b, unsur); });
    if (!calon.length) return null;
    for (var coba = 0; coba < 40; coba++) {
      var b = a.pilih(calon), corak = pilihCorak(a, b.n, spek);
      if (!corak) continue;
      var empat = spek.cincinEmpat && unsur.every(function (e) { return bulat(e.c / 90); });
      var cin = null, pen = null, jenis;
      if (b.n === 4) jenis = empat ? 'empat' : 'satu';
      else if (b.n === 6) jenis = 'satu';
      else jenis = a.untung(0.55) ? 'satu' : (empat && a.untung(0.3) ? 'empat' : 'tidak');
      var poolC = spek.tak.concat(spek.arahCincin || spek.arah);
      if (jenis === 'satu') cin = { n: 1, awal: 0, corak: [a.pilih(poolC)] };
      else if (jenis === 'empat') cin = { n: 4, awal: a.pilih([0, 45]), corak: a.ambil(poolC.filter(function (x) { return x !== 'bintang' && x !== 'bulatan'; }), 4) };
      var pPen = b.n === 4 ? (jenis === 'empat' ? 0.6 : 0.9) : (b.n === 6 ? 1 : 0.4);
      var bolehPen = corak.map(function (kd, i) { return i; }).filter(function (i) { return !TANDA[corak[i]]; });
      if (bolehPen.length && a.untung(pPen)) pen = a.pilih(bolehPen);
      var f = fig(b.bentuk, b.n, b.awal, corak, cin, pen);
      if (!unsur.every(function (e) { return terapkan(f, e); })) continue;
      if (!asimetris(f)) continue;
      if (spek.berubah && banyakBerubah(f, spek.berubah.e) < spek.berubah.min) continue;
      return f;
    }
    return null;
  }

  /** Pilih bagian acuan (kode unik di bangun): diutamakan yang coraknya berubah oleh e, lalu yang tak berarah. */
  /**
   * Pilih bagian acuan (kode unik di bangun) untuk langkah-langkah `langkah`: diutamakan yang berpindah pada
   * setiap langkah, lalu yang coraknya berubah, lalu yang tak berarah (hitam lebih dulu).
   */
  function pilihAcuan(a, f, langkah, jumlah) {
    var hitung = {}, es = langkah.map(elLangkah), total = elUrutan(langkah);
    f.corak.forEach(function (k) { hitung[k] = (hitung[k] || 0) + 1; });
    var unik = a.kocok(f.corak.map(function (k, i) { return i; }).filter(function (i) { return hitung[f.corak[i]] === 1; }));
    var nilai = function (i) {
      var v = 0, k = i;
      es.forEach(function (e, q) { var j = indeksT(f.n, f.awal, k, e); if (j !== k) v += q ? 3 : 5; k = j; });
      if (kodeT(f.corak[i], total) !== f.corak[i]) v += 2;
      if (f.corak[i] === 'hitam') v += 1.5; else if (!Corak.berarah(f.corak[i])) v += 1;
      return v;
    };
    var skor = {};
    unik.forEach(function (i) { skor[i] = nilai(i); });
    unik.sort(function (x, y) { return skor[y] - skor[x]; });
    // acuan kedua sebaiknya berjenis lain (berarah / tak berarah) dari acuan pertama
    // acuan kedua tidak boleh pasangan tukar acuan pertama pada langkah mana pun (panahnya akan berimpit)
    var jejak = function (i) { var d = [i], k = i; es.forEach(function (e) { k = indeksT(f.n, f.awal, k, e); d.push(k); }); return d; };
    var out = unik.slice(0, 1), j0 = out.length ? jejak(out[0]) : [];
    var bebas = unik.slice(1).filter(function (i) { var ji = jejak(i); return !ji.some(function (k, q) { return q > 0 && (k === j0[q - 1] && ji[q - 1] === j0[q]); }); });
    var lain = bebas.filter(function (i) { return out.length && Corak.berarah(f.corak[i]) !== Corak.berarah(f.corak[out[0]]) && skor[i] >= 4; });
    (lain.concat(bebas)).forEach(function (i) { if (out.length < jumlah && out.indexOf(i) < 0) out.push(i); });
    return out;
  }

  /** Bangun f dengan corak bagian i dan j ditukar. */
  function tukarBagian(f, i, j) {
    var c = f.corak.slice(), t = c[i];
    c[i] = c[j]; c[j] = t;
    return fig(f.bentuk, f.n, f.awal, c, f.cincin, f.penanda);
  }

  function calonTukar(a, kunci) {
    var n = kunci.n, d = [];
    for (var i = 0; i < n; i++) {
      var j = (i + 1) % n;
      if (kunci.corak[i] !== kunci.corak[j]) d.push([i, j]);
    }
    if (!d.length) return null;
    var p = a.pilih(d);
    return { fig: tukarBagian(kunci, p[0], p[1]), alasan: 'letak bagian ' + Corak.nama(kunci.corak[p[0]]) + ' dan bagian ' + Corak.nama(kunci.corak[p[1]]) + ' pada gambar hasil tertukar' };
  }

  /** Contoh kalimat arah corak yang seharusnya berubah (untuk alasan pengecoh "arah garis tidak ikut"). */
  function contohArah(f, e) {
    var d = uraiArah(f, e);
    return d.length ? 'corak ' + d[0] : 'arah garisnya seharusnya berubah';
  }

  /** Empat pengecoh pertama yang sah dan berbeda dari kunci serta satu sama lain. */
  function susunPengecoh(a, kunci, calon, wajib, depan, belakang) {
    var urut = wajib.concat(a.kocok(depan), belakang), lihat = {}, hasil = [];
    lihat[sidikFig(kunci)] = 1;
    urut.forEach(function (nm) {
      if (hasil.length >= 4) return;
      var c = typeof calon[nm] === 'function' ? calon[nm]() : calon[nm];
      if (!c || !c.fig) return;
      var s = sidikFig(c.fig);
      if (lihat[s]) return;
      lihat[s] = 1;
      hasil.push({ fig: c.fig, alasan: c.alasan.charAt(0).toUpperCase() + c.alasan.slice(1) + '.', jenis: nm });
    });
    return hasil.length === 4 ? hasil : null;
  }

  function rakitOpsi(a, peng, kunci, target) {
    var daftar = a.kocok(peng.map(function (p) { return { fig: p.fig, alasan: p.alasan, kunci: false }; }));
    daftar.splice(target, 0, { fig: kunci, alasan: null, kunci: true });
    return daftar;
  }

  function opsiGambar(daftar) {
    return daftar.map(function (d, i) {
      return { teks: 'Gambar opsi ' + Fmt.huruf(i), nilai: i, alasan: d.alasan, kunci: d.kunci,
        gambar: { id: 'opsi-' + Fmt.huruf(i).toLowerCase(), jenis: 'tcorak-opsi', model: { fig: d.fig }, judul: 'Opsi ' + Fmt.huruf(i) } };
    });
  }

  /** Kode corak berarah yang berubah pada sedikitnya satu langkah: baris tabel Gambar arah garis. */
  function barisArsir(f, langkah) {
    var lihat = {}, baris = [];
    f.corak.concat(f.cincin ? f.cincin.corak : []).forEach(function (kd) {
      if (lihat[kd] || !Corak.berarah(kd)) return;
      lihat[kd] = 1;
      var b = [kd], k = kd, ubah = false;
      langkah.forEach(function (l) { var h = kodeT(k, elLangkah(l)); if (h !== k) ubah = true; k = h; b.push(k); });
      if (ubah) baris.push(b);
    });
    return baris.slice(0, 4);
  }

  /** Gambar dan teks pembahasan putar/cermin (dipakai kedua keluarga). */
  function bahasLangkah(a, f, langkah, kunci, namaGaris) {
    var total = elUrutan(langkah), dua = langkah.length > 1;
    var acuan = pilihAcuan(a, f, langkah, 2);
    var panel = [f], g = f;
    langkah.forEach(function (l) { g = terapkan(g, elLangkah(l)); panel.push(g); });
    var label = dua ? ['Gambar awal', 'Setelah langkah 1', 'Hasil (jawaban)'] : ['Gambar awal', 'Hasil (jawaban)'];
    var pem = [], tahap = [f], idx = acuan.slice();
    langkah.forEach(function (l, i) {
      var e = elLangkah(l), g0 = tahap[i], g1 = terapkan(g0, e), kal;
      var awalan = dua ? 'Langkah ' + (i + 1) + ' (' + (namaGaris ? 'pencerminan terhadap garis ' + (i + 1) + ', yaitu garis ' + NAMA_SUMBU[l.sumbu] : teksLangkahPendek(l)) + '): ' : '';
      if (l.jenis === 'putar') {
        var w = 360 / g0.n, s = l.sudut / w;
        kal = awalan + 'satu bagian selebar ' + Fmt.angka(w) + '°, jadi putaran ' + teksPutar(l.sudut, l.arah) + ' memindahkan setiap bagian sejauh ' + Fmt.angka(s) + ' bagian ' + (l.sudut === 180 ? 'ke seberangnya' : namaArah(l.arah)) + '.';
      } else {
        kal = awalan + 'setiap bagian berpindah ke seberang garis cermin ' + NAMA_SUMBU[l.sumbu] + ' dengan jarak yang sama, sehingga urutan corak searah jarum jam menjadi terbalik.';
      }
      var gerak = idx.map(function (k) {
        var j = indeksT(g0.n, g0.awal, k, e), h = kodeT(g0.corak[k], e);
        return 'bagian ' + Corak.nama(g0.corak[k]) + ' di ' + letak(g0.n, g0.awal, k) + (j === k ? ' tetap di tempatnya karena dilalui garis cermin' : ' berpindah ke ' + letak(g0.n, g0.awal, j)) + (h !== g0.corak[k] ? (j === k ? ', tetapi' : ' dan') + ' coraknya menjadi ' + Corak.nama(h) : '');
      });
      kal += ' Contohnya, ' + gerak.join('; ') + '.';
      var arah = uraiArah(g0, e);
      if (arah.length) kal += ' Arah corak bergaris dan berkotak-kotak ikut ' + (l.jenis === 'putar' ? 'berputar' : 'tercermin') + ': ' + gabungKata(arah) + '.';
      else if (!dua) kal += ' Corak setiap bagian ikut berpindah bersama bagiannya, dan rupa coraknya tetap.';
      pem.push(kal.charAt(0).toUpperCase() + kal.slice(1));
      idx = idx.map(function (k) { return indeksT(g0.n, g0.awal, k, e); });
      tahap.push(g1);
    });
    var baris = barisArsir(f, langkah);
    var gb = [{ id: 'bahas-1', jenis: 'tcorak-tahap', judul: dua ? 'Gambar 1. Bagian acuan pada setiap langkah' : 'Gambar 1. Bagian acuan sebelum dan sesudah ' + (langkah[0].jenis === 'putar' ? 'diputar' : 'dicerminkan'),
      model: { panel: panel, langkah: langkah, label: label, acuan: acuan, jawaban: kunci } }];
    var sebut = 'Gambar 1 menandai bagian acuan (bergaris tepi ' + (acuan.length > 1 ? 'jingga dan biru' : 'jingga') + ') pada setiap tahap beserta panah ke letak barunya; tahap terakhir adalah gambar jawaban.';
    if (baris.length) {
      gb.push({ id: 'bahas-2', jenis: 'tcorak-arsir', judul: 'Gambar 2. Arah garis corak ' + (dua ? 'pada setiap langkah' : 'sebelum dan sesudah ' + (langkah[0].jenis === 'putar' ? 'diputar' : 'dicerminkan')),
        model: { kolom: dua ? ['awal', 'langkah 1', 'hasil'] : ['awal', 'hasil'], baris: baris } });
      sebut += ' Gambar 2 memperlihatkan arah garis tiap corak bergaris ' + (dua ? 'pada setiap langkah.' : 'sebelum dan sesudahnya.');
    }
    return { pem: pem, sebut: sebut, gambar: gb, acuan: idx, total: total };
  }

  // ------------------------------------------------------------ corak-putar

  var SPEK_TETAP90 = { tak: TAK, arah: KOTAK, nArah: [0, 2], n: [4, 8], cincinEmpat: true };
  var SPEK_ARAH = { tak: TAK, arah: ARSIR.concat(KOTAK), arahCincin: ARSIR, nArah: [2, 3], n: [4, 8], cincinEmpat: true };

  function rancangPutar(a, level, dipakai) {
    var id = 'corak-putar', pola, langkah, spek;
    if (level === 'mudah') {
      pola = pilihPola(a, ['putar-90', 'putar-180'], id, dipakai);
      if (pola === 'putar-90') { langkah = [{ jenis: 'putar', sudut: 90, arah: 'searah' }]; spek = SPEK_TETAP90; }
      else {
        langkah = [{ jenis: 'putar', sudut: 180, arah: 'searah' }];
        spek = a.untung(0.15) ? { tak: TAK, arah: [], nArah: [0, 0], n: [6] } : { tak: TAK, arah: KOTAK.concat(ARSIR), nArah: [0, 2], n: [4, 8], cincinEmpat: true };
      }
      return { pola: pola, langkah: langkah, spek: spek };
    }
    if (level === 'sedang') {
      pola = pilihPola(a, ['berlawanan-90', 'putar-270', 'arsir-90', 'putar-45'], id, dipakai);
      if (pola === 'berlawanan-90') langkah = [{ jenis: 'putar', sudut: 90, arah: 'berlawanan' }];
      else if (pola === 'putar-270') langkah = [{ jenis: 'putar', sudut: 270, arah: 'searah' }];
      else if (pola === 'arsir-90') langkah = [{ jenis: 'putar', sudut: 90, arah: 'searah' }];
      else langkah = [{ jenis: 'putar', sudut: a.pilih([45, 135]), arah: a.pilih(['searah', 'berlawanan']) }];
      spek = Object.assign({}, SPEK_ARAH, pola === 'putar-45' ? { n: [8], nArah: [3, 4] } : {});
      return { pola: pola, langkah: langkah, spek: spek };
    }
    pola = pilihPola(a, ['putar-cermin', 'cermin-putar', 'dua-putar'], id, dipakai);
    var empat5 = a.untung(0.3), sudutP = empat5 ? a.pilih([45, 135]) : a.pilih([90, 90, 90, 180]);
    var putar = { jenis: 'putar', sudut: sudutP, arah: a.pilih(['searah', 'berlawanan']) }, cermin = { jenis: 'cermin', sumbu: a.pilih([0, 90, 45, 135]) };
    if (pola === 'putar-cermin') langkah = [putar, cermin];
    else if (pola === 'cermin-putar') langkah = [cermin, putar];
    else {
      var pasang = empat5 ? [[90, 45], [45, 90], [135, 90], [90, 135], [180, 45], [45, 180]] : [[90, 180], [180, 90], [90, 90]];
      var p = a.pilih(pasang), ar = a.pilih(['searah', 'berlawanan']);
      langkah = [{ jenis: 'putar', sudut: p[0], arah: ar }, { jenis: 'putar', sudut: p[1], arah: p[0] === p[1] ? ar : lawan(ar) }];
      if (p[0] === 90 && p[1] === 90) langkah[1].arah = ar;     // 90° lalu 90° searah = 180°
    }
    spek = Object.assign({}, SPEK_ARAH, { nArah: [2, 4] }, empat5 ? { n: [8] } : {});
    return { pola: pola, langkah: langkah, spek: spek };
  }

  function pengecohPutar(a, level, f, langkah, kunci) {
    var total = elUrutan(langkah), dua = langkah.length > 1, c = {}, l0 = langkah[0];
    c.arsir = { fig: terapkan(f, total, false), alasan: 'letak setiap bagian sudah benar, tetapi arah garis coraknya tidak ikut ' + (dua && langkah.some(function (l) { return l.jenis === 'cermin'; }) ? 'berubah' : 'berputar') + ': ' + contohArah(f, total) };
    c.tetap = { fig: f, alasan: 'gambar ini sama dengan gambar awal (tidak diputar sama sekali)' };
    c.tukar = function () { return calonTukar(a, kunci); };
    c.cermin = function () {
      var sb = a.kocok([90, 0, 45, 135]);
      for (var i = 0; i < sb.length; i++) {
        var g = terapkan(f, elCermin(sb[i]));
        if (g && sidikFig(g) !== sidikFig(kunci)) return { fig: g, alasan: 'gambar dicerminkan terhadap garis ' + NAMA_SUMBU[sb[i]] + ', bukan diputar' };
      }
      return null;
    };
    if (!dua) {
      var d = l0.sudut, ar = l0.arah;
      if (d !== 180) c.balik = { fig: terapkan(f, elPutar(d, lawan(ar))), alasan: 'gambar diputar ' + d + '° ' + namaArah(lawan(ar)) + ', padahal yang diminta ' + namaArah(ar) };
      var lain = putaranSah(f).filter(function (x) { return x !== 0 && x !== total.c && x !== mod(-total.c, 360); });
      lain = a.kocok(lain);
      lain.sort(function (x, y) { return Math.abs(mod(x - total.c + 180, 360) - 180) - Math.abs(mod(y - total.c + 180, 360) - 180); });
      lain.slice(0, 2).forEach(function (x, i) { c['sudut' + i] = { fig: terapkan(f, el(0, x)), alasan: 'gambar ' + teksSudutC(x) + ', bukan ' + teksPutar(d, ar) }; });
      var depan, belakang, wajib = [];
      if (level === 'mudah') { depan = d === 180 ? ['sudut0', 'sudut1', 'cermin', 'tukar'] : ['balik', 'sudut0', 'cermin', 'tukar']; belakang = ['tetap', 'sudut1']; }
      else { wajib = ['arsir']; depan = ['balik', 'sudut0', 'cermin', 'tukar']; belakang = ['tetap', 'sudut1']; }
      return susunPengecoh(a, kunci, c, wajib, depan, belakang);
    }
    var l1 = langkah[1];
    c.langkah1 = { fig: jalankan(f, [l0]), alasan: 'hanya langkah pertama (' + teksLangkah(l0) + ') yang dikerjakan; langkah kedua terlewat' };
    c.langkah2 = { fig: jalankan(f, [l1]), alasan: 'langkah pertama terlewat; hanya ' + teksLangkahPendek(l1) + ' yang dikerjakan' };
    c.urutan = { fig: jalankan(f, [l1, l0]), alasan: 'kedua langkah dikerjakan dengan urutan terbalik (' + teksLangkahPendek(l1) + ' lebih dulu)' };
    [0, 1].forEach(function (i) {
      var l = langkah[i], ganti;
      if (l.jenis === 'putar' && l.sudut !== 180) ganti = { jenis: 'putar', sudut: l.sudut, arah: lawan(l.arah) };
      else if (l.jenis === 'cermin') ganti = { jenis: 'cermin', sumbu: mod(l.sumbu + 90, 180) };
      if (!ganti) return;
      var ls = langkah.slice();
      ls[i] = ganti;
      c['salah' + i] = { fig: jalankan(f, ls), alasan: 'langkah ' + (i + 1) + ' salah: gambar ' + teksLangkah(ganti) + ', padahal seharusnya ' + teksLangkah(l) };
    });
    return susunPengecoh(a, kunci, c, ['arsir'], ['langkah1', 'urutan', 'salah0', 'salah1'], ['tukar', 'langkah2', 'tetap']);
  }

  function pertanyaanPutar(langkah) {
    if (langkah.length === 1) return 'Manakah hasil gambar di atas jika ' + teksLangkah(langkah[0]) + '?';
    var l0 = langkah[0], l1 = langkah[1];
    var dua = teksLangkah(l1);
    if (l0.jenis === 'putar' && l1.jenis === 'putar') dua = 'diputar lagi ' + teksPutar(l1.sudut, l1.arah);
    return 'Gambar di atas ' + teksLangkah(l0) + ', lalu hasilnya ' + dua + '. Manakah gambar hasil akhirnya?';
  }

  function buatPutar(id, level, benih, opsi) {
    var a = Rng.alat(Rng.turunan(benih, id, level)), target = opsi.target == null ? a.bulat(0, 4) : opsi.target;
    for (var coba = 0; coba < 30; coba++) {
      var rc = rancangPutar(a, level, opsi.polaDipakai), langkah = rc.langkah, total = elUrutan(langkah);
      if (identitas(total)) continue;
      var unsur = langkah.map(elLangkah).concat([total]);
      var spek = Object.assign({}, rc.spek);
      if (level !== 'mudah') spek.berubah = { e: total, min: 2 };
      if (level === 'sulit' && total.r === 0 && bulat(total.c / 180)) spek.berubah = { e: elLangkah(langkah[0]), min: 2 };
      var f = buatBangun(a, spek, unsur);
      if (!f) continue;
      var kunci = jalankan(f, langkah);
      if (!kunci || sidikFig(kunci) === sidikFig(f)) continue;
      var peng = pengecohPutar(a, level, f, langkah, kunci);
      if (!peng) continue;
      var daftar = rakitOpsi(a, peng, kunci, target);
      var bh = bahasLangkah(a, f, langkah, kunci, null);
      var pem = ['Gambar soal berupa ' + uraiBangun(f) + '. ' + (langkah.length > 1 ? 'Gambar itu ' + teksLangkah(langkah[0]) + ', lalu ' + (langkah[1].jenis === 'putar' ? 'diputar lagi ' + teksPutar(langkah[1].sudut, langkah[1].arah) : teksLangkah(langkah[1])) + '; kerjakan langkah demi langkah.' : 'Seluruh gambar ' + teksLangkah(langkah[0]) + ' terhadap titik pusatnya.')]
        .concat(bh.pem, [bh.sebut, 'Jadi gambar hasilnya: ' + uraiIsi(kunci, bh.acuan) + '. Gambar itu adalah opsi ' + Fmt.huruf(target) + '.']);
      var ctx = { subtes: 'ku', submateri: 'figural', keluarga: id, level: level, benih: benih, a: a };
      var butir = Butir.rakitPg(ctx, {
        jenisSoal: 'Figural - Macam-macam Transformasi (rotasi bangun bercorak)',
        judul: 'Figural - Rotasi Bangun Bercorak', teks: [], perintah: langkah.some(function (l) { return l.jenis === 'cermin'; }) ? PERINTAH_PUTAR_CERMIN : PERINTAH_PUTAR, pertanyaan: pertanyaanPutar(langkah),
        gambar: [{ id: 'soal', jenis: 'tcorak-soal', model: { fig: f, langkah: langkah }, judul: 'Bangun bercorak dan arah putarnya' }],
        pilihanJadi: { opsi: opsiGambar(daftar), kunciIndex: target }, tulisKunci: false,
        langkah: [], pembahasan: pem,
        model: { topik: 'Figural', tipe: 'corak-putar', fig: f, langkah: langkah, pilihan: daftar.map(function (d) { return d.fig; }), kunciIndex: target },
        sidik: { inti: id + '|' + sidikFig(f) + '|' + sj(langkah), param: [], entitas: rc.pola }
      });
      if (!butir) continue;
      butir.gambarPembahasan = bh.gambar;
      butir.pola = id + ':' + rc.pola;
      butir.kategoriRiset = 'pengayaan';
      butir.catatanRiset = CATATAN[id];
      return butir;
    }
    return null;
  }

  // ----------------------------------------------------------- corak-cermin

  function rancangCermin(a, level, dipakai) {
    var id = 'corak-cermin', pola, langkah, spek;
    if (level === 'mudah') {
      pola = pilihPola(a, ['tegak', 'datar'], id, dipakai);
      langkah = [{ jenis: 'cermin', sumbu: pola === 'tegak' ? 90 : 0 }];
      spek = { tak: TAK, arah: ['arsir-0', 'arsir-90', 'kotak', 'kotak-miring'], nArah: [0, 2], n: [4, 6, 8], cincinEmpat: true };
      return { pola: pola, langkah: langkah, spek: spek };
    }
    if (level === 'sedang') {
      pola = pilihPola(a, ['miring', 'garis-tegak'], id, dipakai);
      langkah = [{ jenis: 'cermin', sumbu: pola === 'miring' ? a.pilih([45, 135]) : a.pilih([90, 0]) }];
      spek = Object.assign({}, SPEK_ARAH, { bentuk: pola === 'miring' ? ['persegi', 'belah-ketupat', 'lingkaran', 'segidelapan'] : null });
      return { pola: pola, langkah: langkah, spek: spek };
    }
    pola = pilihPola(a, ['dua-siku', 'dua-miring'], id, dipakai);
    var s1 = a.pilih([90, 0, 45, 135]), s2 = pola === 'dua-siku' ? mod(s1 + 90, 180) : mod(s1 + a.pilih([45, -45]), 180);
    langkah = [{ jenis: 'cermin', sumbu: s1 }, { jenis: 'cermin', sumbu: s2 }];
    spek = Object.assign({}, SPEK_ARAH, { nArah: [2, 4] });
    return { pola: pola, langkah: langkah, spek: spek };
  }

  function pengecohCermin(a, level, f, langkah, kunci) {
    var total = elUrutan(langkah), dua = langkah.length > 1, c = {}, l0 = langkah[0];
    c.arsir = { fig: terapkan(f, total, false), alasan: 'letak setiap bagian sudah benar, tetapi arah garis coraknya tidak ikut ' + (dua ? 'berubah' : 'tercermin') + ': ' + contohArah(f, total) };
    c.tetap = { fig: f, alasan: 'gambar ini sama dengan gambar awal (tidak dicerminkan)' };
    c.tukar = function () { return calonTukar(a, kunci); };
    c.putar = { fig: terapkan(f, el(0, 180)), alasan: 'gambar diputar 180°, bukan dicerminkan' };
    c.putar90 = function () {
      var x = a.pilih([90, 270]), g = terapkan(f, el(0, x));
      return g ? { fig: g, alasan: 'gambar ' + teksSudutC(x) + ', bukan dicerminkan' } : null;
    };
    if (!dua) {
      var lain = [mod(l0.sumbu + 90, 180)].concat(a.kocok([0, 45, 90, 135].filter(function (s) { return s !== l0.sumbu && s !== mod(l0.sumbu + 90, 180); })));
      lain.forEach(function (s, i) {
        c['sumbu' + i] = function () { var g = terapkan(f, elCermin(s)); return g ? { fig: g, alasan: 'gambar dicerminkan terhadap garis ' + NAMA_SUMBU[s] + ', padahal garis cerminnya ' + NAMA_SUMBU[l0.sumbu] } : null; };
      });
      if (level === 'mudah') return susunPengecoh(a, kunci, c, [], ['putar', 'sumbu0', 'tetap', 'tukar'], ['putar90', 'sumbu1', 'sumbu2']);
      return susunPengecoh(a, kunci, c, ['arsir'], ['putar', 'sumbu0', 'tetap', 'tukar'], ['sumbu1', 'putar90', 'sumbu2']);
    }
    var l1 = langkah[1];
    c.cermin1 = { fig: jalankan(f, [l0]), alasan: 'hanya pencerminan terhadap garis 1 yang dikerjakan; pencerminan terhadap garis 2 terlewat' };
    c.cermin2 = { fig: jalankan(f, [l1]), alasan: 'hanya pencerminan terhadap garis 2 yang dikerjakan; pencerminan terhadap garis 1 terlewat' };
    c.urutan = { fig: jalankan(f, [l1, l0]), alasan: 'pencerminan dikerjakan terhadap garis 2 lebih dulu, baru garis 1 (urutannya terbalik)' };
    c.salah = function () {
      var s = mod(l1.sumbu + 90, 180), g = jalankan(f, [l0, { jenis: 'cermin', sumbu: s }]);
      return g ? { fig: g, alasan: 'pencerminan kedua memakai garis ' + NAMA_SUMBU[s] + ', padahal garis 2 ' + NAMA_SUMBU[l1.sumbu] } : null;
    };
    return susunPengecoh(a, kunci, c, total.c === 180 ? [] : ['arsir'], ['cermin1', 'urutan', 'cermin2', 'tukar'], ['putar90', 'salah', 'tetap', 'putar']);
  }

  function buatCermin(id, level, benih, opsi) {
    var a = Rng.alat(Rng.turunan(benih, id, level)), target = opsi.target == null ? a.bulat(0, 4) : opsi.target;
    for (var coba = 0; coba < 30; coba++) {
      var rc = rancangCermin(a, level, opsi.polaDipakai), langkah = rc.langkah, total = elUrutan(langkah);
      var unsur = langkah.map(elLangkah).concat([total, el(0, 180)]);
      var spek = Object.assign({}, rc.spek);
      if (level !== 'mudah') spek.berubah = { e: total.r === 0 && total.c === 180 ? elLangkah(langkah[0]) : total, min: 2 };
      var f = buatBangun(a, spek, unsur);
      if (!f) continue;
      var kunci = jalankan(f, langkah);
      if (!kunci || sidikFig(kunci) === sidikFig(f)) continue;
      var peng = pengecohCermin(a, level, f, langkah, kunci);
      if (!peng) continue;
      var daftar = rakitOpsi(a, peng, kunci, target), dua = langkah.length > 1;
      var namaGaris = dua ? ['garis 1 ' + NAMA_SUMBU[langkah[0].sumbu], 'garis 2 ' + NAMA_SUMBU[langkah[1].sumbu]] : null;
      var bh = bahasLangkah(a, f, langkah, kunci, namaGaris);
      var buka = 'Gambar soal berupa ' + uraiBangun(f) + '. ';
      if (dua) buka += 'Garis cermin 1 ' + NAMA_SUMBU[langkah[0].sumbu] + ' dan garis cermin 2 ' + NAMA_SUMBU[langkah[1].sumbu] + '; gambar dicerminkan terhadap garis 1 lebih dulu, lalu hasilnya terhadap garis 2.';
      else buka += 'Garis cermin putus-putusnya adalah garis ' + NAMA_SUMBU[langkah[0].sumbu] + ' yang melalui titik pusat bangun.';
      var pem = [buka].concat(bh.pem);
      if (dua) pem.push('Dua pencerminan berurutan itu sama dengan satu putaran: hasil akhirnya adalah gambar awal yang ' + teksSudutC(total.c) + '.');
      pem = pem.concat([bh.sebut, 'Jadi gambar hasilnya: ' + uraiIsi(kunci, bh.acuan) + '. Gambar itu adalah opsi ' + Fmt.huruf(target) + '.']);
      var ctx = { subtes: 'ku', submateri: 'figural', keluarga: id, level: level, benih: benih, a: a };
      var butir = Butir.rakitPg(ctx, {
        jenisSoal: 'Figural - Macam-macam Transformasi (pencerminan bangun bercorak)',
        judul: 'Figural - Pencerminan Bangun Bercorak', teks: [], perintah: PERINTAH_CERMIN,
        pertanyaan: dua ? 'Gambar di atas dicerminkan terhadap garis 1, lalu hasilnya dicerminkan terhadap garis 2. Manakah gambar hasil akhirnya?' : 'Manakah bayangan gambar di atas jika dicerminkan terhadap garis putus-putus?',
        gambar: [{ id: 'soal', jenis: 'tcorak-soal', model: { fig: f, langkah: langkah }, judul: 'Bangun bercorak dan garis cerminnya' }],
        pilihanJadi: { opsi: opsiGambar(daftar), kunciIndex: target }, tulisKunci: false,
        langkah: [], pembahasan: pem,
        model: { topik: 'Figural', tipe: 'corak-cermin', fig: f, langkah: langkah, pilihan: daftar.map(function (d) { return d.fig; }), kunciIndex: target },
        sidik: { inti: id + '|' + sidikFig(f) + '|' + sj(langkah), param: [], entitas: rc.pola }
      });
      if (!butir) continue;
      butir.gambarPembahasan = bh.gambar;
      butir.pola = id + ':' + rc.pola;
      butir.kategoriRiset = 'pengayaan';
      butir.catatanRiset = CATATAN[id];
      return butir;
    }
    return null;
  }

  // ------------------------------------------------------------- corak-beda

  function rancangBeda(a, level, dipakai) {
    var id = 'corak-beda', pola, spek, unsur;
    if (level === 'mudah') {
      pola = pilihPola(a, ['ganti', 'tukar'], id, dipakai);
      spek = Object.assign({}, SPEK_TETAP90, { n: [4, 8] });
      unsur = [el(0, 90)];
    } else if (level === 'sedang') {
      pola = pilihPola(a, ['cermin', 'cermin-arsir'], id, dipakai);
      spek = pola === 'cermin' ? Object.assign({}, SPEK_TETAP90) : Object.assign({}, SPEK_ARAH, { nArah: [2, 3] });
      unsur = [el(0, 90), el(1, 0)];
    } else {
      pola = pilihPola(a, ['cermin-45', 'arsir-45'], id, dipakai);
      spek = Object.assign({}, SPEK_ARAH, { n: [8], nArah: [3, 4], bentuk: ['lingkaran', 'segidelapan'] });
      unsur = [el(0, 45), el(1, 0)];
    }
    return { pola: pola, spek: spek, unsur: unsur };
  }

  /** Bangun ganjil (bukan hasil putar f) menurut mekanisme. */
  function buatGanjil(a, pola, f, rot) {
    var orbit = {};
    // orbit memakai SEMUA putaran sah (pemeriksa juga mencoba semuanya), bukan hanya putaran tingkat ini
    putaranSah(f).forEach(function (c) { orbit[sidikFig(terapkan(f, el(0, c)))] = 1; });
    var hasil = null;
    for (var coba = 0; coba < 20 && !hasil; coba++) {
      var g = null, ket = null, ubah = [];
      if (pola === 'ganti') {
        var k = a.bulat(0, f.n - 1), pool = TAK.concat(KOTAK).filter(function (x) { return x !== f.corak[k] && x !== f.corak[(k + 1) % f.n] && x !== f.corak[mod(k - 1, f.n)] && (f.n !== 6 || !Corak.berarah(x)); });
        var baru = a.pilih(pool), c2 = f.corak.slice();
        c2[k] = baru;
        g = fig(f.bentuk, f.n, f.awal, c2, f.cincin, f.penanda);
        ket = { jenis: 'ganti', k: k, dari: f.corak[k], ke: baru };
        ubah = [k];
      } else if (pola === 'tukar') {
        var i = a.bulat(0, f.n - 1), j = mod(i + a.pilih([1, 2]), f.n);
        if (f.corak[i] === f.corak[j]) continue;
        g = tukarBagian(f, i, j);
        ket = { jenis: 'tukar', i: i, j: j };
        ubah = [i, j];
      } else if (pola === 'cermin' || pola === 'cermin-arsir' || pola === 'cermin-45') {
        g = terapkan(f, elCermin(a.pilih([90, 0])));
        ket = { jenis: 'cermin' };
      } else {
        var cs = rot.filter(function (c) { return c !== 0 && sidikFig(terapkan(f, el(0, c), false)) !== sidikFig(terapkan(f, el(0, c))); });
        if (!cs.length) return null;
        var cA = a.pilih(cs);
        g = terapkan(f, el(0, cA), false);
        ket = { jenis: 'arsir', c: cA };
      }
      if (!g || orbit[sidikFig(g)]) continue;
      hasil = { fig: g, ket: ket, ubah: ubah };
    }
    return hasil;
  }

  function buatBeda(id, level, benih, opsi) {
    var a = Rng.alat(Rng.turunan(benih, id, level)), target = opsi.target == null ? a.bulat(0, 4) : opsi.target;
    for (var coba = 0; coba < 30; coba++) {
      var rc = rancangBeda(a, level, opsi.polaDipakai);
      var f = buatBangun(a, rc.spek, rc.unsur);
      if (!f) continue;
      // mudah dan sedang: putaran kelipatan 90°; sulit: kelipatan 45°
      var rot = putaranSah(f).filter(function (c) { return level === 'sulit' || bulat(c / 90); });
      if (rot.length < 4) continue;
      if (rc.pola === 'cermin-arsir' && !f.corak.some(function (k) { return /^arsir/.test(k); })) continue;
      var gj = buatGanjil(a, rc.pola, f, rot);
      if (!gj) continue;
      // empat putaran berbeda untuk bangun yang sama, satu putaran untuk bangun ganjil
      var sudut = rot.length === 4 ? a.kocok(rot) : a.ambil(rot, 4), cG = a.pilih(rot);
      var sama = sudut.map(function (c) { return terapkan(f, el(0, c)); });
      var ganjil = terapkan(gj.fig, el(0, cG));
      if (!ganjil) continue;
      var lihat = {}, ok = true;
      sama.concat([ganjil]).forEach(function (g) { var s = sidikFig(g); if (lihat[s]) ok = false; lihat[s] = 1; });
      if (!ok) continue;
      var daftar = sama.map(function (g) { return { fig: g, alasan: null, kunci: false } });
      daftar.splice(target, 0, { fig: ganjil, alasan: null, kunci: true });
      var sudutOpsi = sudut.slice();
      sudutOpsi.splice(target, 0, cG);
      // acuan: opsi bukan kunci pertama; patokan: bagian berkode unik yang tidak diubah mekanisme
      var acuan = target === 0 ? 1 : 0;
      var hitung = {};
      f.corak.forEach(function (k) { hitung[k] = (hitung[k] || 0) + 1; });
      var calonP = f.corak.map(function (k, i) { return i; }).filter(function (i) { return hitung[f.corak[i]] === 1 && gj.ubah.indexOf(i) < 0 && !Corak.berarah(f.corak[i]); });
      if (!calonP.length) calonP = f.corak.map(function (k, i) { return i; }).filter(function (i) { return hitung[f.corak[i]] === 1 && gj.ubah.indexOf(i) < 0; });
      if (!calonP.length) continue;
      var pk = calonP[0];
      // putaran penyelaras tiap opsi ke arah opsi acuan (bangun sama: tepat; ganjil: yang paling banyak cocok)
      var ref = daftar[acuan].fig, putar = [], patok = [], beda = [];
      var cRef = sudutOpsi[acuan];
      daftar.forEach(function (d, i) {
        if (!d.kunci) { putar.push(mod(cRef - sudutOpsi[i], 360)); return; }
        var terbaik = null, nilai = -1;
        rot.forEach(function (c) {
          var g = terapkan(d.fig, el(0, c));
          if (!g) return;
          var cocok = 0;
          g.corak.forEach(function (k, q) { if (k === ref.corak[q]) cocok++; });
          var pas = g.corak.some(function (k, q) { return k === f.corak[pk] && ref.corak[q] === k; }) ? 100 : 0;
          if (cocok + pas > nilai) { nilai = cocok + pas; terbaik = c; }
        });
        putar.push(terbaik);
      });
      if (putar.some(function (c) { return c == null; })) continue;
      var selaras = daftar.map(function (d, i) { return terapkan(d.fig, el(0, putar[i])); });
      if (selaras.some(function (g, i) { return !daftar[i].kunci && sidikFig(g) !== sidikFig(ref); })) continue;
      selaras.forEach(function (g) { var q = g.corak.indexOf(f.corak[pk]); patok.push(q); });
      var gK = selaras[target];
      gK.corak.forEach(function (k, q) { if (k !== ref.corak[q]) beda.push(q); });
      if (gK.cincin && sj(gK.cincin) !== sj(ref.cincin)) { /* perbedaan di lingkaran tengah disebut di teks */ }
      if (!beda.length && sj(gK) === sj(ref)) continue;
      var huruf = Fmt.huruf(target), hRef = Fmt.huruf(acuan), namaP = Corak.nama(f.corak[pk]);
      var lain = [];
      daftar.forEach(function (d, i) { if (!d.kunci && i !== acuan) lain.push('gambar ' + Fmt.huruf(i) + ' (' + teksSudutC(putar[i]) + ')'); });
      var pem = ['Kelima gambar berupa ' + uraiBangun(f) + '. Empat di antaranya adalah bangun yang sama dalam posisi putar yang berbeda, jadi setiap gambar perlu diputar ke arah yang sama sebelum dibandingkan.',
        'Pakai bagian ' + namaP + ' sebagai patokan dan gambar ' + hRef + ' sebagai acuan. Putar setiap gambar sampai bagian ' + namaP + ' berada di ' + letak(f.n, f.awal, patok[acuan]) + ' seperti pada gambar ' + hRef + ', lalu bandingkan corak bagian-bagian lainnya, termasuk arah garisnya.',
        'Setelah diputar, ' + gabungKata(lain) + ' sama persis dengan gambar ' + hRef + '.'];
      var kal, ket = gj.ket;
      if (ket.jenis === 'cermin') {
        var urut = function (g) { var q = g.corak.indexOf(f.corak[pk]), d = []; for (var t = 0; t < g.n; t++) d.push(SEDANG[g.corak[(q + t) % g.n]]); return d.join(', '); };
        var gAsli = daftar[target].fig;
        kal = 'Gambar ' + huruf + ' tidak dapat dibuat sama dengan gambar ' + hRef + ' walaupun diputar: mulai dari bagian ' + namaP + ' dan bergerak searah jarum jam, urutan corak gambar ' + hRef + ' adalah ' + urut(ref) + ', sedangkan pada gambar ' + huruf + ' adalah ' + urut(gAsli) + '. Urutannya terbalik, karena gambar ' + huruf + ' adalah bayangan cermin dari bangun itu.';
      } else if (ket.jenis === 'tukar') {
        kal = 'Setelah diputar dengan cara yang sama, gambar ' + huruf + ' berbeda pada dua bagian: bagian ' + letak(f.n, f.awal, beda[0]) + ' dan ' + letak(f.n, f.awal, beda[1]) + ' berisi ' + Corak.nama(gK.corak[beda[0]]) + ' dan ' + Corak.nama(gK.corak[beda[1]]) + ', padahal pada gambar ' + hRef + ' keduanya ' + Corak.nama(ref.corak[beda[0]]) + ' dan ' + Corak.nama(ref.corak[beda[1]]) + '. Kedua corak itu bertukar tempat.';
      } else if (ket.jenis === 'ganti') {
        kal = 'Setelah diputar dengan cara yang sama, gambar ' + huruf + ' berbeda pada satu bagian: bagian ' + letak(f.n, f.awal, beda[0]) + ' berisi ' + Corak.nama(gK.corak[beda[0]]) + ', padahal pada gambar ' + hRef + ' bagian itu ' + Corak.nama(ref.corak[beda[0]]) + '.';
      } else {
        kal = 'Setelah diputar dengan cara yang sama, letak semua corak pada gambar ' + huruf + ' sama dengan gambar ' + hRef + ', tetapi arah garisnya berbeda: bagian ' + letak(f.n, f.awal, beda[0]) + ' ' + Corak.nama(gK.corak[beda[0]]) + ', padahal pada gambar ' + hRef + ' ' + Corak.nama(ref.corak[beda[0]]) + '. Artinya, arah garis arsir pada gambar ' + huruf + ' tidak ikut berputar bersama bagiannya.';
      }
      if (!beda.length) continue;
      pem.push(kal);
      pem.push('Gambar 1 memperlihatkan kelima gambar seperti tercetak (baris atas) dan setelah diputar searah gambar ' + hRef + ' (baris bawah); bagian patokan bergaris biru' + (beda.length * 2 <= f.n ? ', dan bagian gambar ' + huruf + ' yang tidak cocok disorot jingga.' : ', dan gambar ' + huruf + ' tetap tidak cocok dengan gambar ' + hRef + ' (bingkai jingga).'));
      pem.push('Jadi gambar yang berbeda sendiri adalah gambar ' + huruf + '.');
      // alasan tiap opsi bangun sama (tidak dicetak): bangun itu memang hasil putar acuan
      daftar.forEach(function (d, i) { if (!d.kunci) d.alasan = 'Gambar ' + Fmt.huruf(i) + ' adalah bangun yang sama dengan gambar lainnya, hanya ' + (putar[i] === 0 ? 'sudah searah gambar acuan' : teksSudutC(mod(-putar[i], 360)) + ' dari arah gambar acuan') + '.'; });
      var ctx = { subtes: 'ku', submateri: 'figural', keluarga: id, level: level, benih: benih, a: a };
      var butir = Butir.rakitPg(ctx, {
        jenisSoal: 'Figural - Macam-macam Transformasi (gambar yang berbeda)',
        judul: null, teks: [], perintah: PERINTAH_BEDA, pertanyaan: 'Manakah gambar yang berbeda sendiri?',
        gambar: [],
        pilihanJadi: { opsi: opsiGambar(daftar), kunciIndex: target }, tulisKunci: false,
        langkah: [], pembahasan: pem,
        model: { topik: 'Figural', tipe: 'corak-beda', pilihan: daftar.map(function (d) { return d.fig; }), kunciIndex: target },
        sidik: { inti: id + '|' + sidikFig(f) + '|' + rc.pola + '|' + sidikFig(gj.fig), param: [], entitas: rc.pola }
      });
      if (!butir) continue;
      butir.gambarPembahasan = [{ id: 'bahas-1', jenis: 'tcorak-beda', judul: 'Gambar 1. Kelima gambar diputar searah gambar ' + hRef,
        model: { pilihan: daftar.map(function (d) { return d.fig; }), putar: putar, acuan: acuan, kunci: target, patok: patok, beda: beda, ketKunci: ket.jenis === 'cermin' ? 'urutan terbalik' : 'tidak cocok', jawaban: ganjil } }];
      butir.pola = id + ':' + rc.pola;
      butir.kategoriRiset = 'pengayaan';
      butir.catatanRiset = CATATAN[id];
      return butir;
    }
    return null;
  }

  // ------------------------------------------------------------------ ekspor

  function buat(id, level, benih, opsi) {
    opsi = opsi || {};
    if (id === 'corak-putar') return buatPutar(id, level, benih, opsi);
    if (id === 'corak-cermin') return buatCermin(id, level, benih, opsi);
    if (id === 'corak-beda') return buatBeda(id, level, benih, opsi);
    return null;
  }

  var KELUARGA = [
    { id: 'corak-putar', nama: 'Rotasi bangun bercorak (corak ikut berputar)', submateri: 'figural', kolam: 'serial' },
    { id: 'corak-cermin', nama: 'Pencerminan bangun bercorak (corak ikut tercermin)', submateri: 'figural', kolam: 'serial' },
    { id: 'corak-beda', nama: 'Bangun bercorak yang berbeda sendiri (empat hanya diputar)', submateri: 'figural', kolam: 'serial' }
  ];

  return {
    KELUARGA: KELUARGA, buat: buat,
    GAMBAR: { 'tcorak-soal': svgSoal, 'tcorak-opsi': svgOpsi, 'tcorak-tahap': svgTahap, 'tcorak-arsir': svgArsir, 'tcorak-beda': svgBeda },
    // untuk uji dan pratinjau
    terapkan: terapkan, asimetris: asimetris
  };
});
