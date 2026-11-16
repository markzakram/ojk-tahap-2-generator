/*
 * siadu.js — membaca balik Word format input SiAdu seperti importir, lalu mencocokkannya dengan butir asal.
 *
 * Pembaca ini sengaja hanya mengenal aturan template (bukan kode penyusun naskah):
 *
 *   - setiap soal diawali paragraf "Soal N" (N berurutan dari 1); semua yang ada sebelum "Soal 1" diabaikan
 *   - identitas mapping tepat setelah "Soal N", dicetak tebal: "Category: ...", "Lesson: ...",
 *     "Chapter: ...", lalu "Subchapter: ..." (hanya numerik KU); kemudian baris wajib SiAdu
 *     "Tingkat Kesulitan: Mudah|Sedang|Sulit|Hots" dan "Bentuk Soal: ...", satu baris kosong, baru teks soal
 *   - baris wajib lain: "Jawaban:", "Pembahasan:"; persamaan pembahasan berupa Equation Word (m:oMath) yang terbaca
 *   - Option New: pilihan "A." ... sebelum "Jawaban: <huruf>"; pilihan bergambar berisi gambar sebaris
 *   - Bar Chart: "Pengaturan: Sumbu Y a - b; Garis bantu n; Kelipatan nilai x; Kelipatan persen y",
 *     "Variabel: <nama> <p>%; ...", tabel Kategori | Nilai Awal | Kunci Nilai | <variabel...> (total 100 per baris)
 *   - Line Chart: "Pengaturan: Sumbu Y a - b; Garis bantu n; Kelipatan nilai x", tabel Titik | Kunci Nilai
 *   - Pie Chart: "Pengaturan: Kelipatan nilai x; Nilai minimum m", tabel Bagian | Nilai Awal | Kunci Nilai (total 100)
 *   - Table Decision: "Label Keputusan", "Opsi: A. ...; B. ...", tiap tab "Tab: <nama>" diikuti tabel, lalu
 *     "Jawaban: <tab>: <huruf>; ..."
 *   - soal grafik tidak boleh memuat gambar (grafik dibuat SiAdu dari tabel)
 *
 *   node uji/siadu.js
 */
'use strict';

var path = require('path');
var Berkas = require('./berkas.js');
var JS = path.join(__dirname, '..', 'js');

var TINGKAT = ['Mudah', 'Sedang', 'Sulit', 'Hots'];
var BENTUK = ['Option New', 'Multiple Choice', 'Short Answer', 'Table', 'Bar Chart', 'Line Chart', 'Pie Chart', 'Table Decision', 'Logical Ranking'];

function teksRun(xml) {
  var t = '';
  // teks biasa (w:t) dan teks persamaan (m:t)
  xml.replace(/<[wm]:t(?: [^>]*)?>([^<]*)<\/[wm]:t>/g, function (_, s) { t += Berkas.lepasEntitas(s); return _; });
  return t;
}

/** Isi badan dokumen sebagai urutan { p: teks, gambar: n } dan { tabel: [[sel]] }. */
function bacaBadan(docx) {
  var xml = Berkas.bacaZip(docx).filter(function (f) { return f.nama === 'word/document.xml'; })[0].data.toString('utf8');
  var badan = xml.slice(xml.indexOf('<w:body>') + 8, xml.lastIndexOf('</w:body>'));
  var out = [], re = /<w:tbl>[\s\S]*?<\/w:tbl>|<w:p[ >][\s\S]*?<\/w:p>|<w:p\/>/g, m;
  while ((m = re.exec(badan))) {
    var x = m[0];
    if (x.indexOf('<w:tbl>') === 0) {
      var baris = [], gambarSel = [];
      x.replace(/<w:tr>[\s\S]*?<\/w:tr>/g, function (tr) {
        var sel = [], foto = [];
        tr.replace(/<w:tc>[\s\S]*?<\/w:tc>/g, function (tc) { sel.push(teksRun(tc).trim());foto.push((tc.match(/<w:drawing>/g)||[]).length);return tc; });
        baris.push(sel);gambarSel.push(foto);return tr;
      });
      out.push({ tabel: baris, gambarSel: gambarSel });
    } else out.push({ p: teksRun(x), gambar: (x.match(/<w:drawing>/g) || []).length, rumus: (x.match(/<m:oMath>/g) || []).length, tebal: /^<w:p[ >][\s\S]*?<w:r><w:rPr><w:b\/>/.test(x) });
  }
  return out;
}

function angka(t) { return Number(String(t).replace(/\./g, '').replace(',', '.')); }

/** Pecah badan menjadi soal menurut paragraf "Soal N". */
function pecahSoal(badan) {
  var soal = [], kini = null;
  badan.forEach(function (x) {
    var m = x.p != null && /^Soal (\d+)$/.exec(x.p.trim());
    if (m) { kini = { no: Number(m[1]), isi: [] }; soal.push(kini); return; }
    if (kini) kini.isi.push(x);
  });
  return soal;
}

/**
 * Periksa satu berkas Word SiAdu terhadap butir asal (urutan sama).
 * @returns {string[]} daftar masalah (kosong bila sesuai)
 */
function periksa(docx, butir, modeRumus) {
  var masalah = [], soal = pecahSoal(bacaBadan(docx));
  if (soal.length !== butir.length) masalah.push('jumlah "Soal N" ' + soal.length + ', seharusnya ' + butir.length);
  soal.forEach(function (s, i) {
    var b = butir[i], nama = 'Soal ' + s.no;
    if (!b) return;
    if (s.no !== i + 1) masalah.push(nama + ': nomor tidak berurutan');
    var p = s.isi.filter(function (x) { return x.p != null; }).map(function (x) { return x.p.trim(); });
    var cari = function (re) { for (var j = 0; j < s.isi.length; j++) if (s.isi[j].p != null && re.test(s.isi[j].p.trim())) return j; return -1; };
    // identitas Kerangka Course (tebal), lalu Tingkat Kesulitan dan Bentuk Soal, lalu baris kosong
    var k = b.klasifikasi || {}, ident = ['Category: ' + k.category, 'Lesson: ' + k.lesson, 'Chapter: ' + k.chapter].concat(k.subchapter ? ['Subchapter: ' + k.subchapter] : []);
    ident.forEach(function (t, j) {
      var x = s.isi[j];
      if (!x || x.p == null || x.p.trim() !== t) masalah.push(nama + ': baris identitas ke-' + (j + 1) + ' seharusnya "' + t + '", tertulis "' + (x && x.p) + '"');
      else if (!x.tebal) masalah.push(nama + ': baris "' + t + '" harus tebal');
    });
    if (!k.category || /undefined/.test(ident.join())) masalah.push(nama + ': butir tanpa klasifikasi Kerangka Course');
    var nId = ident.length;
    var iTingkat = cari(/^Tingkat Kesulitan: /), iBentuk = cari(/^Bentuk Soal: /), iJawab = cari(/^Jawaban:/), iPem = cari(/^Pembahasan:$/);
    if (iTingkat !== nId || iBentuk !== nId + 1) masalah.push(nama + ': baris Tingkat Kesulitan dan Bentuk Soal harus tepat setelah identitas');
    if (!s.isi[nId + 2] || s.isi[nId + 2].p == null || s.isi[nId + 2].p.trim() !== '') masalah.push(nama + ': harus ada satu baris kosong setelah Bentuk Soal');
    var tingkat = iTingkat >= 0 ? s.isi[iTingkat].p.trim().slice(19) : '', bentuk = iBentuk >= 0 ? s.isi[iBentuk].p.trim().slice(13) : '';
    if (TINGKAT.indexOf(tingkat) < 0) masalah.push(nama + ': tingkat kesulitan "' + tingkat + '" tidak dikenal');
    else if (tingkat.toLowerCase() !== b.level) masalah.push(nama + ': tingkat ' + tingkat + ', butir ' + b.level);
    if (BENTUK.indexOf(bentuk) < 0) { masalah.push(nama + ': bentuk soal "' + bentuk + '" tidak dikenal'); return; }
    if (iJawab < 0 || iPem < 0 || iPem < iJawab) { masalah.push(nama + ': baris Jawaban/Pembahasan tidak ada atau terbalik'); return; }
    var soalIsi = s.isi.slice(nId + 3, iJawab), jawaban = s.isi[iJawab].p.trim().replace(/^Jawaban:\s*/, '');
    var bagianPem = s.isi.slice(iPem + 1);
    // rumus Word: Equation Word (m:oMath) atau baris LaTeX "$$...$$" (baku)
    var jumlahRumus = modeRumus === 'equation' ? bagianPem.reduce(function (n, x) { return n + (x.rumus || 0); }, 0)
      : bagianPem.filter(function (x) { return x.p != null && !x.rumus && /^\$\$[\s\S]+\$\$$/.test(x.p.trim()); }).length;
    if (modeRumus !== 'equation' && bagianPem.some(function (x) { return x.rumus; })) masalah.push(nama + ': mode LaTeX tetapi ada Equation Word');
    var harusRumus = (b.pembahasan || []).filter(function (t) { return /^§ /.test(t); }).length;
    if (jumlahRumus !== harusRumus) masalah.push(nama + ': ' + jumlahRumus + ' persamaan (' + (modeRumus || 'latex') + ') di pembahasan, seharusnya ' + harusRumus);
    if (bagianPem.some(function (x) { return x.p != null && /Pilihan lain yang menjebak/.test(x.p); })) masalah.push(nama + ': pembahasan masih mengulas pilihan yang salah');
    if (b.jenis === 'pg' && (b.gambarPembahasan || []).length !== bagianPem.reduce(function (n, x) { return n + (x.gambar || 0); }, 0)) masalah.push(nama + ': gambar pembahasan tidak lengkap');
    var langkah=(b.gambarPembahasan||[]).filter(function(g){return g.setelah;});
    if(langkah.length){
      if(langkah.length!==bagianPem.reduce(function(n,x){return n+(x.gambar||0);},0))masalah.push(nama+': visual langkah tidak lengkap');
      langkah.forEach(function(g){var at=bagianPem.findIndex(function(x){return x.p===g.setelah;});if(at<0||!bagianPem[at+1]||bagianPem[at+1].gambar!==1)masalah.push(nama+': gambar tidak tepat setelah langkah '+g.id);});
    }
    var tabel = soalIsi.filter(function (x) { return x.tabel; }).map(function (x) { return x.tabel; });
    var paraSoal = soalIsi.filter(function (x) { return x.p != null; }).map(function (x) { return x.p.trim(); });
    var pembahasan = s.isi.slice(iPem + 1).filter(function (x) { return x.p != null && x.p.trim(); });
    if (!pembahasan.length) masalah.push(nama + ': pembahasan kosong');

    if (bentuk === 'Option New') {
      if (b.jenis !== 'pg') { masalah.push(nama + ': butir interaktif ditulis sebagai Option New'); return; }
      var opsi = soalIsi.filter(function (x) { return x.p != null && /^[A-E]\. ?/.test(x.p.trim()); });
      if (opsi.length !== b.opsi.length) masalah.push(nama + ': ' + opsi.length + ' pilihan, butir ' + b.opsi.length);
      opsi.forEach(function (o, k) {
        if (o.p.trim().charAt(0) !== 'ABCDE'[k]) masalah.push(nama + ': urutan huruf pilihan salah');
        if (b.opsi[k] && b.opsi[k].gambar && o.gambar !== 1) masalah.push(nama + ': pilihan ' + 'ABCDE'[k] + ' seharusnya memuat satu gambar');
        if (b.opsi[k] && !b.opsi[k].gambar && o.p.trim() !== 'ABCDE'[k] + '. ' + b.opsi[k].teks) masalah.push(nama + ': teks pilihan ' + 'ABCDE'[k] + ' berbeda');
      });
      if (jawaban !== 'ABCDE'[b.kunci]) masalah.push(nama + ': Jawaban "' + jawaban + '", kunci ' + 'ABCDE'[b.kunci]);
      if (tabel.length) masalah.push(nama + ': tabel Word di soal pilihan ganda dapat terbaca sebagai bentuk Table');
      if (b.pertanyaan && b.submateri !== 'verbal' && paraSoal.indexOf(b.pertanyaan) < 0) masalah.push(nama + ': pertanyaan tidak tertulis');
      if (b.submateri === 'verbal' && paraSoal.indexOf(b.pertanyaan) < 0) masalah.push(nama + ': pernyataan verbal tidak tertulis polos');
      if (paraSoal.some(function (t) { return /^Pernyataan:|Berdasarkan bacaan di atas/.test(t); })) masalah.push(nama + ': label/petunjuk verbal masih ada');
      return;
    }

    if (b.jenis !== 'isian') { masalah.push(nama + ': butir pilihan ganda ditulis sebagai ' + bentuk); return; }
    var is = b.isian;
    if (soalIsi.some(function (x) { return x.gambar; })) masalah.push(nama + ': soal grafik tidak boleh memuat gambar');
    if (bentuk!=='Logical Ranking'&&paraSoal.indexOf('Pertanyaan') < 0) masalah.push(nama + ': baris "Pertanyaan" tidak ada');
    var peng = paraSoal.filter(function (t) { return /^Pengaturan: /.test(t); })[0] || '';
    var bagianP = {};
    peng.replace(/^Pengaturan: /, '').split(';').forEach(function (x) {
      x = x.trim();
      var m1 = /^Sumbu Y ([\d.]+) - ([\d.]+)$/.exec(x); if (m1) { bagianP.min = angka(m1[1]); bagianP.maks = angka(m1[2]); return; }
      var m2 = /^(Garis bantu|Kelipatan nilai|Kelipatan persen|Nilai minimum) ([\d.,]+)$/.exec(x); if (m2) bagianP[m2[1]] = angka(m2[2]);
    });
    var dataTabel = tabel.filter(function (t) { return t[0].some(function (h) { return /Kunci/.test(h); }); });
    if (bentuk === 'Bar Chart') {
      if (is.jenis !== 'bar-tumpuk') { masalah.push(nama + ': bentuk Bar Chart untuk isian ' + is.jenis); return; }
      if (bagianP.min !== 0 || !(bagianP.maks > 0) || !bagianP['Garis bantu'] || !bagianP['Kelipatan nilai'] || !bagianP['Kelipatan persen']) masalah.push(nama + ': baris Pengaturan bar tidak lengkap: ' + peng);
      if (bagianP['Kelipatan persen'] !== 1) masalah.push(nama + ': kelipatan persen harus 1');
      var vb = paraSoal.filter(function (t) { return /^Variabel: /.test(t); })[0];
      var vars = vb ? vb.slice(10).split(';').map(function (x) { var m = /^(.*) (\d+)%$/.exec(x.trim()); return m ? { nama: m[1], p: Number(m[2]) } : null; }) : [];
      if (vars.length !== 2 || vars.some(function (v) { return !v; }) || vars[0].p + vars[1].p !== 100) masalah.push(nama + ': baris Variabel tidak sah: ' + vb);
      var tb = dataTabel[0];
      if (!tb || tb[0].join('|') !== ['Kategori', 'Nilai Awal', 'Kunci Nilai'].concat(vars.map(function (v) { return v && v.nama; })).join('|')) { masalah.push(nama + ': kepala tabel bar tidak sesuai template'); return; }
      tb.slice(1).forEach(function (r, k) {
        var kunci = angka(r[2]), p1 = angka(r[3]), p2 = angka(r[4]);
        if (kunci !== is.kunci.total[k] || p1 !== is.kunci.persen[k] || p1 + p2 !== 100) masalah.push(nama + ': baris ' + r[0] + ' tidak sama dengan kunci');
        if (kunci > bagianP.maks || kunci % bagianP['Kelipatan nilai'] !== 0 || p1 % bagianP['Kelipatan persen'] !== 0) masalah.push(nama + ': kunci ' + r[0] + ' di luar sumbu atau bukan kelipatan');
      });
      if (jawaban) masalah.push(nama + ': Jawaban grafik seharusnya kosong');
    } else if (bentuk === 'Line Chart') {
      if (is.jenis !== 'garis') { masalah.push(nama + ': bentuk Line Chart untuk isian ' + is.jenis); return; }
      var tl = dataTabel[0];
      if (!tl || tl[0].join('|') !== 'Titik|Kunci Nilai' || tl.length < 3) { masalah.push(nama + ': tabel line tidak sesuai template'); return; }
      tl.slice(1).forEach(function (r, k) {
        var v = angka(r[1]);
        if (r[0] !== is.kategori[k] || v !== is.kunci.nilai[k]) masalah.push(nama + ': titik ' + r[0] + ' tidak sama dengan kunci');
        if (v < bagianP.min || v > bagianP.maks || Math.abs((v - bagianP.min) / bagianP['Kelipatan nilai'] - Math.round((v - bagianP.min) / bagianP['Kelipatan nilai'])) > 1e-9) masalah.push(nama + ': titik ' + r[0] + ' di luar sumbu atau bukan kelipatan');
      });
      if ((bagianP.maks - bagianP.min) / bagianP['Kelipatan nilai'] > 120) masalah.push(nama + ': sumbu terlalu rinci untuk digeser');
      if (jawaban) masalah.push(nama + ': Jawaban grafik seharusnya kosong');
    } else if (bentuk === 'Pie Chart') {
      if (is.jenis !== 'pie') { masalah.push(nama + ': bentuk Pie Chart untuk isian ' + is.jenis); return; }
      var tp = dataTabel[0];
      if (!tp || tp[0].slice(0, 3).join('|') !== 'Bagian|Nilai Awal|Kunci Nilai') { masalah.push(nama + ': tabel pie tidak sesuai template'); return; }
      var jAwal = 0, jKunci = 0;
      tp.slice(1).forEach(function (r, k) { jAwal += angka(r[1]); jKunci += angka(r[2]); if (angka(r[2]) !== is.kunci.persen[k]) masalah.push(nama + ': bagian ' + r[0] + ' tidak sama dengan kunci'); });
      if (jAwal !== 100 || jKunci !== 100) masalah.push(nama + ': nilai pie tidak berjumlah 100');
      if (!bagianP['Kelipatan nilai'] || !bagianP['Nilai minimum']) masalah.push(nama + ': baris Pengaturan pie tidak lengkap');
      if (bagianP['Kelipatan nilai'] !== 1) masalah.push(nama + ': kelipatan persen pie harus 1');
      var info = tabel.filter(function (t) { return t !== tp; })[0];
      if (!info || [].concat.apply([], info).length !== 4) masalah.push(nama + ': keterangan pie harus berupa tabel empat kotak');
      if (paraSoal.concat(info ? [].concat.apply([], info) : []).some(function (t) { return /\((biru|hijau|jingga|merah)\)|tidak disebutkan/.test(t); })) masalah.push(nama + ': nama warna atau kalimat "tidak disebutkan" masih ada');
      if (jawaban) masalah.push(nama + ': Jawaban grafik seharusnya kosong');
    } else if (bentuk === 'Table Decision') {
      if (is.jenis !== 'tabel') { masalah.push(nama + ': bentuk Table Decision untuk isian ' + is.jenis); return; }
      var opsiTd = (paraSoal.filter(function (t) { return /^Opsi: /.test(t); })[0] || '').slice(6).split(';').map(function (x) { return x.trim().replace(/^[A-E]\. /, ''); });
      if (opsiTd.join('|') !== is.pilihan.join('|')) masalah.push(nama + ': baris Opsi tidak sama dengan pilihan');
      var tabNama = [];
      soalIsi.forEach(function (x, j) {
        if (x.p != null && /^Tab: /.test(x.p.trim())) { tabNama.push(x.p.trim().slice(5)); if (!soalIsi[j + 1] || !soalIsi[j + 1].tabel) masalah.push(nama + ': tab ' + x.p.trim() + ' tidak diikuti tabel'); }
      });
      if (tabNama.join('|') !== is.tab.join('|')) masalah.push(nama + ': daftar tab berbeda');
      var harap = is.tab.map(function (t, k) { return t + ': ' + 'ABCDE'[is.kunci[k]]; }).join('; ');
      if (jawaban !== harap) masalah.push(nama + ': Jawaban "' + jawaban + '", seharusnya "' + harap + '"');
    } else if (bentuk === 'Logical Ranking') {
      if (is.jenis !== 'peringkat') { masalah.push(nama + ': Logical Ranking untuk isian ' + is.jenis); return; }
      var blok=soalIsi.filter(function(x){return x.tabel;})[0],tr=blok&&blok.tabel;
      if(tabel.length!==1||!tr||tr[0].join('|')!=='Nama|Deskripsi|Gambar|Posisi Urut'||tr.length!==is.nama.length+1){masalah.push(nama+': tabel Logical Ranking harus Nama/Deskripsi/Gambar/Posisi Urut');return;}
        if(tr.slice(1).filter(function(r){return !r[1].trim();}).length>2)masalah.push(nama+': maksimal dua deskripsi kosong');
        tr.slice(1).forEach(function(r,j){
          if(r.length!==4||r[0]!==is.nama[j]||r[1]!==is.kartu[j].petunjuk.join(' ')||r[2]!==''||Number(r[3])!==is.kunci.peringkat[j])masalah.push(nama+': data atau kunci baris '+(j+1)+' berbeda');
        if(blok.gambarSel[j+1].join()!=='0,0,1,0')masalah.push(nama+': gambar wajib tertanam hanya di kolom Gambar');
      });
      if(jawaban!=='')masalah.push(nama+': Jawaban seharusnya kosong; kunci ada di Posisi Urut');
      is.pengantar.concat([b.pertanyaan]).forEach(function(t){if(paraSoal.indexOf(t)<0)masalah.push(nama+': pengantar/pertanyaan badge hilang');});
    } else masalah.push(nama + ': bentuk ' + bentuk + ' tidak dipakai generator');
  });
  return masalah;
}

module.exports = { bacaBadan: bacaBadan, pecahSoal: pecahSoal, periksa: periksa };

if (require.main === module) {
  var Paket = require(path.join(JS, 'paket.js'));
  var Ekspor = require(path.join(JS, 'ekspor.js'));
  var komposisi = { ku: { verbal: 5, cerita: 5, tabel: 5, grafik: 5, serial: 5, matriks: 5 }, pn: { bar: 5, tabel: 5, garis: 5, pie: 5 } };
  var hasil = Paket.buat({ jumlahPaket: 2, benih: 2824819757, komposisi: komposisi });
  var gagal = 0, jalan = Promise.resolve();
  hasil.hasil.paket.forEach(function (p) {
    ['latex', 'equation'].forEach(function (mode) { jalan = jalan.then(function () { return Ekspor.berkasPaket(p, { docx: true, benih: 2824819757, rumus: mode }); }).then(function (berkas) {
      berkas.filter(function (f) { return f.jenis === 'docx'; }).forEach(function (f) {
        var st = p.subtes.filter(function (s) { return s.kode === f.subtes; })[0];
        var m = periksa(Buffer.from(f.data), st.butir, mode);
        console.log((m.length ? 'GAGAL ' : 'ok    ') + f.nama + ' (rumus ' + mode + '): ' + st.butir.length + ' soal' + (m.length ? ' - ' + m.slice(0, 5).join('; ') : ''));
        if (m.length) gagal++;
      });
    }); });
  });
  jalan.then(function () { console.log('HASIL: ' + gagal + ' berkas bermasalah'); process.exitCode = gagal ? 1 : 0; });
}
