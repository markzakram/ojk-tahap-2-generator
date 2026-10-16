/*
 * kamus.js — daftar kata dan nama yang dipakai ulang oleh penyusun butir.
 *
 * Nama orang, perusahaan, dan tempat sengaja rekaan; tidak ada yang merujuk
 * pada lembaga sungguhan sehingga butir tidak cepat basi dan tidak menyinggung.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Kamus = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var NAMA_ORANG = ['Rina', 'Budi', 'Andi', 'Sari', 'Dewi', 'Agus', 'Tono', 'Maya', 'Dimas', 'Lina',
    'Hendra', 'Wulan', 'Fajar', 'Intan', 'Bayu', 'Citra', 'Eko', 'Fitri', 'Gita', 'Hadi',
    'Indra', 'Joko', 'Kirana', 'Lukman', 'Mira', 'Nando', 'Oka', 'Putri', 'Rizky', 'Surya',
    'Tari', 'Umar', 'Vina', 'Wawan', 'Yoga', 'Zahra'];

  var NAMA_INGGRIS = ['Jack', 'Sally', 'Andre', 'James', 'Cheryl', 'Daniel', 'Emma', 'Frank',
    'Grace', 'Henry', 'Irene', 'Kevin', 'Laura', 'Mark', 'Nora', 'Oscar', 'Paula', 'Ryan'];

  var PERUSAHAAN = ['Alfa Teknik', 'Bina Mandiri', 'Cakra Utama', 'Delta Pangan', 'Esa Logistik',
    'Fajar Niaga', 'Garuda Plastik', 'Harapan Jaya', 'Indah Tekstil', 'Jaya Kemasan',
    'Karya Mulia', 'Lestari Boga', 'Mitra Sejahtera', 'Nusa Cetak', 'Prima Otomotif',
    'Sentosa Energi', 'Tunas Agro', 'Utama Kimia'];

  var KOTA = ['Medan', 'Padang', 'Palembang', 'Bandung', 'Semarang', 'Surabaya', 'Denpasar',
    'Makassar', 'Manado', 'Pontianak', 'Balikpapan', 'Malang', 'Yogyakarta', 'Pekanbaru',
    'Banjarmasin', 'Samarinda', 'Jambi', 'Kupang'];

  var KATA_BILANGAN = ['nol', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan',
    'sembilan', 'sepuluh', 'sebelas', 'dua belas'];

  /** Kata bilangan untuk 0..12 (selebihnya angka biasa). */
  function kata(n) { return n >= 0 && n < KATA_BILANGAN.length ? KATA_BILANGAN[n] : String(n); }

  /** Huruf pertama kapital. */
  function kap(s) { s = String(s); return s.charAt(0).toUpperCase() + s.slice(1); }

  return {
    NAMA_ORANG: NAMA_ORANG, NAMA_INGGRIS: NAMA_INGGRIS, PERUSAHAAN: PERUSAHAAN, KOTA: KOTA,
    KATA_BILANGAN: KATA_BILANGAN, kata: kata, kap: kap
  };
});
