/*
 * serial-petak.js — Kemampuan Umum > Figural > Serial "The Next Box": dua keluarga pengayaan,
 * keduanya deret 4-5 kotak tampak lalu kotak "?".
 *
 *   serial-petak  BENDA BERGERAK DI PETAK. Tiap kotak berisi petak n x n (3x3, 4x4, 5x5) dengan
 *                 benda berbeda bentuk (lingkaran hitam, lingkaran putih, segitiga, bintang, persegi
 *                 kecil, tanda silang). Tiap benda punya LINTASAN dan LANGKAH sendiri:
 *                   lintasan  keliling tepi (searah/berlawanan jarum jam), keliling bagian dalam,
 *                             mendatar/menegak berulang (setelah ujung muncul lagi di ujung awal),
 *                             mendatar/menegak bolak-balik, menyusuri baris/kolom seperti membaca,
 *                             zig-zag (ular), diagonal memantul
 *                   langkah   tetap 1-3 petak, bertambah (1, 2, 3, ...), bergantian maju-mundur
 *                 mudah   satu benda bergerak (keliling 1-2 petak, baris/kolom berulang, membaca, atau
 *                         zig-zag 1 petak; 1-2 petak pada 5x5), ditambah satu atau dua benda yang
 *                         selalu diam (pembeda tanpa aturan tambahan; pada 3x3 selalu dua)
 *                 sedang  dua benda dengan lintasan dan/atau langkah berbeda
 *                 sulit   tiga benda, atau dua benda dengan langkah bertambah, maju-mundur
 *                         bergantian, atau lintasan memantul (arah berbalik terlihat di deret)
 *                 Langkah pada lintasan membaca/zig-zag paling banyak n-2 petak (langkah n-1, n, n+1
 *                 tampak seperti gerak miring/tegak). Dua benda tidak pernah menempati petak yang sama
 *                 pada kotak yang tampak maupun pada jawaban; bila terjadi pada pengecoh, keduanya
 *                 digambar kecil berdampingan.
 *
 *   serial-jarum  JARUM BERPUTAR. Tiap kotak berisi muka jam (delapan garis arah, tiap 45°) dengan
 *                 dua sampai empat penanda yang mudah dibedakan: jarum panjang berujung panah, jarum
 *                 pendek tebal, titik hitam atau bulatan putih pada tepi (tidak pernah keduanya),
 *                 segitiga di luar tepi. Tiap penanda berputar dengan langkah sudutnya sendiri
 *                 (kelipatan 45°).
 *                 mudah   dua penanda berputar dengan langkah tetap searah, ditambah satu atau dua
 *                         penanda yang selalu diam
 *                 sedang  dua penanda berputar berlawanan arah (biasanya dengan penanda ketiga), atau
 *                         tiga penanda berlangkah tetap
 *                 sulit   satu penanda (atau lebih) berlangkah bertambah 45° tiap kotak, bergantian
 *                         arah, atau hanya berputar tiap dua kotak
 *                 Jarum panjang dan jarum pendek tidak pernah berimpit pada kotak tampak maupun jawaban.
 *
 * Penyusun memastikan gerakan tiap benda/penanda DAPAT DITEBAK dari kotak yang tampak: pustaka
 * lintasan x langkah (petak) atau pustaka pola langkah sudut (jarum) dicocokkan dengan kotak yang
 * tampak, dan soal hanya dipakai bila semua aturan yang cocok meramalkan kotak berikutnya yang sama.
 * Pemeriksa independennya ada di cek-serial-petak.js.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./rng.js'), require('./svg.js'), require('./butir.js'), require('./format.js'), require('./metrik.js'));
    module.exports = api;
  } else {
    api = factory(root.Rng, root.Svg, root.Butir, root.Fmt, root.Metrik);
    root.SerialPetak = api;
  }
})(typeof self !== 'undefined' ? self : this, function (Rng, S, Butir, Fmt, Metrik) {
  'use strict';

  var PERINTAH = 'Gunakan gambar di bagian atas untuk menentukan jawaban yang benar dari pilihan di bawah. Pilih jawaban yang menggantikan tanda tanya. Jika tidak ada tanda tanya, pilih jawaban yang merupakan kelanjutan dari urutan tersebut.';
  var TINTA = '#1d1d1d', TEPI = '#4a5266', ABU = '#9a9a9a', GARIS = '#9aa3b5', TANYA = '#f4f6fb';
  var BH = S.BAHAS, WARNA = ['#d35400', '#1f6fd0', '#8e44ad', '#0e7c86'];

  // ------------------------------------------------------------------ alat umum

  function mod(a, n) { return ((a % n) + n) % n; }
  function rentang(n) { var r = []; for (var i = 0; i < n; i++) r.push(i); return r; }
  function daftarKata(xs) { return xs.length <= 1 ? xs.join('') : xs.slice(0, -1).join(', ') + ' dan ' + xs[xs.length - 1]; }
  function sj(x) { return JSON.stringify(x); }

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

  function kotakTanya(x, y, B) {
    return S.rect(x, y, B, B, { isi: TANYA, garis: TEPI, tebal: 1.6 }) +
      S.teks('?', x + B / 2, y + B / 2 + B * 0.17, { ukuran: Math.round(B * 0.48), tebal: true, isi: TEPI, rata: 'middle' });
  }

  /** Lebar kotak deret menurut banyak kotak tampak (lebar gambar soal tetap 590). */
  function ukuranKotak(V) { return V >= 5 ? 88 : 106; }
  function selaKotak(V) { return V >= 5 ? 10 : 12; }

  /** Apakah pola dengan awalan tertentu sudah dipakai butir lain pada subtes ini. */
  function sudahDipakai(dipakai, awalan) { return (dipakai || []).some(function (p) { return String(p).indexOf(awalan) === 0; }); }
  function pilihBaru(a, daftar, awalan, dipakai) {
    var baru = daftar.filter(function (x) { return !sudahDipakai(dipakai, awalan + x); });
    return a.pilih(baru.length ? baru : daftar);
  }

  // ======================================================================= PETAK

  var BENDA = ['hitam', 'putih', 'segitiga', 'bintang', 'persegi', 'silang'];
  var NAMA_BENDA = { hitam: 'lingkaran hitam', putih: 'lingkaran putih', segitiga: 'segitiga', bintang: 'bintang', persegi: 'persegi kecil', silang: 'tanda silang' };

  function urutBenda(daftar) { return daftar.slice().sort(function (x, y) { return BENDA.indexOf(x.b) - BENDA.indexOf(y.b); }); }
  function letak(p) { return 'baris ' + (p[0] + 1) + ' kolom ' + (p[1] + 1); }
  function letakPendek(p) { return '(' + (p[0] + 1) + ', ' + (p[1] + 1) + ')'; }
  function samaSel(p, q) { return p[0] === q[0] && p[1] === q[1]; }
  function bersebelahan(p, q) { return Math.max(Math.abs(p[0] - q[0]), Math.abs(p[1] - q[1])) === 1; }

  /** Satu benda berpusat di (cx, cy) dengan ukuran dasar h (kira-kira jari-jari). */
  function bendaSvg(b, cx, cy, h) {
    if (b === 'hitam') return S.lingkaran(cx, cy, h, { isi: TINTA });
    if (b === 'putih') return S.lingkaran(cx, cy, h * 0.92, { isi: '#ffffff', garis: TINTA, tebal: Math.max(1.6, h * 0.24) });
    if (b === 'segitiga') return S.poli([[cx, cy - h * 1.1], [cx + h * 1.08, cy + h * 0.8], [cx - h * 1.08, cy + h * 0.8]], { tutup: true, isi: ABU, garis: TINTA, tebal: Math.max(1.4, h * 0.18), sambung: 'round' });
    if (b === 'bintang') {
      var p = [];
      for (var i = 0; i < 10; i++) { var r = i % 2 ? h * 0.52 : h * 1.25, t = Math.PI * i / 5; p.push([cx + r * Math.sin(t), cy + h * 0.1 - r * Math.cos(t)]); }
      return S.poli(p, { tutup: true, isi: TINTA, garis: TINTA, tebal: 1, sambung: 'round' });
    }
    if (b === 'persegi') return S.rect(cx - h * 0.82, cy - h * 0.82, h * 1.64, h * 1.64, { isi: '#ffffff', garis: TINTA, tebal: Math.max(1.6, h * 0.24) });
    var k = h * 0.86, t2 = Math.max(2, h * 0.34);
    return S.garis(cx - k, cy - k, cx + k, cy + k, { garis: TINTA, tebal: t2, ujung: 'round' }) + S.garis(cx - k, cy + k, cx + k, cy - k, { garis: TINTA, tebal: t2, ujung: 'round' });
  }

  var LETAK_GANDA = {
    2: [[-0.23, 0], [0.23, 0]],
    3: [[-0.22, -0.2], [0.22, -0.2], [0, 0.22]],
    4: [[-0.22, -0.22], [0.22, -0.22], [-0.22, 0.22], [0.22, 0.22]]
  };

  /**
   * Petak n x n dalam kotak berukuran B di (x0, y0). Benda yang sepetak digambar kecil berdampingan.
   * o: { sorot: [[r, c, warnaLatar]], tepi, tebalTepi, latar, bingkai: [[r, c, warnaGaris, putus]] }
   */
  function petakSvg(n, benda, x0, y0, B, o) {
    o = o || {};
    var m = Math.max(4, B * 0.05), u = (B - 2 * m) / n, g = [];
    g.push(S.rect(x0, y0, B, B, { isi: o.latar || '#ffffff', garis: o.tepi || TEPI, tebal: o.tebalTepi || 1.6 }));
    (o.sorot || []).forEach(function (p) { g.push(S.rect(x0 + m + p[1] * u, y0 + m + p[0] * u, u, u, { isi: p[2] || BH.latarJawab })); });
    for (var i = 1; i < n; i++) {
      g.push(S.garis(x0 + m + i * u, y0 + m, x0 + m + i * u, y0 + m + n * u, { garis: GARIS, tebal: 1.1 }));
      g.push(S.garis(x0 + m, y0 + m + i * u, x0 + m + n * u, y0 + m + i * u, { garis: GARIS, tebal: 1.1 }));
    }
    g.push(S.rect(x0 + m, y0 + m, n * u, n * u, { isi: 'none', garis: TEPI, tebal: 1.4 }));
    (o.bingkai || []).forEach(function (p) { g.push(S.rect(x0 + m + p[1] * u + 2, y0 + m + p[0] * u + 2, u - 4, u - 4, { isi: 'none', garis: p[2], tebal: 2.2, putus: p[3] ? '4 3' : undefined })); });
    var per = {}, urut = [];
    benda.forEach(function (x) { var k = x.r + ',' + x.c; if (!per[k]) { per[k] = []; urut.push(k); } per[k].push(x); });
    urut.forEach(function (k) {
      var isi = per[k], cx = x0 + m + (isi[0].c + 0.5) * u, cy = y0 + m + (isi[0].r + 0.5) * u;
      if (isi.length === 1) { g.push(bendaSvg(isi[0].b, cx, cy, u * 0.3)); return; }
      var L = LETAK_GANDA[Math.min(4, isi.length)], h = u * (isi.length === 2 ? 0.19 : 0.15);
      isi.forEach(function (x, j) { var q = L[j % L.length]; g.push(bendaSvg(x.b, cx + q[0] * u, cy + q[1] * u, h)); });
    });
    return g.join('');
  }

  /** Gambar soal: kotak-kotak petak yang tampak lalu kotak "?". */
  function svgPetakDeret(m) {
    var V = m.kotak.length, B = m.ukuran || ukuranKotak(V), gap = selaKotak(V), pad = 6, o = [];
    m.kotak.forEach(function (bd, i) { o.push(petakSvg(m.n, bd, pad + i * (B + gap), pad, B)); });
    o.push(kotakTanya(pad + V * (B + gap), pad, B));
    var W = pad * 2 + (V + 1) * B + V * gap, H = pad * 2 + B;
    return { svg: S.doc(o.join(''), W, H, { latar: '#ffffff' }), lebar: W, tinggi: H };
  }

  /** Pilihan jawaban: satu kotak petak. */
  function svgPetakOpsi(m) {
    var B = 132, pad = 5, W = B + pad * 2;
    return { svg: S.doc(petakSvg(m.fig.n, m.fig.benda, pad, pad, B), W, W, { latar: '#ffffff' }), lebar: W, tinggi: W };
  }

  // ------------------------------------------------------------------ lintasan

  /** Delapan pencerminan/putaran persegi (k = 0..7) terhadap petak (r, c). */
  function putarD4(p, n, k) {
    var r = p[0], c = p[1], t;
    if (k & 4) { t = r; r = c; c = t; }
    if (k & 1) c = n - 1 - c;
    if (k & 2) r = n - 1 - r;
    return [r, c];
  }

  /** Cincin petak tepi (lapis 0) atau bagian dalam (lapis 1), searah jarum jam dari pojok kiri atasnya. */
  function selRing(n, lapis) {
    var m = n - 2 * lapis, s = [], i;
    if (m < 2) return null;
    for (i = 0; i < m - 1; i++) s.push([lapis, lapis + i]);
    for (i = 0; i < m - 1; i++) s.push([lapis + i, lapis + m - 1]);
    for (i = 0; i < m - 1; i++) s.push([lapis + m - 1, lapis + m - 1 - i]);
    for (i = 0; i < m - 1; i++) s.push([lapis + m - 1 - i, lapis]);
    return s;
  }

  function selRaster(n, k) {
    var s = [];
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) s.push(putarD4([r, c], n, k));
    return s;
  }

  function selUlar(n, k) {
    var s = [];
    for (var r = 0; r < n; r++) for (var i = 0; i < n; i++) s.push(putarD4([r, r % 2 ? n - 1 - i : i], n, k));
    return s;
  }

  function selUlarPantul(n, k) { var u = selUlar(n, k); return u.concat(u.slice(1, u.length - 1).reverse()); }
  function selRasterPantul(n, k) { var u = selRaster(n, k); return u.concat(u.slice(1, u.length - 1).reverse()); }
  function selBaris(n, r) { return rentang(n).map(function (c) { return [r, c]; }); }
  function selKolom(n, c) { return rentang(n).map(function (r) { return [r, c]; }); }
  function selPantulBaris(n, r) { var s = selBaris(n, r); return s.concat(s.slice(1, n - 1).reverse()); }
  function selPantulKolom(n, c) { var s = selKolom(n, c); return s.concat(s.slice(1, n - 1).reverse()); }
  function selTorus(n, d, anti) { return rentang(n).map(function (t) { return [t, mod(anti ? d - t : d + t, n)]; }); }

  /** Diagonal memantul: tiap langkah satu petak miring; arah dibalik bila langkah berikutnya keluar petak. */
  function selBiliar(n, r, c, dr, dc) {
    var s = [], P = 2 * (n - 1);
    for (var t = 0; t < P; t++) {
      s.push([r, c]);
      if (r + dr < 0 || r + dr >= n) dr = -dr;
      if (c + dc < 0 || c + dc >= n) dc = -dc;
      r += dr; c += dc;
    }
    return s;
  }

  /*
   * Pustaka penyaring keunikan: semua lintasan (sebagai siklus petak) dan semua pola langkah yang wajar
   * dipertimbangkan peserta. Gerakan sebuah benda di kotak yang tampak hanya dipakai bila setiap pasangan
   * (lintasan, titik awal, pola langkah) yang cocok meramalkan petak yang sama pada kotak berikutnya.
   * Langkah bukan nol yang tidak memindahkan benda (memantul kembali ke petak yang sama) tidak wajar,
   * jadi tidak dihitung: benda yang tampak diam hanya dibaca berlangkah nol.
   */
  var PUSTAKA = {}, ATURAN = {};

  function pustakaPetak(n) {
    if (PUSTAKA[n]) return PUSTAKA[n];
    var semua = [selRing(n, 0)], r, c, k;
    if (n >= 4) semua.push(selRing(n, 1));
    for (r = 0; r < n; r++) semua.push(selBaris(n, r), selKolom(n, r), selPantulBaris(n, r), selPantulKolom(n, r), selTorus(n, r, false), selTorus(n, r, true));
    for (k = 0; k < 8; k++) semua.push(selRaster(n, k), selUlar(n, k), selUlarPantul(n, k), selRasterPantul(n, k));
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(function (v) {
      for (var rr = 0; rr < n; rr++) for (var cc = 0; cc < n; cc++) semua.push(selBiliar(n, rr, cc, v[0], v[1]));
    });
    var lihat = {}, lib = [];
    function kanonik(a) {
      var terbaik = null;
      for (var i = 0; i < a.length; i++) { var s = a.slice(i).concat(a.slice(0, i)).join(','); if (terbaik === null || s < terbaik) terbaik = s; }
      return terbaik;
    }
    semua.forEach(function (s) {
      var a = s.map(function (p) { return p[0] * n + p[1]; });
      var kunci = kanonik(a), kb = kanonik(a.slice().reverse());
      if (kb < kunci) kunci = kb;
      if (lihat[kunci]) return;
      lihat[kunci] = 1;
      var peta = {};
      a.forEach(function (v, i) { (peta[v] = peta[v] || []).push(i); });
      lib.push({ a: a, peta: peta });
    });
    return (PUSTAKA[n] = lib);
  }

  /** Pola langkah (jumlah langkah kumulatif T0..TV): tetap, bertambah, bergantian. */
  function aturanPetak(V) {
    if (ATURAN[V]) return ATURAN[V];
    var daftar = [], k, x, y, e;
    function kum(f) { var T = [0]; for (var t = 1; t <= V; t++) T.push(T[t - 1] + f(t)); daftar.push(T); }
    function tetap(k) { kum(function () { return k; }); }
    function tambah(x, e, sg) { kum(function (t) { return sg * (x + (t - 1) * e); }); }
    function ganti(x, y) { kum(function (t) { return t % 2 ? x : y; }); }
    for (k = -4; k <= 4; k++) tetap(k);
    for (x = 1; x <= 3; x++) for (e = 1; e <= 2; e++) { tambah(x, e, 1); tambah(x, e, -1); }
    for (x = -4; x <= 4; x++) for (y = -4; y <= 4; y++) if (x !== y) ganti(x, y);
    return (ATURAN[V] = daftar);
  }

  /** Semua petak ramalan (indeks r*n+c) dari aturan pustaka yang cocok dengan posisi tampak `obs`. */
  function ramalPetak(n, obs) {
    var V = obs.length, lib = pustakaPetak(n), rules = aturanPetak(V), hasil = {};
    for (var i = 0; i < lib.length; i++) {
      var a = lib[i].a, L = a.length, awal = lib[i].peta[obs[0]];
      if (!awal) continue;
      for (var j = 0; j < awal.length; j++) {
        var s = awal[j];
        for (var q = 0; q < rules.length; q++) {
          var T = rules[q], ok = true;
          // langkah bukan nol harus benar-benar memindahkan benda (bukan memantul kembali ke petak yang sama)
          for (var t = 1; t < V; t++) if (a[mod(s + T[t], L)] !== obs[t] || (T[t] !== T[t - 1] && obs[t] === obs[t - 1])) { ok = false; break; }
          if (ok) hasil[a[mod(s + T[V], L)]] = 1;
        }
      }
    }
    return Object.keys(hasil).map(Number);
  }

  // -------------------------------------------------------- benda dan geraknya

  var KELOMPOK = { keliling: 'keliling', 'keliling-dalam': 'keliling', baris: 'berulang', kolom: 'berulang', baca: 'baca', ular: 'ular', 'pantul-baris': 'pantul', 'pantul-kolom': 'pantul', diagonal: 'diagonal' };

  function specJalur(a, n, jenis) {
    var sel, arah = 1, garis = null, k = null;
    if (jenis === 'keliling') { sel = selRing(n, 0); arah = a.tanda(); }
    else if (jenis === 'keliling-dalam') { sel = selRing(n, 1); arah = a.tanda(); }
    else if (jenis === 'baris') { garis = a.bulat(0, n - 1); sel = selBaris(n, garis); arah = a.tanda(); }
    else if (jenis === 'kolom') { garis = a.bulat(0, n - 1); sel = selKolom(n, garis); arah = a.tanda(); }
    else if (jenis === 'baca') { k = a.bulat(0, 7); sel = selRaster(n, k); }
    else if (jenis === 'ular') { k = a.bulat(0, 7); sel = selUlar(n, k); }
    else if (jenis === 'pantul-baris') { garis = a.bulat(0, n - 1); sel = selPantulBaris(n, garis); }
    else if (jenis === 'pantul-kolom') { garis = a.bulat(0, n - 1); sel = selPantulKolom(n, garis); }
    else sel = selBiliar(n, a.bulat(0, n - 1), a.bulat(0, n - 1), a.tanda(), a.tanda());
    return { jenis: jenis, sel: sel, arah: arah, garis: garis, k: k };
  }

  /**
   * Langkah terbesar yang masih terbaca sebagai maju (bukan mundur memutar). Pada lintasan baca/zig-zag
   * langkah n-1, n, atau n+1 tampak seperti gerak miring/tegak, jadi dibatasi n-2; diagonal paling 2.
   */
  function langkahMaks(jalur, n) {
    var m = Math.min(3, Math.floor((jalur.sel.length - 1) / 2));
    if (jalur.jenis === 'baca' || jalur.jenis === 'ular' || jalur.jenis === 'pantul-baris' || jalur.jenis === 'pantul-kolom') m = Math.min(m, n - 2);
    if (jalur.jenis === 'diagonal') m = Math.min(m, 2);
    return Math.max(1, m);
  }

  /** Langkah bertanda tiap peralihan (indeks 1..V; indeks 0 = 0). */
  function deretLangkah(at, arah, V) {
    var d = [0];
    for (var t = 1; t <= V; t++) {
      if (at.jenis === 'konstan') d.push(arah * at.k);
      else if (at.jenis === 'bertambah') d.push(arah * (at.x + t - 1));
      else if (at.jenis === 'bergantian') d.push(arah * (t % 2 ? at.p : -at.q));
      else d.push(0);
    }
    return d;
  }

  function maksKunjungan(pos) {
    var h = {}, m = 0;
    pos.forEach(function (p) { var k = p[0] + ',' + p[1]; h[k] = (h[k] || 0) + 1; if (h[k] > m) m = h[k]; });
    return m;
  }

  /** Langkah satuan (vektor) sepanjang lintasan dari kotak 1 sampai kotak `sampai`. */
  function vektorLangkah(o, sampai) {
    var L = o.jalur.sel.length, v = [];
    for (var t = 1; t <= sampai; t++) {
      var sg = o.d[t] > 0 ? 1 : -1;
      for (var j = o.idx[t - 1]; j !== o.idx[t]; j += sg) {
        var A = o.jalur.sel[mod(j, L)], B = o.jalur.sel[mod(j + sg, L)];
        v.push([B[0] - A[0], B[1] - A[1]]);
      }
    }
    return v;
  }

  /** Apakah arah gerak berbalik (pantulan) di antara kotak yang tampak. */
  function adaPantulan(o, sampai) {
    var v = vektorLangkah(o, sampai);
    for (var i = 0; i < v.length; i++) {
      for (var j = i + 1; j < v.length; j++) {
        if (!bersebelahan([0, 0], v[i]) || !bersebelahan([0, 0], v[j])) continue;
        if (v[i][0] * v[j][0] < 0 || v[i][1] * v[j][1] < 0) return true;
      }
    }
    return false;
  }

  /**
   * Pasang satu benda: titik awal pada lintasan dicari sehingga gerakannya tunggal (penyaring pustaka),
   * tidak diam di tempat, dan tidak menempati petak benda lain pada kotak mana pun.
   */
  function pasangBenda(a, n, V, b, jalur, at, terpakai, syarat) {
    var L = jalur.sel.length, d = deretLangkah(at, jalur.arah, V), T = [0], t;
    for (t = 1; t <= V; t++) T.push(T[t - 1] + d[t]);
    var awal = a.kocok(rentang(L));
    for (var i = 0; i < awal.length; i++) {
      var s = awal[i], pos = [], idx = [], ok = true;
      for (t = 0; t <= V; t++) { idx.push(s + T[t]); pos.push(jalur.sel[mod(s + T[t], L)]); }
      for (t = 1; t <= V && ok; t++) if (samaSel(pos[t], pos[t - 1])) ok = false;
      for (t = 0; t <= V && ok; t++) if (terpakai[t][pos[t][0] * n + pos[t][1]]) ok = false;
      if (!ok || maksKunjungan(pos) > 3) continue;
      var o = { b: b, jalur: jalur, at: at, d: d, idx: idx, pos: pos, diam: false };
      if (syarat && !syarat(o)) continue;
      var r = ramalPetak(n, pos.slice(0, V).map(function (p) { return p[0] * n + p[1]; }));
      if (r.length !== 1 || r[0] !== pos[V][0] * n + pos[V][1]) continue;
      for (t = 0; t <= V; t++) terpakai[t][pos[t][0] * n + pos[t][1]] = 1;
      return o;
    }
    return null;
  }

  function pasangDiam(a, n, V, b, terpakai) {
    var bebas = rentang(n * n).filter(function (x) { for (var t = 0; t <= V; t++) if (terpakai[t][x]) return false; return true; });
    if (!bebas.length) return null;
    var x = a.pilih(bebas), p = [Math.floor(x / n), x % n], pos = [];
    for (var t = 0; t <= V; t++) { pos.push(p); terpakai[t][x] = 1; }
    return { b: b, jalur: null, at: { jenis: 'diam' }, d: rentang(V + 1).map(function () { return 0; }), idx: null, pos: pos, diam: true };
  }

  function petakKosong(V) { return rentang(V + 1).map(function () { return {}; }); }

  /** Banyak kotak tampak: 5x5 selalu 4 kotak (kotak lebih lebar supaya petaknya terbaca). */
  function banyakKotak(a, n) { return n === 5 ? 4 : a.pilih([4, 5]); }

  function jalurUntuk(n, daftar) { return daftar.filter(function (j) { return j !== 'keliling-dalam' || n >= 5; }); }

  var JALUR_SEMUA = ['keliling', 'keliling-dalam', 'baris', 'kolom', 'baca', 'ular', 'pantul-baris', 'pantul-kolom', 'diagonal'];
  var KEL_MUDAH = { keliling: ['keliling'], berulang: ['baris', 'kolom'], baca: ['baca'], ular: ['ular'] };

  /** Benda konstan dengan langkah k acak dalam batas lintasannya. */
  function atKonstan(a, jalur, n, maks) { return { jenis: 'konstan', k: a.bulat(1, Math.min(maks || 3, langkahMaks(jalur, n))) }; }

  /** Susun benda-benda satu butir menurut tingkat. */
  function susunPetak(a, level, dipakai, coba) {
    var n, V, objs = [], terpakai, pola, bentuk, o, j1, j2, at1, at2;
    if (level === 'mudah') {
      var kel = pilihBaru(a, Object.keys(KEL_MUDAH), 'serial-petak:satu-', dipakai);
      n = a.pilih([3, 4, 4, 5, 5]); V = banyakKotak(a, n); terpakai = petakKosong(V);
      bentuk = a.ambil(BENDA, 3);
      j1 = specJalur(a, n, a.pilih(KEL_MUDAH[kel]));
      // langkah sederhana: keliling 1-2 petak, lintasan lain 1 petak (1-2 petak pada 5x5)
      at1 = atKonstan(a, j1, n, kel === 'keliling' || n === 5 ? 2 : 1);
      o = pasangBenda(a, n, V, bentuk[0], j1, at1, terpakai);
      if (!o) return null;
      objs.push(o);
      // butir mudah memuat satu atau dua benda lain yang selalu diam (pembeda yang tidak menambah aturan)
      // pada 3x3 hanya tersisa sedikit petak kosong, jadi selalu dua benda diam supaya butirnya beragam
      var nDiam = n === 3 || a.untung(0.5) ? 2 : 1;
      for (var di = 0; di < nDiam; di++) { var dm = pasangDiam(a, n, V, bentuk[1 + di], terpakai); if (!dm) return null; objs.push(dm); }
      pola = 'serial-petak:satu-' + kel + (nDiam === 1 ? '+diam' : '+dua-diam');
    } else if (level === 'sedang') {
      n = a.pilih([3, 4, 4, 5, 5]); V = banyakKotak(a, n); terpakai = petakKosong(V);
      bentuk = a.ambil(BENDA, 2);
      var jalurN = jalurUntuk(n, JALUR_SEMUA);
      var pj1 = a.pilih(jalurN), pj2 = a.pilih(jalurN);
      if (KELOMPOK[pj1] === KELOMPOK[pj2] && a.untung(0.8)) pj2 = a.pilih(jalurN.filter(function (j) { return KELOMPOK[j] !== KELOMPOK[pj1]; }));
      j1 = specJalur(a, n, pj1); j2 = specJalur(a, n, pj2);
      at1 = atKonstan(a, j1, n); at2 = atKonstan(a, j2, n);
      if (KELOMPOK[pj1] === KELOMPOK[pj2] && at1.k === at2.k) return null;
      pola = 'serial-petak:dua-' + [KELOMPOK[pj1], KELOMPOK[pj2]].sort().join('+');
      if (coba < 12 && sudahDipakai(dipakai, pola)) return null;
      o = pasangBenda(a, n, V, bentuk[0], j1, at1, terpakai); if (!o) return null; objs.push(o);
      o = pasangBenda(a, n, V, bentuk[1], j2, at2, terpakai); if (!o) return null; objs.push(o);
    } else {
      var varian = pilihBaru(a, ['tiga-benda', 'dua-bertambah', 'dua-bergantian', 'dua-pantul'], 'serial-petak:', dipakai);
      pola = 'serial-petak:' + varian;
      if (varian === 'tiga-benda') {
        n = a.pilih([4, 5, 5]); V = banyakKotak(a, n); terpakai = petakKosong(V);
        bentuk = a.ambil(BENDA, 3);
        var js = a.ambil(jalurUntuk(n, JALUR_SEMUA), 3);
        if (KELOMPOK[js[0]] === KELOMPOK[js[1]] && KELOMPOK[js[1]] === KELOMPOK[js[2]]) return null;
        for (var i = 0; i < 3; i++) {
          var jj = specJalur(a, n, js[i]);
          o = pasangBenda(a, n, V, bentuk[i], jj, atKonstan(a, jj, n), terpakai);
          if (!o) return null;
          objs.push(o);
        }
      } else {
        n = a.pilih(varian === 'dua-bertambah' ? [4, 5, 5, 5] : [4, 5, 5]); V = banyakKotak(a, n); terpakai = petakKosong(V);
        bentuk = a.ambil(BENDA, 2);
        var syarat = null;
        if (varian === 'dua-bertambah') {
          V = n === 4 ? 4 : V; terpakai = petakKosong(V);
          // lintasan baca/zig-zag hanya pada 5x5 dan mulai dari 1 petak, supaya langkahnya tidak menyerupai gerak miring
          j1 = specJalur(a, n, n === 5 ? a.pilih(['keliling', 'keliling', 'baca', 'ular']) : 'keliling');
          at1 = { jenis: 'bertambah', x: j1.jenis === 'keliling' ? a.pilih([1, 1, 2]) : 1 };
          var total = 0;
          for (var t = 1; t <= V; t++) total += at1.x + t - 1;
          if (total > j1.sel.length - 1) return null;
          j2 = specJalur(a, n, a.pilih(jalurUntuk(n, JALUR_SEMUA)));
          at2 = atKonstan(a, j2, n);
        } else if (varian === 'dua-bergantian') {
          j1 = specJalur(a, n, a.pilih(jalurUntuk(n, ['keliling', 'keliling-dalam', 'baca', 'ular'])));
          var garisan = j1.jenis === 'baca' || j1.jenis === 'ular';
          var pq = a.pilih(garisan ? (n === 5 ? [[2, 1], [3, 1], [3, 2]] : [[2, 1]]) : [[2, 1], [2, 1], [3, 1], [3, 2]]);
          at1 = { jenis: 'bergantian', p: pq[0], q: pq[1] };
          j2 = specJalur(a, n, a.pilih(jalurUntuk(n, JALUR_SEMUA)));
          at2 = atKonstan(a, j2, n);
        } else {
          j1 = specJalur(a, n, a.pilih(['diagonal', 'diagonal', 'pantul-baris', 'pantul-kolom']));
          at1 = atKonstan(a, j1, n, 2);
          syarat = function (x) { return adaPantulan(x, V - 1); };
          j2 = specJalur(a, n, a.pilih(['diagonal', 'pantul-baris', 'pantul-kolom', 'keliling', 'ular']));
          at2 = atKonstan(a, j2, n);
          if (KELOMPOK[j1.jenis] === KELOMPOK[j2.jenis] && at1.k === at2.k) return null;
        }
        o = pasangBenda(a, n, V, bentuk[0], j1, at1, terpakai, syarat); if (!o) return null; objs.push(o);
        o = pasangBenda(a, n, V, bentuk[1], j2, at2, terpakai); if (!o) return null; objs.push(o);
      }
    }
    return { n: n, V: V, objs: objs, pola: pola };
  }

  // ------------------------------------------------------------ uraian kata

  function kataArah(dr, dc) { return dr > 0 ? 'bawah' : dr < 0 ? 'atas' : dc > 0 ? 'kanan' : 'kiri'; }
  var LAWAN = { atas: 'bawah', bawah: 'atas', kiri: 'kanan', kanan: 'kiri' };
  function arahJam(sg) { return (sg > 0 ? 'searah' : 'berlawanan arah') + ' jarum jam'; }

  /** Apakah gerak baris/kolom berulang melompat dari satu ujung ke ujung lain pada kotak 1 sampai V+1. */
  function adaLompatan(o, V) {
    var L = o.jalur.sel.length;
    for (var t = 1; t <= V; t++) {
      var sg = o.d[t] > 0 ? 1 : -1;
      for (var j = o.idx[t - 1]; j !== o.idx[t]; j += sg) if (!bersebelahan(o.jalur.sel[mod(j, L)], o.jalur.sel[mod(j + sg, L)])) return true;
    }
    return false;
  }

  /** Apakah gerak melewati ujung lintasan baca/ular (dari petak terakhir kembali ke petak pertama). */
  function lewatUjung(o, V) {
    var L = o.jalur.sel.length;
    for (var t = 1; t <= V; t++) if (Math.floor(o.idx[t] / L) !== Math.floor(o.idx[t - 1] / L)) return true;
    return false;
  }

  /** Arah garis lintasan baca/ular: { garis: 'baris'|'kolom', maju, lanjut }. */
  function arahGaris(sel, n) {
    var v = [sel[1][0] - sel[0][0], sel[1][1] - sel[0][1]], mendatar = v[0] === 0;
    var w = [sel[n][0] - sel[0][0], sel[n][1] - sel[0][1]];
    return { garis: mendatar ? 'baris' : 'kolom', maju: kataArah(v[0], v[1]), lanjut: mendatar ? kataArah(w[0], 0) : kataArah(0, w[1]) };
  }

  function uraianJalur(o, n, V) {
    var j = o.jalur, ag;
    switch (j.jenis) {
      case 'keliling': return 'menyusuri petak-petak tepi ' + arahJam(j.arah);
      case 'keliling-dalam': return 'mengelilingi bagian dalam petak (cincin ' + (n - 2) + 'x' + (n - 2) + ' di tengah) ' + arahJam(j.arah);
      case 'baris': return 'bergerak mendatar ke ' + (j.arah > 0 ? 'kanan' : 'kiri') + ' pada baris ' + (j.garis + 1) + (adaLompatan(o, V) ? '; setelah ujung ' + (j.arah > 0 ? 'kanan' : 'kiri') + ' ia muncul lagi di ujung ' + (j.arah > 0 ? 'kiri' : 'kanan') : '');
      case 'kolom': return 'bergerak menegak ke ' + (j.arah > 0 ? 'bawah' : 'atas') + ' pada kolom ' + (j.garis + 1) + (adaLompatan(o, V) ? '; setelah ujung ' + (j.arah > 0 ? 'bawah' : 'atas') + ' ia muncul lagi di ujung ' + (j.arah > 0 ? 'atas' : 'bawah') : '');
      case 'pantul-baris': return 'bergerak mendatar pada baris ' + (j.garis + 1) + (adaPantulan(o, V) ? ' dan berbalik arah setiap kali mencapai ujung (bolak-balik)' : '');
      case 'pantul-kolom': return 'bergerak menegak pada kolom ' + (j.garis + 1) + (adaPantulan(o, V) ? ' dan berbalik arah setiap kali mencapai ujung (bolak-balik)' : '');
      case 'baca':
        ag = arahGaris(j.sel, n);
        return 'menyusuri petak ' + ag.garis + ' demi ' + ag.garis + ' dari ' + LAWAN[ag.lanjut] + ' ke ' + ag.lanjut + ', setiap ' + ag.garis + ' dari ' + LAWAN[ag.maju] + ' ke ' + ag.maju +
          ' (dari ujung ' + ag.garis + ' pindah ke awal ' + ag.garis + ' berikutnya' + (lewatUjung(o, V) ? ', dan setelah petak terakhir kembali ke petak pertama' : '') + ')';
      case 'ular':
        ag = arahGaris(j.sel, n);
        return 'menyusuri petak secara zig-zag ' + ag.garis + ' demi ' + ag.garis + ' dari ' + LAWAN[ag.lanjut] + ' ke ' + ag.lanjut + ': ' + ag.garis + ' pertama ke ' + ag.maju + ', lalu berbelok dan berbalik arah di setiap ujung ' + ag.garis +
          (lewatUjung(o, V) ? ' (setelah petak terakhir kembali ke petak pertama)' : '');
      default: return 'bergerak miring (diagonal)' + (adaPantulan(o, V) ? ' dan memantul setiap kali menyentuh tepi petak' : '');
    }
  }

  function ringkasJalur(o, n, V) {
    var j = o.jalur, ag;
    switch (j.jenis) {
      case 'keliling': return 'keliling tepi, ' + (j.arah > 0 ? 'searah' : 'berlawanan arah') + ' jarum jam';
      case 'keliling-dalam': return 'keliling dalam, ' + (j.arah > 0 ? 'searah' : 'berlawanan arah') + ' jarum jam';
      case 'baris': return 'mendatar ke ' + (j.arah > 0 ? 'kanan' : 'kiri') + (adaLompatan(o, V) ? ', berulang' : '');
      case 'kolom': return 'menegak ke ' + (j.arah > 0 ? 'bawah' : 'atas') + (adaLompatan(o, V) ? ', berulang' : '');
      case 'pantul-baris': return 'mendatar' + (adaPantulan(o, V) ? ' bolak-balik' : '');
      case 'pantul-kolom': return 'menegak' + (adaPantulan(o, V) ? ' bolak-balik' : '');
      case 'baca': ag = arahGaris(j.sel, n); return 'per ' + ag.garis + ' (' + LAWAN[ag.lanjut] + ' ke ' + ag.lanjut + '), tiap ' + ag.garis + ' ' + LAWAN[ag.maju] + ' ke ' + ag.maju;
      case 'ular': ag = arahGaris(j.sel, n); return 'zig-zag per ' + ag.garis + ' (' + LAWAN[ag.lanjut] + ' ke ' + ag.lanjut + ')';
      default: return 'diagonal' + (adaPantulan(o, V) ? ', memantul di tepi' : '');
    }
  }

  function uraianLangkah(o, V) {
    var at = o.at;
    if (at.jenis === 'konstan') return 'berpindah ' + at.k + ' petak setiap kotak';
    if (at.jenis === 'bertambah') return 'dengan langkah yang bertambah satu petak setiap kotak (' + o.d.slice(1, V).map(Math.abs).join(', ') + ' petak, dan seterusnya)';
    return 'bergantian maju ' + at.p + ' petak lalu mundur ' + at.q + ' petak';
  }

  function ringkasLangkah(o, V) {
    var at = o.at;
    if (at.jenis === 'konstan') return at.k + ' petak tiap kotak';
    if (at.jenis === 'bertambah') return 'langkah ' + o.d.slice(1, V + 1).map(Math.abs).join(', ') + ' petak';
    return 'maju ' + at.p + ', mundur ' + at.q + ', bergantian';
  }

  function gerakAkhir(o, V) {
    var d = o.d[V], at = o.at;
    if (at.jenis === 'bergantian') return (d * o.jalur.arah > 0 ? 'maju ' + at.p : 'mundur ' + at.q) + ' petak';
    if (at.jenis === 'bertambah') return 'berpindah ' + Math.abs(d) + ' petak (satu petak lebih banyak dari langkah sebelumnya)';
    return 'berpindah ' + Math.abs(d) + ' petak lagi';
  }

  // ------------------------------------------------------------- pengecoh

  function figPetak(n, objs, pos) {
    return { n: n, benda: urutBenda(objs.map(function (o, i) { return { b: o.b, r: pos[i][0], c: pos[i][1] }; })) };
  }

  function adaTabrakan(pos) {
    for (var i = 0; i < pos.length; i++) for (var j = i + 1; j < pos.length; j++) if (samaSel(pos[i], pos[j])) return true;
    return false;
  }

  function pengecohPetak(a, level, n, V, objs) {
    var kunci = objs.map(function (o) { return o.pos[V]; }), sebelum = objs.map(function (o) { return o.pos[V - 1]; }), calon = [];
    function tambah(pos, alasan, jenis, prior, sasaran) { calon.push({ pos: pos, alasan: alasan, jenis: jenis, prior: prior, sasaran: sasaran }); }
    function ganti(i, p) { var x = kunci.slice(); x[i] = p; return x; }
    var bergerak = objs.filter(function (o) { return !o.diam; });
    objs.forEach(function (o, i) {
      var Nm = Fmt.kapital(NAMA_BENDA[o.b]);
      if (o.diam) {
        var tetangga = [[0, 1], [1, 0], [0, -1], [-1, 0]].map(function (v) { return [o.pos[V][0] + v[0], o.pos[V][1] + v[1]]; })
          .filter(function (p) { return p[0] >= 0 && p[0] < n && p[1] >= 0 && p[1] < n; });
        tambah(ganti(i, a.pilih(tetangga)), Nm + ' ikut berpindah satu petak, padahal benda itu selalu diam di ' + letak(o.pos[0]) + '.', 'ikut', 1, i);
        return;
      }
      var L = o.jalur.sel.length, iv = o.idx[V - 1], d = o.d[V], sg = d > 0 ? 1 : -1, ad = Math.abs(d);
      var di = function (dd) { return o.jalur.sel[mod(iv + dd, L)]; };
      var kom = level === 'sulit' && o.at.jenis !== 'konstan';
      if (o.at.jenis === 'bertambah') tambah(ganti(i, di(o.d[V - 1])), Nm + ' berpindah ' + Math.abs(o.d[V - 1]) + ' petak seperti langkah sebelumnya, padahal langkahnya bertambah satu petak setiap kotak.', 'tetap', 0, i);
      if (o.at.jenis === 'bergantian') tambah(ganti(i, di(o.d[V - 1])), Nm + ' mengulang gerak langkah sebelumnya, padahal ia bergantian maju ' + o.at.p + ' petak dan mundur ' + o.at.q + ' petak.', 'ulang', 0, i);
      if (ad > 1) tambah(ganti(i, di(d - sg)), Nm + ' hanya berpindah ' + (ad - 1) + ' petak pada langkah terakhir, padahal seharusnya ' + ad + ' petak.', 'kurang', kom ? 0 : 1, i);
      tambah(ganti(i, di(d + sg)), Nm + ' berpindah ' + (ad + 1) + ' petak, satu petak lebih jauh dari seharusnya (' + ad + ' petak).', 'lebih', 1, i);
      tambah(ganti(i, di(-d)), Nm + ' bergerak ke arah sebaliknya pada lintasannya.', 'balik', 1, i);
      tambah(ganti(i, o.pos[V - 1]), Nm + ' tidak berpindah dari tempatnya pada kotak ' + V + ', padahal setiap kotak ia bergerak.', 'diam', 2, i);
      // lintasan dibaca lurus: terus searah langkah pertama, menembus tepi lalu muncul di sisi seberang
      var c1 = o.jalur.sel[mod(iv + sg, L)], v = [c1[0] - o.pos[V - 1][0], c1[1] - o.pos[V - 1][1]];
      if (bersebelahan([0, 0], v)) {
        var lurus = [mod(o.pos[V - 1][0] + ad * v[0], n), mod(o.pos[V - 1][1] + ad * v[1], n)];
        tambah(ganti(i, lurus), Nm + ' bergerak lurus terus (seperti baris atau kolom yang berulang), padahal lintasannya ' + ringkasJalur(o, n, V) + '.', 'lurus', 2, i);
      }
      tambah(ganti(i, di(2 * d)), Nm + ' berpindah dua kali langkahnya (' + (2 * ad) + ' petak).', 'ganda', 3, i);
    });
    for (var i = 0; i < objs.length; i++) {
      for (var j = i + 1; j < objs.length; j++) {
        var x = kunci.slice(); x[i] = kunci[j]; x[j] = kunci[i];
        tambah(x, 'Letak ' + NAMA_BENDA[objs[i].b] + ' dan ' + NAMA_BENDA[objs[j].b] + ' tertukar.', 'tukar', 1, -1);
      }
    }
    if (bergerak.length >= 2) tambah(sebelum.slice(), 'Sama dengan kotak ' + V + ': tidak ada benda yang berpindah.', 'semua-diam', 2, -1);

    var pilih = [], lihat = {}, jumlah = {};
    lihat[sj(kunci)] = 1;
    calon = a.kocok(calon);
    [false, true].forEach(function (bolehTabrak) {
      while (pilih.length < 4) {
        var terbaik = null, skor = 1e9;
        calon.forEach(function (c) {
          if (lihat[sj(c.pos)] || (!bolehTabrak && adaTabrakan(c.pos))) return;
          var s = c.prior + 0.7 * (jumlah[c.sasaran] || 0);
          if (s < skor) { skor = s; terbaik = c; }
        });
        if (!terbaik) break;
        lihat[sj(terbaik.pos)] = 1;
        jumlah[terbaik.sasaran] = (jumlah[terbaik.sasaran] || 0) + 1;
        pilih.push(terbaik);
      }
    });
    return pilih.length === 4 ? pilih : null;
  }

  // --------------------------------------------------- gambar pembahasan petak

  /** Langkah satuan setiap peralihan beserta lompatan (ujung baris/kolom berulang, ujung baca/ular). */
  function langkahGambar(o, V) {
    var L = o.jalur.sel.length, sel = o.jalur.sel, hasil = [];
    for (var t = 1; t <= V; t++) {
      var sg = o.d[t] > 0 ? 1 : -1, daftar = [], lompat = [];
      for (var j = o.idx[t - 1]; ; j += sg) { daftar.push(sel[mod(j, L)]); if (j === o.idx[t]) break; }
      for (var i = 0; i + 1 < daftar.length; i++) {
        if (bersebelahan(daftar[i], daftar[i + 1])) continue;
        var jA = o.idx[t - 1] + i * sg, sebelum = sel[mod(jA - sg, L)], sesudah = sel[mod(jA + 2 * sg, L)];
        var keluar = [daftar[i][0] - sebelum[0], daftar[i][1] - sebelum[1]], masuk = [sesudah[0] - daftar[i + 1][0], sesudah[1] - daftar[i + 1][1]];
        if (!bersebelahan([0, 0], keluar)) keluar = [0, sg];
        if (!bersebelahan([0, 0], masuk)) masuk = keluar;
        lompat.push({ i: i, keluar: keluar, masuk: masuk });
      }
      hasil.push({ sel: daftar, lompat: lompat });
    }
    return hasil;
  }

  /** Panah berwarna mengikuti lintasan satu peralihan (geser ke kanan arah gerak supaya bolak-balik terlihat). */
  function panahLintasan(lk, x0, y0, u, n, warna, pendekAkhir) {
    var off = Math.min(5, u * 0.12), keping = [], kini = [], o = [];
    function pusat(p) { return [x0 + (p[1] + 0.5) * u, y0 + (p[0] + 0.5) * u]; }
    // arah layar (dx, dy) = (dc, dr); titik digeser tegak lurus arah gerak sejauh `off`, ke (-dy, dx)
    function geserLayar(p, dr, dc) { var q = pusat(p), L = Math.hypot(dr, dc) || 1; return [q[0] - dr / L * off, q[1] + dc / L * off]; }
    var lompatDi = {};
    lk.lompat.forEach(function (l) { lompatDi[l.i] = l; });
    kini.push(pusat(lk.sel[0]));
    for (var i = 0; i + 1 < lk.sel.length; i++) {
      var A = lk.sel[i], B = lk.sel[i + 1];
      if (lompatDi[i]) {
        var l = lompatDi[i], pa = pusat(A), pb = pusat(B);
        var jarakKeluar = l.keluar[1] > 0 ? (n - A[1] - 0.5) * u : l.keluar[1] < 0 ? (A[1] + 0.5) * u : l.keluar[0] > 0 ? (n - A[0] - 0.5) * u : (A[0] + 0.5) * u;
        kini.push([pa[0] + l.keluar[1] * (jarakKeluar + 7), pa[1] + l.keluar[0] * (jarakKeluar + 7)]);
        keping.push(kini);
        var jarakMasuk = l.masuk[1] > 0 ? (B[1] + 0.5) * u : l.masuk[1] < 0 ? (n - B[1] - 0.5) * u : l.masuk[0] > 0 ? (B[0] + 0.5) * u : (n - B[0] - 0.5) * u;
        kini = [[pb[0] - l.masuk[1] * (jarakMasuk + 7), pb[1] - l.masuk[0] * (jarakMasuk + 7)], pb];
        continue;
      }
      var dr = B[0] - A[0], dc = B[1] - A[1];
      var p0 = geserLayar(A, dr, dc), p1 = geserLayar(B, dr, dc);
      if (i === 0 || lompatDi[i - 1]) kini[kini.length - 1] = p0; else kini.push(p0);
      kini.push(p1);
    }
    keping.push(kini);
    var gaya = { garis: warna, tebal: 2.4, ujung: 'round', sambung: 'round' };
    keping.forEach(function (pts, k) {
      if (k < keping.length - 1) { o.push(S.poli(pts, gaya)); return; }
      var akhir = pts[pts.length - 1], awal = pts[pts.length - 2] || akhir;
      var dx = akhir[0] - awal[0], dy = akhir[1] - awal[1], L = Math.hypot(dx, dy) || 1;
      var ujung = [akhir[0] - dx / L * pendekAkhir, akhir[1] - dy / L * pendekAkhir], pangkal = awal;
      if (Math.hypot(ujung[0] - pangkal[0], ujung[1] - pangkal[1]) < 8) pangkal = [ujung[0] - dx / L * 8, ujung[1] - dy / L * 8];
      if (pts.length > 2) o.push(S.poli(pts.slice(0, -1).concat([pangkal]), gaya));
      o.push(S.panah(pangkal[0], pangkal[1], ujung[0], ujung[1], { warna: warna, tebal: 2.4, kepala: 8 }));
    });
    return o.join('');
  }

  /** Satu panel lintasan: petak besar, panah tiap peralihan, nomor kotak di pojok petak, petak jawaban hijau. */
  function panelLintasan(n, g, x0, y0, G, warna, V) {
    var u = G / n, o = [], akhir = g.pos[g.pos.length - 1], i;
    o.push(S.rect(x0, y0, G, G, { isi: '#ffffff' }));
    o.push(S.rect(x0 + akhir[1] * u, y0 + akhir[0] * u, u, u, { isi: BH.latarJawab }));
    for (i = 1; i < n; i++) {
      o.push(S.garis(x0 + i * u, y0, x0 + i * u, y0 + G, { garis: '#c4cad6', tebal: 1 }));
      o.push(S.garis(x0, y0 + i * u, x0 + G, y0 + i * u, { garis: '#c4cad6', tebal: 1 }));
    }
    o.push(S.rect(x0, y0, G, G, { isi: 'none', garis: TEPI, tebal: 1.6 }));
    o.push(S.rect(x0 + akhir[1] * u + 1.5, y0 + akhir[0] * u + 1.5, u - 3, u - 3, { isi: 'none', garis: BH.jawab, tebal: 2.2 }));
    var hIkon = u * 0.2;
    g.langkah.forEach(function (lk, t) { o.push(panahLintasan(lk, x0, y0, u, n, warna, t === g.langkah.length - 1 ? hIkon + 5 : 6)); });
    var p0 = g.pos[0];
    o.push(S.lingkaran(x0 + (p0[1] + 0.5) * u, y0 + (p0[0] + 0.5) * u, 4.5, { isi: warna, garis: '#ffffff', tebal: 1.2 }));
    o.push(bendaSvg(g.b, x0 + (akhir[1] + 0.5) * u, y0 + (akhir[0] + 0.5) * u, hIkon));
    // nomor kotak di pojok kiri atas setiap petak yang dikunjungi
    var label = {}, urut = [];
    g.pos.forEach(function (p, t) { var k = p[0] + ',' + p[1]; if (!label[k]) { label[k] = []; urut.push(k); } label[k].push(t + 1); });
    urut.forEach(function (k) {
      var rc = k.split(',').map(Number), x = x0 + rc[1] * u + 3, y = y0 + rc[0] * u + 11.5;
      label[k].forEach(function (no, j) {
        var s = String(no) + (j < label[k].length - 1 ? ',' : ''), jawab = no === V + 1;
        o.push(S.rect(x - 1, y - 9.5, Metrik.lebar(s, 10, true) + 2, 12, { isi: '#ffffff', buram: 0.85 }));
        o.push(teksB(s, x, y, { ukuran: 10, tebal: true, isi: jawab ? BH.jawab : warna }));
        x += Metrik.lebar(s, 10, true);
      });
    });
    return o.join('');
  }

  function svgPetakLintasan(m, judul) {
    var pad = 8, G = m.gerak.length === 1 ? 210 : 180, sela = 22, y0 = pad + 26, o = [teksB(judul, pad, pad + 13, { ukuran: 13, tebal: true })];
    var tinggiTeks = 0, panel = [];
    m.gerak.forEach(function (g) {
      var p1 = Metrik.penggal(g.jalur, G, 10, false), p2 = Metrik.penggal(g.langkahTeks, G, 10, false);
      panel.push({ p1: p1, p2: p2 });
      tinggiTeks = Math.max(tinggiTeks, (p1.length + p2.length) * 13);
    });
    // ruang di atas dan bawah petak untuk garis lompatan (keluar di satu tepi, masuk di tepi seberang)
    var W = lebarJudul(judul, pad * 2 + m.gerak.length * G + (m.gerak.length - 1) * sela), yG = y0 + 30;
    m.gerak.forEach(function (g, i) {
      var x = pad + i * (G + sela), w = WARNA[i % WARNA.length];
      o.push(bendaSvg(g.b, x + 8, y0 + 7, 6.5));
      o.push(teksB(Fmt.kapital(NAMA_BENDA[g.b]), x + 20, y0 + 11, { ukuran: 12, tebal: true, isi: w }));
      o.push(panelLintasan(m.n, g, x, yG, G, w, m.V));
      var y = yG + G + 22;
      panel[i].p1.concat(panel[i].p2).forEach(function (b, k) { o.push(teksB(b, x, y + k * 13, { ukuran: 10, isi: k < panel[i].p1.length ? BH.teks : BH.teksRedup })); });
    });
    var H = yG + G + 15 + tinggiTeks + pad;
    if (m.diam && m.diam.length) {
      var t = paragrafB('Benda diam: ' + m.diam.map(function (d) { return NAMA_BENDA[d.b] + ' selalu di baris ' + (d.r + 1) + ' kolom ' + (d.c + 1); }).join('; ') + '.', pad, H + 6, W - 2 * pad, { ukuran: 10, isi: BH.teksRedup });
      o.push(t.svg);
      H += t.baris * 13 + 6;
    }
    return { svg: S.doc(o.join(''), W, H, { latar: '#ffffff' }), lebar: W, tinggi: H };
  }

  function svgPetakJawab(m, judul) {
    var pad = 8, B = 156, sela = 56, y0 = pad + 26 + 16, o = [teksB(judul, pad, pad + 13, { ukuran: 13, tebal: true })];
    var x1 = pad, x2 = pad + B + sela;
    var bingkaiLama = [], sorot = [], bingkaiBaru = [];
    m.gerak.forEach(function (g) {
      var w = WARNA[g.warna % WARNA.length];
      bingkaiLama.push([g.dari[0], g.dari[1], w, true]);
      sorot.push([g.ke[0], g.ke[1], BH.latarJawab]);
      bingkaiBaru.push([g.ke[0], g.ke[1], w, false]);
    });
    o.push(teksB('Kotak ' + m.V, x1 + B / 2, y0 - 6, { rata: 'middle', tebal: true }));
    o.push(teksB('Kotak ' + (m.V + 1) + ' (jawaban)', x2 + B / 2, y0 - 6, { rata: 'middle', tebal: true, isi: BH.jawab }));
    o.push(petakSvg(m.jawaban.n, m.sebelum, x1, y0, B, { bingkai: bingkaiLama }));
    o.push(petakSvg(m.jawaban.n, m.jawaban.benda, x2, y0, B, { sorot: sorot, bingkai: bingkaiBaru, tepi: BH.jawab, tebalTepi: 2.6 }));
    o.push(S.panah(x1 + B + 10, y0 + B / 2, x2 - 10, y0 + B / 2, { warna: BH.panah, tebal: 2.2, kepala: 9 }));
    var W = lebarJudul(judul, x2 + B + pad), y = y0 + B + 18;
    m.gerak.forEach(function (g) {
      var w = WARNA[g.warna % WARNA.length], p = paragrafB(g.teks, pad + 16, y, W - 2 * pad - 16, { ukuran: 11, isi: w });
      o.push(S.rect(pad, y - 9, 10, 10, { isi: w }));
      o.push(p.svg);
      y += p.baris * 14 + 4;
    });
    var H = y + pad - 6;
    return { svg: S.doc(o.join(''), W, H, { latar: '#ffffff' }), lebar: W, tinggi: H };
  }

  // ------------------------------------------------------------- butir petak

  function buatPetak(id, level, benih, opsi) {
    var a = Rng.alat(benih);
    var target = opsi.target == null ? a.bulat(0, 4) : opsi.target;
    for (var coba = 0; coba < 80; coba++) {
      var sp = susunPetak(a, level, opsi.polaDipakai, coba);
      if (!sp) continue;
      var n = sp.n, V = sp.V, objs = sp.objs;
      var peng = pengecohPetak(a, level, n, V, objs);
      if (!peng) continue;
      var kunciPos = objs.map(function (o) { return o.pos[V]; }), kunci = figPetak(n, objs, kunciPos);
      var kotak = rentang(V).map(function (t) { return figPetak(n, objs, objs.map(function (o) { return o.pos[t]; })).benda; });
      var bergerak = objs.filter(function (o) { return !o.diam; }), diam = objs.filter(function (o) { return o.diam; });

      var pem = ['Setiap kotak berisi petak ' + n + 'x' + n + ' dengan ' + (objs.length === 1 ? 'satu benda' : objs.length + ' benda') + ': ' + daftarKata(objs.map(function (o) { return NAMA_BENDA[o.b]; })) + '. ' +
        (bergerak.length > 1 ? 'Setiap benda bergerak menurut lintasan dan langkahnya sendiri, tidak bergantung pada benda lain. ' : '') +
        'Letak petak ditulis (baris, kolom), dihitung dari pojok kiri atas.'];
      objs.forEach(function (o) {
        var Nm = Fmt.kapital(NAMA_BENDA[o.b]);
        if (o.diam) { pem.push('• ' + Nm + ' tidak pernah berpindah: pada setiap kotak ia tetap di ' + letak(o.pos[0]) + '.'); return; }
        pem.push('• ' + Nm + ' ' + uraianJalur(o, n, V) + ', ' + uraianLangkah(o, V) + '. Pada kotak 1 sampai ' + V + ' ia berada di ' + daftarKata(o.pos.slice(0, V).map(letakPendek)) +
          '. Dari kotak ' + V + ' ia ' + gerakAkhir(o, V) + ', sehingga pada kotak ' + (V + 1) + ' ia berada di ' + letak(o.pos[V]) + '.');
      });
      pem.push('Gambar 1 memperlihatkan lintasan ' + (bergerak.length > 1 ? 'setiap benda yang bergerak' : NAMA_BENDA[bergerak[0].b]) + ': panah berwarna menunjukkan perpindahan dari kotak ke kotak, angka di pojok petak adalah nomor kotak, dan petak berbingkai hijau adalah letaknya pada kotak ' + (V + 1) +
        '. Gambar 2 membandingkan kotak ' + V + ' dengan kotak ' + (V + 1) + ' (jawaban); petak tujuan berlatar hijau muda.');
      pem.push('Jadi kotak berikutnya memuat ' + daftarKata(objs.map(function (o) { return NAMA_BENDA[o.b] + ' di ' + letak(o.pos[V]); })) + '.');

      var daftar = a.kocok(peng.map(function (p) { return { fig: figPetak(n, objs, p.pos), alasan: p.alasan, kunci: false }; }));
      daftar.splice(target, 0, { fig: kunci, alasan: null, kunci: true });
      var opsiGambar = daftar.map(function (d, i) {
        return { teks: 'Gambar opsi ' + Fmt.huruf(i), nilai: i, alasan: d.alasan, kunci: d.kunci,
          gambar: { id: 'opsi-' + Fmt.huruf(i).toLowerCase(), jenis: 'petak-opsi', model: { fig: d.fig }, judul: 'Opsi ' + Fmt.huruf(i) } };
      });
      var bagian = ['n' + n].concat(kotak.concat([kunci.benda]).map(function (bd) { return bd.map(function (x) { return x.b + '@' + x.r + ',' + x.c; }).join(';'); }));
      var ctx = { subtes: 'ku', submateri: 'figural', keluarga: id, level: level, benih: benih, a: a };
      var butir = Butir.rakitPg(ctx, {
        jenisSoal: 'Figural Serial - The Next Box (benda bergerak di petak)',
        judul: 'Figural Serial - The Next Box', teks: [], pertanyaan: '', perintah: PERINTAH,
        gambar: [{ id: 'soal', jenis: 'petak-deret', model: { n: n, kotak: kotak, ukuran: ukuranKotak(V) }, judul: 'Deret petak' }],
        pilihanJadi: { opsi: opsiGambar, kunciIndex: target }, tulisKunci: false,
        langkah: [], pembahasan: pem,
        model: { topik: 'Figural', tipe: 'serial-petak', n: n, kotak: kotak, pilihan: daftar.map(function (d) { return d.fig; }), kunciIndex: target },
        sidik: { inti: 'serial-petak|' + bagian.join('/'), param: [], entitas: sp.pola }
      });
      if (!butir) continue;
      butir.gambarPembahasan = [
        { id: 'bahas-1', jenis: 'petak-lintasan', judul: 'Gambar 1. Lintasan ' + (bergerak.length > 1 ? 'tiap benda' : NAMA_BENDA[bergerak[0].b]) + ' dari kotak 1 sampai kotak ' + (V + 1),
          model: { n: n, V: V,
            gerak: bergerak.map(function (o) { return { b: o.b, pos: o.pos, langkah: langkahGambar(o, V), jalur: ringkasJalur(o, n, V), langkahTeks: ringkasLangkah(o, V) }; }),
            diam: diam.map(function (o) { return { b: o.b, r: o.pos[0][0], c: o.pos[0][1] }; }) } },
        { id: 'bahas-2', jenis: 'petak-jawab', judul: 'Gambar 2. Kotak ' + V + ' dan kotak ' + (V + 1) + ' (jawaban)',
          model: { V: V, sebelum: kotak[V - 1], jawaban: kunci,
            gerak: bergerak.map(function (o, i) { return { warna: i, dari: o.pos[V - 1], ke: o.pos[V], teks: Fmt.kapital(NAMA_BENDA[o.b]) + ': ' + gerakAkhir(o, V) + ', dari ' + letak(o.pos[V - 1]) + ' ke ' + letak(o.pos[V]) + '.' }; }) } }
      ];
      butir.pola = sp.pola;
      butir.kategoriRiset = 'pengayaan';
      butir.catatanRiset = 'Deret benda bergerak di petak dengan lintasan dan langkah sendiri tiap benda, pengembangan bab Figural Serial - The Next Box di Kerangka Course; tidak ada pada contoh riset BAB V.';
      return butir;
    }
    return null;
  }

  // ======================================================================= JARUM

  // titik hitam dan bulatan putih sama-sama di tepi lingkaran, jadi tidak pernah dipakai bersama
  var PENANDA = ['panjang', 'pendek', 'titik', 'bulatan', 'segitiga'];
  var NAMA_PENANDA = { panjang: 'jarum panjang', pendek: 'jarum pendek', titik: 'titik hitam', bulatan: 'bulatan putih', segitiga: 'segitiga' };

  function ambilPenanda(a, k) {
    for (var c = 0; c < 50; c++) {
      var j = a.ambil(PENANDA, k);
      if (!(j.indexOf('titik') >= 0 && j.indexOf('bulatan') >= 0)) return j;
    }
    return ['panjang', 'pendek', 'segitiga', 'titik'].slice(0, k);
  }
  var ARAH8 = ['atas', 'kanan atas', 'kanan', 'kanan bawah', 'bawah', 'kiri bawah', 'kiri', 'kiri atas'];

  function urutPenanda(daftar) { return daftar.slice().sort(function (x, y) { return PENANDA.indexOf(x.j) - PENANDA.indexOf(y.j); }); }
  function derajat(a) { return (mod(a, 8) * 45) + '°'; }

  function mukaJam(cx, cy, R, o) {
    o = o || {};
    var g = [S.lingkaran(cx, cy, R, { isi: o.latar || '#ffffff', garis: o.tepi || TEPI, tebal: o.tebal || 1.6 })];
    for (var k = 0; k < 8; k++) {
      var p0 = S.titikSudut(cx, cy, R * 0.84, k * 45), p1 = S.titikSudut(cx, cy, R, k * 45);
      g.push(S.garis(p0[0], p0[1], p1[0], p1[1], { garis: GARIS, tebal: k % 2 ? 1.2 : 1.8 }));
    }
    return g.join('');
  }

  /** Satu penanda dengan arah a (0..7; 0 = atas, searah jarum jam). */
  function penandaSvg(j, a, cx, cy, R, warna) {
    var w = warna || TINTA, d = mod(a, 8) * 45;
    if (j === 'panjang') {
      var u = S.titikSudut(cx, cy, R * 0.74, d);
      return S.panah(cx, cy, u[0], u[1], { warna: w, tebal: Math.max(1.8, R * 0.065), kepala: Math.max(7, R * 0.27) });
    }
    if (j === 'pendek') {
      var u2 = S.titikSudut(cx, cy, R * 0.47, d);
      return S.garis(cx, cy, u2[0], u2[1], { garis: w, tebal: Math.max(4, R * 0.17), ujung: 'round' });
    }
    if (j === 'titik') {
      var p = S.titikSudut(cx, cy, R, d);
      return S.lingkaran(p[0], p[1], Math.max(3.6, R * 0.145), { isi: w, garis: '#ffffff', tebal: 1.2 });
    }
    if (j === 'bulatan') {
      var pb = S.titikSudut(cx, cy, R, d);
      return S.lingkaran(pb[0], pb[1], Math.max(3.8, R * 0.15), { isi: '#ffffff', garis: w, tebal: Math.max(1.6, R * 0.06) });
    }
    var pu = S.titikSudut(cx, cy, R + 1.6, d), ds = S.titikSudut(cx, cy, R * 1.31 + 1.6, d), s = Math.max(3.6, R * 0.15);
    var t = (d + 90) * Math.PI / 180, ox = Math.sin(t) * s, oy = -Math.cos(t) * s;
    return S.poli([pu, [ds[0] + ox, ds[1] + oy], [ds[0] - ox, ds[1] - oy]], { tutup: true, isi: warna || ABU, garis: TINTA, tebal: 1.2, sambung: 'round' });
  }

  function jamSvg(penanda, cx, cy, R, o) {
    o = o || {};
    var g = [mukaJam(cx, cy, R, o)], urut = urutPenanda(penanda).slice().reverse(), adaJarum = false;
    // urutan gambar: segitiga, bulatan/titik, jarum panjang, jarum pendek (paling atas)
    urut.forEach(function (p) { g.push(penandaSvg(p.j, p.a, cx, cy, R, o.warna ? o.warna[p.j] : null)); if (p.j === 'panjang' || p.j === 'pendek') adaJarum = true; });
    if (adaJarum) g.push(S.lingkaran(cx, cy, Math.max(2.2, R * 0.075), { isi: TINTA }));
    return g.join('');
  }

  function kotakJam(penanda, x, y, B, o) {
    o = o || {};
    return S.rect(x, y, B, B, { isi: o.latar || '#ffffff', garis: o.tepi || TEPI, tebal: o.tebalTepi || 1.6 }) + jamSvg(penanda, x + B / 2, y + B / 2, B * 0.34, o);
  }

  function svgJarumDeret(m) {
    var V = m.kotak.length, B = m.ukuran || ukuranKotak(V), gap = selaKotak(V), pad = 6, o = [];
    m.kotak.forEach(function (pn, i) { o.push(kotakJam(pn, pad + i * (B + gap), pad, B)); });
    o.push(kotakTanya(pad + V * (B + gap), pad, B));
    var W = pad * 2 + (V + 1) * B + V * gap, H = pad * 2 + B;
    return { svg: S.doc(o.join(''), W, H, { latar: '#ffffff' }), lebar: W, tinggi: H };
  }

  function svgJarumOpsi(m) {
    var B = 128, pad = 5, W = B + pad * 2;
    return { svg: S.doc(kotakJam(m.fig.penanda, pad, pad, B), W, W, { latar: '#ffffff' }), lebar: W, tinggi: W };
  }

  // ------------------------------------------------------------ aturan jarum

  function langkahJarum(at, V) {
    var d = [0];
    for (var t = 1; t <= V; t++) {
      if (at.jenis === 'tetap') d.push(at.k);
      else if (at.jenis === 'bertambah') d.push(at.sg * (at.x + t - 1));
      else if (at.jenis === 'bergantian') d.push(t % 2 ? at.x : at.y);
      else if (at.jenis === 'tiap-dua') d.push((t % 2 === 1) === at.ganjil ? at.k : 0);
      else d.push(0);
    }
    return d;
  }

  /**
   * Penyaring keunikan jarum: pola langkah sudut (dalam kelipatan 45°, modulo 360°) yang wajar — tetap,
   * bertambah tetap (aritmetika), berulang tiap dua atau tiga kotak, Fibonacci, berlipat dua, dan selisih
   * kedua tetap. Sebuah pola hanya dihitung bila langkah yang tampak lebih banyak dari banyak parameternya.
   */
  function ramalJarum(arah) {
    var d = [], t, hasil = {};
    for (t = 1; t < arah.length; t++) d.push(mod(arah[t] - arah[t - 1], 8));
    var n = d.length;
    function cocok(f, mulai) { for (var i = mulai; i < n; i++) if (mod(f(i), 8) !== d[i]) return false; return true; }
    function catat(x) { hasil[mod(arah[arah.length - 1] + x, 8)] = 1; }
    if (n >= 2 && cocok(function () { return d[0]; }, 1)) catat(d[0]);
    if (n >= 3) {
      var e = mod(d[1] - d[0], 8);
      if (e && cocok(function (i) { return d[0] + i * e; }, 2)) catat(d[0] + n * e);
      if (d[0] !== d[1] && cocok(function (i) { return d[i - 2]; }, 2)) catat(d[n - 2]);
      if (cocok(function (i) { return d[i - 1] + d[i - 2]; }, 2)) catat(d[n - 1] + d[n - 2]);
    }
    if (n >= 2 && cocok(function (i) { return 2 * d[i - 1]; }, 1)) catat(2 * d[n - 1]);
    if (n >= 4) {
      if (cocok(function (i) { return d[i - 3]; }, 3)) catat(d[n - 3]);
      var s1 = d[1] - d[0], s2 = d[2] - 2 * d[1] + d[0];
      var q = function (i) { return d[0] + i * s1 + i * (i - 1) / 2 * s2; };
      if (cocok(q, 3)) catat(q(n));
    }
    return Object.keys(hasil).map(Number);
  }

  function buatPenanda(a, j, at, V) {
    var d = langkahJarum(at, V), a0 = a.bulat(0, 7), arah = [a0];
    for (var t = 1; t <= V; t++) arah.push(mod(arah[t - 1] + d[t], 8));
    return { j: j, at: at, d: d, arah: arah };
  }

  function unikJarum(p, V) {
    var r = ramalJarum(p.arah.slice(0, V));
    return r.length === 1 && r[0] === p.arah[V];
  }

  function susunJarum(a, level, dipakai, coba) {
    var V, pola, ats = [], jenis, sg;
    if (level === 'mudah') {
      V = a.pilih([4, 5]);
      sg = a.tanda();
      var ks = a.ambil([1, 2, 3, 4], 2);
      ats = [{ jenis: 'tetap', k: sg * ks[0] }, { jenis: 'tetap', k: sg * ks[1] }];
      // butir mudah memuat satu atau dua penanda yang selalu diam (pembeda yang tidak menambah aturan)
      var nDiam = a.untung(0.5) ? 1 : 2;
      for (var dm = 0; dm < nDiam; dm++) ats.push({ jenis: 'diam' });
      pola = 'serial-jarum:dua-searah+' + (nDiam === 1 ? 'satu-diam' : 'dua-diam');
    } else if (level === 'sedang') {
      V = a.pilih([4, 5]);
      var varian = pilihBaru(a, ['dua-berlawanan', 'tiga-penanda'], 'serial-jarum:', dipakai);
      pola = 'serial-jarum:' + varian;
      if (varian === 'dua-berlawanan') {
        sg = a.tanda();
        ats = [{ jenis: 'tetap', k: sg * a.bulat(1, 3) }, { jenis: 'tetap', k: -sg * a.bulat(1, 3) }];
        if (a.untung(0.85)) { var k3 = a.pilih([0, 1, 2, 3, 4, -1, -2, -3]); ats.push(k3 ? { jenis: 'tetap', k: k3 } : { jenis: 'diam' }); }
      } else {
        var kk = a.ambil([1, 2, 3, 4, -1, -2, -3], 3);
        ats = kk.map(function (k) { return { jenis: 'tetap', k: k }; });
      }
    } else {
      V = 5;
      var vs = pilihBaru(a, ['bertambah', 'bergantian-arah', 'tiap-dua-kotak'], 'serial-jarum:', dipakai);
      pola = 'serial-jarum:' + vs;
      var istimewa = function (nama) {
        // mulai dari 0° atau 45°, jadi putaran terbesar 180° atau 225°
        if (nama === 'bertambah') return { jenis: 'bertambah', sg: a.tanda(), x: a.pilih([0, 1, 1]) };
        if (nama === 'bergantian-arah') { var s = a.tanda(); return { jenis: 'bergantian', x: s * a.bulat(1, 3), y: -s * a.bulat(1, 3) }; }
        return { jenis: 'tiap-dua', k: a.tanda() * a.bulat(1, 3), ganjil: a.untung(0.5) };
      };
      ats.push(istimewa(vs));
      var tiga = a.untung(0.75);
      if (tiga && a.untung(0.35)) ats.push(istimewa(a.pilih(['bertambah', 'bergantian-arah', 'tiap-dua-kotak'].filter(function (x) { return x !== vs; }))));
      while (ats.length < (tiga ? 3 : 2)) ats.push({ jenis: 'tetap', k: a.pilih([1, 2, 3, -1, -2, -3]) });
    }
    jenis = ambilPenanda(a, ats.length);
    var mk = ats.map(function (at, i) { return buatPenanda(a, jenis[i], at, V); });
    // gerakan tiap penanda harus tunggal dan berbeda satu sama lain
    if (!mk.every(function (p) { return unikJarum(p, V); })) return null;
    for (var i = 0; i < mk.length; i++) for (var k = i + 1; k < mk.length; k++) if (mk[i].at.jenis !== 'diam' && sj(mk[i].d) === sj(mk[k].d)) return null;
    // kotak berikutnya harus berubah dari kotak terakhir yang tampak
    if (mk.every(function (p) { return mod(p.d[V], 8) === 0; })) return null;
    // jarum panjang dan jarum pendek tidak pernah berimpit (jarum pendek tertutup) pada kotak tampak maupun jawaban
    var jp = mk.filter(function (p) { return p.j === 'panjang'; })[0], jd = mk.filter(function (p) { return p.j === 'pendek'; })[0];
    if (jp && jd && jp.arah.some(function (x, t) { return x === jd.arah[t]; })) return null;
    if (coba < 10 && level === 'sedang' && sudahDipakai(dipakai, pola)) return null;
    return { V: V, mk: urutPenandaObj(mk), pola: pola };
  }

  function urutPenandaObj(mk) { return mk.slice().sort(function (x, y) { return PENANDA.indexOf(x.j) - PENANDA.indexOf(y.j); }); }

  function kataPutar(d) {
    if (mod(d, 8) === 0 && d === 0) return 'diam (tidak berputar)';
    if (Math.abs(d) === 4) return 'berputar 180° (berbalik arah)';
    return 'berputar ' + (Math.abs(d) * 45) + '° ' + arahJam(d);
  }

  function uraianAturanJarum(p, V) {
    var at = p.at;
    if (at.jenis === 'tetap') return 'Setiap kotak ia ' + kataPutar(at.k);
    if (at.jenis === 'bertambah') return 'Putarannya bertambah 45° setiap kotak (' + p.d.slice(1, V).map(function (x) { return (Math.abs(x) * 45) + '°'; }).join(', ') + '), ' + arahJam(at.sg);
    if (at.jenis === 'bergantian') return 'Putarannya bergantian: ' + (Math.abs(at.x) * 45) + '° ' + arahJam(at.x) + ', lalu ' + (Math.abs(at.y) * 45) + '° ' + arahJam(at.y);
    if (at.jenis === 'tiap-dua') return 'Ia hanya berputar setiap dua kotak: berputar ' + (Math.abs(at.k) * 45) + '° ' + arahJam(at.k) + ', lalu diam satu kotak';
    return 'Ia tidak pernah berputar';
  }

  function ringkasAturanJarum(p) {
    var at = p.at, jam = function (x) { return x > 0 ? 'searah jarum jam' : 'berlawanan jarum jam'; };
    if (at.jenis === 'tetap') return Math.abs(at.k) === 4 ? '180° tiap kotak' : (Math.abs(at.k) * 45) + '° ' + jam(at.k) + ' tiap kotak';
    if (at.jenis === 'bertambah') return 'bertambah 45° tiap kotak, ' + jam(at.sg);
    if (at.jenis === 'bergantian') return 'bergantian ' + (Math.abs(at.x) * 45) + '° ' + jam(at.x) + ' dan ' + (Math.abs(at.y) * 45) + '° ' + jam(at.y);
    if (at.jenis === 'tiap-dua') return (Math.abs(at.k) * 45) + '° ' + jam(at.k) + ' tiap dua kotak';
    return 'selalu diam';
  }

  function langkahTeks(d) { return d === 0 ? '0°' : Math.abs(d) === 4 ? '180°' : (d > 0 ? '+' : '-') + (Math.abs(d) * 45) + '°'; }

  /** Gerak penanda pada peralihan terakhir (kotak V ke kotak V+1), dalam kalimat. */
  function gerakAkhirJarum(p, V) {
    if (p.at.jenis === 'tiap-dua' && p.d[V] === 0) return 'diam karena kali ini gilirannya tidak berputar';
    return kataPutar(p.d[V]);
  }

  function teksJawabJarum(p, V) {
    var Nm = Fmt.kapital(NAMA_PENANDA[p.j]);
    if (p.d[V] === 0) return Nm + ': diam (tidak berputar), tetap menunjuk ' + derajat(p.arah[V]) + ' (' + ARAH8[p.arah[V]] + ').';
    return Nm + ': ' + kataPutar(p.d[V]) + ', dari ' + derajat(p.arah[V - 1]) + ' ke ' + derajat(p.arah[V]) + ' (' + ARAH8[p.arah[V]] + ').';
  }

  // -------------------------------------------------------------- pengecoh jarum

  function pengecohJarum(a, level, V, mk) {
    var kunci = mk.map(function (p) { return p.arah[V]; }), sebelum = mk.map(function (p) { return p.arah[V - 1]; }), calon = [];
    function tambah(arah, alasan, prior, sasaran) { calon.push({ arah: arah.map(function (x) { return mod(x, 8); }), alasan: alasan, prior: prior, sasaran: sasaran }); }
    function ganti(i, x) { var y = kunci.slice(); y[i] = x; return y; }
    mk.forEach(function (p, i) {
      var Nm = Fmt.kapital(NAMA_PENANDA[p.j]), d = p.d[V], prev = p.arah[V - 1], kom = p.at.jenis !== 'tetap' && p.at.jenis !== 'diam';
      if (p.at.jenis === 'diam') {
        var lain = mk.filter(function (q) { return q.at.jenis !== 'diam'; })[0];
        tambah(ganti(i, prev + (lain ? lain.d[V] : 1)), Nm + ' ikut berputar, padahal penanda itu selalu diam menunjuk ' + derajat(prev) + '.', 1, i);
        return;
      }
      if (p.at.jenis === 'bertambah') tambah(ganti(i, prev + p.d[V - 1]), Nm + ' berputar ' + (Math.abs(p.d[V - 1]) * 45) + '° seperti langkah sebelumnya, padahal putarannya bertambah 45° setiap kotak.', 0, i);
      if (p.at.jenis === 'bergantian') tambah(ganti(i, prev + p.d[V - 1]), Nm + ' mengulang putaran langkah sebelumnya, padahal arah putarnya bergantian.', 0, i);
      if (p.at.jenis === 'tiap-dua') {
        if (d === 0) tambah(ganti(i, prev + p.at.k), Nm + ' ikut berputar, padahal ia hanya berputar setiap dua kotak dan kali ini gilirannya diam.', 0, i);
        else tambah(ganti(i, prev), Nm + ' diam, padahal kali ini gilirannya berputar ' + (Math.abs(d) * 45) + '°.', 0, i);
      }
      if (d !== 0) {
        var sg = d > 0 ? 1 : -1, ad = Math.abs(d);
        if (ad > 1) tambah(ganti(i, prev + d - sg), Nm + ' hanya berputar ' + ((ad - 1) * 45) + '°, padahal seharusnya ' + (ad * 45) + '°.', kom ? 1 : 0.5, i);
        tambah(ganti(i, prev + d + sg), Nm + ' berputar ' + ((ad + 1) * 45) + '°, 45° lebih jauh dari seharusnya.', kom ? 1 : 0.5, i);
        if (ad !== 4) tambah(ganti(i, prev - d), Nm + ' berputar ke arah sebaliknya (' + arahJam(-d) + ').', 1, i);
        if (p.at.jenis !== 'tiap-dua') tambah(ganti(i, prev), Nm + ' tidak berputar dari arahnya pada kotak ' + V + '.', 2, i);
        tambah(ganti(i, prev + 2 * d), Nm + ' berputar dua kali langkahnya.', 3, i);
      }
    });
    for (var i = 0; i < mk.length; i++) {
      for (var j = i + 1; j < mk.length; j++) {
        var x = kunci.slice(); x[i] = kunci[j]; x[j] = kunci[i];
        tambah(x, 'Arah ' + NAMA_PENANDA[mk[i].j] + ' dan ' + NAMA_PENANDA[mk[j].j] + ' tertukar.', 1, -1);
      }
    }
    tambah(sebelum, 'Sama dengan kotak ' + V + ': tidak ada penanda yang berputar.', 2, -1);
    var pilih = [], lihat = {}, jumlah = {};
    lihat[sj(kunci.map(function (x) { return mod(x, 8); }))] = 1;
    calon = a.kocok(calon);
    while (pilih.length < 4) {
      var terbaik = null, skor = 1e9;
      calon.forEach(function (c) {
        if (lihat[sj(c.arah)]) return;
        var s = c.prior + 0.7 * (jumlah[c.sasaran] || 0);
        if (s < skor) { skor = s; terbaik = c; }
      });
      if (!terbaik) break;
      lihat[sj(terbaik.arah)] = 1;
      jumlah[terbaik.sasaran] = (jumlah[terbaik.sasaran] || 0) + 1;
      pilih.push(terbaik);
    }
    return pilih.length === 4 ? pilih : null;
  }

  // ---------------------------------------------------- gambar pembahasan jarum

  function warnaPenanda(baris) { var w = {}; baris.forEach(function (b, i) { w[b.j] = WARNA[i % WARNA.length]; }); return w; }

  /** Tabel sudut: satu baris per penanda, satu kolom per kotak; busur berpanah = putaran dari kotak sebelumnya. */
  function svgJarumTabel(m, judul) {
    var pad = 8, kiri = 158, kol = 66, r = 17, y0 = pad + 26, tb = 92, o = [teksB(judul, pad, pad + 13, { ukuran: 13, tebal: true })];
    var V1 = m.V + 1, x0 = pad + kiri, W = lebarJudul(judul, x0 + V1 * kol + pad), yB = y0 + 18, H = yB + m.baris.length * tb + pad;
    o.push(S.rect(x0 + m.V * kol + 2, y0 - 2, kol - 4, H - y0 - pad + 2, { rx: 5, isi: BH.latarJawab }));
    for (var t = 0; t < V1; t++) o.push(teksB('Kotak ' + (t + 1), x0 + t * kol + kol / 2, y0 + 10, { ukuran: 10, tebal: true, rata: 'middle', isi: t === m.V ? BH.jawab : BH.teks }));
    m.baris.forEach(function (b, i) {
      var y = yB + i * tb, w = WARNA[i % WARNA.length];
      o.push(S.garis(pad, y, W - pad, y, { garis: '#e1e5ee', tebal: 1 }));
      o.push(teksB(Fmt.kapital(NAMA_PENANDA[b.j]), pad + 2, y + 18, { ukuran: 12, tebal: true, isi: w }));
      o.push(paragrafB(b.ringkas, pad + 2, y + 34, kiri - 14, { ukuran: 10, isi: BH.teksRedup }).svg);
      for (var t2 = 0; t2 < V1; t2++) {
        var cx = x0 + t2 * kol + kol / 2, cy = y + 44;
        o.push(mukaJam(cx, cy, r, { tebal: 1.3 }));
        o.push(penandaSvg(b.j, b.sudut[t2], cx, cy, r, w));
        if (b.j === 'panjang' || b.j === 'pendek') o.push(S.lingkaran(cx, cy, 2, { isi: TINTA }));
        if (t2 > 0) {
          var dd = b.langkah[t2 - 1];
          if (dd !== 0) { var a0 = b.sudut[t2 - 1] * 45; o.push(S.busurPanah(cx, cy, r + 8, a0, a0 + dd * 45, { warna: w, tebal: 1.8, kepala: 6 })); }
          o.push(teksB(langkahTeks(dd), cx, y + 14, { ukuran: 10, tebal: true, rata: 'middle', isi: w }));
        }
        o.push(teksB(derajat(b.sudut[t2]), cx, cy + r + 21, { ukuran: 10, tebal: t2 === m.V, rata: 'middle', isi: t2 === m.V ? BH.jawab : BH.teks }));
      }
    });
    return { svg: S.doc(o.join(''), W, H, { latar: '#ffffff' }), lebar: W, tinggi: H };
  }

  function svgJarumJawab(m, judul) {
    var pad = 8, B = 156, sela = 56, y0 = pad + 26 + 16, o = [teksB(judul, pad, pad + 13, { ukuran: 13, tebal: true })];
    var x1 = pad, x2 = pad + B + sela, R = B * 0.28, cx = x2 + B / 2, cy = y0 + B / 2, cincin = 0;
    o.push(teksB('Kotak ' + m.V, x1 + B / 2, y0 - 6, { rata: 'middle', tebal: true }));
    o.push(teksB('Kotak ' + (m.V + 1) + ' (jawaban)', x2 + B / 2, y0 - 6, { rata: 'middle', tebal: true, isi: BH.jawab }));
    o.push(S.rect(x1, y0, B, B, { isi: '#ffffff', garis: TEPI, tebal: 1.6 }) + jamSvg(m.sebelum, x1 + B / 2, y0 + B / 2, R));
    o.push(S.rect(x2, y0, B, B, { isi: BH.latarJawab, garis: BH.jawab, tebal: 2.6 }) + jamSvg(m.jawaban.penanda, cx, cy, R, { latar: '#ffffff' }));
    o.push(S.panah(x1 + B + 10, y0 + B / 2, x2 - 10, y0 + B / 2, { warna: BH.panah, tebal: 2.2, kepala: 9 }));
    var awal = {};
    m.sebelum.forEach(function (p) { awal[p.j] = p.a; });
    m.langkah.forEach(function (l) {
      if (l.d === 0) return;
      var w = WARNA[l.warna % WARNA.length], a0 = awal[l.j] * 45;
      o.push(S.busurPanah(cx, cy, R * 1.36 + 4 + (cincin++) * 6.5, a0, a0 + l.d * 45, { warna: w, tebal: 2, kepala: 7, halo: true }));
    });
    var W = lebarJudul(judul, x2 + B + pad), y = y0 + B + 18;
    m.langkah.forEach(function (l) {
      var w = WARNA[l.warna % WARNA.length], p = paragrafB(l.teks, pad + 16, y, W - 2 * pad - 16, { ukuran: 11, isi: w });
      o.push(S.rect(pad, y - 9, 10, 10, { isi: w }));
      o.push(p.svg);
      y += p.baris * 14 + 4;
    });
    var H = y + pad - 6;
    return { svg: S.doc(o.join(''), W, H, { latar: '#ffffff' }), lebar: W, tinggi: H };
  }

  // ------------------------------------------------------------- butir jarum

  function figJarum(mk, arah) { return { penanda: urutPenanda(mk.map(function (p, i) { return { j: p.j, a: mod(arah[i], 8) }; })) }; }

  function buatJarum(id, level, benih, opsi) {
    var a = Rng.alat(benih);
    var target = opsi.target == null ? a.bulat(0, 4) : opsi.target;
    for (var coba = 0; coba < 80; coba++) {
      var sj2 = susunJarum(a, level, opsi.polaDipakai, coba);
      if (!sj2) continue;
      var V = sj2.V, mk = sj2.mk;
      var peng = pengecohJarum(a, level, V, mk);
      if (!peng) continue;
      var kunci = figJarum(mk, mk.map(function (p) { return p.arah[V]; }));
      var kotak = rentang(V).map(function (t) { return figJarum(mk, mk.map(function (p) { return p.arah[t]; })).penanda; });

      var pem = ['Setiap kotak berisi muka jam dengan delapan garis penanda arah (tiap 45°) dan ' + mk.length + ' penanda: ' + daftarKata(mk.map(function (p) { return NAMA_PENANDA[p.j]; })) +
        '. Arah ditulis sebagai sudut dari arah atas (0°) searah jarum jam, dan setiap penanda berputar menurut aturannya sendiri.'];
      mk.forEach(function (p) {
        var Nm = Fmt.kapital(NAMA_PENANDA[p.j]);
        pem.push('• ' + Nm + ': pada kotak 1 sampai ' + V + ' menunjuk ' + daftarKata(p.arah.slice(0, V).map(derajat)) + '. ' + uraianAturanJarum(p, V) + '. Dari kotak ' + V + ' ia ' + gerakAkhirJarum(p, V) +
          ', sehingga pada kotak ' + (V + 1) + ' ' + NAMA_PENANDA[p.j] + ' menunjuk ' + derajat(p.arah[V]) + ' (' + ARAH8[p.arah[V]] + ').');
      });
      pem.push('Gambar 1 menyajikan sudut setiap penanda pada tiap kotak; busur berpanah menunjukkan besar dan arah putaran dari kotak sebelumnya, dan kolom hijau adalah kotak ' + (V + 1) +
        '. Gambar 2 membandingkan kotak ' + V + ' dengan kotak ' + (V + 1) + ' (jawaban) beserta putaran setiap penanda.');
      pem.push('Jadi kotak berikutnya: ' + daftarKata(mk.map(function (p) { return NAMA_PENANDA[p.j] + ' menunjuk ke ' + ARAH8[p.arah[V]]; })) + '.');

      var daftar = a.kocok(peng.map(function (p) { return { fig: figJarum(mk, p.arah), alasan: p.alasan, kunci: false }; }));
      daftar.splice(target, 0, { fig: kunci, alasan: null, kunci: true });
      var opsiGambar = daftar.map(function (d, i) {
        return { teks: 'Gambar opsi ' + Fmt.huruf(i), nilai: i, alasan: d.alasan, kunci: d.kunci,
          gambar: { id: 'opsi-' + Fmt.huruf(i).toLowerCase(), jenis: 'jarum-opsi', model: { fig: d.fig }, judul: 'Opsi ' + Fmt.huruf(i) } };
      });
      var bagian = kotak.concat([kunci.penanda]).map(function (pn) { return pn.map(function (x) { return x.j + ':' + x.a; }).join(';'); });
      var ctx = { subtes: 'ku', submateri: 'figural', keluarga: id, level: level, benih: benih, a: a };
      var butir = Butir.rakitPg(ctx, {
        jenisSoal: 'Figural Serial - The Next Box (jarum berputar)',
        judul: 'Figural Serial - The Next Box', teks: [], pertanyaan: '', perintah: PERINTAH,
        gambar: [{ id: 'soal', jenis: 'jarum-deret', model: { kotak: kotak, ukuran: ukuranKotak(V) }, judul: 'Deret muka jam' }],
        pilihanJadi: { opsi: opsiGambar, kunciIndex: target }, tulisKunci: false,
        langkah: [], pembahasan: pem,
        model: { topik: 'Figural', tipe: 'serial-jarum', kotak: kotak, pilihan: daftar.map(function (d) { return d.fig; }), kunciIndex: target },
        sidik: { inti: 'serial-jarum|' + bagian.join('/'), param: [], entitas: sj2.pola }
      });
      if (!butir) continue;
      butir.gambarPembahasan = [
        { id: 'bahas-1', jenis: 'jarum-tabel', judul: 'Gambar 1. Sudut tiap penanda dari kotak 1 sampai kotak ' + (V + 1),
          model: { V: V, baris: mk.map(function (p) { return { j: p.j, sudut: p.arah, langkah: p.d.slice(1), ringkas: ringkasAturanJarum(p) }; }) } },
        { id: 'bahas-2', jenis: 'jarum-jawab', judul: 'Gambar 2. Kotak ' + V + ' dan kotak ' + (V + 1) + ' (jawaban)',
          model: { V: V, sebelum: kotak[V - 1], jawaban: kunci,
            langkah: mk.map(function (p, i) { return { j: p.j, d: p.d[V], warna: i, teks: teksJawabJarum(p, V) }; }) } }
      ];
      butir.pola = sj2.pola;
      butir.kategoriRiset = 'pengayaan';
      butir.catatanRiset = 'Deret muka jam dengan penanda yang berputar menurut langkah sudutnya sendiri, pengembangan bab Figural Serial - The Next Box di Kerangka Course; tidak ada pada contoh riset BAB V.';
      return butir;
    }
    return null;
  }

  // ===================================================================== API

  function buat(id, level, benih, opsi) {
    opsi = opsi || {};
    if (id === 'serial-petak') return buatPetak(id, level, benih, opsi);
    if (id === 'serial-jarum') return buatJarum(id, level, benih, opsi);
    return null;
  }

  var KELUARGA = [
    { id: 'serial-petak', nama: 'Deret benda bergerak di petak (lintasan dan langkah tiap benda)', submateri: 'figural', kolam: 'serial' },
    { id: 'serial-jarum', nama: 'Deret jarum berputar (langkah sudut tiap penanda)', submateri: 'figural', kolam: 'serial' }
  ];

  var GAMBAR = {
    'petak-deret': function (m) { return svgPetakDeret(m); },
    'petak-opsi': function (m) { return svgPetakOpsi(m); },
    'petak-lintasan': svgPetakLintasan,
    'petak-jawab': svgPetakJawab,
    'jarum-deret': function (m) { return svgJarumDeret(m); },
    'jarum-opsi': function (m) { return svgJarumOpsi(m); },
    'jarum-tabel': svgJarumTabel,
    'jarum-jawab': svgJarumJawab
  };

  return { KELUARGA: KELUARGA, PERINTAH: PERINTAH, buat: buat, GAMBAR: GAMBAR };
});
