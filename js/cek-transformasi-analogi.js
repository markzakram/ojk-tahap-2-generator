/*
 * cek-transformasi-analogi.js — pemeriksa independen untuk keluarga di transformasi-analogi.js (dipanggil validator.js).
 *
 * Tidak memakai kode penyusun. Yang dibaca hanya data yang TAMPIL: model gambar soal dan gambar opsi.
 *
 *   transformasi-analogi  Isi kotak = { letak, unsur } (unsur relatif terhadap pusat letaknya). Aturan T
 *       DISIMPULKAN dari kotak 1 -> kotak 2 dengan pustaka pemeriksa sendiri:
 *         M      salah satu dari 12 matriks ortogonal (putar kelipatan 45°, termasuk tetap, dan cermin
 *                terhadap garis bersudut 0°, 45°, 90°, 135°)
 *         k      skala terhadap pusat, dibaca dari perbandingan jangkauan garis/bangun
 *         titik  rangkaian operasi titik (lingkaran kecil): warna dibalik / dijadikan hitam / dijadikan
 *                putih, dan hapus semua / yang hitam / yang putih, dalam kedua urutan; lalu boleh
 *                ditambah satu titik baru (dibaca dari kotak 2)
 *         letak  pindah ke letak kotak 2
 *       paling banyak tiga langkah yang benar-benar mengubah gambar. Semua T yang memetakan kotak 1 tepat
 *       ke kotak 2 dikumpulkan; bila hasil penerapannya pada kotak 3 berbeda-beda -> "ambigu". Lalu tepat
 *       satu opsi harus sama dengan T(kotak 3), dan itulah kunci.
 *   transformasi-beda     Kelima opsi dikelompokkan menurut "sama setelah diputar" (pusat berat panjang
 *       garis, calon sudut dari simpul terjauh, lalu dicocokkan unsur demi unsur). Harus ada tepat satu
 *       kelompok berisi empat gambar dan satu gambar sendirian; gambar sendirian itulah kunci.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory();
    module.exports = api;
  } else {
    api = factory();
    root.CekTransformasiAnalogi = api;
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var TOL = 0.03;
  var PUSAT = { tengah: [0, 0], 'kiri-atas': [-26, -26], 'kanan-atas': [26, -26], 'kanan-bawah': [26, 26], 'kiri-bawah': [-26, 26] };
  var BATAS_TITIK = 13.5;

  // ------------------------------------------------------------------ alat bersama

  function hash(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(36);
  }

  function angka(x) { return typeof x === 'number' && isFinite(x); }
  function titikSah(p) { return Array.isArray(p) && p.length === 2 && angka(p[0]) && angka(p[1]); }

  /** Unsur yang terbaca, atau null bila datanya rusak. */
  function bacaUnsur(u) {
    if (!u || typeof u !== 'object') return null;
    if (u.jenis === 'bulat') {
      if (!titikSah(u.pusat) || !angka(u.jari) || u.jari <= 0) return null;
      return { jenis: 'bulat', pusat: [u.pusat[0], u.pusat[1]], jari: u.jari, isi: !!u.isi };
    }
    if (u.jenis === 'garis') {
      if (!Array.isArray(u.titik) || u.titik.length < 2 || !u.titik.every(titikSah)) return null;
      return { jenis: 'garis', titik: u.titik.map(function (p) { return [p[0], p[1]]; }), tutup: !!u.tutup, isi: !!u.isi, kepala: u.kepala || 0 };
    }
    return null;
  }

  function bacaDaftar(d) {
    if (!Array.isArray(d) || !d.length) return null;
    var out = d.map(bacaUnsur);
    return out.some(function (u) { return !u; }) ? null : out;
  }

  function salin(u) {
    if (u.jenis === 'bulat') return { jenis: 'bulat', pusat: [u.pusat[0], u.pusat[1]], jari: u.jari, isi: u.isi };
    return { jenis: 'garis', titik: u.titik.map(function (p) { return [p[0], p[1]]; }), tutup: u.tutup, isi: u.isi, kepala: u.kepala };
  }

  function peta(u, f) {
    var v = salin(u);
    if (v.jenis === 'bulat') v.pusat = f(u.pusat); else v.titik = u.titik.map(f);
    return v;
  }

  function dekat(p, q, tol) { return Math.abs(p[0] - q[0]) <= tol && Math.abs(p[1] - q[1]) <= tol; }

  function deretDekat(a, b) {
    for (var i = 0; i < a.length; i++) if (!dekat(a[i], b[i], TOL)) return false;
    return true;
  }

  /** Dua unsur menggambar goresan yang sama (garis terbuka boleh terbalik arah, bangun tertutup boleh mulai di simpul mana pun). */
  function unsurSama(a, b) {
    if (a.jenis !== b.jenis || a.isi !== b.isi) return false;
    if (a.jenis === 'bulat') return Math.abs(a.jari - b.jari) <= TOL && dekat(a.pusat, b.pusat, TOL);
    if (a.tutup !== b.tutup || a.kepala !== b.kepala || a.titik.length !== b.titik.length) return false;
    var n = a.titik.length;
    if (!a.tutup) return deretDekat(a.titik, b.titik) || (!a.kepala && deretDekat(a.titik, b.titik.slice().reverse()));
    for (var arah = 0; arah < 2; arah++) {
      var bb = arah ? b.titik.slice().reverse() : b.titik;
      for (var g = 0; g < n; g++) if (deretDekat(a.titik, bb.slice(g).concat(bb.slice(0, g)))) return true;
    }
    return false;
  }

  /** Kesamaan dua himpunan ganda unsur (pasangan dicari dengan penelusuran balik). */
  function himpunanSama(a, b) {
    if (a.length !== b.length) return false;
    var pakai = [];
    function coba(i) {
      if (i === a.length) return true;
      for (var j = 0; j < b.length; j++) {
        if (pakai[j] || !unsurSama(a[i], b[j])) continue;
        pakai[j] = true;
        if (coba(i + 1)) return true;
        pakai[j] = false;
      }
      return false;
    }
    return coba(0);
  }

  // ------------------------------------------------------------------ analogi

  function bagi(d) {
    var bangun = [], titik = [];
    d.forEach(function (u) { (u.jenis === 'bulat' && u.jari <= BATAS_TITIK ? titik : bangun).push(u); });
    return { bangun: bangun, titik: titik };
  }

  function terjauh(d) {
    var r = 0;
    d.forEach(function (u) {
      if (u.jenis === 'bulat') r = Math.max(r, Math.hypot(u.pusat[0], u.pusat[1]) + u.jari);
      else u.titik.forEach(function (p) { r = Math.max(r, Math.hypot(p[0], p[1])); });
    });
    return r;
  }

  function bulatkan(x) { return Math.abs(x) < 1e-12 ? 0 : (Math.abs(Math.abs(x) - 1) < 1e-12 ? Math.sign(x) : x); }

  /** Dua belas matriks ortogonal: putar 0..315° (searah jarum jam di layar) dan cermin terhadap garis bersudut 0, 45, 90, 135°. */
  var MATRIKS = (function () {
    var out = [];
    for (var k = 0; k < 8; k++) {
      var t = k * Math.PI / 4, c = bulatkan(Math.cos(t)), s = bulatkan(Math.sin(t));
      out.push({ nama: k ? 'putar ' + (k * 45) + '°' : 'tetap', m: [c, -s, s, c], ubah: k ? 1 : 0 });
    }
    [0, 45, 90, 135].forEach(function (fi) {
      var t = fi * Math.PI / 90, c = bulatkan(Math.cos(t)), s = bulatkan(Math.sin(t));
      out.push({ nama: 'cermin garis ' + fi + '°', m: [c, s, s, -c], ubah: 1 });
    });
    return out;
  })();

  function kenakan(u, M) { var m = M.m; return peta(u, function (p) { return [m[0] * p[0] + m[1] * p[1], m[2] * p[0] + m[3] * p[1]]; }); }

  function skalakan(u, k) {
    var v = peta(u, function (p) { return [p[0] * k, p[1] * k]; });
    if (v.jenis === 'bulat') v.jari = u.jari * k;
    return v;
  }

  var OP_TITIK = (function () {
    var warna = ['balik', 'hitam', 'putih'], hapus = ['semua', 'hitam', 'putih'], out = [[]];
    warna.forEach(function (w) { out.push([['warna', w]]); });
    hapus.forEach(function (h) { out.push([['hapus', h]]); });
    warna.forEach(function (w) {
      hapus.forEach(function (h) { out.push([['warna', w], ['hapus', h]]); out.push([['hapus', h], ['warna', w]]); });
    });
    return out;
  })();

  function jalankan(titik, rangkaian, terbuang) {
    var t = titik.map(salin);
    rangkaian.forEach(function (op) {
      if (op[0] === 'warna') t.forEach(function (u) { u.isi = op[1] === 'balik' ? !u.isi : op[1] === 'hitam'; });
      else {
        t = t.filter(function (u) {
          var buang = op[1] === 'semua' || (op[1] === 'hitam' ? u.isi : !u.isi);
          if (buang) terbuang.push(u);
          return !buang;
        });
      }
    });
    return t;
  }

  /** Satu-satunya unsur `besar` yang tidak berpasangan di `kecil` (besar = kecil + satu unsur), atau null. */
  function lebihSatu(besar, kecil) {
    if (besar.length !== kecil.length + 1) return null;
    for (var i = 0; i < besar.length; i++) {
      if (himpunanSama(besar.slice(0, i).concat(besar.slice(i + 1)), kecil)) return besar[i];
    }
    return null;
  }

  /** Semua aturan pustaka yang memetakan isi kotak A tepat ke B. */
  function simpulkan(A, B) {
    var hasil = [], pa = bagi(A.unsur), pb = bagi(B.unsur), rb = terjauh(pb.bangun), pindah = A.letak !== B.letak;
    MATRIKS.forEach(function (M) {
      var ga = pa.bangun.map(function (u) { return kenakan(u, M); }), ra = terjauh(ga);
      if (ra < 1e-6) return;
      var k = rb / ra;
      if (Math.abs(k - 1) < 0.03) k = 1;
      if (k !== 1) ga = ga.map(function (u) { return skalakan(u, k); });
      if (!himpunanSama(ga, pb.bangun)) return;
      var ta = pa.titik.map(function (u) { return skalakan(kenakan(u, M), k); });
      OP_TITIK.forEach(function (rg) {
        var buang = [], tb = jalankan(ta, rg, buang), E = null;
        if (!himpunanSama(tb, pb.titik)) {
          E = lebihSatu(pb.titik, tb);
          if (!E) return;
          // titik yang dihapus lalu "ditambahkan" lagi di tempat yang sama bukanlah aturan
          if (buang.some(function (u) { return dekat(u.pusat, E.pusat, 1); })) return;
        }
        var n = M.ubah + (k !== 1 ? 1 : 0) + rg.length + (E ? 1 : 0) + (pindah ? 1 : 0);
        if (n === 0 || n > 3) return;
        var nama = [M.nama];
        if (k !== 1) nama.push('skala ' + k.toFixed(2));
        rg.forEach(function (op) { nama.push(op.join(' ')); });
        if (E) nama.push('tambah titik');
        if (pindah) nama.push('pindah ' + B.letak);
        hasil.push({ M: M, k: k, rg: rg, E: E, ke: pindah ? B.letak : null, nama: nama.join(' + ') });
      });
    });
    return hasil;
  }

  function terapkan(T, X) {
    var px = bagi(X.unsur);
    var bangun = px.bangun.map(function (u) { return skalakan(kenakan(u, T.M), T.k); });
    var titik = jalankan(px.titik.map(function (u) { return skalakan(kenakan(u, T.M), T.k); }), T.rg, []);
    if (T.E) titik.push(salin(T.E));
    return { letak: T.ke || X.letak, unsur: bangun.concat(titik) };
  }

  function isiSama(p, q) { return p.letak === q.letak && himpunanSama(p.unsur, q.unsur); }

  function bacaIsi(x) {
    if (!x || typeof x !== 'object' || !PUSAT[x.letak]) return null;
    var u = bacaDaftar(x.unsur);
    return u ? { letak: x.letak, unsur: u } : null;
  }

  /** Seluruh gambar harus berada di dalam kotak 100 x 100 satuan. */
  function dalamKotak(isi) {
    var c = PUSAT[isi.letak], ok = true;
    isi.unsur.forEach(function (u) {
      if (u.jenis === 'bulat') { if (Math.abs(u.pusat[0] + c[0]) + u.jari > 49 || Math.abs(u.pusat[1] + c[1]) + u.jari > 49) ok = false; }
      else u.titik.forEach(function (p) { if (Math.abs(p[0] + c[0]) > 48 || Math.abs(p[1] + c[1]) > 48) ok = false; });
    });
    return ok;
  }

  function periksaAnalogi(b, m, alat) {
    var t = alat.bacaTampilan(b, m, 'ta-analogi', 'ta-panel', function (x) { return x.fig || null; });
    if (!t) return;
    var A = bacaIsi(t.soal.A), B = bacaIsi(t.soal.B), C = bacaIsi(t.soal.C);
    if (!A || !B || !C) { m.push('isi kotak 1, 2, atau 3 pada gambar soal tidak terbaca'); return; }
    var opsi = t.opsi.map(bacaIsi);
    if (opsi.some(function (x) { return !x; })) { m.push('isi gambar opsi tidak terbaca'); return; }
    [A, B, C].concat(opsi).forEach(function (x, i) { if (!dalamKotak(x)) m.push((i < 3 ? 'kotak ' + (i + 1) : 'opsi ' + alat.HURUF[i - 3]) + ' keluar dari bingkai kotak'); });
    // golongan titik (lingkaran kecil) dan lingkaran besar harus tegas
    [A, B, C].forEach(function (x, i) {
      if (x.unsur.some(function (u) { return u.jenis === 'bulat' && u.jari > 11.5 && u.jari < 15.5; })) m.push('kotak ' + (i + 1) + ' memuat lingkaran yang ukurannya meragukan (titik atau lingkaran besar)');
    });
    if (isiSama(A, B)) { m.push('kotak 1 dan kotak 2 sama: tidak ada perubahan yang bisa disimpulkan'); return; }
    var aturan = simpulkan(A, B);
    if (!aturan.length) { m.push('perubahan kotak 1 -> kotak 2 tidak dikenali oleh pustaka transformasi pemeriksa'); return; }
    if (A.letak !== B.letak && C.letak !== A.letak) { m.push('ambigu: kotak 3 tidak berada di letak kotak 1, sehingga arah perpindahannya bisa dibaca lebih dari satu cara'); return; }
    var hasil = aturan.map(function (T) { return terapkan(T, C); });
    for (var i = 1; i < hasil.length; i++) {
      if (!isiSama(hasil[i], hasil[0])) { m.push('ambigu: aturan "' + aturan[0].nama + '" dan "' + aturan[i].nama + '" sama-sama cocok dengan kotak 1 -> 2 tetapi memberi kotak 3 yang berbeda'); return; }
    }
    if (isiSama(hasil[0], C)) m.push('aturan yang disimpulkan tidak mengubah kotak 3');
    var cocok = [];
    opsi.forEach(function (x, j) { if (isiSama(x, hasil[0])) cocok.push(j); });
    alat.tepatSatu(b, m, cocok, 'transformasi kotak 1 -> kotak 2 (' + aturan[0].nama + ')');
  }

  function ringkas(isi) {
    var d = (isi && isi.unsur || []).map(function (u) {
      return u.jenis === 'bulat' ? 'b' + Math.round(u.pusat[0]) + ',' + Math.round(u.pusat[1]) + ',' + Math.round(u.jari) + (u.isi ? 'h' : 'p')
        : 'g' + (u.tutup ? 't' : '') + u.titik.map(function (p) { return Math.round(p[0]) + ',' + Math.round(p[1]); }).join(';');
    }).sort();
    return (isi && isi.letak) + ':' + hash(d.join('|'));
  }

  function sidikAnalogi(b) {
    var g = (b.stimulus.gambar || [])[0], s = g && g.model ? g.model : {}, k = b.opsi && b.opsi[b.kunci] && b.opsi[b.kunci].gambar ? b.opsi[b.kunci].gambar.model.fig : null;
    return [ringkas(s.A), ringkas(s.B), ringkas(s.C), ringkas(k)];
  }

  // ------------------------------------------------------------------ gambar yang berbeda sendiri

  /** Pusat berat goresan: titik tengah tiap ruas dibobot panjangnya, lingkaran dibobot kelilingnya. */
  function pusatBerat(d) {
    var sx = 0, sy = 0, w = 0;
    d.forEach(function (u) {
      if (u.jenis === 'bulat') { var k = 2 * Math.PI * u.jari; sx += u.pusat[0] * k; sy += u.pusat[1] * k; w += k; return; }
      var n = u.titik.length, akhir = u.tutup ? n : n - 1;
      for (var i = 0; i < akhir; i++) {
        var p = u.titik[i], q = u.titik[(i + 1) % n], L = Math.hypot(q[0] - p[0], q[1] - p[1]);
        sx += (p[0] + q[0]) / 2 * L; sy += (p[1] + q[1]) / 2 * L; w += L;
      }
    });
    return w > 0 ? [sx / w, sy / w] : [0, 0];
  }

  function geser(d, c) { return d.map(function (u) { return peta(u, function (p) { return [p[0] - c[0], p[1] - c[1]]; }); }); }

  function simpulSemua(d) {
    var out = [];
    d.forEach(function (u) { if (u.jenis === 'bulat') out.push(u.pusat); else u.titik.forEach(function (p) { out.push(p); }); });
    return out;
  }

  /** Apakah Q sama dengan P setelah P diputar (sudut berapa pun) terhadap pusat beratnya? */
  function samaDiputar(P, Q) {
    if (P.length !== Q.length) return false;
    var p = geser(P, pusatBerat(P)), q = geser(Q, pusatBerat(Q));
    var sp = simpulSemua(p), sq = simpulSemua(q), acuan = null, r = -1;
    sp.forEach(function (v) { var e = Math.hypot(v[0], v[1]); if (e > r) { r = e; acuan = v; } });
    if (!acuan || r < 1e-6) return himpunanSama(p, q);
    var a0 = Math.atan2(acuan[1], acuan[0]);
    for (var i = 0; i < sq.length; i++) {
      if (Math.abs(Math.hypot(sq[i][0], sq[i][1]) - r) > 0.06) continue;
      var t = Math.atan2(sq[i][1], sq[i][0]) - a0, c = Math.cos(t), s = Math.sin(t);
      var pr = p.map(function (u) { return peta(u, function (v) { return [v[0] * c - v[1] * s, v[0] * s + v[1] * c]; }); });
      if (himpunanSama(pr, q)) return true;
    }
    return false;
  }

  function kelompokPutar(figs) {
    var induk = figs.map(function (x, i) { return i; });
    function akar(i) { while (induk[i] !== i) i = induk[i]; return i; }
    for (var i = 0; i < figs.length; i++) {
      for (var j = i + 1; j < figs.length; j++) if (akar(i) !== akar(j) && samaDiputar(figs[i], figs[j])) induk[akar(j)] = akar(i);
    }
    var grup = {};
    figs.forEach(function (x, i) { (grup[akar(i)] = grup[akar(i)] || []).push(i); });
    return Object.keys(grup).map(function (k) { return grup[k]; });
  }

  function bacaOpsiBeda(b) {
    return (b.opsi || []).map(function (o) {
      return o.gambar && o.gambar.jenis === 'ta-beda-opsi' && o.gambar.model && o.gambar.model.fig ? o.gambar.model.fig : null;
    });
  }

  function periksaBeda(b, m, alat) {
    if (!alat.periksaPilihan(b, m, 5)) return;
    var mentah = bacaOpsiBeda(b);
    if (mentah.some(function (f) { return !f; })) { m.push('ada opsi tanpa gambar bentuk'); return; }
    if (alat.sj(mentah) !== alat.sj(b.model.pilihan)) m.push('opsi yang tergambar berbeda dari data model');
    if (b.model.kunciIndex !== b.kunci) m.push('indeks kunci pada model tidak sama dengan kunci butir');
    var teks = String(b.perintah || '') + ' ' + String(b.pertanyaan || '');
    if (!/diputar/.test(teks) || !/berbeda/.test(teks)) m.push('aturan "sama setelah diputar, pilih yang berbeda" tidak tertulis di perintah');
    var lihat = {}, gb = {};
    mentah.forEach(function (x, i) { var s = alat.sj(x); if (lihat[s] !== undefined) m.push('opsi ' + alat.HURUF[lihat[s]] + ' dan ' + alat.HURUF[i] + ' bergambar sama'); lihat[s] = i; });
    b.opsi.forEach(function (o, i) {
      try { var s = alat.Gambar.svg(o.gambar).svg; if (gb[s] !== undefined) m.push('gambar opsi ' + alat.HURUF[gb[s]] + ' dan ' + alat.HURUF[i] + ' identik'); gb[s] = i; } catch (e) { m.push('gambar opsi ' + alat.HURUF[i] + ' gagal digambar'); }
    });
    var figs = mentah.map(function (f) { return bacaDaftar(f.unsur); });
    if (figs.some(function (f) { return !f; })) { m.push('unsur gambar opsi tidak terbaca'); return; }
    var grup = kelompokPutar(figs), ukuran = grup.map(function (g) { return g.length; }).sort();
    if (ukuran.join(',') !== '1,4') {
      m.push('pengelompokan "sama setelah diputar" menghasilkan kelompok berukuran ' + ukuran.join(', ') + ', seharusnya satu kelompok empat gambar dan satu gambar sendiri');
      alat.tepatSatu(b, m, grup.filter(function (g) { return g.length === 1; }).map(function (g) { return g[0]; }), 'aturan "sama setelah diputar"');
      return;
    }
    var sendiri = grup.filter(function (g) { return g.length === 1; })[0];
    alat.tepatSatu(b, m, sendiri, 'aturan "sama setelah diputar" (gambar yang berbeda sendiri)');
  }

  /** Sidik yang tidak berubah oleh putaran: jenis, panjang/jari-jari, isi tiap unsur, dan jarak antarpusat unsur. */
  function tandaPutar(d) {
    var p = geser(d, pusatBerat(d));
    var unsur = p.map(function (u) {
      if (u.jenis === 'bulat') return 'b' + Math.round(u.jari * 2) + (u.isi ? 'h' : 'p') + '@' + Math.round(Math.hypot(u.pusat[0], u.pusat[1]));
      var L = 0, n = u.titik.length, akhir = u.tutup ? n : n - 1;
      for (var i = 0; i < akhir; i++) { var a = u.titik[i], q = u.titik[(i + 1) % n]; L += Math.hypot(q[0] - a[0], q[1] - a[1]); }
      var c = pusatBerat([u]);
      return 'g' + (u.tutup ? 't' : '') + (u.isi ? 'h' : '') + (u.kepala || 0) + 'n' + n + 'L' + Math.round(L) + '@' + Math.round(Math.hypot(c[0], c[1]));
    }).sort();
    return hash(unsur.join('|'));
  }

  function sidikBeda(b) {
    var figs = bacaOpsiBeda(b).map(function (f) { return f ? bacaDaftar(f.unsur) : null; });
    if (figs.some(function (f) { return !f; })) return ['rusak'];
    var lain = figs.filter(function (f, i) { return i !== b.kunci; });
    return [tandaPutar(lain[0]), tandaPutar(figs[b.kunci])];
  }

  return {
    TIPE: {
      'transformasi-analogi': { periksa: periksaAnalogi, sidik: sidikAnalogi, batas: 1 },
      'transformasi-beda': { periksa: periksaBeda, sidik: sidikBeda, batas: 1 }
    }
  };
});
