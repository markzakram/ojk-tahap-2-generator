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
 *               memastikan tepat satu opsi yang memenuhi semuanya; untuk matriks 5x5,
 *               5x6, 2x2 bersekat, dan deret kotak ganda, aturannya disimpulkan dari
 *               gambar soal yang tampil lalu dicocokkan dengan gambar tiap opsi; gambar
 *               pembahasan (tahapan pola) wajib ada, disebut di teks, dan jawabannya
 *               sama dengan opsi kunci, tetapi tidak dipakai untuk membuktikan kunci
 *   interaktif  menghitung ulang kondisi akhir (batang, tab, titik, irisan)
 *
 * Satu butir lulus bila masalahnya kosong. Paket dan seluruh hasil generate
 * diperiksa lagi untuk komposisi, sebaran, dan butir kembar.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./hitung.js'), require('./svgraster.js'), require('./inferensi.js'), require('./figure.js'), require('./gambar.js'),
      [require('./cek-transformasi.js'), require('./cek-transformasi-analogi.js'), require('./cek-lipat-kertas.js'), require('./cek-serial-petak.js'),
        require('./cek-matriks-tumpuk.js'), require('./cek-matriks-bentuk.js')]);
    module.exports = api;
  } else {
    api = factory(root.Hitung, root.SvgRaster, root.Inferensi, root.Figure, root.Gambar,
      [root.CekTransformasi, root.CekTransformasiAnalogi, root.CekLipatKertas, root.CekSerialPetak, root.CekMatriksTumpuk, root.CekMatriksBentuk]);
    root.Validator = api;
  }
})(typeof self !== 'undefined' ? self : this, function (H, SvgRaster, Inf, Fig, Gambar, Pemeriksa) {
  'use strict';

  /**
   * Pemeriksa figural tambahan (berkas cek-*.js), menurut model.tipe:
   *   { periksa(b, masalah, alat), sidik(b) -> [teks], batas: banyak bagian berbeda yang masih "nyaris sama" }
   * Pemeriksa membaca data gambar yang tampil dan menghitung jawabannya sendiri, tanpa memakai kode penyusun.
   */
  var CEK = {};
  Pemeriksa.forEach(function (c) {
    Object.keys((c && c.TIPE) || {}).forEach(function (t) {
      if (CEK[t]) throw new Error('pemeriksa figural ganda: ' + t);
      CEK[t] = c.TIPE[t];
    });
  });

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
    var t = (b.stimulus.teks || []).join(' ') + ' ' + (b.stimulus.kartu || []).map(function (k) { return k.judul + ' ' + k.teks; }).join(' ') + ' ' + (b.pertanyaan || '') + ' ' + (b.perintah || '');
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

  // ---- pengecoh numerik: setiap pengecoh berasal dari jalur kesalahan yang hitungannya tertulis

  /** Kalimat alasan lama yang hanya membandingkan angka, bukan menunjukkan kesalahannya. */
  var ALASAN_UMUM = [
    /salah hitung pada salah satu langkah/i, /dari jawaban yang benar/i, /\bmenebak\b/i, /tanpa dasar/i,
    /salah (menghitung|menjumlahkan) satu/i, /salah membulatkan/i, /salah membaca angka/i, /salah menggeser koma/i,
    /membagi dua (perubahan|kenaikan|selisih|hasil)/i, /^terlalu (cepat|lambat|sedikit|banyak|besar|kecil)\b/i
  ];

  /** Inti angka teks pilihan: "9:2", "5/6", "1.234,50", "68,57"; null bila pilihan berupa kata (bulan, nama tim). */
  function intiAngka(teks) {
    var t = String(teks).replace(/ /g, ' '), r = /\d+\s*:\s*\d+/.exec(t);
    if (r) return r[0].replace(/\s+/g, '');
    r = /\d+\s*\/\s*\d+/.exec(t);
    if (r) return r[0].replace(/\s+/g, '');
    r = /\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:,\d+)?/.exec(t);
    return r ? r[0] : null;
  }

  function memuatAngka(teks, inti) {
    var t = String(teks).replace(/\s*:\s*/g, ':').replace(/(\d)\s*\/\s*(\d)/g, '$1/$2');
    return new RegExp('(^|[^\\d.,])' + inti.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&') + '(?!\\d|[.,]\\d)').test(t);
  }

  /**
   * Alasan tiap pengecoh harus menamai kesalahannya DAN menuliskan hitungannya sampai ke
   * pilihan itu (angka pilihan, atau nama bulan/tim untuk pilihan berupa kata), bukan
   * kalimat umum seperti "kurang ... dari jawaban yang benar". Alasan juga harus muncul
   * di pembahasan.
   */
  function periksaAlasanPengecoh(b, m) {
    // pembahasan tidak lagi mengulas opsi salah (panduan revisi paket-002); alasan cukup ada di data opsi
    var bahas = (b.pembahasan || []).join('\n');
    if (/Pilihan lain yang menjebak/.test(bahas)) m.push('pembahasan masih mengulas pilihan yang salah');
    b.opsi.forEach(function (o, i) {
      if (i === b.kunci) return;
      var al = o.alasan == null ? '' : String(o.alasan).trim();
      if (al.length < 15) { m.push('pengecoh ' + HURUF[i] + ' (' + o.teks + ') tidak punya alasan jalur kesalahan'); return; }
      if (ALASAN_UMUM.some(function (r) { return r.test(al); })) { m.push('alasan pengecoh ' + HURUF[i] + ' masih kalimat umum, bukan jalur kesalahan: ' + al); return; }
      if (!/\d/.test(al) || !/[=≈<>≥≤]/.test(al)) { m.push('alasan pengecoh ' + HURUF[i] + ' tidak menuliskan hitungan jalur kesalahannya: ' + al); return; }
      var inti = intiAngka(o.teks);
      if (inti ? !memuatAngka(al, inti) : al.toLowerCase().indexOf(String(o.teks).toLowerCase()) < 0) {
        m.push('alasan pengecoh ' + HURUF[i] + ' tidak sampai pada pilihan itu (' + o.teks + '): ' + al);
      }
    });
  }

  // ---- angka yang tercetak: semuanya tercatat, dan setiap angka data memengaruhi jawaban

  /** Bilangan yang tercetak pada teks: perbandingan "3:2", pecahan "3/4", dan angka gaya Indonesia. */
  function angkaTercetak(teks) {
    var hasil = [], re = /\d+\s*:\s*\d+|\d+\s*\/\s*\d+|\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:,\d+)?/g, r;
    while ((r = re.exec(teks))) hasil.push(r[0]);
    return hasil;
  }

  /**
   * Setiap bilangan di stimulus dan pertanyaan harus tercatat sebagai angka data (`tampil`,
   * dihitung ulang dan dicek gemanya), perbandingan (`rasioTampil`), atau konteks yang
   * memang bukan data (`konteks`, mis. "1" dan "1.000" pada "1 liter = 1.000 cm³" atau tahun pada judul kolom).
   * Angka tak tercatat bisa jadi informasi yang tidak dipakai atau data yang tidak diperiksa.
   */
  function periksaAngkaTercetak(b, m, mod) {
    var teks = (b.stimulus.teks || []).join(' ') + ' ' + (b.pertanyaan || '');
    var kenal = [];
    Object.keys(mod.tampil || {}).concat((mod.konteks || []).map(function (k, i) { return '#' + i; })).forEach(function (k) {
      var u = urai(k.charAt(0) === '#' ? mod.konteks[Number(k.slice(1))] : mod.tampil[k]);
      if (u && u.tipe === 'angka') kenal.push(u.q);
    });
    var rasio = (mod.rasioTampil || []).map(function (r) { return String(r).replace(/\s+/g, ''); });
    angkaTercetak(teks).forEach(function (t) {
      if (/:/.test(t)) {
        if (rasio.indexOf(t.replace(/\s+/g, '')) < 0) m.push('perbandingan ' + t + ' tercetak di soal tetapi tidak tercatat');
        return;
      }
      var u = urai(t);
      if (!u || !kenal.some(function (q) { return H.sama(q, u.q); })) m.push('angka ' + t + ' tercetak di soal tetapi tidak tercatat sebagai data atau konteks');
    });
  }

  /**
   * Setiap angka data yang tercetak harus diperlukan: bila nilainya diganti (×2, ×1/3,
   * ×1,01, ×100), hasil hitung ulang `jawab` harus berubah untuk sedikitnya satu
   * penggantian. Menangkap informasi yang tercoret dengan sendirinya (mis. berat yang
   * diketahui tetapi lenyap dari persamaan setelah substitusi).
   */
  function periksaPerlu(b, m, mod, env, jawab) {
    // ×100 dicoba terakhir: hanya perlu untuk angka yang pengaruhnya lewat maks/min (dan mahal bila angka itu pangkat)
    var pengali = [H.q(2), H.Q(BigInt(1), BigInt(3)), H.q('1.01'), H.q(100)];
    Object.keys(mod.tampil || {}).forEach(function (nama) {
      if (!env[nama] || !mod.param || !Object.prototype.hasOwnProperty.call(mod.param, nama)) return;
      var berubah = pengali.some(function (f) {
        var e = Object.assign({}, env), abaikan = [];
        e[nama] = H.kali(env[nama], f);
        var hasil = hitungLangkah(b, e, abaikan);
        return abaikan.length > 0 || !hasil.jawab || !H.sama(hasil.jawab, jawab);
      });
      if (!berubah) m.push('angka ' + nama + ' (' + mod.tampil[nama] + ') tercetak di soal tetapi tidak memengaruhi jawaban');
    });
  }

  // ---- pembahasan soal hitungan: Diketahui, Ditanyakan, Pengerjaan, Kesimpulan, dengan baris persamaan "§ "

  var JUDUL_HITUNG = ['Diketahui', 'Ditanyakan', 'Pengerjaan', 'Kesimpulan'];
  /** Perintah notasi persamaan yang dapat dicetak penulis Word (OMML), PDF/Excel (teks), dan antarmuka (HTML). */
  var PERINTAH_RUMUS = ['frac', 'text', 'mathrm', 'times', 'div', 'cdot', 'pm', 'approx', 'le', 'leq', 'ge', 'geq', 'ne', 'neq', 'to', 'rightarrow', 'quad', 'ldots'];
  var RELASI = { '=': 'sama', '\\approx': 'kira', '<': 'kurang', '>': 'lebih', '\\le': 'kurangsama', '\\leq': 'kurangsama', '\\ge': 'lebihsama', '\\geq': 'lebihsama', '\\ne': 'beda', '\\neq': 'beda' };

  /**
   * Sintaks satu notasi persamaan, diperiksa sendiri (tidak memakai pengurai penulis): kurung kurawal
   * seimbang, perintah dikenal, \frac diikuti dua grup, \text diikuti grup, pangkat/indeks punya basis
   * dan isi, dan kata (tiga huruf atau lebih) hanya di dalam \text supaya tidak tercetak sebagai
   * deretan variabel miring. @returns {string|null} pesan masalah, atau null bila sah
   */
  function sintaksPersamaan(s) {
    if (/[£€]/.test(s)) return 'memakai simbol mata uang selain $';
    var dalam = 0, i, c, polos = '';
    for (i = 0; i < s.length; i++) {
      c = s.charAt(i);
      if (c === '\\') {
        var r = /^\\([a-zA-Z]+|.)/.exec(s.slice(i));
        if (!r) return '"\\" tanpa perintah';
        var nama = r[1];
        i += r[0].length;
        if (/^[a-zA-Z]+$/.test(nama) && PERINTAH_RUMUS.indexOf(nama) < 0) return 'perintah \\' + nama + ' tidak dikenal';
        if (!/^[a-zA-Z]+$/.test(nama) && '%$ ,{}'.indexOf(nama) < 0) return 'perintah \\' + nama + ' tidak dikenal';
        if (nama === 'frac') {
          // dua grup berturut-turut: pembilang dan penyebut
          for (var g = 0; g < 2; g++) {
            if (s.charAt(i) !== '{') return '\\frac tanpa grup pembilang/penyebut';
            var d = 0, j = i;
            for (; j < s.length; j++) { if (s.charAt(j) === '{') d++; else if (s.charAt(j) === '}' && --d === 0) break; }
            if (j >= s.length) return 'grup \\frac tidak ditutup';
            var sub = sintaksPersamaan(s.slice(i + 1, j));
            if (sub) return sub;
            i = j + 1;
          }
        } else if (nama === 'text' || nama === 'mathrm') {
          if (s.charAt(i) !== '{') return '\\text tanpa grup';
          var tutup = s.indexOf('}', i);
          if (tutup < 0 || s.slice(i + 1, tutup).indexOf('{') >= 0) return '\\text tidak ditutup';
          i = tutup + 1;
          polos += ' ';
        }
        i--;
        polos += ' ';
        continue;
      }
      if (c === '{') dalam++;
      else if (c === '}') { if (--dalam < 0) return 'kurung kurawal "}" berlebih'; }
      else if (c === '^' || c === '_') {
        if (!i || /[\s=]/.test(s.charAt(i - 1))) return '"' + c + '" tanpa basis';
        if (i + 1 >= s.length || /\s/.test(s.charAt(i + 1))) return '"' + c + '" tanpa isi';
      }
      polos += c;
    }
    if (dalam) return 'kurung kurawal tidak seimbang';
    var kata = /[a-zA-Z]{3,}/.exec(polos);
    if (kata) return 'kata "' + kata[0] + '" di luar \\text';
    return null;
  }

  /** Pecah notasi pada tingkat kurung terluar menurut daftar pemisah (relasi atau pemisah pernyataan). */
  function pecahLuar(s, pemisah) {
    var hasil = [{ isi: '', sebelum: null }], dalam = 0;
    for (var i = 0; i < s.length; i++) {
      var c = s.charAt(i);
      if (c === '{') dalam++;
      else if (c === '}') dalam--;
      if (!dalam) {
        var cocok = null;
        pemisah.forEach(function (p) {
          if (s.slice(i, i + p.length) === p && !(p.charAt(0) === '\\' && /[a-zA-Z]/.test(s.charAt(i + p.length))) && (!cocok || p.length > cocok.length)) cocok = p;
        });
        if (cocok) { hasil.push({ isi: '', sebelum: cocok }); i += cocok.length - 1; continue; }
      }
      hasil[hasil.length - 1].isi += c;
    }
    return hasil;
  }

  /**
   * Nilai eksak satu ruas persamaan. Satuan dan kata (\text, beserta pangkat satuannya) dicatat lalu
   * dibuang; \$ dibuang; \% berarti per seratus; ":" pada perbandingan berarti dibagi; angka ditulis
   * gaya Indonesia (titik ribuan, koma desimal). @returns {{q, satuan:string, tunggal:(object|null)}|null}
   * null bila ruas memuat variabel atau tidak memuat angka; melempar galat bila angkanya tak terhitung.
   */
  function nilaiRuas(ruas) {
    var s = String(ruas).trim().replace(/[\s,.;]+$/, ''), i = 0, satuan = [];
    if (!/\d/.test(s)) return null;
    function grup() {
      if (s.charAt(i) !== '{') throw new Error('grup diharapkan');
      i++;
      var isi = deret('}');
      i++;
      return isi;
    }
    function deret(akhir) {
      var o = '';
      while (i < s.length && s.charAt(i) !== akhir) {
        var c = s.charAt(i);
        if (c === '\\') {
          var r = /^\\([a-zA-Z]+|.)/.exec(s.slice(i)), nama = r[1];
          i += r[0].length;
          if (nama === 'frac') { var atas = grup(), bawah = grup(); o += '((' + atas + ')/(' + bawah + '))'; }
          else if (nama === 'text' || nama === 'mathrm') {
            var tutup = s.indexOf('}', i);
            satuan.push(s.slice(i + 1, tutup).trim());
            i = tutup + 1;
            // pangkat milik satuan (m^3, cm^3) bukan pangkat bilangan
            if (s.charAt(i) === '^') { i++; if (s.charAt(i) === '{') grup(); else i++; }
            o += ' ';
          } else if (nama === 'times' || nama === 'cdot') o += '*';
          else if (nama === 'div') o += '/';
          else if (nama === '%') o += '%';
          else if (nama === '$' || nama === ' ' || nama === ',' || nama === 'quad') o += ' ';
          else return null;
        } else if (c === '{') {
          if (s.slice(i, i + 3) === '{,}') { o += ','; i += 3; } else o += '(' + grup() + ')';
        } else if (c === '^') { i++; o += '^(' + (s.charAt(i) === '{' ? grup() : s.charAt(i++)) + ')'; }
        else { o += c; i++; }
      }
      return o;
    }
    var expr = deret(null);
    if (expr === null || /[a-zA-Z_]/.test(expr)) return null;
    expr = expr.replace(/\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:,\d+)?/g, function (x) { return x.replace(/\./g, '').replace(',', '.'); }).replace(/:/g, '/');
    var q;
    try { q = H.hitung(expr, {}); } catch (e) {
      // kata di tengah rumus umum ("100% - persen cacat") membuat ruas bukan bilangan murni
      if (satuan.length) return null;
      throw e;
    }
    // ruas berupa satu bilangan: banyaknya angka desimal yang tercetak menentukan toleransi pembulatan
    var polos = String(ruas).replace(/\\text\{[^}]*\}(\^\{[^}]*\}|\^\d)?/g, '').replace(/\\\$|\\ |\\,|\\quad|\s/g, '').replace(/[,.;]+$/, '');
    var t1 = /^-?\d{1,3}(?:\.\d{3})*(?:(?:\{,\}|,)(\d+))?(\\%)?$|^-?\d+(?:(?:\{,\}|,)(\d+))?(\\%)?$/.exec(polos);
    var tunggal = t1 ? { desimal: (t1[1] || t1[3] || '').length, persen: !!(t1[2] || t1[4]) } : null;
    return { q: q, satuan: satuan.filter(Boolean).join('|'), tunggal: tunggal };
  }

  /**
   * Setiap baris persamaan: sintaksnya sah dan setiap relasi antara dua ruas berangka benar. "=" harus
   * tepat (pecahan eksak), "\approx" hanya selisih pembulatan angka yang tercetak, dan <, >, \le, \ge
   * harus berlaku. Dua ruas dengan satuan berbeda (konversi, mis. 1 m^3 = 1.000.000 cm^3) tidak dibandingkan.
   */
  function periksaPersamaan(notasi, m) {
    var salah = sintaksPersamaan(notasi);
    if (salah) { m.push('baris persamaan "' + notasi + '" tidak sah: ' + salah); return; }
    pecahLuar(notasi, ['\\quad', ';']).forEach(function (pernyataan) {
      var ruas = pecahLuar(pernyataan.isi, Object.keys(RELASI)), nilai;
      try { nilai = ruas.map(function (r) { return nilaiRuas(r.isi); }); } catch (e) { m.push('baris persamaan "' + notasi + '" memuat ruas yang tidak dapat dihitung: ' + e.message); return; }
      for (var k = 1; k < ruas.length; k++) {
        var a = nilai[k - 1], b = nilai[k], rel = RELASI[ruas[k].sebelum];
        if (!a || !b || (a.satuan && b.satuan && a.satuan !== b.satuan)) continue;
        var beda = H.banding(a.q, b.q), benar;
        if (rel === 'sama') benar = beda === 0;
        else if (rel === 'kira') {
          var acuan = b.tunggal ? b : (a.tunggal ? a : null), tol;
          if (acuan) tol = H.bagi(H.q('5e-' + (acuan.tunggal.desimal + 1)), acuan.tunggal.persen ? 100 : 1);
          else tol = H.kali(H.mutlak(b.q), H.q('0.005'));
          benar = H.banding(H.mutlak(H.kurang(a.q, b.q)), tol) <= 0;
        } else if (rel === 'kurang') benar = beda < 0;
        else if (rel === 'lebih') benar = beda > 0;
        else if (rel === 'kurangsama') benar = beda <= 0;
        else if (rel === 'lebihsama') benar = beda >= 0;
        else benar = beda !== 0;
        if (!benar) m.push('baris persamaan "' + notasi + '" keliru: ' + ruas[k - 1].isi.trim() + ' ' + ruas[k].sebelum + ' ' + ruas[k].isi.trim() + (rel === 'sama' ? ' (bila hasilnya dibulatkan, tulis \\approx)' : ''));
      }
    });
  }

  /**
   * Pembahasan soal cerita, tabel, dan grafik (panduan revisi tim akademik): empat judul bagian berurutan,
   * tiap bagian berisi; Pengerjaan memuat baris persamaan; Kesimpulan menjawab dengan nilai kunci dan
   * huruf kuncinya; setiap baris persamaan sah dan benar hitungannya.
   */
  function periksaBahasHitung(b, m) {
    var p = b.pembahasan || [], pos = JUDUL_HITUNG.map(function (j) { return p.indexOf(j); });
    p.forEach(function (l) { if (/^§ /.test(l)) periksaPersamaan(l.slice(2), m); });
    if (p.some(function (l) { return l.indexOf('{HURUF}') >= 0; })) m.push('penanda {HURUF} pada pembahasan tidak terisi');
    var hilang = JUDUL_HITUNG.filter(function (j, k) { return pos[k] < 0; });
    if (hilang.length) { m.push('pembahasan soal hitungan tidak memuat bagian: ' + hilang.join(', ')); return; }
    if (JUDUL_HITUNG.some(function (j) { return p.filter(function (l) { return l === j; }).length > 1; })) m.push('judul bagian pembahasan tertulis lebih dari sekali');
    for (var k = 1; k < 4; k++) if (!(pos[k] > pos[k - 1] + 1)) { m.push('bagian pembahasan tidak berurutan Diketahui, Ditanyakan, Pengerjaan, Kesimpulan atau ada bagian yang kosong'); return; }
    if (!p.slice(pos[2] + 1, pos[3]).some(function (l) { return /^§ /.test(l); })) m.push('bagian Pengerjaan tidak memuat baris persamaan');
    var kunci = b.opsi[b.kunci], inti = intiAngka(kunci.teks);
    var simpul = p.slice(pos[3] + 1).filter(function (l) { return !/^Jawaban: /.test(l) && !/^§ /.test(l); });
    var jawab = simpul.filter(function (l) { return /Jawaban: [A-E]\b/.test(l); });
    if (!jawab.length) m.push('Kesimpulan tidak menyebut huruf jawaban');
    else if (jawab.some(function (l) { return !new RegExp('Jawaban: ' + HURUF[b.kunci] + '\\b').test(l); })) m.push('huruf jawaban pada Kesimpulan tidak sama dengan kunci ' + HURUF[b.kunci]);
    else if (!jawab.some(function (l) { return inti ? memuatAngka(l, inti) : l.toLowerCase().indexOf(String(kunci.teks).toLowerCase()) >= 0; })) m.push('Kesimpulan tidak menyebut nilai jawaban (' + kunci.teks + ')');
  }

  /** Soal yang memakai uang hanya memakai dolar ($): tidak ada £, €, atau kurs pada soal, gambar, opsi, dan pembahasan. */
  function periksaMataUang(b, m) {
    var semua = [ulangiTeks(b)].concat(b.opsi.map(function (o) { return o.teks + ' ' + (o.alasan || ''); }), b.pembahasan || [],
      (b.stimulus.gambar || []).map(function (g) { return JSON.stringify(g.model || {}) + ' ' + (g.judul || ''); })).join('\n');
    if (/[£€]|\b(kurs|euro|pound)\b/i.test(semua)) m.push('soal memakai mata uang selain dolar atau menyebut konversi kurs');
  }

  function periksaNumerik(b, m) {
    if (!periksaPilihan(b, m, 5)) return;
    var mod = b.model || {}, info = {};
    if (b.jenis === 'pg' && ['cerita', 'tabel', 'grafik'].indexOf(b.submateri) >= 0) {
      periksaAlasanPengecoh(b, m);
      periksaBahasHitung(b, m);
      periksaMataUang(b, m);
    }
    var env = bangunEnv(b, m, info);
    var nilai = hitungLangkah(b, env, m);
    var toleransi = mod.toleransi == null ? 0 : mod.toleransi;
    var kunciOpsi = b.opsi[b.kunci];

    // ---- hitung ulang
    var jawab = null, jenis = mod.jenisHitung || 'langkah';
    if (jenis === 'lunas-bulan') {
      var P0 = env.P0, g = env.g, C = env.C, m0 = env.m0 ? Number(env.m0.n) : -1;
      if (!P0 || !g || !C || m0 < 0) { m.push('param laba-majemuk tidak lengkap'); return; }
      // uang muka (bila ada) dibayar tunai; sisanya dilunasi laba mulai bulan pembelian
      var sisa = env.DP ? H.kurang(C, env.DP) : C;
      var kum = H.q(0), laba = P0, k = 0;
      while (H.banding(kum, sisa) < 0 && k < 40) { kum = H.tambah(kum, laba); laba = H.bagi(H.kali(laba, H.tambah(100, g)), 100); k++; }
      var idx = m0 + k - 1;
      if (idx > 11) m.push('bulan lunas yang dihitung ulang melewati Desember tahun pembelian');
      var kunciIdx = bulanIndeks(kunciOpsi.teks);
      if (kunciIdx !== idx % 12) m.push('bulan lunas yang dihitung ulang: ' + BULAN[idx % 12] + ', kunci tercetak: ' + kunciOpsi.teks);
      // bulan pilihan: berbeda, urut waktu, pada atau sesudah bulan pembelian dalam tahun yang sama
      var sebelum = -1;
      b.opsi.forEach(function (o, i) {
        var bi = bulanIndeks(o.teks);
        if (bi < 0) m.push('opsi ' + HURUF[i] + ' bukan nama bulan: ' + o.teks);
        else if (bi < m0) m.push('opsi ' + HURUF[i] + ' (' + o.teks + ') jatuh sebelum bulan pembelian (' + BULAN[m0] + ')');
        else if (bi <= sebelum) m.push('opsi bulan tidak urut waktu pada ' + HURUF[i]);
        sebelum = Math.max(sebelum, bi);
      });
      if (ulangiTeks(b).toLowerCase().indexOf('bulan ' + BULAN[m0]) < 0) m.push('bulan pembelian (' + BULAN[m0] + ') tidak tertulis di soal');
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
      // pilihan tahun: bilangan bulat positif yang berbeda dan urut naik (dari jalur kesalahan, tidak harus berurutan)
      var nums = b.opsi.map(function (o) { var u = urai(o.teks); return u && u.q.d === BigInt(1) ? Number(u.q.n) : NaN; });
      nums.forEach(function (v, i) {
        if (!(v >= 1)) m.push('opsi tahun ' + HURUF[i] + ' bukan bilangan bulat positif');
        else if (i && !(v > nums[i - 1])) m.push('opsi tahun tidak urut naik pada ' + HURUF[i]);
      });
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
    periksaPerlu(b, m, mod, env, jawab);
    finalNumerik(b, m, mod, env, nilai);
  }

  /** Pemeriksaan yang berlaku untuk semua butir numerik: gema angka, angka tercetak, keseimbangan, jumlah tabel. */
  function finalNumerik(b, m, mod, env, nilai) {
    var teks = ulangiTeks(b);
    periksaAngkaTercetak(b, m, mod);
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
  // "sekurang-kurangnya", "paling lambat <angka> <satuan>", arah "menaikkan/menurunkan",
  // temuan "menunjukkan" yang tidak berlaku umum, ...) ada di kalimatnya. Daftar penanda di
  // bawah ini milik validator; tidak diambil dari penyusun.

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
  var V_TEMUAN = ['menunjukkan', 'memperlihatkan', 'mendapati', 'mencatat', 'menemukan'];
  var V_TIPE = ['latar', 'golongan', 'bagian', 'daftar', 'sebab', 'kuantor', 'status', 'syarat', 'urutan', 'banding', 'batas', 'temuan'];

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
  /** lambat ("paling lambat t ... setelah", batas akhir) atau cepat ("paling cepat t ... setelah", masa tunggu). */
  function batasDariTeks(teks) {
    var t = kecilV(teks), lambat = /(paling lambat|selambat-lambatnya)/.test(t), cepat = /(paling cepat|paling awal|secepat-cepatnya)/.test(t);
    if (lambat === cepat) return null;
    return lambat ? 'lambat' : 'cepat';
  }
  /** Pernyataan batas waktu: memenuhi, melewati, atau menyebut batasnya sendiri ("paling lambat v ..."). */
  function batasKlaimDariTeks(teks) {
    var t = kecilV(teks);
    if (negasiV(t)) return null;
    var penuhi = /(memenuhi batas waktu|masih dalam batas waktu)/.test(t), lewat = /(melewati batas waktu|melampaui batas waktu|terlambat)/.test(t);
    if (penuhi && !lewat) return 'memenuhi';
    if (lewat && !penuhi) return 'melewati';
    return !penuhi && !lewat && batasDariTeks(t) === 'lambat' ? 'batas' : null;
  }
  /** Angka dan satuan waktu tercetak berdampingan ("24 jam", "10 hari kerja"). */
  function adaWaktu(teks, v, satuan) {
    return !!satuan && new RegExp('(^|[^\\d.,])' + angkaId(v).replace(/\./g, '\\.') + '\\s+' + kecilV(satuan).replace(/\s+/g, '\\s+') + '(?=[^a-z]|$)').test(kecilV(teks));
  }
  /** Penanda berlaku umum: semua, seluruh, setiap, di mana pun. */
  function umumV(teks) { return /(^|[^a-z])(semua|seluruh|setiap|mana pun)([^a-z]|$)/.test(kecilV(teks)); }
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
    if (k.tipe === 'batas') {
      var bt = cari('batas', function (x) { return x.aksi === k.aksi; });
      if (!bt.length) return 'TD';     // tahap lain: batas waktunya tidak disebut
      if (bt.length > 1) return 'GANDA';
      var b0 = bt[0];
      if (b0.satuan !== k.satuan || (b0.jenis !== 'lambat' && b0.jenis !== 'cepat')) return 'TIDAK-DIKENAL';
      var dalam = b0.jenis === 'lambat' ? k.v <= b0.batas : k.v >= b0.batas;
      if (k.jenis === 'memenuhi') return dalam ? 'B' : 'S';
      if (k.jenis === 'melewati') return b0.jenis === 'lambat' ? (dalam ? 'S' : 'B') : 'TIDAK-DIKENAL';
      if (k.jenis === 'batas') return b0.jenis === 'lambat' && k.v === b0.batas ? 'B' : 'AMBIGU';
      return 'TIDAK-DIKENAL';
    }
    if (k.tipe === 'temuan') {
      var tm = cari('temuan', function (x) { return x.hal === k.hal; });
      if (!tm.length) return 'TD';
      if (tm.length > 1) return 'GANDA';
      if (k.lingkup === tm[0].lingkup) return k.arah === tm[0].arah ? 'B' : 'S';
      // hasil di satu lingkup tidak berlaku umum; lawan arahnya di lingkup lebih luas bergantung pada tafsiran
      return k.arah === tm[0].arah ? 'TD' : 'AMBIGU';
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
    } else if (f.tipe === 'batas') {
      if (!adaWaktu(f.teks, f.batas, f.satuan)) m.push(pelaku + ': batas ' + f.batas + ' ' + f.satuan + ' tidak tercetak');
      var bj = batasDariTeks(f.teks);
      if (bj !== f.jenis) m.push(pelaku + ': batas waktu tertulis "' + bj + '", model "' + f.jenis + '"');
      if (!f.nama || !f.nama.aksi) m.push(pelaku + ': hal yang dibatasi waktunya tidak bernama');
    } else if (f.tipe === 'temuan') {
      var pt = kecilV(f.penanda);
      if (!pt || t.indexOf(pt) < 0) m.push(pelaku + ': penanda "' + f.penanda + '" tidak tertulis');
      else {
        if (!f.nama || !f.nama.hal || pt.indexOf(kecilV(f.nama.hal)) < 0) m.push(pelaku + ': hal yang diamati tidak ada pada penanda "' + f.penanda + '"');
        if (!arahCocok(pt, f.arah)) m.push(pelaku + ': kata pada "' + f.penanda + '" tidak menunjukkan arah ' + f.arah);
      }
      if (!f.nama || !f.nama.lingkup) m.push(pelaku + ': lingkup temuan tidak bernama');
      if (!adaSalahSatu(t, V_TEMUAN)) m.push(pelaku + ': temuan tidak ditandai "menunjukkan/mendapati/mencatat"');
      // temuan setempat bukan pernyataan bukti umum dan tidak berlaku umum
      if (/(terbukti|membuktikan|secara teori|pada prinsipnya)/.test(t)) m.push(pelaku + ': temuan memakai penanda status bukti');
      if (umumV(t)) m.push(pelaku + ': temuan setempat ditulis berlaku umum');
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
    else if (k.tipe === 'batas') {
      if (!adaWaktu(k.teks, k.v, k.satuan)) salah('angka atau satuan waktu tidak sesuai model');
      if (batasKlaimDariTeks(sisa) !== k.jenis) salah('jenis pernyataan batas waktu tertulis "' + batasKlaimDariTeks(sisa) + '", model "' + k.jenis + '"');
    } else if (k.tipe === 'temuan') {
      var pk = kecilV(k.penanda);
      if (!pk || t.indexOf(pk) < 0 || !k.nama || !k.nama.hal || pk.indexOf(kecilV(k.nama.hal)) < 0 || !arahCocok(pk, k.arah)) salah('arah temuan tidak tertulis sesuai model');
      if (k.lingkup === 'umum' ? !umumV(sisa) : (umumV(sisa) || !k.nama || !k.nama.lingkup)) salah('lingkup temuan tidak tertulis sesuai model');
      if (negasiV(sisa)) salah('pernyataan temuan memakai penyangkalan');
    }
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
      var kk = { daftar: 'daftar ' + f.subjek + '/' + f.himp, kuantor: 'kuantor ' + f.kelompok + '/' + f.sifat, status: 'status ' + f.hal, syarat: 'syarat ' + f.aksi, urutan: 'urutan ' + f.subjek,
        batas: 'batas ' + f.aksi, temuan: 'temuan ' + f.hal }[f.tipe];
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
    var kl = mod.klaim;
    // istilah pada pernyataan harus istilah yang dipakai fakta untuk id yang sama (bukan hanya id-nya)
    var namaId = {};
    function catatNama(id, nm) { if (typeof id === 'string' && nm) namaId[id] = kecilV(nm); }
    mod.fakta.forEach(function (f) {
      if (!f.nama) return;
      if (f.tipe === 'banding') { catatNama(f.a, f.nama.a); catatNama(f.b, f.nama.b); }
      else if (f.tipe === 'bagian') catatNama(f.x, f.nama.x);
      else if (f.tipe === 'kuantor') catatNama(f.kelompok, f.nama.kelompok);
      else if (f.tipe === 'urutan') Object.keys(f.nama).forEach(function (id) { catatNama(id, f.nama[id]); });
    });
    // (sebab tidak diperiksa di sini: pernyataannya boleh memakai bentuk kata kerja, mis. "memilah" untuk "pemilahan")
    var peran = { banding: ['a', 'b'], bagian: ['x'], urutan: ['x', 'y'], kuantor: ['kelompok'] }[kl.tipe] || [];
    peran.forEach(function (r) {
      var id = kl[r], nf = namaId[id], nk = kl.nama && kecilV(kl.nama[r]);
      if (nf && nk && nf !== nk) m.push('istilah "' + kl.nama[r] + '" pada pernyataan tidak sesuai dengan istilah bacaan untuk ' + id);
    });
    // batas waktu tahap lain: tahap itu harus bernama dan tidak boleh disinggung bacaan sama sekali
    if (kl.tipe === 'batas' && !mod.fakta.some(function (f) { return f.tipe === 'batas' && f.aksi === kl.aksi; }) &&
      !(kl.x === kl.aksi && kl.nama && kl.nama.x && kecilV(kl.teks).indexOf(kecilV(kl.nama.x)) >= 0)) m.push('pernyataan batas waktu untuk tahap yang tidak disebut bacaan harus menamai tahap itu');
    // generalisasi: tidak ada kalimat bacaan yang sudah memberlakukan hal itu secara umum
    if (kl.tipe === 'temuan' && kl.nama && kl.nama.hal) {
      String(bacaan).split(/\.\s+/).forEach(function (s) {
        if (kecilV(s).indexOf(kecilV(kl.nama.hal)) >= 0 && umumV(s)) m.push('bacaan memberlakukan "' + kl.nama.hal + '" secara umum: "' + s.slice(0, 60) + '..."');
      });
    }
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
    // (1) arah: putaran antarkotak tetap (boleh nol bila gambar hanya berpindah tempat)
    var dasar = deret.map(function (f) { return Fig.pusatkan(tanpaPenanda(f)); }), delta = null;
    for (var i = 0; i < 3; i++) {
      var d = Fig.sudutPutarKe(dasar[i], dasar[i + 1]);
      if (d === null) { m.push('kotak ' + (i + 1) + ' dan ' + (i + 2) + ' tidak terhubung oleh putaran'); return; }
      var dn = sudutBertanda(d);
      if (delta === null) delta = dn; else if (Math.abs(dn - delta) > 1e-3) { m.push('langkah putar antar kotak tidak konsisten (' + delta + ' lalu ' + dn + ')'); return; }
    }
    // (2) letak: titik berat gambar tetap, atau mengelilingi pusat kotak dengan langkah sudut tetap
    var pos = deret.map(titikBerat), posTetap = pos.every(function (p) { return letakSama(p, pos[0]); }), posKunci = pos[3];
    if (!posTetap) {
      var jari = pos.map(function (p) { return Math.hypot(p[0], p[1]); }), langkah = null;
      if (jari[0] < 1e-3 || jari.some(function (r) { return Math.abs(r - jari[0]) > 1e-3; })) { m.push('letak gambar antarkotak tidak membentuk pola (jaraknya ke pusat kotak berubah)'); return; }
      for (i = 0; i < 3; i++) {
        var ds = sudutBertanda((Math.atan2(pos[i + 1][1], pos[i + 1][0]) - Math.atan2(pos[i][1], pos[i][0])) * 180 / Math.PI);
        if (langkah === null) langkah = ds; else if (Math.abs(ds - langkah) > 1e-3) { m.push('perpindahan letak gambar antarkotak tidak tetap'); return; }
      }
      var rad = langkah * Math.PI / 180;
      posKunci = [pos[3][0] * Math.cos(rad) - pos[3][1] * Math.sin(rad), pos[3][0] * Math.sin(rad) + pos[3][1] * Math.cos(rad)];
    }
    // (3) titik penanda: jumlahnya deret aritmetika; isinya berselang-seling di dalam kotak (bila
    //     jumlahnya bertambah), atau tetap / berulang tiap dua kotak (bila jumlahnya tetap)
    var jml = deret.map(function (f) { return penandaFig(f).length; });
    var beda = jml[1] - jml[0];
    if (jml[2] - jml[1] !== beda || jml[3] - jml[2] !== beda) { m.push('jumlah titik penanda tidak membentuk deret aritmetika: ' + jml.join(',')); return; }
    var isiK = deret.map(function (f) { return penandaFig(f).map(function (u) { return u.isi ? 1 : 0; }).join(''); });
    var isiTetap = isiK.every(function (s) { return s === isiK[0]; });
    var prediksiJml = jml[3] + beda, prediksiIsi;
    if (beda !== 0) {
      var isi4 = isiK[3].split('').map(Number);
      var bergantian = isi4.length >= 2 && isi4.every(function (x, j) { return j === 0 || x !== isi4[j - 1]; });
      prediksiIsi = isi4.slice();
      for (var j = isi4.length; j < prediksiJml; j++) prediksiIsi.push(bergantian ? 1 - prediksiIsi[j - 1] : (prediksiIsi.length ? prediksiIsi[j - 1] : 1));
      prediksiIsi = prediksiIsi.join('');
    } else if (isiTetap) prediksiIsi = isiK[3];
    else if (isiK[0] === isiK[2] && isiK[1] === isiK[3]) prediksiIsi = isiK[2];
    else { m.push('isi titik penanda antarkotak tidak membentuk pola: ' + isiK.join(' / ')); return; }
    if (Math.abs(delta) < 1e-6 && posTetap && beda === 0 && isiTetap) { m.push('deret tidak berubah dari kotak ke kotak'); return; }
    var cocok = [];
    pilihan.forEach(function (f, idx) {
      var base = Fig.pusatkan(tanpaPenanda(f));
      var d2 = Fig.sudutPutarKe(dasar[3], base);
      if (d2 === null || Math.abs(sudutBertanda(d2 - delta)) > 1e-3) return;
      if (!letakSama(titikBerat(f), posKunci)) return;
      var pn = penandaFig(f);
      if (pn.length !== prediksiJml) return;
      if (pn.map(function (u) { return u.isi ? 1 : 0; }).join('') !== prediksiIsi) return;
      cocok.push(idx);
    });
    if (cocok.length !== 1) m.push('opsi yang memenuhi pola deret ada ' + cocok.length + ', seharusnya tepat satu');
    else if (cocok[0] !== b.kunci) m.push('opsi yang memenuhi pola adalah ' + HURUF[cocok[0]] + ', kunci tercetak ' + HURUF[b.kunci]);
    var gb = {};
    b.opsi.forEach(function (o, k) {
      try { var s = Gambar.svg(o.gambar).svg; if (gb[s] !== undefined) m.push('gambar opsi ' + HURUF[gb[s]] + ' dan ' + HURUF[k] + ' identik'); gb[s] = k; } catch (e) { m.push('gambar opsi ' + HURUF[k] + ' gagal'); }
    });
  }

  /** Sudut dalam rentang (-180, 180]. */
  function sudutBertanda(d) { d = ((d % 360) + 360) % 360; return d > 180 ? d - 360 : d; }

  /** Titik berat gambar tanpa titik penanda (cuplikan rapat sepanjang garis), terhadap pusat kotak. */
  function titikBerat(fig) {
    var s = Fig.sampel(tanpaPenanda(fig), 1.5), x = 0, y = 0;
    s.forEach(function (p) { x += p[0]; y += p[1]; });
    return s.length ? [x / s.length, y / s.length] : [0, 0];
  }

  function letakSama(p, q) { return Math.abs(p[0] - q[0]) < 1e-3 && Math.abs(p[1] - q[1]) < 1e-3; }

  // ------------------------------------------------- figural bentuk riset (5x5, 5x6, bersekat, kotak ganda)

  function sj(x) { return JSON.stringify(x); }

  /**
   * Bagian bersama keempat bentuk riset: gambar soal dan gambar opsi yang TAMPIL dibaca dari
   * deskriptornya (bukan dari salinan data penyusun), dicocokkan dengan data model, dan opsi
   * harus berbeda satu sama lain, juga setelah digambar.
   */
  function bacaTampilan(b, m, jenisSoal, jenisOpsi, ambilOpsi) {
    if (!periksaPilihan(b, m, 5)) return null;
    var gd = (b.stimulus.gambar || [])[0];
    if (!gd || gd.jenis !== jenisSoal || !gd.model) { m.push('gambar soal berjenis ' + jenisSoal + ' tidak ada'); return null; }
    var opsi = b.opsi.map(function (o) { return o.gambar && o.gambar.jenis === jenisOpsi && o.gambar.model ? ambilOpsi(o.gambar.model) : null; });
    if (opsi.some(function (x) { return x == null; })) { m.push('ada opsi tanpa gambar ' + jenisOpsi); return null; }
    if (sj(opsi) !== sj(b.model.pilihan)) m.push('opsi yang tergambar berbeda dari data model');
    if (b.model.kunciIndex !== b.kunci) m.push('indeks kunci pada model tidak sama dengan kunci butir');
    var lihat = {}, gb = {};
    opsi.forEach(function (x, i) { var s = sj(x); if (lihat[s] !== undefined) m.push('opsi ' + HURUF[lihat[s]] + ' dan ' + HURUF[i] + ' bergambar sama'); lihat[s] = i; });
    b.opsi.forEach(function (o, i) {
      try { var s = Gambar.svg(o.gambar).svg; if (gb[s] !== undefined) m.push('gambar opsi ' + HURUF[gb[s]] + ' dan ' + HURUF[i] + ' identik'); gb[s] = i; } catch (e) { m.push('gambar opsi ' + HURUF[i] + ' gagal digambar'); }
    });
    return { soal: gd.model, opsi: opsi };
  }

  function tepatSatu(b, m, cocok, nama) {
    if (cocok.length !== 1) m.push('opsi yang memenuhi ' + nama + ' ada ' + cocok.length + (cocok.length ? ' (' + cocok.map(function (i) { return HURUF[i]; }).join(', ') + ')' : '') + ', seharusnya tepat satu');
    else if (cocok[0] !== b.kunci) m.push('opsi yang memenuhi ' + nama + ' adalah ' + HURUF[cocok[0]] + ', kunci tercetak ' + HURUF[b.kunci]);
  }

  /** Kotak kosong (null) pada matriks harus persis daerah "?" yang digambar. */
  function lubangSesuai(g, diLubang, m) {
    for (var r = 0; r < g.length; r++) {
      for (var c = 0; c < g[r].length; c++) {
        if ((g[r][c] === null) !== diLubang(r, c)) { m.push('kotak kosong pada matriks tidak sama dengan daerah tanda tanya (baris ' + (r + 1) + ', kolom ' + (c + 1) + ')'); return false; }
      }
    }
    return true;
  }

  /** Matriks 5x5: setiap baris dan kolom memuat kelima bentuk; lubang harus terisi dengan satu cara. */
  function periksaLatin(b, m) {
    var t = bacaTampilan(b, m, 'latin', 'latin-opsi', function (x) { return x.isi; });
    if (!t) return;
    var g = t.soal.grid, l = t.soal.lubang;
    if (sj(g) !== sj(b.model.grid) || sj(l) !== sj(b.model.lubang)) m.push('matriks yang tergambar berbeda dari data model');
    if (!l || !Array.isArray(g) || g.length !== 5) { m.push('matriks 5x5 tidak lengkap'); return; }
    // daerah "?" = kotak pembatas l, dikurangi kotak yang tidak tercantum di l.sel (potongan berbentuk L)
    var diLubang = function (r, c) {
      if (!(r >= l.r && r < l.r + l.h && c >= l.c && c < l.c + l.w)) return false;
      return !l.sel || l.sel.some(function (x) { return x[0] === r - l.r && x[1] === c - l.c; });
    };
    if (!lubangSesuai(g, diLubang, m)) return;
    var r = Inf.latinLubang(g, 5);
    if (r.status !== 'unik') { m.push('matriks 5x5: ' + (r.status === 'ambigu' ? 'lubang dapat diisi dengan ' + r.semua.length + ' cara' : 'aturan tidak terbaca (' + (r.pesan || 'tak ada pengisian yang sah') + ')')); return; }
    if (r.lubang.length < 2) m.push('matriks 5x5: daerah tanda tanya harus memuat sedikitnya dua kotak');
    var cocok = [];
    t.opsi.forEach(function (p, i) {
      if (!Array.isArray(p) || p.length !== l.h || p.some(function (row) { return !Array.isArray(row) || row.length !== l.w; })) { m.push('opsi ' + HURUF[i] + ' tidak sebentuk dengan daerah tanda tanya'); return; }
      var isi = [], sebentuk = true;
      p.forEach(function (row, rr) { row.forEach(function (v, cc) { var ada = diLubang(l.r + rr, l.c + cc); if (ada !== (v !== null)) sebentuk = false; if (ada) isi.push(v); }); });
      if (!sebentuk) { m.push('opsi ' + HURUF[i] + ' tidak sebentuk dengan daerah tanda tanya'); return; }
      if (sj(isi) === sj(r.nilai)) cocok.push(i);
    });
    tepatSatu(b, m, cocok, 'aturan baris dan kolom');
  }

  /** Matriks 3x3 simbol dan sambungan: hubungan banyak simbol dan banyak sambungan dibaca dari kedelapan kotak yang tampak. */
  function periksaSambung(b, m) {
    var t = bacaTampilan(b, m, 'matriks', 'sel', function (x) { return x.cell || null; });
    if (!t) return;
    var g = t.soal.grid, mr = t.soal.mr, mc = t.soal.mc;
    if (sj(g) !== sj(b.model.grid) || mr !== b.model.mr || mc !== b.model.mc) m.push('matriks yang tergambar berbeda dari data model');
    if (!Array.isArray(g) || g.length !== 3 || !Array.isArray(g[mr]) || g[mr][mc] !== null) { m.push('kotak kosong pada matriks tidak sama dengan kotak tanda tanya'); return; }
    var r = Inf.sambung(g, t.opsi);
    if (r.status !== 'unik') { m.push('matriks simbol dan sambungan: ' + (r.pesan || 'aturan tidak terbaca') + (r.aturan && r.aturan.length ? ' (aturan yang berlaku: ' + r.aturan.join(', ') + ')' : '')); return; }
    tepatSatu(b, m, r.cocok, 'hubungan simbol dan sambungan');
  }

  /** Matriks 5x6: aturan bentuk dan warna yang berlaku harus menentukan satu deret pengganti. */
  function periksaIsi(b, m) {
    var t = bacaTampilan(b, m, 'isi', 'isi-opsi', function (x) { return x.isi; });
    if (!t) return;
    var g = t.soal.grid, l = t.soal.lubang;
    if (sj(g) !== sj(b.model.grid) || sj(l) !== sj(b.model.lubang)) m.push('matriks yang tergambar berbeda dari data model');
    if (!l || !Array.isArray(g)) { m.push('matriks 5x6 tidak lengkap'); return; }
    if (!lubangSesuai(g, function (r, c) { return r === l.r && c >= l.c && c < l.c + l.k; }, m)) return;
    var r = Inf.bentukWarna(g, 4);
    if (r.status !== 'unik') { m.push('matriks 5x6: ' + (r.status === 'ambigu' ? r.banyak + ' deret pengganti memenuhi aturan ' + r.aturan.join(', ') : 'aturan tidak terbaca' + (r.pesan ? ' (' + r.pesan + ')' : ''))); return; }
    var harus = sj(r.nilai.map(function (x) { return [x.b, x.i]; })), cocok = [];
    t.opsi.forEach(function (p, i) {
      if (!Array.isArray(p) || p.length !== l.k || p.some(function (x) { return !x; })) { m.push('opsi ' + HURUF[i] + ' tidak sepanjang daerah tanda tanya'); return; }
      if (sj(p.map(function (x) { return [x.b, x.i]; })) === harus) cocok.push(i);
    });
    tepatSatu(b, m, cocok, 'aturan bentuk dan warna');
  }

  /** Matriks 2x2 bersekat: asal tiap belahan gambar pojok dan bentuk pojok harus terbaca tunggal. */
  function periksaSekat(b, m) {
    var t = bacaTampilan(b, m, 'sekat', 'sekat-opsi', function (x) { return x.fig || null; });
    if (!t) return;
    var s = t.soal;
    if (sj(s.pojok) !== sj(b.model.pojok) || sj(s.dalam) !== sj(b.model.dalam) || s.tanya !== b.model.tanya) m.push('gambar bersekat yang tergambar berbeda dari data model');
    var r = Inf.sekat(s.pojok, s.dalam, s.tanya);
    if (r.status !== 'unik') { m.push('matriks bersekat: ' + (r.status === 'ambigu' ? 'aturan ' + r.aturan.join(', ') + ' memberi gambar pojok berbeda' : (r.pesan || 'aturan tidak terbaca'))); return; }
    var cocok = [];
    b.opsi.forEach(function (o, i) {
      if (o.gambar.model.q !== s.tanya) { m.push('opsi ' + HURUF[i] + ' digambar pada pojok yang bukan pojok tanda tanya'); return; }
      var p = Inf.peranBelahan(t.opsi[i], s.tanya);
      if (!p) { m.push('belahan opsi ' + HURUF[i] + ' tidak menghadap kedua tetangga pojok yang ditanyakan'); return; }
      if (t.opsi[i].bentuk === r.nilai.bentuk && p.h === r.nilai.h && p.v === r.nilai.v) cocok.push(i);
    });
    tepatSatu(b, m, cocok, 'aturan belahan dan bentuk pojok');
  }

  /** Deret kotak ganda: arti tiap belah ketupat dibaca dari kotak 1-4, lalu kode kotak kelima diterapkan. */
  function periksaGanda(b, m) {
    var t = bacaTampilan(b, m, 'ganda', 'ganda-opsi', function (x) { return x.atas || null; });
    if (!t) return;
    var kotak = t.soal.kotak;
    if (sj(kotak) !== sj(b.model.kotak)) m.push('deret yang tergambar berbeda dari data model');
    if (!Array.isArray(kotak) || kotak.length !== 5) { m.push('deret kotak ganda harus berisi lima kotak'); return; }
    if (kotak[4].atas !== null || kotak.slice(0, 4).some(function (k) { return !k.atas; })) { m.push('hanya bagian atas kotak kelima yang boleh diganti tanda tanya'); return; }
    var r = Inf.ganda(kotak.slice(0, 4).map(function (k) { return k.atas; }), kotak.map(function (k) { return k.bawah; }));
    if (r.status !== 'unik') {
      var rinci = Object.keys(r.rinci || {}).filter(function (k) { return r.rinci[k].status !== 'unik'; }).map(function (k) { return k + ' ' + r.rinci[k].status; });
      m.push('deret kotak ganda: ' + (rinci.length ? rinci.join(', ') : (r.pesan || 'aturan tidak terbaca')));
      return;
    }
    var bentuk = function (a) { return sj([a.warna, a.panah, a.penanda, a.bingkai]); }, harus = bentuk(r.nilai), cocok = [];
    t.opsi.forEach(function (a, i) { if (bentuk(a) === harus) cocok.push(i); });
    tepatSatu(b, m, cocok, 'kode belah ketupat');
  }

  /**
   * Gambar pembahasan figural (panduan revisi: visual tahapan pola beserta penandanya). Gambar ini
   * BUKAN bagian pembuktian kunci; yang diperiksa: sedikitnya satu gambar (semuanya sudah digambar
   * oleh periksaUmum), tiap gambar disebut di teks pembahasan ("Gambar n"), dan gambar yang
   * menampilkan jawaban (`model.jawaban`) sama persis dengan isi gambar opsi kunci, sedikitnya satu.
   */
  function periksaPembahasanFigural(b, m) {
    var g = b.gambarPembahasan || [];
    if (!g.length) { m.push('pembahasan figural belum memuat gambar tahapan pola'); return; }
    // opsi kunci bergambar: isi gambarnya; opsi kunci berupa teks (mis. nama transformasi): nilainya
    var teks = (b.pembahasan || []).join('\n'), ok = b.opsi && b.opsi[b.kunci], ko = ok && ok.gambar ? ok.gambar.model : null;
    var isiKunci = ko ? (ko.fig || ko.cell || ko.isi || ko.atas || null) : (ok ? ok.nilai : null), jawaban = 0;
    g.forEach(function (d, i) {
      if (d.id !== 'bahas-' + (i + 1)) m.push('gambar pembahasan ke-' + (i + 1) + ' seharusnya ber-id bahas-' + (i + 1));
      if (teks.indexOf('Gambar ' + (i + 1)) < 0) m.push('gambar pembahasan ke-' + (i + 1) + ' tidak disebut di teks pembahasan');
      if (d.model && d.model.jawaban !== undefined) {
        jawaban++;
        if (isiKunci == null || sj(d.model.jawaban) !== sj(isiKunci)) m.push('gambar pembahasan ' + d.id + ' menampilkan jawaban yang berbeda dari gambar opsi kunci');
      }
    });
    if (!jawaban) m.push('gambar pembahasan figural tidak memperlihatkan penerapan pola pada gambar jawaban');
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

  var POSISI_GARIS_MAKS = 120;

  /**
   * Semua yang dipakai rumus garis harus tertulis di soal. Rumus hanya boleh memuat parameter dan bilangan
   * kecil (banyak langkah, 1, 2, 100); parameter tanpa tampilan hanya tanda arah (±1) atau turunan yang besarnya
   * sama dengan parameter tertulis; setiap kejadian sekali-jadi (parameter eN) harus punya kalimat yang memuat
   * waktu dan besarnya.
   */
  function periksaGarisTertulis(b, m, env) {
    var mod = b.model, tampil = mod.tampil || {}, turunan = mod.turunan || {};
    (b.langkah || []).forEach(function (l) {
      // yang boleh: pengali banyak langkah (k*, k <= 5), pembagi persen (/100), dan faktor (1+ / (1-
      var r = String(l.rumus).replace(/[A-Za-z_][A-Za-z_0-9]*/g, 'x').replace(/\s+/g, '').replace(/\/100(?![\d.])/g, '');
      (r.match(/\d+(?:\.\d+)?\*/g) || []).forEach(function (x) { if (parseFloat(x) > 5) m.push('rumus ' + l.nama + ' memakai pengali ' + parseFloat(x) + ' yang tidak tertulis di soal'); });
      var sisa = r.replace(/\d+(?:\.\d+)?\*/g, '').replace(/\(1[+-]/g, '(');
      (sisa.match(/\d+(?:\.\d+)?/g) || []).forEach(function (x) { m.push('rumus ' + l.nama + ' memuat bilangan ' + x + ' yang tidak tertulis di soal sebagai parameter'); });
    });
    Object.keys(mod.param || {}).forEach(function (k) {
      if (tampil[k] != null) return;
      if (k === 'arah') { if (['1', '-1'].indexOf(String(mod.param.arah)) < 0) m.push('parameter arah harus 1 atau -1'); return; }
      var dasar = turunan[k];
      if (dasar && tampil[dasar] != null && env[k] && env[dasar] && H.sama(H.mutlak(env[k]), env[dasar])) return;
      m.push('parameter ' + k + ' dipakai tanpa tertulis di soal');
    });
    var kalimat = (b.stimulus.teks || []).join(' ').split(/\.\s+/);
    var dicatat = {};
    (mod.peristiwa || []).forEach(function (e) {
      dicatat[e.param] = true;
      var t = tampil[e.param];
      if (t == null || !kalimat.some(function (s) { return s.indexOf(e.waktu) >= 0 && s.indexOf(t) >= 0; })) m.push('kejadian ' + e.param + ' (' + e.waktu + ') tidak tertulis di soal beserta waktunya');
    });
    Object.keys(mod.param || {}).forEach(function (k) { if (/^e\d+$/.test(k) && !dicatat[k]) m.push('kejadian ' + k + ' tidak punya catatan waktu'); });
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
    periksaGarisTertulis(b, m, env);
    if ((mod.maks - mod.min) / mod.snap > POSISI_GARIS_MAKS) m.push('sumbu ' + mod.min + '-' + mod.maks + ' dengan langkah ' + mod.snap + ' terlalu rinci untuk digeser (' + (mod.maks - mod.min) / mod.snap + ' posisi)');
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
    // keterangan berupa satu kotak per irisan (judul = nama irisan, warna = warna irisan); setiap relasi
    // tertulis di kotak irisannya, dan kotak irisan tanpa relasi (dasar bentuk kosong) benar-benar kosong
    var teks = ulangiTeks(b).toLowerCase(), grup = (mod.grup || []).map(function (x) { return x.toLowerCase(); });
    var kartu = b.stimulus.kartu || [], irisanGbr = (((b.stimulus.gambar || [])[0] || {}).model || {}).irisan || [];
    if (kartu.length !== n) m.push('keterangan pie harus berupa ' + n + ' kotak kategori, ada ' + kartu.length);
    kartu.forEach(function (k, i) {
      if (String(k.judul).toLowerCase().indexOf(grup[i]) < 0) m.push('judul kotak ' + (i + 1) + ' bukan ' + grup[i]);
      if (!irisanGbr[i] || String(irisanGbr[i].warna || '').replace('#', '').toUpperCase() !== String(k.warna || '').toUpperCase()) m.push('warna kotak ' + (i + 1) + ' tidak sama dengan warna irisannya');
      if (!rel.some(function (r) { return r.g === i; }) && String(k.teks || '').trim()) m.push('kotak ' + (i + 1) + ' berisi keterangan padahal irisannya tidak punya relasi');
    });
    if (/tidak disebutkan/.test(teks + ' ' + kartu.map(function (k) { return k.teks; }).join(' ').toLowerCase())) m.push('informasi kosong ditulis sebagai kalimat, seharusnya kotak kosong');
    rel.forEach(function (r) {
      var k = kartu[r.g];
      if (!k || !String(k.teks || '').trim()) { m.push('relasi untuk ' + grup[r.g] + ' tidak tertulis di kotaknya'); return; }
      if (r.r != null && String(k.teks).toLowerCase().indexOf(grup[r.r]) < 0) { m.push('kotak ' + grup[r.g] + ' tidak menyebut ' + grup[r.r]); return; }
      var s = (k.judul + ' ' + k.teks).toLowerCase();
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

  // ---- pembahasan interaktif (panduan revisi paket-002): semua bentuk Penalaran Numerik memerlukan hitungan,
  // jadi pembahasannya berurutan Diketahui, Ditanyakan, Pengerjaan, Kesimpulan; setiap hitungan berupa baris
  // persamaan "§ " yang dapat diurai; Kesimpulan menyebut pengaturan akhir kontrol; semua nominal memakai USD.

  var JUDUL_PN = ['Diketahui', 'Ditanyakan', 'Pengerjaan', 'Kesimpulan'];
  var PENANDA_RUMUS = '§ ';

  /** Pengurai persamaan dari rumus.js (modul format bersama, bukan penyusun soal); null bila tidak termuat. */
  function modulRumus() {
    if (typeof Rumus !== 'undefined' && Rumus && Rumus.periksa) return Rumus;
    if (typeof require === 'function') { try { return require('./rumus.js'); } catch (e) { return null; } }
    return null;
  }

  function barisRumus(t) { return typeof t === 'string' && t.indexOf(PENANDA_RUMUS) === 0; }

  /** Nilai `v` tertulis sebagai bilangan utuh gaya Indonesia (mis. 1.200 pada "$1.200" atau "1.200 unit"). */
  function memuatNilai(teks, v) {
    var t = angkaId(Math.round(v)).replace(/\./g, '\\.');
    return Math.abs(v - Math.round(v)) < 1e-9 && new RegExp('(^|[^\\d.,])' + t + '(?!\\d|[.,]\\d)').test(teks);
  }

  function periksaPembahasanPn(b, m) {
    var p = (b.pembahasan || []).map(function (t) { return String(t); });
    var pos = JUDUL_PN.map(function (j) { return p.indexOf(j); });
    var jawab = p.length - 1;
    JUDUL_PN.forEach(function (j) {
      var n = p.filter(function (t) { return t.trim() === j; }).length;
      if (n !== 1) m.push('pembahasan interaktif harus memuat judul "' + j + '" tepat sekali (ada ' + n + ')');
    });
    if (pos.some(function (x) { return x < 0; })) return;
    if (pos.some(function (x, i) { return i && x <= pos[i - 1]; })) { m.push('judul pembahasan tidak berurutan Diketahui, Ditanyakan, Pengerjaan, Kesimpulan'); return; }
    JUDUL_PN.forEach(function (j, i) {
      var akhir = i < 3 ? pos[i + 1] : jawab;
      if (akhir - pos[i] < 2) m.push('bagian "' + j + '" pada pembahasan kosong');
    });
    var R = modulRumus();
    if (!R) m.push('pengurai persamaan (rumus.js) tidak termuat');
    p.forEach(function (t, i) {
      if (barisRumus(t)) {
        var galat = R ? R.periksa(t.slice(PENANDA_RUMUS.length)) : null;
        if (galat) m.push('persamaan baris ' + (i + 1) + ' pembahasan tidak dapat diurai: ' + galat);
      } else if (/[×÷]/.test(t)) m.push('hitungan ditulis di luar baris persamaan: "' + t.slice(0, 60) + '"');
    });
    var rumusKerja = p.slice(pos[2] + 1, pos[3]).filter(barisRumus);
    if (!rumusKerja.length) m.push('bagian Pengerjaan tidak memuat persamaan');
    else if (rumusKerja[0].indexOf('\\text{') < 0 || rumusKerja[0].indexOf('=') < 0) m.push('Pengerjaan tidak diawali rumus umum berupa persamaan');
    if (p.slice(pos[0] + 1, pos[2]).some(barisRumus)) m.push('persamaan ditulis sebelum bagian Pengerjaan');
    // Kesimpulan menyebut pengaturan akhir setiap kontrol (nilai kunci yang dihitung ulang di atas)
    var simpul = p.slice(pos[3] + 1, jawab).filter(function (t) { return !barisRumus(t); }).join(' ');
    var is = b.isian, hilang = [];
    if (is.jenis === 'bar-tumpuk') is.kunci.total.forEach(function (v, i) { [v, is.kunci.persen[i], 100 - is.kunci.persen[i]].forEach(function (x) { if (!memuatNilai(simpul, x)) hilang.push(x); }); });
    else if (is.jenis === 'garis') is.kunci.nilai.forEach(function (v) { if (!memuatNilai(simpul, v)) hilang.push(v); });
    else if (is.jenis === 'pie') is.kunci.persen.forEach(function (v) { if (!memuatNilai(simpul, v)) hilang.push(v + '%'); });
    else if (is.jenis === 'tabel') (is.tab || []).forEach(function (nama, i) {
      var pilihan = is.pilihan[is.kunci[i]];
      if (!new RegExp(HURUF[is.kunci[i]] + ' \\(' + String(pilihan).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\) pada tab ' + nama + '(?![\\w])').test(simpul)) hilang.push(nama + ': ' + pilihan);
    });
    if (hilang.length) m.push('Kesimpulan tidak menyebut pengaturan akhir: ' + hilang.slice(0, 4).join(', '));
  }

  function periksaMataUang(b, m) {
    var teks = JSON.stringify([b.stimulus, b.pertanyaan, b.perintah, b.pembahasan, b.kunciTeks, b.opsi, b.isian, b.gambarPembahasan]);
    var asing = /[€£]/.exec(teks);
    if (asing) m.push('nominal memakai ' + asing[0] + '; soal Penalaran Numerik wajib memakai USD ($)');
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
    else { m.push('jenis isian tidak dikenal: ' + j); return; }
    periksaMataUang(b, m);
    periksaPembahasanPn(b, m);
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
        var tipe = b.model.tipe;
        if (CEK[tipe]) CEK[tipe].periksa(b, m, ALAT);
        else if (tipe === 'serial-putar') periksaSerialPutar(b, m);
        else if (tipe === 'matriks-latin') periksaLatin(b, m);
        else if (tipe === 'matriks-isi') periksaIsi(b, m);
        else if (tipe === 'matriks-sekat') periksaSekat(b, m);
        else if (tipe === 'serial-ganda') periksaGanda(b, m);
        else if (tipe === 'matriks-sambung') periksaSambung(b, m);
        else periksaFiguralAtribut(b, m);
        periksaPembahasanFigural(b, m);
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
    var m = b.model, kunci = m.pilihan ? m.pilihan[m.kunciIndex] : null;
    if (CEK[m.tipe]) return CEK[m.tipe].sidik(b);
    if (m.tipe === 'serial') return m.sels.map(sidikSel);
    if (m.tipe === 'serial-putar') {
      // bentuk dasar (benihnya) dan seluruh pola perubahan (putar, pindah, jumlah, isi)
      return [m.keluarga + '#' + m.deret[0].benih + '#' + JSON.stringify(m.pola)];
    }
    if (m.tipe === 'matriks-sambung') {
      return [].concat.apply([], m.grid.map(function (row) { return row.map(function (x) { return sidikSel(x === null ? kunci : x); }); }));
    }
    // bentuk riset: gambar UTUH (lubang diisi kunci), jadi letak tanda tanya yang berbeda tidak membuat butir berbeda
    if (m.tipe === 'matriks-latin') {
      return [].concat.apply([], m.grid.map(function (row, r) {
        return row.map(function (v, c) { return String(v === null ? kunci[r - m.lubang.r][c - m.lubang.c] : v); });
      }));
    }
    if (m.tipe === 'matriks-isi') {
      return [].concat.apply([], m.grid.map(function (row, r) {
        return row.map(function (x, c) { var y = x === null ? kunci[c - m.lubang.c] : x; return y.b + '' + y.i; });
      }));
    }
    if (m.tipe === 'matriks-sekat') {
      // bentuk gambar dalam hanya hiasan; yang menentukan soal adalah corak belahannya
      var belah = function (f) { return Object.keys(f.belahan).sort().map(function (k) { return k + '=' + f.belahan[k]; }).join(','); };
      return m.dalam.map(belah).concat(m.pojok.map(function (f, q) { var g = f === null ? kunci : f; return g.bentuk + ':' + belah(g); }));
    }
    if (m.tipe === 'serial-ganda') {
      return m.kotak.map(function (k) { var a = k.atas || kunci; return a.warna.join('') + a.panah + a.penanda + a.bingkai; })
        .concat(m.kotak.map(function (k) { return k.bawah.join(''); }));
    }
    return [].concat.apply([], m.grid.map(function (row) { return row.map(sidikSel); }));
  }

  /** Banyak kotak/bagian berbeda yang masih dianggap "nyaris sama" per bentuk figural. */
  var BATAS_FIGURAL = { serial: 1, 'matriks-3': 1, 'matriks-sambung': 1, 'matriks-latin': 4, 'matriks-isi': 3, 'matriks-sekat': 1, 'serial-ganda': 1 };

  var AMBANG_KEMBAR = 0.85;

  /** Alat bersama untuk pemeriksa figural tambahan (CEK). */
  var ALAT = {
    HURUF: HURUF, sj: sj, Gambar: Gambar, Fig: Fig,
    periksaPilihan: periksaPilihan, bacaTampilan: bacaTampilan, tepatSatu: tepatSatu
  };

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
   *   figural   kotak yang tampak sama, paling banyak BATAS_FIGURAL kotak yang berbeda (bentuk
   *             riset dibandingkan dalam keadaan utuh, jadi letak "?" saja tidak membedakan)
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
      var batas = CEK[a.tipe] ? CEK[a.tipe].batas || 0 : BATAS_FIGURAL[a.tipe] || 0;
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
