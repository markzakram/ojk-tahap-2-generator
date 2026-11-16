/*
 * paket.js — perakit paket: komposisi, tingkat kesulitan, kunci merata, anti-kembar.
 *
 * Satu paket = subtes yang dipilih, masing-masing berisi butir menurut komposisi
 * submateri. Untuk tiap butir:
 *
 *   1. tingkat kesulitan ditetapkan lebih dulu (kuota per subtes, diacak),
 *   2. keluarga soal diacak tanpa pengulangan di dalam submateri supaya tidak ada dua butir
 *      sekeluarga pada satu paket selama keluarganya masih cukup,
 *   3. posisi kunci A-E ditetapkan lebih dulu (tiap huruf hampir sama banyak per
 *      paket); penyusun diminta memenuhinya dan, bila belum, diulang dengan
 *      benih lain beberapa kali,
 *   4. setiap calon butir lewat VALIDATOR (hitung ulang dari nol) dan PENJAGA
 *      KEMBAR (tidak sama atau nyaris sama dengan butir mana pun yang sudah
 *      masuk, baik di paket ini maupun paket sebelumnya pada kali generate
 *      yang sama).
 *
 * Seluruh benih diturunkan dari benih utama, nomor paket, subtes, nomor butir,
 * dan nomor percobaan, jadi hasilnya dapat diulang persis dan paket nomor N
 * tidak bergantung pada banyaknya paket yang diminta (paket 1..N-1 yang sama
 * selalu dibuat lebih dulu).
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./rng.js'), require('./bank.js'), require('./validator.js'), require('./format.js'));
    module.exports = api;
  } else {
    api = factory(root.Rng, root.Bank, root.Validator, root.Fmt);
    root.Paket = api;
  }
})(typeof self !== 'undefined' ? self : this, function (Rng, Bank, Validator, Fmt) {
  'use strict';

  var VERSI = 23;
  var MAKS_PAKET = 500;
  var LEVEL = ['mudah', 'sedang', 'sulit'];
  var PROPORSI_BAKU = { mudah: 3, sedang: 5, sulit: 2 };

  // ---------------------------------------------------------------- opsi

  function salinKomposisi(k) { var o = {}; Object.keys(k).forEach(function (x) { o[x] = k[x]; }); return o; }

  /**
   * Lengkapi dan periksa opsi. Melempar galat berpesan jelas untuk opsi yang tak sah.
   *
   *   benih, jumlahPaket, subtes (['ku','pn']), tingkat ('campur' atau satu tingkat),
   *   proporsi {mudah, sedang, sulit}, komposisi { ku: {...}, pn: {...} }
   */
  function normalisasi(opsi) {
    opsi = opsi || {};
    var o = {};
    o.benih = opsi.benih == null ? 2026 : Number(opsi.benih);
    if (!isFinite(o.benih) || o.benih % 1 !== 0 || o.benih < 0 || o.benih > 4294967295) throw new Error('benih harus bilangan bulat 0 sampai 4294967295');
    o.jumlahPaket = opsi.jumlahPaket == null ? 1 : Number(opsi.jumlahPaket);
    if (!isFinite(o.jumlahPaket) || o.jumlahPaket % 1 !== 0 || o.jumlahPaket < 1 || o.jumlahPaket > MAKS_PAKET) throw new Error('jumlah paket harus bilangan bulat 1 sampai ' + MAKS_PAKET);
    var subtes = opsi.subtes == null ? ['ku', 'pn'] : opsi.subtes;
    if (typeof subtes === 'string') subtes = subtes === 'semua' ? ['ku', 'pn'] : subtes.split(/[,+]/);
    subtes = subtes.map(function (s) { return String(s).trim().toLowerCase(); }).filter(Boolean);
    subtes.forEach(function (s) { if (s !== 'ku' && s !== 'pn') throw new Error('subtes tidak dikenal: "' + s + '" (pilih ku, pn, atau semua)'); });
    o.subtes = ['ku', 'pn'].filter(function (s) { return subtes.indexOf(s) >= 0; });
    if (!o.subtes.length) throw new Error('pilih sedikitnya satu subtes');
    o.tingkat = String(opsi.tingkat || 'campur').toLowerCase();
    if (o.tingkat !== 'campur' && LEVEL.indexOf(o.tingkat) < 0) throw new Error('tingkat harus campur, mudah, sedang, atau sulit');
    o.proporsi = {};
    LEVEL.forEach(function (l) {
      var p = opsi.proporsi && opsi.proporsi[l] != null ? Number(opsi.proporsi[l]) : PROPORSI_BAKU[l];
      if (!isFinite(p) || p < 0) throw new Error('proporsi tingkat ' + l + ' tidak sah');
      o.proporsi[l] = p;
    });
    if (o.proporsi.mudah + o.proporsi.sedang + o.proporsi.sulit <= 0) throw new Error('proporsi tingkat tidak boleh nol semua');
    o.mode = opsi.mode || (opsi.materi != null ? 'materi' : 'tryout');
    if (o.mode !== 'tryout' && o.mode !== 'materi') throw new Error('mode harus tryout atau materi');
    if (o.mode === 'tryout' && opsi.materi != null) throw new Error('pilihan Chapter/Subchapter hanya berlaku pada mode materi');
    o.materi = [];
    o.komposisi = {};
    ['ku', 'pn'].forEach(function (st) {
      var baku = Bank.SUBTES[st].komposisiBaku, k = {};
      Bank.URUTAN[st].forEach(function (kunci) {
        var v = o.mode === 'materi' ? 0 : opsi.komposisi && opsi.komposisi[st] && opsi.komposisi[st][kunci] != null ? Number(opsi.komposisi[st][kunci]) : baku[kunci];
        // Komposisi kustom versi lama tidak otomatis mendapat dua soal tambahan.
        if (kunci === 'peringkat' && opsi.komposisi && opsi.komposisi[st] && Object.keys(opsi.komposisi[st]).length && opsi.komposisi[st][kunci] == null) v = 0;
        if (!isFinite(v) || v % 1 !== 0 || v < 0 || v > 60) throw new Error('jumlah butir ' + st + '/' + kunci + ' tidak sah: ' + v);
        k[kunci] = v;
      });
      o.komposisi[st] = k;
    });
    if (o.mode === 'materi') {
      var katalog = Bank.katalogMateri();
      if (!Array.isArray(opsi.materi) || !opsi.materi.length) throw new Error('pilih sedikitnya satu Chapter/Subchapter dan jumlah soalnya');
      opsi.materi.forEach(function (pilih) {
        var m = pilih && katalog.find(function (x) { return x.id === pilih.id; });
        if (!m) throw new Error('materi tidak dikenal: ' + (pilih && pilih.id));
        var n = Number(pilih.jumlah);
        if (!isFinite(n) || n % 1 !== 0 || n < 1 || n > 60) throw new Error('jumlah soal ' + m.chapter + ' harus bilangan bulat 1 sampai 60');
        if (o.materi.some(function (x) { return x.chapter === m.chapter && (x.subchapter === null || m.subchapter === null || x.subchapter === m.subchapter); })) {
          throw new Error('pilihan tumpang tindih pada ' + m.chapter + ': pilih seluruh Chapter atau Subchapter tertentu');
        }
        if (o.tingkat !== 'campur' && m.tingkat.indexOf(o.tingkat) < 0 || o.tingkat === 'campur' && !m.tingkat.some(function (l) { return o.proporsi[l] > 0; })) {
          throw new Error(m.chapter + (m.subchapter ? ' / ' + m.subchapter : '') + ' tersedia pada tingkat ' + m.tingkat.join(', ') + '; sesuaikan tingkat atau proporsinya');
        }
        o.materi.push(Object.assign({}, m, { jumlah: n }));
        o.komposisi[m.subtes][m.kunci] += n;
      });
      // Urutan katalog tetap sama walaupun pengguna menambahkan pilihan dalam urutan berbeda.
      o.materi.sort(function (a,b) { return katalog.findIndex(function (x) { return x.id === a.id; }) - katalog.findIndex(function (x) { return x.id === b.id; }); });
      o.subtes = ['ku','pn'].filter(function (st) { return o.materi.some(function (m) { return m.subtes === st; }); });
    }
    o.subtes.forEach(function (st) {
      var jml = Bank.URUTAN[st].reduce(function (s, k) { return s + o.komposisi[st][k]; }, 0);
      if (jml < 1) throw new Error('subtes ' + st + ' tidak memiliki butir: isi komposisinya');
    });
    o.cobaMaks = opsi.cobaMaks == null ? 80 : Number(opsi.cobaMaks);
    return o;
  }

  // ------------------------------------------------------------- pembantu

  /** Bagi n butir ke tiga tingkat menurut bobot (sisa terbesar), lalu acak urutannya. */
  function bagiTingkat(a, n, o) {
    if (o.tingkat !== 'campur') return Array.apply(null, { length: n }).map(function () { return o.tingkat; });
    var bobot = LEVEL.map(function (l) { return o.proporsi[l]; }), jml = bobot[0] + bobot[1] + bobot[2];
    var jatah = bobot.map(function (b) { return b / jml * n; }), dasar = jatah.map(Math.floor);
    var sisa = n - dasar.reduce(function (s, x) { return s + x; }, 0);
    jatah.map(function (x, i) { return { i: i, f: x - Math.floor(x) }; }).sort(function (x, y) { return y.f - x.f || x.i - y.i; })
      .slice(0, sisa).forEach(function (x) { dasar[x.i]++; });
    var daftar = [];
    LEVEL.forEach(function (l, i) { for (var k = 0; k < dasar[i]; k++) daftar.push(l); });
    return a.kocok(daftar);
  }

  /** Posisi kunci A-E untuk n butir: tiap huruf hampir sama banyak, jarang tiga yang sama berturut-turut. */
  function rencanaKunci(a, n) {
    var daftar = [], geser = a.bulat(0, 4);
    for (var i = 0; i < n; i++) daftar.push((i + geser) % 5);
    var kocok = a.kocok(daftar);
    for (var pass = 0; pass < 6; pass++) {
      for (var j = 2; j < kocok.length; j++) {
        if (kocok[j] === kocok[j - 1] && kocok[j] === kocok[j - 2]) {
          var t = (j + 1) % kocok.length;
          var s = kocok[j]; kocok[j] = kocok[t]; kocok[t] = s;
        }
      }
    }
    return kocok;
  }

  /** Pilih keluarga tanpa pengulangan per siklus. Entri berbobot (matriks 3x3)
   * tetap ikut undian, tetapi semua entri dengan id yang sama dikeluarkan setelah terpilih.
   * Dengan demikian pasangan keluarga tidak selalu bertetangga dalam katalog.
   */
  function rencanaKeluarga(a, subtes, kunci, jumlah) {
    var keluarga = Bank.ambil(subtes, kunci).keluarga, semua = keluarga.map(function (_, i) { return i; });
    // Dua soal matriks pada komposisi baku: satu 3x3/2x2 bersekat, satu 5x5/5x6.
    if (subtes === 'ku' && kunci === 'matriks' && jumlah === 2) {
      return [['matriks-3','matriks-sekat'],['matriks-latin','matriks-isi']].map(function(ids) {
        return a.pilih(semua.filter(function(i) { return ids.indexOf(keluarga[i].id) >= 0; }));
      });
    }
    var sisa = [], hasil = [], terakhir = null;
    for (var i = 0; i < jumlah; i++) {
      if (!sisa.length) sisa = semua.slice();
      var pilihan = sisa.filter(function (idx) { return keluarga[idx].id !== terakhir; });
      if (!pilihan.length) pilihan = sisa;
      var idx = a.pilih(pilihan);
      hasil.push(idx); terakhir = keluarga[idx].id;
      sisa = sisa.filter(function (j) { return keluarga[j].id !== terakhir; });
    }
    return hasil;
  }

  /** Kuota tiap pilihan dipenuhi langsung dari keluarga yang sesuai, tanpa mengambil Chapter lain. */
  function rencanaMateri(a, st, o) {
    var slot = [], level = [], terpakai = {};
    o.materi.filter(function (m) { return m.subtes === st; }).forEach(function (m) {
      var proporsi = {};
      LEVEL.forEach(function (lv) { proporsi[lv] = m.tingkat.indexOf(lv) >= 0 ? o.proporsi[lv] : 0; });
      var levels = bagiTingkat(a, m.jumlah, { tingkat: o.tingkat, proporsi: proporsi });
      levels.forEach(function (lv) {
        var calon = m.keluarga.filter(function (i) { return Bank.tingkatBoleh(st, m.kunci, i, lv); });
        var hitung = function (i) { return terpakai[m.kunci + ':' + i] || 0; };
        var min = Math.min.apply(null, calon.map(hitung));
        var keluarga = a.pilih(calon.filter(function (i) { return hitung(i) === min; }));
        terpakai[m.kunci + ':' + keluarga] = hitung(keluarga) + 1;
        slot.push({ kunci: m.kunci, keluarga: keluarga, materi: m }); level.push(lv);
      });
    });
    return { slot: slot, level: level };
  }

  /** Selaraskan isi dengan tingkat tanpa mengubah kuota mudah/sedang/sulit pengguna. */
  function selaraskanTingkat(slot, level, st) {
    var wajibGanda = -1;
    var serial = slot.map(function (s, i) { return s.kunci === 'serial' ? i : -1; }).filter(function (i) { return i >= 0; });
    var donor = level.findIndex(function (l) { return l !== 'mudah'; });
    if (st === 'ku' && serial.length && donor >= 0) {
      var keluargaSerial = Bank.ambil(st, 'serial').keluarga;
      wajibGanda = serial.find(function (i) { return keluargaSerial[slot[i].keluarga].id === 'serial-ganda'; });
      // Dua atau lebih soal serial pada paket campuran selalu mencakup kotak ganda.
      if (wajibGanda == null && serial.length >= 2) {
        wajibGanda = serial[serial.length - 1];
        slot[wajibGanda].keluarga = keluargaSerial.findIndex(function (k) { return k.id === 'serial-ganda'; });
      }
      if (wajibGanda == null) wajibGanda = -1;
      if (wajibGanda >= 0 && level[wajibGanda] === 'mudah') {
        level[wajibGanda] = level[donor]; level[donor] = 'mudah';
      }
    }
    slot.forEach(function (sl, i) {
      if (Bank.tingkatBoleh(st, sl.kunci, sl.keluarga, level[i])) return;
      var tukar = slot.findIndex(function (s, j) {
        return j !== wajibGanda && j !== i && Bank.tingkatBoleh(st, sl.kunci, sl.keluarga, level[j]) &&
          Bank.tingkatBoleh(st, s.kunci, s.keluarga, level[i]);
      });
      if (tukar >= 0) { var tmp = level[i]; level[i] = level[tukar]; level[tukar] = tmp; return; }
      // Misalnya pengguna memilih semua mudah: pilih keluarga lain yang sesuai,
      // dahulukan keluarga yang paling sedikit terwakili di submateri itu.
      var keluarga = Bank.ambil(st, sl.kunci).keluarga;
      var calon = keluarga.map(function (_, j) { return j; }).filter(function (j) { return Bank.tingkatBoleh(st, sl.kunci, j, level[i]); });
      var jumlah = function (j) { return slot.filter(function (s) { return s.kunci === sl.kunci && s.keluarga === j; }).length; };
      calon.sort(function (x, y) { return jumlah(x) - jumlah(y) || x - y; });
      sl.keluarga = calon[0];
    });
  }

  // -------------------------------------------------------------- penjaga

  function buatPenjaga() {
    return { kelompok: {}, jumlah: 0 };
  }

  /** Apakah sidik ini kembar/nyaris sama dengan yang sudah masuk? */
  function cekKembar(penjaga, sd) {
    var daftar = penjaga.kelompok[sd.kunci] || [];
    for (var i = 0; i < daftar.length; i++) {
      var r = Validator.mirip(daftar[i], sd);
      if (r) return r;
    }
    return null;
  }

  function catat(penjaga, sd) {
    (penjaga.kelompok[sd.kunci] = penjaga.kelompok[sd.kunci] || []).push(sd);
    penjaga.jumlah++;
  }

  // ------------------------------------------------------------- pembangun

  function nomor(n, lebar) { var s = String(n); while (s.length < lebar) s = '0' + s; return s; }

  /**
   * Pembangun paket satu per satu. Dipakai antarmuka (agar bisa memberi jeda dan
   * kemajuan) maupun CLI.
   */
  function mulai(opsiMentah) {
    var o = normalisasi(opsiMentah);
    var penjaga = buatPenjaga();
    var paket = [];
    var statistik = { percobaan: 0, ditolakValidator: 0, ditolakKembar: 0, ditolakKosong: 0, kunciMeleset: 0, polaUlang: 0, butir: 0 };
    var sudah = 0;

    function buatSatu(no) {
      var p = { no: no, id: 'P' + nomor(no, 3), benih: Rng.turunan(o.benih, no), mode: o.mode, subtes: [] };
      o.subtes.forEach(function (st) {
        var info = Bank.SUBTES[st], komp = o.komposisi[st], a = Rng.alat(Rng.turunan(o.benih, no, st, 'rencana'));
        var slot = [];
        var level;
        if (o.mode === 'materi') {
          var rencana = rencanaMateri(a, st, o); slot = rencana.slot; level = rencana.level;
        } else {
          Bank.URUTAN[st].forEach(function (kunci) {
            var c = komp[kunci] || 0;
            rencanaKeluarga(a, st, kunci, c).forEach(function (fam) { slot.push({ kunci: kunci, keluarga: fam }); });
          });
          level = bagiTingkat(a, slot.length, o);
        }
        var kunciRencana = rencanaKunci(a, slot.length);
        if (o.mode !== 'materi') selaraskanTingkat(slot, level, st);
        // butir verbal hanya punya tiga pilihan: letak D/E yang jatuh padanya ditukar dengan butir lain
        slot.forEach(function (sl, i) {
          if (sl.kunci !== 'verbal' || kunciRencana[i] < 3) return;
          for (var j = 0; j < slot.length; j++) {
            if (slot[j].kunci !== 'verbal' && kunciRencana[j] < 3 && st === 'ku') { var tmp = kunciRencana[i]; kunciRencana[i] = kunciRencana[j]; kunciRencana[j] = tmp; break; }
          }
        });
        var butir = [], pakaiKel = {}, pakaiPola = {};
        slot.forEach(function (sl, idx) {
          var target = kunciRencana[idx], lv = level[idx], diterima = null, terbaik = null;
          var polaDipakai = pakaiPola[sl.kunci] = pakaiPola[sl.kunci] || [];
          for (var coba = 0; coba < o.cobaMaks && !diterima; coba++) {
            statistik.percobaan++;
            var seed = Rng.turunan(o.benih, no, st, idx, coba);
            var fam = sl.keluarga;
            var b = null;
            try { b = Bank.buat(st, sl.kunci, fam, lv, seed, { target: target, polaDipakai: polaDipakai.slice() }); } catch (e) { b = null; }
            if (!b) { statistik.ditolakKosong++; continue; }
            if (sl.materi && (b.klasifikasi.chapter !== sl.materi.chapter || sl.materi.subchapter !== null && b.klasifikasi.subchapter !== sl.materi.subchapter)) { statistik.ditolakValidator++; continue; }
            b.id = p.id + '-' + st.toUpperCase() + '-' + nomor(idx + 1, 2);
            b.no = idx + 1; b.paket = no;
            var r = Validator.periksaButir(b);
            if (!r.lulus) { statistik.ditolakValidator++; continue; }
            var sd = Validator.buatSidik(b);
            if (cekKembar(penjaga, sd)) { statistik.ditolakKembar++; continue; }
            // pola penalaran yang sama dengan butir sesubmateri sebelumnya dihindari selama percobaan masih banyak
            // (polaTerpaksa: penyusun sudah tahu semua pola untuk tingkat ini terpakai, jadi tidak perlu mengulang)
            var ulangPola = !!b.pola && polaDipakai.indexOf(b.pola) >= 0;
            if (ulangPola && coba < 30 && !b.polaTerpaksa) {
              statistik.polaUlang++;
              if (!terbaik) terbaik = { b: b, sd: sd, ulang: true };
              continue;
            }
            // posisi kunci: dikejar pada percobaan awal saja
            if (b.jenis === 'pg' && coba < 24 && b.kunci !== (b.opsi.length === 3 ? target % 3 : target)) {
              statistik.kunciMeleset++;
              if (!terbaik || terbaik.ulang) terbaik = { b: b, sd: sd, ulang: ulangPola };
              continue;
            }
            diterima = { b: b, sd: sd };
          }
          if (!diterima && terbaik) diterima = terbaik;
          if (!diterima) throw new Error('butir ' + p.id + '-' + st.toUpperCase() + '-' + nomor(idx + 1, 2) + ' (' + sl.kunci + ', tingkat ' + lv + ') gagal disusun setelah ' + o.cobaMaks + ' percobaan; kapasitas bank untuk submateri ini mungkin habis, kurangi jumlah paket atau ganti benih');
          // posisi kunci meleset (pengecoh jalur kesalahan tidak selalu bisa mengapit kunci di posisi rencana):
          // tukar rencana dengan butir berikutnya yang direncanakan berhuruf ini, supaya A-E per paket tetap merata
          if (diterima.b.jenis === 'pg' && diterima.b.opsi.length === 5 && diterima.b.kunci !== target) {
            for (var j = idx + 1; j < slot.length; j++) {
              if (slot[j].kunci !== 'verbal' && kunciRencana[j] === diterima.b.kunci) { kunciRencana[j] = target; break; }
            }
          }
          catat(penjaga, diterima.sd);
          if (diterima.b.pola) polaDipakai.push(diterima.b.pola);
          statistik.butir++;
          pakaiKel[diterima.b.keluarga] = (pakaiKel[diterima.b.keluarga] || 0) + 1;
          diterima.b.tingkatNama = { mudah: 'Mudah', sedang: 'Sedang', sulit: 'Sulit' }[diterima.b.level];
          butir.push(diterima.b);
        });
        p.subtes.push({
          kode: st, nama: info.nama, jumlah: butir.length, menit: o.mode === 'materi' ? null : info.menit, komposisi: salinKomposisi(komp), butir: butir
        });
      });
      return p;
    }

    return {
      opsi: o,
      total: o.jumlahPaket,
      selesai: function () { return sudah; },
      /** Bangun paket berikutnya; null bila semuanya sudah dibuat. */
      berikut: function () {
        if (sudah >= o.jumlahPaket) return null;
        var p = buatSatu(sudah + 1);
        paket.push(p);
        sudah++;
        return p;
      },
      hasil: function () {
        return { meta: { versi: VERSI, benih: o.benih, jumlahPaket: paket.length, mode: o.mode, materi: o.materi.map(function (m) {
          return { id: m.id, subtes: m.subtes, category: m.category, lesson: m.lesson, chapter: m.chapter, subchapter: m.subchapter, jumlah: m.jumlah };
        }), subtes: o.subtes, tingkat: o.tingkat, proporsi: o.proporsi, komposisi: o.komposisi }, paket: paket, statistik: statistik };
      }
    };
  }

  /** Bangun semua paket sekaligus lalu periksa seluruh hasil. */
  function buat(opsi) {
    var b = mulai(opsi);
    while (b.berikut()) { /* terus */ }
    var hasil = b.hasil();
    var validasi = Validator.periksaHasil(hasil);
    return { hasil: hasil, validasi: validasi };
  }

  return { VERSI: VERSI, MAKS_PAKET: MAKS_PAKET, PROPORSI_BAKU: PROPORSI_BAKU, normalisasi: normalisasi, mulai: mulai, buat: buat };
});
