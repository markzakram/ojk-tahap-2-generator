/*
 * figural.js — Kemampuan Umum > Figural, mesin pola berbasis ATRIBUT, ditambah matriks
 * 3x3 simbol dan sambungan.
 *
 * Tiga bentuk soal, semuanya dengan pilihan A-E berupa gambar:
 *
 *   serial            deret mendatar lima kotak + "?" (The Next Box, contoh riset soal 1)
 *   matriks-3         matriks 3x3 atribut dengan satu kotak "?" (PENGAYAAN: pengembangan
 *                     generik, bukan tiruan contoh riset)
 *   matriks-sambung   matriks 3x3 simbol dan sambungan (contoh riset soal 5): tiap kotak
 *                     berisi enam simbol (persegi, lingkaran putih, lingkaran hitam) yang
 *                     sebagian dihubungkan garis; aturannya hubungan banyak simbol dengan
 *                     banyak sambungan yang berlaku pada SETIAP kotak, mis. banyak lingkaran
 *                     hitam = banyak sambungan mendatar (sambungan tegak tidak dihitung)
 *
 * Matriks 2x2 biasa (analogi wadah, titik, panah) sudah dikeluarkan dari bank: bentuk 2x2
 * pada contoh riset adalah matriks bersekat (matriks-sekat.js).
 *
 * Setiap butir membawa `pola` (mekanisme penalarannya, mis. "serial:isi+putar") supaya
 * perakit paket dapat menghindari dua butir sesubmateri dengan mekanisme yang sama, serta
 * `kategoriRiset` ('acuan' bila bentuknya mengikuti contoh riset, 'pengayaan' bila bukan)
 * beserta `catatanRiset` untuk butir pengayaan. Penyusun membaca `opsi.polaDipakai` dan
 * mendahulukan mekanisme yang belum dipakai.
 *
 * Tiap KOTAK atribut adalah gabungan beberapa KANAL, dan tiap kanal mengikuti SATU aturan:
 *
 *   bentuk   wadah: lingkaran, persegi, segitiga, belah ketupat
 *   isi      warna wadah: putih, abu-abu, hitam
 *   arah     panah di dalam wadah, delapan arah (kelipatan 45 derajat)
 *   titik    ada/tidaknya titik di tengah bidang
 *   jumlah   banyaknya kotak kecil di bawah wadah (0-5)
 *   penanda  satu kotak kecil di salah satu pojok
 *
 * Penyusun membangun nilai tiap kanal menurut aturan yang dipilih, lalu memeriksa
 * bahwa aturan itu DAPAT DITEBAK dari kotak yang tampak: `Inferensi` mendaftarkan
 * semua aturan pustaka yang cocok dan nilai yang diberikannya, dan soal hanya
 * dipakai kalau hasilnya tunggal. Pengecoh dibuat dengan mengubah satu atau dua
 * kanal kunci ke nilai yang salah tetapi menggoda (nilai kotak sebelumnya, salah
 * langkah, nilai tetangga), jadi tiap pengecoh dijamin berbeda dari kunci di
 * paling sedikit satu kanal yang aturannya jelas.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./rng.js'), require('./svg.js'), require('./inferensi.js'), require('./butir.js'), require('./format.js'), require('./metrik.js'));
    module.exports = api;
  } else {
    api = factory(root.Rng, root.Svg, root.Inferensi, root.Butir, root.Fmt, root.Metrik);
    root.Figural = api;
  }
})(typeof self !== 'undefined' ? self : this, function (Rng, S, Inf, Butir, Fmt, Metrik) {
  'use strict';

  var K = Inf.KANAL, mod = Inf.mod;
  var PERINTAH = 'Gunakan gambar di bagian atas untuk menentukan jawaban yang benar dari pilihan di bawah. Pilih jawaban yang menggantikan tanda tanya. Jika tidak ada tanda tanya, pilih jawaban yang merupakan kelanjutan dari urutan tersebut.';

  var NAMA = {
    bentuk: ['lingkaran', 'persegi', 'segitiga', 'belah ketupat'],
    isi: ['putih', 'abu-abu', 'hitam'],
    arah: ['atas', 'kanan-atas', 'kanan', 'kanan-bawah', 'bawah', 'kiri-bawah', 'kiri', 'kiri-atas'],
    titik: ['tanpa titik', 'dengan titik'],
    jumlah: ['0', '1', '2', '3', '4', '5'],
    penanda: ['kiri-atas', 'kanan-atas', 'kanan-bawah', 'kiri-bawah']
  };
  var LABEL = { bentuk: 'bentuk wadah', isi: 'warna wadah', arah: 'arah panah', titik: 'titik di tengah bidang', jumlah: 'jumlah kotak kecil', penanda: 'letak kotak kecil di pojok' };

  // --------------------------------------------------------------- menggambar

  var INK = '#1d1d1d', ISI = ['#ffffff', '#b8b8b8', '#2a2a2a'];

  /** Isi gambar satu kotak pada koordinat 0..100 (belum berbingkai). */
  function sel(cell) {
    if (cell.s) return selSambung(cell);
    var o = [];
    var bentuk = cell.bentuk === undefined ? 0 : cell.bentuk;
    var isi = cell.isi === undefined ? 0 : cell.isi;
    var warna = ISI[isi], tinta = isi === 2 ? '#ffffff' : INK;
    var inr;
    if (bentuk === 0) { o.push(S.lingkaran(50, 50, 31, { isi: warna, garis: INK, tebal: 2.6 })); inr = 31; }
    else if (bentuk === 1) { o.push(S.rect(21, 21, 58, 58, { isi: warna, garis: INK, tebal: 2.6 })); inr = 29; }
    else if (bentuk === 2) { o.push(S.poli([[50, 15], [83, 72], [17, 72]], { tutup: true, isi: warna, garis: INK, tebal: 2.6, sambung: 'round' })); inr = 18; }
    else { o.push(S.poli([[50, 13], [87, 50], [50, 87], [13, 50]], { tutup: true, isi: warna, garis: INK, tebal: 2.6, sambung: 'round' })); inr = 24; }
    var cy = bentuk === 2 ? 56 : 50;
    if (cell.arah !== undefined) {
      var L = inr * 0.72, th = cell.arah * 45 * Math.PI / 180, dx = Math.sin(th), dy = -Math.cos(th);
      var ex = 50 + L * dx, ey = cy + L * dy, px = -dy, py = dx, h = 9;
      o.push(S.garis(50, cy, 50 + (L - h * 0.6) * dx, cy + (L - h * 0.6) * dy, { garis: tinta, tebal: 3.4, ujung: 'round' }));
      o.push(S.poli([[ex, ey], [ex - h * dx + h * 0.5 * px, ey - h * dy + h * 0.5 * py], [ex - h * dx - h * 0.5 * px, ey - h * dy - h * 0.5 * py]], { tutup: true, isi: tinta, garis: tinta, tebal: 1, sambung: 'round' }));
      if (cell.titik) o.push(S.lingkaran(50, cy, 5.2, { isi: tinta }));
    } else if (cell.titik) {
      o.push(S.lingkaran(50, cy, 6.5, { isi: tinta }));
    }
    if (cell.jumlah) {
      for (var i = 0; i < cell.jumlah; i++) {
        o.push(S.rect(50 + (i - (cell.jumlah - 1) / 2) * 9.5 - 3.2, 90.2, 6.4, 6.4, { isi: INK }));
      }
    }
    if (cell.penanda !== undefined) {
      var pos = [[4, 4], [85, 4], [85, 85], [4, 85]][cell.penanda];
      o.push(S.rect(pos[0], pos[1], 11, 11, { isi: INK }));
    }
    return o.join('');
  }

  // simbol dan sambungan: enam simbol pada tiga baris x dua kolom
  var X_SB = [30, 70], Y_SB = [21, 50, 79];
  var UJUNG_V = [[0, 0], [0, 1], [1, 0], [1, 1]];          // [kolom, baris atas] tiap sambungan tegak

  /** Kotak simbol dan sambungan: garis sambungan lebih dulu, simbol (berisi) menutup ujungnya. */
  function selSambung(x) {
    var o = [], gaya = { garis: INK, tebal: 3, ujung: 'butt' };
    x.h.forEach(function (b, r) { if (b) o.push(S.garis(X_SB[0], Y_SB[r], X_SB[1], Y_SB[r], gaya)); });
    x.v.forEach(function (b, j) { if (b) { var k = UJUNG_V[j]; o.push(S.garis(X_SB[k[0]], Y_SB[k[1]], X_SB[k[0]], Y_SB[k[1] + 1], gaya)); } });
    x.s.forEach(function (t, i) {
      var cx = X_SB[i % 2], cy = Y_SB[Math.floor(i / 2)];
      if (t === 0) o.push(S.rect(cx - 8, cy - 8, 16, 16, { isi: '#ffffff', garis: INK, tebal: 3 }));
      else if (t === 1) o.push(S.lingkaran(cx, cy, 8.6, { isi: '#ffffff', garis: INK, tebal: 3 }));
      else o.push(S.lingkaran(cx, cy, 9.6, { isi: INK, garis: INK, tebal: 1 }));
    });
    return o.join('');
  }

  function bingkaiSel(x, y, s, isi, opsi) {
    opsi = opsi || {};
    var g = '<g transform="translate(' + S.num(x) + ',' + S.num(y) + ') scale(' + (Math.round(s / 100 * 10000) / 10000) + ')">';
    if (opsi.bingkai !== false) g += S.rect(0.7, 0.7, 98.6, 98.6, { isi: opsi.latar || '#ffffff', garis: opsi.warnaTepi || '#7b8499', tebal: opsi.sorot ? 4 : 1.6 });
    return g + isi + '</g>';
  }

  function tandaTanya(s, x, y) {
    return bingkaiSel(x, y, s, S.rect(0.7, 0.7, 98.6, 98.6, { isi: '#f4f6fb' }) + S.teks('?', 50, 72, { ukuran: 66, tebal: true, isi: '#4a5266', rata: 'middle' }));
  }

  /** Satu kotak dalam dokumen SVG sendiri (untuk pilihan jawaban). */
  function svgSel(cell, ukuran, opsi) {
    ukuran = ukuran || 120;
    var pad = 4;
    return { svg: S.doc(bingkaiSel(pad, pad, ukuran, sel(cell), opsi), ukuran + pad * 2, ukuran + pad * 2, { latar: '#ffffff' }), lebar: ukuran + pad * 2, tinggi: ukuran + pad * 2 };
  }

  /** Deret mendatar: kotak-kotak terlihat lalu "?". */
  function svgSerial(sels, ukuran) {
    ukuran = ukuran || 100;
    var gap = 14, pad = 6, n = sels.length + 1, bagian = [];
    sels.forEach(function (c, i) { bagian.push(bingkaiSel(pad + i * (ukuran + gap), pad, ukuran, sel(c))); });
    bagian.push(tandaTanya(ukuran, pad + sels.length * (ukuran + gap), pad));
    var w = pad * 2 + n * ukuran + (n - 1) * gap;
    return { svg: S.doc(bagian.join(''), w, ukuran + pad * 2, { latar: '#ffffff' }), lebar: w, tinggi: ukuran + pad * 2 };
  }

  /** Matriks r x c dengan satu kotak "?" pada (mr, mc). */
  function svgMatriks(grid, mr, mc, ukuran) {
    var n = grid.length, m = grid[0].length;
    ukuran = ukuran || (n === 3 ? 108 : 124);
    var pad = 6, bagian = [];
    for (var r = 0; r < n; r++) {
      for (var c = 0; c < m; c++) {
        if (r === mr && c === mc) bagian.push(tandaTanya(ukuran, pad + c * ukuran, pad + r * ukuran));
        else bagian.push(bingkaiSel(pad + c * ukuran, pad + r * ukuran, ukuran, sel(grid[r][c])));
      }
    }
    bagian.push(S.rect(pad, pad, m * ukuran, n * ukuran, { isi: 'none', garis: '#4a5266', tebal: 2.4 }));
    return { svg: S.doc(bagian.join(''), pad * 2 + m * ukuran, pad * 2 + n * ukuran, { latar: '#ffffff' }), lebar: pad * 2 + m * ukuran, tinggi: pad * 2 + n * ukuran };
  }

  // ---------------------------------------------------------- gambar pembahasan

  /*
   *   serial-tabel     deret atribut: kotak 1-5 + kotak 6 (jawaban) dan satu baris per kanal berisi
   *                    nilai kanal tiap kotak sebagai ikon kecil; kolom kotak 6 disorot, dan pada
   *                    aturan berulang kotak sefase dengan kotak 6 diberi garis jingga
   *   matriks3-letak   matriks 3x3 bernomor baris/kolom, kotak yang dicari terisi jawaban, baris dan
   *                    kolom yang dipakai aturan diarsir
   *   matriks3-aturan  per kanal: tiga kotak sepanjang baris/kolom penentu sebagai ikon, langkah di
   *                    antaranya, dan kotak yang dicari disorot
   *   sambung-hitung   dua kotak contoh dan kotak jawaban: simbol yang dihitung dilingkari, sambungan
   *                    yang dihitung berwarna, hitungan pasangannya ditulis di bawah
   */
  var BH = S.BAHAS, WARNA_REL = [{ simbol: BH.sorot, sambung: BH.panah }, { simbol: '#8e44ad', sambung: '#0e7c86' }];

  function teksB(s, x, y, o) {
    o = o || {};
    return S.teks(s, x, y, { ukuran: o.ukuran || 11, tebal: o.tebal, isi: o.isi || BH.teks, rata: o.rata });
  }

  function paragrafB(s, x, y, lebar, o) {
    o = o || {};
    var uk = o.ukuran || 11, baris = Metrik.penggal(s, lebar, uk, o.tebal);
    return { svg: baris.map(function (b, i) { return teksB(b, x, y + i * (uk + 3), o); }).join(''), baris: baris.length };
  }

  /** Nilai satu kanal sebagai ikon kecil berpusat di (cx, cy). */
  function ikonKanal(nm, v, cx, cy) {
    var g = { isi: '#ffffff', garis: INK, tebal: 1.6, sambung: 'round' };
    if (nm === 'bentuk') {
      if (v === 0) return S.lingkaran(cx, cy, 10, g);
      if (v === 1) return S.rect(cx - 9, cy - 9, 18, 18, g);
      if (v === 2) return S.poli([[cx, cy - 11], [cx + 11, cy + 8], [cx - 11, cy + 8]], Object.assign({ tutup: true }, g));
      return S.poli([[cx, cy - 11], [cx + 11, cy], [cx, cy + 11], [cx - 11, cy]], Object.assign({ tutup: true }, g));
    }
    if (nm === 'isi') return S.rect(cx - 9, cy - 9, 18, 18, { rx: 3, isi: ISI[v], garis: INK, tebal: 1.4 });
    if (nm === 'arah') {
      var th = v * Math.PI / 4, dx = Math.sin(th), dy = -Math.cos(th);
      return S.panah(cx - dx * 10, cy - dy * 10, cx + dx * 11, cy + dy * 11, { warna: INK, tebal: 2.2, kepala: 7 });
    }
    if (nm === 'titik') return v ? S.lingkaran(cx, cy, 5, { isi: INK }) : S.lingkaran(cx, cy, 5, { isi: 'none', garis: '#9aa3b5', tebal: 1.2, putus: '2 2' });
    if (nm === 'jumlah') return teksB(String(v), cx, cy + 5, { ukuran: 15, tebal: true, rata: 'middle', isi: INK });
    var pos = [[-1, -1], [1, -1], [1, 1], [-1, 1]][v];
    return S.rect(cx - 10, cy - 10, 20, 20, { isi: 'none', garis: '#9aa3b5', tebal: 1.2 }) + S.rect(pos[0] < 0 ? cx - 10 : cx + 4, pos[1] < 0 ? cy - 10 : cy + 4, 6, 6, { isi: INK });
  }

  /** Aturan satu kanal deret dalam kalimat pendek (untuk gambar). */
  function ringkasDeret(nm, u) {
    var jam = function (k) { return (k > 0 ? 'searah' : 'berlawanan arah') + ' jarum jam'; };
    if (u.aturan.indexOf('siklus-') === 0) return 'berulang tiap ' + u.p + ' kotak';
    if (u.aturan === 'langkah') {
      if (nm === 'arah') return 'putar ' + Math.abs(u.k) * 45 + '° ' + jam(u.k);
      if (nm === 'isi') return 'urutan ' + (u.k === 1 ? 'putih → abu-abu → hitam' : 'putih → hitam → abu-abu');
      return 'pindah 1 pojok ' + jam(u.k);
    }
    if (u.aturan === 'pantul') return 'bolak-balik antarpojok';
    return (u.d > 0 ? 'bertambah' : 'berkurang') + ' 1 tiap kotak';
  }

  /** Deret atribut: tabel pola sejajar tiap kanal, kotak 1-5 lalu kotak 6 (jawaban). */
  function svgTabelSerial(m, judul) {
    var pad = 8, kiri = 150, sel6 = 52, y0 = pad + 26, yKotak = y0 + 16, tinggiBaris = 42, o = [teksB(judul, pad, pad + 13, { ukuran: 13, tebal: true })];
    var semua = m.sels.concat([m.jawaban]), x0 = pad + kiri, W = lebarJudul(judul, x0 + 6 * sel6 + pad), yBaris = yKotak + sel6 + 6;
    var H = yBaris + m.kanal.length * tinggiBaris + pad;
    // kolom kotak 6 disorot dari atas sampai bawah
    o.push(S.rect(x0 + 5 * sel6 + 1, y0 + 2, sel6 - 2, H - y0 - pad, { rx: 5, isi: BH.latarJawab }));
    semua.forEach(function (c, i) {
      var x = x0 + i * sel6;
      o.push(teksB(i === 5 ? 'Kotak 6' : 'Kotak ' + (i + 1), x + sel6 / 2, y0 + 11, { ukuran: 10, tebal: true, rata: 'middle', isi: i === 5 ? BH.jawab : BH.teks }));
      o.push(bingkaiSel(x + 3, yKotak, sel6 - 6, sel(c), i === 5 ? { warnaTepi: BH.jawab, sorot: true } : {}));
    });
    m.kanal.forEach(function (nm, r) {
      var y = yBaris + r * tinggiBaris, u = m.aturan[nm];
      o.push(S.garis(pad, y, W - pad, y, { garis: '#e1e5ee', tebal: 1 }));
      o.push(teksB(Fmt.kapital(LABEL[nm]), pad + 2, y + 15, { tebal: true }));
      o.push(paragrafB(ringkasDeret(nm, u), pad + 2, y + 28, kiri - 10, { ukuran: 10, isi: BH.teksRedup }).svg);
      semua.forEach(function (c, i) {
        var cx = x0 + i * sel6 + sel6 / 2, cy = y + tinggiBaris / 2;
        // aturan berulang: kotak sefase dengan kotak 6 bernilai sama dengannya
        if (u.aturan.indexOf('siklus-') === 0 && i < 5 && i % u.p === 5 % u.p) o.push(S.rect(cx - 17, cy - 16, 34, 32, { rx: 4, isi: 'none', garis: BH.sorot, tebal: 1.6, putus: '4 2' }));
        o.push(ikonKanal(nm, c[nm], cx, cy));
      });
    });
    return { svg: S.doc(o.join(''), W, H, { latar: '#ffffff' }), lebar: W, tinggi: H };
  }

  var ATURAN_BARIS = ['latin', 'baris-tetap', 'langkah-baris', 'xor-baris', 'jumlah-baris'];

  /** Nilai kanal sepanjang baris/kolom penentu kotak yang dicari, dengan kotak itu ditandai (kalimat pembahasan). */
  function nilaiGaris3(nm, b, mr, mc) {
    var baris = ATURAN_BARIS.indexOf(b.aturan) >= 0, posisi = baris ? mc : mr;
    var nilai = [0, 1, 2].map(function (i) { return baris ? b.g[mr][i] : b.g[i][mc]; });
    var tempat = baris ? 'pada baris ' + (mr + 1) + ' dari kiri ke kanan' : 'pada kolom ' + (mc + 1) + ' dari atas ke bawah';
    if (b.aturan === 'jumlah-baris') return tempat + ': ' + nilai.map(function (v, i) { return i === posisi ? '?' : String(v); }).join(' + ') + ' = ' + b.K + ', jadi kotak yang dicari berisi ' + nilai[posisi];
    return tempat + ': ' + nilai.map(function (v, i) { return NAMA[nm][v] + (i === posisi ? ' (kotak yang dicari)' : ''); }).join(b.aturan.indexOf('langkah') === 0 ? ' → ' : ', ');
  }

  /** Aturan satu kanal matriks 3x3 dalam kalimat pendek (untuk gambar). */
  function ringkasMatriks(nm, b) {
    var per = b.aturan === 'langkah-baris' ? 'tiap kolom ke kanan' : 'tiap baris ke bawah', jam = function (k) { return (k > 0 ? 'searah' : 'berlawanan arah') + ' jarum jam'; };
    if (b.aturan === 'latin') return 'tiap baris memuat ketiga nilai';
    if (b.aturan === 'baris-tetap') return 'sama dalam satu baris';
    if (b.aturan === 'kolom-tetap') return 'sama dalam satu kolom';
    if (b.aturan === 'xor-baris') return 'bertitik bila tepat satu kotak lain sebaris bertitik';
    if (b.aturan === 'jumlah-baris') return 'jumlah sebaris selalu ' + b.K;
    if (nm === 'arah') return 'putar ' + Math.abs(b.k) * 45 + '° ' + jam(b.k) + ' ' + per;
    if (nm === 'jumlah') return (b.k > 0 ? 'tambah ' : 'kurang ') + Math.abs(b.k) + ' ' + per;
    if (nm === 'isi') return 'maju ' + b.k + ' warna ' + per + ' (putih → abu-abu → hitam)';
    if (nm === 'titik') return 'berganti ' + per;
    return 'pindah ' + Math.abs(b.k) + ' pojok ' + jam(b.k) + ' ' + per;
  }

  /** Langkah singkat di antara dua kotak berurutan (aturan langkah), atau ''. */
  function langkahPendek(nm, b) {
    if (b.aturan !== 'langkah-baris' && b.aturan !== 'langkah-kolom') return '';
    if (nm === 'arah') return Math.abs(b.k) * 45 + '°';
    if (nm === 'jumlah') return (b.k > 0 ? '+' : '−') + Math.abs(b.k);
    if (nm === 'isi') return '+' + b.k;
    return '';
  }

  /** Matriks 3x3 bernomor: kotak yang dicari terisi jawaban; baris/kolom penentu diarsir. */
  function svgLetak3(m, judul) {
    var pad = 8, u = 84, x0 = pad + 22, y0 = pad + 26 + 18, o = [teksB(judul, pad, pad + 13, { ukuran: 13, tebal: true })];
    var W = lebarJudul(judul, x0 + 3 * u + pad), H = y0 + 3 * u + pad;
    if (m.garis.baris) o.push(S.rect(x0 - 3, y0 + m.mr * u - 3, 3 * u + 6, u + 6, { rx: 6, isi: BH.latarPanah }));
    if (m.garis.kolom) o.push(S.rect(x0 + m.mc * u - 3, y0 - 3, u + 6, 3 * u + 6, { rx: 6, isi: BH.latarPanah }));
    for (var i = 0; i < 3; i++) {
      o.push(teksB('Kolom ' + (i + 1), x0 + i * u + u / 2, y0 - 7, { ukuran: 10, tebal: true, rata: 'middle', isi: i === m.mc ? BH.panah : BH.teksRedup }));
      o.push(teksB(String(i + 1), x0 - 12, y0 + i * u + u / 2 + 4, { ukuran: 11, tebal: true, rata: 'middle', isi: i === m.mr ? BH.panah : BH.teksRedup }));
    }
    o.push(S.teks('Baris', pad - 1, y0 - 7, { ukuran: 10, tebal: true, isi: BH.teksRedup }));
    for (var r = 0; r < 3; r++) {
      for (var c = 0; c < 3; c++) {
        var jawab = r === m.mr && c === m.mc;
        o.push(bingkaiSel(x0 + c * u + 4, y0 + r * u + 4, u - 8, sel(jawab ? m.jawaban : m.grid[r][c]), jawab ? { warnaTepi: BH.jawab, sorot: true, latar: BH.latarJawab } : {}));
      }
    }
    return { svg: S.doc(o.join(''), W, H, { latar: '#ffffff' }), lebar: W, tinggi: H };
  }

  /** Lebar gambar paling sedikit selebar judulnya. */
  function lebarJudul(judul, W) { return Math.max(W, Math.ceil(Metrik.lebar(judul, 13, true)) + 18); }

  /** Aturan tiap kanal matriks 3x3 pada baris/kolom penentunya; kotak yang dicari disorot. */
  function svgAturan3(m, judul) {
    var pad = 8, kiri = 176, sel3 = 50, sela = 34, y0 = pad + 26, o = [teksB(judul, pad, pad + 13, { ukuran: 13, tebal: true })];
    var x0 = pad + kiri, W = lebarJudul(judul, x0 + 3 * sel3 + 2 * sela + pad), y = y0;
    m.kanal.forEach(function (nm, r) {
      var b = m.aturan[nm], baris = ATURAN_BARIS.indexOf(b.aturan) >= 0, uraian = paragrafB(ringkasMatriks(nm, b), pad + 6, y + 41, kiri - 12, { ukuran: 10, isi: BH.teksRedup });
      var tinggiBaris = 56 + (uraian.baris - 1) * 13;
      o.push(S.rect(pad, y, W - pad * 2, tinggiBaris - 6, { rx: 5, isi: r % 2 ? '#ffffff' : '#f6f8fc' }));
      o.push(teksB(Fmt.kapital(LABEL[nm]), pad + 6, y + 15, { tebal: true }));
      o.push(teksB(baris ? 'baris ' + (m.mr + 1) + ', kiri ke kanan' : 'kolom ' + (m.mc + 1) + ', atas ke bawah', pad + 6, y + 28, { ukuran: 10, isi: BH.panah, tebal: true }));
      o.push(uraian.svg);
      var langkahTeks = langkahPendek(nm, b);
      for (var i = 0; i < 3; i++) {
        var rr = baris ? m.mr : i, cc = baris ? i : m.mc, jawab = rr === m.mr && cc === m.mc;
        var cx = x0 + i * (sel3 + sela) + sel3 / 2, cy = y + (tinggiBaris - 6) / 2;
        o.push(S.rect(cx - sel3 / 2 + 2, cy - 20, sel3 - 4, 40, { rx: 4, isi: jawab ? BH.latarJawab : '#ffffff', garis: jawab ? BH.jawab : '#c4cad6', tebal: jawab ? 2 : 1 }));
        o.push(ikonKanal(nm, jawab ? m.jawaban[nm] : m.grid[rr][cc][nm], cx, cy));
        if (i < 2) {
          var ax = cx + sel3 / 2 + 2;
          o.push(S.panah(ax + 3, cy + 6, ax + sela - 7, cy + 6, { warna: BH.panah, tebal: 1.6, kepala: 6 }));
          if (langkahTeks) o.push(teksB(langkahTeks, ax + sela / 2 - 2, cy - 3, { ukuran: 10, tebal: true, rata: 'middle', isi: BH.panah }));
        }
      }
      y += tinggiBaris;
    });
    var H = y + pad;
    return { svg: S.doc(o.join(''), W, H, { latar: '#ffffff' }), lebar: W, tinggi: H };
  }

  /** Kotak simbol-sambungan: sambungan yang dihitung berwarna dan simbol yang dihitung dilingkari (koordinat 0..100). */
  function selSambungBahas(x, rel) {
    var o = [], warnaH = null, warnaV = null;
    rel.forEach(function (r, ri) {
      if (r.y === 'mendatar' || r.y === 'sambungan') warnaH = WARNA_REL[ri].sambung;
      if (r.y === 'tegak' || r.y === 'sambungan') warnaV = WARNA_REL[ri].sambung;
    });
    var gaya = function (w) { return w ? { garis: w, tebal: 5, ujung: 'butt' } : { garis: INK, tebal: 3, ujung: 'butt' }; };
    x.h.forEach(function (b, k) { if (b) o.push(S.garis(X_SB[0], Y_SB[k], X_SB[1], Y_SB[k], gaya(warnaH))); });
    x.v.forEach(function (b, j) { if (b) { var k = UJUNG_V[j]; o.push(S.garis(X_SB[k[0]], Y_SB[k[1]], X_SB[k[0]], Y_SB[k[1] + 1], gaya(warnaV))); } });
    // simbol digambar sesudah sambungan supaya menutup ujungnya (sama seperti gambar soal)
    o.push(selSambung({ s: x.s, h: [0, 0, 0], v: [0, 0, 0, 0] }));
    rel.forEach(function (r, ri) {
      x.s.forEach(function (t, i) { if (t === SIMBOL_SB[r.x]) o.push(S.lingkaran(X_SB[i % 2], Y_SB[Math.floor(i / 2)], 14, { isi: 'none', garis: WARNA_REL[ri].simbol, tebal: 2.6 })); });
    });
    return o.join('');
  }

  /** Dua kotak contoh dan kotak jawaban dengan hitungan pasangan tiap hubungan. */
  function svgHitungSambung(m, judul) {
    var pad = 8, u = 126, sela = 36, o = [teksB(judul, pad, pad + 13, { ukuran: 13, tebal: true })];
    var W = lebarJudul(judul, pad * 2 + 3 * u + 2 * sela), aturan = paragrafB('Aturan: ' + m.rel.map(function (r) { return uraianRel(r, m.derau).replace(/^Banyak/, 'banyak'); }).join('; ') + '.', pad, pad + 32, W - pad * 2);
    o.push(aturan.svg);
    var y0 = pad + 32 + aturan.baris * 14 + 12, panel = m.contoh.concat([{ cell: m.jawaban, jawab: true }]);
    var yTeks = y0 + u + 16, H = yTeks + m.rel.length * 46 + pad;
    panel.forEach(function (p, i) {
      var x = pad + i * (u + sela);
      o.push(teksB(p.jawab ? 'Kotak jawaban' : 'Contoh: baris ' + (p.r + 1) + ', kolom ' + (p.c + 1), x + u / 2, y0 - 6, { rata: 'middle', tebal: true, isi: p.jawab ? BH.jawab : BH.teks }));
      o.push(bingkaiSel(x, y0, u, selSambungBahas(p.cell, m.rel), p.jawab ? { warnaTepi: BH.jawab, sorot: true, latar: BH.latarJawab } : {}));
      var f = hitungSb(p.cell);
      m.rel.forEach(function (r, ri) {
        var y = yTeks + ri * 46, c = WARNA_REL[ri];
        if (r.jenis === 'jumlah') {
          o.push(teksB(f[r.x] + ' ' + NAMA_SB[r.x], x + u / 2, y, { rata: 'middle', isi: c.simbol, tebal: true }));
          o.push(teksB('+ ' + f.sambungan + ' sambungan', x + u / 2, y + 14, { rata: 'middle', isi: c.sambung, tebal: true }));
          o.push(teksB('= ' + (f[r.x] + f.sambungan), x + u / 2, y + 28, { rata: 'middle', tebal: true }));
        } else {
          o.push(teksB(f[r.x] + ' ' + NAMA_SB[r.x], x + u / 2, y, { rata: 'middle', isi: c.simbol, tebal: true }));
          o.push(teksB(f[r.y] + ' ' + NAMA_SB[r.y], x + u / 2, y + 14, { rata: 'middle', isi: c.sambung, tebal: true }));
          o.push(teksB('sama: ' + f[r.x] + ' = ' + f[r.y], x + u / 2, y + 28, { rata: 'middle', tebal: true }));
        }
      });
      if (i === 1) o.push(S.panah(x + u + 8, y0 + u / 2, x + u + sela - 8, y0 + u / 2, { warna: BH.jawab, tebal: 2.2, kepala: 8 }));
    });
    return { svg: S.doc(o.join(''), W, H, { latar: '#ffffff' }), lebar: W, tinggi: H };
  }

  // ----------------------------------------------------------- pembangunan nilai

  function acakNilai(a, nama, kecuali) {
    var info = K[nama], kandidat = [];
    for (var v = 0; v < info.n; v++) if (!kecuali || kecuali.indexOf(v) < 0) kandidat.push(v);
    return a.pilih(kandidat);
  }

  /** n nilai berbeda dari domain kanal. */
  function nilaiBeda(a, nama, n) { return a.ambil(Array.apply(null, { length: K[nama].n }).map(function (_, i) { return i; }), n); }

  /**
   * Urutan nilai satu kanal sepanjang 6 kotak (5 terlihat + 1 jawaban) menurut aturan.
   * Mengembalikan { seq, aturan, k/p/..., desk } atau null.
   */
  function urutanKanal(a, nama, level) {
    var info = K[nama], seq = [], i, p, k;
    var pilihan = [];
    if (info.tipe === 'nominal') pilihan = ['siklus-2', 'siklus-3'];
    else if (nama === 'titik') pilihan = ['siklus-2'];
    else if (nama === 'jumlah') pilihan = level === 'mudah' ? ['tambah', 'siklus-2'] : ['tambah', 'siklus-3', 'siklus-2'];
    else if (nama === 'arah') pilihan = level === 'mudah' ? ['langkah', 'langkah', 'siklus-2'] : (level === 'sedang' ? ['langkah', 'siklus-3', 'siklus-4', 'langkah'] : ['langkah', 'siklus-3', 'siklus-4', 'langkah', 'siklus-3']);
    else if (nama === 'isi') pilihan = level === 'mudah' ? ['langkah', 'siklus-2'] : ['langkah', 'siklus-2', 'siklus-3'];
    else pilihan = level === 'mudah' ? ['langkah', 'siklus-2'] : ['langkah', 'siklus-3', 'siklus-2'];     // penanda
    var jenis = a.pilih(pilihan), hasil = { aturan: jenis };
    if (jenis.indexOf('siklus-') === 0) {
      p = parseInt(jenis.slice(7), 10);
      var dasar = nilaiBeda(a, nama, p);
      for (i = 0; i < 6; i++) seq.push(dasar[i % p]);
      hasil.p = p; hasil.dasar = dasar;
    } else if (jenis === 'langkah') {
      var ks = nama === 'arah' ? (level === 'mudah' ? [2, -2] : [1, -1, 2, -2, 3, -3]) : (nama === 'isi' ? [1, 2] : [1, -1]);
      k = a.pilih(ks);
      var s = a.bulat(0, info.n - 1);
      for (i = 0; i < 6; i++) seq.push(mod(s + k * i, info.n));
      hasil.k = k;
    } else if (jenis === 'pantul') {
      var fase = a.bulat(0, 2 * (info.n - 1) - 1);
      for (i = 0; i < 6; i++) seq.push(Inf.pantulIndeks(fase + i, info.n));
      hasil.fase = fase;
    } else {                                              // tambah (jumlah)
      var d = a.pilih([1, -1]);
      for (i = 0; i < 6; i++) seq.push(d > 0 ? i : 5 - i);
      hasil.d = d;
    }
    hasil.seq = seq;
    return hasil;
  }

  function deskripsiDeret(nama, u) {
    var nm = NAMA[nama], seq = u.seq, tampak = seq.slice(0, 5).map(function (v) { return nm[v]; }).join(', ');
    var next = nm[seq[5]];
    var judul = Fmt.kapital(LABEL[nama]) + ': ';
    if (u.aturan.indexOf('siklus-') === 0) return judul + 'berulang setiap ' + u.p + ' kotak (' + u.dasar.map(function (v) { return nm[v]; }).join(', ') + '). Kotak 1-5: ' + tampak + '; maka kotak berikutnya: ' + next + '.';
    if (u.aturan === 'langkah') {
      if (nama === 'arah') return judul + 'berputar ' + Math.abs(u.k) * 45 + ' derajat ' + (u.k > 0 ? 'searah' : 'berlawanan arah') + ' jarum jam pada setiap kotak. Kotak 1-5: ' + tampak + '; maka kotak berikutnya: ' + next + '.';
      if (nama === 'isi') return judul + 'bergeser ke warna ' + (u.k === 1 ? 'berikutnya' : 'dua tingkat berikutnya') + ' pada urutan putih, abu-abu, hitam (lalu kembali ke putih) pada setiap kotak. Kotak 1-5: ' + tampak + '; maka kotak berikutnya: ' + next + '.';
      return judul + 'berpindah satu pojok ' + (u.k > 0 ? 'searah' : 'berlawanan arah') + ' jarum jam pada setiap kotak. Kotak 1-5: ' + tampak + '; maka kotak berikutnya: ' + next + '.';
    }
    if (u.aturan === 'pantul') return judul + 'bergerak bolak-balik antara pojok pertama dan terakhir (kiri-atas, kanan-atas, kanan-bawah, kiri-bawah, lalu kembali). Kotak 1-5: ' + tampak + '; maka kotak berikutnya: ' + next + '.';
    return judul + (u.d > 0 ? 'bertambah' : 'berkurang') + ' satu pada setiap kotak. Kotak 1-5: ' + tampak + '; maka kotak berikutnya: ' + next + '.';
  }

  // ------------------------------------------------------------ pilihan jawaban

  function salin(c) { var o = {}; for (var k in c) o[k] = c[k]; return o; }
  function sidikSel(c) { return Object.keys(c).sort().map(function (k) { return k + '=' + c[k]; }).join(';'); }

  /**
   * Empat pengecoh dari sel kunci: ubah satu (kadang dua) kanal ke nilai yang salah
   * tetapi menggoda. `godaan(nama)` memberi daftar nilai yang menggoda untuk kanal itu.
   */
  function pengecoh(a, kunci, kanal, godaan, namaKanal) {
    var hasil = [], dipakai = {};
    dipakai[sidikSel(kunci)] = true;
    for (var coba = 0; coba < 300 && hasil.length < 4; coba++) {
      var jml = a.untung(0.28) && kanal.length > 1 ? 2 : 1;
      var pilih = a.ambil(kanal, jml);
      var c = salin(kunci), alasan = [];
      var ok = true;
      pilih.forEach(function (nm) {
        var gd = godaan(nm).filter(function (v) { return v !== kunci[nm]; });
        if (!gd.length) { ok = false; return; }
        var v = a.untung(0.65) ? gd[0] : a.pilih(gd);
        c[nm] = v;
        alasan.push(namaKanal(nm, kunci[nm], v));
      });
      if (!ok) continue;
      var s = sidikSel(c);
      if (dipakai[s]) continue;
      dipakai[s] = true;
      hasil.push({ cell: c, alasan: alasan });
    }
    return hasil.length === 4 ? hasil : null;
  }

  function alasanKanal(nama, benar, salah, ket) {
    var nm = NAMA[nama];
    var dasar = LABEL[nama];
    return dasar + ' ' + nm[salah] + ' padahal seharusnya ' + nm[benar] + (ket ? ' (' + ket + ')' : '');
  }

  // ======================================================== mekanisme (pola) butir

  /** Nama mekanisme tiap kanal; sama dengan nama yang dipakai deret berputar (serial-putar.js). */
  var MEKANISME = { arah: 'putar', penanda: 'pindah', isi: 'isi', jumlah: 'jumlah', bentuk: 'bentuk', titik: 'titik' };

  function polaKanal(id, kanal) {
    return id + ':' + kanal.map(function (nm) { return MEKANISME[nm]; }).sort().join('+');
  }

  /**
   * Apakah mekanisme ini sudah dipakai butir sesubmateri pada paket yang sama? Pola yang
   * sama persis, atau gabungan mekanisme yang sama pada keluarga lain (mis. "serial:jumlah+putar"
   * dan "serial-putar:jumlah+putar"), dianggap sudah dipakai.
   */
  function polaTerpakai(pola, dipakai) {
    if (!dipakai || !dipakai.length) return false;
    var inti = pola.slice(pola.indexOf(':') + 1);
    return dipakai.some(function (p) { p = String(p); return p === pola || p.slice(p.indexOf(':') + 1) === inti; });
  }

  // ===================================================================== serial

  function buatSerial(a, level, target, benih, dipakai) {
    var jml = level === 'mudah' ? 2 : (level === 'sedang' ? 3 : 4);
    var pool = level === 'mudah' ? ['arah', 'isi', 'titik', 'penanda'] : ['arah', 'isi', 'titik', 'penanda', 'jumlah', 'bentuk'];
    for (var coba = 0; coba < 300; coba++) {
      var kanal = a.ambil(pool, jml);
      if (kanal.indexOf('arah') < 0 && kanal.indexOf('isi') < 0 && kanal.indexOf('bentuk') < 0) continue;
      // mekanisme yang sudah dipakai butir sesubmateri dihindari selama percobaan masih banyak
      if (coba < 200 && polaTerpakai(polaKanal('serial', kanal), dipakai)) continue;
      var uru = {}, ok = true, variasi = 0;
      kanal.forEach(function (nm) {
        if (!ok) return;
        var u = urutanKanal(a, nm, level);
        var info = K[nm];
        var r = Inf.deret(info, u.seq.slice(0, 5));
        if (r.status !== 'unik' || r.nilai !== u.seq[5]) { ok = false; return; }
        if (u.seq.slice(0, 5).some(function (x) { return x !== u.seq[0]; })) variasi++;
        uru[nm] = u;
      });
      if (!ok || variasi < Math.min(2, jml)) continue;
      var sels = [];
      for (var i = 0; i < 6; i++) { var c = {}; kanal.forEach(function (nm) { c[nm] = uru[nm].seq[i]; }); sels.push(c); }
      var kunci = sels[5];
      // nilai yang menggoda: kotak sebelumnya, salah langkah, nilai lain
      var godaan = function (nm) {
        var u = uru[nm], seq = u.seq, g = [], info = K[nm];
        g.push(seq[4]);
        if (u.aturan === 'langkah') { g.push(mod(seq[5] + u.k, info.n)); g.push(mod(seq[5] - u.k, info.n)); }
        else if (u.aturan.indexOf('siklus-') === 0) { g.push(u.dasar[(5 + 1) % u.p]); g.push(u.dasar[(5 + 2) % u.p]); }
        else if (u.aturan === 'pantul') { g.push(Inf.pantulIndeks(u.fase + 6, info.n)); g.push(Inf.pantulIndeks(u.fase + 4, info.n)); }
        else { g.push(seq[5] + 1 <= 5 ? seq[5] + 1 : seq[5] - 1); g.push(seq[5] - 1 >= 0 ? seq[5] - 1 : seq[5] + 1); }
        for (var v = 0; v < info.n; v++) g.push(v);
        return g.filter(function (v, idx) { return v >= 0 && v < info.n && g.indexOf(v) === idx; });
      };
      var peng = pengecoh(a, kunci, kanal, godaan, function (nm, benar, salah) { return alasanKanal(nm, benar, salah); });
      if (!peng) continue;
      var pem = ['Perhatikan perubahan tiap kanal dari kotak ke kotak. Gambar 1 menuliskan nilai tiap kanal pada kotak 1 sampai 5 sebagai pola sejajar, lalu meneruskannya ke kotak 6 (kolom hijau):'];
      kanal.forEach(function (nm) { pem.push('• ' + deskripsiDeret(nm, uru[nm])); });
      if (kanal.some(function (nm) { return uru[nm].aturan.indexOf('siklus-') === 0; })) pem.push('Pada pola yang berulang, kotak yang bergaris jingga berada pada urutan yang sama dengan kotak 6, jadi nilainya sama dengan kotak 6.');
      pem.push('Kotak pengganti tanda tanya (kotak ke-6) memenuhi semua aturan: ' + kanal.map(function (nm) { return NAMA[nm][kunci[nm]]; }).join(', ') + '.');
      var aturanTabel = {};
      kanal.forEach(function (nm) { var u = uru[nm]; aturanTabel[nm] = { aturan: u.aturan, p: u.p || null, k: u.k || null, d: u.d || null }; });
      return {
        tipe: 'serial', sels: sels.slice(0, 5), kunci: kunci, peng: peng, kanal: kanal, pembahasan: pem,
        aturan: kanal.map(function (nm) { return nm + ':' + uru[nm].aturan; }).join(','), uru: uru, pola: polaKanal('serial', kanal),
        bahas: [{ jenis: 'serial-tabel', judul: 'Pola tiap kanal, kotak 1 sampai 6', model: { sels: sels.slice(0, 5), jawaban: kunci, kanal: kanal, aturan: aturanTabel } }]
      };
    }
    return null;
  }

  // ===================================================================== matriks 3x3

  var RULE3 = {
    bentuk: ['latin', 'latin', 'latin', 'baris-tetap', 'kolom-tetap'],
    isi: ['latin', 'latin', 'langkah-baris', 'langkah-kolom', 'baris-tetap'],
    arah: ['langkah-baris', 'langkah-baris', 'langkah-kolom', 'latin'],
    titik: ['xor-baris', 'xor-baris', 'baris-tetap'],
    jumlah: ['langkah-baris', 'langkah-baris', 'jumlah-baris', 'latin'],
    penanda: ['langkah-baris', 'langkah-kolom', 'latin']
  };

  function transpos(g) { return [[g[0][0], g[1][0], g[2][0]], [g[0][1], g[1][1], g[2][1]], [g[0][2], g[1][2], g[2][2]]]; }

  /** Bangun matriks 3x3 nilai satu kanal menurut aturan; null bila tak bisa. */
  function bangunKanal3(a, nm, aturan) {
    var info = K[nm], g = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], r, c, deskripsi = '';
    if (aturan === 'latin') {
      if (info.n < 3) return null;
      var S3 = nilaiBeda(a, nm, 3), s = a.pilih([1, 2]);
      var P = S3;
      for (r = 0; r < 3; r++) for (c = 0; c < 3; c++) g[r][c] = P[mod(c + s * r, 3)];
      deskripsi = 'setiap baris dan setiap kolom memuat ketiga nilai (' + P.map(function (v) { return NAMA[nm][v]; }).join(', ') + ') tepat satu kali';
      return { g: g, aturan: aturan, desk: deskripsi };
    }
    if (aturan === 'baris-tetap' || aturan === 'kolom-tetap') {
      var v3 = [acakNilai(a, nm), acakNilai(a, nm), acakNilai(a, nm)];
      if (v3[0] === v3[1] && v3[1] === v3[2]) return null;
      for (r = 0; r < 3; r++) for (c = 0; c < 3; c++) g[r][c] = aturan === 'baris-tetap' ? v3[r] : v3[c];
      deskripsi = aturan === 'baris-tetap' ? 'nilainya sama di seluruh satu baris dan berganti antarbaris (' + v3.map(function (v) { return NAMA[nm][v]; }).join(', ') + ' dari atas ke bawah)' : 'nilainya sama di seluruh satu kolom dan berganti antarkolom (' + v3.map(function (v) { return NAMA[nm][v]; }).join(', ') + ' dari kiri ke kanan)';
      return { g: g, aturan: aturan, desk: deskripsi };
    }
    if (aturan === 'langkah-baris' || aturan === 'langkah-kolom') {
      var k, ks;
      if (nm === 'arah') ks = [1, -1, 2, -2]; else if (nm === 'jumlah') ks = [1, -1]; else if (nm === 'titik') ks = [1]; else if (nm === 'isi') ks = [1, 2]; else ks = [1, -1];
      k = a.pilih(ks);
      for (r = 0; r < 3; r++) {
        var mulai;
        if (info.tipe === 'bilangan') {
          var lo = k > 0 ? 0 : 2 * -k, hi = k > 0 ? info.n - 1 - 2 * k : info.n - 1;
          mulai = a.bulat(lo, hi);
        } else mulai = a.bulat(0, info.n - 1);
        for (c = 0; c < 3; c++) g[r][c] = info.tipe === 'bilangan' ? mulai + k * c : mod(mulai + k * c, info.n);
      }
      if (aturan === 'langkah-kolom') g = transpos(g);
      var jam = (k > 0 ? 'searah' : 'berlawanan arah') + ' jarum jam';
      var arahTeks = nm === 'arah' ? 'berputar ' + Math.abs(k) * 45 + ' derajat ' + jam : (nm === 'jumlah' ? (k > 0 ? 'bertambah ' : 'berkurang ') + Math.abs(k) :
        (nm === 'isi' ? 'maju ' + k + ' langkah pada urutan warna putih → abu-abu → hitam (lalu kembali ke putih)' :
          (nm === 'titik' ? 'berganti antara tanpa titik dan dengan titik' : (nm === 'penanda' ? 'bergeser ' + Math.abs(k) + ' pojok ' + jam : 'bergeser ' + k + ' langkah pada urutannya'))));
      deskripsi = arahTeks + ' setiap pindah satu ' + (aturan === 'langkah-baris' ? 'kolom ke kanan' : 'baris ke bawah');
      return { g: g, aturan: aturan, desk: deskripsi, k: k };
    }
    if (aturan === 'xor-baris') {
      for (r = 0; r < 3; r++) { var x = a.bulat(0, 1), y = a.bulat(0, 1); g[r] = [x, y, x ^ y]; }
      if (g.every(function (row) { return row[0] === g[0][0] && row[1] === g[0][1]; })) return null;
      return { g: g, aturan: aturan, desk: 'kotak ketiga pada tiap baris ada titik bila tepat satu dari dua kotak pertamanya bertitik' };
    }
    if (aturan === 'jumlah-baris') {
      var Kj = a.bulat(4, 8), baris = [], coba2 = 0;
      while (baris.length < 3 && coba2++ < 200) {
        var t = [a.bulat(0, 5), a.bulat(0, 5), a.bulat(0, 5)];
        if (t[0] + t[1] + t[2] !== Kj) continue;
        if (baris.some(function (b) { return b.join() === t.join(); })) continue;
        baris.push(t);
      }
      if (baris.length < 3) return null;
      return { g: baris, aturan: aturan, desk: 'jumlah kotak kecil pada tiap baris selalu ' + Kj, K: Kj };
    }
    return null;
  }

  function nilaiPengecoh3(nm, g, mr, mc, benar) {
    var info = K[nm], g2 = [];
    // nilai tetangga pada baris/kolom yang sama, nilai lain pada kanal itu, dan nilai terdekat
    var sebaris = g[mr].filter(function (v, c) { return c !== mc; }), sekolom = g.map(function (row) { return row[mc]; }).filter(function (v, r) { return r !== mr; });
    g2 = sebaris.concat(sekolom);
    if (info.tipe === 'siklik') { g2.push(mod(benar + 1, info.n)); g2.push(mod(benar - 1, info.n)); if (nm === 'arah') { g2.push(mod(benar + 2, info.n)); g2.push(mod(benar + 4, info.n)); } }
    else if (info.tipe === 'bilangan') { g2.push(benar + 1); g2.push(benar - 1); }
    for (var v = 0; v < info.n; v++) g2.push(v);
    return g2.filter(function (v, i) { return v >= 0 && v < info.n && v !== benar && g2.indexOf(v) === i; });
  }

  function buatMatriks3(a, level, target, dipakai) {
    var jml = level === 'mudah' ? 2 : (level === 'sedang' ? 3 : 4);
    var pool = ['bentuk', 'isi', 'arah', 'titik', 'jumlah', 'penanda'];
    for (var coba = 0; coba < 400; coba++) {
      var kanal = a.ambil(pool, jml);
      if (coba < 200 && polaTerpakai(polaKanal('matriks-3', kanal), dipakai)) continue;
      var mr = a.bulat(0, 2), mc = a.bulat(0, 2);
      var bangun = {}, ok = true;
      kanal.forEach(function (nm) {
        if (!ok) return;
        var rule = a.pilih(RULE3[nm]);
        if (level === 'mudah' && (rule === 'jumlah-baris' || rule === 'xor-baris')) rule = a.pilih(K[nm].n >= 3 ? ['baris-tetap', 'latin'] : ['baris-tetap']);
        var b = bangunKanal3(a, nm, rule);
        if (!b) { ok = false; return; }
        if (!b.g.every(function (row) { return row.length === 3 && row.every(function (v) { return v % 1 === 0 && v >= 0 && v < K[nm].n; }); })) { ok = false; return; }
        var gh = b.g.map(function (row) { return row.slice(); });
        gh[mr][mc] = null;
        var r = Inf.matriks3(K[nm], gh, mr, mc);
        if (r.status !== 'unik' || r.nilai !== b.g[mr][mc]) { ok = false; return; }
        bangun[nm] = b;
      });
      if (!ok) continue;
      var grid = [[{}, {}, {}], [{}, {}, {}], [{}, {}, {}]];
      kanal.forEach(function (nm) { for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) grid[r][c][nm] = bangun[nm].g[r][c]; });
      // matriks tidak boleh terlalu monoton: jumlah kotak berbeda minimal 4
      var beda = {};
      grid.forEach(function (row) { row.forEach(function (c) { beda[sidikSel(c)] = 1; }); });
      if (Object.keys(beda).length < 4) continue;
      var kunci = grid[mr][mc];
      var peng = pengecoh(a, kunci, kanal, function (nm) { return nilaiPengecoh3(nm, bangun[nm].g, mr, mc, kunci[nm]); },
        function (nm, benar, salah) { return alasanKanal(nm, benar, salah); });
      if (!peng) continue;
      var pem = ['Setiap kanal pada kotak mengikuti satu aturan. Kotak yang hilang berada pada baris ' + (mr + 1) + ', kolom ' + (mc + 1) + ' (Gambar 1; baris dan kolom yang dipakai aturan diarsir biru). Aturan yang terbaca dari delapan kotak yang terlihat, beserta nilainya pada baris atau kolom kotak itu (Gambar 2):'];
      kanal.forEach(function (nm) { pem.push('• ' + Fmt.kapital(LABEL[nm]) + ': ' + bangun[nm].desk + '; ' + nilaiGaris3(nm, bangun[nm], mr, mc) + '.'); });
      pem.push('Menerapkan setiap aturan pada kotak baris ' + (mr + 1) + ', kolom ' + (mc + 1) + ' memberi: ' + kanal.map(function (nm) { return NAMA[nm][kunci[nm]]; }).join(', ') + '.');
      var aturan3 = {}, garis = { baris: false, kolom: false };
      kanal.forEach(function (nm) {
        var b = bangun[nm];
        aturan3[nm] = { aturan: b.aturan, k: b.k == null ? null : b.k, K: b.K == null ? null : b.K };
        if (ATURAN_BARIS.indexOf(b.aturan) >= 0) garis.baris = true; else garis.kolom = true;
      });
      return { tipe: 'matriks-3', grid: grid, mr: mr, mc: mc, kunci: kunci, peng: peng, kanal: kanal, pembahasan: pem, aturan: kanal.map(function (nm) { return nm + ':' + bangun[nm].aturan; }).join(','), pola: polaKanal('matriks-3', kanal),
        bahas: [
          { jenis: 'matriks3-letak', judul: 'Kotak yang dicari: baris ' + (mr + 1) + ', kolom ' + (mc + 1), model: { grid: grid, mr: mr, mc: mc, jawaban: kunci, garis: garis } },
          { jenis: 'matriks3-aturan', judul: 'Aturan tiap kanal pada baris/kolom penentunya', model: { grid: grid, mr: mr, mc: mc, jawaban: kunci, kanal: kanal, aturan: aturan3 } }
        ] };
    }
    return null;
  }

  // ====================================================== matriks 3x3 simbol dan sambungan

  /*
   * Kotak: { s: [6 simbol, urut baris: kiri lalu kanan], h: [3 sambungan mendatar per baris],
   * v: [4 sambungan tegak: kiri baris 1-2, kiri baris 2-3, kanan baris 1-2, kanan baris 2-3] }.
   * Simbol: 0 persegi, 1 lingkaran putih, 2 lingkaran hitam.
   *
   * Contoh riset (Figural soal 5): banyak lingkaran hitam = banyak sambungan mendatar pada
   * setiap kotak, sedangkan sambungan tegak hanya pengalih perhatian. Tingkat kesulitan:
   *
   *   mudah   satu hubungan (simbol tertentu = semua sambungan), tanpa sambungan tegak
   *   sedang  satu hubungan dengan jenis sambungan tertentu (mendatar atau tegak); jenis
   *           sambungan yang lain muncul sebagai pengalih, seperti contoh riset
   *   sulit   dua hubungan sekaligus (simbol A = sambungan mendatar dan simbol B = sambungan
   *           tegak), atau jumlah tetap (banyak simbol + banyak sambungan = k)
   */
  var SIMBOL_SB = { persegi: 0, putih: 1, hitam: 2 };
  var NAMA_SB = { persegi: 'persegi', putih: 'lingkaran putih', hitam: 'lingkaran hitam', mendatar: 'sambungan mendatar', tegak: 'sambungan tegak', sambungan: 'sambungan' };

  function jumlahArr(xs) { return xs.reduce(function (s, x) { return s + x; }, 0); }

  /** Hitungan satu kotak (penyusun menghitung sendiri, tidak memakai Inferensi). */
  function hitungSb(x) {
    var n = [0, 0, 0];
    x.s.forEach(function (t) { n[t]++; });
    var h = jumlahArr(x.h), v = jumlahArr(x.v);
    return { persegi: n[0], putih: n[1], hitam: n[2], mendatar: h, tegak: v, sambungan: h + v };
  }

  function salinSb(x) { return { s: x.s.slice(), h: x.h.slice(), v: x.v.slice() }; }
  function sidikSb(x) { return x.s.join('') + '|' + x.h.join('') + '|' + x.v.join(''); }

  function memenuhiSb(x, rel) {
    var f = hitungSb(x);
    return rel.every(function (r) { return r.jenis === 'sama' ? f[r.x] === f[r.y] : f[r.x] + f[r.y] === r.k; });
  }

  function polaSb(rel) {
    return 'matriks-sambung:' + rel.map(function (r) { return r.jenis === 'sama' ? r.x + '=' + r.y : r.x + '+' + r.y + '=tetap'; }).join('&');
  }

  /** Pilih hubungan yang diujikan menurut tingkat; hubungan yang sudah dipakai paket ini didahulukan untuk dihindari. */
  function pilihHubungan(a, level, dipakai) {
    var simbol = ['hitam', 'putih', 'persegi'], calon = [];
    if (level === 'mudah') simbol.forEach(function (s) { calon.push({ rel: [{ x: s, y: 'sambungan', jenis: 'sama' }], derau: null }); });
    else if (level === 'sedang') {
      simbol.forEach(function (s) {
        calon.push({ rel: [{ x: s, y: 'mendatar', jenis: 'sama' }], derau: 'tegak' });
        calon.push({ rel: [{ x: s, y: 'tegak', jenis: 'sama' }], derau: 'mendatar' });
      });
      calon.push(calon[0]);                                  // bentuk contoh riset (hitam = mendatar) sedikit lebih sering
    } else {
      simbol.forEach(function (s1) {
        simbol.forEach(function (s2) { if (s1 !== s2) calon.push({ rel: [{ x: s1, y: 'mendatar', jenis: 'sama' }, { x: s2, y: 'tegak', jenis: 'sama' }], derau: null }); });
        calon.push({ rel: [{ x: s1, y: 'sambungan', jenis: 'jumlah', k: a.pilih([4, 5]) }], derau: 'pecah' });
      });
    }
    var baru = calon.filter(function (c) { return !polaTerpakai(polaSb(c.rel), dipakai); });
    return a.pilih(baru.length ? baru : calon);
  }

  /** Ambil n indeks acak dari 0..m-1 sebagai larik 0/1. */
  function pilihSlot(a, m, n) {
    var o = Array.apply(null, { length: m }).map(function () { return 0; });
    a.ambil(o.map(function (_, i) { return i; }), n).forEach(function (i) { o[i] = 1; });
    return o;
  }

  /** Bangun satu kotak yang memenuhi hubungan; `c` = banyak simbol tiap hubungan. */
  function bangunKotakSb(a, sp, c) {
    var nH, nV, hitung = {}, rel = sp.rel;
    if (rel.length === 2) { nH = c[0]; nV = c[1]; hitung[rel[0].x] = c[0]; hitung[rel[1].x] = c[1]; }
    else if (rel[0].jenis === 'jumlah') {
      var total = rel[0].k - c[0];
      nH = a.bulat(Math.max(0, total - 4), Math.min(3, total)); nV = total - nH;
      hitung[rel[0].x] = c[0];
    } else {
      hitung[rel[0].x] = c[0];
      if (rel[0].y === 'tegak') { nV = c[0]; nH = a.bulat(0, 2); }
      else { nH = c[0]; nV = sp.derau ? a.bulat(0, 2) : 0; }
    }
    if (nH < 0 || nH > 3 || nV < 0 || nV > 4) return null;
    var tetap = Object.keys(hitung), lain = ['persegi', 'putih', 'hitam'].filter(function (s) { return tetap.indexOf(s) < 0; });
    var s = [];
    tetap.forEach(function (nm) { for (var i = 0; i < hitung[nm]; i++) s.push(SIMBOL_SB[nm]); });
    if (s.length > 6) return null;
    while (s.length < 6) s.push(SIMBOL_SB[a.pilih(lain)]);
    return { s: a.kocok(s), h: pilihSlot(a, 3, nH), v: pilihSlot(a, 4, nV) };
  }

  /** Rentang banyak simbol untuk hubungan ke-i. */
  function rentangSb(rel, i) {
    var r = rel[i];
    if (r.jenis === 'jumlah') return [Math.max(0, r.k - 4), Math.min(4, r.k)];
    return [0, 3];
  }

  function uraianRel(r, derau) {
    if (r.jenis === 'jumlah') return 'Banyak ' + NAMA_SB[r.x] + ' ditambah banyak sambungan (mendatar maupun tegak) selalu ' + r.k;
    var kal = 'Banyak ' + NAMA_SB[r.x] + ' selalu sama dengan banyak ' + NAMA_SB[r.y];
    if (derau === 'tegak') kal += '; sambungan tegak tidak ikut dihitung';
    else if (derau === 'mendatar') kal += '; sambungan mendatar tidak ikut dihitung';
    return kal;
  }

  function nilaiRel(x, r) {
    var f = hitungSb(x);
    return r.jenis === 'jumlah' ? f[r.x] + '+' + f[r.y] : f[r.x] + '/' + f[r.y];
  }

  /** Alasan sebuah pengecoh: hubungan mana yang dilanggarnya, dengan hitungannya sendiri. */
  function alasanSb(x, rel, sebab) {
    var f = hitungSb(x), langgar = rel.filter(function (r) { return !memenuhiSb(x, [r]); }).map(function (r) {
      if (r.jenis === 'jumlah') return 'berisi ' + f[r.x] + ' ' + NAMA_SB[r.x] + ' dan ' + f[r.y] + ' sambungan (jumlahnya ' + (f[r.x] + f[r.y]) + ', bukan ' + r.k + ')';
      return 'berisi ' + f[r.x] + ' ' + NAMA_SB[r.x] + ' tetapi ' + f[r.y] + ' ' + NAMA_SB[r.y];
    });
    return (sebab ? sebab + ': ' : '') + langgar.join(', dan ');
  }

  /** Calon pengecoh dari kunci: tiap calon merusak hubungan dengan cara yang menggoda. */
  function calonPengecohSb(a, sp, kunci) {
    var calon = [];
    function tambah(x, sebab) { if (x) calon.push({ cell: x, sebab: sebab }); }
    function ubahSambung(x, jenis, d) {
      var y = salinSb(x), arr = jenis === 'mendatar' ? y.h : y.v, idx = [];
      arr.forEach(function (b, i) { if (b === (d > 0 ? 0 : 1)) idx.push(i); });
      if (!idx.length) return null;
      arr[a.pilih(idx)] = d > 0 ? 1 : 0;
      return y;
    }
    function gantiSimbol(x, dari, ke) {
      var y = salinSb(x), idx = [];
      y.s.forEach(function (t, i) { if (t === dari) idx.push(i); });
      if (!idx.length) return null;
      y.s[a.pilih(idx)] = ke;
      return y;
    }
    sp.rel.forEach(function (r) {
      var jenisY = r.y === 'sambungan' ? a.pilih(['mendatar', 'tegak']) : r.y, tX = SIMBOL_SB[r.x];
      if (r.y === 'sambungan' && !sp.derau) jenisY = 'mendatar';
      var lain = [0, 1, 2].filter(function (t) { return t !== tX; });
      tambah(ubahSambung(kunci, jenisY, -1), 'satu ' + NAMA_SB[jenisY] + ' kurang');
      tambah(ubahSambung(kunci, jenisY, 1), 'satu ' + NAMA_SB[jenisY] + ' berlebih');
      tambah(gantiSimbol(kunci, tX, a.pilih(lain)), 'satu ' + NAMA_SB[r.x] + ' berganti simbol');
      tambah(gantiSimbol(kunci, a.pilih(lain), tX), 'satu simbol berganti menjadi ' + NAMA_SB[r.x]);
      // pengalih: sambungan jenis lain menggantikan sambungan yang dihitung (seperti contoh riset)
      if (r.y !== 'sambungan' && sp.rel.length === 1) {
        var jenisL = r.y === 'mendatar' ? 'tegak' : 'mendatar';
        var g = ubahSambung(kunci, r.y, -1);
        tambah(g && ubahSambung(g, jenisL, 1), 'satu ' + NAMA_SB[r.y] + ' diganti ' + NAMA_SB[jenisL] + ', padahal ' + NAMA_SB[jenisL] + ' tidak dihitung');
      }
      // simbol lain yang kebetulan sama banyak dengan sambungannya
      lain.forEach(function (t) {
        var y = salinSb(kunci);
        y.s = y.s.map(function (u) { return u === tX ? t : (u === t ? tX : u); });
        if (sidikSb(y) !== sidikSb(kunci)) tambah(y, 'letak ' + NAMA_SB[r.x] + ' dan ' + NAMA_SB[['persegi', 'putih', 'hitam'][t]] + ' tertukar');
      });
    });
    return calon;
  }

  /**
   * Dua kotak contoh untuk gambar pembahasan (tanpa pengacak): kotak tampak dengan hitungan hubungan
   * pertama terbesar, lalu kotak dengan hitungan lain (yang bukan nol didahulukan).
   */
  function contohSb(grid, mr, mc, rel) {
    var tampak = [];
    grid.forEach(function (row, r) { row.forEach(function (x, c) { if (r !== mr || c !== mc) tampak.push({ r: r, c: c, cell: x, n: hitungSb(x)[rel[0].x] }); }); });
    var pertama = tampak.slice().sort(function (p, q) { return q.n - p.n; })[0];
    var lain = tampak.filter(function (p) { return p.n !== pertama.n; });
    var kedua = lain.filter(function (p) { return p.n > 0; })[0] || lain[0] || tampak.filter(function (p) { return p !== pertama; })[0];
    return [pertama, kedua].map(function (p) { return { r: p.r, c: p.c, cell: p.cell }; });
  }

  function buatSambung(a, level, dipakai) {
    for (var coba = 0; coba < 120; coba++) {
      var sp = pilihHubungan(a, level, dipakai), rel = sp.rel;
      var mr = a.untung(0.5) ? 1 : a.bulat(0, 2), mc = a.untung(0.5) ? 1 : a.bulat(0, 2);
      // nilai hubungan tiap kotak: kotak tampak harus memperlihatkan sedikitnya tiga nilai berbeda
      var grid = [[], [], []], ok = true, r, c;
      for (r = 0; r < 3 && ok; r++) {
        for (c = 0; c < 3 && ok; c++) {
          var nilai = rel.map(function (_, i) { var rg = rentangSb(rel, i); return a.bulat(rg[0], rg[1]); });
          var x = bangunKotakSb(a, sp, nilai);
          if (!x) ok = false; else grid[r][c] = x;
        }
      }
      if (!ok) continue;
      var tampak = [], sidik = {};
      for (r = 0; r < 3; r++) for (c = 0; c < 3; c++) { if (r !== mr || c !== mc) tampak.push(grid[r][c]); sidik[sidikSb(grid[r][c])] = 1; }
      if (Object.keys(sidik).length < 9) continue;
      var cukup = rel.every(function (rr) {
        var v = {}; tampak.forEach(function (x) { v[hitungSb(x)[rr.x]] = 1; });
        return Object.keys(v).length >= 3;
      });
      if (!cukup) continue;
      var kunci = grid[mr][mc];
      // pengecoh: melanggar hubungan, berbeda satu sama lain, dan bukan salinan kotak tampak. Pada dua
      // hubungan sekaligus, sedikitnya satu pengecoh hanya melanggar hubungan pertama dan satu lagi hanya
      // melanggar hubungan kedua, jadi kedua hubungan benar-benar diperlukan untuk menemukan kunci
      var calon = a.kocok(calonPengecohSb(a, sp, kunci)), peng = [], lihat = {};
      Object.keys(sidik).forEach(function (k) { lihat[k] = 1; });
      var jenisLanggar = function (x) { return rel.map(function (rr) { return memenuhiSb(x, [rr]) ? '1' : '0'; }).join(''); };
      if (rel.length === 2) calon.sort(function (p, q) { var lp = jenisLanggar(p.cell), lq = jenisLanggar(q.cell); return (lp === '00' ? 1 : 0) - (lq === '00' ? 1 : 0); });
      var butuh = rel.length === 2 ? ['01', '10'] : [];
      for (var i = 0; i < calon.length && peng.length < 4; i++) {
        var sd = sidikSb(calon[i].cell), jl = jenisLanggar(calon[i].cell);
        if (lihat[sd] || memenuhiSb(calon[i].cell, rel)) continue;
        // kursi terakhir disisakan untuk jenis pelanggaran yang belum terwakili
        var kurang = butuh.filter(function (j) { return !peng.some(function (p) { return p.jenis === j; }); });
        if (kurang.length && kurang.indexOf(jl) < 0 && 4 - peng.length <= kurang.length) continue;
        lihat[sd] = 1;
        peng.push({ cell: calon[i].cell, alasan: [alasanSb(calon[i].cell, rel, calon[i].sebab)], jenis: jl });
      }
      if (peng.length < 4 || butuh.some(function (j) { return !peng.some(function (p) { return p.jenis === j; }); })) continue;
      // aturan yang terbaca dari gambar harus menunjuk kunci saja (pemeriksa yang sama dengan validator)
      var gh = grid.map(function (row, rr) { return row.map(function (x, cc) { return rr === mr && cc === mc ? null : x; }); });
      var uji = Inf.sambung(gh, [kunci].concat(peng.map(function (p) { return p.cell; })));
      if (uji.status !== 'unik' || uji.nilai !== 0) continue;

      var pem = ['Setiap kotak berisi enam simbol (persegi, lingkaran putih, lingkaran hitam) dan beberapa garis sambungan. Letak kotak di dalam matriks tidak menentukan isinya; yang sama pada SEMUA kotak adalah hubungan antara banyak simbol dan banyak sambungan di dalam kotak itu sendiri.'];
      rel.forEach(function (rr) {
        pem.push('• ' + uraianRel(rr, sp.derau) + '.');
        var baris = grid.map(function (row, ri) { return row.map(function (x, ci) { return ri === mr && ci === mc ? '?' : nilaiRel(x, rr); }).join(', '); }).join('; ');
        pem.push('  Hitungan ' + (rr.jenis === 'jumlah' ? NAMA_SB[rr.x] + ' + sambungan' : NAMA_SB[rr.x] + ' / ' + NAMA_SB[rr.y]) + ' per kotak, baris demi baris: ' + baris + '.');
      });
      var fk = hitungSb(kunci), contoh = contohSb(grid, mr, mc, rel);
      pem.push('Gambar 1 menandai yang dihitung pada dua kotak contoh (baris ' + (contoh[0].r + 1) + ' kolom ' + (contoh[0].c + 1) + ', serta baris ' + (contoh[1].r + 1) + ' kolom ' + (contoh[1].c + 1) + ') dan pada kotak jawaban: ' +
        rel.map(function (rr, ri) { return NAMA_SB[rr.x] + ' dilingkari ' + (ri ? 'ungu' : 'jingga') + ' dan ' + (rr.jenis === 'jumlah' ? 'semua sambungan' : NAMA_SB[rr.y]) + ' diberi warna ' + (ri ? 'hijau tua' : 'biru'); }).join(', sedangkan ') + '.');
      pem.push('Kotak pengganti tanda tanya harus memenuhi ' + (rel.length > 1 ? 'kedua hubungan itu' : 'hubungan itu') + ' juga. Opsi yang tepat berisi ' +
        rel.map(function (rr) { return rr.jenis === 'jumlah' ? fk[rr.x] + ' ' + NAMA_SB[rr.x] + ' dan ' + fk.sambungan + ' sambungan (jumlah ' + rr.k + ')' : fk[rr.x] + ' ' + NAMA_SB[rr.x] + ' dan ' + fk[rr.y] + ' ' + NAMA_SB[rr.y]; }).join(', serta ') + '.');
      return { tipe: 'matriks-sambung', grid: gh, mr: mr, mc: mc, kunci: kunci, peng: peng, kanal: ['simbol', 'sambungan'], pembahasan: pem,
        aturan: rel.map(function (rr) { return rr.jenis === 'jumlah' ? rr.x + '+' + rr.y + '=' + rr.k : rr.x + '=' + rr.y; }).join(','), pola: polaSb(rel), sidikPenuh: grid,
        bahas: [{ jenis: 'sambung-hitung', judul: 'Hitungan pada kotak contoh dan kotak jawaban', model: { contoh: contoh, jawaban: kunci, rel: rel, derau: sp.derau } }] };
    }
    return null;
  }

  // ======================================================================= rakit

  var CATATAN_PENGAYAAN = 'Matriks 3x3 atribut (bentuk, warna, arah, titik, jumlah) adalah pengembangan generik yang tidak meniru hubungan simbol dan sambungan pada contoh riset Figural soal 5.';

  function rakit(id, level, benih, opsi) {
    opsi = opsi || {};
    var a = Rng.alat(benih);
    var target = opsi.target == null ? a.bulat(0, 4) : opsi.target;
    var dipakai = opsi.polaDipakai || [];
    var spec = null;
    for (var c = 0; c < 20 && !spec; c++) {
      if (id === 'serial') spec = buatSerial(a, level, target, benih, dipakai);
      else if (id === 'matriks-3') spec = buatMatriks3(a, level, target, dipakai);
      else if (id === 'matriks-sambung') spec = buatSambung(a, level, dipakai);
      else return null;
    }
    if (!spec) return null;

    // susun pilihan: kunci di posisi `target`, pengecoh mengisi sisanya
    var daftar = a.kocok(spec.peng.map(function (p) { return { cell: p.cell, alasan: p.alasan.join('; '), kunci: false }; }));
    daftar.splice(target, 0, { cell: spec.kunci, alasan: null, kunci: true });
    var ctx = { subtes: 'ku', submateri: 'figural', keluarga: id, level: level, benih: benih, a: a };
    var desc;
    if (spec.tipe === 'serial') desc = { id: 'soal', jenis: 'serial', model: { sels: spec.sels }, judul: 'Deret kotak' };
    else desc = { id: 'soal', jenis: 'matriks', model: { grid: spec.grid, mr: spec.mr, mc: spec.mc }, judul: 'Matriks 3x3' };
    var opsiGambar = daftar.map(function (d, i) {
      return { teks: 'Gambar opsi ' + Fmt.huruf(i), nilai: i, alasan: d.alasan, kunci: d.kunci, gambar: { id: 'opsi-' + Fmt.huruf(i).toLowerCase(), jenis: 'sel', model: { cell: d.cell }, judul: 'Opsi ' + Fmt.huruf(i) } };
    });
    var idxKunci = target;
    var pilih = { opsi: opsiGambar, kunciIndex: idxKunci };
    var jenisNama = { serial: 'Figural Serial - The Next Box', 'matriks-3': 'Figural Matriks - Kotak 3x3 (atribut)', 'matriks-sambung': 'Figural Matriks - Kotak 3x3' }[spec.tipe];
    var gridSidik = spec.sidikPenuh || spec.grid;
    var butir = Butir.rakitPg(ctx, {
      jenisSoal: jenisNama,
      judul: spec.tipe === 'serial' ? jenisNama : 'Figural Matriks - Kotak 3x3', teks: [], pertanyaan: '', perintah: PERINTAH,
      gambar: [desc], pilihanJadi: pilih, tulisKunci: false,
      langkah: [], pembahasan: spec.pembahasan,
      model: {
        topik: 'Figural', tipe: spec.tipe, kanal: spec.kanal, aturan: spec.aturan,
        sels: spec.tipe === 'serial' ? spec.sels : null, grid: spec.tipe === 'serial' ? null : spec.grid, mr: spec.mr, mc: spec.mc,
        pilihan: daftar.map(function (d) { return d.cell; }), kunciIndex: idxKunci
      },
      sidik: { inti: 'figural|' + id + '|' + (spec.tipe === 'serial' ? spec.sels.map(sidikSel).join('/') : gridSidik.map(function (row) { return row.map(sidikSel).join('/'); }).join('//')) + '|' + spec.mr + spec.mc,
        param: [], entitas: spec.kanal.join(',') + spec.aturan }
    });
    if (!butir) return null;
    butir.gambarPembahasan = spec.bahas.map(function (g, i) { return { id: 'bahas-' + (i + 1), jenis: g.jenis, judul: 'Gambar ' + (i + 1) + '. ' + g.judul, model: g.model }; });
    butir.pola = spec.pola;
    butir.kategoriRiset = spec.tipe === 'matriks-3' ? 'pengayaan' : 'acuan';
    if (spec.tipe === 'matriks-3') butir.catatanRiset = CATATAN_PENGAYAAN;
    return butir;
  }

  var KELUARGA = [
    { id: 'serial', nama: 'Deret kotak (The Next Box)', submateri: 'figural' },
    { id: 'matriks-3', nama: 'Matriks 3x3 atribut (pengayaan)', submateri: 'figural' },
    { id: 'matriks-sambung', nama: 'Matriks 3x3 simbol dan sambungan', submateri: 'figural' }
  ];

  return {
    KELUARGA: KELUARGA, NAMA: NAMA, LABEL: LABEL, PERINTAH: PERINTAH,
    sel: sel, svgSel: svgSel, svgSerial: svgSerial, svgMatriks: svgMatriks, buat: rakit,
    svgTabelSerial: svgTabelSerial, svgLetak3: svgLetak3, svgAturan3: svgAturan3, svgHitungSambung: svgHitungSambung
  };
});
