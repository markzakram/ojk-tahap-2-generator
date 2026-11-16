/*
 * situs.js — tab "Tahap 1 | Tahap 2" di bilah atas bila generator ini dipasang di situs gabungan
 * Tahap 1 + Tahap 2 (repo Tahap 2, mis. di Vercel).
 *
 * Berdiri sendiri (index.html, cli/buka.js, Portal) OJK_SITUS bernilai null dan tab tidak tampil.
 * Situs gabungan menyalin folder ini saat build dan mengganti baris `var OJK_SITUS = null;` dengan
 * alamat kedua tahap, mis. { tahap1: '/tahap-1/index.html', tahap2: '/studio' }. Di dalam bingkai
 * (Portal memuat tiap tahap dalam iframe dengan tabnya sendiri) tab juga tidak tampil.
 */
var OJK_SITUS = null;

(function () {
  'use strict';
  var nav = document.getElementById('tab-tahap');
  if (!nav || !OJK_SITUS || !OJK_SITUS.tahap2) return;
  try { if (window.self !== window.top) return; } catch (e) { return; }
  [
    { href: OJK_SITUS.tahap1 || '#', judul: 'Tahap 1', sub: 'Tes Potensi Dasar', aktif: true },
    { href: OJK_SITUS.tahap2, judul: 'Tahap 2', sub: 'Tes Kemampuan Umum', aktif: false }
  ].forEach(function (t) {
    var a = document.createElement('a');
    a.href = t.href;
    a.className = 'tab-tahap-item' + (t.aktif ? ' aktif' : '');
    if (t.aktif) a.setAttribute('aria-current', 'page');
    var b = document.createElement('b');
    b.textContent = t.judul;
    var s = document.createElement('span');
    s.textContent = t.sub;
    a.appendChild(b);
    a.appendChild(s);
    nav.appendChild(a);
  });
  nav.hidden = false;
})();
