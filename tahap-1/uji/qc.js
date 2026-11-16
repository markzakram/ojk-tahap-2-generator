/*
 * qc.js — uji regresi untuk revisi QC paket P001 (tim akademik dan QC Riset, Oktober 2026).
 *
 * Setiap pemeriksaan di sini mewakili satu catatan revisi, supaya temuan yang sama tidak
 * muncul lagi:
 *
 *   - verbal: pernyataan dicetak polos, tanpa label "Pernyataan:" dan tanpa kalimat petunjuk
 *   - pertanyaan soal tidak dicetak tebal di Word/PDF
 *   - tidak ada penulisan skala "juta"/"ribu" pada soal (nominal ditulis utuh, mis. $5.000)
 *   - line graph: kejadian yang dihitung di kunci tertulis di soal (validator), dan sumbu dapat
 *     digeser tepat (paling banyak 120 langkah geser)
 *   - pie chart: keterangan berupa empat kotak berwarna; kotak "informasi kosong" benar-benar kosong
 *   - matriks 2x2 biasa tidak lagi dibuat (diganti 2x2 bersekat)
 *   - pengecoh numerik tidak memakai alasan generik "salah hitung pada salah satu langkah"
 *   - metadata riset (kategori acuan/pengayaan) terisi untuk Penalaran Numerik
 *
 * dan catatan paket-002 (panduan revisi: Kerangka Course, USD, Equation Word, pembahasan):
 *
 *   - Category/Lesson/Chapter/Subchapter persis dari Kerangka Course; keluarga di luar acuan tidak dibuat
 *   - semua uang dalam USD ($), tanpa £ dan €
 *   - pembahasan tanpa analisis opsi salah; soal hitungan memakai Diketahui, Ditanyakan, Pengerjaan,
 *     Kesimpulan dengan baris persamaan yang terbaca; figural punya visual tahapan pola
 *
 *   node uji/qc.js
 */
'use strict';

var path = require('path');
var JS = path.join(__dirname, '..', 'js');
var Paket = require(path.join(JS, 'paket.js'));
var Dokumen = require(path.join(JS, 'dokumen.js'));
var Verbal = require(path.join(JS, 'verbal.js'));
var TabelKu = require(path.join(JS, 'tabelku.js'));
var Validator = require(path.join(JS, 'validator.js'));
var Rumus = require(path.join(JS, 'rumus.js'));
var Kerangka = require(path.join(JS, 'kerangka.js'));

// komposisi paket yang dinilai QC: 30 soal Kemampuan Umum dan 20 soal Penalaran Numerik
var KOMPOSISI_QC = {
  ku: { verbal: 5, cerita: 5, tabel: 5, grafik: 5, serial: 5, matriks: 5 },
  pn: { bar: 5, tabel: 5, garis: 5, pie: 5 }
};

function semuaButir(hasil) {
  var out = [];
  hasil.paket.forEach(function (p) { p.subtes.forEach(function (st) { st.butir.forEach(function (b) { out.push(b); }); }); });
  return out;
}

/** Seluruh teks yang dibaca peserta pada satu butir (stimulus, kotak, pertanyaan, opsi, sel tabel, judul grafik). */
function teksTampil(b) {
  var t = [b.stimulus.judul || ''].concat(b.stimulus.teks || [], (b.stimulus.kartu || []).map(function (k) { return k.judul + ' ' + k.teks; }), [b.pertanyaan || '']);
  (b.opsi || []).forEach(function (o) { t.push(o.teks || ''); });
  (b.stimulus.gambar || []).forEach(function (g) {
    var m = g.model || {};
    t.push(m.judul || '', m.judulY || '', m.judulX || '', m.akhiran || '');
    (m.kolom || []).forEach(function (k) { t.push(k); });
    (m.baris || []).forEach(function (r) { t.push(r.label || ''); (r.sel || []).forEach(function (s) { t.push(String(s)); }); });
  });
  return t.join(' \n ');
}

function jalankan(cek) {
  var hasil = Paket.buat({ jumlahPaket: 6, benih: 2824819757, komposisi: KOMPOSISI_QC });
  cek(hasil.validasi.lulus, 'paket berkomposisi QC (30 KU + 20 PN, benih 2824819757) lulus validator', hasil.validasi.butirLulus + '/' + hasil.validasi.butir);
  var butir = semuaButir(hasil.hasil);

  // verbal: tanpa label dan tanpa kalimat petunjuk, di Excel maupun Word/PDF
  var verbal = butir.filter(function (b) { return b.submateri === 'verbal'; });
  var blok = [];
  hasil.hasil.paket.forEach(function (p) {
    var model = Dokumen.dariPaket(p, function () { return null; }, {});
    (function kumpul(xs) { xs.forEach(function (x) { if (x.t === 'grup') kumpul(x.anak); else blok.push(x); }); })(model.blok);
  });
  var teksBlok = blok.filter(function (x) { return x.t === 'p'; }).map(function (x) { return x.runs.map(function (r) { return r.teks; }).join(''); });
  cek(verbal.length > 0 && verbal.every(function (b) { return Dokumen.teksSoal(b).indexOf('Pernyataan:') < 0; }) && teksBlok.every(function (t) { return t.indexOf('Pernyataan:') !== 0; }),
    'verbal: pernyataan tanpa label "Pernyataan:" (Excel dan Word/PDF)');
  cek(teksBlok.every(function (t) { return t.indexOf('Berdasarkan bacaan di atas') < 0; }) && verbal.every(function (b) { return !b.perintah || b.perintah.indexOf('Berdasarkan bacaan') < 0; }),
    'verbal: tanpa kalimat petunjuk "Berdasarkan bacaan di atas ..."');

  // pertanyaan tidak dicetak tebal
  var tanya = {};
  butir.forEach(function (b) { if (b.pertanyaan) tanya[b.pertanyaan] = true; });
  var tebal = blok.filter(function (x) { return x.t === 'p' && x.runs.length === 1 && tanya[x.runs[0].teks] && x.runs[0].tebal; });
  cek(tebal.length === 0, 'pertanyaan soal tidak dicetak tebal di Word/PDF', tebal.length ? tebal[0].runs[0].teks.slice(0, 60) : '');

  // tidak ada skala "juta"/"ribu"
  var berskala = butir.filter(function (b) { return /\b(juta|ribu)\b/i.test(teksTampil(b)); });
  cek(berskala.length === 0, 'tidak ada penulisan "juta"/"ribu" pada soal, opsi, tabel, dan grafik', berskala.length ? berskala[0].id + ': ' + berskala[0].keluarga : '');

  // line graph dapat digeser tepat
  var garis = butir.filter(function (b) { return b.jenis === 'isian' && b.isian.jenis === 'garis'; });
  var rinci = garis.filter(function (b) { var k = b.isian.kontrol[0]; return (k.maks - k.min) / k.langkah > 120; });
  cek(garis.length > 0 && rinci.length === 0, 'line graph: rentang sumbu paling banyak 120 langkah geser', garis.length + ' butir');

  // pie: empat kotak berwarna, kotak kosong benar-benar kosong
  var pie = butir.filter(function (b) { return b.jenis === 'isian' && b.isian.jenis === 'pie'; });
  cek(pie.length > 0 && pie.every(function (b) {
    var k = b.stimulus.kartu || [], kosong = k.filter(function (x) { return !x.teks; }).length;
    return k.length === 4 && k.every(function (x) { return /^[0-9A-F]{6}$/.test(x.warna); }) && kosong === (b.model.bentuk === 'kosong' ? 1 : 0) &&
      !/tidak disebutkan/.test(teksTampil(b));
  }), 'pie: keterangan berupa empat kotak berwarna; bentuk kosong punya satu kotak tanpa isi', pie.length + ' butir');

  // matriks 2x2 biasa tidak lagi dibuat
  cek(butir.every(function (b) { return b.keluarga !== 'matriks-2'; }), 'figural: matriks 2x2 biasa tidak dibuat lagi (diganti 2x2 bersekat)');

  // pengecoh numerik dari jalur kesalahan nyata
  var generik = butir.filter(function (b) { return (b.pembahasan || []).some(function (t) { return /salah hitung pada salah satu langkah/.test(t); }); });
  cek(generik.length === 0, 'pengecoh numerik tidak memakai alasan generik "salah hitung pada salah satu langkah"', generik.length ? generik[0].id + ': ' + generik[0].keluarga : '');

  // metadata riset Penalaran Numerik
  var pn = butir.filter(function (b) { return b.subtes === 'pn'; });
  cek(pn.every(function (b) { return b.kategoriRiset === 'acuan' || b.kategoriRiset === 'pengayaan'; }) && pn.every(function (b) { return b.kategoriRiset !== 'pengayaan' || !!b.catatanRiset; }),
    'Penalaran Numerik: setiap butir bertanda acuan/pengayaan, pengayaan disertai catatan');

  // Ekspor: setiap jawaban dan pembahasan berada setelah opsi soal yang bersangkutan.
  var urutanSah = hasil.hasil.paket.every(function (p) {
    var teks = [];
    (function kumpul(xs) { xs.forEach(function (x) {
      if (x.t === 'grup') kumpul(x.anak);
      else if (x.t === 'p') teks.push(x.runs.map(function (r) { return r.teks; }).join(''));
    }); })(Dokumen.dariPaket(p, function () { return null; }, {}).blok);
    var posisi = -1, jumlahJawab = teks.filter(function (t) { return /^Jawaban: /.test(t); }).length;
    var jumlahPem = teks.filter(function (t) { return /^Pembahasan: /.test(t); }).length;
    return jumlahJawab === 50 && jumlahPem === 50 && p.subtes.every(function (st) { return st.butir.every(function (b) {
      var awal = teks.findIndex(function (t, i) { return i > posisi && t.indexOf(b.no + '. ') === 0; });
      var akhir = teks.findIndex(function (t, i) { return i > awal && /^Jawaban: /.test(t); });
      var cocok = awal > posisi && akhir > awal && teks[akhir] === 'Jawaban: ' + Dokumen.jawabanLengkap(b) && /^Pembahasan: /.test(teks[akhir + 1]);
      if (b.jenis === 'pg' && !b.opsi[0].gambar) cocok = cocok && b.opsi.every(function (o, i) { return teks.slice(awal, akhir).indexOf(Dokumen.HURUF[i] + '.  ' + o.teks) >= 0; });
      posisi = akhir + 1;
      return cocok;
    }); });
  });
  cek(urutanSah, 'ekspor: 1. soal, opsi, Jawaban: A. teks, Pembahasan; lengkap dan berurutan untuk setiap butir');
  cek(butir.every(function (b) { return Dokumen.naskahLengkap(b).indexOf('\n\nJawaban: ' + Dokumen.jawabanLengkap(b) + '\n\nPembahasan: ') > 0; }),
    'Excel/JSON: naskah_lengkap mengikuti urutan ekspor Word/PDF');

  cek(Verbal.JENIS.filter(function (j) { return /^banding-rantai/.test(j.id); }).every(function (j) { return j.level === 'sedang'; }) &&
    butir.every(function (b) { return ['garis-majemuk', 'laba-persen', 'tak-diketahui'].indexOf(b.keluarga) < 0 || b.level !== 'mudah'; }),
    'kesulitan: rantai perbandingan sedang; majemuk dengan transaksi dan laba bertahap minimal sedang');
  var semuaGanda = hasil.hasil.paket.every(function (p) {
    return p.subtes[0].butir.some(function (b) {
      if (b.keluarga !== 'serial-ganda' || b.level === 'mudah') return false;
      var deret = b.stimulus.gambar[0].model.kotak;
      var aktif = function (k) { return k.bawah.reduce(function (s, x) { return s + x; }, 0); };
      return aktif(deret[4]) >= 2 && deret.slice(1, 4).some(function (k) { return aktif(k) >= 2; });
    });
  });
  cek(semuaGanda, 'paket campuran QC selalu memuat kotak ganda dengan dua kode aktif');
  var mudah = Paket.buat({ jumlahPaket: 3, benih: 8891, tingkat: 'mudah', komposisi: KOMPOSISI_QC });
  cek(mudah.validasi.lulus && semuaButir(mudah.hasil).every(function (b) { return b.level === 'mudah'; }),
    'pilihan semua mudah tetap dipatuhi; keluarga kompleks diganti dengan keluarga yang sesuai');
  cek(hasil.hasil.paket.every(function (p) {
    var bs = semuaButir({ paket: [p] });
    return bs.filter(function (b) { return b.level === 'mudah'; }).length === 15 && bs.filter(function (b) { return b.level === 'sedang'; }).length === 25 && bs.filter(function (b) { return b.level === 'sulit'; }).length === 10;
  }), 'penyesuaian kotak ganda dan keluarga mempertahankan kuota tingkat 15/25/10');

  var hargaSah = true, temaHarga = {};
  for (var seed = 1; seed <= 100; seed++) {
    var b = TabelKu.buat('tak-diketahui', 'sedang', seed, {});
    if (!b) { hargaSah = false; continue; }
    var tabel = b.stimulus.gambar[0].model, nilai = tabel.baris[0].sel.map(function (v) { return Number(v.replace(/\./g, '').replace(',', '.')); });
    var elektronik = /Elektronik/.test(tabel.judul), motor = /Motor/.test(tabel.judul);
    temaHarga[elektronik ? 'elektronik' : motor ? 'motor' : 'rv'] = true;
    if (elektronik && (nilai[0] < 400 || nilai[0] > 1800 || nilai[1] < 300 || nilai[1] > 1200 || nilai[2] < 400 || nilai[2] > 2000)) hargaSah = false;
    if (motor && nilai.some(function (v) { return v < 1500 || v > 12000; })) hargaSah = false;
    if (!Validator.periksaButir(b).lulus) hargaSah = false;
  }
  cek(hargaSah && Object.keys(temaHarga).length === 3, '100 soal harga: nominal dolar sesuai konteks elektronik/motor/RV dan hitungan tetap valid');
  cek(butir.every(function (b) { return !/\b(?:peserta|sukarelawan)-nya\b/.test(teksTampil(b)); }), 'redaksi: pesertanya dan sukarelawannya tanpa tanda hubung');

  // ---- revisi QC paket-002: Kerangka Course, USD, Equation Word, susunan pembahasan, visual figural
  var semuaTeks = function (b) { return teksTampil(b) + '\n' + (b.pembahasan || []).join('\n') + '\n' + (b.kunciTeks || ''); };
  var berMataUangLain = butir.filter(function (b) { return /[£€]/.test(semuaTeks(b)); });
  cek(berMataUangLain.length === 0, 'paket-002 USD: tidak ada £ atau € di soal, tabel, grafik, opsi, kunci, dan pembahasan', berMataUangLain.length ? berMataUangLain[0].id + ': ' + berMataUangLain[0].keluarga : '');
  cek(butir.every(function (b) { return !(b.pembahasan || []).some(function (t) { return /Pilihan lain yang menjebak/.test(t); }); }), 'paket-002: pembahasan hanya menjelaskan jawaban benar (tanpa analisis opsi salah)');
  var salahKelas = butir.filter(function (b) {
    return Kerangka.periksa(b).length > 0;
  });
  cek(salahKelas.length === 0, 'mapping terbaru: Category/Lesson/Chapter/Subchapter sesuai jenis soal (verbal, figural, PN tanpa Subchapter)', salahKelas.length ? salahKelas[0].id + ' ' + JSON.stringify(salahKelas[0].klasifikasi) : '');
  cek(butir.every(function (b) { return Kerangka.NONAKTIF.indexOf(b.keluarga) < 0; }), 'paket-002: keluarga di luar Kerangka Course (peluang, himpunan, barisan) dan konversi kurs tidak dibuat');
  var rumusRusak = [];
  butir.forEach(function (b) { (b.pembahasan || []).forEach(function (t) { if (Rumus.adalah(t)) { var g = Rumus.periksa(Rumus.isi(t)); if (g) rumusRusak.push(b.id + ': ' + g); } }); });
  cek(rumusRusak.length === 0, 'paket-002 Equation: setiap baris persamaan pembahasan terbaca', rumusRusak.slice(0, 2).join('; '));
  var hitungan = butir.filter(function (b) { return b.subtes === 'pn' || ['cerita', 'tabel', 'grafik'].indexOf(b.submateri) >= 0; });
  var tanpaSusunan = hitungan.filter(function (b) {
    var p = b.pembahasan || [], pos = Rumus.JUDUL_BAGIAN.map(function (j) { return p.indexOf(j); });
    return pos.some(function (x) { return x < 0; }) || pos.some(function (x, i) { return i && x < pos[i - 1]; }) || !p.some(Rumus.adalah);
  });
  cek(hitungan.length > 0 && tanpaSusunan.length === 0, 'paket-002 pembahasan hitungan: Diketahui, Ditanyakan, Pengerjaan, Kesimpulan berurutan dengan persamaan (' + hitungan.length + ' butir)', tanpaSusunan.length ? tanpaSusunan[0].id + ': ' + tanpaSusunan[0].keluarga : '');
  var figural = butir.filter(function (b) { return b.submateri === 'figural'; });
  cek(figural.length > 0 && figural.every(function (b) { return (b.gambarPembahasan || []).length > 0; }), 'paket-002 figural: setiap soal punya visual tahapan pola di pembahasan', figural.filter(function (b) { return !(b.gambarPembahasan || []).length; }).map(function (b) { return b.keluarga; }).slice(0, 3).join(','));

  return { butir: butir.length };
}

module.exports = { jalankan: jalankan, KOMPOSISI_QC: KOMPOSISI_QC };

if (require.main === module) {
  var gagal = 0;
  var h = jalankan(function (ok, nama, info) { console.log((ok ? 'ok    ' : 'GAGAL ') + nama + (info ? ' - ' + info : '')); if (!ok) gagal++; });
  console.log('HASIL: ' + h.butir + ' butir diperiksa; ' + gagal + ' pemeriksaan gagal');
  process.exitCode = gagal ? 1 : 0;
}
