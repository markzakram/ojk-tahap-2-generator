/*
 * dokumen.js — model naskah sebuah paket, dipakai bersama oleh Word dan PDF.
 *
 * Satu model, dua penulis: `docx.js` dan `pdf.js` sama-sama membaca daftar BLOK ini,
 * jadi isi, urutan, dan istilah di kedua berkas selalu sama. Susunan naskah:
 *
 *   1. Naskah soal      tiap subtes, soal bernomor (tanpa kunci)
 *   2. Kunci jawaban    tabel ringkas per subtes
 *   3. Pembahasan       langkah demi langkah, ditambah gambar kondisi kunci
 *                       untuk butir interaktif
 *
 * Jenis blok:
 *   { t:'h1'|'h2'|'h3', teks }
 *   { t:'p', runs:[{teks, tebal, miring, warna}], ukuran, rata, indent, gantung, sesudah, warna }
 *   { t:'gambar', img, lebarPt, rata }
 *   { t:'galeri', item:[{img, label, lebarPt}] }
 *   { t:'tabel', lebarKol:[bagian], baris:[[{teks, tebal, rata, isi}]], header:true }
 *   { t:'jeda' }
 *   { t:'grup', anak:[blok] }      jaga agar tidak terpisah halaman bila muat
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./gambar.js'), require('./format.js'));
    module.exports = api;
  } else {
    api = factory(root.Gambar, root.Fmt);
    root.Dokumen = api;
  }
})(typeof self !== 'undefined' ? self : this, function (Gambar, Fmt) {
  'use strict';

  var HURUF = ['A', 'B', 'C', 'D', 'E'];

  // --------------------------------------------------------------- teks butir

  function adalahPoin(t) { return /^• /.test(t); }

  /** Bentuk isian butir interaktif, dalam kalimat (untuk naskah dan Excel). */
  function bentukIsian(b) {
    var is = b.isian;
    if (!is) return '';
    if (is.jenis === 'bar-tumpuk') {
      var kt = is.kontrol[0], kp = is.kontrol[1], mm = is.model || {};
      var nilaiBar = function (v) { return (mm.awalan || '') + Fmt.angka(v) + (mm.akhiran || ''); };
      return 'Isian: untuk setiap batang (' + is.kategori.join(', ') + ') atur total (kelipatan ' + nilaiBar(kt.langkah) + ', maksimum ' + nilaiBar(kt.maks) + ') dan persentase ' + is.seri[0] + ' (kelipatan ' + kp.langkah + '%; sisanya ' + is.seri[1] + ').';
    }
    if (is.jenis === 'tabel') {
      return 'Isian: untuk setiap tab (' + is.tab.join(', ') + ') pilih satu dari ' + is.pilihan.map(function (p, i) { return HURUF[i] + '. ' + p; }).join('; ') + '.';
    }
    if (is.jenis === 'garis') {
      var k = is.kontrol[0];
      return 'Isian: geser kelima titik (' + is.kategori.join(', ') + ') ke nilainya pada sumbu vertikal (' + Fmt.angka(k.min) + ' sampai ' + Fmt.angka(k.maks) + ', kelipatan ' + Fmt.angka(k.langkah) + ').';
    }
    if (is.jenis === 'pie') {
      return 'Isian: atur persentase keempat irisan (' + is.irisan.join(', ') + ') dalam kelipatan 1% sampai berjumlah 100%.';
    }
    return '';
  }

  /** Seluruh teks soal sebagai satu string (untuk kolom "soal" pada Excel). */
  function teksSoal(b) {
    var baris = [];
    if (b.submateri === 'verbal') {
      (b.stimulus.teks || []).forEach(function (t) { baris.push(t); });
      baris.push('Pernyataan: ' + b.pertanyaan);
      return baris.join('\n');
    }
    if (b.jenis === 'isian' && b.stimulus.judul) baris.push(b.stimulus.judul);
    (b.stimulus.teks || []).forEach(function (t) { baris.push(t); });
    if (b.submateri === 'figural' && b.perintah) baris.push(b.perintah);
    if (b.pertanyaan) baris.push(b.pertanyaan);
    if (b.jenis === 'isian') baris.push(bentukIsian(b));
    return baris.join('\n');
  }

  /** Teks opsi untuk Excel/JSON (butir bergambar menuliskan nama berkas gambarnya). */
  function teksOpsi(b, i, namaGambar) {
    var o = b.opsi[i];
    if (!o) return '';
    if (o.gambar && namaGambar) return namaGambar(o.gambar);
    return o.teks;
  }

  /** Jawaban benar sebagai teks: huruf untuk pilihan ganda, kalimat kunci untuk butir interaktif. */
  function jawabanBenar(b) {
    return b.jenis === 'pg' ? HURUF[b.kunci] : b.kunciTeks;
  }

  /** Pembahasan tanpa baris "Jawaban:" penutup (baris itu dicetak terpisah dengan huruf tebal). */
  function pembahasanBadan(b) {
    var p = b.pembahasan.slice();
    if (p.length && /^Jawaban: /.test(p[p.length - 1])) p.pop();
    return p;
  }

  // ---------------------------------------------------------------- pembuat blok

  function par(teks, o) {
    o = o || {};
    var blok = { t: 'p', runs: [{ teks: teks, tebal: !!o.tebal, miring: !!o.miring, warna: o.warna }], ukuran: o.ukuran, rata: o.rata, indent: o.indent, gantung: o.gantung, sesudah: o.sesudah, warna: o.warna };
    return blok;
  }

  function parRuns(runs, o) {
    o = o || {};
    return { t: 'p', runs: runs, ukuran: o.ukuran, rata: o.rata, indent: o.indent, gantung: o.gantung, sesudah: o.sesudah, warna: o.warna };
  }

  function barisTeks(t, o) {
    // baris berawalan "• " menjadi butir daftar bergantung
    if (adalahPoin(t)) return par(t, Object.assign({ indent: 14, gantung: 14, sesudah: 3 }, o || {}));
    return par(t, Object.assign({ sesudah: 5 }, o || {}));
  }

  function judulButir(b, nama) {
    return { t: 'p', runs: [{ teks: 'Soal ' + b.no, tebal: true }, { teks: '   ' + (b.submateriLabel || b.submateri) + ' · ' + (b.tingkatNama || b.level), warna: '667089' }], ukuran: 11.5, sesudah: 5, keras: true };
  }

  /**
   * @param {object} b butir
   * @param {function} img (butir, desc) -> objek gambar siap pakai ({png, raw, lebar, tinggi, skala}) atau null
   * @param {object} opsi
   */
  function blokSoal(b, img, opsi) {
    var out = [judulButir(b)];
    var gambar = (b.stimulus.gambar || []);

    if (b.submateri === 'verbal') {
      (b.stimulus.teks || []).forEach(function (t) { out.push(par(t, { sesudah: 6 })); });
      out.push(parRuns([{ teks: 'Pernyataan: ', tebal: true }, { teks: b.pertanyaan }], { sesudah: 4 }));
      out.push(par('Berdasarkan bacaan di atas, apakah pernyataan tersebut Benar, Salah, atau Tidak Diketahui?', { miring: true, ukuran: 9.5, warna: '667089', sesudah: 4 }));
    } else if (b.jenis === 'isian') {
      if (b.stimulus.judul) out.push(par(b.stimulus.judul, { tebal: true, sesudah: 4 }));
      (b.stimulus.teks || []).forEach(function (t) { out.push(barisTeks(t)); });
      out.push(par(b.pertanyaan, { tebal: true, sesudah: 4 }));
      out.push(par(bentukIsian(b), { miring: true, ukuran: 9.5, warna: '667089', sesudah: 6 }));
    } else if (b.submateri === 'figural') {
      out.push(par(b.perintah, { miring: true, ukuran: 9.5, warna: '667089', sesudah: 6 }));
    } else {
      // gambar tabel/grafik sudah memuat judulnya sendiri; judul teks hanya bila tak ada gambar
      if (b.stimulus.judul && !gambar.length) out.push(par(b.stimulus.judul, { tebal: true, sesudah: 4 }));
      (b.stimulus.teks || []).forEach(function (t) { out.push(barisTeks(t)); });
    }

    // gambar stimulus
    if (b.jenis === 'isian' && b.isian.jenis === 'tabel') {
      // empat tab berjajar dua-dua agar hemat halaman
      var jalur = [];
      gambar.forEach(function (g) { var im = img(b, g); if (im) jalur.push({ img: im, label: g.judul }); });
      for (var i = 0; i < jalur.length; i += 2) out.push({ t: 'galeri', item: jalur.slice(i, i + 2), lebarPt: 232, kolom: 2 });
    } else {
      gambar.forEach(function (g) {
        var im = img(b, g);
        if (!im) return;
        var natural = im.lebar / (im.skala || 2) * 0.75;
        var batas = b.submateri === 'figural' ? 440 : 420;
        out.push({ t: 'gambar', img: im, lebarPt: Math.min(natural, batas), rata: 'tengah', sesudah: 6 });
      });
    }

    if (b.jenis === 'pg') {
      if (b.submateri !== 'verbal' && b.pertanyaan) out.push(par(b.pertanyaan, { tebal: b.submateri !== 'figural', sesudah: 4 }));
      if (b.opsi[0] && b.opsi[0].gambar) {
        out.push({
          t: 'galeri', kolom: 5, lebarPt: 84,
          item: b.opsi.map(function (o, i) { return { img: img(b, o.gambar), label: HURUF[i] }; })
        });
      } else {
        b.opsi.forEach(function (o, i) { out.push(par(HURUF[i] + '.  ' + o.teks, { indent: 16, gantung: 16, sesudah: 2 })); });
      }
    } else {
      out.push(lembarJawab(b));
    }
    out.push({ t: 'jarak', tinggi: 10 });
    return { t: 'grup', anak: out };
  }

  /** Tabel isian kosong untuk butir interaktif pada naskah soal. */
  function lembarJawab(b) {
    var is = b.isian, baris = [], kosong = '.....................';
    var kep = function (t, rata) { return { teks: t, tebal: true, rata: rata || 'kiri', isi: 'E9EEF7' }; };
    if (is.jenis === 'bar-tumpuk') {
      baris.push([kep('Batang'), kep('Total', 'tengah'), kep('% ' + is.seri[0], 'tengah'), kep('% ' + is.seri[1], 'tengah')]);
      is.kategori.forEach(function (k) { baris.push([{ teks: k }, { teks: kosong, rata: 'tengah' }, { teks: kosong, rata: 'tengah' }, { teks: kosong, rata: 'tengah' }]); });
      return { t: 'tabel', lebarKol: [2, 2, 2, 2], baris: baris, header: true };
    }
    if (is.jenis === 'tabel') {
      baris.push([kep('Tab'), kep('Pilihan jawaban (' + is.pilihan.map(function (p, i) { return HURUF[i]; }).join('/') + ')', 'tengah')]);
      is.tab.forEach(function (n) { baris.push([{ teks: n }, { teks: kosong, rata: 'tengah' }]); });
      return { t: 'tabel', lebarKol: [2, 3], baris: baris, header: true };
    }
    if (is.jenis === 'garis') {
      baris.push([kep('Titik'), kep('Nilai', 'tengah')]);
      is.kategori.forEach(function (k) { baris.push([{ teks: k }, { teks: kosong, rata: 'tengah' }]); });
      return { t: 'tabel', lebarKol: [2, 3], baris: baris, header: true };
    }
    baris.push([kep('Irisan'), kep('Persentase', 'tengah')]);
    is.irisan.forEach(function (k) { baris.push([{ teks: k }, { teks: kosong, rata: 'tengah' }]); });
    baris.push([{ teks: 'Jumlah', tebal: true }, { teks: '100%', rata: 'tengah', tebal: true }]);
    return { t: 'tabel', lebarKol: [2, 3], baris: baris, header: true };
  }

  function blokKunci(paket) {
    var out = [{ t: 'h2', teks: 'Kunci jawaban' }];
    paket.subtes.forEach(function (st) {
      out.push(par(st.nama + ' (' + st.jumlah + ' soal)', { tebal: true, sesudah: 4 }));
      var baris = [[{ teks: 'No', tebal: true, isi: 'E9EEF7', rata: 'tengah' }, { teks: 'Submateri', tebal: true, isi: 'E9EEF7' }, { teks: 'Tingkat', tebal: true, isi: 'E9EEF7' }, { teks: 'Jawaban', tebal: true, isi: 'E9EEF7' }]];
      st.butir.forEach(function (b) {
        baris.push([{ teks: String(b.no), rata: 'tengah' }, { teks: b.submateriLabel || b.submateri }, { teks: b.tingkatNama || b.level }, { teks: b.jenis === 'pg' ? HURUF[b.kunci] : b.kunciTeks, tebal: b.jenis === 'pg' }]);
      });
      out.push({ t: 'tabel', lebarKol: st.kode === 'ku' ? [1, 5, 2, 2] : [1, 3, 2, 9], baris: baris, header: true });
      out.push({ t: 'jarak', tinggi: 10 });
    });
    return out;
  }

  function blokPembahasan(b, img) {
    var out = [];
    out.push({ t: 'p', runs: [{ teks: 'Soal ' + b.no, tebal: true }, { teks: '   ' + (b.submateriLabel || b.submateri) + ' · ' + (b.tingkatNama || b.level), warna: '667089' }], ukuran: 11.5, sesudah: 3, keras: true });
    out.push(parRuns([{ teks: 'Jawaban: ', tebal: true }, { teks: b.jenis === 'pg' ? HURUF[b.kunci] + (b.opsi[b.kunci].gambar ? '' : ' (' + b.opsi[b.kunci].teks + ')') : b.kunciTeks, tebal: true, warna: '12805C' }], { sesudah: 4 }));
    // gambar kondisi kunci (butir interaktif)
    (b.gambarPembahasan || []).forEach(function (g) {
      var im = img(b, g);
      if (!im) return;
      out.push({ t: 'gambar', img: im, lebarPt: Math.min(im.lebar / (im.skala || 2) * 0.75, 360), rata: 'tengah', sesudah: 6 });
    });
    pembahasanBadan(b).forEach(function (t) {
      if (/^Jenis soal: /.test(t)) out.push(par(t, { miring: true, ukuran: 9.5, warna: '667089', sesudah: 3 }));
      else out.push(barisTeks(t, { ukuran: 10 }));
    });
    // butir figural: tampilkan juga opsi yang benar
    if (b.submateri === 'figural' && b.opsi[b.kunci] && b.opsi[b.kunci].gambar) {
      var im2 = img(b, b.opsi[b.kunci].gambar);
      if (im2) out.push({ t: 'galeri', kolom: 5, lebarPt: 84, item: [{ img: im2, label: 'Kunci: ' + HURUF[b.kunci] }] });
    }
    out.push({ t: 'jarak', tinggi: 8 });
    return out;
  }

  /**
   * Susun seluruh naskah satu paket.
   * @param {object} paket
   * @param {function} img (butir, desc) -> gambar
   * @param {object} [opsi] { judul, tanpaPembahasan }
   */
  function dariPaket(paket, img, opsi) {
    opsi = opsi || {};
    var blok = [];
    var judul = opsi.judul || 'Tes Potensi Dasar OJK PCAM · Tahap 1';
    blok.push({ t: 'h1', teks: judul });
    blok.push(par('Paket ' + paket.id + ' · benih utama ' + (opsi.benih != null ? opsi.benih : '-') + ' · ' + paket.subtes.map(function (s) { return s.nama + ' ' + s.jumlah + ' soal / ' + s.menit + ' menit'; }).join(' · '), { ukuran: 9.5, warna: '667089', sesudah: 10 }));
    blok.push(par('Naskah soal', { tebal: true, ukuran: 13, sesudah: 4 }));
    paket.subtes.forEach(function (st, i) {
      blok.push({ t: 'h2', teks: 'Subtes ' + (i + 1) + ' — ' + st.nama });
      blok.push(par(st.jumlah + ' soal · ' + st.menit + ' menit' + (st.kode === 'pn' ? ' · tes interaktif: jawaban berupa kondisi akhir tampilan (batang, tab, titik, atau irisan)' : ' · pilihan ganda'), { ukuran: 9.5, warna: '667089', sesudah: 8 }));
      st.butir.forEach(function (b) { blok.push(blokSoal(b, img, opsi)); });
    });
    blok.push({ t: 'jeda' });
    blokKunci(paket).forEach(function (x) { blok.push(x); });
    if (!opsi.tanpaPembahasan) {
      blok.push({ t: 'jeda' });
      blok.push({ t: 'h2', teks: 'Pembahasan' });
      paket.subtes.forEach(function (st, i) {
        blok.push({ t: 'h3', teks: 'Subtes ' + (i + 1) + ' — ' + st.nama });
        st.butir.forEach(function (b) { blok.push({ t: 'grup', anak: blokPembahasan(b, img) }); });
      });
    }
    return { judul: judul + ' — Paket ' + paket.id, blok: blok, kaki: 'Paket ' + paket.id };
  }

  return {
    HURUF: HURUF, dariPaket: dariPaket, teksSoal: teksSoal, teksOpsi: teksOpsi, jawabanBenar: jawabanBenar,
    bentukIsian: bentukIsian, pembahasanBadan: pembahasanBadan, daftarSoal: Gambar.daftarSoal, daftarPembahasan: Gambar.daftarPembahasan
  };
});
