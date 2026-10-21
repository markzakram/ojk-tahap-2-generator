/* Regresi bank tambahan: hitungan acuan terpisah dari langkah penyusun,
 * mutasi kunci, seluruh tingkat, tema verbal, dan pemilihan keluarga dalam paket.
 * node uji/variasi.js
 */
'use strict';
var assert = require('assert');
var X = require('../js/variasi.js');
var Verbal = require('../js/verbal.js');
var Tema = require('../js/verbal-topik.js');
var Bank = require('../js/bank.js');
var Paket = require('../js/paket.js');
var V = require('../js/validator.js');
var Kerangka = require('../js/kerangka.js');
var Rumus = require('../js/rumus.js');
var Rumus = require('../js/rumus.js');
// keluarga yang dinonaktifkan (di luar Kerangka Course) tidak diuji dan tidak diharapkan terambil
var AKTIF = X.KELUARGA.filter(function (k) { return Kerangka.NONAKTIF.indexOf(k.id) < 0; });
function angka(s) { return Number(String(s).replace(/\./g, '').replace(',', '.')); }
function salin(b) { return JSON.parse(JSON.stringify(b)); }
function sum(xs) { return xs.reduce(function (a, b) { return a + b; }, 0); }

// Menghitung langsung dari data soal, tanpa membaca b.langkah atau memakai kode penyusun.
function acuan(b) {
  var p = {}, l = b.level;
  Object.keys(b.model.param).forEach(function (k) { p[k] = Number(b.model.param[k]); });
  var g = b.stimulus.gambar[0], rows = g && g.jenis === 'tabel' ? g.model.baris.map(function (r) { return r.sel.map(angka); }) : [];
  var seri = g && g.jenis === 'bar' ? g.model.seri.map(function (s) { return s.nilai; }) : [];
  switch (b.keluarga) {
    case 'kerja-bersama': return p.B * (p.A - (p.s || 0)) / (p.A + p.B) + (l === 'sulit' ? p.s : 0);
    case 'kecepatan-rata': return (p.d1 + p.d2) * 60 / (60 * p.d1 / p.v1 + 60 * p.d2 / p.v2 + (p.ist || 0));
    case 'rata-gabungan': return l === 'sulit' ? p.gab + p.n / p.m * (p.gab - p.x) : p.x + (p.y - p.x) * p.m / (p.n + p.m);
    case 'harga-semula': return (p.akhir - (p.ongkir || 0)) * 10000 / ((100 - p.d1) * (100 - (p.d2 || 0))) / p.n;
    case 'bunga-tunggal': return l === 'sulit' ? (p.saldo + p.biaya) * 1200 / (1200 + p.r * p.bulan) : p.P * p.r * p.bulan / 1200 + (l === 'sedang' ? p.P : 0);
    case 'peluang-kupon': {
      var n = p.merah + p.biru;
      if (l === 'mudah') return p.merah / n * 100;
      return (l === 'sedang' ? p.merah * (p.merah - 1) / 2 : p.merah * p.biru) / (n * (n - 1) / 2) * 100;
    }
    case 'barisan-kursi': {
      if (l === 'sulit') { var selisih = 0; for (var j = 0; j < p.n; j++) selisih += j * p.beda; return (p.total - selisih) / p.n; }
      var kursi = Array.from({ length: p.n }, function (_, j) { return p.awal + j * p.beda; });
      return l === 'mudah' ? kursi[kursi.length - 1] : sum(kursi);
    }
    case 'irisan-kelas': return l === 'mudah' ? p.N - (p.A - p.dua) - p.B : l === 'sedang' ? p.kosong - p.N + p.A + p.B : (p.A - p.dua) + (p.B - p.dua);
    case 'tabel-rata-tertimbang': {
      var kg = rows.map(function (r, i) { return r[0] - (i === 0 ? p.retur || 0 : 0); });
      return sum(rows.map(function (r, i) { return kg[i] * r[1]; })) / sum(kg);
    }
    case 'tabel-target': {
      var pilih = rows.slice(0, l === 'mudah' ? 1 : 3), target = sum(pilih.map(function (r) { return r[0]; })), aktual = sum(pilih.map(function (r) { return r[1]; }));
      return l === 'sulit' ? target - aktual + target * p.persen / 100 : 100 - (target - aktual) / target * 100;
    }
    case 'tabel-produktivitas': {
      var teks = b.stimulus.teks.join(' ') + b.pertanyaan, idx = /Tim ([ABC])/.exec(teks)[1].charCodeAt(0) - 65, r = rows[idx];
      return r[2] / r[0] / r[1] * (l === 'mudah' ? 1 : p.M * (p.H - (p.jeda || 0)));
    }
    case 'grafik-laba': {
      var ix = l === 'mudah' ? ['Jan', 'Feb', 'Mar', 'Apr'].indexOf(/pada (Jan|Feb|Mar|Apr)/.exec(b.pertanyaan)[1]) : -1;
      var M = ix < 0 ? sum(seri[0]) : seri[0][ix], K = ix < 0 ? sum(seri[1]) : seri[1][ix];
      return l === 'sedang' ? (1 - K / M) * 100 : M - K - (p.beban || 0);
    }
    case 'grafik-target-rata': return p.goal + sum(seri[0].map(function (v) { return p.goal - v; })) / (p.N - p.n);
    case 'garis-bergantian': {
      var data = [], start = p.awal === undefined ? p.akhir - 2 * p.satu + 2 * p.dua : p.awal;
      for (var i = 0; i < 5; i++) data.push(start + Math.ceil(i / 2) * p.satu + Math.floor(i / 2) * p.dua * (l === 'mudah' ? 1 : -1));
      return data;
    }
    case 'garis-majemuk': {
      // transaksi sekali-jadi pada Rabu atau Kamis: tanda dan harinya dibaca dari kalimat soal
      var kal = b.stimulus.teks.join(' '), tanda = /(ditukar dengan hadiah|mengurangi|diambil)/.test(kal) ? -1 : 1;
      var hariS = /Khusus Kamis/.test(kal) ? 3 : 2, nilai = [p.awal];
      for (var hari = 1; hari < 5; hari++) nilai.push(nilai[hari - 1] + nilai[hari - 1] * p.r / 100 + (p.tambahan || 0) + (hari === hariS ? tanda * (p.sekali || 0) : 0));
      return nilai;
    }
    default: throw new Error('acuan belum ada: ' + b.keluarga);
  }
}

/*
 * Pembahasan line graph tambahan (QC #48, #49): Diketahui, Ditanyakan, Pengerjaan, Kesimpulan berurutan; rumus umum
 * lalu satu persamaan per hari Selasa-Jumat yang dimulai dari nilai hari sebelumnya dan berakhir di nilai kunci;
 * Kesimpulan menyebut posisi akhir kelima titik. Dihitung dari kunci, bukan dari kode penyusun.
 */
function cekPembahasanGaris(b) {
  var p = b.pembahasan, hari = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'], nilai = b.isian.kunci.nilai;
  var pos = Rumus.JUDUL_BAGIAN.map(function (j) { return p.indexOf(j); });
  assert(pos.every(function (x, i) { return x >= 0 && (!i || x > pos[i - 1]); }), 'judul bagian pembahasan garis tidak lengkap/berurutan: ' + pos);
  var rumus = p.filter(Rumus.adalah).map(Rumus.isi);
  rumus.forEach(function (n) { assert.strictEqual(Rumus.periksa(n), null, 'persamaan tidak terurai: ' + n); });
  assert(/^\\text\{nilai/.test(rumus[0]), 'Pengerjaan garis tidak diawali rumus umum: ' + rumus[0]);
  var id = function (v) { return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); };   // nilai garis selalu bulat
  for (var h = 1; h < 5; h++) {
    var baris = rumus.filter(function (n) { return n.indexOf('\\text{' + hari[h] + '} = ') === 0; });
    assert.strictEqual(baris.length, 1, 'persamaan hari ' + hari[h] + ' tidak tepat satu');
    assert(baris[0].indexOf('\\text{' + hari[h] + '} = ' + id(nilai[h - 1]) + ' ') === 0, hari[h] + ' tidak dimulai dari nilai ' + hari[h - 1] + ': ' + baris[0]);
    assert(baris[0].slice(-(' = ' + id(nilai[h])).length) === ' = ' + id(nilai[h]), hari[h] + ' tidak berakhir di nilai kunci ' + nilai[h] + ': ' + baris[0]);
  }
  var simpul = p.slice(pos[3] + 1, -1).join(' ');
  hari.forEach(function (d, i) { assert(simpul.indexOf(d + ' ke ' + id(nilai[i]) + ' ') >= 0, 'Kesimpulan tidak menyebut ' + d + ' ke ' + nilai[i]); });
}

function jalankan(cek) {
  var total = 0, mutasi = 0;
  function uji(nama, fn) { try { fn(); cek(true, nama); } catch (e) { cek(false, nama, e.message); } }
  AKTIF.forEach(function (k) {
    ['mudah', 'sedang', 'sulit'].forEach(function (l) {
      uji(k.id + ' / ' + l + ': 20 benih, acuan independen dan kunci salah ditolak', function () {
        for (var seed = 1; seed <= 20; seed++) {
          var b = X.buat(k.id, l, seed, { target: seed % 5 }); assert(b, 'butir kosong: ' + seed);
          var r = V.periksaButir(b); assert(r.lulus, r.masalah.join('; '));
          var ingin = acuan(b), nyata = b.jenis === 'pg' ? b.opsi[b.kunci].nilai : b.isian.kunci.nilai;
          if (Array.isArray(ingin)) assert.deepStrictEqual(nyata, ingin);
          else assert(Math.abs(nyata - ingin) < 1e-7, 'jawaban acuan berbeda: ' + nyata + ' vs ' + ingin);
          if (b.submateri === 'garis') cekPembahasanGaris(b);
          var rusak = salin(b);
          if (rusak.jenis === 'pg') rusak.kunci = (rusak.kunci + 1) % 5;
          else rusak.isian.kunci.nilai[2] += rusak.model.snap;
          assert(!V.periksaButir(rusak).lulus, 'validator meloloskan kunci yang dirusak'); mutasi++; total++;
          if (seed === 1) assert.deepStrictEqual(b, X.buat(k.id, l, seed, { target: seed % 5 }), 'benih tidak deterministik');
        }
      });
    });
  });
  // Seluruh keluarga numerik Kemampuan Umum yang aktif (cerita, tabel, grafik): pembahasan berbentuk Diketahui,
  // Ditanyakan, Pengerjaan, Kesimpulan; setiap baris "§" dapat dicetak penulis persamaan (Word/OMML, HTML, teks);
  // tidak ada £ atau € di mana pun pada butir (soal, model tabel/grafik, opsi, alasan, pembahasan).
  var contohNumerik = {};
  ['cerita', 'tabel', 'grafik'].forEach(function (sub) {
    Bank.ambil('ku', sub).keluarga.forEach(function (kel, fi) {
      uji('numerik ' + kel.id + ': pembahasan empat bagian, persamaan dapat dicetak, hanya dolar', function () {
        kel.tingkat.forEach(function (l) {
          for (var seed = 1; seed <= 12; seed++) {
            var b = Bank.buat('ku', sub, fi, l, 7000 + seed * 131, { target: seed % 5 });
            if (!b) continue;
            (contohNumerik[kel.id] = contohNumerik[kel.id] || []).push(b);
            var r = V.periksaButir(b); assert(r.lulus, l + '/' + seed + ': ' + r.masalah.join('; '));
            assert(!/[£€]/.test(JSON.stringify(b)), 'masih memakai £ atau €: ' + l + '/' + seed);
            var p = b.pembahasan, pos = ['Diketahui', 'Ditanyakan', 'Pengerjaan', 'Kesimpulan'].map(function (j) { return p.indexOf(j); });
            assert(pos.every(function (x, k) { return x >= 0 && (!k || x > pos[k - 1]); }), 'judul bagian pembahasan tidak lengkap/berurutan');
            assert(!p.some(function (x) { return /Pilihan lain yang menjebak/.test(x); }), 'pembahasan masih mengulas pilihan salah');
            var kesimpulan = p.slice(pos[3] + 1).join(' ');
            assert(kesimpulan.indexOf('Jawaban: ' + b.opsi[b.kunci].huruf) >= 0, 'Kesimpulan tidak menyebut huruf kunci');
            var persamaan = p.filter(Rumus.adalah);
            assert(persamaan.length > 0, 'tidak ada baris persamaan');
            persamaan.forEach(function (x) {
              var n = Rumus.isi(x), e = Rumus.periksa(n);
              assert(!e, 'Rumus.periksa: ' + e);
              assert(/<m:oMath>/.test(Rumus.omml(n)) && Rumus.html(n) && Rumus.teks(n, true), 'persamaan tidak tercetak: ' + n);
            });
          }
        });
        assert((contohNumerik[kel.id] || []).length > 0, 'tidak ada butir yang tersusun');
      });
    });
  });
  // catatan QC paket-002 untuk numerik Kemampuan Umum
  uji('catatan QC numerik: #8 konversi m³ dengan pangkat, #11 rumus Sn dan tahun n-1/n, #13 seluruh bahan, #15/#18 asal total, #20 rumus rata-rata, #23 tanda negatif', function () {
    var semua = function (id) { return contohNumerik[id] || []; }, ada = function (b, re) { return b.pembahasan.some(function (x) { return re.test(x); }); };
    semua('harga-satuan').forEach(function (b) { assert(ada(b, /^§ 1\\ \\text\{m\}\^\{3\} = \(100\\ \\text\{cm\}\)\^\{3\}/), '#8: konversi 1 m³ = (100 cm)³ tidak ada'); });
    semua('ukur-wadah').forEach(function (b) { assert(ada(b, /\(10\\ \\text\{(cm|dm)\}\)\^\{3\}/), '#8: konversi satuan volume dengan pangkat tidak ada'); });
    semua('pertumbuhan-tahun').forEach(function (b) {
      assert(ada(b, /^§ [SN]_\{n\} = [\d.]+ \\times \(\d\{,\}\d+\)\^\{n\}$/), '#11: rumus Sn = ... × (f)^n tidak ada');
      var n = b.opsi[b.kunci].nilai;
      assert(ada(b, new RegExp('^§ [SN]_\\{' + n + '\\} = ')) && ada(b, new RegExp('^§ [SN]_\\{' + (n - 1) + '\\} = ')), '#11: tahun ke-' + (n - 1) + ' dan ke-' + n + ' tidak dibandingkan');
    });
    semua('tabel-rata-tertimbang').forEach(function (b) {
      var retur = !!b.model.param.retur;
      assert(retur ? /tetap dibeli/.test(b.pertanyaan) : /seluruh bahan yang dibeli/.test(b.pertanyaan), '#13: redaksi bahan yang dirata-ratakan: ' + b.pertanyaan);
    });
    semua('tabel-target').filter(function (b) { return b.level !== 'mudah'; }).forEach(function (b) { assert(ada(b, /^§ \\text\{target gabungan\} = \d[\d.]* \+ \d[\d.]* \+ \d[\d.]* = /), '#15: asal target gabungan tidak ditulis'); });
    semua('grafik-laba').filter(function (b) { return b.level !== 'mudah'; }).forEach(function (b) {
      assert(ada(b, /^§ \\text\{pendapatan\} = (\\\$[\d.]+ \+ ){3}\\\$[\d.]+ = /) && ada(b, /^§ \\text\{biaya rutin\} = (\\\$[\d.]+ \+ ){3}\\\$[\d.]+ = /), '#18: penjumlahan empat bulan tidak ditulis');
    });
    semua('grafik-target-rata').forEach(function (b) {
      var p = b.model.param;
      assert(ada(b, new RegExp('^§ ' + p.goal + ' = \\\\frac\\{[\\d +]+ \\+ \\d*x\\}\\{' + p.N + '\\}$')), '#20: rumus rata-rata dengan substitusi tidak ada');
    });
    semua('perubahan-persen').concat(semua('naik-total')).forEach(function (b) {
      var negatif = b.opsi[b.kunci].nilai < 0, simpul = b.pembahasan.slice(b.pembahasan.indexOf('Kesimpulan')).join(' ');
      assert(negatif ? /turun/.test(simpul) : /naik/.test(simpul), '#23: arti tanda perubahan tidak disebut');
      assert(ada(b, /^§ \\text\{perubahan\} = \\frac\{/), '#23: perubahan tidak ditulis sebagai pecahan terhadap nilai awal');
    });
  });
  Tema.forEach(function (t) {
    uji('verbal ' + t.id + ': tiga tingkat dan Benar/Salah/Tidak Diketahui', function () {
      ['mudah', 'sedang', 'sulit'].forEach(function (l) {
        for (var k = 0; k < 3; k++) for (var seed = 1; seed <= 10; seed++) {
          var b = Verbal.buat('bacaan-pernyataan', l, seed, { target: k, tema: t.id }); assert(b, 'butir kosong');
          var r = V.periksaButir(b); assert(r.lulus, r.masalah.join('; ')); assert.strictEqual(b.kunci, k); assert.strictEqual(b.model.tema, t.id);
          assert(!/\{\w+\}|undefined|tidak telah/.test(b.stimulus.teks.join(' ') + b.pertanyaan), 'slot atau kalimat tidak selesai');
          var rusak = salin(b); rusak.kunci = (rusak.kunci + 1) % 3; assert(!V.periksaButir(rusak).lulus); total++; mutasi++;
        }
      });
    });
  });
  uji('53 keluarga aktif, 20 tema, seluruh keluarga tambahan terambil dan pasangan keluarga beragam', function () {
    var katalog = Bank.katalog(), jumlah = sum(katalog.map(function (s) { return new Set(s.keluarga.map(function (k) { return k.id; })).size; }));
    assert.strictEqual(jumlah, 53); assert.strictEqual(Verbal.TOPIK.length, 20);
    var p = Paket.buat({ jumlahPaket: 80, benih: 2026 }); assert(p.validasi.lulus, JSON.stringify(p.validasi));
    var ketemu = new Set(), pasangan = new Set();
    p.hasil.paket.forEach(function (paket) { paket.subtes.forEach(function (st) {
      var grup = {};
      st.butir.forEach(function (b) { ketemu.add(b.keluarga); (grup[b.submateriKomposisi] = grup[b.submateriKomposisi] || []).push(b.keluarga); });
      Object.keys(grup).forEach(function (k) {
        var unik = new Set(Bank.ambil(st.kode, k).keluarga.map(function (f) { return f.id; })).size;
        if (grup[k].length <= unik) assert.strictEqual(new Set(grup[k]).size, grup[k].length, 'keluarga berulang: ' + k);
      });
      if (st.kode === 'ku') pasangan.add(grup.cerita.slice().sort().join('|'));
    }); });
    AKTIF.forEach(function (k) { assert(ketemu.has(k.id), 'keluarga tidak terambil: ' + k.id); });
    assert(pasangan.size > 20, 'pasangan keluarga cerita terlalu seragam');
    var pendek = Paket.buat({ jumlahPaket: 5, benih: 2026 });
    assert.deepStrictEqual(p.hasil.paket.slice(0, 5), pendek.hasil.paket, 'hasil bergantung pada jumlah paket');
    assert.strictEqual(p.hasil.meta.versi, 5);
  });
  return { butir: total, mutasi: mutasi };
}
module.exports = { jalankan: jalankan };
if (require.main === module) {
  var gagal = 0;
  var hasil = jalankan(function (ok, nama, info) { console.log((ok ? 'ok ' : 'GAGAL ') + nama + (info ? ': ' + info : '')); if (!ok) gagal++; });
  console.log('HASIL: ' + hasil.butir + ' butir, ' + hasil.mutasi + ' mutasi kunci; ' + gagal + ' pemeriksaan gagal');
  process.exitCode = gagal ? 1 : 0;
}
