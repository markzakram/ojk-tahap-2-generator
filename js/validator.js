/*
 * validator.js — pemeriksa INDEPENDEN: tiap butir dihitung ulang dari nol.
 *
 * Validator tidak memercayai kunci yang tersimpan, tidak memanggil kode penyusun
 * butir, dan tidak memakai bilangan JavaScript untuk hitungan kunci: semuanya
 * pecahan eksak (`Hitung`). Yang dipakainya hanyalah DATA butir (model, fakta,
 * langkah) dan gambar yang BENAR-BENAR tergambar:
 *
 *   cerita      menghitung ulang `langkah` dengan pecahan eksak, mencocokkan angka
 *               yang tercetak di soal dengan angka yang dihitung, dan memastikan
 *               hanya satu opsi yang bernilai sama dengan hasil
 *   tabel       membaca sel dari SVG tabel (bukan dari data penyusun) lalu menghitung
 *   grafik      membaca batang dari SVG, mengukur tingginya terhadap garis bantu,
 *               lalu menghitung
 *   verbal      menurunkan Benar/Salah/Tidak Diketahui dari fakta yang dirakit
 *   figural     menebak aturan tiap kanal dari kotak yang tampak (Inferensi) dan
 *               memastikan tepat satu opsi yang memenuhi semuanya
 *   interaktif  menghitung ulang kondisi akhir (batang, tab, titik, irisan)
 *
 * Satu butir lulus bila masalahnya kosong. Paket dan seluruh hasil generate
 * diperiksa lagi untuk komposisi, sebaran, dan butir kembar.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./hitung.js'), require('./svgraster.js'), require('./inferensi.js'), require('./figure.js'), require('./gambar.js'));
    module.exports = api;
  } else {
    api = factory(root.Hitung, root.SvgRaster, root.Inferensi, root.Figure, root.Gambar);
    root.Validator = api;
  }
})(typeof self !== 'undefined' ? self : this, function (H, SvgRaster, Inf, Fig, Gambar) {
  'use strict';

  var BULAN = ['januari', 'februari', 'maret', 'april', 'mei', 'juni', 'juli', 'agustus', 'september', 'oktober', 'november', 'desember'];
  var HURUF = ['A', 'B', 'C', 'D', 'E'];
  var LEVEL = ['mudah', 'sedang', 'sulit'];

  // ------------------------------------------------------------------ pembaca angka

  /** Baca angka dari teks opsi/sel: "1.234,5", "$119,50", "£0,0004", "20%", "3/8 cangkir", "1:7". */
  function urai(teks) {
    var t = String(teks == null ? '' : teks).replace(/ /g, ' ').trim();
    var m = /^(\d+):(\d+)$/.exec(t);
    if (m) return { tipe: 'rasio', q: H.Q(BigInt(m[1]), BigInt(m[2])) };
    m = /^([+-]?\d+)\s*\/\s*(\d+)(?!\d)/.exec(t);
    if (m) return { tipe: 'angka', q: H.Q(BigInt(m[1]), BigInt(m[2])) };
    var s = t.replace(/^([+-]?)\s*[$€£]\s*/, function (_, tanda) { return tanda; });
    m = /^([+-]?)(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d+))?/.exec(s);
    if (!m) return null;
    var digit = m[2].replace(/\./g, '') + (m[3] ? '.' + m[3] : '');
    return { tipe: 'angka', q: H.q((m[1] === '-' ? '-' : '') + digit) };
  }

  function sama(q1, q2, tol) {
    if (!tol) return H.sama(q1, q2);
    return H.banding(H.mutlak(H.kurang(q1, q2)), H.q(tol)) <= 0;
  }

  function nilaiAngka(q) { return H.keAngka(q); }

  // ------------------------------------------------------------------ pembaca SVG

  function telusuri(node, fn) {
    fn(node);
    node.anak.forEach(function (c) { telusuri(c, fn); });
  }

  function pohon(svg) {
    var akar = SvgRaster.urai(svg), el = null;
    akar.anak.forEach(function (c) { if (c.tag === 'svg') el = c; });
    return el;
  }

  /** Sel tabel dari atribut data-sel: { 'baris,kolom': teks }. */
  function bacaTabel(svg) {
    var sel = {}, semuaTeks = [];
    telusuri(pohon(svg), function (n) {
      if (n.tag !== 'text') return;
      var tx = n.teks.replace(/\s+/g, ' ').trim();
      semuaTeks.push(tx);
      if (n.attr['data-sel'] !== undefined) {
        var kunci = n.attr['data-sel'];
        sel[kunci] = sel[kunci] ? sel[kunci] + ' ' + tx : tx;
      }
    });
    return { sel: sel, teks: semuaTeks.join(' ') };
  }

  /** Batang (rect dengan data-v) dan garis bantu (line dengan data-grid) dari grafik. */
  function bacaBatang(svg) {
    var batang = [], grid = [];
    telusuri(pohon(svg), function (n) {
      if (n.tag === 'rect' && n.attr['data-v'] !== undefined) {
        batang.push({ v: n.attr['data-v'], s: parseInt(n.attr['data-s'] || '0', 10), k: parseInt(n.attr['data-k'] || '0', 10), y: parseFloat(n.attr.y), h: parseFloat(n.attr.height) });
      }
      if (n.tag === 'line' && n.attr['data-grid'] !== undefined) grid.push({ v: parseFloat(n.attr['data-grid']), y: parseFloat(n.attr.y1) });
    });
    return { batang: batang, grid: grid };
  }

  /** piksel per satuan dan y garis nol dari dua garis bantu; null bila tak ada. */
  function skalaGrid(grid) {
    if (grid.length < 2) return null;
    var g = grid.slice().sort(function (a, b) { return a.v - b.v; });
    var g0 = g[0], g1 = g[g.length - 1];
    if (g1.v === g0.v) return null;
    return { px: (g0.y - g1.y) / (g1.v - g0.v), y0: g0.y, v0: g0.v };
  }

  // ------------------------------------------------------------------ pemeriksaan umum

  function ulangiTeks(b) {
    var t = (b.stimulus.teks || []).join(' ') + ' ' + (b.pertanyaan || '') + ' ' + (b.perintah || '');
    return t;
  }

  function periksaUmum(b, m) {
    if (!b || typeof b !== 'object') { m.push('butir bukan objek'); return false; }
    if (['ku', 'pn'].indexOf(b.subtes) < 0) m.push('subtes tidak dikenal: ' + b.subtes);
    if (LEVEL.indexOf(b.level) < 0) m.push('tingkat kesulitan tidak dikenal: ' + b.level);
    if (!b.submateri) m.push('submateri kosong');
    if (!b.keluarga) m.push('keluarga soal kosong');
    if (!b.pembahasan || !b.pembahasan.length) m.push('pembahasan kosong');
    var gambar = Gambar.daftarSoal(b).concat(Gambar.daftarPembahasan(b));
    var ids = {};
    gambar.forEach(function (g) {
      if (ids[g.id]) m.push('gambar berjudul ganda: ' + g.id);
      ids[g.id] = 1;
      try {
        var r = Gambar.svg(g);
        if (!r || !r.svg || r.svg.indexOf('<svg') !== 0) m.push('gambar ' + g.id + ' tidak menghasilkan SVG');
        else if (!pohon(r.svg)) m.push('gambar ' + g.id + ' bukan SVG yang terbaca');
      } catch (e) { m.push('gambar ' + g.id + ' gagal digambar: ' + e.message); }
    });
    return true;
  }

  function periksaPilihan(b, m, jumlah) {
    if (!b.opsi || b.opsi.length !== jumlah) { m.push('jumlah opsi ' + (b.opsi ? b.opsi.length : 0) + ', seharusnya ' + jumlah); return false; }
    if (!(b.kunci >= 0 && b.kunci < b.opsi.length)) { m.push('indeks kunci di luar pilihan'); return false; }
    var teks = {};
    b.opsi.forEach(function (o, i) {
      if (o.huruf !== HURUF[i]) m.push('huruf opsi ke-' + (i + 1) + ' keliru: ' + o.huruf);
      var kunci = String(o.teks).toLowerCase().replace(/\s+/g, ' ');
      if (teks[kunci] !== undefined && !o.gambar) m.push('opsi ' + HURUF[teks[kunci]] + ' dan ' + HURUF[i] + ' bertuliskan sama: ' + o.teks);
      teks[kunci] = i;
    });
    var akhir = b.pembahasan[b.pembahasan.length - 1] || '';
    if (akhir.indexOf('Jawaban: ' + HURUF[b.kunci]) !== 0) m.push('baris "Jawaban" pada pembahasan tidak cocok dengan kunci ' + HURUF[b.kunci]);
    return true;
  }

  // ------------------------------------------------------------------ numerik

  function bangunEnv(b, m, info) {
    var env = {}, mod = b.model || {};
    Object.keys(mod.param || {}).forEach(function (k) {
      try { env[k] = H.q(mod.param[k]); } catch (e) { m.push('param ' + k + ' tidak terbaca: ' + mod.param[k]); }
    });
    (b.stimulus.gambar || []).forEach(function (g) {
      var r;
      try { r = Gambar.svg(g); } catch (e) { return; }
      if (g.jenis === 'tabel') {
        var tb = bacaTabel(r.svg);
        info.tabel = tb;
        Object.keys(tb.sel).forEach(function (kunci) {
          var p = kunci.split(','), baris = parseInt(p[0], 10), kol = parseInt(p[1], 10);
          if (baris < 0 || kol < 1) return;
          var u = urai(tb.sel[kunci]);
          if (u && u.tipe === 'angka') env['t' + baris + '_' + kol] = u.q;
        });
      }
      if (g.jenis === 'bar') {
        var br = bacaBatang(r.svg), sk = skalaGrid(br.grid);
        info.bar = br;
        br.batang.forEach(function (bt) {
          var q;
          try { q = H.q(bt.v); } catch (e) { m.push('nilai batang tidak terbaca: ' + bt.v); return; }
          if (sk) {
            var terukur = bt.h / sk.px;
            if (Math.abs(terukur - nilaiAngka(q)) > Math.max(0.01, Math.abs(nilaiAngka(q)) * 0.005)) {
              m.push('tinggi batang s' + bt.s + ' k' + bt.k + ' pada gambar setara ' + terukur.toFixed(2) + ', bukan ' + bt.v);
            }
          } else m.push('grafik tanpa garis bantu: tinggi batang tak bisa diukur');
          env['x' + bt.s + '_' + bt.k] = q;
        });
      }
    });
    return env;
  }

  function hitungLangkah(b, env, m) {
    var nilai = {}, e2 = Object.assign({}, env);
    (b.langkah || []).forEach(function (st) {
      try {
        var q = H.hitung(st.rumus, e2);
        nilai[st.nama] = q; e2[st.nama] = q;
      } catch (e) { m.push('langkah "' + st.nama + '" (' + st.rumus + ') gagal: ' + e.message); }
    });
    return nilai;
  }

  function bulanIndeks(teks) { return BULAN.indexOf(String(teks).trim().toLowerCase()); }

  function periksaNumerik(b, m) {
    if (!periksaPilihan(b, m, 5)) return;
    var mod = b.model || {}, info = {};
    var env = bangunEnv(b, m, info);
    var nilai = hitungLangkah(b, env, m);
    var toleransi = mod.toleransi == null ? 0 : mod.toleransi;
    var kunciOpsi = b.opsi[b.kunci];

    // ---- hitung ulang
    var jawab = null, jenis = mod.jenisHitung || 'langkah';
    if (jenis === 'lunas-bulan') {
      var P0 = env.P0, g = env.g, C = env.C, m0 = Number(env.m0.n);
      if (!P0 || !g || !C) { m.push('param laba-majemuk tidak lengkap'); return; }
      var kum = H.q(0), laba = P0, k = 0;
      while (H.banding(kum, C) < 0 && k < 40) { kum = H.tambah(kum, laba); laba = H.bagi(H.kali(laba, H.tambah(100, g)), 100); k++; }
      var idx = (m0 + k - 1) % 12;
      var kunciIdx = bulanIndeks(kunciOpsi.teks);
      if (kunciIdx !== idx) m.push('bulan lunas yang dihitung ulang: ' + BULAN[idx] + ', kunci tercetak: ' + kunciOpsi.teks);
      // lima bulan berurutan
      var awal = bulanIndeks(b.opsi[0].teks);
      b.opsi.forEach(function (o, i) { if (bulanIndeks(o.teks) !== (awal + i) % 12) m.push('opsi bulan tidak berurutan pada ' + HURUF[i]); });
      return finalNumerik(b, m, mod, env);
    }
    if (jenis === 'tahun-lampaui') {
      var s = env[mod.sel.s], n0 = env[mod.sel.n], p = env.p;
      if (!s || !n0 || !p) { m.push('sel/param untuk pertumbuhan tahun tidak lengkap'); return; }
      var tahun = 0, x = mod.arah === 'turun' ? s : n0;
      var rujuk = mod.arah === 'turun' ? n0 : s;
      var faktor = mod.arah === 'turun' ? H.bagi(H.kurang(100, p), 100) : H.bagi(H.tambah(100, p), 100);
      while (tahun < 40) {
        x = H.kali(x, faktor); tahun++;
        if (mod.arah === 'turun' ? H.banding(x, rujuk) < 0 : H.banding(x, rujuk) > 0) break;
      }
      var uk = urai(kunciOpsi.teks);
      if (!uk || Number(uk.q.n) !== tahun) m.push('jumlah tahun yang dihitung ulang: ' + tahun + ', kunci tercetak: ' + kunciOpsi.teks);
      var nums = b.opsi.map(function (o) { var u = urai(o.teks); return u ? Number(u.q.n) : NaN; });
      nums.forEach(function (v, i) { if (i && v !== nums[i - 1] + 1) m.push('opsi tahun tidak berurutan'); });
      return finalNumerik(b, m, mod, env);
    }
    if (jenis === 'argmaks') {
      var daftar = mod.daftarLangkah || [], maks = null, idxMaks = -1, jmlMaks = 0;
      daftar.forEach(function (nama, i) {
        var q = nilai[nama];
        if (!q) { m.push('langkah ' + nama + ' tidak terhitung'); return; }
        if (maks === null || H.banding(q, maks) > 0) { maks = q; idxMaks = i; jmlMaks = 1; }
        else if (H.banding(q, maks) === 0) jmlMaks++;
      });
      if (jmlMaks !== 1) m.push('nilai tertinggi tidak tunggal (' + jmlMaks + ' kandidat)');
      if (idxMaks !== b.kunci) m.push('yang tertinggi menurut hitungan ulang adalah opsi ' + HURUF[idxMaks] + ', kunci tercetak ' + HURUF[b.kunci]);
      return finalNumerik(b, m, mod, env);
    }

    jawab = nilai.jawab;
    if (!jawab) { m.push('tidak ada langkah "jawab"'); return; }
    var uKunci = urai(kunciOpsi.teks);
    if (!uKunci) { m.push('teks kunci tidak terbaca sebagai angka: ' + kunciOpsi.teks); return; }
    if (mod.bentukJawab === 'rasio') {
      if (uKunci.tipe !== 'rasio') m.push('kunci seharusnya berbentuk perbandingan p:q: ' + kunciOpsi.teks);
      else if (!H.sama(uKunci.q, jawab)) m.push('perbandingan hasil hitung ulang ' + H.keTeks(jawab, 4) + ' tidak sama dengan kunci ' + kunciOpsi.teks);
    } else if (!sama(uKunci.q, jawab, toleransi)) {
      m.push('hasil hitung ulang ' + H.keTeks(jawab, 6) + ' tidak sama dengan kunci tercetak ' + kunciOpsi.teks + (toleransi ? ' (toleransi ' + toleransi + ')' : ''));
    }
    // opsi lain: nilainya berbeda dari hasil, dan setiap nilai tercetak cocok dengan yang tersimpan
    var sudah = [];
    b.opsi.forEach(function (o, i) {
      var u = urai(o.teks);
      if (!u) { m.push('teks opsi ' + HURUF[i] + ' tidak terbaca sebagai angka: ' + o.teks); return; }
      if (typeof o.nilai === 'number' && mod.bentukJawab !== 'rasio') {
        var ua = nilaiAngka(u.q), cetak = /^[^\d]*[\d.]*,(\d+)/.exec(o.teks), dec = cetak ? cetak[1].length : 0;
        var pecah = /\d\s*\/\s*\d/.test(o.teks);
        if (Math.abs(ua - o.nilai) > (pecah ? 1e-9 : 0.5 * Math.pow(10, -dec) + 1e-9)) m.push('nilai tersimpan opsi ' + HURUF[i] + ' (' + o.nilai + ') tidak cocok dengan teksnya (' + o.teks + ')');
      }
      if (i !== b.kunci) {
        var dekat = mod.bentukJawab === 'rasio' ? H.sama(u.q, jawab) : sama(u.q, jawab, toleransi);
        if (dekat) m.push('opsi ' + HURUF[i] + ' (' + o.teks + ') bernilai sama dengan hasil yang benar');
      }
      sudah.forEach(function (x) { if (H.sama(x.q, u.q)) m.push('opsi ' + HURUF[x.i] + ' dan ' + HURUF[i] + ' bernilai sama'); });
      sudah.push({ i: i, q: u.q });
    });
    finalNumerik(b, m, mod, env, nilai);
  }

  /** Pemeriksaan yang berlaku untuk semua butir numerik: gema angka, keseimbangan, jumlah tabel. */
  function finalNumerik(b, m, mod, env, nilai) {
    var teks = ulangiTeks(b);
    // gema: angka yang dihitung = angka yang dibaca peserta
    Object.keys(mod.tampil || {}).forEach(function (nama) {
      var tampil = mod.tampil[nama];
      if (teks.indexOf(tampil) < 0) { m.push('angka ' + nama + ' tercetak "' + tampil + '" tetapi tidak ditemukan di teks soal'); return; }
      var u = urai(tampil);
      if (!u) { m.push('tampilan ' + nama + ' tidak terbaca: ' + tampil); return; }
      if (!env[nama]) { m.push('param ' + nama + ' tidak ada'); return; }
      if (!H.sama(u.q, env[nama])) m.push('angka ' + nama + ' di soal (' + tampil + ') tidak sama dengan yang dihitung (' + H.keTeks(env[nama], 6) + ')');
    });
    if (mod.tampilGambar) {
      var tb = (b.stimulus.gambar || []).filter(function (g) { return g.jenis === 'tabel'; })[0];
      var isiTabel = tb ? bacaTabel(Gambar.svg(tb).svg).teks : '';
      Object.keys(mod.tampilGambar).forEach(function (nama) {
        var tampil = mod.tampilGambar[nama];
        if (isiTabel.indexOf(tampil) < 0) m.push('angka ' + nama + ' "' + tampil + '" tidak tertulis pada tabel');
        var u = urai(tampil);
        if (!u || !env[nama] || !H.sama(u.q, env[nama])) m.push('angka ' + nama + ' pada tabel (' + tampil + ') tidak sama dengan yang dihitung');
      });
    }
    if (mod.rasioTampil && mod.param) {
      var ra = env.ra, rb = env.rb, cc = env.cc, dd = env.dd;
      var asli = [H.bagi(ra, rb), H.bagi(cc, dd)];
      mod.rasioTampil.forEach(function (r, i) {
        if (teks.indexOf(r) < 0) m.push('perbandingan ' + r + ' tidak tertulis di soal');
        var u = urai(r);
        if (!u || !H.sama(u.q, asli[i])) m.push('perbandingan ' + r + ' tidak sama dengan parameter');
      });
    }
    if (mod.seimbang && nilai) {
      var a1 = nilai[mod.seimbang[0]], a2 = nilai[mod.seimbang[1]];
      if (!a1 || !a2 || !H.sama(a1, a2)) m.push('persamaan tidak seimbang setelah jawaban dimasukkan: ' + (a1 ? H.keTeks(a1, 4) : '?') + ' dan ' + (a2 ? H.keTeks(a2, 4) : '?'));
    }
    // kata bilangan pada soal aljabar harus sama dengan koefisien
    if (mod.kata) {
      var KATA = ['nol', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan'];
      var kalimat = (b.stimulus.teks[0] || '').split(' memiliki berat yang sama dengan ');
      if (kalimat.length !== 2) m.push('kalimat persamaan tidak terbaca');
      else {
        var hitungKata = function (s) { var r = []; s.toLowerCase().split(/[ ,.]+/).forEach(function (w) { var i = KATA.indexOf(w); if (i > 0) r.push(i); }); return r; };
        var kiri = hitungKata(kalimat[0]), kanan = hitungKata(kalimat[1]);
        var tp = [mod.kata.a1, mod.kata.b1, mod.kata.c1].filter(Boolean), tk = [mod.kata.a2, mod.kata.b2, mod.kata.c2].filter(Boolean);
        if (kiri.join() !== tp.join() || kanan.join() !== tk.join()) m.push('koefisien pada kalimat soal tidak sama dengan parameter');
      }
    }
    // tabel: jumlah di baris total harus sama dengan jumlah barisnya; total biaya = bagian-bagiannya
    if (mod.cekJumlah) {
      mod.cekJumlah.kolom.forEach(function (c) {
        var jml = H.q(0);
        for (var r = 0; r < mod.cekJumlah.baris; r++) jml = H.tambah(jml, env['t' + r + '_' + c] || 0);
        var tot = env['t' + mod.cekJumlah.baris + '_' + c];
        if (!tot || !H.sama(jml, tot)) m.push('baris jumlah pada tabel kolom ' + c + ' tidak sama dengan jumlah barisnya');
      });
    }
    if (mod.cekTotalBiaya) {
      mod.cekTotalBiaya.kolom.forEach(function (c) {
        var jml = H.q(0);
        mod.cekTotalBiaya.bagian.forEach(function (r) { jml = H.tambah(jml, env['t' + r + '_' + c] || 0); });
        var tot = env['t' + mod.cekTotalBiaya.total + '_' + c];
        if (!tot || !sama(jml, tot, 0.005)) m.push('total biaya per unit pada tabel kolom ' + c + ' tidak sama dengan jumlah komponennya');
      });
    }
  }

  // ------------------------------------------------------------------ verbal
  //
  // Bacaan verbal dirakit dari fakta berstruktur (lihat verbal.js). Di sini kebenaran
  // pernyataan diturunkan ulang dari fakta itu dengan aturan validator sendiri, lalu
  // diperiksa bahwa fakta memang tertulis: bacaan tersusun tepat dari kalimat fakta, dan
  // kata penanda tiap fakta ("tidak termasuk", "hanya", "secara teori", "tidak semua",
  // "sekurang-kurangnya", arah "menaikkan/menurunkan", ...) ada di kalimatnya. Daftar
  // penanda di bawah ini milik validator; tidak diambil dari penyusun.

  var V_YA = ['mencakup', 'meliputi', 'termasuk', 'tergolong', 'masuk golongan', 'bagian dari', 'berlaku bagi'];
  var V_TIDAK = ['tidak termasuk', 'tidak tergolong', 'tidak mencakup', 'bukan bagian', 'kecuali', 'di luar'];
  var V_TUTUP = ['hanya', 'terbatas pada'];
  var V_BUKA = ['seperti', 'antara lain', 'misalnya', 'di antaranya'];
  var V_NAIK = ['meningkat', 'menaikkan', 'mendorong', 'memperbesar', 'memperluas', 'menambah', 'mempercepat', 'memperkuat', 'memperbaiki',
    'menggerakkan', 'bertambah', 'lebih tinggi', 'lebih banyak', 'lebih besar', 'lebih baik', 'lebih luas', 'lebih cepat'];
  var V_TURUN = ['menurun', 'mengurangi', 'menekan', 'memangkas', 'memperkecil', 'mempersempit', 'menghambat', 'memperlambat', 'memperburuk',
    'melemahkan', 'berkurang', 'lebih rendah', 'lebih sedikit', 'lebih kecil', 'lebih buruk', 'lebih sempit', 'lebih lambat'];
  var V_AWAL = ['pertama kali', 'mula-mula', 'pada mulanya', 'awalnya'];
  var V_LANJUT = ['kemudian', 'lalu', 'setelah itu', 'selanjutnya'];
  var V_BILANGAN = { 2: 'dua', 3: 'tiga', 4: 'empat' };
  var V_TIPE = ['latar', 'golongan', 'bagian', 'daftar', 'sebab', 'kuantor', 'status', 'syarat', 'urutan', 'banding'];

  function kecilV(s) { return String(s == null ? '' : s).toLowerCase(); }
  function polaKata(kata) { return new RegExp('(^|[^a-z-])' + kata.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?=[^a-z-]|$)'); }
  /** Posisi kata/frasa utuh pertama di teks, atau -1. */
  function posKata(teks, kata) { var r = polaKata(kata).exec(kecilV(teks)); return r ? r.index + r[1].length : -1; }
  function adaKata(teks, kata) { return posKata(teks, kata) >= 0; }
  function adaSalahSatu(teks, daftar) { var t = kecilV(teks); return daftar.some(function (p) { return t.indexOf(p) >= 0; }); }
  function posAwal(teks, daftar) { var p = -1; daftar.forEach(function (d) { var i = posKata(teks, d); if (i >= 0 && (p < 0 || i < p)) p = i; }); return p; }
  function tanpaNama(teks, nama) { var t = kecilV(teks); Object.keys(nama || {}).forEach(function (r) { if (nama[r]) t = t.split(kecilV(nama[r])).join(' '); }); return t; }
  function klausaV(teks) { return String(teks).split(/,|;|\bsedangkan\b|\btetapi\b|\bnamun\b/i); }
  function negasiV(teks) { return /(^|[^a-z])(tidak|bukan|belum)([^a-z]|$)/.test(kecilV(teks)); }
  function angkaId(v) { return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function adaAngka(teks, v) { return new RegExp('(^|[^\\d.,])' + angkaId(v).replace(/\./g, '\\.') + '(?!\\d|[.,]\\d)').test(String(teks)); }
  function arahCocok(teks, arah) { var n = adaSalahSatu(teks, V_NAIK), d = adaSalahSatu(teks, V_TURUN); return arah === 'naik' ? n && !d : (arah === 'turun' ? d && !n : false); }

  /** Kuantor yang tertulis: semua, tidak-semua, tidak-ada, sebagian-besar, sebagian, ada, ada-tidak. */
  function kuantorDariTeks(teks) {
    var t = kecilV(teks).trim();
    if (/(^|[^a-z])(tidak|belum) (semua|seluruh)([^a-z]|$)/.test(t)) return 'tidak-semua';
    if (/(^|[^a-z])(tidak ada|belum ada|tak satu pun|tidak satu pun)([^a-z]|$)/.test(t)) return 'tidak-ada';
    if (/(^|[^a-z])(sebagian besar|kebanyakan)([^a-z]|$)/.test(t)) return 'sebagian-besar';
    if (/(^|[^a-z])(semua|seluruh|setiap)([^a-z]|$)/.test(t)) return 'semua';
    var awalAda = /^(ada|sebagian|beberapa)([^a-z]|$)/.test(t);
    if (awalAda && negasiV(t)) return 'ada-tidak';
    if (/(^|[^a-z])(sebagian|beberapa)([^a-z]|$)/.test(t)) return 'sebagian';
    return awalAda ? 'ada' : null;
  }
  /** teori ("secara teori"), belum ("secara teori ..., tetapi belum terbukti"), terbukti ("membuktikan"). */
  function statusDariTeks(teks) {
    var t = kecilV(teks), teori = /(^|[^a-z])(secara teori|secara teoretis|pada prinsipnya)([^a-z]|$)/.test(t);
    var belum = /belum (terbukti|pernah dibuktikan|dapat dibuktikan)/.test(t), bukti = /(terbukti|membuktikan)/.test(t);
    if (teori && belum) return 'belum';
    if (teori && !bukti) return 'teori';
    return !teori && bukti && !belum ? 'terbukti' : null;
  }
  function statusKlaimDariTeks(teks) {
    var t = kecilV(teks);
    if (/belum (terbukti|pernah dibuktikan)/.test(t)) return 'belum';
    if (/terbukti/.test(t)) return 'terbukti';
    return /(^|[^a-z])(dapat|bisa|mungkin|memungkinkan)([^a-z]|$)/.test(t) ? 'mungkin' : null;
  }
  /** perlu ("hanya ... sekurang-kurangnya") atau cukup ("setiap ... atau lebih otomatis ..."). */
  function syaratDariTeks(teks) {
    var t = kecilV(teks), hanya = adaKata(t, 'hanya'), minimal = /(sekurang-kurangnya|minimal|paling sedikit|paling tidak)/.test(t);
    var otomatis = /(^|[^a-z])(otomatis|selalu|pasti)([^a-z]|$)/.test(t), setiap = /(^|[^a-z])(setiap|semua|siapa pun)([^a-z]|$)/.test(t);
    if (hanya && minimal && !otomatis) return 'perlu';
    return !hanya && otomatis && setiap && /atau lebih/.test(t) ? 'cukup' : null;
  }
  function syaratKlaimDariTeks(teks) {
    var t = kecilV(teks), pasti = /(^|[^a-z])(pasti|tentu|dipastikan|otomatis)([^a-z]|$)/.test(t);
    var tidak = /(^|[^a-z])(tidak|belum) (dapat|bisa|akan|berhak)([^a-z]|$)/.test(t);
    if (pasti && !tidak) return 'pasti';
    return tidak && !pasti ? 'tidak' : null;
  }
  /** Ada klausa dengan susunan "<a> ... lebih <sifat> ... daripada ... <b>". */
  function susunanBanding(teks, na, nb, sifat) {
    return klausaV(teks).some(function (k) {
      k = kecilV(k);
      var ia = k.indexOf(kecilV(na)), il = k.indexOf('lebih ' + kecilV(sifat)), id = k.indexOf('daripada'), ib = k.lastIndexOf(kecilV(nb));
      return ia >= 0 && il > ia && id > il && ib > id;
    });
  }

  /** Himpunan dari fakta golongan dan bagian: termuat(x, y) dan terpisah(x, y). */
  function modelBagian(fakta) {
    var sub = [], pisah = [];
    fakta.forEach(function (f) {
      if (f.tipe === 'bagian') (f.ya ? sub : pisah).push([f.x, f.y]);
      if (f.tipe === 'golongan') {
        (f.anggota || []).forEach(function (g, i) {
          sub.push([g, f.induk]);
          f.anggota.forEach(function (h, j) { if (i < j) pisah.push([g, h]); });
        });
      }
    });
    function atas(x) {
      var hasil = {}, antre = [x];
      hasil[x] = 1;
      while (antre.length) {
        var n = antre.shift();
        sub.forEach(function (e) { if (e[0] === n && !hasil[e[1]]) { hasil[e[1]] = 1; antre.push(e[1]); } });
      }
      return hasil;
    }
    function termuat(x, y) { return !!atas(x)[y]; }
    function terpisah(x, y) { var ax = atas(x), ay = atas(y); return pisah.some(function (p) { return (ax[p[0]] && ay[p[1]]) || (ax[p[1]] && ay[p[0]]); }); }
    // pelengkap golongan: x di dalam induk dan lepas dari semua golongannya kecuali satu -> x termasuk golongan itu
    var gol = fakta.filter(function (f) { return f.tipe === 'golongan'; }), ids = {};
    sub.concat(pisah).forEach(function (e) { ids[e[0]] = 1; ids[e[1]] = 1; });
    for (var putar = 0, berubah = true; berubah && putar < 6; putar++) {
      berubah = false;
      gol.forEach(function (g) {
        Object.keys(ids).forEach(function (x) {
          if (x === g.induk || g.anggota.indexOf(x) >= 0 || !termuat(x, g.induk)) return;
          var sisa = g.anggota.filter(function (h) { return !terpisah(x, h); });
          if (sisa.length === 1 && !termuat(x, sisa[0])) { sub.push([x, sisa[0]]); berubah = true; }
        });
      });
    }
    return { termuat: termuat, terpisah: terpisah, ids: ids };
  }

  var TABEL_KUANTOR = {
    semua: { semua: 'B', 'tidak-semua': 'S', 'ada-tidak': 'S', 'tidak-ada': 'S', ada: 'AMBIGU', 'sebagian-besar': 'AMBIGU' },
    'tidak-semua': { semua: 'S', 'tidak-semua': 'B', 'ada-tidak': 'B', 'tidak-ada': 'AMBIGU', ada: 'AMBIGU', 'sebagian-besar': 'AMBIGU' },
    sebagian: { semua: 'AMBIGU', 'tidak-semua': 'AMBIGU', 'ada-tidak': 'AMBIGU', 'tidak-ada': 'S', ada: 'B', 'sebagian-besar': 'TD' },
    'tidak-ada': { semua: 'S', 'tidak-semua': 'AMBIGU', 'ada-tidak': 'AMBIGU', 'tidak-ada': 'B', ada: 'S', 'sebagian-besar': 'S' },
    'sebagian-besar': { semua: 'AMBIGU', 'tidak-semua': 'AMBIGU', 'ada-tidak': 'AMBIGU', 'tidak-ada': 'S', ada: 'B', 'sebagian-besar': 'B' }
  };
  var TABEL_STATUS = {
    teori: { terbukti: 'TD', mungkin: 'B', belum: 'TD' },
    belum: { terbukti: 'S', mungkin: 'B', belum: 'B' },
    terbukti: { terbukti: 'B', mungkin: 'B', belum: 'S' }
  };

  /**
   * Turunkan 'B' | 'S' | 'TD' dari fakta dan pernyataan. Selain itu bisa keluar kode masalah:
   * AMBIGU (jawaban bergantung pada makna tersirat), KONTRADIKSI, GANDA, TIDAK-DIKENAL.
   */
  function turunkanVerbal(fakta, klaim) {
    var k = klaim;
    function cari(tipe, pred) { return fakta.filter(function (x) { return x.tipe === tipe && pred(x); }); }
    if (k.tipe === 'bagian') {
      var mb = modelBagian(fakta), ya = mb.termuat(k.x, k.y), tidak = mb.terpisah(k.x, k.y);
      if (ya && tidak) return 'KONTRADIKSI';
      if (k.ya) return ya ? 'B' : (tidak ? 'S' : 'TD');
      return tidak ? 'B' : (ya ? 'S' : 'TD');
    }
    if (k.tipe === 'daftar' || k.tipe === 'tunggal') {
      var d = cari('daftar', function (x) { return x.subjek === k.subjek && x.himp === k.himp; });
      if (!d.length) return 'TD';
      if (d.length > 1) return 'GANDA';
      var ada = d[0].anggota.indexOf(k.x) >= 0;
      if (k.tipe === 'tunggal') {
        if (d[0].anggota.some(function (y) { return y !== k.x; })) return 'S';
        return ada && d[0].lengkap ? 'B' : 'TD';
      }
      if (ada) return k.termasuk ? 'B' : 'S';
      if (d[0].lengkap) return k.termasuk ? 'S' : 'B';
      return 'TD';
    }
    if (k.tipe === 'sebab') {
      var tepi = cari('sebab', function () { return true; }), tanda = {};
      var jalan = function (n, s, lihat) {
        tepi.forEach(function (e) {
          if (e.dari !== n || lihat.indexOf(e.ke) >= 0) return;
          var s2 = s * (e.arah === 'naik' ? 1 : -1);
          if (e.ke === k.ke) tanda[s2] = 1; else jalan(e.ke, s2, lihat.concat([e.ke]));
        });
      };
      jalan(k.dari, 1, [k.dari]);
      if (tanda[1] && tanda[-1]) return 'KONTRADIKSI';
      if (!tanda[1] && !tanda[-1]) return 'TD';
      return (tanda[1] ? 'naik' : 'turun') === k.arah ? 'B' : 'S';
    }
    if (k.tipe === 'kuantor') {
      var q = cari('kuantor', function (x) { return x.kelompok === k.kelompok && x.sifat === k.sifat; });
      if (!q.length) return 'TD';
      if (q.length > 1) return 'GANDA';
      return (TABEL_KUANTOR[q[0].q] || {})[k.q] || 'TIDAK-DIKENAL';
    }
    if (k.tipe === 'status') {
      var st = cari('status', function (x) { return x.hal === k.hal; });
      if (!st.length) return 'TD';
      if (st.length > 1) return 'GANDA';
      return (TABEL_STATUS[st[0].status] || {})[k.jenis] || 'TIDAK-DIKENAL';
    }
    if (k.tipe === 'syarat') {
      var sy = cari('syarat', function (x) { return x.aksi === k.aksi; });
      if (!sy.length) return 'TD';
      if (sy.length > 1) return 'GANDA';
      var t = sy[0].ambang, v = k.v;
      if (sy[0].jenis === 'perlu') return v < t ? (k.jenis === 'tidak' ? 'B' : 'S') : 'TD';
      if (sy[0].jenis === 'cukup') return v >= t ? (k.jenis === 'pasti' ? 'B' : 'S') : 'TD';
      return 'TIDAK-DIKENAL';
    }
    if (k.tipe === 'urutan') {
      var u = cari('urutan', function (x) { return x.subjek === k.subjek; });
      if (!u.length) return 'TD';
      if (u.length > 1) return 'GANDA';
      var pertama = u[0].pertama, lanjut = u[0].lanjut;
      if (k.jenis === 'pertama') return k.x === pertama ? 'B' : 'S';
      if (k.jenis === 'diterapkan') return k.x === pertama || lanjut.indexOf(k.x) >= 0 ? 'B' : 'TD';
      if (k.jenis === 'sebelum') {
        if (k.x === pertama && lanjut.indexOf(k.y) >= 0) return 'B';
        if (k.y === pertama && k.x !== pertama) return 'S';     // tidak ada yang mendahului yang pertama
        return k.x === pertama || (lanjut.indexOf(k.x) >= 0 && lanjut.indexOf(k.y) >= 0) ? 'AMBIGU' : 'TD';
      }
      return 'TIDAK-DIKENAL';
    }
    if (k.tipe === 'banding') {
      var tb = cari('banding', function (x) { return x.sifat === k.sifat; });
      var lebih = function (dari, ke) {
        var antre = [dari], lihat = {};
        lihat[dari] = 1;
        while (antre.length) {
          var n = antre.shift();
          if (n === ke) return true;
          tb.forEach(function (e) { if (e.a === n && !lihat[e.b]) { lihat[e.b] = 1; antre.push(e.b); } });
        }
        return false;
      };
      var aL = k.a !== k.b && lebih(k.a, k.b), bL = k.a !== k.b && lebih(k.b, k.a);
      if (aL && bL) return 'KONTRADIKSI';
      return aL ? 'B' : (bL ? 'S' : 'TD');
    }
    return 'TIDAK-DIKENAL';
  }

  /** Kata penanda tiap fakta harus tertulis di kalimatnya dan sesuai polaritas faktanya. */
  function cekFaktaVerbal(f, m) {
    var t = kecilV(f.teks), pelaku = 'fakta ' + f.tipe + ' "' + String(f.teks).slice(0, 50) + '..."';
    Object.keys(f.nama || {}).forEach(function (r) { if (t.indexOf(kecilV(f.nama[r])) < 0) m.push(pelaku + ': "' + f.nama[r] + '" tidak tertulis'); });
    if (f.tipe === 'golongan') {
      var bil = V_BILANGAN[(f.anggota || []).length];
      if (!bil || !adaKata(t, bil)) m.push(pelaku + ': jumlah golongan tidak tertulis');
      if ((f.anggota || []).some(function (id) { return !f.nama || !f.nama[id]; })) m.push(pelaku + ': nama golongan tidak lengkap');
    } else if (f.tipe === 'bagian') {
      var nm = f.nama && f.nama.x, kl = nm ? klausaV(f.teks).filter(function (k) { return kecilV(k).indexOf(kecilV(nm)) >= 0; })[0] : null;
      if (kl == null) { m.push(pelaku + ': anggota tidak tertulis'); return; }
      var sisa = tanpaNama(kl, { x: nm });
      if (!f.penanda || t.indexOf(f.penanda) < 0) m.push(pelaku + ': penanda "' + f.penanda + '" tidak tertulis');
      if (f.ya) {
        if (V_YA.indexOf(f.penanda) < 0 || !adaSalahSatu(t, V_YA)) m.push(pelaku + ': "' + nm + '" termasuk, tetapi tidak ditandai kata "mencakup/termasuk/tergolong"');
        if (/(^|[^a-z])(tidak|bukan|kecuali)([^a-z]|$)/.test(sisa)) m.push(pelaku + ': "' + nm + '" dinyatakan termasuk, tetapi klausanya menyangkal');
      } else if (V_TIDAK.indexOf(f.penanda) < 0 || !adaSalahSatu(sisa, V_TIDAK)) m.push(pelaku + ': "' + nm + '" dinyatakan tidak termasuk, tetapi klausanya tidak menyangkal');
    } else if (f.tipe === 'daftar') {
      var tutup = V_TUTUP.some(function (p) { return adaKata(t, p); }), buka = V_BUKA.some(function (p) { return adaKata(t, p); });
      if (f.lengkap && (!tutup || buka)) m.push(pelaku + ': daftar lengkap tanpa penanda "hanya"');
      if (!f.lengkap && (!buka || tutup)) m.push(pelaku + ': daftar terbuka tanpa penanda "seperti/antara lain"');
      var pos = f.penanda ? posKata(t, f.penanda) : -1;
      if (pos < 0 || (f.lengkap ? V_TUTUP : V_BUKA).indexOf(f.penanda) < 0) m.push(pelaku + ': penanda daftar "' + f.penanda + '" tidak sesuai');
      (f.anggota || []).forEach(function (id) {
        var n = f.nama && f.nama[id];
        if (!n || t.indexOf(kecilV(n), Math.max(pos, 0)) < 0) m.push(pelaku + ': anggota "' + (n || id) + '" tidak tertulis setelah penandanya');
      });
    } else if (f.tipe === 'sebab') {
      var p = kecilV(f.penanda);
      if (!p || t.indexOf(p) < 0) m.push(pelaku + ': penanda "' + f.penanda + '" tidak tertulis');
      else {
        if (!f.nama || p.indexOf(kecilV(f.nama.ke)) < 0) m.push(pelaku + ': akibatnya tidak ada pada penanda "' + f.penanda + '"');
        if (!arahCocok(p, f.arah)) m.push(pelaku + ': kata pada "' + f.penanda + '" tidak menunjukkan arah ' + f.arah);
      }
    } else if (f.tipe === 'kuantor') {
      var q = kuantorDariTeks(f.teks);
      if (q !== f.q) m.push(pelaku + ': kuantor tertulis "' + q + '", model "' + f.q + '"');
    } else if (f.tipe === 'status') {
      var st = statusDariTeks(f.teks);
      if (st !== f.status) m.push(pelaku + ': status tertulis "' + st + '", model "' + f.status + '"');
    } else if (f.tipe === 'syarat') {
      if (!adaAngka(f.teks, f.ambang)) m.push(pelaku + ': batas ' + f.ambang + ' tidak tercetak');
      var sj = syaratDariTeks(f.teks);
      if (sj !== f.jenis) m.push(pelaku + ': syarat tertulis "' + sj + '", model "' + f.jenis + '"');
    } else if (f.tipe === 'urutan') {
      var pa = posAwal(t, V_AWAL), pl = posAwal(t, V_LANJUT), np = f.nama && f.nama[f.pertama] ? t.indexOf(kecilV(f.nama[f.pertama])) : -1;
      if (pa < 0 || pl <= pa || np <= pa || np >= pl) m.push(pelaku + ': yang pertama tidak ditandai "pertama kali ... kemudian"');
      (f.lanjut || []).forEach(function (id) { if (!f.nama || t.indexOf(kecilV(f.nama[id]), pl) < pl) m.push(pelaku + ': "' + id + '" tidak tertulis setelah "kemudian"'); });
    } else if (f.tipe === 'banding') {
      if (!f.nama || !susunanBanding(f.teks, f.nama.a, f.nama.b, f.sifat)) m.push(pelaku + ': susunan "a lebih ' + f.sifat + ' daripada b" tidak tertulis');
    }
  }

  /** Pernyataan: nama tertulis, dan polaritas/kuantor/status/syarat/arahnya tertulis sesuai model. */
  function cekKlaimVerbal(k, m) {
    var t = kecilV(k.teks), sisa = tanpaNama(k.teks, k.nama), salah = function (s) { m.push('pernyataan "' + k.teks + '": ' + s); };
    Object.keys(k.nama || {}).forEach(function (r) { if (t.indexOf(kecilV(k.nama[r])) < 0) salah('"' + k.nama[r] + '" tidak tertulis'); });
    if (k.tipe === 'bagian' && negasiV(sisa) === !!k.ya) salah('polaritas tidak sesuai model');
    else if (k.tipe === 'daftar' && negasiV(sisa) === !!k.termasuk) salah('polaritas tidak sesuai model');
    else if (k.tipe === 'tunggal' && !/satu-satunya/.test(t)) salah('tidak memuat "satu-satunya"');
    else if (k.tipe === 'sebab') {
      var p = kecilV(k.penanda);
      if (!p || t.indexOf(p) < 0 || !k.nama || p.indexOf(kecilV(k.nama.ke)) < 0 || !arahCocok(p, k.arah)) salah('arah sebab-akibat tidak tertulis sesuai model');
    } else if (k.tipe === 'kuantor') {
      var q = kuantorDariTeks(k.teks);
      if (!(q === k.q || (k.q === 'ada' && q === 'sebagian'))) salah('kuantor tertulis "' + q + '", model "' + k.q + '"');
    } else if (k.tipe === 'status' && statusKlaimDariTeks(k.teks) !== k.jenis) salah('status tertulis "' + statusKlaimDariTeks(k.teks) + '", model "' + k.jenis + '"');
    else if (k.tipe === 'syarat' && (!adaAngka(k.teks, k.v) || syaratKlaimDariTeks(k.teks) !== k.jenis)) salah('angka atau jenis kepastian tidak sesuai model');
    else if (k.tipe === 'urutan') {
      var ada = /pertama/.test(t), sebelum = posAwal(t, ['lebih dahulu', 'lebih awal']);
      if (k.jenis === 'pertama' && !ada) salah('tidak memuat "pertama"');
      if (k.jenis === 'diterapkan' && (ada || sebelum >= 0)) salah('memuat penanda urutan');
      if (k.jenis === 'sebelum' && !(k.nama && t.indexOf(kecilV(k.nama.x)) >= 0 && t.indexOf(kecilV(k.nama.x)) < sebelum && t.indexOf(kecilV(k.nama.y), sebelum) > sebelum)) salah('susunan "x lebih dahulu daripada y" tidak tertulis');
    } else if (k.tipe === 'banding' && !(k.nama && susunanBanding(k.teks, k.nama.a, k.nama.b, k.sifat))) salah('susunan "a lebih ' + k.sifat + ' daripada b" tidak tertulis');
  }

  function disebutVerbal(fakta, id) {
    return fakta.some(function (f) {
      return [f.x, f.y, f.dari, f.ke, f.kelompok, f.induk, f.pertama, f.a, f.b].indexOf(id) >= 0 ||
        (f.anggota || []).indexOf(id) >= 0 || (f.lanjut || []).indexOf(id) >= 0;
    });
  }

  /** Tidak ada dua fakta untuk hal yang sama, golongan yang bertentangan, arah sebab ganda, atau perbandingan berputar. */
  function cekKonsistenVerbal(fakta, m) {
    var mb = modelBagian(fakta);
    Object.keys(mb.ids).forEach(function (x) { if (mb.terpisah(x, x)) m.push('fakta golongan bertentangan: "' + x + '" berada di dua golongan yang saling lepas'); });
    var kunci = {};
    fakta.forEach(function (f) {
      var kk = { daftar: 'daftar ' + f.subjek + '/' + f.himp, kuantor: 'kuantor ' + f.kelompok + '/' + f.sifat, status: 'status ' + f.hal, syarat: 'syarat ' + f.aksi, urutan: 'urutan ' + f.subjek }[f.tipe];
      if (!kk) return;
      if (kunci[kk]) m.push('dua fakta untuk hal yang sama: ' + kk);
      kunci[kk] = 1;
    });
    fakta.forEach(function (f) {
      if (f.tipe === 'sebab' && turunkanVerbal(fakta, { tipe: 'sebab', dari: f.dari, ke: f.ke, arah: f.arah }) !== 'B') m.push('fakta sebab-akibat bertentangan: ' + f.dari + ' -> ' + f.ke);
      if (f.tipe === 'banding' && turunkanVerbal(fakta, { tipe: 'banding', a: f.a, b: f.b, sifat: f.sifat }) !== 'B') m.push('perbandingan berputar: ' + f.a + ' / ' + f.b);
    });
  }

  function periksaVerbal(b, m) {
    if (!periksaPilihan(b, m, 3)) return;
    var mod = b.model || {}, tgt = ['Benar', 'Salah', 'Tidak Diketahui'];
    b.opsi.forEach(function (o, i) { if (o.teks !== tgt[i]) m.push('opsi ' + HURUF[i] + ' seharusnya "' + tgt[i] + '"'); });
    if (!Array.isArray(mod.fakta) || !mod.fakta.length || !mod.klaim) { m.push('model verbal tanpa fakta atau pernyataan'); return; }
    var turunan = turunkanVerbal(mod.fakta, mod.klaim), peta = { B: 0, S: 1, TD: 2 };
    if (peta[turunan] === undefined) m.push('kebenaran pernyataan tidak dapat diturunkan: ' + turunan);
    else if (peta[turunan] !== b.kunci) m.push('kebenaran yang diturunkan dari fakta adalah "' + tgt[peta[turunan]] + '", kunci tercetak "' + tgt[b.kunci] + '"');
    // bacaan tersusun tepat dari kalimat fakta: tidak ada kalimat tanpa fakta, tidak ada fakta tanpa kalimat
    var bacaan = (b.stimulus.teks || []).join(' '), urut = [];
    mod.fakta.forEach(function (f) { if (urut[urut.length - 1] !== f.teks) urut.push(f.teks); });
    if (urut.join(' ') !== bacaan) m.push('bacaan tidak tersusun tepat dari kalimat fakta');
    if (mod.klaim.teks !== b.pertanyaan) m.push('kalimat pernyataan pada butir tidak sama dengan pernyataan yang diperiksa');
    if (kecilV(bacaan).indexOf(kecilV(mod.klaim.teks).replace(/\.$/, '')) >= 0) m.push('pernyataan menyalin kalimat bacaan apa adanya');
    var kata = bacaan.split(/\s+/).length;
    if (kata < 120 || kata > 180) m.push('panjang bacaan ' + kata + ' kata di luar rentang 120-180');
    mod.fakta.forEach(function (f) {
      if (V_TIPE.indexOf(f.tipe) < 0) m.push('jenis fakta tidak dikenal: ' + f.tipe);
      else if (typeof f.teks !== 'string' || !f.teks) m.push('fakta ' + f.tipe + ' tanpa kalimat');
      else cekFaktaVerbal(f, m);
    });
    cekKlaimVerbal(mod.klaim, m);
    // hal yang tidak disebut fakta mana pun tidak boleh tertulis di bacaan (kalau tertulis, "tidak diketahui" belum tentu benar)
    ['x', 'y', 'a', 'b'].forEach(function (r) {
      var id = mod.klaim[r], nm = mod.klaim.nama && mod.klaim.nama[r];
      if (typeof id === 'string' && nm && !disebutVerbal(mod.fakta, id) && kecilV(bacaan).indexOf(kecilV(nm)) >= 0) m.push('"' + nm + '" tidak disebut fakta mana pun, tetapi tertulis di bacaan');
    });
    cekKonsistenVerbal(mod.fakta, m);
  }

  // ------------------------------------------------------------------ figural

  function sidikSel(c) { return Object.keys(c).sort().map(function (k) { return k + '=' + c[k]; }).join(';'); }

  function periksaFiguralAtribut(b, m) {
    if (!periksaPilihan(b, m, 5)) return;
    var mod = b.model, tipe = mod.tipe, pred = {}, kanal;
    var visibel = tipe === 'serial' ? mod.sels : [].concat.apply([], mod.grid.map(function (row) { return row; }));
    kanal = Object.keys(visibel[0]).sort();
    visibel.forEach(function (c, i) {
      if (Object.keys(c).sort().join() !== kanal.join()) m.push('kotak tampak ke-' + (i + 1) + ' memiliki kanal yang berbeda');
      Object.keys(c).forEach(function (nm) {
        var info = Inf.KANAL[nm];
        if (!info) m.push('kanal tidak dikenal: ' + nm);
        else if (!(c[nm] >= 0 && c[nm] < info.n && c[nm] % 1 === 0)) m.push('nilai kanal ' + nm + ' di luar domain: ' + c[nm]);
      });
    });
    kanal.forEach(function (nm) {
      var info = Inf.KANAL[nm], r;
      if (!info) return;
      if (tipe === 'serial') r = Inf.deret(info, mod.sels.map(function (c) { return c[nm]; }));
      else if (tipe === 'matriks-3') {
        var g = mod.grid.map(function (row) { return row.map(function (c) { return c[nm]; }); });
        g[mod.mr][mod.mc] = null;
        r = Inf.matriks3(info, g, mod.mr, mod.mc);
      } else {
        var g2 = mod.grid.map(function (row) { return row.map(function (c) { return c[nm]; }); });
        g2[1][1] = null;
        r = Inf.matriks2(info, g2);
      }
      if (r.status !== 'unik') m.push('kanal ' + nm + ': aturan ' + (r.status === 'ambigu' ? 'ambigu (nilai berbeda menurut aturan berbeda: ' + r.semua.join('/') + ')' : 'tidak ditemukan dari kotak yang tampak'));
      else pred[nm] = r.nilai;
    });
    if (Object.keys(pred).length !== kanal.length) return;
    var cocok = [];
    mod.pilihan.forEach(function (c, i) {
      if (Object.keys(c).sort().join() !== kanal.join()) { m.push('opsi ' + HURUF[i] + ' memiliki kanal yang berbeda dari soal'); return; }
      if (kanal.every(function (nm) { return c[nm] === pred[nm]; })) cocok.push(i);
    });
    if (cocok.length !== 1) m.push('opsi yang memenuhi pola ada ' + cocok.length + ' (' + cocok.map(function (i) { return HURUF[i]; }).join(', ') + '), seharusnya tepat satu');
    else if (cocok[0] !== b.kunci) m.push('opsi yang memenuhi pola adalah ' + HURUF[cocok[0]] + ', kunci tercetak ' + HURUF[b.kunci]);
    if (mod.kunciIndex !== b.kunci) m.push('indeks kunci pada model tidak sama dengan kunci butir');
    // pilihan berbeda satu sama lain, juga setelah digambar
    var lihat = {};
    mod.pilihan.forEach(function (c, i) { var s = sidikSel(c); if (lihat[s] !== undefined) m.push('opsi ' + HURUF[lihat[s]] + ' dan ' + HURUF[i] + ' berisi kotak yang sama'); lihat[s] = i; });
    var gb = {};
    b.opsi.forEach(function (o, i) {
      try { var s = Gambar.svg(o.gambar).svg; if (gb[s] !== undefined) m.push('gambar opsi ' + HURUF[gb[s]] + ' dan ' + HURUF[i] + ' identik'); gb[s] = i; } catch (e) { m.push('gambar opsi ' + HURUF[i] + ' gagal'); }
    });
  }

  function tanpaPenanda(fig) {
    return { unsur: fig.unsur.filter(function (u) { return u.nama !== 'penanda deret'; }), keluarga: fig.keluarga, benih: fig.benih };
  }

  function penandaFig(fig) { return fig.unsur.filter(function (u) { return u.nama === 'penanda deret'; }); }

  function periksaSerialPutar(b, m) {
    if (!periksaPilihan(b, m, 5)) return;
    var mod = b.model;
    // yang diperiksa adalah gambar yang BENAR-BENAR tampil (deret dan opsi), bukan salinan data penyusun
    var gd = (b.stimulus.gambar || [])[0];
    var deret = gd && gd.jenis === 'serial-putar' && gd.model ? gd.model.deret : null;
    var pilihan = b.opsi.map(function (o) { return o.gambar && o.gambar.jenis === 'figur' && o.gambar.model ? o.gambar.model.fig : null; });
    if (!deret) { m.push('gambar deret kotak tidak ada'); return; }
    if (pilihan.some(function (f) { return !f; })) { m.push('ada opsi tanpa gambar bentuk'); return; }
    if (JSON.stringify(deret) !== JSON.stringify(mod.deret)) m.push('deret yang tergambar berbeda dari data model');
    if (JSON.stringify(pilihan) !== JSON.stringify(mod.pilihan)) m.push('opsi yang tergambar berbeda dari data model');
    if (deret.length !== 4) { m.push('deret harus berisi empat kotak'); return; }
    var dasar = deret.map(function (f) { return Fig.pusatkan(tanpaPenanda(f)); }), delta = null;
    for (var i = 0; i < 3; i++) {
      var d = Fig.sudutPutarKe(dasar[i], dasar[i + 1]);
      if (d === null) { m.push('kotak ' + (i + 1) + ' dan ' + (i + 2) + ' tidak terhubung oleh putaran'); return; }
      var dn = d > 180 ? d - 360 : d;
      if (delta === null) delta = dn; else if (Math.abs(dn - delta) > 1e-3) { m.push('langkah putar antar kotak tidak konsisten (' + delta + ' lalu ' + dn + ')'); return; }
    }
    if (Math.abs(delta) < 1e-6) { m.push('deret tidak berputar'); return; }
    // titik penanda: jumlah dan isi
    var jml = deret.map(function (f) { return penandaFig(f).length; });
    var beda = jml[1] - jml[0];
    if (jml[2] - jml[1] !== beda || jml[3] - jml[2] !== beda) { m.push('jumlah titik penanda tidak membentuk deret aritmetika: ' + jml.join(',')); return; }
    var isi4 = penandaFig(deret[3]).map(function (u) { return u.isi ? 1 : 0; });
    var bergantian = isi4.length >= 2 && isi4.every(function (x, j) { return j === 0 || x !== isi4[j - 1]; });
    var prediksiJml = jml[3] + beda, prediksiIsi = isi4.slice();
    for (var j = isi4.length; j < prediksiJml; j++) prediksiIsi.push(bergantian ? 1 - prediksiIsi[j - 1] : (prediksiIsi.length ? prediksiIsi[j - 1] : 1));
    var sudutKunci = (delta);
    var cocok = [];
    pilihan.forEach(function (f, idx) {
      var base = Fig.pusatkan(tanpaPenanda(f));
      var d2 = Fig.sudutPutarKe(dasar[3], base);
      if (d2 === null) return;
      var dd = d2 > 180 ? d2 - 360 : d2;
      if (Math.abs(dd - sudutKunci) > 1e-3 && Math.abs(Math.abs(dd - sudutKunci) - 360) > 1e-3) return;
      var pn = penandaFig(f);
      if (pn.length !== prediksiJml) return;
      var isi = pn.map(function (u) { return u.isi ? 1 : 0; });
      if (isi.join() !== prediksiIsi.join()) return;
      cocok.push(idx);
    });
    if (cocok.length !== 1) m.push('opsi yang memenuhi pola putaran ada ' + cocok.length + ', seharusnya tepat satu');
    else if (cocok[0] !== b.kunci) m.push('opsi yang memenuhi pola adalah ' + HURUF[cocok[0]] + ', kunci tercetak ' + HURUF[b.kunci]);
  }

  // ------------------------------------------------------------------ interaktif

  function periksaTeksTampil(b, m, env) {
    var teks = ulangiTeks(b);
    Object.keys((b.model && b.model.tampil) || {}).forEach(function (nama) {
      var tampil = b.model.tampil[nama];
      if (teks.indexOf(tampil) < 0) { m.push('angka ' + nama + ' tercetak "' + tampil + '" tetapi tidak ditemukan di teks soal'); return; }
      var u = urai(tampil);
      if (!u || !env[nama] || !H.sama(u.q, env[nama])) m.push('angka ' + nama + ' di soal (' + tampil + ') tidak sama dengan yang dihitung');
    });
  }

  function paramEnv(b, m) {
    var env = {};
    Object.keys(b.model.param || {}).forEach(function (k) {
      try { env[k] = H.q(b.model.param[k]); } catch (e) { m.push('param ' + k + ' tidak terbaca'); }
    });
    return env;
  }

  function sekumpulanSama(q, angka, tol) { return Math.abs(nilaiAngka(q) - angka) <= (tol == null ? 1e-9 : tol); }

  function periksaPnBar(b, m) {
    var mod = b.model, is = b.isian;
    var env = paramEnv(b, m), nilai = hitungLangkah(b, env, m);
    periksaTeksTampil(b, m, env);
    var kl = mod.kunciLangkah;
    nilai = Object.assign({}, env, nilai);
    kl.total.forEach(function (nama, i) {
      if (!nilai[nama] || !sekumpulanSama(nilai[nama], is.kunci.total[i], 1e-9)) m.push('total kategori ' + (i + 1) + ' hasil hitung ulang ' + (nilai[nama] ? H.keTeks(nilai[nama], 4) : '?') + ' tidak sama dengan kunci ' + is.kunci.total[i]);
      if (is.kunci.total[i] > mod.sumbuMaks) m.push('total kunci melewati sumbu grafik');
      if (Math.abs(is.kunci.total[i] / mod.langkahTotal - Math.round(is.kunci.total[i] / mod.langkahTotal)) > 1e-9) m.push('total kunci ' + is.kunci.total[i] + ' bukan kelipatan langkah geser ' + mod.langkahTotal);
    });
    kl.persen.forEach(function (nama, i) {
      if (!nilai[nama] || !sekumpulanSama(nilai[nama], is.kunci.persen[i], 1e-9)) m.push('persentase kategori ' + (i + 1) + ' hasil hitung ulang tidak sama dengan kunci');
      if (Math.abs(is.kunci.persen[i] / mod.langkahPersen - Math.round(is.kunci.persen[i] / mod.langkahPersen)) > 1e-9) m.push('persentase kunci ' + is.kunci.persen[i] + ' bukan kelipatan ' + mod.langkahPersen);
    });
    var sama2 = is.awal.total.every(function (v, i) { return v === is.kunci.total[i]; }) && is.awal.persen.every(function (v, i) { return v === is.kunci.persen[i]; });
    if (sama2) m.push('kondisi awal sudah sama dengan kunci');
    // gambar kunci: bagian bawah + atas = total, persen sesuai
    (b.gambarPembahasan || []).forEach(function (g) {
      var br = bacaBatang(Gambar.svg(g).svg), sk = skalaGrid(br.grid);
      for (var k = 0; k < is.kunci.total.length; k++) {
        var bawah = br.batang.filter(function (x) { return x.s === 0 && x.k === k; })[0], atas = br.batang.filter(function (x) { return x.s === 1 && x.k === k; })[0];
        if (!bawah || !atas) { m.push('gambar kunci tidak memuat kedua bagian batang ' + (k + 1)); continue; }
        var jml = H.tambah(H.q(bawah.v), H.q(atas.v));
        if (!sekumpulanSama(jml, is.kunci.total[k], 1e-6)) m.push('bagian batang ' + (k + 1) + ' pada gambar kunci tidak berjumlah total');
        if (sk) {
          var hb = bawah.h / sk.px;
          if (Math.abs(hb - nilaiAngka(H.q(bawah.v))) > Math.max(0.01, hb * 0.005)) m.push('tinggi bagian bawah batang ' + (k + 1) + ' pada gambar tidak sesuai nilainya');
        }
      }
    });
  }

  function periksaPnGaris(b, m) {
    var mod = b.model, is = b.isian;
    var env = paramEnv(b, m), nilai = hitungLangkah(b, env, m);
    periksaTeksTampil(b, m, env);
    mod.kunciLangkah.nilai.forEach(function (nama, i) {
      var q = nilai[nama];
      if (!q) { m.push('langkah ' + nama + ' tidak terhitung'); return; }
      if (!sekumpulanSama(q, is.kunci.nilai[i], 1e-9)) m.push('titik ' + (i + 1) + ' hasil hitung ulang ' + H.keTeks(q, 4) + ' tidak sama dengan kunci ' + is.kunci.nilai[i]);
      if (Math.abs(is.kunci.nilai[i] / mod.snap - Math.round(is.kunci.nilai[i] / mod.snap)) > 1e-9) m.push('nilai ' + is.kunci.nilai[i] + ' bukan kelipatan langkah geser ' + mod.snap);
      if (is.kunci.nilai[i] < mod.min || is.kunci.nilai[i] > mod.maks) m.push('nilai ' + is.kunci.nilai[i] + ' di luar sumbu grafik');
    });
    if (is.awal.nilai.some(function (v) { return v !== null; })) m.push('tampilan awal tidak boleh memuat titik yang sudah terletak');
    // gambar kunci: posisi vertikal titik sesuai nilainya
    (b.gambarPembahasan || []).forEach(function (g) {
      var svg = Gambar.svg(g).svg, grid = [], titik = [];
      telusuri(pohon(svg), function (n) {
        if (n.tag === 'line' && n.attr['data-grid'] !== undefined) grid.push({ v: parseFloat(n.attr['data-grid']), y: parseFloat(n.attr.y1) });
        if (n.tag === 'circle' && n.attr['data-v'] !== undefined) titik.push({ v: parseFloat(n.attr['data-v']), cy: parseFloat(n.attr.cy), k: parseInt(n.attr['data-k'], 10) });
      });
      var sk = skalaGrid(grid);
      if (!sk) { m.push('gambar kunci tanpa garis bantu'); return; }
      titik.forEach(function (t) {
        var terukur = sk.v0 + (sk.y0 - t.cy) / sk.px;
        if (Math.abs(terukur - t.v) > Math.max(0.01, Math.abs(t.v) * 0.002)) m.push('posisi titik ' + (t.k + 1) + ' pada gambar kunci setara ' + terukur.toFixed(2) + ', bukan ' + t.v);
        if (Math.abs(t.v - is.kunci.nilai[t.k]) > 1e-9) m.push('titik ' + (t.k + 1) + ' pada gambar kunci bernilai ' + t.v + ', kunci ' + is.kunci.nilai[t.k]);
      });
      if (titik.length !== is.kunci.nilai.length) m.push('gambar kunci memuat ' + titik.length + ' titik, seharusnya ' + is.kunci.nilai.length);
    });
  }

  /** Selesaikan sistem persamaan linear kecil dengan pecahan eksak. */
  function selesaikan(jumlah, baris) {
    var A = baris.map(function (r) { return r.map(function (x) { return H.q(x); }); }), n = jumlah, pivotBaris = 0, i, j, k;
    for (var kol = 0; kol < n; kol++) {
      var p = -1;
      for (i = pivotBaris; i < A.length; i++) if (A[i][kol].n !== BigInt(0)) { p = i; break; }
      if (p < 0) return { status: 'bebas' };
      var t = A[pivotBaris]; A[pivotBaris] = A[p]; A[p] = t;
      var div = A[pivotBaris][kol];
      for (j = 0; j <= n; j++) A[pivotBaris][j] = H.bagi(A[pivotBaris][j], div);
      for (i = 0; i < A.length; i++) {
        if (i === pivotBaris) continue;
        var f = A[i][kol];
        if (f.n === BigInt(0)) continue;
        for (j = 0; j <= n; j++) A[i][j] = H.kurang(A[i][j], H.kali(f, A[pivotBaris][j]));
      }
      pivotBaris++;
    }
    for (i = pivotBaris; i < A.length; i++) if (A[i][n].n !== BigInt(0)) return { status: 'kontradiksi' };
    var x = [];
    for (i = 0; i < n; i++) x.push(A[i][n]);
    return { status: 'unik', x: x };
  }

  function periksaPnPie(b, m) {
    var mod = b.model, is = b.isian, rel = mod.relasi, N = mod.total, n = mod.jumlahGrup;
    var env = paramEnv(b, m);
    periksaTeksTampil(b, m, env);
    if (!env.N || !H.sama(env.N, H.q(String(N)))) m.push('param N tidak sama dengan jumlah seluruhnya (' + N + ')');
    var baris = [];
    rel.forEach(function (r) {
      var row = []; for (var i = 0; i <= n; i++) row.push(0);
      if (r.tipe === 'nilai') { row[r.g] = 1; row[n] = r.v; }
      else if (r.tipe === 'sama') { row[r.g] = 1; row[r.r] = -1; }
      else if (r.tipe === 'lebih') { row[r.g] = 1; row[r.r] = -1; row[n] = r.k; }
      else if (r.tipe === 'kurang') { row[r.g] = 1; row[r.r] = -1; row[n] = -r.k; }
      else if (r.tipe === 'kali') { row[r.g] = 1; row[r.r] = -r.k; }
      else m.push('relasi tidak dikenal: ' + r.tipe);
      baris.push(row);
    });
    var tot = []; for (var i2 = 0; i2 <= n; i2++) tot.push(i2 === n ? N : 1);
    baris.push(tot);
    var hasil = selesaikan(n, baris);
    if (hasil.status !== 'unik') { m.push('sistem persamaan pada soal pie ' + (hasil.status === 'bebas' ? 'tidak menentukan jawaban tunggal' : 'saling bertentangan')); return; }
    hasil.x.forEach(function (q, i) {
      if (H.banding(q, 0) <= 0) m.push('irisan ' + (i + 1) + ' bernilai tidak positif');
      var pers = H.bagi(H.kali(q, 100), N);
      if (pers.d !== BigInt(1)) m.push('persentase irisan ' + (i + 1) + ' bukan bilangan bulat: ' + H.keTeks(pers, 3));
      if (!sekumpulanSama(pers, is.kunci.persen[i], 1e-9)) m.push('persentase irisan ' + (i + 1) + ' hasil hitung ulang ' + H.keTeks(pers, 3) + ' tidak sama dengan kunci ' + is.kunci.persen[i]);
    });
    var jml = is.kunci.persen.reduce(function (s, x) { return s + x; }, 0);
    if (Math.abs(jml - 100) > 1e-9) m.push('jumlah persentase kunci ' + jml + ', seharusnya 100');
    if (is.awal.persen.every(function (v, i) { return v === is.kunci.persen[i]; })) m.push('kondisi awal sudah sama dengan kunci');
    // setiap relasi tertulis di teks soal
    var teks = ulangiTeks(b).toLowerCase(), grup = (mod.grup || []).map(function (x) { return x.toLowerCase(); });
    rel.forEach(function (r) {
      var kalimat = (b.stimulus.teks || []).filter(function (t) { return t.toLowerCase().indexOf(grup[r.g]) >= 0 && (r.r == null || t.toLowerCase().indexOf(grup[r.r]) >= 0); });
      if (!kalimat.length) { m.push('relasi untuk ' + grup[r.g] + ' tidak tertulis di soal'); return; }
      var s = kalimat.join(' ').toLowerCase();
      var angka = function (v) { return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); };
      var ok = (r.tipe === 'nilai' && s.indexOf(angka(r.v)) >= 0) || (r.tipe === 'sama' && s.indexOf('sama') >= 0) ||
        (r.tipe === 'lebih' && s.indexOf('lebih banyak') >= 0 && s.indexOf(angka(r.k)) >= 0) || (r.tipe === 'kurang' && s.indexOf('lebih sedikit') >= 0 && s.indexOf(angka(r.k)) >= 0) ||
        (r.tipe === 'kali' && s.indexOf(' kali ') >= 0 && s.indexOf(String(r.k)) >= 0);
      if (!ok) m.push('kalimat untuk relasi ' + r.tipe + ' ' + grup[r.g] + ' tidak memuat angka/kata yang sesuai');
    });
    if (teks.indexOf(angkaId(N)) < 0) m.push('jumlah seluruhnya ' + N + ' tidak tertulis di soal');
  }

  function angkaId(v) { return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }

  function periksaPnTabel(b, m) {
    var mod = b.model, is = b.isian, atr = mod.aturan;
    var tabs = b.stimulus.gambar;
    if (tabs.length !== 4 || is.tab.length !== 4) m.push('tabel interaktif harus memiliki empat tab');
    if (atr.pilihan.length < 2 || atr.pilihan.length > 4) m.push('jumlah pilihan per tab harus 2 sampai 4');
    if (is.pilihan.join('|') !== atr.pilihan.join('|')) m.push('daftar pilihan pada butir tidak sama dengan aturan');
    var hasil = [];
    tabs.forEach(function (g, i) {
      var tb = bacaTabel(Gambar.svg(g).svg), nilai = function (r, c) { var u = urai(tb.sel[r + ',' + c]); if (!u) { m.push('sel tab ' + (i + 1) + ' (' + r + ',' + c + ') tidak terbaca'); return null; } return u.q; };
      var idx;
      if (atr.jenis === 'dua-syarat') {
        var S = H.q(0), T = H.q(0);
        for (var r = 0; r < atr.baris; r++) { var s = nilai(r, atr.kolomJual), t = nilai(r, atr.kolomTarget); if (s === null || t === null) return; S = H.tambah(S, s); T = H.tambah(T, t); }
        var c1 = H.banding(S, atr.M) >= 0, c2 = H.banding(H.kali(S, 100), H.kali(H.tambah(100, atr.u), T)) >= 0;
        idx = c1 && c2 ? 0 : 1;
      } else if (atr.jenis === 'komisi') {
        var rev = nilai(0, 1), jual = nilai(1, 1), batal = nilai(2, 1);
        if (rev === null || jual === null || batal === null) return;
        var bersih = H.kurang(jual, H.kali(batal, atr.hari));
        if (H.banding(bersih, 0) <= 0) { m.push('penjualan bersih tab ' + (i + 1) + ' tidak positif'); return; }
        var avg = H.bagi(rev, bersih);
        idx = 0;
        atr.batas.forEach(function (bb, k) { if (H.banding(avg, bb) >= 0) idx = k + 1; });
        atr.batas.forEach(function (bb) { if (H.banding(H.mutlak(H.kurang(avg, bb)), 1) < 0) m.push('rata-rata tab ' + (i + 1) + ' terlalu dekat dengan batas ' + bb); });
      } else { m.push('jenis aturan tabel tidak dikenal'); return; }
      hasil.push(idx);
      if (idx !== is.kunci[i]) m.push('tab ' + (i + 1) + ': hasil hitung ulang "' + atr.pilihan[idx] + '", kunci tercetak "' + atr.pilihan[is.kunci[i]] + '"');
      if (b.gambarPembahasan && b.gambarPembahasan[i]) {
        var st = bacaTabel(Gambar.svg(b.gambarPembahasan[i]).svg).teks;
        if (st.indexOf(atr.pilihan[idx]) < 0) m.push('gambar kunci tab ' + (i + 1) + ' tidak menuliskan "' + atr.pilihan[idx] + '"');
      }
    });
    if (hasil.length === 4) {
      var beda = {};
      hasil.forEach(function (x) { beda[x] = 1; });
      if (Object.keys(beda).length < 2) m.push('keempat orang memberi hasil yang sama');
    }
    if (is.awal.some(function (v) { return v !== null; })) m.push('tampilan awal tidak boleh sudah terjawab');
  }

  function periksaIsian(b, m) {
    if (!b.isian) { m.push('butir interaktif tanpa spesifikasi isian'); return; }
    if (!b.kunciTeks) m.push('kunci dalam kalimat kosong');
    var pem = b.pembahasan[b.pembahasan.length - 1] || '';
    if (pem.indexOf('Jawaban: ') !== 0) m.push('baris "Jawaban" tidak ada pada pembahasan');
    var j = b.isian.jenis;
    if (j === 'bar-tumpuk') periksaPnBar(b, m);
    else if (j === 'garis') periksaPnGaris(b, m);
    else if (j === 'pie') periksaPnPie(b, m);
    else if (j === 'tabel') periksaPnTabel(b, m);
    else m.push('jenis isian tidak dikenal: ' + j);
  }

  // ------------------------------------------------------------------ API

  /**
   * Periksa SATU butir. @returns {{lulus:boolean, masalah:Array<string>}}
   */
  function periksaButir(b) {
    var m = [];
    try {
      if (!periksaUmum(b, m)) return { lulus: false, masalah: m };
      if (b.jenis === 'isian') periksaIsian(b, m);
      else if (b.submateri === 'verbal') periksaVerbal(b, m);
      else if (b.submateri === 'figural') {
        if (b.model.tipe === 'serial-putar') periksaSerialPutar(b, m); else periksaFiguralAtribut(b, m);
      } else periksaNumerik(b, m);
    } catch (e) { m.push('pemeriksaan gagal dijalankan: ' + (e && e.message ? e.message : e)); }
    return { lulus: m.length === 0, masalah: m };
  }

  // ------------------------------------------------------------------ butir kembar

  function tokenTeks(b) {
    var t = ulangiTeks(b) + ' ' + (b.opsi || []).map(function (o) { return o.teks; }).join(' ');
    (b.stimulus.gambar || []).forEach(function (g) {
      if (g.jenis === 'tabel') { try { t += ' ' + bacaTabel(Gambar.svg(g).svg).teks; } catch (e) { /* abaikan */ } }
      if (g.jenis === 'bar') t += ' ' + JSON.stringify(g.model.seri) + JSON.stringify(g.model.kategori);
    });
    return t.toLowerCase().replace(/[^a-z0-9À-ɏ£€$%:.,\s-]/g, ' ').split(/\s+/).filter(Boolean);
  }

  function shingle(tokens) {
    var s = new Set();
    for (var i = 0; i + 2 < tokens.length; i++) s.add(tokens[i] + ' ' + tokens[i + 1] + ' ' + tokens[i + 2]);
    return s;
  }

  /**
   * Jaccard dua himpunan 3-gram. Jaccard tidak pernah melebihi min/maks ukuran kedua
   * himpunan, jadi pasangan yang ukurannya terlalu jauh dari `ambang` langsung dianggap
   * berbeda tanpa menghitung irisannya (mempercepat pencarian di ribuan butir).
   */
  function jaccard(a, b, ambang) {
    var na = a.size, nb = b.size;
    if (!na && !nb) return 1;
    if (!na || !nb) return 0;
    if (ambang && Math.min(na, nb) / Math.max(na, nb) < ambang) return 0;
    var kecil = na < nb ? a : b, besar = kecil === a ? b : a, irisan = 0;
    kecil.forEach(function (k) { if (besar.has(k)) irisan++; });
    return irisan / (na + nb - irisan);
  }

  function sidikFigural(b) {
    var m = b.model;
    if (m.tipe === 'serial') return m.sels.map(sidikSel);
    if (m.tipe === 'serial-putar') {
      // bentuk dasar (benihnya), pola putaran, dan letak tiap unsur pada kotak pertama
      return [m.keluarga + '#' + m.deret[0].benih + '#' + m.pola.delta + '#' + m.pola.tumbuh + '#' + m.pola.selang];
    }
    return [].concat.apply([], m.grid.map(function (row) { return row.map(sidikSel); }));
  }

  var AMBANG_KEMBAR = 0.85;

  /**
   * Sidik sebuah butir untuk pembanding kembar: kunci kelompok, sidik inti, entitas,
   * parameter angka, dan (menurut jenisnya) kumpulan 3-gram teks atau kotak-kotak figural.
   */
  function buatSidik(b) {
    var sd = {
      id: b.id, kunci: b.submateri + '|' + b.keluarga,
      inti: (b.sidik && b.sidik.inti) || '', entitas: b.sidik && b.sidik.entitas,
      param: (b.sidik && b.sidik.param) || [], figural: null, shingle: null, tipe: null
    };
    if (b.submateri === 'figural') { sd.figural = sidikFigural(b); sd.tipe = b.model.tipe; }
    else sd.shingle = shingle(tokenTeks(b));
    return sd;
  }

  /**
   * Apakah dua butir (dalam bentuk sidik) kembar atau nyaris sama? Mengembalikan
   * keterangan, atau null bila keduanya cukup berbeda.
   *
   *   sidik     sidik inti sama persis
   *   figural   kotak yang tampak sama, paling banyak satu kotak yang berbeda
   *   teks      kemiripan 3-gram kata (angka ikut dihitung) sekurang-kurangnya `ambang`
   *   param     kerangka dan pelaku sama, dan hanya satu angka (atau tak satu pun) yang berbeda
   */
  function mirip(a, b, ambang) {
    if (a.kunci !== b.kunci) return null;
    ambang = ambang || AMBANG_KEMBAR;
    if (a.inti && a.inti === b.inti) return { jenis: 'sidik' };
    if (a.figural) {
      if (!b.figural || a.figural.length !== b.figural.length || a.tipe !== b.tipe) return null;
      var beda = 0;
      for (var c = 0; c < a.figural.length; c++) if (a.figural[c] !== b.figural[c]) beda++;
      var batas = (a.tipe === 'serial' || a.tipe === 'matriks-3') ? 1 : 0;
      return beda <= batas ? { jenis: 'figural', beda: beda } : null;
    }
    var jc = jaccard(a.shingle, b.shingle, ambang);
    if (jc >= ambang) return { jenis: 'teks', jaccard: Math.round(jc * 1000) / 1000 };
    if (a.entitas && a.entitas === b.entitas && a.param.length && a.param.length === b.param.length) {
      var hm = 0;
      for (var i = 0; i < a.param.length; i++) if (a.param[i] !== b.param[i]) hm++;
      if (hm <= 1) return { jenis: 'param', beda: hm };
    }
    return null;
  }

  /**
   * Pencarian kembar sebagai generator: berkala menghasilkan { fase, selesai, total } sehingga
   * pemanggil (mis. antarmuka) dapat memberi giliran ke peramban di antaranya.
   */
  function* kembarBertahap(semuaButir, ambang) {
    var kelompok = {}, temuan = [], i, j;
    for (i = 0; i < semuaButir.length; i++) {
      var sd = buatSidik(semuaButir[i]);
      (kelompok[sd.kunci] = kelompok[sd.kunci] || []).push(sd);
      if (i % 100 === 99) yield { fase: 'sidik', selesai: i + 1, total: semuaButir.length };
    }
    var kunciKel = Object.keys(kelompok), total = 0, selesai = 0;
    kunciKel.forEach(function (k) { var n = kelompok[k].length; total += n * (n - 1) / 2; });
    for (var g = 0; g < kunciKel.length; g++) {
      var daftar = kelompok[kunciKel[g]];
      for (i = 0; i < daftar.length; i++) {
        for (j = i + 1; j < daftar.length; j++) {
          var r = mirip(daftar[i], daftar[j], ambang);
          if (r) { r.a = daftar[i].id; r.b = daftar[j].id; temuan.push(r); }
        }
        selesai += daftar.length - 1 - i;
        if (i % 8 === 7) yield { fase: 'kembar', selesai: selesai, total: total };
      }
    }
    return temuan;
  }

  /** Jalankan generator sampai selesai dan kembalikan nilainya. */
  function tuntaskan(g) {
    var r = g.next();
    while (!r.done) r = g.next();
    return r.value;
  }

  /** Cari semua pasangan butir kembar/nyaris sama di seluruh hasil (per kelompok keluarga soal). */
  function cariKembar(semuaButir, ambang) { return tuntaskan(kembarBertahap(semuaButir, ambang)); }

  // ------------------------------------------------------------------ paket dan hasil

  function periksaPaket(paket, opsi) {
    var m = [];
    var semua = [];
    var ids = {};
    paket.subtes.forEach(function (st) {
      st.butir.forEach(function (b) {
        semua.push(b);
        if (!b.id) m.push('butir tanpa id pada paket ' + paket.no);
        if (ids[b.id]) m.push('id ganda: ' + b.id);
        ids[b.id] = 1;
        if (b.paket !== paket.no) m.push('butir ' + b.id + ' bernomor paket ' + b.paket + ', seharusnya ' + paket.no);
        if (b.subtes !== st.kode) m.push('butir ' + b.id + ' berada di subtes ' + st.kode + ' tetapi bertanda ' + b.subtes);
      });
      if (st.jumlah !== st.butir.length) m.push('subtes ' + st.kode + ' dinyatakan ' + st.jumlah + ' soal tetapi berisi ' + st.butir.length);
      st.butir.forEach(function (b, i) { if (b.no !== i + 1) m.push('nomor butir ' + b.id + ' seharusnya ' + (i + 1)); });
      // komposisi submateri: hitung dari butir, cocokkan dengan yang dicatat
      var hitung = {};
      st.butir.forEach(function (b) { var k = b.submateriKomposisi || b.submateri; hitung[k] = (hitung[k] || 0) + 1; });
      Object.keys(st.komposisi || {}).forEach(function (k) {
        if ((st.komposisi[k] || 0) !== (hitung[k] || 0)) m.push('komposisi ' + st.kode + '/' + k + ': diminta ' + st.komposisi[k] + ', terisi ' + (hitung[k] || 0));
      });
    });
    return { lulus: m.length === 0, masalah: m, butir: semua };
  }

  /**
   * Periksa seluruh hasil generate. @returns ringkasan lengkap; `lulus` hanya bila
   * setiap butir lulus, setiap paket konsisten, dan tidak ada butir kembar.
   */
  function* periksaHasilBertahap(hasil, opsi) {
    opsi = opsi || {};
    var butir = [], gagal = [], paketGagal = [], perSub = {}, perLevel = {}, perKunci = {}, perSubLevel = {};
    var mulai = Date.now(), total = 0, selesai = 0;
    hasil.paket.forEach(function (p) { p.subtes.forEach(function (st) { total += st.butir.length; }); });
    for (var pi = 0; pi < hasil.paket.length; pi++) {
      var p = hasil.paket[pi], rp = periksaPaket(p);
      if (!rp.lulus) paketGagal.push({ paket: p.no, masalah: rp.masalah });
      for (var bi = 0; bi < rp.butir.length; bi++) {
        var b = rp.butir[bi];
        butir.push(b);
        var r = periksaButir(b);
        if (!r.lulus) gagal.push({ id: b.id, masalah: r.masalah });
        var kunci = b.subtes + '/' + b.submateri;
        perSub[kunci] = (perSub[kunci] || 0) + 1;
        perLevel[b.level] = (perLevel[b.level] || 0) + 1;
        perSubLevel[kunci] = perSubLevel[kunci] || {};
        perSubLevel[kunci][b.level] = (perSubLevel[kunci][b.level] || 0) + 1;
        if (b.jenis === 'pg') { var h = HURUF[b.kunci]; perKunci[h] = (perKunci[h] || 0) + 1; }
        if (++selesai % 25 === 0) yield { fase: 'butir', selesai: selesai, total: total };
      }
    }
    var kembar = opsi.tanpaKembar ? [] : yield* kembarBertahap(butir, opsi.ambangKembar);
    // sidik inti harus unik di seluruh hasil
    var inti = {}, persis = [];
    butir.forEach(function (b) {
      var s = b.sidik && b.sidik.inti;
      if (!s) return;
      if (inti[s]) persis.push({ a: inti[s], b: b.id, jenis: 'sidik' });
      else inti[s] = b.id;
    });
    var jumlahGagal = gagal.length;
    return {
      lulus: gagal.length === 0 && paketGagal.length === 0 && kembar.length === 0 && persis.length === 0,
      butir: butir.length, butirLulus: butir.length - jumlahGagal, gagal: gagal, paketGagal: paketGagal,
      kembar: kembar.concat(persis), sebaran: { submateri: perSub, level: perLevel, kunci: perKunci, submateriLevel: perSubLevel },
      waktuMs: Date.now() - mulai
    };
  }

  /** Periksa seluruh hasil sekaligus (sinkron). */
  function periksaHasil(hasil, opsi) { return tuntaskan(periksaHasilBertahap(hasil, opsi)); }

  /**
   * Periksa seluruh hasil tanpa membekukan peramban: pekerjaan dipotong-potong dan antar-potongan
   * dipakai `setTimeout`. opsi.irisanMs (baku 30) dan opsi.saatKemajuan({fase, selesai, total}).
   * @returns {Promise<object>} hasil yang sama dengan `periksaHasil`
   */
  function periksaHasilAsinkron(hasil, opsi) {
    opsi = opsi || {};
    var irisan = opsi.irisanMs || 30, g = periksaHasilBertahap(hasil, opsi);
    return new Promise(function (selesai, gagal) {
      function langkah() {
        try {
          var batas = Date.now() + irisan, r, terakhir = null;
          do { r = g.next(); if (!r.done) terakhir = r.value; } while (!r.done && Date.now() < batas);
          if (terakhir && opsi.saatKemajuan) opsi.saatKemajuan(terakhir);
          if (r.done) selesai(r.value); else setTimeout(langkah, 0);
        } catch (e) { gagal(e); }
      }
      langkah();
    });
  }

  return {
    periksaButir: periksaButir, periksaPaket: periksaPaket, periksaHasil: periksaHasil, periksaHasilAsinkron: periksaHasilAsinkron, cariKembar: cariKembar,
    turunkanVerbal: turunkanVerbal, urai: urai, selesaikan: selesaikan, buatSidik: buatSidik, mirip: mirip, AMBANG_KEMBAR: AMBANG_KEMBAR
  };
});
