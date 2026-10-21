/*
 * kerangka.js — klasifikasi tiap soal menurut tab Kerangka Course (panduan revisi paket-002).
 *
 *   Kolom Kerangka Course   Label pada soal
 *   Tes                     Category      selalu "Tes Potensi Dasar"
 *   Subtes                  Lesson        Kemampuan Umum | Penalaran Numerik
 *   Materi                  Chapter       Verbal | Numerik | Figural | Bar Chart | Table Decision | Line Graph | Pie Chart
 *   Bab                     Subchapter    nama bab persis seperti Kerangka Course; kosong untuk Penalaran Numerik
 *
 * Subchapter dipilih menurut konsep utama yang diuji (bukan tampilan tabel/grafiknya). Verbal
 * dipetakan dari pola penalaran pernyataannya; numerik dan figural dari keluarga soal. Nama yang
 * tidak tercantum di Kerangka Course tidak boleh dipakai, jadi keluarga yang materinya belum ada di
 * sana dinonaktifkan di bank (lihat NONAKTIF).
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Kerangka = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var CATEGORY = 'Tes Potensi Dasar';
  var LESSON = { ku: 'Kemampuan Umum', pn: 'Penalaran Numerik' };

  /** Bab (Subchapter) yang tercantum di Kerangka Course, per Materi (Chapter). */
  var BAB = {
    Verbal: ['Konsep Dasar Penalaran Verbal', 'Informasi Tersurat dan Parafrase', 'Kata Pembatas dan Cakupan Pernyataan',
      'Hubungan Antarinformasi dalam Bacaan', 'Penarikan Simpulan dan Identifikasi Asumsi'],
    Numerik: ['Operasi Hitung', 'Konsep Dasar Aljabar', 'Persamaan Linear', 'Soal Cerita Aljabar', 'Rasio', 'Perbandingan Senilai dan Berbalik',
      'Persentase dan Pertumbuhan', 'Pengukuran dan Konversi Satuan', 'Laju dan Waktu', 'Aritmatika Keuangan', 'Rata-Rata', 'Analisis Tabel', 'Interpretasi Grafik'],
    Figural: ['Macam-macam Transformasi Figural', 'Figural Serial - The Next Box', 'Figural Serial - The Next Double Box', 'Figural Matriks - Kotak 3x3',
      'Figural Matriks - Kotak 5x5', 'Figural Matriks - Kotak 5x6', 'Figural Matriks - Kotak 2x2 Bersekat']
  };

  /** Pola penalaran pernyataan verbal -> Bab. */
  var VERBAL = {
    'daftar-terbuka': 'Konsep Dasar Penalaran Verbal',       // Tidak Diketahui: hal yang tidak disebut bacaan
    daftar: 'Informasi Tersurat dan Parafrase',
    urutan: 'Informasi Tersurat dan Parafrase',
    temuan: 'Informasi Tersurat dan Parafrase',
    cakupan: 'Kata Pembatas dan Cakupan Pernyataan',
    kuantor: 'Kata Pembatas dan Cakupan Pernyataan',
    'daftar-tertutup': 'Kata Pembatas dan Cakupan Pernyataan',
    'teori-bukti': 'Kata Pembatas dan Cakupan Pernyataan',
    'batas-waktu': 'Kata Pembatas dan Cakupan Pernyataan',
    golongan: 'Hubungan Antarinformasi dalam Bacaan',
    'sebab-akibat': 'Hubungan Antarinformasi dalam Bacaan',
    banding: 'Hubungan Antarinformasi dalam Bacaan',
    syarat: 'Penarikan Simpulan dan Identifikasi Asumsi',
    generalisasi: 'Penarikan Simpulan dan Identifikasi Asumsi'
  };

  /** Keluarga numerik dan figural -> Bab, menurut konsep utama yang diuji. */
  var KELUARGA = {
    // soal cerita
    'pecahan-sisa': 'Operasi Hitung',
    'persen-naik': 'Persentase dan Pertumbuhan',
    'aljabar-berat': 'Persamaan Linear',
    'laju-mesin': 'Laju dan Waktu',
    'laba-majemuk': 'Aritmatika Keuangan',
    pendapatan: 'Aritmatika Keuangan',
    campuran: 'Rasio',
    diskon: 'Aritmatika Keuangan',
    'ukur-wadah': 'Pengukuran dan Konversi Satuan',
    'banding-waktu': 'Laju dan Waktu',
    'kerja-bersama': 'Perbandingan Senilai dan Berbalik',
    'kecepatan-rata': 'Laju dan Waktu',
    'rata-gabungan': 'Rata-Rata',
    'harga-semula': 'Aritmatika Keuangan',
    'bunga-tunggal': 'Aritmatika Keuangan',
    // tabel
    'rasio-baris': 'Rasio',
    'persen-gabungan': 'Persentase dan Pertumbuhan',
    'pertumbuhan-tahun': 'Persentase dan Pertumbuhan',
    'rata-per-mesin': 'Rata-Rata',
    'laba-persen': 'Aritmatika Keuangan',
    'tak-diketahui': 'Soal Cerita Aljabar',
    'harga-satuan': 'Pengukuran dan Konversi Satuan',
    'perubahan-persen': 'Persentase dan Pertumbuhan',
    'tabel-tumbuh-majemuk': 'Persentase dan Pertumbuhan',
    'tabel-rata-gabungan': 'Rata-Rata',
    'tabel-rata-tertimbang': 'Rata-Rata',
    'tabel-target': 'Analisis Tabel',
    'tabel-produktivitas': 'Laju dan Waktu',
    // grafik batang
    'tanpa-cacat': 'Interpretasi Grafik',
    'naik-total': 'Interpretasi Grafik',
    'persen-sumbangan': 'Persentase dan Pertumbuhan',
    'rasio-batang': 'Rasio',
    'grafik-laba': 'Interpretasi Grafik',
    'grafik-target-rata': 'Rata-Rata',
    // figural
    serial: 'Figural Serial - The Next Box',
    'serial-putar': 'Figural Serial - The Next Box',
    'serial-ganda': 'Figural Serial - The Next Double Box',
    'matriks-sambung': 'Figural Matriks - Kotak 3x3',
    'matriks-3': 'Figural Matriks - Kotak 3x3',
    'matriks-latin': 'Figural Matriks - Kotak 5x5',
    'matriks-isi': 'Figural Matriks - Kotak 5x6',
    'matriks-sekat': 'Figural Matriks - Kotak 2x2 Bersekat'
  };

  /**
   * Keluarga yang tidak dibuat lagi: materinya tidak ada di Kerangka Course (peluang, himpunan,
   * barisan) atau bertentangan dengan ketentuan USD tanpa konversi kurs.
   */
  var NONAKTIF = ['peluang-kupon', 'irisan-kelas', 'barisan-kursi', 'kurs'];

  var CHAPTER_PN = { 'bar-tumpuk': 'Bar Chart', tabel: 'Table Decision', garis: 'Line Graph', pie: 'Pie Chart' };

  /**
   * Klasifikasi satu butir. Melempar galat bila keluarga/pola belum dipetakan atau nama bab
   * tidak tercantum di Kerangka Course.
   * @returns {{category:string, lesson:string, chapter:string, subchapter:(string|null)}}
   */
  function klasifikasi(b) {
    var k = { category: CATEGORY, lesson: LESSON[b.subtes], chapter: null, subchapter: null };
    if (b.subtes === 'pn') {
      k.chapter = CHAPTER_PN[b.isian && b.isian.jenis];
      if (!k.chapter) throw new Error('kerangka: jenis isian ' + (b.isian && b.isian.jenis) + ' belum dipetakan');
      return k;
    }
    if (b.submateri === 'verbal') { k.chapter = 'Verbal'; k.subchapter = VERBAL[b.pola]; }
    else if (b.submateri === 'figural') { k.chapter = 'Figural'; k.subchapter = KELUARGA[b.keluarga]; }
    else { k.chapter = 'Numerik'; k.subchapter = KELUARGA[b.keluarga]; }
    if (!k.subchapter) throw new Error('kerangka: ' + (b.submateri === 'verbal' ? 'pola verbal ' + b.pola : 'keluarga ' + b.keluarga) + ' belum dipetakan ke Kerangka Course');
    if (BAB[k.chapter].indexOf(k.subchapter) < 0) throw new Error('kerangka: bab "' + k.subchapter + '" tidak tercantum di Kerangka Course');
    return k;
  }

  return { CATEGORY: CATEGORY, LESSON: LESSON, BAB: BAB, VERBAL: VERBAL, KELUARGA: KELUARGA, NONAKTIF: NONAKTIF, CHAPTER_PN: CHAPTER_PN, klasifikasi: klasifikasi };
});
