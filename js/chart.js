/*
 * chart.js — penggambar tabel dan grafik (SVG) untuk stimulus butir.
 *
 *   tabel(model)               tabel data, kadang dengan baris status dan tab orang
 *   bar(model)                 batang vertikal, satu seri atau berkelompok
 *   barTumpuk(model, state)    batang bertumpuk dua bagian (Penalaran Numerik)
 *   garis(model, state)        grafik garis dengan titik yang bisa diletakkan
 *   pie(model, state)          diagram lingkaran
 *
 * Semuanya menerima MODEL (data murni, bisa dijadikan JSON) dan mengembalikan
 * { svg, lebar, tinggi }. Gambar tidak pernah menyimpan angka yang tidak ada di
 * model, dan angka kunci dituliskan sebagai atribut `data-*` pada elemennya
 * (`data-v` pada batang, `data-grid` pada garis bantu, `data-sel` pada sel
 * tabel). Validator membaca atribut itu dari SVG yang BENAR-BENAR digambar dan
 * membandingkannya dengan model — jadi kalau penggambar salah menaruh batang,
 * ketahuan.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./svg.js'), require('./metrik.js'), require('./format.js'));
    module.exports = api;
  } else {
    api = factory(root.Svg, root.Metrik, root.Fmt);
    root.Chart = api;
  }
})(typeof self !== 'undefined' ? self : this, function (S, M, Fmt) {
  'use strict';

  var TINTA = '#1b2130', REDUP = '#667089', GARIS = '#b8c2d6', GRID = '#dfe4ee';
  var SERI = ['#1e88c9', '#4c9a14', '#f57a22', '#f2443f', '#8a5cc2', '#17a2a2'];
  var NAMA_WARNA = ['biru', 'hijau', 'jingga', 'merah', 'ungu', 'tosca'];

  function label(v, model) {
    return (model.awalan || '') + Fmt.angka(v, { desimal: model.desimal == null ? 2 : model.desimal }) + (model.akhiran || '');
  }

  function tebalTeks(str, ukuran, tebal) { return M.lebar(str, ukuran, tebal); }

  // --------------------------------------------------------------------- tabel

  /**
   * @param {object} model {
   *   judul, kolom:[teks], baris:[{label, sel:[teks]}], catatan:[teks],
   *   statusBaris: 'Status target' (baris tambahan dengan sel kosong atau terisi),
   *   status: 'Mencapai target' | null (isi sel status),
   *   tab: { nama:[..], aktif:n }, ukuran: 13 }
   */
  function tabel(model) {
    var uk = model.ukuran || 13, padX = 12, tinggiBaris = 30;
    var kolom = model.kolom, baris = model.baris;
    var nk = kolom.length;
    var judulBaris = model.judul ? 34 : 0;

    function barisTeks(t) { return String(t == null ? '' : t).split('\n'); }
    function lebarSel(t, tebal) {
      return Math.max.apply(null, barisTeks(t).map(function (b) { return tebalTeks(b, uk, tebal); }));
    }

    // lebar kolom: terbesar dari isi (header tebal) + bantalan, dengan batas bawah
    var lebarKol = [];
    for (var c = 0; c < nk; c++) {
      var w = lebarSel(kolom[c], true);
      baris.forEach(function (b) {
        var t = c === 0 ? b.label : b.sel[c - 1];
        w = Math.max(w, lebarSel(t, c === 0));
      });
      if (model.statusBaris && c === 0) w = Math.max(w, lebarSel(model.statusBaris, true));
      lebarKol.push(Math.max(c === 0 ? 120 : 84, Math.ceil(w + padX * 2)));
    }
    var lebarTabel = lebarKol.reduce(function (a, b) { return a + b; }, 0);
    function lebarkan(perlu) {
      if (perlu <= lebarTabel) return;
      var tambah = Math.ceil(perlu - lebarTabel), sasaran = nk > 1 ? nk - 1 : 1, per = Math.ceil(tambah / sasaran);
      for (var q = nk - sasaran; q < nk; q++) lebarKol[q] += per;
      lebarTabel = lebarKol.reduce(function (a, b) { return a + b; }, 0);
    }
    if (model.judul) lebarkan(tebalTeks(model.judul, uk + 1, true) + padX * 2);
    if (model.tab) lebarkan(model.tab.nama.length * 110);

    var m = 8, y = m, bagian = [];
    var x0 = m;
    var tinggiHeader = Math.max.apply(null, kolom.map(function (k) { return barisTeks(k).length; })) * 17 + 13;
    var tinggiTotal = judulBaris + tinggiHeader;
    var tinggiBar = baris.map(function (b) {
      var n = Math.max(barisTeks(b.label).length, Math.max.apply(null, b.sel.map(function (t) { return barisTeks(t).length; })));
      return n > 1 ? n * 17 + 13 : tinggiBaris;
    });
    tinggiBar.forEach(function (h) { tinggiTotal += h; });
    if (model.statusBaris) tinggiTotal += tinggiBaris;

    // judul
    if (model.judul) {
      bagian.push(S.rect(x0, y, lebarTabel, judulBaris, { isi: '#2c4a7a', garis: GARIS, tebal: 1 }));
      bagian.push(S.teks(model.judul, x0 + lebarTabel / 2, y + judulBaris / 2 + (uk + 1) * 0.36,
        { ukuran: uk + 1, tebal: true, isi: '#ffffff', rata: 'middle' }));
      y += judulBaris;
    }

    function teksSel(t, cx, cy, tebal, isi, rata, sel) {
      var bs = barisTeks(t), out = '';
      var h0 = cy - (bs.length - 1) * 8.5;
      bs.forEach(function (b, i) {
        out += S.teks(b, cx, h0 + i * 17 + uk * 0.36, {
          ukuran: uk, tebal: tebal, isi: isi, rata: rata || 'middle', data: null
        }).replace('<text ', '<text data-sel="' + sel + '" ');
      });
      return out;
    }

    // header
    var x = x0;
    for (c = 0; c < nk; c++) {
      bagian.push(S.rect(x, y, lebarKol[c], tinggiHeader, { isi: '#1f3a5f', garis: GARIS, tebal: 1 }));
      if (kolom[c] !== '') {
        bagian.push(teksSel(kolom[c], x + lebarKol[c] / 2, y + tinggiHeader / 2, true, '#ffffff', 'middle', '-1,' + c));
      }
      x += lebarKol[c];
    }
    y += tinggiHeader;

    // isi
    baris.forEach(function (b, r) {
      var h = tinggiBar[r], xs = x0;
      for (var cc = 0; cc < nk; cc++) {
        var isi = cc === 0 ? '#e9eef7' : (r % 2 ? '#f6f8fc' : '#ffffff');
        bagian.push(S.rect(xs, y, lebarKol[cc], h, { isi: isi, garis: GARIS, tebal: 1 }));
        var t = cc === 0 ? b.label : b.sel[cc - 1];
        if (t !== '' && t != null) {
          if (cc === 0) bagian.push(teksSel(t, xs + padX, y + h / 2, true, TINTA, 'start', r + ',' + cc));
          else bagian.push(teksSel(t, xs + lebarKol[cc] / 2, y + h / 2, false, TINTA, 'middle', r + ',' + cc));
        }
        xs += lebarKol[cc];
      }
      y += h;
    });

    // baris status (jawaban per orang); sel kosong sampai dijawab
    if (model.statusBaris) {
      bagian.push(S.rect(x0, y, lebarKol[0], tinggiBaris, { isi: '#e9eef7', garis: GARIS, tebal: 1 }));
      bagian.push(S.teks(model.statusBaris, x0 + padX, y + tinggiBaris / 2 + uk * 0.36, { ukuran: uk, tebal: true, isi: TINTA }));
      bagian.push(S.rect(x0 + lebarKol[0], y, lebarTabel - lebarKol[0], tinggiBaris, { isi: '#ffffff', garis: GARIS, tebal: 1 }));
      if (model.status) {
        bagian.push(S.teks(model.status, x0 + lebarKol[0] + (lebarTabel - lebarKol[0]) / 2, y + tinggiBaris / 2 + uk * 0.36,
          { ukuran: uk, tebal: true, isi: '#12805c', rata: 'middle' }).replace('<text ', '<text data-status="1" '));
      }
      y += tinggiBaris;
    }

    // tab orang
    if (model.tab) {
      var n = model.tab.nama.length, wTab = lebarTabel / n;
      model.tab.nama.forEach(function (nama, i) {
        var aktif = i === model.tab.aktif;
        bagian.push(S.rect(x0 + i * wTab, y + 4, wTab, 34, {
          isi: aktif ? '#ffffff' : '#eef2f8', garis: GARIS, tebal: 1
        }));
        if (aktif) bagian.push(S.rect(x0 + i * wTab, y + 4, wTab, 4, { isi: '#2f6df6' }));
        bagian.push(S.teks(nama, x0 + i * wTab + wTab / 2, y + 26, {
          ukuran: uk, tebal: aktif, isi: aktif ? TINTA : REDUP, rata: 'middle'
        }).replace('<text ', '<text data-tab="' + i + '" '));
      });
      y += 4 + 34;
    }

    // catatan kaki
    var catatan = model.catatan || [];
    if (typeof catatan === 'string') catatan = [catatan];
    catatan.forEach(function (c2) {
      M.penggal(c2, lebarTabel, 11.5, false).forEach(function (b2) {
        y += 16;
        bagian.push(S.teks(b2, x0, y, { ukuran: 11.5, isi: REDUP, miring: true }));
      });
    });

    var tinggi = y + m + (catatan.length ? 4 : 0);
    var lebar = lebarTabel + m * 2;
    return { svg: S.doc(bagian.join(''), lebar, tinggi, { latar: '#ffffff' }), lebar: lebar, tinggi: tinggi };
  }

  // ------------------------------------------------------------------------ bar

  function sumbuY(bagian, o) {
    // garis bantu dan label sumbu Y; `o`: x0, x1, yDasar, pxPerSatuan, maks, langkah, model
    for (var v = 0; v <= o.maks + 1e-9; v += o.langkah) {
      var y = o.yDasar - v * o.px;
      bagian.push(S.garis(o.x0, y, o.x1, y, {
        garis: v === 0 ? '#8a93a6' : GRID, tebal: v === 0 ? 1.4 : 1, data: { grid: v }
      }));
      bagian.push(S.teks(label(v, o.model), o.x0 - 8, y + 4, { ukuran: 12, isi: REDUP, rata: 'end' }));
    }
  }

  /**
   * Batang vertikal. model: { judul, kategori:[..], seri:[{nama, nilai:[..]}],
   *   sumbuMaks, langkah, awalan, akhiran, desimal, judulY, judulX, labelNilai }
   */
  function bar(model) {
    var kat = model.kategori, seri = model.seri, nk = kat.length, ns = seri.length;
    var W = model.lebar || Math.max(560, 90 + nk * (ns > 1 ? 120 : 90)), H = model.tinggi || 380;
    var kiri = 86, kanan = 24, atas = model.judul ? 50 : 26, bawah = 56 + (model.judulX ? 24 : 0);
    if (ns > 1) atas += 22;
    var x0 = kiri, x1 = W - kanan, yDasar = H - bawah, yAtas = atas;
    var maks = model.sumbuMaks, px = (yDasar - yAtas) / maks;
    var bagian = [];
    if (model.judul) bagian.push(S.teks(model.judul, W / 2, 26, { ukuran: 15, tebal: true, rata: 'middle', isi: TINTA }));
    sumbuY(bagian, { x0: x0, x1: x1, yDasar: yDasar, px: px, maks: maks, langkah: model.langkah, model: model });
    if (model.judulY) {
      bagian.push(S.teks(model.judulY, 18, (yAtas + yDasar) / 2, { ukuran: 12, tebal: true, isi: REDUP, rata: 'middle', putar: -90 }));
    }
    var pita = (x1 - x0) / nk, grup = pita * (ns > 1 ? 0.78 : 0.56), lebarBar = grup / ns;
    for (var k = 0; k < nk; k++) {
      var gx = x0 + pita * k + (pita - grup) / 2;
      for (var s = 0; s < ns; s++) {
        var v = seri[s].nilai[k], h = v * px, bx = gx + s * lebarBar;
        var warna = seri[s].warna || SERI[s % SERI.length];
        bagian.push(S.rect(bx + (ns > 1 ? 1 : 0), yDasar - h, lebarBar - (ns > 1 ? 2 : 0), h, {
          isi: warna, data: { v: v, s: s, k: k }
        }));
        if (model.labelNilai !== false) {
          bagian.push(S.teks(label(v, model), bx + lebarBar / 2, yDasar - h - 6, { ukuran: 12, tebal: true, isi: TINTA, rata: 'middle' }));
        }
      }
      bagian.push(S.teks(kat[k], x0 + pita * k + pita / 2, yDasar + 20, { ukuran: 13, isi: TINTA, rata: 'middle' }));
    }
    if (model.judulX) {
      bagian.push(S.teks(model.judulX, (x0 + x1) / 2, yDasar + 48, { ukuran: 12, tebal: true, isi: REDUP, rata: 'middle' }));
    }
    if (ns > 1) {
      var lx = x1;
      for (var q = ns - 1; q >= 0; q--) {
        var nm = seri[q].nama, wn = tebalTeks(nm, 12, false);
        lx -= wn + 22;
        bagian.push(S.rect(lx, 44, 12, 12, { isi: seri[q].warna || SERI[q % SERI.length] }));
        bagian.push(S.teks(nm, lx + 17, 54, { ukuran: 12, isi: TINTA }));
        lx -= 14;
      }
    }
    return { svg: S.doc(bagian.join(''), W, H, { latar: '#ffffff' }), lebar: W, tinggi: H };
  }

  // ------------------------------------------------------------------ barTumpuk

  /**
   * Batang bertumpuk dua bagian. model: { judul, kategori, seri:[nama1, nama2],
   *   sumbuMaks, langkah, awalan, akhiran, desimal, judulY }
   * state: { total:[..], persen:[..] }  persen = bagian bawah (seri 0) dalam %,
   *   bagian atas (seri 1) = 100 - persen. `total` boleh null = belum diatur.
   */
  function barTumpuk(model, state) {
    var kat = model.kategori, nk = kat.length;
    var W = model.lebar || Math.max(540, 150 + nk * 170), H = model.tinggi || 420;
    var kiri = 84, kanan = 150, atas = model.judul ? 46 : 30, bawah = 56;
    var x0 = kiri, x1 = W - kanan, yDasar = H - bawah, yAtas = atas;
    var maks = model.sumbuMaks, px = (yDasar - yAtas) / maks;
    var bagian = [];
    if (model.judul) bagian.push(S.teks(model.judul, (x0 + x1) / 2, 24, { ukuran: 15, tebal: true, rata: 'middle', isi: TINTA }));
    sumbuY(bagian, { x0: x0, x1: x1, yDasar: yDasar, px: px, maks: maks, langkah: model.langkah, model: model });
    var pita = (x1 - x0) / nk, lebarBar = Math.min(110, pita * 0.56);
    for (var k = 0; k < nk; k++) {
      var cx = x0 + pita * k + pita / 2, bx = cx - lebarBar / 2, total = state.total[k];
      var p = state.persen[k];
      if (total != null) {
        var h = total * px, hBawah = h * p / 100;
        bagian.push(S.rect(bx, yDasar - hBawah, lebarBar, hBawah, { isi: SERI[0], data: { v: total * p / 100, s: 0, k: k } }));
        bagian.push(S.rect(bx, yDasar - h, lebarBar, h - hBawah, { isi: SERI[1], data: { v: total * (100 - p) / 100, s: 1, k: k } }));
        if (hBawah > 20) {
          bagian.push(S.teks(Fmt.angka(p, { desimal: 1 }) + '%', cx, yDasar - hBawah / 2 + 5, { ukuran: 14, tebal: true, isi: '#ffffff', rata: 'middle' }));
        }
        if (h - hBawah > 20) {
          bagian.push(S.teks(Fmt.angka(100 - p, { desimal: 1 }) + '%', cx, yDasar - hBawah - (h - hBawah) / 2 + 5, { ukuran: 14, tebal: true, isi: '#ffffff', rata: 'middle' }));
        }
        bagian.push(S.teks(label(total, model), cx, yDasar - h - 8, { ukuran: 13, tebal: true, isi: TINTA, rata: 'middle' }));
      }
      bagian.push(S.teks(kat[k], cx, yDasar + 22, { ukuran: 13, tebal: true, isi: REDUP, rata: 'middle' }));
    }
    // legenda
    var ly = yAtas + 4;
    model.seri.forEach(function (nama, i) {
      var tn = M.penggal(nama, 120, 12, false);
      bagian.push(S.rect(x1 + 22, ly, 12, 12, { isi: SERI[i] }));
      tn.forEach(function (b, j) { bagian.push(S.teks(b, x1 + 40, ly + 10 + j * 15, { ukuran: 12, isi: TINTA })); });
      ly += 18 + tn.length * 15;
    });
    if (model.judulY) {
      bagian.push(S.teks(model.judulY, 18, (yAtas + yDasar) / 2, { ukuran: 12, tebal: true, isi: REDUP, rata: 'middle', putar: -90 }));
    }
    return { svg: S.doc(bagian.join(''), W, H, { latar: '#ffffff' }), lebar: W, tinggi: H, geometri: { x0: x0, x1: x1, yDasar: yDasar, px: px, pita: pita, lebarBar: lebarBar } };
  }

  // ---------------------------------------------------------------------- garis

  /**
   * Grafik garis dengan titik per kategori. model: { judul, kategori, min, maks,
   *   langkah, awalan, akhiran, desimal, judulY, judulX }
   * state: { nilai:[..] } — null = titik belum diletakkan (berjajar di bawah sumbu).
   */
  function garis(model, state) {
    var kat = model.kategori, nk = kat.length;
    var W = model.lebar || Math.max(580, 120 + nk * 96), H = model.tinggi || 420;
    var kiri = 84, kanan = 30, atas = model.judul ? 46 : 26, bawah = 96;
    var x0 = kiri, x1 = W - kanan, yDasar = H - bawah, yAtas = atas;
    var lo = model.min, hi = model.maks, px = (yDasar - yAtas) / (hi - lo);
    var bagian = [];
    if (model.judul) bagian.push(S.teks(model.judul, (x0 + x1) / 2, 24, { ukuran: 15, tebal: true, rata: 'middle', isi: TINTA }));
    for (var v = lo; v <= hi + 1e-9; v += model.langkah) {
      var y = yDasar - (v - lo) * px;
      bagian.push(S.garis(x0, y, x1, y, { garis: v === lo ? '#8a93a6' : '#cfd6e4', tebal: v === lo ? 1.4 : 1, putus: v === lo ? null : '2 3', data: { grid: v } }));
      bagian.push(S.teks(label(v, model), x0 - 8, y + 4, { ukuran: 12, isi: TINTA, rata: 'end' }));
    }
    var pita = (x1 - x0) / nk;
    var titik = [];
    for (var k = 0; k < nk; k++) {
      var cx = x0 + pita * k + pita / 2;
      bagian.push(S.garis(cx, yAtas, cx, yDasar, { garis: '#cfd6e4', tebal: 1, putus: '2 3' }));
      bagian.push(S.teks(kat[k], cx, yDasar + 20, { ukuran: 13, isi: TINTA, rata: 'middle' }));
      var nilai = state.nilai[k];
      if (nilai != null) titik.push([cx, yDasar - (nilai - lo) * px, k, nilai]);
    }
    if (titik.length > 1) {
      bagian.push(S.poli(titik.map(function (t) { return [t[0], t[1]]; }), { garis: SERI[1], tebal: 2.6, sambung: 'round', ujung: 'round' }));
    }
    for (k = 0; k < nk; k++) {
      var cx2 = x0 + pita * k + pita / 2, n2 = state.nilai[k];
      if (n2 == null) {
        bagian.push(S.lingkaran(cx2, yDasar + 56, 11, { isi: SERI[1], data: { k: k } }));
      } else {
        var cy = yDasar - (n2 - lo) * px;
        bagian.push(S.lingkaran(cx2, cy, 8.5, { isi: SERI[1], garis: '#ffffff', tebal: 2, data: { v: n2, k: k } }));
        if (model.labelNilai) {
          bagian.push(S.teks(label(n2, model), cx2, cy - 14, { ukuran: 12, tebal: true, isi: TINTA, rata: 'middle' }));
        }
      }
    }
    if (model.judulY) {
      bagian.push(S.teks(model.judulY, 18, (yAtas + yDasar) / 2, { ukuran: 12, tebal: true, isi: REDUP, rata: 'middle', putar: -90 }));
    }
    if (model.judulX) {
      bagian.push(S.teks(model.judulX, (x0 + x1) / 2, yDasar + 40, { ukuran: 12, tebal: true, isi: REDUP, rata: 'middle' }));
    }
    return { svg: S.doc(bagian.join(''), W, H, { latar: '#ffffff' }), lebar: W, tinggi: H, geometri: { x0: x0, x1: x1, yDasar: yDasar, yAtas: yAtas, px: px, pita: pita, lo: lo, hi: hi } };
  }

  // ------------------------------------------------------------------------ pie

  /**
   * Diagram lingkaran. model: { judul, irisan:[{nama, warna?}] , satuan?, jumlah? }
   * state: { persen:[..] } jumlah persen = 100 (boleh kurang bila belum selesai).
   */
  function pie(model, state) {
    var irisan = model.irisan, n = irisan.length;
    var r = model.jari || 132, W = model.lebar || 500, H = model.tinggi || 330;
    var cx = 160, cy = H / 2 + (model.judul ? 12 : 0), bagian = [];
    if (model.judul) bagian.push(S.teks(model.judul, W / 2, 24, { ukuran: 15, tebal: true, rata: 'middle', isi: TINTA }));
    var sudut = 0;
    for (var i = 0; i < n; i++) {
      var p = state.persen[i], a1 = sudut + p * 3.6;
      var warna = irisan[i].warna || SERI[i % SERI.length];
      if (p > 0) {
        bagian.push(S.sektor(cx, cy, r, sudut, a1, { isi: warna, garis: '#ffffff', tebal: 2.5, data: { v: p, i: i } }));
        var tengah = (sudut + a1) / 2, pos = S.titikSudut(cx, cy, r * (p >= 12 ? 0.62 : 0.78), tengah);
        if (p >= 3) {
          bagian.push(S.teks(Fmt.angka(p, { desimal: 1 }) + '%', pos[0], pos[1] + 5, { ukuran: p >= 8 ? 15 : 12, tebal: true, isi: '#ffffff', rata: 'middle' }));
        }
      }
      sudut = a1;
    }
    // legenda
    var lx = cx + r + 38, ly = cy - (n * 26) / 2 + 6;
    irisan.forEach(function (it, i2) {
      bagian.push(S.rect(lx, ly + i2 * 26, 14, 14, { isi: it.warna || SERI[i2 % SERI.length] }));
      bagian.push(S.teks(it.nama, lx + 22, ly + i2 * 26 + 12, { ukuran: 13, isi: TINTA }));
    });
    return { svg: S.doc(bagian.join(''), W, H, { latar: '#ffffff' }), lebar: W, tinggi: H, geometri: { cx: cx, cy: cy, r: r } };
  }

  return {
    SERI: SERI, NAMA_WARNA: NAMA_WARNA, label: label,
    tabel: tabel, bar: bar, barTumpuk: barTumpuk, garis: garis, pie: pie
  };
});
