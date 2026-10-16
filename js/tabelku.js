/*
 * tabelku.js — soal tabel Kemampuan Umum > Numerik.
 *
 * Tabelnya digambar sebagai SVG/PNG (stimulus berupa gambar, seperti di naskah
 * asli) dan SEMUA angka yang dihitung diambil dari sel tabel itu. Langkah hitung
 * merujuk sel dengan nama `t<baris>_<kolom>` (kolom 0 = label, data mulai dari
 * kolom 1). Validator membaca sel dari SVG yang digambar, bukan dari data yang
 * dipakai penyusun, jadi tabel yang salah gambar pun ketahuan.
 *
 *   rasio-baris        Bilangan dan Perbandingan     p : q dua baris pada satu kolom
 *   persen-gabungan    Bilangan dan Perbandingan     persentase gabungan dua kelompok
 *   pertumbuhan-tahun  Persentase dan Pertumbuhan    berapa tahun sampai melampaui
 *   rata-per-mesin     Rata-rata                     biaya rata-rata per mesin
 *   laba-persen        Aritmatika Keuangan           kenaikan laba produk
 *   tak-diketahui      Aljabar Dasar                 unit terjual yang hilang
 *   harga-satuan       Pengukuran dan Konversi       harga per cm3 / per liter dengan kurs
 *   perubahan-persen   Persentase dan Pertumbuhan    kenaikan total atau satu wilayah
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./rng.js'), require('./format.js'), require('./kamus.js'), require('./butir.js'));
    module.exports = api;
  } else {
    api = factory(root.Rng, root.Fmt, root.Kamus, root.Butir);
    root.TabelKu = api;
  }
})(typeof self !== 'undefined' ? self : this, function (Rng, Fmt, Kamus, Butir) {
  'use strict';

  var K = Kamus;
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a; }
  function a2(v) { return Fmt.angka(v, { desimal: 2, tetap: true }); }

  /** Nilai -> "p:q" paling sederhana (penyebut sampai 150). */
  function nilaiKeRasio(v) {
    for (var d = 1; d <= 150; d++) {
      var n = Math.round(v * d);
      if (Math.abs(v * d - n) < 1e-9 && n > 0) { var g = gcd(n, d); return (n / g) + ':' + (d / g); }
    }
    return Fmt.angka(v, { desimal: 3 });
  }

  function gambarTabel(model, judul) {
    return [{ id: 'tabel', jenis: 'tabel', model: model, judul: judul || model.judul || 'Tabel' }];
  }

  /** Nama variabel sel: baris data r (0-based), kolom c (0 = label). */
  function t(r, c) { return 't' + r + '_' + c; }

  // =============================================================== 1. rasio

  var TEMA_RASIO = [
    { judul: 'Staf dan Teknologi Informasi', unit: '',
      baris: [['Omzet ($)', 'omzet'], ['Staf Senior (%)', 'pct'], ['Jumlah komputer\nuntuk pengarsipan', 'pasangan'], ['Jumlah komputer\nuntuk pengolahan kata', 'pasangan'], ['Jumlah telepon', 'telp'], ['Jumlah staf', 'staf']],
      sebut: ['komputer untuk pengarsipan', 'komputer untuk pengolahan kata'], jenis: 'penerbit',
      tempat: ['Provo Publishers', 'Contra Press', 'Contenti News', 'Delta Media', 'Nusa Cetak', 'Bina Pustaka'] },
    { judul: 'Sarana Kantor Cabang', unit: '',
      baris: [['Aset (juta $)', 'omzet'], ['Pegawai tetap (%)', 'pct'], ['Jumlah teller', 'pasangan'], ['Jumlah mesin ATM', 'pasangan'], ['Jumlah kendaraan', 'telp'], ['Jumlah pegawai', 'staf']],
      sebut: ['teller', 'mesin ATM'], jenis: 'bank',
      tempat: ['Cabang Medan', 'Cabang Padang', 'Cabang Bandung', 'Cabang Semarang', 'Cabang Makassar', 'Cabang Denpasar'] },
    { judul: 'Armada dan Gudang Perusahaan Logistik', unit: '',
      baris: [['Pendapatan (juta $)', 'omzet'], ['Karyawan kontrak (%)', 'pct'], ['Jumlah truk besar', 'pasangan'], ['Jumlah truk kecil', 'pasangan'], ['Jumlah gudang', 'telp'], ['Jumlah karyawan', 'staf']],
      sebut: ['truk besar', 'truk kecil'], jenis: 'logistik',
      tempat: ['Esa Cargo', 'Fajar Trans', 'Garuda Kargo', 'Harapan Ekspedisi', 'Indah Logistik', 'Jaya Antar'] }
  ];

  function rasioBaris(a, level) {
    var ti = a.bulat(0, TEMA_RASIO.length - 1), tm = TEMA_RASIO[ti];
    var nama = a.ambil(tm.tempat, 3);
    var kolom = [''].concat(nama);
    var pasang = [];
    tm.baris.forEach(function (b, i) { if (b[1] === 'pasangan') pasang.push(i); });
    for (var coba = 0; coba < 300; coba++) {
      var maksP = level === 'mudah' ? 7 : 12;
      var p = a.bulat(1, 9), q = a.bulat(1, 9);
      if (p === q || gcd(p, q) !== 1) continue;
      var m = a.bulat(2, level === 'mudah' ? 6 : maksP + 6);
      var kol = a.bulat(0, 2);
      var data = nama.map(function (n, c) {
        var x, y;
        if (c === kol) { x = p * m; y = q * m; }
        else { x = a.bulat(3, 60); y = a.bulat(3, 220); if (x === y) y += 1; }
        return {
          omzet: a.kelipatan(1200, 38000, 100), pct: a.kelipatan(15, 70, 5), x: x, y: y,
          telp: a.bulat(20, 140), staf: a.bulat(40, 2300)
        };
      });
      var baris = tm.baris.map(function (b, i) {
        var tipe = b[1], sel = data.map(function (d) {
          if (tipe === 'pasangan') return String(i === pasang[0] ? d.x : d.y);
          return Fmt.angka(d[tipe]);
        });
        return { label: b[0], sel: sel };
      });
      var model = { judul: tm.judul, kolom: kolom, baris: baris };
      var rA = pasang[0], rB = pasang[1], cK = kol + 1;
      // pasangan terurut: yang ditanya "A : B" = baris pertama terhadap baris kedua
      var kunci = p / q, tanya = 'Berapa perbandingan antara ' + tm.sebut[0] + ' dan ' + tm.sebut[1] + ' di ' + nama[kol] + '?';
      var lain = data[(kol + 1) % 3], lain2 = data[(kol + 2) % 3];
      var pengecoh = [
        { nilai: q / p, alasan: 'urutan perbandingan terbalik (' + tm.sebut[1] + ' dibanding ' + tm.sebut[0] + ')' },
        { nilai: lain.x / lain.y, alasan: 'memakai angka dari kolom perusahaan lain' },
        { nilai: lain2.x / lain2.y, alasan: 'memakai angka dari kolom perusahaan lain' },
        { nilai: p / (p + q), alasan: 'membandingkan salah satu bagian dengan jumlah keduanya' },
        { nilai: (p + q) / q, alasan: 'membandingkan jumlah kedua bagian dengan salah satunya' },
        { nilai: p * m / data[kol].telp, alasan: 'salah membaca baris: memakai baris ' + tm.baris[4][0].toLowerCase() + ' sebagai pembanding' }
      ];
      var pembahasan = [
        'Pada kolom ' + nama[kol] + ', ' + tm.sebut[0] + ' = ' + (p * m) + ' dan ' + tm.sebut[1] + ' = ' + (q * m) + '.',
        'Perbandingan ' + (p * m) + ' : ' + (q * m) + ' = ' + p + ' : ' + q + ' (kedua bilangan dibagi ' + m + ').'
      ];
      return {
        jenisSoal: 'Tabel - Bilangan dan Perbandingan',
        judul: 'Tabel · ' + tm.judul, gambar: gambarTabel(model), teks: [], pertanyaan: tanya,
        kunci: kunci, fmt: nilaiKeRasio, pengecoh: pengecoh, min: 0.0001, tanpaPengali: true, langkahPilihan: 0.1,
        langkah: [{ nama: 'jawab', rumus: t(rA, cK) + '/' + t(rB, cK) }],
        pembahasan: pembahasan,
        model: { param: {}, tampil: {}, toleransi: 1e-9, topik: 'Bilangan dan Perbandingan', bentukJawab: 'rasio' },
        sidik: { inti: 'rasio-baris|' + ti + '|' + nama.join(',') + '|' + data.map(function (d) { return d.x + '/' + d.y; }).join(','), param: [p, q, m, kol], entitas: ti + nama.join('') }
      };
    }
    return null;
  }

  // ======================================================= 2 & 3. sektor kerja

  var SEKTOR = ['Industri', 'Perdagangan', 'Kesehatan', 'Pendidikan', 'Jasa Keuangan', 'Pertanian', 'Pemerintahan', 'Konstruksi', 'Transportasi', 'Pariwisata'];

  function tabelSektor(a, kota, jml) {
    var sektor = a.ambil(SEKTOR, jml);
    var S = [], N = [];
    for (var i = 0; i < jml; i++) { S.push(a.kelipatan(120, 620, 3) * 1000); N.push(a.kelipatan(90, 480, 3) * 1000); }
    return { sektor: sektor, S: S, N: N };
  }

  function modelSektor(kota, d) {
    var jml = d.sektor.length;
    var totS = d.S.reduce(function (x, y) { return x + y; }, 0), totN = d.N.reduce(function (x, y) { return x + y; }, 0);
    var baris = d.sektor.map(function (s, i) { return { label: s, sel: [Fmt.angka(d.S[i]), Fmt.angka(d.N[i])] }; });
    baris.push({ label: 'Jumlah', sel: [Fmt.angka(totS), Fmt.angka(totN)] });
    return { model: { judul: 'Profil Pekerjaan Sarjana dan Non-Sarjana, Distrik ' + kota, kolom: ['Sektor', 'Sarjana', 'Non-sarjana'], baris: baris }, totS: totS, totN: totN };
  }

  function persenGabungan(a, level) {
    var kota = a.pilih(K.KOTA);
    for (var coba = 0; coba < 400; coba++) {
      var jml = level === 'mudah' ? 4 : 5;
      var d = tabelSektor(a, kota, jml), ms = modelSektor(kota, d);
      var i = a.bulat(0, jml - 1);
      var tot = ms.totS + ms.totN, gab = d.S[i] + d.N[i], pers = gab / tot * 100;
      var frac = Math.abs(pers - Math.round(pers));
      if (frac > 0.35 && frac < 0.65) continue;
      if (pers < 6 || pers > 40) continue;
      var kunci = Math.round(pers);
      var tanya = 'Kira-kira berapa persentase dari seluruh sarjana dan non-sarjana yang bekerja di sektor ' + d.sektor[i] + '?';
      var pS = d.S[i] / ms.totS * 100, pN = d.N[i] / ms.totN * 100;
      var pengecoh = [
        { nilai: pS, alasan: 'hanya menghitung porsi kelompok sarjana' },
        { nilai: pN, alasan: 'hanya menghitung porsi kelompok non-sarjana' },
        { nilai: (pS + pN) / 2, alasan: 'merata-ratakan dua persentase kelompok yang jumlah orangnya berbeda' },
        { nilai: gab / ms.totS * 100, alasan: 'membagi jumlah kedua kelompok dengan jumlah sarjana saja' },
        { nilai: gab / ms.totN * 100, alasan: 'membagi jumlah kedua kelompok dengan jumlah non-sarjana saja' },
        { nilai: d.S[i] / d.N[i] * 100, alasan: 'membandingkan sarjana dengan non-sarjana di sektor itu' }
      ];
      var r = i, cS = 1, cN = 2, rT = jml;
      var pembahasan = [
        'Sektor ' + d.sektor[i] + ': sarjana ' + Fmt.angka(d.S[i]) + ' + non-sarjana ' + Fmt.angka(d.N[i]) + ' = ' + Fmt.angka(gab) + ' orang.',
        'Seluruh sarjana dan non-sarjana: ' + Fmt.angka(ms.totS) + ' + ' + Fmt.angka(ms.totN) + ' = ' + Fmt.angka(tot) + ' orang.',
        'Persentase = ' + Fmt.angka(gab) + ' ÷ ' + Fmt.angka(tot) + ' × 100% = ' + Fmt.angka(pers, { desimal: 1 }) + '%, kira-kira ' + kunci + '%.'
      ];
      return {
        jenisSoal: 'Tabel - Bilangan dan Perbandingan',
        judul: 'Tabel · ' + ms.model.judul, gambar: gambarTabel(ms.model), teks: [], pertanyaan: tanya,
        kunci: kunci, fmt: function (v) { return Fmt.angka(v, { desimal: 0 }) + '%'; }, pengecoh: pengecoh.map(function (p) { return { nilai: Math.round(p.nilai), alasan: p.alasan }; }),
        min: 1, bulat: true, desimal: 0,
        langkah: [
          { nama: 'gab', rumus: t(r, cS) + '+' + t(r, cN) }, { nama: 'total', rumus: t(rT, cS) + '+' + t(rT, cN) },
          { nama: 'jawab', rumus: 'bulat(gab/total*100)' }
        ],
        pembahasan: pembahasan,
        model: { param: {}, tampil: {}, toleransi: 0, topik: 'Bilangan dan Perbandingan', kira: true, cekJumlah: { baris: jml, kolom: [1, 2] } },
        sidik: { inti: 'persen-gabungan|' + kota + '|' + d.S.join(',') + '|' + d.N.join(',') + '|' + i, param: d.S.concat(d.N, [i]), entitas: kota }
      };
    }
    return null;
  }

  function pertumbuhanTahun(a, level, opsi) {
    var kota = a.pilih(K.KOTA);
    for (var coba = 0; coba < 800; coba++) {
      var jml = 4;
      var d = tabelSektor(a, kota, jml), ms = modelSektor(kota, d);
      var i = a.bulat(0, jml - 1);
      var arah = a.untung(0.5) ? 'turun' : 'naik';
      var p = a.pilih(level === 'mudah' ? [10, 20, 25] : [8, 10, 12, 15, 20, 25]);
      var S = d.S[i], N = d.N[i], n = 0;
      var tg = opsi && opsi.target != null ? opsi.target : 0;
      var maksTahun = Math.max(level === 'mudah' ? 4 : 7, tg + 2);
      var akhir = null;
      if (arah === 'turun') {
        if (!(S > N)) continue;
        var x = S;
        while (x >= N && n < 12) { x = x * (100 - p) / 100; n++; }
        akhir = [x, N];
      } else {
        if (!(N < S)) continue;
        var y = N;
        while (y <= S && n < 12) { y = y * (100 + p) / 100; n++; }
        akhir = [S, y];
      }
      if (n < Math.max(2, tg + 1) || n > maksTahun) continue;
      // margin: tahun n-1 belum melampaui dengan selisih jelas, tahun n sudah melampaui dengan selisih jelas
      var seb = arah === 'turun' ? S * Math.pow((100 - p) / 100, n - 1) : N * Math.pow((100 + p) / 100, n - 1);
      var sesudah = arah === 'turun' ? S * Math.pow((100 - p) / 100, n) : N * Math.pow((100 + p) / 100, n);
      var rujuk = arah === 'turun' ? N : S;
      if (Math.abs(seb - rujuk) / rujuk < 0.012 || Math.abs(sesudah - rujuk) / rujuk < 0.012) continue;
      var tanya = arah === 'turun'
        ? 'Jika diperkirakan jumlah sarjana yang bekerja di sektor ' + d.sektor[i] + ' tiap tahunnya turun sebesar ' + p + '% sementara jumlah non-sarjana diperkirakan tetap sama, berapa tahun yang dibutuhkan karyawan non-sarjana untuk melampaui jumlah karyawan sarjana di sektor ' + d.sektor[i] + '?'
        : 'Jika jumlah sarjana yang bekerja di sektor ' + d.sektor[i] + ' tetap sama sementara jumlah non-sarjana naik sebesar ' + p + '% per tahun, berapa tahun yang dibutuhkan jumlah non-sarjana untuk melampaui jumlah sarjana yang bekerja di sektor ' + d.sektor[i] + '?';
      var baris = [];
      for (var k = Math.max(1, n - 2); k <= n; k++) {
        var vv = arah === 'turun' ? S * Math.pow((100 - p) / 100, k) : N * Math.pow((100 + p) / 100, k);
        baris.push('• Tahun ke-' + k + ': ' + Fmt.angka(vv, { desimal: 0 }) + (k === n ? ' (sudah ' + (arah === 'turun' ? 'di bawah ' + Fmt.angka(N) : 'melampaui ' + Fmt.angka(S)) + ')' : ' (belum)'));
      }
      var pembahasan = [
        'Sektor ' + d.sektor[i] + ': sarjana ' + Fmt.angka(S) + ', non-sarjana ' + Fmt.angka(N) + '. ' +
        (arah === 'turun' ? 'Jumlah sarjana turun ' + p + '% per tahun, artinya dikali ' + Fmt.angka((100 - p) / 100, { desimal: 2 }) + ':' : 'Jumlah non-sarjana naik ' + p + '% per tahun, artinya dikali ' + Fmt.angka((100 + p) / 100, { desimal: 2 }) + ':')
      ].concat(baris).concat(['Jadi dibutuhkan ' + n + ' tahun.']);
      // pilihan: lima bilangan bulat berurutan, kunci pada posisi target
      var tg = null;
      return {
        jenisSoal: 'Tabel - Persentase dan Pertumbuhan',
        judul: 'Tabel · ' + ms.model.judul, gambar: gambarTabel(ms.model), teks: [], pertanyaan: tanya,
        pilihanBerurutan: { kunci: n, awalMin: 1 },
        langkah: [], pembahasan: pembahasan,
        model: {
          param: { p: String(p) }, tampil: { p: p + '%' }, toleransi: 0, jenisHitung: 'tahun-lampaui',
          sel: { s: t(i, 1), n: t(i, 2) }, arah: arah, topik: 'Persentase dan Pertumbuhan'
        },
        sidik: { inti: 'pertumbuhan-tahun|' + kota + '|' + d.S.join(',') + '|' + d.N.join(',') + '|' + i + '|' + arah + '|' + p, param: d.S.concat(d.N, [i, p]), entitas: kota }
      };
    }
    return null;
  }

  // ============================================================ 4. per mesin

  var TEMA_MESIN = [
    { judul: 'Biaya Produksi per Lini Produk dan Bulan', kolom: ['Lini A', 'Lini B', 'Lini C'], unit: 'unit' },
    { judul: 'Biaya Operasional per Pabrik dan Bulan', kolom: ['Pabrik Barat', 'Pabrik Tengah', 'Pabrik Timur'], unit: 'unit' },
    { judul: 'Biaya Pencetakan per Unit Usaha dan Bulan', kolom: ['Unit Usaha 1', 'Unit Usaha 2', 'Unit Usaha 3'], unit: 'lembar' }
  ];

  function ratarataMesin(a, level) {
    var ti = a.bulat(0, TEMA_MESIN.length - 1), tm = TEMA_MESIN[ti];
    var bulan = a.ambil(['Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober'], 2).sort(function (x, y) { return Fmt.BULAN.indexOf(x) - Fmt.BULAN.indexOf(y); });
    for (var coba = 0; coba < 600; coba++) {
      // data per bulan per lini: unit (ribu), biaya per unit ($ dengan 2 desimal), mesin
      var dat = bulan.map(function () {
        return tm.kolom.map(function () {
          var unit = a.bulat(150, 950), cpu = a.bulat(40, 95) / 100;
          var total = Math.round(unit * 1000 * cpu);
          var div = [];
          for (var m = 12; m <= 220; m++) if (total % m === 0) div.push(m);
          if (!div.length) return null;
          return { unit: unit, cpu: cpu, total: total, mesin: a.pilih(div) };
        });
      });
      if (dat.some(function (b) { return b.some(function (x) { return !x; }); })) continue;
      var bi = a.bulat(0, 1), bentuk = level === 'mudah' ? 'selisih' : a.pilih(['selisih', 'seluruh']);
      var baris = [];
      bulan.forEach(function (bn, bj) {
        baris.push({ label: bn + ': unit dihasilkan\n(ribu ' + tm.unit + ')', sel: dat[bj].map(function (x) { return Fmt.angka(x.unit); }) });
        baris.push({ label: bn + ': biaya rata-rata\nper ' + tm.unit + ' ($)', sel: dat[bj].map(function (x) { return a2(x.cpu); }) });
        baris.push({ label: bn + ': jumlah mesin\nyang digunakan', sel: dat[bj].map(function (x) { return String(x.mesin); }) });
      });
      var model = { judul: tm.judul, kolom: [''].concat(tm.kolom), baris: baris, catatan: ['Biaya total tiap lini = unit yang dihasilkan × biaya rata-rata per ' + tm.unit + '. Jumlah unit pada tabel dalam ribuan.'] };
      var rU = bi * 3, rC = bi * 3 + 1, rM = bi * 3 + 2;
      var d = dat[bi];
      var perMesin = d.map(function (x) { return x.total / x.mesin; });
      var kunci, tanya, langkah, pembahasan, pengecoh;
      if (bentuk === 'selisih') {
        var ia = a.bulat(0, 2), ib = (ia + a.bulat(1, 2)) % 3;
        kunci = Math.abs(perMesin[ia] - perMesin[ib]);
        if (kunci < 30) continue;
        var hi = perMesin[ia] >= perMesin[ib] ? ia : ib, lo = hi === ia ? ib : ia;
        tanya = 'Berapa selisih biaya rata-rata per mesin yang digunakan antara ' + tm.kolom[ia] + ' dan ' + tm.kolom[ib] + ' pada bulan ' + bulan[bi] + '?';
        langkah = [
          { nama: 'ta', rumus: t(rU, ia + 1) + '*1000*' + t(rC, ia + 1) }, { nama: 'tb', rumus: t(rU, ib + 1) + '*1000*' + t(rC, ib + 1) },
          { nama: 'jawab', rumus: 'abs(ta/' + t(rM, ia + 1) + '-tb/' + t(rM, ib + 1) + ')' }
        ];
        pembahasan = [
          'Biaya total tiap lini = unit yang dihasilkan (tabel dalam ribuan) × biaya rata-rata per unit. Biaya per mesin = biaya total ÷ jumlah mesin.',
          bulan[bi] + ', ' + tm.kolom[ia] + ': ' + Fmt.angka(d[ia].unit * 1000) + ' × $' + a2(d[ia].cpu) + ' = $' + Fmt.angka(d[ia].total) + '; dibagi ' + d[ia].mesin + ' mesin = $' + Fmt.angka(perMesin[ia]) + ' per mesin.',
          bulan[bi] + ', ' + tm.kolom[ib] + ': ' + Fmt.angka(d[ib].unit * 1000) + ' × $' + a2(d[ib].cpu) + ' = $' + Fmt.angka(d[ib].total) + '; dibagi ' + d[ib].mesin + ' mesin = $' + Fmt.angka(perMesin[ib]) + ' per mesin.',
          'Selisih = $' + Fmt.angka(Math.max(perMesin[ia], perMesin[ib])) + ' - $' + Fmt.angka(Math.min(perMesin[ia], perMesin[ib])) + ' = $' + Fmt.angka(kunci) + '.'
        ];
        pengecoh = [
          { nilai: Math.abs(d[ia].total - d[ib].total), alasan: 'menghitung selisih biaya total, bukan biaya per mesin' },
          { nilai: Math.abs(d[ia].cpu - d[ib].cpu) * 1000, alasan: 'menghitung selisih biaya per unit' },
          { nilai: perMesin[ia] + perMesin[ib], alasan: 'menjumlahkan biaya per mesin kedua lini, bukan mencari selisihnya' },
          { nilai: Math.abs(d[ia].total / d[ia].mesin - d[ib].total / d[ia].mesin), alasan: 'membagi kedua biaya total dengan jumlah mesin lini yang sama' },
          { nilai: Math.abs(d[ia].unit * 1000 / d[ia].mesin - d[ib].unit * 1000 / d[ib].mesin), alasan: 'tidak mengalikan jumlah unit dengan biaya per unit' },
          { nilai: perMesin[hi], alasan: 'menjawab biaya per mesin lini yang lebih besar saja' }
        ];
      } else {
        var totB = d.reduce(function (s, x) { return s + x.total; }, 0), totM = d.reduce(function (s, x) { return s + x.mesin; }, 0);
        var pr = totB / totM;
        if (Math.abs(pr - Math.floor(pr) - 0.5) < 0.12) continue;
        kunci = Math.round(pr);
        if (kunci < 200) continue;
        tanya = 'Berapa biaya rata-rata per mesin yang digunakan di seluruh lini pada bulan ' + bulan[bi] + '?';
        langkah = [
          { nama: 'b0', rumus: t(rU, 1) + '*1000*' + t(rC, 1) }, { nama: 'b1', rumus: t(rU, 2) + '*1000*' + t(rC, 2) }, { nama: 'b2', rumus: t(rU, 3) + '*1000*' + t(rC, 3) },
          { nama: 'jawab', rumus: 'bulat((b0+b1+b2)/(' + t(rM, 1) + '+' + t(rM, 2) + '+' + t(rM, 3) + '))' }
        ];
        pembahasan = [
          bulan[bi] + ', biaya total tiap lini = unit (ribuan) × biaya rata-rata per unit:'
        ].concat(d.map(function (x, k) { return '• ' + tm.kolom[k] + ': ' + Fmt.angka(x.unit * 1000) + ' × $' + a2(x.cpu) + ' = $' + Fmt.angka(x.total) + ' (' + x.mesin + ' mesin)'; }))
          .concat(['Biaya total = $' + Fmt.angka(totB) + '; jumlah mesin = ' + d.map(function (x) { return x.mesin; }).join(' + ') + ' = ' + totM + '.',
            'Biaya rata-rata per mesin seluruh lini = $' + Fmt.angka(totB) + ' ÷ ' + totM + ' ≈ $' + Fmt.angka(pr, { desimal: 1 }) + ', dibulatkan $' + Fmt.angka(kunci) + '.']);
        var rataTiga = perMesin.reduce(function (s, x) { return s + x; }, 0) / 3;
        pengecoh = [
          { nilai: Math.round(rataTiga), alasan: 'merata-ratakan biaya per mesin tiap lini tanpa memperhitungkan jumlah mesin masing-masing' },
          { nilai: Math.round(perMesin[0]), alasan: 'hanya memakai ' + tm.kolom[0] },
          { nilai: Math.round(perMesin[2]), alasan: 'hanya memakai ' + tm.kolom[2] },
          { nilai: Math.round(totB / d[1].mesin), alasan: 'membagi biaya total seluruh lini dengan jumlah mesin satu lini saja' },
          { nilai: Math.round(totB / 3), alasan: 'membagi biaya total dengan jumlah lini, bukan jumlah mesin' },
          { nilai: Math.round(d.reduce(function (s, x) { return s + x.cpu * 1000; }, 0) / 3), alasan: 'merata-ratakan biaya per unit, bukan biaya per mesin' }
        ];
      }
      return {
        jenisSoal: 'Tabel - Rata-rata',
        judul: 'Tabel · ' + tm.judul, gambar: gambarTabel(model), teks: [], pertanyaan: tanya,
        kunci: kunci, fmt: function (v) { return Fmt.angka(v, { desimal: 0 }); }, pengecoh: pengecoh.map(function (p) { return { nilai: Math.round(p.nilai), alasan: p.alasan }; }),
        min: 1, bulat: true, desimal: 0,
        langkah: langkah, pembahasan: pembahasan,
        model: { param: {}, tampil: {}, toleransi: 0.0001, topik: 'Rata-rata', kira: bentuk === 'seluruh' },
        sidik: { inti: 'rata-per-mesin|' + ti + '|' + bulan.join(',') + '|' + bentuk + '|' + bi + '|' + dat.map(function (b) { return b.map(function (x) { return x.unit + '/' + x.cpu + '/' + x.mesin; }).join(';'); }).join('|'), param: [ti, bi].concat(dat.reduce(function (h, b) { return h.concat(b.reduce(function (k, x) { return k.concat([x.unit, x.cpu, x.mesin]); }, [])); }, [])), entitas: ti + bulan.join('') }
      };
    }
    return null;
  }

  // ============================================================ 5. laba persen

  var TEMA_PRODUK = [
    { judul: 'Hasil Produksi ABC Products Inc.', produk: ['Produk A', 'Produk B', 'Produk C'] },
    { judul: 'Hasil Produksi Pabrik Alat Rumah Tangga', produk: ['Setrika', 'Blender', 'Dispenser'] },
    { judul: 'Hasil Produksi Konveksi Nusantara', produk: ['Kemeja', 'Celana', 'Jaket'] }
  ];

  function labaPersen(a, level) {
    var ti = a.bulat(0, TEMA_PRODUK.length - 1), tm = TEMA_PRODUK[ti];
    for (var coba = 0; coba < 2000; coba++) {
      var u0 = a.pilih([1.5, 2, 2.5, 3, 3.25, 4, 4.5]);
      var M = a.pilih([120, 150, 180, 200, 210, 240]);
      var q = a.pilih(level === 'mudah' ? [50, 100, 200] : [60, 100, 120, 150, 200, 250, 300]);
      var N = a.pilih([200, 220, 240, 250, 260, 280, 300]);
      if (N <= M) continue;
      var u1 = M * u0 * (100 + q) / 100 / N;
      if (Math.abs(u1 * 100 - Math.round(u1 * 100)) > 1e-9 || !(u1 > u0)) continue;
      var L = a.bulat(300, 900) / 100, B = a.bulat(100, 400) / 100, P = a.bulat(10, 60) / 100;
      var Lbaru = Math.round((L - (u1 - u0)) * 100) / 100;
      if (Lbaru < 0.8) continue;
      var tot2 = L + B + P, harga2 = Math.round((tot2 + u0) * 100) / 100;
      // dua produk lain sebagai latar tabel
      var harga = [a.pilih([8.5, 10, 12.5, 14, 15.75, 18]), a.pilih([9, 11.25, 13, 16.5, 19.5, 22]), harga2];
      var prod = [a.kelipatan(120, 360, 10), a.kelipatan(150, 400, 10), M];
      var Ls = [0, 1].map(function (k) { return a.bulat(150, Math.round(harga[k] * 100 * 0.5)) / 100; });
      var Bs = [0, 1].map(function (k) { return a.bulat(100, Math.round(harga[k] * 100 * 0.25)) / 100; });
      var Ps = [0, 1].map(function () { return a.bulat(10, 60) / 100; });
      var Lall = Ls.concat([L]), Ball = Bs.concat([B]), Pall = Ps.concat([P]);
      var tot = [0, 1, 2].map(function (k) { return Math.round((Lall[k] + Ball[k] + Pall[k]) * 100) / 100; });
      if (tot[0] >= harga[0] || tot[1] >= harga[1]) continue;
      var kunci = q;
      var baris = [
        { label: 'Harga jual per unit ($)', sel: harga.map(a2) },
        { label: 'Produksi maksimum¹ (unit)', sel: prod.map(function (x) { return String(x); }) },
        { label: 'Total biaya per unit ($)', sel: tot.map(a2) },
        { label: 'Biaya tenaga kerja ($)', sel: Lall.map(a2) },
        { label: 'Biaya bahan baku ($)', sel: Ball.map(a2) },
        { label: 'Biaya pengiriman ($)', sel: Pall.map(a2) }
      ];
      var model = { judul: tm.judul, kolom: [''].concat(tm.produk), baris: baris,
        catatan: ['¹Produksi maksimum adalah jumlah unit terbanyak yang dapat diproduksi dalam satu bulan.', 'Selisih antara harga jual dan total biaya per unit merupakan laba perusahaan untuk setiap unit.'] };
      var tanya = 'Jika metode produksi baru memungkinkan biaya tenaga kerja ' + tm.produk[2] + ' turun menjadi $' + a2(Lbaru) + ' per unit sekaligus meningkatkan produksi maksimum menjadi ' + N + ' unit per bulan, berapa persentase kenaikan laba perusahaan dari produk tersebut?';
      var laba0 = M * u0, laba1 = N * u1;
      var pengecoh = [
        { nilai: (u1 - u0) / u0 * 100, alasan: 'hanya membandingkan laba per unit, tanpa memperhitungkan perubahan jumlah produksi' },
        { nilai: q + 100, alasan: 'menjawab laba baru sebagai persen dari laba lama (' + (q + 100) + '%), bukan kenaikannya' },
        { nilai: (N / M - 1) * 100, alasan: 'hanya memperhitungkan kenaikan produksi maksimum' },
        { nilai: (L - Lbaru) / L * 100, alasan: 'menghitung penurunan biaya tenaga kerja, bukan kenaikan laba' },
        { nilai: (laba1 - laba0) / laba1 * 100, alasan: 'menghitung kenaikan terhadap laba baru, bukan terhadap laba lama' },
        { nilai: (N * (harga2 - Lbaru) - M * (harga2 - L)) / (M * (harga2 - L)) * 100, alasan: 'mengabaikan biaya bahan baku dan pengiriman saat menghitung laba' }
      ];
      var pembahasan = [
        tm.produk[2] + ' sebelumnya: biaya per unit = $' + a2(L) + ' + $' + a2(B) + ' + $' + a2(P) + ' = $' + a2(tot2) + '; laba per unit = $' + a2(harga2) + ' - $' + a2(tot2) + ' = $' + a2(u0) + '. Dengan produksi maksimum ' + M + ' unit, laba = ' + M + ' × $' + a2(u0) + ' = $' + Fmt.angka(laba0, { desimal: 2 }) + '.',
        'Metode baru: biaya per unit = $' + a2(Lbaru) + ' + $' + a2(B) + ' + $' + a2(P) + ' = $' + a2(Lbaru + B + P) + '; laba per unit = $' + a2(harga2) + ' - $' + a2(Lbaru + B + P) + ' = $' + a2(u1) + '. Dengan ' + N + ' unit, laba = ' + N + ' × $' + a2(u1) + ' = $' + Fmt.angka(laba1, { desimal: 2 }) + '.',
        'Kenaikan laba = ($' + Fmt.angka(laba1, { desimal: 2 }) + ' - $' + Fmt.angka(laba0, { desimal: 2 }) + ') ÷ $' + Fmt.angka(laba0, { desimal: 2 }) + ' × 100% = ' + kunci + '%.'
      ];
      return {
        jenisSoal: 'Tabel - Aritmatika Keuangan',
        judul: 'Tabel · ' + tm.judul, gambar: gambarTabel(model), teks: [], pertanyaan: tanya,
        kunci: kunci, fmt: function (v) { return Fmt.angka(v, { desimal: 0 }) + '%'; }, pengecoh: pengecoh.map(function (p) { return { nilai: Math.round(p.nilai), alasan: p.alasan }; }),
        min: 1, bulat: true, desimal: 0,
        langkah: [
          { nama: 'u0', rumus: 't0_3-t2_3' }, { nama: 'laba0', rumus: 't1_3*u0' },
          { nama: 'u1', rumus: 't0_3-(L+t4_3+t5_3)' }, { nama: 'laba1', rumus: 'N*u1' },
          { nama: 'jawab', rumus: '(laba1-laba0)/laba0*100' }
        ],
        pembahasan: pembahasan,
        model: { param: { L: String(Lbaru), N: String(N) }, tampil: { L: a2(Lbaru), N: String(N) }, toleransi: 1e-9, topik: 'Aritmatika Keuangan', cekTotalBiaya: { total: 2, bagian: [3, 4, 5], kolom: [1, 2, 3] } },
        sidik: { inti: 'laba-persen|' + ti + '|' + harga.join(',') + '|' + prod.join(',') + '|' + Lall.join(',') + '|' + Ball.join(',') + '|' + Pall.join(',') + '|' + Lbaru + '|' + N, param: harga.concat(prod, [Lbaru, N]), entitas: String(ti) }
      };
    }
    return null;
  }

  // ===================================================== 6. tak diketahui

  var TEMA_RV = [
    { judul: 'Data Penjualan ABC RV Sales', objek: 'RV', model: ['Treeline', 'Lumberman', 'Highland'], unitKata: 'unit' },
    { judul: 'Data Penjualan Diler Motor Sejahtera', objek: 'motor', model: ['Tipe Sport', 'Tipe Matik', 'Tipe Trail'], unitKata: 'unit' },
    { judul: 'Data Penjualan Toko Elektronik Prima', objek: 'peralatan', model: ['Kulkas', 'Mesin Cuci', 'Pendingin Ruangan'], unitKata: 'unit' }
  ];

  function takDiketahui(a, level) {
    var ti = a.bulat(0, TEMA_RV.length - 1), tm = TEMA_RV[ti];
    for (var coba = 0; coba < 3000; coba++) {
      var harga = [a.kelipatan(24, 60, 1) * 1000, a.kelipatan(30, 70, 1) * 1000, a.kelipatan(18, 52, 1) * 1000];
      var laba = [a.bulat(14, 28), a.bulat(14, 28), a.bulat(14, 28)];
      var bonus = [a.bulat(5, 10), a.bulat(5, 10), a.bulat(5, 10)];
      var unit = [a.bulat(8, 22), a.bulat(8, 22), a.bulat(5, 25)];
      var gar = [a.bulat(2, 9), a.bulat(2, 9), a.bulat(2, 9)];
      var x = unit[2];
      var tot = 0;
      for (var k = 0; k < 3; k++) tot += harga[k] * laba[k] / 100 * unit[k] + harga[k] * bonus[k] / 100 * gar[k];
      if (Math.abs(tot - Math.round(tot)) > 1e-6) continue;
      if (x < 6 || x > 24 || gar[2] > x) continue;
      var kunci = x;
      var baris = [
        { label: 'Harga jual ($)', sel: harga.map(function (v) { return Fmt.angka(v); }) },
        { label: 'Laba¹ (%)', sel: laba.map(String) },
        { label: 'Bonus garansi² (%)', sel: bonus.map(String) },
        { label: 'Unit terjual', sel: [String(unit[0]), String(unit[1]), '?'] },
        { label: 'Jumlah garansi', sel: gar.map(String) }
      ];
      var model = { judul: tm.judul, kolom: [''].concat(tm.model), baris: baris,
        catatan: ['¹Persentase harga jual yang menjadi laba. ²Persentase harga jual yang diberikan untuk setiap garansi yang terjual.'] };
      var tanya = 'Jika pemilik mengetahui bahwa total laba perusahaan, termasuk bonus garansi, adalah $' + Fmt.angka(tot) + ' untuk tahun tersebut, berapa unit ' + tm.model[2] + ' yang terjual?';
      var tanpaBonus = tot - harga[2] * bonus[2] / 100 * gar[2];
      var dikenal = (harga[0] * laba[0] / 100 * unit[0] + harga[0] * bonus[0] / 100 * gar[0]) + (harga[1] * laba[1] / 100 * unit[1] + harga[1] * bonus[1] / 100 * gar[1]);
      var perUnit2 = harga[2] * laba[2] / 100;
      var pengecoh = [
        { nilai: (tot - dikenal) / perUnit2, alasan: 'mengabaikan bonus garansi ' + tm.model[2] + ' saat menghitung laba' },
        { nilai: (tot - (harga[0] * laba[0] / 100 * unit[0]) - (harga[1] * laba[1] / 100 * unit[1])) / perUnit2, alasan: 'mengabaikan seluruh bonus garansi dan hanya memakai laba per unit' },
        { nilai: (tot - dikenal) / (harga[2] * (laba[2] + bonus[2]) / 100), alasan: 'menjumlahkan persentase laba dan bonus garansi untuk semua unit' },
        { nilai: x + 1, alasan: 'terlalu besar satu unit: salah membulatkan hasil pembagian' },
        { nilai: x - 1, alasan: 'terlalu kecil satu unit: salah membulatkan hasil pembagian' }
      ];
      var fmUsd = function (v) { return '$' + Fmt.angka(v); };
      var pembahasan = [0, 1].map(function (k) {
        return tm.model[k] + ': laba ' + laba[k] + '% × ' + fmUsd(harga[k]) + ' = ' + fmUsd(harga[k] * laba[k] / 100) + ' per unit × ' + unit[k] + ' unit = ' + fmUsd(harga[k] * laba[k] / 100 * unit[k]) + '. Bonus garansi ' + bonus[k] + '% × ' + fmUsd(harga[k]) + ' = ' + fmUsd(harga[k] * bonus[k] / 100) + ' × ' + gar[k] + ' garansi = ' + fmUsd(harga[k] * bonus[k] / 100 * gar[k]) + '.';
      });
      pembahasan.push(tm.model[2] + ': bonus garansi ' + bonus[2] + '% × ' + fmUsd(harga[2]) + ' = ' + fmUsd(harga[2] * bonus[2] / 100) + ' × ' + gar[2] + ' garansi = ' + fmUsd(harga[2] * bonus[2] / 100 * gar[2]) + '. Laba per unit ' + laba[2] + '% × ' + fmUsd(harga[2]) + ' = ' + fmUsd(perUnit2) + '; misalkan terjual x unit, labanya ' + Fmt.angka(perUnit2) + 'x.');
      pembahasan.push('Total laba: ' + fmUsd(dikenal) + ' + ' + fmUsd(harga[2] * bonus[2] / 100 * gar[2]) + ' + ' + Fmt.angka(perUnit2) + 'x = ' + fmUsd(tot) + ', sehingga ' + Fmt.angka(perUnit2) + 'x = ' + fmUsd(tot - dikenal - harga[2] * bonus[2] / 100 * gar[2]) + ' dan x = ' + x + ' unit.');
      return {
        jenisSoal: 'Tabel - Aljabar Dasar',
        judul: 'Tabel · ' + tm.judul, gambar: gambarTabel(model), teks: [], pertanyaan: tanya,
        kunci: kunci, fmt: function (v) { return Fmt.angka(v, { desimal: 0 }); }, pengecoh: pengecoh.map(function (p) { return { nilai: Math.round(p.nilai), alasan: p.alasan }; }),
        min: 1, bulat: true, desimal: 0, tanpaPengali: false,
        langkah: [
          { nama: 'lain', rumus: 't0_1*t1_1/100*t3_1+t0_1*t2_1/100*t4_1+t0_2*t1_2/100*t3_2+t0_2*t2_2/100*t4_2' },
          { nama: 'garansi', rumus: 't0_3*t2_3/100*t4_3' },
          { nama: 'jawab', rumus: '(Total-lain-garansi)/(t0_3*t1_3/100)' }
        ],
        pembahasan: pembahasan,
        model: { param: { Total: String(tot) }, tampil: { Total: Fmt.angka(tot) }, toleransi: 1e-9, topik: 'Aljabar Dasar' },
        sidik: { inti: 'tak-diketahui|' + ti + '|' + harga.join(',') + '|' + laba.join(',') + '|' + bonus.join(',') + '|' + unit.join(',') + '|' + gar.join(','), param: harga.concat(laba, bonus, unit, gar), entitas: String(ti) }
      };
    }
    return null;
  }

  // ======================================================= 7. harga per satuan

  function hargaSatuan(a, level) {
    for (var coba = 0; coba < 3000; coba++) {
      var dalam = a.pilih([0.4, 0.5, 0.5, 0.6]);
      var tinggi = [a.pilih([0.5, 0.6, 0.75]), a.pilih([0.8, 0.9, 1]), a.pilih([1.05, 1.2, 1.25, 1.5])];
      var lebar = [a.pilih([0.6, 0.8, 1]), a.pilih([1, 1.2, 1.25]), a.pilih([1.4, 1.5, 1.6, 1.8])];
      var u = a.pilih([0.0002, 0.0004, 0.0005, 0.0006, 0.0008, 0.001]);
      var vol = tinggi.map(function (h, i) { return Math.round(h * lebar[i] * dalam * 1e6); });
      var harga = vol.map(function (v, i) { return Math.round(v * u * (i === 2 ? 1 : a.antara(0.9, 1.15))); });
      if (Math.abs(vol[2] * u - Math.round(vol[2] * u)) > 1e-9) continue;
      harga[2] = Math.round(vol[2] * u);
      if (!(vol[0] < vol[1] && vol[1] < vol[2])) continue;
      if (harga[2] < 150 || harga[2] > 2000) continue;
      var bentuk = level === 'mudah' ? 'cm3' : a.pilih(['cm3', 'liter', 'dolar']);
      var kurs = a.pilih([1.2, 1.25, 1.3, 1.4]);
      var kunci, tanya, sat, desimal;
      var perCm3 = harga[2] / vol[2];
      if (bentuk === 'cm3') { kunci = perCm3; tanya = 'Untuk tangki ikan terbesar, berapa harga satu sentimeter kubik?'; sat = '£'; desimal = 5; }
      else if (bentuk === 'liter') { kunci = perCm3 * 1000; tanya = 'Untuk tangki ikan terbesar, berapa harga satu liter (1 liter = 1.000 cm³)?'; sat = '£'; desimal = 3; }
      else { kunci = perCm3 * kurs; tanya = 'Jika 1 £ = $' + a2(kurs) + ', berapa harga satu sentimeter kubik untuk tangki ikan terbesar dalam dolar?'; sat = '$'; desimal = 5; }
      var fm = function (v) { return sat + Fmt.angka(v, { desimal: desimal }); };
      if (Math.abs(kunci * Math.pow(10, desimal) - Math.round(kunci * Math.pow(10, desimal))) > 1e-6) continue;
      if (kunci <= 0) continue;
      var baris = [
        { label: 'Tangki kecil', sel: [a2(tinggi[0]), a2(lebar[0]), Fmt.angka(harga[0])] },
        { label: 'Tangki sedang', sel: [a2(tinggi[1]), a2(lebar[1]), Fmt.angka(harga[1])] },
        { label: 'Tangki besar', sel: [a2(tinggi[2]), a2(lebar[2]), Fmt.angka(harga[2])] }
      ];
      var model = { judul: 'Harga Tangki Ikan, Tropical Fish Tanks Ltd', kolom: ['', 'Tinggi (m)', 'Lebar (m)', 'Harga (£)'], baris: baris, catatan: ['Semua tangki berkedalaman ' + Fmt.angka(dalam, { desimal: 2 }) + ' m.'] };
      var mult = bentuk === 'dolar' ? kurs : (bentuk === 'liter' ? 1000 : 1);
      var pengecoh = [
        { nilai: perCm3 * 1e6 * (bentuk === 'dolar' ? kurs : 1), alasan: 'menghitung harga per meter kubik, bukan per sentimeter kubik' },
        { nilai: perCm3 * 1000 * (bentuk === 'dolar' ? kurs : 1), alasan: 'menghitung harga per liter, bukan per sentimeter kubik' },
        { nilai: perCm3 * 10 * (bentuk === 'dolar' ? kurs : 1) * (bentuk === 'liter' ? 100 : 1), alasan: 'salah menggeser koma satu tempat saat mengubah satuan' },
        { nilai: perCm3 / 10 * mult, alasan: 'salah menggeser koma satu tempat saat mengubah satuan' },
        { nilai: bentuk === 'dolar' ? perCm3 : perCm3 * 1e4 * (bentuk === 'liter' ? 0.1 : 1), alasan: bentuk === 'dolar' ? 'lupa mengonversi pound ke dolar' : 'mengubah m³ ke cm³ dengan faktor 100 (bukan 1.000.000)' },
        { nilai: bentuk === 'dolar' ? perCm3 / kurs : harga[2] / (tinggi[2] * lebar[2] * 1e4), alasan: bentuk === 'dolar' ? 'membagi dengan kurs, padahal harus mengalikan' : 'memakai luas permukaan (cm²), bukan volume' }
      ];
      var vm3 = tinggi[2] * lebar[2] * dalam;
      var pembahasan = [
        'Tangki terbesar: tinggi ' + Fmt.angka(tinggi[2], { desimal: 2 }) + ' m, lebar ' + Fmt.angka(lebar[2], { desimal: 2 }) + ' m, kedalaman ' + Fmt.angka(dalam, { desimal: 2 }) + ' m, harga £' + Fmt.angka(harga[2]) + '.',
        'Volume = ' + Fmt.angka(tinggi[2], { desimal: 2 }) + ' × ' + Fmt.angka(lebar[2], { desimal: 2 }) + ' × ' + Fmt.angka(dalam, { desimal: 2 }) + ' = ' + Fmt.angka(vm3, { desimal: 4 }) + ' m³ = ' + Fmt.angka(vol[2]) + ' cm³ (1 m³ = 1.000.000 cm³).',
        'Harga per cm³ = £' + Fmt.angka(harga[2]) + ' ÷ ' + Fmt.angka(vol[2]) + ' = £' + Fmt.angka(perCm3, { desimal: 5 }) + '.'
      ];
      if (bentuk === 'liter') pembahasan.push('1 liter = 1.000 cm³, jadi harga per liter = £' + Fmt.angka(perCm3, { desimal: 5 }) + ' × 1.000 = £' + Fmt.angka(kunci, { desimal: 3 }) + '.');
      if (bentuk === 'dolar') pembahasan.push('Dalam dolar: £' + Fmt.angka(perCm3, { desimal: 5 }) + ' × ' + a2(kurs) + ' = $' + Fmt.angka(kunci, { desimal: 5 }) + '.');
      var rumusJawab = 't2_3/(t2_1*t2_2*Dalam*1000000)' + (bentuk === 'liter' ? '*1000' : (bentuk === 'dolar' ? '*Kurs' : ''));
      return {
        jenisSoal: 'Tabel - Pengukuran dan Konversi Satuan',
        judul: 'Tabel · Harga Tangki Ikan', gambar: gambarTabel(model), teks: [], pertanyaan: tanya,
        kunci: kunci, fmt: fm, pengecoh: pengecoh, min: 0, desimal: desimal, tanpaPengali: true, langkahPilihan: Math.pow(10, -desimal),
        langkah: [{ nama: 'jawab', rumus: rumusJawab }],
        pembahasan: pembahasan,
        model: { param: bentuk === 'dolar' ? { Dalam: String(dalam), Kurs: String(kurs) } : { Dalam: String(dalam) }, tampil: bentuk === 'dolar' ? { Kurs: a2(kurs) } : {}, toleransi: Math.pow(10, -desimal) / 2 + 1e-12, topik: 'Pengukuran dan Konversi Satuan', tampilGambar: { Dalam: Fmt.angka(dalam, { desimal: 2 }) } },
        sidik: { inti: 'harga-satuan|' + tinggi.join(',') + '|' + lebar.join(',') + '|' + dalam + '|' + harga.join(',') + '|' + bentuk + '|' + kurs, param: tinggi.concat(lebar, [dalam, kurs]), entitas: bentuk }
      };
    }
    return null;
  }

  // ================================================== 8. perubahan persen

  var TEMA_WILAYAH = [
    { judul: 'Penjualan per Wilayah (juta $)', baris: ['Sumatra', 'Jawa', 'Kalimantan', 'Sulawesi', 'Bali dan Nusa Tenggara', 'Papua'], kolom: ['Tahun 2023', 'Tahun 2024'] },
    { judul: 'Jumlah Nasabah per Kantor Wilayah (ribu)', baris: ['Wilayah I', 'Wilayah II', 'Wilayah III', 'Wilayah IV', 'Wilayah V', 'Wilayah VI'], kolom: ['Semester 1', 'Semester 2'] },
    { judul: 'Produksi per Pabrik (ton)', baris: ['Pabrik Utara', 'Pabrik Selatan', 'Pabrik Barat', 'Pabrik Timur', 'Pabrik Pusat', 'Pabrik Pesisir'], kolom: ['Kuartal 1', 'Kuartal 2'] }
  ];

  function perubahanPersen(a, level) {
    var ti = a.bulat(0, TEMA_WILAYAH.length - 1), tm = TEMA_WILAYAH[ti];
    for (var coba = 0; coba < 2000; coba++) {
      var n = level === 'mudah' ? 4 : 5;
      var nama = a.ambil(tm.baris, n);
      var v0 = [], v1 = [];
      for (var i = 0; i < n; i++) {
        var b = a.kelipatan(40, 400, 10);
        var pct = a.pilih([-20, -10, -5, 5, 10, 15, 20, 25, 30, 40]);
        v0.push(b); v1.push(b * (100 + pct) / 100);
      }
      if (v1.some(function (x) { return Math.abs(x - Math.round(x)) > 1e-9; })) continue;
      var bentuk = level === 'mudah' ? 'satu' : a.pilih(['satu', 'total']);
      var ii = a.bulat(0, n - 1), kunci, tanya;
      var tot0 = v0.reduce(function (s, x) { return s + x; }, 0), tot1 = v1.reduce(function (s, x) { return s + x; }, 0);
      if (bentuk === 'satu') { kunci = (v1[ii] - v0[ii]) / v0[ii] * 100; tanya = 'Berapa persentase perubahan ' + tm.kolom[0].toLowerCase() + ' ke ' + tm.kolom[1].toLowerCase() + ' pada ' + nama[ii] + '?'; }
      else { kunci = (tot1 - tot0) / tot0 * 100; tanya = 'Berapa persentase perubahan total seluruh baris dari ' + tm.kolom[0].toLowerCase() + ' ke ' + tm.kolom[1].toLowerCase() + '?'; if (Math.abs(kunci - Math.round(kunci)) > 0.045) continue; kunci = Math.round(kunci); }
      if (Math.abs(kunci) < 4) continue;
      var baris = nama.map(function (nm, k) { return { label: nm, sel: [Fmt.angka(v0[k]), Fmt.angka(v1[k])] }; });
      var model = { judul: tm.judul, kolom: ['', tm.kolom[0], tm.kolom[1]], baris: baris };
      var rata = v0.map(function (x, k) { return (v1[k] - x) / x * 100; }).reduce(function (s, x) { return s + x; }, 0) / n;
      var pengecoh;
      if (bentuk === 'satu') {
        pengecoh = [
          { nilai: (v1[ii] - v0[ii]) / v1[ii] * 100, alasan: 'menghitung perubahan terhadap nilai akhir, bukan nilai awal' },
          { nilai: v1[ii] - v0[ii], alasan: 'menjawab selisih angka, bukan persentase' },
          { nilai: v1[ii] / v0[ii] * 100, alasan: 'menjawab nilai akhir sebagai persen dari nilai awal' },
          { nilai: -kunci, alasan: 'tertukar antara kenaikan dan penurunan' },
          { nilai: (tot1 - tot0) / tot0 * 100, alasan: 'memakai total seluruh baris, bukan baris yang ditanyakan' },
          { nilai: kunci / 2, alasan: 'membagi dua perubahan yang benar' }
        ];
      } else {
        pengecoh = [
          { nilai: rata, alasan: 'merata-ratakan persentase tiap baris tanpa memperhitungkan besar masing-masing' },
          { nilai: (tot1 - tot0) / tot1 * 100, alasan: 'menghitung perubahan terhadap total akhir, bukan total awal' },
          { nilai: tot1 - tot0, alasan: 'menjawab selisih total, bukan persentase' },
          { nilai: tot1 / tot0 * 100, alasan: 'menjawab total akhir sebagai persen dari total awal' },
          { nilai: (v1[0] - v0[0]) / v0[0] * 100, alasan: 'memakai baris pertama saja' },
          { nilai: -kunci, alasan: 'tertukar antara kenaikan dan penurunan' }
        ];
      }
      var pembahasan = bentuk === 'satu'
        ? [nama[ii] + ': ' + Fmt.angka(v0[ii]) + ' menjadi ' + Fmt.angka(v1[ii]) + '.', 'Perubahan = (' + Fmt.angka(v1[ii]) + ' - ' + Fmt.angka(v0[ii]) + ') ÷ ' + Fmt.angka(v0[ii]) + ' × 100% = ' + Fmt.angka(kunci) + '%.']
        : ['Total ' + tm.kolom[0].toLowerCase() + ' = ' + v0.map(Fmt.angka).join(' + ') + ' = ' + Fmt.angka(tot0) + '; total ' + tm.kolom[1].toLowerCase() + ' = ' + v1.map(Fmt.angka).join(' + ') + ' = ' + Fmt.angka(tot1) + '.', 'Perubahan = (' + Fmt.angka(tot1) + ' - ' + Fmt.angka(tot0) + ') ÷ ' + Fmt.angka(tot0) + ' × 100% = ' + Fmt.angka(kunci) + '%.'];
      var jumlahRumus0 = [], jumlahRumus1 = [];
      for (var q = 0; q < n; q++) { jumlahRumus0.push(t(q, 1)); jumlahRumus1.push(t(q, 2)); }
      return {
        jenisSoal: 'Tabel - Persentase dan Pertumbuhan',
        judul: 'Tabel · ' + tm.judul, gambar: gambarTabel(model), teks: [], pertanyaan: tanya,
        kunci: Math.round(kunci * 10) / 10, fmt: function (v) { return Fmt.angka(v, { desimal: 1 }) + '%'; },
        pengecoh: pengecoh.map(function (p) { return { nilai: Math.round(p.nilai * 10) / 10, alasan: p.alasan }; }),
        desimal: 1, langkahPilihan: 5,
        langkah: bentuk === 'satu'
          ? [{ nama: 'jawab', rumus: '(' + t(ii, 2) + '-' + t(ii, 1) + ')/' + t(ii, 1) + '*100' }]
          : [{ nama: 'a', rumus: jumlahRumus0.join('+') }, { nama: 'b', rumus: jumlahRumus1.join('+') }, { nama: 'jawab', rumus: '(b-a)/a*100' }],
        pembahasan: pembahasan,
        model: { param: {}, tampil: {}, toleransi: 0.0501, topik: 'Persentase dan Pertumbuhan' },
        sidik: { inti: 'perubahan-persen|' + ti + '|' + nama.join(',') + '|' + v0.join(',') + '|' + v1.join(',') + '|' + bentuk + '|' + ii, param: v0.concat(v1, [ii]), entitas: ti + nama.join('') }
      };
    }
    return null;
  }

  var KELUARGA = [
    { id: 'rasio-baris', nama: 'Perbandingan dua baris', topik: 'Bilangan dan Perbandingan', fn: rasioBaris },
    { id: 'persen-gabungan', nama: 'Persentase gabungan dua kelompok', topik: 'Bilangan dan Perbandingan', fn: persenGabungan },
    { id: 'pertumbuhan-tahun', nama: 'Berapa tahun sampai melampaui', topik: 'Persentase dan Pertumbuhan', fn: pertumbuhanTahun },
    { id: 'rata-per-mesin', nama: 'Biaya rata-rata per mesin', topik: 'Rata-rata', fn: ratarataMesin },
    { id: 'laba-persen', nama: 'Kenaikan laba produk', topik: 'Aritmatika Keuangan', fn: labaPersen },
    { id: 'tak-diketahui', nama: 'Unit terjual yang hilang', topik: 'Aljabar Dasar', fn: takDiketahui },
    { id: 'harga-satuan', nama: 'Harga per satuan dan konversi mata uang', topik: 'Pengukuran dan Konversi Satuan', fn: hargaSatuan },
    { id: 'perubahan-persen', nama: 'Persentase perubahan', topik: 'Persentase dan Pertumbuhan', fn: perubahanPersen }
  ];

  function buat(id, level, benih, opsi) {
    opsi = opsi || {};
    var kel = null;
    KELUARGA.forEach(function (k) { if (k.id === id) kel = k; });
    if (!kel) throw new Error('keluarga tabel tidak dikenal: ' + id);
    var a = Rng.alat(benih);
    var spec = kel.fn(a, level, opsi);
    if (!spec) return null;
    var ctx = { subtes: 'ku', submateri: 'tabel', keluarga: id, level: level, benih: benih, a: a, target: opsi.target };

    if (spec.pilihanBerurutan) {
      var kunciN = spec.pilihanBerurutan.kunci, tg = opsi.target == null ? a.bulat(0, 4) : opsi.target;
      var awal = Math.max(spec.pilihanBerurutan.awalMin, kunciN - tg);
      var daftar = [];
      for (var i = 0; i < 5; i++) daftar.push(awal + i);
      var idx = kunciN - awal;
      spec.pilihanJadi = {
        opsi: daftar.map(function (v, i2) { return { teks: String(v), nilai: v, alasan: i2 === idx ? null : (v < kunciN ? 'terlalu sedikit: pada tahun itu syaratnya belum terpenuhi' : 'terlalu banyak: syaratnya sudah terpenuhi lebih awal'), kunci: i2 === idx }; }),
        kunciIndex: idx
      };
    }
    var butir = Butir.rakitPg(ctx, spec);
    if (butir) butir.model.topik = (butir.model.topik || kel.topik);
    return butir;
  }

  return { KELUARGA: KELUARGA, buat: buat, nilaiKeRasio: nilaiKeRasio };
});
