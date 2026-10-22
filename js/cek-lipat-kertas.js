/*
 * cek-lipat-kertas.js — pemeriksa independen untuk keluarga di lipat-kertas.js (dipanggil validator.js).
 *
 * lipat-lubang  Dari data yang TAMPIL di gambar soal (ruas garis lipat, pangkal dan ujung panah tiap
 *               lipatan, lubang pada kertas terlipat), pemeriksa membangun sendiri bentuk kertas
 *               setiap tahap (memotong poligon dengan garis lipat), memastikan tiap lipatan menumpuk
 *               tepat pada bagian lainnya dan tiap lubang berada di dalam kertas terlipat (menembus
 *               semua lapisan), lalu membuka lipatan dalam urutan terbalik.
 *
 *               Lubang diuraikan menjadi POTONGAN: bentuk simetris (lingkaran, persegi, belah ketupat,
 *               tanda tambah) menjadi delapan oktan 45° di sekitar titik acuannya (setengah = empat
 *               oktan, seperempat = dua oktan), sedangkan segitiga, bintang, dan huruf L menjadi satu
 *               potongan berarah (huruf L: arah tiang dan arah kaki). Pencerminan terhadap garis
 *               bersudut θ memetakan oktan k ke oktan 2θ/45 - k - 1 dan arah φ ke 2θ - φ. Karena itu potongan di tepi lipatan otomatis "menyatu" dengan
 *               bayangannya (oktan-oktan di titik yang sama), dan himpunan potongan hasil membuka
 *               lipatan adalah bentuk kanonik jawaban. Tepat satu opsi harus berhimpunan potongan sama.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory();
    module.exports = api;
  } else {
    api = factory();
    root.CekLipatKertas = api;
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var EPS = 1e-6;
  var SK = 1.1;     // skala bentuk lubang (sama dengan ukuran yang digambar)
  var SUDUT = { kanan: 0, 'kanan-atas': 45, atas: 90, 'kiri-atas': 135, kiri: 180, 'kiri-bawah': 225, bawah: 270, 'kanan-bawah': 315 };
  var KELUARGA = ['bulat', 'persegi', 'ketupat', 'silang'];

  function mod(a, n) { return ((a % n) + n) % n; }
  function r3(v) { var x = Math.round(v * 1000) / 1000; return x === 0 ? 0 : x; }
  function rad(d) { return d * Math.PI / 180; }

  // ------------------------------------------------------------------ potongan lubang

  function jenis(b) {
    var m = /^(setengah|seperempat)-(bulat|persegi|ketupat|silang)$/.exec(b);
    if (m) return { kel: m[2], porsi: m[1] };
    if (KELUARGA.indexOf(b) >= 0) return { kel: b, porsi: 'utuh' };
    if (b === 'segitiga' || b === 'bintang' || b === 'siku') return { kel: b, porsi: 'tunggal' };
    return null;
  }

  /** Potongan sebuah lubang, atau null bila datanya tidak dikenali. */
  function potongan(h) {
    var j = h && jenis(h.bentuk);
    if (!j || typeof h.x !== 'number' || typeof h.y !== 'number' || !isFinite(h.x) || !isFinite(h.y)) return null;
    var x = r3(h.x), y = r3(h.y), out = [], i;
    if (j.porsi === 'utuh') { for (i = 0; i < 8; i++) out.push({ kel: j.kel, x: x, y: y, o: i }); return out; }
    if (j.kel === 'siku') {
      var bag = String(h.arah).split('/'), s1 = SUDUT[bag[0]], s2 = SUDUT[bag[1]];
      if (bag.length !== 2 || s1 === undefined || s2 === undefined || s1 % 90 || s2 % 90 || mod(s1 - s2, 180) !== 90) return null;
      return [{ kel: 'siku', x: x, y: y, s: s1, t: s2 }];
    }
    var s = SUDUT[h.arah];
    if (s === undefined) return null;
    if (j.porsi === 'tunggal') return j.kel === 'bintang' && s % 90 ? null : [{ kel: j.kel, x: x, y: y, s: s }];
    var a = s / 45;
    if (j.porsi === 'setengah') { for (i = 0; i < 4; i++) out.push({ kel: j.kel, x: x, y: y, o: mod(a - 2 + i, 8) }); return out; }
    return [{ kel: j.kel, x: x, y: y, o: mod(a - 1, 8) }, { kel: j.kel, x: x, y: y, o: mod(a, 8) }];
  }

  function kunciPot(p) { return p.kel + '@' + p.x + ',' + p.y + (p.o !== undefined ? '#' + p.o : '>' + p.s + (p.t !== undefined ? '/' + p.t : '')); }

  /** Jarak tepi bentuk utuh dari titik acuannya pada sudut phi (derajat, berlawanan jarum jam, sumbu y ke atas). */
  function jari(kel, phi) {
    var c = Math.abs(Math.cos(rad(phi))), s = Math.abs(Math.sin(rad(phi)));
    if (kel === 'bulat') return 0.9 * SK;
    if (kel === 'persegi') return 0.75 * SK / Math.max(c, s);
    if (kel === 'silang') { var M = Math.max(c, s), mn = Math.min(c, s); return SK * (mn / M <= 0.32 / 0.95 ? 0.95 / M : 0.32 / mn); }
    return SK / (c + s);
  }

  /** Titik-titik contoh sebuah potongan (koordinat layar, y ke bawah). */
  function titikPot(p) {
    var out = [], i;
    if (p.o !== undefined) {
      out.push([p.x, p.y]);
      for (i = 0; i <= 4; i++) { var phi = 45 * p.o + i * 11.25, r = jari(p.kel, phi); out.push([p.x + r * Math.cos(rad(phi)), p.y - r * Math.sin(rad(phi))]); }
      return out;
    }
    var u = [SK * Math.cos(rad(p.s)), -SK * Math.sin(rad(p.s))], v = [-u[1], u[0]];
    if (p.kel === 'siku') {
      var w = [SK * Math.cos(rad(p.t)), -SK * Math.sin(rad(p.t))];
      return [[0.95, -0.6], [0.95, -0.1], [-0.45, -0.1], [-0.45, 0.6], [-0.95, 0.6], [-0.95, -0.6]].map(function (q) { return [p.x + q[0] * u[0] + q[1] * w[0], p.y + q[0] * u[1] + q[1] * w[1]]; });
    }
    if (p.kel === 'segitiga') return [[p.x + 1.1 * u[0], p.y + 1.1 * u[1]], [p.x - 0.65 * u[0] + 0.62 * v[0], p.y - 0.65 * u[1] + 0.62 * v[1]], [p.x - 0.65 * u[0] - 0.62 * v[0], p.y - 0.65 * u[1] - 0.62 * v[1]]];
    for (i = 0; i < 5; i++) { var t = p.s + 72 * i; out.push([p.x + SK * Math.cos(rad(t)), p.y - SK * Math.sin(rad(t))]); }
    return out;
  }

  // ------------------------------------------------------------------ geometri

  /** Garis dari ruas: titik, arah satuan, sudut arah (derajat, kelipatan 45 bila sah). */
  function garisRuas(seg) {
    if (!Array.isArray(seg) || seg.length !== 2) return null;
    var dx = seg[1][0] - seg[0][0], dy = seg[1][1] - seg[0][1], L = Math.hypot(dx, dy);
    if (!(L > EPS)) return null;
    var th = Math.atan2(-dy, dx) * 180 / Math.PI;
    return { p: seg[0], u: [dx / L, dy / L], th: th, empat5: Math.abs(th / 45 - Math.round(th / 45)) < 1e-6 };
  }

  function cerminTitik(g, q) {
    var d = [q[0] - g.p[0], q[1] - g.p[1]], t = d[0] * g.u[0] + d[1] * g.u[1];
    return [2 * (g.p[0] + t * g.u[0]) - q[0], 2 * (g.p[1] + t * g.u[1]) - q[1]];
  }

  function jarakGaris(g, q) { return Math.abs((q[0] - g.p[0]) * g.u[1] - (q[1] - g.p[1]) * g.u[0]); }

  function cerminPot(g, p) {
    var q = cerminTitik(g, [p.x, p.y]), t = Math.round(g.th / 45);
    var o = { kel: p.kel, x: r3(q[0]), y: r3(q[1]) };
    if (p.o !== undefined) o.o = mod(2 * t - p.o - 1, 8);
    else o.s = mod(90 * t - p.s, 360);
    if (p.t !== undefined) o.t = mod(90 * t - p.t, 360);
    return o;
  }

  function luas(P) {
    var a = 0;
    for (var i = 0; i < P.length; i++) { var q = P[i], r = P[(i + 1) % P.length]; a += q[0] * r[1] - r[0] * q[1]; }
    return a / 2;
  }

  /** Bagian poligon cembung dengan n.p >= c. */
  function potong(P, n, c) {
    var out = [];
    for (var i = 0; i < P.length; i++) {
      var a = P[i], b = P[(i + 1) % P.length], da = n[0] * a[0] + n[1] * a[1] - c, db = n[0] * b[0] + n[1] * b[1] - c;
      if (da >= -EPS) out.push(a);
      if ((da > EPS && db < -EPS) || (da < -EPS && db > EPS)) { var t = da / (da - db); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
    }
    var bersih = [];
    out.forEach(function (p) {
      var q = [r3(p[0]), r3(p[1])], u = bersih[bersih.length - 1];
      if (!u || Math.abs(u[0] - q[0]) > 1e-6 || Math.abs(u[1] - q[1]) > 1e-6) bersih.push(q);
    });
    if (bersih.length > 1 && Math.abs(bersih[0][0] - bersih[bersih.length - 1][0]) < 1e-6 && Math.abs(bersih[0][1] - bersih[bersih.length - 1][1]) < 1e-6) bersih.pop();
    return bersih;
  }

  /** Titik di dalam (atau pada tepi, dengan toleransi) poligon cembung. */
  function didalam(P, q, tol) {
    var ar = luas(P) >= 0 ? 1 : -1;
    for (var i = 0; i < P.length; i++) {
      var a = P[i], b = P[(i + 1) % P.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (L < EPS) continue;
      if (ar * ((b[0] - a[0]) * (q[1] - a[1]) - (b[1] - a[1]) * (q[0] - a[0])) / L < -tol) return false;
    }
    return true;
  }

  function diTepi(P, q) {
    for (var i = 0; i < P.length; i++) {
      var a = P[i], b = P[(i + 1) % P.length], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
      if (L < EPS) continue;
      var t = ((q[0] - a[0]) * dx + (q[1] - a[1]) * dy) / (L * L);
      if (t >= -EPS && t <= 1 + EPS && Math.abs((q[0] - a[0]) * dy - (q[1] - a[1]) * dx) / L < 1e-6) return true;
    }
    return false;
  }

  /** Bangun bentuk kertas tiap tahap dari data lipatan; pesan masalah ke m. */
  function prosesLipatan(lipatan, N, m) {
    var Sx = [[0, 0], [N, 0], [N, N], [0, N]], bentuk = [Sx], garis = [], gerak = [];
    for (var i = 0; i < lipatan.length; i++) {
      var f = lipatan[i], g = f && garisRuas(f.garis), nama = 'lipatan ' + (i + 1);
      if (!g) { m.push(nama + ': ruas garis lipat tidak terbaca'); return null; }
      if (!g.empat5) { m.push(nama + ': garis lipat tidak tegak, mendatar, atau miring 45°'); return null; }
      if (!diTepi(Sx, f.garis[0]) || !diTepi(Sx, f.garis[1])) { m.push(nama + ': ruas garis lipat tidak membentang dari tepi ke tepi kertas'); return null; }
      if (!Array.isArray(f.dari) || !Array.isArray(f.ke)) { m.push(nama + ': panah arah lipatan tidak lengkap'); return null; }
      var n = [-g.u[1], g.u[0]], c = n[0] * g.p[0] + n[1] * g.p[1], sd = n[0] * f.dari[0] + n[1] * f.dari[1] - c;
      if (Math.abs(sd) < 1e-3 || !didalam(Sx, f.dari, 1e-6)) { m.push(nama + ': pangkal panah tidak berada pada bagian kertas yang dilipat'); return null; }
      var ke = cerminTitik(g, f.dari);
      if (Math.hypot(ke[0] - f.ke[0], ke[1] - f.ke[1]) > 1e-3) { m.push(nama + ': ujung panah bukan bayangan cermin pangkalnya terhadap garis lipat'); return null; }
      var sg = sd > 0 ? 1 : -1;
      var M = potong(Sx, [sg * n[0], sg * n[1]], sg * c), T = potong(Sx, [-sg * n[0], -sg * n[1]], -sg * c);
      if (M.length < 3 || T.length < 3) { m.push(nama + ': garis lipat tidak membelah kertas'); return null; }
      // bagian yang dilipat harus menumpuk tepat pada bagian yang diam (semua lapisan ada di seluruh bagian terlipat)
      var tepat = Math.abs(Math.abs(luas(M)) - Math.abs(luas(T))) < 1e-4 && M.every(function (p) { return didalam(T, cerminTitik(g, p), 1e-4); });
      if (!tepat) { m.push(nama + ': bagian yang dilipat tidak menumpuk tepat pada bagian kertas lainnya'); return null; }
      bentuk.push(T); garis.push(g); gerak.push(M); Sx = T;
    }
    return { bentuk: bentuk, garis: garis, gerak: gerak };
  }

  /** Himpunan potongan seluruh lubang; null bila ada yang tak dikenali atau bertumpuk. */
  function himpunan(daftar) {
    var set = {};
    for (var i = 0; i < daftar.length; i++) {
      var ps = potongan(daftar[i]);
      if (!ps) return null;
      for (var j = 0; j < ps.length; j++) { var k = kunciPot(ps[j]); if (set[k]) return null; set[k] = ps[j]; }
    }
    return set;
  }

  // ------------------------------------------------------------------ pemeriksa

  function periksa(b, m, alat) {
    var sj = alat.sj, HURUF = alat.HURUF;
    var t = alat.bacaTampilan(b, m, 'lipat-lubang-soal', 'lipat-lubang-opsi', function (x) { return x.fig || null; });
    if (!t) return;
    var soal = t.soal, N = soal.ukuran;
    if (sj(soal.lipatan) !== sj(b.model.lipatan) || sj(soal.lubang) !== sj(b.model.lubang)) m.push('lipatan/lubang yang tergambar berbeda dari data model');
    if (!(N > 0) || !Array.isArray(soal.lipatan) || !soal.lipatan.length || soal.lipatan.length > 3 || !Array.isArray(soal.lubang) || !soal.lubang.length) { m.push('data lipatan atau lubang pada gambar soal tidak lengkap'); return; }
    var pr = prosesLipatan(soal.lipatan, N, m);
    if (!pr) return;
    var n = soal.lipatan.length, akhir = pr.bentuk[n], set = {}, sah = true;

    // lubang pada kertas terlipat: di dalam bagian terlipat; potongan setengah/seperempat menempel pada garis lipat
    soal.lubang.forEach(function (h, i) {
      var ps = potongan(h), nama = 'lubang ' + (i + 1) + ' pada kertas terlipat';
      if (!ps) { m.push(nama + ' tidak dikenali'); sah = false; return; }
      if (!ps.every(function (p) { return titikPot(p).every(function (q) { return didalam(akhir, q, 1e-6); }); })) { m.push(nama + ' keluar dari kertas yang terlipat'); sah = false; }
      var j = jenis(h.bentuk), acu = [h.x, h.y];
      var lewat = pr.garis.filter(function (g) { return jarakGaris(g, acu) < 1e-6; }).length;
      if (j.porsi === 'seperempat' && lewat < 2) { m.push(nama + ' (seperempat bentuk) tidak berada di pojok pertemuan dua garis lipat'); sah = false; }
      if (j.porsi === 'setengah' && !lewat && (j.kel !== 'bulat' || diTepi(akhir, acu))) { m.push(nama + ' (setengah bentuk) tidak menempel pada garis lipat'); sah = false; }
      ps.forEach(function (p) { var k = kunciPot(p); if (set[k]) { m.push(nama + ' bertumpuk dengan lubang lain'); sah = false; } set[k] = p; });
    });
    if (!sah) return;

    // buka lipatan: terakhir lebih dulu; setiap potongan dicerminkan dan harus jatuh pada lapisan yang dilipat
    for (var i = n - 1; i >= 0; i--) {
      var g = pr.garis[i], M = pr.gerak[i], baru = {};
      Object.keys(set).forEach(function (k) {
        var q = cerminPot(g, set[k]), kk = kunciPot(q);
        if (!titikPot(q).every(function (z) { return didalam(M, z, 1e-6); })) { sah = false; return; }
        if (set[kk] || baru[kk]) { sah = false; return; }
        baru[kk] = q;
      });
      if (!sah) { m.push('lubang tidak menembus semua lapisan atau bertumpuk dengan bayangannya saat lipatan ' + (i + 1) + ' dibuka'); return; }
      Object.keys(baru).forEach(function (k) { set[k] = baru[k]; });
    }
    var harus = Object.keys(set).sort();

    // lubang hasil buka tidak saling bertumpuk: potongan dikelompokkan per lubang (titik acuan + bentuk),
    // tiap lubang diwakili lingkaran pembatas titik-titik contohnya; dua bentuk di titik acuan yang sama
    // atau lingkaran yang jelas beririsan berarti bertumpuk
    var lubangBuka = {}, titikAcu = {};
    harus.forEach(function (k) {
      var p = set[k], kl = p.x + ',' + p.y + '|' + p.kel;
      (lubangBuka[kl] = lubangBuka[kl] || []).push.apply(lubangBuka[kl], titikPot(p));
      titikAcu[p.x + ',' + p.y] = (titikAcu[p.x + ',' + p.y] || {});
      titikAcu[p.x + ',' + p.y][p.kel] = 1;
    });
    var tumpuk = Object.keys(titikAcu).some(function (k) { return Object.keys(titikAcu[k]).length > 1; });
    var lingkar = Object.keys(lubangBuka).map(function (kl) {
      var t = lubangBuka[kl], cx = 0, cy = 0, r = 0;
      t.forEach(function (q) { cx += q[0] / t.length; cy += q[1] / t.length; });
      t.forEach(function (q) { r = Math.max(r, Math.hypot(q[0] - cx, q[1] - cy)); });
      return [cx, cy, r];
    });
    for (var a = 0; a < lingkar.length && !tumpuk; a++) {
      for (var c = a + 1; c < lingkar.length && !tumpuk; c++) {
        if (Math.hypot(lingkar[a][0] - lingkar[c][0], lingkar[a][1] - lingkar[c][1]) < lingkar[a][2] + lingkar[c][2] - 0.3) tumpuk = true;
      }
    }
    if (tumpuk) m.push('lubang pada kertas yang dibuka saling bertumpuk');

    // cocokkan opsi
    var cocok = [];
    t.opsi.forEach(function (fig, idx) {
      if (!Array.isArray(fig) || !fig.length) { m.push('opsi ' + HURUF[idx] + ' tidak berisi daftar lubang'); return; }
      var hs = himpunan(fig);
      if (!hs) { m.push('opsi ' + HURUF[idx] + ' memuat lubang yang tidak dikenali atau bertumpuk'); return; }
      var luar = Object.keys(hs).some(function (k) { return titikPot(hs[k]).some(function (q) { return q[0] < -1e-6 || q[1] < -1e-6 || q[0] > N + 1e-6 || q[1] > N + 1e-6; }); });
      if (luar) m.push('opsi ' + HURUF[idx] + ' memuat lubang di luar kertas');
      if (sj(Object.keys(hs).sort()) === sj(harus)) cocok.push(idx);
    });
    alat.tepatSatu(b, m, cocok, 'pencerminan lubang terhadap setiap garis lipat');
  }

  function sidik(b) {
    var md = b.model || {}, lip = md.lipatan || [], pr = prosesLipatan(lip, md.ukuran || 16, []);
    var wilayah = pr ? pr.bentuk[pr.bentuk.length - 1].map(function (p) { return r3(p[0]) + ',' + r3(p[1]); }).sort().join(' ') : '?';
    var urut = lip.map(function (f) { return (f.garis || []).map(function (p) { return p.join(','); }).join('-') + '>' + (f.ke || []).map(r3).join(','); }).join(';');
    var out = [wilayah, urut];
    (md.lubang || []).slice().sort(function (p, q) { return p.y - q.y || p.x - q.x; }).forEach(function (h) {
      out.push(h.bentuk + ':' + (h.arah || ''), 'x' + h.x, 'y' + h.y);
    });
    return out;
  }

  return { TIPE: { 'lipat-lubang': { periksa: periksa, sidik: sidik, batas: 1 } } };
});
