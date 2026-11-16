/* Klasifikasi sesuai mapping terakhir pengguna, 22 Oktober 2026.
 * Tes dan Subtes adalah identitas terpisah, bukan Category dan Lesson.
 * Nilai kosong pada gambar disimpan sebagai null; Word menghilangkan baris
 * Subchapter yang kosong, Excel mengosongkan sel, JSON mempertahankan null.
 */
(function (root, factory) {
  var api = factory(typeof module === 'object' && module.exports ? require('./riset-figural.js') : root.RisetFigural);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Kerangka = api;
})(typeof self !== 'undefined' ? self : this, function (RisetFigural) {
  'use strict';

  var CATEGORY = { verbal: 'Penalaran Verbal', numerik: 'Numerik/ Kuantitatif', figural: 'Penalaran Spasial' };
  var LESSON = { verbal: 'Analitis', cerita: 'Soal Cerita [BS]', tabel: 'Tabel dan Grafik [BS]', grafik: 'Tabel dan Grafik [BS]', figural: 'Bangun Datar', pn: 'SHL Interaktif' };
  var CHAPTER_KU = { verbal: 'SHL_Verbal Reasoning', cerita: 'SHL_Soal Cerita', tabel: 'SHL_Analisis Tabel', grafik: 'SHL_Interpretasi Grafik' };
  var CHAPTER_PN = {
    'bar-tumpuk': 'Bar Chart', garis: 'Line Graph',
    'tabel-2': 'Table Decision - 2 Opsi', 'tabel-3-4': 'Table Decision - 3-4 Opsi',
    'pie-penuh': 'Pie Chart - Informasi Penuh', 'pie-kosong': 'Pie Chart - 1 Informasi Kosong',
    peringkat: 'Badges'
  };
  var BAB = {
    'SHL_Verbal Reasoning': [null],
    'SHL_Soal Cerita': ['Bilangan dan Perbandingan', 'Aljabar Dasar', 'Laju dan Waktu', 'Aritmatika Keuangan'],
    'SHL_Analisis Tabel': ['Bilangan dan Perbandingan', 'Persentase dan Pertumbuhan', 'Rata-rata', 'Aritmatika Keuangan', 'Aljabar Dasar', 'Pengukuran dan Konversi Satuan'],
    'SHL_Interpretasi Grafik': ['Persentase dan Pertumbuhan']
  };
  var FIGURAL = {};
  RisetFigural.DEFINISI.forEach(function (d) { FIGURAL[d.id] = d.nama; BAB[d.nama] = [null]; });
  Object.keys(CHAPTER_PN).forEach(function (id) { BAB[CHAPTER_PN[id]] = [null]; });

  // Konsep keluarga dikelompokkan hanya ke Subchapter yang ada pada gambar.
  // Grafik KU memiliki satu Subchapter pada mapping; rincian pola tetap disimpan
  // di keluarga/pola. Klasifikasi tidak mengubah naskah, kunci, atau komposisi.
  var KELUARGA = {
    'pecahan-sisa': 'Bilangan dan Perbandingan',
    'persen-naik': 'Bilangan dan Perbandingan',
    'aljabar-berat': 'Aljabar Dasar',
    'laju-mesin': 'Laju dan Waktu',
    'laba-majemuk': 'Aritmatika Keuangan', pendapatan: 'Aritmatika Keuangan',
    campuran: 'Bilangan dan Perbandingan', diskon: 'Aritmatika Keuangan',
    'ukur-wadah': 'Bilangan dan Perbandingan', 'banding-waktu': 'Laju dan Waktu',
    'kerja-bersama': 'Laju dan Waktu', 'kecepatan-rata': 'Laju dan Waktu',
    'rata-gabungan': 'Bilangan dan Perbandingan',
    'harga-semula': 'Aritmatika Keuangan', 'bunga-tunggal': 'Aritmatika Keuangan',
    'rasio-baris': 'Bilangan dan Perbandingan',
    'persen-gabungan': 'Persentase dan Pertumbuhan', 'pertumbuhan-tahun': 'Persentase dan Pertumbuhan',
    'rata-per-mesin': 'Rata-rata', 'laba-persen': 'Aritmatika Keuangan',
    'tak-diketahui': 'Aljabar Dasar', 'harga-satuan': 'Pengukuran dan Konversi Satuan',
    'perubahan-persen': 'Persentase dan Pertumbuhan', 'tabel-tumbuh-majemuk': 'Persentase dan Pertumbuhan',
    'tabel-rata-gabungan': 'Rata-rata', 'tabel-rata-tertimbang': 'Rata-rata',
    'tabel-target': 'Persentase dan Pertumbuhan', 'tabel-produktivitas': 'Bilangan dan Perbandingan',
    'tanpa-cacat': 'Persentase dan Pertumbuhan', 'naik-total': 'Persentase dan Pertumbuhan',
    'persen-sumbangan': 'Persentase dan Pertumbuhan', 'rasio-batang': 'Persentase dan Pertumbuhan',
    'grafik-laba': 'Persentase dan Pertumbuhan', 'grafik-target-rata': 'Persentase dan Pertumbuhan'
  };
  var NONAKTIF = ['peluang-kupon', 'irisan-kelas', 'barisan-kursi', 'kurs'];

  /** @returns {{category:string, lesson:string, chapter:string, subchapter:(string|null)}} */
  function klasifikasi(b) {
    var k = { category: null, lesson: null, chapter: null, subchapter: null };
    if (b.subtes === 'pn') {
      k.category = CATEGORY.numerik; k.lesson = LESSON.pn;
      var is = b.isian || {}, jenis = is.jenis;
      if (jenis === 'tabel') {
        var n = (is.pilihan || []).length;
        if (n !== 2 && n !== 3 && n !== 4) throw new Error('kerangka: Table Decision harus memiliki 2, 3, atau 4 opsi');
        jenis = n === 2 ? 'tabel-2' : 'tabel-3-4';
      } else if (jenis === 'pie') {
        var bentuk = (b.model || {}).bentuk;
        if (bentuk !== 'penuh' && bentuk !== 'kosong') throw new Error('kerangka: bentuk Pie Chart belum dipetakan');
        jenis = 'pie-' + bentuk;
      }
      k.chapter = CHAPTER_PN[jenis];
    } else if (b.subtes === 'ku') {
      var sub = b.submateri;
      k.category = sub === 'verbal' ? CATEGORY.verbal : sub === 'figural' ? CATEGORY.figural : CATEGORY.numerik;
      k.lesson = LESSON[sub];
      k.chapter = sub === 'figural' ? FIGURAL[b.keluarga] : CHAPTER_KU[sub];
      if (sub !== 'verbal' && sub !== 'figural') k.subchapter = KELUARGA[b.keluarga];
    }
    if (!k.lesson || !k.chapter || !BAB[k.chapter] || BAB[k.chapter].indexOf(k.subchapter) < 0) {
      throw new Error('kerangka: klasifikasi belum dipetakan untuk ' + b.subtes + '/' + b.submateri + '/' + b.keluarga);
    }
    return k;
  }

  function periksa(b) {
    try {
      var benar = klasifikasi(b), k = b.klasifikasi || {};
      return Object.keys(benar).filter(function (field) { return k[field] !== benar[field]; })
        .map(function (field) { return 'Klasifikasi ' + field + ' harus ' + JSON.stringify(benar[field]) + '.'; });
    } catch (e) { return [e.message]; }
  }

  /** Klasifikasi katalog sebelum angka/gambar soal dibuat; memakai aturan yang sama. */
  function dariKeluarga(subtes, submateri, keluarga) {
    var b = { subtes: subtes, submateri: submateri, keluarga: keluarga };
    if (subtes === 'pn') {
      var jenis = submateri === 'bar' ? 'bar-tumpuk' : submateri;
      b.isian = { jenis: jenis };
      if (jenis === 'tabel') {
        if (keluarga !== 'target-2-opsi' && keluarga !== 'komisi-3-opsi') throw new Error('Keluarga tabel belum dipetakan: ' + keluarga);
        b.isian.pilihan = keluarga === 'target-2-opsi' ? [0, 1] : [0, 1, 2];
      }
      if (jenis === 'pie') b.model = { bentuk: keluarga === 'pie-penuh' ? 'penuh' : keluarga === 'pie-kosong' ? 'kosong' : null };
    }
    return klasifikasi(b);
  }

  return { CATEGORY: CATEGORY, LESSON: LESSON, BAB: BAB, KELUARGA: KELUARGA, FIGURAL: FIGURAL,
    NONAKTIF: NONAKTIF, CHAPTER_KU: CHAPTER_KU, CHAPTER_PN: CHAPTER_PN, klasifikasi: klasifikasi, dariKeluarga: dariKeluarga, periksa: periksa };
});
