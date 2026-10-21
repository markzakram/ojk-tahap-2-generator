/*
 * pilihan.js — menyusun pilihan jawaban A-E untuk butir numerik.
 *
 * Masukannya satu nilai kunci dan daftar pengecoh yang SEMUANYA berasal dari
 * jalur kesalahan yang dapat diulang (lupa satu langkah, memakai dasar
 * persentase yang keliru, merata-ratakan tanpa bobot, dst.). Setiap pengecoh
 * membawa alasannya: nama kesalahan beserta hitungannya dengan angka soal,
 * mis. "mengabaikan waktu berhenti: 480 ÷ 7 = 68,57 km/jam". Penyusun lalu:
 *
 *   1. membuang calon tanpa alasan, calon di luar batas, calon yang SAMA dengan
 *      kunci (menurut teks yang tercetak maupun nilainya), dan calon kembar,
 *   2. menempatkan kunci sedekat mungkin dengan posisi yang diminta (supaya
 *      sebaran A-E merata) dengan memilih berapa pengecoh yang lebih kecil dan
 *      lebih besar dari kunci, lalu mengurutkan pilihan menaik — susunan yang
 *      lazim pada soal hitung. Bila posisi itu hanya terjangkau dengan urutan
 *      menurun (mis. semua jalur kesalahan memberi hasil lebih besar, padahal
 *      kunci diminta di E), pilihan diurutkan menurun,
 *   3. mencatat alasan tiap pengecoh untuk pembahasan.
 *
 * Tidak ada lagi pengecoh tambalan berupa angka di sekitar kunci: kalau jalur
 * kesalahan yang sah kurang dari empat, hasilnya null dan pemanggil mengundi
 * butir baru. Kalau posisi yang diminta tidak terjangkau, kunci ditaruh pada
 * posisi terdekat yang terjangkau; perakit paket lalu mencoba benih lain.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Pilihan = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /**
   * @param {object} a pengacak (Rng.alat)
   * @param {object} spec
   *   kunci      nilai benar
   *   fmt        fungsi nilai -> teks pilihan (null = tidak dapat ditulis)
   *   pengecoh   [{ nilai, alasan }] jalur kesalahan, urutan = prioritas
   *   min, maks  batas nilai pilihan yang masuk akal (mis. min: 0)
   *   urut       'naik' (baku), 'turun', atau 'acak'
   *   target     posisi kunci 0..4 yang diinginkan (null = bebas)
   *   bulat      true = semua nilai harus bilangan bulat
   * @returns {{opsi:Array, kunciIndex:number}|null}
   */
  function susun(a, spec) {
    var fmt = spec.fmt, kunci = spec.kunci;
    var teksKunci = fmt(kunci);
    var min = spec.min == null ? -Infinity : spec.min;
    var maks = spec.maks == null ? Infinity : spec.maks;
    var dipakai = {}, calon = [];
    dipakai[teksKunci] = true;

    (spec.pengecoh || []).forEach(function (p) {
      var nilai = p.nilai, alasan = p.alasan;
      if (!alasan || typeof alasan !== 'string') return;
      if (typeof nilai !== 'number' || !isFinite(nilai) || nilai < min || nilai > maks) return;
      if (spec.bulat && Math.abs(nilai - Math.round(nilai)) > 1e-9) return;
      if (Math.abs(nilai - kunci) < 1e-12) return;
      var t = fmt(nilai);
      if (t === null || t === undefined || dipakai[t]) return;
      dipakai[t] = true;
      calon.push({ nilai: nilai, teks: t, alasan: alasan });
    });
    if (calon.length < 4) return null;

    var urut = spec.urut || 'naik';
    var target = spec.target;
    var pilih;

    if (urut === 'naik' || urut === 'turun') {
      var bawah = calon.filter(function (c) { return c.nilai < kunci; });
      var atas = calon.filter(function (c) { return c.nilai > kunci; });
      // banyaknya pengecoh di bawah kunci yang dapat dicapai: [lo, hi]
      var lo = Math.max(0, 4 - atas.length), hi = Math.min(4, bawah.length);
      var ingin;
      if (target == null) {
        // tanpa permintaan: empat pengecoh berprioritas tertinggi
        ingin = calon.slice(0, 4).filter(function (c) { return c.nilai < kunci; }).length;
      } else {
        ingin = urut === 'naik' ? target : 4 - target;
        // posisi yang diminta tidak terjangkau dengan urutan menaik, tetapi terjangkau bila pilihan diurutkan
        // menurun (kunci terkecil/terbesar ditaruh di ujung sebaliknya): pakai urutan menurun
        if (urut === 'naik' && (ingin < lo || ingin > hi) && 4 - target >= lo && 4 - target <= hi) { urut = 'turun'; ingin = 4 - target; }
      }
      ingin = Math.min(hi, Math.max(lo, ingin));
      pilih = bawah.slice(0, ingin).concat(atas.slice(0, 4 - ingin));
    } else {
      pilih = calon.slice(0, 4);
    }
    if (pilih.length < 4) return null;

    var semua = pilih.map(function (c) {
      return { teks: c.teks, nilai: c.nilai, alasan: c.alasan, kunci: false };
    });
    semua.push({ teks: teksKunci, nilai: kunci, alasan: null, kunci: true });

    if (urut === 'naik') semua.sort(function (x, y) { return x.nilai - y.nilai; });
    else if (urut === 'turun') semua.sort(function (x, y) { return y.nilai - x.nilai; });
    else {
      var lain = a.kocok(semua.filter(function (o) { return !o.kunci; }));
      var tg = target == null ? a.bulat(0, 4) : target;
      lain.splice(tg, 0, semua.filter(function (o) { return o.kunci; })[0]);
      semua = lain;
    }
    var idx = -1;
    semua.forEach(function (o, i) { if (o.kunci) idx = i; });
    return { opsi: semua, kunciIndex: idx };
  }

  /**
   * Pilihan berupa daftar teks tetap (mis. bulan, "Tim A".."Tim E", nama orang):
   * kunci pada posisi `target`, pengecoh diambil dari `lain` berurutan.
   */
  function dariDaftar(daftar, indexKunci) {
    return {
      opsi: daftar.map(function (t, i) { return { teks: t, nilai: null, alasan: null, kunci: i === indexKunci }; }),
      kunciIndex: indexKunci
    };
  }

  return { susun: susun, dariDaftar: dariDaftar };
});
