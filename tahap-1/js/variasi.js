/* Bank tambahan: pola cerita, tabel, grafik batang, dan garis interaktif.
 * Rumus memakai bahasa langkah yang dihitung ulang validator dengan pecahan eksak.
 * Data tabel/grafik dibaca validator dari gambar; tidak digandakan sebagai parameter.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./rng.js'), require('./format.js'), require('./kamus.js'), require('./butir.js'), require('./rumus.js'));
  else root.Variasi = factory(root.Rng, root.Fmt, root.Kamus, root.Butir, root.Rumus);
})(typeof self !== 'undefined' ? self : this, function (Rng, Fmt, Kamus, Butir, Rumus) {
  'use strict';

  function angka(n) { return Fmt.angka(n, { desimal: 2 }); }
  /** Nominal dolar: tanpa desimal bila bulat, dua desimal tetap bila ada sen. */
  function dolar(n) { return Fmt.uang(n, '$', Math.abs(n - Math.round(n)) < 0.005 ? 0 : 2, true); }
  /** Teks pilihan: "%" menempel pada angka, satuan berawalan "$" berarti nominal dolar ("$ per kg"), selain itu di belakang. */
  function fmtSatuan(satuan) {
    if (satuan === '%') return function (v) { return angka(v) + '%'; };
    if (satuan && satuan.charAt(0) === '$') return function (v) { return dolar(v) + satuan.slice(1); };
    return function (v) { return angka(v) + (satuan ? ' ' + satuan : ''); };
  }
  /**
   * Pengecoh dari satu jalur kesalahan yang dapat diulang: nama kesalahan, hitungannya dengan
   * angka soal, dan hasil yang tercetak sebagai pilihan, mis. "mengabaikan waktu berhenti: 480 ÷ 7 = 68,57 km/jam".
   */
  function jalur(nilai, salahnya, hitungan, fmt) {
    var t = isFinite(nilai) ? fmt(nilai) : null;
    return { nilai: nilai, alasan: t == null ? null : salahnya + ': ' + hitungan + ' = ' + t };
  }
  // ---- pembahasan soal hitungan Kemampuan Umum (cerita, tabel, grafik): Diketahui, Ditanyakan, Pengerjaan,
  // Kesimpulan; rumus dan hitungan sebagai baris persamaan "§ ..." (lihat rumus.js). "=" hanya untuk hasil
  // yang tepat, "\approx" untuk hasil yang dibulatkan; validator memeriksa setiap relasi.
  function R(notasi) { return Rumus.baris(notasi); }
  /** Angka pada baris persamaan: titik ribuan, koma desimal "{,}". */
  function E(v, d, tetap) { return Fmt.angka(v, { desimal: d == null ? 2 : d, tetap: !!tetap }).replace(',', '{,}'); }
  /** Nominal dolar pada baris persamaan: \$1.250 atau \$22{,}50. */
  function ED(v) { return '\\$' + E(v, 2, Math.abs(v - Math.round(v)) > 1e-9); }
  /** Kata atau satuan tegak pada baris persamaan. */
  function T(s) { return '\\text{' + s + '}'; }
  /** Relasi dan nilai dengan `d` desimal: "= 74" bila tepat, "\approx 73{,}13" bila dibulatkan. */
  function samaE(v, d) { var p = Math.pow(10, d == null ? 2 : d); return (Math.abs(v * p - Math.round(v * p)) < 1e-7 ? '= ' : '\\approx ') + E(v, d); }
  /** Seperti samaE untuk nominal dolar (dibulatkan ke sen). */
  function samaD(v) { var sen = Math.round(v * 100) / 100; return (Math.abs(v * 100 - Math.round(v * 100)) < 1e-7 ? '= ' : '\\approx ') + ED(sen); }
  /** "adalah" untuk hasil tepat, "kira-kira" untuk hasil yang dibulatkan ke `d` desimal (kalimat Kesimpulan). */
  function kataHasil(v, d) { var p = Math.pow(10, d == null ? 2 : d); return Math.abs(v * p - Math.round(v * p)) < 1e-7 ? 'adalah ' : 'kira-kira '; }
  /** Pecahan sederhana n/d pada baris persamaan (bilangan bulat bila penyebutnya 1). */
  function FR(n, d) { var g = fpb(Math.abs(n), Math.abs(d)) || 1; n /= g; d /= g; return d === 1 ? String(n) : '\\frac{' + n + '}{' + d + '}'; }
  function fpb(a, b) { while (b) { var t = a % b; a = b; b = t; } return a; }
  /** Pembahasan soal hitungan; `{HURUF}` diisi huruf kunci oleh Butir. */
  function bahasHitung(diketahui, ditanyakan, pengerjaan, kesimpulan) {
    return ['Diketahui'].concat(diketahui, ['Ditanyakan', ditanyakan, 'Pengerjaan'], pengerjaan, ['Kesimpulan', kesimpulan + ' Jawaban: {HURUF}.']);
  }
  /** Keluarga tambahan tim (bukan salinan bentuk contoh riset). */
  function pengayaan(s, catatan, pola) {
    s.kategoriRiset = 'pengayaan'; s.catatanRiset = catatan;
    if (pola) s.pola = pola;
    return s;
  }
  /** Sedikitnya empat jalur kesalahan yang sah (beralasan, dalam batas, berbeda teks, bukan kunci), seperti saringan Pilihan.susun. */
  function cukupPengecoh(s) {
    if (s.pilihanJadi) return true;
    var lihat = {}, n = 0;
    lihat[s.fmt(s.kunci)] = true;
    (s.pengecoh || []).forEach(function (p) {
      if (!p.alasan || typeof p.nilai !== 'number' || !isFinite(p.nilai)) return;
      if ((s.min != null && p.nilai < s.min) || (s.maks != null && p.nilai > s.maks)) return;
      if (s.bulat && Math.abs(p.nilai - Math.round(p.nilai)) > 1e-9) return;
      if (Math.abs(p.nilai - s.kunci) < 1e-12) return;
      var t = s.fmt(p.nilai);
      if (t == null || lihat[t]) return;
      lihat[t] = true; n++;
    });
    return n >= 4;
  }
  /**
   * Keluarga pilihan ganda diundi ulang (dengan pengacak yang sama, jadi tetap deterministik) sampai
   * jalur kesalahannya cukup; tanpa angka tambalan, beberapa kombinasi angka memang tidak memberi
   * empat pengecoh yang berbeda.
   */
  function sampaiCukup(fn) {
    return function (a, level) {
      for (var coba = 0; coba < 60; coba++) {
        var s = fn(a, level);
        if (s && cukupPengecoh(s)) return s;
      }
      return null;
    };
  }
  function langkah(nama, rumus) { return { nama: nama, rumus: rumus }; }
  function jumlah(xs) { return xs.reduce(function (s, x) { return s + x; }, 0); }
  /** `pengecoh` boleh berupa fungsi (fmt) -> daftar jalur, supaya alasan memakai format pilihan yang sama. */
  function spec(teks, tanya, nilai, satuan, param, steps, bahas, pengecoh) {
    var p = {}, tampil = {}, fmt = fmtSatuan(satuan);
    Object.keys(param).forEach(function (k) { p[k] = String(param[k]); tampil[k] = angka(param[k]); });
    return {
      teks: teks ? [teks] : [], pertanyaan: tanya, kunci: nilai,
      fmt: fmt,
      min: 0, langkah: steps, pembahasan: bahas, pengecoh: typeof pengecoh === 'function' ? pengecoh(fmt) : pengecoh,
      model: { param: p, tampil: tampil, toleransi: 0.00501 }
    };
  }

  function kerja(a, level) {
    var konteks = a.pilih(['memeriksa satu kumpulan berkas', 'mendigitalisasi satu arsip', 'menyelesaikan satu pesanan kemasan']);
    var p = a.bulat(2, 5), q = a.bulat(2, 6), skala = a.bulat(1, 3);
    var A = p * (p + q) * skala, B = q * (p + q) * skala;
    var s = level === 'mudah' ? 0 : (p + q) * a.bulat(1, p * skala - 1);
    var bersama = (1 - s / A) / (1 / A + 1 / B), total = s + bersama;
    var teks = 'Tim A dapat ' + konteks + ' dalam ' + A + ' hari, sedangkan tim B memerlukan ' + B + ' hari untuk pekerjaan yang sama. Kecepatan kerja masing-masing tim tetap dan hasil kerja keduanya dapat dijumlahkan.';
    var param = { A: A, B: B }, steps = [langkah('laju', '1/A+1/B')];
    if (s) { teks += ' Tim A bekerja sendiri selama ' + s + ' hari, kemudian tim B bergabung sampai pekerjaan selesai.'; param.s = s; }
    else teks += ' Keduanya mulai bekerja bersama pada saat yang sama.';
    steps.push(langkah('sisa', s ? '1-s/A' : '1'), langkah('bersama', 'sisa/laju'), langkah('jawab', level === 'sulit' ? 's+bersama' : 'bersama'));
    var cepat = Math.min(A, B), lambat = Math.max(A, B), sisa = 1 - s / A, sisaT = s ? '(1 - ' + s + '/' + A + ')' : '1';
    var awal = level === 'sulit' ? s : 0, awalT = level === 'sulit' ? s + ' + ' : '';
    var kaliSisa = function (t) { return s ? sisaT + ' × ' + t : t; };
    // laju gabungan sebagai pecahan: 1/A + 1/B disamakan penyebutnya (KPK A dan B)
    var kpk = A * B / fpb(A, B), lajuN = kpk / A + kpk / B, sisaE = FR(A - s, A);
    var olah = [
      'Laju kerja = bagian pekerjaan yang selesai dalam satu hari, yaitu 1 dibagi lama pengerjaan. Laju dua tim yang bekerja bersama dijumlahkan:',
      R(T('laju gabungan') + ' = \\frac{1}{' + A + '} + \\frac{1}{' + B + '} = \\frac{' + kpk / A + '}{' + kpk + '} + \\frac{' + kpk / B + '}{' + kpk + '} = ' + FR(lajuN, kpk) + '\\ ' + T('pekerjaan per hari'))
    ];
    if (s) olah.push('Selama ' + s + ' hari, tim A sudah menyelesaikan ' + s + '/' + A + ' bagian pekerjaan, sehingga sisanya:', R(T('sisa') + ' = 1 - \\frac{' + s + '}{' + A + '} = ' + sisaE));
    else olah.push('Kedua tim mengerjakan satu pekerjaan utuh bersama-sama.');
    olah.push('Lama kerja bersama = bagian yang dikerjakan bersama dibagi laju gabungan:',
      R('t = ' + (s ? sisaE : '1') + ' \\div ' + FR(lajuN, kpk) + ' = ' + (s ? sisaE : '1') + ' \\times ' + FR(kpk, lajuN) + ' ' + samaE(bersama) + '\\ ' + T('hari')));
    if (level === 'sulit') olah.push('Lama seluruh pekerjaan dihitung sejak tim A mulai, jadi ditambah ' + s + ' hari ketika tim A bekerja sendiri:', R(T('total') + ' = ' + s + ' + ' + E(bersama) + ' ' + samaE(total) + '\\ ' + T('hari')));
    var s1 = pengayaan(spec(teks, level === 'sulit' ? 'Berapa lama seluruh pekerjaan berlangsung sejak tim A mulai bekerja?' : 'Berapa hari kedua tim perlu bekerja bersama untuk menyelesaikan pekerjaan tersebut?',
      level === 'sulit' ? total : bersama, 'hari', param, steps,
      bahasHitung(['Tim A menyelesaikan satu pekerjaan dalam ' + A + ' hari; tim B memerlukan ' + B + ' hari untuk pekerjaan yang sama.',
        s ? 'Tim A bekerja sendiri selama ' + s + ' hari, lalu tim B bergabung sampai pekerjaan selesai.' : 'Kedua tim mulai bekerja bersama pada saat yang sama.'],
      level === 'sulit' ? 'Lama seluruh pekerjaan sejak tim A mulai bekerja.' : 'Lama kedua tim bekerja bersama sampai pekerjaan selesai.', olah,
      level === 'sulit' ? 'Jadi, seluruh pekerjaan berlangsung ' + angka(total) + ' hari sejak tim A mulai bekerja.' : 'Jadi, kedua tim perlu bekerja bersama selama ' + angka(bersama) + ' hari.'),
      function (fm) {
        var j = [
          jalur(awal + sisa * (A + B) / 2, 'merata-ratakan waktu kedua tim, padahal yang dijumlahkan adalah laju kerja', awalT + kaliSisa('(' + A + ' + ' + B + ') ÷ 2'), fm),
          jalur(awal + sisa * (A + B), 'menjumlahkan waktu kerja kedua tim', awalT + kaliSisa('(' + A + ' + ' + B + ')'), fm),
          jalur(awal + sisa * cepat / 2, 'menganggap dua tim berarti setengah waktu tim yang lebih cepat', awalT + kaliSisa(cepat + ' ÷ 2'), fm),
          jalur(awal + sisa * lambat / 2, 'menganggap dua tim berarti setengah waktu tim yang lebih lambat', awalT + kaliSisa(lambat + ' ÷ 2'), fm),
          jalur(awal + sisa * A * B / (lambat - cepat), 'mengurangkan laju kedua tim, bukan menjumlahkannya', awalT + sisaT + ' ÷ (1/' + cepat + ' - 1/' + lambat + ')', fm)
        ];
        if (s) {
          j.unshift(jalur(awal + 1 / (1 / A + 1 / B), 'tidak mengurangi bagian yang sudah dikerjakan tim A sendiri', awalT + '1 ÷ (1/' + A + ' + 1/' + B + ')', fm));
          j.splice(2, 0, jalur(awal + sisa * B, 'menganggap sisa pekerjaan dikerjakan tim B saja', awalT + kaliSisa(B), fm));
          j.push(jalur(level === 'sulit' ? bersama : total, level === 'sulit' ? 'hanya menghitung masa kerja bersama, lupa menambahkan ' + s + ' hari tim A bekerja sendiri' : 'menjawab lama seluruh pekerjaan sejak tim A mulai, bukan masa kerja bersama',
            level === 'sulit' ? sisaT + ' ÷ (1/' + A + ' + 1/' + B + ')' : s + ' + ' + angka(bersama), fm));
        }
        j.push(jalur(1 / A + 1 / B, 'menjawab laju gabungan (bagian pekerjaan per hari), bukan lamanya', '1/' + A + ' + 1/' + B, fm));
        if (s && level !== 'sulit') j.push(jalur(s, 'menjawab lama tim A bekerja sendiri', 'waktu kerja tim A sebelum tim B bergabung', fm));
        return j;
      }), 'Tambahan tim: laju kerja gabungan dua tim (mengerjakan bersama, dengan atau tanpa mulai lebih dulu).');
    return s1;
  }

  function perjalanan(a, level) {
    var nama = a.pilih(Kamus.NAMA_ORANG), v1 = a.pilih([30, 40, 50, 60]), v2 = a.pilih([45, 60, 75, 90]);
    var h1 = a.bulat(2, 5), h2 = a.bulat(1, 4), d1 = v1 * h1, d2 = v2 * h2;
    var ist = level === 'mudah' ? 0 : a.pilih(level === 'sedang' ? [15, 30] : [20, 40, 50]);
    var teks = nama + ' menempuh ruas pertama sejauh ' + d1 + ' km dengan kecepatan tetap ' + v1 + ' km/jam, lalu ruas kedua sejauh ' + d2 + ' km dengan kecepatan tetap ' + v2 + ' km/jam.';
    var param = { d1: d1, v1: v1, d2: d2, v2: v2 };
    if (ist) { teks += ' Di antara kedua ruas, ia berhenti selama ' + ist + ' menit.'; param.ist = ist; }
    else teks += ' Ia tidak berhenti selama perjalanan.';
    var waktu = h1 + h2 + ist / 60, hasil = (d1 + d2) / waktu, D = d1 + d2, h = h1 + h2;
    // bila rata-rata kebetulan sama dengan kecepatan salah satu ruas, jarak ruas itu tidak memengaruhi jawaban
    if (Math.abs(hasil - v1) < 1e-9 || Math.abs(hasil - v2) < 1e-9) return null;
    var waktuT = ist ? '(' + h + ' + ' + ist + '/60)' : h;
    // waktu berhenti dalam jam: pecahan bila tidak habis dibagi (20 menit = 1/3 jam)
    var istE = FR(ist, 60), waktuE = FR(h * 60 + ist, 60), jam = '\\ ' + T('jam');
    var olah = [
      'Kecepatan rata-rata = total jarak dibagi total waktu, termasuk waktu berhenti (bukan rata-rata kedua kecepatan):',
      R('v_{' + T('rata-rata') + '} = \\frac{' + T('total jarak') + '}{' + T('total waktu') + '}'),
      'Waktu tiap ruas = jarak dibagi kecepatan:',
      R('t_{1} = \\frac{' + d1 + '}{' + v1 + '} = ' + h1 + jam + ',\\quad t_{2} = \\frac{' + d2 + '}{' + v2 + '} = ' + h2 + jam)
    ];
    if (ist) olah.push('Waktu berhenti diubah ke jam (1 jam = 60 menit):', R(ist + '\\ ' + T('menit') + ' = \\frac{' + ist + '}{60}' + jam + ' = ' + istE + jam));
    olah.push(R(T('total waktu') + ' = ' + h1 + ' + ' + h2 + (ist ? ' + ' + istE : '') + ' = ' + waktuE + jam),
      R(T('total jarak') + ' = ' + d1 + ' + ' + d2 + ' = ' + D + '\\ ' + T('km')),
      R('v_{' + T('rata-rata') + '} = ' + (waktuE.indexOf('frac') < 0 ? '\\frac{' + D + '}{' + waktuE + '}'
        : D + ' \\div ' + waktuE + ' = \\frac{' + D + ' \\times ' + 60 / fpb(h * 60 + ist, 60) + '}{' + (h * 60 + ist) / fpb(h * 60 + ist, 60) + '}') + ' ' + samaE(hasil) + '\\ ' + T('km/jam')));
    return pengayaan(spec(teks, 'Berapa kecepatan rata-rata untuk seluruh perjalanan, termasuk waktu berhenti jika ada? Bulatkan sampai dua angka di belakang koma.', hasil, 'km/jam', param,
      [langkah('waktu', 'd1/v1+d2/v2' + (ist ? '+ist/60' : '')), langkah('jawab', '(d1+d2)/waktu')],
      bahasHitung(['Ruas pertama: ' + d1 + ' km dengan kecepatan tetap ' + v1 + ' km/jam.', 'Ruas kedua: ' + d2 + ' km dengan kecepatan tetap ' + v2 + ' km/jam.',
        ist ? 'Berhenti di antara kedua ruas selama ' + ist + ' menit.' : 'Tidak ada waktu berhenti.'],
      'Kecepatan rata-rata seluruh perjalanan, dibulatkan sampai dua angka di belakang koma.', olah,
      'Jadi, kecepatan rata-rata seluruh perjalanan ' + (Math.abs(hasil * 100 - Math.round(hasil * 100)) < 1e-7 ? 'adalah ' : 'kira-kira ') + angka(hasil) + ' km/jam.'),
      function (fm) {
        var j = [];
        if (ist) j.push(jalur(D / h, 'mengabaikan waktu berhenti', D + ' ÷ ' + h, fm));
        j.push(jalur((v1 + v2) / 2, 'merata-ratakan kedua kecepatan tanpa memperhatikan lama tiap ruas', '(' + v1 + ' + ' + v2 + ') ÷ 2', fm));
        if (ist) j.push(jalur(D / (h + ist / 100), 'menulis ' + ist + ' menit sebagai ' + angka(ist / 100) + ' jam', D + ' ÷ (' + h + ' + ' + angka(ist / 100) + ')', fm));
        j.push(jalur((d1 * v1 + d2 * v2) / D, 'merata-ratakan kecepatan dengan bobot jarak, bukan bobot waktu', '(' + d1 + ' × ' + v1 + ' + ' + d2 + ' × ' + v2 + ') ÷ ' + D, fm));
        j.push(jalur(2 * v1 * v2 / (v1 + v2), 'memakai rumus kecepatan rata-rata untuk dua ruas yang sama panjang', '2 × ' + v1 + ' × ' + v2 + ' ÷ (' + v1 + ' + ' + v2 + ')', fm));
        if (ist) j.push(jalur(D / (h + ist), 'memperlakukan ' + ist + ' menit berhenti sebagai ' + ist + ' jam', D + ' ÷ (' + h + ' + ' + ist + ')', fm));
        j.push(jalur(d1 / waktu, 'hanya memakai jarak ruas pertama', d1 + ' ÷ ' + waktuT, fm));
        j.push(jalur(d2 / waktu, 'hanya memakai jarak ruas kedua', d2 + ' ÷ ' + waktuT, fm));
        return j;
      }), 'Tambahan tim: kecepatan rata-rata dua ruas dengan waktu berhenti.');
  }

  /**
   * Rata-rata gabungan dua kelompok yang ukurannya berbeda. Mudah: ukuran kelipatan 5.
   * Sulit (kebalikan): rata-rata gabungan diketahui; total peserta 20, 25, atau 50 supaya
   * rata-rata gabungan yang tercetak eksak dengan dua desimal.
   */
  function rata(a, level) {
    for (var coba = 0; coba < 200; coba++) {
      var n = a.bulat(10, 35), m = a.bulat(10, 35), x = a.bulat(55, 75), y = a.bulat(76, 95);
      if (level === 'mudah') { n = a.bulat(2, 7) * 5; m = a.bulat(2, 7) * 5; }
      if (level === 'sulit') { var nm = a.pilih([20, 25, 50]); n = a.bulat(Math.ceil(nm * 0.3), Math.floor(nm * 0.7)); m = nm - n; }
      if (n === m) continue;
      var gab = (n * x + m * y) / (n + m);
      if (level === 'sulit' && Math.abs(gab * 100 - Math.round(gab * 100)) > 1e-6) continue;
      break;
    }
    var teks = 'Dalam pelatihan di ' + a.pilih(Kamus.KOTA) + ', kelompok A berisi ' + n + ' peserta dengan rata-rata nilai ' + x + '. Kelompok B berisi ' + m + ' peserta';
    var param = { n: n, m: m, x: x }, formula, hasil, N = n + m, G = angka(gab), J = n * x + m * y;
    if (level === 'sulit') { teks += '. Rata-rata nilai seluruh peserta adalah ' + G + '.'; param.gab = gab; formula = '(gab*(n+m)-n*x)/m'; hasil = y; }
    else { teks += ' dengan rata-rata nilai ' + y + '.'; param.y = y; formula = '(n*x+m*y)/(n+m)'; hasil = gab; }
    var olah = ['Rata-rata = jumlah nilai dibagi banyak peserta, jadi jumlah nilai suatu kelompok = banyak peserta × rata-ratanya.'];
    if (level === 'sulit') {
      olah.push(R(T('jumlah nilai semua peserta') + ' = ' + E(gab) + ' \\times ' + N + ' = ' + E(J)),
        R(T('jumlah nilai kelompok A') + ' = ' + n + ' \\times ' + x + ' = ' + E(n * x)),
        'Jumlah nilai kelompok B adalah selisihnya, lalu dibagi banyak peserta kelompok B:',
        R(T('rata-rata B') + ' = \\frac{' + E(J) + ' - ' + E(n * x) + '}{' + m + '} = \\frac{' + E(J - n * x) + '}{' + m + '} ' + samaE(y)));
    } else {
      olah.push(R(T('jumlah nilai A') + ' = ' + n + ' \\times ' + x + ' = ' + E(n * x) + ',\\quad ' + T('jumlah nilai B') + ' = ' + m + ' \\times ' + y + ' = ' + E(m * y)),
        'Rata-rata gabungan = jumlah nilai kedua kelompok dibagi banyak seluruh peserta:',
        R(T('rata-rata gabungan') + ' = \\frac{' + E(n * x) + ' + ' + E(m * y) + '}{' + n + ' + ' + m + '} = \\frac{' + E(J) + '}{' + N + '} ' + samaE(gab)));
    }
    var s = spec(teks, (level === 'sulit' ? 'Berapa rata-rata nilai kelompok B?' : 'Berapa rata-rata nilai seluruh peserta?') + ' Bulatkan sampai dua angka di belakang koma.', hasil, '', param,
      [langkah('jawab', formula)],
      bahasHitung(['Kelompok A: ' + n + ' peserta dengan rata-rata nilai ' + x + '.', level === 'sulit' ? 'Kelompok B: ' + m + ' peserta; rata-rata nilai seluruh ' + N + ' peserta = ' + G + '.' : 'Kelompok B: ' + m + ' peserta dengan rata-rata nilai ' + y + '.'],
        level === 'sulit' ? 'Rata-rata nilai kelompok B.' : 'Rata-rata nilai seluruh peserta (gabungan kedua kelompok), dibulatkan sampai dua angka di belakang koma.', olah,
        level === 'sulit' ? 'Jadi, rata-rata nilai kelompok B adalah ' + angka(y) + '.' : 'Jadi, rata-rata nilai seluruh peserta ' + (Math.abs(gab * 100 - Math.round(gab * 100)) < 1e-7 ? 'adalah ' : 'kira-kira ') + G + '.'),
      function (fm) {
        if (level === 'sulit') return [
          jalur(2 * gab - x, 'menganggap kedua kelompok sama besar', '2 × ' + G + ' - ' + x, fm),
          jalur((J - n * x) / N, 'membagi selisih jumlah nilai dengan seluruh peserta, bukan dengan peserta kelompok B', '(' + G + ' × ' + N + ' - ' + n + ' × ' + x + ') ÷ ' + N, fm),
          jalur((J - n * x) / n, 'membagi dengan banyak peserta kelompok A', '(' + G + ' × ' + N + ' - ' + n + ' × ' + x + ') ÷ ' + n, fm),
          jalur((J - m * x) / n, 'menukar banyak peserta kedua kelompok', '(' + G + ' × ' + N + ' - ' + m + ' × ' + x + ') ÷ ' + n, fm),
          jalur((J - m * x) / m, 'mengalikan rata-rata kelompok A dengan banyak peserta kelompok B', '(' + G + ' × ' + N + ' - ' + m + ' × ' + x + ') ÷ ' + m, fm)
        ];
        return [
          jalur((x + y) / 2, 'memberi bobot sama tanpa memperhitungkan banyak peserta', '(' + x + ' + ' + y + ') ÷ 2', fm),
          jalur((m * x + n * y) / N, 'menukar bobot kedua kelompok', '(' + m + ' × ' + x + ' + ' + n + ' × ' + y + ') ÷ ' + N, fm),
          jalur(J / n, 'membagi jumlah nilai dengan banyak peserta kelompok A saja', '(' + n + ' × ' + x + ' + ' + m + ' × ' + y + ') ÷ ' + n, fm),
          jalur(J / m, 'membagi jumlah nilai dengan banyak peserta kelompok B saja', '(' + n + ' × ' + x + ' + ' + m + ' × ' + y + ') ÷ ' + m, fm),
          jalur(n > m ? x : y, 'hanya memakai rata-rata kelompok yang pesertanya lebih banyak', 'rata-rata kelompok ' + (n > m ? 'A' : 'B'), fm),
          jalur(n > m ? y : x, 'hanya memakai rata-rata kelompok yang pesertanya lebih sedikit', 'rata-rata kelompok ' + (n > m ? 'B' : 'A'), fm),
          jalur(n * x / N, 'lupa menambahkan jumlah nilai kelompok B', n + ' × ' + x + ' ÷ ' + N, fm),
          jalur(m * y / N, 'lupa menambahkan jumlah nilai kelompok A', m + ' × ' + y + ' ÷ ' + N, fm)
        ];
      });
    s.min = 40; s.maks = 100;                      // nilai di luar rentang ini jelas tidak masuk akal sebagai rata-rata
    return pengayaan(s, 'Tambahan tim: rata-rata gabungan dua kelompok dan rata-rata kelompok yang hilang.', 'rata-tertimbang');
  }

  function hargaAwal(a, level) {
    var awal = a.kelipatan(80, 960, 40), n = a.bulat(2, 12), barang = a.pilih(['kursi kerja', 'lampu meja', 'tas kerja', 'mesin label', 'papan tulis']);
    var d1 = a.pilih([5, 10, 15, 20, 25, 30, 35, 40]), d2 = level === 'mudah' ? 0 : a.pilih([5, 10, 15]);
    var ongkir = level === 'sulit' ? a.kelipatan(5, 25, 1) : 0;
    var akhir = Math.round(n * awal * (100 - d1) * (100 - d2) / 100) / 100 + ongkir;
    var teks = 'Seorang pembeli membeli ' + n + ' ' + barang + ' yang harga satuannya sama. Toko memberi diskon ' + d1 + '% untuk setiap barang' + (d2 ? ', kemudian diskon tambahan ' + d2 + '% dari harga setelah diskon pertama' : '') + '.';
    if (ongkir) teks += ' Setelah seluruh diskon, pembeli membayar ongkos kirim tetap ' + dolar(ongkir) + '.';
    teks += ' Jumlah yang akhirnya dibayar adalah ' + dolar(akhir) + '.';
    var param = { n: n, d1: d1, akhir: akhir }; if (d2) param.d2 = d2; if (ongkir) param.ongkir = ongkir;
    var bersih = akhir - ongkir, faktor = (100 - d1) * (100 - d2) / 10000, faktorT = (100 - d1) + '%' + (d2 ? ' × ' + (100 - d2) + '%' : '');
    var B = dolar(bersih), Bn = dolar(bersih / n);
    var faktorE = (100 - d1) + '\\%' + (d2 ? ' \\times ' + (100 - d2) + '\\%' : ''), sisaPersen = (100 - d1) * (100 - d2) / 100;
    var olah = [];
    if (ongkir) olah.push('Ongkos kirim dibayar setelah diskon dan tidak ikut didiskon, jadi dikeluarkan dahulu:', R(T('pembayaran barang') + ' = ' + ED(akhir) + ' - ' + ED(ongkir) + ' = ' + ED(bersih)));
    olah.push('Diskon ' + d1 + '% berarti yang dibayar ' + (100 - d1) + '% dari harga' + (d2 ? '; diskon tambahan ' + d2 + '% berarti tinggal ' + (100 - d2) + '% dari harga setelah diskon pertama' : '') + '. Misalkan harga satuan sebelum diskon = h:');
    olah.push(R(n + ' \\times h \\times ' + faktorE + ' = ' + ED(bersih)));
    if (d2) olah.push(R(faktorE + ' = ' + E(sisaPersen) + '\\%'));
    olah.push(R('h = \\frac{' + ED(bersih) + '}{' + n + ' \\times ' + E(sisaPersen) + '\\%} = \\frac{' + ED(bersih) + '}{' + E(n * sisaPersen / 100, 4) + '} = ' + ED(awal)));
    return pengayaan(spec(teks, 'Berapa harga satu ' + barang + ' sebelum diskon?', awal, '$', param,
      [langkah('bersih', ongkir ? 'akhir-ongkir' : 'akhir'), langkah('faktor', '(1-d1/100)' + (d2 ? '*(1-d2/100)' : '')), langkah('jawab', 'bersih/faktor/n')],
      bahasHitung(['Banyak barang: ' + n + ' ' + barang + ' dengan harga satuan yang sama.', 'Diskon ' + d1 + '%' + (d2 ? ', lalu diskon tambahan ' + d2 + '% dari harga setelah diskon pertama' : '') + '.',
        (ongkir ? 'Ongkos kirim tetap ' + dolar(ongkir) + ' dibayar setelah diskon; j' : 'J') + 'umlah yang dibayar ' + dolar(akhir) + '.'],
      'Harga satu ' + barang + ' sebelum diskon (h).', olah, 'Jadi, harga satu ' + barang + ' sebelum diskon adalah ' + dolar(awal) + '.'),
      function (fm) {
        var j = [
          jalur(bersih / n * (100 + d1 + d2) / 100, 'mengembalikan diskon dengan menambahkan persentasenya pada harga sesudah diskon', Bn + ' × ' + (100 + d1 + d2) + '%', fm),
          jalur(bersih / n, 'menjawab harga satuan sesudah diskon', B + ' ÷ ' + n, fm),
          jalur(bersih / faktor, 'lupa membagi dengan banyaknya barang (harga seluruh barang sebelum diskon)', B + ' ÷ (' + faktorT + ')', fm),
          jalur(bersih / n / (d1 / 100), 'membagi dengan persentase diskon, bukan dengan sisa harga', Bn + ' ÷ ' + d1 + '%', fm),
          jalur(bersih / n * (100 - d1) / 100, 'menerapkan diskon ' + d1 + '% sekali lagi pada harga sesudah diskon', Bn + ' × ' + (100 - d1) + '%', fm)
        ];
        if (d2) j.splice(1, 0, jalur(bersih / n / (1 - (d1 + d2) / 100), 'menjumlahkan dua diskon berurutan menjadi ' + (d1 + d2) + '%', Bn + ' ÷ ' + (100 - d1 - d2) + '%', fm));
        if (ongkir) {
          j.splice(1, 0, jalur(akhir / faktor / n, 'lupa mengurangkan ongkos kirim', dolar(akhir) + ' ÷ (' + faktorT + ') ÷ ' + n, fm));
          j.push(jalur((akhir - n * ongkir) / faktor / n, 'mengurangkan ongkos kirim untuk setiap barang', '(' + dolar(akhir) + ' - ' + n + ' × ' + dolar(ongkir) + ') ÷ (' + faktorT + ') ÷ ' + n, fm));
        }
        return j;
      }), 'Tambahan tim: harga sebelum diskon (perhitungan mundur dari harga akhir).');
  }

  function bunga(a, level) {
    var P = a.kelipatan(2400, 24000, 1200), r = a.bulat(3, 12), bulan = a.bulat(2, 18);
    var biaya = level === 'sulit' ? a.kelipatan(10, 50, 5) : 0, I = P * r * bulan / 1200, saldo = P + I - biaya;
    var param = { r: r, bulan: bulan }, teks = 'Dalam suatu simulasi tabungan, bunga tunggal sebesar ' + r + '% per tahun dihitung dari setoran awal, dengan satu tahun sama dengan 12 bulan. Dana disimpan selama ' + bulan + ' bulan tanpa setoran atau penarikan tambahan dan tanpa pajak.';
    if (level === 'sulit') { teks += ' Biaya administrasi satu kali sebesar ' + dolar(biaya) + ' dipotong pada akhir periode. Saldo akhir adalah ' + dolar(saldo) + '.'; param.biaya = biaya; param.saldo = saldo; }
    else { teks += ' Setoran awal adalah ' + dolar(P) + ' dan tidak ada biaya administrasi.'; param.P = P; }
    var hasil = level === 'mudah' ? I : level === 'sedang' ? saldo : P;
    var f = r * bulan / 1200, fT = '(1 + ' + r + '% × ' + bulan + '/12)', PT = dolar(P), SB = dolar(saldo + biaya);
    var olah = [
      'Bunga tunggal dihitung dari setoran awal saja: bunga = setoran awal × suku bunga per tahun × lama simpan (dalam tahun). Karena 1 tahun = 12 bulan:',
      R('t = \\frac{' + bulan + '}{12}\\ ' + T('tahun')),
      R('I = P \\times r \\times t')
    ];
    if (level === 'sulit') {
      // faktor 1 + r × t: desimal bila tepat (paling banyak 4 angka), pecahan sederhana bila tidak
      var fN = 1200 + r * bulan, desimalTepat = (fN * 10000) % 1200 === 0, fE = desimalTepat ? E(fN / 1200, 4) : FR(fN, 1200);
      olah.push('Saldo akhir sudah dipotong biaya administrasi, jadi biaya itu ditambahkan kembali:',
        R(T('saldo sebelum biaya') + ' = ' + ED(saldo) + ' + ' + ED(biaya) + ' = ' + ED(saldo + biaya)),
        'Saldo sebelum biaya = setoran awal + bunga = P × (1 + r × t):',
        R('P \\times (1 + ' + r + '\\% \\times \\frac{' + bulan + '}{12}) = ' + ED(saldo + biaya)),
        R('1 + ' + r + '\\% \\times \\frac{' + bulan + '}{12} = 1 + \\frac{' + E(r * bulan) + '}{1.200} = ' + fE),
        R('P = ' + (desimalTepat ? '\\frac{' + ED(saldo + biaya) + '}{' + fE + '}' : ED(saldo + biaya) + ' \\div ' + fE + ' = ' + ED(saldo + biaya) + ' \\times ' + FR(1200, fN)) + ' = ' + ED(P)));
    } else {
      olah.push(R('I = ' + ED(P) + ' \\times ' + r + '\\% \\times \\frac{' + bulan + '}{12} = ' + ED(I)));
      if (level === 'sedang') olah.push('Saldo akhir = setoran awal + bunga (tidak ada biaya administrasi):', R(T('saldo akhir') + ' = ' + ED(P) + ' + ' + ED(I) + ' = ' + ED(saldo)));
    }
    var s = spec(teks, level === 'mudah' ? 'Berapa bunga yang diperoleh selama periode tersebut?' : level === 'sedang' ? 'Berapa saldo pada akhir periode?' : 'Berapa setoran awalnya?', hasil, '$', param,
      [langkah('jawab', level === 'mudah' ? 'P*r*bulan/1200' : level === 'sedang' ? 'P*(1+r*bulan/1200)' : '(saldo+biaya)/(1+r*bulan/1200)')],
      bahasHitung(['Suku bunga tunggal r = ' + r + '% per tahun; lama simpan ' + bulan + ' bulan; tanpa setoran, penarikan, atau pajak.',
        level === 'sulit' ? 'Biaya administrasi ' + dolar(biaya) + ' dipotong pada akhir periode; saldo akhir ' + dolar(saldo) + '. Setoran awal dilambangkan P.' : 'Setoran awal P = ' + PT + '; tidak ada biaya administrasi. Bunga dilambangkan I.'],
      level === 'mudah' ? 'Bunga selama ' + bulan + ' bulan (I).' : level === 'sedang' ? 'Saldo pada akhir periode.' : 'Setoran awal (P).', olah,
      level === 'mudah' ? 'Jadi, bunga yang diperoleh adalah ' + dolar(I) + '.' : level === 'sedang' ? 'Jadi, saldo pada akhir periode adalah ' + dolar(saldo) + '.' : 'Jadi, setoran awalnya adalah ' + PT + '.'),
      function (fm) {
        if (level === 'sulit') return [
          jalur(saldo / (1 + f), 'lupa menambahkan kembali biaya administrasi', dolar(saldo) + ' ÷ ' + fT, fm),
          jalur((saldo - biaya) / (1 + f), 'mengurangkan biaya administrasi sekali lagi', '(' + dolar(saldo) + ' - ' + dolar(biaya) + ') ÷ ' + fT, fm),
          jalur((saldo + biaya) * (1 - f), 'menghitung bunga dari saldo akhir lalu mengurangkannya', SB + ' × (1 - ' + r + '% × ' + bulan + '/12)', fm),
          jalur((saldo + biaya) / (1 + r * bulan / 100), 'menganggap suku bunga tahunan sebagai bunga per bulan', SB + ' ÷ (1 + ' + r + '% × ' + bulan + ')', fm),
          jalur((saldo + biaya) / (1 + r / 100), 'memakai bunga setahun penuh', SB + ' ÷ (1 + ' + r + '%)', fm),
          jalur(saldo + biaya - P, 'menjawab besar bunga, bukan setoran awal', SB + ' - ' + PT, fm),
          jalur(saldo + biaya, 'berhenti pada saldo sebelum biaya dipotong, belum menghilangkan bunga', dolar(saldo) + ' + ' + dolar(biaya), fm),
          jalur((saldo + biaya) * (1 + f), 'menambahkan bunga, padahal bunga harus dihilangkan', SB + ' × ' + fT, fm)
        ];
        var dasar = level === 'sedang' ? PT + ' + ' : '', tambah = level === 'sedang' ? P : 0;
        var j = [
          jalur(tambah + P * r / 100, 'memakai bunga setahun penuh', dasar + PT + ' × ' + r + '%', fm),
          jalur(tambah + P * r * bulan / 100, 'menganggap suku bunga tahunan sebagai bunga per bulan', dasar + PT + ' × ' + r + '% × ' + bulan, fm),
          jalur(tambah + P * r / 1200, 'hanya menghitung bunga satu bulan', dasar + PT + ' × ' + r + '% ÷ 12', fm),
          jalur(tambah + P * (Math.pow(1 + r / 1200, bulan) - 1), 'menghitung bunga majemuk bulanan, padahal bunganya tunggal', dasar + PT + ' × ((1 + ' + r + '%/12)^' + bulan + ' - 1)', fm)
        ];
        j.push(level === 'mudah' ? jalur(P + I, 'menjawab saldo akhir, bukan bunganya', PT + ' + ' + dolar(I), fm) : jalur(I, 'menjawab bunganya saja, bukan saldo akhir', PT + ' × ' + r + '% × ' + bulan + '/12', fm));
        return j;
      });
    s.model.konteks = ['12'];                     // "satu tahun sama dengan 12 bulan" adalah konversi, bukan data
    return pengayaan(s, 'Tambahan tim: bunga tunggal, saldo akhir, dan setoran awal.');
  }

  function peluang(a, level) {
    var merah = a.bulat(4, 100), biru = a.bulat(5, 110), total = merah + biru;
    var dua = level !== 'mudah', beda = level === 'sulit';
    var hasil = dua ? (beda ? 2 * merah * biru : merah * (merah - 1)) / (total * (total - 1)) * 100 : merah / total * 100;
    return pengayaan(spec('Sebuah kotak berisi ' + merah + ' kupon merah dan ' + biru + ' kupon biru. Semua kupon berukuran sama dan setiap kupon memiliki peluang yang sama untuk terambil. ' +
      (dua ? 'Dua kupon diambil secara acak satu per satu tanpa mengembalikan kupon pertama.' : 'Satu kupon diambil secara acak.'),
      'Berapa peluang ' + (beda ? 'kedua kupon berbeda warna, dalam urutan mana pun' : dua ? 'kedua kupon berwarna merah' : 'kupon yang terambil berwarna merah') + '? Nyatakan dalam persen, bulatkan sampai dua angka di belakang koma.',
      hasil, '%', { merah: merah, biru: biru },
      [langkah('total', 'merah+biru'), langkah('jawab', !dua ? 'merah/total*100' : beda ? '2*merah*biru/(total*(total-1))*100' : 'merah*(merah-1)/(total*(total-1))*100')],
      ['Jumlah kupon = ' + merah + ' + ' + biru + ' = ' + total + '.',
        !dua ? 'Peluang merah = ' + merah + '/' + total + '.' : beda ? 'Ada dua urutan: merah lalu biru, atau biru lalu merah. Peluang keduanya dijumlahkan: 2 × ' + merah + ' × ' + biru + ' ÷ (' + total + ' × ' + (total - 1) + ').' : 'Setelah kupon merah pertama diambil, tersisa ' + (merah - 1) + ' kupon merah dari ' + (total - 1) + ' kupon. Peluang = ' + merah + '/' + total + ' × ' + (merah - 1) + '/' + (total - 1) + '.',
        'Kalikan peluang dengan 100%: ' + angka(hasil) + '%.'],
      function (fm) {
        var m = merah, b = biru, t = total;
        if (!dua) return [
          jalur(m / b * 100, 'membandingkan kupon merah dengan kupon biru, bukan dengan seluruh kupon', m + ' ÷ ' + b + ' × 100%', fm),
          jalur(b / t * 100, 'menghitung peluang kupon biru', b + ' ÷ ' + t + ' × 100%', fm),
          jalur(50, 'menganggap dua warna berarti peluangnya sama besar', '1 ÷ 2 × 100%', fm),
          jalur(m / t, 'lupa mengalikan dengan 100%', m + ' ÷ ' + t, fm),
          jalur(1 / t * 100, 'menghitung peluang terambilnya satu kupon tertentu', '1 ÷ ' + t + ' × 100%', fm)
        ];
        if (!beda) return [
          jalur(m * m / (t * t) * 100, 'menganggap kupon pertama dikembalikan', m + '/' + t + ' × ' + m + '/' + t + ' × 100%', fm),
          jalur(m / t * 100, 'hanya menghitung pengambilan pertama', m + ' ÷ ' + t + ' × 100%', fm),
          jalur(m * (m - 1) / (t * t) * 100, 'lupa mengurangi banyak kupon pada pengambilan kedua', m + '/' + t + ' × ' + (m - 1) + '/' + t + ' × 100%', fm),
          jalur((m - 1) / (t - 1) * 100, 'hanya menghitung pengambilan kedua', (m - 1) + ' ÷ ' + (t - 1) + ' × 100%', fm),
          jalur(m * (m - 1) / (t * (t - 1)), 'lupa mengalikan dengan 100%', m + '/' + t + ' × ' + (m - 1) + '/' + (t - 1), fm),
          jalur(m * (m - 1) / (t * (t - 1)) / 2 * 100, 'membagi dua seolah ada dua urutan yang sama', m + '/' + t + ' × ' + (m - 1) + '/' + (t - 1) + ' ÷ 2 × 100%', fm)
        ];
        return [
          jalur(m * b / (t * (t - 1)) * 100, 'hanya menghitung satu urutan warna (merah lalu biru)', m + '/' + t + ' × ' + b + '/' + (t - 1) + ' × 100%', fm),
          jalur(2 * m * b / (t * t) * 100, 'menganggap kupon pertama dikembalikan', '2 × ' + m + '/' + t + ' × ' + b + '/' + t + ' × 100%', fm),
          jalur(100 - hasil, 'menghitung peluang kedua kupon sewarna', '100% - ' + angka(hasil) + '%', fm),
          jalur(m * b / (t * t) * 100, 'menganggap kupon dikembalikan dan hanya menghitung satu urutan', m + '/' + t + ' × ' + b + '/' + t + ' × 100%', fm),
          jalur(2 * m * b / (t * (t - 1)), 'lupa mengalikan dengan 100%', '2 × ' + m + '/' + t + ' × ' + b + '/' + (t - 1), fm),
          jalur((1 - b * (b - 1) / (t * (t - 1))) * 100, 'menghitung peluang sedikitnya satu kupon merah, bukan tepat satu', '(1 - ' + b + '/' + t + ' × ' + (b - 1) + '/' + (t - 1) + ') × 100%', fm),
          jalur((1 - m * (m - 1) / (t * (t - 1))) * 100, 'menghitung peluang sedikitnya satu kupon biru, bukan tepat satu', '(1 - ' + m + '/' + t + ' × ' + (m - 1) + '/' + (t - 1) + ') × 100%', fm)
        ];
      }), 'Tambahan tim: peluang pengambilan tanpa pengembalian.');
  }

  function barisan(a, level) {
    var awal = a.bulat(15, 40), beda = a.bulat(2, 8), n = a.bulat(6, 15);
    // sulit: (n - 1) × beda genap supaya jalur kesalahan "rata-rata per baris" dan sejenisnya tetap bilangan bulat
    if (level === 'sulit' && (n - 1) * beda % 2) beda = beda === 8 ? 6 : beda + 1;
    var akhir = awal + (n - 1) * beda, total = n * (awal + akhir) / 2;
    var param = { n: n, beda: beda }, teks = 'Sebuah aula memiliki ' + n + ' baris kursi. Setiap baris setelah baris pertama memiliki ' + beda + ' kursi lebih banyak daripada baris sebelumnya.';
    if (level === 'sulit') { teks += ' Jumlah kursi seluruhnya adalah ' + angka(total) + '.'; param.total = total; }
    else { teks += ' Baris pertama berisi ' + awal + ' kursi.'; param.awal = awal; }
    var s = spec(teks, level === 'mudah' ? 'Berapa kursi pada baris terakhir?' : level === 'sedang' ? 'Berapa jumlah kursi seluruhnya?' : 'Berapa kursi pada baris pertama?',
      level === 'mudah' ? akhir : level === 'sedang' ? total : awal, 'kursi', param,
      [langkah('jawab', level === 'mudah' ? 'awal+(n-1)*beda' : level === 'sedang' ? 'n*(2*awal+(n-1)*beda)/2' : '(2*total/n-(n-1)*beda)/2')],
      ['Selisih dari baris pertama ke terakhir meliputi ' + (n - 1) + ' kenaikan, masing-masing ' + beda + ' kursi.',
        level === 'sulit' ? 'Dari total = n/2 × (2 × awal + (n - 1) × beda), diperoleh awal = (2 × ' + angka(total) + ' ÷ ' + n + ' - ' + (n - 1) + ' × ' + beda + ') ÷ 2 = ' + awal + '.' : 'Baris terakhir = ' + awal + ' + ' + (n - 1) + ' × ' + beda + ' = ' + akhir + '.',
        'Total = ' + n + ' × (' + awal + ' + ' + akhir + ') ÷ 2 = ' + angka(total) + ' kursi.'],
      function (fm) {
        var T = angka(total);
        if (level === 'mudah') return [
          jalur(awal + n * beda, 'menghitung ' + n + ' kenaikan, padahal dari baris pertama ke baris ke-' + n + ' hanya ada ' + (n - 1) + ' kenaikan', awal + ' + ' + n + ' × ' + beda, fm),
          jalur(awal + (n - 2) * beda, 'menghitung satu kenaikan terlalu sedikit', awal + ' + ' + (n - 2) + ' × ' + beda, fm),
          jalur((n - 1) * beda, 'hanya menghitung tambahan kursinya, lupa isi baris pertama', (n - 1) + ' × ' + beda, fm),
          jalur(n * beda, 'mengalikan banyak baris dengan selisihnya, lupa isi baris pertama', n + ' × ' + beda, fm),
          jalur(total, 'menjawab jumlah kursi seluruhnya, bukan isi baris terakhir', n + ' × (' + awal + ' + ' + akhir + ') ÷ 2', fm)
        ];
        if (level === 'sedang') return [
          jalur(n * awal, 'menganggap semua baris sama dengan baris pertama', n + ' × ' + awal, fm),
          jalur(n * (awal + akhir), 'lupa membagi dua jumlah pasangan baris pertama dan terakhir', n + ' × (' + awal + ' + ' + akhir + ')', fm),
          jalur(n * (2 * awal + n * beda) / 2, 'memakai ' + n + ' kenaikan untuk baris terakhir', n + ' × (' + awal + ' + ' + (awal + n * beda) + ') ÷ 2', fm),
          jalur(n * akhir, 'menganggap semua baris sama dengan baris terakhir', n + ' × ' + akhir, fm),
          jalur(akhir, 'menjawab isi baris terakhir, bukan jumlah seluruhnya', awal + ' + ' + (n - 1) + ' × ' + beda, fm),
          jalur(n * awal + (n - 1) * beda, 'menambahkan kenaikan kursi hanya sekali untuk semua baris', n + ' × ' + awal + ' + ' + (n - 1) + ' × ' + beda, fm)
        ];
        return [
          jalur(total / n, 'menganggap rata-rata kursi per baris sama dengan isi baris pertama', T + ' ÷ ' + n, fm),
          jalur((2 * total / n - n * beda) / 2, 'memakai ' + n + ' kenaikan, bukan ' + (n - 1), '(2 × ' + T + ' ÷ ' + n + ' - ' + n + ' × ' + beda + ') ÷ 2', fm),
          jalur(total / n - (n - 1) * beda, 'lupa membagi dua jumlah kenaikan', T + ' ÷ ' + n + ' - ' + (n - 1) + ' × ' + beda, fm),
          jalur(akhir, 'menjawab isi baris terakhir, bukan baris pertama', '2 × ' + T + ' ÷ ' + n + ' - ' + awal, fm),
          jalur(total / n - beda, 'mengurangkan hanya satu kenaikan dari rata-rata kursi per baris', T + ' ÷ ' + n + ' - ' + beda, fm),
          jalur((total - (n - 1) * beda) / n, 'mengurangkan kenaikan kursi hanya sekali sebelum membagi', '(' + T + ' - ' + (n - 1) + ' × ' + beda + ') ÷ ' + n, fm)
        ];
      });
    s.bulat = true;
    return pengayaan(s, 'Tambahan tim: barisan dan deret aritmetika (baris kursi).');
  }

  function himpunan(a, level) {
    var hanyaA = a.bulat(12, 35), hanyaB = a.bulat(10, 32), dua = a.bulat(5, 18), kosong = a.bulat(8, 25);
    var A = hanyaA + dua, B = hanyaB + dua, N = hanyaA + hanyaB + dua + kosong;
    // tingkat sulit tidak memerlukan banyak seluruh peserta, jadi angka itu tidak dicetak
    var teks = (level === 'sulit' ? 'Survei terhadap peserta pelatihan' : 'Survei terhadap ' + N + ' peserta pelatihan') + ' mencatat bahwa ' + A + ' peserta mengikuti kelas spreadsheet dan ' + B + ' peserta mengikuti kelas presentasi. ';
    var param = level === 'sulit' ? { A: A, B: B } : { N: N, A: A, B: B };
    if (level === 'sedang') { teks += kosong + ' peserta tidak mengikuti satu pun dari kedua kelas tersebut.'; param.kosong = kosong; }
    else { teks += dua + ' peserta mengikuti kedua kelas tersebut.'; param.dua = dua; }
    var hasil = level === 'mudah' ? kosong : level === 'sedang' ? dua : hanyaA + hanyaB, U = N - kosong;
    var s = spec(teks, level === 'mudah' ? 'Berapa peserta yang tidak mengikuti satu pun dari kedua kelas?' : level === 'sedang' ? 'Berapa peserta yang mengikuti kedua kelas?' : 'Berapa peserta yang mengikuti tepat satu dari kedua kelas?', hasil, 'peserta', param,
      [langkah('jawab', level === 'mudah' ? 'N-A-B+dua' : level === 'sedang' ? 'A+B-(N-kosong)' : 'A+B-2*dua')],
      ['Peserta yang mengikuti setidaknya satu kelas = jumlah kelas spreadsheet + jumlah kelas presentasi - peserta kedua kelas.',
        level === 'sedang' ? 'Peserta yang mengikuti setidaknya satu kelas = ' + N + ' - ' + kosong + ' = ' + U + ' peserta.' : 'Gabungan = ' + A + ' + ' + B + ' - ' + dua + ' = ' + U + ' peserta.',
        level === 'mudah' ? 'Tidak mengikuti kelas = ' + N + ' - ' + U + ' = ' + kosong + '.' : level === 'sedang' ? 'Kedua kelas = ' + A + ' + ' + B + ' - ' + U + ' = ' + dua + '.' : 'Tepat satu kelas = (' + A + ' - ' + dua + ') + (' + B + ' - ' + dua + ') = ' + hasil + '.'],
      function (fm) {
        if (level === 'mudah') return [
          jalur(N - A - B, 'lupa menambahkan kembali peserta yang mengikuti kedua kelas', N + ' - ' + A + ' - ' + B, fm),
          jalur(U, 'menjawab peserta yang mengikuti sedikitnya satu kelas', A + ' + ' + B + ' - ' + dua, fm),
          jalur(N - A - B + 2 * dua, 'menambahkan peserta kedua kelas dua kali', N + ' - ' + A + ' - ' + B + ' + 2 × ' + dua, fm),
          jalur(N - A, 'hanya mengurangkan peserta kelas spreadsheet', N + ' - ' + A, fm),
          jalur(N - B, 'hanya mengurangkan peserta kelas presentasi', N + ' - ' + B, fm),
          jalur(kosong - dua, 'mengurangkan peserta kedua kelas sekali lagi', N + ' - (' + A + ' + ' + B + ' - ' + dua + ') - ' + dua, fm),
          jalur(dua, 'menjawab peserta yang mengikuti kedua kelas', 'peserta kedua kelas', fm)
        ];
        if (level === 'sedang') return [
          jalur(A + B - N, 'lupa mengurangkan peserta yang tidak mengikuti kelas', A + ' + ' + B + ' - ' + N, fm),
          jalur(U, 'menjawab peserta yang mengikuti sedikitnya satu kelas', N + ' - ' + kosong, fm),
          jalur(A + B - kosong, 'mengurangkan peserta yang tidak mengikuti kelas dari jumlah kedua kelas', A + ' + ' + B + ' - ' + kosong, fm),
          jalur(U - A, 'hanya menghitung peserta yang mengikuti kelas presentasi saja', U + ' - ' + A, fm),
          jalur(U - B, 'hanya menghitung peserta yang mengikuti kelas spreadsheet saja', U + ' - ' + B, fm),
          jalur(kosong, 'menjawab peserta yang tidak mengikuti satu pun kelas', 'peserta tanpa kelas', fm)
        ];
        return [
          jalur(U, 'menjawab peserta yang mengikuti sedikitnya satu kelas', A + ' + ' + B + ' - ' + dua, fm),
          jalur(A + B, 'menjumlahkan kedua kelas tanpa memperhitungkan irisannya', A + ' + ' + B, fm),
          jalur(A - dua, 'hanya menghitung peserta yang mengikuti kelas spreadsheet saja', A + ' - ' + dua, fm),
          jalur(B - dua, 'hanya menghitung peserta yang mengikuti kelas presentasi saja', B + ' - ' + dua, fm),
          jalur(dua, 'menjawab peserta yang mengikuti kedua kelas, bukan tepat satu kelas', 'peserta kedua kelas', fm)
        ];
      });
    s.min = 1;
    return pengayaan(s, 'Tambahan tim: gabungan dan irisan dua kelompok.');
  }

  function tabel(judul, kolom, data) {
    return [{ id: 'tabel', jenis: 'tabel', judul: judul, model: {
      judul: judul, kolom: kolom, baris: data.map(function (r) { return { label: r[0], sel: r.slice(1).map(angka) }; })
    } }];
  }

  function rataTabel(a, level) {
    var n = level === 'mudah' ? 2 : level === 'sedang' ? 3 : 4, rows = [], bobot = [], biaya = [], total = 0, qty = 0;
    var retur = level === 'sulit' ? a.bulat(2, 5) : 0;
    for (var i = 0; i < n; i++) {
      var q = a.bulat(10, 40), h = a.bulat(15, 75), dipakai = q - (i === 0 ? retur : 0);
      rows.push(['Kiriman ' + (i + 1), q, h]); total += dipakai * h; qty += dipakai;
      var b = 't' + i + '_1' + (i === 0 && retur ? '-retur' : ''); bobot.push('(' + b + ')'); biaya.push('(' + b + ')*t' + i + '_2');
    }
    var harga = rows.map(function (r) { return r[2]; }), kg = rows.map(function (r) { return r[1]; });
    // tanpa retur, yang dirata-ratakan adalah seluruh bahan yang dibeli (catatan QC no. 13)
    var bahan = retur ? 'bahan yang tetap dibeli setelah pengembalian' : 'seluruh bahan yang dibeli';
    var pakai = rows.map(function (r, j) { return r[1] - (j === 0 ? retur : 0); });
    var olah = ['Biaya rata-rata per kg = total biaya ÷ total berat. Banyak bahan tiap kiriman berbeda, jadi harga per kg tidak boleh dirata-ratakan langsung (rata-rata tertimbang).'];
    if (retur) olah.push('Bahan Kiriman 1 yang tetap dibeli setelah ' + retur + ' kg dikembalikan:', R(rows[0][1] + ' - ' + retur + ' = ' + pakai[0] + '\\ ' + T('kg')));
    olah.push('Biaya tiap kiriman = berat × harga per kg:');
    rows.forEach(function (r, j) { olah.push(R(T('biaya ' + r[0]) + ' = ' + pakai[j] + ' \\times ' + ED(r[2]) + ' = ' + ED(pakai[j] * r[2]))); });
    olah.push(R(T('total biaya') + ' = ' + rows.map(function (r, j) { return ED(pakai[j] * r[2]); }).join(' + ') + ' = ' + ED(total)),
      R(T('total berat') + ' = ' + pakai.join(' + ') + ' = ' + qty + '\\ ' + T('kg')),
      R(T('rata-rata per kg') + ' = \\frac{' + ED(total) + '}{' + qty + '} ' + samaD(total / qty)));
    var s = spec('Tabel mencatat pembelian satu jenis bahan dari beberapa kiriman, dengan harga dalam dolar per kg.' +
      (retur ? ' Sebanyak ' + retur + ' kg dari Kiriman 1 dikembalikan dan biayanya dikembalikan penuh sesuai harga satuan kiriman itu.' : ''),
      'Berapa biaya rata-rata per kg ' + bahan + '? Bulatkan sampai dua angka di belakang koma.', total / qty, '$ per kg', retur ? { retur: retur } : {},
      [langkah('biaya', biaya.join('+')), langkah('jumlah', bobot.join('+')), langkah('jawab', 'biaya/jumlah')],
      bahasHitung(rows.map(function (r) { return 'Baris ' + r[0] + ': ' + r[1] + ' kg (kolom Jumlah), $' + r[2] + ' per kg (kolom Harga per kg).'; })
        .concat(retur ? ['Sebanyak ' + retur + ' kg dari Kiriman 1 dikembalikan, dan biayanya dikembalikan penuh.'] : []),
      'Biaya rata-rata per kg ' + bahan + ', dibulatkan sampai dua angka di belakang koma.', olah,
      'Jadi, biaya rata-rata per kg ' + bahan + ' ' + kataHasil(total / qty) + dolar(total / qty) + ' per kg.'),
      function (fm) {
        var jumlahKali = rows.map(function (r, j) { return (r[1] - (j === 0 ? retur : 0)) + ' × ' + r[2]; }).join(' + ');
        var j = [
          jalur(jumlah(harga) / n, 'merata-ratakan harga tanpa bobot jumlah bahan', '(' + harga.join(' + ') + ') ÷ ' + n, fm),
          jalur(total / jumlah(harga), 'membagi total biaya dengan jumlah harga, bukan dengan jumlah kg', '(' + jumlahKali + ') ÷ (' + harga.join(' + ') + ')', fm),
          jalur(total / n, 'membagi total biaya dengan banyaknya kiriman, bukan dengan jumlah kg', dolar(total) + ' ÷ ' + n, fm)
        ];
        if (n === 2) j.splice(1, 0, jalur((kg[1] * harga[0] + kg[0] * harga[1]) / (kg[0] + kg[1]), 'menukar bobot kedua kiriman', '(' + kg[1] + ' × ' + harga[0] + ' + ' + kg[0] + ' × ' + harga[1] + ') ÷ ' + (kg[0] + kg[1]), fm));
        if (n === 2) j.push(jalur(harga[0] + harga[1], 'menjumlahkan harga per kg kedua kiriman', harga[0] + ' + ' + harga[1], fm));
        if (n > 2) {
          j.push(jalur((total - kg[n - 1] * harga[n - 1]) / (qty - kg[n - 1]), 'lupa menyertakan kiriman terakhir', dolar(total - kg[n - 1] * harga[n - 1]) + ' ÷ ' + (qty - kg[n - 1]), fm));
          var kg0 = kg[0] - retur;
          j.push(jalur((total - kg0 * harga[0]) / (qty - kg0), 'lupa menyertakan kiriman pertama', dolar(total - kg0 * harga[0]) + ' ÷ ' + (qty - kg0), fm));
        }
        var terbanyak = kg.indexOf(Math.max.apply(null, kg));
        j.push(jalur(harga[terbanyak], 'hanya memakai harga kiriman yang jumlahnya terbanyak (' + rows[terbanyak][0] + ')', 'harga ' + rows[terbanyak][0] + ' per kg', fm));
        if (retur) {
          j.unshift(jalur(total / (qty + retur), 'memakai jumlah bahan sebelum retur sebagai pembagi', dolar(total) + ' ÷ ' + (qty + retur), fm));
          j.splice(1, 0, jalur((total + retur * harga[0]) / (qty + retur), 'mengabaikan retur sama sekali', dolar(total + retur * harga[0]) + ' ÷ ' + (qty + retur), fm));
          j.push(jalur((total + retur * harga[0]) / qty, 'tidak mengurangkan biaya bahan yang dikembalikan', dolar(total + retur * harga[0]) + ' ÷ ' + qty, fm));
        }
        return j;
      });
    s.maks = 2 * Math.max.apply(null, harga);
    if (retur) s.model.konteks = ['1'];          // "Kiriman 1" adalah nama baris, bukan data
    s.gambar = tabel('Pembelian Bahan', ['Kiriman', 'Jumlah (kg)', 'Harga per kg\n($)'], rows);
    return pengayaan(s, 'Tambahan tim: biaya rata-rata tertimbang dari beberapa kiriman (dengan retur pada tingkat sulit).', 'rata-tertimbang');
  }

  function targetTabel(a, level) {
    var rows = [], target = 0, aktual = 0, targets = [], actuals = [], n = level === 'mudah' ? 1 : 3;
    for (var i = 0; i < 4; i++) {
      var t = a.kelipatan(200, 800, 20), v = t - a.kelipatan(20, 120, 10);
      rows.push(['Cabang ' + String.fromCharCode(65 + i), t, v]);
      if (i < n) { target += t; aktual += v; targets.push('t' + i + '_1'); actuals.push('t' + i + '_2'); }
    }
    var persen = a.pilih([5, 10, 15]), tambah = target * (1 + persen / 100) - aktual;
    // asal angka: target dan realisasi tiap cabang yang ditanyakan dijumlahkan dulu (catatan QC no. 15)
    var dipakai = rows.slice(0, n), namaCab = n === 1 ? 'Cabang A' : 'Cabang A, B, dan C', pencapaian = aktual / target * 100;
    var olah = [];
    if (n > 1) {
      olah.push('Hanya ' + namaCab + ' yang dihitung (Cabang D tidak termasuk). Jumlahkan target dan realisasinya:',
        R(T('target gabungan') + ' = ' + dipakai.map(function (r) { return E(r[1]); }).join(' + ') + ' = ' + E(target)),
        R(T('realisasi gabungan') + ' = ' + dipakai.map(function (r) { return E(r[2]); }).join(' + ') + ' = ' + E(aktual)));
    }
    if (level === 'sulit') {
      olah.push('Target naik ' + persen + '% dari target semula, jadi target baru = ' + (100 + persen) + '% dari target semula:',
        R(T('target baru') + ' = ' + E(target) + ' \\times (100\\% + ' + persen + '\\%) = ' + E(target) + ' \\times ' + (100 + persen) + '\\% = ' + E(target * (1 + persen / 100))),
        'Berkas tambahan = target baru - realisasi yang sudah ada:',
        R(T('tambahan') + ' = ' + E(target * (1 + persen / 100)) + ' - ' + E(aktual) + ' = ' + E(tambah) + '\\ ' + T('berkas')));
    } else {
      olah.push('Persentase pencapaian = realisasi dibagi target, dikali 100%:',
        R(T('pencapaian') + ' = \\frac{' + T('realisasi') + '}{' + T('target') + '} \\times 100\\%'),
        R(T('pencapaian') + ' = \\frac{' + E(aktual) + '}{' + E(target) + '} \\times 100\\% ' + samaE(pencapaian) + '\\%'));
    }
    var s = spec('Tabel menunjukkan target dan realisasi pemeriksaan berkas untuk periode yang sama.' + (level === 'sulit' ? ' Target gabungan Cabang A, B, dan C dinaikkan ' + persen + '% dari jumlah target semula.' : ''),
      level === 'sulit' ? 'Berapa berkas tambahan yang perlu diselesaikan ketiga cabang tersebut untuk mencapai target gabungan baru?' : 'Berapa persentase pencapaian target ' + (n === 1 ? 'Cabang A' : 'gabungan Cabang A, B, dan C') + '? Bulatkan sampai dua angka di belakang koma.',
      level === 'sulit' ? tambah : aktual / target * 100, level === 'sulit' ? 'berkas' : '%', level === 'sulit' ? { persen: persen } : {},
      [langkah('target', targets.join('+')), langkah('aktual', actuals.join('+')), langkah('jawab', level === 'sulit' ? 'target*(1+persen/100)-aktual' : 'aktual/target*100')],
      bahasHitung(dipakai.map(function (r) { return 'Baris ' + r[0] + ': target ' + angka(r[1]) + ' berkas, realisasi ' + angka(r[2]) + ' berkas.'; })
        .concat(level === 'sulit' ? ['Target gabungan ' + namaCab + ' dinaikkan ' + persen + '% dari jumlah target semula.'] : []),
      level === 'sulit' ? 'Banyak berkas tambahan yang perlu diselesaikan ' + namaCab + ' untuk mencapai target gabungan baru.' : 'Persentase pencapaian target ' + (n === 1 ? 'Cabang A' : 'gabungan ' + namaCab) + ', dibulatkan sampai dua angka di belakang koma.', olah,
      level === 'sulit' ? 'Jadi, ' + namaCab + ' perlu menyelesaikan ' + angka(tambah) + ' berkas tambahan.' : 'Jadi, persentase pencapaian target ' + (n === 1 ? 'Cabang A' : 'gabungan ' + namaCab) + ' ' + kataHasil(pencapaian) + angka(pencapaian) + '%.'),
      function (fm) {
        var T4 = jumlah(rows.map(function (r) { return r[1]; })), V4 = jumlah(rows.map(function (r) { return r[2]; }));
        if (level === 'sulit') return [
          jalur(target - aktual, 'menghitung kekurangan terhadap target lama', angka(target) + ' - ' + angka(aktual), fm),
          jalur(target * persen / 100, 'hanya menghitung kenaikan target', angka(target) + ' × ' + persen + '%', fm),
          jalur(target * (1 + persen / 100), 'menjawab target baru, bukan tambahan yang diperlukan', angka(target) + ' × ' + (100 + persen) + '%', fm),
          jalur(aktual * persen / 100, 'menaikkan realisasi, bukan target', angka(aktual) + ' × ' + persen + '%', fm),
          jalur((target - aktual) * (1 + persen / 100), 'menaikkan kekurangannya sebesar ' + persen + '%', '(' + angka(target) + ' - ' + angka(aktual) + ') × ' + (100 + persen) + '%', fm),
          jalur(T4 * (1 + persen / 100) - V4, 'ikut menyertakan Cabang D', angka(T4) + ' × ' + (100 + persen) + '% - ' + angka(V4), fm)
        ];
        var j = [
          jalur((target - aktual) / target * 100, 'menghitung persentase kekurangannya, bukan pencapaiannya', '(' + angka(target) + ' - ' + angka(aktual) + ') ÷ ' + angka(target) + ' × 100%', fm),
          jalur(target / aktual * 100, 'membalik pembilang dan penyebut', angka(target) + ' ÷ ' + angka(aktual) + ' × 100%', fm),
          jalur((target - aktual) / aktual * 100, 'membandingkan kekurangan dengan realisasi', '(' + angka(target) + ' - ' + angka(aktual) + ') ÷ ' + angka(aktual) + ' × 100%', fm)
        ];
        if (n > 1) {
          j.splice(1, 0, jalur(jumlah(rows.slice(0, n).map(function (r) { return r[2] / r[1] * 100; })) / n, 'merata-ratakan persentase pencapaian tiap cabang tanpa bobot target',
            '(' + rows.slice(0, n).map(function (r) { return angka(r[2] / r[1] * 100) + '%'; }).join(' + ') + ') ÷ ' + n, fm));
          j.push(jalur(V4 / T4 * 100, 'ikut menyertakan Cabang D', angka(V4) + ' ÷ ' + angka(T4) + ' × 100%', fm));
        } else {
          j.push(jalur(aktual / T4 * 100, 'membagi realisasi Cabang A dengan target seluruh cabang', angka(aktual) + ' ÷ ' + angka(T4) + ' × 100%', fm));
          j.push(jalur(aktual / V4 * 100, 'menghitung porsi realisasi Cabang A terhadap realisasi seluruh cabang', angka(aktual) + ' ÷ ' + angka(V4) + ' × 100%', fm));
        }
        return j;
      });
    if (level !== 'sulit') s.maks = 200;
    s.gambar = tabel('Pemeriksaan Berkas per Cabang', ['Cabang', 'Target\n(berkas)', 'Realisasi\n(berkas)'], rows);
    return pengayaan(s, 'Tambahan tim: pencapaian target gabungan (dari total realisasi dibagi total target) dan tambahan untuk target baru.', level === 'sulit' ? null : 'persen-gabungan');
  }

  function produktivitas(a, level) {
    var rows = [], rates = [];
    for (var i = 0; i < 3; i++) { var orang = a.bulat(3, 9), jam = a.bulat(3, 7), laju = a.bulat(8, 20); rates.push(laju); rows.push(['Tim ' + String.fromCharCode(65 + i), orang, jam, orang * jam * laju]); }
    var pilih = a.bulat(0, 2), tim = rows[pilih][0], M = a.bulat(5, 12), H = a.bulat(4, 8), jeda = level === 'sulit' ? 1 : 0;
    var teks = 'Seluruh anggota setiap tim bekerja dengan laju yang sama dan tetap. Kolom jam menunjukkan waktu kerja efektif masing-masing anggota; seluruh berkas pada tabel selesai diperiksa.';
    if (level !== 'mudah') teks += ' Dengan laju per orang seperti ' + tim + ', sebuah tim baru beranggotakan ' + M + ' orang bekerja selama ' + H + ' jam' + (jeda ? ', termasuk istirahat ' + jeda + ' jam per orang tanpa memeriksa berkas' : ' efektif per orang') + '.';
    var param = level === 'mudah' ? {} : { M: M, H: H }; if (jeda) param.jeda = jeda;
    var hasil = rates[pilih] * (level === 'mudah' ? 1 : M * (H - jeda)), rp = rows[pilih];
    var olah = [
      'Setiap anggota bekerja dengan laju yang sama, jadi laju satu orang = berkas selesai dibagi jam-orang (anggota × jam efektif per orang):',
      R(T('laju') + ' = \\frac{' + T('berkas selesai') + '}{' + T('anggota') + ' \\times ' + T('jam efektif') + '}'),
      R(T('laju ' + tim) + ' = \\frac{' + E(rp[3]) + '}{' + rp[1] + ' \\times ' + rp[2] + '} = \\frac{' + E(rp[3]) + '}{' + rp[1] * rp[2] + '} = ' + rates[pilih] + '\\ ' + T('berkas/orang/jam'))
    ];
    if (level !== 'mudah') {
      if (jeda) olah.push('Istirahat ' + jeda + ' jam per orang tidak dipakai memeriksa berkas, jadi jam efektif tiap orang:', R(T('jam efektif') + ' = ' + H + ' - ' + jeda + ' = ' + (H - jeda) + '\\ ' + T('jam')));
      olah.push('Hasil tim baru = laju per orang × banyak anggota × jam efektif per orang:',
        R(T('hasil') + ' = ' + rates[pilih] + ' \\times ' + M + ' \\times ' + (H - jeda) + ' = ' + E(hasil) + '\\ ' + T('berkas')));
    }
    var s = spec(teks, level === 'mudah' ? 'Berapa berkas yang diperiksa satu anggota ' + tim + ' per jam?' : 'Berapa berkas yang dapat diselesaikan tim baru?', hasil,
      level === 'mudah' ? 'berkas/orang/jam' : 'berkas', param,
      [langkah('laju', 't' + pilih + '_3/(t' + pilih + '_1*t' + pilih + '_2)'), langkah('jawab', level === 'mudah' ? 'laju' : jeda ? 'laju*M*(H-jeda)' : 'laju*M*H')],
      bahasHitung(['Baris ' + tim + ': ' + rp[1] + ' anggota (kolom Anggota), ' + rp[2] + ' jam efektif per orang (kolom Jam efektif), ' + angka(rp[3]) + ' berkas selesai (kolom Berkas selesai).']
        .concat(level === 'mudah' ? [] : ['Tim baru: ' + M + ' orang, masing-masing bekerja ' + H + ' jam' + (jeda ? ' termasuk istirahat ' + jeda + ' jam' : ' efektif') + ', dengan laju per orang seperti ' + tim + '.']),
      level === 'mudah' ? 'Banyak berkas yang diperiksa satu anggota ' + tim + ' per jam.' : 'Banyak berkas yang dapat diselesaikan tim baru.', olah,
      level === 'mudah' ? 'Jadi, satu anggota ' + tim + ' memeriksa ' + angka(hasil) + ' berkas per jam.' : 'Jadi, tim baru dapat menyelesaikan ' + angka(hasil) + ' berkas.'),
      function (fm) {
        var r = rows[pilih], laju = rates[pilih], lain = [0, 1, 2].filter(function (k) { return k !== pilih; });
        var bacaLain = function (k, kali, kaliT) {
          return jalur(rates[k] * kali, 'membaca baris ' + rows[k][0] + ', bukan ' + tim, rows[k][3] + ' ÷ (' + rows[k][1] + ' × ' + rows[k][2] + ')' + kaliT, fm);
        };
        if (level === 'mudah') return [
          jalur(r[3] / r[1], 'hanya membagi berkas dengan banyak anggota', r[3] + ' ÷ ' + r[1], fm),
          jalur(r[3] / r[2], 'hanya membagi berkas dengan jam kerja', r[3] + ' ÷ ' + r[2], fm),
          jalur(r[3] / (r[1] + r[2]), 'menjumlahkan anggota dan jam, bukan mengalikannya', r[3] + ' ÷ (' + r[1] + ' + ' + r[2] + ')', fm),
          bacaLain(lain[0], 1, ''), bacaLain(lain[1], 1, '')
        ];
        var jamT = jeda ? '(' + H + ' - ' + jeda + ')' : H, efektif = H - jeda;
        var j = [
          jalur(laju * M, 'mengabaikan lama kerja tim baru', laju + ' × ' + M, fm),
          jalur(laju * efektif, 'mengabaikan banyak anggota tim baru', laju + ' × ' + jamT, fm),
          jalur(r[3] / r[1] * M, 'memakai hasil per orang (tanpa membagi jam) lalu mengalikan dengan anggota tim baru', r[3] + ' ÷ ' + r[1] + ' × ' + M, fm),
          jalur(laju * (M + efektif), 'menjumlahkan anggota dan jam, bukan mengalikannya', laju + ' × (' + M + ' + ' + efektif + ')', fm),
          bacaLain(lain[0], M * efektif, ' × ' + M + ' × ' + jamT)
        ];
        if (jeda) {
          j.unshift(jalur(laju * M * H, 'tidak mengurangi waktu istirahat', laju + ' × ' + M + ' × ' + H, fm));
          j.splice(2, 0, jalur(laju * (M * H - jeda), 'mengurangkan istirahat hanya sekali untuk seluruh tim, bukan untuk tiap orang', laju + ' × (' + M + ' × ' + H + ' - ' + jeda + ')', fm));
        } else j.push(jalur(r[3] / r[2] * H, 'memakai hasil per jam tim lama tanpa membagi banyak anggotanya', r[3] + ' ÷ ' + r[2] + ' × ' + H, fm));
        return j;
      });
    s.bulat = level !== 'mudah';
    s.gambar = tabel('Produktivitas Pemeriksaan', ['Tim', 'Anggota\n(orang)', 'Jam efektif\nper orang', 'Berkas\nselesai'], rows);
    return pengayaan(s, 'Tambahan tim: produktivitas per orang per jam dari tabel lalu skala ke tim baru.');
  }

  function batang(judul, kategori, seri, satuan, level) {
    var mx = Math.max.apply(null, seri.reduce(function (out, s) { return out.concat(s.nilai); }, []));
    // langkah garis bantu "bulat": 1, 2, 2,5, atau 5 kali perpangkatan sepuluh
    var kasar = mx / 5, pangkat = Math.pow(10, Math.floor(Math.log10(kasar)));
    var step = [1, 2, 2.5, 5, 10].map(function (k) { return k * pangkat; }).filter(function (x) { return x >= kasar; })[0];
    return [{ id: 'grafik', jenis: 'bar', judul: judul, model: { judul: judul, kategori: kategori, seri: seri, langkah: step,
      // Nilai tetap dicetak: kesulitan berasal dari hitungan, bukan menebak tinggi di antara garis bantu.
      sumbuMaks: Math.ceil(mx / step + 1) * step, judulY: satuan, labelNilai: true } }];
  }

  function labaGrafik(a, level) {
    var kat = ['Jan', 'Feb', 'Mar', 'Apr'], masuk = [], keluar = [];
    for (var i = 0; i < 4; i++) { keluar.push(a.kelipatan(100, 400, 20) * 100); masuk.push(keluar[i] + a.kelipatan(20, 180, 10) * 100); }
    var idx = a.bulat(0, 3), n = level === 'mudah' ? [idx] : [0, 1, 2, 3];
    var M = jumlah(n.map(function (j) { return masuk[j]; })), K = jumlah(n.map(function (j) { return keluar[j]; })), laba = M - K;
    var beban = a.kelipatan(20, 80, 10) * 100, hasil = level === 'mudah' ? laba : level === 'sedang' ? laba / M * 100 : laba - beban;
    var MT = dolar(M), KT = dolar(K), LT = dolar(laba);
    // penjumlahan empat bulan ditampilkan, bukan hanya totalnya (catatan QC no. 18)
    var olah = ['Laba = pendapatan - biaya' + (level === 'sulit' ? ' (termasuk beban tambahan)' : '') + '.'];
    if (level === 'mudah') {
      olah.push(R(T('laba ' + kat[idx]) + ' = ' + ED(M) + ' - ' + ED(K) + ' = ' + ED(laba)));
    } else {
      olah.push('Jumlahkan batang tiap seri untuk keempat bulan:',
        R(T('pendapatan') + ' = ' + n.map(function (j) { return ED(masuk[j]); }).join(' + ') + ' = ' + ED(M)),
        R(T('biaya rutin') + ' = ' + n.map(function (j) { return ED(keluar[j]); }).join(' + ') + ' = ' + ED(K)),
        R(T('laba') + ' = ' + ED(M) + ' - ' + ED(K) + ' = ' + ED(laba)));
      if (level === 'sedang') olah.push('Persentase laba dihitung terhadap pendapatan:',
        R(T('persentase laba') + ' = \\frac{' + T('laba') + '}{' + T('pendapatan') + '} \\times 100\\% = \\frac{' + ED(laba) + '}{' + ED(M) + '} \\times 100\\% ' + samaE(hasil) + '\\%'));
      else olah.push('Beban tambahan terjadi satu kali, jadi dikurangkan sekali dari laba keempat bulan:', R(T('laba akhir') + ' = ' + ED(laba) + ' - ' + ED(beban) + ' = ' + ED(hasil)));
    }
    var s = spec('Grafik mencatat pendapatan dan seluruh biaya rutin sebuah usaha rekaan, dalam dolar.' + (level === 'sulit' ? ' Pada akhir periode terdapat beban tambahan satu kali sebesar ' + dolar(beban) + ' yang belum tercantum pada grafik.' : ''),
      level === 'mudah' ? 'Berapa laba usaha pada ' + kat[idx] + '?' : level === 'sedang' ? 'Berapa persentase laba gabungan terhadap pendapatan gabungan keempat bulan? Bulatkan sampai dua angka di belakang koma.' : 'Berapa laba gabungan keempat bulan setelah memperhitungkan beban tambahan?',
      hasil, level === 'sedang' ? '%' : '$', level === 'sulit' ? { beban: beban } : {},
      [langkah('masuk', n.map(function (j) { return 'x0_' + j; }).join('+')), langkah('keluar', n.map(function (j) { return 'x1_' + j; }).join('+')),
        langkah('jawab', level === 'mudah' ? 'masuk-keluar' : level === 'sedang' ? '(masuk-keluar)/masuk*100' : 'masuk-keluar-beban')],
      bahasHitung(['Seri Pendapatan: ' + n.map(function (j) { return kat[j] + ' ' + dolar(masuk[j]); }).join(', ') + '.', 'Seri Biaya rutin: ' + n.map(function (j) { return kat[j] + ' ' + dolar(keluar[j]); }).join(', ') + '.']
        .concat(level === 'sulit' ? ['Beban tambahan satu kali: ' + dolar(beban) + '.'] : []),
      level === 'mudah' ? 'Laba usaha pada ' + kat[idx] + '.' : level === 'sedang' ? 'Persentase laba gabungan terhadap pendapatan gabungan keempat bulan, dibulatkan sampai dua angka di belakang koma.' : 'Laba gabungan keempat bulan setelah dikurangi beban tambahan.', olah,
      level === 'mudah' ? 'Jadi, laba usaha pada ' + kat[idx] + ' adalah ' + LT + '.' : level === 'sedang' ? 'Jadi, persentase laba gabungan terhadap pendapatan ' + kataHasil(hasil) + angka(hasil) + '%.' : 'Jadi, laba gabungan keempat bulan setelah beban tambahan adalah ' + dolar(hasil) + '.'),
      function (fm) {
        if (level === 'mudah') {
          var M4 = jumlah(masuk), K4 = jumlah(keluar);
          return [
            jalur(M, 'menjawab pendapatan, lupa mengurangkan biaya', 'pendapatan ' + kat[idx], fm),
            jalur(M + K, 'menjumlahkan pendapatan dan biaya, bukan mengurangkannya', MT + ' + ' + KT, fm),
            jalur(K, 'menjawab biaya, bukan laba', 'biaya ' + kat[idx], fm),
            jalur(M4 - K4, 'menghitung laba keempat bulan, bukan satu bulan', dolar(M4) + ' - ' + dolar(K4), fm),
            jalur(masuk[idx] - keluar[(idx + 1) % 4], 'membaca batang biaya ' + kat[(idx + 1) % 4] + ', bukan ' + kat[idx], MT + ' - ' + dolar(keluar[(idx + 1) % 4]), fm),
            jalur(masuk[(idx + 3) % 4] - keluar[(idx + 3) % 4], 'menghitung laba ' + kat[(idx + 3) % 4] + ', bukan ' + kat[idx], dolar(masuk[(idx + 3) % 4]) + ' - ' + dolar(keluar[(idx + 3) % 4]), fm)
          ];
        }
        if (level === 'sedang') return [
          jalur(laba / K * 100, 'memakai biaya sebagai dasar persentase', LT + ' ÷ ' + KT + ' × 100%', fm),
          jalur(K / M * 100, 'menghitung persentase biaya terhadap pendapatan', KT + ' ÷ ' + MT + ' × 100%', fm),
          jalur(jumlah(masuk.map(function (x, j) { return (x - keluar[j]) / x * 100; })) / 4, 'merata-ratakan persentase laba tiap bulan tanpa bobot pendapatan',
            '(' + masuk.map(function (x, j) { return angka((x - keluar[j]) / x * 100) + '%'; }).join(' + ') + ') ÷ 4', fm),
          jalur(laba / (M + K) * 100, 'membagi laba dengan jumlah pendapatan dan biaya', LT + ' ÷ (' + MT + ' + ' + KT + ') × 100%', fm),
          jalur(M / K * 100, 'membandingkan pendapatan dengan biaya', MT + ' ÷ ' + KT + ' × 100%', fm)
        ];
        return [
          jalur(laba, 'lupa mengurangkan beban tambahan', MT + ' - ' + KT, fm),
          jalur(laba + beban, 'menambahkan beban tambahan, bukan mengurangkannya', LT + ' + ' + dolar(beban), fm),
          jalur(laba - 4 * beban, 'menganggap beban tambahan terjadi setiap bulan', LT + ' - 4 × ' + dolar(beban), fm),
          jalur(M - beban, 'lupa mengurangkan biaya rutin', MT + ' - ' + dolar(beban), fm),
          jalur(K + beban, 'menjawab seluruh biaya (biaya rutin ditambah beban tambahan), bukan laba', KT + ' + ' + dolar(beban), fm)
        ];
      });
    if (level === 'sedang') s.maks = 100;           // persentase laba terhadap pendapatan tidak mungkin melebihi 100%
    s.gambar = batang('Pendapatan dan Biaya Usaha', kat, [{ nama: 'Pendapatan', nilai: masuk }, { nama: 'Biaya rutin', nilai: keluar }], 'Dolar ($)', level);
    return pengayaan(s, 'Tambahan tim: laba, margin, dan beban tambahan dari dua seri batang.');
  }

  function targetGrafik(a, level) {
    var n = level === 'mudah' ? 2 : 4, N = level === 'mudah' ? 3 : level === 'sedang' ? 6 : 8;
    var goal = a.kelipatan(120, 300, 10), vals = [], kat = [];
    for (var i = 0; i < n; i++) { vals.push(goal - a.kelipatan(10, 90, 10)); kat.push('Bulan ' + (i + 1)); }
    var total = jumlah(vals), sisa = goal * N - total, hasil = sisa / (N - n);
    // dimulai dari rumus rata-rata dengan substitusi (catatan QC no. 20)
    var m = N - n, mx = (m === 1 ? '' : m) + 'x', isi = vals.join(' + ');
    var olah = [
      'Rata-rata = jumlah semua data ÷ banyak data. Misalkan rata-rata pada ' + m + ' bulan tersisa = x, sehingga jumlah ' + (m === 1 ? 'bulan itu x' : 'bulan-bulan itu ' + mx) + ':',
      R(T('rata-rata') + ' = \\frac{' + T('jumlah permohonan') + '}{' + T('banyak bulan') + '}'),
      R(goal + ' = \\frac{' + isi + ' + ' + mx + '}{' + N + '}'),
      'Kalikan kedua ruas dengan ' + N + ':',
      R(goal + ' \\times ' + N + ' = ' + isi + ' + ' + mx),
      R(E(goal * N) + ' = ' + E(total) + ' + ' + mx),
      R(mx + ' = ' + E(goal * N) + ' - ' + E(total) + ' = ' + E(sisa))
    ];
    if (m > 1) olah.push(R('x = \\frac{' + E(sisa) + '}{' + m + '} ' + samaE(hasil)));
    var s = spec('Grafik menunjukkan jumlah permohonan yang selesai diproses pada ' + n + ' bulan pertama. Kantor menargetkan rata-rata ' + goal + ' permohonan selesai per bulan selama ' + N + ' bulan.',
      'Berapa rata-rata permohonan per bulan yang harus diselesaikan pada bulan-bulan tersisa agar target tepat tercapai? Bulatkan sampai dua angka di belakang koma.', hasil, 'permohonan/bulan', { n: n, goal: goal, N: N },
      [langkah('selesai', vals.map(function (_, j) { return 'x0_' + j; }).join('+')), langkah('jawab', '(goal*N-selesai)/(N-n)')],
      bahasHitung(['Permohonan selesai menurut grafik: ' + kat.map(function (k, j) { return k + ' ' + vals[j]; }).join(', ') + '.',
        'Target rata-rata ' + goal + ' permohonan per bulan selama ' + N + ' bulan; sisa waktu ' + N + ' - ' + n + ' = ' + m + ' bulan.'],
      'Rata-rata permohonan per bulan (x) yang harus diselesaikan pada ' + m + ' bulan tersisa agar target tepat tercapai.', olah,
      'Jadi, rata-rata yang harus diselesaikan pada bulan-bulan tersisa ' + kataHasil(hasil) + angka(hasil) + ' permohonan/bulan.'),
      function (fm) {
        var kurangT = '(' + goal + ' × ' + N + ' - ' + total + ')';
        return [
          jalur(sisa, 'menjawab kekurangan total, bukan rata-rata per bulan', goal + ' × ' + N + ' - ' + total, fm),
          jalur(sisa / N, 'membagi kekurangan dengan seluruh bulan, bukan dengan bulan yang tersisa', kurangT + ' ÷ ' + N, fm),
          jalur(sisa / n, 'membagi kekurangan dengan banyak bulan yang sudah lewat', kurangT + ' ÷ ' + n, fm),
          jalur(total / n, 'menjawab rata-rata bulan-bulan yang sudah lewat', total + ' ÷ ' + n, fm),
          jalur(goal + (goal - total / n), 'menambahkan kekurangan rata-rata per bulan yang sudah lewat pada target bulanan', goal + ' + (' + goal + ' - ' + total + ' ÷ ' + n + ')', fm),
          jalur(goal * N / (N - n), 'membagi target seluruh periode dengan bulan yang tersisa, lupa mengurangkan yang sudah selesai', goal + ' × ' + N + ' ÷ ' + (N - n), fm)
        ];
      });
    s.gambar = batang('Permohonan Selesai Diproses', kat, [{ nama: 'Selesai', nilai: vals }], 'Permohonan', level);
    return pengayaan(s, 'Tambahan tim: rata-rata yang masih diperlukan agar target rata-rata tercapai.');
  }

  function gcd(a, b) { while (b) { var t = a % b; a = b; b = t; } return a; }
  // Titik harus dapat digeser tepat ke nilainya: rentang sumbu paling banyak 120 kali langkah geser.
  var POSISI_MAKS = 120;
  // Baris persamaan pembahasan garis: "§ " + notasi rumus.js (ditulis langsung karena variasi.js tidak memuat rumus.js).
  function persamaanGaris(notasi) { return '§ ' + notasi; }
  function angkaGaris(n) { return angka(n).replace(',', '{,}'); }
  /**
   * `bahas` berisi Diketahui sampai Pengerjaan; Kesimpulan (posisi akhir kelima titik) ditambahkan di sini
   * dari nilai kunci, jadi selalu sama dengan gambar kunci.
   */
  function garisSpec(judul, teks, param, steps, vals, bahas, satuan) {
    if (vals.some(function (v) { return !(v > 0) || !Number.isInteger(v); })) return null;
    var kat = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'], mx = Math.max.apply(null, vals), mn = Math.min.apply(null, vals);
    var pangkat = Math.pow(10, Math.floor(Math.log10((mx - mn) / 4 || 1))), step = Math.ceil((mx - mn) / 4 / pangkat) * pangkat;
    var lo = Math.max(0, Math.floor(mn / step - 1) * step), hi = Math.ceil(mx / step + 1) * step;
    var snap = vals.reduce(function (g, v) { return gcd(g, v); }, step); snap = gcd(snap, lo);
    if ((hi - lo) / snap > POSISI_MAKS) return null;
    var chart = { kategori: kat, min: lo, maks: hi, langkah: step, judulY: 'Jumlah (' + satuan + ')', desimal: 0 };
    var awal = { nilai: [null, null, null, null, null] }, kunci = { nilai: vals };
    bahas = bahas.concat(['Kesimpulan', 'Geser titik ' + Fmt.daftarKata(kat.map(function (k, i) { return k + ' ke ' + angka(vals[i]) + ' ' + satuan; })) + ', sehingga garis tersambung dari Senin sampai Jumat.']);
    var s = spec(teks, 'Gambarkan nilai pada akhir setiap hari sesuai keterangan.', 0, '', param, steps, bahas, []);
    s.judul = judul + ' · Line Graph'; s.perintah = 'Geser tiap titik ke nilai yang benar pada sumbu vertikal.';
    s.gambar = [{ id: 'awal', jenis: 'garis', model: chart, state: awal, judul: 'Tampilan awal' }];
    s.gambarPembahasan = [{ id: 'kunci', jenis: 'garis', model: Object.assign({}, chart, { labelNilai: true }), state: kunci, judul: 'Kondisi akhir (kunci)' }];
    s.isian = { jenis: 'garis', kontrol: [{ nama: 'titik', label: 'Nilai tiap titik', min: lo, maks: hi, langkah: snap, satuan: satuan }], awal: awal, kunci: kunci, model: chart, kategori: kat };
    s.kunciTeks = kat.map(function (k, i) { return k + ' ' + angka(vals[i]); }).join('; ') + ' ' + satuan + '.';
    s.model.kunciLangkah = { nilai: ['n0', 'n1', 'n2', 'n3', 'n4'] }; s.model.snap = snap; s.model.min = lo; s.model.maks = hi;
    return s;
  }

  /*
   * Konteks perubahan berselang-seling. Konteks yang berbeda membuat kalimat soal berbeda, jadi bank tidak
   * cepat habis walaupun angkanya dibatasi kelipatan 25 (lihat POSISI_MAKS).
   */
  var KONTEKS_SELANG = [
    { judul: 'Persediaan dengan Jadwal Bergantian', sat: 'unit', pembuka: 'Sebuah gudang mencatat persediaan barang pada akhir hari.', naik: 'masuk', turun: 'keluar', tutup: 'Tidak ada perubahan persediaan lainnya.' },
    { judul: 'Isi Tangki Penampungan', sat: 'liter', pembuka: 'Isi sebuah tangki penampungan air dicatat pada akhir hari.', naik: 'diisi', turun: 'dipakai', tutup: 'Tidak ada perubahan isi tangki lainnya.' },
    { judul: 'Kotak Berkas di Ruang Arsip', sat: 'kotak', pembuka: 'Sebuah ruang arsip mencatat jumlah kotak berkas pada akhir hari.', naik: 'diterima', turun: 'dipindahkan ke gudang', tutup: 'Tidak ada perubahan jumlah kotak lainnya.' }
  ];

  function garisBergantian(a, level) {
    var k = a.pilih(KONTEKS_SELANG), sat = k.sat;
    // angka diundi ulang (pengacak yang sama, tetap deterministik) bila sumbunya terlalu rinci untuk digeser
    for (var coba = 0; coba < 50; coba++) {
      // kelipatan 25 agar sumbu tetap dapat digeser dengan tepat (lihat POSISI_MAKS)
      var awal = a.kelipatan(800, 8000, 25), satu = a.kelipatan(50, 400, 25), dua = a.kelipatan(25, 300, 25);
      var turun = level !== 'mudah', d2 = turun ? -dua : dua, vals = [awal, awal + satu, awal + satu + d2, awal + 2 * satu + d2, awal + 2 * satu + 2 * d2];
      var teks = k.pembuka + ' ' + (level === 'sulit' ? 'Pada akhir Jumat terdapat ' + angka(vals[4]) : 'Pada akhir Senin terdapat ' + angka(awal)) + ' ' + sat + '. Pada Selasa dan Kamis masing-masing ' + k.naik + ' ' + satu + ' ' + sat + '. Pada Rabu dan Jumat masing-masing ' + (turun ? k.turun : k.naik) + ' ' + dua + ' ' + sat + '. ' + k.tutup;
      var param = { satu: satu, dua: dua }; if (level === 'sulit') param.akhir = vals[4]; else param.awal = awal;
      var steps = [langkah('n0', level === 'sulit' ? 'akhir-2*satu+2*dua' : 'awal')];
      for (var i = 1; i < 5; i++) steps.push(langkah('n' + i, 'n' + (i - 1) + (i % 2 ? '+satu' : turun ? '-dua' : '+dua')));
      // pembahasan: satu persamaan per hari dari nilai akhir hari sebelumnya (sulit: Senin ditelusuri mundur dari Jumat)
      var P = persamaanGaris, hariG = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
      var bahas = ['Diketahui',
        level === 'sulit' ? 'Nilai akhir Jumat: ' + angka(vals[4]) + ' ' + sat + '.' : 'Nilai akhir Senin: ' + angka(awal) + ' ' + sat + '.',
        'Selasa dan Kamis: masing-masing ' + k.naik + ' ' + angka(satu) + ' ' + sat + '.',
        'Rabu dan Jumat: masing-masing ' + (turun ? k.turun : k.naik) + ' ' + angka(dua) + ' ' + sat + '.',
        'Ditanyakan', 'Nilai pada akhir setiap hari, Senin sampai Jumat (' + sat + ').',
        'Pengerjaan', 'Nilai akhir setiap hari dihitung dari nilai akhir hari sebelumnya:',
        P('\\text{nilai akhir hari ini} = \\text{nilai akhir hari sebelumnya} \\pm \\text{perubahan hari ini}')];
      if (level === 'sulit') {
        bahas.push('Nilai Senin belum diketahui, jadi telusuri mundur dari Jumat. Dari Senin ke Jumat ada dua kali ' + k.naik + ' ' + angka(satu) + ' ' + sat + ' dan dua kali ' + k.turun + ' ' + angka(dua) + ' ' + sat + ', jadi keduanya dibalik:',
          P('\\text{Senin} = ' + angkaGaris(vals[4]) + ' - 2 \\times ' + angkaGaris(satu) + ' + 2 \\times ' + angkaGaris(dua) + ' = ' + angkaGaris(awal)));
      } else bahas.push('Titik Senin adalah nilai awal, ' + angka(awal) + ' ' + sat + '.');
      for (var j = 1; j < 5; j++) {
        bahas.push(P('\\text{' + hariG[j] + '} = ' + angkaGaris(vals[j - 1]) + (j % 2 || !turun ? ' + ' : ' - ') + angkaGaris(j % 2 ? satu : dua) + ' = ' + angkaGaris(vals[j])));
      }
      var s = garisSpec(k.judul, teks, param, steps, vals, bahas, sat);
      if (!s) continue;
      // stem tingkat mudah hanya memuat pertambahan, jadi namanya tidak menyebut arus keluar
      s.jenisSoal = turun ? 'Arus masuk dan keluar bergantian' : 'Pertambahan dengan besaran bergantian';
      s.pola = 'garis-bergantian-' + (turun ? 'masuk-keluar' : 'masuk');
      s.kategoriRiset = 'pengayaan';
      s.catatanRiset = 'Pengembangan tim: perubahan berselang-seling per hari; contoh riset memakai perubahan tetap dan satu kejadian.';
      return s;
    }
    return null;
  }

  /*
   * Pertumbuhan majemuk dari nilai hari sebelumnya. Bonus 50% atau 100% menjaga nilai tetap bulat dan sumbu dapat
   * digeser tepat; skala U (1 sampai 500) dan tiga konteks memberi ragam tanpa angka yang rumit.
   *   mudah   penggandaan (100%) saja, tanpa transaksi tambahan
   *   sedang  bonus dan satu transaksi sekali-jadi pada Rabu atau Kamis
   *   sulit   bonus, tambahan tetap, dan satu transaksi sekali-jadi
   * Acuan Line Graph memakai kenaikan persen dari nilai AWAL, jadi keluarga ini ditandai sebagai pengayaan.
   */
  var KONTEKS_MAJEMUK = [
    { judul: 'Saldo Poin dengan Bonus Majemuk', sat: 'poin',
      awal: 'Dalam simulasi poin pelatihan, saldo akhir Senin adalah {x} poin.',
      tumbuh: 'Mulai Selasa hingga Jumat, setiap hari diberikan bonus {r}% dari saldo akhir hari sebelumnya', tambah: ', lalu tambahan tetap {t} poin untuk penyelesaian tugas',
      plus: 'Khusus {h}, setelah bonus dihitung, ada tambahan {s} poin dari kuis.', minus: 'Khusus {h}, setelah bonus dihitung, sebanyak {s} poin ditukar dengan hadiah.',
      tutup: 'Tidak ada transaksi lain.' },
    { judul: 'Pengikut Akun Media Sosial', sat: 'pengikut',
      awal: 'Pada akhir Senin, akun media sosial resmi sebuah kantor memiliki {x} pengikut.',
      tumbuh: 'Mulai Selasa hingga Jumat, jumlah pengikut setiap hari bertambah {r}% dari jumlah pada akhir hari sebelumnya', tambah: ', lalu bertambah lagi {t} pengikut dari iklan berbayar',
      plus: 'Khusus {h}, setelah pertambahan itu, siaran langsung menambah {s} pengikut.', minus: 'Khusus {h}, setelah pertambahan itu, pembersihan akun palsu mengurangi {s} pengikut.',
      tutup: 'Tidak ada perubahan lain.' },
    { judul: 'Jumlah Sel dalam Kultur', sat: 'sel',
      awal: 'Pada akhir Senin, sebuah kultur di laboratorium berisi {x} sel.',
      tumbuh: 'Mulai Selasa hingga Jumat, jumlah sel setiap hari bertambah {r}% dari jumlah pada akhir hari sebelumnya', tambah: ', lalu peneliti menambahkan {t} sel baru',
      plus: 'Khusus {h}, setelah pertambahan itu, peneliti menambahkan lagi {s} sel.', minus: 'Khusus {h}, setelah pertambahan itu, sebanyak {s} sel diambil untuk pengujian.',
      tutup: 'Tidak ada perubahan lain.' }
  ];
  var SKALA_MAJEMUK = [1, 2, 4, 5, 10, 20, 25, 50, 100, 200, 250, 500];

  function garisMajemuk(a, level) {
    var k = a.pilih(KONTEKS_MAJEMUK), sat = k.sat;
    var isi = function (t, o) { return t.replace(/\{(\w)\}/g, function (_, n) { return o[n]; }); };
    for (var coba = 0; coba < 400; coba++) {
      var r = level === 'mudah' ? 100 : a.pilih([50, 100]), U = a.pilih(SKALA_MAJEMUK), f = 1 + r / 100;
      var awal = a.bulat(2, 24) * U;
      var tambahan = level === 'sulit' ? a.bulat(1, 12) * U : 0;
      var sekali = level === 'mudah' ? 0 : a.bulat(1, 12) * U * (a.untung(0.5) ? 1 : -1), hari = a.pilih([2, 3]), namaHari = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'][hari];
      var param = { awal: awal, r: r }; if (tambahan) param.tambahan = tambahan; if (sekali) param.sekali = Math.abs(sekali);
      var steps = [langkah('n0', 'awal')], vals = [awal];
      for (var i = 1; i < 5; i++) {
        steps.push(langkah('n' + i, 'n' + (i - 1) + '*(1+r/100)' + (tambahan ? '+tambahan' : '') + (i === hari && sekali ? (sekali > 0 ? '+sekali' : '-sekali') : '')));
        vals.push(vals[i - 1] * f + tambahan + (i === hari ? sekali : 0));
      }
      var o = { x: angka(awal), r: r, t: angka(tambahan), s: angka(Math.abs(sekali)), h: namaHari };
      var teks = isi(k.awal, o) + ' ' + isi(k.tumbuh, o) + (tambahan ? isi(k.tambah, o) : '') + '.' + (sekali ? ' ' + isi(sekali > 0 ? k.plus : k.minus, o) : '') + ' ' + k.tutup;
      // pembahasan: rumus pertumbuhan dari nilai hari sebelumnya, faktor pengali, lalu satu persamaan per hari
      var P = persamaanGaris, hariG = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'], fk = angkaGaris(f);
      var bahas = ['Diketahui', 'Nilai akhir Senin: ' + angka(awal) + ' ' + sat + '.',
        'Selasa sampai Jumat: setiap hari bertambah ' + r + '% dari nilai akhir hari sebelumnya' + (tambahan ? ', lalu ditambah ' + angka(tambahan) + ' ' + sat + ' setiap hari' : '') + '.'];
      if (sekali) bahas.push('Khusus ' + namaHari + ': setelah pertambahan itu, ' + (sekali > 0 ? 'bertambah ' : 'berkurang ') + angka(Math.abs(sekali)) + ' ' + sat + '.');
      bahas.push('Ditanyakan', 'Nilai pada akhir setiap hari, Senin sampai Jumat (' + sat + ').',
        'Pengerjaan', 'Pertambahan persen dihitung dari nilai akhir hari sebelumnya, jadi dasar persennya berubah setiap hari:',
        P('\\text{nilai hari ini} = \\text{nilai hari sebelumnya} \\times (100\\% + ' + r + '\\%)' + (tambahan ? ' + ' + angkaGaris(tambahan) : '')),
        'Faktor pengalinya:', P('100\\% + ' + r + '\\% = ' + (100 + r) + '\\% = ' + fk));
      if (sekali) bahas.push('Pada ' + namaHari + ', pertambahan persen' + (tambahan ? ' dan tambahan tetap' : '') + ' dihitung lebih dahulu, lalu ' + (sekali > 0 ? 'ditambah ' : 'dikurangi ') + angka(Math.abs(sekali)) + ' ' + sat + '; hasilnya menjadi dasar hari berikutnya.');
      bahas.push('Titik Senin adalah nilai awal, ' + angka(awal) + ' ' + sat + '.');
      for (var j = 1; j < 5; j++) {
        bahas.push(P('\\text{' + hariG[j] + '} = ' + angkaGaris(vals[j - 1]) + ' \\times ' + fk + (tambahan ? ' + ' + angkaGaris(tambahan) : '') +
          (j === hari && sekali ? (sekali > 0 ? ' + ' : ' - ') + angkaGaris(Math.abs(sekali)) : '') + ' = ' + angkaGaris(vals[j])));
      }
      var s = garisSpec(k.judul, teks, param, steps, vals, bahas, sat);
      if (!s) continue;
      s.jenisSoal = tambahan && sekali ? 'Pertumbuhan majemuk, tambahan tetap berulang, dan transaksi sekali-jadi' : sekali ? 'Pertumbuhan majemuk dan transaksi sekali-jadi' : 'Penggandaan tetap setiap hari';
      s.pola = 'garis-majemuk';
      s.kategoriRiset = 'pengayaan';
      s.catatanRiset = 'Acuan Line Graph memakai kenaikan persen dari nilai awal dan satu biaya; pertumbuhan dari nilai hari sebelumnya adalah modifikasi tim.';
      return s;
    }
    return null;
  }

  var KELUARGA = [
    { id: 'kerja-bersama', nama: 'Laju kerja dua tim', subtes: 'ku', submateri: 'cerita', fn: sampaiCukup(kerja) },
    { id: 'kecepatan-rata', nama: 'Kecepatan rata-rata dan waktu berhenti', subtes: 'ku', submateri: 'cerita', fn: sampaiCukup(perjalanan) },
    { id: 'rata-gabungan', nama: 'Rata-rata gabungan dan nilai yang hilang', subtes: 'ku', submateri: 'cerita', fn: sampaiCukup(rata) },
    { id: 'harga-semula', nama: 'Harga sebelum diskon dan ongkos kirim', subtes: 'ku', submateri: 'cerita', fn: sampaiCukup(hargaAwal) },
    { id: 'bunga-tunggal', nama: 'Bunga tunggal, saldo, dan setoran awal', subtes: 'ku', submateri: 'cerita', fn: sampaiCukup(bunga) },
    { id: 'peluang-kupon', nama: 'Peluang tanpa pengembalian', subtes: 'ku', submateri: 'cerita', fn: sampaiCukup(peluang) },
    { id: 'barisan-kursi', nama: 'Barisan dan deret aritmetika', subtes: 'ku', submateri: 'cerita', fn: sampaiCukup(barisan) },
    { id: 'irisan-kelas', nama: 'Gabungan dan irisan dua kelompok', subtes: 'ku', submateri: 'cerita', fn: sampaiCukup(himpunan) },
    { id: 'tabel-rata-tertimbang', nama: 'Biaya rata-rata tertimbang dan retur', subtes: 'ku', submateri: 'tabel', fn: sampaiCukup(rataTabel) },
    { id: 'tabel-target', nama: 'Pencapaian dan perubahan target cabang', subtes: 'ku', submateri: 'tabel', fn: sampaiCukup(targetTabel) },
    { id: 'tabel-produktivitas', nama: 'Produktivitas per orang per jam', subtes: 'ku', submateri: 'tabel', fn: sampaiCukup(produktivitas) },
    { id: 'grafik-laba', nama: 'Laba dan margin dari dua seri batang', subtes: 'ku', submateri: 'grafik', fn: sampaiCukup(labaGrafik) },
    { id: 'grafik-target-rata', nama: 'Rata-rata yang diperlukan untuk mencapai target', subtes: 'ku', submateri: 'grafik', fn: sampaiCukup(targetGrafik) },
    { id: 'garis-bergantian', nama: 'Perubahan dengan jadwal bergantian', subtes: 'pn', submateri: 'garis', fn: garisBergantian },
    { id: 'garis-majemuk', nama: 'Pertumbuhan majemuk dari nilai hari sebelumnya', subtes: 'pn', submateri: 'garis', fn: garisMajemuk }
  ];

  function buat(id, level, benih, opsi) {
    var kel = KELUARGA.filter(function (k) { return k.id === id; })[0];
    if (!kel) throw new Error('keluarga variasi tidak dikenal: ' + id);
    var a = Rng.alat(benih), s = kel.fn(a, level);
    if (!s) return null;
    var ctx = { subtes: kel.subtes, submateri: kel.submateri, keluarga: id, level: level, benih: benih, a: a, target: (opsi || {}).target };
    s.jenisSoal = s.jenisSoal || kel.nama;
    s.model.topik = kel.nama;
    var paramSidik = Object.keys(s.model.param).map(function (k) { return Number(s.model.param[k]); });
    (s.gambar || []).forEach(function (g) {
      if (g.jenis === 'tabel') g.model.baris.forEach(function (r) { r.sel.forEach(function (v) { paramSidik.push(Number(v.replace(/\./g, '').replace(',', '.'))); }); });
      if (g.jenis === 'bar') g.model.seri.forEach(function (seri) { paramSidik = paramSidik.concat(seri.nilai); });
    });
    s.sidik = { inti: id + '|' + JSON.stringify([s.model.param, s.gambar || [], s.teks, s.pertanyaan]),
      param: paramSidik, entitas: id + '|' + level + '|' + (s.teks.join(' ') + s.pertanyaan).replace(/\d+(?:[.,]\d+)*/g, '#') };
    var b = kel.subtes === 'pn' ? Butir.rakitIsian(ctx, s) : Butir.rakitPg(ctx, s);
    if (b) ['pola', 'kategoriRiset', 'catatanRiset'].forEach(function (k) { if (s[k]) b[k] = s[k]; });
    return b;
  }

  return { KELUARGA: KELUARGA, buat: buat };
});
