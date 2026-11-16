/*
 * hitung.js — aritmetika pecahan EKSAK dan pengurai rumus.
 *
 * Dipakai validator untuk menghitung ulang butir dari nol. Bilangan disimpan
 * sebagai pecahan BigInt (pembilang/penyebut), jadi 7.876 x 1,02 x 1,02 dan
 * kawan-kawannya tidak pernah menanggung galat pembulatan biner. Penyusun butir
 * memakai bilangan JavaScript biasa; kalau hasil kedua jalan itu berbeda,
 * validator menandai butirnya.
 *
 * Rumus ditulis dengan sintaks sederhana:
 *   1500*(1+20%)          persen sebagai akhiran
 *   (W-V)/V*100           titik desimal memakai "." (7.5), bukan koma
 *   maks(a,b)  min(a,b)  lantai(x)  langit(x)  bulat(x)  bulatke(x,2)  abs(x)
 * Pangkat bulat dengan "^": 1.02^3.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Hitung = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var N0 = BigInt(0), N1 = BigInt(1), N10 = BigInt(10);

  function abs(a) { return a < N0 ? -a : a; }
  function gcd(a, b) {
    a = abs(a); b = abs(b);
    while (b > N0) { var t = a % b; a = b; b = t; }
    return a;
  }

  /** Pecahan baku: penyebut positif dan sudah disederhanakan. */
  function Q(n, d) {
    if (d === N0) throw new Error('pembagian dengan nol');
    if (d < N0) { n = -n; d = -d; }
    var g = gcd(n, d);
    if (g > N1) { n = n / g; d = d / g; }
    return { n: n, d: d };
  }

  /** Ubah bilangan JS, teks desimal ("35.75"), pecahan ("7/8"), BigInt, atau Q menjadi Q. */
  function q(x) {
    if (x && typeof x === 'object' && typeof x.n === 'bigint') return x;
    if (typeof x === 'bigint') return Q(x, N1);
    if (typeof x === 'number') {
      if (!isFinite(x)) throw new Error('bilangan tak hingga');
      if (Number.isInteger(x) && Math.abs(x) < 9e15) return Q(BigInt(x), N1);
      x = String(x);
    }
    x = String(x).trim();
    var pecah = /^(-?\d+)\s*\/\s*(\d+)$/.exec(x);
    if (pecah) return Q(BigInt(pecah[1]), BigInt(pecah[2]));
    var m = /^([+-]?)(\d*)(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/.exec(x);
    if (!m || (m[2] === '' && m[3] === undefined)) throw new Error('bukan bilangan: ' + x);
    var digit = (m[2] || '0') + (m[3] || '');
    var skala = (m[3] ? m[3].length : 0) - (m[4] ? parseInt(m[4], 10) : 0);
    var n = BigInt(digit);
    var d = N1;
    if (skala > 0) d = N10 ** BigInt(skala); else if (skala < 0) n = n * (N10 ** BigInt(-skala));
    if (m[1] === '-') n = -n;
    return Q(n, d);
  }

  function tambah(a, b) { a = q(a); b = q(b); return Q(a.n * b.d + b.n * a.d, a.d * b.d); }
  function kurang(a, b) { a = q(a); b = q(b); return Q(a.n * b.d - b.n * a.d, a.d * b.d); }
  function kali(a, b) { a = q(a); b = q(b); return Q(a.n * b.n, a.d * b.d); }
  function bagi(a, b) { a = q(a); b = q(b); return Q(a.n * b.d, a.d * b.n); }
  function neg(a) { a = q(a); return Q(-a.n, a.d); }
  function mutlak(a) { a = q(a); return Q(abs(a.n), a.d); }
  function banding(a, b) {
    a = q(a); b = q(b);
    var l = a.n * b.d, r = b.n * a.d;
    return l < r ? -1 : (l > r ? 1 : 0);
  }
  function sama(a, b) { return banding(a, b) === 0; }

  function pangkat(a, k) {
    a = q(a);
    if (!(k.d === N1)) throw new Error('pangkat harus bilangan bulat');
    var e = Number(k.n);
    if (e < 0) return bagi(1, pangkat(a, q(-e)));
    var hasil = Q(N1, N1);
    for (var i = 0; i < e; i++) hasil = kali(hasil, a);
    return hasil;
  }

  function lantai(a) {
    a = q(a);
    var h = a.n / a.d;
    if (a.n < N0 && a.n % a.d !== N0) h = h - N1;
    return Q(h, N1);
  }
  function langit(a) { return neg(lantai(neg(a))); }
  /** Bulat ke bilangan bulat terdekat; setengah dibulatkan menjauhi nol. */
  function bulat(a) {
    a = q(a);
    var dua = BigInt(2);
    var h = (abs(a.n) * dua + a.d) / (a.d * dua);
    return Q(a.n < N0 ? -h : h, N1);
  }
  function bulatke(a, k) {
    var p = pangkat(10, q(k));
    return bagi(bulat(kali(a, p)), p);
  }

  function keAngka(a) {
    a = q(a);
    var hasil = Number(a.n) / Number(a.d);
    if (!isFinite(hasil)) {
      // pembilang dan penyebut terlalu besar untuk Number: pakai pembagian bertahap
      var skala = BigInt(1000000000000);
      hasil = Number((a.n * skala) / a.d) / 1e12;
    }
    return hasil;
  }

  /** Teks desimal dengan `k` angka di belakang titik (dibulatkan). */
  function keTeks(a, k) {
    a = q(a);
    k = k == null ? 6 : k;
    var r = bulatke(a, k);
    var p = N10 ** BigInt(k);
    var negatif = r.n < N0;
    var n = abs(r.n) * p / r.d;
    var s = n.toString();
    if (k > 0) {
      while (s.length <= k) s = '0' + s;
      s = s.slice(0, s.length - k) + '.' + s.slice(s.length - k);
    }
    return (negatif ? '-' : '') + s;
  }

  // ------------------------------------------------------------------ rumus

  function token(str) {
    var out = [], i = 0, m;
    while (i < str.length) {
      var c = str.charAt(i);
      if (/\s/.test(c)) { i++; continue; }
      if ((m = /^\d+(?:\.\d+)?/.exec(str.slice(i)))) { out.push({ t: 'n', v: m[0] }); i += m[0].length; continue; }
      if ((m = /^[A-Za-z_][A-Za-z0-9_]*/.exec(str.slice(i)))) { out.push({ t: 'i', v: m[0] }); i += m[0].length; continue; }
      if ('+-*/^(),%'.indexOf(c) >= 0) { out.push({ t: 'o', v: c }); i++; continue; }
      throw new Error('karakter tak dikenal dalam rumus: "' + c + '" pada ' + str);
    }
    return out;
  }

  var FUNGSI = {
    maks: function (a) { return a.reduce(function (x, y) { return banding(x, y) >= 0 ? x : y; }); },
    min: function (a) { return a.reduce(function (x, y) { return banding(x, y) <= 0 ? x : y; }); },
    lantai: function (a) { return lantai(a[0]); },
    langit: function (a) { return langit(a[0]); },
    bulat: function (a) { return bulat(a[0]); },
    bulatke: function (a) { return bulatke(a[0], a[1]); },
    abs: function (a) { return mutlak(a[0]); }
  };

  /**
   * Hitung sebuah rumus.
   * @param {string} rumus
   * @param {object} [env] nama -> bilangan (number, teks, BigInt, atau Q)
   * @returns {{n:bigint,d:bigint}} pecahan eksak
   */
  function hitung(rumus, env) {
    env = env || {};
    var tok = token(String(rumus)), pos = 0;
    function lihat() { return tok[pos]; }
    function ambil() { return tok[pos++]; }
    function harap(v) {
      var t = ambil();
      if (!t || t.v !== v) throw new Error('rumus tidak sah, diharapkan "' + v + '": ' + rumus);
    }

    function ekspresi() {
      var kiri = suku();
      for (;;) {
        var t = lihat();
        if (t && t.t === 'o' && (t.v === '+' || t.v === '-')) {
          ambil();
          var kanan = suku();
          kiri = t.v === '+' ? tambah(kiri, kanan) : kurang(kiri, kanan);
        } else return kiri;
      }
    }
    function suku() {
      var kiri = unari();
      for (;;) {
        var t = lihat();
        if (t && t.t === 'o' && (t.v === '*' || t.v === '/')) {
          ambil();
          var kanan = unari();
          kiri = t.v === '*' ? kali(kiri, kanan) : bagi(kiri, kanan);
        } else return kiri;
      }
    }
    function unari() {
      var t = lihat();
      if (t && t.t === 'o' && t.v === '-') { ambil(); return neg(unari()); }
      if (t && t.t === 'o' && t.v === '+') { ambil(); return unari(); }
      return pangkatan();
    }
    function pangkatan() {
      var dasar = akhiran();
      var t = lihat();
      if (t && t.t === 'o' && t.v === '^') {
        ambil();
        var e = unari();
        return pangkat(dasar, e);
      }
      return dasar;
    }
    function akhiran() {
      var nilai = utama();
      while (lihat() && lihat().t === 'o' && lihat().v === '%') { ambil(); nilai = bagi(nilai, 100); }
      return nilai;
    }
    function utama() {
      var t = ambil();
      if (!t) throw new Error('rumus terpotong: ' + rumus);
      if (t.t === 'n') return q(t.v);
      if (t.t === 'o' && t.v === '(') { var v = ekspresi(); harap(')'); return v; }
      if (t.t === 'i') {
        var n = lihat();
        if (n && n.t === 'o' && n.v === '(') {
          ambil();
          var arg = [];
          if (!(lihat() && lihat().v === ')')) {
            arg.push(ekspresi());
            while (lihat() && lihat().v === ',') { ambil(); arg.push(ekspresi()); }
          }
          harap(')');
          if (!FUNGSI[t.v]) throw new Error('fungsi tak dikenal: ' + t.v);
          return FUNGSI[t.v](arg);
        }
        if (!Object.prototype.hasOwnProperty.call(env, t.v)) throw new Error('nama tak dikenal dalam rumus: ' + t.v);
        return q(env[t.v]);
      }
      throw new Error('rumus tidak sah di dekat "' + t.v + '": ' + rumus);
    }

    var hasil = ekspresi();
    if (pos < tok.length) throw new Error('rumus berlebih di dekat "' + tok[pos].v + '": ' + rumus);
    return hasil;
  }

  /** Hitung dan kembalikan bilangan JavaScript biasa. */
  function angka(rumus, env) { return keAngka(hitung(rumus, env)); }

  return {
    q: q, Q: Q, tambah: tambah, kurang: kurang, kali: kali, bagi: bagi, neg: neg, mutlak: mutlak,
    banding: banding, sama: sama, pangkat: pangkat, lantai: lantai, langit: langit,
    bulat: bulat, bulatke: bulatke, keAngka: keAngka, keTeks: keTeks,
    hitung: hitung, angka: angka
  };
});
