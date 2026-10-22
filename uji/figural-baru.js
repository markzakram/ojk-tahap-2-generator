/* Uji keluarga figural tambahan (transformasi, lipat kertas, petak, matriks tumpuk/bentuk).
 *
 *   node uji/figural-baru.js                      semua keluarga tambahan, 120 butir per tingkat
 *   node uji/figural-baru.js --keluarga serial-petak,serial-jarum --n 400
 *   node uji/figural-baru.js --benih 9 --raster 0
 *
 * Untuk tiap keluarga dan tiap tingkat (mudah, sedang, sulit) dibuat N butir dengan benih berbeda
 * dan posisi kunci bergiliran A-E, lalu diperiksa:
 *   - butir terbentuk (paling banyak 5% gagal), berbentuk pilihan ganda figural lima opsi, kunci di
 *     posisi yang diminta, klasifikasi Kerangka Course sesuai, pola berawalan id keluarga,
 *     kategori riset "pengayaan" dengan catatan;
 *   - lulus validator (pemeriksa independen cek-*.js dan gambar pembahasan);
 *   - semua gambar tergambar, ukurannya wajar, dan sebagian dirasterkan seperti PNG CLI;
 *   - mutasi: isi opsi kunci ditukar dengan pengecoh (data model ikut ditukar) HARUS ditolak validator;
 *   - teks bersih (tanpa undefined/NaN/{HURUF}, tanpa analisis opsi salah), tiap pengecoh punya alasan;
 *   - tidak ada butir kembar atau nyaris sama (Validator.mirip) di antara seluruh butir keluarga itu;
 *   - variasi: banyak pola berbeda per tingkat.
 * Baris terakhir: "HASIL: ..." (kode keluar 0) atau "GAGAL: ..." (kode keluar 1).
 */
'use strict';
var Validator = require('../js/validator.js');
var Gambar = require('../js/gambar.js');
var Kerangka = require('../js/kerangka.js');
var SvgRaster = require('../js/svgraster.js');

var MODUL = ['transformasi', 'transformasi-analogi', 'lipat-kertas', 'serial-petak', 'matriks-tumpuk', 'matriks-bentuk'];
var LEVEL = ['mudah', 'sedang', 'sulit'];
var HURUF = ['A', 'B', 'C', 'D', 'E'];

function arg(nama, baku) {
  var i = process.argv.indexOf(nama);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : baku;
}

function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function salin(x) { return JSON.parse(JSON.stringify(x)); }

function semuaTeks(b) {
  var t = [b.pertanyaan, b.perintah].concat(b.pembahasan || [], (b.stimulus.teks || []));
  (b.opsi || []).forEach(function (o) { t.push(o.teks); if (o.alasan) t.push(o.alasan); });
  (Gambar.daftarSoal(b).concat(Gambar.daftarPembahasan(b))).forEach(function (g) { if (g.judul) t.push(g.judul); });
  return t.filter(function (x) { return x != null; }).map(String);
}

/** Tukar seluruh isi opsi i dan j (huruf tetap), juga data model.pilihan bila ada. */
function tukarOpsi(b, i, j) {
  var c = salin(b), oi = c.opsi[i], oj = c.opsi[j];
  ['teks', 'nilai', 'alasan', 'gambar'].forEach(function (k) { var t = oi[k]; oi[k] = oj[k]; oj[k] = t; });
  // id dan judul gambar tetap mengikuti hurufnya
  if (oi.gambar && oj.gambar) {
    ['id', 'judul'].forEach(function (k) { var t = oi.gambar[k]; oi.gambar[k] = oj.gambar[k]; oj.gambar[k] = t; });
  }
  if (c.model && Array.isArray(c.model.pilihan)) { var p = c.model.pilihan[i]; c.model.pilihan[i] = c.model.pilihan[j]; c.model.pilihan[j] = p; }
  return c;
}

/**
 * Jalankan seluruh pemeriksaan.
 * @param {function(boolean, string, string=)} cek  pencatat hasil, sama seperti di uji/semua.js
 * @param {{n?:number, benih?:number, raster?:number, keluarga?:Array<string>}} o
 * @returns {{keluarga:number, butir:number}}
 */
function jalankan(cek, o) {
  o = o || {};
  var N = o.n || 120, DASAR = (o.benih == null ? 2026 : o.benih) >>> 0, RASTER = o.raster == null ? 2 : o.raster, PILIH = o.keluarga || null;
  var keluarga = [], totalButir = 0;
  MODUL.forEach(function (nama) {
    var mod = require('../js/' + nama + '.js');
    (mod.KELUARGA || []).forEach(function (k) {
      if (!PILIH || PILIH.indexOf(k.id) >= 0) keluarga.push({ mod: mod, modul: nama, kel: k });
    });
  });
  if (PILIH) PILIH.forEach(function (id) { if (!keluarga.some(function (x) { return x.kel.id === id; })) cek(false, 'keluarga ' + id + ' ditemukan'); });
  // rincian masalah (paling banyak enam) dikirim sebagai keterangan, dipisah " || "
  function lapor(ok, teks, rinci) { cek(ok, teks, !ok && rinci && rinci.length ? rinci.slice(0, 6).join(' || ') : ''); }

  keluarga.forEach(function (x) {
    var id = x.kel.id, semua = [], sub = Kerangka.KELUARGA[id];
    if (x.kel.submateri !== 'figural' || ['serial', 'matriks'].indexOf(x.kel.kolam) < 0) lapor(false, id + ': KELUARGA harus ber-submateri figural dan ber-kolam serial atau matriks');
    if (!sub) lapor(false, id + ': belum dipetakan di kerangka.js');
    LEVEL.forEach(function (level) {
      var masalah = [], dibuat = 0, lulus = 0, pola = {}, waktu = 0, mutasiLolos = 0, raster = 0, sebelumnya = null;
      for (var i = 0; i < N; i++) {
        var benih = (DASAR * 1000003 + hash(id + '|' + level) + i * 7919) >>> 0, target = i % 5;
        var opsi = { target: target, polaDipakai: sebelumnya && i % 2 ? [sebelumnya] : [] };
        var t0 = Date.now(), b;
        try { b = x.mod.buat(id, level, benih, opsi); } catch (e) { masalah.push('benih ' + benih + ': buat() melempar ' + (e && e.stack ? e.stack.split('\n').slice(0, 2).join(' | ') : e)); continue; }
        waktu += Date.now() - t0;
        if (!b) continue;
        dibuat++;
        var tanda = 'benih ' + benih + ' (' + level + ')';
        var mb = [];
        if (b.subtes !== 'ku' || b.submateri !== 'figural' || b.keluarga !== id || b.level !== level || b.jenis !== 'pg') mb.push('identitas butir keliru (subtes/submateri/keluarga/level/jenis)');
        if (!b.opsi || b.opsi.length !== 5) mb.push('jumlah opsi bukan 5');
        if (b.kunci !== target) mb.push('kunci di ' + HURUF[b.kunci] + ', diminta ' + HURUF[target]);
        if (!b.model || !b.model.tipe) mb.push('model.tipe kosong');
        if (typeof b.pola !== 'string' || b.pola.indexOf(id + ':') !== 0) mb.push('pola harus berawalan "' + id + ':" (' + b.pola + ')');
        if (b.kategoriRiset !== 'pengayaan' || !b.catatanRiset) mb.push('kategoriRiset harus "pengayaan" dan catatanRiset terisi');
        try { var k = Kerangka.klasifikasi(b); if (k.subchapter !== sub) mb.push('subchapter ' + k.subchapter + ', seharusnya ' + sub); } catch (e) { mb.push(e.message); }
        var v = Validator.periksaButir(b);
        if (!v.lulus) mb.push('validator: ' + v.masalah.slice(0, 4).join('; '));
        // gambar
        var daftar = Gambar.daftarSoal(b).concat(Gambar.daftarPembahasan(b));
        daftar.forEach(function (g) {
          try {
            var r = Gambar.svg(g);
            var opsiG = /^opsi-/.test(g.id), bahas = /^bahas-/.test(g.id);
            var maksL = opsiG ? 320 : 760, maksT = opsiG ? 320 : 640;
            if (r.lebar > maksL || r.tinggi > maksT) mb.push('gambar ' + g.id + ' terlalu besar (' + Math.round(r.lebar) + 'x' + Math.round(r.tinggi) + ', batas ' + maksL + 'x' + maksT + ')');
            if (r.lebar < (opsiG ? 60 : 120)) mb.push('gambar ' + g.id + ' terlalu kecil (' + Math.round(r.lebar) + ')');
            if (raster < RASTER * daftar.length && (i < RASTER)) { SvgRaster.gambar(r.svg, 1); raster++; }
            if (bahas && !g.judul) mb.push('gambar pembahasan ' + g.id + ' tanpa judul');
          } catch (e) { mb.push('gambar ' + g.id + ' gagal: ' + e.message); }
        });
        // teks
        semuaTeks(b).forEach(function (t) {
          if (/undefined|NaN|\[object|\{HURUF\}|null\b/.test(t)) mb.push('teks janggal: ' + t.slice(0, 90));
        });
        if ((b.pembahasan || []).some(function (t) { return /pilihan lain|menjebak/i.test(t); })) mb.push('pembahasan memuat analisis opsi salah');
        if (!(b.pertanyaan || b.perintah)) mb.push('tidak ada pertanyaan maupun perintah');
        b.opsi.forEach(function (o, j) { if (j !== b.kunci && !o.alasan) mb.push('pengecoh ' + HURUF[j] + ' tanpa alasan'); });
        // mutasi: jawaban benar dipindah ke opsi lain tanpa memindah kunci
        if (v.lulus) {
          var j = (b.kunci + 1 + (i % 4)) % 5, mut = tukarOpsi(b, b.kunci, j);
          if (Validator.periksaButir(mut).lulus) { mutasiLolos++; mb.push('mutasi (isi opsi ' + HURUF[b.kunci] + ' ditukar dengan ' + HURUF[j] + ') tetap lulus validator'); }
        }
        if (mb.length) masalah.push(tanda + ': ' + mb.join(' | '));
        else lulus++;
        pola[b.pola] = (pola[b.pola] || 0) + 1;
        sebelumnya = b.pola;
        b.id = id + '-' + level + '-' + i;
        semua.push(b);
      }
      totalButir += dibuat;
      if (dibuat < Math.ceil(N * 0.95)) masalah.unshift('hanya ' + dibuat + ' dari ' + N + ' butir terbentuk');
      var nPola = Object.keys(pola).length;
      if (dibuat && nPola < 2) masalah.push('variasi pola terlalu sedikit (' + nPola + ')');
      var ms = dibuat ? Math.round(waktu / dibuat) : 0;
      if (ms > 250) masalah.push('rata-rata ' + ms + ' md per butir (batas 250 md)');
      lapor(!masalah.length, id + ' ' + level + ': ' + dibuat + '/' + N + ' terbentuk, lulus ' + lulus + ', pola ' + nPola + ' (' + Object.keys(pola).sort().join(', ') + '), ' + ms + ' md/butir', masalah);
    });
    // kembar di antara seluruh butir keluarga ini (lintas tingkat, seperti pencari kembar paket)
    var sd = semua.map(function (b) { return Validator.buatSidik(b); }), kembar = [];
    for (var a = 0; a < sd.length; a++) {
      for (var c = a + 1; c < sd.length; c++) {
        var r = Validator.mirip(sd[a], sd[c]);
        if (r) kembar.push(semua[a].id + ' ~ ' + semua[c].id + ' (' + r.jenis + (r.beda != null ? ', beda ' + r.beda : '') + ')');
      }
    }
    lapor(!kembar.length, id + ': ' + kembar.length + ' pasangan kembar/nyaris sama di antara ' + semua.length + ' butir', kembar);
  });

  if (!keluarga.length) cek(false, 'keluarga figural tambahan terdaftar');
  return { keluarga: keluarga.length, butir: totalButir };
}

module.exports = { jalankan: jalankan, MODUL: MODUL };

if (require.main === module) {
  var gagal = 0, mulai = Date.now();
  var h = jalankan(function (ok, nama, info) {
    if (!ok) gagal++;
    console.log((ok ? 'ok    ' : 'GAGAL ') + nama);
    if (!ok && info) info.split(' || ').forEach(function (r) { console.log('        - ' + r); });
  }, {
    n: parseInt(arg('--n', '120'), 10), benih: parseInt(arg('--benih', '2026'), 10), raster: parseInt(arg('--raster', '2'), 10),
    keluarga: arg('--keluarga', '') ? arg('--keluarga', '').split(',') : null
  });
  var dtk = ((Date.now() - mulai) / 1000).toFixed(1).replace('.', ',');
  if (gagal || !h.keluarga) { console.log('GAGAL: ' + gagal + ' pemeriksaan gagal; ' + h.keluarga + ' keluarga, ' + h.butir + ' butir (' + dtk + ' dtk)'); process.exit(1); }
  console.log('HASIL: ' + h.keluarga + ' keluarga, ' + h.butir + ' butir lulus; 0 pemeriksaan gagal (' + dtk + ' dtk)');
}
