/* Enam topik bacaan verbal tambahan (bank versi 3): pengaduan konsumen, keamanan akun,
 * arsip digital, distribusi pangan segar, perpustakaan digital, dan audit energi gedung.
 * Bentuknya sama dengan topik di verbal.js: kerangka kalimat informatif yang mengalir,
 * dengan fakta eksplisit (golongan, cakupan, daftar, sebab-akibat, temuan setempat,
 * status bukti, kuantor, hambatan, syarat, batas waktu, perbandingan) dan kalimat latar.
 * Ketentuan yang disebut (syarat, batas waktu) hanya berlaku di dalam bacaan, bukan
 * aturan lembaga nyata.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TopikVerbalTambahan = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  return [
    {
      id: 'pengaduan-konsumen', judul: 'Penanganan Pengaduan Konsumen',
      istilah: {
        pengaduan: 'pengaduan konsumen', lisan: 'pengaduan lisan', tertulis: 'pengaduan tertulis',
        telepon: 'pengaduan melalui telepon', loket: 'pengaduan yang disampaikan langsung di loket', video: 'pengaduan melalui panggilan video',
        surel: 'pengaduan melalui surat elektronik', formulir: 'pengaduan melalui formulir daring', surat: 'surat yang dikirim ke kantor layanan',
        keliling: 'pengaduan melalui petugas keliling',
        berkas: 'berkas pengaduan', ktp: { n: 'salinan kartu identitas', p: 'fotokopi kartu tanda penduduk' },
        bukti: { n: 'bukti transaksi', p: 'tanda bukti pembayaran' }, kronologi: { n: 'kronologi kejadian', p: 'urutan peristiwa yang dialami' },
        layar: { n: 'tangkapan layar percakapan', p: 'gambar layar berisi percakapan' }, rekening: 'salinan rekening koran',
        terpandu: 'formulir pengaduan terpandu', periksa: 'pemeriksaan awal', selesai: 'penyelesaian pengaduan',
        bahasa: 'tanggapan dalam bahasa sederhana', petugas: 'petugas layanan',
        kontak: 'nomor kontak konsumen yang tidak aktif', tumpuk: 'penumpukan pengaduan pada akhir bulan',
        istilahTeknis: 'istilah teknis yang sulit dipahami konsumen', pindah: 'perpindahan berkas antarbagian yang berulang',
        mediasi: 'fasilitas mediasi', tanggap: 'tanggapan tertulis', ulang: 'pengaduan ulang',
        cabang: 'tiga kantor cabang', puas: 'kepuasan konsumen'
      },
      alur: [
        { id: 'def', jenis: 'latar', wajib: true, var: [
          'Konsumen yang merasa dirugikan oleh penyedia jasa keuangan dapat menyampaikan keluhannya melalui layanan pengaduan yang disediakan penyedia tersebut.',
          'Setiap penyedia jasa keuangan lazimnya menyediakan layanan pengaduan bagi konsumen yang merasa dirugikan.'] },
        { id: 'konteks', jenis: 'latar', var: [
          'Layanan ini menjadi saluran pertama bagi konsumen sebelum perselisihan dibawa ke lembaga penyelesaian sengketa.',
          'Bagi penyedia jasa, layanan ini juga menjadi sumber masukan untuk memperbaiki produk dan cara melayani.'] },
        { id: 'gol', jenis: 'golongan', induk: 'pengaduan', anggota: ['lisan', 'tertulis'], kata: 'bentuk', var: [
          'Menurut cara penyampaiannya, pengaduan konsumen dibedakan menjadi dua bentuk, yaitu pengaduan lisan dan pengaduan tertulis.',
          'Pengaduan konsumen dapat disampaikan dalam dua bentuk, yaitu pengaduan lisan dan pengaduan tertulis.'] },
        { id: 'cakupan', jenis: 'cakupan', ikut: 'gol', x: 'lisan', masuk: ['telepon', 'loket', 'video'], nMasuk: [2, 3], keluar: ['surel', 'formulir', 'surat'], nKeluar: [1, 2], luar: ['keliling'], var: [
          { t: 'Pengaduan lisan mencakup {masuk}, sedangkan {keluar} termasuk pengaduan tertulis.', pm: 'mencakup', pk: 'termasuk', keluarKe: 'tertulis' },
          { t: 'Yang tergolong pengaduan lisan antara lain {masuk}, tetapi tidak termasuk {keluar}.', pm: 'tergolong', pk: 'tidak termasuk' }] },
        { id: 'berkas', jenis: 'daftar', subjek: 'berkas', himp: 'lampiran', pool: ['ktp', 'bukti', 'kronologi', 'layar', 'rekening'], n: [3, 4],
          var: { terbuka: ['Agar dapat segera diperiksa, konsumen diminta melengkapi pengaduannya dengan beberapa dokumen, seperti {daftar}.'],
            tertutup: ['Untuk pengaduan tertulis, dokumen yang diminta hanya {daftar}.'] },
          klaim: {
            terbuka: { ya: ['Konsumen diminta melengkapi pengaduannya dengan {x}.'], tidak: ['Konsumen tidak diminta melengkapi pengaduannya dengan {x}.'] },
            tertutup: { ya: ['Untuk pengaduan tertulis, konsumen diminta menyertakan {x}.'], tidak: ['Untuk pengaduan tertulis, konsumen tidak diminta menyertakan {x}.'] } } },
        { id: 'sebab', jenis: 'sebab', ket: ['formulir pengaduan terpandu mempercepat pemeriksaan awal', 'pemeriksaan awal yang cepat mempercepat penyelesaian pengaduan'], akhir: 'formulir pengaduan terpandu pada akhirnya ikut mempercepat penyelesaian pengaduan', mata: [
          { dari: 'terpandu', ke: 'periksa', arah: 'naik', var: [{ t: 'Formulir pengaduan terpandu mempercepat pemeriksaan awal karena petugas tidak perlu lagi menanyakan data yang kurang.', p: 'mempercepat pemeriksaan awal' }] },
          { dari: 'periksa', ke: 'selesai', arah: 'naik', var: [{ t: 'Pemeriksaan awal yang cepat pada gilirannya mempercepat penyelesaian pengaduan.', p: 'mempercepat penyelesaian pengaduan' }] }],
          gabung: [{ t: 'Formulir pengaduan terpandu mempercepat pemeriksaan awal, dan pemeriksaan awal yang cepat pada gilirannya mempercepat penyelesaian pengaduan.', p: ['mempercepat pemeriksaan awal', 'mempercepat penyelesaian pengaduan'] }],
          klaim: {
            m0: { sama: [{ t: 'Pemeriksaan awal menjadi lebih cepat berkat formulir pengaduan terpandu.', p: 'pemeriksaan awal menjadi lebih cepat' }], balik: [{ t: 'Formulir pengaduan terpandu memperlambat pemeriksaan awal.', p: 'memperlambat pemeriksaan awal' }] },
            m1: { sama: [{ t: 'Pemeriksaan awal yang cepat ikut mempercepat penyelesaian pengaduan.', p: 'mempercepat penyelesaian pengaduan' }], balik: [{ t: 'Pemeriksaan awal yang cepat memperlambat penyelesaian pengaduan.', p: 'memperlambat penyelesaian pengaduan' }] },
            rantai: { sama: [{ t: 'Formulir pengaduan terpandu turut mempercepat penyelesaian pengaduan.', p: 'mempercepat penyelesaian pengaduan' }], balik: [{ t: 'Formulir pengaduan terpandu memperlambat penyelesaian pengaduan.', p: 'memperlambat penyelesaian pengaduan' }] },
            terbalik: [{ t: 'Penyelesaian pengaduan yang cepat mendorong penyedia jasa memakai formulir pengaduan terpandu.', p: 'mendorong penyedia jasa memakai formulir pengaduan terpandu', dari: 'selesai', ke: 'terpandu', arah: 'naik' }] } },
        { id: 'temuan', jenis: 'temuan', hal: 'puas', lingkup: 'cabang', arah: 'naik',
          var: [{ t: 'Survei di tiga kantor cabang menunjukkan bahwa fitur pelacakan nomor pengaduan meningkatkan kepuasan konsumen.', p: 'meningkatkan kepuasan konsumen' }],
          pancing: ['Hasil itu mendorong pengelola menyiapkan fitur yang sama untuk kantor cabang lain.'],
          klaim: {
            sama: [{ t: 'Di tiga kantor cabang yang disurvei, fitur pelacakan nomor pengaduan menaikkan kepuasan konsumen.', p: 'menaikkan kepuasan konsumen' }],
            arah: [{ t: 'Di tiga kantor cabang yang disurvei, fitur pelacakan nomor pengaduan menurunkan kepuasan konsumen.', p: 'menurunkan kepuasan konsumen' }],
            umum: [{ t: 'Fitur pelacakan nomor pengaduan meningkatkan kepuasan konsumen di semua kantor cabang.', p: 'meningkatkan kepuasan konsumen' }] } },
        { id: 'status', jenis: 'status', hal: 'bahasa', var: {
          teori: ['Secara teori, tanggapan dalam bahasa sederhana dapat mengurangi jumlah pengaduan yang diajukan kembali.'],
          belum: ['Secara teori, tanggapan dalam bahasa sederhana dapat mengurangi jumlah pengaduan yang diajukan kembali, tetapi dampak itu belum terbukti dalam praktik.'],
          terbukti: ['Berbagai evaluasi membuktikan bahwa tanggapan dalam bahasa sederhana mengurangi jumlah pengaduan yang diajukan kembali.'] },
          klaim: {
            terbukti: ['Tanggapan dalam bahasa sederhana telah terbukti mengurangi jumlah pengaduan yang diajukan kembali.'],
            mungkin: ['Pada prinsipnya, tanggapan dalam bahasa sederhana dapat mengurangi jumlah pengaduan yang diajukan kembali.'],
            belum: ['Manfaat tanggapan dalam bahasa sederhana bagi berkurangnya pengaduan yang diajukan kembali belum terbukti.'] } },
        { id: 'tesis', jenis: 'latar', var: [
          'Banyak pengamat menilai cara sebuah lembaga menangani pengaduan mencerminkan kesungguhannya menjaga kepercayaan konsumen.',
          'Cara sebuah lembaga menanggapi keluhan kerap dianggap cermin kesungguhannya menjaga kepercayaan konsumen.'] },
        { id: 'kuantor', jenis: 'kuantor', kelompok: 'petugas', var: {
          'tidak-semua': ['Meski demikian, tidak semua petugas layanan sudah terlatih menangani pengaduan yang menyangkut transaksi digital.'],
          sebagian: ['Sebagian petugas layanan bahkan telah dibekali pelatihan khusus untuk menangani pengaduan transaksi digital.'] },
          klaim: {
            'tidak-semua': { semua: ['Semua petugas layanan sudah terlatih menangani pengaduan yang menyangkut transaksi digital.'], 'ada-tidak': ['Ada petugas layanan yang belum terlatih menangani pengaduan yang menyangkut transaksi digital.'] },
            sebagian: { 'tidak-ada': ['Tidak ada petugas layanan yang dibekali pelatihan khusus untuk menangani pengaduan transaksi digital.'], 'sebagian-besar': ['Sebagian besar petugas layanan telah dibekali pelatihan khusus untuk menangani pengaduan transaksi digital.'], ada: ['Ada petugas layanan yang telah dibekali pelatihan khusus untuk menangani pengaduan transaksi digital.'] } } },
        { id: 'hambatan', jenis: 'daftar', subjek: 'pengaduan', himp: 'hambatan', pool: ['kontak', 'tumpuk', 'istilahTeknis', 'pindah'], n: [2, 3],
          var: { terbuka: ['Penanganannya masih menghadapi sejumlah kendala, seperti {daftar}.', 'Di lapangan, petugas kerap terhambat oleh berbagai hal, antara lain {daftar}.'] },
          klaim: { terbuka: { ya: ['{x} merupakan salah satu kendala dalam penanganan pengaduan konsumen.'], tunggal: ['Satu-satunya kendala dalam penanganan pengaduan konsumen adalah {x}.'] } } },
        { id: 'syarat', jenis: 'syarat', aksi: 'mediasi', min: 5, maks: 50, langkah: 5, var: {
          perlu: ['Fasilitas mediasi hanya ditawarkan untuk pengaduan yang diajukan bersama oleh sekurang-kurangnya {t} konsumen.'],
          cukup: ['Setiap pengaduan yang diajukan bersama oleh {t} konsumen atau lebih otomatis ditawari fasilitas mediasi.'] },
          klaim: { pasti: ['Pengaduan yang diajukan bersama oleh {v} konsumen pasti ditawari fasilitas mediasi.'], tidak: ['Pengaduan yang diajukan bersama oleh {v} konsumen tidak dapat ditawari fasilitas mediasi.'] } },
        { id: 'batas', jenis: 'batas', aksi: 'tanggap', satuan: 'hari kerja', min: 3, maks: 20, langkah: 1, var: [
          'Penyedia jasa wajib menyampaikan tanggapan tertulis paling lambat {t} hari kerja setelah pengaduan diterima.'],
          klaim: {
            memenuhi: ['Tanggapan tertulis yang disampaikan {v} hari kerja setelah pengaduan diterima masih memenuhi batas waktu.'],
            melewati: ['Tanggapan tertulis yang disampaikan {v} hari kerja setelah pengaduan diterima sudah melewati batas waktu.'] },
          lain: { aksi: 'ulang', klaim: ['Konsumen yang ingin menanggapi balik harus mengajukan pengaduan ulang paling lambat {t} hari kerja setelah menerima tanggapan.'] } },
        { id: 'penutup', jenis: 'latar', var: [
          'Pengaduan yang ditangani dengan baik pada akhirnya dapat menjadi bahan perbaikan layanan, bukan sekadar keluhan yang harus diselesaikan.',
          'Karena itu, penanganan pengaduan kini dipandang sebagai bagian penting dari pelayanan, bukan urusan tambahan.'] }
      ]
    },
    {
      id: 'keamanan-akun', judul: 'Keamanan Akun Digital',
      istilah: {
        pengamanan: 'langkah pengamanan akun', cegah: 'langkah pencegahan', tangani: 'langkah penanganan setelah pembobolan',
        sandiKuat: 'pemakaian kata sandi yang kuat', duaLangkah: 'pengaktifan verifikasi dua langkah', perbarui: 'pembaruan aplikasi secara berkala',
        blokir: 'pemblokiran akun yang dibobol', pulih: 'pemulihan akun melalui layanan pelanggan', riwayatLogin: 'pemeriksaan riwayat login',
        aplikasi: 'aplikasi', notifikasi: { n: 'pemberitahuan setiap kali ada login baru', p: 'peringatan saat akun dibuka dari perangkat lain' },
        sidik: { n: 'login dengan sidik jari', p: 'masuk memakai pemindai sidik jari' }, perangkat: 'daftar perangkat yang pernah dipakai',
        keluarJauh: { n: 'fitur keluar dari perangkat lain dari jarak jauh', p: 'mengakhiri sesi di perangkat lain tanpa menyentuhnya' }, wajah: 'pengenalan wajah',
        verifikasi: 'verifikasi dua langkah', bobol: 'pembobolan akun', rugi: 'kerugian pengguna',
        kunciFisik: 'kunci keamanan berbentuk perangkat kecil', pengguna: 'pengguna',
        tipu: { n: 'pesan tipuan yang meniru lembaga resmi', p: 'pesan palsu yang mengatasnamakan lembaga resmi' }, catat: 'kebiasaan menyimpan kata sandi di catatan ponsel',
        publik: 'pemakaian jaringan internet umum', lengah: 'kelengahan saat membagikan kode verifikasi', tua: 'perangkat lama yang tidak lagi mendapat pembaruan',
        naikBatas: 'batas transfer harian', lapor: 'layanan pelanggan', kembali: 'pengembalian dana',
        kantorUji: 'dua perusahaan jasa', tautan: 'jumlah pegawai yang membuka tautan berbahaya',
        kodeApl: 'kode dari aplikasi autentikator', kodeSms: 'kode melalui pesan singkat', tanya: 'pertanyaan keamanan'
      },
      alur: [
        { id: 'def', jenis: 'latar', wajib: true, var: [
          'Makin banyak urusan sehari-hari kini dilakukan lewat akun digital, mulai dari berkirim surat hingga mengelola tabungan.',
          'Akun digital kini menyimpan banyak hal penting, mulai dari surat-menyurat hingga catatan keuangan pemiliknya.'] },
        { id: 'konteks', jenis: 'latar', var: [
          'Karena itu, pembobolan satu akun saja dapat menimbulkan kerugian yang besar bagi pemiliknya.',
          'Akibatnya, akun yang jatuh ke tangan orang lain dapat dipakai untuk berbagai tindak kejahatan.'] },
        { id: 'gol', jenis: 'golongan', induk: 'pengamanan', anggota: ['cegah', 'tangani'], kata: 'kelompok', var: [
          'Langkah pengamanan akun umumnya dibagi menjadi dua kelompok, yaitu langkah pencegahan dan langkah penanganan setelah pembobolan.'] },
        { id: 'cakupan', jenis: 'cakupan', ikut: 'gol', x: 'cegah', masuk: ['sandiKuat', 'duaLangkah', 'perbarui'], nMasuk: [2, 3], keluar: ['blokir', 'pulih'], nKeluar: [1, 2], luar: ['riwayatLogin'], var: [
          { t: 'Langkah pencegahan mencakup {masuk}, sedangkan {keluar} termasuk langkah penanganan setelah pembobolan.', pm: 'mencakup', pk: 'termasuk', keluarKe: 'tangani' },
          { t: 'Yang tergolong langkah pencegahan antara lain {masuk}, tetapi tidak termasuk {keluar}.', pm: 'tergolong', pk: 'tidak termasuk' }] },
        { id: 'fitur', jenis: 'daftar', subjek: 'aplikasi', himp: 'fitur', pool: ['notifikasi', 'sidik', 'perangkat', 'keluarJauh', 'wajah'], n: [3, 4],
          var: { terbuka: ['Banyak aplikasi kini menyediakan fitur pengaman tambahan, seperti {daftar}.'],
            tertutup: ['Pada versi awalnya, sebuah aplikasi perbankan hanya menyediakan {daftar} sebagai fitur pengaman tambahan.'] },
          klaim: {
            terbuka: { ya: ['Ada aplikasi yang menyediakan {x}.'], tidak: ['Tidak ada aplikasi yang menyediakan {x}.'] },
            tertutup: { ya: ['Versi awal aplikasi perbankan tersebut sudah menyediakan {x}.'], tidak: ['Versi awal aplikasi perbankan tersebut belum menyediakan {x}.'] } } },
        { id: 'banding', jenis: 'banding', urut: ['kodeApl', 'kodeSms', 'tanya'], adj: 'aman',
          pra: ['Cara memastikan bahwa yang masuk benar-benar pemilik akun juga beragam.'],
          var: {
            rantai: ['Kode dari aplikasi autentikator lebih aman daripada kode melalui pesan singkat, sedangkan kode melalui pesan singkat lebih aman daripada pertanyaan keamanan.',
              ['Kode dari aplikasi autentikator lebih aman daripada kode melalui pesan singkat.', 'Kode melalui pesan singkat sendiri lebih aman daripada pertanyaan keamanan.']],
            cabang: ['Kode dari aplikasi autentikator lebih aman daripada kode melalui pesan singkat maupun pertanyaan keamanan.'] },
          klaim: ['{X} lebih aman daripada {Y}.'] },
        { id: 'sebab', jenis: 'sebab', ket: ['verifikasi dua langkah menekan jumlah pembobolan akun', 'pembobolan akun menambah kerugian pengguna'], akhir: 'verifikasi dua langkah pada akhirnya ikut menekan kerugian pengguna', mata: [
          { dari: 'verifikasi', ke: 'bobol', arah: 'turun', var: [{ t: 'Verifikasi dua langkah menekan jumlah pembobolan akun karena kata sandi saja tidak lagi cukup untuk masuk.', p: 'menekan jumlah pembobolan akun' }] },
          { dari: 'bobol', ke: 'rugi', arah: 'naik', var: [{ t: 'Setiap pembobolan akun pada gilirannya menambah kerugian pengguna.', p: 'menambah kerugian pengguna' }] }],
          gabung: [{ t: 'Verifikasi dua langkah menekan jumlah pembobolan akun, dan setiap pembobolan akun pada gilirannya menambah kerugian pengguna.', p: ['menekan jumlah pembobolan akun', 'menambah kerugian pengguna'] }],
          klaim: {
            m0: { sama: [{ t: 'Jumlah pembobolan akun berkurang berkat verifikasi dua langkah.', p: 'jumlah pembobolan akun berkurang' }], balik: [{ t: 'Verifikasi dua langkah menambah jumlah pembobolan akun.', p: 'menambah jumlah pembobolan akun' }] },
            m1: { sama: [{ t: 'Pembobolan akun ikut memperbesar kerugian pengguna.', p: 'memperbesar kerugian pengguna' }], balik: [{ t: 'Pembobolan akun mengurangi kerugian pengguna.', p: 'mengurangi kerugian pengguna' }] },
            rantai: { sama: [{ t: 'Verifikasi dua langkah turut mengurangi kerugian pengguna.', p: 'mengurangi kerugian pengguna' }], balik: [{ t: 'Verifikasi dua langkah menambah kerugian pengguna.', p: 'menambah kerugian pengguna' }] },
            terbalik: [{ t: 'Kerugian pengguna yang besar mendorong pemakaian verifikasi dua langkah.', p: 'mendorong pemakaian verifikasi dua langkah', dari: 'rugi', ke: 'verifikasi', arah: 'naik' }] } },
        { id: 'temuan', jenis: 'temuan', hal: 'tautan', lingkup: 'kantorUji', arah: 'turun',
          var: [{ t: 'Uji coba di dua perusahaan jasa menunjukkan bahwa pelatihan singkat tentang keamanan digital menurunkan jumlah pegawai yang membuka tautan berbahaya.', p: 'menurunkan jumlah pegawai yang membuka tautan berbahaya' }],
          pancing: ['Hasil itu membuat pelatihan serupa mulai ditawarkan kepada perusahaan lain.'],
          klaim: {
            sama: [{ t: 'Di dua perusahaan jasa tempat uji coba, pelatihan singkat tentang keamanan digital mengurangi jumlah pegawai yang membuka tautan berbahaya.', p: 'mengurangi jumlah pegawai yang membuka tautan berbahaya' }],
            arah: [{ t: 'Di dua perusahaan jasa tempat uji coba, pelatihan singkat tentang keamanan digital menambah jumlah pegawai yang membuka tautan berbahaya.', p: 'menambah jumlah pegawai yang membuka tautan berbahaya' }],
            umum: [{ t: 'Pelatihan singkat tentang keamanan digital menurunkan jumlah pegawai yang membuka tautan berbahaya di semua perusahaan.', p: 'menurunkan jumlah pegawai yang membuka tautan berbahaya' }] } },
        { id: 'status', jenis: 'status', hal: 'kunciFisik', var: {
          teori: ['Secara teori, kunci keamanan berbentuk perangkat kecil dapat menggantikan kata sandi sepenuhnya.'],
          belum: ['Secara teori, kunci keamanan berbentuk perangkat kecil dapat menggantikan kata sandi sepenuhnya, tetapi kemampuan itu belum terbukti pada pengguna umum.'] },
          klaim: {
            terbukti: ['Kunci keamanan berbentuk perangkat kecil telah terbukti mampu menggantikan kata sandi sepenuhnya.'],
            mungkin: ['Pada prinsipnya, kunci keamanan berbentuk perangkat kecil dapat menggantikan kata sandi.'],
            belum: ['Kemampuan kunci keamanan berbentuk perangkat kecil menggantikan kata sandi sepenuhnya belum terbukti.'] } },
        { id: 'kuantor', jenis: 'kuantor', kelompok: 'pengguna', var: {
          'tidak-semua': ['Kenyataannya, tidak semua pengguna memeriksa alamat situs sebelum memasukkan kata sandi.'],
          sebagian: ['Sebagian pengguna bahkan memakai kata sandi yang sama untuk beberapa akun sekaligus.'] },
          klaim: {
            'tidak-semua': { semua: ['Semua pengguna memeriksa alamat situs sebelum memasukkan kata sandi.'], 'ada-tidak': ['Ada pengguna yang tidak memeriksa alamat situs sebelum memasukkan kata sandi.'] },
            sebagian: { 'tidak-ada': ['Tidak ada pengguna yang memakai kata sandi yang sama untuk beberapa akun sekaligus.'], 'sebagian-besar': ['Sebagian besar pengguna memakai kata sandi yang sama untuk beberapa akun sekaligus.'], ada: ['Ada pengguna yang memakai kata sandi yang sama untuk beberapa akun sekaligus.'] } } },
        { id: 'hambatan', jenis: 'daftar', subjek: 'pengamanan', himp: 'hambatan', pool: ['tipu', 'catat', 'publik', 'lengah', 'tua'], n: [2, 3],
          var: { terbuka: ['Upaya pengamanan akun masih menghadapi sejumlah tantangan, seperti {daftar}.', 'Di sisi lain, pengamanan akun masih menghadapi tantangan, antara lain {daftar}.'] },
          klaim: { terbuka: { ya: ['{x} merupakan salah satu tantangan dalam pengamanan akun digital.'], tunggal: ['Satu-satunya tantangan dalam pengamanan akun digital adalah {x}.'] } } },
        { id: 'syarat', jenis: 'syarat', aksi: 'naikBatas', min: 1, maks: 12, langkah: 1, var: {
          perlu: ['Pada sebuah aplikasi perbankan, batas transfer harian hanya dapat dinaikkan oleh pengguna yang akunnya telah aktif sekurang-kurangnya {t} bulan.'],
          cukup: ['Pada sebuah aplikasi perbankan, setiap pengguna yang akunnya telah aktif {t} bulan atau lebih otomatis dapat menaikkan batas transfer harian.'] },
          klaim: { pasti: ['Pengguna yang akunnya telah aktif {v} bulan pasti dapat menaikkan batas transfer harian.'], tidak: ['Pengguna yang akunnya telah aktif {v} bulan tidak dapat menaikkan batas transfer harian.'] } },
        { id: 'batas', jenis: 'batas', aksi: 'lapor', satuan: 'jam', min: 12, maks: 72, langkah: 12, var: [
          'Pengguna yang akunnya dibobol diminta melapor ke layanan pelanggan paling lambat {t} jam setelah kejadian diketahui.'],
          klaim: {
            memenuhi: ['Pengguna yang melapor ke layanan pelanggan {v} jam setelah kejadian diketahui masih memenuhi batas waktu.'],
            melewati: ['Pengguna yang melapor ke layanan pelanggan {v} jam setelah kejadian diketahui sudah melewati batas waktu.'] },
          lain: { aksi: 'kembali', klaim: ['Bank wajib menyelesaikan pengembalian dana paling lambat {t} jam setelah laporan diterima.'] } },
        { id: 'penutup', jenis: 'latar', var: [
          'Karena itu, kebiasaan kecil pengguna sering kali sama pentingnya dengan teknologi pengaman yang dipakai.',
          'Pada akhirnya, keamanan akun ditentukan oleh teknologi dan kebiasaan pemiliknya sekaligus.'] }
      ]
    },
    {
      id: 'arsip-digital', judul: 'Pengelolaan Arsip Digital',
      istilah: {
        arsip: 'arsip kantor', dinamis: 'arsip dinamis', statis: 'arsip statis',
        suratProses: 'surat-menyurat yang masih diproses', kontrak: 'kontrak kerja yang masih berlaku', laporanBerjalan: 'laporan keuangan tahun berjalan',
        pendirian: 'dokumen pendirian kantor', fotoSejarah: 'foto peristiwa bersejarah', notulen: 'notulen rapat',
        sistem: 'sistem arsip digital', cariTanggal: { n: 'pencarian berdasarkan tanggal', p: 'menemukan dokumen menurut tanggalnya' },
        riwayat: { n: 'pencatatan riwayat perubahan', p: 'melacak siapa saja yang mengubah dokumen' }, hakAkses: 'pengaturan hak akses',
        tandai: { n: 'penandaan dokumen terkait', p: 'menghubungkan dokumen yang saling berkaitan' }, cadangan: 'pencadangan otomatis',
        seragam: 'penamaan berkas yang seragam', cari: 'pencarian dokumen', ganda: 'salinan ganda',
        ruang: 'kebutuhan ruang penyimpanan', pegawai: 'pegawai',
        pindai: 'kualitas pemindaian yang rendah', asal: 'dokumen tanpa keterangan asal', rapuh: 'kertas lama yang mudah sobek saat dipindai',
        biaya: 'mahalnya biaya pemindaian dalam jumlah besar', peralihan: 'peralihan ke arsip digital',
        musnah: 'daftar pemusnahan', unggah: 'diunggah ke sistem', periksaLengkap: 'pemeriksaan kelengkapan',
        cabang: 'tiga kantor cabang', salahSimpan: 'jumlah dokumen yang salah simpan',
        pita: 'pita magnetik', optik: 'cakram optik', keras: 'cakram keras eksternal'
      },
      alur: [
        { id: 'def', jenis: 'latar', wajib: true, var: [
          'Banyak kantor kini mengalihkan dokumen kertasnya ke dalam bentuk digital agar lebih mudah disimpan dan dicari.',
          'Peralihan dari lemari arsip ke penyimpanan digital kini menjadi pekerjaan rutin di banyak kantor.'] },
        { id: 'konteks', jenis: 'latar', var: [
          'Peralihan itu tidak sekadar memindai kertas, tetapi juga menuntut aturan penyimpanan yang tertib.',
          'Pekerjaan ini menuntut ketelitian, sebab dokumen yang salah simpan hampir sama sulitnya ditemukan dengan dokumen yang hilang.'] },
        { id: 'gol', jenis: 'golongan', induk: 'arsip', anggota: ['dinamis', 'statis'], kata: 'jenis', var: [
          'Arsip kantor dibedakan menjadi dua jenis, yaitu arsip dinamis dan arsip statis.',
          'Menurut kegunaannya, ada dua jenis arsip kantor, yaitu arsip dinamis dan arsip statis.'] },
        { id: 'cakupan', jenis: 'cakupan', ikut: 'gol', x: 'dinamis', masuk: ['suratProses', 'kontrak', 'laporanBerjalan'], nMasuk: [2, 3], keluar: ['pendirian', 'fotoSejarah'], nKeluar: [1, 2], luar: ['notulen'], var: [
          { t: 'Arsip dinamis mencakup {masuk}, sedangkan {keluar} termasuk arsip statis.', pm: 'mencakup', pk: 'termasuk', keluarKe: 'statis' },
          { t: 'Yang tergolong arsip dinamis antara lain {masuk}, tetapi tidak termasuk {keluar}.', pm: 'tergolong', pk: 'tidak termasuk' }] },
        { id: 'fitur', jenis: 'daftar', subjek: 'sistem', himp: 'fitur', pool: ['cariTanggal', 'riwayat', 'hakAkses', 'tandai', 'cadangan'], n: [3, 4],
          var: { terbuka: ['Sistem arsip digital umumnya dilengkapi berbagai fitur, seperti {daftar}.'],
            tertutup: ['Di sebuah kantor percontohan, sistem arsip digital pada tahap pertama hanya menyediakan {daftar}.'] },
          klaim: {
            terbuka: { ya: ['Sistem arsip digital dapat dipakai untuk {x}.'], tidak: ['Sistem arsip digital tidak dapat dipakai untuk {x}.'] },
            tertutup: { parafrasa: false, ya: ['Pada tahap pertama, sistem di kantor percontohan itu sudah menyediakan {x}.'], tidak: ['Pada tahap pertama, sistem di kantor percontohan itu belum menyediakan {x}.'] } } },
        { id: 'sebab', jenis: 'sebab', ket: ['penamaan berkas yang seragam mempercepat pencarian dokumen', 'pencarian dokumen yang cepat mengurangi salinan ganda'], akhir: 'penamaan berkas yang seragam pada akhirnya ikut mengurangi salinan ganda', mata: [
          { dari: 'seragam', ke: 'cari', arah: 'naik', var: [{ t: 'Penamaan berkas yang seragam mempercepat pencarian dokumen.', p: 'mempercepat pencarian dokumen' }] },
          { dari: 'cari', ke: 'ganda', arah: 'turun', var: [{ t: 'Pencarian dokumen yang cepat pada gilirannya mengurangi salinan ganda, karena pegawai tidak perlu membuat ulang dokumen yang sulit ditemukan.', p: 'mengurangi salinan ganda' }] }],
          gabung: [{ t: 'Penamaan berkas yang seragam mempercepat pencarian dokumen, dan pencarian yang cepat pada gilirannya mengurangi salinan ganda.', p: ['mempercepat pencarian dokumen', 'mengurangi salinan ganda'] }],
          klaim: {
            m0: { sama: [{ t: 'Pencarian dokumen menjadi lebih cepat berkat penamaan berkas yang seragam.', p: 'pencarian dokumen menjadi lebih cepat' }], balik: [{ t: 'Penamaan berkas yang seragam memperlambat pencarian dokumen.', p: 'memperlambat pencarian dokumen' }] },
            m1: { sama: [{ t: 'Pencarian dokumen yang cepat ikut mengurangi salinan ganda.', p: 'mengurangi salinan ganda' }], balik: [{ t: 'Pencarian dokumen yang cepat menambah salinan ganda.', p: 'menambah salinan ganda' }] },
            rantai: { sama: [{ t: 'Penamaan berkas yang seragam turut mengurangi salinan ganda.', p: 'mengurangi salinan ganda' }], balik: [{ t: 'Penamaan berkas yang seragam menambah salinan ganda.', p: 'menambah salinan ganda' }] },
            terbalik: [{ t: 'Banyaknya salinan ganda mendorong kantor menyeragamkan penamaan berkas.', p: 'mendorong kantor menyeragamkan penamaan berkas', dari: 'ganda', ke: 'seragam', arah: 'naik', nk: 'penamaan berkas' }] } },
        { id: 'temuan', jenis: 'temuan', hal: 'salahSimpan', lingkup: 'cabang', arah: 'turun',
          var: [{ t: 'Pengamatan di tiga kantor cabang menunjukkan bahwa pelatihan singkat bagi pegawai menurunkan jumlah dokumen yang salah simpan.', p: 'menurunkan jumlah dokumen yang salah simpan' }],
          pancing: ['Kantor pusat kemudian berencana mengadakan pelatihan serupa di kantor cabang lainnya.'],
          klaim: {
            sama: [{ t: 'Di tiga kantor cabang yang diamati, pelatihan singkat bagi pegawai mengurangi jumlah dokumen yang salah simpan.', p: 'mengurangi jumlah dokumen yang salah simpan' }],
            arah: [{ t: 'Di tiga kantor cabang yang diamati, pelatihan singkat bagi pegawai menambah jumlah dokumen yang salah simpan.', p: 'menambah jumlah dokumen yang salah simpan' }],
            umum: [{ t: 'Pelatihan singkat bagi pegawai menurunkan jumlah dokumen yang salah simpan di seluruh kantor.', p: 'menurunkan jumlah dokumen yang salah simpan' }] } },
        { id: 'status', jenis: 'status', hal: 'ruang', var: {
          teori: ['Secara teori, peralihan ke arsip digital dapat memangkas kebutuhan ruang penyimpanan hingga sepersepuluhnya.'],
          belum: ['Secara teori, peralihan ke arsip digital dapat memangkas kebutuhan ruang penyimpanan hingga sepersepuluhnya, tetapi angka itu belum terbukti di kantor-kantor yang sudah beralih.'],
          terbukti: ['Pengalaman kantor-kantor yang sudah beralih membuktikan bahwa arsip digital memangkas kebutuhan ruang penyimpanan hingga sepersepuluhnya.'] },
          klaim: {
            terbukti: ['Peralihan ke arsip digital telah terbukti memangkas kebutuhan ruang penyimpanan hingga sepersepuluhnya.'],
            mungkin: ['Pada prinsipnya, arsip digital dapat memangkas kebutuhan ruang penyimpanan.'],
            belum: ['Penghematan ruang penyimpanan hingga sepersepuluhnya berkat arsip digital belum terbukti.'] } },
        { id: 'banding', jenis: 'banding', urut: ['pita', 'optik', 'keras'], adj: 'tahan lama',
          pra: ['Kantor juga perlu memilih media cadangan yang tepat untuk penyimpanan jangka panjang.'],
          var: {
            rantai: ['Untuk penyimpanan jangka panjang, pita magnetik lebih tahan lama daripada cakram optik, sedangkan cakram optik lebih tahan lama daripada cakram keras eksternal.',
              ['Pita magnetik lebih tahan lama daripada cakram optik.', 'Cakram optik sendiri lebih tahan lama daripada cakram keras eksternal.']],
            cabang: ['Untuk penyimpanan jangka panjang, pita magnetik lebih tahan lama daripada cakram optik maupun cakram keras eksternal.'] },
          klaim: ['{X} lebih tahan lama daripada {Y}.'] },
        { id: 'kuantor', jenis: 'kuantor', kelompok: 'pegawai', var: {
          'tidak-semua': ['Meski demikian, tidak semua pegawai sudah terbiasa mencari dokumen lewat sistem.'],
          sebagian: ['Sebagian pegawai masih menyimpan salinan kertas sebagai cadangan pribadi.'] },
          klaim: {
            'tidak-semua': { semua: ['Semua pegawai sudah terbiasa mencari dokumen lewat sistem.'], 'ada-tidak': ['Ada pegawai yang belum terbiasa mencari dokumen lewat sistem.'] },
            sebagian: { 'tidak-ada': ['Tidak ada pegawai yang masih menyimpan salinan kertas sebagai cadangan pribadi.'], 'sebagian-besar': ['Sebagian besar pegawai masih menyimpan salinan kertas sebagai cadangan pribadi.'], ada: ['Ada pegawai yang masih menyimpan salinan kertas sebagai cadangan pribadi.'] } } },
        { id: 'hambatan', jenis: 'daftar', subjek: 'peralihan', himp: 'hambatan', pool: ['pindai', 'asal', 'rapuh', 'biaya'], n: [2, 3],
          var: { terbuka: ['Peralihan ini tidak lepas dari kendala, seperti {daftar}.', 'Di banyak kantor, peralihan itu masih terganjal sejumlah kendala, antara lain {daftar}.'] },
          klaim: { terbuka: { ya: ['{x} merupakan salah satu kendala dalam peralihan ke arsip digital.'], tunggal: ['Satu-satunya kendala dalam peralihan ke arsip digital adalah {x}.'] } } },
        { id: 'syarat', jenis: 'syarat', aksi: 'musnah', min: 2, maks: 12, langkah: 1, var: {
          perlu: ['Arsip kertas hanya dimasukkan ke daftar pemusnahan bila telah disimpan sekurang-kurangnya {t} tahun.'],
          cukup: ['Setiap arsip kertas yang telah disimpan {t} tahun atau lebih otomatis dimasukkan ke daftar pemusnahan.'] },
          klaim: { pasti: ['Arsip kertas yang telah disimpan {v} tahun pasti dimasukkan ke daftar pemusnahan.'], tidak: ['Arsip kertas yang telah disimpan {v} tahun tidak dapat dimasukkan ke daftar pemusnahan.'] } },
        { id: 'batas', jenis: 'batas', aksi: 'unggah', satuan: 'hari kerja', min: 1, maks: 10, langkah: 1, var: [
          'Dokumen yang selesai ditandatangani harus diunggah ke sistem paling lambat {t} hari kerja setelah penandatanganan.'],
          klaim: {
            memenuhi: ['Dokumen yang diunggah ke sistem {v} hari kerja setelah penandatanganan masih memenuhi batas waktu.'],
            melewati: ['Dokumen yang diunggah ke sistem {v} hari kerja setelah penandatanganan sudah melewati batas waktu.'] },
          lain: { aksi: 'periksaLengkap', klaim: ['Petugas arsip harus menyelesaikan pemeriksaan kelengkapan paling lambat {t} hari kerja setelah dokumen diunggah.'] } },
        { id: 'penutup', jenis: 'latar', var: [
          'Dengan pengelolaan yang tertib, arsip digital dapat menjadi ingatan lembaga yang mudah ditelusuri kapan saja.',
          'Pada akhirnya, arsip yang tertata memudahkan kantor mempertanggungjawabkan pekerjaannya.'] }
      ]
    },
    {
      id: 'distribusi-pangan', judul: 'Distribusi Pangan Segar',
      istilah: {
        distribusi: 'distribusi pangan segar', antargudang: 'pengiriman antargudang', antarToko: 'pengantaran ke toko',
        timbang: 'penimbangan muatan', segel: 'penyegelan kendaraan', muat: 'pemuatan dengan forklif',
        turun: 'penurunan barang di toko', tataRak: 'penataan barang di rak toko', cuci: 'pencucian kendaraan',
        pelacak: 'aplikasi pelacak pengiriman', posisi: { n: 'posisi kendaraan', p: 'lokasi truk pengangkut' },
        tiba: { n: 'perkiraan waktu tiba', p: 'jam kedatangan yang diperkirakan' }, pintu: 'catatan buka-tutup pintu muatan',
        pengemudi: { n: 'nama pengemudi', p: 'identitas sopir' }, rute: { n: 'rute yang sedang ditempuh', p: 'jalur perjalanan kendaraan' },
        pendingin: 'kendaraan berpendingin', rusak: 'pangan yang rusak di perjalanan', harga: 'harga di tingkat pengecer',
        sensor: 'sensor suhu jarak jauh', gudang: 'gudang di daerah',
        jalan: 'kondisi jalan yang rusak pada musim hujan', listrik: 'pasokan listrik gudang yang tidak stabil', bbm: 'kenaikan harga bahan bakar',
        kemasan: 'kemasan yang tidak tahan benturan', pemeriksa: 'kurangnya tenaga pemeriksa mutu',
        gudangBersama: 'gudang pendingin bersama', laporRusak: 'muatan yang rusak', ganti: 'penggantian barang',
        gudangUji: 'dua gudang percontohan', tertahan: 'jumlah muatan yang tertahan di halaman gudang',
        jamur: 'jamur tiram', buncis: 'buncis', labu: 'labu siam'
      },
      alur: [
        { id: 'def', jenis: 'latar', wajib: true, var: [
          'Pangan segar mudah rusak bila terlalu lama berada di perjalanan atau disimpan pada suhu yang tidak sesuai.',
          'Berbeda dengan barang kering, pangan segar hanya bertahan beberapa hari sebelum mutunya menurun.'] },
        { id: 'konteks', jenis: 'latar', var: [
          'Karena itu, distribusinya menuntut perencanaan yang cermat sejak barang meninggalkan gudang.',
          'Setiap jam keterlambatan dapat mengurangi nilai jual barang yang dibawa.'] },
        { id: 'gol', jenis: 'golongan', induk: 'distribusi', anggota: ['antargudang', 'antarToko'], kata: 'tahap', var: [
          'Distribusi pangan segar terbagi menjadi dua tahap, yaitu pengiriman antargudang dan pengantaran ke toko.'] },
        { id: 'cakupan', jenis: 'cakupan', ikut: 'gol', x: 'antargudang', masuk: ['timbang', 'segel', 'muat'], nMasuk: [2, 3], keluar: ['turun', 'tataRak'], nKeluar: [1, 2], luar: ['cuci'], var: [
          { t: 'Pengiriman antargudang mencakup {masuk}, sedangkan {keluar} termasuk pengantaran ke toko.', pm: 'mencakup', pk: 'termasuk', keluarKe: 'antarToko' },
          { t: 'Yang tergolong pengiriman antargudang antara lain {masuk}, tetapi tidak termasuk {keluar}.', pm: 'tergolong', pk: 'tidak termasuk' }] },
        { id: 'info', jenis: 'daftar', subjek: 'pelacak', himp: 'info', pool: ['posisi', 'tiba', 'pintu', 'pengemudi', 'rute'], n: [3, 4],
          var: { terbuka: ['Melalui aplikasi pelacak pengiriman, pengelola dapat memantau berbagai informasi, seperti {daftar}.'],
            tertutup: ['Pada uji coba pertamanya, aplikasi pelacak pengiriman hanya menampilkan {daftar}.'] },
          klaim: {
            terbuka: { ya: ['Aplikasi pelacak pengiriman dapat menampilkan {x}.'], tidak: ['Aplikasi pelacak pengiriman tidak dapat menampilkan {x}.'] },
            tertutup: { ya: ['Pada uji coba pertama, aplikasi pelacak pengiriman sudah menampilkan {x}.'], tidak: ['Pada uji coba pertama, aplikasi pelacak pengiriman belum menampilkan {x}.'] } } },
        { id: 'sebab', jenis: 'sebab', ket: ['kendaraan berpendingin mengurangi jumlah pangan yang rusak di perjalanan', 'pangan yang rusak di perjalanan menaikkan harga di tingkat pengecer'], akhir: 'kendaraan berpendingin pada akhirnya ikut menekan harga di tingkat pengecer', mata: [
          { dari: 'pendingin', ke: 'rusak', arah: 'turun', var: [{ t: 'Kendaraan berpendingin mengurangi jumlah pangan yang rusak di perjalanan.', p: 'mengurangi jumlah pangan yang rusak di perjalanan' }] },
          { dari: 'rusak', ke: 'harga', arah: 'naik', var: [{ t: 'Banyaknya pangan yang rusak di perjalanan pada gilirannya menaikkan harga di tingkat pengecer.', p: 'menaikkan harga di tingkat pengecer' }] }],
          gabung: [{ t: 'Kendaraan berpendingin mengurangi jumlah pangan yang rusak di perjalanan, dan banyaknya pangan yang rusak di perjalanan pada gilirannya menaikkan harga di tingkat pengecer.', p: ['mengurangi jumlah pangan yang rusak di perjalanan', 'menaikkan harga di tingkat pengecer'] }],
          klaim: {
            m0: { sama: [{ t: 'Jumlah pangan yang rusak di perjalanan berkurang berkat kendaraan berpendingin.', p: 'jumlah pangan yang rusak di perjalanan berkurang' }], balik: [{ t: 'Kendaraan berpendingin menambah jumlah pangan yang rusak di perjalanan.', p: 'menambah jumlah pangan yang rusak di perjalanan' }] },
            m1: { sama: [{ t: 'Pangan yang rusak di perjalanan ikut mendorong naiknya harga di tingkat pengecer.', p: 'mendorong naiknya harga di tingkat pengecer' }], balik: [{ t: 'Pangan yang rusak di perjalanan menurunkan harga di tingkat pengecer.', p: 'menurunkan harga di tingkat pengecer' }] },
            rantai: { sama: [{ t: 'Kendaraan berpendingin turut menekan harga di tingkat pengecer.', p: 'menekan harga di tingkat pengecer' }], balik: [{ t: 'Kendaraan berpendingin menaikkan harga di tingkat pengecer.', p: 'menaikkan harga di tingkat pengecer' }] },
            terbalik: [{ t: 'Tingginya harga di tingkat pengecer mendorong distributor memakai kendaraan berpendingin.', p: 'mendorong distributor memakai kendaraan berpendingin', dari: 'harga', ke: 'pendingin', arah: 'naik' }] } },
        { id: 'temuan', jenis: 'temuan', hal: 'tertahan', lingkup: 'gudangUji', arah: 'turun',
          var: [{ t: 'Catatan di dua gudang percontohan menunjukkan bahwa penjadwalan bongkar muat menurunkan jumlah muatan yang tertahan di halaman gudang.', p: 'menurunkan jumlah muatan yang tertahan di halaman gudang' }],
          pancing: ['Koperasi pun mulai menyiapkan jadwal serupa untuk gudang-gudang lainnya.'],
          klaim: {
            sama: [{ t: 'Di dua gudang percontohan, penjadwalan bongkar muat mengurangi jumlah muatan yang tertahan di halaman gudang.', p: 'mengurangi jumlah muatan yang tertahan di halaman gudang' }],
            arah: [{ t: 'Di dua gudang percontohan, penjadwalan bongkar muat menambah jumlah muatan yang tertahan di halaman gudang.', p: 'menambah jumlah muatan yang tertahan di halaman gudang' }],
            umum: [{ t: 'Di semua gudang, penjadwalan bongkar muat menurunkan jumlah muatan yang tertahan di halaman gudang.', p: 'menurunkan jumlah muatan yang tertahan di halaman gudang' }] } },
        { id: 'status', jenis: 'status', hal: 'sensor', var: {
          teori: ['Secara teori, sensor suhu jarak jauh memungkinkan gangguan pendinginan diketahui sebelum muatan rusak.'],
          belum: ['Secara teori, sensor suhu jarak jauh memungkinkan gangguan pendinginan diketahui sebelum muatan rusak, tetapi kemampuan itu belum terbukti pada armada kecil.'],
          terbukti: ['Pengalaman para distributor besar membuktikan bahwa sensor suhu jarak jauh membuat gangguan pendinginan diketahui sebelum muatan rusak.'] },
          klaim: {
            terbukti: ['Sensor suhu jarak jauh telah terbukti membuat gangguan pendinginan diketahui sebelum muatan rusak.'],
            mungkin: ['Pada prinsipnya, sensor suhu jarak jauh memungkinkan gangguan pendinginan diketahui lebih awal.'],
            belum: ['Manfaat sensor suhu jarak jauh untuk mengetahui gangguan pendinginan lebih awal belum terbukti.'] } },
        { id: 'banding', jenis: 'banding', urut: ['jamur', 'buncis', 'labu'], adj: 'cepat rusak',
          pra: ['Daya tahan tiap jenis sayuran di perjalanan pun berbeda-beda.'],
          var: {
            rantai: ['Pada suhu ruang, jamur tiram lebih cepat rusak daripada buncis, sedangkan buncis lebih cepat rusak daripada labu siam.',
              ['Pada suhu ruang, jamur tiram lebih cepat rusak daripada buncis.', 'Buncis sendiri lebih cepat rusak daripada labu siam.']],
            cabang: ['Pada suhu ruang, jamur tiram lebih cepat rusak daripada buncis maupun labu siam.'] },
          klaim: ['{X} lebih cepat rusak daripada {Y}.'] },
        { id: 'kuantor', jenis: 'kuantor', kelompok: 'gudang', var: {
          'tidak-semua': ['Masalahnya, tidak semua gudang di daerah memiliki ruang pendingin sendiri.'],
          sebagian: ['Sebagian gudang di daerah kini sudah memiliki ruang pendingin sendiri.'] },
          klaim: {
            'tidak-semua': { semua: ['Semua gudang di daerah memiliki ruang pendingin sendiri.'], 'ada-tidak': ['Ada gudang di daerah yang tidak memiliki ruang pendingin sendiri.'] },
            sebagian: { 'tidak-ada': ['Tidak ada gudang di daerah yang sudah memiliki ruang pendingin sendiri.'], 'sebagian-besar': ['Sebagian besar gudang di daerah sudah memiliki ruang pendingin sendiri.'], ada: ['Ada gudang di daerah yang sudah memiliki ruang pendingin sendiri.'] } } },
        { id: 'hambatan', jenis: 'daftar', subjek: 'distribusi', himp: 'hambatan', pool: ['jalan', 'listrik', 'bbm', 'kemasan', 'pemeriksa'], n: [2, 3],
          var: { terbuka: ['Di lapangan, distribusi pangan segar masih menghadapi kendala, seperti {daftar}.', 'Namun, distributor masih harus menghadapi berbagai kendala, antara lain {daftar}.'] },
          klaim: { terbuka: { ya: ['{x} merupakan salah satu kendala dalam distribusi pangan segar.'], tunggal: ['Satu-satunya kendala dalam distribusi pangan segar adalah {x}.'] } } },
        { id: 'syarat', jenis: 'syarat', aksi: 'gudangBersama', min: 2, maks: 20, langkah: 2, var: {
          perlu: ['Ruang di gudang pendingin bersama hanya disewakan kepada koperasi yang mengirim sekurang-kurangnya {t} ton pangan setiap bulan.'],
          cukup: ['Setiap koperasi yang mengirim {t} ton pangan atau lebih setiap bulan otomatis mendapat ruang di gudang pendingin bersama.'] },
          klaim: { pasti: ['Koperasi yang mengirim {v} ton pangan setiap bulan pasti mendapat ruang di gudang pendingin bersama.'], tidak: ['Koperasi yang mengirim {v} ton pangan setiap bulan tidak dapat menyewa ruang di gudang pendingin bersama.'] } },
        { id: 'batas', jenis: 'batas', aksi: 'laporRusak', satuan: 'jam', min: 6, maks: 48, langkah: 6, var: [
          'Toko penerima harus melaporkan muatan yang rusak paling lambat {t} jam setelah barang diterima.'],
          klaim: {
            memenuhi: ['Toko yang melaporkan muatan yang rusak {v} jam setelah barang diterima masih memenuhi batas waktu.'],
            melewati: ['Toko yang melaporkan muatan yang rusak {v} jam setelah barang diterima sudah melewati batas waktu.'] },
          lain: { aksi: 'ganti', klaim: ['Distributor harus menyelesaikan penggantian barang paling lambat {t} jam setelah laporan diterima.'] } },
        { id: 'penutup', jenis: 'latar', var: [
          'Karena itu, koperasi terus menata jadwal dan sarana pengiriman agar pangan tiba dalam keadaan segar.',
          'Perbaikan kecil di setiap mata rantai pengiriman pada akhirnya ikut menentukan mutu pangan di meja makan.'] }
      ]
    },
    {
      id: 'perpustakaan-digital', judul: 'Perpustakaan Digital',
      istilah: {
        koleksi: 'koleksi perpustakaan digital', berlisensi: 'koleksi berlisensi', terbuka: 'koleksi terbuka',
        novel: 'novel terbitan penerbit besar', bukuAjar: 'buku ajar perguruan tinggi', majalah: 'majalah berlangganan',
        naskah: 'naskah kuno yang sudah dialihmediakan', laporanRiset: 'laporan penelitian milik perpustakaan', komik: 'komik digital',
        aplikasi: 'aplikasi perpustakaan', antre: { n: 'antrean pinjam', p: 'pemesanan buku yang sedang dipinjam orang lain' },
        ingat: { n: 'pengingat masa pinjam', p: 'pemberitahuan sebelum masa pinjam berakhir' }, penanda: { n: 'penanda halaman', p: 'penyimpanan halaman terakhir yang dibaca' },
        malam: { n: 'mode baca malam', p: 'tampilan layar yang redup' }, suara: { n: 'pembacaan teks dengan suara', p: 'pembacaan buku secara otomatis' },
        katalog: 'katalog terpadu', temu: 'penemuan koleksi', pinjam: 'jumlah peminjaman',
        minat: 'minat baca', pembaca: 'pembaca', layanan: 'layanan perpustakaan digital',
        sinyal: 'akses internet yang lemah di pedesaan', salin: 'penyalinan koleksi tanpa izin', server: 'gangguan server pada jam sibuk',
        perangkat: 'keterbatasan perangkat milik pembaca', promosi: 'promosi layanan yang belum luas',
        hak: 'hak meminjam lima buku sekaligus', ambil: 'diambil di loket', kembaliCetak: 'pengembalian buku cetak',
        perpusKota: 'dua perpustakaan kota', lansia: 'jumlah pembaca lanjut usia yang meminjam buku elektronik',
        ebook: 'buku elektronik', audio: 'buku audio', majalahDigital: 'majalah digital'
      },
      alur: [
        { id: 'def', jenis: 'latar', wajib: true, var: [
          'Perpustakaan digital memungkinkan pembaca meminjam dan membaca koleksi tanpa harus datang ke gedung perpustakaan.',
          'Kini pembaca dapat meminjam buku dari perpustakaan digital cukup dengan ponsel atau tablet.'] },
        { id: 'konteks', jenis: 'latar', var: [
          'Layanan ini makin diminati sejak banyak orang terbiasa membaca dari layar.',
          'Bagi pembaca yang tinggal jauh dari kota, layanan ini memangkas waktu dan biaya perjalanan.'] },
        { id: 'gol', jenis: 'golongan', induk: 'koleksi', anggota: ['berlisensi', 'terbuka'], kata: 'jenis', var: [
          'Koleksi perpustakaan digital terbagi menjadi dua jenis, yaitu koleksi berlisensi dan koleksi terbuka.'] },
        { id: 'cakupan', jenis: 'cakupan', ikut: 'gol', x: 'berlisensi', masuk: ['novel', 'bukuAjar', 'majalah'], nMasuk: [2, 3], keluar: ['naskah', 'laporanRiset'], nKeluar: [1, 2], luar: ['komik'], var: [
          { t: 'Koleksi berlisensi mencakup {masuk}, sedangkan {keluar} termasuk koleksi terbuka.', pm: 'mencakup', pk: 'termasuk', keluarKe: 'terbuka' },
          { t: 'Yang tergolong koleksi berlisensi antara lain {masuk}, tetapi tidak termasuk {keluar}.', pm: 'tergolong', pk: 'tidak termasuk' }] },
        { id: 'fitur', jenis: 'daftar', subjek: 'aplikasi', himp: 'fitur', pool: ['antre', 'ingat', 'penanda', 'malam', 'suara'], n: [3, 4],
          var: { terbuka: ['Aplikasinya juga menyediakan berbagai fitur, seperti {daftar}.'],
            tertutup: ['Pada versi pertamanya, aplikasi perpustakaan itu hanya menyediakan {daftar}.'] },
          klaim: {
            terbuka: { ya: ['Aplikasi perpustakaan digital menyediakan fitur {x}.'], tidak: ['Aplikasi perpustakaan digital tidak menyediakan fitur {x}.'] },
            tertutup: { ya: ['Versi pertama aplikasi perpustakaan sudah menyediakan {x}.'], tidak: ['Versi pertama aplikasi perpustakaan belum menyediakan {x}.'] } } },
        { id: 'sebab', jenis: 'sebab', ket: ['katalog terpadu mempercepat penemuan koleksi', 'penemuan koleksi yang cepat menambah jumlah peminjaman'], akhir: 'katalog terpadu pada akhirnya ikut menambah jumlah peminjaman', mata: [
          { dari: 'katalog', ke: 'temu', arah: 'naik', var: [{ t: 'Katalog terpadu mempercepat penemuan koleksi karena pembaca cukup mencari di satu tempat.', p: 'mempercepat penemuan koleksi' }] },
          { dari: 'temu', ke: 'pinjam', arah: 'naik', var: [{ t: 'Penemuan koleksi yang cepat pada gilirannya menambah jumlah peminjaman.', p: 'menambah jumlah peminjaman' }] }],
          gabung: [{ t: 'Katalog terpadu mempercepat penemuan koleksi, dan penemuan koleksi yang cepat pada gilirannya menambah jumlah peminjaman.', p: ['mempercepat penemuan koleksi', 'menambah jumlah peminjaman'] }],
          klaim: {
            m0: { sama: [{ t: 'Penemuan koleksi menjadi lebih cepat berkat katalog terpadu.', p: 'penemuan koleksi menjadi lebih cepat' }], balik: [{ t: 'Katalog terpadu memperlambat penemuan koleksi.', p: 'memperlambat penemuan koleksi' }] },
            m1: { sama: [{ t: 'Penemuan koleksi yang cepat ikut menambah jumlah peminjaman.', p: 'menambah jumlah peminjaman' }], balik: [{ t: 'Penemuan koleksi yang cepat mengurangi jumlah peminjaman.', p: 'mengurangi jumlah peminjaman' }] },
            rantai: { sama: [{ t: 'Katalog terpadu turut menambah jumlah peminjaman.', p: 'menambah jumlah peminjaman' }], balik: [{ t: 'Katalog terpadu mengurangi jumlah peminjaman.', p: 'mengurangi jumlah peminjaman' }] },
            terbalik: [{ t: 'Jumlah peminjaman yang tinggi mendorong perpustakaan membuat katalog terpadu.', p: 'mendorong perpustakaan membuat katalog terpadu', dari: 'pinjam', ke: 'katalog', arah: 'naik' }] } },
        { id: 'temuan', jenis: 'temuan', hal: 'lansia', lingkup: 'perpusKota', arah: 'naik',
          var: [{ t: 'Data di dua perpustakaan kota menunjukkan bahwa kelas pengenalan aplikasi menaikkan jumlah pembaca lanjut usia yang meminjam buku elektronik.', p: 'menaikkan jumlah pembaca lanjut usia yang meminjam buku elektronik' }],
          pancing: ['Hasil itu mendorong pengelola merencanakan kelas serupa di perpustakaan lain.'],
          klaim: {
            sama: [{ t: 'Di dua perpustakaan kota tersebut, kelas pengenalan aplikasi menambah jumlah pembaca lanjut usia yang meminjam buku elektronik.', p: 'menambah jumlah pembaca lanjut usia yang meminjam buku elektronik' }],
            arah: [{ t: 'Di dua perpustakaan kota tersebut, kelas pengenalan aplikasi mengurangi jumlah pembaca lanjut usia yang meminjam buku elektronik.', p: 'mengurangi jumlah pembaca lanjut usia yang meminjam buku elektronik' }],
            umum: [{ t: 'Kelas pengenalan aplikasi menaikkan jumlah pembaca lanjut usia yang meminjam buku elektronik di seluruh perpustakaan.', p: 'menaikkan jumlah pembaca lanjut usia yang meminjam buku elektronik' }] } },
        { id: 'status', jenis: 'status', hal: 'minat', var: {
          teori: ['Secara teori, perpustakaan digital dapat menaikkan minat baca warga di daerah yang jauh dari perpustakaan.'],
          belum: ['Secara teori, perpustakaan digital dapat menaikkan minat baca warga di daerah yang jauh dari perpustakaan, tetapi dampak itu belum terbukti dalam penelitian.'],
          terbukti: ['Berbagai penelitian membuktikan bahwa perpustakaan digital menaikkan minat baca warga di daerah yang jauh dari perpustakaan.'] },
          klaim: {
            terbukti: ['Perpustakaan digital telah terbukti menaikkan minat baca warga di daerah yang jauh dari perpustakaan.'],
            mungkin: ['Pada prinsipnya, perpustakaan digital dapat menaikkan minat baca warga di daerah terpencil.'],
            belum: ['Dampak perpustakaan digital terhadap minat baca warga di daerah terpencil belum terbukti.'] } },
        { id: 'banding', jenis: 'banding', urut: ['ebook', 'audio', 'majalahDigital'], adj: 'sering dipinjam',
          pra: ['Pola peminjaman juga berbeda menurut bentuk koleksinya.'],
          var: {
            rantai: ['Buku elektronik lebih sering dipinjam daripada buku audio, sedangkan buku audio lebih sering dipinjam daripada majalah digital.',
              ['Buku elektronik lebih sering dipinjam daripada buku audio.', 'Buku audio sendiri lebih sering dipinjam daripada majalah digital.']],
            cabang: ['Buku elektronik lebih sering dipinjam daripada buku audio maupun majalah digital.'] },
          klaim: ['{X} lebih sering dipinjam daripada {Y}.'] },
        { id: 'kuantor', jenis: 'kuantor', kelompok: 'pembaca', var: {
          'tidak-semua': ['Namun, tidak semua pembaca terbiasa membaca buku panjang di layar.'],
          sebagian: ['Sebagian pembaca bahkan meminjam versi elektronik dan versi cetak dari buku yang sama.'] },
          klaim: {
            'tidak-semua': { semua: ['Semua pembaca terbiasa membaca buku panjang di layar.'], 'ada-tidak': ['Ada pembaca yang tidak terbiasa membaca buku panjang di layar.'] },
            sebagian: { 'tidak-ada': ['Tidak ada pembaca yang meminjam versi elektronik dan versi cetak dari buku yang sama.'], 'sebagian-besar': ['Sebagian besar pembaca meminjam versi elektronik dan versi cetak dari buku yang sama.'], ada: ['Ada pembaca yang meminjam versi elektronik dan versi cetak dari buku yang sama.'] } } },
        { id: 'hambatan', jenis: 'daftar', subjek: 'layanan', himp: 'hambatan', pool: ['sinyal', 'salin', 'server', 'perangkat', 'promosi'], n: [2, 3],
          var: { terbuka: ['Pengembangannya masih menghadapi sejumlah kendala, seperti {daftar}.', 'Pengelola juga masih harus mengatasi berbagai kendala, antara lain {daftar}.'] },
          klaim: { terbuka: { ya: ['{x} merupakan salah satu kendala layanan perpustakaan digital.'], tunggal: ['Satu-satunya kendala layanan perpustakaan digital adalah {x}.'] } } },
        { id: 'syarat', jenis: 'syarat', aksi: 'hak', min: 1, maks: 12, langkah: 1, var: {
          perlu: ['Hak meminjam lima buku sekaligus hanya diberikan kepada anggota yang telah terdaftar sekurang-kurangnya {t} bulan.'],
          cukup: ['Setiap anggota yang telah terdaftar {t} bulan atau lebih otomatis memperoleh hak meminjam lima buku sekaligus.'] },
          klaim: { pasti: ['Anggota yang telah terdaftar {v} bulan pasti memperoleh hak meminjam lima buku sekaligus.'], tidak: ['Anggota yang telah terdaftar {v} bulan tidak berhak meminjam lima buku sekaligus.'] } },
        { id: 'batas', jenis: 'batas', aksi: 'ambil', satuan: 'hari', min: 1, maks: 10, langkah: 1, var: [
          'Buku cetak yang dipesan lewat aplikasi harus diambil di loket paling lambat {t} hari setelah pemberitahuan dikirim.'],
          klaim: {
            memenuhi: ['Buku pesanan yang diambil di loket {v} hari setelah pemberitahuan dikirim masih memenuhi batas waktu.'],
            melewati: ['Buku pesanan yang diambil di loket {v} hari setelah pemberitahuan dikirim sudah melewati batas waktu.'] },
          lain: { aksi: 'kembaliCetak', klaim: ['Pembaca harus menyelesaikan pengembalian buku cetak paling lambat {t} hari setelah buku diambil.'] } },
        { id: 'penutup', jenis: 'latar', var: [
          'Ke depan, perpustakaan digital diharapkan menjadi pelengkap, bukan pengganti, perpustakaan yang dapat dikunjungi langsung.',
          'Pengelola berharap layanan ini membuat buku makin dekat dengan pembacanya.'] }
      ]
    },
    {
      id: 'audit-energi', judul: 'Audit Energi Gedung',
      istilah: {
        audit: 'audit energi', awal: 'audit awal', rinci: 'audit rinci',
        tagihan: 'penelaahan tagihan listrik', keliling: 'pengamatan keliling gedung', wawancara: 'wawancara dengan teknisi gedung',
        ukurPanel: 'pengukuran beban tiap panel listrik', termal: 'pemotretan termal dinding dan atap', genset: 'pengecekan kapasitas genset',
        laporan: 'laporan audit', puncak: { n: 'beban puncak harian', p: 'waktu pemakaian listrik tertinggi dalam sehari' },
        lampu: { n: 'lampu yang terus menyala di ruang kosong', p: 'penerangan yang tidak dimatikan saat ruangan tidak dipakai' },
        bocor: { n: 'kebocoran udara dingin', p: 'udara sejuk yang keluar lewat celah pintu dan jendela' }, alatTua: 'peralatan tua yang boros listrik',
        hemat: 'perkiraan penghematan setiap perbaikan',
        kaca: 'pelapis kaca jendela', panas: 'panas yang masuk ke ruangan', beban: 'beban pendingin ruangan',
        meter: 'meter listrik di setiap lantai', penghuni: 'penghuni gedung',
        catatan: 'catatan meter yang tidak lengkap', alatUkur: 'keterbatasan alat ukur', jadwal: 'jadwal kegiatan gedung yang sering berubah',
        biayaRinci: 'biaya audit rinci yang cukup besar', gambar: 'gambar instalasi listrik yang sudah usang',
        pajak: 'potongan pajak bangunan', rencana: 'rencana perbaikan', ulang: 'audit ulang',
        empatGedung: 'empat gedung perkantoran', tagihanBulanan: 'tagihan listrik bulanan',
        ac: 'pendingin ruangan', terang: 'penerangan', kantor: 'peralatan kantor'
      },
      alur: [
        { id: 'def', jenis: 'latar', wajib: true, var: [
          'Audit energi adalah pemeriksaan menyeluruh atas cara sebuah gedung memakai listrik dan bahan bakar.',
          'Sebelum mengganti peralatan, banyak pengelola gedung kini memulai dengan audit energi, yaitu pemeriksaan atas cara gedung memakai listrik.'] },
        { id: 'konteks', jenis: 'latar', var: [
          'Hasilnya membantu pengelola memutuskan perbaikan mana yang paling perlu didahulukan.',
          'Tanpa audit, keputusan penghematan sering hanya didasarkan pada dugaan.'] },
        { id: 'gol', jenis: 'golongan', induk: 'audit', anggota: ['awal', 'rinci'], kata: 'tingkat', var: [
          'Audit energi dibedakan menjadi dua tingkat, yaitu audit awal dan audit rinci.'] },
        { id: 'cakupan', jenis: 'cakupan', ikut: 'gol', x: 'awal', masuk: ['tagihan', 'keliling', 'wawancara'], nMasuk: [2, 3], keluar: ['ukurPanel', 'termal'], nKeluar: [1, 2], luar: ['genset'], var: [
          { t: 'Audit awal mencakup {masuk}, sedangkan {keluar} termasuk audit rinci.', pm: 'mencakup', pk: 'termasuk', keluarKe: 'rinci' },
          { t: 'Yang tergolong audit awal antara lain {masuk}, tetapi tidak termasuk {keluar}.', pm: 'tergolong', pk: 'tidak termasuk' }] },
        { id: 'isi', jenis: 'daftar', subjek: 'laporan', himp: 'isi', pool: ['puncak', 'lampu', 'bocor', 'alatTua', 'hemat'], n: [3, 4],
          var: { terbuka: ['Laporan audit biasanya memuat beberapa hal, seperti {daftar}.'],
            tertutup: ['Untuk gedung kecil, laporan audit hanya memuat {daftar}.'] },
          klaim: {
            terbuka: { ya: ['Laporan audit energi dapat memuat {x}.'], tidak: ['Laporan audit energi tidak memuat {x}.'] },
            tertutup: { ya: ['Laporan audit untuk gedung kecil memuat {x}.'], tidak: ['Laporan audit untuk gedung kecil tidak memuat {x}.'] } } },
        { id: 'banding', jenis: 'banding', urut: ['ac', 'terang', 'kantor'], adj: 'banyak',
          pra: ['Pemakaian listrik di gedung perkantoran tidak terbagi rata.'],
          var: {
            rantai: ['Di gedung perkantoran, pendingin ruangan menyerap listrik lebih banyak daripada penerangan, sedangkan penerangan menyerap listrik lebih banyak daripada peralatan kantor.',
              ['Di gedung perkantoran, pendingin ruangan menyerap listrik lebih banyak daripada penerangan.', 'Penerangan sendiri menyerap listrik lebih banyak daripada peralatan kantor.']],
            cabang: ['Di gedung perkantoran, pendingin ruangan menyerap listrik lebih banyak daripada penerangan maupun peralatan kantor.'] },
          klaim: ['{X} menyerap listrik lebih banyak daripada {Y}.'] },
        { id: 'sebab', jenis: 'sebab', ket: ['pelapis kaca jendela mengurangi panas yang masuk ke ruangan', 'panas yang masuk ke ruangan menambah beban pendingin ruangan'], akhir: 'pelapis kaca jendela pada akhirnya ikut mengurangi beban pendingin ruangan', mata: [
          { dari: 'kaca', ke: 'panas', arah: 'turun', var: [{ t: 'Pelapis kaca jendela mengurangi panas yang masuk ke ruangan.', p: 'mengurangi panas yang masuk ke ruangan' }] },
          { dari: 'panas', ke: 'beban', arah: 'naik', var: [{ t: 'Panas yang masuk ke ruangan pada gilirannya menambah beban pendingin ruangan.', p: 'menambah beban pendingin ruangan' }] }],
          gabung: [{ t: 'Pelapis kaca jendela mengurangi panas yang masuk ke ruangan, dan panas yang masuk ke ruangan pada gilirannya menambah beban pendingin ruangan.', p: ['mengurangi panas yang masuk ke ruangan', 'menambah beban pendingin ruangan'] }],
          klaim: {
            m0: { sama: [{ t: 'Panas yang masuk ke ruangan berkurang berkat pelapis kaca jendela.', p: 'panas yang masuk ke ruangan berkurang' }], balik: [{ t: 'Pelapis kaca jendela menambah panas yang masuk ke ruangan.', p: 'menambah panas yang masuk ke ruangan' }] },
            m1: { sama: [{ t: 'Panas yang masuk ke ruangan ikut memperbesar beban pendingin ruangan.', p: 'memperbesar beban pendingin ruangan' }], balik: [{ t: 'Panas yang masuk ke ruangan mengurangi beban pendingin ruangan.', p: 'mengurangi beban pendingin ruangan' }] },
            rantai: { sama: [{ t: 'Pelapis kaca jendela turut mengurangi beban pendingin ruangan.', p: 'mengurangi beban pendingin ruangan' }], balik: [{ t: 'Pelapis kaca jendela menambah beban pendingin ruangan.', p: 'menambah beban pendingin ruangan' }] },
            terbalik: [{ t: 'Beban pendingin ruangan yang besar mendorong pengelola memasang pelapis kaca jendela.', p: 'mendorong pengelola memasang pelapis kaca jendela', dari: 'beban', ke: 'kaca', arah: 'naik' }] } },
        { id: 'temuan', jenis: 'temuan', hal: 'tagihanBulanan', lingkup: 'empatGedung', arah: 'turun',
          var: [{ t: 'Pemantauan di empat gedung perkantoran menunjukkan bahwa penjadwalan ulang jam operasi pendingin menurunkan tagihan listrik bulanan.', p: 'menurunkan tagihan listrik bulanan' }],
          pancing: ['Pengelola kawasan kemudian berencana menerapkan jadwal serupa di gedung-gedung lain.'],
          klaim: {
            sama: [{ t: 'Di empat gedung perkantoran yang dipantau, penjadwalan ulang jam operasi pendingin mengurangi tagihan listrik bulanan.', p: 'mengurangi tagihan listrik bulanan' }],
            arah: [{ t: 'Di empat gedung perkantoran yang dipantau, penjadwalan ulang jam operasi pendingin menaikkan tagihan listrik bulanan.', p: 'menaikkan tagihan listrik bulanan' }],
            umum: [{ t: 'Penjadwalan ulang jam operasi pendingin menurunkan tagihan listrik bulanan di semua gedung.', p: 'menurunkan tagihan listrik bulanan' }] } },
        { id: 'status', jenis: 'status', hal: 'meter', var: {
          teori: ['Secara teori, meter listrik di setiap lantai memungkinkan lonjakan pemakaian ditemukan dalam hitungan jam.'],
          belum: ['Secara teori, meter listrik di setiap lantai memungkinkan lonjakan pemakaian ditemukan dalam hitungan jam, tetapi kemampuan itu belum terbukti di gedung yang sudah memasangnya.'],
          terbukti: ['Berbagai pengukuran membuktikan bahwa meter listrik di setiap lantai memungkinkan lonjakan pemakaian ditemukan dalam hitungan jam.'] },
          klaim: {
            terbukti: ['Meter listrik di setiap lantai telah terbukti membuat lonjakan pemakaian ditemukan dalam hitungan jam.'],
            mungkin: ['Pada prinsipnya, meter listrik di setiap lantai memungkinkan lonjakan pemakaian ditemukan lebih awal.'],
            belum: ['Manfaat meter listrik di setiap lantai untuk menemukan lonjakan pemakaian belum terbukti.'] } },
        { id: 'kuantor', jenis: 'kuantor', kelompok: 'penghuni', var: {
          'tidak-semua': ['Namun, tidak semua penghuni gedung mengatur suhu pendingin ruangan sesuai anjuran.'],
          sebagian: ['Sebagian penghuni gedung bahkan membawa pemanas air sendiri ke ruang kerja.'] },
          klaim: {
            'tidak-semua': { semua: ['Semua penghuni gedung mengatur suhu pendingin ruangan sesuai anjuran.'], 'ada-tidak': ['Ada penghuni gedung yang tidak mengatur suhu pendingin ruangan sesuai anjuran.'] },
            sebagian: { 'tidak-ada': ['Tidak ada penghuni gedung yang membawa pemanas air sendiri ke ruang kerja.'], 'sebagian-besar': ['Sebagian besar penghuni gedung membawa pemanas air sendiri ke ruang kerja.'], ada: ['Ada penghuni gedung yang membawa pemanas air sendiri ke ruang kerja.'] } } },
        { id: 'hambatan', jenis: 'daftar', subjek: 'audit', himp: 'hambatan', pool: ['catatan', 'alatUkur', 'jadwal', 'biayaRinci', 'gambar'], n: [2, 3],
          var: { terbuka: ['Pelaksanaannya kerap terkendala sejumlah hal, seperti {daftar}.', 'Di banyak gedung, audit energi masih menghadapi kendala, antara lain {daftar}.'] },
          klaim: { terbuka: { ya: ['{x} merupakan salah satu kendala pelaksanaan audit energi.'], tunggal: ['Satu-satunya kendala pelaksanaan audit energi adalah {x}.'] } } },
        { id: 'syarat', jenis: 'syarat', aksi: 'pajak', min: 5, maks: 30, langkah: 5, var: {
          perlu: ['Potongan pajak bangunan hanya diberikan kepada gedung yang berhasil menekan pemakaian listrik sekurang-kurangnya {t} persen dalam setahun.'],
          cukup: ['Setiap gedung yang berhasil menekan pemakaian listrik {t} persen atau lebih dalam setahun otomatis memperoleh potongan pajak bangunan.'] },
          klaim: { pasti: ['Gedung yang berhasil menekan pemakaian listrik {v} persen dalam setahun pasti memperoleh potongan pajak bangunan.'], tidak: ['Gedung yang berhasil menekan pemakaian listrik {v} persen dalam setahun tidak dapat memperoleh potongan pajak bangunan.'] } },
        { id: 'batas', jenis: 'batas', aksi: 'rencana', satuan: 'hari', min: 10, maks: 90, langkah: 10, var: [
          'Pengelola gedung diminta menyusun rencana perbaikan paling lambat {t} hari setelah laporan audit diterima.'],
          klaim: {
            memenuhi: ['Rencana perbaikan yang disusun {v} hari setelah laporan audit diterima masih memenuhi batas waktu.'],
            melewati: ['Rencana perbaikan yang disusun {v} hari setelah laporan audit diterima sudah melewati batas waktu.'] },
          lain: { aksi: 'ulang', klaim: ['Gedung harus menjalani audit ulang paling lambat {t} hari setelah rencana perbaikan disusun.'] } },
        { id: 'penutup', jenis: 'latar', var: [
          'Dengan audit yang teratur, penghematan energi tidak lagi bergantung pada perkiraan semata.',
          'Karena itu, audit energi kini dipandang sebagai langkah awal setiap upaya penghematan di gedung.'] }
      ]
    }
  ];
});
