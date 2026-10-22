/*
 * matriks-tumpuk.js — Kemampuan Umum > Figural > Kotak 3x3: kotak ketiga hasil penumpukan
 * (superposisi) dua kotak lainnya.
 *
 * Setiap kotak memakai kerangka tetap: sembilan titik bantu (3 x 3). Unsur sebuah kotak adalah
 * himpunan bagian dari unsur kerangka itu:
 *   garis    ruas antartitik bantu: 6 mendatar, 6 tegak, 8 miring (diagonal tiap petak) = 20 ruas;
 *            satu soal memakai kerangka lurus (12 ruas), penuh (20), atau tepi (sisi luar + miring, 16)
 *   titik    titik hitam pada titik bantu (9 letak)
 *   bulat    lingkaran putih pada titik bantu
 *   silang   tanda silang pada titik bantu (hanya bila kotak tidak berisi ruas garis)
 * Dua jenis simbol dalam satu soal selalu menempati letak yang berbeda (letaknya dibagi), jadi
 * satu titik bantu tidak pernah memuat dua simbol.
 *
 * Aturan per BARIS (kiri ke kanan) atau per KOLOM (atas ke bawah), untuk tiap jenis unsur:
 *   gabung   kotak 3 = kotak 1 ∪ kotak 2 (yang sama cukup digambar sekali)
 *   selisih  kotak 3 = selisih simetris (yang ada di kedua kotak hilang, yang berbeda tetap)
 *   irisan   kotak 3 = hanya yang ada di kedua kotak
 *   kurang   kotak 3 = kotak 1 dikurangi kotak 2
 *
 * Tingkat:
 *   mudah   ruas garis digabung per baris, "?" di kotak kanan bawah (kerangka lurus atau dengan
 *           ruas miring)
 *   sedang  selisih, irisan, pengurangan, atau gabung per kolom; ruas garis atau simbol; "?" di
 *           kotak ketiga baris/kolom mana pun
 *   sulit   dua jenis unsur dengan aturan berbeda dalam satu kotak (ruas garis + simbol, atau dua
 *           jenis simbol), atau "?" di kotak pertama/kedua sehingga aturannya harus dibalik
 *           (selisih simetris; gabungan tanpa unsur bersama; pengurangan yang selalu mengambil
 *           bagian kotak pertama)
 *
 * Penyusun hanya memakai matriks yang aturannya terbaca dari kedua baris/kolom lengkap: dari
 * pustaka aturan (gabung, irisan, selisih, kurang, kurang terbalik; hasil di kotak mana pun; per
 * baris dan per kolom; tiap jenis unsur), setiap aturan yang cocok dengan kedua baris/kolom
 * lengkap harus meramalkan isi "?" yang sama (atau menyisakan jawaban itu sebagai salah satu
 * kemungkinan), dan sedikitnya satu aturan meramalkan isi itu secara tunggal.
 *
 * Pengecoh: aturan lain (mis. gabung alih-alih selisih), satu unsur kurang atau lebih, kotak
 * baris/kolom sendiri atau kotak tetangga disalin, satu jenis unsur memakai aturan jenis lain,
 * atau pembalikan aturan yang keliru.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./rng.js'), require('./svg.js'), require('./butir.js'), require('./format.js'), require('./metrik.js'));
    module.exports = api;
  } else {
    api = factory(root.Rng, root.Svg, root.Butir, root.Fmt, root.Metrik);
    root.MatriksTumpuk = api;
  }
})(typeof self !== 'undefined' ? self : this, function (Rng, S, Butir, Fmt, Metrik) {
  'use strict';

  var ID = 'matriks-tumpuk';
  var PERINTAH = 'Gunakan gambar di bagian atas untuk menentukan jawaban yang benar dari pilihan di bawah. Pilih jawaban yang menggantikan tanda tanya. Jika tidak ada tanda tanya, pilih jawaban yang merupakan kelanjutan dari urutan tersebut.';
  var JENIS_SOAL = 'Figural Matriks - Kotak 3x3 (penumpukan gambar)';
  var CATATAN = 'Bentuk penumpukan gambar (gabungan, selisih, irisan, pengurangan unsur) untuk bab Figural Matriks - Kotak 3x3 di Kerangka Course; tidak ada pada contoh riset BAB V.';

  var KANAL = ['garis', 'titik', 'bulat', 'silang'];
  var SIMBOL = ['titik', 'bulat', 'silang'];
  var UNSUR = { garis: 'ruas garis', titik: 'titik hitam', bulat: 'lingkaran putih', silang: 'tanda silang' };
  var SEMESTA = { garis: (1 << 20) - 1, titik: 511, bulat: 511, silang: 511 };
  // kerangka ruas: lurus (mendatar dan tegak), penuh (ditambah miring), tepi (sisi luar dan miring, tanpa garis tengah)
  var KISI = { lurus: urutan(12), penuh: urutan(20), tepi: [0, 1, 4, 5, 6, 7, 10, 11].concat(urutan(20).slice(12)) };
  var POSISI = ['kiri atas', 'tengah atas', 'kanan atas', 'kiri tengah', 'pusat', 'kanan tengah', 'kiri bawah', 'tengah bawah', 'kanan bawah'];
  var OPS = ['gabung', 'irisan', 'selisih', 'kurang', 'kurangBalik'];
  var LETAK = { baris: ['kiri', 'tengah', 'kanan'], kolom: ['atas', 'tengah', 'bawah'] };

  /** Mekanisme per tingkat (awal `pola` sesudah "matriks-tumpuk:"). */
  var KELOMPOK = {
    mudah: ['gabung-lurus', 'gabung-miring'],
    sedang: ['selisih-baris', 'selisih-kolom', 'irisan-baris', 'irisan-kolom', 'gabung-kolom', 'kurang-baris', 'kurang-kolom'],
    sulit: ['dua-unsur', 'dua-simbol', 'balik-selisih', 'balik-gabung', 'balik-kurang']
  };

  function urutan(n) { var d = []; for (var i = 0; i < n; i++) d.push(i); return d; }

  // ------------------------------------------------------------------ himpunan (bit)

  function cacah(x) { var n = 0; while (x) { x &= x - 1; n++; } return n; }
  function anggota(x) { var d = []; for (var i = 0; x >>> i; i++) if ((x >>> i) & 1) d.push(i); return d; }

  function terap(o, p, q) {
    if (o === 'gabung') return p | q;
    if (o === 'irisan') return p & q;
    if (o === 'selisih') return p ^ q;
    if (o === 'kurang') return p & ~q;
    return q & ~p;                                    // kurangBalik
  }

  /** Tiga kotak satu baris (i) atau satu kolom (i). */
  function garisan(G, arah, i) { return arah === 'baris' ? [G[i][0], G[i][1], G[i][2]] : [G[0][i], G[1][i], G[2][i]]; }
  /** Letak [baris, kolom] kotak ke-j pada garisan ke-i. */
  function letak(arah, i, j) { return arah === 'baris' ? [i, j] : [j, i]; }

  function keFig(sel, kanal) {
    var f = {};
    KANAL.forEach(function (ch) { if (kanal.indexOf(ch) >= 0) f[ch] = anggota(sel[ch]); });
    return f;
  }
  function sidikSel(sel, kanal) { return kanal.map(function (ch) { return ch.charAt(0) + anggota(sel[ch]).join('.'); }).join('|'); }
  function salinSel(sel) { var o = {}; Object.keys(sel).forEach(function (k) { o[k] = sel[k]; }); return o; }

  // ------------------------------------------------------- pembaca aturan (penyusun)

  /** Operan kotak ke-k: dua indeks lainnya, berurutan. */
  function operan(k) { return k === 0 ? [1, 2] : (k === 1 ? [0, 2] : [0, 1]); }

  /**
   * Rentang isi kotak ke-j (yang hilang) menurut aturan x_k = o(x_p, x_q) pada garisan L:
   * [bawah, atas] (semua himpunan X dengan bawah ⊆ X ⊆ atas memenuhi), atau null bila mustahil.
   */
  function rentang(o, k, L, j, U) {
    var pq = operan(k), p = pq[0], q = pq[1];
    if (j === k) { var v = terap(o, L[p], L[q]); return [v, v]; }
    var r = L[k], lain = j === p ? L[q] : L[p];
    if (o === 'gabung') return (lain & ~r) ? null : [r & ~lain, r];
    if (o === 'irisan') return (r & ~lain) ? null : [r, U & ~(lain & ~r)];
    if (o === 'selisih') { var w = lain ^ r; return [w, w]; }
    if (o === 'kurang') {                              // x_k = x_p \ x_q
      if (j === p) return (r & L[q]) ? null : [r, r | L[q]];
      return (r & ~L[p]) ? null : [L[p] & ~r, U & ~r];
    }
    if (j === q) return (r & L[p]) ? null : [r, r | L[p]];   // x_k = x_q \ x_p
    return (r & ~L[q]) ? null : [L[q] & ~r, U & ~r];
  }

  /**
   * Ramalan isi "?" untuk satu jenis unsur dari seluruh pustaka aturan yang cocok dengan kedua
   * baris/kolom lengkap (per baris dan per kolom). Aturan yang mustahil pada garisan "?" dibuang.
   */
  function ramal(G, mr, mc, ch, U) {
    var bawah = 0, atas = U, ada = 0, daftar = [];
    ['baris', 'kolom'].forEach(function (arah) {
      var h = arah === 'baris' ? mr : mc, j = arah === 'baris' ? mc : mr;
      var gs = [0, 1, 2].map(function (i) { return garisan(G, arah, i).map(function (c) { return c ? c[ch] : 0; }); });
      OPS.forEach(function (o) {
        for (var k = 0; k < 3; k++) {
          var pq = operan(k), ok = true;
          for (var i = 0; i < 3 && ok; i++) if (i !== h && gs[i][k] !== terap(o, gs[i][pq[0]], gs[i][pq[1]])) ok = false;
          if (!ok) continue;
          var iv = rentang(o, k, gs[h], j, U);
          if (!iv) continue;
          ada++; bawah |= iv[0]; atas &= iv[1];
          daftar.push(iv);
        }
      });
    });
    if (!ada) return null;
    var tunggal = !(bawah & ~atas) && bawah === atas;
    return { nilai: bawah, tunggal: tunggal, langsung: tunggal && daftar.some(function (iv) { return iv[0] === iv[1] && iv[0] === bawah; }) };
  }

  /** Aturan kotak ketiga (hasil di kotak ke-3) yang cocok dengan kedua garisan lengkap. */
  function opsCocok(G, arah, h, ch) {
    return OPS.filter(function (o) {
      return [0, 1, 2].every(function (i) { if (i === h) return true; var L = garisan(G, arah, i); return L[2][ch] === terap(o, L[0][ch], L[1][ch]); });
    });
  }

  // ------------------------------------------------------------------ rencana soal

  /** Banyak unsur bersama (s), hanya di kotak 1 (na), hanya di kotak 2 (nb) per garisan. */
  function takaran(op, jenis, varian) {
    if (jenis === 'garis') {
      if (op === 'gabung') return varian === 'pisah' ? { s: [0, 0], na: [2, 4], nb: [2, 3] } : (varian === 'tumpang' ? { s: [1, 2], na: [2, 3], nb: [2, 3] } : { s: [0, 2], na: [2, 3], nb: [2, 3] });
      if (op === 'selisih') return { s: [1, 3], na: [1, 3], nb: [1, 3] };
      if (op === 'irisan') return { s: [2, 3], na: [1, 3], nb: [1, 3] };
      return varian === 'bagian' ? { s: [2, 3], na: [2, 4], nb: [0, 0] } : { s: [1, 3], na: [2, 3], nb: [1, 2] };
    }
    if (op === 'gabung') return { s: [1, 1], na: [1, 2], nb: [1, 2] };
    if (op === 'kurang') return { s: [1, 2], na: [1, 2], nb: [1, 1] };
    return { s: [1, 2], na: [1, 2], nb: [1, 2] };
  }

  function urutKanal(d) { return KANAL.filter(function (ch) { return d.indexOf(ch) >= 0; }); }

  /** Dua jenis simbol: sembilan letak dibagi supaya tidak pernah bertumpuk. */
  function bagiLetak(a, p, dua) {
    var d = a.kocok(urutan(9)), n = a.bulat(4, 5);
    p.uni[dua[0]] = d.slice(0, n).sort(function (x, y) { return x - y; });
    p.uni[dua[1]] = d.slice(n).sort(function (x, y) { return x - y; });
  }

  function rencana(a, level, fam) {
    var p = { fam: fam, kanal: ['garis'], aturan: {}, takar: {}, izin: {}, uni: {}, arah: 'baris', h: 2, j: 2, kisi: null };
    var kisi = function (nama) { p.kisi = nama; p.uni.garis = KISI[nama]; };
    var kisiAcak = function () { return a.bobot(['lurus', 'penuh', 'tepi'], [35, 45, 20]); };
    if (level === 'mudah') {
      kisi(fam === 'gabung-lurus' ? 'lurus' : (a.untung(0.3) ? 'tepi' : 'penuh'));
      p.aturan.garis = 'gabung'; p.takar.garis = takaran('gabung', 'garis'); p.izin.garis = ['gabung', 'selisih'];
      p.pola = fam;
      return p;
    }
    if (level === 'sedang') {
      var bag = fam.split('-'), op = bag[0];
      p.arah = bag[1]; p.h = a.bulat(0, 2); p.j = 2;
      var simbol = a.untung(0.3);
      if (simbol) {
        if (a.untung(0.55)) { p.kanal = [a.pilih(SIMBOL)]; p.uni[p.kanal[0]] = urutan(9); }
        else { p.kanal = urutKanal(a.ambil(SIMBOL, 2)); bagiLetak(a, p, p.kanal); }
      } else kisi(kisiAcak());
      p.kanal.forEach(function (ch) {
        p.aturan[ch] = op; p.izin[ch] = [op];
        p.takar[ch] = takaran(op, ch === 'garis' ? 'garis' : 'simbol', op === 'gabung' ? 'tumpang' : null);
      });
      p.pola = fam + (simbol ? '-simbol' : '');
      return p;
    }
    // sulit
    p.arah = a.pilih(['baris', 'kolom']); p.h = a.bulat(0, 2);
    if (fam === 'dua-unsur' || fam === 'dua-simbol') {
      var ops = a.ambil(['gabung', 'selisih', 'irisan', 'kurang'], 2);
      if (fam === 'dua-unsur') {
        var t = a.pilih(['titik', 'bulat']);
        kisi(kisiAcak());
        p.kanal = ['garis', t]; p.uni[t] = urutan(9);
      } else {
        p.kanal = urutKanal(a.ambil(SIMBOL, 2)); bagiLetak(a, p, p.kanal);
      }
      p.kanal.forEach(function (ch, i) {
        p.aturan[ch] = ops[i]; p.izin[ch] = [ops[i]];
        p.takar[ch] = takaran(ops[i], ch === 'garis' ? 'garis' : 'simbol', ops[i] === 'gabung' ? 'tumpang' : null);
      });
      p.pola = fam + '-' + ops.join('-');
      return p;
    }
    p.j = a.bulat(0, 1);
    kisi(kisiAcak());
    if (fam === 'balik-selisih') {
      if (a.untung(0.35)) { p.kanal = ['garis', 'titik']; p.uni.titik = urutan(9); }
      p.kanal.forEach(function (ch) { p.aturan[ch] = 'selisih'; p.izin[ch] = ['selisih']; p.takar[ch] = takaran('selisih', ch === 'garis' ? 'garis' : 'simbol'); });
    } else if (fam === 'balik-gabung') {
      p.aturan.garis = 'gabung'; p.izin.garis = ['gabung', 'selisih']; p.takar.garis = takaran('gabung', 'garis', 'pisah');
    } else {
      p.aturan.garis = 'kurang'; p.izin.garis = ['kurang', 'selisih']; p.takar.garis = takaran('kurang', 'garis', 'bagian');
    }
    p.pola = fam + '-' + p.arah;
    return p;
  }

  /** Satu pasangan kotak 1 dan kotak 2 untuk satu jenis unsur. */
  function pasangan(a, uni, tk) {
    var d = a.kocok(uni), s = a.bulat(tk.s[0], tk.s[1]), na = a.bulat(tk.na[0], tk.na[1]), nb = a.bulat(tk.nb[0], tk.nb[1]);
    if (s + na + nb > d.length) return null;
    var A = 0, B = 0, i = 0, k;
    for (k = 0; k < s; k++, i++) { A |= 1 << d[i]; B |= 1 << d[i]; }
    for (k = 0; k < na; k++, i++) A |= 1 << d[i];
    for (k = 0; k < nb; k++, i++) B |= 1 << d[i];
    return { A: A, B: B };
  }

  function isiGrid(a, p) {
    var G = [0, 1, 2].map(function () { return [{}, {}, {}]; });
    for (var i = 0; i < 3; i++) {
      for (var c = 0; c < p.kanal.length; c++) {
        var ch = p.kanal[c], pr = null;
        for (var t = 0; t < 8 && !pr; t++) pr = pasangan(a, p.uni[ch], p.takar[ch]);
        if (!pr) return null;
        var tri = [pr.A, pr.B, terap(p.aturan[ch], pr.A, pr.B)];
        for (var k = 0; k < 3; k++) { var x = letak(p.arah, i, k); G[x[0]][x[1]][ch] = tri[k]; }
      }
    }
    return G;
  }

  function denganLubang(G, mr, mc) { return G.map(function (row, r) { return row.map(function (x, c) { return r === mr && c === mc ? null : x; }); }); }

  function layak(p, G, mr, mc, kunci) {
    var lihat = {}, r, c;
    for (r = 0; r < 3; r++) {
      for (c = 0; c < 3; c++) {
        var sd = sidikSel(G[r][c], p.kanal);
        if (lihat[sd]) return false;
        lihat[sd] = 1;
        for (var k = 0; k < p.kanal.length; k++) {
          var n = cacah(G[r][c][p.kanal[k]]);
          if (n < 1 || n > (p.kanal[k] === 'garis' ? 9 : 5)) return false;
        }
      }
    }
    var Gh = denganLubang(G, mr, mc);
    return p.kanal.every(function (ch) {
      var cocok = opsCocok(G, p.arah, p.h, ch);
      if (cocok.indexOf(p.aturan[ch]) < 0 || cocok.some(function (o) { return p.izin[ch].indexOf(o) < 0; })) return false;
      var rm = ramal(Gh, mr, mc, ch, SEMESTA[ch]);
      return rm && rm.tunggal && rm.langsung && rm.nilai === kunci[ch];
    });
  }

  // ------------------------------------------------------------------ nama unsur

  function namaRuas(id) {
    if (id < 6) return 'ruas mendatar ' + ['atas', 'tengah', 'bawah'][Math.floor(id / 2)] + ' bagian ' + ['kiri', 'kanan'][id % 2];
    if (id < 12) { var k = id - 6; return 'ruas tegak ' + ['kiri', 'tengah', 'kanan'][Math.floor(k / 2)] + ' bagian ' + ['atas', 'bawah'][k % 2]; }
    var d = id - 12;
    return 'ruas miring ' + (d % 2 ? 'naik' : 'turun') + ' di petak ' + ['kiri atas', 'kanan atas', 'kiri bawah', 'kanan bawah'][Math.floor(d / 2)];
  }
  function namaUnsur(ch, e) { return ch === 'garis' ? namaRuas(e) : UNSUR[ch] + ' di ' + POSISI[e]; }

  /** Uraian isi sebuah kotak dengan kata. */
  function uraiIsi(sel, kanal) {
    var bag = [];
    kanal.forEach(function (ch) {
      var d = anggota(sel[ch]);
      if (!d.length) return;
      if (ch === 'garis') {
        var n = [0, 0, 0];
        d.forEach(function (id) { n[id < 6 ? 0 : (id < 12 ? 1 : 2)]++; });
        var rinci = [[n[0], 'mendatar'], [n[1], 'tegak'], [n[2], 'miring']].filter(function (x) { return x[0]; });
        bag.push(d.length + ' ruas garis ' + (rinci.length > 1 ? '(' + rinci.map(function (x) { return x[0] + ' ' + x[1]; }).join(', ') + ')' : rinci[0][1]));
      } else bag.push(d.length + ' ' + UNSUR[ch] + ' (di ' + Fmt.daftarKata(d.map(function (e) { return POSISI[e]; })) + ')');
    });
    return Fmt.daftarKata(bag);
  }

  var NAMA_OP = {
    gabung: 'gabung (semua unsur kedua kotak digambar)', selisih: 'selisih (unsur yang sama hilang)', irisan: 'irisan (hanya unsur yang sama tetap)',
    kurang: 'pengurangan (kotak pertama dikurangi kotak kedua)', kurangBalik: 'pengurangan terbalik (kotak kedua dikurangi kotak pertama)'
  };
  var RINGKAS_OP = { gabung: 'semua digabung', selisih: 'yang sama hilang', irisan: 'hanya yang sama tetap', kurang: 'kotak pertama dikurangi kotak kedua' };
  var ALT = {
    gabung: ['selisih', 'irisan', 'kurang', 'kurangBalik'], selisih: ['gabung', 'irisan', 'kurang', 'kurangBalik'],
    irisan: ['selisih', 'gabung', 'kurang', 'kurangBalik'], kurang: ['selisih', 'kurangBalik', 'irisan', 'gabung']
  };

  // ------------------------------------------------------------------ pengecoh

  function alasanAturan(o, o2, kanal, nm) {
    var u = kanal.length > 1 ? 'unsur' : UNSUR[kanal[0]];
    var khusus = {
      'selisih>gabung': u + ' yang ada di kedua kotak tidak dihapus, padahal pada baris/kolom contoh ' + u + ' yang sama hilang',
      'gabung>selisih': u + ' yang ada di kedua kotak ikut dihapus, padahal pada baris/kolom contoh semua ' + u + ' tetap digambar',
      'irisan>selisih': 'yang digambar justru ' + u + ' yang hanya ada di salah satu kotak, padahal yang tetap adalah ' + u + ' yang ada di kedua kotak',
      'irisan>gabung': 'semua ' + u + ' digabung, padahal hanya ' + u + ' yang ada di kedua kotak yang tetap',
      'kurang>selisih': u + ' yang hanya ada di kotak ' + nm[1] + ' ikut digambar, padahal pengurangan hanya menyisakan ' + u + ' kotak ' + nm[0],
      'kurang>kurangBalik': 'urutan pengurangan terbalik: kotak ' + nm[1] + ' dikurangi kotak ' + nm[0] + ', padahal kotak ' + nm[0] + ' yang dikurangi kotak ' + nm[1]
    }[o + '>' + o2];
    return 'Memakai aturan ' + NAMA_OP[o2] + ' alih-alih aturan ' + NAMA_OP[o] + (khusus ? '; ' + khusus : '') + '.';
  }

  /** Tetangga kotak "?" pada garisan sebelah (letak sama di baris/kolom sebelahnya). */
  function tetangga(a, p, G) {
    var h2 = p.h === 0 ? 1 : (p.h === 2 ? 1 : a.pilih([0, 2])), x = letak(p.arah, h2, p.j);
    return { sel: G[x[0]][x[1]], ket: 'kotak ' + LETAK[p.arah][p.j] + ' pada ' + (p.arah === 'baris' ? 'baris ' : 'kolom ') + (h2 + 1) };
  }

  function calonPengecoh(a, p, G, kunci) {
    var L = garisan(G, p.arah, p.h), nm = LETAK[p.arah], j = p.j, cal = [];
    var label = (p.arah === 'baris' ? 'baris ' : 'kolom ') + (p.h + 1);
    var tambah = function (jenis, sel, alasan) { cal.push({ jenis: jenis, sel: sel, alasan: alasan }); };
    var peta = function (fn) { var s = {}; p.kanal.forEach(function (ch) { s[ch] = fn(ch); }); return s; };
    var opsK = p.kanal.map(function (ch) { return p.aturan[ch]; });
    var A = L[0], B = L[1], R = L[2], Q = L[1 - j];
    if (j === 2) {
      if (opsK.every(function (o) { return o === opsK[0]; })) {
        ALT[opsK[0]].forEach(function (o2) { tambah('aturan-' + o2, peta(function (ch) { return terap(o2, A[ch], B[ch]); }), alasanAturan(opsK[0], o2, p.kanal, nm)); });
      } else {
        var c1 = p.kanal[0], c2 = p.kanal[1], o1 = p.aturan[c1], o2 = p.aturan[c2];
        var s1 = {}; s1[c1] = kunci[c1]; s1[c2] = terap(o1, A[c2], B[c2]);
        tambah('kanal-salah', s1, Fmt.kapital(UNSUR[c1]) + ' sudah benar, tetapi ' + UNSUR[c2] + ' ikut memakai aturan ' + NAMA_OP[o1] + ' milik ' + UNSUR[c1] + ', padahal ' + UNSUR[c2] + ' mengikuti aturan ' + NAMA_OP[o2] + '.');
        var s2 = {}; s2[c1] = terap(o2, A[c1], B[c1]); s2[c2] = kunci[c2];
        tambah('kanal-salah', s2, Fmt.kapital(UNSUR[c2]) + ' sudah benar, tetapi ' + UNSUR[c1] + ' ikut memakai aturan ' + NAMA_OP[o2] + ' milik ' + UNSUR[c2] + ', padahal ' + UNSUR[c1] + ' mengikuti aturan ' + NAMA_OP[o1] + '.');
        var s3 = {}; s3[c1] = s2[c1]; s3[c2] = s1[c2];
        tambah('tukar-aturan', s3, 'Aturan kedua jenis unsur tertukar: ' + UNSUR[c1] + ' memakai aturan ' + NAMA_OP[o2] + ' dan ' + UNSUR[c2] + ' memakai aturan ' + NAMA_OP[o1] + '.');
        p.kanal.forEach(function (ch) {
          var o3 = ALT[p.aturan[ch]].filter(function (x) { return x !== o1 && x !== o2; })[0], s4 = salinSel(kunci);
          s4[ch] = terap(o3, A[ch], B[ch]);
          tambah('kanal-lain', s4, Fmt.kapital(UNSUR[ch]) + ' memakai aturan ' + NAMA_OP[o3] + ', padahal ' + UNSUR[ch] + ' mengikuti aturan ' + NAMA_OP[p.aturan[ch]] + '.');
        });
      }
      tambah('salin-1', salinSel(A), 'Hanya menyalin kotak ' + nm[0] + ' pada ' + label + ' tanpa menerapkan aturan penumpukan.');
      tambah('salin-2', salinSel(B), 'Hanya menyalin kotak ' + nm[1] + ' pada ' + label + ' tanpa menerapkan aturan penumpukan.');
    } else {
      var pj = nm[j], po = nm[1 - j];
      if (p.fam === 'balik-selisih') {
        tambah('balik-kurang', peta(function (ch) { return R[ch] & ~Q[ch]; }), 'Hanya menghapus unsur kotak ' + po + ' dari kotak ' + nm[2] + '; unsur kotak ' + po + ' yang tidak ada di kotak ' + nm[2] + ' seharusnya ada di kotak ' + pj + ' karena unsur yang sama saling menghapus.');
        tambah('balik-gabung', peta(function (ch) { return R[ch] | Q[ch]; }), 'Menggabungkan kotak ' + po + ' dan kotak ' + nm[2] + '; unsur yang ada di keduanya seharusnya hilang.');
        tambah('balik-irisan', peta(function (ch) { return R[ch] & Q[ch]; }), 'Hanya mengambil unsur yang ada di kotak ' + po + ' dan kotak ' + nm[2] + ', padahal justru unsur itu yang hilang.');
      }
      tambah('salin-hasil', salinSel(R), 'Menyalin kotak ' + nm[2] + ' (hasil penumpukan), padahal yang ditanyakan adalah kotak ' + pj + '.');
      tambah('salin-pasangan', salinSel(Q), 'Menyalin kotak ' + po + ' pada ' + label + ', padahal yang ditanyakan adalah kotak ' + pj + '.');
    }
    // satu unsur kurang atau lebih
    var urutK = a.kocok(p.kanal.slice());
    urutK.forEach(function (ch) {
      var d = a.kocok(anggota(kunci[ch]));
      d.slice(0, 2).forEach(function (e) {
        var s = salinSel(kunci); s[ch] &= ~(1 << e);
        tambah('kurang-satu', s, 'Kurang satu ' + UNSUR[ch] + ': ' + namaUnsur(ch, e) + ' seharusnya ada menurut aturan.');
      });
      var dekat = 0;
      if (j === 2) dekat = (A[ch] | B[ch]) & ~kunci[ch];
      else if (p.fam === 'balik-gabung' || (p.fam === 'balik-kurang' && j === 1)) dekat = (p.fam === 'balik-gabung' ? Q[ch] : R[ch]) & ~kunci[ch];
      else dekat = (Q[ch] | R[ch]) & ~kunci[ch];
      var pakai = 0;
      p.uni[ch].forEach(function (e) { if (!((kunci[ch] >>> e) & 1)) pakai |= 1 << e; });
      var calon = a.kocok(anggota(dekat)).concat(a.kocok(anggota(pakai & ~dekat)));
      calon.slice(0, 2).forEach(function (e) {
        var s = salinSel(kunci); s[ch] |= 1 << e;
        var asal = (dekat >>> e) & 1 ? ' yang berasal dari kotak lain pada ' + label + ' tetapi seharusnya tidak muncul menurut aturan' : ' yang tidak berasal dari kotak mana pun pada ' + label;
        tambah('lebih-satu', s, 'Ada satu ' + UNSUR[ch] + ' tambahan (' + namaUnsur(ch, e) + ')' + asal + '.');
      });
    });
    var tg = tetangga(a, p, G);
    tambah('salin-tetangga', salinSel(tg.sel), 'Menyalin ' + tg.ket + ' (kotak di sebelahnya), bukan hasil aturan pada ' + label + '.');
    return cal;
  }

  function urutPengecoh(a, level, p) {
    var awal, sisa;
    if (p.j !== 2) {
      if (p.fam === 'balik-selisih') { awal = ['balik-kurang', 'balik-gabung', 'salin-hasil', 'kurang-satu']; sisa = ['lebih-satu', 'salin-tetangga', 'balik-irisan', 'salin-pasangan', 'lebih-satu', 'kurang-satu']; }
      else { awal = ['salin-hasil', 'lebih-satu', 'kurang-satu', 'salin-tetangga']; sisa = ['salin-pasangan', 'lebih-satu', 'kurang-satu']; }
    } else if (p.fam === 'dua-unsur' || p.fam === 'dua-simbol') {
      awal = ['kanal-salah', 'kanal-salah', 'tukar-aturan', 'kurang-satu']; sisa = ['lebih-satu', 'kanal-lain', 'salin-tetangga', 'kanal-lain', 'salin-1', 'salin-2', 'lebih-satu'];
    } else if (level === 'mudah') {
      awal = ['kurang-satu', 'aturan-selisih', 'lebih-satu', 'salin-tetangga']; sisa = ['salin-1', 'salin-2', 'aturan-kurang', 'aturan-irisan', 'kurang-satu', 'lebih-satu'];
    } else {
      var alt = ALT[p.aturan[p.kanal[0]]];
      awal = ['aturan-' + alt[0], 'kurang-satu', 'lebih-satu', 'salin-tetangga']; sisa = ['aturan-' + alt[1], 'salin-1', 'salin-2', 'aturan-' + alt[2], 'kurang-satu', 'lebih-satu', 'aturan-' + alt[3]];
    }
    return a.kocok(awal).concat(sisa);
  }

  function pilihPengecoh(a, level, p, G, kunci) {
    var cal = calonPengecoh(a, p, G, kunci), urut = urutPengecoh(a, level, p), lihat = {}, hasil = [], dipakai = [];
    lihat[sidikSel(kunci, p.kanal)] = 1;
    var sah = function (c) {
      return p.kanal.every(function (ch) { var n = cacah(c.sel[ch]); return n >= 1 && n <= (ch === 'garis' ? 10 : 6); });
    };
    var ambil = function (i) {
      var c = cal[i], sd = sidikSel(c.sel, p.kanal);
      dipakai[i] = true;
      if (lihat[sd] || !sah(c)) return;
      lihat[sd] = 1;
      hasil.push(c);
    };
    urut.forEach(function (jenis) {
      if (hasil.length >= 4) return;
      for (var i = 0; i < cal.length; i++) {
        if (dipakai[i] || cal[i].jenis !== jenis) continue;
        var n = hasil.length;
        ambil(i);
        if (hasil.length > n) return;
      }
    });
    for (var i = 0; i < cal.length && hasil.length < 4; i++) if (!dipakai[i]) ambil(i);
    return hasil.length === 4 ? hasil : null;
  }

  // ------------------------------------------------------------------ pembahasan

  function namaGarisan(arah, i) { return (arah === 'baris' ? 'baris ' : 'kolom ') + (i + 1); }

  function kalimatAturan(p, ch, u) {
    u = u || UNSUR[ch];
    var nm = LETAK[p.arah], op = p.aturan[ch];
    if (p.fam === 'balik-gabung') return 'kotak ' + nm[2] + ' adalah gabungan kotak ' + nm[0] + ' dan kotak ' + nm[1] + ', dan kedua kotak itu tidak pernah memiliki ' + u + ' yang sama, sehingga setiap ' + u + ' di kotak ' + nm[2] + ' berasal dari tepat satu kotak';
    if (p.fam === 'balik-kurang') return 'kotak ' + nm[2] + ' adalah kotak ' + nm[0] + ' dikurangi kotak ' + nm[1] + ': semua ' + u + ' kotak ' + nm[1] + ' selalu ada di kotak ' + nm[0] + ' dan dihapus dari sana, sehingga kotak ' + nm[2] + ' berisi sisanya';
    if (op === 'gabung') return 'kotak ' + nm[2] + ' adalah gabungan kotak ' + nm[0] + ' dan kotak ' + nm[1] + ': semua ' + u + ' dari kedua kotak digambar, dan ' + u + ' yang ada di kedua kotak cukup digambar sekali';
    if (op === 'selisih') return 'kotak ' + nm[0] + ' dan kotak ' + nm[1] + ' ditumpuk; ' + u + ' yang ada di kedua kotak saling menghapus (hilang), sedangkan ' + u + ' yang hanya ada di salah satu kotak tetap digambar di kotak ' + nm[2];
    if (op === 'irisan') return 'kotak ' + nm[2] + ' hanya memuat ' + u + ' yang ada di kotak ' + nm[0] + ' dan juga ada di kotak ' + nm[1] + '; ' + u + ' yang hanya ada di salah satu kotak hilang';
    return 'kotak ' + nm[2] + ' adalah kotak ' + nm[0] + ' dikurangi kotak ' + nm[1] + ': ' + u + ' kotak ' + nm[0] + ' yang juga ada di kotak ' + nm[1] + ' dihapus, dan ' + u + ' yang hanya ada di kotak ' + nm[1] + ' tidak ikut digambar';
  }

  /** Klausa hitungan penerapan aturan maju pada satu garisan (kotak 1, kotak 2 -> kotak 3). */
  function uraiMaju(p, ch, L) {
    var u = UNSUR[ch], nm = LETAK[p.arah], A = L[0][ch], B = L[1][ch], C = L[2][ch], op = p.aturan[ch];
    var s = cacah(A & B), a1 = cacah(A & ~B), b1 = cacah(B & ~A), c = cacah(C);
    var awal = 'kotak ' + nm[0] + ' memiliki ' + cacah(A) + ' ' + u + ' dan kotak ' + nm[1] + ' memiliki ' + cacah(B) + ' ' + u;
    if (op === 'gabung') return awal + (s ? ', ' + s + ' di antaranya sama' : ' tanpa ada yang sama') + '; semuanya digambar' + (s ? ' (yang sama cukup sekali)' : '') + ', jadi kotak ' + nm[2] + ' berisi ' + c + ' ' + u;
    if (op === 'selisih') return awal + '; ' + s + ' ' + u + ' yang sama hilang, jadi kotak ' + nm[2] + ' berisi ' + c + ' ' + u + ' (' + a1 + ' hanya dari kotak ' + nm[0] + ' dan ' + b1 + ' hanya dari kotak ' + nm[1] + ')';
    if (op === 'irisan') return awal + '; hanya ' + s + ' ' + u + ' yang ada di kedua kotak yang tetap, jadi kotak ' + nm[2] + ' berisi ' + c + ' ' + u;
    return awal + '; ' + s + ' ' + u + ' kotak ' + nm[0] + ' yang juga ada di kotak ' + nm[1] + ' dihapus' + (b1 ? ' dan ' + b1 + ' ' + u + ' yang hanya ada di kotak ' + nm[1] + ' tidak digambar' : '') + ', jadi kotak ' + nm[2] + ' berisi ' + c + ' ' + u;
  }

  /** Klausa pembalikan aturan pada garisan "?" (kotak ke-j dicari). */
  function uraiBalik(p, ch, L) {
    var u = UNSUR[ch], nm = LETAK[p.arah], j = p.j, Q = L[1 - j][ch], R = L[2][ch], X = L[j][ch];
    var pj = nm[j], po = nm[1 - j];
    if (p.fam === 'balik-selisih') return 'kotak ' + po + ' memiliki ' + cacah(Q) + ' ' + u + ' dan kotak ' + nm[2] + ' memiliki ' + cacah(R) + ' ' + u + '; ' + cacah(Q & R) + ' ' + u + ' yang sama hilang, jadi kotak ' + pj + ' berisi ' + cacah(X) + ' ' + u;
    if (p.fam === 'balik-gabung') return 'dari ' + cacah(R) + ' ' + u + ' di kotak ' + nm[2] + ', ' + cacah(Q) + ' ' + u + ' milik kotak ' + po + ' dihapus, jadi kotak ' + pj + ' berisi ' + cacah(X) + ' ' + u + ' sisanya';
    if (j === 0) return 'kotak ' + nm[1] + ' memiliki ' + cacah(Q) + ' ' + u + ' dan kotak ' + nm[2] + ' memiliki ' + cacah(R) + ' ' + u + ' (tidak ada yang sama), jadi kotak ' + nm[0] + ' berisi gabungan keduanya, yaitu ' + cacah(X) + ' ' + u;
    return 'dari ' + cacah(Q) + ' ' + u + ' di kotak ' + nm[0] + ', ' + cacah(R) + ' ' + u + ' masih ada di kotak ' + nm[2] + ', jadi kotak ' + nm[1] + ' berisi ' + cacah(X) + ' ' + u + ' yang dihapus';
  }

  function kalimatBalik(p) {
    var nm = LETAK[p.arah], j = p.j, pj = nm[j], po = nm[1 - j];
    if (p.fam === 'balik-selisih') return 'Tanda tanya berada di kotak ' + pj + ', jadi aturannya harus dibalik. Karena unsur yang sama saling menghapus, kotak ' + pj + ' dapat dicari dengan menumpuk kotak ' + po + ' dan kotak ' + nm[2] + ' memakai aturan yang sama: unsur yang ada di keduanya hilang, unsur yang hanya ada di salah satunya tetap.';
    if (p.fam === 'balik-gabung') return 'Tanda tanya berada di kotak ' + pj + ', jadi aturannya harus dibalik. Karena kotak ' + nm[0] + ' dan kotak ' + nm[1] + ' tidak pernah memiliki ruas yang sama, kotak ' + pj + ' = kotak ' + nm[2] + ' dikurangi semua ruas kotak ' + po + '.';
    if (j === 0) return 'Tanda tanya berada di kotak ' + nm[0] + ', jadi aturannya harus dibalik. Kotak ' + nm[0] + ' terbagi habis menjadi ruas yang dihapus (kotak ' + nm[1] + ') dan ruas yang tersisa (kotak ' + nm[2] + '), jadi kotak ' + nm[0] + ' = gabungan kotak ' + nm[1] + ' dan kotak ' + nm[2] + '.';
    return 'Tanda tanya berada di kotak ' + nm[1] + ', jadi aturannya harus dibalik. Kotak ' + nm[1] + ' berisi ruas kotak ' + nm[0] + ' yang dihapus, yaitu ruas kotak ' + nm[0] + ' yang tidak ada lagi di kotak ' + nm[2] + '.';
  }

  function saring(f, ch) { var o = {}; o[ch] = f[ch]; return o; }
  function tandaOp(op) { return op === 'kurang' ? '-' : '+'; }

  /** Garisan contoh: garisan lengkap yang paling banyak memperlihatkan perilaku aturan. */
  function pilihContoh(a, p, G) {
    var calon = [0, 1, 2].filter(function (i) { return i !== p.h; }), nilai = function (i) {
      var L = garisan(G, p.arah, i), n = 0;
      p.kanal.forEach(function (ch) { var A = L[0][ch], B = L[1][ch]; n += (A & B ? 1 : 0) + (A & ~B ? 1 : 0) + (B & ~A ? 1 : 0); });
      return n;
    };
    var terbaik = Math.max(nilai(calon[0]), nilai(calon[1]));
    return a.pilih(calon.filter(function (i) { return nilai(i) === terbaik; }));
  }

  function susunBahas(a, p, G, kunci) {
    var nm = LETAK[p.arah], ci = pilihContoh(a, p, G), h = p.h, j = p.j;
    var Lc = garisan(G, p.arah, ci), Lh = garisan(G, p.arah, h);
    var lc = namaGarisan(p.arah, ci), lh = namaGarisan(p.arah, h), Lc1 = Fmt.kapital(lc), Lh1 = Fmt.kapital(lh);
    var fig = function (s) { return keFig(s, p.kanal); };
    var kf = fig(kunci), pem = [], gambar = [];
    var adaGaris = p.kanal.indexOf('garis') >= 0, simb = p.kanal.filter(function (ch) { return ch !== 'garis'; });
    var namaSimb = Fmt.daftarKata(simb.map(function (ch) { return UNSUR[ch]; }));
    var kerangka = !adaGaris ? '' : 'ruas garis pada kerangka sembilan titik bantu (3 x 3) yang sama: ' +
      { lurus: 'ruas mendatar dan tegak antartitik bantu', penuh: 'ruas mendatar, tegak, dan miring antartitik bantu', tepi: 'ruas pada sisi luar kerangka dan ruas miring antartitik bantu' }[p.kisi];
    var arahKal = p.arah === 'baris' ? 'Pada setiap baris (dibaca dari kiri ke kanan)' : 'Pada setiap kolom (dibaca dari atas ke bawah)';
    if (adaGaris && simb.length) pem.push('Setiap kotak berisi ' + kerangka + ', serta ' + namaSimb + ' pada titik-titik bantu itu. ' + arahKal + ', kotak ketiga diperoleh dengan menumpuk kotak pertama dan kotak kedua.');
    else if (adaGaris) pem.push('Setiap kotak berisi ' + kerangka + '. ' + arahKal + ', kotak ketiga diperoleh dengan menumpuk kotak pertama dan kotak kedua.');
    else pem.push('Setiap kotak berisi ' + namaSimb + ' yang diletakkan pada sembilan titik bantu (3 x 3) yang letaknya tetap. ' + arahKal + ', kotak ketiga diperoleh dengan menumpuk kotak pertama dan kotak kedua.');

    var beda = p.fam === 'dua-unsur' || p.fam === 'dua-simbol';
    var warnaKal = function (adaHilang) {
      return 'Unsur berwarna jingga hanya ada di kotak bertepi jingga, unsur biru hanya ada di kotak bertepi biru, unsur ungu ada di kedua kotak' + (adaHilang ? ', dan unsur abu-abu putus-putus adalah unsur yang hilang' : '') + '.';
    };
    var adaHilang = function (L, chs) { return chs.some(function (ch) { return ((L[0][ch] | L[1][ch]) & ~L[2][ch]) !== 0; }); };
    var barisMaju = function (L, judul, chs, jawab) {
      return { judul: judul, sel: L.map(function (s) { var f = fig(s); return chs ? saringBanyak(f, chs) : f; }), nama: nm.map(function (n, i) { return n + (i === jawab ? ' (jawaban)' : ''); }), tanda: tandaOp(p.aturan[(chs || p.kanal)[0]]), warna: true, jawab: jawab };
    };

    if (beda) {
      p.kanal.forEach(function (ch, i) {
        pem.push('• ' + Fmt.kapital(UNSUR[ch]) + ': ' + kalimatAturan(p, ch) + '. Contoh pada ' + lc + ': ' + uraiMaju(p, ch, Lc) + '. Pada ' + lh + ': ' + uraiMaju(p, ch, Lh) + ' (Gambar ' + (i + 1) + ').');
        gambar.push({ jenis: 'tumpuk-bahas', judul: 'Gambar ' + (i + 1) + '. Aturan ' + UNSUR[ch] + ': ' + RINGKAS_OP[p.aturan[ch]],
          model: { kanal: [ch], baris: [barisMaju(Lc, Lc1 + ' (contoh), ' + UNSUR[ch] + ' saja', [ch], -1), barisMaju(Lh, Lh1 + ' (yang ditanyakan), ' + UNSUR[ch] + ' saja', [ch], 2)] } });
      });
      var c1 = p.kanal[0], c2 = p.kanal[1];
      pem.push('Kedua jenis unsur mengikuti aturan yang berbeda, jadi setiap jenis dikerjakan terpisah. ' + warnaKal(adaHilang(Lc, p.kanal) || adaHilang(Lh, p.kanal)) + ' Gambar 3 menyatukan hasil ' + UNSUR[c1] + ' dan hasil ' + UNSUR[c2] + ' menjadi gambar jawaban.');
      gambar.push({ jenis: 'tumpuk-bahas', judul: 'Gambar 3. Hasil kedua jenis unsur disatukan',
        model: { kanal: p.kanal.slice(), baris: [{ judul: Lh1 + ': hasil ' + UNSUR[c1] + ' dan hasil ' + UNSUR[c2], sel: [saring(kf, c1), saring(kf, c2), kf], nama: [UNSUR[c1], UNSUR[c2], 'jawaban'], tanda: '+', warna: false, jawab: 2 }], jawaban: kf } });
    } else if (j === 2) {
      pem.push('Aturannya: ' + (p.kanal.length > 1 ? 'untuk setiap jenis unsur, ' + kalimatAturan(p, p.kanal[0], 'unsur') : kalimatAturan(p, p.kanal[0])) + '.');
      pem.push('Contoh pada ' + lc + ': ' + p.kanal.map(function (ch) { return uraiMaju(p, ch, Lc); }).join('; ') + '.');
      pem.push('Pada ' + lh + ' yang ditanyakan: ' + p.kanal.map(function (ch) { return uraiMaju(p, ch, Lh); }).join('; ') + '.');
      pem.push('Gambar 1 memperlihatkan ' + lc + ' sebagai contoh (atas) dan ' + lh + ' yang ditanyakan (bawah). ' + warnaKal(adaHilang(Lc, p.kanal) || adaHilang(Lh, p.kanal)) + ' Kotak jawaban berlatar hijau muda.');
      gambar.push({ jenis: 'tumpuk-bahas', judul: 'Gambar 1. ' + Lc1 + ' sebagai contoh, lalu ' + lh + ' yang ditanyakan',
        model: { kanal: p.kanal.slice(), baris: [barisMaju(Lc, Lc1 + ' (contoh): ' + RINGKAS_OP[p.aturan[p.kanal[0]]], null, -1), barisMaju(Lh, Lh1 + ' (yang ditanyakan)', null, 2)], jawaban: kf } });
    } else {
      pem.push('Aturannya: ' + (p.kanal.length > 1 ? 'untuk setiap jenis unsur, ' + kalimatAturan(p, p.kanal[0], 'unsur') : kalimatAturan(p, p.kanal[0])) + '.');
      pem.push('Contoh pada ' + lc + ': ' + p.kanal.map(function (ch) { return uraiMaju(p, ch, Lc); }).join('; ') + '.');
      pem.push(kalimatBalik(p));
      pem.push('Pada ' + lh + ': ' + p.kanal.map(function (ch) { return uraiBalik(p, ch, Lh); }).join('; ') + '.');
      var pj = nm[j], po = nm[1 - j], inv;
      if (p.fam === 'balik-selisih') inv = { sel: [Lh[1 - j], Lh[2], kunci], nama: [po, nm[2], pj + ' (jawaban)'], tanda: '+', ket: pj + ' = ' + po + ' + ' + nm[2] + ', yang sama hilang' };
      else if (p.fam === 'balik-gabung') inv = { sel: [Lh[2], Lh[1 - j], kunci], nama: [nm[2], po, pj + ' (jawaban)'], tanda: '-', ket: pj + ' = ' + nm[2] + ' - ' + po };
      else if (j === 0) inv = { sel: [Lh[1], Lh[2], kunci], nama: [nm[1], nm[2], nm[0] + ' (jawaban)'], tanda: '+', ket: nm[0] + ' = ' + nm[1] + ' + ' + nm[2] };
      else inv = { sel: [Lh[0], Lh[2], kunci], nama: [nm[0], nm[2], nm[1] + ' (jawaban)'], tanda: '-', ket: nm[1] + ' = ' + nm[0] + ' - ' + nm[2] };
      var hil = adaHilang(Lc, p.kanal) || ((inv.sel[0][p.kanal[0]] | inv.sel[1][p.kanal[0]]) & ~kunci[p.kanal[0]]) !== 0;
      pem.push('Gambar 1 memperlihatkan aturan pada ' + lc + ' (atas) dan pembalikannya pada ' + lh + ' (bawah). ' + warnaKal(hil) + ' Gambar 2 memeriksa ' + lh + ' setelah tanda tanya diganti jawaban: aturan semula berlaku lagi.');
      gambar.push({ jenis: 'tumpuk-bahas', judul: 'Gambar 1. Aturan pada ' + lc + ' lalu dibalik pada ' + lh,
        model: { kanal: p.kanal.slice(), baris: [barisMaju(Lc, Lc1 + ' (contoh): ' + RINGKAS_OP[p.aturan[p.kanal[0]]], null, -1),
          { judul: Lh1 + ' dibalik: ' + inv.ket, sel: inv.sel.map(fig), nama: inv.nama, tanda: inv.tanda, warna: true, jawab: 2 }], jawaban: kf } });
      gambar.push({ jenis: 'tumpuk-bahas', judul: 'Gambar 2. Pemeriksaan ' + lh + ' dengan jawaban',
        model: { kanal: p.kanal.slice(), baris: [barisMaju(Lh, Lh1 + ': ' + nm[0] + ' ' + tandaOp(p.aturan[p.kanal[0]]) + ' ' + nm[1] + ' = ' + nm[2], null, j)], jawaban: kf } });
    }
    pem.push('Jadi, gambar pengganti tanda tanya berisi ' + uraiIsi(kunci, p.kanal) + '.');
    return { pem: pem, gambar: gambar.map(function (g, i) { return { id: 'bahas-' + (i + 1), jenis: g.jenis, judul: g.judul, model: g.model }; }) };
  }

  function saringBanyak(f, chs) { var o = {}; chs.forEach(function (ch) { o[ch] = f[ch]; }); return o; }

  // ------------------------------------------------------------------ gambar

  var TINTA = '#1d1d1d', TEPI = '#4a5266', BINGKAI = '#7b8499', BANTU = '#c3c9d4', UNGU = '#8e44ad';
  var BH = S.BAHAS;
  var X3 = [20, 50, 80];

  function titikBantu(p) { return [X3[p % 3], X3[Math.floor(p / 3)]]; }
  function ujungRuas(id) {
    var a, b;
    if (id < 6) { var r = Math.floor(id / 2), c = id % 2; a = [c, r]; b = [c + 1, r]; }
    else if (id < 12) { var k = id - 6, c2 = Math.floor(k / 2), r2 = k % 2; a = [c2, r2]; b = [c2, r2 + 1]; }
    else { var d = id - 12, sq = Math.floor(d / 2), sr = Math.floor(sq / 2), sc = sq % 2; if (d % 2) { a = [sc + 1, sr]; b = [sc, sr + 1]; } else { a = [sc, sr]; b = [sc + 1, sr + 1]; } }
    return [[X3[a[0]], X3[a[1]]], [X3[b[0]], X3[b[1]]]];
  }

  function simbolSvg(ch, x, y, warna, adaGaris) {
    if (ch === 'titik') return S.lingkaran(x, y, 7.2, { isi: warna });
    if (ch === 'bulat') return S.lingkaran(x, y, 7, { isi: '#ffffff', garis: warna, tebal: 2.8 });
    var o = adaGaris ? S.lingkaran(x, y, 8.6, { isi: '#ffffff' }) : '', t = 5.6;
    return o + S.garis(x - t, y - t, x + t, y + t, { garis: warna, tebal: 3.2, ujung: 'round' }) + S.garis(x - t, y + t, x + t, y - t, { garis: warna, tebal: 3.2, ujung: 'round' });
  }

  /**
   * Isi satu kotak pada koordinat 0..100 (tanpa bingkai). `peta` (gambar pembahasan, boleh kosong):
   * { warna(ch, e) -> warna, hilang: { ch: [unsur yang hilang] } }.
   */
  function isiSel(fig, peta) {
    var o = [], p, adaGaris = !!(fig.garis && fig.garis.length);
    for (p = 0; p < 9; p++) { var t = titikBantu(p); o.push(S.lingkaran(t[0], t[1], 1.9, { isi: BANTU })); }
    var hilang = (peta && peta.hilang) || {};
    (hilang.garis || []).forEach(function (id) { var u = ujungRuas(id); o.push(S.garis(u[0][0], u[0][1], u[1][0], u[1][1], { garis: BH.redup, tebal: 2.4, putus: '5 4' })); });
    (fig.garis || []).forEach(function (id) {
      var u = ujungRuas(id);
      o.push(S.garis(u[0][0], u[0][1], u[1][0], u[1][1], { garis: peta ? peta.warna('garis', id) : TINTA, tebal: 4.2, ujung: 'round' }));
    });
    SIMBOL.forEach(function (ch) {
      (hilang[ch] || []).forEach(function (e) {
        var t = titikBantu(e), r = 5.6, gp = { garis: BH.redup, tebal: 1.8, putus: '3 2.5' };
        if (ch === 'silang') o.push(S.garis(t[0] - r, t[1] - r, t[0] + r, t[1] + r, gp) + S.garis(t[0] - r, t[1] + r, t[0] + r, t[1] - r, gp));
        else o.push(S.lingkaran(t[0], t[1], 7, { isi: '#ffffff', garis: BH.redup, tebal: 1.8, putus: '3 2.5' }));
      });
      (fig[ch] || []).forEach(function (e) { var t = titikBantu(e); o.push(simbolSvg(ch, t[0], t[1], peta ? peta.warna(ch, e) : TINTA, adaGaris)); });
    });
    return o.join('');
  }

  function bingkai(isi, x, y, u, latar) {
    return S.kelompok(S.rect(0.7, 0.7, 98.6, 98.6, { isi: latar || '#ffffff', garis: BINGKAI, tebal: 1.6 }) + isi, x, y, u / 100);
  }

  function svgSoal(m) {
    var u = 104, pad = 6, o = [], g = m.grid;
    for (var r = 0; r < 3; r++) {
      for (var c = 0; c < 3; c++) {
        var x = pad + c * u, y = pad + r * u;
        if (g[r][c] === null) o.push(bingkai(S.teks('?', 50, 72, { ukuran: 66, tebal: true, isi: TEPI, rata: 'middle' }), x, y, u, '#f4f6fb'));
        else o.push(bingkai(isiSel(g[r][c], null), x, y, u));
      }
    }
    o.push(S.rect(pad, pad, 3 * u, 3 * u, { isi: 'none', garis: TEPI, tebal: 2.4 }));
    var W = pad * 2 + 3 * u;
    return { svg: S.doc(o.join(''), W, W, { latar: '#ffffff' }), lebar: W, tinggi: W };
  }

  function svgOpsi(m) {
    var u = 124, pad = 4, W = u + pad * 2;
    return { svg: S.doc(bingkai(isiSel(m.fig, null), pad, pad, u), W, W, { latar: '#ffffff' }), lebar: W, tinggi: W };
  }

  function teksB(s, x, y, o) {
    o = o || {};
    return S.teks(s, x, y, { ukuran: o.ukuran || 11, tebal: o.tebal, isi: o.isi || BH.teks, rata: o.rata });
  }

  function punya(f, ch, e) { return (f[ch] || []).indexOf(e) >= 0; }

  /** Warna unsur kotak ke-i dalam satu baris gambar pembahasan (asal unsurnya). */
  function petaWarna(sel, i, catat) {
    var X = sel[0], Y = sel[1], Z = sel[2], hilang = {};
    var warna = function (ch, e) {
      var dx = punya(X, ch, e), dy = punya(Y, ch, e), w;
      if (i === 0) w = dy ? UNGU : BH.sorot;
      else if (i === 1) w = dx ? UNGU : BH.panah;
      else w = dx && dy ? UNGU : (dx ? BH.sorot : (dy ? BH.panah : TINTA));
      catat[w] = 1;
      return w;
    };
    if (i === 2) {
      KANAL.forEach(function (ch) {
        var h = [];
        (X[ch] || []).concat(Y[ch] || []).forEach(function (e) { if (!punya(Z, ch, e) && h.indexOf(e) < 0) h.push(e); });
        if (h.length) { hilang[ch] = h; catat.hilang = 1; }
      });
    }
    return { warna: warna, hilang: hilang };
  }

  function svgBahas(m, judul) {
    var pad = 10, u = 92, sela = 42, isiL = 3 * u + 2 * sela, y = pad + 30, catat = {}, adaWarna = false;
    var W = Math.max(isiL + pad * 2, Math.ceil(Metrik.lebar(judul, 13, true)) + pad * 2);
    m.baris.forEach(function (bs) { W = Math.max(W, Math.ceil(Metrik.lebar(bs.judul, 11, true)) + pad * 2); });
    var x0 = (W - isiL) / 2, o = [teksB(judul, pad, pad + 14, { ukuran: 13, tebal: true })];
    m.baris.forEach(function (bs) {
      o.push(teksB(bs.judul, pad, y + 11, { tebal: true }));
      y += 20;
      if (bs.warna) adaWarna = true;
      for (var i = 0; i < 3; i++) {
        var x = x0 + i * (u + sela), jawab = bs.jawab === i;
        var tepi = jawab && i === 2 ? BH.jawab : (bs.warna ? [BH.sorot, BH.panah, BINGKAI][i] : BINGKAI);
        o.push(S.rect(x, y, u, u, { rx: 4, isi: jawab ? BH.latarJawab : '#ffffff', garis: tepi, tebal: jawab ? 3 : 2 }));
        o.push(S.kelompok(isiSel(bs.sel[i], bs.warna ? petaWarna(bs.sel, i, catat) : null), x, y, u / 100));
        o.push(teksB(bs.nama[i], x + u / 2, y + u + 14, { ukuran: 10, rata: 'middle', tebal: jawab, isi: jawab ? BH.jawab : BH.teksRedup }));
        if (i < 2) o.push(teksB(i ? '=' : bs.tanda, x + u + sela / 2, y + u / 2 + 8, { ukuran: 24, tebal: true, rata: 'middle' }));
      }
      y += u + 32;
    });
    if (adaWarna) {
      var garis = m.kanal.indexOf('garis') >= 0, item = [];
      if (catat[BH.sorot]) item.push([BH.sorot, 'hanya di kotak bertepi jingga', false]);
      if (catat[BH.panah]) item.push([BH.panah, 'hanya di kotak bertepi biru', false]);
      if (catat[UNGU]) item.push([UNGU, 'ada di kedua kotak', false]);
      if (catat.hilang) item.push([BH.redup, 'hilang (tidak digambar)', true]);
      var kol = (W - pad * 2) / 2;
      item.forEach(function (it, k) {
        var x = pad + (k % 2) * kol, yy = y + Math.floor(k / 2) * 16;
        if (garis) o.push(S.garis(x, yy - 4, x + 18, yy - 4, { garis: it[0], tebal: it[2] ? 2 : 3.6, putus: it[2] ? '4 3' : undefined, ujung: it[2] ? undefined : 'round' }));
        else o.push(S.lingkaran(x + 8, yy - 4, 5, it[2] ? { isi: '#ffffff', garis: it[0], tebal: 1.4, putus: '2 2' } : { isi: it[0] }));
        o.push(teksB(it[1], x + 24, yy, { ukuran: 10, isi: BH.teksRedup }));
      });
      y += Math.ceil(item.length / 2) * 16 + 2;
    }
    var H = y + pad - 8;
    return { svg: S.doc(o.join(''), W, H, { latar: '#ffffff' }), lebar: W, tinggi: H };
  }

  // ------------------------------------------------------------------ butir

  function buat(id, level, benih, opsi) {
    if (id !== ID) return null;
    opsi = opsi || {};
    if (!KELOMPOK[level]) level = 'sedang';
    var a = Rng.alat(benih);
    var target = opsi.target == null ? a.bulat(0, 4) : opsi.target;
    var dipakai = opsi.polaDipakai || [], semua = KELOMPOK[level];
    var baru = semua.filter(function (f) { return !dipakai.some(function (x) { return String(x).indexOf(ID + ':' + f) === 0; }); });
    var fam = a.pilih(baru.length ? baru : semua);
    for (var coba = 0; coba < 120; coba++) {
      if (coba === 60) fam = a.pilih(semua);
      var p = rencana(a, level, fam), G = isiGrid(a, p);
      if (!G) continue;
      var x = letak(p.arah, p.h, p.j), mr = x[0], mc = x[1], kunci = G[mr][mc];
      if (!layak(p, G, mr, mc, kunci)) continue;
      var peng = pilihPengecoh(a, level, p, G, kunci);
      if (!peng) continue;

      var daftar = a.kocok(peng.map(function (q) { return { sel: q.sel, alasan: q.alasan, kunci: false }; }));
      daftar.splice(target, 0, { sel: kunci, alasan: null, kunci: true });
      var figs = daftar.map(function (d) { return keFig(d.sel, p.kanal); });
      var opsiGambar = daftar.map(function (d, i) {
        return { teks: 'Gambar opsi ' + Fmt.huruf(i), nilai: i, alasan: d.alasan, kunci: d.kunci,
          gambar: { id: 'opsi-' + Fmt.huruf(i).toLowerCase(), jenis: 'tumpuk-opsi', model: { fig: figs[i] }, judul: 'Opsi ' + Fmt.huruf(i) } };
      });
      var tampil = G.map(function (row, r) { return row.map(function (s, c) { return r === mr && c === mc ? null : keFig(s, p.kanal); }); });
      var bahas = susunBahas(a, p, G, kunci);
      var aturan = {};
      p.kanal.forEach(function (ch) { aturan[ch] = p.aturan[ch]; });
      var ctx = { subtes: 'ku', submateri: 'figural', keluarga: id, level: level, benih: benih, a: a };
      var butir = Butir.rakitPg(ctx, {
        jenisSoal: JENIS_SOAL,
        judul: 'Figural Matriks - Kotak 3x3', teks: [], pertanyaan: '', perintah: PERINTAH,
        gambar: [{ id: 'soal', jenis: 'tumpuk-soal', model: { grid: tampil }, judul: 'Matriks 3x3 penumpukan gambar' }],
        pilihanJadi: { opsi: opsiGambar, kunciIndex: target }, tulisKunci: false,
        langkah: [], pembahasan: bahas.pem,
        model: {
          topik: 'Figural', tipe: ID, grid: tampil, mr: mr, mc: mc, kanal: p.kanal.slice(), arah: p.arah, aturan: aturan,
          pilihan: figs, kunciIndex: target
        },
        sidik: { inti: ID + '|' + G.map(function (row) { return row.map(function (s) { return sidikSel(s, p.kanal); }).join('/'); }).join('//'), param: [], entitas: p.pola }
      });
      if (!butir) continue;
      butir.gambarPembahasan = bahas.gambar;
      butir.pola = ID + ':' + p.pola;
      butir.kategoriRiset = 'pengayaan';
      butir.catatanRiset = CATATAN;
      return butir;
    }
    return null;
  }

  var KELUARGA = [{ id: ID, nama: 'Matriks 3x3 penumpukan (kotak ketiga = gabungan, selisih, irisan, atau pengurangan dua kotak)', submateri: 'figural', kolam: 'matriks' }];

  return {
    KELUARGA: KELUARGA, PERINTAH: PERINTAH, buat: buat,
    GAMBAR: { 'tumpuk-soal': svgSoal, 'tumpuk-opsi': svgOpsi, 'tumpuk-bahas': svgBahas }
  };
});
