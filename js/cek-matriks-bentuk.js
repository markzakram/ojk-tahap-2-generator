/*
 * cek-matriks-bentuk.js — pemeriksa independen untuk keluarga di matriks-bentuk.js (dipanggil validator.js).
 *
 * Pemeriksa TIDAK memakai kode penyusun dan tidak membaca aturan yang disimpan penyusun. Ia membaca
 * matriks dan opsi yang TAMPIL (model gambar soal dan gambar opsi), lalu:
 *
 *   1. memeriksa bentuk datanya (3x3, satu kotak kosong tepat di tanda tanya, isi kotak sah dan dapat
 *      digambar, semua kotak tampak memakai kanal yang sama);
 *   2. menyusun SEMUA calon isi kotak "?" (seluruh gabungan nilai kanal), lalu mencoba setiap aturan
 *      pustakanya. Aturan BERLAKU bila sedikitnya satu calon membuat aturan itu benar di seluruh matriks
 *      (jadi semua baris/kolom lengkap memenuhinya). Isi "?" = calon yang memenuhi SEMUA aturan yang
 *      berlaku. Tidak ada calon tersisa = aturan-aturan yang cocok saling bertentangan (ambigu); lebih
 *      dari satu = aturan belum menentukan isi kotak itu;
 *   3. (luar-dalam) memastikan pola tidak patah: tidak ada aturan per garis yang berlaku pada semua garis
 *      lengkap tetapi dilanggar kotak tampak pada garis bertanda tanya, dan tiap kelompok slot (bentuk, warna,
 *      letak) punya arah baris atau kolom yang semua garisnya berpola kesamaan sama;
 *   4. memastikan tepat satu opsi sama persis dengan isi hasil tebakan, dan opsi itu kunci.
 *
 * Pustaka aturan bentuk luar-dalam (tiap slot: luar, dalam, warna, letak):
 *   pola letak    sama semua, sama per baris, sama per kolom, tiap baris/kolom memuat tiga nilai yang
 *                 sama (latin), sama sepanjang diagonal atau diagonal balik
 *   langkah       warna dan letak: maju k langkah melingkar per kolom atau per baris (k sama di semua
 *                 garis, atau tiap garis punya k sendiri)
 *   pemetaan      pada setiap baris (atau setiap kolom), slot X kotak ke-i sama dengan slot Y kotak ke-j
 *                 untuk semua pasangan slot sejenis (bentuk luar/dalam saling dipetakan) — mencakup
 *                 geser, tukar, gabung, salin kotak, dan arah sebaliknya
 *   ikut bentuk   warna atau letak bentuk dalam ditentukan oleh bentuk luar/dalamnya (harus terlihat
 *                 pada sedikitnya dua bentuk yang muncul berulang, dengan dua nilai berbeda)
 *
 * Pustaka aturan hitungan (tiap jenis unsur, banyak sisi, dan total semua unsur):
 *   per baris dan per kolom   ketiga = pertama + kedua, pertama - kedua, kedua - pertama, |selisih|,
 *                             hasil kali, hasil bagi, jumlah sebaris tetap, deret aritmetika dengan beda
 *                             sama atau beda sendiri, dan memuat tiga bilangan yang sama (latin)
 *   seluruh matriks           aditif: isi = nilai baris + nilai kolom
 *   antarjenis dalam kotak    selisih tetap (termasuk sama banyak) atau jumlah tetap
 *   jenis berganti            bila jenis unsur berganti antarkotak, jenis kotak "?" ditebak dengan pola
 *                             letak dan banyaknya dengan aturan hitungan di atas
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory();
    module.exports = api;
  } else {
    api = factory();
    root.CekMatriksBentuk = api;
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var HURUF = ['A', 'B', 'C', 'D', 'E'];

  function kanonik(x) {
    if (!x || typeof x !== 'object') return String(x);
    return Object.keys(x).sort().map(function (k) { return k + '=' + x[k]; }).join(';');
  }
  function balik(V) { return [0, 1, 2].map(function (i) { return [V[0][i], V[1][i], V[2][i]]; }); }
  function deret(lo, hi) { var o = []; for (var i = lo; i <= hi; i++) o.push(i); return o; }
  function md(a, n) { return ((a % n) + n) % n; }
  function total(xs) { var s = 0; for (var i = 0; i < xs.length; i++) s += xs[i]; return s; }

  /** Bentuk umum: 3x3, tepat satu kotak null di tanda tanya. */
  function periksaMatriks(g, tanya, m) {
    if (!Array.isArray(g) || g.length !== 3 || g.some(function (b) { return !Array.isArray(b) || b.length !== 3; })) { m.push('matriks bukan 3x3'); return false; }
    if (!Array.isArray(tanya) || tanya.length !== 2) { m.push('letak tanda tanya tidak terbaca'); return false; }
    for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) {
      var kosong = g[r][c] === null, diTanya = r === tanya[0] && c === tanya[1];
      if (kosong !== diTanya) { m.push('kotak kosong tidak sama dengan kotak tanda tanya (baris ' + (r + 1) + ', kolom ' + (c + 1) + ')'); return false; }
    }
    return true;
  }

  function tampak(g) { var o = []; g.forEach(function (b) { b.forEach(function (x) { if (x) o.push(x); }); }); return o; }

  function isiLubang(g, tr, tc, x) { return g.map(function (b, r) { return b.map(function (y, c) { return r === tr && c === tc ? x : y; }); }); }

  /** Kombinasi nilai untuk daftar slot (objek). */
  function kombinasi(slot, ranah, saring) {
    var hasil = [];
    (function jalan(i, o) {
      if (i === slot.length) { if (!saring || saring(o)) hasil.push(Object.assign({}, o)); return; }
      ranah[slot[i]].forEach(function (v) { o[slot[i]] = v; jalan(i + 1, o); });
      delete o[slot[i]];
    })(0, {});
    return hasil;
  }

  /**
   * Tebak isi lubang: aturan = { nama, slot: [slot yang dibaca], uji(G) }. Untuk tiap aturan,
   * dicoba semua nilai slot yang dibacanya; aturan berlaku bila ada yang lolos. Hasil akhir: calon
   * penuh yang lolos semua aturan yang berlaku.
   */
  function tebak(g, tr, tc, slotSemua, ranah, aturan, sahCalon) {
    var berlaku = [];
    aturan.forEach(function (at) {
      var lolos = {}, ada = false;
      kombinasi(at.slot, ranah, sahCalon).forEach(function (o) {
        if (at.uji(isiLubang(g, tr, tc, o))) { lolos[kanonik(o)] = 1; ada = true; }
      });
      if (ada) berlaku.push({ nama: at.nama, slot: at.slot, lolos: lolos });
    });
    var akhir = kombinasi(slotSemua, ranah, sahCalon).filter(function (o) {
      return berlaku.every(function (at) {
        var p = {}; at.slot.forEach(function (s) { p[s] = o[s]; });
        return at.lolos[kanonik(p)];
      });
    });
    if (akhir.length === 1) return { status: 'unik', sel: akhir[0], berlaku: berlaku.map(function (x) { return x.nama; }) };
    if (!akhir.length) {
      // cari aturan yang bertentangan untuk pesan
      var nama = berlaku.filter(function (at) { return Object.keys(at.lolos).length < kombinasi(at.slot, ranah, sahCalon).length; }).map(function (x) { return x.nama; });
      return { status: 'ambigu', pesan: 'aturan yang cocok dengan kotak tampak memberi isi tanda tanya yang berbeda (' + nama.slice(0, 6).join(', ') + ')' };
    }
    return { status: 'kurang', pesan: 'aturan yang terbaca belum menentukan isi tanda tanya (' + akhir.length + ' kemungkinan)' };
  }

  // ================================================================ bentuk luar-dalam

  var BENTUK = ['lingkaran', 'persegi', 'segitiga', 'segilima', 'segienam', 'ketupat', 'bintang'];
  var LAPANG = ['lingkaran', 'persegi', 'segilima', 'segienam', 'ketupat'];
  var WARNA = ['putih', 'abu', 'hitam'];
  var POSISI = ['atas', 'kanan', 'bawah', 'kiri'];
  var RANAH_LD = { luar: BENTUK, dalam: BENTUK, warna: WARNA, posisi: POSISI };
  var JENIS = { luar: 'b', dalam: 'b', warna: 'w', posisi: 'p' };

  function selLDSah(x, slot) {
    if (!x || typeof x !== 'object') return 'bukan kotak';
    var ks = Object.keys(x).sort();
    if (ks.join() !== slot.join()) return 'kanal kotak berbeda (' + ks.join(',') + ')';
    for (var i = 0; i < ks.length; i++) if (!RANAH_LD[ks[i]] || RANAH_LD[ks[i]].indexOf(x[ks[i]]) < 0) return 'nilai ' + ks[i] + ' tidak dikenal: ' + x[ks[i]];
    if (x.luar === x.dalam) return 'bentuk luar sama dengan bentuk dalam';
    if (x.posisi && LAPANG.indexOf(x.luar) < 0) return 'bentuk dalam yang berpindah letak tidak muat di dalam ' + x.luar;
    return null;
  }

  function nilaiSlot(G, s) { return G.map(function (b) { return b.map(function (x) { return x[s]; }); }); }

  var GARIS_POLA = { 'sama per baris': 'baris', 'sama per kolom': 'kolom', 'latin baris': 'baris', 'latin kolom': 'kolom' };

  /**
   * Pola terputus: aturan per garis yang berlaku pada SEMUA baris (atau kolom) lengkap, tetapi sudah
   * dilanggar oleh kotak tampak pada garis yang memuat tanda tanya (tidak ada isi lubang yang memulihkannya).
   * Garis lengkap diuji dengan mengganti garis bertanda tanya dengan salinan garis lengkap lain.
   */
  function polaPutus(g, tr, tc, aturan, ranah, sah) {
    var rL = tr === 0 ? 1 : 0, cL = tc === 0 ? 1 : 0, putus = [];
    var gB = g.map(function (b, r) { return (r === tr ? g[rL] : b).slice(); });
    var gK = g.map(function (b) { return b.map(function (x, c) { return c === tc ? b[cL] : x; }); });
    aturan.forEach(function (at) {
      if (!at.garis || !at.uji(at.garis === 'baris' ? gB : gK)) return;
      var bisa = kombinasi(at.slot, ranah, sah).some(function (o) { return at.uji(isiLubang(g, tr, tc, o)); });
      if (!bisa) putus.push(at.nama);
    });
    return putus;
  }

  /** Tanda kesamaan satu garis untuk sekelompok slot: tiap pasangan ujung (kotak, slot) bernilai 1 (sama), 0, atau ? (kosong). */
  function tandaGaris(sel, slot) {
    var ujung = [], t = [];
    for (var i = 0; i < 3; i++) slot.forEach(function (x) { ujung.push([i, x]); });
    for (var p = 0; p < ujung.length; p++) for (var q = p + 1; q < ujung.length; q++) {
      var a = sel[ujung[p][0]], b = sel[ujung[q][0]];
      t.push(a && b ? (a[ujung[p][1]] === b[ujung[q][1]] ? '1' : '0') : '?');
    }
    return t;
  }

  /**
   * Keutuhan pola: untuk sekelompok slot harus ada arah (baris atau kolom) yang semua garis lengkapnya
   * bertanda kesamaan SAMA, dan bagian tampak garis bertanda tanya cocok dengan tanda itu. Garis yang
   * menyimpang (misalnya satu bentuk dalam salah gambar) membuat pola tidak utuh.
   */
  function polaUtuh(g, tr, tc, slot) {
    return ['baris', 'kolom'].some(function (ar) {
      var garis = [0, 1, 2].map(function (i) { return ar === 'baris' ? g[i] : [g[0][i], g[1][i], g[2][i]]; }), iT = ar === 'baris' ? tr : tc;
      var lengkap = garis.filter(function (x, i) { return i !== iT; }).map(function (x) { return tandaGaris(x, slot); });
      if (lengkap[0].join() !== lengkap[1].join()) return false;
      return tandaGaris(garis[iT], slot).every(function (v, k) { return v === '?' || v === lengkap[0][k]; });
    });
  }

  function tigaBeda(b) { return b[0] !== b[1] && b[0] !== b[2] && b[1] !== b[2]; }
  function himp(b) { return b.slice().sort().join('|'); }

  var POLA = {
    'sama semua': function (V) { var v = V[0][0]; return V.every(function (b) { return b.every(function (x) { return x === v; }); }); },
    'sama per baris': function (V) { return V.every(function (b) { return b[0] === b[1] && b[0] === b[2]; }); },
    'sama per kolom': function (V) { return POLA['sama per baris'](balik(V)); },
    'latin baris': function (V) { return V.every(tigaBeda) && himp(V[0]) === himp(V[1]) && himp(V[1]) === himp(V[2]); },
    'latin kolom': function (V) { return POLA['latin baris'](balik(V)); },
    'diagonal': function (V) { return [0, 1, 2].every(function (d) { return V[0][d] === V[1][md(d + 1, 3)] && V[1][md(d + 1, 3)] === V[2][md(d + 2, 3)]; }); },
    'diagonal balik': function (V) { return [0, 1, 2].every(function (d) { return V[0][d] === V[1][md(d - 1, 3)] && V[1][md(d - 1, 3)] === V[2][md(d - 2, 3)]; }); }
  };

  function langkahSah(V, urut, sama) {
    var n = urut.length, k0 = null;
    return V.every(function (b) {
      var i = b.map(function (x) { return urut.indexOf(x); });
      var a = md(i[1] - i[0], n), c = md(i[2] - i[1], n);
      if (a !== c) return false;
      if (!sama) return true;
      if (a === 0) return false;
      if (k0 === null) k0 = a;
      return a === k0;
    });
  }

  function aturanLD(slot, g) {
    var A = [];
    slot.forEach(function (s) {
      Object.keys(POLA).forEach(function (nm) { A.push({ nama: s + ': ' + nm, slot: [s], garis: GARIS_POLA[nm] || null, uji: function (G) { return POLA[nm](nilaiSlot(G, s)); } }); });
      if (s === 'warna' || s === 'posisi') {
        var urut = RANAH_LD[s];
        A.push({ nama: s + ': langkah per baris', slot: [s], garis: 'baris', uji: function (G) { return langkahSah(nilaiSlot(G, s), urut, true); } });
        A.push({ nama: s + ': langkah per kolom', slot: [s], garis: 'kolom', uji: function (G) { return langkahSah(balik(nilaiSlot(G, s)), urut, true); } });
        A.push({ nama: s + ': langkah sendiri per baris', slot: [s], garis: 'baris', uji: function (G) { return langkahSah(nilaiSlot(G, s), urut, false); } });
        A.push({ nama: s + ': langkah sendiri per kolom', slot: [s], garis: 'kolom', uji: function (G) { return langkahSah(balik(nilaiSlot(G, s)), urut, false); } });
      }
    });
    // pemetaan slot sejenis antarkotak dalam satu baris / satu kolom
    var ujung = [];
    for (var i = 0; i < 3; i++) slot.forEach(function (s) { ujung.push([i, s]); });
    for (var p = 0; p < ujung.length; p++) {
      for (var q = p + 1; q < ujung.length; q++) {
        var e1 = ujung[p], e2 = ujung[q];
        if (JENIS[e1[1]] !== JENIS[e2[1]]) continue;
        (function (e1, e2) {
          var dibaca = e1[1] === e2[1] ? [e1[1]] : [e1[1], e2[1]];
          A.push({ nama: 'tiap baris: ' + e1[1] + ' kotak ' + (e1[0] + 1) + ' = ' + e2[1] + ' kotak ' + (e2[0] + 1), slot: dibaca, garis: 'baris',
            uji: function (G) { return G.every(function (b) { return b[e1[0]][e1[1]] === b[e2[0]][e2[1]]; }); } });
          A.push({ nama: 'tiap kolom: ' + e1[1] + ' kotak ' + (e1[0] + 1) + ' = ' + e2[1] + ' kotak ' + (e2[0] + 1), slot: dibaca, garis: 'kolom',
            uji: function (G) { return [0, 1, 2].every(function (c) { return G[e1[0]][c][e1[1]] === G[e2[0]][c][e2[1]]; }); } });
        })(e1, e2);
      }
    }
    // warna / letak mengikuti bentuk (bukti: dua bentuk berulang dengan dua nilai berbeda)
    ['warna', 'posisi'].forEach(function (y) {
      if (slot.indexOf(y) < 0) return;
      ['luar', 'dalam'].forEach(function (x) {
        var kel = {};
        tampak(g).forEach(function (sel) { (kel[sel[x]] = kel[sel[x]] || []).push(sel[y]); });
        var ulang = Object.keys(kel).filter(function (k) { return kel[k].length >= 2; });
        var nilai = {};
        ulang.forEach(function (k) { nilai[kel[k][0]] = 1; });
        if (ulang.length < 2 || Object.keys(nilai).length < 2) return;
        A.push({ nama: y + ' mengikuti bentuk ' + x, slot: [x, y], uji: function (G) {
          var peta = {};
          for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) {
            var sel = G[r][c];
            if (peta[sel[x]] === undefined) peta[sel[x]] = sel[y]; else if (peta[sel[x]] !== sel[y]) return false;
          }
          return true;
        } });
      });
    });
    return A;
  }

  function periksaLD(b, m, alat) {
    var t = alat.bacaTampilan(b, m, 'mbentuk-ld', 'mbentuk-ld-opsi', function (x) { return x.fig || null; });
    if (!t) return;
    var g = t.soal.grid, tanya = t.soal.tanya;
    if (alat.sj(g) !== alat.sj(b.model.grid) || alat.sj(tanya) !== alat.sj(b.model.tanya)) m.push('matriks yang tergambar berbeda dari data model');
    if (!periksaMatriks(g, tanya, m)) return;
    var vis = tampak(g), slot = Object.keys(vis[0]).sort();
    if (['dalam', 'luar'].some(function (s) { return slot.indexOf(s) < 0; })) { m.push('kotak tidak memuat bentuk luar dan bentuk dalam'); return; }
    var salah = null;
    vis.forEach(function (x) { if (!salah) salah = selLDSah(x, slot); });
    if (salah) { m.push('kotak matriks tidak sah: ' + salah); return; }
    t.opsi.forEach(function (x, i) { var e = selLDSah(x, slot); if (e) m.push('opsi ' + HURUF[i] + ' tidak sah: ' + e); });
    var tr = tanya[0], tc = tanya[1], aturan = aturanLD(slot, g);
    var sah = function (o) { return o.luar === undefined || o.dalam === undefined || o.luar !== o.dalam; };
    var putus = polaPutus(g, tr, tc, aturan, RANAH_LD, sah);
    if (putus.length) { m.push('matriks luar-dalam: pola terputus pada garis bertanda tanya (' + putus.slice(0, 4).join(', ') + ')'); return; }
    // keutuhan pola tiap kelompok slot; warna/letak yang mengikuti bentuk tidak perlu berpola letak
    var kelompok = [['dalam', 'luar']].concat(slot.indexOf('warna') >= 0 ? [['warna']] : [], slot.indexOf('posisi') >= 0 ? [['posisi']] : []);
    var retak = kelompok.filter(function (kl) {
      if (kl[0] !== 'dalam' && aturan.some(function (at) { return at.nama.indexOf(kl[0] + ' mengikuti bentuk') === 0; })) return false;
      return !polaUtuh(g, tr, tc, kl);
    });
    if (retak.length) { m.push('matriks luar-dalam: pola ' + retak.map(function (kl) { return kl[0] === 'dalam' ? 'bentuk' : kl[0]; }).join(' dan ') + ' tidak sama pada setiap baris maupun setiap kolom'); return; }
    var r = tebak(g, tr, tc, slot, RANAH_LD, aturan, sah);
    if (r.status !== 'unik') { m.push('matriks luar-dalam: ' + r.pesan); return; }
    var harus = kanonik(r.sel), cocok = [];
    t.opsi.forEach(function (x, i) { if (kanonik(x) === harus) cocok.push(i); });
    alat.tepatSatu(b, m, cocok, 'aturan bentuk luar-dalam');
  }

  // ================================================================ hitungan unsur

  var UNSUR = ['hitam', 'putih', 'kotak', 'segitiga', 'garis', 'bintang', 'ketupat', 'silang'];

  function selJmlSah(x, kanal) {
    if (!x || typeof x !== 'object') return 'bukan kotak';
    var ks = Object.keys(x);
    if (!ks.length) return 'kotak kosong';
    for (var i = 0; i < ks.length; i++) {
      var k = ks[i], v = x[k];
      if (k === 'sisi') { if (!(v % 1 === 0 && v >= 3 && v <= 8)) return 'banyak sisi di luar 3-8: ' + v; continue; }
      if (UNSUR.indexOf(k) < 0) return 'jenis unsur tidak dikenal: ' + k;
      if (!(v % 1 === 0 && v >= 0 && v <= 9)) return 'banyak ' + k + ' di luar 0-9: ' + v;
    }
    var hitung = ks.filter(function (k) { return k !== 'sisi'; });
    if (x.sisi && hitung.length !== 1) return 'bangun harus berisi satu jenis titik';
    if (!x.sisi && (hitung.length < 1 || hitung.length > 2)) return 'kotak harus berisi satu atau dua jenis unsur';
    if (x.sisi === 3 && x[hitung[0]] > 4) return 'segitiga tidak muat lebih dari empat titik';
    if (kanal && ks.slice().sort().join() !== kanal.join()) return 'kanal kotak berbeda (' + ks.join(',') + ')';
    return null;
  }

  var PERSAMAAN = {
    'ketiga = pertama + kedua': function (b) { return b[2] === b[0] + b[1]; },
    'ketiga = pertama - kedua': function (b) { return b[2] === b[0] - b[1]; },
    'ketiga = kedua - pertama': function (b) { return b[2] === b[1] - b[0]; },
    'ketiga = selisih': function (b) { return b[2] === Math.abs(b[0] - b[1]); },
    'ketiga = hasil kali': function (b) { return b[2] === b[0] * b[1]; },
    'ketiga = hasil bagi': function (b) { return b[1] !== 0 && b[2] * b[1] === b[0]; },
    'deret beda sendiri': function (b) { return b[1] - b[0] === b[2] - b[1]; }
  };
  var LINTAS = {
    'jumlah sebaris tetap': function (V) { var k = total(V[0]); return total(V[1]) === k && total(V[2]) === k; },
    'deret beda sama': function (V) { var d = V[0][1] - V[0][0]; return V.every(function (b) { return b[1] - b[0] === d && b[2] - b[1] === d; }); },
    'latin': function (V) { var h = function (b) { return b.slice().sort(function (x, y) { return x - y; }).join(','); }; return h(V[0]) === h(V[1]) && h(V[1]) === h(V[2]); }
  };

  function aturanAngka(nama, slot, ambil) {
    var A = [];
    Object.keys(PERSAMAAN).forEach(function (nm) {
      A.push({ nama: nama + ' per baris: ' + nm, slot: slot, uji: function (G) { return ambil(G).every(PERSAMAAN[nm]); } });
      A.push({ nama: nama + ' per kolom: ' + nm, slot: slot, uji: function (G) { return balik(ambil(G)).every(PERSAMAAN[nm]); } });
    });
    Object.keys(LINTAS).forEach(function (nm) {
      A.push({ nama: nama + ' per baris: ' + nm, slot: slot, uji: function (G) { return LINTAS[nm](ambil(G)); } });
      A.push({ nama: nama + ' per kolom: ' + nm, slot: slot, uji: function (G) { return LINTAS[nm](balik(ambil(G))); } });
    });
    A.push({ nama: nama + ': aditif baris + kolom', slot: slot, uji: function (G) {
      var V = ambil(G);
      for (var r = 1; r < 3; r++) for (var c = 1; c < 3; c++) if (V[r][c] + V[0][0] !== V[r][0] + V[0][c]) return false;
      return true;
    } });
    return A;
  }

  function aturanJml(kanal, g) {
    var A = [], hitung = kanal.filter(function (k) { return k !== 'sisi'; });
    kanal.forEach(function (k) {
      A = A.concat(aturanAngka(k, [k], function (G) { return G.map(function (b) { return b.map(function (x) { return x[k]; }); }); }));
    });
    if (hitung.length >= 2) {
      // total semua unsur dihitung lewat kanal semu 'total'
      A = A.concat(aturanAngka('total unsur', ['total'], function (G) { return G.map(function (b) { return b.map(function (x) { return x.total; }); }); }));
    }
    var vis = tampak(g);
    for (var i = 0; i < kanal.length; i++) {
      for (var j = i + 1; j < kanal.length; j++) {
        (function (X, Y) {
          var d = vis[0][X] - vis[0][Y], s = vis[0][X] + vis[0][Y];
          if (vis.every(function (x) { return x[X] - x[Y] === d; })) A.push({ nama: X + ' - ' + Y + ' tetap ' + d, slot: [X, Y], uji: function (G) { return G.every(function (b) { return b.every(function (x) { return x[X] - x[Y] === d; }); }); } });
          if (vis.every(function (x) { return x[X] + x[Y] === s; })) A.push({ nama: X + ' + ' + Y + ' tetap ' + s, slot: [X, Y], uji: function (G) { return G.every(function (b) { return b.every(function (x) { return x[X] + x[Y] === s; }); }); } });
        })(kanal[i], kanal[j]);
      }
    }
    return A;
  }

  function periksaJml(b, m, alat) {
    var t = alat.bacaTampilan(b, m, 'mbentuk-jml', 'mbentuk-jml-opsi', function (x) { return x.fig || null; });
    if (!t) return;
    var g = t.soal.grid, tanya = t.soal.tanya;
    if (alat.sj(g) !== alat.sj(b.model.grid) || alat.sj(tanya) !== alat.sj(b.model.tanya)) m.push('matriks yang tergambar berbeda dari data model');
    if (!periksaMatriks(g, tanya, m)) return;
    var vis = tampak(g), kanal = Object.keys(vis[0]).sort(), salah = null, ragam = {};
    vis.forEach(function (x) { ragam[x && typeof x === 'object' ? Object.keys(x).sort().join() : '?'] = 1; });
    if (Object.keys(ragam).length > 1) { periksaCampur(b, m, alat, t, g, tanya); return; }
    vis.forEach(function (x) { if (!salah) salah = selJmlSah(x, kanal); });
    if (salah) { m.push('kotak matriks tidak sah: ' + salah); return; }
    t.opsi.forEach(function (x, i) { var e = selJmlSah(x, null); if (e) m.push('opsi ' + HURUF[i] + ' tidak dapat digambar dengan benar: ' + e); });
    var hitung = kanal.filter(function (k) { return k !== 'sisi'; }), pakaiTotal = hitung.length >= 2;
    // matriks dengan kanal semu 'total' (jumlah semua jenis unsur) pada kotak tampak
    var g2 = g.map(function (bb) { return bb.map(function (x) { if (!x) return null; var y = Object.assign({}, x); if (pakaiTotal) y.total = total(hitung.map(function (k) { return x[k]; })); return y; }); });
    var ranah = {};
    kanal.forEach(function (k) { ranah[k] = k === 'sisi' ? deret(3, 12) : deret(0, 20); });
    ranah.total = deret(0, 40);
    var aturan = aturanJml(kanal, g);
    var tr = tanya[0], tc = tanya[1];
    // calon: semua gabungan nilai kanal; total diturunkan dari kanal hitungan
    var r = tebakJml(g2, tr, tc, kanal, hitung, pakaiTotal, ranah, aturan);
    if (r.status !== 'unik') { m.push('matriks hitungan: ' + r.pesan); return; }
    var harus = kanonik(r.sel), cocok = [];
    t.opsi.forEach(function (x, i) { if (kanonik(x) === harus) cocok.push(i); });
    alat.tepatSatu(b, m, cocok, 'aturan hitungan unsur');
  }

  /**
   * Jenis unsur berganti antarkotak (tiap kotak satu jenis): kotak dibaca sebagai { jenis, n }. Jenis kotak
   * "?" ditebak dengan pustaka pola letak, banyaknya dengan pustaka aturan hitungan pada n saja.
   */
  function periksaCampur(b, m, alat, t, g, tanya) {
    var vis = tampak(g), salah = null;
    vis.forEach(function (x) {
      if (!salah) salah = selJmlSah(x, null);
      if (!salah && (Object.keys(x).length !== 1 || x.sisi != null)) salah = 'jenis unsur hanya boleh berganti bila tiap kotak berisi satu jenis unsur';
    });
    if (salah) { m.push('kotak matriks tidak sah: ' + salah); return; }
    t.opsi.forEach(function (x, i) { var e = selJmlSah(x, null); if (e) m.push('opsi ' + HURUF[i] + ' tidak dapat digambar dengan benar: ' + e); });
    var g2 = g.map(function (bb) { return bb.map(function (x) { if (!x) return null; var k = Object.keys(x)[0]; return { jenis: k, n: x[k] }; }); });
    var A = [];
    Object.keys(POLA).forEach(function (nm) { A.push({ nama: 'jenis unsur: ' + nm, slot: ['jenis'], uji: function (G) { return POLA[nm](nilaiSlot(G, 'jenis')); } }); });
    A = A.concat(aturanAngka('banyak unsur', ['n'], function (G) { return G.map(function (bb) { return bb.map(function (x) { return x.n; }); }); }));
    var r = tebak(g2, tanya[0], tanya[1], ['jenis', 'n'], { jenis: UNSUR, n: deret(0, 20) }, A, null);
    if (r.status !== 'unik') { m.push('matriks hitungan (jenis berganti): ' + r.pesan); return; }
    var sel = {};
    sel[r.sel.jenis] = r.sel.n;
    var harus = kanonik(sel), cocok = [];
    t.opsi.forEach(function (x, i) { if (kanonik(x) === harus) cocok.push(i); });
    alat.tepatSatu(b, m, cocok, 'aturan hitungan unsur');
  }

  /** Seperti `tebak`, tetapi kanal semu total ikut dicoba sendiri lalu dicocokkan dengan jumlah kanal hitungan. */
  function tebakJml(g, tr, tc, kanal, hitung, pakaiTotal, ranah, aturan) {
    var berlaku = [];
    aturan.forEach(function (at) {
      var lolos = {}, ada = false;
      kombinasi(at.slot, ranah).forEach(function (o) {
        if (at.uji(isiLubang(g, tr, tc, o))) { lolos[kanonik(o)] = 1; ada = true; }
      });
      if (ada) berlaku.push({ nama: at.nama, slot: at.slot, lolos: lolos });
    });
    var akhir = kombinasi(kanal, ranah).filter(function (o) {
      var penuh = Object.assign({}, o);
      if (pakaiTotal) penuh.total = total(hitung.map(function (k) { return o[k]; }));
      return berlaku.every(function (at) { var p = {}; at.slot.forEach(function (s) { p[s] = penuh[s]; }); return at.lolos[kanonik(p)]; });
    });
    if (akhir.length === 1) return { status: 'unik', sel: akhir[0] };
    if (!akhir.length) {
      var nama = berlaku.filter(function (at) { return Object.keys(at.lolos).length < kombinasi(at.slot, ranah).length; }).map(function (x) { return x.nama; });
      return { status: 'ambigu', pesan: 'aturan yang cocok dengan kotak tampak memberi isi tanda tanya yang berbeda (' + nama.slice(0, 6).join(', ') + ')' };
    }
    return { status: 'kurang', pesan: 'aturan yang terbaca belum menentukan isi tanda tanya (' + akhir.length + ' kemungkinan)' };
  }

  // ================================================================ sidik

  /** Matriks UTUH (lubang diisi gambar opsi kunci), satu bagian per kotak. */
  function sidikMatriks(b) {
    var gd = (b.stimulus.gambar || [])[0], ko = b.opsi && b.opsi[b.kunci] && b.opsi[b.kunci].gambar;
    var g = gd && gd.model ? gd.model.grid : b.model.grid, kunci = ko && ko.model ? ko.model.fig : null;
    var o = [];
    g.forEach(function (bb) { bb.forEach(function (x) { o.push(kanonik(x === null ? kunci : x)); }); });
    return o;
  }

  return {
    TIPE: {
      'matriks-luar-dalam': { periksa: periksaLD, sidik: sidikMatriks, batas: 1 },
      'matriks-jumlah': { periksa: periksaJml, sidik: sidikMatriks, batas: 1 }
    }
  };
});
