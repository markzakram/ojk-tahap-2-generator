/*
 * cek-transformasi-corak.js — pemeriksa independen untuk keluarga di transformasi-corak.js (dipanggil validator.js).
 *
 * Pemeriksa bekerja pada DATA gambar yang tampil (model gambar soal dan opsi) dan teks pertanyaan, tidak
 * memanggil kode penyusun dan tidak memakai corak.js. Setiap bangun bercorak diubah menjadi bentuk MUTLAK:
 * arah titik sudut garis tepinya, rentang sudut tiap bagian (a0 -> a1 searah jarum jam, 0 = atas) beserta
 * kode coraknya, lingkaran tengah, dan arah titik penanda. Corak diuraikan menjadi jenis + himpunan sudut
 * garisnya (arsir-θ = {θ}, kotak = {0, 90}, kotak-miring = {45, 135}, diukur berlawanan jarum jam dari
 * mendatar); corak tanpa garis tidak berarah.
 *
 * Putaran dan pencerminan dihitung secara GEOMETRIS pada vektor arah: arah bagian (sin φ, -cos φ) di layar
 * diputar searah jarum jam atau dicerminkan terhadap garis bersudut α (arah (cos α, -sin α)), begitu pula
 * vektor arah setiap garis corak. Pencerminan membalik urutan ujung rentang bagian. Sudut garis yang tidak
 * ada dalam daftar corak membuat transformasi tidak sah.
 *
 *   corak-putar, corak-cermin  langkah (putar sudut/arah, cermin garis) dibaca dari teks pertanyaan dan dari
 *       gambar soal (busur panah dan garis putus-putus) dan harus sama; bangun awal harus tidak simetris
 *       terhadap putaran/cermin apa pun yang memetakan bingkainya ke dirinya (kalau simetris, jawaban dapat
 *       ganda), setiap langkah harus memetakan bingkai ke dirinya, dan hasilnya tidak boleh sama dengan
 *       bangun awal. Tepat satu opsi harus berbentuk mutlak sama dengan hasil langkah-langkah itu.
 *   corak-beda  tanpa gambar soal: kelima bangun opsi (berbingkai sama) dikelompokkan menurut "sama setelah
 *       diputar" (putaran kelipatan 7,5° yang memetakan bingkai dan semua corak dengan sah); harus ada tepat
 *       satu kelompok berisi empat bangun dan satu bangun sendirian, dan yang sendirian itu kunci.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory();
    module.exports = api;
  } else {
    api = factory();
    root.CekTransformasiCorak = api;
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var HURUF = ['A', 'B', 'C', 'D', 'E'];
  // arah titik sudut garis tepi (0 = atas, searah jarum jam); lingkaran dianggap bulat sempurna
  var SUDUT_TEPI = {
    lingkaran: [],
    persegi: [45, 135, 225, 315],
    'belah-ketupat': [0, 90, 180, 270],
    segienam: [30, 90, 150, 210, 270, 330],
    segidelapan: [22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5]
  };
  var TANPA_GARIS = ['hitam', 'putih', 'titik', 'bintang', 'bulatan'];
  var GARIS = { kotak: [0, 90], 'kotak-miring': [45, 135], 'arsir-0': [0], 'arsir-45': [45], 'arsir-90': [90], 'arsir-135': [135] };
  var SUMBU_TEKS = { tegak: 90, datar: 0, 'miring dari kiri bawah ke kanan atas': 45, 'miring dari kiri atas ke kanan bawah': 135 };

  function r3(x) { var v = Math.round(x * 1000) / 1000; return v === 0 ? 0 : v; }
  function n360(x) { var v = r3(((x % 360) + 360) % 360); return v >= 360 ? 0 : v; }
  function n180(x) { var v = r3(((x % 180) + 180) % 180); return v >= 180 ? 0 : v; }
  function sj(x) { return JSON.stringify(x); }
  function urutAngka(d) { return d.slice().sort(function (a, b) { return a - b; }); }

  // ------------------------------------------------------------- geometri arah

  function vekArah(phi) { var t = phi * Math.PI / 180; return [Math.sin(t), -Math.cos(t)]; }
  function arahVek(v) { return n360(Math.atan2(v[0], -v[1]) * 180 / Math.PI); }
  function vekGaris(th) { var t = th * Math.PI / 180; return [Math.cos(t), -Math.sin(t)]; }
  function garisVek(v) { return n180(Math.atan2(-v[1], v[0]) * 180 / Math.PI); }

  /** Transformasi geometris: putar d derajat searah jarum jam, atau cermin terhadap garis bersudut alpha. */
  function trPutar(d) {
    var t = d * Math.PI / 180, c = Math.cos(t), s = Math.sin(t);
    return { cermin: false, v: function (p) { return [p[0] * c - p[1] * s, p[0] * s + p[1] * c]; }, nama: 'putar ' + d };
  }
  function trCermin(alpha) {
    var t = alpha * Math.PI / 180, u = [Math.cos(t), -Math.sin(t)];
    return { cermin: true, v: function (p) { var dp = p[0] * u[0] + p[1] * u[1]; return [2 * dp * u[0] - p[0], 2 * dp * u[1] - p[1]]; }, nama: 'cermin ' + alpha };
  }
  function trArah(tr, phi) { return arahVek(tr.v(vekArah(phi))); }

  /** Kode corak setelah transformasi, atau null bila sudut garisnya tidak ada dalam daftar corak. */
  function trKode(tr, kode) {
    if (TANPA_GARIS.indexOf(kode) >= 0) return kode;
    var g = GARIS[kode];
    if (!g) return null;
    var baru = sj(urutAngka(g.map(function (th) { return garisVek(tr.v(vekGaris(th))); })));
    var hasil = null;
    Object.keys(GARIS).forEach(function (k) { if (sj(GARIS[k]) === baru) hasil = k; });
    return hasil;
  }

  // ------------------------------------------------------------ bentuk mutlak

  function kodeSah(k) { return TANPA_GARIS.indexOf(k) >= 0 || !!GARIS[k]; }

  /** Bentuk mutlak sebuah bangun, atau pesan galat (string) bila datanya tidak terbaca. */
  function mutlak(f) {
    if (!f || typeof f !== 'object') return 'bangun kosong';
    if (!SUDUT_TEPI[f.bentuk]) return 'bentuk bangun tidak dikenal: ' + f.bentuk;
    if (!(f.n >= 2 && f.n <= 12 && Math.round(f.n) === f.n) || typeof f.awal !== 'number') return 'pembagian bangun tidak terbaca';
    if (!Array.isArray(f.corak) || f.corak.length !== f.n || !f.corak.every(kodeSah)) return 'corak bagian bangun tidak terbaca';
    var w = 360 / f.n, L = [], D = null, k;
    for (k = 0; k < f.n; k++) L.push({ a0: f.awal + k * w, a1: f.awal + (k + 1) * w, kode: f.corak[k] });
    if (f.cincin) {
      var c = f.cincin;
      if (!(c.n >= 1 && c.n <= 8) || !Array.isArray(c.corak) || c.corak.length !== c.n || !c.corak.every(kodeSah) || typeof c.awal !== 'number') return 'lingkaran tengah tidak terbaca';
      if (c.n === 1) D = { utuh: c.corak[0] };
      else { D = []; for (k = 0; k < c.n; k++) D.push({ a0: c.awal + k * 360 / c.n, a1: c.awal + (k + 1) * 360 / c.n, kode: c.corak[k] }); }
    }
    var P = null;
    if (f.penanda != null) {
      if (!(f.penanda >= 0 && f.penanda < f.n && Math.round(f.penanda) === f.penanda)) return 'titik penanda tidak terbaca';
      P = f.awal + (f.penanda + 0.5) * w;
    }
    return { bentuk: f.bentuk, V: SUDUT_TEPI[f.bentuk].slice(), L: L, D: D, P: P };
  }

  function trBagian(tr, b) {
    var kode = trKode(tr, b.kode), p0 = trArah(tr, b.a0), p1 = trArah(tr, b.a1);
    if (kode == null) return null;
    return tr.cermin ? { a0: p1, a1: p0, kode: kode } : { a0: p0, a1: p1, kode: kode };
  }

  /** Bentuk mutlak setelah transformasi; null bila ada corak yang tidak dapat dipetakan. */
  function trMutlak(tr, m) {
    var L = m.L.map(function (b) { return trBagian(tr, b); }), D = null;
    if (L.some(function (x) { return !x; })) return null;
    if (m.D) {
      if (m.D.utuh) { var u = trKode(tr, m.D.utuh); if (u == null) return null; D = { utuh: u }; }
      else { D = m.D.map(function (b) { return trBagian(tr, b); }); if (D.some(function (x) { return !x; })) return null; }
    }
    return { bentuk: m.bentuk, V: m.V.map(function (a) { return trArah(tr, a); }), L: L, D: D, P: m.P == null ? null : trArah(tr, m.P) };
  }

  function sinar(L) { return urutAngka(L.map(function (b) { return n360(b.a0); })); }
  function bingkai(m) { return sj([m.bentuk, urutAngka(m.V.map(n360)), sinar(m.L), m.D ? (m.D.utuh ? 'utuh' : sinar(m.D)) : 'tanpa']); }
  function kanon(m) {
    var bag = function (d) { return d.map(function (b) { return n360(b.a0) + '>' + n360(b.a1) + ':' + b.kode; }).sort(); };
    return sj([bingkai(m), bag(m.L), m.D ? (m.D.utuh ? m.D.utuh : bag(m.D)) : null, m.P == null ? null : n360(m.P)]);
  }

  /** Semua transformasi (putar dan cermin, kelipatan 7,5°) yang memetakan bingkai bangun ke dirinya. */
  function grupBingkai(m) {
    var out = [], b0 = bingkai(m);
    for (var i = 1; i < 48; i++) { var t = trPutar(i * 7.5), x = trMutlakBingkai(t, m); if (x === b0) out.push(t); }
    for (var j = 0; j < 24; j++) { var c = trCermin(j * 7.5), y = trMutlakBingkai(c, m); if (y === b0) out.push(c); }
    return out;
  }
  function trMutlakBingkai(tr, m) {
    var tanpaKode = function (d) { return d.map(function (b) { var p0 = trArah(tr, b.a0), p1 = trArah(tr, b.a1); return tr.cermin ? { a0: p1 } : { a0: p0 }; }); };
    return bingkai({ bentuk: m.bentuk, V: m.V.map(function (a) { return trArah(tr, a); }), L: tanpaKode(m.L), D: m.D ? (m.D.utuh ? m.D : tanpaKode(m.D)) : null });
  }

  // --------------------------------------------------------- langkah dan teks

  function trLangkah(l) { return l.jenis === 'putar' ? trPutar(l.arah === 'berlawanan' ? -l.sudut : l.sudut) : trCermin(l.sumbu); }

  /** Langkah yang disebut di teks pertanyaan, berurutan. */
  function bacaTeks(t) {
    var re = /diputar (?:lagi )?(\d+)°(?: (searah|berlawanan arah) jarum jam)?|dicerminkan terhadap garis (tegak|datar|miring dari kiri bawah ke kanan atas|miring dari kiri atas ke kanan bawah|putus-putus|1|2)/g, out = [], m;
    while ((m = re.exec(t))) {
      if (m[1]) out.push({ jenis: 'putar', sudut: +m[1], arah: m[2] === 'berlawanan arah' ? 'berlawanan' : (m[2] ? 'searah' : null) });
      else out.push({ jenis: 'cermin', garis: m[3] });
    }
    return out;
  }

  function langkahSah(l) {
    if (!l || (l.jenis !== 'putar' && l.jenis !== 'cermin')) return false;
    if (l.jenis === 'putar') return l.sudut > 0 && l.sudut < 360 && (l.arah === 'searah' || l.arah === 'berlawanan');
    return [0, 45, 90, 135].indexOf(l.sumbu) >= 0;
  }

  /** Cocokkan langkah teks dengan langkah yang tergambar; kembalikan langkah tergambar bila sesuai. */
  function cocokLangkah(b, m, gambar, keluarga) {
    var teks = bacaTeks(String(b.pertanyaan || '')), gb = gambar.langkah;
    if (!Array.isArray(gb) || !gb.length || gb.length > 2 || !gb.every(langkahSah)) { m.push('langkah transformasi pada gambar soal tidak terbaca'); return null; }
    if (teks.length !== gb.length) { m.push('pertanyaan menyebut ' + teks.length + ' langkah, gambar soal menandai ' + gb.length); return null; }
    var ok = true;
    teks.forEach(function (t, i) {
      var g = gb[i];
      if (t.jenis !== g.jenis) { ok = false; m.push('langkah ' + (i + 1) + ' di teks (' + t.jenis + ') berbeda dengan tanda di gambar (' + g.jenis + ')'); return; }
      if (t.jenis === 'putar') {
        if (t.sudut !== g.sudut || (t.sudut !== 180 && t.arah !== g.arah) || (t.sudut === 180 && t.arah && t.arah !== g.arah)) { ok = false; m.push('sudut atau arah putar langkah ' + (i + 1) + ' di teks tidak sama dengan busur panah di gambar'); }
        return;
      }
      if (SUMBU_TEKS[t.garis] !== undefined) { if (SUMBU_TEKS[t.garis] !== g.sumbu) { ok = false; m.push('garis cermin langkah ' + (i + 1) + ' di teks tidak sama dengan garis di gambar'); } }
      else if (t.garis === 'putus-putus') { if (gb.length !== 1) { ok = false; m.push('"garis putus-putus" disebut padahal gambar memuat lebih dari satu garis'); } }
      else if (+t.garis !== i + 1) { ok = false; m.push('urutan garis cermin di teks tidak sama dengan nomor garis di gambar'); }
    });
    if (keluarga === 'corak-cermin' && gb.some(function (l) { return l.jenis !== 'cermin'; })) { ok = false; m.push('soal pencerminan memuat langkah putar'); }
    return ok ? gb : null;
  }

  // ------------------------------------------------------------------ putar dan cermin

  function periksaLangkah(keluarga) {
    return function (b, m, alat) {
      var t = alat.bacaTampilan(b, m, 'tcorak-soal', 'tcorak-opsi', function (x) { return x.fig || null; });
      if (!t) return;
      var s = t.soal;
      if (sj(s.fig) !== sj(b.model.fig) || sj(s.langkah) !== sj(b.model.langkah)) m.push('gambar soal yang tergambar berbeda dari data model');
      var awal = mutlak(s.fig);
      if (typeof awal === 'string') { m.push(awal); return; }
      var langkah = cocokLangkah(b, m, s, keluarga);
      if (!langkah) return;
      // bangun awal tidak boleh simetris terhadap transformasi bingkainya
      var k0 = kanon(awal);
      var simetri = grupBingkai(awal).filter(function (tr) { var x = trMutlak(tr, awal); return x && kanon(x) === k0; });
      if (simetri.length) m.push('bangun soal simetris (' + simetri.map(function (tr) { return tr.nama + '°'; }).join(', ') + '), jawabannya dapat ganda');
      var hasil = awal, b0 = bingkai(awal);
      for (var i = 0; i < langkah.length; i++) {
        hasil = trMutlak(trLangkah(langkah[i]), hasil);
        if (!hasil) { m.push('langkah ' + (i + 1) + ' membuat arah garis corak di luar daftar corak'); return; }
        if (bingkai(hasil) !== b0) { m.push('langkah ' + (i + 1) + ' tidak memetakan garis tepi dan garis bagi bangun ke dirinya'); return; }
      }
      var kh = kanon(hasil);
      if (kh === k0) m.push('hasil transformasi sama dengan bangun awal');
      var cocok = [];
      t.opsi.forEach(function (f, i) {
        var mo = mutlak(f);
        if (typeof mo === 'string') { m.push('opsi ' + HURUF[i] + ': ' + mo); return; }
        if (bingkai(mo) !== b0) m.push('opsi ' + HURUF[i] + ' berbingkai lain dari bangun soal');
        if (kanon(mo) === kh) cocok.push(i);
      });
      alat.tepatSatu(b, m, cocok, keluarga === 'corak-putar' ? 'hasil putaran' : 'hasil pencerminan');
    };
  }

  function bagianSidik(b) {
    var g = (b.stimulus.gambar || [])[0], f = g && g.model ? g.model.fig : b.model.fig, ls = g && g.model ? g.model.langkah : b.model.langkah;
    if (!f || !f.corak) return ['?'];
    var ctx = [f.bentuk, f.n, f.awal, f.cincin ? f.cincin.n + '/' + f.cincin.awal : '-', sj(ls)].join('|');
    var out = f.corak.map(function (k) { return ctx + '|' + k; });
    if (f.cincin) f.cincin.corak.forEach(function (k) { out.push(ctx + '|c:' + k); });
    out.push(ctx + '|p:' + (f.penanda == null ? '-' : f.penanda));
    return out;
  }

  // -------------------------------------------------------------------- beda

  /** Apakah bangun x dapat diputar menjadi bangun y (keduanya bentuk mutlak)? */
  function samaPutar(x, y) {
    var ky = kanon(y);
    if (kanon(x) === ky) return true;
    for (var i = 1; i < 48; i++) {
      var h = trMutlak(trPutar(i * 7.5), x);
      if (h && kanon(h) === ky) return true;
    }
    return false;
  }

  function periksaBeda(b, m, alat) {
    if (!alat.periksaPilihan(b, m, 5)) return;
    if ((b.stimulus.gambar || []).length) m.push('soal gambar yang berbeda tidak memakai gambar soal');
    if (!/hanya diputar/.test(String(b.perintah || '') + ' ' + String(b.pertanyaan || ''))) m.push('perintah tidak menyebut bahwa bangun yang sama hanya diputar');
    var figs = b.opsi.map(function (o) { return o.gambar && o.gambar.jenis === 'tcorak-opsi' && o.gambar.model ? o.gambar.model.fig || null : null; });
    if (figs.some(function (x) { return !x; })) { m.push('ada opsi tanpa gambar tcorak-opsi'); return; }
    if (sj(figs) !== sj(b.model.pilihan)) m.push('opsi yang tergambar berbeda dari data model');
    if (b.model.kunciIndex !== b.kunci) m.push('indeks kunci pada model tidak sama dengan kunci butir');
    var lihat = {}, gb = {};
    figs.forEach(function (x, i) { var s = sj(x); if (lihat[s] !== undefined) m.push('opsi ' + HURUF[lihat[s]] + ' dan ' + HURUF[i] + ' bergambar sama'); lihat[s] = i; });
    b.opsi.forEach(function (o, i) {
      try { var s = alat.Gambar.svg(o.gambar).svg; if (gb[s] !== undefined) m.push('gambar opsi ' + HURUF[gb[s]] + ' dan ' + HURUF[i] + ' identik'); gb[s] = i; } catch (e) { m.push('gambar opsi ' + HURUF[i] + ' gagal digambar'); }
    });
    var ms = figs.map(mutlak), salah = ms.filter(function (x) { return typeof x === 'string'; });
    if (salah.length) { m.push(salah[0]); return; }
    var b0 = bingkai(ms[0]);
    if (ms.some(function (x) { return bingkai(x) !== b0; })) { m.push('kelima bangun tidak berbingkai sama (bentuk atau pembagiannya berbeda)'); return; }
    // kelompok "sama setelah diputar"
    var kel = [0, 1, 2, 3, 4], cari = function (i) { while (kel[i] !== i) i = kel[i]; return i; };
    for (var i = 0; i < 5; i++) for (var j = i + 1; j < 5; j++) if (samaPutar(ms[i], ms[j])) kel[cari(j)] = cari(i);
    var anggota = {};
    for (var q = 0; q < 5; q++) { var r = cari(q); (anggota[r] = anggota[r] || []).push(q); }
    var kelompok = Object.keys(anggota).map(function (k) { return anggota[k]; }).sort(function (x, y) { return y.length - x.length; });
    if (kelompok.length !== 2 || kelompok[0].length !== 4) {
      m.push('kelima bangun terbagi menjadi ' + kelompok.length + ' kelompok "sama setelah diputar" (' + kelompok.map(function (g) { return g.map(function (x) { return HURUF[x]; }).join(''); }).join(' / ') + '), seharusnya empat dan satu');
      alat.tepatSatu(b, m, kelompok.filter(function (g) { return g.length === 1; }).map(function (g) { return g[0]; }), 'bangun yang berbeda sendiri');
      return;
    }
    // bangun yang sama tidak boleh simetris putar (empat posisi harus berbeda; sudah dijamin opsi berbeda) — cukup kunci
    alat.tepatSatu(b, m, kelompok[1], 'bangun yang berbeda sendiri');
  }

  /** Bentuk kanonik terkecil di antara semua putaran sah bangun (pembanding kembar). */
  function kanonPutar(mu) {
    var terbaik = kanon(mu), wakil = mu;
    for (var i = 1; i < 48; i++) {
      var h = trMutlak(trPutar(i * 7.5), mu);
      if (h && bingkai(h) === bingkai(mu)) { var k = kanon(h); if (k < terbaik) { terbaik = k; wakil = h; } }
    }
    return { kanon: terbaik, wakil: wakil };
  }

  function sidikBeda(b) {
    var p = b.model.pilihan, k = b.model.kunciIndex;
    if (!Array.isArray(p) || p.length !== 5) return ['?'];
    var ms = p.map(mutlak);
    if (ms.some(function (x) { return typeof x === 'string'; })) return ['?'];
    var sama = ms.filter(function (x, i) { return i !== k; }), w = kanonPutar(sama[0]).wakil, f = p[k === 0 ? 1 : 0];
    var ctx = [f.bentuk, f.n, f.awal, f.cincin ? f.cincin.n + '/' + f.cincin.awal : '-'].join('|');
    var bag = w.L.map(function (x) { return [n360(x.a0), x.kode]; }).sort(function (x, y) { return x[0] - y[0]; });
    var out = bag.map(function (x) { return ctx + '|' + x[1]; });
    if (w.D) out = out.concat(w.D.utuh ? [ctx + '|c:' + w.D.utuh] : w.D.map(function (x) { return [n360(x.a0), x.kode]; }).sort(function (x, y) { return x[0] - y[0]; }).map(function (x) { return ctx + '|c:' + x[1]; }));
    out.push(ctx + '|p:' + (w.P == null ? '-' : n360(w.P)));
    out.push(ctx + '|ganjil:' + kanonPutar(ms[k]).kanon);
    return out;
  }

  return {
    TIPE: {
      'corak-putar': { periksa: periksaLangkah('corak-putar'), sidik: bagianSidik, batas: 1 },
      'corak-cermin': { periksa: periksaLangkah('corak-cermin'), sidik: bagianSidik, batas: 1 },
      'corak-beda': { periksa: periksaBeda, sidik: sidikBeda, batas: 1 }
    }
  };
});
