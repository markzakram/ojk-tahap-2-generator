/*
 * pilihan.js — menyusun pilihan jawaban A-E untuk butir numerik.
 *
 * Masukannya satu nilai kunci dan daftar calon pengecoh yang berasal dari
 * KESALAHAN HITUNG YANG UMUM (lupa satu langkah, memakai dasar yang keliru,
 * selisih satu bulan, dst.), masing-masing dengan alasannya. Penyusun lalu:
 *
 *   1. membuang calon yang SAMA dengan kunci (menurut teks yang tercetak maupun
 *      nilainya) dan calon yang kembar satu sama lain,
 *   2. menambal kekurangan dengan nilai di sekitar kunci bila calon kurang dari
 *      empat,
 *   3. menempatkan kunci pada posisi yang diminta (supaya sebaran A-E merata)
 *      dengan cara memilih berapa pengecoh yang lebih kecil dan lebih besar
 *      dari kunci, lalu mengurutkan pilihan menaik — susunan yang lazim pada
 *      soal hitung,
 *   4. mencatat alasan tiap pengecoh untuk pembahasan.
 *
 * Kalau tidak sanggup menyusun empat pengecoh yang berbeda, hasilnya null dan
 * pemanggil mengundi butir baru.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Pilihan = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /** Besaran langkah untuk menggeser kunci: satu satuan pada angka paling kecil yang tertulis. */
  function langkahDasar(kunci, desimal) {
    var d = desimal == null ? 0 : desimal;
    var kecil = Math.pow(10, -d);
    var mag = Math.abs(kunci);
    if (mag >= 1000) return Math.max(kecil, Math.pow(10, Math.floor(Math.log10(mag)) - 1));
    if (mag >= 100) return Math.max(kecil, 10);
    if (mag >= 20) return Math.max(kecil, 2);
    return Math.max(kecil, 1);
  }

  function selisihTeks(d, spec) {
    var q = spec.desimal == null ? 2 : Math.max(spec.desimal, 0);
    return String(Math.round(d * Math.pow(10, q + 2)) / Math.pow(10, q + 2)).replace('.', ',');
  }

  /**
   * @param {object} a pengacak (Rng.alat)
   * @param {object} spec
   *   kunci      nilai benar
   *   fmt        fungsi nilai -> teks pilihan
   *   pengecoh   [{ nilai, alasan }] calon utama, urutan = prioritas
   *   desimal    jumlah desimal yang tertulis (untuk menambal pengecoh)
   *   min, maks  batas nilai pilihan (mis. min: 0)
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

    function tambah(nilai, alasan, cadangan) {
      if (!isFinite(nilai) || nilai < min || nilai > maks) return;
      if (spec.bulat && Math.abs(nilai - Math.round(nilai)) > 1e-9) return;
      var t = fmt(nilai);
      if (t === null || t === undefined || dipakai[t]) return;
      if (Math.abs(nilai - kunci) < 1e-12) return;
      dipakai[t] = true;
      calon.push({ nilai: nilai, teks: t, alasan: alasan || null, cadangan: !!cadangan });
    }

    (spec.pengecoh || []).forEach(function (p) { tambah(p.nilai, p.alasan, false); });

    // cadangan: nilai di sekitar kunci
    var langkah = spec.langkah || langkahDasar(kunci, spec.desimal);
    var pengali = [0.5, 0.75, 0.8, 0.9, 1.1, 1.2, 1.25, 1.5, 2, 0.6, 1.4, 3];
    var kandidat = [];
    for (var s = 1; s <= 6; s++) { kandidat.push(kunci + s * langkah); kandidat.push(kunci - s * langkah); }
    if (!spec.tanpaPengali) pengali.forEach(function (m) { kandidat.push(kunci * m); });
    a.kocok(kandidat).forEach(function (v) {
      if (spec.desimal != null) v = Math.round(v * Math.pow(10, spec.desimal)) / Math.pow(10, spec.desimal);
      else if (spec.bulat) v = Math.round(v);
      tambah(v, (v < kunci ? 'kurang ' : 'lebih ') + selisihTeks(Math.abs(v - kunci), spec) + ' dari jawaban yang benar: salah hitung pada salah satu langkah penyelesaian', true);
    });

    var utama = calon.filter(function (c) { return !c.cadangan; });
    var cad = calon.filter(function (c) { return c.cadangan; });
    if (utama.length + cad.length < 4) return null;

    var urut = spec.urut || 'naik';
    var target = spec.target;
    var pilih = [];

    if (urut === 'naik' || urut === 'turun') {
      var posisi = target == null ? -1 : (urut === 'naik' ? target : 4 - target);
      var bawahU = utama.filter(function (c) { return c.nilai < kunci; });
      var atasU = utama.filter(function (c) { return c.nilai >= kunci; });
      var bawahC = cad.filter(function (c) { return c.nilai < kunci; });
      var atasC = cad.filter(function (c) { return c.nilai >= kunci; });
      /*
       * Pengecoh dari kesalahan hitung dipakai lebih dulu. Kalau posisi kunci yang
       * diminta tidak bisa dicapai dengannya (mis. semua kesalahan lazim memberi
       * hasil LEBIH BESAR dari kunci, padahal kunci diminta di posisi E), kekurangannya
       * ditambal angka di sekitar kunci pada sisi yang kurang. Pengecoh yang lebih
       * hambar lebih baik daripada sebaran kunci yang berat sebelah.
       */
      var bawahSemua = bawahU.concat(bawahC), atasSemua = atasU.concat(atasC);
      var lo = Math.max(0, 4 - atasSemua.length), hi = Math.min(4, bawahSemua.length);
      if (lo <= hi) {
        var ingin = posisi < 0 ? bawahU.length : posisi;
        ingin = Math.min(hi, Math.max(lo, ingin));
        var utamaBawah = Math.min(ingin, bawahU.length), utamaAtas = Math.min(4 - ingin, atasU.length);
        pilih = bawahU.slice(0, utamaBawah).concat(bawahC.slice(0, ingin - utamaBawah))
          .concat(atasU.slice(0, utamaAtas)).concat(atasC.slice(0, 4 - ingin - utamaAtas));
      }
    } else {
      pilih = utama.concat(cad).slice(0, 4);
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

  return { susun: susun, dariDaftar: dariDaftar, langkahDasar: langkahDasar };
});
