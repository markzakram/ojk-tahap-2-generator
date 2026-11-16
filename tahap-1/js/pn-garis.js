/*
 * pn-garis.js — Penalaran Numerik > Line Graph.
 *
 * Lima titik (bulan, hari, atau jam) berjajar di bawah sumbu; peserta menggesernya ke
 * nilai yang benar lalu garisnya tersambung. Nilai tiap titik dihitung dari
 * keterangan soal:
 *
 *   nilai[k] = awal + (langkah ke-1..k) + jumlah kejadian sekali-jadi sampai titik k
 *
 * dengan langkah berupa nominal tetap atau persen dari nilai AWAL (seperti contoh riset
 * Area Cakupan dan Nilai Rekening Saham). Tingkat mudah: perubahan tetap saja; sedang:
 * ditambah satu kejadian sekali-jadi; sulit: laju berubah mulai titik tertentu dan ada
 * satu kejadian. Setiap kejadian dan perubahan laju TERTULIS di soal (besar dan waktunya
 * menjadi parameter yang diperiksa validator), semua nilai kunci jatuh pada kelipatan
 * langkah geser, dan rentang sumbu paling banyak POSISI_MAKS langkah geser.
 *
 * Tiga keluarga: perubahan tetap (area cakupan, saldo tabungan, suhu), persen dari nilai
 * awal (rekening saham), dan persediaan gudang.
 *
 * Pembahasan: Diketahui (nilai awal, perubahan rutin, perubahan laju, kejadian), Ditanyakan,
 * Pengerjaan (rumus umum lalu satu persamaan "§" per titik dari nilai titik sebelumnya), dan
 * Kesimpulan berupa posisi akhir kelima titik.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./rng.js'), require('./format.js'), require('./butir.js'), require('./rumus.js'));
    module.exports = api;
  } else {
    api = factory(root.Rng, root.Fmt, root.Butir, root.Rumus);
    root.PnGaris = api;
  }
})(typeof self !== 'undefined' ? self : this, function (Rng, Fmt, Butir, Rumus) {
  'use strict';

  var HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
  var BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  // titik harus dapat digeser tepat ke nilainya: rentang sumbu paling banyak sekian langkah geser
  var POSISI_MAKS = 120;
  // pemilik rekening pada bingkai saham (contoh riset: Cheryl menginvestasikan $1.000 pada hari Senin)
  var NAMA_INVESTOR = ['Cheryl', 'Dimas', 'Rina', 'Bayu', 'Sinta', 'Yusuf', 'Nadia', 'Fajar', 'Laras', 'Hendra'];

  /** Langkah garis bantu yang rapi untuk rentang sebesar `rentang`. */
  function langkahRapi(rentang, bagian) {
    var kasar = rentang / bagian, p = Math.pow(10, Math.floor(Math.log10(kasar)));
    var n = kasar / p;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
  }

  /*
   * Bingkai soal. intro(p) = kalimat keadaan awal dan perubahan rutin; laju(p, waktu) = kalimat
   * perubahan laju (tingkat sulit); kejadian(p, waktu, jumlah) = kalimat kejadian sekali-jadi.
   */
  var FRAME = [
    { id: 'cakupan', judul: 'Area Cakupan', mode: 'bulan-mulai-sebelum', sat: 'mil persegi', sym: '', judulY: 'Area cakupan (mil persegi)', riset: 'acuan',
      intro: function (p) { return 'Pada bulan ' + p.namaAwal + ', sebuah perusahaan telepon seluler memiliki area cakupan seluas ' + Fmt.angka(p.v0) + ' mil persegi. Perusahaan tersebut berencana ' + (p.d > 0 ? 'memperluas' : 'mengurangi') + ' area cakupan sebesar ' + Fmt.angka(Math.abs(p.d)) + ' mil persegi per bulan.'; },
      laju: function (p, w) { return ' Mulai ' + w + ', ' + (p.d > 0 ? 'perluasan' : 'pengurangan') + ' rutin ' + (Math.abs(p.d2) > Math.abs(p.d) ? 'dipercepat' : 'diperlambat') + ' menjadi ' + Fmt.angka(Math.abs(p.d2)) + ' mil persegi per bulan.'; },
      kejadian: function (w, j) { return ' Pada ' + w + ', ' + (j > 0 ? 'perusahaan juga mengambil alih jaringan operator lain seluas ' + Fmt.angka(j) + ' mil persegi' : 'sejumlah menara dinonaktifkan sehingga area cakupan berkurang ' + Fmt.angka(-j) + ' mil persegi di luar perubahan rutin') + '.'; },
      tanya: 'Gambarkan area cakupan (dalam mil persegi) untuk setiap bulan.', v0: [3000, 9000, 250], d: [100, 500, 50] },
    { id: 'saham', judul: 'Nilai Rekening Saham', mode: 'hari-awal-termasuk', sat: '', sym: '$', judulY: 'Nilai rekening ($)', riset: 'acuan',
      intro: function (p) { return p.nama + ' menanamkan ' + Fmt.uang(p.v0, '$', 0) + ' pada hari Senin. Setiap hari setelahnya, nilai saham ' + (p.d > 0 ? 'meningkat' : 'menurun') + ' sebesar ' + p.persen + '% dari nilai awalnya.'; },
      laju: function (p, w) { return ' Mulai ' + w + ', ' + (p.d > 0 ? 'kenaikan' : 'penurunan') + ' harian menjadi ' + p.persen2 + '% dari nilai awalnya.'; },
      kejadian: function (w, j) { return ' Pada ' + w + ', ' + (j > 0 ? 'ia menerima dividen sebesar ' : 'ia dikenai biaya administrasi sebesar ') + Fmt.uang(Math.abs(j), '$', 0) + '.'; },
      tanya: 'Gambarkan nilai rekening saham pada akhir setiap hari.', v0: [1000, 9000, 100], d: [0, 0, 0], persen: true },
    { id: 'stok', judul: 'Persediaan Barang di Gudang', mode: 'hari-awal-termasuk', sat: 'unit', sym: '', judulY: 'Stok (unit)', riset: 'pengayaan',
      intro: function (p) { return 'Pada hari Senin, gudang memiliki stok awal ' + Fmt.angka(p.v0) + ' unit barang. Setiap hari setelahnya, ' + (p.d < 0 ? 'terjual ' : 'masuk ') + Fmt.angka(Math.abs(p.d)) + ' unit.'; },
      laju: function (p, w) { return ' Mulai ' + w + ', barang yang ' + (p.d < 0 ? 'terjual' : 'masuk') + ' setiap hari menjadi ' + Fmt.angka(Math.abs(p.d2)) + ' unit.'; },
      kejadian: function (w, j) { return ' Pada ' + w + ', ' + (j > 0 ? 'tiba kiriman tambahan sebanyak ' : 'terjadi retur dan kerusakan sebanyak ') + Fmt.angka(Math.abs(j)) + ' unit.'; },
      tanya: 'Gambarkan stok barang pada akhir setiap hari.', v0: [400, 1200, 50], d: [20, 120, 5], negatif: true },
    { id: 'tabungan', judul: 'Saldo Tabungan', mode: 'bulan-awal-termasuk', sat: '', sym: '$', judulY: 'Saldo ($)', riset: 'pengayaan',
      intro: function (p) { return 'Pada bulan ' + p.namaAwal + ', saldo tabungan ' + Fmt.uang(p.v0, '$', 0) + '. Setiap bulan setelahnya, saldo ' + (p.d > 0 ? 'bertambah ' : 'berkurang ') + Fmt.uang(Math.abs(p.d), '$', 0) + ' karena setoran dan pengeluaran rutin.'; },
      laju: function (p, w) { return ' Mulai ' + w + ', perubahan rutin itu menjadi ' + (p.d2 > 0 ? 'bertambah ' : 'berkurang ') + Fmt.uang(Math.abs(p.d2), '$', 0) + ' per bulan.'; },
      kejadian: function (w, j) { return ' Pada ' + w + ', ' + (j > 0 ? 'ada setoran tambahan sebesar ' : 'ada penarikan sebesar ') + Fmt.uang(Math.abs(j), '$', 0) + '.'; },
      tanya: 'Gambarkan saldo tabungan pada akhir setiap bulan.', v0: [1000, 4000, 250], d: [100, 400, 50] },
    { id: 'suhu', judul: 'Suhu Ruang Pendingin', mode: 'jam-awal-termasuk', sat: '°C', sym: '', judulY: 'Suhu (°C)', riset: 'pengayaan',
      intro: function (p) { return 'Pada pukul ' + p.jamAwal + ', suhu ruang pendingin adalah ' + p.v0 + '°C. Setiap jam setelahnya, suhu ' + (p.d > 0 ? 'naik ' : 'turun ') + Math.abs(p.d) + '°C.'; },
      laju: function (p, w) { return ' Mulai ' + w + ', suhu ' + (p.d2 > 0 ? 'naik ' : 'turun ') + Math.abs(p.d2) + '°C per jam.'; },
      kejadian: function (w, j) { return ' Pada ' + w + ', ' + (j > 0 ? 'pintu dibuka sehingga suhu naik tambahan ' : 'pendingin tambahan dinyalakan sehingga suhu turun tambahan ') + Math.abs(j) + '°C.'; },
      tanya: 'Gambarkan suhu ruang pendingin pada setiap jam.', v0: [4, 20, 1], d: [1, 4, 1] }
  ];

  var CATATAN_PENGAYAAN = 'Konteks tambahan tim dengan pola perubahan tetap ditambah kejadian, seperti contoh riset Line Graph.';

  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a; }

  function frameDari(id) { return FRAME.filter(function (f) { return f.id === id; })[0]; }

  function buat(id, level, benih) {
    var kel = KELUARGA.filter(function (k) { return k.id === id; })[0];
    if (!kel) throw new Error('keluarga line graph tidak dikenal: ' + id);
    var a = Rng.alat(benih);
    var f = frameDari(a.pilih(kel.frame));
    var sebelum = f.mode.indexOf('sebelum') >= 0, mulai = sebelum ? 1 : 0;
    for (var coba = 0; coba < 2000; coba++) {
      var v0 = a.kelipatan(f.v0[0], f.v0[1], f.v0[2]);
      var arah = a.pilih(f.negatif ? [-1, -1, 1] : [1, 1, -1]);
      var persen = null, persen2 = null, harian, harian2 = null;
      if (f.persen) { persen = a.pilih([1, 2, 3, 4, 5, 6]); harian = v0 * persen / 100; }
      else harian = a.kelipatan(f.d[0], f.d[1], f.d[2]);
      var d1 = arah * harian, d2 = null;
      // sulit: laju berubah mulai titik ke-c (titik pertama yang memakai laju baru)
      var c = null;
      if (level === 'sulit') {
        c = a.bulat(sebelum ? 1 : 2, 3);
        if (f.persen) { persen2 = a.pilih([1, 2, 3, 4, 5, 6].filter(function (x) { return x !== persen; })); harian2 = v0 * persen2 / 100; }
        else harian2 = a.kelipatan(f.d[0], f.d[1], f.d[2]);
        if (harian2 === harian) continue;
        d2 = arah * harian2;
      }
      // kejadian sekali-jadi: besar = kelipatan perubahan rutin, tidak pada titik perubahan laju
      var peristiwa = [];
      if (level !== 'mudah') {
        var ke = a.bulat(1, 3);
        if (ke === c) continue;
        var besar = harian * a.bulat(1, f.persen ? 2 : 3);
        var tanda = f.negatif ? (a.untung(0.7) ? 1 : -1) : a.pilih([-1, 1]);
        peristiwa.push({ ke: ke, jumlah: tanda * besar });
      }

      var label, namaAwal = null, jamAwal = null;
      if (f.mode.indexOf('hari') === 0) label = HARI.slice();
      else if (f.mode.indexOf('jam') === 0) {
        var j0 = a.bulat(6, 12); jamAwal = (j0 < 10 ? '0' : '') + j0 + '.00'; label = [];
        for (var h = 0; h < 5; h++) label.push(((j0 + h) < 10 ? '0' : '') + (j0 + h) + '.00');
      } else {
        var m0 = a.bulat(0, 6); namaAwal = Fmt.BULAN[m0]; label = [];
        for (var b = 0; b < 5; b++) label.push(BULAN[(m0 + b + mulai) % 12]);
      }
      var waktu = function (k) {
        return f.mode.indexOf('hari') === 0 ? 'hari ' + HARI[k] : (f.mode.indexOf('jam') === 0 ? 'pukul ' + label[k] : 'bulan ' + Fmt.BULAN[BULAN.indexOf(label[k])]);
      };

      // nilai tiap titik: langkah ke-j tiba di titik j - mulai dan memakai laju baru bila titik itu >= c
      var hitungan = [], vals = [], cur = v0;
      for (var k = 0; k < 5; k++) {
        var n1 = 0, n2 = 0;
        for (var j = 1; j <= k + mulai; j++) { if (c !== null && j - mulai >= c) n2++; else n1++; }
        var ev = peristiwa.filter(function (x) { return k >= x.ke; });
        var nil = v0 + n1 * d1 + n2 * (d2 || 0) + ev.reduce(function (s, x) { return s + x.jumlah; }, 0);
        hitungan.push({ n1: n1, n2: n2, ev: ev });
        vals.push(nil);
      }
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
      if ((hi - lo) / snap > POSISI_MAKS) continue;

      var p = { v0: v0, d: d1, d2: d2, persen: persen, persen2: persen2, namaAwal: namaAwal, jamAwal: jamAwal, nama: a.pilih(NAMA_INVESTOR) };
      // kalimat perubahan laju dan kejadian ditulis menurut urutan waktunya
      var susulan = peristiwa.map(function (e) { return { k: e.ke, teks: f.kejadian(waktu(e.ke), e.jumlah) }; });
      if (c !== null) susulan.push({ k: c, teks: f.laju(p, waktu(c)) });
      susulan.sort(function (x, y) { return x.k - y.k; });
      var intro = f.intro(p) + susulan.map(function (x) { return x.teks; }).join('');

      var model = { kategori: label, min: lo, maks: hi, langkah: g, awalan: f.sym, akhiran: f.sat === '°C' ? '°' : '', desimal: 2, judulY: f.judulY, judulX: '' };
      var awal = { nilai: [null, null, null, null, null] };
      var kunci = { nilai: vals };
      var satuanTeks = f.sat === '°C' ? '°C' : '';
      var kunciTeks = label.map(function (l, i) { return l + ' ' + (f.sym || '') + Fmt.angka(vals[i]) + satuanTeks; }).join('; ') + '.';
      var uang = function (v) { return f.sym === '$' ? Fmt.uang(v, '$', 0) : Fmt.angka(v); };

      // parameter: setiap angka yang dipakai rumus tertulis di soal (tampil), kecuali tanda arah
      var param = { v0: String(v0) }, tampil = { v0: f.sym === '$' ? uang(v0) : Fmt.angka(v0) }, turunan = {};
      var lajuRumus;
      if (persen) {
        param.persen = String(persen); param.arah = String(arah); tampil.persen = persen + '%';
        lajuRumus = '(v0*persen/100*arah)';
      } else {
        param.d = String(d1); param.dm = String(harian); tampil.dm = uang(harian); turunan.d = 'dm';
        lajuRumus = 'd';
      }
      var lajuRumus2 = null;
      if (c !== null) {
        if (persen) { param.persen2 = String(persen2); tampil.persen2 = persen2 + '%'; lajuRumus2 = '(v0*persen2/100*arah)'; }
        else { param.d2 = String(d2); param.dm2 = String(harian2); tampil.dm2 = uang(harian2); turunan.d2 = 'dm2'; lajuRumus2 = 'd2'; }
      }
      var catatanKejadian = peristiwa.map(function (e, i) {
        param['e' + i] = String(Math.abs(e.jumlah)); tampil['e' + i] = uang(Math.abs(e.jumlah));
        return { param: 'e' + i, waktu: f.mode.indexOf('jam') === 0 ? label[e.ke] : (f.mode.indexOf('hari') === 0 ? HARI[e.ke] : Fmt.BULAN[BULAN.indexOf(label[e.ke])]), tanda: e.jumlah > 0 ? 1 : -1 };
      });
      var steps = hitungan.map(function (hk, k) {
        var r = 'v0';
        if (hk.n1) r += '+' + hk.n1 + '*' + lajuRumus;
        if (hk.n2) r += '+' + hk.n2 + '*' + lajuRumus2;
        hk.ev.forEach(function (e) { var i = peristiwa.indexOf(e); r += (e.jumlah > 0 ? '+' : '-') + 'e' + i; });
        return { nama: 'n' + k, rumus: r };
      });

      // ----- pembahasan: Diketahui, Ditanyakan, Pengerjaan (satu persamaan "§" per titik), Kesimpulan
      var R = Rumus.baris, periode = f.mode.indexOf('hari') === 0 ? 'hari' : f.mode.indexOf('jam') === 0 ? 'jam' : 'bulan';
      var nilaiTeks = function (v) { return f.sym === '$' ? uang(v) : Fmt.angka(v) + (f.sat === '°C' ? '°C' : ' ' + f.sat); };
      var rN = function (v) { return (f.sym === '$' ? '\\$' : '') + Fmt.angka(v).replace(',', '{,}'); };
      var rT = function (t) { return '\\text{' + t + '}'; };
      // titik jam ditulis "pukul 08.00" supaya labelnya tidak terbaca sebagai bilangan
      var lbl = label.map(function (l) { return f.mode.indexOf('jam') === 0 ? 'pukul ' + l : l; });
      var pem = ['Diketahui'];
      pem.push('Nilai awal pada ' + (sebelum ? 'bulan ' + namaAwal : waktu(0)) + ': ' + nilaiTeks(v0) + (sebelum ? ' (sebelum titik pertama, ' + label[0] + ').' : ' (titik pertama).'));
      pem.push(persen ? 'Perubahan rutin: ' + (d1 > 0 ? 'naik ' : 'turun ') + persen + '% dari nilai awal setiap ' + periode + ' (bukan dari nilai ' + periode + ' sebelumnya).'
        : 'Perubahan rutin: ' + (d1 > 0 ? 'bertambah ' : 'berkurang ') + nilaiTeks(harian) + ' setiap ' + periode + '.');
      if (c !== null) pem.push('Mulai ' + waktu(c) + ': perubahan rutin menjadi ' + (persen ? (d2 > 0 ? 'naik ' : 'turun ') + persen2 + '% dari nilai awal' : (d2 > 0 ? 'bertambah ' : 'berkurang ') + nilaiTeks(harian2)) + ' setiap ' + periode + '.');
      peristiwa.forEach(function (e) { pem.push('Kejadian sekali-jadi pada ' + waktu(e.ke) + ': ' + (e.jumlah > 0 ? 'bertambah ' : 'berkurang ') + nilaiTeks(Math.abs(e.jumlah)) + ' di luar perubahan rutin.'); });
      pem.push('Ditanyakan', 'Nilai pada setiap titik grafik, yaitu ' + Fmt.daftarKata(lbl) + '.');
      pem.push('Pengerjaan', 'Setiap titik dihitung dari nilai titik sebelumnya:',
        R(rT('nilai titik') + ' = ' + rT('nilai titik sebelumnya') + ' \\pm ' + rT('perubahan rutin') + (peristiwa.length ? ' \\pm ' + rT('kejadian sekali-jadi') : '')));
      if (persen) {
        pem.push('Perubahan harian selalu dihitung dari nilai awal, jadi besarnya sama setiap hari' + (c !== null ? ' sampai lajunya berubah' : '') + ':');
        pem.push(R(rT('perubahan harian') + ' = ' + persen + '\\% \\times ' + rN(v0) + ' = ' + rN(harian)));
        if (c !== null) pem.push(R(rT('perubahan harian mulai ' + lbl[c]) + ' = ' + persen2 + '\\% \\times ' + rN(v0) + ' = ' + rN(harian2)));
      } else if (c !== null) pem.push('Titik sebelum ' + lbl[c] + ' memakai perubahan ' + nilaiTeks(harian) + '; mulai ' + lbl[c] + ' memakai ' + nilaiTeks(harian2) + '.');
      peristiwa.forEach(function (e) { pem.push('Kejadian pada ' + lbl[e.ke] + ' dihitung sekali pada titik itu; pengaruhnya terbawa ke titik-titik sesudahnya.'); });
      for (var kk = 0; kk < 5; kk++) {
        if (kk === 0 && !sebelum) { pem.push('Titik ' + lbl[0] + ' adalah nilai awal:', R(rT(lbl[0]) + ' = ' + rN(vals[0]))); continue; }
        var asal = kk === 0 ? v0 : vals[kk - 1];
        var dPakai = c !== null && kk >= c ? d2 : d1;
        var ev2 = peristiwa.filter(function (x) { return x.ke === kk; })[0];
        pem.push(R(rT(lbl[kk]) + ' = ' + rN(asal) + (dPakai >= 0 ? ' + ' : ' - ') + rN(Math.abs(dPakai)) + (ev2 ? (ev2.jumlah > 0 ? ' + ' : ' - ') + rN(Math.abs(ev2.jumlah)) : '') + ' = ' + rN(vals[kk])));
      }
      pem.push('Kesimpulan', 'Geser titik ' + Fmt.daftarKata(lbl.map(function (l, i) { return l + ' ke ' + nilaiTeks(vals[i]); })) + ', sehingga garis tersambung dari ' + lbl[0] + ' sampai ' + lbl[4] + '.');

      var jenis = (persen ? (d1 > 0 ? 'kenaikan' : 'penurunan') + ' persen dari nilai awal' : 'perubahan tetap per ' + (f.mode.indexOf('hari') === 0 ? 'hari' : f.mode.indexOf('jam') === 0 ? 'jam' : 'bulan')) +
        (c !== null ? ', perubahan laju, dan satu kejadian sekali-jadi' : peristiwa.length ? ' dan satu kejadian sekali-jadi' : '');
      var ctx = { submateri: 'garis', keluarga: id, level: level, benih: benih };
      var butir = Butir.rakitIsian(ctx, {
        jenisSoal: 'Line Graph (tes interaktif): ' + jenis,
        judul: f.judul + ' · Line Graph', teks: [intro], pertanyaan: f.tanya,
        perintah: 'Geser tiap titik ke nilai yang benar pada sumbu vertikal.',
        gambar: [{ id: 'awal', jenis: 'garis', model: model, state: awal, judul: 'Tampilan awal' }],
        gambarPembahasan: [{ id: 'kunci', jenis: 'garis', model: Object.assign({}, model, { labelNilai: true }), state: kunci, judul: 'Kondisi akhir (kunci)' }],
        isian: { jenis: 'garis', kontrol: [{ nama: 'titik', label: 'Nilai tiap titik', min: lo, maks: hi, langkah: snap, satuan: (f.sym || '') + (f.sat || '') }], awal: awal, kunci: kunci, model: model, kategori: label },
        kunciTeks: kunciTeks, langkah: steps, pembahasan: pem,
        model: { param: param, tampil: tampil, turunan: turunan, peristiwa: catatanKejadian, toleransi: 1e-9, topik: 'Line Graph', kunciLangkah: { nilai: ['n0', 'n1', 'n2', 'n3', 'n4'] }, snap: snap, min: lo, maks: hi },
        sidik: { inti: 'pn-garis|' + f.id + '|' + vals.join(','), param: vals.concat([v0]), entitas: f.id + (persen || '') + '|' + level }
      });
      butir.pola = 'garis-' + f.id;
      butir.kategoriRiset = f.riset;
      if (f.riset === 'pengayaan') butir.catatanRiset = CATATAN_PENGAYAAN;
      return butir;
    }
    return null;
  }

  // Area cakupan berbobot ganda karena paling dekat dengan contoh riset.
  var KELUARGA = [
    { id: 'garis-tetap', nama: 'Perubahan tetap per periode dan kejadian tambahan', submateri: 'garis', frame: ['cakupan', 'cakupan', 'tabungan', 'suhu'] },
    { id: 'garis-persen-awal', nama: 'Kenaikan persen dari nilai awal dan transaksi satu kali', submateri: 'garis', frame: ['saham'] },
    { id: 'garis-stok', nama: 'Persediaan dengan penjualan harian dan kiriman', submateri: 'garis', frame: ['stok'] }
  ];

  return { KELUARGA: KELUARGA, buat: buat, FRAME: FRAME, POSISI_MAKS: POSISI_MAKS };
});
