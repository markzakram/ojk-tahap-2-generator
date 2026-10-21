/*
 * pn-tabel.js — Penalaran Numerik > Table.
 *
 * Satu tab per orang (Orang A-D). Di tiap tab ada tabel datanya dan peserta
 * memilih satu pilihan untuk orang itu. Dua bentuk, mengikuti contoh riset:
 *
 *   target-2-opsi   "Mencapai target" atau "Tidak mencapai target": target tercapai
 *                   bila DUA syarat (total penjualan minimal dan rata-rata sekian
 *                   persen di atas target) terpenuhi sekaligus
 *   komisi-3-opsi   kategori komisi menurut rata-rata nilai penjualan bersih
 *                   (3 atau 4 kategori)
 *
 * Aturan tiap orang dihitung dari sel tabel yang digambar; validator membaca sel
 * itu dari SVG tiap tab dan menerapkan aturan yang sama dari awal. Keempat orang
 * sengaja memberi hasil yang beragam, dan yang "tidak" gagal pada syarat yang
 * berbeda-beda, sebagian dengan selisih tipis.
 *
 * Semua nominal memakai USD ($), sesuai panduan revisi. Pembahasan: Diketahui, Ditanyakan,
 * Pengerjaan (rumus umum lalu hitungan tiap orang sebagai persamaan "§", termasuk selang
 * kategori atau kedua syarat beserta angkanya), dan Kesimpulan berupa pilihan tiap tab.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./rng.js'), require('./format.js'), require('./butir.js'), require('./rumus.js'));
    module.exports = api;
  } else {
    api = factory(root.Rng, root.Fmt, root.Butir, root.Rumus);
    root.PnTabel = api;
  }
})(typeof self !== 'undefined' ? self : this, function (Rng, Fmt, Butir, Rumus) {
  'use strict';

  var ORANG = ['Orang A', 'Orang B', 'Orang C', 'Orang D'];
  function mt(sim, v) { return sim + Fmt.angka(v); }

  // ----- notasi persamaan pembahasan (lihat rumus.js)
  function rAngka(v, d) { return Fmt.angka(v, { desimal: d == null ? 2 : d }).replace(',', '{,}'); }
  function rUang(sim, v, d) { return '\\' + sim + rAngka(v, d); }
  function rTeks(t) { return '\\text{' + t + '}'; }

  // ------------------------------------------------------------ target 2 opsi

  var TEMA_TARGET = [
    { id: 'penjualan', judul: 'Penjualan', sim: '$', kolom: ['Bulan', 'Penjualan', 'Target'], bulan: ['Juli', 'Agustus', 'September'], noun: 'penjualan', nounTarget: 'target penjualan', aksi: 'target penjualan kuartal' },
    { id: 'kredit', judul: 'Penyaluran Kredit', sim: '$', kolom: ['Bulan', 'Realisasi', 'Target'], bulan: ['Januari', 'Februari', 'Maret'], noun: 'penyaluran kredit', nounTarget: 'target penyaluran kredit', aksi: 'target penyaluran kredit kuartal' },
    { id: 'premi', judul: 'Premi Asuransi', sim: '$', kolom: ['Bulan', 'Premi diterima', 'Target'], bulan: ['April', 'Mei', 'Juni'], noun: 'premi yang diterima', nounTarget: 'target premi', aksi: 'target premi kuartal' }
  ];

  /** Bagi `jumlah` (kelipatan 500) menjadi tiga bulan dengan sebaran acak. */
  function bagiTiga(a, jumlah) {
    var unit = 500, n = jumlah / unit, x, y;
    for (var c = 0; c < 50; c++) {
      x = a.bulat(Math.ceil(n * 0.15), Math.floor(n * 0.5)); y = a.bulat(Math.ceil(n * 0.15), Math.floor(n * 0.5));
      if (n - x - y >= Math.ceil(n * 0.12)) return [x * unit, y * unit, (n - x - y) * unit];
    }
    return [Math.round(n / 3) * unit, Math.round(n / 3) * unit, (n - 2 * Math.round(n / 3)) * unit];
  }

  function targetDuaOpsi(a, level) {
    var ti = a.bulat(0, TEMA_TARGET.length - 1), tm = TEMA_TARGET[ti];
    for (var coba = 0; coba < 500; coba++) {
      var M = a.kelipatan(60, 100, 5) * 1000, u = a.pilih([20, 25, 50]);
      var pola = level === 'mudah' ? ['ya', 'tidak1', 'ya', 'tidak2'] : a.kocok(['ya', 'tidak1', 'tidak2', a.pilih(['ya', 'tidak1', 'tidak2'])]);
      if (level === 'mudah') pola = a.kocok(pola);
      var orang = [], gagal = false;
      for (var i = 0; i < 4 && !gagal; i++) {
        var jenis = pola[i], Ts, Ss;
        var perluDua = (100 + u) / 100;
        if (jenis === 'ya') {
          Ts = a.kelipatan(Math.ceil(M * 0.35 / perluDua / 500) * 500, Math.floor(M * 0.8 / 500) * 500, 500);
          var dasar = Math.max(M, Ts * perluDua);
          Ss = Math.ceil(dasar * a.antara(1.02, 1.18) / 500) * 500;
        } else if (jenis === 'tidak1') {          // total di bawah minimal, rasio terpenuhi
          Ts = a.kelipatan(Math.ceil(M * 0.25 / 500) * 500, Math.floor(M * 0.55 / 500) * 500, 500);
          Ss = Math.floor(M * a.antara(0.9, 0.99) / 500) * 500;
          if (Ss < Ts * perluDua) { gagal = true; continue; }
        } else {                                   // total cukup, rasio kurang
          Ts = a.kelipatan(Math.ceil(M * 0.7 / 500) * 500, Math.floor(M * 1.1 / 500) * 500, 500);
          Ss = Math.ceil(Math.max(M, Ts * 0.9) * a.antara(1.0, 1.08) / 500) * 500;
          if (!(Ss < Ts * perluDua) || Ss < M) { gagal = true; continue; }
        }
        if (Ts % 500 !== 0 || Ss % 500 !== 0) { gagal = true; continue; }
        var t = bagiTiga(a, Ts), s = bagiTiga(a, Ss);
        var c1 = Ss >= M, c2 = Ss * 100 >= (100 + u) * Ts;
        orang.push({ target: t, jual: s, c1: c1, c2: c2, hasil: c1 && c2 ? 0 : 1, jenis: jenis, Ts: Ts, Ss: Ss });
      }
      if (gagal || orang.length < 4) continue;
      var jmlYa = orang.filter(function (o) { return o.hasil === 0; }).length;
      if (jmlYa < 1 || jmlYa > 3) continue;
      if (orang.some(function (o, k) { return orang.some(function (p, l) { return l !== k && p.Ss === o.Ss && p.Ts === o.Ts; }); })) continue;

      var aturan = [
        'Target ' + tm.aksi.replace('target ', '') + ' tercapai apabila:',
        '• Total ' + tm.noun + ' selama tiga bulan sekurang-kurangnya ' + mt(tm.sim, M) + ', DAN',
        '• Rata-rata ' + tm.noun + ' selama kuartal tersebut sekurang-kurangnya ' + u + '% lebih tinggi daripada rata-rata ' + tm.nounTarget + ' pada tiga bulan yang sama.'
      ];
      var tabs = orang.map(function (o, k) {
        return {
          judul: null, kolom: tm.kolom,
          baris: tm.bulan.map(function (b, m) { return { label: b, sel: [mt(tm.sim, o.jual[m]), mt(tm.sim, o.target[m])] }; }),
          statusBaris: 'Status target', tab: { nama: ORANG, aktif: k }
        };
      });
      var tabsKunci = tabs.map(function (m, k) {
        return Object.assign({}, m, { status: orang[k].hasil === 0 ? 'Mencapai target' : 'Tidak mencapai target' });
      });
      var pil = ['Mencapai target', 'Tidak mencapai target'];
      var R = Rumus.baris, sim = tm.sim, faktor = rAngka((100 + u) / 100);
      var lJual = rTeks('total ' + tm.noun), lTarget = rTeks('total ' + tm.nounTarget);
      var pem = ['Diketahui',
        'Syarat 1: total ' + tm.noun + ' selama tiga bulan sekurang-kurangnya ' + mt(sim, M) + '.',
        'Syarat 2: rata-rata ' + tm.noun + ' sekurang-kurangnya ' + u + '% lebih tinggi daripada rata-rata ' + tm.nounTarget + ' pada tiga bulan yang sama.',
        'Kedua syarat harus terpenuhi. Data ' + tm.kolom[1].toLowerCase() + ' dan target bulan ' + Fmt.daftarKata(tm.bulan) + ' tiap orang ada pada tab ' + ORANG[0] + ' sampai ' + ORANG[3] + '.',
        'Ditanyakan',
        'Apakah setiap orang ' + pil[0].toLowerCase() + ' atau ' + pil[1].toLowerCase() + ' ' + tm.aksi.replace('target ', '') + '.',
        'Pengerjaan',
        'Jumlahkan data tiga bulan untuk setiap orang:',
        R(lJual + ' = ' + tm.bulan.map(function (b) { return rTeks(tm.noun + ' ' + b); }).join(' + ')),
        'Sekurang-kurangnya ' + u + '% lebih tinggi berarti sekurang-kurangnya target dikalikan faktor berikut:',
        R('100\\% + ' + u + '\\% = ' + (100 + u) + '\\% = ' + faktor),
        'Kedua rata-rata dibagi dengan banyak bulan yang sama (3), jadi syarat 2 cukup diperiksa dengan total:',
        R('\\frac{' + lJual + '}{3} \\ge ' + faktor + ' \\times \\frac{' + lTarget + '}{3} \\to ' + lJual + ' \\ge ' + faktor + ' \\times ' + lTarget)];
      orang.forEach(function (o, k) {
        var batas2 = o.Ts * (100 + u) / 100;
        pem.push(ORANG[k] + ':');
        pem.push(R(lJual + ' = ' + o.jual.map(function (v) { return rUang(sim, v); }).join(' + ') + ' = ' + rUang(sim, o.Ss)));
        pem.push(R(lTarget + ' = ' + o.target.map(function (v) { return rUang(sim, v); }).join(' + ') + ' = ' + rUang(sim, o.Ts)));
        pem.push(R(rTeks('batas syarat 2') + ' = ' + faktor + ' \\times ' + rUang(sim, o.Ts) + ' = ' + rUang(sim, batas2)));
        pem.push(R(rTeks('syarat 1: ') + rUang(sim, o.Ss) + (o.c1 ? ' \\ge ' : ' < ') + rUang(sim, M) + ' \\to ' + rTeks(o.c1 ? 'terpenuhi' : 'tidak terpenuhi')));
        pem.push(R(rTeks('syarat 2: ') + rUang(sim, o.Ss) + (o.c2 ? ' \\ge ' : ' < ') + rUang(sim, batas2) + ' \\to ' + rTeks(o.c2 ? 'terpenuhi' : 'tidak terpenuhi')));
        pem.push(ORANG[k] + ': ' + (o.c1 && o.c2 ? 'kedua syarat terpenuhi, jadi ' : (!o.c1 && !o.c2 ? 'kedua syarat tidak terpenuhi' : 'syarat ' + (o.c1 ? '2' : '1') + ' tidak terpenuhi') + ', jadi ') + pil[o.hasil].toLowerCase() + '.');
      });
      pem.push('Kesimpulan', 'Pilih ' + orang.map(function (o, k) { return Fmt.huruf(o.hasil) + ' (' + pil[o.hasil] + ') pada tab ' + ORANG[k]; }).join('; ') + '.');
      var kunciTeks = orang.map(function (o, k) { return ORANG[k] + ': ' + pil[o.hasil]; }).join('. ') + '.';
      return {
        ti: ti, tm: tm, pil: pil, orang: orang, tabs: tabs, tabsKunci: tabsKunci, M: M, u: u,
        teks: aturan, judul: tm.judul + ' · Table (2 opsi)',
        pertanyaan: 'Tentukan apakah setiap orang mencapai ' + tm.aksi + 'nya. Setiap tabel di bawah mewakili tampilan tabel ketika tab nama tersebut dipilih.',
        kunciIdx: orang.map(function (o) { return o.hasil; }), kunciTeks: kunciTeks, pembahasan: pem,
        aturan: { jenis: 'dua-syarat', M: M, u: u, baris: 3, kolomJual: 1, kolomTarget: 2, pilihan: pil },
        pola: 'tabel-target-' + tm.id, kategoriRiset: 'acuan'
      };
    }
    return null;
  }

  // ------------------------------------------------------------ komisi 3-4 opsi

  /*
   * Istilah per tema dipakai SAMA di ketentuan, label tabel, dan pembahasan: kotor = jumlah per minggu
   * sebelum pembatalan (seperti yang tertulis di tabel), batal = yang dibatalkan, bersih = kotor dikurangi
   * pembatalan seminggu, nilai = rata-rata yang menentukan kategori, total = nilai uang per minggu.
   * `skala` mengalikan batas kategori dan total uang supaya nominal dolarnya wajar untuk temanya
   * (nilai satu kredit ribuan dolar, satu penjualan atau premi puluhan sampai ratusan dolar).
   */
  var TEMA_KOMISI = [
    { id: 'penjualan', judul: 'Komisi', sim: '$', skala: 1, nol: 'Tanpa komisi', hari: 5, status: 'Komisi yang diperoleh', noun: 'karyawan',
      istilah: { kotor: 'penjualan per minggu', batal: 'pembatalan', bersih: 'penjualan bersih', nilai: 'rata-rata nilai penjualan', total: 'total pendapatan per minggu' },
      label: ['Total pendapatan per minggu ($)', 'Penjualan per minggu', 'Rata-rata pembatalan per hari'] },
    { id: 'asuransi', judul: 'Insentif Agen Asuransi', sim: '$', skala: 1, nol: 'Tanpa insentif', hari: 5, status: 'Insentif yang diperoleh', noun: 'agen',
      istilah: { kotor: 'polis terjual per minggu', batal: 'polis batal', bersih: 'polis bersih', nilai: 'rata-rata premi per polis bersih', total: 'total premi per minggu' },
      label: ['Total premi per minggu ($)', 'Polis terjual per minggu (sebelum pembatalan)', 'Rata-rata polis batal per hari'] },
    { id: 'kredit', judul: 'Bonus Petugas Kredit', sim: '$', skala: 100, nol: 'Tanpa bonus', hari: 6, status: 'Bonus yang diperoleh', noun: 'petugas',
      istilah: { kotor: 'pengajuan per minggu', batal: 'pengajuan batal', bersih: 'pengajuan bersih', nilai: 'rata-rata nilai kredit per pengajuan bersih', total: 'total kredit cair per minggu' },
      label: ['Total kredit cair per minggu ($)', 'Pengajuan per minggu (sebelum pembatalan)', 'Rata-rata pengajuan batal per hari'] }
  ];

  function kapital(t) { return t.charAt(0).toUpperCase() + t.slice(1); }

  function komisi(a, level) {
    var ti = a.bulat(0, TEMA_KOMISI.length - 1), tm = TEMA_KOMISI[ti];
    var tingkat = level === 'sulit' ? 4 : (level === 'mudah' ? 3 : a.pilih([3, 4]));
    for (var coba = 0; coba < 800; coba++) {
      var b1 = a.pilih([41, 50, 60, 35, 45]), b2 = b1 + a.pilih([40, 50, 60, 55]), b3 = b2 + a.pilih([40, 50, 60]);
      var batas = tingkat === 3 ? [b1, b2] : [b1, b2, b3];
      var komisiNama = tingkat === 3 ? [tm.nol, '5%', '10%'] : [tm.nol, '3%', '6%', '10%'];
      var tierAwal = [];
      for (var q = 0; q < tingkat; q++) tierAwal.push(q);
      var tiers = a.kocok(tierAwal.concat([a.pilih(tierAwal)])).slice(0, 4);
      if (tingkat === 4) tiers = a.kocok([0, 1, 2, 3]);
      var orang = [], gagal = false;
      for (var i = 0; i < 4 && !gagal; i++) {
        var tr = tiers[i];
        var lo = tr === 0 ? 8 : batas[tr - 1] + 3, hi = tr === tingkat - 1 ? batas[tingkat - 2] + 80 : batas[tr] - 3;
        if (hi <= lo) { gagal = true; continue; }
        var net = a.bulat(8, 45), cancel = a.bulat(0, 5);
        var avg = a.antara(lo, hi);
        var rev = Math.round(avg * net / 10) * 10;
        if (rev <= 0) { gagal = true; continue; }
        var avgNyata = rev / net;
        var tierNyata = 0;
        batas.forEach(function (bb, k) { if (avgNyata >= bb) tierNyata = k + 1; });
        if (tierNyata !== tr) { gagal = true; continue; }
        // jarak dari batas minimal 2 satuan agar tidak ambigu
        if (batas.some(function (bb) { return Math.abs(avgNyata - bb) < 2; })) { gagal = true; continue; }
        var sales = net + cancel * tm.hari;
        orang.push({ rev: rev, sales: sales, cancel: cancel, net: net, avg: avgNyata, tier: tr });
      }
      if (gagal || orang.length < 4) continue;
      if (orang.some(function (o, k) { return orang.some(function (p, l) { return l !== k && p.rev === o.rev && p.sales === o.sales; }); })) continue;
      // nominal dolar sesuai tema: batas kategori dan total uang dikalikan skala (kategorinya tidak berubah)
      var sk = tm.skala || 1;
      batas = batas.map(function (x) { return x * sk; });
      orang.forEach(function (o) { o.rev *= sk; o.avg = o.rev / o.net; });
      var sim = tm.sim;
      var ist = tm.istilah;
      var ketentuan = [
        'Ketentuan penentuan ' + tm.status.toLowerCase() + ':',
        '• ' + kapital(ist.bersih) + ' per minggu = ' + ist.kotor + ' dikurangi ' + ist.batal + ' per minggu, dengan ' + tm.hari + ' hari kerja per minggu. Angka ' + ist.kotor + ' pada tabel belum dikurangi ' + ist.batal + '.',
        '• ' + kapital(ist.nilai) + ' = ' + ist.total + ' dibagi ' + ist.bersih + ' per minggu.',
        '• Jika ' + ist.nilai + ' kurang dari ' + mt(sim, batas[0]) + ': ' + komisiNama[0].toLowerCase() + '.'
      ];
      for (var kk = 1; kk < tingkat; kk++) {
        ketentuan.push('• Jika ' + ist.nilai + ' ' + mt(sim, batas[kk - 1]) + ' atau lebih' + (kk < tingkat - 1 ? ', tetapi kurang dari ' + mt(sim, batas[kk]) : '') + ': ' + komisiNama[kk] + '.');
      }
      var tabs = orang.map(function (o, k) {
        return {
          kolom: ['Keterangan', 'Nilai'],
          baris: [
            { label: tm.label[0], sel: [Fmt.angka(o.rev)] },
            { label: tm.label[1], sel: [String(o.sales)] },
            { label: tm.label[2], sel: [String(o.cancel)] }
          ],
          statusBaris: tm.status, tab: { nama: ORANG, aktif: k }
        };
      });
      var tabsKunci = tabs.map(function (m, k) { return Object.assign({}, m, { status: komisiNama[orang[k].tier] }); });
      // pembahasan: rumus umum, lalu tiap orang batal -> bersih -> rata-rata (pecahan) -> selang kategori
      var R = Rumus.baris, jenisImbal = tm.status.split(' ')[0].toLowerCase();
      var lBatal = rTeks(ist.batal + ' per minggu'), lBersih = rTeks(ist.bersih), lNilai = rTeks(ist.nilai);
      var namaKategori = function (t) { return t === 0 ? rTeks(komisiNama[0].toLowerCase()) : rTeks(jenisImbal + ' ') + komisiNama[t].replace('%', '\\%'); };
      var pem = ['Diketahui',
        'Setiap tab memuat ' + tm.label[0].replace(' ($)', '').toLowerCase() + ' (dalam dolar), ' + ist.kotor + ' sebelum pembatalan, dan rata-rata ' + ist.batal + ' per hari; satu minggu terdiri dari ' + tm.hari + ' hari kerja.',
        'Batas kategori menurut ' + ist.nilai + ': ' + Fmt.daftarKata(batas.map(function (x) { return mt(sim, x); })) + ' (lihat ketentuan).',
        'Ditanyakan',
        'Kategori ' + jenisImbal + ' yang tepat untuk ' + Fmt.daftarKata(ORANG) + '.',
        'Pengerjaan',
        'Rumus yang dipakai untuk setiap orang:',
        R(lBatal + ' = ' + rTeks(ist.batal + ' per hari') + ' \\times ' + tm.hari),
        R(lBersih + ' = ' + rTeks(ist.kotor) + ' - ' + lBatal),
        R(lNilai + ' = \\frac{' + rTeks(ist.total) + '}{' + lBersih + '}'),
        'Hasil rata-rata lalu dicocokkan dengan selang kategori pada ketentuan.'];
      orang.forEach(function (o, k) {
        var tepat = Math.round(o.rev * 100) % o.net === 0, rata = rUang(sim, o.avg);
        var selang = o.tier === 0 ? rata + ' < ' + rUang(sim, batas[0])
          : o.tier === tingkat - 1 ? rata + ' \\ge ' + rUang(sim, batas[tingkat - 2])
            : rUang(sim, batas[o.tier - 1]) + ' \\le ' + rata + ' < ' + rUang(sim, batas[o.tier]);
        pem.push(ORANG[k] + ':');
        pem.push(R(lBatal + ' = ' + o.cancel + ' \\times ' + tm.hari + ' = ' + (o.cancel * tm.hari)));
        pem.push(R(lBersih + ' = ' + o.sales + ' - ' + (o.cancel * tm.hari) + ' = ' + o.net));
        pem.push(R(lNilai + ' = \\frac{' + rUang(sim, o.rev) + '}{' + o.net + '} ' + (tepat ? '= ' : '\\approx ') + rata));
        pem.push(R(selang + ' \\to ' + namaKategori(o.tier)));
      });
      pem.push('Kesimpulan', 'Pilih ' + orang.map(function (o, k) { return Fmt.huruf(o.tier) + ' (' + komisiNama[o.tier] + ') pada tab ' + ORANG[k]; }).join('; ') + '.');
      var kunciTeks = orang.map(function (o, k) { return ORANG[k] + ': ' + komisiNama[o.tier]; }).join('. ') + '.';
      return {
        ti: ti, tm: tm, pil: komisiNama, orang: orang, tabs: tabs, tabsKunci: tabsKunci,
        teks: ketentuan, judul: tm.judul + ' · Table (' + tingkat + ' opsi)',
        pertanyaan: 'Tentukan kategori ' + tm.status.toLowerCase().replace(' yang diperoleh', '') + ' yang tepat untuk setiap ' + tm.noun + '. Setiap tabel di bawah mewakili tampilan tabel ketika tab nama tersebut dipilih.',
        kunciIdx: orang.map(function (o) { return o.tier; }), kunciTeks: kunciTeks, pembahasan: pem,
        aturan: { jenis: 'komisi', batas: batas, hari: tm.hari, pilihan: komisiNama },
        pola: 'tabel-komisi-' + tm.id,
        // contoh riset memuat tiga kategori; empat kategori adalah modifikasi tim
        kategoriRiset: tingkat === 3 ? 'acuan' : 'pengayaan',
        catatanRiset: tingkat === 3 ? null : 'Contoh riset Table Komisi memuat tiga kategori; empat kategori adalah modifikasi tim, bukan bukti bahwa empat opsi muncul pada PCAM.'
      };
    }
    return null;
  }

  function rakit(id, level, benih, s, jenisSoal) {
    var ctx = { submateri: 'tabel', keluarga: id, level: level, benih: benih };
    var gambar = s.tabs.map(function (m, k) { return { id: 'tab-' + k, jenis: 'tabel', model: m, judul: ORANG[k] }; });
    var gambarKunci = s.tabsKunci.map(function (m, k) { return { id: 'kunci-' + k, jenis: 'tabel', model: m, judul: ORANG[k] + ' (kunci)' }; });
    var butir = Butir.rakitIsian(ctx, {
      jenisSoal: jenisSoal,
      judul: s.judul, teks: s.teks, pertanyaan: s.pertanyaan,
      perintah: 'Pilih satu pilihan untuk setiap tab. Setiap tabel mewakili tampilan tabel ketika tab nama tersebut dipilih.',
      gambar: gambar, gambarPembahasan: gambarKunci,
      isian: { jenis: 'tabel', tab: ORANG, pilihan: s.pil, kunci: s.kunciIdx, awal: [null, null, null, null], tabel: s.tabs },
      opsi: s.pil, kunciTeks: s.kunciTeks,
      langkah: [],
      pembahasan: s.pembahasan,
      model: { param: {}, tampil: {}, toleransi: 0, topik: 'Table', aturan: s.aturan },
      sidik: { inti: 'pn-tabel|' + id + '|' + s.ti + '|' + JSON.stringify(s.tabs.map(function (m) { return m.baris.map(function (b) { return b.sel.join('/'); }).join(';'); })), param: s.orang.map(function (o) { return o.rev || o.Ss; }), entitas: s.ti + id }
    });
    butir.pola = s.pola;
    butir.kategoriRiset = s.kategoriRiset;
    if (s.catatanRiset) butir.catatanRiset = s.catatanRiset;
    return butir;
  }

  function buat(id, level, benih) {
    var a = Rng.alat(benih);
    if (id === 'target-2-opsi') {
      var s = targetDuaOpsi(a, level);
      return s ? rakit(id, level, benih, s, 'Table, 2 opsi (satu tab per orang)') : null;
    }
    var k = komisi(a, level);
    return k ? rakit(id, level, benih, k, 'Table, 3-4 opsi (satu tab per orang)') : null;
  }

  var KELUARGA = [
    { id: 'target-2-opsi', nama: 'Mencapai target atau tidak (2 opsi)', submateri: 'tabel' },
    { id: 'komisi-3-opsi', nama: 'Kategori komisi (3-4 opsi)', submateri: 'tabel' }
  ];

  return { KELUARGA: KELUARGA, buat: buat, ORANG: ORANG };
});
