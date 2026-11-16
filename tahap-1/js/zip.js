/*
 * zip.js — pembuat arsip ZIP tanpa pustaka luar.
 *
 * Dipakai untuk .docx, .xlsx, dan ZIP paket. Format: header lokal, direktori pusat,
 * EOCD, CRC-32. Isi dimampatkan deflate (metode 8) lewat `Kempis` — zlib bawaan di
 * Node dan CompressionStream di peramban; kalau pemampat tidak ada atau hasilnya
 * tidak lebih kecil (mis. PNG), isi disimpan apa adanya (metode 0).
 *
 * Dua cara pakai:
 *   buat(berkas)        semua anggota ada di memori; hasilnya satu Uint8Array
 *   penulis(sink)       anggota ditambahkan satu per satu dan ditulis ke `sink`
 *                       (mis. berkas di disk) — untuk ZIP paket yang bisa ratusan MB
 *
 * Waktu berkas dipatok tetap (1 Januari 2024) supaya keluaran dapat diulang persis.
 * Nama berkas ditulis UTF-8.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./kempis.js'));
    module.exports = api;
  } else {
    api = factory(root.Kempis);
    root.Zip = api;
  }
})(typeof self !== 'undefined' ? self : this, function (Kempis) {
  'use strict';

  var enc = new TextEncoder();
  var WAKTU = 0, TANGGAL = ((2024 - 1980) << 9) | (1 << 5) | 1;
  var BATAS_UKURAN = 4000000000;      // menyisakan ruang untuk direktori pusat sebelum batas 4 GiB

  function u16(v) { return new Uint8Array([v & 0xFF, (v >>> 8) & 0xFF]); }
  function u32(v) { return new Uint8Array([v & 0xFF, (v >>> 8) & 0xFF, (v >>> 16) & 0xFF, (v >>> 24) & 0xFF]); }

  function gabung(bagian) {
    var jml = 0, i;
    for (i = 0; i < bagian.length; i++) jml += bagian[i].length;
    var out = new Uint8Array(jml), pos = 0;
    for (i = 0; i < bagian.length; i++) { out.set(bagian[i], pos); pos += bagian[i].length; }
    return out;
  }

  /** Siapkan satu anggota: nama, isi (mentah dan terkompresi), CRC. */
  function siapkan(f) {
    var data = f.data instanceof Uint8Array ? f.data : enc.encode(String(f.data));
    var crc = Kempis.crc32(data);
    var tanpa = f.mampat === false || data.length < 64;
    var janji = tanpa ? Promise.resolve(null) : Kempis.deflateMentah(data, 6);
    return janji.then(function (padat) {
      var pakai = padat && padat.length < data.length;
      return { nama: enc.encode(f.nama), panjangAsli: data.length, isi: pakai ? padat : data, metode: pakai ? 8 : 0, crc: crc };
    });
  }

  /**
   * Penulis ZIP bertahap.
   * @param {function(Uint8Array)} sink dipanggil berurutan dengan potongan berkas ZIP
   * @returns {{tambah:function(string, Uint8Array|string, boolean=):Promise, selesai:function():Promise}}
   */
  function penulis(sink) {
    var entri = [], posisi = 0, rantai = Promise.resolve();

    function tulis(u8) { sink(u8); posisi += u8.length; }

    return {
      /** Tambah satu anggota (urutan pemanggilan dijaga). */
      tambah: function (nama, data, mampat) {
        rantai = rantai.then(function () { return siapkan({ nama: nama, data: data, mampat: mampat }); }).then(function (e) {
          // ZIP biasa (tanpa ZIP64): paling banyak 65.535 berkas dan sekitar 4 GB
          if (entri.length >= 65534 || posisi + e.isi.length + e.nama.length + 100 > BATAS_UKURAN) {
            throw new Error('arsip ZIP melewati batas format (65.534 berkas atau sekitar 4 GB); kurangi jumlah paket atau jangan pakai ZIP');
          }
          e.offset = posisi;
          tulis(u32(0x04034B50)); tulis(u16(20)); tulis(u16(0x0800)); tulis(u16(e.metode));
          tulis(u16(WAKTU)); tulis(u16(TANGGAL)); tulis(u32(e.crc));
          tulis(u32(e.isi.length)); tulis(u32(e.panjangAsli));
          tulis(u16(e.nama.length)); tulis(u16(0));
          tulis(e.nama); tulis(e.isi);
          e.ukuranMampat = e.isi.length;
          e.isi = null;                                      // lepaskan memori
          entri.push(e);
        });
        return rantai;
      },
      /** Tulis direktori pusat dan penutup. */
      selesai: function () {
        rantai = rantai.then(function () {
          var awalPusat = posisi;
          entri.forEach(function (e) {
            tulis(u32(0x02014B50)); tulis(u16(20)); tulis(u16(20)); tulis(u16(0x0800)); tulis(u16(e.metode));
            tulis(u16(WAKTU)); tulis(u16(TANGGAL)); tulis(u32(e.crc));
            tulis(u32(e.ukuranMampat)); tulis(u32(e.panjangAsli));
            tulis(u16(e.nama.length)); tulis(u16(0)); tulis(u16(0)); tulis(u16(0)); tulis(u16(0)); tulis(u32(0));
            tulis(u32(e.offset)); tulis(e.nama);
          });
          var ukuranPusat = posisi - awalPusat;
          tulis(u32(0x06054B50)); tulis(u16(0)); tulis(u16(0));
          tulis(u16(entri.length)); tulis(u16(entri.length));
          tulis(u32(ukuranPusat)); tulis(u32(awalPusat)); tulis(u16(0));
        });
        return rantai;
      }
    };
  }

  /**
   * @param {Array<{nama:string, data:Uint8Array|string, mampat?:boolean}>} berkas
   * @returns {Promise<Uint8Array>}
   */
  function buat(berkas) {
    var bagian = [], z = penulis(function (u8) { bagian.push(u8); });
    berkas.forEach(function (f) { z.tambah(f.nama, f.data, f.mampat); });
    return z.selesai().then(function () { return gabung(bagian); });
  }

  return { buat: buat, penulis: penulis, enc: enc };
});
