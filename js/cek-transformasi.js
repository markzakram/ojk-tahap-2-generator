/*
 * cek-transformasi.js — pemeriksa independen untuk keluarga di transformasi.js (dipanggil validator.js).
 *
 * Pemeriksa tidak memakai kode penyusun dan tidak memercayai jawaban yang disimpan. Ia membaca
 * yang TAMPIL: model gambar soal (bentuk asli, garis cermin, ikon langkah, gambar kiri/kanan),
 * teks pertanyaan, teks opsi, dan model gambar opsi. Pencerminan dan pemutaran koordinat unsur
 * dihitung sendiri di sini (rumus bayangan titik terhadap garis berarah, matriks putar searah
 * jarum jam pada koordinat layar), lalu hasilnya dipusatkan dan dibandingkan unsur demi unsur
 * dengan Figure.samaPersis (alat.Fig).
 *
 *   transformasi-cermin  arah garis diambil dari ujung-ujung garis yang digambar; urutan garis
 *                        (garis 1 lalu garis 2) dibaca dari teks pertanyaan. Kotak "?" harus
 *                        terletak di bayangan kotak gambar asli, garis tidak boleh menembus kotak.
 *   transformasi-putar   sudut, arah, dan langkah dibaca dari teks pertanyaan dan harus sama dengan
 *                        ikon langkah yang digambar.
 *   transformasi-tebak   setiap opsi teks diurai menjadi langkah, diterapkan ke gambar kiri, lalu
 *                        dicocokkan dengan gambar kanan; tidak boleh ada dua opsi yang setara.
 *
 * Semuanya: tepat satu opsi memenuhi, dan itu kunci tercetak (alat.tepatSatu).
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory();
    module.exports = api;
  } else {
    api = factory();
    root.CekTransformasi = api;
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var TOL = 1e-3;

  // ------------------------------------------------------------ geometri sendiri

  function salinUnsur(u, f) {
    var v = { jenis: u.jenis, isi: u.isi || null, tebal: u.tebal || 1, nama: u.nama || null };
    if (u.jenis === 'bulat') { v.pusat = f(u.pusat); v.jari = u.jari; }
    else { v.titik = u.titik.map(f); v.tutup = !!u.tutup; v.kepala = u.kepala || 0; }
    return v;
  }

  function petakan(fig, f) { return { unsur: fig.unsur.map(function (u) { return salinUnsur(u, f); }), keluarga: fig.keluarga, benih: fig.benih }; }

  /** Putar `derajat` SEARAH jarum jam di layar (sumbu y ke bawah) terhadap titik asal. */
  function putarFig(fig, derajat) {
    var a = derajat * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
    return petakan(fig, function (p) { return [p[0] * c - p[1] * s, p[0] * s + p[1] * c]; });
  }

  /** Bayangan terhadap garis melalui titik asal yang searah vektor `arah`. */
  function cerminFig(fig, arah) {
    var L = Math.hypot(arah[0], arah[1]), dx = arah[0] / L, dy = arah[1] / L;
    return petakan(fig, function (p) { var k = p[0] * dx + p[1] * dy; return [2 * k * dx - p[0], 2 * k * dy - p[1]]; });
  }

  /** Bayangan titik p terhadap garis yang melalui a dan b. */
  function cerminTitik(p, a, b) {
    var L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, dx = (b[0] - a[0]) / L, dy = (b[1] - a[1]) / L;
    var vx = p[0] - a[0], vy = p[1] - a[1], k = vx * dx + vy * dy;
    return [a[0] + 2 * k * dx - vx, a[1] + 2 * k * dy - vy];
  }

  /** Titik-titik rapat sepanjang semua unsur (lingkaran: keliling). */
  function cuplik(fig, langkah) {
    var out = [];
    fig.unsur.forEach(function (u) {
      if (u.jenis === 'bulat') {
        for (var i = 0; i < 36; i++) { var a = i * Math.PI / 18; out.push([u.pusat[0] + u.jari * Math.cos(a), u.pusat[1] + u.jari * Math.sin(a)]); }
        return;
      }
      var t = u.titik, n = u.tutup ? t.length : t.length - 1;
      for (var k = 0; k < n; k++) {
        var p = t[k], q = t[(k + 1) % t.length], m = Math.max(1, Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1]) / langkah));
        for (var j = 0; j <= m; j++) out.push([p[0] + (q[0] - p[0]) * j / m, p[1] + (q[1] - p[1]) * j / m]);
      }
    });
    return out;
  }

  function sama(A, B, Fig) { return Fig.samaPersis(Fig.pusatkan(A), Fig.pusatkan(B), TOL); }

  // ------------------------------------------------------------ pengurai teks

  var SUMBU_TEKS = {
    'garis tegak': [0, 1], 'garis datar': [1, 0],
    'garis miring dari kiri bawah ke kanan atas': [1, -1], 'garis miring dari kiri atas ke kanan bawah': [1, 1]
  };
  var POLA = 'diputar (\\d+)°(?: (searah|berlawanan arah) jarum jam)?|dicerminkan terhadap (garis tegak|garis datar|garis miring dari kiri bawah ke kanan atas|garis miring dari kiri atas ke kanan bawah)';

  /**
   * Urai kalimat menjadi langkah berurutan: { jenis: 'putar', derajat (searah positif) } atau
   * { jenis: 'cermin', arah }. `ketat`: seluruh kalimat harus habis terurai (hanya kata sambung
   * "lalu"/"kemudian" dan koma yang boleh tersisa).
   */
  function urai(teks, ketat) {
    var re = new RegExp(POLA, 'gi'), m, langkah = [], galat = null, sisa = String(teks || '');
    while ((m = re.exec(teks))) {
      if (m[1]) {
        var sd = parseInt(m[1], 10);
        if (!m[2] && sd % 360 !== 180) galat = 'arah putaran ' + sd + '° tidak disebut';
        if (sd <= 0 || sd >= 360) galat = 'sudut putar ' + sd + '° tidak wajar';
        langkah.push({ jenis: 'putar', derajat: m[2] && /berlawanan/i.test(m[2]) ? -sd : sd });
      } else langkah.push({ jenis: 'cermin', arah: SUMBU_TEKS[m[3].toLowerCase()] });
    }
    if (ketat) {
      sisa = sisa.replace(new RegExp(POLA, 'gi'), ' ').replace(/,|\blalu\b|\bkemudian\b/gi, ' ').trim();
      if (sisa) galat = 'ada bagian kalimat yang tidak terbaca: "' + sisa + '"';
    }
    return { langkah: langkah, galat: galat };
  }

  function terapkanLangkah(fig, langkah) {
    return langkah.reduce(function (f, l) { return l.jenis === 'putar' ? putarFig(f, l.derajat) : cerminFig(f, l.arah); }, fig);
  }

  function kunciLangkah(langkah) {
    return langkah.map(function (l) { return l.jenis === 'putar' ? 'p' + (((l.derajat % 360) + 360) % 360) : 'c' + Math.round(Math.atan2(l.arah[1], l.arah[0]) * 180 / Math.PI + 180) % 180; }).join('>');
  }

  // ------------------------------------------------------------ bantu

  function bentukKunci(fig) {
    return (fig && fig.unsur ? fig.unsur : []).map(function (u) {
      var t = u.jenis === 'bulat' ? [u.pusat] : u.titik;
      return u.jenis.charAt(0) + (u.isi ? 'i' : '') + (u.kepala || 0) + ':' + t.map(function (p) { return Math.round(p[0]) + ',' + Math.round(p[1]); }).join(';');
    }).sort();
  }

  /** Semua gambar opsi dan gambar soal memakai skala yang sama (ukuran tidak membocorkan jawaban). */
  function skalaSeragam(b, m, skala, H) {
    b.opsi.forEach(function (o, i) {
      if (o.gambar && o.gambar.model && Math.abs(o.gambar.model.skala - skala) > 1e-9) m.push('skala gambar opsi ' + H[i] + ' berbeda dari gambar soal');
    });
  }

  /** Arah garis dibulatkan ke kelipatan 45° bila menyimpang kurang dari 0,2°; selain itu null. */
  function arahTerbaca(g) {
    var d = Math.atan2(g.b[1] - g.a[1], g.b[0] - g.a[0]) * 180 / Math.PI, k = Math.round(d / 45);
    if (Math.abs(d - k * 45) > 0.2) return null;
    return [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]][((k % 8) + 8) % 8];
  }

  function dalamKotak(p, c, h, tepi) { return Math.abs(p[0] - c[0]) < h + tepi && Math.abs(p[1] - c[1]) < h + tepi; }

  // ------------------------------------------------------------ cermin

  function periksaCermin(b, m, alat) {
    var t = alat.bacaTampilan(b, m, 'tfm-cermin', 'tfm-figur', function (x) { return x.fig || null; });
    if (!t) return;
    var s = t.soal, kotak = s.kotak || [], sumbu = s.sumbu || [], h = s.sisi / 2;
    var asli = kotak.filter(function (k) { return k.peran === 'asli'; })[0], tanya = kotak.filter(function (k) { return k.peran === 'tanya'; })[0];
    if (!asli || !asli.fig || !asli.fig.unsur || !tanya) { m.push('gambar soal cermin harus memuat kotak bentuk asli dan kotak tanda tanya'); return; }
    if (!(h > 0) || !(s.skala > 0)) { m.push('ukuran kotak atau skala gambar soal cermin tidak terbaca'); return; }
    skalaSeragam(b, m, s.skala, alat.HURUF);
    var tq = b.pertanyaan || '', urut;
    if (sumbu.length === 1) {
      if (!/garis putus-putus/.test(tq)) m.push('pertanyaan tidak menyebut garis putus-putus sebagai garis cermin');
      urut = [sumbu[0]];
    } else if (sumbu.length === 2) {
      var no = (tq.match(/garis \d/g) || []).map(function (x) { return parseInt(x.slice(6), 10); });
      if (no.length !== 2 || no[0] === no[1]) { m.push('urutan kedua garis cermin tidak terbaca dari pertanyaan'); return; }
      urut = no.map(function (n) { return sumbu.filter(function (g) { return g.nomor === n; })[0]; });
      if (urut.some(function (g) { return !g; })) { m.push('nomor garis cermin pada pertanyaan tidak ada pada gambar'); return; }
    } else { m.push('banyak garis cermin harus satu atau dua'); return; }
    if (urut.some(function (g) { return !g.a || !g.b || Math.hypot(g.b[0] - g.a[0], g.b[1] - g.a[1]) < 20; })) { m.push('garis cermin tidak terbaca'); return; }
    // arah garis seperti yang terbaca mata: tegak, datar, atau miring 45° (titik ujung dibulatkan ke 0,01 px)
    var arahGaris = urut.map(arahTerbaca);
    if (arahGaris.some(function (d) { return !d; })) { m.push('garis cermin tidak tegak, datar, atau miring 45°'); return; }

    // letak: kotak "?" adalah bayangan kotak bentuk asli terhadap garis-garis itu, berurutan
    var pos = asli.pusat;
    urut.forEach(function (g) { pos = cerminTitik(pos, g.a, g.b); });
    if (Math.hypot(pos[0] - tanya.pusat[0], pos[1] - tanya.pusat[1]) > 1.5) m.push('kotak tanda tanya tidak terletak di bayangan kotak gambar asli');
    // bentuk asli di dalam kotaknya; garis cermin tidak menembus kotak mana pun
    if (cuplik(asli.fig, 2).some(function (p) { return !dalamKotak([asli.pusat[0] + p[0] * s.skala, asli.pusat[1] + p[1] * s.skala], asli.pusat, h, -1); })) m.push('bentuk asli keluar dari kotaknya');
    sumbu.forEach(function (g) {
      for (var k = 0; k <= 50; k++) {
        var p = [g.a[0] + (g.b[0] - g.a[0]) * k / 50, g.a[1] + (g.b[1] - g.a[1]) * k / 50];
        if (kotak.some(function (kt) { return dalamKotak(p, kt.pusat, h, 1); })) { m.push('garis cermin menembus kotak gambar'); return; }
      }
    });

    // bayangan yang benar, dihitung sendiri dari arah garis yang digambar
    var harap = asli.fig;
    arahGaris.forEach(function (d) { harap = cerminFig(harap, d); });
    if (sama(harap, asli.fig, alat.Fig)) m.push('bayangan sama dengan bentuk asli (bentuk simetris terhadap garis cermin)');
    var cocok = [];
    t.opsi.forEach(function (f, i) { if (f && f.unsur && sama(f, harap, alat.Fig)) cocok.push(i); });
    alat.tepatSatu(b, m, cocok, 'pencerminan terhadap garis yang digambar');
  }

  function sidikCermin(b) {
    try {
      var s = b.stimulus.gambar[0].model, asli = s.kotak.filter(function (k) { return k.peran === 'asli'; })[0];
      var arah = s.sumbu.map(function (g) { return (Math.round(Math.atan2(g.b[1] - g.a[1], g.b[0] - g.a[0]) * 180 / Math.PI) + 360) % 180; });
      return ['sumbu:' + arah.join('>')].concat(bentukKunci(asli.fig));
    } catch (e) { return ['?']; }
  }

  // ------------------------------------------------------------ putar

  var ARAH_IKON = { tegak: [0, 1], datar: [1, 0] };

  function periksaPutar(b, m, alat) {
    var t = alat.bacaTampilan(b, m, 'tfm-putar', 'tfm-figur', function (x) { return x.fig || null; });
    if (!t) return;
    var s = t.soal;
    if (!s.fig || !s.fig.unsur) { m.push('gambar soal putar tanpa bentuk'); return; }
    skalaSeragam(b, m, s.skala, alat.HURUF);
    var u = urai(b.pertanyaan || '', false);
    if (u.galat) { m.push('pertanyaan: ' + u.galat); return; }
    if (u.langkah.length < 1 || u.langkah.length > 2) { m.push('pertanyaan harus menyebut satu atau dua langkah transformasi (terbaca ' + u.langkah.length + ')'); return; }
    if (!u.langkah.some(function (l) { return l.jenis === 'putar'; })) m.push('soal rotasi tanpa langkah pemutaran');
    // ikon langkah yang digambar harus sama dengan teks
    var ikon = s.langkah || [];
    if (ikon.length !== u.langkah.length) m.push('banyak ikon langkah pada gambar (' + ikon.length + ') tidak sama dengan langkah di pertanyaan (' + u.langkah.length + ')');
    else {
      ikon.forEach(function (k, i) {
        var l = u.langkah[i];
        if (k.jenis !== l.jenis) { m.push('ikon langkah ' + (i + 1) + ' berbeda jenis dari teks pertanyaan'); return; }
        if (l.jenis === 'putar') {
          var dk = (k.arah === 'berlawanan' ? -1 : 1) * k.sudut;
          if ((((dk - l.derajat) % 360) + 360) % 360 !== 0) m.push('ikon putar langkah ' + (i + 1) + ' (' + dk + '°) tidak sama dengan teks pertanyaan (' + l.derajat + '°)');
        } else {
          var a = ARAH_IKON[k.sumbu];
          if (!a || Math.abs(a[0] * l.arah[1] - a[1] * l.arah[0]) > 1e-9) m.push('ikon cermin langkah ' + (i + 1) + ' tidak sama dengan garis cermin di pertanyaan');
        }
      });
    }
    var harap = terapkanLangkah(s.fig, u.langkah);
    if (sama(harap, s.fig, alat.Fig)) m.push('hasil transformasi sama dengan bentuk asli');
    var cocok = [];
    t.opsi.forEach(function (f, i) { if (f && f.unsur && sama(f, harap, alat.Fig)) cocok.push(i); });
    alat.tepatSatu(b, m, cocok, 'transformasi yang disebutkan di pertanyaan');
  }

  function sidikPutar(b) {
    try {
      var u = urai(b.pertanyaan || '', false);
      return ['langkah:' + kunciLangkah(u.langkah)].concat(bentukKunci(b.stimulus.gambar[0].model.fig));
    } catch (e) { return ['?']; }
  }

  // ------------------------------------------------------------ tebak

  function periksaTebak(b, m, alat) {
    if (!alat.periksaPilihan(b, m, 5)) return;
    var gd = (b.stimulus.gambar || [])[0];
    if (!gd || gd.jenis !== 'tfm-tebak' || !gd.model || !gd.model.kiri || !gd.model.kanan) { m.push('gambar soal berjenis tfm-tebak (gambar kiri dan kanan) tidak ada'); return; }
    if (b.model.kunciIndex !== b.kunci) m.push('indeks kunci pada model tidak sama dengan kunci butir');
    if (alat.sj(b.opsi.map(function (o) { return o.nilai; })) !== alat.sj(b.model.pilihan)) m.push('nilai opsi berbeda dari data model');
    if (b.opsi.some(function (o) { return o.gambar; })) m.push('opsi menebak transformasi harus berupa teks');
    var kiri = gd.model.kiri, kanan = gd.model.kanan;
    if (sama(kiri, kanan, alat.Fig)) { m.push('gambar kanan sama dengan gambar kiri'); return; }
    var hasil = b.opsi.map(function (o, i) {
      var u = urai(o.teks, true);
      if (u.galat || !u.langkah.length || u.langkah.length > 2) { m.push('opsi ' + alat.HURUF[i] + ' tidak terbaca sebagai transformasi' + (u.galat ? ' (' + u.galat + ')' : '')); return null; }
      return terapkanLangkah(kiri, u.langkah);
    });
    var cocok = [];
    hasil.forEach(function (f, i) { if (f && sama(f, kanan, alat.Fig)) cocok.push(i); });
    alat.tepatSatu(b, m, cocok, 'transformasi dari gambar kiri ke gambar kanan');
    // opsi yang setara satu sama lain bisa dicoret tanpa melihat gambar
    for (var i = 0; i < hasil.length; i++) {
      for (var j = i + 1; j < hasil.length; j++) {
        if (hasil[i] && hasil[j] && sama(hasil[i], hasil[j], alat.Fig)) m.push('opsi ' + alat.HURUF[i] + ' dan ' + alat.HURUF[j] + ' setara (menghasilkan gambar yang sama)');
      }
    }
  }

  function sidikTebak(b) {
    try {
      var k = urai(b.opsi[b.kunci].teks, true);
      return ['kunci:' + kunciLangkah(k.langkah)].concat(bentukKunci(b.stimulus.gambar[0].model.kiri));
    } catch (e) { return ['?']; }
  }

  return {
    TIPE: {
      'transformasi-cermin': { periksa: periksaCermin, sidik: sidikCermin, batas: 1 },
      'transformasi-putar': { periksa: periksaPutar, sidik: sidikPutar, batas: 1 },
      'transformasi-tebak': { periksa: periksaTebak, sidik: sidikTebak, batas: 1 }
    },
    // dipakai uji internal
    urai: urai, terapkanLangkah: terapkanLangkah
  };
});
