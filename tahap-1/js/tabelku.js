/*
 * tabelku.js — soal tabel Kemampuan Umum > Numerik.
 *
 * Tabelnya digambar sebagai SVG/PNG (stimulus berupa gambar, seperti di naskah
 * asli) dan SEMUA angka yang dihitung diambil dari sel tabel itu. Langkah hitung
 * merujuk sel dengan nama `t<baris>_<kolom>` (kolom 0 = label, data mulai dari
 * kolom 1). Validator membaca sel dari SVG yang digambar, bukan dari data yang
 * dipakai penyusun, jadi tabel yang salah gambar pun ketahuan.
 *
 *   rasio-baris          Bilangan dan Perbandingan     p : q dua baris pada satu kolom
 *   persen-gabungan      Bilangan dan Perbandingan     persentase gabungan dua kelompok
 *   pertumbuhan-tahun    Persentase dan Pertumbuhan    berapa tahun sampai melampaui
 *   rata-per-mesin       Rata-rata                     biaya rata-rata per mesin
 *   laba-persen          Aritmatika Keuangan           kenaikan laba produk
 *   tak-diketahui        Aljabar Dasar                 unit terjual yang hilang
 *   harga-satuan         Pengukuran dan Konversi       harga per cm3, per liter, dan selisih harga per liter (dolar)
 *   perubahan-persen     Persentase dan Pertumbuhan    kenaikan total atau satu wilayah
 *   tabel-tumbuh-majemuk Persentase dan Pertumbuhan    nilai setelah beberapa tahun pertumbuhan majemuk
 *   tabel-rata-gabungan  Rata-rata                     rata-rata gabungan beberapa baris dan rata-rata yang hilang
 *
 * Setiap pengecoh berasal dari jalur kesalahan yang dapat diulang dan alasannya
 * menuliskan hitungan jalur itu dengan angka tabel; tidak ada angka tambalan.
 * Semua nominal ditulis penuh (tanpa "juta" atau "ribu") dan dalam dolar.
 *
 * Pembahasan: Diketahui (angka yang dipakai beserta baris dan kolom asalnya),
 * Ditanyakan, Pengerjaan (rumus umum lalu substitusi, satu langkah per baris
 * persamaan "§ ..."), dan Kesimpulan. "=" hanya untuk hasil yang tepat,
 * "\approx" untuk hasil yang dibulatkan; validator memeriksa setiap relasi.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./rng.js'), require('./format.js'), require('./kamus.js'), require('./butir.js'), require('./rumus.js'));
    module.exports = api;
  } else {
    api = factory(root.Rng, root.Fmt, root.Kamus, root.Butir, root.Rumus);
    root.TabelKu = api;
  }
})(typeof self !== 'undefined' ? self : this, function (Rng, Fmt, Kamus, Butir, Rumus) {
  'use strict';

  var K = Kamus;
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a; }
  function a2(v) { return Fmt.angka(v, { desimal: 2, tetap: true }); }
  function A(v, d) { return Fmt.angka(v, { desimal: d == null ? 2 : d }); }
  function jumlah(xs) { return xs.reduce(function (s, x) { return s + x; }, 0); }

  // ------------------------------------------------------------- pembahasan

  /** Baris persamaan (notasi LaTeX sederhana, lihat rumus.js). */
  function R(notasi) { return Rumus.baris(notasi); }
  /** Angka pada baris persamaan: titik ribuan, koma desimal "{,}". */
  function E(v, d, tetap) { return Fmt.angka(v, { desimal: d == null ? 2 : d, tetap: !!tetap }).replace(',', '{,}'); }
  /** Nominal dolar pada baris persamaan: \$1.250 atau \$22{,}50. */
  function ED(v) { return '\\$' + E(v, 2, Math.abs(v - Math.round(v)) > 1e-9); }
  /** Kata atau satuan tegak pada baris persamaan. */
  function T(s) { return '\\text{' + s + '}'; }
  /** Relasi dan nilai dengan `d` desimal: "= 20" bila tepat, "\approx 14{,}3" bila dibulatkan. */
  function samaE(v, d) { var p = Math.pow(10, d == null ? 2 : d); return (Math.abs(v * p - Math.round(v * p)) < 1e-7 ? '= ' : '\\approx ') + E(v, d); }
  /** Pembahasan soal hitungan; `{HURUF}` diisi huruf kunci oleh Butir. */
  function bahas(diketahui, ditanyakan, pengerjaan, kesimpulan) {
    return ['Diketahui'].concat(diketahui, ['Ditanyakan', ditanyakan, 'Pengerjaan'], pengerjaan, ['Kesimpulan', kesimpulan + ' Jawaban: {HURUF}.']);
  }
  /** Label tabel tanpa pemisah baris, untuk dikutip di pembahasan. */
  function label(s) { return String(s).replace(/\s*\n\s*/g, ' '); }

  /** Nilai -> "p:q" paling sederhana (penyebut sampai 150). */
  function nilaiKeRasio(v) {
    for (var d = 1; d <= 150; d++) {
      var n = Math.round(v * d);
      if (Math.abs(v * d - n) < 1e-9 && n > 0) { var g = gcd(n, d); return (n / g) + ':' + (d / g); }
    }
    return Fmt.angka(v, { desimal: 3 });
  }

  /** Seperti nilaiKeRasio, tetapi null bila tidak ada perbandingan bulat yang wajar (pengecoh semacam itu dibuang). */
  function rasioAtauNull(v) {
    for (var d = 1; d <= 60; d++) {
      var n = Math.round(v * d);
      if (Math.abs(v * d - n) < 1e-9 && n > 0 && n <= 60) { var g = gcd(n, d); return (n / g) + ':' + (d / g); }
    }
    return null;
  }

  /**
   * Satu pengecoh dari jalur kesalahan: nama kesalahan, hitungannya dengan angka tabel, dan
   * hasil yang tercetak sebagai pilihan.
   */
  function jalur(nilai, salahnya, hitungan, fmt) {
    var t = isFinite(nilai) ? fmt(nilai) : null;
    return { nilai: nilai, alasan: t == null ? null : salahnya + ': ' + hitungan + ' = ' + t };
  }

  /**
   * Jalur kesalahan yang hasilnya dibulatkan seperti kunci ("kira-kira"): alasan menuliskan
   * hasil hitung sebelum dibulatkan lalu pilihan yang tercetak, mis. "... = 16,2% ≈ 16%".
   */
  function jalurKira(asli, salahnya, hitungan, fmt, desimal, akhiran, awalan) {
    var bulat = Math.round(asli);
    if (!isFinite(asli)) return { nilai: NaN, alasan: null };
    var t = fmt(bulat), tepat = (awalan || '') + A(asli, desimal == null ? 1 : desimal) + (akhiran || '');
    return { nilai: bulat, alasan: t == null ? null : salahnya + ': ' + hitungan + ' = ' + (tepat === t ? t : tepat + ' ≈ ' + t) };
  }

  /** Keterangan riset untuk ekspor: 'acuan' (mengikuti contoh riset) atau 'pengayaan' (tambahan tim). */
  function riset(spec, kategori, catatan, pola) {
    spec.kategoriRiset = kategori; spec.catatanRiset = catatan;
    if (pola) spec.pola = pola;
    return spec;
  }

  function gambarTabel(model, judul) {
    return [{ id: 'tabel', jenis: 'tabel', model: model, judul: judul || model.judul || 'Tabel' }];
  }

  /** Nama variabel sel: baris data r (0-based), kolom c (0 = label). */
  function t(r, c) { return 't' + r + '_' + c; }

  /** Angka pada judul kolom/baris yang ikut disebut di pertanyaan (mis. tahun) adalah konteks, bukan data. */
  function angkaLabel() {
    var hasil = [];
    Array.prototype.slice.call(arguments).forEach(function (s) { (String(s).match(/\d+/g) || []).forEach(function (x) { hasil.push(x); }); });
    return hasil;
  }

  // =============================================================== 1. rasio

  var TEMA_RASIO = [
    { judul: 'Staf dan Teknologi Informasi', unit: '',
      baris: [['Omzet ($)', 'omzet'], ['Staf Senior (%)', 'pct'], ['Jumlah komputer\nuntuk pengarsipan', 'pasangan'], ['Jumlah komputer\nuntuk pengolahan kata', 'pasangan'], ['Jumlah telepon', 'telp'], ['Jumlah staf', 'staf']],
      sebut: ['komputer untuk pengarsipan', 'komputer untuk pengolahan kata'], jenis: 'penerbit',
      tempat: ['Provo Publishers', 'Contra Press', 'Contenti News', 'Delta Media', 'Nusa Cetak', 'Bina Pustaka'] },
    { judul: 'Sarana Kantor Cabang', unit: '',
      baris: [['Aset ($)', 'omzet'], ['Pegawai tetap (%)', 'pct'], ['Jumlah teller', 'pasangan'], ['Jumlah mesin ATM', 'pasangan'], ['Jumlah kendaraan', 'telp'], ['Jumlah pegawai', 'staf']],
      sebut: ['teller', 'mesin ATM'], jenis: 'bank',
      tempat: ['Cabang Medan', 'Cabang Padang', 'Cabang Bandung', 'Cabang Semarang', 'Cabang Makassar', 'Cabang Denpasar'] },
    { judul: 'Armada dan Gudang Perusahaan Logistik', unit: '',
      baris: [['Pendapatan ($)', 'omzet'], ['Karyawan kontrak (%)', 'pct'], ['Jumlah truk besar', 'pasangan'], ['Jumlah truk kecil', 'pasangan'], ['Jumlah gudang', 'telp'], ['Jumlah karyawan', 'staf']],
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
          omzet: a.kelipatan(1200, 38000, 100) * 100, pct: a.kelipatan(15, 70, 5), x: x, y: y,
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
      var X = p * m, Y = q * m, d0 = data[kol];
      var pengecoh = [
        jalur(q / p, 'urutan perbandingan terbalik (' + tm.sebut[1] + ' dibanding ' + tm.sebut[0] + ')', Y + ' : ' + X, rasioAtauNull),
        jalur(p / (p + q), 'membandingkan ' + tm.sebut[0] + ' dengan jumlah keduanya', X + ' : (' + X + ' + ' + Y + ')', rasioAtauNull),
        jalur((p + q) / q, 'membandingkan jumlah keduanya dengan ' + tm.sebut[1], '(' + X + ' + ' + Y + ') : ' + Y, rasioAtauNull),
        jalur(Math.abs(p - q) / q, 'membandingkan selisih keduanya dengan ' + tm.sebut[1], '(' + Math.max(X, Y) + ' - ' + Math.min(X, Y) + ') : ' + Y, rasioAtauNull),
        jalur(X / d0.telp, 'salah membaca baris: memakai baris ' + tm.baris[4][0].toLowerCase() + ' sebagai pembanding', X + ' : ' + d0.telp, rasioAtauNull)
      ];
      [1, 2].forEach(function (s) {
        var c = (kol + s) % 3, d = data[c];
        pengecoh.push(jalur(d.x / d.y, 'membaca kolom ' + nama[c] + ', bukan ' + nama[kol], d.x + ' : ' + d.y, rasioAtauNull));
      });
      var pembahasan = bahas([
        'Kolom ' + nama[kol] + ', baris "' + label(tm.baris[rA][0]) + '": ' + X + '.',
        'Kolom ' + nama[kol] + ', baris "' + label(tm.baris[rB][0]) + '": ' + Y + '.'
      ], 'Perbandingan ' + tm.sebut[0] + ' terhadap ' + tm.sebut[1] + ' di ' + nama[kol] + ', dalam bentuk paling sederhana.', [
        'Perbandingan ditulis menurut urutan yang ditanyakan (' + tm.sebut[0] + ' lebih dahulu):',
        R(T(tm.sebut[0]) + ' : ' + T(tm.sebut[1]) + ' = ' + X + ' : ' + Y),
        'FPB dari ' + X + ' dan ' + Y + ' adalah ' + m + ', jadi kedua bilangan dibagi ' + m + ':',
        R(X + ' : ' + Y + ' = \\frac{' + X + '}{' + m + '} : \\frac{' + Y + '}{' + m + '} = ' + p + ' : ' + q)
      ], 'Jadi, perbandingan ' + tm.sebut[0] + ' dan ' + tm.sebut[1] + ' di ' + nama[kol] + ' adalah ' + p + ':' + q + '.');
      return riset({
        jenisSoal: 'Tabel - Bilangan dan Perbandingan',
        judul: 'Tabel · ' + tm.judul, gambar: gambarTabel(model), teks: [], pertanyaan: tanya,
        kunci: kunci, fmt: nilaiKeRasio, pengecoh: pengecoh, min: 0.0001,
        langkah: [{ nama: 'jawab', rumus: t(rA, cK) + '/' + t(rB, cK) }],
        pembahasan: pembahasan,
        model: { param: {}, tampil: {}, toleransi: 1e-9, topik: 'Bilangan dan Perbandingan', bentukJawab: 'rasio' },
        sidik: { inti: 'rasio-baris|' + ti + '|' + nama.join(',') + '|' + data.map(function (d) { return d.x + '/' + d.y; }).join(','), param: [p, q, m, kol], entitas: ti + nama.join('') }
      }, 'acuan', 'Mengikuti contoh Numerik Soal 7 (perbandingan dua baris pada satu kolom tabel).');
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
    var totS = jumlah(d.S), totN = jumlah(d.N);
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
      var fm = function (v) { return Fmt.angka(v, { desimal: 0 }) + '%'; }, F = Fmt.angka;
      var Si = F(d.S[i]), Ni = F(d.N[i]), G = F(gab), TS = F(ms.totS), TN = F(ms.totN);
      var pengecoh = [
        jalurKira(d.S[i] / ms.totS * 100, 'hanya menghitung porsi kelompok sarjana', Si + ' ÷ ' + TS + ' × 100%', fm, 1, '%'),
        jalurKira(d.N[i] / ms.totN * 100, 'hanya menghitung porsi kelompok non-sarjana', Ni + ' ÷ ' + TN + ' × 100%', fm, 1, '%'),
        jalurKira((d.S[i] / ms.totS + d.N[i] / ms.totN) * 50, 'merata-ratakan dua persentase kelompok yang jumlah orangnya berbeda',
          '(' + A(d.S[i] / ms.totS * 100, 1) + '% + ' + A(d.N[i] / ms.totN * 100, 1) + '%) ÷ 2', fm, 1, '%'),
        jalurKira(gab / ms.totS * 100, 'membagi jumlah kedua kelompok di sektor itu dengan jumlah sarjana saja', G + ' ÷ ' + TS + ' × 100%', fm, 1, '%'),
        jalurKira(gab / ms.totN * 100, 'membagi jumlah kedua kelompok di sektor itu dengan jumlah non-sarjana saja', G + ' ÷ ' + TN + ' × 100%', fm, 1, '%'),
        jalurKira(gab / (tot - gab) * 100, 'membandingkan sektor itu dengan sektor-sektor lainnya, bukan dengan seluruh pekerja', G + ' ÷ (' + F(tot) + ' - ' + G + ') × 100%', fm, 1, '%'),
        jalurKira(d.S[i] / d.N[i] * 100, 'membandingkan sarjana dengan non-sarjana di sektor itu', Si + ' ÷ ' + Ni + ' × 100%', fm, 1, '%'),
        jalurKira(gab / (2 * tot) * 100, 'ikut menjumlahkan baris Jumlah ke dalam total sehingga totalnya dua kali lipat', G + ' ÷ (2 × ' + F(tot) + ') × 100%', fm, 1, '%')
      ];
      var r = i, cS = 1, cN = 2, rT = jml;
      var tepat1 = Math.abs(pers * 10 - Math.round(pers * 10)) < 1e-7;
      var pembahasan = bahas([
        'Baris ' + d.sektor[i] + ': kolom Sarjana ' + Si + ', kolom Non-sarjana ' + Ni + '.',
        'Baris Jumlah: kolom Sarjana ' + TS + ', kolom Non-sarjana ' + TN + '.'
      ], 'Persentase pekerja sektor ' + d.sektor[i] + ' (sarjana dan non-sarjana) terhadap seluruh sarjana dan non-sarjana, dibulatkan ke persen terdekat.', [
        'Pekerja sektor ' + d.sektor[i] + ' = sarjana + non-sarjana pada baris itu:',
        R(T(d.sektor[i]) + ' = ' + E(d.S[i]) + ' + ' + E(d.N[i]) + ' = ' + E(gab)),
        'Seluruh sarjana dan non-sarjana diambil dari baris Jumlah:',
        R(T('seluruh pekerja') + ' = ' + E(ms.totS) + ' + ' + E(ms.totN) + ' = ' + E(tot)),
        'Persentase = bagian dibagi seluruh pekerja, dikali 100%:',
        R(T('persentase') + ' = \\frac{' + E(gab) + '}{' + E(tot) + '} \\times 100\\% ' + (tepat1 ? '= ' : '\\approx ') + E(pers, 1) + '\\%' + (Math.abs(pers - kunci) > 1e-9 ? ' \\approx ' + kunci + '\\%' : ''))
      ], 'Jadi, kira-kira ' + kunci + '% dari seluruh sarjana dan non-sarjana bekerja di sektor ' + d.sektor[i] + '.');
      return riset({
        jenisSoal: 'Tabel - Bilangan dan Perbandingan',
        judul: 'Tabel · ' + ms.model.judul, gambar: gambarTabel(ms.model), teks: [], pertanyaan: tanya,
        kunci: kunci, fmt: fm, pengecoh: pengecoh, min: 1, maks: 100, bulat: true,
        langkah: [
          { nama: 'gab', rumus: t(r, cS) + '+' + t(r, cN) }, { nama: 'total', rumus: t(rT, cS) + '+' + t(rT, cN) },
          { nama: 'jawab', rumus: 'bulat(gab/total*100)' }
        ],
        pembahasan: pembahasan,
        model: { param: {}, tampil: {}, toleransi: 0, topik: 'Bilangan dan Perbandingan', kira: true, cekJumlah: { baris: jml, kolom: [1, 2] } },
        sidik: { inti: 'persen-gabungan|' + kota + '|' + d.S.join(',') + '|' + d.N.join(',') + '|' + i, param: d.S.concat(d.N, [i]), entitas: kota }
      }, 'acuan', 'Mengikuti contoh Numerik Soal 8 (persentase gabungan dua kelompok dari baris jumlah).', 'persen-gabungan');
    }
    return null;
  }

  /** Tahun pertama (1, 2, ...) ketika `nilai(t)` memenuhi `lewat`; 99 bila tidak dalam 40 tahun. */
  function tahunCapai(nilai, lewat) {
    for (var k = 1; k <= 40; k++) if (lewat(nilai(k))) return k;
    return 99;
  }

  /**
   * Pilihan berupa banyak tahun dari jalur kesalahan (tidak harus berurutan): berhenti satu
   * tahun terlalu awal, menghitung tahun data sebagai tahun pertama, perubahan sederhana,
   * perubahan pada kelompok yang salah, dan faktor turun yang dibalik. Pilihan urut naik.
   */
  function pertumbuhanTahun(a, level, opsi) {
    var kota = a.pilih(K.KOTA), target = opsi && opsi.target != null ? opsi.target : null;
    for (var coba = 0; coba < 800; coba++) {
      var jml = 4;
      var d = tabelSektor(a, kota, jml), ms = modelSektor(kota, d);
      var i = a.bulat(0, jml - 1);
      var arah = a.untung(0.5) ? 'turun' : 'naik';
      var p = a.pilih(level === 'mudah' ? [10, 20, 25] : [8, 10, 12, 15, 20, 25]);
      var S = d.S[i], N = d.N[i], f = arah === 'turun' ? (100 - p) / 100 : (100 + p) / 100;
      if (!(S > N)) continue;
      var maksTahun = level === 'mudah' ? 5 : 8;
      var awalNilai = arah === 'turun' ? S : N, rujuk = arah === 'turun' ? N : S;
      var lewat = function (v) { return arah === 'turun' ? v < rujuk : v > rujuk; };
      var nilaiT = function (k) { return awalNilai * Math.pow(f, k); };
      var n = tahunCapai(nilaiT, lewat);
      if (n < 2 || n > maksTahun) continue;
      // margin: tahun n-1 belum melampaui dengan selisih jelas, tahun n sudah melampaui dengan selisih jelas
      if (Math.abs(nilaiT(n - 1) - rujuk) / rujuk < 0.012 || Math.abs(nilaiT(n) - rujuk) / rujuk < 0.012) continue;
      var F = function (v) { return Fmt.angka(v, { desimal: 0 }); }, kel = arah === 'turun' ? 'sarjana' : 'non-sarjana';
      var jalurTahun = [
        { v: n - 1, alasan: 'berhenti pada tahun terakhir yang belum memenuhi syarat: tahun ke-' + (n - 1) + ' jumlah ' + kel + ' ' + F(nilaiT(n - 1)) + (arah === 'turun' ? ' > ' : ' < ') + F(rujuk) },
        { v: n + 1, alasan: 'menghitung tahun data pada tabel sebagai tahun ke-1: syarat terpenuhi setelah ' + n + ' kali perubahan, lalu ' + n + ' + 1 = ' + (n + 1) + ' tahun' }
      ];
      var basis = arah === 'turun' ? S : N, langkahLin = basis * p / 100;
      var nLin = tahunCapai(function (k) { return basis + (arah === 'turun' ? -1 : 1) * k * langkahLin; }, lewat);
      jalurTahun.push({ v: nLin, alasan: 'menghitung perubahan ' + p + '% dari jumlah awal setiap tahun (bukan dari jumlah tahun sebelumnya): ' + F(S - N) + ' ÷ ' + F(langkahLin) + ' = ' + A((S - N) / langkahLin, 2) + ', jadi ' + nLin + ' tahun' });
      var salahKel = arah === 'turun'
        ? tahunCapai(function (k) { return N * Math.pow((100 + p) / 100, k); }, function (v) { return v > S; })
        : tahunCapai(function (k) { return S * Math.pow((100 - p) / 100, k); }, function (v) { return v < N; });
      jalurTahun.push({ v: salahKel, alasan: arah === 'turun'
        ? 'menaikkan jumlah non-sarjana ' + p + '% per tahun, padahal yang turun adalah sarjana: ' + F(N) + ' × ' + A((100 + p) / 100) + '^' + salahKel + ' = ' + F(N * Math.pow((100 + p) / 100, salahKel)) + ' > ' + F(S) + ', jadi ' + salahKel + ' tahun'
        : 'menurunkan jumlah sarjana ' + p + '% per tahun, padahal yang naik adalah non-sarjana: ' + F(S) + ' × ' + A((100 - p) / 100) + '^' + salahKel + ' = ' + F(S * Math.pow((100 - p) / 100, salahKel)) + ' < ' + F(N) + ', jadi ' + salahKel + ' tahun' });
      var dasarLain = arah === 'turun' ? N : S, persenSelisih = (S - N) / dasarLain * 100, nRasio = Math.ceil(persenSelisih / p - 1e-9);
      jalurTahun.push({ v: nRasio, alasan: 'membagi selisih dalam persen terhadap jumlah ' + (arah === 'turun' ? 'non-sarjana' : 'sarjana') + ' dengan ' + p + '%: (' + F(S) + ' - ' + F(N) + ') ÷ ' + F(dasarLain) +
        ' × 100% = ' + A(persenSelisih, 1) + '%, lalu ' + A(persenSelisih, 1) + ' ÷ ' + p + ' = ' + A(persenSelisih / p, 2) + ', dibulatkan ke atas ' + nRasio + ' tahun' });
      var fSalah = arah === 'turun' ? 100 / (100 + p) : 100 / (100 - p);
      var nBalik = tahunCapai(function (k) { return awalNilai * Math.pow(fSalah, k); }, lewat);
      jalurTahun.push({ v: nBalik, alasan: (arah === 'turun' ? 'menghitung turun ' + p + '% sebagai membagi dengan ' + A((100 + p) / 100) : 'menghitung naik ' + p + '% sebagai membagi dengan ' + A((100 - p) / 100)) +
        ': ' + F(awalNilai) + ' ÷ ' + A(arah === 'turun' ? (100 + p) / 100 : (100 - p) / 100) + '^' + nBalik + ' = ' + F(awalNilai * Math.pow(fSalah, nBalik)) + (arah === 'turun' ? ' < ' : ' > ') + F(rujuk) + ', jadi ' + nBalik + ' tahun' });
      var lihat = {}, bawah = [], atas = [];
      jalurTahun.forEach(function (x) {
        if (x.v === n || !(x.v >= 1) || x.v > 15 || lihat[x.v]) return;
        lihat[x.v] = true;
        (x.v < n ? bawah : atas).push(x);
      });
      if (bawah.length + atas.length < 4) continue;
      var lo = Math.max(0, 4 - atas.length), hi = Math.min(4, bawah.length);
      var ingin = Math.min(hi, Math.max(lo, target == null ? 1 : target));
      var dipilih = bawah.slice(0, ingin).concat(atas.slice(0, 4 - ingin));
      var opsiTahun = dipilih.map(function (x) { return { teks: x.v + ' tahun', nilai: x.v, alasan: x.alasan, kunci: false }; });
      opsiTahun.push({ teks: n + ' tahun', nilai: n, alasan: null, kunci: true });
      opsiTahun.sort(function (x, y) { return x.nilai - y.nilai; });
      var tanya = arah === 'turun'
        ? 'Jika diperkirakan jumlah sarjana yang bekerja di sektor ' + d.sektor[i] + ' tiap tahunnya turun sebesar ' + p + '% sementara jumlah non-sarjana diperkirakan tetap sama, berapa tahun yang dibutuhkan karyawan non-sarjana untuk melampaui jumlah karyawan sarjana di sektor ' + d.sektor[i] + '?'
        : 'Jika jumlah sarjana yang bekerja di sektor ' + d.sektor[i] + ' tetap sama sementara jumlah non-sarjana naik sebesar ' + p + '% per tahun, berapa tahun yang dibutuhkan jumlah non-sarjana untuk melampaui jumlah sarjana yang bekerja di sektor ' + d.sektor[i] + '?';
      // nilai tiap tahun: tepat bila desimalnya paling banyak dua; dibulatkan ke bilangan bulat dengan \approx
      var simbol = arah === 'turun' ? 'S' : 'N', fE = E(f, 2), rel = arah === 'turun' ? ' > ' : ' < ', relAkhir = arah === 'turun' ? ' < ' : ' > ';
      var baris = [], pengali = BigInt(arah === 'turun' ? 100 - p : 100 + p);
      for (var k = 1; k <= n; k++) {
        // awal × (100 ± p)^k / 100^k: tepat bulat atau tepat dua desimal, dihitung eksak
        var pembilang = BigInt(awalNilai) * pengali ** BigInt(k), penyebut = BigInt(100) ** BigInt(k);
        var v = nilaiT(k), bulat = Math.round(v), dua = Math.round(v * 100) / 100;
        var nilaiE = pembilang % penyebut === BigInt(0) ? '= ' + E(bulat)
          : (pembilang * BigInt(100) % penyebut === BigInt(0) ? '= ' + E(dua, 2) + ' \\approx ' + E(bulat) : '\\approx ' + E(bulat));
        baris.push(R(simbol + '_{' + k + '} = ' + E(awalNilai) + ' \\times (' + fE + ')^{' + k + '} ' + nilaiE + (k === n ? relAkhir : rel) + E(rujuk)));
      }
      var kel2 = arah === 'turun' ? 'non-sarjana' : 'sarjana';
      var pembahasan = bahas([
        'Baris ' + d.sektor[i] + ': kolom Sarjana ' + Fmt.angka(S) + ', kolom Non-sarjana ' + Fmt.angka(N) + '.',
        arah === 'turun' ? 'Jumlah sarjana turun ' + p + '% per tahun dari jumlah tahun sebelumnya; jumlah non-sarjana tetap ' + Fmt.angka(N) + '.'
          : 'Jumlah non-sarjana naik ' + p + '% per tahun dari jumlah tahun sebelumnya; jumlah sarjana tetap ' + Fmt.angka(S) + '.'
      ], 'Banyak tahun sampai jumlah non-sarjana melampaui jumlah sarjana di sektor ' + d.sektor[i] + '.', [
        (arah === 'turun' ? 'Turun ' + p + '% per tahun berarti setiap tahun tersisa 100% - ' + p + '% = ' + (100 - p) + '% dari jumlah tahun sebelumnya, yaitu dikali ' + A(f) + '.'
          : 'Naik ' + p + '% per tahun berarti setiap tahun menjadi 100% + ' + p + '% = ' + (100 + p) + '% dari jumlah tahun sebelumnya, yaitu dikali ' + A(f) + '.') +
          ' Jumlah ' + kel + ' setelah n tahun:',
        R(simbol + '_{n} = ' + E(awalNilai) + ' \\times (' + fE + ')^{n}'),
        'Syaratnya jumlah ' + kel + ' ' + (arah === 'turun' ? 'kurang dari' : 'lebih dari') + ' jumlah ' + kel2 + ', yaitu ' + Fmt.angka(rujuk) + '. Hitung untuk setiap tahun:'
      ].concat(baris).concat([
        'Pada tahun ke-' + (n - 1) + ' jumlah ' + kel + ' ' + F(nilaiT(n - 1)) + ' masih ' + (arah === 'turun' ? 'lebih dari ' : 'kurang dari ') + Fmt.angka(rujuk) +
        ', sedangkan pada tahun ke-' + n + ' sudah ' + F(nilaiT(n)) + ', ' + (arah === 'turun' ? 'kurang dari ' : 'lebih dari ') + Fmt.angka(rujuk) + '.'
      ]), 'Jadi, jumlah non-sarjana melampaui jumlah sarjana setelah ' + n + ' tahun.');
      return riset({
        jenisSoal: 'Tabel - Persentase dan Pertumbuhan',
        judul: 'Tabel · ' + ms.model.judul, gambar: gambarTabel(ms.model), teks: [], pertanyaan: tanya,
        pilihanJadi: { opsi: opsiTahun, kunciIndex: opsiTahun.map(function (o) { return o.kunci; }).indexOf(true) },
        langkah: [], pembahasan: pembahasan,
        model: {
          param: { p: String(p) }, tampil: { p: p + '%' }, toleransi: 0, jenisHitung: 'tahun-lampaui',
          sel: { s: t(i, 1), n: t(i, 2) }, arah: arah, topik: 'Persentase dan Pertumbuhan'
        },
        sidik: { inti: 'pertumbuhan-tahun|' + kota + '|' + d.S.join(',') + '|' + d.N.join(',') + '|' + i + '|' + arah + '|' + p, param: d.S.concat(d.N, [i, p]), entitas: kota }
      }, 'acuan', 'Mengikuti contoh Numerik Soal 9 dan 10; setiap pilihan tahun berasal dari jalur kesalahan.', 'pertumbuhan-majemuk');
    }
    return null;
  }

  // ============================================================ 4. per mesin

  var TEMA_MESIN = [
    { judul: 'Biaya Produksi per Lini Produk dan Bulan', kolom: ['Lini A', 'Lini B', 'Lini C'], unit: 'unit' },
    { judul: 'Biaya Operasional per Pabrik dan Bulan', kolom: ['Pabrik Barat', 'Pabrik Tengah', 'Pabrik Timur'], unit: 'unit' },
    { judul: 'Biaya Pencetakan per Unit Usaha dan Bulan', kolom: ['Unit Usaha 1', 'Unit Usaha 2', 'Unit Usaha 3'], unit: 'lembar' }
  ];

  /** Pilihan biaya per mesin selalu bersatuan sama: "$4.004 per mesin". */
  function fmPerMesin(v) { return Fmt.uang(v, '$', 0) + ' per mesin'; }

  function ratarataMesin(a, level) {
    var ti = a.bulat(0, TEMA_MESIN.length - 1), tm = TEMA_MESIN[ti];
    var bulan = a.ambil(['Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober'], 2).sort(function (x, y) { return Fmt.BULAN.indexOf(x) - Fmt.BULAN.indexOf(y); });
    for (var coba = 0; coba < 600; coba++) {
      // data per bulan per lini: unit, biaya per unit ($ dengan 2 desimal), mesin
      var dat = bulan.map(function () {
        return tm.kolom.map(function () {
          var unit = a.bulat(150, 950) * 1000, cpu = a.bulat(40, 95) / 100;
          var total = Math.round(unit * cpu);
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
        baris.push({ label: bn + ': unit yang\ndihasilkan (' + tm.unit + ')', sel: dat[bj].map(function (x) { return Fmt.angka(x.unit); }) });
        baris.push({ label: bn + ': biaya rata-rata\nper ' + tm.unit + ' ($)', sel: dat[bj].map(function (x) { return a2(x.cpu); }) });
        baris.push({ label: bn + ': jumlah mesin\nyang digunakan', sel: dat[bj].map(function (x) { return String(x.mesin); }) });
      });
      var model = { judul: tm.judul, kolom: [''].concat(tm.kolom), baris: baris, catatan: ['Biaya total tiap kolom = unit yang dihasilkan × biaya rata-rata per ' + tm.unit + '.'] };
      var rU = bi * 3, rC = bi * 3 + 1, rM = bi * 3 + 2;
      var d = dat[bi], F = Fmt.angka, U = function (v) { return Fmt.uang(v, '$', 0); };
      var perMesin = d.map(function (x) { return x.total / x.mesin; });
      var kunci, tanya, langkah, pembahasan, pengecoh, kira = false;
      if (bentuk === 'selisih') {
        var ia = a.bulat(0, 2), ib = (ia + a.bulat(1, 2)) % 3;
        kunci = Math.abs(perMesin[ia] - perMesin[ib]);
        if (kunci < 30 || Math.abs(kunci - Math.round(kunci)) > 1e-9) continue;
        var da = d[ia], db = d[ib], nA = tm.kolom[ia], nB = tm.kolom[ib];
        var hi = perMesin[ia] >= perMesin[ib] ? ia : ib;
        tanya = 'Berapa selisih biaya rata-rata per mesin yang digunakan antara ' + nA + ' dan ' + nB + ' pada bulan ' + bulan[bi] + '?';
        langkah = [
          { nama: 'ta', rumus: t(rU, ia + 1) + '*' + t(rC, ia + 1) }, { nama: 'tb', rumus: t(rU, ib + 1) + '*' + t(rC, ib + 1) },
          { nama: 'jawab', rumus: 'abs(ta/' + t(rM, ia + 1) + '-tb/' + t(rM, ib + 1) + ')' }
        ];
        var perMesinE = function (x, nm) {
          return R(T(nm) + ' = \\frac{' + E(x.unit) + ' \\times ' + ED(x.cpu) + '}{' + x.mesin + '} = \\frac{' + ED(x.total) + '}{' + x.mesin + '} = ' + ED(x.total / x.mesin));
        };
        pembahasan = bahas([
          'Bulan ' + bulan[bi] + ', kolom ' + nA + ': unit ' + F(da.unit) + ', biaya rata-rata per ' + tm.unit + ' $' + a2(da.cpu) + ', jumlah mesin ' + da.mesin + '.',
          'Bulan ' + bulan[bi] + ', kolom ' + nB + ': unit ' + F(db.unit) + ', biaya rata-rata per ' + tm.unit + ' $' + a2(db.cpu) + ', jumlah mesin ' + db.mesin + '.'
        ], 'Selisih biaya rata-rata per mesin antara ' + nA + ' dan ' + nB + ' pada bulan ' + bulan[bi] + '.', [
          'Biaya total = unit yang dihasilkan × biaya rata-rata per ' + tm.unit + ' (catatan tabel), lalu biaya per mesin = biaya total ÷ jumlah mesin:',
          R(T('biaya per mesin') + ' = \\frac{' + T('unit') + ' \\times ' + T('biaya per ' + tm.unit) + '}{' + T('jumlah mesin') + '}'),
          perMesinE(da, nA), perMesinE(db, nB),
          'Selisihnya, yang lebih besar dikurangi yang lebih kecil:',
          R(T('selisih') + ' = ' + ED(Math.max(perMesin[ia], perMesin[ib])) + ' - ' + ED(Math.min(perMesin[ia], perMesin[ib])) + ' = ' + ED(kunci))
        ], 'Jadi, selisih biaya rata-rata per mesin kedua kolom adalah ' + fmPerMesin(kunci) + '.');
        var sel = function (x, y) { return x >= y ? x + ' - ' + y : y + ' - ' + x; }, selU = function (x, y) { return x >= y ? U(x) + ' - ' + U(y) : U(y) + ' - ' + U(x); };
        pengecoh = [
          jalurKira(Math.abs(da.total - db.total), 'menghitung selisih biaya total, bukan biaya per mesin', selU(da.total, db.total), fmPerMesin, 0, ' per mesin', '$'),
          jalurKira(perMesin[ia] + perMesin[ib], 'menjumlahkan biaya per mesin kedua kolom, bukan mencari selisihnya', U(perMesin[ia]) + ' + ' + U(perMesin[ib]), fmPerMesin, 0, ' per mesin', '$'),
          jalurKira(Math.abs(da.total - db.total) / (da.mesin + db.mesin), 'membagi selisih biaya total dengan jumlah mesin kedua kolom',
            '(' + selU(da.total, db.total) + ') ÷ (' + da.mesin + ' + ' + db.mesin + ')', fmPerMesin, 2, ' per mesin', '$'),
          jalurKira(Math.abs(da.total - db.total) / da.mesin, 'membagi kedua biaya total dengan jumlah mesin ' + nA + ' saja', '(' + selU(da.total, db.total) + ') ÷ ' + da.mesin, fmPerMesin, 2, ' per mesin', '$'),
          jalurKira(Math.abs(da.unit / da.mesin - db.unit / db.mesin), 'tidak mengalikan unit dengan biaya per ' + tm.unit + ' (selisih unit per mesin)',
            (da.unit / da.mesin >= db.unit / db.mesin ? F(da.unit) + ' ÷ ' + da.mesin + ' - ' + F(db.unit) + ' ÷ ' + db.mesin : F(db.unit) + ' ÷ ' + db.mesin + ' - ' + F(da.unit) + ' ÷ ' + da.mesin), fmPerMesin, 2, ' per mesin', '$'),
          jalurKira(perMesin[hi], 'menjawab biaya per mesin kolom yang lebih besar saja', U(d[hi].total) + ' ÷ ' + d[hi].mesin, fmPerMesin, 2, ' per mesin', '$')
        ];
        if (da.mesin !== db.mesin) pengecoh.splice(2, 0, jalurKira(Math.abs(da.total - db.total) / Math.abs(da.mesin - db.mesin), 'membagi selisih biaya total dengan selisih jumlah mesin',
          '(' + selU(da.total, db.total) + ') ÷ (' + sel(da.mesin, db.mesin) + ')', fmPerMesin, 2, ' per mesin', '$'));
      } else {
        var totB = jumlah(d.map(function (x) { return x.total; })), totM = jumlah(d.map(function (x) { return x.mesin; })), totU = jumlah(d.map(function (x) { return x.unit; }));
        var pr = totB / totM;
        if (Math.abs(pr - Math.floor(pr) - 0.5) < 0.12) continue;
        kunci = Math.round(pr); kira = true;
        if (kunci < 200) continue;
        tanya = 'Kira-kira berapa biaya rata-rata per mesin yang digunakan di seluruh kolom pada bulan ' + bulan[bi] + '?';
        langkah = [
          { nama: 'b0', rumus: t(rU, 1) + '*' + t(rC, 1) }, { nama: 'b1', rumus: t(rU, 2) + '*' + t(rC, 2) }, { nama: 'b2', rumus: t(rU, 3) + '*' + t(rC, 3) },
          { nama: 'jawab', rumus: 'bulat((b0+b1+b2)/(' + t(rM, 1) + '+' + t(rM, 2) + '+' + t(rM, 3) + '))' }
        ];
        pembahasan = bahas(d.map(function (x, k) {
          return 'Bulan ' + bulan[bi] + ', kolom ' + tm.kolom[k] + ': unit ' + F(x.unit) + ', biaya rata-rata per ' + tm.unit + ' $' + a2(x.cpu) + ', jumlah mesin ' + x.mesin + '.';
        }), 'Biaya rata-rata per mesin untuk seluruh kolom pada bulan ' + bulan[bi] + ', dibulatkan ke dolar terdekat.', [
          'Rata-rata per mesin seluruh kolom = biaya total semua kolom ÷ jumlah semua mesin (bukan rata-rata dari biaya per mesin tiap kolom). Biaya total tiap kolom = unit × biaya rata-rata per ' + tm.unit + ':'
        ].concat(d.map(function (x, k) { return R(T(tm.kolom[k]) + ' = ' + E(x.unit) + ' \\times ' + ED(x.cpu) + ' = ' + ED(x.total)); })).concat([
          R(T('biaya total') + ' = ' + d.map(function (x) { return ED(x.total); }).join(' + ') + ' = ' + ED(totB)),
          R(T('jumlah mesin') + ' = ' + d.map(function (x) { return x.mesin; }).join(' + ') + ' = ' + totM),
          R(T('rata-rata per mesin') + ' = \\frac{' + ED(totB) + '}{' + totM + '} ' + samaE(pr, 1).replace(/^(=|\\approx) /, '$1 \\$') + (Math.abs(pr - kunci) > 1e-9 ? ' \\approx ' + ED(kunci) : ''))
        ]), 'Jadi, biaya rata-rata per mesin seluruh kolom kira-kira ' + fmPerMesin(kunci) + '.');
        pengecoh = [
          jalurKira(jumlah(perMesin) / 3, 'merata-ratakan biaya per mesin tiap kolom tanpa memperhitungkan jumlah mesinnya',
            '(' + perMesin.map(function (x) { return '$' + A(x, 1); }).join(' + ') + ') ÷ 3', fmPerMesin, 1, ' per mesin', '$'),
          jalurKira(totB / 3, 'membagi biaya total dengan banyaknya kolom, bukan dengan jumlah mesin', U(totB) + ' ÷ 3', fmPerMesin, 1, ' per mesin', '$'),
          jalurKira(totU / totM, 'membagi jumlah unit (bukan biaya) dengan jumlah mesin', F(totU) + ' ÷ ' + totM, fmPerMesin, 1, ' per mesin', '$')
        ];
        [0, 2, 1].forEach(function (k) {
          pengecoh.push(jalurKira(perMesin[k], 'hanya memakai ' + tm.kolom[k], U(d[k].total) + ' ÷ ' + d[k].mesin, fmPerMesin, 1, ' per mesin', '$'));
        });
        pengecoh.push(jalurKira(totB / d[1].mesin, 'membagi biaya total semua kolom dengan jumlah mesin ' + tm.kolom[1] + ' saja', U(totB) + ' ÷ ' + d[1].mesin, fmPerMesin, 1, ' per mesin', '$'));
      }
      return riset({
        jenisSoal: 'Tabel - Rata-rata',
        judul: 'Tabel · ' + tm.judul, gambar: gambarTabel(model), teks: [], pertanyaan: tanya,
        kunci: kunci, fmt: fmPerMesin, pengecoh: pengecoh, min: 1, bulat: true,
        langkah: langkah, pembahasan: pembahasan,
        model: { param: {}, tampil: {}, toleransi: 0.0001, topik: 'Rata-rata', kira: kira, konteks: angkaLabel(tm.kolom.join(' ')) },
        sidik: { inti: 'rata-per-mesin|' + ti + '|' + bulan.join(',') + '|' + bentuk + '|' + bi + '|' + dat.map(function (b) { return b.map(function (x) { return x.unit + '/' + x.cpu + '/' + x.mesin; }).join(';'); }).join('|'), param: [ti, bi].concat(dat.reduce(function (h, b) { return h.concat(b.reduce(function (k, x) { return k.concat([x.unit, x.cpu, x.mesin]); }, [])); }, [])), entitas: ti + bulan.join('') }
      }, 'acuan', 'Mengikuti contoh Numerik Soal 11 dan 12 (biaya rata-rata per mesin); pilihan bersatuan dolar per mesin.', bentuk === 'seluruh' ? 'rata-tertimbang' : null);
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
      var asumsi = 'Anggap setiap bulan produksi selalu mencapai produksi maksimum dan seluruh unit terjual, baik sebelum maupun sesudah metode baru diterapkan.';
      var tanya = 'Jika metode produksi baru memungkinkan biaya tenaga kerja ' + tm.produk[2] + ' turun menjadi $' + a2(Lbaru) + ' per unit sekaligus meningkatkan produksi maksimum menjadi ' + N + ' unit per bulan, berapa persentase kenaikan laba perusahaan dari produk tersebut?';
      var laba0 = M * u0, laba1 = N * u1, U = function (v) { return Fmt.uang(v, '$', Math.abs(v - Math.round(v)) < 0.005 ? 0 : 2, true); };
      var fm = function (v) { return Fmt.angka(v, { desimal: 0 }) + '%'; };
      var L0 = U(laba0), L1 = U(laba1);
      var tanpaBP0 = M * (harga2 - L), tanpaBP1 = N * (harga2 - Lbaru);
      var tanpaP0 = M * (harga2 - L - B), tanpaP1 = N * (harga2 - Lbaru - B);
      var pengecoh = [
        jalurKira(q + 100, 'menjawab laba baru sebagai persen dari laba lama (laba baru ÷ laba lama), bukan kenaikannya', L1 + ' ÷ ' + L0 + ' × 100%', fm, 1, '%'),
        jalurKira((u1 - u0) / u0 * 100, 'hanya membandingkan laba per unit, tanpa memperhitungkan perubahan jumlah produksi', '($' + a2(u1) + ' - $' + a2(u0) + ') ÷ $' + a2(u0) + ' × 100%', fm, 1, '%'),
        jalurKira((N / M - 1) * 100, 'hanya memperhitungkan kenaikan produksi maksimum', '(' + N + ' - ' + M + ') ÷ ' + M + ' × 100%', fm, 1, '%'),
        jalurKira((L - Lbaru) / L * 100, 'menghitung penurunan biaya tenaga kerja, bukan kenaikan laba', '($' + a2(L) + ' - $' + a2(Lbaru) + ') ÷ $' + a2(L) + ' × 100%', fm, 1, '%'),
        jalurKira((laba1 - laba0) / laba1 * 100, 'menghitung kenaikan terhadap laba baru, bukan terhadap laba lama', '(' + L1 + ' - ' + L0 + ') ÷ ' + L1 + ' × 100%', fm, 1, '%'),
        jalurKira((tanpaBP1 - tanpaBP0) / tanpaBP0 * 100, 'mengabaikan biaya bahan baku dan pengiriman saat menghitung laba', '(' + U(tanpaBP1) + ' - ' + U(tanpaBP0) + ') ÷ ' + U(tanpaBP0) + ' × 100%', fm, 1, '%'),
        jalurKira((tanpaP1 - tanpaP0) / tanpaP0 * 100, 'mengabaikan biaya pengiriman saat menghitung laba', '(' + U(tanpaP1) + ' - ' + U(tanpaP0) + ') ÷ ' + U(tanpaP0) + ' × 100%', fm, 1, '%')
      ];
      // nominal sen dibulatkan dulu supaya penjumlahan bilangan kambang tidak menyisakan galat
      var sen = function (v) { return Math.round(v * 100) / 100; }, D = function (v) { return '\\$' + E(sen(v), 2, true); };
      var tot1 = sen(Lbaru + B + P), np = tm.produk[2];
      var pembahasan = bahas([
        'Kolom ' + np + ': harga jual per unit $' + a2(harga2) + ', produksi maksimum ' + M + ' unit, biaya tenaga kerja $' + a2(L) + ', biaya bahan baku $' + a2(B) + ', biaya pengiriman $' + a2(P) + ' (total biaya per unit $' + a2(tot2) + ').',
        'Metode baru: biaya tenaga kerja $' + a2(Lbaru) + ' per unit dan produksi maksimum ' + N + ' unit per bulan.',
        'Produksi selalu mencapai produksi maksimum dan seluruh unit terjual.'
      ], 'Persentase kenaikan laba bulanan dari ' + np + '.', [
        'Laba per unit = harga jual - total biaya per unit; laba bulanan = laba per unit × produksi maksimum (semua unit terjual).',
        'Sebelum metode baru:',
        R(T('laba per unit') + ' = ' + D(harga2) + ' - (' + D(L) + ' + ' + D(B) + ' + ' + D(P) + ') = ' + D(harga2) + ' - ' + D(tot2) + ' = ' + D(u0)),
        R(T('laba lama') + ' = ' + M + ' \\times ' + D(u0) + ' = ' + ED(laba0)),
        'Sesudah metode baru (biaya bahan baku dan pengiriman tetap):',
        R(T('laba per unit baru') + ' = ' + D(harga2) + ' - (' + D(Lbaru) + ' + ' + D(B) + ' + ' + D(P) + ') = ' + D(harga2) + ' - ' + D(tot1) + ' = ' + D(u1)),
        R(T('laba baru') + ' = ' + N + ' \\times ' + D(u1) + ' = ' + ED(laba1)),
        'Persentase kenaikan dihitung terhadap laba lama:',
        R(T('kenaikan') + ' = \\frac{' + ED(laba1) + ' - ' + ED(laba0) + '}{' + ED(laba0) + '} \\times 100\\% = \\frac{' + ED(laba1 - laba0) + '}{' + ED(laba0) + '} \\times 100\\% = ' + kunci + '\\%')
      ], 'Jadi, laba perusahaan dari ' + np + ' naik ' + kunci + '%.');
      return riset({
        jenisSoal: 'Tabel - Aritmatika Keuangan',
        judul: 'Tabel · ' + tm.judul, gambar: gambarTabel(model), teks: [asumsi], pertanyaan: tanya,
        kunci: kunci, fmt: fm, pengecoh: pengecoh, min: 1, maks: 2000, bulat: true,
        langkah: [
          { nama: 'u0', rumus: 't0_3-t2_3' }, { nama: 'laba0', rumus: 't1_3*u0' },
          { nama: 'u1', rumus: 't0_3-(L+t4_3+t5_3)' }, { nama: 'laba1', rumus: 'N*u1' },
          { nama: 'jawab', rumus: '(laba1-laba0)/laba0*100' }
        ],
        pembahasan: pembahasan,
        model: { param: { L: String(Lbaru), N: String(N) }, tampil: { L: a2(Lbaru), N: String(N) }, toleransi: 1e-9, topik: 'Aritmatika Keuangan', cekTotalBiaya: { total: 2, bagian: [3, 4, 5], kolom: [1, 2, 3] } },
        sidik: { inti: 'laba-persen|' + ti + '|' + harga.join(',') + '|' + prod.join(',') + '|' + Lall.join(',') + '|' + Ball.join(',') + '|' + Pall.join(',') + '|' + Lbaru + '|' + N, param: harga.concat(prod, [Lbaru, N]), entitas: String(ti) }
      }, 'acuan', 'Mengikuti contoh Numerik Soal 13 (SHL G+ 25); anggapan produksi maksimum dan semua unit terjual ditulis eksplisit.');
    }
    return null;
  }

  // ===================================================== 6. tak diketahui

  var TEMA_RV = [
    // Rentang editorial untuk soal rekaan, bukan daftar harga pasar.
    { judul: 'Data Penjualan ABC RV Sales', objek: 'RV', model: ['Treeline', 'Lumberman', 'Highland'], unitKata: 'unit', harga: [[24000, 60000, 1000], [30000, 70000, 1000], [18000, 52000, 1000]] },
    { judul: 'Data Penjualan Diler Motor Sejahtera', objek: 'motor', model: ['Tipe Sport', 'Tipe Matik', 'Tipe Trail'], unitKata: 'unit', harga: [[3000, 12000, 100], [1500, 5000, 100], [2500, 9000, 100]] },
    { judul: 'Data Penjualan Toko Elektronik Prima', objek: 'peralatan', model: ['Kulkas', 'Mesin Cuci', 'Pendingin Ruangan'], unitKata: 'unit', harga: [[400, 1800, 100], [300, 1200, 100], [400, 2000, 100]] }
  ];

  function takDiketahui(a, level) {
    var ti = a.bulat(0, TEMA_RV.length - 1), tm = TEMA_RV[ti];
    for (var coba = 0; coba < 3000; coba++) {
      var harga = tm.harga.map(function (r) { return a.kelipatan(r[0], r[1], r[2]); });
      var laba = [a.bulat(14, 28), a.bulat(14, 28), a.bulat(14, 28)];
      var bonus = [a.bulat(5, 10), a.bulat(5, 10), a.bulat(5, 10)];
      var unit = [a.bulat(8, 22), a.bulat(8, 22), a.bulat(5, 25)];
      var gar = [a.bulat(2, 9), a.bulat(2, 9), a.bulat(2, 9)];
      var x = unit[2];
      var tot = 0;
      for (var k = 0; k < 3; k++) tot += harga[k] * laba[k] / 100 * unit[k] + harga[k] * bonus[k] / 100 * gar[k];
      if (Math.abs(tot - Math.round(tot)) > 1e-6) continue;
      if (x < 6 || x > 24 || gar.some(function (g, i) { return g > unit[i]; })) continue;
      var kunci = x;
      var baris = [
        { label: 'Harga jual per unit ($)', sel: harga.map(function (v) { return Fmt.angka(v); }) },
        { label: 'Laba¹ (%)', sel: laba.map(String) },
        { label: 'Bonus garansi² (%)', sel: bonus.map(String) },
        { label: 'Unit terjual', sel: [String(unit[0]), String(unit[1]), '?'] },
        { label: 'Jumlah garansi', sel: gar.map(String) }
      ];
      var model = { judul: tm.judul, kolom: [''].concat(tm.model), baris: baris,
        catatan: ['¹Persentase harga jual yang menjadi laba. ²Persentase harga jual yang diberikan untuk setiap garansi yang terjual.'] };
      var tanya = 'Jika pemilik mengetahui bahwa total laba perusahaan, termasuk bonus garansi, adalah $' + Fmt.angka(tot) + ' untuk tahun tersebut, berapa unit ' + tm.model[2] + ' yang terjual?';
      var fmUsd = function (v) { return '$' + Fmt.angka(v); };
      var lb = [0, 1, 2].map(function (k) { return harga[k] * laba[k] / 100; }), bg = [0, 1, 2].map(function (k) { return harga[k] * bonus[k] / 100 * gar[k]; });
      var dikenal = lb[0] * unit[0] + bg[0] + lb[1] * unit[1] + bg[1];
      var perUnit2 = lb[2], sisa = tot - dikenal - bg[2];
      var fm = function (v) { return Fmt.angka(v, { desimal: 0 }) + ' unit'; }, TT = fmUsd(tot), DD = fmUsd(dikenal);
      var pengecoh = [
        jalurKira((tot - dikenal) / perUnit2, 'mengabaikan bonus garansi ' + tm.model[2], '(' + TT + ' - ' + DD + ') ÷ ' + fmUsd(perUnit2), fm, 2, ' unit'),
        jalurKira((tot - lb[0] * unit[0] - lb[1] * unit[1]) / perUnit2, 'mengabaikan seluruh bonus garansi dan hanya memakai laba per unit',
          '(' + TT + ' - ' + fmUsd(lb[0] * unit[0]) + ' - ' + fmUsd(lb[1] * unit[1]) + ') ÷ ' + fmUsd(perUnit2), fm, 2, ' unit'),
        jalurKira((tot - dikenal) / (harga[2] * (laba[2] + bonus[2]) / 100), 'menjumlahkan persentase laba dan bonus garansi untuk setiap unit',
          '(' + TT + ' - ' + DD + ') ÷ (' + (laba[2] + bonus[2]) + '% × ' + fmUsd(harga[2]) + ')', fm, 2, ' unit'),
        jalurKira((tot - lb[0] * unit[0] - bg[0] - bg[2]) / perUnit2, 'hanya mengurangkan laba ' + tm.model[0] + ', lupa ' + tm.model[1],
          '(' + TT + ' - ' + fmUsd(lb[0] * unit[0] + bg[0]) + ' - ' + fmUsd(bg[2]) + ') ÷ ' + fmUsd(perUnit2), fm, 2, ' unit'),
        jalurKira((tot - dikenal - harga[2] * laba[2] / 100 * gar[2]) / (harga[2] * bonus[2] / 100), 'menukar persentase laba dan bonus garansi ' + tm.model[2],
          '(' + TT + ' - ' + DD + ' - ' + fmUsd(harga[2] * laba[2] / 100 * gar[2]) + ') ÷ ' + fmUsd(harga[2] * bonus[2] / 100), fm, 2, ' unit'),
        jalurKira(sisa / (harga[2] * bonus[2] / 100), 'membagi sisa laba dengan bonus garansi per unit, bukan laba per unit', fmUsd(sisa) + ' ÷ ' + fmUsd(harga[2] * bonus[2] / 100), fm, 2, ' unit'),
        jalurKira((tot - [0, 1].reduce(function (s, k) { return s + harga[k] * (laba[k] + bonus[k]) / 100 * unit[k]; }, 0)) / (harga[2] * (laba[2] + bonus[2]) / 100),
          'menghitung bonus garansi untuk setiap unit terjual, bukan per garansi', '(' + TT + ' - ' + fmUsd([0, 1].reduce(function (s, k) { return s + harga[k] * (laba[k] + bonus[k]) / 100 * unit[k]; }, 0)) + ') ÷ ' + fmUsd(harga[2] * (laba[2] + bonus[2]) / 100), fm, 2, ' unit')
      ];
      // laba dan bonus garansi dua model pertama, lalu persamaan untuk unit model ketiga (x)
      var olah = ['Laba suatu model = persentase laba × harga jual × unit terjual; bonus garansi = persentase bonus × harga jual × jumlah garansi (catatan tabel). Total laba = jumlah laba dan bonus ketiga model.'];
      [0, 1].forEach(function (k) {
        olah.push(R(T('laba ' + tm.model[k]) + ' = ' + laba[k] + '\\% \\times ' + ED(harga[k]) + ' \\times ' + unit[k] + ' = ' + ED(lb[k] * unit[k])));
        olah.push(R(T('bonus ' + tm.model[k]) + ' = ' + bonus[k] + '\\% \\times ' + ED(harga[k]) + ' \\times ' + gar[k] + ' = ' + ED(bg[k])));
      });
      olah.push(R(T('bonus ' + tm.model[2]) + ' = ' + bonus[2] + '\\% \\times ' + ED(harga[2]) + ' \\times ' + gar[2] + ' = ' + ED(bg[2])));
      olah.push('Misalkan unit ' + tm.model[2] + ' yang terjual = x, maka labanya:');
      olah.push(R(T('laba ' + tm.model[2]) + ' = ' + laba[2] + '\\% \\times ' + ED(harga[2]) + ' \\times x = ' + ED(perUnit2) + 'x'));
      olah.push('Jumlahkan semuanya dan samakan dengan total laba:');
      olah.push(R(ED(lb[0] * unit[0]) + ' + ' + ED(bg[0]) + ' + ' + ED(lb[1] * unit[1]) + ' + ' + ED(bg[1]) + ' + ' + ED(bg[2]) + ' + ' + ED(perUnit2) + 'x = ' + ED(tot)));
      olah.push(R(ED(dikenal + bg[2]) + ' + ' + ED(perUnit2) + 'x = ' + ED(tot)));
      olah.push(R(ED(perUnit2) + 'x = ' + ED(tot) + ' - ' + ED(dikenal + bg[2]) + ' = ' + ED(sisa)));
      olah.push(R('x = \\frac{' + ED(sisa) + '}{' + ED(perUnit2) + '} = ' + x + '\\ ' + T('unit')));
      var pembahasan = bahas([
        'Dari tabel (kolom ' + tm.model[0] + ', ' + tm.model[1] + ', ' + tm.model[2] + '): harga jual per unit ' + harga.map(fmUsd).join(', ') + '; laba ' + laba.join('%, ') + '%; bonus garansi ' + bonus.join('%, ') + '%.',
        'Unit terjual ' + tm.model[0] + ' ' + unit[0] + ', ' + tm.model[1] + ' ' + unit[1] + ', ' + tm.model[2] + ' tidak diketahui; jumlah garansi ' + gar.join(', ') + '.',
        'Total laba termasuk bonus garansi: ' + TT + '.'
      ], 'Banyak unit ' + tm.model[2] + ' yang terjual (x).', olah, 'Jadi, unit ' + tm.model[2] + ' yang terjual adalah ' + x + ' unit.');
      return riset({
        jenisSoal: 'Tabel - Aljabar Dasar',
        judul: 'Tabel · ' + tm.judul, gambar: gambarTabel(model), teks: [], pertanyaan: tanya,
        kunci: kunci, fmt: fm, pengecoh: pengecoh, min: 1, maks: 200, bulat: true,
        langkah: [
          { nama: 'lain', rumus: 't0_1*t1_1/100*t3_1+t0_1*t2_1/100*t4_1+t0_2*t1_2/100*t3_2+t0_2*t2_2/100*t4_2' },
          { nama: 'garansi', rumus: 't0_3*t2_3/100*t4_3' },
          { nama: 'jawab', rumus: '(Total-lain-garansi)/(t0_3*t1_3/100)' }
        ],
        pembahasan: pembahasan,
        model: { param: { Total: String(tot) }, tampil: { Total: Fmt.angka(tot) }, toleransi: 1e-9, topik: 'Aljabar Dasar' },
        sidik: { inti: 'tak-diketahui|' + ti + '|' + harga.join(',') + '|' + laba.join(',') + '|' + bonus.join(',') + '|' + unit.join(',') + '|' + gar.join(','), param: harga.concat(laba, bonus, unit, gar), entitas: String(ti) }
      }, 'acuan', 'Mengikuti contoh Numerik Soal 14 (unit terjual yang hilang dari total laba).');
    }
    return null;
  }

  // ======================================================= 7. harga per satuan

  /**
   * Seperti contoh riset Soal 15 (harga per cm³ dari ukuran tangki), dengan harga dalam dolar sejak awal
   * (tanpa konversi kurs). Mudah: harga per cm³ tangki terbesar. Sedang/sulit: juga harga per liter,
   * atau selisih harga per liter tangki besar dan tangki sedang. Harga per cm³ tangki besar (dan tangki
   * sedang pada bentuk selisih) dipilih dari daftar, jadi semua jawaban tepat.
   */
  var HARGA_CM3 = [0.0002, 0.0004, 0.0005, 0.0006, 0.0008, 0.001];

  function hargaSatuan(a, level) {
    for (var coba = 0; coba < 3000; coba++) {
      var dalam = a.pilih([0.4, 0.5, 0.5, 0.6]);
      var tinggi = [a.pilih([0.5, 0.6, 0.75]), a.pilih([0.8, 0.9, 1]), a.pilih([1.05, 1.2, 1.25, 1.5])];
      var lebar = [a.pilih([0.6, 0.8, 1]), a.pilih([1, 1.2, 1.25]), a.pilih([1.4, 1.5, 1.6, 1.8])];
      var u = a.pilih(HARGA_CM3);
      var bentuk = level === 'mudah' ? 'cm3' : a.pilih(['cm3', 'liter', 'selisih']);
      var u1 = bentuk === 'selisih' ? a.pilih(HARGA_CM3.filter(function (x) { return x !== u; })) : 0;
      var vol = tinggi.map(function (h, i) { return Math.round(h * lebar[i] * dalam * 1e6); });
      var harga = vol.map(function (v, i) { return Math.round(v * u * (i === 2 ? 1 : a.antara(0.9, 1.15))); });
      if (Math.abs(vol[2] * u - Math.round(vol[2] * u)) > 1e-9) continue;
      harga[2] = Math.round(vol[2] * u);
      if (bentuk === 'selisih') {
        // harga tangki sedang mengikuti harga per cm³ u1 dan harus bilangan bulat
        if (Math.abs(vol[1] * u1 - Math.round(vol[1] * u1)) > 1e-9) continue;
        harga[1] = Math.round(vol[1] * u1);
      }
      if (!(vol[0] < vol[1] && vol[1] < vol[2])) continue;
      if (harga[2] < 150 || harga[2] > 2000 || !(harga[0] < harga[1] && harga[1] < harga[2])) continue;
      var kunci, tanya, desimal;
      var perCm3 = harga[2] / vol[2], perLiter = [0, 1, 2].map(function (i) { return harga[i] / vol[i] * 1000; });
      if (bentuk === 'cm3') { kunci = perCm3; tanya = 'Untuk tangki ikan terbesar, berapa harga satu sentimeter kubik?'; desimal = 5; }
      else if (bentuk === 'liter') { kunci = perCm3 * 1000; tanya = 'Untuk tangki ikan terbesar, berapa harga satu liter (1 liter = 1.000 cm³)?'; desimal = 3; }
      else { kunci = Math.abs(perLiter[2] - perLiter[1]); tanya = 'Berapa selisih harga per liter antara tangki besar dan tangki sedang (1 liter = 1.000 cm³)?'; desimal = 3; }
      // harga per liter ditulis sedikitnya dua angka desimal seperti nominal sen ($0,30; $1,00), paling banyak tiga
      var angkaUang = function (v) { var s = Fmt.angka(v, { desimal: desimal }); return desimal === 3 && !/,\d\d/.test(s) ? Fmt.angka(v, { desimal: 2, tetap: true }) : s; };
      var fm = function (v) { return '$' + angkaUang(v); }, UE = function (v) { return '\\$' + angkaUang(v).replace(',', '{,}'); };
      if (Math.abs(kunci * Math.pow(10, desimal) - Math.round(kunci * Math.pow(10, desimal))) > 1e-6) continue;
      if (kunci <= 0) continue;
      var baris = [
        { label: 'Tangki kecil', sel: [a2(tinggi[0]), a2(lebar[0]), Fmt.angka(harga[0])] },
        { label: 'Tangki sedang', sel: [a2(tinggi[1]), a2(lebar[1]), Fmt.angka(harga[1])] },
        { label: 'Tangki besar', sel: [a2(tinggi[2]), a2(lebar[2]), Fmt.angka(harga[2])] }
      ];
      var model = { judul: 'Harga Tangki Ikan, Tropical Fish Tanks Ltd', kolom: ['', 'Tinggi (m)', 'Lebar (m)', 'Harga ($)'], baris: baris, catatan: ['Semua tangki berkedalaman ' + Fmt.angka(dalam, { desimal: 2 }) + ' m.'] };
      var H = '$' + Fmt.angka(harga[2]), dim = A(tinggi[2]) + ' × ' + A(lebar[2]) + ' × ' + A(dalam), V = Fmt.angka(vol[2]), pengecoh;
      if (bentuk !== 'selisih') {
        // faktor dari harga per cm³ ke satuan yang ditanyakan
        var mult = bentuk === 'liter' ? 1000 : 1, ke = bentuk === 'liter' ? ' × 1.000' : '';
        pengecoh = [
          jalur(perCm3 * 1e6 * mult, 'menghitung harga per meter kubik, bukan per sentimeter kubik', H + ' ÷ (' + dim + ')' + ke, fm),
          jalur(harga[2] / (tinggi[2] * lebar[2] * dalam * 100) * mult, 'mengubah m³ ke cm³ dengan faktor 100, bukan 1.000.000', H + ' ÷ (' + dim + ' × 100)' + ke, fm),
          jalur(harga[2] / (tinggi[2] * lebar[2] * dalam * 1e4) * mult, 'mengubah m³ ke cm³ dengan faktor 10.000, bukan 1.000.000', H + ' ÷ (' + dim + ' × 10.000)' + ke, fm),
          jalur(harga[2] / (tinggi[2] * lebar[2] * 1e4) * mult, 'memakai luas sisi depan (tinggi × lebar dalam cm²), bukan volume', H + ' ÷ (' + A(tinggi[2] * 100, 0) + ' × ' + A(lebar[2] * 100, 0) + ')' + ke, fm),
          jalur(harga[1] / vol[1] * mult, 'membaca baris tangki sedang, bukan tangki terbesar', '$' + Fmt.angka(harga[1]) + ' ÷ ' + Fmt.angka(vol[1]) + ke, fm),
          jalur(harga[2] / (tinggi[2] * lebar[2] * dalam * 1e9) * mult, 'mengubah m³ ke mm³ (1 m³ = 1.000.000.000 mm³), bukan ke cm³', H + ' ÷ (' + dim + ' × 1.000.000.000)' + ke, fm)
        ];
        if (bentuk === 'cm3') pengecoh.splice(1, 0, jalur(perCm3 * 1000, 'menghitung harga per liter (1 liter = 1.000 cm³), bukan per cm³', H + ' ÷ ' + V + ' × 1.000', fm));
        else {
          pengecoh.splice(1, 0, jalur(perCm3, 'berhenti pada harga per cm³, lupa mengalikan 1.000', H + ' ÷ ' + V, fm));
          pengecoh.push(jalur(perCm3 * 100, 'menganggap 1 liter = 100 cm³', H + ' ÷ ' + V + ' × 100', fm));
        }
      } else {
        var H1 = '$' + Fmt.angka(harga[1]), V1 = Fmt.angka(vol[1]), L2 = vol[2] / 1000, L1 = vol[1] / 1000;
        var kurangT = function (x, y, tx, ty) { return x >= y ? tx + ' - ' + ty : ty + ' - ' + tx; };
        pengecoh = [
          jalur(Math.abs(perCm3 - harga[1] / vol[1]), 'berhenti pada selisih harga per cm³, lupa mengalikan 1.000', kurangT(perCm3, harga[1] / vol[1], H + ' ÷ ' + V, H1 + ' ÷ ' + V1), fm),
          jalur(perLiter[2] + perLiter[1], 'menjumlahkan harga per liter kedua tangki, bukan mencari selisihnya', H + ' ÷ ' + V + ' × 1.000 + ' + H1 + ' ÷ ' + V1 + ' × 1.000', fm),
          jalur(Math.abs(harga[2] - harga[1]) / (L2 - L1), 'membagi selisih harga dengan selisih volume (dalam liter)', '(' + H + ' - ' + H1 + ') ÷ (' + Fmt.angka(L2) + ' - ' + Fmt.angka(L1) + ')', fm),
          jalur(Math.abs(perLiter[2] - perLiter[0]), 'membaca baris tangki kecil, bukan tangki sedang', kurangT(perLiter[2], perLiter[0], H + ' ÷ ' + V + ' × 1.000', '$' + Fmt.angka(harga[0]) + ' ÷ ' + Fmt.angka(vol[0]) + ' × 1.000'), fm),
          jalur(Math.abs(perLiter[2] - perLiter[1]) / 10, 'menganggap 1 liter = 100 cm³', kurangT(perLiter[2], perLiter[1], H + ' ÷ ' + V + ' × 100', H1 + ' ÷ ' + V1 + ' × 100'), fm),
          jalur(perLiter[2], 'hanya menghitung harga per liter tangki besar', H + ' ÷ ' + V + ' × 1.000', fm)
        ];
      }
      // pembahasan: volume (m³ lalu cm³, 1 m³ = (100 cm)³), harga per cm³, lalu satuan yang ditanyakan
      var vm3 = function (i) { return tinggi[i] * lebar[i] * dalam; }, m3 = '\\ ' + T('m') + '^{3}', cm3 = '\\ ' + T('cm') + '^{3}';
      var olah = [
        'Volume tangki = tinggi × lebar × kedalaman:',
        R('V = ' + E(tinggi[2]) + ' \\times ' + E(lebar[2]) + ' \\times ' + E(dalam) + ' = ' + E(vm3(2), 6) + m3),
        bentuk === 'cm3' ? 'Harga ditanyakan per sentimeter kubik, jadi volume diubah ke cm³. Karena 1 m = 100 cm:' : 'Volume diubah dahulu ke cm³ (soal memberi 1 liter = 1.000 cm³). Karena 1 m = 100 cm:',
        R('1' + m3 + ' = (100\\ ' + T('cm') + ')^{3} = 100 \\times 100 \\times 100' + cm3 + ' = 1.000.000' + cm3),
        R('V = ' + E(vm3(2), 6) + ' \\times 1.000.000 = ' + E(vol[2]) + cm3)
      ];
      if (bentuk === 'selisih') {
        olah.push('Dengan cara yang sama, volume tangki sedang:',
          R('V_{' + T('sedang') + '} = ' + E(tinggi[1]) + ' \\times ' + E(lebar[1]) + ' \\times ' + E(dalam) + ' = ' + E(vm3(1), 6) + m3 + ' = ' + E(vol[1]) + cm3),
          'Harga per liter = harga ÷ volume (cm³) × 1.000, karena 1 liter = 1 dm³ = (10 cm)³ = 1.000 cm³:',
          R(T('besar') + ' = \\frac{' + ED(harga[2]) + '}{' + E(vol[2]) + '} \\times 1.000 = ' + UE(perLiter[2])),
          R(T('sedang') + ' = \\frac{' + ED(harga[1]) + '}{' + E(vol[1]) + '} \\times 1.000 = ' + UE(perLiter[1])),
          'Selisihnya, yang lebih besar dikurangi yang lebih kecil:',
          R(T('selisih') + ' = ' + UE(Math.max(perLiter[2], perLiter[1])) + ' - ' + UE(Math.min(perLiter[2], perLiter[1])) + ' = ' + UE(kunci)));
      } else {
        olah.push('Harga per cm³ = harga ÷ volume:',
          R(T('harga per cm') + '^{3} = \\frac{' + ED(harga[2]) + '}{' + E(vol[2]) + '} = \\$' + E(perCm3, 5)));
        if (bentuk === 'liter') {
          olah.push('Satu liter sama dengan satu desimeter kubik, dan 1 dm = 10 cm:',
            R('1\\ ' + T('liter') + ' = 1\\ ' + T('dm') + '^{3} = (10\\ ' + T('cm') + ')^{3} = 1.000' + cm3),
            R(T('harga per liter') + ' = 1.000 \\times \\$' + E(perCm3, 5) + ' = ' + UE(kunci)));
        }
      }
      var dik = ['Baris Tangki besar: tinggi ' + A(tinggi[2]) + ' m (kolom Tinggi), lebar ' + A(lebar[2]) + ' m (kolom Lebar), harga ' + H + ' (kolom Harga).'];
      if (bentuk === 'selisih') dik.push('Baris Tangki sedang: tinggi ' + A(tinggi[1]) + ' m, lebar ' + A(lebar[1]) + ' m, harga $' + Fmt.angka(harga[1]) + '.');
      dik.push('Kedalaman semua tangki ' + A(dalam) + ' m (catatan tabel).');
      var pembahasan = bahas(dik,
        bentuk === 'cm3' ? 'Harga satu sentimeter kubik (cm³) untuk tangki terbesar.' : (bentuk === 'liter' ? 'Harga satu liter untuk tangki terbesar.' : 'Selisih harga per liter tangki besar dan tangki sedang.'),
        olah, bentuk === 'cm3' ? 'Jadi, harga satu sentimeter kubik tangki terbesar adalah ' + fm(kunci) + '.'
          : (bentuk === 'liter' ? 'Jadi, harga satu liter tangki terbesar adalah ' + fm(kunci) + '.' : 'Jadi, selisih harga per liter kedua tangki adalah ' + fm(kunci) + '.'));
      var perCm = function (r) { return 't' + r + '_3/(t' + r + '_1*t' + r + '_2*Dalam*1000000)'; };
      var rumusJawab = bentuk === 'selisih' ? 'abs(' + perCm(2) + '-' + perCm(1) + ')*1000' : perCm(2) + (bentuk === 'liter' ? '*1000' : '');
      return riset({
        jenisSoal: 'Tabel - Pengukuran dan Konversi Satuan',
        judul: 'Tabel · Harga Tangki Ikan', gambar: gambarTabel(model), teks: [], pertanyaan: tanya,
        kunci: kunci, fmt: fm, pengecoh: pengecoh, min: Math.pow(10, -desimal), maks: 100000,
        langkah: [{ nama: 'jawab', rumus: rumusJawab }],
        pembahasan: pembahasan,
        model: { param: { Dalam: String(dalam) }, tampil: {}, toleransi: Math.pow(10, -desimal) / 2 + 1e-12, topik: 'Pengukuran dan Konversi Satuan', tampilGambar: { Dalam: Fmt.angka(dalam, { desimal: 2 }) }, konteks: bentuk === 'cm3' ? [] : ['1', '1.000'] },
        sidik: { inti: 'harga-satuan|' + tinggi.join(',') + '|' + lebar.join(',') + '|' + dalam + '|' + harga.join(',') + '|' + bentuk, param: tinggi.concat(lebar, [dalam, u, u1]), entitas: bentuk }
      }, 'acuan', 'Mengikuti contoh Numerik Soal 15 (harga per cm³ dari ukuran tangki) dengan harga dalam dolar, ditambah variasi harga per liter dan selisih harga per liter dua tangki.', 'konversi-volume');
    }
    return null;
  }

  // ================================================== 8. perubahan persen

  var TEMA_WILAYAH = [
    { judul: 'Penjualan per Wilayah ($)', baris: ['Sumatra', 'Jawa', 'Kalimantan', 'Sulawesi', 'Bali dan Nusa Tenggara', 'Papua'], kolom: ['Tahun 2023', 'Tahun 2024'], skala: 1000 },
    { judul: 'Jumlah Nasabah per Kantor Wilayah', baris: ['Wilayah I', 'Wilayah II', 'Wilayah III', 'Wilayah IV', 'Wilayah V', 'Wilayah VI'], kolom: ['Semester 1', 'Semester 2'], skala: 100 },
    { judul: 'Produksi per Pabrik (ton)', baris: ['Pabrik Utara', 'Pabrik Selatan', 'Pabrik Barat', 'Pabrik Timur', 'Pabrik Pusat', 'Pabrik Pesisir'], kolom: ['Kuartal 1', 'Kuartal 2'], skala: 1 }
  ];

  function perubahanPersen(a, level) {
    var ti = a.bulat(0, TEMA_WILAYAH.length - 1), tm = TEMA_WILAYAH[ti];
    for (var coba = 0; coba < 2000; coba++) {
      var n = level === 'mudah' ? 4 : 5;
      var nama = a.ambil(tm.baris, n);
      var v0 = [], v1 = [];
      for (var i = 0; i < n; i++) {
        var b = a.kelipatan(40, 400, 10) * tm.skala;
        var pct = a.pilih([-20, -10, -5, 5, 10, 15, 20, 25, 30, 40]);
        v0.push(b); v1.push(b * (100 + pct) / 100);
      }
      if (v1.some(function (x) { return Math.abs(x - Math.round(x)) > 1e-9; })) continue;
      var bentuk = level === 'mudah' ? 'satu' : a.pilih(['satu', 'total']);
      var ii = a.bulat(0, n - 1), kunci, tanya;
      var tot0 = jumlah(v0), tot1 = jumlah(v1), k0 = tm.kolom[0].toLowerCase(), k1 = tm.kolom[1].toLowerCase();
      if (bentuk === 'satu') { kunci = (v1[ii] - v0[ii]) / v0[ii] * 100; tanya = 'Berapa persentase perubahan dari ' + k0 + ' ke ' + k1 + ' pada ' + nama[ii] + '?'; }
      else { kunci = (tot1 - tot0) / tot0 * 100; tanya = 'Berapa persentase perubahan total seluruh baris dari ' + k0 + ' ke ' + k1 + '?'; if (Math.abs(kunci - Math.round(kunci)) > 0.045) continue; kunci = Math.round(kunci); }
      if (Math.abs(kunci) < 4) continue;
      var baris = nama.map(function (nm, k) { return { label: nm, sel: [Fmt.angka(v0[k]), Fmt.angka(v1[k])] }; });
      var model = { judul: tm.judul, kolom: ['', tm.kolom[0], tm.kolom[1]], baris: baris };
      var fm = function (v) { return Fmt.angka(v, { desimal: 1 }) + '%'; }, F = Fmt.angka, pengecoh;
      var j1 = (ii + 1) % n;
      if (bentuk === 'satu') {
        var x0 = F(v0[ii]), x1 = F(v1[ii]);
        pengecoh = [
          jalur((v1[ii] - v0[ii]) / v1[ii] * 100, 'menghitung perubahan terhadap nilai akhir, bukan nilai awal', '(' + x1 + ' - ' + x0 + ') ÷ ' + x1 + ' × 100%', fm),
          jalur(v1[ii] / v0[ii] * 100, 'menjawab nilai akhir sebagai persen dari nilai awal', x1 + ' ÷ ' + x0 + ' × 100%', fm),
          jalur((v0[ii] - v1[ii]) / v0[ii] * 100, 'mengurangkan nilai akhir dari nilai awal sehingga arah perubahannya terbalik', '(' + x0 + ' - ' + x1 + ') ÷ ' + x0 + ' × 100%', fm),
          jalur((tot1 - tot0) / tot0 * 100, 'memakai total seluruh baris, bukan baris yang ditanyakan', '(' + F(tot1) + ' - ' + F(tot0) + ') ÷ ' + F(tot0) + ' × 100%', fm),
          jalur((v1[ii] - v0[ii]) / v0[ii], 'lupa mengalikan dengan 100%', '(' + x1 + ' - ' + x0 + ') ÷ ' + x0, fm),
          jalur((v1[j1] - v0[j1]) / v0[j1] * 100, 'membaca baris ' + nama[j1] + ', bukan ' + nama[ii], '(' + F(v1[j1]) + ' - ' + F(v0[j1]) + ') ÷ ' + F(v0[j1]) + ' × 100%', fm)
        ];
      } else {
        var T0 = F(tot0), T1 = F(tot1);
        pengecoh = [
          jalur(jumlah(v0.map(function (x, k) { return (v1[k] - x) / x * 100; })) / n, 'merata-ratakan persentase tiap baris tanpa memperhitungkan besar masing-masing',
            '(' + v0.map(function (x, k) { return A((v1[k] - x) / x * 100, 1) + '%'; }).join(' + ') + ') ÷ ' + n, fm),
          jalur((tot1 - tot0) / tot1 * 100, 'menghitung perubahan terhadap total akhir, bukan total awal', '(' + T1 + ' - ' + T0 + ') ÷ ' + T1 + ' × 100%', fm),
          jalur(tot1 / tot0 * 100, 'menjawab total akhir sebagai persen dari total awal', T1 + ' ÷ ' + T0 + ' × 100%', fm),
          jalur((tot0 - tot1) / tot0 * 100, 'mengurangkan total akhir dari total awal sehingga arah perubahannya terbalik', '(' + T0 + ' - ' + T1 + ') ÷ ' + T0 + ' × 100%', fm),
          jalur((tot1 - tot0) / tot0, 'lupa mengalikan dengan 100%', '(' + T1 + ' - ' + T0 + ') ÷ ' + T0, fm),
          jalur((v1[0] - v0[0]) / v0[0] * 100, 'hanya membaca baris pertama (' + nama[0] + ')', '(' + F(v1[0]) + ' - ' + F(v0[0]) + ') ÷ ' + F(v0[0]) + ' × 100%', fm)
        ];
      }
      // perubahan sebagai pecahan terhadap nilai awal; tanda negatif berarti turun
      var awalV = bentuk === 'satu' ? v0[ii] : tot0, akhirV = bentuk === 'satu' ? v1[ii] : tot1, persenAsli = (akhirV - awalV) / awalV * 100;
      var arahKata = kunci < 0 ? 'turun ' + F(-kunci) + '%' : 'naik ' + F(kunci) + '%';
      var olah = [];
      if (bentuk === 'total') {
        olah.push('Jumlahkan setiap kolom untuk semua baris:',
          R(T('total ' + k0) + ' = ' + v0.map(function (x) { return E(x); }).join(' + ') + ' = ' + E(tot0)),
          R(T('total ' + k1) + ' = ' + v1.map(function (x) { return E(x); }).join(' + ') + ' = ' + E(tot1)));
      }
      olah.push('Persentase perubahan dihitung terhadap nilai awal (' + k0 + '):',
        R(T('perubahan') + ' = \\frac{' + T('nilai akhir') + ' - ' + T('nilai awal') + '}{' + T('nilai awal') + '} \\times 100\\%'),
        R(T('perubahan') + ' = \\frac{' + E(akhirV) + ' - ' + E(awalV) + '}{' + E(awalV) + '} \\times 100\\% = \\frac{' + E(akhirV - awalV) + '}{' + E(awalV) + '} \\times 100\\% ' +
          (Math.abs(persenAsli - kunci) < 1e-9 ? '= ' : '\\approx ') + E(kunci, 1) + '\\%'),
        'Tanda ' + (kunci < 0 ? 'negatif berarti nilainya turun' : 'positif berarti nilainya naik') + ' ' + F(Math.abs(kunci)) + '% dari ' + k0 + ' ke ' + k1 + '.');
      var pembahasan = bahas(bentuk === 'satu'
        ? ['Baris ' + nama[ii] + ': kolom ' + tm.kolom[0] + ' ' + F(v0[ii]) + ', kolom ' + tm.kolom[1] + ' ' + F(v1[ii]) + '.']
        : ['Kolom ' + tm.kolom[0] + ': ' + nama.map(function (nm, k) { return nm + ' ' + F(v0[k]); }).join(', ') + '.', 'Kolom ' + tm.kolom[1] + ': ' + nama.map(function (nm, k) { return nm + ' ' + F(v1[k]); }).join(', ') + '.'],
      'Persentase perubahan ' + (bentuk === 'satu' ? nama[ii] : 'total seluruh baris') + ' dari ' + k0 + ' ke ' + k1 + '.', olah,
      'Jadi, persentase perubahannya ' + F(kunci) + '%, artinya ' + (bentuk === 'satu' ? nama[ii] : 'total seluruh baris') + ' ' + arahKata + '.');
      var jumlahRumus0 = [], jumlahRumus1 = [];
      for (var q = 0; q < n; q++) { jumlahRumus0.push(t(q, 1)); jumlahRumus1.push(t(q, 2)); }
      return riset({
        jenisSoal: 'Tabel - Persentase dan Pertumbuhan',
        judul: 'Tabel · ' + tm.judul, gambar: gambarTabel(model), teks: [], pertanyaan: tanya,
        kunci: Math.round(kunci * 10) / 10, fmt: fm,
        pengecoh: pengecoh.map(function (p) { return { nilai: Fmt.bulatkan(p.nilai, 1), alasan: p.alasan }; }), maks: 500, min: -100,
        langkah: bentuk === 'satu'
          ? [{ nama: 'jawab', rumus: '(' + t(ii, 2) + '-' + t(ii, 1) + ')/' + t(ii, 1) + '*100' }]
          : [{ nama: 'a', rumus: jumlahRumus0.join('+') }, { nama: 'b', rumus: jumlahRumus1.join('+') }, { nama: 'jawab', rumus: '(b-a)/a*100' }],
        pembahasan: pembahasan,
        model: { param: {}, tampil: {}, toleransi: 0.0501, topik: 'Persentase dan Pertumbuhan', konteks: angkaLabel(tm.kolom[0], tm.kolom[1]) },
        sidik: { inti: 'perubahan-persen|' + ti + '|' + nama.join(',') + '|' + v0.join(',') + '|' + v1.join(',') + '|' + bentuk + '|' + ii, param: v0.concat(v1, [ii]), entitas: ti + nama.join('') }
      }, 'pengayaan', 'Tambahan tim: persentase perubahan satu baris atau total tabel.', 'persen-perubahan');
    }
    return null;
  }

  // =========================================== 9. pertumbuhan majemuk tahunan

  var TEMA_TUMBUH = [
    { judul: 'Nilai Investasi per Unit Usaha', baris: ['Unit Agro', 'Unit Ritel', 'Unit Logistik', 'Unit Properti', 'Unit Energi'], kolomNilai: 'Nilai akhir 2024 ($)', benda: 'nilai investasi' },
    { judul: 'Pendapatan Tahunan per Cabang', baris: ['Cabang Utara', 'Cabang Selatan', 'Cabang Barat', 'Cabang Timur', 'Cabang Pusat'], kolomNilai: 'Pendapatan 2024 ($)', benda: 'pendapatan' },
    { judul: 'Nilai Aset per Divisi', baris: ['Divisi Ekspor', 'Divisi Impor', 'Divisi Gudang', 'Divisi Armada', 'Divisi Jasa'], kolomNilai: 'Nilai akhir 2024 ($)', benda: 'nilai aset' }
  ];

  /**
   * Pertumbuhan majemuk tahunan dari tabel (mengisi celah "compound-growth tables"): nilai
   * 2024 dan persentase pertumbuhan per tahun tiap baris; ditanyakan nilai pada tahun
   * tertentu. Mudah: satu baris, 2 tahun. Sedang: satu baris, 3 tahun. Sulit: selisih dua
   * baris setelah 3 tahun, salah satunya bisa turun.
   */
  function tumbuhMajemuk(a, level) {
    var ti = a.bulat(0, TEMA_TUMBUH.length - 1), tm = TEMA_TUMBUH[ti];
    for (var coba = 0; coba < 3000; coba++) {
      var nb = 4, nama = a.ambil(tm.baris, nb), tahun = level === 'mudah' ? 2 : 3, akhir = 2024 + tahun;
      var V = [], p = [];
      for (var i = 0; i < nb; i++) {
        V.push(a.kelipatan(2, 40, 1) * 10000);
        p.push(a.pilih(level === 'sulit' ? [-10, -5, 4, 5, 6, 8, 10, 12, 15, 20] : [4, 5, 6, 8, 10, 12, 15, 20, 25]));
      }
      var nilai = function (k, n) { return V[k] * Math.pow(1 + p[k] / 100, n); };
      var sen = function (v) { return Math.abs(v * 100 - Math.round(v * 100)) < 1e-6; };
      var ia = a.bulat(0, nb - 1), ib = (ia + a.bulat(1, nb - 1)) % nb, sulit = level === 'sulit';
      if (!sen(nilai(ia, tahun)) || (sulit && !sen(nilai(ib, tahun)))) continue;
      if (sulit && (V[ia] === V[ib] || p[ia] === p[ib] || nilai(ia, tahun) <= nilai(ib, tahun))) continue;
      var kunci = sulit ? nilai(ia, tahun) - nilai(ib, tahun) : nilai(ia, tahun);
      var fm = function (v) { return Fmt.uang(v, '$', Math.abs(v - Math.round(v)) < 0.005 ? 0 : 2, true); }, F = Fmt.angka;
      var fk = function (k) { return A(1 + p[k] / 100, 2); };
      var tumbuh = function (k, n) { return '$' + F(V[k]) + ' × ' + fk(k) + (n === 1 ? '' : '^' + n); };
      var baris = nama.map(function (nm, k) { return { label: nm, sel: [F(V[k]), String(p[k])] }; });
      var model = { judul: tm.judul, kolom: ['', tm.kolomNilai, 'Pertumbuhan\nper tahun (%)'], baris: baris,
        catatan: ['Pertumbuhan per tahun dihitung dari nilai akhir tahun sebelumnya; persentase negatif berarti turun.'] };
      var tanya = sulit
        ? 'Nilai pada tabel adalah nilai akhir 2024. Jika persentase pertumbuhan per tahun tetap seperti pada tabel, berapa selisih ' + tm.benda + ' ' + nama[ia] + ' dan ' + nama[ib] + ' setelah ' + tahun + ' tahun, yaitu pada akhir ' + akhir + '?'
        : 'Nilai pada tabel adalah nilai akhir 2024. Jika persentase pertumbuhan per tahun tetap seperti pada tabel, berapa ' + tm.benda + ' ' + nama[ia] + ' setelah ' + tahun + ' tahun, yaitu pada akhir ' + akhir + '?';
      var pengecoh;
      if (!sulit) {
        var k = ia, jl = (ia + 1) % nb;
        pengecoh = [
          jalur(V[k] * (1 + tahun * p[k] / 100), 'menghitung pertumbuhan ' + p[k] + '% dari nilai 2024 setiap tahun (pertumbuhan sederhana)', '$' + F(V[k]) + ' × (1 + ' + tahun + ' × ' + p[k] + '%)', fm),
          jalur(nilai(k, tahun - 1), 'menghitung satu tahun pertumbuhan terlalu sedikit', tumbuh(k, tahun - 1), fm),
          jalur(nilai(k, tahun + 1), 'menghitung tahun 2024 juga sebagai tahun pertumbuhan', tumbuh(k, tahun + 1), fm),
          jalur(nilai(k, tahun) - V[k], 'menjawab besar kenaikannya, bukan nilai akhirnya', tumbuh(k, tahun) + ' - $' + F(V[k]), fm),
          jalur(V[k] * Math.pow(1 + p[jl] / 100, tahun), 'memakai persentase pertumbuhan baris ' + nama[jl], '$' + F(V[k]) + ' × ' + fk(jl) + '^' + tahun, fm),
          jalur(V[k] * tahun * (1 + p[k] / 100), 'mengalikan nilai dengan banyaknya tahun', '$' + F(V[k]) + ' × ' + tahun + ' × ' + fk(k), fm)
        ];
      } else {
        var NA = nilai(ia, tahun), NB = nilai(ib, tahun);
        pengecoh = [
          jalur(Math.abs(V[ia] * (1 + tahun * p[ia] / 100) - V[ib] * (1 + tahun * p[ib] / 100)), 'memakai pertumbuhan sederhana untuk kedua baris',
            '$' + F(V[ia]) + ' × (1 + ' + tahun + ' × ' + p[ia] + '%) - $' + F(V[ib]) + ' × (1 + ' + tahun + ' × ' + p[ib] + '%)', fm),
          jalur(Math.abs(V[ia] - V[ib]), 'menghitung selisih nilai 2024 saja, lupa menumbuhkannya', '$' + F(Math.max(V[ia], V[ib])) + ' - $' + F(Math.min(V[ia], V[ib])), fm),
          jalur(Math.abs(nilai(ia, tahun - 1) - nilai(ib, tahun - 1)), 'menghitung satu tahun pertumbuhan terlalu sedikit', tumbuh(ia, tahun - 1) + ' - ' + tumbuh(ib, tahun - 1), fm),
          jalur(Math.abs(nilai(ia, tahun + 1) - nilai(ib, tahun + 1)), 'menghitung tahun 2024 juga sebagai tahun pertumbuhan', tumbuh(ia, tahun + 1) + ' - ' + tumbuh(ib, tahun + 1), fm),
          jalur(NA + NB, 'menjumlahkan, bukan menghitung selisih', tumbuh(ia, tahun) + ' + ' + tumbuh(ib, tahun), fm),
          jalur(Math.abs(V[ia] - V[ib]) * Math.pow(1 + p[ia] / 100, tahun), 'menumbuhkan selisih nilai 2024 dengan pertumbuhan ' + nama[ia] + ' saja',
            '($' + F(Math.max(V[ia], V[ib])) + ' - $' + F(Math.min(V[ia], V[ib])) + ') × ' + fk(ia) + '^' + tahun, fm)
        ];
      }
      // nilai tiap tahun tepat dalam sen (V kelipatan 10.000, paling lama 3 tahun), jadi semua baris memakai "="
      var urai = function (k) {
        var fE = E(1 + p[k] / 100, 2), v = V[k], hasil = [
          (p[k] < 0 ? 'Turun ' + (-p[k]) + '% per tahun berarti dikali 100% - ' + (-p[k]) + '% = ' : 'Naik ' + p[k] + '% per tahun berarti dikali 100% + ' + p[k] + '% = ') + fk(k) + ' setiap tahun. Untuk ' + nama[k] + ':',
          R('V_{' + akhir + '} = ' + ED(V[k]) + ' \\times (' + fE + ')^{' + tahun + '} = ' + ED(nilai(k, tahun))),
          'Rinciannya per tahun:'
        ];
        for (var y = 1; y <= tahun; y++) {
          var lama = v;
          v = V[k] * Math.pow(1 + p[k] / 100, y);
          hasil.push(R('V_{' + (2024 + y) + '} = ' + ED(lama) + ' \\times ' + fE + ' = ' + ED(v)));
        }
        return hasil;
      };
      var olah = ['Pertumbuhan majemuk: setiap tahun nilai dihitung dari nilai akhir tahun sebelumnya. Nilai setelah n tahun sama dengan nilai awal (akhir 2024) dikali (1 + p) sebanyak n kali, dengan p pertumbuhan per tahun:',
        R('V_{n} = V_{0} \\times (1 + p)^{n}')].concat(urai(ia));
      if (sulit) olah = olah.concat(urai(ib)).concat(['Selisih kedua nilai pada akhir ' + akhir + ':', R(T('selisih') + ' = ' + ED(nilai(ia, tahun)) + ' - ' + ED(nilai(ib, tahun)) + ' = ' + ED(kunci))]);
      var dikTM = [nama[ia], sulit ? nama[ib] : null].filter(Boolean).map(function (nm) {
        var k = nama.indexOf(nm);
        return 'Baris ' + nm + ': nilai akhir 2024 $' + F(V[k]) + ' (kolom ' + label(tm.kolomNilai).replace(/\s*\(\$\)$/, '') + '), pertumbuhan ' + p[k] + '% per tahun.';
      }).concat(['Lama pertumbuhan: ' + tahun + ' tahun, dari akhir 2024 sampai akhir ' + akhir + '.']);
      var pembahasan = bahas(dikTM, sulit ? 'Selisih ' + tm.benda + ' ' + nama[ia] + ' dan ' + nama[ib] + ' pada akhir ' + akhir + '.' : Kamus.kap(tm.benda) + ' ' + nama[ia] + ' pada akhir ' + akhir + '.', olah,
        sulit ? 'Jadi, selisih ' + tm.benda + ' kedua baris pada akhir ' + akhir + ' adalah ' + fm(kunci) + '.' : 'Jadi, ' + tm.benda + ' ' + nama[ia] + ' pada akhir ' + akhir + ' adalah ' + fm(kunci) + '.');
      var rumus = function (k) { return t(k, 1) + '*(1+' + t(k, 2) + '/100)^n'; };
      return riset({
        jenisSoal: 'Tabel - Persentase dan Pertumbuhan',
        judul: 'Tabel · ' + tm.judul, gambar: gambarTabel(model), teks: [], pertanyaan: tanya,
        kunci: kunci, fmt: fm, pengecoh: pengecoh, min: 1,
        langkah: sulit ? [{ nama: 'x', rumus: rumus(ia) }, { nama: 'y', rumus: rumus(ib) }, { nama: 'jawab', rumus: 'x-y' }] : [{ nama: 'jawab', rumus: rumus(ia) }],
        pembahasan: pembahasan,
        model: { param: { n: String(tahun) }, tampil: { n: String(tahun) }, toleransi: 0.005, topik: 'Persentase dan Pertumbuhan', konteks: ['2024', String(akhir)] },
        sidik: { inti: 'tabel-tumbuh-majemuk|' + ti + '|' + nama.join(',') + '|' + V.join(',') + '|' + p.join(',') + '|' + level + '|' + ia + '|' + ib, param: V.concat(p, [ia, ib]), entitas: ti + nama.join('') }
      }, 'pengayaan', 'Tambahan tim untuk cakupan tabel pertumbuhan majemuk tahunan.', 'pertumbuhan-majemuk');
    }
    return null;
  }

  // ============================================ 10. rata-rata gabungan baris

  var TEMA_GABUNG = [
    { judul: 'Hasil Ujian Sertifikasi per Angkatan', awalan: 'Angkatan ', kolom: ['Jumlah peserta', 'Rata-rata nilai'], benda: 'nilai', orang: 'peserta' },
    { judul: 'Skor Kepuasan Nasabah per Kantor', awalan: 'Kantor ', kolom: ['Jumlah responden', 'Rata-rata skor'], benda: 'skor', orang: 'responden' },
    { judul: 'Nilai Pelatihan Pegawai per Kelas', awalan: 'Kelas ', kolom: ['Jumlah pegawai', 'Rata-rata nilai'], benda: 'nilai', orang: 'pegawai' }
  ];

  /**
   * Rata-rata gabungan (tertimbang) beberapa baris tabel. Mudah: dua baris. Sedang: tiga
   * baris dari empat. Sulit: baris "Gabungan" berisi jumlah dan rata-rata seluruhnya, satu
   * rata-rata baris hilang ("?") dan harus dicari.
   */
  function rataGabunganTabel(a, level) {
    var ti = a.bulat(0, TEMA_GABUNG.length - 1), tm = TEMA_GABUNG[ti];
    var label = ['A', 'B', 'C', 'D'].map(function (h, i) { return tm.awalan + (tm.awalan === 'Angkatan ' ? String(i + 1) : h); });
    for (var coba = 0; coba < 3000; coba++) {
      var n = [], x = [];
      for (var i = 0; i < 4; i++) { n.push(a.bulat(12, 45)); x.push(a.bulat(58, 92)); }
      if (new Set(n).size < 4 || new Set(x).size < 4) continue;
      var N = jumlah(n), J = jumlah(n.map(function (v, k) { return v * x[k]; }));
      var fm = function (v) { return Fmt.angka(v, { desimal: 2 }); }, pilih, kunci, tanya, langkah, pembahasan, pengecoh, baris;
      var model, sulit = level === 'sulit';
      if (!sulit) {
        var banyak = level === 'mudah' ? 2 : 3;
        pilih = a.ambil([0, 1, 2, 3], banyak).sort();
        var nS = jumlah(pilih.map(function (k) { return n[k]; })), jS = jumlah(pilih.map(function (k) { return n[k] * x[k]; }));
        kunci = jS / nS;
        var namaS = Fmt.daftarKata(pilih.map(function (k) { return label[k]; }));
        tanya = 'Berapa rata-rata ' + tm.benda + ' gabungan seluruh ' + tm.orang + ' ' + namaS + '? Bulatkan sampai dua angka di belakang koma.';
        baris = label.map(function (l, k) { return { label: l, sel: [String(n[k]), String(x[k])] }; });
        model = { judul: tm.judul, kolom: [''].concat(tm.kolom), baris: baris };
        langkah = [
          { nama: 'jumlahNilai', rumus: pilih.map(function (k) { return t(k, 1) + '*' + t(k, 2); }).join('+') },
          { nama: 'jumlahOrang', rumus: pilih.map(function (k) { return t(k, 1); }).join('+') },
          { nama: 'jawab', rumus: 'jumlahNilai/jumlahOrang' }
        ];
        var kaliE = pilih.map(function (k) { return n[k] + ' \\times ' + x[k]; }).join(' + '), hasilE = pilih.map(function (k) { return E(n[k] * x[k]); }).join(' + ');
        pembahasan = bahas(pilih.map(function (k) { return 'Baris ' + label[k] + ': ' + tm.kolom[0].toLowerCase() + ' ' + n[k] + ', ' + tm.kolom[1].toLowerCase() + ' ' + x[k] + '.'; }),
          'Rata-rata ' + tm.benda + ' gabungan seluruh ' + tm.orang + ' ' + namaS + ', dibulatkan sampai dua angka di belakang koma.', [
            'Rata-rata gabungan = jumlah ' + tm.benda + ' seluruh ' + tm.orang + ' ÷ banyak seluruh ' + tm.orang + '. Rata-rata tiap baris tidak boleh dirata-ratakan begitu saja karena banyak ' + tm.orang + 'nya berbeda.',
            'Jumlah ' + tm.benda + ' satu baris = banyak ' + tm.orang + ' × rata-ratanya:',
            R(T('jumlah ' + tm.benda) + ' = ' + kaliE + ' = ' + hasilE + ' = ' + E(jS)),
            R(T('jumlah ' + tm.orang) + ' = ' + pilih.map(function (k) { return n[k]; }).join(' + ') + ' = ' + nS),
            R(T('rata-rata gabungan') + ' = \\frac{' + E(jS) + '}{' + nS + '} ' + samaE(kunci))
          ], 'Jadi, rata-rata ' + tm.benda + ' gabungan ' + tm.orang + ' ' + namaS + ' ' + (Math.abs(kunci * 100 - Math.round(kunci * 100)) < 1e-7 ? 'adalah ' : 'kira-kira ') + fm(kunci) + '.');
        pengecoh = [
          jalur(jumlah(pilih.map(function (k) { return x[k]; })) / banyak, 'merata-ratakan rata-rata tiap baris tanpa bobot banyak ' + tm.orang,
            '(' + pilih.map(function (k) { return x[k]; }).join(' + ') + ') ÷ ' + banyak, fm),
          jalur(J / N, 'ikut menyertakan semua baris', '(' + n.map(function (v, k) { return v + ' × ' + x[k]; }).join(' + ') + ') ÷ ' + N, fm),
          jalur(jS / N, 'membagi dengan jumlah ' + tm.orang + ' semua baris', Fmt.angka(jS) + ' ÷ ' + N, fm)
        ];
        var besar = pilih.slice().sort(function (p1, p2) { return n[p2] - n[p1]; })[0];
        pengecoh.push(jalur(x[besar], 'hanya memakai baris dengan ' + tm.orang + ' terbanyak (' + label[besar] + ')', 'rata-rata ' + label[besar], fm));
        if (banyak === 2) {
          var p0 = pilih[0], p1 = pilih[1];
          pengecoh.splice(1, 0, jalur((n[p1] * x[p0] + n[p0] * x[p1]) / nS, 'menukar bobot kedua baris', '(' + n[p1] + ' × ' + x[p0] + ' + ' + n[p0] + ' × ' + x[p1] + ') ÷ ' + nS, fm));
        } else {
          var kecil = pilih.slice().sort(function (p1, p2) { return n[p1] - n[p2]; })[0];
          pengecoh.push(jalur(x[kecil], 'hanya memakai baris dengan ' + tm.orang + ' paling sedikit (' + label[kecil] + ')', 'rata-rata ' + label[kecil], fm));
          var lain = pilih.filter(function (k) { return k !== besar; });
          var tanpa = (jS - n[besar] * x[besar] + x[besar]) / (nS - n[besar] + 1);
          pengecoh.push(jalur(tanpa, 'lupa mengalikan rata-rata ' + label[besar] + ' dengan banyak ' + tm.orang + 'nya',
            '(' + lain.map(function (k) { return n[k] + ' × ' + x[k]; }).join(' + ') + ' + ' + x[besar] + ') ÷ (' + lain.map(function (k) { return n[k]; }).join(' + ') + ' + 1)', fm));
        }
      } else {
        // baris gabungan: rata-rata seluruhnya harus tercetak tepat dengan dua desimal
        if (Math.abs(J / N * 100 - Math.round(J / N * 100)) > 1e-9) continue;
        var h = a.bulat(0, 3), G = J / N, GT = fm(G), lainH = [0, 1, 2, 3].filter(function (k) { return k !== h; });
        var jLain = jumlah(lainH.map(function (k) { return n[k] * x[k]; })), nLain = N - n[h];
        kunci = x[h];
        baris = label.map(function (l, k) { return { label: l, sel: [String(n[k]), k === h ? '?' : String(x[k])] }; });
        baris.push({ label: 'Gabungan', sel: [String(N), GT] });
        model = { judul: tm.judul, kolom: [''].concat(tm.kolom), baris: baris };
        tanya = 'Rata-rata ' + tm.benda + ' ' + label[h] + ' tidak tercatat. Berapa rata-rata ' + tm.benda + ' ' + label[h] + '?';
        langkah = [
          { nama: 'lain', rumus: lainH.map(function (k) { return t(k, 1) + '*' + t(k, 2); }).join('+') },
          { nama: 'jawab', rumus: '(' + t(4, 1) + '*' + t(4, 2) + '-lain)/' + t(h, 1) }
        ];
        pembahasan = bahas(lainH.map(function (k) { return 'Baris ' + label[k] + ': ' + tm.kolom[0].toLowerCase() + ' ' + n[k] + ', ' + tm.kolom[1].toLowerCase() + ' ' + x[k] + '.'; })
          .concat(['Baris ' + label[h] + ': ' + tm.kolom[0].toLowerCase() + ' ' + n[h] + ', rata-ratanya tidak tercatat.', 'Baris Gabungan: ' + tm.kolom[0].toLowerCase() + ' ' + N + ', ' + tm.kolom[1].toLowerCase() + ' ' + GT + '.']),
          'Rata-rata ' + tm.benda + ' ' + label[h] + '.', [
            'Jumlah ' + tm.benda + ' = banyak ' + tm.orang + ' × rata-rata. Jumlah ' + tm.benda + ' seluruh ' + tm.orang + ' diperoleh dari baris Gabungan:',
            R(T('jumlah seluruh') + ' = ' + E(G) + ' \\times ' + N + ' = ' + E(J)),
            'Jumlah ' + tm.benda + ' baris yang rata-ratanya diketahui:',
            R(T('jumlah baris lain') + ' = ' + lainH.map(function (k) { return n[k] + ' \\times ' + x[k]; }).join(' + ') + ' = ' + E(jLain)),
            'Sisanya adalah jumlah ' + tm.benda + ' ' + label[h] + ', lalu dibagi banyak ' + tm.orang + 'nya:',
            R(T('rata-rata ' + label[h]) + ' = \\frac{' + E(J) + ' - ' + E(jLain) + '}{' + n[h] + '} = \\frac{' + E(J - jLain) + '}{' + n[h] + '} ' + samaE(kunci))
          ], 'Jadi, rata-rata ' + tm.benda + ' ' + label[h] + ' adalah ' + fm(kunci) + '.');
        var rataLain = jumlah(lainH.map(function (k) { return x[k]; })) / 3;
        pengecoh = [
          jalur(4 * G - jumlah(lainH.map(function (k) { return x[k]; })), 'menganggap semua baris sama besar (rata-rata gabungan = rata-rata biasa keempat baris)',
            '4 × ' + GT + ' - (' + lainH.map(function (k) { return x[k]; }).join(' + ') + ')', fm),
          jalur((J - jLain) / N, 'membagi dengan jumlah ' + tm.orang + ' seluruhnya, bukan dengan ' + tm.orang + ' ' + label[h], '(' + Fmt.angka(J) + ' - ' + Fmt.angka(jLain) + ') ÷ ' + N, fm),
          jalur((J - jLain) / nLain, 'membagi dengan jumlah ' + tm.orang + ' baris lain', '(' + Fmt.angka(J) + ' - ' + Fmt.angka(jLain) + ') ÷ ' + nLain, fm),
          jalur((J - nLain * rataLain) / n[h], 'memakai rata-rata biasa baris lain (' + A(rataLain, 2) + ') untuk seluruh ' + tm.orang + ' baris lain',
            '(' + Fmt.angka(J) + ' - ' + nLain + ' × ' + A(rataLain, 2) + ') ÷ ' + n[h], fm),
          jalur(G, 'menjawab rata-rata gabungan', 'rata-rata baris Gabungan', fm),
          jalur(jLain / nLain, 'menjawab rata-rata gabungan baris lain, bukan rata-rata ' + label[h], Fmt.angka(jLain) + ' ÷ ' + nLain, fm),
          jalur(rataLain, 'menjawab rata-rata biasa baris lain', '(' + lainH.map(function (k) { return x[k]; }).join(' + ') + ') ÷ 3', fm)
        ];
      }
      return riset({
        jenisSoal: 'Tabel - Rata-rata',
        judul: 'Tabel · ' + tm.judul, gambar: gambarTabel(model), teks: [], pertanyaan: tanya,
        kunci: kunci, fmt: fm, pengecoh: pengecoh, min: 40, maks: 100,
        langkah: langkah, pembahasan: pembahasan,
        model: { param: {}, tampil: {}, toleransi: 0.00501, topik: 'Rata-rata', konteks: tm.awalan === 'Angkatan ' ? ['1', '2', '3', '4'] : [] },
        sidik: { inti: 'tabel-rata-gabungan|' + ti + '|' + level + '|' + n.join(',') + '|' + x.join(',') + '|' + (pilih ? pilih.join(',') : h), param: n.concat(x), entitas: String(ti) }
      }, 'pengayaan', 'Tambahan tim untuk cakupan rata-rata gabungan (tertimbang) beberapa baris tabel dan rata-rata yang hilang.', 'rata-tertimbang');
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
    { id: 'harga-satuan', nama: 'Harga per sentimeter kubik dan per liter', topik: 'Pengukuran dan Konversi Satuan', fn: hargaSatuan },
    { id: 'perubahan-persen', nama: 'Persentase perubahan', topik: 'Persentase dan Pertumbuhan', fn: perubahanPersen },
    { id: 'tabel-tumbuh-majemuk', nama: 'Nilai setelah pertumbuhan majemuk beberapa tahun', topik: 'Persentase dan Pertumbuhan', fn: tumbuhMajemuk },
    { id: 'tabel-rata-gabungan', nama: 'Rata-rata gabungan beberapa baris', topik: 'Rata-rata', fn: rataGabunganTabel }
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
    var butir = Butir.rakitPg(ctx, spec);
    if (butir) butir.model.topik = (butir.model.topik || kel.topik);
    return butir;
  }

  return { KELUARGA: KELUARGA, buat: buat, nilaiKeRasio: nilaiKeRasio };
});
