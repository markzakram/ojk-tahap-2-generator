/*
 * pn-garis.js — Penalaran Numerik > Line Graph.
 *
 * Lima titik (bulan atau hari) berjajar di bawah sumbu; peserta menggesernya ke
 * nilai yang benar lalu garisnya tersambung. Nilai tiap titik dihitung dari
 * keterangan soal:
 *
 *   nilai[k] = awal + k * langkah + jumlah peristiwa sekali-jadi sampai titik k
 *
 * dengan `langkah` berupa nominal tetap atau persen dari nilai awal. Semua nilai
 * kunci jatuh pada kelipatan langkah geser titik, dan berada di dalam rentang
 * sumbu yang tergambar.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./rng.js'), require('./format.js'), require('./butir.js'));
    module.exports = api;
  } else {
    api = factory(root.Rng, root.Fmt, root.Butir);
    root.PnGaris = api;
  }
})(typeof self !== 'undefined' ? self : this, function (Rng, Fmt, Butir) {
  'use strict';

  var HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
  var HARI_KERJA = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum'];
  var BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  /** Langkah garis bantu yang rapi untuk rentang sebesar `rentang`. */
  function langkahRapi(rentang, bagian) {
    var kasar = rentang / bagian, p = Math.pow(10, Math.floor(Math.log10(kasar)));
    var n = kasar / p;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
  }

  var FRAME = [
    { id: 'cakupan', judul: 'Area Cakupan', mode: 'bulan-mulai-sebelum', sat: 'mil persegi', sym: '', judulY: 'Area cakupan (mil persegi)',
      intro: function (p) { return 'Pada bulan ' + p.namaAwal + ', sebuah perusahaan telepon seluler memiliki area cakupan seluas ' + Fmt.angka(p.v0) + ' mil persegi. Perusahaan tersebut berencana ' + (p.d > 0 ? 'memperluas' : 'mengurangi') + ' area cakupan sebesar ' + Fmt.angka(Math.abs(p.d)) + ' mil persegi per bulan.'; },
      tanya: 'Gambarkan area cakupan (dalam mil persegi) untuk setiap bulan.', v0: [3000, 9000, 250], d: [100, 500, 50] },
    { id: 'saham', judul: 'Nilai Rekening Saham', mode: 'hari-awal-termasuk', sat: '', sym: '$', judulY: 'Nilai rekening ($)',
      intro: function (p) { return 'Seorang investor menanamkan ' + Fmt.uang(p.v0, '$', 0) + ' pada hari Senin. Setiap hari setelahnya, nilai saham ' + (p.d > 0 ? 'meningkat' : 'menurun') + ' sebesar ' + p.persen + '% dari nilai awalnya.' + p.peristiwaTeks; },
      tanya: 'Gambarkan nilai rekening saham pada akhir setiap hari.', v0: [1000, 5000, 500], d: [0, 0, 0], persen: true },
    { id: 'stok', judul: 'Persediaan Barang di Gudang', mode: 'hari-awal-termasuk', sat: 'unit', sym: '', judulY: 'Stok (unit)',
      intro: function (p) { return 'Pada hari Senin, gudang memiliki stok awal ' + Fmt.angka(p.v0) + ' unit barang. Setiap hari setelahnya, ' + (p.d < 0 ? 'terjual ' : 'masuk ') + Fmt.angka(Math.abs(p.d)) + ' unit.' + p.peristiwaTeks; },
      tanya: 'Gambarkan stok barang pada akhir setiap hari.', v0: [400, 1200, 100], d: [20, 120, 10], negatif: true },
    { id: 'tabungan', judul: 'Saldo Tabungan', mode: 'bulan-awal-termasuk', sat: '', sym: '$', judulY: 'Saldo ($)',
      intro: function (p) { return 'Pada bulan ' + p.namaAwal + ', saldo tabungan ' + Fmt.uang(p.v0, '$', 0) + '. Setiap bulan setelahnya, saldo ' + (p.d > 0 ? 'bertambah ' : 'berkurang ') + Fmt.uang(Math.abs(p.d), '$', 0) + ' karena setoran dan pengeluaran rutin.' + p.peristiwaTeks; },
      tanya: 'Gambarkan saldo tabungan pada akhir setiap bulan.', v0: [1000, 4000, 250], d: [100, 400, 50] },
    { id: 'suhu', judul: 'Suhu Ruang Pendingin', mode: 'jam-awal-termasuk', sat: '°C', sym: '', judulY: 'Suhu (°C)',
      intro: function (p) { return 'Pada pukul ' + p.jamAwal + ', suhu ruang pendingin adalah ' + p.v0 + '°C. Setiap jam setelahnya, suhu ' + (p.d > 0 ? 'naik ' : 'turun ') + Math.abs(p.d) + '°C.' + p.peristiwaTeks; },
      tanya: 'Gambarkan suhu ruang pendingin pada setiap jam.', v0: [4, 20, 1], d: [1, 4, 1] }
  ];

  function nilaiSeq(p) {
    var v = [];
    for (var k = 0; k < 5; k++) {
      var nil = p.v0 + p.dAwal * (p.mode.indexOf('sebelum') >= 0 ? k + 1 : k);
      p.peristiwa.forEach(function (e) { if (k >= e.ke) nil += e.jumlah; });
      v.push(nil);
    }
    return v;
  }

  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a; }

  function buat(id, level, benih) {
    var a = Rng.alat(benih);
    var fi = a.bulat(0, FRAME.length - 1), f = FRAME[fi];
    var sebelum = f.mode.indexOf('sebelum') >= 0;
    for (var coba = 0; coba < 2000; coba++) {
      var v0 = a.kelipatan(f.v0[0], f.v0[1], f.v0[2]);
      var arah = a.pilih(f.negatif ? [-1, -1, 1] : [1, 1, -1]);
      var persen = null, harian;
      if (f.persen) { persen = a.pilih([1, 2, 5]); harian = v0 * persen / 100; }
      else harian = a.kelipatan(f.d[0], f.d[1], f.d[2]);
      var dAwal = arah * harian;
      // peristiwa sekali-jadi: besar = kelipatan perubahan harian, atau kelipatan 10 untuk persen
      var jmlPeristiwa = level === 'mudah' ? 0 : (level === 'sedang' ? 1 : 2);
      var peristiwa = [];
      for (var e = 0; e < jmlPeristiwa; e++) {
        var ke = a.bulat(1, 3);
        if (peristiwa.some(function (x) { return x.ke === ke; })) continue;
        var besar = f.persen ? harian * a.bulat(1, 2) : harian * a.bulat(1, 3);
        var tanda = f.negatif ? (a.untung(0.7) ? 1 : -1) : a.pilih([-1, 1]);
        peristiwa.push({ ke: ke, jumlah: tanda * besar });
      }
      peristiwa.sort(function (x, y) { return x.ke - y.ke; });

      var label, namaAwal = null, jamAwal = null;
      if (f.mode.indexOf('hari') === 0) label = HARI.slice();
      else if (f.mode.indexOf('jam') === 0) {
        var j0 = a.bulat(6, 12); jamAwal = (j0 < 10 ? '0' : '') + j0 + '.00'; label = [];
        for (var h = 0; h < 5; h++) label.push(((j0 + h) < 10 ? '0' : '') + (j0 + h) + '.00');
      } else {
        var m0 = a.bulat(0, 6); namaAwal = Fmt.BULAN[m0]; label = [];
        for (var b = 0; b < 5; b++) label.push(BULAN[(m0 + b + (sebelum ? 1 : 0)) % 12]);
      }
      var p = { v0: v0, d: dAwal, dAwal: dAwal, persen: persen, peristiwa: peristiwa, mode: f.mode, namaAwal: namaAwal, jamAwal: jamAwal };
      p.peristiwaTeks = peristiwa.map(function (ev) {
        var waktu = f.mode.indexOf('hari') === 0 ? 'hari ' + HARI[ev.ke] : (f.mode.indexOf('jam') === 0 ? 'pukul ' + label[ev.ke] : 'bulan ' + Fmt.BULAN[(BULAN.indexOf(label[ev.ke]))]);
        if (f.id === 'saham') return ' Pada ' + waktu + ', ' + (ev.jumlah > 0 ? 'ia menerima dividen sebesar ' : 'ia dikenai biaya administrasi sebesar ') + Fmt.uang(Math.abs(ev.jumlah), '$', 0) + '.';
        if (f.id === 'stok') return ' Pada ' + waktu + ', ' + (ev.jumlah > 0 ? 'tiba kiriman tambahan sebanyak ' : 'terjadi retur dan kerusakan sebanyak ') + Fmt.angka(Math.abs(ev.jumlah)) + ' unit.';
        if (f.id === 'tabungan') return ' Pada ' + waktu + ', ' + (ev.jumlah > 0 ? 'ada setoran tambahan sebesar ' : 'ada penarikan sebesar ') + Fmt.uang(Math.abs(ev.jumlah), '$', 0) + '.';
        if (f.id === 'suhu') return ' Pada ' + waktu + ', ' + (ev.jumlah > 0 ? 'pintu dibuka sehingga suhu naik tambahan ' : 'pendingin tambahan dinyalakan sehingga suhu turun tambahan ') + Math.abs(ev.jumlah) + '°C.';
        return ' Pada ' + waktu + ', ' + (ev.jumlah > 0 ? 'ada penambahan ' : 'ada pengurangan ') + Fmt.angka(Math.abs(ev.jumlah)) + ' ' + f.sat + '.';
      }).join('');

      var vals = nilaiSeq(p);
      if (vals.some(function (x) { return !(x > 0) || !Number.isInteger(x); })) continue;
      var mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals);
      if (mx === mn) continue;
      var rentang = mx - mn;
      var g = langkahRapi(rentang * 1.6, 5);
      var lo = Math.floor((mn - rentang * 0.25) / g) * g, hi = Math.ceil((mx + rentang * 0.25) / g) * g;
      if (lo < 0) lo = 0;
      if (hi - lo < g * 3 || (hi - lo) / g > 8) continue;
      var snap = vals.reduce(function (s, x) { return gcd(s, x); }, 0);
      snap = gcd(snap, Math.round(lo)); snap = gcd(snap, Math.round(hi));
      while (snap > g / 2 && snap % 2 === 0) snap /= 2;
      if (snap < 1 || snap > g) continue;

      var model = { kategori: label, min: lo, maks: hi, langkah: g, awalan: f.sym, akhiran: f.sat === '°C' ? '°' : '', desimal: 2, judulY: f.judulY, judulX: '' };
      var awal = { nilai: [null, null, null, null, null] };
      var kunci = { nilai: vals };
      var satuanTeks = f.sat === '°C' ? '°C' : '';
      var kunciTeks = label.map(function (l, k) { return l + ' ' + (f.sym || '') + Fmt.angka(vals[k]) + satuanTeks; }).join('; ') + '.';
      var intro = f.intro(p);
      var param = { v0: String(v0), d: String(dAwal) }, tampil = { v0: Fmt.angka(v0) };
      if (persen) { param.persen = String(persen); param.arah = String(arah); tampil.persen = persen + '%'; }
      else { param.dm = String(harian); tampil.dm = Fmt.angka(harian); }
      var steps = [];
      var mulai = sebelum ? 1 : 0;
      for (var k = 0; k < 5; k++) {
        var evSum = peristiwa.filter(function (x) { return k >= x.ke; }).map(function (x) { return '(' + x.jumlah + ')'; });
        steps.push({ nama: 'n' + k, rumus: 'v0+' + (k + mulai) + '*' + (persen ? '(v0*persen/100*arah)' : 'd') + (evSum.length ? '+' + evSum.join('+') : '') });
      }
      var pem = [];
      pem.push('Nilai awal = ' + (f.sym || '') + Fmt.angka(v0) + (satuanTeks || (f.sat && !f.sym ? ' ' + f.sat : '')) + (persen ? '. Perubahan harian = ' + persen + '% × ' + Fmt.angka(v0) + ' = ' + Fmt.angka(harian) + '.' : '. Perubahan tiap titik = ' + (dAwal > 0 ? '+' : '-') + Fmt.angka(harian) + '.'));
      for (var kk = 0; kk < 5; kk++) {
        var ev2 = peristiwa.filter(function (x) { return x.ke === kk; })[0];
        var uraian;
        if (kk === 0 && !sebelum) uraian = 'nilai awal ' + Fmt.angka(vals[0]);
        else {
          var asal = kk === 0 ? v0 : vals[kk - 1];
          uraian = Fmt.angka(asal) + (dAwal >= 0 ? ' + ' : ' - ') + Fmt.angka(harian) + (ev2 ? (ev2.jumlah > 0 ? ' + ' : ' - ') + Fmt.angka(Math.abs(ev2.jumlah)) : '') + ' = ' + Fmt.angka(vals[kk]);
        }
        pem.push('• ' + label[kk] + ': ' + uraian + '.');
      }
      pem.push('Kelima titik digeser ke nilai-nilai ini sehingga garis tersambung dari ' + label[0] + ' sampai ' + label[4] + '.');
      var ctx = { submateri: 'garis', keluarga: id, level: level, benih: benih };
      return Butir.rakitIsian(ctx, {
        jenisSoal: 'Line Graph (tes interaktif)',
        judul: f.judul + ' · Line Graph', teks: [intro], pertanyaan: f.tanya,
        perintah: 'Geser tiap titik ke nilai yang benar pada sumbu vertikal.',
        gambar: [{ id: 'awal', jenis: 'garis', model: model, state: awal, judul: 'Tampilan awal' }],
        gambarPembahasan: [{ id: 'kunci', jenis: 'garis', model: Object.assign({}, model, { labelNilai: true }), state: kunci, judul: 'Kondisi akhir (kunci)' }],
        isian: { jenis: 'garis', kontrol: [{ nama: 'titik', label: 'Nilai tiap titik', min: lo, maks: hi, langkah: snap, satuan: (f.sym || '') + (f.sat || '') }], awal: awal, kunci: kunci, model: model, kategori: label },
        kunciTeks: kunciTeks, langkah: steps, pembahasan: pem,
        model: { param: param, tampil: tampil, toleransi: 1e-9, topik: 'Line Graph', kunciLangkah: { nilai: ['n0', 'n1', 'n2', 'n3', 'n4'] }, snap: snap, min: lo, maks: hi },
        sidik: { inti: 'pn-garis|' + f.id + '|' + vals.join(','), param: vals.concat([v0]), entitas: f.id + (persen || '') }
      });
    }
    return null;
  }

  var KELUARGA = [{ id: 'garis-5-titik', nama: 'Garis dengan lima titik', submateri: 'garis' }];

  return { KELUARGA: KELUARGA, buat: buat, FRAME: FRAME };
});
