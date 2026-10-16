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
 *   kurs             Aritmatika Keuangan         konversi £ / € / $
 *
 * Setiap keluarga menghasilkan SPESIFIKASI (teks, kunci, pengecoh berikut
 * alasannya, langkah hitung, model) yang dirakit `Butir.rakitPg`. Pengecoh
 * berasal dari kesalahan yang memang lazim: lupa satu langkah, memakai dasar
 * persentase yang keliru, selisih satu bulan, dan semacamnya.
 *
 * `model.param` memuat setiap angka yang dipakai (sebagai teks eksak), dan
 * `model.tampil` memuat teks yang TERCETAK di soal untuk tiap angka itu;
 * validator membaca keduanya, menghitung ulang `langkah` dengan pecahan eksak,
 * dan memastikan angka yang dihitung sama dengan angka yang dibaca peserta.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./rng.js'), require('./format.js'), require('./kamus.js'), require('./butir.js'));
    module.exports = api;
  } else {
    api = factory(root.Rng, root.Fmt, root.Kamus, root.Butir);
    root.Cerita = api;
  }
})(typeof self !== 'undefined' ? self : this, function (Rng, Fmt, Kamus, Butir) {
  'use strict';

  var K = Kamus;

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

  function sebut(daftar, a) { return a.pilih(daftar); }

  var PAKET = [];   // diisi di bawah

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
      var A1 = frKurang(target, sisa1), A2 = frKurang(target, frKurang(A, C));
      var pengecoh = [
        { nilai: frVal(A1), alasan: 'lupa memperhitungkan ' + f.zat + ' yang tumpah' },
        { nilai: frVal(A2), alasan: 'lupa memperhitungkan ' + f.zat + ' yang dituang ke ' + f.tujuan },
        { nilai: frVal(frKali(sisa2, fr(P, 100))), alasan: 'menghitung kenaikan ' + P + '% dari sisa, bukan dari jumlah mula-mula' },
        { nilai: frVal(frKali(A, fr(P, 100))), alasan: 'hanya menghitung tambahan ' + P + '% dari jumlah mula-mula tanpa memperhitungkan ' + f.zat + ' yang berkurang' },
        { nilai: frVal(sisa2), alasan: 'menjawab sisa ' + f.zat + ' saat ini, bukan jumlah yang harus ditambahkan' },
        { nilai: frVal(target), alasan: 'menjawab jumlah akhir yang diinginkan, bukan tambahannya' }
      ];
      var pembahasan = [
        f.zat.charAt(0).toUpperCase() + f.zat.slice(1) + ' mula-mula = ' + frStr(A) + ' ' + sat + '.',
        'Dituang ke ' + f.tujuan + ' = ' + frStr(B) + ' × ' + frStr(A) + ' = ' + frStr(tuang) + ' ' + sat + ', sisa ' + frStr(A) + ' - ' + frStr(tuang) + ' = ' + frStr(sisa1) + ' ' + sat + '.',
        'Tumpah ' + frStr(C) + ' ' + sat + ', sisa ' + frStr(sisa1) + ' - ' + frStr(C) + ' = ' + frStr(sisa2) + ' ' + sat + '.',
        'Jumlah yang diinginkan = ' + P + '% lebih banyak dari mula-mula = ' + frStr(A) + ' × ' + (100 + P) + '% = ' + frStr(target) + ' ' + sat + '.',
        'Yang harus ditambahkan = ' + frStr(target) + ' - ' + frStr(sisa2) + ' = ' + frStr(tambah) + ' ' + sat + '.'
      ];
      return {
        jenisSoal: 'Soal Cerita - Bilangan dan Perbandingan',
        teks: [teks], pertanyaan: tanya,
        kunci: kunci, fmt: function (v) { var pc = nilaiKePecahan(v); return pc === null ? null : pc + ' ' + sat; },
        pengecoh: pengecoh, min: 0.0001, langkahPilihan: 1 / tambah.d, tanpaPengali: true,
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
      };
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
      }, tanya: 'Berapa persentase peningkatan kecepatan mengetiknya dari awal hingga akhir kursus?', unit: 'kata per menit' },
    { teks: function (n, v0, p1, p2, W, M) {
        return n + ' merakit ' + v0 + ' unit per jam pada hari pertama bekerja di pabrik. ' +
          (p1 ? 'Setelah tiga hari, kecepatannya naik ' + p1 + '%. ' : '') +
          (p2 ? 'Pada hari ketujuh, kecepatannya naik lagi ' + p2 + '% dari kecepatan semula. ' : '') +
          'Pada akhir masa pelatihan, ' + n + ' menyelesaikan ' + Fmt.angka(W) + ' unit dalam ' + M + ' jam.';
      }, tanya: 'Berapa persentase peningkatan kecepatan merakitnya dari awal hingga akhir masa pelatihan?', unit: 'unit per jam' },
    { teks: function (n, v0, p1, p2, W, M) {
        return n + ' memindai ' + v0 + ' barang per menit di hari pertama menjadi kasir. ' +
          (p1 ? 'Pada akhir minggu pertama, kecepatannya naik ' + p1 + '%. ' : '') +
          (p2 ? 'Pada akhir minggu kedua, kecepatannya naik lagi ' + p2 + '% dari kecepatan semula. ' : '') +
          'Pada akhir bulan, ' + n + ' memindai ' + Fmt.angka(W) + ' barang dalam ' + M + ' menit.';
      }, tanya: 'Berapa persentase peningkatan kecepatan memindainya dari hari pertama hingga akhir bulan?', unit: 'barang per menit' },
    { teks: function (n, v0, p1, p2, W, M) {
        return n + ' mengisi ' + v0 + ' formulir per jam saat baru menjadi operator entri data. ' +
          (p1 ? 'Setelah dua minggu, kecepatannya meningkat ' + p1 + '%. ' : '') +
          (p2 ? 'Setelah empat minggu, kecepatannya meningkat lagi ' + p2 + '% dari kecepatan semula. ' : '') +
          'Pada akhir masa percobaan, ' + n + ' menyelesaikan ' + Fmt.angka(W) + ' formulir dalam ' + M + ' jam.';
      }, tanya: 'Berapa persentase peningkatan kecepatan mengisi formulirnya dari awal hingga akhir masa percobaan?', unit: 'formulir per jam' },
    { teks: function (n, v0, p1, p2, W, M) {
        return n + ' menjahit ' + v0 + ' potong pakaian per jam pada minggu pertama bekerja. ' +
          (p1 ? 'Pada minggu ketiga, kecepatannya meningkat ' + p1 + '%. ' : '') +
          (p2 ? 'Pada minggu kelima, kecepatannya naik lagi ' + p2 + '% dari kecepatan semula. ' : '') +
          'Pada minggu terakhir, ' + n + ' menyelesaikan ' + Fmt.angka(W) + ' potong dalam ' + M + ' jam.';
      }, tanya: 'Berapa persentase peningkatan kecepatan menjahitnya dari minggu pertama hingga minggu terakhir?', unit: 'potong per jam' }
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
    var pengecoh = [
      { nilai: p1 || (q + 5), alasan: p1 ? 'mengambil kenaikan sementara (' + p1 + '%), bukan kenaikan dari awal sampai akhir' : 'menebak dari angka pada soal' },
      { nilai: v1 / v0 * 100, alasan: 'menjawab kecepatan akhir sebagai persen dari kecepatan awal (' + Fmt.angka(v1 / v0 * 100) + '%), padahal yang ditanya kenaikannya' },
      { nilai: v1 - v0, alasan: 'menjawab selisih kecepatan (' + (v1 - v0) + ' ' + f.unit + ') sebagai persentase' },
      { nilai: q / 2, alasan: 'membagi dua kenaikan yang benar' },
      { nilai: (v1 - v0) / v1 * 100, alasan: 'menghitung kenaikan terhadap kecepatan akhir, bukan terhadap kecepatan awal' },
      { nilai: q + (p1 || 3), alasan: 'menjumlahkan kenaikan dari awal sampai akhir dengan kenaikan sementara' },
      { nilai: q - (p1 || 3), alasan: 'mengurangi kenaikan sementara dari kenaikan dari awal sampai akhir' }
    ];
    var langkah = [{ nama: 'akhir', rumus: 'W/M' }, { nama: 'jawab', rumus: '(akhir-v0)/v0*100' }];
    var pembahasan = [
      'Kecepatan akhir = ' + Fmt.angka(W) + ' ÷ ' + M + ' = ' + Fmt.angka(v1) + ' ' + f.unit + '.',
      'Peningkatan dari awal (' + v0 + ' ' + f.unit + ') = (' + Fmt.angka(v1) + ' - ' + v0 + ') ÷ ' + v0 + ' × 100% = ' + q + '%.'
    ];
    if (p1) pembahasan.push('Informasi kenaikan ' + p1 + (p2 ? '% dan ' + p2 : '') + '% sebelum akhir tidak diperlukan, karena yang ditanya adalah peningkatan dari awal hingga akhir.');
    var tampil = { v0: String(v0), W: Fmt.angka(W), M: String(M) };
    var param = { v0: String(v0), W: String(W), M: String(M) };
    return {
      jenisSoal: 'Soal Cerita - Bilangan dan Perbandingan',
      teks: [teks], pertanyaan: f.tanya,
      kunci: q, fmt: function (v) { return Fmt.angka(v, { desimal: 1 }) + '%'; }, pengecoh: pengecoh, min: 0.5, desimal: 1,
      langkah: langkah, pembahasan: pembahasan,
      model: { param: param, tampil: tampil, toleransi: 1e-9 },
      sidik: { inti: 'persen-naik|' + fi + '|' + v0 + ',' + q + ',' + M + ',' + p1 + ',' + p2, param: [v0, q, M, p1, p2], entitas: fi + nama }
    };
  }

  // ====================================================== 3. aljabar berat

  var FRAME_BERAT = [
    { A: 'karung gandum', B: 'karung jagung', C: 'karung oat', sat: 'pon' },
    { A: 'peti apel', B: 'peti jeruk', C: 'peti mangga', sat: 'kg' },
    { A: 'kardus buku', B: 'kardus majalah', C: 'kardus kamus', sat: 'kg' },
    { A: 'tas pasir', B: 'tas semen', C: 'tas kerikil', sat: 'kg' },
    { A: 'kotak baut', B: 'kotak mur', C: 'kotak paku', sat: 'ons' }
  ];

  function aljabarBerat(a, level, opsi) {
    var fi = a.bulat(0, FRAME_BERAT.length - 1), f = FRAME_BERAT[fi];
    var maks = level === 'mudah' ? 8 : (level === 'sedang' ? 10 : 14);
    var perluSuku = level === 'mudah' ? 2 : 3;
    for (var coba = 0; coba < 1500; coba++) {
      var g = a.bulat(2, maks), j = a.bulat(2, maks), o = a.bulat(2, maks);
      if (opsi && opsi.target >= 3 && g < opsi.target + 2) continue;
      var da = a.bulat(-4, 4), db = a.bulat(-4, 4), dc = a.bulat(-4, 4);
      if (da === 0 || da * g + db * j + dc * o !== 0) continue;
      if ((da !== 0) + (db !== 0) + (dc !== 0) !== perluSuku) continue;
      var a2 = a.bulat(0, 3), b2 = a.bulat(0, 3), c2 = a.bulat(0, 3);
      var a1 = a2 + da, b1 = b2 + db, c1 = c2 + dc;
      if (a1 < 0 || b1 < 0 || c1 < 0 || a1 + b1 + c1 === 0 || a2 + b2 + c2 === 0) continue;
      if (a1 > 5 || b1 > 5 || c1 > 5) continue;
      var bs = a.bulat(1, 3), cs = a.bulat(1, 2);
      var S = bs * j + cs * o;
      var suku = function (k, sim) { return (k === 1 ? '' : k) + sim; };
      var ruas = function (x, y, z) {
        var bagian = [];
        if (x) bagian.push(Kamus.kata(x) + ' ' + f.A);
        if (y) bagian.push(Kamus.kata(y) + ' ' + f.B);
        if (z) bagian.push(Kamus.kata(z) + ' ' + f.C);
        return Fmt.daftarKata(bagian);
      };
      var teks1 = Kamus.kap(ruas(a1, b1, c1)) + ' memiliki berat yang sama dengan ' + ruas(a2, b2, c2) + '.';
      var teks2 = 'Jika ' + Kamus.kata(bs) + ' ' + f.B + ' dan ' + Kamus.kata(cs) + ' ' + f.C + ' memiliki berat ' + S + ' ' + f.sat +
        ', sedangkan satu ' + f.B + ' memiliki berat ' + j + ' ' + f.sat + ', berapa berat satu ' + f.A + '?';
      var oHit = (S - bs * j) / cs;
      var gHit = -(db * j + dc * o) / da;
      if (oHit !== o || Math.abs(gHit - g) > 1e-9) continue;

      // persamaan setelah suku yang sama dicoret: sisi positif = sisi negatif
      var term = [[da, 'g', g], [db, 'j', j], [dc, 'o', o]].filter(function (t) { return t[0] !== 0; });
      var pos = term.filter(function (t) { return t[0] > 0; });
      var neg = term.filter(function (t) { return t[0] < 0; }).map(function (t) { return [-t[0], t[1], t[2]]; });
      var kiriTeks = pos.map(function (t) { return suku(t[0], t[1]); }).join(' + ');
      var kananTeks = neg.map(function (t) { return suku(t[0], t[1]); }).join(' + ');
      var angkaTeks = function (arr) { return arr.map(function (t) { return t[1] === 'g' ? suku(t[0], 'g') : t[0] + ' × ' + t[2]; }).join(' + '); };
      var sisiG = pos.some(function (t) { return t[1] === 'g'; }) ? pos : neg;
      var sisiLain = sisiG === pos ? neg : pos;
      var nilaiLain = sisiLain.reduce(function (s, t) { return s + t[0] * t[2]; }, 0);
      var nilaiGSisa = sisiG.reduce(function (s, t) { return t[1] === 'g' ? s : s + t[0] * t[2]; }, 0);
      var koefG = sisiG.filter(function (t) { return t[1] === 'g'; })[0][0];
      var kunci = g;
      var pengecoh = [
        { nilai: o, alasan: 'menjawab berat ' + f.C + ', bukan ' + f.A },
        { nilai: j, alasan: 'menjawab berat ' + f.B + ' yang sudah diketahui pada soal' },
        { nilai: S - j, alasan: 'mengurangi berat satu ' + f.B + ' dari jumlah, tanpa mengingat banyaknya benda pada informasi kedua' },
        { nilai: g + 1, alasan: 'terlalu besar satu ' + f.sat + ': salah menghitung satu langkah pada persamaan pertama' },
        { nilai: g - 1, alasan: 'terlalu kecil satu ' + f.sat + ': salah menghitung satu langkah pada persamaan pertama' },
        { nilai: nilaiLain / Math.max(1, a1), alasan: 'tidak memindahkan suku-suku yang lain ke satu sisi sebelum membagi' },
        { nilai: (nilaiLain + nilaiGSisa) / Math.max(1, koefG), alasan: 'menjumlahkan, bukan mengurangkan, suku-suku pada sisi yang memuat g' }
      ];
      var tulis = function (x, y, z) {
        return [[x, 'g'], [y, 'j'], [z, 'o']].filter(function (t) { return t[0]; }).map(function (t) { return suku(t[0], t[1]); }).join(' + ');
      };
      var pembahasan = [
        'Misalkan berat satu ' + f.A + ' = g, ' + f.B + ' = j, dan ' + f.C + ' = o.',
        'Persamaan pertama: ' + tulis(a1, b1, c1) + ' = ' + tulis(a2, b2, c2) + '. Dengan mencoret suku yang sama di kedua sisi: ' + kiriTeks + ' = ' + kananTeks + '.',
        'Dari informasi kedua: ' + suku(bs, 'j') + ' + ' + suku(cs, 'o') + ' = ' + S + ' dan j = ' + j + ', maka ' + suku(cs, 'o') + ' = ' + S + ' - ' + (bs * j) + ' = ' + (cs * o) + ', jadi o = ' + o + ' ' + f.sat + '.',
        'Masukkan j = ' + j + ' dan o = ' + o + ': ' + angkaTeks(pos) + ' = ' + angkaTeks(neg) + '.',
        koefG === 1
          ? 'Jadi g = ' + (nilaiLain - nilaiGSisa) + ' ' + f.sat + '.'
          : suku(koefG, 'g') + ' = ' + (nilaiLain - nilaiGSisa) + ', sehingga g = ' + (nilaiLain - nilaiGSisa) + ' ÷ ' + koefG + ' = ' + g + ' ' + f.sat + '.',
        'Cek: ' + (a1 * g + b1 * j + c1 * o) + ' = ' + (a2 * g + b2 * j + c2 * o) + ' ' + f.sat + '.'
      ];
      return {
        jenisSoal: 'Soal Cerita - Aljabar Dasar',
        teks: [teks1], pertanyaan: teks2,
        kunci: kunci, fmt: function (v) { return v + ' ' + f.sat; }, pengecoh: pengecoh, min: 1, bulat: true, desimal: 0,
        langkah: [
          { nama: 'o', rumus: '(S-bs*j)/cs' }, { nama: 'jawab', rumus: '-((b1-b2)*j+(c1-c2)*o)/(a1-a2)' },
          { nama: 'kiri', rumus: 'a1*jawab+b1*j+c1*o' }, { nama: 'kanan', rumus: 'a2*jawab+b2*j+c2*o' }
        ],
        pembahasan: pembahasan,
        model: {
          param: { a1: String(a1), b1: String(b1), c1: String(c1), a2: String(a2), b2: String(b2), c2: String(c2), bs: String(bs), cs: String(cs), S: String(S), j: String(j) },
          tampil: { S: String(S), j: String(j) }, toleransi: 1e-9, seimbang: ['kiri', 'kanan'],
          kata: { a1: a1, b1: b1, c1: c1, a2: a2, b2: b2, c2: c2, bs: bs, cs: cs }
        },
        sidik: { inti: 'aljabar-berat|' + fi + '|' + [a1, b1, c1, a2, b2, c2, bs, cs, S, j].join(','), param: [a1, b1, c1, a2, b2, c2, bs, cs, S, j], entitas: String(fi) }
      };
    }
    return null;
  }

  // ======================================================== 4. laju mesin

  var FRAME_MESIN = [
    { mesin: 'mesin pembuat peralatan makan plastik', barang: 'peralatan makan', wadah: 'kotak', sim: '$' },
    { mesin: 'mesin pengemas biskuit', barang: 'bungkus biskuit', wadah: 'dus', sim: '€' },
    { mesin: 'mesin pencetak botol minum', barang: 'botol', wadah: 'karton', sim: '£' },
    { mesin: 'mesin pembuat pensil', barang: 'pensil', wadah: 'pak', sim: '$' },
    { mesin: 'mesin penjahit sarung tangan', barang: 'pasang sarung tangan', wadah: 'lusin', sim: '€' }
  ];

  function lajuMesin(a, level) {
    var fi = a.bulat(0, FRAME_MESIN.length - 1), f = FRAME_MESIN[fi], nama = a.pilih(K.NAMA_INGGRIS);
    for (var coba = 0; coba < 400; coba++) {
      var jam = a.pilih([1, 2, 4, 5]), per = a.pilih([100, 200, 250, 300, 400, 500]) ;
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
      var fmt = function (v) { return Fmt.angka(v, { desimal: 1 }) + ' hari'; };
      var pengecoh = [
        { nilai: C / (laju * H * harga), alasan: 'menganggap harga ' + f.sim + Fmt.angka(harga, { desimal: 2, tetap: true }) + ' berlaku untuk satu buah, bukan satu ' + f.wadah },
        { nilai: C / (N / isi * harga), alasan: 'memakai hasil ' + Kamus.kata(jam) + ' jam sebagai hasil satu hari penuh' },
        { nilai: Math.ceil(hari), alasan: 'membulatkan ke atas menjadi hari penuh padahal jawaban boleh desimal' },
        { nilai: hari * 2, alasan: 'menghitung hanya setengah hari operasi' },
        { nilai: C / (laju * H / isi), alasan: 'lupa mengalikan dengan harga jual per ' + f.wadah },
        { nilai: hari / 2, alasan: 'menghitung dua kali lipat hasil per hari' }
      ];
      var pembahasan = [
        'Mesin menghasilkan ' + Fmt.angka(N) + ' ' + f.barang + ' dalam ' + jam + ' jam = ' + Fmt.angka(laju) + ' per jam, jadi ' + Fmt.angka(laju) + ' × ' + H + ' = ' + Fmt.angka(laju * H) + ' per hari.',
        Fmt.angka(laju * H) + ' ÷ ' + isi + ' per ' + f.wadah + ' = ' + Fmt.angka(laju * H / isi) + ' ' + f.wadah + ' per hari, dengan penjualan ' + Fmt.angka(laju * H / isi) + ' × ' + Fmt.uang(harga, f.sim, 2, true) + ' = ' + Fmt.uang(pendapatan, f.sim, 2, true) + ' per hari.',
        'Waktu untuk menutup harga mesin = ' + Fmt.uang(C, f.sim, 0) + ' ÷ ' + Fmt.uang(pendapatan, f.sim, 2, true) + ' = ' + Fmt.angka(hari, { desimal: 1 }) + ' hari.'
      ];
      return {
        jenisSoal: 'Soal Cerita - Laju dan Waktu',
        teks: [teks], pertanyaan: tanya,
        kunci: hari, fmt: fmt, pengecoh: pengecoh, min: 0.1, desimal: 1,
        langkah: [
          { nama: 'laju', rumus: 'N/jam' }, { nama: 'harian', rumus: 'laju*H' }, { nama: 'wadahHari', rumus: 'harian/isi' },
          { nama: 'pendapatan', rumus: 'wadahHari*harga' }, { nama: 'jawab', rumus: 'C/pendapatan' }
        ],
        pembahasan: pembahasan,
        model: {
          param: { N: String(N), jam: String(jam), isi: String(isi), harga: String(harga), C: String(C), H: String(H) },
          tampil: { N: Fmt.angka(N), isi: String(isi), harga: Fmt.angka(harga, { desimal: 2, tetap: true }), C: Fmt.angka(C), H: String(H) }, toleransi: 0.05
        },
        sidik: { inti: 'laju-mesin|' + fi + '|' + [N, jam, isi, harga, C, H].join(','), param: [N, jam, isi, harga, C, H], entitas: fi + nama }
      };
    }
    return null;
  }

  // ===================================================== 5. laba majemuk

  var FRAME_LABA = [
    { barang: 'mesin', sim: '$' }, { barang: 'truk pengangkut', sim: '€' },
    { barang: 'peralatan dapur industri', sim: '£' }, { barang: 'printer cetak besar', sim: '$' }
  ];

  function labaMajemuk(a, level) {
    var fi = a.bulat(0, FRAME_LABA.length - 1), f = FRAME_LABA[fi], pt = a.pilih(K.PERUSAHAAN);
    for (var coba = 0; coba < 400; coba++) {
      var m0 = a.bulat(0, 6);                                       // bulan awal (0=Januari)
      var P0 = a.kelipatan(5000, 12000, level === 'mudah' ? 1000 : 1);
      var g = level === 'mudah' ? a.pilih([5, 10]) : a.pilih([2, 3, 4, 5, 6]);
      var k = a.bulat(level === 'mudah' ? 3 : 4, 6);               // bulan ke-k (1 = bulan awal) harga lunas
      var kum = [], tot = 0, laba = P0;
      for (var i = 0; i < 9; i++) { tot += laba; kum.push(tot); laba = laba * (100 + g) / 100; }
      var lo = kum[k - 2], hi = kum[k - 1];
      var C = Math.round((lo + (hi - lo) * a.antara(0.3, 0.7)) / 500) * 500;
      if (!(C > lo + 100 && C < hi - 100)) continue;
      var bulanLunas = (m0 + k - 1);
      var tampilBulan = function (idx) { return Fmt.BULAN[((idx % 12) + 12) % 12]; };
      var teks = 'Perusahaan ' + pt + ' membeli ' + f.barang + ' baru pada bulan ' + Fmt.BULAN[m0] + ' seharga ' + Fmt.uang(C, f.sim, 0) +
        ' dan menggunakan labanya untuk melunasi harga ' + f.barang + ' tersebut. Laba pada bulan ' + Fmt.BULAN[m0] + ' adalah ' + Fmt.uang(P0, f.sim, 0) + '.';
      var tanya = 'Jika laba setiap bulan meningkat ' + g + '% dibandingkan bulan sebelumnya, pada bulan apa harga ' + f.barang + ' akan lunas seluruhnya?';
      var tabelKum = kum.slice(0, k + 1).map(function (v, i) {
        return '• ' + tampilBulan(m0 + i) + ': ' + Fmt.uang(v, f.sim, 2, true) + (i === k - 2 ? ' (masih kurang dari ' + Fmt.uang(C, f.sim, 0) + ')' : (i === k - 1 ? ' (sudah melampaui ' + Fmt.uang(C, f.sim, 0) + ')' : ''));
      });
      var pembahasan = [
        'Laba bulanan dimulai dari ' + Fmt.uang(P0, f.sim, 0) + ' pada bulan ' + Fmt.BULAN[m0] + ' dan dikali ' + Fmt.angka(1 + g / 100, { desimal: 2 }) + ' (naik ' + g + '%) tiap bulan berikutnya. Laba yang terkumpul sampai akhir tiap bulan:'
      ].concat(tabelKum).concat(['Harga ' + f.barang + ' lunas seluruhnya pada bulan ' + tampilBulan(bulanLunas) + '.']);
      // pilihan: lima bulan berurutan dengan kunci pada posisi target (diputuskan perakit)
      return {
        jenisSoal: 'Soal Cerita - Aritmatika Keuangan',
        teks: [teks], pertanyaan: tanya, tulisKunci: true,
        bulanKunci: bulanLunas, pilihanBulan: true,
        langkah: [],
        pembahasan: pembahasan,
        model: {
          param: { P0: String(P0), g: String(g), C: String(C), m0: String(m0) },
          tampil: { P0: Fmt.angka(P0), g: g + '%', C: Fmt.angka(C) }, jenisHitung: 'lunas-bulan'
        },
        sidik: { inti: 'laba-majemuk|' + fi + '|' + [P0, g, C, m0].join(','), param: [P0, g, C, m0], entitas: fi + pt }
      };
    }
    return null;
  }

  // ====================================================== 6. pendapatan

  var FRAME_JUAL = [
    { produk: ['Produk A', 'Produk B'], sim: '$', per: 'satu minggu' },
    { produk: ['Paket Basic', 'Paket Premium'], sim: '€', per: 'satu minggu' },
    { produk: ['Model X', 'Model Y'], sim: '£', per: 'satu bulan' },
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
      var tengah = urut[1];
      var pengecoh = [
        { nilai: urut[2] - tengah, alasan: 'membandingkan pendapatan tertinggi dengan yang menengah, bukan yang terendah' },
        { nilai: tengah - urut[0], alasan: 'membandingkan pendapatan menengah dengan yang terendah' },
        { nilai: Math.abs(u[idx[2]][0] - u[idx[0]][0]) * hA + Math.abs(u[idx[2]][1] - u[idx[0]][1]) * hB, alasan: 'menjumlahkan selisih unit tanpa memperhitungkan arah selisihnya' },
        { nilai: urut[2] - urut[0] + hA, alasan: 'salah menjumlahkan satu unit produk pada salah satu penjual' },
        { nilai: urut[2] - urut[0] - hB, alasan: 'salah menjumlahkan satu unit produk pada salah satu penjual' },
        { nilai: Math.abs(urut[2] - urut[0]) / 2, alasan: 'membagi dua selisih yang benar' }
      ];
      var fm = function (v) { return Fmt.uang(v, f.sim, 2, true); };
      var pembahasan = nama.map(function (n, i) {
        var ket = i === idx[2] ? ' (tertinggi)' : (i === idx[0] ? ' (terendah)' : '');
        return 'Pendapatan ' + n + ' = ' + u[i][0] + ' × ' + fm(hA) + ' + ' + u[i][1] + ' × ' + fm(hB) + ' = ' + fm(u[i][0] * hA) + ' + ' + fm(u[i][1] * hB) + ' = ' + fm(tot[i]) + ket + '.';
      });
      pembahasan.push('Selisih = ' + fm(urut[2]) + ' - ' + fm(urut[0]) + ' = ' + fm(kunci) + '.');
      var param = { hA: String(hA), hB: String(hB) };
      var tampil = { hA: Fmt.angka(hA, { desimal: 2, tetap: true }), hB: Fmt.angka(hB, { desimal: 2, tetap: true }) };
      u.forEach(function (x, i) {
        param['a' + i] = String(x[0]); param['b' + i] = String(x[1]);
        tampil['a' + i] = String(x[0]); tampil['b' + i] = String(x[1]);
      });
      return {
        jenisSoal: 'Soal Cerita - Aritmatika Keuangan',
        teks: [teks], pertanyaan: tanya,
        kunci: kunci, fmt: fm, pengecoh: pengecoh, min: 1, desimal: 2,
        langkah: [
          { nama: 't0', rumus: 'a0*hA+b0*hB' }, { nama: 't1', rumus: 'a1*hA+b1*hB' }, { nama: 't2', rumus: 'a2*hA+b2*hB' },
          { nama: 'jawab', rumus: 'maks(t0,t1,t2)-min(t0,t1,t2)' }
        ],
        pembahasan: pembahasan,
        model: { param: param, tampil: tampil, toleransi: 0.005 },
        sidik: { inti: 'pendapatan|' + fi + '|' + [hA, hB].concat(u.reduce(function (s, x) { return s.concat(x); }, [])).join(','), param: [hA, hB].concat(u.reduce(function (s, x) { return s.concat(x); }, [])), entitas: fi + nama.join('') }
      };
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
      var pengecoh = [
        { nilai: Wb, alasan: 'menjawab jumlah ' + f.b + ' semula, bukan ' + f.a },
        { nilai: Wb + xx, alasan: 'menjawab jumlah ' + f.b + ' setelah penambahan' },
        { nilai: Rb + Wb, alasan: 'menjawab seluruh campuran semula' },
        { nilai: k, alasan: 'menjawab nilai satu bagian perbandingan (k), bukan jumlah ' + f.a },
        { nilai: xx, alasan: 'menjawab banyaknya ' + f.b + ' yang ditambahkan' },
        { nilai: Rb + xx, alasan: 'menjumlahkan ' + f.a + ' dengan ' + f.b + ' yang ditambahkan' }
      ];
      var ks = function (c) { return (c === 1 ? '' : c) + 'k'; };       // koefisien 1 tidak ditulis
      var sisaK = dd * ra - cc * rb;
      var pembahasan = [
        'Misalkan ' + f.a + ' = ' + ks(ra) + ' dan ' + f.b + ' = ' + ks(rb) + '.',
        'Setelah ' + xx + ' ' + f.sat + ' ' + f.b + ' ditambahkan: ' + ks(ra) + ' : (' + ks(rb) + ' + ' + xx + ') = ' + cc + ' : ' + dd + '.',
        'Kali silang: ' + dd + ' × ' + ks(ra) + ' = ' + cc + ' × (' + ks(rb) + ' + ' + xx + '), sehingga ' + ks(dd * ra) + ' = ' + ks(cc * rb) + ' + ' + (cc * xx) + ' dan ' + ks(sisaK) + ' = ' + (cc * xx) + '.',
        (sisaK === 1 ? 'Maka k = ' + (cc * xx) : 'Maka k = ' + (cc * xx) + ' ÷ ' + sisaK + ' = ' + k) + ', jadi ' + f.a + ' = ' + ra + ' × ' + k + ' = ' + Rb + ' ' + f.sat + '.',
        'Cek: ' + Rb + ' : (' + Wb + ' + ' + xx + ') = ' + Rb + ' : ' + (Wb + xx) + ' = ' + cc + ' : ' + dd + '.'
      ];
      return {
        jenisSoal: 'Soal Cerita - Bilangan dan Perbandingan',
        teks: [teks], pertanyaan: tanya,
        kunci: Rb, fmt: function (v) { return v + ' ' + f.sat; }, pengecoh: pengecoh, min: 1, bulat: true, desimal: 0,
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
      };
    }
    return null;
  }

  // ======================================================= 8. diskon

  var FRAME_DISKON = [
    { barang: 'laptop', sim: '$' }, { barang: 'mesin kopi', sim: '€' }, { barang: 'jaket musim dingin', sim: '£' },
    { barang: 'sepeda lipat', sim: '$' }, { barang: 'televisi', sim: '€' },
    { barang: 'printer kantor', sim: '$' }, { barang: 'kamera digital', sim: '€' }, { barang: 'mantel wol', sim: '£' },
    { barang: 'ponsel pintar', sim: '$' }, { barang: 'lemari es', sim: '€' }, { barang: 'koper kabin', sim: '£' },
    { barang: 'jam tangan', sim: '$' }, { barang: 'pengeras suara nirkabel', sim: '€' }
  ];

  function diskon(a, level) {
    var fi = a.bulat(0, FRAME_DISKON.length - 1), f = FRAME_DISKON[fi];
    for (var coba = 0; coba < 400; coba++) {
      var H = a.kelipatan(200, 2400, 50);
      var d1 = a.pilih([10, 15, 20, 25, 30, 35, 40]), d2 = a.pilih([5, 10, 15, 20, 25, 30]);
      var pajak = level === 'sulit' ? a.pilih([5, 10]) : 0;
      var akhirDiskon = H * (100 - d1) / 100 * (100 - d2) / 100;
      var akhir = akhirDiskon * (100 + pajak) / 100;
      if (Math.abs(akhir * 100 - Math.round(akhir * 100)) > 1e-6) continue;
      var tanyaHemat = level === 'sedang' && a.untung(0.5);
      var teks = 'Harga sebuah ' + f.barang + ' adalah ' + Fmt.uang(H, f.sim, 0) + '. Toko memberi diskon ' + d1 + '%, lalu diskon tambahan ' + d2 +
        '% dari harga setelah diskon pertama.' + (pajak ? ' Setelah itu, pembeli membayar pajak ' + pajak + '% dari harga setelah semua diskon.' : '');
      var tanya = tanyaHemat ? 'Berapa total penghematan yang diperoleh pembeli dibandingkan harga awal?' : 'Berapa harga yang harus dibayar pembeli?';
      var kunci = tanyaHemat ? H - akhirDiskon : akhir;
      var fm = function (v) { return Fmt.uang(v, f.sim, 2, true); };
      var gabung = H * (100 - d1 - d2) / 100 * (100 + pajak) / 100;
      var pengecoh = tanyaHemat ? [
        { nilai: H * (d1 + d2) / 100, alasan: 'menjumlahkan kedua diskon (' + (d1 + d2) + '%) lalu menghitungnya dari harga awal' },
        { nilai: akhirDiskon, alasan: 'menjawab harga yang dibayar, bukan penghematannya' },
        { nilai: H * d1 / 100, alasan: 'hanya menghitung diskon pertama' },
        { nilai: H * d2 / 100, alasan: 'menghitung diskon kedua dari harga awal' },
        { nilai: H - H * (100 - d1) / 100 * (100 - d2) / 100 + H * 0.01, alasan: 'salah membulatkan hasil perkalian diskon' }
      ] : [
        { nilai: gabung, alasan: 'menjumlahkan kedua diskon (' + (d1 + d2) + '%) lalu menghitungnya dari harga awal' },
        { nilai: H * (100 - d1) / 100 * (100 + pajak) / 100, alasan: 'hanya memakai diskon pertama' },
        { nilai: H * (100 - d1) / 100 * (100 - d2) / 100 + pajak * H / 100, alasan: 'menghitung pajak dari harga awal, bukan dari harga setelah diskon' },
        { nilai: H * (100 - d2) / 100 * (100 + pajak) / 100, alasan: 'hanya memakai diskon kedua' },
        { nilai: H * (100 - d1) / 100 * (100 - d2) / 100 * (100 + pajak) / 100 + H * 0.02, alasan: 'salah membulatkan hasil perkalian persentase' },
        { nilai: akhir + 25, alasan: 'salah menjumlahkan satu langkah hitung' }
      ];
      var pembahasan = [
        'Setelah diskon ' + d1 + '%: ' + fm(H) + ' × ' + (100 - d1) + '% = ' + fm(H * (100 - d1) / 100) + '.',
        'Setelah diskon tambahan ' + d2 + '% (dari harga tersebut): ' + fm(H * (100 - d1) / 100) + ' × ' + (100 - d2) + '% = ' + fm(akhirDiskon) + '.'
      ];
      if (pajak) pembahasan.push('Dengan pajak ' + pajak + '%: ' + fm(akhirDiskon) + ' × ' + (100 + pajak) + '% = ' + fm(akhir) + '.');
      if (tanyaHemat) pembahasan.push('Penghematan = ' + fm(H) + ' - ' + fm(akhirDiskon) + ' = ' + fm(kunci) + '.');
      return {
        jenisSoal: 'Soal Cerita - Aritmatika Keuangan',
        teks: [teks], pertanyaan: tanya,
        kunci: kunci, fmt: fm, pengecoh: pengecoh, min: 1, desimal: 2,
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
      };
    }
    return null;
  }

  // ========================================================== 9. kurs

  var FRAME_KURS = [
    { barang1: 'mesin potong', barang2: 'sensor' }, { barang1: 'unit server', barang2: 'kabel jaringan' },
    { barang1: 'kursi kantor', barang2: 'meja lipat' }, { barang1: 'komponen elektronik', barang2: 'modul kontrol' }
  ];

  function kurs(a, level) {
    var fi = a.bulat(0, FRAME_KURS.length - 1), f = FRAME_KURS[fi], pt = a.pilih(K.PERUSAHAAN);
    for (var coba = 0; coba < 400; coba++) {
      var rE = a.pilih([1.05, 1.08, 1.1, 1.12, 1.15]), rP = a.pilih([1.2, 1.25, 1.3, 1.35, 1.4]);
      var n1 = a.bulat(5, 40), n2 = a.bulat(5, 40), p1 = a.pilih([20, 25, 40, 45, 50, 60, 80, 120]), p2 = a.pilih([15, 24, 30, 35, 50, 75, 90]);
      var bentuk = level === 'mudah' ? 'satu' : (level === 'sedang' ? 'jumlah' : 'selisih');
      var dolarE = n1 * p1 * rE, dolarP = n2 * p2 * rP;
      var kunci, tanya;
      if (bentuk === 'satu') { kunci = dolarE; tanya = 'Berapa total biaya pembelian ' + f.barang1 + ' tersebut dalam dolar?'; }
      else if (bentuk === 'jumlah') { kunci = dolarE + dolarP; tanya = 'Berapa total biaya kedua pembelian tersebut dalam dolar?'; }
      else { kunci = Math.abs(dolarE - dolarP); tanya = 'Berapa selisih biaya kedua pembelian tersebut dalam dolar?'; }
      if (kunci < 300 || Math.abs(kunci * 100 - Math.round(kunci * 100)) > 1e-6) continue;
      if (bentuk === 'selisih' && Math.abs(dolarE - dolarP) < 100) continue;
      var teks = 'Kurs saat ini: 1 € = $' + Fmt.angka(rE, { desimal: 2, tetap: true }) + (bentuk === 'satu' ? '.' : ' dan 1 £ = $' + Fmt.angka(rP, { desimal: 2, tetap: true }) + '.') + ' ' +
        pt + ' membeli ' + n1 + ' ' + f.barang1 + ' seharga €' + p1 + ' per unit dari pemasok di Jerman' +
        (bentuk === 'satu' ? '.' : ' dan ' + n2 + ' ' + f.barang2 + ' seharga £' + p2 + ' per unit dari pemasok di Inggris.');
      var fm = function (v) { return Fmt.uang(v, '$', 2, true); };
      var tanpaKonversi = bentuk === 'satu' ? n1 * p1 : (bentuk === 'jumlah' ? n1 * p1 + n2 * p2 : Math.abs(n1 * p1 - n2 * p2));
      var pengecoh = [
        { nilai: tanpaKonversi, alasan: 'menjumlahkan harga dalam € dan £ tanpa mengonversinya ke dolar' },
        { nilai: bentuk === 'satu' ? n1 * p1 * rP : (bentuk === 'jumlah' ? (n1 * p1 + n2 * p2) * rE : Math.abs(n1 * p1 - n2 * p2) * rE), alasan: 'memakai kurs € untuk seluruh pembelian' },
        { nilai: bentuk === 'satu' ? n1 * p1 / rE : (bentuk === 'jumlah' ? n1 * p1 / rE + n2 * p2 / rP : Math.abs(n1 * p1 / rE - n2 * p2 / rP)), alasan: 'membagi dengan kurs, padahal harus mengalikan' },
        { nilai: bentuk === 'satu' ? p1 * rE : (bentuk === 'jumlah' ? p1 * rE + p2 * rP : Math.abs(p1 * rE - p2 * rP)), alasan: 'lupa mengalikan dengan jumlah unit' },
        { nilai: bentuk === 'satu' ? n1 * p1 * (rE + 0.1) : (bentuk === 'jumlah' ? dolarE + n2 * p2 * (rP - 0.1) : Math.abs(dolarE - dolarP) + 100), alasan: 'salah membaca angka kurs' },
        { nilai: bentuk === 'selisih' ? dolarE + dolarP : (bentuk === 'jumlah' ? Math.abs(dolarE - dolarP) : dolarE * 2), alasan: 'tertukar antara menjumlahkan dan menghitung selisih' }
      ];
      var pembahasan = ['Biaya pembelian dari Jerman = ' + n1 + ' × €' + p1 + ' = €' + Fmt.angka(n1 * p1) + '; dalam dolar = €' + Fmt.angka(n1 * p1) + ' × ' + Fmt.angka(rE, { desimal: 2, tetap: true }) + ' = ' + fm(dolarE) + '.'];
      if (bentuk !== 'satu') {
        pembahasan.push('Biaya pembelian dari Inggris = ' + n2 + ' × £' + p2 + ' = £' + Fmt.angka(n2 * p2) + '; dalam dolar = £' + Fmt.angka(n2 * p2) + ' × ' + Fmt.angka(rP, { desimal: 2, tetap: true }) + ' = ' + fm(dolarP) + '.');
        pembahasan.push((bentuk === 'jumlah' ? 'Total = ' + fm(dolarE) + ' + ' + fm(dolarP) : 'Selisih = ' + fm(Math.max(dolarE, dolarP)) + ' - ' + fm(Math.min(dolarE, dolarP))) + ' = ' + fm(kunci) + '.');
      }
      var param = { n1: String(n1), p1: String(p1), rE: String(rE) };
      var tampil = { n1: String(n1), p1: String(p1), rE: Fmt.angka(rE, { desimal: 2, tetap: true }) };
      if (bentuk !== 'satu') { param.n2 = String(n2); param.p2 = String(p2); param.rP = String(rP); tampil.n2 = String(n2); tampil.p2 = String(p2); tampil.rP = Fmt.angka(rP, { desimal: 2, tetap: true }); }
      var langkah = [{ nama: 'e', rumus: 'n1*p1*rE' }];
      if (bentuk !== 'satu') langkah.push({ nama: 'p', rumus: 'n2*p2*rP' });
      langkah.push({ nama: 'jawab', rumus: bentuk === 'satu' ? 'e' : (bentuk === 'jumlah' ? 'e+p' : 'abs(e-p)') });
      return {
        jenisSoal: 'Soal Cerita - Aritmatika Keuangan (konversi mata uang)',
        teks: [teks], pertanyaan: tanya,
        kunci: kunci, fmt: fm, pengecoh: pengecoh, min: 1, desimal: 2,
        langkah: langkah, pembahasan: pembahasan,
        model: { param: param, tampil: tampil, toleransi: 0.005 },
        sidik: { inti: 'kurs|' + fi + '|' + [n1, p1, rE, bentuk === 'satu' ? 0 : n2, bentuk === 'satu' ? 0 : p2, rP].join(','), param: [n1, p1, rE, n2, p2, rP], entitas: fi + pt }
      };
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
    { id: 'kurs', nama: 'Konversi mata uang (£, €, $)', topik: 'Aritmatika Keuangan', fn: kurs }
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

    if (spec.pilihanBulan) {
      // pilihan berupa lima bulan berurutan; kunci pada posisi target
      var target = opsi.target == null ? a.bulat(0, 4) : opsi.target;
      var daftar = [];
      for (var i = 0; i < 5; i++) daftar.push(Fmt.BULAN[((spec.bulanKunci - target + i) % 12 + 12) % 12]);
      var pil = { opsi: daftar.map(function (t, i2) { return { teks: t, nilai: ((spec.bulanKunci - target + i2) % 12 + 12) % 12, alasan: null, kunci: i2 === target }; }), kunciIndex: target };
      pil.opsi.forEach(function (o, i3) {
        if (o.kunci) return;
        var sel = i3 - target;
        o.alasan = sel < 0 ? 'terlalu cepat: pada bulan itu laba yang terkumpul belum cukup melunasi harga'
          : 'terlalu lambat: harga sudah lunas pada bulan sebelumnya';
      });
      spec.pilihanJadi = pil;
    }
    var butir = Butir.rakitPg(ctx, spec);
    if (butir) butir.model.topik = kel.topik;
    return butir;
  }

  return { KELUARGA: KELUARGA, buat: buat, nilaiKePecahan: nilaiKePecahan };
});
