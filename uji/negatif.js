/*
 * negatif.js — uji NEGATIF validator: butir yang sengaja dirusak harus ditolak.
 *
 * Uji positif ("butir yang benar lulus") belum membuktikan validator benar-benar memeriksa.
 * Berkas ini membuat paket, lalu merusak salinan butir dengan cara yang pasti membuat soal
 * salah (kunci digeser, dua opsi sama-benar, angka tabel/grafik/model diubah, kondisi awal
 * interaktif sudah sama dengan kunci, fakta verbal dibuang atau dibalik, ...) dan mewajibkan
 * validator menolak SEMUANYA. Perusakan jenis "mungkin" (mis. kotak deret figural diganti)
 * hanya dilaporkan tingkat deteksinya, karena kadang hasil perusakan kebetulan tetap benar.
 *
 * Selain butir dari paket, setiap keluarga figural dibuat langsung dari bank pada ketiga
 * tingkat, sehingga perusakan wajib (kunci digeser, dua opsi sama-benar) pasti mengenai
 * semua bentuk figural, termasuk yang jarang terambil paket. Bentuk riset (matriks 5x5,
 * 5x6, 2x2 bersekat, deret kotak ganda) juga dirusak isinya: kotak tampak diganti, warna
 * dibalik, belahan ditukar, atau kode belah ketupat dibalik.
 *
 *   node uji/negatif.js [jumlahPaket] [benih]
 */
'use strict';

var path = require('path');
var JS = path.join(__dirname, '..', 'js');
var Paket = require(path.join(JS, 'paket.js'));
var Validator = require(path.join(JS, 'validator.js'));
var Bank = require(path.join(JS, 'bank.js'));
var Rng = require(path.join(JS, 'rng.js'));

/** Perusakan yang WAJIB diuji pada setiap keluarga figural (bukan hanya yang kebetulan terambil paket). */
var WAJIB_FIGURAL = ['kunci digeser ke opsi lain', 'dua opsi bergambar sama-benar (figural)'];

function salin(x) { return JSON.parse(JSON.stringify(x)); }

/** Tambah `d` pada bilangan pertama dalam teks ("$1.234,50" -> "$1.241,50"); null bila tak ada bilangan. */
function geserAngkaPertama(teks, d) {
  var ada = false;
  var hasil = String(teks).replace(/\d+/, function (m) { ada = true; return String(Number(m) + d); });
  return ada ? hasil : null;
}

var MUTASI = [
  {
    nama: 'kunci digeser ke opsi lain', pasti: true,
    berlaku: function (b) { return b.jenis === 'pg'; },
    terapkan: function (b) { b.kunci = (b.kunci + 1) % b.opsi.length; }
  },
  {
    nama: 'kunci di luar daftar opsi', pasti: true,
    berlaku: function (b) { return b.jenis === 'pg'; },
    terapkan: function (b) { b.kunci = 9; }
  },
  {
    nama: 'dua opsi berisi jawaban benar (numerik)', pasti: true,
    berlaku: function (b) { return b.jenis === 'pg' && b.submateri !== 'verbal' && b.submateri !== 'figural'; },
    terapkan: function (b) {
      var j = (b.kunci + 1) % b.opsi.length;
      b.opsi[j].teks = b.opsi[b.kunci].teks; b.opsi[j].nilai = b.opsi[b.kunci].nilai;
    }
  },
  {
    nama: 'dua opsi bergambar sama-benar (figural)', pasti: true,
    berlaku: function (b) { return b.jenis === 'pg' && b.submateri === 'figural'; },
    terapkan: function (b) {
      var j = (b.kunci + 1) % b.opsi.length;
      b.opsi[j].gambar = Object.assign({}, b.opsi[j].gambar, { model: salin(b.opsi[b.kunci].gambar.model) });
    }
  },
  {
    nama: 'angka pada opsi kunci diubah', pasti: true,
    berlaku: function (b) { return b.jenis === 'pg' && b.submateri !== 'verbal' && b.submateri !== 'figural' && geserAngkaPertama(b.opsi[b.kunci].teks, 1) !== null; },
    terapkan: function (b) { b.opsi[b.kunci].teks = geserAngkaPertama(b.opsi[b.kunci].teks, 1); }
  },
  {
    nama: 'parameter model diubah', pasti: true,
    berlaku: function (b) { return b.model && b.model.param && Object.keys(b.model.param).length > 0; },
    terapkan: function (b) {
      Object.keys(b.model.param).forEach(function (k) {
        var v = b.model.param[k];
        if (/^-?\d+(\.\d+)?$/.test(String(v))) b.model.param[k] = String(Number(v) + 1);
      });
    }
  },
  {
    nama: 'seluruh angka sel tabel diubah', pasti: true,
    berlaku: function (b) { return b.jenis === 'pg' && b.stimulus.gambar && b.stimulus.gambar[0] && b.stimulus.gambar[0].jenis === 'tabel'; },
    varian: 3,
    terapkan: function (b, v) {
      // tiap varian mengubah SEMUA angka dengan cara berbeda; cukup satu varian yang tertangkap
      var rumus = [
        function (n, c) { return n * (1 + (c % 3)) + 3; },
        function (n, c) { return n + 1000 * (c + 1) + 17; },
        function (n, c, r) { return (n * 7 + r * 13 + c * 29) % 997 + 11; }
      ][v];
      b.stimulus.gambar[0].model.baris.forEach(function (row, r) {
        row.sel = row.sel.map(function (t, c) {
          var ada = false, hasil = String(t).replace(/\d+/, function (mm) { ada = true; return String(rumus(Number(mm), c, r)); });
          return ada ? hasil : t;
        });
      });
    }
  },
  {
    nama: 'seluruh batang grafik diubah (diputar dan digandakan)', pasti: true,
    berlaku: function (b) { return b.jenis === 'pg' && b.stimulus.gambar && b.stimulus.gambar[0] && b.stimulus.gambar[0].jenis === 'bar'; },
    varian: 3,
    terapkan: function (b, v) {
      var rumus = [
        function (x, i, a) { return a[(i + 1) % a.length] * 2 + 15; },
        function (x, i, a) { return a[a.length - 1 - i] + 40; },
        function (x, i) { return (i + 1) * 30; }
      ][v];
      b.stimulus.gambar[0].model.seri.forEach(function (s) { s.nilai = s.nilai.map(rumus); });
    }
  },
  {
    nama: 'kunci interaktif diubah', pasti: true,
    berlaku: function (b) { return b.jenis === 'isian'; },
    terapkan: function (b) {
      var is = b.isian, k = is.kunci;
      if (is.jenis === 'bar-tumpuk') { k.total[0] += is.kontrol[0].langkah; b.gambarPembahasan[0].state.total[0] = k.total[0]; }
      else if (is.jenis === 'garis') { k.nilai[0] += is.kontrol[0].langkah; b.gambarPembahasan[0].state.nilai[0] = k.nilai[0]; }
      else if (is.jenis === 'pie') { k.persen[0] += 1; k.persen[1] -= 1; b.gambarPembahasan[0].state.persen = k.persen.slice(); }
      else k[0] = (k[0] + 1) % is.pilihan.length;
    }
  },
  {
    nama: 'tampilan awal interaktif sudah sama dengan kunci', pasti: true,
    berlaku: function (b) { return b.jenis === 'isian'; },
    terapkan: function (b) { b.isian.awal = salin(b.isian.kunci); }
  },
  {
    nama: 'pembahasan dikosongkan', pasti: true,
    berlaku: function () { return true; },
    terapkan: function (b) { b.pembahasan = []; }
  },
  {
    nama: 'fakta verbal dibuang', pasti: true,
    berlaku: function (b) { return b.submateri === 'verbal' && Array.isArray(b.model.fakta); },
    terapkan: function (b) { b.model.fakta = []; }
  },
  {
    // tiap fakta berpolaritas dibalik (termasuk <-> tidak termasuk, "hanya" <-> "seperti", naik <-> turun,
    // "tidak semua" <-> "semua", teori <-> terbukti, perlu <-> cukup, urutan dan perbandingan ditukar)
    // sementara kalimatnya tetap: validator harus melihat bahwa kalimat dan faktanya tidak cocok lagi
    nama: 'polaritas fakta verbal dibalik', pasti: true,
    berlaku: function (b) { return b.submateri === 'verbal' && Array.isArray(b.model.fakta) && b.model.fakta.some(function (f) { return f.tipe !== 'latar' && f.tipe !== 'golongan'; }); },
    terapkan: function (b) {
      var Q = { semua: 'tidak-semua', 'tidak-semua': 'semua', sebagian: 'tidak-ada', 'tidak-ada': 'sebagian', 'sebagian-besar': 'tidak-ada' };
      var ST = { teori: 'terbukti', belum: 'terbukti', terbukti: 'belum' };
      b.model.fakta.forEach(function (f) {
        if (f.tipe === 'bagian') f.ya = !f.ya;
        else if (f.tipe === 'daftar') f.lengkap = !f.lengkap;
        else if (f.tipe === 'sebab') f.arah = f.arah === 'naik' ? 'turun' : 'naik';
        else if (f.tipe === 'kuantor') f.q = Q[f.q];
        else if (f.tipe === 'status') f.status = ST[f.status];
        else if (f.tipe === 'syarat') f.jenis = f.jenis === 'perlu' ? 'cukup' : 'perlu';
        else if (f.tipe === 'urutan') { var p = f.pertama; f.pertama = f.lanjut[0]; f.lanjut[0] = p; }
        else if (f.tipe === 'banding') { var a = f.a; f.a = f.b; f.b = a; }
      });
    }
  },
  {
    nama: 'kalimat bacaan verbal dihapus', pasti: true,
    berlaku: function (b) { return b.submateri === 'verbal' && Array.isArray(b.model.fakta) && b.model.fakta.length > 1; },
    terapkan: function (b) {
      var t = b.model.fakta[b.model.fakta.length - 1].teks;
      b.stimulus.teks = [String(b.stimulus.teks[0]).replace(' ' + t, '')];
    }
  },
  {
    nama: 'matriks 5x5: satu kotak tampak diganti bentuk lain', pasti: true,
    berlaku: function (b) { return b.submateri === 'figural' && b.model.tipe === 'matriks-latin'; },
    terapkan: function (b) {
      var g1 = b.stimulus.gambar[0].model.grid, g2 = b.model.grid;
      for (var r = 0; r < g1.length; r++) for (var c = 0; c < g1[r].length; c++) if (g1[r][c] !== null) { g1[r][c] = g2[r][c] = (g1[r][c] + 1) % 5; return; }
    }
  },
  {
    nama: 'matriks 5x6: warna satu kotak tampak dibalik', pasti: true,
    berlaku: function (b) { return b.submateri === 'figural' && b.model.tipe === 'matriks-isi'; },
    terapkan: function (b) {
      var g1 = b.stimulus.gambar[0].model.grid, g2 = b.model.grid, r = (b.model.lubang.r + 2) % g1.length;
      g1[r][0].i = 1 - g1[r][0].i; g2[r][0].i = g1[r][0].i;
    }
  },
  {
    nama: 'matriks 5x6: bentuk satu kotak tampak diganti', pasti: true,
    berlaku: function (b) { return b.submateri === 'figural' && b.model.tipe === 'matriks-isi'; },
    terapkan: function (b) {
      var g1 = b.stimulus.gambar[0].model.grid, g2 = b.model.grid, r = (b.model.lubang.r + 1) % g1.length;
      g1[r][1].b = (g1[r][1].b + 1) % 4; g2[r][1].b = g1[r][1].b;
    }
  },
  {
    nama: 'matriks bersekat: dua belahan satu gambar dalam ditukar', pasti: true,
    berlaku: function (b) { return b.submateri === 'figural' && b.model.tipe === 'matriks-sekat'; },
    terapkan: function (b) {
      [b.stimulus.gambar[0].model.dalam, b.model.dalam].forEach(function (dalam) {
        var bl = dalam[(b.model.tanya + 1) % 4].belahan, k = Object.keys(bl), t = bl[k[0]];
        bl[k[0]] = bl[k[1]]; bl[k[1]] = t;
      });
    }
  },
  {
    nama: 'kotak ganda: satu belah ketupat kode kotak kelima dibalik', pasti: true,
    berlaku: function (b) { return b.submateri === 'figural' && b.model.tipe === 'serial-ganda'; },
    terapkan: function (b) {
      [b.stimulus.gambar[0].model.kotak, b.model.kotak].forEach(function (k) { k[4].bawah[0] = 1 - k[4].bawah[0]; });
    }
  },
  {
    nama: 'kotak terakhir deret figural diganti gambar opsi lain', pasti: false,
    berlaku: function (b) { return b.submateri === 'figural' && b.model.tipe === 'serial' && b.stimulus.gambar[0].model.sels.length > 2; },
    terapkan: function (b) {
      var lain = b.opsi[(b.kunci + 2) % b.opsi.length].gambar.model.cell;
      var s1 = b.stimulus.gambar[0].model.sels, s2 = b.model.sels;
      s1[s1.length - 1] = salin(lain); s2[s2.length - 1] = salin(lain);
    }
  }
];

function jalankan(opsi) {
  opsi = opsi || {};
  var jumlah = opsi.jumlahPaket || 6, benih = opsi.benih == null ? 4242 : opsi.benih;
  var r = Paket.buat({ jumlahPaket: jumlah, benih: benih });
  var butir = [];
  r.hasil.paket.forEach(function (p) { p.subtes.forEach(function (st) { st.butir.forEach(function (b) { butir.push(b); }); }); });
  var laporan = [], gagal = [];

  // tiap keluarga figural, pada ketiga tingkat, dibuat langsung dari bank supaya pasti ikut diuji
  var famFigural = [];
  ['serial', 'matriks'].forEach(function (sub) {
    Bank.ambil('ku', sub).keluarga.forEach(function (k, fi) {
      if (famFigural.indexOf(k.id) >= 0) return;
      famFigural.push(k.id);
      ['mudah', 'sedang', 'sulit'].forEach(function (lv, li) {
        var b = Bank.buat('ku', sub, fi, lv, Rng.turunan(benih, 'negatif', k.id, lv), { target: (li + fi) % 5 });
        if (!b) { gagal.push('keluarga ' + k.id + ' tingkat ' + lv + ' gagal disusun untuk uji negatif'); return; }
        b.id = 'NEG-' + k.id + '-' + lv; b.no = 1; b.paket = 0;
        butir.push(b);
      });
    });
  });

  // butir asli harus lulus (kontrol)
  var asliGagal = butir.filter(function (b) { return !Validator.periksaButir(b).lulus; });
  if (asliGagal.length) gagal.push('butir asli yang tidak lulus: ' + asliGagal.length + ' (mis. ' + asliGagal.slice(0, 3).map(function (b) { return b.id; }).join(', ') + ')');

  var diujiPer = {};
  MUTASI.forEach(function (m) {
    var coba = 0, tolak = 0, lolos = [], per = diujiPer[m.nama] = {};
    butir.forEach(function (b) {
      if (!m.berlaku(b)) return;
      coba++;
      if (b.submateri === 'figural') per[b.keluarga] = (per[b.keluarga] || 0) + 1;
      var ditolak = false;
      for (var v = 0; v < (m.varian || 1) && !ditolak; v++) {
        var c = salin(b);
        m.terapkan(c, v);
        if (!Validator.periksaButir(c).lulus) ditolak = true;
      }
      if (ditolak) tolak++; else lolos.push(b.id);
    });
    laporan.push({ nama: m.nama, pasti: m.pasti, coba: coba, tolak: tolak, lolos: lolos });
    if (m.pasti && lolos.length) gagal.push('"' + m.nama + '": ' + lolos.length + ' dari ' + coba + ' butir rusak lolos validator (mis. ' + lolos.slice(0, 3).join(', ') + ')');
    if (m.pasti && coba === 0) gagal.push('"' + m.nama + '": tidak ada butir yang bisa diuji');
  });

  // setiap keluarga figural harus terkena perusakan wajib (di semua tingkat yang dibuat di atas)
  WAJIB_FIGURAL.forEach(function (nama) {
    var per = diujiPer[nama] || {}, kurang = famFigural.filter(function (id) { return !(per[id] >= 3); });
    laporan.push({ nama: '"' + nama + '" mencakup setiap keluarga figural (' + famFigural.join(', ') + ')', pasti: true, coba: famFigural.length, tolak: famFigural.length - kurang.length, lolos: [] });
    if (kurang.length) gagal.push('"' + nama + '" belum diuji pada keluarga: ' + kurang.join(', '));
  });

  // tingkat paket dan hasil
  var paket0 = salin(r.hasil.paket[0]);
  var ganda = salin(paket0); ganda.subtes[0].butir[1].id = ganda.subtes[0].butir[0].id;
  var rp = Validator.periksaPaket(ganda);
  laporan.push({ nama: 'id butir ganda dalam paket', pasti: true, coba: 1, tolak: rp.lulus ? 0 : 1, lolos: [] });
  if (rp.lulus) gagal.push('id ganda dalam paket tidak terdeteksi');
  var jml = salin(paket0); jml.subtes[0].jumlah += 1;
  rp = Validator.periksaPaket(jml);
  laporan.push({ nama: 'jumlah soal subtes tidak cocok', pasti: true, coba: 1, tolak: rp.lulus ? 0 : 1, lolos: [] });
  if (rp.lulus) gagal.push('jumlah soal subtes yang salah tidak terdeteksi');
  var kom = salin(paket0); kom.subtes[0].komposisi[Object.keys(kom.subtes[0].komposisi)[0]] += 1;
  rp = Validator.periksaPaket(kom);
  laporan.push({ nama: 'komposisi submateri tidak cocok', pasti: true, coba: 1, tolak: rp.lulus ? 0 : 1, lolos: [] });
  if (rp.lulus) gagal.push('komposisi yang salah tidak terdeteksi');

  // butir kembar antar-paket
  var kembar = { meta: r.hasil.meta, paket: [salin(r.hasil.paket[0]), salin(r.hasil.paket[1])] };
  var asal = kembar.paket[0].subtes[0].butir[2], salinan = salin(asal);
  salinan.id = 'P002-KU-99'; salinan.paket = 2; salinan.no = kembar.paket[1].subtes[0].butir.length + 1;
  kembar.paket[1].subtes[0].butir.push(salinan); kembar.paket[1].subtes[0].jumlah += 1;
  var kb = kembar.paket[1].subtes[0].komposisi, kunciKomp = salinan.submateriKomposisi; kb[kunciKomp] = (kb[kunciKomp] || 0) + 1;
  var ph = Validator.periksaHasil(kembar);
  laporan.push({ nama: 'butir kembar antar-paket', pasti: true, coba: 1, tolak: ph.kembar.length ? 1 : 0, lolos: [] });
  if (!ph.kembar.length) gagal.push('butir kembar antar-paket tidak terdeteksi');
  if (ph.lulus) gagal.push('hasil dengan butir kembar dinyatakan lulus');

  return { butir: butir.length, laporan: laporan, gagal: gagal };
}

module.exports = { jalankan: jalankan, MUTASI: MUTASI };

if (require.main === module) {
  var h = jalankan({ jumlahPaket: Number(process.argv[2]) || 6, benih: process.argv[3] ? Number(process.argv[3]) : undefined });
  console.log(h.butir + ' butir asli diperiksa; perusakan:');
  h.laporan.forEach(function (l) {
    console.log('  ' + (l.pasti ? '[pasti ]' : '[mungkin]') + ' ' + l.nama + ': ditolak ' + l.tolak + ' dari ' + l.coba + (l.lolos.length && !l.pasti ? ' (lolos ' + l.lolos.length + ')' : ''));
  });
  if (h.gagal.length) { console.log('GAGAL: ' + h.gagal.join(' | ')); process.exitCode = 1; }
  else console.log('HASIL: semua perusakan yang pasti salah ditolak validator');
}
