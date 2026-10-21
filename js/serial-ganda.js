/*
 * serial-ganda.js — Kemampuan Umum > Figural > Serial "The Next Double Box"
 * (contoh riset BAB V, soal 6).
 *
 * Deret lima kotak; tiap kotak terdiri atas dua bagian. Bagian ATAS berisi empat lingkaran
 * di pojok (putih, abu-abu, atau hitam), satu panah di tengah, satu penanda (kotak kecil)
 * yang menempel pada salah satu sisi, dan kadang bingkai di sekeliling satu lingkaran.
 * Bagian BAWAH berisi tiga belah ketupat bertumpuk, putih atau abu-abu. Bagian atas kotak
 * kelima diganti "?", bagian bawahnya tetap terlihat.
 *
 * Aturan: bagian bawah adalah KODE PERUBAHAN. Tiap belah ketupat mewakili satu bagian
 * gambar atas (warna lingkaran, arah panah, letak penanda, atau letak bingkai). Bila
 * abu-abu, bagian itu berubah dengan cara tetap dibanding kotak sebelumnya (berputar
 * satu langkah, pindah satu sisi, dan sebagainya); bila putih, bagian itu tetap. Kotak
 * pertama adalah keadaan awal (ketiga belah ketupatnya putih). Peserta menyimpulkan arti
 * tiap belah ketupat dari kotak 1-4, lalu menerapkan kode kotak kelima pada kotak keempat.
 *
 *   mudah   tiap peralihan hanya satu belah ketupat abu-abu; kotak kelima satu
 *   sedang  satu atau dua peralihan dengan DUA belah ketupat abu-abu sekaligus (dua bagian
 *           berubah bersamaan); kotak kelima juga dua
 *   sulit   dua atau tiga peralihan berkode ganda, bingkai ikut dipakai (berubah atau tetap);
 *           kotak kelima dua atau tiga belah ketupat abu-abu
 *
 * Pada peralihan berkode ganda arti tiap belah ketupat tetap dapat dipisahkan: pola abu-abu
 * ketiga belah ketupat pada kotak 2-4 selalu berbeda, jadi setiap bagian gambar atas hanya
 * cocok dengan satu belah ketupat (diperiksa validator lewat `Inferensi.ganda`). `pola` butir
 * mencatat banyak kode per peralihan, cara warna berubah, dan dipakainya bingkai, mis.
 * "serial-ganda:dua-kode+warna-putar+bingkai"; penyusun mendahulukan pola yang belum dipakai.
 *
 * Pola kode dipilih supaya arti tiap belah ketupat pasti terbaca: setiap belah ketupat
 * abu-abu sedikitnya sekali pada kotak 2-4, tidak abu-abu terus, dan pola abu-abunya
 * berbeda dari belah ketupat lain. Warna lingkaran dipilih tanpa simetri (pojok yang
 * berseberangan berbeda, baris dan kolom tidak seragam) sehingga setiap perubahan warna
 * tampak dan tidak ada dua cara perubahan yang hasilnya kebetulan sama.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./rng.js'), require('./svg.js'), require('./bentuk.js'), require('./butir.js'), require('./format.js'), require('./metrik.js'));
    module.exports = api;
  } else {
    api = factory(root.Rng, root.Svg, root.Bentuk, root.Butir, root.Fmt, root.Metrik);
    root.SerialGanda = api;
  }
})(typeof self !== 'undefined' ? self : this, function (Rng, S, Bentuk, Butir, Fmt, Metrik) {
  'use strict';

  var PERINTAH = 'Gunakan gambar di bagian atas untuk menentukan jawaban yang benar dari pilihan di bawah. Pilih jawaban yang menggantikan tanda tanya. Jika tidak ada tanda tanya, pilih jawaban yang merupakan kelanjutan dari urutan tersebut.';
  var WARNA = ['putih', 'abu-abu', 'hitam'];
  var ISI = ['#ffffff', '#9a9a9a', '#1d1d1d'];
  var ARAH = ['atas', 'kanan', 'bawah', 'kiri'];
  var POJOK = ['kiri atas', 'kanan atas', 'kanan bawah', 'kiri bawah'];
  var LETAK_KETUPAT = ['atas', 'tengah', 'bawah'];
  var LABEL = { warna: 'warna lingkaran', panah: 'arah panah', penanda: 'letak penanda', bingkai: 'letak bingkai' };
  var TINTA = '#1d1d1d', TEPI = '#4a5266', B = 96;

  // --------------------------------------------------------------- menggambar

  var PUSAT = [[24, 24], [72, 24], [72, 72], [24, 72]];

  function atasSvg(at, x0, y0) {
    var o = [S.rect(x0, y0, B, B, { isi: '#ffffff', garis: TEPI, tebal: 1.6 })];
    if (at.bingkai >= 0) {
      var pb = PUSAT[at.bingkai];
      o.push(S.rect(x0 + pb[0] - 14, y0 + pb[1] - 14, 28, 28, { isi: 'none', garis: TINTA, tebal: 1.4 }));
    }
    at.warna.forEach(function (w, i) { o.push(S.lingkaran(x0 + PUSAT[i][0], y0 + PUSAT[i][1], 8.5, { isi: ISI[w], garis: TINTA, tebal: 1.5 })); });
    var d = [[0, -1], [1, 0], [0, 1], [-1, 0]][at.panah], cx = x0 + 48, cy = y0 + 48, p = [-d[1], d[0]];
    var ujung = [cx + d[0] * 16, cy + d[1] * 16];
    o.push(S.garis(cx - d[0] * 16, cy - d[1] * 16, ujung[0] - d[0] * 6, ujung[1] - d[1] * 6, { garis: TINTA, tebal: 2, ujung: 'round' }));
    o.push(S.poli([ujung, [ujung[0] - d[0] * 8 + p[0] * 4.5, ujung[1] - d[1] * 8 + p[1] * 4.5], [ujung[0] - d[0] * 8 - p[0] * 4.5, ujung[1] - d[1] * 8 - p[1] * 4.5]], { tutup: true, isi: TINTA, garis: TINTA, tebal: 1, sambung: 'round' }));
    var pp = [[41.5, 0], [83, 41.5], [41.5, 83], [0, 41.5]][at.penanda];
    o.push(S.rect(x0 + pp[0], y0 + pp[1], 13, 13, { isi: '#ffffff', garis: TINTA, tebal: 1.4 }));
    return o.join('');
  }

  function bawahSvg(bw, x0, y0) {
    var o = [S.rect(x0, y0, B, B, { isi: '#ffffff', garis: TEPI, tebal: 1.6 })];
    bw.forEach(function (v, j) { o.push(Bentuk.svg('belah-ketupat', x0 + 48, y0 + 22 + j * 26, 9.5, { isi: v ? '#9a9a9a' : '#ffffff', garis: TINTA, tebal: 1.4 })); });
    return o.join('');
  }

  /** Deret lima kotak ganda; bagian atas kotak yang `atas`-nya null diganti "?". */
  function svgDeret(kotak) {
    var gap = 14, pad = 6, o = [];
    kotak.forEach(function (k, i) {
      var x = pad + i * (B + gap);
      if (k.atas) o.push(atasSvg(k.atas, x, pad));
      else {
        o.push(S.rect(x, pad, B, B, { isi: '#f4f6fb', garis: TEPI, tebal: 1.6 }));
        o.push(S.teks('?', x + B / 2, pad + B / 2 + 16, { ukuran: 46, tebal: true, isi: '#4a5266', rata: 'middle' }));
      }
      o.push(bawahSvg(k.bawah, x, pad + B));
    });
    var W = pad * 2 + kotak.length * B + (kotak.length - 1) * gap, H = pad * 2 + 2 * B;
    return { svg: S.doc(o.join(''), W, H, { latar: '#ffffff' }), lebar: W, tinggi: H };
  }

  /** Pilihan jawaban: bagian atas saja. */
  function svgAtas(at) {
    var pad = 5, W = B + pad * 2;
    return { svg: S.doc(atasSvg(at, pad, pad), W, W, { latar: '#ffffff' }), lebar: W, tinggi: W };
  }

  // --------------------------------------------------------- gambar pembahasan

  /*
   *   ganda-arti   arti tiap belah ketupat: belah ketupat itu (berwarna sendiri), contoh perubahan
   *                bagian yang diaturnya dari deret soal (kotak t -> t+1), dan uraian singkatnya
   *   ganda-akhir  kotak 4 -> kotak 5: belah ketupat abu-abu kotak 5 dan bagian yang diubahnya
   *                dilingkari warna yang sama; bagian lain ditulis "tetap"
   */
  var BH = S.BAHAS, WARNA_KODE = ['#d35400', '#8e44ad', '#0e7c86'];

  function teksB(s, x, y, o) {
    o = o || {};
    return S.teks(s, x, y, { ukuran: o.ukuran || 11, tebal: o.tebal, isi: o.isi || BH.teks, rata: o.rata });
  }

  /** Teks yang dipenggal sesuai lebar; mengembalikan { svg, baris }. */
  function paragrafB(s, x, y, lebar, o) {
    o = o || {};
    var uk = o.ukuran || 11, baris = Metrik.penggal(s, lebar, uk, o.tebal);
    return { svg: baris.map(function (b, i) { return teksB(b, x, y + i * (uk + 4), o); }).join(''), baris: baris.length };
  }

  /** Satu bagian gambar atas saja (koordinat 0..B), garis dipertebal `kali` untuk gambar kecil. */
  function atasBagian(at, bagian, kali) {
    var o = [S.rect(0, 0, B, B, { isi: '#ffffff', garis: '#c4cad6', tebal: 1.2 * kali })];
    if (bagian === 'warna' || bagian === 'bingkai') {
      at.warna.forEach(function (w, i) {
        var redup = bagian === 'bingkai';
        o.push(S.lingkaran(PUSAT[i][0], PUSAT[i][1], 9.5, { isi: redup ? '#ffffff' : ISI[w], garis: redup ? '#b5bccb' : TINTA, tebal: 1.5 * kali }));
      });
    }
    if (bagian === 'bingkai' && at.bingkai >= 0) {
      var pb = PUSAT[at.bingkai];
      o.push(S.rect(pb[0] - 15, pb[1] - 15, 30, 30, { isi: 'none', garis: TINTA, tebal: 1.6 * kali }));
    }
    if (bagian === 'panah') {
      var d = [[0, -1], [1, 0], [0, 1], [-1, 0]][at.panah];
      o.push(S.panah(48 - d[0] * 22, 48 - d[1] * 22, 48 + d[0] * 22, 48 + d[1] * 22, { warna: TINTA, tebal: 2.2 * kali, kepala: 14 }));
    }
    if (bagian === 'penanda') {
      var pp = [[41.5, 0], [83, 41.5], [41.5, 83], [0, 41.5]][at.penanda];
      o.push(S.rect(pp[0], pp[1], 13, 13, { isi: TINTA, garis: TINTA, tebal: 1.4 * kali }));
    }
    return o.join('');
  }

  /** Cincin penanda di sekeliling bagian yang berubah pada gambar atas (koordinat kotak). */
  function cincinBagian(at, bagian, x0, y0, warna) {
    var g = { isi: 'none', garis: warna, tebal: 2.2 };
    if (bagian === 'warna') return PUSAT.map(function (p) { return S.lingkaran(x0 + p[0], y0 + p[1], 12.5, g); }).join('');
    if (bagian === 'panah') return S.lingkaran(x0 + 48, y0 + 48, 20, g);
    if (bagian === 'penanda') { var pp = [[41.5, 0], [83, 41.5], [41.5, 83], [0, 41.5]][at.penanda]; return S.rect(x0 + pp[0] - 3.5, y0 + pp[1] - 3.5, 20, 20, Object.assign({ rx: 4 }, g)); }
    var pb = PUSAT[at.bingkai];
    return S.rect(x0 + pb[0] - 18, y0 + pb[1] - 18, 36, 36, Object.assign({ rx: 5 }, g));
  }

  function labelUbah(ub) {
    var jam = ub.k > 0 ? 'searah jarum jam' : 'berlawanan arah jarum jam';
    if (ub.bagian === 'warna') return ub.cara === 'putar' ? 'warna keempat lingkaran berpindah satu pojok ' + jam : 'warna tiap lingkaran maju satu langkah: putih → abu-abu → hitam → putih';
    if (ub.bagian === 'panah') return ub.k === 2 ? 'panah berbalik arah' : 'panah berputar 90° ' + jam;
    if (ub.bagian === 'penanda') return ub.k === 2 ? 'penanda pindah ke sisi seberangnya' : 'penanda pindah satu sisi ' + jam;
    return 'bingkai pindah ke lingkaran berikutnya ' + jam;
  }

  /** Belah ketupat kecil bertumpuk; yang ke-j disorot dengan warnanya. */
  function ketupatKecil(x, y, j) {
    return [0, 1, 2].map(function (i) {
      return Bentuk.svg('belah-ketupat', x, y + i * 18, 7, { isi: i === j ? '#9a9a9a' : '#ffffff', garis: i === j ? WARNA_KODE[j] : '#9aa3b5', tebal: i === j ? 2.4 : 1.2 });
    }).join('');
  }

  /** Arti tiap belah ketupat beserta contoh perubahannya dari deret soal. */
  function svgArti(m, judul) {
    var pad = 8, W = 500, tinggiBaris = 80, y0 = pad + 26, o = [teksB(judul, pad, pad + 13, { ukuran: 13, tebal: true })];
    var atas = m.kotak.map(function (k) { return k.atas; }), bawah = m.kotak.map(function (k) { return k.bawah; });
    m.arti.forEach(function (ub, j) {
      var y = y0 + j * tinggiBaris, abu = [];
      for (var t = 1; t < 4; t++) if (bawah[t][j]) abu.push(t);
      o.push(S.rect(pad, y, W - pad * 2, tinggiBaris - 6, { rx: 5, isi: j % 2 ? '#ffffff' : '#f6f8fc' }));
      o.push(ketupatKecil(pad + 18, y + 18, j));
      // contoh: peralihan pertama yang belah ketupat ini abu-abu
      var t0 = abu[0], u = 52, s = u / B;
      o.push('<g transform="translate(' + (pad + 44) + ',' + (y + 6) + ') scale(' + s + ')">' + atasBagian(atas[t0 - 1], ub.bagian, 1.6) + '</g>');
      o.push(S.panah(pad + 44 + u + 5, y + 6 + u / 2, pad + 44 + u + 25, y + 6 + u / 2, { warna: WARNA_KODE[j], tebal: 2, kepala: 7 }));
      o.push('<g transform="translate(' + (pad + 44 + u + 30) + ',' + (y + 6) + ') scale(' + s + ')">' + atasBagian(atas[t0], ub.bagian, 1.6) + '</g>');
      o.push(teksB('kotak ' + t0, pad + 44 + u / 2, y + u + 18, { ukuran: 10, rata: 'middle', isi: BH.teksRedup }));
      o.push(teksB('kotak ' + (t0 + 1), pad + 44 + u * 1.5 + 30, y + u + 18, { ukuran: 10, rata: 'middle', isi: BH.teksRedup }));
      var tx = pad + 44 + u * 2 + 44, lebar = W - pad - tx - 6;
      o.push(teksB('Belah ketupat ' + LETAK_KETUPAT[j] + ' = ' + LABEL[ub.bagian], tx, y + 17, { ukuran: 12, tebal: true, isi: WARNA_KODE[j] }));
      o.push(paragrafB('Abu-abu pada kotak ' + daftarKata(abu.map(function (x) { return String(x + 1); })) + '; setiap kali abu-abu: ' + labelUbah(ub) + '.', tx, y + 34, lebar).svg);
    });
    var H = y0 + m.arti.length * tinggiBaris;
    if (m.tetap) { o.push(teksB(Fmt.kapital(LABEL[m.tetap]) + ' tidak diatur belah ketupat mana pun, jadi tidak pernah berubah.', pad + 4, H + 8, { isi: BH.teksRedup })); H += 18; }
    H += pad;
    return { svg: S.doc(o.join(''), W, H, { latar: '#ffffff' }), lebar: W, tinggi: H };
  }

  /** Kotak 4 -> kotak 5: kode aktif dan bagian yang diubahnya dilingkari warna yang sama. */
  function svgAkhir(m, judul) {
    var pad = 8, y0 = pad + 26 + 16, x4 = pad, x5 = pad + B + 64, tx = x5 + B + 18, W = 500, o = [teksB(judul, pad, pad + 13, { ukuran: 13, tebal: true })];
    o.push(teksB('Kotak 4', x4 + B / 2, y0 - 6, { rata: 'middle', tebal: true }));
    o.push(teksB('Kotak 5 (jawaban)', x5 + B / 2, y0 - 6, { rata: 'middle', tebal: true, isi: BH.jawab }));
    o.push(atasSvg(m.k4.atas, x4, y0));
    o.push(bawahSvg(m.k4.bawah, x4, y0 + B));
    o.push(atasSvg(m.jawaban, x5, y0));
    o.push(bawahSvg(m.kode5, x5, y0 + B));
    o.push(S.rect(x5 - 2, y0 - 2, B + 4, 2 * B + 4, { isi: 'none', garis: BH.jawab, tebal: 2.6 }));
    o.push(S.panah(x4 + B + 10, y0 + B / 2, x5 - 10, y0 + B / 2, { warna: BH.panah, tebal: 2.2, kepala: 9 }));
    var aktif = [0, 1, 2].filter(function (j) { return m.kode5[j]; });
    aktif.forEach(function (j) {
      o.push(S.lingkaran(x5 + 48, y0 + B + 22 + j * 26, 15, { isi: 'none', garis: WARNA_KODE[j], tebal: 2.4 }));
      o.push(cincinBagian(m.jawaban, m.arti[j].bagian, x5, y0, WARNA_KODE[j]));
    });
    var y = y0 + 4;
    o.push(teksB('Kode kotak 5:', tx, y + 10, { ukuran: 12, tebal: true }));
    y += 28;
    aktif.forEach(function (j) {
      o.push(S.rect(tx, y - 9, 10, 10, { isi: WARNA_KODE[j] }));
      var p = paragrafB('belah ketupat ' + LETAK_KETUPAT[j] + ' abu-abu: ' + labelUbah(m.arti[j]), tx + 16, y, W - pad - tx - 16, { isi: WARNA_KODE[j] });
      o.push(p.svg);
      y += p.baris * 15 + 6;
    });
    var tetap = [0, 1, 2].filter(function (j) { return !m.kode5[j]; }).map(function (j) { return LABEL[m.arti[j].bagian]; });
    if (m.tetap) tetap.push(LABEL[m.tetap]);
    if (tetap.length) {
      var q = paragrafB('Tetap: ' + daftarKata(tetap) + '.', tx, y + 4, W - pad - tx, { isi: BH.teksRedup });
      o.push(q.svg);
    }
    var H = y0 + 2 * B + pad + 2;
    return { svg: S.doc(o.join(''), W, H, { latar: '#ffffff' }), lebar: W, tinggi: H };
  }

  // --------------------------------------------------------------- perubahan

  function mod(a, n) { return ((a % n) + n) % n; }
  function salin(at) { return { warna: at.warna.slice(), panah: at.panah, penanda: at.penanda, bingkai: at.bingkai }; }

  /** Terapkan satu perubahan ({bagian, cara, k}) pada salinan bagian atas. */
  function terapkan(at, ub, kali) {
    var h = salin(at);
    for (var n = 0; n < (kali == null ? 1 : kali); n++) {
      if (ub.bagian === 'warna') {
        var w = h.warna;
        if (ub.cara === 'putar') h.warna = [0, 1, 2, 3].map(function (i) { return w[mod(i - ub.k, 4)]; });
        else h.warna = w.map(function (x) { return mod(x + ub.k, 3); });
      } else if (ub.bagian === 'bingkai') { if (h.bingkai >= 0) h.bingkai = mod(h.bingkai + ub.k, 4); }
      else h[ub.bagian] = mod(h[ub.bagian] + ub.k, 4);
    }
    return h;
  }

  function uraianUbah(ub) {
    var arahJam = function (k) { return k > 0 ? 'searah jarum jam' : 'berlawanan arah jarum jam'; };
    if (ub.bagian === 'warna') {
      if (ub.cara === 'putar') return 'warna keempat lingkaran berpindah satu pojok ' + arahJam(ub.k);
      return 'warna tiap lingkaran maju satu langkah pada siklus putih → abu-abu → hitam → putih';
    }
    if (ub.bagian === 'panah') return ub.k === 2 ? 'panah berbalik arah' : 'panah berputar 90 derajat ' + arahJam(ub.k);
    if (ub.bagian === 'penanda') return ub.k === 2 ? 'penanda pindah ke sisi seberangnya' : 'penanda pindah ke sisi berikutnya ' + arahJam(ub.k);
    return 'bingkai pindah ke lingkaran berikutnya ' + arahJam(ub.k);
  }

  function pilihUbah(a, bagian, level) {
    if (bagian === 'warna') return a.pilih([{ cara: 'putar', k: 1 }, { cara: 'putar', k: -1 }, { cara: 'siklus', k: 1 }]);
    if (bagian === 'panah') return { cara: 'geser', k: a.pilih(level === 'mudah' ? [1, -1] : [1, -1, 2]) };
    if (bagian === 'penanda') return { cara: 'geser', k: a.pilih(level === 'mudah' ? [1, -1] : [1, -1, 2]) };
    return { cara: 'geser', k: a.pilih([1, -1]) };
  }

  /** Warna awal tanpa simetri: pojok berseberangan berbeda, baris dan kolom tidak seragam. */
  function warnaAwal(a) {
    for (var c = 0; c < 200; c++) {
      var w = [a.bulat(0, 2), a.bulat(0, 2), a.bulat(0, 2), a.bulat(0, 2)];
      if (w[0] === w[2] || w[1] === w[3]) continue;
      if (w[0] === w[3] && w[1] === w[2]) continue;
      if (w[0] === w[1] && w[2] === w[3]) continue;
      return w;
    }
    return [2, 1, 0, 0];
  }

  /** Kode peralihan kotak 2-4 (baris) x belah ketupat (kolom) yang artinya pasti terbaca. */
  function pilihKode(a, level) {
    var satu = [[1, 0, 0], [0, 1, 0], [0, 0, 1]], dua = [[1, 1, 0], [1, 0, 1], [0, 1, 1]];
    for (var c = 0; c < 400; c++) {
      var T;
      if (level === 'mudah') T = a.kocok(satu);
      else {
        var nDua = level === 'sedang' ? a.pilih([1, 1, 2]) : a.pilih([2, 2, 3]);
        T = a.kocok(a.ambil(dua, Math.min(nDua, 3)).concat(a.ambil(satu, 3 - Math.min(nDua, 3))));
      }
      var kol = [0, 1, 2].map(function (j) { return T.map(function (row) { return row[j]; }).join(''); });
      if (kol.some(function (k) { return k === '000' || k === '111'; })) continue;
      if (kol[0] === kol[1] || kol[0] === kol[2] || kol[1] === kol[2]) continue;
      return T;
    }
    return null;
  }

  // --------------------------------------------------------------- pengecoh

  function sidikAtas(at) { return at.warna.join('') + '|' + at.panah + '|' + at.penanda + '|' + at.bingkai; }

  function buatPengecoh(a, level, atas4, arti, kode5, tetap) {
    var abu = [0, 1, 2].filter(function (j) { return kode5[j]; }), putih = [0, 1, 2].filter(function (j) { return !kode5[j]; });
    function jalankan(daftar) {
      var h = atas4;
      daftar.forEach(function (x) { h = terapkan(h, x.ub, x.kali); });
      return h;
    }
    var dasar = abu.map(function (j) { return { ub: arti[j], kali: 1 }; });
    var calon = [];
    abu.forEach(function (j) {
      calon.push({ at: jalankan(dasar.filter(function (x) { return x.ub !== arti[j]; })), alasan: 'perubahan yang ditandai belah ketupat ' + LETAK_KETUPAT[j] + ' (' + uraianUbah(arti[j]) + ') tidak dilakukan' });
      // berbalik dua kali sama dengan tidak berubah: pengecoh itu sudah diwakili baris di atas
      if (arti[j].k !== 2) calon.push({ at: jalankan(dasar.map(function (x) { return x.ub === arti[j] ? { ub: x.ub, kali: 2 } : x; })), alasan: LABEL[arti[j].bagian] + ' berubah dua langkah, padahal satu belah ketupat abu-abu berarti satu kali perubahan' });
      if (arti[j].k !== 2 && arti[j].cara !== 'siklus') {
        var balik = { bagian: arti[j].bagian, cara: arti[j].cara, k: -arti[j].k };
        calon.push({ at: jalankan(dasar.map(function (x) { return x.ub === arti[j] ? { ub: balik, kali: 1 } : x; })), alasan: LABEL[arti[j].bagian] + ' berubah ke arah sebaliknya (seharusnya ' + uraianUbah(arti[j]) + ')' });
      }
    });
    putih.forEach(function (j) {
      calon.push({ at: jalankan(dasar.concat([{ ub: arti[j], kali: 1 }])), alasan: LABEL[arti[j].bagian] + ' ikut berubah padahal belah ketupat ' + LETAK_KETUPAT[j] + ' pada kotak kelima putih' });
    });
    calon.push({ at: salin(atas4), alasan: 'sama persis dengan kotak keempat, padahal kotak kelima memuat belah ketupat abu-abu' });
    if (tetap === 'bingkai' && atas4.bingkai >= 0) {
      calon.push({ at: terapkan(jalankan(dasar), { bagian: 'bingkai', k: 1 }), alasan: 'bingkai ikut berpindah, padahal letak bingkai tidak pernah berubah pada deret ini' });
    } else if (tetap) {
      var ubT = tetap === 'warna' ? { bagian: 'warna', cara: 'putar', k: 1 } : { bagian: tetap, k: 1 };
      calon.push({ at: terapkan(jalankan(dasar), ubT), alasan: LABEL[tetap] + ' ikut berubah, padahal bagian itu tidak pernah berubah pada deret ini' });
    }
    var kunci = jalankan(dasar), hasil = [], lihat = {};
    lihat[sidikAtas(kunci)] = 1;
    var urut = a.kocok(calon);
    if (level === 'mudah') urut.sort(function (x, y) { return (/tidak dilakukan|ikut berubah padahal belah/.test(y.alasan) ? 1 : 0) - (/tidak dilakukan|ikut berubah padahal belah/.test(x.alasan) ? 1 : 0); });
    for (var i = 0; i < urut.length && hasil.length < 4; i++) {
      var sd = sidikAtas(urut[i].at);
      if (lihat[sd]) continue;
      lihat[sd] = 1;
      hasil.push(urut[i]);
    }
    return hasil.length === 4 ? hasil : null;
  }

  function uraianAtas(at) {
    return 'lingkaran (kiri atas, kanan atas, kanan bawah, kiri bawah) ' + at.warna.map(function (w) { return WARNA[w]; }).join(', ') +
      '; panah ke ' + ARAH[at.panah] + '; penanda di sisi ' + ARAH[at.penanda] + (at.bingkai >= 0 ? '; bingkai pada lingkaran ' + POJOK[at.bingkai] : '');
  }

  function jumlahAbu(kode) { return kode.reduce(function (s, x) { return s + x; }, 0); }

  function daftarKata(xs) { return xs.length <= 1 ? xs.join('') : xs.slice(0, -1).join(', ') + ' dan ' + xs[xs.length - 1]; }

  // --------------------------------------------------------------------- butir

  function buat(id, level, benih, opsi) {
    opsi = opsi || {};
    var a = Rng.alat(benih);
    var target = opsi.target == null ? a.bulat(0, 4) : opsi.target;
    for (var coba = 0; coba < 30; coba++) {
      var pakaiBingkai = level === 'sulit' || (level === 'sedang' && a.untung(0.5));
      var bagian = ['warna', 'panah', 'penanda'].concat(pakaiBingkai ? ['bingkai'] : []);
      var dikode = level === 'sulit' ? a.ambil(bagian, 3) : a.ambil(['warna', 'panah', 'penanda'], 3);
      var tetap = bagian.filter(function (x) { return dikode.indexOf(x) < 0; })[0] || null;
      var arti = a.kocok(dikode).map(function (bg) { var u = pilihUbah(a, bg, level); u.bagian = bg; return u; });
      var T = pilihKode(a, level);
      if (!T) continue;
      var warnaUb = arti.filter(function (u) { return u.bagian === 'warna'; })[0];
      var pola = 'serial-ganda:' + (level === 'mudah' ? 'satu-kode' : 'dua-kode') + '+warna-' + (warnaUb ? warnaUb.cara : 'tetap') + (pakaiBingkai ? '+bingkai' : '');
      // mekanisme yang sudah dipakai butir serial lain pada paket ini dihindari selama percobaan masih banyak
      if (coba < 20 && (opsi.polaDipakai || []).indexOf(pola) >= 0) continue;
      var kode5;
      if (level === 'mudah') kode5 = a.pilih([[1, 0, 0], [0, 1, 0], [0, 0, 1]]);
      else if (level === 'sedang') kode5 = a.pilih([[1, 1, 0], [1, 0, 1], [0, 1, 1]]);
      else kode5 = a.pilih([[1, 1, 0], [1, 0, 1], [0, 1, 1], [1, 1, 1]]);

      var awal = { warna: warnaAwal(a), panah: a.bulat(0, 3), penanda: a.bulat(0, 3), bingkai: pakaiBingkai ? a.bulat(0, 3) : -1 };
      var bawah = [[0, 0, 0]].concat(T, [kode5]), atas = [awal];
      for (var t = 1; t < 5; t++) {
        var h = atas[t - 1];
        for (var j = 0; j < 3; j++) if (bawah[t][j]) h = terapkan(h, arti[j]);
        atas.push(h);
      }
      var kunci = atas[4];
      // kotak 1-4 tidak boleh ada yang kembar (tiap peralihan memang mengubah sesuatu)
      var sidik = atas.map(sidikAtas);
      if (sidik.slice(0, 4).some(function (s, i) { return sidik.indexOf(s) !== i; })) continue;
      var peng = buatPengecoh(a, level, atas[3], arti, kode5, tetap);
      if (!peng) continue;

      var pem = ['Bagian bawah tiap kotak adalah kode perubahan. Setiap belah ketupat mewakili satu bagian gambar atas: bila abu-abu, bagian itu berubah dengan cara yang sama setiap kali dibanding kotak sebelumnya; bila putih, bagian itu tetap. Kotak pertama adalah keadaan awal (ketiga belah ketupatnya putih). Gambar 1 memasangkan tiap belah ketupat dengan bagian yang diaturnya beserta contoh perubahannya dari deret soal.'];
      [0, 1, 2].forEach(function (j) {
        var kotakAbu = [];
        for (var tt = 1; tt < 4; tt++) if (bawah[tt][j]) kotakAbu.push(tt + 1);
        pem.push('• Belah ketupat ' + LETAK_KETUPAT[j] + ' abu-abu pada kotak ' + daftarKata(kotakAbu.map(String)) + ', dan hanya pada ' + (kotakAbu.length > 1 ? 'kotak-kotak' : 'kotak') + ' itu ' + LABEL[arti[j].bagian] + ' berubah: ' + uraianUbah(arti[j]) + '.');
      });
      if (tetap) pem.push('• ' + Fmt.kapital(LABEL[tetap]) + ' tidak pernah berubah.');
      var kodeGanda = [1, 2, 3].filter(function (tt) { return jumlahAbu(bawah[tt]) > 1; });
      if (kodeGanda.length) pem.push('Pada kotak ' + daftarKata(kodeGanda.map(function (tt) { return String(tt + 1); })) + ' ada lebih dari satu belah ketupat abu-abu sekaligus, jadi beberapa bagian berubah bersamaan; arti tiap belah ketupat tetap dapat dipisahkan karena pola abu-abunya pada kotak 2-4 berbeda-beda.');
      var abuJ = [0, 1, 2].filter(function (j) { return kode5[j]; }), putihJ = [0, 1, 2].filter(function (j) { return !kode5[j]; });
      var bagianTetap = putihJ.map(function (j) { return LABEL[arti[j].bagian]; }).concat(tetap ? [LABEL[tetap]] : []);
      pem.push('Gambar 2 menerapkan kode kotak kelima pada kotak keempat. Kotak kelima: belah ketupat ' + daftarKata(abuJ.map(function (j) { return LETAK_KETUPAT[j]; })) + ' abu-abu' + (putihJ.length ? ', ' + daftarKata(putihJ.map(function (j) { return LETAK_KETUPAT[j]; })) + ' putih' : '') +
        '. Dari kotak keempat: ' + daftarKata(abuJ.map(function (j) { return uraianUbah(arti[j]); })) + ' (dilingkari warna yang sama dengan belah ketupatnya)' + (bagianTetap.length ? '; ' + daftarKata(bagianTetap) + ' tetap' : '') + '.');
      pem.push('Hasilnya: ' + uraianAtas(kunci) + '.');

      var daftar = a.kocok(peng.map(function (p) { return { at: p.at, alasan: p.alasan, kunci: false }; }));
      daftar.splice(target, 0, { at: kunci, alasan: null, kunci: true });
      var opsiGambar = daftar.map(function (d, i) {
        return { teks: 'Gambar opsi ' + Fmt.huruf(i), nilai: i, alasan: d.alasan, kunci: d.kunci,
          gambar: { id: 'opsi-' + Fmt.huruf(i).toLowerCase(), jenis: 'ganda-opsi', model: { atas: d.at }, judul: 'Opsi ' + Fmt.huruf(i) } };
      });
      var kotak = atas.map(function (at, i) { return { atas: i === 4 ? null : at, bawah: bawah[i] }; });
      var ctx = { subtes: 'ku', submateri: 'figural', keluarga: id, level: level, benih: benih, a: a };
      var butir = Butir.rakitPg(ctx, {
        jenisSoal: 'Figural Serial - The Next Double Box',
        judul: 'Figural Serial - The Next Double Box', teks: [], pertanyaan: '', perintah: PERINTAH,
        gambar: [{ id: 'soal', jenis: 'ganda', model: { kotak: kotak }, judul: 'Deret kotak ganda' }],
        pilihanJadi: { opsi: opsiGambar, kunciIndex: target }, tulisKunci: false,
        langkah: [], pembahasan: pem,
        model: {
          topik: 'Figural', tipe: 'serial-ganda', kotak: kotak, arti: arti.map(function (u) { return u.bagian + ':' + u.cara + ':' + u.k; }),
          pilihan: daftar.map(function (d) { return d.at; }), kunciIndex: target
        },
        sidik: { inti: 'serial-ganda|' + atas.map(sidikAtas).join('/') + '|' + bawah.map(function (x) { return x.join(''); }).join('/'), param: [], entitas: arti.map(function (u) { return u.bagian; }).join(',') }
      });
      if (!butir) continue;
      var artiPolos = arti.map(function (u) { return { bagian: u.bagian, cara: u.cara, k: u.k }; });
      butir.gambarPembahasan = [
        { id: 'bahas-1', jenis: 'ganda-arti', judul: 'Gambar 1. Arti tiap belah ketupat', model: { kotak: kotak, arti: artiPolos, tetap: tetap } },
        { id: 'bahas-2', jenis: 'ganda-akhir', judul: 'Gambar 2. Kotak 4 → kotak 5', model: { k4: kotak[3], kode5: kode5, jawaban: kunci, arti: artiPolos, tetap: tetap } }
      ];
      butir.pola = pola;
      butir.kategoriRiset = 'acuan';
      return butir;
    }
    return null;
  }

  var KELUARGA = [{ id: 'serial-ganda', nama: 'Deret kotak ganda (The Next Double Box)', submateri: 'figural' }];

  return { KELUARGA: KELUARGA, PERINTAH: PERINTAH, buat: buat, svgDeret: svgDeret, svgAtas: svgAtas, svgArti: svgArti, svgAkhir: svgAkhir };
});
