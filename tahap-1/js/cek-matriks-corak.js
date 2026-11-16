/*
 * cek-matriks-corak.js — pemeriksa independen untuk keluarga di matriks-corak.js (dipanggil validator.js).
 *
 * Pemeriksa TIDAK memakai kode penyusun (juga tidak corak.js) dan tidak membaca aturan yang disimpan
 * penyusun. Ia membaca matriks 3x3 dan kelima opsi yang TAMPIL (model gambar soal dan gambar opsi: bentuk,
 * arah garis belah atau cara pembagian, dan kode corak tiap belahan/bagian), lalu:
 *
 *   1. memeriksa bentuk datanya: 3x3, satu kotak kosong tepat di tanda tanya, nilai tiap kotak dan opsi sah
 *      (belahan: dua corak berbeda; pola: empat corak berbeda dalam satu kotak, sehingga tidak ada susunan
 *      yang sama dengan dirinya setelah diputar atau dicerminkan);
 *   2. menebak isi kotak "?" per kanal dengan pustaka aturannya sendiri. Sebuah aturan BERLAKU bila ada isi
 *      "?" yang membuatnya benar di seluruh matriks; isi "?" = irisan semua aturan yang berlaku. Irisan kosong
 *      berarti aturan-aturan yang cocok dengan kotak tampak saling bertentangan ("ambigu"); lebih dari satu
 *      calon berarti aturan belum menentukan isi kotak itu;
 *   3. memastikan pola tidak patah (aturan per garis yang berlaku pada kedua garis lengkap tetapi dilanggar
 *      kotak tampak pada garis bertanda tanya) dan pola utuh (ada arah baris/kolom yang garis-garisnya
 *      berpola kesamaan sama);
 *   4. memastikan tepat satu opsi sama dengan hasil tebakan, dan opsi itu kunci.
 *
 * Belahan bercorak: dua belahan hanya dapat dibandingkan langsung antara bangun yang garis belahnya searah.
 * Antara arah garis belah yang berbeda, sisi mana yang bersesuaian tidak tertulis di soal, jadi tebakan corak
 * dicoba untuk SEMUA cara memasangkan sisi (tiap arah boleh dibaca dengan sisi tertukar); jawaban yang berbeda
 * antar-cara = "ambigu". Selain itu, pada garis aturan corak (baris/kolom yang di setiap garisnya dua kotak
 * tertentu berbagi corak) arah garis belah wajib sama di sepanjang setiap garis.
 *
 * Pustaka aturan:
 *   pola letak      (semua kanal) sama semua, sama per baris, sama per kolom, latin baris, latin kolom,
 *                   diagonal, diagonal balik
 *   langkah         (arah garis belah) maju k langkah 45° melingkar per baris atau per kolom, k sama di semua
 *                   garis (bukan 0) atau k sendiri per garis
 *   pemetaan        (bentuk, arah, belahan) pada setiap baris (atau kolom), kanal X kotak ke-i sama dengan kanal
 *                   sejenis Y kotak ke-j; kedua belahan sejenis — mencakup gabung, geser, tukar, salin
 *   transformasi    (susunan empat bagian) kotak berikutnya = T(kotak sebelumnya) pada setiap garis, atau kotak
 *                   terakhir = T(kotak pertama); T = putar 0/90/180/270° atau cermin pada keempat sumbu, dengan
 *                   arah arsir tetap atau ikut berubah (dihitung sendiri: arsir bersudut a menjadi a - 90k bila
 *                   diputar 90k° searah jarum jam, dan 2s - a bila dicerminkan pada garis bersudut s)
 *   hitam berjalan  tepat satu bagian hitam per kotak, maju k bagian tiap kotak, bagian lain tetap sepanjang garis
 *   letak susunan   pola letak di atas untuk susunan utuh dan untuk tiap bagian sendiri-sendiri
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory();
    module.exports = api;
  } else {
    api = factory();
    root.CekMatriksCorak = api;
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var KODE = ['hitam', 'putih', 'titik', 'bintang', 'bulatan', 'kotak', 'kotak-miring', 'arsir-0', 'arsir-45', 'arsir-90', 'arsir-135'];
  var BENTUK_BELAH = ['lingkaran', 'persegi', 'segienam', 'belah-ketupat', 'perisai', 'kubah'];
  var BENTUK_POLA = ['persegi', 'lingkaran', 'segidelapan', 'belah-ketupat', 'segienam'];
  var ARAH = [0, 45, 90, 135];
  var BAGI = ['+', 'x'];

  function md(a, n) { return ((a % n) + n) % n; }
  function sj(x) { return JSON.stringify(x); }
  function balik(V) { return [0, 1, 2].map(function (i) { return [V[0][i], V[1][i], V[2][i]]; }); }
  function sisip(G, tr, tc, v) { return G.map(function (b, r) { return b.map(function (x, c) { return r === tr && c === tc ? v : x; }); }); }
  function ruas(G, arah, l) { return arah === 'baris' ? G[l].slice() : [G[0][l], G[1][l], G[2][l]]; }
  function ambil(G, f) { return G.map(function (b) { return b.map(function (x) { return x === null ? null : f(x); }); }); }
  function tampak(G) { var o = []; G.forEach(function (b) { b.forEach(function (x) { if (x !== null) o.push(x); }); }); return o; }
  function tanpaKembar(xs) { var o = []; xs.forEach(function (x) { if (o.indexOf(x) < 0) o.push(x); }); return o; }

  /** 3x3 dan tepat satu kotak null di tanda tanya. */
  function bentukMatriks(g, tanya, m) {
    if (!Array.isArray(g) || g.length !== 3 || g.some(function (b) { return !Array.isArray(b) || b.length !== 3; })) { m.push('matriks bukan 3x3'); return false; }
    if (!Array.isArray(tanya) || tanya.length !== 2) { m.push('letak tanda tanya tidak terbaca'); return false; }
    for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) {
      if ((g[r][c] === null) !== (r === tanya[0] && c === tanya[1])) { m.push('kotak kosong tidak sama dengan kotak tanda tanya (baris ' + (r + 1) + ', kolom ' + (c + 1) + ')'); return false; }
    }
    return true;
  }

  // ================================================================ aturan per kanal

  function semuaBeda(b) { return b[0] !== b[1] && b[1] !== b[2] && b[0] !== b[2]; }
  function kumpulan(b) { return b.map(String).sort().join('~'); }
  function diag(V, arah) {
    for (var d = 0; d < 3; d++) {
      var a = V[0][d], b = V[1][md(d + arah, 3)], c = V[2][md(d + 2 * arah, 3)];
      if (a !== b || b !== c) return false;
    }
    return true;
  }

  /** Pola letak: { nama, garis (arah garis untuk pemeriksaan pola patah, atau null), uji(V) }. */
  var LETAK = [
    { nama: 'sama semua', garis: null, uji: function (V) { var v = V[0][0]; return V.every(function (b) { return b.every(function (x) { return x === v; }); }); } },
    { nama: 'sama per baris', garis: 'baris', uji: function (V) { return V.every(function (b) { return b[0] === b[1] && b[1] === b[2]; }); } },
    { nama: 'sama per kolom', garis: 'kolom', uji: function (V) { return balik(V).every(function (b) { return b[0] === b[1] && b[1] === b[2]; }); } },
    { nama: 'latin baris', garis: 'baris', uji: function (V) { return V.every(semuaBeda) && kumpulan(V[0]) === kumpulan(V[1]) && kumpulan(V[1]) === kumpulan(V[2]); } },
    { nama: 'latin kolom', garis: 'kolom', uji: function (V) { var T = balik(V); return T.every(semuaBeda) && kumpulan(T[0]) === kumpulan(T[1]) && kumpulan(T[1]) === kumpulan(T[2]); } },
    { nama: 'diagonal', garis: null, uji: function (V) { return diag(V, 1); } },
    { nama: 'diagonal balik', garis: null, uji: function (V) { return diag(V, -1); } }
  ];

  /** Langkah melingkar pada daftar `urut` per baris/kolom: k sama di semua garis (bukan 0) atau bebas per garis. */
  function aturanLangkah(urut) {
    var o = [];
    ['baris', 'kolom'].forEach(function (arah) {
      [true, false].forEach(function (sama) {
        o.push({
          nama: 'langkah ' + (sama ? 'tetap' : 'bebas') + ' per ' + arah, garis: arah,
          uji: function (V) {
            var k = null;
            for (var l = 0; l < 3; l++) {
              var g = ruas(V, arah, l).map(function (v) { return urut.indexOf(v); });
              if (g.indexOf(-1) >= 0) return false;
              var a = md(g[1] - g[0], urut.length);
              if (md(g[2] - g[1], urut.length) !== a) return false;
              if (sama) { if (a === 0 || (k !== null && a !== k)) return false; k = a; }
            }
            return true;
          }
        });
      });
    });
    return o;
  }

  /**
   * Tebak satu kanal. `peta`: daftar grid kanal sejenis (termasuk kanal itu sendiri) untuk aturan pemetaan
   * sebaris/sekolom, atau [] tanpa pemetaan. Hasil { calon, berlaku: [nama] }.
   */
  function tebakKanal(V, tr, tc, ranah, aturan, peta) {
    var calon = ranah.slice(), berlaku = [];
    aturan.forEach(function (at) {
      var lolos = ranah.filter(function (v) { return at.uji(sisip(V, tr, tc, v)); });
      if (!lolos.length) return;
      berlaku.push(at.nama);
      calon = calon.filter(function (v) { return lolos.indexOf(v) >= 0; });
    });
    peta.forEach(function (Q) {
      ['baris', 'kolom'].forEach(function (arah) {
        var lq = arah === 'baris' ? tr : tc, posQ = arah === 'baris' ? tc : tr;
        for (var j = 0; j < 3; j++) {
          if (j === posQ) continue;
          var cocok = [0, 1, 2].every(function (l) { return l === lq || ruas(V, arah, l)[posQ] === ruas(Q, arah, l)[j]; });
          if (!cocok) continue;
          var v = ruas(Q, arah, lq)[j];
          berlaku.push('pemetaan ' + arah + ' dari kotak ke-' + (j + 1));
          calon = calon.filter(function (x) { return x === v; });
        }
      });
    });
    return { calon: calon, berlaku: berlaku };
  }

  /** Aturan per garis yang berlaku pada kedua garis lengkap tetapi patah pada garis bertanda tanya. */
  function patahKanal(V, tr, tc, ranah, aturan, peta) {
    var rL = tr === 0 ? 1 : 0, cL = tc === 0 ? 1 : 0, patah = [];
    var salinB = V.map(function (b, r) { return (r === tr ? V[rL] : b).slice(); });
    var salinK = V.map(function (b) { return b.map(function (x, c) { return c === tc ? b[cL] : x; }); });
    aturan.forEach(function (at) {
      if (!at.garis || !at.uji(at.garis === 'baris' ? salinB : salinK)) return;
      if (!ranah.some(function (v) { return at.uji(sisip(V, tr, tc, v)); })) patah.push(at.nama);
    });
    peta.forEach(function (Q, qi) {
      ['baris', 'kolom'].forEach(function (arah) {
        var lq = arah === 'baris' ? tr : tc, posQ = arah === 'baris' ? tc : tr;
        for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) {
          if (i === posQ || j === posQ || (qi === 0 && i === j)) continue;
          var lengkap = [0, 1, 2].every(function (l) { return l === lq || ruas(V, arah, l)[i] === ruas(Q, arah, l)[j]; });
          if (lengkap && ruas(V, arah, lq)[i] !== ruas(Q, arah, lq)[j]) patah.push('pemetaan ' + arah + ' kotak ke-' + (i + 1) + ' dan ke-' + (j + 1));
        }
      });
    });
    return patah;
  }

  /** Pola kesamaan satu garis untuk sekelompok kanal: tiap pasangan (kotak, kanal) bernilai =, x, atau ?. */
  function sidikGaris(kanal, arah, l) {
    var nilai = [];
    for (var i = 0; i < 3; i++) kanal.forEach(function (V) { nilai.push(ruas(V, arah, l)[i]); });
    var o = '';
    for (var p = 0; p < nilai.length; p++) for (var q = p + 1; q < nilai.length; q++) o += nilai[p] === null || nilai[q] === null ? '?' : (nilai[p] === nilai[q] ? '=' : 'x');
    return o;
  }

  /** Pola utuh; `bermakna`: pola kesamaan garis lengkap harus memuat sedikitnya satu kesamaan antarkotak. */
  function utuhKanal(kanal, tr, tc, bermakna) {
    return ['baris', 'kolom'].some(function (arah) {
      var lq = arah === 'baris' ? tr : tc, s = [0, 1, 2].map(function (l) { return sidikGaris(kanal, arah, l); });
      var lengkap = s.filter(function (x, l) { return l !== lq; });
      if (lengkap[0] !== lengkap[1]) return false;
      if (bermakna && lengkap[0].indexOf('=') < 0) return false;
      for (var k = 0; k < s[lq].length; k++) if (s[lq][k] !== '?' && s[lq][k] !== lengkap[0][k]) return false;
      return true;
    });
  }

  // ================================================================ belahan bercorak

  function cekSelBelah(x) {
    if (!x || typeof x !== 'object') return 'bukan kotak';
    if (Object.keys(x).sort().join() !== 'arah,bentuk,corak') return 'isi kotak tidak dikenal (' + Object.keys(x).join(',') + ')';
    if (BENTUK_BELAH.indexOf(x.bentuk) < 0) return 'bentuk tidak dikenal: ' + x.bentuk;
    if (ARAH.indexOf(x.arah) < 0) return 'arah garis belah tidak dikenal: ' + x.arah;
    if (!Array.isArray(x.corak) || x.corak.length !== 2) return 'corak belahan harus dua';
    if (x.corak.some(function (k) { return KODE.indexOf(k) < 0; })) return 'kode corak tidak dikenal: ' + x.corak.join(',');
    if (x.corak[0] === x.corak[1]) return 'kedua belahan bercorak sama, sehingga garis belahnya tidak bermakna';
    return null;
  }

  function samaBelah(x, y) { return x.bentuk === y.bentuk && x.arah === y.arah && x.corak[0] === y.corak[0] && x.corak[1] === y.corak[1]; }

  function periksaBelahan(b, m, alat) {
    var t = alat.bacaTampilan(b, m, 'mcorak-belahan', 'mcorak-belahan-opsi', function (x) { return x.fig; });
    if (!t) return;
    var g = t.soal.grid, tanya = t.soal.tanya;
    if (sj(g) !== sj(b.model.grid) || sj(tanya) !== sj(b.model.tanya)) m.push('matriks yang tergambar berbeda dari data model');
    if (!bentukMatriks(g, tanya, m)) return;
    var tr = tanya[0], tc = tanya[1], galat = null;
    tampak(g).forEach(function (x) { galat = galat || cekSelBelah(x); });
    t.opsi.forEach(function (x, i) { var e = cekSelBelah(x); if (e && !galat) galat = 'opsi ' + alat.HURUF[i] + ': ' + e; });
    if (galat) { m.push('belahan bercorak tidak sah: ' + galat); return; }

    var Kb = ambil(g, function (x) { return x.bentuk; }), Ka = ambil(g, function (x) { return x.arah; });
    var hasil = {}, salah = false;
    [{ nama: 'bentuk', V: Kb, ranah: BENTUK_BELAH, aturan: LETAK, kunci: 'bentuk' },
      { nama: 'garis belah', V: Ka, ranah: ARAH, aturan: LETAK.concat(aturanLangkah(ARAH)), kunci: 'arah' }].forEach(function (kn) {
      var h = tebakKanal(kn.V, tr, tc, kn.ranah, kn.aturan, [kn.V]);
      if (!h.calon.length) { m.push('ambigu: aturan ' + kn.nama + ' yang cocok dengan kotak tampak memberi isi tanda tanya yang berbeda (' + h.berlaku.slice(0, 5).join(', ') + ')'); salah = true; }
      else if (h.calon.length > 1) { m.push('ambigu: aturan ' + kn.nama + ' yang terbaca belum menentukan isi tanda tanya (' + h.calon.length + ' kemungkinan)'); salah = true; }
      hasil[kn.kunci] = h.calon[0];
      var p = patahKanal(kn.V, tr, tc, kn.ranah, kn.aturan, [kn.V]);
      if (p.length) { m.push('pola ' + kn.nama + ' patah pada garis bertanda tanya (' + p.slice(0, 3).join(', ') + ')'); salah = true; }
    });
    if (!utuhKanal([Kb], tr, tc)) { m.push('pola bentuk tidak utuh'); salah = true; }
    if (!utuhKanal([Ka], tr, tc)) { m.push('pola garis belah tidak utuh'); salah = true; }
    if (salah) return;

    // Corak: belahan hanya dapat dibandingkan langsung antara bangun yang garis belahnya searah. Antara arah yang
    // berbeda, sisi mana yang bersesuaian tidak tertulis di soal, jadi SEMUA cara memasangkan sisi dicoba; jawaban
    // harus sama untuk setiap cara yang membuat aturan corak terbaca.
    var arahAda = tanpaKembar(tampak(Ka).concat([hasil.arah])).sort(function (x, y) { return x - y; });
    var dugaan = [], masalahAsli = [];
    for (var mask = 0; mask < (1 << (arahAda.length - 1)); mask++) {
      var tukar = {};
      arahAda.forEach(function (v, i) { tukar[v] = i > 0 && ((mask >> (i - 1)) & 1) === 1; });
      var r = corakDenganPasangan(g, tr, tc, tukar, hasil.arah);
      if (mask === 0) masalahAsli = r.masalah;
      if (r.tebak && !dugaan.some(function (d) { return d[0] === r.tebak[0] && d[1] === r.tebak[1]; })) dugaan.push(r.tebak);
    }
    if (!dugaan.length) { masalahAsli.forEach(function (x) { m.push(x); }); return; }
    if (dugaan.length > 1) { m.push('ambigu: jawaban bergantung pada cara memasangkan sisi belahan antara garis belah yang arahnya berbeda (' + dugaan.length + ' kemungkinan)'); return; }
    var tebak = { bentuk: hasil.bentuk, arah: hasil.arah, corak: dugaan[0] };

    // Garis aturan corak (baris/kolom yang di setiap garisnya dua kotak tertentu berbagi corak): arah garis belah
    // harus sama di sepanjang setiap garisnya.
    var penuh = sisip(g, tr, tc, tebak), garisCorak = [], berubah = [];
    ['baris', 'kolom'].forEach(function (arah) {
      var terkait = false;
      for (var i = 0; i < 3; i++) for (var j = i + 1; j < 3; j++) {
        if ([0, 1, 2].every(function (l) { var rr = ruas(penuh, arah, l); return rr[i].corak.some(function (v) { return rr[j].corak.indexOf(v) >= 0; }); })) terkait = true;
      }
      if (!terkait) return;
      garisCorak.push(arah);
      if ([0, 1, 2].some(function (l) { var rr = ruas(penuh, arah, l); return rr[0].arah !== rr[1].arah || rr[1].arah !== rr[2].arah; })) berubah.push(arah);
    });
    if (!garisCorak.length) { m.push('tidak ada baris atau kolom yang coraknya berpindah antarkotak'); return; }
    if (berubah.length) { m.push('arah garis belah berubah di dalam garis aturan corak (per ' + berubah.join(' dan ') + '), sehingga sisi belahan yang bersesuaian tidak tertulis di soal'); return; }
    var cocok = [];
    t.opsi.forEach(function (x, i) { if (samaBelah(x, tebak)) cocok.push(i); });
    alat.tepatSatu(b, m, cocok, 'aturan belahan bercorak');
  }

  /**
   * Tebakan corak belahan "?" untuk satu cara memasangkan sisi: `tukar[arah]` = kedua belahan bangun bergaris belah
   * itu dibaca dengan sisi tertukar. Hasil { tebak: [corak sisi pertama, kedua] dalam data asli, atau null, masalah }.
   */
  function corakDenganPasangan(g, tr, tc, tukar, arahQ) {
    var G2 = ambil(g, function (x) { return tukar[x.arah] ? { bentuk: x.bentuk, arah: x.arah, corak: [x.corak[1], x.corak[0]] } : x; });
    var A = ambil(G2, function (x) { return x.corak[0]; }), B = ambil(G2, function (x) { return x.corak[1]; }), masalah = [], hasil = [];
    [{ nama: 'belahan sisi pertama', V: A, peta: [A, B] }, { nama: 'belahan sisi kedua', V: B, peta: [B, A] }].forEach(function (kn) {
      var h = tebakKanal(kn.V, tr, tc, KODE, LETAK, kn.peta);
      if (!h.calon.length) masalah.push('ambigu: aturan ' + kn.nama + ' yang cocok dengan kotak tampak memberi isi tanda tanya yang berbeda (' + h.berlaku.slice(0, 5).join(', ') + ')');
      else if (h.calon.length > 1) masalah.push('ambigu: aturan ' + kn.nama + ' yang terbaca belum menentukan isi tanda tanya (' + h.calon.length + ' kemungkinan)');
      hasil.push(h.calon[0]);
      var p = patahKanal(kn.V, tr, tc, KODE, LETAK, kn.peta);
      if (p.length) masalah.push('pola ' + kn.nama + ' patah pada garis bertanda tanya (' + p.slice(0, 3).join(', ') + ')');
    });
    if (!utuhKanal([A, B], tr, tc, true)) masalah.push('pola corak belahan tidak utuh: tidak ada arah baris/kolom yang garis-garisnya berpola sama');
    if (!masalah.length && hasil[0] === hasil[1]) masalah.push('tebakan isi tanda tanya memberi dua belahan bercorak sama');
    if (masalah.length) return { tebak: null, masalah: masalah };
    return { tebak: tukar[arahQ] ? [hasil[1], hasil[0]] : [hasil[0], hasil[1]], masalah: [] };
  }

  // ================================================================ pola corak empat bagian

  function cekSelPola(x) {
    if (!x || typeof x !== 'object') return 'bukan kotak';
    if (Object.keys(x).sort().join() !== 'bagi,bentuk,corak') return 'isi kotak tidak dikenal (' + Object.keys(x).join(',') + ')';
    if (BENTUK_POLA.indexOf(x.bentuk) < 0) return 'bentuk tidak dikenal: ' + x.bentuk;
    if (BAGI.indexOf(x.bagi) < 0) return 'cara pembagian tidak dikenal: ' + x.bagi;
    if (!Array.isArray(x.corak) || x.corak.length !== 4) return 'bangun harus terbagi empat bagian';
    if (x.corak.some(function (k) { return KODE.indexOf(k) < 0; })) return 'kode corak tidak dikenal: ' + x.corak.join(',');
    if (tanpaKembar(x.corak).length !== 4) return 'ada dua bagian bercorak sama dalam satu kotak (susunan bisa sama setelah diputar atau dicerminkan)';
    return null;
  }

  function sudutArsir(kode) { var r = /^arsir-(\d+)$/.exec(kode); return r ? +r[1] : null; }
  /** Bagian diputar 90k° searah jarum jam: garis arsir bersudut a menjadi a - 90k; corak lain tetap. */
  function arsirDiputar(kode, k) { var a = sudutArsir(kode); return a === null ? kode : 'arsir-' + md(a - 90 * k, 180); }
  /** Bagian dicerminkan pada garis bersudut s: garis arsir bersudut a menjadi 2s - a; corak lain tetap. */
  function arsirDicermin(kode, s) { var a = sudutArsir(kode); return a === null ? kode : 'arsir-' + md(2 * s - a, 180); }

  /**
   * Transformasi susunan empat bagian. Bagian ke-p berpusat pada sudut jam off + 90p (off 45° untuk
   * pembagian "+", 0° untuk "x"). Putar k: bagian p ke p + k. Cermin c: bagian p ke c - p, yaitu
   * pencerminan pada sumbu bersudut jam off + 45c (bersudut 90 - itu dari mendatar).
   */
  function transformasi(bagi) {
    var off = bagi === '+' ? 45 : 0, daftar = [];
    function putar(t, k, ikut) { var o = []; for (var p = 0; p < 4; p++) o[md(p + k, 4)] = ikut ? arsirDiputar(t[p], k) : t[p]; return o; }
    [0, 1, 2, 3].forEach(function (k) {
      [false, true].forEach(function (ikut) {
        if (k === 0 && ikut) return;
        daftar.push({ nama: 'putar ' + (90 * k) + '°' + (ikut ? ' arsir ikut' : ''), maju: function (t) { return putar(t, k, ikut); }, mundur: function (t) { return putar(t, -k, ikut); } });
      });
    });
    [0, 1, 2, 3].forEach(function (c) {
      var s = md(90 - (off + 45 * c), 180);
      [false, true].forEach(function (ikut) {
        var f = function (t) { var o = []; for (var p = 0; p < 4; p++) o[md(c - p, 4)] = ikut ? arsirDicermin(t[p], s) : t[p]; return o; };
        daftar.push({ nama: 'cermin sumbu ' + s + '°' + (ikut ? ' arsir ikut' : ''), maju: f, mundur: f });
      });
    });
    return daftar;
  }

  function samaT(x, y) { for (var p = 0; p < 4; p++) if (x[p] !== y[p]) return false; return true; }

  /** Aturan transformasi per garis: { tebakan: [{nama, isi}], patah: [nama] }. */
  function aturanTransformasi(C, tr, tc, bagi) {
    var tebakan = [], patah = [], perLangkah = [];
    transformasi(bagi).forEach(function (T) {
      ['baris', 'kolom'].forEach(function (arah) {
        var lq = arah === 'baris' ? tr : tc, pq = arah === 'baris' ? tc : tr, l, g;
        var langkah = true, ujung = true;
        for (l = 0; l < 3; l++) {
          if (l === lq) continue;
          g = ruas(C, arah, l);
          if (!samaT(T.maju(g[0]), g[1]) || !samaT(T.maju(g[1]), g[2])) langkah = false;
          if (!samaT(T.maju(g[0]), g[2])) ujung = false;
        }
        g = ruas(C, arah, lq);
        if (langkah) {
          var dugaan = [], taat = true;
          if (g[0] && g[1] && !samaT(T.maju(g[0]), g[1])) taat = false;
          if (g[1] && g[2] && !samaT(T.maju(g[1]), g[2])) taat = false;
          if (pq > 0) dugaan.push(T.maju(g[pq - 1]));
          if (pq < 2) dugaan.push(T.mundur(g[pq + 1]));
          if (dugaan.length === 2 && !samaT(dugaan[0], dugaan[1])) taat = false;
          if (taat) { tebakan.push({ nama: T.nama + ' tiap kotak per ' + arah, isi: dugaan[0] }); perLangkah.push(T.nama); }
          else patah.push(T.nama + ' tiap kotak per ' + arah);
        }
        if (ujung) {
          if (pq === 1) { if (!samaT(T.maju(g[0]), g[2])) patah.push(T.nama + ' ujung ke ujung per ' + arah); }
          else tebakan.push({ nama: T.nama + ' ujung ke ujung per ' + arah, isi: pq === 2 ? T.maju(g[0]) : T.mundur(g[2]) });
        }
      });
    });
    return { tebakan: tebakan, patah: patah, perLangkah: perLangkah };
  }

  /** Hitam berjalan per garis (arah, k): susunan tebakan (bagian yang tak terlihat = null) atau null bila tidak berlaku. */
  function hitamBerjalan(C, tr, tc, arah, k) {
    function letakHitam(t) { var o = []; t.forEach(function (v, p) { if (v === 'hitam') o.push(p); }); return o.length === 1 ? o[0] : -1; }
    for (var l = 0; l < 3; l++) {
      var g = ruas(C, arah, l), h = [];
      for (var i = 0; i < 3; i++) { h.push(g[i] ? letakHitam(g[i]) : null); if (g[i] && h[i] < 0) return null; }
      for (var a = 0; a < 3; a++) for (var b = a + 1; b < 3; b++) {
        if (!g[a] || !g[b]) continue;
        if (md(h[b] - h[a], 4) !== md(k * (b - a), 4)) return null;
        for (var p = 0; p < 4; p++) if (p !== h[a] && p !== h[b] && g[a][p] !== g[b][p]) return null;
      }
    }
    var lq = arah === 'baris' ? tr : tc, pq = arah === 'baris' ? tc : tr, gq = ruas(C, arah, lq), isi = [null, null, null, null], hq = -1;
    gq.forEach(function (t, j) { if (t && hq < 0) hq = md(letakHitam(t) + k * (pq - j), 4); });
    isi[hq] = 'hitam';
    for (var q = 0; q < 4; q++) {
      if (q === hq) continue;
      gq.forEach(function (t) { if (t && isi[q] === null && letakHitam(t) !== q) isi[q] = t[q]; });
    }
    return isi;
  }

  function samaPola(x, y) { return x.bentuk === y.bentuk && x.bagi === y.bagi && samaT(x.corak, y.corak); }

  function periksaPola(b, m, alat) {
    var t = alat.bacaTampilan(b, m, 'mcorak-pola', 'mcorak-pola-opsi', function (x) { return x.fig; });
    if (!t) return;
    var g = t.soal.grid, tanya = t.soal.tanya;
    if (sj(g) !== sj(b.model.grid) || sj(tanya) !== sj(b.model.tanya)) m.push('matriks yang tergambar berbeda dari data model');
    if (!bentukMatriks(g, tanya, m)) return;
    var tr = tanya[0], tc = tanya[1], galat = null;
    tampak(g).forEach(function (x) { galat = galat || cekSelPola(x); });
    t.opsi.forEach(function (x, i) { var e = cekSelPola(x); if (e && !galat) galat = 'opsi ' + alat.HURUF[i] + ': ' + e; });
    if (galat) { m.push('pola corak tidak sah: ' + galat); return; }

    var Kb = ambil(g, function (x) { return x.bentuk; }), Kd = ambil(g, function (x) { return x.bagi; }), C = ambil(g, function (x) { return x.corak; });
    var salah = false, hasil = {};
    [{ nama: 'bentuk', V: Kb, ranah: BENTUK_POLA, kunci: 'bentuk' }, { nama: 'pembagian', V: Kd, ranah: BAGI, kunci: 'bagi' }].forEach(function (kn) {
      var h = tebakKanal(kn.V, tr, tc, kn.ranah, LETAK, [kn.V]);
      if (h.calon.length !== 1) { m.push((h.calon.length ? 'ambigu: aturan ' + kn.nama + ' belum menentukan isi tanda tanya (' + h.calon.length + ' kemungkinan)' : 'ambigu: aturan ' + kn.nama + ' saling bertentangan (' + h.berlaku.slice(0, 5).join(', ') + ')')); salah = true; }
      hasil[kn.kunci] = h.calon[0];
      var p = patahKanal(kn.V, tr, tc, kn.ranah, LETAK, [kn.V]);
      if (p.length) { m.push('pola ' + kn.nama + ' patah pada garis bertanda tanya (' + p.slice(0, 3).join(', ') + ')'); salah = true; }
    });
    if (!utuhKanal([Kb], tr, tc)) { m.push('pola bentuk tidak utuh'); salah = true; }
    if (salah) return;
    if (tampak(g).some(function (x) { return x.bagi !== hasil.bagi; })) { m.push('cara pembagian bangun tidak seragam'); return; }

    // susunan corak
    var tetap = [null, null, null, null], asal = [null, null, null, null], bentrok = [];
    function pasang(isi, nama) {
      isi.forEach(function (v, p) {
        if (v === null) return;
        if (tetap[p] === null) { tetap[p] = v; asal[p] = nama; }
        else if (tetap[p] !== v) bentrok.push(nama + ' lawan ' + asal[p]);
      });
    }
    var tr2 = aturanTransformasi(C, tr, tc, hasil.bagi);
    tr2.tebakan.forEach(function (x) { pasang(x.isi, x.nama); });
    if (tr2.patah.length) { m.push('pola susunan corak patah pada garis bertanda tanya (' + tr2.patah.slice(0, 3).join(', ') + ')'); return; }
    // aturan yang menjelaskan SETIAP kotak: transformasi tiap kotak, hitam berjalan, atau pola letak di keempat bagian
    var menjelaskan = tr2.perLangkah.length, letakBagian = 0;
    ['baris', 'kolom'].forEach(function (arah) {
      [1, 3].forEach(function (k) { var h = hitamBerjalan(C, tr, tc, arah, k); if (h) { pasang(h, 'hitam berjalan ' + (k === 1 ? 'searah' : 'berlawanan') + ' per ' + arah); menjelaskan++; } });
    });
    var teks = ambil(C, function (x) { return x.join('|'); }), ranahT = tanpaKembar(tampak(teks));
    LETAK.forEach(function (at) {
      var lolos = ranahT.filter(function (v) { return at.uji(sisip(teks, tr, tc, v)); });
      if (lolos.length === 1) pasang(lolos[0].split('|'), at.nama + ' (susunan utuh)');
      else if (lolos.length > 1) bentrok.push(at.nama + ' (susunan utuh) membolehkan ' + lolos.length + ' susunan');
    });
    for (var p = 0; p < 4; p++) {
      var Vp = ambil(C, function (x) { return x[p]; }), h = tebakKanal(Vp, tr, tc, KODE, LETAK, []);
      if (h.berlaku.length) letakBagian++;
      if (tetap[p] !== null) { if (h.calon.indexOf(tetap[p]) < 0) bentrok.push('pola letak bagian ke-' + (p + 1) + ' lawan ' + asal[p]); }
      else if (h.calon.length === 1) tetap[p] = h.calon[0];
    }
    if (!menjelaskan && letakBagian < 4) { m.push('pola susunan corak tidak utuh: tidak ada aturan yang menjelaskan semua kotak (putaran/cermin tiap kotak, hitam berjalan, atau pola letak tiap bagian)'); return; }
    if (bentrok.length) { m.push('ambigu: aturan yang cocok dengan kotak tampak memberi susunan corak berbeda (' + bentrok.slice(0, 3).join('; ') + ')'); return; }
    if (tetap.some(function (v) { return v === null; })) { m.push('ambigu: aturan yang terbaca belum menentukan susunan corak kotak tanda tanya'); return; }
    if (tanpaKembar(tetap).length !== 4) { m.push('tebakan susunan corak memuat dua bagian bercorak sama'); return; }
    var tebak = { bentuk: hasil.bentuk, bagi: hasil.bagi, corak: tetap }, cocok = [];
    t.opsi.forEach(function (x, i) { if (samaPola(x, tebak)) cocok.push(i); });
    alat.tepatSatu(b, m, cocok, 'aturan pola corak');
  }

  // ================================================================ sidik

  /** Matriks UTUH (lubang diisi gambar opsi kunci), satu bagian per kotak. */
  function sidikMatriks(b) {
    var gd = (b.stimulus.gambar || [])[0], ko = b.opsi && b.opsi[b.kunci] && b.opsi[b.kunci].gambar;
    var g = gd && gd.model ? gd.model.grid : b.model.grid, kunci = ko && ko.model ? ko.model.fig : null, o = [];
    g.forEach(function (bb) {
      bb.forEach(function (x) {
        var y = x === null ? kunci : x;
        o.push(y ? [y.bentuk, y.arah !== undefined ? y.arah : y.bagi, (y.corak || []).join('+')].join('.') : '-');
      });
    });
    return o;
  }

  return {
    TIPE: {
      'matriks-belahan': { periksa: periksaBelahan, sidik: sidikMatriks, batas: 1 },
      'matriks-corak-pola': { periksa: periksaPola, sidik: sidikMatriks, batas: 1 }
    }
  };
});
