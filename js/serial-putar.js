/*
 * serial-putar.js — Kemampuan Umum > Figural > Serial dengan bentuk figural yang berputar.
 *
 * Diadaptasi dari mesin Serial pada Figural Kesesuaian Generator (quiz.js): empat
 * kotak berurutan, tebak kotak kelima. Tiap langkah memutar SELURUH pola sebesar
 * delta, dan boleh disertai satu titik penanda tambahan serta isi titik yang
 * berselang-seling. Bentuk dasarnya dibangkitkan oleh `families.js` (delapan
 * keluarga bentuk) dan dijamin kiral serta tidak simetri putar, jadi sudut putar
 * dan pencerminan selalu terbaca tegas.
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
    api = factory(require('./figure.js'), require('./families.js'), require('./render.js'), require('./rng.js'), require('./butir.js'), require('./format.js'));
    module.exports = api;
  } else {
    api = factory(root.Figure, root.Families, root.Render, root.Rng, root.Butir, root.Fmt);
    root.SerialPutar = api;
  }
})(typeof self !== 'undefined' ? self : this, function (F, Fam, R, Rng, Butir, Fmt) {
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

  function buatSerial(dasar, a, tingkat) {
    var delta = a.pilih(tingkat === 'mudah' ? [45, 90] : [30, 45, 60, 90]);
    if (a.untung(0.35)) delta = -delta;
    var tumbuh = a.untung(tingkat === 'mudah' ? 0.45 : 0.65);
    var selang = tumbuh && a.untung(0.5);
    var jang = F.jangkauan(dasar), jariTitik = jang * 0.10, jariCincin = jang * 1.12;

    function suku(k, o) {
      o = o || {};
      var n = tumbuh ? k + 1 + (o.tambahJumlah || 0) : 0, u = dasar.unsur.slice();
      for (var i = 0; i < n; i++) {
        var ar = (-90 + i * 52) * Math.PI / 180;
        var isi = selang ? (((i + (o.balikIsi ? 1 : 0)) % 2 === 0) ? '#111' : null) : '#111';
        u.push({ jenis: 'bulat', jari: jariTitik, isi: isi, tebal: 1, nama: 'penanda deret', pusat: [jariCincin * Math.cos(ar), jariCincin * Math.sin(ar)] });
      }
      var f = F.pusatkan({ unsur: u, keluarga: dasar.keluarga, benih: dasar.benih });
      return F.putar(f, delta * (k + (o.tambahPutaran || 0)));
    }

    var deret = [suku(0), suku(1), suku(2), suku(3)];
    var kunci = suku(4);
    var pilihan = [{
      fig: kunci, benar: true,
      alasan: 'kotak kelima meneruskan ketiga aturan sekaligus: pola diputar ' + arahPutarBertanda(delta) + ' dari kotak keempat' +
        (tumbuh ? ', jumlah titik penandanya menjadi lima' : '') + (selang ? ', dan isi titiknya tetap berselang-seling hitam dan kosong' : '')
    }];
    var dipakai = [kunci], calon = [];
    calon.push({ fig: suku(4, { tambahPutaran: -1 }), alasan: 'putarannya kurang satu langkah: gambar ini masih pada sudut kotak keempat, padahal setiap kotak bertambah ' + Math.abs(delta) + ' derajat' });
    calon.push({ fig: suku(4, { tambahPutaran: 1 }), alasan: 'putarannya kelebihan satu langkah, yaitu ' + Math.abs(delta * 2) + ' derajat dari kotak keempat, bukan ' + Math.abs(delta) + ' derajat' });
    if (tumbuh) {
      calon.push({ fig: suku(4, { tambahJumlah: -1 }), alasan: 'jumlah titik penandanya berhenti di empat, padahal bertambah satu titik pada setiap kotak sehingga kotak kelima berisi lima titik' });
      calon.push({ fig: suku(4, { tambahJumlah: 1 }), alasan: 'titik penandanya berjumlah enam: bertambah dua sekaligus dari kotak keempat, padahal pertambahannya satu per kotak' });
    }
    if (selang) calon.push({ fig: suku(4, { balikIsi: true }), alasan: 'urutan isi titiknya terbalik: yang seharusnya hitam menjadi kosong dan sebaliknya' });
    calon.push({ fig: F.pusatkan(F.cermin(kunci)), alasan: 'gambarnya merupakan bayangan cermin dari lanjutan yang benar; deret ini hanya berputar, tidak pernah tercermin' });

    calon = a.kocok(calon);
    for (var i = 0; i < calon.length && pilihan.length < 5; i++) {
      if (!layakPengecoh(calon[i].fig) || adaKembar(calon[i].fig, dipakai)) continue;
      pilihan.push({ fig: calon[i].fig, benar: false, alasan: calon[i].alasan });
      dipakai.push(calon[i].fig);
    }
    var alasanDipakai = pilihan.map(function (p) { return p.alasan; });
    while (pilihan.length < 5) {
      var p = cariPengecoh(kunci, dipakai, a, tingkat, alasanDipakai);
      if (!p) return null;
      pilihan.push({ fig: p.fig, benar: false, alasan: p.alasan });
      dipakai.push(p.fig);
      alasanDipakai.push(p.alasan);
    }
    return { dasar: dasar, deret: deret, pilihan: pilihan, pola: { delta: delta, tumbuh: tumbuh, selang: selang } };
  }

  // ------------------------------------------------------------------- butir

  function buat(id, level, benih, opsi) {
    opsi = opsi || {};
    var a0 = Rng.alat(benih);
    var target = opsi.target == null ? a0.bulat(0, 4) : opsi.target;
    var boleh = Fam.daftarKeluarga(opsi.keluarga || 'campur');
    var keluarga = boleh.length === 1 ? boleh[0] : Rng.alat((benih >>> 0) ^ 0x63a7f19b).pilih(boleh);
    for (var c = 0; c < 10; c++) {
      var benihKini = (benih + c * 0x27d4eb2f) >>> 0;
      var a = Rng.alat(benihKini ^ 0x1b873593);
      var dasar = Fam.bangkitkan(keluarga, benihKini);
      var inti = buatSerial(dasar, a, level);
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
      var skala = R.skalaBersama(semuaFig, 100, 0.10);
      var pembahasan = ['Kita perhatikan keseluruhan gambar dari kotak ke kotak. Aturan yang berlaku:',
        '• seluruh objek diputar ' + Math.abs(inti.pola.delta) + ' derajat ' + (inti.pola.delta > 0 ? 'searah' : 'berlawanan arah') + ' jarum jam pada setiap kotak;'];
      if (inti.pola.tumbuh) pembahasan.push('• jumlah titik penandanya bertambah satu pada setiap kotak, yaitu 1, 2, 3, 4, lalu 5;');
      if (inti.pola.selang) pembahasan.push('• isi titiknya berselang-seling: hitam, kosong, hitam, dan seterusnya.');
      pembahasan.push('Meneruskan aturan itu ke kotak kelima, gambar yang tepat adalah opsi ' + Fmt.huruf(target) + '.');

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
        sidik: { inti: 'serial-putar|' + dasar.keluarga + '|' + dasar.benih + '|' + inti.pola.delta + inti.pola.tumbuh + inti.pola.selang, param: [], entitas: dasar.keluarga }
      });
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

  var KELUARGA = [{ id: 'serial-putar', nama: 'Deret bentuk figural yang berputar', submateri: 'figural' }];

  return { KELUARGA: KELUARGA, buat: buat, svgSerial: svgSerial, svgFigur: svgFigur, PERINTAH: PERINTAH };
});
