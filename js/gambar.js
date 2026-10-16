/*
 * gambar.js — mengubah deskriptor gambar sebuah butir menjadi SVG.
 *
 * Butir hanya menyimpan MODEL gambar (data murni berukuran kecil), bukan SVG-nya.
 * SVG dirakit saat dibutuhkan — untuk pratinjau, PNG, Word, dan PDF — sehingga
 * ratusan paket tidak memenuhi memori dengan teks SVG, dan setiap gambar selalu
 * digambar ulang dari data yang sama yang diperiksa validator.
 *
 * Deskriptor: { id, jenis, model, state?, judul? }
 *   jenis: tabel | bar | bar-tumpuk | garis | pie |
 *          serial | matriks | sel | serial-putar | figur |
 *          latin | latin-opsi (matriks 5x5), isi | isi-opsi (matriks 5x6),
 *          sekat | sekat-opsi (matriks 2x2 bersekat), ganda | ganda-opsi (deret kotak ganda)
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./chart.js'), require('./figural.js'), require('./serial-putar.js'), require('./matriks-latin.js'), require('./matriks-isi.js'),
      require('./matriks-sekat.js'), require('./serial-ganda.js'));
    module.exports = api;
  } else {
    api = factory(root.Chart, root.Figural, root.SerialPutar, root.MatriksLatin, root.MatriksIsi, root.MatriksSekat, root.SerialGanda);
    root.Gambar = api;
  }
})(typeof self !== 'undefined' ? self : this, function (Chart, Figural, SerialPutar, MatriksLatin, MatriksIsi, MatriksSekat, SerialGanda) {
  'use strict';

  /** @returns {{svg:string, lebar:number, tinggi:number}} */
  function svg(d) {
    var m = d.model;
    switch (d.jenis) {
      case 'tabel': return Chart.tabel(m);
      case 'bar': return Chart.bar(m);
      case 'bar-tumpuk': return Chart.barTumpuk(m, d.state);
      case 'garis': return Chart.garis(m, d.state);
      case 'pie': return Chart.pie(m, d.state);
      case 'serial': return Figural.svgSerial(m.sels, m.ukuran);
      case 'matriks': return Figural.svgMatriks(m.grid, m.mr, m.mc, m.ukuran);
      case 'sel': return Figural.svgSel(m.cell, m.ukuran || 120);
      case 'serial-putar': return SerialPutar.svgSerial(m.deret, m.skala);
      case 'figur': return SerialPutar.svgFigur(m.fig, m.skala, m.ukuran || 120);
      case 'latin': return MatriksLatin.svgMatriks(m.grid, m.lubang);
      case 'latin-opsi': return MatriksLatin.svgPotongan(m.isi);
      case 'isi': return MatriksIsi.svgMatriks(m.grid, m.lubang);
      case 'isi-opsi': return MatriksIsi.svgDeret(m.isi);
      case 'sekat': return MatriksSekat.svgSekat(m.pojok, m.dalam, m.tanya);
      case 'sekat-opsi': return MatriksSekat.svgPojok(m.fig, m.q);
      case 'ganda': return SerialGanda.svgDeret(m.kotak);
      case 'ganda-opsi': return SerialGanda.svgAtas(m.atas);
      default: throw new Error('jenis gambar tidak dikenal: ' + d.jenis);
    }
  }

  /** Semua gambar soal sebuah butir: stimulus, lalu pilihan bergambar. */
  function daftarSoal(butir) {
    var out = [];
    (butir.stimulus.gambar || []).forEach(function (g) { out.push(g); });
    (butir.opsi || []).forEach(function (o) { if (o.gambar) out.push(o.gambar); });
    return out;
  }

  /** Gambar yang hanya muncul di pembahasan (kondisi kunci butir interaktif). */
  function daftarPembahasan(butir) { return butir.gambarPembahasan || []; }

  return { svg: svg, daftarSoal: daftarSoal, daftarPembahasan: daftarPembahasan };
});
