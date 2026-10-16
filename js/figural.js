/*
 * figural.js — Kemampuan Umum > Figural, mesin pola berbasis ATRIBUT.
 *
 * Tiga bentuk soal, semuanya dengan pilihan A-E berupa gambar:
 *
 *   serial      deret mendatar lima kotak + "?" (The Next Box)
 *   matriks-3   matriks 3x3 dengan satu kotak "?"
 *   matriks-2   matriks 2x2 dengan kotak "?" kanan-bawah
 *
 * Tiap KOTAK adalah gabungan beberapa KANAL, dan tiap kanal mengikuti SATU aturan:
 *
 *   bentuk   wadah: lingkaran, persegi, segitiga, belah ketupat
 *   isi      warna wadah: putih, abu-abu, hitam
 *   arah     panah di dalam wadah, delapan arah (kelipatan 45 derajat)
 *   titik    ada/tidaknya titik hitam di pangkal panah
 *   jumlah   banyaknya kotak kecil di bawah wadah (0-5)
 *   penanda  satu kotak kecil di salah satu pojok
 *
 * Penyusun membangun nilai tiap kanal menurut aturan yang dipilih, lalu memeriksa
 * bahwa aturan itu DAPAT DITEBAK dari kotak yang tampak: `Inferensi` mendaftarkan
 * semua aturan pustaka yang cocok dan nilai yang diberikannya, dan soal hanya
 * dipakai kalau hasilnya tunggal. Pengecoh dibuat dengan mengubah satu atau dua
 * kanal kunci ke nilai yang salah tetapi menggoda (nilai kotak sebelumnya, salah
 * langkah, nilai tetangga), jadi tiap pengecoh dijamin berbeda dari kunci di
 * paling sedikit satu kanal yang aturannya jelas.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./rng.js'), require('./svg.js'), require('./inferensi.js'), require('./butir.js'), require('./format.js'));
    module.exports = api;
  } else {
    api = factory(root.Rng, root.Svg, root.Inferensi, root.Butir, root.Fmt);
    root.Figural = api;
  }
})(typeof self !== 'undefined' ? self : this, function (Rng, S, Inf, Butir, Fmt) {
  'use strict';

  var K = Inf.KANAL, mod = Inf.mod;
  var PERINTAH = 'Gunakan gambar di bagian atas untuk menentukan jawaban yang benar dari pilihan di bawah. Pilih jawaban yang menggantikan tanda tanya. Jika tidak ada tanda tanya, pilih jawaban yang merupakan kelanjutan dari urutan tersebut.';

  var NAMA = {
    bentuk: ['lingkaran', 'persegi', 'segitiga', 'belah ketupat'],
    isi: ['putih', 'abu-abu', 'hitam'],
    arah: ['atas', 'kanan-atas', 'kanan', 'kanan-bawah', 'bawah', 'kiri-bawah', 'kiri', 'kiri-atas'],
    titik: ['tanpa titik', 'dengan titik'],
    jumlah: ['0', '1', '2', '3', '4', '5'],
    penanda: ['kiri-atas', 'kanan-atas', 'kanan-bawah', 'kiri-bawah']
  };
  var LABEL = { bentuk: 'bentuk wadah', isi: 'warna wadah', arah: 'arah panah', titik: 'titik di pangkal panah', jumlah: 'jumlah kotak kecil', penanda: 'letak kotak kecil di pojok' };

  // --------------------------------------------------------------- menggambar

  var INK = '#1d1d1d', ISI = ['#ffffff', '#b8b8b8', '#2a2a2a'];

  /** Isi gambar satu kotak pada koordinat 0..100 (belum berbingkai). */
  function sel(cell) {
    var o = [];
    var bentuk = cell.bentuk === undefined ? 0 : cell.bentuk;
    var isi = cell.isi === undefined ? 0 : cell.isi;
    var warna = ISI[isi], tinta = isi === 2 ? '#ffffff' : INK;
    var inr;
    if (bentuk === 0) { o.push(S.lingkaran(50, 50, 31, { isi: warna, garis: INK, tebal: 2.6 })); inr = 31; }
    else if (bentuk === 1) { o.push(S.rect(21, 21, 58, 58, { isi: warna, garis: INK, tebal: 2.6 })); inr = 29; }
    else if (bentuk === 2) { o.push(S.poli([[50, 15], [83, 72], [17, 72]], { tutup: true, isi: warna, garis: INK, tebal: 2.6, sambung: 'round' })); inr = 18; }
    else { o.push(S.poli([[50, 13], [87, 50], [50, 87], [13, 50]], { tutup: true, isi: warna, garis: INK, tebal: 2.6, sambung: 'round' })); inr = 24; }
    var cy = bentuk === 2 ? 56 : 50;
    if (cell.arah !== undefined) {
      var L = inr * 0.72, th = cell.arah * 45 * Math.PI / 180, dx = Math.sin(th), dy = -Math.cos(th);
      var ex = 50 + L * dx, ey = cy + L * dy, px = -dy, py = dx, h = 9;
      o.push(S.garis(50, cy, 50 + (L - h * 0.6) * dx, cy + (L - h * 0.6) * dy, { garis: tinta, tebal: 3.4, ujung: 'round' }));
      o.push(S.poli([[ex, ey], [ex - h * dx + h * 0.5 * px, ey - h * dy + h * 0.5 * py], [ex - h * dx - h * 0.5 * px, ey - h * dy - h * 0.5 * py]], { tutup: true, isi: tinta, garis: tinta, tebal: 1, sambung: 'round' }));
      if (cell.titik) o.push(S.lingkaran(50, cy, 5.2, { isi: tinta }));
    } else if (cell.titik) {
      o.push(S.lingkaran(50, cy, 6.5, { isi: tinta }));
    }
    if (cell.jumlah) {
      for (var i = 0; i < cell.jumlah; i++) {
        o.push(S.rect(50 + (i - (cell.jumlah - 1) / 2) * 9.5 - 3.2, 90.2, 6.4, 6.4, { isi: INK }));
      }
    }
    if (cell.penanda !== undefined) {
      var pos = [[4, 4], [85, 4], [85, 85], [4, 85]][cell.penanda];
      o.push(S.rect(pos[0], pos[1], 11, 11, { isi: INK }));
    }
    return o.join('');
  }

  function bingkaiSel(x, y, s, isi, opsi) {
    opsi = opsi || {};
    var g = '<g transform="translate(' + S.num(x) + ',' + S.num(y) + ') scale(' + (Math.round(s / 100 * 10000) / 10000) + ')">';
    if (opsi.bingkai !== false) g += S.rect(0.7, 0.7, 98.6, 98.6, { isi: opsi.latar || '#ffffff', garis: opsi.warnaTepi || '#7b8499', tebal: opsi.sorot ? 4 : 1.6 });
    return g + isi + '</g>';
  }

  function tandaTanya(s, x, y) {
    return bingkaiSel(x, y, s, S.rect(0.7, 0.7, 98.6, 98.6, { isi: '#f4f6fb' }) + S.teks('?', 50, 72, { ukuran: 66, tebal: true, isi: '#4a5266', rata: 'middle' }));
  }

  /** Satu kotak dalam dokumen SVG sendiri (untuk pilihan jawaban). */
  function svgSel(cell, ukuran, opsi) {
    ukuran = ukuran || 120;
    var pad = 4;
    return { svg: S.doc(bingkaiSel(pad, pad, ukuran, sel(cell), opsi), ukuran + pad * 2, ukuran + pad * 2, { latar: '#ffffff' }), lebar: ukuran + pad * 2, tinggi: ukuran + pad * 2 };
  }

  /** Deret mendatar: kotak-kotak terlihat lalu "?". */
  function svgSerial(sels, ukuran) {
    ukuran = ukuran || 100;
    var gap = 14, pad = 6, n = sels.length + 1, bagian = [];
    sels.forEach(function (c, i) { bagian.push(bingkaiSel(pad + i * (ukuran + gap), pad, ukuran, sel(c))); });
    bagian.push(tandaTanya(ukuran, pad + sels.length * (ukuran + gap), pad));
    var w = pad * 2 + n * ukuran + (n - 1) * gap;
    return { svg: S.doc(bagian.join(''), w, ukuran + pad * 2, { latar: '#ffffff' }), lebar: w, tinggi: ukuran + pad * 2 };
  }

  /** Matriks r x c dengan satu kotak "?" pada (mr, mc). */
  function svgMatriks(grid, mr, mc, ukuran) {
    var n = grid.length, m = grid[0].length;
    ukuran = ukuran || (n === 3 ? 108 : 124);
    var pad = 6, bagian = [];
    for (var r = 0; r < n; r++) {
      for (var c = 0; c < m; c++) {
        if (r === mr && c === mc) bagian.push(tandaTanya(ukuran, pad + c * ukuran, pad + r * ukuran));
        else bagian.push(bingkaiSel(pad + c * ukuran, pad + r * ukuran, ukuran, sel(grid[r][c])));
      }
    }
    bagian.push(S.rect(pad, pad, m * ukuran, n * ukuran, { isi: 'none', garis: '#4a5266', tebal: 2.4 }));
    return { svg: S.doc(bagian.join(''), pad * 2 + m * ukuran, pad * 2 + n * ukuran, { latar: '#ffffff' }), lebar: pad * 2 + m * ukuran, tinggi: pad * 2 + n * ukuran };
  }

  // ----------------------------------------------------------- pembangunan nilai

  function acakNilai(a, nama, kecuali) {
    var info = K[nama], kandidat = [];
    for (var v = 0; v < info.n; v++) if (!kecuali || kecuali.indexOf(v) < 0) kandidat.push(v);
    return a.pilih(kandidat);
  }

  /** n nilai berbeda dari domain kanal. */
  function nilaiBeda(a, nama, n) { return a.ambil(Array.apply(null, { length: K[nama].n }).map(function (_, i) { return i; }), n); }

  /**
   * Urutan nilai satu kanal sepanjang 6 kotak (5 terlihat + 1 jawaban) menurut aturan.
   * Mengembalikan { seq, aturan, k/p/..., desk } atau null.
   */
  function urutanKanal(a, nama, level) {
    var info = K[nama], seq = [], i, p, k;
    var pilihan = [];
    if (info.tipe === 'nominal') pilihan = ['siklus-2', 'siklus-3'];
    else if (nama === 'titik') pilihan = ['siklus-2'];
    else if (nama === 'jumlah') pilihan = level === 'mudah' ? ['tambah', 'siklus-2'] : ['tambah', 'siklus-3', 'siklus-2'];
    else if (nama === 'arah') pilihan = level === 'mudah' ? ['langkah', 'langkah', 'siklus-2'] : (level === 'sedang' ? ['langkah', 'siklus-3', 'siklus-4', 'langkah'] : ['langkah', 'siklus-3', 'siklus-4', 'langkah', 'siklus-3']);
    else if (nama === 'isi') pilihan = level === 'mudah' ? ['langkah', 'siklus-2'] : ['langkah', 'siklus-2', 'siklus-3'];
    else pilihan = level === 'mudah' ? ['langkah', 'siklus-2'] : ['langkah', 'pantul', 'siklus-3', 'siklus-2'];     // penanda
    var jenis = a.pilih(pilihan), hasil = { aturan: jenis };
    if (jenis.indexOf('siklus-') === 0) {
      p = parseInt(jenis.slice(7), 10);
      var dasar = nilaiBeda(a, nama, p);
      for (i = 0; i < 6; i++) seq.push(dasar[i % p]);
      hasil.p = p; hasil.dasar = dasar;
    } else if (jenis === 'langkah') {
      var ks = nama === 'arah' ? (level === 'mudah' ? [2, -2] : [1, -1, 2, -2, 3, -3]) : (nama === 'isi' ? [1, 2] : [1, -1]);
      k = a.pilih(ks);
      var s = a.bulat(0, info.n - 1);
      for (i = 0; i < 6; i++) seq.push(mod(s + k * i, info.n));
      hasil.k = k;
    } else if (jenis === 'pantul') {
      var fase = a.bulat(0, 2 * (info.n - 1) - 1);
      for (i = 0; i < 6; i++) seq.push(Inf.pantulIndeks(fase + i, info.n));
      hasil.fase = fase;
    } else {                                              // tambah (jumlah)
      var d = a.pilih([1, -1]);
      for (i = 0; i < 6; i++) seq.push(d > 0 ? i : 5 - i);
      hasil.d = d;
    }
    hasil.seq = seq;
    return hasil;
  }

  function deskripsiDeret(nama, u) {
    var nm = NAMA[nama], seq = u.seq, tampak = seq.slice(0, 5).map(function (v) { return nm[v]; }).join(', ');
    var next = nm[seq[5]];
    var judul = Fmt.kapital(LABEL[nama]) + ': ';
    if (u.aturan.indexOf('siklus-') === 0) return judul + 'berulang setiap ' + u.p + ' kotak (' + u.dasar.map(function (v) { return nm[v]; }).join(', ') + '). Kotak 1-5: ' + tampak + '; maka kotak berikutnya: ' + next + '.';
    if (u.aturan === 'langkah') {
      if (nama === 'arah') return judul + 'berputar ' + Math.abs(u.k) * 45 + ' derajat ' + (u.k > 0 ? 'searah' : 'berlawanan arah') + ' jarum jam pada setiap kotak. Kotak 1-5: ' + tampak + '; maka kotak berikutnya: ' + next + '.';
      if (nama === 'isi') return judul + 'bergeser ke warna ' + (u.k === 1 ? 'berikutnya' : 'dua tingkat berikutnya') + ' pada urutan putih, abu-abu, hitam (lalu kembali ke putih) pada setiap kotak. Kotak 1-5: ' + tampak + '; maka kotak berikutnya: ' + next + '.';
      return judul + 'berpindah satu pojok ' + (u.k > 0 ? 'searah' : 'berlawanan arah') + ' jarum jam pada setiap kotak. Kotak 1-5: ' + tampak + '; maka kotak berikutnya: ' + next + '.';
    }
    if (u.aturan === 'pantul') return judul + 'bergerak bolak-balik antara pojok pertama dan terakhir (kiri-atas, kanan-atas, kanan-bawah, kiri-bawah, lalu kembali). Kotak 1-5: ' + tampak + '; maka kotak berikutnya: ' + next + '.';
    return judul + (u.d > 0 ? 'bertambah' : 'berkurang') + ' satu pada setiap kotak. Kotak 1-5: ' + tampak + '; maka kotak berikutnya: ' + next + '.';
  }

  // ------------------------------------------------------------ pilihan jawaban

  function salin(c) { var o = {}; for (var k in c) o[k] = c[k]; return o; }
  function sidikSel(c) { return Object.keys(c).sort().map(function (k) { return k + '=' + c[k]; }).join(';'); }

  /**
   * Empat pengecoh dari sel kunci: ubah satu (kadang dua) kanal ke nilai yang salah
   * tetapi menggoda. `godaan(nama)` memberi daftar nilai yang menggoda untuk kanal itu.
   */
  function pengecoh(a, kunci, kanal, godaan, namaKanal) {
    var hasil = [], dipakai = {};
    dipakai[sidikSel(kunci)] = true;
    for (var coba = 0; coba < 300 && hasil.length < 4; coba++) {
      var jml = a.untung(0.28) && kanal.length > 1 ? 2 : 1;
      var pilih = a.ambil(kanal, jml);
      var c = salin(kunci), alasan = [];
      var ok = true;
      pilih.forEach(function (nm) {
        var gd = godaan(nm).filter(function (v) { return v !== kunci[nm]; });
        if (!gd.length) { ok = false; return; }
        var v = a.untung(0.65) ? gd[0] : a.pilih(gd);
        c[nm] = v;
        alasan.push(namaKanal(nm, kunci[nm], v));
      });
      if (!ok) continue;
      var s = sidikSel(c);
      if (dipakai[s]) continue;
      dipakai[s] = true;
      hasil.push({ cell: c, alasan: alasan });
    }
    return hasil.length === 4 ? hasil : null;
  }

  function alasanKanal(nama, benar, salah, ket) {
    var nm = NAMA[nama];
    var dasar = LABEL[nama];
    return dasar + ' ' + nm[salah] + ' padahal seharusnya ' + nm[benar] + (ket ? ' (' + ket + ')' : '');
  }

  // ===================================================================== serial

  function buatSerial(a, level, target, benih) {
    var jml = level === 'mudah' ? 2 : (level === 'sedang' ? 3 : 4);
    var pool = level === 'mudah' ? ['arah', 'isi', 'titik', 'penanda'] : ['arah', 'isi', 'titik', 'penanda', 'jumlah', 'bentuk'];
    for (var coba = 0; coba < 300; coba++) {
      var kanal = a.ambil(pool, jml);
      if (kanal.indexOf('arah') < 0 && kanal.indexOf('isi') < 0 && kanal.indexOf('bentuk') < 0) continue;
      var uru = {}, ok = true, variasi = 0;
      kanal.forEach(function (nm) {
        if (!ok) return;
        var u = urutanKanal(a, nm, level);
        var info = K[nm];
        var r = Inf.deret(info, u.seq.slice(0, 5));
        if (r.status !== 'unik' || r.nilai !== u.seq[5]) { ok = false; return; }
        if (u.seq.slice(0, 5).some(function (x) { return x !== u.seq[0]; })) variasi++;
        uru[nm] = u;
      });
      if (!ok || variasi < Math.min(2, jml)) continue;
      var sels = [];
      for (var i = 0; i < 6; i++) { var c = {}; kanal.forEach(function (nm) { c[nm] = uru[nm].seq[i]; }); sels.push(c); }
      var kunci = sels[5];
      // nilai yang menggoda: kotak sebelumnya, salah langkah, nilai lain
      var godaan = function (nm) {
        var u = uru[nm], seq = u.seq, g = [], info = K[nm];
        g.push(seq[4]);
        if (u.aturan === 'langkah') { g.push(mod(seq[5] + u.k, info.n)); g.push(mod(seq[5] - u.k, info.n)); }
        else if (u.aturan.indexOf('siklus-') === 0) { g.push(u.dasar[(5 + 1) % u.p]); g.push(u.dasar[(5 + 2) % u.p]); }
        else if (u.aturan === 'pantul') { g.push(Inf.pantulIndeks(u.fase + 6, info.n)); g.push(Inf.pantulIndeks(u.fase + 4, info.n)); }
        else { g.push(seq[5] + 1 <= 5 ? seq[5] + 1 : seq[5] - 1); g.push(seq[5] - 1 >= 0 ? seq[5] - 1 : seq[5] + 1); }
        for (var v = 0; v < info.n; v++) g.push(v);
        return g.filter(function (v, idx) { return v >= 0 && v < info.n && g.indexOf(v) === idx; });
      };
      var peng = pengecoh(a, kunci, kanal, godaan, function (nm, benar, salah) { return alasanKanal(nm, benar, salah); });
      if (!peng) continue;
      var pem = ['Perhatikan perubahan tiap kanal dari kotak ke kotak:'];
      kanal.forEach(function (nm) { pem.push('• ' + deskripsiDeret(nm, uru[nm])); });
      pem.push('Kotak pengganti tanda tanya (kotak ke-6) memenuhi semua aturan: ' + kanal.map(function (nm) { return NAMA[nm][kunci[nm]]; }).join(', ') + '.');
      return {
        tipe: 'serial', sels: sels.slice(0, 5), kunci: kunci, peng: peng, kanal: kanal, pembahasan: pem,
        aturan: kanal.map(function (nm) { return nm + ':' + uru[nm].aturan; }).join(','), uru: uru
      };
    }
    return null;
  }

  // ===================================================================== matriks 3x3

  var RULE3 = {
    bentuk: ['latin', 'latin', 'latin', 'baris-tetap', 'kolom-tetap'],
    isi: ['latin', 'latin', 'langkah-baris', 'langkah-kolom', 'baris-tetap'],
    arah: ['langkah-baris', 'langkah-baris', 'langkah-kolom', 'latin'],
    titik: ['xor-baris', 'xor-baris', 'baris-tetap'],
    jumlah: ['langkah-baris', 'langkah-baris', 'jumlah-baris', 'latin'],
    penanda: ['langkah-baris', 'langkah-kolom', 'latin']
  };

  function transpos(g) { return [[g[0][0], g[1][0], g[2][0]], [g[0][1], g[1][1], g[2][1]], [g[0][2], g[1][2], g[2][2]]]; }

  /** Bangun matriks 3x3 nilai satu kanal menurut aturan; null bila tak bisa. */
  function bangunKanal3(a, nm, aturan) {
    var info = K[nm], g = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], r, c, deskripsi = '';
    if (aturan === 'latin') {
      if (info.n < 3) return null;
      var S3 = nilaiBeda(a, nm, 3), s = a.pilih([1, 2]);
      var P = S3;
      for (r = 0; r < 3; r++) for (c = 0; c < 3; c++) g[r][c] = P[mod(c + s * r, 3)];
      deskripsi = 'setiap baris dan setiap kolom memuat ketiga nilai (' + P.map(function (v) { return NAMA[nm][v]; }).join(', ') + ') tepat satu kali';
      return { g: g, aturan: aturan, desk: deskripsi };
    }
    if (aturan === 'baris-tetap' || aturan === 'kolom-tetap') {
      var v3 = [acakNilai(a, nm), acakNilai(a, nm), acakNilai(a, nm)];
      if (v3[0] === v3[1] && v3[1] === v3[2]) return null;
      for (r = 0; r < 3; r++) for (c = 0; c < 3; c++) g[r][c] = aturan === 'baris-tetap' ? v3[r] : v3[c];
      deskripsi = aturan === 'baris-tetap' ? 'nilainya sama di seluruh satu baris dan berganti antarbaris (' + v3.map(function (v) { return NAMA[nm][v]; }).join(', ') + ' dari atas ke bawah)' : 'nilainya sama di seluruh satu kolom dan berganti antarkolom (' + v3.map(function (v) { return NAMA[nm][v]; }).join(', ') + ' dari kiri ke kanan)';
      return { g: g, aturan: aturan, desk: deskripsi };
    }
    if (aturan === 'langkah-baris' || aturan === 'langkah-kolom') {
      var k, ks;
      if (nm === 'arah') ks = [1, -1, 2, -2]; else if (nm === 'jumlah') ks = [1, -1]; else if (nm === 'titik') ks = [1]; else if (nm === 'isi') ks = [1, 2]; else ks = [1, -1];
      k = a.pilih(ks);
      for (r = 0; r < 3; r++) {
        var mulai;
        if (info.tipe === 'bilangan') {
          var lo = k > 0 ? 0 : 2 * -k, hi = k > 0 ? info.n - 1 - 2 * k : info.n - 1;
          mulai = a.bulat(lo, hi);
        } else mulai = a.bulat(0, info.n - 1);
        for (c = 0; c < 3; c++) g[r][c] = info.tipe === 'bilangan' ? mulai + k * c : mod(mulai + k * c, info.n);
      }
      if (aturan === 'langkah-kolom') g = transpos(g);
      var arahTeks = nm === 'arah' ? 'berputar ' + Math.abs(k) * 45 + ' derajat ' + (k > 0 ? 'searah' : 'berlawanan arah') + ' jarum jam' : (nm === 'jumlah' ? (k > 0 ? 'bertambah ' : 'berkurang ') + Math.abs(k) : 'bergeser ' + k + ' langkah pada urutannya');
      deskripsi = arahTeks + ' setiap pindah satu ' + (aturan === 'langkah-baris' ? 'kolom ke kanan' : 'baris ke bawah');
      return { g: g, aturan: aturan, desk: deskripsi };
    }
    if (aturan === 'xor-baris') {
      for (r = 0; r < 3; r++) { var x = a.bulat(0, 1), y = a.bulat(0, 1); g[r] = [x, y, x ^ y]; }
      if (g.every(function (row) { return row[0] === g[0][0] && row[1] === g[0][1]; })) return null;
      return { g: g, aturan: aturan, desk: 'kotak ketiga pada tiap baris ada titik bila tepat satu dari dua kotak pertamanya bertitik' };
    }
    if (aturan === 'jumlah-baris') {
      var Kj = a.bulat(4, 8), baris = [], coba2 = 0;
      while (baris.length < 3 && coba2++ < 200) {
        var t = [a.bulat(0, 5), a.bulat(0, 5), a.bulat(0, 5)];
        if (t[0] + t[1] + t[2] !== Kj) continue;
        if (baris.some(function (b) { return b.join() === t.join(); })) continue;
        baris.push(t);
      }
      if (baris.length < 3) return null;
      return { g: baris, aturan: aturan, desk: 'jumlah kotak kecil pada tiap baris selalu ' + Kj };
    }
    return null;
  }

  function nilaiPengecoh3(nm, g, mr, mc, benar) {
    var info = K[nm], g2 = [];
    // nilai tetangga pada baris/kolom yang sama, nilai lain pada kanal itu, dan nilai terdekat
    var sebaris = g[mr].filter(function (v, c) { return c !== mc; }), sekolom = g.map(function (row) { return row[mc]; }).filter(function (v, r) { return r !== mr; });
    g2 = sebaris.concat(sekolom);
    if (info.tipe === 'siklik') { g2.push(mod(benar + 1, info.n)); g2.push(mod(benar - 1, info.n)); if (nm === 'arah') { g2.push(mod(benar + 2, info.n)); g2.push(mod(benar + 4, info.n)); } }
    else if (info.tipe === 'bilangan') { g2.push(benar + 1); g2.push(benar - 1); }
    for (var v = 0; v < info.n; v++) g2.push(v);
    return g2.filter(function (v, i) { return v >= 0 && v < info.n && v !== benar && g2.indexOf(v) === i; });
  }

  function buatMatriks3(a, level, target) {
    var jml = level === 'mudah' ? 2 : (level === 'sedang' ? 3 : 4);
    var pool = ['bentuk', 'isi', 'arah', 'titik', 'jumlah', 'penanda'];
    for (var coba = 0; coba < 400; coba++) {
      var kanal = a.ambil(pool, jml);
      var mr = a.bulat(0, 2), mc = a.bulat(0, 2);
      var bangun = {}, ok = true;
      kanal.forEach(function (nm) {
        if (!ok) return;
        var rule = a.pilih(RULE3[nm]);
        if (level === 'mudah' && (rule === 'jumlah-baris' || rule === 'xor-baris')) rule = a.pilih(K[nm].n >= 3 ? ['baris-tetap', 'latin'] : ['baris-tetap']);
        var b = bangunKanal3(a, nm, rule);
        if (!b) { ok = false; return; }
        if (!b.g.every(function (row) { return row.length === 3 && row.every(function (v) { return v % 1 === 0 && v >= 0 && v < K[nm].n; }); })) { ok = false; return; }
        var gh = b.g.map(function (row) { return row.slice(); });
        gh[mr][mc] = null;
        var r = Inf.matriks3(K[nm], gh, mr, mc);
        if (r.status !== 'unik' || r.nilai !== b.g[mr][mc]) { ok = false; return; }
        bangun[nm] = b;
      });
      if (!ok) continue;
      var grid = [[{}, {}, {}], [{}, {}, {}], [{}, {}, {}]];
      kanal.forEach(function (nm) { for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) grid[r][c][nm] = bangun[nm].g[r][c]; });
      // matriks tidak boleh terlalu monoton: jumlah kotak berbeda minimal 4
      var beda = {};
      grid.forEach(function (row) { row.forEach(function (c) { beda[sidikSel(c)] = 1; }); });
      if (Object.keys(beda).length < 4) continue;
      var kunci = grid[mr][mc];
      var peng = pengecoh(a, kunci, kanal, function (nm) { return nilaiPengecoh3(nm, bangun[nm].g, mr, mc, kunci[nm]); },
        function (nm, benar, salah) { return alasanKanal(nm, benar, salah); });
      if (!peng) continue;
      var pem = ['Setiap kanal pada kotak mengikuti satu aturan. Aturan yang terbaca dari delapan kotak yang terlihat:'];
      kanal.forEach(function (nm) { pem.push('• ' + Fmt.kapital(LABEL[nm]) + ': ' + bangun[nm].desk + '.'); });
      pem.push('Kotak yang hilang berada pada baris ' + (mr + 1) + ', kolom ' + (mc + 1) + '. Menerapkan setiap aturan padanya memberi: ' + kanal.map(function (nm) { return NAMA[nm][kunci[nm]]; }).join(', ') + '.');
      return { tipe: 'matriks-3', grid: grid, mr: mr, mc: mc, kunci: kunci, peng: peng, kanal: kanal, pembahasan: pem, aturan: kanal.map(function (nm) { return nm + ':' + bangun[nm].aturan; }).join(',') };
    }
    return null;
  }

  // ===================================================================== matriks 2x2

  function buatMatriks2(a, level) {
    var jml = level === 'mudah' ? 2 : 3;
    var pool = ['bentuk', 'isi', 'arah', 'titik', 'jumlah', 'penanda'];
    for (var coba = 0; coba < 400; coba++) {
      var kanal = a.ambil(pool, jml), data = {}, ok = true, bergerak = 0;
      kanal.forEach(function (nm) {
        if (!ok) return;
        var info = K[nm], th, tv, v00, v01, v10, v11, dua = null;
        if (nm === 'bentuk') {
          dua = a.ambil([0, 1, 2, 3], 2);
          th = a.bulat(0, 1); tv = a.bulat(0, 1);
          if (level !== 'mudah' && th === 0 && tv === 0) { ok = false; return; }
          var b = a.bulat(0, 1);
          var m = function (x) { return dua[mod(x, 2)]; };
          v00 = m(b); v01 = m(b + th); v10 = m(b + tv); v11 = m(b + th + tv);
        } else if (info.tipe === 'bilangan') {
          th = a.pilih([-1, 0, 1]); tv = a.pilih([-1, 0, 1]);
          var lo = Math.max(0, -Math.min(0, th) - Math.min(0, tv)), hi = info.n - 1 - Math.max(0, th) - Math.max(0, tv);
          if (lo > hi) { ok = false; return; }
          v00 = a.bulat(lo, hi); v01 = v00 + th; v10 = v00 + tv; v11 = v00 + th + tv;
        } else {
          var ks = nm === 'arah' ? [0, 1, 2, -1, -2] : (nm === 'titik' ? [0, 1] : [0, 1, -1, 2]);
          th = a.pilih(ks); tv = a.pilih(ks);
          if (nm === 'isi' && th === 2) th = -1;
          v00 = a.bulat(0, info.n - 1); v01 = mod(v00 + th, info.n); v10 = mod(v00 + tv, info.n); v11 = mod(v00 + th + tv, info.n);
        }
        if (level !== 'mudah' && th === 0 && tv === 0) { ok = false; return; }
        var gh = [[v00, v01], [v10, null]];
        var r = Inf.matriks2(info, gh);
        if (r.status !== 'unik' || r.nilai !== v11) { ok = false; return; }
        if (th !== 0 || tv !== 0) bergerak++;
        data[nm] = { g: [[v00, v01], [v10, v11]], th: th, tv: tv, dua: dua };
      });
      if (!ok || bergerak < kanal.length - (level === 'mudah' ? 1 : 0) || bergerak < 1) continue;
      var grid = [[{}, {}], [{}, {}]];
      kanal.forEach(function (nm) { for (var r = 0; r < 2; r++) for (var c = 0; c < 2; c++) grid[r][c][nm] = data[nm].g[r][c]; });
      var kunci = grid[1][1];
      var godaan = function (nm) {
        var d = data[nm], info = K[nm], g = [d.g[0][1], d.g[1][0], d.g[0][0]];
        if (info.tipe === 'siklik') { g.push(mod(d.g[1][1] + 1, info.n)); g.push(mod(d.g[1][1] - 1, info.n)); }
        if (info.tipe === 'bilangan') { g.push(d.g[1][1] + 1); g.push(d.g[1][1] - 1); }
        if (nm === 'bentuk') g.push(d.dua[0], d.dua[1]);
        else for (var v = 0; v < info.n; v++) g.push(v);
        return g.filter(function (v, i) { return v >= 0 && v < info.n && g.indexOf(v) === i && (nm !== 'bentuk' || d.dua.indexOf(v) >= 0 || true); });
      };
      var peng = pengecoh(a, kunci, kanal, godaan, function (nm, benar, salah) { return alasanKanal(nm, benar, salah); });
      if (!peng) continue;
      var pem = ['Perhatikan perubahan dari kotak kiri ke kotak kanan (baris yang sama) dan dari kotak atas ke kotak bawah (kolom yang sama). Perubahan yang sama diterapkan pada kotak yang hilang:'];
      kanal.forEach(function (nm) {
        var d = data[nm], info = K[nm], nmv = NAMA[nm];
        var kiriKanan = d.g[0][0] === d.g[0][1] ? 'tetap ' + nmv[d.g[0][0]] : nmv[d.g[0][0]] + ' menjadi ' + nmv[d.g[0][1]];
        var atasBawah = d.g[0][0] === d.g[1][0] ? 'tetap ' + nmv[d.g[0][0]] : nmv[d.g[0][0]] + ' menjadi ' + nmv[d.g[1][0]];
        pem.push('• ' + Fmt.kapital(LABEL[nm]) + ': ke kanan (' + kiriKanan + '), ke bawah (' + atasBawah + '). Kotak kanan-bawah = ' + nmv[d.g[1][1]] + '.');
      });
      return { tipe: 'matriks-2', grid: grid, mr: 1, mc: 1, kunci: kunci, peng: peng, kanal: kanal, pembahasan: pem, aturan: kanal.map(function (nm) { return nm + ':tambah(' + data[nm].th + ',' + data[nm].tv + ')'; }).join(',') };
    }
    return null;
  }

  // ======================================================================= rakit

  function rakit(id, level, benih, opsi) {
    opsi = opsi || {};
    var a = Rng.alat(benih);
    var target = opsi.target == null ? a.bulat(0, 4) : opsi.target;
    var spec = null;
    for (var c = 0; c < 20 && !spec; c++) {
      if (id === 'serial') spec = buatSerial(a, level, target, benih);
      else if (id === 'matriks-3') spec = buatMatriks3(a, level, target);
      else spec = buatMatriks2(a, level);
    }
    if (!spec) return null;

    // susun pilihan: kunci di posisi `target`, pengecoh mengisi sisanya
    var daftar = a.kocok(spec.peng.map(function (p) { return { cell: p.cell, alasan: p.alasan.join('; '), kunci: false }; }));
    daftar.splice(target, 0, { cell: spec.kunci, alasan: null, kunci: true });
    var ctx = { subtes: 'ku', submateri: 'figural', keluarga: id, level: level, benih: benih, a: a };
    var gambarSoal;
    var desc;
    if (spec.tipe === 'serial') desc = { id: 'soal', jenis: 'serial', model: { sels: spec.sels }, judul: 'Deret kotak' };
    else desc = { id: 'soal', jenis: 'matriks', model: { grid: spec.grid, mr: spec.mr, mc: spec.mc }, judul: spec.tipe === 'matriks-3' ? 'Matriks 3x3' : 'Matriks 2x2' };
    var opsiGambar = daftar.map(function (d, i) {
      return { teks: 'Gambar opsi ' + Fmt.huruf(i), nilai: i, alasan: d.alasan, kunci: d.kunci, gambar: { id: 'opsi-' + Fmt.huruf(i).toLowerCase(), jenis: 'sel', model: { cell: d.cell }, judul: 'Opsi ' + Fmt.huruf(i) } };
    });
    var idxKunci = target;
    var pilih = { opsi: opsiGambar, kunciIndex: idxKunci };
    var jenisNama = spec.tipe === 'serial' ? 'Figural Serial - The Next Box' : (spec.tipe === 'matriks-3' ? 'Figural Matriks - Kotak 3x3' : 'Figural Matriks - Kotak 2x2');
    var butir = Butir.rakitPg(ctx, {
      jenisSoal: jenisNama,
      judul: jenisNama, teks: [], pertanyaan: '', perintah: PERINTAH,
      gambar: [desc], pilihanJadi: pilih, tulisKunci: false,
      langkah: [], pembahasan: spec.pembahasan,
      model: {
        topik: 'Figural', tipe: spec.tipe, kanal: spec.kanal, aturan: spec.aturan,
        sels: spec.tipe === 'serial' ? spec.sels : null, grid: spec.tipe === 'serial' ? null : spec.grid, mr: spec.mr, mc: spec.mc,
        pilihan: daftar.map(function (d) { return d.cell; }), kunciIndex: idxKunci
      },
      sidik: { inti: 'figural|' + id + '|' + (spec.tipe === 'serial' ? spec.sels.map(sidikSel).join('/') : spec.grid.map(function (row) { return row.map(sidikSel).join('/'); }).join('//')) + '|' + spec.mr + spec.mc,
        param: [], entitas: spec.kanal.join(',') + spec.aturan }
    });
    return butir;
  }

  var KELUARGA = [
    { id: 'serial', nama: 'Deret kotak (The Next Box)', submateri: 'figural' },
    { id: 'matriks-3', nama: 'Matriks 3x3', submateri: 'figural' },
    { id: 'matriks-2', nama: 'Matriks 2x2', submateri: 'figural' }
  ];

  return {
    KELUARGA: KELUARGA, NAMA: NAMA, LABEL: LABEL, PERINTAH: PERINTAH,
    sel: sel, svgSel: svgSel, svgSerial: svgSerial, svgMatriks: svgMatriks, buat: rakit
  };
});
