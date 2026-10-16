/*
 * pn-pie.js — Penalaran Numerik > Pie Chart.
 *
 * Empat irisan. Peserta menggeser batas irisan sampai persentasenya sesuai
 * keterangan. Dua bentuk, mengikuti contoh riset:
 *
 *   penuh    informasi penuh: satu jumlah diketahui, tiga lainnya dinyatakan
 *            relatif (sama, lebih/kurang sekian, atau sekian kali)
 *   kosong   satu informasi kosong: salah satu irisan menjadi dasar yang tidak
 *            disebut jumlahnya; tiga lainnya "sekian kali" dasar itu, dan yang
 *            diketahui adalah jumlah seluruhnya
 *
 * Keterangan ditulis sebagai relasi terstruktur (`model.relasi`) sekaligus
 * kalimat. Validator menyelesaikan sistem persamaan linear itu dari nol dengan
 * pecahan eksak dan memastikan jawabannya tunggal dan bulat persen.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./rng.js'), require('./format.js'), require('./butir.js'));
    module.exports = api;
  } else {
    api = factory(root.Rng, root.Fmt, root.Butir);
    root.PnPie = api;
  }
})(typeof self !== 'undefined' ? self : this, function (Rng, Fmt, Butir) {
  'use strict';

  var WARNA = ['biru', 'hijau', 'jingga', 'merah'];

  var FRAME = [
    { id: 'komite', gaya: 'subjek', judul: 'Informasi', unit: 'sukarelawan', grup: ['Komite Makanan', 'Komite Dekorasi', 'Komite Tempat', 'Komite Pemasaran'],
      pembuka: function (N) { return 'Sekelompok ' + N + ' karyawan menjadi sukarelawan untuk merencanakan sebuah acara.'; },
      tanya: 'Sesuaikan diagram lingkaran untuk menunjukkan proporsi sukarelawan pada setiap komite.', N: [20, 25, 40, 50] },
    { id: 'kelas', gaya: 'subjek', judul: 'Peserta Pelatihan', unit: 'peserta', grup: ['Kelas Akuntansi', 'Kelas Perpajakan', 'Kelas Audit', 'Kelas Manajemen Risiko'],
      pembuka: function (N) { return 'Sebuah lembaga pelatihan memiliki ' + N + ' peserta yang tersebar di empat kelas.'; },
      tanya: 'Sesuaikan diagram lingkaran untuk menunjukkan proporsi peserta pada setiap kelas.', N: [20, 25, 40, 50] },
    { id: 'armada', gaya: 'subjek', judul: 'Armada Kendaraan', unit: 'kendaraan', grup: ['Sepeda motor', 'Mobil boks', 'Truk', 'Van'],
      pembuka: function (N) { return 'Sebuah perusahaan ekspedisi memiliki ' + N + ' kendaraan operasional.'; },
      tanya: 'Sesuaikan diagram lingkaran untuk menunjukkan proporsi tiap jenis kendaraan.', N: [20, 25, 40, 50] },
    { id: 'bingkai', gaya: 'jenis', judul: 'Bingkai Foto', unit: 'bingkai', grup: ['kayu', 'logam', 'batu', 'plastik'],
      pembuka: function (N, g) { return 'Sebuah produsen menghasilkan ' + Fmt.angka(N) + ' bingkai foto. Kategorinya adalah bingkai ' + g.map(function (x, i) { return x + ' (' + WARNA[i] + ')'; }).join(', ').replace(/, ([^,]+)$/, ', dan $1') + '.'; },
      tanya: 'Sesuaikan diagram lingkaran untuk menunjukkan persentase setiap jenis bingkai.', N: [100000, 50000, 20000, 25000] },
    { id: 'pesanan', gaya: 'jenis', judul: 'Pesanan Toko Daring', unit: 'pesanan', grup: ['kemeja', 'celana', 'jaket', 'topi'],
      pembuka: function (N, g) { return 'Sebuah toko daring menerima ' + Fmt.angka(N) + ' pesanan dalam satu bulan. Pesanan dikelompokkan menjadi ' + g.map(function (x, i) { return x + ' (' + WARNA[i] + ')'; }).join(', ').replace(/, ([^,]+)$/, ', dan $1') + '.'; },
      tanya: 'Sesuaikan diagram lingkaran untuk menunjukkan persentase tiap kelompok pesanan.', N: [50000, 20000, 10000, 5000] },
    { id: 'kemasan', gaya: 'jenis', judul: 'Produksi Kemasan', unit: 'kemasan', grup: ['botol', 'kaleng', 'kardus', 'kantong'],
      pembuka: function (N, g) { return 'Sebuah pabrik memproduksi ' + Fmt.angka(N) + ' kemasan. Jenisnya adalah ' + g.map(function (x, i) { return x + ' (' + WARNA[i] + ')'; }).join(', ').replace(/, ([^,]+)$/, ', dan $1') + '.'; },
      tanya: 'Sesuaikan diagram lingkaran untuk menunjukkan persentase setiap jenis kemasan.', N: [100000, 40000, 20000, 50000] }
  ];

  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a; }

  /** Kalimat satu relasi menurut gaya frame. */
  function kalimat(f, r) {
    var G = f.grup[r.g], R = r.r != null ? f.grup[r.r] : null;
    var nomG = f.gaya === 'subjek' ? G : 'jumlah ' + f.unit + ' ' + G, nomR = f.gaya === 'subjek' ? R : (R ? 'jumlah ' + f.unit + ' ' + R : null);
    var kap = function (s) { return s.charAt(0).toUpperCase() + s.slice(1); };
    switch (r.tipe) {
      case 'nilai': return f.gaya === 'subjek' ? G + ' memiliki ' + Fmt.angka(r.v) + ' ' + f.unit + '.' : kap(nomG) + ' adalah ' + Fmt.angka(r.v) + '.';
      case 'sama': return f.gaya === 'subjek' ? G + ' memiliki jumlah ' + f.unit + ' yang sama dengan ' + R + '.' : kap(nomG) + ' sama dengan ' + nomR + '.';
      case 'lebih': return f.gaya === 'subjek' ? G + ' memiliki ' + Fmt.angka(r.k) + ' ' + f.unit + ' lebih banyak daripada ' + R + '.' : kap(nomG) + ' adalah ' + Fmt.angka(r.k) + ' lebih banyak daripada ' + nomR + '.';
      case 'kurang': return f.gaya === 'subjek' ? G + ' memiliki ' + Fmt.angka(r.k) + ' ' + f.unit + ' lebih sedikit daripada ' + R + '.' : kap(nomG) + ' adalah ' + Fmt.angka(r.k) + ' lebih sedikit daripada ' + nomR + '.';
      default: return (f.gaya === 'subjek' ? 'Jumlah ' + f.unit + ' ' + G : kap(nomG)) + ' adalah ' + r.k + ' kali ' + (f.gaya === 'subjek' ? 'jumlah ' + f.unit + ' ' + R : nomR) + '.';
    }
  }

  function buat(id, level, benih) {
    var a = Rng.alat(benih);
    var bentuk = id === 'pie-kosong' ? 'kosong' : 'penuh';
    var cocok = FRAME.filter(function (f) { return bentuk === 'kosong' ? f.gaya === 'jenis' : true; });
    var f = a.pilih(cocok);
    for (var coba = 0; coba < 6000; coba++) {
      var N = a.pilih(f.N), cnt, rel = [], dasar = -1, faktor = 1, dasarN = 0;
      if (bentuk === 'penuh') {
        dasarN = a.pilih([20, 25, 40, 50]);
        faktor = f.gaya === 'jenis' ? a.pilih([100, 1000]) : 1;
        N = dasarN * faktor;
        var urut = a.kocok([0, 1, 2, 3]), anc = urut[0];
        cnt = [0, 0, 0, 0];
        cnt[anc] = a.bulat(2, Math.max(3, Math.floor(dasarN / 4)));
        rel.push({ tipe: 'nilai', g: anc, v: cnt[anc] * faktor });
        var gagal = false, tersedia = [anc];
        var jenisBolehNya = level === 'mudah' ? ['sama', 'lebih', 'kurang'] : (level === 'sedang' ? ['sama', 'lebih', 'kurang', 'kali'] : ['lebih', 'kurang', 'kali', 'kali', 'lebih']);
        for (var q = 1; q < 4 && !gagal; q++) {
          var g = urut[q], r = a.pilih(tersedia), tipe = a.pilih(jenisBolehNya), k = 0, v;
          if (tipe === 'sama') v = cnt[r];
          else if (tipe === 'kali') { k = a.pilih([2, 3]); v = k * cnt[r]; }
          else { k = a.pilih([1, 1, 2, 3, 5]); v = tipe === 'lebih' ? cnt[r] + k : cnt[r] - k; }
          if (!(v >= 1)) { gagal = true; continue; }
          cnt[g] = v; rel.push({ tipe: tipe, g: g, r: r, k: (tipe === 'lebih' || tipe === 'kurang') ? k * faktor : k }); tersedia.push(g);
        }
        if (gagal) continue;
        if (cnt.reduce(function (s2, x) { return s2 + x; }, 0) !== dasarN) continue;
        cnt = cnt.map(function (x) { return x * faktor; });
      } else {
        dasar = a.bulat(0, 3);
        var jmlKoef = a.pilih([10, 20, 25, 50]);
        var koef = [1, 1, 1, 1], sisa = jmlKoef - 4, c2 = 0;
        if (sisa < 0) continue;
        while (sisa > 0 && c2 < 200) {
          var gi = a.bulat(0, 3);
          if (gi === dasar && a.untung(0.7)) { c2++; continue; }
          var tambah = a.bulat(1, Math.min(sisa, jmlKoef > 20 ? 12 : 8));
          koef[gi] += tambah; sisa -= tambah; c2++;
        }
        if (sisa !== 0) continue;
        if (koef[dasar] > 1 && koef[dasar] !== 1) { /* dasar boleh lebih dari 1 hanya bila pembagi cocok */ }
        // semua irisan dinyatakan "k kali" dasar: koef harus kelipatan koef[dasar]
        var kd = koef[dasar];
        if (koef.some(function (x) { return x % kd !== 0; })) continue;
        if (kd !== 1) continue;
        if (N % jmlKoef !== 0) continue;
        cnt = koef.map(function (x) { return x * N / jmlKoef; });
        for (var gg = 0; gg < 4; gg++) {
          if (gg === dasar) continue;
          if (koef[gg] === koef[dasar]) rel.push({ tipe: 'sama', g: gg, r: dasar, k: 0 });
          else rel.push({ tipe: 'kali', g: gg, r: dasar, k: koef[gg] / kd });
        }
      }
      var persen = cnt.map(function (x) { return x / N * 100; });
      if (persen.some(function (x) { return Math.abs(x - Math.round(x)) > 1e-9 || x < 1; })) continue;
      persen = persen.map(function (x) { return Math.round(x); });     // buang galat titik-kambang (57.9999… -> 58)
      if (bentuk === 'penuh' && persen.every(function (x) { return x === 25; })) continue;
      if (Math.max.apply(null, persen) - Math.min.apply(null, persen) < 5) continue;

      // ----- teks
      var kal = a.kocok(rel.map(function (r2) { return kalimat(f, r2); }));
      if (bentuk === 'kosong') kal.push('Jumlah ' + f.unit + ' ' + f.grup[dasar] + ' tidak disebutkan.');
      var teks = [f.pembuka(N, f.grup)].concat(kal);
      var kunciTeks = f.grup.map(function (n, i) { return (f.gaya === 'subjek' ? n : n.charAt(0).toUpperCase() + n.slice(1)) + ' ' + persen[i] + '% (' + Fmt.angka(cnt[i]) + ')'; }).join('; ') + '.';
      var pem = [];
      if (bentuk === 'penuh') {
        var tampil = rel.slice().sort(function (x, y) { return (x.tipe === 'nilai' ? 0 : 1) - (y.tipe === 'nilai' ? 0 : 1); });
        var sudah = {};
        // urutkan penjelasan menurut ketergantungan (anchor dahulu)
        var urutan = [rel.filter(function (x) { return x.tipe === 'nilai'; })[0]];
        sudah[urutan[0].g] = true;
        while (urutan.length < 4) {
          var maju = false;
          rel.forEach(function (x) { if (!sudah[x.g] && sudah[x.r]) { urutan.push(x); sudah[x.g] = true; maju = true; } });
          if (!maju) break;
        }
        urutan.forEach(function (x) {
          var G = f.grup[x.g], R = x.r != null ? f.grup[x.r] : null;
          if (x.tipe === 'nilai') pem.push(G + ' = ' + Fmt.angka(x.v) + '.');
          else if (x.tipe === 'sama') pem.push(G + ' = ' + R + ' = ' + Fmt.angka(cnt[x.g]) + '.');
          else if (x.tipe === 'lebih') pem.push(G + ' = ' + R + ' + ' + x.k + ' = ' + Fmt.angka(cnt[x.r]) + ' + ' + x.k + ' = ' + Fmt.angka(cnt[x.g]) + '.');
          else if (x.tipe === 'kurang') pem.push(G + ' = ' + R + ' - ' + x.k + ' = ' + Fmt.angka(cnt[x.r]) + ' - ' + x.k + ' = ' + Fmt.angka(cnt[x.g]) + '.');
          else pem.push(G + ' = ' + x.k + ' × ' + R + ' = ' + x.k + ' × ' + Fmt.angka(cnt[x.r]) + ' = ' + Fmt.angka(cnt[x.g]) + '.');
        });
        pem.push('Jumlah = ' + cnt.map(function (x) { return Fmt.angka(x); }).join(' + ') + ' = ' + Fmt.angka(N) + ' (cocok dengan jumlah yang diketahui).');
        pem.push('Persentase = jumlah ÷ ' + Fmt.angka(N) + ': ' + f.grup.map(function (n, i) { return n + ' ' + persen[i] + '%'; }).join(', ') + '.');
      } else {
        var pasang = f.grup.map(function (n, i) { return i === dasar ? 'p' : (rel.filter(function (x) { return x.g === i; })[0].tipe === 'sama' ? 'p' : rel.filter(function (x) { return x.g === i; })[0].k + 'p'); });
        pem.push('Misalkan jumlah ' + f.unit + ' ' + f.grup[dasar] + ' = p. Maka ' + f.grup.map(function (n, i) { return n + ' = ' + pasang[i]; }).join(', ') + '.');
        pem.push('Jumlah seluruhnya: ' + pasang.join(' + ') + ' = ' + jmlKoefStr(cnt, dasar) + 'p = ' + Fmt.angka(N) + ', sehingga p = ' + Fmt.angka(cnt[dasar]) + '.');
        pem.push(f.grup.map(function (n, i) { return n + ' = ' + Fmt.angka(cnt[i]) + ' (' + persen[i] + '%)'; }).join('; ') + '.');
      }
      var model = { irisan: f.grup.map(function (n, i) { return { nama: f.gaya === 'subjek' ? n : f.unit.charAt(0).toUpperCase() + f.unit.slice(1) + ' ' + n }; }) };
      var awal = { persen: [25, 25, 25, 25] };
      var kunci = { persen: persen };
      var ctx = { submateri: 'pie', keluarga: id, level: level, benih: benih };
      return Butir.rakitIsian(ctx, {
        jenisSoal: bentuk === 'penuh' ? 'Pie Chart (informasi penuh)' : 'Pie Chart (1 informasi kosong)',
        judul: f.judul + ' · Pie Chart (' + (bentuk === 'penuh' ? 'informasi penuh' : '1 informasi kosong') + ')', teks: teks, pertanyaan: f.tanya,
        perintah: 'Geser batas antar-irisan sampai persentase tiap irisan sesuai dengan keterangan.',
        gambar: [{ id: 'awal', jenis: 'pie', model: model, state: awal, judul: 'Tampilan awal' }],
        gambarPembahasan: [{ id: 'kunci', jenis: 'pie', model: model, state: kunci, judul: 'Kondisi akhir (kunci)' }],
        isian: { jenis: 'pie', kontrol: [{ nama: 'persen', label: 'Persentase tiap irisan', min: 0, maks: 100, langkah: 1, satuan: '%' }], awal: awal, kunci: kunci, model: model, irisan: model.irisan.map(function (x) { return x.nama; }) },
        kunciTeks: kunciTeks, langkah: [], pembahasan: pem,
        model: { param: { N: String(N) }, tampil: { N: Fmt.angka(N) }, toleransi: 0, topik: 'Pie Chart', relasi: rel, total: N, bentuk: bentuk, dasar: dasar, jumlahGrup: 4, grup: f.grup, unit: f.unit, gaya: f.gaya },
        sidik: { inti: 'pn-pie|' + f.id + '|' + bentuk + '|' + N + '|' + cnt.join(','), param: cnt.concat([N]), entitas: f.id + bentuk }
      });
    }
    return null;
  }

  function jmlKoefStr(cnt, dasar) {
    var d = cnt[dasar];
    return String(cnt.reduce(function (s, x) { return s + x / d; }, 0));
  }

  var KELUARGA = [
    { id: 'pie-penuh', nama: 'Diagram lingkaran, informasi penuh', submateri: 'pie' },
    { id: 'pie-kosong', nama: 'Diagram lingkaran, satu informasi kosong', submateri: 'pie' }
  ];

  return { KELUARGA: KELUARGA, buat: buat, FRAME: FRAME };
});
