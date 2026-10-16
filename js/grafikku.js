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
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./rng.js'), require('./format.js'), require('./kamus.js'), require('./butir.js'), require('./tabelku.js'));
    module.exports = api;
  } else {
    api = factory(root.Rng, root.Fmt, root.Kamus, root.Butir, root.TabelKu);
    root.GrafikKu = api;
  }
})(typeof self !== 'undefined' ? self : this, function (Rng, Fmt, Kamus, Butir, TabelKu) {
  'use strict';

  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a; }

  function gambarBar(model) { return [{ id: 'grafik', jenis: 'bar', model: model, judul: model.judul }]; }

  var TEMA_TANPA = [
    { judul: 'Jumlah motor yang diproduksi menurut tim produksi', sumbuY: 'Jumlah motor', sumbuX: 'Tim produksi', kat: 'Tim', objek: 'motor', cacat: 'cacat', baik: 'motor tanpa cacat', awalan: 'Tim' },
    { judul: 'Jumlah kredit yang disalurkan menurut kantor cabang (juta $)', sumbuY: 'Kredit disalurkan (juta $)', sumbuX: 'Kantor cabang', kat: 'Cabang', objek: 'kredit', cacat: 'kredit macet', baik: 'kredit lancar', awalan: 'Cabang' },
    { judul: 'Hasil panen menurut kebun (ton)', sumbuY: 'Hasil panen (ton)', sumbuX: 'Kebun', kat: 'Kebun', objek: 'hasil panen', cacat: 'busuk', baik: 'hasil panen yang baik', awalan: 'Kebun' }
  ];

  function tanpaCacat(a, level, opsi) {
    var ti = a.bulat(0, TEMA_TANPA.length - 1), tm = TEMA_TANPA[ti];
    var huruf = ['A', 'B', 'C', 'D', 'E'];
    for (var coba = 0; coba < 2000; coba++) {
      var langkah = tm.objek === 'kredit' || tm.objek === 'hasil panen' ? a.pilih([50, 100, 200]) : a.pilih([500, 1000]);
      var satuNilai = langkah / (level === 'sulit' ? 2 : 1);
      var v = [], d = [];
      for (var i = 0; i < 5; i++) {
        v.push(a.bulat(Math.ceil(langkah * 2 / satuNilai), Math.floor(langkah * 5 / satuNilai)) * satuNilai);
        d.push(a.pilih([4, 5, 6, 8, 9, 10, 12, 13, 15, 18, 20, 25]));
      }
      var baik = v.map(function (x, i) { return x * (100 - d[i]) / 100; });
      var urut = baik.slice().sort(function (x, y) { return y - x; });
      if ((urut[0] - urut[1]) / urut[0] < 0.02) continue;
      var menang = baik.indexOf(urut[0]);
      var tg = opsi && opsi.target != null ? opsi.target : null;
      if (tg !== null && tg !== menang) {
        var tv = v[tg], td = d[tg]; v[tg] = v[menang]; d[tg] = d[menang]; v[menang] = tv; d[menang] = td;
        baik = v.map(function (x, i) { return x * (100 - d[i]) / 100; });
        menang = tg;
      }
      var terbesar = v.indexOf(Math.max.apply(null, v));
      if (v.filter(function (x) { return x === v[terbesar]; }).length > 1) continue;
      if (level !== 'mudah' && menang === terbesar) continue;
      var maks = Math.max.apply(null, v), sumbuMaks = (Math.floor(maks / langkah) + 1) * langkah;
      var nama = huruf.map(function (h) { return tm.kat + ' ' + h; });
      var model = { judul: tm.judul, kategori: nama, seri: [{ nama: tm.objek, nilai: v }], sumbuMaks: sumbuMaks, langkah: langkah, judulY: tm.sumbuY, judulX: tm.sumbuX, labelNilai: level !== 'sulit' };
      var teksPersen = nama.map(function (n, i) { return d[i] + '% ' + tm.objek + ' dari ' + n; });
      var teks = 'Sebanyak ' + teksPersen.slice(0, 4).join(', ') + ' dan ' + teksPersen[4] + ' tergolong ' + tm.cacat + '.';
      var tanya = nama[0].split(' ')[0] + ' mana yang menghasilkan ' + tm.baik + ' paling banyak?';
      var pembahasan = [
        'Jumlah ' + tm.objek + ' dari grafik: ' + nama.map(function (n, i) { return n.replace(tm.kat + ' ', '') + ' ' + Fmt.angka(v[i]); }).join('; ') + '. ' + Kamus.kap(tm.baik) + ' = jumlah × (100% - persen ' + tm.cacat + '):'
      ].concat(nama.map(function (n, i) { return '• ' + n + ': ' + Fmt.angka(v[i]) + ' × ' + (100 - d[i]) + '% = ' + Fmt.angka(baik[i], { desimal: 1 }); }))
        .concat(['Terbanyak: ' + nama[menang] + '.' + (menang !== terbesar ? ' ' + nama[terbesar] + ' memproduksi paling banyak, tetapi ' + d[terbesar] + '% ' + tm.cacat + ' membuat hasil baiknya tidak yang terbanyak.' : '')]);
      var alasan = nama.map(function (n, i) {
        if (i === menang) return null;
        if (i === terbesar) return 'jumlah ' + tm.objek + ' paling banyak, tetapi ' + d[i] + '% di antaranya ' + tm.cacat;
        var minCacat = d.indexOf(Math.min.apply(null, d));
        if (i === minCacat) return 'persentase ' + tm.cacat + ' paling kecil (' + d[i] + '%), tetapi jumlah totalnya terlalu sedikit';
        return Fmt.angka(baik[i], { desimal: 1 }) + ' ' + tm.baik + ', lebih sedikit daripada ' + nama[menang] + ' (' + Fmt.angka(baik[menang], { desimal: 1 }) + ')';
      });
      var pil = {
        opsi: nama.map(function (n, i) { return { teks: n, nilai: i, alasan: alasan[i], kunci: i === menang }; }),
        kunciIndex: menang
      };
      var param = {}, tampil = {};
      d.forEach(function (x, i) { param['d' + i] = String(x); tampil['d' + i] = x + '%'; });
      return {
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
      };
    }
    return null;
  }

  var TEMA_KELOMPOK = [
    { judul: 'Penjualan per Kuartal (juta $)', kat: ['Kuartal 1', 'Kuartal 2', 'Kuartal 3', 'Kuartal 4'], seri: ['2023', '2024'], awalan: '$', akhiran: ' jt', sumbuY: 'Penjualan (juta $)' },
    { judul: 'Jumlah Nasabah Baru per Semester (ribu)', kat: ['Cabang Utara', 'Cabang Selatan', 'Cabang Barat', 'Cabang Timur'], seri: ['Semester 1', 'Semester 2'], awalan: '', akhiran: '', sumbuY: 'Nasabah baru (ribu)' },
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
      var s0 = v0.reduce(function (x, y) { return x + y; }, 0), s1 = v1.reduce(function (x, y) { return x + y; }, 0);
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
      var pengecoh = bentuk === 'total' ? [
        { nilai: (s1 - s0) / s1 * 100, alasan: 'menghitung perubahan terhadap jumlah akhir, bukan jumlah awal' },
        { nilai: s1 - s0, alasan: 'menjawab selisih jumlah total, bukan persentasenya' },
        { nilai: v0.map(function (x, k) { return (v1[k] - x) / x * 100; }).reduce(function (x, y) { return x + y; }, 0) / 4, alasan: 'merata-ratakan persentase tiap kategori tanpa memperhitungkan besar masing-masing' },
        { nilai: s1 / s0 * 100, alasan: 'menjawab jumlah akhir sebagai persen dari jumlah awal' },
        { nilai: -pers, alasan: 'tertukar antara kenaikan dan penurunan' },
        { nilai: (v1[0] - v0[0]) / v0[0] * 100, alasan: 'hanya memakai kategori pertama' }
      ] : [
        { nilai: (v1[ii] - v0[ii]) / v1[ii] * 100, alasan: 'menghitung perubahan terhadap nilai akhir, bukan nilai awal' },
        { nilai: v1[ii] - v0[ii], alasan: 'menjawab selisih angka, bukan persentase' },
        { nilai: v1[ii] / v0[ii] * 100, alasan: 'menjawab nilai akhir sebagai persen dari nilai awal' },
        { nilai: -kunci, alasan: 'tertukar antara kenaikan dan penurunan' },
        { nilai: pers, alasan: 'memakai perubahan total keempat kategori, bukan satu kategori' },
        { nilai: kunci / 2, alasan: 'membagi dua perubahan yang benar' }
      ];
      var pembahasan = bentuk === 'total'
        ? ['Total ' + tm.seri[0] + ' = ' + v0.map(function (x) { return Fmt.angka(x); }).join(' + ') + ' = ' + Fmt.angka(s0) + '; total ' + tm.seri[1] + ' = ' + v1.map(function (x) { return Fmt.angka(x); }).join(' + ') + ' = ' + Fmt.angka(s1) + '.', 'Perubahan = (' + Fmt.angka(s1) + ' - ' + Fmt.angka(s0) + ') ÷ ' + Fmt.angka(s0) + ' × 100% = ' + Fmt.angka(kunci) + '%.']
        : [tm.kat[ii] + ': ' + Fmt.angka(v0[ii]) + ' menjadi ' + Fmt.angka(v1[ii]) + '.', 'Perubahan = (' + Fmt.angka(v1[ii]) + ' - ' + Fmt.angka(v0[ii]) + ') ÷ ' + Fmt.angka(v0[ii]) + ' × 100% = ' + Fmt.angka(kunci) + '%.'];
      return {
        jenisSoal: 'Grafik Batang - Persentase dan Perbandingan',
        judul: 'Grafik Batang · ' + tm.judul, gambar: gambarBar(model), teks: [], pertanyaan: tanya,
        kunci: kunci, fmt: function (v) { return Fmt.angka(v, { desimal: 1 }) + '%'; },
        pengecoh: pengecoh.map(function (p) { return { nilai: Math.round(p.nilai * 10) / 10, alasan: p.alasan }; }),
        desimal: 1, langkahPilihan: 5,
        langkah: bentuk === 'total'
          ? [{ nama: 'a', rumus: 'x0_0+x0_1+x0_2+x0_3' }, { nama: 'b', rumus: 'x1_0+x1_1+x1_2+x1_3' }, { nama: 'jawab', rumus: '(b-a)/a*100' }]
          : [{ nama: 'jawab', rumus: '(x1_' + ii + '-x0_' + ii + ')/x0_' + ii + '*100' }],
        pembahasan: pembahasan,
        model: { param: {}, tampil: {}, toleransi: 0.0501, topik: 'Persentase dan Perbandingan', batangAwalan: tm.awalan },
        sidik: { inti: 'naik-total|' + ti + '|' + v0.join(',') + '|' + v1.join(',') + '|' + bentuk + '|' + ii, param: v0.concat(v1, [ii]), entitas: String(ti) }
      };
    }
    return null;
  }

  var TEMA_SUMBANG = [
    { judul: 'Pendapatan Premi menurut Jenis Asuransi (miliar $)', kat: ['Jiwa', 'Kesehatan', 'Kendaraan', 'Properti', 'Perjalanan'], objek: 'premi', awalan: '$', akhiran: ' M', sumbuY: 'Premi (miliar $)' },
    { judul: 'Jumlah Pelanggan menurut Paket Layanan (ribu)', kat: ['Basic', 'Standar', 'Premium', 'Bisnis', 'Korporat'], objek: 'pelanggan', awalan: '', akhiran: '', sumbuY: 'Pelanggan (ribu)' },
    { judul: 'Volume Penjualan menurut Wilayah (ribu unit)', kat: ['Sumatra', 'Jawa', 'Kalimantan', 'Sulawesi', 'Papua'], objek: 'penjualan', awalan: '', akhiran: '', sumbuY: 'Penjualan (ribu unit)' }
  ];

  function persenSumbangan(a, level) {
    var ti = a.bulat(0, TEMA_SUMBANG.length - 1), tm = TEMA_SUMBANG[ti];
    for (var coba = 0; coba < 3000; coba++) {
      var langkah = a.pilih([10, 20, 50]), satu = langkah / (level === 'sulit' ? 2 : 1);
      var n = 5, v = [];
      for (var i = 0; i < n; i++) v.push(a.bulat(Math.ceil(langkah / satu), Math.floor(langkah * 5 / satu)) * satu);
      var tot = v.reduce(function (x, y) { return x + y; }, 0);
      var ia = a.bulat(0, n - 1), ib = (ia + a.bulat(1, n - 1)) % n;
      var bentuk = level === 'mudah' ? 'satu' : 'dua';
      var bag = bentuk === 'satu' ? v[ia] : v[ia] + v[ib];
      var pers = bag / tot * 100;
      if (Math.abs(pers - Math.round(pers)) > 1e-9 || pers < 8 || pers > 80) continue;
      var kunci = Math.round(pers);
      var maks = Math.max.apply(null, v), sumbuMaks = (Math.floor(maks / langkah) + 1) * langkah;
      var model = { judul: tm.judul, kategori: tm.kat, seri: [{ nama: tm.objek, nilai: v }], sumbuMaks: sumbuMaks, langkah: langkah, awalan: tm.awalan, akhiran: tm.akhiran, judulY: tm.sumbuY, labelNilai: level !== 'sulit' };
      var nm = bentuk === 'satu' ? tm.kat[ia] : tm.kat[ia] + ' dan ' + tm.kat[ib];
      var tanya = 'Berapa persen dari total ' + tm.objek + ' yang disumbang oleh ' + nm + '?';
      var pengecoh = [
        { nilai: bag / (tot - bag) * 100, alasan: 'membandingkan bagian itu dengan sisanya, bukan dengan total' },
        { nilai: v[ia] / tot * 100 + (bentuk === 'dua' ? 0 : 5), alasan: bentuk === 'dua' ? 'hanya menghitung ' + tm.kat[ia] : 'menambah persentase tanpa dasar' },
        { nilai: (bentuk === 'dua' ? v[ib] : v[(ia + 1) % n]) / tot * 100, alasan: 'membaca batang yang salah' },
        { nilai: 100 - pers, alasan: 'menjawab persentase sisanya, bukan bagian yang ditanyakan' },
        { nilai: bag / maks * 100, alasan: 'membandingkan dengan batang tertinggi, bukan dengan total' },
        { nilai: bag / (tot / n) * 10, alasan: 'membandingkan dengan rata-rata, bukan dengan total' }
      ];
      var pembahasan = [
        'Nilai tiap batang: ' + tm.kat.map(function (k, i) { return k + ' ' + Fmt.angka(v[i]); }).join('; ') + '. Total = ' + v.map(function (x) { return Fmt.angka(x); }).join(' + ') + ' = ' + Fmt.angka(tot) + '.',
        nm + ' = ' + (bentuk === 'satu' ? Fmt.angka(v[ia]) : Fmt.angka(v[ia]) + ' + ' + Fmt.angka(v[ib]) + ' = ' + Fmt.angka(bag)) + '.',
        'Persentase = ' + Fmt.angka(bag) + ' ÷ ' + Fmt.angka(tot) + ' × 100% = ' + kunci + '%.'
      ];
      return {
        jenisSoal: 'Grafik Batang - Persentase dan Perbandingan',
        judul: 'Grafik Batang · ' + tm.judul, gambar: gambarBar(model), teks: [], pertanyaan: tanya,
        kunci: kunci, fmt: function (v2) { return Fmt.angka(v2, { desimal: 0 }) + '%'; },
        pengecoh: pengecoh.map(function (p) { return { nilai: Math.round(p.nilai), alasan: p.alasan }; }),
        min: 1, bulat: true, desimal: 0,
        langkah: [{ nama: 'jawab', rumus: bentuk === 'satu' ? 'x0_' + ia + '/(x0_0+x0_1+x0_2+x0_3+x0_4)*100' : '(x0_' + ia + '+x0_' + ib + ')/(x0_0+x0_1+x0_2+x0_3+x0_4)*100' }],
        pembahasan: pembahasan,
        model: { param: {}, tampil: {}, toleransi: 0.0001, topik: 'Persentase dan Perbandingan', batangAwalan: tm.awalan },
        sidik: { inti: 'persen-sumbangan|' + ti + '|' + v.join(',') + '|' + bentuk + '|' + ia + '|' + ib, param: v.concat([ia, ib]), entitas: String(ti) }
      };
    }
    return null;
  }

  function rasioBatang(a, level) {
    var ti = a.bulat(0, TEMA_SUMBANG.length - 1), tm = TEMA_SUMBANG[ti];
    for (var coba = 0; coba < 3000; coba++) {
      var langkah = a.pilih([10, 20, 50, 100]), satu = langkah / 2;
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
      var model = { judul: tm.judul, kategori: tm.kat, seri: [{ nama: tm.objek, nilai: v }], sumbuMaks: sumbuMaks, langkah: langkah, awalan: tm.awalan, akhiran: tm.akhiran, judulY: tm.sumbuY, labelNilai: level !== 'sulit' };
      var tanya = 'Berapa perbandingan ' + tm.objek + ' ' + tm.kat[ia] + ' terhadap ' + tm.kat[ib] + '?';
      var pengecoh = [
        { nilai: v[ib] / v[ia], alasan: 'urutan perbandingan terbalik' },
        { nilai: v[ia] / (v[ia] + v[ib]), alasan: 'membandingkan satu batang dengan jumlah kedua batang' },
        { nilai: (v[ia] + v[ib]) / v[ib], alasan: 'membandingkan jumlah kedua batang dengan satu batang' },
        { nilai: v[ia] / v[(ib + 1) % 5], alasan: 'membaca batang yang salah sebagai pembanding' },
        { nilai: (v[ia] - v[ib]) / v[ib], alasan: 'membandingkan selisih dengan salah satu batang' },
        { nilai: v[ia] / v[(ia + 2) % 5], alasan: 'membaca batang yang salah' }
      ];
      var pembahasan = [
        tm.kat[ia] + ' = ' + Fmt.angka(v[ia]) + ' dan ' + tm.kat[ib] + ' = ' + Fmt.angka(v[ib]) + '.',
        'Perbandingan ' + Fmt.angka(v[ia]) + ' : ' + Fmt.angka(v[ib]) + ' = ' + teksKunci + ' (kedua bilangan dibagi ' + Fmt.angka(g) + ').'
      ];
      return {
        jenisSoal: 'Grafik Batang - Bilangan dan Perbandingan',
        judul: 'Grafik Batang · ' + tm.judul, gambar: gambarBar(model), teks: [], pertanyaan: tanya,
        kunci: kunci, fmt: TabelKu.nilaiKeRasio, pengecoh: pengecoh.filter(function (p) { return p.nilai > 0 && isFinite(p.nilai); }),
        min: 0.0001, tanpaPengali: true, langkahPilihan: 0.1,
        langkah: [{ nama: 'jawab', rumus: 'x0_' + ia + '/x0_' + ib }],
        pembahasan: pembahasan,
        model: { param: {}, tampil: {}, toleransi: 1e-9, topik: 'Bilangan dan Perbandingan', bentukJawab: 'rasio', batangAwalan: tm.awalan },
        sidik: { inti: 'rasio-batang|' + ti + '|' + v.join(',') + '|' + ia + '|' + ib, param: v.concat([ia, ib]), entitas: String(ti) }
      };
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
