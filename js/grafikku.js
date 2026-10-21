/*
 * grafikku.js — soal grafik batang Kemampuan Umum > Numerik.
 *
 * Grafiknya digambar sebagai SVG/PNG. Tiap batang membawa `data-v` (nilai yang
 * dimaksud) dan tiap garis bantu `data-grid`; validator mengukur tinggi batang
 * dari koordinat yang BENAR-BENAR tergambar, mengubahnya menjadi nilai lewat
 * dua garis bantu, lalu memakai nilai itu untuk menghitung ulang jawabannya.
 *
 *   tanpa-cacat     Persentase dan Perbandingan   tim mana yang menghasilkan paling banyak yang baik
 *   persen-gabungan Persentase dan Perbandingan   persen sumbangan beberapa batang
 *   naik-total      Persentase dan Perbandingan   kenaikan total dua seri (batang berkelompok)
 *   rasio-batang    Bilangan dan Perbandingan     perbandingan dua batang
 *
 * Setiap pengecoh berasal dari jalur kesalahan yang dapat diulang (termasuk salah
 * membaca batang) dan alasannya menuliskan hitungan jalur itu. Nominal uang ditulis
 * penuh dalam dolar, tanpa "juta" atau "ribu".
 *
 * Pembahasan: Diketahui (nilai batang yang dipakai beserta kategori dan serinya),
 * Ditanyakan, Pengerjaan (rumus umum lalu substitusi, satu langkah per baris
 * persamaan "§ ..."), dan Kesimpulan; validator memeriksa setiap relasi.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./rng.js'), require('./format.js'), require('./kamus.js'), require('./butir.js'), require('./tabelku.js'), require('./rumus.js'));
    module.exports = api;
  } else {
    api = factory(root.Rng, root.Fmt, root.Kamus, root.Butir, root.TabelKu, root.Rumus);
    root.GrafikKu = api;
  }
})(typeof self !== 'undefined' ? self : this, function (Rng, Fmt, Kamus, Butir, TabelKu, Rumus) {
  'use strict';

  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a; }
  function jumlah(xs) { return xs.reduce(function (s, x) { return s + x; }, 0); }
  function A(v, d) { return Fmt.angka(v, { desimal: d == null ? 2 : d }); }

  // ------------------------------------------------------------- pembahasan

  /** Baris persamaan (notasi LaTeX sederhana, lihat rumus.js). */
  function R(notasi) { return Rumus.baris(notasi); }
  /** Angka pada baris persamaan: titik ribuan, koma desimal "{,}". */
  function E(v, d, tetap) { return Fmt.angka(v, { desimal: d == null ? 2 : d, tetap: !!tetap }).replace(',', '{,}'); }
  /** Kata atau satuan tegak pada baris persamaan. */
  function T(s) { return '\\text{' + s + '}'; }
  /** Pembahasan soal hitungan; `{HURUF}` diisi huruf kunci oleh Butir. */
  function bahas(diketahui, ditanyakan, pengerjaan, kesimpulan) {
    return ['Diketahui'].concat(diketahui, ['Ditanyakan', ditanyakan, 'Pengerjaan'], pengerjaan, ['Kesimpulan', kesimpulan + ' Jawaban: {HURUF}.']);
  }

  function gambarBar(model) { return [{ id: 'grafik', jenis: 'bar', model: model, judul: model.judul }]; }

  /** Pengecoh dari jalur kesalahan: nama kesalahan, hitungannya, dan pilihan yang dihasilkan. */
  function jalur(nilai, salahnya, hitungan, fmt) {
    var t = isFinite(nilai) ? fmt(nilai) : null;
    return { nilai: nilai, alasan: t == null ? null : salahnya + ': ' + hitungan + ' = ' + t };
  }

  /** Jalur kesalahan yang hasilnya dibulatkan seperti kunci: "... = 16,2% ≈ 16%". */
  function jalurKira(asli, salahnya, hitungan, fmt) {
    if (!isFinite(asli)) return { nilai: NaN, alasan: null };
    var bulat = Math.round(asli), t = fmt(bulat), tepat = A(asli, 1) + '%';
    return { nilai: bulat, alasan: t == null ? null : salahnya + ': ' + hitungan + ' = ' + (tepat === t ? t : tepat + ' ≈ ' + t) };
  }

  /** "p:q" sederhana, atau null bila tidak ada perbandingan bulat yang wajar. */
  function rasioAtauNull(v) {
    for (var d = 1; d <= 60; d++) {
      var n = Math.round(v * d);
      if (Math.abs(v * d - n) < 1e-9 && n > 0 && n <= 60) { var g = gcd(n, d); return (n / g) + ':' + (d / g); }
    }
    return null;
  }

  function riset(spec, kategori, catatan, pola) {
    spec.kategoriRiset = kategori; spec.catatanRiset = catatan;
    if (pola) spec.pola = pola;
    return spec;
  }

  /** Angka pada nama seri/kategori yang ikut disebut di pertanyaan (mis. "2023", "Semester 1") adalah konteks, bukan data. */
  function angkaLabel() {
    var hasil = [];
    Array.prototype.slice.call(arguments).forEach(function (s) { (String(s).match(/\d+/g) || []).forEach(function (x) { hasil.push(x); }); });
    return hasil;
  }

  var TEMA_TANPA = [
    { judul: 'Jumlah motor yang diproduksi menurut tim produksi', sumbuY: 'Jumlah motor', sumbuX: 'Tim produksi', kat: 'Tim', objek: 'motor', cacat: 'cacat', baik: 'motor tanpa cacat', awalan: 'Tim' },
    { judul: 'Jumlah rekening kredit yang disalurkan menurut kantor cabang', sumbuY: 'Rekening kredit', sumbuX: 'Kantor cabang', kat: 'Cabang', objek: 'rekening kredit', cacat: 'kredit macet', baik: 'kredit lancar', awalan: 'Cabang' },
    { judul: 'Hasil panen menurut kebun (ton)', sumbuY: 'Hasil panen (ton)', sumbuX: 'Kebun', kat: 'Kebun', objek: 'hasil panen', cacat: 'busuk', baik: 'hasil panen yang baik', awalan: 'Kebun' }
  ];

  /**
   * Seperti contoh riset Soal 16: pilihannya kelima tim. Tim yang dipilih oleh suatu jalur
   * kesalahan (jumlah terbanyak saja, persen cacat terkecil saja, jumlah cacat paling sedikit,
   * tertukar menghitung yang cacat, atau mengurangkan angka persen langsung) diberi alasan
   * jalur itu; tim lain dibandingkan hasil baiknya dengan tim kunci.
   */
  function tanpaCacat(a, level, opsi) {
    var ti = a.bulat(0, TEMA_TANPA.length - 1), tm = TEMA_TANPA[ti];
    var huruf = ['A', 'B', 'C', 'D', 'E'];
    for (var coba = 0; coba < 6000; coba++) {
      var langkah = tm.objek === 'motor' ? a.pilih([500, 1000]) : a.pilih([50, 100, 200]);
      var satuNilai = langkah / (level === 'sulit' ? 2 : 1);
      var v = [], d = [];
      for (var i = 0; i < 5; i++) {
        v.push(a.bulat(Math.ceil(langkah * 2 / satuNilai), Math.floor(langkah * 5 / satuNilai)) * satuNilai);
        d.push(a.pilih([4, 5, 6, 8, 9, 10, 12, 13, 15, 18, 20, 25]));
      }
      var tg = opsi && opsi.target != null ? opsi.target : null;
      var baik = v.map(function (x, i) { return x * (100 - d[i]) / 100; });
      var urut = baik.slice().sort(function (x, y) { return y - x; });
      if ((urut[0] - urut[1]) / urut[0] < 0.02) continue;
      var menang = baik.indexOf(urut[0]);
      if (tg !== null && tg !== menang) {
        var tv = v[tg], td = d[tg]; v[tg] = v[menang]; d[tg] = d[menang]; v[menang] = tv; d[menang] = td;
        baik = v.map(function (x, i) { return x * (100 - d[i]) / 100; });
        menang = tg;
      }
      var terbesar = v.indexOf(Math.max.apply(null, v));
      if (v.filter(function (x) { return x === v[terbesar]; }).length > 1) continue;
      if (level !== 'mudah' && menang === terbesar) continue;
      var nama = huruf.map(function (h) { return tm.kat + ' ' + h; });
      var cacatN = v.map(function (x, i) { return x * d[i] / 100; });
      var F = function (x) { return A(x, 1); };
      var unik = function (arr, cari) {
        var t = cari === 'maks' ? Math.max.apply(null, arr) : Math.min.apply(null, arr);
        return arr.filter(function (x) { return Math.abs(x - t) < 1e-9; }).length === 1 ? arr.indexOf(t) : -1;
      };
      var banding = function (i) { return 'hasil baiknya hanya ' + Fmt.angka(v[i]) + ' × ' + (100 - d[i]) + '% = ' + F(baik[i]) + ' < ' + F(baik[menang]) + ' (' + nama[menang] + ')'; };
      var jlr = [
        { i: unik(v, 'maks'), alasan: function (i) { return nama[i] + ' dipilih karena jumlah ' + tm.objek + 'nya terbanyak (' + Fmt.angka(v[i]) + ') tanpa memperhitungkan ' + tm.cacat + ' ' + d[i] + '%; ' + banding(i); } },
        { i: unik(d, 'min'), alasan: function (i) { return nama[i] + ' dipilih karena persentase ' + tm.cacat + 'nya paling kecil (' + d[i] + '%) tanpa memperhitungkan jumlahnya; ' + banding(i); } },
        { i: unik(cacatN, 'min'), alasan: function (i) { return nama[i] + ' dipilih karena jumlah yang ' + tm.cacat + ' paling sedikit (' + Fmt.angka(v[i]) + ' × ' + d[i] + '% = ' + F(cacatN[i]) + '), padahal yang ditanya jumlah yang baik; ' + banding(i); } },
        { i: unik(cacatN, 'maks'), alasan: function (i) { return nama[i] + ' dipilih karena tertukar menghitung jumlah yang ' + tm.cacat + ' (' + Fmt.angka(v[i]) + ' × ' + d[i] + '% = ' + F(cacatN[i]) + ', terbanyak); ' + banding(i); } },
        { i: unik(v.map(function (x, k) { return x - d[k]; }), 'maks'), alasan: function (i) { return nama[i] + ' dipilih karena angka persen dikurangkan langsung dari jumlah (' + Fmt.angka(v[i]) + ' - ' + d[i] + ' = ' + Fmt.angka(v[i] - d[i]) + ', terbanyak); ' + banding(i); } }
      ];
      var alasan = {};
      jlr.forEach(function (x) { if (x.i >= 0 && x.i !== menang && !alasan[x.i]) alasan[x.i] = x.alasan(x.i); });
      // tim yang tidak terjangkau jalur kesalahan mana pun cukup dibandingkan hasil baiknya
      nama.forEach(function (n, i) { if (i !== menang && !alasan[i]) alasan[i] = n + ' hanya menghasilkan ' + Fmt.angka(v[i]) + ' × ' + (100 - d[i]) + '% = ' + F(baik[i]) + ' ' + tm.baik + ', lebih sedikit daripada ' + F(baik[menang]) + ' (' + nama[menang] + ')'; });
      var maks = Math.max.apply(null, v), sumbuMaks = (Math.floor(maks / langkah) + 1) * langkah;
      var model = { judul: tm.judul, kategori: nama, seri: [{ nama: tm.objek, nilai: v }], sumbuMaks: sumbuMaks, langkah: langkah, judulY: tm.sumbuY, judulX: tm.sumbuX, labelNilai: level !== 'sulit' };
      var teksPersen = nama.map(function (n, i) { return d[i] + '% ' + tm.objek + ' dari ' + n; });
      var teks = 'Sebanyak ' + teksPersen.slice(0, 4).join(', ') + ' dan ' + teksPersen[4] + ' tergolong ' + tm.cacat + '.';
      var tanya = nama[0].split(' ')[0] + ' mana yang menghasilkan ' + tm.baik + ' paling banyak?';
      var urutBaik = nama.map(function (n, i) { return i; }).sort(function (x, y) { return baik[y] - baik[x]; });
      var pembahasan = bahas([
        'Jumlah ' + tm.objek + ' dari grafik (batang tiap ' + tm.kat.toLowerCase() + '): ' + nama.map(function (n, i) { return n + ' ' + Fmt.angka(v[i]); }).join('; ') + '.',
        'Persentase ' + tm.cacat + ' (dari soal): ' + nama.map(function (n, i) { return n + ' ' + d[i] + '%'; }).join('; ') + '.'
      ], Kamus.kap(tm.kat) + ' yang menghasilkan ' + tm.baik + ' paling banyak.', [
        'Yang dibandingkan adalah jumlah yang baik, bukan jumlah seluruhnya. Bagian yang baik = 100% - persen ' + tm.cacat + ', jadi:',
        R(T(tm.baik) + ' = ' + T('jumlah') + ' \\times (100\\% - ' + T('persen ' + tm.cacat) + ')')
      ].concat(nama.map(function (n, i) { return R(T(n) + ' = ' + E(v[i]) + ' \\times (100\\% - ' + d[i] + '\\%) = ' + E(v[i]) + ' \\times ' + (100 - d[i]) + '\\% = ' + E(baik[i])); }))
        .concat(['Urutkan hasilnya dari yang terbesar:', R(urutBaik.map(function (i, k) {
          return (k ? (baik[urutBaik[k - 1]] - baik[i] > 1e-9 ? ' > ' : ' = ') : '') + E(baik[i]);
        }).join(''))])
        .concat(menang !== terbesar ? [nama[terbesar] + ' memproduksi paling banyak, tetapi ' + d[terbesar] + '% ' + tm.cacat + ' membuat hasil baiknya bukan yang terbanyak.'] : []),
      'Jadi, yang menghasilkan ' + tm.baik + ' paling banyak adalah ' + nama[menang] + ' (' + F(baik[menang]) + ').');
      var pil = {
        opsi: nama.map(function (n, i) { return { teks: n, nilai: i, alasan: alasan[i] || null, kunci: i === menang }; }),
        kunciIndex: menang
      };
      var param = {}, tampil = {};
      d.forEach(function (x, i) { param['d' + i] = String(x); tampil['d' + i] = x + '%'; });
      return riset({
        jenisSoal: 'Grafik Batang - Persentase dan Perbandingan',
        judul: 'Grafik Batang · ' + tm.judul, gambar: gambarBar(model), teks: [teks], pertanyaan: tanya,
        pilihanJadi: pil,
        langkah: [
          { nama: 'g0', rumus: 'x0_0*(100-d0)/100' }, { nama: 'g1', rumus: 'x0_1*(100-d1)/100' }, { nama: 'g2', rumus: 'x0_2*(100-d2)/100' },
          { nama: 'g3', rumus: 'x0_3*(100-d3)/100' }, { nama: 'g4', rumus: 'x0_4*(100-d4)/100' }
        ],
        pembahasan: pembahasan,
        model: { param: param, tampil: tampil, toleransi: 0, jenisHitung: 'argmaks', daftarLangkah: ['g0', 'g1', 'g2', 'g3', 'g4'], topik: 'Persentase dan Perbandingan', batangSeri: 0 },
        sidik: { inti: 'tanpa-cacat|' + ti + '|' + v.join(',') + '|' + d.join(','), param: v.concat(d), entitas: String(ti) }
      }, 'acuan', 'Mengikuti contoh Numerik Soal 16; tim pengecoh dijelaskan dengan jalur kesalahan yang memilihnya atau dengan hitungan hasil baiknya.');
    }
    return null;
  }

  var TEMA_KELOMPOK = [
    { judul: 'Unit Terjual per Kuartal', kat: ['Kuartal 1', 'Kuartal 2', 'Kuartal 3', 'Kuartal 4'], seri: ['2023', '2024'], awalan: '', akhiran: '', sumbuY: 'Unit terjual' },
    { judul: 'Jumlah Nasabah Baru per Cabang', kat: ['Cabang Utara', 'Cabang Selatan', 'Cabang Barat', 'Cabang Timur'], seri: ['Semester 1', 'Semester 2'], awalan: '', akhiran: '', sumbuY: 'Nasabah baru' },
    { judul: 'Produksi Pabrik per Tahun (ton)', kat: ['Pabrik P', 'Pabrik Q', 'Pabrik R', 'Pabrik S'], seri: ['Tahun lalu', 'Tahun ini'], awalan: '', akhiran: '', sumbuY: 'Produksi (ton)' }
  ];

  function naikTotal(a, level) {
    var ti = a.bulat(0, TEMA_KELOMPOK.length - 1), tm = TEMA_KELOMPOK[ti];
    for (var coba = 0; coba < 3000; coba++) {
      var langkah = a.pilih([50, 100]), satu = langkah / (level === 'sulit' ? 2 : 1);
      var v0 = [], v1 = [];
      for (var i = 0; i < 4; i++) {
        v0.push(a.bulat(Math.ceil(langkah * 1 / satu), Math.floor(langkah * 4 / satu)) * satu);
        v1.push(a.bulat(Math.ceil(langkah * 1 / satu), Math.floor(langkah * 4 / satu)) * satu);
      }
      var s0 = jumlah(v0), s1 = jumlah(v1);
      var pers = (s1 - s0) / s0 * 100;
      if (Math.abs(pers - Math.round(pers)) > 1e-9 || Math.abs(pers) < 5) continue;
      var bentuk = level === 'mudah' ? 'total' : a.pilih(['total', 'satu']);
      var ii = a.bulat(0, 3), kunci, tanya;
      if (bentuk === 'total') { kunci = pers; tanya = 'Berapa persentase perubahan jumlah total keempat kategori dari ' + tm.seri[0] + ' ke ' + tm.seri[1] + '?'; }
      else {
        kunci = (v1[ii] - v0[ii]) / v0[ii] * 100;
        if (Math.abs(kunci - Math.round(kunci)) > 1e-9 || Math.abs(kunci) < 5) continue;
        tanya = 'Berapa persentase perubahan ' + tm.kat[ii] + ' dari ' + tm.seri[0] + ' ke ' + tm.seri[1] + '?';
      }
      var maks = Math.max.apply(null, v0.concat(v1)), sumbuMaks = (Math.floor(maks / langkah) + 1) * langkah;
      var model = { judul: tm.judul, kategori: tm.kat, seri: [{ nama: tm.seri[0], nilai: v0 }, { nama: tm.seri[1], nilai: v1 }], sumbuMaks: sumbuMaks, langkah: langkah, awalan: tm.awalan, akhiran: tm.akhiran, judulY: tm.sumbuY, labelNilai: level !== 'sulit' };
      var fm = function (v) { return Fmt.angka(v, { desimal: 1 }) + '%'; }, F = Fmt.angka, pengecoh;
      if (bentuk === 'total') {
        var S0 = F(s0), S1 = F(s1);
        pengecoh = [
          jalur((s1 - s0) / s1 * 100, 'menghitung perubahan terhadap jumlah akhir, bukan jumlah awal', '(' + S1 + ' - ' + S0 + ') ÷ ' + S1 + ' × 100%', fm),
          jalur(jumlah(v0.map(function (x, k) { return (v1[k] - x) / x * 100; })) / 4, 'merata-ratakan persentase tiap kategori tanpa memperhitungkan besar masing-masing',
            '(' + v0.map(function (x, k) { return A((v1[k] - x) / x * 100, 1) + '%'; }).join(' + ') + ') ÷ 4', fm),
          jalur(s1 / s0 * 100, 'menjawab jumlah akhir sebagai persen dari jumlah awal', S1 + ' ÷ ' + S0 + ' × 100%', fm),
          jalur((s0 - s1) / s0 * 100, 'mengurangkan jumlah akhir dari jumlah awal sehingga arah perubahannya terbalik', '(' + S0 + ' - ' + S1 + ') ÷ ' + S0 + ' × 100%', fm),
          jalur((s1 - s0) / s0, 'lupa mengalikan dengan 100%', '(' + S1 + ' - ' + S0 + ') ÷ ' + S0, fm),
          jalur((v1[0] - v0[0]) / v0[0] * 100, 'hanya membaca kategori pertama (' + tm.kat[0] + ')', '(' + F(v1[0]) + ' - ' + F(v0[0]) + ') ÷ ' + F(v0[0]) + ' × 100%', fm),
          jalur(s1 - s0, 'menulis selisih jumlah total sebagai persentase', S1 + ' - ' + S0, fm)
        ];
      } else {
        var x0 = F(v0[ii]), x1 = F(v1[ii]), jj = (ii + 1) % 4;
        pengecoh = [
          jalur((v1[ii] - v0[ii]) / v1[ii] * 100, 'menghitung perubahan terhadap nilai akhir, bukan nilai awal', '(' + x1 + ' - ' + x0 + ') ÷ ' + x1 + ' × 100%', fm),
          jalur(v1[ii] / v0[ii] * 100, 'menjawab nilai akhir sebagai persen dari nilai awal', x1 + ' ÷ ' + x0 + ' × 100%', fm),
          jalur((v0[ii] - v1[ii]) / v0[ii] * 100, 'mengurangkan nilai akhir dari nilai awal sehingga arah perubahannya terbalik', '(' + x0 + ' - ' + x1 + ') ÷ ' + x0 + ' × 100%', fm),
          jalur(pers, 'memakai perubahan total keempat kategori, bukan satu kategori', '(' + F(s1) + ' - ' + F(s0) + ') ÷ ' + F(s0) + ' × 100%', fm),
          jalur((v1[ii] - v0[ii]) / v0[ii], 'lupa mengalikan dengan 100%', '(' + x1 + ' - ' + x0 + ') ÷ ' + x0, fm),
          jalur((v1[jj] - v0[jj]) / v0[jj] * 100, 'membaca batang ' + tm.kat[jj] + ', bukan ' + tm.kat[ii], '(' + F(v1[jj]) + ' - ' + F(v0[jj]) + ') ÷ ' + F(v0[jj]) + ' × 100%', fm),
          jalur(v1[ii] - v0[ii], 'menulis selisih angka sebagai persentase', x1 + ' - ' + x0, fm)
        ];
      }
      // perubahan sebagai pecahan terhadap nilai awal; tanda negatif berarti turun (catatan QC no. 23)
      var awalV = bentuk === 'total' ? s0 : v0[ii], akhirV = bentuk === 'total' ? s1 : v1[ii];
      var apa = bentuk === 'total' ? 'jumlah total keempat kategori' : tm.kat[ii], olah = [];
      if (bentuk === 'total') {
        olah.push('Jumlahkan batang tiap seri untuk keempat kategori:',
          R(T('total ' + tm.seri[0]) + ' = ' + v0.map(function (x) { return E(x); }).join(' + ') + ' = ' + E(s0)),
          R(T('total ' + tm.seri[1]) + ' = ' + v1.map(function (x) { return E(x); }).join(' + ') + ' = ' + E(s1)));
      }
      olah.push('Persentase perubahan dihitung terhadap nilai awal (' + tm.seri[0] + '):',
        R(T('perubahan') + ' = \\frac{' + T('nilai akhir') + ' - ' + T('nilai awal') + '}{' + T('nilai awal') + '} \\times 100\\%'),
        R(T('perubahan') + ' = \\frac{' + E(akhirV) + ' - ' + E(awalV) + '}{' + E(awalV) + '} \\times 100\\% = \\frac{' + E(akhirV - awalV) + '}{' + E(awalV) + '} \\times 100\\% = ' + E(kunci, 1) + '\\%'),
        'Tanda ' + (kunci < 0 ? 'negatif berarti ' + apa + ' turun ' : 'positif berarti ' + apa + ' naik ') + F(Math.abs(kunci)) + '%.');
      var pembahasan = bahas(bentuk === 'total'
        ? ['Seri ' + tm.seri[0] + ': ' + tm.kat.map(function (k, i) { return k + ' ' + F(v0[i]); }).join(', ') + '.', 'Seri ' + tm.seri[1] + ': ' + tm.kat.map(function (k, i) { return k + ' ' + F(v1[i]); }).join(', ') + '.']
        : ['Batang ' + tm.kat[ii] + ': seri ' + tm.seri[0] + ' ' + F(v0[ii]) + ', seri ' + tm.seri[1] + ' ' + F(v1[ii]) + '.'],
      'Persentase perubahan ' + apa + ' dari ' + tm.seri[0] + ' ke ' + tm.seri[1] + '.', olah,
      'Jadi, persentase perubahannya ' + F(kunci) + '%, artinya ' + apa + ' ' + (kunci < 0 ? 'turun ' : 'naik ') + F(Math.abs(kunci)) + '%.');
      return riset({
        jenisSoal: 'Grafik Batang - Persentase dan Perbandingan',
        judul: 'Grafik Batang · ' + tm.judul, gambar: gambarBar(model), teks: [], pertanyaan: tanya,
        kunci: kunci, fmt: fm,
        pengecoh: pengecoh.map(function (p) { return { nilai: Fmt.bulatkan(p.nilai, 1), alasan: p.alasan }; }), min: -100, maks: 500,
        langkah: bentuk === 'total'
          ? [{ nama: 'a', rumus: 'x0_0+x0_1+x0_2+x0_3' }, { nama: 'b', rumus: 'x1_0+x1_1+x1_2+x1_3' }, { nama: 'jawab', rumus: '(b-a)/a*100' }]
          : [{ nama: 'jawab', rumus: '(x1_' + ii + '-x0_' + ii + ')/x0_' + ii + '*100' }],
        pembahasan: pembahasan,
        model: { param: {}, tampil: {}, toleransi: 0.0501, topik: 'Persentase dan Perbandingan', batangAwalan: tm.awalan, konteks: angkaLabel(tm.seri[0], tm.seri[1], tm.kat[ii]) },
        sidik: { inti: 'naik-total|' + ti + '|' + v0.join(',') + '|' + v1.join(',') + '|' + bentuk + '|' + ii, param: v0.concat(v1, [ii]), entitas: String(ti) }
      }, 'pengayaan', 'Tambahan tim: persentase perubahan dari batang berkelompok.', 'persen-perubahan');
    }
    return null;
  }

  var TEMA_SUMBANG = [
    { judul: 'Pendapatan Premi menurut Jenis Asuransi ($)', kat: ['Jiwa', 'Kesehatan', 'Kendaraan', 'Properti', 'Perjalanan'], objek: 'premi', awalan: '$', akhiran: '', sumbuY: 'Premi ($)', skala: 1000 },
    { judul: 'Jumlah Pelanggan menurut Paket Layanan', kat: ['Basic', 'Standar', 'Premium', 'Bisnis', 'Korporat'], objek: 'pelanggan', awalan: '', akhiran: '', sumbuY: 'Pelanggan', skala: 1 },
    { judul: 'Volume Penjualan menurut Wilayah (unit)', kat: ['Sumatra', 'Jawa', 'Kalimantan', 'Sulawesi', 'Papua'], objek: 'penjualan', awalan: '', akhiran: '', sumbuY: 'Penjualan (unit)', skala: 1 }
  ];

  function persenSumbangan(a, level) {
    var ti = a.bulat(0, TEMA_SUMBANG.length - 1), tm = TEMA_SUMBANG[ti];
    for (var coba = 0; coba < 3000; coba++) {
      var langkah = a.pilih([10, 20, 50]) * tm.skala, satu = langkah / (level === 'sulit' ? 2 : 1);
      var n = 5, v = [];
      for (var i = 0; i < n; i++) v.push(a.bulat(Math.ceil(langkah / satu), Math.floor(langkah * 5 / satu)) * satu);
      var tot = jumlah(v);
      var ia = a.bulat(0, n - 1), ib = (ia + a.bulat(1, n - 1)) % n;
      var bentuk = level === 'mudah' ? 'satu' : 'dua';
      var bag = bentuk === 'satu' ? v[ia] : v[ia] + v[ib];
      var pers = bag / tot * 100;
      if (Math.abs(pers - Math.round(pers)) > 1e-9 || pers < 8 || pers > 80) continue;
      var kunci = Math.round(pers);
      var maks = Math.max.apply(null, v), sumbuMaks = (Math.floor(maks / langkah) + 1) * langkah;
      var model = { judul: tm.judul, kategori: tm.kat, seri: [{ nama: tm.objek, nilai: v }], sumbuMaks: sumbuMaks, langkah: langkah, awalan: tm.awalan, akhiran: tm.akhiran, judulY: tm.sumbuY, labelNilai: level !== 'sulit', desimal: 0 };
      var nm = bentuk === 'satu' ? tm.kat[ia] : tm.kat[ia] + ' dan ' + tm.kat[ib];
      var tanya = 'Berapa persen dari total ' + tm.objek + ' yang disumbang oleh ' + nm + '?';
      var fm = function (v2) { return Fmt.angka(v2, { desimal: 0 }) + '%'; }, F = Fmt.angka, B = F(bag), TOT = F(tot);
      var tetangga = (ia + (bentuk === 'dua' && (ia + 1) % n === ib ? 2 : 1)) % n;
      var pengecoh = [
        jalurKira(bag / (tot - bag) * 100, 'membandingkan bagian itu dengan sisanya, bukan dengan total', B + ' ÷ (' + TOT + ' - ' + B + ') × 100%', fm),
        jalurKira(100 - pers, 'menjawab persentase sisanya, bukan bagian yang ditanyakan', '100% - ' + B + ' ÷ ' + TOT + ' × 100%', fm),
        jalurKira(bag / maks * 100, 'membandingkan dengan batang tertinggi, bukan dengan total', B + ' ÷ ' + F(maks) + ' × 100%', fm),
        jalurKira(bag / (tot / n) * 100, 'membandingkan dengan rata-rata batang, bukan dengan total', B + ' ÷ (' + TOT + ' ÷ ' + n + ') × 100%', fm),
        jalurKira(v[tetangga] / tot * 100, 'membaca batang ' + tm.kat[tetangga] + ', bukan ' + tm.kat[ia], F(v[tetangga]) + ' ÷ ' + TOT + ' × 100%', fm)
      ];
      if (bentuk === 'dua') {
        pengecoh.splice(1, 0, jalurKira(v[ia] / tot * 100, 'hanya menghitung ' + tm.kat[ia], F(v[ia]) + ' ÷ ' + TOT + ' × 100%', fm));
        pengecoh.splice(2, 0, jalurKira(v[ib] / tot * 100, 'hanya menghitung ' + tm.kat[ib], F(v[ib]) + ' ÷ ' + TOT + ' × 100%', fm));
        pengecoh.push(jalurKira((v[ia] / (tot - v[ib]) + v[ib] / (tot - v[ia])) * 100, 'menghitung persentase tiap batang terhadap total yang tidak memuat batang pasangannya, lalu menjumlahkan keduanya',
          F(v[ia]) + ' ÷ ' + F(tot - v[ib]) + ' × 100% + ' + F(v[ib]) + ' ÷ ' + F(tot - v[ia]) + ' × 100%', fm));
      }
      // nilai premi bernominal dolar ditulis dengan $ (tema berawalan "$")
      var NE = function (x) { return (tm.awalan === '$' ? '\\$' : '') + E(x); }, NF = function (x) { return tm.awalan + F(x); };
      var olah = [
        'Total ' + tm.objek + ' = jumlah kelima batang:',
        R(T('total') + ' = ' + v.map(NE).join(' + ') + ' = ' + NE(tot))
      ];
      if (bentuk === 'dua') olah.push('Bagian yang ditanyakan adalah gabungan dua batang:', R(T(tm.kat[ia]) + ' + ' + T(tm.kat[ib]) + ' = ' + NE(v[ia]) + ' + ' + NE(v[ib]) + ' = ' + NE(bag)));
      olah.push('Persentase sumbangan = bagian dibagi total, dikali 100%:',
        R(T('persentase') + ' = \\frac{' + T('bagian') + '}{' + T('total') + '} \\times 100\\%'),
        R(T('persentase') + ' = \\frac{' + NE(bag) + '}{' + NE(tot) + '} \\times 100\\% = ' + kunci + '\\%'));
      var pembahasan = bahas([
        'Nilai tiap batang pada grafik: ' + tm.kat.map(function (k, i) { return k + ' ' + NF(v[i]); }).join('; ') + '.'
      ], 'Persentase total ' + tm.objek + ' yang disumbang oleh ' + nm + '.', olah,
      'Jadi, ' + nm + ' menyumbang ' + kunci + '% dari total ' + tm.objek + '.');
      return riset({
        jenisSoal: 'Grafik Batang - Persentase dan Perbandingan',
        judul: 'Grafik Batang · ' + tm.judul, gambar: gambarBar(model), teks: [], pertanyaan: tanya,
        kunci: kunci, fmt: fm, pengecoh: pengecoh, min: 1, maks: 100, bulat: true,
        langkah: [{ nama: 'jawab', rumus: bentuk === 'satu' ? 'x0_' + ia + '/(x0_0+x0_1+x0_2+x0_3+x0_4)*100' : '(x0_' + ia + '+x0_' + ib + ')/(x0_0+x0_1+x0_2+x0_3+x0_4)*100' }],
        pembahasan: pembahasan,
        model: { param: {}, tampil: {}, toleransi: 0.0001, topik: 'Persentase dan Perbandingan', batangAwalan: tm.awalan },
        sidik: { inti: 'persen-sumbangan|' + ti + '|' + v.join(',') + '|' + bentuk + '|' + ia + '|' + ib, param: v.concat([ia, ib]), entitas: String(ti) }
      }, 'pengayaan', 'Tambahan tim: persentase sumbangan satu atau dua batang terhadap total.');
    }
    return null;
  }

  function rasioBatang(a, level) {
    var ti = a.bulat(0, TEMA_SUMBANG.length - 1), tm = TEMA_SUMBANG[ti];
    for (var coba = 0; coba < 3000; coba++) {
      var langkah = a.pilih([10, 20, 50, 100]) * tm.skala, satu = langkah / 2;
      var v = [];
      for (var i = 0; i < 5; i++) v.push(a.bulat(Math.ceil(langkah / satu), Math.floor(langkah * 5 / satu)) * satu);
      var ia = a.bulat(0, 4), ib = (ia + a.bulat(1, 4)) % 5;
      if (v[ia] === v[ib]) continue;
      var g = gcd(v[ia], v[ib]);
      if (g === Math.min(v[ia], v[ib]) && level !== 'mudah') continue;
      var kunci = v[ia] / v[ib];
      var teksKunci = (v[ia] / g) + ' : ' + (v[ib] / g);
      if ((v[ia] / g) > 15 || (v[ib] / g) > 15) continue;
      var maks = Math.max.apply(null, v), sumbuMaks = (Math.floor(maks / langkah) + 1) * langkah;
      var model = { judul: tm.judul, kategori: tm.kat, seri: [{ nama: tm.objek, nilai: v }], sumbuMaks: sumbuMaks, langkah: langkah, awalan: tm.awalan, akhiran: tm.akhiran, judulY: tm.sumbuY, labelNilai: level !== 'sulit', desimal: 0 };
      var tanya = 'Berapa perbandingan ' + tm.objek + ' ' + tm.kat[ia] + ' terhadap ' + tm.kat[ib] + '?';
      var F = Fmt.angka, X = F(v[ia]), Y = F(v[ib]), kb = (ib + 1) % 5 === ia ? (ib + 2) % 5 : (ib + 1) % 5, ka = (ia + 2) % 5 === ib ? (ia + 3) % 5 : (ia + 2) % 5;
      var pengecoh = [
        jalur(v[ib] / v[ia], 'urutan perbandingan terbalik', Y + ' : ' + X, rasioAtauNull),
        jalur(v[ia] / (v[ia] + v[ib]), 'membandingkan satu batang dengan jumlah kedua batang', X + ' : (' + X + ' + ' + Y + ')', rasioAtauNull),
        jalur((v[ia] + v[ib]) / v[ib], 'membandingkan jumlah kedua batang dengan satu batang', '(' + X + ' + ' + Y + ') : ' + Y, rasioAtauNull),
        jalur(Math.abs(v[ia] - v[ib]) / v[ib], 'membandingkan selisih kedua batang dengan ' + tm.kat[ib], '(' + F(Math.max(v[ia], v[ib])) + ' - ' + F(Math.min(v[ia], v[ib])) + ') : ' + Y, rasioAtauNull),
        jalur(v[ia] / v[kb], 'membaca batang ' + tm.kat[kb] + ' sebagai pembanding, bukan ' + tm.kat[ib], X + ' : ' + F(v[kb]), rasioAtauNull),
        jalur(v[ka] / v[ib], 'membaca batang ' + tm.kat[ka] + ', bukan ' + tm.kat[ia], F(v[ka]) + ' : ' + Y, rasioAtauNull)
      ];
      var pembahasan = bahas([
        'Batang ' + tm.kat[ia] + ': ' + tm.awalan + X + '.',
        'Batang ' + tm.kat[ib] + ': ' + tm.awalan + Y + '.'
      ], 'Perbandingan ' + tm.objek + ' ' + tm.kat[ia] + ' terhadap ' + tm.kat[ib] + ', dalam bentuk paling sederhana.', [
        'Perbandingan ditulis menurut urutan yang ditanyakan (' + tm.kat[ia] + ' lebih dahulu):',
        R(T(tm.kat[ia]) + ' : ' + T(tm.kat[ib]) + ' = ' + E(v[ia]) + ' : ' + E(v[ib])),
        'FPB dari ' + X + ' dan ' + Y + ' adalah ' + F(g) + ', jadi kedua bilangan dibagi ' + F(g) + ':',
        R(E(v[ia]) + ' : ' + E(v[ib]) + ' = \\frac{' + E(v[ia]) + '}{' + E(g) + '} : \\frac{' + E(v[ib]) + '}{' + E(g) + '} = ' + (v[ia] / g) + ' : ' + (v[ib] / g))
      ], 'Jadi, perbandingan ' + tm.objek + ' ' + tm.kat[ia] + ' terhadap ' + tm.kat[ib] + ' adalah ' + (v[ia] / g) + ':' + (v[ib] / g) + '.');
      return riset({
        jenisSoal: 'Grafik Batang - Bilangan dan Perbandingan',
        judul: 'Grafik Batang · ' + tm.judul, gambar: gambarBar(model), teks: [], pertanyaan: tanya,
        kunci: kunci, fmt: TabelKu.nilaiKeRasio, pengecoh: pengecoh, min: 0.0001,
        langkah: [{ nama: 'jawab', rumus: 'x0_' + ia + '/x0_' + ib }],
        pembahasan: pembahasan,
        model: { param: {}, tampil: {}, toleransi: 1e-9, topik: 'Bilangan dan Perbandingan', bentukJawab: 'rasio', batangAwalan: tm.awalan },
        sidik: { inti: 'rasio-batang|' + ti + '|' + v.join(',') + '|' + ia + '|' + ib, param: v.concat([ia, ib]), entitas: String(ti) }
      }, 'pengayaan', 'Tambahan tim: perbandingan dua batang.');
    }
    return null;
  }

  var KELUARGA = [
    { id: 'tanpa-cacat', nama: 'Tim dengan hasil baik terbanyak', topik: 'Persentase dan Perbandingan', fn: tanpaCacat },
    { id: 'naik-total', nama: 'Perubahan total dua seri', topik: 'Persentase dan Perbandingan', fn: naikTotal },
    { id: 'persen-sumbangan', nama: 'Persen sumbangan batang', topik: 'Persentase dan Perbandingan', fn: persenSumbangan },
    { id: 'rasio-batang', nama: 'Perbandingan dua batang', topik: 'Bilangan dan Perbandingan', fn: rasioBatang }
  ];

  function buat(id, level, benih, opsi) {
    opsi = opsi || {};
    var kel = null;
    KELUARGA.forEach(function (k) { if (k.id === id) kel = k; });
    if (!kel) throw new Error('keluarga grafik tidak dikenal: ' + id);
    var a = Rng.alat(benih);
    var spec = kel.fn(a, level, opsi);
    if (!spec) return null;
    var ctx = { subtes: 'ku', submateri: 'grafik', keluarga: id, level: level, benih: benih, a: a, target: opsi.target };
    var butir = Butir.rakitPg(ctx, spec);
    if (butir) butir.model.topik = (butir.model.topik || kel.topik);
    return butir;
  }

  return { KELUARGA: KELUARGA, buat: buat };
});
