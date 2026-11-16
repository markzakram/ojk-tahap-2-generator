/*
 * cek-analogi-corak.js — pemeriksa independen untuk keluarga di analogi-corak.js (dipanggil validator.js).
 *
 * Pemeriksa tidak memakai kode penyusun (juga tidak corak.js) dan tidak membaca transformasi yang disimpan
 * penyusun. Ia membaca data ketiga kotak dan kelima opsi yang TAMPIL, lalu:
 *
 *   1. memeriksa bentuk datanya (bangun dikenal, banyak bagian, kode corak sah, bangun dalam, penanda);
 *   2. mengubah tiap lapis bangun menjadi daftar JURING bersudut (sudut awal, kode corak) dan menghitung
 *      kunci kanoniknya sendiri: arah bangun dinormalkan menurut simetri putarnya, juring diurutkan
 *      menurut sudut, sehingga dua data yang tergambar sama selalu berkunci sama;
 *   3. menyimpulkan transformasi kotak 1 -> kotak 2 dengan pustakanya sendiri:
 *        isometri   16 unsur grup dihedral kelipatan 45° (putar 45..315, cermin terhadap garis bersudut
 *                   kelipatan 22,5°); arah garis arsir dan kotak-kotak dihitung ulang dari sudut garisnya
 *        geser      corak pindah satu juring searah / berlawanan arah jarum jam, bangun tetap
 *        substitusi tukar dua corak, ganti satu corak, balik terang-gelap (disimpulkan dari pasangan
 *                   corak sebelum-sesudah; tukar dan ganti sama-sama dicatat bila pasangan baliknya
 *                   tidak terlihat)
 *        bangun     bangun luar berganti (pembagian, corak, bangun dalam, penanda tetap)
 *        dalam-luar corak bangun dalam dan luar bertukar (pembagiannya harus sama)
 *        penanda    lingkaran penanda di pusat ditambah/dihapus
 *      Semua transformasi tunggal yang cocok dan semua gabungan dua transformasi beda golongan (kedua
 *      urutan) yang cocok, asalkan tidak satu pun komponennya sendirian sudah cukup, diterapkan pada
 *      kotak 3. Hasil lebih dari satu, atau tafsiran yang tidak dapat diterapkan pada kotak 3, berarti
 *      ambigu;
 *   4. memastikan tepat satu opsi sama dengan hasil itu (kunci kanonik), dan opsi itu kunci.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory();
    module.exports = api;
  } else {
    api = factory();
    root.CekAnalogiCorak = api;
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var HURUF = ['A', 'B', 'C', 'D', 'E'];
  // simetri putar garis tepi (0 = lingkaran, putar sembarang)
  var SIMETRI = { lingkaran: 0, segitiga: 3, persegi: 4, segienam: 6, segidelapan: 8, kubah: 1, perisai: 1, lensa: 2 };
  var BANYAK_BAGIAN = [1, 2, 3, 4, 5, 6, 8];
  // corak berarah: sudut garis (derajat dari mendatar, berlawanan jarum jam)
  var GARIS = { 'arsir-0': [0], 'arsir-45': [45], 'arsir-90': [90], 'arsir-135': [135], kotak: [0, 90], 'kotak-miring': [45, 135] };
  var POLOS = ['hitam', 'putih', 'titik', 'bintang', 'bulatan'];
  var TERANG_GELAP = { hitam: 'putih', putih: 'hitam', titik: 'bulatan', bulatan: 'titik' };

  function md(x, n) { return ((x % n) + n) % n; }
  function rapi(x) { return Math.round(x * 1000) / 1000; }
  function sudutMod(x, w) { var r = rapi(md(x, w)); return r >= w - 0.0005 ? 0 : r; }
  function kodeSah(k) { return POLOS.indexOf(k) >= 0 || !!GARIS[k]; }

  // ------------------------------------------------------------------ baca data

  function bacaLapis(L, m, nama) {
    if (!L || typeof L !== 'object') { m.push(nama + ': data bangun tidak ada'); return null; }
    if (SIMETRI[L.b] === undefined) { m.push(nama + ': bangun "' + L.b + '" tidak dikenal'); return null; }
    if (BANYAK_BAGIAN.indexOf(L.n) < 0) { m.push(nama + ': banyak bagian ' + L.n + ' tidak sah'); return null; }
    if (!Array.isArray(L.c) || L.c.length !== L.n || !L.c.every(kodeSah)) { m.push(nama + ': kode corak tidak sah'); return null; }
    if (typeof L.o !== 'number' || typeof L.s !== 'number' || !isFinite(L.o) || !isFinite(L.s)) { m.push(nama + ': sudut bangun tidak terbaca'); return null; }
    var w = 360 / L.n;
    return { bangun: L.b, arah: L.o, n: L.n, juring: L.c.map(function (k, i) { return { a: L.s + i * w, k: k }; }) };
  }

  function bacaFig(f, m, nama) {
    if (!f || typeof f !== 'object') { m.push(nama + ': data bangun tidak ada'); return null; }
    var luar = bacaLapis(f, m, nama);
    if (!luar) return null;
    if (luar.n === 1 && !f.d) { m.push(nama + ': bangun tanpa pembagian harus memuat bangun dalam'); return null; }
    var dalam = null;
    if (f.d) {
      dalam = bacaLapis(f.d, m, nama + ' (bangun dalam)');
      if (!dalam) return null;
      if (dalam.n > 1 && (dalam.n !== luar.n || pembagian(dalam) !== pembagian(luar))) { m.push(nama + ': bangun dalam yang terbagi harus mengikuti pembagian bangun luar'); return null; }
    }
    if (f.p !== 0 && f.p !== 1) { m.push(nama + ': penanda pusat tidak terbaca'); return null; }
    return { luar: luar, dalam: dalam, pusat: f.p };
  }

  // ------------------------------------------------------------------ kunci kanonik

  function urutJuring(l) {
    return l.juring.map(function (j) { return { a: sudutMod(j.a, 360), k: j.k }; }).sort(function (x, y) { return x.a - y.a; });
  }
  function pembagian(l) { return l.n === 1 ? '1' : l.n + '@' + sudutMod(l.juring[0].a, 360 / l.n); }
  function arahKanon(l) { var s = SIMETRI[l.bangun]; return s === 0 ? 0 : sudutMod(l.arah, 360 / s); }

  function kunciLapis(l) {
    var kepala = l.bangun + '@' + arahKanon(l) + '#' + pembagian(l);
    return kepala + ':' + (l.n === 1 ? l.juring[0].k : urutJuring(l).map(function (j) { return j.k; }).join(','));
  }
  function kunci(F) { return F ? kunciLapis(F.luar) + '||' + (F.dalam ? kunciLapis(F.dalam) : 'tanpa-dalam') + '||' + F.pusat : '!'; }
  function kunciTanpaLuar(F) { return pembagian(F.luar) + ':' + urutJuring(F.luar).map(function (j) { return j.k; }).join(',') + '||' + (F.dalam ? kunciLapis(F.dalam) : '-') + '||' + F.pusat; }

  // ------------------------------------------------------------------ transformasi pemeriksa

  /** Kode corak setelah isometri (cermin = f, lalu putar th searah jarum jam). */
  function isoKode(k, f, th) {
    if (!GARIS[k]) return k;
    var baru = GARIS[k].map(function (alfa) {
      var a = 90 - alfa;                                // arah garis diukur dari atas, searah jarum jam
      var a2 = f ? th - a : a + th;
      return md(rapi(90 - a2), 180);
    }).sort(function (x, y) { return x - y; }).join(',');
    for (var nama in GARIS) if (GARIS[nama].slice().sort(function (x, y) { return x - y; }).join(',') === baru) return nama;
    throw new Error('arah corak tidak terpetakan');
  }

  function isoLapis(l, f, th) {
    var w = 360 / l.n;
    return { bangun: l.bangun, arah: f ? th - l.arah : l.arah + th, n: l.n,
      juring: l.juring.map(function (j) { return { a: f ? th - j.a - w : j.a + th, k: isoKode(j.k, f, th) }; }) };
  }

  function salinLapis(l, kodeBaru) {
    return { bangun: l.bangun, arah: l.arah, n: l.n, juring: l.juring.map(function (j, i) { return { a: j.a, k: kodeBaru ? kodeBaru(j.k, i) : j.k }; }) };
  }

  function geserLapis(l, k) {
    if (l.n < 2) return salinLapis(l);
    var u = urutJuring(l);
    return { bangun: l.bangun, arah: l.arah, n: l.n, juring: u.map(function (j, i) { return { a: j.a, k: u[md(i - k, l.n)].k }; }) };
  }

  /** Operasi: { jenis, ... } -> fungsi F -> F' (atau null bila tidak berlaku). */
  function jalan(op, F) {
    if (!F) return null;
    switch (op.jenis) {
      case 'iso': return { luar: isoLapis(F.luar, op.f, op.th), dalam: F.dalam ? isoLapis(F.dalam, op.f, op.th) : null, pusat: F.pusat };
      case 'geser': return { luar: geserLapis(F.luar, op.k), dalam: F.dalam ? geserLapis(F.dalam, op.k) : null, pusat: F.pusat };
      case 'sub':
        var peta = function (k) { return op.peta[k] || k; };
        return { luar: salinLapis(F.luar, peta), dalam: F.dalam ? salinLapis(F.dalam, peta) : null, pusat: F.pusat };
      case 'bangun':
        if (F.luar.bangun !== op.dari) return null;
        var l = salinLapis(F.luar); l.bangun = op.ke; l.arah = op.arah;
        return { luar: l, dalam: F.dalam, pusat: F.pusat };
      case 'dl':
        if (!F.dalam || F.dalam.n !== F.luar.n || pembagian(F.dalam) !== pembagian(F.luar)) return null;
        var kl = urutJuring(F.luar), kd = urutJuring(F.dalam);
        return {
          luar: { bangun: F.luar.bangun, arah: F.luar.arah, n: F.luar.n, juring: kl.map(function (j, i) { return { a: j.a, k: kd[i].k }; }) },
          dalam: { bangun: F.dalam.bangun, arah: F.dalam.arah, n: F.dalam.n, juring: kd.map(function (j, i) { return { a: j.a, k: kl[i].k }; }) },
          pusat: F.pusat
        };
      case 'pusat': return { luar: F.luar, dalam: F.dalam, pusat: 1 - F.pusat };
    }
    throw new Error('operasi tidak dikenal: ' + op.jenis);
  }

  function jalanSemua(ops, F) { for (var i = 0; i < ops.length && F; i++) F = jalan(ops[i], F); return F; }

  var EKS = [];
  (function () {
    for (var f = 0; f <= 1; f++) for (var th = 0; th < 360; th += 45) if (f || th) EKS.push({ jenis: 'iso', f: f, th: th, gol: 'iso' });
    EKS.push({ jenis: 'geser', k: 1, gol: 'geser' }, { jenis: 'geser', k: -1, gol: 'geser' }, { jenis: 'dl', gol: 'dl' }, { jenis: 'pusat', gol: 'pusat' });
  })();

  function balikan(op) {
    if (op.jenis === 'iso') return op.f ? op : { jenis: 'iso', f: 0, th: md(-op.th, 360), gol: 'iso' };
    if (op.jenis === 'geser') return { jenis: 'geser', k: -op.k, gol: 'geser' };
    return op;
  }

  function semuaKode(F) { return urutJuring(F.luar).map(function (j) { return j.k; }).concat(F.dalam ? urutJuring(F.dalam).map(function (j) { return j.k; }) : []); }

  /** Substitusi corak (tukar, ganti, balik terang-gelap) yang membawa A tepat ke T. */
  function substitusi(A, T) {
    if (!A || !T || !A.dalam !== !T.dalam || A.pusat !== T.pusat) return [];
    var bentukA = function (l) { return l.bangun + '@' + arahKanon(l) + '#' + pembagian(l); };
    if (bentukA(A.luar) !== bentukA(T.luar) || (A.dalam && bentukA(A.dalam) !== bentukA(T.dalam))) return [];
    var x = semuaKode(A), y = semuaKode(T), peta = {}, ada = {};
    for (var i = 0; i < x.length; i++) {
      if (peta.hasOwnProperty(x[i]) && peta[x[i]] !== y[i]) return [];
      peta[x[i]] = y[i]; ada[x[i]] = true;
    }
    var berubah = Object.keys(peta).filter(function (k) { return peta[k] !== k; }), hasil = [];
    if (!berubah.length) return [];
    function op(nama, p) { return { jenis: 'sub', gol: 'sub', nama: nama, peta: p }; }
    if (berubah.length === 1) {
      var a = berubah[0], b = peta[a], g = {}; g[a] = b;
      hasil.push(op('ganti ' + a + ' menjadi ' + b, g));
      if (!ada[b]) { var t = {}; t[a] = b; t[b] = a; hasil.push(op('tukar ' + a + ' dan ' + b, t)); }
    }
    if (berubah.length === 2 && peta[berubah[0]] === berubah[1] && peta[berubah[1]] === berubah[0]) {
      var t2 = {}; t2[berubah[0]] = berubah[1]; t2[berubah[1]] = berubah[0];
      hasil.push(op('tukar ' + berubah[0] + ' dan ' + berubah[1], t2));
    }
    var cocokBalik = Object.keys(ada).every(function (k) { return peta[k] === (TERANG_GELAP[k] || k); });
    if (cocokBalik) hasil.push(op('balik terang-gelap', TERANG_GELAP));
    return hasil;
  }

  /** Penggantian bangun luar yang membawa A ke T. */
  function gantiBangun(A, T) {
    if (!A || !T) return [];
    var la = A.luar, lt = T.luar;
    if (la.bangun === lt.bangun && arahKanon(la) === arahKanon(lt)) return [];
    if (kunciTanpaLuar(A) !== kunciTanpaLuar(T)) return [];
    return [{ jenis: 'bangun', gol: 'bangun', dari: la.bangun, ke: lt.bangun, arah: lt.arah }];
  }

  function namaOp(op) {
    if (op.jenis === 'iso') return op.f ? 'cermin (garis ' + rapi(md(90 - op.th / 2, 180)) + '°)' : 'putar ' + op.th + '°';
    if (op.jenis === 'geser') return 'geser ' + (op.k > 0 ? 'searah' : 'berlawanan arah') + ' jarum jam';
    if (op.jenis === 'sub') return op.nama;
    if (op.jenis === 'bangun') return 'bangun luar menjadi ' + op.ke;
    if (op.jenis === 'dl') return 'tukar corak dalam-luar';
    return 'penanda pusat';
  }

  /** Semua tafsiran kotak 1 -> kotak 2 (tunggal, dan gabungan dua yang tiap komponennya diperlukan). */
  function tafsiran(K1, K2) {
    var tuju = kunci(K2), out = [], memo = {};
    function kena(F) { return !!F && kunci(F) === tuju; }
    function sendiri(op) {
      var id = JSON.stringify([op.jenis, op.f, op.th, op.k, op.peta, op.dari, op.ke, op.arah]);
      if (!memo.hasOwnProperty(id)) memo[id] = kena(jalan(op, K1));
      return memo[id];
    }
    function perlu(a, b) { return !sendiri(a) && !sendiri(b); }
    EKS.forEach(function (op) { if (sendiri(op)) out.push([op]); });
    substitusi(K1, K2).forEach(function (op) { out.push([op]); });
    gantiBangun(K1, K2).forEach(function (op) { out.push([op]); });
    EKS.forEach(function (x) {
      var A = jalan(x, K1);
      if (A) {
        EKS.forEach(function (y) { if (y.gol !== x.gol && kena(jalan(y, A)) && perlu(x, y)) out.push([x, y]); });
        substitusi(A, K2).forEach(function (s) { if (perlu(x, s)) out.push([x, s]); });
        gantiBangun(A, K2).forEach(function (b) { if (perlu(x, b)) out.push([x, b]); });
      }
      var Z = jalan(balikan(x), K2);
      if (Z) substitusi(K1, Z).forEach(function (s) { if (kena(jalan(x, jalan(s, K1))) && perlu(s, x)) out.push([s, x]); });
    });
    // substitusi dan ganti bangun bersama (keduanya disimpulkan: bangun luar kotak 1 diganti bangun luar kotak 2)
    if (K1.luar.bangun !== K2.luar.bangun || arahKanon(K1.luar) !== arahKanon(K2.luar)) {
      var bb = { jenis: 'bangun', gol: 'bangun', dari: K1.luar.bangun, ke: K2.luar.bangun, arah: K2.luar.arah };
      var A = { luar: salinLapis(K1.luar), dalam: K1.dalam, pusat: K1.pusat };
      A.luar.bangun = bb.ke; A.luar.arah = bb.arah;
      substitusi(A, K2).forEach(function (s) { if (perlu(s, bb)) out.push([s, bb]); });
    }
    return out;
  }

  // ------------------------------------------------------------------ pemeriksaan

  function periksa(b, m, alat) {
    var t = alat.bacaTampilan(b, m, 'analogi-corak-soal', 'analogi-corak-opsi', function (x) { return x.fig || null; });
    if (!t) return;
    var kotak = t.soal.kotak;
    if (alat.sj(kotak) !== alat.sj(b.model.kotak)) m.push('kotak yang tergambar berbeda dari data model');
    if (!Array.isArray(kotak) || kotak.length !== 3) { m.push('soal analogi harus memuat tepat tiga kotak bergambar (kotak keempat tanda tanya)'); return; }
    var F = kotak.map(function (f, i) { return bacaFig(f, m, 'kotak ' + (i + 1)); });
    var O = t.opsi.map(function (f, i) { return bacaFig(f, m, 'opsi ' + HURUF[i]); });
    if (F.some(function (x) { return !x; }) || O.some(function (x) { return !x; })) return;
    var k = F.map(kunci), ko = O.map(kunci);
    if (k[0] === k[1]) { m.push('kotak 1 dan kotak 2 sama; tidak ada perubahan yang dapat disimpulkan'); return; }
    if (k[0] === k[2]) m.push('kotak 3 sama dengan kotak 1, padahal harus berbeda bentuk atau susunan');
    var lihat = {};
    ko.forEach(function (x, i) { if (lihat[x] !== undefined) m.push('opsi ' + HURUF[lihat[x]] + ' dan ' + HURUF[i] + ' menggambarkan bangun yang sama'); lihat[x] = i; });

    var tf = tafsiran(F[0], F[1]);
    if (!tf.length) { m.push('tidak ada transformasi (atau gabungan dua transformasi) dalam pustaka pemeriksa yang membawa kotak 1 ke kotak 2'); return; }
    var hasil = {}, contoh = {};
    tf.forEach(function (ops) {
      var kk = kunci(jalanSemua(ops, F[2]));
      if (!hasil[kk]) { hasil[kk] = 0; contoh[kk] = ops.map(namaOp).join(' lalu '); }
      hasil[kk]++;
    });
    var ks = Object.keys(hasil);
    if (ks.length !== 1 || ks[0] === '!') {
      m.push('aturan ambigu: tafsiran kotak 1 ke kotak 2 memberi hasil berbeda pada kotak 3 (' + ks.slice(0, 4).map(function (x) { return x === '!' ? contoh[x] + ' tidak dapat diterapkan' : contoh[x]; }).join('; ') + ')');
      return;
    }
    var jawab = ks[0];
    if (jawab === k[2]) m.push('transformasi tidak mengubah kotak 3');
    if (jawab === k[1]) m.push('jawaban sama dengan kotak 2');
    var cocok = [];
    ko.forEach(function (x, i) { if (x === jawab) cocok.push(i); });
    alat.tepatSatu(b, m, cocok, 'transformasi kotak 1 ke kotak 2 (' + contoh[jawab] + ')');
  }

  function sidik(b) {
    var m = [], kotak = (b.model && b.model.kotak) || [], kk = b.model && b.model.pilihan ? b.model.pilihan[b.model.kunciIndex] : null;
    return kotak.concat([kk]).map(function (f) { var F = bacaFig(f, m, 'x'); return F ? kunci(F) : 'tak-terbaca'; });
  }

  return { TIPE: { 'analogi-corak': { periksa: periksa, sidik: sidik, batas: 1 } } };
});
