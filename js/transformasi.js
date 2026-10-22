/*
 * transformasi.js — Kemampuan Umum > Figural > Macam-macam Transformasi Figural:
 * pencerminan, rotasi, dan menebak transformasi (keluarga pengayaan dari Kerangka Course).
 *
 * Bentuk figuralnya dibangkitkan `families.js` (delapan keluarga bentuk: bingkai bersarang,
 * bangun datar + penanda, kisi titik, panah, zigzag, sisir, blok, lingkaran bertali) lalu
 * disaring ulang di sini: tidak simetri putar, KIRAL terhadap cermin SEJATI (titik dipetakan
 * tanpa membalik urutan, jadi mata panah tetap di ujung yang sama), dan bayangan cerminnya
 * berbeda jelas. Kait (kepala 2) diubah menjadi ruas biasa supaya ikut tercermin dengan benar.
 *
 * Setiap transformasi dinyatakan sebagai unsur grup D8 { r, t }: titik p dipetakan ke
 * R(t) · M^r · p, dengan R(t) putaran t derajat SEARAH jarum jam (koordinat layar, y ke bawah)
 * dan M cermin terhadap garis tegak. Cermin terhadap garis datar = { 1, 180 }, garis miring
 * kiri-bawah ke kanan-atas = { 1, 90 }, garis miring kiri-atas ke kanan-bawah = { 1, 270 }.
 * Dua langkah digabung dengan `gabung`, jadi kesetaraan (putar 180° = cermin tegak lalu cermin
 * datar, cermin diagonal = putar 90° lalu cermin tegak, dst.) terhitung pasti.
 *
 *   transformasi-cermin (kolam serial) — bentuk + garis sumbu putus-putus, cari bayangannya.
 *     mudah  sumbu tegak atau datar
 *     sedang sumbu diagonal (naik/turun), atau sumbu tegak/datar pada bentuk berunsur banyak
 *     sulit  dua pencerminan berurutan (garis 1 lalu garis 2; saling tegak lurus atau
 *            membentuk 45°), atau sumbu diagonal pada bentuk berunsur banyak
 *   transformasi-putar (kolam serial) — bentuk + busur panah arah putar, sudut di pertanyaan.
 *     mudah  90° searah jarum jam atau 180°
 *     sedang 90° berlawanan arah, 270°, atau 45°/135°
 *     sulit  dua langkah: putar lalu cermin, cermin lalu putar, atau dua putaran berlawanan arah
 *   transformasi-tebak (kolam matriks) — gambar awal -> gambar akhir, opsi berupa TEKS.
 *     mudah  satu transformasi dasar (putar 90°/180°, cermin tegak/datar)
 *     sedang cermin diagonal, putar 270°, atau putar 45°/135°
 *     sulit  gabungan dua langkah (termasuk dua pencerminan yang setara dengan putaran)
 *
 * Pengecoh diambil dari jalur kesalahan (arah putar terbalik, sudut salah, sumbu lain, hasil
 * putar alih-alih cermin, gambar tidak berubah, satu unsur tidak ikut tercermin, unsur
 * berpindah relatif, langkah kedua terlupa, urutan tertukar). Tiap pengecoh dibuang bila sama
 * persis dengan kunci atau terlalu mirip di mata (jarak chamfer dan Hausdorff tanpa memutar).
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./rng.js'), require('./svg.js'), require('./butir.js'), require('./format.js'), require('./metrik.js'),
      require('./figure.js'), require('./families.js'));
    module.exports = api;
  } else {
    api = factory(root.Rng, root.Svg, root.Butir, root.Fmt, root.Metrik, root.Figure, root.Families);
    root.Transformasi = api;
  }
})(typeof self !== 'undefined' ? self : this, function (Rng, S, Butir, Fmt, Metrik, F, Fam) {
  'use strict';

  var TINTA = '#1d1d1d', TEPI = '#4a5266', LATAR_TANYA = '#f4f6fb', BINGKAI = '#c9d0de', BH = S.BAHAS;
  var HANTU = '#c3c9d4', REDUP = '#b3bac7', WARNA_PASANG = [BH.sorot, BH.panah, '#8e44ad'];
  var SISI = 130;                       // sisi kotak gambar soal dan opsi (px)
  var KELUARGA_BENTUK = ['sarang', 'datar', 'kisi', 'panah', 'zigzag', 'sisir', 'blok', 'silang'];

  var PERINTAH_CERMIN = 'Perhatikan gambar berikut. Garis putus-putus adalah garis (sumbu) cermin. Pilihlah gambar yang merupakan hasil pencerminannya.';
  var PERINTAH_PUTAR = 'Perhatikan gambar berikut. Gambar diputar terhadap titik pusatnya menurut arah dan besar sudut yang disebutkan. Pilihlah gambar hasilnya.';
  var PERINTAH_TEBAK = 'Perhatikan gambar berikut. Gambar kiri diubah menjadi gambar kanan dengan satu atau dua transformasi (pemutaran terhadap titik pusat gambar dan/atau pencerminan).';

  // ------------------------------------------------------------ transformasi

  /** Sumbu cermin: arah garis (layar, y ke bawah), sudut unsur D8-nya, nama dalam kalimat. */
  var SUMBU = {
    tegak: { arah: [0, 1], t: 0, nama: 'garis tegak' },
    datar: { arah: [1, 0], t: 180, nama: 'garis datar' },
    naik: { arah: [1, -1], t: 90, nama: 'garis miring dari kiri bawah ke kanan atas' },
    turun: { arah: [1, 1], t: 270, nama: 'garis miring dari kiri atas ke kanan bawah' }
  };
  var SIKU = { tegak: 'datar', datar: 'tegak', naik: 'turun', turun: 'naik' };

  function norm(t) { t = Math.round(t) % 360; return t < 0 ? t + 360 : t; }
  function putar(sudut, arah) { return { jenis: 'putar', sudut: sudut, arah: arah || 'searah' }; }
  function cermin(sumbu) { return { jenis: 'cermin', sumbu: sumbu }; }

  function elLangkah(l) {
    if (l.jenis === 'cermin') return { r: 1, t: SUMBU[l.sumbu].t };
    return { r: 0, t: norm(l.arah === 'berlawanan' ? -l.sudut : l.sudut) };
  }
  /** e1 lalu e2: R(t2) M^r2 R(t1) M^r1 = R(t2 +/- t1) M^(r1+r2), karena M R(t) = R(-t) M. */
  function gabung(e1, e2) { return { r: (e1.r + e2.r) % 2, t: norm(e2.t + (e2.r ? -e1.t : e1.t)) }; }
  function elUrutan(ls) { return ls.reduce(function (e, l) { return gabung(e, elLangkah(l)); }, { r: 0, t: 0 }); }
  function kunciEl(e) { return e.r + ':' + e.t; }

  function cosSin(t) {
    if (t % 90 === 0) return [[1, 0], [0, 1], [-1, 0], [0, -1]][(t / 90) % 4];
    var a = t * Math.PI / 180;
    return [Math.cos(a), Math.sin(a)];
  }
  function petaEl(e) {
    var cs = cosSin(e.t), c = cs[0], s = cs[1];
    return e.r ? function (p) { return [-c * p[0] - s * p[1], -s * p[0] + c * p[1]]; } : function (p) { return [c * p[0] - s * p[1], s * p[0] + c * p[1]]; };
  }
  /** Bentuk hasil transformasi, dipusatkan lagi (urutan titik tidak dibalik). */
  function terapkan(fig, e) { return F.pusatkan(F.petakan(fig, petaEl(e))); }
  function terapkanUrutan(fig, ls) { return terapkan(fig, elUrutan(ls)); }

  function kapital(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function teksSudut(l) { return l.sudut === 180 ? '180°' : l.sudut + '° ' + (l.arah === 'berlawanan' ? 'berlawanan arah' : 'searah') + ' jarum jam'; }
  function teksLangkah(l) { return l.jenis === 'cermin' ? 'dicerminkan terhadap ' + SUMBU[l.sumbu].nama : 'diputar ' + teksSudut(l); }
  function teksUrutan(ls) { return kapital(ls.map(teksLangkah).join(', lalu ')); }

  /** Kalimat sebuah unsur D8 dengan satu langkah paling sederhana. */
  function uraiEl(e) {
    if (e.r) {
      var nm = Object.keys(SUMBU).filter(function (k) { return SUMBU[k].t === e.t; })[0];
      return nm ? 'pencerminan terhadap ' + SUMBU[nm].nama : 'pencerminan terhadap garis miring';
    }
    if (e.t === 0) return 'gambar yang tidak berubah';
    if (e.t === 180) return 'putaran 180°';
    return e.t < 180 ? 'putaran ' + e.t + '° searah jarum jam' : 'putaran ' + (360 - e.t) + '° berlawanan arah jarum jam';
  }

  // ------------------------------------------------------------ bentuk dasar

  /** Kait (kepala 2) menjadi ruas biasa supaya ikut tercermin dengan benar. */
  function tanpaKait(fig) {
    var h = F.salin(fig);
    h.unsur.forEach(function (u) {
      if (u.jenis !== 'garis' || u.kepala !== 2 || u.titik.length < 2) return;
      var t = u.titik, p = t[t.length - 2], q = t[t.length - 1];
      var dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, k = Fam.R * 0.2;
      t.push([q[0] + (-uy - ux * 0.35) * k, q[1] + (ux - uy * 0.35) * k]);
      u.kepala = 0;
    });
    return F.pusatkan(h);
  }

  function cerminTegak(fig) { return F.petakan(fig, function (p) { return [-p[0], p[1]]; }); }

  /** Tidak simetri putar, kiral terhadap cermin sejati, dan cerminnya berbeda jelas. */
  function bentukSah(fig) {
    if (F.ordeSimetri(fig) !== 1) return false;
    var c = cerminTegak(fig);
    if (F.adalahRotasi(c, fig)) return false;
    return F.bedaBentuk(c, fig) >= 0.05;
  }

  function bentukDasar(a, min, maks, level) {
    // bingkai bersarang terlalu ramai untuk tingkat mudah
    var boleh = level === 'mudah' ? KELUARGA_BENTUK.filter(function (k) { return k !== 'sarang'; }) : KELUARGA_BENTUK;
    for (var c = 0; c < 24; c++) {
      var kel = a.pilih(boleh), benih = a.bulat(1, 2147480000);
      var f = Fam.bangkitkan(kel, benih);
      if (!(f.coba <= Fam.COBA_MAKS)) continue;
      if (f.unsur.length < min || f.unsur.length > maks || (kel === 'sarang' && f.unsur.length > 4)) continue;
      f = tanpaKait(f);
      if (bentukSah(f)) return f;
    }
    return null;
  }

  // ------------------------------------------------------ pembanding tampak

  /** Beda dua bentuk terpusat TANPA diputar: rerata dan maksimum jarak terdekat, per jangkauan. */
  function bedaTampak(A, B) {
    var a = F.sampelBatas(A, 70), b = F.sampelBatas(B, 70);
    function arah(p, q) {
      var jml = 0, maks = 0;
      for (var i = 0; i < p.length; i++) {
        var mn = Infinity;
        for (var j = 0; j < q.length; j++) {
          var dx = p[i][0] - q[j][0], dy = p[i][1] - q[j][1], d = dx * dx + dy * dy;
          if (d < mn) mn = d;
        }
        mn = Math.sqrt(mn);
        jml += mn;
        if (mn > maks) maks = mn;
      }
      return [jml / p.length, maks];
    }
    var x = arah(a, b), y = arah(b, a), uk = Math.max(F.jangkauan(A), F.jangkauan(B), 1e-6);
    return { rata: (x[0] + y[0]) / 2 / uk, maks: Math.max(x[1], y[1]) / uk };
  }

  /** Ambang beda tampak per tingkat: makin mudah, makin jelas beda antaropsi. */
  var AMBANG_TAMPAK = { mudah: [0.06, 0.2, 0.32], sedang: [0.05, 0.16, 0.3], sulit: [0.04, 0.14, 0.28] };

  function cukupBeda(A, B, level) {
    var d = bedaTampak(A, B), t = AMBANG_TAMPAK[level] || AMBANG_TAMPAK.sedang;
    return (d.rata >= t[0] && d.maks >= t[1]) || d.maks >= t[2];
  }

  /** Bentuk pengecoh harus tetap terbaca: tidak ada dua unsur yang berhimpit. */
  function layak(fig) {
    var jang = F.jangkauan(fig);
    for (var i = 0; i < fig.unsur.length; i++) {
      for (var j = i + 1; j < fig.unsur.length; j++) {
        if (F.bedaUnsur(fig.unsur[i], fig.unsur[j]) < Fam.AMBANG.rapat * jang * 0.8) return false;
      }
    }
    return true;
  }

  function namaUnsur(fig, idx) {
    var u = fig.unsur[idx];
    if (!u) return 'salah satu unsur';
    if (u.nama) {
      var sama = fig.unsur.filter(function (v) { return v.nama === u.nama; });
      if (sama.length > 1) {
        var ke = 0;
        for (var i = 0; i <= idx; i++) if (fig.unsur[i].nama === u.nama) ke++;
        return u.nama + ' ke-' + ke;
      }
      return u.nama;
    }
    return u.jenis === 'bulat' ? 'titik' : 'garis';
  }

  function pindahKata(a, b) { return a === b ? 'tetap berada di bagian ' + a : 'berpindah dari bagian ' + a + ' ke bagian ' + b; }

  var ARAH8 = ['kanan', 'kanan bawah', 'bawah', 'kiri bawah', 'kiri', 'kiri atas', 'atas', 'kanan atas'];
  function sudutLetak(c) { var d = Math.atan2(c[1], c[0]) * 180 / Math.PI; return d < 0 ? d + 360 : d; }
  function arahLetak(c) { return ARAH8[Math.round(sudutLetak(c) / 45) % 8]; }
  /** Jarak sudut letak ke batas sektor terdekat (sektor 45°, berpusat di kelipatan 45°). */
  function tegasLetak(c) { return Math.abs(sudutLetak(c) % 45 - 22.5); }

  /** Indeks simpul unsur i yang terjauh dari pusat gambar (-1 untuk lingkaran: pusatnya). */
  function indeksTitik(fig, i) {
    var u = fig.unsur[i];
    if (u.jenis === 'bulat') return -1;
    var idx = 0, d = -1;
    u.titik.forEach(function (p, k) { var e = Math.hypot(p[0], p[1]); if (e > d + 1e-6) { d = e; idx = k; } });
    return idx;
  }
  /** Titik acuan { u: unsur, t: simpul } pada sebuah bentuk (urutan unsur dan simpul tetap setelah transformasi). */
  function titikDari(fig, ac) { var u = fig.unsur[ac.u]; return ac.t < 0 ? u.pusat : u.titik[ac.t]; }

  /**
   * Unsur pembanding untuk pembahasan dan titik acuannya (simpul terjauh dari pusat): diutamakan unsur
   * garis yang panjang, titik yang jauh dari pusat, letak yang terbaca tegas (jauh dari batas delapan
   * arah) pada setiap tahap `daftarE`, dan letak akhir yang berbeda dari letak awal.
   */
  function pilihAcuan(asli, daftarE) {
    var jang = F.jangkauan(asli), terbaik = null, nilai = -Infinity;
    asli.unsur.forEach(function (u, i) {
      var ac = { u: i, t: indeksTitik(asli, i) }, p = titikDari(asli, ac), r = Math.hypot(p[0], p[1]) / jang;
      var pos = [p].concat(daftarE.map(function (e) { return petaEl(e)(p); }));
      var v = r * 2 + (u.jenis === 'garis' ? 1 : 0) + (F.panjangUnsur(u) >= jang * 0.6 ? 0.4 : 0) +
        (arahLetak(pos[0]) !== arahLetak(pos[pos.length - 1]) ? 0.8 : 0) + Math.min.apply(null, pos.map(tegasLetak)) / 12;
      if (r < 0.35) v -= 3;
      if (v > nilai) { nilai = v; terbaik = ac; }
    });
    return terbaik;
  }

  function letakAcuan(fig, ac) { return arahLetak(titikDari(fig, ac)); }

  /**
   * Titik-titik khas bentuk (simpul garis dan pusat lingkaran) untuk pasangan titik pencerminan:
   * yang pertama terjauh dari pusat, berikutnya sejauh mungkin dari yang sudah terpilih bila diukur
   * SEPANJANG garis cermin (arah d), supaya garis-garis penghubungnya tidak saling menimpa.
   */
  function pilihTitik(fig, n, d) {
    var calon = [];
    fig.unsur.forEach(function (u) {
      if (u.jenis === 'bulat') calon.push(u.pusat);
      else u.titik.forEach(function (t) { calon.push(t); });
    });
    var hasil = [];
    while (hasil.length < n && calon.length) {
      var terbaik = -1, nilai = -Infinity;
      calon.forEach(function (p, i) {
        var v = hasil.length ? Math.min.apply(null, hasil.map(function (q) { return Math.abs((p[0] - q[0]) * d[0] + (p[1] - q[1]) * d[1]); })) : Math.hypot(p[0], p[1]);
        if (v > nilai + 1e-9) { nilai = v; terbaik = i; }
      });
      hasil.push(calon[terbaik]);
      calon.splice(terbaik, 1);
    }
    return hasil;
  }

  // -------------------------------------------------------------- pengecoh

  /** Semua unsur ditransformasi, kecuali satu yang hanya dipindah ke letak bayangannya. */
  function satuUnsurTetap(asli, e, idx) {
    var h = F.petakan(asli, petaEl(e)), c0 = F.pusatUnsur(asli.unsur[idx]), c1 = F.pusatUnsur(h.unsur[idx]);
    var u = F.salinUnsur(asli.unsur[idx]), dx = c1[0] - c0[0], dy = c1[1] - c0[1];
    if (u.jenis === 'bulat') u.pusat = [u.pusat[0] + dx, u.pusat[1] + dy];
    else u.titik = u.titik.map(function (p) { return [p[0] + dx, p[1] + dy]; });
    h.unsur[idx] = u;
    return F.pusatkan(h);
  }

  /** Calon "satu unsur tidak ikut ditransformasi" (beberapa unsur garis berbeda). */
  function calonSatuUnsur(a, asli, e, buatAlasan) {
    var idx = [];
    asli.unsur.forEach(function (u, i) { if (u.jenis === 'garis') idx.push(i); });
    return a.kocok(idx).slice(0, 3).map(function (i) { return { jenis: 'satuUnsur', fig: satuUnsurTetap(asli, e, i), alasan: buatAlasan(namaUnsur(asli, i)) }; });
  }

  /** Calon "satu unsur berpindah relatif" (diputar sendiri terhadap pusat gambar). */
  function calonUnsurPindah(a, kunci, buatAlasan) {
    var jang = F.jangkauan(kunci), idx = [];
    kunci.unsur.forEach(function (u, i) { var c = F.pusatUnsur(u); if (Math.hypot(c[0], c[1]) > jang * 0.28) idx.push(i); });
    return a.kocok(idx).slice(0, 2).map(function (i) {
      return { jenis: 'unsurPindah', fig: F.pusatkan(F.putarUnsur(kunci, i, a.pilih([60, 90, 120]) * a.tanda())), alasan: buatAlasan(namaUnsur(kunci, i)) };
    });
  }

  /**
   * Pilih `butuh` pengecoh: jenis dalam urutan prioritas (empat pertama diacak), satu calon per
   * jenis dulu, lalu calon sisanya. Calon dibuang bila sama dengan kunci, terlalu mirip kunci atau
   * pengecoh lain, atau unsurnya berhimpit.
   */
  function pilihPengecoh(a, kunci, kelompok, urut, butuh, level) {
    urut = a.kocok(urut.slice(0, 4)).concat(urut.slice(4));
    var antre = [], hasil = [];
    Object.keys(kelompok).forEach(function (j) { kelompok[j] = a.kocok(kelompok[j] || []); });
    urut.forEach(function (j) { if (kelompok[j] && kelompok[j][0]) antre.push(kelompok[j][0]); });
    urut.forEach(function (j) { (kelompok[j] || []).slice(1).forEach(function (c) { antre.push(c); }); });
    for (var i = 0; i < antre.length && hasil.length < butuh; i++) {
      var c = antre[i];
      if (!c || !c.fig || F.samaPersis(c.fig, kunci) || !cukupBeda(c.fig, kunci, level) || !layak(c.fig)) continue;
      if (hasil.some(function (h) { return F.samaPersis(h.fig, c.fig) || !cukupBeda(h.fig, c.fig, level); })) continue;
      hasil.push(c);
    }
    return hasil.length === butuh ? hasil : null;
  }

  function pilihMekanisme(a, id, daftar, dipakai) {
    var baru = daftar.filter(function (m) { return (dipakai || []).indexOf(id + ':' + m) < 0; });
    return a.pilih(baru.length ? baru : daftar);
  }

  /** Skala bersama (px per satuan pada kotak SISI): bentuk terbesar menentukan. */
  function skalaBersama(figs) {
    var maks = 0;
    figs.forEach(function (f) { if (f) maks = Math.max(maks, F.jangkauan(f)); });
    return Math.round(SISI * 0.4 / (maks || 1) * 10000) / 10000;
  }

  function kunciBentuk(fig) {
    return fig.unsur.map(function (u) {
      var t = u.jenis === 'bulat' ? [u.pusat] : u.titik;
      return u.jenis.charAt(0) + (u.isi ? 'i' : '') + (u.kepala || 0) + ':' + t.map(function (p) { return Math.round(p[0]) + ',' + Math.round(p[1]); }).join(';');
    }).sort();
  }

  function daftarOpsiGambar(daftar, skala) {
    return daftar.map(function (d, i) {
      return { teks: 'Gambar opsi ' + Fmt.huruf(i), nilai: i, alasan: d.alasan || null, kunci: !!d.kunci,
        gambar: { id: 'opsi-' + Fmt.huruf(i).toLowerCase(), jenis: 'tfm-figur', model: { fig: d.fig, skala: skala }, judul: 'Opsi ' + Fmt.huruf(i) } };
    });
  }

  // ======================================================= keluarga 1: cermin

  var MEK_CERMIN = {
    mudah: ['tegak', 'datar'],
    sedang: ['diagonal-naik', 'diagonal-turun', 'tegak-rumit', 'datar-rumit'],
    sulit: ['dua-siku', 'dua-miring', 'diagonal-rumit']
  };

  var ATURAN_SUMBU = {
    tegak: 'bagian kiri dan kanan bertukar tempat, sedangkan bagian atas tetap di atas dan bagian bawah tetap di bawah',
    datar: 'bagian atas dan bawah bertukar tempat, sedangkan bagian kiri tetap di kiri dan bagian kanan tetap di kanan',
    naik: 'bagian atas berpindah ke kanan dan bagian kanan ke atas, bagian bawah berpindah ke kiri dan bagian kiri ke bawah, sedangkan bagian yang searah garis tetap di tempatnya',
    turun: 'bagian atas berpindah ke kiri dan bagian kiri ke atas, bagian bawah berpindah ke kanan dan bagian kanan ke bawah, sedangkan bagian yang searah garis tetap di tempatnya'
  };
  var BALIK_SUMBU = { tegak: 'terbalik kiri-kanan', datar: 'terbalik atas-bawah', naik: 'terbalik terhadap garis miring naik', turun: 'terbalik terhadap garis miring turun' };

  function satuan(v) { var L = Math.hypot(v[0], v[1]); return [v[0] / L, v[1] / L]; }

  /**
   * Tata letak gambar cermin: kotak bentuk asli di P0, tiap garis sumbu di antara kotak
   * sebelum dan sesudahnya (jarak sama), kotak hasil di seberangnya. `tanda` memilih sisi.
   */
  function tataCermin(sumbu, tanda, h, g, lebih) {
    var P = [[0, 0]], garis = [];
    sumbu.forEach(function (nm, k) {
      var d = satuan(SUMBU[nm].arah), n = [-d[1] * tanda[k], d[0] * tanda[k]];
      var D = h * (Math.abs(n[0]) + Math.abs(n[1])) + g, prev = P[P.length - 1];
      var kaki = [prev[0] + n[0] * D, prev[1] + n[1] * D], L = h * (Math.abs(d[0]) + Math.abs(d[1])) + (lebih == null ? 16 : lebih);
      garis.push({ a: [kaki[0] - d[0] * L, kaki[1] - d[1] * L], b: [kaki[0] + d[0] * L, kaki[1] + d[1] * L], d: d });
      P.push([prev[0] + 2 * n[0] * D, prev[1] + 2 * n[1] * D]);
    });
    return { P: P, garis: garis };
  }

  function dalamKotak(p, c, h, tepi) { return Math.abs(p[0] - c[0]) < h + tepi && Math.abs(p[1] - c[1]) < h + tepi; }

  function potongRuas(p1, p2, p3, p4) {
    var d = (p2[0] - p1[0]) * (p4[1] - p3[1]) - (p2[1] - p1[1]) * (p4[0] - p3[0]);
    if (Math.abs(d) < 1e-9) return false;
    var u = ((p3[0] - p1[0]) * (p4[1] - p3[1]) - (p3[1] - p1[1]) * (p4[0] - p3[0])) / d;
    var v = ((p3[0] - p1[0]) * (p2[1] - p1[1]) - (p3[1] - p1[1]) * (p2[0] - p1[0])) / d;
    return u >= 0 && u <= 1 && v >= 0 && v <= 1;
  }

  /** Tata letak sah: kotak tidak bertumpuk, garis tidak menembus kotak dan tidak saling silang. */
  function tataSah(t, h) {
    var i, j, k;
    for (i = 0; i < t.P.length; i++) for (j = i + 1; j < t.P.length; j++) {
      if (Math.abs(t.P[i][0] - t.P[j][0]) < 2 * h + 10 && Math.abs(t.P[i][1] - t.P[j][1]) < 2 * h + 10) return false;
    }
    for (k = 0; k < t.garis.length; k++) {
      var g = t.garis[k];
      for (var s = 0; s <= 40; s++) {
        var p = [g.a[0] + (g.b[0] - g.a[0]) * s / 40, g.a[1] + (g.b[1] - g.a[1]) * s / 40];
        for (i = 0; i < t.P.length; i++) if (dalamKotak(p, t.P[i], h, 5)) return false;
      }
    }
    for (k = 0; k + 1 < t.garis.length; k++) {
      var g1 = t.garis[k], g2 = t.garis[k + 1];
      if (potongRuas(g1.a, g1.b, g2.a, g2.b)) return false;
      // kedua garis tidak boleh hampir bersentuhan (terbaca satu garis patah)
      for (var u = 0; u <= 30; u++) for (var v = 0; v <= 30; v++) {
        if (Math.hypot(g1.a[0] + (g1.b[0] - g1.a[0]) * u / 30 - g2.a[0] - (g2.b[0] - g2.a[0]) * v / 30, g1.a[1] + (g1.b[1] - g1.a[1]) * u / 30 - g2.a[1] - (g2.b[1] - g2.a[1]) * v / 30) < 24) return false;
      }
    }
    return true;
  }

  /** Model gambar soal cermin (koordinat kanvas). */
  function modelTata(t, h, sumbu, skala, fig) {
    var dua = sumbu.length === 2, label = [], x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    function muat(p, r) { x0 = Math.min(x0, p[0] - r); y0 = Math.min(y0, p[1] - r); x1 = Math.max(x1, p[0] + r); y1 = Math.max(y1, p[1] + r); }
    t.P.forEach(function (p) { muat(p, h); });
    t.garis.forEach(function (g, k) {
      muat(g.a, 2); muat(g.b, 2);
      if (!dua) return;
      // nomor garis di ujung yang lebih jauh dari garis lainnya dan dari semua kotak
      var c1 = [g.b[0] + g.d[0] * 14, g.b[1] + g.d[1] * 14], c2 = [g.a[0] - g.d[0] * 14, g.a[1] - g.d[1] * 14];
      var lain = t.garis[1 - k], tengahLain = [(lain.a[0] + lain.b[0]) / 2, (lain.a[1] + lain.b[1]) / 2];
      var jauh = function (c) { return Math.min(Math.hypot(c[0] - tengahLain[0], c[1] - tengahLain[1]) - 40, Math.min.apply(null, t.P.map(function (p) { return Math.max(Math.abs(c[0] - p[0]), Math.abs(c[1] - p[1])) - h; }))); };
      var c = jauh(c1) >= jauh(c2) ? c1 : c2;
      label.push(c);
      muat(c, 12);
    });
    var pad = 10, dx = pad - x0, dy = pad - y0, geser = function (p) { return [Math.round((p[0] + dx) * 100) / 100, Math.round((p[1] + dy) * 100) / 100]; };
    var kotak = [{ pusat: geser(t.P[0]), peran: 'asli', fig: fig }];
    if (dua) kotak.push({ pusat: geser(t.P[1]), peran: 'antara' });
    kotak.push({ pusat: geser(t.P[t.P.length - 1]), peran: 'tanya' });
    return {
      W: Math.ceil(x1 - x0 + 2 * pad), H: Math.ceil(y1 - y0 + 2 * pad), sisi: 2 * h, skala: skala, kotak: kotak,
      sumbu: t.garis.map(function (g, k) { return { a: geser(g.a), b: geser(g.b), nomor: dua ? k + 1 : null, label: dua ? geser(label[k]) : null }; })
    };
  }

  function cariTata(a, sumbu, h, g) {
    var pilihan = sumbu.length === 1 ? [[1], [-1]] : [[1, 1], [1, -1], [-1, 1], [-1, -1]];
    pilihan = a.kocok(pilihan);
    for (var i = 0; i < pilihan.length; i++) {
      var t = tataCermin(sumbu, pilihan[i], h, g, sumbu.length === 2 ? 4 : 16);
      if (!tataSah(t, h)) continue;
      return t;
    }
    return null;
  }

  /** Bayangan titik kanvas p terhadap garis (a, b). */
  function cerminTitik(p, a, b) {
    var d = satuan([b[0] - a[0], b[1] - a[1]]), vx = p[0] - a[0], vy = p[1] - a[1], k = vx * d[0] + vy * d[1];
    return [a[0] + 2 * k * d[0] - vx, a[1] + 2 * k * d[1] - vy];
  }

  function buatCermin(id, level, benih, opsi) {
    var a = Rng.alat(benih);
    var target = opsi.target == null ? a.bulat(0, 4) : opsi.target;
    var mek = pilihMekanisme(a, id, MEK_CERMIN[level] || MEK_CERMIN.sedang, opsi.polaDipakai);
    for (var coba = 0; coba < 30; coba++) {
      var sumbu, min = 3, maks = 5;
      if (mek === 'tegak' || mek === 'datar') { sumbu = [mek]; min = 2; maks = 4; }
      else if (mek === 'diagonal-naik') { sumbu = ['naik']; min = 2; maks = 5; }
      else if (mek === 'diagonal-turun') { sumbu = ['turun']; min = 2; maks = 5; }
      else if (mek === 'tegak-rumit' || mek === 'datar-rumit') { sumbu = [mek.split('-')[0]]; min = 4; maks = 7; }
      else if (mek === 'diagonal-rumit') { sumbu = [a.pilih(['naik', 'turun'])]; min = 5; maks = 8; }
      else if (mek === 'dua-siku') { sumbu = a.pilih([['tegak', 'datar'], ['datar', 'tegak'], ['naik', 'turun'], ['turun', 'naik']]); min = 3; maks = 6; }
      else { sumbu = a.kocok([a.pilih(['tegak', 'datar']), a.pilih(['naik', 'turun'])]); min = 3; maks = 6; }
      var asli = bentukDasar(a, min, maks, level);
      if (!asli) continue;
      var langkah = sumbu.map(cermin), eBenar = elUrutan(langkah), kunci = terapkan(asli, eBenar);
      if (!cukupBeda(kunci, asli, level)) continue;

      // ---- calon pengecoh menurut jalur kesalahan
      var K = {}, dua = sumbu.length === 2;
      var tambah = function (jenis, e, alasan) { (K[jenis] = K[jenis] || []).push({ jenis: jenis, fig: terapkan(asli, e), alasan: alasan }); };
      tambah('asli', { r: 0, t: 0 }, 'Gambar ini sama dengan gambar asli: bentuknya hanya dipindah ke seberang garis tanpa dibalik, padahal pencerminan membalik gambar terhadap garis cerminnya.');
      tambah('putar180', { r: 0, t: 180 }, 'Gambar ini hasil memutar gambar asli 180°, bukan mencerminkannya; susunan unsurnya tidak terbalik seperti bayangan cermin.');
      tambah('putar90', { r: 0, t: 90 }, 'Gambar ini hasil memutar gambar asli 90° searah jarum jam, bukan mencerminkannya.');
      tambah('putar90', { r: 0, t: 270 }, 'Gambar ini hasil memutar gambar asli 90° berlawanan arah jarum jam, bukan mencerminkannya.');
      if (!dua) {
        Object.keys(SUMBU).forEach(function (s) {
          if (s === sumbu[0]) return;
          tambah(SIKU[sumbu[0]] === s ? 'sumbuSiku' : 'sumbuMiring', { r: 1, t: SUMBU[s].t }, 'Gambar ini bayangan terhadap ' + SUMBU[s].nama + ', padahal garis cerminnya ' + SUMBU[sumbu[0]].nama + '.');
        });
      } else {
        tambah('pertama', elLangkah(langkah[0]), 'Gambar ini baru hasil pencerminan terhadap garis 1; pencerminan kedua terhadap garis 2 belum dilakukan.');
        tambah('kedua', elLangkah(langkah[1]), 'Gambar ini hanya dicerminkan terhadap garis 2; pencerminan pertama terhadap garis 1 terlewat.');
        tambah('tertukar', elUrutan([langkah[1], langkah[0]]), 'Urutan pencerminannya tertukar (garis 2 lebih dahulu, baru garis 1); karena kedua garis tidak saling tegak lurus, urutan yang tertukar memberi hasil yang berbeda.');
        Object.keys(SUMBU).forEach(function (s) {
          if (sumbu.indexOf(s) >= 0) return;
          tambah('sumbuMiring', { r: 1, t: SUMBU[s].t }, 'Gambar ini hanya bayangan terhadap ' + SUMBU[s].nama + ' sekali, bukan hasil dua pencerminan terhadap garis 1 lalu garis 2.');
        });
      }
      K.satuUnsur = calonSatuUnsur(a, asli, eBenar, function (nm) { return 'Unsur ' + nm + ' hanya dipindah ke letak bayangannya tanpa ikut dibalik, padahal setiap unsur gambar harus ikut tercermin.'; });
      K.unsurPindah = calonUnsurPindah(a, kunci, function (nm) { return 'Letak ' + nm + ' terhadap unsur lain bergeser; pada pencerminan kedudukan setiap unsur terhadap unsur lain tetap terjaga, hanya terbalik.'; });
      var urut = {
        tegak: ['sumbuSiku', 'asli', 'putar180', 'putar90', 'satuUnsur', 'unsurPindah', 'sumbuMiring'],
        'tegak-rumit': ['satuUnsur', 'sumbuSiku', 'putar180', 'asli', 'unsurPindah', 'putar90', 'sumbuMiring'],
        diagonal: ['sumbuSiku', 'putar90', 'sumbuMiring', 'asli', 'satuUnsur', 'putar180', 'unsurPindah'],
        'diagonal-rumit': ['satuUnsur', 'sumbuSiku', 'putar90', 'unsurPindah', 'sumbuMiring', 'asli', 'putar180'],
        'dua-siku': ['pertama', 'kedua', 'satuUnsur', 'putar90', 'asli', 'sumbuMiring', 'unsurPindah'],
        'dua-miring': ['tertukar', 'pertama', 'kedua', 'satuUnsur', 'putar180', 'asli', 'unsurPindah']
      }[{ datar: 'tegak', 'datar-rumit': 'tegak-rumit', 'diagonal-naik': 'diagonal', 'diagonal-turun': 'diagonal' }[mek] || mek];
      var peng = pilihPengecoh(a, kunci, K, urut, 4, level);
      if (!peng) continue;

      // ---- tata letak gambar soal
      var h = SISI / 2, t = cariTata(a, sumbu, h, dua ? 32 : 24);
      if (!t) continue;
      var daftar = a.kocok(peng.map(function (p) { return { fig: p.fig, alasan: p.alasan, jenis: p.jenis }; }));
      daftar.splice(target, 0, { fig: kunci, kunci: true });
      var skala = skalaBersama([asli].concat(daftar.map(function (d) { return d.fig; })));
      var tata = modelTata(t, h, sumbu, skala, asli);
      if (tata.W > 600 || tata.H > 620) continue;

      // ---- pembahasan
      var acuan = pilihAcuan(asli, dua ? [elLangkah(langkah[0]), eBenar] : [eBenar]), nmAcuan = namaUnsur(asli, acuan.u);
      var c0 = letakAcuan(asli, acuan), pem = [], bahas;
      var pasangan = function (dari, g, figDari) {
        // titik kanvas pada kotak `dari` dan bayangannya terhadap garis g
        return pilihTitik(figDari, 3, satuan([g.b[0] - g.a[0], g.b[1] - g.a[1]])).map(function (p, i) {
          var P = [dari[0] + p[0] * skala, dari[1] + p[1] * skala];
          return { p: P, q: cerminTitik(P, g.a, g.b), warna: WARNA_PASANG[i % 3] };
        });
      };
      var P0 = tata.kotak[0].pusat, Pz = tata.kotak[tata.kotak.length - 1].pusat;
      if (!dua) {
        var s0 = sumbu[0], c1 = letakAcuan(kunci, acuan);
        pem.push('Gambar soal memuat sebuah bentuk dan ' + SUMBU[s0].nama + ' putus-putus sebagai garis cermin. Bayangan cermin diperoleh dengan memindahkan setiap titik bentuk tegak lurus ke seberang garis cermin, dengan jarak ke garis yang sama.');
        pem.push('Pada pencerminan terhadap ' + SUMBU[s0].nama + ', ' + ATURAN_SUMBU[s0] + '.');
        pem.push('Gambar 1 memperlihatkan tiga pasang titik yang bersesuaian (berwarna sama): setiap pasangan dihubungkan garis yang tegak lurus garis cermin dan terbagi dua sama panjang olehnya. Unsur pembanding (' + nmAcuan + ') digambar merah dan ujungnya yang terjauh dari pusat gambar ditandai titik merah: pada gambar asli titik itu berada di bagian ' + c0 + ', pada bayangannya berada di bagian ' + c1 + '.');
        pem.push('Bayangan yang tepat adalah gambar berlatar hijau pada Gambar 1, yaitu bentuk asli yang ' + BALIK_SUMBU[s0] + ', dan gambar itu ada pada opsi {HURUF}.');
        bahas = [{ id: 'bahas-1', jenis: 'tfm-cermin-bahas', judul: 'Gambar 1. Pasangan titik dan bayangan cerminnya',
          model: { W: tata.W, H: tata.H, sisi: tata.sisi, skala: skala, sumbu: tata.sumbu,
            kotak: [{ pusat: P0, gaya: 'asli', fig: asli, acuan: acuan }, { pusat: Pz, gaya: 'jawab', fig: kunci, acuan: acuan }],
            pasangan: pasangan(P0, tata.sumbu[0], asli), jawaban: kunci } }];
      } else {
        var e1 = elLangkah(langkah[0]), antara = terapkan(asli, e1), P1 = tata.kotak[1].pusat;
        var ca = letakAcuan(antara, acuan), cz = letakAcuan(kunci, acuan);
        pem.push('Gambar soal memuat bentuk asli, garis 1 (' + SUMBU[sumbu[0]].nama + '), dan garis 2 (' + SUMBU[sumbu[1]].nama + '). Bentuk dicerminkan terhadap garis 1 lebih dahulu, lalu hasilnya dicerminkan terhadap garis 2. Pada setiap pencerminan, setiap titik dipindah tegak lurus ke seberang garis dengan jarak yang sama.');
        pem.push('Langkah 1 (Gambar 1): pencerminan terhadap ' + SUMBU[sumbu[0]].nama + ': ' + ATURAN_SUMBU[sumbu[0]] + '. Hasilnya digambar berlatar jingga di seberang garis 1.');
        pem.push('Langkah 2 (Gambar 2): hasil langkah 1 dicerminkan terhadap ' + SUMBU[sumbu[1]].nama + ': ' + ATURAN_SUMBU[sumbu[1]] + '. Hasil akhirnya digambar berlatar hijau.');
        pem.push('Ikuti titik merah pada ujung unsur pembanding (' + nmAcuan + ', merah): pada gambar asli titik itu berada di bagian ' + c0 + ', setelah langkah 1 di bagian ' + ca + ', dan setelah langkah 2 di bagian ' + cz + '.');
        pem.push('Dua pencerminan berurutan terhadap dua garis yang ' + (eBenar.t === 180 ? 'saling tegak lurus' : 'membentuk sudut 45°') + ' sama dengan satu kali ' + uraiEl(eBenar) + ' pada bentuk asli, jadi hasil akhirnya tidak terbalik seperti bayangan cermin. Gambar hasil akhir itu ada pada opsi {HURUF}.');
        var sisaKotak = function (gayaAsli, gayaAntara, figAntara, akhir) {
          return [{ pusat: P0, gaya: gayaAsli, fig: asli, acuan: acuan }, { pusat: P1, gaya: gayaAntara, fig: figAntara, acuan: acuan }, akhir];
        };
        bahas = [
          { id: 'bahas-1', jenis: 'tfm-cermin-bahas', judul: 'Gambar 1. Langkah 1: pencerminan terhadap garis 1',
            model: { W: tata.W, H: tata.H, sisi: tata.sisi, skala: skala, sumbu: tata.sumbu, sorotSumbu: 0,
              kotak: sisaKotak('asli', 'antara', antara, { pusat: Pz, gaya: 'tanya' }), pasangan: pasangan(P0, tata.sumbu[0], asli) } },
          { id: 'bahas-2', jenis: 'tfm-cermin-bahas', judul: 'Gambar 2. Langkah 2: pencerminan terhadap garis 2',
            model: { W: tata.W, H: tata.H, sisi: tata.sisi, skala: skala, sumbu: tata.sumbu, sorotSumbu: 1,
              kotak: sisaKotak('redup', 'asli', antara, { pusat: Pz, gaya: 'jawab', fig: kunci, acuan: acuan }), pasangan: pasangan(P1, tata.sumbu[1], antara), jawaban: kunci } }
        ];
      }

      var ctx = { subtes: 'ku', submateri: 'figural', keluarga: id, level: level, benih: benih, a: a };
      var butir = Butir.rakitPg(ctx, {
        jenisSoal: 'Figural - Macam-macam Transformasi (pencerminan)',
        judul: 'Figural - Pencerminan', teks: [], perintah: PERINTAH_CERMIN,
        pertanyaan: dua ? 'Gambar di atas dicerminkan terhadap garis 1, lalu hasilnya dicerminkan terhadap garis 2. Manakah gambar hasil akhirnya?' : 'Manakah bayangan gambar di atas jika dicerminkan terhadap garis putus-putus?',
        gambar: [{ id: 'soal', jenis: 'tfm-cermin', model: tata, judul: 'Bentuk dan garis cermin' }],
        pilihanJadi: { opsi: daftarOpsiGambar(daftar, skala), kunciIndex: target }, tulisKunci: false,
        langkah: [], pembahasan: pem,
        model: { topik: 'Figural', tipe: 'transformasi-cermin', mekanisme: mek, sumbu: sumbu, pilihan: daftar.map(function (d) { return d.fig; }), kunciIndex: target },
        sidik: { inti: 'transformasi-cermin|' + Rng.hashTeks(kunciBentuk(asli).join('/')) + '|' + sumbu.join('>'), param: [], entitas: mek }
      });
      if (!butir) continue;
      butir.gambarPembahasan = bahas;
      butir.pola = id + ':' + mek;
      butir.kategoriRiset = 'pengayaan';
      butir.catatanRiset = 'Bentuk pencerminan dari bab Macam-macam Transformasi Figural di Kerangka Course; tidak ada pada contoh riset BAB V.';
      return butir;
    }
    return null;
  }

  // ======================================================== keluarga 2: putar

  var MEK_PUTAR = {
    mudah: ['90-searah', '180'],
    sedang: ['90-berlawanan', '270', '45-an'],
    sulit: ['putar-cermin', 'cermin-putar', 'putar-putar']
  };
  var LAWAN = { searah: 'berlawanan', berlawanan: 'searah' };

  function langkahPutar(a, mek) {
    var arah = a.pilih(['searah', 'berlawanan']);
    if (mek === '90-searah') return [putar(90, 'searah')];
    if (mek === '180') return [putar(180, 'searah')];
    if (mek === '90-berlawanan') return [putar(90, 'berlawanan')];
    if (mek === '270') return [putar(270, arah)];
    if (mek === '45-an') return [putar(a.pilih([45, 135]), arah)];
    if (mek === 'putar-cermin') return [putar(a.pilih([90, 90, 180]), arah), cermin(a.pilih(['tegak', 'datar']))];
    if (mek === 'cermin-putar') return [cermin(a.pilih(['tegak', 'datar'])), putar(a.pilih([90, 90, 180]), arah)];
    var x = a.pilih([90, 135, 180]), y = a.pilih([45, 90].filter(function (v) { return v !== x; }));
    return [putar(x, arah), putar(y, LAWAN[arah])];
  }

  function salinL(ls) { return ls.map(function (l) { return Object.assign({}, l); }); }

  function buatPutar(id, level, benih, opsi) {
    var a = Rng.alat(benih);
    var target = opsi.target == null ? a.bulat(0, 4) : opsi.target;
    var mek = pilihMekanisme(a, id, MEK_PUTAR[level] || MEK_PUTAR.sedang, opsi.polaDipakai);
    for (var coba = 0; coba < 30; coba++) {
      var ls = langkahPutar(a, mek), dua = ls.length === 2;
      var asli = bentukDasar(a, level === 'mudah' ? 2 : 3, level === 'mudah' ? 5 : 7, level);
      if (!asli) continue;
      var eBenar = elUrutan(ls), kunci = terapkan(asli, eBenar);
      if (!cukupBeda(kunci, asli, level)) continue;

      var K = {};
      var tambah = function (jenis, l2, alasan) { (K[jenis] = K[jenis] || []).push({ jenis: jenis, fig: terapkanUrutan(asli, l2), alasan: alasan }); };
      var iPutar = [];
      ls.forEach(function (l, i) { if (l.jenis === 'putar') iPutar.push(i); });
      iPutar.forEach(function (i) {
        var l = ls[i];
        if (l.sudut !== 180) {
          var b = salinL(ls); b[i].arah = LAWAN[l.arah];
          tambah('arahBalik', b, dua ? 'Arah putar pada langkah ' + (i + 1) + ' terbalik: gambar diputar ' + teksSudut(b[i]) + ', padahal seharusnya ' + teksSudut(l) + '.' : 'Arah putarnya terbalik: gambar ini diputar ' + teksSudut(b[i]) + ', padahal seharusnya ' + teksSudut(l) + '.');
        }
        var alt = { 45: [90, 135], 90: [180, 45], 135: [90, 180], 180: [90], 270: [180, 90] }[l.sudut] || [];
        alt.forEach(function (s) {
          [l.arah].concat(l.sudut === 180 ? [LAWAN[l.arah]] : []).forEach(function (ar) {
            var b = salinL(ls); b[i].sudut = s; b[i].arah = ar;
            tambah('sudutLain', b, dua ? 'Besar putaran pada langkah ' + (i + 1) + ' keliru: gambar diputar ' + teksSudut(b[i]) + ', bukan ' + teksSudut(l) + '.' : 'Besar putarannya keliru: gambar ini diputar ' + teksSudut(b[i]) + ', bukan ' + teksSudut(l) + '.');
          });
        });
      });
      if (!dua) {
        (K.cermin = K.cermin || []).push({ jenis: 'cermin', fig: terapkan(asli, gabung(eBenar, { r: 1, t: 0 })), alasan: 'Gambar ini bayangan cermin dari hasil putaran yang benar; pemutaran tidak pernah membalik gambar.' });
        tambah('asli', [], 'Gambar ini sama dengan gambar asli, belum diputar sama sekali.');
      } else {
        tambah('lupaKedua', [ls[0]], 'Langkah kedua (' + teksLangkah(ls[1]) + ') terlupa; gambar ini baru hasil langkah pertama.');
        tambah('lupaPertama', [ls[1]], 'Langkah pertama (' + teksLangkah(ls[0]) + ') terlewat; gambar ini hanya hasil langkah kedua.');
        if (mek === 'putar-putar') {
          var sama = salinL(ls); sama[1].arah = sama[0].arah;
          tambah('arahSama', sama, 'Putaran kedua dikerjakan searah dengan putaran pertama, padahal arahnya berlawanan.');
          (K.cermin = K.cermin || []).push({ jenis: 'cermin', fig: terapkan(asli, gabung(eBenar, { r: 1, t: 0 })), alasan: 'Gambar ini bayangan cermin dari hasil yang benar; dua kali pemutaran tidak pernah membalik gambar.' });
        } else {
          tambah('urutTukar', [ls[1], ls[0]], 'Urutan langkahnya tertukar: ' + teksUrutan([ls[1], ls[0]]).toLowerCase() + ' memberi hasil yang berbeda.');
          var iC = ls[0].jenis === 'cermin' ? 0 : 1, sb = salinL(ls);
          sb[iC].sumbu = SIKU[ls[iC].sumbu];
          tambah('sumbuLain', sb, 'Garis cerminnya keliru: gambar ini dicerminkan terhadap ' + SUMBU[sb[iC].sumbu].nama + ', padahal seharusnya ' + SUMBU[ls[iC].sumbu].nama + '.');
        }
      }
      K.unsurPindah = calonUnsurPindah(a, kunci, function (nm) { return 'Letak ' + nm + ' terhadap unsur lain berubah; ' + (dua && mek !== 'putar-putar' ? 'pada pemutaran maupun pencerminan' : 'pada putaran') + ' semua unsur bergerak bersama sehingga kedudukan antarunsur tetap.'; });
      var urut = mek === 'putar-putar' ? ['arahSama', 'lupaKedua', 'lupaPertama', 'cermin', 'arahBalik', 'unsurPindah', 'sudutLain']
        : (dua ? [ls[0].jenis === 'putar' ? 'lupaKedua' : 'lupaPertama', 'urutTukar', 'arahBalik', 'sumbuLain', 'unsurPindah', 'sudutLain', ls[0].jenis === 'putar' ? 'lupaPertama' : 'lupaKedua']
          : (mek === '180' ? ['sudutLain', 'cermin', 'unsurPindah', 'asli'] : ['arahBalik', 'sudutLain', 'cermin', 'unsurPindah', 'asli']));
      var peng = pilihPengecoh(a, kunci, K, urut, 4, level);
      if (!peng) continue;

      var daftar = a.kocok(peng.map(function (p) { return { fig: p.fig, alasan: p.alasan, jenis: p.jenis }; }));
      daftar.splice(target, 0, { fig: kunci, kunci: true });
      var skala = skalaBersama([asli].concat(daftar.map(function (d) { return d.fig; })));

      // ---- pembahasan: satu gambar per langkah, gambar terakhir = jawaban
      var pem = [], bahas = [], figs = [asli], eKini = { r: 0, t: 0 }, tahapE = [];
      ls.forEach(function (l) { eKini = gabung(eKini, elLangkah(l)); tahapE.push(eKini); figs.push(terapkan(asli, eKini)); });
      figs[figs.length - 1] = kunci;
      var acuan = pilihAcuan(asli, tahapE), nmAcuan = namaUnsur(asli, acuan.u);
      var letak = figs.map(function (f) { return letakAcuan(f, acuan); });
      var tPertanyaan = 'Gambar di sebelah kiri ' + ls.map(function (l, i) { return (i ? 'hasilnya ' : '') + teksLangkah(l); }).join(', lalu ') + '. Manakah ' + (dua ? 'gambar hasil akhirnya' : 'hasilnya') + '?';
      if (!dua) {
        var l0 = ls[0];
        pem.push('Gambar diputar ' + teksSudut(l0) + ' terhadap titik pusatnya. Pada putaran, seluruh unsur bergerak bersama, sehingga bentuk, ukuran, dan kedudukan antarunsur tetap; yang berubah hanya arah hadapnya, dan gambar tidak pernah terbalik seperti bayangan cermin.');
        if (l0.sudut === 270) pem.push('Putaran 270° ' + (l0.arah === 'searah' ? 'searah' : 'berlawanan arah') + ' jarum jam sama dengan putaran 90° ' + (l0.arah === 'searah' ? 'berlawanan arah' : 'searah') + ' jarum jam.');
        else if (l0.sudut === 180) pem.push('Putaran 180° (searah maupun berlawanan arah jarum jam memberi hasil yang sama) memindahkan bagian atas ke bawah dan bagian kiri ke kanan.');
        else if (l0.sudut % 90) pem.push('Putaran ' + l0.sudut + '° adalah ' + (l0.sudut === 45 ? 'setengah' : 'satu setengah kali') + ' putaran 90°, jadi setiap bagian bergeser ' + (l0.sudut / 45) + ' langkah dari delapan arah (atas, kanan atas, kanan, kanan bawah, bawah, dan seterusnya).');
        pem.push('Ikuti unsur pembanding (' + nmAcuan + ', merah pada Gambar 1) dan titik merah di ujungnya: pada gambar asli titik itu berada di bagian ' + letak[0] + '; setelah diputar ' + teksSudut(l0) + ', titik itu berada di bagian ' + letak[1] + '. Busur biru pada Gambar 1 menunjukkan besar dan arah putarannya, dan bayangan abu-abu menunjukkan kedudukan sebelum diputar.');
        pem.push('Gambar hasil putaran adalah gambar berlatar hijau pada Gambar 1, yaitu opsi {HURUF}.');
      } else {
        pem.push('Gambar dikerjakan dalam dua langkah berurutan: ' + teksUrutan(ls).toLowerCase() + '. Pemutaran dilakukan terhadap titik pusat gambar dan tidak membalik gambar' + (mek === 'putar-putar' ? '; dua putaran berurutan sama dengan satu putaran sebesar selisih (bila arahnya berlawanan) atau jumlah (bila arahnya sama) kedua sudutnya.' : '; pencerminan membalik gambar terhadap garis cerminnya.'));
        ls.forEach(function (l, i) {
          var kal = 'Langkah ' + (i + 1) + ' (Gambar ' + (i + 1) + '): ' + teksLangkah(l) + '. ';
          if (l.jenis === 'cermin') kal += 'Pada pencerminan terhadap ' + SUMBU[l.sumbu].nama + ', ' + ATURAN_SUMBU[l.sumbu] + '. ';
          kal += 'Titik merah pada unsur pembanding (' + nmAcuan + ') ' + pindahKata(letak[i], letak[i + 1]) + '.';
          pem.push(kal);
        });
        pem.push('Kedua langkah itu bersama-sama setara dengan satu kali ' + uraiEl(eBenar) + '. Hasil akhirnya adalah gambar berlatar hijau pada Gambar 2, yaitu opsi {HURUF}.');
      }
      ls.forEach(function (l, i) {
        var akhir = i === ls.length - 1, m = { sebelum: figs[i], sesudah: figs[i + 1], langkah: l, acuan: acuan, skala: skala, akhir: akhir,
          label: [i ? 'Hasil langkah 1' : 'Gambar asli', akhir ? (dua ? 'Hasil akhir (jawaban)' : 'Hasil (jawaban)') : 'Hasil langkah 1'] };
        if (akhir) m.jawaban = kunci;
        bahas.push({ id: 'bahas-' + (i + 1), jenis: 'tfm-langkah', judul: 'Gambar ' + (i + 1) + '. ' + (dua ? 'Langkah ' + (i + 1) + ': ' : '') + kapital(teksLangkah(l)), model: m });
      });

      var ctx = { subtes: 'ku', submateri: 'figural', keluarga: id, level: level, benih: benih, a: a };
      var butir = Butir.rakitPg(ctx, {
        jenisSoal: 'Figural - Macam-macam Transformasi (rotasi)',
        judul: 'Figural - Rotasi', teks: [], perintah: PERINTAH_PUTAR, pertanyaan: tPertanyaan,
        gambar: [{ id: 'soal', jenis: 'tfm-putar', model: { fig: asli, skala: skala, langkah: ls }, judul: 'Bentuk dan arah putar' }],
        pilihanJadi: { opsi: daftarOpsiGambar(daftar, skala), kunciIndex: target }, tulisKunci: false,
        langkah: [], pembahasan: pem,
        model: { topik: 'Figural', tipe: 'transformasi-putar', mekanisme: mek, langkah: ls, pilihan: daftar.map(function (d) { return d.fig; }), kunciIndex: target },
        sidik: { inti: 'transformasi-putar|' + Rng.hashTeks(kunciBentuk(asli).join('/')) + '|' + teksUrutan(ls), param: [], entitas: mek }
      });
      if (!butir) continue;
      butir.gambarPembahasan = bahas;
      butir.pola = id + ':' + mek;
      butir.kategoriRiset = 'pengayaan';
      butir.catatanRiset = 'Bentuk rotasi dari bab Macam-macam Transformasi Figural di Kerangka Course; tidak ada pada contoh riset BAB V.';
      return butir;
    }
    return null;
  }

  // ======================================================== keluarga 3: tebak

  var MEK_TEBAK = {
    mudah: ['putar', 'cermin'],
    sedang: ['cermin-diagonal', 'putar-270', 'putar-45'],
    sulit: ['cermin-putar', 'putar-cermin', 'setara']
  };
  var DASAR = [putar(90, 'searah'), putar(90, 'berlawanan'), putar(180), cermin('tegak'), cermin('datar')];

  function kunciTebak(a, mek) {
    var arah = a.pilih(['searah', 'berlawanan']);
    if (mek === 'putar') return [a.pilih(DASAR.slice(0, 3))];
    if (mek === 'cermin') return [a.pilih(DASAR.slice(3))];
    if (mek === 'cermin-diagonal') return [cermin(a.pilih(['naik', 'turun']))];
    if (mek === 'putar-270') return [putar(270, arah)];
    if (mek === 'putar-45') return [putar(a.pilih([45, 135]), arah)];
    if (mek === 'cermin-putar') return [cermin(a.pilih(['tegak', 'datar', 'naik', 'turun'])), putar(a.pilih([90, 90, 180]), arah)];
    if (mek === 'putar-cermin') return [putar(a.pilih([90, 90, 180]), arah), cermin(a.pilih(['tegak', 'datar']))];
    return a.pilih([[cermin('tegak'), cermin('datar')], [cermin('datar'), cermin('tegak')], [cermin('naik'), cermin('turun')],
      [cermin('tegak'), cermin(a.pilih(['naik', 'turun']))], [cermin('datar'), cermin(a.pilih(['naik', 'turun']))]]);
  }

  /** Alasan pengecoh teks: jalur kesalahannya, lalu akibatnya pada gambar. */
  function alasanTebak(jalur, eBenar, eSalah) {
    var akibat;
    if (eBenar.r !== eSalah.r) {
      akibat = eBenar.r ? 'gambar kanan terbalik seperti bayangan cermin, sedangkan transformasi ini tidak membalik gambar' : 'transformasi ini membalik gambar seperti bayangan cermin, padahal gambar kanan tidak terbalik';
    } else akibat = 'transformasi ini setara dengan ' + uraiEl(eSalah) + ', sedangkan gambar kanan diperoleh dari ' + uraiEl(eBenar);
    return jalur + ' Akibatnya, ' + akibat + '.';
  }

  function buatTebak(id, level, benih, opsi) {
    var a = Rng.alat(benih);
    var target = opsi.target == null ? a.bulat(0, 4) : opsi.target;
    var mek = pilihMekanisme(a, id, MEK_TEBAK[level] || MEK_TEBAK.sedang, opsi.polaDipakai);
    for (var coba = 0; coba < 30; coba++) {
      var ls = kunciTebak(a, mek), eBenar = elUrutan(ls), dua = ls.length === 2;
      if (eBenar.r === 0 && eBenar.t === 0) continue;
      var kiri = bentukDasar(a, level === 'mudah' ? 2 : 3, level === 'sulit' ? 7 : 6, level);
      if (!kiri) continue;
      var kanan = terapkan(kiri, eBenar);
      if (!cukupBeda(kiri, kanan, level)) continue;

      // ---- calon pengecoh (urutan langkah) menurut jalur kesalahan
      var C = [];
      var tambah = function (jalur, l2, prio) { C.push({ ls: l2, jalur: jalur, prio: prio + a.antara(0, 0.9) }); };
      if (level === 'mudah') {
        DASAR.forEach(function (l) { tambah(l.jenis === ls[0].jenis ? (l.jenis === 'putar' ? 'Besar atau arah putarannya keliru.' : 'Garis cerminnya keliru.') : (l.jenis === 'putar' ? 'Gambar diputar, padahal seharusnya dicerminkan.' : 'Gambar dicerminkan, padahal seharusnya diputar.'), [l], 0); });
      } else if (!dua) {
        var l0 = ls[0];
        if (l0.jenis === 'putar') {
          if (l0.sudut !== 180) tambah('Arah putarannya terbalik.', [putar(l0.sudut, LAWAN[l0.arah])], 0);
          ({ 45: [90, 135], 135: [90, 45, 180], 270: [180, 90] }[l0.sudut] || [90, 180]).forEach(function (s) { tambah('Besar sudut putarannya keliru.', [putar(s, l0.arah)], 1); });
          a.kocok(['tegak', 'datar', 'naik', 'turun']).forEach(function (s, i) { tambah('Gambar dicerminkan, padahal hanya perlu diputar.', [cermin(s)], i < 2 ? 1 : 3); });
          if (l0.sudut === 270) tambah('Besar sudut putarannya keliru.', [putar(45, a.pilih(['searah', 'berlawanan']))], 3);
        } else {
          tambah('Garis cerminnya keliru.', [cermin(SIKU[l0.sumbu])], 0);
          tambah('Gambar diputar, padahal seharusnya dicerminkan.', [putar(90, 'searah')], 1);
          tambah('Gambar diputar, padahal seharusnya dicerminkan.', [putar(90, 'berlawanan')], 1);
          tambah('Garis cerminnya keliru.', [cermin(a.pilih(['tegak', 'datar']))], 1);
          tambah('Gambar diputar, padahal seharusnya dicerminkan.', [putar(180)], 2);
          tambah('Gambar diputar, padahal seharusnya dicerminkan.', [putar(45, a.pilih(['searah', 'berlawanan']))], 3);
        }
      } else {
        tambah('Urutan kedua langkahnya tertukar.', [ls[1], ls[0]], 0);
        ls.forEach(function (l, i) {
          var b = salinL(ls);
          if (l.jenis === 'putar') {
            if (l.sudut !== 180) { b[i].arah = LAWAN[l.arah]; tambah('Arah putaran pada langkah ' + (i + 1) + ' terbalik.', b, 0); }
            var b2 = salinL(ls); b2[i].sudut = l.sudut === 180 ? 90 : 180; tambah('Besar sudut putaran pada langkah ' + (i + 1) + ' keliru.', b2, 1);
          } else {
            b[i].sumbu = SIKU[l.sumbu]; tambah('Garis cermin pada langkah ' + (i + 1) + ' keliru.', b, 0);
            var b3 = salinL(ls); b3[i].sumbu = a.pilih(Object.keys(SUMBU).filter(function (s) { return s !== l.sumbu && s !== SIKU[l.sumbu]; })); tambah('Garis cermin pada langkah ' + (i + 1) + ' keliru.', b3, 2);
          }
        });
        tambah('Hanya langkah pertama yang dikerjakan.', [ls[0]], 1);
        tambah('Hanya langkah kedua yang dikerjakan.', [ls[1]], 1);
        // satu langkah sederhana yang tampak setara padahal tidak
        DASAR.concat([cermin('naik'), cermin('turun')]).forEach(function (l) { tambah(l.jenis === 'putar' ? 'Transformasi ini hanya satu kali pemutaran.' : 'Transformasi ini hanya satu kali pencerminan.', [l], 2); });
      }
      C.sort(function (x, y) { return x.prio - y.prio; });
      var dipakai = {}, teksDipakai = {}, peng = [];
      dipakai[kunciEl(eBenar)] = 1;
      teksDipakai[teksUrutan(ls)] = 1;
      for (var i = 0; i < C.length && peng.length < 4; i++) {
        var e = elUrutan(C[i].ls), tx = teksUrutan(C[i].ls);
        if (dipakai[kunciEl(e)] || teksDipakai[tx]) continue;
        if (!cukupBeda(terapkan(kiri, e), kanan, level)) continue;
        dipakai[kunciEl(e)] = 1;
        teksDipakai[tx] = 1;
        peng.push({ ls: C[i].ls, teks: tx, alasan: alasanTebak(C[i].jalur, eBenar, e) });
      }
      if (peng.length < 4) continue;

      var daftar = a.kocok(peng);
      daftar.splice(target, 0, { ls: ls, teks: teksUrutan(ls), kunci: true });
      var opsiTeks = daftar.map(function (d) { return { teks: d.teks, nilai: { langkah: d.ls }, alasan: d.alasan || null, kunci: !!d.kunci, gambar: null }; });
      var skala = skalaBersama([kiri, kanan]);

      // ---- pembahasan
      var figs = [kiri], eKini = { r: 0, t: 0 }, pem = [], bahas = [], tahapE = [];
      ls.forEach(function (l) { eKini = gabung(eKini, elLangkah(l)); tahapE.push(eKini); figs.push(terapkan(kiri, eKini)); });
      figs[figs.length - 1] = kanan;
      var acuan = pilihAcuan(kiri, tahapE), nmAcuan = namaUnsur(kiri, acuan.u);
      var letak = figs.map(function (f) { return letakAcuan(f, acuan); });
      pem.push('Bandingkan gambar kiri dan gambar kanan. Bentuk dan ukuran unsurnya sama; yang berubah hanya arah hadap gambar, jadi gambar kanan diperoleh dengan pemutaran dan/atau pencerminan.');
      pem.push(eBenar.r ? 'Gambar kanan tidak dapat diperoleh hanya dengan memutar gambar kiri, sebab susunan unsurnya terbalik seperti bayangan cermin. Jadi transformasinya memuat pencerminan.'
        : 'Susunan unsur gambar kanan tidak terbalik, jadi gambar kanan dapat diperoleh hanya dengan memutar gambar kiri' + (dua ? ' (dua pencerminan berurutan juga menghasilkan putaran).' : '.'));
      pem.push('Ikuti unsur pembanding (' + nmAcuan + ', merah pada gambar pembahasan) dan titik merah di ujungnya: di gambar kiri titik itu berada di bagian ' + letak[0] + ', di gambar kanan berada di bagian ' + letak[letak.length - 1] + '.');
      if (!dua) {
        pem.push('Gambar 1 memperlihatkan bahwa jika gambar kiri ' + teksLangkah(ls[0]) + ', hasilnya tepat sama dengan gambar kanan (berlatar hijau).');
      } else {
        ls.forEach(function (l, i) { pem.push('Gambar ' + (i + 1) + ' (langkah ' + (i + 1) + '): ' + teksLangkah(l) + '; titik merah pada unsur pembanding ' + pindahKata(letak[i], letak[i + 1]) + '.'); });
        pem.push('Kedua langkah itu bersama-sama setara dengan satu kali ' + uraiEl(eBenar) + ', dan hasilnya tepat gambar kanan (berlatar hijau pada Gambar 2).');
      }
      pem.push('Jadi transformasi yang tepat adalah "' + teksUrutan(ls) + '", yaitu opsi {HURUF}.');
      ls.forEach(function (l, i) {
        var akhir = i === ls.length - 1, m = { sebelum: figs[i], sesudah: figs[i + 1], langkah: l, acuan: acuan, skala: skala, akhir: akhir,
          label: [i ? 'Hasil langkah 1' : 'Gambar kiri', akhir ? 'Gambar kanan' : 'Hasil langkah 1'] };
        if (akhir) m.jawaban = { langkah: ls };
        bahas.push({ id: 'bahas-' + (i + 1), jenis: 'tfm-langkah', judul: 'Gambar ' + (i + 1) + '. ' + (dua ? 'Langkah ' + (i + 1) + ': ' : '') + kapital(teksLangkah(l)), model: m });
      });

      var ctx = { subtes: 'ku', submateri: 'figural', keluarga: id, level: level, benih: benih, a: a };
      var butir = Butir.rakitPg(ctx, {
        jenisSoal: 'Figural - Macam-macam Transformasi (menebak transformasi)',
        judul: 'Figural - Menebak Transformasi', teks: [], perintah: PERINTAH_TEBAK,
        pertanyaan: 'Transformasi apa yang mengubah gambar kiri menjadi gambar kanan?',
        gambar: [{ id: 'soal', jenis: 'tfm-tebak', model: { kiri: kiri, kanan: kanan, skala: skala }, judul: 'Gambar kiri dan gambar kanan' }],
        pilihanJadi: { opsi: opsiTeks, kunciIndex: target },
        langkah: [], pembahasan: pem,
        model: { topik: 'Figural', tipe: 'transformasi-tebak', mekanisme: mek, pilihan: daftar.map(function (d) { return { langkah: d.ls }; }), kunciIndex: target },
        sidik: { inti: 'transformasi-tebak|' + Rng.hashTeks(kunciBentuk(kiri).join('/')) + '|' + kunciEl(eBenar), param: [], entitas: mek }
      });
      if (!butir) continue;
      butir.gambarPembahasan = bahas;
      butir.pola = id + ':' + mek;
      butir.kategoriRiset = 'pengayaan';
      butir.catatanRiset = 'Bentuk menebak jenis transformasi dari bab Macam-macam Transformasi Figural di Kerangka Course; tidak ada pada contoh riset BAB V.';
      return butir;
    }
    return null;
  }

  // ===================================================================== gambar

  function kepalaPanah(p, q, k, warna) {
    var dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, lb = k * 0.52;
    var bx = q[0] - ux * k, by = q[1] - uy * k;
    return S.poli([q, [bx - uy * lb, by + ux * lb], [bx + uy * lb, by - ux * lb]], { tutup: true, isi: warna, garis: warna, tebal: 1, sambung: 'round' });
  }

  /**
   * Gambar sebuah bentuk berpusat di (cx, cy) dengan skala s (px per satuan).
   * o: { warna: [per unsur], semua: warna seluruh unsur, tebal }
   */
  function svgFig(fig, cx, cy, s, o) {
    o = o || {};
    var t = o.tebal || 2.2, depan = [], belakang = [];
    fig.unsur.forEach(function (u, i) {
      var w = (o.warna && o.warna[i]) || o.semua || TINTA, keluar = (o.warna && o.warna[i]) ? depan : belakang;
      if (u.jenis === 'bulat') {
        keluar.push(S.lingkaran(cx + u.pusat[0] * s, cy + u.pusat[1] * s, u.jari * s, { isi: u.isi ? w : 'none', garis: w, tebal: t }));
        return;
      }
      var p = u.titik.map(function (q) { return [cx + q[0] * s, cy + q[1] * s]; });
      keluar.push(S.poli(p, { tutup: !!u.tutup, isi: u.isi ? w : 'none', garis: w, tebal: t, sambung: 'round', ujung: 'round' }));
      if (u.kepala === 1 && p.length >= 2) keluar.push(kepalaPanah(p[p.length - 2], p[p.length - 1], Math.max(7, 8.6 * s), w));
    });
    if (o.titik) depan.push(S.lingkaran(cx + o.titik[0] * s, cy + o.titik[1] * s, 4.6, { isi: BH.acuan, garis: '#ffffff', tebal: 1.4 }));
    return belakang.join('') + depan.join('');
  }

  function warnaAcuan(fig, ac) { return fig.unsur.map(function (u, i) { return i === ac.u ? BH.acuan : null; }); }

  function teksB(s, x, y, o) {
    o = o || {};
    return S.teks(s, x, y, { ukuran: o.ukuran || 11, tebal: o.tebal, isi: o.isi || BH.teks, rata: o.rata });
  }

  /** Bungkus gambar pembahasan: judul di atas, isi digeser ke bawah. */
  function bungkusBahas(inner, W, H, judul) {
    var Wt = Math.max(W, Math.ceil(Metrik.lebar(judul, 13, true)) + 20), Ht = H + 28;
    return { svg: S.doc(teksB(judul, 10, 19, { ukuran: 13, tebal: true }) + S.kelompok(inner, Math.round((Wt - W) / 2), 28), Wt, Ht, { latar: '#ffffff' }), lebar: Wt, tinggi: Ht };
  }

  function kotakTanya(x, y, sisi) {
    return S.rect(x, y, sisi, sisi, { rx: 6, isi: LATAR_TANYA, garis: TEPI, tebal: 1.6, putus: '6 4' }) +
      S.teks('?', x + sisi / 2, y + sisi / 2 + 14, { ukuran: 40, tebal: true, isi: TEPI, rata: 'middle' });
  }

  /** Gambar opsi: satu bentuk dalam kotak. */
  function svgOpsi(m) {
    var pad = 4, W = SISI + 2 * pad;
    var isi = S.rect(pad, pad, SISI, SISI, { rx: 6, isi: '#ffffff', garis: BINGKAI, tebal: 1.2 }) + svgFig(m.fig, pad + SISI / 2, pad + SISI / 2, m.skala);
    return { svg: S.doc(isi, W, W, { latar: '#ffffff' }), lebar: W, tinggi: W };
  }

  // ---- tata letak cermin (soal dan pembahasan)

  function garisSumbu(g, warna, tebal) {
    var o = S.garis(g.a[0], g.a[1], g.b[0], g.b[1], { garis: warna || TINTA, tebal: tebal || 2.2, putus: '9 6', ujung: 'butt' });
    if (g.nomor) {
      o += S.lingkaran(g.label[0], g.label[1], 10.5, { isi: '#ffffff', garis: warna || TINTA, tebal: 1.6 }) +
        S.teks(String(g.nomor), g.label[0], g.label[1] + 4.6, { ukuran: 13, tebal: true, isi: warna || TINTA, rata: 'middle' });
    }
    return o;
  }

  function isiTata(m, pembahasan) {
    var o = [], h = m.sisi / 2;
    m.kotak.forEach(function (k) {
      var x = k.pusat[0] - h, y = k.pusat[1] - h, g = k.gaya || k.peran;
      if (g === 'tanya') { o.push(kotakTanya(x, y, m.sisi)); return; }
      if (g === 'antara' && !k.fig) { o.push(S.rect(x, y, m.sisi, m.sisi, { rx: 6, isi: 'none', garis: '#aab2c2', tebal: 1.4, putus: '5 4' })); return; }
      var gaya = {
        asli: { isi: '#ffffff', garis: pembahasan ? '#9aa3b5' : BINGKAI, tebal: 1.2 },
        redup: { isi: '#ffffff', garis: '#d5dae3', tebal: 1 },
        antara: { isi: BH.latarSorot, garis: BH.sorot, tebal: 2 },
        jawab: { isi: BH.latarJawab, garis: BH.jawab, tebal: 2.5 }
      }[g] || { isi: '#ffffff', garis: BINGKAI, tebal: 1.2 };
      o.push(S.rect(x, y, m.sisi, m.sisi, { rx: 6, isi: gaya.isi, garis: gaya.garis, tebal: gaya.tebal }));
      if (k.fig) o.push(svgFig(k.fig, k.pusat[0], k.pusat[1], m.skala, g === 'redup' ? { semua: REDUP } : (k.acuan ? { warna: warnaAcuan(k.fig, k.acuan), titik: titikDari(k.fig, k.acuan) } : {})));
    });
    m.sumbu.forEach(function (g, i) {
      var sorot = pembahasan && m.sorotSumbu != null && m.sorotSumbu === i;
      o.push(garisSumbu(g, pembahasan && m.sorotSumbu != null && !sorot ? REDUP : TINTA, sorot ? 2.6 : 2.2));
    });
    (m.pasangan || []).forEach(function (ps) {
      var mx = (ps.p[0] + ps.q[0]) / 2, my = (ps.p[1] + ps.q[1]) / 2, dx = ps.q[0] - ps.p[0], dy = ps.q[1] - ps.p[1], L = Math.hypot(dx, dy) || 1;
      var n = [dx / L, dy / L], d = [-n[1], n[0]], k = 6;
      o.push(S.garis(ps.p[0], ps.p[1], ps.q[0], ps.q[1], { garis: ps.warna, tebal: 1.6, putus: '4 3' }));
      o.push(S.poli([[mx + d[0] * k, my + d[1] * k], [mx + d[0] * k + n[0] * k, my + d[1] * k + n[1] * k], [mx + n[0] * k, my + n[1] * k]], { garis: ps.warna, tebal: 1.3 }));
      o.push(S.lingkaran(ps.p[0], ps.p[1], 4, { isi: ps.warna, garis: '#ffffff', tebal: 1.2 }));
      o.push(S.lingkaran(ps.q[0], ps.q[1], 4, { isi: ps.warna, garis: '#ffffff', tebal: 1.2 }));
    });
    return o.join('');
  }

  function svgCerminSoal(m) { return { svg: S.doc(isiTata(m, false), m.W, m.H, { latar: '#ffffff' }), lebar: m.W, tinggi: m.H }; }
  function svgCerminBahas(m, judul) { return bungkusBahas(isiTata(m, true), m.W, m.H, judul); }

  // ---- rantai langkah (soal putar) dan gambar kiri-kanan (soal tebak)

  /** Ikon satu langkah di antara dua kotak, berpusat di (cx, cy). */
  function ikonLangkah(l, cx, cy, nomor) {
    var o = [], w = TINTA;
    if (nomor) {
      o.push(S.lingkaran(cx, cy - 48, 9.5, { isi: '#ffffff', garis: w, tebal: 1.5 }));
      o.push(S.teks(String(nomor), cx, cy - 43.6, { ukuran: 12, tebal: true, isi: w, rata: 'middle' }));
    }
    if (l.jenis === 'putar') {
      var ber = l.arah === 'berlawanan';
      o.push(S.busurPanah(cx, cy - 18, 13, ber ? 125 : -125, ber ? -150 : 150, { warna: w, tebal: 2, kepala: 7 }));
      o.push(S.teks(l.sudut + '°', cx, cy + 24, { ukuran: 13, tebal: true, isi: w, rata: 'middle' }));
      if (l.sudut !== 180) o.push(S.teks(ber ? 'berlawanan' : 'searah', cx, cy + 37, { ukuran: 10, isi: w, rata: 'middle' }));
    } else {
      var teg = l.sumbu === 'tegak';
      if (teg) {
        o.push(S.garis(cx, cy - 33, cx, cy - 3, { garis: w, tebal: 1.8, putus: '4 3' }));
        o.push(S.panah(cx - 3, cy - 18, cx - 15, cy - 18, { warna: w, tebal: 1.6, kepala: 6 }));
        o.push(S.panah(cx + 3, cy - 18, cx + 15, cy - 18, { warna: w, tebal: 1.6, kepala: 6 }));
      } else {
        o.push(S.garis(cx - 16, cy - 18, cx + 16, cy - 18, { garis: w, tebal: 1.8, putus: '4 3' }));
        o.push(S.panah(cx, cy - 21, cx, cy - 33, { warna: w, tebal: 1.6, kepala: 6 }));
        o.push(S.panah(cx, cy - 15, cx, cy - 3, { warna: w, tebal: 1.6, kepala: 6 }));
      }
      o.push(S.teks('cermin', cx, cy + 24, { ukuran: 12, tebal: true, isi: w, rata: 'middle' }));
      o.push(S.teks(teg ? 'tegak' : 'datar', cx, cy + 37, { ukuran: 10, isi: w, rata: 'middle' }));
    }
    o.push(S.panah(cx - 30, cy + 6, cx + 30, cy + 6, { warna: TEPI, tebal: 2, kepala: 8 }));
    return o.join('');
  }

  function svgPutarSoal(m) {
    var sisi = 124, pad = 8, sela = 84, n = m.langkah.length + 1, s = m.skala * sisi / SISI, o = [];
    var W = pad * 2 + n * sisi + (n - 1) * sela, H = pad * 2 + sisi + 8, y = pad + 4;
    for (var k = 0; k < n; k++) {
      var x = pad + k * (sisi + sela);
      if (k === 0) { o.push(S.rect(x, y, sisi, sisi, { rx: 6, isi: '#ffffff', garis: BINGKAI, tebal: 1.2 })); o.push(svgFig(m.fig, x + sisi / 2, y + sisi / 2, s)); }
      else if (k === n - 1) o.push(kotakTanya(x, y, sisi));
      else o.push(S.rect(x, y, sisi, sisi, { rx: 6, isi: 'none', garis: '#aab2c2', tebal: 1.4, putus: '5 4' }));
      if (k < n - 1) o.push(ikonLangkah(m.langkah[k], x + sisi + sela / 2, y + sisi / 2, n > 2 ? k + 1 : null));
    }
    return { svg: S.doc(o.join(''), W, H, { latar: '#ffffff' }), lebar: W, tinggi: H };
  }

  function svgTebakSoal(m) {
    var pad = 8, sela = 76, o = [], W = pad * 2 + 2 * SISI + sela, H = pad * 2 + SISI;
    [m.kiri, m.kanan].forEach(function (f, i) {
      var x = pad + i * (SISI + sela);
      o.push(S.rect(x, pad, SISI, SISI, { rx: 6, isi: '#ffffff', garis: BINGKAI, tebal: 1.2 }));
      o.push(svgFig(f, x + SISI / 2, pad + SISI / 2, m.skala));
    });
    o.push(S.panah(pad + SISI + 14, pad + SISI / 2, pad + SISI + sela - 14, pad + SISI / 2, { warna: TEPI, tebal: 2.4, kepala: 11 }));
    return { svg: S.doc(o.join(''), W, H, { latar: '#ffffff' }), lebar: W, tinggi: H };
  }

  // ---- gambar pembahasan satu langkah (putar atau cermin)

  function svgLangkahPutar(m, judul) {
    var sisi = 150, sela = 120, pad = 8, y0 = 22, s = m.skala * sisi / SISI, o = [], c = sisi / 2;
    var W = pad * 2 + 2 * sisi + sela, H = y0 + sisi + pad;
    var t0 = titikDari(m.sebelum, m.acuan), t1 = titikDari(m.sesudah, m.acuan);
    var arah = function (t) { var L = Math.hypot(t[0], t[1]) || 1; return [t[0] / L, t[1] / L]; }, v0 = arah(t0), v1 = arah(t1);
    var sudut = m.langkah.arah === 'berlawanan' ? -m.langkah.sudut : m.langkah.sudut, sinar = sisi * 0.46, rb = sisi * 0.34;
    [0, 1].forEach(function (i) {
      var x = pad + i * (sisi + sela), cx = x + c, cy = y0 + c, jawab = i === 1 && m.akhir;
      o.push(teksB(m.label[i], cx, y0 - 8, { rata: 'middle', tebal: true, isi: jawab ? BH.jawab : BH.teks }));
      o.push(S.rect(x, y0, sisi, sisi, { rx: 6, isi: jawab ? BH.latarJawab : (i ? BH.latarSorot : '#ffffff'), garis: jawab ? BH.jawab : (i ? BH.sorot : '#9aa3b5'), tebal: jawab ? 2.5 : (i ? 2 : 1.2) }));
      if (i === 1) {
        o.push(svgFig(m.sebelum, cx, cy, s, { semua: HANTU, tebal: 1.8 }));
        o.push(S.garis(cx, cy, cx + v0[0] * sinar, cy + v0[1] * sinar, { garis: BH.redup, tebal: 1.6, putus: '5 3' }));
      }
      var f = i ? m.sesudah : m.sebelum, v = i ? v1 : v0;
      o.push(svgFig(f, cx, cy, s, { warna: warnaAcuan(f, m.acuan), titik: titikDari(f, m.acuan) }));
      o.push(S.garis(cx, cy, cx + v[0] * sinar, cy + v[1] * sinar, { garis: BH.acuan, tebal: 1.6, putus: '5 3' }));
      if (i === 1) {
        var a0 = Math.atan2(v0[0], -v0[1]) * 180 / Math.PI;
        o.push(S.busurPanah(cx, cy, rb, a0, a0 + sudut, { warna: BH.panah, tebal: 2.4, kepala: 9, halo: true }));
        var pl = S.titikSudut(cx, cy, rb + 12, a0 + sudut / 2), batas = c - 15;
        pl = [Math.max(cx - batas, Math.min(cx + batas, pl[0])), Math.max(cy - batas + 4, Math.min(cy + batas + 4, pl[1]))];
        o.push(S.lingkaran(pl[0], pl[1] - 4, 13, { isi: '#ffffff' }));
        o.push(teksB(m.langkah.sudut + '°', pl[0], pl[1], { ukuran: 12, tebal: true, rata: 'middle', isi: BH.panah }));
      }
      o.push(S.lingkaran(cx, cy, 4.2, { isi: BH.panah, garis: '#ffffff', tebal: 1.4 }));
    });
    var mx = pad + sisi + sela / 2, my = y0 + c;
    o.push(S.busurPanah(mx, my - 30, 12, sudut < 0 ? 125 : -125, sudut < 0 ? -150 : 150, { warna: BH.panah, tebal: 2, kepala: 7 }));
    o.push(teksB('putar ' + m.langkah.sudut + '°', mx, my - 2, { ukuran: 12, tebal: true, rata: 'middle', isi: BH.panah }));
    if (m.langkah.sudut !== 180) {
      o.push(teksB(sudut < 0 ? 'berlawanan arah' : 'searah', mx, my + 12, { ukuran: 11, rata: 'middle', isi: BH.panah }));
      o.push(teksB('jarum jam', mx, my + 25, { ukuran: 11, rata: 'middle', isi: BH.panah }));
    }
    o.push(S.panah(mx - 40, my + 38, mx + 40, my + 38, { warna: BH.panah, tebal: 2, kepala: 8 }));
    return bungkusBahas(o.join(''), W, H, judul);
  }

  // sisi garis yang memberi kotak sesudah di kanan (tegak), di bawah (datar), kanan bawah (naik), kanan atas (turun)
  var TANDA_BAHAS = { tegak: -1, datar: 1, naik: 1, turun: -1 };

  function svgLangkahCermin(m, judul) {
    var sisi = 140, h = sisi / 2, nm = m.langkah.sumbu, t = tataCermin([nm], [TANDA_BAHAS[nm]], h, nm === 'datar' ? 30 : 24);
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    var muat = function (x, y) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); };
    t.P.forEach(function (p, i) { muat(p[0] - h, p[1] - h - (i ? 0 : 20)); muat(p[0] + h, p[1] + h + (i ? 22 : 0)); });
    t.garis.forEach(function (g) { muat(g.a[0], g.a[1]); muat(g.b[0], g.b[1]); });
    var pad = 10, dx = pad - x0, dy = pad - y0, W = Math.ceil(x1 - x0 + 2 * pad), H = Math.ceil(y1 - y0 + 2 * pad), s = m.skala * sisi / SISI;
    var P = t.P.map(function (p) { return [p[0] + dx, p[1] + dy]; }), g = { a: [t.garis[0].a[0] + dx, t.garis[0].a[1] + dy], b: [t.garis[0].b[0] + dx, t.garis[0].b[1] + dy] };
    var titik = pilihTitik(m.sebelum, 3, satuan([g.b[0] - g.a[0], g.b[1] - g.a[1]]));
    var tm = {
      W: W, H: H, sisi: sisi, skala: s, sumbu: [g],
      kotak: [{ pusat: P[0], gaya: 'asli', fig: m.sebelum, acuan: m.acuan }, { pusat: P[1], gaya: m.akhir ? 'jawab' : 'antara', fig: m.sesudah, acuan: m.acuan }],
      pasangan: titik.map(function (p, i) { var A = [P[0][0] + p[0] * s, P[0][1] + p[1] * s]; return { p: A, q: cerminTitik(A, g.a, g.b), warna: WARNA_PASANG[i % 3] }; })
    };
    var o = isiTata(tm, true);
    o += teksB(m.label[0], P[0][0], P[0][1] - h - 7, { rata: 'middle', tebal: true });
    o += teksB(m.label[1], P[1][0], P[1][1] + h + 16, { rata: 'middle', tebal: true, isi: m.akhir ? BH.jawab : BH.teks });
    return bungkusBahas(o, W, H, judul);
  }

  function svgLangkah(m, judul) { return m.langkah.jenis === 'putar' ? svgLangkahPutar(m, judul) : svgLangkahCermin(m, judul); }

  // ====================================================================== API

  var KELUARGA = [
    { id: 'transformasi-cermin', nama: 'Pencerminan bentuk terhadap garis sumbu (satu atau dua sumbu)', submateri: 'figural', kolam: 'serial' },
    { id: 'transformasi-putar', nama: 'Rotasi bentuk menurut sudut dan arah (satu atau dua langkah)', submateri: 'figural', kolam: 'serial' },
    { id: 'transformasi-tebak', nama: 'Menebak transformasi dari gambar awal ke gambar akhir (opsi teks)', submateri: 'figural', kolam: 'matriks' }
  ];

  function buat(id, level, benih, opsi) {
    opsi = opsi || {};
    if (id === 'transformasi-cermin') return buatCermin(id, level, benih, opsi);
    if (id === 'transformasi-putar') return buatPutar(id, level, benih, opsi);
    if (id === 'transformasi-tebak') return buatTebak(id, level, benih, opsi);
    return null;
  }

  var GAMBAR = {
    'tfm-figur': function (m) { return svgOpsi(m); },
    'tfm-cermin': function (m) { return svgCerminSoal(m); },
    'tfm-cermin-bahas': svgCerminBahas,
    'tfm-putar': function (m) { return svgPutarSoal(m); },
    'tfm-tebak': function (m) { return svgTebakSoal(m); },
    'tfm-langkah': svgLangkah
  };

  return {
    KELUARGA: KELUARGA, buat: buat, GAMBAR: GAMBAR,
    // dipakai pratinjau/uji internal
    elUrutan: elUrutan, teksUrutan: teksUrutan, bedaTampak: bedaTampak
  };
});
