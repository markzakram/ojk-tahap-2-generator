/*
 * verbal.js — Kemampuan Umum > Verbal (Verbal Reasoning).
 *
 * Bacaan pendek diikuti SATU pernyataan; peserta memilih Benar, Salah, atau
 * Tidak Diketahui. Bacaannya tidak ditulis bebas melainkan DIRAKIT dari FAKTA
 * terstruktur, dan kebenaran pernyataan diturunkan dari fakta itu:
 *
 *   nilai    sebuah entitas punya nilai tertentu pada sebuah atribut
 *   lebih    sebuah entitas lebih tinggi daripada yang lain (tanpa angka)
 *   sifat    sebuah entitas memiliki/tidak memiliki ciri tertentu
 *   daftar   daftar anggota, lengkap ("hanya") atau terbuka ("antara lain")
 *   tahun    tahun sebuah peristiwa
 *   perlu    syarat perlu ("hanya diberikan kepada ... sekurang-kurangnya X")
 *
 * Pernyataan dibuat menurut jenisnya (nilai, banding, jumlah, sifat, daftar,
 * tahun, perlu) dengan jawaban yang dituju — Benar, Salah, atau Tidak Diketahui —
 * lalu fakta pendukung dan fakta pengecoh (tentang atribut lain) ditambahkan.
 * Fakta pengecoh tidak pernah menyentuh atribut yang dipakai pernyataan, jadi
 * "tidak diketahui" memang benar-benar tidak tertulis di bacaan.
 *
 * Penyusun TIDAK menurunkan kebenaran dari bacaan; ia membangunnya. Yang menurunkan
 * kebenaran dari fakta adalah validator (`Validator.turunkanVerbal`).
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./rng.js'), require('./format.js'), require('./kamus.js'), require('./butir.js'));
    module.exports = api;
  } else {
    api = factory(root.Rng, root.Fmt, root.Kamus, root.Butir);
    root.Verbal = api;
  }
})(typeof self !== 'undefined' ? self : this, function (Rng, Fmt, Kamus, Butir) {
  'use strict';

  var OPSI = ['Benar', 'Salah', 'Tidak Diketahui'];
  var HURUF_TRUTH = ['B', 'S', 'TD'];

  // ----------------------------------------------------------------- topik

  var TOPIK = [
    {
      id: 'perbankan', judul: 'Perbankan Digital',
      intro: ['Layanan perbankan digital berkembang pesat dalam satu dekade terakhir.', 'Perbankan digital kini menjadi bagian penting dari kehidupan sehari-hari masyarakat.'],
      outro: ['Pengawasan terhadap layanan ini terus diperkuat oleh regulator.', 'Para pelaku industri masih terus berinovasi.'],
      ent: ['Bank Nusantara', 'Bank Harapan', 'Bank Sentosa', 'Bank Mandala', 'Bank Cakrawala', 'Bank Pelita', 'Bank Sejahtera'],
      atr: [
        { id: 'nasabah', bentuk: 'hitung', kerja: 'melayani', objek: 'nasabah', sat: 'juta', kompar: ['lebih banyak', 'lebih sedikit'], min: 2, maks: 40, langkah: 1 },
        { id: 'kantor', bentuk: 'hitung', kerja: 'memiliki', objek: 'kantor cabang', sat: '', kompar: ['lebih banyak', 'lebih sedikit'], min: 40, maks: 900, langkah: 10 },
        { id: 'laba', bentuk: 'nilai', kerja: 'mencatat', objek: 'laba', sat: 'triliun rupiah', kompar: ['lebih besar', 'lebih kecil'], min: 1, maks: 30, langkah: 1 }
      ],
      sifat: [
        { id: 'rekening', frasa: 'menyediakan pembukaan rekening secara daring', alt: 'memungkinkan nasabah membuka rekening melalui internet' },
        { id: 'biometrik', frasa: 'menerapkan autentikasi biometrik pada aplikasinya', alt: 'menggunakan autentikasi berbasis biometrik pada aplikasinya' },
        { id: 'tagihan', frasa: 'menyediakan pembayaran tagihan melalui aplikasi', alt: 'memungkinkan nasabah membayar tagihan lewat aplikasi' }
      ],
      daftar: [{ id: 'layanan', kerja: 'menawarkan', objek: 'layanan', pool: ['tabungan', 'deposito', 'kredit usaha', 'kredit pemilikan rumah', 'pembayaran tagihan', 'asuransi mikro', 'transfer antarbank', 'investasi reksa dana'] }],
      tahun: { id: 'aplikasi', frasa: 'meluncurkan aplikasi seluler', min: 2011, maks: 2022 },
      perlu: { akhirBenda: 'kredit usaha', kal: 'Kredit usaha hanya diberikan kepada debitur dengan skor kredit sekurang-kurangnya {t}.', nilai: '{E} memiliki skor kredit {v}.', pasti: '{E} pasti memperoleh kredit usaha.', tidak: '{E} tidak dapat memperoleh kredit usaha.', min: 550, maks: 700, langkah: 25, orang: true }
    },
    {
      id: 'asuransi', judul: 'Industri Asuransi',
      intro: ['Industri asuransi berperan melindungi masyarakat dari berbagai risiko keuangan.', 'Kesadaran masyarakat terhadap perlindungan asuransi meningkat dalam beberapa tahun terakhir.'],
      outro: ['Perusahaan asuransi diwajibkan menjaga tingkat kesehatan keuangannya.', 'Edukasi kepada calon peserta tetap menjadi tantangan.'],
      ent: ['Asuransi Cahaya', 'Asuransi Bahari', 'Asuransi Permata', 'Asuransi Lestari', 'Asuransi Tangguh', 'Asuransi Sinar', 'Asuransi Mutiara'],
      atr: [
        { id: 'peserta', bentuk: 'hitung', kerja: 'mencatat', objek: 'peserta', sat: 'juta', kompar: ['lebih banyak', 'lebih sedikit'], min: 1, maks: 20, langkah: 1 },
        { id: 'agen', bentuk: 'hitung', kerja: 'bekerja sama dengan', objek: 'agen pemasaran', sat: 'ribu', kompar: ['lebih banyak', 'lebih sedikit'], min: 2, maks: 60, langkah: 2 },
        { id: 'premi', bentuk: 'nilai', kerja: 'mengumpulkan', objek: 'premi', sat: 'triliun rupiah', kompar: ['lebih besar', 'lebih kecil'], min: 2, maks: 50, langkah: 1 }
      ],
      sifat: [
        { id: 'daring', frasa: 'memungkinkan pembelian polis secara daring', alt: 'melayani pembelian polis melalui internet' },
        { id: 'mikro', frasa: 'memiliki produk asuransi mikro untuk pelaku usaha kecil', alt: 'menyediakan produk asuransi mikro bagi pelaku usaha kecil' },
        { id: 'darurat', frasa: 'menyediakan layanan klaim darurat sepanjang hari', alt: 'melayani pengajuan klaim darurat selama 24 jam' }
      ],
      daftar: [{ id: 'produk', kerja: 'memasarkan', objek: 'produk', pool: ['asuransi jiwa', 'asuransi kesehatan', 'asuransi kendaraan', 'asuransi properti', 'asuransi perjalanan', 'asuransi pendidikan', 'asuransi pertanian'] }],
      tahun: { id: 'polis', frasa: 'memperkenalkan polis digital', min: 2013, maks: 2023 },
      perlu: { akhirBenda: 'klaim rawat inap', kal: 'Klaim rawat inap hanya dibayarkan kepada peserta yang telah membayar premi selama sekurang-kurangnya {t} bulan.', nilai: '{E} sudah membayar premi selama {v} bulan.', pasti: '{E} pasti memperoleh pembayaran klaim rawat inap.', tidak: '{E} tidak dapat memperoleh pembayaran klaim rawat inap.', min: 6, maks: 24, langkah: 3, orang: true }
    },
    {
      id: 'pasar-modal', judul: 'Pasar Modal',
      intro: ['Pasar modal menjadi salah satu sarana pendanaan sekaligus investasi bagi masyarakat.', 'Jumlah investor di pasar modal terus bertambah setiap tahun.'],
      outro: ['Perlindungan investor tetap menjadi perhatian otoritas.', 'Literasi investasi masih perlu ditingkatkan.'],
      ent: ['Sekuritas Garuda', 'Sekuritas Dharma', 'Sekuritas Kencana', 'Sekuritas Wibawa', 'Sekuritas Intan', 'Sekuritas Bumi', 'Sekuritas Arta'],
      atr: [
        { id: 'investor', bentuk: 'hitung', kerja: 'melayani', objek: 'investor', sat: 'ribu', kompar: ['lebih banyak', 'lebih sedikit'], min: 10, maks: 900, langkah: 10 },
        { id: 'transaksi', bentuk: 'nilai', kerja: 'mencatat', objek: 'nilai transaksi', sat: 'triliun rupiah', kompar: ['lebih besar', 'lebih kecil'], min: 2, maks: 80, langkah: 2 },
        { id: 'kantor', bentuk: 'hitung', kerja: 'memiliki', objek: 'kantor perwakilan', sat: '', kompar: ['lebih banyak', 'lebih sedikit'], min: 3, maks: 60, langkah: 1 }
      ],
      sifat: [
        { id: 'aplikasi', frasa: 'menyediakan aplikasi perdagangan di perangkat seluler', alt: 'memungkinkan investor bertransaksi lewat aplikasi di ponsel' },
        { id: 'edukasi', frasa: 'menyelenggarakan kelas edukasi investasi secara rutin', alt: 'rutin mengadakan pelatihan investasi bagi nasabah' },
        { id: 'reksa', frasa: 'memasarkan reksa dana dari beberapa manajer investasi', alt: 'menjual reksa dana dari lebih dari satu manajer investasi' }
      ],
      daftar: [{ id: 'instrumen', kerja: 'memfasilitasi', objek: 'instrumen', pool: ['saham', 'obligasi negara', 'reksa dana', 'obligasi korporasi', 'sukuk', 'exchange traded fund'] }],
      tahun: { id: 'ritel', frasa: 'membuka layanan investasi ritel', min: 2012, maks: 2022 },
      perlu: { akhirBenda: 'obligasi ritel', kal: 'Obligasi ritel hanya dapat dipesan oleh investor yang menyiapkan dana sekurang-kurangnya {t} juta rupiah.', nilai: '{E} menyiapkan dana sebesar {v} juta rupiah.', pasti: '{E} pasti dapat memesan obligasi ritel.', tidak: '{E} tidak dapat memesan obligasi ritel.', min: 5, maks: 50, langkah: 5, orang: true }
    },
    {
      id: 'fintech', judul: 'Pembiayaan Berbasis Teknologi',
      intro: ['Pembiayaan berbasis teknologi membuka akses dana bagi pelaku usaha yang sebelumnya sulit dijangkau perbankan.', 'Platform pinjam-meminjam daring tumbuh cepat seiring meluasnya penggunaan ponsel pintar.'],
      outro: ['Izin dan pengawasan platform tersebut dilakukan oleh otoritas.', 'Pengguna dianjurkan memeriksa legalitas platform sebelum bertransaksi.'],
      ent: ['Platform Arunika', 'Platform Dana Mitra', 'Platform Kilat Modal', 'Platform Sinergi', 'Platform Bina Usaha', 'Platform Rintis', 'Platform Cakra'],
      atr: [
        { id: 'peminjam', bentuk: 'hitung', kerja: 'melayani', objek: 'peminjam', sat: 'ribu', kompar: ['lebih banyak', 'lebih sedikit'], min: 20, maks: 800, langkah: 10 },
        { id: 'penyaluran', bentuk: 'nilai', kerja: 'menyalurkan', objek: 'pinjaman', sat: 'triliun rupiah', kompar: ['lebih besar', 'lebih kecil'], min: 1, maks: 40, langkah: 1 },
        { id: 'mitra', bentuk: 'hitung', kerja: 'bekerja sama dengan', objek: 'mitra pemberi dana', sat: '', kompar: ['lebih banyak', 'lebih sedikit'], min: 200, maks: 9000, langkah: 100 }
      ],
      sifat: [
        { id: 'izin', frasa: 'berizin dan diawasi oleh otoritas', alt: 'beroperasi dengan izin dan pengawasan otoritas' },
        { id: 'skor', frasa: 'menilai kelayakan peminjam menggunakan skor kredit', alt: 'memakai skor kredit untuk menilai peminjam' },
        { id: 'tenor', frasa: 'menawarkan pilihan tenor pinjaman yang fleksibel', alt: 'memberi peminjam beberapa pilihan lama cicilan' }
      ],
      daftar: [{ id: 'sektor', kerja: 'membiayai', objek: 'sektor', pool: ['perdagangan', 'pertanian', 'kuliner', 'kerajinan', 'transportasi', 'jasa pendidikan', 'perikanan'] }],
      tahun: { id: 'izin', frasa: 'memperoleh izin usaha', min: 2016, maks: 2023 },
      perlu: { akhirBenda: 'pinjaman modal usaha', kal: 'Pinjaman modal usaha hanya dicairkan kepada peminjam dengan penghasilan bulanan sekurang-kurangnya {t} juta rupiah.', nilai: '{E} berpenghasilan {v} juta rupiah per bulan.', pasti: '{E} pasti memperoleh pinjaman modal usaha.', tidak: '{E} tidak dapat memperoleh pinjaman modal usaha.', min: 3, maks: 10, langkah: 1, orang: true }
    },
    {
      id: 'literasi', judul: 'Literasi Keuangan Daerah',
      intro: ['Tingkat literasi keuangan berbeda-beda di setiap daerah.', 'Program peningkatan literasi keuangan dijalankan di berbagai provinsi.'],
      outro: ['Hasil survei akan dipakai untuk menyusun program berikutnya.', 'Kerja sama dengan pemerintah daerah menjadi kunci keberhasilan program.'],
      ent: ['Provinsi Sumatra Barat', 'Provinsi Jawa Tengah', 'Provinsi Bali', 'Provinsi Kalimantan Timur', 'Provinsi Sulawesi Selatan', 'Provinsi Nusa Tenggara Timur', 'Provinsi Riau'],
      atr: [
        { id: 'peserta', bentuk: 'hitung', kerja: 'mencatat', objek: 'peserta pelatihan literasi', sat: 'ribu', kompar: ['lebih banyak', 'lebih sedikit'], min: 5, maks: 300, langkah: 5 },
        { id: 'indeks', bentuk: 'nilai', kerja: 'memiliki', objek: 'indeks literasi keuangan', sat: 'persen', kompar: ['lebih tinggi', 'lebih rendah'], min: 30, maks: 90, langkah: 1 },
        { id: 'agen', bentuk: 'hitung', kerja: 'memiliki', objek: 'penyuluh keuangan', sat: '', kompar: ['lebih banyak', 'lebih sedikit'], min: 20, maks: 400, langkah: 10 }
      ],
      sifat: [
        { id: 'sekolah', frasa: 'menjalankan program literasi keuangan di sekolah menengah', alt: 'mengajarkan literasi keuangan kepada siswa sekolah menengah' },
        { id: 'desa', frasa: 'menjangkau desa terpencil melalui penyuluhan keliling', alt: 'melakukan penyuluhan keuangan keliling ke desa terpencil' },
        { id: 'daring', frasa: 'menyediakan modul belajar keuangan secara daring', alt: 'membuka materi literasi keuangan lewat internet' }
      ],
      daftar: [{ id: 'materi', kerja: 'mengajarkan', objek: 'materi', pool: ['menabung', 'mengatur anggaran', 'berinvestasi', 'asuransi', 'pinjaman daring yang aman', 'dana pensiun'] }],
      tahun: { id: 'program', frasa: 'memulai program literasi keuangan', min: 2014, maks: 2022 },
      perlu: { akhirBenda: 'pelatihan wirausaha', kal: 'Pelatihan wirausaha hanya terbuka bagi usaha yang telah berdiri sekurang-kurangnya {t} tahun.', nilai: 'Usaha milik {E} telah berdiri selama {v} tahun.', pasti: '{E} pasti dapat mengikuti pelatihan wirausaha.', tidak: '{E} tidak dapat mengikuti pelatihan wirausaha.', min: 1, maks: 5, langkah: 1, orang: true }
    },
    {
      id: 'energi', judul: 'Energi Terbarukan',
      intro: ['Pemanfaatan energi terbarukan terus didorong untuk mengurangi ketergantungan pada bahan bakar fosil.', 'Berbagai daerah mulai membangun pembangkit listrik dari sumber energi terbarukan.'],
      outro: ['Pendanaan proyek energi terbarukan memerlukan dukungan sektor keuangan.', 'Biaya pembangkit dari sumber ini cenderung menurun.'],
      ent: ['Proyek Surya Nusantara', 'Proyek Bayu Pantai', 'Proyek Hidro Lembah', 'Proyek Panas Bumi Gunung', 'Proyek Biomassa Tani', 'Proyek Surya Kota', 'Proyek Arus Selat'],
      atr: [
        { id: 'kapasitas', bentuk: 'nilai', kerja: 'memiliki', objek: 'kapasitas terpasang', sat: 'megawatt', kompar: ['lebih besar', 'lebih kecil'], min: 10, maks: 400, langkah: 10 },
        { id: 'rumah', bentuk: 'hitung', kerja: 'melistriki', objek: 'rumah tangga', sat: 'ribu', kompar: ['lebih banyak', 'lebih sedikit'], min: 5, maks: 300, langkah: 5 },
        { id: 'pekerja', bentuk: 'hitung', kerja: 'mempekerjakan', objek: 'tenaga kerja lokal', sat: '', kompar: ['lebih banyak', 'lebih sedikit'], min: 200, maks: 8000, langkah: 200 }
      ],
      sifat: [
        { id: 'baterai', frasa: 'dilengkapi penyimpanan energi berupa baterai', alt: 'memiliki baterai untuk menyimpan energi' },
        { id: 'kredit', frasa: 'dibiayai sebagian oleh pinjaman bank', alt: 'memperoleh sebagian dananya dari kredit perbankan' },
        { id: 'komunitas', frasa: 'melibatkan koperasi warga dalam pengelolaannya', alt: 'dikelola bersama oleh koperasi warga setempat' }
      ],
      daftar: [{ id: 'pemasok', kerja: 'memanfaatkan', objek: 'sumber energi', pool: ['sinar matahari', 'angin', 'aliran sungai', 'panas bumi', 'limbah pertanian', 'arus laut'] }],
      tahun: { id: 'operasi', frasa: 'mulai beroperasi', min: 2015, maks: 2024 },
      perlu: { akhirBenda: 'izin pemasangan panel atap', kal: 'Izin pemasangan panel surya atap hanya diberikan kepada bangunan dengan luas atap sekurang-kurangnya {t} meter persegi.', nilai: 'Atap milik {E} seluas {v} meter persegi.', pasti: '{E} pasti memperoleh izin pemasangan panel surya atap.', tidak: '{E} tidak dapat memperoleh izin pemasangan panel surya atap.', min: 20, maks: 80, langkah: 5, orang: true }
    },
    {
      id: 'transportasi', judul: 'Transportasi Perkotaan',
      intro: ['Transportasi umum perkotaan menjadi andalan untuk mengurangi kemacetan.', 'Kota-kota besar berlomba memperbaiki layanan angkutan massal.'],
      outro: ['Integrasi tarif dan jadwal antarmoda masih menjadi pekerjaan rumah.', 'Pembiayaan operasional bergantung pada subsidi dan pendapatan tiket.'],
      ent: ['Kota Medan', 'Kota Bandung', 'Kota Semarang', 'Kota Makassar', 'Kota Palembang', 'Kota Denpasar', 'Kota Malang'],
      atr: [
        { id: 'penumpang', bentuk: 'hitung', kerja: 'melayani', objek: 'penumpang angkutan massal per hari', sat: 'ribu', kompar: ['lebih banyak', 'lebih sedikit'], min: 20, maks: 900, langkah: 10 },
        { id: 'rute', bentuk: 'hitung', kerja: 'mengoperasikan', objek: 'rute bus', sat: '', kompar: ['lebih banyak', 'lebih sedikit'], min: 5, maks: 90, langkah: 1 },
        { id: 'subsidi', bentuk: 'nilai', kerja: 'menganggarkan', objek: 'subsidi angkutan', sat: 'miliar rupiah', kompar: ['lebih besar', 'lebih kecil'], min: 20, maks: 900, langkah: 10 }
      ],
      sifat: [
        { id: 'kartu', frasa: 'menerapkan pembayaran nontunai pada seluruh angkutan umum', alt: 'memakai pembayaran nontunai di seluruh angkutan umumnya' },
        { id: 'jalur', frasa: 'memiliki jalur khusus bus yang terpisah dari lalu lintas umum', alt: 'menyediakan lajur bus yang tidak bercampur dengan kendaraan lain' },
        { id: 'pelacak', frasa: 'menyediakan aplikasi pelacak posisi bus secara langsung', alt: 'memungkinkan penumpang melihat posisi bus lewat aplikasi' }
      ],
      daftar: [{ id: 'moda', kerja: 'mengoperasikan', objek: 'moda', pool: ['bus rapid transit', 'angkutan kota', 'kereta komuter', 'ojek daring', 'feri penyeberangan', 'trem wisata'] }],
      tahun: { id: 'brt', frasa: 'meresmikan layanan bus rapid transit', min: 2010, maks: 2022 },
      perlu: { akhirBenda: 'subsidi tarif', kal: 'Subsidi tarif hanya diberikan kepada pengguna yang melakukan perjalanan sekurang-kurangnya {t} kali dalam sebulan.', nilai: '{E} melakukan perjalanan sebanyak {v} kali dalam sebulan.', pasti: '{E} pasti memperoleh subsidi tarif.', tidak: '{E} tidak dapat memperoleh subsidi tarif.', min: 10, maks: 30, langkah: 2, orang: true }
    }
  ];

  // ------------------------------------------------------- kalimat fakta/klaim

  function angkaV(v) { return Fmt.angka(v); }

  /** Frasa nilai: "12 juta nasabah" (hitung) atau "laba sebesar 12 triliun rupiah" (nilai). */
  function frasaNilai(at, v, op) {
    var angka = angkaV(v) + (at.sat ? ' ' + at.sat : '');
    var kata = op === '>' ? 'lebih dari ' : (op === '<' ? 'kurang dari ' : '');
    if (at.bentuk === 'hitung') return kata + angka + ' ' + at.objek;
    return at.objek + ' ' + (op ? kata : 'sebesar ') + angka;
  }

  function kalNilai(at, E, v, op) { return E + ' ' + at.kerja + ' ' + frasaNilai(at, v, op) + '.'; }

  /** Kalimat '=' dengan susunan lain supaya pernyataan bukan salinan kalimat fakta. */
  function kalNilaiAlt(at, E, v) {
    var angka = angkaV(v) + (at.sat ? ' ' + at.sat : '');
    if (at.bentuk === 'hitung') return 'Jumlah ' + at.objek + ' pada ' + E + ' adalah ' + angka + '.';
    return at.objek.charAt(0).toUpperCase() + at.objek.slice(1) + ' ' + E + ' adalah ' + angka + '.';
  }

  function kalLebihFakta(at, A, B) { return 'Dibandingkan ' + B + ', ' + A + ' ' + at.kerja + ' ' + at.objek + ' yang ' + at.kompar[0] + '.'; }
  function kalLebihFaktaAlt(at, A, B) { return B + ' ' + at.kerja + ' ' + at.objek + ' yang ' + at.kompar[1] + ' daripada ' + A + '.'; }
  function kalBanding(at, A, B, rel) { return A + ' ' + at.kerja + ' ' + at.objek + ' yang ' + (rel === '>' ? at.kompar[0] : at.kompar[1]) + ' daripada ' + B + '.'; }
  function kalJumlah(at, A, B, op, v) {
    var sat = (at.sat ? ' ' + at.sat : '');
    return 'Secara bersama-sama, ' + A + ' dan ' + B + ' ' + at.kerja + ' ' + (at.bentuk === 'hitung' ? '' : at.objek + ' ') +
      (op === '>' ? 'lebih dari ' : 'kurang dari ') + angkaV(v) + sat + (at.bentuk === 'hitung' ? ' ' + at.objek : '') + '.';
  }
  function kalSifat(sf, E, ada, alt) { return E + ' ' + (ada ? '' : 'tidak ') + (alt ? sf.alt : sf.frasa) + '.'; }
  function daftarStr(list) { return Fmt.daftarKata(list); }

  // ------------------------------------------------------------- pembangun

  function pilihEnt(a, tp, n) { return a.ambil(tp.ent, n); }

  function nilaiAcak(a, at) { return a.kelipatan(at.min, at.maks, at.langkah); }

  function nilaiBeda(a, at, v, jarakMin) {
    for (var c = 0; c < 80; c++) {
      var w = nilaiAcak(a, at);
      if (Math.abs(w - v) >= jarakMin) return w;
    }
    return v + at.langkah * 3 <= at.maks ? v + at.langkah * 3 : v - at.langkah * 3;
  }

  function f(tipe, data, teks) { var o = { tipe: tipe, teks: teks }; for (var k in data) o[k] = data[k]; return o; }

  /**
   * Bangun {fakta, klaim, bantu} untuk jenis pernyataan dan jawaban yang dituju.
   * `bantu` memuat data pembahasan.
   */
  var BANGUN = {};

  // ---- nilai
  BANGUN['nilai-B'] = function (a, tp, E) {
    var at = a.pilih(tp.atr), v = nilaiAcak(a, at), mode = a.pilih(['=', '=', '>', '<']);
    var fakta = [f('nilai', { ent: E[0], attr: at.id, v: v }, kalNilai(at, E[0], v))];
    var cv = v, op = '=';
    if (mode === '>') { cv = Math.max(at.min - at.langkah, v - at.langkah * a.bulat(1, 3)); op = '>'; if (cv < 0) { cv = v; op = '='; } }
    if (mode === '<') { cv = v + at.langkah * a.bulat(1, 3); op = '<'; }
    return { fakta: fakta, klaim: { tipe: 'nilai', ent: E[0], attr: at.id, op: op, v: cv, teks: op === '=' ? kalNilaiAlt(at, E[0], cv) : kalNilai(at, E[0], cv, op) }, at: [at.id] };
  };
  BANGUN['nilai-S'] = function (a, tp, E) {
    var at = a.pilih(tp.atr), v = nilaiAcak(a, at), mode = a.pilih(['=', '>', '<']);
    var fakta = [f('nilai', { ent: E[0], attr: at.id, v: v }, kalNilai(at, E[0], v))];
    var cv, op = mode;
    if (mode === '=') cv = nilaiBeda(a, at, v, at.langkah * 2);
    else if (mode === '>') cv = v + at.langkah * a.bulat(1, 3);
    else { cv = v - at.langkah * a.bulat(1, 3); if (cv <= 0) { op = '>'; cv = v + at.langkah; } }
    return { fakta: fakta, klaim: { tipe: 'nilai', ent: E[0], attr: at.id, op: op, v: cv, teks: op === '=' ? kalNilaiAlt(at, E[0], cv) : kalNilai(at, E[0], cv, op) }, at: [at.id] };
  };
  BANGUN['nilai-TD'] = function (a, tp, E) {
    var ats = a.kocok(tp.atr), at = ats[0], lain = ats[1];
    var v1 = nilaiAcak(a, lain), v2 = nilaiAcak(a, lain);
    var fakta = [f('nilai', { ent: E[1], attr: lain.id, v: v1 }, kalNilai(lain, E[1], v1)), f('nilai', { ent: E[0], attr: lain.id, v: v2 }, kalNilai(lain, E[0], v2))];
    var v = nilaiAcak(a, at), op = a.pilih(['>', '<', '=']);
    return { fakta: fakta, klaim: { tipe: 'nilai', ent: E[0], attr: at.id, op: op, v: v, teks: kalNilai(at, E[0], v, op === '=' ? '' : op) }, at: [at.id], kosong: { ent: E[0], attr: at.id } };
  };

  // ---- sifat
  BANGUN['sifat-B'] = function (a, tp, E) {
    var sf = a.pilih(tp.sifat), ada = a.untung(0.6);
    var fakta = [f('sifat', { ent: E[0], prop: sf.id, ada: ada }, kalSifat(sf, E[0], ada, false))];
    return { fakta: fakta, klaim: { tipe: 'sifat', ent: E[0], prop: sf.id, ada: ada, teks: kalSifat(sf, E[0], ada, true) }, sf: [sf.id] };
  };
  BANGUN['sifat-S'] = function (a, tp, E) {
    var sf = a.pilih(tp.sifat), ada = a.untung(0.6);
    var fakta = [f('sifat', { ent: E[0], prop: sf.id, ada: ada }, kalSifat(sf, E[0], ada, false))];
    return { fakta: fakta, klaim: { tipe: 'sifat', ent: E[0], prop: sf.id, ada: !ada, teks: kalSifat(sf, E[0], !ada, true) }, sf: [sf.id] };
  };
  BANGUN['sifat-TD'] = function (a, tp, E) {
    var sfs = a.kocok(tp.sifat), sf = sfs[0], lain = sfs[1];
    var fakta = [f('sifat', { ent: E[0], prop: lain.id, ada: a.untung(0.6) }, null), f('sifat', { ent: E[1], prop: sf.id, ada: a.untung(0.6) }, null)];
    fakta.forEach(function (x) { var s = tp.sifat.filter(function (z) { return z.id === x.prop; })[0]; x.teks = kalSifat(s, x.ent, x.ada, false); });
    var ada = a.untung(0.5);
    return { fakta: fakta, klaim: { tipe: 'sifat', ent: E[0], prop: sf.id, ada: ada, teks: kalSifat(sf, E[0], ada, true) }, sf: [sf.id], kosong: { ent: E[0], prop: sf.id } };
  };

  // ---- daftar
  function bangunDaftar(a, tp, E, lengkap, jenisKlaim) {
    var d = tp.daftar[0], pool = a.kocok(d.pool), n = a.bulat(3, 4);
    var anggota = pool.slice(0, n), luar = pool.slice(n);
    var teks = lengkap ? E[0] + ' hanya ' + d.kerja + ' ' + daftarStr(anggota) + '.' : E[0] + ' ' + d.kerja + ' beberapa ' + d.objek + ', antara lain ' + daftarStr(anggota) + '.';
    var fakta = [f('daftar', { ent: E[0], himp: d.id, anggota: anggota, lengkap: lengkap }, teks)];
    var x, termasuk, kal;
    if (jenisKlaim === 'dalam') { x = a.pilih(anggota); termasuk = a.untung(0.7); }
    else { x = a.pilih(luar); termasuk = true; }
    kal = E[0] + ' ' + (termasuk ? '' : 'tidak ') + d.kerja + ' ' + x + '.';
    return { fakta: fakta, klaim: { tipe: 'daftar', ent: E[0], himp: d.id, x: x, termasuk: termasuk, teks: kal }, dft: [d.id] };
  }
  BANGUN['daftar-B'] = function (a, tp, E) {
    var lengkap = a.untung(0.5);
    var r = bangunDaftar(a, tp, E, lengkap, 'dalam');
    if (r.klaim.termasuk === false) {
      // "tidak menawarkan x" benar bila x di luar daftar LENGKAP
      var d = tp.daftar[0], luar = d.pool.filter(function (z) { return r.fakta[0].anggota.indexOf(z) < 0; });
      r = bangunDaftar(a, tp, E, true, 'luar');
      r.klaim.termasuk = false; r.klaim.teks = E[0] + ' tidak ' + d.kerja + ' ' + r.klaim.x + '.';
    }
    return r;
  };
  BANGUN['daftar-S'] = function (a, tp, E) {
    var d = tp.daftar[0];
    if (a.untung(0.5)) {
      var r = bangunDaftar(a, tp, E, true, 'luar');            // daftar lengkap, diklaim menawarkan yang di luar daftar
      return r;
    }
    r = bangunDaftar(a, tp, E, a.untung(0.5), 'dalam');          // anggota diklaim tidak
    r.klaim.termasuk = false; r.klaim.teks = E[0] + ' tidak ' + d.kerja + ' ' + r.klaim.x + '.';
    return r;
  };
  BANGUN['daftar-TD'] = function (a, tp, E) { return bangunDaftar(a, tp, E, false, 'luar'); };

  // ---- banding (dua nilai)
  function dua(a, at) {
    var v1 = nilaiAcak(a, at), v2;
    for (var c = 0; c < 60; c++) { v2 = nilaiAcak(a, at); if (Math.abs(v2 - v1) >= at.langkah * 2) break; }
    if (v1 === v2) v2 = v1 + at.langkah * 3 <= at.maks ? v1 + at.langkah * 3 : v1 - at.langkah * 3;
    return [v1, v2];
  }
  BANGUN['banding-B'] = function (a, tp, E) {
    var at = a.pilih(tp.atr), v = dua(a, at);
    var fakta = [f('nilai', { ent: E[0], attr: at.id, v: v[0] }, kalNilai(at, E[0], v[0])), f('nilai', { ent: E[1], attr: at.id, v: v[1] }, kalNilai(at, E[1], v[1]))];
    var rel = v[0] > v[1] ? '>' : '<';
    return { fakta: fakta, klaim: { tipe: 'banding', a: E[0], b: E[1], attr: at.id, rel: rel, teks: kalBanding(at, E[0], E[1], rel) }, at: [at.id] };
  };
  BANGUN['banding-S'] = function (a, tp, E) {
    var at = a.pilih(tp.atr), v = dua(a, at);
    var fakta = [f('nilai', { ent: E[0], attr: at.id, v: v[0] }, kalNilai(at, E[0], v[0])), f('nilai', { ent: E[1], attr: at.id, v: v[1] }, kalNilai(at, E[1], v[1]))];
    var rel = v[0] > v[1] ? '<' : '>';
    return { fakta: fakta, klaim: { tipe: 'banding', a: E[0], b: E[1], attr: at.id, rel: rel, teks: kalBanding(at, E[0], E[1], rel) }, at: [at.id] };
  };
  BANGUN['banding-TD'] = function (a, tp, E) {
    var at = a.pilih(tp.atr), v = nilaiAcak(a, at);
    var fakta = [f('nilai', { ent: E[0], attr: at.id, v: v }, kalNilai(at, E[0], v))];
    var rel = a.pilih(['>', '<']);
    return { fakta: fakta, klaim: { tipe: 'banding', a: E[0], b: E[2], attr: at.id, rel: rel, teks: kalBanding(at, E[0], E[2], rel) }, at: [at.id], kosong: { ent: E[2], attr: at.id } };
  };

  // ---- urutan (lebih) tanpa angka: rantai
  BANGUN['rantai-B'] = function (a, tp, E) {
    var at = a.pilih(tp.atr);
    var urut = a.kocok(E.slice(0, 3));          // urut[0] > urut[1] > urut[2]
    var fakta = [f('lebih', { a: urut[0], b: urut[1], attr: at.id }, kalLebihFakta(at, urut[0], urut[1])),
      f('lebih', { a: urut[1], b: urut[2], attr: at.id }, kalLebihFaktaAlt(at, urut[1], urut[2]))];
    return { fakta: fakta, klaim: { tipe: 'banding', a: urut[0], b: urut[2], attr: at.id, rel: '>', teks: kalBanding(at, urut[0], urut[2], '>') }, at: [at.id], rantai: urut };
  };
  BANGUN['rantai-S'] = function (a, tp, E) {
    var at = a.pilih(tp.atr);
    var urut = a.kocok(E.slice(0, 3));
    var fakta = [f('lebih', { a: urut[0], b: urut[1], attr: at.id }, kalLebihFakta(at, urut[0], urut[1])),
      f('lebih', { a: urut[1], b: urut[2], attr: at.id }, kalLebihFaktaAlt(at, urut[1], urut[2]))];
    return { fakta: fakta, klaim: { tipe: 'banding', a: urut[0], b: urut[2], attr: at.id, rel: '<', teks: kalBanding(at, urut[0], urut[2], '<') }, at: [at.id], rantai: urut };
  };
  BANGUN['rantai-TD'] = function (a, tp, E) {
    var at = a.pilih(tp.atr);
    var kiri = a.pilih([0, 1, 2]), sisa = [0, 1, 2].filter(function (x) { return x !== kiri; });
    var dasar = E[kiri], p = E[sisa[0]], q = E[sisa[1]];   // p > dasar dan q > dasar (atau kebalikannya)
    var atas = a.untung(0.5);
    var fakta = atas
      ? [f('lebih', { a: p, b: dasar, attr: at.id }, kalLebihFakta(at, p, dasar)), f('lebih', { a: q, b: dasar, attr: at.id }, kalLebihFaktaAlt(at, q, dasar))]
      : [f('lebih', { a: dasar, b: p, attr: at.id }, kalLebihFakta(at, dasar, p)), f('lebih', { a: dasar, b: q, attr: at.id }, kalLebihFaktaAlt(at, dasar, q))];
    return { fakta: fakta, klaim: { tipe: 'banding', a: p, b: q, attr: at.id, rel: a.pilih(['>', '<']), teks: null }, at: [at.id], tdRantai: true };
  };

  // ---- jumlah
  BANGUN['jumlah-B'] = function (a, tp, E) {
    var at = a.pilih(tp.atr.filter(function (x) { return x.bentuk === 'hitung' || x.bentuk === 'nilai'; })), v = dua(a, at);
    var fakta = [f('nilai', { ent: E[0], attr: at.id, v: v[0] }, kalNilai(at, E[0], v[0])), f('nilai', { ent: E[1], attr: at.id, v: v[1] }, kalNilai(at, E[1], v[1]))];
    var jml = v[0] + v[1], batas = Math.max(at.langkah, jml - at.langkah * a.bulat(2, 6));
    return { fakta: fakta, klaim: { tipe: 'jumlah', ents: [E[0], E[1]], attr: at.id, op: '>', v: batas, teks: kalJumlah(at, E[0], E[1], '>', batas) }, at: [at.id] };
  };
  BANGUN['jumlah-S'] = function (a, tp, E) {
    var at = a.pilih(tp.atr), v = dua(a, at);
    var fakta = [f('nilai', { ent: E[0], attr: at.id, v: v[0] }, kalNilai(at, E[0], v[0])), f('nilai', { ent: E[1], attr: at.id, v: v[1] }, kalNilai(at, E[1], v[1]))];
    var jml = v[0] + v[1], batas = jml + at.langkah * a.bulat(2, 6);
    return { fakta: fakta, klaim: { tipe: 'jumlah', ents: [E[0], E[1]], attr: at.id, op: '>', v: batas, teks: kalJumlah(at, E[0], E[1], '>', batas) }, at: [at.id] };
  };
  BANGUN['jumlah-TD'] = function (a, tp, E) {
    var at = a.pilih(tp.atr), v = nilaiAcak(a, at);
    var fakta = [f('nilai', { ent: E[0], attr: at.id, v: v }, kalNilai(at, E[0], v))];
    var batas = v + at.langkah * a.bulat(1, 5);
    return { fakta: fakta, klaim: { tipe: 'jumlah', ents: [E[0], E[2]], attr: at.id, op: '>', v: batas, teks: kalJumlah(at, E[0], E[2], '>', batas) }, at: [at.id], kosong: { ent: E[2], attr: at.id } };
  };

  // ---- tahun
  BANGUN['tahun-B'] = function (a, tp, E) {
    var t = tp.tahun, y0 = a.bulat(t.min, t.maks - 2), y1 = y0 + a.bulat(1, 3);
    var fakta = [f('tahun', { ent: E[0], peristiwa: t.id, t: y0 }, E[0] + ' ' + t.frasa + ' pada tahun ' + y0 + '.'), f('tahun', { ent: E[1], peristiwa: t.id, t: y1 }, E[1] + ' ' + t.frasa + ' pada tahun ' + y1 + '.')];
    return { fakta: fakta, klaim: { tipe: 'tahun', a: E[0], b: E[1], peristiwa: t.id, rel: 'awal', teks: E[0] + ' ' + t.frasa + ' lebih dahulu daripada ' + E[1] + '.' }, th: [t.id] };
  };
  BANGUN['tahun-S'] = function (a, tp, E) {
    var t = tp.tahun, y0 = a.bulat(t.min, t.maks - 2), y1 = y0 + a.bulat(1, 3);
    var fakta = [f('tahun', { ent: E[0], peristiwa: t.id, t: y0 }, E[0] + ' ' + t.frasa + ' pada tahun ' + y0 + '.'), f('tahun', { ent: E[1], peristiwa: t.id, t: y1 }, E[1] + ' ' + t.frasa + ' pada tahun ' + y1 + '.')];
    return { fakta: fakta, klaim: { tipe: 'tahun', a: E[1], b: E[0], peristiwa: t.id, rel: 'awal', teks: E[1] + ' ' + t.frasa + ' lebih dahulu daripada ' + E[0] + '.' }, th: [t.id] };
  };
  BANGUN['tahun-TD'] = function (a, tp, E) {
    var t = tp.tahun, y0 = a.bulat(t.min, t.maks - 2);
    var fakta = [f('tahun', { ent: E[0], peristiwa: t.id, t: y0 }, E[0] + ' ' + t.frasa + ' pada tahun ' + y0 + '.')];
    return { fakta: fakta, klaim: { tipe: 'tahun', a: E[0], b: E[2], peristiwa: t.id, rel: 'awal', teks: E[0] + ' ' + t.frasa + ' lebih dahulu daripada ' + E[2] + '.' }, th: [t.id], kosong: { ent: E[2], peristiwa: t.id } };
  };

  // ---- syarat perlu
  function bangunPerlu(a, tp, mode) {
    var p = tp.perlu, ambang = a.kelipatan(p.min + p.langkah, p.maks, p.langkah);
    var orang = a.pilih(Kamus.NAMA_ORANG);
    var v;
    if (mode === 'gagal') v = ambang - p.langkah * a.bulat(1, 2); else v = ambang + p.langkah * a.bulat(0, 2);
    if (v < 0) v = 0;
    var fakta = [f('perlu', { aksi: p.akhirBenda, ambang: ambang }, p.kal.replace('{t}', angkaV(ambang))),
      f('nilai', { ent: orang, attr: 'perlu:' + p.akhirBenda, v: v }, p.nilai.replace('{E}', orang).replace('{v}', angkaV(v)))];
    return { fakta: fakta, orang: orang, p: p, ambang: ambang, v: v };
  }
  BANGUN['perlu-B'] = function (a, tp) {
    var r = bangunPerlu(a, tp, 'gagal');
    return { fakta: r.fakta, klaim: { tipe: 'perlu', ent: r.orang, aksi: r.p.akhirBenda, jenis: 'tidak', teks: r.p.tidak.replace('{E}', r.orang) }, perlu: r };
  };
  BANGUN['perlu-S'] = function (a, tp) {
    var r = bangunPerlu(a, tp, 'gagal');
    return { fakta: r.fakta, klaim: { tipe: 'perlu', ent: r.orang, aksi: r.p.akhirBenda, jenis: 'pasti', teks: r.p.pasti.replace('{E}', r.orang) }, perlu: r };
  };
  BANGUN['perlu-TD'] = function (a, tp) {
    var r = bangunPerlu(a, tp, 'lulus');
    return { fakta: r.fakta, klaim: { tipe: 'perlu', ent: r.orang, aksi: r.p.akhirBenda, jenis: a.pilih(['pasti', 'tidak']), teks: null }, perlu: r };
  };

  var DAFTAR_TIPE = {
    mudah: { B: ['nilai-B', 'sifat-B', 'daftar-B'], S: ['nilai-S', 'sifat-S', 'daftar-S'], TD: ['nilai-TD', 'sifat-TD', 'daftar-TD'] },
    sedang: { B: ['banding-B', 'tahun-B', 'nilai-B', 'daftar-B'], S: ['banding-S', 'tahun-S', 'nilai-S', 'daftar-S'], TD: ['banding-TD', 'tahun-TD', 'nilai-TD', 'sifat-TD'] },
    sulit: { B: ['rantai-B', 'jumlah-B', 'perlu-B'], S: ['rantai-S', 'jumlah-S', 'perlu-S'], TD: ['rantai-TD', 'jumlah-TD', 'perlu-TD'] }
  };

  // ------------------------------------------------------ fakta pengecoh

  /** Tambahkan fakta tentang atribut/sifat/daftar/tahun yang TIDAK dipakai pernyataan. */
  function pengecoh(a, tp, E, rakit, jumlah) {
    var terpakaiAt = (rakit.at || []).slice(), terpakaiSf = (rakit.sf || []).slice(), terpakaiDf = (rakit.dft || []).slice(), terpakaiTh = (rakit.th || []).slice();
    (rakit.fakta || []).forEach(function (x) {
      if (x.tipe === 'nilai' && String(x.attr).indexOf('perlu:') !== 0) terpakaiAt.push(x.attr);
      else if (x.tipe === 'sifat') terpakaiSf.push(x.prop);
      else if (x.tipe === 'daftar') terpakaiDf.push(x.himp);
      else if (x.tipe === 'tahun') terpakaiTh.push(x.peristiwa);
    });
    var tambahan = [], coba = 0;
    var jenis = ['nilai', 'sifat', 'daftar', 'tahun'];
    while (tambahan.length < jumlah && coba++ < 40) {
      var j = a.pilih(jenis);
      if (j === 'nilai') {
        var sisa = tp.atr.filter(function (x) { return terpakaiAt.indexOf(x.id) < 0; });
        if (!sisa.length) continue;
        var at = a.pilih(sisa), ent = a.pilih(E), v = nilaiAcak(a, at);
        terpakaiAt.push(at.id);
        tambahan.push(f('nilai', { ent: ent, attr: at.id, v: v }, kalNilai(at, ent, v)));
        // jangan menyebut dua entitas untuk atribut yang sama: pasangan akan memberi bahan banding
      } else if (j === 'sifat') {
        var sisaS = tp.sifat.filter(function (x) { return terpakaiSf.indexOf(x.id) < 0; });
        if (!sisaS.length) continue;
        var sf = a.pilih(sisaS), ent2 = a.pilih(E), ada = a.untung(0.6);
        terpakaiSf.push(sf.id);
        tambahan.push(f('sifat', { ent: ent2, prop: sf.id, ada: ada }, kalSifat(sf, ent2, ada, false)));
      } else if (j === 'daftar') {
        var d = tp.daftar[0];
        if (terpakaiDf.indexOf(d.id) >= 0) continue;
        var ent3 = a.pilih(E), pool = a.kocok(d.pool), n = a.bulat(3, 4), anggota = pool.slice(0, n), lengkap = a.untung(0.5);
        terpakaiDf.push(d.id);
        tambahan.push(f('daftar', { ent: ent3, himp: d.id, anggota: anggota, lengkap: lengkap },
          lengkap ? ent3 + ' hanya ' + d.kerja + ' ' + daftarStr(anggota) + '.' : ent3 + ' ' + d.kerja + ' beberapa ' + d.objek + ', antara lain ' + daftarStr(anggota) + '.'));
      } else {
        var t = tp.tahun;
        if (terpakaiTh.indexOf(t.id) >= 0) continue;
        var ent4 = a.pilih(E), y = a.bulat(t.min, t.maks);
        terpakaiTh.push(t.id);
        tambahan.push(f('tahun', { ent: ent4, peristiwa: t.id, t: y }, ent4 + ' ' + t.frasa + ' pada tahun ' + y + '.'));
      }
    }
    return tambahan;
  }

  // --------------------------------------------------------- pembahasan

  function kutip(fk) { return '"' + String(fk.teks).replace(/\.$/, '') + '"'; }

  function pembahasanVerbal(fakta, klaim, truth, tp, bantu) {
    var baris = [];
    var kunciKata = truth === 'B' ? 'BENAR' : (truth === 'S' ? 'SALAH' : 'TIDAK DIKETAHUI');
    function cari(pred) { return fakta.filter(pred); }
    var kk = klaim;
    if (kk.tipe === 'nilai') {
      var fk = cari(function (x) { return x.tipe === 'nilai' && x.ent === kk.ent && x.attr === kk.attr })[0];
      if (fk) {
        baris.push('Bacaan menyatakan ' + kutip(fk) + '.');
        var opKata = { '=': 'sama dengan', '>': 'lebih dari', '<': 'kurang dari' }[kk.op];
        baris.push('Pernyataan mengatakan nilainya ' + opKata + ' ' + angkaV(kk.v) + ', sedangkan bacaan menyebut ' + angkaV(fk.v) + (truth === 'B' ? ', sehingga pernyataan itu sesuai dengan bacaan.' : ', sehingga pernyataan itu bertentangan dengan bacaan.'));
      } else baris.push('Bacaan tidak menyebut nilai ' + bantu.namaAttr + ' untuk ' + kk.ent + ' sama sekali; pernyataan itu tidak dapat dipastikan benar atau salah.');
    } else if (kk.tipe === 'banding') {
      var ads = cari(function (x) { return (x.tipe === 'nilai' && (x.ent === kk.a || x.ent === kk.b) && x.attr === kk.attr) || (x.tipe === 'lebih' && x.attr === kk.attr); });
      ads.forEach(function (x) { baris.push('Bacaan menyatakan ' + kutip(x) + '.'); });
      if (truth === 'TD') baris.push('Dari keterangan itu tidak dapat ditentukan mana yang lebih ' + (kk.rel === '>' ? 'tinggi' : 'rendah') + ' antara ' + kk.a + ' dan ' + kk.b + '.');
      else if (ads.some(function (x) { return x.tipe === 'lebih'; })) baris.push('Dengan menggabungkan kedua keterangan secara berurutan, urutan ' + kk.a + ' dan ' + kk.b + ' dapat ditentukan, dan pernyataan itu ' + (truth === 'B' ? 'sesuai' : 'bertentangan') + ' dengan urutan tersebut.');
      else baris.push('Membandingkan kedua nilai itu, pernyataan tersebut ' + (truth === 'B' ? 'sesuai dengan bacaan.' : 'bertentangan dengan bacaan.'));
    } else if (kk.tipe === 'jumlah') {
      var ns = cari(function (x) { return x.tipe === 'nilai' && kk.ents.indexOf(x.ent) >= 0 && x.attr === kk.attr; });
      ns.forEach(function (x) { baris.push('Bacaan menyatakan ' + kutip(x) + '.'); });
      if (ns.length === 2) baris.push('Jumlah keduanya = ' + angkaV(ns[0].v) + ' + ' + angkaV(ns[1].v) + ' = ' + angkaV(ns[0].v + ns[1].v) + ', sedangkan pernyataan menyebut lebih dari ' + angkaV(kk.v) + (truth === 'B' ? ', jadi pernyataan itu benar.' : ', jadi pernyataan itu salah.'));
      else baris.push('Nilai salah satu entitas yang dijumlahkan tidak disebut di bacaan, sehingga jumlahnya tidak dapat dihitung.');
    } else if (kk.tipe === 'sifat') {
      var sfk = cari(function (x) { return x.tipe === 'sifat' && x.ent === kk.ent && x.prop === kk.prop; })[0];
      if (sfk) baris.push('Bacaan menyatakan ' + kutip(sfk) + '. Pernyataan memakai kalimat lain dengan makna yang ' + (truth === 'B' ? 'sama' : 'berlawanan') + '.');
      else baris.push('Bacaan tidak menyebut apakah hal itu berlaku bagi ' + kk.ent + '; pernyataan tidak dapat dipastikan benar atau salah.');
    } else if (kk.tipe === 'daftar') {
      var dk = cari(function (x) { return x.tipe === 'daftar' && x.ent === kk.ent; })[0];
      baris.push('Bacaan menyatakan ' + kutip(dk) + '.');
      var anggota = dk.anggota.indexOf(kk.x) >= 0;
      if (anggota) baris.push('"' + kk.x + '" termasuk dalam daftar, jadi pernyataan itu ' + (truth === 'B' ? 'benar.' : 'salah.'));
      else if (dk.lengkap) baris.push('Kata "hanya" membuat daftar itu lengkap, dan "' + kk.x + '" tidak ada di dalamnya, sehingga pernyataan itu ' + (truth === 'S' ? 'salah.' : 'benar.'));
      else baris.push('Daftar itu bersifat terbuka ("antara lain"), sehingga "' + kk.x + '" mungkin ada dan mungkin tidak; pernyataan tidak dapat dipastikan.');
    } else if (kk.tipe === 'tahun') {
      var ts = cari(function (x) { return x.tipe === 'tahun' && x.peristiwa === kk.peristiwa; });
      ts.forEach(function (x) { baris.push('Bacaan menyatakan ' + kutip(x) + '.'); });
      if (truth === 'TD') baris.push('Tahun peristiwa untuk ' + kk.b + ' tidak disebut, sehingga urutannya tidak dapat dipastikan.');
      else baris.push('Membandingkan tahunnya, pernyataan itu ' + (truth === 'B' ? 'sesuai dengan bacaan.' : 'bertentangan dengan bacaan.'));
    } else {
      var pk = cari(function (x) { return x.tipe === 'perlu'; })[0], nk = cari(function (x) { return x.tipe === 'nilai' && x.ent === kk.ent; })[0];
      baris.push('Bacaan menyatakan ' + kutip(pk) + '.');
      baris.push('Bacaan juga menyatakan ' + kutip(nk) + '.');
      if (nk.v < pk.ambang) baris.push(angkaV(nk.v) + ' kurang dari batas ' + angkaV(pk.ambang) + ', sehingga syarat itu tidak terpenuhi. ' + (truth === 'B' ? 'Maka pernyataan bahwa ia tidak dapat memperolehnya benar.' : 'Maka pernyataan bahwa ia pasti memperolehnya salah.'));
      else baris.push(angkaV(nk.v) + ' memenuhi batas ' + angkaV(pk.ambang) + ', tetapi syarat itu hanya syarat minimal ("hanya diberikan kepada ... sekurang-kurangnya"), bukan jaminan. Bacaan tidak menyebut syarat lainnya, jadi pernyataan itu tidak dapat dipastikan benar atau salah.');
    }
    baris.push('Jadi pernyataan tersebut ' + kunciKata + '.');
    return baris;
  }

  // ------------------------------------------------------------------ buat

  function buat(id, level, benih, opsi) {
    opsi = opsi || {};
    var a = Rng.alat(benih);
    var target = opsi.target == null ? a.bulat(0, 2) : (opsi.target > 2 ? opsi.target % 3 : opsi.target);
    var truth = HURUF_TRUTH[target];
    var daftarTipe = DAFTAR_TIPE[level][truth];
    for (var coba = 0; coba < 60; coba++) {
      var tp = a.pilih(TOPIK);
      var E = pilihEnt(a, tp, 3);
      var tipeNama = a.pilih(daftarTipe);
      var r = BANGUN[tipeNama](a, tp, E);
      if (!r) continue;
      // klaim TD kompleks (teks dibangun setelah arah dipilih)
      var at0 = tp.atr.filter(function (x) { return r.at && x.id === r.at[0]; })[0];
      if (r.tdRantai) { r.klaim.teks = kalBanding(at0, r.klaim.a, r.klaim.b, r.klaim.rel); }
      if (tipeNama === 'perlu-TD') {
        var jenisK = r.klaim.jenis;
        r.klaim.teks = r.perlu.p[jenisK].replace('{E}', r.perlu.orang);
      }
      // fakta pengecoh: tambahkan sampai 5-7 kalimat
      var jml = a.bulat(Math.max(2, 5 - r.fakta.length), Math.max(3, 7 - r.fakta.length));
      var extra = pengecoh(a, tp, E, r, jml);
      var semua = r.fakta.concat(extra);
      // untuk klaim TD tentang entitas tanpa fakta atribut itu, pastikan tidak ada pengecoh yang menyebutnya
      if (r.kosong) {
        var bocor = semua.some(function (x) {
          if (r.kosong.attr && x.tipe === 'nilai' && x.ent === r.kosong.ent && x.attr === r.kosong.attr) return true;
          if (r.kosong.prop && x.tipe === 'sifat' && x.ent === r.kosong.ent && x.prop === r.kosong.prop) return true;
          if (r.kosong.peristiwa && x.tipe === 'tahun' && x.ent === r.kosong.ent && x.peristiwa === r.kosong.peristiwa) return true;
          return false;
        });
        if (bocor) continue;
      }
      // urutan kalimat: acak, tetapi fakta pasangan (dua nilai untuk dibandingkan) tidak harus berdekatan
      var urut = a.kocok(semua);
      var kalimat = urut.map(function (x) { return x.teks; });
      var paragraf = a.pilih(tp.intro) + ' ' + kalimat.join(' ') + (a.untung(0.5) ? ' ' + a.pilih(tp.outro) : '');
      var namaAttr = at0 ? at0.objek : '';
      var bantu = { namaAttr: namaAttr };
      var pem = pembahasanVerbal(urut, r.klaim, truth, tp, bantu);
      var ctx = { subtes: 'ku', submateri: 'verbal', keluarga: id, level: level, benih: benih, a: a };
      var fk = urut.map(function (x, i) { var o = {}; for (var k in x) o[k] = x[k]; o.id = 'f' + (i + 1); return o; });
      var pilih = { opsi: OPSI.map(function (t, i) { return { teks: t, nilai: i, alasan: null, kunci: i === target }; }), kunciIndex: target };
      var butir = Butir.rakitPg(ctx, {
        jenisSoal: 'Verbal (Verbal Reasoning)',
        judul: tp.judul, teks: [paragraf], pertanyaan: r.klaim.teks,
        perintah: 'Berdasarkan bacaan di atas, apakah pernyataan berikut Benar, Salah, atau Tidak Diketahui?',
        pilihanJadi: pilih, tanpaAlasan: true, tulisKunci: true,
        langkah: [], pembahasan: pem,
        model: { topik: 'Verbal', fakta: fk, klaim: r.klaim, tipeKlaim: tipeNama, tema: tp.id, perlu: r.perlu ? { ambang: r.ambang } : null },
        sidik: { inti: 'verbal|' + tp.id + '|' + tipeNama + '|' + fk.map(function (x) { return x.teks; }).join('|') + '|' + r.klaim.teks, param: [], entitas: tp.id + E.join(',') }
      });
      if (butir) butir.model.paragraf = paragraf;
      return butir;
    }
    return null;
  }

  var KELUARGA = [{ id: 'bacaan-pernyataan', nama: 'Bacaan dan pernyataan (Benar/Salah/Tidak Diketahui)', submateri: 'verbal' }];

  return { KELUARGA: KELUARGA, TOPIK: TOPIK, OPSI: OPSI, buat: buat };
});
