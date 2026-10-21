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
 * kalimat. Seperti contoh riset, kalimatnya disajikan dalam empat KOTAK kategori
 * (`stimulus.kartu`) yang warnanya sama dengan irisannya; pada bentuk "1 informasi
 * kosong" kotak dasar tetap tampil dengan judulnya tetapi isinya kosong. Validator
 * menyelesaikan sistem persamaan linear itu dari nol dengan pecahan eksak dan
 * memastikan jawabannya tunggal dan bulat persen.
 *
 * Tingkat: penuh mudah = sama/lebih/kurang, sedang = ditambah "kali", sulit = rantai
 * lebih/kurang/kali; kosong mudah = semua relatif terhadap dasar, sedang = ada relasi
 * berantai (relatif terhadap irisan lain), sulit = rantai ditambah selisih tetap.
 *
 * Pembahasan: Diketahui, Ditanyakan, Pengerjaan (rumus persentase = jumlah/total x 100% lebih
 * dahulu; jumlah tiap kategori diturunkan sebagai persamaan "§", pada bentuk kosong lewat
 * permisalan a·p + b; lalu setiap persentase sebagai pecahan), dan Kesimpulan berupa ukuran irisan.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./rng.js'), require('./format.js'), require('./butir.js'), require('./rumus.js'));
    module.exports = api;
  } else {
    api = factory(root.Rng, root.Fmt, root.Butir, root.Rumus);
    root.PnPie = api;
  }
})(typeof self !== 'undefined' ? self : this, function (Rng, Fmt, Butir, Rumus) {
  'use strict';

  var WARNA = ['biru', 'hijau', 'jingga', 'merah'];
  // sama dengan warna seri pertama chart.js, jadi kotak keterangan dan irisan berwarna sama
  var WARNA_HEX = ['1E88C9', '4C9A14', 'F57A22', 'F2443F'];

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

  /** Isi kotak kategori: gaya subjek tidak mengulang nama kategori yang sudah menjadi judul kotak. */
  function kalimatKartu(f, r) {
    if (f.gaya !== 'subjek') return kalimat(f, r);
    var R = r.r != null ? f.grup[r.r] : null;
    switch (r.tipe) {
      case 'nilai': return 'Memiliki ' + Fmt.angka(r.v) + ' ' + f.unit + '.';
      case 'sama': return 'Memiliki jumlah ' + f.unit + ' yang sama dengan ' + R + '.';
      case 'lebih': return 'Memiliki ' + Fmt.angka(r.k) + ' ' + f.unit + ' lebih banyak daripada ' + R + '.';
      case 'kurang': return 'Memiliki ' + Fmt.angka(r.k) + ' ' + f.unit + ' lebih sedikit daripada ' + R + '.';
      default: return 'Jumlah ' + f.unit + 'nya ' + r.k + ' kali jumlah ' + f.unit + ' ' + R + '.';
    }
  }

  function judulKartu(f, i) {
    var kap = function (x) { return x.charAt(0).toUpperCase() + x.slice(1); };
    return f.gaya === 'subjek' ? f.grup[i] : kap(f.unit) + ' ' + kap(f.grup[i]);
  }

  /** Irisan sebagai a·p + b (p = jumlah irisan dasar), mengikuti urutan relasi. */
  function bentukP(rel, dasar) {
    var A = [null, null, null, null], B = [0, 0, 0, 0];
    A[dasar] = 1;
    for (var putar = 0; putar < 4; putar++) {
      rel.forEach(function (r) {
        if (A[r.g] !== null || A[r.r] === null) return;
        if (r.tipe === 'kali') { A[r.g] = r.k * A[r.r]; B[r.g] = r.k * B[r.r]; }
        else { A[r.g] = A[r.r]; B[r.g] = B[r.r] + (r.tipe === 'lebih' ? r.k : r.tipe === 'kurang' ? -r.k : 0); }
      });
    }
    return { A: A, B: B };
  }

  function teksP(a, b) {
    return (a === 1 ? '' : a) + 'p' + (b ? (b > 0 ? ' + ' : ' - ') + Fmt.angka(Math.abs(b)) : '');
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
        // susun dalam satuan kecil lalu skalakan ke N: dasar = 1 satuan, irisan lain relatif terhadap dasar
        // (mudah) atau terhadap irisan yang sudah terdefinisi (sedang/sulit, berantai)
        dasar = a.bulat(0, 3);
        var unitC = [0, 0, 0, 0], sudahAda = [dasar], relU = [], gagalK = false;
        unitC[dasar] = 1;
        a.kocok([0, 1, 2, 3].filter(function (x) { return x !== dasar; })).forEach(function (g) {
          if (gagalK) return;
          var bukanDasar = sudahAda.filter(function (x) { return x !== dasar; });
          var r = level === 'mudah' || !bukanDasar.length || a.untung(0.4) ? dasar : a.pilih(bukanDasar);
          var tipe = level === 'sulit' ? a.pilih(['kali', 'kali', 'lebih', 'kurang']) : a.pilih(['kali', 'kali', 'kali', 'sama']);
          var k = 0, v;
          if (tipe === 'kali') { k = a.bulat(2, r === dasar ? 16 : 4); v = k * unitC[r]; }
          else if (tipe === 'sama') v = unitC[r];
          else { k = a.bulat(1, 4); v = tipe === 'lebih' ? unitC[r] + k : unitC[r] - k; }
          if (!(v >= 1)) { gagalK = true; return; }
          unitC[g] = v; relU.push({ tipe: tipe, g: g, r: r, k: k }); sudahAda.push(g);
        });
        if (gagalK) continue;
        var berantai = relU.some(function (x) { return x.r !== dasar; }), selisih = relU.some(function (x) { return x.tipe === 'lebih' || x.tipe === 'kurang'; });
        if (level !== 'mudah' && !berantai) continue;
        if (level === 'sulit' && !selisih) continue;
        var S = unitC.reduce(function (s2, x) { return s2 + x; }, 0);
        if (N % S !== 0) continue;
        var u = N / S;
        cnt = unitC.map(function (x) { return x * u; });
        relU.forEach(function (x) { rel.push({ tipe: x.tipe, g: x.g, r: x.r, k: x.tipe === 'lebih' || x.tipe === 'kurang' ? x.k * u : x.k }); });
      }
      var persen = cnt.map(function (x) { return x / N * 100; });
      if (persen.some(function (x) { return Math.abs(x - Math.round(x)) > 1e-9 || x < 1; })) continue;
      persen = persen.map(function (x) { return Math.round(x); });     // buang galat titik-kambang (57.9999… -> 58)
      if (bentuk === 'penuh' && persen.every(function (x) { return x === 25; })) continue;
      if (Math.max.apply(null, persen) - Math.min.apply(null, persen) < 5) continue;

      // ----- teks: kalimat pembuka, lalu satu kotak per kategori (kotak dasar pada bentuk kosong tanpa isi)
      var teks = [f.pembuka(N, f.grup)];
      var kartu = f.grup.map(function (n, i) {
        var r2 = rel.filter(function (x) { return x.g === i; })[0];
        return { judul: judulKartu(f, i), warna: WARNA_HEX[i], teks: r2 ? kalimatKartu(f, r2) : '' };
      });
      var kunciTeks = f.grup.map(function (n, i) { return (f.gaya === 'subjek' ? n : n.charAt(0).toUpperCase() + n.slice(1)) + ' ' + persen[i] + '% (' + Fmt.angka(cnt[i]) + ')'; }).join('; ') + '.';
      // ----- pembahasan: Diketahui, Ditanyakan, Pengerjaan (persamaan "§"), Kesimpulan
      var R = Rumus.baris, rA = function (v) { return Fmt.angka(v); }, rT = function (t) { return '\\text{' + t + '}'; };
      var nama = function (i) { return rT(judulKartu(f, i)); };
      var pem = ['Diketahui', 'Jumlah seluruh ' + f.unit + ': ' + Fmt.angka(N) + '.'];
      rel.forEach(function (x) { pem.push(kalimat(f, x)); });
      if (bentuk === 'kosong') pem.push('Kotak ' + judulKartu(f, dasar) + ' kosong, jadi jumlah ' + f.unit + ' ' + f.grup[dasar] + ' harus dicari dari jumlah seluruhnya.');
      pem.push('Ditanyakan', 'Persentase setiap kategori (' + f.grup.join(', ') + ') pada diagram lingkaran, dalam kelipatan 1%.');
      pem.push('Pengerjaan', 'Persentase tiap irisan adalah jumlah kategorinya dibagi jumlah seluruhnya:',
        R(rT('persentase') + ' = \\frac{' + rT('jumlah') + '}{' + rT('total') + '} \\times 100\\%'));
      if (bentuk === 'penuh') {
        // urutkan penjelasan menurut ketergantungan (anchor dahulu)
        var sudah = {};
        var urutan = [rel.filter(function (x) { return x.tipe === 'nilai'; })[0]];
        sudah[urutan[0].g] = true;
        while (urutan.length < 4) {
          var maju = false;
          rel.forEach(function (x) { if (!sudah[x.g] && sudah[x.r]) { urutan.push(x); sudah[x.g] = true; maju = true; } });
          if (!maju) break;
        }
        pem.push('Jumlah tiap kategori dihitung lebih dahulu dari keterangan, mulai dari kategori yang jumlahnya diketahui:');
        urutan.forEach(function (x) {
          var G = nama(x.g), Rn = x.r != null ? nama(x.r) : null;
          if (x.tipe === 'nilai') pem.push(R(G + ' = ' + rA(x.v)));
          else if (x.tipe === 'sama') pem.push(R(G + ' = ' + Rn + ' = ' + rA(cnt[x.g])));
          else if (x.tipe === 'kali') pem.push(R(G + ' = ' + x.k + ' \\times ' + Rn + ' = ' + x.k + ' \\times ' + rA(cnt[x.r]) + ' = ' + rA(cnt[x.g])));
          else {
            var tanda = x.tipe === 'lebih' ? ' + ' : ' - ';
            pem.push(R(G + ' = ' + Rn + tanda + rA(x.k) + ' = ' + rA(cnt[x.r]) + tanda + rA(x.k) + ' = ' + rA(cnt[x.g])));
          }
        });
        pem.push('Periksa bahwa jumlah keempat kategori sama dengan jumlah seluruhnya:', R(cnt.map(rA).join(' + ') + ' = ' + rA(N)));
      } else {
        var bp = bentukP(rel, dasar), sA = bp.A.reduce(function (x, y) { return x + y; }, 0), sB = bp.B.reduce(function (x, y) { return x + y; }, 0);
        var ekspr = function (i) { return teksP(bp.A[i], bp.B[i]); };
        pem.push('Misalkan jumlah ' + f.unit + ' ' + f.grup[dasar] + ' adalah p, lalu nyatakan kategori lain dalam p:', R(nama(dasar) + ' = p'));
        // relasi diuraikan menurut ketergantungan: yang mengacu ke dasar lebih dahulu
        var sudahP = {}; sudahP[dasar] = true;
        for (var putar = 0; putar < 4; putar++) {
          rel.forEach(function (x) {
            if (sudahP[x.g] || !sudahP[x.r]) return;
            sudahP[x.g] = true;
            var acuan = ekspr(x.r), berbaur = bp.B[x.r] !== 0;
            var rumus = x.tipe === 'kali' ? x.k + ' \\times ' + (berbaur ? '(' + acuan + ')' : acuan)
              : x.tipe === 'sama' ? acuan : acuan + (x.tipe === 'lebih' ? ' + ' : ' - ') + rA(x.k);
            var bagian = [nama(x.g), x.tipe === 'kali' ? x.k + ' \\times ' + nama(x.r) : x.tipe === 'sama' ? nama(x.r) : nama(x.r) + (x.tipe === 'lebih' ? ' + ' : ' - ') + rA(x.k), rumus];
            if (rumus !== ekspr(x.g)) bagian.push(ekspr(x.g));
            pem.push(R(bagian.join(' = ')));
          });
        }
        pem.push('Jumlah keempat kategori sama dengan jumlah seluruhnya:');
        pem.push(R(bp.A.map(function (x, i) { return bp.B[i] ? '(' + ekspr(i) + ')' : ekspr(i); }).join(' + ') + ' = ' + rA(N)));
        if (sB) {
          pem.push(R(teksP(sA, sB) + ' = ' + rA(N)));
          pem.push(R(sA + 'p = ' + rA(N) + (sB > 0 ? ' - ' : ' + ') + rA(Math.abs(sB)) + ' = ' + rA(N - sB)));
        } else pem.push(R(sA + 'p = ' + rA(N)));
        pem.push(R('p = \\frac{' + rA(N - sB) + '}{' + sA + '} = ' + rA(cnt[dasar])));
        pem.push('Substitusikan p ke setiap kategori:');
        f.grup.forEach(function (n, i) {
          var a = bp.A[i], b = bp.B[i];
          var subst = (a === 1 ? rA(cnt[dasar]) : a + ' \\times ' + rA(cnt[dasar])) + (b ? (b > 0 ? ' + ' : ' - ') + rA(Math.abs(b)) : '');
          pem.push(R(nama(i) + ' = ' + (a === 1 && !b ? 'p = ' : subst + ' = ') + rA(cnt[i])));
        });
      }
      pem.push('Ubah setiap jumlah menjadi persentase dengan total ' + Fmt.angka(N) + ':');
      f.grup.forEach(function (n, i) {
        pem.push(R(rT('persentase ' + judulKartu(f, i)) + ' = \\frac{' + rA(cnt[i]) + '}{' + rA(N) + '} \\times 100\\% = ' + persen[i] + '\\%'));
      });
      pem.push('Keempat persentase berjumlah 100%:', R(persen.join('\\% + ') + '\\% = 100\\%'));
      pem.push('Kesimpulan', 'Atur irisan ' + Fmt.daftarKata(f.grup.map(function (n, i) { return judulKartu(f, i) + ' ke ' + persen[i] + '%'; })) + '.');
      var model = { irisan: f.grup.map(function (n, i) { return { nama: f.gaya === 'subjek' ? n : f.unit.charAt(0).toUpperCase() + f.unit.slice(1) + ' ' + n, warna: '#' + WARNA_HEX[i] }; }) };
      var awal = { persen: [25, 25, 25, 25] };
      var kunci = { persen: persen };
      var ctx = { submateri: 'pie', keluarga: id, level: level, benih: benih };
      var butir = Butir.rakitIsian(ctx, {
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
      butir.stimulus.kartu = kartu;
      butir.pola = 'pie-' + f.id;
      butir.kategoriRiset = 'acuan';
      return butir;
    }
    return null;
  }

  var KELUARGA = [
    { id: 'pie-penuh', nama: 'Diagram lingkaran, informasi penuh', submateri: 'pie' },
    { id: 'pie-kosong', nama: 'Diagram lingkaran, satu informasi kosong', submateri: 'pie' }
  ];

  return { KELUARGA: KELUARGA, buat: buat, FRAME: FRAME };
});
