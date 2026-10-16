/*
 * format.js — format angka dan teks gaya Indonesia.
 *
 *   1.234.567,5   titik untuk ribuan, koma untuk desimal
 *   $1.500        simbol mata uang di depan, tanpa spasi (mengikuti naskah riset)
 *   1:7           perbandingan tanpa spasi
 *
 * Hanya dipakai PENYUSUN butir. Validator punya pembaca angka sendiri
 * (`Validator.urai`) supaya pembacaan teks opsi tidak bergantung pada kode
 * yang menuliskannya.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Fmt = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus',
    'September', 'Oktober', 'November', 'Desember'];
  var BULAN_SINGKAT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  var HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
  var HARI_SINGKAT = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

  function gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) { var t = a % b; a = b; b = t; }
    return a;
  }

  /**
   * Angka gaya Indonesia.
   * @param {number} n
   * @param {object} [opsi] { desimal: jumlah maksimum angka di belakang koma (baku 2),
   *                          tetap: true = selalu tampilkan sebanyak `desimal` }
   */
  function angka(n, opsi) {
    opsi = opsi || {};
    var d = opsi.desimal == null ? 2 : opsi.desimal;
    var neg = n < 0;
    var x = Math.abs(n), p = Math.pow(10, d);
    var s = (Math.round(x * p + 1e-7) / p).toFixed(d);
    var bagian = s.split('.');
    var bulat = bagian[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    var desimal = bagian[1] || '';
    if (!opsi.tetap) desimal = desimal.replace(/0+$/, '');
    var hasil = desimal ? bulat + ',' + desimal : bulat;
    if (neg && /[1-9]/.test(hasil)) hasil = '-' + hasil;
    return hasil;
  }

  /** $1.500 / £0,0004 / €75.000. Tanda minus di depan simbol. */
  function uang(n, simbol, desimal, tetap) {
    var neg = n < 0 && Math.round(Math.abs(n) * 1e6) > 0;
    var s = angka(Math.abs(n), { desimal: desimal == null ? 2 : desimal, tetap: !!tetap });
    return (neg ? '-' : '') + (simbol || '$') + s;
  }

  function persen(n, desimal) {
    return angka(n, { desimal: desimal == null ? 1 : desimal }) + '%';
  }

  /** Pecahan paling sederhana: pecahan(6, 8) = "3/4"; pecahan(4, 2) = "2". */
  function pecahan(n, d) {
    if (d < 0) { n = -n; d = -d; }
    var g = gcd(n, d) || 1;
    n /= g; d /= g;
    return d === 1 ? String(n) : n + '/' + d;
  }

  /** Perbandingan paling sederhana, tanpa spasi: "1:7". */
  function banding(a, b) {
    var g = gcd(a, b) || 1;
    return (a / g) + ':' + (b / g);
  }

  /** "A", "A dan B", "A, B, dan C". */
  function daftarKata(daftar) {
    var d = daftar.slice();
    if (d.length <= 1) return d.join('');
    if (d.length === 2) return d[0] + ' dan ' + d[1];
    return d.slice(0, -1).join(', ') + ', dan ' + d[d.length - 1];
  }

  function kapital(s) {
    s = String(s);
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function huruf(i) { return String.fromCharCode(65 + i); }

  /** Bulatkan ke `d` angka desimal (setengah naik) tanpa galat biner. */
  function bulatkan(n, d) {
    d = d || 0;
    var p = Math.pow(10, d);
    var s = n < 0 ? -1 : 1;
    return s * Math.round(Math.abs(n) * p + 1e-7) / p;
  }

  return {
    BULAN: BULAN, BULAN_SINGKAT: BULAN_SINGKAT, HARI: HARI, HARI_SINGKAT: HARI_SINGKAT,
    gcd: gcd, angka: angka, uang: uang, persen: persen, pecahan: pecahan, banding: banding,
    daftarKata: daftarKata, kapital: kapital, huruf: huruf, bulatkan: bulatkan
  };
});
