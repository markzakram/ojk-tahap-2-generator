/*
 * serial-putar.js — Kemampuan Umum > Figural > Serial dengan bentuk figural yang berputar.
 *
 * Diadaptasi dari mesin Serial pada Figural Kesesuaian Generator (quiz.js): empat
 * kotak berurutan, tebak kotak kelima. Bentuk dasarnya dibangkitkan oleh `families.js`
 * (delapan keluarga bentuk) dan dijamin kiral serta tidak simetri putar, jadi sudut putar
 * dan pencerminan selalu terbaca tegas. Perubahan dari kotak ke kotak memakai satu sampai
 * tiga MEKANISME yang berbeda jenisnya:
 *
 *   putar    seluruh pola diputar delta derajat
 *   pindah   gambar berpindah ke pojok kotak berikutnya (searah atau berlawanan arah
 *            jarum jam), orientasinya hanya berubah bila "putar" juga dipakai
 *   jumlah   titik penanda bertambah satu tiap kotak
 *   isi      isi titik penanda: berselang-seling hitam-kosong di dalam kotak (bersama
 *            "jumlah"), atau tiga titik yang isinya terbalik setiap pindah kotak
 *
 *   mudah   satu mekanisme: putar atau pindah
 *   sedang  dua: jumlah+putar, pindah+putar, isi+putar, atau jumlah+pindah
 *   sulit   tiga: isi+jumlah+putar, jumlah+pindah+putar, atau isi+pindah+putar
 *
 * Gabungan mekanisme itu menjadi `pola` butir ("serial-putar:isi+putar"); penyusun
 * mendahulukan gabungan yang belum dipakai butir serial lain pada paket yang sama
 * (`opsi.polaDipakai`), sehingga dua deret berputar dalam satu paket tidak menguji
 * mekanisme yang sama.
 *
 * Pengecoh dicari dengan sepuluh strategi cacat (cermin, geser, putar sebagian,
 * dst.); tiap calon diuji terhadap kunci dengan `Figure.adalahRotasi` — kalau
 * ternyata masih putaran murni kunci, ia dibuang. Perbedaan dari quiz.js asli:
 * hanya jenis Serial yang dibawa, dan butir dikeluarkan dalam bentuk butir
 * generator ini (gambar sebagai model, pembahasan berbaris).
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./figure.js'), require('./families.js'), require('./render.js'), require('./rng.js'), require('./butir.js'), require('./format.js'), require('./svg.js'));
    module.exports = api;
  } else {
    api = factory(root.Figure, root.Families, root.Render, root.Rng, root.Butir, root.Fmt, root.Svg);
    root.SerialPutar = api;
  }
})(typeof self !== 'undefined' ? self : this, function (F, Fam, R, Rng, Butir, Fmt, S) {
  'use strict';

  var PERINTAH = 'Gunakan gambar di bagian atas untuk menentukan jawaban yang benar dari pilihan di bawah. Pilih jawaban yang menggantikan tanda tanya. Jika tidak ada tanda tanya, pilih jawaban yang merupakan kelanjutan dari urutan tersebut.';

  var AMBANG = {
    bedaMin: 0.045, bedaMaks: 0.42, bedaMinSulit: 0.030, bedaMinMudah: 0.075,
    jangkauan: 0.06, coba: 60
  };

  function bedaMin(tingkat) {
    if (tingkat === 'sulit') return AMBANG.bedaMinSulit;
    if (tingkat === 'mudah') return AMBANG.bedaMinMudah;
    return AMBANG.bedaMin;
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

  function arahPutarBertanda(d) {
    return Math.abs(d) + ' derajat ' + (d >= 0 ? 'searah' : 'berlawanan arah') + ' jarum jam';
  }

  /** Pengecoh tidak harus lolos semua penyaring bentuk, tetapi harus TERBACA. */
  function layakPengecoh(fig) {
    if (!fig || fig.unsur.length < 2) return false;
    var jang = F.jangkauan(fig);
    if (!(jang > 1)) return false;
    if (F.ruasTerpendek(fig) < Fam.AMBANG.ruas * jang * 0.8) return false;
    for (var i = 0; i < fig.unsur.length; i++) {
      for (var j = i + 1; j < fig.unsur.length; j++) {
        if (F.bedaUnsur(fig.unsur[i], fig.unsur[j]) < Fam.AMBANG.rapat * jang * 0.8) return false;
      }
    }
    return true;
  }

  // ------------------------------------------------------------------- cacat

  function cacatCermin(fig) {
    return {
      fig: F.pusatkan(F.cermin(fig)), jenis: 'cermin',
      alasan: 'gambarnya merupakan BAYANGAN CERMIN dari kelanjutan yang benar; deret ini hanya berputar, tidak pernah tercermin'
    };
  }

  function cacatPutarUnsur(fig, a) {
    var idx = a.bulat(0, fig.unsur.length - 1);
    var d = a.pilih([40, 55, 70, 90, 110, 130]) * a.tanda();
    return {
      fig: F.pusatkan(F.putarUnsur(fig, idx, d)), jenis: 'putarUnsur',
      alasan: 'letak ' + namaUnsur(fig, idx) + ' berpindah terhadap unsur lain; pada putaran seluruh unsur bergerak bersama-sama sehingga kedudukan relatifnya tetap'
    };
  }

  function cacatPutarSendiri(fig, a) {
    var calon = [];
    fig.unsur.forEach(function (u, i) { if (u.jenis === 'garis') calon.push(i); });
    if (!calon.length) return null;
    var idx = a.pilih(calon);
    var d = a.pilih([30, 45, 60, 75, 90]) * a.tanda();
    return {
      fig: F.pusatkan(F.putarUnsurSendiri(fig, idx, d)), jenis: 'putarSendiri',
      alasan: 'arah ' + namaUnsur(fig, idx) + ' berubah sedangkan letaknya tetap, padahal sudut antarunsur tidak boleh berubah pada putaran'
    };
  }

  function cacatSkalaUnsur(fig, a) {
    var idx = a.bulat(0, fig.unsur.length - 1);
    var s = a.pilih([0.62, 0.72, 1.28, 1.4]);
    return {
      fig: F.pusatkan(F.skalaUnsur(fig, idx, s)), jenis: 'skalaUnsur',
      alasan: 'ukuran ' + namaUnsur(fig, idx) + ' ' + (s < 1 ? 'mengecil' : 'membesar') + ' terhadap unsur lain, padahal putaran tidak mengubah ukuran apa pun'
    };
  }

  function cacatHapusUnsur(fig, a) {
    if (fig.unsur.length < 3) return null;
    var total = F.panjangTotal(fig), calon = [];
    fig.unsur.forEach(function (u, i) { if (F.panjangUnsur(u) <= total * 0.40) calon.push(i); });
    if (!calon.length) return null;
    var idx = a.pilih(calon), u = fig.unsur.slice(), nama = namaUnsur(fig, idx);
    u.splice(idx, 1);
    return {
      fig: F.pusatkan({ unsur: u, keluarga: fig.keluarga, benih: fig.benih }), jenis: 'hapusUnsur',
      alasan: nama + ' hilang sehingga jumlah unsurnya berkurang satu'
    };
  }

  function cacatTambahUnsur(fig, a) {
    var idx = a.bulat(0, fig.unsur.length - 1);
    var tiru = F.salinUnsur(fig.unsur[idx]);
    var d = a.pilih([70, 100, 130, 160, 200]) * a.tanda();
    var tmp = F.putarUnsur({ unsur: [tiru] }, 0, d);
    var u = fig.unsur.concat([tmp.unsur[0]]);
    return {
      fig: F.pusatkan({ unsur: u, keluarga: fig.keluarga, benih: fig.benih }), jenis: 'tambahUnsur',
      alasan: 'ada satu unsur TAMBAHAN berupa salinan ' + namaUnsur(fig, idx)
    };
  }

  function cacatIsiUnsur(fig, a) {
    var calon = [];
    fig.unsur.forEach(function (u, i) { if (u.jenis === 'bulat' || (u.jenis === 'garis' && u.tutup)) calon.push(i); });
    if (!calon.length) return null;
    var idx = a.pilih(calon), h = F.salin(fig), kosong = !h.unsur[idx].isi;
    h.unsur[idx].isi = kosong ? '#111' : null;
    return {
      fig: h, jenis: 'isiUnsur',
      alasan: namaUnsur(fig, idx) + ' berubah dari ' + (kosong ? 'kosong menjadi terisi hitam' : 'terisi hitam menjadi kosong')
    };
  }

  function cacatGeserUnsur(fig, a) {
    var idx = a.bulat(0, fig.unsur.length - 1), jang = F.jangkauan(fig);
    var d = jang * a.antara(0.16, 0.30), ar = a.antara(0, 360) * Math.PI / 180;
    var h = F.salin(fig), u = h.unsur[idx], dx = d * Math.cos(ar), dy = d * Math.sin(ar);
    if (u.jenis === 'bulat') u.pusat = [u.pusat[0] + dx, u.pusat[1] + dy];
    else u.titik = u.titik.map(function (p) { return [p[0] + dx, p[1] + dy]; });
    h = F.pusatkan(h);
    if (F.jangkauan(h) > jang * 1.08) return null;
    return {
      fig: h, jenis: 'geserUnsur',
      alasan: 'letak ' + namaUnsur(fig, idx) + ' bergeser dari kedudukan semula terhadap unsur lain, padahal putaran mempertahankan jarak antarunsur'
    };
  }

  function cacatPutarTumpu(fig, a) {
    var idx = a.bulat(0, fig.unsur.length - 1), u = fig.unsur[idx];
    if (u.jenis === 'bulat') return null;
    var BEBAS = [25, 35, 45, 60, 75, 90, 110];
    var jang = F.jangkauan(fig), tau = jang * 0.05;
    var titikU = F.sampelBatas({ unsur: [u] }, 40), calon = [];
    var tumpu = F.titikTumpu(fig, idx);
    if (tumpu) calon.push({ p: tumpu, sudut: BEBAS });
    fig.unsur.forEach(function (v, j) {
      if (j === idx) return;
      if (!(v.jenis === 'bulat' || v.tutup)) return;
      var titikV = F.sampelBatas({ unsur: [v] }, 40), dalam = 0, sentuh = false;
      titikU.forEach(function (q) {
        if (F.didalam(q, v)) dalam++;
        if (sentuh) return;
        for (var k = 0; k < titikV.length; k++) {
          if (Math.hypot(q[0] - titikV[k][0], q[1] - titikV[k][1]) < tau) { sentuh = true; return; }
        }
      });
      if (!sentuh && dalam < titikU.length * 0.9) return;
      var sudut = BEBAS;
      if (v.jenis === 'garis') {
        sudut = [];
        var langkah = 360 / v.titik.length;
        for (var m = 1; m < v.titik.length; m++) sudut.push(langkah * m);
      }
      calon.push({ p: F.pusatUnsur(v), sudut: sudut });
    });
    if (!calon.length) calon.push({ p: [0, 0], sudut: BEBAS });
    var pilih = a.pilih(calon), p = pilih.p, d = a.pilih(pilih.sudut) * a.tanda();
    var rad = d * Math.PI / 180, c = Math.cos(rad), s = Math.sin(rad), h = F.salin(fig);
    h.unsur[idx].titik = h.unsur[idx].titik.map(function (t) {
      var x = t[0] - p[0], y = t[1] - p[1];
      return [p[0] + x * c - y * s, p[1] + x * s + y * c];
    });
    return {
      fig: F.pusatkan(h), jenis: 'putarTumpu',
      alasan: 'sudut ' + namaUnsur(fig, idx) + ' terhadap unsur lain berbeda: ia masih menempel pada tempat yang sama tetapi arahnya berubah'
    };
  }

  function cacatCerminUnsur(fig, a) {
    var calon = [];
    fig.unsur.forEach(function (u, i) { if (u.jenis === 'garis' && u.titik.length > 2) calon.push(i); });
    if (!calon.length) return null;
    var idx = a.pilih(calon), h = F.salin(fig), u = h.unsur[idx], p = F.pusatUnsur(u);
    u.titik = u.titik.map(function (t) { return [2 * p[0] - t[0], t[1]]; }).reverse();
    return {
      fig: F.pusatkan(h), jenis: 'cerminUnsur',
      alasan: 'hanya ' + namaUnsur(fig, idx) + ' yang tercermin sedangkan unsur lain tidak, sehingga sudut terbukanya menghadap arah yang berlawanan'
    };
  }

  var CACAT = {
    cermin: cacatCermin, putarUnsur: cacatPutarUnsur, putarSendiri: cacatPutarSendiri,
    skalaUnsur: cacatSkalaUnsur, hapusUnsur: cacatHapusUnsur, tambahUnsur: cacatTambahUnsur,
    isiUnsur: cacatIsiUnsur, geserUnsur: cacatGeserUnsur, cerminUnsur: cacatCerminUnsur, putarTumpu: cacatPutarTumpu
  };

  var PRIORITAS = {
    mudah: ['hapusUnsur', 'tambahUnsur', 'skalaUnsur', 'cermin', 'geserUnsur', 'putarUnsur', 'isiUnsur', 'putarSendiri', 'cerminUnsur', 'putarTumpu'],
    sedang: ['cermin', 'putarTumpu', 'putarUnsur', 'skalaUnsur', 'geserUnsur', 'isiUnsur', 'hapusUnsur', 'putarSendiri', 'tambahUnsur', 'cerminUnsur'],
    sulit: ['putarTumpu', 'cermin', 'putarSendiri', 'cerminUnsur', 'putarUnsur', 'geserUnsur', 'isiUnsur', 'skalaUnsur', 'tambahUnsur', 'hapusUnsur']
  };

  /** Satu pengecoh yang DIJAMIN bukan putaran murni `acuan` dan tidak kembar dengan pilihan lain. */
  function cariPengecoh(acuan, sudahAda, a, tingkat, hindariAlasan) {
    var minBeda = bedaMin(tingkat), urut = PRIORITAS[tingkat] || PRIORITAS.sedang;
    var gagalBeruntun = {}, mati = {};
    function tandaiGagal(nama) {
      gagalBeruntun[nama] = (gagalBeruntun[nama] || 0) + 1;
      if (gagalBeruntun[nama] >= 7) mati[nama] = true;
    }
    for (var c = 0; c < AMBANG.coba; c++) {
      var hidup = urut.filter(function (n) { return !mati[n]; });
      if (!hidup.length) return null;
      var daftar = c < hidup.length * 2 ? hidup : a.kocok(hidup);
      var nama = daftar[c % daftar.length];
      var hasil = CACAT[nama](acuan, a);
      if (!hasil) { tandaiGagal(nama); continue; }
      if (hindariAlasan.indexOf(hasil.alasan) >= 0) { tandaiGagal(nama); continue; }
      if (F.adalahRotasi(hasil.fig, acuan)) { tandaiGagal(nama); continue; }
      var kembar = false;
      for (var i = 0; i < sudahAda.length; i++) if (F.adalahRotasi(hasil.fig, sudahAda[i])) { kembar = true; break; }
      if (kembar) { tandaiGagal(nama); continue; }
      if (!layakPengecoh(hasil.fig)) { tandaiGagal(nama); continue; }
      var ambangKini = c < AMBANG.coba * 0.67 ? minBeda : AMBANG.bedaMinSulit;
      var beda = F.bedaBentuk(hasil.fig, acuan);
      if (beda < ambangKini || beda > AMBANG.bedaMaks) { tandaiGagal(nama); continue; }
      gagalBeruntun[nama] = 0;
      hasil.beda = beda;
      return hasil;
    }
    return null;
  }

  function adaKembar(fig, daftar) {
    for (var i = 0; i < daftar.length; i++) if (F.samaPersis(fig, daftar[i])) return true;
    return false;
  }

  // ------------------------------------------------------------------ serial

  /** Gabungan mekanisme per tingkat (nama diurutkan abjad; sama dengan figural.js). */
  var MEKANISME = {
    mudah: ['putar', 'pindah'],
    sedang: ['jumlah+putar', 'pindah+putar', 'isi+putar', 'jumlah+pindah'],
    sulit: ['isi+jumlah+putar', 'jumlah+pindah+putar', 'isi+pindah+putar']
  };
  // pojok kotak berurutan searah jarum jam: kiri atas, kanan atas, kanan bawah, kiri bawah
  var POJOK = [[-1, -1], [1, -1], [1, 1], [-1, 1]], NAMA_POJOK = ['kiri atas', 'kanan atas', 'kanan bawah', 'kiri bawah'];
  var ISI_TETAP = [[1, 0, 0], [0, 1, 0], [0, 0, 1], [1, 1, 0], [1, 0, 1], [0, 1, 1]];

  function mod(x, n) { return ((x % n) + n) % n; }

  /** Pola sama persis, atau gabungan mekanisme yang sama pada keluarga serial lain, dianggap sudah dipakai. */
  function polaTerpakai(pola, dipakai) {
    if (!dipakai || !dipakai.length) return false;
    var inti = pola.slice(pola.indexOf(':') + 1);
    return dipakai.some(function (p) { p = String(p); return p === pola || p.slice(p.indexOf(':') + 1) === inti; });
  }

  function tanpaPenanda(fig) {
    return { unsur: fig.unsur.filter(function (u) { return u.nama !== 'penanda deret'; }), keluarga: fig.keluarga, benih: fig.benih };
  }

  function buatSerial(dasar, a, tingkat, mek) {
    var punya = function (t) { return mek.split('+').indexOf(t) >= 0; };
    var putar = punya('putar'), pindah = punya('pindah'), tumbuh = punya('jumlah'), isi = punya('isi');
    var selang = tumbuh && isi, balikTiap = isi && !tumbuh;
    var delta = 0;
    if (putar) {
      delta = a.pilih(tingkat === 'mudah' ? [45, 90] : [30, 45, 60, 90]);
      if (a.untung(0.35)) delta = -delta;
    }
    var awalPos = a.bulat(0, 3), langkahPos = pindah ? a.pilih([1, -1]) : 0;
    var polaIsi = balikTiap ? a.pilih(ISI_TETAP) : null;
    // bentuk dasar dipusatkan TANPA titik penanda, jadi titik berat gambar selalu di titik
    // asal (sebelum dipindah ke pojok) dan letaknya terbaca tegas oleh pemeriksa
    var polos = F.pusatkan(dasar);
    var jang = F.jangkauan(polos), jariTitik = jang * 0.10, jariCincin = jang * 1.12, geserPos = jang * 0.85;

    function penanda(k, o) {
      var n = tumbuh ? k + 1 + (o.tambahJumlah || 0) : (balikTiap ? 3 : 0), out = [];
      for (var i = 0; i < n; i++) {
        var ar = (-90 + i * 52) * Math.PI / 180, hitam;
        if (selang) hitam = (i + (o.balikIsi ? 1 : 0)) % 2 === 0;
        else if (balikTiap) hitam = !!(polaIsi[i] ^ ((k + (o.balikIsi ? 1 : 0)) % 2));
        else hitam = true;
        out.push({ jenis: 'bulat', jari: jariTitik, isi: hitam ? '#111' : null, tebal: 1, nama: 'penanda deret', pusat: [jariCincin * Math.cos(ar), jariCincin * Math.sin(ar)] });
      }
      return out;
    }

    /** Pojok (indeks POJOK) kotak ke-k, atau -1 bila gambar tetap di tengah. */
    function pojokKe(k, o) { return pindah ? mod(awalPos + langkahPos * (k + (o.tambahPindah || 0)), 4) : -1; }

    function tempatkan(f, k, o) {
      var q = pojokKe(k, o);
      return q < 0 ? f : F.geser(f, POJOK[q][0] * geserPos, POJOK[q][1] * geserPos);
    }

    /** Kotak ke-k (0-4). Bentuk polos dan titik penanda diputar bersama, lalu dipindah ke pojoknya. */
    function suku(k, o) {
      o = o || {};
      var f = { unsur: polos.unsur.concat(penanda(k, o)), keluarga: polos.keluarga, benih: polos.benih };
      f = F.putar(f, delta * (k + (o.tambahPutaran || 0)) + (o.putarLain || 0));
      if (o.cermin) f = F.cermin(f);
      return tempatkan(f, k, o);
    }

    var deret = [suku(0), suku(1), suku(2), suku(3)];
    var kunci = suku(4);
    var bagianAlasan = [];
    if (putar) bagianAlasan.push('pola diputar ' + arahPutarBertanda(delta) + ' dari kotak keempat');
    if (pindah) bagianAlasan.push('gambar berpindah ke pojok ' + NAMA_POJOK[pojokKe(4, {})]);
    if (tumbuh) bagianAlasan.push('jumlah titik penandanya menjadi lima');
    if (selang) bagianAlasan.push('isi titiknya tetap berselang-seling hitam dan kosong');
    if (balikTiap) bagianAlasan.push('isi ketiga titiknya terbalik dari kotak keempat');
    var pilihan = [{ fig: kunci, benar: true, alasan: 'kotak kelima meneruskan semua aturan sekaligus: ' + bagianAlasan.join(', ') }];
    var dipakai = [kunci], calon = [];
    if (putar) {
      calon.push({ jenis: 'putar', fig: suku(4, { tambahPutaran: -1 }), alasan: 'putarannya kurang satu langkah: gambar ini masih pada sudut kotak keempat, padahal setiap kotak bertambah ' + Math.abs(delta) + ' derajat' });
      calon.push({ jenis: 'putar', fig: suku(4, { tambahPutaran: 1 }), alasan: 'putarannya kelebihan satu langkah, yaitu ' + Math.abs(delta * 2) + ' derajat dari kotak keempat, bukan ' + Math.abs(delta) + ' derajat' });
    } else {
      calon.push({ jenis: 'putar', fig: suku(4, { putarLain: a.pilih([90, -90, 180]) }), alasan: 'gambarnya ikut berputar, padahal pada deret ini arah gambar tidak pernah berubah; yang berubah hanya letaknya' });
    }
    if (pindah) {
      calon.push({ jenis: 'pindah', fig: suku(4, { tambahPindah: -1 }), alasan: 'gambarnya tetap di pojok ' + NAMA_POJOK[pojokKe(3, {})] + ' seperti kotak keempat, padahal setiap kotak gambar berpindah satu pojok' });
      calon.push({ jenis: 'pindah', fig: suku(4, { tambahPindah: 1 }), alasan: 'gambarnya melompat dua pojok sekaligus, padahal setiap kotak hanya berpindah satu pojok' });
      calon.push({ jenis: 'pindah', fig: suku(4, { tambahPindah: -2 }), alasan: 'gambarnya berpindah ke arah sebaliknya; deret ini berpindah ' + (langkahPos > 0 ? 'searah' : 'berlawanan arah') + ' jarum jam' });
    }
    if (tumbuh) {
      calon.push({ jenis: 'jumlah', fig: suku(4, { tambahJumlah: -1 }), alasan: 'jumlah titik penandanya berhenti di empat, padahal bertambah satu titik pada setiap kotak sehingga kotak kelima berisi lima titik' });
      calon.push({ jenis: 'jumlah', fig: suku(4, { tambahJumlah: 1 }), alasan: 'titik penandanya berjumlah enam: bertambah dua sekaligus dari kotak keempat, padahal pertambahannya satu per kotak' });
    }
    if (selang) calon.push({ jenis: 'isi', fig: suku(4, { balikIsi: true }), alasan: 'urutan isi titiknya terbalik: yang seharusnya hitam menjadi kosong dan sebaliknya' });
    if (balikTiap) calon.push({ jenis: 'isi', fig: suku(4, { balikIsi: true }), alasan: 'isi titik penandanya sama dengan kotak keempat, padahal isinya terbalik setiap pindah kotak (hitam menjadi kosong, kosong menjadi hitam)' });
    calon.push({ jenis: 'cermin', fig: suku(4, { cermin: true }), alasan: 'gambarnya merupakan bayangan cermin dari lanjutan yang benar; pada deret ini gambar tidak pernah tercermin' });

    // urutan bergiliran per mekanisme, supaya setiap mekanisme yang dipakai diwakili sedikitnya satu pengecoh
    var kelompok = {};
    a.kocok(calon).forEach(function (c) { (kelompok[c.jenis] = kelompok[c.jenis] || []).push(c); });
    var giliran = a.kocok(Object.keys(kelompok).sort());
    calon = [];
    for (var putaran = 0; putaran < 4; putaran++) giliran.forEach(function (j) { if (kelompok[j][putaran]) calon.push(kelompok[j][putaran]); });
    for (var i = 0; i < calon.length && pilihan.length < 5; i++) {
      // kelayakan diukur pada gambar yang dipusatkan: jangkauan gambar di pojok kotak tidak sebanding
      if (!layakPengecoh(F.pusatkan(calon[i].fig)) || adaKembar(calon[i].fig, dipakai)) continue;
      pilihan.push({ fig: calon[i].fig, benar: false, alasan: calon[i].alasan });
      dipakai.push(calon[i].fig);
    }
    // sisanya: bentuk kunci yang dirusak (bukan putaran bentuk kunci), dengan titik penanda dan
    // letak yang sama dengan kunci, sehingga yang salah benar-benar bentuknya
    var acuan = F.putar(polos, delta * 4), titikKunci = penanda(4, {});
    var polosDipakai = dipakai.map(function (f) { return F.pusatkan(tanpaPenanda(f)); });
    var alasanDipakai = pilihan.map(function (p) { return p.alasan; });
    while (pilihan.length < 5) {
      var p = cariPengecoh(acuan, polosDipakai, a, tingkat, alasanDipakai);
      if (!p) return null;
      var titikPutar = F.putar({ unsur: titikKunci }, delta * 4).unsur;
      var fig = tempatkan({ unsur: p.fig.unsur.concat(titikPutar), keluarga: polos.keluarga, benih: polos.benih }, 4, {});
      if (adaKembar(fig, dipakai)) return null;
      pilihan.push({ fig: fig, benar: false, alasan: p.alasan });
      dipakai.push(fig);
      polosDipakai.push(p.fig);
      alasanDipakai.push(p.alasan);
    }
    // titik pusat putaran tiap kotak (koordinat bentuk): titik asal bentuk polos, ikut dipindah ke pojoknya
    var pusat = [0, 1, 2, 3, 4].map(function (k) { var q = pojokKe(k, {}); return q < 0 ? [0, 0] : [POJOK[q][0] * geserPos, POJOK[q][1] * geserPos]; });
    return {
      dasar: dasar, deret: deret, pilihan: pilihan, pusat: pusat,
      pola: { mekanisme: mek, delta: delta, tumbuh: tumbuh, selang: selang, isi: balikTiap ? polaIsi.join('') : null, pindah: pindah ? { awal: awalPos, langkah: langkahPos } : null }
    };
  }

  // ------------------------------------------------------------------- butir

  function buat(id, level, benih, opsi) {
    opsi = opsi || {};
    var a0 = Rng.alat(benih);
    var target = opsi.target == null ? a0.bulat(0, 4) : opsi.target;
    var boleh = Fam.daftarKeluarga(opsi.keluarga || 'campur');
    var keluarga = boleh.length === 1 ? boleh[0] : Rng.alat((benih >>> 0) ^ 0x63a7f19b).pilih(boleh);
    // mekanisme: yang belum dipakai butir serial lain pada paket ini didahulukan, lalu yang paling
    // sedikit berbagi unsur (putar, pindah, jumlah, isi) dengan mekanisme yang sudah dipakai
    var semuaMek = MEKANISME[level] || MEKANISME.sedang, dipakaiUnsur = (opsi.polaDipakai || []).map(function (p) { p = String(p); return p.slice(p.indexOf(':') + 1).split('+'); });
    var mekBaru = semuaMek.filter(function (m) { return !polaTerpakai('serial-putar:' + m, opsi.polaDipakai); });
    if (!mekBaru.length) mekBaru = semuaMek;
    var irisan = function (m) { return dipakaiUnsur.reduce(function (s, u) { return Math.max(s, m.split('+').filter(function (t) { return u.indexOf(t) >= 0; }).length); }, 0); };
    var irisanMin = Math.min.apply(null, mekBaru.map(irisan));
    var mek = Rng.alat((benih >>> 0) ^ 0x2c1b3c6d).pilih(mekBaru.filter(function (m) { return irisan(m) === irisanMin; }));
    for (var c = 0; c < 10; c++) {
      var benihKini = (benih + c * 0x27d4eb2f) >>> 0;
      var a = Rng.alat(benihKini ^ 0x1b873593);
      var dasar = Fam.bangkitkan(keluarga, benihKini);
      var inti = buatSerial(dasar, a, level, mek);
      if (!inti) continue;
      var acak = a.kocok(inti.pilihan.map(function (p, i) { return i; }));
      var daftar = acak.map(function (i) { return inti.pilihan[i]; });
      // kunci dipindahkan ke posisi target
      var idx = -1;
      daftar.forEach(function (p, i) { if (p.benar) idx = i; });
      var kunciObj = daftar.splice(idx, 1)[0];
      daftar.splice(target, 0, kunciObj);

      // skala bersama: bentuk terbesar menentukan, supaya ukuran gambar tidak membocorkan jawaban
      var semuaFig = inti.deret.concat(daftar.map(function (p) { return p.fig; }));
      // gambar yang berpindah pojok boleh mendekati tepi kotak supaya tidak terlalu kecil
      var skala = R.skalaBersama(semuaFig, 100, inti.pola.pindah ? 0.04 : 0.10);
      var pl = inti.pola, bahas = gambarBahas(inti, kunciObj.fig, skala);
      var pembahasan = ['Gambar 1 menyusun kotak 1 sampai 4 dari soal dan kotak 5 yang benar (berbingkai hijau). Aturan yang berlaku dari kotak ke kotak:'];
      if (pl.delta) {
        var sudutKe = [0, 1, 2, 3, 4].map(function (k) { return k * Math.abs(pl.delta) + '°'; });
        pembahasan.push('• seluruh objek diputar ' + Math.abs(pl.delta) + ' derajat ' + (pl.delta > 0 ? 'searah' : 'berlawanan arah') + ' jarum jam pada setiap kotak, jadi besar putarannya terhadap kotak 1 adalah ' + sudutKe.slice(0, 4).join(', ') + ', lalu ' + sudutKe[4] + '; ' + (bahas.namaAcuan ? bahas.namaAcuan + ' digambar merah supaya putarannya mudah diikuti;' : 'putaran itu terlihat dari arah garis-garisnya;'));
      } else pembahasan.push('• arah gambar tidak pernah berubah (tidak diputar dan tidak dicerminkan);');
      if (pl.pindah) {
        var urutPojok = [0, 1, 2, 3, 4].map(function (k) { return NAMA_POJOK[mod(pl.pindah.awal + pl.pindah.langkah * k, 4)]; });
        pembahasan.push('• gambar berpindah satu pojok ' + (pl.pindah.langkah > 0 ? 'searah' : 'berlawanan arah') + ' jarum jam pada setiap kotak: ' + urutPojok.slice(0, 4).join(', ') + ', lalu ' + urutPojok[4] + '. Gambar 2 menunjukkan urutan pojok itu dengan panah biru;');
      }
      if (pl.tumbuh) pembahasan.push('• jumlah titik penandanya (jingga) bertambah satu pada setiap kotak, yaitu 1, 2, 3, 4, lalu 5;');
      if (pl.selang) pembahasan.push('• isi titiknya berselang-seling: hitam, kosong, hitam, dan seterusnya;');
      if (pl.isi) pembahasan.push('• ketiga titik penanda (jingga) isinya terbalik setiap pindah kotak: titik yang hitam menjadi kosong dan yang kosong menjadi hitam, jadi kotak kelima sama isinya dengan kotak ketiga;');
      if (bahas.sudut) pembahasan.push('Gambar ' + bahas.gambar.length + ' memperbesar kotak 4 → 5: titik biru adalah pusat putaran, garis abu-abu putus-putus menunjukkan arah ' + bahas.namaAcuan + ' pada kotak 4, dan busur biru memutarnya ' + Math.abs(pl.delta) + '° ' + (pl.delta > 0 ? 'searah' : 'berlawanan arah') + ' jarum jam ke arah barunya pada kotak 5 (garis merah).');
      pembahasan.push('Meneruskan semua aturan itu ke kotak kelima, gambar yang tepat adalah opsi ' + Fmt.huruf(target) + '.');

      var opsiGambar = daftar.map(function (p, i) {
        return { teks: 'Gambar opsi ' + Fmt.huruf(i), nilai: i, alasan: p.benar ? null : p.alasan, kunci: p.benar,
          gambar: { id: 'opsi-' + Fmt.huruf(i).toLowerCase(), jenis: 'figur', model: { fig: p.fig, skala: skala }, judul: 'Opsi ' + Fmt.huruf(i) } };
      });
      var ctx = { subtes: 'ku', submateri: 'figural', keluarga: id, level: level, benih: benih, a: a };
      var butir = Butir.rakitPg(ctx, {
        jenisSoal: 'Figural Serial - The Next Box (bentuk berputar)',
        judul: 'Figural Serial - The Next Box', teks: [], pertanyaan: '', perintah: PERINTAH,
        gambar: [{ id: 'soal', jenis: 'serial-putar', model: { deret: inti.deret, skala: skala }, judul: 'Deret kotak' }],
        pilihanJadi: { opsi: opsiGambar, kunciIndex: target }, tulisKunci: false,
        langkah: [], pembahasan: pembahasan,
        model: {
          topik: 'Figural', tipe: 'serial-putar', keluarga: dasar.keluarga, deret: inti.deret, pilihan: daftar.map(function (p) { return p.fig; }),
          kunciIndex: target, pola: inti.pola, skala: skala
        },
        sidik: { inti: 'serial-putar|' + dasar.keluarga + '|' + dasar.benih + '|' + JSON.stringify(inti.pola), param: [], entitas: dasar.keluarga }
      });
      if (!butir) continue;
      butir.gambarPembahasan = bahas.gambar;
      butir.pola = 'serial-putar:' + mek;
      butir.kategoriRiset = 'acuan';
      return butir;
    }
    return null;
  }

  // ------------------------------------------------------------- menggambar

  function svgSerial(deret, skala) {
    var sisi = 100, o = { skala: skala };
    var daftar = deret.map(function (f, i) { return { fig: f, label: '' }; });
    var gap = 14, pad = 6, n = daftar.length + 1, bagian = [];
    daftar.forEach(function (d, i) {
      var k = R.kotak(d.fig, sisi, { skala: skala });
      bagian.push('<g transform="translate(' + (pad + i * (sisi + gap)) + ',' + pad + ')">' + k.svg + '</g>');
    });
    var q = R.kotakTanya(sisi);
    bagian.push('<g transform="translate(' + (pad + daftar.length * (sisi + gap)) + ',' + pad + ')">' + q.svg + '</g>');
    var w = pad * 2 + n * sisi + (n - 1) * gap;
    return { svg: R.doc(bagian.join(''), w, sisi + pad * 2, { background: '#ffffff' }), lebar: w, tinggi: sisi + pad * 2 };
  }

  function svgFigur(fig, skala, sisi) {
    sisi = sisi || 120;
    var pad = 4, k = R.kotak(fig, sisi, { skala: skala * sisi / 100 });
    return { svg: R.doc('<g transform="translate(' + pad + ',' + pad + ')">' + k.svg + '</g>', sisi + pad * 2, sisi + pad * 2, { background: '#ffffff' }), lebar: sisi + pad * 2, tinggi: sisi + pad * 2 };
  }

  // ---------------------------------------------------------- gambar pembahasan

  /*
   * Pembahasan memperlihatkan prosesnya, tidak hanya jawabannya:
   *
   *   putar-tahap  kotak 1-4 soal + kotak 5 jawaban sederet; besar putaran, pojok, jumlah titik,
   *                dan isi titik tiap kotak ditulis di bawahnya; unsur pembanding merah, titik jingga
   *   putar-pojok  (mekanisme pindah) empat pojok kotak dengan nomor kotak dan panah urutannya
   *   putar-sudut  (mekanisme putar) kotak 4 -> 5 diperbesar: pusat putaran, arah unsur pembanding
   *                sebelum dan sesudah, dan busur sebesar sudut putarnya
   *
   * Semua dihitung dari model butir (deret, kunci, pusat putaran), tanpa pengacak.
   */
  var BH = S.BAHAS;

  /** Unsur pembanding: garis terpanjang yang bukan titik penanda (urutan unsur sama di semua kotak). */
  function unsurAcuan(fig) {
    var idx = -1, pj = -1;
    fig.unsur.forEach(function (u, i) {
      if (u.jenis !== 'garis' || u.nama === 'penanda deret' || u.titik.length < 2) return;
      var p = F.panjangUnsur(u);
      if (p > pj + 1e-9) { pj = p; idx = i; }
    });
    return idx;
  }

  /** Indeks titik unsur yang terjauh dari pusat p (dipakai sama di kotak 4 dan 5). */
  function ujungJauh(u, p) {
    var idx = 0, d = -1;
    u.titik.forEach(function (t, i) { var e = Math.hypot(t[0] - p[0], t[1] - p[1]); if (e > d + 1e-9) { d = e; idx = i; } });
    return idx;
  }

  function judulBahas(no, teks) { return 'Gambar ' + no + '. ' + teks; }

  /** Deskriptor gambar pembahasan sebuah deret (dipanggil penyusun; tanpa pengacak). */
  function gambarBahas(inti, kunci, skala) {
    var pl = inti.pola, out = [], acuan = pl.delta ? unsurAcuan(kunci) : -1;
    var namaAcuan = acuan >= 0 ? 'unsur pembanding (' + namaUnsur(kunci, acuan) + ')' : '';
    out.push({ id: 'bahas-1', jenis: 'putar-tahap', judul: judulBahas(1, 'Kotak 1 sampai 5 (kotak 5 = jawaban)'),
      model: { kotak: inti.deret, jawaban: kunci, skala: skala, pola: pl, acuan: acuan } });
    if (pl.pindah) out.push({ id: 'bahas-' + (out.length + 1), jenis: 'putar-pojok', judul: judulBahas(out.length + 1, 'Perpindahan pojok kotak 1 sampai 5'), model: { pindah: pl.pindah } });
    if (pl.delta && acuan >= 0) {
      var ujung = ujungJauh(inti.deret[3].unsur[acuan], inti.pusat[3]);
      out.push({ id: 'bahas-' + (out.length + 1), jenis: 'putar-sudut',
        judul: judulBahas(out.length + 1, 'Kotak 4 → kotak 5: putar ' + Math.abs(pl.delta) + '° ' + (pl.delta > 0 ? 'searah' : 'berlawanan arah') + ' jarum jam'),
        model: { k4: inti.deret[3], jawaban: kunci, skala: skala, delta: pl.delta, acuan: acuan, ujung: ujung, pusat: [inti.pusat[3], inti.pusat[4]] } });
    }
    return { gambar: out, namaAcuan: namaAcuan, sudut: out[out.length - 1].jenis === 'putar-sudut' };
  }

  function teksBahas(s, x, y, o) { return R.text(s, x, y, Object.assign({ size: 11, fill: BH.teks }, o || {})); }

  /** Warna per unsur: pembanding merah, titik penanda jingga (bila jumlah/isinya berpola). */
  function warnaUnsur(fig, acuan, titik) {
    return fig.unsur.map(function (u, i) { return i === acuan ? BH.acuan : (titik && u.nama === 'penanda deret' ? BH.sorot : null); });
  }

  /** Satu kotak gambar pembahasan (koordinat kotak); `garisPojok` = garis bantu putus-putus empat pojok. */
  function kotakBahas(f, sisi, s, warna, jawab, garisPojok) {
    var o = [S.rect(0.5, 0.5, sisi - 1, sisi - 1, { rx: sisi * 0.03, isi: jawab ? BH.latarJawab : '#ffffff', garis: jawab ? BH.jawab : '#9aa3b5', tebal: jawab ? 2.5 : 1 })];
    if (garisPojok) {
      o.push(S.garis(sisi / 2, 3, sisi / 2, sisi - 3, { garis: '#cdd3df', tebal: 1, putus: '3 3' }));
      o.push(S.garis(3, sisi / 2, sisi - 3, sisi / 2, { garis: '#cdd3df', tebal: 1, putus: '3 3' }));
    }
    o.push(R.kotak(f, sisi, { skala: s, warna: warna, bingkai: false }).svg);
    return o.join('');
  }

  /** Kotak 1-5 sederet dengan keterangan tiap kotak di bawahnya. */
  function svgTahap(m, judul) {
    var pl = m.pola, sisi = 84, gap = 22, pad = 8, yKotak = pad + 22 + 16, figs = m.kotak.concat([m.jawaban]);
    var titikBerpola = !!(pl.tumbuh || pl.isi || pl.selang), o = [];
    var baris = [];
    if (pl.delta) baris.push(function (k) { return 'putar ' + k * Math.abs(pl.delta) + '°'; });
    if (pl.pindah) baris.push(function (k) { return NAMA_POJOK[mod(pl.pindah.awal + pl.pindah.langkah * k, 4)]; });
    if (pl.tumbuh) baris.push(function (k) { return (k + 1) + ' titik'; });
    var adaIsi = !!(pl.isi || pl.selang);
    var W = pad * 2 + 5 * sisi + 4 * gap, H = yKotak + sisi + 8 + baris.length * 16 + (adaIsi ? 16 : 0) + pad;
    o.push(teksBahas(judul, pad, pad + 13, { size: 13, weight: 700 }));
    figs.forEach(function (f, k) {
      var x = pad + k * (sisi + gap), jawab = k === 4;
      o.push(teksBahas(jawab ? 'Kotak 5 (jawaban)' : 'Kotak ' + (k + 1), x + sisi / 2, yKotak - 6, { anchor: 'middle', weight: 700, fill: jawab ? BH.jawab : BH.teks }));
      o.push('<g transform="translate(' + x + ',' + yKotak + ')">' + kotakBahas(f, sisi, m.skala * sisi / 100, warnaUnsur(f, m.acuan, titikBerpola), jawab, !!pl.pindah) + '</g>');
      if (k < 4) {
        var cx = x + sisi + gap / 2, cy = yKotak + sisi / 2;
        if (pl.delta) o.push(S.busurPanah(cx, cy, 7, pl.delta > 0 ? -60 : 60, pl.delta > 0 ? 150 : -150, { warna: BH.panah, tebal: 1.8, kepala: 6 }));
        else o.push(S.panah(cx - 8, cy, cx + 8, cy, { warna: BH.panah, tebal: 1.8, kepala: 6 }));
      }
      var y = yKotak + sisi + 8;
      baris.forEach(function (fn) {
        o.push(teksBahas(fn(k), x + sisi / 2, y + 11, { anchor: 'middle', fill: jawab ? BH.jawab : BH.teks, weight: jawab ? 700 : null }));
        y += 16;
      });
      if (adaIsi) {
        var tt = f.unsur.filter(function (u) { return u.nama === 'penanda deret'; }), lebar = (tt.length - 1) * 11;
        tt.forEach(function (u, i) { o.push(S.lingkaran(x + sisi / 2 - lebar / 2 + i * 11, y + 7, 3.8, { isi: u.isi ? BH.sorot : '#ffffff', garis: BH.sorot, tebal: 1.3 })); });
      }
    });
    return { svg: R.doc(o.join(''), W, H, { background: '#ffffff' }), lebar: W, tinggi: H };
  }

  /** Empat pojok kotak: nomor kotak di pojok yang ditempatinya dan panah urutan perpindahannya. */
  function svgPojok(m, judul) {
    var pad = 8, sisi = 176, x0 = pad, y0 = pad + 26, c = sisi / 2, d = sisi / 4, o = [];
    var pojok = [0, 1, 2, 3, 4].map(function (k) { return mod(m.pindah.awal + m.pindah.langkah * k, 4); });
    var pusatQ = function (q) { return [x0 + c + POJOK[q][0] * d, y0 + c + POJOK[q][1] * d]; };
    var W = pad * 2 + sisi + 24 + 210, H = y0 + sisi + pad + 4;
    o.push(teksBahas(judul, pad, pad + 13, { size: 13, weight: 700 }));
    o.push(S.rect(x0, y0, sisi, sisi, { rx: 5, isi: '#ffffff', garis: '#9aa3b5', tebal: 1.4 }));
    var q5 = pusatQ(pojok[4]);
    o.push(S.rect(q5[0] - d + 3, q5[1] - d + 3, 2 * d - 6, 2 * d - 6, { rx: 4, isi: BH.latarJawab }));
    o.push(S.garis(x0 + c, y0 + 4, x0 + c, y0 + sisi - 4, { garis: '#cdd3df', tebal: 1, putus: '4 3' }));
    o.push(S.garis(x0 + 4, y0 + c, x0 + sisi - 4, y0 + c, { garis: '#cdd3df', tebal: 1, putus: '4 3' }));
    for (var k = 0; k < 4; k++) {
      var p = pusatQ(pojok[k]), q = pusatQ(pojok[k + 1]), dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy);
      var ux = dx / L, uy = dy / L;
      // panah agak menepi ke luar supaya tidak menimpa nomor kotak
      var luar = (POJOK[pojok[k]][0] + POJOK[pojok[k + 1]][0]) * 5, luarY = (POJOK[pojok[k]][1] + POJOK[pojok[k + 1]][1]) * 5;
      o.push(S.panah(p[0] + ux * 22 + luar, p[1] + uy * 22 + luarY, q[0] - ux * 22 + luar, q[1] - uy * 22 + luarY, { warna: BH.panah, tebal: 2.2, kepala: 8 }));
    }
    [0, 1, 2, 3].forEach(function (q) {
      var ks = []; pojok.forEach(function (pq, kk) { if (pq === q) ks.push(kk); });
      var pc = pusatQ(q), lebar = (ks.length - 1) * 24;
      ks.forEach(function (kk, i) {
        var bx = pc[0] - lebar / 2 + i * 24;
        o.push(S.lingkaran(bx, pc[1], 10.5, { isi: kk === 4 ? BH.jawab : BH.panah }));
        o.push(teksBahas(String(kk + 1), bx, pc[1] + 4.5, { size: 13, weight: 700, anchor: 'middle', fill: '#ffffff' }));
      });
    });
    var tx = x0 + sisi + 24, ty = y0 + 14;
    o.push(teksBahas('Urutan pojok:', tx, ty, { size: 12, weight: 700 }));
    pojok.forEach(function (q, kk) {
      o.push(teksBahas('Kotak ' + (kk + 1) + ': ' + NAMA_POJOK[q] + (kk === 4 ? ' (jawaban)' : ''), tx, ty + 20 + kk * 18, { size: 12, fill: kk === 4 ? BH.jawab : BH.teks, weight: kk === 4 ? 700 : null }));
    });
    var yA = ty + 20 + 5 * 18 + 10;
    o.push(S.busurPanah(tx + 9, yA, 8, m.pindah.langkah > 0 ? -60 : 60, m.pindah.langkah > 0 ? 200 : -200, { warna: BH.panah, tebal: 1.8, kepala: 6 }));
    o.push(teksBahas((m.pindah.langkah > 0 ? 'searah' : 'berlawanan arah') + ' jarum jam', tx + 24, yA + 4, { size: 12, fill: BH.panah, weight: 700 }));
    return { svg: R.doc(o.join(''), W, H, { background: '#ffffff' }), lebar: W, tinggi: H };
  }

  /**
   * Kotak 4 -> 5 diperbesar di sekitar pusat putarannya: bayangan abu-abu kotak 4 di belakang kotak 5,
   * arah unsur pembanding sebelum (abu-abu) dan sesudah (merah), serta busur sebesar sudut putarnya.
   */
  function svgSudut(m, judul) {
    var pad = 8, sisi = 170, gap = 100, y0 = pad + 26 + 16, o = [];
    var W = pad * 2 + sisi * 2 + gap, H = y0 + sisi + pad, c = sisi / 2;
    var sudutDari = function (v) { return Math.atan2(v[0], -v[1]) * 180 / Math.PI; };
    // kedua bentuk digeser sehingga pusat putarannya di tengah kotak, lalu diperbesar bersama
    var f4 = F.geser(m.k4, -m.pusat[0][0], -m.pusat[0][1]), f5 = F.geser(m.jawaban, -m.pusat[1][0], -m.pusat[1][1]);
    var jauh = 0;
    F.sampel(f4, 1.5).forEach(function (p) { jauh = Math.max(jauh, Math.hypot(p[0], p[1])); });
    var s = sisi * 0.3 / (jauh || 1);
    var arah = function (f) { var t = f.unsur[m.acuan].titik[m.ujung], L = Math.hypot(t[0], t[1]) || 1; return [t[0] / L, t[1] / L]; };
    var v4 = arah(f4), v5 = arah(f5), ujungSinar = sisi * 0.45, rb = sisi * 0.36;
    o.push(teksBahas(judul, pad, pad + 13, { size: 13, weight: 700 }));
    [f4, f5].forEach(function (f, i) {
      var x = pad + i * (sisi + gap), jawab = i === 1, v = jawab ? v5 : v4, isi = [];
      o.push(teksBahas(jawab ? 'Kotak 5 (jawaban)' : 'Kotak 4', x + c, y0 - 6, { anchor: 'middle', weight: 700, fill: jawab ? BH.jawab : BH.teks }));
      isi.push(S.rect(0.5, 0.5, sisi - 1, sisi - 1, { rx: sisi * 0.03, isi: jawab ? BH.latarJawab : '#ffffff', garis: jawab ? BH.jawab : '#9aa3b5', tebal: jawab ? 2.5 : 1 }));
      if (jawab) {
        // bayangan kotak 4 (abu-abu muda) dan arah lamanya
        isi.push(R.kotak(f4, sisi, { skala: s, warna: f4.unsur.map(function () { return '#c3c9d4'; }), bingkai: false }).svg);
        isi.push(S.garis(c, c, c + v4[0] * ujungSinar, c + v4[1] * ujungSinar, { garis: BH.redup, tebal: 1.6, putus: '5 3' }));
      }
      isi.push(R.kotak(f, sisi, { skala: s, warna: warnaUnsur(f, m.acuan, false), bingkai: false }).svg);
      isi.push(S.garis(c, c, c + v[0] * ujungSinar, c + v[1] * ujungSinar, { garis: BH.acuan, tebal: 1.6, putus: '5 3' }));
      if (jawab) {
        var a4 = sudutDari(v4);
        isi.push(S.busurPanah(c, c, rb, a4, a4 + m.delta, { warna: BH.panah, tebal: 2.2, kepala: 8, halo: true }));
        var pl = S.titikSudut(c, c, rb + 13, a4 + m.delta / 2);
        isi.push(teksBahas(Math.abs(m.delta) + '°', pl[0], pl[1] + 4, { size: 12, weight: 700, anchor: 'middle', fill: BH.panah }));
      }
      isi.push(S.lingkaran(c, c, 4.4, { isi: BH.panah, garis: '#ffffff', tebal: 1.4 }));
      o.push('<g transform="translate(' + x + ',' + y0 + ')">' + isi.join('') + '</g>');
    });
    // panah peralihan dan keterangannya di antara kedua kotak
    var mx = pad + sisi + gap / 2, my = y0 + sisi / 2;
    o.push(S.busurPanah(mx, my - 22, 13, m.delta > 0 ? -70 : 70, m.delta > 0 ? 200 : -200, { warna: BH.panah, tebal: 2, kepala: 7 }));
    o.push(teksBahas('putar ' + Math.abs(m.delta) + '°', mx, my + 6, { size: 12, weight: 700, anchor: 'middle', fill: BH.panah }));
    o.push(teksBahas(m.delta > 0 ? 'searah' : 'berlawanan', mx, my + 20, { size: 11, anchor: 'middle', fill: BH.panah }));
    o.push(teksBahas(m.delta > 0 ? 'jarum jam' : 'arah jarum jam', mx, my + 33, { size: 11, anchor: 'middle', fill: BH.panah }));
    o.push(S.panah(mx - 34, my + 46, mx + 34, my + 46, { warna: BH.panah, tebal: 2, kepala: 8 }));
    return { svg: R.doc(o.join(''), W, H, { background: '#ffffff' }), lebar: W, tinggi: H };
  }

  var KELUARGA = [{ id: 'serial-putar', nama: 'Deret bentuk figural yang berputar', submateri: 'figural' }];

  return {
    KELUARGA: KELUARGA, buat: buat, svgSerial: svgSerial, svgFigur: svgFigur, PERINTAH: PERINTAH,
    svgTahap: svgTahap, svgPojok: svgPojok, svgSudut: svgSudut
  };
});
