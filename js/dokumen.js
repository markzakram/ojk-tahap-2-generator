/*
 * dokumen.js — model naskah sebuah paket, dipakai bersama oleh Word dan PDF.
 *
 * Satu model, dua penulis: `docx.js` dan `pdf.js` sama-sama membaca daftar BLOK ini,
 * jadi isi, urutan, dan istilah di kedua berkas selalu sama. Susunan naskah:
 *
 *   Setiap nomor: soal, pilihan, Jawaban: A. teks, lalu Pembahasan: uraian.
 *   Butir interaktif memakai nilai/kondisi akhir sebagai jawaban, disertai gambar kunci.
 *
 * Jenis blok:
 *   { t:'h1'|'h2'|'h3', teks }
 *   { t:'p', runs:[{teks, tebal, miring, warna}], ukuran, rata, indent, gantung, sesudah, warna }
 *   { t:'gambar', img, lebarPt, rata }
 *   { t:'galeri', item:[{img, label, lebarPt}] }
 *   { t:'tabel', lebarKol:[bagian], baris:[[{teks, tebal, rata, isi}]], header:true }
 *   { t:'rumus', notasi }           persamaan (Equation Word); PDF menerima teksnya sebagai paragraf biasa
 *   { t:'jeda' }
 *   { t:'grup', anak:[blok] }      jaga agar tidak terpisah halaman bila muat
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./gambar.js'), require('./format.js'), require('./rumus.js'));
    module.exports = api;
  } else {
    api = factory(root.Gambar, root.Fmt, root.Rumus);
    root.Dokumen = api;
  }
})(typeof self !== 'undefined' ? self : this, function (Gambar, Fmt, Rumus) {
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
      baris.push(b.pertanyaan);
      return baris.join('\n');
    }
    if (b.jenis === 'isian' && b.stimulus.judul) baris.push(b.stimulus.judul);
    (b.stimulus.teks || []).forEach(function (t) { baris.push(t); });
    teksKartu(b.stimulus.kartu).forEach(function (t) { baris.push(t); });
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

  function jawabanLengkap(b) {
    if (b.jenis !== 'pg') return b.kunciTeks;
    var o = b.opsi[b.kunci], huruf = HURUF[b.kunci];
    return huruf + '. ' + (o.gambar ? 'Gambar ' + huruf : o.teks);
  }

  /** Versi teks dengan urutan yang sama untuk kolom tambahan Excel dan JSON. */
  function naskahLengkap(b) {
    var bagian = [b.no + '. ' + teksSoal(b)];
    if (b.jenis === 'pg') b.opsi.forEach(function (o, i) { bagian.push(HURUF[i] + '. ' + (o.gambar ? 'Gambar ' + HURUF[i] : o.teks)); });
    bagian.push('Jawaban: ' + jawabanLengkap(b));
    bagian.push('Pembahasan: ' + pembahasanBadan(b).filter(function (t) { return !/^Jenis soal: /.test(t); }).map(function (t) { return Rumus.barisTeks(t); }).join('\n'));
    return bagian.join('\n\n');
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

  /**
   * @param {object} b butir
   * @param {function} img (butir, desc) -> objek gambar siap pakai ({png, raw, lebar, tinggi, skala}) atau null
   * @param {object} opsi
   */
  function blokSoal(b, img, opsi) {
    var out = [];
    var gambar = (b.stimulus.gambar || []);

    if (b.submateri === 'verbal') {
      // seperti contoh riset: pernyataan dicetak polos di bawah bacaan, tanpa label dan tanpa kalimat petunjuk
      (b.stimulus.teks || []).forEach(function (t) { out.push(par(t, { sesudah: 6 })); });
      out.push(par(b.pertanyaan, { sesudah: 4 }));
    } else if (b.jenis === 'isian') {
      if (b.stimulus.judul) out.push(par(b.stimulus.judul, { tebal: true, sesudah: 4 }));
      (b.stimulus.teks || []).forEach(function (t) { out.push(barisTeks(t)); });
      if (b.stimulus.kartu) out.push(blokKartu(b.stimulus.kartu));
      out.push(par(b.pertanyaan, { sesudah: 4 }));
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
      if (b.submateri !== 'verbal' && b.pertanyaan) out.push(par(b.pertanyaan, { sesudah: 4 }));
      if (b.opsi[0] && b.opsi[0].gambar) {
        var item = b.opsi.map(function (o, i) { return { img: img(b, o.gambar), label: HURUF[i] + '.' }; });
        // opsi yang melebar (potongan 5x6 atau 5x5 berisi 3-4 simbol) dibuat tiga kolom supaya simbolnya tidak mengecil
        var lebar = item.some(function (it) { return it.img && it.img.lebar / it.img.tinggi > 2.2; });
        out.push({ t: 'galeri', kolom: lebar ? 3 : 5, lebarPt: lebar ? 140 : 84, item: item });
      } else {
        b.opsi.forEach(function (o, i) { out.push(par(HURUF[i] + '.  ' + o.teks, { indent: 16, gantung: 16, sesudah: 2 })); });
      }
    } else {
      out.push(lembarJawab(b));
    }
    // Nomor melekat pada awal stimulus, termasuk bila stimulus dimulai dengan gambar.
    if (!out.length || out[0].t !== 'p') out.unshift(par('Perhatikan informasi berikut.', { sesudah: 4 }));
    out[0].runs.unshift({ teks: b.no + '. ' });
    out[0].keras = true;
    return { t: 'grup', anak: out };
  }

  /** Kotak keterangan berwarna (pie chart) dua-dua seperti contoh riset; kotak tanpa isi tetap tampil. */
  function blokKartu(kartu) {
    var sel = kartu.map(function (k) { return { judul: k.judul, teks: k.teks, isi: k.warna, warnaTeks: 'FFFFFF', minBaris: 3 }; });
    var baris = [];
    for (var i = 0; i < sel.length; i += 2) baris.push(sel.slice(i, i + 2));
    return { t: 'tabel', lebarKol: [1, 1], baris: baris, header: false, garis: 'FFFFFF' };
  }

  /** Teks kotak keterangan untuk Excel/JSON: "Judul: isi" per baris; kotak kosong ditandai "-". */
  function teksKartu(kartu) {
    return (kartu || []).map(function (k) { return k.judul + ': ' + (k.teks || '-'); });
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

  /** Satu baris pembahasan untuk PDF: persamaan sebagai teks menjorok, judul bagian (Diketahui, ...) tebal. */
  function barisPembahasanPdf(t) {
    if (Rumus.adalah(t)) return par(Rumus.barisTeks(t, true), { ukuran: 10, indent: 18, sesudah: 3 });
    if (Rumus.judulBagian(t)) return par(t, { ukuran: 10, tebal: true, sesudah: 2 });
    return barisTeks(t, { ukuran: 10 });
  }

  function blokPembahasan(b, img) {
    var out = [];
    var jawaban = jawabanLengkap(b);
    out.push(parRuns([{ teks: 'Jawaban: ', tebal: true }, { teks: jawaban }], { sesudah: 5 }));
    var uraian = pembahasanBadan(b).filter(function (t) { return !/^Jenis soal: /.test(t); });
    var pertama = uraian.length && !Rumus.adalah(uraian[0]) && !Rumus.judulBagian(uraian[0]) ? uraian.shift() : '';
    out.push(parRuns([{ teks: 'Pembahasan: ', tebal: true }, { teks: pertama }], { ukuran: 10, sesudah: 5 }));
    // gambar kondisi kunci (butir interaktif)
    (b.gambarPembahasan || []).forEach(function (g) {
      var im = img(b, g);
      if (!im) return;
      out.push({ t: 'gambar', img: im, lebarPt: Math.min(im.lebar / (im.skala || 2) * 0.75, 360), rata: 'tengah', sesudah: 6 });
    });
    uraian.forEach(function (t) { out.push(barisPembahasanPdf(t)); });
    // butir figural tidak lagi memuat galeri "Kunci: X": gambar pembahasannya sudah menampilkan jawaban
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
    // subtes berikutnya mulai di halaman baru supaya judulnya tidak tertinggal di dasar halaman
    paket.subtes.forEach(function (st, i) {
      if (i > 0) blok.push({ t: 'jeda' });
      blok.push({ t: 'h2', teks: 'Subtes ' + (i + 1) + ' — ' + st.nama });
      blok.push(par(st.jumlah + ' soal · ' + st.menit + ' menit' + (st.kode === 'pn' ? ' · tes interaktif: jawaban berupa kondisi akhir tampilan (batang, tab, titik, atau irisan)' : ' · pilihan ganda'), { ukuran: 9.5, warna: '667089', sesudah: 8 }));
      st.butir.forEach(function (b) {
        var soal = blokSoal(b, img, opsi);
        if (!opsi.tanpaPembahasan) {
          var pem = blokPembahasan(b, img);
          // Jaga pilihan, jawaban, dan awal pembahasan tetap berdekatan;
          // pembahasan panjang boleh berlanjut ke halaman berikutnya.
          soal.anak = soal.anak.concat(pem.splice(0, 2));
          blok.push(soal);
          pem.forEach(function (x) { blok.push(x); });
        } else blok.push(soal);
        blok.push({ t: 'jarak', tinggi: 12 });
      });
    });
    return { judul: judul + ' — Paket ' + paket.id, blok: blok, kaki: 'Paket ' + paket.id };
  }

  // ------------------------------------------------------- format input Word SiAdu

  /*
   * Naskah Word mengikuti template input otomatis SiAdu: setiap soal diawali "Soal N", lalu
   * "Tingkat Kesulitan", "Bentuk Soal", teks soal, pilihan, "Jawaban:", dan "Pembahasan:".
   *
   *   Pilihan ganda (Option New)   gambar tabel/grafik/figural disisipkan di soal; pilihan bergambar
   *                                ditulis "A." diikuti gambarnya di paragraf yang sama
   *   Bar Chart / Line Chart /     tanpa gambar tampilan awal (grafik dibuat SiAdu dari tabel);
   *   Pie Chart                    baris "Pengaturan", (Bar) "Variabel", lalu tabel berkolom "Kunci Nilai";
   *                                "Jawaban:" kosong karena kuncinya ada di tabel
   *   Table Decision               "Label Keputusan", "Opsi", lalu tiap tab "Tab: <nama>" dan tabel Word datanya
   *
   * Importir membaca semua yang ada setelah "Pembahasan:" sampai "Soal N" berikutnya sebagai pembahasan,
   * jadi tiap subtes ditulis ke berkas Word tersendiri (tanpa judul subtes di antara soal).
   */
  var TINGKAT_SIADU = { mudah: 'Mudah', sedang: 'Sedang', sulit: 'Sulit' };
  var BENTUK_SIADU = { 'bar-tumpuk': 'Bar Chart', garis: 'Line Chart', pie: 'Pie Chart', tabel: 'Table Decision' };

  function bentukSiadu(b) { return b.jenis === 'pg' ? 'Option New' : BENTUK_SIADU[b.isian.jenis]; }
  function polos(t) { return String(t).replace(/^• /, '- '); }
  function judulPolos(b) { return String(b.stimulus.judul || '').split(' · ')[0]; }
  function huruf1Kecil(t) { return t ? t.charAt(0).toLowerCase() + t.slice(1) : t; }
  function selKepala(t) { return { teks: t, tebal: true }; }
  function tabelSiadu(kepala, baris) {
    var semua = (kepala ? [kepala.map(selKepala)] : []).concat(baris.map(function (r) { return r.map(function (t) { return { teks: String(t) }; }); }));
    return { t: 'tabel', lebarKol: semua[0].map(function () { return 1; }), baris: semua, header: !!kepala };
  }

  /** Uraian pembahasan untuk SiAdu: tanpa baris "Jenis soal" dan "Tampilan awal" (SiAdu menuliskan kuncinya sendiri). */
  function pembahasanSiadu(b) {
    return pembahasanBadan(b).filter(function (t) { return !/^(Jenis soal|Tampilan awal): /.test(t); }).map(function (t) { return Rumus.adalah(t) ? t : polos(t); });
  }

  function soalPgSiadu(b, img, out) {
    var gambar = b.stimulus.gambar || [];
    if (b.submateri === 'figural') {
      if (b.perintah) out.push(par(b.perintah));
    } else {
      if (b.stimulus.judul && !gambar.length && b.submateri !== 'verbal') out.push(par(b.stimulus.judul));
      (b.stimulus.teks || []).forEach(function (t) { out.push(par(polos(t))); });
    }
    gambar.forEach(function (g) {
      var im = img(b, g);
      if (im) out.push({ t: 'gambar', img: im, lebarPt: Math.min(im.lebar / (im.skala || 2) * 0.75, b.submateri === 'figural' ? 440 : 420), sesudah: 6 });
    });
    if (b.pertanyaan) out.push(par(b.pertanyaan));
    b.opsi.forEach(function (o, i) {
      if (o.gambar) {
        var im = img(b, o.gambar);
        out.push({ t: 'p', runs: [{ teks: HURUF[i] + '. ' }], img: im, lebarPt: im && im.lebar / im.tinggi > 2.2 ? 150 : 84, sesudah: 4 });
      } else out.push(par(HURUF[i] + '. ' + o.teks));
    });
    out.push(par('Jawaban: ' + HURUF[b.kunci]));
  }

  function soalIsianSiadu(b, out) {
    var is = b.isian, jenis = is.jenis, a = function (v) { return Fmt.angka(v); };
    out.push(par(judulPolos(b)));
    if (jenis === 'pie') {
      // SiAdu memberi warna irisan sendiri, jadi nama warna tidak disebut di soal
      (b.stimulus.teks || []).forEach(function (t) { out.push(par(t.replace(/ \((biru|hijau|jingga|merah)\)/g, ''))); });
      var kartu = (b.stimulus.kartu || []).map(function (k) { return k.judul + ':' + (k.teks ? ' ' + huruf1Kecil(k.teks) : ''); });
      var baris = [];
      for (var i = 0; i < kartu.length; i += 2) baris.push(kartu.slice(i, i + 2));
      if (baris.length) out.push(tabelSiadu(null, baris));
    } else {
      (b.stimulus.teks || []).forEach(function (t) { out.push(par(jenis === 'bar-tumpuk' ? '- ' + t : polos(t))); });
    }
    out.push(par('Pertanyaan'));
    out.push(par(jenis === 'tabel' ? b.pertanyaan.replace(/\s*Setiap tabel di bawah mewakili tampilan tabel ketika tab nama tersebut dipilih\.?/, '') : b.pertanyaan));
    if (jenis === 'bar-tumpuk') {
      var m = is.model, kt = is.kontrol[0], kp = is.kontrol[1];
      out.push(par('Pengaturan: Sumbu Y 0 - ' + a(m.sumbuMaks) + '; Garis bantu ' + Math.round(m.sumbuMaks / m.langkah) + '; Kelipatan nilai ' + a(kt.langkah) + '; Kelipatan persen ' + kp.langkah));
      out.push(par('Variabel: ' + is.seri[0] + ' ' + is.awal.persen[0] + '%; ' + is.seri[1] + ' ' + (100 - is.awal.persen[0]) + '%'));
      out.push(tabelSiadu(['Kategori', 'Nilai Awal', 'Kunci Nilai', is.seri[0], is.seri[1]], is.kategori.map(function (k, j) {
        return [k, a(is.awal.total[j]), a(is.kunci.total[j]), a(is.kunci.persen[j]), a(100 - is.kunci.persen[j])];
      })));
      out.push(par('Jawaban:'));
    } else if (jenis === 'garis') {
      var k = is.kontrol[0];
      out.push(par('Pengaturan: Sumbu Y ' + a(k.min) + ' - ' + a(k.maks) + '; Garis bantu ' + Math.round((k.maks - k.min) / is.model.langkah) + '; Kelipatan nilai ' + a(k.langkah)));
      out.push(tabelSiadu(['Titik', 'Kunci Nilai'], is.kategori.map(function (t, j) { return [t, a(is.kunci.nilai[j])]; })));
      out.push(par('Jawaban:'));
    } else if (jenis === 'pie') {
      var kp2 = is.kontrol[0];
      out.push(par('Pengaturan: Kelipatan nilai ' + kp2.langkah + '; Nilai minimum ' + kp2.langkah));
      out.push(tabelSiadu(['Bagian', 'Nilai Awal', 'Kunci Nilai'], is.irisan.map(function (n, j) { return [n, a(is.awal.persen[j]), a(is.kunci.persen[j])]; })));
      out.push(par('Jawaban:'));
    } else {
      var tab0 = (is.tabel || [])[0] || {};
      if (tab0.statusBaris) out.push(par('Label Keputusan: ' + tab0.statusBaris));
      out.push(par('Opsi: ' + is.pilihan.map(function (p, j) { return HURUF[j] + '. ' + p; }).join('; ')));
      is.tab.forEach(function (nama, j) {
        var m2 = is.tabel[j];
        out.push(par('Tab: ' + nama));
        out.push(tabelSiadu(m2.kolom, m2.baris.map(function (r) { return [r.label].concat(r.sel); })));
      });
      out.push(par('Jawaban: ' + is.tab.map(function (nama, j) { return nama + ': ' + HURUF[is.kunci[j]]; }).join('; ')));
    }
  }

  /** Blok satu soal dalam format SiAdu. */
  function blokSiadu(b, img) {
    // identitas Kerangka Course dicetak tebal sebagai paragraf biasa (bukan Heading); Subchapter
    // dihapus bila kosong. Baris Tingkat Kesulitan dan Bentuk Soal tetap ada karena wajib bagi importir SiAdu.
    var k = b.klasifikasi || {};
    var out = [parRuns([{ teks: 'Soal ' + b.no, tebal: true }])];
    out.push(parRuns([{ teks: 'Category: ' + k.category, tebal: true }]));
    out.push(parRuns([{ teks: 'Lesson: ' + k.lesson, tebal: true }]));
    out.push(parRuns([{ teks: 'Chapter: ' + k.chapter, tebal: true }]));
    if (k.subchapter) out.push(parRuns([{ teks: 'Subchapter: ' + k.subchapter, tebal: true }]));
    out.push(par('Tingkat Kesulitan: ' + (TINGKAT_SIADU[b.level] || b.level)));
    out.push(par('Bentuk Soal: ' + bentukSiadu(b)));
    out.push(par(''));
    if (b.jenis === 'pg') soalPgSiadu(b, img, out);
    else soalIsianSiadu(b, out);
    out.push(par('Pembahasan:'));
    // gambar tahapan pola (figural) masuk ke kolom pembahasan SiAdu; soal grafik tidak memakai gambar
    if (b.jenis === 'pg') (b.gambarPembahasan || []).forEach(function (g) {
      var im = img(b, g);
      if (im) out.push({ t: 'gambar', img: im, lebarPt: Math.min(im.lebar / (im.skala || 2) * 0.75, 440), sesudah: 6 });
    });
    pembahasanSiadu(b).forEach(function (t) {
      if (Rumus.adalah(t)) out.push({ t: 'rumus', notasi: Rumus.isi(t) });
      else out.push(par(t, Rumus.judulBagian(t) ? { tebal: true } : {}));
    });
    return out;
  }

  /**
   * Naskah input Word SiAdu: satu model per subtes (importir tidak mengenal judul subtes).
   * @returns {Array<{subtes:string, judul:string, blok:Array, kaki:string}>}
   */
  function siaduPaket(paket, img, opsi) {
    opsi = opsi || {};
    var judul = opsi.judul || 'Tes Potensi Dasar OJK PCAM · Tahap 1';
    return paket.subtes.map(function (st) {
      var blok = [];
      // pengantar sebelum "Soal 1" diabaikan importir, seperti pengantar pada template SiAdu
      blok.push({ t: 'p', runs: [{ teks: judul + ' — Paket ' + paket.id + ' · ' + st.nama, tebal: true }], ukuran: 16, sesudah: 4 });
      blok.push(par('Format input Word SiAdu · ' + st.jumlah + ' soal · ' + st.menit + ' menit · benih utama ' + (opsi.benih != null ? opsi.benih : '-') +
        (st.kode === 'pn' ? '. Grafik dibuat SiAdu dari tabel berkolom "Kunci Nilai"; Table Decision memakai tabel tiap tab.' : '. Pilihan ganda (Option New).'), { miring: true, warna: '888888', sesudah: 10 }));
      st.butir.forEach(function (b) {
        blokSiadu(b, img).forEach(function (x) { blok.push(x); });
        blok.push(par(''));
      });
      return { subtes: st.kode, judul: judul + ' — Paket ' + paket.id + ' · ' + st.nama, blok: blok, kaki: 'Paket ' + paket.id + ' · ' + st.nama };
    });
  }

  return {
    HURUF: HURUF, dariPaket: dariPaket, siaduPaket: siaduPaket, bentukSiadu: bentukSiadu, teksSoal: teksSoal, teksOpsi: teksOpsi, jawabanBenar: jawabanBenar,
    bentukIsian: bentukIsian, jawabanLengkap: jawabanLengkap, naskahLengkap: naskahLengkap, pembahasanBadan: pembahasanBadan, daftarSoal: Gambar.daftarSoal, daftarPembahasan: Gambar.daftarPembahasan
  };
});
