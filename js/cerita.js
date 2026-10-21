/*
 * cerita.js — soal cerita Kemampuan Umum > Numerik.
 *
 * Bentuk soal mengikuti contoh riset (bab 5.1.1 Numerik, soal cerita):
 *
 *   pecahan-sisa     Bilangan dan Perbandingan   pecahan & persen pada sisa zat
 *   persen-naik      Bilangan dan Perbandingan   persentase peningkatan kecepatan
 *   aljabar-berat    Aljabar Dasar               dua persamaan, tiga benda
 *   laju-mesin       Laju dan Waktu              hari balik modal sebuah mesin
 *   laba-majemuk     Aritmatika Keuangan         bulan lunas dengan laba naik tiap bulan
 *   pendapatan       Aritmatika Keuangan         selisih pendapatan tertinggi dan terendah
 *   campuran         Bilangan dan Perbandingan   perbandingan campuran setelah penambahan
 *   diskon           Aritmatika Keuangan         diskon berlapis
 *   kurs             Aritmatika Keuangan         konversi £ / € / $ (dinonaktifkan: soal uang hanya memakai $)
 *   ukur-wadah       Pengukuran dan Konversi     volume wadah -> liter, biaya, dan waktu isi
 *   banding-waktu    Laju dan Waktu              selisih waktu dua pelaku dengan laju berbeda
 *
 * Setiap keluarga menghasilkan SPESIFIKASI (teks, kunci, pengecoh berikut
 * alasannya, langkah hitung, model) yang dirakit `Butir.rakitPg`. Setiap
 * pengecoh berasal dari JALUR KESALAHAN yang dapat diulang (lupa satu langkah,
 * memakai dasar persentase yang keliru, salah faktor konversi, ...) dan
 * alasannya menuliskan hitungan jalur itu dengan angka soal. Kalau jalur yang
 * sah kurang dari empat, butir diundi ulang; tidak ada angka tambalan.
 *
 * Pembahasan mengikuti panduan revisi tim akademik: Diketahui, Ditanyakan,
 * Pengerjaan (rumus umum lalu substitusi selangkah demi selangkah), dan
 * Kesimpulan. Rumus dan hitungan ditulis sebagai baris persamaan "§ ..."
 * (`Rumus.baris`), dicetak Word sebagai Equation; keterangan kata-kata berada di
 * baris biasa. "=" hanya untuk hasil yang tepat, "\approx" untuk hasil yang
 * dibulatkan (validator memeriksa setiap relasi). Semua nominal uang dalam dolar.
 *
 * `model.param` memuat setiap angka yang dipakai (sebagai teks eksak), dan
 * `model.tampil` memuat teks yang TERCETAK di soal untuk tiap angka itu;
 * validator membaca keduanya, menghitung ulang `langkah` dengan pecahan eksak,
 * memastikan angka yang dihitung sama dengan angka yang dibaca peserta, dan
 * bahwa setiap angka yang tercetak memang diperlukan untuk menjawab.
 * `model.konteks` mendaftar angka tercetak yang bukan data (mis. "1" dan
 * "1.000" pada "1 liter = 1.000 cm³") atau yang sengaja tidak diperlukan
 * seperti pada contoh riset.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./rng.js'), require('./format.js'), require('./kamus.js'), require('./butir.js'), require('./rumus.js'));
    module.exports = api;
  } else {
    api = factory(root.Rng, root.Fmt, root.Kamus, root.Butir, root.Rumus);
    root.Cerita = api;
  }
})(typeof self !== 'undefined' ? self : this, function (Rng, Fmt, Kamus, Butir, Rumus) {
  'use strict';

  var K = Kamus;

  // ------------------------------------------------------------- pembahasan

  /** Baris persamaan (notasi LaTeX sederhana, lihat rumus.js). */
  function R(notasi) { return Rumus.baris(notasi); }
  /** Angka pada baris persamaan: titik ribuan, koma desimal "{,}" (1{,}25). */
  function E(v, d, tetap) { return Fmt.angka(v, { desimal: d == null ? 2 : d, tetap: !!tetap }).replace(',', '{,}'); }
  /** Nominal dolar pada baris persamaan: \$1.250 atau \$22{,}50. */
  function ED(v) { return '\\$' + E(v, 2, Math.abs(v - Math.round(v)) > 1e-9); }
  /** Kata atau satuan tegak pada baris persamaan. */
  function T(s) { return '\\text{' + s + '}'; }
  /** Pecahan {n, d} pada baris persamaan. */
  function FR(x) { return x.d === 1 ? String(x.n) : (x.n < 0 ? '-' : '') + '\\frac{' + Math.abs(x.n) + '}{' + x.d + '}'; }
  /** "= v" bila v tepat dengan `d` desimal, "\approx v" bila dibulatkan. */
  function samaE(v, d) { var p = Math.pow(10, d == null ? 2 : d); return (Math.abs(v * p - Math.round(v * p)) < 1e-7 ? '= ' : '\\approx ') + E(v, d); }
  /**
   * Pembahasan soal hitungan: Diketahui, Ditanyakan, Pengerjaan, Kesimpulan. `{HURUF}` diisi huruf
   * kunci oleh Butir setelah pilihan diurutkan.
   */
  function bahas(diketahui, ditanyakan, pengerjaan, kesimpulan) {
    return ['Diketahui'].concat(diketahui, ['Ditanyakan', ditanyakan, 'Pengerjaan'], pengerjaan, ['Kesimpulan', kesimpulan + ' Jawaban: {HURUF}.']);
  }

  // ------------------------------------------------------------- pecahan kecil

  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a; }
  function fr(n, d) {
    if (d < 0) { n = -n; d = -d; }
    var g = gcd(n, d) || 1;
    return { n: n / g, d: d / g };
  }
  function frTambah(x, y) { return fr(x.n * y.d + y.n * x.d, x.d * y.d); }
  function frKurang(x, y) { return fr(x.n * y.d - y.n * x.d, x.d * y.d); }
  function frKali(x, y) { return fr(x.n * y.n, x.d * y.d); }
  function frStr(x) { return x.d === 1 ? String(x.n) : x.n + '/' + x.d; }
  function frVal(x) { return x.n / x.d; }

  /** Nilai desimal -> teks pecahan sederhana (penyebut <= 120); null bila tak ada. */
  function nilaiKePecahan(v) {
    for (var d = 1; d <= 120; d++) {
      var n = Math.round(v * d);
      if (Math.abs(v * d - n) < 1e-9) return frStr(fr(n, d));
    }
    return null;
  }

  function a2(v) { return Fmt.angka(v, { desimal: 2 }); }

  /**
   * Satu pengecoh dari jalur kesalahan: nama kesalahannya, lalu hitungannya dengan
   * angka soal dan hasil yang tercetak sebagai pilihan.
   *   jalur(68.57, 'mengabaikan waktu berhenti', '480 ÷ 7', fm)
   *   -> "mengabaikan waktu berhenti: 480 ÷ 7 = 68,57 km/jam"
   * Nilai yang tidak dapat ditulis (fmt -> null) tidak punya alasan dan dibuang penyusun pilihan.
   */
  function jalur(nilai, salahnya, hitungan, fmt) {
    var t = isFinite(nilai) ? fmt(nilai) : null;
    return { nilai: nilai, alasan: t == null ? null : salahnya + ': ' + hitungan + ' = ' + t };
  }

  /** Keterangan riset untuk ekspor: 'acuan' (mengikuti contoh riset) atau 'pengayaan' (tambahan tim). */
  function riset(spec, kategori, catatan, pola) {
    spec.kategoriRiset = kategori; spec.catatanRiset = catatan;
    if (pola) spec.pola = pola;
    return spec;
  }

  // ===================================================== 1. pecahan sisa zat

  var FRAME_PECAHAN = [
    { zat: 'air', wadah: 'gelas takar', sat: 'cangkir', tujuan: 'adonan' },
    { zat: 'susu', wadah: 'kendi', sat: 'liter', tujuan: 'panci' },
    { zat: 'sirup', wadah: 'botol besar', sat: 'liter', tujuan: 'teko' },
    { zat: 'minyak goreng', wadah: 'jeriken', sat: 'liter', tujuan: 'wajan' },
    { zat: 'tepung', wadah: 'toples', sat: 'kg', tujuan: 'mangkuk adonan' }
  ];

  function pecahanSisa(a, level) {
    var fi = a.bulat(0, FRAME_PECAHAN.length - 1), f = FRAME_PECAHAN[fi], nama = a.pilih(K.NAMA_ORANG);
    var dens = level === 'mudah' ? [2, 4, 8] : (level === 'sedang' ? [3, 4, 6, 8] : [5, 6, 8, 12]);
    var Bs = level === 'mudah' ? [fr(1, 2), fr(1, 4)] : [fr(1, 2), fr(1, 3), fr(1, 4), fr(2, 3), fr(3, 4)];
    var Cs = level === 'mudah' ? [fr(1, 8), fr(1, 16)] : [fr(1, 8), fr(1, 12), fr(1, 16), fr(1, 6), fr(1, 10), fr(1, 24)];
    var Ps = level === 'mudah' ? [25, 50] : [20, 25, 40, 50, 75];
    for (var coba = 0; coba < 300; coba++) {
      var q = a.pilih(dens), p = a.bulat(Math.ceil(q / 2), q - 1);
      var A = fr(p, q), B = a.pilih(Bs), C = a.pilih(Cs), P = a.pilih(Ps);
      var tuang = frKali(A, B), sisa1 = frKurang(A, tuang), sisa2 = frKurang(sisa1, C);
      if (frVal(sisa2) <= 0.05) continue;
      var target = frKali(A, fr(100 + P, 100)), tambah = frKurang(target, sisa2);
      if (frVal(tambah) <= 0 || tambah.d > 48 || tambah.n > 96) continue;
      if (A.d === 1) continue;
      var kunci = frVal(tambah), sat = f.sat;
      var teks = nama + ' mengisi ' + f.wadah + ' dengan ' + frStr(A) + ' ' + sat + ' ' + f.zat + '. Ia menuangkan ' +
        frStr(B) + ' dari ' + f.zat + ' tersebut ke dalam ' + f.tujuan + ', kemudian menumpahkan ' + frStr(C) + ' ' + sat +
        ' ' + f.zat + ' ke lantai.';
      var tanya = 'Berapa banyak ' + f.zat + ' yang harus ditambahkan ke sisa ' + f.zat + ' dalam ' + f.wadah +
        ' agar jumlahnya menjadi ' + P + '% lebih banyak daripada jumlah ' + f.zat + ' mula-mula?';
      var fm = function (v) { var pc = nilaiKePecahan(v); return pc === null ? null : pc + ' ' + sat; };
      var sisaTanpaTuang = frKurang(A, C), sisaB = frKurang(frKurang(A, B), C);
      var pengecoh = [
        jalur(frVal(frKurang(target, sisa1)), 'lupa memperhitungkan ' + f.zat + ' yang tumpah', frStr(target) + ' - ' + frStr(sisa1), fm),
        jalur(frVal(frKurang(target, sisaTanpaTuang)), 'lupa memperhitungkan ' + f.zat + ' yang dituang ke ' + f.tujuan,
          frStr(target) + ' - (' + frStr(A) + ' - ' + frStr(C) + ')', fm),
        jalur(frVal(frKali(sisa2, fr(P, 100))), 'menghitung tambahan ' + P + '% dari sisa, bukan dari jumlah mula-mula', frStr(sisa2) + ' × ' + P + '%', fm),
        jalur(frVal(frKali(A, fr(P, 100))), 'hanya menambahkan ' + P + '% dari jumlah mula-mula tanpa mengganti ' + f.zat + ' yang berkurang', frStr(A) + ' × ' + P + '%', fm),
        jalur(frVal(frKurang(A, sisa2)), 'lupa kenaikan ' + P + '% dan hanya mengembalikan ke jumlah mula-mula', frStr(A) + ' - ' + frStr(sisa2), fm),
        jalur(frVal(sisa2), 'menjawab sisa ' + f.zat + ' saat ini, bukan tambahannya', frStr(A) + ' - ' + frStr(tuang) + ' - ' + frStr(C), fm),
        jalur(frVal(target), 'menjawab jumlah akhir yang diinginkan, bukan tambahannya', frStr(A) + ' × ' + (100 + P) + '%', fm)
      ];
      if (frVal(sisaB) > 0) {
        pengecoh.push(jalur(frVal(frKurang(target, sisaB)), 'menganggap ' + frStr(B) + ' sebagai banyaknya ' + f.zat + ' yang dituang (dalam ' + sat + '), bukan ' + frStr(B) + ' bagiannya',
          frStr(target) + ' - (' + frStr(A) + ' - ' + frStr(B) + ' - ' + frStr(C) + ')', fm));
      }
      var S = '\\ ' + T(sat);
      var pembahasan = bahas([
        'Banyak ' + f.zat + ' mula-mula (a), bagian yang dituang ke ' + f.tujuan + ' (b), banyak ' + f.zat + ' yang tumpah (c), dan kenaikan yang diinginkan (P):',
        R('a = ' + FR(A) + S + ',\\quad b = ' + FR(B) + ',\\quad c = ' + FR(C) + S + ',\\quad P = ' + P + '\\%'),
        'Nilai b adalah bagian dari jumlah mula-mula, bukan banyaknya dalam ' + sat + '.'
      ], 'Banyak ' + f.zat + ' yang harus ditambahkan (x) agar jumlahnya ' + P + '% lebih banyak daripada jumlah mula-mula.', [
        'Banyak ' + f.zat + ' yang dituang adalah b bagian dari jumlah mula-mula:',
        R(T('dituang') + ' = b \\times a = ' + FR(B) + ' \\times ' + FR(A) + ' = ' + FR(tuang) + S),
        'Sisa ' + f.zat + ' di ' + f.wadah + ' setelah dituang dan tumpah:',
        R(T('sisa') + ' = a - ' + T('dituang') + ' - c = ' + FR(A) + ' - ' + FR(tuang) + ' - ' + FR(C) + ' = ' + FR(sisa2) + S),
        P + '% lebih banyak daripada jumlah mula-mula berarti 100% + ' + P + '% = ' + (100 + P) + '% dari a:',
        R(T('target') + ' = ' + (100 + P) + '\\% \\times a = \\frac{' + (100 + P) + '}{100} \\times ' + FR(A) + ' = ' + FR(target) + S),
        'Yang harus ditambahkan adalah selisih jumlah yang diinginkan dan sisa saat ini:',
        R('x = ' + T('target') + ' - ' + T('sisa') + ' = ' + FR(target) + ' - ' + FR(sisa2) + ' = ' + FR(tambah) + S)
      ], 'Jadi, ' + f.zat + ' yang harus ditambahkan adalah ' + frStr(tambah) + ' ' + sat + '.');
      return riset({
        jenisSoal: 'Soal Cerita - Bilangan dan Perbandingan',
        teks: [teks], pertanyaan: tanya,
        kunci: kunci, fmt: fm, pengecoh: pengecoh, min: 0.0001,
        langkah: [
          { nama: 'tuang', rumus: 'a*b' }, { nama: 'sisa1', rumus: 'a-tuang' }, { nama: 'sisa2', rumus: 'sisa1-c' },
          { nama: 'target', rumus: 'a*(1+P%)' }, { nama: 'jawab', rumus: 'target-sisa2' }
        ],
        pembahasan: pembahasan,
        model: {
          param: { a: frStr(A), b: frStr(B), c: frStr(C), P: String(P) },
          tampil: { a: frStr(A), b: frStr(B), c: frStr(C), P: P + '%' }, toleransi: 1e-9
        },
        sidik: { inti: 'pecahan-sisa|' + fi + '|' + frStr(A) + ',' + frStr(B) + ',' + frStr(C) + ',' + P, param: [A.n, A.d, B.n, B.d, C.n, C.d, P], entitas: fi + nama }
      }, 'acuan', 'Mengikuti contoh Numerik Soal 1 (pecahan dan persen pada sisa air).');
    }
    return null;
  }

  // ========================================================= 2. persen naik

  var FRAME_KECEPATAN = [
    { teks: function (n, v0, p1, p2, W, M) {
        return n + ' dapat mengetik ' + v0 + ' kata per menit ketika mulai mengikuti kursus mengetik. ' +
          (p1 ? 'Dua minggu setelah kursus dimulai, kecepatan mengetiknya meningkat ' + p1 + '%. ' : '') +
          (p2 ? 'Pada minggu keempat, kecepatannya naik lagi ' + p2 + '% dari kecepatan semula. ' : '') +
          'Pada akhir kursus, ' + n + ' dapat mengetik seluruh dokumen yang terdiri atas ' + Fmt.angka(W) + ' kata dalam ' + M + ' menit.';
      }, tanya: 'Berapa persentase peningkatan kecepatan mengetiknya dari awal hingga akhir kursus?', unit: 'kata per menit', waktu: 'menit', benda: 'kata', akhir: 'Pada akhir kursus', rentang: 'dari awal hingga akhir kursus' },
    { teks: function (n, v0, p1, p2, W, M) {
        return n + ' merakit ' + v0 + ' unit per jam pada hari pertama bekerja di pabrik. ' +
          (p1 ? 'Setelah tiga hari, kecepatannya naik ' + p1 + '%. ' : '') +
          (p2 ? 'Pada hari ketujuh, kecepatannya naik lagi ' + p2 + '% dari kecepatan semula. ' : '') +
          'Pada akhir masa pelatihan, ' + n + ' menyelesaikan ' + Fmt.angka(W) + ' unit dalam ' + M + ' jam.';
      }, tanya: 'Berapa persentase peningkatan kecepatan merakitnya dari awal hingga akhir masa pelatihan?', unit: 'unit per jam', waktu: 'jam', benda: 'unit', akhir: 'Pada akhir masa pelatihan', rentang: 'dari awal hingga akhir masa pelatihan' },
    { teks: function (n, v0, p1, p2, W, M) {
        return n + ' memindai ' + v0 + ' barang per menit di hari pertama menjadi kasir. ' +
          (p1 ? 'Pada akhir minggu pertama, kecepatannya naik ' + p1 + '%. ' : '') +
          (p2 ? 'Pada akhir minggu kedua, kecepatannya naik lagi ' + p2 + '% dari kecepatan semula. ' : '') +
          'Pada akhir bulan, ' + n + ' memindai ' + Fmt.angka(W) + ' barang dalam ' + M + ' menit.';
      }, tanya: 'Berapa persentase peningkatan kecepatan memindainya dari hari pertama hingga akhir bulan?', unit: 'barang per menit', waktu: 'menit', benda: 'barang', akhir: 'Pada akhir bulan', rentang: 'dari hari pertama hingga akhir bulan' },
    { teks: function (n, v0, p1, p2, W, M) {
        return n + ' mengisi ' + v0 + ' formulir per jam saat baru menjadi operator entri data. ' +
          (p1 ? 'Setelah dua minggu, kecepatannya meningkat ' + p1 + '%. ' : '') +
          (p2 ? 'Setelah empat minggu, kecepatannya meningkat lagi ' + p2 + '% dari kecepatan semula. ' : '') +
          'Pada akhir masa percobaan, ' + n + ' menyelesaikan ' + Fmt.angka(W) + ' formulir dalam ' + M + ' jam.';
      }, tanya: 'Berapa persentase peningkatan kecepatan mengisi formulirnya dari awal hingga akhir masa percobaan?', unit: 'formulir per jam', waktu: 'jam', benda: 'formulir', akhir: 'Pada akhir masa percobaan', rentang: 'dari awal hingga akhir masa percobaan' },
    { teks: function (n, v0, p1, p2, W, M) {
        return n + ' menjahit ' + v0 + ' potong pakaian per jam pada minggu pertama bekerja. ' +
          (p1 ? 'Pada minggu ketiga, kecepatannya meningkat ' + p1 + '%. ' : '') +
          (p2 ? 'Pada minggu kelima, kecepatannya naik lagi ' + p2 + '% dari kecepatan semula. ' : '') +
          'Pada minggu terakhir, ' + n + ' menyelesaikan ' + Fmt.angka(W) + ' potong dalam ' + M + ' jam.';
      }, tanya: 'Berapa persentase peningkatan kecepatan menjahitnya dari minggu pertama hingga minggu terakhir?', unit: 'potong per jam', waktu: 'jam', benda: 'potong', akhir: 'Pada minggu terakhir', rentang: 'dari minggu pertama hingga minggu terakhir' }
  ];

  function persenNaik(a, level) {
    var fi = a.bulat(0, FRAME_KECEPATAN.length - 1), f = FRAME_KECEPATAN[fi], nama = a.pilih(K.NAMA_INGGRIS.concat(K.NAMA_ORANG));
    var Qs = level === 'mudah' ? [10, 20, 25, 50] : (level === 'sedang' ? [5, 10, 15, 20, 25, 30] : [5, 15, 25, 35, 40, 45]);
    var q = a.pilih(Qs);
    var satuan = 100 / gcd(q, 100);
    var v0 = satuan * a.bulat(Math.ceil(30 / satuan), Math.floor(160 / satuan));
    if (v0 < 20) v0 = satuan * Math.ceil(20 / satuan);
    var v1 = v0 * (100 + q) / 100;
    var M = a.pilih([15, 20, 25, 30, 40, 45, 60]);
    var W = v1 * M;
    var p1 = level === 'mudah' ? 0 : a.pilih([2, 3, 4, 5, 6, 8].filter(function (x) { return x < q; }));
    var p2 = level === 'sulit' ? a.pilih([2, 3, 4, 6, 7].filter(function (x) { return x < q && x !== p1; })) : 0;
    if (level !== 'mudah' && !p1) return null;
    if (level === 'sulit' && !p2) return null;
    var teks = f.teks(nama, v0, p1, p2, W, M);
    var fm = function (v) { return Fmt.angka(v, { desimal: 1 }) + '%'; };
    var A = Fmt.angka, sela = v0 * (100 + p1) / 100;
    var pengecoh = [
      jalur(v1 / v0 * 100, 'menjawab kecepatan akhir sebagai persen dari kecepatan awal, padahal yang ditanya kenaikannya', A(v1) + ' ÷ ' + v0 + ' × 100%', fm),
      jalur(v1 - v0, 'menulis selisih kecepatan (' + f.unit + ') sebagai persentase', A(v1) + ' - ' + v0, fm),
      jalur((v1 - v0) / v1 * 100, 'menghitung kenaikan terhadap kecepatan akhir, bukan terhadap kecepatan awal', '(' + A(v1) + ' - ' + v0 + ') ÷ ' + A(v1) + ' × 100%', fm),
      jalur(v0 / v1 * 100, 'membandingkan kecepatan awal dengan kecepatan akhir', v0 + ' ÷ ' + A(v1) + ' × 100%', fm)
    ];
    if (p1) {
      pengecoh.unshift(jalur(p1, 'mengambil kenaikan sementara pada soal sebagai kenaikan dari awal hingga akhir', 'kenaikan sementara yang tertulis', fm));
      pengecoh.splice(2, 0, jalur((v1 - sela) / sela * 100, 'menghitung kenaikan dari kecepatan setelah naik ' + p1 + '%, bukan dari kecepatan awal',
        '(' + A(v1) + ' - ' + A(sela) + ') ÷ ' + A(sela) + ' × 100%', fm));
    }
    if (p2) {
      pengecoh.push(jalur(p1 + p2, 'menjumlahkan kedua kenaikan sementara', p1 + '% + ' + p2 + '%', fm));
      pengecoh.push(jalur(p2, 'mengambil kenaikan kedua pada soal sebagai kenaikan akhir', 'kenaikan kedua yang tertulis', fm));
    }
    if (Math.abs(W / v0 - Math.round(W / v0)) < 1e-9) {
      pengecoh.push(jalur(W / v0 - M, 'membandingkan waktu, bukan kecepatan: selisih ' + f.waktu + ' bila memakai kecepatan awal ditulis sebagai persen',
        A(W) + ' ÷ ' + v0 + ' - ' + M, fm));
    }
    var langkah = [{ nama: 'akhir', rumus: 'W/M' }, { nama: 'jawab', rumus: '(akhir-v0)/v0*100' }];
    var U = '\\ ' + T(f.unit), sementara = p1 + (p2 ? '% dan ' + p2 : '') + '%';
    var kerja = [
      'Kecepatan akhir = banyak ' + f.benda + ' yang diselesaikan dibagi lama pengerjaannya:',
      R('v_{' + T('akhir') + '} = \\frac{' + E(W) + '}{' + M + '} = ' + E(v1) + U),
      'Persentase kenaikan selalu dihitung terhadap kecepatan awal, yaitu ' + v0 + ' ' + f.unit + ':',
      R(T('kenaikan') + ' = \\frac{v_{' + T('akhir') + '} - v_{' + T('awal') + '}}{v_{' + T('awal') + '}} \\times 100\\%'),
      R(T('kenaikan') + ' = \\frac{' + E(v1) + ' - ' + v0 + '}{' + v0 + '} \\times 100\\% = \\frac{' + E(v1 - v0) + '}{' + v0 + '} \\times 100\\% = ' + q + '\\%')
    ];
    if (p1) kerja.push('Kenaikan ' + sementara + ' sebelum akhir hanya keadaan sementara. Yang ditanyakan adalah perubahan ' + f.rentang + ', jadi angka itu tidak dipakai.');
    var pembahasan = bahas([
      'Kecepatan awal: ' + v0 + ' ' + f.unit + '.',
      f.akhir + ': ' + A(W) + ' ' + f.benda + ' diselesaikan dalam ' + M + ' ' + f.waktu + '.'
    ].concat(p1 ? ['Kenaikan sementara yang disebut di soal: ' + sementara + '.'] : []),
    'Persentase peningkatan kecepatan ' + f.rentang + '.', kerja,
    'Jadi, kecepatannya meningkat ' + q + '% ' + f.rentang + '.');
    var tampil = { v0: String(v0), W: A(W), M: String(M) };
    var param = { v0: String(v0), W: String(W), M: String(M) };
    var konteks = [];
    if (p1) konteks.push(p1 + '%');
    if (p2) konteks.push(p2 + '%');
    return riset({
      jenisSoal: 'Soal Cerita - Bilangan dan Perbandingan',
      teks: [teks], pertanyaan: f.tanya,
      kunci: q, fmt: fm, pengecoh: pengecoh, min: 0.5, maks: 250,
      langkah: langkah, pembahasan: pembahasan,
      model: { param: param, tampil: tampil, toleransi: 1e-9, konteks: konteks },
      sidik: { inti: 'persen-naik|' + fi + '|' + v0 + ',' + q + ',' + M + ',' + p1 + ',' + p2, param: [v0, q, M, p1, p2], entitas: fi + nama }
    }, 'acuan', 'Mengikuti contoh Numerik Soal 2; kenaikan sementara yang tidak diperlukan sengaja dipertahankan seperti pada contoh.');
  }

  // ====================================================== 3. aljabar berat

  var FRAME_BERAT = [
    { A: 'karung gandum', B: 'karung jagung', C: 'karung oat', sat: 'pon' },
    { A: 'peti apel', B: 'peti jeruk', C: 'peti mangga', sat: 'kg' },
    { A: 'kardus buku', B: 'kardus majalah', C: 'kardus kamus', sat: 'kg' },
    { A: 'tas pasir', B: 'tas semen', C: 'tas kerikil', sat: 'kg' },
    { A: 'kotak baut', B: 'kotak mur', C: 'kotak paku', sat: 'ons' }
  ];

  /**
   * Persamaan pertama disederhanakan menjadi persamaan antara g, j, dan o; informasi
   * kedua memberi bs·j + cs·o = S dan j. Seperti contoh riset (Soal 3), o harus dicari
   * lebih dulu lalu j dan o disubstitusikan: koefisien j tidak boleh hilang setelah o
   * diganti (S - bs·j)/cs, sehingga berat B benar-benar diperlukan. Tingkat mudah
   * memakai persamaan g dan o saja (j tercoret), sedang/sulit memakai ketiganya.
   */
  function aljabarBerat(a, level) {
    var fi = a.bulat(0, FRAME_BERAT.length - 1), f = FRAME_BERAT[fi];
    var maks = level === 'mudah' ? 8 : (level === 'sedang' ? 10 : 14);
    for (var coba = 0; coba < 4000; coba++) {
      var g = a.bulat(2, maks), j = a.bulat(2, maks), o = a.bulat(2, maks);
      if (g === j || g === o) continue;
      var da = a.bulat(-4, 4), db = level === 'mudah' ? 0 : a.bulat(-4, 4), dc = a.bulat(-4, 4);
      if (da === 0 || dc === 0 || (level !== 'mudah' && db === 0)) continue;
      if (da * g + db * j + dc * o !== 0) continue;
      var ka2 = a.bulat(0, 3), kb2 = a.bulat(0, 3), kc2 = a.bulat(0, 3);
      var ka1 = ka2 + da, kb1 = kb2 + db, kc1 = kc2 + dc;
      if (ka1 < 0 || kb1 < 0 || kc1 < 0 || ka1 + kb1 + kc1 === 0 || ka2 + kb2 + kc2 === 0) continue;
      if (ka1 > 5 || kb1 > 5 || kc1 > 5) continue;
      var bs = a.bulat(1, 3), cs = a.bulat(1, 2);
      if (db * cs === dc * bs) continue;            // j akan tercoret: berat B tidak diperlukan
      var S = bs * j + cs * o;
      var suku = function (k, sim) { return (k === 1 ? '' : k) + sim; };
      var ruas = function (x, y, z) {
        var bagian = [];
        if (x) bagian.push(Kamus.kata(x) + ' ' + f.A);
        if (y) bagian.push(Kamus.kata(y) + ' ' + f.B);
        if (z) bagian.push(Kamus.kata(z) + ' ' + f.C);
        return Fmt.daftarKata(bagian);
      };
      var teks1 = Kamus.kap(ruas(ka1, kb1, kc1)) + ' memiliki berat yang sama dengan ' + ruas(ka2, kb2, kc2) + '.';
      var teks2 = 'Jika ' + Kamus.kata(bs) + ' ' + f.B + ' dan ' + Kamus.kata(cs) + ' ' + f.C + ' memiliki berat ' + S + ' ' + f.sat +
        ', sedangkan satu ' + f.B + ' memiliki berat ' + j + ' ' + f.sat + ', berapa berat satu ' + f.A + '?';

      // persamaan setelah suku yang sama dicoret: sisi positif = sisi negatif
      var term = [[da, 'g'], [db, 'j'], [dc, 'o']].filter(function (t) { return t[0] !== 0; });
      var pos = term.filter(function (t) { return t[0] > 0; });
      var neg = term.filter(function (t) { return t[0] < 0; }).map(function (t) { return [-t[0], t[1]]; });
      var kiriTeks = pos.map(function (t) { return suku(t[0], t[1]); }).join(' + ');
      var kananTeks = neg.map(function (t) { return suku(t[0], t[1]); }).join(' + ');
      var sisiG = pos.some(function (t) { return t[1] === 'g'; }) ? pos : neg;
      var sisiLain = sisiG === pos ? neg : pos;
      var gSisa = sisiG.filter(function (t) { return t[1] !== 'g'; });
      var koefG = sisiG.filter(function (t) { return t[1] === 'g'; })[0][0];
      var nilaiSuku = function (daftar, v) { return daftar.reduce(function (s, t) { return s + t[0] * v[t[1]]; }, 0); };
      var teksSuku = function (daftar, v) { return daftar.map(function (t) { return t[0] === 1 ? Fmt.angka(v[t[1]]) : t[0] + ' × ' + Fmt.angka(v[t[1]]); }).join(' + '); };
      /** g dari nilai j dan o tertentu menurut persamaan yang sudah disederhanakan (tanda +1 = salah tanda). */
      var gDari = function (jj, oo, tandaSisa) {
        var v = { j: jj, o: oo }, lain = nilaiSuku(sisiLain, v), sisa = nilaiSuku(gSisa, v), tanda = tandaSisa || -1;
        var isi = teksSuku(sisiLain, v) + (gSisa.length ? (tanda < 0 ? ' - ' : ' + ') + (gSisa.length > 1 ? '(' + teksSuku(gSisa, v) + ')' : teksSuku(gSisa, v)) : '');
        var tunggal = /^[d.,]+$/.test(isi);
        return { nilai: (lain + tanda * sisa) / koefG, teks: koefG === 1 ? isi : (tunggal ? isi : '(' + isi + ')') + ' ÷ ' + koefG, isi: isi };
      };
      var fm = function (v) { return Fmt.angka(v) + ' ' + f.sat; };
      var oTeks = function (tanda, b, c) { var t = S + tanda + (b === 1 ? '' : b + ' × ') + j; return c === 1 ? t : '(' + t + ') ÷ ' + c; };
      var benar = gDari(j, o);
      if (Math.abs(benar.nilai - g) > 1e-9) continue;
      var pengecoh = [
        jalur(o, 'menjawab berat satu ' + f.C + ', bukan berat satu ' + f.A, 'o = ' + oTeks(' - ', bs, cs), fm),
        jalur(j, 'menjawab berat satu ' + f.B + ' yang sudah tertulis pada soal, bukan berat satu ' + f.A, 'j', fm)
      ];
      if (gSisa.length) {
        var tanda = gDari(j, o, 1);
        pengecoh.push(jalur(tanda.nilai, 'salah tanda saat memindahkan suku ke ruas lain', 'g = ' + tanda.teks, fm));
      }
      if (koefG > 1) pengecoh.push(jalur(koefG * g, 'lupa membagi dengan ' + koefG + ' pada ' + koefG + 'g', koefG + 'g = ' + benar.isi, fm));
      if (bs > 1 && (S - j) / cs > 0) {
        var o1 = (S - j) / cs, g1 = gDari(j, o1);
        pengecoh.push(jalur(g1.nilai, 'mengurangkan berat satu ' + f.B + ' saja dari ' + S + ' (seharusnya ' + bs + ' × ' + j + ')',
          'o = ' + oTeks(' - ', 1, cs) + ' = ' + Fmt.angka(o1) + ', lalu g = ' + g1.teks, fm));
      }
      if (cs > 1) {
        var o2 = S - bs * j, g2 = gDari(j, o2);
        pengecoh.push(jalur(g2.nilai, 'lupa membagi dengan ' + cs + ' saat mencari o', 'o = ' + oTeks(' - ', bs, 1) + ' = ' + o2 + ', lalu g = ' + g2.teks, fm));
      }
      var o3 = (S + bs * j) / cs, g3 = gDari(j, o3);
      pengecoh.push(jalur(g3.nilai, 'menjumlahkan, bukan mengurangkan, berat ' + f.B + ' pada informasi kedua',
        'o = ' + oTeks(' + ', bs, cs) + ' = ' + Fmt.angka(o3) + ', lalu g = ' + g3.teks, fm));
      if (level !== 'mudah') {
        var g4 = gDari(o, j);
        pengecoh.push(jalur(g4.nilai, 'tertukar memasukkan berat ' + f.B + ' dan ' + f.C, 'j = ' + o + ' dan o = ' + j + ', lalu g = ' + g4.teks, fm));
      }
      if (ka2 > 0 && ka1 > 0) {
        var kanan5 = kb2 * j + kc2 * o, kiri5 = kb1 * j + kc1 * o;
        pengecoh.push(jalur((kanan5 - kiri5) / ka1, 'mengabaikan ' + f.A + ' di ruas kanan persamaan pertama',
          'g = ' + (kiri5 === 0 ? kanan5 + (ka1 > 1 ? ' ÷ ' + ka1 : '') : (ka1 > 1 ? '(' + kanan5 + ' - ' + kiri5 + ') ÷ ' + ka1 : kanan5 + ' - ' + kiri5)), fm));
      }
      var tulis = function (x, y, z) {
        return [[x, 'g'], [y, 'j'], [z, 'o']].filter(function (t) { return t[0]; }).map(function (t) { return suku(t[0], t[1]); }).join(' + ');
      };
      var adaJ = term.some(function (t) { return t[1] === 'j'; });
      // suku dengan angka dimasukkan; g tetap sebagai variabel bila `gTetap`
      var nilaiV = { g: g, j: j, o: o }, Ssat = '\\ ' + T(f.sat);
      var angkaE = function (arr, gTetap) {
        return arr.map(function (t) { return t[1] === 'g' && gTetap ? suku(t[0], 'g') : (t[0] === 1 ? '' : t[0] + ' \\times ') + nilaiV[t[1]]; }).join(' + ');
      };
      var trio = function (x, y, z) { return [[x, 'g'], [y, 'j'], [z, 'o']].filter(function (t) { return t[0]; }); };
      var kerja = [];
      if (Math.min(ka1, ka2) + Math.min(kb1, kb2) + Math.min(kc1, kc2) > 0) {
        kerja.push('Kurangkan suku yang sama dari kedua ruas persamaan pertama sehingga setiap benda hanya ada di satu ruas:');
        kerja.push(R(kiriTeks + ' = ' + kananTeks));
      }
      kerja.push('Cari o dari informasi kedua dengan memasukkan j = ' + j + ':');
      kerja.push(R((bs === 1 ? '' : bs + ' \\times ') + j + ' + ' + suku(cs, 'o') + ' = ' + S));
      kerja.push(R(suku(cs, 'o') + ' = ' + S + ' - ' + (bs * j) + ' = ' + (cs * o) + (cs === 1 ? Ssat : '')));
      if (cs > 1) kerja.push(R('o = \\frac{' + (cs * o) + '}{' + cs + '} = ' + o + Ssat));
      kerja.push('Substitusikan ' + (adaJ ? 'j = ' + j + ' dan ' : '') + 'o = ' + o + ' ke persamaan yang sudah disederhanakan:');
      kerja.push(R(angkaE(pos, true) + ' = ' + angkaE(neg, true)));
      var lainE = angkaE(sisiLain), sisaE = gSisa.length ? angkaE(gSisa) : '';
      var ruasG = lainE + (sisaE ? ' - ' + (gSisa.length > 1 ? '(' + sisaE + ')' : sisaE) : '');
      kerja.push(R(suku(koefG, 'g') + ' = ' + ruasG + ' = ' + (koefG * g) + (koefG === 1 ? Ssat : '')));
      if (koefG > 1) kerja.push(R('g = \\frac{' + (koefG * g) + '}{' + koefG + '} = ' + g + Ssat));
      kerja.push('Periksa dengan memasukkan ketiga berat ke persamaan pertama:');
      kerja.push(R(T('ruas kiri') + ' = ' + angkaE(trio(ka1, kb1, kc1)) + ' = ' + (ka1 * g + kb1 * j + kc1 * o) + Ssat));
      kerja.push(R(T('ruas kanan') + ' = ' + angkaE(trio(ka2, kb2, kc2)) + ' = ' + (ka2 * g + kb2 * j + kc2 * o) + Ssat));
      var pembahasan = bahas([
        'Misalkan berat satu ' + f.A + ' = g, satu ' + f.B + ' = j, dan satu ' + f.C + ' = o (dalam ' + f.sat + ').',
        'Persamaan pertama (berat kedua ruas sama):',
        R(tulis(ka1, kb1, kc1) + ' = ' + tulis(ka2, kb2, kc2)),
        'Informasi kedua:',
        R(suku(bs, 'j') + ' + ' + suku(cs, 'o') + ' = ' + S + Ssat + ',\\quad j = ' + j + Ssat)
      ], 'Berat satu ' + f.A + ', yaitu g.', kerja, 'Jadi, berat satu ' + f.A + ' adalah ' + g + ' ' + f.sat + '.');
      return riset({
        jenisSoal: 'Soal Cerita - Aljabar Dasar',
        teks: [teks1], pertanyaan: teks2,
        kunci: g, fmt: fm, pengecoh: pengecoh, min: 1, bulat: true,
        langkah: [
          { nama: 'o', rumus: '(S-bs*j)/cs' }, { nama: 'jawab', rumus: '-((b1-b2)*j+(c1-c2)*o)/(a1-a2)' },
          { nama: 'kiri', rumus: 'a1*jawab+b1*j+c1*o' }, { nama: 'kanan', rumus: 'a2*jawab+b2*j+c2*o' }
        ],
        pembahasan: pembahasan,
        model: {
          param: { a1: String(ka1), b1: String(kb1), c1: String(kc1), a2: String(ka2), b2: String(kb2), c2: String(kc2), bs: String(bs), cs: String(cs), S: String(S), j: String(j) },
          tampil: { S: String(S), j: String(j) }, toleransi: 1e-9, seimbang: ['kiri', 'kanan'],
          kata: { a1: ka1, b1: kb1, c1: kc1, a2: ka2, b2: kb2, c2: kc2, bs: bs, cs: cs }
        },
        sidik: { inti: 'aljabar-berat|' + fi + '|' + [ka1, kb1, kc1, ka2, kb2, kc2, bs, cs, S, j].join(','), param: [ka1, kb1, kc1, ka2, kb2, kc2, bs, cs, S, j], entitas: String(fi) }
      }, 'acuan', 'Mengikuti contoh Numerik Soal 3: satu berat dicari dari informasi kedua lalu disubstitusikan; setiap angka pada soal diperlukan.');
    }
    return null;
  }

  // ======================================================== 4. laju mesin

  // Semua nominal dalam dolar (panduan revisi: soal uang hanya memakai $).
  var FRAME_MESIN = [
    { mesin: 'mesin pembuat peralatan makan plastik', barang: 'peralatan makan', wadah: 'kotak', sim: '$' },
    { mesin: 'mesin pengemas biskuit', barang: 'bungkus biskuit', wadah: 'dus', sim: '$' },
    { mesin: 'mesin pencetak botol minum', barang: 'botol', wadah: 'karton', sim: '$' },
    { mesin: 'mesin pembuat pensil', barang: 'pensil', wadah: 'pak', sim: '$' },
    { mesin: 'mesin penjahit sarung tangan', barang: 'pasang sarung tangan', wadah: 'kemasan', sim: '$' }
  ];

  function lajuMesin(a, level) {
    var fi = a.bulat(0, FRAME_MESIN.length - 1), f = FRAME_MESIN[fi], nama = a.pilih(K.NAMA_INGGRIS);
    for (var coba = 0; coba < 400; coba++) {
      var jam = a.pilih([1, 2, 4, 5]), per = a.pilih([100, 200, 250, 300, 400, 500]);
      var N = per * jam;                                    // N barang dalam `jam` jam
      var laju = N / jam;                                   // barang per jam
      var H = a.pilih(level === 'mudah' ? [10, 20, 24] : [8, 10, 12, 16, 20, 24]);
      var isi = a.pilih([10, 20, 25, 40, 50, 100]);         // barang per wadah
      var harga = a.pilih([2, 2.5, 3, 4, 5, 6]);
      var pendapatan = laju * H / isi * harga;              // per hari
      var hari = a.pilih(level === 'mudah' ? [2, 4, 5, 10] : [2.5, 4, 5, 7.5, 10, 12.5, 15]);
      var C = hari * pendapatan;
      if (Math.abs(C - Math.round(C)) > 1e-9 || C < 1000 || C > 400000) continue;
      if (pendapatan < 100) continue;
      var teks = nama + ' mempertimbangkan untuk membeli ' + f.mesin + ' baru. Mesin tersebut menghasilkan ' + Fmt.angka(N) + ' ' +
        f.barang + ' dalam ' + Kamus.kata(jam) + ' jam. Satu ' + f.wadah + ' berisi ' + isi + ' buah dan dijual seharga ' + Fmt.uang(harga, f.sim, 2, true) + '.';
      var tanya = 'Jika harga mesin ' + Fmt.uang(C, f.sim, 0) + ' dan mesin beroperasi selama ' + H + ' jam sehari, berapa hari yang diperlukan agar hasil penjualan ' +
        f.barang + ' cukup untuk menutup harga mesin?';
      var fm = function (v) { return Fmt.angka(v, { desimal: 1 }) + ' hari'; };
      var A = Fmt.angka, U = function (v) { return Fmt.uang(v, f.sim, 2, true); }, Cs = Fmt.uang(C, f.sim, 0);
      var pengecoh = [
        jalur(C / (laju * H * harga), 'menganggap harga ' + U(harga) + ' berlaku untuk satu buah, bukan satu ' + f.wadah,
          Cs + ' ÷ (' + A(laju) + ' × ' + H + ' × ' + U(harga) + ')', fm),
        jalur(C / (N / isi * harga), 'memakai hasil ' + Kamus.kata(jam) + ' jam sebagai hasil satu hari',
          Cs + ' ÷ (' + A(N) + ' ÷ ' + isi + ' × ' + U(harga) + ')', fm),
        jalur(C / (laju * H / isi), 'lupa mengalikan dengan harga jual per ' + f.wadah,
          Cs + ' ÷ (' + A(laju) + ' × ' + H + ' ÷ ' + isi + ')', fm),
        jalur(C / (laju / isi * harga), 'menghitung waktu dalam jam (memakai pendapatan per jam) lalu menuliskannya sebagai hari',
          Cs + ' ÷ (' + A(laju) + ' ÷ ' + isi + ' × ' + U(harga) + ')', fm)
      ];
      if (jam > 1) {
        pengecoh.splice(1, 0, jalur(C / (N * H / isi * harga), 'lupa membagi dengan ' + Kamus.kata(jam) + ' jam: menganggap ' + A(N) + ' ' + f.barang + ' dihasilkan setiap jam',
          Cs + ' ÷ (' + A(N) + ' × ' + H + ' ÷ ' + isi + ' × ' + U(harga) + ')', fm));
      }
      if (H !== 24) {
        pengecoh.push(jalur(C / (laju * 24 / isi * harga), 'memakai 24 jam sehari, padahal mesin beroperasi ' + H + ' jam sehari',
          Cs + ' ÷ (' + A(laju) + ' × 24 ÷ ' + isi + ' × ' + U(harga) + ')', fm));
      }
      if (Math.abs(hari - Math.round(hari)) > 1e-9) {
        pengecoh.push(jalur(Math.ceil(hari), 'membulatkan ke atas menjadi hari penuh, padahal pertanyaannya tidak meminta pembulatan',
          A(hari, { desimal: 1 }) + ' dibulatkan ke atas', fm));
      }
      var kerja = [];
      if (jam > 1) {
        kerja.push('Laju produksi per jam = banyak ' + f.barang + ' dibagi lama produksinya:');
        kerja.push(R(T('laju') + ' = \\frac{' + E(N) + '}{' + jam + '} = ' + E(laju) + '\\ ' + T(f.barang + ' per jam')));
      }
      kerja.push('Dalam sehari mesin bekerja ' + H + ' jam, jadi produksi harian:');
      kerja.push(R(T('produksi harian') + ' = ' + E(laju) + ' \\times ' + H + ' = ' + E(laju * H) + '\\ ' + T(f.barang)));
      kerja.push('Setiap ' + isi + ' buah dikemas menjadi satu ' + f.wadah + ':');
      kerja.push(R(T(f.wadah + ' per hari') + ' = \\frac{' + E(laju * H) + '}{' + isi + '} = ' + E(laju * H / isi)));
      kerja.push('Pendapatan harian = banyak ' + f.wadah + ' per hari × harga satu ' + f.wadah + ':');
      kerja.push(R(T('pendapatan harian') + ' = ' + E(laju * H / isi) + ' \\times ' + ED(harga) + ' = ' + ED(pendapatan)));
      kerja.push('Lama balik modal = harga mesin dibagi pendapatan harian:');
      kerja.push(R(T('lama') + ' = \\frac{' + ED(C) + '}{' + ED(pendapatan) + '} = ' + E(hari, 1) + '\\ ' + T('hari')));
      var pembahasan = bahas([
        'Mesin menghasilkan ' + A(N) + ' ' + f.barang + ' dalam ' + jam + ' jam dan beroperasi ' + H + ' jam sehari.',
        'Satu ' + f.wadah + ' berisi ' + isi + ' buah dan dijual ' + U(harga) + '; harga mesin ' + Cs + '.'
      ], 'Banyak hari sampai hasil penjualan ' + f.barang + ' cukup untuk menutup harga mesin.', kerja,
      'Jadi, hasil penjualan cukup untuk menutup harga mesin dalam ' + fm(hari) + '.');
      return riset({
        jenisSoal: 'Soal Cerita - Laju dan Waktu',
        teks: [teks], pertanyaan: tanya,
        kunci: hari, fmt: fm, pengecoh: pengecoh, min: 0.1, maks: 2000,
        langkah: [
          { nama: 'laju', rumus: 'N/jam' }, { nama: 'harian', rumus: 'laju*H' }, { nama: 'wadahHari', rumus: 'harian/isi' },
          { nama: 'pendapatan', rumus: 'wadahHari*harga' }, { nama: 'jawab', rumus: 'C/pendapatan' }
        ],
        pembahasan: pembahasan,
        model: {
          param: { N: String(N), jam: String(jam), isi: String(isi), harga: String(harga), C: String(C), H: String(H) },
          tampil: { N: A(N), isi: String(isi), harga: A(harga, { desimal: 2, tetap: true }), C: A(C), H: String(H) }, toleransi: 0.05
        },
        sidik: { inti: 'laju-mesin|' + fi + '|' + [N, jam, isi, harga, C, H].join(','), param: [N, jam, isi, harga, C, H], entitas: fi + nama }
      }, 'acuan', 'Mengikuti contoh Numerik Soal 4 (laju produksi dan waktu balik modal).');
    }
    return null;
  }

  // ===================================================== 5. laba majemuk

  var FRAME_LABA = [
    { barang: 'mesin', sim: '$' }, { barang: 'truk pengangkut', sim: '$' },
    { barang: 'peralatan dapur industri', sim: '$' }, { barang: 'printer cetak besar', sim: '$' }
  ];

  /** Bulan pertama (0 = bulan pembelian) saat jumlah deret `laba(t)` mencapai `batas`; t = 99 bila tidak dalam 40 bulan. */
  function bulanCapai(laba, batas) {
    var s = 0;
    for (var t = 0; t < 40; t++) { s += laba(t); if (s >= batas) return { t: t, jumlah: s }; }
    return { t: 99, jumlah: s };
  }

  /**
   * Seperti contoh riset Soal 5, ditambah uang muka yang dibayar tunai pada bulan
   * pembelian. Uang muka membuat jalur kesalahan "total yang keliru" menjadi wajar
   * (lupa mengurangkan uang muka, atau menghitungnya dua kali), sehingga setiap bulan
   * pada pilihan berasal dari satu jalur kesalahan. Semua bulan pilihan jatuh pada
   * atau sesudah bulan pembelian dalam tahun yang sama, diurutkan menurut waktu.
   */
  function labaMajemuk(a, level, opsi) {
    var fi = a.bulat(0, FRAME_LABA.length - 1), f = FRAME_LABA[fi], pt = a.pilih(K.PERUSAHAAN);
    var target = opsi && opsi.target != null ? opsi.target : null;
    for (var coba = 0; coba < 600; coba++) {
      var P0 = a.kelipatan(5000, 12000, level === 'mudah' ? 1000 : 1);
      var g = level === 'mudah' ? a.pilih([5, 10]) : (level === 'sedang' ? a.pilih([3, 4, 5, 6, 8]) : a.pilih([2, 3, 4, 5, 6]));
      var k = level === 'mudah' ? a.bulat(3, 6) : (level === 'sedang' ? a.bulat(4, 6) : a.bulat(5, 7));               // bulan ke-k (1 = bulan pembelian) sisa harga lunas
      var naik = function (t) { return P0 * Math.pow(1 + g / 100, t); };
      var kum = [], tot = 0;
      for (var i = 0; i < 12; i++) { tot += naik(i); kum.push(tot); }
      var lo = kum[k - 2], hi = kum[k - 1];
      var sisa = Math.round((lo + (hi - lo) * a.antara(0.3, 0.7)) / 500) * 500;
      if (!(sisa > lo + 100 && sisa < hi - 100)) continue;
      var DP = Math.round(P0 * a.antara(1.5, 3) / 500) * 500, C = sisa + DP;
      var Kb = k - 1;
      // jalur kesalahan -> bulan (selisih dari bulan pembelian) beserta keterangannya
      var jlr = [];
      jlr.push({ t: Kb + 1, alasan: function (B, m0) { return 'menambahkan lama pelunasan pada bulan pembelian: pelunasan butuh ' + k + ' bulan, lalu ' + B(m0) + ' + ' + k + ' bulan = ' + B(m0 + k); } });
      jlr.push({ t: Kb - 1, alasan: function (B, m0, U) { return 'berhenti pada bulan terakhir yang laba terkumpulnya masih kurang: sampai ' + B(m0 + Kb - 1) + ' laba terkumpul ' + U(kum[Kb - 1]) + ' < ' + U(sisa); } });
      var w1 = bulanCapai(naik, C);
      jlr.push({ t: w1.t, alasan: function (B, m0, U) { return 'lupa mengurangkan uang muka, sehingga laba dipakai untuk menutup harga penuh: sampai ' + B(m0 + w1.t) + ' laba terkumpul ' + U(w1.jumlah) + ' ≥ ' + U(C); } });
      var batas2 = sisa - DP, w2 = batas2 <= 0 ? { t: 0, jumlah: P0 } : bulanCapai(naik, batas2);
      jlr.push({ t: w2.t, alasan: function (B, m0, U) { return 'menghitung uang muka dua kali (sudah dikurangkan dari harga, lalu ditambahkan lagi ke laba terkumpul): sampai ' + B(m0 + w2.t) + ' ' + U(DP) + ' + ' + U(w2.jumlah) + ' ≥ ' + U(sisa); } });
      var nTetap = Math.ceil(sisa / P0 - 1e-9);
      jlr.push({ t: nTetap - 1, alasan: function (B, m0, U) { return 'lupa kenaikan ' + g + '% per bulan: ' + U(sisa) + ' ÷ ' + U(P0) + ' = ' + Fmt.angka(sisa / P0, { desimal: 2 }) + ', dibulatkan ke atas ' + nTetap + ' bulan, yaitu sampai ' + B(m0 + nTetap - 1); } });
      var turun = bulanCapai(function (t) { return P0 * Math.pow(1 - g / 100, t); }, sisa);
      jlr.push({ t: turun.t, alasan: function (B, m0, U) { return 'menganggap laba turun ' + g + '% setiap bulan: laba terkumpul baru ' + U(turun.jumlah) + ' ≥ ' + U(sisa) + ' pada ' + B(m0 + turun.t); } });
      var sederhana = bulanCapai(function (t) { return P0 * (1 + t * g / 100); }, sisa);
      jlr.push({ t: sederhana.t, alasan: function (B, m0, U) { return 'menghitung kenaikan ' + g + '% selalu dari laba bulan pembelian, bukan dari laba bulan sebelumnya: laba terkumpul ' + U(sederhana.jumlah) + ' ≥ ' + U(sisa) + ' pada ' + B(m0 + sederhana.t); } });
      // ambang yang terlalu dekat dengan jumlah laba membuat bulan jalur itu meragukan: lewati
      var ragu = [C, batas2, sisa].some(function (b) { return kum.some(function (x) { return Math.abs(x - b) < 1; }); });
      if (ragu) continue;
      var lihat = {}, awal = [], akhir = [];
      jlr.forEach(function (x) {
        if (x.t === Kb || x.t < 0 || x.t > 11 || lihat[x.t]) return;
        lihat[x.t] = true;
        (x.t < Kb ? awal : akhir).push(x);
      });
      if (awal.length + akhir.length < 4) continue;
      var loP = Math.max(0, 4 - akhir.length), hiP = Math.min(4, awal.length);
      var ingin = Math.min(hiP, Math.max(loP, target == null ? 1 : target));
      var dipilih = awal.slice(0, ingin).concat(akhir.slice(0, 4 - ingin));
      var tMaks = Math.max(Kb, Math.max.apply(null, dipilih.map(function (x) { return x.t; })));
      var m0 = a.bulat(0, 11 - tMaks);                                // semua pilihan dalam tahun yang sama
      var B = function (idx) { return Fmt.BULAN[idx]; };
      var U = function (v) { return Fmt.uang(v, f.sim, Math.abs(v - Math.round(v)) < 1e-9 ? 0 : 2, true); }, U0 = function (v) { return Fmt.uang(v, f.sim, 0); };
      var teks = 'Perusahaan ' + pt + ' membeli ' + f.barang + ' baru pada bulan ' + B(m0) + ' seharga ' + U0(C) + '. Uang muka sebesar ' + U0(DP) +
        ' dibayar tunai pada bulan ' + B(m0) + ', dan sisanya dilunasi dengan laba perusahaan mulai bulan ' + B(m0) + '. Laba pada bulan ' + B(m0) + ' adalah ' + U0(P0) + '.';
      var tanya = 'Jika laba setiap bulan meningkat ' + g + '% dibandingkan bulan sebelumnya, pada bulan apa harga ' + f.barang + ' akan lunas seluruhnya?';
      var opsiBulan = dipilih.map(function (x) { return { t: x.t, teks: B(m0 + x.t), nilai: m0 + x.t, alasan: x.alasan(B, m0, U), kunci: false }; });
      opsiBulan.push({ t: Kb, teks: B(m0 + Kb), nilai: m0 + Kb, alasan: null, kunci: true });
      opsiBulan.sort(function (x, y) { return x.t - y.t; });
      var kunciIndex = opsiBulan.map(function (o) { return o.kunci; }).indexOf(true);
      // laba tiap bulan dibulatkan ke sen (ditandai \approx); laba terkumpul menjumlahkan angka yang tercetak,
      // jadi setiap baris dapat diperiksa. Ambang yang terlalu dekat sudah dilewati (`ragu`), sehingga
      // pembulatan sen tidak mengubah bulan lunas.
      var fE = E(1 + g / 100, 2), terkumpul = 0, barisBulan = [];
      for (var t2 = 0; t2 < k; t2++) {
        var labaT = Math.round(naik(t2) * 100) / 100, lama = terkumpul;
        terkumpul = Math.round((terkumpul + labaT) * 100) / 100;
        // tepat sen bila P0 × (100 + g)^t habis dibagi 100^(t - 1) (dihitung eksak)
        var tepatSen = (BigInt(P0) * BigInt(100 + g) ** BigInt(t2) * BigInt(100)) % BigInt(100) ** BigInt(t2) === BigInt(0);
        var labaE = 'L_{' + T(B(m0 + t2)) + '} = ' + ED(P0) + (t2 ? ' \\times (' + fE + ')^{' + t2 + '} ' + (tepatSen ? '= ' : '\\approx ') + ED(labaT) : '');
        var kumE = T('terkumpul') + ' = ' + (t2 ? ED(lama) + ' + ' + ED(labaT) + ' = ' : '') + ED(terkumpul) + (t2 === k - 1 ? ' \\ge ' : ' < ') + ED(sisa);
        barisBulan.push(R(labaE + ' \\quad ' + kumE));
      }
      var pembahasan = bahas([
        'Harga ' + f.barang + ' = ' + U0(C) + ', uang muka = ' + U0(DP) + ' (dibayar tunai pada bulan ' + B(m0) + ').',
        'Laba bulan ' + B(m0) + ' = ' + U0(P0) + '; laba setiap bulan naik ' + g + '% dari laba bulan sebelumnya. Laba dipakai melunasi sisa harga mulai bulan ' + B(m0) + '.'
      ], 'Bulan ketika harga ' + f.barang + ' lunas seluruhnya.', [
        'Uang muka sudah dibayar tunai, jadi yang dilunasi dengan laba hanya sisanya:',
        R(T('sisa') + ' = ' + ED(C) + ' - ' + ED(DP) + ' = ' + ED(sisa)),
        'Naik ' + g + '% dari bulan sebelumnya berarti laba dikali 100% + ' + g + '% = ' + Fmt.angka(1 + g / 100, { desimal: 2 }) + ' setiap bulan. Laba n bulan setelah ' + B(m0) + ':',
        R('L_{n} = ' + ED(P0) + ' \\times (1 + ' + g + '\\%)^{n} = ' + ED(P0) + ' \\times (' + fE + ')^{n}'),
        'Laba tiap bulan (dibulatkan ke sen) dan laba yang terkumpul sampai akhir bulan itu, dibandingkan dengan sisa harga ' + U0(sisa) + ':'
      ].concat(barisBulan),
      'Laba terkumpul pertama kali mencapai ' + U0(sisa) + ' pada akhir bulan ' + B(m0 + Kb) + '. Jadi, harga ' + f.barang + ' lunas seluruhnya pada bulan ' + B(m0 + Kb) + '.');
      return riset({
        jenisSoal: 'Soal Cerita - Aritmatika Keuangan',
        teks: [teks], pertanyaan: tanya, tulisKunci: true,
        pilihanJadi: { opsi: opsiBulan, kunciIndex: kunciIndex },
        langkah: [],
        pembahasan: pembahasan,
        model: {
          param: { P0: String(P0), g: String(g), C: String(C), DP: String(DP), m0: String(m0) },
          tampil: { P0: Fmt.angka(P0), g: g + '%', C: Fmt.angka(C), DP: Fmt.angka(DP) }, jenisHitung: 'lunas-bulan'
        },
        sidik: { inti: 'laba-majemuk|' + fi + '|' + [P0, g, C, DP, m0].join(','), param: [P0, g, C, DP, m0], entitas: fi + pt }
      }, 'acuan', 'Mengikuti contoh Numerik Soal 5; uang muka ditambahkan agar setiap bulan pilihan berasal dari jalur kesalahan yang dapat diulang.');
    }
    return null;
  }

  // ====================================================== 6. pendapatan

  var FRAME_JUAL = [
    { produk: ['Produk A', 'Produk B'], sim: '$', per: 'satu minggu' },
    { produk: ['Paket Basic', 'Paket Premium'], sim: '$', per: 'satu minggu' },
    { produk: ['Model X', 'Model Y'], sim: '$', per: 'satu bulan' },
    { produk: ['Seri Lite', 'Seri Pro'], sim: '$', per: 'satu pekan' }
  ];

  function pendapatan(a, level) {
    var fi = a.bulat(0, FRAME_JUAL.length - 1), f = FRAME_JUAL[fi];
    var nama = a.ambil(K.NAMA_INGGRIS, 3);
    for (var coba = 0; coba < 300; coba++) {
      var hA = a.pilih([22.5, 25, 30.25, 35.75, 40, 45.5, 28.75]), hB = a.pilih([30, 36.5, 42.25, 48, 52.75, 55]);
      if (Math.abs(hA - hB) < 4) continue;
      var u = nama.map(function () { return [a.bulat(8, 30), a.bulat(8, 30)]; });
      var tot = u.map(function (x) { return x[0] * hA + x[1] * hB; });
      var urut = tot.slice().sort(function (x, y) { return x - y; });
      if (urut[0] === urut[1] || urut[1] === urut[2]) continue;
      var kunci = urut[2] - urut[0];
      if (kunci < 20 || kunci > 400) continue;
      var kalimat = nama.map(function (n, i) {
        return n + ' dapat menjual ' + u[i][0] + ' unit ' + f.produk[0] + ' dan ' + u[i][1] + ' unit ' + f.produk[1];
      });
      var teks = 'Dalam ' + f.per + ', ' + kalimat[0] + ', ' + kalimat[1] + ', sedangkan ' + kalimat[2] + '.';
      var tanya = 'Jika harga setiap unit ' + f.produk[0] + ' adalah ' + Fmt.uang(hA, f.sim, 2, true) + ' dan setiap unit ' + f.produk[1] + ' adalah ' +
        Fmt.uang(hB, f.sim, 2, true) + ', berapa selisih pendapatan penjualan antara penjual dengan pendapatan tertinggi dan penjual dengan pendapatan terendah?';
      var idx = tot.map(function (v, i) { return i; }).sort(function (x, y) { return tot[x] - tot[y]; });
      var iT = idx[2], iM = idx[1], iR = idx[0];
      // penjual tertinggi dan terendah harus berbeda pada kedua produk; kalau tidak, salah satu harga tidak memengaruhi selisihnya
      if (u[iT][0] === u[iR][0] || u[iT][1] === u[iR][1]) continue;
      var fm = function (v) { return Fmt.uang(v, f.sim, 2, true); };
      var maksMin = function (arr) { var s = arr.slice().sort(function (x, y) { return x - y; }); return { maks: s[s.length - 1], min: s[0] }; };
      var pengecoh = [
        jalur(urut[2] - urut[1], 'membandingkan pendapatan tertinggi dengan yang menengah (' + nama[iM] + '), bukan dengan yang terendah', fm(urut[2]) + ' - ' + fm(urut[1]), fm),
        jalur(urut[1] - urut[0], 'membandingkan pendapatan menengah (' + nama[iM] + ') dengan yang terendah', fm(urut[1]) + ' - ' + fm(urut[0]), fm)
      ];
      var unit = u.map(function (x) { return x[0] + x[1]; });
      var uMaks = unit.indexOf(Math.max.apply(null, unit)), uMin = unit.indexOf(Math.min.apply(null, unit));
      if (unit.filter(function (x) { return x === unit[uMaks]; }).length === 1 && unit.filter(function (x) { return x === unit[uMin]; }).length === 1 && !(uMaks === iT && uMin === iR)) {
        var besar = Math.max(tot[uMaks], tot[uMin]), kecil = Math.min(tot[uMaks], tot[uMin]);
        pengecoh.push(jalur(besar - kecil, 'menentukan penjual tertinggi dan terendah dari banyaknya unit terjual (' + nama[uMaks] + ' ' + unit[uMaks] + ' unit, ' + nama[uMin] + ' ' + unit[uMin] + ' unit)',
          fm(besar) + ' - ' + fm(kecil), fm));
      }
      var tukar = maksMin(u.map(function (x) { return x[0] * hB + x[1] * hA; }));
      pengecoh.push(jalur(tukar.maks - tukar.min, 'tertukar memakai harga: ' + f.produk[0] + ' dihitung ' + fm(hB) + ' dan ' + f.produk[1] + ' dihitung ' + fm(hA), fm(tukar.maks) + ' - ' + fm(tukar.min), fm));
      var sA = maksMin(u.map(function (x) { return x[0] * hA; })), sB = maksMin(u.map(function (x) { return x[1] * hB; }));
      pengecoh.push(jalur(sA.maks - sA.min, 'hanya menghitung pendapatan ' + f.produk[0], fm(sA.maks) + ' - ' + fm(sA.min), fm));
      pengecoh.push(jalur(sB.maks - sB.min, 'hanya menghitung pendapatan ' + f.produk[1], fm(sB.maks) + ' - ' + fm(sB.min), fm));
      var dA = Math.abs(u[iT][0] - u[iR][0]), dB = Math.abs(u[iT][1] - u[iR][1]);
      pengecoh.push(jalur(dA * hA + dB * hB, 'menjumlahkan selisih unit kedua produk tanpa memperhatikan arah selisihnya', dA + ' × ' + fm(hA) + ' + ' + dB + ' × ' + fm(hB), fm));
      pengecoh.push(jalur(urut[2] + urut[0], 'menjumlahkan pendapatan tertinggi dan terendah, bukan mengurangkannya', fm(urut[2]) + ' + ' + fm(urut[0]), fm));
      var kerja = ['Pendapatan satu penjual = unit ' + f.produk[0] + ' × harga ' + f.produk[0] + ' + unit ' + f.produk[1] + ' × harga ' + f.produk[1] + ':']
        .concat(nama.map(function (n, i) {
          return R(T(n) + ' = ' + u[i][0] + ' \\times ' + ED(hA) + ' + ' + u[i][1] + ' \\times ' + ED(hB) + ' = ' + ED(u[i][0] * hA) + ' + ' + ED(u[i][1] * hB) + ' = ' + ED(tot[i]));
        }))
        .concat(['Pendapatan tertinggi milik ' + nama[iT] + ' (' + fm(tot[iT]) + ') dan terendah milik ' + nama[iR] + ' (' + fm(tot[iR]) + '):',
          R(T('selisih') + ' = ' + ED(urut[2]) + ' - ' + ED(urut[0]) + ' = ' + ED(kunci))]);
      var pembahasan = bahas([
        'Harga ' + f.produk[0] + ' = ' + fm(hA) + ' per unit; harga ' + f.produk[1] + ' = ' + fm(hB) + ' per unit.',
        'Unit terjual dalam ' + f.per + ': ' + nama.map(function (n, i) { return n + ' ' + u[i][0] + ' ' + f.produk[0] + ' dan ' + u[i][1] + ' ' + f.produk[1]; }).join('; ') + '.'
      ], 'Selisih pendapatan penjual dengan pendapatan tertinggi dan penjual dengan pendapatan terendah.', kerja,
      'Jadi, selisih pendapatan tertinggi dan terendah adalah ' + fm(kunci) + '.');
      var param = { hA: String(hA), hB: String(hB) };
      var tampil = { hA: Fmt.angka(hA, { desimal: 2, tetap: true }), hB: Fmt.angka(hB, { desimal: 2, tetap: true }) };
      u.forEach(function (x, i) {
        param['a' + i] = String(x[0]); param['b' + i] = String(x[1]);
        tampil['a' + i] = String(x[0]); tampil['b' + i] = String(x[1]);
      });
      return riset({
        jenisSoal: 'Soal Cerita - Aritmatika Keuangan',
        teks: [teks], pertanyaan: tanya,
        kunci: kunci, fmt: fm, pengecoh: pengecoh, min: 1,
        langkah: [
          { nama: 't0', rumus: 'a0*hA+b0*hB' }, { nama: 't1', rumus: 'a1*hA+b1*hB' }, { nama: 't2', rumus: 'a2*hA+b2*hB' },
          { nama: 'jawab', rumus: 'maks(t0,t1,t2)-min(t0,t1,t2)' }
        ],
        pembahasan: pembahasan,
        model: { param: param, tampil: tampil, toleransi: 0.005 },
        sidik: { inti: 'pendapatan|' + fi + '|' + [hA, hB].concat(u.reduce(function (s, x) { return s.concat(x); }, [])).join(','), param: [hA, hB].concat(u.reduce(function (s, x) { return s.concat(x); }, [])), entitas: fi + nama.join('') }
      }, 'acuan', 'Mengikuti contoh Numerik Soal 6 (selisih pendapatan tertinggi dan terendah).');
    }
    return null;
  }

  // ===================================================== 7. campuran

  var FRAME_CAMPUR = [
    { a: 'cat merah', b: 'cat putih', zat: 'cat', sat: 'liter' },
    { a: 'beras premium', b: 'beras medium', zat: 'campuran beras', sat: 'kg' },
    { a: 'sirup', b: 'air', zat: 'larutan sirup', sat: 'liter' },
    { a: 'kopi arabika', b: 'kopi robusta', zat: 'campuran kopi', sat: 'kg' }
  ];

  function campuran(a, level) {
    var fi = a.bulat(0, FRAME_CAMPUR.length - 1), f = FRAME_CAMPUR[fi];
    for (var coba = 0; coba < 800; coba++) {
      var ra = a.bulat(1, 5), rb = a.bulat(1, 6), k = a.bulat(2, level === 'mudah' ? 6 : 12);
      if (ra === rb || gcd(ra, rb) !== 1) continue;
      var cc = a.bulat(1, 6), dd = a.bulat(1, 7);
      if (gcd(cc, dd) !== 1) continue;
      // ra*k : (rb*k + x) = cc : dd  ->  dd*ra*k = cc*(rb*k + x)
      var xx = (dd * ra * k - cc * rb * k) / cc;
      if (!(xx > 0) || Math.abs(xx - Math.round(xx)) > 1e-9 || xx > 60) continue;
      if (ra * k > 80 || rb * k > 80) continue;
      var Rb = ra * k, Wb = rb * k;
      var teks = Kamus.kap(f.zat) + ' terdiri dari ' + f.a + ' dan ' + f.b + ' dengan perbandingan ' + ra + ':' + rb + '. Setelah ditambahkan ' + xx + ' ' + f.sat +
        ' ' + f.b + ', perbandingan ' + f.a + ' terhadap ' + f.b + ' menjadi ' + cc + ':' + dd + '.';
      var tanya = 'Berapa ' + f.sat + ' ' + f.a + ' dalam campuran?';
      var ks = function (c) { return (c === 1 ? '' : c) + 'k'; };       // koefisien 1 tidak ditulis
      var sisaK = dd * ra - cc * rb;
      var fm = function (v) { return Fmt.angka(v) + ' ' + f.sat; }, A = Fmt.angka;
      var pengecoh = [
        jalur(Wb, 'menjawab banyaknya ' + f.b + ' semula, bukan ' + f.a, rb + ' × ' + k, fm),
        jalur(Wb + xx, 'menjawab banyaknya ' + f.b + ' setelah penambahan', rb + ' × ' + k + ' + ' + xx, fm),
        jalur(Rb + Wb, 'menjawab seluruh campuran semula', '(' + ra + ' + ' + rb + ') × ' + k, fm),
        jalur(k, 'berhenti pada nilai satu bagian perbandingan, belum dikali ' + ra, 'k = ' + (sisaK === 1 ? cc * xx : (cc * xx) + ' ÷ ' + sisaK), fm)
      ];
      var bagiA = cc * rb - dd * ra;
      if (bagiA > 0) {
        var k1 = dd * xx / bagiA;
        pengecoh.push(jalur(ra * k1, 'menambahkan ' + xx + ' ' + f.sat + ' ke ' + f.a + ', bukan ke ' + f.b,
          '(' + ks(ra) + ' + ' + xx + ') : ' + ks(rb) + ' = ' + cc + ' : ' + dd + ' memberi k = ' + A(k1) + ', lalu ' + ra + ' × ' + A(k1), fm));
      }
      if (cc > 1) {
        var k2 = xx / sisaK;
        pengecoh.push(jalur(ra * k2, 'lupa mengalikan ' + xx + ' dengan ' + cc + ' saat kali silang', ks(sisaK) + ' = ' + xx + ' memberi k = ' + A(k2) + ', lalu ' + ra + ' × ' + A(k2), fm));
      }
      pengecoh.push(jalur(cc * xx / dd, 'menerapkan perbandingan baru antara ' + f.a + ' dan ' + f.b + ' yang ditambahkan saja', cc + ' × ' + xx + ' ÷ ' + dd, fm));
      pengecoh.push(jalur(xx, 'menjawab banyaknya ' + f.b + ' yang ditambahkan', 'tambahan ' + f.b, fm));
      var Ssat = '\\ ' + T(f.sat), kerja = [
        'Karena perbandingannya ' + ra + ' : ' + rb + ', misalkan ' + f.a + ' = ' + ks(ra) + ' dan ' + f.b + ' = ' + ks(rb) + ', dengan k banyaknya satu bagian perbandingan (dalam ' + f.sat + ').',
        'Setelah penambahan, ' + f.a + ' tetap, sedangkan ' + f.b + ' bertambah ' + xx + ' ' + f.sat + ':',
        R('\\frac{' + ks(ra) + '}{' + ks(rb) + ' + ' + xx + '} = \\frac{' + cc + '}{' + dd + '}'),
        'Kalikan silang:',
        R(dd + ' \\times ' + ks(ra) + ' = ' + cc + ' \\times (' + ks(rb) + ' + ' + xx + ')'),
        R(ks(dd * ra) + ' = ' + ks(cc * rb) + ' + ' + (cc * xx)),
        R(ks(dd * ra) + ' - ' + ks(cc * rb) + ' = ' + (cc * xx)),
        R(sisaK === 1 ? 'k = ' + (cc * xx) : ks(sisaK) + ' = ' + (cc * xx))
      ];
      if (sisaK !== 1) kerja.push(R('k = \\frac{' + (cc * xx) + '}{' + sisaK + '} = ' + k));
      kerja.push('Banyak ' + f.a + ' adalah ' + ra + ' bagian:');
      kerja.push(R(T(f.a) + ' = ' + ks(ra) + ' = ' + ra + ' \\times ' + k + ' = ' + Rb + Ssat));
      kerja.push('Periksa: ' + f.b + ' semula ' + rb + ' × ' + k + ' = ' + Wb + ' ' + f.sat + ', setelah ditambah menjadi ' + (Wb + xx) + ' ' + f.sat + ':');
      kerja.push(R('\\frac{' + Rb + '}{' + (Wb + xx) + '} = \\frac{' + cc + '}{' + dd + '}'));
      var pembahasan = bahas([
        'Perbandingan ' + f.a + ' dan ' + f.b + ' mula-mula ' + ra + ' : ' + rb + '.',
        'Ditambahkan ' + xx + ' ' + f.sat + ' ' + f.b + ', lalu perbandingannya menjadi ' + cc + ' : ' + dd + '.'
      ], 'Banyak ' + f.a + ' dalam campuran (dalam ' + f.sat + ').', kerja,
      'Jadi, banyak ' + f.a + ' dalam campuran adalah ' + Rb + ' ' + f.sat + '.');
      return riset({
        jenisSoal: 'Soal Cerita - Bilangan dan Perbandingan',
        teks: [teks], pertanyaan: tanya,
        kunci: Rb, fmt: fm, pengecoh: pengecoh, min: 1, bulat: true,
        langkah: [
          { nama: 'k', rumus: 'cc*x/(dd*ra-cc*rb)' }, { nama: 'jawab', rumus: 'ra*k' },
          { nama: 'kiri', rumus: 'ra*k*dd' }, { nama: 'kanan', rumus: 'cc*(rb*k+x)' }
        ],
        pembahasan: pembahasan,
        model: {
          param: { ra: String(ra), rb: String(rb), cc: String(cc), dd: String(dd), x: String(xx) },
          tampil: { x: String(xx) }, toleransi: 1e-9, seimbang: ['kiri', 'kanan'],
          rasioTampil: [ra + ':' + rb, cc + ':' + dd]
        },
        sidik: { inti: 'campuran|' + fi + '|' + [ra, rb, cc, dd, xx].join(','), param: [ra, rb, cc, dd, xx], entitas: String(fi) }
      }, 'pengayaan', 'Tambahan tim: perbandingan campuran sebelum dan sesudah penambahan.');
    }
    return null;
  }

  // ======================================================= 8. diskon

  // Harga awal dalam dolar per jenis barang (rentang editorial untuk soal rekaan, bukan harga pasar).
  var FRAME_DISKON = [
    { barang: 'laptop', sim: '$', harga: [500, 2400] }, { barang: 'mesin kopi', sim: '$', harga: [200, 1200] },
    { barang: 'jaket musim dingin', sim: '$', harga: [150, 600] }, { barang: 'sepeda lipat', sim: '$', harga: [300, 1800] },
    { barang: 'televisi', sim: '$', harga: [300, 2400] }, { barang: 'printer kantor', sim: '$', harga: [200, 1500] },
    { barang: 'kamera digital', sim: '$', harga: [300, 2000] }, { barang: 'mantel wol', sim: '$', harga: [150, 700] },
    { barang: 'ponsel pintar', sim: '$', harga: [300, 1500] }, { barang: 'lemari es', sim: '$', harga: [500, 2400] },
    { barang: 'koper kabin', sim: '$', harga: [150, 600] }, { barang: 'jam tangan', sim: '$', harga: [150, 1500] },
    { barang: 'pengeras suara nirkabel', sim: '$', harga: [150, 800] }
  ];

  function diskon(a, level) {
    var fi = a.bulat(0, FRAME_DISKON.length - 1), f = FRAME_DISKON[fi];
    for (var coba = 0; coba < 400; coba++) {
      var H = a.kelipatan(f.harga[0], f.harga[1], 50);
      var d1 = a.pilih([10, 15, 20, 25, 30, 35, 40]), d2 = a.pilih([5, 10, 15, 20, 25, 30]);
      var pajak = level === 'sulit' ? a.pilih([5, 10]) : 0;
      var H1 = H * (100 - d1) / 100;
      var akhirDiskon = H1 * (100 - d2) / 100;
      var akhir = akhirDiskon * (100 + pajak) / 100;
      if (Math.abs(akhir * 100 - Math.round(akhir * 100)) > 1e-6) continue;
      var tanyaHemat = level === 'sedang' && a.untung(0.5);
      var teks = 'Harga sebuah ' + f.barang + ' adalah ' + Fmt.uang(H, f.sim, 0) + '. Toko memberi diskon ' + d1 + '%, lalu diskon tambahan ' + d2 +
        '% dari harga setelah diskon pertama.' + (pajak ? ' Setelah itu, pembeli membayar pajak ' + pajak + '% dari harga setelah semua diskon.' : '');
      var tanya = tanyaHemat ? 'Berapa total penghematan yang diperoleh pembeli dibandingkan harga awal?' : 'Berapa harga yang harus dibayar pembeli?';
      var kunci = tanyaHemat ? H - akhirDiskon : akhir;
      var fm = function (v) { return Fmt.uang(v, f.sim, 2, true); };
      var kaliPajak = pajak ? ' × ' + (100 + pajak) + '%' : '', fp = (100 + pajak) / 100;
      var D1 = H * d1 / 100;
      var pengecoh = tanyaHemat ? [
        jalur(H * (d1 + d2) / 100, 'menjumlahkan kedua diskon (' + (d1 + d2) + '%) lalu menghitungnya dari harga awal', (d1 + d2) + '% × ' + fm(H), fm),
        jalur(akhirDiskon, 'menjawab harga yang dibayar, bukan penghematannya', fm(H) + ' × ' + (100 - d1) + '% × ' + (100 - d2) + '%', fm),
        jalur(D1, 'hanya menghitung diskon pertama', d1 + '% × ' + fm(H), fm),
        jalur(H1 * d2 / 100, 'hanya menghitung diskon tambahan', d2 + '% × ' + fm(H1), fm),
        jalur(D1 + D1 * d2 / 100, 'menghitung diskon tambahan ' + d2 + '% dari besar diskon pertama, bukan dari harga setelah diskon', fm(D1) + ' + ' + d2 + '% × ' + fm(D1), fm),
        jalur(H * d2 / 100, 'menghitung diskon tambahan dari harga awal dan melupakan diskon pertama', d2 + '% × ' + fm(H), fm)
      ] : [
        jalur(H * (100 - d1 - d2) / 100 * fp, 'menjumlahkan kedua diskon (' + (d1 + d2) + '%) lalu menghitungnya dari harga awal', fm(H) + ' × ' + (100 - d1 - d2) + '%' + kaliPajak, fm),
        jalur(H1 * fp, 'hanya memakai diskon pertama', fm(H) + ' × ' + (100 - d1) + '%' + kaliPajak, fm),
        jalur(H * (100 - d2) / 100 * fp, 'hanya memakai diskon kedua', fm(H) + ' × ' + (100 - d2) + '%' + kaliPajak, fm),
        jalur((H - D1 - D1 * d2 / 100) * fp, 'menghitung diskon tambahan ' + d2 + '% dari besar diskon pertama, bukan dari harga setelah diskon',
          '(' + fm(H) + ' - ' + fm(D1) + ' - ' + d2 + '% × ' + fm(D1) + ')' + kaliPajak, fm),
        jalur(H - akhirDiskon, 'menjawab besar potongan harga, bukan harga yang dibayar', fm(H) + ' - ' + fm(akhirDiskon), fm)
      ];
      if (pajak) {
        pengecoh.splice(2, 0, jalur(akhirDiskon + H * pajak / 100, 'menghitung pajak dari harga awal, bukan dari harga setelah diskon', fm(akhirDiskon) + ' + ' + pajak + '% × ' + fm(H), fm));
        pengecoh.push(jalur(akhirDiskon, 'lupa menambahkan pajak', fm(H) + ' × ' + (100 - d1) + '% × ' + (100 - d2) + '%', fm));
        pengecoh.push(jalur(H * (100 - d1 - d2 + pajak) / 100, 'menggabungkan diskon dan pajak menjadi satu persentase dari harga awal',
          fm(H) + ' × (100% - ' + d1 + '% - ' + d2 + '% + ' + pajak + '%)', fm));
      }
      var kerja = [
        'Diskon ' + d1 + '% berarti pembeli membayar 100% - ' + d1 + '% = ' + (100 - d1) + '% dari harga awal:',
        R('H_{1} = ' + ED(H) + ' \\times (100\\% - ' + d1 + '\\%) = ' + ED(H) + ' \\times ' + (100 - d1) + '\\% = ' + ED(H1)),
        'Diskon tambahan ' + d2 + '% dihitung dari harga setelah diskon pertama, bukan dari harga awal:',
        R('H_{2} = ' + ED(H1) + ' \\times (100\\% - ' + d2 + '\\%) = ' + ED(H1) + ' \\times ' + (100 - d2) + '\\% = ' + ED(akhirDiskon))
      ];
      if (pajak && !tanyaHemat) {
        kerja.push('Pajak ' + pajak + '% dihitung dari harga setelah semua diskon, jadi harga dikali 100% + ' + pajak + '% = ' + (100 + pajak) + '%:');
        kerja.push(R(T('dibayar') + ' = ' + ED(akhirDiskon) + ' \\times (100\\% + ' + pajak + '\\%) = ' + ED(akhirDiskon) + ' \\times ' + (100 + pajak) + '\\% = ' + ED(akhir)));
      }
      if (tanyaHemat) {
        kerja.push('Penghematan = harga awal - harga setelah kedua diskon:');
        kerja.push(R(T('penghematan') + ' = ' + ED(H) + ' - ' + ED(akhirDiskon) + ' = ' + ED(kunci)));
      }
      var pembahasan = bahas([
        'Harga awal ' + f.barang + ' = ' + Fmt.uang(H, '$', 0) + '.',
        'Diskon pertama ' + d1 + '%; diskon tambahan ' + d2 + '% dari harga setelah diskon pertama.'
      ].concat(pajak ? ['Pajak ' + pajak + '% dari harga setelah semua diskon.'] : []),
      tanyaHemat ? 'Total penghematan dibandingkan harga awal.' : 'Harga yang harus dibayar pembeli' + (pajak ? ', termasuk pajak.' : '.'), kerja,
      tanyaHemat ? 'Jadi, total penghematan pembeli adalah ' + fm(kunci) + '.' : 'Jadi, harga yang harus dibayar pembeli adalah ' + fm(kunci) + '.');
      return riset({
        jenisSoal: 'Soal Cerita - Aritmatika Keuangan',
        teks: [teks], pertanyaan: tanya,
        kunci: kunci, fmt: fm, pengecoh: pengecoh, min: 1,
        langkah: [
          { nama: 's1', rumus: 'H*(100-d1)/100' }, { nama: 's2', rumus: 's1*(100-d2)/100' },
          { nama: 'bayar', rumus: 's2*(100+pajak)/100' },
          { nama: 'jawab', rumus: tanyaHemat ? 'H-s2' : 'bayar' }
        ],
        pembahasan: pembahasan,
        model: {
          param: { H: String(H), d1: String(d1), d2: String(d2), pajak: String(pajak) },
          tampil: (function () { var t = { H: Fmt.angka(H), d1: d1 + '%', d2: d2 + '%' }; if (pajak) t.pajak = pajak + '%'; return t; })(),
          toleransi: 0.005
        },
        sidik: { inti: 'diskon|' + fi + '|' + [H, d1, d2, pajak, tanyaHemat ? 1 : 0].join(','), param: [H, d1, d2, pajak], entitas: String(fi) }
      }, 'pengayaan', 'Tambahan tim: diskon berlapis (dan pajak pada tingkat sulit).');
    }
    return null;
  }

  // ========================================================== 9. kurs

  var FRAME_KURS = [
    { barang1: 'mesin potong', barang2: 'sensor' }, { barang1: 'unit server', barang2: 'kabel jaringan' },
    { barang1: 'kursi kantor', barang2: 'meja lipat' }, { barang1: 'komponen elektronik', barang2: 'modul kontrol' }
  ];

  /**
   * Mudah: satu pembelian dalam euro ditambah biaya transfer tetap dalam dolar (biaya ini
   * memberi jalur kesalahan yang lebih besar maupun lebih kecil dari kunci). Sedang: jumlah
   * dua pembelian (€ dan £). Sulit: selisih dua pembelian.
   */
  function kurs(a, level) {
    var fi = a.bulat(0, FRAME_KURS.length - 1), f = FRAME_KURS[fi], pt = a.pilih(K.PERUSAHAAN);
    for (var coba = 0; coba < 400; coba++) {
      var rE = a.pilih([1.05, 1.08, 1.1, 1.12, 1.15]), rP = a.pilih([1.2, 1.25, 1.3, 1.35, 1.4]);
      var n1 = a.bulat(5, 40), n2 = a.bulat(5, 40), p1 = a.pilih([20, 25, 40, 45, 50, 60, 80, 120]), p2 = a.pilih([15, 24, 30, 35, 50, 75, 90]);
      var bentuk = level === 'mudah' ? 'satu' : (level === 'sedang' ? 'jumlah' : 'selisih');
      var F = bentuk === 'satu' ? a.kelipatan(15, 60, 5) : 0;
      var dolarE = n1 * p1 * rE, dolarP = n2 * p2 * rP, e = n1 * p1, p = n2 * p2;
      var kunci, tanya;
      if (bentuk === 'satu') { kunci = dolarE + F; tanya = 'Berapa total biaya pembelian ' + f.barang1 + ' tersebut dalam dolar, termasuk biaya transfer?'; }
      else if (bentuk === 'jumlah') { kunci = dolarE + dolarP; tanya = 'Berapa total biaya kedua pembelian tersebut dalam dolar?'; }
      else { kunci = Math.abs(dolarE - dolarP); tanya = 'Berapa selisih biaya kedua pembelian tersebut dalam dolar?'; }
      if (kunci < 300 || Math.abs(kunci * 100 - Math.round(kunci * 100)) > 1e-6) continue;
      if (bentuk === 'selisih' && Math.abs(dolarE - dolarP) < 100) continue;
      var kE = Fmt.angka(rE, { desimal: 2, tetap: true }), kP = Fmt.angka(rP, { desimal: 2, tetap: true }), A = Fmt.angka;
      var teks = 'Kurs saat ini: 1 € = $' + kE + (bentuk === 'satu' ? '.' : ' dan 1 £ = $' + kP + '.') + ' ' +
        pt + ' membeli ' + n1 + ' ' + f.barang1 + ' seharga €' + p1 + ' per unit dari pemasok di Jerman' +
        (bentuk === 'satu' ? '. Bank mengenakan biaya transfer tetap $' + F + ' untuk seluruh pembayaran tersebut.' : ' dan ' + n2 + ' ' + f.barang2 + ' seharga £' + p2 + ' per unit dari pemasok di Inggris.');
      var fm = function (v) { return Fmt.uang(v, '$', 2, true); };
      // teks hitungan selalu menyebut mata uangnya: €1.380, £850, $1.518
      var E = function (v) { return '€' + A(v); }, P = function (v) { return '£' + A(v); }, D = function (v) { return fm(v); };
      var kurang = function (tx, x, ty, y) { return x >= y ? tx + ' - ' + ty : ty + ' - ' + tx; };
      var pengecoh;
      if (bentuk === 'satu') {
        pengecoh = [
          jalur(e + F, 'tidak mengonversi euro ke dolar (euro dianggap dolar)', n1 + ' × ' + p1 + ' + ' + F, fm),
          jalur(dolarE, 'lupa menambahkan biaya transfer', n1 + ' × €' + p1 + ' × ' + kE, fm),
          jalur(dolarE + n1 * F, 'mengenakan biaya transfer untuk setiap unit', D(dolarE) + ' + ' + n1 + ' × $' + F, fm),
          jalur((e + F) * rE, 'ikut mengalikan biaya transfer (yang sudah dalam dolar) dengan kurs', '(' + E(e) + ' + ' + F + ') × ' + kE, fm),
          jalur(e / rE + F, 'membagi dengan kurs, padahal harus mengalikan', E(e) + ' ÷ ' + kE + ' + $' + F, fm),
          jalur(p1 * rE + F, 'lupa mengalikan dengan jumlah unit', '€' + p1 + ' × ' + kE + ' + $' + F, fm)
        ];
      } else if (bentuk === 'jumlah') {
        pengecoh = [
          jalur(e + p, 'menjumlahkan harga dalam € dan £ tanpa mengonversinya ke dolar', E(e) + ' + ' + P(p), fm),
          jalur((e + p) * rE, 'memakai kurs € untuk seluruh pembelian', '(' + E(e) + ' + ' + P(p) + ') × ' + kE, fm),
          jalur((e + p) * rP, 'memakai kurs £ untuk seluruh pembelian', '(' + E(e) + ' + ' + P(p) + ') × ' + kP, fm),
          jalur(e * rP + p * rE, 'tertukar memakai kurs (euro dengan kurs £, pound dengan kurs €)', E(e) + ' × ' + kP + ' + ' + P(p) + ' × ' + kE, fm),
          jalur(e / rE + p / rP, 'membagi dengan kurs, padahal harus mengalikan', E(e) + ' ÷ ' + kE + ' + ' + P(p) + ' ÷ ' + kP, fm),
          jalur(p1 * rE + p2 * rP, 'lupa mengalikan dengan jumlah unit', '€' + p1 + ' × ' + kE + ' + £' + p2 + ' × ' + kP, fm),
          jalur(Math.abs(dolarE - dolarP), 'menghitung selisih, bukan jumlah', kurang(D(dolarE), dolarE, D(dolarP), dolarP), fm)
        ];
      } else {
        pengecoh = [
          jalur(Math.abs(e - p), 'menghitung selisih harga dalam € dan £ tanpa mengonversinya ke dolar', kurang(E(e), e, P(p), p), fm),
          jalur(dolarE + dolarP, 'menjumlahkan, bukan menghitung selisih', D(dolarE) + ' + ' + D(dolarP), fm),
          jalur(Math.abs(e - p) * rE, 'memakai kurs € untuk kedua pembelian', '(' + kurang(E(e), e, P(p), p) + ') × ' + kE, fm),
          jalur(Math.abs(e - p) * rP, 'memakai kurs £ untuk kedua pembelian', '(' + kurang(E(e), e, P(p), p) + ') × ' + kP, fm),
          jalur(Math.abs(e * rP - p * rE), 'tertukar memakai kurs (euro dengan kurs £, pound dengan kurs €)', kurang(E(e) + ' × ' + kP, e * rP, P(p) + ' × ' + kE, p * rE), fm),
          jalur(Math.abs(e / rE - p / rP), 'membagi dengan kurs, padahal harus mengalikan', kurang(E(e) + ' ÷ ' + kE, e / rE, P(p) + ' ÷ ' + kP, p / rP), fm),
          jalur(Math.abs(p1 * rE - p2 * rP), 'lupa mengalikan dengan jumlah unit', kurang('€' + p1 + ' × ' + kE, p1 * rE, '£' + p2 + ' × ' + kP, p2 * rP), fm)
        ];
      }
      var pembahasan = ['Biaya pembelian dari Jerman = ' + n1 + ' × €' + p1 + ' = €' + A(e) + '; dalam dolar = €' + A(e) + ' × ' + kE + ' = ' + fm(dolarE) + '.'];
      if (bentuk === 'satu') pembahasan.push('Ditambah biaya transfer yang sudah dalam dolar: ' + fm(dolarE) + ' + $' + F + ' = ' + fm(kunci) + '.');
      else {
        pembahasan.push('Biaya pembelian dari Inggris = ' + n2 + ' × £' + p2 + ' = £' + A(p) + '; dalam dolar = £' + A(p) + ' × ' + kP + ' = ' + fm(dolarP) + '.');
        pembahasan.push((bentuk === 'jumlah' ? 'Total = ' + fm(dolarE) + ' + ' + fm(dolarP) : 'Selisih = ' + fm(Math.max(dolarE, dolarP)) + ' - ' + fm(Math.min(dolarE, dolarP))) + ' = ' + fm(kunci) + '.');
      }
      var param = { n1: String(n1), p1: String(p1), rE: String(rE) };
      var tampil = { n1: String(n1), p1: String(p1), rE: kE };
      if (bentuk === 'satu') { param.F = String(F); tampil.F = String(F); }
      else { param.n2 = String(n2); param.p2 = String(p2); param.rP = String(rP); tampil.n2 = String(n2); tampil.p2 = String(p2); tampil.rP = kP; }
      var langkah = [{ nama: 'e', rumus: 'n1*p1*rE' }];
      if (bentuk !== 'satu') langkah.push({ nama: 'p', rumus: 'n2*p2*rP' });
      langkah.push({ nama: 'jawab', rumus: bentuk === 'satu' ? 'e+F' : (bentuk === 'jumlah' ? 'e+p' : 'abs(e-p)') });
      return riset({
        jenisSoal: 'Soal Cerita - Aritmatika Keuangan (konversi mata uang)',
        teks: [teks], pertanyaan: tanya,
        kunci: kunci, fmt: fm, pengecoh: pengecoh, min: 1,
        langkah: langkah, pembahasan: pembahasan,
        model: { param: param, tampil: tampil, toleransi: 0.005, konteks: ['1'] },
        sidik: { inti: 'kurs|' + fi + '|' + [n1, p1, rE, bentuk === 'satu' ? F : n2, bentuk === 'satu' ? 0 : p2, bentuk === 'satu' ? 0 : rP].join(','), param: [n1, p1, rE, n2, p2, rP, F], entitas: fi + pt }
      }, 'pengayaan', 'Tambahan tim: konversi mata uang dengan kurs (Pengukuran dan konversi dalam Aritmatika Keuangan).');
    }
    return null;
  }

  // ================================================= 10. ukuran wadah

  var FRAME_WADAH = [
    { wadah: 'akuarium', isi: 'air' }, { wadah: 'tangki air', isi: 'air' }, { wadah: 'bak penampungan', isi: 'air' },
    { wadah: 'kolam ikan', isi: 'air' }, { wadah: 'tangki solar', isi: 'solar' }, { wadah: 'bak cairan pembersih', isi: 'cairan pembersih' }
  ];

  /**
   * Pengukuran dan konversi satuan dalam bentuk cerita (melengkapi tabel harga per cm³
   * pada contoh riset Soal 15). Mudah: ukuran dalam cm, harga per liter, berapa biayanya.
   * Sedang: ukuran dalam m dan biaya total, berapa biaya per liter. Sulit: rantai satuan
   * m³ -> liter -> menit -> jam dengan pompa dan pengisian sebagian.
   */
  function ukurWadah(a, level) {
    var fi = a.bulat(0, FRAME_WADAH.length - 1), f = FRAME_WADAH[fi], nama = a.pilih(K.NAMA_ORANG), A = Fmt.angka;
    var bentuk = 'balok berukuran panjang ';
    for (var coba = 0; coba < 1500; coba++) {
      var teks, tanya, fm, pengecoh, langkah, param, tampil, kunci, pembahasan, min = 0.01, toleransi;
      if (level === 'mudah') {
        var p = a.kelipatan(40, 150, 10), l = a.kelipatan(30, 80, 10), t = a.kelipatan(30, 80, 10);
        var c = a.pilih([0.02, 0.04, 0.05, 0.08, 0.1, 0.12, 0.15, 0.2, 0.25]), cT = A(c, { desimal: 2, tetap: true });
        var V = p * l * t, L = V / 1000;
        kunci = L * c;
        if (kunci < 5 || Math.abs(kunci * 100 - Math.round(kunci * 100)) > 1e-6) continue;
        teks = nama + ' mengisi sebuah ' + f.wadah + ' berbentuk ' + bentuk + p + ' cm, lebar ' + l + ' cm, dan tinggi ' + t + ' cm sampai penuh dengan ' + f.isi + '. Harga ' + f.isi + ' adalah $' + cT + ' per liter.';
        tanya = 'Berapa biaya ' + f.isi + ' untuk mengisi ' + f.wadah + ' tersebut sampai penuh?';
        fm = function (v) { return Fmt.uang(v, '$', 2, true); };
        pengecoh = [
          jalur(V * c, 'menganggap 1 cm³ sama dengan 1 liter (tidak membagi dengan 1.000)', A(V) + ' × $' + cT, fm),
          jalur(V / 100 * c, 'menganggap 1 liter = 100 cm³', A(V) + ' ÷ 100 × $' + cT, fm),
          jalur(p * l / 1000 * c, 'lupa mengalikan tinggi, hanya memakai luas alas', p + ' × ' + l + ' ÷ 1.000 × $' + cT, fm),
          jalur(2 * (p * l + p * t + l * t) / 1000 * c, 'memakai luas permukaan, bukan volume', '2 × (' + p + ' × ' + l + ' + ' + p + ' × ' + t + ' + ' + l + ' × ' + t + ') ÷ 1.000 × $' + cT, fm),
          jalur(L / c, 'membagi banyaknya liter dengan harga, bukan mengalikannya', A(L) + ' ÷ ' + cT, fm),
          jalur(V / 1e6 * c, 'membagi dengan 1.000.000 seperti mengubah cm³ ke m³', A(V) + ' ÷ 1.000.000 × $' + cT, fm)
        ];
        langkah = [{ nama: 'liter', rumus: 'p*l*t/1000' }, { nama: 'jawab', rumus: 'liter*c' }];
        param = { p: String(p), l: String(l), t: String(t), c: String(c) };
        tampil = { p: String(p), l: String(l), t: String(t), c: cT };
        toleransi = 0.005;
        pembahasan = bahas([
          'Ukuran ' + f.wadah + ' (balok): panjang ' + p + ' cm, lebar ' + l + ' cm, tinggi ' + t + ' cm; diisi sampai penuh.',
          'Harga ' + f.isi + ': $' + cT + ' per liter.'
        ], 'Biaya ' + f.isi + ' untuk mengisi ' + f.wadah + ' sampai penuh.', [
          'Volume balok = panjang × lebar × tinggi:',
          R('V = p \\times l \\times t = ' + p + ' \\times ' + l + ' \\times ' + t + ' = ' + E(V) + '\\ ' + T('cm') + '^{3}'),
          'Harga diberikan per liter, jadi volume diubah ke liter. Satu liter sama dengan satu desimeter kubik, dan 1 dm = 10 cm:',
          R('1\\ ' + T('liter') + ' = 1\\ ' + T('dm') + '^{3} = (10\\ ' + T('cm') + ')^{3} = 1.000\\ ' + T('cm') + '^{3}'),
          R('V = \\frac{' + E(V) + '}{1.000} = ' + E(L) + '\\ ' + T('liter')),
          'Biaya = volume dalam liter × harga per liter:',
          R(T('biaya') + ' = ' + E(L) + ' \\times \\$' + E(c, 2, true) + ' = ' + ED(kunci))
        ], 'Jadi, biaya ' + f.isi + ' untuk mengisi ' + f.wadah + ' sampai penuh adalah ' + fm(kunci) + '.');
      } else {
        var pm = a.pilih([1.2, 1.5, 2, 2.4, 2.5, 3]), lm = a.pilih([0.8, 1, 1.2, 1.5]), tm = a.pilih([0.5, 0.6, 0.75, 0.8, 1]);
        var Vm = Math.round(pm * lm * tm * 1e6) / 1e6, pT = A(pm), lT = A(lm), tT = A(tm);
        if (level === 'sedang') {
          var Lm = Math.round(Vm * 1000 * 1e6) / 1e6;
          if (Math.abs(Lm - Math.round(Lm)) > 1e-9) continue;
          var cl = a.pilih([0.002, 0.0025, 0.004, 0.005, 0.008, 0.01, 0.0125, 0.02]);
          var Bi = Math.round(Lm * cl * 1e6) / 1e6;
          if (Bi < 2 || Math.abs(Bi * 100 - Math.round(Bi * 100)) > 1e-6) continue;
          var BT = A(Bi, { desimal: 2, tetap: true });
          kunci = cl;
          teks = 'Sebuah ' + f.wadah + ' berbentuk ' + bentuk + pT + ' m, lebar ' + lT + ' m, dan dalam ' + tT + ' m diisi penuh dengan ' + f.isi + '. Biaya ' + f.isi + ' untuk mengisinya adalah $' + BT + '.';
          tanya = 'Berapa biaya ' + f.isi + ' tersebut per liter?';
          fm = function (v) { return '$' + (v >= 1 ? Fmt.angka(v, { desimal: 2, tetap: true }) : Fmt.angka(v, { desimal: 5 })); };
          min = 0.00001;
          pengecoh = [
            jalur(Bi / Vm, 'menghitung biaya per meter kubik, bukan per liter', '$' + BT + ' ÷ ' + A(Vm, { desimal: 4 }), fm),
            jalur(Bi / (Vm * 100), 'menganggap 1 m³ = 100 liter', '$' + BT + ' ÷ (' + A(Vm, { desimal: 4 }) + ' × 100)', fm),
            jalur(Bi / (Vm * 1e4), 'menganggap 1 m³ = 10.000 liter', '$' + BT + ' ÷ (' + A(Vm, { desimal: 4 }) + ' × 10.000)', fm),
            jalur(Bi / (Vm * 1e6), 'menghitung biaya per cm³ (membagi dengan 1.000.000), bukan per liter', '$' + BT + ' ÷ (' + A(Vm, { desimal: 4 }) + ' × 1.000.000)', fm),
            jalur(Bi / (pm * lm * 1000), 'lupa mengalikan kedalaman', '$' + BT + ' ÷ (' + pT + ' × ' + lT + ' × 1.000)', fm),
            jalur(Bi / (2 * (pm * lm + pm * tm + lm * tm) * 1000), 'memakai luas permukaan, bukan volume',
              '$' + BT + ' ÷ (2 × (' + pT + ' × ' + lT + ' + ' + pT + ' × ' + tT + ' + ' + lT + ' × ' + tT + ') × 1.000)', fm)
          ];
          langkah = [{ nama: 'liter', rumus: 'p*l*t*1000' }, { nama: 'jawab', rumus: 'B/liter' }];
          param = { p: String(pm), l: String(lm), t: String(tm), B: String(Bi) };
          tampil = { p: pT, l: lT, t: tT, B: BT };
          toleransi = 0.000005;
          pembahasan = bahas([
            'Ukuran ' + f.wadah + ' (balok): panjang ' + pT + ' m, lebar ' + lT + ' m, dalam ' + tT + ' m; diisi penuh.',
            'Biaya ' + f.isi + ' untuk mengisinya: $' + BT + '.'
          ], 'Biaya ' + f.isi + ' per liter.', [
            'Volume balok = panjang × lebar × dalam:',
            R('V = ' + E(pm) + ' \\times ' + E(lm) + ' \\times ' + E(tm) + ' = ' + E(Vm, 4) + '\\ ' + T('m') + '^{3}'),
            'Ubah ke liter. Karena 1 m = 10 dm dan 1 dm³ = 1 liter:',
            R('1\\ ' + T('m') + '^{3} = (10\\ ' + T('dm') + ')^{3} = 1.000\\ ' + T('dm') + '^{3} = 1.000\\ ' + T('liter')),
            R('V = ' + E(Vm, 4) + ' \\times 1.000 = ' + E(Lm) + '\\ ' + T('liter')),
            'Biaya per liter = biaya seluruhnya dibagi banyak liter:',
            R(T('biaya per liter') + ' = \\frac{\\$' + E(Bi, 2, true) + '}{' + E(Lm) + '} = \\$' + E(kunci, 5))
          ], 'Jadi, biaya ' + f.isi + ' tersebut adalah ' + fm(kunci) + ' per liter.');
        } else {
          var isi = a.pilih([60, 75, 80, 90]), q = a.pilih([40, 50, 60, 75, 80, 100, 120, 150, 200, 250]);
          var Li = Math.round(Vm * isi / 100 * 1000 * 1e6) / 1e6;
          if (Math.abs(Li - Math.round(Li)) > 1e-9) continue;
          var menit = Li / q, jam = menit / 60;
          kunci = jam;
          if (Math.abs(jam * 100 - Math.round(jam * 100)) > 1e-6 || jam < 0.5 || jam > 30) continue;
          teks = 'Sebuah ' + f.wadah + ' berbentuk ' + bentuk + pT + ' m, lebar ' + lT + ' m, dan dalam ' + tT + ' m akan diisi ' + f.isi + ' sampai ' + isi +
            '% dari kedalamannya. Pompa yang dipakai mengalirkan ' + q + ' liter per menit.';
          tanya = 'Berapa jam yang diperlukan untuk mengisi ' + f.wadah + ' tersebut?';
          fm = function (v) { return Fmt.angka(v, { desimal: 2 }) + ' jam'; };
          var Lp = Math.round(Vm * 1000 * 1e6) / 1e6, Vi = Vm * isi / 100;
          pengecoh = [
            jalur(menit, 'menjawab dalam menit (lupa membagi dengan 60)', A(Li) + ' ÷ ' + q, fm),
            jalur(Vi * 100 / q / 60, 'menganggap 1 m³ = 100 liter', A(Vi, { desimal: 4 }) + ' × 100 ÷ ' + q + ' ÷ 60', fm),
            jalur(menit / 100, 'menganggap 1 jam = 100 menit', A(Li) + ' ÷ ' + q + ' ÷ 100', fm),
            jalur(Lp / q / 60, 'mengisi sampai penuh, lupa bahwa yang diisi hanya ' + isi + '% kedalaman', A(Lp) + ' ÷ ' + q + ' ÷ 60', fm),
            jalur(Vm * (100 - isi) / 100 * 1000 / q / 60, 'memakai bagian yang tidak diisi (' + (100 - isi) + '% kedalaman)', A(Vm * (100 - isi) / 100 * 1000) + ' ÷ ' + q + ' ÷ 60', fm)
          ];
          if (tm !== 1) pengecoh.push(jalur(pm * lm * isi / 100 * 1000 / q / 60, 'lupa mengalikan kedalaman', pT + ' × ' + lT + ' × ' + isi + '% × 1.000 ÷ ' + q + ' ÷ 60', fm));
          langkah = [{ nama: 'liter', rumus: 'p*l*t*isi/100*1000' }, { nama: 'jawab', rumus: 'liter/q/60' }];
          param = { p: String(pm), l: String(lm), t: String(tm), isi: String(isi), q: String(q) };
          tampil = { p: pT, l: lT, t: tT, isi: isi + '%', q: String(q) };
          toleransi = 0.005;
          pembahasan = bahas([
            'Ukuran ' + f.wadah + ' (balok): panjang ' + pT + ' m, lebar ' + lT + ' m, dalam ' + tT + ' m.',
            'Diisi sampai ' + isi + '% dari kedalamannya; debit pompa ' + q + ' liter per menit.'
          ], 'Lama pengisian dalam jam.', [
            'Volume penuh balok = panjang × lebar × dalam:',
            R('V = ' + E(pm) + ' \\times ' + E(lm) + ' \\times ' + E(tm) + ' = ' + E(Vm, 4) + '\\ ' + T('m') + '^{3}'),
            'Yang diisi hanya ' + isi + '% dari kedalaman, jadi volume yang diisi ' + isi + '% dari volume penuh:',
            R('V_{' + T('isi') + '} = ' + isi + '\\% \\times ' + E(Vm, 4) + ' = ' + E(Vi, 6) + '\\ ' + T('m') + '^{3}'),
            'Ubah ke liter. Karena 1 m = 10 dm dan 1 dm³ = 1 liter:',
            R('1\\ ' + T('m') + '^{3} = (10\\ ' + T('dm') + ')^{3} = 1.000\\ ' + T('dm') + '^{3} = 1.000\\ ' + T('liter')),
            R('V_{' + T('isi') + '} = ' + E(Vi, 6) + ' \\times 1.000 = ' + E(Li) + '\\ ' + T('liter')),
            'Waktu = volume ÷ debit pompa, lalu diubah ke jam (1 jam = 60 menit):',
            R(T('waktu') + ' = \\frac{' + E(Li) + '}{' + q + '} = ' + E(menit, 2) + '\\ ' + T('menit')),
            R(E(menit, 2) + '\\ ' + T('menit') + ' = \\frac{' + E(menit, 2) + '}{60}\\ ' + T('jam') + ' = ' + E(kunci, 2) + '\\ ' + T('jam'))
          ], 'Jadi, waktu yang diperlukan untuk mengisi ' + f.wadah + ' tersebut adalah ' + fm(kunci) + '.');
        }
      }
      return riset({
        jenisSoal: 'Soal Cerita - Pengukuran dan Konversi Satuan',
        teks: [teks], pertanyaan: tanya,
        kunci: kunci, fmt: fm, pengecoh: pengecoh, min: min, maks: 100000,
        langkah: langkah, pembahasan: pembahasan,
        model: { param: param, tampil: tampil, toleransi: toleransi },
        sidik: { inti: 'ukur-wadah|' + fi + '|' + level + '|' + Object.keys(param).map(function (k) { return param[k]; }).join(','), param: Object.keys(param).map(function (k) { return Number(param[k]); }), entitas: fi + nama }
      }, 'pengayaan', 'Tambahan tim untuk cakupan pengukuran dan konversi satuan (volume, liter, biaya per liter, waktu isi), melengkapi contoh Numerik Soal 15.', 'konversi-volume');
    }
    return null;
  }

  // ================================================ 11. banding waktu

  var FRAME_BANDING = [
    { pelaku: ['Kurir A', 'Kurir B'], kerja: function (W) { return 'mengantar paket ke gudang yang berjarak ' + Fmt.angka(W) + ' km'; }, sat: 'km',
      lajuJam: 'km/jam', lajuMenit: 'meter per menit', perMenit: 1000 / 60, ubah: 1000, kata: 'melaju', selesai: 'tiba di gudang', laju: [30, 36, 40, 45, 48, 50, 60, 72, 75, 80, 90], W: [30, 240, 6] },
    { pelaku: ['Pelari A', 'Pelari B'], kerja: function (W) { return 'menempuh lintasan sepanjang ' + Fmt.angka(W) + ' km'; }, sat: 'km',
      lajuJam: 'km/jam', lajuMenit: 'meter per menit', perMenit: 1000 / 60, ubah: 1000, kata: 'berlari', selesai: 'mencapai garis akhir', laju: [6, 8, 9, 10, 12, 15, 18], W: [3, 42, 1] },
    { pelaku: ['Mesin cetak P', 'Mesin cetak Q'], kerja: function (W) { return 'mencetak ' + Fmt.angka(W) + ' lembar brosur'; }, sat: 'lembar',
      lajuJam: 'lembar per jam', lajuMenit: 'lembar per menit', perMenit: 1 / 60, ubah: 1, kata: 'mencetak', selesai: 'selesai mencetak', laju: [600, 720, 900, 1200, 1500, 1800, 2400, 3000], W: [1200, 18000, 600] },
    { pelaku: ['Pemindai X', 'Pemindai Y'], kerja: function (W) { return 'memindai ' + Fmt.angka(W) + ' halaman arsip'; }, sat: 'halaman',
      lajuJam: 'halaman per jam', lajuMenit: 'halaman per menit', perMenit: 1 / 60, ubah: 1, kata: 'memindai', selesai: 'selesai memindai', laju: [360, 480, 600, 720, 900, 1200, 1440], W: [720, 9600, 120] }
  ];

  /**
   * Membandingkan waktu dua pelaku dengan laju tetap yang berbeda (mengisi celah
   * "speed or duration comparison"). Mudah: kedua laju per jam. Sedang: laju dari hasil
   * uji coba (sekian satuan dalam sekian menit). Sulit: satu laju per jam dan satu laju
   * per menit (dengan meter untuk jarak), jadi satuan harus disamakan dulu.
   */
  function bandingWaktu(a, level) {
    var fi = a.bulat(0, FRAME_BANDING.length - 1), f = FRAME_BANDING[fi], A = Fmt.angka;
    for (var coba = 0; coba < 2000; coba++) {
      var r = a.ambil(f.laju, 2);                               // laju per jam pelaku A dan B
      if (r[0] === r[1]) continue;
      var W = a.kelipatan(f.W[0], f.W[1], f.W[2]);
      var tA = W / r[0] * 60, tB = W / r[1] * 60;               // menit
      var kunci = Math.abs(tA - tB);
      if (kunci < 5 || tA > 720 || tB > 720 || Math.abs(kunci * 100 - Math.round(kunci * 100)) > 1e-6) continue;
      if (Math.abs(tA * 100 - Math.round(tA * 100)) > 1e-6 || Math.abs(tB * 100 - Math.round(tB * 100)) > 1e-6) continue;
      var iC = tA < tB ? 0 : 1, iL = 1 - iC, rC = r[iC], rL = r[iL], tC = Math.min(tA, tB), tL = Math.max(tA, tB);
      var P = f.pelaku, teks, param = { W: String(W) }, tampil = { W: A(W) }, langkah = [];
      var menitPelaku = [null, null], uji = [null, null];
      if (level === 'mudah') {
        teks = P[0] + ' ' + f.kata + ' dengan laju tetap ' + A(r[0]) + ' ' + f.lajuJam + ', sedangkan ' + P[1] + ' ' + f.kata + ' dengan laju tetap ' + A(r[1]) + ' ' + f.lajuJam + '.';
        [0, 1].forEach(function (i) { param['r' + i] = String(r[i]); tampil['r' + i] = A(r[i]); langkah.push({ nama: 't' + i, rumus: 'W/r' + i + '*60' }); });
      } else if (level === 'sedang') {
        var y = [a.pilih([10, 12, 15, 20, 24, 30, 36, 40, 45]), a.pilih([10, 12, 15, 20, 24, 30, 36, 40, 45])];
        var x = [r[0] * y[0] / 60, r[1] * y[1] / 60];
        if (x.some(function (v) { return Math.abs(v - Math.round(v)) > 1e-9 || v < 1; }) || y[0] === y[1]) continue;
        uji = [x, y];
        teks = 'Dalam uji coba, ' + P[0] + ' ' + f.kata + ' ' + A(x[0]) + ' ' + f.sat + ' dalam ' + y[0] + ' menit, sedangkan ' + P[1] + ' ' + f.kata + ' ' + A(x[1]) + ' ' + f.sat + ' dalam ' + y[1] + ' menit. Laju keduanya tetap.';
        [0, 1].forEach(function (i) {
          param['x' + i] = String(x[i]); param['y' + i] = String(y[i]); tampil['x' + i] = A(x[i]); tampil['y' + i] = String(y[i]);
          langkah.push({ nama: 't' + i, rumus: 'W*y' + i + '/x' + i });
        });
      } else {
        var im = a.bulat(0, 1), rm = r[im] * f.perMenit;     // pelaku im lajunya ditulis per menit
        if (Math.abs(rm - Math.round(rm)) > 1e-9) continue;
        rm = Math.round(rm);
        menitPelaku[im] = rm;
        teks = [0, 1].map(function (i) {
          return P[i] + ' ' + f.kata + ' dengan laju tetap ' + (i === im ? A(rm) + ' ' + f.lajuMenit : A(r[i]) + ' ' + f.lajuJam);
        }).join(', sedangkan ') + '.';
        [0, 1].forEach(function (i) {
          if (i === im) { param['r' + i] = String(rm); tampil['r' + i] = A(rm); langkah.push({ nama: 't' + i, rumus: 'W*' + f.ubah + '/r' + i }); }
          else { param['r' + i] = String(r[i]); tampil['r' + i] = A(r[i]); langkah.push({ nama: 't' + i, rumus: 'W/r' + i + '*60' }); }
        });
      }
      teks += ' Keduanya mulai pada saat yang sama untuk ' + f.kerja(W) + '.';
      langkah.push({ nama: 'jawab', rumus: 'abs(t0-t1)' });
      var tanya = 'Berapa menit lebih cepat ' + P[iC] + ' ' + f.selesai + ' dibandingkan ' + P[iL] + '?';
      var fm = function (v) { return Fmt.angka(v, { desimal: 2 }) + ' menit'; };
      var WT = A(W), jamC = A(W / rC, { desimal: 4 }), jamL = A(W / rL, { desimal: 4 });
      var pengecoh = [
        jalur(W / (rC - rL) * 60, 'membagi ' + (f.sat === 'km' ? 'jarak' : 'banyaknya pekerjaan') + ' dengan selisih laju', WT + ' ÷ (' + A(rC) + ' - ' + A(rL) + ') × 60', fm),
        jalur(W / rL - W / rC, 'lupa mengubah selisih waktu dari jam ke menit', WT + ' ÷ ' + A(rL) + ' - ' + WT + ' ÷ ' + A(rC), fm),
        jalur(tC, 'menjawab waktu yang diperlukan ' + P[iC] + ', bukan selisihnya', WT + ' ÷ ' + A(rC) + ' × 60', fm),
        jalur(tL, 'menjawab waktu yang diperlukan ' + P[iL] + ', bukan selisihnya', WT + ' ÷ ' + A(rL) + ' × 60', fm),
        jalur((W / rL - W / rC) * 100, 'menganggap 1 jam = 100 menit', '(' + jamL + ' - ' + jamC + ') × 100', fm),
        jalur(rC - rL, 'menuliskan selisih laju sebagai selisih menit', A(rC) + ' - ' + A(rL), fm)
      ];
      if (level === 'sedang') pengecoh.splice(2, 0, jalur(Math.abs(uji[1][0] - uji[1][1]), 'membandingkan lama uji coba yang tertulis, padahal banyaknya ' + f.sat + ' pada uji coba berbeda',
        Math.max(uji[1][0], uji[1][1]) + ' - ' + Math.min(uji[1][0], uji[1][1]), fm));
      if (level === 'sulit') {
        var im2 = menitPelaku[0] !== null ? 0 : 1, salahT = W / menitPelaku[im2] * 60, lainT = im2 === 0 ? tB : tA;
        pengecoh.splice(1, 0, jalur(Math.abs(salahT - lainT), 'lupa menyamakan satuan: laju ' + A(menitPelaku[im2]) + ' ' + f.lajuMenit + ' dipakai seolah-olah ' + f.lajuJam,
          '|' + WT + ' ÷ ' + A(menitPelaku[im2]) + ' × 60 - ' + A(lainT, { desimal: 2 }) + '|', fm));
      }
      // waktu tiap pelaku dalam menit, ditulis sebagai baris persamaan
      var tE = function (i) { return E(i ? tB : tA, 2) + '\\ ' + T('menit'); }, nama = function (i) { return 't_{' + T(P[i]) + '}'; };
      var kerja = ['Waktu = ' + (f.sat === 'km' ? 'jarak' : 'banyak pekerjaan') + ' dibagi laju. Agar dapat dibandingkan, kedua waktu dinyatakan dalam menit (1 jam = 60 menit).'];
      var dik = [(f.sat === 'km' ? 'Jarak' : 'Banyak pekerjaan') + ': ' + WT + ' ' + f.sat + '; keduanya mulai pada saat yang sama.'];
      [0, 1].forEach(function (i) {
        if (level === 'sedang') {
          var x = uji[0][i], y = uji[1][i];
          dik.push(P[i] + ': ' + A(x) + ' ' + f.sat + ' dalam ' + y + ' menit pada uji coba (laju tetap).');
          kerja.push('Laju ' + P[i] + ' = ' + A(x) + ' ÷ ' + y + ' ' + f.sat + ' per menit, jadi:');
          kerja.push(R(nama(i) + ' = ' + E(W) + ' \\div \\frac{' + E(x) + '}{' + y + '} = \\frac{' + E(W) + ' \\times ' + y + '}{' + E(x) + '} = ' + tE(i)));
        } else if (menitPelaku[i] !== null) {
          dik.push(P[i] + ': ' + A(menitPelaku[i]) + ' ' + f.lajuMenit + '.');
          if (f.ubah !== 1) {
            kerja.push('Laju ' + P[i] + ' dalam meter per menit, jadi jaraknya diubah ke meter (1 km = 1.000 meter):');
            kerja.push(R(E(W) + '\\ ' + T('km') + ' = ' + E(W) + ' \\times 1.000\\ ' + T('meter') + ' = ' + E(W * f.ubah) + '\\ ' + T('meter')));
          } else kerja.push('Laju ' + P[i] + ' sudah per menit:');
          kerja.push(R(nama(i) + ' = \\frac{' + E(W * f.ubah) + '}{' + E(menitPelaku[i]) + '} = ' + tE(i)));
        } else {
          dik.push(P[i] + ': ' + A(r[i]) + ' ' + f.lajuJam + '.');
          kerja.push('Laju ' + P[i] + ' per jam, jadi hasil baginya (jam) dikali 60:');
          kerja.push(R(nama(i) + ' = \\frac{' + E(W) + '}{' + E(r[i]) + '} \\times 60 = ' + tE(i)));
        }
      });
      kerja.push(P[iC] + ' memerlukan waktu lebih sedikit, jadi selisihnya:');
      kerja.push(R(T('selisih') + ' = ' + E(tL, 2) + ' - ' + E(tC, 2) + ' = ' + E(kunci, 2) + '\\ ' + T('menit')));
      var pembahasan = bahas(dik, 'Selisih waktu (dalam menit) antara ' + P[iC] + ' dan ' + P[iL] + ' untuk ' + f.selesai + ', yaitu berapa menit ' + P[iC] + ' lebih cepat.', kerja,
        'Jadi, ' + P[iC] + ' ' + f.selesai + ' ' + fm(kunci) + ' lebih cepat daripada ' + P[iL] + '.');
      return riset({
        jenisSoal: 'Soal Cerita - Laju dan Waktu',
        teks: [teks], pertanyaan: tanya,
        kunci: kunci, fmt: fm, pengecoh: pengecoh, min: 0.01, maks: 5000,
        langkah: langkah, pembahasan: pembahasan,
        model: { param: param, tampil: tampil, toleransi: 0.005 },
        sidik: { inti: 'banding-waktu|' + fi + '|' + level + '|' + Object.keys(param).map(function (k) { return param[k]; }).join(','), param: Object.keys(param).map(function (k) { return Number(param[k]); }), entitas: String(fi) }
      }, 'pengayaan', 'Tambahan tim untuk cakupan perbandingan laju dan durasi (siapa lebih cepat dan selisih waktunya), mengikuti bentuk SHL G+ 23-24.');
    }
    return null;
  }

  // ===================================================== pendaftaran

  var KELUARGA = [
    { id: 'pecahan-sisa', nama: 'Pecahan & persen pada sisa zat', topik: 'Bilangan dan Perbandingan', fn: pecahanSisa },
    { id: 'persen-naik', nama: 'Persentase peningkatan kecepatan', topik: 'Bilangan dan Perbandingan', fn: persenNaik },
    { id: 'aljabar-berat', nama: 'Dua persamaan, tiga benda', topik: 'Aljabar Dasar', fn: aljabarBerat },
    { id: 'laju-mesin', nama: 'Balik modal mesin (laju dan waktu)', topik: 'Laju dan Waktu', fn: lajuMesin },
    { id: 'laba-majemuk', nama: 'Bulan lunas dengan laba naik', topik: 'Aritmatika Keuangan', fn: labaMajemuk },
    { id: 'pendapatan', nama: 'Selisih pendapatan penjual', topik: 'Aritmatika Keuangan', fn: pendapatan },
    { id: 'campuran', nama: 'Perbandingan campuran', topik: 'Bilangan dan Perbandingan', fn: campuran },
    { id: 'diskon', nama: 'Diskon berlapis', topik: 'Aritmatika Keuangan', fn: diskon },
    { id: 'kurs', nama: 'Konversi mata uang (£, €, $)', topik: 'Aritmatika Keuangan', fn: kurs },
    { id: 'ukur-wadah', nama: 'Volume wadah, liter, biaya, dan waktu isi', topik: 'Pengukuran dan Konversi Satuan', fn: ukurWadah },
    { id: 'banding-waktu', nama: 'Selisih waktu dua pelaku dengan laju berbeda', topik: 'Laju dan Waktu', fn: bandingWaktu }
  ];

  /**
   * Susun satu butir cerita.
   * @param {string} id keluarga
   * @param {string} level mudah | sedang | sulit
   * @param {number} benih
   * @param {object} [opsi] { target: posisi kunci 0..4 }
   */
  function buat(id, level, benih, opsi) {
    opsi = opsi || {};
    var kel = null;
    KELUARGA.forEach(function (k) { if (k.id === id) kel = k; });
    if (!kel) throw new Error('keluarga cerita tidak dikenal: ' + id);
    var a = Rng.alat(benih);
    var spec = kel.fn(a, level, opsi);
    if (!spec) return null;
    var ctx = { subtes: 'ku', submateri: 'cerita', keluarga: id, level: level, benih: benih, a: a, target: opsi.target };
    var butir = Butir.rakitPg(ctx, spec);
    if (butir) butir.model.topik = kel.topik;
    return butir;
  }

  return { KELUARGA: KELUARGA, buat: buat, nilaiKePecahan: nilaiKePecahan };
});
