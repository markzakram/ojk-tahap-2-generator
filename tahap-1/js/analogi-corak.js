/*
 * analogi-corak.js — Kemampuan Umum > Figural > Macam-macam Transformasi Figural: analogi bangun bercorak.
 *
 * Soal: empat kotak sejajar "kotak 1 -> kotak 2 = kotak 3 -> ?". Setiap kotak berisi bangun tebal bergaya
 * matriks 2x2 bersekat (contoh riset BAB V soal 4): lingkaran, persegi/belah ketupat, segitiga, segienam,
 * segi delapan, kubah, perisai, atau lensa yang dibagi 2-8 bagian oleh sinar dari pusatnya, dan tiap bagian
 * berisi satu corak (js/corak.js). Sebagian bangun memuat bangun dalam bercorak dan/atau lingkaran kecil
 * penanda di titik pusat. Kotak 1 berubah menjadi kotak 2 menurut satu atau dua transformasi; kotak 3
 * (bentuk/susunan berbeda) harus diubah dengan transformasi yang sama.
 *
 * Pustaka transformasi penyusun:
 *   putar        90/180/270 (45/135 untuk sulit) searah jarum jam; corak berarah (arsir, kotak-kotak) ikut berputar
 *   cermin       terhadap garis tegak, mendatar, atau miring; corak berarah ikut dicerminkan
 *   tukar        semua bagian bercorak X menjadi Y dan sebaliknya
 *   ganti        semua bagian bercorak X menjadi Y (corak lain tetap)
 *   balik        terang-gelap: hitam <-> putih, bertitik <-> berbulatan
 *   geser        bangun tetap, tiap corak pindah satu bagian searah/berlawanan arah jarum jam (arah arsir tetap)
 *   bangun       bangun luar berganti (mis. lingkaran -> persegi), pembagian dan corak tetap
 *   dalam-luar   corak bangun dalam dan bangun luar bertukar
 *   penanda      lingkaran kecil penanda di pusat ditambahkan atau dihapus
 *
 * Tingkat: mudah = satu transformasi yang jelas; sedang = satu transformasi halus (corak berarah, balik
 * terang-gelap, geser corak, cermin miring) atau dua transformasi sederhana; sulit = dua transformasi beda
 * jenis dengan corak berarah, putaran 45°, geser, atau balik.
 *
 * Penyusun menolak calon yang jawabannya tidak tunggal: semua transformasi (dan gabungan dua transformasi beda
 * golongan, dalam kedua urutan) yang memetakan kotak 1 ke kotak 2 diterapkan pada kotak 3, dan hasilnya harus
 * satu. Pemeriksa independen (cek-analogi-corak.js) mengulang penyimpulan itu dengan pustakanya sendiri.
 *
 * Data bangun (JSON, `fig` opsi): { b, o, n, s, c, d, p }
 *   b bangun luar, o arah sudut bangun (derajat, 0 = atas, searah jarum jam, dinormalkan menurut simetri putar
 *   bangun), n banyak bagian, s sudut awal bagian 0 (dinormalkan terhadap 360/n), c kode corak tiap bagian
 *   (bagian k dari s + k*360/n searah jarum jam), d bangun dalam { b, o, n, s, c } atau null, p penanda pusat 0/1.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./rng.js'), require('./svg.js'), require('./butir.js'), require('./format.js'), require('./metrik.js'), require('./corak.js'), require('./bentuk.js'));
    module.exports = api;
  } else {
    api = factory(root.Rng, root.Svg, root.Butir, root.Fmt, root.Metrik, root.Corak, root.Bentuk);
    root.AnalogiCorak = api;
  }
})(typeof self !== 'undefined' ? self : this, function (Rng, S, Butir, Fmt, Metrik, Corak, Bentuk) {
  'use strict';

  var ID = 'analogi-corak';
  var PERINTAH = 'Gambar pada kotak 1 berubah menjadi gambar pada kotak 2. Gambar pada kotak 3 berubah dengan cara yang sama. Pilih gambar yang menggantikan tanda tanya.';
  var TINTA = Corak.TINTA, TEPI = Corak.TEPI, BH = S.BAHAS;

  // ================================================================ data bangun dan corak

  var BANGUN = {
    lingkaran: { m: 0, nama: 'lingkaran' },
    segitiga: { m: 3, k: 1.2, nama: 'segitiga' },
    persegi: { m: 4, k: 1.12, nama: 'persegi' },
    segienam: { m: 6, k: 1.04, nama: 'segienam' },
    segidelapan: { m: 8, k: 1.02, nama: 'segi delapan' },
    kubah: { m: 1, nama: 'kubah' },
    perisai: { m: 1, nama: 'perisai' },
    lensa: { m: 2, nama: 'lensa' }
  };
  var SEMUA_BANGUN = ['lingkaran', 'lingkaran', 'persegi', 'persegi', 'segienam', 'segitiga', 'segidelapan', 'kubah', 'perisai', 'lensa'];
  var ARAH_BANGUN = { lingkaran: [0], segitiga: [0, 60, 90, 30], persegi: [45, 45, 0], segienam: [0, 30], segidelapan: [22.5], kubah: [0, 0, 90, 180, 270], perisai: [180, 180, 0, 90, 270], lensa: [0, 90, 45] };
  // pembagian yang rapi per bangun: banyak bagian -> sudut awal relatif terhadap arah bangun
  var BAGI = {
    lingkaran: { 1: [0], 2: [0, 45, 90, 135], 3: [0, 60], 4: [0, 45], 5: [0], 6: [0, 30], 8: [0, 22.5] },
    persegi: { 1: [0], 2: [0, 45, 90, 135], 4: [0, 45], 8: [0] },
    segitiga: { 2: [0], 3: [0, 60], 6: [0] },
    segienam: { 1: [0], 2: [0, 30, 60, 90], 3: [0, 30], 6: [0, 30] },
    segidelapan: { 1: [0], 2: [-22.5, 22.5], 4: [-22.5, 0], 8: [-22.5, 0] },
    kubah: { 2: [0, 45, 90, 135], 4: [0, 45] },
    perisai: { 2: [0, 45, 90, 135], 4: [0, 45] },
    lensa: { 2: [0, 45, 90], 4: [0, 45] }
  };
  var BISA_DALAM = { lingkaran: 1, persegi: 1, segienam: 1, segidelapan: 1 };
  var BANGUN_DALAM = ['lingkaran', 'persegi', 'segienam', 'segitiga'];
  var RASIO_DALAM = 0.5, SKALA_DALAM = 0.82;

  var KODE = Corak.KODE;
  var TAK_BERARAH = ['hitam', 'putih', 'titik', 'bintang', 'bulatan'];
  var BERARAH = ['kotak', 'kotak-miring', 'arsir-0', 'arsir-45', 'arsir-90', 'arsir-135'];
  var ARSIR = ['arsir-0', 'arsir-45', 'arsir-90', 'arsir-135'];
  var BALIK = { hitam: 'putih', putih: 'hitam', titik: 'bulatan', bulatan: 'titik' };
  var PENDEK = {
    hitam: 'hitam', putih: 'putih', titik: 'titik', bintang: 'bintang', bulatan: 'bulatan', kotak: 'kotak', 'kotak-miring': 'kotak miring',
    'arsir-0': 'garis datar', 'arsir-45': 'garis /', 'arsir-90': 'garis tegak', 'arsir-135': 'garis \\'
  };
  var ARAH8 = ['atas', 'kanan atas', 'kanan', 'kanan bawah', 'bawah', 'kiri bawah', 'kiri', 'kiri atas'];
  var NAMA_SUMBU = { 90: 'garis tegak', 0: 'garis mendatar', 45: 'garis miring naik ke kanan', 135: 'garis miring turun ke kanan' };
  var LABEL_SUMBU = { 90: 'garis tegak', 0: 'garis datar', 45: 'garis miring /', 135: 'garis miring \\' };

  function berarah(k) { return BERARAH.indexOf(k) >= 0; }
  function md(x, n) { return ((x % n) + n) % n; }
  function bul(x) { return Math.round(x * 1000) / 1000; }
  function normSudut(x, w) { var r = bul(md(x, w)); return r >= w - 0.0005 ? 0 : r; }
  function salin(x) { return JSON.parse(JSON.stringify(x)); }
  function deret(n) { var o = []; for (var i = 0; i < n; i++) o.push(i); return o; }
  function unik(xs) { var o = []; xs.forEach(function (x) { if (o.indexOf(x) < 0) o.push(x); }); return o; }

  // ================================================================ bentuk kanonik

  function kanonLapis(L) {
    var m = BANGUN[L.b].m, o = m === 0 ? 0 : normSudut(L.o, 360 / m);
    if (L.n === 1) return { b: L.b, o: o, n: 1, s: 0, c: [L.c[0]] };
    var w = 360 / L.n, sc = normSudut(L.s, w), geser = Math.round((L.s - sc) / w), c = [];
    for (var k = 0; k < L.n; k++) c[md(k + geser, L.n)] = L.c[k];
    return { b: L.b, o: o, n: L.n, s: sc, c: c };
  }

  function kanon(f) {
    var L = kanonLapis(f);
    return { b: L.b, o: L.o, n: L.n, s: L.s, c: L.c, d: f.d ? kanonLapis(f.d) : null, p: f.p ? 1 : 0 };
  }

  function kunciLapis(L) { return L.b + '/' + L.o + '/' + L.n + '/' + L.s + '/' + L.c.join(','); }
  function kunciFig(f) { return f ? kunciLapis(f) + '|' + (f.d ? kunciLapis(f.d) : '-') + '|' + f.p : '!'; }
  function lapisLuar(f) { return { b: f.b, o: f.o, n: f.n, s: f.s, c: f.c }; }
  function rakit(luar, d, p) { return kanon({ b: luar.b, o: luar.o, n: luar.n, s: luar.s, c: luar.c, d: d, p: p }); }
  function cocokDL(f) { return !!f.d && f.d.n === f.n && (f.n === 1 || f.d.s === f.s); }

  // ================================================================ transformasi (penyusun)

  function putarLapis(L, th, tanpaArah) {
    return { b: L.b, o: L.o + th, n: L.n, s: L.s + th, c: L.c.map(function (k) { return tanpaArah ? k : Corak.putarKode(k, th); }) };
  }

  /** Cermin terhadap garis bersudut psi (cara arsir: 0 mendatar, 90 tegak, 45 "/", 135 "\"). */
  function cerminLapis(L, psi, tanpaArah) {
    var phi = 90 - psi, w = 360 / L.n, c = [];
    for (var k = 0; k < L.n; k++) c[md(L.n - k, L.n)] = tanpaArah ? L.c[k] : Corak.cerminKode(L.c[k], psi);
    return { b: L.b, o: 2 * phi - L.o, n: L.n, s: 2 * phi - L.s - w, c: c };
  }

  function geserLapis(L, k) {
    if (L.n < 2) return L;
    var c = [];
    for (var i = 0; i < L.n; i++) c[md(i + k, L.n)] = L.c[i];
    return { b: L.b, o: L.o, n: L.n, s: L.s, c: c };
  }

  function petaLapis(f, fn) { return rakit(fn(lapisLuar(f)), f.d ? fn(f.d) : null, f.p); }
  function petaKode(f, fn) { return petaLapis(f, function (L) { return { b: L.b, o: L.o, n: L.n, s: L.s, c: L.c.map(fn) }; }); }

  /**
   * Satu langkah transformasi; null bila tidak dapat diterapkan.
   *   putar {th, tanpaArah}  cermin {psi, tanpaArah}  iso {f, th} (cermin tegak bila f, lalu putar th)
   *   geser {k}  tukar {x, y}  ganti {x, y}  balik  bangun {dari, ke:{b,o}}  dalam-luar  penanda
   *   salin-dalam / salin-luar (hanya untuk pengecoh)
   */
  function terapkan(t, f) {
    if (!f) return null;
    switch (t.jenis) {
      case 'putar': return petaLapis(f, function (L) { return putarLapis(L, t.th, t.tanpaArah); });
      case 'cermin': return petaLapis(f, function (L) { return cerminLapis(L, t.psi, t.tanpaArah); });
      case 'iso': return petaLapis(f, function (L) { var M = t.f ? cerminLapis(L, 90) : L; return t.th ? putarLapis(M, t.th) : M; });
      case 'geser': return petaLapis(f, function (L) { return geserLapis(L, t.k); });
      case 'tukar': return petaKode(f, function (k) { return k === t.x ? t.y : k === t.y ? t.x : k; });
      case 'ganti': return petaKode(f, function (k) { return k === t.x ? t.y : k; });
      case 'balik': return petaKode(f, function (k) { return BALIK[k] || k; });
      case 'bangun':
        if (f.b !== t.dari) return null;
        return rakit({ b: t.ke.b, o: t.ke.o, n: f.n, s: f.s, c: f.c }, f.d, f.p);
      case 'dalam-luar':
        if (!cocokDL(f)) return null;
        return rakit({ b: f.b, o: f.o, n: f.n, s: f.s, c: f.d.c }, { b: f.d.b, o: f.d.o, n: f.d.n, s: f.d.s, c: f.c }, f.p);
      case 'salin-dalam':
        if (!cocokDL(f)) return null;
        return rakit(lapisLuar(f), { b: f.d.b, o: f.d.o, n: f.d.n, s: f.d.s, c: f.c.slice() }, f.p);
      case 'salin-luar':
        if (!cocokDL(f)) return null;
        return rakit({ b: f.b, o: f.o, n: f.n, s: f.s, c: f.d.c.slice() }, f.d, f.p);
      case 'penanda': return rakit(lapisLuar(f), f.d, f.p ? 0 : 1);
      default: throw new Error('langkah tidak dikenal: ' + t.jenis);
    }
  }

  function jalankan(langkah, f) {
    for (var i = 0; i < langkah.length && f; i++) f = terapkan(langkah[i], f);
    return f || null;
  }

  // ================================================================ penyimpulan dan ketunggalan jawaban

  var ISO = [];
  (function () { for (var f = 0; f < 2; f++) for (var th = 0; th < 360; th += 45) if (f || th) ISO.push({ jenis: 'iso', f: f, th: th }); })();
  var EKSPLISIT = ISO.concat([{ jenis: 'geser', k: 1 }, { jenis: 'geser', k: -1 }, { jenis: 'dalam-luar' }, { jenis: 'penanda' }]);

  function golongan(t) {
    return { iso: 'G', putar: 'G', cermin: 'G', geser: 'H', 'dalam-luar': 'T', penanda: 'P', bangun: 'B' }[t.jenis] || 'S';
  }
  function kebalikan(t) {
    if (t.jenis === 'iso') return t.f ? t : { jenis: 'iso', f: 0, th: md(360 - t.th, 360) };
    if (t.jenis === 'geser') return { jenis: 'geser', k: -t.k };
    return t;
  }

  /** Substitusi corak (tukar, ganti, balik) yang membawa A ke T; strukturnya harus sama persis. */
  function cariSubstitusi(A, T) {
    if (!A || !T || A.b !== T.b || A.o !== T.o || A.n !== T.n || A.s !== T.s || A.p !== T.p || !A.d !== !T.d) return [];
    if (A.d && (A.d.b !== T.d.b || A.d.o !== T.d.o || A.d.n !== T.d.n || A.d.s !== T.d.s)) return [];
    var dari = A.c.concat(A.d ? A.d.c : []), ke = T.c.concat(T.d ? T.d.c : []), peta = {}, i;
    for (i = 0; i < dari.length; i++) {
      if (peta[dari[i]] !== undefined && peta[dari[i]] !== ke[i]) return [];
      peta[dari[i]] = ke[i];
    }
    var ada = Object.keys(peta), ubah = ada.filter(function (x) { return peta[x] !== x; }), out = [];
    if (!ubah.length) return [];
    if (ubah.length === 1) {
      out.push({ jenis: 'ganti', x: ubah[0], y: peta[ubah[0]] });
      if (ada.indexOf(peta[ubah[0]]) < 0) out.push({ jenis: 'tukar', x: ubah[0], y: peta[ubah[0]] });
    }
    if (ubah.length === 2 && peta[ubah[0]] === ubah[1] && peta[ubah[1]] === ubah[0]) out.push({ jenis: 'tukar', x: ubah[0], y: ubah[1] });
    if (ada.every(function (x) { return BALIK[x] ? peta[x] === BALIK[x] : peta[x] === x; })) out.push({ jenis: 'balik' });
    return out;
  }

  /** Penggantian bangun luar yang membawa A ke T (selain bangun luar, semuanya sama). */
  function cariBangun(A, T) {
    if (!A || !T || (A.b === T.b && A.o === T.o)) return [];
    var B = rakit({ b: T.b, o: T.o, n: A.n, s: A.s, c: A.c }, A.d, A.p);
    return kunciFig(B) === kunciFig(T) ? [{ jenis: 'bangun', dari: A.b, dariO: A.o, ke: { b: T.b, o: T.o } }] : [];
  }

  /**
   * Semua tafsiran (satu transformasi, atau dua transformasi beda golongan dalam kedua urutan) yang
   * membawa k1 ke k2. Gabungan dua hanya dihitung bila tidak satu pun komponennya sendirian sudah cukup.
   */
  function tafsir(k1, k2) {
    var sasaran = kunciFig(k2), daftar = [], sendiri = {};
    function sama(f) { return !!f && kunciFig(f) === sasaran; }
    function cukup(t) {
      var kk = JSON.stringify(t);
      if (sendiri[kk] === undefined) sendiri[kk] = sama(terapkan(t, k1));
      return sendiri[kk];
    }
    function minimal(x, y) { return !cukup(x) && !cukup(y); }
    EKSPLISIT.forEach(function (t) { if (cukup(t)) daftar.push([t]); });
    cariSubstitusi(k1, k2).forEach(function (t) { daftar.push([t]); });
    cariBangun(k1, k2).forEach(function (t) { daftar.push([t]); });
    EKSPLISIT.forEach(function (x) {
      var A = terapkan(x, k1);
      if (A) {
        EKSPLISIT.forEach(function (y) {
          if (golongan(x) !== golongan(y) && sama(terapkan(y, A)) && minimal(x, y)) daftar.push([x, y]);
        });
        cariSubstitusi(A, k2).forEach(function (s) { if (minimal(x, s)) daftar.push([x, s]); });
        cariBangun(A, k2).forEach(function (b) { if (minimal(x, b)) daftar.push([x, b]); });
      }
      var Z = terapkan(kebalikan(x), k2);
      if (Z) {
        cariSubstitusi(k1, Z).forEach(function (s) { if (sama(terapkan(x, terapkan(s, k1))) && minimal(s, x)) daftar.push([s, x]); });
      }
    });
    if (k1.b !== k2.b || k1.o !== k2.o) {
      var A2 = rakit({ b: k2.b, o: k2.o, n: k1.n, s: k1.s, c: k1.c }, k1.d, k1.p), bb = { jenis: 'bangun', dari: k1.b, dariO: k1.o, ke: { b: k2.b, o: k2.o } };
      cariSubstitusi(A2, k2).forEach(function (s) { if (minimal(s, bb)) daftar.push([s, bb]); });
    }
    return daftar;
  }

  /** Hasil semua tafsiran pada k3: { kunci: [kunci hasil berbeda], hasil: fig bila tunggal }. */
  function hasilTafsir(k1, k2, k3) {
    var t = tafsir(k1, k2), kunci = {}, hasil = null;
    t.forEach(function (h) {
      var f = jalankan(h, k3), kk = kunciFig(f);
      if (!kunci[kk]) { kunci[kk] = 1; hasil = f; }
    });
    var ks = Object.keys(kunci);
    return { banyak: t.length, kunci: ks, hasil: ks.length === 1 && ks[0] !== '!' ? hasil : null };
  }

  // ================================================================ geometri dan gambar

  function dasarLokal(b) {
    var p = [], i, t, q;
    if (b === 'kubah') {
      p.push([0.8, 0.74], [-0.8, 0.74]);
      for (i = 0; i <= 24; i++) { t = Math.PI - Math.PI * i / 24; p.push([0.8 * Math.cos(t), -0.08 - 0.8 * Math.sin(t)]); }
      return p;
    }
    if (b === 'perisai') {
      q = [[-0.78, 0.85], [0.78, 0.85], [0.78, -0.05]];
      var kx = function (t) { return (1 - t) * (1 - t) * 0.78 + 2 * (1 - t) * t * 0.72; };
      var ky = function (t) { return -((1 - t) * (1 - t) * 0.05 + 2 * (1 - t) * t * 0.62 + t * t * 0.92); };
      for (i = 1; i <= 16; i++) q.push([kx(i / 16), ky(i / 16)]);
      for (i = 15; i >= 0; i--) q.push([-kx(i / 16), ky(i / 16)]);
      return q.map(function (z) { return [z[0] * 0.95, z[1] * 0.95]; });
    }
    // lensa tegak
    for (i = 0; i <= 24; i++) { t = -1 + 2 * i / 24; p.push([0.64 * (1 - t * t), 0.98 * t]); }
    for (i = 23; i >= 1; i--) { t = -1 + 2 * i / 24; p.push([-0.64 * (1 - t * t), 0.98 * t]); }
    return p;
  }

  /** Poligon garis tepi satu lapis bangun berpusat (cx, cy) dengan jari r. */
  function poliLapis(L, cx, cy, r) {
    var B = BANGUN[L.b], p = [], i;
    if (L.b === 'lingkaran') { for (i = 0; i < 72; i++) p.push(Corak.titikArah(cx, cy, r, i * 5)); return p; }
    if (B.k) { for (i = 0; i < B.m; i++) p.push(Corak.titikArah(cx, cy, r * B.k, L.o + i * 360 / B.m)); return p; }
    var t = L.o * Math.PI / 180, cs = Math.cos(t), sn = Math.sin(t);
    return dasarLokal(L.b).map(function (q) { return [cx + r * (q[0] * cs - q[1] * sn), cy + r * (q[0] * sn + q[1] * cs)]; });
  }

  function bagianFig(f, cx, cy, r) {
    var luar = poliLapis(f, cx, cy, r), g = { luar: luar, bagian: Corak.bagi(luar, cx, cy, f.n, f.s), dalam: null, bagianDalam: [] };
    if (f.d) { g.dalam = poliLapis(f.d, cx, cy, r * RASIO_DALAM); g.bagianDalam = Corak.bagi(g.dalam, cx, cy, f.d.n, f.d.s); }
    return g;
  }

  var CORAK_TANDA = { bintang: 1, bulatan: 1 };

  /**
   * Bagian luar beserta garis batasnya (sama dengan Corak.gambar). Bila ada bangun dalam, tanda corak bintang
   * dan bulatan hanya diisikan di seberang garis singgung bangun dalam (tegak lurus arah tengah bagian), supaya
   * tidak ada bintang atau bulatan yang terpotong tepi bangun dalam; latar bagiannya tetap penuh.
   */
  function gambarLuar(f, g, cx, cy, r) {
    var bag = g.bagian.map(function (p, k) { return { poli: p, kode: f.c[k] }; });
    if (!f.d || f.n < 2 || !bag.some(function (b) { return CORAK_TANDA[b.kode]; })) return Corak.gambar(bag, { luar: g.luar });
    var celah = poliLapis(f.d, cx, cy, r * RASIO_DALAM + 2.8), w = 360 / f.n, out = [];
    bag.forEach(function (b, k) {
      if (!CORAK_TANDA[b.kode]) { out.push(Corak.isi(b.poli, b.kode)); return; }
      var m = (f.s + (k + 0.5) * w) * Math.PI / 180, ux = Math.sin(m), uy = -Math.cos(m), h = -Infinity;
      celah.forEach(function (p) { h = Math.max(h, (p[0] - cx) * ux + (p[1] - cy) * uy); });
      out.push(Corak.isi(b.poli, Corak.gelap(b.kode) ? 'hitam' : 'putih'));
      var sisa = Bentuk.potongBidang(b.poli, ux, uy, cx * ux + cy * uy + h + 1.5);
      if (sisa.length >= 3 && Math.abs(Bentuk.luas(sisa)) > 20) out.push(Corak.isi(sisa, b.kode));
    });
    bag.forEach(function (b) { if (Corak.gelap(b.kode) && b.poli.length >= 3) out.push(S.poli(b.poli, { tutup: true, isi: 'none', garis: '#ffffff', tebal: 1.44, sambung: 'round' })); });
    bag.forEach(function (b) { if (!Corak.gelap(b.kode) && b.poli.length >= 3) out.push(S.poli(b.poli, { tutup: true, isi: 'none', garis: TINTA, tebal: 1.6, sambung: 'round' })); });
    out.push(S.poli(g.luar, { tutup: true, isi: 'none', garis: TINTA, tebal: 2.2, sambung: 'round' }));
    return out.join('');
  }

  /**
   * Bangun bercorak utuh. o (gambar pembahasan): sorotLuar/sorotDalam (indeks bagian bergaris jingga),
   * garisLuar/garisDalam (garis tepi jingga), cincin (lingkaran jingga di pusat).
   */
  function gambarFig(f, cx, cy, r, o) {
    o = o || {};
    var g = bagianFig(f, cx, cy, r), out = [], jingga = { tutup: true, isi: 'none', garis: BH.sorot, tebal: 3, sambung: 'round' };
    out.push(gambarLuar(f, g, cx, cy, r));
    (o.sorotLuar || []).forEach(function (k) { out.push(S.poli(g.bagian[k], jingga)); });
    if (o.garisLuar) out.push(S.poli(g.luar, Object.assign({}, jingga, { tebal: 3.4 })));
    if (f.d) {
      // celah putih di sekeliling bangun dalam supaya tetap terpisah dari bagian luar yang gelap
      out.push(S.poli(poliLapis(f.d, cx, cy, r * RASIO_DALAM + 2.8), { tutup: true, isi: '#ffffff', garis: 'none' }));
      out.push(Corak.gambar(g.bagianDalam.map(function (p, k) { return { poli: p, kode: f.d.c[k] }; }), { luar: g.dalam, tebalLuar: 2, skala: SKALA_DALAM }));
      (o.sorotDalam || []).forEach(function (k) { out.push(S.poli(g.bagianDalam[k], jingga)); });
      if (o.garisDalam) out.push(S.poli(g.dalam, Object.assign({}, jingga, { tebal: 3.2 })));
    }
    if (f.p) out.push(S.lingkaran(cx, cy, 6, { isi: '#ffffff', garis: TINTA, tebal: 2.2 }));
    if (o.cincin) out.push(S.lingkaran(cx, cy, 11.5, { isi: 'none', garis: BH.sorot, tebal: 3 }));
    return out.join('');
  }

  var U_SOAL = 110, R_SOAL = 38, PAD = 8, CELAH_PANAH = 40, CELAH_SAMA = 44;

  /** Gambar soal: kotak 1 -> kotak 2 = kotak 3 -> ? */
  function svgSoal(m) {
    var U = U_SOAL, y = PAD, cy = y + U / 2, x = [PAD, PAD + U + CELAH_PANAH];
    x.push(x[1] + U + CELAH_SAMA); x.push(x[2] + U + CELAH_PANAH);
    var W = x[3] + U + PAD, H = y + U + 22 + PAD, o = [];
    for (var i = 0; i < 4; i++) {
      o.push(S.rect(x[i], y, U, U, { rx: 4, isi: i === 3 ? '#f4f6fb' : '#ffffff', garis: TEPI, tebal: 2 }));
      if (i < 3) o.push(gambarFig(m.kotak[i], x[i] + U / 2, cy, R_SOAL));
      else o.push(S.teks('?', x[i] + U / 2, cy + 14, { ukuran: 40, tebal: true, isi: TEPI, rata: 'middle' }));
      o.push(S.teks(i < 3 ? 'kotak ' + (i + 1) : '', x[i] + U / 2, y + U + 16, { ukuran: 11, isi: TEPI, rata: 'middle' }));
    }
    [0, 2].forEach(function (i) { o.push(S.panah(x[i] + U + 7, cy, x[i + 1] - 7, cy, { warna: TEPI, tebal: 2.2, kepala: 10 })); });
    o.push(S.teks('=', x[1] + U + CELAH_SAMA / 2, cy + 10, { ukuran: 30, tebal: true, isi: TEPI, rata: 'middle' }));
    return { svg: S.doc(o.join(''), W, H, { latar: '#ffffff' }), lebar: W, tinggi: H };
  }

  function svgOpsi(m) {
    var U = 128, P = 4, W = U + 2 * P;
    var o = S.rect(P, P, U, U, { rx: 4, isi: '#ffffff', garis: TEPI, tebal: 1.6 }) + gambarFig(m.fig, W / 2, W / 2, 42);
    return { svg: S.doc(o, W, W, { latar: '#ffffff' }), lebar: W, tinggi: W };
  }

  // ------------------------------------------------------------ gambar pembahasan

  function teksB(s, x, y, o) {
    o = o || {};
    return S.teks(s, x, y, { ukuran: o.ukuran || 11, tebal: o.tebal, isi: o.isi || BH.teks, rata: o.rata });
  }

  var PANAH1 = { panah: '->' }, PANAH2 = { panah: '<->' };

  function teksPutarPendek(th) {
    var d = th <= 180 ? th : 360 - th;
    return th === 180 ? ['putar 180°'] : th < 180 ? ['putar ' + d + '°', 'searah jarum jam'] : ['putar ' + d + '°', 'berlawanan arah', 'jarum jam'];
  }

  /** Baris keterangan sebuah langkah (tiap baris: daftar potongan teks atau tanda panah). */
  function labelLangkah(t, sebelum) {
    switch (t.jenis) {
      case 'putar': return teksPutarPendek(t.th).map(function (s) { return [s]; });
      case 'cermin': return [['cermin terhadap'], [LABEL_SUMBU[t.psi]]];
      case 'tukar': return [[PENDEK[t.x], PANAH2, PENDEK[t.y]], ['bertukar']];
      case 'ganti': return [[PENDEK[t.x], PANAH1, PENDEK[t.y]]];
      case 'balik': return [['terang-gelap dibalik'], ['hitam', PANAH2, 'putih'], ['titik', PANAH2, 'bulatan']];
      case 'geser': return t.k > 0 ? [['geser 1 bagian'], ['searah jarum jam']] : [['geser 1 bagian'], ['berlawanan arah'], ['jarum jam']];
      case 'bangun': return [['bangun luar'], [namaPendek(sebelum), PANAH1, namaPendek(t.ke)]];
      case 'dalam-luar': return [['dalam', PANAH2, 'luar'], ['bertukar corak']];
      case 'penanda': return [[sebelum.p ? 'hapus' : 'tambah'], ['penanda pusat']];
      default: return [[t.jenis]];
    }
  }

  function namaPendek(L) { return L.b === 'persegi' && L.o === 0 ? 'belah ketupat' : BANGUN[L.b].nama; }

  function lebarBaris(baris) {
    var w = 0;
    baris.forEach(function (s, i) { w += (typeof s === 'string' ? Metrik.lebar(s, 11, false) : 18) + (i ? 5 : 0); });
    return w;
  }

  function gambarBaris(baris, cx, y, warna) {
    var x = cx - lebarBaris(baris) / 2, o = [];
    baris.forEach(function (s, i) {
      if (i) x += 5;
      if (typeof s === 'string') { o.push(S.teks(s, x, y, { ukuran: 11, isi: warna })); x += Metrik.lebar(s, 11, false); return; }
      var yy = y - 4;
      if (s.panah === '->') o.push(S.panah(x, yy, x + 18, yy, { warna: warna, tebal: 1.6, kepala: 6 }));
      else { o.push(S.panah(x + 9, yy, x, yy, { warna: warna, tebal: 1.6, kepala: 6 })); o.push(S.panah(x + 9, yy, x + 18, yy, { warna: warna, tebal: 1.6, kepala: 6 })); }
      x += 18;
    });
    return o.join('');
  }

  /** Indeks bagian (luar dan dalam) yang coraknya berubah dari a ke b (struktur sama). */
  function bagianBerubah(a, b) {
    var o = { sorotLuar: [], sorotDalam: [] };
    if (a.n !== b.n || a.s !== b.s) return o;
    a.c.forEach(function (k, i) { if (b.c[i] !== k) o.sorotLuar.push(i); });
    if (a.d && b.d && a.d.n === b.d.n) a.d.c.forEach(function (k, i) { if (b.d.c[i] !== k) o.sorotDalam.push(i); });
    return o;
  }

  /**
   * Gambar pembahasan: deretan kotak (awal, tahap, akhir) dengan panah langkah dan penandanya.
   * model: { kotak: [fig...], langkah: [langkah...], label: [teks tiap kotak], jawaban? (= kotak terakhir) }
   */
  function svgLangkah(m, judul) {
    var U = 104, R = 36, pad = 10, nb = m.kotak.length, jawab = m.jawaban !== undefined;
    var label = m.langkah.map(function (t, j) { return labelLangkah(t, m.kotak[j]); });
    var lebarLabel = 0;
    label.forEach(function (ls) { ls.forEach(function (b) { lebarLabel = Math.max(lebarLabel, lebarBaris(b)); }); });
    var G = Math.max(92, Math.ceil(lebarLabel) + 16), lebarIsi = nb * U + (nb - 1) * G;
    var W = Math.max(pad * 2 + lebarIsi, Math.ceil(Metrik.lebar(judul, 13, true)) + 2 * pad);
    var x0 = (W - lebarIsi) / 2, y0 = pad + 26 + 18, cy = y0 + U / 2, H = y0 + U + pad + 4;
    var o = [teksB(judul, pad, pad + 13, { ukuran: 13, tebal: true })];
    var opsiGambar = m.kotak.map(function () { return {}; }), atas = m.kotak.map(function () { return []; });
    function xk(i) { return x0 + i * (U + G); }
    m.langkah.forEach(function (t, j) {
      var a = m.kotak[j], b = m.kotak[j + 1], cxa = xk(j) + U / 2, cxb = xk(j + 1) + U / 2;
      if (t.jenis === 'putar') {
        var sudut = t.th <= 180 ? t.th : t.th - 360, a0 = -sudut / 2;
        atas[j].push(S.busurPanah(cxa, cy, U / 2 - 6, a0, a0 + sudut, { warna: BH.panah, tebal: 2.4, kepala: 9, halo: true }));
      } else if (t.jenis === 'cermin') {
        var rad = t.psi * Math.PI / 180, dx = Math.cos(rad), dy = -Math.sin(rad), Lg = U / 2 - 5;
        [cxa, cxb].forEach(function (cx, q) {
          atas[j + q].push(S.garis(cx - dx * Lg, cy - dy * Lg, cx + dx * Lg, cy + dy * Lg, { garis: '#ffffff', tebal: 4.6, ujung: 'round' }));
          atas[j + q].push(S.garis(cx - dx * Lg, cy - dy * Lg, cx + dx * Lg, cy + dy * Lg, { garis: BH.acuan, tebal: 2.2, putus: '6 4' }));
        });
      } else if (t.jenis === 'geser') {
        var w = 360 / a.n, rr = R * 0.72;
        for (var i = 0; i < a.n; i++) {
          var mid = a.s + (i + 0.5) * w, h = 0.36 * w * t.k;
          atas[j].push(S.busurPanah(cxa, cy, rr, mid - h, mid + h, { warna: BH.panah, tebal: 1.8, kepala: 6, halo: true }));
        }
      } else if (t.jenis === 'tukar' || t.jenis === 'ganti' || t.jenis === 'balik') {
        Object.assign(opsiGambar[j + 1], bagianBerubah(a, b));
      } else if (t.jenis === 'bangun') {
        opsiGambar[j + 1].garisLuar = true;
      } else if (t.jenis === 'dalam-luar') {
        opsiGambar[j + 1].garisLuar = true; opsiGambar[j + 1].garisDalam = true;
      } else if (t.jenis === 'penanda') {
        opsiGambar[a.p ? j : j + 1].cincin = true;
      }
      // panah langkah dan keterangannya
      var gx0 = xk(j) + U + 6, gx1 = xk(j + 1) - 6, gm = (gx0 + gx1) / 2;
      o.push(teksB('langkah ' + (j + 1), gm, cy - 12, { ukuran: 10, rata: 'middle', isi: BH.teksRedup }));
      o.push(S.panah(gx0, cy, gx1, cy, { warna: BH.panah, tebal: 2.4, kepala: 10 }));
      label[j].forEach(function (baris, q) { o.push(gambarBaris(baris, gm, cy + 18 + q * 14, BH.teks)); });
    });
    m.kotak.forEach(function (f, i) {
      var x = xk(i), akhir = jawab && i === nb - 1;
      o.push(teksB(m.label[i], x + U / 2, y0 - 6, { ukuran: 11, tebal: true, rata: 'middle', isi: akhir ? BH.jawab : BH.teks }));
      o.push(S.rect(x, y0, U, U, { rx: 5, isi: akhir ? BH.latarJawab : '#ffffff', garis: akhir ? BH.jawab : TEPI, tebal: akhir ? 2.6 : 1.8 }));
      o.push(gambarFig(f, x + U / 2, cy, R, opsiGambar[i]));
      o.push(atas[i].join(''));
    });
    return { svg: S.doc(o.join(''), W, H, { latar: '#ffffff' }), lebar: W, tinggi: H };
  }

  // ================================================================ uraian kata

  function namaArah(a) {
    a = normSudut(a, 360);
    if (Math.abs(a / 45 - Math.round(a / 45)) < 1e-6) return ARAH8[Math.round(a / 45) % 8];
    var j = Math.round(a / 30) % 12;
    return 'arah jam ' + (j === 0 ? 12 : j);
  }

  function namaBangun(L) {
    var B = BANGUN[L.b];
    if (L.b === 'persegi') return L.o === 0 ? 'belah ketupat' : 'persegi';
    if (L.b === 'segitiga') {
      for (var i = 0; i < 3; i++) { var a = normSudut(L.o + 120 * i, 360); if (a % 45 === 0) return 'segitiga dengan satu sudut menghadap ke ' + ARAH8[a / 45]; }
      return 'segitiga';
    }
    if (L.b === 'kubah') return 'kubah dengan sisi lengkung di ' + namaArah(L.o);
    if (L.b === 'perisai') return 'perisai dengan ujung lancip di ' + namaArah(L.o);
    if (L.b === 'lensa') return 'bangun lensa ' + (L.o === 0 ? 'tegak' : L.o === 90 ? 'mendatar' : 'miring');
    return B.nama;
  }

  function daftarBagian(L) {
    var w = 360 / L.n, mid = L.c.map(function (k, i) { return { a: normSudut(L.s + (i + 0.5) * w, 360), k: k }; });
    mid.sort(function (x, y) { return x.a - y.a; });
    var semua45 = mid.every(function (x) { return x.a % 45 === 0; });
    var bagian = mid.map(function (x) {
      var arah = semua45 ? ARAH8[x.a / 45] : namaArah(x.a % 45 === 0 ? x.a + 0.5 : x.a);
      return arah + ' ' + Corak.nama(x.k);
    });
    if (bagian.length === 2) return bagian[0] + ' dan ' + bagian[1];
    return bagian.length > 1 ? bagian.slice(0, -1).join(', ') + ', dan ' + bagian[bagian.length - 1] : bagian[0];
  }

  function uraiLapis(L) {
    return L.n === 1 ? Corak.nama(L.c[0]) : 'terbagi ' + L.n + ' bagian (' + daftarBagian(L) + ')';
  }

  function urai(f) {
    var s = namaBangun(f) + (f.n === 1 ? ' ' : ' yang ') + uraiLapis(f);
    if (f.d) s += ', dengan ' + namaBangun(f.d).replace(/^(\S+)/, '$1 kecil') + ' di dalamnya yang ' + uraiLapis(f.d);
    if (f.p) s += ', serta lingkaran kecil penanda di titik pusatnya';
    return s;
  }

  function teksPutar(th) {
    return { 45: '45° searah jarum jam', 90: '90° searah jarum jam', 135: '135° searah jarum jam', 180: '180°', 225: '135° berlawanan arah jarum jam', 270: '90° berlawanan arah jarum jam', 315: '45° berlawanan arah jarum jam' }[md(th, 360)];
  }

  function frase(t, f) {
    switch (t.jenis) {
      case 'putar': return 'gambar diputar ' + teksPutar(t.th);
      case 'cermin': return 'gambar dicerminkan terhadap ' + NAMA_SUMBU[t.psi];
      case 'tukar': return 'corak ' + Corak.nama(t.x) + ' dan corak ' + Corak.nama(t.y) + ' saling bertukar';
      case 'ganti': return 'setiap bagian ' + Corak.nama(t.x) + ' berubah menjadi ' + Corak.nama(t.y) + ', sedangkan corak lain tetap';
      case 'balik': return 'terang dan gelapnya dibalik (hitam menjadi putih, putih menjadi hitam, bertitik-titik menjadi hitam berbulatan putih, dan sebaliknya), sedangkan corak bergaris dan berkotak-kotak tetap';
      case 'geser': return 'bangunnya tidak berputar, tetapi setiap corak bergeser satu bagian ' + (t.k > 0 ? 'searah' : 'berlawanan arah') + ' jarum jam sehingga arah garis arsirnya tetap';
      case 'bangun': return 'bangun luarnya berganti dari ' + namaBangun({ b: t.dari, o: t.dariO }) + ' menjadi ' + namaBangun(t.ke) + ', sedangkan pembagian dan corak tiap bagian tetap';
      case 'dalam-luar': return 'corak bangun dalam dan corak bangun luar saling bertukar tempat';
      case 'penanda': return f && f.p ? 'lingkaran kecil penanda di titik pusat dihapus' : 'lingkaran kecil penanda ditambahkan di titik pusat';
      default: return t.jenis;
    }
  }

  /** Catatan perubahan arah corak berarah oleh putar/cermin pada bangun f. */
  function catatanArah(t, f) {
    if (t.jenis !== 'putar' && t.jenis !== 'cermin') return '';
    var kode = unik(f.c.concat(f.d ? f.d.c : [])), ubah = [];
    kode.forEach(function (k) {
      var k2 = t.jenis === 'putar' ? Corak.putarKode(k, t.th) : Corak.cerminKode(k, t.psi);
      if (k2 !== k) ubah.push('bagian ' + Corak.nama(k) + ' menjadi ' + Corak.nama(k2));
    });
    if (!ubah.length) return '';
    return ' Arah corak ikut ' + (t.jenis === 'putar' ? 'berputar' : 'dicerminkan') + ': ' + ubah.join(', ') + '.';
  }

  function penjelasanPenanda(langkah) {
    var o = [];
    langkah.forEach(function (t) {
      var s = { putar: 'busur biru menunjukkan arah putaran', cermin: 'garis merah putus-putus adalah garis cerminnya', geser: 'panah biru kecil menunjukkan perpindahan corak ke bagian sebelahnya',
        tukar: 'bagian yang coraknya berubah diberi garis tepi jingga', ganti: 'bagian yang coraknya berubah diberi garis tepi jingga', balik: 'bagian yang coraknya berubah diberi garis tepi jingga',
        bangun: 'bangun luar yang berganti diberi garis tepi jingga', 'dalam-luar': 'bangun dalam dan bangun luar yang bertukar corak diberi garis tepi jingga', penanda: 'lingkaran jingga menandai penanda di titik pusat' }[t.jenis];
      if (o.indexOf(s) < 0) o.push(s);
    });
    return o.join('; ');
  }

  // ================================================================ penyusunan bangun acak

  /**
   * Bangun acak menurut syarat q:
   *   bentuk (daftar bangun luar), luar {b,o} tetap, nBoleh, dalam ('tidak'|'boleh'|'wajib'|'sama'),
   *   wajib (kode yang harus ada), salahSatu (daftar kelompok kode, tiap kelompok minimal satu),
   *   ubah (daftar uji kode: minimal satu kode lolos tiap uji), kolam (kode yang boleh), maksArah, p.
   */
  function acakFig(a, q) {
    for (var coba = 0; coba < 30; coba++) {
      var b = q.luar ? q.luar.b : a.pilih(q.bentuk || SEMUA_BANGUN);
      var o = q.luar ? q.luar.o : a.pilih(ARAH_BANGUN[b]);
      var dalam = q.dalam || 'boleh';
      var pakaiDalam = dalam === 'wajib' || dalam === 'sama' || (dalam === 'boleh' && a.untung(0.28));
      if (pakaiDalam && !BISA_DALAM[b]) { if (dalam === 'boleh') pakaiDalam = false; else continue; }
      var nn = Object.keys(BAGI[b]).map(Number).filter(function (n) {
        if (q.nBoleh && q.nBoleh.indexOf(n) < 0) return false;
        if (n === 1 && (!pakaiDalam || dalam === 'sama')) return false;
        if (pakaiDalam && n > 6) return false;
        return true;
      });
      if (!nn.length) continue;
      var nnBesar = nn.filter(function (n) { return n >= (q.nMin || 1) || (pakaiDalam && n > 1); });
      if (nnBesar.length) nn = nnBesar;
      var n = a.pilih(nn), s = n === 1 ? 0 : o + a.pilih(BAGI[b][n]), d = null;
      if (pakaiDalam) {
        var dn = dalam === 'sama' ? n : (n > 1 && n <= 4 && a.untung(0.35) ? n : 1), db = a.pilih(dn > 1 ? BANGUN_DALAM.slice(0, 3) : BANGUN_DALAM);
        d = { b: db, o: a.pilih(ARAH_BANGUN[db]), n: dn, s: dn === 1 ? 0 : s, c: [] };
      }
      var kode = isiKode(a, q, n, d ? d.n : 0);
      if (!kode) continue;
      if (d) d.c = kode.slice(n);
      return kanon({ b: b, o: o, n: n, s: s, c: kode.slice(0, n), d: d, p: q.p ? 1 : 0 });
    }
    return null;
  }

  function isiKode(a, q, n, nd) {
    var slot = n + nd, kolam = q.kolam || KODE, maksArah = q.maksArah == null ? 2 : q.maksArah, wajib = (q.wajib || []).slice(), i;
    (q.salahSatu || []).forEach(function (g) { if (!g.some(function (x) { return wajib.indexOf(x) >= 0; })) wajib.push(a.pilih(g)); });
    for (i = 0; i < (q.ubah || []).length; i++) {
      var u = q.ubah[i];
      if (wajib.some(u)) continue;
      var cal = kolam.filter(u);
      if (!cal.length) return null;
      wajib.push(a.pilih(cal));
    }
    if (wajib.length > slot || wajib.filter(berarah).length > Math.max(maksArah, 1)) return null;
    var kode = new Array(slot), urut = a.kocok(deret(slot));
    wajib.forEach(function (x, j) { kode[urut[j]] = x; });
    for (i = wajib.length; i < slot; i++) {
      var pos = urut[i], dipakai = kode.filter(Boolean), nArah = dipakai.filter(berarah).length;
      var boleh = kolam.filter(function (x) { return !berarah(x) || nArah < maksArah; });
      var tetangga = pos < n ? [kode[md(pos - 1, n)], kode[md(pos + 1, n)]] : [];
      var baru = boleh.filter(function (x) { return dipakai.indexOf(x) < 0; });
      var pilihan = baru.length ? baru : boleh.filter(function (x) { return tetangga.indexOf(x) < 0; });
      if (!pilihan.length) pilihan = boleh;
      if (!pilihan.length) return null;
      kode[pos] = a.pilih(pilihan);
    }
    return kode;
  }

  // ================================================================ rencana per mekanisme

  var MEKANISME = {
    mudah: ['putar', 'cermin', 'tukar', 'ganti', 'bangun', 'penanda', 'dalam-luar'],
    sedang: ['putar-arsir', 'cermin-arsir', 'balik', 'geser', 'putar+penanda', 'cermin+tukar', 'bangun+ganti', 'dalam-luar+penanda'],
    sulit: ['putar-arsir+tukar', 'cermin-arsir+ganti', 'geser+tukar', 'putar45+ganti', 'putar-arsir+balik', 'cermin-arsir+bangun', 'geser+balik', 'putar-arsir+dalam-luar', 'geser+bangun']
  };
  var RESEP = {
    putar: [['putar', {}]], cermin: [['cermin', {}]], tukar: [['tukar', {}]], ganti: [['ganti', {}]], bangun: [['bangun', {}]], penanda: [['penanda', {}]], 'dalam-luar': [['dalam-luar', {}]],
    'putar-arsir': [['putar', { arsir: 1 }]], 'cermin-arsir': [['cermin', { arsir: 1, diagonal: 0.5 }]], balik: [['balik', {}]], geser: [['geser', {}]],
    'putar+penanda': [['putar', {}], ['penanda', {}]], 'cermin+tukar': [['cermin', {}], ['tukar', {}]], 'bangun+ganti': [['bangun', {}], ['ganti', {}]],
    'dalam-luar+penanda': [['dalam-luar', {}], ['penanda', {}]],
    'putar-arsir+tukar': [['putar', { arsir: 1 }], ['tukar', {}]], 'cermin-arsir+ganti': [['cermin', { arsir: 1, diagonal: 0.5 }], ['ganti', {}]],
    'geser+tukar': [['geser', {}], ['tukar', {}]], 'putar45+ganti': [['putar', { arsir: 1, sudut45: 1 }], ['ganti', {}]],
    'putar-arsir+balik': [['putar', { arsir: 1 }], ['balik', {}]], 'cermin-arsir+bangun': [['cermin', { arsir: 1, diagonal: 0.4 }], ['bangun', {}]],
    'geser+balik': [['geser', {}], ['balik', {}]], 'putar-arsir+dalam-luar': [['putar', { arsir: 1, sudut45: 0.3 }], ['dalam-luar', {}]],
    'geser+bangun': [['geser', {}], ['bangun', {}]]
  };

  function irisan(x, y) { return x && y ? x.filter(function (v) { return y.indexOf(v) >= 0; }) : x || y; }

  function komponen(nama, opt, a) {
    var r1 = {}, r3 = {}, t, u, xy;
    switch (nama) {
      case 'putar':
        var th = opt.sudut45 && a.untung(opt.sudut45) ? a.pilih([45, 135, 225, 315]) : opt.arsir ? a.pilih([90, 270]) : a.pilih([90, 180, 270]);
        t = { jenis: 'putar', th: th };
        if (opt.arsir) { u = function (x) { return Corak.putarKode(x, th) !== x; }; r1.ubah = [u]; r3.ubah = [u]; }
        break;
      case 'cermin':
        var psi = opt.arsir && a.untung(opt.diagonal || 0) ? a.pilih([45, 135]) : a.pilih([90, 0]);
        t = { jenis: 'cermin', psi: psi };
        if (opt.arsir) { u = function (x) { return Corak.cerminKode(x, psi) !== x; }; r1.ubah = [u]; r3.ubah = [u]; }
        break;
      case 'tukar':
        xy = a.ambil(TAK_BERARAH, 2);
        t = { jenis: 'tukar', x: xy[0], y: xy[1] };
        r1.wajib = xy.slice(); r3.salahSatu = [xy.slice()]; r1.nMin = r3.nMin = 3;
        if (a.untung(0.5)) r3.wajib = xy.slice();
        break;
      case 'ganti':
        xy = a.untung(0.3) ? ['titik', 'hitam'] : a.ambil(TAK_BERARAH, 2);
        t = { jenis: 'ganti', x: xy[0], y: xy[1] };
        r1.wajib = xy.slice(); r3.wajib = [xy[0]]; r1.nMin = r3.nMin = 3;
        break;
      case 'balik':
        t = { jenis: 'balik' };
        r1.kolam = r3.kolam = ['hitam', 'putih', 'titik', 'bulatan'].concat(BERARAH);
        r1.salahSatu = [['hitam', 'putih'], ['titik', 'bulatan']]; r3.salahSatu = [['hitam', 'putih', 'titik', 'bulatan']];
        r1.maksArah = r3.maksArah = 1; r1.nMin = 3;
        break;
      case 'geser':
        t = { jenis: 'geser', k: a.pilih([1, -1]) };
        r1.nBoleh = r3.nBoleh = [3, 4, 5, 6, 8];
        r1.bentuk = r3.bentuk = ['lingkaran', 'lingkaran', 'persegi', 'segienam', 'segidelapan', 'segitiga'];
        r1.salahSatu = [ARSIR]; r3.salahSatu = [ARSIR];
        break;
      case 'bangun':
        var asal = a.pilih(['lingkaran', 'lingkaran', 'persegi', 'segienam', 'segitiga', 'segidelapan', 'kubah', 'perisai']);
        var tuju = a.pilih(['lingkaran', 'persegi', 'persegi', 'segienam', 'segitiga', 'segidelapan'].filter(function (x) { return x !== asal; }));
        var luar = { b: asal, o: a.pilih(ARAH_BANGUN[asal]) }, ke = { b: tuju, o: a.pilih(ARAH_BANGUN[tuju]) };
        t = { jenis: 'bangun', dari: asal, dariO: luar.o, ke: ke };
        r1.luar = r3.luar = luar;
        r1.nBoleh = r3.nBoleh = Object.keys(BAGI[asal]).map(Number).filter(function (n) { return BAGI[tuju][n] && n > 1; });
        if (!BISA_DALAM[asal] || !BISA_DALAM[tuju]) r1.dalam = r3.dalam = 'tidak';
        break;
      case 'dalam-luar':
        t = { jenis: 'dalam-luar' };
        r1.dalam = r3.dalam = 'sama';
        r1.bentuk = r3.bentuk = ['lingkaran', 'lingkaran', 'segienam', 'segidelapan', 'persegi'];
        r1.nBoleh = r3.nBoleh = [2, 3, 4];
        break;
      case 'penanda':
        var p = a.untung(0.65) ? 0 : 1;
        t = { jenis: 'penanda', tambah: !p };
        r1.p = r3.p = p;
        break;
    }
    return { t: t, r1: r1, r3: r3 };
  }

  function gabungSyarat(rs) {
    var q = {};
    rs.forEach(function (r) {
      ['wajib', 'salahSatu', 'ubah'].forEach(function (k) { if (r[k]) q[k] = (q[k] || []).concat(r[k]); });
      ['kolam', 'nBoleh', 'bentuk'].forEach(function (k) { if (r[k]) q[k] = irisan(q[k], r[k]); });
      if (r.dalam) q.dalam = q.dalam === 'sama' || r.dalam === 'sama' ? 'sama' : r.dalam;
      if (r.luar) q.luar = r.luar;
      if (r.p != null) q.p = r.p;
      if (r.maksArah != null) q.maksArah = Math.min(q.maksArah == null ? 9 : q.maksArah, r.maksArah);
      if (r.nMin) q.nMin = Math.max(q.nMin || 1, r.nMin);
    });
    if (q.wajib) q.wajib = unik(q.wajib);
    return q;
  }

  function rencana(mek, a) {
    var komp = RESEP[mek].map(function (k) { return komponen(k[0], k[1], a); });
    return { langkah: komp.map(function (k) { return k.t; }), q1: gabungSyarat(komp.map(function (k) { return k.r1; })), q3: gabungSyarat(komp.map(function (k) { return k.r3; })) };
  }

  /** Kotak 3 harus berbeda bentuk atau susunan dari kotak 1. */
  function bedaSusunan(k1, k3, luarTetap) {
    if (kunciFig(k1) === kunciFig(k3)) return false;
    if (luarTetap) return k1.n !== k3.n || k1.s !== k3.s || !k1.d !== !k3.d || (k1.d && k3.d && k1.d.b !== k3.d.b);
    return k1.b !== k3.b || k1.n !== k3.n || !k1.d !== !k3.d;
  }

  // ================================================================ pengecoh

  function teksSumbu(psi) { return NAMA_SUMBU[md(psi, 180)]; }

  function varian(t, k3) {
    var o = [], kode3 = unik(k3.c.concat(k3.d ? k3.d.c : []));
    function v(jenis, langkah, alasan) { o.push({ jenis: jenis, t: langkah, alasan: alasan }); }
    switch (t.jenis) {
      case 'putar':
        if (t.th !== 180) v('arah-balik', { jenis: 'putar', th: 360 - t.th }, 'Arah putarannya terbalik: gambar diputar ' + teksPutar(360 - t.th) + ', padahal kotak 1 ke kotak 2 diputar ' + teksPutar(t.th) + '.');
        v('arsir-tetap', { jenis: 'putar', th: t.th, tanpaArah: true }, 'Letak bagian-bagiannya sudah diputar ' + teksPutar(t.th) + ', tetapi arah garis arsir atau kotak-kotaknya tidak ikut berputar.');
        var th2 = t.th % 90 ? md(t.th + 90, 360) : t.th === 180 ? 90 : 180;
        v('sudut-salah', { jenis: 'putar', th: th2 }, 'Sudut putarnya salah: gambar diputar ' + teksPutar(th2) + ', padahal seharusnya ' + teksPutar(t.th) + '.');
        v('dikira-cermin', { jenis: 'cermin', psi: 90 }, 'Gambar dicerminkan terhadap garis tegak, padahal kotak 1 ke kotak 2 diputar ' + teksPutar(t.th) + '.');
        break;
      case 'cermin':
        var p2 = md(t.psi + 90, 180), p3 = md(t.psi + 45, 180);
        v('sumbu-salah', { jenis: 'cermin', psi: p2 }, 'Sumbu cerminnya salah: gambar dicerminkan terhadap ' + teksSumbu(p2) + ', padahal seharusnya terhadap ' + teksSumbu(t.psi) + '.');
        v('arsir-tetap', { jenis: 'cermin', psi: t.psi, tanpaArah: true }, 'Letak bagian-bagiannya sudah dicerminkan, tetapi arah garis arsirnya tidak ikut dicerminkan.');
        v('sumbu-miring', { jenis: 'cermin', psi: p3 }, 'Sumbu cerminnya salah: gambar dicerminkan terhadap ' + teksSumbu(p3) + ', padahal seharusnya terhadap ' + teksSumbu(t.psi) + '.');
        v('dikira-putar', { jenis: 'putar', th: 180 }, 'Gambar diputar 180°, padahal kotak 1 ke kotak 2 dicerminkan terhadap ' + teksSumbu(t.psi) + '.');
        break;
      case 'tukar':
        v('satu-arah', { jenis: 'ganti', x: t.x, y: t.y }, 'Hanya corak ' + Corak.nama(t.x) + ' yang berubah menjadi ' + Corak.nama(t.y) + '; corak ' + Corak.nama(t.y) + ' seharusnya juga berubah menjadi ' + Corak.nama(t.x) + '.');
        v('satu-arah-2', { jenis: 'ganti', x: t.y, y: t.x }, 'Hanya corak ' + Corak.nama(t.y) + ' yang berubah menjadi ' + Corak.nama(t.x) + '; corak ' + Corak.nama(t.x) + ' seharusnya juga berubah menjadi ' + Corak.nama(t.y) + '.');
        kode3.filter(function (z) { return z !== t.x && z !== t.y; }).slice(0, 2).forEach(function (z, i) {
          var pas = i ? t.y : t.x;
          v('pasangan-salah', { jenis: 'tukar', x: pas, y: z }, 'Pasangan corak yang ditukar salah: corak ' + Corak.nama(pas) + ' ditukar dengan ' + Corak.nama(z) + ', padahal seharusnya ' + Corak.nama(t.x) + ' ditukar dengan ' + Corak.nama(t.y) + '.');
        });
        break;
      case 'ganti':
        v('ganti-terbalik', { jenis: 'ganti', x: t.y, y: t.x }, 'Arah penggantiannya terbalik: corak ' + Corak.nama(t.y) + ' diganti menjadi ' + Corak.nama(t.x) + ', padahal yang berubah adalah ' + Corak.nama(t.x) + ' menjadi ' + Corak.nama(t.y) + '.');
        v('dikira-tukar', { jenis: 'tukar', x: t.x, y: t.y }, 'Corak ' + Corak.nama(t.y) + ' ikut berubah menjadi ' + Corak.nama(t.x) + ', padahal pada kotak 1 ke kotak 2 corak ' + Corak.nama(t.y) + ' tetap.');
        var lain = TAK_BERARAH.filter(function (z) { return z !== t.x && z !== t.y; });
        var z1 = lain.filter(function (z) { return kode3.indexOf(z) < 0; })[0] || lain[0];
        v('tujuan-salah', { jenis: 'ganti', x: t.x, y: z1 }, 'Corak ' + Corak.nama(t.x) + ' diganti menjadi ' + Corak.nama(z1) + ', padahal seharusnya menjadi ' + Corak.nama(t.y) + '.');
        kode3.filter(function (z) { return z !== t.x && z !== t.y; }).slice(0, 1).forEach(function (z) {
          v('asal-salah', { jenis: 'ganti', x: z, y: t.y }, 'Yang diganti menjadi ' + Corak.nama(t.y) + ' justru corak ' + Corak.nama(z) + ', padahal seharusnya corak ' + Corak.nama(t.x) + '.');
        });
        break;
      case 'balik':
        v('balik-sebagian', { jenis: 'tukar', x: 'hitam', y: 'putih' }, 'Hanya hitam dan putih yang dibalik; corak bertitik-titik dan berbulatan seharusnya juga dibalik.');
        v('balik-sebagian-2', { jenis: 'tukar', x: 'titik', y: 'bulatan' }, 'Hanya corak bertitik-titik dan berbulatan yang dibalik; hitam dan putih seharusnya juga dibalik.');
        v('balik-silang', { jenis: 'tukar', x: 'hitam', y: 'titik' }, 'Pasangan terang-gelapnya salah: hitam ditukar dengan bertitik-titik, padahal hitam berpasangan dengan putih.');
        break;
      case 'geser':
        v('geser-balik', { jenis: 'geser', k: -t.k }, 'Arah pergeserannya terbalik: corak bergeser ' + (t.k > 0 ? 'berlawanan arah' : 'searah') + ' jarum jam.');
        var w = 360 / k3.n;
        if (w % 45 === 0) v('ikut-putar', { jenis: 'putar', th: md(w * t.k, 360) }, 'Bangunnya ikut diputar sehingga arah garis arsirnya ikut berubah, padahal hanya coraknya yang bergeser.');
        v('geser-dua', { jenis: 'geser', k: 2 * t.k }, 'Corak bergeser dua bagian, padahal seharusnya satu bagian.');
        break;
      case 'bangun':
        ['persegi', 'lingkaran', 'segienam', 'segitiga', 'segidelapan'].forEach(function (b2) {
          if (b2 === t.ke.b || b2 === t.dari) return;
          var ke2 = { b: b2, o: ARAH_BANGUN[b2][0] };
          v('bangun-salah', { jenis: 'bangun', dari: t.dari, dariO: t.dariO, ke: ke2 }, 'Bangun luarnya berganti menjadi ' + namaBangun(ke2) + ', padahal seharusnya menjadi ' + namaBangun(t.ke) + '.');
        });
        if (t.ke.b === 'persegi') {
          var ke3 = { b: 'persegi', o: t.ke.o === 0 ? 45 : 0 };
          v('bangun-letak', { jenis: 'bangun', dari: t.dari, dariO: t.dariO, ke: ke3 }, 'Bangun luarnya menjadi ' + namaBangun(ke3) + ', padahal seharusnya ' + namaBangun(t.ke) + '.');
        }
        break;
      case 'dalam-luar':
        v('salin-dalam', { jenis: 'salin-dalam' }, 'Hanya bangun dalam yang mengambil corak bangun luar; corak bangun dalam seharusnya juga pindah ke bangun luar.');
        v('salin-luar', { jenis: 'salin-luar' }, 'Hanya bangun luar yang mengambil corak bangun dalam; corak bangun luar seharusnya juga pindah ke bangun dalam.');
        break;
    }
    return o;
  }

  var URUT_PENGECOH = {
    tunggal: ['arah-balik', 'sumbu-salah', 'arsir-tetap', 'satu-arah', 'ganti-terbalik', 'dikira-tukar', 'balik-sebagian', 'geser-balik', 'ikut-putar', 'bangun-salah', 'salin-dalam', 'salin-luar',
      'pasangan-salah', 'tujuan-salah', 'sudut-salah', 'sumbu-miring', 'balik-sebagian-2', 'satu-arah-2', 'bangun-letak', 'k3-tetap', 'salin-k2', 'asal-salah', 'dikira-cermin', 'dikira-putar', 'geser-dua', 'balik-silang', 'satu-bagian', 'tambah-putar'],
    ganda: ['hanya-1', 'hanya-2', 'arsir-tetap', 'arah-balik', 'sumbu-salah', 'geser-balik', 'ikut-putar', 'satu-arah', 'ganti-terbalik', 'dikira-tukar', 'balik-sebagian', 'pasangan-salah', 'bangun-salah',
      'salin-dalam', 'salin-luar', 'tujuan-salah', 'sudut-salah', 'sumbu-miring', 'salin-k2', 'k3-tetap', 'satu-arah-2', 'balik-sebagian-2', 'bangun-letak', 'asal-salah', 'dikira-cermin', 'dikira-putar', 'geser-dua', 'satu-bagian']
  };

  function pengecoh(a, langkah, k1, k2, k3, kunci) {
    var calon = {}, ganda = langkah.length === 2;
    function catat(jenis, f, alasan) { if (f && !calon[jenis]) calon[jenis] = []; if (f) calon[jenis].push({ fig: f, alasan: alasan, jenis: jenis }); }
    if (ganda) {
      catat('hanya-1', jalankan([langkah[0]], k3), 'Hanya langkah pertama yang diterapkan (' + frase(langkah[0], k3) + '); langkah kedua (' + frase(langkah[1], terapkan(langkah[0], k3)) + ') terlewat.');
      catat('hanya-2', jalankan([langkah[1]], k3), 'Hanya langkah kedua yang diterapkan (' + frase(langkah[1], k3) + '); langkah pertama (' + frase(langkah[0], k3) + ') terlewat.');
    }
    langkah.forEach(function (t, i) {
      var sebelum = i === 0 ? k3 : jalankan(langkah.slice(0, i), k3);
      varian(t, sebelum).forEach(function (v) {
        var st = langkah.slice(); st[i] = v.t;
        catat(v.jenis, jalankan(st, k3), v.alasan);
      });
    });
    catat('salin-k2', k2, 'Gambar ini sama dengan kotak 2: perubahannya diterapkan pada kotak 1, bukan pada kotak 3.');
    catat('k3-tetap', k3, 'Gambar ini sama dengan kotak 3 tanpa perubahan apa pun.');
    // satu bagian keliru
    var kodeK = unik(kunci.c.concat(kunci.d ? kunci.d.c : [])), pos = a.kocok(deret(kunci.n));
    for (var j = 0; j < Math.min(3, pos.length); j++) {
      var lama = kunci.c[pos[j]], baru = kodeK.filter(function (x) { return x !== lama; })[0] || (lama === 'putih' ? 'hitam' : 'putih');
      var f = salin(kunci); f.c[pos[j]] = baru; f = kanon(f);
      catat('satu-bagian', f, 'Satu bagian coraknya keliru: ' + (kunci.n === 1 ? 'bangun luar' : 'bagian ' + namaArah(kunci.s + (pos[j] + 0.5) * 360 / kunci.n)) + ' seharusnya ' + Corak.nama(lama) + ', bukan ' + Corak.nama(baru) + '.');
    }
    if (!langkah.some(function (t) { return golongan(t) === 'G'; })) catat('tambah-putar', terapkan({ jenis: 'putar', th: 90 }, kunci), 'Gambar ini juga diputar 90°, padahal dari kotak 1 ke kotak 2 gambar tidak diputar.');

    var urut = URUT_PENGECOH[ganda ? 'ganda' : 'tunggal'].filter(function (j) { return calon[j]; });
    var kepala = a.kocok(urut.slice(0, 5)), urutan = kepala.concat(urut.slice(5));
    var hasil = [], lihat = {};
    lihat[kunciFig(kunci)] = 1;
    function ambil(c) {
      var kk = kunciFig(c.fig);
      if (hasil.length >= 4 || lihat[kk]) return false;
      lihat[kk] = 1;
      hasil.push(c);
      return true;
    }
    // putaran pertama: satu pengecoh per jalur kesalahan; putaran kedua: sisanya
    urutan.forEach(function (jenis) { calon[jenis].some(ambil); });
    urutan.forEach(function (jenis) { calon[jenis].forEach(ambil); });
    return hasil.length === 4 ? hasil : null;
  }

  // ================================================================ butir

  function sahkan(langkah, k1, k3) {
    var k2 = jalankan(langkah, k1), kunci = jalankan(langkah, k3);
    if (!k2 || !kunci) return null;
    var c1 = kunciFig(k1), c2 = kunciFig(k2), c3 = kunciFig(k3), ck = kunciFig(kunci);
    if (c1 === c2 || c1 === c3 || ck === c3 || ck === c2 || ck === c1) return null;
    if (langkah.length === 2) {
      // kedua langkah harus terlihat pada kotak 1 maupun kotak 3
      var ok = [k1, k3].every(function (f) {
        var t1 = terapkan(langkah[0], f), t2 = terapkan(langkah[1], t1), s2 = terapkan(langkah[1], f);
        return t1 && t2 && s2 && kunciFig(t1) !== kunciFig(f) && kunciFig(t2) !== kunciFig(t1) && kunciFig(s2) !== kunciFig(t2);
      });
      if (!ok) return null;
    }
    var h = hasilTafsir(k1, k2, k3);
    if (!h.hasil || kunciFig(h.hasil) !== ck) return null;
    return { k2: k2, kunci: kunci };
  }

  function pilihMekanisme(a, level, dipakai) {
    var semua = MEKANISME[level] || MEKANISME.sedang;
    var baru = semua.filter(function (p) { return (dipakai || []).indexOf(ID + ':' + p) < 0; });
    return a.pilih(baru.length ? baru : semua);
  }

  function buat(id, level, benih, opsi) {
    opsi = opsi || {};
    var a = Rng.alat(benih);
    var target = opsi.target == null ? a.bulat(0, 4) : opsi.target;
    var mek = pilihMekanisme(a, level, opsi.polaDipakai);
    for (var coba = 0; coba < 70; coba++) {
      if (coba && coba % 18 === 0) mek = a.pilih(MEKANISME[level] || MEKANISME.sedang);
      var rc = rencana(mek, a), langkah = rc.langkah;
      var k1 = acakFig(a, rc.q1);
      if (!k1) continue;
      var q3 = Object.assign({}, rc.q3);
      if (!q3.luar) {
        var bentuk3 = (q3.bentuk || SEMUA_BANGUN).filter(function (b) { return b !== k1.b; });
        if (bentuk3.length) q3.bentuk = bentuk3;
      }
      var k3 = acakFig(a, q3);
      if (!k3 || !bedaSusunan(k1, k3, !!rc.q3.luar)) continue;
      var sah = sahkan(langkah, k1, k3);
      if (!sah) continue;
      var k2 = sah.k2, kunci = sah.kunci;
      var peng = pengecoh(a, langkah, k1, k2, k3, kunci);
      if (!peng) continue;

      var tahap1 = langkah.length === 2 ? terapkan(langkah[0], k1) : null, tahap3 = langkah.length === 2 ? terapkan(langkah[0], k3) : null;
      var pem = ['Kotak 1 berisi ' + urai(k1) + '.'];
      if (langkah.length === 1) pem.push('Dari kotak 1 ke kotak 2, ' + frase(langkah[0], k1) + '.' + catatanArah(langkah[0], k1));
      else pem.push('Dari kotak 1 ke kotak 2 terjadi dua perubahan. Pertama, ' + frase(langkah[0], k1) + '.' + catatanArah(langkah[0], k1) + ' Kedua, ' + frase(langkah[1], tahap1) + '.' + catatanArah(langkah[1], tahap1));
      pem.push('Gambar 1 memperlihatkan perubahan itu' + (langkah.length === 2 ? ' langkah demi langkah' : '') + ': ' + penjelasanPenanda(langkah) + '.');
      var kal4 = 'Kotak 3 berisi ' + urai(k3) + '. Terapkan perubahan yang sama pada kotak 3.' + catatanArah(langkah[0], k3);
      if (langkah.length === 2) kal4 += ' Setelah langkah pertama diperoleh ' + urai(tahap3) + '; kemudian ' + frase(langkah[1], tahap3) + '.' + catatanArah(langkah[1], tahap3);
      pem.push(kal4);
      pem.push('Gambar 2 memperlihatkan penerapan itu pada kotak 3' + (langkah.length === 2 ? ' tahap demi tahap' : '') + '. Jadi, gambar yang menggantikan tanda tanya adalah ' + urai(kunci) + '.');

      var daftar = a.kocok(peng.map(function (p) { return { fig: p.fig, alasan: p.alasan, kunci: false }; }));
      daftar.splice(target, 0, { fig: kunci, alasan: null, kunci: true });
      var opsiGambar = daftar.map(function (d, i) {
        return { teks: 'Gambar opsi ' + Fmt.huruf(i), nilai: i, alasan: d.alasan, kunci: d.kunci,
          gambar: { id: 'opsi-' + Fmt.huruf(i).toLowerCase(), jenis: 'analogi-corak-opsi', model: { fig: d.fig }, judul: 'Opsi ' + Fmt.huruf(i) } };
      });
      var kotak = [k1, k2, k3];
      var ctx = { subtes: 'ku', submateri: 'figural', keluarga: id, level: level, benih: benih, a: a };
      var butir = Butir.rakitPg(ctx, {
        jenisSoal: 'Figural Analogi - Transformasi Bangun Bercorak',
        judul: 'Figural Analogi - Transformasi Bangun Bercorak', teks: [], pertanyaan: '', perintah: PERINTAH,
        gambar: [{ id: 'soal', jenis: 'analogi-corak-soal', model: { kotak: kotak }, judul: 'Analogi bangun bercorak' }],
        pilihanJadi: { opsi: opsiGambar, kunciIndex: target }, tulisKunci: false,
        langkah: [], pembahasan: pem,
        model: { topik: 'Figural', tipe: 'analogi-corak', kotak: kotak, mekanisme: mek, pilihan: daftar.map(function (d) { return d.fig; }), kunciIndex: target },
        sidik: { inti: ID + '|' + kotak.concat([kunci]).map(kunciFig).join('/'), param: [], entitas: mek }
      });
      if (!butir) continue;
      var labelAwal = langkah.length === 2 ? ['kotak 1', 'setelah langkah 1', 'kotak 2'] : ['kotak 1', 'kotak 2'];
      var labelAkhir = langkah.length === 2 ? ['kotak 3', 'setelah langkah 1', 'jawaban'] : ['kotak 3', 'jawaban'];
      butir.gambarPembahasan = [
        { id: 'bahas-1', jenis: 'analogi-corak-langkah', judul: 'Gambar 1. Perubahan dari kotak 1 ke kotak 2',
          model: { kotak: langkah.length === 2 ? [k1, tahap1, k2] : [k1, k2], langkah: langkah, label: labelAwal } },
        { id: 'bahas-2', jenis: 'analogi-corak-langkah', judul: 'Gambar 2. Perubahan yang sama pada kotak 3',
          model: { kotak: langkah.length === 2 ? [k3, tahap3, kunci] : [k3, kunci], langkah: langkah, label: labelAkhir, jawaban: kunci } }
      ];
      butir.pola = ID + ':' + mek;
      butir.kategoriRiset = 'pengayaan';
      butir.catatanRiset = 'Bangun bercorak bergaya matriks bersekat contoh riset soal 4, diterapkan pada analogi transformasi (bab Macam-macam Transformasi Figural di Kerangka Course); bentuk ini tidak ada pada contoh riset BAB V.';
      return butir;
    }
    return null;
  }

  var KELUARGA = [{ id: ID, nama: 'Analogi bangun bercorak (putar, cermin, tukar/ganti corak, balik terang-gelap, geser, ganti bangun)', submateri: 'figural', kolam: 'matriks' }];

  return {
    KELUARGA: KELUARGA, PERINTAH: PERINTAH, MEKANISME: MEKANISME, buat: buat,
    // untuk pratinjau dan uji
    terapkan: terapkan, kanon: kanon, kunciFig: kunciFig, tafsir: tafsir, gambarFig: gambarFig,
    GAMBAR: {
      'analogi-corak-soal': function (m) { return svgSoal(m); },
      'analogi-corak-opsi': function (m) { return svgOpsi(m); },
      'analogi-corak-langkah': function (m, judul) { return svgLangkah(m, judul || ''); }
    }
  };
});
