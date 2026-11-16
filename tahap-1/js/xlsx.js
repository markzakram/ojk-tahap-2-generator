/*
 * xlsx.js — penulis berkas Excel (.xlsx) tanpa pustaka luar.
 *
 * Lembar kerja ditulis sebagai OOXML mentah di atas penulis ZIP (`zip.js`): teks
 * disimpan sebagai inline string (tanpa tabel string bersama), angka sebagai
 * angka. Baris judul ditebalkan, diberi warna, dibekukan, dan diberi penyaring;
 * sel teks panjang dibungkus. Teks lebih dari 32.767 karakter (batas Excel)
 * dipotong.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./zip.js'));
    module.exports = api;
  } else {
    api = factory(root.Zip);
    root.Xlsx = api;
  }
})(typeof self !== 'undefined' ? self : this, function (Zip) {
  'use strict';

  var enc = new TextEncoder();
  var KEPALA = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
  var MAKS_SEL = 32767;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /** 0 -> A, 25 -> Z, 26 -> AA. */
  function huruf(n) {
    var s = '';
    n++;
    while (n > 0) { var m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
    return s;
  }

  function sel(r, c, v, gaya) {
    var ref = huruf(c) + r;
    if (v === null || v === undefined || v === '') return '<c r="' + ref + '" s="' + gaya + '"/>';
    if (typeof v === 'number' && isFinite(v)) return '<c r="' + ref + '" s="' + gaya + '"><v>' + v + '</v></c>';
    if (v && Array.isArray(v.runs)) {
      var sisa = MAKS_SEL;
      var rich = v.runs.map(function(run){
        var teks = String(run.teks || '').slice(0,sisa); sisa -= teks.length;
        if(!teks) return '';
        var pr = (run.tebal ? '<b/>' : '') + (/^[0-9a-f]{6}$/i.test(run.warna || '') ? '<color rgb="FF' + run.warna.toUpperCase() + '"/>' : '');
        return '<r>' + (pr ? '<rPr>' + pr + '</rPr>' : '') + '<t xml:space="preserve">' + esc(teks) + '</t></r>';
      }).join('');
      return '<c r="' + ref + '" s="' + gaya + '" t="inlineStr"><is>' + rich + '</is></c>';
    }
    var t = String(v);
    if (t.length > MAKS_SEL) t = t.slice(0, MAKS_SEL - 20) + '… [dipotong]';
    return '<c r="' + ref + '" s="' + gaya + '" t="inlineStr"><is><t xml:space="preserve">' + esc(t) + '</t></is></c>';
  }

  function lembarXml(l) {
    var jmlKol = l.kolom.length, jmlBaris = l.baris.length + 1;
    var xml = KEPALA + '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">';
    xml += '<sheetViews><sheetView workbookViewId="0"' + (l.pertama ? ' tabSelected="1"' : '') + '>' +
      '<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft"/></sheetView></sheetViews>';
    xml += '<sheetFormatPr defaultRowHeight="15"/>';
    xml += '<cols>' + l.kolom.map(function (k, i) { return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + (k.lebar || 16) + '" customWidth="1"/>'; }).join('') + '</cols>';
    xml += '<sheetData>';
    xml += '<row r="1" ht="22" customHeight="1">' + l.kolom.map(function (k, c) { return sel(1, c, k.judul, 1); }).join('') + '</row>';
    l.baris.forEach(function (row, r) {
      xml += '<row r="' + (r + 2) + '">' + l.kolom.map(function (k, c) { return sel(r + 2, c, row[c], typeof row[c] === 'number' ? 3 : 2); }).join('') + '</row>';
    });
    xml += '</sheetData>';
    if (l.saring !== false && l.baris.length) xml += '<autoFilter ref="A1:' + huruf(jmlKol - 1) + jmlBaris + '"/>';
    xml += '<pageMargins left="0.5" right="0.5" top="0.75" bottom="0.75" header="0.3" footer="0.3"/></worksheet>';
    return xml;
  }

  function stylesXml() {
    return KEPALA + '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<fonts count="2"><font><sz val="10.5"/><name val="Arial"/></font><font><b/><sz val="10.5"/><color rgb="FFFFFFFF"/><name val="Arial"/></font></fonts>' +
      '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>' +
      '<fill><patternFill patternType="solid"><fgColor rgb="FF1F3A5F"/><bgColor indexed="64"/></patternFill></fill></fills>' +
      '<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border>' +
      '<border><left style="thin"><color rgb="FFB8C2D6"/></left><right style="thin"><color rgb="FFB8C2D6"/></right><top style="thin"><color rgb="FFB8C2D6"/></top><bottom style="thin"><color rgb="FFB8C2D6"/></bottom><diagonal/></border></borders>' +
      '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
      '<cellXfs count="4">' +
      '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
      '<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>' +
      '<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>' +
      '<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="top"/></xf>' +
      '</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
  }

  /**
   * @param {Array<{nama:string, kolom:Array<{judul:string, lebar:number}>, baris:Array<Array>, saring?:boolean}>} lembar
   * @returns {Promise<Uint8Array>}
   */
  function buat(lembar) {
    lembar.forEach(function (l, i) { l.pertama = i === 0; });
    var tipe = KEPALA + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
      '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
      lembar.map(function (l, i) { return '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'; }).join('') + '</Types>';
    var rels = KEPALA + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>';
    var nama = function (n) { return esc(String(n).replace(/[\[\]\*\/\\\?:]/g, ' ').slice(0, 31)); };
    var buku = KEPALA + '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      '<bookViews><workbookView/></bookViews><sheets>' +
      lembar.map(function (l, i) { return '<sheet name="' + nama(l.nama) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>'; }).join('') + '</sheets>' +
      '<definedNames>' + lembar.map(function (l, i) {
        return l.saring !== false && l.baris.length ? '<definedName name="_xlnm._FilterDatabase" localSheetId="' + i + '" hidden="1">\'' + nama(l.nama) + '\'!$A$1:$' + huruf(l.kolom.length - 1) + '$' + (l.baris.length + 1) + '</definedName>' : '';
      }).join('') + '</definedNames></workbook>';
    var relsBuku = KEPALA + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      lembar.map(function (l, i) { return '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>'; }).join('') +
      '<Relationship Id="rId' + (lembar.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>';
    var berkas = [
      { nama: '[Content_Types].xml', data: enc.encode(tipe) },
      { nama: '_rels/.rels', data: enc.encode(rels) },
      { nama: 'xl/workbook.xml', data: enc.encode(buku) },
      { nama: 'xl/_rels/workbook.xml.rels', data: enc.encode(relsBuku) },
      { nama: 'xl/styles.xml', data: enc.encode(stylesXml()) }
    ];
    lembar.forEach(function (l, i) { berkas.push({ nama: 'xl/worksheets/sheet' + (i + 1) + '.xml', data: enc.encode(lembarXml(l)) }); });
    return Zip.buat(berkas);
  }

  return { buat: buat, huruf: huruf, esc: esc };
});
