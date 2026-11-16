/*
 * matriks-bentuk.js — Kemampuan Umum > Figural > Kotak 3x3 (PENGAYAAN): bentuk luar-dalam dan
 * hitungan unsur.
 *
 * Dua keluarga, keduanya matriks 3x3 dengan satu kotak "?" dan lima pilihan bergambar.
 *
 *   matriks-luar-dalam  Tiap kotak berisi satu bentuk LUAR yang besar dan satu bentuk DALAM yang
 *                       kecil (lingkaran, persegi, segitiga, segi lima, segi enam, belah ketupat,
 *                       bintang). Bentuk dalam boleh berwarna (putih, abu-abu, hitam) dan boleh
 *                       berpindah letak (atas, kanan, bawah, kiri). Aturan bentuk menghubungkan
 *                       bentuk luar dan bentuk dalam ANTARKOTAK, jadi berbeda dari matriks-3:
 *                         geser        bentuk dalam kotak kiri menjadi bentuk luar kotak di
 *                                      kanannya; bentuk dalam kotak kanan = bentuk luar kotak kiri
 *                         geser-kiri   arah sebaliknya (dalam kotak kanan menjadi luar kotak kiri)
 *                         geser-tegak  dalam kotak atas menjadi luar kotak di bawahnya
 *                         tukar        kotak tengah = kotak kiri dengan luar dan dalam bertukar,
 *                                      kotak kanan menukarnya kembali (tukar-tegak: per kolom)
 *                         gabung-ld    kotak kanan = luar kotak kiri + dalam kotak tengah
 *                         gabung-dl    kotak kanan = dalam kotak kiri (jadi luar) + luar kotak
 *                                      tengah (jadi dalam)
 *                       Kanal tambahan: warna bentuk dalam (sama per kolom, sama per baris, latin,
 *                       atau mengikuti bentuk dalamnya) dan letak bentuk dalam (berputar searah atau
 *                       berlawanan arah jarum jam per baris/kolom, atau sama per kolom/baris).
 *                       mudah  : geser atau tukar saja, "?" di kanan bawah
 *                       sedang : bentuk + satu kanal (warna atau letak), "?" di tepi kanan/bawah
 *                       sulit  : bentuk + warna + letak, atau aturan bentuk yang lebih jauh (tegak,
 *                                gabung, geser ke kiri) dengan "?" di kotak mana pun (sering di tengah)
 *
 *   matriks-jumlah      Tiap kotak berisi unsur yang dapat dihitung (titik hitam, titik putih,
 *                       kotak kecil, segitiga kecil, garis pendek, bintang kecil, belah ketupat kecil,
 *                       tanda silang, atau bangun bersisi banyak dengan unsur di dalamnya), paling
 *                       banyak 9 per jenis, disusun seperti mata dadu (garis: satu baris berkelompok
 *                       lima). Jenis unsur boleh sama di seluruh matriks atau berganti per garis aturan
 *                       (tiap baris/kolom satu jenis); yang dihitung tetap banyaknya.
 *                       mudah  : satu jenis unsur per kotak; kolom 3 = kolom 1 + kolom 2, kotak bawah =
 *                                atas + tengah, kolom 1 = kolom 2 + kolom 3, atau deret aritmetika per baris
 *                       sedang : selisih (per baris/kolom), jumlah sebaris tetap, penjumlahan dengan "?"
 *                                di kotak yang dijumlahkan, atau banyak unsur di dalam bangun = banyak
 *                                sisinya (atau selisih tetap) dengan sisi berpola deret/jumlah tetap
 *                       sulit  : dua jenis unsur dengan aturan berbeda (mis. titik hitam dijumlah, titik
 *                                putih dikurang), aturan baris dan kolom sekaligus (selisih antarbaris tetap
 *                                di tiap kolom, atau operasi baris + operasi kolom), atau sisi bangun dan
 *                                unsur di dalamnya dengan aturan masing-masing
 *
 * Penyusun membangun matriks menurut aturan, lalu MEMASTIKAN aturan itu dapat ditebak tunggal dari
 * delapan kotak yang tampak: pustaka aturan penyusun (pola letak, pemetaan antarkotak, aturan
 * hitungan baris/kolom, hubungan antarjenis) dicoba semua, dan soal hanya dipakai bila semua aturan
 * yang cocok memberi isi "?" yang sama; soal dengan pola yang patah pada satu garis juga dibuang.
 * Pemeriksa independennya ada di cek-matriks-bentuk.js.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./rng.js'), require('./svg.js'), require('./butir.js'), require('./format.js'), require('./metrik.js'));
    module.exports = api;
  } else {
    api = factory(root.Rng, root.Svg, root.Butir, root.Fmt, root.Metrik);
    root.MatriksBentuk = api;
  }
})(typeof self !== 'undefined' ? self : this, function (Rng, S, Butir, Fmt, Metrik) {
  'use strict';

  var PERINTAH = 'Gunakan gambar di bagian atas untuk menentukan jawaban yang benar dari pilihan di bawah. Pilih jawaban yang menggantikan tanda tanya. Jika tidak ada tanda tanya, pilih jawaban yang merupakan kelanjutan dari urutan tersebut.';
  var TINTA = '#1d1d1d', TEPI = '#4a5266', BINGKAI = '#7b8499', LATAR_TANYA = '#f4f6fb';
  var BH = S.BAHAS;

  function salin(x) { return JSON.parse(JSON.stringify(x)); }
  function sj(x) { return JSON.stringify(x); }
  function jumlahArr(xs) { return xs.reduce(function (s, x) { return s + x; }, 0); }
  function transpos(V) { return [0, 1, 2].map(function (r) { return [0, 1, 2].map(function (c) { return V[c][r]; }); }); }
  function rentang(lo, hi) { var o = []; for (var i = lo; i <= hi; i++) o.push(i); return o; }
  function mod(a, n) { return ((a % n) + n) % n; }

  // ================================================================ gambar umum

  /** Satu kotak berbingkai; isi digambar pada koordinat 0..100. */
  function kotak(x, y, u, isi, o) {
    o = o || {};
    return S.kelompok(S.rect(0.8, 0.8, 98.4, 98.4, { isi: o.latar || '#ffffff', garis: o.tepi || BINGKAI, tebal: o.tebalTepi || 1.6 }) + isi, x, y, u / 100);
  }

  function kotakTanya(x, y, u) {
    return S.kelompok(S.rect(0.8, 0.8, 98.4, 98.4, { isi: LATAR_TANYA, garis: BINGKAI, tebal: 1.6 }) +
      S.teks('?', 50, 72, { ukuran: 64, tebal: true, isi: TEPI, rata: 'middle' }), x, y, u / 100);
  }

  /** Matriks 3x3 dengan satu kotak "?" (tanya = [baris, kolom]). */
  function svgMatriks(grid, tanya, isiSel) {
    var u = 112, pad = 6, o = [];
    for (var r = 0; r < 3; r++) {
      for (var c = 0; c < 3; c++) {
        if (r === tanya[0] && c === tanya[1]) o.push(kotakTanya(pad + c * u, pad + r * u, u));
        else o.push(kotak(pad + c * u, pad + r * u, u, isiSel(grid[r][c])));
      }
    }
    o.push(S.rect(pad, pad, 3 * u, 3 * u, { isi: 'none', garis: TEPI, tebal: 2.4 }));
    var W = pad * 2 + 3 * u;
    return { svg: S.doc(o.join(''), W, W, { latar: '#ffffff' }), lebar: W, tinggi: W };
  }

  function svgOpsi(sel, isiSel) {
    var u = 130, pad = 4, W = u + pad * 2;
    return { svg: S.doc(kotak(pad, pad, u, isiSel(sel)), W, W, { latar: '#ffffff' }), lebar: W, tinggi: W };
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

  var NAMA_BARIS = ['baris 1', 'baris 2', 'baris 3'], NAMA_KOLOM = ['kolom 1', 'kolom 2', 'kolom 3'];
  function namaLetak(r, c) { return 'baris ' + (r + 1) + ', kolom ' + (c + 1); }

  // ================================================================ LUAR-DALAM

  var BENTUK = ['lingkaran', 'persegi', 'segitiga', 'segilima', 'segienam', 'ketupat', 'bintang'];
  var NAMA_BENTUK = { lingkaran: 'lingkaran', persegi: 'persegi', segitiga: 'segitiga', segilima: 'segi lima', segienam: 'segi enam', ketupat: 'belah ketupat', bintang: 'bintang' };
  // bentuk luar yang cukup lapang untuk bentuk dalam yang berpindah letak
  var LAPANG = ['lingkaran', 'persegi', 'segilima', 'segienam', 'ketupat'];
  var WARNA = ['putih', 'abu', 'hitam'];
  var NAMA_WARNA = { putih: 'putih', abu: 'abu-abu', hitam: 'hitam' };
  var ISI_WARNA = { putih: '#ffffff', abu: '#a3a3a3', hitam: '#262626' };
  var POSISI = ['atas', 'kanan', 'bawah', 'kiri'];
  var ARAH_POSISI = { atas: [0, -1], kanan: [1, 0], bawah: [0, 1], kiri: [-1, 0] };
  var S_LUAR = 44, S_DALAM = 12.5, JARAK_POSISI = 19;

  function NB(b) { return NAMA_BENTUK[b]; }

  /** Titik sudut poligon bentuk berjari s di sekitar (cx, cy); lingkaran didekati segi-48. */
  function poligon(nama, cx, cy, s) {
    var p = [], i, a, R;
    function keliling(n, R, a0) { for (var k = 0; k < n; k++) { var t = (a0 + 360 * k / n) * Math.PI / 180; p.push([cx + R * Math.cos(t), cy + R * Math.sin(t)]); } return p; }
    if (nama === 'lingkaran') return keliling(48, 0.9 * s, 0);
    if (nama === 'persegi') { a = 0.82 * s; return [[cx - a, cy - a], [cx + a, cy - a], [cx + a, cy + a], [cx - a, cy + a]]; }
    if (nama === 'segitiga') return keliling(3, 1.05 * s, -90);
    if (nama === 'segilima') return keliling(5, 1.0 * s, -90);
    if (nama === 'segienam') return keliling(6, 0.98 * s, 0);
    if (nama === 'ketupat') return [[cx, cy - 1.05 * s], [cx + 0.86 * s, cy], [cx, cy + 1.05 * s], [cx - 0.86 * s, cy]];
    if (nama === 'bintang') {
      R = 1.08 * s;
      for (i = 0; i < 10; i++) { a = (-90 + 36 * i) * Math.PI / 180; var r = i % 2 ? 0.5 * R : R; p.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
      return p;
    }
    throw new Error('bentuk tidak dikenal: ' + nama);
  }

  /** Pusat bentuk luar (= pusat lingkaran dalamnya) supaya kotak pembatasnya di tengah kotak. */
  function pusatLuar(nama) {
    var k = (1 - Math.cos(Math.PI / 5)) / 2;
    if (nama === 'segitiga') return [50, 50 + 1.05 * S_LUAR / 4];
    if (nama === 'segilima') return [50, 50 + 1.0 * S_LUAR * k];
    if (nama === 'bintang') return [50, 50 + 1.08 * S_LUAR * k];
    return [50, 50];
  }

  function pusatDalam(sel) {
    var p = pusatLuar(sel.luar);
    if (!sel.posisi) return p;
    // belah ketupat menyempit ke arah sudutnya, jadi bentuk dalamnya digeser lebih sedikit
    var g = ARAH_POSISI[sel.posisi], j = sel.luar === 'ketupat' ? 15 : JARAK_POSISI;
    return [p[0] + g[0] * j, p[1] + g[1] * j];
  }

  function gambarBentuk(nama, cx, cy, s, gaya) {
    if (nama === 'lingkaran') return S.lingkaran(cx, cy, 0.9 * s, gaya);
    return S.poli(poligon(nama, cx, cy, s), Object.assign({ tutup: true, sambung: 'round' }, gaya));
  }

  /** Isi satu kotak luar-dalam (koordinat 0..100). */
  function isiLD(sel) {
    var p = pusatLuar(sel.luar), q = pusatDalam(sel);
    return gambarBentuk(sel.luar, p[0], p[1], S_LUAR, { isi: '#ffffff', garis: TINTA, tebal: 2.6 }) +
      gambarBentuk(sel.dalam, q[0], q[1], S_DALAM, { isi: ISI_WARNA[sel.warna || 'putih'], garis: TINTA, tebal: 2 });
  }

  /** Kotak luar-dalam dengan urutan kunci tetap (dibandingkan sebagai JSON). */
  function selLD(luar, dalam, warna, posisi) {
    var c = { luar: luar, dalam: dalam };
    if (warna) c.warna = warna;
    if (posisi) c.posisi = posisi;
    return c;
  }

  // relasi tiap mekanisme pada satu garis (baris; kolom bila tegak): [kotak, slot] sama dengan [kotak, slot]
  var REL_GESER = [[[1, 'luar'], [0, 'dalam']], [[2, 'luar'], [1, 'dalam']], [[2, 'dalam'], [0, 'luar']]];
  var REL_TUKAR = [[[1, 'luar'], [0, 'dalam']], [[1, 'dalam'], [0, 'luar']], [[2, 'luar'], [1, 'dalam']], [[2, 'dalam'], [1, 'luar']]];
  var MEK = {
    geser: { tegak: false, relasi: REL_GESER },
    'geser-kiri': { tegak: false, relasi: [[[0, 'luar'], [1, 'dalam']], [[1, 'luar'], [2, 'dalam']], [[0, 'dalam'], [2, 'luar']]] },
    'geser-tegak': { tegak: true, relasi: REL_GESER },
    tukar: { tegak: false, relasi: REL_TUKAR },
    'tukar-tegak': { tegak: true, relasi: REL_TUKAR },
    'gabung-ld': { tegak: false, relasi: [[[2, 'luar'], [0, 'luar']], [[2, 'dalam'], [1, 'dalam']]], hanyaUjung: true },
    'gabung-dl': { tegak: false, relasi: [[[2, 'luar'], [0, 'dalam']], [[2, 'dalam'], [1, 'luar']]], hanyaUjung: true }
  };

  function garisBentuk(a, mek, pool) {
    var x;
    if (mek === 'geser' || mek === 'geser-tegak') { x = a.ambil(pool, 3); return [selLD(x[0], x[1]), selLD(x[1], x[2]), selLD(x[2], x[0])]; }
    if (mek === 'geser-kiri') { x = a.ambil(pool, 3); return [selLD(x[0], x[1]), selLD(x[2], x[0]), selLD(x[1], x[2])]; }
    if (mek === 'tukar' || mek === 'tukar-tegak') { x = a.ambil(pool, 2); return [selLD(x[0], x[1]), selLD(x[1], x[0]), selLD(x[0], x[1])]; }
    x = a.ambil(pool, 4);
    if (mek === 'gabung-ld') return [selLD(x[0], x[1]), selLD(x[2], x[3]), selLD(x[0], x[3])];
    return [selLD(x[0], x[1]), selLD(x[2], x[3]), selLD(x[1], x[2])];
  }

  function bangunBentukLD(a, mek, pool) {
    var garis = [], lihat = {};
    for (var i = 0; i < 3; i++) {
      var g = null, k = null;
      for (var coba = 0; coba < 20; coba++) { g = garisBentuk(a, mek, pool); k = sj(g); if (!lihat[k]) break; }
      if (lihat[k]) return null;
      lihat[k] = 1;
      garis.push(g);
    }
    if (!MEK[mek].tegak) return garis;
    return transpos(garis);
  }

  function bangunWarnaLD(a, aturan, grid) {
    var p = a.kocok(WARNA), r, c, w = [[], [], []];
    if (aturan === 'ikut') {
      var peta = {};
      BENTUK.forEach(function (b) { peta[b] = a.pilih(WARNA); });
      return grid.map(function (row) { return row.map(function (x) { return peta[x.dalam]; }); });
    }
    var s = a.pilih([1, 2]);
    for (r = 0; r < 3; r++) for (c = 0; c < 3; c++) w[r][c] = aturan === 'kolom' ? p[c] : (aturan === 'baris' ? p[r] : p[(c + s * r) % 3]);
    return w;
  }

  function bangunPosisiLD(a, aturan) {
    var r, c, w = [[], [], []];
    if (aturan === 'putar' || aturan === 'putar-tegak') {
      var k = a.pilih([1, 3]), mulai = [a.bulat(0, 3), a.bulat(0, 3), a.bulat(0, 3)];
      for (r = 0; r < 3; r++) for (c = 0; c < 3; c++) w[r][c] = aturan === 'putar' ? POSISI[(mulai[r] + k * c) % 4] : POSISI[(mulai[c] + k * r) % 4];
      return { g: w, k: k };
    }
    var p = a.ambil(POSISI, 3);
    for (r = 0; r < 3; r++) for (c = 0; c < 3; c++) w[r][c] = aturan === 'kolom' ? p[c] : p[r];
    return { g: w, k: null };
  }

  // ---------------------------------------------- tebakan aturan (pustaka penyusun)

  var JENIS_SLOT = { luar: 'bentuk', dalam: 'bentuk', warna: 'warna', posisi: 'posisi' };
  var RANAH_LD = { luar: BENTUK, dalam: BENTUK, warna: WARNA, posisi: POSISI };
  var SIKLUS_LD = { warna: WARNA, posisi: POSISI };

  function himpunan3(b) { return b[0] !== b[1] && b[1] !== b[2] && b[0] !== b[2] ? b.slice().sort().join('|') : null; }

  var POLA_LETAK = {
    'semua-sama': function (V) { return V.every(function (b) { return b.every(function (x) { return x === V[0][0]; }); }); },
    'baris-tetap': function (V) { return V.every(function (b) { return b[0] === b[1] && b[1] === b[2]; }); },
    'kolom-tetap': function (V) { return POLA_LETAK['baris-tetap'](transpos(V)); },
    'latin-baris': function (V) { var s = himpunan3(V[0]); return !!s && V.every(function (b) { return himpunan3(b) === s; }); },
    'latin-kolom': function (V) { return POLA_LETAK['latin-baris'](transpos(V)); },
    diagonal: function (V) { return diagSama(V, 1); },
    'diagonal-balik': function (V) { return diagSama(V, -1); }
  };

  function diagSama(V, t) {
    var wakil = {};
    for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) {
      var g = mod(c + t * r, 3);
      if (wakil[g] === undefined) wakil[g] = V[r][c]; else if (wakil[g] !== V[r][c]) return false;
    }
    return true;
  }

  function langkahGaris(idx, n, bebas) {
    var k = null;
    for (var r = 0; r < 3; r++) {
      var d1 = mod(idx[r][1] - idx[r][0], n), d2 = mod(idx[r][2] - idx[r][1], n);
      if (d1 !== d2) return false;
      if (!bebas) { if (d1 === 0) return false; if (k === null) k = d1; else if (k !== d1) return false; }
    }
    return true;
  }

  function polaSiklus(nama, V, urut) {
    var idx = V.map(function (b) { return b.map(function (x) { return urut.indexOf(x); }); }), n = urut.length;
    if (nama === 'langkah-baris') return langkahGaris(idx, n, false);
    if (nama === 'langkah-kolom') return langkahGaris(transpos(idx), n, false);
    if (nama === 'langkah-bebas-baris') return langkahGaris(idx, n, true);
    return langkahGaris(transpos(idx), n, true);
  }

  function tampakPertama(G) { for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) if (G[r][c]) return G[r][c]; return null; }

  /** Peta nilai slot X -> nilai slot Y dari kotak tampak, bila berlaku sebagai aturan "Y mengikuti X". */
  function fungsiLD(G, X, Y) {
    var grup = {};
    G.forEach(function (b) { b.forEach(function (x) { if (x) (grup[x[X]] = grup[x[X]] || []).push(x[Y]); }); });
    var peta = {}, ulang = 0, nilai = {};
    for (var k in grup) {
      var g = grup[k];
      if (g.some(function (v) { return v !== g[0]; })) return null;
      peta[k] = g[0];
      if (g.length >= 2) { ulang++; nilai[g[0]] = 1; }
    }
    return ulang >= 2 && Object.keys(nilai).length >= 2 ? peta : null;
  }

  /**
   * Isi kotak "?" menurut SEMUA aturan pustaka yang cocok dengan kotak tampak; null bila tidak tunggal.
   * Tiap slot dihitung sendiri: pola letak, langkah melingkar (warna/letak), dan pemetaan slot sejenis
   * pada baris atau kolom yang sama; lalu aturan "warna/letak mengikuti bentuk".
   */
  function ramalLD(G, tr, tc) {
    var contoh = tampakPertama(G), slot = Object.keys(contoh), C = {}, gagal = false;
    slot.forEach(function (X) {
      var V = G.map(function (b) { return b.map(function (x) { return x ? x[X] : null; }); }), calon = RANAH_LD[X].slice();
      function iris(d) { if (d.length) calon = calon.filter(function (v) { return d.indexOf(v) >= 0; }); }
      function uji(f) {
        return RANAH_LD[X].filter(function (v) { var W = V.map(function (b) { return b.slice(); }); W[tr][tc] = v; return f(W); });
      }
      Object.keys(POLA_LETAK).forEach(function (nm) { iris(uji(POLA_LETAK[nm])); });
      if (SIKLUS_LD[X]) ['langkah-baris', 'langkah-kolom', 'langkah-bebas-baris', 'langkah-bebas-kolom'].forEach(function (nm) { iris(uji(function (W) { return polaSiklus(nm, W, SIKLUS_LD[X]); })); });
      slot.filter(function (Y) { return JENIS_SLOT[Y] === JENIS_SLOT[X]; }).forEach(function (Y) {
        for (var j = 0; j < 3; j++) {
          var ok;
          if (j !== tc) {
            ok = [0, 1, 2].every(function (r) { return r === tr || G[r][tc][X] === G[r][j][Y]; });
            if (ok) iris([G[tr][j][Y]]);
          }
          if (j !== tr) {
            ok = [0, 1, 2].every(function (c) { return c === tc || G[tr][c][X] === G[j][c][Y]; });
            if (ok) iris([G[j][tc][Y]]);
          }
        }
      });
      if (!calon.length) gagal = true;
      C[X] = calon;
    });
    if (gagal || C.luar.length !== 1 || C.dalam.length !== 1 || C.luar[0] === C.dalam[0]) return null;
    ['warna', 'posisi'].forEach(function (Y) {
      if (!C[Y]) return;
      ['luar', 'dalam'].forEach(function (X) {
        var f = fungsiLD(G, X, Y);
        if (f && Object.prototype.hasOwnProperty.call(f, C[X][0])) C[Y] = C[Y].filter(function (v) { return v === f[C[X][0]]; });
      });
    });
    if (slot.some(function (X) { return C[X].length !== 1; })) return null;
    return selLD(C.luar[0], C.dalam[0], C.warna ? C.warna[0] : null, C.posisi ? C.posisi[0] : null);
  }

  /**
   * Pola terputus: aturan per garis (pola letak, langkah, pemetaan slot sejenis) yang berlaku pada semua
   * baris/kolom lengkap tetapi sudah dilanggar kotak tampak pada garis bertanda tanya. Soal seperti ini
   * dibuang karena peserta melihat pola yang patah.
   */
  function putusLD(G, tr, tc) {
    var slot = Object.keys(tampakPertama(G)), rL = tr === 0 ? 1 : 0, cL = tc === 0 ? 1 : 0, putus = false;
    var gB = G.map(function (b, r) { return (r === tr ? G[rL] : b).slice(); });
    var gK = G.map(function (b) { return b.map(function (x, c) { return c === tc ? b[cL] : x; }); });
    function nilai(GG, X) { return GG.map(function (b) { return b.map(function (x) { return x ? x[X] : null; }); }); }
    function cek(f, X, arah) {
      if (putus || !f(nilai(arah === 'baris' ? gB : gK, X))) return;
      var bisa = RANAH_LD[X].some(function (v) { var W = nilai(G, X); W[tr][tc] = v; return f(W); });
      if (!bisa) putus = true;
    }
    slot.forEach(function (X) {
      cek(POLA_LETAK['baris-tetap'], X, 'baris'); cek(POLA_LETAK['kolom-tetap'], X, 'kolom');
      cek(POLA_LETAK['latin-baris'], X, 'baris'); cek(POLA_LETAK['latin-kolom'], X, 'kolom');
      if (SIKLUS_LD[X]) {
        ['baris', 'kolom'].forEach(function (ar) {
          cek(function (V) { return polaSiklus('langkah-' + ar, V, SIKLUS_LD[X]); }, X, ar);
          cek(function (V) { return polaSiklus('langkah-bebas-' + ar, V, SIKLUS_LD[X]); }, X, ar);
        });
      }
    });
    // pemetaan: kedua ujung tampak pada garis bertanda tanya
    slot.forEach(function (X) {
      slot.forEach(function (Y) {
        if (JENIS_SLOT[X] !== JENIS_SLOT[Y]) return;
        for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) {
          if (i === j && X === Y) continue;
          if (i !== tc && j !== tc && [0, 1, 2].every(function (r) { return r === tr || G[r][i][X] === G[r][j][Y]; }) && G[tr][i][X] !== G[tr][j][Y]) putus = true;
          if (i !== tr && j !== tr && [0, 1, 2].every(function (c) { return c === tc || G[i][c][X] === G[j][c][Y]; }) && G[i][tc][X] !== G[j][tc][Y]) putus = true;
        }
      });
    });
    return putus;
  }

  /** Pasangan slot sejenis yang sama nilainya dalam satu garis (1/0, ? bila kotaknya kosong). */
  function tandaSama(garis, slot) {
    var o = [];
    for (var i = 0; i < 3; i++) for (var j = i; j < 3; j++) slot.forEach(function (X) {
      slot.forEach(function (Y) {
        if (i === j && X >= Y) return;
        o.push(garis[i] && garis[j] ? (garis[i][X] === garis[j][Y] ? 1 : 0) : '?');
      });
    });
    return o;
  }

  /**
   * Soal dibuang bila sebuah kelompok slot (bentuk, warna, letak) tidak punya arah (baris atau kolom) yang
   * semua garisnya memiliki pola kesamaan yang sama; warna/letak yang mengikuti bentuk dikecualikan.
   */
  function retakLD(G, tr, tc) {
    var slot = Object.keys(tampakPertama(G)), kel = [['luar', 'dalam']];
    if (slot.indexOf('warna') >= 0 && !fungsiLD(G, 'dalam', 'warna') && !fungsiLD(G, 'luar', 'warna')) kel.push(['warna']);
    if (slot.indexOf('posisi') >= 0 && !fungsiLD(G, 'dalam', 'posisi') && !fungsiLD(G, 'luar', 'posisi')) kel.push(['posisi']);
    return kel.some(function (k) {
      return !['baris', 'kolom'].some(function (ar) {
        var gs = [0, 1, 2].map(function (i) { return ar === 'baris' ? G[i] : [G[0][i], G[1][i], G[2][i]]; }), iT = ar === 'baris' ? tr : tc;
        var lengkap = [0, 1, 2].filter(function (i) { return i !== iT; }).map(function (i) { return tandaSama(gs[i], k); });
        if (sj(lengkap[0]) !== sj(lengkap[1])) return false;
        return tandaSama(gs[iT], k).every(function (v, n) { return v === '?' || v === lengkap[0][n]; });
      });
    });
  }

  // ---------------------------------------------- rencana per tingkat

  function rencanaLD(a, level, dipakai) {
    var semua = [];
    function tambah(mek, warna, posisi, bobot) { for (var i = 0; i < (bobot || 1); i++) semua.push({ mek: mek, warna: warna, posisi: posisi }); }
    if (level === 'mudah') { tambah('geser', null, null, 4); tambah('geser-tegak', null, null, 3); tambah('tukar', null, null, 1); tambah('tukar-tegak', null, null, 1); }
    else if (level === 'sedang') {
      ['geser', 'geser-kiri', 'tukar'].forEach(function (m) {
        ['kolom', 'baris', 'latin'].forEach(function (w) { tambah(m, w, null, m === 'tukar' ? 1 : 2); });
        ['putar', 'kolom', 'baris'].forEach(function (p) { tambah(m, null, p, m === 'tukar' ? 1 : 2); });
      });
    } else {
      ['geser', 'geser-kiri', 'geser-tegak', 'tukar', 'tukar-tegak', 'gabung-ld', 'gabung-dl'].forEach(function (m) {
        tambah(m, a.pilih(['kolom', 'baris', 'latin', 'ikut']), a.pilih(['putar', 'putar-tegak', 'kolom']), 2);
        if (m !== 'geser' && m !== 'tukar') {
          tambah(m, a.pilih(['latin', 'ikut', 'kolom']), null, 1);
          tambah(m, null, a.pilih(['putar', 'putar-tegak']), 1);
        }
      });
    }
    var pola = function (p) { return 'matriks-luar-dalam:' + p.mek + (p.warna ? '+warna' : '') + (p.posisi ? '+posisi' : ''); };
    var baru = semua.filter(function (p) { return (dipakai || []).indexOf(pola(p)) < 0; });
    var p = a.pilih(baru.length ? baru : semua);
    p.pola = pola(p);
    return p;
  }

  function pilihTanyaLD(a, level, rencana) {
    if (level === 'mudah') return [2, 2];
    var mek = MEK[rencana.mek];
    if (mek.hanyaUjung) return [a.bulat(0, 2), 2];
    if (level === 'sedang') return a.pilih([[2, 2], [2, 2], [0, 2], [1, 2], [2, 0], [2, 1]]);
    var kanal = (rencana.warna ? 1 : 0) + (rencana.posisi ? 1 : 0);
    if (kanal < 2 && a.untung(0.55)) return [1, 1];
    return [a.bulat(0, 2), a.bulat(0, 2)];
  }

  // ---------------------------------------------- pengecoh

  function sahLD(c) { return c.luar !== c.dalam && (!c.posisi || LAPANG.indexOf(c.luar) >= 0); }

  function uraiSel(c) {
    return NB(c.dalam) + (c.warna ? ' ' + NAMA_WARNA[c.warna] : '') + (c.posisi ? ' di bagian ' + c.posisi : '') + ' di dalam ' + NB(c.luar);
  }

  function namaTetangga(tr, tc, r, c) {
    if (r === tr) return 'kotak di sebelah ' + (c < tc ? 'kiri' : 'kanan') + 'nya';
    return 'kotak di ' + (r < tr ? 'atas' : 'bawah') + 'nya';
  }

  function pengecohLD(a, level, G, tr, tc, kunci, rencana) {
    var calon = [], ada = { warna: !!kunci.warna, posisi: !!kunci.posisi };
    function tambah(sel, jenis, alasan) { if (sahLD(sel)) calon.push({ sel: sel, jenis: jenis, alasan: alasan }); }
    function beda(sel) { return ['luar', 'dalam', 'warna', 'posisi'].filter(function (k) { return sel[k] !== kunci[k]; }); }
    var W = kunci.warna, P = kunci.posisi;
    tambah(selLD(kunci.dalam, kunci.luar, W, P), 'tertukar', 'bentuk luar dan bentuk dalamnya tertukar; seharusnya ' + NB(kunci.dalam) + ' berada di dalam ' + NB(kunci.luar) + ', bukan sebaliknya');
    // salinan kotak tetangga
    [[tr, tc - 1], [tr, tc + 1], [tr - 1, tc], [tr + 1, tc]].forEach(function (rc) {
      var r = rc[0], c = rc[1];
      if (r < 0 || r > 2 || c < 0 || c > 2) return;
      tambah(salin(G[r][c]), 'salin', 'hanya menyalin ' + namaTetangga(tr, tc, r, c) + ' (' + uraiSel(G[r][c]) + ')');
    });
    // bentuk diambil dari tempat yang salah pada garis aturannya
    var tegak = MEK[rencana.mek].tegak, isiGaris = [0, 1, 2].map(function (i) { return tegak ? G[i][tc] : G[tr][i]; }), m = tegak ? tr : tc;
    var nilaiGaris = [];
    isiGaris.forEach(function (x, i) { if (i !== m) { nilaiGaris.push(x.luar); nilaiGaris.push(x.dalam); } });
    nilaiGaris = nilaiGaris.filter(function (v, i) { return nilaiGaris.indexOf(v) === i; });
    nilaiGaris.forEach(function (lu) {
      nilaiGaris.forEach(function (da) {
        if (lu === da || (lu === kunci.luar && da === kunci.dalam)) return;
        var s = selLD(lu, da, W, P), salah = [];
        if (lu !== kunci.luar) salah.push('bentuk luarnya ' + NB(lu) + ', seharusnya ' + NB(kunci.luar));
        if (da !== kunci.dalam) salah.push('bentuk dalamnya ' + NB(da) + ', seharusnya ' + NB(kunci.dalam));
        tambah(s, 'ambil-salah', 'bentuknya diambil dari kotak yang salah pada ' + (tegak ? 'kolom' : 'baris') + ' itu: ' + salah.join('; '));
      });
    });
    // bentuk dari baris (atau kolom) lain
    [0, 1, 2].forEach(function (i) {
      var x = tegak ? (i === tc ? null : G[tr][i]) : (i === tr ? null : G[i][tc]);
      if (!x) return;
      var tempat = tegak ? 'kolom ' + (i + 1) : 'baris ' + (i + 1);
      if (x.luar !== kunci.luar) tambah(selLD(x.luar, kunci.dalam, W, P), 'garis-lain', 'bentuk luarnya ' + NB(x.luar) + ' diambil dari ' + tempat + ', padahal aturan ' + (tegak ? 'kolom' : 'baris') + ' itu menghasilkan ' + NB(kunci.luar));
      if (x.dalam !== kunci.dalam) tambah(selLD(kunci.luar, x.dalam, W, P), 'garis-lain', 'bentuk dalamnya ' + NB(x.dalam) + ' diambil dari ' + tempat + ', padahal aturan ' + (tegak ? 'kolom' : 'baris') + ' itu menghasilkan ' + NB(kunci.dalam));
    });
    // warna salah
    if (ada.warna) {
      WARNA.forEach(function (w) {
        if (w === W) return;
        tambah(selLD(kunci.luar, kunci.dalam, w, P), 'warna', 'bentuknya benar tetapi bentuk dalamnya berwarna ' + NAMA_WARNA[w] + ', padahal pola warna menghendaki ' + NAMA_WARNA[W]);
      });
    }
    // letak salah
    if (ada.posisi) {
      POSISI.forEach(function (p) {
        if (p === P) return;
        tambah(selLD(kunci.luar, kunci.dalam, W, p), 'posisi', 'bentuknya benar tetapi bentuk dalamnya berada di bagian ' + p + ', padahal pola letak menghendaki bagian ' + P);
      });
    }
    // gabungan: bentuk tertukar dan kanal lain salah (sulit)
    if (ada.warna && ada.posisi) {
      var w2 = a.pilih(WARNA.filter(function (w) { return w !== W; })), p2 = a.pilih(POSISI.filter(function (p) { return p !== P; }));
      tambah(selLD(kunci.luar, kunci.dalam, w2, p2), 'warna-posisi', 'bentuknya benar, tetapi warna (' + NAMA_WARNA[w2] + ') dan letak bentuk dalamnya (' + p2 + ') tidak mengikuti polanya');
    }
    // pilih empat: utamakan jenis yang mewakili tiap kanal
    var lihat = {}, hasil = [];
    lihat[sj(kunci)] = 1;
    function ambil(fn) {
      var c = a.kocok(calon.filter(function (x) { return !lihat[sj(x.sel)] && fn(x); }))[0];
      if (!c || hasil.length >= 4) return;
      lihat[sj(c.sel)] = 1;
      hasil.push(c);
    }
    var hanya = function (k) { return function (x) { var b = beda(x.sel); return b.length === 1 && b[0] === k; }; };
    var bentukSaja = function (x) { return beda(x.sel).every(function (k) { return k === 'luar' || k === 'dalam'; }); };
    if (level === 'mudah') {
      ambil(function (x) { return x.jenis === 'tertukar'; });
      ambil(function (x) { return x.jenis === 'salin'; });
      ambil(function (x) { return x.jenis === 'ambil-salah'; });
      ambil(function (x) { return x.jenis === 'garis-lain'; });
    } else {
      ambil(function (x) { return x.jenis === 'tertukar'; });
      if (ada.warna) ambil(hanya('warna'));
      if (ada.posisi) ambil(hanya('posisi'));
      ambil(function (x) { return bentukSaja(x) && x.jenis !== 'tertukar'; });
      if (level === 'sulit') ambil(function (x) { return x.jenis === 'salin' || x.jenis === 'warna-posisi'; });
      ambil(function (x) { return x.jenis === 'salin'; });
    }
    for (var i = 0; i < 6 && hasil.length < 4; i++) ambil(function () { return true; });
    return hasil.length === 4 ? hasil : null;
  }

  // ---------------------------------------------- uraian pembahasan

  function namaAnggota(tegak, i) { return tegak ? ['atas', 'tengah', 'bawah'][i] : ['kiri', 'tengah', 'kanan'][i]; }

  function uraiAturanBentuk(mek) {
    switch (mek) {
      case 'geser': return 'pada setiap baris, bentuk dalam suatu kotak menjadi bentuk luar kotak di sebelah kanannya, dan bentuk dalam kotak paling kanan sama dengan bentuk luar kotak paling kiri (ketiga bentuk bergeser melingkar)';
      case 'geser-kiri': return 'pada setiap baris, bentuk dalam suatu kotak menjadi bentuk luar kotak di sebelah kirinya, dan bentuk dalam kotak paling kiri sama dengan bentuk luar kotak paling kanan (ketiga bentuk bergeser melingkar ke kiri)';
      case 'geser-tegak': return 'pada setiap kolom, bentuk dalam suatu kotak menjadi bentuk luar kotak di bawahnya, dan bentuk dalam kotak paling bawah sama dengan bentuk luar kotak paling atas (ketiga bentuk bergeser melingkar ke bawah)';
      case 'tukar': return 'pada setiap baris, kotak tengah adalah kotak kiri dengan bentuk luar dan bentuk dalam bertukar tempat, lalu kotak kanan menukarnya kembali sehingga sama dengan kotak kiri';
      case 'tukar-tegak': return 'pada setiap kolom, kotak tengah adalah kotak atas dengan bentuk luar dan bentuk dalam bertukar tempat, lalu kotak bawah menukarnya kembali sehingga sama dengan kotak atas';
      case 'gabung-ld': return 'pada setiap baris, kotak kanan memakai bentuk luar kotak kiri dan bentuk dalam kotak tengah';
      default: return 'pada setiap baris, bentuk dalam kotak kiri menjadi bentuk luar kotak kanan, dan bentuk luar kotak tengah menjadi bentuk dalam kotak kanan';
    }
  }

  function uraiGambar1(mek) {
    switch (mek) {
      case 'geser':
        return 'panah biru menunjukkan bentuk dalam yang menjadi bentuk luar kotak di sebelah kanannya, dan panah jingga putus-putus menunjukkan bentuk luar kotak paling kiri yang menjadi bentuk dalam kotak paling kanan';
      case 'geser-kiri':
        return 'panah biru menunjukkan bentuk dalam yang menjadi bentuk luar kotak di sebelah kirinya, dan panah jingga putus-putus menunjukkan bentuk luar kotak paling kanan yang menjadi bentuk dalam kotak paling kiri';
      case 'geser-tegak':
        return 'panah biru menunjukkan bentuk dalam yang menjadi bentuk luar kotak di bawahnya, dan panah jingga putus-putus menunjukkan bentuk luar kotak paling atas yang menjadi bentuk dalam kotak paling bawah';
      case 'tukar': case 'tukar-tegak':
        return 'setiap pertukaran ditandai sepasang panah, yaitu panah biru dari bentuk dalam ke bentuk luar kotak berikutnya dan panah jingga dari bentuk luar ke bentuk dalam kotak berikutnya';
      case 'gabung-ld':
        return 'panah jingga putus-putus membawa bentuk luar kotak kiri ke kotak kanan, dan panah biru membawa bentuk dalam kotak tengah ke kotak kanan';
      default:
        return 'panah biru putus-putus membawa bentuk dalam kotak kiri menjadi bentuk luar kotak kanan, dan panah jingga membawa bentuk luar kotak tengah menjadi bentuk dalam kotak kanan';
    }
  }

  /** Kalimat penerapan aturan bentuk pada kotak "?" (dari relasi mekanismenya). */
  function uraiTerapBentuk(mek, G, tr, tc, kunci) {
    var info = MEK[mek], m = info.tegak ? tr : tc, bag = [];
    ['luar', 'dalam'].forEach(function (X) {
      var rel = null;
      info.relasi.forEach(function (pr) {
        if (rel) return;
        if (pr[0][0] === m && pr[0][1] === X && pr[1][0] !== m) rel = pr[1];
        else if (pr[1][0] === m && pr[1][1] === X && pr[0][0] !== m) rel = pr[0];
      });
      var j = rel[0], sel = info.tegak ? G[j][tc] : G[tr][j];
      bag.push('bentuk ' + X + ' kotak yang dicari sama dengan bentuk ' + rel[1] + ' kotak ' + namaAnggota(info.tegak, j) + ', yaitu ' + NB(sel[rel[1]]));
    });
    return 'Pada ' + (info.tegak ? 'kolom ' + (tc + 1) : 'baris ' + (tr + 1)) + ': ' + bag.join('; ') + '.';
  }

  function contohGaris(mek, G, tr, tc) {
    var info = MEK[mek], i = info.tegak ? (tc === 0 ? 1 : 0) : (tr === 0 ? 1 : 0);
    var isi = [0, 1, 2].map(function (k) { var x = info.tegak ? G[k][i] : G[i][k]; return NB(x.dalam) + ' di dalam ' + NB(x.luar); });
    return 'Contoh ' + (info.tegak ? 'kolom ' + (i + 1) + ' dari atas ke bawah' : 'baris ' + (i + 1) + ' dari kiri ke kanan') + ': ' + isi[0] + ', lalu ' + isi[1] + ', lalu ' + isi[2] + '.';
  }

  function nilaiGarisTeks(vals, m, fmt) { return vals.map(function (v, i) { return i === m ? '?' : fmt(v); }).join(', '); }

  function uraiWarna(aturan, G, tr, tc, kunci) {
    var Wg = G.map(function (b) { return b.map(function (x) { return x ? x.warna : null; }); });
    if (aturan === 'kolom') {
      var kol = [0, 1, 2].map(function (c) { return Wg[c === tc ? (tr === 0 ? 1 : 0) : 0][c]; });
      return 'Warna bentuk dalam sama dalam satu kolom: kolom 1 ' + NAMA_WARNA[kol[0]] + ', kolom 2 ' + NAMA_WARNA[kol[1]] + ', kolom 3 ' + NAMA_WARNA[kol[2]] + '. Kotak yang dicari berada di kolom ' + (tc + 1) + ', jadi bentuk dalamnya berwarna ' + NAMA_WARNA[kunci.warna] + '.';
    }
    if (aturan === 'baris') {
      var bar = [0, 1, 2].map(function (r) { return Wg[r][r === tr ? (tc === 0 ? 1 : 0) : 0]; });
      return 'Warna bentuk dalam sama dalam satu baris: baris 1 ' + NAMA_WARNA[bar[0]] + ', baris 2 ' + NAMA_WARNA[bar[1]] + ', baris 3 ' + NAMA_WARNA[bar[2]] + '. Kotak yang dicari berada di baris ' + (tr + 1) + ', jadi bentuk dalamnya berwarna ' + NAMA_WARNA[kunci.warna] + '.';
    }
    if (aturan === 'latin') {
      var ada = Wg[tr].filter(function (v, c) { return c !== tc; }).map(function (v) { return NAMA_WARNA[v]; });
      return 'Setiap baris dan setiap kolom memuat ketiga warna bentuk dalam (putih, abu-abu, hitam) tepat satu kali. Baris ' + (tr + 1) + ' sudah memuat warna ' + ada.join(' dan ') + ', jadi bentuk dalam kotak yang dicari berwarna ' + NAMA_WARNA[kunci.warna] + '.';
    }
    // ikut bentuk dalam
    var peta = {};
    G.forEach(function (b) { b.forEach(function (x) { if (x) peta[x.dalam] = x.warna; }); });
    var daftar = Object.keys(peta).sort().map(function (b) { return NB(b) + ' selalu ' + NAMA_WARNA[peta[b]]; });
    return 'Warna bentuk dalam mengikuti bentuknya, di kotak mana pun: ' + daftar.join(', ') + '. Bentuk dalam kotak yang dicari adalah ' + NB(kunci.dalam) + ', jadi warnanya ' + NAMA_WARNA[kunci.warna] + '.';
  }

  function uraiPosisi(aturan, k, G, tr, tc, kunci) {
    var Pg = G.map(function (b) { return b.map(function (x) { return x ? x.posisi : null; }); });
    var jam = k === 1 ? 'searah jarum jam (atas → kanan → bawah → kiri)' : 'berlawanan arah jarum jam (atas → kiri → bawah → kanan)';
    if (aturan === 'putar') return 'Letak bentuk dalam berpindah satu langkah ' + jam + ' dari kotak ke kotak pada setiap baris, dari kiri ke kanan. Pada baris ' + (tr + 1) + ' urutannya ' + nilaiGarisTeks(Pg[tr], tc, function (v) { return v; }) + ', jadi bentuk dalam kotak yang dicari berada di bagian ' + kunci.posisi + '.';
    if (aturan === 'putar-tegak') return 'Letak bentuk dalam berpindah satu langkah ' + jam + ' dari kotak ke kotak pada setiap kolom, dari atas ke bawah. Pada kolom ' + (tc + 1) + ' urutannya ' + nilaiGarisTeks([0, 1, 2].map(function (r) { return Pg[r][tc]; }), tr, function (v) { return v; }) + ', jadi bentuk dalam kotak yang dicari berada di bagian ' + kunci.posisi + '.';
    if (aturan === 'kolom') {
      var kol = [0, 1, 2].map(function (c) { return Pg[c === tc ? (tr === 0 ? 1 : 0) : 0][c]; });
      return 'Letak bentuk dalam sama dalam satu kolom: kolom 1 di bagian ' + kol[0] + ', kolom 2 di bagian ' + kol[1] + ', kolom 3 di bagian ' + kol[2] + '. Kotak yang dicari berada di kolom ' + (tc + 1) + ', jadi bentuk dalamnya di bagian ' + kunci.posisi + '.';
    }
    var bar = [0, 1, 2].map(function (r) { return Pg[r][r === tr ? (tc === 0 ? 1 : 0) : 0]; });
    return 'Letak bentuk dalam sama dalam satu baris: baris 1 di bagian ' + bar[0] + ', baris 2 di bagian ' + bar[1] + ', baris 3 di bagian ' + bar[2] + '. Kotak yang dicari berada di baris ' + (tr + 1) + ', jadi bentuk dalamnya di bagian ' + kunci.posisi + '.';
  }

  // ---------------------------------------------- gambar pembahasan luar-dalam

  /** Titik pada garis tepi bentuk luar kotak (koordinat 0..100) searah (dx, dy) dari pusatnya. */
  function tepiLuar(sel, dx, dy) {
    var p = pusatLuar(sel.luar), L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
    if (sel.luar === 'lingkaran') return [p[0] + ux * 0.9 * S_LUAR, p[1] + uy * 0.9 * S_LUAR];
    var P = poligon(sel.luar, p[0], p[1], S_LUAR), tMin = Infinity;
    for (var i = 0; i < P.length; i++) {
      var a = P[i], b = P[(i + 1) % P.length], ex = b[0] - a[0], ey = b[1] - a[1];
      var den = ux * ey - uy * ex;
      if (Math.abs(den) < 1e-9) continue;
      var t = ((a[0] - p[0]) * ey - (a[1] - p[1]) * ex) / den, s = ((a[0] - p[0]) * uy - (a[1] - p[1]) * ux) / den;
      if (t > 0 && s >= -1e-9 && s <= 1 + 1e-9) tMin = Math.min(tMin, t);
    }
    if (!isFinite(tMin)) tMin = S_LUAR * 0.8;
    return [p[0] + ux * tMin, p[1] + uy * tMin];
  }

  /** Relasi yang digambar per mekanisme: dari [kotak, slot] ke [kotak, slot], warna, dan miring (pembeda panah sejajar). */
  function relasiGambar(mek) {
    var B = 'biru', J = 'jingga';
    switch (mek) {
      case 'geser': case 'geser-tegak': return [{ d: [0, 'dalam'], k: [1, 'luar'], w: B }, { d: [1, 'dalam'], k: [2, 'luar'], w: B }, { d: [0, 'luar'], k: [2, 'dalam'], w: J }];
      case 'geser-kiri': return [{ d: [1, 'dalam'], k: [0, 'luar'], w: B }, { d: [2, 'dalam'], k: [1, 'luar'], w: B }, { d: [2, 'luar'], k: [0, 'dalam'], w: J }];
      case 'tukar': case 'tukar-tegak': return [{ d: [0, 'dalam'], k: [1, 'luar'], w: B, miring: -1 }, { d: [0, 'luar'], k: [1, 'dalam'], w: J, miring: 1 }, { d: [1, 'dalam'], k: [2, 'luar'], w: B, miring: -1 }, { d: [1, 'luar'], k: [2, 'dalam'], w: J, miring: 1 }];
      case 'gabung-ld': return [{ d: [0, 'luar'], k: [2, 'luar'], w: J }, { d: [1, 'dalam'], k: [2, 'dalam'], w: B }];
      default: return [{ d: [0, 'dalam'], k: [2, 'luar'], w: B }, { d: [1, 'luar'], k: [2, 'dalam'], w: J }];
    }
  }

  /** Gambar 1: matriks utuh (kotak jawaban hijau) dengan panah perpindahan bentuk pada setiap garis. */
  function svgAlurLD(m, judul) {
    var u = 96, g = 30, pad = 10, y0 = pad + 26, x0 = pad, info = MEK[m.mek], o = [];
    var W0 = x0 + 3 * u + 2 * g + (info.tegak ? g : 0) + pad, legY = y0 + 3 * u + 2 * g + (info.tegak ? 0 : g) + 14;
    var W = lebarJudul(judul, Math.max(W0, 360)), H = legY + 34 + pad;
    var G = m.grid.map(function (b, r) { return b.map(function (x, c) { return r === m.tanya[0] && c === m.tanya[1] ? m.jawaban : x; }); });
    function kx(c) { return x0 + c * (u + g); }
    function ky(r) { return y0 + r * (u + g); }
    function glob(r, c, p) { return [kx(c) + p[0] * u / 100, ky(r) + p[1] * u / 100]; }
    o.push(teksB(judul, pad, pad + 13, { ukuran: 13, tebal: true }));
    for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) {
      var jawab = r === m.tanya[0] && c === m.tanya[1];
      o.push(kotak(kx(c), ky(r), u, isiLD(G[r][c]), jawab ? { latar: BH.latarJawab, tepi: BH.jawab, tebalTepi: 3.2 } : {}));
    }
    var WARNA_P = { biru: BH.panah, jingga: BH.sorot };
    relasiGambar(m.mek).forEach(function (rl) {
      for (var i = 0; i < 3; i++) {
        var sel = function (j) { return info.tegak ? [j, i] : [i, j]; };
        var sd = sel(rl.d[0]), sk = sel(rl.k[0]), cd = G[sd[0]][sd[1]], ck = G[sk[0]][sk[1]];
        var arah = rl.k[0] > rl.d[0] ? 1 : -1, ax = info.tegak ? 0 : arah, ay = info.tegak ? arah : 0, mi = rl.miring || 0;
        // titik tambat: pusat bentuk dalam, atau tepi bentuk luar yang menghadap kotak lawan
        var tambat = function (x, slot, rc, keluar) {
          var arahX = keluar ? ax : -ax, arahY = keluar ? ay : -ay;
          var p = slot === 'dalam' ? pusatDalam(x) : tepiLuar(x, arahX + (info.tegak ? mi * 0.7 : 0), arahY + (info.tegak ? 0 : mi * 0.7));
          if (slot === 'dalam') {
            // dari/ke tepi bentuk dalam yang menghadap kotak lawan, supaya bentuknya tidak tertutup panah
            p = [p[0] + arahX * (S_DALAM + 3), p[1] + arahY * (S_DALAM + 3)];
            if (mi) p = [p[0] + (info.tegak ? mi * 5 : 0), p[1] + (info.tegak ? 0 : mi * 5)];
          }
          return glob(rc[0], rc[1], p);
        };
        var p0, p1, warna = WARNA_P[rl.w];
        if (Math.abs(rl.k[0] - rl.d[0]) === 1) {
          p0 = tambat(cd, rl.d[1], sd, true); p1 = tambat(ck, rl.k[1], sk, false);
          o.push(S.panah(p0[0], p0[1], p1[0], p1[1], { warna: warna, tebal: 2.4, kepala: 9, halo: true }));
        } else {
          // lewat celah di bawah baris (atau di kanan kolom)
          // ujung di tepi bentuk dalam (sisi yang menghadap celah) atau di tepi bentuk luar
          var tepiDalam = function (x) { var q = pusatDalam(x); return info.tegak ? [q[0] + 13, q[1]] : [q[0], q[1] + 13]; };
          var a0 = rl.d[1] === 'dalam' ? tepiDalam(cd) : tepiLuar(cd, info.tegak ? 1 : 0, info.tegak ? 0 : 1);
          var a1 = rl.k[1] === 'dalam' ? tepiDalam(ck) : tepiLuar(ck, info.tegak ? 1 : 0, info.tegak ? 0 : 1);
          p0 = glob(sd[0], sd[1], a0); p1 = glob(sk[0], sk[1], a1);
          var jalur;
          if (info.tegak) { var xc = kx(i) + u + g / 2; jalur = [p0, [xc, p0[1]], [xc, p1[1]], [p1[0] + 16, p1[1]]]; }
          else { var yc = ky(i) + u + g / 2; jalur = [p0, [p0[0], yc], [p1[0], yc], [p1[0], p1[1] + 16]]; }
          o.push(S.poli(jalur, { garis: '#ffffff', tebal: 6, ujung: 'round', sambung: 'round' }));
          o.push(S.poli(jalur, { garis: warna, tebal: 2.4, putus: '6 4', sambung: 'round' }));
          var ak = jalur[3];
          o.push(S.panah(ak[0], ak[1], p1[0], p1[1], { warna: warna, tebal: 2.4, kepala: 9, halo: true }));
        }
      }
    });
    var leg = { biru: [], jingga: [] };
    relasiGambar(m.mek).forEach(function (rl) { var t = 'bentuk ' + rl.d[1] + ' menjadi bentuk ' + rl.k[1]; if (leg[rl.w].indexOf(t) < 0) leg[rl.w].push(t); });
    var ly = legY + 12;
    Object.keys(leg).forEach(function (wn) {
      if (!leg[wn].length) return;
      o.push(S.garis(pad, ly - 4, pad + 22, ly - 4, { garis: WARNA_P[wn], tebal: 2.6 }));
      o.push(teksB('panah ' + wn + ': ' + leg[wn].join(', '), pad + 28, ly, { ukuran: 10, isi: BH.teksRedup }));
      ly += 15;
    });
    return { svg: S.doc(o.join(''), W, H, { latar: '#ffffff' }), lebar: W, tinggi: H };
  }

  function ikonKanalLD(slot, sel, cx, cy) {
    if (slot === 'warna') return S.lingkaran(cx, cy, 12, { isi: ISI_WARNA[sel.warna], garis: TINTA, tebal: 1.6 });
    var a = ARAH_POSISI[sel.posisi];
    return S.rect(cx - 14, cy - 14, 28, 28, { rx: 3, isi: '#ffffff', garis: '#9aa3b5', tebal: 1.2 }) + S.lingkaran(cx + a[0] * 8.5, cy + a[1] * 8.5, 4.6, { isi: TINTA });
  }

  function ringkasKanal(k) {
    if (k.slot === 'warna') return { kolom: 'sama dalam satu kolom', baris: 'sama dalam satu baris', latin: 'tiap baris dan kolom memuat ketiga warna', ikut: 'warna mengikuti bentuk dalamnya' }[k.aturan];
    var jam = k.k === 1 ? 'searah jarum jam' : 'berlawanan arah jarum jam';
    return { putar: 'pindah satu langkah ' + jam + ' tiap kotak ke kanan', 'putar-tegak': 'pindah satu langkah ' + jam + ' tiap kotak ke bawah', kolom: 'sama dalam satu kolom', baris: 'sama dalam satu baris' }[k.aturan];
  }

  /** Gambar 2: nilai kanal warna/letak tiap kotak dalam matriks kecil; garis penentu diarsir, kotak jawaban hijau. */
  function svgKanalLD(m, judul) {
    var pad = 10, mc = 40, sela = 18, lebarPanel = 3 * mc + 2 * sela + 24, y0 = pad + 26, o = [];
    var W = lebarJudul(judul, pad * 2 + m.kanal.length * lebarPanel + (m.kanal.length - 1) * 16), tinggi = 0;
    var G = m.grid.map(function (b, r) { return b.map(function (x, c) { return r === m.tanya[0] && c === m.tanya[1] ? m.jawaban : x; }); });
    o.push(teksB(judul, pad, pad + 13, { ukuran: 13, tebal: true }));
    m.kanal.forEach(function (k, ki) {
      var x0 = pad + ki * (lebarPanel + 16), gy = y0 + 40;
      o.push(teksB(k.slot === 'warna' ? 'Warna bentuk dalam' : 'Letak bentuk dalam', x0, y0 + 12, { tebal: true }));
      var urai = paragrafB(ringkasKanal(k), x0, y0 + 27, lebarPanel - 4, { ukuran: 10, isi: BH.panah, tebal: true });
      o.push(urai.svg);
      gy += (urai.baris - 1) * 13;
      var px = function (c) { return x0 + 12 + c * (mc + sela); }, py = function (r) { return gy + r * (mc + sela); };
      var tr = m.tanya[0], tc = m.tanya[1];
      if (k.aturan === 'kolom' || k.aturan === 'latin') o.push(S.rect(px(tc) - 5, py(0) - 5, mc + 10, 3 * mc + 2 * sela + 10, { rx: 6, isi: BH.latarPanah }));
      if (k.aturan === 'baris' || k.aturan === 'latin' || k.aturan === 'putar') o.push(S.rect(px(0) - 5, py(tr) - 5, 3 * mc + 2 * sela + 10, mc + 10, { rx: 6, isi: BH.latarPanah }));
      if (k.aturan === 'putar-tegak') o.push(S.rect(px(tc) - 5, py(0) - 5, mc + 10, 3 * mc + 2 * sela + 10, { rx: 6, isi: BH.latarPanah }));
      for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) {
        var jawab = r === tr && c === tc, x = G[r][c];
        var samaBentuk = k.aturan === 'ikut' && !jawab && x.dalam === m.jawaban.dalam;
        o.push(S.rect(px(c), py(r), mc, mc, { rx: 4, isi: jawab ? BH.latarJawab : '#ffffff', garis: jawab ? BH.jawab : (samaBentuk ? BH.sorot : '#c4cad6'), tebal: jawab || samaBentuk ? 2.4 : 1 }));
        if (k.aturan === 'ikut') o.push(gambarBentuk(x.dalam, px(c) + mc / 2, py(r) + mc / 2, 13, { isi: ISI_WARNA[x.warna], garis: TINTA, tebal: 1.6 }));
        else o.push(ikonKanalLD(k.slot, x, px(c) + mc / 2, py(r) + mc / 2));
        if (k.aturan === 'putar' && c < 2) o.push(S.panah(px(c) + mc + 3, py(r) + mc / 2, px(c + 1) - 3, py(r) + mc / 2, { warna: BH.panah, tebal: 1.6, kepala: 6 }));
        if (k.aturan === 'putar-tegak' && r < 2) o.push(S.panah(px(c) + mc / 2, py(r) + mc + 3, px(c) + mc / 2, py(r + 1) - 3, { warna: BH.panah, tebal: 1.6, kepala: 6 }));
      }
      var bawah = py(2) + mc + 18;
      o.push(teksB('Kotak jawaban: ' + (k.slot === 'warna' ? NAMA_WARNA[m.jawaban.warna] : 'bagian ' + m.jawaban.posisi), x0, bawah, { ukuran: 10, tebal: true, isi: BH.jawab }));
      tinggi = Math.max(tinggi, bawah + pad);
    });
    return { svg: S.doc(o.join(''), W, tinggi, { latar: '#ffffff' }), lebar: W, tinggi: tinggi };
  }

  // ---------------------------------------------- rakit butir luar-dalam

  var CATATAN_LD = 'Matriks 3x3 bentuk luar-dalam (bentuk dalam bergeser atau bertukar menjadi bentuk luar) adalah pengayaan bab Figural Matriks - Kotak 3x3 di Kerangka Course; tidak ada pada contoh riset BAB V.';

  function buatLD(id, level, benih, opsi) {
    var a = Rng.alat(benih);
    var target = opsi.target == null ? a.bulat(0, 4) : opsi.target;
    for (var coba = 0; coba < 60; coba++) {
      var rc = rencanaLD(a, level, opsi.polaDipakai);
      // segi lima dan segi enam tidak dipakai bersama (bentuk dalam yang kecil bisa tertukar), kecuali pada tukar tingkat mudah
      var buang = level === 'mudah' && rc.mek.indexOf('tukar') === 0 ? null : a.pilih(['segilima', 'segienam']);
      var pool = (rc.posisi ? LAPANG : BENTUK).filter(function (b) { return b !== buang; });
      var bentuk = bangunBentukLD(a, rc.mek, pool);
      if (!bentuk) continue;
      var Wg = rc.warna ? bangunWarnaLD(a, rc.warna, bentuk) : null, Pg = rc.posisi ? bangunPosisiLD(a, rc.posisi) : null;
      var grid = bentuk.map(function (b, r) { return b.map(function (x, c) { return selLD(x.luar, x.dalam, Wg ? Wg[r][c] : null, Pg ? Pg.g[r][c] : null); }); });
      if (Wg && rc.warna === 'ikut') {
        var dipakaiWarna = {};
        grid.forEach(function (b) { b.forEach(function (x) { dipakaiWarna[x.warna] = 1; }); });
        if (Object.keys(dipakaiWarna).length < 2) continue;
      }
      var tanya = pilihTanyaLD(a, level, rc), tr = tanya[0], tc = tanya[1], kunci = grid[tr][tc];
      var tampak = grid.map(function (b, r) { return b.map(function (x, c) { return r === tr && c === tc ? null : x; }); });
      var ramal = ramalLD(tampak, tr, tc);
      if (!ramal || sj(ramal) !== sj(kunci) || putusLD(tampak, tr, tc) || retakLD(tampak, tr, tc)) continue;
      var peng = pengecohLD(a, level, tampak, tr, tc, kunci, rc);
      if (!peng) continue;

      var kanal = [];
      if (rc.warna) kanal.push({ slot: 'warna', aturan: rc.warna, k: null });
      if (rc.posisi) kanal.push({ slot: 'posisi', aturan: rc.posisi, k: Pg.k });
      var pem = [];
      pem.push('Setiap kotak berisi satu bentuk luar yang besar dan satu bentuk dalam yang kecil' + (rc.warna ? '; bentuk dalamnya berwarna putih, abu-abu, atau hitam' : '') +
        (rc.posisi ? '; letak bentuk dalamnya berpindah-pindah (atas, kanan, bawah, atau kiri)' : '') + '. Kotak yang dicari berada pada ' + namaLetak(tr, tc) + '.');
      pem.push('Aturan bentuk: ' + uraiAturanBentuk(rc.mek) + '. ' + contohGaris(rc.mek, tampak, tr, tc));
      pem.push(uraiTerapBentuk(rc.mek, tampak, tr, tc, kunci));
      pem.push('Gambar 1 memperlihatkan aturan itu pada setiap ' + (MEK[rc.mek].tegak ? 'kolom' : 'baris') + ': ' + uraiGambar1(rc.mek) + '. Kotak jawaban berlatar hijau.');
      if (rc.warna) pem.push(uraiWarna(rc.warna, tampak, tr, tc, kunci));
      if (rc.posisi) pem.push(uraiPosisi(rc.posisi, Pg.k, tampak, tr, tc, kunci));
      if (kanal.length) pem.push('Gambar 2 menuliskan ' + (kanal.length > 1 ? 'warna dan letak' : (rc.warna ? 'warna' : 'letak')) + ' bentuk dalam setiap kotak; ' + (rc.warna === 'ikut' ? 'kotak bergaris jingga memuat bentuk dalam yang sama dengan kotak jawaban' : 'garis penentu kotak jawaban diarsir biru') + '.');
      pem.push('Jadi kotak pengganti tanda tanya berisi bentuk luar ' + NB(kunci.luar) + ' dengan bentuk dalam ' + NB(kunci.dalam) + (kunci.warna ? ' berwarna ' + NAMA_WARNA[kunci.warna] : '') + (kunci.posisi ? ' di bagian ' + kunci.posisi : '') + '.');

      var daftar = a.kocok(peng.map(function (p) { return { sel: p.sel, alasan: p.alasan, kunci: false }; }));
      daftar.splice(target, 0, { sel: kunci, alasan: null, kunci: true });
      var opsiGambar = daftar.map(function (d, i) {
        return { teks: 'Gambar opsi ' + Fmt.huruf(i), nilai: i, alasan: d.alasan ? Fmt.kapital(d.alasan) + '.' : null, kunci: d.kunci,
          gambar: { id: 'opsi-' + Fmt.huruf(i).toLowerCase(), jenis: 'mbentuk-ld-opsi', model: { fig: d.sel }, judul: 'Opsi ' + Fmt.huruf(i) } };
      });
      var utuh = grid.map(function (b) { return b.map(function (x) { return [x.luar, x.dalam, x.warna || '-', x.posisi || '-'].join('.'); }).join('/'); }).join('//');
      var ctx = { subtes: 'ku', submateri: 'figural', keluarga: id, level: level, benih: benih, a: a };
      var butir = Butir.rakitPg(ctx, {
        jenisSoal: 'Figural Matriks - Kotak 3x3 (bentuk luar dan bentuk dalam)',
        judul: 'Figural Matriks - Kotak 3x3', teks: [], pertanyaan: '', perintah: PERINTAH,
        gambar: [{ id: 'soal', jenis: 'mbentuk-ld', model: { grid: tampak, tanya: [tr, tc] }, judul: 'Matriks 3x3 bentuk luar-dalam' }],
        pilihanJadi: { opsi: opsiGambar, kunciIndex: target }, tulisKunci: false,
        langkah: [], pembahasan: pem,
        model: { topik: 'Figural', tipe: 'matriks-luar-dalam', grid: tampak, tanya: [tr, tc], pilihan: daftar.map(function (d) { return d.sel; }), kunciIndex: target },
        sidik: { inti: 'matriks-luar-dalam|' + utuh + '|' + tr + tc, param: [], entitas: rc.pola }
      });
      if (!butir) continue;
      butir.gambarPembahasan = [{ id: 'bahas-1', jenis: 'mbentuk-ld-alur', judul: 'Gambar 1. Perpindahan bentuk pada setiap ' + (MEK[rc.mek].tegak ? 'kolom' : 'baris'), model: { grid: tampak, tanya: [tr, tc], mek: rc.mek, jawaban: kunci } }];
      if (kanal.length) butir.gambarPembahasan.push({ id: 'bahas-2', jenis: 'mbentuk-ld-kanal', judul: 'Gambar 2. ' + (kanal.length > 1 ? 'Warna dan letak' : (rc.warna ? 'Warna' : 'Letak')) + ' bentuk dalam tiap kotak', model: { grid: tampak, tanya: [tr, tc], kanal: kanal, jawaban: kunci } });
      butir.pola = rc.pola;
      butir.kategoriRiset = 'pengayaan';
      butir.catatanRiset = CATATAN_LD;
      return butir;
    }
    return null;
  }

  // ================================================================ JUMLAH UNSUR

  var UNSUR = ['hitam', 'putih', 'kotak', 'segitiga', 'garis', 'bintang', 'ketupat', 'silang'];
  var NAMA_UNSUR = { hitam: 'titik hitam', putih: 'titik putih', kotak: 'kotak kecil', segitiga: 'segitiga kecil', garis: 'garis pendek', bintang: 'bintang kecil', ketupat: 'belah ketupat kecil', silang: 'tanda silang', sisi: 'sisi bangun', campur: 'unsur' };
  var URUT_KUNCI = ['sisi', 'hitam', 'putih', 'kotak', 'segitiga', 'garis', 'bintang', 'ketupat', 'silang'];
  var ISI_BANGUN = ['hitam', 'putih', 'kotak', 'segitiga', 'bintang', 'ketupat', 'silang'];
  // pasangan unsur yang terlalu mirip bila tampil bersama dalam satu kotak
  var MIRIP = ['kotak|ketupat', 'ketupat|kotak'];

  function selJml(o) { var c = {}; URUT_KUNCI.forEach(function (k) { if (o[k] != null) c[k] = o[k]; }); return c; }

  // posisi mata dadu (satuan langkah) untuk 0..9 unsur
  var DADU = {
    0: [], 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
    5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [-1, 0], [-1, 1], [1, -1], [1, 0], [1, 1]],
    7: [[-1, -1], [-1, 0], [-1, 1], [0, 0], [1, -1], [1, 0], [1, 1]],
    8: [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]],
    9: [[-1, -1], [0, -1], [1, -1], [-1, 0], [0, 0], [1, 0], [-1, 1], [0, 1], [1, 1]]
  };

  function unsurSvg(jenis, x, y, r) {
    var i, a, p = [];
    if (jenis === 'hitam') return S.lingkaran(x, y, r, { isi: TINTA });
    if (jenis === 'putih') return S.lingkaran(x, y, r - 0.6, { isi: '#ffffff', garis: TINTA, tebal: 2 });
    if (jenis === 'kotak') return S.rect(x - r * 0.9, y - r * 0.9, r * 1.8, r * 1.8, { isi: TINTA });
    if (jenis === 'segitiga') return S.poli([[x, y - r * 1.1], [x + r * 1.1, y + r * 0.8], [x - r * 1.1, y + r * 0.8]], { tutup: true, isi: TINTA, garis: TINTA, tebal: 1, sambung: 'round' });
    if (jenis === 'ketupat') return S.poli([[x, y - r * 1.25], [x + r * 0.85, y], [x, y + r * 1.25], [x - r * 0.85, y]], { tutup: true, isi: TINTA, garis: TINTA, tebal: 1, sambung: 'round' });
    if (jenis === 'silang') {
      var k = r * 0.95;
      return S.garis(x - k, y - k, x + k, y + k, { garis: TINTA, tebal: 3, ujung: 'round' }) + S.garis(x - k, y + k, x + k, y - k, { garis: TINTA, tebal: 3, ujung: 'round' });
    }
    if (jenis === 'bintang') {
      for (i = 0; i < 10; i++) { a = (-90 + 36 * i) * Math.PI / 180; var rr = (i % 2 ? 0.45 : 1) * r * 1.3; p.push([x + rr * Math.cos(a), y + 0.06 * r + rr * Math.sin(a)]); }
      return S.poli(p, { tutup: true, isi: TINTA, garis: TINTA, tebal: 1, sambung: 'round' });
    }
    return S.garis(x, y - r * 1.5, x, y + r * 1.5, { garis: TINTA, tebal: 3.2, ujung: 'round' });
  }

  /** Unsur sebanyak n tersusun seperti dadu (atau baris garis) di sekitar (cx, cy) dengan langkah d. */
  function susunDadu(jenis, n, cx, cy, d, r) {
    var o = [];
    if (jenis === 'garis') {
      // satu baris garis tegak, berkelompok lima supaya mudah dihitung
      var xs = [], i;
      for (i = 0; i < n; i++) xs.push(i * 0.4 * d + (i >= 5 ? 0.3 * d : 0));
      var tengah = n ? (xs[0] + xs[n - 1]) / 2 : 0, pj = Math.min(15, r * 2);
      xs.forEach(function (x) { o.push(S.garis(cx + x - tengah, cy - pj, cx + x - tengah, cy + pj, { garis: TINTA, tebal: 3.2, ujung: 'round' })); });
      return o.join('');
    }
    DADU[n].forEach(function (p) { o.push(unsurSvg(jenis, cx + p[0] * d, cy + p[1] * d, r)); });
    return o.join('');
  }

  /** Unsur sebanyak n dalam satu baris lima (dua baris bila lebih dari lima) berpusat di (cx, cy). */
  function susunBaris(jenis, n, cx, cy, dx, dy, r) {
    var o = [], i;
    if (jenis === 'garis') {
      // garis tegak dalam satu baris (garis yang ditumpuk dua baris tampak seperti garis panjang), berkelompok lima
      var xs = [];
      for (i = 0; i < n; i++) xs.push(i * 8.4 + (i >= 5 ? 5 : 0));
      var tengah = (xs[0] + xs[n - 1]) / 2;
      xs.forEach(function (x) { o.push(S.garis(cx + x - tengah, cy - 9, cx + x - tengah, cy + 9, { garis: TINTA, tebal: 3, ujung: 'round' })); });
      return o.join('');
    }
    var baris = n <= 5 ? [n] : [5, n - 5], ys = baris.length === 1 ? [cy] : [cy - dy / 2, cy + dy / 2];
    baris.forEach(function (k, bi) { for (var i = 0; i < k; i++) o.push(unsurSvg(jenis, cx + (i - (k - 1) / 2) * dx, ys[bi], jenis === 'garis' ? r * 0.9 : r)); });
    return o.join('');
  }

  var R_BANGUN = 46;
  function sudutAwal(k) { return -90 + (k % 2 === 0 ? 180 / k : 0); }
  function pusatBangun(k) { return [50, k % 2 ? 50 + R_BANGUN * (1 - Math.cos(Math.PI / k)) / 2 : 50]; }
  function titikBangun(k, cx, cy, R) {
    var p = [], a0 = sudutAwal(k);
    for (var i = 0; i < k; i++) { var t = (a0 + 360 * i / k) * Math.PI / 180; p.push([cx + R * Math.cos(t), cy + R * Math.sin(t)]); }
    return p;
  }

  /** Isi satu kotak hitungan (koordinat 0..100). */
  function isiJml(sel) {
    var kunci = Object.keys(sel).filter(function (k) { return k !== 'sisi'; }), o = [];
    if (sel.sisi) {
      var p = pusatBangun(sel.sisi), n = sel[kunci[0]] || 0, rIn = R_BANGUN * Math.cos(Math.PI / sel.sisi) - 2;
      o.push(S.poli(titikBangun(sel.sisi, p[0], p[1], R_BANGUN), { tutup: true, isi: '#ffffff', garis: TINTA, tebal: 2.6, sambung: 'round' }));
      var jauh = 0;
      DADU[n].forEach(function (q) { jauh = Math.max(jauh, Math.hypot(q[0], q[1])); });
      var r = 4.6, d = jauh ? Math.min(14, (rIn - r - 2) / jauh) : 14;
      o.push(susunDadu(kunci[0], n, p[0], p[1], d, r));
      return o.join('');
    }
    if (kunci.length === 1) return susunDadu(kunci[0], sel[kunci[0]], 50, 50, 25, 7.5);
    o.push(S.garis(8, 50, 92, 50, { garis: '#c4cad6', tebal: 1.2, putus: '3 3' }));
    o.push(susunBaris(kunci[0], sel[kunci[0]], 50, 26, 17, 18, 5.6));
    o.push(susunBaris(kunci[1], sel[kunci[1]], 50, 74, 17, 18, 5.6));
    return o.join('');
  }

  // ---------------------------------------------- tebakan aturan hitungan (pustaka penyusun)

  function urutKata(b) { return b.slice().sort(function (x, y) { return x - y; }).join(','); }

  var ATURAN_HITUNG = {
    tambah: function (V) { return V.every(function (b) { return b[2] === b[0] + b[1]; }); },
    kurang: function (V) { return V.every(function (b) { return b[2] === b[0] - b[1]; }); },
    'kurang-balik': function (V) { return V.every(function (b) { return b[2] === b[1] - b[0]; }); },
    selisih: function (V) { return V.every(function (b) { return b[2] === Math.abs(b[0] - b[1]); }); },
    kali: function (V) { return V.every(function (b) { return b[2] === b[0] * b[1]; }); },
    bagi: function (V) { return V.every(function (b) { return b[1] !== 0 && b[0] === b[2] * b[1]; }); },
    tetap: function (V) { var k = jumlahArr(V[0]); return V.every(function (b) { return jumlahArr(b) === k; }); },
    'deret-sama': function (V) { var d = V[0][1] - V[0][0]; return V.every(function (b) { return b[1] - b[0] === d && b[2] - b[1] === d; }); },
    'deret-bebas': function (V) { return V.every(function (b) { return b[1] - b[0] === b[2] - b[1]; }); },
    latin: function (V) { var s = urutKata(V[0]); return V.every(function (b) { return urutKata(b) === s; }); }
  };

  function aditif(V) {
    for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) if (V[r][c] - V[r][0] - V[0][c] + V[0][0] !== 0) return false;
    return true;
  }

  function ranahJml(k) { return k === 'sisi' ? rentang(3, 12) : (k === 'total' ? rentang(0, 40) : rentang(0, 20)); }

  /** Calon nilai satu kanal hitungan pada kotak "?" menurut semua aturan baris, kolom, dan aditif yang berlaku. */
  function calonKanal(V, tr, tc, ranah) {
    var calon = ranah.slice();
    function iris(f) {
      var d = ranah.filter(function (v) { var W = V.map(function (b) { return b.slice(); }); W[tr][tc] = v; return f(W); });
      if (d.length) calon = calon.filter(function (v) { return d.indexOf(v) >= 0; });
    }
    Object.keys(ATURAN_HITUNG).forEach(function (nm) {
      iris(ATURAN_HITUNG[nm]);
      iris(function (W) { return ATURAN_HITUNG[nm](transpos(W)); });
    });
    iris(aditif);
    return calon;
  }

  function hubunganSel(G, X, Y) {
    var sel = [];
    G.forEach(function (b) { b.forEach(function (x) { if (x) sel.push(x); }); });
    var d = sel[0][X] - sel[0][Y], s = sel[0][X] + sel[0][Y];
    return {
      selisih: sel.every(function (x) { return x[X] - x[Y] === d; }) ? d : null,
      jumlah: sel.every(function (x) { return x[X] + x[Y] === s; }) ? s : null
    };
  }

  /**
   * Jenis unsur berganti antarkotak (satu jenis per baris atau per kolom): jenis kotak "?" dari pola letak
   * jenisnya, banyaknya dari aturan hitungan pada banyak unsur tanpa memandang jenisnya.
   */
  function ramalCampur(G, tr, tc) {
    var vis = [];
    G.forEach(function (b) { b.forEach(function (x) { if (x) vis.push(x); }); });
    if (vis.some(function (x) { return Object.keys(x).length !== 1 || x.sisi != null; })) return null;
    var J = G.map(function (b) { return b.map(function (x) { return x ? Object.keys(x)[0] : null; }); });
    var N = G.map(function (b) { return b.map(function (x) { return x ? x[Object.keys(x)[0]] : null; }); });
    var cj = UNSUR.slice();
    Object.keys(POLA_LETAK).forEach(function (nm) {
      var d = UNSUR.filter(function (v) { var W = J.map(function (b) { return b.slice(); }); W[tr][tc] = v; return POLA_LETAK[nm](W); });
      if (d.length) cj = cj.filter(function (v) { return d.indexOf(v) >= 0; });
    });
    var cn = calonKanal(N, tr, tc, ranahJml('n'));
    if (cj.length !== 1 || cn.length !== 1) return null;
    var o = {};
    o[cj[0]] = cn[0];
    return o;
  }

  /** Isi kotak "?" hitungan; null bila aturan yang berlaku tidak menunjuk satu isi. */
  function ramalJml(G, tr, tc) {
    var contoh = null, r, c, ks = {};
    G.forEach(function (b) { b.forEach(function (x) { if (x) ks[Object.keys(x).join(',')] = 1; }); });
    if (Object.keys(ks).length > 1) return ramalCampur(G, tr, tc);
    for (r = 0; r < 3 && !contoh; r++) for (c = 0; c < 3 && !contoh; c++) if (G[r][c]) contoh = G[r][c];
    var kanal = Object.keys(contoh), hitung = kanal.filter(function (k) { return k !== 'sisi'; });
    var C = {};
    function nilai(fn) { return G.map(function (b) { return b.map(function (x) { return x ? fn(x) : null; }); }); }
    kanal.forEach(function (k) { C[k] = calonKanal(nilai(function (x) { return x[k]; }), tr, tc, ranahJml(k)); });
    var Ct = hitung.length >= 2 ? calonKanal(nilai(function (x) { return jumlahArr(hitung.map(function (k) { return x[k]; })); }), tr, tc, ranahJml('total')) : null;
    var hub = [];
    for (var i = 0; i < kanal.length; i++) for (var j = i + 1; j < kanal.length; j++) hub.push({ X: kanal[i], Y: kanal[j], h: hubunganSel(G, kanal[i], kanal[j]) });
    var hasil = [];
    (function jelajah(ki, sel) {
      if (hasil.length > 1) return;
      if (ki === kanal.length) {
        if (!hub.every(function (h) { return (h.h.selisih === null || sel[h.X] - sel[h.Y] === h.h.selisih) && (h.h.jumlah === null || sel[h.X] + sel[h.Y] === h.h.jumlah); })) return;
        if (Ct && Ct.indexOf(jumlahArr(hitung.map(function (k) { return sel[k]; }))) < 0) return;
        hasil.push(selJml(sel));
        return;
      }
      C[kanal[ki]].forEach(function (v) { var s = Object.assign({}, sel); s[kanal[ki]] = v; jelajah(ki + 1, s); });
    })(0, {});
    return hasil.length === 1 ? hasil[0] : null;
  }

  // ---------------------------------------------- pembangun nilai

  function bedaBaris(V) { var s = V.map(function (b) { return b.join(','); }); return s[0] !== s[1] && s[1] !== s[2] && s[0] !== s[2]; }
  function dalamRentang(V, lo, hi) { return V.every(function (b) { return b.every(function (v) { return v >= lo && v <= hi; }); }); }

  /** Tiga baris berbeda yang dipilih merata dari daftar baris yang sah. */
  function tigaBaris(a, daftar) {
    for (var coba = 0; coba < 40; coba++) {
      var V = [a.pilih(daftar), a.pilih(daftar), a.pilih(daftar)].map(function (b) { return b.slice(); });
      if (bedaBaris(V)) return V;
    }
    return null;
  }
  var BARIS_TAMBAH = [], BARIS_KURANG = [];
  (function () {
    for (var x = 1; x <= 8; x++) for (var y = 1; x + y <= 9; y++) BARIS_TAMBAH.push([x, y, x + y]);
    for (var p = 2; p <= 9; p++) for (var q = 1; q < p; q++) BARIS_KURANG.push([p, q, p - q]);
  })();
  function nilaiTambah(a) { return tigaBaris(a, BARIS_TAMBAH); }
  function nilaiKurang(a) { return tigaBaris(a, BARIS_KURANG); }
  /** Tiap baris berjumlah K yang sama; isi lo..hi. */
  function nilaiTetap(a, lo, hi) {
    lo = lo || 1; hi = hi || 9;
    var K = a.bulat(3 * lo + 4, 3 * hi - 4), daftar = [];
    for (var x = lo; x <= hi; x++) for (var y = lo; y <= hi; y++) { var z = K - x - y; if (z >= lo && z <= hi) daftar.push([x, y, z]); }
    return daftar.length >= 3 ? tigaBaris(a, daftar) : null;
  }
  /**
   * Tiap baris deret aritmetika. Tanpa `bebas`: langkah d sama di semua baris (awal berbeda). Dengan
   * `bebas` (daftar kelipatan): tiap baris memakai langkah sendiri d*k, k dari daftar itu.
   */
  function nilaiNaik(a, d, lo, hi, bebas) {
    lo = lo || 1; hi = hi || 9;
    var daftar = [];
    (bebas || [1]).forEach(function (k) {
      (d === 0 ? [k, -k] : [d * k]).forEach(function (h) {
        for (var s = lo; s <= hi; s++) if (s + 2 * h >= lo && s + 2 * h <= hi) daftar.push([s, s + h, s + 2 * h]);
      });
    });
    if (!daftar.length) return null;
    for (var coba = 0; coba < 80; coba++) {
      var V = [a.pilih(daftar), a.pilih(daftar), a.pilih(daftar)].map(function (b) { return b.slice(); });
      if (!bedaBaris(V)) continue;
      var st = V.map(function (b) { return b[0]; }), lk = V.map(function (b) { return b[1] - b[0]; });
      // jangan sampai sama dengan matriks "langkah baris dan kolom" (awal ikut berderet dengan langkah sama)
      if (lk[0] === lk[1] && lk[1] === lk[2] && st[1] - st[0] === st[2] - st[1]) continue;
      return V;
    }
    return null;
  }
  function nilaiAditif(a) {
    var SEL = [-4, -3, -2, -1, 1, 2, 3, 4, 5, -5];
    for (var coba = 0; coba < 80; coba++) {
      var dasar = a.ambil(rentang(1, 9), 3), o1 = a.pilih(SEL), o2 = a.pilih(SEL);
      if (o1 === o2) continue;
      var off = [0, o1, o2], V = off.map(function (o) { return dasar.map(function (b) { return b + o; }); });
      if (dalamRentang(V, 1, 9)) return { V: V, off: off };
    }
    return null;
  }
  function opHitung(op, x, y) { return op === 'tambah' ? x + y : x - y; }
  function nilaiGanda(a, opB, opK) {
    for (var coba = 0; coba < 120; coba++) {
      var x = a.bulat(1, 9), y = a.bulat(1, 9), u = a.bulat(1, 9), v = a.bulat(1, 9);
      var b0 = [x, y, opHitung(opB, x, y)], b1 = [u, v, opHitung(opB, u, v)];
      var V = [b0, b1, [0, 1, 2].map(function (c) { return opHitung(opK, b0[c], b1[c]); })];
      if (dalamRentang(V, 1, 9) && bedaBaris(V) && bedaBaris(transpos(V))) return V;
    }
    return null;
  }
  function nilaiLatinSisi(a, lo) {
    var s = a.ambil(rentang(lo, 8), 3), k = a.pilih([1, 2]);
    return [0, 1, 2].map(function (r) { return [0, 1, 2].map(function (c) { return s[(c + k * r) % 3]; }); });
  }

  /** Aturan satu kanal hitungan: { nama, arah: 'baris'|'kolom'|'dua', V, ...besaran aturannya }. */
  function bangunAturan(a, nama, o) {
    o = o || {};
    var V, h, opB, opK;
    switch (nama) {
      case 'tambah': V = nilaiTambah(a); return V && { nama: 'tambah', arah: 'baris', V: V };
      case 'tambah-kolom': V = nilaiTambah(a); return V && { nama: 'tambah', arah: 'kolom', V: transpos(V) };
      case 'kurang': V = nilaiKurang(a); return V && { nama: 'kurang', arah: 'baris', V: V };
      case 'tambah-kiri': V = nilaiTambah(a); return V && { nama: 'tambah-kiri', arah: 'baris', V: V.map(function (b) { return [b[2], b[0], b[1]]; }) };
      case 'kurang-kolom': V = nilaiKurang(a); return V && { nama: 'kurang', arah: 'kolom', V: transpos(V) };
      case 'tetap': V = nilaiTetap(a, o.lo, o.hi); return V && { nama: 'tetap', arah: 'baris', V: V, K: jumlahArr(V[0]) };
      case 'tetap-kolom': V = nilaiTetap(a, o.lo, o.hi); return V && { nama: 'tetap', arah: 'kolom', V: transpos(V), K: jumlahArr(V[0]) };
      case 'naik': V = nilaiNaik(a, o.d != null ? o.d : a.pilih([1, 1, -1]), o.lo, o.hi, o.bebas); return V && { nama: 'naik', arah: 'baris', V: V };
      case 'naik-kolom': V = nilaiNaik(a, o.d != null ? o.d : a.pilih([1, 1, -1]), o.lo, o.hi, o.bebas); return V && { nama: 'naik', arah: 'kolom', V: transpos(V) };
      case 'aditif': h = nilaiAditif(a); return h && { nama: 'aditif', arah: 'dua', V: h.V, off: h.off };
      case 'ganda':
        opB = a.pilih(['tambah', 'kurang']); opK = a.pilih(['tambah', 'kurang']);
        V = nilaiGanda(a, opB, opK);
        return V && { nama: 'ganda', arah: 'dua', V: V, opB: opB, opK: opK };
      case 'sama-kolom': V = a.ambil(rentang(o.lo || 4, 8), 3); return { nama: 'sama', arah: 'kolom', V: [V, V, V] };
      case 'sama-baris': V = a.ambil(rentang(o.lo || 4, 8), 3); return { nama: 'sama', arah: 'baris', V: V.map(function (v) { return [v, v, v]; }) };
      case 'latin': return { nama: 'latin', arah: 'baris', V: nilaiLatinSisi(a, o.lo || 4) };
      default: return null;
    }
  }

  // ---------------------------------------------- rencana per tingkat

  function rencanaJml(a, level, dipakai) {
    var semua;
    if (level === 'mudah') semua = ['tambah', 'tambah-kolom', 'tambah-kiri', 'naik'];
    else if (level === 'sedang') semua = ['kurang', 'kurang', 'tetap', 'tetap', 'tambah-lubang', 'tambah-lubang', 'kurang-kolom', 'kurang-kolom', 'sisi-titik'];
    else semua = ['dua-jenis', 'dua-jenis', 'baris-kolom', 'sisi-dua', 'sisi-dua'];
    var baru = semua.filter(function (p) { return (dipakai || []).indexOf('matriks-jumlah:' + p) < 0; });
    return a.pilih(baru.length ? baru : semua);
  }

  /** Bangun kanal-kanal menurut mekanisme: { kanal: [{ unsur, aturan, ikut }], tanya, geser } */
  function bangunJml(a, level, mek) {
    var t = a.pilih(UNSUR), k1, k2;
    var semuaSel = function () { return [a.bulat(0, 2), a.bulat(0, 2)]; };
    switch (mek) {
      case 'tambah': return { kanal: [{ unsur: t, aturan: bangunAturan(a, 'tambah') }], tanya: [2, 2] };
      case 'tambah-kolom': return { kanal: [{ unsur: t, aturan: bangunAturan(a, 'tambah-kolom') }], tanya: [2, 2] };
      case 'tambah-kiri': return { kanal: [{ unsur: t, aturan: bangunAturan(a, 'tambah-kiri') }], tanya: a.pilih([[2, 0], [2, 0], [2, 2]]) };
      case 'naik': return { kanal: [{ unsur: t, aturan: bangunAturan(a, a.untung(0.7) ? 'naik' : 'naik-kolom', { d: a.pilih([1, -1, 0]), bebas: [1, 2, 3] }) }], tanya: [2, 2] };
      case 'kurang': return { kanal: [{ unsur: t, aturan: bangunAturan(a, 'kurang') }], tanya: a.pilih([[2, 2], [2, 2], [1, 2], [0, 2], [2, 0], [2, 1]]) };
      case 'kurang-kolom': return { kanal: [{ unsur: t, aturan: bangunAturan(a, 'kurang-kolom') }], tanya: a.pilih([[2, 2], [2, 1], [2, 0], [0, 2], [1, 2]]) };
      case 'tetap': return { kanal: [{ unsur: t, aturan: bangunAturan(a, 'tetap') }], tanya: semuaSel() };
      case 'tambah-lubang':
        k1 = bangunAturan(a, a.untung(0.5) ? 'tambah' : 'tambah-kolom');
        return k1 && { kanal: [{ unsur: t, aturan: k1 }], tanya: k1.arah === 'kolom' ? [a.bulat(0, 1), a.bulat(0, 2)] : [a.bulat(0, 2), a.bulat(0, 1)] };
      case 'sisi-titik':
        var pola = a.pilih(['naik', 'naik-kolom', 'tetap', 'tetap-kolom']), geser = a.pilih([0, -1, 1, -2]);
        k1 = bangunAturan(a, pola, { d: a.pilih([1, -1, 0]), lo: 3, hi: 8, bebas: [1, 2] });
        if (!k1) return null;
        k2 = { nama: 'ikut-sisi', arah: k1.arah, V: k1.V.map(function (b) { return b.map(function (v) { return v + geser; }); }), geser: geser };
        return { kanal: [{ unsur: 'sisi', aturan: k1 }, { unsur: a.pilih(ISI_BANGUN), aturan: k2, ikut: true }], tanya: semuaSel(), geser: geser };
      case 'dua-jenis':
        var dua = a.ambil(UNSUR, 2);
        if (MIRIP.indexOf(dua.join('|')) >= 0) return null;
        var atur1 = a.pilih(['tambah', 'tambah-kolom', 'naik']);
        var pil2 = ['kurang', 'tetap', 'kurang-kolom', 'tetap-kolom', 'naik-kolom'].filter(function (x) { return x !== atur1; });
        if (atur1 === 'tambah') pil2.push('tambah-kolom'); else if (atur1 === 'tambah-kolom') pil2.push('tambah');
        k1 = bangunAturan(a, atur1, { bebas: [1, 2] }); k2 = bangunAturan(a, a.pilih(pil2), { bebas: [1, 2] });
        return k1 && k2 && { kanal: [{ unsur: dua[0], aturan: k1 }, { unsur: dua[1], aturan: k2 }], tanya: semuaSel() };
      case 'baris-kolom':
        // aturan baris dan kolom sekaligus: selisih antarbaris tetap di tiap kolom, atau operasi baris + operasi kolom;
        // kadang ditemani jenis unsur kedua dengan aturan hitungan sederhana
        k1 = bangunAturan(a, a.untung(0.12) ? 'ganda' : 'aditif');
        if (!k1) return null;
        var tanyaBK = a.pilih([[1, 1], [1, 1], [0, 0], [0, 1], [1, 0], [2, 1], [1, 2], [2, 2], [0, 2], [2, 0]]);
        if (a.untung(0.35)) return { kanal: [{ unsur: t, aturan: k1 }], tanya: tanyaBK };
        var t2 = a.pilih(UNSUR.filter(function (u) { return u !== t && MIRIP.indexOf(t + '|' + u) < 0; }));
        k2 = bangunAturan(a, a.pilih(['tambah', 'kurang', 'tetap', 'naik-kolom', 'tambah-kolom']), { bebas: [1, 2] });
        return k2 && { kanal: [{ unsur: t, aturan: k1 }, { unsur: t2, aturan: k2 }], tanya: tanyaBK };
      default:   // sisi-dua: bangun mengikuti pola letak, unsur di dalamnya mengikuti aturan hitungan
        k2 = bangunAturan(a, a.pilih(['tambah', 'kurang', 'tetap', 'tambah-kolom', 'kurang-kolom']));
        if (!k2) return null;
        var lo = k2.V.some(function (b) { return b.some(function (v) { return v > 4; }); }) ? 4 : 3;
        k1 = bangunAturan(a, a.pilih(['sama-kolom', 'sama-baris', 'latin', 'naik', 'naik-kolom']), { d: a.pilih([1, -1]), lo: lo, hi: 8 });
        return k1 && { kanal: [{ unsur: 'sisi', aturan: k1 }, { unsur: a.pilih(ISI_BANGUN), aturan: k2 }], tanya: semuaSel() };
    }
  }

  // ---------------------------------------------- pengecoh hitungan

  function sahJml(sel) {
    var ks = Object.keys(sel), hitung = ks.filter(function (k) { return k !== 'sisi'; });
    if (!hitung.length) return false;
    if (sel.sisi != null && (sel.sisi < 3 || sel.sisi > 8)) return false;
    if (hitung.some(function (k) { return sel[k] < 1 || sel[k] > 9; })) return false;
    if (sel.sisi === 3 && sel[hitung[0]] > 4) return false;
    return true;
  }

  function sebut(n, unsur) { return unsur === 'sisi' ? 'bangun bersisi ' + n : n + ' ' + NAMA_UNSUR[unsur]; }
  function bandingTeks(d) { return d > 0 ? d + ' lebih banyak' : Math.abs(d) + ' lebih sedikit'; }
  function tandaOp(op) { return op === 'tambah' ? '+' : '-'; }

  /** Tiga nilai garis aturan (baris/kolom) yang memuat kotak "?" dan indeks kotak itu di garisnya. */
  function garisAturan(V, atur, tr, tc) {
    if (atur.arah === 'kolom') return { vals: [V[0][tc], V[1][tc], V[2][tc]], m: tr, nama: 'kolom ' + (tc + 1) };
    return { vals: V[tr].slice(), m: tc, nama: 'baris ' + (tr + 1) };
  }

  /** Nilai salah dari jalur "aturan tertukar" untuk satu kanal (null bila tidak ada). */
  function nilaiTertukar(atur, V, tr, tc) {
    var g = garisAturan(V, atur, tr, tc), v = g.vals, m = g.m, benar = v[m];
    var nama = atur.nama === 'ganda' ? atur.opB : atur.nama;
    if (nama === 'tambah') return m === 2 ? { n: Math.abs(v[0] - v[1]), ket: 'memakai selisih (' + Math.max(v[0], v[1]) + ' - ' + Math.min(v[0], v[1]) + '), padahal aturannya penjumlahan' } :
      { n: v[2] + v[1 - m], ket: 'menjumlahkan ' + v[1 - m] + ' + ' + v[2] + ', padahal kotak itu ditambah ' + v[1 - m] + ' harus menjadi ' + v[2] };
    if (nama === 'tambah-kiri') return m === 0 ? { n: Math.abs(v[1] - v[2]), ket: 'memakai selisih (' + Math.max(v[1], v[2]) + ' - ' + Math.min(v[1], v[2]) + '), padahal kotak pertama adalah jumlah kedua kotak lainnya' } :
      { n: v[0] + v[3 - m], ket: 'menjumlahkan ' + v[0] + ' + ' + v[3 - m] + ', padahal kotak pertama adalah hasil penjumlahan kedua kotak lainnya' };
    if (nama === 'kurang') return m === 2 ? { n: v[0] + v[1], ket: 'memakai penjumlahan (' + v[0] + ' + ' + v[1] + '), padahal aturannya pengurangan' } :
      (m === 0 ? { n: Math.abs(v[1] - v[2]), ket: 'mengurangkan ' + Math.max(v[1], v[2]) + ' - ' + Math.min(v[1], v[2]) + ', padahal kotak pertama = kotak kedua + kotak ketiga' } : { n: v[0] + v[2], ket: 'menjumlahkan ' + v[0] + ' + ' + v[2] + ', padahal kotak kedua = kotak pertama - kotak ketiga' });
    if (nama === 'tetap') { var lain = v.filter(function (x, i) { return i !== m; }); return { n: lain[0] + lain[1], ket: 'menjumlahkan dua kotak lain (' + lain[0] + ' + ' + lain[1] + '), padahal jumlah satu garis selalu ' + atur.K }; }
    if (nama === 'naik') return { n: m === 0 ? v[1] : v[m - 1], ket: 'tidak memperhitungkan langkahnya; banyaknya disamakan dengan kotak di sebelahnya' };
    if (nama === 'aditif') {
      var ref = tr === 0 ? 1 : 0, beda = atur.off[tr] - atur.off[ref];
      return { n: V[ref][tc] - beda, ket: 'membalik arah selisih antarbaris (' + V[ref][tc] + (beda > 0 ? ' - ' : ' + ') + Math.abs(beda) + ')' };
    }
    return null;
  }

  function pengecohJml(a, level, G, tr, tc, kunci, rencana, jg) {
    var calon = [], kanal = rencana.kanal;
    function tambah(sel, jenis, alasan) { sel = selJml(sel); if (sahJml(sel)) calon.push({ sel: sel, jenis: jenis, alasan: alasan }); }
    function dengan(k, v) { var s = Object.assign({}, kunci); s[k] = v; return s; }
    var hitungK = Object.keys(kunci).filter(function (k) { return k !== 'sisi'; });
    // salah hitung satu
    Object.keys(kunci).forEach(function (k) {
      [1, -1].forEach(function (d) {
        tambah(dengan(k, kunci[k] + d), k === 'sisi' ? 'bangun' : 'hitung', k === 'sisi' ? 'banyak unsur di dalamnya benar, tetapi bangunnya bersisi ' + (kunci.sisi + d) + ', padahal seharusnya bersisi ' + kunci.sisi :
          'berisi ' + sebut(kunci[k] + d, k) + ', ' + (d > 0 ? 'kelebihan' : 'kurang') + ' satu dari ' + kunci[k] + ' yang dihasilkan aturannya');
      });
    });
    // aturan tertukar
    kanal.forEach(function (kn) {
      if (kn.ikut || kn.unsur === 'sisi') return;
      var salah = nilaiTertukar(kn.aturan, kn.aturan.V, tr, tc), ku = kn.unsur === 'campur' ? hitungK[0] : kn.unsur;
      if (salah && salah.n !== kunci[ku]) tambah(dengan(ku, salah.n), 'tertukar', 'berisi ' + sebut(salah.n, ku) + ' karena ' + salah.ket);
    });
    // jenis unsur tertukar
    if (hitungK.length === 2 && kunci[hitungK[0]] !== kunci[hitungK[1]]) {
      var s2 = Object.assign({}, kunci); s2[hitungK[0]] = kunci[hitungK[1]]; s2[hitungK[1]] = kunci[hitungK[0]];
      tambah(s2, 'jenis', 'banyak ' + NAMA_UNSUR[hitungK[0]] + ' dan ' + NAMA_UNSUR[hitungK[1]] + ' tertukar');
    } else if (hitungK.length === 1) {
      var asal = hitungK[0], lain = a.pilih((kunci.sisi ? ISI_BANGUN : (jg ? jg.unsur : UNSUR)).filter(function (u) { return u !== asal; })), s1 = {};
      if (kunci.sisi) s1.sisi = kunci.sisi;
      s1[lain] = kunci[asal];
      tambah(s1, 'jenis', 'banyaknya benar (' + kunci[asal] + '), tetapi unsurnya ' + NAMA_UNSUR[lain] + (jg ? ' seperti pada ' + jg.arah + ' lain' : '') + ', padahal ' + (jg ? jg.arah + ' itu memakai ' : 'semua kotak memakai ') + NAMA_UNSUR[asal]);
    }
    // salin tetangga
    [[tr, tc - 1], [tr, tc + 1], [tr - 1, tc], [tr + 1, tc]].forEach(function (rc) {
      var r = rc[0], c = rc[1];
      if (r < 0 || r > 2 || c < 0 || c > 2) return;
      tambah(salin(G[r][c]), 'salin', 'hanya menyalin ' + (r === tr ? 'kotak di sebelah ' + (c < tc ? 'kiri' : 'kanan') + 'nya' : 'kotak di ' + (r < tr ? 'atas' : 'bawah') + 'nya'));
    });
    // dua kanal sama-sama meleset satu
    if (Object.keys(kunci).length === 2) {
      var ks = Object.keys(kunci), d1 = a.pilih([1, -1]), d2 = a.pilih([1, -1]), s4 = Object.assign({}, kunci);
      s4[ks[0]] += d1; s4[ks[1]] += d2;
      tambah(s4, 'dua', 'kedua hitungannya meleset satu: ' + sebut(s4[ks[0]], ks[0]) + ' dan ' + sebut(s4[ks[1]], ks[1]));
    }
    var lihat = {}, hasil = [];
    lihat[sj(kunci)] = 1;
    function beda(sel) {
      var ks2 = {}; Object.keys(sel).concat(Object.keys(kunci)).forEach(function (k) { ks2[k] = 1; });
      return Object.keys(ks2).filter(function (k) { return sel[k] !== kunci[k]; });
    }
    function ambil(fn) {
      if (hasil.length >= 4) return;
      var c = a.kocok(calon.filter(function (x) { return !lihat[sj(x.sel)] && fn(x); }))[0];
      if (!c) return;
      lihat[sj(c.sel)] = 1;
      hasil.push(c);
    }
    var ikut = kanal.some(function (kn) { return kn.ikut; });
    ambil(function (x) { return x.jenis === 'tertukar'; });
    ambil(function (x) { return x.jenis === 'hitung'; });
    if (Object.keys(kunci).length === 2) {
      Object.keys(kunci).forEach(function (k) {
        if (!hasil.some(function (h) { var b = beda(h.sel); return b.length === 1 && b[0] === k; })) ambil(function (x) { var b = beda(x.sel); return b.length === 1 && b[0] === k; });
      });
    }
    if (ikut) ambil(function (x) { return x.jenis === 'dua'; });
    ambil(function (x) { return x.jenis === 'jenis'; });
    ambil(function (x) { return x.jenis === 'salin'; });
    for (var i = 0; i < 6 && hasil.length < 4; i++) ambil(function () { return true; });
    return hasil.length === 4 ? hasil : null;
  }

  // ---------------------------------------------- uraian pembahasan hitungan

  /** Persamaan satu garis (teks pembahasan dan gambar); kotak ke-m ditulis "?" bila kos. */
  function persamaan(atur, vals, m, kos, arahBaca) {
    var t = vals.map(function (v, i) { return kos && i === m ? '?' : String(v); }), nama = atur.nama;
    if (nama === 'ganda') nama = arahBaca === 'kolom' ? atur.opK : atur.opB;
    if (nama === 'tambah') return t[0] + ' + ' + t[1] + ' = ' + t[2];
    if (nama === 'tambah-kiri') return t[0] + ' = ' + t[1] + ' + ' + t[2];
    if (nama === 'kurang') return t[0] + ' - ' + t[1] + ' = ' + t[2];
    if (nama === 'tetap') return t[0] + ' + ' + t[1] + ' + ' + t[2] + ' = ' + atur.K;
    if (nama === 'naik') {
      var d = vals[1] - vals[0];
      return t.join(', ') + ' (' + (d > 0 ? '+' : '') + d + ')';
    }
    return t.join(', ');
  }

  function namaGaris(arah, i) { return arah === 'kolom' ? 'kolom ' + (i + 1) : 'baris ' + (i + 1); }
  function garisKe(V, arah, i) { return arah === 'kolom' ? [V[0][i], V[1][i], V[2][i]] : V[i].slice(); }

  /** Kalimat aturan satu kanal beserta contoh garis lengkap dan penerapannya pada kotak "?". */
  function uraiKanalJml(kn, tr, tc, kunci) {
    var atur = kn.aturan, nm = NAMA_UNSUR[kn.unsur], V = atur.V, kal = [];
    var unsurK = kn.unsur === 'campur' ? Object.keys(kunci)[0] : kn.unsur, nilaiK = kunci[unsurK];
    var arah = atur.arah === 'kolom' ? 'kolom' : 'baris';
    var iTanya = arah === 'kolom' ? tc : tr, mTanya = arah === 'kolom' ? tr : tc;
    var contoh = [0, 1, 2].filter(function (i) { return i !== iTanya; });
    var dalamGaris = 'setiap ' + arah, urut = arah === 'kolom' ? 'dari atas ke bawah' : 'dari kiri ke kanan', ke = arah === 'kolom' ? 'bawah' : 'ketiga', k1 = arah === 'kolom' ? 'atas' : 'pertama', k2 = arah === 'kolom' ? 'tengah' : 'kedua';
    var cth = contoh.map(function (i) { return namaGaris(arah, i) + ': ' + persamaan(atur, garisKe(V, arah, i), -1, false, arah); }).join('; ');
    var hasilTeks = unsurK === 'sisi' ? 'jadi bangun pada kotak yang dicari bersisi ' + nilaiK + '.' : 'jadi kotak yang dicari berisi ' + sebut(nilaiK, unsurK) + '.';
    var terap = 'Pada ' + namaGaris(arah, iTanya) + ': ' + persamaan(atur, garisKe(V, arah, iTanya), mTanya, true, arah) + ', sehingga ? = ' + nilaiK + '; ' + hasilTeks;
    var rb = tr === 0 ? 1 : 0, cb = tc === 0 ? 1 : 0;
    switch (atur.nama) {
      case 'tambah':
        kal.push('Banyak ' + nm + ': pada ' + dalamGaris + ', kotak ' + ke + ' berisi jumlah kotak ' + k1 + ' dan kotak ' + k2 + ' (' + cth + ').');
        kal.push(terap);
        break;
      case 'tambah-kiri':
        kal.push('Banyak ' + nm + ': pada ' + dalamGaris + ', kotak pertama berisi jumlah kotak kedua dan kotak ketiga (' + cth + ').');
        kal.push(terap);
        break;
      case 'kurang':
        kal.push('Banyak ' + nm + ': pada ' + dalamGaris + ', kotak ' + ke + ' berisi hasil kotak ' + k1 + ' dikurangi kotak ' + k2 + ' (' + cth + ').');
        kal.push(terap);
        break;
      case 'tetap':
        kal.push('Banyak ' + nm + ': jumlah ketiga kotak pada ' + dalamGaris + ' selalu ' + atur.K + ' (' + cth + ').');
        kal.push(terap);
        break;
      case 'naik':
        var lk = [0, 1, 2].map(function (i) { var g = garisKe(V, arah, i); return g[1] - g[0]; });
        if (lk[0] === lk[1] && lk[1] === lk[2]) kal.push('Banyak ' + nm + ': pada ' + dalamGaris + ', ' + urut + ', banyaknya ' + (lk[0] > 0 ? 'bertambah ' : 'berkurang ') + Math.abs(lk[0]) + ' tiap kotak (' + cth + ').');
        else if (lk.every(function (x) { return x > 0; }) || lk.every(function (x) { return x < 0; })) kal.push('Banyak ' + nm + ': pada ' + dalamGaris + ', ' + urut + ', banyaknya ' + (lk[0] > 0 ? 'bertambah' : 'berkurang') + ' sama banyak dari kotak ke kotak, dengan besar langkah masing-masing ' + arah + ' (' + cth + ').');
        else kal.push('Banyak ' + nm + ': pada ' + dalamGaris + ', ' + urut + ', banyaknya berubah sama banyak dari kotak ke kotak (bertambah atau berkurang), dengan besar langkah masing-masing ' + arah + ' (' + cth + ').');
        kal.push(terap);
        break;
      case 'aditif':
        var off = atur.off, ref = tr === 0 ? 1 : 0, bd = off[tr] - off[ref];
        var kols = [0, 1, 2].filter(function (c) { return c !== tc; }).map(function (c) { return 'kolom ' + (c + 1) + ': ' + V[0][c] + ', ' + V[1][c] + ', ' + V[2][c]; });
        kal.push('Banyak ' + nm + ': pada setiap kolom, selisih antarbaris selalu sama. Setiap kotak di baris 2 berisi ' + bandingTeks(off[1]) + ' daripada kotak di atasnya (baris 1), dan setiap kotak di baris 3 berisi ' + bandingTeks(off[2]) + ' daripada kotak di baris 1 (' + kols.join('; ') + ').');
        kal.push('Pada kolom ' + (tc + 1) + ': kotak di baris ' + (ref + 1) + ' berisi ' + V[ref][tc] + ', dan kotak di baris ' + (tr + 1) + ' selalu berisi ' + bandingTeks(bd) + ' daripada baris ' + (ref + 1) + ', jadi kotak yang dicari berisi ' + V[ref][tc] + (bd > 0 ? ' + ' : ' - ') + Math.abs(bd) + ' = ' + sebut(nilaiK, unsurK) + '.');
        break;
      case 'ganda':
        var kolomKe = function (c) { return [V[0][c], V[1][c], V[2][c]]; };
        kal.push('Banyak ' + nm + ': pada setiap baris, kotak ketiga = kotak pertama ' + tandaOp(atur.opB) + ' kotak kedua, dan pada setiap kolom, kotak bawah = kotak atas ' + tandaOp(atur.opK) + ' kotak tengah (baris ' + (rb + 1) + ': ' + persamaan(atur, V[rb], -1, false, 'baris') + '; kolom ' + (cb + 1) + ': ' + persamaan(atur, kolomKe(cb), -1, false, 'kolom') + ').');
        kal.push('Pada baris ' + (tr + 1) + ': ' + persamaan(atur, V[tr], tc, true, 'baris') + ', dan pada kolom ' + (tc + 1) + ': ' + persamaan(atur, kolomKe(tc), tr, true, 'kolom') + '; keduanya memberi ' + sebut(nilaiK, unsurK) + '.');
        break;
      case 'sama':
        kal.push('Bangun: setiap ' + atur.arah + ' memuat bangun yang sama (' + [0, 1, 2].map(function (i) { return namaGaris(atur.arah, i) + ' bersisi ' + garisKe(V, atur.arah, i)[0]; }).join(', ') + ').');
        kal.push('Jadi bangun pada kotak yang dicari bersisi ' + nilaiK + '.');
        break;
      case 'latin':
        kal.push('Bangun: setiap baris dan setiap kolom memuat ketiga bangun (bersisi ' + urutKata(V[0]).split(',').join(', ') + ') tepat satu kali. Baris ' + (tr + 1) + ' sudah memuat bangun bersisi ' + V[tr].filter(function (v, c) { return c !== tc; }).join(' dan ') + '.');
        kal.push('Jadi bangun pada kotak yang dicari bersisi ' + nilaiK + '.');
        break;
    }
    return kal;
  }

  // ---------------------------------------------- gambar pembahasan hitungan

  var NAMA_PENDEK = { hitam: 'titik hitam', putih: 'titik putih', kotak: 'kotak', segitiga: 'segitiga', garis: 'garis', bintang: 'bintang', ketupat: 'ketupat', silang: 'silang' };
  function labelHitung(sel) {
    if (sel.sisi) { var u = Object.keys(sel).filter(function (k) { return k !== 'sisi'; })[0]; return [sel.sisi + ' sisi, ' + sel[u] + ' ' + (u === 'hitam' ? 'titik' : NAMA_PENDEK[u])]; }
    return Object.keys(sel).map(function (k) { return sel[k] + ' ' + NAMA_PENDEK[k]; });
  }

  /** Label hitungan satu kotak, urut dan berwarna menurut urutan kanal aturannya. */
  function labelKanal(sel, kanal) {
    if (sel.sisi || Object.keys(sel).length === 1) return labelHitung(sel).map(function (t) { return { t: t, w: 0 }; });
    return kanal.filter(function (kn) { return !kn.ikut; }).map(function (kn, i) { return { t: sel[kn.unsur] + ' ' + NAMA_PENDEK[kn.unsur], w: i }; });
  }

  var WARNA_KANAL = [BH.teks, BH.panah];

  function tampilBaris(kn) { var n = kn.aturan.nama; return !kn.ikut && (kn.aturan.arah === 'baris' || n === 'ganda' || n === 'aditif'); }
  function tampilKolom(kn) { var n = kn.aturan.nama; return !kn.ikut && (kn.aturan.arah === 'kolom' || n === 'ganda'); }

  /** Persamaan tiap garis untuk satu kanal (teks untuk gambar). */
  function persamaanGambar(kn, i, arah) {
    var atur = kn.aturan, g = garisKe(atur.V, arah, i);
    if (atur.nama === 'aditif') return i === 0 ? 'baris acuan' : '= baris 1 ' + (atur.off[i] > 0 ? '+ ' : '- ') + Math.abs(atur.off[i]);
    if (atur.nama === 'sama') return g.join(', ') + ' (sama)';
    return persamaan(atur, g, -1, false, arah);
  }

  /** Gambar 1: hitungan di bawah tiap kotak dan persamaan tiap baris/kolom; kotak jawaban hijau. */
  function svgHitungJml(m, judul) {
    var u = 86, pad = 10, y0 = pad + 26 + 8, o = [];
    var gx = m.kanal.some(tampilKolom) ? 26 : 14;
    var G = m.grid.map(function (b, r) { return b.map(function (x, c) { return r === m.tanya[0] && c === m.tanya[1] ? m.jawaban : x; }); });
    var nLabel = 1;
    G.forEach(function (b) { b.forEach(function (x) { nLabel = Math.max(nLabel, labelKanal(x, m.kanal).length); }); });
    var gy = 10 + nLabel * 13;
    var baris = m.kanal.filter(tampilBaris), kolom = m.kanal.filter(tampilKolom), awalan = m.kanal.length > 1;
    var lebarKanan = 0;
    baris.forEach(function (kn) { [0, 1, 2].forEach(function (i) { lebarKanan = Math.max(lebarKanan, Metrik.lebar((awalan ? NAMA_UNSUR[kn.unsur] + ': ' : '') + persamaanGambar(kn, i, 'baris'), 11, true)); }); });
    var xKanan = pad + 3 * u + 2 * gx + 16, W0 = xKanan + (baris.length ? lebarKanan + 10 : 0) + pad;
    var yBawah = y0 + 3 * (u + gy), H = yBawah + (kolom.length ? kolom.length * 30 + 10 : 0) + 22 + pad;
    var W = lebarJudul(judul, Math.max(W0, 330));
    o.push(teksB(judul, pad, pad + 13, { ukuran: 13, tebal: true }));
    function kx(c) { return pad + c * (u + gx); }
    function ky(r) { return y0 + r * (u + gy); }
    for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) {
      var jawab = r === m.tanya[0] && c === m.tanya[1];
      o.push(kotak(kx(c), ky(r), u, isiJml(G[r][c]), jawab ? { latar: BH.latarJawab, tepi: BH.jawab, tebalTepi: 3.4 } : {}));
      labelKanal(G[r][c], m.kanal).forEach(function (lb, li) { o.push(teksB(lb.t, kx(c) + u / 2, ky(r) + u + 13 + li * 13, { ukuran: 10, tebal: true, rata: 'middle', isi: jawab ? BH.jawab : WARNA_KANAL[lb.w] })); });
    }
    baris.forEach(function (kn, ki) {
      for (var i = 0; i < 3; i++) {
        var jawab = i === m.tanya[0], y = ky(i) + u / 2 + (baris.length > 1 ? (ki ? 12 : -6) : 4);
        o.push(teksB((awalan ? NAMA_UNSUR[kn.unsur] + ': ' : '') + persamaanGambar(kn, i, 'baris'), xKanan, y, { ukuran: 11, tebal: true, isi: jawab ? BH.jawab : WARNA_KANAL[m.kanal.indexOf(kn) ? 1 : 0] }));
      }
      if (ki === 0) for (var j = 0; j < 3; j++) o.push(S.garis(xKanan - 12, ky(j) + 8, xKanan - 12, ky(j) + u - 8, { garis: '#c4cad6', tebal: 1.4 }));
    });
    kolom.forEach(function (kn, ki) {
      for (var i = 0; i < 3; i++) {
        var jawab = i === m.tanya[1];
        o.push(teksB(persamaanGambar(kn, i, 'kolom'), kx(i) + u / 2, yBawah + 12 + ki * 30, { ukuran: 11, tebal: true, rata: 'middle', isi: jawab ? BH.jawab : WARNA_KANAL[m.kanal.indexOf(kn) ? 1 : 0] }));
        o.push(teksB('(' + (NAMA_PENDEK[kn.unsur] || NAMA_UNSUR[kn.unsur]) + ', kolom ' + (i + 1) + ')', kx(i) + u / 2, yBawah + 25 + ki * 30, { ukuran: 10, rata: 'middle', isi: BH.teksRedup }));
      }
    });
    o.push(teksB('Tulisan hijau: kotak jawaban (baris ' + (m.tanya[0] + 1) + ', kolom ' + (m.tanya[1] + 1) + ') dan garis yang memuatnya.', pad, H - pad - 2, { ukuran: 10, isi: BH.teksRedup }));
    return { svg: S.doc(o.join(''), W, H, { latar: '#ffffff' }), lebar: W, tinggi: H };
  }

  /** Gambar 2: garis penentu kotak jawaban diperbesar, dengan tanda operasi atau langkah di antara kotaknya. */
  function svgTerapJml(m, judul) {
    var pad = 10, u = 92, sela = 46, y = pad + 26, o = [], tr = m.tanya[0], tc = m.tanya[1];
    var G = m.grid.map(function (b, r) { return b.map(function (x, c) { return r === tr && c === tc ? m.jawaban : x; }); });
    var panel = [];
    m.kanal.forEach(function (kn) {
      if (kn.ikut) return;
      var n = kn.aturan.nama, arah = n === 'ganda' ? ['baris', 'kolom'] : (n === 'aditif' ? ['kolom'] : [kn.aturan.arah]);
      arah.forEach(function (ar) { panel.push({ kn: kn, arah: ar }); });
    });
    var Wpanel = 3 * u + 2 * sela + 90, W = lebarJudul(judul, pad * 2 + Wpanel), tinggiPanel = u + 64;
    var H = y + panel.length * tinggiPanel + pad;
    o.push(teksB(judul, pad, pad + 13, { ukuran: 13, tebal: true }));
    panel.forEach(function (pn, pi) {
      var kn = pn.kn, atur = kn.aturan, ar = pn.arah, i = ar === 'kolom' ? tc : tr, mi = ar === 'kolom' ? tr : tc;
      var sel = [0, 1, 2].map(function (k) { return ar === 'kolom' ? G[k][tc] : G[tr][k]; });
      var vals = garisKe(atur.V, ar, i), yp = y + pi * tinggiPanel, nama = atur.nama === 'ganda' ? (ar === 'kolom' ? atur.opK : atur.opB) : atur.nama;
      o.push(teksB(Fmt.kapital(NAMA_UNSUR[kn.unsur]) + ' pada ' + namaGaris(ar, i) + (ar === 'kolom' ? ' (atas ke bawah)' : ' (kiri ke kanan)'), pad, yp + 12, { tebal: true, isi: WARNA_KANAL[m.kanal.indexOf(kn) ? 1 : 0] }));
      var yk = yp + 22;
      var op = nama === 'kurang' ? ['-', '='] : (nama === 'tetap' ? ['+', '+'] : (nama === 'tambah' ? ['+', '='] : (nama === 'tambah-kiri' ? ['=', '+'] : null)));
      sel.forEach(function (x, k) {
        var xk = pad + k * (u + sela), jawab = k === mi;
        o.push(kotak(xk, yk, u, isiJml(x), jawab ? { latar: BH.latarJawab, tepi: BH.jawab, tebalTepi: 3.4 } : {}));
        o.push(teksB(String(vals[k]), xk + u / 2, yk + u + 18, { ukuran: 15, tebal: true, rata: 'middle', isi: jawab ? BH.jawab : BH.teks }));
        if (k < 2) {
          var xs = xk + u + sela / 2;
          // tanda kurang digambar sebagai garis (tanda hubung teks terlalu kecil)
          if (op && op[k] === '-') o.push(S.garis(xs - 8, yk + u / 2, xs + 8, yk + u / 2, { garis: BH.panah, tebal: 3.6, ujung: 'round' }));
          else if (op) o.push(teksB(op[k], xs, yk + u / 2 + 9, { ukuran: 26, tebal: true, rata: 'middle', isi: BH.panah }));
          else {
            var d = vals[k + 1] - vals[k];
            o.push(S.panah(xk + u + 6, yk + u / 2 + 6, xk + u + sela - 6, yk + u / 2 + 6, { warna: BH.panah, tebal: 2, kepala: 7 }));
            o.push(teksB(nama === 'sama' ? '=' : (nama === 'latin' ? '' : (d > 0 ? '+' : '') + d), xs, yk + u / 2 - 4, { ukuran: 12, tebal: true, rata: 'middle', isi: BH.panah }));
          }
        }
      });
      var akhir = pad + 3 * u + 2 * sela + 8;
      if (nama === 'tetap') o.push(teksB('= ' + atur.K, akhir, yk + u / 2 + 9, { ukuran: 22, tebal: true, isi: BH.panah }));
      var rumus = nama === 'aditif' || nama === 'latin' || nama === 'sama' ? vals.join(', ') : persamaan(atur, vals, -1, false, ar);
      o.push(teksB(rumus, akhir, yk + u + 18, { ukuran: 11, tebal: true, isi: BH.jawab }));
    });
    return { svg: S.doc(o.join(''), W, H, { latar: '#ffffff' }), lebar: W, tinggi: H };
  }

  // ---------------------------------------------- rakit butir hitungan

  var CATATAN_JML = 'Matriks 3x3 hitungan unsur (banyak titik, garis, kotak kecil, atau sisi bangun yang dijumlah, dikurang, atau dibuat tetap) adalah pengayaan bab Figural Matriks - Kotak 3x3 di Kerangka Course; tidak ada pada contoh riset BAB V.';

  function buatJml(id, level, benih, opsi) {
    var a = Rng.alat(benih);
    var target = opsi.target == null ? a.bulat(0, 4) : opsi.target;
    for (var coba = 0; coba < 80; coba++) {
      var mek = rencanaJml(a, level, opsi.polaDipakai), rc = bangunJml(a, level, mek);
      if (!rc || rc.kanal.some(function (kn) { return !kn.aturan; })) continue;
      // satu jenis unsur per garis aturan (baris atau kolom), bukan satu jenis untuk seluruh matriks
      var jg = null, ar0 = rc.kanal[0].aturan.arah;
      if (rc.kanal.length === 1 && ar0 !== 'dua' && a.untung(0.45)) {
        jg = { arah: ar0, unsur: a.ambil(UNSUR, 3) };
        rc.kanal[0].unsur = 'campur';
      }
      var grid = [0, 1, 2].map(function (r) { return [0, 1, 2].map(function (c) {
        var o = {};
        rc.kanal.forEach(function (kn) { o[jg ? jg.unsur[jg.arah === 'kolom' ? c : r] : kn.unsur] = kn.aturan.V[r][c]; });
        return selJml(o);
      }); });
      if (!grid.every(function (b) { return b.every(sahJml); })) continue;
      var tr = rc.tanya[0], tc = rc.tanya[1], kunci = grid[tr][tc];
      var tampak = grid.map(function (b, r) { return b.map(function (x, c) { return r === tr && c === tc ? null : x; }); });
      var beda = {};
      grid.forEach(function (b) { b.forEach(function (x) { beda[sj(x)] = 1; }); });
      // matriks tidak boleh monoton: sedikitnya lima kotak berbeda (empat bila isi bangun mengikuti sisinya)
      if (Object.keys(beda).length < (mek === 'sisi-titik' ? 4 : 5)) continue;
      var ramal = ramalJml(tampak, tr, tc);
      if (!ramal || sj(ramal) !== sj(kunci)) continue;
      var peng = pengecohJml(a, level, tampak, tr, tc, kunci, rc, jg);
      if (!peng) continue;

      var pem = [], utama = rc.kanal.filter(function (kn) { return !kn.ikut; });
      var garisJenis = jg ? [0, 1, 2].map(function (i) { return namaGaris(jg.arah, i) + ' ' + NAMA_UNSUR[jg.unsur[i]]; }).join(', ') : '';
      var isiB = rc.kanal[0].unsur === 'sisi' ? rc.kanal[1].unsur : null;
      if (isiB) pem.push('Setiap kotak berisi sebuah bangun bersisi banyak dengan sejumlah ' + NAMA_UNSUR[isiB] + ' di dalamnya. Hitung banyak sisi bangun dan banyak ' + NAMA_UNSUR[isiB] + ' pada setiap kotak; Gambar 1 menuliskan hitungan itu di bawah tiap kotak.');
      else if (jg) pem.push('Setiap kotak berisi sejumlah unsur, dan setiap ' + jg.arah + ' memakai jenis unsurnya sendiri (' + garisJenis + '). Yang diperhatikan adalah banyaknya: hitung banyak unsur pada setiap kotak; Gambar 1 menuliskan hitungan itu di bawah tiap kotak beserta persamaan tiap garisnya. Kotak yang dicari memakai jenis unsur ' + namaGaris(jg.arah, jg.arah === 'kolom' ? tc : tr) + ', yaitu ' + NAMA_UNSUR[jg.unsur[jg.arah === 'kolom' ? tc : tr]] + '.');
      else pem.push('Setiap kotak berisi sejumlah ' + utama.map(function (kn) { return NAMA_UNSUR[kn.unsur]; }).join(' dan ') + '. Hitung banyaknya pada setiap kotak; Gambar 1 menuliskan hitungan itu di bawah tiap kotak beserta persamaan tiap garisnya.');
      if (mek === 'sisi-titik') {
        var cth = grid[tr === 0 ? 1 : 0][tc === 0 ? 1 : 0], g = rc.geser;
        pem.push('Banyak ' + NAMA_UNSUR[isiB] + ' di dalam bangun ' + (g === 0 ? 'selalu sama dengan banyak sisinya' : 'selalu ' + bandingTeks(g) + ' daripada banyak sisinya') + ' (misalnya bangun bersisi ' + cth.sisi + ' berisi ' + sebut(cth[isiB], isiB) + ').');
        uraiKanalJml({ unsur: 'sisi', aturan: rc.kanal[0].aturan }, tr, tc, kunci).forEach(function (t) { pem.push(t); });
        pem.push('Karena itu kotak yang dicari berisi bangun bersisi ' + kunci.sisi + ' dengan ' + sebut(kunci[isiB], isiB) + ' di dalamnya' + (g === 0 ? '' : ' (' + kunci.sisi + (g > 0 ? ' + ' : ' - ') + Math.abs(g) + ' = ' + kunci[isiB] + ')') + '.');
      } else rc.kanal.forEach(function (kn) { uraiKanalJml(kn, tr, tc, kunci).forEach(function (t) { pem.push(t); }); });
      if (utama.length > 1) pem.push('Kedua aturan berlaku sendiri-sendiri, jadi ' + (isiB ? 'bangun dan unsur di dalamnya' : 'kedua jenis unsur') + ' harus dihitung terpisah.');
      pem.push('Gambar 2 memperlihatkan perhitungan pada garis yang memuat kotak jawaban.');
      var akhir = isiB ? 'bangun bersisi ' + kunci.sisi + ' dengan ' + sebut(kunci[isiB], isiB) + ' di dalamnya' : Object.keys(kunci).map(function (k) { return sebut(kunci[k], k); }).join(' dan ');
      pem.push('Jadi kotak pengganti tanda tanya berisi ' + akhir + '.');

      var daftar = a.kocok(peng.map(function (p) { return { sel: p.sel, alasan: p.alasan, kunci: false }; }));
      daftar.splice(target, 0, { sel: kunci, alasan: null, kunci: true });
      var opsiGambar = daftar.map(function (d, i) {
        return { teks: 'Gambar opsi ' + Fmt.huruf(i), nilai: i, alasan: d.alasan ? Fmt.kapital(d.alasan) + '.' : null, kunci: d.kunci,
          gambar: { id: 'opsi-' + Fmt.huruf(i).toLowerCase(), jenis: 'mbentuk-jml-opsi', model: { fig: d.sel }, judul: 'Opsi ' + Fmt.huruf(i) } };
      });
      var kanalBahas = rc.kanal.map(function (kn) {
        var t = kn.aturan, o = { nama: t.nama, arah: t.arah, V: t.V };
        ['K', 'off', 'opB', 'opK', 'geser'].forEach(function (k) { if (t[k] != null) o[k] = t[k]; });
        return { unsur: kn.unsur, ikut: !!kn.ikut, aturan: o };
      });
      var utuh = grid.map(function (b) { return b.map(sj).join('/'); }).join('//');
      var ctx = { subtes: 'ku', submateri: 'figural', keluarga: id, level: level, benih: benih, a: a };
      var butir = Butir.rakitPg(ctx, {
        jenisSoal: 'Figural Matriks - Kotak 3x3 (hitungan unsur)',
        judul: 'Figural Matriks - Kotak 3x3', teks: [], pertanyaan: '', perintah: PERINTAH,
        gambar: [{ id: 'soal', jenis: 'mbentuk-jml', model: { grid: tampak, tanya: [tr, tc] }, judul: 'Matriks 3x3 hitungan unsur' }],
        pilihanJadi: { opsi: opsiGambar, kunciIndex: target }, tulisKunci: false,
        langkah: [], pembahasan: pem,
        model: { topik: 'Figural', tipe: 'matriks-jumlah', grid: tampak, tanya: [tr, tc], pilihan: daftar.map(function (d) { return d.sel; }), kunciIndex: target },
        sidik: { inti: 'matriks-jumlah|' + utuh + '|' + tr + tc, param: [], entitas: 'matriks-jumlah:' + mek }
      });
      if (!butir) continue;
      butir.gambarPembahasan = [
        { id: 'bahas-1', jenis: 'mbentuk-jml-hitung', judul: 'Gambar 1. Hitungan tiap kotak dan persamaannya', model: { grid: tampak, tanya: [tr, tc], kanal: kanalBahas, jawaban: kunci } },
        { id: 'bahas-2', jenis: 'mbentuk-jml-terap', judul: 'Gambar 2. Perhitungan pada garis kotak jawaban', model: { grid: tampak, tanya: [tr, tc], kanal: kanalBahas, jawaban: kunci } }
      ];
      butir.pola = 'matriks-jumlah:' + mek;
      butir.kategoriRiset = 'pengayaan';
      butir.catatanRiset = CATATAN_JML;
      return butir;
    }
    return null;
  }

  // ================================================================ antarmuka

  function buat(id, level, benih, opsi) {
    opsi = opsi || {};
    if (id === 'matriks-luar-dalam') return buatLD(id, level, benih, opsi);
    if (id === 'matriks-jumlah') return buatJml(id, level, benih, opsi);
    return null;
  }

  var KELUARGA = [
    { id: 'matriks-luar-dalam', nama: 'Matriks 3x3 bentuk luar-dalam (geser, tukar, gabung; warna dan letak bentuk dalam)', submateri: 'figural', kolam: 'matriks' },
    { id: 'matriks-jumlah', nama: 'Matriks 3x3 hitungan unsur (jumlah, selisih, jumlah tetap, sisi bangun)', submateri: 'figural', kolam: 'matriks' }
  ];

  var GAMBAR = {
    'mbentuk-ld': function (m) { return svgMatriks(m.grid, m.tanya, isiLD); },
    'mbentuk-ld-opsi': function (m) { return svgOpsi(m.fig, isiLD); },
    'mbentuk-ld-alur': svgAlurLD,
    'mbentuk-ld-kanal': svgKanalLD,
    'mbentuk-jml': function (m) { return svgMatriks(m.grid, m.tanya, isiJml); },
    'mbentuk-jml-opsi': function (m) { return svgOpsi(m.fig, isiJml); },
    'mbentuk-jml-hitung': svgHitungJml,
    'mbentuk-jml-terap': svgTerapJml
  };

  return {
    KELUARGA: KELUARGA, PERINTAH: PERINTAH, buat: buat, GAMBAR: GAMBAR,
    // alat geometri (dipakai uji pengembangan)
    poligon: poligon, pusatLuar: pusatLuar, pusatDalam: pusatDalam, titikBangun: titikBangun, pusatBangun: pusatBangun
  };
});
