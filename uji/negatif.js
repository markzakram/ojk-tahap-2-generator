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
 * dibalik, belahan ditukar, atau kode belah ketupat dibalik. Gambar pembahasan figural (tahapan
 * pola) juga dirusak: dibuang, menampilkan jawaban opsi lain, tidak dapat digambar, atau tidak
 * disebut di teks; sebagai kontrol, setiap gambar pembahasan itu digambar menjadi piksel. Begitu pula setiap jenis
 * pernyataan verbal dibuat langsung dari bank, lalu fakta, kalimat, dan pernyataannya dirusak.
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
var Verbal = require(path.join(JS, 'verbal.js'));
var Gambar = require(path.join(JS, 'gambar.js'));
var SvgRaster = require(path.join(JS, 'svgraster.js'));
var Rumus = require(path.join(JS, 'rumus.js'));

/** Perusakan yang WAJIB diuji pada setiap keluarga figural (bukan hanya yang kebetulan terambil paket). */
var WAJIB_FIGURAL = ['kunci digeser ke opsi lain', 'dua opsi bergambar sama-benar (figural)', 'figural: gambar pembahasan dibuang', 'figural: gambar pembahasan menampilkan jawaban opsi lain'];
/** Perusakan yang WAJIB diuji pada setiap jenis pernyataan verbal (dibuat langsung dari bank). */
var WAJIB_VERBAL = ['kunci digeser ke opsi lain', 'fakta verbal dibuang', 'polaritas fakta verbal dibalik', 'polaritas pernyataan verbal dibalik', 'kalimat bacaan verbal dihapus'];
/** Perusakan pembahasan yang WAJIB diuji pada setiap keluarga numerik Kemampuan Umum (cerita, tabel, grafik). */
var WAJIB_NUMERIK = ['kunci digeser ke opsi lain', 'judul bagian pembahasan numerik dihapus', 'urutan bagian pembahasan numerik ditukar', 'baris persamaan pembahasan rusak',
  'hasil pada baris persamaan pembahasan diubah', 'Kesimpulan tidak menyebut jawaban', 'huruf jawaban pada Kesimpulan digeser'];
var SUB_NUMERIK = ['cerita', 'tabel', 'grafik'];

function salin(x) { return JSON.parse(JSON.stringify(x)); }

function numerikPg(b) { return b.jenis === 'pg' && SUB_NUMERIK.indexOf(b.submateri) >= 0; }

/**
 * Baris persamaan "§ ... = <hasil>" yang ruas sebelumnya berupa hitungan angka murni tanpa satuan atau
 * variabel, jadi relasi "=" di antara keduanya pasti diperiksa validator. <hasil> berupa bilangan
 * (boleh \$, \%, perbandingan "p : q", atau pecahan \frac{p}{q}), boleh diikuti satuan \text{...} dan
 * \approx, <, >, \le, \ge. @returns {{i:number, ruas:Array, akhir:string}|null} akhir = <hasil> yang
 * angka terakhir bilangan pertamanya diganti (nilainya pasti berubah)
 */
function barisHasil(b) {
  var p = b.pembahasan || [], ekor = '((?:\\\\ \\\\text\\{[^}]*\\}(?:\\^\\{\\d+\\})?)?(?:\\s+(?:\\\\approx|<|>|\\\\le|\\\\ge)\\s.*)?)$';
  var reBil = new RegExp('^((?:\\\\\\$)?-?)(\\d[\\d.]*)((?:\\{,\\}\\d+)?(?:\\\\%)?(?:\\s*:\\s*\\d+)?)' + ekor);
  var rePecahan = new RegExp('^(-?\\\\frac\\{)(\\d+)(\\}\\{\\d+\\})' + ekor);
  var naik = function (t) { var d = Number(t.charAt(t.length - 1)); return t.slice(0, -1) + ((d + 1) % 10); };
  for (var i = p.length - 1; i >= 0; i--) {
    if (String(p[i]).indexOf('§ ') !== 0) continue;
    var ruas = p[i].slice(2).split(' = ');
    if (ruas.length < 2) continue;
    var akhir = ruas[ruas.length - 1], sebelum = ruas[ruas.length - 2];
    if (/\\quad|;/.test(akhir)) continue;
    if (!/\d/.test(sebelum) || /\\text|\\approx|\\quad|[<>;]/.test(sebelum) || /[a-zA-Z]/.test(sebelum.replace(/\\[a-zA-Z]+/g, ''))) continue;
    var m = reBil.exec(akhir) || rePecahan.exec(akhir);
    if (!m) continue;
    return { i: i, ruas: ruas, akhir: m[1] + naik(m[2]) + m[3] + m[4] };
  }
  return null;
}

/** Petakan setiap titik sebuah bentuk figural (deret berputar) dengan f([x, y]) -> [x, y]. */
function petakanFig(fig, f) {
  fig.unsur.forEach(function (u) {
    if (u.jenis === 'bulat') u.pusat = f(u.pusat);
    else u.titik = u.titik.map(f);
  });
}

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
    // alasan pengecoh numerik kembali ke kalimat umum lama (juga di pembahasan): bukan jalur kesalahan
    nama: 'alasan pengecoh numerik diganti kalimat umum', pasti: true,
    berlaku: function (b) { return b.jenis === 'pg' && ['cerita', 'tabel', 'grafik'].indexOf(b.submateri) >= 0; },
    terapkan: function (b) {
      b.opsi.forEach(function (o, i) {
        if (i === b.kunci || !o.alasan) return;
        var lama = o.alasan, umum = 'kurang 2 dari jawaban yang benar: salah hitung pada salah satu langkah penyelesaian';
        o.alasan = umum;
        b.pembahasan = b.pembahasan.map(function (l) { return l.split(lama).join(umum); });
      });
    }
  },
  {
    nama: 'alasan satu pengecoh numerik dihapus', pasti: true,
    berlaku: function (b) { return b.jenis === 'pg' && ['cerita', 'tabel', 'grafik'].indexOf(b.submateri) >= 0; },
    terapkan: function (b) {
      var j = (b.kunci + 1) % b.opsi.length, lama = b.opsi[j].alasan;
      b.opsi[j].alasan = null;
      b.pembahasan = b.pembahasan.filter(function (l) { return !lama || l.indexOf(lama) < 0; });
    }
  },
  {
    // panduan revisi: pembahasan soal hitungan berurutan Diketahui, Ditanyakan, Pengerjaan, Kesimpulan
    nama: 'judul bagian pembahasan numerik dihapus', pasti: true,
    berlaku: function (b) { return numerikPg(b) && b.pembahasan.indexOf('Ditanyakan') >= 0; },
    terapkan: function (b) { b.pembahasan = b.pembahasan.filter(function (l) { return l !== 'Ditanyakan'; }); }
  },
  {
    nama: 'urutan bagian pembahasan numerik ditukar', pasti: true,
    berlaku: function (b) { return numerikPg(b) && b.pembahasan.indexOf('Diketahui') >= 0 && b.pembahasan.indexOf('Pengerjaan') >= 0; },
    terapkan: function (b) {
      var i = b.pembahasan.indexOf('Diketahui'), j = b.pembahasan.indexOf('Pengerjaan');
      b.pembahasan[i] = 'Pengerjaan'; b.pembahasan[j] = 'Diketahui';
    }
  },
  {
    // baris persamaan yang tidak dapat dicetak sebagai Equation Word (kurung kurawal tidak seimbang)
    nama: 'baris persamaan pembahasan rusak', pasti: true,
    berlaku: function (b) { return numerikPg(b) && b.pembahasan.some(function (l) { return l.indexOf('§ ') === 0; }); },
    terapkan: function (b) {
      var i = b.pembahasan.findIndex(function (l) { return l.indexOf('§ ') === 0; });
      b.pembahasan[i] += ' + \\frac{1}{';
    }
  },
  {
    // hasil hitungan pada pembahasan diubah satu angka: "=" harus tepat (validator menghitung ulang setiap relasi)
    nama: 'hasil pada baris persamaan pembahasan diubah', pasti: true,
    berlaku: function (b) { return numerikPg(b) && barisHasil(b) !== null; },
    terapkan: function (b) {
      var h = barisHasil(b);
      h.ruas[h.ruas.length - 1] = h.akhir;
      b.pembahasan[h.i] = '§ ' + h.ruas.join(' = ');
    }
  },
  {
    nama: 'Kesimpulan tidak menyebut jawaban', pasti: true,
    berlaku: function (b) { return numerikPg(b) && b.pembahasan.indexOf('Kesimpulan') >= 0; },
    terapkan: function (b) {
      var i = b.pembahasan.indexOf('Kesimpulan');
      b.pembahasan = b.pembahasan.slice(0, i + 1).concat(['Jadi, jawabannya sudah diperoleh.'], b.pembahasan.slice(i + 1).filter(function (l) { return /^Jawaban: /.test(l); }));
    }
  },
  {
    nama: 'huruf jawaban pada Kesimpulan digeser', pasti: true,
    berlaku: function (b) { return numerikPg(b) && b.pembahasan.some(function (l) { return /^(?!Jawaban: ).*Jawaban: [A-E]\b/.test(l); }); },
    terapkan: function (b) {
      var lain = 'ABCDE'.charAt((b.kunci + 1) % 5);
      b.pembahasan = b.pembahasan.map(function (l) { return /^Jawaban: /.test(l) ? l : l.replace(/Jawaban: [A-E]\b/, 'Jawaban: ' + lain); });
    }
  },
  {
    // panduan revisi: soal uang memakai dolar; simbol $ yang diganti £ harus ditolak
    nama: 'dolar diganti pound pada soal numerik', pasti: true,
    berlaku: function (b) { return numerikPg(b) && /\$/.test(JSON.stringify([b.stimulus, b.pertanyaan, b.opsi.map(function (o) { return o.teks; })])); },
    terapkan: function (b) {
      var ganti = function (t) { return String(t).replace(/\$/g, '£'); };
      b.stimulus.teks = (b.stimulus.teks || []).map(ganti);
      b.pertanyaan = ganti(b.pertanyaan);
      b.opsi.forEach(function (o) { o.teks = ganti(o.teks); });
      (b.stimulus.gambar || []).forEach(function (g) { g.model = JSON.parse(ganti(JSON.stringify(g.model))); g.judul = ganti(g.judul || ''); });
    }
  },
  {
    // angka baru yang tercatat sebagai data tetapi tidak dipakai rumus mana pun: harus ditolak sebagai angka tak perlu
    nama: 'angka data yang tidak diperlukan ditambahkan ke soal', pasti: true,
    berlaku: function (b) { return b.jenis === 'pg' && ['cerita', 'tabel', 'grafik'].indexOf(b.submateri) >= 0 && !(b.model.jenisHitung) && b.model.param; },
    terapkan: function (b) {
      b.model.param.cadangan = '9967'; b.model.tampil = Object.assign({}, b.model.tampil, { cadangan: '9.967' });
      b.stimulus.teks = (b.stimulus.teks || []).concat(['Sebanyak 9.967 lembar formulir cadangan juga tersedia.']);
    }
  },
  {
    // temuan QC paket 2824819757 no. 8: persamaan menjadi baut = mur + paku dan informasi kedua langsung memberi
    // mur + paku = 7, sehingga "mur = 5 ons" tidak diperlukan. Kuncinya benar, tetapi soal seperti ini harus ditolak.
    nama: 'aljabar berat: angka yang diketahui tercoret sendiri (temuan QC no. 8)', pasti: true,
    berlaku: function (b) { return b.jenis === 'pg' && b.submateri === 'cerita'; },
    terapkan: function (b) {
      var nilai = [2, 5, 6, 7, 8], kunci = 3;
      b.keluarga = 'aljabar-berat';
      b.stimulus.teks = ['Dua kotak baut, tiga kotak mur, dan tiga kotak paku memiliki berat yang sama dengan tiga kotak baut, dua kotak mur, dan dua kotak paku.'];
      b.pertanyaan = 'Jika satu kotak mur dan satu kotak paku memiliki berat 7 ons, sedangkan satu kotak mur memiliki berat 5 ons, berapa berat satu kotak baut?';
      b.langkah = [{ nama: 'o', rumus: '(S-bs*j)/cs' }, { nama: 'jawab', rumus: '-((b1-b2)*j+(c1-c2)*o)/(a1-a2)' },
        { nama: 'kiri', rumus: 'a1*jawab+b1*j+c1*o' }, { nama: 'kanan', rumus: 'a2*jawab+b2*j+c2*o' }];
      b.model = { param: { a1: '2', b1: '3', c1: '3', a2: '3', b2: '2', c2: '2', bs: '1', cs: '1', S: '7', j: '5' }, tampil: { S: '7', j: '5' },
        toleransi: 1e-9, seimbang: ['kiri', 'kanan'], kata: { a1: 2, b1: 3, c1: 3, a2: 3, b2: 2, c2: 2, bs: 1, cs: 1 } };
      b.opsi = nilai.map(function (v, i) {
        return { huruf: 'ABCDE'.charAt(i), teks: v + ' ons', nilai: v, gambar: null, alasan: i === kunci ? null : 'jalur uji yang menghasilkan pilihan ini: hasil = ' + v + ' ons' };
      });
      b.kunci = kunci;
      b.pembahasan = ['Persamaan menjadi g = j + o = 7.', 'Pilihan lain yang menjebak:'].concat(b.opsi.filter(function (o) { return o.alasan; }).map(function (o) { return '• ' + o.huruf + ' (' + o.teks + '): ' + o.alasan + '.'; })).concat(['Jawaban: D (7 ons)']);
    }
  },
  {
    nama: 'angka tak tercatat disisipkan ke soal', pasti: true,
    berlaku: function (b) { return b.jenis === 'pg' && ['cerita', 'tabel', 'grafik'].indexOf(b.submateri) >= 0; },
    terapkan: function (b) { b.stimulus.teks = (b.stimulus.teks || []).concat(['Data ini dikumpulkan oleh 9.973 petugas.']); }
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
    // celah paket QC P001 nomor 15: kejadian dihitung di kunci tetapi kalimatnya tidak ada di soal
    nama: 'kalimat kejadian line graph dihapus dari soal', pasti: true,
    berlaku: function (b) { return b.jenis === 'isian' && b.isian.jenis === 'garis' && (b.model.peristiwa || []).length > 0; },
    terapkan: function (b) {
      b.model.peristiwa.forEach(function (e) {
        b.stimulus.teks = b.stimulus.teks.map(function (t) { return t.split(/(?<=\.)\s+/).filter(function (s) { return s.indexOf(e.waktu) < 0; }).join(' '); });
      });
    }
  },
  {
    nama: 'kejadian line graph ditanam sebagai bilangan di rumus', pasti: true,
    berlaku: function (b) { return b.jenis === 'isian' && b.isian.jenis === 'garis' && (b.model.peristiwa || []).length > 0; },
    terapkan: function (b) {
      b.model.peristiwa.forEach(function (e) {
        var v = b.model.param[e.param];
        b.langkah.forEach(function (l) { l.rumus = l.rumus.split(e.param).join('(' + v + ')'); });
        delete b.model.param[e.param]; delete b.model.tampil[e.param];
      });
      b.model.peristiwa = [];
    }
  },
  {
    nama: 'isi satu kotak keterangan pie dikosongkan', pasti: true,
    berlaku: function (b) { return b.jenis === 'isian' && b.isian.jenis === 'pie'; },
    terapkan: function (b) { var k = b.stimulus.kartu.filter(function (x) { return x.teks; })[0]; k.teks = ''; }
  },
  {
    nama: 'warna dua kotak keterangan pie ditukar', pasti: true,
    berlaku: function (b) { return b.jenis === 'isian' && b.isian.jenis === 'pie'; },
    terapkan: function (b) { var k = b.stimulus.kartu, w = k[0].warna; k[0].warna = k[1].warna; k[1].warna = w; }
  },
  {
    nama: 'sumbu line graph terlalu rinci untuk digeser', pasti: true,
    berlaku: function (b) { return b.jenis === 'isian' && b.isian.jenis === 'garis'; },
    terapkan: function (b) { b.model.snap = 1; b.isian.kontrol[0].langkah = 1; b.model.maks = b.model.min + 1000 * Math.max(1, Math.ceil((b.model.maks - b.model.min) / 1000)); }
  },
  // ---- pembahasan interaktif (panduan revisi paket-002): bagian berurutan, persamaan "§", Kesimpulan, USD
  {
    nama: 'persamaan pembahasan interaktif tidak dapat diurai', pasti: true,
    berlaku: function (b) { return b.jenis === 'isian' && b.pembahasan.some(Rumus.adalah); },
    terapkan: function (b) { var i = b.pembahasan.findIndex(Rumus.adalah); b.pembahasan[i] += ' \\frac{1}'; }
  },
  {
    // hitungan tetap ada, tetapi sebagai teks biasa ("$100.000 × 1,5 = $150.000"), bukan Equation
    nama: 'persamaan pembahasan interaktif ditulis sebagai teks biasa', pasti: true,
    berlaku: function (b) { return b.jenis === 'isian' && b.pembahasan.some(Rumus.adalah); },
    terapkan: function (b) { b.pembahasan = b.pembahasan.map(function (t) { return Rumus.barisTeks(t); }); }
  },
  {
    nama: 'judul bagian pembahasan interaktif tidak berurutan', pasti: true,
    berlaku: function (b) { return b.jenis === 'isian' && b.pembahasan.indexOf('Ditanyakan') >= 0 && b.pembahasan.indexOf('Pengerjaan') >= 0; },
    terapkan: function (b) { var i = b.pembahasan.indexOf('Ditanyakan'), j = b.pembahasan.indexOf('Pengerjaan'); b.pembahasan[i] = 'Pengerjaan'; b.pembahasan[j] = 'Ditanyakan'; }
  },
  {
    nama: 'judul Kesimpulan pembahasan interaktif dihapus', pasti: true,
    berlaku: function (b) { return b.jenis === 'isian' && b.pembahasan.indexOf('Kesimpulan') >= 0; },
    terapkan: function (b) { b.pembahasan = b.pembahasan.filter(function (t) { return t !== 'Kesimpulan'; }); }
  },
  {
    nama: 'Kesimpulan interaktif tidak menyebut pengaturan akhir kontrol', pasti: true,
    berlaku: function (b) { return b.jenis === 'isian' && b.pembahasan.indexOf('Kesimpulan') >= 0; },
    terapkan: function (b) {
      var i = b.pembahasan.indexOf('Kesimpulan');
      b.pembahasan = b.pembahasan.slice(0, i + 1).concat(['Atur tampilan sesuai hasil pengerjaan di atas.'], b.pembahasan.slice(-1));
    }
  },
  {
    // celah QC paket-002: tabel interaktif masih memakai € dan £; validator membaca angkanya tanpa simbol,
    // jadi pada tabel hanya pemeriksaan mata uang yang menangkap ini
    nama: 'nominal soal interaktif memakai €, bukan USD', pasti: true,
    berlaku: function (b) { return b.jenis === 'isian' && JSON.stringify(b.stimulus).indexOf('$') >= 0; },
    terapkan: function (b) { b.stimulus = JSON.parse(JSON.stringify(b.stimulus).split('$').join('€')); b.kunciTeks = String(b.kunciTeks).split('$').join('€'); }
  },
  {
    nama: 'nominal soal interaktif memakai £, bukan USD', pasti: true,
    berlaku: function (b) { return b.jenis === 'isian' && JSON.stringify(b.stimulus).indexOf('$') >= 0; },
    terapkan: function (b) { b.stimulus = JSON.parse(JSON.stringify(b.stimulus).split('$').join('£')); b.kunciTeks = String(b.kunciTeks).split('$').join('£'); }
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
    // "tidak semua" <-> "semua", teori <-> terbukti, perlu <-> cukup, urutan dan perbandingan ditukar,
    // batas "paling lambat" <-> "paling cepat", arah temuan dibalik) sementara kalimatnya tetap:
    // validator harus melihat bahwa kalimat dan faktanya tidak cocok lagi
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
        else if (f.tipe === 'batas') f.jenis = f.jenis === 'lambat' ? 'cepat' : 'lambat';
        else if (f.tipe === 'temuan') f.arah = f.arah === 'naik' ? 'turun' : 'naik';
      });
    }
  },
  {
    // model pernyataan dibalik (polaritas, arah, kuantor, status, jenis kepastian, urutan, lingkup)
    // sementara kalimatnya tetap: validator harus menolak karena kalimat tidak cocok lagi dengan
    // modelnya atau karena kebenaran yang diturunkan tidak lagi sama dengan kunci
    nama: 'polaritas pernyataan verbal dibalik', pasti: true,
    berlaku: function (b) { return b.submateri === 'verbal' && b.model && b.model.klaim; },
    terapkan: function (b) {
      var k = b.model.klaim;
      var Q = { semua: 'tidak-semua', 'tidak-semua': 'semua', 'ada-tidak': 'ada', ada: 'ada-tidak', 'tidak-ada': 'ada', 'sebagian-besar': 'tidak-ada' };
      var ST = { terbukti: 'belum', belum: 'terbukti', mungkin: 'belum' };
      var BT = { memenuhi: 'melewati', melewati: 'memenuhi', batas: 'memenuhi' };
      if (k.tipe === 'bagian') k.ya = !k.ya;
      else if (k.tipe === 'daftar') k.termasuk = !k.termasuk;
      else if (k.tipe === 'tunggal') { k.tipe = 'daftar'; k.termasuk = true; }
      else if (k.tipe === 'sebab' || k.tipe === 'temuan') k.arah = k.arah === 'naik' ? 'turun' : 'naik';
      else if (k.tipe === 'kuantor') k.q = Q[k.q];
      else if (k.tipe === 'status') k.jenis = ST[k.jenis];
      else if (k.tipe === 'syarat') k.jenis = k.jenis === 'pasti' ? 'tidak' : 'pasti';
      else if (k.tipe === 'batas') k.jenis = BT[k.jenis];
      else if (k.tipe === 'urutan') { if (k.y) { var y = k.y; k.y = k.x; k.x = y; } else k.jenis = k.jenis === 'pertama' ? 'diterapkan' : 'pertama'; }
      else if (k.tipe === 'banding') { var a = k.a; k.a = k.b; k.b = a; }
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
    // kode peralihan (kotak 3) dibalik: bagian yang diatur belah ketupat itu tidak lagi cocok dengan kode mana pun
    nama: 'kotak ganda: satu belah ketupat kode peralihan dibalik', pasti: true,
    berlaku: function (b) { return b.submateri === 'figural' && b.model.tipe === 'serial-ganda'; },
    terapkan: function (b) {
      var j = Math.max(0, b.model.kotak[2].bawah.indexOf(1));
      [b.stimulus.gambar[0].model.kotak, b.model.kotak].forEach(function (k) { k[2].bawah[j] = 1 - k[2].bawah[j]; });
    }
  },
  {
    nama: 'matriks 5x5: dua kotak potongan kunci ditukar', pasti: true,
    berlaku: function (b) { return b.submateri === 'figural' && b.model.tipe === 'matriks-latin'; },
    terapkan: function (b) {
      // dua kotak sebaris atau sekolom pasti berbeda bentuk (kotak berseberangan pada siku bisa sama)
      var p = b.model.pilihan[b.kunci], sel = [];
      p.forEach(function (row, i) { row.forEach(function (v, j) { if (v !== null) sel.push([i, j]); }); });
      var x = sel[0], y = sel.filter(function (s) { return s !== x && (s[0] === x[0] || s[1] === x[1]); })[0], t = p[x[0]][x[1]];
      p[x[0]][x[1]] = p[y[0]][y[1]]; p[y[0]][y[1]] = t;
      b.opsi[b.kunci].gambar.model.isi = salin(p);
    }
  },
  {
    // satu kotak tampak dibuat melanggar hubungan yang diujikan (sambungan jenis yang dihitung ditambah/dikurangi)
    nama: 'matriks simbol-sambungan: hubungan pada satu kotak tampak dirusak', pasti: true,
    berlaku: function (b) { return b.submateri === 'figural' && b.model.tipe === 'matriks-sambung'; },
    terapkan: function (b) {
      var aturan = String(b.model.aturan).split(',')[0], tegak = /=tegak$/.test(aturan);
      [b.stimulus.gambar[0].model.grid, b.model.grid].forEach(function (g) {
        var x = g[b.model.mr === 0 ? 1 : 0][b.model.mc], arr = tegak ? x.v : x.h, i = arr.indexOf(tegak ? 0 : 1);
        if (i < 0) i = arr.indexOf(tegak ? 1 : 0);
        arr[i] = 1 - arr[i];
      });
    }
  },
  {
    nama: 'matriks simbol-sambungan: satu sambungan kotak kunci ditambah atau dibuang', pasti: true,
    berlaku: function (b) { return b.submateri === 'figural' && b.model.tipe === 'matriks-sambung'; },
    terapkan: function (b) {
      var aturan = String(b.model.aturan).split(',')[0], x = b.model.pilihan[b.kunci], arr = /=tegak$/.test(aturan) ? x.v : x.h;
      var i = arr.indexOf(0) >= 0 ? arr.indexOf(0) : arr.indexOf(1);
      arr[i] = 1 - arr[i];
      b.opsi[b.kunci].gambar.model.cell = salin(x);
    }
  },
  {
    nama: 'deret berputar: kotak keempat diputar 90 derajat lagi', pasti: true,
    berlaku: function (b) { return b.submateri === 'figural' && b.model.tipe === 'serial-putar'; },
    terapkan: function (b) {
      [b.stimulus.gambar[0].model.deret, b.model.deret].forEach(function (d) { petakanFig(d[3], function (p) { return [-p[1], p[0]]; }); });
    }
  },
  {
    nama: 'deret berputar: letak gambar kotak keempat digeser', pasti: true,
    berlaku: function (b) { return b.submateri === 'figural' && b.model.tipe === 'serial-putar'; },
    terapkan: function (b) {
      [b.stimulus.gambar[0].model.deret, b.model.deret].forEach(function (d) { petakanFig(d[3], function (p) { return [p[0] + 7, p[1] + 3]; }); });
    }
  },
  {
    nama: 'deret berputar: isi titik penanda kotak keempat dibalik', pasti: true,
    berlaku: function (b) { return b.submateri === 'figural' && b.model.tipe === 'serial-putar' && b.model.deret[3].unsur.some(function (u) { return u.nama === 'penanda deret'; }); },
    terapkan: function (b) {
      [b.stimulus.gambar[0].model.deret, b.model.deret].forEach(function (d) {
        d[3].unsur.forEach(function (u) { if (u.nama === 'penanda deret') u.isi = u.isi ? null : '#111'; });
      });
    }
  },
  {
    nama: 'figural: gambar pembahasan dibuang', pasti: true,
    berlaku: function (b) { return b.submateri === 'figural'; },
    terapkan: function (b) { b.gambarPembahasan = []; }
  },
  {
    // gambar tahapan pola yang memperlihatkan jawaban harus sama dengan gambar opsi kunci
    nama: 'figural: gambar pembahasan menampilkan jawaban opsi lain', pasti: true,
    berlaku: function (b) { return b.submateri === 'figural' && (b.gambarPembahasan || []).some(function (d) { return d.model && d.model.jawaban !== undefined; }); },
    terapkan: function (b) {
      var m = b.opsi[(b.kunci + 1) % b.opsi.length].gambar.model, lain = m.fig || m.cell || m.isi || m.atas;
      b.gambarPembahasan.filter(function (d) { return d.model && d.model.jawaban !== undefined; })[0].model.jawaban = salin(lain);
    }
  },
  {
    nama: 'figural: gambar pembahasan tidak dapat digambar', pasti: true,
    berlaku: function (b) { return b.submateri === 'figural' && (b.gambarPembahasan || []).length > 0; },
    terapkan: function (b) { b.gambarPembahasan[b.gambarPembahasan.length - 1].jenis = 'tidak-dikenal'; }
  },
  {
    nama: 'figural: gambar pembahasan tidak disebut di teks', pasti: true,
    berlaku: function (b) { return b.submateri === 'figural' && (b.gambarPembahasan || []).length > 0; },
    terapkan: function (b) {
      var n = b.gambarPembahasan.length;
      b.pembahasan = b.pembahasan.map(function (t) { return String(t).split('Gambar ' + n).join('Ilustrasi'); });
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

  // tiap keluarga numerik Kemampuan Umum (cerita, tabel, grafik) yang aktif, pada setiap tingkat yang diizinkan,
  // dibuat langsung dari bank supaya perusakan pembahasan pasti mengenai semuanya
  var famNumerik = [];
  SUB_NUMERIK.forEach(function (sub) {
    Bank.ambil('ku', sub).keluarga.forEach(function (k, fi) {
      famNumerik.push(k.id);
      k.tingkat.forEach(function (lv, li) {
        var b = null;
        for (var coba = 0; coba < 20 && !b; coba++) b = Bank.buat('ku', sub, fi, lv, Rng.turunan(benih, 'negatif-numerik', k.id, lv, coba), { target: (li + fi) % 5 });
        if (!b) { gagal.push('keluarga ' + k.id + ' tingkat ' + lv + ' gagal disusun untuk uji negatif'); return; }
        b.id = 'NEG-N-' + k.id + '-' + lv; b.no = 1; b.paket = 0;
        butir.push(b);
      });
    });
  });

  // tiap jenis pernyataan verbal dibuat langsung dari bank supaya perusakan verbal pasti mengenai semuanya
  var jenisVerbal = Verbal.JENIS.map(function (j) { return j.id; });
  Verbal.JENIS.forEach(function (j) {
    var b = Bank.buat('ku', 'verbal', 0, j.level, Rng.turunan(benih, 'negatif-verbal', j.id), { target: ['B', 'S', 'TD'].indexOf(j.truth), jenis: j.id });
    if (!b) { gagal.push('jenis verbal ' + j.id + ' gagal disusun untuk uji negatif'); return; }
    b.id = 'NEG-V-' + j.id; b.no = 1; b.paket = 0;
    butir.push(b);
  });

  // butir asli harus lulus (kontrol)
  var asliGagal = butir.filter(function (b) { return !Validator.periksaButir(b).lulus; });
  if (asliGagal.length) gagal.push('butir asli yang tidak lulus: ' + asliGagal.length + ' (mis. ' + asliGagal.slice(0, 3).map(function (b) { return b.id; }).join(', ') + ')');

  // kontrol: setiap gambar pembahasan figural (tiap keluarga, tiap tingkat) tergambar menjadi piksel
  // oleh penggambar Node yang dipakai PNG, Word, dan PDF, dan tidak kosong
  var gambarPem = 0, gambarRusak = [];
  butir.forEach(function (b) {
    if (b.submateri !== 'figural' || String(b.id).indexOf('NEG-') !== 0) return;
    (b.gambarPembahasan || []).forEach(function (d) {
      gambarPem++;
      try {
        var px = SvgRaster.gambar(Gambar.svg(d).svg, 1), tinta = 0;
        for (var i = 0; i < px.data.length; i++) if (px.data[i] < 128) tinta++;
        if (tinta < 50) gambarRusak.push(b.id + '/' + d.id + ' kosong');
      } catch (e) { gambarRusak.push(b.id + '/' + d.id + ': ' + e.message); }
    });
  });
  laporan.push({ nama: 'kontrol: gambar pembahasan figural tergambar menjadi piksel (' + gambarPem + ' gambar)', pasti: true, coba: gambarPem, tolak: gambarPem - gambarRusak.length, lolos: [] });
  if (!gambarPem || gambarRusak.length) gagal.push('gambar pembahasan figural gagal digambar: ' + (gambarRusak.slice(0, 3).join('; ') || 'tidak ada gambar'));

  var diujiPer = {};
  MUTASI.forEach(function (m) {
    var coba = 0, tolak = 0, lolos = [], per = diujiPer[m.nama] = {};
    butir.forEach(function (b) {
      if (!m.berlaku(b)) return;
      coba++;
      if (b.submateri === 'figural') per[b.keluarga] = (per[b.keluarga] || 0) + 1;
      if (numerikPg(b)) per['numerik:' + b.keluarga] = (per['numerik:' + b.keluarga] || 0) + 1;
      if (b.submateri === 'verbal') per['verbal:' + b.model.tipeKlaim] = (per['verbal:' + b.model.tipeKlaim] || 0) + 1;
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
  // setiap keluarga numerik Kemampuan Umum harus terkena perusakan pembahasan wajib
  WAJIB_NUMERIK.forEach(function (nama) {
    var per = diujiPer[nama] || {}, kurang = famNumerik.filter(function (id) { return !(per['numerik:' + id] >= 1); });
    laporan.push({ nama: '"' + nama + '" mencakup setiap keluarga numerik (' + famNumerik.length + ' keluarga)', pasti: true, coba: famNumerik.length, tolak: famNumerik.length - kurang.length, lolos: [] });
    if (kurang.length) gagal.push('"' + nama + '" belum diuji pada keluarga: ' + kurang.join(', '));
  });
  // setiap jenis pernyataan verbal harus terkena perusakan verbal wajib
  WAJIB_VERBAL.forEach(function (nama) {
    var per = diujiPer[nama] || {}, kurang = jenisVerbal.filter(function (id) { return !(per['verbal:' + id] >= 1); });
    laporan.push({ nama: '"' + nama + '" mencakup setiap jenis pernyataan verbal (' + jenisVerbal.length + ' jenis)', pasti: true, coba: jenisVerbal.length, tolak: jenisVerbal.length - kurang.length, lolos: [] });
    if (kurang.length) gagal.push('"' + nama + '" belum diuji pada jenis verbal: ' + kurang.join(', '));
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
