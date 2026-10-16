/*
 * verbal.js — Kemampuan Umum > Verbal (Verbal Reasoning).
 *
 * Bacaan argumentatif 120-180 kata bertema umum diikuti SATU pernyataan; peserta
 * memilih Benar, Salah, atau Tidak Diketahui. Pernyataannya harus DISIMPULKAN dari
 * bacaan (golongan dua langkah, rantai sebab-akibat, kuantor, "secara teori",
 * syarat perlu/cukup, ...), bukan disalin.
 *
 * Bacaan tidak ditulis bebas. Tiap topik punya kerangka kalimat (slot) dengan
 * beberapa versi, dan tiap kalimat membawa FAKTA berstruktur:
 *
 *   golongan  induk terbagi tepat menjadi dua golongan yang saling lepas
 *   bagian    x termasuk / tidak termasuk y ("mencakup ..., tetapi tidak termasuk ...", "kecuali")
 *   daftar    daftar tertutup ("hanya") atau terbuka ("seperti", "antara lain")
 *   sebab     x menaikkan / menurunkan y; dua sebab dapat berantai
 *   kuantor   semua / tidak semua / sebagian / tidak ada anggota kelompok yang ...
 *   status    "secara teori", "secara teori, tetapi belum terbukti", atau "terbukti"
 *   syarat    syarat perlu ("hanya ... sekurang-kurangnya t") atau syarat cukup
 *             ("setiap ... t atau lebih otomatis ..."); angka kasusnya ada di pernyataan
 *   urutan    "pertama kali di a, kemudian diperluas ke b dan c"
 *   banding   a lebih ... daripada b
 *   latar     pembuka, pendapat ("dinilai", "berpendapat"), atau penutup; tidak pernah
 *             dijadikan dasar pernyataan
 *
 * Pernyataan dibuat menurut JENIS-nya (mis. golongan-silang, kuantor-sebagian-besar,
 * syarat-perlu-lulus) dengan jawaban yang dituju. Penyusun MEMBANGUN kebenarannya; yang
 * MENURUNKAN kebenaran dari fakta adalah validator (`Validator.turunkanVerbal`), yang juga
 * memeriksa bahwa kata penanda tiap fakta memang tertulis di kalimatnya.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./rng.js'), require('./format.js'), require('./butir.js'));
    module.exports = api;
  } else {
    api = factory(root.Rng, root.Fmt, root.Butir);
    root.Verbal = api;
  }
})(typeof self !== 'undefined' ? self : this, function (Rng, Fmt, Butir) {
  'use strict';

  var OPSI = ['Benar', 'Salah', 'Tidak Diketahui'];
  var HURUF_TRUTH = ['B', 'S', 'TD'];
  var KATA_MIN = 120, KATA_MAKS = 180;

  // ----------------------------------------------------------------- topik
  //
  // istilah: id -> nama di bacaan, atau { n: nama, p: parafrasa untuk pernyataan }.
  // alur: slot berurutan; `wajib` selalu dipakai, `ikut` menyeret slot lain bila dipakai,
  // `tdBoleh` membatasi anggota daftar yang boleh menjadi pernyataan Tidak Diketahui.

  var TOPIK = [
    {
      id: 'penerbangan', judul: 'Penerbangan Sipil',
      istilah: {
        sipil: 'penerbangan sipil', umum: 'penerbangan umum', terjadwal: 'transportasi udara terjadwal',
        pribadi: 'penerbangan pribadi', latih: 'penerbangan latih', olahraga: 'penerbangan olahraga',
        berjadwal: 'penerbangan berjadwal yang dijalankan maskapai', kargo: 'penerbangan kargo berjadwal',
        jurnalisme: { n: 'jurnalisme', p: 'kegiatan peliputan berita' }, polisi: { n: 'patroli kepolisian', p: 'tugas pengamanan oleh polisi' },
        medis: { n: 'penerbangan medis darurat', p: 'layanan medis' }, semprot: { n: 'penyemprotan tanaman', p: 'kegiatan pertanian' },
        peta: { n: 'pemetaan wilayah', p: 'pembuatan peta' }, api: { n: 'pemadaman kebakaran hutan', p: 'penanganan kebakaran hutan' },
        harga: 'harga pesawat yang mahal', biaya: 'biaya pelatihan pilot yang tinggi',
        aman: { n: 'anggapan bahwa pesawat kecil kurang aman', p: 'keraguan masyarakat terhadap keselamatan pesawat kecil' },
        bengkel: 'terbatasnya bengkel perawatan pesawat', cuaca: 'cuaca yang sulit diperkirakan',
        bandara: 'bandara kecil', ujian: 'ujian lisensi pilot pribadi'
      },
      alur: [
        { id: 'gol', jenis: 'golongan', wajib: true, induk: 'sipil', anggota: ['umum', 'terjadwal'], kata: 'kategori', var: [
          'Penerbangan sipil terbagi menjadi dua kategori, yaitu penerbangan umum dan transportasi udara terjadwal.',
          'Ada dua kategori dalam penerbangan sipil, yaitu penerbangan umum dan transportasi udara terjadwal.',
          'Dalam dunia penerbangan sipil dikenal dua kategori, yaitu penerbangan umum dan transportasi udara terjadwal.'] },
        { id: 'cakupan', jenis: 'cakupan', x: 'umum', masuk: ['pribadi', 'latih', 'olahraga'], keluar: ['berjadwal', 'kargo'], var: [
          { t: 'Penerbangan umum mencakup, antara lain, {masuk}, tetapi tidak termasuk {keluar}.', pm: 'mencakup', pk: 'tidak termasuk' },
          { t: 'Yang tergolong penerbangan umum antara lain {masuk}, sedangkan {keluar} tidak termasuk di dalamnya.', pm: 'tergolong', pk: 'tidak termasuk' },
          { t: 'Penerbangan umum mencakup {masuk}, namun tidak termasuk {keluar}.', pm: 'mencakup', pk: 'tidak termasuk' }] },
        { id: 'tesis', jenis: 'latar', var: [
          'Banyak pengamat menilai penerbangan umum berpotensi besar mengubah cara orang bepergian.',
          'Penerbangan umum kerap disebut memiliki potensi besar untuk mengubah cara orang bepergian.'] },
        { id: 'status', jenis: 'status', hal: 'bandaraKecil', var: {
          teori: ['Hadirnya pesawat sangat ringan yang biaya operasionalnya rendah berarti, secara teori, orang dapat memakai ribuan bandara kecil untuk mendarat lebih dekat ke tujuannya.',
            'Secara teori, pesawat sangat ringan yang murah dioperasikan memungkinkan orang memakai ribuan bandara kecil untuk tiba lebih dekat ke tujuannya.'],
          belum: ['Secara teori, pesawat sangat ringan yang murah dioperasikan memungkinkan orang memakai ribuan bandara kecil untuk tiba lebih dekat ke tujuannya, tetapi manfaat itu belum terbukti dalam praktik.'] },
          klaim: {
            terbukti: ['Kehadiran pesawat sangat ringan telah terbukti membuat orang memakai ribuan bandara kecil.', 'Sudah terbukti bahwa pesawat sangat ringan membuat orang dapat mendarat lebih dekat ke tujuannya lewat bandara kecil.'],
            mungkin: ['Secara teori, pesawat sangat ringan memungkinkan orang memakai banyak bandara kecil.', 'Pada prinsipnya, pesawat sangat ringan memungkinkan orang mendarat lebih dekat ke tujuannya.'],
            belum: ['Manfaat pesawat sangat ringan bagi pemakaian bandara kecil belum terbukti dalam praktik.'] } },
        { id: 'bidang', jenis: 'daftar', subjek: 'umum', himp: 'bidang', pool: ['jurnalisme', 'polisi', 'medis', 'semprot', 'peta', 'api'], n: [3, 4],
          var: { terbuka: ['Pemanfaatannya pun dapat diperluas ke berbagai bidang, seperti {daftar}.', 'Penerbangan umum juga dapat dimanfaatkan di banyak bidang, misalnya {daftar}.'],
            tertutup: ['Untuk keperluan kerja, izin penerbangan umum sejauh ini hanya diberikan untuk {daftar}.'] },
          klaim: {
            terbuka: { ya: ['Penerbangan umum dapat dimanfaatkan untuk {x}.', 'Kemajuan dalam penerbangan umum dapat digunakan untuk {x}.'], tidak: ['Penerbangan umum tidak dapat dimanfaatkan untuk {x}.'] },
            tertutup: { ya: ['Izin penerbangan umum untuk keperluan kerja sudah diberikan untuk {x}.'], tidak: ['Izin penerbangan umum untuk keperluan kerja belum diberikan untuk {x}.'] } } },
        { id: 'hambatan', jenis: 'daftar', subjek: 'umum', himp: 'hambatan', pool: ['harga', 'biaya', 'aman', 'bengkel', 'cuaca'], n: [2, 3],
          var: { terbuka: ['Namun demikian, ada hambatan yang berarti, antara lain {daftar}.', 'Meski demikian, perkembangannya masih terganjal sejumlah hambatan, seperti {daftar}.'] },
          klaim: { terbuka: { ya: ['{x} merupakan salah satu hambatan bagi penerbangan umum.', '{x} termasuk hambatan dalam perkembangan penerbangan umum.'], tunggal: ['Satu-satunya hambatan bagi penerbangan umum adalah {x}.'] } } },
        { id: 'kuantor', jenis: 'kuantor', kelompok: 'bandara', var: {
          'tidak-semua': ['Selain itu, tidak semua bandara kecil memiliki landasan yang cukup panjang untuk pesawat bermesin ganda.'],
          sebagian: ['Saat ini, sebagian bandara kecil sudah memiliki landasan yang cukup panjang untuk pesawat bermesin ganda.'] },
          klaim: {
            'tidak-semua': { semua: ['Semua bandara kecil memiliki landasan yang cukup panjang untuk pesawat bermesin ganda.'], 'ada-tidak': ['Ada bandara kecil yang landasannya belum cukup panjang untuk pesawat bermesin ganda.'] },
            sebagian: { 'tidak-ada': ['Tidak ada bandara kecil yang memiliki landasan cukup panjang untuk pesawat bermesin ganda.'], 'sebagian-besar': ['Sebagian besar bandara kecil sudah memiliki landasan yang cukup panjang untuk pesawat bermesin ganda.'], ada: ['Ada bandara kecil yang sudah memiliki landasan cukup panjang untuk pesawat bermesin ganda.'] } } },
        { id: 'syarat', jenis: 'syarat', aksi: 'ujian', min: 20, maks: 70, langkah: 5, var: {
          perlu: ['Ujian lisensi pilot pribadi hanya terbuka bagi calon pilot yang telah menempuh sekurang-kurangnya {t} jam terbang.'],
          cukup: ['Setiap calon pilot yang telah menempuh {t} jam terbang atau lebih otomatis dapat mengikuti ujian lisensi pilot pribadi.'] },
          klaim: { pasti: ['Calon pilot yang telah menempuh {v} jam terbang pasti dapat mengikuti ujian lisensi pilot pribadi.'], tidak: ['Calon pilot yang telah menempuh {v} jam terbang tidak dapat mengikuti ujian lisensi pilot pribadi.'] } },
        { id: 'penutup', jenis: 'latar', var: [
          'Karena itu, perkembangan penerbangan umum masih memerlukan dukungan kebijakan yang konsisten.',
          'Arah perkembangannya dalam beberapa tahun ke depan masih akan terus diperdebatkan.'] }
      ]
    },
    {
      id: 'upah', judul: 'Upah Minimum',
      istilah: {
        upahMin: 'upah minimum', jasa: 'industri jasa', tani: 'sektor pertanian', manufaktur: 'sektor manufaktur',
        tambang: 'sektor pertambangan', konstruksi: 'sektor konstruksi', cakupanUpah: 'cakupan ketentuan upah minimum',
        magang: 'pekerja magang yang masih menjalani masa pelatihan', prt: 'pekerja rumah tangga yang tinggal bersama pemberi kerja',
        perusahaan: 'perusahaan', layak: 'upah yang lebih layak', dayaBeli: 'daya beli', usaha: 'penjualan usaha kecil',
        awas: 'lemahnya pengawasan di lapangan', informal: 'besarnya jumlah pekerja di sektor informal',
        bedaHidup: 'perbedaan biaya hidup antardaerah', inflasi: 'lambatnya penyesuaian upah terhadap inflasi',
        pindah: 'ancaman pemindahan pabrik ke daerah berupah rendah', tunjangan: 'tunjangan masa kerja'
      },
      alur: [
        { id: 'def', jenis: 'latar', wajib: true, var: [
          'Upah minimum adalah batas terendah upah yang ditetapkan pemerintah untuk melindungi pekerja berupah rendah.',
          'Kebijakan upah minimum menetapkan batas terendah upah sebagai perlindungan bagi pekerja berupah rendah.'] },
        { id: 'urutan', jenis: 'urutan', subjek: 'upahMin', pool: ['jasa', 'tani', 'manufaktur'], luar: ['tambang', 'konstruksi'], var: [
          'Kebijakan ini pertama kali diterapkan di {a}, kemudian diperluas ke {b} dan {c}.',
          'Pada mulanya kebijakan ini hanya berlaku di {a}; baru kemudian cakupannya diperluas ke {b} dan {c}.'],
          klaim: {
            pertama: ['{X} adalah sektor pertama yang menerapkan upah minimum.', 'Upah minimum pertama kali diterapkan di {X}.'],
            sebelum: ['Upah minimum diterapkan di {X} lebih dahulu daripada di {Y}.'],
            diterapkan: ['Upah minimum telah diterapkan di {X}.', 'Cakupan upah minimum sudah diperluas ke {X}.'] } },
        { id: 'studi', jenis: 'latar', var: [
          'Sejumlah studi menyimpulkan bahwa penerapannya menekan praktik eksploitasi terhadap pekerja berupah rendah.',
          'Berbagai kajian menunjukkan bahwa kebijakan ini berperan menekan eksploitasi terhadap pekerja berupah rendah.'] },
        { id: 'serikat', jenis: 'latar', var: [
          'Kampanye penerapannya memperoleh dukungan penting dari serikat pekerja.',
          'Serikat pekerja menjadi pendukung utama kampanye penerapan kebijakan ini.'] },
        { id: 'kecuali', jenis: 'kecuali', y: 'cakupanUpah', pool: ['magang', 'prt'], var: [
          'Ketentuan ini berlaku bagi seluruh pekerja penerima upah, kecuali {k}.',
          'Pemberi kerja wajib membayar sekurang-kurangnya upah minimum kepada semua pekerjanya, kecuali kepada {k}.'],
          klaim: { ya: ['{k} berhak atas upah minimum.', '{k} juga termasuk dalam ketentuan upah minimum.'], tidak: ['{k} tidak termasuk dalam ketentuan upah minimum.', 'Ketentuan upah minimum tidak berlaku bagi {k}.'] } },
        { id: 'kuantor', jenis: 'kuantor', kelompok: 'perusahaan', pra: ['Pada awalnya banyak perusahaan besar menolak tuntutan kenaikan upah karena khawatir biaya produksi melonjak.'], var: {
          sebagian: ['Kini sebagian dari perusahaan tersebut justru ikut menyusun skema pengupahan bersama pemerintah.'],
          'tidak-semua': ['Kini perusahaan-perusahaan tersebut mulai berubah sikap, meskipun tidak semua bersedia ikut menyusun skema pengupahan bersama pemerintah.'] },
          klaim: {
            sebagian: { 'tidak-ada': ['Tidak ada perusahaan besar yang semula menolak kemudian ikut menyusun skema pengupahan bersama pemerintah.'], 'sebagian-besar': ['Sebagian besar perusahaan besar yang semula menolak kini ikut menyusun skema pengupahan bersama pemerintah.'], ada: ['Ada perusahaan besar yang semula menolak, tetapi kini ikut menyusun skema pengupahan bersama pemerintah.'] },
            'tidak-semua': { semua: ['Semua perusahaan besar yang semula menolak kini bersedia ikut menyusun skema pengupahan bersama pemerintah.'], 'ada-tidak': ['Ada perusahaan besar yang semula menolak dan sampai kini belum bersedia ikut menyusun skema pengupahan bersama pemerintah.'] } } },
        { id: 'sebab', jenis: 'sebab', ket: ['upah yang lebih layak meningkatkan daya beli pekerja', 'daya beli yang tumbuh mendorong penjualan usaha kecil'], akhir: 'upah yang lebih layak pada akhirnya ikut mendorong penjualan usaha kecil', mata: [
          { dari: 'layak', ke: 'dayaBeli', arah: 'naik', var: [{ t: 'Upah yang lebih layak meningkatkan daya beli pekerja.', p: 'meningkatkan daya beli' }] },
          { dari: 'dayaBeli', ke: 'usaha', arah: 'naik', var: [{ t: 'Daya beli yang tumbuh pada gilirannya mendorong penjualan usaha kecil di sekitar kawasan industri.', p: 'mendorong penjualan usaha kecil' }] }],
          gabung: [{ t: 'Upah yang lebih layak meningkatkan daya beli pekerja, dan daya beli yang tumbuh pada gilirannya mendorong penjualan usaha kecil di sekitar kawasan industri.', p: ['meningkatkan daya beli', 'mendorong penjualan usaha kecil'] }],
          klaim: {
            m0: { sama: [{ t: 'Upah yang lebih layak membuat daya beli pekerja meningkat.', p: 'daya beli pekerja meningkat' }], balik: [{ t: 'Upah yang lebih layak menurunkan daya beli pekerja.', p: 'menurunkan daya beli' }] },
            m1: { sama: [{ t: 'Daya beli pekerja yang tumbuh ikut menaikkan penjualan usaha kecil di sekitar kawasan industri.', p: 'menaikkan penjualan usaha kecil' }], balik: [{ t: 'Daya beli pekerja yang tumbuh justru mengurangi penjualan usaha kecil di sekitar kawasan industri.', p: 'mengurangi penjualan usaha kecil' }] },
            rantai: { sama: [{ t: 'Upah yang lebih layak turut mendorong penjualan usaha kecil di sekitar kawasan industri.', p: 'mendorong penjualan usaha kecil' }], balik: [{ t: 'Upah yang lebih layak justru menekan penjualan usaha kecil di sekitar kawasan industri.', p: 'menekan penjualan usaha kecil' }] },
            terbalik: [{ t: 'Penjualan usaha kecil yang meningkat mendorong pemberi kerja menaikkan upah pekerja.', p: 'menaikkan upah', dari: 'usaha', ke: 'layak', arah: 'naik', nk: 'upah' }] } },
        { id: 'hambatan', jenis: 'daftar', subjek: 'upahMin', himp: 'hambatan', pool: ['awas', 'informal', 'bedaHidup', 'inflasi', 'pindah'], n: [2, 3],
          var: { terbuka: ['Meski demikian, kebijakan ini masih menghadapi tantangan, seperti {daftar}.', 'Namun, penerapannya tidak lepas dari kendala, antara lain {daftar}.'] },
          klaim: { terbuka: { ya: ['{x} merupakan salah satu tantangan dalam penerapan upah minimum.'], tunggal: ['Satu-satunya tantangan dalam penerapan upah minimum adalah {x}.'] } } },
        { id: 'syarat', jenis: 'syarat', aksi: 'tunjangan', min: 1, maks: 8, langkah: 1, var: {
          perlu: ['Tunjangan masa kerja hanya diberikan kepada pekerja yang telah bekerja sekurang-kurangnya {t} tahun di perusahaan yang sama.'],
          cukup: ['Setiap pekerja yang telah bekerja {t} tahun atau lebih di perusahaan yang sama otomatis memperoleh tunjangan masa kerja.'] },
          klaim: { pasti: ['Pekerja yang telah bekerja {v} tahun di perusahaan yang sama pasti memperoleh tunjangan masa kerja.'], tidak: ['Pekerja yang telah bekerja {v} tahun di perusahaan yang sama tidak dapat memperoleh tunjangan masa kerja.'] } },
        { id: 'penutup', jenis: 'latar', var: ['Karena itu, besaran upah minimum setiap tahun selalu menjadi bahan perundingan yang alot.'] }
      ]
    },
    {
      id: 'sampah', judul: 'Bank Sampah',
      istilah: {
        diterima: 'sampah yang diterima bank sampah', organik: 'sampah organik', anorganik: 'sampah anorganik',
        botol: 'botol plastik', kertas: 'kertas bekas', kaleng: 'kaleng minuman', kardus: 'kardus',
        sisa: 'sisa makanan', daun: 'daun kering', kulit: 'kulit buah',
        pilah: 'pemilahan', mutu: 'mutu', harga: 'harga', warga: 'warga', saldo: 'saldo bank sampah', bank: 'bank sampah',
        pokok: { n: 'belanja bahan pokok', p: 'keperluan dapur sehari-hari' }, token: { n: 'pembelian token listrik', p: 'membeli listrik prabayar' },
        sekolah: { n: 'perlengkapan sekolah anak', p: 'keperluan sekolah anak' }, iuran: { n: 'pembayaran iuran kesehatan', p: 'membayar iuran jaminan kesehatan' },
        pulsa: 'pengisian pulsa telepon',
        tempat: 'sempitnya tempat penyimpanan', jadwal: 'jadwal pengangkutan yang tidak menentu', tenaga: 'kurangnya tenaga pengelola',
        modal: 'terbatasnya modal awal', hargaBekas: 'harga barang bekas yang sering berubah',
        tpa: 'volume sampah ke tempat pembuangan akhir', cair: 'pencairan saldo'
      },
      alur: [
        { id: 'def', jenis: 'latar', wajib: true, var: [
          'Bank sampah adalah tempat warga menyetorkan sampah yang sudah dipilah untuk ditukar dengan saldo tabungan.',
          'Bank sampah menampung sampah terpilah dari warga dan mencatat nilainya sebagai saldo tabungan.'] },
        { id: 'gol', jenis: 'golongan', induk: 'diterima', anggota: ['organik', 'anorganik'], kata: 'golongan', var: [
          'Sampah yang diterima bank sampah dibagi menjadi dua golongan, yaitu sampah organik dan sampah anorganik.',
          'Ada dua golongan sampah yang diterima bank sampah, yaitu sampah organik dan sampah anorganik.'] },
        { id: 'cakupan', jenis: 'cakupan', ikut: 'gol', x: 'anorganik', masuk: ['botol', 'kertas', 'kaleng', 'kardus'], nMasuk: [2, 3], keluar: ['sisa', 'daun', 'kulit'], nKeluar: [1, 2], var: [
          { t: 'Golongan anorganik mencakup {masuk}, sedangkan {keluar} termasuk golongan organik.', pm: 'mencakup', pk: 'termasuk', keluarKe: 'organik' },
          { t: 'Yang tergolong sampah anorganik antara lain {masuk}, sedangkan {keluar} masuk golongan organik.', pm: 'tergolong', pk: 'masuk golongan', keluarKe: 'organik' }] },
        { id: 'tesis', jenis: 'latar', var: [
          'Banyak pengelola menilai bank sampah juga mempererat hubungan antarwarga.',
          'Selain bernilai ekonomi, bank sampah dinilai mampu menumbuhkan kepedulian warga terhadap lingkungan.'] },
        { id: 'sebab', jenis: 'sebab', ket: ['pemilahan sejak dari rumah meningkatkan mutu bahan daur ulang', 'bahan yang mutunya lebih baik dapat dijual dengan harga lebih tinggi'], akhir: 'pemilahan sejak dari rumah pada akhirnya ikut menaikkan harga jual bahan daur ulang', mata: [
          { dari: 'pilah', ke: 'mutu', arah: 'naik', var: [{ t: 'Pemilahan sejak dari rumah meningkatkan mutu bahan daur ulang.', p: 'meningkatkan mutu' }] },
          { dari: 'mutu', ke: 'harga', arah: 'naik', var: [{ t: 'Bahan yang mutunya lebih baik pada gilirannya dapat dijual dengan harga lebih tinggi kepada pengepul.', p: 'harga lebih tinggi' }] }],
          gabung: [{ t: 'Pemilahan sejak dari rumah meningkatkan mutu bahan daur ulang, dan mutu yang lebih baik pada gilirannya menaikkan harga jualnya kepada pengepul.', p: ['meningkatkan mutu', 'menaikkan harga'] }],
          klaim: {
            m0: { sama: [{ t: 'Pemilahan sejak dari rumah membuat mutu bahan daur ulang lebih baik.', p: 'mutu bahan daur ulang lebih baik' }], balik: [{ t: 'Pemilahan sejak dari rumah menurunkan mutu bahan daur ulang.', p: 'menurunkan mutu' }] },
            m1: { sama: [{ t: 'Bahan daur ulang yang mutunya lebih baik dapat dijual dengan harga lebih tinggi.', p: 'harga lebih tinggi' }], balik: [{ t: 'Bahan daur ulang yang mutunya lebih baik justru dijual dengan harga lebih rendah.', p: 'harga lebih rendah' }] },
            rantai: { sama: [{ t: 'Pemilahan sampah sejak dari rumah turut membuat bahan daur ulang dapat dijual dengan harga lebih tinggi.', p: 'harga lebih tinggi' }, { t: 'Pemilahan sejak dari rumah pada akhirnya ikut menaikkan harga jual bahan daur ulang.', p: 'menaikkan harga' }],
              balik: [{ t: 'Pemilahan sejak dari rumah pada akhirnya justru menurunkan harga jual bahan daur ulang.', p: 'menurunkan harga' }] },
            terbalik: [{ t: 'Harga jual yang tinggi mendorong warga memilah sampah sejak dari rumah.', p: 'mendorong warga memilah', dari: 'harga', ke: 'pilah', arah: 'naik', nk: 'memilah' }] } },
        { id: 'status', jenis: 'status', hal: 'tpa', var: {
          teori: ['Secara teori, bila setiap rumah tangga memilah sampahnya, volume sampah yang dibuang ke tempat pembuangan akhir dapat berkurang secara nyata.'],
          belum: ['Secara teori, volume sampah yang dibuang ke tempat pembuangan akhir dapat berkurang secara nyata bila setiap rumah tangga memilah sampahnya, tetapi hal itu belum terbukti di lapangan.'],
          terbukti: ['Pengalaman di sejumlah kelurahan membuktikan bahwa pemilahan oleh rumah tangga mengurangi volume sampah yang dibuang ke tempat pembuangan akhir secara nyata.'] },
          klaim: {
            terbukti: ['Pemilahan sampah oleh rumah tangga telah terbukti mengurangi volume sampah yang dibuang ke tempat pembuangan akhir secara nyata.'],
            mungkin: ['Pada prinsipnya, pemilahan oleh rumah tangga dapat mengurangi volume sampah yang dibuang ke tempat pembuangan akhir.'],
            belum: ['Manfaat pemilahan sampah bagi berkurangnya volume sampah di tempat pembuangan akhir belum terbukti.'] } },
        { id: 'kuantor', jenis: 'kuantor', kelompok: 'warga', var: {
          'tidak-semua': ['Akan tetapi, tidak semua warga bersedia memilah sampah secara rutin.'],
          sebagian: ['Sejauh ini, sebagian warga sudah terbiasa memilah sampah secara rutin.'] },
          klaim: {
            'tidak-semua': { semua: ['Semua warga bersedia memilah sampah secara rutin.'], 'ada-tidak': ['Ada warga yang tidak bersedia memilah sampah secara rutin.'] },
            sebagian: { 'tidak-ada': ['Tidak ada warga yang terbiasa memilah sampah secara rutin.'], 'sebagian-besar': ['Sebagian besar warga sudah terbiasa memilah sampah secara rutin.'], ada: ['Ada warga yang sudah terbiasa memilah sampah secara rutin.'] } } },
        { id: 'pakai', jenis: 'daftar', subjek: 'saldo', himp: 'pakai', pool: ['pokok', 'token', 'sekolah', 'iuran', 'pulsa'], n: [3, 4],
          var: { terbuka: ['Saldo yang terkumpul dapat dipakai untuk berbagai keperluan, seperti {daftar}.'], tertutup: ['Saldo yang terkumpul hanya dapat dipakai untuk {daftar}.'] },
          klaim: {
            terbuka: { ya: ['Saldo bank sampah dapat dipakai untuk {x}.'], tidak: ['Saldo bank sampah tidak dapat dipakai untuk {x}.'] },
            tertutup: { ya: ['Saldo bank sampah dapat dipakai untuk {x}.'], tidak: ['Saldo bank sampah tidak dapat dipakai untuk {x}.'] } } },
        { id: 'syarat', jenis: 'syarat', aksi: 'cair', min: 5, maks: 50, langkah: 5, var: {
          perlu: ['Saldo tabungan hanya dapat dicairkan oleh nasabah yang setorannya telah mencapai sekurang-kurangnya {t} kilogram.'],
          cukup: ['Setiap nasabah yang setorannya telah mencapai {t} kilogram atau lebih otomatis dapat mencairkan saldo tabungannya.'] },
          klaim: { pasti: ['Nasabah yang setorannya telah mencapai {v} kilogram pasti dapat mencairkan saldo tabungannya.'], tidak: ['Nasabah yang setorannya {v} kilogram tidak dapat mencairkan saldo tabungannya.'] } },
        { id: 'hambatan', jenis: 'daftar', subjek: 'bank', himp: 'hambatan', pool: ['tempat', 'jadwal', 'tenaga', 'modal', 'hargaBekas'], n: [2, 3],
          var: { terbuka: ['Pengelola juga menghadapi sejumlah kendala, seperti {daftar}.', 'Di banyak tempat, bank sampah masih menghadapi kendala, antara lain {daftar}.'] },
          klaim: { terbuka: { ya: ['{x} merupakan salah satu kendala yang dihadapi pengelola bank sampah.'], tunggal: ['Satu-satunya kendala yang dihadapi pengelola bank sampah adalah {x}.'] } } }
      ]
    },
    {
      id: 'pjj', judul: 'Pembelajaran Jarak Jauh',
      istilah: {
        pjj: 'pembelajaran jarak jauh', sinkron: 'pembelajaran sinkron', asinkron: 'pembelajaran asinkron',
        kelas: 'kelas video langsung', diskusi: 'diskusi daring terjadwal', tanya: 'sesi tanya jawab langsung dengan guru',
        modul: 'modul rekaman yang dapat diputar kapan saja', forum: 'forum diskusi tertulis yang dapat diikuti kapan saja',
        siswa: 'siswa di daerah terpencil', dampingan: 'pendampingan orang tua', aktif: 'keaktifan', paham: 'pemahaman materi',
        perangkat: 'keterbatasan perangkat di rumah', beban: 'beratnya beban pendampingan bagi orang tua',
        listrik: 'pasokan listrik yang sering padam', guru: 'kesiapan guru yang belum merata', layar: 'sulitnya menjaga konsentrasi siswa di depan layar',
        kuota: 'bantuan kuota belajar', terbaik: 'belajar dari guru terbaik'
      },
      alur: [
        { id: 'gol', jenis: 'golongan', wajib: true, induk: 'pjj', anggota: ['sinkron', 'asinkron'], kata: 'bentuk', var: [
          'Pembelajaran jarak jauh dapat dibedakan menjadi dua bentuk, yaitu pembelajaran sinkron dan pembelajaran asinkron.',
          'Secara umum, pembelajaran jarak jauh terbagi atas dua bentuk, yaitu pembelajaran sinkron dan pembelajaran asinkron.'] },
        { id: 'cakupan', jenis: 'cakupan', x: 'sinkron', masuk: ['kelas', 'diskusi', 'tanya'], keluar: ['modul', 'forum'], var: [
          { t: 'Pembelajaran sinkron mencakup {masuk}, tetapi tidak termasuk {keluar}.', pm: 'mencakup', pk: 'tidak termasuk' },
          { t: 'Yang tergolong pembelajaran sinkron antara lain {masuk}, sedangkan {keluar} tidak termasuk di dalamnya.', pm: 'tergolong', pk: 'tidak termasuk' }] },
        { id: 'tesis', jenis: 'latar', var: [
          'Model ini dipandang mampu memperluas akses pendidikan bagi siswa yang tinggal jauh dari sekolah.',
          'Penggunaannya meluas sejak banyak sekolah harus menutup kelas tatap muka untuk sementara.'] },
        { id: 'status', jenis: 'status', hal: 'terbaik', var: {
          teori: ['Secara teori, siswa di pelosok dapat belajar dari guru-guru terbaik tanpa harus pindah ke kota.'],
          belum: ['Secara teori, siswa di pelosok dapat belajar dari guru-guru terbaik tanpa harus pindah ke kota, tetapi manfaat itu belum terbukti dalam praktik.'] },
          klaim: {
            terbukti: ['Pembelajaran jarak jauh telah terbukti membuat siswa di pelosok belajar dari guru-guru terbaik tanpa pindah ke kota.'],
            mungkin: ['Pada prinsipnya, pembelajaran jarak jauh memungkinkan siswa di pelosok belajar dari guru-guru terbaik.'],
            belum: ['Manfaat pembelajaran jarak jauh bagi siswa di pelosok belum terbukti dalam praktik.'] } },
        { id: 'kuantor', jenis: 'kuantor', kelompok: 'siswa', var: {
          'tidak-semua': ['Kenyataannya, tidak semua siswa di daerah terpencil memiliki sambungan internet yang stabil.'],
          sebagian: ['Kenyataannya, sebagian siswa di daerah terpencil harus menempuh perjalanan jauh untuk mendapatkan sinyal.'] },
          klaim: {
            'tidak-semua': { semua: ['Seluruh siswa di daerah terpencil memiliki sambungan internet yang stabil.'], 'ada-tidak': ['Ada siswa di daerah terpencil yang sambungan internetnya tidak stabil.'] },
            sebagian: { 'tidak-ada': ['Tidak ada siswa di daerah terpencil yang harus menempuh perjalanan jauh untuk mendapatkan sinyal.'], 'sebagian-besar': ['Sebagian besar siswa di daerah terpencil harus menempuh perjalanan jauh untuk mendapatkan sinyal.'], ada: ['Ada siswa di daerah terpencil yang harus menempuh perjalanan jauh untuk mendapatkan sinyal.'] } } },
        { id: 'sebab', jenis: 'sebab', ket: ['pendampingan orang tua meningkatkan keaktifan siswa', 'keaktifan yang tinggi mempercepat pemahaman materi'], akhir: 'pendampingan orang tua pada akhirnya ikut mempercepat pemahaman materi', mata: [
          { dari: 'dampingan', ke: 'aktif', arah: 'naik', var: [{ t: 'Pendampingan orang tua meningkatkan keaktifan siswa selama kelas berlangsung.', p: 'meningkatkan keaktifan' }] },
          { dari: 'aktif', ke: 'paham', arah: 'naik', var: [{ t: 'Keaktifan yang tinggi pada gilirannya mempercepat pemahaman materi.', p: 'mempercepat pemahaman materi' }] }],
          gabung: [{ t: 'Pendampingan orang tua meningkatkan keaktifan siswa selama kelas berlangsung, dan keaktifan itu pada gilirannya mempercepat pemahaman materi.', p: ['meningkatkan keaktifan', 'mempercepat pemahaman materi'] }],
          klaim: {
            m0: { sama: [{ t: 'Keaktifan siswa selama kelas meningkat berkat pendampingan orang tua.', p: 'keaktifan siswa selama kelas meningkat' }], balik: [{ t: 'Pendampingan orang tua menurunkan keaktifan siswa selama kelas berlangsung.', p: 'menurunkan keaktifan' }] },
            m1: { sama: [{ t: 'Keaktifan siswa yang tinggi ikut mempercepat pemahaman materi.', p: 'mempercepat pemahaman materi' }], balik: [{ t: 'Keaktifan siswa yang tinggi justru memperlambat pemahaman materi.', p: 'memperlambat pemahaman materi' }] },
            rantai: { sama: [{ t: 'Pendampingan orang tua turut mempercepat pemahaman materi siswa.', p: 'mempercepat pemahaman materi' }], balik: [{ t: 'Pendampingan orang tua justru memperlambat pemahaman materi siswa.', p: 'memperlambat pemahaman materi' }] },
            terbalik: [{ t: 'Pemahaman materi yang cepat mendorong orang tua lebih sering mendampingi anaknya.', p: 'mendorong orang tua lebih sering mendampingi', dari: 'paham', ke: 'dampingan', arah: 'naik', nk: 'mendampingi' }] } },
        { id: 'hambatan', jenis: 'daftar', subjek: 'pjj', himp: 'hambatan', pool: ['perangkat', 'beban', 'listrik', 'guru', 'layar'], n: [2, 3],
          var: { terbuka: ['Model ini juga menghadapi sejumlah kendala, seperti {daftar}.', 'Di lapangan masih ada berbagai kendala, antara lain {daftar}.'] },
          klaim: { terbuka: { ya: ['{x} merupakan salah satu kendala pembelajaran jarak jauh.'], tunggal: ['Satu-satunya kendala pembelajaran jarak jauh adalah {x}.'] } } },
        { id: 'syarat', jenis: 'syarat', aksi: 'kuota', min: 50, maks: 95, langkah: 5, var: {
          perlu: ['Untuk membantu, pemerintah daerah menyediakan bantuan kuota belajar, tetapi bantuan itu hanya diberikan kepada siswa yang tingkat kehadiran daringnya sekurang-kurangnya {t} persen.'],
          cukup: ['Pemerintah daerah juga menyediakan bantuan kuota belajar yang otomatis diberikan kepada setiap siswa dengan tingkat kehadiran daring {t} persen atau lebih.'] },
          klaim: { pasti: ['Siswa yang tingkat kehadiran daringnya {v} persen pasti memperoleh bantuan kuota belajar.'], tidak: ['Siswa yang tingkat kehadiran daringnya {v} persen tidak dapat memperoleh bantuan kuota belajar.'] } },
        { id: 'penutup', jenis: 'latar', var: ['Karena itu, keberhasilannya sangat bergantung pada kesiapan sarana di tiap daerah.'] }
      ]
    },
    {
      id: 'telemedisin', judul: 'Telemedisin',
      istilah: {
        tele: 'telemedisin', pasien: 'konsultasi antara pasien dan dokter', antar: 'konsultasi antarfasilitas kesehatan',
        rontgen: 'pengiriman hasil rontgen', kasus: 'diskusi kasus antardokter', rekam: 'pertukaran rekam medis antarklinik',
        bicara: 'percakapan langsung antara dokter dan pasien',
        kronis: { n: 'pemantauan penyakit kronis', p: 'memantau penyakit jangka panjang' }, gizi: { n: 'konseling gizi', p: 'pemberian nasihat tentang pola makan' },
        resep: { n: 'penebusan resep obat', p: 'pembelian obat sesuai resep' }, vaksin: { n: 'pemesanan jadwal vaksinasi', p: 'membuat janji vaksinasi' },
        jiwa: { n: 'konseling kesehatan jiwa', p: 'pendampingan kesehatan mental' },
        jangkau: 'jangkauan', tangani: 'penanganan pasien', dokter: 'dokter', antrean: 'antrean di poliklinik', gratis: 'konsultasi gratis',
        data: 'perlindungan data pasien', internet: 'jaringan internet yang belum merata di pedesaan',
        digital: 'rendahnya kemampuan digital pasien lanjut usia', aturan: 'aturan praktik daring yang belum lengkap', tarif: 'tarif konsultasi yang belum seragam'
      },
      alur: [
        { id: 'def', jenis: 'latar', wajib: true, var: [
          'Layanan kesehatan jarak jauh atau telemedisin berkembang pesat seiring meluasnya penggunaan ponsel pintar.',
          'Telemedisin, yaitu layanan kesehatan jarak jauh, berkembang pesat seiring meluasnya penggunaan ponsel pintar.'] },
        { id: 'gol', jenis: 'golongan', induk: 'tele', anggota: ['pasien', 'antar'], kata: 'jenis', var: [
          'Layanan ini terbagi menjadi dua jenis, yaitu konsultasi antara pasien dan dokter serta konsultasi antarfasilitas kesehatan.',
          'Ada dua jenis telemedisin, yaitu konsultasi antara pasien dan dokter serta konsultasi antarfasilitas kesehatan.'] },
        { id: 'cakupan', jenis: 'cakupan', ikut: 'gol', x: 'antar', masuk: ['rontgen', 'kasus', 'rekam'], keluar: ['bicara'], var: [
          { t: 'Konsultasi antarfasilitas kesehatan mencakup {masuk}, sedangkan {keluar} termasuk konsultasi antara pasien dan dokter.', pm: 'mencakup', pk: 'termasuk', keluarKe: 'pasien' }] },
        { id: 'layanan', jenis: 'daftar', subjek: 'tele', himp: 'layanan', pool: ['kronis', 'gizi', 'resep', 'vaksin', 'jiwa'], tdBoleh: ['resep', 'vaksin'], n: [3, 4],
          var: { terbuka: ['Lewat telemedisin, warga dapat memperoleh berbagai layanan, seperti {daftar}.'], tertutup: ['Untuk saat ini, layanan yang tersedia lewat telemedisin hanya {daftar}.'] },
          klaim: {
            terbuka: { ya: ['Telemedisin dapat dimanfaatkan untuk {x}.'], tidak: ['Telemedisin tidak dapat dimanfaatkan untuk {x}.'] },
            tertutup: { parafrasa: false, ya: ['Saat ini {x} sudah dapat dilakukan lewat telemedisin.'], tidak: ['Saat ini {x} belum dapat dilakukan lewat telemedisin.'] } } },
        { id: 'pulau', jenis: 'latar', var: ['Bagi warga di pulau-pulau kecil, layanan ini memangkas waktu tempuh dan biaya perjalanan ke rumah sakit.'] },
        { id: 'sebab', jenis: 'sebab', ket: ['telemedisin memperluas jangkauan layanan dokter spesialis', 'jangkauan yang lebih luas mempercepat penanganan pasien di daerah terpencil'], akhir: 'telemedisin pada akhirnya ikut mempercepat penanganan pasien di daerah terpencil', mata: [
          { dari: 'tele', ke: 'jangkau', arah: 'naik', var: [{ t: 'Telemedisin memperluas jangkauan layanan dokter spesialis.', p: 'memperluas jangkauan' }] },
          { dari: 'jangkau', ke: 'tangani', arah: 'naik', var: [{ t: 'Jangkauan yang lebih luas pada gilirannya mempercepat penanganan pasien di daerah terpencil.', p: 'mempercepat penanganan pasien' }] }],
          gabung: [{ t: 'Telemedisin memperluas jangkauan layanan dokter spesialis, dan jangkauan yang lebih luas pada gilirannya mempercepat penanganan pasien di daerah terpencil.', p: ['memperluas jangkauan', 'mempercepat penanganan pasien'] }],
          klaim: {
            m0: { sama: [{ t: 'Telemedisin membuat jangkauan layanan dokter spesialis menjadi lebih luas.', p: 'jangkauan layanan dokter spesialis menjadi lebih luas' }], balik: [{ t: 'Telemedisin mempersempit jangkauan layanan dokter spesialis.', p: 'mempersempit jangkauan' }] },
            m1: { sama: [{ t: 'Jangkauan layanan dokter spesialis yang lebih luas ikut mempercepat penanganan pasien di daerah terpencil.', p: 'mempercepat penanganan pasien' }], balik: [{ t: 'Jangkauan layanan dokter spesialis yang lebih luas justru memperlambat penanganan pasien di daerah terpencil.', p: 'memperlambat penanganan pasien' }] },
            rantai: { sama: [{ t: 'Telemedisin turut mempercepat penanganan pasien di daerah terpencil.', p: 'mempercepat penanganan pasien' }], balik: [{ t: 'Telemedisin justru memperlambat penanganan pasien di daerah terpencil.', p: 'memperlambat penanganan pasien' }] },
            terbalik: [{ t: 'Penanganan pasien yang cepat di daerah terpencil mendorong makin banyak warga memakai telemedisin.', p: 'mendorong makin banyak warga memakai telemedisin', dari: 'tangani', ke: 'tele', arah: 'naik' }] } },
        { id: 'status', jenis: 'status', hal: 'antrean', var: {
          teori: ['Secara teori, layanan ini juga dapat mengurangi antrean di poliklinik rumah sakit secara nyata.'],
          belum: ['Secara teori, layanan ini juga dapat mengurangi antrean di poliklinik rumah sakit, tetapi dampak itu belum terbukti dalam praktik.'] },
          klaim: {
            terbukti: ['Telemedisin telah terbukti mengurangi antrean di poliklinik rumah sakit secara nyata.'],
            mungkin: ['Pada prinsipnya, telemedisin dapat mengurangi antrean di poliklinik rumah sakit.'],
            belum: ['Dampak telemedisin terhadap antrean di poliklinik rumah sakit belum terbukti.'] } },
        { id: 'syarat', jenis: 'syarat', aksi: 'gratis', min: 1, maks: 12, langkah: 1, var: {
          perlu: ['Konsultasi gratis hanya diberikan kepada pasien yang telah berlangganan sekurang-kurangnya {t} bulan.'],
          cukup: ['Setiap pasien yang telah berlangganan {t} bulan atau lebih otomatis memperoleh satu kali konsultasi gratis.'] },
          klaim: { pasti: ['Pasien yang telah berlangganan selama {v} bulan pasti memperoleh konsultasi gratis.'], tidak: ['Pasien yang telah berlangganan selama {v} bulan tidak dapat memperoleh konsultasi gratis.'] } },
        { id: 'kuantor', jenis: 'kuantor', kelompok: 'dokter', var: {
          sebagian: ['Meski demikian, sebagian dokter masih ragu memberikan diagnosis tanpa pemeriksaan fisik.'],
          'tidak-semua': ['Meski demikian, tidak semua dokter bersedia memberikan diagnosis tanpa pemeriksaan fisik.'] },
          klaim: {
            sebagian: { 'tidak-ada': ['Tidak ada dokter yang ragu memberikan diagnosis tanpa pemeriksaan fisik.'], 'sebagian-besar': ['Sebagian besar dokter masih ragu memberikan diagnosis tanpa pemeriksaan fisik.'], ada: ['Ada dokter yang masih ragu memberikan diagnosis tanpa pemeriksaan fisik.'] },
            'tidak-semua': { semua: ['Semua dokter bersedia memberikan diagnosis tanpa pemeriksaan fisik.'], 'ada-tidak': ['Ada dokter yang tidak bersedia memberikan diagnosis tanpa pemeriksaan fisik.'] } } },
        { id: 'hambatan', jenis: 'daftar', subjek: 'tele', himp: 'hambatan', pool: ['data', 'internet', 'digital', 'aturan', 'tarif'], n: [2, 3],
          var: { terbuka: ['Telemedisin juga masih menghadapi sejumlah tantangan, seperti {daftar}.', 'Tantangan yang masih perlu dijawab antara lain {daftar}.'] },
          klaim: { terbuka: { ya: ['{x} merupakan salah satu tantangan telemedisin.'], tunggal: ['Satu-satunya tantangan telemedisin adalah {x}.'] } } }
      ]
    },
    {
      id: 'surya', judul: 'Listrik Surya Atap',
      istilah: {
        surya: 'panel surya atap', pasang: 'pemasangan panel', pasokan: 'pasokan listrik', fosil: 'pemakaian pembangkit',
        mono: 'panel monokristal', poli: 'panel polikristal', tipis: 'panel lapisan tipis', tagihan: 'tagihan listrik', listrikPanel: 'listrik dari panel',
        lampu: 'penerangan rumah', pompa: 'pompa air', kulkas: 'lemari pendingin', kipas: 'kipas angin',
        motor: { n: 'pengisian daya sepeda motor listrik', p: 'mengisi daya motor listrik' },
        biaya: 'biaya pemasangan awal yang besar', mendung: 'cuaca mendung yang berkepanjangan', sambung: 'rumitnya prosedur penyambungan ke jaringan',
        teknisi: 'terbatasnya teknisi pemasang', debu: 'debu yang menutupi permukaan panel',
        atapRumah: 'atap rumah', atapKota: 'atap rumah', potongan: 'potongan tagihan'
      },
      alur: [
        { id: 'def', jenis: 'latar', wajib: true, var: [
          'Panel surya atap memungkinkan rumah tangga menghasilkan listrik sendiri dari sinar matahari.',
          'Semakin banyak rumah tangga memasang panel surya di atap untuk menghasilkan listrik sendiri.'] },
        { id: 'tesis', jenis: 'latar', var: [
          'Banyak pihak menilai teknologi ini penting untuk mempercepat peralihan ke energi bersih.',
          'Teknologi ini dianggap sebagai salah satu cara paling mudah bagi warga untuk ikut beralih ke energi bersih.'] },
        { id: 'banding', jenis: 'banding', urut: ['mono', 'poli', 'tipis'], adj: 'efisien', var: { rantai: [
          'Dalam mengubah sinar matahari menjadi listrik, panel monokristal lebih efisien daripada panel polikristal, sedangkan panel polikristal lebih efisien daripada panel lapisan tipis.',
          ['Panel monokristal lebih efisien daripada panel polikristal.', 'Panel polikristal sendiri lebih efisien daripada panel lapisan tipis.']] },
          klaim: ['{X} lebih efisien daripada {Y}.'] },
        { id: 'sebab', jenis: 'sebab', ket: ['pemasangan panel meningkatkan pasokan listrik dari sumber terbarukan', 'pasokan listrik yang bertambah mengurangi pemakaian pembangkit berbahan bakar fosil'], akhir: 'pemasangan panel pada akhirnya ikut mengurangi pemakaian pembangkit berbahan bakar fosil', mata: [
          { dari: 'pasang', ke: 'pasokan', arah: 'naik', var: [{ t: 'Pemasangan panel di atap meningkatkan pasokan listrik dari sumber terbarukan.', p: 'meningkatkan pasokan listrik' }] },
          { dari: 'pasokan', ke: 'fosil', arah: 'turun', var: [{ t: 'Pasokan listrik yang bertambah pada gilirannya mengurangi pemakaian pembangkit berbahan bakar fosil.', p: 'mengurangi pemakaian pembangkit' }] }],
          gabung: [{ t: 'Pemasangan panel di atap meningkatkan pasokan listrik dari sumber terbarukan, dan pasokan listrik yang bertambah pada gilirannya mengurangi pemakaian pembangkit berbahan bakar fosil.', p: ['meningkatkan pasokan listrik', 'mengurangi pemakaian pembangkit'] }],
          klaim: {
            m0: { sama: [{ t: 'Pemasangan panel di atap menambah pasokan listrik dari sumber terbarukan.', p: 'menambah pasokan listrik' }], balik: [{ t: 'Pemasangan panel di atap mengurangi pasokan listrik dari sumber terbarukan.', p: 'mengurangi pasokan listrik' }] },
            m1: { sama: [{ t: 'Pasokan listrik terbarukan yang bertambah ikut mengurangi pemakaian pembangkit berbahan bakar fosil.', p: 'mengurangi pemakaian pembangkit' }], balik: [{ t: 'Pasokan listrik terbarukan yang bertambah justru meningkatkan pemakaian pembangkit berbahan bakar fosil.', p: 'meningkatkan pemakaian pembangkit' }] },
            rantai: { sama: [{ t: 'Pemasangan panel di atap turut mengurangi pemakaian pembangkit berbahan bakar fosil.', p: 'mengurangi pemakaian pembangkit' }], balik: [{ t: 'Pemasangan panel di atap justru menambah pemakaian pembangkit berbahan bakar fosil.', p: 'menambah pemakaian pembangkit' }] },
            terbalik: [{ t: 'Pemakaian pembangkit berbahan bakar fosil yang tinggi mendorong warga memasang panel di atap.', p: 'mendorong warga memasang panel', dari: 'fosil', ke: 'pasang', arah: 'naik', nk: 'memasang panel' }] } },
        { id: 'status', jenis: 'status', hal: 'tagihan', var: {
          teori: ['Secara teori, rumah tangga yang memasang panel dapat memangkas tagihan listriknya hingga separuh.'],
          belum: ['Secara teori, rumah tangga yang memasang panel dapat memangkas tagihan listriknya hingga separuh, tetapi angka itu belum terbukti dalam praktik.'],
          terbukti: ['Pengalaman ribuan rumah tangga membuktikan bahwa pemasangan panel memangkas tagihan listrik hingga separuh.'] },
          klaim: {
            terbukti: ['Pemasangan panel surya atap telah terbukti memangkas tagihan listrik rumah tangga hingga separuh.'],
            mungkin: ['Pada prinsipnya, panel surya atap dapat memangkas tagihan listrik rumah tangga hingga separuh.'],
            belum: ['Penghematan tagihan listrik hingga separuh berkat panel surya atap belum terbukti.'] } },
        { id: 'pakai', jenis: 'daftar', subjek: 'listrikPanel', himp: 'pakai', pool: ['lampu', 'pompa', 'kulkas', 'motor', 'kipas'], n: [3, 4],
          var: { terbuka: ['Listrik yang dihasilkan dapat dipakai untuk berbagai keperluan, seperti {daftar}.'], tertutup: ['Pada sistem berkapasitas kecil, listriknya hanya cukup untuk {daftar}.'] },
          klaim: {
            terbuka: { ya: ['Listrik dari panel surya atap dapat dipakai untuk {x}.'], tidak: ['Listrik dari panel surya atap tidak dapat dipakai untuk {x}.'] },
            tertutup: { ya: ['Listrik dari sistem berkapasitas kecil cukup untuk {x}.'], tidak: ['Listrik dari sistem berkapasitas kecil tidak cukup untuk {x}.'] } } },
        { id: 'hambatan', jenis: 'daftar', subjek: 'surya', himp: 'hambatan', pool: ['biaya', 'mendung', 'sambung', 'teknisi', 'debu'], n: [2, 3],
          var: { terbuka: ['Meski begitu, pemanfaatannya masih terkendala sejumlah hal, seperti {daftar}.', 'Namun, ada beberapa kendala yang kerap dikeluhkan, antara lain {daftar}.'] },
          klaim: { terbuka: { ya: ['{x} merupakan salah satu kendala pemanfaatan panel surya atap.'], tunggal: ['Satu-satunya kendala pemanfaatan panel surya atap adalah {x}.'] } } },
        { id: 'kuantor', jenis: 'kuantor', kelompok: { 'tidak-semua': 'atapRumah', sebagian: 'atapKota' }, var: {
          'tidak-semua': ['Perlu diingat, tidak semua atap rumah cocok untuk dipasangi panel surya.'],
          sebagian: ['Di kota-kota besar, sebagian atap rumah kini sudah dipasangi panel surya.'] },
          klaim: {
            'tidak-semua': { semua: ['Semua atap rumah cocok untuk dipasangi panel surya.'], 'ada-tidak': ['Ada atap rumah yang tidak cocok untuk dipasangi panel surya.'] },
            sebagian: { 'tidak-ada': ['Tidak ada atap rumah di kota besar yang sudah dipasangi panel surya.'], 'sebagian-besar': ['Sebagian besar atap rumah di kota besar sudah dipasangi panel surya.'], ada: ['Ada atap rumah di kota besar yang sudah dipasangi panel surya.'] } } },
        { id: 'syarat', jenis: 'syarat', aksi: 'potongan', min: 1, maks: 10, langkah: 1, var: {
          perlu: ['Potongan tagihan dari perusahaan listrik hanya diberikan kepada pemilik panel berkapasitas sekurang-kurangnya {t} kilowatt.'],
          cukup: ['Setiap pemilik panel berkapasitas {t} kilowatt atau lebih otomatis memperoleh potongan tagihan dari perusahaan listrik.'] },
          klaim: { pasti: ['Pemilik panel berkapasitas {v} kilowatt pasti memperoleh potongan tagihan dari perusahaan listrik.'], tidak: ['Pemilik panel berkapasitas {v} kilowatt tidak dapat memperoleh potongan tagihan dari perusahaan listrik.'] } }
      ]
    },
    {
      id: 'angkutan', judul: 'Angkutan Perkotaan',
      istilah: {
        kota: 'angkutan umum perkotaan', massal: 'angkutan massal berjalur khusus', reguler: 'angkutan umum reguler',
        brt: 'bus rapid transit', krl: 'kereta rel listrik', mrt: 'kereta bawah tanah', angkot: 'angkutan kota', ojek: 'ojek daring',
        jalur: 'jalur khusus', tepat: 'ketepatan waktu', minat: 'minat warga', halte: 'halte', rute: 'rute bus',
        info: 'papan informasi kedatangan', landai: { n: 'jalur landai untuk kursi roda', p: 'akses bagi pengguna kursi roda' },
        sepeda: 'tempat parkir sepeda', dingin: 'ruang tunggu berpendingin', isi: { n: 'mesin isi ulang kartu', p: 'tempat mengisi saldo kartu perjalanan' },
        wajibKartu: 'kewajiban membayar nontunai', balita: 'anak di bawah lima tahun', disabilitas: 'penyandang disabilitas yang didampingi petugas',
        subsidi: 'subsidi operasional yang terbatas', jarak: 'jarak halte yang jauh dari permukiman', jadwal: 'jadwal yang belum terpadu antarmoda',
        trotoar: 'trotoar menuju halte yang tidak nyaman', parkir: 'tarif parkir di pusat kota yang terlalu murah',
        diskon: 'potongan tarif', macet: 'kemacetan di pusat kota'
      },
      alur: [
        { id: 'def', jenis: 'latar', wajib: true, var: [
          'Banyak kota besar kini berlomba memperbaiki layanan angkutan umum perkotaan.',
          'Pembenahan angkutan umum perkotaan menjadi agenda utama banyak kota besar.'] },
        { id: 'gol', jenis: 'golongan', induk: 'kota', anggota: ['massal', 'reguler'], kata: 'golongan', var: [
          'Angkutan umum perkotaan dapat dibedakan menjadi dua golongan, yaitu angkutan massal berjalur khusus dan angkutan umum reguler.',
          'Secara umum, ada dua golongan angkutan umum perkotaan, yaitu angkutan massal berjalur khusus dan angkutan umum reguler.'] },
        { id: 'cakupan', jenis: 'cakupan', ikut: 'gol', x: 'massal', masuk: ['brt', 'krl', 'mrt'], nMasuk: [2, 3], keluar: ['angkot', 'ojek'], var: [
          { t: 'Angkutan massal berjalur khusus mencakup {masuk}, tetapi tidak termasuk {keluar}.', pm: 'mencakup', pk: 'tidak termasuk' },
          { t: 'Yang tergolong angkutan massal berjalur khusus antara lain {masuk}, sedangkan {keluar} tidak termasuk di dalamnya.', pm: 'tergolong', pk: 'tidak termasuk' }] },
        { id: 'sebab', jenis: 'sebab', ket: ['jalur khusus meningkatkan ketepatan waktu kedatangan bus', 'ketepatan waktu yang lebih baik menambah minat warga untuk beralih dari kendaraan pribadi'], akhir: 'jalur khusus pada akhirnya ikut menambah minat warga untuk beralih dari kendaraan pribadi', mata: [
          { dari: 'jalur', ke: 'tepat', arah: 'naik', var: [{ t: 'Jalur khusus meningkatkan ketepatan waktu kedatangan bus.', p: 'meningkatkan ketepatan waktu' }] },
          { dari: 'tepat', ke: 'minat', arah: 'naik', var: [{ t: 'Ketepatan waktu yang lebih baik pada gilirannya menambah minat warga untuk beralih dari kendaraan pribadi.', p: 'menambah minat warga' }] }],
          gabung: [{ t: 'Jalur khusus meningkatkan ketepatan waktu kedatangan bus, dan ketepatan waktu yang lebih baik pada gilirannya menambah minat warga untuk beralih dari kendaraan pribadi.', p: ['meningkatkan ketepatan waktu', 'menambah minat warga'] }],
          klaim: {
            m0: { sama: [{ t: 'Ketepatan waktu kedatangan bus meningkat berkat adanya jalur khusus.', p: 'ketepatan waktu kedatangan bus meningkat' }], balik: [{ t: 'Jalur khusus menurunkan ketepatan waktu kedatangan bus.', p: 'menurunkan ketepatan waktu' }] },
            m1: { sama: [{ t: 'Ketepatan waktu yang lebih baik ikut menambah minat warga untuk beralih dari kendaraan pribadi.', p: 'menambah minat warga' }], balik: [{ t: 'Ketepatan waktu yang lebih baik justru mengurangi minat warga untuk beralih dari kendaraan pribadi.', p: 'mengurangi minat warga' }] },
            rantai: { sama: [{ t: 'Jalur khusus bus turut menambah minat warga untuk beralih dari kendaraan pribadi.', p: 'menambah minat warga' }], balik: [{ t: 'Jalur khusus bus justru mengurangi minat warga untuk beralih dari kendaraan pribadi.', p: 'mengurangi minat warga' }] },
            terbalik: [{ t: 'Minat warga yang tinggi untuk beralih dari kendaraan pribadi mendorong pemerintah membangun jalur khusus.', p: 'mendorong pemerintah membangun jalur khusus', dari: 'minat', ke: 'jalur', arah: 'naik' }] } },
        { id: 'status', jenis: 'status', hal: 'macet', var: {
          teori: ['Secara teori, peralihan pengguna mobil ke angkutan massal dapat mengurangi kemacetan di pusat kota secara drastis.'],
          belum: ['Secara teori, peralihan pengguna mobil ke angkutan massal dapat mengurangi kemacetan di pusat kota secara drastis, tetapi hal itu belum terbukti dalam praktik.'],
          terbukti: ['Pengalaman beberapa kota besar membuktikan bahwa peralihan pengguna mobil ke angkutan massal mengurangi kemacetan di pusat kota secara drastis.'] },
          klaim: {
            terbukti: ['Peralihan pengguna mobil ke angkutan massal telah terbukti mengurangi kemacetan di pusat kota secara drastis.'],
            mungkin: ['Pada prinsipnya, peralihan pengguna mobil ke angkutan massal dapat mengurangi kemacetan di pusat kota.'],
            belum: ['Dampak peralihan pengguna mobil ke angkutan massal terhadap kemacetan di pusat kota belum terbukti.'] } },
        { id: 'fasilitas', jenis: 'daftar', subjek: 'halte', himp: 'fasilitas', pool: ['info', 'landai', 'sepeda', 'dingin', 'isi'], tdBoleh: ['info', 'landai', 'sepeda', 'dingin'], n: [3, 4],
          var: { terbuka: ['Sejumlah halte juga dilengkapi berbagai fasilitas, seperti {daftar}.'], tertutup: ['Halte-halte yang baru dibangun hanya dilengkapi {daftar}.'] },
          klaim: {
            terbuka: { ya: ['Ada halte yang dilengkapi {x}.'], tidak: ['Tidak ada halte yang dilengkapi {x}.'] },
            tertutup: { ya: ['Halte-halte yang baru dibangun dilengkapi {x}.'], tidak: ['Halte-halte yang baru dibangun tidak dilengkapi {x}.'] } } },
        { id: 'kecuali', jenis: 'kecuali', y: 'wajibKartu', pool: ['balita', 'disabilitas'], var: [
          'Pembayaran nontunai diwajibkan bagi seluruh penumpang, kecuali {k}.'],
          klaim: { ya: ['{k} juga wajib membayar secara nontunai.'], tidak: ['{k} tidak wajib membayar secara nontunai.'] } },
        { id: 'kuantor', jenis: 'kuantor', kelompok: 'rute', var: {
          'tidak-semua': ['Sayangnya, tidak semua rute bus sudah terhubung dengan stasiun kereta.'],
          sebagian: ['Saat ini sebagian rute bus sudah terhubung dengan stasiun kereta.'] },
          klaim: {
            'tidak-semua': { semua: ['Semua rute bus sudah terhubung dengan stasiun kereta.'], 'ada-tidak': ['Ada rute bus yang belum terhubung dengan stasiun kereta.'] },
            sebagian: { 'tidak-ada': ['Tidak ada rute bus yang terhubung dengan stasiun kereta.'], 'sebagian-besar': ['Sebagian besar rute bus sudah terhubung dengan stasiun kereta.'], ada: ['Ada rute bus yang sudah terhubung dengan stasiun kereta.'] } } },
        { id: 'hambatan', jenis: 'daftar', subjek: 'kota', himp: 'hambatan', pool: ['subsidi', 'jarak', 'jadwal', 'trotoar', 'parkir'], tdBoleh: ['subsidi', 'jarak', 'trotoar', 'parkir'], n: [2, 3],
          var: { terbuka: ['Namun demikian, pembenahan ini masih menghadapi hambatan, seperti {daftar}.', 'Upaya itu masih terganjal sejumlah persoalan, antara lain {daftar}.'] },
          klaim: { terbuka: { ya: ['{x} merupakan salah satu hambatan dalam pembenahan angkutan perkotaan.'], tunggal: ['Satu-satunya hambatan dalam pembenahan angkutan perkotaan adalah {x}.'] } } },
        { id: 'syarat', jenis: 'syarat', aksi: 'diskon', min: 10, maks: 60, langkah: 2, var: {
          perlu: ['Potongan tarif hanya diberikan kepada penumpang yang melakukan sekurang-kurangnya {t} perjalanan dalam sebulan.'],
          cukup: ['Setiap penumpang yang melakukan {t} perjalanan atau lebih dalam sebulan otomatis memperoleh potongan tarif.'] },
          klaim: { pasti: ['Penumpang yang melakukan {v} perjalanan dalam sebulan pasti memperoleh potongan tarif.'], tidak: ['Penumpang yang melakukan {v} perjalanan dalam sebulan tidak dapat memperoleh potongan tarif.'] } }
      ]
    },
    {
      id: 'irigasi', judul: 'Irigasi Pertanian',
      istilah: {
        sistem: 'sistem irigasi', permukaan: 'irigasi permukaan', tekanan: 'irigasi bertekanan',
        tetes: 'irigasi tetes', curah: 'irigasi curah', genangan: 'irigasi genangan', alur: 'irigasi alur',
        pupuk: 'ketepatan pemberian pupuk', panen: 'hasil panen',
        cabai: 'cabai', tomat: 'tomat', melon: 'melon', bawang: 'bawang merah', stroberi: 'stroberi',
        lahan: 'lahan', petani: 'petani', hemat: 'penghematan air', bantuan: 'bantuan perangkat',
        harga: 'harga perangkat yang mahal', sumbat: 'selang yang mudah tersumbat kotoran', dampingan: 'kurangnya pendampingan teknis', suku: 'sulitnya mendapatkan suku cadang'
      },
      alur: [
        { id: 'def', jenis: 'latar', wajib: true, var: [
          'Kekeringan yang makin sering terjadi mendorong petani mencari cara mengairi lahan dengan lebih hemat.',
          'Musim kemarau yang makin panjang memaksa petani mencari cara mengairi lahan dengan lebih hemat.'] },
        { id: 'gol', jenis: 'golongan', induk: 'sistem', anggota: ['permukaan', 'tekanan'], kata: 'golongan', var: [
          'Sistem irigasi di lahan pertanian dapat dibedakan menjadi dua golongan, yaitu irigasi permukaan dan irigasi bertekanan.'] },
        { id: 'cakupan', jenis: 'cakupan', ikut: 'gol', x: 'tekanan', masuk: ['tetes', 'curah'], keluar: ['genangan', 'alur'], var: [
          { t: 'Irigasi bertekanan mencakup {masuk}, tetapi tidak termasuk {keluar}.', pm: 'mencakup', pk: 'tidak termasuk' },
          { t: 'Irigasi bertekanan mencakup {masuk}, sedangkan {keluar} tergolong irigasi permukaan.', pm: 'mencakup', pk: 'tergolong', keluarKe: 'permukaan' }] },
        { id: 'banding', jenis: 'banding', urut: ['tetes', 'curah', 'genangan'], adj: 'hemat air', var: { rantai: [
          'Irigasi tetes lebih hemat air daripada irigasi curah, sedangkan irigasi curah lebih hemat air daripada irigasi genangan.',
          ['Irigasi tetes lebih hemat air daripada irigasi curah.', 'Irigasi curah sendiri lebih hemat air daripada irigasi genangan.']] },
          klaim: ['{X} lebih hemat air daripada {Y}.'] },
        { id: 'sebab', jenis: 'sebab', ket: ['irigasi tetes meningkatkan ketepatan pemberian pupuk cair', 'ketepatan pemberian pupuk yang lebih baik menaikkan hasil panen'], akhir: 'irigasi tetes pada akhirnya ikut menaikkan hasil panen', mata: [
          { dari: 'tetes', ke: 'pupuk', arah: 'naik', var: [{ t: 'Irigasi tetes meningkatkan ketepatan pemberian pupuk cair.', p: 'meningkatkan ketepatan pemberian pupuk' }] },
          { dari: 'pupuk', ke: 'panen', arah: 'naik', var: [{ t: 'Ketepatan pemberian pupuk yang lebih baik pada gilirannya menaikkan hasil panen.', p: 'menaikkan hasil panen' }] }],
          gabung: [{ t: 'Irigasi tetes meningkatkan ketepatan pemberian pupuk cair, dan ketepatan itu pada gilirannya menaikkan hasil panen.', p: ['meningkatkan ketepatan pemberian pupuk', 'menaikkan hasil panen'] }],
          klaim: {
            m0: { sama: [{ t: 'Irigasi tetes membuat ketepatan pemberian pupuk cair meningkat.', p: 'ketepatan pemberian pupuk cair meningkat' }], balik: [{ t: 'Irigasi tetes menurunkan ketepatan pemberian pupuk cair.', p: 'menurunkan ketepatan pemberian pupuk' }] },
            m1: { sama: [{ t: 'Ketepatan pemberian pupuk yang lebih baik ikut menaikkan hasil panen.', p: 'menaikkan hasil panen' }], balik: [{ t: 'Ketepatan pemberian pupuk yang lebih baik justru menurunkan hasil panen.', p: 'menurunkan hasil panen' }] },
            rantai: { sama: [{ t: 'Irigasi tetes turut menaikkan hasil panen.', p: 'menaikkan hasil panen' }], balik: [{ t: 'Irigasi tetes justru menurunkan hasil panen.', p: 'menurunkan hasil panen' }] },
            terbalik: [{ t: 'Hasil panen sayuran yang tinggi mendorong petani beralih ke irigasi tetes.', p: 'mendorong petani beralih ke irigasi tetes', dari: 'panen', ke: 'tetes', arah: 'naik' }] } },
        { id: 'status', jenis: 'status', hal: 'hemat', var: {
          teori: ['Secara teori, peralihan ke irigasi tetes dapat menghemat pemakaian air hingga 60 persen.'],
          belum: ['Secara teori, peralihan ke irigasi tetes dapat menghemat pemakaian air hingga 60 persen, tetapi angka itu belum terbukti di lapangan.'] },
          klaim: {
            terbukti: ['Peralihan ke irigasi tetes telah terbukti menghemat pemakaian air hingga 60 persen.'],
            mungkin: ['Pada prinsipnya, peralihan ke irigasi tetes dapat menghemat pemakaian air hingga 60 persen.'],
            belum: ['Penghematan air hingga 60 persen berkat irigasi tetes belum terbukti di lapangan.'] } },
        { id: 'tanaman', jenis: 'daftar', subjek: 'tetes', himp: 'tanaman', pool: ['cabai', 'tomat', 'melon', 'bawang', 'stroberi'], n: [3, 4],
          var: { terbuka: ['Irigasi tetes cocok untuk berbagai tanaman bernilai tinggi, seperti {daftar}.'], tertutup: ['Di sebuah kebun percontohan, irigasi tetes hanya diterapkan pada tanaman {daftar}.'] },
          klaim: {
            terbuka: { ya: ['Irigasi tetes cocok untuk tanaman {x}.'], tidak: ['Irigasi tetes tidak cocok untuk tanaman {x}.'] },
            tertutup: { ya: ['Di kebun percontohan tersebut, irigasi tetes diterapkan pada tanaman {x}.'], tidak: ['Di kebun percontohan tersebut, irigasi tetes tidak diterapkan pada tanaman {x}.'] } } },
        { id: 'kuantor', jenis: 'kuantor', kelompok: { 'tidak-semua': 'lahan', sebagian: 'petani' }, var: {
          'tidak-semua': ['Meski demikian, tidak semua lahan memiliki sumber air yang cukup dekat untuk irigasi tetes.'],
          sebagian: ['Di daerah yang sering dilanda kekeringan, sebagian petani sudah beralih ke irigasi tetes.'] },
          klaim: {
            'tidak-semua': { semua: ['Semua lahan memiliki sumber air yang cukup dekat untuk irigasi tetes.'], 'ada-tidak': ['Ada lahan yang tidak memiliki sumber air cukup dekat untuk irigasi tetes.'] },
            sebagian: { 'tidak-ada': ['Belum ada petani di daerah yang sering dilanda kekeringan yang beralih ke irigasi tetes.'], 'sebagian-besar': ['Sebagian besar petani di daerah yang sering dilanda kekeringan sudah beralih ke irigasi tetes.'], ada: ['Ada petani di daerah yang sering dilanda kekeringan yang sudah beralih ke irigasi tetes.'] } } },
        { id: 'hambatan', jenis: 'daftar', subjek: 'tetes', himp: 'hambatan', pool: ['harga', 'sumbat', 'dampingan', 'suku'], tdBoleh: ['sumbat', 'dampingan', 'suku'], n: [2, 3],
          var: { terbuka: ['Namun, petani masih menghadapi sejumlah kendala, seperti {daftar}.', 'Penerapannya juga tidak lepas dari kendala, antara lain {daftar}.'] },
          klaim: { terbuka: { ya: ['{x} merupakan salah satu kendala penerapan irigasi tetes.'], tunggal: ['Satu-satunya kendala penerapan irigasi tetes adalah {x}.'] } } },
        { id: 'syarat', jenis: 'syarat', aksi: 'bantuan', min: 1, maks: 10, langkah: 1, var: {
          perlu: ['Bantuan perangkat dari dinas pertanian hanya diberikan kepada kelompok tani dengan luas lahan sekurang-kurangnya {t} hektare.'],
          cukup: ['Setiap kelompok tani dengan luas lahan {t} hektare atau lebih otomatis memperoleh bantuan perangkat dari dinas pertanian.'] },
          klaim: { pasti: ['Kelompok tani dengan luas lahan {v} hektare pasti memperoleh bantuan perangkat dari dinas pertanian.'], tidak: ['Kelompok tani dengan luas lahan {v} hektare tidak dapat memperoleh bantuan perangkat dari dinas pertanian.'] } }
      ]
    },
    {
      id: 'desawisata', judul: 'Desa Wisata',
      istilah: {
        kegiatan: 'kegiatan di desa wisata', alam: 'wisata alam', budaya: 'wisata budaya',
        tari: 'pertunjukan tari tradisional', batik: 'kelas membatik', adat: 'upacara adat', hutan: 'penjelajahan hutan', sungai: 'susur sungai',
        datang: 'kedatangan wisatawan', peduli: 'kepedulian warga', lingkungan: 'kualitas lingkungan', desa: 'desa wisata', warga: 'warga',
        tiket: { n: 'tiket masuk', p: 'penjualan karcis masuk' }, kerajinan: { n: 'penjualan kerajinan', p: 'penjualan barang kerajinan' },
        kuliner: { n: 'paket kuliner lokal', p: 'penjualan makanan khas setempat' }, pemandu: { n: 'jasa pemandu wisata', p: 'layanan pemandu wisata' },
        parkir: { n: 'parkir kendaraan', p: 'jasa parkir kendaraan' }, sepeda: { n: 'sewa sepeda', p: 'penyewaan sepeda' },
        jalan: 'akses jalan yang sempit', promosi: 'promosi yang belum gencar', bahasa: 'terbatasnya kemampuan berbahasa asing',
        sinyal: 'sinyal telepon yang lemah', saing: 'persaingan dengan desa wisata lain', urban: 'perpindahan pemuda ke kota', dana: 'dana pengembangan'
      },
      alur: [
        { id: 'def', jenis: 'latar', wajib: true, var: [
          'Desa wisata menawarkan pengalaman tinggal dan berkegiatan bersama warga di pedesaan.',
          'Banyak desa kini mengembangkan diri menjadi desa wisata yang menawarkan pengalaman hidup bersama warga.'] },
        { id: 'gol', jenis: 'golongan', induk: 'kegiatan', anggota: ['alam', 'budaya'], kata: 'jenis', var: [
          'Kegiatan di desa wisata dibedakan menjadi dua jenis, yaitu wisata alam dan wisata budaya.'] },
        { id: 'cakupan', jenis: 'cakupan', ikut: 'gol', x: 'budaya', masuk: ['tari', 'batik', 'adat'], nMasuk: [2, 3], keluar: ['hutan', 'sungai'], var: [
          { t: 'Wisata budaya mencakup {masuk}, sedangkan {keluar} termasuk wisata alam.', pm: 'mencakup', pk: 'termasuk', keluarKe: 'alam' },
          { t: 'Yang tergolong wisata budaya antara lain {masuk}, tetapi tidak termasuk {keluar}.', pm: 'tergolong', pk: 'tidak termasuk' }] },
        { id: 'tesis', jenis: 'latar', var: ['Model ini dinilai mampu menggerakkan ekonomi desa tanpa merusak kekhasan budayanya.'] },
        { id: 'sebab', jenis: 'sebab', ket: ['kedatangan wisatawan meningkatkan kepedulian warga terhadap kebersihan desa', 'kepedulian warga yang tumbuh memperbaiki kualitas lingkungan'], akhir: 'kedatangan wisatawan pada akhirnya ikut memperbaiki kualitas lingkungan desa', mata: [
          { dari: 'datang', ke: 'peduli', arah: 'naik', var: [{ t: 'Kedatangan wisatawan meningkatkan kepedulian warga terhadap kebersihan desa.', p: 'meningkatkan kepedulian warga' }] },
          { dari: 'peduli', ke: 'lingkungan', arah: 'naik', var: [{ t: 'Kepedulian warga yang tumbuh pada gilirannya memperbaiki kualitas lingkungan desa.', p: 'memperbaiki kualitas lingkungan' }] }],
          gabung: [{ t: 'Kedatangan wisatawan meningkatkan kepedulian warga terhadap kebersihan desa, dan kepedulian itu pada gilirannya memperbaiki kualitas lingkungan.', p: ['meningkatkan kepedulian warga', 'memperbaiki kualitas lingkungan'] }],
          klaim: {
            m0: { sama: [{ t: 'Kepedulian warga terhadap kebersihan desa meningkat berkat kedatangan wisatawan.', p: 'kepedulian warga terhadap kebersihan desa meningkat' }], balik: [{ t: 'Kedatangan wisatawan menurunkan kepedulian warga terhadap kebersihan desa.', p: 'menurunkan kepedulian warga' }] },
            m1: { sama: [{ t: 'Kepedulian warga yang tumbuh ikut memperbaiki kualitas lingkungan desa.', p: 'memperbaiki kualitas lingkungan' }], balik: [{ t: 'Kepedulian warga yang tumbuh justru memperburuk kualitas lingkungan desa.', p: 'memperburuk kualitas lingkungan' }] },
            rantai: { sama: [{ t: 'Kedatangan wisatawan turut memperbaiki kualitas lingkungan desa.', p: 'memperbaiki kualitas lingkungan' }], balik: [{ t: 'Kedatangan wisatawan justru memperburuk kualitas lingkungan desa.', p: 'memperburuk kualitas lingkungan' }] },
            terbalik: [{ t: 'Kualitas lingkungan yang baik mendorong lebih banyak wisatawan datang ke desa.', p: 'mendorong lebih banyak wisatawan datang', dari: 'lingkungan', ke: 'datang', arah: 'naik', nk: 'wisatawan datang' }] } },
        { id: 'pendapatan', jenis: 'daftar', subjek: 'desa', himp: 'pendapatan', pool: ['tiket', 'kerajinan', 'kuliner', 'pemandu', 'parkir', 'sepeda'], tdBoleh: ['tiket', 'pemandu', 'parkir', 'sepeda'], n: [3, 4],
          var: { terbuka: ['Pendapatan desa wisata berasal dari berbagai sumber, seperti {daftar}.'], tertutup: ['Pada tahap awal, pendapatan desa wisata hanya berasal dari {daftar}.'] },
          klaim: {
            terbuka: { ya: ['Desa wisata memperoleh pendapatan dari {x}.'], tidak: ['Desa wisata tidak memperoleh pendapatan dari {x}.'] },
            tertutup: { ya: ['Pada tahap awal, desa wisata sudah memperoleh pendapatan dari {x}.'], tidak: ['Pada tahap awal, desa wisata belum memperoleh pendapatan dari {x}.'] } } },
        { id: 'status', jenis: 'status', hal: 'urban', var: {
          teori: ['Secara teori, desa wisata dapat menahan laju perpindahan pemuda desa ke kota.'],
          belum: ['Secara teori, desa wisata dapat menahan laju perpindahan pemuda desa ke kota, tetapi dampak itu belum terbukti dalam praktik.'] },
          klaim: {
            terbukti: ['Desa wisata telah terbukti menahan laju perpindahan pemuda desa ke kota.'],
            mungkin: ['Pada prinsipnya, desa wisata dapat menahan laju perpindahan pemuda desa ke kota.'],
            belum: ['Dampak desa wisata terhadap perpindahan pemuda desa ke kota belum terbukti.'] } },
        { id: 'kuantor', jenis: 'kuantor', kelompok: 'warga', var: {
          'tidak-semua': ['Namun, tidak semua warga merasakan manfaat ekonomi dari kunjungan wisatawan.'],
          sebagian: ['Sebagian warga bahkan membuka rumahnya sebagai tempat menginap bagi wisatawan.'] },
          klaim: {
            'tidak-semua': { semua: ['Semua warga merasakan manfaat ekonomi dari kunjungan wisatawan.'], 'ada-tidak': ['Ada warga yang tidak merasakan manfaat ekonomi dari kunjungan wisatawan.'] },
            sebagian: { 'tidak-ada': ['Tidak ada warga yang membuka rumahnya sebagai tempat menginap bagi wisatawan.'], 'sebagian-besar': ['Sebagian besar warga membuka rumahnya sebagai tempat menginap bagi wisatawan.'], ada: ['Ada warga yang membuka rumahnya sebagai tempat menginap bagi wisatawan.'] } } },
        { id: 'hambatan', jenis: 'daftar', subjek: 'desa', himp: 'hambatan', pool: ['jalan', 'promosi', 'bahasa', 'sinyal', 'saing'], n: [2, 3],
          var: { terbuka: ['Pengembangannya juga masih menghadapi tantangan, seperti {daftar}.', 'Meski demikian, ada sejumlah kendala yang perlu diatasi, antara lain {daftar}.'] },
          klaim: { terbuka: { ya: ['{x} merupakan salah satu tantangan dalam pengembangan desa wisata.'], tunggal: ['Satu-satunya tantangan dalam pengembangan desa wisata adalah {x}.'] } } },
        { id: 'syarat', jenis: 'syarat', aksi: 'dana', min: 2, maks: 30, langkah: 2, var: {
          perlu: ['Dana pengembangan dari pemerintah daerah hanya diberikan kepada desa wisata yang dikunjungi sekurang-kurangnya {t} ribu wisatawan per tahun.'],
          cukup: ['Setiap desa wisata yang dikunjungi {t} ribu wisatawan atau lebih per tahun otomatis memperoleh dana pengembangan dari pemerintah daerah.'] },
          klaim: { pasti: ['Desa wisata yang dikunjungi {v} ribu wisatawan per tahun pasti memperoleh dana pengembangan dari pemerintah daerah.'], tidak: ['Desa wisata yang dikunjungi {v} ribu wisatawan per tahun tidak dapat memperoleh dana pengembangan dari pemerintah daerah.'] } }
      ]
    },
    {
      id: 'mangrove', judul: 'Hutan Mangrove',
      istilah: {
        manfaat: 'manfaat hutan mangrove', ekologis: 'manfaat ekologis', ekonomi: 'manfaat ekonomi',
        gelombang: 'peredaman gelombang', abrasi: 'pencegahan abrasi', ikan: 'penyediaan tempat berkembang biak ikan',
        olahan: 'penjualan hasil olahan buah mangrove', perahu: 'penyelenggaraan wisata perahu',
        akar: 'akar mangrove', endapan: 'endapan lumpur', daratan: 'daratan pantai', buah: 'buah mangrove',
        sirup: 'sirup', tepung: 'tepung kue', teh: { n: 'teh herbal', p: 'minuman seduhan herbal' }, pewarna: { n: 'pewarna batik alami', p: 'bahan pewarna batik' }, keripik: 'keripik',
        bibit: 'bibit', bibitRelawan: 'bibit', nelayan: 'kelompok nelayan', karbon: 'penyimpanan karbon', bantuanPerahu: 'bantuan perahu',
        tambak: 'alih fungsi lahan menjadi tambak', plastik: 'sampah plastik yang tersangkut di akar', tebang: 'penebangan liar',
        rawat: 'minimnya dana perawatan', limbah: 'limbah rumah tangga yang dibuang ke laut'
      },
      alur: [
        { id: 'def', jenis: 'latar', wajib: true, var: [
          'Hutan mangrove tumbuh di wilayah pasang surut sepanjang pantai tropis.',
          'Hutan mangrove banyak dijumpai di pesisir yang airnya dipengaruhi pasang surut.'] },
        { id: 'gol', jenis: 'golongan', induk: 'manfaat', anggota: ['ekologis', 'ekonomi'], kata: 'golongan', var: [
          'Manfaat hutan mangrove dapat dibedakan menjadi dua golongan, yaitu manfaat ekologis dan manfaat ekonomi.'] },
        { id: 'cakupan', jenis: 'cakupan', ikut: 'gol', x: 'ekologis', masuk: ['gelombang', 'abrasi', 'ikan'], nMasuk: [2, 3], keluar: ['olahan', 'perahu'], var: [
          { t: 'Manfaat ekologis mencakup {masuk}, sedangkan {keluar} tergolong manfaat ekonomi.', pm: 'mencakup', pk: 'tergolong', keluarKe: 'ekonomi' }] },
        { id: 'tesis', jenis: 'latar', var: ['Para ahli lingkungan menilai pelestariannya sama pentingnya dengan pelestarian hutan di daratan.'] },
        { id: 'sebab', jenis: 'sebab', ket: ['akar mangrove yang rapat menambah endapan lumpur di pesisir', 'endapan lumpur yang bertambah memperluas daratan pantai'], akhir: 'akar mangrove yang rapat pada akhirnya ikut memperluas daratan pantai', mata: [
          { dari: 'akar', ke: 'endapan', arah: 'naik', var: [{ t: 'Akar mangrove yang rapat menambah endapan lumpur di pesisir.', p: 'menambah endapan lumpur' }] },
          { dari: 'endapan', ke: 'daratan', arah: 'naik', var: [{ t: 'Endapan lumpur yang bertambah pada gilirannya memperluas daratan pantai.', p: 'memperluas daratan pantai' }] }],
          gabung: [{ t: 'Akar mangrove yang rapat menambah endapan lumpur di pesisir, dan endapan yang bertambah pada gilirannya memperluas daratan pantai.', p: ['menambah endapan lumpur', 'memperluas daratan pantai'] }],
          klaim: {
            m0: { sama: [{ t: 'Akar mangrove yang rapat membuat endapan lumpur di pesisir bertambah.', p: 'endapan lumpur di pesisir bertambah' }], balik: [{ t: 'Akar mangrove yang rapat mengurangi endapan lumpur di pesisir.', p: 'mengurangi endapan lumpur' }] },
            m1: { sama: [{ t: 'Endapan lumpur yang bertambah ikut memperluas daratan pantai.', p: 'memperluas daratan pantai' }], balik: [{ t: 'Endapan lumpur yang bertambah justru mempersempit daratan pantai.', p: 'mempersempit daratan pantai' }] },
            rantai: { sama: [{ t: 'Akar mangrove yang rapat turut memperluas daratan pantai.', p: 'memperluas daratan pantai' }], balik: [{ t: 'Akar mangrove yang rapat justru mempersempit daratan pantai.', p: 'mempersempit daratan pantai' }] },
            terbalik: [{ t: 'Daratan pantai yang luas mendorong akar mangrove tumbuh lebih rapat.', p: 'mendorong akar mangrove tumbuh lebih rapat', dari: 'daratan', ke: 'akar', arah: 'naik' }] } },
        { id: 'status', jenis: 'status', hal: 'karbon', var: {
          teori: ['Secara teori, hutan mangrove dapat menyimpan karbon berlipat-lipat lebih banyak daripada hutan daratan dengan luas yang sama.'],
          belum: ['Secara teori, hutan mangrove dapat menyimpan karbon berlipat-lipat lebih banyak daripada hutan daratan dengan luas yang sama, tetapi perkiraan itu belum terbukti melalui pengukuran langsung.'],
          terbukti: ['Pengukuran di sejumlah kawasan membuktikan bahwa hutan mangrove menyimpan karbon berlipat-lipat lebih banyak daripada hutan daratan dengan luas yang sama.'] },
          klaim: {
            terbukti: ['Hutan mangrove telah terbukti menyimpan karbon berlipat-lipat lebih banyak daripada hutan daratan dengan luas yang sama.'],
            mungkin: ['Pada prinsipnya, hutan mangrove dapat menyimpan karbon lebih banyak daripada hutan daratan dengan luas yang sama.'],
            belum: ['Kemampuan hutan mangrove menyimpan karbon lebih banyak daripada hutan daratan belum terbukti.'] } },
        { id: 'olahan', jenis: 'daftar', subjek: 'buah', himp: 'olahan', pool: ['sirup', 'tepung', 'teh', 'pewarna', 'keripik'], n: [3, 4],
          var: { terbuka: ['Buah dan daun mangrove tertentu dapat diolah menjadi berbagai produk, seperti {daftar}.'], tertutup: ['Sebuah kelompok perempuan pesisir hanya mengolah buah mangrove menjadi {daftar}.'] },
          klaim: {
            terbuka: { ya: ['Buah atau daun mangrove dapat diolah menjadi {x}.'], tidak: ['Buah atau daun mangrove tidak dapat diolah menjadi {x}.'] },
            tertutup: { ya: ['Kelompok perempuan pesisir tersebut mengolah buah mangrove menjadi {x}.'], tidak: ['Kelompok perempuan pesisir tersebut tidak mengolah buah mangrove menjadi {x}.'] } } },
        { id: 'kuantor', jenis: 'kuantor', kelompok: { 'tidak-semua': 'bibit', sebagian: 'bibitRelawan' }, var: {
          'tidak-semua': ['Sayangnya, tidak semua bibit mangrove yang ditanam berhasil tumbuh.'],
          sebagian: ['Sebagian bibit yang ditanam relawan lima tahun lalu kini sudah setinggi orang dewasa.'] },
          klaim: {
            'tidak-semua': { semua: ['Semua bibit mangrove yang ditanam berhasil tumbuh.'], 'ada-tidak': ['Ada bibit mangrove yang ditanam tetapi tidak berhasil tumbuh.'] },
            sebagian: { 'tidak-ada': ['Tidak ada bibit yang ditanam relawan lima tahun lalu yang kini sudah setinggi orang dewasa.'], 'sebagian-besar': ['Sebagian besar bibit yang ditanam relawan lima tahun lalu kini sudah setinggi orang dewasa.'], ada: ['Ada bibit yang ditanam relawan lima tahun lalu dan kini sudah setinggi orang dewasa.'] } } },
        { id: 'hambatan', jenis: 'daftar', subjek: 'mangrove', himp: 'hambatan', pool: ['tambak', 'plastik', 'tebang', 'rawat', 'limbah'], n: [2, 3],
          var: { terbuka: ['Namun, hutan mangrove terus terancam oleh berbagai hal, seperti {daftar}.', 'Kelestariannya kini terancam oleh sejumlah persoalan, antara lain {daftar}.'] },
          klaim: { terbuka: { ya: ['{x} merupakan salah satu ancaman bagi hutan mangrove.'], tunggal: ['Satu-satunya ancaman bagi hutan mangrove adalah {x}.'] } } },
        { id: 'syarat', jenis: 'syarat', aksi: 'bantuanPerahu', min: 2, maks: 30, langkah: 2, var: {
          perlu: ['Bantuan perahu hanya diberikan kepada kelompok nelayan yang menjaga kawasan mangrove seluas sekurang-kurangnya {t} hektare.'],
          cukup: ['Setiap kelompok nelayan yang menjaga kawasan mangrove seluas {t} hektare atau lebih otomatis memperoleh bantuan perahu.'] },
          klaim: { pasti: ['Kelompok nelayan yang menjaga kawasan mangrove seluas {v} hektare pasti memperoleh bantuan perahu.'], tidak: ['Kelompok nelayan yang menjaga kawasan mangrove seluas {v} hektare tidak dapat memperoleh bantuan perahu.'] } }
      ]
    },
    {
      id: 'literasi', judul: 'Literasi Keuangan',
      istilah: {
        program: 'program literasi keuangan', tatap: 'edukasi tatap muka', daring: 'edukasi daring',
        seminar: 'seminar di balai desa', kunjungan: 'kunjungan ke sekolah', pendampingan: 'pendampingan kelompok usaha',
        video: 'kelas video daring', modul: 'modul belajar di aplikasi ponsel',
        anggaran: { n: 'menyusun anggaran rumah tangga', p: 'mengatur pengeluaran keluarga' }, bodong: { n: 'mengenali investasi bodong', p: 'menghindari penipuan berkedok investasi' },
        asuransi: { n: 'memilih produk asuransi', p: 'menentukan asuransi yang sesuai dengan kebutuhan' }, darurat: { n: 'menyiapkan dana darurat', p: 'menabung untuk keadaan mendesak' },
        pensiun: { n: 'merencanakan dana pensiun', p: 'menyiapkan dana hari tua' },
        paham: 'pemahaman tentang bunga pinjaman', hati: 'kehati-hatian', macet: 'kredit macet', peserta: 'peserta',
        resmi: 'penggunaan layanan keuangan resmi', sertifikat: 'sertifikat pelatihan',
        jadwal: 'jadwal pelatihan yang bentrok dengan jam kerja', teknis: 'materi yang terlalu teknis', penyuluh: 'terbatasnya jumlah penyuluh', muda: 'rendahnya minat warga usia muda'
      },
      alur: [
        { id: 'def', jenis: 'latar', wajib: true, var: [
          'Literasi keuangan adalah kemampuan memahami dan mengelola uang secara bijak.',
          'Kemampuan mengelola uang secara bijak, atau literasi keuangan, kini menjadi perhatian banyak lembaga.'] },
        { id: 'gol', jenis: 'golongan', induk: 'program', anggota: ['tatap', 'daring'], kata: 'jenis', var: [
          'Program literasi keuangan dibedakan menjadi dua jenis, yaitu edukasi tatap muka dan edukasi daring.',
          'Ada dua jenis program literasi keuangan, yaitu edukasi tatap muka dan edukasi daring.'] },
        { id: 'cakupan', jenis: 'cakupan', ikut: 'gol', x: 'tatap', masuk: ['seminar', 'kunjungan', 'pendampingan'], nMasuk: [2, 3], keluar: ['video', 'modul'], var: [
          { t: 'Edukasi tatap muka mencakup {masuk}, sedangkan {keluar} termasuk edukasi daring.', pm: 'mencakup', pk: 'termasuk', keluarKe: 'daring' },
          { t: 'Yang tergolong edukasi tatap muka antara lain {masuk}, tetapi tidak termasuk {keluar}.', pm: 'tergolong', pk: 'tidak termasuk' }] },
        { id: 'materi', jenis: 'daftar', subjek: 'program', himp: 'materi', pool: ['anggaran', 'bodong', 'asuransi', 'darurat', 'pensiun'], tdBoleh: ['bodong', 'asuransi', 'darurat', 'pensiun'], n: [3, 4],
          var: { terbuka: ['Pesertanya diajari berbagai keterampilan, seperti cara {daftar}.'], tertutup: ['Pada tahap awal, peserta hanya diajari cara {daftar}.'] },
          klaim: {
            terbuka: { ya: ['Program literasi keuangan mengajarkan cara {x}.'], tidak: ['Program literasi keuangan tidak mengajarkan cara {x}.'] },
            tertutup: { ya: ['Pada tahap awal, peserta sudah diajari cara {x}.'], tidak: ['Pada tahap awal, peserta belum diajari cara {x}.'] } } },
        { id: 'sebab', jenis: 'sebab', ket: ['pemahaman tentang bunga pinjaman meningkatkan kehati-hatian warga sebelum berutang', 'kehati-hatian itu menekan jumlah kredit macet'], akhir: 'pemahaman tentang bunga pinjaman pada akhirnya ikut menekan jumlah kredit macet', mata: [
          { dari: 'paham', ke: 'hati', arah: 'naik', var: [{ t: 'Pemahaman tentang bunga pinjaman meningkatkan kehati-hatian warga sebelum berutang.', p: 'meningkatkan kehati-hatian' }] },
          { dari: 'hati', ke: 'macet', arah: 'turun', var: [{ t: 'Kehati-hatian itu pada gilirannya menekan jumlah kredit macet.', p: 'menekan jumlah kredit macet' }] }],
          gabung: [{ t: 'Pemahaman tentang bunga pinjaman meningkatkan kehati-hatian warga sebelum berutang, dan kehati-hatian itu pada gilirannya menekan jumlah kredit macet.', p: ['meningkatkan kehati-hatian', 'menekan jumlah kredit macet'] }],
          klaim: {
            m0: { sama: [{ t: 'Kehati-hatian warga sebelum berutang meningkat berkat pemahaman tentang bunga pinjaman.', p: 'kehati-hatian warga sebelum berutang meningkat' }], balik: [{ t: 'Pemahaman tentang bunga pinjaman menurunkan kehati-hatian warga sebelum berutang.', p: 'menurunkan kehati-hatian' }] },
            m1: { sama: [{ t: 'Kehati-hatian sebelum berutang ikut menekan jumlah kredit macet.', p: 'menekan jumlah kredit macet' }], balik: [{ t: 'Kehati-hatian sebelum berutang justru menambah jumlah kredit macet.', p: 'menambah jumlah kredit macet' }] },
            rantai: { sama: [{ t: 'Pemahaman tentang bunga pinjaman turut menekan jumlah kredit macet.', p: 'menekan jumlah kredit macet' }], balik: [{ t: 'Pemahaman tentang bunga pinjaman justru menambah jumlah kredit macet.', p: 'menambah jumlah kredit macet' }] },
            terbalik: [{ t: 'Jumlah kredit macet yang tinggi mendorong warga mempelajari bunga pinjaman.', p: 'mendorong warga mempelajari bunga pinjaman', dari: 'macet', ke: 'paham', arah: 'naik', nk: 'bunga pinjaman' }] } },
        { id: 'status', jenis: 'status', hal: 'resmi', var: {
          teori: ['Secara teori, peningkatan literasi keuangan dapat memperluas penggunaan layanan keuangan resmi di pedesaan.'],
          belum: ['Secara teori, peningkatan literasi keuangan dapat memperluas penggunaan layanan keuangan resmi di pedesaan, tetapi hubungan itu belum terbukti dalam penelitian.'],
          terbukti: ['Survei di sejumlah provinsi membuktikan bahwa peningkatan literasi keuangan memperluas penggunaan layanan keuangan resmi di pedesaan.'] },
          klaim: {
            terbukti: ['Peningkatan literasi keuangan telah terbukti memperluas penggunaan layanan keuangan resmi di pedesaan.'],
            mungkin: ['Pada prinsipnya, peningkatan literasi keuangan dapat memperluas penggunaan layanan keuangan resmi di pedesaan.'],
            belum: ['Dampak peningkatan literasi keuangan terhadap penggunaan layanan keuangan resmi di pedesaan belum terbukti.'] } },
        { id: 'tesis', jenis: 'latar', var: ['Banyak pihak menilai program semacam ini sebagai investasi sosial jangka panjang.'] },
        { id: 'kuantor', jenis: 'kuantor', kelompok: 'peserta', var: {
          'tidak-semua': ['Meski begitu, tidak semua peserta langsung menerapkan materi yang diterimanya.'],
          sebagian: ['Setelah pelatihan, sebagian peserta mulai mencatat pengeluaran hariannya.'] },
          klaim: {
            'tidak-semua': { semua: ['Semua peserta langsung menerapkan materi yang diterimanya.'], 'ada-tidak': ['Ada peserta yang tidak langsung menerapkan materi yang diterimanya.'] },
            sebagian: { 'tidak-ada': ['Tidak ada peserta yang mulai mencatat pengeluaran hariannya setelah pelatihan.'], 'sebagian-besar': ['Sebagian besar peserta mulai mencatat pengeluaran hariannya setelah pelatihan.'], ada: ['Ada peserta yang mulai mencatat pengeluaran hariannya setelah pelatihan.'] } } },
        { id: 'hambatan', jenis: 'daftar', subjek: 'program', himp: 'hambatan', pool: ['jadwal', 'teknis', 'penyuluh', 'muda'], tdBoleh: ['jadwal', 'penyuluh', 'muda'], n: [2, 3],
          var: { terbuka: ['Pelaksanaannya masih menghadapi kendala, seperti {daftar}.', 'Namun, program ini tidak lepas dari kendala, antara lain {daftar}.'] },
          klaim: { terbuka: { ya: ['{x} merupakan salah satu kendala program literasi keuangan.'], tunggal: ['Satu-satunya kendala program literasi keuangan adalah {x}.'] } } },
        { id: 'syarat', jenis: 'syarat', aksi: 'sertifikat', min: 2, maks: 12, langkah: 1, var: {
          perlu: ['Sertifikat pelatihan hanya diberikan kepada peserta yang menghadiri sekurang-kurangnya {t} sesi.'],
          cukup: ['Setiap peserta yang menghadiri {t} sesi atau lebih otomatis memperoleh sertifikat pelatihan.'] },
          klaim: { pasti: ['Peserta yang menghadiri {v} sesi pasti memperoleh sertifikat pelatihan.'], tidak: ['Peserta yang menghadiri {v} sesi tidak dapat memperoleh sertifikat pelatihan.'] } }
      ]
    },
    {
      id: 'asuransimikro', judul: 'Asuransi Mikro',
      istilah: {
        produk: 'produk asuransi mikro', jiwa: 'asuransi jiwa mikro', umum: 'asuransi umum mikro',
        rumah: 'perlindungan rumah dari kebakaran', ternak: 'perlindungan ternak', panen: 'perlindungan gagal panen',
        santunan: 'santunan meninggal dunia', pemakaman: 'bantuan biaya pemakaman',
        pos: 'kantor pos', koperasi: 'koperasi', agen: { n: 'agen perbankan di desa', p: 'agen bank di desa' },
        aplikasi: { n: 'aplikasi ponsel', p: 'aplikasi di telepon genggam' }, gerai: { n: 'gerai ritel modern', p: 'toko ritel modern' },
        premi: 'premi yang rendah', jangkau: 'jangkauan', risiko: 'risiko keluarga jatuh miskin', peserta: 'peserta', polis: 'polis asuransi mikro',
        lindungi: 'perlindungan pekerja informal', klaimPanen: 'klaim gagal panen',
        paham: 'rendahnya pemahaman tentang manfaat asuransi', rumit: 'proses klaim yang dianggap rumit',
        hasil: 'penghasilan peserta yang tidak menentu', percaya: 'kurangnya kepercayaan terhadap perusahaan asuransi'
      },
      alur: [
        { id: 'def', jenis: 'latar', wajib: true, var: [
          'Asuransi mikro adalah asuransi berpremi rendah yang dirancang bagi masyarakat berpenghasilan kecil.',
          'Asuransi mikro dirancang sebagai perlindungan berpremi rendah bagi masyarakat berpenghasilan kecil.'] },
        { id: 'gol', jenis: 'golongan', induk: 'produk', anggota: ['jiwa', 'umum'], kata: 'jenis', var: [
          'Produk asuransi mikro terbagi menjadi dua jenis, yaitu asuransi jiwa mikro dan asuransi umum mikro.'] },
        { id: 'cakupan', jenis: 'cakupan', ikut: 'gol', x: 'umum', masuk: ['rumah', 'ternak', 'panen'], nMasuk: [2, 3], keluar: ['santunan', 'pemakaman'], var: [
          { t: 'Asuransi umum mikro mencakup {masuk}, sedangkan {keluar} termasuk asuransi jiwa mikro.', pm: 'mencakup', pk: 'termasuk', keluarKe: 'jiwa' },
          { t: 'Yang tergolong asuransi umum mikro antara lain {masuk}, tetapi tidak termasuk {keluar}.', pm: 'tergolong', pk: 'tidak termasuk' }] },
        { id: 'tesis', jenis: 'latar', var: ['Produk ini dipandang sebagai jaring pengaman bagi keluarga yang rentan terhadap musibah.'] },
        { id: 'saluran', jenis: 'daftar', subjek: 'polis', himp: 'saluran', pool: ['pos', 'koperasi', 'agen', 'aplikasi', 'gerai'], n: [3, 4],
          var: { terbuka: ['Polisnya dapat dibeli melalui berbagai saluran, seperti {daftar}.'], tertutup: ['Di wilayah percontohan, polisnya hanya dijual melalui {daftar}.'] },
          klaim: {
            terbuka: { ya: ['Polis asuransi mikro dapat dibeli melalui {x}.'], tidak: ['Polis asuransi mikro tidak dapat dibeli melalui {x}.'] },
            tertutup: { ya: ['Di wilayah percontohan, polis asuransi mikro dapat dibeli melalui {x}.'], tidak: ['Di wilayah percontohan, polis asuransi mikro tidak dapat dibeli melalui {x}.'] } } },
        { id: 'sebab', jenis: 'sebab', ket: ['premi yang rendah memperluas jangkauan asuransi', 'jangkauan yang lebih luas mengurangi risiko keluarga jatuh miskin akibat musibah'], akhir: 'premi yang rendah pada akhirnya ikut mengurangi risiko keluarga jatuh miskin', mata: [
          { dari: 'premi', ke: 'jangkau', arah: 'naik', var: [{ t: 'Premi yang rendah memperluas jangkauan asuransi ke keluarga berpenghasilan kecil.', p: 'memperluas jangkauan' }] },
          { dari: 'jangkau', ke: 'risiko', arah: 'turun', var: [{ t: 'Jangkauan yang lebih luas pada gilirannya mengurangi risiko keluarga jatuh miskin akibat musibah.', p: 'mengurangi risiko keluarga jatuh miskin' }] }],
          gabung: [{ t: 'Premi yang rendah memperluas jangkauan asuransi ke keluarga berpenghasilan kecil, dan jangkauan yang lebih luas pada gilirannya mengurangi risiko keluarga jatuh miskin akibat musibah.', p: ['memperluas jangkauan', 'mengurangi risiko keluarga jatuh miskin'] }],
          klaim: {
            m0: { sama: [{ t: 'Premi yang rendah membuat jangkauan asuransi menjadi lebih luas.', p: 'jangkauan asuransi menjadi lebih luas' }], balik: [{ t: 'Premi yang rendah mempersempit jangkauan asuransi.', p: 'mempersempit jangkauan' }] },
            m1: { sama: [{ t: 'Jangkauan asuransi yang lebih luas ikut mengurangi risiko keluarga jatuh miskin akibat musibah.', p: 'mengurangi risiko keluarga jatuh miskin' }], balik: [{ t: 'Jangkauan asuransi yang lebih luas justru menambah risiko keluarga jatuh miskin akibat musibah.', p: 'menambah risiko keluarga jatuh miskin' }] },
            rantai: { sama: [{ t: 'Premi yang rendah turut mengurangi risiko keluarga jatuh miskin akibat musibah.', p: 'mengurangi risiko keluarga jatuh miskin' }], balik: [{ t: 'Premi yang rendah justru menambah risiko keluarga jatuh miskin akibat musibah.', p: 'menambah risiko keluarga jatuh miskin' }] },
            terbalik: [{ t: 'Risiko keluarga jatuh miskin yang tinggi mendorong perusahaan asuransi menurunkan premi.', p: 'menurunkan premi', dari: 'risiko', ke: 'premi', arah: 'turun', nk: 'premi' }] } },
        { id: 'status', jenis: 'status', hal: 'lindungi', var: {
          teori: ['Secara teori, asuransi mikro dapat melindungi pekerja informal dari kerugian akibat bencana.'],
          belum: ['Secara teori, asuransi mikro dapat melindungi pekerja informal dari kerugian akibat bencana, tetapi manfaat itu belum terbukti dalam praktik.'],
          terbukti: ['Pengalaman pascabanjir di sejumlah daerah membuktikan bahwa asuransi mikro melindungi pekerja informal dari kerugian akibat bencana.'] },
          klaim: {
            terbukti: ['Asuransi mikro telah terbukti melindungi pekerja informal dari kerugian akibat bencana.'],
            mungkin: ['Pada prinsipnya, asuransi mikro dapat melindungi pekerja informal dari kerugian akibat bencana.'],
            belum: ['Manfaat asuransi mikro bagi pekerja informal yang terkena bencana belum terbukti.'] } },
        { id: 'kuantor', jenis: 'kuantor', kelompok: 'peserta', var: {
          'tidak-semua': ['Namun, tidak semua peserta memperpanjang polisnya setelah masa perlindungan berakhir.'],
          sebagian: ['Sebagian peserta bahkan mengajak tetangganya ikut mendaftar.'] },
          klaim: {
            'tidak-semua': { semua: ['Semua peserta memperpanjang polisnya setelah masa perlindungan berakhir.'], 'ada-tidak': ['Ada peserta yang tidak memperpanjang polisnya setelah masa perlindungan berakhir.'] },
            sebagian: { 'tidak-ada': ['Tidak ada peserta yang mengajak tetangganya ikut mendaftar.'], 'sebagian-besar': ['Sebagian besar peserta mengajak tetangganya ikut mendaftar.'], ada: ['Ada peserta yang mengajak tetangganya ikut mendaftar.'] } } },
        { id: 'syarat', jenis: 'syarat', aksi: 'klaimPanen', min: 40, maks: 90, langkah: 5, var: {
          perlu: ['Klaim gagal panen hanya dibayarkan bila kerusakan tanaman mencapai sekurang-kurangnya {t} persen dari luas lahan.'],
          cukup: ['Klaim gagal panen otomatis dibayarkan setiap kali kerusakan tanaman mencapai {t} persen atau lebih dari luas lahan.'] },
          klaim: { pasti: ['Bila kerusakan tanaman mencapai {v} persen dari luas lahan, klaim gagal panen pasti dibayarkan.'], tidak: ['Bila kerusakan tanaman {v} persen dari luas lahan, klaim gagal panen tidak dapat dibayarkan.'] } },
        { id: 'hambatan', jenis: 'daftar', subjek: 'produk', himp: 'hambatan', pool: ['paham', 'rumit', 'hasil', 'percaya'], tdBoleh: ['paham', 'rumit', 'percaya'], n: [2, 3],
          var: { terbuka: ['Perluasannya masih menghadapi kendala, seperti {daftar}.', 'Meski demikian, ada sejumlah kendala yang menghambat, antara lain {daftar}.'] },
          klaim: { terbuka: { ya: ['{x} merupakan salah satu kendala perluasan asuransi mikro.'], tunggal: ['Satu-satunya kendala perluasan asuransi mikro adalah {x}.'] } } }
      ]
    },
    {
      id: 'pinjol', judul: 'Pinjaman Daring',
      istilah: {
        pinjol: 'pinjaman daring', produktif: 'pinjaman produktif', konsumtif: 'pinjaman konsumtif',
        modal: 'modal kerja warung', alat: 'pembelian alat usaha', stok: 'pembiayaan stok barang dagangan',
        ponsel: 'pembelian telepon genggam untuk pribadi', liburan: 'biaya liburan keluarga',
        kamera: 'kamera', mikrofon: 'mikrofon', lokasi: 'lokasi', kontak: 'daftar kontak', galeri: 'galeri foto', pesan: 'pesan singkat',
        ktp: { n: 'kartu identitas', p: 'kartu tanda penduduk' }, foto: 'foto diri', rekening: 'nomor rekening bank',
        slip: { n: 'slip gaji', p: 'lembar rincian gaji' }, usaha: 'surat keterangan usaha', ajuan: 'pengajuan pinjaman', berizin: 'penyelenggara berizin',
        bunga: 'bunga harian yang tinggi', bengkak: 'pembengkakan utang', tekanan: 'tekanan keuangan',
        jangkau: 'jangkauan pinjaman daring', peminjam: 'peminjam', limit: 'kenaikan limit',
        tagih: 'penagihan yang kasar', bocor: 'kebocoran data pribadi', iklan: 'iklan yang menyesatkan', sembunyi: 'biaya tersembunyi dalam perjanjian'
      },
      alur: [
        { id: 'def', jenis: 'latar', wajib: true, var: [
          'Pinjaman daring menawarkan proses pengajuan yang cepat melalui aplikasi di ponsel.',
          'Pinjaman daring kian diminati karena pengajuannya cukup dilakukan melalui aplikasi di ponsel.'] },
        { id: 'tesis', jenis: 'latar', var: ['Kemudahan itu ibarat pisau bermata dua bagi masyarakat.'] },
        { id: 'gol', jenis: 'golongan', induk: 'pinjol', anggota: ['produktif', 'konsumtif'], kata: 'jenis', var: [
          'Pinjaman daring terbagi menjadi dua jenis, yaitu pinjaman produktif dan pinjaman konsumtif.'] },
        { id: 'cakupan', jenis: 'cakupan', ikut: 'gol', x: 'produktif', masuk: ['modal', 'alat', 'stok'], nMasuk: [2, 3], keluar: ['ponsel', 'liburan'], var: [
          { t: 'Pinjaman produktif mencakup {masuk}, sedangkan {keluar} tergolong pinjaman konsumtif.', pm: 'mencakup', pk: 'tergolong', keluarKe: 'konsumtif' },
          { t: 'Yang tergolong pinjaman produktif antara lain {masuk}, tetapi tidak termasuk {keluar}.', pm: 'tergolong', pk: 'tidak termasuk' }] },
        { id: 'dokumen', jenis: 'daftar', subjek: 'ajuan', himp: 'dokumen', pool: ['ktp', 'foto', 'rekening', 'slip', 'usaha'], n: [3, 4],
          var: { terbuka: ['Saat mengajukan pinjaman, calon peminjam diminta menyiapkan beberapa dokumen, seperti {daftar}.'] },
          klaim: { terbuka: { ya: ['Calon peminjam diminta menyiapkan {x} saat mengajukan pinjaman daring.'], tidak: ['Calon peminjam tidak diminta menyiapkan {x} saat mengajukan pinjaman daring.'] } } },
        { id: 'akses', jenis: 'daftar', subjek: 'berizin', himp: 'akses', tetap: ['kamera', 'mikrofon', 'lokasi'], luar: ['kontak', 'galeri', 'pesan'],
          var: { tertutup: ['Penyelenggara berizin hanya boleh mengakses {daftar} pada ponsel peminjam.'] },
          klaim: { tertutup: { ya: ['Penyelenggara berizin boleh mengakses {x} pada ponsel peminjam.'], tidak: ['Penyelenggara berizin tidak boleh mengakses {x} pada ponsel peminjam.'] } } },
        { id: 'sebab', jenis: 'sebab', ket: ['bunga harian yang tinggi mempercepat pembengkakan utang', 'pembengkakan utang menambah tekanan keuangan rumah tangga'], akhir: 'bunga harian yang tinggi pada akhirnya ikut menambah tekanan keuangan rumah tangga', mata: [
          { dari: 'bunga', ke: 'bengkak', arah: 'naik', var: [{ t: 'Bunga harian yang tinggi mempercepat pembengkakan utang.', p: 'mempercepat pembengkakan utang' }] },
          { dari: 'bengkak', ke: 'tekanan', arah: 'naik', var: [{ t: 'Pembengkakan utang itu pada gilirannya menambah tekanan keuangan rumah tangga.', p: 'menambah tekanan keuangan' }] }],
          gabung: [{ t: 'Bunga harian yang tinggi mempercepat pembengkakan utang, dan pembengkakan utang pada gilirannya menambah tekanan keuangan rumah tangga.', p: ['mempercepat pembengkakan utang', 'menambah tekanan keuangan'] }],
          klaim: {
            m0: { sama: [{ t: 'Bunga harian yang tinggi membuat pembengkakan utang terjadi lebih cepat.', p: 'pembengkakan utang terjadi lebih cepat' }], balik: [{ t: 'Bunga harian yang tinggi memperlambat pembengkakan utang.', p: 'memperlambat pembengkakan utang' }] },
            m1: { sama: [{ t: 'Pembengkakan utang ikut menambah tekanan keuangan rumah tangga.', p: 'menambah tekanan keuangan' }], balik: [{ t: 'Pembengkakan utang justru mengurangi tekanan keuangan rumah tangga.', p: 'mengurangi tekanan keuangan' }] },
            rantai: { sama: [{ t: 'Bunga harian yang tinggi turut menambah tekanan keuangan rumah tangga.', p: 'menambah tekanan keuangan' }], balik: [{ t: 'Bunga harian yang tinggi justru mengurangi tekanan keuangan rumah tangga.', p: 'mengurangi tekanan keuangan' }] },
            terbalik: [{ t: 'Tekanan keuangan rumah tangga yang berat mendorong penyelenggara menaikkan bunga harian.', p: 'menaikkan bunga harian', dari: 'tekanan', ke: 'bunga', arah: 'naik', nk: 'bunga harian' }] } },
        { id: 'status', jenis: 'status', hal: 'jangkau', var: {
          teori: ['Secara teori, pinjaman daring dapat menjangkau pelaku usaha kecil yang tidak memiliki agunan.'],
          terbukti: ['Data penyaluran membuktikan bahwa pinjaman daring telah menjangkau banyak pelaku usaha kecil yang tidak memiliki agunan.'] },
          klaim: {
            terbukti: ['Pinjaman daring telah terbukti menjangkau pelaku usaha kecil yang tidak memiliki agunan.'],
            mungkin: ['Pada prinsipnya, pinjaman daring dapat menjangkau pelaku usaha kecil yang tidak memiliki agunan.'],
            belum: ['Kemampuan pinjaman daring menjangkau pelaku usaha kecil tanpa agunan belum terbukti.'] } },
        { id: 'kuantor', jenis: 'kuantor', kelompok: 'peminjam', var: {
          'tidak-semua': ['Masalahnya, tidak semua peminjam memeriksa izin penyelenggara sebelum meminjam.'],
          sebagian: ['Sebagian peminjam bahkan memakai pinjaman baru untuk menutup pinjaman lama.'] },
          klaim: {
            'tidak-semua': { semua: ['Semua peminjam memeriksa izin penyelenggara sebelum meminjam.'], 'ada-tidak': ['Ada peminjam yang tidak memeriksa izin penyelenggara sebelum meminjam.'] },
            sebagian: { 'tidak-ada': ['Tidak ada peminjam yang memakai pinjaman baru untuk menutup pinjaman lama.'], 'sebagian-besar': ['Sebagian besar peminjam memakai pinjaman baru untuk menutup pinjaman lama.'], ada: ['Ada peminjam yang memakai pinjaman baru untuk menutup pinjaman lama.'] } } },
        { id: 'syarat', jenis: 'syarat', aksi: 'limit', min: 1, maks: 10, langkah: 1, var: {
          perlu: ['Kenaikan limit pinjaman hanya diberikan kepada peminjam yang telah melunasi sekurang-kurangnya {t} pinjaman tepat waktu.'],
          cukup: ['Setiap peminjam yang telah melunasi {t} pinjaman atau lebih tepat waktu otomatis memperoleh kenaikan limit.'] },
          klaim: { pasti: ['Peminjam yang telah melunasi {v} pinjaman tepat waktu pasti memperoleh kenaikan limit.'], tidak: ['Peminjam yang telah melunasi {v} pinjaman tepat waktu tidak dapat memperoleh kenaikan limit.'] } },
        { id: 'hambatan', jenis: 'daftar', subjek: 'pinjol', himp: 'hambatan', pool: ['tagih', 'bocor', 'iklan', 'sembunyi'], tdBoleh: ['tagih', 'iklan', 'sembunyi'], n: [2, 3],
          var: { terbuka: ['Di sisi lain, masih banyak keluhan, seperti {daftar}.', 'Masyarakat juga masih menghadapi sejumlah masalah, antara lain {daftar}.'] },
          klaim: { terbuka: { ya: ['{x} merupakan salah satu masalah yang dikeluhkan dalam pinjaman daring.'], tunggal: ['Satu-satunya masalah yang dikeluhkan dalam pinjaman daring adalah {x}.'] } } }
      ]
    },
    {
      id: 'bankdigital', judul: 'Perbankan Digital',
      istilah: {
        layanan: 'layanan perbankan digital', sms: 'layanan pesan singkat', internet: 'perbankan internet', aplikasi: 'aplikasi seluler',
        qr: 'pembayaran dengan kode QR', jam: 'jam tangan pintar',
        transfer: { n: 'transfer antarbank', p: 'pengiriman uang ke bank lain' }, tagihan: { n: 'pembayaran tagihan listrik', p: 'membayar tagihan listrik' },
        deposito: { n: 'pembukaan deposito', p: 'membuka simpanan berjangka' }, kredit: { n: 'pengajuan kredit', p: 'mengajukan pinjaman' },
        reksa: { n: 'pembelian reksa dana', p: 'berinvestasi di reksa dana' }, tarik: { n: 'tarik tunai tanpa kartu', p: 'mengambil uang di mesin ATM tanpa kartu' },
        buka: 'pembukaan rekening secara daring', nasabah: 'jumlah nasabah', dana: 'dana yang dihimpun', apl: 'aplikasi bank digital',
        lansia: 'nasabah lanjut usia', biaya: 'biaya operasional', besar: 'fitur transfer dengan batas besar',
        tipu: 'penipuan lewat tautan palsu', gangguan: 'gangguan sistem pada jam sibuk', percaya: 'rendahnya kepercayaan terhadap bank tanpa kantor fisik', sinyal: 'sinyal yang lemah di daerah terpencil'
      },
      alur: [
        { id: 'def', jenis: 'latar', wajib: true, var: [
          'Perbankan digital memungkinkan nasabah membuka rekening dan bertransaksi tanpa datang ke kantor bank.',
          'Berkat perbankan digital, nasabah dapat membuka rekening dan bertransaksi tanpa datang ke kantor bank.'] },
        { id: 'urutan', jenis: 'urutan', subjek: 'layanan', tetap: ['sms', 'internet', 'aplikasi'], luar: ['qr', 'jam'], var: [
          'Layanan perbankan digital pertama kali hadir dalam bentuk {a}, kemudian berkembang menjadi {b} dan {c}.',
          'Mula-mula layanan ini hadir dalam bentuk {a}, lalu berkembang menjadi {b} dan {c}.'],
          klaim: {
            pertama: ['{X} adalah bentuk layanan perbankan digital yang pertama kali hadir.'],
            sebelum: ['{X} hadir lebih dahulu daripada {Y}.'],
            diterapkan: ['Layanan perbankan digital telah berkembang menjadi {X}.'] } },
        { id: 'fitur', jenis: 'daftar', subjek: 'apl', himp: 'fitur', pool: ['transfer', 'tagihan', 'deposito', 'kredit', 'reksa', 'tarik'], tdBoleh: ['deposito', 'kredit', 'reksa', 'tarik'], n: [3, 4],
          var: { terbuka: ['Aplikasi bank digital kini menyediakan berbagai fitur, seperti {daftar}.'], tertutup: ['Pada versi awalnya, aplikasi bank digital hanya menyediakan {daftar}.'] },
          klaim: {
            terbuka: { ya: ['Aplikasi bank digital dapat dipakai untuk {x}.'], tidak: ['Aplikasi bank digital tidak dapat dipakai untuk {x}.'] },
            tertutup: { parafrasa: false, ya: ['Versi awal aplikasi bank digital sudah menyediakan {x}.'], tidak: ['Versi awal aplikasi bank digital belum menyediakan {x}.'] } } },
        { id: 'sebab', jenis: 'sebab', ket: ['pembukaan rekening secara daring mempercepat pertumbuhan jumlah nasabah', 'jumlah nasabah yang bertambah meningkatkan dana yang dihimpun bank'], akhir: 'pembukaan rekening secara daring pada akhirnya ikut meningkatkan dana yang dihimpun bank', mata: [
          { dari: 'buka', ke: 'nasabah', arah: 'naik', var: [{ t: 'Pembukaan rekening secara daring mempercepat pertumbuhan jumlah nasabah.', p: 'mempercepat pertumbuhan jumlah nasabah' }] },
          { dari: 'nasabah', ke: 'dana', arah: 'naik', var: [{ t: 'Jumlah nasabah yang bertambah pada gilirannya meningkatkan dana yang dihimpun bank.', p: 'meningkatkan dana yang dihimpun' }] }],
          gabung: [{ t: 'Pembukaan rekening secara daring mempercepat pertumbuhan jumlah nasabah, dan jumlah nasabah yang bertambah pada gilirannya meningkatkan dana yang dihimpun bank.', p: ['mempercepat pertumbuhan jumlah nasabah', 'meningkatkan dana yang dihimpun'] }],
          klaim: {
            m0: { sama: [{ t: 'Pembukaan rekening secara daring membuat jumlah nasabah bertambah lebih cepat.', p: 'jumlah nasabah bertambah lebih cepat' }], balik: [{ t: 'Pembukaan rekening secara daring memperlambat pertumbuhan jumlah nasabah.', p: 'memperlambat pertumbuhan jumlah nasabah' }] },
            m1: { sama: [{ t: 'Jumlah nasabah yang bertambah ikut meningkatkan dana yang dihimpun bank.', p: 'meningkatkan dana yang dihimpun' }], balik: [{ t: 'Jumlah nasabah yang bertambah justru menurunkan dana yang dihimpun bank.', p: 'menurunkan dana yang dihimpun' }] },
            rantai: { sama: [{ t: 'Pembukaan rekening secara daring turut meningkatkan dana yang dihimpun bank.', p: 'meningkatkan dana yang dihimpun' }], balik: [{ t: 'Pembukaan rekening secara daring justru menurunkan dana yang dihimpun bank.', p: 'menurunkan dana yang dihimpun' }] },
            terbalik: [{ t: 'Dana yang dihimpun bank dalam jumlah besar mendorong bank mempermudah pembukaan rekening secara daring.', p: 'mendorong bank mempermudah pembukaan rekening secara daring', dari: 'dana', ke: 'buka', arah: 'naik' }] } },
        { id: 'status', jenis: 'status', hal: 'biaya', var: {
          teori: ['Secara teori, bank digital dapat beroperasi dengan biaya jauh lebih rendah karena tidak memerlukan kantor cabang.'],
          belum: ['Secara teori, bank digital dapat beroperasi dengan biaya jauh lebih rendah karena tidak memerlukan kantor cabang, tetapi penghematan itu belum terbukti dalam laporan keuangan.'] },
          klaim: {
            terbukti: ['Bank digital telah terbukti beroperasi dengan biaya jauh lebih rendah.'],
            mungkin: ['Pada prinsipnya, bank digital dapat beroperasi dengan biaya lebih rendah.'],
            belum: ['Penghematan biaya operasional bank digital belum terbukti.'] } },
        { id: 'kuantor', jenis: 'kuantor', kelompok: 'lansia', var: {
          'tidak-semua': ['Namun, tidak semua nasabah lanjut usia merasa nyaman bertransaksi lewat aplikasi.'],
          sebagian: ['Sebagian nasabah lanjut usia masih meminta bantuan keluarga saat bertransaksi.'] },
          klaim: {
            'tidak-semua': { semua: ['Semua nasabah lanjut usia merasa nyaman bertransaksi lewat aplikasi.'], 'ada-tidak': ['Ada nasabah lanjut usia yang tidak merasa nyaman bertransaksi lewat aplikasi.'] },
            sebagian: { 'tidak-ada': ['Tidak ada nasabah lanjut usia yang meminta bantuan keluarga saat bertransaksi.'], 'sebagian-besar': ['Sebagian besar nasabah lanjut usia masih meminta bantuan keluarga saat bertransaksi.'], ada: ['Ada nasabah lanjut usia yang meminta bantuan keluarga saat bertransaksi.'] } } },
        { id: 'syarat', jenis: 'syarat', aksi: 'besar', min: 1, maks: 12, langkah: 1, var: {
          perlu: ['Fitur transfer dengan batas besar hanya dapat diaktifkan oleh nasabah yang rekeningnya telah berumur sekurang-kurangnya {t} bulan.'],
          cukup: ['Setiap nasabah yang rekeningnya telah berumur {t} bulan atau lebih otomatis dapat mengaktifkan fitur transfer dengan batas besar.'] },
          klaim: { pasti: ['Nasabah yang rekeningnya telah berumur {v} bulan pasti dapat mengaktifkan fitur transfer dengan batas besar.'], tidak: ['Nasabah yang rekeningnya telah berumur {v} bulan tidak dapat mengaktifkan fitur transfer dengan batas besar.'] } },
        { id: 'hambatan', jenis: 'daftar', subjek: 'layanan', himp: 'hambatan', pool: ['tipu', 'gangguan', 'percaya', 'sinyal'], n: [2, 3],
          var: { terbuka: ['Meski demikian, layanan ini masih menghadapi tantangan, seperti {daftar}.', 'Tantangan yang masih harus diatasi antara lain {daftar}.'] },
          klaim: { terbuka: { ya: ['{x} merupakan salah satu tantangan perbankan digital.'], tunggal: ['Satu-satunya tantangan perbankan digital adalah {x}.'] } } }
      ]
    }
  ];

  // ------------------------------------------------------------- pembantu

  function kap(s) { s = String(s); return s.charAt(0).toUpperCase() + s.slice(1); }
  function isi(t, peta) { return kap(String(t).replace(/\{(\w+)\}/g, function (m, k) { return peta[k] != null ? peta[k] : m; })); }
  function jumlahKata(s) { var t = String(s).trim(); return t ? t.split(/\s+/).length : 0; }
  function salin(o) { return JSON.parse(JSON.stringify(o)); }
  function ist(tp, id) {
    var t = tp.istilah[id];
    if (t == null) throw new Error('istilah tidak dikenal: ' + tp.id + '/' + id);
    return t;
  }
  function nama(tp, id) { var t = ist(tp, id); return typeof t === 'string' ? t : t.n; }
  function parafrasa(tp, id) { var t = ist(tp, id); return typeof t === 'object' && t.p ? t.p : null; }
  function daftarNama(tp, ids) { return Fmt.daftarKata(ids.map(function (id) { return nama(tp, id); })); }
  function kutip(teks) { return '"' + String(teks).replace(/\.$/, '') + '"'; }
  function bilangan(a, r, baku) { if (r == null) return baku; return Array.isArray(r) ? a.bulat(r[0], r[1]) : r; }
  function slotDi(tp, id) { return tp.alur.filter(function (s) { return s.id === id; })[0]; }

  var PENANDA_TUTUP = ['hanya', 'terbatas pada'];
  var PENANDA_BUKA = ['seperti', 'antara lain', 'misalnya', 'di antaranya'];

  /** Penanda pertama (dari daftar) yang muncul di teks, atau null. */
  function penandaDi(teks, daftar) {
    var t = teks.toLowerCase(), terbaik = null, pos = Infinity;
    daftar.forEach(function (p) {
      var i = t.search(new RegExp('(^|[^a-z])' + p + '([^a-z]|$)'));
      if (i >= 0 && i < pos) { pos = i; terbaik = p; }
    });
    return terbaik;
  }

  // ----------------------------------------------------- perakit kalimat
  //
  // RAKIT[jenis](a, tp, slot, mode) -> { kal: [{ teks, fakta: [...] }], info }.
  // Fakta belum memuat `teks`; susunBacaan menambahkannya dari kalimatnya.

  var RAKIT = {};

  RAKIT.latar = function (a, tp, sl) {
    return { kal: [{ teks: a.pilih(sl.var), fakta: [{ tipe: 'latar' }] }], info: {} };
  };

  RAKIT.golongan = function (a, tp, sl) {
    var nm = {};
    sl.anggota.forEach(function (id) { nm[id] = nama(tp, id); });
    return { kal: [{ teks: a.pilih(sl.var), fakta: [{ tipe: 'golongan', induk: sl.induk, anggota: sl.anggota.slice(), nama: nm }] }], info: {} };
  };

  RAKIT.cakupan = function (a, tp, sl, mode) {
    var pilihan = sl.var.filter(function (v) { return !mode.terbuka || /antara lain/.test(v.t); });
    var v = a.pilih(pilihan);
    var masuk = a.ambil(sl.masuk, Math.min(sl.masuk.length, bilangan(a, sl.nMasuk, 2)));
    var keluar = a.ambil(sl.keluar, Math.min(sl.keluar.length, bilangan(a, sl.nKeluar, 1)));
    var teks = isi(v.t, { masuk: daftarNama(tp, masuk), keluar: daftarNama(tp, keluar) });
    var fakta = masuk.map(function (id) { return { tipe: 'bagian', x: id, y: sl.x, ya: true, nama: { x: nama(tp, id) }, penanda: v.pm }; })
      .concat(keluar.map(function (id) {
        return v.keluarKe ? { tipe: 'bagian', x: id, y: v.keluarKe, ya: true, nama: { x: nama(tp, id) }, penanda: v.pk }
          : { tipe: 'bagian', x: id, y: sl.x, ya: false, nama: { x: nama(tp, id) }, penanda: v.pk };
      }));
    return { kal: [{ teks: teks, fakta: fakta }], info: { masuk: masuk, keluar: keluar, keluarKe: v.keluarKe || null, terbuka: /antara lain/.test(v.t), luar: sl.luar || [] } };
  };

  RAKIT.kecuali = function (a, tp, sl) {
    var k = a.pilih(sl.pool);
    var teks = isi(a.pilih(sl.var), { k: nama(tp, k) });
    return { kal: [{ teks: teks, fakta: [{ tipe: 'bagian', x: k, y: sl.y, ya: false, nama: { x: nama(tp, k) }, penanda: 'kecuali' }] }], info: { k: k } };
  };

  RAKIT.daftar = function (a, tp, sl, mode) {
    var bisaBuka = !!(sl.var.terbuka && sl.var.terbuka.length), bisaTutup = !!(sl.var.tertutup && sl.var.tertutup.length);
    var lengkap = mode.lengkap != null ? mode.lengkap : (bisaBuka && bisaTutup ? a.untung(0.4) : bisaTutup);
    var anggota = sl.tetap ? a.kocok(sl.tetap) : a.ambil(sl.pool, bilangan(a, sl.n, 3));
    var luar = (sl.tetap ? [] : sl.pool.filter(function (id) { return anggota.indexOf(id) < 0; })).concat(sl.luar || []);
    var teks = isi(a.pilih(lengkap ? sl.var.tertutup : sl.var.terbuka), { daftar: daftarNama(tp, anggota) });
    var nm = {};
    anggota.forEach(function (id) { nm[id] = nama(tp, id); });
    var fakta = { tipe: 'daftar', subjek: sl.subjek, himp: sl.himp, anggota: anggota.slice(), lengkap: lengkap, nama: nm, penanda: penandaDi(teks, lengkap ? PENANDA_TUTUP : PENANDA_BUKA) };
    return { kal: [{ teks: teks, fakta: [fakta] }], info: { anggota: anggota, luar: luar, lengkap: lengkap } };
  };

  RAKIT.sebab = function (a, tp, sl, mode) {
    var pakai = mode.pakai || a.pilih(['satu0', 'dua', 'dua']);
    var kal = [];
    function faktaMata(i, p) {
      var m = sl.mata[i];
      return { tipe: 'sebab', dari: m.dari, ke: m.ke, arah: m.arah, nama: { dari: nama(tp, m.dari), ke: nama(tp, m.ke) }, penanda: p };
    }
    if (pakai === 'dua' && sl.gabung && a.untung(0.5)) {
      var g = a.pilih(sl.gabung);
      kal.push({ teks: g.t, fakta: [faktaMata(0, g.p[0]), faktaMata(1, g.p[1])] });
    } else {
      (pakai === 'dua' ? [0, 1] : [0]).forEach(function (i) {
        var v = a.pilih(sl.mata[i].var);
        kal.push({ teks: v.t, fakta: [faktaMata(i, v.p)] });
      });
    }
    return { kal: kal, info: { pakai: pakai } };
  };

  RAKIT.kuantor = function (a, tp, sl, mode) {
    var q = mode.q || a.pilih(Object.keys(sl.var));
    var kel = typeof sl.kelompok === 'string' ? sl.kelompok : sl.kelompok[q];
    var kal = [];
    if (sl.pra) kal.push({ teks: a.pilih(sl.pra), fakta: [{ tipe: 'latar' }] });
    kal.push({ teks: a.pilih(sl.var[q]), fakta: [{ tipe: 'kuantor', kelompok: kel, sifat: sl.id + ':' + q, q: q, nama: { kelompok: nama(tp, kel) } }] });
    return { kal: kal, info: { q: q, kelompok: kel } };
  };

  RAKIT.status = function (a, tp, sl, mode) {
    var st = mode.status || a.pilih(Object.keys(sl.var));
    return { kal: [{ teks: a.pilih(sl.var[st]), fakta: [{ tipe: 'status', hal: sl.hal, status: st }] }], info: { status: st } };
  };

  RAKIT.syarat = function (a, tp, sl, mode) {
    var jenis = mode.jenis || a.pilih(Object.keys(sl.var));
    var t = a.kelipatan(sl.min + sl.langkah, sl.maks - sl.langkah, sl.langkah);
    var teks = isi(a.pilih(sl.var[jenis]), { t: Fmt.angka(t) });
    return { kal: [{ teks: teks, fakta: [{ tipe: 'syarat', aksi: sl.aksi, jenis: jenis, ambang: t }] }], info: { jenis: jenis, t: t } };
  };

  RAKIT.urutan = function (a, tp, sl) {
    var urut = sl.tetap ? [sl.tetap[0]].concat(a.kocok(sl.tetap.slice(1))) : a.kocok(sl.pool).slice(0, 3);
    var teks = isi(a.pilih(sl.var), { a: nama(tp, urut[0]), b: nama(tp, urut[1]), c: nama(tp, urut[2]) });
    var nm = {};
    urut.forEach(function (id) { nm[id] = nama(tp, id); });
    return { kal: [{ teks: teks, fakta: [{ tipe: 'urutan', subjek: sl.subjek, pertama: urut[0], lanjut: urut.slice(1), nama: nm }] }], info: { pertama: urut[0], lanjut: urut.slice(1), luar: sl.luar || [] } };
  };

  RAKIT.banding = function (a, tp, sl) {
    var u = sl.urut, kal = [];
    function fk(x, y) { return { tipe: 'banding', a: x, b: y, sifat: sl.adj, nama: { a: nama(tp, x), b: nama(tp, y) } }; }
    var v = a.pilih(sl.var.rantai);
    if (Array.isArray(v)) { kal.push({ teks: v[0], fakta: [fk(u[0], u[1])] }); kal.push({ teks: v[1], fakta: [fk(u[1], u[2])] }); }
    else kal.push({ teks: v, fakta: [fk(u[0], u[1]), fk(u[1], u[2])] });
    return { kal: kal, info: { urut: u } };
  };

  /**
   * Susun bacaan: semua slot dirakit, lalu dipilih yang wajib, yang dibutuhkan pernyataan,
   * dan slot lain secara acak sampai panjangnya masuk rentang KATA_MIN-KATA_MAKS.
   * @returns {{kalimat, fakta, paragraf, info, masuk}|null}
   */
  function susunBacaan(a, tp, wajib, modes) {
    var hasil = {};
    tp.alur.forEach(function (sl) {
      var r = RAKIT[sl.jenis](a, tp, sl, modes[sl.id] || {});
      r.kata = r.kal.reduce(function (s, k) { return s + jumlahKata(k.teks); }, 0);
      hasil[sl.id] = r;
    });
    var masuk = {}, total = 0;
    function pakai(id) {
      if (masuk[id]) return;
      masuk[id] = true; total += hasil[id].kata;
      var sl = slotDi(tp, id);
      if (sl.ikut) pakai(sl.ikut);
    }
    tp.alur.forEach(function (sl) { if (sl.wajib || wajib.indexOf(sl.id) >= 0) pakai(sl.id); });
    var target = a.bulat(KATA_MIN + 8, KATA_MAKS - 6);
    a.kocok(tp.alur).forEach(function (sl) {
      if (masuk[sl.id] || total >= target) return;
      var tambah = hasil[sl.id].kata + (sl.ikut && !masuk[sl.ikut] ? hasil[sl.ikut].kata : 0);
      if (total + tambah <= KATA_MAKS) pakai(sl.id);
    });
    if (total < KATA_MIN || total > KATA_MAKS) return null;
    var kalimat = [], fakta = [];
    tp.alur.forEach(function (sl) {
      if (!masuk[sl.id]) return;
      hasil[sl.id].kal.forEach(function (k) {
        kalimat.push(k.teks);
        k.fakta.forEach(function (fk) { var o = salin(fk); o.teks = k.teks; fakta.push(o); });
      });
    });
    return { kalimat: kalimat, fakta: fakta, paragraf: kalimat.join(' '), info: hasil, masuk: masuk };
  }

  // ------------------------------------------------- jenis pernyataan
  //
  // Tiap jenis: tingkat, kebenaran yang dituju, slot yang cocok, mode slot yang
  // dibutuhkan (dan slot lain yang wajib ikut), lalu perakit pernyataan dan baris
  // pembahasannya. Jenis hanya MEMBANGUN; kebenarannya diturunkan ulang oleh validator.

  var JENIS = [];
  function J(id, level, truth, cocok, mode, buat) { JENIS.push({ id: id, level: level, truth: truth, cocok: cocok, mode: mode, buat: buat }); }
  function tanpaMode() { return {}; }

  function kalSlot(B, sl) {
    return B.info[sl.id].kal.filter(function (k) { return k.fakta.some(function (f) { return f.tipe !== 'latar'; }); }).map(function (k) { return k.teks; });
  }
  function menyebut(B, slots) {
    var teks = [];
    slots.forEach(function (sl) { kalSlot(B, sl).forEach(function (t) { teks.push(kutip(t)); }); });
    return 'Bacaan menyebut: ' + teks.join(' dan ') + '.';
  }
  function sebut(a, tp, id, boleh) { var p = boleh === false ? null : parafrasa(tp, id); return p && a.untung(0.6) ? p : nama(tp, id); }
  function penandaSlot(B, sl) { return B.info[sl.id].kal[0].fakta[0].penanda; }
  function infoSlot(B, sl) { return B.info[sl.id].info; }
  function angka(v) { return Fmt.angka(v); }

  // ---- daftar (anggota, daftar tertutup "hanya", daftar terbuka "seperti") dan hambatan

  function slotDaftar(sl) { return sl.jenis === 'daftar' && sl.himp !== 'hambatan'; }
  function slotHambatan(sl) { return sl.jenis === 'daftar' && sl.himp === 'hambatan'; }
  function adaMode(sl, mode) { return !!(sl.var[mode] && sl.var[mode].length && sl.klaim[mode]); }
  function calonTd(sl, ids) { return ids.filter(function (id) { return !sl.tdBoleh || sl.tdBoleh.indexOf(id) >= 0; }); }
  function klaimDaftar(a, tp, sl, inf, x, termasuk) {
    var kl = sl.klaim[inf.lengkap ? 'tertutup' : 'terbuka'], s = sebut(a, tp, x, kl.parafrasa);
    return { tipe: 'daftar', subjek: sl.subjek, himp: sl.himp, x: x, termasuk: termasuk, nama: { x: s }, teks: isi(a.pilih(termasuk ? kl.ya : kl.tidak), { x: s }) };
  }
  function diDaftar(tp, x, s) {
    return s === nama(tp, x) ? '"' + kap(s) + '" termasuk di dalamnya.' : '"' + kap(s) + '" pada pernyataan merujuk pada "' + nama(tp, x) + '", yang termasuk di dalamnya.';
  }
  function diLuar(tp, x, s, besar) { var t = besar ? kap(s) : s; return s === nama(tp, x) ? '"' + t + '"' : '"' + t + '" (yaitu ' + nama(tp, x) + ')'; }

  J('daftar-anggota', 'mudah', 'B', slotDaftar, tanpaMode, function (a, tp, sl, B) {
    var inf = infoSlot(B, sl), x = a.pilih(inf.anggota), k = klaimDaftar(a, tp, sl, inf, x, true);
    return { klaim: k, bahas: [menyebut(B, [sl]), diDaftar(tp, x, k.nama.x) + ' Pernyataan itu sesuai dengan bacaan.'] };
  });
  J('daftar-anggota-tidak', 'mudah', 'S', slotDaftar, tanpaMode, function (a, tp, sl, B) {
    var inf = infoSlot(B, sl);
    if (!sl.klaim[inf.lengkap ? 'tertutup' : 'terbuka'].tidak) return null;
    var x = a.pilih(inf.anggota), k = klaimDaftar(a, tp, sl, inf, x, false);
    return { klaim: k, bahas: [menyebut(B, [sl]), diDaftar(tp, x, k.nama.x) + ' Pernyataan yang menyangkalnya bertentangan dengan bacaan.'] };
  });
  J('daftar-tertutup-luar', 'mudah', 'S', function (sl) { return slotDaftar(sl) && adaMode(sl, 'tertutup'); }, function () { return { mode: { lengkap: true } }; }, function (a, tp, sl, B) {
    var inf = infoSlot(B, sl);
    if (!inf.luar.length) return null;
    var x = a.pilih(inf.luar), k = klaimDaftar(a, tp, sl, inf, x, true);
    return { klaim: k, bahas: [menyebut(B, [sl]), 'Kata "' + penandaSlot(B, sl) + '" menandakan daftar itu lengkap, dan ' + diLuar(tp, x, k.nama.x) + ' tidak ada di dalamnya. Pernyataan itu bertentangan dengan bacaan.'] };
  });
  J('daftar-tertutup-luar-tidak', 'mudah', 'B', function (sl) { return slotDaftar(sl) && adaMode(sl, 'tertutup') && !!sl.klaim.tertutup.tidak; }, function () { return { mode: { lengkap: true } }; }, function (a, tp, sl, B) {
    var inf = infoSlot(B, sl);
    if (!inf.luar.length) return null;
    var x = a.pilih(inf.luar), k = klaimDaftar(a, tp, sl, inf, x, false);
    return { klaim: k, bahas: [menyebut(B, [sl]), 'Kata "' + penandaSlot(B, sl) + '" menandakan daftar itu lengkap, dan ' + diLuar(tp, x, k.nama.x) + ' tidak ada di dalamnya. Jadi pernyataan itu sesuai dengan bacaan.'] };
  });
  function tdDaftar(a, tp, sl, B, bolehTidak) {
    var inf = infoSlot(B, sl), c = calonTd(sl, inf.luar);
    if (!c.length) return null;
    var x = a.pilih(c), k = klaimDaftar(a, tp, sl, inf, x, !(bolehTidak && sl.klaim.terbuka.tidak && a.untung(0.3)));
    return { klaim: k, bahas: [menyebut(B, [sl]), 'Kata "' + penandaSlot(B, sl) + '" menandakan bahwa yang disebut hanya contoh, bukan daftar lengkap. ' +
      diLuar(tp, x, k.nama.x, true) + ' tidak disebut di bagian mana pun, sehingga bacaan tidak cukup untuk membenarkan atau menyalahkan pernyataan itu.'] };
  }
  J('daftar-terbuka-luar', 'mudah', 'TD', function (sl) { return slotDaftar(sl) && adaMode(sl, 'terbuka'); }, function () { return { mode: { lengkap: false } }; }, function (a, tp, sl, B) { return tdDaftar(a, tp, sl, B, true); });

  J('hambatan-anggota', 'mudah', 'B', slotHambatan, tanpaMode, function (a, tp, sl, B) {
    var inf = infoSlot(B, sl), x = a.pilih(inf.anggota), k = klaimDaftar(a, tp, sl, inf, x, true);
    return { klaim: k, bahas: [menyebut(B, [sl]), diDaftar(tp, x, k.nama.x) + ' Pernyataan itu sesuai dengan bacaan.'] };
  });
  J('hambatan-tunggal', 'mudah', 'S', function (sl) { return slotHambatan(sl) && !!sl.klaim.terbuka.tunggal; }, tanpaMode, function (a, tp, sl, B) {
    var inf = infoSlot(B, sl), x = a.pilih(inf.anggota), s = sebut(a, tp, x);
    var k = { tipe: 'tunggal', subjek: sl.subjek, himp: sl.himp, x: x, nama: { x: s }, teks: isi(a.pilih(sl.klaim.terbuka.tunggal), { x: s }) };
    return { klaim: k, bahas: [menyebut(B, [sl]), 'Bacaan menyebut lebih dari satu hal, yaitu ' + daftarNama(tp, inf.anggota) + '. Jadi ' + diLuar(tp, x, s) + ' bukan satu-satunya, dan pernyataan itu bertentangan dengan bacaan.'] };
  });
  J('hambatan-luar', 'mudah', 'TD', slotHambatan, tanpaMode, function (a, tp, sl, B) { return tdDaftar(a, tp, sl, B, false); });

  // ---- cakupan, golongan dua langkah, dan pengecualian

  var KLAIM_TERMASUK = ['{x} termasuk {X}.', '{x} merupakan bagian dari {X}.'];
  function slotCakupan(sl) { return sl.jenis === 'cakupan'; }
  function golonganUntuk(tp, sl) { return tp.alur.filter(function (g) { return g.jenis === 'golongan' && g.anggota.indexOf(sl.x) >= 0; })[0]; }
  function klaimBagian(a, tp, x, y, ya, templat, peta) {
    var s = nama(tp, x);
    peta.x = s;
    return { tipe: 'bagian', x: x, y: y, ya: ya, nama: { x: s }, teks: isi(a.pilih(templat), peta) };
  }

  J('cakupan-masuk', 'mudah', 'B', slotCakupan, tanpaMode, function (a, tp, sl, B) {
    var x = a.pilih(infoSlot(B, sl).masuk), k = klaimBagian(a, tp, x, sl.x, true, KLAIM_TERMASUK, { X: nama(tp, sl.x) });
    return { klaim: k, bahas: [menyebut(B, [sl]), '"' + kap(nama(tp, x)) + '" disebut termasuk ' + nama(tp, sl.x) + '. Pernyataan itu sesuai dengan bacaan.'] };
  });
  J('cakupan-keluar', 'mudah', 'S', slotCakupan, tanpaMode, function (a, tp, sl, B) {
    var inf = infoSlot(B, sl), x = a.pilih(inf.keluar), k = klaimBagian(a, tp, x, sl.x, true, KLAIM_TERMASUK, { X: nama(tp, sl.x) });
    if (!inf.keluarKe) return { klaim: k, bahas: [menyebut(B, [sl]), 'Bacaan menegaskan bahwa "' + nama(tp, x) + '" tidak termasuk ' + nama(tp, sl.x) + '. Pernyataan itu bertentangan dengan bacaan.'] };
    var g = golonganUntuk(tp, sl);
    return { klaim: k, bahas: [menyebut(B, [g, sl]), '"' + kap(nama(tp, x)) + '" termasuk ' + nama(tp, inf.keluarKe) + ', sedangkan ' + nama(tp, inf.keluarKe) + ' dan ' + nama(tp, sl.x) + ' adalah dua ' + g.kata + ' yang berbeda. Pernyataan itu bertentangan dengan bacaan.'] };
  });
  J('cakupan-luar', 'mudah', 'TD', function (sl) { return slotCakupan(sl) && (sl.luar || []).length > 0 && sl.var.some(function (v) { return /antara lain/.test(v.t); }); }, function () { return { mode: { terbuka: true } }; }, function (a, tp, sl, B) {
    var x = a.pilih(infoSlot(B, sl).luar), k = klaimBagian(a, tp, x, sl.x, true, KLAIM_TERMASUK, { X: nama(tp, sl.x) });
    return { klaim: k, bahas: [menyebut(B, [sl]), 'Kata "antara lain" menandakan bahwa yang disebut hanya contoh. "' + kap(nama(tp, x)) + '" tidak disebut sama sekali, sehingga tidak dapat dipastikan apakah termasuk ' + nama(tp, sl.x) + '.'] };
  });
  function modeGolongan(a, tp, sl) { return { wajib: [golonganUntuk(tp, sl).id] }; }
  function cocokGolongan(sl, tp) { return slotCakupan(sl) && !!golonganUntuk(tp, sl); }
  J('golongan-induk', 'sulit', 'B', cocokGolongan, modeGolongan, function (a, tp, sl, B) {
    var g = golonganUntuk(tp, sl), x = a.pilih(infoSlot(B, sl).masuk);
    var k = klaimBagian(a, tp, x, g.induk, true, ['{x} merupakan bagian dari {I}.', '{x} termasuk dalam {I}.'], { I: nama(tp, g.induk) });
    return { klaim: k, bahas: [menyebut(B, [g, sl]), '"' + kap(nama(tp, x)) + '" termasuk ' + nama(tp, sl.x) + ', dan ' + nama(tp, sl.x) + ' adalah salah satu ' + g.kata + ' dalam ' + nama(tp, g.induk) + '. Jadi "' + nama(tp, x) + '" juga merupakan bagian dari ' + nama(tp, g.induk) + '.'] };
  });
  J('golongan-silang', 'sulit', 'S', cocokGolongan, modeGolongan, function (a, tp, sl, B) {
    var g = golonganUntuk(tp, sl), x = a.pilih(infoSlot(B, sl).masuk);
    var lain = a.pilih(g.anggota.filter(function (id) { return id !== sl.x; }));
    var k = klaimBagian(a, tp, x, lain, true, ['{x} termasuk dalam {kata} {L}.', '{x} tergolong {L}.'], { kata: g.kata, L: nama(tp, lain) });
    return { klaim: k, bahas: [menyebut(B, [g, sl]), '"' + kap(nama(tp, x)) + '" termasuk ' + nama(tp, sl.x) + '. ' + kap(nama(tp, sl.x)) + ' dan ' + nama(tp, lain) + ' adalah dua ' + g.kata + ' yang berbeda dalam ' + nama(tp, g.induk) + ', jadi "' + nama(tp, x) + '" tidak mungkin termasuk ' + nama(tp, lain) + '.'] };
  });
  function slotKecuali(sl) { return sl.jenis === 'kecuali'; }
  J('kecuali-ya', 'mudah', 'S', slotKecuali, tanpaMode, function (a, tp, sl, B) {
    var x = infoSlot(B, sl).k, s = nama(tp, x);
    var k = { tipe: 'bagian', x: x, y: sl.y, ya: true, nama: { x: s }, teks: isi(a.pilih(sl.klaim.ya), { k: s }) };
    return { klaim: k, bahas: [menyebut(B, [sl]), 'Kata "kecuali" menandakan bahwa "' + s + '" dikecualikan dari ketentuan itu. Pernyataan itu bertentangan dengan bacaan.'] };
  });
  J('kecuali-tidak', 'mudah', 'B', slotKecuali, tanpaMode, function (a, tp, sl, B) {
    var x = infoSlot(B, sl).k, s = nama(tp, x);
    var k = { tipe: 'bagian', x: x, y: sl.y, ya: false, nama: { x: s }, teks: isi(a.pilih(sl.klaim.tidak), { k: s }) };
    return { klaim: k, bahas: [menyebut(B, [sl]), 'Kata "kecuali" menandakan bahwa "' + s + '" dikecualikan dari ketentuan itu, sesuai dengan pernyataan.'] };
  });

  // ---- sebab-akibat: langsung, arah dibalik, rantai dua langkah, arah terbalik (tak dibahas)

  function slotSebab(sl) { return sl.jenis === 'sebab'; }
  function kataArah(arah) { return arah === 'naik' ? 'menaikkan' : 'menurunkan'; }
  function gabungArah(x, y) { return x === y ? 'naik' : 'turun'; }
  function balikArah(arah) { return arah === 'naik' ? 'turun' : 'naik'; }
  function klaimSebab(tp, v, dari, ke, arah) {
    return { tipe: 'sebab', dari: dari, ke: ke, arah: arah, nama: { dari: v.nd || nama(tp, dari), ke: v.nk || nama(tp, ke) }, penanda: v.p, teks: isi(v.t, {}) };
  }
  /** Keterangan satu hubungan sebab-akibat dengan kata-kata topiknya (sl.ket), atau bentuk umum. */
  function satuMata(tp, sl, i) { var m = sl.mata[i]; return sl.ket ? sl.ket[i] : nama(tp, m.dari) + ' ' + kataArah(m.arah) + ' ' + nama(tp, m.ke); }
  function modeLangsung(a) { return { mode: { pakai: a.pilih(['satu0', 'dua']) } }; }
  function modeRantai() { return { mode: { pakai: 'dua' } }; }

  J('sebab-langsung', 'sedang', 'B', slotSebab, modeLangsung, function (a, tp, sl, B) {
    var i = infoSlot(B, sl).pakai === 'dua' ? a.bulat(0, 1) : 0, m = sl.mata[i];
    var k = klaimSebab(tp, a.pilih(sl.klaim['m' + i].sama), m.dari, m.ke, m.arah);
    return { klaim: k, bahas: [menyebut(B, [sl]), 'Menurut bacaan, ' + satuMata(tp, sl, i) + '. Pernyataan menyampaikan hubungan sebab-akibat yang sama dengan kata lain.'] };
  });
  J('sebab-arah', 'sedang', 'S', slotSebab, modeLangsung, function (a, tp, sl, B) {
    var i = infoSlot(B, sl).pakai === 'dua' ? a.bulat(0, 1) : 0, m = sl.mata[i];
    var k = klaimSebab(tp, a.pilih(sl.klaim['m' + i].balik), m.dari, m.ke, balikArah(m.arah));
    return { klaim: k, bahas: [menyebut(B, [sl]), 'Menurut bacaan, ' + satuMata(tp, sl, i) + ', sedangkan pernyataan menyebut arah sebaliknya.'] };
  });
  function bahasRantai(tp, sl) {
    var m0 = sl.mata[0], m1 = sl.mata[1];
    var akhir = sl.akhir || nama(tp, m0.dari) + ' pada akhirnya ikut ' + kataArah(gabungArah(m0.arah, m1.arah)) + ' ' + nama(tp, m1.ke);
    return 'Kedua hubungan itu bersambung: ' + satuMata(tp, sl, 0) + ', lalu ' + satuMata(tp, sl, 1) + '. Jadi ' + akhir + '.';
  }
  J('sebab-rantai', 'sulit', 'B', slotSebab, modeRantai, function (a, tp, sl, B) {
    var m0 = sl.mata[0], m1 = sl.mata[1];
    var k = klaimSebab(tp, a.pilih(sl.klaim.rantai.sama), m0.dari, m1.ke, gabungArah(m0.arah, m1.arah));
    return { klaim: k, bahas: [menyebut(B, [sl]), bahasRantai(tp, sl) + ' Pernyataan itu sesuai dengan bacaan.'] };
  });
  J('sebab-rantai-arah', 'sulit', 'S', slotSebab, modeRantai, function (a, tp, sl, B) {
    var m0 = sl.mata[0], m1 = sl.mata[1];
    var k = klaimSebab(tp, a.pilih(sl.klaim.rantai.balik), m0.dari, m1.ke, balikArah(gabungArah(m0.arah, m1.arah)));
    return { klaim: k, bahas: [menyebut(B, [sl]), bahasRantai(tp, sl) + ' Pernyataan menyebut arah sebaliknya, jadi bertentangan dengan bacaan.'] };
  });
  J('sebab-terbalik', 'sulit', 'TD', function (sl) { return slotSebab(sl) && !!(sl.klaim.terbalik && sl.klaim.terbalik.length); }, modeRantai, function (a, tp, sl, B) {
    var v = a.pilih(sl.klaim.terbalik), k = klaimSebab(tp, v, v.dari, v.ke, v.arah);
    return { klaim: k, bahas: [menyebut(B, [sl]), 'Bacaan hanya menyebut bahwa ' + satuMata(tp, sl, 0) + ', dan ' + satuMata(tp, sl, 1) + '. Pengaruh ' + nama(tp, v.dari) + ' terhadap ' + nama(tp, v.ke) + ' tidak dibahas, jadi pernyataan itu tidak dapat dipastikan.'] };
  });

  // ---- kuantor: tidak semua / sebagian

  function slotKuantor(q, kq) { return function (sl) { return sl.jenis === 'kuantor' && !!sl.var[q] && !!sl.klaim[q] && !!sl.klaim[q][kq]; }; }
  function modeKuantor(q) { return function () { return { mode: { q: q } }; }; }
  function klaimKuantor(a, tp, sl, B, kq) {
    var inf = infoSlot(B, sl);
    return { tipe: 'kuantor', kelompok: inf.kelompok, sifat: sl.id + ':' + inf.q, q: kq, nama: { kelompok: nama(tp, inf.kelompok) }, teks: isi(a.pilih(sl.klaim[inf.q][kq]), {}) };
  }
  function kutipKuantor(B, sl) { var kal = B.info[sl.id].kal; return 'Bacaan menyebut: ' + kutip(kal[kal.length - 1].teks) + '.'; }
  function JK(id, level, truth, q, kq, alasan) {
    J(id, level, truth, slotKuantor(q, kq), modeKuantor(q), function (a, tp, sl, B) { return { klaim: klaimKuantor(a, tp, sl, B, kq), bahas: [kutipKuantor(B, sl), alasan] }; });
  }
  JK('kuantor-semua', 'sedang', 'S', 'tidak-semua', 'semua', '"Tidak semua" berarti sekurang-kurangnya ada yang tidak demikian, sehingga pernyataan yang menyebut "semua" bertentangan dengan bacaan.');
  JK('kuantor-ada-tidak', 'sedang', 'B', 'tidak-semua', 'ada-tidak', '"Tidak semua" berarti sekurang-kurangnya ada yang tidak demikian. Pernyataan itu sesuai dengan bacaan.');
  JK('kuantor-sebagian-besar', 'sedang', 'TD', 'sebagian', 'sebagian-besar', 'Bacaan hanya menyebut "sebagian" tanpa menyebut berapa banyak. Apakah jumlahnya mencapai "sebagian besar" tidak dapat dipastikan.');
  JK('kuantor-tidak-ada', 'sedang', 'S', 'sebagian', 'tidak-ada', '"Sebagian" berarti ada yang demikian, sehingga pernyataan "tidak ada" bertentangan dengan bacaan.');
  JK('kuantor-ada', 'mudah', 'B', 'sebagian', 'ada', '"Sebagian" berarti sekurang-kurangnya ada yang demikian. Pernyataan itu sesuai dengan bacaan.');

  // ---- status: "secara teori", "belum terbukti", "terbukti"

  function slotStatus(st, jk) { return function (sl) { return sl.jenis === 'status' && !!sl.var[st] && !!sl.klaim[jk]; }; }
  function JS(id, level, truth, st, jk, alasan) {
    J(id, level, truth, slotStatus(st, jk), function () { return { mode: { status: st } }; }, function (a, tp, sl, B) {
      return { klaim: { tipe: 'status', hal: sl.hal, jenis: jk, teks: isi(a.pilih(sl.klaim[jk]), {}) }, bahas: [menyebut(B, [sl]), alasan] };
    });
  }
  JS('status-terbukti', 'sedang', 'TD', 'teori', 'terbukti', 'Bacaan hanya menyebut hal itu mungkin terjadi "secara teori". Apakah sudah terbukti dalam kenyataan tidak disebut, jadi pernyataan itu tidak dapat dipastikan.');
  JS('status-belum-teori', 'sedang', 'TD', 'teori', 'belum', 'Bacaan hanya menyebut hal itu mungkin terjadi "secara teori", tanpa menyebut apakah sudah atau belum terbukti.');
  JS('status-terbukti-belum', 'sedang', 'S', 'belum', 'terbukti', 'Bacaan menegaskan bahwa hal itu belum terbukti, sehingga pernyataan bahwa hal itu telah terbukti bertentangan dengan bacaan.');
  JS('status-belum', 'sedang', 'B', 'belum', 'belum', 'Bacaan menegaskan bahwa hal itu belum terbukti. Pernyataan itu sesuai dengan bacaan.');
  JS('status-terbukti-ya', 'sedang', 'B', 'terbukti', 'terbukti', 'Bacaan menyebut hal itu sudah terbukti. Pernyataan itu sesuai dengan bacaan.');
  JS('status-belum-terbukti', 'sedang', 'S', 'terbukti', 'belum', 'Bacaan menyebut hal itu sudah terbukti, sehingga pernyataan bahwa hal itu belum terbukti bertentangan dengan bacaan.');
  J('status-mungkin', 'mudah', 'B', function (sl) { return sl.jenis === 'status' && !!sl.klaim.mungkin; }, tanpaMode, function (a, tp, sl, B) {
    var st = infoSlot(B, sl).status;
    return { klaim: { tipe: 'status', hal: sl.hal, jenis: 'mungkin', teks: isi(a.pilih(sl.klaim.mungkin), {}) },
      bahas: [menyebut(B, [sl]), st === 'terbukti' ? 'Bacaan menyebut hal itu sudah terbukti; yang sudah terbukti tentu juga mungkin terjadi.' : 'Bacaan menyebut hal itu mungkin terjadi ("secara teori"), dan pernyataan juga hanya menyebut kemungkinannya.'] };
  });

  // ---- syarat perlu dan syarat cukup; angka kasusnya ada di pernyataan

  function slotSyarat(j) { return function (sl) { return sl.jenis === 'syarat' && !!sl.var[j]; }; }
  function nilaiKasus(a, sl, t, lulus) {
    var v = lulus ? t + a.bulat(1, 3) * sl.langkah : t - a.bulat(1, 3) * sl.langkah;
    if (lulus && v > sl.maks) v = t + sl.langkah;
    if (!lulus && v < sl.min) v = t - sl.langkah;
    return v;
  }
  var ALASAN_PERLU = 'Kata "hanya ... sekurang-kurangnya {t}" menunjukkan syarat perlu: yang belum mencapai {t} tidak dapat memperolehnya, tetapi mencapai {t} belum menjamin apa pun.';
  var ALASAN_CUKUP = 'Kalimat "setiap ... {t} ... atau lebih otomatis ..." menunjukkan syarat cukup: yang mencapai {t} pasti memperolehnya, tetapi bacaan tidak menyebut apa yang berlaku bagi yang di bawahnya.';
  function JY(id, truth, j, lulus, jk, akhir) {
    J(id, 'sulit', truth, slotSyarat(j), function () { return { mode: { jenis: j } }; }, function (a, tp, sl, B) {
      var t = infoSlot(B, sl).t, v = nilaiKasus(a, sl, t, lulus), jenis = jk || a.pilih(['pasti', 'tidak']);
      var k = { tipe: 'syarat', aksi: sl.aksi, jenis: jenis, v: v, teks: isi(a.pilih(sl.klaim[jenis]), { v: angka(v) }) };
      var dasar = (j === 'perlu' ? ALASAN_PERLU : ALASAN_CUKUP).replace(/\{t\}/g, angka(t));
      return { klaim: k, bahas: [menyebut(B, [sl]), dasar, akhir.replace(/\{v\}/g, angka(v)).replace(/\{t\}/g, angka(t))] };
    });
  }
  JY('syarat-perlu-gagal', 'B', 'perlu', false, 'tidak', 'Nilai {v} kurang dari {t}, jadi syaratnya tidak terpenuhi. Pernyataan itu sesuai dengan bacaan.');
  JY('syarat-perlu-pasti', 'S', 'perlu', false, 'pasti', 'Nilai {v} kurang dari {t}, jadi syaratnya tidak terpenuhi dan pernyataan itu bertentangan dengan bacaan.');
  JY('syarat-perlu-lulus', 'TD', 'perlu', true, null, 'Nilai {v} memenuhi batas {t}, tetapi syarat perlu bukan jaminan. Bacaan tidak menyebut apakah ada syarat lain, jadi pernyataan itu tidak dapat dipastikan.');
  JY('syarat-cukup-lulus', 'B', 'cukup', true, 'pasti', 'Nilai {v} tidak kurang dari {t}, jadi pernyataan itu sesuai dengan bacaan.');
  JY('syarat-cukup-tidak', 'S', 'cukup', true, 'tidak', 'Nilai {v} mencapai batas {t}, jadi pernyataan itu bertentangan dengan bacaan.');
  JY('syarat-cukup-gagal', 'TD', 'cukup', false, null, 'Nilai {v} di bawah {t}. Syarat cukup hanya menjamin yang mencapai {t}, jadi pernyataan itu tidak dapat dipastikan.');

  // ---- urutan "pertama kali ..., kemudian ..."

  function slotUrutan(sl) { return sl.jenis === 'urutan'; }
  function klaimUrutan(a, tp, sl, jenis, x, y) {
    var peta = { X: nama(tp, x) }, nm = { x: nama(tp, x) };
    if (y) { peta.Y = nama(tp, y); nm.y = nama(tp, y); }
    return { tipe: 'urutan', subjek: sl.subjek, jenis: jenis, x: x, y: y || null, nama: nm, teks: isi(a.pilih(sl.klaim[jenis]), peta) };
  }
  J('urutan-sebelum', 'sedang', 'B', slotUrutan, tanpaMode, function (a, tp, sl, B) {
    var inf = infoSlot(B, sl), y = a.pilih(inf.lanjut);
    return { klaim: klaimUrutan(a, tp, sl, 'sebelum', inf.pertama, y), bahas: [menyebut(B, [sl]), 'Urutannya dimulai dari ' + nama(tp, inf.pertama) + ', baru kemudian ' + nama(tp, y) + '. Pernyataan itu sesuai dengan bacaan.'] };
  });
  J('urutan-sebelum-balik', 'sedang', 'S', slotUrutan, tanpaMode, function (a, tp, sl, B) {
    var inf = infoSlot(B, sl), x = a.pilih(inf.lanjut);
    return { klaim: klaimUrutan(a, tp, sl, 'sebelum', x, inf.pertama), bahas: [menyebut(B, [sl]), 'Yang pertama justru ' + nama(tp, inf.pertama) + ', baru kemudian ' + nama(tp, x) + '. Pernyataan itu bertentangan dengan bacaan.'] };
  });
  J('urutan-pertama', 'sedang', 'S', slotUrutan, tanpaMode, function (a, tp, sl, B) {
    var inf = infoSlot(B, sl), x = a.pilih(inf.lanjut);
    return { klaim: klaimUrutan(a, tp, sl, 'pertama', x), bahas: [menyebut(B, [sl]), 'Menurut bacaan, yang pertama adalah ' + nama(tp, inf.pertama) + ', bukan ' + nama(tp, x) + '.'] };
  });
  J('urutan-pertama-ya', 'mudah', 'B', slotUrutan, tanpaMode, function (a, tp, sl, B) {
    var inf = infoSlot(B, sl);
    return { klaim: klaimUrutan(a, tp, sl, 'pertama', inf.pertama), bahas: [menyebut(B, [sl]), 'Menurut bacaan, yang pertama memang ' + nama(tp, inf.pertama) + '. Pernyataan itu sesuai dengan bacaan.'] };
  });
  J('urutan-luar', 'sedang', 'TD', function (sl) { return slotUrutan(sl) && (sl.luar || []).length > 0; }, tanpaMode, function (a, tp, sl, B) {
    var x = a.pilih(infoSlot(B, sl).luar);
    return { klaim: klaimUrutan(a, tp, sl, 'diterapkan', x), bahas: [menyebut(B, [sl]), kap(nama(tp, x)) + ' tidak disebut sama sekali, dan bacaan tidak menyatakan bahwa urutan itu lengkap. Jadi pernyataan itu tidak dapat dipastikan.'] };
  });

  // ---- perbandingan berantai

  function slotBanding(sl) { return sl.jenis === 'banding'; }
  function klaimBanding(a, tp, sl, x, y) {
    return { tipe: 'banding', a: x, b: y, sifat: sl.adj, nama: { a: nama(tp, x), b: nama(tp, y) }, teks: isi(a.pilih(sl.klaim), { X: nama(tp, x), Y: nama(tp, y) }) };
  }
  function bahasBanding(tp, sl) {
    var u = sl.urut, adj = ' lebih ' + sl.adj + ' daripada ';
    return 'Dari kedua perbandingan itu: ' + nama(tp, u[0]) + adj + nama(tp, u[1]) + ', dan ' + nama(tp, u[1]) + adj + nama(tp, u[2]) + '. Jadi ' + nama(tp, u[0]) + adj + nama(tp, u[2]) + '.';
  }
  J('banding-rantai', 'sulit', 'B', slotBanding, tanpaMode, function (a, tp, sl, B) {
    return { klaim: klaimBanding(a, tp, sl, sl.urut[0], sl.urut[2]), bahas: [menyebut(B, [sl]), bahasBanding(tp, sl) + ' Pernyataan itu sesuai dengan bacaan.'] };
  });
  J('banding-rantai-balik', 'sulit', 'S', slotBanding, tanpaMode, function (a, tp, sl, B) {
    return { klaim: klaimBanding(a, tp, sl, sl.urut[2], sl.urut[0]), bahas: [menyebut(B, [sl]), bahasBanding(tp, sl) + ' Pernyataan menyebut kebalikannya, jadi bertentangan dengan bacaan.'] };
  });
  J('banding-langsung-balik', 'sedang', 'S', slotBanding, tanpaMode, function (a, tp, sl, B) {
    var i = a.bulat(0, 1), u = sl.urut;
    return { klaim: klaimBanding(a, tp, sl, u[i + 1], u[i]), bahas: [menyebut(B, [sl]), 'Bacaan menyebut ' + nama(tp, u[i]) + ' lebih ' + sl.adj + ' daripada ' + nama(tp, u[i + 1]) + ', bukan sebaliknya. Pernyataan itu bertentangan dengan bacaan.'] };
  });

  // ------------------------------------------------------------------ buat

  /** Apakah istilah `id` disebut oleh salah satu fakta bacaan? */
  function disebutFakta(fakta, id) {
    return fakta.some(function (f) {
      return [f.x, f.y, f.dari, f.ke, f.kelompok, f.induk, f.pertama, f.a, f.b].indexOf(id) >= 0 ||
        (f.anggota || []).indexOf(id) >= 0 || (f.lanjut || []).indexOf(id) >= 0;
    });
  }

  function buat(id, level, benih, opsi) {
    opsi = opsi || {};
    var a = Rng.alat(benih);
    var target = opsi.target == null ? a.bulat(0, 2) : (opsi.target > 2 ? opsi.target % 3 : opsi.target);
    var truth = HURUF_TRUTH[target];
    var jenisIni = JENIS.filter(function (j) { return j.level === level && j.truth === truth; });
    for (var coba = 0; coba < 60; coba++) {
      var tp = a.pilih(TOPIK), calon = [];
      jenisIni.forEach(function (j) { tp.alur.forEach(function (sl) { if (j.cocok(sl, tp)) calon.push({ j: j, sl: sl }); }); });
      if (!calon.length) continue;
      var c = a.pilih(calon), m = c.j.mode(a, tp, c.sl) || {}, modes = {};
      modes[c.sl.id] = m.mode || {};
      var B = susunBacaan(a, tp, [c.sl.id].concat(m.wajib || []), modes);
      if (!B) continue;
      var h = c.j.buat(a, tp, c.sl, B);
      if (!h) continue;
      var klaim = h.klaim, kecil = B.paragraf.toLowerCase();
      // pernyataan tidak menyalin kalimat bacaan; hal yang tidak disebut fakta mana pun tidak boleh tertulis di bacaan
      if (kecil.indexOf(klaim.teks.replace(/\.$/, '').toLowerCase()) >= 0) continue;
      if (klaim.x && !disebutFakta(B.fakta, klaim.x) &&
        (kecil.indexOf(klaim.nama.x.toLowerCase()) >= 0 || kecil.indexOf(nama(tp, klaim.x).toLowerCase()) >= 0)) continue;
      var kunciKata = truth === 'B' ? 'BENAR' : (truth === 'S' ? 'SALAH' : 'TIDAK DIKETAHUI');
      var pem = h.bahas.concat(['Jadi pernyataan tersebut ' + kunciKata + '.']);
      var fk = B.fakta.map(function (x, i) { var o = { id: 'f' + (i + 1) }; for (var k in x) o[k] = x[k]; return o; });
      var ctx = { subtes: 'ku', submateri: 'verbal', keluarga: id, level: level, benih: benih, a: a };
      var pilih = { opsi: OPSI.map(function (t, i) { return { teks: t, nilai: i, alasan: null, kunci: i === target }; }), kunciIndex: target };
      var butir = Butir.rakitPg(ctx, {
        jenisSoal: 'Verbal (Verbal Reasoning)',
        judul: tp.judul, teks: [B.paragraf], pertanyaan: klaim.teks,
        perintah: 'Berdasarkan bacaan di atas, apakah pernyataan berikut Benar, Salah, atau Tidak Diketahui?',
        pilihanJadi: pilih, tanpaAlasan: true, tulisKunci: true,
        langkah: [], pembahasan: pem,
        model: { topik: 'Verbal', tema: tp.id, fakta: fk, klaim: klaim, tipeKlaim: c.j.id, paragraf: B.paragraf },
        sidik: { inti: 'verbal|' + tp.id + '|' + c.j.id + '|' + B.paragraf + '|' + klaim.teks, param: [], entitas: tp.id }
      });
      if (butir) return butir;
    }
    return null;
  }

  var KELUARGA = [{ id: 'bacaan-pernyataan', nama: 'Bacaan dan pernyataan (Benar/Salah/Tidak Diketahui)', submateri: 'verbal' }];

  return {
    KELUARGA: KELUARGA, TOPIK: TOPIK, OPSI: OPSI, KATA_MIN: KATA_MIN, KATA_MAKS: KATA_MAKS,
    JENIS: JENIS.map(function (j) { return { id: j.id, level: j.level, truth: j.truth }; }),
    buat: buat
  };
});
