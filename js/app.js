/*
 * app.js — perekat antarmuka: pengaturan paket, generate bertahap, pratinjau soal,
 * mode coba interaktif Penalaran Numerik, dan tombol unduh.
 *
 * Penyusunan butir dikerjakan `paket.js`, pemeriksaan oleh `validator.js`, pembuatan
 * berkas oleh `ekspor.js`, dan widget interaktif oleh `coba.js`. Berkas ini hanya
 * menghubungkan semuanya dengan tombol. Hasil hanya ditampilkan dan dapat diunduh
 * bila validator meluluskannya.
 */
(function () {
  'use strict';

  var SIMPAN = 'generator-ojk-tahap1-v1';
  var NAMA_DASAR = 'soal-ojk-tahap1';
  var BATAS_BERKAS_BERAT = 40;          // paket maksimal untuk Word/PDF/PNG di peramban
  var MIME = {
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    pdf: 'application/pdf',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    json: 'application/json',
    zip: 'application/zip',
    png: 'image/png',
    svg: 'image/svg+xml'
  };
  var NAMA_SUBTES = { ku: 'Kemampuan Umum', pn: 'Penalaran Numerik' };
  var HURUF = ['A', 'B', 'C', 'D', 'E'];

  var $ = function (id) { return document.getElementById(id); };
  var enc = new TextEncoder();

  var state = {
    subtes: 'semua',
    komposisi: { ku: {}, pn: {} },
    tingkat: 'campur',
    proporsi: { mudah: 3, sedang: 5, sulit: 2 },
    jumlah: 3,
    benih: null,
    hasil: null,
    validasi: null,
    paket: 1,
    tab: 'ku',
    sibuk: false
  };

  function el(tag, kelas, teks) {
    var e = document.createElement(tag);
    if (kelas) e.className = kelas;
    if (teks != null) e.textContent = teks;
    return e;
  }

  function tunggu(ms) { return new Promise(function (selesai) { setTimeout(selesai, ms || 0); }); }

  function angka(n) { return Fmt.angka(n); }

  // ---------------------------------------------------------------- simpanan

  function simpan() {
    try {
      localStorage.setItem(SIMPAN, JSON.stringify({
        subtes: state.subtes, komposisi: state.komposisi, tingkat: state.tingkat, proporsi: state.proporsi,
        jumlah: state.jumlah, benih: $('benih').value
      }));
    } catch (e) { /* mode penyamaran: abaikan */ }
  }

  function muat() {
    Object.keys(Bank.SUBTES).forEach(function (st) {
      state.komposisi[st] = Object.assign({}, Bank.SUBTES[st].komposisiBaku);
    });
    try {
      var d = JSON.parse(localStorage.getItem(SIMPAN) || '{}');
      if (['ku', 'pn', 'semua'].indexOf(d.subtes) >= 0) state.subtes = d.subtes;
      ['ku', 'pn'].forEach(function (st) {
        Bank.URUTAN[st].forEach(function (k) {
          var v = d.komposisi && d.komposisi[st] && d.komposisi[st][k];
          if (typeof v === 'number' && v >= 0 && v <= 60 && v % 1 === 0) state.komposisi[st][k] = v;
        });
      });
      if (['campur', 'mudah', 'sedang', 'sulit'].indexOf(d.tingkat) >= 0) state.tingkat = d.tingkat;
      ['mudah', 'sedang', 'sulit'].forEach(function (l) {
        if (d.proporsi && typeof d.proporsi[l] === 'number' && d.proporsi[l] >= 0) state.proporsi[l] = d.proporsi[l];
      });
      if (typeof d.jumlah === 'number' && d.jumlah >= 1 && d.jumlah <= 500) state.jumlah = d.jumlah;
      if (d.benih != null && d.benih !== '') $('benih').value = d.benih;
    } catch (e) { /* abaikan simpanan yang rusak */ }
  }

  // ---------------------------------------------------------------- pengaturan

  function subtesAktif() { return state.subtes === 'semua' ? ['ku', 'pn'] : [state.subtes]; }

  function bangunPemilihSubtes() {
    var w = $('pilih-subtes');
    w.innerHTML = '';
    [['ku', 'Kemampuan Umum'], ['pn', 'Penalaran Numerik'], ['semua', 'Keduanya']].forEach(function (x) {
      var b = el('button', 'ghost' + (state.subtes === x[0] ? ' active' : ''), x[1]);
      b.type = 'button';
      b.dataset.subtes = x[0];
      b.addEventListener('click', function () {
        state.subtes = x[0];
        bangunPemilihSubtes(); bangunKomposisi(); perbaruiPerintah(); simpan();
      });
      w.appendChild(b);
    });
    var info = subtesAktif().map(function (st) {
      return NAMA_SUBTES[st] + ': ' + (st === 'ku' ? 'pilihan ganda A-E (verbal, soal cerita, tabel, grafik, figural)' : 'soal interaktif (bar chart, tabel, line graph, pie chart)');
    });
    $('info-subtes').textContent = info.join('. ') + '.';
  }

  function jumlahSoal(st) {
    return Bank.URUTAN[st].reduce(function (s, k) { return s + (state.komposisi[st][k] || 0); }, 0);
  }

  function bangunKomposisi() {
    var w = $('komposisi');
    w.innerHTML = '';
    subtesAktif().forEach(function (st) {
      var info = Bank.SUBTES[st];
      var fs = el('fieldset', 'komposisi-grup');
      var lg = el('legend', null, info.nama);
      var total = el('span', 'total', jumlahSoal(st) + ' soal / ' + info.menit + ' menit');
      lg.appendChild(total);
      fs.appendChild(lg);
      Bank.URUTAN[st].forEach(function (k) {
        var baris = el('label', 'komposisi-baris');
        baris.appendChild(el('span', null, Bank.ambil(st, k).label));
        var inp = el('input');
        inp.type = 'number'; inp.min = 0; inp.max = 60; inp.step = 1;
        inp.value = state.komposisi[st][k];
        inp.id = 'k-' + st + '-' + k;
        inp.addEventListener('change', function () {
          var v = Math.round(Number(inp.value));
          if (!isFinite(v) || v < 0) v = 0;
          if (v > 60) v = 60;
          inp.value = v;
          state.komposisi[st][k] = v;
          total.textContent = jumlahSoal(st) + ' soal / ' + info.menit + ' menit';
          perbaruiPerintah(); simpan();
        });
        baris.appendChild(inp);
        fs.appendChild(baris);
      });
      w.appendChild(fs);
    });
  }

  function perbaruiTingkat() {
    $('tingkat').value = state.tingkat;
    $('baris-proporsi').hidden = state.tingkat !== 'campur';
    $('pr-mudah').value = state.proporsi.mudah;
    $('pr-sedang').value = state.proporsi.sedang;
    $('pr-sulit').value = state.proporsi.sulit;
  }

  function komposisiBaku() {
    Object.keys(Bank.SUBTES).forEach(function (st) { state.komposisi[st] = Object.assign({}, Bank.SUBTES[st].komposisiBaku); });
    bangunKomposisi(); perbaruiPerintah(); simpan();
  }

  /** Baca dan periksa isian; melempar Error berpesan jelas. */
  function bacaPengaturan() {
    var jumlah = Number($('jumlah').value);
    if (!isFinite(jumlah) || jumlah % 1 !== 0 || jumlah < 1 || jumlah > 500) throw new Error('jumlah paket harus bilangan bulat 1 sampai 500');
    var teksBenih = $('benih').value.trim(), benih;
    if (teksBenih === '') benih = Math.floor(Math.random() * 4294967296);
    else {
      benih = Number(teksBenih);
      if (!isFinite(benih) || benih % 1 !== 0 || benih < 0 || benih > 4294967295) throw new Error('benih harus bilangan bulat 0 sampai 4294967295');
    }
    var proporsi = {
      mudah: Number($('pr-mudah').value), sedang: Number($('pr-sedang').value), sulit: Number($('pr-sulit').value)
    };
    Object.keys(proporsi).forEach(function (l) { if (!isFinite(proporsi[l]) || proporsi[l] < 0) throw new Error('proporsi tingkat ' + l + ' tidak sah'); });
    if (state.tingkat === 'campur' && proporsi.mudah + proporsi.sedang + proporsi.sulit <= 0) throw new Error('proporsi tingkat tidak boleh nol semua');
    return { benih: benih, jumlahPaket: jumlah, subtes: state.subtes, tingkat: state.tingkat, proporsi: proporsi, komposisi: state.komposisi };
  }

  function perintahCli() {
    var a = ['node cli/generate.js'];
    var j = Number($('jumlah').value);
    a.push('--paket ' + (isFinite(j) && j >= 1 ? Math.round(j) : 1));
    a.push('--subtes ' + state.subtes);
    var b = $('benih').value.trim();
    if (b !== '' && /^\d+$/.test(b)) a.push('--benih ' + b);
    a.push('--format docx,pdf,xlsx,json');
    if (state.tingkat !== 'campur') a.push('--tingkat ' + state.tingkat);
    else {
      var p = state.proporsi;
      if (p.mudah !== 3 || p.sedang !== 5 || p.sulit !== 2) a.push('--proporsi ' + p.mudah + ':' + p.sedang + ':' + p.sulit);
    }
    subtesAktif().forEach(function (st) {
      var beda = Bank.URUTAN[st].filter(function (k) { return state.komposisi[st][k] !== Bank.SUBTES[st].komposisiBaku[k]; });
      if (beda.length) a.push('--komposisi-' + st + ' ' + Bank.URUTAN[st].map(function (k) { return k + '=' + state.komposisi[st][k]; }).join(','));
    });
    return a.join(' ');
  }

  function perbaruiPerintah() { $('perintah-cli').value = perintahCli(); }

  // ---------------------------------------------------------------- status

  function setStatus(id, teks, jenis) {
    var e = $(id);
    e.textContent = teks || '';
    e.className = 'status-line' + (jenis ? ' ' + jenis : '');
  }

  function setKemajuan(id, nilai, maks) {
    var p = $(id);
    if (nilai == null) { p.hidden = true; return; }
    p.hidden = false; p.max = maks; p.value = nilai;
  }

  function setSibuk(ya) {
    state.sibuk = ya;
    $('btn-generate').disabled = ya;
    ['btn-docx', 'btn-pdf', 'btn-xlsx', 'btn-json', 'btn-zip'].forEach(function (id) { $(id).disabled = ya || !state.hasil; });
  }

  // ---------------------------------------------------------------- generate

  async function generate() {
    if (state.sibuk) return;
    var opsi;
    try { opsi = bacaPengaturan(); } catch (e) { setStatus('status', e.message, 'error'); return; }
    if ($('benih').value.trim() === '') $('benih').value = opsi.benih;      // supaya hasil ini bisa diulang
    simpan(); perbaruiPerintah();
    setSibuk(true);
    state.hasil = null; state.validasi = null;
    tampilkanKosong(true);
    setStatus('status', 'Membuat paket ...');
    var mulai = Date.now();
    try {
      var pembangun = Paket.mulai(opsi);
      setKemajuan('kemajuan', 0, opsi.jumlahPaket);
      var irisan = Date.now();
      while (pembangun.berikut()) {
        setKemajuan('kemajuan', pembangun.selesai(), opsi.jumlahPaket);
        if (Date.now() - irisan > 40) { setStatus('status', 'Membuat paket ' + pembangun.selesai() + ' dari ' + opsi.jumlahPaket + ' ...'); await tunggu(0); irisan = Date.now(); }
      }
      var hasil = pembangun.hasil();
      setStatus('status', 'Memeriksa dengan validator (hitung ulang dari nol) ...');
      setKemajuan('kemajuan', 0, 1000);
      await tunggu(20);
      // dipotong-potong supaya layar tetap hidup walau ratusan paket (butir 50%, sidik 10%, pencarian kembar 40%)
      var validasi = await Validator.periksaHasilAsinkron(hasil, {
        saatKemajuan: function (k) {
          var bagian = k.fase === 'butir' ? 0.5 * k.selesai / k.total : (k.fase === 'sidik' ? 0.5 + 0.1 * k.selesai / k.total : 0.6 + 0.4 * k.selesai / Math.max(1, k.total));
          setKemajuan('kemajuan', Math.round(bagian * 1000), 1000);
          setStatus('status', 'Memeriksa dengan validator: ' + Math.round(bagian * 100) + '% ...');
        }
      });
      setKemajuan('kemajuan', null);
      if (!validasi.lulus) {
        var contoh = validasi.gagal.slice(0, 3).map(function (g) { return g.id + ': ' + (g.masalah || []).slice(0, 1).join('; '); });
        throw new Error('validator menolak hasil (' + validasi.gagal.length + ' butir gagal, ' + validasi.kembar.length + ' kembar)' + (contoh.length ? ': ' + contoh.join(' | ') : '') + '. Tidak ada paket yang ditampilkan.');
      }
      state.hasil = hasil; state.validasi = validasi; state.paket = 1;
      state.tab = hasil.meta.subtes[0];
      setStatus('status', hasil.paket.length + ' paket, ' + validasi.butir + ' butir, lulus validator (' + ((Date.now() - mulai) / 1000).toFixed(1).replace('.', ',') + ' dtk).', 'ok');
    } catch (e) {
      setKemajuan('kemajuan', null);
      setStatus('status', 'Gagal: ' + e.message, 'error');
      state.hasil = null;
    }
    setSibuk(false);
    if (state.hasil) { tampilkanRingkasan(); bangunPemilihPaket(); tampilkanPaket(); }
    else { tampilkanKosong(true); $('ringkasan').innerHTML = '<p class="hint">Belum ada hasil.</p>'; }
  }

  // ---------------------------------------------------------------- ringkasan

  function tampilkanRingkasan() {
    var h = state.hasil, v = state.validasi, w = $('ringkasan');
    w.innerHTML = '';
    var lencana = el('div', 'lencana ok', 'Lulus validator');
    w.appendChild(lencana);
    var dl = el('dl', 'ukur');
    function baris(k, nilai) { dl.appendChild(el('dt', null, k)); dl.appendChild(el('dd', null, nilai)); }
    baris('Paket', String(h.paket.length));
    baris('Butir', v.butirLulus + ' dari ' + v.butir + ' lulus');
    baris('Butir kembar', String(v.kembar.length));
    baris('Benih', String(h.meta.benih));
    var lv = v.sebaran.level;
    baris('Tingkat', 'mudah ' + (lv.mudah || 0) + ' · sedang ' + (lv.sedang || 0) + ' · sulit ' + (lv.sulit || 0));
    var kk = v.sebaran.kunci, tk = HURUF.map(function (x) { return x + ' ' + (kk[x] || 0); });
    if (Object.keys(kk).length) baris('Kunci A-E', tk.join(' · '));
    w.appendChild(dl);

    var tab = el('table', 'tabel-mini');
    var kepala = el('tr');
    ['Submateri', 'Mudah', 'Sedang', 'Sulit', 'Jumlah'].forEach(function (t) { kepala.appendChild(el('th', null, t)); });
    tab.appendChild(kepala);
    Object.keys(v.sebaran.submateriLevel).sort().forEach(function (k) {
      var per = v.sebaran.submateriLevel[k], tr = el('tr');
      var parts = k.split('/');
      tr.appendChild(el('td', null, (parts[0] === 'ku' ? 'KU' : 'PN') + ' · ' + labelSubmateri(parts[1])));
      var jml = 0;
      ['mudah', 'sedang', 'sulit'].forEach(function (l) { var n = per[l] || 0; jml += n; tr.appendChild(el('td', 'ang', String(n))); });
      tr.appendChild(el('td', 'ang', String(jml)));
      tab.appendChild(tr);
    });
    w.appendChild(tab);
  }

  function labelSubmateri(k) {
    return { verbal: 'Verbal', cerita: 'Soal cerita', tabel: 'Tabel', grafik: 'Grafik', figural: 'Figural', bar: 'Bar chart', garis: 'Line graph', pie: 'Pie chart' }[k] || k;
  }

  // ---------------------------------------------------------------- pratinjau

  function tampilkanKosong(ya) {
    $('kosong').hidden = !ya;
    $('lihat').hidden = ya;
  }

  function paketAktif() { return state.hasil.paket[state.paket - 1]; }

  function bangunPemilihPaket() {
    var s = $('pilih-paket');
    s.innerHTML = '';
    state.hasil.paket.forEach(function (p) {
      var o = el('option', null, p.id + ' · ' + p.subtes.reduce(function (t, st) { return t + st.jumlah; }, 0) + ' soal');
      o.value = p.no;
      s.appendChild(o);
    });
  }

  function bangunTabSubtes(p) {
    var w = $('tab-subtes');
    w.innerHTML = '';
    p.subtes.forEach(function (st) {
      var b = el('button', 'ghost' + (state.tab === st.kode ? ' active' : ''), st.nama + ' (' + st.jumlah + ')');
      b.type = 'button';
      b.addEventListener('click', function () { state.tab = st.kode; tampilkanPaket(); });
      w.appendChild(b);
    });
  }

  function infoPaket(p, st) {
    var lv = { mudah: 0, sedang: 0, sulit: 0 }, kn = {};
    st.butir.forEach(function (b) { lv[b.level]++; if (b.jenis === 'pg') { var h = HURUF[b.kunci]; kn[h] = (kn[h] || 0) + 1; } });
    var t = p.id + ' · ' + st.nama + ' · ' + st.jumlah + ' soal · ' + st.menit + ' menit · mudah ' + lv.mudah + ', sedang ' + lv.sedang + ', sulit ' + lv.sulit;
    if (Object.keys(kn).length) t += ' · kunci ' + HURUF.map(function (x) { return x + ' ' + (kn[x] || 0); }).join(' ');
    return t;
  }

  function tampilkanPaket() {
    tampilkanKosong(false);
    var p = paketAktif();
    if (!p.subtes.some(function (s) { return s.kode === state.tab; })) state.tab = p.subtes[0].kode;
    var st = p.subtes.filter(function (s) { return s.kode === state.tab; })[0];
    $('pilih-paket').value = p.no;
    $('btn-sebelum').disabled = state.paket <= 1;
    $('btn-sesudah').disabled = state.paket >= state.hasil.paket.length;
    bangunTabSubtes(p);
    $('info-paket').textContent = infoPaket(p, st);
    var daftar = $('daftar-soal');
    daftar.innerHTML = '';
    st.butir.forEach(function (b) { daftar.appendChild(kartu(p, b)); });
    daftar.scrollTop = 0;
    daftar.classList.toggle('tampil-kunci', $('tampil-kunci').checked);
  }

  // ------------------------------------------------------------- kartu soal

  function isiTeks(induk, daftar) {
    var ul = null;
    (daftar || []).forEach(function (t) {
      if (/^• /.test(t)) {
        if (!ul) { ul = el('ul', 'poin'); induk.appendChild(ul); }
        ul.appendChild(el('li', null, t.slice(2)));
      } else {
        ul = null;
        induk.appendChild(el('p', null, t));
      }
    });
  }

  function namaGambar(p, b, d) { return Ekspor.namaGambar(p, b, d).split('/').pop(); }

  function gambarEl(desc, p, b, tanpaAksi) {
    var f = el('figure', 'gambar');
    var w = el('div', 'gambar-svg');
    var g = Gambar.svg(desc);
    w.innerHTML = g.svg;
    f.appendChild(w);
    if (!tanpaAksi) {
      var aksi = el('div', 'gambar-aksi');
      [['PNG', 'png'], ['SVG', 'svg']].forEach(function (x) {
        var t = el('button', 'mini', x[0]);
        t.type = 'button';
        t.title = 'Unduh gambar sebagai ' + x[0];
        t.addEventListener('click', function () { unduhGambar(desc, namaGambar(p, b, desc).replace(/\.png$/, '.' + x[1]), x[1], t); });
        aksi.appendChild(t);
      });
      f.appendChild(aksi);
    }
    return f;
  }

  function kartu(p, b) {
    var k = el('article', 'soal');
    k.id = 'soal-' + b.id;

    var kepala = el('div', 'soal-kepala');
    kepala.appendChild(el('b', null, 'Soal ' + b.no));
    kepala.appendChild(el('span', 'chip', b.submateriLabel || b.submateri));
    kepala.appendChild(el('span', 'chip tingkat-' + b.level, b.tingkatNama || b.level));
    kepala.appendChild(el('span', 'chip kunci-chip', 'Kunci: ' + (b.jenis === 'pg' ? HURUF[b.kunci] : 'lihat pembahasan')));
    kepala.appendChild(el('span', 'chip id', b.id));
    k.appendChild(kepala);

    var badan = el('div', 'soal-badan');
    k.appendChild(badan);
    var gambar = b.stimulus.gambar || [];

    if (b.submateri === 'verbal') {
      isiTeks(badan, b.stimulus.teks);
      var pern = el('p', 'pernyataan');
      pern.appendChild(el('b', null, 'Pernyataan: '));
      pern.appendChild(document.createTextNode(b.pertanyaan));
      badan.appendChild(pern);
      badan.appendChild(el('p', 'petunjuk', 'Berdasarkan bacaan di atas, apakah pernyataan tersebut Benar, Salah, atau Tidak Diketahui?'));
    } else if (b.jenis === 'isian') {
      if (b.stimulus.judul) badan.appendChild(el('h4', null, b.stimulus.judul));
      isiTeks(badan, b.stimulus.teks);
      badan.appendChild(el('p', 'pertanyaan', b.pertanyaan));
      if (b.perintah) badan.appendChild(el('p', 'petunjuk', b.perintah));
    } else if (b.submateri === 'figural') {
      if (b.perintah) badan.appendChild(el('p', 'petunjuk', b.perintah));
    } else {
      if (b.stimulus.judul && !gambar.length) badan.appendChild(el('h4', null, b.stimulus.judul));
      isiTeks(badan, b.stimulus.teks);
    }

    // gambar stimulus (butir interaktif: tampilan awal, bisa diganti widget)
    var wadahGambar = el('div', 'gambar-daftar' + (b.jenis === 'isian' && b.isian.jenis === 'tabel' ? ' dua-kolom' : ''));
    gambar.forEach(function (d) { wadahGambar.appendChild(gambarEl(d, p, b)); });
    badan.appendChild(wadahGambar);

    if (b.jenis === 'pg') {
      if (b.submateri !== 'verbal' && b.pertanyaan) badan.appendChild(el('p', 'pertanyaan', b.pertanyaan));
      badan.appendChild(opsiEl(p, b, k));
    } else {
      var bentuk = el('p', 'petunjuk', Dokumen.bentukIsian(b));
      badan.appendChild(bentuk);
      var wadahCoba = el('div', 'wadah-coba');
      wadahCoba.hidden = true;
      var tombol = el('button', 'primary coba-buka', 'Coba interaktif');
      tombol.type = 'button';
      var terpasang = false;
      tombol.addEventListener('click', function () {
        var buka = wadahCoba.hidden;
        wadahCoba.hidden = !buka;
        wadahGambar.hidden = buka;
        bentuk.hidden = buka;
        tombol.textContent = buka ? 'Tutup mode coba' : 'Coba interaktif';
        if (buka && !terpasang) { Coba.pasang(wadahCoba, b); terpasang = true; }
      });
      badan.appendChild(tombol);
      badan.appendChild(wadahCoba);
    }

    // kunci dan pembahasan
    var kunci = el('div', 'kunci-blok');
    var jawab = el('p', 'jawaban');
    jawab.appendChild(el('b', null, 'Jawaban: '));
    jawab.appendChild(document.createTextNode(b.jenis === 'pg' ? HURUF[b.kunci] + (b.opsi[b.kunci].gambar ? '' : ' (' + b.opsi[b.kunci].teks + ')') : b.kunciTeks));
    kunci.appendChild(jawab);
    (b.gambarPembahasan || []).forEach(function (d) { var wg = el('div', 'gambar-daftar'); wg.appendChild(gambarEl(d, p, b)); kunci.appendChild(wg); });
    var bahas = el('div', 'pembahasan');
    isiTeks(bahas, Dokumen.pembahasanBadan(b));
    kunci.appendChild(bahas);
    k.appendChild(kunci);
    return k;
  }

  function opsiEl(p, b, kartuEl) {
    var w = el('div', 'opsi-daftar' + (b.opsi[0].gambar ? ' bergambar' : ''));
    var tombol = [];
    b.opsi.forEach(function (o, i) {
      var t = el('button', 'opsi');
      t.type = 'button';
      t.appendChild(el('span', 'huruf', HURUF[i]));
      if (o.gambar) {
        var wg = el('span', 'opsi-gambar');
        wg.innerHTML = Gambar.svg(o.gambar).svg;
        t.appendChild(wg);
      } else {
        t.appendChild(el('span', 'opsi-teks', o.teks));
      }
      t.addEventListener('click', function () {
        if (kartuEl.dataset.terjawab) return;
        kartuEl.dataset.terjawab = '1';
        kartuEl.classList.add('terbuka');
        tombol.forEach(function (x, q) { if (q === b.kunci) x.classList.add('benar'); });
        if (i !== b.kunci) t.classList.add('salah');
        umpan.textContent = i === b.kunci ? 'Benar.' : 'Kurang tepat. Jawaban yang benar: ' + HURUF[b.kunci] + '.';
        umpan.className = 'umpan ' + (i === b.kunci ? 'ok' : 'bad');
      });
      if (i === b.kunci) t.classList.add('kunci-benar');
      tombol.push(t);
      w.appendChild(t);
    });
    var umpan = el('p', 'umpan');
    var luar = el('div', 'opsi-luar');
    luar.appendChild(w);
    luar.appendChild(umpan);
    return luar;
  }

  // ---------------------------------------------------------------- unduh

  function unduh(nama, data, jenis) {
    var blob = data instanceof Blob ? data : new Blob([data], { type: MIME[jenis] || 'application/octet-stream' });
    Raster.unduhBlob(blob, nama);
  }

  async function unduhGambar(desc, nama, jenis, tombol) {
    try {
      if (jenis === 'svg') { unduh(nama, Gambar.svg(desc).svg, 'svg'); return; }
      if (tombol) tombol.disabled = true;
      var im = await Ekspor.rasterGambar(desc, 2);
      unduh(nama, im.png, 'png');
    } catch (e) {
      setStatus('status-unduh', 'Gagal membuat gambar: ' + e.message, 'error');
    } finally { if (tombol) tombol.disabled = false; }
  }

  async function unduhDokumen(jenis) {
    if (state.sibuk || !state.hasil) return;
    setSibuk(true);
    var p = paketAktif();
    try {
      setStatus('status-unduh', 'Menyiapkan gambar ' + p.id + ' ...');
      var berkas = await Ekspor.berkasPaket(p, {
        docx: jenis === 'docx', pdf: jenis === 'pdf', gambar: false, skala: 2, benih: state.hasil.meta.benih,
        kemajuan: function (s, t) { setKemajuan('kemajuan-unduh', s, t); }
      });
      var f = berkas.filter(function (x) { return x.jenis === jenis; })[0];
      unduh(f.nama.split('/').pop(), f.data, jenis);
      setStatus('status-unduh', f.nama.split('/').pop() + ' diunduh.', 'ok');
    } catch (e) {
      setStatus('status-unduh', 'Gagal: ' + e.message, 'error');
    }
    setKemajuan('kemajuan-unduh', null);
    setSibuk(false);
  }

  async function unduhData(jenis) {
    if (state.sibuk || !state.hasil) return;
    setSibuk(true);
    try {
      setStatus('status-unduh', 'Menyusun ' + jenis.toUpperCase() + ' ...');
      await tunggu(10);
      if (jenis === 'xlsx') unduh(NAMA_DASAR + '.xlsx', await Ekspor.xlsx(state.hasil), 'xlsx');
      else unduh(NAMA_DASAR + '.json', Ekspor.json(state.hasil, {}, state.validasi), 'json');
      setStatus('status-unduh', NAMA_DASAR + '.' + jenis + ' diunduh.', 'ok');
    } catch (e) {
      setStatus('status-unduh', 'Gagal: ' + e.message, 'error');
    }
    setSibuk(false);
  }

  async function unduhZip() {
    if (state.sibuk || !state.hasil) return;
    var pilih = {};
    ['docx', 'pdf', 'xlsx', 'json', 'png'].forEach(function (x) { pilih[x] = $('z-' + x).checked; });
    if (!Object.keys(pilih).some(function (x) { return pilih[x]; })) { setStatus('status-unduh', 'Centang sedikitnya satu isi ZIP.', 'error'); return; }
    var jml = state.hasil.paket.length;
    if ((pilih.docx || pilih.pdf || pilih.png) && jml > BATAS_BERKAS_BERAT) {
      setStatus('status-unduh', 'Word, PDF, dan gambar untuk ' + jml + ' paket terlalu berat untuk peramban (batas ' + BATAS_BERKAS_BERAT + ' paket). Pakai CLI (lihat perintah di bawah), atau ZIP hanya Excel dan JSON.', 'error');
      return;
    }
    setSibuk(true);
    try {
      var bagian = [], z = Zip.penulis(function (u8) { bagian.push(u8); });
      if (pilih.xlsx) { setStatus('status-unduh', 'Menyusun Excel ...'); await z.tambah(NAMA_DASAR + '.xlsx', await Ekspor.xlsx(state.hasil), false); }
      if (pilih.json) { setStatus('status-unduh', 'Menyusun JSON ...'); await z.tambah(NAMA_DASAR + '.json', enc.encode(Ekspor.json(state.hasil, {}, state.validasi)), true); }
      if (pilih.docx || pilih.pdf || pilih.png) {
        for (var i = 0; i < jml; i++) {
          var p = state.hasil.paket[i];
          setStatus('status-unduh', 'Paket ' + (i + 1) + ' dari ' + jml + ' (gambar, Word, PDF) ...');
          setKemajuan('kemajuan-unduh', i, jml);
          await tunggu(0);
          var berkas = await Ekspor.berkasPaket(p, { docx: pilih.docx, pdf: pilih.pdf, gambar: pilih.png, skala: 2, benih: state.hasil.meta.benih });
          for (var q = 0; q < berkas.length; q++) await z.tambah(berkas[q].nama, berkas[q].data, false);
        }
      }
      await z.tambah('ringkasan.txt', enc.encode(Ekspor.ringkasan(state.hasil, state.validasi).concat(['', 'Benih: ' + state.hasil.meta.benih, 'Perintah CLI setara: ' + perintahCli()]).join('\n')), true);
      await z.selesai();
      var blob = new Blob(bagian, { type: MIME.zip });
      unduh(NAMA_DASAR + '.zip', blob, 'zip');
      setStatus('status-unduh', NAMA_DASAR + '.zip diunduh (' + (blob.size / 1048576).toFixed(1).replace('.', ',') + ' MB).', 'ok');
    } catch (e) {
      setStatus('status-unduh', 'Gagal: ' + e.message, 'error');
    }
    setKemajuan('kemajuan-unduh', null);
    setSibuk(false);
  }

  // ---------------------------------------------------------------- awal

  function pasangPeristiwa() {
    $('btn-help').addEventListener('click', function () { $('help').hidden = !$('help').hidden; });
    $('btn-baku').addEventListener('click', komposisiBaku);
    $('tingkat').addEventListener('change', function () { state.tingkat = $('tingkat').value; perbaruiTingkat(); perbaruiPerintah(); simpan(); });
    ['mudah', 'sedang', 'sulit'].forEach(function (l) {
      $('pr-' + l).addEventListener('change', function () { state.proporsi[l] = Math.max(0, Number($('pr-' + l).value) || 0); perbaruiPerintah(); simpan(); });
    });
    $('jumlah').addEventListener('change', function () { state.jumlah = Number($('jumlah').value); perbaruiPerintah(); simpan(); });
    $('benih').addEventListener('change', function () { perbaruiPerintah(); simpan(); });
    $('btn-acak').addEventListener('click', function () { $('benih').value = Math.floor(Math.random() * 4294967296); perbaruiPerintah(); simpan(); });
    $('btn-generate').addEventListener('click', generate);
    $('pilih-paket').addEventListener('change', function () { state.paket = Number($('pilih-paket').value); tampilkanPaket(); });
    $('btn-sebelum').addEventListener('click', function () { if (state.paket > 1) { state.paket--; tampilkanPaket(); } });
    $('btn-sesudah').addEventListener('click', function () { if (state.paket < state.hasil.paket.length) { state.paket++; tampilkanPaket(); } });
    $('tampil-kunci').addEventListener('change', function () { $('daftar-soal').classList.toggle('tampil-kunci', $('tampil-kunci').checked); });
    $('btn-docx').addEventListener('click', function () { unduhDokumen('docx'); });
    $('btn-pdf').addEventListener('click', function () { unduhDokumen('pdf'); });
    $('btn-xlsx').addEventListener('click', function () { unduhData('xlsx'); });
    $('btn-json').addEventListener('click', function () { unduhData('json'); });
    $('btn-zip').addEventListener('click', unduhZip);
  }

  function awal() {
    muat();
    $('jumlah').value = state.jumlah;
    perbaruiTingkat();
    bangunPemilihSubtes();
    bangunKomposisi();
    perbaruiPerintah();
    pasangPeristiwa();
    tampilkanKosong(true);
  }

  // dibuka untuk uji peramban otomatis
  window.AppOjk = { state: state, generate: generate, tampilkanPaket: tampilkanPaket };

  awal();
})();
