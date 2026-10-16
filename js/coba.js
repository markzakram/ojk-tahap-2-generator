/*
 * coba.js — mode coba interaktif Penalaran Numerik.
 *
 * Soal Penalaran Numerik tidak berbentuk pilihan A-E: peserta MENGATUR tampilan
 * (menggeser batang, titik, atau batas irisan, atau memilih jawaban per tab) sampai
 * sesuai dengan keterangan soal. Berkas ini membuat tampilan yang dapat diatur itu
 * dari butir `jenis: 'isian'`, memeriksa jawabannya terhadap kunci, dan dapat
 * menampilkan kunci.
 *
 *   Coba.pasang(wadah, butir, opsi)   pasang widget ke elemen `wadah` (peramban)
 *   Coba.logika                       fungsi murni (snap, periksa, ...) — dipakai juga oleh uji Node
 *
 * Gambar selalu dibuat ulang dari model yang sama dengan yang dipakai PNG/Word/PDF
 * (`Gambar.svg`), jadi yang dilihat di sini sama dengan yang tercetak pada kunci.
 * Pegangan geser adalah lapisan SVG terpisah di atas gambar sehingga gambar boleh
 * dibuat ulang tiap geseran tanpa memutus pointer.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./gambar.js'), require('./format.js'));
    module.exports = api;
  } else {
    api = factory(root.Gambar, root.Fmt);
    root.Coba = api;
  }
})(typeof self !== 'undefined' ? self : this, function (Gambar, Fmt) {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var TOLERANSI = 1e-6;

  // ================================================================ logika murni

  function salin(x) { return x == null ? x : JSON.parse(JSON.stringify(x)); }

  /** Bulatkan `v` ke kelipatan `langkah` dari `lo`, lalu batasi ke [lo, hi]. */
  function snap(v, langkah, lo, hi) {
    var n = Math.round((v - lo) / langkah);
    var r = lo + n * langkah;
    r = Math.round(r * 1e9) / 1e9;                 // buang galat titik-kambang
    return Math.min(hi, Math.max(lo, r));
  }

  function kontrol(isian, nama) {
    for (var i = 0; i < isian.kontrol.length; i++) if (isian.kontrol[i].nama === nama) return isian.kontrol[i];
    return null;
  }

  function sama(a, b) { return a != null && b != null && Math.abs(a - b) <= TOLERANSI; }

  /**
   * Periksa tampilan terhadap kunci.
   * @returns {{benar:boolean, lengkap:boolean, rinci:Array<{label:string, benar:boolean}>}}
   */
  function periksa(isian, st) {
    var k = isian.kunci, rinci = [], lengkap = true;
    if (isian.jenis === 'bar-tumpuk') {
      isian.kategori.forEach(function (kat, i) {
        rinci.push({ label: 'total ' + kat, benar: sama(st.total[i], k.total[i]) });
        rinci.push({ label: 'persentase ' + isian.seri[0] + ' ' + kat, benar: sama(st.persen[i], k.persen[i]) });
      });
    } else if (isian.jenis === 'garis') {
      isian.kategori.forEach(function (kat, i) {
        if (st.nilai[i] == null) lengkap = false;
        rinci.push({ label: 'titik ' + kat, benar: sama(st.nilai[i], k.nilai[i]) });
      });
    } else if (isian.jenis === 'pie') {
      isian.irisan.forEach(function (nama, i) {
        rinci.push({ label: 'irisan ' + nama, benar: sama(st.persen[i], k.persen[i]) });
      });
    } else if (isian.jenis === 'tabel') {
      isian.tab.forEach(function (nama, i) {
        if (st[i] == null) lengkap = false;
        rinci.push({ label: nama, benar: st[i] === k[i] });
      });
    } else {
      throw new Error('jenis isian tidak dikenal: ' + isian.jenis);
    }
    return { benar: rinci.every(function (r) { return r.benar; }), lengkap: lengkap, rinci: rinci };
  }

  /** Kalimat umpan balik dari hasil `periksa`. */
  function umpan(hasil) {
    if (hasil.benar) return { ok: true, teks: 'Benar. Semua bagian sudah sesuai dengan keterangan soal.' };
    var salah = hasil.rinci.filter(function (r) { return !r.benar; }).map(function (r) { return r.label; });
    var teks = 'Belum tepat. Yang masih perlu diperiksa: ' + salah.join(', ') + '.';
    if (!hasil.lengkap) teks += ' Ada bagian yang belum diisi.';
    return { ok: false, teks: teks };
  }

  /** Titik pada lingkaran (derajat, 0 di jam 12, searah jarum jam). */
  function titikLingkaran(cx, cy, r, derajat) {
    var a = derajat * Math.PI / 180;
    return [cx + r * Math.sin(a), cy - r * Math.cos(a)];
  }

  /** Sudut (derajat 0..360, 0 di jam 12, searah jarum jam) titik (x, y) terhadap pusat. */
  function sudutDari(cx, cy, x, y) {
    var d = Math.atan2(x - cx, -(y - cy)) * 180 / Math.PI;
    return d < 0 ? d + 360 : d;
  }

  /**
   * Geser batas irisan ke ke persen kumulatif `c` (sudah di-snap), dengan batas tidak
   * boleh melewati batas tetangganya. `persen` diubah di tempat; indeks `j` (1..n-1) adalah
   * batas antara irisan j-1 dan irisan j.
   */
  function geserBatas(persen, j, c) {
    var kum = [0];
    persen.forEach(function (p) { kum.push(kum[kum.length - 1] + p); });
    var lo = kum[j - 1], hi = kum[j + 1];
    c = Math.min(hi, Math.max(lo, c));
    persen[j - 1] = c - kum[j - 1];
    persen[j] = kum[j + 1] - c;
    return persen;
  }

  /** Jarak sudut melingkar (derajat) antara dua arah. */
  function jarakSudut(a, b) {
    var d = Math.abs(a - b) % 360;
    return d > 180 ? 360 - d : d;
  }

  /**
   * Persen kumulatif baru sebuah batas irisan dari arah pointer. Batas hanya boleh bergerak di
   * dalam busurnya [lo, hi] (persen kumulatif tetangganya). Bila arah pointer jatuh di dalam busur,
   * itulah posisinya; bila di luar, batas menempel ke ujung busur yang arahnya paling dekat.
   * Hasilnya tidak bergantung pada jalur pointer, jadi melewati jam 12 atau menyeberangi pusat
   * lingkaran tidak membuat batas melompat.
   */
  function batasDariSudut(sudut, lo, hi) {
    var loD = lo * 3.6, hiD = hi * 3.6, a = ((sudut % 360) + 360) % 360;
    var kandidat = a < loD - 1e-9 ? a + 360 : a;
    if (kandidat <= hiD + 1e-9) return Math.min(hi, Math.max(lo, Math.round(kandidat / 3.6)));
    return jarakSudut(a, loD) <= jarakSudut(a, hiD) ? lo : hi;
  }

  var logika = {
    snap: snap, kontrol: kontrol, periksa: periksa, umpan: umpan, salin: salin,
    awal: function (isian) { return salin(isian.awal); },
    kunci: function (isian) { return salin(isian.kunci); },
    titikLingkaran: titikLingkaran, sudutDari: sudutDari, geserBatas: geserBatas, batasDariSudut: batasDariSudut
  };

  // ================================================================ DOM

  function el(tag, kelas, teks) {
    var e = document.createElement(tag);
    if (kelas) e.className = kelas;
    if (teks != null) e.textContent = teks;
    return e;
  }

  function elNS(tag, atribut) {
    var e = document.createElementNS(NS, tag);
    Object.keys(atribut || {}).forEach(function (k) { e.setAttribute(k, atribut[k]); });
    return e;
  }

  function titikSvg(svg, e) {
    var pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    var m = svg.getScreenCTM();
    return m ? pt.matrixTransform(m.inverse()) : { x: 0, y: 0 };
  }

  /** Pegangan bulat berpanah; `warna` untuk garis tepi, `arah`: 'ns' | 'bebas'. */
  function pegangan(lapis, warna, arah, judul) {
    var g = elNS('g', { 'class': 'pegangan', tabindex: '-1' });
    g.appendChild(elNS('circle', { r: '13', fill: '#ffffff', stroke: warna, 'stroke-width': '3' }));
    var panah = arah === 'ns'
      ? 'M-4 -2.5 L0 -7 L4 -2.5 M-4 2.5 L0 7 L4 2.5'
      : 'M-7 0 L7 0 M0 -7 L0 7';
    g.appendChild(elNS('path', { d: panah, stroke: warna, 'stroke-width': '2.2', fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
    if (judul) { var t = elNS('title'); t.textContent = judul; g.appendChild(t); }
    lapis.appendChild(g);
    return g;
  }

  function pindah(g, x, y) { g.setAttribute('transform', 'translate(' + Math.round(x * 100) / 100 + ',' + Math.round(y * 100) / 100 + ')'); }

  function seret(g, lapis, saatPindah) {
    var aktif = false;
    g.addEventListener('pointerdown', function (e) {
      aktif = true; g.classList.add('aktif');
      try { g.setPointerCapture(e.pointerId); } catch (x) { /* abaikan */ }
      e.preventDefault();
    });
    g.addEventListener('pointermove', function (e) {
      if (!aktif) return;
      var p = titikSvg(lapis, e);
      saatPindah(p.x, p.y);
    });
    var selesai = function (e) {
      if (!aktif) return;
      aktif = false; g.classList.remove('aktif');
      try { g.releasePointerCapture(e.pointerId); } catch (x) { /* abaikan */ }
    };
    g.addEventListener('pointerup', selesai);
    g.addEventListener('pointercancel', selesai);
  }

  /** Kolom angka berlabel. */
  function kolomAngka(label, o, saatUbah) {
    var w = el('label', 'coba-angka');
    w.appendChild(el('span', null, label));
    var inp = el('input');
    inp.type = 'number';
    if (o.min != null) inp.min = o.min;
    if (o.maks != null) inp.max = o.maks;
    inp.step = o.langkah || 1;
    inp.addEventListener('change', function () { saatUbah(inp.value === '' ? null : Number(inp.value), inp); });
    var isi = el('span', 'coba-angka-isi');
    isi.appendChild(inp);
    if (o.satuan) isi.appendChild(el('em', null, o.satuan));
    w.appendChild(isi);
    w.input = inp;
    return w;
  }

  function setNilai(kolom, v) {
    kolom.input.value = v == null ? '' : String(Math.round(v * 1e6) / 1e6);
  }

  // ---------------------------------------------------------------- bar tumpuk

  function penyusunBar(c) {
    var is = c.isian, m = is.model, kT = kontrol(is, 'total'), kP = kontrol(is, 'persen');
    var st = salin(is.awal), n = m.kategori.length, geo = null;
    var hTot = [], hBagi = [], inTot = [], inPer = [];

    for (var k = 0; k < n; k++) {
      (function (k) {
        hTot[k] = pegangan(c.lapis, '#2f6df6', 'ns', 'Geser untuk mengatur total ' + m.kategori[k]);
        hBagi[k] = pegangan(c.lapis, '#f57a22', 'ns', 'Geser untuk mengatur pembagian persentase ' + m.kategori[k]);
        seret(hTot[k], c.lapis, function (x, y) {
          st.total[k] = snap((geo.yDasar - y) / geo.px, kT.langkah, kT.min, kT.maks);
          c.render();
        });
        seret(hBagi[k], c.lapis, function (x, y) {
          if (!(st.total[k] > 0)) return;
          st.persen[k] = snap(100 * (geo.yDasar - y) / (st.total[k] * geo.px), kP.langkah, kP.min, kP.maks);
          c.render();
        });
        inTot[k] = kolomAngka('Total ' + m.kategori[k], { min: kT.min, maks: kT.maks, langkah: kT.langkah, satuan: kT.satuan }, function (v) {
          if (v != null && isFinite(v)) st.total[k] = snap(v, kT.langkah, kT.min, kT.maks);
          c.render();
        });
        inPer[k] = kolomAngka('% ' + is.seri[0] + ', ' + m.kategori[k], { min: 0, maks: 100, langkah: kP.langkah, satuan: '%' }, function (v) {
          if (v != null && isFinite(v)) st.persen[k] = snap(v, kP.langkah, kP.min, kP.maks);
          c.render();
        });
        c.kontrol.appendChild(inTot[k]);
        c.kontrol.appendChild(inPer[k]);
      })(k);
    }
    c.petunjuk('Geser lingkaran biru di sisi kanan batang untuk mengatur total, dan lingkaran jingga di sisi kiri untuk mengatur pembagian persentase (' + is.seri[0] + ' di bawah, ' + is.seri[1] + ' di atas). Atau isi kolom di bawah.');

    return {
      ambil: function () { return st; },
      atur: function (s) { st = salin(s); },
      render: function () {
        var r = Gambar.svg({ jenis: 'bar-tumpuk', model: m, state: st });
        geo = r.geometri;
        c.pasangGambar(r);
        for (var k = 0; k < n; k++) {
          var cx = geo.x0 + geo.pita * k + geo.pita / 2, yTop = geo.yDasar - st.total[k] * geo.px;
          pindah(hTot[k], cx + geo.lebarBar / 2 + 4, yTop);
          pindah(hBagi[k], cx - geo.lebarBar / 2 - 4, yTop + (geo.yDasar - yTop) * (1 - st.persen[k] / 100));
          setNilai(inTot[k], st.total[k]);
          setNilai(inPer[k], st.persen[k]);
        }
      }
    };
  }

  // --------------------------------------------------------------------- garis

  function penyusunGaris(c) {
    var is = c.isian, m = is.model, kN = kontrol(is, 'titik');
    var st = salin(is.awal), n = m.kategori.length, geo = null;
    var hTitik = [], inNilai = [];

    for (var k = 0; k < n; k++) {
      (function (k) {
        hTitik[k] = pegangan(c.lapis, '#17a2a2', 'ns', 'Geser titik ' + m.kategori[k] + ' ke nilai yang benar');
        seret(hTitik[k], c.lapis, function (x, y) {
          if (y > geo.yDasar + 30) st.nilai[k] = null;                       // dikembalikan ke baki di bawah sumbu
          else st.nilai[k] = snap(geo.lo + (geo.yDasar - y) / geo.px, kN.langkah, kN.min, kN.maks);
          c.render();
        });
        inNilai[k] = kolomAngka(m.kategori[k], { min: kN.min, maks: kN.maks, langkah: kN.langkah, satuan: kN.satuan }, function (v) {
          st.nilai[k] = v != null && isFinite(v) ? snap(v, kN.langkah, kN.min, kN.maks) : null;
          c.render();
        });
        c.kontrol.appendChild(inNilai[k]);
      })(k);
    }
    c.petunjuk('Geser tiap titik di bawah sumbu ke nilai yang benar pada sumbu vertikal (menempel ke kelipatan ' + Fmt.angka(kN.langkah) + '). Titik yang ditarik kembali ke bawah sumbu menjadi belum diletakkan. Atau isi kolom di bawah.');

    return {
      ambil: function () { return st; },
      atur: function (s) { st = salin(s); },
      render: function () {
        var r = Gambar.svg({ jenis: 'garis', model: m, state: st });
        geo = r.geometri;
        c.pasangGambar(r);
        for (var k = 0; k < n; k++) {
          var cx = geo.x0 + geo.pita * k + geo.pita / 2;
          var cy = st.nilai[k] == null ? geo.yDasar + 56 : geo.yDasar - (st.nilai[k] - geo.lo) * geo.px;
          pindah(hTitik[k], cx, cy);
          setNilai(inNilai[k], st.nilai[k]);
        }
      }
    };
  }

  // ----------------------------------------------------------------------- pie

  function penyusunPie(c) {
    var is = c.isian, m = is.model, n = m.irisan.length;
    var st = salin(is.awal), geo = null, hBatas = [], inPersen = [], inSisa = null;

    for (var j = 1; j < n; j++) {
      (function (j) {
        hBatas[j] = pegangan(c.lapis, '#8a5cc2', 'bebas', 'Geser batas irisan ' + m.irisan[j - 1].nama + ' dan ' + m.irisan[j].nama);
        seret(hBatas[j], c.lapis, function (x, y) {
          var lo = 0, i;
          for (i = 0; i < j - 1; i++) lo += st.persen[i];
          var hi = lo + st.persen[j - 1] + st.persen[j];              // persen kumulatif batas tetangga
          geserBatas(st.persen, j, batasDariSudut(sudutDari(geo.cx, geo.cy, x, y), lo, hi));
          c.render();
        });
      })(j);
    }
    for (var i = 0; i < n; i++) {
      (function (i) {
        var kolom = kolomAngka('% ' + m.irisan[i].nama, { min: 0, maks: 100, langkah: 1, satuan: '%' }, function (v) {
          if (i < n - 1 && v != null && isFinite(v)) {
            var lain = 0;
            st.persen.forEach(function (p, q) { if (q !== i && q < n - 1) lain += p; });
            st.persen[i] = Math.min(Math.max(0, Math.round(v)), 100 - lain);
            var jml = 0;
            for (var q = 0; q < n - 1; q++) jml += st.persen[q];
            st.persen[n - 1] = 100 - jml;
          }
          c.render();
        });
        if (i === n - 1) { kolom.input.readOnly = true; kolom.title = 'Irisan terakhir otomatis: sisa dari 100%'; inSisa = kolom; }
        inPersen[i] = kolom;
        c.kontrol.appendChild(kolom);
      })(i);
    }
    c.petunjuk('Geser lingkaran ungu pada batas antar-irisan (menempel ke 1%), atau isi persentase di bawah. Irisan terakhir otomatis menjadi sisa dari 100%.');

    return {
      ambil: function () { return st; },
      atur: function (s) { st = salin(s); },
      render: function () {
        var r = Gambar.svg({ jenis: 'pie', model: m, state: st });
        geo = r.geometri;
        c.pasangGambar(r);
        var kum = 0;
        for (var j = 1; j < n; j++) {
          kum += st.persen[j - 1];
          var p = titikLingkaran(geo.cx, geo.cy, geo.r, kum * 3.6);
          pindah(hBatas[j], p[0], p[1]);
        }
        for (var i = 0; i < n; i++) setNilai(inPersen[i], st.persen[i]);
      }
    };
  }

  // --------------------------------------------------------------------- tabel

  function penyusunTabel(c) {
    var is = c.isian, n = is.tab.length, aktif = 0;
    var st = salin(is.awal);
    var tombolTab = [], pilihan = [];
    var daftarTab = el('div', 'coba-tab');
    c.atas.appendChild(daftarTab);
    is.tab.forEach(function (nama, k) {
      var b = el('button', 'coba-tab-btn', nama);
      b.type = 'button';
      b.addEventListener('click', function () { aktif = k; c.render(); });
      daftarTab.appendChild(b);
      tombolTab.push(b);
    });
    var kotakPilihan = el('div', 'coba-pilihan');
    c.kontrol.appendChild(kotakPilihan);
    is.pilihan.forEach(function (teks, q) {
      var lab = el('label', 'coba-radio');
      var r = el('input'); r.type = 'radio'; r.name = 'pilihan-' + c.uid;
      r.addEventListener('change', function () { st[aktif] = q; c.render(); });
      lab.appendChild(r); lab.appendChild(el('span', null, String.fromCharCode(65 + q) + '. ' + teks));
      kotakPilihan.appendChild(lab);
      pilihan.push(r);
    });
    c.petunjuk('Pilih satu tab nama, baca tabelnya, lalu pilih jawaban untuk tab itu. Ulangi untuk semua tab.');

    return {
      ambil: function () { return st; },
      atur: function (s) { st = salin(s); },
      render: function () {
        var model = Object.assign({}, is.tabel[aktif]);
        if (st[aktif] != null) model.status = is.pilihan[st[aktif]];
        var r = Gambar.svg({ jenis: 'tabel', model: model });
        c.pasangGambar(r);
        tombolTab.forEach(function (b, k) {
          b.classList.toggle('aktif', k === aktif);
          b.classList.toggle('terjawab', st[k] != null);
        });
        pilihan.forEach(function (r2, q) { r2.checked = st[aktif] === q; });
      }
    };
  }

  // ----------------------------------------------------------------------- pasang

  var cacahan = 0;

  /**
   * @param {Element} wadah elemen tempat widget dipasang (isinya diganti)
   * @param {object} butir butir `jenis: 'isian'`
   * @param {object} [opsi] { saatPeriksa(hasil) }
   * @returns {{periksa:function, kunci:function, ulang:function, ambil:function, atur:function}}
   */
  function pasang(wadah, butir, opsi) {
    opsi = opsi || {};
    var is = butir.isian;
    wadah.innerHTML = '';
    var kerangka = el('div', 'coba');
    var atas = el('div', 'coba-atas');
    var kanvas = el('div', 'coba-kanvas');
    var gambar = el('div', 'coba-gambar');
    var lapis = elNS('svg', { 'class': 'coba-lapis' });
    var bantu = el('p', 'coba-petunjuk');
    var kontrolEl = el('div', 'coba-kontrol');
    var aksi = el('div', 'coba-aksi');
    var kabar = el('p', 'coba-umpan');
    kabar.setAttribute('aria-live', 'polite');
    kanvas.appendChild(gambar); kanvas.appendChild(lapis);
    [atas, kanvas, bantu, kontrolEl, aksi, kabar].forEach(function (e) { kerangka.appendChild(e); });
    wadah.appendChild(kerangka);

    var c = {
      isian: is, uid: ++cacahan, lapis: lapis, atas: atas, kontrol: kontrolEl,
      petunjuk: function (t) { bantu.textContent = t; },
      pasangGambar: function (r) {
        gambar.innerHTML = r.svg;
        lapis.setAttribute('viewBox', '0 0 ' + r.lebar + ' ' + r.tinggi);
        kanvas.style.maxWidth = r.lebar + 'px';
      },
      render: function () { w.render(); }
    };
    var penyusun = { 'bar-tumpuk': penyusunBar, garis: penyusunGaris, pie: penyusunPie, tabel: penyusunTabel }[is.jenis];
    if (!penyusun) throw new Error('jenis isian tidak dikenal: ' + is.jenis);
    var w = penyusun(c);
    if (is.jenis === 'tabel') lapis.style.display = 'none';

    function tombol(teks, kelas, aksiFn) {
      var b = el('button', kelas, teks);
      b.type = 'button';
      b.addEventListener('click', aksiFn);
      aksi.appendChild(b);
      return b;
    }
    function tampil(ok, teks) {
      kabar.className = 'coba-umpan' + (ok == null ? '' : (ok ? ' ok' : ' bad'));
      kabar.textContent = teks;
    }

    var kendali = {
      periksa: function () {
        var h = periksa(is, w.ambil());
        var u = umpan(h);
        tampil(u.ok, u.teks);
        if (opsi.saatPeriksa) opsi.saatPeriksa(h);
        return h;
      },
      kunci: function () {
        w.atur(is.kunci); w.render();
        tampil(null, 'Kunci ditampilkan. ' + (butir.kunciTeks || ''));
      },
      ulang: function () { w.atur(is.awal); w.render(); tampil(null, ''); },
      ambil: function () { return salin(w.ambil()); },
      atur: function (s) { w.atur(s); w.render(); }
    };
    tombol('Periksa jawaban', 'primary', kendali.periksa);
    tombol('Lihat kunci', 'ghost', kendali.kunci);
    tombol('Ulang dari awal', 'ghost', kendali.ulang);
    w.render();
    wadah.kendaliCoba = kendali;                  // dibuka agar uji peramban dapat membaca keadaan widget
    return kendali;
  }

  return { pasang: pasang, logika: logika, TOLERANSI: TOLERANSI };
});
