/*
 * rumus.js — baris persamaan pada pembahasan, ditulis sekali dan dicetak tiga cara.
 *
 * Pembahasan tetap berupa daftar baris teks. Baris yang diawali "§ " adalah PERSAMAAN dalam
 * notasi LaTeX sederhana; penulis Word mengubahnya menjadi Equation Word (OMML, dibaca SiAdu
 * sebagai MathML), PDF/Excel/JSON memakai teks Unicode, dan antarmuka memakai HTML.
 *
 *   § M = \frac{HJ}{1 + u} = \frac{25}{1{,}25} = 20
 *   § V = 1{,}25 \times 1{,}6 \times 0{,}5 = 1\ \text{m}^{3}
 *
 * Notasi yang dikenal:
 *   \frac{a}{b}  pecahan          x^{n}  pangkat          x_{n}  indeks bawah
 *   \text{...}   kata/satuan tegak (spasi dipertahankan)
 *   \times \div \cdot \pm \approx \le \ge \ne \to \%  \$  \{ \}  \,  \  (spasi)  \quad
 *   {,}          koma desimal tanpa spasi (gaya Indonesia: 1{,}25); koma biasa juga diterima
 *   huruf tunggal dicetak miring sebagai variabel; angka, tanda, dan \text tegak
 *
 * Baris judul bagian pembahasan matematika ("Diketahui", "Ditanyakan", "Pengerjaan",
 * "Kesimpulan") ditulis sebagai baris biasa; penulis mencetaknya tebal (lihat JUDUL_BAGIAN).
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Rumus = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var PENANDA = '§ ';
  var JUDUL_BAGIAN = ['Diketahui', 'Ditanyakan', 'Pengerjaan', 'Kesimpulan'];

  var SIMBOL = {
    times: '×', div: '÷', cdot: '·', pm: '±', approx: '≈', le: '≤', leq: '≤', ge: '≥', geq: '≥', ne: '≠', neq: '≠',
    to: '→', rightarrow: '→', '%': '%', '$': '$', '{': '{', '}': '}', ',': ' ', ' ': ' ', quad: ' ', ldots: '…'
  };

  /** Apakah baris pembahasan ini persamaan? */
  function adalah(baris) { return typeof baris === 'string' && baris.indexOf(PENANDA) === 0; }
  /** Notasi persamaan dari sebuah baris "§ ...". */
  function isi(baris) { return adalah(baris) ? baris.slice(PENANDA.length) : baris; }
  /** Bentuk baris persamaan dari notasinya. */
  function baris(notasi) { return PENANDA + notasi; }
  function judulBagian(t) { return JUDUL_BAGIAN.indexOf(String(t).trim()) >= 0; }

  // ---------------------------------------------------------------- pengurai

  /**
   * Urai notasi menjadi pohon: [{ t:'atom', v, gaya:'var'|'tegak' }, { t:'frac', a, b }, { t:'sup'|'sub', e, x }].
   * Melempar galat bila kurung kurawal tidak seimbang atau perintah tidak dikenal.
   */
  function urai(notasi) {
    var s = String(notasi), i = 0;
    function grup() {
      if (s.charAt(i) !== '{') throw new Error('rumus: diharapkan "{" pada posisi ' + i + ' dalam "' + s + '"');
      i++;
      var isi2 = deret('}');
      if (s.charAt(i) !== '}') throw new Error('rumus: "}" tidak ditemukan dalam "' + s + '"');
      i++;
      return isi2;
    }
    function teksGrup() {
      if (s.charAt(i) !== '{') throw new Error('rumus: \\text harus diikuti "{...}" dalam "' + s + '"');
      var dalam = 0, mulai = ++i;
      for (; i < s.length; i++) {
        if (s.charAt(i) === '{') dalam++;
        else if (s.charAt(i) === '}') { if (!dalam) break; dalam--; }
      }
      if (i >= s.length) throw new Error('rumus: \\text tidak ditutup dalam "' + s + '"');
      var t = s.slice(mulai, i);
      i++;
      return t;
    }
    function satuItem() {
      var c = s.charAt(i);
      if (c === '\\') {
        var m = /^\\([a-zA-Z]+|.)/.exec(s.slice(i));
        if (!m) throw new Error('rumus: "\\" tanpa perintah dalam "' + s + '"');
        i += m[0].length;
        var nama = m[1];
        if (nama === 'frac') { var a = grup(), b = grup(); return { t: 'frac', a: a, b: b }; }
        if (nama === 'text' || nama === 'mathrm') return { t: 'atom', v: teksGrup(), gaya: 'tegak' };
        if (SIMBOL[nama] === undefined) throw new Error('rumus: perintah \\' + nama + ' tidak dikenal dalam "' + s + '"');
        // spasi setelah perintah huruf hanya pemisah
        if (/^[a-zA-Z]+$/.test(nama)) while (s.charAt(i) === ' ') i++;
        return { t: 'atom', v: SIMBOL[nama], gaya: 'tegak' };
      }
      if (c === '{') {
        // "{,}" = koma desimal; grup lain hanya pengelompokan
        if (s.slice(i, i + 3) === '{,}') { i += 3; return { t: 'atom', v: ',', gaya: 'tegak' }; }
        return { t: 'grup', isi: grup() };
      }
      if (/[0-9.,]/.test(c)) {
        var m2 = /^[0-9][0-9.,]*|^[.,]/.exec(s.slice(i));
        // titik/koma di akhir angka adalah tanda baca, bukan bagian angka
        var v = m2[0].replace(/[.,]+$/, '') || m2[0];
        i += v.length;
        return { t: 'atom', v: v, gaya: 'tegak' };
      }
      if (/[a-zA-Z]/.test(c)) { i++; return { t: 'atom', v: c, gaya: 'var' }; }
      i++;
      if (c === '-') return { t: 'atom', v: '−', gaya: 'tegak' };
      return { t: 'atom', v: c, gaya: 'tegak' };
    }
    function deret(akhir) {
      var out = [];
      while (i < s.length && s.charAt(i) !== akhir) {
        if (s.charAt(i) === ' ') { i++; continue; }
        if (s.charAt(i) === '^' || s.charAt(i) === '_') {
          var jenis = s.charAt(i) === '^' ? 'sup' : 'sub';
          i++;
          if (i >= s.length) throw new Error('rumus: pangkat/indeks kosong di akhir "' + s + '"');
          var x = s.charAt(i) === '{' ? grup() : [satuItem()];
          var basis = out.pop();
          if (!basis) throw new Error('rumus: "' + (jenis === 'sup' ? '^' : '_') + '" tanpa basis dalam "' + s + '"');
          out.push({ t: jenis, e: [basis], x: x });
          continue;
        }
        out.push(satuItem());
      }
      return out;
    }
    var hasil = deret(null);
    if (i < s.length) throw new Error('rumus: "}" berlebih dalam "' + s + '"');
    return hasil;
  }

  // ---------------------------------------------------------------- teks Unicode

  var ATAS = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', n: 'ⁿ', '-': '⁻', '−': '⁻' };

  function teksPohon(xs, aman) {
    return xs.map(function (x) {
      if (x.t === 'atom') return x.v === ' ' ? ' ' : x.v;
      if (x.t === 'grup') return teksPohon(x.isi, aman);
      if (x.t === 'frac') {
        var a = teksPohon(x.a, aman), b = teksPohon(x.b, aman);
        var bungkus = function (t) { return /^[\w,.$%]+$/.test(t.replace(/\s/g, '')) ? t : '(' + t + ')'; };
        return bungkus(a) + '/' + bungkus(b);
      }
      var e = teksPohon(x.e, aman), p = teksPohon(x.x, aman);
      if (x.t === 'sub') return e + '_' + p;
      // pangkat: karakter atas Unicode bila tersedia (PDF hanya mengenal ² dan ³)
      var semua = p.split('').every(function (c) { return aman ? (c === '2' || c === '3') : ATAS[c] !== undefined; });
      return semua ? e + p.split('').map(function (c) { return ATAS[c]; }).join('') : e + '^' + (p.length > 1 ? '(' + p + ')' : p);
    }).join('');
  }

  /** Teks persamaan untuk PDF, Excel, JSON. `aman` = hanya pangkat ² dan ³ sebagai karakter atas (WinAnsi). */
  function teks(notasi, aman) {
    var t = teksPohon(urai(notasi), aman);
    // spasi rapi di sekitar tanda relasi dan operasi
    return t.replace(/\s*([=≈≤≥≠×÷→±<>])\s*/g, ' $1 ').replace(/\s*\+\s*/g, ' + ').replace(/(\S)\s*−\s*/g, '$1 − ')
      .replace(/([=≈≤≥≠×÷→±<>(]) − /g, '$1 −').replace(/^− /, '−').replace(/ {2,}/g, ' ').trim();
  }

  /** Baris pembahasan sebagai teks: persamaan diubah, baris lain apa adanya. */
  function barisTeks(b, aman) {
    if (!adalah(b)) return b;
    try { return teks(isi(b), aman); } catch (e) { return isi(b); }
  }

  // ---------------------------------------------------------------- HTML

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function htmlPohon(xs) {
    return xs.map(function (x) {
      if (x.t === 'atom') {
        if (x.gaya === 'var') return '<i>' + esc(x.v) + '</i>';
        return /[=≈≤≥≠×÷→+±−<>]/.test(x.v) && x.v.length === 1 ? '<span class="rm-op">' + esc(x.v) + '</span>' : esc(x.v);
      }
      if (x.t === 'grup') return htmlPohon(x.isi);
      if (x.t === 'frac') return '<span class="rm-frac"><span>' + htmlPohon(x.a) + '</span><span>' + htmlPohon(x.b) + '</span></span>';
      return htmlPohon(x.e) + (x.t === 'sup' ? '<sup>' : '<sub>') + htmlPohon(x.x) + (x.t === 'sup' ? '</sup>' : '</sub>');
    }).join('');
  }

  /** HTML persamaan (kelas rm-frac, rm-op; gaya di css/style.css). */
  function html(notasi) { return '<span class="rumus">' + htmlPohon(urai(notasi)) + '</span>'; }

  // ---------------------------------------------------------------- OMML (Equation Word)

  function escXml(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function ommlRun(v, gaya) {
    // variabel: miring (gaya bawaan matematika); angka, tanda, dan teks: tegak
    var rpr = gaya === 'var' ? '' : '<m:rPr><m:sty m:val="p"/></m:rPr>';
    return '<m:r>' + rpr + '<w:rPr><w:rFonts w:ascii="Cambria Math" w:hAnsi="Cambria Math"/></w:rPr><m:t xml:space="preserve">' + escXml(v) + '</m:t></m:r>';
  }

  function ommlPohon(xs) {
    var out = '', tegak = '';
    function lepas() { if (tegak) { out += ommlRun(tegak, 'tegak'); tegak = ''; } }
    xs.forEach(function (x) {
      if (x.t === 'atom' && x.gaya === 'tegak') {
        // tanda relasi/operasi diberi spasi agar terbaca seperti tulisan tangan; minus di awal atau
        // setelah tanda lain adalah tanda bilangan negatif, jadi tidak diberi spasi
        var unari = x.v === '−' && (!out && !tegak.trim() || /[=≈≤≥≠×÷→±<>(]\s*$/.test(tegak));
        tegak += !unari && /^[=≈≤≥≠×÷→±+−<>]$/.test(x.v) ? ' ' + x.v + ' ' : x.v;
        return;
      }
      lepas();
      if (x.t === 'atom') out += ommlRun(x.v, 'var');
      else if (x.t === 'grup') out += ommlPohon(x.isi);
      else if (x.t === 'frac') out += '<m:f><m:num>' + ommlPohon(x.a) + '</m:num><m:den>' + ommlPohon(x.b) + '</m:den></m:f>';
      else if (x.t === 'sup') out += '<m:sSup><m:e>' + ommlPohon(x.e) + '</m:e><m:sup>' + ommlPohon(x.x) + '</m:sup></m:sSup>';
      else out += '<m:sSub><m:e>' + ommlPohon(x.e) + '</m:e><m:sub>' + ommlPohon(x.x) + '</m:sub></m:sSub>';
    });
    lepas();
    return out;
  }

  /** Isi <m:oMath> untuk satu persamaan (tanpa paragraf pembungkus). */
  function omml(notasi) { return '<m:oMath>' + ommlPohon(urai(notasi)) + '</m:oMath>'; }

  /** Periksa notasi: null bila sah, pesan galat bila tidak. */
  function periksa(notasi) {
    try { urai(notasi); return null; } catch (e) { return e.message; }
  }

  return {
    PENANDA: PENANDA, JUDUL_BAGIAN: JUDUL_BAGIAN, adalah: adalah, isi: isi, baris: baris, judulBagian: judulBagian,
    urai: urai, teks: teks, barisTeks: barisTeks, html: html, omml: omml, periksa: periksa
  };
});
