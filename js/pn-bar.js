/*
 * pn-bar.js — Penalaran Numerik > Bar Chart.
 *
 * Dua batang bertumpuk (bagian bawah A, bagian atas B). Peserta mengatur TOTAL
 * tiap batang dan PERSENTASE kedua bagiannya. Kondisi awal sengaja salah; kunci
 * adalah kondisi akhir yang memenuhi semua keterangan pada soal.
 *
 * Keterangan soal dirangkai dari beberapa jenis hubungan:
 *   tahun/kuartal pertama   total dan salah satu bagian (nominal atau persen)
 *   total tahun kedua       naik/turun sekian persen, atau naik/turun sekian nominal
 *   bagian tahun kedua      naik sekian persen, naik sekian nominal, atau sekian persen dari total
 * Semua angka dicari sampai total berada pada kelipatan langkah geser dan
 * persentase tiap bagian pada kelipatan 5% — nilai yang memang bisa diatur
 * dengan tampilan interaktifnya.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./rng.js'), require('./format.js'), require('./butir.js'));
    module.exports = api;
  } else {
    api = factory(root.Rng, root.Fmt, root.Butir);
    root.PnBar = api;
  }
})(typeof self !== 'undefined' ? self : this, function (Rng, Fmt, Butir) {
  'use strict';

  var FRAME = [
    { id: 'asuransi', judul: 'Asuransi', kat: ['Tahun 1', 'Tahun 2'], jenis: 'tahun',
      total: 'total biaya', A: 'biaya yang ditanggung sendiri', B: 'premi', namaA: 'Ditanggung sendiri', namaB: 'Premi',
      sym: '$', akhiran: '', skala: [1000, 3000], langkah: 100,
      pembuka: 'Biaya asuransi mencakup biaya yang ditanggung sendiri dan premi.' },
    { id: 'pendapatan', judul: 'Pendapatan Penjualan', kat: ['Kuartal 1', 'Kuartal 2'], jenis: 'kuartal',
      total: 'total pendapatan penjualan', A: 'pendapatan penjualan wilayah Timur', B: 'pendapatan penjualan wilayah Barat', namaA: 'Wilayah Timur', namaB: 'Wilayah Barat',
      sym: '$', akhiran: ' juta', skala: [60, 200], langkah: 10,
      pembuka: 'Pendapatan penjualan berasal dari dua wilayah, yaitu wilayah Timur dan wilayah Barat.' },
    { id: 'anggaran', judul: 'Anggaran Departemen', kat: ['2025', '2026'], jenis: 'tahun',
      total: 'total anggaran', A: 'belanja pegawai', B: 'belanja operasional', namaA: 'Belanja pegawai', namaB: 'Belanja operasional',
      sym: '$', akhiran: ' juta', skala: [40, 160], langkah: 10,
      pembuka: 'Anggaran departemen terbagi menjadi belanja pegawai dan belanja operasional.' },
    { id: 'produksi', judul: 'Hasil Produksi', kat: ['Bulan 1', 'Bulan 2'], jenis: 'bulan',
      total: 'total produksi', A: 'unit yang lolos pemeriksaan', B: 'unit yang ditolak', namaA: 'Lolos pemeriksaan', namaB: 'Ditolak',
      sym: '', akhiran: ' unit', skala: [800, 2400], langkah: 100,
      pembuka: 'Hasil produksi pabrik terdiri dari unit yang lolos pemeriksaan dan unit yang ditolak.' },
    { id: 'kredit', judul: 'Portofolio Kredit', kat: ['Semester 1', 'Semester 2'], jenis: 'semester',
      total: 'total kredit', A: 'kredit lancar', B: 'kredit bermasalah', namaA: 'Kredit lancar', namaB: 'Kredit bermasalah',
      sym: '$', akhiran: ' juta', skala: [100, 400], langkah: 10,
      pembuka: 'Portofolio kredit sebuah bank terdiri dari kredit lancar dan kredit bermasalah.' },
    { id: 'klaim', judul: 'Klaim Asuransi', kat: ['Tahun 1', 'Tahun 2'], jenis: 'tahun',
      total: 'total klaim', A: 'klaim kendaraan', B: 'klaim properti', namaA: 'Klaim kendaraan', namaB: 'Klaim properti',
      sym: '$', akhiran: ' juta', skala: [60, 240], langkah: 10,
      pembuka: 'Klaim yang dibayarkan sebuah perusahaan asuransi terdiri dari klaim kendaraan dan klaim properti.' },
    { id: 'dana', judul: 'Dana Pihak Ketiga', kat: ['Semester 1', 'Semester 2'], jenis: 'semester',
      total: 'total dana pihak ketiga', A: 'dana giro', B: 'dana tabungan', namaA: 'Giro', namaB: 'Tabungan',
      sym: '$', akhiran: ' juta', skala: [200, 800], langkah: 20,
      pembuka: 'Dana pihak ketiga sebuah bank terdiri dari dana giro dan dana tabungan.' },
    { id: 'dompet', judul: 'Transaksi Dompet Digital', kat: ['Bulan 1', 'Bulan 2'], jenis: 'bulan',
      total: 'total transaksi', A: 'transaksi isi saldo', B: 'transaksi pembayaran', namaA: 'Isi saldo', namaB: 'Pembayaran',
      sym: '', akhiran: ' ribu', skala: [400, 1600], langkah: 100,
      pembuka: 'Transaksi pada sebuah aplikasi dompet digital terdiri dari transaksi isi saldo dan transaksi pembayaran.' },
    { id: 'reksa', judul: 'Dana Kelolaan Reksa Dana', kat: ['Kuartal 1', 'Kuartal 2'], jenis: 'kuartal',
      total: 'total dana kelolaan', A: 'dana kelolaan reksa dana pasar uang', B: 'dana kelolaan reksa dana saham', namaA: 'Pasar uang', namaB: 'Saham',
      sym: '$', akhiran: ' juta', skala: [100, 500], langkah: 10,
      pembuka: 'Dana kelolaan sebuah manajer investasi terbagi menjadi reksa dana pasar uang dan reksa dana saham.' },
    { id: 'pajak', judul: 'Penerimaan Pajak Daerah', kat: ['2025', '2026'], jenis: 'tahun',
      total: 'total penerimaan pajak daerah', A: 'penerimaan pajak kendaraan', B: 'penerimaan pajak restoran', namaA: 'Pajak kendaraan', namaB: 'Pajak restoran',
      sym: '$', akhiran: ' juta', skala: [50, 200], langkah: 10,
      pembuka: 'Penerimaan pajak sebuah daerah berasal dari pajak kendaraan dan pajak restoran.' }
  ];

  /** Langkah garis bantu yang rapi: 1, 2, 5 kali pangkat sepuluh. */
  function langkahRapi(maks) {
    var kasar = maks / 4, p = Math.pow(10, Math.floor(Math.log10(kasar)));
    var n = kasar / p;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
  }

  function uang(f, v) { return (f.sym || '') + Fmt.angka(v) + (f.akhiran || ''); }
  function sebutan(v) { return Fmt.angka(v, { desimal: 1 }); }

  function buatSpec(a, level) {
    var fi = a.bulat(0, FRAME.length - 1), f = FRAME[fi];
    var langkah = f.langkah;
    for (var coba = 0; coba < 4000; coba++) {
      var T1 = a.kelipatan(Math.ceil(f.skala[0] / langkah) * langkah, f.skala[1], langkah);
      var sh1 = a.kelipatan(15, 85, 5);
      var A1 = T1 * sh1 / 100;
      if (Math.abs(A1 - Math.round(A1)) > 1e-9) continue;
      var B1 = T1 - A1;
      var jenisAwal = level === 'sulit' ? a.pilih(['A1', 'share1']) : a.pilih(['A1', 'A1', 'share1']);
      var jenisT = level === 'mudah' ? 'pct' : a.pilih(['pct', 'nominal']);
      var jenisS = level === 'mudah' ? a.pilih(['sama', 'sama', 'share2']) : a.pilih(level === 'sulit' ? ['pctB', 'nominalB', 'share2', 'pctA'] : ['pctB', 'nominalB', 'share2']);
      var T2, ket = {}, p = null, x = null;
      if (jenisT === 'pct') {
        p = a.pilih(level === 'mudah' ? [10, 20, 25, 30, 40, 50] : [10, 20, 25, 30, 40, 50, 60]);
        var arah = a.pilih([1, 1, -1]);
        T2 = T1 * (100 + arah * p) / 100; ket.arahT = arah;
      } else {
        x = a.kelipatan(langkah, Math.max(langkah, Math.round(T1 * 0.5 / langkah) * langkah), langkah);
        var arah2 = a.pilih([1, -1]);
        T2 = T1 + arah2 * x; ket.arahT = arah2;
      }
      if (T2 < langkah * 2 || T2 % langkah !== 0 || T2 === T1) continue;
      var A2, B2, q = null, y = null, sh2 = null;
      if (jenisS === 'sama') {
        q = p; B2 = B1 * (100 + (ket.arahT || 1) * p) / 100; A2 = T2 - B2;
        if (jenisT !== 'pct') continue;
      } else if (jenisS === 'pctB') {
        q = a.pilih([10, 20, 25, 30, 40, 50]); ket.arahS = a.pilih([1, 1, -1]);
        B2 = B1 * (100 + ket.arahS * q) / 100; A2 = T2 - B2;
      } else if (jenisS === 'pctA') {
        q = a.pilih([10, 20, 25, 30, 40, 50]); ket.arahS = a.pilih([1, 1, -1]);
        A2 = A1 * (100 + ket.arahS * q) / 100; B2 = T2 - A2;
      } else if (jenisS === 'nominalB') {
        y = a.kelipatan(langkah, Math.max(langkah, Math.round(B1 * 0.8 / langkah) * langkah), langkah); ket.arahS = a.pilih([1, 1, -1]);
        B2 = B1 + ket.arahS * y; A2 = T2 - B2;
      } else {
        sh2 = a.kelipatan(15, 85, 5);
        A2 = T2 * sh2 / 100; B2 = T2 - A2;
      }
      if (!(A2 > 0 && B2 > 0)) continue;
      var pA1 = A1 / T1 * 100, pA2 = A2 / T2 * 100;
      if (Math.abs(pA2 - Math.round(pA2 / 5) * 5) > 1e-9) continue;
      if (pA2 < 5 || pA2 > 95) continue;
      if (Math.abs(A2 - Math.round(A2 * 100) / 100) > 1e-9 || Math.abs(B2 - Math.round(B2 * 100) / 100) > 1e-9) continue;
      if (pA1 === pA2 && jenisS !== 'sama') continue;
      if (jenisAwal === 'share1' && Math.abs(pA1 - sh1) > 1e-9) continue;

      // ----- teks keterangan
      var k1 = f.kat[0], k2 = f.kat[1];
      var butir = [];
      var kat2 = jenisT === 'pct' ? f.total + ' ' + (ket.arahT > 0 ? 'naik ' : 'turun ') + p + '%'
        : f.total + ' ' + (ket.arahT > 0 ? 'naik ' : 'turun ') + uang(f, x) + ' dibandingkan ' + k1;
      butir.push(k1 + ': ' + f.total + ' = ' + uang(f, T1) + (jenisAwal === 'A1' ? '; ' + f.A + ' = ' + uang(f, A1) + '.' : '; ' + f.A + ' menyumbang ' + sh1 + '% dari total.'));
      butir.push(k2 + ': ' + kat2 + '.');
      var kalimatS = {
        sama: f.B + ' naik ' + p + '% juga' ,
        pctB: f.B + ' ' + (ket.arahS > 0 ? 'naik ' : 'turun ') + q + '% dibandingkan ' + k1,
        pctA: f.A + ' ' + (ket.arahS > 0 ? 'naik ' : 'turun ') + q + '% dibandingkan ' + k1,
        nominalB: f.B + ' ' + (ket.arahS > 0 ? 'meningkat ' : 'menurun ') + (jenisS === 'nominalB' ? uang(f, y) : '') + ' dari ' + k1 + ' ke ' + k2,
        share2: f.A + ' menyumbang ' + sh2 + '% dari ' + f.total + ' pada ' + k2
      }[jenisS];
      if (jenisS === 'sama') kalimatS = f.B + (ket.arahT > 0 ? ' naik ' : ' turun ') + p + '%';
      butir.push(k2 + ': ' + kalimatS + '.');

      // ----- langkah hitung (rumus eksak untuk validator)
      var param = { T1: String(T1) };
      var tampil = { T1: uang(f, T1) };
      var steps = [];
      if (jenisAwal === 'A1') { param.A1 = String(A1); tampil.A1 = uang(f, A1); } else { param.sh1 = String(sh1); tampil.sh1 = sh1 + '%'; steps.push({ nama: 'A1', rumus: 'T1*sh1%' }); }
      steps.push({ nama: 'B1', rumus: 'T1-A1' });
      if (jenisT === 'pct') { param.p = String(p); tampil.p = p + '%'; steps.push({ nama: 'T2', rumus: 'T1*(100' + (ket.arahT > 0 ? '+' : '-') + 'p)/100' }); }
      else { param.x = String(x); tampil.x = uang(f, x); steps.push({ nama: 'T2', rumus: 'T1' + (ket.arahT > 0 ? '+' : '-') + 'x' }); }
      if (jenisS === 'sama') steps.push({ nama: 'B2', rumus: 'B1*(100' + (ket.arahT > 0 ? '+' : '-') + 'p)/100' }, { nama: 'A2', rumus: 'T2-B2' });
      else if (jenisS === 'pctB') { param.q = String(q); tampil.q = q + '%'; steps.push({ nama: 'B2', rumus: 'B1*(100' + (ket.arahS > 0 ? '+' : '-') + 'q)/100' }, { nama: 'A2', rumus: 'T2-B2' }); }
      else if (jenisS === 'pctA') { param.q = String(q); tampil.q = q + '%'; steps.push({ nama: 'A2', rumus: 'A1*(100' + (ket.arahS > 0 ? '+' : '-') + 'q)/100' }, { nama: 'B2', rumus: 'T2-A2' }); }
      else if (jenisS === 'nominalB') { param.y = String(y); tampil.y = uang(f, y); steps.push({ nama: 'B2', rumus: 'B1' + (ket.arahS > 0 ? '+' : '-') + 'y' }, { nama: 'A2', rumus: 'T2-B2' }); }
      else { param.sh2 = String(sh2); tampil.sh2 = sh2 + '%'; steps.push({ nama: 'A2', rumus: 'T2*sh2%' }, { nama: 'B2', rumus: 'T2-A2' }); }
      steps.push({ nama: 'pA1', rumus: 'A1/T1*100' }, { nama: 'pA2', rumus: 'A2/T2*100' });

      // ----- pembahasan
      var pem = [];
      pem.push(k1 + ': ' + f.total + ' ' + uang(f, T1) + '; ' + f.A + ' ' + uang(f, A1) + ' = ' + sebutan(pA1) + '%; ' + f.B + ' = ' + uang(f, T1) + ' - ' + uang(f, A1) + ' = ' + uang(f, B1) + ' = ' + sebutan(100 - pA1) + '%.');
      pem.push(k2 + ': ' + (jenisT === 'pct' ? f.total + ' ' + (ket.arahT > 0 ? 'naik ' : 'turun ') + p + '%, jadi ' + uang(f, T1) + ' × ' + Fmt.angka((100 + ket.arahT * p) / 100, { desimal: 2 }) + ' = ' + uang(f, T2) + '.'
        : f.total + ' ' + (ket.arahT > 0 ? 'naik ' : 'turun ') + uang(f, x) + ', jadi ' + uang(f, T1) + (ket.arahT > 0 ? ' + ' : ' - ') + uang(f, x) + ' = ' + uang(f, T2) + '.'));
      if (jenisS === 'sama' || jenisS === 'pctB') {
        var pp = jenisS === 'sama' ? p : q, ar = jenisS === 'sama' ? ket.arahT : ket.arahS;
        pem.push(Kapital(f.B) + (ar > 0 ? ' naik ' : ' turun ') + pp + '%, jadi ' + uang(f, B1) + ' × ' + Fmt.angka((100 + ar * pp) / 100, { desimal: 2 }) + ' = ' + uang(f, B2) + '. ' + Kapital(f.A) + ' = ' + uang(f, T2) + ' - ' + uang(f, B2) + ' = ' + uang(f, A2) + ', yaitu ' + sebutan(pA2) + '% dari ' + uang(f, T2) + '.');
      } else if (jenisS === 'pctA') {
        pem.push(Kapital(f.A) + (ket.arahS > 0 ? ' naik ' : ' turun ') + q + '%, jadi ' + uang(f, A1) + ' × ' + Fmt.angka((100 + ket.arahS * q) / 100, { desimal: 2 }) + ' = ' + uang(f, A2) + ', yaitu ' + sebutan(pA2) + '% dari ' + uang(f, T2) + '. ' + Kapital(f.B) + ' = ' + uang(f, T2) + ' - ' + uang(f, A2) + ' = ' + uang(f, B2) + '.');
      } else if (jenisS === 'nominalB') {
        pem.push(Kapital(f.B) + (ket.arahS > 0 ? ' meningkat ' : ' menurun ') + uang(f, y) + ', jadi ' + uang(f, B1) + (ket.arahS > 0 ? ' + ' : ' - ') + uang(f, y) + ' = ' + uang(f, B2) + '. ' + Kapital(f.A) + ' = ' + uang(f, T2) + ' - ' + uang(f, B2) + ' = ' + uang(f, A2) + ', yaitu ' + sebutan(pA2) + '% dari ' + uang(f, T2) + '.');
      } else {
        pem.push(Kapital(f.A) + ' ' + sh2 + '% dari ' + uang(f, T2) + ' = ' + uang(f, A2) + '; ' + f.B + ' = ' + uang(f, T2) + ' - ' + uang(f, A2) + ' = ' + uang(f, B2) + ' (' + sebutan(100 - pA2) + '%).');
      }
      pem.push('Kondisi akhir: ' + k1 + ' total ' + uang(f, T1) + ' (' + f.namaA + ' ' + sebutan(pA1) + '%, ' + f.namaB + ' ' + sebutan(100 - pA1) + '%); ' + k2 + ' total ' + uang(f, T2) + ' (' + f.namaA + ' ' + sebutan(pA2) + '%, ' + f.namaB + ' ' + sebutan(100 - pA2) + '%).');

      var maksData = Math.max(T1, T2), lg = langkahRapi(maksData * 1.1);
      var sumbuMaks = Math.ceil(maksData * 1.12 / lg) * lg;
      var awalTotal = [T1, Math.max(langkah * 2, Math.round(T1 * 0.67 / langkah) * langkah)];
      if (awalTotal[1] === T2) awalTotal[1] = Math.round(T1 * 0.5 / langkah) * langkah || langkah * 2;
      if (awalTotal[1] === T2 && pA1 === 50 && pA2 === 50) continue;          // tampilan awal tidak boleh sudah benar
      var model = { kategori: f.kat, seri: [f.namaA, f.namaB], sumbuMaks: sumbuMaks, langkah: lg, awalan: f.sym, akhiran: f.akhiran, desimal: 1, judulY: '' };
      var kunci = { total: [T1, T2], persen: [pA1, pA2] };
      var awal = { total: awalTotal, persen: [50, 50] };
      var kunciTeks = f.kat[0] + ': total ' + uang(f, T1) + ', ' + f.namaA + ' ' + sebutan(pA1) + '% (' + uang(f, A1) + '), ' + f.namaB + ' ' + sebutan(100 - pA1) + '% (' + uang(f, B1) + '). ' +
        f.kat[1] + ': total ' + uang(f, T2) + ', ' + f.namaA + ' ' + sebutan(pA2) + '% (' + uang(f, A2) + '), ' + f.namaB + ' ' + sebutan(100 - pA2) + '% (' + uang(f, B2) + ').';
      return {
        f: f, fi: fi, teks: [f.pembuka].concat(butir), judul: f.judul + ' · Bar Chart',
        pertanyaan: 'Atur ' + f.total + ' dan persentase ' + f.A + ' serta ' + f.B + ' untuk setiap ' + f.jenis + '.',
        model: model, awal: awal, kunci: kunci, kunciTeks: kunciTeks, langkahHitung: steps, param: param, tampil: tampil, pembahasan: pem,
        nilai: { T1: T1, T2: T2, A1: A1, A2: A2, B1: B1, B2: B2, jenisAwal: jenisAwal, jenisT: jenisT, jenisS: jenisS }, langkahTotal: langkah
      };
    }
    return null;
  }

  function Kapital(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function buat(id, level, benih) {
    var a = Rng.alat(benih);
    var s = buatSpec(a, level);
    if (!s) return null;
    var ctx = { submateri: 'bar', keluarga: id, level: level, benih: benih };
    var kontrol = [
      { nama: 'total', label: 'Total tiap batang', min: 0, maks: s.model.sumbuMaks, langkah: s.langkahTotal, satuan: (s.f.sym || '') + (s.f.akhiran || '') },
      { nama: 'persen', label: 'Persentase ' + s.f.namaA + ' (sisanya ' + s.f.namaB + ')', min: 0, maks: 100, langkah: 5, satuan: '%' }
    ];
    var gambarAwal = [{ id: 'awal', jenis: 'bar-tumpuk', model: s.model, state: s.awal, judul: 'Tampilan awal' }];
    var gambarKunci = [{ id: 'kunci', jenis: 'bar-tumpuk', model: s.model, state: s.kunci, judul: 'Kondisi akhir (kunci)' }];
    return Butir.rakitIsian(ctx, {
      jenisSoal: 'Bar Chart (tes interaktif)',
      judul: s.judul, teks: s.teks, pertanyaan: s.pertanyaan,
      perintah: 'Geser batang untuk mengatur total dan geser garis pembatas bagian untuk mengatur persentasenya.',
      gambar: gambarAwal, gambarPembahasan: gambarKunci,
      isian: { jenis: 'bar-tumpuk', kontrol: kontrol, awal: s.awal, kunci: s.kunci, model: s.model, kategori: s.f.kat, seri: [s.f.namaA, s.f.namaB] },
      kunciTeks: s.kunciTeks,
      langkah: s.langkahHitung,
      pembahasan: s.pembahasan.concat(['Pada tampilan awal, kedua batang masih berpembagian 50% / 50% dan total belum sesuai; atur ke kondisi akhir di atas.']),
      model: {
        param: s.param, tampil: s.tampil, toleransi: 1e-9, topik: 'Bar Chart',
        kunciLangkah: { total: ['T1', 'T2'], persen: ['pA1', 'pA2'] }, langkahTotal: s.langkahTotal, langkahPersen: 5, sumbuMaks: s.model.sumbuMaks
      },
      sidik: { inti: 'pn-bar|' + s.fi + '|' + [s.nilai.T1, s.nilai.T2, s.nilai.A1, s.nilai.A2].join(','), param: [s.nilai.T1, s.nilai.T2, s.nilai.A1, s.nilai.A2], entitas: s.nilai.jenisT + s.nilai.jenisS + s.nilai.jenisAwal }
    });
  }

  var KELUARGA = [{ id: 'bar-tumpuk', nama: 'Batang bertumpuk dua bagian', submateri: 'bar' }];

  return { KELUARGA: KELUARGA, buat: buat, FRAME: FRAME };
});
