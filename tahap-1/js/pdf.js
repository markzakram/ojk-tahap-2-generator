/*
 * pdf.js — penulis PDF tanpa pustaka luar, dengan mesin tata letak sendiri.
 *
 * Menerima model blok dari `dokumen.js` (sama persis dengan yang dibaca `docx.js`)
 * dan menyusunnya pada halaman A4: paragraf dipenggal menurut lebar huruf Helvetica
 * (`Metrik`), daftar bergantung untuk butir bertanda "•", tabel bergaris, deret gambar
 * berhuruf untuk opsi figural, dan kelompok yang dijaga agar satu soal tidak
 * terbelah antar halaman bila masih muat. Judul tidak ditinggal sendirian di dasar
 * halaman.
 *
 * Gambar disisipkan sebagai XObject DeviceGray (hitam-putih, sepertiga data) atau
 * DeviceRGB, dimampatkan Flate; huruf memakai Helvetica bawaan pembaca PDF dengan
 * pengodean WinAnsi sehingga £, €, ×, ÷ tampil benar tanpa menyematkan font.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./metrik.js'), require('./kempis.js'), require('./rumus.js'));
    module.exports = api;
  } else {
    api = factory(root.Metrik, root.Kempis, root.Rumus);
    root.Pdf = api;
  }
})(typeof self !== 'undefined' ? self : this, function (Metrik, Kempis, Rumus) {
  'use strict';

  var LEBAR = 595.28, TINGGI = 841.89;
  var TEPI_KIRI = 56.7, TEPI_ATAS = 56.7, TEPI_BAWAH = 66;
  var ISI_W = LEBAR - 2 * TEPI_KIRI, ISI_H = TINGGI - TEPI_ATAS - TEPI_BAWAH;
  var FONT = { 1: 'Helvetica', 2: 'Helvetica-Bold', 3: 'Helvetica-Oblique', 4: 'Helvetica-BoldOblique', 5: 'Symbol' };

  function biner(str) {
    var u = new Uint8Array(str.length);
    for (var i = 0; i < str.length; i++) u[i] = str.charCodeAt(i) & 0xFF;
    return u;
  }

  function warnaPdf(hex, awal) {
    var h = hex || awal || '1B2130';
    var r = parseInt(h.slice(0, 2), 16) / 255, g = parseInt(h.slice(2, 4), 16) / 255, b = parseInt(h.slice(4, 6), 16) / 255;
    return r.toFixed(3) + ' ' + g.toFixed(3) + ' ' + b.toFixed(3);
  }

  function angka(n) { return (Math.round(n * 100) / 100).toString(); }

  // ----------------------------------------------------------- tata letak teks

  function fontKunci(tebal, miring) { return tebal ? (miring ? 4 : 2) : (miring ? 3 : 1); }

  /**
   * Penggal runs menjadi baris. Mengembalikan [{ x, seg:[{teks, f, warna, x}] }].
   * `awal` = x baris pertama, `lanjut` = x baris berikutnya, `maks` = x paling kanan.
   */
  function penggalRuns(runs, size, awal, lanjut, maks, warnaDasar) {
    var kata = [];
    runs.forEach(function (r) {
      String(r.teks == null ? '' : r.teks).split(/(\s+)/).forEach(function (t) {
        if (t === '') return;
        if (/^\s+$/.test(t)) { if (kata.length) kata[kata.length - 1].spasi = true; return; }
        kata.push({ teks: t, tebal: r.tebal, miring: r.miring, warna: r.warna || warnaDasar, spasi: false });
      });
    });
    var baris = [], kini = { x: awal, seg: [], lebar: 0 }, spasi = size * 0.278;
    function dorong() { baris.push(kini); kini = { x: lanjut, seg: [], lebar: 0 }; }
    kata.forEach(function (k, i) {
      var w = Metrik.lebar(k.teks, size, k.tebal);
      var perluSpasi = kini.seg.length && kini.seg[kini.seg.length - 1].spasi;
      var tambah = (perluSpasi ? spasi : 0) + w;
      if (kini.seg.length && kini.x + kini.lebar + tambah > maks) { dorong(); perluSpasi = false; tambah = w; }
      // kata yang lebih lebar dari satu baris dipotong paksa
      if (w > maks - kini.x) {
        var potong = Metrik.penggal(k.teks, maks - kini.x, size, k.tebal);
        potong.forEach(function (ps, j) {
          if (j > 0) dorong();
          kini.seg.push({ teks: ps, tebal: k.tebal, miring: k.miring, warna: k.warna, x: kini.x + kini.lebar, spasi: false });
          kini.lebar += Metrik.lebar(ps, size, k.tebal);
        });
        kini.seg[kini.seg.length - 1].spasi = k.spasi;
        return;
      }
      kini.seg.push({ teks: k.teks, tebal: k.tebal, miring: k.miring, warna: k.warna, x: kini.x + kini.lebar + (perluSpasi ? spasi : 0), spasi: k.spasi });
      kini.lebar += tambah;
    });
    if (kini.seg.length || !baris.length) baris.push(kini);
    return baris;
  }

  function tataParagraf(b, lebar) {
    var size = b.ukuran || 10.5, lead = size * 1.42, indent = b.indent || 0, gantung = b.gantung || 0;
    var baris = penggalRuns(b.runs, size, indent - gantung, indent, lebar, b.warna);
    var prim = [];
    baris.forEach(function (br, i) {
      // gabungkan kata berurutan yang bergaya sama menjadi satu segmen teks
      var gabung = [];
      br.seg.forEach(function (sg) {
        var akhir = gabung[gabung.length - 1];
        if (akhir && akhir.tebal === sg.tebal && akhir.miring === sg.miring && akhir.warna === sg.warna && akhir.sambung) {
          akhir.teks += ' ' + sg.teks; akhir.sambung = sg.spasi;
        } else gabung.push({ teks: sg.teks, tebal: sg.tebal, miring: sg.miring, warna: sg.warna, x: sg.x, sambung: sg.spasi });
      });
      gabung.forEach(function (sg) {
        prim.push({ k: 'teks', x: sg.x, y: i * lead + size * 0.95, s: size, f: fontKunci(sg.tebal, sg.miring), warna: sg.warna || '1B2130', teks: sg.teks });
      });
    });
    var sesudah = b.sesudah == null ? 5 : b.sesudah;
    return { tinggi: baris.length * lead + sesudah, prim: prim, isiTinggi: baris.length * lead };
  }

  // ------------------------------------------------------------------ rumus

  /*
   * Persamaan ditata dari pohon Rumus.urai sebagai kotak { w, a, d, gambar(x, garisDasar, prim) }:
   * variabel miring, angka dan teks tegak, pecahan bertingkat (85%) dengan garis pecahan setinggi
   * sumbu matematika, pangkat dan indeks 70% yang dinaikkan/diturunkan. Tanda relasi dan operasi
   * memakai font Symbol bawaan PDF (kode di bawah), jadi ≈, ≤, ≥, ×, →, − tercetak sebagai tanda aslinya.
   */
  var SIMBOL_PDF = { '≈': [0xBB, 549], '≤': [0xA3, 549], '≥': [0xB3, 549], '≠': [0xB9, 549], '×': [0xB4, 549], '÷': [0xB8, 549],
    '→': [0xAE, 987], '±': [0xB1, 549], '−': [0x2D, 549], '=': [0x3D, 549], '+': [0x2B, 549], '<': [0x3C, 549], '>': [0x3E, 549], '·': [0xD7, 250] };
  var TINTA_RUMUS = '1B2130';

  function kotakDeret(xs, s) {
    // minus di awal atau setelah tanda lain/kurung buka adalah tanda bilangan negatif: tanpa jarak
    var anak = xs.map(function (x, i) {
      var sebelum = i ? xs[i - 1] : null;
      var unari = x.t === 'atom' && x.v === '−' && (!sebelum || (sebelum.t === 'atom' && (SIMBOL_PDF[sebelum.v] || sebelum.v === '(')));
      return kotakItem(x, s, unari);
    });
    var w = 0, a = s * 0.72, d = s * 0.22;
    anak.forEach(function (k) { w += k.w; a = Math.max(a, k.a); d = Math.max(d, k.d); });
    return { w: w, a: a, d: d, gambar: function (x, yb, prim) { var cx = x; anak.forEach(function (k) { k.gambar(cx, yb, prim); cx += k.w; }); } };
  }

  function kotakItem(x, s, unari) {
    if (x.t === 'grup') return kotakDeret(x.isi, s);
    if (x.t === 'atom') {
      var sim = SIMBOL_PDF[x.v];
      if (sim) {
        // tanda relasi/operasi berjarak di kiri-kanan; minus bilangan negatif rapat ke angkanya
        var jarak = unari ? s * 0.03 : x.v === '·' ? s * 0.12 : s * 0.24, lebarSim = sim[1] * s / 1000;
        return { w: lebarSim + 2 * jarak, a: s * 0.6, d: s * 0.1, gambar: function (cx, yb, prim) {
          prim.push({ k: 'teks', x: cx + jarak, y: yb, s: s, f: 5, warna: TINTA_RUMUS, teks: String.fromCharCode(sim[0]), mentah: true });
        } };
      }
      // spasi LaTeX (\quad, \, dan "\ ") hanya memberi jarak; hurufnya tidak ada di WinAnsi
      var spasi = { ' ': 1, ' ': 0.17, ' ': 0.28 }[x.v];
      if (spasi) return { w: s * spasi, a: 0, d: 0, gambar: function () {} };
      var miring = x.gaya === 'var', w = Metrik.lebar(x.v, s, false);
      return { w: w + (miring ? s * 0.05 : 0), a: s * 0.72, d: s * 0.22, gambar: function (cx, yb, prim) {
        prim.push({ k: 'teks', x: cx, y: yb, s: s, f: fontKunci(false, miring), warna: TINTA_RUMUS, teks: x.v });
      } };
    }
    if (x.t === 'frac') {
      var s2 = s * 0.9, atas = kotakDeret(x.a, s2), bawah = kotakDeret(x.b, s2), sumbu = s * 0.3, celah = s * 0.18, tepi = s * 0.15;
      var lebarF = Math.max(atas.w, bawah.w) + 2 * tepi;
      return { w: lebarF + s * 0.1, a: sumbu + celah + atas.d + atas.a, d: Math.max(0, celah + bawah.a + bawah.d - sumbu), gambar: function (cx, yb, prim) {
        var garis = yb - sumbu;
        atas.gambar(cx + (lebarF - atas.w) / 2, garis - celah - atas.d, prim);
        bawah.gambar(cx + (lebarF - bawah.w) / 2, garis + celah + bawah.a, prim);
        prim.push({ k: 'rect', x: cx + tepi * 0.4, y: garis - 0.3, w: lebarF - tepi * 0.8, h: 0.6, isi: TINTA_RUMUS, garis: TINTA_RUMUS });
      } };
    }
    // pangkat dan indeks bawah
    var dasar = kotakDeret(x.e, s), kecil = kotakDeret(x.x, s * 0.7), naik = x.t === 'sup' ? s * 0.42 : -s * 0.2;
    return { w: dasar.w + kecil.w + s * 0.04, a: Math.max(dasar.a, naik + kecil.a), d: Math.max(dasar.d, kecil.d - naik), gambar: function (cx, yb, prim) {
      dasar.gambar(cx, yb, prim);
      kecil.gambar(cx + dasar.w + s * 0.02, yb - naik, prim);
    } };
  }

  /** Blok persamaan: ditata dari notasinya; bila gagal diurai atau terlalu lebar, dicetak sebagai teks biasa. */
  function tataRumus(b) {
    var s = b.ukuran || 10, indent = 18, kotak = null;
    try { kotak = kotakDeret(Rumus.urai(b.notasi), s); } catch (e) { kotak = null; }
    if (!kotak || kotak.w > ISI_W - indent) return tataParagraf({ runs: [{ teks: b.teks || b.notasi }], ukuran: s, indent: indent, sesudah: 3 }, ISI_W);
    var prim = [], dasar = kotak.a + 2;
    kotak.gambar(indent, dasar, prim);
    return { tinggi: kotak.a + kotak.d + 7, prim: prim };
  }

  function tataJudul(b, tingkat) {
    var ukuran = tingkat === 1 ? 17 : (tingkat === 2 ? 13 : 11.5), warna = tingkat === 1 ? '1B2130' : (tingkat === 2 ? '1F3A5F' : '2C4A7A');
    var sebelum = tingkat === 1 ? 0 : (tingkat === 2 ? 8 : 6), sesudah = tingkat === 1 ? 6 : (tingkat === 2 ? 5 : 4);
    var p = tataParagraf({ runs: [{ teks: b.teks, tebal: true }], ukuran: ukuran, warna: warna, sesudah: sesudah }, ISI_W);
    p.prim.forEach(function (x) { x.y += sebelum; });
    p.tinggi += sebelum;
    p.kepalaJudul = true;
    return p;
  }

  function tataGambar(b) {
    var img = b.img, l = Math.min(b.lebarPt, ISI_W), t = l * img.tinggi / img.lebar;
    var maks = ISI_H * 0.7;
    if (t > maks) { t = maks; l = t * img.lebar / img.tinggi; }
    var x = b.rata === 'tengah' ? (ISI_W - l) / 2 : 0;
    return { tinggi: t + (b.sesudah == null ? 5 : b.sesudah), prim: [{ k: 'img', x: x, y: 0, w: l, h: t, img: img }] };
  }

  function tataGaleri(b) {
    var kolom = b.kolom || b.item.length, lebarSel = ISI_W / kolom, prim = [], y = 0;
    for (var i = 0; i < b.item.length; i += kolom) {
      var baris = b.item.slice(i, i + kolom), tinggiBaris = 0;
      baris.forEach(function (it, c) {
        if (!it || !it.img) return;
        var l = Math.min(b.lebarPt || 100, lebarSel - 8), t = l * it.img.tinggi / it.img.lebar;
        if (t > 230) { t = 230; l = t * it.img.lebar / it.img.tinggi; }
        var x = c * lebarSel + (lebarSel - l) / 2;
        prim.push({ k: 'img', x: x, y: y, w: l, h: t, img: it.img });
        if (it.label) {
          var lw = Metrik.lebar(it.label, 10, true);
          prim.push({ k: 'teks', x: c * lebarSel + (lebarSel - lw) / 2, y: y + t + 12, s: 10, f: 2, warna: '1B2130', teks: it.label });
        }
        tinggiBaris = Math.max(tinggiBaris, t + (it.label ? 18 : 4));
      });
      y += tinggiBaris + 4;
    }
    return { tinggi: y + 4, prim: prim };
  }

  /** Tabel menjadi daftar baris (agar bisa mengalir antar halaman). */
  function tataTabel(b) {
    var jml = b.lebarKol.reduce(function (s, x) { return s + x; }, 0), lebar = b.lebarKol.map(function (x) { return ISI_W * x / jml; });
    var baris = [], size = 9.5, lead = size * 1.38;
    b.baris.forEach(function (row, r) {
      var maksBaris = 1, sel = [];
      row.forEach(function (c, i) {
        // sel kotak keterangan: baris judul tebal di atas isinya
        var judul = c.judul != null ? Metrik.penggal(c.judul, lebar[i] - 10, size, true).map(function (t) { return { t: t, tebal: true }; }) : [];
        var lines = judul.concat(Metrik.penggal(c.teks == null ? '' : c.teks, lebar[i] - 10, size, c.tebal).map(function (t) { return { t: t, tebal: c.tebal }; }));
        maksBaris = Math.max(maksBaris, lines.length, c.minBaris || 1);
        if(c.img)maksBaris=Math.max(maksBaris,Math.ceil((Math.min(c.lebarPt||48,lebar[i]-10)*c.img.tinggi/c.img.lebar)/lead));
        sel.push({ lines: lines, c: c });
      });
      var tinggi = maksBaris * lead + 7, prim = [], x = 0;
      row.forEach(function (c, i) {
        prim.push({ k: 'rect', x: x, y: 0, w: lebar[i], h: tinggi, isi: c.isi || null, garis: b.garis || 'B8C2D6' });
        if(c.img){
          var il=Math.min(c.lebarPt||48,lebar[i]-10),it=il*c.img.tinggi/c.img.lebar;
          prim.push({k:'img',x:x+(lebar[i]-il)/2,y:(tinggi-it)/2,w:il,h:it,img:c.img});
        }
        sel[i].lines.forEach(function (ln, j) {
          var lw = Metrik.lebar(ln.t, size, ln.tebal), tx = c.rata === 'tengah' ? x + (lebar[i] - lw) / 2 : (c.rata === 'kanan' ? x + lebar[i] - lw - 5 : x + 5);
          prim.push({ k: 'teks', x: tx, y: 3.5 + j * lead + size * 0.95, s: size, f: fontKunci(ln.tebal, false), warna: c.warnaTeks || '1B2130', teks: ln.t });
        });
        x += lebar[i];
      });
      baris.push({ tinggi: tinggi, prim: prim });
    });
    return baris;
  }

  /** Susun satu blok menjadi daftar potongan { tinggi, prim } yang boleh dipisah antar halaman. */
  function tata(b) {
    switch (b.t) {
      case 'h1': return [tataJudul(b, 1)];
      case 'h2': return [tataJudul(b, 2)];
      case 'h3': return [tataJudul(b, 3)];
      case 'p': return [tataParagraf(b, ISI_W)];
      case 'rumus': return [tataRumus(b)];
      case 'jarak': return [{ tinggi: b.tinggi, prim: [] }];
      case 'gambar': return [tataGambar(b)];
      case 'galeri': return [tataGaleri(b)];
      case 'tabel': return tataTabel(b).concat([{ tinggi: 6, prim: [] }]);
      default: return [];
    }
  }

  // ------------------------------------------------------------------- aliran

  function bangunHalaman(model) {
    var halaman = [{ prim: [], y: 0 }], hal = halaman[0];
    function baru() { hal = { prim: [], y: 0 }; halaman.push(hal); }
    function tempatkan(p) {
      p.prim.forEach(function (x) {
        var c = {}; for (var k in x) c[k] = x[k];
        c.y = (x.y || 0) + hal.y;
        hal.prim.push(c);
      });
      hal.y += p.tinggi;
    }
    function potongan(b) {
      if (b.t === 'grup') {
        var semua = [];
        b.anak.forEach(function (x) { tata(x).forEach(function (p) { semua.push(p); }); });
        return semua;
      }
      return tata(b);
    }

    var antri = [];
    model.blok.forEach(function (b) {
      if (b.t === 'jeda') { antri.push({ jeda: true }); return; }
      if (b.t === 'grup') {
        var bagian = potongan(b), total = bagian.reduce(function (s, p) { return s + p.tinggi; }, 0);
        antri.push({ grup: bagian, total: total });
        return;
      }
      tata(b).forEach(function (p) { antri.push({ satu: p }); });
    });

    for (var i = 0; i < antri.length; i++) {
      var a = antri[i];
      if (a.jeda) { if (hal.prim.length || hal.y > 0) baru(); continue; }
      if (a.grup) {
        if (hal.y + a.total > ISI_H && a.total <= ISI_H && hal.y > 0) baru();
        a.grup.forEach(function (p) {
          if (hal.y + p.tinggi > ISI_H && hal.y > 0) baru();
          tempatkan(p);
        });
        continue;
      }
      var p = a.satu;
      if (p.kepalaJudul) {
        // judul dijaga bersama potongan berikutnya
        var lanjut = antri[i + 1], tinggiLanjut = 0;
        if (lanjut && lanjut.satu) tinggiLanjut = lanjut.satu.tinggi;
        else if (lanjut && lanjut.grup) tinggiLanjut = Math.min(lanjut.total, lanjut.grup[0] ? lanjut.grup[0].tinggi + (lanjut.grup[1] ? lanjut.grup[1].tinggi : 0) : 0);
        if (hal.y + p.tinggi + tinggiLanjut > ISI_H && hal.y > 0) baru();
      } else if (hal.y + p.tinggi > ISI_H && hal.y > 0) baru();
      tempatkan(p);
    }
    return halaman.filter(function (h) { return h.prim.length > 0; });
  }

  // ------------------------------------------------------------------ penulis PDF

  function isiHalaman(hal, no, jumlah, kaki, noGambar) {
    var ops = [], pakai = [];
    hal.prim.forEach(function (p) {
      var y = TINGGI - TEPI_ATAS - p.y;
      if (p.k === 'teks') {
        // teks `mentah` sudah berupa kode huruf (font Symbol); selainnya diubah ke WinAnsi
        var isiTeks = p.mentah ? p.teks.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)') : Metrik.teksPdf(p.teks);
        ops.push('BT ' + warnaPdf(p.warna) + ' rg /F' + p.f + ' ' + angka(p.s) + ' Tf 1 0 0 1 ' + angka(TEPI_KIRI + p.x) + ' ' + angka(y) + ' Tm (' + isiTeks + ') Tj ET');
      } else if (p.k === 'rect') {
        if (p.isi) ops.push(warnaPdf(p.isi) + ' rg ' + angka(TEPI_KIRI + p.x) + ' ' + angka(y - p.h) + ' ' + angka(p.w) + ' ' + angka(p.h) + ' re f');
        ops.push(warnaPdf(p.garis, 'B8C2D6') + ' RG 0.6 w ' + angka(TEPI_KIRI + p.x) + ' ' + angka(y - p.h) + ' ' + angka(p.w) + ' ' + angka(p.h) + ' re S');
      } else if (p.k === 'img') {
        var nama = noGambar(p.img);
        if (pakai.indexOf(nama) < 0) pakai.push(nama);
        ops.push('q ' + angka(p.w) + ' 0 0 ' + angka(p.h) + ' ' + angka(TEPI_KIRI + p.x) + ' ' + angka(y - p.h) + ' cm /' + nama + ' Do Q');
      }
    });
    var teksKaki = kaki + ' · Halaman ' + no + ' dari ' + jumlah;
    var lw = Metrik.lebar(teksKaki, 8, false);
    ops.push('BT 0.400 0.440 0.537 rg /F1 8 Tf 1 0 0 1 ' + angka((LEBAR - lw) / 2) + ' 32 Tm (' + Metrik.teksPdf(teksKaki) + ') Tj ET');
    return { isi: ops.join('\n'), pakai: pakai };
  }

  /**
   * @param {{judul:string, blok:Array, kaki:string}} model
   * @returns {Promise<Uint8Array>}
   */
  function buat(model) {
    var halaman = bangunHalaman(model);
    var objek = [];                              // { isi: string } atau { kamus, aliran }
    function tambah(o) { objek.push(o); return objek.length; }

    var noKatalog = tambah(null), noPages = tambah(null);
    var noFont = {};
    [1, 2, 3, 4].forEach(function (k) {
      noFont[k] = tambah({ isi: '<< /Type /Font /Subtype /Type1 /BaseFont /' + FONT[k] + ' /Encoding /WinAnsiEncoding >>' });
    });
    // Symbol (salah satu 14 font standar PDF) memakai pengodean bawaannya untuk tanda matematika
    noFont[5] = tambah({ isi: '<< /Type /Font /Subtype /Type1 /BaseFont /Symbol >>' });

    // gambar unik -> XObject
    var petaGambar = new Map(), daftarGambar = [];
    function noGambar(img) {
      var g = petaGambar.get(img);
      if (!g) { g = { nama: 'Im' + (daftarGambar.length + 1), img: img, no: null }; petaGambar.set(img, g); daftarGambar.push(g); }
      return g.nama;
    }

    var kaki = model.kaki || '';
    var isiHal = halaman.map(function (h, i) { return isiHalaman(h, i + 1, halaman.length, kaki, noGambar); });

    var rantai = Promise.resolve();
    daftarGambar.forEach(function (g) {
      rantai = rantai.then(function () { return Kempis.deflate(g.img.raw, 6); }).then(function (padat) {
        var data = padat || g.img.raw;
        g.no = tambah({
          kamus: '<< /Type /XObject /Subtype /Image /Width ' + g.img.lebar + ' /Height ' + g.img.tinggi + ' /ColorSpace ' + (g.img.kanal === 1 ? '/DeviceGray' : '/DeviceRGB') +
            ' /BitsPerComponent 8 ' + (padat ? '/Filter /FlateDecode ' : '') + '/Length ' + data.length + ' >>',
          aliran: data
        });
      });
    });
    var noHalaman = [];
    isiHal.forEach(function (h, i) {
      rantai = rantai.then(function () { return Kempis.deflate(biner(h.isi), 6); }).then(function (padat) {
        var data = padat || biner(h.isi);
        var noIsi = tambah({ kamus: '<< /Length ' + data.length + (padat ? ' /Filter /FlateDecode' : '') + ' >>', aliran: data });
        var xobj = h.pakai.length ? '/XObject << ' + h.pakai.map(function (n) {
          var g = daftarGambar.filter(function (x) { return x.nama === n; })[0];
          return '/' + n + ' ' + g.no + ' 0 R';
        }).join(' ') + ' >>' : '';
        noHalaman.push(tambah({ isi: '<< /Type /Page /Parent ' + noPages + ' 0 R /MediaBox [0 0 ' + LEBAR + ' ' + TINGGI + '] /Resources << /Font << ' +
          [1, 2, 3, 4, 5].map(function (k) { return '/F' + k + ' ' + noFont[k] + ' 0 R'; }).join(' ') + ' >> ' + xobj + ' >> /Contents ' + noIsi + ' 0 R >>' }));
      });
    });

    return rantai.then(function () {
      objek[noKatalog - 1] = { isi: '<< /Type /Catalog /Pages ' + noPages + ' 0 R >>' };
      objek[noPages - 1] = { isi: '<< /Type /Pages /Kids [' + noHalaman.map(function (n) { return n + ' 0 R'; }).join(' ') + '] /Count ' + noHalaman.length + ' >>' };

      var bagian = [], panjang = 0, offset = [];
      function dorong(u8) { bagian.push(u8); panjang += u8.length; }
      dorong(biner('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'));
      objek.forEach(function (o, i) {
        offset[i] = panjang;
        dorong(biner((i + 1) + ' 0 obj\n'));
        if (o.aliran) { dorong(biner(o.kamus + '\nstream\n')); dorong(o.aliran); dorong(biner('\nendstream\n')); }
        else dorong(biner(o.isi + '\n'));
        dorong(biner('endobj\n'));
      });
      var awalXref = panjang, xref = 'xref\n0 ' + (objek.length + 1) + '\n0000000000 65535 f \n';
      offset.forEach(function (o) { xref += String(o).padStart(10, '0') + ' 00000 n \n'; });
      dorong(biner(xref));
      dorong(biner('trailer\n<< /Size ' + (objek.length + 1) + ' /Root ' + noKatalog + ' 0 R >>\nstartxref\n' + awalXref + '\n%%EOF\n'));
      var out = new Uint8Array(panjang), pos = 0;
      bagian.forEach(function (b) { out.set(b, pos); pos += b.length; });
      return out;
    });
  }

  return { buat: buat, LEBAR: LEBAR, TINGGI: TINGGI, bangunHalaman: bangunHalaman };
});
