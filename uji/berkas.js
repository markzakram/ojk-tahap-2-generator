/*
 * berkas.js — pemeriksa berkas keluaran tanpa dependensi: ZIP, XML, DOCX, XLSX, PDF, PNG.
 *
 * Dipakai uji untuk memastikan berkas yang ditulis generator benar-benar utuh, bukan hanya
 * "ada": tiap anggota ZIP dibuka dan dicocokkan CRC-nya, XML diperiksa bersarang dengan benar,
 * tabel referensi PDF diperiksa letak tiap objeknya, dan data PNG didekompresi lalu dicocokkan
 * ukurannya. Semua fungsi melempar Error berpesan jelas bila ada yang salah.
 */
'use strict';

var zlib = require('zlib');

var TABEL_CRC = (function () {
  var t = new Uint32Array(256);
  for (var n = 0; n < 256; n++) {
    var c = n;
    for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  var c = 0xFFFFFFFF;
  for (var i = 0; i < buf.length; i++) c = TABEL_CRC[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

/** Baca seluruh anggota ZIP, cocokkan CRC dan ukuran. @returns {Array<{nama, metode, data:Buffer}>} */
function bacaZip(buf) {
  buf = Buffer.from(buf);
  var eocd = buf.lastIndexOf(Buffer.from([0x50, 0x4B, 0x05, 0x06]));
  if (eocd < 0) throw new Error('ZIP: penutup (EOCD) tidak ditemukan');
  var jumlah = buf.readUInt16LE(eocd + 10), awal = buf.readUInt32LE(eocd + 16), ukPusat = buf.readUInt32LE(eocd + 12);
  if (awal + ukPusat !== eocd) throw new Error('ZIP: ukuran direktori pusat tidak cocok dengan letak penutup');
  var pos = awal, out = [];
  for (var i = 0; i < jumlah; i++) {
    if (buf.readUInt32LE(pos) !== 0x02014B50) throw new Error('ZIP: direktori pusat rusak pada entri ' + i);
    var metode = buf.readUInt16LE(pos + 10), crc = buf.readUInt32LE(pos + 16), ukMampat = buf.readUInt32LE(pos + 20), ukAsli = buf.readUInt32LE(pos + 24);
    var pn = buf.readUInt16LE(pos + 28), pe = buf.readUInt16LE(pos + 30), pk = buf.readUInt16LE(pos + 32), off = buf.readUInt32LE(pos + 42);
    var nama = buf.slice(pos + 46, pos + 46 + pn).toString('utf8');
    if (buf.readUInt32LE(off) !== 0x04034B50) throw new Error('ZIP: header lokal rusak untuk ' + nama);
    var ln = buf.readUInt16LE(off + 26), le = buf.readUInt16LE(off + 28);
    var mulai = off + 30 + ln + le, data = buf.slice(mulai, mulai + ukMampat);
    var isi;
    if (metode === 8) isi = zlib.inflateRawSync(data);
    else if (metode === 0) isi = data;
    else throw new Error('ZIP: metode ' + metode + ' tidak dikenal untuk ' + nama);
    if (isi.length !== ukAsli) throw new Error('ZIP: ukuran ' + nama + ' tidak cocok (' + isi.length + ' vs ' + ukAsli + ')');
    if (crc32(isi) !== crc) throw new Error('ZIP: CRC ' + nama + ' tidak cocok');
    out.push({ nama: nama, metode: metode, data: isi });
    pos += 46 + pn + pe + pk;
  }
  return out;
}

/** Periksa XML bersarang benar, atribut bertanda kutip, dan entitas sah. Mengembalikan jumlah elemen. */
function periksaXml(teks, nama) {
  nama = nama || 'xml';
  var s = String(teks).replace(/^﻿/, '').replace(/<\?[\s\S]*?\?>/g, '').replace(/<!--[\s\S]*?-->/g, '');
  var tumpuk = [], pos = 0, elemen = 0, akarSelesai = false;
  var entitas = /&(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);/y;
  function periksaTeks(t) {
    for (var i = 0; i < t.length; i++) {
      if (t[i] === '&') { entitas.lastIndex = i; if (!entitas.test(t)) throw new Error(nama + ': entitas tidak sah dekat "' + t.slice(Math.max(0, i - 10), i + 12) + '"'); }
      if (t[i] === '<') throw new Error(nama + ': "<" liar dalam teks');
    }
  }
  var tag = /<(\/?)([A-Za-z_][\w:.-]*)((?:\s+[\w:.-]+\s*=\s*(?:"[^"<]*"|'[^'<]*'))*)\s*(\/?)>/y;
  while (pos < s.length) {
    var lt = s.indexOf('<', pos);
    if (lt < 0) { var sisa = s.slice(pos); if (sisa.trim()) throw new Error(nama + ': teks di luar akar'); break; }
    var teksAntara = s.slice(pos, lt);
    if (tumpuk.length === 0) { if (teksAntara.trim()) throw new Error(nama + ': teks di luar elemen akar'); }
    else periksaTeks(teksAntara);
    tag.lastIndex = lt;
    var m = tag.exec(s);
    if (!m) throw new Error(nama + ': tag tidak sah dekat "' + s.slice(lt, lt + 60).replace(/\s+/g, ' ') + '"');
    if (m[1]) {
      if (!tumpuk.length || tumpuk[tumpuk.length - 1] !== m[2]) throw new Error(nama + ': penutup </' + m[2] + '> tidak cocok (dibuka: ' + tumpuk[tumpuk.length - 1] + ')');
      tumpuk.pop();
      if (!tumpuk.length) akarSelesai = true;
    } else {
      if (akarSelesai && !tumpuk.length) throw new Error(nama + ': lebih dari satu elemen akar');
      elemen++;
      var atr = m[3] || '';
      periksaTeks(atr);
      if (!m[4]) tumpuk.push(m[2]); else if (!tumpuk.length) akarSelesai = true;
    }
    pos = lt + m[0].length;
  }
  if (tumpuk.length) throw new Error(nama + ': tag <' + tumpuk[tumpuk.length - 1] + '> tidak ditutup');
  if (!elemen) throw new Error(nama + ': tidak ada elemen');
  return elemen;
}

function lepasEntitas(t) {
  return t.replace(/&(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);/g, function (_, e) {
    if (e === 'amp') return '&'; if (e === 'lt') return '<'; if (e === 'gt') return '>'; if (e === 'quot') return '"'; if (e === 'apos') return "'";
    return String.fromCodePoint(e[1] === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
  });
}

/** Periksa berkas .docx: ZIP utuh, semua XML benar, relasi dan gambar konsisten, bukan Mode Kompatibilitas. */
function periksaDocx(buf) {
  var anggota = bacaZip(buf), peta = {};
  anggota.forEach(function (a) { peta[a.nama] = a; });
  ['[Content_Types].xml', '_rels/.rels', 'word/document.xml', 'word/_rels/document.xml.rels'].forEach(function (n) {
    if (!peta[n]) throw new Error('DOCX: anggota wajib hilang: ' + n);
  });
  var xml = 0;
  anggota.forEach(function (a) { if (/\.(xml|rels)$/.test(a.nama)) { periksaXml(a.data.toString('utf8'), a.nama); xml++; } });
  var rels = peta['word/_rels/document.xml.rels'].data.toString('utf8'), doc = peta['word/document.xml'].data.toString('utf8');
  // tanpa compatibilityMode 15 Word membuka berkas dalam Mode Kompatibilitas
  var set = peta['word/settings.xml'], modus = set && /w:name="compatibilityMode"[^>]*w:val="(\d+)"/.exec(set.data.toString('utf8'));
  if (!modus || +modus[1] < 15) throw new Error('DOCX: word/settings.xml tanpa compatibilityMode 15 (Word akan membuka dalam Mode Kompatibilitas)');
  if (!/PartName="\/word\/settings\.xml"[^>]*settings\+xml/.test(peta['[Content_Types].xml'].data.toString('utf8'))) throw new Error('DOCX: tipe isi word/settings.xml tidak terdaftar');
  if (!/<Relationship\b(?=[^>]*Type="[^"]*\/settings")(?=[^>]*Target="settings\.xml")[^>]*>/.test(rels)) throw new Error('DOCX: word/settings.xml tidak dirujuk relasi dokumen');
  var id = {}, mediaDirujuk = {};
  rels.replace(/<Relationship\b[^>]*>/g, function (r) {
    var i = /Id="([^"]+)"/.exec(r), t = /Target="([^"]+)"/.exec(r);
    if (!i || !t) throw new Error('DOCX: relasi tak lengkap');
    id[i[1]] = t[1];
    if (!/^https?:/.test(t[1]) && !peta['word/' + t[1]]) throw new Error('DOCX: target relasi tidak ada: ' + t[1]);
    if (/^media\//.test(t[1])) mediaDirujuk[t[1]] = 1;
    return r;
  });
  var embed = 0;
  doc.replace(/r:embed="([^"]+)"/g, function (_, rid) { if (!id[rid]) throw new Error('DOCX: r:embed ' + rid + ' tidak ada di relasi'); embed++; return _; });
  var gambar = anggota.filter(function (a) { return /^word\/media\//.test(a.nama); });
  gambar.forEach(function (g) { periksaPng(g.data); });
  var paragraf = (doc.match(/<w:p[ >]/g) || []).length;
  if (paragraf < 50) throw new Error('DOCX: paragraf terlalu sedikit (' + paragraf + ')');
  return { anggota: anggota.length, xml: xml, gambarUnik: gambar.length, gambarDipakai: embed, paragraf: paragraf, ukuran: buf.length, modus: +modus[1] };
}

/** Baca satu lembar kerja .xlsx menjadi baris-baris teks. */
function bacaLembar(xml) {
  var baris = [];
  xml.replace(/<row\b[^>]*>([\s\S]*?)<\/row>/g, function (_, isi) {
    var sel = [];
    isi.replace(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g, function (__, atr, dalam) {
      var r = /\br="([A-Z]+)(\d+)"/.exec(atr), kol = 0;
      for (var i = 0; i < r[1].length; i++) kol = kol * 26 + (r[1].charCodeAt(i) - 64);
      var nilai = '';
      if (dalam) {
        var t = /<t\b[^>]*>([\s\S]*?)<\/t>/.exec(dalam), v = /<v>([\s\S]*?)<\/v>/.exec(dalam);
        nilai = t ? lepasEntitas(t[1]) : (v ? v[1] : '');
      }
      sel[kol - 1] = nilai;
      return __;
    });
    for (var q = 0; q < sel.length; q++) if (sel[q] === undefined) sel[q] = '';
    baris.push(sel);
    return _;
  });
  return baris;
}

/** Periksa berkas .xlsx dan kembalikan lembarnya: { Soal:[baris...], Ringkasan:[...] }. */
function periksaXlsx(buf) {
  var anggota = bacaZip(buf), peta = {};
  anggota.forEach(function (a) { peta[a.nama] = a; });
  ['[Content_Types].xml', '_rels/.rels', 'xl/workbook.xml', 'xl/_rels/workbook.xml.rels', 'xl/styles.xml'].forEach(function (n) {
    if (!peta[n]) throw new Error('XLSX: anggota wajib hilang: ' + n);
  });
  anggota.forEach(function (a) { if (/\.(xml|rels)$/.test(a.nama)) periksaXml(a.data.toString('utf8'), a.nama); });
  var buku = peta['xl/workbook.xml'].data.toString('utf8'), rels = peta['xl/_rels/workbook.xml.rels'].data.toString('utf8');
  var lembar = {};
  buku.replace(/<sheet\b[^>]*name="([^"]+)"[^>]*r:id="([^"]+)"[^>]*\/>/g, function (_, nama, rid) {
    var t = new RegExp('<Relationship\\b[^>]*Id="' + rid + '"[^>]*Target="([^"]+)"').exec(rels);
    if (!t) throw new Error('XLSX: relasi ' + rid + ' tidak ada');
    var a = peta['xl/' + t[1]];
    if (!a) throw new Error('XLSX: lembar ' + t[1] + ' tidak ada');
    lembar[lepasEntitas(nama)] = bacaLembar(a.data.toString('utf8'));
    return _;
  });
  return lembar;
}

/** Periksa berkas PDF: kepala, tabel xref, objek, jumlah halaman. */
function periksaPdf(buf) {
  buf = Buffer.from(buf);
  var teks = buf.toString('latin1');
  if (teks.slice(0, 5) !== '%PDF-') throw new Error('PDF: kepala tidak ada');
  if (!/%%EOF\s*$/.test(teks)) throw new Error('PDF: penutup %%EOF tidak ada');
  var sx = /startxref\s+(\d+)\s+%%EOF\s*$/.exec(teks);
  if (!sx) throw new Error('PDF: startxref tidak ada');
  var awal = parseInt(sx[1], 10);
  if (teks.slice(awal, awal + 4) !== 'xref') throw new Error('PDF: startxref tidak menunjuk ke tabel xref');
  var m = /^xref\s+0 (\d+)\s+/.exec(teks.slice(awal, awal + 40));
  if (!m) throw new Error('PDF: tabel xref rusak');
  var jumlah = parseInt(m[1], 10), pos = awal + m[0].length, salah = 0;
  for (var i = 0; i < jumlah; i++) {
    var baris = teks.slice(pos, pos + 20); pos += 20;
    var e = /^(\d{10}) (\d{5}) ([nf]) \n$/.exec(baris);
    if (!e) throw new Error('PDF: baris xref ' + i + ' tidak sah: "' + baris.replace(/\n/g, '\\n') + '"');
    if (e[3] === 'n') {
      var o = parseInt(e[1], 10);
      if (teks.slice(o, o + 30).indexOf(i + ' 0 obj') !== 0) salah++;
    }
  }
  if (salah) throw new Error('PDF: ' + salah + ' objek tidak berada di letak yang dicatat tabel xref');
  var tr = /trailer\s*<<([^>]*)>>/.exec(teks.slice(awal));
  if (!tr || !/\/Root \d+ 0 R/.test(tr[1]) || parseInt(/\/Size (\d+)/.exec(tr[1])[1], 10) !== jumlah) throw new Error('PDF: trailer tidak konsisten');
  var halaman = (teks.match(/\/Type \/Page /g) || []).length;
  var hitung = /\/Type \/Pages [^>]*\/Count (\d+)/.exec(teks) || /\/Count (\d+)/.exec(teks);
  if (!hitung || parseInt(hitung[1], 10) !== halaman) throw new Error('PDF: /Count ' + (hitung && hitung[1]) + ' tidak cocok dengan ' + halaman + ' halaman');
  if (halaman < 5) throw new Error('PDF: halaman terlalu sedikit (' + halaman + ')');
  return { halaman: halaman, objek: jumlah - 1, ukuran: buf.length };
}

/** Periksa berkas PNG: tanda tangan, CRC tiap bagian, dan ukuran data setelah dekompresi. */
function periksaPng(buf) {
  buf = Buffer.from(buf);
  if (buf.length < 50 || buf.slice(0, 8).toString('hex') !== '89504e470d0a1a0a') throw new Error('PNG: tanda tangan salah');
  var pos = 8, ihdr = null, idat = [], akhir = false;
  while (pos < buf.length) {
    var len = buf.readUInt32BE(pos), tipe = buf.slice(pos + 4, pos + 8).toString('latin1');
    var data = buf.slice(pos + 8, pos + 8 + len), crc = buf.readUInt32BE(pos + 8 + len);
    if (crc32(Buffer.concat([buf.slice(pos + 4, pos + 8), data])) !== crc) throw new Error('PNG: CRC bagian ' + tipe + ' salah');
    if (tipe === 'IHDR') ihdr = { w: data.readUInt32BE(0), h: data.readUInt32BE(4), dalam: data[8], warna: data[9] };
    if (tipe === 'IDAT') idat.push(data);
    if (tipe === 'IEND') akhir = true;
    pos += 12 + len;
  }
  if (!ihdr || !akhir || !idat.length) throw new Error('PNG: IHDR/IDAT/IEND tidak lengkap');
  var kanal = { 0: 1, 2: 3, 4: 2, 6: 4 }[ihdr.warna];
  if (!kanal || ihdr.dalam !== 8) throw new Error('PNG: format warna tidak didukung pemeriksa (warna ' + ihdr.warna + ', ' + ihdr.dalam + ' bit)');
  var mentah = zlib.inflateSync(Buffer.concat(idat));
  var harapan = ihdr.h * (1 + ihdr.w * kanal);
  if (mentah.length !== harapan) throw new Error('PNG: ukuran data ' + mentah.length + ' tidak cocok dengan ' + harapan);
  return { lebar: ihdr.w, tinggi: ihdr.h, kanal: kanal };
}

module.exports = {
  crc32: crc32, bacaZip: bacaZip, periksaXml: periksaXml, periksaDocx: periksaDocx, periksaXlsx: periksaXlsx,
  periksaPdf: periksaPdf, periksaPng: periksaPng, bacaLembar: bacaLembar, lepasEntitas: lepasEntitas
};
