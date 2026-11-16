/*
 * serial-corak.js — Kemampuan Umum > Figural > Serial "The Next Box" BERCORAK: dua keluarga pengayaan,
 * keduanya deret 4-5 kotak tampak lalu kotak "?". Gaya visual mengikuti matriks 2x2 bersekat (contoh riset
 * BAB V soal 4): bangun tegas yang dibagi menjadi beberapa bagian, dan tiap bagian berisi satu corak
 * (corak.js: hitam, putih, titik, bintang, bulatan, kotak-kotak, garis).
 *
 * Bangun (`fig`, juga isi gambar opsi): { tata, luar, n, awal, lapis: [[kode corak per bagian], ...] }
 *   tata 'sinar'    satu lapis: bangun luar (persegi, lingkaran, belah ketupat, segienam, segidelapan) dibagi
 *                   n = 4, 6, atau 8 bagian oleh sinar dari pusat mulai sudut `awal` (0 = atas, searah jarum jam)
 *   tata 'sekat'    persegi bersekat seperti matriks-sekat: lapis 0 = 4 segitiga dalam, lapis 1 = 4 segitiga pojok
 *   tata 'bingkai'  persegi berbingkai: lapis 0 = 4 segitiga persegi tengah, lapis 1 = 4 trapesium bingkai
 *   tata 'cincin'   lingkaran dengan persegi/belah ketupat di dalamnya: lapis 0 = 4 segitiga dalam, lapis 1 =
 *                   4 bagian cincin luar
 * Bagian tiap lapis bernomor 0..n-1 searah jarum jam dan sama besar sudutnya, jadi "berpindah k bagian" sama
 * dengan berputar k x 360/n derajat.
 *
 *   serial-corak-putar  CORAK BERPINDAH ANTARBAGIAN
 *     mudah   tetap-satu    semua corak satu lapis berpindah k bagian searah/berlawanan jarum jam tiap kotak
 *             tetap-utuh    bangun dua lapis; kedua lapis berpindah bersama 1 bagian
 *     sedang  dua-arah      dua lapis berpindah 1 bagian dengan arah berlawanan
 *             dua-langkah   dua lapis searah dengan langkah berbeda (1 dan 2 bagian)
 *             lapis-diam    satu lapis berpindah, lapis lainnya tetap
 *             dua-kelompok  bagian bernomor ganjil dan genap (bangun 6 bagian) berpindah berlawanan arah
 *     sulit   bertambah     langkah bertambah 1 bagian tiap kotak (1, 2, 3, ... atau 2, 3, 4, ...)
 *             bergantian    langkah bergantian (1, 2, 1, 2, ... bagian)
 *             satu-diam     satu corak diam, corak lainnya berpindah sambil melompati bagian itu
 *             berarah       perputaran kaku 90° atau 45°: corak bergaris dan berkotak ikut berputar arahnya
 *                           (satu lapis, atau dua lapis berlawanan arah)
 *   serial-corak-ganti  CORAK BERGANTI MENGIKUTI SIKLUS
 *     mudah   siklus-satu   tiap bagian berganti corak menurut satu urutan tetap (3-4 corak), fasenya berbeda
 *             jalar         banyak bagian hitam bertambah satu tiap kotak ke satu arah, bagian lain tetap
 *     sedang  dua-lapis     dua lapis dengan siklus corak sendiri-sendiri
 *             dua-kelompok  bagian ganjil dan genap mengikuti siklus berbeda (satu kelompok boleh tetap)
 *     sulit   siklus-putar  corak berganti menurut siklus DAN seluruh susunan berpindah
 *             bentuk-putar  bentuk luar berganti bergantian (2-3 bentuk) DAN corak berpindah
 *             bentuk-siklus bentuk luar berganti bergantian DAN corak berganti menurut siklus
 *             siklus-geser  satu lapis berganti corak menurut siklus, lapis lainnya berpindah
 *
 * Penyusun menolak deret yang ambigu. Pustaka aturan per lapis — pergeseran berlangkah tetap/bertambah/
 * bergantian dengan arah corak tetap atau ikut berputar; pergeseran disertai penggantian corak yang tetap
 * (fungsi corak -> corak); satu bagian diam; siklus tertutup atas semua corak yang tampak dengan langkah
 * berpola, boleh disertai pergeseran; hitam menjalar; deret berulang — dan pola bentuk luar dicocokkan
 * dengan kotak yang tampak, dan soal hanya dipakai bila SEMUA aturan yang cocok meramalkan kotak berikutnya
 * yang sama (mis. susunan simetris yang membuat dua aturan meramalkan susunan berbeda ditolak). Pemeriksa
 * independennya ada di cek-serial-corak.js.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./rng.js'), require('./svg.js'), require('./butir.js'), require('./format.js'), require('./metrik.js'), require('./corak.js'), require('./bentuk.js'));
    module.exports = api;
  } else {
    api = factory(root.Rng, root.Svg, root.Butir, root.Fmt, root.Metrik, root.Corak, root.Bentuk);
    root.SerialCorak = api;
  }
})(typeof self !== 'undefined' ? self : this, function (Rng, S, Butir, Fmt, Metrik, Corak, Bentuk) {
  'use strict';

  var PERINTAH = 'Gunakan gambar di bagian atas untuk menentukan jawaban yang benar dari pilihan di bawah. Pilih jawaban yang menggantikan tanda tanya. Jika tidak ada tanda tanya, pilih jawaban yang merupakan kelanjutan dari urutan tersebut.';
  var TINTA = '#1d1d1d', TEPI = '#4a5266', TANYA = '#f4f6fb';
  var BH = S.BAHAS, WARNA = [BH.sorot, BH.panah, '#8e44ad', '#0e7c86'];
  var NONARAH = ['hitam', 'putih', 'titik', 'bintang', 'bulatan'];
  var ARSIR = ['arsir-0', 'arsir-45', 'arsir-90', 'arsir-135'];
  var KOTAK = ['kotak', 'kotak-miring'];
  var DASAR_JALAR = ['putih', 'titik', 'bintang', 'kotak', 'kotak-miring', 'arsir-0', 'arsir-45', 'arsir-90', 'arsir-135'];
  var RASIO = 0.44;                                      // jari bangun terhadap sisi kotak
  var NAMA_BENTUK = { persegi: 'persegi', lingkaran: 'lingkaran', 'belah-ketupat': 'belah ketupat', segienam: 'segienam', segidelapan: 'segidelapan' };

  // tata satu lapis; `kaku` = bentuk luarnya tidak berubah bila diputar 360/n derajat (boleh perputaran kaku)
  var SINAR = [
    { luar: 'persegi', n: 4, awal: -45, nama: 'persegi yang dibagi kedua diagonalnya menjadi 4 segitiga', kaku: true },
    { luar: 'persegi', n: 4, awal: 0, nama: 'persegi yang dibagi menjadi 4 persegi kecil', kaku: true },
    { luar: 'belah-ketupat', n: 4, awal: 0, nama: 'belah ketupat yang dibagi menjadi 4 segitiga', kaku: true },
    { luar: 'lingkaran', n: 4, awal: 0, nama: 'lingkaran yang dibagi menjadi 4 juring', kaku: true },
    { luar: 'lingkaran', n: 4, awal: -45, nama: 'lingkaran yang dibagi menjadi 4 juring', kaku: true },
    { luar: 'segienam', n: 6, awal: 30, nama: 'segienam yang dibagi menjadi 6 segitiga', kaku: true },
    { luar: 'segienam', n: 6, awal: 0, nama: 'segienam yang dibagi menjadi 6 layang-layang', kaku: true },
    { luar: 'lingkaran', n: 6, awal: 0, nama: 'lingkaran yang dibagi menjadi 6 juring', kaku: true },
    { luar: 'lingkaran', n: 6, awal: 30, nama: 'lingkaran yang dibagi menjadi 6 juring', kaku: true },
    { luar: 'persegi', n: 8, awal: 0, nama: 'persegi yang dibagi menjadi 8 segitiga', kaku: false },
    { luar: 'segidelapan', n: 8, awal: 22.5, nama: 'segidelapan yang dibagi menjadi 8 segitiga', kaku: true },
    { luar: 'segidelapan', n: 8, awal: 0, nama: 'segidelapan yang dibagi menjadi 8 layang-layang', kaku: true },
    { luar: 'lingkaran', n: 8, awal: 0, nama: 'lingkaran yang dibagi menjadi 8 juring', kaku: true },
    { luar: 'lingkaran', n: 8, awal: 22.5, nama: 'lingkaran yang dibagi menjadi 8 juring', kaku: true }
  ].map(function (t) { t.tata = 'sinar'; return t; });

  // tata dua lapis (n = 4): lapis 0 di dalam, lapis 1 di luar
  var DUA = [
    { tata: 'sekat', luar: 'persegi', n: 4, awal: -90, kaku: true, lapis: ['segitiga dalam', 'segitiga pojok'], pendek: ['dalam', 'pojok'],
      nama: 'persegi bersekat (dua garis tengah dan belah ketupat di dalamnya) yang terbagi menjadi 4 segitiga dalam dan 4 segitiga pojok' },
    { tata: 'bingkai', luar: 'persegi', n: 4, awal: -45, kaku: true, lapis: ['segitiga dalam', 'trapesium bingkai'], pendek: ['dalam', 'bingkai'],
      nama: 'persegi berbingkai: persegi tengahnya terbagi menjadi 4 segitiga dalam dan bingkainya terbagi menjadi 4 trapesium' },
    { tata: 'cincin', luar: 'lingkaran', n: 4, awal: -45, kaku: true, lapis: ['segitiga dalam', 'bagian cincin luar'], pendek: ['dalam', 'cincin'],
      nama: 'lingkaran dengan persegi di dalamnya: persegi itu terbagi menjadi 4 segitiga dalam dan cincin di luarnya terbagi menjadi 4 bagian' },
    { tata: 'cincin', luar: 'lingkaran', n: 4, awal: 0, kaku: true, lapis: ['segitiga dalam', 'bagian cincin luar'], pendek: ['dalam', 'cincin'],
      nama: 'lingkaran dengan belah ketupat di dalamnya: belah ketupat itu terbagi menjadi 4 segitiga dalam dan cincin di luarnya terbagi menjadi 4 bagian' }
  ];

  /** Bentuk luar yang pembagiannya serasi dengan (n, awal), untuk bentuk luar yang berganti. */
  function bentukSerasi(n, awal) {
    if (n === 4) return ['persegi', 'lingkaran', 'belah-ketupat'];
    if (n === 6) return ['segienam', 'lingkaran'];
    return awal === 0 ? ['persegi', 'lingkaran', 'segidelapan'] : ['segidelapan', 'lingkaran'];
  }

  // ------------------------------------------------------------------ alat umum

  function mod(a, n) { return ((a % n) + n) % n; }
  function rentang(n) { var r = []; for (var i = 0; i < n; i++) r.push(i); return r; }
  function sj(x) { return JSON.stringify(x); }
  function kunciArr(A) { return A.join(','); }
  function ulang(x, V) { return rentang(V).map(function () { return x; }); }
  function kum(s, t) { var K = 0; for (var u = 0; u < t; u++) K += s[u]; return K; }
  function daftarKata(xs) { return Fmt.daftarKata(xs); }
  function nama(c) { return Corak.nama(c); }
  function arahKata(k) { return k > 0 ? 'searah jarum jam' : 'berlawanan arah jarum jam'; }
  function langkahKata(k, n) {
    if (n && mod(k, n) * 2 === n) return (n / 2) + ' bagian (ke bagian seberangnya)';
    return Math.abs(k) + ' bagian ' + arahKata(k);
  }
  function tandaLangkah(k) { return k === 0 ? 'tetap' : (k > 0 ? '+' : '-') + Math.abs(k); }

  function buatFig(tt, luar, lapis) {
    return { tata: tt.tata, luar: luar, n: tt.n, awal: tt.awal, lapis: lapis.map(function (A) { return A.slice(); }) };
  }

  function teksB(s, x, y, o) {
    o = o || {};
    return S.teks(s, x, y, { ukuran: o.ukuran || 11, tebal: o.tebal, isi: o.isi || BH.teks, rata: o.rata });
  }

  function paragrafB(s, x, y, lebar, o) {
    o = o || {};
    var uk = o.ukuran || 11, baris = Metrik.penggal(s, lebar, uk, o.tebal);
    return { svg: baris.map(function (b, i) { return teksB(b, x, y + i * (uk + 3), o); }).join(''), baris: baris.length };
  }

  function lebarJudul(judul, W) { return Math.max(W, Math.ceil(Metrik.lebar(judul, 13, true)) + 18); }

  // --------------------------------------------------------------- geometri

  /** Bagian poligon q di sisi luar garis yang berjarak d dari pusat dengan arah normal `sudut`. */
  function potongLuar(q, cx, cy, sudut, d) {
    var t = sudut * Math.PI / 180, ux = Math.sin(t), uy = -Math.cos(t);
    return Bentuk.potongBidang(q, ux, uy, ux * cx + uy * cy + d);
  }

  /** Poligon garis luar dan poligon setiap bagian per lapis. */
  function geom(f, cx, cy, s) {
    var k, dalam, luarP, bagLuar;
    if (f.tata === 'sinar') {
      var P = Corak.bentuk(f.luar, cx, cy, s);
      return { luar: P, lapis: [Corak.bagi(P, cx, cy, f.n, f.awal)] };
    }
    if (f.tata === 'sekat') {
      var h = 0.8 * s, x0 = cx - h, x1 = cx + h, y0 = cy - h, y1 = cy + h, c = [cx, cy];
      var at = [cx, y0], ka = [x1, cy], bw = [cx, y1], ki = [x0, cy];
      return {
        luar: [[x0, y0], [x1, y0], [x1, y1], [x0, y1]],
        lapis: [[[c, ki, at], [c, at, ka], [c, ka, bw], [c, bw, ki]],
          [[[x0, y0], at, ki], [[x1, y0], ka, at], [[x1, y1], bw, ka], [[x0, y1], ki, bw]]]
      };
    }
    if (f.tata === 'bingkai') {
      var ho = 0.8 * s, hi = 0.44 * s;
      luarP = [[cx - ho, cy - ho], [cx + ho, cy - ho], [cx + ho, cy + ho], [cx - ho, cy + ho]];
      dalam = Corak.bagi([[cx - hi, cy - hi], [cx + hi, cy - hi], [cx + hi, cy + hi], [cx - hi, cy + hi]], cx, cy, 4, f.awal);
      bagLuar = Corak.bagi(luarP, cx, cy, 4, f.awal).map(function (q, j) { return potongLuar(q, cx, cy, f.awal + (j + 0.5) * 90, hi); });
      return { luar: luarP, lapis: [dalam, bagLuar] };
    }
    // cincin
    var R = 0.86 * s, ri = 0.68 * R, pi = [];
    luarP = Corak.bentuk('lingkaran', cx, cy, s);
    for (k = 0; k < 4; k++) pi.push(Corak.titikArah(cx, cy, ri, f.awal + k * 90));
    dalam = Corak.bagi(pi, cx, cy, 4, f.awal);
    bagLuar = rentang(4).map(function (j) {
      return potongLuar(Corak.sektor(cx, cy, R, f.awal + j * 90, f.awal + (j + 1) * 90), cx, cy, f.awal + (j + 0.5) * 90, ri * Math.SQRT1_2);
    });
    return { luar: luarP, lapis: [dalam, bagLuar] };
  }

  // --------------------------------------------------------------- menggambar

  /**
   * Bangun bercorak berpusat di (cx, cy) berjari s.
   * o: { skala, tebal, tebalLuar, kosong (semua bagian putih), nomor (nomor bagian), sorot: [{lapis, pos, warna, putus, tebal}] }
   */
  function figSvg(f, cx, cy, s, o) {
    o = o || {};
    var g = geom(f, cx, cy, s), bagian = [], out = [];
    g.lapis.forEach(function (ps, l) { ps.forEach(function (p, i) { bagian.push({ poli: p, kode: o.kosong ? 'putih' : f.lapis[l][i] }); }); });
    out.push(Corak.gambar(bagian, { luar: g.luar, skala: o.skala || 1, tebal: o.tebal || 1.7, tebalLuar: o.tebalLuar || 2.6 }));
    (o.sorot || []).forEach(function (h) {
      out.push(S.poli(g.lapis[h.lapis][h.pos], { tutup: true, isi: 'none', garis: h.warna, tebal: h.tebal || 3.4, sambung: 'round', putus: h.putus }));
    });
    if (o.nomor) {
      g.lapis.forEach(function (ps) {
        ps.forEach(function (p, i) {
          var c = Bentuk.beratTitik(p);
          out.push(S.lingkaran(c[0], c[1], 7, { isi: '#ffffff', garis: TEPI, tebal: 1 }));
          out.push(S.teks(String(i + 1), c[0], c[1] + 3.6, { ukuran: 10, tebal: true, isi: BH.teks, rata: 'middle' }));
        });
      });
    }
    return out.join('');
  }

  function kotakSvg(f, x, y, B, o) {
    o = o || {};
    return S.rect(x, y, B, B, { isi: o.latar || '#ffffff', garis: o.tepi || TEPI, tebal: o.tebalTepi || 1.6 }) +
      figSvg(f, x + B / 2, y + B / 2, B * RASIO, o);
  }

  function kotakTanya(x, y, B) {
    return S.rect(x, y, B, B, { isi: TANYA, garis: TEPI, tebal: 1.6 }) +
      S.teks('?', x + B / 2, y + B / 2 + B * 0.17, { ukuran: Math.round(B * 0.48), tebal: true, isi: TEPI, rata: 'middle' });
  }

  function ukuranKotak(V) { return V >= 5 ? 108 : 118; }

  /** Gambar soal: kotak-kotak yang tampak lalu kotak "?". */
  function svgDeret(m) {
    var V = m.kotak.length, B = m.ukuran || ukuranKotak(V), gap = V >= 5 ? 10 : 12, pad = 6, o = [];
    m.kotak.forEach(function (f, i) { o.push(kotakSvg(f, pad + i * (B + gap), pad, B, { skala: 0.9 })); });
    o.push(kotakTanya(pad + V * (B + gap), pad, B));
    var W = pad * 2 + (V + 1) * B + V * gap, H = pad * 2 + B;
    return { svg: S.doc(o.join(''), W, H, { latar: '#ffffff' }), lebar: W, tinggi: H };
  }

  /** Pilihan jawaban: satu kotak. */
  function svgOpsi(m) {
    var B = 150, pad = 5, W = B + pad * 2;
    return { svg: S.doc(kotakSvg(m.fig, pad, pad, B, { skala: 1 }), W, W, { latar: '#ffffff' }), lebar: W, tinggi: W };
  }

  // --------------------------------------------------------- gambar pembahasan

  /*
   *   scorak-jejak   semua kotak (termasuk jawaban berlatar hijau muda); corak acuan tiap lapis digaris tepi
   *                  berwarna dan busur berpanah di tiap kotak menunjukkan perpindahannya dari kotak sebelumnya;
   *                  bagian yang diam digaris tepi merah putus-putus; besar langkah ditulis di bawah kotak
   *   scorak-tahap   kotak terakhir -> (tahap antara) -> kotak jawaban, dengan nomor bagian dan uraian
   *   scorak-tabel   peta nomor bagian dan tabel corak setiap bagian pada setiap kotak (kolom jawaban hijau)
   *   scorak-siklus  urutan corak (dan urutan bentuk luar) yang berulang, dengan panah kembali ke awal
   */
  function svgJejak(m, judul) {
    var V = m.kotak.length, B = V >= 5 ? 100 : 110, gap = 14, pad = 8, y0 = pad + 26 + 16;
    var semua = m.kotak.concat([m.jawaban]), o = [teksB(judul, pad, pad + 13, { ukuran: 13, tebal: true })];
    var W0 = pad * 2 + (V + 1) * B + V * gap, W = lebarJudul(judul, W0), banyakLabel = 0;
    // semua busur di luar bangun (lapis luar paling dekat), jadi bangun diperkecil secukupnya
    var rho = 0, nBusur = m.jejak.length;
    geom(m.kotak[0], 0, 0, 1).luar.forEach(function (q) { rho = Math.max(rho, Math.hypot(q[0], q[1])); });
    m.kotak.forEach(function (f) { geom(f, 0, 0, 1).luar.forEach(function (q) { rho = Math.max(rho, Math.hypot(q[0], q[1])); }); });
    var sJ = Math.min(B * 0.36, (B / 2 - 4 - 5 * nBusur) / rho);
    semua.forEach(function (f, t) {
      var x = pad + t * (B + gap), jawab = t === V, cx = x + B / 2, cy = y0 + B / 2, s = sJ, sorot = [];
      (m.tetap || []).forEach(function (h) { sorot.push({ lapis: h.lapis, pos: h.pos, warna: BH.acuan, putus: '5 3', tebal: 2.6 }); });
      m.jejak.forEach(function (j) { if (j.pos[t] != null) sorot.push({ lapis: j.lapis, pos: j.pos[t], warna: WARNA[j.warna], tebal: 3 }); });
      o.push(S.rect(x, y0, B, B, { isi: jawab ? BH.latarJawab : '#ffffff', garis: jawab ? BH.jawab : TEPI, tebal: jawab ? 2.6 : 1.6 }));
      o.push(figSvg(f, cx, cy, s, { skala: 0.75, sorot: sorot, tebal: 1.4, tebalLuar: 2.2 }));
      if (t > 0) {
        // busur di luar bangun supaya langkah 45°-60° tetap terlihat; lapis luar paling dekat ke bangun
        var w = 360 / f.n, urutJ = m.jejak.slice().sort(function (p, q) { return q.lapis - p.lapis; });
        urutJ.forEach(function (j, i) {
          var d = j.geser[t - 1], p0 = j.pos[t - 1];
          if (!d || p0 == null) return;
          var a0 = f.awal + (p0 + 0.5) * w;
          o.push(S.busurPanah(cx, cy, rho * sJ + 5 + 5 * i, a0, a0 + d * w, { warna: WARNA[j.warna], tebal: 2.3, kepala: 7, halo: true }));
        });
        var lb = m.label[t - 1] || [];
        banyakLabel = Math.max(banyakLabel, lb.length);
        lb.forEach(function (x2, k) { o.push(teksB(x2.teks, cx, y0 + B + 15 + k * 14, { ukuran: 11, tebal: true, rata: 'middle', isi: x2.warna == null ? BH.teksRedup : WARNA[x2.warna] })); });
      }
      o.push(teksB(jawab ? 'Kotak ' + (t + 1) + ' (jawaban)' : 'Kotak ' + (t + 1), cx, y0 - 6, { ukuran: 11, tebal: true, rata: 'middle', isi: jawab ? BH.jawab : BH.teks }));
    });
    var y = y0 + B + 15 + banyakLabel * 14 + 4;
    (m.catatan || []).forEach(function (c) {
      var p = paragrafB(c, pad, y, W - 2 * pad, { ukuran: 10, isi: BH.teksRedup });
      o.push(p.svg);
      y += p.baris * 13 + 2;
    });
    var H = y + pad - 6;
    return { svg: S.doc(o.join(''), W, H, { latar: '#ffffff' }), lebar: W, tinggi: H };
  }

  function svgTahap(m, judul) {
    var P = 140, gap = 84, pad = 8, y0 = pad + 26 + 18, k = m.panel.length;
    var W0 = pad * 2 + k * P + (k - 1) * gap, W = lebarJudul(judul, Math.max(W0, 430)), x0 = pad + (W - W0) / 2;
    var o = [teksB(judul, pad, pad + 13, { ukuran: 13, tebal: true })];
    m.panel.forEach(function (p, i) {
      var x = x0 + i * (P + gap);
      o.push(teksB(p.judul, x + P / 2, y0 - 7, { ukuran: 11, tebal: true, rata: 'middle', isi: p.jawab ? BH.jawab : BH.teks }));
      o.push(S.rect(x, y0, P, P, { isi: p.jawab ? BH.latarJawab : '#ffffff', garis: p.jawab ? BH.jawab : TEPI, tebal: p.jawab ? 2.6 : 1.6 }));
      o.push(figSvg(p.fig, x + P / 2, y0 + P / 2, P * 0.42, { skala: 0.95, nomor: p.nomor, sorot: p.sorot }));
      if (i < k - 1) {
        var xa = x + P + 8, xb = x + P + gap - 8, ya = y0 + P / 2 + 18;
        o.push(S.panah(xa, ya, xb, ya, { warna: BH.panah, tebal: 2.2, kepala: 9 }));
        var bar = Metrik.penggal(m.panah[i] || '', gap - 6, 10, true);
        bar.forEach(function (b, j) { o.push(teksB(b, (xa + xb) / 2, ya - 8 - (bar.length - 1 - j) * 12, { ukuran: 10, tebal: true, rata: 'middle', isi: BH.panah })); });
      }
    });
    var y = y0 + P + 20;
    (m.teks || []).forEach(function (t) {
      var w = t.warna == null ? BH.teks : WARNA[t.warna], p = paragrafB(t.teks, pad + 16, y, W - 2 * pad - 16, { ukuran: 11, isi: w });
      o.push(S.rect(pad, y - 9, 10, 10, { isi: t.warna == null ? BH.redup : w }));
      o.push(p.svg);
      y += p.baris * 14 + 4;
    });
    var H = y + pad - 6;
    return { svg: S.doc(o.join(''), W, H, { latar: '#ffffff' }), lebar: W, tinggi: H };
  }

  function contohCorak(kode, x, y, u, skala) {
    var p = [[x, y], [x + u, y], [x + u, y + u], [x, y + u]];
    return Corak.isi(p, kode, { skala: skala || 0.75 }) + S.poli(p, { tutup: true, isi: 'none', garis: TINTA, tebal: 1.3 });
  }

  function contohBentuk(nm, cx, cy, s) {
    return S.poli(Corak.bentuk(nm, cx, cy, s), { tutup: true, isi: '#ffffff', garis: TINTA, tebal: 1.8, sambung: 'round' });
  }

  function svgTabel(m, judul) {
    var semua = m.kotak.concat([m.jawaban]), V = m.kotak.length, f0 = m.kotak[0], pad = 8, y0 = pad + 26;
    var peta = 128, lebarLabel = 64, kol = 46, u = 22, tb = 29, xT = pad + peta + 16, xK = xT + lebarLabel;
    var baris = [];
    if (m.bentuk) baris.push({ bentuk: true, label: 'bentuk' });
    f0.lapis.forEach(function (A, l) { A.forEach(function (c, i) { baris.push({ lapis: l, pos: i, label: (m.pendek ? m.pendek[l] + ' ' : 'bagian ') + (i + 1) }); }); });
    var W = lebarJudul(judul, xK + (V + 1) * kol + pad), yH = y0 + 14, yB = yH + 10;
    var H = Math.max(yB + baris.length * tb, y0 + peta + 40) + pad;
    var o = [teksB(judul, pad, pad + 13, { ukuran: 13, tebal: true })];
    // peta nomor bagian
    o.push(S.rect(pad, y0 + 6, peta, peta, { isi: '#ffffff', garis: '#c4cad6', tebal: 1.2 }));
    o.push(figSvg(f0, pad + peta / 2, y0 + 6 + peta / 2, peta * 0.42, { kosong: true, nomor: true, tebal: 1.4, tebalLuar: 2 }));
    o.push(teksB('Nomor bagian', pad + peta / 2, y0 + peta + 22, { ukuran: 10, rata: 'middle', isi: BH.teksRedup }));
    o.push(S.rect(xK + V * kol + 2, yH - 12, kol - 4, baris.length * tb + 24, { rx: 5, isi: BH.latarJawab }));
    for (var t = 0; t <= V; t++) o.push(teksB(t === V ? 'Jawab' : 'Kotak ' + (t + 1), xK + t * kol + kol / 2, yH, { ukuran: 10, tebal: true, rata: 'middle', isi: t === V ? BH.jawab : BH.teks }));
    baris.forEach(function (b, r) {
      var y = yB + r * tb;
      if (r % 2 === 0) o.push(S.rect(xT - 4, y, lebarLabel + V * kol, tb, { isi: '#f6f8fc' }));
      o.push(teksB(b.label, xT, y + tb / 2 + 4, { ukuran: 10, tebal: true }));
      semua.forEach(function (f, t2) {
        var x = xK + t2 * kol + (kol - u) / 2;
        if (b.bentuk) o.push(contohBentuk(f.luar, x + u / 2, y + tb / 2, u * 0.55));
        else o.push(contohCorak(f.lapis[b.lapis][b.pos], x, y + (tb - u) / 2, u));
      });
    });
    return { svg: S.doc(o.join(''), W, H, { latar: '#ffffff' }), lebar: W, tinggi: H };
  }

  function svgSiklus(m, judul) {
    var pad = 8, u = 34, sela = 36, kiri = 176, y0 = pad + 30, tinggi = 74, o = [teksB(judul, pad, pad + 13, { ukuran: 13, tebal: true })];
    var Lmaks = 1;
    m.baris.forEach(function (b) { Lmaks = Math.max(Lmaks, (b.kode || b.bentuk).length); });
    var W = lebarJudul(judul, pad + kiri + Lmaks * u + (Lmaks - 1) * sela + 24 + pad);
    m.baris.forEach(function (b, r) {
      var y = y0 + r * tinggi, isi = b.kode || b.bentuk, L = isi.length, x0 = pad + kiri, w = WARNA[r % WARNA.length];
      o.push(paragrafB(b.judul, pad, y + 12, kiri - 12, { ukuran: 11, tebal: true, isi: w }).svg);
      isi.forEach(function (c, j) {
        var x = x0 + j * (u + sela);
        if (b.kode) o.push(contohCorak(c, x, y, u, 0.8));
        else o.push(contohBentuk(c, x + u / 2, y + u / 2, u * 0.56));
        if (j < L - 1) o.push(S.panah(x + u + 5, y + u / 2, x + u + sela - 5, y + u / 2, { warna: w, tebal: 2, kepala: 7 }));
      });
      if (L > 1) {
        var xa = x0 + (L - 1) * (u + sela) + u / 2, xb = x0 + u / 2, yb = y + u + 13;
        o.push(S.poli([[xa, y + u + 3], [xa, yb], [xb, yb], [xb, y + u + 11]], { garis: w, tebal: 2, sambung: 'round' }));
        o.push(S.panah(xb, y + u + 11, xb, y + u + 3, { warna: w, tebal: 2, kepala: 7 }));
      } else o.push(teksB('(tidak berganti)', x0 + u + 10, y + u / 2 + 4, { ukuran: 10, isi: BH.teksRedup }));
    });
    var yy = y0 + m.baris.length * tinggi + 2;
    (m.catatan || []).forEach(function (c) {
      var p = paragrafB(c, pad, yy, W - 2 * pad, { ukuran: 10, isi: BH.teksRedup });
      o.push(p.svg);
      yy += p.baris * 13 + 2;
    });
    var H = yy + pad - 6;
    return { svg: S.doc(o.join(''), W, H, { latar: '#ffffff' }), lebar: W, tinggi: H };
  }

  // ------------------------------------------------------------- susunan dan aturan

  /** Kode corak setelah bagiannya diputar kaku K bagian dari n; null bila sudutnya bukan kelipatan 45° dan coraknya berarah. */
  function putarKaku(c, K, n) {
    var deg = mod(K, n) * 360 / n;
    if (deg % 45) return Corak.berarah(c) ? null : c;
    return Corak.putarKode(c, deg);
  }

  /** Corak di bagian i pindah ke bagian i+K; ori 'ikut' memutar arah coraknya juga. */
  function geser(A, K, ori, n) {
    var B = new Array(n);
    for (var i = 0; i < n; i++) {
      var c = A[i];
      if (ori === 'ikut') { c = putarKaku(c, K, n); if (c === null) return null; }
      B[mod(i + K, n)] = c;
    }
    return B;
  }

  /** Bagian p diam; bagian lain bergeser K langkah pada putaran n-1 bagian (melompati p). */
  function diamSatu(A, p, K, n) {
    var q = [], B = A.slice();
    for (var j = 1; j < n; j++) q.push(mod(p + j, n));
    for (j = 0; j < q.length; j++) B[q[mod(j + K, q.length)]] = A[q[j]];
    return B;
  }

  function simetris(A) {
    var n = A.length, kA = kunciArr(A);
    for (var d = 1; d < n; d++) if (kunciArr(geser(A, d, 'tetap', n)) === kA) return true;
    return false;
  }

  function adaKembarTetangga(A) {
    for (var i = 0; i < A.length; i++) if (A[i] === A[(i + 1) % A.length]) return true;
    return false;
  }

  /** Susunan n corak dari pool (berbeda semua bila cukup), tidak simetris terhadap putaran. */
  function pilihSusunan(a, pool, n, larang) {
    for (var c = 0; c < 60; c++) {
      var A = pool.length >= n ? a.ambil(pool, n) : a.kocok(a.kocok(pool).concat(a.ambil(pool, n - pool.length)));
      if (simetris(A)) continue;
      if (c < 40 && adaKembarTetangga(A)) continue;
      if (larang && larang(A)) continue;
      return A;
    }
    return null;
  }

  /** Corak untuk deret perpindahan: tak berarah, ditambah kotak-kotak (keduanya bila langkahnya kelipatan 90°). */
  function poolPutar(a, sudut) {
    var p = NONARAH.slice();
    if (sudut.every(function (x) { return mod(x, 90) === 0; })) return p.concat(KOTAK);
    p.push(a.pilih(KOTAK));
    return p;
  }

  /** Siklus L corak berbeda (paling banyak satu jenis kotak-kotak dan dua jenis garis). */
  function pilihSiklus(a, L, pool, larang) {
    for (var c = 0; c < 60; c++) {
      var S2 = a.ambil(pool, L);
      if (S2.filter(function (x) { return KOTAK.indexOf(x) >= 0; }).length > 1) continue;
      if (S2.filter(function (x) { return ARSIR.indexOf(x) >= 0; }).length > 2) continue;
      if (S2.indexOf('hitam') >= 0 && S2.indexOf('bulatan') >= 0) continue;
      if (larang && S2.some(function (x) { return larang.indexOf(x) >= 0; })) continue;
      return S2;
    }
    return null;
  }

  /** Fase tiap bagian (0..L-1): sedikitnya min(L, n, 3) fase berbeda, dan tiap fase dipakai paling banyak separuh bagian. */
  function pilihFase(a, n, L) {
    if (L <= 1) return ulang(0, n);
    var perlu = Math.min(L, n, 3), maks = Math.max(1, Math.ceil(n / 2));
    for (var c = 0; c < 60; c++) {
      var f = rentang(n).map(function () { return a.bulat(0, L - 1); }), hit = {};
      f.forEach(function (x) { hit[x] = (hit[x] || 0) + 1; });
      if (Object.keys(hit).length >= perlu && Object.keys(hit).every(function (x) { return hit[x] <= maks; })) return f;
    }
    return a.kocok(rentang(n).map(function (i) { return i % L; }));
  }

  // Aturan per lapis: A(t) memberi susunan kotak ke-t (t = 0..V), lacak(p, t) letak corak yang semula di bagian p.
  function rPutar(A0, s, ori, n) {
    return {
      jenis: 'putar', A0: A0, s: s, ori: ori, n: n,
      A: function (t) { return geser(A0, kum(s, t), ori, n); },
      pada: function (K, o2) { return geser(A0, K, o2 || ori, n); },
      lacak: function (p, t) { return mod(p + kum(s, t), n); },
      langkah: function (p, t) { return s[t - 1]; }
    };
  }
  function rDiam(A0, n) {
    return { jenis: 'diam', A0: A0, n: n, A: function () { return A0.slice(); }, lacak: function (p) { return p; }, langkah: function () { return 0; } };
  }
  function rDiamSatu(A0, p, k, n) {
    var q = [];
    for (var j = 1; j < n; j++) q.push(mod(p + j, n));
    function lacak(x, t) { return x === p ? p : q[mod(q.indexOf(x) + k * t, n - 1)]; }
    return {
      jenis: 'diam-satu', A0: A0, p: p, k: k, n: n,
      A: function (t) { return diamSatu(A0, p, k * t, n); },
      lacak: lacak,
      langkah: function (x, t) { var a0 = lacak(x, t - 1), a1 = lacak(x, t), sg = k > 0 ? 1 : -1; return sg * mod(sg * (a1 - a0), n); }
    };
  }
  /** Bagian bernomor genap (indeks 0, 2, ...) dan ganjil bergeser ks[0] dan ks[1] "petak kelompok" (2 bagian). */
  function rKelompokPutar(A0, ks, n) {
    function pada(Ks) { var B = new Array(n); for (var i = 0; i < n; i++) B[mod(i + 2 * Ks[i % 2], n)] = A0[i]; return B; }
    return {
      jenis: 'kelompok-putar', A0: A0, ks: ks, n: n,
      A: function (t) { return pada([ks[0] * t, ks[1] * t]); },
      pada: pada,
      lacak: function (p, t) { return mod(p + 2 * ks[p % 2] * t, n); },
      langkah: function (p) { return 2 * ks[p % 2]; }
    };
  }
  /** Bagian i memakai siklus cyc[i] mulai fase[i], maju satu langkah tiap kotak; seluruh susunan bergeser k tiap kotak. */
  function rSiklus(cyc, fase, k, n) {
    function pada(tR, tC) {
      var B = new Array(n);
      for (var i = 0; i < n; i++) B[mod(i + k * tR, n)] = cyc[i][mod(fase[i] + tC, cyc[i].length)];
      return B;
    }
    return {
      jenis: 'siklus', cyc: cyc, fase: fase, k: k, n: n,
      A: function (t) { return pada(t, t); },
      pada: pada,
      lacak: function (p, t) { return mod(p + k * t, n); },
      langkah: function () { return k; }
    };
  }
  /** Hitam (X) menutupi c0 + t bagian mulai bagian s ke arah dir; bagian lain tetap corak dasarnya. */
  function rJalar(dasar, X, s, dir, c0, n) {
    function pada(c, o2) {
      o2 = o2 || {};
      var B = dasar.slice(), mulai = o2.mulai == null ? s : o2.mulai;
      for (var j = 0; j < Math.min(n, c); j++) B[mod(mulai + dir * j, n)] = X;
      return B;
    }
    return {
      jenis: 'jalar', dasar: dasar, X: X, s: s, dir: dir, c0: c0, n: n,
      A: function (t) { return pada(c0 + t); },
      pada: pada,
      ujung: function (t) { var c = c0 + t; return c > 0 ? mod(s + dir * (c - 1), n) : null; }
    };
  }

  // ------------------------------------------------------------- ramalan (pustaka aturan penyusun)

  function polaLangkah(n, V) {
    var hasil = [], k0, e, x, y;
    for (k0 = 0; k0 < n; k0++) hasil.push(ulang(k0, V));
    for (k0 = 1; k0 < n; k0++) [1, 2, -1, -2].forEach(function (ee) { hasil.push(rentang(V).map(function (u) { return k0 + ee * u; })); });
    for (x = 0; x < n; x++) for (y = 0; y < n; y++) if (x !== y) hasil.push(rentang(V).map(function (u) { return u % 2 ? y : x; }));
    return hasil;
  }

  /** Semua urutan melingkar dari daftar U (U[0] di depan). */
  function urutanMelingkar(U) {
    var hasil = [];
    (function rek(awal, sisa) {
      if (!sisa.length) { hasil.push(awal); return; }
      sisa.forEach(function (x, i) { rek(awal.concat([x]), sisa.slice(0, i).concat(sisa.slice(i + 1))); });
    })([U[0]], U.slice(1));
    return hasil;
  }

  /**
   * Ramalan susunan satu lapis pada kotak berikutnya dari semua aturan pustaka yang cocok dengan deret
   * `seq` (susunan kotak 0..V-1). Mengembalikan daftar susunan berbeda.
   */
  function ramalLapis(seq, n) {
    var V = seq.length, hasil = {}, kunciSeq = seq.map(kunciArr), t, i, k;
    function catat(A) { if (A) hasil[kunciArr(A)] = A; }
    function cocok(f) {
      for (var u = 1; u < V; u++) { var X = f(u); if (!X || kunciArr(X) !== kunciSeq[u]) return null; }
      return f(V);
    }
    // 1. pergeseran k bagian disertai penggantian corak tetap (fungsi corak -> corak)
    for (k = 0; k < n; k++) {
      var sig = {}, ok = true;
      for (t = 0; t + 1 < V && ok; t++) {
        for (i = 0; i < n; i++) {
          var c = seq[t][i], d = seq[t + 1][mod(i + k, n)];
          if (!Object.prototype.hasOwnProperty.call(sig, c)) sig[c] = d;
          else if (sig[c] !== d) { ok = false; break; }
        }
      }
      if (!ok) continue;
      var P = new Array(n), lengkap = true;
      for (i = 0; i < n; i++) {
        var c2 = seq[V - 1][i];
        if (!Object.prototype.hasOwnProperty.call(sig, c2)) { lengkap = false; break; }
        P[mod(i + k, n)] = sig[c2];
      }
      if (lengkap) catat(P);
    }
    // 2. pergeseran dengan langkah tetap, bertambah, atau bergantian; arah corak tetap atau ikut berputar
    polaLangkah(n, V).forEach(function (s) {
      ['tetap', 'ikut'].forEach(function (ori) { catat(cocok(function (u) { return geser(seq[0], kum(s, u), ori, n); })); });
    });
    // 3. satu bagian diam, bagian lain bergeser pada putaran n-1 bagian
    for (var p = 0; p < n; p++) {
      for (k = 1; k <= n - 2; k++) catat(cocok(function (u) { return diamSatu(seq[0], p, k * u, n); }));
    }
    // 4. siklus tertutup atas semua corak yang tampak
    var U = [];
    seq.forEach(function (A) { A.forEach(function (x) { if (U.indexOf(x) < 0) U.push(x); }); });
    if (U.length >= 2 && U.length <= 5) {
      urutanMelingkar(U).forEach(function (Sx) {
        var L = Sx.length, ix = {};
        Sx.forEach(function (x, j) { ix[x] = j; });
        var fase = seq[0].map(function (x) { return ix[x]; });
        function pada(K, D) { var B = new Array(n); for (var q = 0; q < n; q++) B[mod(q + K, n)] = Sx[mod(fase[q] + D, L)]; return B; }
        var d0, e, x, y;
        for (d0 = 1; d0 < L; d0++) for (k = 0; k < n; k++) catat(cocok(function (u) { return pada(k * u, d0 * u); }));
        for (d0 = 1; d0 < L; d0++) for (e = 1; e < L; e++) catat(cocok(function (u) { return pada(0, d0 * u + e * u * (u - 1) / 2); }));
        for (x = 0; x < L; x++) for (y = 0; y < L; y++) if (x !== y) catat(cocok(function (u) { return pada(0, x * Math.ceil(u / 2) + y * Math.floor(u / 2)); }));
      });
    }
    // 5. satu corak menjalar: menutupi c0 + m*t bagian berurutan mulai bagian s ke satu arah
    U.forEach(function (X) {
      [1, -1].forEach(function (dir) {
        for (var s0 = 0; s0 < n; s0++) {
          for (var c0 = 0; c0 < n; c0++) {
            [1, 2].forEach(function (m) {
              var dasar = new Array(n), ok2 = true, u, q;
              for (u = 0; u < V && ok2; u++) {
                var cov = Math.min(n, c0 + m * u);
                for (q = 0; q < n; q++) {
                  var tutup = mod((q - s0) * dir, n) < cov, x = seq[u][q];
                  if (tutup) { if (x !== X) { ok2 = false; break; } }
                  else if (x === X || (dasar[q] !== undefined && dasar[q] !== x)) { ok2 = false; break; }
                  else dasar[q] = x;
                }
              }
              if (!ok2) return;
              var covV = Math.min(n, c0 + m * V), B = new Array(n);
              for (q = 0; q < n; q++) B[q] = mod((q - s0) * dir, n) < covV ? X : dasar[q];
              catat(B);
            });
          }
        }
      });
    });
    // 6. deret berulang tiap p kotak
    for (var pp = 1; pp <= 3; pp++) {
      if (V < pp + 2) continue;
      var ulangOk = true;
      for (t = pp; t < V; t++) if (kunciSeq[t] !== kunciSeq[t - pp]) { ulangOk = false; break; }
      if (ulangOk) catat(seq[V - pp]);
    }
    return Object.keys(hasil).map(function (x2) { return hasil[x2]; });
  }

  /** Ramalan bentuk luar: deret berulang tiap 1-3 kotak (sedikitnya dua kali terlihat berulang). */
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

  /** Ramalan kotak berikutnya bila tunggal di setiap lapis dan pada bentuk luar; null bila tidak. */
  function ramalDesain(figs) {
    var n = figs[0].n, lapis = [];
    for (var l = 0; l < figs[0].lapis.length; l++) {
      var r = ramalLapis(figs.map(function (f) { return f.lapis[l]; }), n);
      if (r.length !== 1) return null;
      lapis.push(r[0]);
    }
    var rb = ramalBentuk(figs.map(function (f) { return f.luar; }));
    if (rb.length !== 1) return null;
    return { tata: figs[0].tata, luar: rb[0], n: n, awal: figs[0].awal, lapis: lapis };
  }

  /** Setiap peralihan siklus yang dibutuhkan jawaban terlihat sedikitnya sekali pada kotak yang tampak. */
  function peralihanTerlihat(seqLapis, V, k, n) {
    var lihat = {}, t, i;
    for (t = 0; t + 1 < V; t++) for (i = 0; i < n; i++) lihat[seqLapis[t][i] + '>' + seqLapis[t + 1][mod(i + k, n)]] = 1;
    for (i = 0; i < n; i++) if (!lihat[seqLapis[V - 1][i] + '>' + seqLapis[V][mod(i + k, n)]]) return false;
    return true;
  }

  // ------------------------------------------------------------------ desain

  function desain(pola, tt, V, aturan, luarSeq, info) {
    var kotak = [];
    for (var t = 0; t <= V; t++) {
      var lap = aturan.map(function (r) { return r.A(t); });
      if (lap.some(function (A) { return !A; })) return null;
      kotak.push(buatFig(tt, luarSeq ? luarSeq[t] : tt.luar, lap));
    }
    return { pola: pola, tt: tt, V: V, n: tt.n, aturan: aturan, luarSeq: luarSeq || null, kotak: kotak, info: info || {} };
  }

  function sahDesain(d) {
    if (!d) return false;
    var K = d.kotak.map(sj);
    for (var t = 0; t < d.V; t++) if (K[t] === K[t + 1]) return false;
    var r = ramalDesain(d.kotak.slice(0, d.V));
    return !!r && sj(r) === K[d.V];
  }

/** Ada kotak tampak yang sama dengan kotak tampak sebelumnya (deret sudah terlihat berulang). */
  function adaUlang(d) {
    var K = d.kotak.slice(0, d.V).map(sj);
    return K.some(function (k, i) { return K.indexOf(k) !== i; });
  }

  function pilihTata(a, syarat) { return a.pilih(SINAR.filter(syarat || function () { return true; })); }
  function banyakKotak(a) { return a.pilih([4, 5]); }

  /** Dua susunan 4 corak untuk dua lapis, keduanya tak simetris dan tidak sama. */
  function duaSusunan(a, pool) {
    var A0 = pilihSusunan(a, pool, 4);
    if (!A0) return null;
    // lapis luar memakai sebanyak mungkin corak yang tidak ada di lapis dalam, supaya kedua lapis mudah dibedakan
    var baru = pool.filter(function (x) { return A0.indexOf(x) < 0; }), A1 = null;
    for (var c = 0; c < 30 && !A1; c++) {
      var x = a.kocok(baru.length >= 4 ? a.ambil(baru, 4) : baru.concat(a.ambil(A0, 4 - baru.length)));
      if (!simetris(x) && kunciArr(x) !== kunciArr(A0)) A1 = x;
    }
    return A1 ? [A0, A1] : null;
  }

  function susunPutar(a, pola, V) {
    var tt, n, k, sg = a.tanda(), A0, AA, s, pool, p;
    switch (pola) {
      case 'tetap-satu':
        tt = pilihTata(a); n = tt.n;
        k = (n === 8 ? a.pilih([1, 2]) : 1) * sg;
        A0 = pilihSusunan(a, poolPutar(a, [k * 360 / n]), n);
        if (!A0) return null;
        return desain(pola, tt, V, [rPutar(A0, ulang(k, V), 'tetap', n)]);
      case 'tetap-utuh':
      case 'dua-arah':
      case 'dua-langkah':
      case 'lapis-diam':
        tt = a.pilih(DUA);
        AA = duaSusunan(a, NONARAH.concat(KOTAK));
        if (!AA) return null;
        if (pola === 'tetap-utuh') return desain(pola, tt, V, [rPutar(AA[0], ulang(sg, V), 'tetap', 4), rPutar(AA[1], ulang(sg, V), 'tetap', 4)]);
        if (pola === 'dua-arah') return desain(pola, tt, V, [rPutar(AA[0], ulang(sg, V), 'tetap', 4), rPutar(AA[1], ulang(-sg, V), 'tetap', 4)]);
        if (pola === 'dua-langkah') {
          var dua = a.bulat(0, 1);
          return desain(pola, tt, V, [0, 1].map(function (l) { return rPutar(AA[l], ulang(l === dua ? 2 : sg, V), 'tetap', 4); }), null, { dua: dua });
        }
        var gerak = a.bulat(0, 1);
        return desain(pola, tt, V, [0, 1].map(function (l) { return l === gerak ? rPutar(AA[l], ulang(sg, V), 'tetap', 4) : rDiam(AA[l], 4); }), null, { gerak: gerak });
      case 'dua-kelompok':
        // 8 bagian: tiap kelompok 4 bagian berpindah satu petak kelompok (2 bagian = 90°); 8 corak berbeda
        // supaya penggantian corak per kelompok terbaca (satu jenis garis saja, arahnya tetap)
        tt = pilihTata(a, function (x) { return x.n === 8; });
        A0 = a.kocok(NONARAH.concat(KOTAK, [a.pilih(ARSIR)]));
        return desain(pola, tt, V, [rKelompokPutar(A0, [sg, -sg], 8)]);
      case 'bertambah':
      case 'bergantian':
        tt = pilihTata(a, function (x) { return pola === 'bertambah' ? x.n === 8 : x.n >= 6; }); n = tt.n;
        if (pola === 'bertambah') {
          var k0 = n === 8 ? a.pilih([1, 1, 2]) : 1;
          s = rentang(V).map(function (u) { return sg * (k0 + u); });
        } else {
          var xy = a.pilih(n === 6 ? [[1, 2], [2, 1]] : [[1, 2], [2, 1], [1, 3], [3, 1]]);
          s = rentang(V).map(function (u) { return sg * xy[u % 2]; });
        }
        if (s.some(function (x) { return mod(x, n) === 0; })) return null;
        A0 = pilihSusunan(a, poolPutar(a, s.map(function (x) { return x * 360 / n; })), n);
        if (!A0) return null;
        return desain(pola, tt, V, [rPutar(A0, s, 'tetap', n)]);
      case 'satu-diam':
        // 6 atau 8 bagian (pada 4 bagian, tiga corak yang berputar langsung berulang tiap 3 kotak)
        tt = pilihTata(a, function (x) { return x.n >= 6; }); n = tt.n;
        var F = a.pilih(['hitam', 'bintang', 'titik']);
        var sisa = NONARAH.concat(KOTAK).filter(function (x) { return x !== F && !(F === 'hitam' && x === 'bulatan'); });
        var R = pilihSusunan(a, sisa, n - 1);
        if (!R) return null;
        p = a.bulat(0, n - 1);
        A0 = new Array(n);
        A0[p] = F;
        for (var j = 1; j < n; j++) A0[mod(p + j, n)] = R[j - 1];
        return desain(pola, tt, V, [rDiamSatu(A0, p, sg, n)], null, { F: F });
      case 'berarah':
        pool = NONARAH.concat(ARSIR, KOTAK);
        if (a.untung(0.6)) {
          tt = pilihTata(a, function (x) { return x.kaku && (x.n === 4 || x.n === 8); }); n = tt.n;
          k = (n === 8 ? a.pilih([1, 1, 2]) : 1) * sg;
          A0 = pilihSusunan(a, pool, n, function (x) { return berubahArah(x, k, n) < 2; });
          if (!A0) return null;
          return desain(pola, tt, V, [rPutar(A0, ulang(k, V), 'ikut', n)]);
        }
        tt = a.pilih(DUA);
        AA = [pilihSusunan(a, pool, 4, function (x) { return berubahArah(x, 1, 4) < 1; })];
        AA.push(pilihSusunan(a, pool, 4, function (x) { return berubahArah(x, 1, 4) < 1 || kunciArr(x) === kunciArr(AA[0]); }));
        if (!AA[0] || !AA[1]) return null;
        return desain(pola, tt, V, [rPutar(AA[0], ulang(sg, V), 'ikut', 4), rPutar(AA[1], ulang(-sg, V), 'ikut', 4)]);
    }
    return null;
  }

  /** Banyak bagian yang coraknya berubah arah bila diputar kaku k bagian. */
  function berubahArah(A, k, n) { return A.filter(function (c) { return putarKaku(c, k, n) !== c; }).length; }

  function susunGanti(a, pola, V) {
    var tt, n, k, sg = a.tanda(), S1, S2, f1, f2, luarSeq, A0, c0;
    switch (pola) {
      case 'siklus-satu':
        tt = pilihTata(a, function (x) { return x.n <= 6; }); n = tt.n;
        S1 = pilihSiklus(a, a.pilih([3, 4]), Corak.KODE);
        if (!S1) return null;
        return desain(pola, tt, V, [rSiklus(ulang(S1, n), pilihFase(a, n, S1.length), 0, n)], null, { S: [S1] });
      case 'jalar':
        tt = pilihTata(a, function (x) { return x.n >= 6; }); n = tt.n;
        // jawaban masih menyisakan sedikitnya dua bagian yang belum hitam (6 bagian: hanya 4 kotak tampak)
        if (n === 6) V = 4;
        c0 = a.bulat(0, n - 2 - V);
        return desain(pola, tt, V, [rJalar(a.ambil(DASAR_JALAR, n), 'hitam', a.bulat(0, n - 1), sg, c0, n)]);
      case 'dua-lapis':
        tt = a.pilih(DUA);
        var L = a.kocok([a.pilih([3, 4]), a.pilih([2, 3])]);
        S1 = pilihSiklus(a, L[0], Corak.KODE);
        S2 = S1 && pilihSiklus(a, L[1], Corak.KODE, S1);
        if (!S2) return null;
        return desain(pola, tt, V, [rSiklus(ulang(S1, 4), pilihFase(a, 4, S1.length), 0, 4), rSiklus(ulang(S2, 4), pilihFase(a, 4, S2.length), 0, 4)], null, { S: [S1, S2] });
      case 'dua-kelompok':
        tt = pilihTata(a); n = tt.n;
        var LA = a.pilih([3, 4]), LB = a.pilih([1, 2, 2, 3]);
        if (n === 4) LA = a.pilih([2, 3]);
        S1 = pilihSiklus(a, LA, Corak.KODE);
        S2 = S1 && pilihSiklus(a, LB, Corak.KODE, S1);
        if (!S2) return null;
        var gA = a.bulat(0, 1), cyc = rentang(n).map(function (i) { return i % 2 === gA ? S1 : S2; });
        // fase tercampur di dalam tiap kelompok
        var fA = pilihFase(a, n / 2, S1.length), fB = S2.length > 1 ? pilihFase(a, n / 2, S2.length) : ulang(0, n / 2);
        var fase = rentang(n).map(function (i) { return (i % 2 === gA ? fA : fB)[Math.floor(i / 2)]; });
        return desain(pola, tt, V, [rSiklus(cyc, fase, 0, n)], null, { S: [S1, S2], gA: gA });
      case 'siklus-putar':
        tt = pilihTata(a); n = tt.n;
        k = (n === 8 ? a.pilih([1, 2]) : 1) * sg;
        S1 = pilihSiklus(a, a.pilih([3, 4]), poolPutar(a, [k * 360 / n]));
        if (!S1) return null;
        return desain(pola, tt, V, [rSiklus(ulang(S1, n), pilihFase(a, n, S1.length), k, n)], null, { S: [S1] });
      case 'bentuk-putar':
      case 'bentuk-siklus':
        tt = pilihTata(a); n = tt.n;
        var bentuk = a.kocok(bentukSerasi(n, tt.awal)), per = V === 5 && bentuk.length >= 3 && a.untung(0.4) ? 3 : 2;
        luarSeq = rentang(V + 1).map(function (t) { return bentuk[t % per]; });
        var tt2 = Object.assign({}, tt, { luar: bentuk[0], nama: 'bangun yang dibagi menjadi ' + n + ' bagian oleh garis-garis dari titik pusatnya' });
        if (pola === 'bentuk-putar') {
          k = (n === 8 ? a.pilih([1, 2]) : 1) * sg;
          A0 = pilihSusunan(a, poolPutar(a, [k * 360 / n]), n);
          if (!A0) return null;
          return desain(pola, tt2, V, [rPutar(A0, ulang(k, V), 'tetap', n)], luarSeq, { bentuk: bentuk.slice(0, per) });
        }
        S1 = pilihSiklus(a, a.pilih([3, 4]), Corak.KODE);
        if (!S1) return null;
        return desain(pola, tt2, V, [rSiklus(ulang(S1, n), pilihFase(a, n, S1.length), 0, n)], luarSeq, { bentuk: bentuk.slice(0, per), S: [S1] });
      case 'siklus-geser':
        tt = a.pilih(DUA);
        var lc = a.bulat(0, 1);
        S1 = pilihSiklus(a, a.pilih([2, 3, 4]), Corak.KODE);
        if (!S1) return null;
        f1 = pilihFase(a, 4, S1.length);
        A0 = pilihSusunan(a, NONARAH.concat(KOTAK), 4);
        if (!A0) return null;
        f2 = [rSiklus(ulang(S1, 4), f1, 0, 4), rPutar(A0, ulang(sg, V), 'tetap', 4)];
        return desain(pola, tt, V, lc === 0 ? f2 : [f2[1], f2[0]], null, { S: [S1], lc: lc });
    }
    return null;
  }

  var POLA = {
    'serial-corak-putar': {
      mudah: ['tetap-satu', 'tetap-utuh'],
      sedang: ['dua-arah', 'dua-langkah', 'lapis-diam', 'dua-kelompok'],
      sulit: ['bertambah', 'bergantian', 'satu-diam', 'berarah']
    },
    'serial-corak-ganti': {
      mudah: ['siklus-satu', 'jalar'],
      sedang: ['dua-lapis', 'dua-kelompok'],
      sulit: ['siklus-putar', 'bentuk-putar', 'bentuk-siklus', 'siklus-geser']
    }
  };

  // ------------------------------------------------------------------ pengecoh

  function cerminFig(f) {
    var n = f.n, w = 360 / n, c = mod(Math.round(-2 * f.awal / w) - 1, n);
    return { tata: f.tata, luar: f.luar, n: n, awal: f.awal, lapis: f.lapis.map(function (A) {
      var B = new Array(n);
      for (var i = 0; i < n; i++) B[mod(c - i, n)] = Corak.cerminKode(A[i], 90);
      return B;
    }) };
  }

  function bagianKata(d, l, p) { return d.tt.lapis ? d.tt.lapis[l] + ' nomor ' + (p + 1) : 'bagian ' + (p + 1); }
  function subjek(d, l) { return d.tt.lapis ? 'corak ' + d.tt.lapis[l] : 'semua corak'; }

  /** Calon pengecoh (urut menurut prioritas) dan cadangannya. */
  function calonPengecoh(a, d) {
    var V = d.V, n = d.n, tt = d.tt, akhir = d.kotak[V - 1], kunci = d.kotak[V], luarK = kunci.luar, calon = [];
    function fig(lapis, luar) { return lapis.some(function (A) { return !A; }) ? null : buatFig(tt, luar || luarK, lapis); }
    function tambah(jenis, f, alasan) { if (f) calon.push({ jenis: jenis, fig: f, alasan: alasan }); }
    function ganti(l, A) { return kunci.lapis.map(function (B, j) { return j === l ? A : B; }); }
    var r = d.aturan, K1 = function (x) { return kum(x.s, V - 1); };
    switch (d.pola) {
      case 'tetap-satu':
      case 'bertambah':
      case 'bergantian':
      case 'bentuk-putar': {
        var r0 = r[0], sV = r0.s[V - 1], g = sV > 0 ? 1 : -1, sP = r0.s[V - 2];
        if (d.pola === 'bertambah') tambah('tetap', fig([r0.pada(K1(r0) + sP)]), 'langkahnya tidak bertambah: corak berpindah ' + Math.abs(sP) + ' bagian lagi, padahal langkahnya bertambah satu bagian setiap kotak sehingga kini ' + Math.abs(sV) + ' bagian');
        if (d.pola === 'bergantian') tambah('tetap', fig([r0.pada(K1(r0) + sP)]), 'langkahnya tidak bergantian: corak berpindah ' + Math.abs(sP) + ' bagian lagi, padahal setelah ' + Math.abs(sP) + ' bagian giliran langkah ' + Math.abs(sV) + ' bagian');
        if (d.pola === 'bentuk-putar') {
          tambah('bentuk', fig([kunci.lapis[0]], akhir.luar), 'coraknya sudah berpindah dengan benar tetapi bentuk luarnya tetap ' + NAMA_BENTUK[akhir.luar] + ', padahal bentuk luar berganti setiap kotak menjadi ' + NAMA_BENTUK[luarK]);
          tambah('salin-corak', fig([akhir.lapis[0]]), 'bentuk luarnya sudah berganti tetapi corak belum dipindahkan dari susunan kotak ' + V);
          var lain = bentukSerasi(n, tt.awal).filter(function (x) { return x !== luarK && x !== akhir.luar; })[0];
          if (lain) tambah('bentuk-lain', fig([kunci.lapis[0]], lain), 'bentuk luarnya ' + NAMA_BENTUK[lain] + ', padahal urutan bentuk luar menghendaki ' + NAMA_BENTUK[luarK]);
        }
        tambah('lebih', fig([r0.pada(K1(r0) + sV + g)]), 'corak berpindah ' + (Math.abs(sV) + 1) + ' bagian, padahal dari kotak ' + V + ' ke kotak berikutnya corak berpindah ' + Math.abs(sV) + ' bagian ' + arahKata(sV));
        tambah('balik', fig([r0.pada(K1(r0) - sV)]), 'corak berpindah ke arah sebaliknya (' + arahKata(-sV) + '), padahal arah perpindahannya ' + arahKata(sV));
        if (Math.abs(sV) >= 2) tambah('kurang', fig([r0.pada(K1(r0) + sV - g)]), 'corak hanya berpindah ' + (Math.abs(sV) - 1) + ' bagian, padahal seharusnya ' + Math.abs(sV) + ' bagian ' + arahKata(sV));
        tambah('salin', fig([akhir.lapis[0]], akhir.luar), 'sama persis dengan kotak ' + V + '; corak belum dipindahkan');
        if (d.pola !== 'tetap-satu') tambah('awal', fig([r0.pada(K1(r0) + r0.s[0])]), 'corak berpindah ' + Math.abs(r0.s[0]) + ' bagian seperti langkah pertama, padahal langkahnya berubah dari kotak ke kotak');
        tambah('dua-kali', fig([r0.pada(K1(r0) + 2 * sV)]), 'corak berpindah dua kali langkah (' + 2 * Math.abs(sV) + ' bagian), padahal hanya ' + Math.abs(sV) + ' bagian');
        break;
      }
      case 'tetap-utuh':
      case 'dua-arah':
      case 'dua-langkah':
      case 'lapis-diam':
      case 'berarah': {
        var nl = r.length, pindah = function (l, delta, ori) { var x = r[l]; return x.jenis === 'diam' ? x.A0.slice() : x.pada(K1(x) + delta, ori); };
        var sv = r.map(function (x) { return x.jenis === 'diam' ? 0 : x.s[V - 1]; });
        if (d.pola === 'berarah') {
          // corak dipindah tetapi arahnya tetap seperti di kotak terakhir
          tambah('arah-tetap', fig(r.map(function (x, l) { return geser(akhir.lapis[l], sv[l], 'tetap', n); })),
            (nl === 2 ? 'corak kedua lapis sudah berpindah ke tempat yang benar' : 'corak sudah berpindah ' + langkahKata(sv[0], n)) + ' tetapi arah garisnya tidak ikut berputar, padahal setiap kali berpindah corak berputar ' + Math.abs(sv[0]) * 360 / n + '° bersama bagiannya');
          tambah('arah-balik', fig(r.map(function (x, l) { return geser(akhir.lapis[l], sv[l], 'tetap', n).map(function (c) { return putarKaku(c, -sv[l], n); }); })), 'corak berpindah ke tempat yang benar tetapi arah garisnya diputar ke arah sebaliknya');
          tambah('balik-tetap', fig(r.map(function (x, l) { return geser(akhir.lapis[l], -sv[l], 'tetap', n); })), 'corak dipindah ke arah sebaliknya dan arah garisnya tidak ikut berputar');
        }
        if (nl === 2) {
          if (d.pola !== 'tetap-utuh' && d.pola !== 'lapis-diam') tambah('tertukar', fig([pindah(0, sv[1]), pindah(1, sv[0])]), 'langkah kedua lapis tertukar: ' + tt.lapis[0] + ' bergerak seperti ' + tt.lapis[1] + ' dan sebaliknya');
          if (d.pola === 'dua-arah' || d.pola === 'berarah') {
            tambah('searah-0', fig([pindah(0, sv[0]), pindah(1, sv[0])]), 'corak ' + tt.lapis[1] + ' ikut berpindah ' + arahKata(sv[0]) + ', padahal ' + tt.lapis[1] + ' berpindah ' + arahKata(sv[1]));
            tambah('searah-1', fig([pindah(0, sv[1]), pindah(1, sv[1])]), 'corak ' + tt.lapis[0] + ' ikut berpindah ' + arahKata(sv[1]) + ', padahal ' + tt.lapis[0] + ' berpindah ' + arahKata(sv[0]));
          }
          if (d.pola === 'dua-langkah') {
            var du = d.info.dua, sat = 1 - du;
            tambah('sama-satu', fig(ganti(du, pindah(du, sv[sat]))), 'corak ' + tt.lapis[du] + ' hanya berpindah ' + Math.abs(sv[sat]) + ' bagian, padahal ' + tt.lapis[du] + ' selalu berpindah 2 bagian');
            tambah('sama-dua', fig(ganti(sat, pindah(sat, 2))), 'corak ' + tt.lapis[sat] + ' berpindah 2 bagian, padahal ' + tt.lapis[sat] + ' hanya berpindah 1 bagian ' + arahKata(sv[sat]));
            tambah('balik', fig(ganti(sat, pindah(sat, -sv[sat]))), 'corak ' + tt.lapis[sat] + ' berpindah ke arah sebaliknya (' + arahKata(-sv[sat]) + ')');
          }
          if (d.pola === 'lapis-diam') {
            var gr = d.info.gerak, di = 1 - gr;
            tambah('ikut', fig(ganti(di, geser(akhir.lapis[di], sv[gr], 'tetap', 4))), 'corak ' + tt.lapis[di] + ' ikut berpindah, padahal ' + tt.lapis[di] + ' tidak pernah berubah');
            tambah('tertukar', fig([gr === 0 ? akhir.lapis[0] : geser(akhir.lapis[0], sv[gr], 'tetap', 4), gr === 1 ? akhir.lapis[1] : geser(akhir.lapis[1], sv[gr], 'tetap', 4)]), 'yang dipindah justru ' + tt.lapis[di] + ', sedangkan ' + tt.lapis[gr] + ' dibiarkan tetap');
            tambah('balik', fig(ganti(gr, pindah(gr, -sv[gr]))), 'corak ' + tt.lapis[gr] + ' berpindah ke arah sebaliknya (' + arahKata(-sv[gr]) + ')');
            tambah('lebih', fig(ganti(gr, pindah(gr, 2 * sv[gr]))), 'corak ' + tt.lapis[gr] + ' berpindah 2 bagian, padahal hanya 1 bagian');
          }
          if (d.pola !== 'lapis-diam') {
            tambah('satu-0', fig([pindah(0, sv[0]), akhir.lapis[1]]), 'hanya ' + tt.lapis[0] + ' yang dipindah; corak ' + tt.lapis[1] + ' masih sama dengan kotak ' + V);
            tambah('satu-1', fig([akhir.lapis[0], pindah(1, sv[1])]), 'hanya ' + tt.lapis[1] + ' yang dipindah; corak ' + tt.lapis[0] + ' masih sama dengan kotak ' + V);
          }
          if (d.pola === 'tetap-utuh') {
            tambah('balik', fig([pindah(0, -sv[0]), pindah(1, -sv[1])]), 'corak berpindah ke arah sebaliknya (' + arahKata(-sv[0]) + ')');
            tambah('lebih', fig([pindah(0, 2 * sv[0]), pindah(1, 2 * sv[1])]), 'corak berpindah 2 bagian, padahal setiap kotak corak hanya berpindah 1 bagian');
            tambah('tukar-lapis', fig([kunci.lapis[1], kunci.lapis[0]]), 'corak ' + tt.lapis[0] + ' dan ' + tt.lapis[1] + ' tertukar tempat');
          }
        } else {
          tambah('balik', fig([pindah(0, -sv[0])]), 'corak berpindah ke arah sebaliknya (' + arahKata(-sv[0]) + ')');
          tambah('lebih', fig([pindah(0, sv[0] + (sv[0] > 0 ? 1 : -1))]), 'corak berpindah ' + (Math.abs(sv[0]) + 1) + ' bagian, padahal hanya ' + Math.abs(sv[0]) + ' bagian');
        }
        tambah('salin', fig(akhir.lapis), 'sama persis dengan kotak ' + V + '; corak belum dipindahkan');
        break;
      }
      case 'dua-kelompok': {
        if (r[0].jenis === 'kelompok-putar') {
          var rk = r[0], ks = rk.ks, KV = function (a2, b2) { return rk.pada([ks[0] * (V - 1) + a2, ks[1] * (V - 1) + b2]); };
          tambah('searah-genap', fig([KV(ks[0], ks[0])]), 'corak di bagian bernomor genap ikut berpindah ' + arahKata(ks[0]) + ', padahal corak bagian genap berpindah ' + arahKata(ks[1]));
          tambah('searah-ganjil', fig([KV(ks[1], ks[1])]), 'corak di bagian bernomor ganjil ikut berpindah ' + arahKata(ks[1]) + ', padahal corak bagian ganjil berpindah ' + arahKata(ks[0]));
          tambah('utuh', fig([geser(akhir.lapis[0], ks[0], 'tetap', n)]), 'seluruh corak berpindah 1 bagian ' + arahKata(ks[0]) + ', padahal corak bagian ganjil dan genap berpindah terpisah, masing-masing ke bagian sejenis berikutnya');
          tambah('satu-ganjil', fig([KV(ks[0], 0)]), 'hanya corak bagian bernomor ganjil yang dipindah; corak bagian genap masih sama dengan kotak ' + V);
          tambah('satu-genap', fig([KV(0, ks[1])]), 'hanya corak bagian bernomor genap yang dipindah; corak bagian ganjil masih sama dengan kotak ' + V);
          tambah('tertukar', fig([KV(ks[1], ks[0])]), 'arah perpindahan corak bagian ganjil dan genap tertukar');
          tambah('salin', fig(akhir.lapis), 'sama persis dengan kotak ' + V + '; corak belum dipindahkan');
          break;
        }
        // ganti: kelompok siklus
        var rs = r[0], gA = d.info.gA, padaG = function (tA, tB) {
          var B = new Array(n);
          for (var i = 0; i < n; i++) B[i] = rs.cyc[i][mod(rs.fase[i] + (i % 2 === gA ? tA : tB), rs.cyc[i].length)];
          return B;
        };
        var nmA = gA === 0 ? 'ganjil' : 'genap', nmB = gA === 0 ? 'genap' : 'ganjil';
        tambah('satu-A', fig([padaG(V - 1, V)]), 'corak di bagian bernomor ' + nmA + ' tidak ikut berganti; seharusnya maju satu langkah pada urutannya');
        if (d.info.S[1].length > 1) tambah('satu-B', fig([padaG(V, V - 1)]), 'corak di bagian bernomor ' + nmB + ' tidak ikut berganti; seharusnya maju satu langkah pada urutannya');
        tambah('mundur', fig([padaG(V - 2, V - 2)]), 'corak bergerak mundur pada urutannya (kembali ke corak kotak ' + (V - 1) + ')');
        tambah('lompat', fig([padaG(V + 1, V + 1)]), 'corak maju dua langkah pada urutannya, padahal setiap kotak hanya maju satu langkah');
        tambah('putar', fig([geser(akhir.lapis[0], 1, 'tetap', n)]), 'corak dipindah satu bagian searah jarum jam, padahal yang terjadi adalah pergantian corak di tempatnya');
        tambah('salin', fig(akhir.lapis), 'sama persis dengan kotak ' + V + '; corak belum berganti');
        break;
      }
      case 'satu-diam': {
        var rd = r[0], kk = rd.k, Akh = akhir.lapis[0];
        tambah('diam-ikut', fig([geser(Akh, kk, 'tetap', n)]), 'corak ' + nama(d.info.F) + ' di bagian ' + (rd.p + 1) + ' ikut berpindah, padahal corak itu tidak pernah berpindah');
        tambah('balik', fig([diamSatu(Akh, rd.p, -kk, n)]), 'corak berpindah ke arah sebaliknya (' + arahKata(-kk) + ')');
        tambah('lebih', fig([diamSatu(Akh, rd.p, 2 * kk, n)]), 'corak berpindah dua langkah, padahal setiap kotak hanya satu langkah');
        tambah('salin', fig([Akh]), 'sama persis dengan kotak ' + V + '; corak belum dipindahkan');
        tambah('ikut-balik', fig([geser(Akh, -kk, 'tetap', n)]), 'seluruh corak termasuk corak ' + nama(d.info.F) + ' berpindah ke arah sebaliknya');
        break;
      }
      case 'siklus-satu':
      case 'bentuk-siklus':
      case 'siklus-putar':
      case 'dua-lapis':
      case 'siklus-geser': {
        var pd = function (l, tR, tC) { var x = r[l]; return x.jenis === 'siklus' ? x.pada(tR, tC) : x.pada(kum(x.s, tR)); };
        var semua = function (tR, tC) { return r.map(function (x, l) { return pd(l, tR, tC); }); };
        var siklusL = r.map(function (x) { return x.jenis === 'siklus'; });
        if (d.pola === 'siklus-putar') {
          var kp = r[0].k;
          tambah('hanya-siklus', fig(semua(V - 1, V)), 'corak sudah berganti tetapi susunannya belum dipindahkan ' + langkahKata(kp, n));
          tambah('hanya-putar', fig(semua(V, V - 1)), 'susunan sudah dipindahkan tetapi coraknya tidak berganti');
          tambah('balik', fig(semua(V - 2, V)), 'corak berganti dengan benar tetapi susunannya dipindahkan ke arah sebaliknya (' + arahKata(-kp) + ')');
          tambah('mundur', fig(semua(V, V - 2)), 'susunan dipindahkan dengan benar tetapi coraknya berganti mundur pada urutannya');
        }
        if (d.pola === 'bentuk-siklus') {
          tambah('bentuk', fig(kunci.lapis, akhir.luar), 'coraknya sudah berganti dengan benar tetapi bentuk luarnya tetap ' + NAMA_BENTUK[akhir.luar] + ', padahal bentuk luar berganti setiap kotak menjadi ' + NAMA_BENTUK[luarK]);
          tambah('salin-corak', fig(akhir.lapis), 'bentuk luarnya sudah berganti tetapi corak belum berganti dari kotak ' + V);
        }
        if (d.pola === 'dua-lapis' || d.pola === 'siklus-geser') {
          [0, 1].forEach(function (l) {
            var ket = siklusL[l] ? 'tidak ikut berganti corak' : 'tidak ikut berpindah';
            tambah('satu-' + l, fig(ganti(l, akhir.lapis[l])), 'corak ' + tt.lapis[l] + ' ' + ket + '; masih sama dengan kotak ' + V);
          });
          if (d.pola === 'siklus-geser') {
            var lg = siklusL[0] ? 1 : 0, lcy = 1 - lg, kg = r[lg].s[V - 1];
            tambah('balik', fig(ganti(lg, r[lg].pada(kum(r[lg].s, V - 1) - kg))), 'corak ' + tt.lapis[lg] + ' berpindah ke arah sebaliknya (' + arahKata(-kg) + ')');
            tambah('mundur', fig(ganti(lcy, pd(lcy, V - 2, V - 2))), 'corak ' + tt.lapis[lcy] + ' berganti mundur pada urutannya');
          } else tambah('tukar-lapis', fig([kunci.lapis[1], kunci.lapis[0]]), 'corak ' + tt.lapis[0] + ' dan ' + tt.lapis[1] + ' tertukar tempat');
        }
        if (d.pola !== 'siklus-putar' && d.pola !== 'siklus-geser') tambah('mundur', fig(semua(V - 2, V - 2)), 'setiap bagian bergerak mundur pada urutan corak (kembali ke corak kotak ' + (V - 1) + ')');
        // satu bagian salah fase
        var lf = siklusL.indexOf(true), Af = kunci.lapis[lf].slice(), Ak = akhir.lapis[lf], cand = rentang(n).filter(function (i) { return Af[i] !== Ak[i]; });
        if (r[lf].k === 0 && cand.length) {
          var qf = a.pilih(cand);
          Af[qf] = Ak[qf];
          tambah('fase', fig(ganti(lf, Af)), (tt.lapis ? tt.lapis[lf] + ' nomor ' : 'bagian ') + (qf + 1) + ' tidak ikut berganti; seharusnya menjadi ' + nama(kunci.lapis[lf][qf]) + ', bukan tetap ' + nama(Ak[qf]));
        }
        if (d.pola !== 'siklus-geser') tambah('lompat', fig(semua(V + 1, V + 1)), 'setiap bagian maju dua langkah pada urutan corak, padahal setiap kotak hanya maju satu langkah');
        var Ssat = d.info.S[0];
        if (Ssat.length >= 3) {
          var ta = Ssat[0], tb = Ssat[1], tukar = kunci.lapis[lf].map(function (c) { return c === ta ? tb : c === tb ? ta : c; });
          tambah('tukar', fig(ganti(lf, tukar)), 'urutan corak ' + nama(ta) + ' dan ' + nama(tb) + ' pada siklus tertukar');
        }
        if (d.pola === 'siklus-satu' || d.pola === 'bentuk-siklus') tambah('putar', fig(ganti(0, geser(akhir.lapis[0], 1, 'tetap', n))), 'corak dipindah satu bagian searah jarum jam, padahal yang terjadi adalah pergantian corak di tempatnya');
        tambah('salin', fig(akhir.lapis, akhir.luar), 'sama persis dengan kotak ' + V);
        break;
      }
      case 'jalar': {
        var rj = r[0], c = rj.c0 + V, Aj = akhir.lapis[0];
        tambah('salin', fig([Aj]), 'banyak bagian hitam tidak bertambah; sama dengan kotak ' + V);
        tambah('lebih', fig([rj.pada(c + 1)]), 'bertambah dua bagian hitam sekaligus, padahal setiap kotak hanya bertambah satu');
        if (c - 1 >= 1) tambah('arah', fig([rj.pada(c, { mulai: mod(rj.s - rj.dir, n) })]), 'bagian hitam baru berada di ujung yang salah (' + arahKata(-rj.dir) + ' dari bagian hitam yang ada)');
        var lompat = Aj.slice();
        lompat[mod(rj.s + rj.dir * c, n)] = 'hitam';
        tambah('lompat', fig([lompat]), 'bagian hitam baru tidak bersebelahan dengan bagian hitam sebelumnya; ada satu bagian yang terlewati');
        if (rj.c0 + V - 1 >= 1) tambah('geser', fig([rj.pada(c - 1, { mulai: mod(rj.s + rj.dir, n) })]), 'bagian hitam hanya bergeser satu bagian, padahal banyaknya bertambah satu setiap kotak');
        var lain2 = Aj.slice(), qb = mod(rj.s + rj.dir * (c - 1), n);
        lain2[qb] = 'bulatan';
        tambah('corak', fig([lain2]), 'bagian yang baru diberi corak hitam berbulatan putih, bukan hitam penuh');
        break;
      }
    }
    // cadangan
    tambah('cermin', cerminFig(kunci), 'susunan coraknya tercermin kiri-kanan dari susunan yang seharusnya');
    var tk = kunci.lapis[0].slice(), qt = rentang(n).filter(function (i) { return tk[i] !== tk[(i + 1) % n]; });
    if (qt.length) { var q0 = a.pilih(qt), tmp = tk[q0]; tk[q0] = tk[(q0 + 1) % n]; tk[(q0 + 1) % n] = tmp; tambah('tukar-dua', fig(ganti(0, tk)), 'dua bagian bersebelahan bertukar corak dari susunan yang seharusnya'); }
    tambah('sebelum', fig(d.kotak[V - 2].lapis, d.kotak[V - 2].luar), 'sama dengan kotak ' + (V - 1) + ', padahal deret terus berlanjut');
    return calon;
  }

  function pilihPengecoh(a, d) {
    var calon = calonPengecoh(a, d), lihat = {}, hasil = [];
    lihat[sj(d.kotak[d.V])] = 1;
    var utama = calon.filter(function (c) { return ['cermin', 'tukar-dua', 'sebelum'].indexOf(c.jenis) < 0; });
    var cad = calon.filter(function (c) { return ['cermin', 'tukar-dua', 'sebelum'].indexOf(c.jenis) >= 0; });
    var urut = a.kocok(utama.slice(0, 5)).concat(utama.slice(5), a.kocok(cad));
    urut.forEach(function (c) {
      if (hasil.length >= 4) return;
      var k = sj(c.fig);
      if (lihat[k]) return;
      lihat[k] = 1;
      hasil.push(c);
    });
    return hasil.length === 4 ? hasil : null;
  }

  // ------------------------------------------------------------- pembahasan

  /** Uraian susunan sebuah kotak dengan nomor bagian. */
  function uraiFig(d, f) {
    var bentuk = d.luarSeq ? 'berbentuk ' + NAMA_BENTUK[f.luar] + '; ' : '';
    if (f.lapis.length === 1) return bentuk + f.lapis[0].map(function (c, i) { return 'bagian ' + (i + 1) + ' ' + nama(c); }).join(', ');
    return bentuk + f.lapis.map(function (A, l) { return d.tt.lapis[l] + ' ' + A.map(function (c, i) { return (i + 1) + ' ' + nama(c); }).join(', '); }).join('; ');
  }

  /** Corak acuan sebuah lapis: corak yang hanya muncul sekali (yang paling mencolok lebih dulu). */
  function pilihAcuan(A, utamakan, larang, larangKode) {
    var urut = (utamakan || []).concat(['hitam', 'bintang', 'bulatan', 'titik', 'kotak', 'kotak-miring', 'arsir-0', 'arsir-90', 'arsir-45', 'arsir-135', 'putih']);
    for (var i = 0; i < urut.length; i++) {
      var c = urut[i], pos = A.indexOf(c);
      if (pos >= 0 && A.lastIndexOf(c) === pos && (!larang || larang.indexOf(pos) < 0) && (!larangKode || larangKode.indexOf(c) < 0)) return pos;
    }
    return null;
  }

/** Corak yang tidak boleh menjadi acuan berikutnya: corak itu sendiri dan corak yang mirip di mata. */
  function miripAcuan(c) { return c === 'hitam' || c === 'bulatan' ? ['hitam', 'bulatan'] : [c]; }

  function jejakDari(d, l, p0, warna) {
    var r = d.aturan[l], pos = [], gs = [];
    for (var t = 0; t <= d.V; t++) pos.push(r.lacak(p0, t));
    for (t = 1; t <= d.V; t++) gs.push(r.langkah(p0, t));
    return { lapis: l, pos: pos, geser: gs, warna: warna };
  }

  /** Daftar nomor bagian tempat corak acuan berada pada kotak-kotak yang tampak. */
  function deretLetak(d, j) {
    return j.pos.slice(0, d.V).map(function (p, t) { return (p + 1) + ' (kotak ' + (t + 1) + ')'; });
  }

  function kalimatPerubahanArah(A, k, n) {
    var lihat = {}, xs = [];
    A.forEach(function (c) {
      var c2 = putarKaku(c, k, n);
      if (c2 !== c && !lihat[c]) { lihat[c] = 1; xs.push(nama(c) + ' menjadi ' + nama(c2)); }
    });
    return xs;
  }

  function uraianPutar(d) {
    var V = d.V, n = d.n, tt = d.tt, kunci = d.kotak[V], akhir = d.kotak[V - 1], pem = [], jejak = [], tetap = [], label = [], catatan = [];
    var intro = 'Setiap kotak berisi ' + tt.nama + '; tiap bagian berisi satu corak.';
    if (tt.lapis) intro += ' Bagian-bagian itu membentuk dua lapis: ' + tt.lapis[0] + ' dan ' + tt.lapis[1] + '. Nomor bagian dihitung searah jarum jam seperti pada Gambar 2.';
    else intro += ' Bagian dinomori 1 sampai ' + n + ' searah jarum jam seperti pada Gambar 2.';
    pem.push(intro);
    var adaArah = d.pola === 'berarah', kodeAcuan = [];
    d.aturan.forEach(function (r, l) {
      var subj = Fmt.kapital(subjek(d, l)), lapisKata = tt.lapis ? tt.lapis[l] : null;
      if (r.jenis === 'diam') {
        pem.push('• ' + Fmt.kapital(lapisKata) + ' tidak pernah berubah: coraknya sama pada semua kotak.');
        return;
      }
      if (r.jenis === 'kelompok-putar') {
        var pg = pilihAcuan(r.A0.filter(function (x, i) { return i % 2 === 0; })), pj = pilihAcuan(r.A0.filter(function (x, i) { return i % 2 === 1; }), null, null, miripAcuan(r.A0[2 * (pg || 0)]));
        if (pj == null) pj = pilihAcuan(r.A0.filter(function (x, i) { return i % 2 === 1; }));
        var jg = jejakDari(d, l, 2 * (pg || 0), 0), jj = jejakDari(d, l, 2 * (pj || 0) + 1, 1);
        jejak.push(jg, jj);
        pem.push('• Bagian bernomor ganjil (' + rentang(n / 2).map(function (i) { return 2 * i + 1; }).join(', ') + ') dan bagian bernomor genap (' + rentang(n / 2).map(function (i) { return 2 * i + 2; }).join(', ') + ') bergerak terpisah. Corak di bagian ganjil berpindah ke bagian ganjil berikutnya ' + arahKata(r.ks[0]) + ' (2 bagian), sedangkan corak di bagian genap berpindah ke bagian genap berikutnya ' + arahKata(r.ks[1]) + '.');
        pem.push('• Contohnya corak ' + nama(r.A0[jg.pos[0]]) + ' berada di bagian ' + daftarKata(deretLetak(d, jg)) + ', dan corak ' + nama(r.A0[jj.pos[0]]) + ' berada di bagian ' + daftarKata(deretLetak(d, jj)) + '.');
        return;
      }
      if (r.jenis === 'diam-satu') {
        var pa = pilihAcuan(r.A0, null, [r.p]), jd = jejakDari(d, l, pa, 0);
        jejak.push(jd);
        tetap.push({ lapis: l, pos: r.p });
        pem.push('• Corak ' + nama(r.A0[r.p]) + ' di bagian ' + (r.p + 1) + ' tidak pernah berpindah. Corak lainnya berpindah 1 bagian ' + arahKata(r.k) + ' setiap kotak, dan bagian ' + (r.p + 1) + ' dilompati (corak yang tiba di depannya langsung melompat ke bagian sesudahnya).');
        pem.push('• Contohnya corak ' + nama(r.A0[pa]) + ' berada di bagian ' + daftarKata(deretLetak(d, jd)) + '.');
        return;
      }
      // putar
      var utama = adaArah ? r.A0.filter(function (c) { return putarKaku(c, r.s[0], n) !== c; }) : null;
      var p0 = pilihAcuan(r.A0, utama, null, kodeAcuan);
      if (p0 == null) p0 = pilihAcuan(r.A0, utama);
      var j = jejakDari(d, l, p0 == null ? 0 : p0, l);
      kodeAcuan = kodeAcuan.concat(miripAcuan(r.A0[j.pos[0]]));
      jejak.push(j);
      var sama = r.s.every(function (x) { return x === r.s[0]; });
      var awalKal = subj + (sama ? ' berpindah ' + langkahKata(r.s[0], n) + ' setiap kotak' : '');
      if (!sama && d.pola === 'bertambah') awalKal = subj + ' berpindah dengan langkah yang bertambah satu bagian setiap kotak: ' + daftarKata(r.s.slice(0, V - 1).map(function (x, t) { return Math.abs(x) + ' bagian dari kotak ' + (t + 1) + ' ke kotak ' + (t + 2); })) + ', semuanya ' + arahKata(r.s[0]);
      if (!sama && d.pola === 'bergantian') awalKal = subj + ' berpindah dengan langkah yang bergantian ' + Math.abs(r.s[0]) + ' bagian dan ' + Math.abs(r.s[1]) + ' bagian ' + arahKata(r.s[0]) + ': ' + daftarKata(r.s.slice(0, V - 1).map(function (x, t) { return Math.abs(x) + ' bagian dari kotak ' + (t + 1) + ' ke kotak ' + (t + 2); }));
      pem.push('• ' + awalKal + (adaArah ? '. Seluruh lapis berputar bersama bagiannya, jadi arah garis pada corak ikut berputar ' + Math.abs(r.s[0]) * 360 / n + '° ' + arahKata(r.s[0]) : ', sedangkan coraknya sendiri tidak berubah') + '.');
      var contoh = '• Contohnya corak ' + nama(r.A0[j.pos[0]]) + (lapisKata ? ' pada ' + lapisKata : '') + ' berada di bagian ' + daftarKata(deretLetak(d, j)) + '.';
      if (adaArah) {
        var ubah = kalimatPerubahanArah(r.A0.concat(d.kotak[1].lapis[l]), r.s[0], n);
        if (ubah.length) contoh += ' Setiap kali berpindah: corak ' + daftarKata(ubah.slice(0, 3)) + '.';
      }
      pem.push(contoh);
    });
    // label langkah di bawah kotak
    for (var t = 1; t <= V; t++) label.push(jejak.map(function (j) { return { teks: tandaLangkah(j.geser[t - 1]), warna: j.warna }; }));
    catatan.push('Tanda + berarti searah jarum jam, tanda - berlawanan arah jarum jam; angkanya banyak bagian yang dilalui corak acuan (bergaris tepi berwarna).' + (tetap.length ? ' Bagian bergaris tepi merah putus-putus tidak pernah berpindah.' : ''));
    var refs = jejak.map(function (j) { return 'corak ' + nama(d.kotak[0].lapis[j.lapis][j.pos[0]]) + (tt.lapis ? ' pada ' + tt.lapis[j.lapis] : '') + ' (garis ' + (j.warna === 0 ? 'jingga' : 'biru') + ')'; });
    pem.push('Gambar 1 menandai jejak ' + daftarKata(refs) + ' dari kotak ke kotak; busur berpanah menunjukkan arah dan banyak bagian perpindahannya, dan kotak terakhir berlatar hijau muda adalah jawabannya.');
    // langkah terakhir
    var akhirKal = d.aturan.map(function (r, l) {
      var lk = tt.lapis ? 'corak ' + tt.lapis[l] : 'semua corak';
      if (r.jenis === 'diam') return lk + ' tetap';
      if (r.jenis === 'kelompok-putar') return 'corak bagian ganjil pindah ke bagian ganjil berikutnya ' + arahKata(r.ks[0]) + ' dan corak bagian genap ke bagian genap berikutnya ' + arahKata(r.ks[1]);
      if (r.jenis === 'diam-satu') return 'corak ' + nama(r.A0[r.p]) + ' tetap di bagian ' + (r.p + 1) + ', corak lainnya berpindah 1 bagian ' + arahKata(r.k) + ' sambil melompati bagian itu';
      return lk + ' berpindah ' + langkahKata(r.s[V - 1], n) + (adaArah ? ' sambil arah garisnya ikut berputar ' + Math.abs(r.s[V - 1]) * 360 / n + '°' : '');
    });
    var panel = [{ fig: akhir, judul: 'Kotak ' + V, nomor: true, sorot: tetap.map(function (h) { return { lapis: h.lapis, pos: h.pos, warna: BH.acuan, putus: '5 3', tebal: 2.8 }; }) }];
    var panah = [];
    if (adaArah) {
      var antara = buatFig(tt, kunci.luar, akhir.lapis.map(function (A, l) { return geser(A, d.aturan[l].s[V - 1], 'tetap', n); }));
      panel.push({ fig: antara, judul: 'Corak dipindah', nomor: true });
      panah.push(d.aturan.length === 1 ? 'pindah ' + tandaLangkah(d.aturan[0].s[V - 1]) + ' bagian' : 'pindah tiap lapis');
      panah.push('arah garis ikut berputar');
    } else {
      var r0 = d.aturan[0];
      panah.push(d.aturan.length > 1 ? 'pindah tiap lapis' : r0.jenis === 'putar' ? 'pindah ' + tandaLangkah(r0.s[V - 1]) + ' bagian'
        : r0.jenis === 'diam-satu' ? 'pindah ' + tandaLangkah(r0.k) + ', lompati bagian ' + (r0.p + 1) : 'ganjil dan genap pindah');
    }
    panel.push({ fig: kunci, judul: 'Kotak ' + (V + 1) + ' (jawaban)', nomor: true, jawab: true, sorot: panel[0].sorot });
    pem.push('Gambar 2 menerapkan aturan itu pada kotak ' + V + (adaArah ? ' (corak dipindah lebih dahulu, lalu arah garisnya diputar)' : '') + ': ' + daftarKata(akhirKal) + '.');
    pem.push('Jadi kotak berikutnya: ' + uraiFig(d, kunci) + '.');
    var bahas = [
      { id: 'bahas-1', jenis: 'scorak-jejak', judul: 'Gambar 1. Jejak corak acuan dari kotak 1 sampai kotak ' + (V + 1),
        model: { kotak: d.kotak.slice(0, V), jawaban: kunci, jejak: jejak, tetap: tetap, label: label, catatan: catatan } },
      { id: 'bahas-2', jenis: 'scorak-tahap', judul: 'Gambar 2. Kotak ' + V + ' menjadi kotak ' + (V + 1),
        model: { jawaban: kunci, panel: panel, panah: panah, teks: akhirKal.map(function (x, i) { return { teks: Fmt.kapital(x) + '.', warna: d.aturan.length > 1 ? i : (jejak[0] ? jejak[0].warna : 0) }; }) } }
    ];
    return { pem: pem, bahas: bahas };
  }

  function urutanKata(Sx) { return Sx.map(nama).join(' → ') + (Sx.length > 1 ? ' → kembali ke ' + nama(Sx[0]) : ''); }

  function uraianGanti(d) {
    var V = d.V, n = d.n, tt = d.tt, kunci = d.kotak[V], akhir = d.kotak[V - 1], pem = [], bahas = [];
    var intro = 'Setiap kotak berisi ' + tt.nama + '; tiap bagian berisi satu corak.';
    if (tt.lapis) intro += ' Bagian-bagian itu membentuk dua lapis: ' + tt.lapis[0] + ' dan ' + tt.lapis[1] + '.';
    var nomorDi = (d.pola === 'jalar' || d.pola === 'bentuk-putar') ? 'Gambar 2' : 'Gambar 2';
    pem.push(intro + ' Bagian dinomori searah jarum jam seperti pada ' + nomorDi + '.');
    var bentukKal = '';
    if (d.luarSeq) {
      var per = d.info.bentuk;
      bentukKal = 'Bentuk luarnya berganti dengan urutan tetap: ' + per.map(function (x) { return NAMA_BENTUK[x]; }).join(', ') + ', lalu kembali ke ' + NAMA_BENTUK[per[0]] + ' (kotak 1 sampai ' + V + ': ' + daftarKata(d.kotak.slice(0, V).map(function (f) { return NAMA_BENTUK[f.luar]; })) + '). Jadi kotak ' + (V + 1) + ' berbentuk ' + NAMA_BENTUK[kunci.luar] + '.';
    }
    /** Corak yang dibawa satu bagian dari kotak ke kotak (mengikuti perpindahannya bila susunan bergeser). */
    function contohBagian(l, i) {
      var r = d.aturan[l], seq = rentang(V).map(function (t) { var p = r.lacak(i, t); return nama(d.kotak[t].lapis[l][p]) + ' (kotak ' + (t + 1) + (r.k ? ', bagian ' + (p + 1) : '') + ')'; });
      return (r.k ? 'corak yang semula di ' : '') + (tt.lapis ? tt.lapis[l] + ' nomor ' : 'bagian ') + (i + 1) + ': ' + seq.join(', ');
    }
    var siklusBaris = [], catatanS = [];
    if (d.pola === 'jalar') {
      var rj = d.aturan[0], cnt = rentang(V).map(function (t) { return rj.c0 + t; });
      pem.push('• Banyak bagian hitam bertambah satu setiap kotak: ' + daftarKata(cnt.map(String)) + ' bagian pada kotak 1 sampai ' + V + '. Bagian yang baru menjadi hitam selalu bersebelahan dengan bagian hitam sebelumnya, sehingga daerah hitam bertambah ' + arahKata(rj.dir) + ', sedangkan bagian yang belum hitam tidak berubah coraknya.');
      var ujung = rj.ujung(V), baru = ujung;
      pem.push('• Pada kotak ' + V + ' ada ' + (rj.c0 + V - 1) + ' bagian hitam, jadi kotak ' + (V + 1) + ' memiliki ' + (rj.c0 + V) + ' bagian hitam: bagian ' + (baru + 1) + ' ikut menjadi hitam, bagian lain tetap.');
      // busur di kotak t+1 dari ujung hitam kotak t ke ujung yang baru (tidak ada bila kotak t belum berhitam)
      var jejak = { lapis: 0, pos: rentang(V + 1).map(function (t) { return rj.ujung(t); }), geser: rentang(V).map(function (t) { return rj.ujung(t) == null ? 0 : rj.dir; }), warna: 0 };
      var label = rentang(V).map(function () { return [{ teks: '+1 hitam', warna: 0 }]; });
      pem.push('Gambar 1 menandai bagian yang baru menjadi hitam pada setiap kotak (garis jingga) dan busur berpanah menunjukkan arah bertambahnya. Gambar 2 menerapkan aturan itu pada kotak ' + V + '.');
      bahas.push({ id: 'bahas-1', jenis: 'scorak-jejak', judul: 'Gambar 1. Bagian hitam bertambah satu setiap kotak',
        model: { kotak: d.kotak.slice(0, V), jawaban: kunci, jejak: [jejak], tetap: [], label: label, catatan: ['Bagian bergaris tepi jingga adalah bagian yang baru menjadi hitam pada kotak itu; bagian hitam bertambah ' + arahKata(rj.dir) + '.'] } });
      bahas.push({ id: 'bahas-2', jenis: 'scorak-tahap', judul: 'Gambar 2. Kotak ' + V + ' menjadi kotak ' + (V + 1),
        model: { jawaban: kunci, panel: [{ fig: akhir, judul: 'Kotak ' + V, nomor: true }, { fig: kunci, judul: 'Kotak ' + (V + 1) + ' (jawaban)', nomor: true, jawab: true, sorot: [{ lapis: 0, pos: baru, warna: WARNA[0] }] }],
          panah: ['+1 bagian hitam'], teks: [{ teks: 'Bagian ' + (baru + 1) + ', yaitu bagian berikutnya ' + arahKata(rj.dir) + ' setelah bagian hitam terakhir, menjadi hitam; bagian lain tetap.', warna: 0 }] } });
      pem.push('Jadi kotak berikutnya: ' + uraiFig(d, kunci) + '.');
      return { pem: pem, bahas: bahas };
    }
    if (bentukKal) pem.push('• ' + bentukKal);
    d.aturan.forEach(function (r, l) {
      var lk = tt.lapis ? tt.lapis[l] : null;
      if (r.jenis === 'putar') {
        var p0 = pilihAcuan(r.A0), seqP = rentang(V).map(function (t) { return (r.lacak(p0, t) + 1) + ' (kotak ' + (t + 1) + ')'; });
        pem.push('• ' + Fmt.kapital(lk ? 'corak ' + lk : 'semua corak') + ' tidak berganti, tetapi berpindah ' + langkahKata(r.s[0], n) + ' setiap kotak. Contohnya corak ' + nama(r.A0[p0]) + ' berada di ' + (lk ? lk + ' nomor ' : 'bagian ') + daftarKata(seqP) + '.');
        return;
      }
      // siklus
      var grup = {}, urutG = [];
      r.cyc.forEach(function (c, i) { var key = c.join('|'); if (!grup[key]) { grup[key] = []; urutG.push(key); } grup[key].push(i); });
      urutG.forEach(function (key) {
        var pos = grup[key], Sx = r.cyc[pos[0]], siapa;
        if (urutG.length > 1) siapa = 'Bagian bernomor ' + (pos[0] % 2 === 0 ? 'ganjil' : 'genap') + ' (' + pos.map(function (i) { return i + 1; }).join(', ') + ')';
        else siapa = lk ? 'Setiap ' + lk : 'Setiap bagian';
        var judulBaris = urutG.length > 1 ? 'Bagian ' + (pos[0] % 2 === 0 ? 'ganjil' : 'genap') : (lk ? Fmt.kapital(lk) : 'Setiap bagian');
        siklusBaris.push({ judul: judulBaris, kode: Sx });
        if (Sx.length === 1) { pem.push('• ' + siapa + ' tidak pernah berganti corak: selalu ' + nama(Sx[0]) + '.'); return; }
        if (r.k) pem.push('• Setiap corak ikut berpindah bersama susunannya sambil berganti mengikuti urutan tetap ' + urutanKata(Sx) + '; setiap kotak tiap corak maju satu langkah pada urutan itu. Contohnya ' + contohBagian(l, pos[0]) + '.');
        else pem.push('• ' + siapa + ' berganti corak mengikuti urutan tetap ' + urutanKata(Sx) + '. Setiap kotak, ' + (urutG.length > 1 || !lk ? 'bagian-bagian itu' : 'tiap ' + lk) + ' maju satu langkah pada urutan itu; yang berbeda hanya titik awalnya. Contohnya ' + contohBagian(l, pos[0]) + '.');
      });
      if (r.k) pem.push('• Selain berganti corak, seluruh susunan berpindah ' + langkahKata(r.k, n) + ' setiap kotak. Jadi corak yang tiba di suatu bagian adalah corak bagian sebelumnya yang sudah maju satu langkah pada urutan.');
    });
    if (d.luarSeq) siklusBaris.push({ judul: 'Bentuk luar', bentuk: d.info.bentuk });
    var akhirTeks = [];
    d.aturan.forEach(function (r, l) {
      var lk = tt.lapis ? Fmt.kapital(tt.lapis[l]) + ': ' : '';
      if (r.jenis === 'putar') akhirTeks.push({ teks: Fmt.kapital(lk + 'semua corak berpindah ' + langkahKata(r.s[V - 1], n) + '.'), warna: l });
      else if (r.k) akhirTeks.push({ teks: 'Setiap corak maju satu langkah pada urutannya, lalu seluruh susunan berpindah ' + langkahKata(r.k, n) + '.', warna: l });
      else akhirTeks.push({ teks: lk + 'setiap bagian maju satu langkah pada urutan coraknya.', warna: l });
    });
    if (d.luarSeq) akhirTeks.unshift({ teks: 'Bentuk luar berganti dari ' + NAMA_BENTUK[akhir.luar] + ' menjadi ' + NAMA_BENTUK[kunci.luar] + '.', warna: null });
    var dua = d.pola === 'siklus-putar' || d.pola === 'bentuk-putar';
    if (dua) {
      // dua tahap: (1) perubahan pertama, (2) perubahan kedua
      var r0 = d.aturan[0], antara, lb1, lb2;
      if (d.pola === 'siklus-putar') {
        antara = buatFig(tt, kunci.luar, [r0.pada(V - 1, V)]);
        lb1 = 'corak maju satu langkah'; lb2 = 'pindah ' + tandaLangkah(r0.k) + ' bagian';
      } else {
        antara = buatFig(tt, kunci.luar, [akhir.lapis[0]]);
        lb1 = 'bentuk luar berganti'; lb2 = 'pindah ' + tandaLangkah(r0.s[V - 1]) + ' bagian';
      }
      bahas.push(d.pola === 'siklus-putar'
        ? { id: 'bahas-1', jenis: 'scorak-siklus', judul: 'Gambar 1. Urutan corak yang berulang', model: { baris: siklusBaris, catatan: ['Setiap kotak, tiap corak maju satu langkah mengikuti panah; setelah corak terakhir, kembali ke corak pertama.'] } }
        : (function () {
          var p0 = pilihAcuan(r0.A0), j = jejakDari(d, 0, p0, 0);
          return { id: 'bahas-1', jenis: 'scorak-jejak', judul: 'Gambar 1. Bentuk luar dan jejak corak ' + nama(r0.A0[p0]),
            model: { kotak: d.kotak.slice(0, V), jawaban: kunci, jejak: [j], tetap: [], label: rentang(V).map(function (t) { return [{ teks: tandaLangkah(j.geser[t]), warna: 0 }]; }),
              catatan: ['Tanda + berarti searah jarum jam, tanda - berlawanan arah jarum jam. Bentuk luar berganti dengan urutan ' + d.info.bentuk.map(function (x) { return NAMA_BENTUK[x]; }).join(', ') + ', lalu berulang.'] } };
        })());
      bahas.push({ id: 'bahas-2', jenis: 'scorak-tahap', judul: 'Gambar 2. Kotak ' + V + ' menjadi kotak ' + (V + 1) + ' dalam dua tahap',
        model: { jawaban: kunci, panel: [{ fig: akhir, judul: 'Kotak ' + V, nomor: true }, { fig: antara, judul: 'Tahap 1', nomor: true }, { fig: kunci, judul: 'Kotak ' + (V + 1) + ' (jawaban)', nomor: true, jawab: true }],
          panah: [lb1, lb2], teks: akhirTeks } });
      pem.push(d.pola === 'siklus-putar'
        ? 'Gambar 1 memperlihatkan urutan corak yang berulang. Gambar 2 menerapkan kedua perubahan pada kotak ' + V + ' secara bertahap: corak maju satu langkah lebih dahulu, lalu seluruh susunan dipindahkan.'
        : 'Gambar 1 menandai jejak satu corak dari kotak ke kotak beserta bentuk luarnya. Gambar 2 menerapkan kedua perubahan pada kotak ' + V + ' secara bertahap: bentuk luar diganti lebih dahulu, lalu corak dipindahkan.');
    } else {
      bahas.push({ id: 'bahas-1', jenis: 'scorak-siklus', judul: 'Gambar 1. Urutan ' + (d.luarSeq ? 'corak dan bentuk luar' : 'corak') + ' yang berulang',
        model: { baris: siklusBaris, catatan: ['Setiap kotak, ' + (d.luarSeq ? 'bentuk luar dan ' : '') + 'corak tiap bagian maju satu langkah mengikuti panah; setelah yang terakhir, kembali ke yang pertama.'] } });
      if (d.pola === 'siklus-geser') {
        var lg = d.aturan[0].jenis === 'putar' ? 0 : 1;
        bahas.push({ id: 'bahas-2', jenis: 'scorak-tahap', judul: 'Gambar 2. Kotak ' + V + ' menjadi kotak ' + (V + 1),
          model: { jawaban: kunci, panel: [{ fig: akhir, judul: 'Kotak ' + V, nomor: true }, { fig: kunci, judul: 'Kotak ' + (V + 1) + ' (jawaban)', nomor: true, jawab: true }],
            panah: ['terapkan kedua aturan'], teks: akhirTeks } });
        pem.push('Gambar 1 memperlihatkan urutan corak ' + tt.lapis[1 - lg] + '. Gambar 2 menerapkan kedua aturan pada kotak ' + V + ': ' + tt.lapis[1 - lg] + ' maju satu langkah pada urutan coraknya dan ' + tt.lapis[lg] + ' berpindah ' + langkahKata(d.aturan[lg].s[V - 1], n) + '.');
      } else {
        bahas.push({ id: 'bahas-2', jenis: 'scorak-tabel', judul: 'Gambar 2. Corak setiap bagian dari kotak 1 sampai kotak ' + (V + 1),
          model: { kotak: d.kotak.slice(0, V), jawaban: kunci, pendek: tt.pendek || null, bentuk: !!d.luarSeq } });
        pem.push('Gambar 1 memperlihatkan urutan ' + (d.luarSeq ? 'bentuk luar dan urutan ' : '') + 'corak yang berulang. Gambar 2 menyajikan corak setiap bagian pada setiap kotak; baris-barisnya dibaca dari kiri ke kanan, dan kolom hijau adalah kotak ' + (V + 1) + ' yang diperoleh dengan memajukan setiap bagian satu langkah lagi.');
      }
    }
    pem.push('Jadi kotak berikutnya: ' + uraiFig(d, kunci) + '.');
    return { pem: pem, bahas: bahas };
  }

  // --------------------------------------------------------------------- butir

  function sidikFig(f) { return f.luar + ':' + f.lapis.map(kunciArr).join('/'); }

  function pilihPola(a, id, level, dipakai) {
    var semua = POLA[id][level], baru = semua.filter(function (p) { return (dipakai || []).indexOf(id + ':' + p) < 0; });
    return a.pilih(baru.length ? baru : semua);
  }

  function buat(id, level, benih, opsi) {
    opsi = opsi || {};
    if (!POLA[id] || !POLA[id][level]) return null;
    var a = Rng.alat(benih);
    var target = opsi.target == null ? a.bulat(0, 4) : opsi.target;
    var boleh = opsi.polaBoleh || POLA[id][level];
    var baru = boleh.filter(function (p) { return (opsi.polaDipakai || []).indexOf(id + ':' + p) < 0; });
    var putar = id === 'serial-corak-putar', pola = a.pilih(baru.length ? baru : boleh);
    for (var coba = 0; coba < 60; coba++) {
      if (coba && coba % 15 === 0) pola = a.pilih(boleh);
      var V = banyakKotak(a), d = putar ? susunPutar(a, pola, V) : susunGanti(a, pola, V);
      if (opsi.riset && (!d || [4, 8].indexOf(d.n) < 0)) continue;
      if (!sahDesain(d)) continue;
      V = d.V;                                           // penyusun boleh mengubah banyak kotak (mis. jalar 6 bagian)
      if (level !== 'mudah' && coba < 30 && adaUlang(d)) continue;
      if (!putar && d.aturan.some(function (r, l) { return r.jenis === 'siklus' && !peralihanTerlihat(d.kotak.map(function (f) { return f.lapis[l]; }), V, r.k, d.n); })) continue;
      var peng = pilihPengecoh(a, d);
      if (!peng) continue;
      var urai = putar ? uraianPutar(d) : uraianGanti(d), kunci = d.kotak[V];

      var daftar = a.kocok(peng.map(function (p) { return { fig: p.fig, alasan: p.alasan, kunci: false }; }));
      daftar.splice(target, 0, { fig: kunci, alasan: null, kunci: true });
      var opsiGambar = daftar.map(function (x, i) {
        return { teks: 'Gambar opsi ' + Fmt.huruf(i), nilai: i, alasan: x.alasan ? Fmt.kapital(x.alasan) + '.' : null, kunci: x.kunci,
          gambar: { id: 'opsi-' + Fmt.huruf(i).toLowerCase(), jenis: 'scorak-opsi', model: { fig: x.fig }, judul: 'Opsi ' + Fmt.huruf(i) } };
      });
      var tampak = d.kotak.slice(0, V);
      var ctx = { subtes: 'ku', submateri: 'figural', keluarga: id, level: level, benih: benih, a: a };
      var butir = Butir.rakitPg(ctx, {
        jenisSoal: 'Figural Serial - The Next Box (' + (putar ? 'corak berpindah antarbagian' : 'corak berganti mengikuti siklus') + ')',
        judul: 'Figural Serial - The Next Box', teks: [], pertanyaan: '', perintah: PERINTAH,
        gambar: [{ id: 'soal', jenis: 'scorak-deret', model: { kotak: tampak, ukuran: ukuranKotak(V) }, judul: 'Deret bangun bercorak' }],
        pilihanJadi: { opsi: opsiGambar, kunciIndex: target }, tulisKunci: false,
        langkah: [], pembahasan: urai.pem,
        model: { topik: 'Figural', tipe: id, kotak: tampak, pilihan: daftar.map(function (x) { return x.fig; }), kunciIndex: target },
        sidik: { inti: id + '|' + d.tt.tata + ':' + d.n + ':' + d.tt.awal + '|' + d.kotak.map(sidikFig).join('#'), param: [], entitas: id + ':' + pola }
      });
      if (!butir) continue;
      butir.gambarPembahasan = urai.bahas;
      butir.pola = id + ':' + pola;
      butir.kategoriRiset = 'pengayaan';
      butir.catatanRiset = putar
        ? 'Bangun bercorak bergaya matriks bersekat contoh riset soal 4, diterapkan pada deret The Next Box dengan corak yang berpindah antarbagian; bentuk ini tidak ada pada contoh riset BAB V.'
        : 'Bangun bercorak bergaya matriks bersekat contoh riset soal 4, diterapkan pada deret The Next Box dengan corak yang berganti mengikuti siklus; bentuk ini tidak ada pada contoh riset BAB V.';
      return butir;
    }
    return null;
  }

  var KELUARGA = [
    { id: 'serial-corak-putar', nama: 'Deret bangun bercorak: corak berpindah antarbagian', submateri: 'figural', kolam: 'serial' },
    { id: 'serial-corak-ganti', nama: 'Deret bangun bercorak: corak berganti mengikuti siklus', submateri: 'figural', kolam: 'serial' }
  ];

  var GAMBAR = {
    'scorak-deret': function (m) { return svgDeret(m); },
    'scorak-opsi': function (m) { return svgOpsi(m); },
    'scorak-jejak': svgJejak,
    'scorak-tahap': svgTahap,
    'scorak-tabel': svgTabel,
    'scorak-siklus': svgSiklus
  };

  return { KELUARGA: KELUARGA, PERINTAH: PERINTAH, buat: buat, GAMBAR: GAMBAR, ramalLapis: ramalLapis };
});
