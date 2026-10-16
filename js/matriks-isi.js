/*
 * matriks-isi.js — Kemampuan Umum > Figural > Matriks kotak 5x6 (contoh riset BAB V, soal 3).
 *
 * Lima baris x enam kolom bentuk (segitiga, persegi, segi enam, lingkaran) yang berisi
 * hitam atau putih. Beberapa kotak berurutan pada satu baris ditutup tanda tanya, dan
 * pilihan A-E berupa deretan bentuk pengganti. Ada dua aturan sekaligus, seperti pada
 * contoh riset:
 *
 *   bentuk  setiap kolom memuat keempat bentuk masing-masing sekali ditambah satu bentuk
 *           yang sama di semua kolom (pada contoh riset: dua persegi per kolom), jadi bentuk
 *           kotak yang hilang adalah bentuk yang belum lengkap di kolomnya
 *   warna   mudah   warna mengikuti bentuk (dua bentuk selalu hitam, dua selalu putih)
 *           sedang  bergantian per baris atau per kolom menurut golongan bentuk, atau
 *                   berselang-seling seperti papan catur tanpa memandang bentuk
 *           sulit   bergantian per baris atau per kolom menurut golongan bentuk (contoh
 *                   riset: baris ganjil persegi dan segi enam hitam, baris genap segitiga
 *                   dan lingkaran hitam)
 *
 * Jumlah kotak yang ditutup: mudah 2-3, sedang 3-4, sulit 4. Pengecoh dibuat dari kesalahan
 * yang lazim: bentuk benar tetapi warnanya terbalik, satu warna salah, dua bentuk tertukar
 * atau bergeser (warnanya tetap mengikuti aturan), atau satu bentuk diganti.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./rng.js'), require('./svg.js'), require('./bentuk.js'), require('./butir.js'), require('./format.js'));
    module.exports = api;
  } else {
    api = factory(root.Rng, root.Svg, root.Bentuk, root.Butir, root.Fmt);
    root.MatriksIsi = api;
  }
})(typeof self !== 'undefined' ? self : this, function (Rng, S, Bentuk, Butir, Fmt) {
  'use strict';

  var PERINTAH = 'Gunakan gambar di bagian atas untuk menentukan jawaban yang benar dari pilihan di bawah. Pilih jawaban yang menggantikan tanda tanya. Jika tidak ada tanda tanya, pilih jawaban yang merupakan kelanjutan dari urutan tersebut.';
  var BENTUK = ['segitiga', 'persegi', 'segienam', 'lingkaran'];
  var NAMA = ['segitiga', 'persegi', 'segi enam', 'lingkaran'];
  var WARNA = ['putih', 'hitam'];
  var BARIS = 5, KOLOM = 6;
  var TINTA = '#1d1d1d';

  // --------------------------------------------------------------- menggambar

  function isiSel(sel, x, y, s) {
    return Bentuk.svg(BENTUK[sel.b], x + s / 2, y + s / 2, s * 0.34, { isi: sel.i ? TINTA : '#ffffff', garis: TINTA, tebal: 2 });
  }

  /** Matriks 5x6 tanpa garis sel (seperti contoh riset); kotak lubang digabung menjadi satu "?". */
  function svgMatriks(grid, lubang, ukuran) {
    var s = ukuran || 50, pad = 8, bag = [];
    for (var r = 0; r < grid.length; r++) {
      for (var c = 0; c < grid[r].length; c++) {
        if (r === lubang.r && c >= lubang.c && c < lubang.c + lubang.k) continue;
        bag.push(isiSel(grid[r][c], pad + c * s, pad + r * s, s));
      }
    }
    var x = pad + lubang.c * s + 3, y = pad + lubang.r * s + 3, w = lubang.k * s - 6, h = s - 6;
    bag.push(S.rect(x, y, w, h, { rx: 6, isi: '#f4f6fb', garis: '#9aa3b5', tebal: 1.2 }));
    bag.push(S.teks('?', x + w / 2, y + h / 2 + 12, { ukuran: 33, tebal: true, isi: '#4a5266', rata: 'middle' }));
    var W = pad * 2 + grid[0].length * s, H = pad * 2 + grid.length * s;
    bag.push(S.rect(1, 1, W - 2, H - 2, { isi: 'none', garis: '#c4cad6', tebal: 1.2 }));
    return { svg: S.doc(bag.join(''), W, H, { latar: '#ffffff' }), lebar: W, tinggi: H };
  }

  /** Pilihan jawaban: deretan bentuk mendatar. */
  function svgDeret(isi, ukuran) {
    var s = ukuran || 50, pad = 5, bag = [];
    isi.forEach(function (sel, j) { bag.push(isiSel(sel, pad + j * s, pad, s)); });
    var W = pad * 2 + isi.length * s, H = pad * 2 + s;
    bag.push(S.rect(1, 1, W - 2, H - 2, { isi: 'none', garis: '#c4cad6', tebal: 1.2 }));
    return { svg: S.doc(bag.join(''), W, H, { latar: '#ffffff' }), lebar: W, tinggi: H };
  }

  // --------------------------------------------------------------- aturan

  function daftarNama(vs) {
    var n = vs.map(function (v) { return NAMA[v]; });
    return n.length <= 1 ? n.join('') : n.slice(0, -1).join(', ') + ' dan ' + n[n.length - 1];
  }

  function pilihAturan(a, level) {
    var jenis = level === 'mudah' ? 'bentuk' : (level === 'sedang' ? a.pilih(['baris', 'kolom', 'catur', 'baris']) : a.pilih(['baris', 'baris', 'kolom']));
    var P = a.ambil([0, 1, 2, 3], 2).sort();
    return { jenis: jenis, P: P, Q: [0, 1, 2, 3].filter(function (v) { return P.indexOf(v) < 0; }), awal: a.bulat(0, 1) };
  }

  /** Warna (0 putih, 1 hitam) kotak berbentuk b pada baris r, kolom c menurut aturan. */
  function warnaMenurut(at, b, r, c) {
    var gol = at.P.indexOf(b) >= 0 ? 1 : 0;
    if (at.jenis === 'bentuk') return gol;
    if (at.jenis === 'baris') return gol ^ ((r + at.awal) % 2);
    if (at.jenis === 'kolom') return gol ^ ((c + at.awal) % 2);
    return (r + c + at.awal) % 2;
  }

  function uraianWarna(at, r) {
    var hitamP = daftarNama(at.P), hitamQ = daftarNama(at.Q);
    if (at.jenis === 'bentuk') return 'Warna mengikuti bentuk: ' + hitamP + ' selalu hitam, sedangkan ' + hitamQ + ' selalu putih.';
    if (at.jenis === 'catur') return 'Warna berselang-seling seperti papan catur tanpa memandang bentuknya: kotak baris 1 kolom 1 ' + WARNA[at.awal % 2] + ', lalu warnanya berganti setiap pindah satu kotak ke kanan atau ke bawah. Baris ' + (r + 1) + ' dimulai dengan kotak ' + WARNA[(r + at.awal) % 2] + '.';
    var nomor = function (par, n) { var o = []; for (var i = 0; i < n; i++) if (i % 2 === par) o.push(i + 1); return o.join(', '); };
    var satuan = at.jenis === 'baris' ? 'baris' : 'kolom', n = at.jenis === 'baris' ? BARIS : KOLOM;
    // golongan P hitam pada baris/kolom ber-indeks i dengan (i + awal) genap
    var parP = at.awal % 2;
    var kal = 'Warna bergantian per ' + satuan + ' menurut golongan bentuk: pada ' + satuan + ' ' + nomor(parP, n) + ' ' + hitamP + ' hitam dan ' + hitamQ + ' putih; pada ' + satuan + ' ' + nomor(1 - parP, n) + ' sebaliknya (' + hitamQ + ' hitam, ' + hitamP + ' putih).';
    if (at.jenis === 'baris') kal += ' Baris ' + (r + 1) + ' termasuk baris yang ' + (((r + at.awal) % 2) === 0 ? hitamP : hitamQ) + ' hitam.';
    else kal += ' Terapkan aturan itu pada kolom tiap kotak yang hilang.';
    return kal;
  }

  // --------------------------------------------------------------- pengecoh

  function sidikDeret(d) { return d.map(function (x) { return x.b + '' + x.i; }).join(','); }

  function buatPengecoh(a, at, grid, l, kunci) {
    var k = l.k, calon = [];
    function warnai(bs) { return bs.map(function (b, j) { return { b: b, i: warnaMenurut(at, b, l.r, l.c + j) }; }); }
    var bKunci = kunci.map(function (x) { return x.b; });
    calon.push({ isi: kunci.map(function (x) { return { b: x.b, i: 1 - x.i }; }), alasan: 'bentuknya benar tetapi semua warnanya terbalik' });
    var j1 = a.bulat(0, k - 1);
    calon.push({ isi: kunci.map(function (x, j) { return { b: x.b, i: j === j1 ? 1 - x.i : x.i }; }), alasan: 'warna ' + NAMA[kunci[j1].b] + ' pada kotak ke-' + (j1 + 1) + ' seharusnya ' + WARNA[kunci[j1].i] });
    // dua bentuk tertukar (warna tetap mengikuti aturan)
    for (var t = 0; t < 6; t++) {
      var p = a.bulat(0, k - 1), q = a.bulat(0, k - 1);
      if (p === q || bKunci[p] === bKunci[q]) continue;
      var bs = bKunci.slice(); bs[p] = bKunci[q]; bs[q] = bKunci[p];
      calon.push({ isi: warnai(bs), alasan: 'bentuk kotak ke-' + (Math.min(p, q) + 1) + ' dan ke-' + (Math.max(p, q) + 1) + ' tertukar, padahal kolom ' + (l.c + p + 1) + ' masih kekurangan ' + NAMA[bKunci[p]] + ' dan kolom ' + (l.c + q + 1) + ' kekurangan ' + NAMA[bKunci[q]] });
    }
    // urutan bergeser satu kotak
    var geser = bKunci.slice(1).concat(bKunci.slice(0, 1));
    calon.push({ isi: warnai(geser), alasan: 'urutan bentuknya bergeser satu kotak, sehingga ada kolom yang tidak mendapat bentuk yang kurang darinya' });
    // satu bentuk diganti
    for (var u = 0; u < 6; u++) {
      var j = a.bulat(0, k - 1), lain = a.pilih([0, 1, 2, 3].filter(function (v) { return v !== bKunci[j]; }));
      var bs2 = bKunci.slice(); bs2[j] = lain;
      calon.push({ isi: warnai(bs2), alasan: 'kotak ke-' + (j + 1) + ' berbentuk ' + NAMA[lain] + ', padahal kolom ' + (l.c + j + 1) + ' yang belum lengkap adalah ' + NAMA[bKunci[j]] });
    }
    // bentuk tertukar dan warnanya ikut terbalik
    var bs3 = bKunci.slice().reverse();
    var terbalik = warnai(bs3).map(function (x) { return { b: x.b, i: 1 - x.i }; });
    calon.push({ isi: terbalik, alasan: 'urutan bentuknya terbalik dan warnanya juga tidak mengikuti aturan' });

    var hasil = [], lihat = {};
    lihat[sidikDeret(kunci)] = 1;
    var urut = [calon[0]].concat(a.kocok(calon.slice(1)));
    for (var i = 0; i < urut.length && hasil.length < 4; i++) {
      var sd = sidikDeret(urut[i].isi);
      if (lihat[sd]) continue;
      lihat[sd] = 1;
      hasil.push(urut[i]);
    }
    return hasil.length === 4 ? hasil : null;
  }

  // --------------------------------------------------------------------- butir

  function buat(id, level, benih, opsi) {
    opsi = opsi || {};
    var a = Rng.alat(benih);
    var target = opsi.target == null ? a.bulat(0, 4) : opsi.target;
    for (var coba = 0; coba < 30; coba++) {
      var tambahan = a.bulat(0, 3), M = [0, 1, 2, 3, tambahan], kolom = [], r, c;
      for (c = 0; c < KOLOM; c++) kolom.push(a.kocok(M));
      var at = pilihAturan(a, level), grid = [];
      for (r = 0; r < BARIS; r++) {
        var baris = [];
        for (c = 0; c < KOLOM; c++) baris.push({ b: kolom[c][r], i: warnaMenurut(at, kolom[c][r], r, c) });
        grid.push(baris);
      }
      var k = level === 'mudah' ? a.pilih([2, 3]) : (level === 'sedang' ? a.pilih([3, 4]) : 4);
      var l = { r: a.bulat(0, BARIS - 1), c: 0, k: k };
      l.c = a.bulat(0, KOLOM - k);
      var kunci = grid[l.r].slice(l.c, l.c + k).map(function (x) { return { b: x.b, i: x.i }; });
      // jawaban yang semuanya satu bentuk atau satu warna terlalu mudah ditebak
      if (kunci.every(function (x) { return x.b === kunci[0].b; })) continue;
      if (at.jenis !== 'bentuk' && kunci.every(function (x) { return x.i === kunci[0].i; }) && level === 'sulit') continue;
      var peng = buatPengecoh(a, at, grid, l, kunci);
      if (!peng) continue;

      var tampak = grid.map(function (row, rr) { return row.map(function (x, cc) { return rr === l.r && cc >= l.c && cc < l.c + k ? null : { b: x.b, i: x.i }; }); });
      var lengkap = [];
      for (c = 0; c < KOLOM; c++) if (c < l.c || c >= l.c + k) lengkap.push(c + 1);
      var pem = ['Ada dua aturan yang berlaku bersamaan: aturan bentuk dan aturan warna.',
        'Aturan bentuk: setiap kolom memuat segitiga, persegi, segi enam, dan lingkaran masing-masing satu kali, ditambah satu ' + NAMA[tambahan] + ' lagi (lihat kolom yang lengkap, misalnya kolom ' + lengkap.slice(0, 2).join(' dan ') + '). Bentuk kotak yang hilang adalah bentuk yang belum lengkap di kolomnya:'];
      kunci.forEach(function (x, j) {
        var cc = l.c + j, ada = [];
        for (var rr = 0; rr < BARIS; rr++) if (rr !== l.r) ada.push(grid[rr][cc].b);
        pem.push('• Kolom ' + (cc + 1) + ' sudah memuat ' + daftarNama(ada.slice().sort()) + ', jadi kurang ' + NAMA[x.b] + '.');
      });
      var uw = uraianWarna(at, l.r);
      pem.push('Aturan warna: ' + uw.charAt(0).toLowerCase() + uw.slice(1));
      pem.push('Jadi potongan yang hilang (dari kiri ke kanan): ' + kunci.map(function (x) { return NAMA[x.b] + ' ' + WARNA[x.i]; }).join(', ') + '.');

      var daftar = a.kocok(peng.map(function (p) { return { isi: p.isi, alasan: p.alasan, kunci: false }; }));
      daftar.splice(target, 0, { isi: kunci, alasan: null, kunci: true });
      var opsiGambar = daftar.map(function (d, i) {
        return { teks: 'Gambar opsi ' + Fmt.huruf(i), nilai: i, alasan: d.alasan, kunci: d.kunci,
          gambar: { id: 'opsi-' + Fmt.huruf(i).toLowerCase(), jenis: 'isi-opsi', model: { isi: d.isi }, judul: 'Opsi ' + Fmt.huruf(i) } };
      });
      var ctx = { subtes: 'ku', submateri: 'figural', keluarga: id, level: level, benih: benih, a: a };
      return Butir.rakitPg(ctx, {
        jenisSoal: 'Figural Matriks - Kotak 5x6',
        judul: 'Figural Matriks - Kotak 5x6', teks: [], pertanyaan: '', perintah: PERINTAH,
        gambar: [{ id: 'soal', jenis: 'isi', model: { grid: tampak, lubang: l }, judul: 'Matriks 5x6' }],
        pilihanJadi: { opsi: opsiGambar, kunciIndex: target }, tulisKunci: false,
        langkah: [], pembahasan: pem,
        model: {
          topik: 'Figural', tipe: 'matriks-isi', grid: tampak, lubang: l, aturan: { bentuk: 'kolom-sama', warna: at.jenis },
          pilihan: daftar.map(function (d) { return d.isi; }), kunciIndex: target
        },
        sidik: { inti: 'matriks-isi|' + grid.map(function (row) { return sidikDeret(row); }).join('/') + '|' + l.r + l.c + l.k, param: [], entitas: at.jenis }
      });
    }
    return null;
  }

  var KELUARGA = [{ id: 'matriks-isi', nama: 'Matriks 5x6 (bentuk hitam dan putih)', submateri: 'figural' }];

  return { KELUARGA: KELUARGA, BENTUK: BENTUK, PERINTAH: PERINTAH, buat: buat, svgMatriks: svgMatriks, svgDeret: svgDeret };
});
