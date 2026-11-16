/*
 * pn-bar.js — Penalaran Numerik > Bar Chart.
 *
 * Dua batang bertumpuk (bagian bawah A, bagian atas B). Peserta mengatur TOTAL
 * tiap batang dan PERSENTASE kedua bagiannya. Kondisi awal sengaja salah; kunci
 * adalah kondisi akhir yang memenuhi semua keterangan pada soal.
 *
 * Keterangan soal dirangkai dari beberapa jenis hubungan:
 *   periode pertama   total dan salah satu bagian (nominal atau persen)
 *   total periode 2   naik/turun sekian persen atau sekian nominal (tidak disebut pada pola dua-bagian)
 *   bagian periode 2  - sama-sama naik sekian persen dengan total (contoh riset Asuransi)
 *                     - satu bagian berubah sekian persen/nominal, bagian lain dicari (contoh riset
 *                       Asuransi dan Pendapatan Penjualan)
 *                     - sekian persen dari total (pengayaan, hanya tingkat mudah)
 *                     - selisih nominal antarbagian pada periode 2 (pengayaan, sulit)
 *                     - kedua bagian berubah sendiri-sendiri, total periode 2 dicari (pengayaan, sulit)
 * Pola dipilih SEKALI sebelum angka dicari, jadi sebarannya mengikuti bobot tingkat (bukan pola yang
 * paling mudah memenuhi syarat). Semua angka dicari sampai total berada pada kelipatan langkah geser
 * dan persentase tiap bagian pada kelipatan 5% — nilai yang memang bisa diatur dengan tampilan
 * interaktifnya. Nominal ditulis utuh ($52.500), tidak memakai "juta" atau "ribu".
 *
 * Pembahasan: Diketahui, Ditanyakan, Pengerjaan (rumus persentase bagian lebih dahulu, lalu setiap
 * nilai dan setiap persentase sebagai persamaan "§", termasuk pembagian nilai bagian dengan total),
 * dan Kesimpulan berupa pengaturan akhir tiap batang.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./rng.js'), require('./format.js'), require('./butir.js'), require('./rumus.js'));
    module.exports = api;
  } else {
    api = factory(root.Rng, root.Fmt, root.Butir, root.Rumus);
    root.PnBar = api;
  }
})(typeof self !== 'undefined' ? self : this, function (Rng, Fmt, Butir, Rumus) {
  'use strict';

  var FRAME = [
    { id: 'asuransi', judul: 'Asuransi', kat: ['Tahun 1', 'Tahun 2'], jenis: 'tahun',
      total: 'total biaya', A: 'biaya yang ditanggung sendiri', B: 'premi', namaA: 'Ditanggung sendiri', namaB: 'Premi',
      sym: '$', akhiran: '', skala: [1000, 3000], langkah: 100,
      pembuka: 'Biaya asuransi mencakup biaya yang ditanggung sendiri dan premi.' },
    { id: 'pendapatan', judul: 'Pendapatan Penjualan', kat: ['Kuartal 1', 'Kuartal 2'], jenis: 'kuartal',
      total: 'total pendapatan penjualan', A: 'pendapatan penjualan wilayah Timur', B: 'pendapatan penjualan wilayah Barat', namaA: 'Wilayah Timur', namaB: 'Wilayah Barat',
      sym: '$', akhiran: '', skala: [60000, 200000], langkah: 10000,
      pembuka: 'Pendapatan penjualan berasal dari dua wilayah, yaitu wilayah Timur dan wilayah Barat.' },
    { id: 'anggaran', judul: 'Anggaran Departemen', kat: ['2025', '2026'], jenis: 'tahun',
      total: 'total anggaran', A: 'belanja pegawai', B: 'belanja operasional', namaA: 'Belanja pegawai', namaB: 'Belanja operasional',
      sym: '$', akhiran: '', skala: [40000, 160000], langkah: 10000,
      pembuka: 'Anggaran departemen terbagi menjadi belanja pegawai dan belanja operasional.' },
    { id: 'produksi', judul: 'Hasil Produksi', kat: ['Bulan 1', 'Bulan 2'], jenis: 'bulan',
      total: 'total produksi', A: 'unit yang lolos pemeriksaan', B: 'unit yang ditolak', namaA: 'Lolos pemeriksaan', namaB: 'Ditolak',
      sym: '', akhiran: ' unit', skala: [800, 2400], langkah: 100,
      pembuka: 'Hasil produksi pabrik terdiri dari unit yang lolos pemeriksaan dan unit yang ditolak.' },
    { id: 'kredit', judul: 'Portofolio Kredit', kat: ['Semester 1', 'Semester 2'], jenis: 'semester',
      total: 'total kredit', A: 'kredit lancar', B: 'kredit bermasalah', namaA: 'Kredit lancar', namaB: 'Kredit bermasalah',
      sym: '$', akhiran: '', skala: [100000, 400000], langkah: 10000,
      pembuka: 'Portofolio kredit sebuah bank terdiri dari kredit lancar dan kredit bermasalah.' },
    { id: 'klaim', judul: 'Klaim Asuransi', kat: ['Tahun 1', 'Tahun 2'], jenis: 'tahun',
      total: 'total klaim', A: 'klaim kendaraan', B: 'klaim properti', namaA: 'Klaim kendaraan', namaB: 'Klaim properti',
      sym: '$', akhiran: '', skala: [60000, 240000], langkah: 10000,
      pembuka: 'Klaim yang dibayarkan sebuah perusahaan asuransi terdiri dari klaim kendaraan dan klaim properti.' },
    { id: 'dana', judul: 'Dana Pihak Ketiga', kat: ['Semester 1', 'Semester 2'], jenis: 'semester',
      total: 'total dana pihak ketiga', A: 'dana giro', B: 'dana tabungan', namaA: 'Giro', namaB: 'Tabungan',
      sym: '$', akhiran: '', skala: [200000, 800000], langkah: 20000,
      pembuka: 'Dana pihak ketiga sebuah bank terdiri dari dana giro dan dana tabungan.' },
    { id: 'dompet', judul: 'Transaksi Dompet Digital', kat: ['Bulan 1', 'Bulan 2'], jenis: 'bulan',
      total: 'total transaksi', A: 'transaksi isi saldo', B: 'transaksi pembayaran', namaA: 'Isi saldo', namaB: 'Pembayaran',
      sym: '', akhiran: ' transaksi', skala: [4000, 16000], langkah: 1000,
      pembuka: 'Transaksi pada sebuah aplikasi dompet digital terdiri dari transaksi isi saldo dan transaksi pembayaran.' },
    { id: 'reksa', judul: 'Dana Kelolaan Reksa Dana', kat: ['Kuartal 1', 'Kuartal 2'], jenis: 'kuartal',
      total: 'total dana kelolaan', A: 'dana kelolaan reksa dana pasar uang', B: 'dana kelolaan reksa dana saham', namaA: 'Pasar uang', namaB: 'Saham',
      sym: '$', akhiran: '', skala: [100000, 500000], langkah: 10000,
      pembuka: 'Dana kelolaan sebuah manajer investasi terbagi menjadi reksa dana pasar uang dan reksa dana saham.' },
    { id: 'pajak', judul: 'Penerimaan Pajak Daerah', kat: ['2025', '2026'], jenis: 'tahun',
      total: 'total penerimaan pajak daerah', A: 'penerimaan pajak kendaraan', B: 'penerimaan pajak restoran', namaA: 'Pajak kendaraan', namaB: 'Pajak restoran',
      sym: '$', akhiran: '', skala: [50000, 200000], langkah: 10000,
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

  // ----- notasi persamaan pembahasan (lihat rumus.js)
  /** Angka dalam persamaan: titik ribuan tetap, koma desimal ditulis {,}. */
  function rAngka(v, d) { return Fmt.angka(v, { desimal: d == null ? 2 : d }).replace(',', '{,}'); }
  /** Nilai bersatuan frame dalam persamaan: \$52.500 atau 1.200\ \text{unit}. */
  function rNilai(f, v) { return f.sym ? '\\' + f.sym + rAngka(v) : rAngka(v) + (f.akhiran ? '\\ \\text{' + f.akhiran.trim() + '}' : ''); }
  function rTeks(t) { return '\\text{' + t + '}'; }
  /** Perubahan persen: "\$100.000 \times (100\% + 50\%) = \$100.000 \times 1{,}5" (faktor 1,5 = 100% + 50%). */
  function rKali(f, v, arah, p) {
    return rNilai(f, v) + ' \\times (100\\% ' + (arah > 0 ? '+ ' : '- ') + p + '\\%) = ' + rNilai(f, v) + ' \\times ' + rAngka((100 + arah * p) / 100);
  }
  /** Perubahan nominal: "\$97.500 - \$60.000". */
  function rTambah(f, v, arah, x) { return rNilai(f, v) + (arah > 0 ? ' + ' : ' - ') + rNilai(f, x); }
  /** Persentase bagian: \text{persentase X} = \frac{bagian}{total} \times 100\% = p\%. */
  function rPersen(nama, bagian, total, p) {
    return Rumus.baris(rTeks('persentase ' + nama) + ' = \\frac{' + rAngka(bagian) + '}{' + rAngka(total) + '} \\times 100\\% = ' + rAngka(p, 1) + '\\%');
  }

  /*
   * Pola per tingkat: [jenis perubahan total, jenis keterangan bagian]. 'sama' = bagian B naik/turun
   * dengan persen yang sama dengan total; pctA/pctB/nominalB = satu bagian berubah lalu bagian lain
   * dicari; share2 = persen bagian A pada periode 2 diberikan langsung; selisih2 = selisih nominal
   * kedua bagian pada periode 2; dua = kedua bagian berubah sendiri-sendiri dan total periode 2 dicari.
   */
  var POLA = {
    mudah: [['pct', 'sama'], ['pct', 'share2'], ['nominal', 'share2'], ['pct', 'sama']],
    sedang: [['pct', 'pctB'], ['pct', 'pctA'], ['nominal', 'nominalB'], ['nominal', 'pctB'], ['pct', 'nominalB']],
    sulit: [['nominal', 'selisih2'], ['pct', 'selisih2'], ['-', 'dua'], ['-', 'dua']]
  };
  var POLA_RISET = { sama: 'acuan', pctA: 'acuan', pctB: 'acuan', nominalB: 'acuan', share2: 'pengayaan', selisih2: 'pengayaan', dua: 'pengayaan' };
  var CATATAN_RISET = {
    share2: 'Persen bagian periode kedua diberikan langsung; contoh riset meminta bagian itu dicari dari perubahan nilai.',
    selisih2: 'Pengembangan tim: bagian periode kedua dicari dari selisih nominal antarbagian.',
    dua: 'Pengembangan tim: kedua bagian berubah sendiri-sendiri sehingga total periode kedua harus dicari.'
  };

  function buatSpec(a, level, polaDipakai) {
    var fi = a.bulat(0, FRAME.length - 1), f = FRAME[fi];
    var langkah = f.langkah;
    var calon = POLA[level].filter(function (x) { return (polaDipakai || []).indexOf('bar-' + x[1]) < 0; });
    var pola = a.pilih(calon.length ? calon : POLA[level]);
    var jenisT = pola[0], jenisS = pola[1];
    for (var coba = 0; coba < 6000; coba++) {
      var T1 = a.kelipatan(Math.ceil(f.skala[0] / langkah) * langkah, f.skala[1], langkah);
      var sh1 = a.kelipatan(15, 85, 5);
      var A1 = T1 * sh1 / 100;
      if (!Number.isInteger(A1)) continue;
      var B1 = T1 - A1;
      var jenisAwal = level === 'sulit' ? a.pilih(['A1', 'share1']) : a.pilih(['A1', 'A1', 'share1']);
      var T2, ket = {}, p = null, x = null;
      var A2, B2, q = null, y = null, sh2 = null, d = null, qA = null, yB = null;
      if (jenisS === 'dua') {
        // bagian A berubah sekian persen, bagian B berubah sekian nominal; total periode 2 = jumlah keduanya
        qA = a.pilih([10, 20, 25, 30, 40, 50]); ket.arahA = a.pilih([1, 1, -1]);
        yB = a.kelipatan(langkah, Math.max(langkah, Math.round(B1 * 0.8 / langkah) * langkah), langkah); ket.arahB = a.pilih([1, 1, -1]);
        A2 = A1 * (100 + ket.arahA * qA) / 100; B2 = B1 + ket.arahB * yB; T2 = A2 + B2;
      } else {
        if (jenisT === 'pct') {
          p = a.pilih(level === 'mudah' ? [10, 20, 25, 30, 40, 50] : [10, 20, 25, 30, 40, 50, 60]);
          ket.arahT = a.pilih([1, 1, -1]);
          T2 = T1 * (100 + ket.arahT * p) / 100;
        } else {
          x = a.kelipatan(langkah, Math.max(langkah, Math.round(T1 * 0.5 / langkah) * langkah), langkah);
          ket.arahT = a.pilih([1, -1]);
          T2 = T1 + ket.arahT * x;
        }
        if (jenisS === 'sama') { B2 = B1 * (100 + ket.arahT * p) / 100; A2 = T2 - B2; }
        else if (jenisS === 'pctB') {
          q = a.pilih([10, 20, 25, 30, 40, 50]); ket.arahS = a.pilih([1, 1, -1]);
          B2 = B1 * (100 + ket.arahS * q) / 100; A2 = T2 - B2;
        } else if (jenisS === 'pctA') {
          q = a.pilih([10, 20, 25, 30, 40, 50]); ket.arahS = a.pilih([1, 1, -1]);
          A2 = A1 * (100 + ket.arahS * q) / 100; B2 = T2 - A2;
        } else if (jenisS === 'nominalB') {
          y = a.kelipatan(langkah, Math.max(langkah, Math.round(B1 * 0.8 / langkah) * langkah), langkah); ket.arahS = a.pilih([1, 1, -1]);
          B2 = B1 + ket.arahS * y; A2 = T2 - B2;
        } else if (jenisS === 'selisih2') {
          // pada periode 2, bagian B lebih besar (arahS = 1) atau lebih kecil daripada bagian A sebesar d
          d = a.kelipatan(langkah / 2, Math.max(langkah / 2, Math.round(T2 * 0.6 / langkah) * langkah), langkah / 2); ket.arahS = a.pilih([1, -1]);
          A2 = (T2 - ket.arahS * d) / 2; B2 = T2 - A2;
        } else {
          sh2 = a.kelipatan(15, 85, 5);
          A2 = T2 * sh2 / 100; B2 = T2 - A2;
        }
      }
      if (T2 < langkah * 2 || T2 % langkah !== 0 || T2 === T1) continue;
      if (!(A2 > 0 && B2 > 0) || !Number.isInteger(A2) || !Number.isInteger(B2)) continue;
      var pA1 = A1 / T1 * 100, pA2 = A2 / T2 * 100;
      if (Math.abs(pA2 - Math.round(pA2 / 5) * 5) > 1e-9) continue;
      if (pA2 < 5 || pA2 > 95) continue;
      if (pA1 === pA2 && jenisS !== 'sama') continue;
      if (jenisAwal === 'share1' && Math.abs(pA1 - sh1) > 1e-9) continue;

      // ----- teks keterangan
      var k1 = f.kat[0], k2 = f.kat[1];
      var butir = [];
      butir.push(k1 + ': ' + f.total + ' = ' + uang(f, T1) + (jenisAwal === 'A1' ? '; ' + f.A + ' = ' + uang(f, A1) + '.' : '; ' + f.A + ' menyumbang ' + sh1 + '% dari total.'));
      if (jenisS === 'dua') {
        butir.push(k2 + ': ' + f.A + ' ' + (ket.arahA > 0 ? 'naik ' : 'turun ') + qA + '% dibandingkan ' + k1 + '.');
        butir.push(k2 + ': ' + f.B + ' ' + (ket.arahB > 0 ? 'meningkat ' : 'menurun ') + uang(f, yB) + ' dari ' + k1 + ' ke ' + k2 + '.');
      } else {
        butir.push(k2 + ': ' + f.total + ' ' + (ket.arahT > 0 ? 'naik ' : 'turun ') + (jenisT === 'pct' ? p + '%' : uang(f, x) + ' dibandingkan ' + k1) + '.');
        var kalimatS = {
          sama: f.B + (ket.arahT > 0 ? ' naik ' : ' turun ') + p + '%',
          pctB: f.B + ' ' + (ket.arahS > 0 ? 'naik ' : 'turun ') + q + '% dibandingkan ' + k1,
          pctA: f.A + ' ' + (ket.arahS > 0 ? 'naik ' : 'turun ') + q + '% dibandingkan ' + k1,
          nominalB: f.B + ' ' + (ket.arahS > 0 ? 'meningkat ' : 'menurun ') + (y != null ? uang(f, y) : '') + ' dari ' + k1 + ' ke ' + k2,
          selisih2: f.B + ' ' + (d != null ? uang(f, d) : '') + (ket.arahS > 0 ? (f.sym ? ' lebih besar' : ' lebih banyak') : (f.sym ? ' lebih kecil' : ' lebih sedikit')) + ' daripada ' + f.A,
          share2: f.A + ' menyumbang ' + sh2 + '% dari ' + f.total + ' pada ' + k2
        }[jenisS];
        butir.push(k2 + ': ' + kalimatS + '.');
      }

      // ----- langkah hitung (rumus eksak untuk validator)
      var param = { T1: String(T1) };
      var tampil = { T1: uang(f, T1) };
      var steps = [];
      if (jenisAwal === 'A1') { param.A1 = String(A1); tampil.A1 = uang(f, A1); } else { param.sh1 = String(sh1); tampil.sh1 = sh1 + '%'; steps.push({ nama: 'A1', rumus: 'T1*sh1%' }); }
      steps.push({ nama: 'B1', rumus: 'T1-A1' });
      if (jenisS === 'dua') {
        param.qA = String(qA); tampil.qA = qA + '%'; param.yB = String(yB); tampil.yB = uang(f, yB);
        steps.push({ nama: 'A2', rumus: 'A1*(100' + (ket.arahA > 0 ? '+' : '-') + 'qA)/100' }, { nama: 'B2', rumus: 'B1' + (ket.arahB > 0 ? '+' : '-') + 'yB' }, { nama: 'T2', rumus: 'A2+B2' });
      } else if (jenisT === 'pct') { param.p = String(p); tampil.p = p + '%'; steps.push({ nama: 'T2', rumus: 'T1*(100' + (ket.arahT > 0 ? '+' : '-') + 'p)/100' }); }
      else { param.x = String(x); tampil.x = uang(f, x); steps.push({ nama: 'T2', rumus: 'T1' + (ket.arahT > 0 ? '+' : '-') + 'x' }); }
      if (jenisS === 'dua') { /* sudah */ }
      else if (jenisS === 'selisih2') { param.d = String(d); tampil.d = uang(f, d); steps.push({ nama: 'A2', rumus: '(T2' + (ket.arahS > 0 ? '-' : '+') + 'd)/2' }, { nama: 'B2', rumus: 'T2-A2' }); }
      else if (jenisS === 'sama') steps.push({ nama: 'B2', rumus: 'B1*(100' + (ket.arahT > 0 ? '+' : '-') + 'p)/100' }, { nama: 'A2', rumus: 'T2-B2' });
      else if (jenisS === 'pctB') { param.q = String(q); tampil.q = q + '%'; steps.push({ nama: 'B2', rumus: 'B1*(100' + (ket.arahS > 0 ? '+' : '-') + 'q)/100' }, { nama: 'A2', rumus: 'T2-B2' }); }
      else if (jenisS === 'pctA') { param.q = String(q); tampil.q = q + '%'; steps.push({ nama: 'A2', rumus: 'A1*(100' + (ket.arahS > 0 ? '+' : '-') + 'q)/100' }, { nama: 'B2', rumus: 'T2-A2' }); }
      else if (jenisS === 'nominalB') { param.y = String(y); tampil.y = uang(f, y); steps.push({ nama: 'B2', rumus: 'B1' + (ket.arahS > 0 ? '+' : '-') + 'y' }, { nama: 'A2', rumus: 'T2-B2' }); }
      else { param.sh2 = String(sh2); tampil.sh2 = sh2 + '%'; steps.push({ nama: 'A2', rumus: 'T2*sh2%' }, { nama: 'B2', rumus: 'T2-A2' }); }
      steps.push({ nama: 'pA1', rumus: 'A1/T1*100' }, { nama: 'pA2', rumus: 'A2/T2*100' });

      // ----- pembahasan: Diketahui, Ditanyakan, Pengerjaan (persamaan "§"), Kesimpulan
      // label persamaan memuat periodenya ("Wilayah Timur Kuartal 2"), jadi setiap baris terbaca sendiri
      var R = Rumus.baris;
      var lA = function (k) { return rTeks(f.namaA + ' ' + k); }, lB = function (k) { return rTeks(f.namaB + ' ' + k); };
      var pem = ['Diketahui'].concat(butir, ['Total diatur dengan kelipatan ' + uang(f, langkah) + ' dan persentase dengan kelipatan 1%.']);
      pem.push('Ditanyakan', Kapital(f.total) + ' setiap ' + f.jenis + ' serta persentase ' + f.A + ' dan ' + f.B + ' pada ' + k1 + ' dan ' + k2 + '.');
      pem.push('Pengerjaan', 'Persentase sebuah bagian selalu dihitung terhadap total pada periode yang sama:',
        R(rTeks('persentase bagian') + ' = \\frac{' + rTeks('nilai bagian') + '}{' + rTeks('total') + '} \\times 100\\%'));
      // periode pertama
      if (jenisAwal === 'A1') {
        pem.push(k1 + ': ' + f.B + ' adalah sisa total setelah dikurangi ' + f.A + '.');
        pem.push(R(lB(k1) + ' = ' + rNilai(f, T1) + ' - ' + rNilai(f, A1) + ' = ' + rNilai(f, B1)));
        pem.push('Kedua bagian dibagi dengan total ' + k1 + ':', rPersen(f.namaA + ' ' + k1, A1, T1, pA1));
      } else {
        pem.push(k1 + ': ' + f.A + ' menyumbang ' + sh1 + '% dari total ' + uang(f, T1) + ', lalu ' + f.B + ' adalah sisanya.');
        pem.push(R(lA(k1) + ' = ' + sh1 + '\\% \\times ' + rNilai(f, T1) + ' = ' + rNilai(f, A1)));
        pem.push(R(lB(k1) + ' = ' + rNilai(f, T1) + ' - ' + rNilai(f, A1) + ' = ' + rNilai(f, B1)));
        pem.push('Persentase ' + f.B + ' diperoleh dari pembagian dengan total ' + k1 + ':');
      }
      pem.push(rPersen(f.namaB + ' ' + k1, B1, T1, 100 - pA1));
      // periode kedua
      var lT2 = rTeks('Total ' + k2);
      if (jenisS === 'dua') {
        pem.push(k2 + ': ' + f.A + ' ' + (ket.arahA > 0 ? 'naik ' : 'turun ') + qA + '% (dikalikan 100% ' + (ket.arahA > 0 ? 'ditambah ' : 'dikurangi ') + qA + '%), sedangkan ' + f.B + ' ' + (ket.arahB > 0 ? 'meningkat ' : 'menurun ') + uang(f, yB) + '.');
        pem.push(R(lA(k2) + ' = ' + rKali(f, A1, ket.arahA, qA) + ' = ' + rNilai(f, A2)));
        pem.push(R(lB(k2) + ' = ' + rTambah(f, B1, ket.arahB, yB) + ' = ' + rNilai(f, B2)));
        pem.push('Total ' + k2 + ' tidak disebut langsung, jadi dihitung dari jumlah kedua bagian:');
        pem.push(R(lT2 + ' = ' + rNilai(f, A2) + ' + ' + rNilai(f, B2) + ' = ' + rNilai(f, T2)));
      } else {
        if (jenisT === 'pct') {
          pem.push(k2 + ': ' + f.total + ' ' + (ket.arahT > 0 ? 'naik ' : 'turun ') + p + '% dari ' + k1 + ', sehingga total ' + k1 + ' dikalikan 100% ' + (ket.arahT > 0 ? 'ditambah ' : 'dikurangi ') + p + '%.');
          pem.push(R(lT2 + ' = ' + rKali(f, T1, ket.arahT, p) + ' = ' + rNilai(f, T2)));
        } else {
          pem.push(k2 + ': ' + f.total + ' ' + (ket.arahT > 0 ? 'naik ' : 'turun ') + uang(f, x) + ' dibandingkan ' + k1 + '.');
          pem.push(R(lT2 + ' = ' + rTambah(f, T1, ket.arahT, x) + ' = ' + rNilai(f, T2)));
        }
        if (jenisS === 'sama' || jenisS === 'pctB') {
          var pp = jenisS === 'sama' ? p : q, ar = jenisS === 'sama' ? ket.arahT : ket.arahS;
          pem.push(Kapital(f.B) + ' ' + (ar > 0 ? 'naik ' : 'turun ') + pp + '% dibandingkan ' + k1 + (jenisS === 'sama' ? ' (sama dengan perubahan total)' : '') + ', lalu ' + f.A + ' adalah sisa total ' + k2 + '.');
          pem.push(R(lB(k2) + ' = ' + rKali(f, B1, ar, pp) + ' = ' + rNilai(f, B2)));
          pem.push(R(lA(k2) + ' = ' + rNilai(f, T2) + ' - ' + rNilai(f, B2) + ' = ' + rNilai(f, A2)));
        } else if (jenisS === 'pctA') {
          pem.push(Kapital(f.A) + ' ' + (ket.arahS > 0 ? 'naik ' : 'turun ') + q + '% dibandingkan ' + k1 + ', lalu ' + f.B + ' adalah sisa total ' + k2 + '.');
          pem.push(R(lA(k2) + ' = ' + rKali(f, A1, ket.arahS, q) + ' = ' + rNilai(f, A2)));
          pem.push(R(lB(k2) + ' = ' + rNilai(f, T2) + ' - ' + rNilai(f, A2) + ' = ' + rNilai(f, B2)));
        } else if (jenisS === 'nominalB') {
          pem.push(Kapital(f.B) + ' ' + (ket.arahS > 0 ? 'meningkat ' : 'menurun ') + uang(f, y) + ' dari ' + k1 + ', lalu ' + f.A + ' adalah sisa total ' + k2 + '.');
          pem.push(R(lB(k2) + ' = ' + rTambah(f, B1, ket.arahS, y) + ' = ' + rNilai(f, B2)));
          pem.push(R(lA(k2) + ' = ' + rNilai(f, T2) + ' - ' + rNilai(f, B2) + ' = ' + rNilai(f, A2)));
        } else if (jenisS === 'selisih2') {
          // bagian yang lebih kecil = (total - selisih) / 2, bagian yang lebih besar = sisanya
          var lebih = ket.arahS > 0, lKecil = lebih ? lA(k2) : lB(k2), lBesar = lebih ? lB(k2) : lA(k2), vKecil = lebih ? A2 : B2, vBesar = lebih ? B2 : A2;
          pem.push('Pada ' + k2 + ', kedua bagian berjumlah ' + uang(f, T2) + ' dan ' + (lebih ? f.B : f.A) + ' lebih besar ' + uang(f, d) + '. Bagian yang lebih kecil diperoleh dari total dikurangi selisih, lalu dibagi dua.');
          pem.push(R(lA(k2) + ' + ' + lB(k2) + ' = ' + rNilai(f, T2)));
          pem.push(R(lBesar + ' - ' + lKecil + ' = ' + rNilai(f, d)));
          pem.push(R(lKecil + ' = \\frac{' + rNilai(f, T2) + ' - ' + rNilai(f, d) + '}{2} = ' + rNilai(f, vKecil)));
          pem.push(R(lBesar + ' = ' + rNilai(f, T2) + ' - ' + rNilai(f, vKecil) + ' = ' + rNilai(f, vBesar)));
        } else {
          pem.push(Kapital(f.A) + ' menyumbang ' + sh2 + '% dari total ' + k2 + ', lalu ' + f.B + ' adalah sisanya.');
          pem.push(R(lA(k2) + ' = ' + sh2 + '\\% \\times ' + rNilai(f, T2) + ' = ' + rNilai(f, A2)));
          pem.push(R(lB(k2) + ' = ' + rNilai(f, T2) + ' - ' + rNilai(f, A2) + ' = ' + rNilai(f, B2)));
        }
      }
      pem.push(jenisS === 'share2' ? 'Persentase ' + f.B + ' diperoleh dari pembagian dengan total ' + k2 + ':' : 'Kedua bagian dibagi dengan total ' + k2 + ':');
      if (jenisS !== 'share2') pem.push(rPersen(f.namaA + ' ' + k2, A2, T2, pA2));
      pem.push(rPersen(f.namaB + ' ' + k2, B2, T2, 100 - pA2));
      pem.push('Kesimpulan',
        'Atur batang ' + k1 + ' ke ' + uang(f, T1) + ' dengan pembagian ' + f.namaA + ' ' + sebutan(pA1) + '% / ' + f.namaB + ' ' + sebutan(100 - pA1) + '%.',
        'Atur batang ' + k2 + ' ke ' + uang(f, T2) + ' dengan pembagian ' + f.namaA + ' ' + sebutan(pA2) + '% / ' + f.namaB + ' ' + sebutan(100 - pA2) + '%.');

      var maksData = Math.max(T1, T2), lg = langkahRapi(maksData * 1.1);
      var sumbuMaks = Math.ceil(maksData * 1.12 / lg) * lg;
      var awalTotal = [T1, Math.max(langkah * 2, Math.round(T1 * 0.67 / langkah) * langkah)];
      if (awalTotal[1] === T2) awalTotal[1] = Math.round(T1 * 0.5 / langkah) * langkah || langkah * 2;
      if (awalTotal[1] === T2 && pA1 === 50 && pA2 === 50) continue;          // tampilan awal tidak boleh sudah benar
      var model = { kategori: f.kat, seri: [f.namaA, f.namaB], sumbuMaks: sumbuMaks, langkah: lg, awalan: f.sym, akhiran: f.akhiran, desimal: 1, judulY: '' };
      var kunci = { total: [T1, T2], persen: [pA1, pA2] };
      var awal = { total: awalTotal, persen: [50, 50] };
      // total batang pertama sengaja sudah sama dengan keterangan (seperti contoh riset), jadi disebut apa adanya
      var sesuai = function (ya) { return ya ? ' (sudah sesuai)' : ''; };
      var kalimatAwal = 'Tampilan awal: ' + k1 + ' total ' + uang(f, awalTotal[0]) + sesuai(awalTotal[0] === T1) + ' dan ' + k2 + ' total ' + uang(f, awalTotal[1]) + sesuai(awalTotal[1] === T2) +
        ', keduanya berpembagian 50% / 50%. Atur yang belum sama dengan kondisi akhir di atas.';
      var kunciTeks = f.kat[0] + ': total ' + uang(f, T1) + ', ' + f.namaA + ' ' + sebutan(pA1) + '% (' + uang(f, A1) + '), ' + f.namaB + ' ' + sebutan(100 - pA1) + '% (' + uang(f, B1) + '). ' +
        f.kat[1] + ': total ' + uang(f, T2) + ', ' + f.namaA + ' ' + sebutan(pA2) + '% (' + uang(f, A2) + '), ' + f.namaB + ' ' + sebutan(100 - pA2) + '% (' + uang(f, B2) + ').';
      return {
        f: f, fi: fi, teks: [f.pembuka].concat(butir), judul: f.judul + ' · Bar Chart',
        pertanyaan: 'Atur ' + f.total + ' dan persentase ' + f.A + ' serta ' + f.B + ' untuk setiap ' + f.jenis + '.',
        model: model, awal: awal, kunci: kunci, kunciTeks: kunciTeks, langkahHitung: steps, param: param, tampil: tampil, pembahasan: pem, kalimatAwal: kalimatAwal,
        nilai: { T1: T1, T2: T2, A1: A1, A2: A2, B1: B1, B2: B2, jenisAwal: jenisAwal, jenisT: jenisT, jenisS: jenisS }, langkahTotal: langkah,
        pola: 'bar-' + jenisS, kategoriRiset: POLA_RISET[jenisS], catatanRiset: CATATAN_RISET[jenisS] || null
      };
    }
    return null;
  }

  function Kapital(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function buat(id, level, benih, opsi) {
    var a = Rng.alat(benih);
    var s = buatSpec(a, level, (opsi || {}).polaDipakai);
    if (!s) return null;
    var ctx = { submateri: 'bar', keluarga: id, level: level, benih: benih };
    var kontrol = [
      { nama: 'total', label: 'Total tiap batang', min: 0, maks: s.model.sumbuMaks, langkah: s.langkahTotal, satuan: (s.f.sym || '') + (s.f.akhiran || '') },
      { nama: 'persen', label: 'Persentase ' + s.f.namaA + ' (sisanya ' + s.f.namaB + ')', min: 0, maks: 100, langkah: 1, satuan: '%' }
    ];
    var gambarAwal = [{ id: 'awal', jenis: 'bar-tumpuk', model: s.model, state: s.awal, judul: 'Tampilan awal' }];
    var gambarKunci = [{ id: 'kunci', jenis: 'bar-tumpuk', model: s.model, state: s.kunci, judul: 'Kondisi akhir (kunci)' }];
    var butir = Butir.rakitIsian(ctx, {
      jenisSoal: 'Bar Chart (tes interaktif): ' + JENIS[s.nilai.jenisS],
      judul: s.judul, teks: s.teks, pertanyaan: s.pertanyaan,
      perintah: 'Geser batang untuk mengatur total dan geser garis pembatas bagian untuk mengatur persentasenya.',
      gambar: gambarAwal, gambarPembahasan: gambarKunci,
      isian: { jenis: 'bar-tumpuk', kontrol: kontrol, awal: s.awal, kunci: s.kunci, model: s.model, kategori: s.f.kat, seri: [s.f.namaA, s.f.namaB] },
      kunciTeks: s.kunciTeks,
      langkah: s.langkahHitung,
      pembahasan: s.pembahasan.concat([s.kalimatAwal]),
      model: {
        param: s.param, tampil: s.tampil, toleransi: 1e-9, topik: 'Bar Chart',
        kunciLangkah: { total: ['T1', 'T2'], persen: ['pA1', 'pA2'] }, langkahTotal: s.langkahTotal, langkahPersen: 5, sumbuMaks: s.model.sumbuMaks
      },
      sidik: { inti: 'pn-bar|' + s.fi + '|' + [s.nilai.T1, s.nilai.T2, s.nilai.A1, s.nilai.A2].join(','), param: [s.nilai.T1, s.nilai.T2, s.nilai.A1, s.nilai.A2], entitas: s.nilai.jenisT + s.nilai.jenisS + s.nilai.jenisAwal }
    });
    butir.pola = s.pola;
    butir.kategoriRiset = s.kategoriRiset;
    if (s.catatanRiset) butir.catatanRiset = s.catatanRiset;
    return butir;
  }

  var JENIS = {
    sama: 'total dan satu bagian berubah dengan persen yang sama',
    pctA: 'satu bagian berubah sekian persen, bagian lain dicari',
    pctB: 'satu bagian berubah sekian persen, bagian lain dicari',
    nominalB: 'satu bagian berubah sekian nominal, bagian lain dicari',
    share2: 'persen bagian periode kedua diketahui',
    selisih2: 'selisih nominal antarbagian pada periode kedua',
    dua: 'kedua bagian berubah, total periode kedua dicari'
  };

  var KELUARGA = [{ id: 'bar-tumpuk', nama: 'Batang bertumpuk dua bagian', submateri: 'bar' }];

  return { KELUARGA: KELUARGA, buat: buat, FRAME: FRAME };
});
