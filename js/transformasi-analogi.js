/*
 * transformasi-analogi.js — Kemampuan Umum > Figural > Macam-macam Transformasi Figural.
 *
 * Dua keluarga soal figural pengayaan:
 *
 *   transformasi-analogi  (kolam matriks) analogi gambar "kotak 1 : kotak 2 = kotak 3 : ?".
 *       Kotak 2 adalah kotak 1 yang dikenai transformasi T, dan jawabannya kotak 3 yang dikenai T
 *       yang sama. Bentuk kotak 1 dan kotak 3 dibangkitkan families.js dari dua keluarga bentuk yang
 *       berbeda (keduanya tidak simetri putar dan kiral, jadi arah dan cermin selalu terbaca tegas).
 *       Pustaka T:
 *         putar    90°, 180°, 90° berlawanan (270°); kelipatan 45° untuk sulit
 *         cermin   sumbu tegak, datar, dan kedua diagonal
 *         warna    isi setiap titik (lingkaran kecil) dibalik: hitam <-> putih
 *         hapus    semua titik dihapus
 *         tambah   sebuah titik hitam ditambahkan di pusat gambar
 *         skala    gambar diperkecil / diperbesar
 *         pindah   gambar berpindah letak di dalam kotak (tengah dan keempat pojok)
 *       mudah   satu transformasi dasar yang jelas (putar 90/180, cermin tegak/datar, hapus, tambah,
 *               skala, pindah)
 *       sedang  satu transformasi yang lebih halus (putar 90° berlawanan, cermin diagonal, warna), atau
 *               dua transformasi sederhana berbeda jenis
 *       sulit   dua transformasi berbeda jenis, salah satunya halus (kelipatan 45°, diagonal, warna)
 *       Pengecoh: hanya satu dari dua transformasi diterapkan, arah putar terbalik, besar putaran
 *       salah, sumbu cermin salah, cermin dan putar tertukar, sebagian titik saja yang diubah, titik
 *       tambahan salah warna/letak, ukuran atau pojok salah, menyalin kotak 2, kotak 3 tidak diubah.
 *       Penyusun menyimpulkan ulang T dari kotak 1 -> 2 dengan pustaka yang lebar (sampai tiga
 *       langkah) dan menolak calon yang ambigu: bila beberapa T cocok dengan kotak 1 -> 2 tetapi
 *       hasilnya pada kotak 3 berbeda.
 *
 *   transformasi-beda     (kolam serial) "gambar yang berbeda sendiri". Tanpa gambar soal; kelima
 *       opsi adalah gambar. Empat opsi adalah satu bentuk kiral yang diputar dengan sudut berbeda,
 *       satu opsi berbeda:
 *         mudah   satu unsur hilang, satu titik tambahan, atau isi satu unsur berganti (sudut kelipatan 90°)
 *         sedang  bayangan cermin yang diputar, atau ukuran satu unsur berubah (kelipatan 90°/45°)
 *         sulit   bayangan cermin, atau satu unsur bergeser / berputar / tercermin sendiri secara halus
 *                 tetapi terlihat (kelipatan 45°)
 *
 * Koordinat kotak analogi: 100 satuan, titik asal di tengah kotak; isi kotak = { letak, unsur } dengan
 * unsur relatif terhadap pusat letaknya (tengah atau pusat salah satu pojok). Semua transformasi
 * dihitung terhadap pusat letak itu. Model unsur sama dengan figure.js (garis/bulat), tanpa nama.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./rng.js'), require('./svg.js'), require('./butir.js'), require('./format.js'), require('./metrik.js'),
      require('./figure.js'), require('./families.js'));
    module.exports = api;
  } else {
    api = factory(root.Rng, root.Svg, root.Butir, root.Fmt, root.Metrik, root.Figure, root.Families);
    root.TransformasiAnalogi = api;
  }
})(typeof self !== 'undefined' ? self : this, function (Rng, S, Butir, Fmt, Metrik, F, Fam) {
  'use strict';

  var PERINTAH_ANALOGI = 'Perhatikan perubahan dari kotak pertama ke kotak kedua. Perubahan yang sama berlaku dari kotak ketiga ke kotak bertanda tanya. Pilih gambar yang tepat untuk menggantikan tanda tanya.';
  var PERINTAH_BEDA = 'Empat dari lima gambar berikut adalah satu gambar yang sama, hanya diputar dengan sudut yang berbeda-beda. Pilih gambar yang berbeda sendiri.';

  var TINTA = '#1d1d1d', TEPI = '#4a5266', LATAR_TANYA = '#f4f6fb', HANTU = '#b9c0cd', BH = S.BAHAS;
  // jangkauan gambar: penuh, kecil di tengah kotak (skala), kecil di pojok kotak (pindah)
  var PENUH = 40, KECIL = 22, KECIL_POJOK = 20, RT = 5, TOL = 0.02;
  // lingkaran berjari-jari paling banyak AMBANG_TITIK satuan adalah "titik"; titik terbesar 10,4 dan lingkaran
  // besar terkecil 16 satuan (lihat bentukDasar), jadi golongannya selalu tegas
  var AMBANG_TITIK = 13.5;
  var LETAK = { tengah: [0, 0], 'kiri-atas': [-26, -26], 'kanan-atas': [26, -26], 'kanan-bawah': [26, 26], 'kiri-bawah': [-26, 26] };
  // tempat titik hitam yang ditambahkan (pojok kotak, di luar jangkauan gambar sehingga tidak pernah menempel)
  var TITIK_POJOK = { 'kiri-atas': [-37, -37], 'kanan-atas': [37, -37], 'kanan-bawah': [37, 37], 'kiri-bawah': [-37, 37] };
  var NAMA_LETAK = { tengah: 'tengah kotak', 'kiri-atas': 'pojok kiri atas', 'kanan-atas': 'pojok kanan atas', 'kanan-bawah': 'pojok kanan bawah', 'kiri-bawah': 'pojok kiri bawah' };
  var PENDEK_LETAK = { tengah: 'tengah', 'kiri-atas': 'kiri atas', 'kanan-atas': 'kanan atas', 'kanan-bawah': 'kanan bawah', 'kiri-bawah': 'kiri bawah' };
  var POJOK = ['kiri-atas', 'kanan-atas', 'kanan-bawah', 'kiri-bawah'];
  var SUMBU = ['tegak', 'datar', 'diag1', 'diag2'];
  var NAMA_SUMBU = { tegak: 'sumbu tegak', datar: 'sumbu datar', diag1: 'sumbu diagonal dari kiri atas ke kanan bawah', diag2: 'sumbu diagonal dari kanan atas ke kiri bawah' };
  var KELUARGA_BENTUK = Fam.KELUARGA.map(function (k) { return k.id; });
  // gambar yang ikut diperkecil/dipindah ke pojok: tanpa pita zigzag menyilang dan bingkai bersarang yang rapat
  var KELUARGA_KECIL = KELUARGA_BENTUK.filter(function (k) { return k !== 'zigzag' && k !== 'sarang'; });

  // ------------------------------------------------------------------ dasar geometri

  function r3(v) { var x = Math.round(v * 1000) / 1000; return x === 0 ? 0 : x; }
  function sudutNorm(d) { d = ((d % 360) + 360) % 360; return d > 180 ? d - 360 : d; }

  /** Salinan unsur tanpa nama; isi dibakukan menjadi tinta atau null. */
  function salinU(u) {
    if (u.jenis === 'bulat') return { jenis: 'bulat', pusat: [u.pusat[0], u.pusat[1]], jari: u.jari, isi: u.isi ? TINTA : null };
    return { jenis: 'garis', titik: u.titik.map(function (p) { return [p[0], p[1]]; }), tutup: !!u.tutup, isi: u.isi ? TINTA : null, kepala: u.kepala || 0 };
  }

  function bulatkanU(daftar) {
    return daftar.map(function (u) {
      var v = salinU(u);
      if (v.jenis === 'bulat') { v.pusat = [r3(v.pusat[0]), r3(v.pusat[1])]; v.jari = r3(v.jari); }
      else v.titik = v.titik.map(function (p) { return [r3(p[0]), r3(p[1])]; });
      return v;
    });
  }

  /** Putar d derajat SEARAH jarum jam di layar (y ke bawah). */
  function fPutar(d) {
    var a = d * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
    if (Math.abs(c) < 1e-12) c = 0;
    if (Math.abs(s) < 1e-12) s = 0;
    return function (p) { return [p[0] * c - p[1] * s, p[0] * s + p[1] * c]; };
  }

  /** Cermin terhadap sumbu yang melalui titik asal. Urutan titik TIDAK dibalik (mata panah tetap di ujungnya). */
  function fCermin(sb) {
    if (sb === 'tegak') return function (p) { return [-p[0], p[1]]; };
    if (sb === 'datar') return function (p) { return [p[0], -p[1]]; };
    if (sb === 'diag1') return function (p) { return [p[1], p[0]]; };
    return function (p) { return [-p[1], -p[0]]; };
  }

  function petakan(daftar, f) {
    return daftar.map(function (u) {
      var v = salinU(u);
      if (v.jenis === 'bulat') v.pusat = f(u.pusat); else v.titik = u.titik.map(f);
      return v;
    });
  }

  function skalakan(daftar, k) {
    return daftar.map(function (u) {
      var v = salinU(u);
      if (v.jenis === 'bulat') { v.pusat = [u.pusat[0] * k, u.pusat[1] * k]; v.jari = u.jari * k; }
      else v.titik = u.titik.map(function (p) { return [p[0] * k, p[1] * k]; });
      return v;
    });
  }

  function geserU(daftar, dx, dy) { return petakan(daftar, function (p) { return [p[0] + dx, p[1] + dy]; }); }

  /** Jarak terjauh dari titik asal (tepat: simpul garis, tepi lingkaran). */
  function jangkauanU(daftar) {
    var m = 0;
    daftar.forEach(function (u) {
      if (u.jenis === 'bulat') m = Math.max(m, Math.hypot(u.pusat[0], u.pusat[1]) + u.jari);
      else u.titik.forEach(function (p) { m = Math.max(m, Math.hypot(p[0], p[1])); });
    });
    return m;
  }

  /** Titik = lingkaran kecil (jari-jari paling banyak AMBANG_TITIK satuan kotak); sisanya garis/bangun. */
  function pisah(daftar) {
    var g = [], t = [];
    daftar.forEach(function (u) { (u.jenis === 'bulat' && u.jari <= AMBANG_TITIK ? t : g).push(u); });
    return { garis: g, titik: t };
  }

  function samaDaftar(a, b) { return F.samaPersis({ unsur: a }, { unsur: b }, TOL); }
  function samaIsi(p, q) { return p.letak === q.letak && samaDaftar(p.unsur, q.unsur); }

  function panjangU(u) { return F.panjangUnsur(u); }

  function garisTerpanjang(daftar) {
    var idx = -1, pj = -1;
    daftar.forEach(function (u, i) {
      if (u.jenis !== 'garis') return;
      var p = panjangU(u);
      if (p > pj + 1e-9) { pj = p; idx = i; }
    });
    return idx;
  }

  function cuplik(daftar, dx, dy) {
    if (!daftar.length) return [];
    return F.sampelBatas({ unsur: daftar }, 70).map(function (p) { return [p[0] + (dx || 0), p[1] + (dy || 0)]; });
  }

  /** Jarak chamfer dua arah (rerata jarak tiap titik ke titik terdekat lawannya). */
  function chamfer(p, q) {
    function satu(a, b) {
      var s = 0;
      for (var i = 0; i < a.length; i++) {
        var m = Infinity;
        for (var j = 0; j < b.length; j++) {
          var dx = a[i][0] - b[j][0], dy = a[i][1] - b[j][1], d = dx * dx + dy * dy;
          if (d < m) m = d;
        }
        s += Math.sqrt(m);
      }
      return s / a.length;
    }
    return (satu(p, q) + satu(q, p)) / 2;
  }

  /** Jarak titik p ke unsur-unsur: garis/bangun sebagai goresan, titik sebagai cakram. */
  function jarakMin(p, garis, titik) {
    var m = Infinity;
    garis.forEach(function (u) { m = Math.min(m, F.jarakKeUnsur(p, u)); });
    titik.forEach(function (u) { m = Math.min(m, Math.max(0, Math.hypot(p[0] - u.pusat[0], p[1] - u.pusat[1]) - u.jari)); });
    return m;
  }

  /** Tempat kosong untuk sebuah titik berjari r (grid kasar di dalam jangkauan j). */
  function tempatBebas(garis, titik, r, a, j, jauhPusat) {
    var calon = [];
    for (var gx = -8; gx <= 8; gx++) {
      for (var gy = -8; gy <= 8; gy++) {
        var p = [gx * j / 10, gy * j / 10], d = Math.hypot(p[0], p[1]);
        if (d + r > 0.9 * j || d < jauhPusat) continue;
        if (jarakMin(p, garis, titik) < r + 0.1 * j) continue;
        calon.push(p);
      }
    }
    return calon.length ? a.pilih(calon) : null;
  }

  // ------------------------------------------------------------------ bentuk dasar

  /** Kait (kepala 2) dijadikan ruas garis biasa supaya ikut tercermin dengan benar. */
  function kaitJadiGaris(u, jang) {
    var t = u.titik, q = t[t.length - 1], p = t[t.length - 2];
    var dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, h = 0.2125 * jang;
    return { jenis: 'garis', titik: t.map(function (x) { return [x[0], x[1]]; }).concat([[q[0] + (-uy - ux * 0.35) * h, q[1] + (ux - uy * 0.35) * h]]), tutup: false, isi: null, kepala: 0, nama: u.nama };
  }

  /**
   * Bentuk families.js: kait dijadikan garis, dipusatkan, diskalakan ke jangkauan `ukuran`, lalu
   * dipisah menjadi garis/bangun dan titik. Lingkaran yang ukurannya meragukan (bukan titik kecil dan
   * bukan lingkaran besar) ditolak supaya golongan titik selalu terbaca tegas.
   */
  function bentukDasar(kel, benih, ukuran) {
    var f = Fam.bangkitkan(kel, benih);
    if (!f || f.coba > Fam.COBA_MAKS) return null;
    var j0 = F.jangkauan(f);
    var u = f.unsur.map(function (x) { return x.jenis === 'garis' && x.kepala === 2 && x.titik.length >= 2 ? kaitJadiGaris(x, j0) : F.salinUnsur(x); });
    var g = F.pusatkan({ unsur: u }).unsur, j = jangkauanU(g), s = ukuran / j, garis = [], titik = [], namaG = [], namaT = [];
    for (var i = 0; i < g.length; i++) {
      var v = skalakan([g[i]], s)[0], nama = g[i].nama || (v.jenis === 'bulat' ? 'titik' : 'garis');
      if (v.jenis === 'bulat') {
        var rasio = v.jari / ukuran;
        if (rasio > 0.26 && rasio < 0.8) return null;
        if (rasio <= 0.26) { titik.push(v); namaT.push(nama); continue; }
      }
      garis.push(v); namaG.push(nama);
    }
    return { garis: garis, titik: titik, namaG: namaG, namaT: namaT, kel: kel, benih: benih };
  }

  /** Setiap titik terpisah jelas dari garis/bangun, mata panah, dan titik lain (tidak menempel). */
  function titikLepas(garis, titik, ukuran) {
    var kepala = 0.19 * ukuran;
    for (var i = 0; i < titik.length; i++) {
      var u = titik[i], lain = titik.filter(function (x, k) { return k !== i; });
      if (jarakMin(u.pusat, garis, lain) < u.jari + 4) return false;
      for (var k = 0; k < garis.length; k++) {
        var g = garis[k];
        if (g.jenis !== 'garis' || g.kepala !== 1) continue;
        var q = g.titik[g.titik.length - 1];
        if (Math.hypot(u.pusat[0] - q[0], u.pusat[1] - q[1]) < u.jari + kepala + 3) return false;
      }
    }
    return true;
  }

  var G_UJI = [45, 90, 135, 180, 225, 270, 315].map(fPutar).concat(SUMBU.map(fCermin));

  /** Garis/bangun saja (tanpa titik) harus tampak berubah oleh setiap putaran dan pencerminan pustaka. */
  function asimetris(garis, ukuran) {
    var a = cuplik(garis);
    if (a.length < 4) return false;
    for (var i = 0; i < G_UJI.length; i++) if (chamfer(a.map(G_UJI[i]), a) < 0.06 * ukuran) return false;
    return true;
  }

  /**
   * Bentuk untuk satu kotak analogi.
   * sy: { ukuran, letak, duaWarna (sedikitnya satu titik hitam dan satu putih), titikMin, tanpaTitik }
   */
  function siapkanBentuk(a, kel, benih, sy) {
    var b = bentukDasar(kel, benih, sy.ukuran);
    if (!b || b.garis.length < 2 || !asimetris(b.garis, sy.ukuran)) return null;
    if (F.panjangTotal({ unsur: b.garis }) < 3.6 * sy.ukuran) return null;
    var titik = sy.tanpaTitik ? [] : b.titik.slice(), r = 0.12 * sy.ukuran;
    if (titik.length > 3) return null;
    function tambah(hitam) {
      if (titik.length >= 3) return false;
      var p = tempatBebas(b.garis, titik, r, a, sy.ukuran, 0);
      if (!p) return false;
      titik.push({ jenis: 'bulat', pusat: p, jari: r, isi: hitam ? TINTA : null });
      return true;
    }
    if (sy.duaWarna) {
      if (!titik.some(function (u) { return !!u.isi; }) && !tambah(true)) return null;
      if (!titik.some(function (u) { return !u.isi; }) && !tambah(false)) return null;
    }
    while (titik.length < (sy.titikMin || 0)) if (!tambah(a.untung(0.5))) return null;
    if (!titikLepas(b.garis, titik, sy.ukuran)) return null;
    return { letak: sy.letak, unsur: bulatkanU(b.garis.concat(titik)), kel: kel, benih: benih };
  }

  // ------------------------------------------------------------------ langkah transformasi

  /** Satu langkah transformasi pada isi kotak { letak, unsur }. */
  function terapkanLangkah(isi, st) {
    var p = pisah(isi.unsur), g = p.garis, t = p.titik, letak = isi.letak;
    var balik = function (u) { var v = salinU(u); v.isi = u.isi ? null : TINTA; return v; };
    switch (st.j) {
      case 'putar': g = petakan(g, fPutar(st.d)); t = petakan(t, fPutar(st.d)); break;
      case 'cermin': g = petakan(g, fCermin(st.s)); t = petakan(t, fCermin(st.s)); break;
      case 'skala': g = skalakan(g, st.k); t = skalakan(t, st.k); break;
      case 'warna': t = t.map(balik); break;
      case 'warnaSatu': t = t.map(function (u, i) { return i === st.i ? balik(u) : salinU(u); }); break;
      case 'warnaSemua': t = t.map(function (u) { var v = salinU(u); v.isi = st.hitam ? TINTA : null; return v; }); break;
      case 'hapus': t = []; break;
      case 'hapusSatu': t = t.filter(function (u, i) { return i !== st.i; }); break;
      case 'tambah': t = t.concat([{ jenis: 'bulat', pusat: TITIK_POJOK[st.di].slice(), jari: RT, isi: TINTA }]); break;
      case 'tambahPutih': t = t.concat([{ jenis: 'bulat', pusat: TITIK_POJOK[st.di].slice(), jari: RT, isi: null }]); break;
      case 'pindah': letak = st.ke; break;
      default: throw new Error('langkah tidak dikenal: ' + st.j);
    }
    return { letak: letak, unsur: bulatkanU(g.concat(t)) };
  }

  function terapkanSemua(isi, langkah) { return langkah.reduce(terapkanLangkah, isi); }

  function dalamKotak(isi) {
    var an = LETAK[isi.letak], ok = true;
    isi.unsur.forEach(function (u) {
      if (u.jenis === 'bulat') {
        if (Math.abs(u.pusat[0] + an[0]) + u.jari > 47.5 || Math.abs(u.pusat[1] + an[1]) + u.jari > 47.5) ok = false;
      } else u.titik.forEach(function (p) { if (Math.abs(p[0] + an[0]) > 46.5 || Math.abs(p[1] + an[1]) > 46.5) ok = false; });
    });
    return ok;
  }

  /** Dua isi kotak berbeda JELAS di mata: letak, garis (chamfer), atau titik (banyak, letak, warna). */
  function bedaTampak(p, q) {
    if (p.letak !== q.letak) return true;
    var pp = pisah(p.unsur), pq = pisah(q.unsur), a = cuplik(pp.garis), b = cuplik(pq.garis);
    if (!a.length || !b.length) { if (a.length !== b.length) return true; }
    else if (chamfer(a, b) >= 1.6) return true;
    if (pp.titik.length !== pq.titik.length) return true;
    var pakai = [];
    for (var i = 0; i < pp.titik.length; i++) {
      var u = pp.titik[i], ada = false;
      for (var j = 0; j < pq.titik.length; j++) {
        var v = pq.titik[j];
        if (pakai[j] || !!u.isi !== !!v.isi || Math.abs(u.jari - v.jari) > 1) continue;
        if (Math.hypot(u.pusat[0] - v.pusat[0], u.pusat[1] - v.pusat[1]) > 2) continue;
        pakai[j] = ada = true;
        break;
      }
      if (!ada) return true;
    }
    return false;
  }

  // ------------------------------------------------- menyimpulkan ulang aturan (penolak ambigu)

  /*
   * Pustaka penyusun untuk menyimpulkan T dari kotak 1 -> 2 (pemeriksa punya implementasinya sendiri):
   *   G   tetap, putar kelipatan 45°, cermin empat sumbu (terhadap pusat letak)
   *   k   skala, disimpulkan dari perbandingan jangkauan garis/bangun
   *   titik  warna (balik / jadi hitam / jadi putih) dan hapus (semua / yang hitam / yang putih),
   *          dalam kedua urutan, lalu boleh ditambah satu titik E (disimpulkan dari kotak 2)
   *   letak  pindah ke letak kotak 2
   * Paling banyak tiga langkah yang benar-benar mengubah gambar.
   */
  var G_LIB = [{ id: 'tetap', f: function (p) { return [p[0], p[1]]; }, ubah: 0 }]
    .concat([45, 90, 135, 180, 225, 270, 315].map(function (d) { return { id: 'putar' + d, f: fPutar(d), ubah: 1 }; }))
    .concat(SUMBU.map(function (s) { return { id: 'cermin-' + s, f: fCermin(s), ubah: 1 }; }));

  var VARIAN_TITIK = (function () {
    var W = ['balik', 'hitam', 'putih'], Hp = ['semua', 'hitam', 'putih'], v = [[]];
    W.forEach(function (w) { v.push([{ w: w }]); });
    Hp.forEach(function (h) { v.push([{ h: h }]); });
    W.forEach(function (w) { Hp.forEach(function (h) { v.push([{ w: w }, { h: h }]); v.push([{ h: h }, { w: w }]); }); });
    return v;
  })();

  /** Operasi titik berurutan; `hilang` (bila diberikan) menampung titik yang dihapus. */
  function opsTitik(titik, v, hilang) {
    var t = titik.map(salinU);
    v.forEach(function (op) {
      if (op.w) t.forEach(function (u) { u.isi = op.w === 'balik' ? (u.isi ? null : TINTA) : (op.w === 'hitam' ? TINTA : null); });
      if (op.h) {
        t = t.filter(function (u) {
          var buang = op.h === 'semua' || (op.h === 'hitam') === !!u.isi;
          if (buang && hilang) hilang.push(u);
          return !buang;
        });
      }
    });
    return t;
  }

  function sisaSatu(besar, kecil) {
    if (besar.length !== kecil.length + 1) return null;
    for (var i = 0; i < besar.length; i++) {
      if (samaDaftar(besar.slice(0, i).concat(besar.slice(i + 1)), kecil)) return besar[i];
    }
    return null;
  }

  function aturanCocok(A, B) {
    var hasil = [], pa = pisah(A.unsur), pb = pisah(B.unsur), jb = jangkauanU(pb.garis), pindah = A.letak !== B.letak ? 1 : 0;
    G_LIB.forEach(function (G) {
      var g = petakan(pa.garis, G.f), ja = jangkauanU(g);
      if (!(ja > 0)) return;
      var k = jb / ja;
      if (Math.abs(k - 1) < 0.03) k = 1;
      if (k !== 1) g = skalakan(g, k);
      if (!samaDaftar(g, pb.garis)) return;
      var t0 = skalakan(petakan(pa.titik, G.f), k);
      VARIAN_TITIK.forEach(function (v) {
        var hilang = [], t = opsTitik(t0, v, hilang), E = null;
        if (!samaDaftar(t, pb.titik)) { E = sisaSatu(pb.titik, t); if (!E) return; }
        // menghapus sebuah titik lalu menambahkannya lagi di tempat yang sama bukan aturan
        if (E && hilang.some(function (u) { return Math.hypot(u.pusat[0] - E.pusat[0], u.pusat[1] - E.pusat[1]) < 1; })) return;
        var n = G.ubah + (k !== 1 ? 1 : 0) + v.length + (E ? 1 : 0) + pindah;
        if (n === 0 || n > 3) return;
        hasil.push({ G: G, k: k, v: v, E: E, ke: pindah ? B.letak : null });
      });
    });
    return hasil;
  }

  function terapkanAturan(T, X) {
    var px = pisah(X.unsur), g = petakan(px.garis, T.G.f), t = petakan(px.titik, T.G.f);
    if (T.k !== 1) { g = skalakan(g, T.k); t = skalakan(t, T.k); }
    t = opsTitik(t, T.v);
    if (T.E) t.push(salinU(T.E));
    return { letak: T.ke || X.letak, unsur: g.concat(t) };
  }

  // ------------------------------------------------------------------ kata-kata

  function uraiPutar(d) { return d === 180 ? 'diputar 180°' : 'diputar ' + Math.abs(d) + '° ' + (d > 0 ? 'searah' : 'berlawanan arah') + ' jarum jam'; }

  function urai(st) {
    switch (st.j) {
      case 'putar': return uraiPutar(st.d);
      case 'cermin': return 'dicerminkan terhadap ' + NAMA_SUMBU[st.s];
      case 'warna': return 'warna setiap titiknya dibalik (hitam menjadi putih, putih menjadi hitam)';
      case 'hapus': return 'semua titiknya (lingkaran kecil) dihapus';
      case 'tambah': return 'ditambah sebuah titik hitam di ' + NAMA_LETAK[st.di];
      case 'skala': return st.k < 1 ? 'diperkecil menjadi sekitar setengah ukurannya' : 'diperbesar menjadi hampir dua kali ukurannya';
      case 'pindah': return 'dipindah ke ' + NAMA_LETAK[st.ke];
    }
    return '';
  }

  function uraiSingkat(st) {
    if (st.j === 'warna') return 'warna setiap titiknya dibalik';
    if (st.j === 'hapus') return 'semua titiknya dihapus';
    return urai(st);
  }

  function uraiKedua(st) { return st.j === 'warna' || st.j === 'hapus' ? urai(st) : 'gambar ' + urai(st); }

  function negasi(st) {
    switch (st.j) {
      case 'putar': return 'gambarnya tidak ' + uraiPutar(st.d);
      case 'cermin': return 'gambarnya tidak dicerminkan terhadap ' + NAMA_SUMBU[st.s];
      case 'warna': return 'warna titiknya tidak dibalik';
      case 'hapus': return 'titik-titiknya tidak dihapus';
      case 'tambah': return 'titik hitam di ' + NAMA_LETAK[st.di] + ' tidak ditambahkan';
      case 'skala': return 'ukurannya tidak ' + (st.k < 1 ? 'diperkecil' : 'diperbesar');
      case 'pindah': return 'gambarnya tidak dipindah ke ' + NAMA_LETAK[st.ke];
    }
    return '';
  }

  function labelLangkah(st) {
    switch (st.j) {
      case 'putar': return st.d === 180 ? ['putar 180°'] : ['putar ' + Math.abs(st.d) + '°', st.d > 0 ? 'searah' : 'berlawanan'];
      case 'cermin': return ['cermin', { tegak: 'sumbu tegak', datar: 'sumbu datar', diag1: 'sumbu diagonal', diag2: 'sumbu diagonal' }[st.s]];
      case 'warna': return ['balik warna', 'titik'];
      case 'hapus': return ['hapus', 'semua titik'];
      case 'tambah': return ['tambah titik', PENDEK_LETAK[st.di]];
      case 'skala': return [st.k < 1 ? 'perkecil' : 'perbesar'];
      case 'pindah': return ['pindah ke', PENDEK_LETAK[st.ke]];
    }
    return [''];
  }

  var SIFAT = { putar: 'arah gambar', cermin: 'arah gambar', skala: 'ukuran', pindah: 'letak', warna: 'warna titik', hapus: 'banyak titik', tambah: 'banyak titik' };

  function daftarKata(d) { return d.length <= 1 ? d.join('') : d.slice(0, -1).join(', ') + (d.length > 2 ? ',' : '') + ' dan ' + d[d.length - 1]; }

  function hitungTitik(isi) {
    var t = pisah(isi.unsur).titik, h = t.filter(function (u) { return !!u.isi; }).length;
    return { n: t.length, hitam: h, putih: t.length - h };
  }

  function kalimatTitik(c) {
    var b = [];
    if (c.hitam) b.push(c.hitam + ' titik hitam');
    if (c.putih) b.push(c.putih + ' titik putih');
    return b.join(' dan ');
  }

  // ------------------------------------------------------------------ analogi: rancangan

  var MEK_ANALOGI = {
    mudah: ['putar', 'cermin', 'hapus', 'tambah', 'skala', 'pindah'],
    sedang: ['putar', 'cermin', 'warna', 'putar+hapus', 'cermin+hapus', 'putar+tambah', 'cermin+tambah', 'putar+skala', 'skala+pindah', 'cermin+pindah'],
    sulit: ['putar+warna', 'cermin+warna', 'putar+hapus', 'cermin+hapus', 'putar+tambah', 'cermin+tambah', 'putar+skala', 'cermin+skala', 'putar+pindah', 'cermin+pindah']
  };

  function pilihSudut(a, level, tunggal) {
    if (level === 'mudah') return a.pilih([90, 180]);
    if (level === 'sedang') return tunggal ? -90 : a.pilih([90, 180, -90]);
    return a.pilih([45, -45, 135, -135, -90]);
  }

  function pilihSumbu(a, level, tunggal) {
    if (level === 'mudah') return a.pilih(['tegak', 'datar']);
    if (level === 'sedang') return tunggal ? a.pilih(['diag1', 'diag2']) : a.pilih(['tegak', 'datar']);
    return a.pilih(['diag1', 'diag2']);
  }

  /** Langkah-langkah T (urutan: putar/cermin, skala, titik, pindah) beserta syarat bentuk kotak 1 dan 3. */
  function rancang(a, level, mek) {
    var jenis = mek.split('+'), tunggal = jenis.length === 1, langkah = [];
    var ada = function (j) { return jenis.indexOf(j) >= 0; };
    var kecilkan = ada('skala') && (ada('pindah') || a.untung(0.5));
    var kecil = ada('pindah') ? KECIL_POJOK : KECIL;
    var ukuran = ada('skala') ? (kecilkan ? PENUH : kecil) : (ada('pindah') ? kecil : PENUH);
    var letak = ada('pindah') && !ada('skala') ? a.pilih(['tengah'].concat(POJOK)) : 'tengah';
    if (ada('putar')) langkah.push({ j: 'putar', d: pilihSudut(a, level, tunggal) });
    if (ada('cermin')) langkah.push({ j: 'cermin', s: pilihSumbu(a, level, tunggal) });
    if (ada('skala')) langkah.push({ j: 'skala', k: kecilkan ? kecil / PENUH : PENUH / kecil });
    ['warna', 'hapus'].forEach(function (j) { if (ada(j)) langkah.push({ j: j }); });
    if (ada('tambah')) langkah.push({ j: 'tambah', di: a.pilih(POJOK) });
    if (ada('pindah')) langkah.push({ j: 'pindah', ke: a.pilih(POJOK.filter(function (p) { return p !== letak; })) });
    var opsTitik = ada('warna') || ada('hapus');
    // gambar yang ukurannya berubah atau berpindah tidak diberi titik (titik kecilnya sulit dibaca)
    var tanpaTitik = !opsTitik && (ada('skala') || ada('pindah'));
    return {
      mek: mek, langkah: langkah, bantu: ada('pindah'), adaKecil: ada('skala') || ada('pindah'),
      syaratA: { ukuran: ukuran, letak: letak, duaWarna: !tanpaTitik, tanpaTitik: tanpaTitik },
      syaratC: { ukuran: ukuran, letak: letak, titikMin: opsTitik ? 1 : 0, duaWarna: opsTitik && a.untung(0.5), tanpaTitik: tanpaTitik }
    };
  }

  // ------------------------------------------------------------------ analogi: pengecoh

  /** Versi SALAH sebuah langkah (jalur kesalahan yang masuk akal). */
  function altLangkah(st, X, a) {
    var out = [], t = pisah(X.unsur).titik;
    if (st.j === 'putar') {
      if (st.d !== 180) out.push({ st: { j: 'putar', d: -st.d }, jenis: 'arah', alasan: 'Arah putarnya terbalik: gambar ' + uraiPutar(-st.d) + ', padahal dari kotak pertama ke kotak kedua gambar ' + uraiPutar(st.d) + '.' });
      var lain = [st.d + 90, st.d - 90];
      if (Math.abs(st.d) % 90) lain.push(st.d + 45, st.d - 45);
      lain.map(sudutNorm).forEach(function (d) {
        if (d === 0 || d === st.d || (st.d !== 180 && d === -st.d)) return;
        out.push({ st: { j: 'putar', d: d }, jenis: 'sudut', alasan: 'Besar putarannya salah: gambar ' + uraiPutar(d) + ', padahal seharusnya ' + uraiPutar(st.d) + ' seperti perubahan kotak pertama ke kotak kedua.' });
      });
      var sb = a.pilih(SUMBU);
      out.push({ st: { j: 'cermin', s: sb }, jenis: 'ganti-cermin', alasan: 'Gambar dicerminkan terhadap ' + NAMA_SUMBU[sb] + ', padahal perubahan kotak pertama ke kotak kedua adalah putaran; bayangan cermin tidak dapat diperoleh dengan memutar.' });
    } else if (st.j === 'cermin') {
      SUMBU.forEach(function (s) {
        if (s === st.s) return;
        out.push({ st: { j: 'cermin', s: s }, jenis: 'sumbu', alasan: 'Sumbu cerminnya salah: gambar dicerminkan terhadap ' + NAMA_SUMBU[s] + ', padahal seharusnya terhadap ' + NAMA_SUMBU[st.s] + '.' });
      });
      var d = st.s === 'tegak' || st.s === 'datar' ? 180 : a.pilih([90, -90]);
      out.push({ st: { j: 'putar', d: d }, jenis: 'ganti-putar', alasan: 'Gambar ' + uraiPutar(d) + ', padahal perubahan kotak pertama ke kotak kedua adalah pencerminan terhadap ' + NAMA_SUMBU[st.s] + '.' });
    } else if (st.j === 'warna') {
      if (t.length >= 2) out.push({ st: { j: 'warnaSatu', i: a.bulat(0, t.length - 1) }, jenis: 'warna-sebagian', alasan: 'Hanya satu titik yang warnanya dibalik, padahal setiap titik harus berganti warna.' });
      // "semua dijadikan satu warna" hanya bermakna bila titiknya berwarna campuran
      var hitamSemua = a.untung(0.5), nh = t.filter(function (u) { return !!u.isi; }).length;
      if (nh > 0 && nh < t.length) out.push({ st: { j: 'warnaSemua', hitam: hitamSemua }, jenis: 'warna-semua', alasan: 'Semua titik dijadikan ' + (hitamSemua ? 'hitam' : 'putih') + ', padahal warnanya dibalik: titik hitam menjadi putih dan titik putih menjadi hitam.' });
      out.push({ st: { j: 'hapus' }, jenis: 'warna-hapus', alasan: 'Titik-titiknya dihapus, padahal dari kotak pertama ke kotak kedua titiknya tetap ada dan hanya warnanya yang dibalik.' });
    } else if (st.j === 'hapus') {
      if (t.length >= 2) out.push({ st: { j: 'hapusSatu', i: a.bulat(0, t.length - 1) }, jenis: 'hapus-sebagian', alasan: 'Masih ada titik yang tertinggal, padahal dari kotak pertama ke kotak kedua semua titik dihapus.' });
      out.push({ st: { j: 'warna' }, jenis: 'hapus-warna', alasan: 'Titiknya tidak dihapus melainkan warnanya dibalik, padahal dari kotak pertama ke kotak kedua semua titik hilang.' });
    } else if (st.j === 'tambah') {
      out.push({ st: { j: 'tambahPutih', di: st.di }, jenis: 'tambah-putih', alasan: 'Titik yang ditambahkan berwarna putih, padahal titik baru pada kotak kedua berwarna hitam.' });
      a.kocok(POJOK.filter(function (q) { return q !== st.di; })).slice(0, 1).forEach(function (q) {
        out.push({ st: { j: 'tambah', di: q }, jenis: 'tambah-geser', alasan: 'Titik hitam tambahannya diletakkan di ' + NAMA_LETAK[q] + ', padahal pada kotak kedua titik baru itu berada di ' + NAMA_LETAK[st.di] + '.' });
      });
    } else if (st.j === 'skala') {
      var k2 = st.k < 1 ? 0.78 : 1.36;
      out.push({ st: { j: 'skala', k: k2 }, jenis: 'skala-kurang', alasan: 'Ukurannya kurang ' + (st.k < 1 ? 'diperkecil' : 'diperbesar') + ': perubahan ukurannya tidak sebesar perubahan dari kotak pertama ke kotak kedua.' });
      if (st.k < 1) out.push({ st: { j: 'skala', k: 0.36 }, jenis: 'skala-lebih', alasan: 'Ukurannya terlalu kecil: gambar diperkecil lebih banyak daripada perubahan dari kotak pertama ke kotak kedua.' });
    } else if (st.j === 'pindah') {
      ['tengah'].concat(POJOK).forEach(function (L) {
        if (L === st.ke || L === X.letak) return;
        out.push({ st: { j: 'pindah', ke: L }, jenis: 'pojok', alasan: 'Gambarnya dipindah ke ' + NAMA_LETAK[L] + ', padahal seharusnya ke ' + NAMA_LETAK[st.ke] + ' seperti pada kotak kedua.' });
      });
    }
    return out;
  }

  var TINGKAT_PENGECOH = { mudah: [2, ['tetap', 'salinB']], sedang: [3, ['tetap', 'salinB']], sulit: [4, ['salinB', 'tetap']] };

  /** Empat pengecoh, masing-masing berbeda jelas dari kunci dan satu sama lain. */
  function buatPengecoh(a, level, langkah, B, C, K) {
    // kelompok per langkah (langkah putar/cermin lebih dulu) dan kelompok "hanya satu langkah", lalu
    // diambil bergiliran supaya setiap langkah gabungan diuji oleh sedikitnya satu pengecoh
    var kelompok = [], satu = [];
    langkah.forEach(function (st, i) {
      var X = terapkanSemua(C, langkah.slice(0, i)), g = [];
      altLangkah(st, X, a).forEach(function (alt) {
        var L = langkah.slice(); L[i] = alt.st;
        g.push({ isi: terapkanSemua(C, L), alasan: alt.alasan, jenis: alt.jenis });
      });
      kelompok.push(a.kocok(g));
      if (langkah.length > 1) {
        satu.push({ isi: terapkanSemua(C, langkah.filter(function (x, j) { return j !== i; })), jenis: 'satu', alasan: 'Hanya satu dari dua perubahan yang diterapkan: ' + negasi(st) + '.' });
      }
    });
    if (satu.length) kelompok.push(a.kocok(satu));
    var calon = [];
    for (var putaran = 0; putaran < 12; putaran++) kelompok.forEach(function (g) { if (g[putaran]) calon.push(g[putaran]); });
    // perubahan tambahan yang tidak terjadi pada kotak pertama ke kotak kedua (cadangan terakhir)
    var lebih = [];
    if (!langkah.some(function (st) { return st.j === 'putar' || st.j === 'cermin'; })) {
      var sbL = a.pilih(['tegak', 'datar']), dL = a.pilih([90, -90, 180]);
      lebih.push({ isi: terapkanSemua(C, [{ j: 'cermin', s: sbL }].concat(langkah)), jenis: 'lebih', alasan: 'Ada perubahan tambahan yang tidak terjadi dari kotak pertama ke kotak kedua: gambar juga dicerminkan terhadap ' + NAMA_SUMBU[sbL] + ', padahal arah gambar seharusnya tidak berubah.' });
      lebih.push({ isi: terapkanSemua(C, [{ j: 'putar', d: dL }].concat(langkah)), jenis: 'lebih', alasan: 'Ada perubahan tambahan yang tidak terjadi dari kotak pertama ke kotak kedua: gambar juga ' + uraiPutar(dL) + ', padahal arah gambar seharusnya tidak berubah.' });
      lebih = a.kocok(lebih);
    }
    var utama = calon, cadang = [
      { isi: B, jenis: 'salinB', alasan: 'Gambar ini sama dengan kotak kedua: perubahannya diterapkan pada kotak pertama, bukan pada kotak ketiga.' },
      { isi: C, jenis: 'tetap', alasan: 'Gambar ini sama dengan kotak ketiga tanpa perubahan apa pun, padahal kotak ketiga harus diubah dengan cara yang sama seperti kotak pertama menjadi kotak kedua.' }
    ];
    var batas = TINGKAT_PENGECOH[level] || TINGKAT_PENGECOH.sedang;
    if (level === 'sulit') cadang = cadang.filter(function (c) { return c.jenis === batas[1][0]; }).concat(cadang.filter(function (c) { return c.jenis !== batas[1][0]; }));
    else cadang = a.kocok(cadang);
    var urut = utama.slice(0, batas[0]).concat(cadang, utama.slice(batas[0]), lebih), hasil = [], jenisDipakai = {};
    function layak(c) {
      if (!dalamKotak(c.isi) || samaIsi(c.isi, K) || !bedaTampak(c.isi, K)) return false;
      if ((jenisDipakai[c.jenis] || 0) >= 2) return false;
      for (var i = 0; i < hasil.length; i++) if (samaIsi(c.isi, hasil[i].isi) || !bedaTampak(c.isi, hasil[i].isi)) return false;
      return true;
    }
    for (var i = 0; i < urut.length && hasil.length < 4; i++) {
      if (!layak(urut[i])) continue;
      hasil.push(urut[i]);
      jenisDipakai[urut[i].jenis] = (jenisDipakai[urut[i].jenis] || 0) + 1;
    }
    return hasil.length === 4 ? hasil : null;
  }

  // ------------------------------------------------------------------ analogi: butir

  function namaMek(langkah) {
    return langkah.map(function (st) {
      if (st.j === 'putar') return 'putar' + st.d;
      if (st.j === 'cermin') return 'cermin-' + st.s;
      if (st.j === 'skala') return st.k < 1 ? 'kecil' : 'besar';
      if (st.j === 'pindah') return 'pindah-' + st.ke;
      if (st.j === 'tambah') return 'tambah-' + st.di;
      return st.j;
    }).join('+');
  }

  function penandaKalimat(st) {
    switch (st.j) {
      case 'putar': return 'busur biru menunjukkan arah dan besar putaran, dan garis merah (unsur terpanjang) membantu melihat arah barunya';
      case 'cermin': return 'garis putus-putus biru adalah sumbu cerminnya';
      case 'warna': return 'titik-titik yang berganti warna dilingkari jingga';
      case 'hapus': return 'lingkaran jingga putus-putus menandai titik-titik yang dihapus';
      case 'tambah': return 'titik baru di pojok kotak dilingkari jingga';
      case 'skala': return 'garis abu-abu putus-putus menunjukkan ukuran sebelum diubah';
      case 'pindah': return 'panah biru menunjukkan perpindahan dari letak lama (kotak putus-putus)';
    }
    return '';
  }

  function kalimatPadaC(st, X, adaGeometri) {
    var c = hitungTitik(X);
    switch (st.j) {
      case 'putar': return 'seluruh gambar kotak ketiga ' + uraiPutar(st.d) + ' terhadap pusatnya';
      case 'cermin': return 'gambar kotak ketiga dicerminkan terhadap ' + NAMA_SUMBU[st.s] + ', sehingga setiap bagian berpindah ke seberang sumbu dengan jarak yang sama';
      case 'warna': return 'kotak ketiga memiliki ' + kalimatTitik(c) + '; setelah dibalik, ' + (c.hitam && c.putih ? 'titik hitam menjadi putih dan titik putih menjadi hitam' : (c.hitam ? 'semua titiknya menjadi putih' : 'semua titiknya menjadi hitam'));
      case 'hapus': return 'kotak ketiga memiliki ' + kalimatTitik(c) + ', dan ' + (c.n > 1 ? 'semuanya' : 'titik itu') + ' dihapus sehingga hanya garisnya yang tersisa';
      case 'tambah': return 'titik hitam baru diletakkan di ' + NAMA_LETAK[st.di] + ' kotak ketiga, sama seperti pada kotak kedua';
      case 'skala': return 'gambar kotak ketiga ' + (st.k < 1 ? 'diperkecil' : 'diperbesar') + ' dengan perbandingan yang sama';
      case 'pindah': return 'gambar kotak ketiga yang semula di ' + NAMA_LETAK[X.letak] + ' dipindah ke ' + NAMA_LETAK[st.ke] + (adaGeometri ? '' : ' tanpa diputar');
    }
    return '';
  }

  function buatAnalogi(id, level, benih, opsi) {
    var a = Rng.alat(benih);
    var target = opsi.target == null ? a.bulat(0, 4) : opsi.target;
    var semua = MEK_ANALOGI[level] || MEK_ANALOGI.sedang;
    var baru = semua.filter(function (m) { return (opsi.polaDipakai || []).indexOf(id + ':' + m) < 0; });
    var mek = a.pilih(baru.length ? baru : semua);
    for (var coba = 0; coba < 40; coba++) {
      if (coba === 20) mek = a.pilih(semua);
      var r = rancang(a, level, mek), kel = a.ambil(r.adaKecil ? KELUARGA_KECIL : KELUARGA_BENTUK, 2), A = null, C = null, k;
      for (k = 0; k < 6 && !A; k++) A = siapkanBentuk(a, kel[0], Rng.turunan(benih, coba, k, 'A'), r.syaratA);
      for (k = 0; k < 6 && !C; k++) C = siapkanBentuk(a, kel[1], Rng.turunan(benih, coba, k, 'C'), r.syaratC);
      if (!A || !C) continue;
      var L = r.langkah, B = terapkanSemua(A, L), K = terapkanSemua(C, L);
      if (![A, B, C, K].every(dalamKotak) || !bedaTampak(A, B) || !bedaTampak(C, K) || !bedaTampak(B, K)) continue;
      // T harus dapat disimpulkan tunggal dari kotak 1 -> 2 dan memberi hasil yang sama pada kotak 3
      var aturan = aturanCocok(A, B);
      if (!aturan.length || aturan.some(function (T) { return !samaIsi(terapkanAturan(T, C), K); })) continue;
      var peng = buatPengecoh(a, level, L, B, C, K);
      if (!peng) continue;

      var daftar = a.kocok(peng.map(function (p) { return { isi: p.isi, alasan: p.alasan, kunci: false }; }));
      daftar.splice(target, 0, { isi: K, alasan: null, kunci: true });
      var opsiGambar = daftar.map(function (d, i) {
        return { teks: 'Gambar opsi ' + Fmt.huruf(i), nilai: i, alasan: d.alasan, kunci: d.kunci,
          gambar: { id: 'opsi-' + Fmt.huruf(i).toLowerCase(), jenis: 'ta-panel', model: { fig: d.isi, bantu: r.bantu }, judul: 'Opsi ' + Fmt.huruf(i) } };
      });

      // pembahasan
      var huruf = Fmt.huruf(target), adaGeo = L.some(function (st) { return st.j === 'putar' || st.j === 'cermin'; });
      var berubah = {}, adaTitik = hitungTitik(A).n > 0;
      L.forEach(function (st) { berubah[SIFAT[st.j]] = true; if (st.j === 'hapus') berubah['warna titik'] = true; });
      var tetap = ['arah gambar', 'ukuran', 'letak'].concat(adaTitik ? ['warna titik', 'banyak titik'] : []).filter(function (s) { return !berubah[s]; });
      var pem = [];
      var kal1 = L.length === 1
        ? 'Bandingkan kotak pertama dengan kotak kedua: gambar pada kotak kedua adalah gambar kotak pertama yang ' + urai(L[0]) + '.'
        : 'Bandingkan kotak pertama dengan kotak kedua. Ada dua perubahan sekaligus: (1) gambar ' + urai(L[0]) + ', dan (2) ' + uraiKedua(L[1]) + '.';
      if (tetap.length) kal1 += ' Yang tidak berubah: ' + daftarKata(tetap) + '.';
      pem.push(kal1);
      pem.push('Gambar 1 memperlihatkan perubahan itu ' + (L.length > 1 ? 'langkah demi langkah' : 'dengan penandanya') + ': ' + L.map(penandaKalimat).join('; ') + '.');
      var padaC = L.map(function (st, i) { return kalimatPadaC(st, terapkanSemua(C, L.slice(0, i)), adaGeo); });
      pem.push('Terapkan perubahan yang sama pada kotak ketiga (Gambar 2)' + (L.length > 1 ? ', berurutan' : '') + ': ' + (L.length > 1 ? 'langkah 1, ' + padaC[0] + '; langkah 2, ' + padaC[1] : padaC[0]) + '.');
      pem.push('Jadi gambar pengganti tanda tanya adalah gambar kotak ketiga yang ' + uraiSingkat(L[0]) + (L.length > 1 ? ' dan ' + uraiSingkat(L[1]) : '') + ' (berlatar hijau pada Gambar 2), yaitu opsi ' + huruf + '.');

      var ctx = { subtes: 'ku', submateri: 'figural', keluarga: id, level: level, benih: benih, a: a };
      var butir = Butir.rakitPg(ctx, {
        jenisSoal: 'Figural Analogi - Transformasi Gambar',
        judul: 'Figural Analogi - Transformasi Gambar', teks: [], perintah: PERINTAH_ANALOGI, pertanyaan: '',
        gambar: [{ id: 'soal', jenis: 'ta-analogi', model: { A: A, B: B, C: C, bantu: r.bantu }, judul: 'Analogi gambar' }],
        pilihanJadi: { opsi: opsiGambar, kunciIndex: target }, tulisKunci: false,
        langkah: [], pembahasan: pem,
        model: { topik: 'Figural', tipe: 'transformasi-analogi', A: A, B: B, C: C, mek: namaMek(L), pilihan: daftar.map(function (d) { return d.isi; }), kunciIndex: target },
        sidik: { inti: 'transformasi-analogi|' + A.kel + '#' + A.benih + '|' + C.kel + '#' + C.benih + '|' + namaMek(L), param: [], entitas: mek }
      });
      if (!butir) continue;
      var tahapA = [A], tahapC = [C];
      L.forEach(function (st, i) { tahapA.push(i === L.length - 1 ? B : terapkanLangkah(tahapA[i], st)); tahapC.push(i === L.length - 1 ? K : terapkanLangkah(tahapC[i], st)); });
      var tengahJudul = L.length > 1 ? ['Setelah langkah 1'] : [];
      butir.gambarPembahasan = [
        { id: 'bahas-1', jenis: 'ta-tahap', judul: 'Gambar 1. Perubahan kotak 1 menjadi kotak 2', model: { panel: tahapA, langkah: L, judulPanel: ['Kotak 1'].concat(tengahJudul, ['Kotak 2']), jawab: false, bantu: r.bantu } },
        { id: 'bahas-2', jenis: 'ta-tahap', judul: 'Gambar 2. Perubahan yang sama pada kotak 3', model: { panel: tahapC, langkah: L, judulPanel: ['Kotak 3'].concat(tengahJudul, ['Jawaban']), jawab: true, bantu: r.bantu, jawaban: K } }
      ];
      butir.pola = id + ':' + mek;
      butir.kategoriRiset = 'pengayaan';
      butir.catatanRiset = 'Bentuk analogi transformasi gambar (putar, cermin, warna, tambah/hapus unsur, skala, pindah, dan gabungannya) dari bab Macam-macam Transformasi Figural di Kerangka Course; tidak ada pada contoh riset BAB V.';
      return butir;
    }
    return null;
  }

  // ------------------------------------------------------------------ gambar bersama

  function teksB(s, x, y, o) {
    o = o || {};
    return S.teks(s, x, y, { ukuran: o.ukuran || 11, tebal: o.tebal, isi: o.isi || BH.teks, rata: o.rata });
  }

  function mataPanah(p, q, h, c) {
    var dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux, lb = h * 0.52;
    return S.poli([q, [q[0] - ux * h + nx * lb, q[1] - uy * h + ny * lb], [q[0] - ux * h - nx * lb, q[1] - uy * h - ny * lb]], { tutup: true, isi: c, garis: c, tebal: 1, sambung: 'round' });
  }

  /**
   * Unsur-unsur dengan titik asal di (ox, oy) px dan skala s px per satuan.
   * o: { warna: [warna per unsur], semua: warna seluruhnya, kepala: panjang mata panah (px), tebal, putus }
   * Lingkaran kecil (titik) putih diisi putih dan digambar terakhir supaya selalu terlihat.
   */
  function svgUnsur(daftar, ox, oy, s, o) {
    o = o || {};
    var ambang = o.ambangTitik || 0.3 * jangkauanU(daftar), tebal = o.tebal || 2, depan = [], belakang = [];
    daftar.forEach(function (u, i) {
      var c = (o.warna && o.warna[i]) || o.semua || TINTA;
      if (u.jenis === 'bulat') {
        var kecil = u.jari <= ambang;
        var el = S.lingkaran(ox + u.pusat[0] * s, oy + u.pusat[1] * s, u.jari * s, { isi: u.isi ? c : (kecil && !o.putus ? '#ffffff' : 'none'), garis: c, tebal: tebal * 0.9, putus: o.putus ? '3 2' : undefined });
        (kecil ? depan : belakang).push(el);
        return;
      }
      var pts = u.titik.map(function (p) { return [ox + p[0] * s, oy + p[1] * s]; });
      belakang.push(S.poli(pts, { tutup: u.tutup, isi: u.tutup && u.isi ? c : 'none', garis: c, tebal: tebal, sambung: 'round', ujung: 'round', putus: o.putus ? '4 3' : undefined }));
      if (u.kepala === 1 && pts.length >= 2 && !o.putus) belakang.push(mataPanah(pts[pts.length - 2], pts[pts.length - 1], o.kepala || 8, c));
    });
    return belakang.join('') + depan.join('');
  }

  // ------------------------------------------------------------------ gambar analogi

  function pusatPx(isi, x, y, P) { var an = LETAK[isi.letak]; return [x + P / 2 + an[0] * P / 100, y + P / 2 + an[1] * P / 100]; }

  function svgIsi(isi, x, y, P, o) {
    o = o || {};
    var c = pusatPx(isi, x, y, P), s = P / 100, jg = jangkauanU(pisah(isi.unsur).garis) || 20;
    return svgUnsur(isi.unsur, c[0], c[1], s, { warna: o.warna, semua: o.semua, putus: o.putus, tebal: o.tebal || 2, kepala: 0.19 * jg * s, ambangTitik: AMBANG_TITIK });
  }

  function garisBantu(x, y, P) {
    return S.garis(x + P / 2, y + 4, x + P / 2, y + P - 4, { garis: '#d5dae4', tebal: 1, putus: '3 3' }) +
      S.garis(x + 4, y + P / 2, x + P - 4, y + P / 2, { garis: '#d5dae4', tebal: 1, putus: '3 3' });
  }

  function kotakIsi(isi, x, y, P, bantu) {
    var out = [S.rect(x, y, P, P, { rx: 4, isi: '#ffffff', garis: TEPI, tebal: 1.6 })];
    if (bantu) out.push(garisBantu(x, y, P));
    out.push(svgIsi(isi, x, y, P));
    return out.join('');
  }

  /** Gambar soal: kotak 1 -> kotak 2 = kotak 3 -> ? */
  function svgSoal(m) {
    var P = 115, pad = 6, g1 = 34, g2 = 44, y = pad, cy = y + P / 2, o = [];
    var xs = [pad, pad + P + g1, pad + 2 * P + g1 + g2, pad + 3 * P + 2 * g1 + g2];
    [m.A, m.B, m.C].forEach(function (isi, i) { o.push(kotakIsi(isi, xs[i], y, P, m.bantu)); });
    o.push(S.rect(xs[3], y, P, P, { rx: 4, isi: LATAR_TANYA, garis: TEPI, tebal: 1.6 }));
    o.push(S.teks('?', xs[3] + P / 2, cy + 16, { ukuran: 46, tebal: true, isi: TEPI, rata: 'middle' }));
    o.push(S.panah(xs[0] + P + 6, cy, xs[1] - 6, cy, { warna: TEPI, tebal: 2.4, kepala: 10 }));
    o.push(S.panah(xs[2] + P + 6, cy, xs[3] - 6, cy, { warna: TEPI, tebal: 2.4, kepala: 10 }));
    var xm = xs[1] + P + g2 / 2;
    o.push(S.garis(xm - 10, cy - 5, xm + 10, cy - 5, { garis: TEPI, tebal: 2.6 }));
    o.push(S.garis(xm - 10, cy + 5, xm + 10, cy + 5, { garis: TEPI, tebal: 2.6 }));
    var W = xs[3] + P + pad, H = P + 2 * pad;
    return { svg: S.doc(o.join(''), W, H, { latar: '#ffffff' }), lebar: W, tinggi: H };
  }

  function svgPanel(m) {
    var P = 130, pad = 4, W = P + 2 * pad;
    return { svg: S.doc(kotakIsi(m.fig, pad, pad, P, m.bantu), W, W, { latar: '#ffffff' }), lebar: W, tinggi: W };
  }

  /** Arah (derajat, 0 = jam 12, searah jarum jam) dari pusat letak ke simpul terjauh unsur acuan. */
  function arahAcuan(isi, idx) {
    var u = isi.unsur[idx], best = null, d = -1;
    if (!u || u.jenis !== 'garis') return 0;
    u.titik.forEach(function (p) { var e = Math.hypot(p[0], p[1]); if (e > d) { d = e; best = p; } });
    return Math.atan2(best[0], -best[1]) * 180 / Math.PI;
  }

  function cincinTitik(isi, x, y, P, putus) {
    var c = pusatPx(isi, x, y, P), s = P / 100;
    return pisah(isi.unsur).titik.map(function (u) {
      return S.lingkaran(c[0] + u.pusat[0] * s, c[1] + u.pusat[1] * s, u.jari * s + 4, { isi: 'none', garis: BH.sorot, tebal: 1.8, putus: putus ? '3 2' : undefined });
    }).join('');
  }

  function garisSumbu(isi, sb, x, y, P) {
    var c = pusatPx(isi, x, y, P), s = P / 100, L = (jangkauanU(isi.unsur) + 7) * s;
    var v = { tegak: [0, 1], datar: [1, 0], diag1: [Math.SQRT1_2, Math.SQRT1_2], diag2: [Math.SQRT1_2, -Math.SQRT1_2] }[sb];
    return S.garis(c[0] - v[0] * L, c[1] - v[1] * L, c[0] + v[0] * L, c[1] + v[1] * L, { garis: BH.panah, tebal: 1.8, putus: '6 4' });
  }

  /** Penanda langkah pada kotak hasilnya (ke) dan kotak asalnya (dari). */
  function penandaKe(st, dari, ke, x, y, P, acuan) {
    var c = pusatPx(ke, x, y, P), s = P / 100, out = [];
    if (st.j === 'putar' && acuan >= 0) {
      // busur di luar gambar (sedekat mungkin dengan tepinya, tetap di dalam kotak); besar sudut tertulis pada panah langkah
      var a0 = arahAcuan(dari, acuan), jg = jangkauanU(ke.unsur), an = LETAK[ke.letak];
      var ruang = (50 - Math.max(Math.abs(an[0]), Math.abs(an[1]))) * s - 5, rb = Math.max(14, Math.min(jg * s + 6, ruang)), rr = Math.min(jg * s, ruang);
      var p0 = S.titikSudut(c[0], c[1], rr, a0);
      out.push(S.garis(c[0], c[1], p0[0], p0[1], { garis: BH.redup, tebal: 1.4, putus: '4 3' }));
      out.push(S.busurPanah(c[0], c[1], rb, a0, a0 + st.d, { warna: BH.panah, tebal: 2.2, kepala: 8, halo: true }));
      out.push(S.lingkaran(c[0], c[1], 3, { isi: BH.panah, garis: '#ffffff', tebal: 1 }));
    } else if (st.j === 'cermin') out.push(garisSumbu(ke, st.s, x, y, P));
    else if (st.j === 'warna') out.push(cincinTitik(ke, x, y, P, false));
    else if (st.j === 'hapus') out.push(cincinTitik(dari, x, y, P, true));
    else if (st.j === 'tambah') { var tp = TITIK_POJOK[st.di]; out.push(S.lingkaran(c[0] + tp[0] * s, c[1] + tp[1] * s, RT * s + 4, { isi: 'none', garis: BH.sorot, tebal: 1.8 })); }
    else if (st.j === 'pindah') {
      var c0 = pusatPx(dari, x, y, P), h = (jangkauanU(dari.unsur) + 3) * s;
      out.push(S.rect(c0[0] - h, c0[1] - h, 2 * h, 2 * h, { rx: 3, isi: 'none', garis: BH.panah, tebal: 1.4, putus: '4 3' }));
      var dx = c[0] - c0[0], dy = c[1] - c0[1], L = Math.hypot(dx, dy) || 1;
      out.push(S.panah(c0[0] + dx / L * 6, c0[1] + dy / L * 6, c[0] - dx / L * 8, c[1] - dy / L * 8, { warna: BH.panah, tebal: 2.2, kepala: 9, halo: true }));
    }
    return out.join('');
  }

  function penandaDari(st, isi, x, y, P) {
    if (st.j === 'cermin') return garisSumbu(isi, st.s, x, y, P);
    if (st.j === 'warna' || st.j === 'hapus') return cincinTitik(isi, x, y, P, false);
    return '';
  }

  /** Gambar pembahasan analogi: kotak-kotak tahap demi tahap dengan penanda tiap langkah. */
  function svgTahap(m, judul) {
    var P = 110, gap = 100, pad = 8, n = m.panel.length, lebarIsi = n * P + (n - 1) * gap;
    var W = Math.max(pad * 2 + lebarIsi, Math.ceil(Metrik.lebar(judul, 13, true)) + 18), x0 = (W - lebarIsi) / 2;
    var yH = pad + 26 + 12, y0 = yH + 8, H = y0 + P + pad + 18, o = [teksB(judul, pad, pad + 13, { ukuran: 13, tebal: true })];
    var geom = m.langkah.some(function (st) { return st.j === 'putar' || st.j === 'cermin'; });
    var acuan = geom ? garisTerpanjang(m.panel[0].unsur) : -1;
    m.panel.forEach(function (isi, i) {
      var x = x0 + i * (P + gap), jawab = m.jawab && i === n - 1, masuk = i > 0 ? m.langkah[i - 1] : null, keluar = i < n - 1 ? m.langkah[i] : null;
      o.push(teksB(m.judulPanel[i], x + P / 2, yH, { ukuran: 11, tebal: true, rata: 'middle', isi: jawab ? BH.jawab : BH.teks }));
      o.push(S.rect(x, y0, P, P, { rx: 4, isi: jawab ? BH.latarJawab : '#ffffff', garis: jawab ? BH.jawab : TEPI, tebal: jawab ? 2.4 : 1.4 }));
      if (m.bantu) o.push(garisBantu(x, y0, P));
      if (masuk && masuk.j === 'skala') o.push(svgIsi(m.panel[i - 1], x, y0, P, { semua: HANTU, putus: true, tebal: 1.4 }));
      var warna = [];
      if (acuan >= 0) warna[acuan] = BH.acuan;
      o.push(svgIsi(isi, x, y0, P, { warna: warna }));
      if (masuk) o.push(penandaKe(masuk, m.panel[i - 1], isi, x, y0, P, acuan));
      if (keluar) {
        o.push(penandaDari(keluar, isi, x, y0, P));
        var xa = x + P + 8, xb = x + P + gap - 8, ya = y0 + P / 2 + 8, lab = labelLangkah(keluar);
        o.push(S.panah(xa, ya, xb, ya, { warna: BH.panah, tebal: 2.2, kepala: 9 }));
        lab.forEach(function (t, k) { o.push(teksB(t, (xa + xb) / 2, ya - 8 - 13 * (lab.length - 1 - k), { ukuran: k ? 10 : 11, tebal: !k, rata: 'middle', isi: BH.panah })); });
        if (n > 2) o.push(teksB('langkah ' + (i + 1), (xa + xb) / 2, ya + 16, { ukuran: 10, rata: 'middle', isi: BH.teksRedup }));
      }
    });
    return { svg: S.doc(o.join(''), W, H, { latar: '#ffffff' }), lebar: W, tinggi: H };
  }

  // ------------------------------------------------------------------ gambar yang berbeda: bentuk & cacat

  var MEK_BEDA = {
    mudah: ['hapus', 'isi', 'tambah'],
    sedang: ['cermin', 'ukuran'],
    sulit: ['cermin', 'geser', 'putar-unsur', 'cermin-unsur', 'putar-sendiri']
  };
  var BOBOT_BEDA = { sedang: { cermin: 3, ukuran: 1 }, sulit: { cermin: 3, geser: 1, 'putar-unsur': 1, 'cermin-unsur': 1, 'putar-sendiri': 1 } };
  var BEDA_MIN = { mudah: 0.06, sedang: 0.045, sulit: 0.03 }, BEDA_MAKS = { mudah: 0.5, sedang: 0.42, sulit: 0.26 };
  // perubahan ukuran satu unsur terlihat jelas walau jarak rata-ratanya kecil
  var BEDA_MIN_UKURAN = 0.035;

  function fig(u) { return { unsur: u }; }

  function kecilTertutup(u, j) {
    if (u.jenis === 'bulat') return u.jari <= 0.3 * j && u.jari >= 0.07 * j;
    if (!u.tutup) return false;
    var p = F.pusatUnsur(u), r = 0;
    u.titik.forEach(function (t) { r = Math.max(r, Math.hypot(t[0] - p[0], t[1] - p[1])); });
    return r <= 0.38 * j && r >= 0.1 * j;
  }

  function layakBentuk(u) {
    var f = fig(u), j = F.jangkauan(f);
    if (u.length < 2 || !(j > 1)) return false;
    if (F.ruasTerpendek(f) < Fam.AMBANG.ruas * j * 0.8) return false;
    for (var i = 0; i < u.length; i++) {
      for (var k = i + 1; k < u.length; k++) if (F.bedaUnsur(u[i], u[k]) < Fam.AMBANG.rapat * j * 0.8) return false;
    }
    return true;
  }

  /**
   * Unsur yang diubah tidak boleh menjadi berimpit atau menempel sejajar dengan unsur lain (gambar jadi
   * rancu). Yang diukur adalah KEDEKATAN BARU: bagian unsur yang berdekatan (kurang dari 0,1 jangkauan)
   * dibandingkan dengan keadaan sebelum diubah, jadi sambungan yang memang ada (gigi pada tulang sisir,
   * tali pada lingkaran) tidak ikut dihitung.
   */
  function ubahLepas(D, asli) {
    var j = jangkauanU(asli), batas = 0.1 * j;
    function bagianDekat(a, b) {
      if (!a || !b) return 0;
      var pts = F.sampelBatas(fig([a]), 40), dekat = 0;
      pts.forEach(function (p) { if (F.jarakKeUnsur(p, b) < batas) dekat++; });
      return dekat / Math.max(1, pts.length);
    }
    return D.ubah.every(function (i) {
      var o = D.asal[i];
      for (var k = 0; k < D.unsur.length; k++) {
        if (k === i) continue;
        var ok = D.asal[k], semula = o >= 0 && ok >= 0;
        if (bagianDekat(D.unsur[i], D.unsur[k]) - (semula ? bagianDekat(asli[o], asli[ok]) : 0) > 0.08) return false;
        if (bagianDekat(D.unsur[k], D.unsur[i]) - (semula ? bagianDekat(asli[ok], asli[o]) : 0) > 0.08) return false;
      }
      return true;
    });
  }

  function titikBerat(u) {
    var s = F.sampel(fig(u), 1.5), x = 0, y = 0;
    s.forEach(function (p) { x += p[0]; y += p[1]; });
    return s.length ? [x / s.length, y / s.length] : [0, 0];
  }

  function putarDi(u, p, d) {
    var f = fPutar(d);
    return petakan([u], function (t) { var q = f([t[0] - p[0], t[1] - p[1]]); return [q[0] + p[0], q[1] + p[1]]; })[0];
  }

  /** Bentuk dasar soal "berbeda sendiri": kiral (dengan cermin sejati) dan tidak simetri putar. */
  function bentukBeda(kel, benih, a, perluIsi) {
    var b = bentukDasar(kel, benih, Fam.R);
    if (!b) return null;
    if (!titikLepas(b.garis, b.titik, Fam.R)) return null;
    var u = b.garis.concat(b.titik), nama = b.namaG.concat(b.namaT), j = Fam.R;
    // bangun beraturan dan kisi titik bersudut tetap sehingga bentuknya bisa terulang antarbenih; satu titik
    // berletak dan berukuran acak (kontinu) membuat setiap bentuk dasar unik
    if (kel === 'datar' || kel === 'kisi') {
      var p0 = tempatBebas(b.garis, b.titik, 0.14 * j, a, j, 0);
      if (!p0) return null;
      var rr = j * a.antara(0.09, 0.13), pp = [p0[0] + a.antara(-0.04, 0.04) * j, p0[1] + a.antara(-0.04, 0.04) * j];
      if (jarakMin(pp, b.garis, b.titik) < rr + 0.08 * j || Math.hypot(pp[0], pp[1]) + rr > 0.92 * j) return null;
      u.push({ jenis: 'bulat', pusat: pp, jari: rr, isi: a.untung(0.5) ? TINTA : null });
      nama.push('titik');
    }
    if (perluIsi && !u.some(function (x) { return kecilTertutup(x, j); })) {
      var r = 0.12 * j, p = tempatBebas(b.garis, b.titik, r, a, j, 0);
      if (!p) return null;
      u.push({ jenis: 'bulat', pusat: p, jari: r, isi: a.untung(0.5) ? TINTA : null });
      nama.push('titik');
      var c = titikBerat(u);
      u = geserU(u, -c[0], -c[1]);
    }
    u = u.map(salinU);
    var f = fig(u);
    if (F.ordeSimetri(f) !== 1) return null;
    var cer = fig(petakan(u, fCermin('tegak')));
    if (F.adalahRotasi(cer, f) || F.bedaBentuk(cer, f) < 0.05) return null;
    if (!layakBentuk(u)) return null;
    return { unsur: u, nama: nama, kel: kel, benih: benih };
  }

  /**
   * Cacat yang membuat satu opsi berbeda. Hasil: { unsur, asal (indeks unsur bentuk dasar tiap unsur
   * hasil, -1 = baru), ubah (indeks unsur hasil yang berubah), hantu (unsur semula, untuk penanda),
   * jenis, uraian, nama }.
   */
  function cacatBeda(jenis, B, a, acuan) {
    var u = B.unsur, n = u.length, j = jangkauanU(u), total = F.panjangTotal(fig(u)), asal = u.map(function (x, i) { return i; });
    function pilih(syarat) { var c = []; for (var i = 0; i < n; i++) if (i !== acuan && syarat(u[i], i)) c.push(i); return c.length ? a.pilih(c) : -1; }
    function ganti(idx, v, ket) { var h = u.map(salinU); h[idx] = v; return { unsur: h, asal: asal, ubah: [idx], hantu: [salinU(u[idx])], nama: B.nama[idx], ket: ket }; }
    var idx, v;
    switch (jenis) {
      case 'cermin':
        return { unsur: petakan(u, fCermin('tegak')), asal: asal, ubah: [], hantu: [], nama: '', ket: '' };
      case 'hapus':
        if (n < 3) return null;
        idx = pilih(function (x) { var p = F.panjangUnsur(x); return p <= total * 0.4 && (x.jenis === 'bulat' || p >= total * 0.1); });
        if (idx < 0) return null;
        return { unsur: u.filter(function (x, i) { return i !== idx; }).map(salinU), asal: asal.filter(function (x, i) { return i !== idx; }), ubah: [], hantu: [salinU(u[idx])], nama: B.nama[idx], ket: '' };
      case 'tambah':
        var pt = pisah(u), r = 0.12 * j, p = tempatBebas(pt.garis, pt.titik, r, a, j, 0);
        if (!p) return null;
        var hitamT = a.untung(0.6);
        return { unsur: u.map(salinU).concat([{ jenis: 'bulat', pusat: p, jari: r, isi: hitamT ? TINTA : null }]), asal: asal.concat([-1]), ubah: [n], hantu: [], nama: 'titik', ket: hitamT ? 'hitam' : 'putih' };
      case 'isi':
        idx = pilih(function (x) { return kecilTertutup(x, j); });
        if (idx < 0) return null;
        v = salinU(u[idx]); v.isi = u[idx].isi ? null : TINTA;
        return ganti(idx, v, v.isi ? 'hitam' : 'putih');
      case 'ukuran':
        idx = pilih(function (x) { var pj = F.panjangUnsur(x); return pj <= total * 0.45 && pj >= total * 0.12; });
        if (idx < 0) return null;
        var k = u[idx].jenis === 'bulat' ? a.pilih([0.5, 1.6]) : a.pilih([0.55, 1.5]), c = F.pusatUnsur(u[idx]);
        v = petakan([u[idx]], function (t) { return [c[0] + (t[0] - c[0]) * k, c[1] + (t[1] - c[1]) * k]; })[0];
        if (v.jenis === 'bulat') v.jari = u[idx].jari * k;
        return ganti(idx, v, k > 1 ? 'besar' : 'kecil');
      case 'geser':
        idx = pilih(function () { return true; });
        if (idx < 0) return null;
        var d = j * a.antara(0.14, 0.24), ar = a.antara(0, 2 * Math.PI);
        if (u[idx].jenis === 'bulat') d = Math.max(d, 2.4 * u[idx].jari);   // titik harus jelas berpindah dari tempatnya
        return ganti(idx, geserU([u[idx]], d * Math.cos(ar), d * Math.sin(ar))[0], '');
      case 'putar-unsur':
        idx = pilih(function () { return true; });
        if (idx < 0) return null;
        return ganti(idx, putarDi(u[idx], [0, 0], a.pilih([35, 45, 55, 70]) * a.tanda()), '');
      case 'cermin-unsur':
        idx = pilih(function (x) { return x.jenis === 'garis' && !x.tutup && x.titik.length > 2; });
        if (idx < 0) return null;
        var cc = F.pusatUnsur(u[idx]);
        return ganti(idx, petakan([u[idx]], function (t) { return [2 * cc[0] - t[0], t[1]]; })[0], '');
      case 'putar-sendiri':
        idx = pilih(function (x) { return x.jenis === 'garis'; });
        if (idx < 0) return null;
        return ganti(idx, putarDi(u[idx], F.pusatUnsur(u[idx]), a.pilih([40, 55, 70, 90]) * a.tanda()), '');
    }
    return null;
  }

  function uraianCacat(D, hurufK) {
    var nm = D.nama;
    switch (D.jenis) {
      case 'cermin': return 'opsi ' + hurufK + ' adalah bayangan cermin bentuk itu (kiri dan kanannya tertukar), sehingga seberapa pun diputar tidak akan sama';
      case 'hapus': return 'opsi ' + hurufK + ' tidak memiliki ' + nm + ' yang ada pada keempat gambar lain';
      case 'tambah': return 'opsi ' + hurufK + ' memiliki satu titik ' + D.ket + ' tambahan yang tidak ada pada keempat gambar lain';
      case 'isi': return nm + ' pada opsi ' + hurufK + ' berwarna ' + D.ket + ', padahal pada keempat gambar lain berwarna ' + (D.ket === 'hitam' ? 'putih' : 'hitam');
      case 'ukuran': return nm + ' pada opsi ' + hurufK + ' lebih ' + D.ket + ' daripada pada keempat gambar lain';
      case 'geser': return 'letak ' + nm + ' pada opsi ' + hurufK + ' bergeser dari tempatnya terhadap unsur lain';
      case 'putar-unsur': return 'letak ' + nm + ' pada opsi ' + hurufK + ' berpindah mengitari pusat gambar sehingga kedudukannya terhadap unsur lain berubah';
      case 'cermin-unsur': return nm + ' pada opsi ' + hurufK + ' tercermin (menghadap ke arah sebaliknya), sedangkan unsur lain tidak';
      case 'putar-sendiri': return 'arah ' + nm + ' pada opsi ' + hurufK + ' berubah, padahal letaknya tetap';
    }
    return '';
  }

  var KET_BEDA = { cermin: 'bayangan cermin', hapus: 'unsur hilang', tambah: 'titik tambahan', isi: 'warna berganti', ukuran: 'ukuran berubah', geser: 'letak bergeser', 'putar-unsur': 'letak berubah', 'cermin-unsur': 'arah berubah', 'putar-sendiri': 'arah berubah' };

  function pilihBobot(a, daftar, bobot) {
    if (!bobot) return a.pilih(daftar);
    return a.bobot(daftar, daftar.map(function (m) { return bobot[m] || 1; }));
  }

  /** Lima sudut: empat untuk gambar yang sama (berbeda-beda), satu untuk gambar yang berbeda. */
  function pilihSudutBeda(a, level) {
    var s90 = [0, 90, 180, 270], s45 = [0, 45, 90, 135, 180, 225, 270, 315];
    if (level === 'mudah' || (level === 'sedang' && a.untung(0.5))) return a.kocok(s90).concat([a.pilih(s90)]);
    var p = a.ambil(s45, 5);
    if (level === 'sulit' && p.filter(function (d) { return d % 90; }).length < 2) return null;
    return p;
  }

  function buatBeda(id, level, benih, opsi) {
    var a = Rng.alat(benih);
    var target = opsi.target == null ? a.bulat(0, 4) : opsi.target;
    var semua = MEK_BEDA[level] || MEK_BEDA.sedang;
    var baru = semua.filter(function (m) { return (opsi.polaDipakai || []).indexOf(id + ':' + m) < 0; });
    var jenis = pilihBobot(a, baru.length ? baru : semua, BOBOT_BEDA[level]);
    for (var coba = 0; coba < 60; coba++) {
      if (coba === 30) jenis = level === 'mudah' ? 'hapus' : 'cermin';   // mekanisme yang paling jarang gagal
      var kel = a.pilih(KELUARGA_BENTUK), bs = bentukBeda(kel, Rng.turunan(benih, coba, 'beda'), a, jenis === 'isi');
      if (!bs) continue;
      var u = bs.unsur, acuan = garisTerpanjang(u);
      if (acuan < 0) continue;
      var D = cacatBeda(jenis, bs, a, acuan);
      if (!D) continue;
      D.jenis = jenis;
      var c = titikBerat(D.unsur);
      D.unsur = geserU(D.unsur, -c[0], -c[1]);
      D.hantu = geserU(D.hantu, -c[0], -c[1]);
      var fD = fig(D.unsur), fS = fig(u);
      if (F.adalahRotasi(fD, fS) || !layakBentuk(D.unsur) || !ubahLepas(D, u)) continue;
      if (jangkauanU(D.unsur) > 1.15 * jangkauanU(u)) continue;
      if (jenis !== 'isi') {
        var beda = F.bedaBentuk(fD, fS);
        if (beda < (jenis === 'ukuran' ? BEDA_MIN_UKURAN : BEDA_MIN[level]) || beda > BEDA_MAKS[level]) continue;
      }
      var sudut = pilihSudutBeda(a, level);
      if (!sudut) continue;
      // urutan opsi: empat gambar sama (diacak) lalu gambar berbeda disisipkan di posisi target
      var sama = [0, 1, 2, 3].map(function (i) { return { fig: fig(bulatkanU(F.putar(fS, sudut[i]).unsur)), sudut: sudut[i], kunci: false }; });
      var kunciObj = { fig: fig(bulatkanU(F.putar(fD, sudut[4]).unsur)), sudut: sudut[4], kunci: true };
      var daftar = a.kocok(sama);
      daftar.splice(target, 0, kunciObj);
      var samaIdx = [0, 1, 2, 3, 4].filter(function (k) { return k !== target; }), ref = samaIdx[0], sRef = daftar[ref].sudut;
      daftar.forEach(function (d, i) {
        if (d.kunci) return;
        var lawan = samaIdx.filter(function (k) { return k !== i; })[0];
        var dd = sudutNorm(d.sudut - daftar[lawan].sudut);
        d.alasan = 'Gambar ini adalah bentuk yang sama dengan opsi ' + Fmt.huruf(lawan) + ' yang ' + uraiPutar(dd) + ', jadi bukan gambar yang berbeda.';
      });
      var maks = 0;
      daftar.forEach(function (d) { maks = Math.max(maks, jangkauanU(d.fig.unsur)); });
      var skala = 130 * 0.4 / maks, kepala = 9.5;
      var opsiGambar = daftar.map(function (d, i) {
        return { teks: 'Gambar opsi ' + Fmt.huruf(i), nilai: i, alasan: d.kunci ? null : d.alasan, kunci: d.kunci,
          gambar: { id: 'opsi-' + Fmt.huruf(i).toLowerCase(), jenis: 'ta-beda-opsi', model: { fig: d.fig, skala: skala, kepala: kepala }, judul: 'Opsi ' + Fmt.huruf(i) } };
      });

      // pembahasan: semua opsi diputar ke arah opsi acuan; gambar yang berbeda ke arah yang paling mirip
      var putarBalik = daftar.map(function (d) {
        if (d.kunci && jenis === 'cermin') return sudutNorm(-sRef - d.sudut);
        return sudutNorm(sRef - d.sudut);
      });
      var normalSama = fig(bulatkanU(F.putar(fS, sRef).unsur));
      var sudutNormalK = jenis === 'cermin' ? -sRef : sRef;
      var normalK = fig(bulatkanU(F.putar(fD, sudutNormalK).unsur));
      var hantuK = bulatkanU(F.putar(fig(D.hantu), sudutNormalK).unsur);
      var acuanD = D.asal.indexOf(acuan), warnaSama = [], warnaK = [];
      warnaSama[acuan] = BH.acuan;
      if (acuanD >= 0) warnaK[acuanD] = BH.acuan;
      D.ubah.forEach(function (i) { warnaK[i] = BH.sorot; });
      var normal = daftar.map(function (d) { return d.kunci ? normalK : normalSama; });
      var warna = daftar.map(function (d) { return d.kunci ? warnaK : warnaSama; });
      var hurufK = Fmt.huruf(target), hurufRef = Fmt.huruf(ref);
      var lainH = [0, 1, 2, 3, 4].filter(function (i) { return i !== target; }).map(Fmt.huruf);
      var namaAcuan = bs.nama[acuan];
      var pem = [
        'Pada putaran, semua unsur gambar ikut berputar bersama-sama, sehingga letak, ukuran, warna, dan sudut antarunsurnya tidak berubah. Bayangan cermin, unsur yang hilang atau bertambah, warna yang berganti, dan unsur yang bergeser tidak dapat diperoleh hanya dengan memutar.',
        'Gambar 1 memutar setiap opsi sehingga arahnya sama dengan opsi ' + hurufRef + ' (baris bawah); garis merah adalah unsur pembanding (' + namaAcuan + '). Setelah diputar, opsi ' + daftarKata(lainH) + ' menjadi persis sama, jadi keempatnya adalah satu gambar yang hanya diputar.',
        'Opsi ' + hurufK + ' tidak dapat disamakan dengan cara memutar: ' + uraianCacat(D, hurufK) + '. Gambar 2 membandingkan bentuk yang sama itu dengan opsi ' + hurufK + ' setelah diputar' + (jenis === 'cermin' ? '; keduanya saling bercermin terhadap garis putus-putus di tengah.' : '; bagian yang berbeda ditandai jingga.'),
        'Jadi gambar yang berbeda sendiri adalah opsi ' + hurufK + '.'
      ];
      var sudutTeks = daftar.map(function (d) { return d.sudut; });
      var ctx = { subtes: 'ku', submateri: 'figural', keluarga: id, level: level, benih: benih, a: a };
      var butir = Butir.rakitPg(ctx, {
        jenisSoal: 'Figural - Gambar yang Berbeda Sendiri (putaran)',
        judul: null, teks: [], perintah: PERINTAH_BEDA, pertanyaan: '',
        gambar: [],
        pilihanJadi: { opsi: opsiGambar, kunciIndex: target }, tulisKunci: false,
        langkah: [], pembahasan: pem,
        model: { topik: 'Figural', tipe: 'transformasi-beda', cacat: jenis, pilihan: daftar.map(function (d) { return d.fig; }), kunciIndex: target },
        sidik: { inti: 'transformasi-beda|' + kel + '#' + bs.benih + '|' + jenis + '|' + sudutTeks.join(','), param: [], entitas: jenis }
      });
      if (!butir) continue;
      butir.gambarPembahasan = [
        { id: 'bahas-1', jenis: 'ta-beda-normal', judul: 'Gambar 1. Semua opsi diputar searah opsi ' + hurufRef,
          model: { asli: daftar.map(function (d) { return d.fig; }), normal: normal, warna: warna, hantu: daftar.map(function (d) { return d.kunci ? hantuK : []; }), putar: putarBalik, acuan: ref, beda: target, skala: skala, kepala: kepala, jawaban: kunciObj.fig } },
        { id: 'bahas-2', jenis: 'ta-beda-banding', judul: 'Gambar 2. Bentuk yang sama dibandingkan dengan opsi ' + hurufK,
          model: { kiri: normalSama, kanan: normalK, warnaKiri: warnaSama, warnaKanan: warnaK, hantu: hantuK, cermin: jenis === 'cermin', judulKiri: 'Bentuk yang sama (opsi ' + hurufRef + ')', judulKanan: 'Opsi ' + hurufK + ' diputar', ket: KET_BEDA[jenis], skala: skala, kepala: kepala } }
      ];
      butir.pola = id + ':' + jenis;
      butir.kategoriRiset = 'pengayaan';
      butir.catatanRiset = 'Bentuk gambar yang berbeda sendiri (putaran dibedakan dari bayangan cermin dan perubahan unsur) dari bab Macam-macam Transformasi Figural di Kerangka Course; tidak ada pada contoh riset BAB V.';
      return butir;
    }
    return null;
  }

  // ------------------------------------------------------------------ gambar yang berbeda: SVG

  function svgFigBeda(f, cx, cy, s, o) {
    o = o || {};
    return svgUnsur(f.unsur, cx, cy, s, { warna: o.warna, semua: o.semua, putus: o.putus, tebal: o.tebal || 2, kepala: o.kepala });
  }

  function svgBedaOpsi(m) {
    var P = 130, pad = 4, W = P + 2 * pad;
    var o = S.rect(pad, pad, P, P, { rx: 4, isi: '#ffffff', garis: TEPI, tebal: 1.6 }) + svgFigBeda(m.fig, pad + P / 2, pad + P / 2, m.skala, { kepala: m.kepala });
    return { svg: S.doc(o, W, W, { latar: '#ffffff' }), lebar: W, tinggi: W };
  }

  function teksPutar(d, acuan) { return d === 0 ? [acuan ? 'acuan' : 'tidak diputar'] : (d === 180 ? ['putar 180°'] : ['putar ' + Math.abs(d) + '°', d > 0 ? 'searah' : 'berlawanan']); }

  /** Baris atas: opsi seperti di soal; baris bawah: setiap opsi diputar ke arah opsi acuan. */
  function svgBedaNormal(m, judul) {
    var P = 96, gap = 14, pad = 8, lebarIsi = 5 * P + 4 * gap;
    var W = Math.max(pad * 2 + lebarIsi, Math.ceil(Metrik.lebar(judul, 13, true)) + 18), x0 = (W - lebarIsi) / 2;
    var s = m.skala * P / 130, kp = m.kepala * P / 130, o = [teksB(judul, pad, pad + 13, { ukuran: 13, tebal: true })];
    var y1 = pad + 26 + 30, y2 = y1 + P + 66;
    o.push(teksB('Opsi seperti pada soal', x0, y1 - 22, { ukuran: 11, isi: BH.teksRedup }));
    o.push(teksB('Setelah diputar searah opsi ' + Fmt.huruf(m.acuan), x0, y2 - 22, { ukuran: 11, isi: BH.teksRedup }));
    for (var i = 0; i < 5; i++) {
      var x = x0 + i * (P + gap), beda = i === m.beda;
      o.push(teksB(Fmt.huruf(i), x + P / 2, y1 - 6, { ukuran: 12, tebal: true, rata: 'middle', isi: beda ? BH.jawab : BH.teks }));
      o.push(S.rect(x, y1, P, P, { rx: 4, isi: beda ? BH.latarJawab : '#ffffff', garis: beda ? BH.jawab : TEPI, tebal: beda ? 2.4 : 1.2 }));
      o.push(svgFigBeda(m.asli[i], x + P / 2, y1 + P / 2, s, { kepala: kp, tebal: 1.8 }));
      o.push(teksB(Fmt.huruf(i), x + P / 2, y2 - 6, { ukuran: 12, tebal: true, rata: 'middle', isi: beda ? BH.sorot : BH.teks }));
      o.push(S.rect(x, y2, P, P, { rx: 4, isi: beda ? BH.latarSorot : '#ffffff', garis: beda ? BH.sorot : TEPI, tebal: beda ? 2.4 : 1.2 }));
      if (beda && m.hantu[i] && m.hantu[i].length) o.push(svgFigBeda(fig(m.hantu[i]), x + P / 2, y2 + P / 2, s, { semua: BH.sorot, putus: true, tebal: 1.4 }));
      o.push(svgFigBeda(m.normal[i], x + P / 2, y2 + P / 2, s, { kepala: kp, tebal: 1.8, warna: m.warna[i] }));
      var t = teksPutar(m.putar[i], i === m.acuan);
      t.forEach(function (baris, k) { o.push(teksB(baris, x + P / 2, y2 + P + 14 + 12 * k, { ukuran: 10, rata: 'middle', isi: beda ? BH.sorot : BH.teksRedup, tebal: beda && !k })); });
    }
    // panah turun dari baris atas ke baris bawah
    for (i = 0; i < 5; i++) {
      var xm = x0 + i * (P + gap) + P / 2;
      o.push(S.panah(xm, y1 + P + 5, xm, y2 - 36, { warna: BH.panah, tebal: 1.8, kepala: 7 }));
    }
    var H = y2 + P + 40;
    return { svg: S.doc(o.join(''), W, H, { latar: '#ffffff' }), lebar: W, tinggi: H };
  }

  /** Bentuk yang sama (kiri) dan opsi kunci yang diputar (kanan), diperbesar, dengan penanda bedanya. */
  function svgBedaBanding(m, judul) {
    var P = 150, gap = 110, pad = 8, lebarIsi = 2 * P + gap;
    var W = Math.max(pad * 2 + lebarIsi, Math.ceil(Metrik.lebar(judul, 13, true)) + 18), x0 = (W - lebarIsi) / 2;
    var s = m.skala * P / 130, kp = m.kepala * P / 130, y0 = pad + 26 + 22, o = [teksB(judul, pad, pad + 13, { ukuran: 13, tebal: true })];
    var xk = x0 + P + gap;
    o.push(teksB(m.judulKiri, x0 + P / 2, y0 - 8, { ukuran: 11, tebal: true, rata: 'middle' }));
    o.push(teksB(m.judulKanan, xk + P / 2, y0 - 8, { ukuran: 11, tebal: true, rata: 'middle', isi: BH.sorot }));
    o.push(S.rect(x0, y0, P, P, { rx: 4, isi: '#ffffff', garis: TEPI, tebal: 1.4 }));
    o.push(S.rect(xk, y0, P, P, { rx: 4, isi: BH.latarSorot, garis: BH.sorot, tebal: 2.4 }));
    o.push(svgFigBeda(m.kiri, x0 + P / 2, y0 + P / 2, s, { kepala: kp, warna: m.warnaKiri }));
    if (m.hantu && m.hantu.length) o.push(svgFigBeda(fig(m.hantu), xk + P / 2, y0 + P / 2, s, { semua: BH.sorot, putus: true, tebal: 1.5 }));
    o.push(svgFigBeda(m.kanan, xk + P / 2, y0 + P / 2, s, { kepala: kp, warna: m.warnaKanan }));
    var xm = x0 + P + gap / 2;
    if (m.cermin) {
      o.push(S.garis(xm, y0 - 2, xm, y0 + P + 2, { garis: BH.panah, tebal: 2, putus: '6 4' }));
      o.push(teksB('cermin', xm, y0 + P + 16, { ukuran: 11, tebal: true, rata: 'middle', isi: BH.panah }));
    } else {
      o.push(teksB('tidak sama', xm, y0 + P / 2 - 6, { ukuran: 11, tebal: true, rata: 'middle', isi: BH.sorot }));
      o.push(S.garis(xm - 12, y0 + P / 2 + 4, xm + 12, y0 + P / 2 + 4, { garis: BH.sorot, tebal: 2.4 }));
      o.push(S.garis(xm - 12, y0 + P / 2 + 12, xm + 12, y0 + P / 2 + 12, { garis: BH.sorot, tebal: 2.4 }));
      o.push(S.garis(xm + 6, y0 + P / 2 - 2, xm - 6, y0 + P / 2 + 18, { garis: BH.sorot, tebal: 2.4 }));
    }
    o.push(teksB(m.ket, xk + P / 2, y0 + P + 16, { ukuran: 11, tebal: true, rata: 'middle', isi: BH.sorot }));
    var H = y0 + P + 28;
    return { svg: S.doc(o.join(''), W, H, { latar: '#ffffff' }), lebar: W, tinggi: H };
  }

  // ------------------------------------------------------------------ antarmuka

  function buat(id, level, benih, opsi) {
    opsi = opsi || {};
    if (id === 'transformasi-analogi') return buatAnalogi(id, level, benih >>> 0, opsi);
    if (id === 'transformasi-beda') return buatBeda(id, level, benih >>> 0, opsi);
    return null;
  }

  var KELUARGA = [
    { id: 'transformasi-analogi', nama: 'Analogi gambar: transformasi kotak 1 ke 2 diterapkan pada kotak 3 (putar, cermin, warna, titik, skala, pindah)', submateri: 'figural', kolam: 'matriks' },
    { id: 'transformasi-beda', nama: 'Gambar yang berbeda sendiri di antara empat putaran satu bentuk', submateri: 'figural', kolam: 'serial' }
  ];

  return {
    KELUARGA: KELUARGA, buat: buat, PERINTAH_ANALOGI: PERINTAH_ANALOGI, PERINTAH_BEDA: PERINTAH_BEDA,
    GAMBAR: {
      'ta-analogi': function (m) { return svgSoal(m); },
      'ta-panel': function (m) { return svgPanel(m); },
      'ta-tahap': function (m, judul) { return svgTahap(m, judul || ''); },
      'ta-beda-opsi': function (m) { return svgBedaOpsi(m); },
      'ta-beda-normal': function (m, judul) { return svgBedaNormal(m, judul || ''); },
      'ta-beda-banding': function (m, judul) { return svgBedaBanding(m, judul || ''); }
    }
  };
});
