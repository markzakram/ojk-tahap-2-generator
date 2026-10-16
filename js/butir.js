/*
 * butir.js — perakit butir pilihan ganda dari "spesifikasi" sebuah keluarga soal.
 *
 * Setiap keluarga soal (cerita, tabel, grafik, verbal, figural) cukup menyiapkan
 * spesifikasi: teks stimulus, pertanyaan, nilai kunci + pengecoh bersama
 * alasannya, langkah hitung, dan model data. Berkas ini menjadikannya satu butir
 * dengan bentuk yang sama untuk semua keluarga:
 *
 *   {
 *     subtes, submateri, keluarga, level, benih,
 *     jenis: 'pg',
 *     stimulus: { judul, teks:[paragraf], gambar:[{id, jenis, model}] },
 *     pertanyaan, perintah,
 *     opsi: [{ huruf, teks, nilai, alasan, gambar }],  kunci: indeks 0..4,
 *     langkah: [{ nama, rumus }],     langkah hitung yang diperiksa ulang validator
 *     pembahasan: [baris],
 *     model: { param, tampil, ... },  data mentah untuk validator
 *     sidik: { inti, param, entitas } sidik anti-kembar
 *   }
 *
 * Butir interaktif (Penalaran Numerik) punya `jenis: 'isian'` dan dirakit sendiri
 * oleh penalaran.js.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./format.js'), require('./pilihan.js'));
    module.exports = api;
  } else {
    api = factory(root.Fmt, root.Pilihan);
    root.Butir = api;
  }
})(typeof self !== 'undefined' ? self : this, function (Fmt, Pilihan) {
  'use strict';

  var TINGKAT = [
    { id: 'mudah', nama: 'Mudah' },
    { id: 'sedang', nama: 'Sedang' },
    { id: 'sulit', nama: 'Sulit' }
  ];

  function namaTingkat(id) {
    for (var i = 0; i < TINGKAT.length; i++) if (TINGKAT[i].id === id) return TINGKAT[i].nama;
    return id;
  }

  /**
   * @param {object} ctx { subtes, submateri, keluarga, level, benih, a (pengacak), target }
   * @param {object} spec lihat komentar berkas ini
   * @returns {object|null}
   */
  function rakitPg(ctx, spec) {
    var pil = spec.pilihanJadi;
    if (!pil) {
      pil = Pilihan.susun(ctx.a, {
        kunci: spec.kunci, fmt: spec.fmt, pengecoh: spec.pengecoh, desimal: spec.desimal,
        min: spec.min, maks: spec.maks, urut: spec.urut, target: ctx.target, bulat: spec.bulat,
        langkah: spec.langkahPilihan, tanpaPengali: spec.tanpaPengali
      });
    }
    if (!pil) return null;

    var opsi = pil.opsi.map(function (o, i) {
      return { huruf: Fmt.huruf(i), teks: o.teks, nilai: o.nilai, alasan: o.alasan || null, gambar: o.gambar || null };
    });

    var butir = {
      subtes: ctx.subtes, submateri: ctx.submateri, keluarga: ctx.keluarga,
      level: ctx.level, benih: ctx.benih, jenis: 'pg',
      stimulus: { judul: spec.judul || null, teks: spec.teks || [], gambar: spec.gambar || [] },
      pertanyaan: spec.pertanyaan || '',
      perintah: spec.perintah || null,
      opsi: opsi, kunci: pil.kunciIndex,
      langkah: spec.langkah || [],
      model: spec.model || {},
      sidik: spec.sidik || {}
    };
    butir.pembahasan = susunPembahasan(butir, spec);
    return butir;
  }

  /**
   * Pembahasan langkah demi langkah:
   *   Jenis soal -> langkah-langkah -> mengapa pilihan lain keliru -> Jawaban.
   * Alasan pengecoh yang berasal dari kesalahan hitung ditulis per huruf.
   */
  function susunPembahasan(butir, spec) {
    var baris = [];
    if (spec.jenisSoal) baris.push('Jenis soal: ' + spec.jenisSoal + '.');
    (spec.pembahasan || []).forEach(function (b) { baris.push(b); });
    var alasan = [];
    butir.opsi.forEach(function (o, i) {
      if (i === butir.kunci || !o.alasan) return;
      alasan.push('• ' + o.huruf + (o.gambar ? '' : ' (' + o.teks + ')') + ': ' + o.alasan + '.');
    });
    if (alasan.length && !spec.tanpaAlasan) {
      baris.push('Pilihan lain yang menjebak:');
      alasan.forEach(function (b) { baris.push(b); });
    }
    var k = butir.opsi[butir.kunci];
    baris.push('Jawaban: ' + k.huruf + (spec.tulisKunci === false ? '' : ' (' + k.teks + ')'));
    return baris;
  }

  /**
   * Butir interaktif (Penalaran Numerik). Jawabannya berupa KONDISI AKHIR
   * tampilan, bukan satu huruf:
   *
   *   isian: { jenis, kontrol:[...], awal, kunci, ... }   spesifikasi widget
   *   kunciTeks                                           kunci dalam kalimat
   *   opsi                                                pilihan per tab (tabel) atau []
   *   gambarPembahasan                                    gambar kondisi kunci
   */
  function rakitIsian(ctx, spec) {
    var butir = {
      subtes: 'pn', submateri: ctx.submateri, keluarga: ctx.keluarga,
      level: ctx.level, benih: ctx.benih, jenis: 'isian',
      stimulus: { judul: spec.judul || null, teks: spec.teks || [], gambar: spec.gambar || [] },
      pertanyaan: spec.pertanyaan || '',
      perintah: spec.perintah || null,
      isian: spec.isian,
      opsi: (spec.opsi || []).map(function (t, i) { return { huruf: Fmt.huruf(i), teks: t, nilai: null, alasan: null, gambar: null }; }),
      kunci: null, kunciTeks: spec.kunciTeks,
      langkah: spec.langkah || [],
      model: spec.model || {},
      sidik: spec.sidik || {},
      gambarPembahasan: spec.gambarPembahasan || []
    };
    var baris = [];
    if (spec.jenisSoal) baris.push('Jenis soal: ' + spec.jenisSoal + '.');
    (spec.pembahasan || []).forEach(function (b) { baris.push(b); });
    baris.push('Jawaban: ' + spec.kunciTeks);
    butir.pembahasan = baris;
    return butir;
  }

  return { TINGKAT: TINGKAT, namaTingkat: namaTingkat, rakitPg: rakitPg, rakitIsian: rakitIsian, susunPembahasan: susunPembahasan };
});
