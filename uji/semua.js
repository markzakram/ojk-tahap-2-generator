#!/usr/bin/env node
/*
 * semua.js — seluruh uji generator OJK PCAM Tahap 1 dalam satu perintah.
 *
 *   node uji/semua.js [--cepat] [--besar] [--tanpa-peramban] [--layar <folder>]
 *
 * Tanpa pustaka luar dan tanpa internet. Yang diperiksa:
 *
 *   1. Pembuatan paket per subtes (ku, pn, semua) dengan beberapa benih berbeda: validator
 *      meluluskan setiap butir, tidak ada butir kembar, komposisi sesuai, kunci A-E merata.
 *   2. Hasil dapat diulang dari benih; paket N tidak bergantung pada jumlah paket yang diminta;
 *      komposisi, tingkat, dan proporsi kustom dipatuhi.
 *   2c. Regresi revisi QC paket P001 (uji/qc.js): tanpa label/petunjuk verbal, pertanyaan tidak tebal,
 *      tanpa "juta"/"ribu", line graph dapat digeser tepat, kotak pie, tanpa matriks 2x2 biasa, pengecoh nyata.
 *   3. Validator NEGATIF: butir yang sengaja dirusak harus ditolak (uji/negatif.js).
 *   4. Logika mode coba interaktif: kunci lolos, tampilan awal tidak.
 *   5. Ekspor: Word, PDF, PNG, Excel, JSON, ZIP diperiksa isinya (uji/berkas.js); Word format input SiAdu
 *      dibaca balik seperti importir (uji/siadu.js).
 *   6. CLI: --help, hasil dan baris HASIL/GAGAL, kode keluar, benih, ZIP, kegagalan.
 *   7. agent-office.json: setiap opsi ada di --help dan di script, parameter terpakai,
 *      regex hasil/gagal cocok dengan keluaran CLI yang sebenarnya. Pekerjaan jenis "aplikasi"
 *      (cli/buka.js) tidak diwajibkan punya batas_menit (server menyala sampai dimatikan),
 *      tetapi regex alamat dan port bakunya diperiksa.
 *   8. contoh-keluaran/: Word, PDF, Excel, dan JSON contoh utuh.
 *   9. Antarmuka index.html di Chrome/Edge tanpa kepala (uji/browser.js), bila tersedia.
 *  10. Server lokal cli/buka.js (uji/server.js): MIME, penjaga path, port, berhenti rapi, dan
 *      perintahnya; lalu seluruh antarmuka dibuka lewat http://localhost (ikut --tanpa-peramban).
 *
 * Opsi:
 *   --cepat             jumlah paket lebih sedikit dan ZIP peramban dilewati (sekitar 1 menit)
 *   --besar             tambah uji kapasitas: 500 paket ku+pn, 500 paket ku, 500 paket pn, dan
 *                       500 paket tingkat mudah (menambah sekitar 3 menit)
 *   --tanpa-peramban    lewati uji antarmuka di Chrome/Edge (lewat file:// maupun http://)
 *   --layar <folder>    simpan tangkapan layar antarmuka ke folder itu (lewat http:// ke <folder>/http)
 *   --bantuan           tampilkan bantuan ini
 *
 * Baris terakhir: "HASIL: ..." bila semua lulus (keluar 0) atau "GAGAL: ..." (keluar 1).
 * Hasil sementara ditulis ke folder sementara sistem dan dihapus lagi; project tidak diubah.
 */
'use strict';

var fs = require('fs');
var os = require('os');
var path = require('path');
var cp = require('child_process');
var crypto = require('crypto');

var AKAR = path.resolve(__dirname, '..');
var JS = path.join(AKAR, 'js');
var Paket = require(path.join(JS, 'paket.js'));
var Validator = require(path.join(JS, 'validator.js'));
var Bank = require(path.join(JS, 'bank.js'));
var Ekspor = require(path.join(JS, 'ekspor.js'));
var Zip = require(path.join(JS, 'zip.js'));
var Dokumen = require(path.join(JS, 'dokumen.js'));
var Coba = require(path.join(JS, 'coba.js'));
var Buka = require(path.join(AKAR, 'cli', 'buka.js'));
var Berkas = require('./berkas.js');
var Siadu = require('./siadu.js');
var Negatif = require('./negatif.js');

var argv = process.argv.slice(2);
var BANTUAN = fs.readFileSync(__filename, 'utf8').split('*/')[0].replace(/^#!.*\n/, '').replace(/^\/\*\n?/, '').replace(/^ \* ?/gm, '');
var OPSI_SAH = ['--cepat', '--besar', '--tanpa-peramban', '--layar', '--bantuan', '--help', '-h'];

var cepat = argv.indexOf('--cepat') >= 0;
var besar = argv.indexOf('--besar') >= 0;
var tanpaPeramban = argv.indexOf('--tanpa-peramban') >= 0;
var layar = argv.indexOf('--layar') >= 0 ? path.resolve(argv[argv.indexOf('--layar') + 1] || 'layar') : null;

var hitungLulus = 0, daftarGagal = [], mulaiWaktu = Date.now();
var laporan = { subtes: {} };

function cetak(s) { process.stdout.write(s + '\n'); }
function judul(s) { cetak('\n== ' + s + ' =='); }
function cek(ok, nama, info) {
  if (ok) hitungLulus++; else daftarGagal.push(nama + (info ? ' (' + info + ')' : ''));
  cetak((ok ? '  ok    ' : '  GAGAL ') + nama + (info && (!ok || /^[\d]/.test(info)) ? ' - ' + info : ''));
}
function detik(ms) { return (ms / 1000).toFixed(1).replace('.', ',') + ' dtk'; }
function hash(x) { return crypto.createHash('sha256').update(typeof x === 'string' || Buffer.isBuffer(x) ? x : JSON.stringify(x)).digest('hex').slice(0, 16); }
function semuaButir(hasil) {
  var out = [];
  hasil.paket.forEach(function (p) { p.subtes.forEach(function (st) { st.butir.forEach(function (b) { out.push(b); }); }); });
  return out;
}
function jumlahMap(m, k) { m[k] = (m[k] || 0) + 1; }

// ============================================================ 1. paket per subtes

function ujiPaket() {
  judul('1. Paket, validator, dan kembar per subtes');
  var n = cepat ? 3 : 20;
  var rencana = [
    { subtes: 'ku', benih: [101, 202, 303], jumlah: n },
    { subtes: 'pn', benih: [404, 505, 606], jumlah: n },
    { subtes: 'semua', benih: [707, 808], jumlah: cepat ? 3 : 10 }
  ];
  // --besar: kapasitas bank, termasuk 500 paket tingkat mudah yang dulu lebih cepat habis.
  if (besar) {
    rencana.push({ subtes: 'semua', benih: [1], jumlah: 500, label: 'ku+pn 500 paket' }, { subtes: 'ku', benih: [7], jumlah: 500, label: 'ku 500 paket' },
      { subtes: 'pn', benih: [8], jumlah: 500, label: 'pn 500 paket' }, { subtes: 'semua', benih: [2026], jumlah: 500, tingkat: 'mudah', label: 'ku+pn 500 paket tingkat mudah' });
  }
  rencana.forEach(function (r) {
    var total = { paket: 0, butir: 0, lulus: 0, kembar: 0, gagal: 0, submateri: {}, level: {}, kunci: {}, ms: 0, ganda: 0 };
    r.benih.forEach(function (benih) {
      var t0 = Date.now();
      var hasil = Paket.buat({ jumlahPaket: r.jumlah, benih: benih, subtes: r.subtes, tingkat: r.tingkat });
      var v = hasil.validasi;
      total.ms += Date.now() - t0;
      total.paket += hasil.hasil.paket.length; total.butir += v.butir; total.lulus += v.butirLulus; total.kembar += v.kembar.length; total.gagal += v.gagal.length + v.paketGagal.length;
      Object.keys(v.sebaran.submateri).forEach(function (k) { total.submateri[k] = (total.submateri[k] || 0) + v.sebaran.submateri[k]; });
      Object.keys(v.sebaran.level).forEach(function (k) { total.level[k] = (total.level[k] || 0) + v.sebaran.level[k]; });
      Object.keys(v.sebaran.kunci).forEach(function (k) { total.kunci[k] = (total.kunci[k] || 0) + v.sebaran.kunci[k]; });
      // pemeriksaan ulang yang tidak memakai validator: isi soal tidak boleh persis sama
      var lihat = {};
      semuaButir(hasil.hasil).forEach(function (b) {
        var kunci = hash([b.keluarga, b.stimulus.teks, b.stimulus.kartu || null, b.pertanyaan, (b.stimulus.gambar || []).map(function (g) { return g.model; }), b.opsi.map(function (o) { return [o.teks, o.gambar && o.gambar.model]; })]);
        if (lihat[kunci]) total.ganda++; lihat[kunci] = 1;
      });
      // komposisi tiap paket sesuai baku
      hasil.hasil.paket.forEach(function (p) {
        p.subtes.forEach(function (st) {
          var baku = Bank.SUBTES[st.kode].komposisiBaku, hitung = {};
          st.butir.forEach(function (b) { jumlahMap(hitung, b.submateriKomposisi); });
          Object.keys(baku).forEach(function (k) { if ((hitung[k] || 0) !== baku[k]) total.gagal++; });
        });
      });
    });
    var nama = r.label || (r.subtes === 'semua' ? 'ku+pn' : r.subtes);
    cek(total.lulus === total.butir && total.gagal === 0, nama + ': ' + total.paket + ' paket (' + r.benih.length + ' benih berbeda), ' + total.butir + ' butir, validator lulus ' + total.lulus + '/' + total.butir + ', komposisi sesuai', total.gagal ? total.gagal + ' masalah' : '');
    cek(total.kembar === 0 && total.ganda === 0, nama + ': tidak ada butir kembar atau nyaris sama (validator ' + total.kembar + ', isi persis sama ' + total.ganda + ')');
    var kunciJml = Object.keys(total.kunci).reduce(function (s, k) { return s + total.kunci[k]; }, 0);
    if (kunciJml) {
      var rata = kunciJml / 5, geser = Math.max.apply(null, ['A', 'B', 'C', 'D', 'E'].map(function (h) { return Math.abs((total.kunci[h] || 0) - rata) / rata; }));
      cek(geser <= (cepat ? 0.5 : 0.2), nama + ': kunci A-E merata (' + ['A', 'B', 'C', 'D', 'E'].map(function (h) { return h + '=' + (total.kunci[h] || 0); }).join(' ') + ')', 'simpangan terbesar ' + Math.round(geser * 100) + '%');
    }
    laporan.subtes[nama] = total;
    cetak('        submateri: ' + Object.keys(total.submateri).sort().map(function (k) { return k + '=' + total.submateri[k]; }).join(', '));
    cetak('        tingkat: ' + ['mudah', 'sedang', 'sulit'].map(function (k) { return k + '=' + (total.level[k] || 0); }).join(', ') + '; waktu ' + detik(total.ms));
  });
}

// ===================================================== 2. benih, tingkat, komposisi

async function ujiBenih() {
  judul('2. Benih, awalan paket, tingkat, proporsi, dan komposisi');
  var a = Paket.buat({ jumlahPaket: 3, benih: 5 }), b = Paket.buat({ jumlahPaket: 3, benih: 5 }), c = Paket.buat({ jumlahPaket: 3, benih: 6 });
  cek(hash(a.hasil.paket) === hash(b.hasil.paket), 'benih sama dan opsi sama menghasilkan paket yang sama persis');
  cek(hash(a.hasil.paket) !== hash(c.hasil.paket), 'benih berbeda menghasilkan paket berbeda');
  var bertahap = [], asinkron = await Validator.periksaHasilAsinkron(a.hasil, { irisanMs: 5, saatKemajuan: function (k) { bertahap.push(k.fase); } });
  cek(asinkron.lulus === a.validasi.lulus && asinkron.butir === a.validasi.butir && JSON.stringify(asinkron.sebaran) === JSON.stringify(a.validasi.sebaran) && bertahap.length > 0,
    'validator bertahap (dipakai antarmuka agar layar tidak membeku) memberi hasil yang sama dengan yang sinkron, dengan laporan kemajuan');
  var enam = Paket.buat({ jumlahPaket: 6, benih: 5 });
  cek(hash(a.hasil.paket) === hash(enam.hasil.paket.slice(0, 3)), 'paket nomor N tidak bergantung pada jumlah paket yang diminta (3 paket = 3 pertama dari 6)');

  var sulit = Paket.buat({ jumlahPaket: 4, benih: 9, tingkat: 'sulit' });
  cek(sulit.validasi.lulus && semuaButir(sulit.hasil).every(function (x) { return x.level === 'sulit'; }), 'tingkat "sulit" menghasilkan butir sulit semua dan lulus validator');
  var prop = Paket.buat({ jumlahPaket: 4, benih: 9, proporsi: { mudah: 1, sedang: 0, sulit: 0 } });
  cek(prop.validasi.lulus && semuaButir(prop.hasil).every(function (x) { return x.level === 'mudah'; }), 'proporsi 1:0:0 menghasilkan butir mudah semua');
  var kom = Paket.buat({ jumlahPaket: 3, benih: 12, komposisi: { ku: { verbal: 5, cerita: 0, tabel: 0, grafik: 0, serial: 3, matriks: 4 }, pn: { bar: 1, tabel: 0, garis: 0, pie: 4 } } });
  var tepat = kom.hasil.paket.every(function (p) {
    var ku = p.subtes[0], pn = p.subtes[1], h = {}, g = {};
    ku.butir.forEach(function (x) { jumlahMap(h, x.submateriKomposisi); }); pn.butir.forEach(function (x) { jumlahMap(g, x.submateriKomposisi); });
    return ku.jumlah === 12 && h.verbal === 5 && h.serial === 3 && h.matriks === 4 && !h.cerita && pn.jumlah === 5 && g.bar === 1 && g.pie === 4;
  });
  cek(kom.validasi.lulus && tepat, 'komposisi kustom (verbal 5, serial 3, matriks 4; bar 1, pie 4) dipatuhi dan lulus validator');
  var galat = [];
  [{ jumlahPaket: 0 }, { jumlahPaket: 501 }, { benih: -1 }, { subtes: 'xx' }, { tingkat: 'rumit' }, { komposisi: { ku: { verbal: 99 } } }].forEach(function (o) { try { Paket.normalisasi(o); galat.push(JSON.stringify(o)); } catch (e) { /* diharapkan */ } });
  cek(galat.length === 0, 'opsi tidak sah ditolak dengan galat (jumlah, benih, subtes, tingkat, komposisi)', galat.join(' '));
}

// ===================================================================== 3. negatif

function ujiNegatif() {
  judul('3. Validator negatif (butir dirusak harus ditolak)');
  var r = Negatif.jalankan({ jumlahPaket: cepat ? 4 : 10, benih: 4242 });
  r.laporan.forEach(function (l) {
    if (l.pasti) cek(l.coba > 0 && l.tolak === l.coba, l.nama + ': ditolak ' + l.tolak + ' dari ' + l.coba);
    else cetak('  (info) ' + l.nama + ': ditolak ' + l.tolak + ' dari ' + l.coba + ' (perusakan yang kadang kebetulan tetap benar)');
  });
  cek(r.gagal.length === 0, 'tidak ada perusakan yang pasti salah lolos validator', r.gagal.join(' | '));
}

// ===================================================================== 4. coba

function ujiCoba() {
  judul('4. Logika mode coba interaktif Penalaran Numerik');
  var L = Coba.logika, hasil = Paket.buat({ jumlahPaket: cepat ? 5 : 30, benih: 11, subtes: 'pn' });
  var n = 0, kunciSalah = 0, awalBenar = 0, ubahBenar = 0, jenis = {};
  semuaButir(hasil.hasil).forEach(function (b) {
    n++;
    var is = b.isian; jumlahMap(jenis, is.jenis);
    if (!L.periksa(is, L.kunci(is)).benar) kunciSalah++;
    if (L.periksa(is, L.awal(is)).benar) awalBenar++;
    // satu bagian digeser dari kunci -> tidak boleh benar
    var s = L.kunci(is);
    if (is.jenis === 'bar-tumpuk') s.total[0] += is.kontrol[0].langkah;
    else if (is.jenis === 'garis') s.nilai[1] += is.kontrol[0].langkah;
    else if (is.jenis === 'pie') { s.persen[0] += 1; s.persen[2] -= 1; }
    else s[2] = (s[2] + 1) % is.pilihan.length;
    if (L.periksa(is, s).benar) ubahBenar++;
  });
  cek(n > 0 && kunciSalah === 0, n + ' butir interaktif (' + Object.keys(jenis).map(function (k) { return k + '=' + jenis[k]; }).join(', ') + '): tampilan kunci dinyatakan benar');
  cek(awalBenar === 0, 'tampilan awal tidak pernah dinyatakan benar');
  cek(ubahBenar === 0, 'tampilan yang digeser sedikit dari kunci dinyatakan salah');
  cek(L.snap(1234, 100, 0, 3000) === 1200 && L.snap(-5, 5, 0, 100) === 0 && L.snap(97, 5, 0, 100) === 95 && L.snap(0.3, 0.1, 0, 1) === 0.3, 'snap menempel ke kelipatan langkah dan menjaga batas');
  cek(L.batasDariSudut(57.6, 12, 100) === 16 && L.batasDariSudut(10, 12, 100) === 100 && L.batasDariSudut(350, 0, 50) === 0, 'batas irisan pie menempel ke busurnya, tidak melompat saat pointer menyeberangi pusat');
  var per = [25, 25, 25, 25]; L.geserBatas(per, 1, 40); L.geserBatas(per, 2, 95);
  cek(per.join() === '40,35,0,25', 'batas irisan tidak melewati batas tetangganya (jumlah tetap 100)');
}

// ==================================================================== 5. ekspor

async function ujiEkspor() {
  judul('5. Ekspor Word, PDF, PNG, Excel, JSON, dan ZIP');
  var hasil = Paket.buat({ jumlahPaket: 2, benih: 2026 });
  var butir = semuaButir(hasil.hasil);
  var t0 = Date.now();
  var berkas = await Ekspor.berkasPaket(hasil.hasil.paket[0], { docx: true, pdf: true, gambar: true, skala: 2, benih: 2026 });
  var semuaDocx = berkas.filter(function (b) { return b.jenis === 'docx'; }), pdf = berkas.filter(function (b) { return b.jenis === 'pdf'; })[0], png = berkas.filter(function (b) { return b.jenis === 'png'; });
  var docx = semuaDocx.filter(function (b) { return b.subtes === 'ku'; })[0];
  cetak('        satu paket Word + PDF + gambar: ' + detik(Date.now() - t0));
  cek(semuaDocx.map(function (b) { return b.nama; }).join(',') === 'paket-001/paket-001-kemampuan-umum.docx,paket-001/paket-001-penalaran-numerik.docx', 'Word format input SiAdu: satu berkas per subtes', semuaDocx.map(function (b) { return b.nama; }).join(','));
  try { var d = Berkas.periksaDocx(docx.data); cek(d.gambarUnik >= 20 && d.paragraf > 150, 'Word: ZIP utuh, ' + d.xml + ' bagian XML benar, ' + d.gambarUnik + ' gambar PNG tertanam, ' + d.paragraf + ' paragraf, compatibilityMode ' + d.modus + ' (bukan Mode Kompatibilitas)'); } catch (e) { cek(false, 'Word utuh', e.message); }
  // dibaca balik seperti importir SiAdu: Soal N, tingkat, bentuk, pilihan/tabel kunci, jawaban, pembahasan
  semuaDocx.forEach(function (f) {
    var st = hasil.hasil.paket[0].subtes.filter(function (s) { return s.kode === f.subtes; })[0];
    try { Berkas.periksaDocx(f.data); var ms = Siadu.periksa(Buffer.from(f.data), st.butir); cek(ms.length === 0, 'Word ' + f.nama.split('/').pop() + ' terbaca sesuai template SiAdu, rumus LaTeX $$...$$ (' + st.butir.length + ' soal)', ms.slice(0, 3).join('; ')); } catch (e) { cek(false, 'Word ' + f.nama + ' sesuai template SiAdu', e.message); }
  });
  // --rumus equation: rumus pembahasan sebagai Equation Word
  var berkasEq = await Ekspor.berkasPaket(hasil.hasil.paket[0], { docx: true, benih: 2026, rumus: 'equation' });
  berkasEq.filter(function (b) { return b.jenis === 'docx'; }).forEach(function (f) {
    var st = hasil.hasil.paket[0].subtes.filter(function (s) { return s.kode === f.subtes; })[0];
    try { Berkas.periksaDocx(f.data); var ms = Siadu.periksa(Buffer.from(f.data), st.butir, 'equation'); cek(ms.length === 0, 'Word ' + f.nama.split('/').pop() + ' dengan --rumus equation: rumus berupa Equation Word', ms.slice(0, 3).join('; ')); } catch (e) { cek(false, 'Word ' + f.nama + ' dengan Equation Word', e.message); }
  });
  // naskah Word dan PDF berasal dari model blok yang sama: subtes berikutnya harus didahului lompatan halaman
  var blk = Dokumen.dariPaket(hasil.hasil.paket[0], function () { return { lebar: 200, tinggi: 100, skala: 2, png: new Uint8Array(0) }; }, {}).blok; // naskah PDF
  var judulLanjut = [];
  blk.forEach(function (x, i) { if ((x.t === 'h2' || x.t === 'h3') && /^Subtes [2-9] /.test(x.teks)) judulLanjut.push(blk[i - 1].t === 'jeda'); });
  cek(judulLanjut.length === 1 && judulLanjut.every(Boolean), 'PDF: Subtes 2 mulai di halaman baru; jawaban dan pembahasan melekat pada tiap soal', judulLanjut.join(','));
  var bar = butir.filter(function (b) { return b.submateri === 'bar'; }), barSalah = bar.filter(function (b) {
    var kal = b.pembahasan.filter(function (t) { return /^Tampilan awal: /.test(t); });
    var harus = b.isian.awal.total.filter(function (v, i) { return v === b.isian.kunci.total[i]; }).length;
    return kal.length !== 1 || (kal[0].match(/\(sudah sesuai\)/g) || []).length !== harus;
  });
  cek(bar.length > 0 && barSalah.length === 0, 'Bar chart: pembahasan menyebut tampilan awal apa adanya, total yang sudah sesuai ditandai (' + bar.length + ' butir)', barSalah.map(function (b) { return b.id; }).join(' '));
  try { var p = Berkas.periksaPdf(pdf.data); cek(p.halaman >= 20, 'PDF: tabel xref konsisten, ' + p.halaman + ' halaman, ' + p.objek + ' objek'); } catch (e) { cek(false, 'PDF utuh', e.message); }
  var gambarDiharapkan = 0;
  hasil.hasil.paket[0].subtes.forEach(function (st) { st.butir.forEach(function (b) { gambarDiharapkan += Dokumen.daftarSoal(b).length + Dokumen.daftarPembahasan(b).length; }); });
  var pngSalah = 0;
  png.forEach(function (g) { try { Berkas.periksaPng(g.data); } catch (e) { pngSalah++; } });
  cek(png.length === gambarDiharapkan && pngSalah === 0, 'PNG: ' + png.length + ' gambar paket 1 (sama dengan jumlah gambar soal dan pembahasan), semuanya utuh (CRC dan ukuran data cocok)', pngSalah ? pngSalah + ' rusak' : '');
  var nama = {};
  png.forEach(function (g) { nama[g.nama] = true; });

  var xlsx = await Ekspor.xlsx(hasil.hasil), lembar = Berkas.periksaXlsx(xlsx);
  var kepalaDiharapkan = ['no', 'paket', 'subtes', 'submateri', 'level', 'soal', 'opsi_a', 'opsi_b', 'opsi_c', 'opsi_d', 'opsi_e', 'jawaban_benar', 'pembahasan', 'berkas_gambar'];
  var kepala = lembar.Soal[0];
  cek(kepalaDiharapkan.every(function (k, i) { return kepala[i] === k; }), 'Excel: 14 kolom wajib berurutan (' + kepalaDiharapkan.join(', ') + ')');
  cek(lembar.Soal.length === butir.length + 1, 'Excel: satu baris per soal (' + butir.length + ' soal + baris judul)', 'baris=' + lembar.Soal.length);
  var salahBaris = 0, gambarHilang = 0;
  for (var i = 1; i < lembar.Soal.length; i++) {
    var r = lembar.Soal[i], b = butir[i - 1];
    if (!r[5] || !r[12] || !r[11]) salahBaris++;
    if (b.jenis === 'pg' && (r[11] !== 'ABCDE'[b.kunci] || !r[6] || !r[7] || !r[8])) salahBaris++;
    if (b.jenis === 'isian' && !/\S/.test(r[11])) salahBaris++;
    if (b.paket === 1 && r[13]) r[13].split('; ').forEach(function (f) { if (!nama[f]) gambarHilang++; });
  }
  cek(salahBaris === 0, 'Excel: tiap baris punya soal, jawaban benar, dan pembahasan (pilihan ganda memuat opsi A-C dan huruf kunci yang sama)', salahBaris + ' baris bermasalah');
  cek(gambarHilang === 0, 'Excel: kolom berkas_gambar menyebut nama berkas PNG yang benar-benar dibuat', gambarHilang + ' nama tidak ada');
  cek(lembar.Ringkasan && lembar.Ringkasan.length > 5, 'Excel: lembar Ringkasan per paket dan submateri ada');

  var js = JSON.parse(Ekspor.json(hasil.hasil, {}, hasil.validasi));
  var jmlJson = 0; js.paket.forEach(function (p2) { p2.subtes.forEach(function (st) { jmlJson += st.butir.length; }); });
  cek(js.validator.lulus === true && js.paket.length === 2 && jmlJson === butir.length, 'JSON: terbaca, memuat hasil validator dan ' + jmlJson + ' butir');
  var lengkap = js.paket[0].subtes[0].butir.every(function (b) { return b.soal && b.pembahasan.length && b.opsi.length && b.kunci && b.langkah !== undefined; }) && js.paket[0].subtes[1].butir.every(function (b) { return b.isian && b.bentukIsian && b.jawabanBenar; });
  cek(lengkap, 'JSON: tiap butir pilihan ganda memuat soal, opsi, kunci, langkah, pembahasan; butir interaktif memuat bentuk isian dan nilai jawaban');

  var zip = await Zip.buat([{ nama: 'a/b.txt', data: 'halo' }, { nama: 'paket.docx', data: docx.data, mampat: false }, { nama: 'x.xlsx', data: xlsx, mampat: false }]);
  var anggota = Berkas.bacaZip(zip);
  cek(anggota.length === 3 && anggota[1].data.equals(Buffer.from(docx.data)) && anggota[0].data.toString() === 'halo', 'ZIP: tiga anggota terbaca kembali persis sama (CRC cocok)');
  // penulis bertahap dengan berkas besar
  var potongan = [], pen = Zip.penulis(function (u8) { potongan.push(Buffer.from(u8)); });
  var besar = Buffer.alloc(3 * 1024 * 1024); for (var q = 0; q < besar.length; q++) besar[q] = (q * 7919 + (q >> 8)) & 255;
  await pen.tambah('besar.bin', besar, false); await pen.tambah('teks.txt', 'baris\n'.repeat(5000), true); await pen.selesai();
  var z2 = Berkas.bacaZip(Buffer.concat(potongan));
  cek(z2.length === 2 && z2[0].data.equals(besar) && z2[1].metode === 8, 'ZIP: penulis bertahap menulis berkas besar (tersimpan) dan teks (dimampatkan)');
}

// ======================================================================= 6. CLI

function cli(args, opsi) {
  opsi = opsi || {};
  var r = cp.spawnSync(process.execPath, [path.join(AKAR, 'cli', 'generate.js')].concat(args), { cwd: opsi.cwd || AKAR, encoding: 'utf8', timeout: 600000, maxBuffer: 256 * 1024 * 1024 });
  var baris = (r.stdout || '').split(/\r?\n/).filter(Boolean);
  return { kode: r.status, keluar: r.stdout || '', galat: r.stderr || '', baris: baris, akhir: baris[baris.length - 1] || '' };
}

/** Nama berkas gambar (soal, opsi, pembahasan) yang tercatat di JSON hasil, per paket atau semua paket. */
function berkasGambarJson(js, noPaket) {
  var nama = {};
  js.paket.forEach(function (p) {
    if (noPaket != null && p.no !== noPaket) return;
    p.subtes.forEach(function (st) { st.butir.forEach(function (b) {
      (b.stimulus.gambar || []).concat(b.gambarPembahasan || [], b.opsi.map(function (o) { return o.gambar; }).filter(Boolean)).forEach(function (g) { nama[g.berkas] = true; });
    }); });
  });
  return Object.keys(nama);
}

function cariFile(dir, pola, out) {
  out = out || [];
  fs.readdirSync(dir, { withFileTypes: true }).forEach(function (e) {
    var p = path.join(dir, e.name);
    if (e.isDirectory()) cariFile(p, pola, out); else if (pola.test(p)) out.push(p);
  });
  return out;
}

function ujiCli(tmp) {
  judul('6. CLI node cli/generate.js');
  var bantuan = cli(['--help']);
  var opsiWajib = ['--paket', '--subtes', '--format', '--benih', '--keluaran', '--docx', '--pdf', '--xlsx', '--json', '--zip', '--tingkat', '--proporsi', '--komposisi-ku', '--komposisi-pn', '--tanpa-waktu', '--periksa-saja', '--skala', '--svg-json', '--rumus'];
  var hilang = opsiWajib.filter(function (o) { return bantuan.keluar.indexOf(o) < 0; });
  cek(bantuan.kode === 0 && hilang.length === 0, '--help lengkap: menjelaskan ' + opsiWajib.length + ' opsi dan contoh pemakaian', hilang.join(', '));
  cek(/HASIL: /.test(bantuan.keluar) && /GAGAL: /.test(bantuan.keluar) && /output|<waktu>/.test(bantuan.keluar), '--help menjelaskan baris HASIL/GAGAL dan folder keluaran output/<waktu>');

  // jalankan: dua paket, xlsx+json+zip, tanpa gambar Word/PDF supaya cepat
  var kel1 = path.join(tmp, 'k1');
  var r1 = cli(['--paket', '2', '--subtes', 'semua', '--format', 'xlsx,json', '--benih', '77', '--keluaran', kel1, '--zip']);
  cek(r1.kode === 0 && /^HASIL: 2 paket, 44 butir, validator lulus 44\/44, 0 kembar, benih 77/.test(r1.akhir), 'jalan normal: keluar 0 dan baris akhir "HASIL: 2 paket, 44 butir, validator lulus 44/44, ..."', r1.akhir.slice(0, 120));
  var folder = fs.existsSync(kel1) ? fs.readdirSync(kel1) : [];
  cek(folder.length === 1 && /^\d{4}-\d{2}-\d{2}_\d{6}$/.test(folder[0]), 'hasil ditulis ke <keluaran>/<waktu>/ (waktu berbentuk YYYY-MM-DD_HHMMSS)', folder.join(','));
  var dasar = path.join(kel1, folder[0] || 'x');
  var daftarBerkas = fs.existsSync(dasar) ? fs.readdirSync(dasar) : [];
  cek(['soal-ojk-tahap1.xlsx', 'soal-ojk-tahap1.json', 'soal-ojk-tahap1.zip', 'ringkasan.txt', 'paket-001', 'paket-002'].every(function (f) { return daftarBerkas.indexOf(f) >= 0; }), 'isi folder: xlsx, json, zip, ringkasan, paket-001, paket-002', daftarBerkas.join(','));
  var png1 = fs.existsSync(path.join(dasar, 'paket-001', 'gambar')) ? fs.readdirSync(path.join(dasar, 'paket-001', 'gambar')).length : 0;
  var jsonHasil = fs.existsSync(path.join(dasar, 'soal-ojk-tahap1.json')) ? JSON.parse(fs.readFileSync(path.join(dasar, 'soal-ojk-tahap1.json'), 'utf8')) : { paket: [] };
  var harap1 = berkasGambarJson(jsonHasil, 1).length;
  cek(harap1 > 0 && png1 === harap1, 'gambar PNG paket-001/gambar/ berjumlah ' + harap1 + ' (sama dengan gambar soal, opsi, dan pembahasan di JSON)', String(png1));
  var berkasBaris = r1.baris.filter(function (l) { return /^BERKAS -> /.test(l); }).map(function (l) { return l.slice(10); });
  cek(berkasBaris.length >= 3 && berkasBaris.every(function (f) { return fs.existsSync(f) && fs.statSync(f).isFile(); }), 'baris "BERKAS -> <path>" menunjuk berkas yang ada (xlsx, json, zip)', berkasBaris.length + ' baris');
  try {
    var lembar = Berkas.periksaXlsx(fs.readFileSync(path.join(dasar, 'soal-ojk-tahap1.xlsx')));
    cek(lembar.Soal.length === 45, 'xlsx hasil CLI: 44 soal + judul');
    var z = Berkas.bacaZip(fs.readFileSync(path.join(dasar, 'soal-ojk-tahap1.zip')));
    var harapZip = berkasGambarJson(jsonHasil).length;
    cek(z.some(function (a) { return a.nama === 'paket-002/gambar/P002-PN-10-awal.png'; }) && z.length === 2 + 1 + harapZip, 'zip hasil CLI utuh: berisi xlsx, json, ringkasan, ' + harapZip + ' gambar', z.length + ' anggota');
  } catch (e) { cek(false, 'berkas hasil CLI utuh', e.message); }

  // dapat diulang
  var a = path.join(tmp, 'ulang-a'), b = path.join(tmp, 'ulang-b');
  var ra = cli(['--paket', '3', '--format', 'xlsx,json', '--benih', '5', '--keluaran', a, '--tanpa-waktu']);
  var rb = cli(['--paket', '3', '--format', 'xlsx,json', '--benih', '5', '--keluaran', b, '--tanpa-waktu']);
  cek(ra.kode === 0 && rb.kode === 0 && hash(fs.readFileSync(path.join(a, 'soal-ojk-tahap1.xlsx'))) === hash(fs.readFileSync(path.join(b, 'soal-ojk-tahap1.xlsx'))) &&
    hash(fs.readFileSync(path.join(a, 'soal-ojk-tahap1.json'))) === hash(fs.readFileSync(path.join(b, 'soal-ojk-tahap1.json'))), 'benih sama menghasilkan Excel dan JSON yang sama byte demi byte');
  cek(!cariFile(a, /\.(docx|pdf)$/).length, '--format xlsx,json tidak menulis Word atau PDF');

  // Word dan PDF lewat pintasan
  var kw = path.join(tmp, 'wp');
  var rw = cli(['--paket', '1', '--subtes', 'pn', '--docx', '--pdf', '--benih', '3', '--keluaran', kw, '--tanpa-waktu']);
  var pn = rw.kode === 0 && fs.existsSync(path.join(kw, 'paket-001', 'paket-001-penalaran-numerik.docx')) && !fs.existsSync(path.join(kw, 'paket-001', 'paket-001-kemampuan-umum.docx'));
  var adaPn = false;
  try { Berkas.periksaDocx(fs.readFileSync(path.join(kw, 'paket-001', 'paket-001-penalaran-numerik.docx'))); Berkas.periksaPdf(fs.readFileSync(path.join(kw, 'paket-001', 'paket-001.pdf'))); adaPn = true; } catch (e) { adaPn = false; }
  cek(pn && adaPn && !fs.existsSync(path.join(kw, 'soal-ojk-tahap1.xlsx')), 'pintasan --docx --pdf menulis Word (hanya subtes pn) dan PDF yang utuh saja');

  // gagal
  [[['--paket', '0'], /--paket harus bilangan bulat 1 sampai 500/], [['--paket', '501'], /1 sampai 500/], [['--subtes', 'xx'], /--subtes harus/], [['--foo'], /opsi tidak dikenal/],
    [['--format', 'abc'], /format tidak dikenal/], [['--benih', '-1'], /--benih harus/], [['--tingkat', 'rumit'], /--tingkat harus/], [['--proporsi', '1:2'], /--proporsi harus/],
    [['--komposisi-ku', 'verbal=a'], /bukan bentuk nama=jumlah/], [['--komposisi-ku', 'foo=1'], /tidak dikenal/], [['--paket'], /memerlukan nilai/],
    [['--subtes', 'ku', '--komposisi-ku', 'verbal=0,cerita=0,tabel=0,grafik=0,serial=0,matriks=0'], /tidak memiliki butir/]].forEach(function (g) {
    var r = cli(g[0]);
    cek(r.kode === 1 && /^GAGAL: /.test(r.akhir) && g[1].test(r.akhir), 'gagal: ' + g[0].join(' ') + ' -> keluar 1 dan "GAGAL: ..."', r.kode + ' ' + r.akhir.slice(0, 100));
  });

  // periksa saja
  var kp = path.join(tmp, 'periksa');
  var rp = cli(['--paket', '4', '--benih', '8', '--periksa-saja', '--keluaran', kp]);
  cek(rp.kode === 0 && /^HASIL: 4 paket, 88 butir, validator lulus 88\/88, 0 kembar, benih 8 \(hanya diperiksa/.test(rp.akhir) && !fs.existsSync(kp), '--periksa-saja: lulus tanpa menulis berkas apa pun');
  // opsi isi paket
  var ro = cli(['--paket', '2', '--tingkat', 'sulit', '--komposisi-ku', 'verbal=6,cerita=0,tabel=0,grafik=0,serial=2,matriks=2', '--komposisi-pn', 'pie=4,bar=0,tabel=0,garis=0', '--periksa-saja']);
  cek(ro.kode === 0 && /tingkat: mudah=0, sedang=0, sulit=\d+/.test(ro.keluar) && /ku\/verbal=12/.test(ro.keluar) && /pn\/pie=8/.test(ro.keluar), '--tingkat sulit dan --komposisi-ku/--komposisi-pn dipatuhi', ro.akhir.slice(0, 100));
  // pembatasan: jalankan dari folder lain, keluaran relatif terhadap cwd
  var lain = path.join(tmp, 'cwd'); fs.mkdirSync(lain, { recursive: true });
  var rl = cli(['--paket', '1', '--format', 'json', '--benih', '2', '--keluaran', 'hasil-relatif', '--tanpa-waktu'], { cwd: lain });
  cek(rl.kode === 0 && fs.existsSync(path.join(lain, 'hasil-relatif', 'soal-ojk-tahap1.json')), '--keluaran relatif dihitung dari folder tempat perintah dijalankan');
  return r1;
}

// =========================================================== 7. agent-office.json

function ujiAgentOffice(tmp) {
  judul('7. agent-office.json');
  var berkas = path.join(AKAR, 'agent-office.json'), teks = fs.readFileSync(berkas, 'utf8'), cfg;
  try { cfg = JSON.parse(teks); cek(true, 'JSON valid'); } catch (e) { cek(false, 'JSON valid', e.message); return; }
  cek(!/(password|passwd|api[_-]?key|secret|cookie|bearer|sk-[a-z0-9]{10,})/i.test(teks), 'tidak ada rahasia (password, API key, cookie) di dalamnya');
  cek(typeof cfg.nama === 'string' && Array.isArray(cfg.pekerjaan) && cfg.pekerjaan.length >= 1, 'memiliki nama dan daftar pekerjaan (' + cfg.pekerjaan.length + ')');
  var ids = {};
  cfg.pekerjaan.forEach(function (j) {
    var tag = '[' + j.id + '] ';
    cek(/^[A-Za-z0-9_]+$/.test(j.id) && !ids[j.id], tag + 'id unik tanpa spasi'); ids[j.id] = 1;
    cek(!!j.judul && !!j.singkat && Array.isArray(j.kata_kunci) && j.kata_kunci.length >= 3 && Array.isArray(j.wajib_salah_satu), tag + 'judul, singkat, kata_kunci, wajib_salah_satu terisi');
    var skrip = j.perintah[0], jalurSkrip = path.join(AKAR, skrip);
    cek(/\.js$/.test(skrip) && fs.existsSync(jalurSkrip), tag + 'script ' + skrip + ' ada');
    var sumber = fs.readFileSync(jalurSkrip, 'utf8');
    // timeout: skrip yang tidak menangani --help (mis. langsung menyalakan server) tidak boleh menggantung uji
    var bantuanSkrip = cp.spawnSync(process.execPath, [jalurSkrip, '--help'], { encoding: 'utf8', cwd: AKAR, timeout: 30000 }).stdout || '';
    var aplikasi = j.jenis === 'aplikasi';
    var token = [];
    j.perintah.slice(1).forEach(function (t) { (Array.isArray(t) ? t : [t]).forEach(function (x) { token.push(x); }); });
    var opsiPakai = [], namaPakai = {};
    token.forEach(function (t) {
      var o = /--[a-z][a-z0-9-]*/.exec(t); if (o) opsiPakai.push(o[0]);
      t.replace(/\{(\w+)[?!]?[^}]*\}/g, function (_, n) { namaPakai[n] = 1; return _; });
    });
    var tidakAdaBantuan = opsiPakai.filter(function (o) { return bantuanSkrip.indexOf(o) < 0; }), tidakAdaSumber = opsiPakai.filter(function (o) { return sumber.indexOf(o) < 0; });
    cek(opsiPakai.length > 0 && tidakAdaBantuan.length === 0 && tidakAdaSumber.length === 0, tag + 'tiap opsi di perintah (' + opsiPakai.join(' ') + ') ada di --help dan di isi script', 'tidak di --help: ' + tidakAdaBantuan.join(',') + '; tidak di script: ' + tidakAdaSumber.join(','));
    var param = j.parameter || {}, belumAda = Object.keys(namaPakai).filter(function (n) { return !param[n]; }), tidakDipakai = Object.keys(param).filter(function (n) { return !namaPakai[n]; });
    cek(belumAda.length === 0 && tidakDipakai.length === 0, tag + 'setiap {parameter} di perintah didefinisikan dan setiap parameter dipakai', 'belum ada: ' + belumAda.join(',') + '; tidak dipakai: ' + tidakDipakai.join(','));
    var salahParam = [];
    Object.keys(param).forEach(function (n) {
      var p = param[n];
      if (['file', 'bulan', 'tanda', 'daftar', 'teks'].indexOf(p.jenis) < 0) salahParam.push(n + ': jenis ' + p.jenis);
      ['pola', 'kecuali', 'dari_tugas'].forEach(function (k) { if (p[k]) { try { new RegExp(p[k], 'i'); } catch (e) { salahParam.push(n + '.' + k + ' bukan regex'); } } });
      if (p.jenis === 'teks' && p.bawaan !== undefined && p.pola && !new RegExp(p.pola, 'i').test(String(p.bawaan))) salahParam.push(n + ': bawaan tidak cocok dengan pola');
      if (p.jenis === 'teks' && p.contoh && p.pola && !new RegExp(p.pola, 'i').test(String(p.contoh))) salahParam.push(n + ': contoh tidak cocok dengan pola');
      if (p.jenis === 'tanda' && p.kelompok && typeof p.label !== 'string') salahParam.push(n + ': tanda berkelompok tanpa label');
    });
    cek(salahParam.length === 0, tag + 'parameter sah (jenis, regex, bawaan dan contoh cocok dengan pola)', salahParam.join('; '));
    ['hasil', 'gagal'].forEach(function (k) { if (j[k]) { try { new RegExp(j[k], 'm'); cek(true, tag + k + ' adalah regex yang sah'); } catch (e) { cek(false, tag + k + ' regex sah', e.message); } } });
    if (aplikasi) {
      // Agent Office hanya memakai batas_menit untuk pekerjaan biasa (jobs.js runSteps). Pekerjaan jenis "aplikasi"
      // dibiarkan menyala sampai dimatikan; satu-satunya batasnya 60 detik untuk mencetak alamat (startApp).
      // Jadi batas_menit tidak diwajibkan, supaya tidak ada angka kecil yang menyesatkan.
      cek(j.batas_menit === undefined && !j.lanjutan, tag + 'aplikasi: tanpa batas_menit (server menyala sampai dimatikan) dan tanpa lanjutan');
      var contohBaris = Buka.JUDUL + ' berjalan di http://localhost:' + Buka.PORT_BAKU, cocokAlamat = null;
      try { cocokAlamat = new RegExp(j.alamat).exec(contohBaris); } catch (e) { /* dinilai di bawah */ }
      cek(typeof j.alamat === 'string' && !!cocokAlamat && cocokAlamat[1] === 'http://localhost:' + Buka.PORT_BAKU, tag + 'alamat: regex yang kelompok pertamanya menangkap alamat yang dicetak cli/buka.js ("' + contohBaris + '")', String(j.alamat));
      // opsi di perintah harus dipahami cli/buka.js, dan port yang tertulis (di perintah dan catatan) harus port bakunya
      var portPerintah;
      try { portPerintah = Buka.urai(token).port; } catch (e) { portPerintah = e.message; }
      cek(portPerintah === Buka.PORT_BAKU && (j.catatan || []).join(' ').indexOf('localhost:' + Buka.PORT_BAKU) >= 0, tag + 'perintah dibaca cli/buka.js tanpa galat, memakai port baku ' + Buka.PORT_BAKU + ', dan catatan menyebut alamat itu', String(portPerintah));
    } else cek(Number(j.batas_menit) >= 1 && Number(j.batas_menit) <= 60, tag + 'batas_menit 1 sampai 60');
  });

  // Simulasi: perluas perintah seperti Agent Office, jalankan, cocokkan regex hasil dan gagal.
  var paket = cfg.pekerjaan.filter(function (j) { return j.id === 'paket'; })[0];
  if (!paket) return;
  function perluas(perintah, nilai) {
    var args = [];
    perintah.slice(1).forEach(function (t) {
      var kel = Array.isArray(t) ? t : [t], grup = [], lewat = false;
      kel.forEach(function (x) {
        var m = /^\{(\w+)\?(.+)\}$/.exec(x);
        if (m) { if (nilai[m[1]]) grup.push(m[2]); else lewat = true; return; }
        grup.push(x.replace(/\{(\w+)\}/g, function (_, n) { var v = nilai[n]; if (v === undefined || v === '' || v === false) { lewat = true; return ''; } return v; }));
      });
      if (!lewat) grup.forEach(function (x) { args.push(x); });
    });
    return args;
  }
  var nilai = { subtes: 'ku', jumlah: '1', tingkat: 'campur', proporsi: '', komposisi_ku: 'verbal=3,cerita=1,tabel=2,grafik=1,serial=3,matriks=2', komposisi_pn: '', benih: '11', docx: false, pdf: false, xlsx: true, json: true, zip: true };
  var args = perluas(paket.perintah, nilai);
  cek(args.indexOf('--proporsi=') < 0 && args.every(function (a) { return a.slice(-1) !== '='; }), 'perintah hasil perluasan tidak memuat opsi berisi kosong', args.join(' '));
  var kel = path.join(tmp, 'ao');
  var r = cp.spawnSync(process.execPath, [path.join(AKAR, paket.perintah[0])].concat(args, ['--keluaran', kel]), { encoding: 'utf8', cwd: AKAR });
  cek(r.status === 0, 'perintah pekerjaan "paket" (nilai bawaan popup) berjalan dengan kode keluar 0', 'kode ' + r.status + ' ' + (r.stdout || '').split('\n').slice(-3).join(' '));
  var re = new RegExp(paket.hasil, 'm'), semua = new RegExp(re.source, 'gm'), file = 0, teksHasil = null, cocok;
  while ((cocok = semua.exec(r.stdout || ''))) {
    var cap = (cocok[1] || '').trim(), penuh = path.resolve(AKAR, cap);
    if (cap && fs.existsSync(penuh) && fs.statSync(penuh).isFile()) file++; else if (cap && teksHasil === null) teksHasil = cap;
  }
  cek(file >= 3, 'regex "hasil" menangkap berkas hasil (xlsx, json, zip) yang benar-benar ada sebagai tombol Buka hasil', file + ' berkas');
  cek(/paket, \d+ butir, validator lulus \d+\/\d+, 0 kembar/.test(teksHasil || ''), 'regex "hasil" menangkap ringkasan HASIL sebagai teks laporan', (teksHasil || '').slice(0, 80));
  var gagal = cli(['--paket', '0']);
  var mg = new RegExp(paket.gagal, 'm').exec(gagal.keluar);
  cek(!!mg && /--paket harus/.test(mg[1]), 'regex "gagal" menangkap pesan GAGAL dari CLI', mg ? mg[1].slice(0, 60) : 'tidak cocok');
  var uji = cfg.pekerjaan.filter(function (j) { return j.id === 'uji'; })[0];
  if (uji) {
    var sumberUji = fs.readFileSync(__filename, 'utf8');
    cek(['--cepat', '--besar', '--tanpa-peramban'].every(function (o) { return sumberUji.indexOf(o) >= 0; }), 'pekerjaan "uji": opsi --cepat, --besar, dan --tanpa-peramban ada di uji/semua.js');
  }
}

// ============================================================ 8. contoh keluaran

function ujiContoh() {
  var dir = path.join(AKAR, 'contoh-keluaran');
  if (!fs.existsSync(dir)) return;
  var f = cariFile(dir, /\.(docx|pdf|xlsx|json)$/);
  if (!f.length) return;
  judul('8. contoh-keluaran/');
  var docx = f.filter(function (x) { return /\.docx$/.test(x); }), pdf = f.filter(function (x) { return /\.pdf$/.test(x); }), xlsx = f.filter(function (x) { return /\.xlsx$/.test(x); }), json = f.filter(function (x) { return /\.json$/.test(x); });
  try {
    docx.forEach(function (x) { Berkas.periksaDocx(fs.readFileSync(x)); }); pdf.forEach(function (x) { Berkas.periksaPdf(fs.readFileSync(x)); });
    var l = Berkas.periksaXlsx(fs.readFileSync(xlsx[0])); var js = JSON.parse(fs.readFileSync(json[0], 'utf8'));
    cek(docx.length === 4 && pdf.length === 2 && xlsx.length === 1 && json.length === 1, 'contoh 2 paket: 4 Word input SiAdu (per subtes), 2 PDF, 1 Excel, 1 JSON utuh', docx.length + '/' + pdf.length + '/' + xlsx.length + '/' + json.length);
    cek(l.Soal.length === 45 && js.validator.lulus === true, 'contoh: Excel 44 soal dan JSON memuat hasil validator lulus');
  } catch (e) { cek(false, 'contoh-keluaran utuh', e.message); }
}

// ===================================================================== utama

async function utama() {
  if (argv.indexOf('--bantuan') >= 0 || argv.indexOf('--help') >= 0 || argv.indexOf('-h') >= 0) { cetak(BANTUAN.trim()); return 0; }
  var tidakDikenal = argv.filter(function (a, i) { return a.slice(0, 1) === '-' && OPSI_SAH.indexOf(a) < 0 && !(argv[i - 1] === '--layar'); });
  if (tidakDikenal.length) { cetak('GAGAL: opsi tidak dikenal: ' + tidakDikenal.join(' ') + ' (lihat --bantuan)'); return 1; }
  var tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ojk-uji-'));
  try {
    cetak('Uji generator OJK PCAM Tahap 1' + (cepat ? ' (mode cepat)' : '') + ' - Node.js ' + process.versions.node);
    ujiPaket();
    await ujiBenih();
    judul('2b. Bank tambahan: hitungan independen, mutasi kunci, dan variasi keluarga');
    require('./variasi.js').jalankan(cek);
    judul('2c. Revisi QC paket P001: format naskah, nominal, line graph, pie, figural, pengecoh');
    require('./qc.js').jalankan(cek);
    ujiNegatif();
    ujiCoba();
    await ujiEkspor();
    ujiCli(tmp);
    ujiAgentOffice(tmp);
    ujiContoh();
    if (!tanpaPeramban) {
      judul('9. Antarmuka index.html (Chrome/Edge tanpa kepala)');
      try {
        var br = require('./browser.js');
        var h = await br.jalankan({ cek: cek, cetak: cetak, cepat: cepat, layar: layar });
        if (h && h.dilewati) cetak('  (uji antarmuka dilewati)');
      } catch (e) { cek(false, 'uji antarmuka berjalan', e.message); }
    }
    judul('10. Server lokal cli/buka.js dan antarmuka lewat http://');
    try {
      var sv = require('./server.js');
      await sv.jalankan({ cek: cek, cetak: cetak, cepat: cepat, layar: layar ? path.join(layar, 'http') : null, tanpaPeramban: tanpaPeramban });
    } catch (e) { cek(false, 'uji server lokal berjalan', e.stack ? e.stack.split('\n').slice(0, 3).join(' / ') : e.message); }
  } finally {
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (e) { /* abaikan */ }
  }

  var butirTotal = 0, lulusTotal = 0, paketTotal = 0;
  Object.keys(laporan.subtes).forEach(function (k) { var t = laporan.subtes[k]; butirTotal += t.butir; lulusTotal += t.lulus; paketTotal += t.paket; });
  judul('Ringkasan');
  Object.keys(laporan.subtes).forEach(function (k) {
    var t = laporan.subtes[k];
    cetak('  ' + k + ': ' + t.paket + ' paket, ' + t.butir + ' butir, lulus ' + t.lulus + ', kembar ' + t.kembar + ', tingkat ' + ['mudah', 'sedang', 'sulit'].map(function (x) { return (t.level[x] || 0); }).join('/') + ', kunci ' + (Object.keys(t.kunci).length ? ['A', 'B', 'C', 'D', 'E'].map(function (x) { return x + (t.kunci[x] || 0); }).join(' ') : '-'));
  });
  var waktu = detik(Date.now() - mulaiWaktu);
  if (daftarGagal.length) {
    cetak('GAGAL: ' + daftarGagal.length + ' dari ' + (hitungLulus + daftarGagal.length) + ' pemeriksaan gagal (' + waktu + '): ' + daftarGagal.slice(0, 4).join(' | '));
    daftarGagal.slice(4).forEach(function (g) { cetak('  - ' + g); });
    return 1;
  }
  cetak('HASIL: ' + hitungLulus + ' pemeriksaan lulus, 0 gagal; ' + paketTotal + ' paket dan ' + butirTotal + ' butir lulus validator tanpa butir kembar (' + waktu + ')');
  return 0;
}

utama().then(function (k) { process.exitCode = k; }, function (e) { cetak('GAGAL: galat tak terduga: ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join(' / ') : e)); process.exitCode = 1; });
