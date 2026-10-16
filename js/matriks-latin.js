/*
 * matriks-latin.js — Kemampuan Umum > Figural > Matriks kotak 5x5 (contoh riset BAB V, soal 2).
 *
 * Lima bentuk garis (hati, lingkaran, persegi, segitiga, bintang) tersusun dalam matriks
 * 5x5 sehingga setiap baris dan setiap kolom memuat kelimanya tepat satu kali (persegi
 * latin). Sebagian kotak ditutup satu tanda tanya, dan pilihan A-E berupa potongan yang
 * menggantikannya:
 *
 *   mudah   satu kotak
 *   sedang  dua kotak bersebelahan, tegak atau mendatar (seperti contoh riset)
 *   sulit   blok 2x2: dua baris dan dua kolomnya sama-sama kekurangan dua bentuk
 *
 * Persegi latin dibangkitkan dengan runut-balik berbenih. Blok 2x2 yang isinya bisa
 * ditukar silang (a b / b a) ditolak karena jawabannya tidak tunggal. Pengecoh dibuat
 * dengan menukar urutan kotak jawaban atau mengganti bentuknya dengan bentuk yang sudah
 * ada di baris/kolom yang sama; alasan tiap pengecoh ditulis dari pelanggaran yang
 * benar-benar terjadi.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./rng.js'), require('./svg.js'), require('./bentuk.js'), require('./butir.js'), require('./format.js'));
    module.exports = api;
  } else {
    api = factory(root.Rng, root.Svg, root.Bentuk, root.Butir, root.Fmt);
    root.MatriksLatin = api;
  }
})(typeof self !== 'undefined' ? self : this, function (Rng, S, Bentuk, Butir, Fmt) {
  'use strict';

  var PERINTAH = 'Gunakan gambar di bagian atas untuk menentukan jawaban yang benar dari pilihan di bawah. Pilih jawaban yang menggantikan tanda tanya. Jika tidak ada tanda tanya, pilih jawaban yang merupakan kelanjutan dari urutan tersebut.';
  var BENTUK = ['hati', 'lingkaran', 'persegi', 'segitiga', 'bintang'];
  var N = 5;
  var TINTA = '#1d1d1d', TEPI = '#4a5266';

  // --------------------------------------------------------------- menggambar

  function isiSel(v, x, y, s) {
    return Bentuk.svg(BENTUK[v], x + s / 2, y + s / 2, s * 0.3, { isi: '#ffffff', garis: TINTA, tebal: 2.2 });
  }

  function kotakTanya(x, y, w, h) {
    var uk = Math.min(w, h) * 0.6;
    return S.rect(x, y, w, h, { isi: '#f4f6fb', garis: TEPI, tebal: 1.4 }) +
      S.teks('?', x + w / 2, y + h / 2 + uk * 0.36, { ukuran: uk, tebal: true, isi: '#4a5266', rata: 'middle' });
  }

  function dalamLubang(l, r, c) { return r >= l.r && r < l.r + l.h && c >= l.c && c < l.c + l.w; }

  /** Matriks dengan satu daerah "?" (sel-sel lubang digabung). */
  function svgMatriks(grid, lubang, ukuran) {
    var s = ukuran || 58, pad = 6, n = grid.length, m = grid[0].length, bag = [];
    for (var r = 0; r < n; r++) {
      for (var c = 0; c < m; c++) {
        if (dalamLubang(lubang, r, c)) continue;
        var x = pad + c * s, y = pad + r * s;
        bag.push(S.rect(x, y, s, s, { isi: '#ffffff', garis: TEPI, tebal: 1.4 }));
        bag.push(isiSel(grid[r][c], x, y, s));
      }
    }
    bag.push(kotakTanya(pad + lubang.c * s, pad + lubang.r * s, lubang.w * s, lubang.h * s));
    bag.push(S.rect(pad, pad, m * s, n * s, { isi: 'none', garis: TEPI, tebal: 2.4 }));
    var W = pad * 2 + m * s, H = pad * 2 + n * s;
    return { svg: S.doc(bag.join(''), W, H, { latar: '#ffffff' }), lebar: W, tinggi: H };
  }

  /** Potongan pilihan jawaban (sebentuk dengan lubang); lebar kanvas = sisi terpanjang. */
  function svgPotongan(isi, ukuran) {
    var s = ukuran || 58, pad = 5, h = isi.length, w = isi[0].length, lebar = Math.max(h, w) * s;
    var x0 = pad + (lebar - w * s) / 2, bag = [];
    for (var r = 0; r < h; r++) {
      for (var c = 0; c < w; c++) {
        var x = x0 + c * s, y = pad + r * s;
        bag.push(S.rect(x, y, s, s, { isi: '#ffffff', garis: TEPI, tebal: 1.4 }));
        bag.push(isiSel(isi[r][c], x, y, s));
      }
    }
    bag.push(S.rect(x0, pad, w * s, h * s, { isi: 'none', garis: TEPI, tebal: 2.2 }));
    var W = lebar + pad * 2, H = h * s + pad * 2;
    return { svg: S.doc(bag.join(''), W, H, { latar: '#ffffff' }), lebar: W, tinggi: H };
  }

  // --------------------------------------------------------------- pembangunan

  /** Persegi latin 5x5 acak (runut-balik dengan urutan coba yang diacak). */
  function persegiLatin(a) {
    var g = [], i;
    for (i = 0; i < N; i++) g.push([-1, -1, -1, -1, -1]);
    function boleh(r, c, v) {
      for (var k = 0; k < N; k++) if (g[r][k] === v || g[k][c] === v) return false;
      return true;
    }
    function isi(pos) {
      if (pos === N * N) return true;
      var r = Math.floor(pos / N), c = pos % N, urut = a.kocok([0, 1, 2, 3, 4]);
      for (var k = 0; k < urut.length; k++) {
        if (!boleh(r, c, urut[k])) continue;
        g[r][c] = urut[k];
        if (isi(pos + 1)) return true;
        g[r][c] = -1;
      }
      return false;
    }
    return isi(0) ? g : null;
  }

  function pilihLubang(a, level, g) {
    for (var coba = 0; coba < 60; coba++) {
      var l;
      if (level === 'mudah') l = { r: a.bulat(0, 4), c: a.bulat(0, 4), h: 1, w: 1 };
      else if (level === 'sedang') l = a.untung(0.6) ? { r: a.bulat(0, 3), c: a.bulat(0, 4), h: 2, w: 1 } : { r: a.bulat(0, 4), c: a.bulat(0, 3), h: 1, w: 2 };
      else l = { r: a.bulat(0, 3), c: a.bulat(0, 3), h: 2, w: 2 };
      // blok "a b / b a" dapat ditukar silang tanpa melanggar aturan: jawabannya dua
      if (l.h === 2 && l.w === 2 && g[l.r][l.c] === g[l.r + 1][l.c + 1] && g[l.r][l.c + 1] === g[l.r + 1][l.c]) continue;
      return l;
    }
    return null;
  }

  function potong(g, l) {
    var o = [];
    for (var r = 0; r < l.h; r++) { var row = []; for (var c = 0; c < l.w; c++) row.push(g[l.r + r][l.c + c]); o.push(row); }
    return o;
  }

  function sidikPotongan(p) { return p.map(function (row) { return row.join(''); }).join('/'); }

  function namaDaftar(vs) {
    var n = vs.map(function (v) { return BENTUK[v]; });
    if (n.length <= 1) return n.join('');
    return n.slice(0, -1).join(', ') + ' dan ' + n[n.length - 1];
  }

  /** Bentuk yang belum ada di baris r / kolom c (hanya dari kotak yang tampak). */
  function kurangBaris(g, l, r) {
    var ada = [];
    for (var c = 0; c < N; c++) if (!dalamLubang(l, r, c)) ada.push(g[r][c]);
    return [0, 1, 2, 3, 4].filter(function (v) { return ada.indexOf(v) < 0; });
  }
  function kurangKolom(g, l, c) {
    var ada = [];
    for (var r = 0; r < N; r++) if (!dalamLubang(l, r, c)) ada.push(g[r][c]);
    return [0, 1, 2, 3, 4].filter(function (v) { return ada.indexOf(v) < 0; });
  }

  /**
   * Pelanggaran aturan yang terjadi bila potongan `p` dipasang pada lubang: bentuk yang
   * sudah ada di baris/kolom yang sama (di luar lubang), atau dua kotak potongan yang
   * sebaris/sekolom berisi bentuk yang sama.
   */
  function pelanggaran(g, l, p) {
    var out = [];
    for (var i = 0; i < l.h; i++) {
      for (var j = 0; j < l.w; j++) {
        var v = p[i][j], r = l.r + i, c = l.c + j, k;
        for (k = 0; k < N; k++) {
          if (!dalamLubang(l, r, k) && g[r][k] === v) { out.push('baris ' + (r + 1) + ' sudah memuat ' + BENTUK[v] + ' (kolom ' + (k + 1) + ')'); break; }
        }
        for (k = 0; k < N; k++) {
          if (!dalamLubang(l, k, c) && g[k][c] === v) { out.push('kolom ' + (c + 1) + ' sudah memuat ' + BENTUK[v] + ' (baris ' + (k + 1) + ')'); break; }
        }
        if (j > 0 && p[i][j - 1] === v) out.push('dua kotak di baris ' + (r + 1) + ' sama-sama berisi ' + BENTUK[v]);
        if (i > 0 && p[i - 1][j] === v) out.push('dua kotak di kolom ' + (c + 1) + ' sama-sama berisi ' + BENTUK[v]);
      }
    }
    return out.filter(function (x, i) { return out.indexOf(x) === i; });
  }

  /** Empat pengecoh yang semuanya melanggar aturan, berbeda satu sama lain dan dari kunci. */
  function buatPengecoh(a, g, l, kunci) {
    var calon = [], h = l.h, w = l.w;
    function tambah(p, sebab) { calon.push({ isi: p, sebab: sebab }); }
    function salin(p) { return p.map(function (row) { return row.slice(); }); }
    var lain = function (kecuali) { return [0, 1, 2, 3, 4].filter(function (v) { return kecuali.indexOf(v) < 0; }); };
    if (h * w === 1) {
      lain([kunci[0][0]]).forEach(function (v) { tambah([[v]], null); });
    } else if (h * w === 2) {
      var x = kunci[0][0], y = h === 2 ? kunci[1][0] : kunci[0][1];
      var pasang = function (p, q) { return h === 2 ? [[p], [q]] : [[p, q]]; };
      tambah(pasang(y, x), 'urutannya tertukar');
      a.kocok(lain([x, y])).forEach(function (v) {
        tambah(pasang(x, v), null);
        tambah(pasang(v, y), null);
        tambah(pasang(y, v), null);
        tambah(pasang(v, x), null);
      });
    } else {
      var k = kunci, p;
      tambah([[k[0][1], k[0][0]], [k[1][1], k[1][0]]], 'kedua kolomnya tertukar');
      tambah([[k[1][0], k[1][1]], [k[0][0], k[0][1]]], 'kedua barisnya tertukar');
      tambah([[k[0][0], k[1][0]], [k[0][1], k[1][1]]], 'baris dan kolomnya bertukar tempat');
      tambah([[k[1][1], k[1][0]], [k[0][1], k[0][0]]], 'potongannya terputar 180 derajat');
      for (var t = 0; t < 12; t++) {
        p = salin(k);
        var i = a.bulat(0, 1), j = a.bulat(0, 1);
        p[i][j] = a.pilih(lain([k[i][j]]));
        tambah(p, null);
      }
    }
    var hasil = [], lihat = {};
    lihat[sidikPotongan(kunci)] = 1;
    // pengecoh berpola (urutan tertukar, baris/kolom tertukar) didahulukan, sisanya acak
    var urut;
    if (h * w === 1) urut = a.kocok(calon);
    else if (h * w === 2) urut = [calon[0]].concat(a.kocok(calon.slice(1)));
    else urut = a.kocok(calon.slice(0, 4)).concat(a.kocok(calon.slice(4)));
    for (var q = 0; q < urut.length && hasil.length < 4; q++) {
      var c = urut[q], sd = sidikPotongan(c.isi);
      if (lihat[sd]) continue;
      var langgar = pelanggaran(g, l, c.isi);
      if (!langgar.length) continue;                       // (tak mungkin: jawaban latin tunggal)
      lihat[sd] = 1;
      hasil.push({ isi: c.isi, alasan: (c.sebab ? c.sebab + ': ' : '') + langgar.slice(0, 2).join('; ') });
    }
    return hasil.length === 4 ? hasil : null;
  }

  /**
   * Penalaran untuk pembahasan: isi dulu kotak lubang yang kemungkinannya tinggal satu
   * (bentuk yang belum ada di barisnya DAN di kolomnya), lalu ulangi.
   */
  function jejak(g, l) {
    var terisi = {}, baris = [];
    for (var putaran = 0; putaran < 6 && Object.keys(terisi).length < l.h * l.w; putaran++) {
      for (var i = 0; i < l.h; i++) {
        for (var j = 0; j < l.w; j++) {
          var r = l.r + i, c = l.c + j, kunciSel = r + ',' + c;
          if (terisi[kunciSel] !== undefined) continue;
          var kb = kurangBaris(g, l, r), kk = kurangKolom(g, l, c), sudah = [];
          Object.keys(terisi).forEach(function (s) {
            var rc = s.split(',').map(Number);
            if ((rc[0] === r || rc[1] === c) && sudah.indexOf(terisi[s]) < 0) sudah.push(terisi[s]);
          });
          var cocok = kb.filter(function (v) { return kk.indexOf(v) >= 0 && sudah.indexOf(v) < 0; });
          if (cocok.length !== 1) continue;
          terisi[kunciSel] = cocok[0];
          var kal = '• Baris ' + (r + 1) + ', kolom ' + (c + 1) + ': baris ' + (r + 1) + ' belum memuat ' + namaDaftar(kb) +
            (kb.length === 1 && kk.length === 1 ? ' dan kolom ' + (c + 1) + ' juga belum memuat ' + namaDaftar(kk) : ', kolom ' + (c + 1) + ' belum memuat ' + namaDaftar(kk));
          if (sudah.length && kb.filter(function (v) { return kk.indexOf(v) >= 0; }).length > 1) kal += ', sedangkan ' + namaDaftar(sudah.filter(function (v) { return kb.indexOf(v) >= 0 && kk.indexOf(v) >= 0; })) + ' sudah dipakai kotak lain pada lubang yang sebaris atau sekolom';
          kal += '; jadi kotak ini berisi ' + BENTUK[cocok[0]] + '.';
          baris.push(kal);
        }
      }
    }
    return Object.keys(terisi).length === l.h * l.w ? baris : null;
  }

  // --------------------------------------------------------------------- butir

  function buat(id, level, benih, opsi) {
    opsi = opsi || {};
    var a = Rng.alat(benih);
    var target = opsi.target == null ? a.bulat(0, 4) : opsi.target;
    for (var coba = 0; coba < 20; coba++) {
      var g = persegiLatin(a);
      if (!g) continue;
      var l = pilihLubang(a, level, g);
      if (!l) continue;
      var kunci = potong(g, l);
      var peng = buatPengecoh(a, g, l, kunci);
      if (!peng) continue;
      var langkah = jejak(g, l);
      if (!langkah) continue;

      var tampak = g.map(function (row, r) { return row.map(function (v, c) { return dalamLubang(l, r, c) ? null : v; }); });
      var daftar = a.kocok(peng.map(function (p) { return { isi: p.isi, alasan: p.alasan, kunci: false }; }));
      daftar.splice(target, 0, { isi: kunci, alasan: null, kunci: true });

      var letak = l.h * l.w === 1 ? 'satu kotak' : (l.h * l.w === 2 ? 'dua kotak ' + (l.h === 2 ? 'bertumpuk (dibaca dari atas ke bawah)' : 'berdampingan (dibaca dari kiri ke kanan)') : 'blok 2x2');
      var pem = ['Setiap baris dan setiap kolom memuat kelima bentuk (hati, lingkaran, persegi, segitiga, bintang) tepat satu kali; tidak ada bentuk yang berulang dalam satu baris atau satu kolom.',
        'Tanda tanya menutup ' + letak + ' mulai baris ' + (l.r + 1) + ', kolom ' + (l.c + 1) + '. Isi tiap kotaknya dengan bentuk yang belum ada di baris dan kolomnya:'];
      langkah.forEach(function (x) { pem.push(x); });
      var nm = function (row) { return row.map(function (v) { return BENTUK[v]; }).join(', '); };
      pem.push('Potongan yang tepat: ' + (l.h * l.w === 1 ? BENTUK[kunci[0][0]] : (l.w === 1 ? 'dari atas ke bawah ' + kunci.map(function (row) { return BENTUK[row[0]]; }).join(', ') :
        (l.h === 1 ? 'dari kiri ke kanan ' + nm(kunci[0]) : 'baris atas ' + nm(kunci[0]) + '; baris bawah ' + nm(kunci[1])))) + '.');

      var opsiGambar = daftar.map(function (d, i) {
        return { teks: 'Gambar opsi ' + Fmt.huruf(i), nilai: i, alasan: d.alasan, kunci: d.kunci,
          gambar: { id: 'opsi-' + Fmt.huruf(i).toLowerCase(), jenis: 'latin-opsi', model: { isi: d.isi }, judul: 'Opsi ' + Fmt.huruf(i) } };
      });
      var ctx = { subtes: 'ku', submateri: 'figural', keluarga: id, level: level, benih: benih, a: a };
      return Butir.rakitPg(ctx, {
        jenisSoal: 'Figural Matriks - Kotak 5x5',
        judul: 'Figural Matriks - Kotak 5x5', teks: [], pertanyaan: '', perintah: PERINTAH,
        gambar: [{ id: 'soal', jenis: 'latin', model: { grid: tampak, lubang: l }, judul: 'Matriks 5x5' }],
        pilihanJadi: { opsi: opsiGambar, kunciIndex: target }, tulisKunci: false,
        langkah: [], pembahasan: pem,
        model: {
          topik: 'Figural', tipe: 'matriks-latin', grid: tampak, lubang: l,
          pilihan: daftar.map(function (d) { return d.isi; }), kunciIndex: target
        },
        sidik: { inti: 'matriks-latin|' + g.map(function (row) { return row.join(''); }).join('/') + '|' + l.r + l.c + l.h + l.w, param: [], entitas: 'latin' }
      });
    }
    return null;
  }

  var KELUARGA = [{ id: 'matriks-latin', nama: 'Matriks 5x5 (lima bentuk, berbeda tiap baris dan kolom)', submateri: 'figural' }];

  return { KELUARGA: KELUARGA, BENTUK: BENTUK, PERINTAH: PERINTAH, buat: buat, svgMatriks: svgMatriks, svgPotongan: svgPotongan };
});
