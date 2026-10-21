/*
 * docx.js — penulis berkas Word (.docx) tanpa pustaka luar.
 *
 * Menerima model blok dari `dokumen.js` dan menyusun WordprocessingML di atas
 * penulis ZIP (`zip.js`). Halaman A4 tegak, huruf Arial 10,5 pt. Judul memakai gaya
 * judul sungguhan (Heading 1-3) sehingga Word dan Google Docs menampilkan kerangka
 * dokumen. Gambar disematkan sebagai PNG dengan ukuran tampil dalam EMU; deret opsi
 * bergambar dan empat tab tabel disusun sebagai tabel tanpa garis. Kaki halaman
 * memuat nama paket dan nomor halaman.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./zip.js'), require('./rumus.js'));
    module.exports = api;
  } else {
    api = factory(root.Zip, root.Rumus);
    root.Docx = api;
  }
})(typeof self !== 'undefined' ? self : this, function (Zip, Rumus) {
  'use strict';

  var enc = new TextEncoder();
  var HAL_LEBAR = 11906, HAL_TINGGI = 16838, TEPI = 1134;           // twip: A4, 2 cm
  var LEBAR_ISI = HAL_LEBAR - TEPI * 2;                              // 9638 twip = 481,9 pt
  var KEPALA = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
  var UKURAN = 21;                                                   // setengah titik = 10,5 pt

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function rpr(r, dasar) {
    var uk = r.ukuran || dasar || null;
    return '<w:rPr>' + (r.tebal ? '<w:b/><w:bCs/>' : '') + (r.miring ? '<w:i/><w:iCs/>' : '') +
      (r.warna ? '<w:color w:val="' + r.warna + '"/>' : '') +
      (uk ? '<w:sz w:val="' + Math.round(uk * 2) + '"/><w:szCs w:val="' + Math.round(uk * 2) + '"/>' : '') + '</w:rPr>';
  }

  function ppr(o) {
    var s = '<w:pPr>';
    if (o.gaya) s += '<w:pStyle w:val="' + o.gaya + '"/>';
    if (o.keepNext) s += '<w:keepNext/>';
    if (o.keepLines) s += '<w:keepLines/>';
    s += '<w:spacing' + (o.sebelum ? ' w:before="' + Math.round(o.sebelum * 20) + '"' : '') + ' w:after="' + Math.round((o.sesudah == null ? 5 : o.sesudah) * 20) + '"/>';
    if (o.indent || o.gantung) s += '<w:ind w:left="' + Math.round((o.indent || 0) * 20) + '"' + (o.gantung ? ' w:hanging="' + Math.round(o.gantung * 20) + '"' : '') + '/>';
    if (o.rata) s += '<w:jc w:val="' + (o.rata === 'tengah' ? 'center' : (o.rata === 'kanan' ? 'right' : 'left')) + '"/>';
    return s + '</w:pPr>';
  }

  function paragraf(runs, o) {
    o = o || {};
    var isi = runs.map(function (r) {
      return '<w:r>' + rpr(r, o.ukuran) + '<w:t xml:space="preserve">' + esc(r.teks) + '</w:t></w:r>';
    }).join('');
    return '<w:p>' + ppr(o) + isi + '</w:p>';
  }

  // ---------------------------------------------------------------- penulis

  function Penulis() {
    this.gambar = [];           // { rid, nama, data }
    this.petaGambar = new Map();
    this.nomorDocPr = 0;
  }

  Penulis.prototype.daftarkan = function (img) {
    var kunci = img.png;
    var g = this.petaGambar.get(kunci);
    if (!g) {
      var no = this.gambar.length + 1;
      g = { rid: 'rId' + (no + 9), nama: 'gambar' + no + '.png', data: img.png };
      this.gambar.push(g);
      this.petaGambar.set(kunci, g);
    }
    return g;
  };

  Penulis.prototype.gambarInline = function (img, lebarPt) {
    var g = this.daftarkan(img);
    var cx = Math.round(lebarPt * 12700), cy = Math.round(lebarPt * img.tinggi / img.lebar * 12700);
    var id = ++this.nomorDocPr;
    return '<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0">' +
      '<wp:extent cx="' + cx + '" cy="' + cy + '"/><wp:effectExtent l="0" t="0" r="0" b="0"/>' +
      '<wp:docPr id="' + id + '" name="Gambar ' + id + '"/>' +
      '<wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr>' +
      '<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic>' +
      '<pic:nvPicPr><pic:cNvPr id="' + id + '" name="' + g.nama + '"/><pic:cNvPicPr/></pic:nvPicPr>' +
      '<pic:blipFill><a:blip r:embed="' + g.rid + '"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>' +
      '<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="' + cx + '" cy="' + cy + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>' +
      '</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>';
  };

  function batasPt(img, lebarPt, tinggiMaksPt) {
    var l = Math.min(lebarPt, LEBAR_ISI / 20);
    var t = l * img.tinggi / img.lebar;
    if (t > tinggiMaksPt) l = tinggiMaksPt * img.lebar / img.tinggi;
    return l;
  }

  Penulis.prototype.blok = function (b, jaga, akhirGrup) {
    var self = this, o = { keepNext: jaga && !akhirGrup, keepLines: jaga };
    switch (b.t) {
      case 'h1': return paragraf([{ teks: b.teks }], Object.assign({ gaya: 'Heading1', sesudah: 6 }, o));
      case 'h2': return paragraf([{ teks: b.teks }], Object.assign({ gaya: 'Heading2', sesudah: 5, sebelum: 8 }, o, { keepNext: true }));
      case 'h3': return paragraf([{ teks: b.teks }], Object.assign({ gaya: 'Heading3', sesudah: 4, sebelum: 6 }, o, { keepNext: true }));
      case 'p': {
        var runs = b.runs.map(function (r) { return { teks: r.teks, tebal: r.tebal, miring: r.miring, warna: r.warna || b.warna, ukuran: r.ukuran }; });
        var xml = paragraf(runs, { ukuran: b.ukuran, rata: b.rata, indent: b.indent, gantung: b.gantung, sesudah: b.sesudah, keepNext: o.keepNext || b.keras, keepLines: o.keepLines });
        // paragraf boleh ditutup satu gambar sebaris (mis. pilihan bergambar "A. <gambar>" pada format SiAdu)
        if (b.img) xml = xml.replace(/<\/w:p>$/, self.gambarInline(b.img, batasPt(b.img, b.lebarPt || 84, 300)) + '</w:p>');
        return xml;
      }
      case 'jarak': return '<w:p><w:pPr><w:spacing w:after="' + Math.round(b.tinggi * 20) + '" w:line="20" w:lineRule="exact"/></w:pPr></w:p>';
      case 'jeda': return '<w:p><w:pPr><w:spacing w:after="0"/></w:pPr><w:r><w:br w:type="page"/></w:r></w:p>';
      case 'gambar': {
        var l = batasPt(b.img, b.lebarPt, 560);
        return '<w:p>' + ppr({ rata: b.rata === 'tengah' ? 'tengah' : null, sesudah: b.sesudah == null ? 5 : b.sesudah, keepNext: o.keepNext, keepLines: o.keepLines }) + self.gambarInline(b.img, l) + '</w:p>';
      }
      case 'rumus': {
        // persamaan Word (OMML) rata kiri dalam paragrafnya sendiri; SiAdu mengubahnya menjadi MathML
        return '<w:p>' + ppr({ sesudah: 4, keepNext: o.keepNext, keepLines: o.keepLines }) + '<m:oMathPara><m:oMathParaPr><m:jc m:val="left"/></m:oMathParaPr>' + Rumus.omml(b.notasi) + '</m:oMathPara></w:p>';
      }
      case 'galeri': return self.galeri(b, o);
      case 'tabel': return self.tabel(b, o);
      case 'grup': {
        var anak = b.anak;
        return anak.map(function (x, i) { return self.blok(x, true, i === anak.length - 1); }).join('');
      }
      default: return '';
    }
  };

  Penulis.prototype.galeri = function (b, o) {
    var self = this, kolom = b.kolom || b.item.length, lebarSel = Math.floor(LEBAR_ISI / kolom);
    var baris = [];
    for (var i = 0; i < b.item.length; i += kolom) baris.push(b.item.slice(i, i + kolom));
    var xml = '<w:tbl><w:tblPr><w:tblW w:w="' + (lebarSel * kolom) + '" w:type="dxa"/>' +
      '<w:tblBorders>' + ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map(function (s) { return '<w:' + s + ' w:val="none" w:sz="0" w:space="0" w:color="auto"/>'; }).join('') + '</w:tblBorders>' +
      '<w:tblLayout w:type="fixed"/><w:tblCellMar><w:left w:w="40" w:type="dxa"/><w:right w:w="40" w:type="dxa"/></w:tblCellMar></w:tblPr>' +
      '<w:tblGrid>' + Array.apply(null, { length: kolom }).map(function () { return '<w:gridCol w:w="' + lebarSel + '"/>'; }).join('') + '</w:tblGrid>';
    baris.forEach(function (row) {
      xml += '<w:tr><w:trPr><w:cantSplit/></w:trPr>';
      for (var c = 0; c < kolom; c++) {
        var it = row[c];
        xml += '<w:tc><w:tcPr><w:tcW w:w="' + lebarSel + '" w:type="dxa"/><w:vAlign w:val="top"/></w:tcPr>';
        if (it && it.img) {
          var pt = Math.min(b.lebarPt || 100, lebarSel / 20 - 4);
          pt = batasPt(it.img, pt, 330);
          xml += '<w:p>' + ppr({ rata: 'tengah', sesudah: 2, keepNext: true, keepLines: true }) + self.gambarInline(it.img, pt) + '</w:p>';
          if (it.label) xml += paragraf([{ teks: it.label, tebal: true }], { rata: 'tengah', sesudah: 4, keepNext: o.keepNext, keepLines: true });
          else xml += '<w:p/>';
        } else xml += '<w:p/>';
        xml += '</w:tc>';
      }
      xml += '</w:tr>';
    });
    return xml + '</w:tbl><w:p><w:pPr><w:spacing w:after="40" w:line="20" w:lineRule="exact"/></w:pPr></w:p>';
  };

  Penulis.prototype.tabel = function (b, o) {
    var jml = b.lebarKol.reduce(function (s, x) { return s + x; }, 0);
    var lebar = b.lebarKol.map(function (x) { return Math.floor(LEBAR_ISI * x / jml); });
    var total = lebar.reduce(function (s, x) { return s + x; }, 0);
    var xml = '<w:tbl><w:tblPr><w:tblW w:w="' + total + '" w:type="dxa"/>' +
      '<w:tblBorders>' + ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map(function (s) { return '<w:' + s + ' w:val="single" w:sz="' + (b.garis ? 12 : 4) + '" w:space="0" w:color="' + (b.garis || 'B8C2D6') + '"/>'; }).join('') + '</w:tblBorders>' +
      '<w:tblLayout w:type="fixed"/><w:tblCellMar><w:top w:w="30" w:type="dxa"/><w:left w:w="80" w:type="dxa"/><w:bottom w:w="30" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tblCellMar></w:tblPr>' +
      '<w:tblGrid>' + lebar.map(function (w) { return '<w:gridCol w:w="' + w + '"/>'; }).join('') + '</w:tblGrid>';
    b.baris.forEach(function (row, r) {
      var minBaris = Math.max.apply(null, row.map(function (sel) { return sel.minBaris || 0; }));
      xml += '<w:tr><w:trPr><w:cantSplit/>' + (r === 0 && b.header ? '<w:tblHeader/>' : '') + (minBaris ? '<w:trHeight w:val="' + Math.round(minBaris * 13.5 * 20 + 120) + '" w:hRule="atLeast"/>' : '') + '</w:trPr>';
      row.forEach(function (sel, c) {
        var lanjut = o.keepNext || r < b.baris.length - 1;
        xml += '<w:tc><w:tcPr><w:tcW w:w="' + lebar[c] + '" w:type="dxa"/>' + (sel.isi ? '<w:shd w:val="clear" w:color="auto" w:fill="' + sel.isi + '"/>' : '') + '</w:tcPr>';
        // sel kotak keterangan: judul tebal di atas isinya (keduanya boleh berwarna)
        if (sel.judul != null) xml += paragraf([{ teks: sel.judul, tebal: true, warna: sel.warnaTeks }], { ukuran: 10, rata: sel.rata, sesudah: 3, keepNext: true, keepLines: true });
        xml += paragraf([{ teks: sel.teks == null ? '' : sel.teks, tebal: sel.tebal, warna: sel.warnaTeks }], { ukuran: 10, rata: sel.rata, sesudah: sel.judul != null ? 4 : 0, keepNext: lanjut, keepLines: true });
        xml += '</w:tc>';
      });
      xml += '</w:tr>';
    });
    return xml + '</w:tbl><w:p><w:pPr><w:spacing w:after="80" w:line="20" w:lineRule="exact"/></w:pPr></w:p>';
  };

  // ------------------------------------------------------------ bagian paket

  function styles() {
    function judul(id, nama, tingkat, ukuran, warna) {
      return '<w:style w:type="paragraph" w:styleId="' + id + '"><w:name w:val="' + nama + '"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:uiPriority w:val="9"/><w:qFormat/>' +
        '<w:pPr><w:keepNext/><w:keepLines/><w:spacing w:before="120" w:after="100"/><w:outlineLvl w:val="' + tingkat + '"/></w:pPr>' +
        '<w:rPr><w:rFonts w:ascii="Arial" w:eastAsia="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:b/><w:bCs/><w:color w:val="' + warna + '"/><w:sz w:val="' + ukuran * 2 + '"/><w:szCs w:val="' + ukuran * 2 + '"/></w:rPr></w:style>';
    }
    return KEPALA + '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
      '<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:eastAsia="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:sz w:val="' + UKURAN + '"/><w:szCs w:val="' + UKURAN + '"/><w:lang w:val="id-ID"/></w:rPr></w:rPrDefault>' +
      '<w:pPrDefault><w:pPr><w:spacing w:after="100" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>' +
      '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>' +
      judul('Heading1', 'heading 1', 0, 17, '1B2130') + judul('Heading2', 'heading 2', 1, 13, '1F3A5F') + judul('Heading3', 'heading 3', 2, 11, '2C4A7A') +
      '</w:styles>';
  }

  // Tanpa compatibilityMode 15, Word membuka berkas dalam Mode Kompatibilitas (Word 2007).
  function settings() {
    return KEPALA + '<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:compat>' +
      '<w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/>' +
      '</w:compat></w:settings>';
  }

  function kaki(teks) {
    return KEPALA + '<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:pPr><w:jc w:val="center"/></w:pPr>' +
      '<w:r><w:rPr><w:color w:val="667089"/><w:sz w:val="17"/></w:rPr><w:t xml:space="preserve">' + esc(teks) + ' · Halaman </w:t></w:r>' +
      '<w:r><w:rPr><w:color w:val="667089"/><w:sz w:val="17"/></w:rPr><w:fldChar w:fldCharType="begin"/></w:r>' +
      '<w:r><w:rPr><w:color w:val="667089"/><w:sz w:val="17"/></w:rPr><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r>' +
      '<w:r><w:rPr><w:color w:val="667089"/><w:sz w:val="17"/></w:rPr><w:fldChar w:fldCharType="separate"/></w:r>' +
      '<w:r><w:rPr><w:color w:val="667089"/><w:sz w:val="17"/></w:rPr><w:t>1</w:t></w:r>' +
      '<w:r><w:rPr><w:color w:val="667089"/><w:sz w:val="17"/></w:rPr><w:fldChar w:fldCharType="end"/></w:r></w:p></w:ftr>';
  }

  /**
   * @param {{judul:string, blok:Array, kaki:string}} model
   * @returns {Promise<Uint8Array>}
   */
  function buat(model) {
    var w = new Penulis(), isi = [];
    model.blok.forEach(function (b) { isi.push(w.blok(b, false, false)); });
    // badan tidak boleh berakhir dengan tabel
    isi.push('<w:p><w:pPr><w:spacing w:after="0"/></w:pPr></w:p>');

    var dokumen = KEPALA + '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" ' +
      'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ' +
      'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" ' +
      'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ' +
      'xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture" ' +
      'xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"><w:body>' + isi.join('') +
      '<w:sectPr><w:footerReference w:type="default" r:id="rId2"/>' +
      '<w:pgSz w:w="' + HAL_LEBAR + '" w:h="' + HAL_TINGGI + '"/>' +
      '<w:pgMar w:top="' + TEPI + '" w:right="' + TEPI + '" w:bottom="' + TEPI + '" w:left="' + TEPI + '" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr></w:body></w:document>';

    var tipe = KEPALA + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/>' +
      '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
      '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>' +
      '<Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>' +
      '<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/></Types>';
    var rels = KEPALA + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>';
    var relsDok = KEPALA + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
      '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>' +
      '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>' +
      w.gambar.map(function (g) { return '<Relationship Id="' + g.rid + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/' + g.nama + '"/>'; }).join('') +
      '</Relationships>';

    var berkas = [
      { nama: '[Content_Types].xml', data: enc.encode(tipe) },
      { nama: '_rels/.rels', data: enc.encode(rels) },
      { nama: 'word/_rels/document.xml.rels', data: enc.encode(relsDok) },
      { nama: 'word/styles.xml', data: enc.encode(styles()) },
      { nama: 'word/settings.xml', data: enc.encode(settings()) },
      { nama: 'word/footer1.xml', data: enc.encode(kaki(model.kaki || '')) },
      { nama: 'word/document.xml', data: enc.encode(dokumen) }
    ];
    w.gambar.forEach(function (g) { berkas.push({ nama: 'word/media/' + g.nama, data: g.data, mampat: false }); });
    return Zip.buat(berkas);
  }

  return { buat: buat, esc: esc };
});
