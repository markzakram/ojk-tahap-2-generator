/*
 * bank.js — daftar seluruh keluarga soal dan cara memanggil penyusunnya.
 *
 * Satu tempat yang tahu: subtes apa memuat submateri apa, keluarga soal apa saja
 * ada di tiap submateri, dan fungsi mana yang menyusunnya. Perakit paket cukup
 * meminta `buat(subtes, submateri, indeksKeluarga, level, benih, opsi)`.
 *
 * Kunci komposisi (jumlah butir per submateri dalam satu paket):
 *
 *   Kemampuan Umum    verbal, cerita, tabel, grafik, serial, matriks
 *   Penalaran Numerik bar, tabel, garis, pie
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./verbal.js'), require('./cerita.js'), require('./tabelku.js'), require('./grafikku.js'),
      require('./pn-bar.js'), require('./pn-tabel.js'), require('./pn-garis.js'), require('./pn-pie.js'),
      require('./variasi.js'), require('./kerangka.js'), require('./riset-figural.js'), require('./pn-peringkat.js'));
    module.exports = api;
  } else {
    api = factory(root.Verbal, root.Cerita, root.TabelKu, root.GrafikKu,
      root.PnBar, root.PnTabel, root.PnGaris, root.PnPie, root.Variasi, root.Kerangka, root.RisetFigural, root.PnPeringkat);
    root.Bank = api;
  }
})(typeof self !== 'undefined' ? self : this, function (Verbal, Cerita, TabelKu, GrafikKu,
  PnBar, PnTabel, PnGaris, PnPie, Variasi, Kerangka, RisetFigural, PnPeringkat) {
  'use strict';

  function dari(mod, kel) {
    // Menggabungkan laba beberapa produk/garansi atau dua kondisi produksi membutuhkan
    // beberapa langkah. Keluarga ini tidak diberi label mudah hanya karena angkanya kecil.
    var tingkat = ['laba-persen', 'tak-diketahui', 'garis-majemuk'].indexOf(kel.id) >= 0 ? ['sedang', 'sulit'] : ['mudah', 'sedang', 'sulit'];
    if (kel.tingkat) tingkat = kel.tingkat.slice();
    return { id: kel.id, nama: kel.nama, topik: kel.topik || '', tingkat: tingkat, buat: function (level, benih, opsi) { return mod.buat(kel.id, level, benih, opsi); } };
  }

  var SUBTES = {
    ku: {
      kode: 'ku', nama: 'Kemampuan Umum', soal: 12, menit: 10,
      komposisiBaku: { verbal: 3, cerita: 2, tabel: 2, grafik: 1, serial: 2, matriks: 2 }
    },
    pn: {
      kode: 'pn', nama: 'Penalaran Numerik', soal: 10, menit: 18,
      komposisiBaku: { bar: 2, tabel: 2, garis: 2, pie: 2, peringkat: 2 }
    }
  };

  /** submateri komposisi -> { subtes, nama, label, urutan, keluarga:[...] } */
  var SUBMATERI = {
    verbal: { subtes: 'ku', submateri: 'verbal', nama: 'Verbal (Verbal Reasoning)', label: 'Verbal', keluarga: Verbal.KELUARGA.map(function (k) { return dari(Verbal, k); }) },
    cerita: { subtes: 'ku', submateri: 'cerita', nama: 'Numerik - Soal Cerita', label: 'Numerik: Soal Cerita', keluarga: Cerita.KELUARGA.map(function (k) { return dari(Cerita, k); }) },
    tabel: { subtes: 'ku', submateri: 'tabel', nama: 'Numerik - Tabel', label: 'Numerik: Tabel', keluarga: TabelKu.KELUARGA.map(function (k) { return dari(TabelKu, k); }) },
    grafik: { subtes: 'ku', submateri: 'grafik', nama: 'Numerik - Grafik Batang', label: 'Numerik: Grafik Batang', keluarga: GrafikKu.KELUARGA.map(function (k) { return dari(GrafikKu, k); }) },
    serial: { subtes: 'ku', submateri: 'figural', nama: 'Figural - Serial', label: 'Figural: Serial', keluarga: [] },
    matriks: { subtes: 'ku', submateri: 'figural', nama: 'Figural - Matriks', label: 'Figural: Matriks', keluarga: [] },
    bar: { subtes: 'pn', submateri: 'bar', nama: 'Bar Chart', label: 'Bar Chart', keluarga: PnBar.KELUARGA.map(function (k) { return dari(PnBar, k); }) },
    'tabel-pn': { subtes: 'pn', submateri: 'tabel', nama: 'Table', label: 'Table', keluarga: PnTabel.KELUARGA.map(function (k) { return dari(PnTabel, k); }) },
    garis: { subtes: 'pn', submateri: 'garis', nama: 'Line Graph', label: 'Line Graph', keluarga: PnGaris.KELUARGA.map(function (k) { return dari(PnGaris, k); }) },
    pie: { subtes: 'pn', submateri: 'pie', nama: 'Pie Chart', label: 'Pie Chart', keluarga: PnPie.KELUARGA.map(function (k) { return dari(PnPie, k); }) },
    peringkat: { subtes: 'pn', submateri: 'peringkat', nama: 'Badges', label: 'Badges', keluarga: PnPeringkat.KELUARGA.map(function(k) { return dari(PnPeringkat, k); }) }
  };

  /** Kunci komposisi pada opsi -> kunci SUBMATERI (tabel Kemampuan Umum dan tabel interaktif berbeda). */
  function kunciSubmateri(subtes, kunci) {
    if (subtes === 'pn' && kunci === 'tabel') return 'tabel-pn';
    return kunci;
  }

  // Enam bentuk saja. Variasi dipilih di dalam bentuk, sehingga menambah pola
  // tidak mengubah bobot The Next Box/Double Box atau empat ukuran matriks.
  ['serial', 'matriks'].forEach(function (kolam) {
    SUBMATERI[kolam].keluarga = RisetFigural.KELUARGA.filter(function (k) { return k.kolam === kolam; })
      .map(function (k) { return dari(RisetFigural, k); });
  });

  Variasi.KELUARGA.forEach(function (kel) {
    SUBMATERI[kunciSubmateri(kel.subtes, kel.submateri)].keluarga.push(dari(Variasi, kel));
  });

  // keluarga di luar Kerangka Course (atau yang memakai konversi kurs) tidak ikut diundi
  Object.keys(SUBMATERI).forEach(function (k) {
    SUBMATERI[k].keluarga = SUBMATERI[k].keluarga.filter(function (kel) { return Kerangka.NONAKTIF.indexOf(kel.id) < 0; });
  });

  /** Urutan tampil submateri dalam satu subtes. */
  var URUTAN = {
    ku: ['verbal', 'cerita', 'tabel', 'grafik', 'serial', 'matriks'],
    pn: ['bar', 'tabel', 'peringkat', 'garis', 'pie']
  };

  function ambil(subtes, kunci) {
    var s = SUBMATERI[kunciSubmateri(subtes, kunci)];
    if (!s) throw new Error('submateri tidak dikenal: ' + subtes + '/' + kunci);
    return s;
  }

  /** Jumlah keluarga soal pada sebuah submateri (untuk perputaran keluarga). */
  function jumlahKeluarga(subtes, kunci) { return ambil(subtes, kunci).keluarga.length; }

  function tingkatBoleh(subtes, kunci, indeks, level) {
    return ambil(subtes, kunci).keluarga[indeks].tingkat.indexOf(level) >= 0;
  }

  /**
   * Susun satu butir.
   * @returns {object|null} butir (belum bernomor), atau null bila keluarga itu gagal untuk benih ini
   */
  function buat(subtes, kunci, indeksKeluarga, level, benih, opsi) {
    var s = ambil(subtes, kunci), kel = s.keluarga[indeksKeluarga % s.keluarga.length];
    if (kel.tingkat.indexOf(level) < 0) return null;
    var b = kel.buat(level, benih, opsi);
    if (!b) return null;
    b.submateriKomposisi = kunci;
    b.submateriNama = s.nama;
    b.submateriLabel = s.label;
    b.keluargaNama = kel.nama;
    b.klasifikasi = Kerangka.klasifikasi(b);
    return b;
  }

  /** Ringkasan untuk antarmuka dan README: subtes, submateri, keluarga. */
  function katalog() {
    var out = [];
    Object.keys(URUTAN).forEach(function (st) {
      URUTAN[st].forEach(function (k) {
        var s = ambil(st, k);
        out.push({ subtes: st, kunci: k, nama: s.nama, label: s.label, keluarga: s.keluarga.map(function (x) { return { id: x.id, nama: x.nama }; }) });
      });
    });
    return out;
  }

  /** Chapter utuh dan setiap Subchapter, dengan daftar keluarga yang benar-benar sesuai. */
  function katalogMateri() {
    var chapters = [];
    Object.keys(URUTAN).forEach(function (st) {
      URUTAN[st].forEach(function (kunci) {
        var s = ambil(st, kunci);
        s.keluarga.forEach(function (kel, indeks) {
          var k = Kerangka.dariKeluarga(st, s.submateri, kel.id);
          var c = chapters.find(function (x) { return x.subtes === st && x.chapter === k.chapter; });
          if (!c) {
            var khusus = s.submateri === 'figural' || st === 'pn' && (kunci === 'tabel' || kunci === 'pie');
            c = { id: st + '-' + (khusus ? kel.id : kunci), subtes: st, kunci: kunci,
              category: k.category, lesson: k.lesson, chapter: k.chapter, subchapter: null, keluarga: [], anak: [] };
            chapters.push(c);
          }
          c.keluarga.push(indeks);
          if (k.subchapter !== null) {
            var anak = c.anak.find(function (x) { return x.subchapter === k.subchapter; });
            if (!anak) {
              anak = { id: c.id + '/' + k.subchapter.toLowerCase().replace(/[^a-z0-9]+/g, '-'), subtes: st, kunci: kunci,
                category: k.category, lesson: k.lesson, chapter: k.chapter, subchapter: k.subchapter, keluarga: [] };
              c.anak.push(anak);
            }
            anak.keluarga.push(indeks);
          }
        });
      });
    });
    var out = [];
    chapters.forEach(function (c) {
      c.anak.sort(function (a,b) { return Kerangka.BAB[c.chapter].indexOf(a.subchapter) - Kerangka.BAB[c.chapter].indexOf(b.subchapter); });
      var anak = c.anak; delete c.anak;
      c.subchapterIds = anak.map(function (x) { return x.id; });
      out.push(c); anak.forEach(function (x) { out.push(x); });
    });
    out.forEach(function (x) {
      x.tingkat = ['mudah', 'sedang', 'sulit'].filter(function (lv) {
        return x.keluarga.some(function (i) { return tingkatBoleh(x.subtes, x.kunci, i, lv); });
      });
    });
    return out;
  }

  return { SUBTES: SUBTES, URUTAN: URUTAN, buat: buat, jumlahKeluarga: jumlahKeluarga, tingkatBoleh: tingkatBoleh, katalog: katalog, katalogMateri: katalogMateri, ambil: ambil };
});
