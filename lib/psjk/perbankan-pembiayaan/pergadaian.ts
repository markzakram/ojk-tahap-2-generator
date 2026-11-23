import { familyKurasi, familyRelasi, type TabelRelasi } from '../umum';
import { alasanRelasi, baris, butir, kalimatRelasi, SUMBER as S } from './bantu';
import { bulat, desimal, familyHitung, kombinasi, rp, type TemplateHitung } from './hitung';

// Chapter Pergadaian (kebutuhan 25). Tiga family:
//   PSJK-GADAI-ISTILAH  SHL      relasi dua arah: layanan pergadaian dan istilah transaksi gadai
//   PSJK-GADAI-KASUS    VARIASI  gadai vs fidusia, barang jaminan, nilai taksiran, lelang, POJK 39/2024, syariah
//   PSJK-GADAI-HITUNG   VARIASI  total pelunasan, kelebihan lelang, plafon, taksiran emas, sewa modal per 15 hari

const POJK_GADAI = 'POJK 39/2024 sebagaimana diubah POJK 29/2025';
const PEGADAIAN = 'praktik PT Pegadaian (Persero) yang diuraikan OJK; dapat berbeda antarperusahaan';

const LAYANAN: TabelRelasi = {
  id: 'layanan-pergadaian',
  topik: 'layanan pergadaian',
  tanyaNilai: (s) => `Dalam layanan perusahaan pergadaian, ${s} adalah ...`,
  tanyaSubjek: (n) => `Layanan perusahaan pergadaian berupa ${n} disebut ...`,
  alasanSalah: alasanRelasi('adalah'),
  kalimat: kalimatRelasi('adalah'),
  konsep: 'Usaha pergadaian: pinjaman dengan jaminan barang bergerak (hukum gadai), jasa titipan, jasa taksiran, pinjaman berbasis fidusia, dan produk lain sesuai izin.',
  caraCepat: 'Barang diserahkan untuk pinjaman → gadai; hanya menilai harga → taksiran; hanya menyimpan → titipan; kendaraan diikat fidusia (BPKB diserahkan), kendaraan tetap dipakai → fidusia.',
  baris: [
    baris('gadai', 'pinjaman gadai', 'kredit jangka pendek dengan jaminan barang bergerak yang diserahkan dan dikuasai pemberi pinjaman', 'dasar', `${S.bsc}, Bab VIII (hlm. 114–115); ${S.ebGadai}, §3.1.1`),
    baris('taksiran', 'jasa taksiran', 'layanan pengujian barang bergerak untuk menilai harga barang milik nasabah tanpa harus meminjam', 'dasar', `${S.bsc}, Bab VIII (hlm. 115); ${S.ebGadai}, contoh soal 4.4`),
    baris('titipan', 'jasa titipan', 'layanan penyimpanan barang berharga untuk menghindari risiko kehilangan, pencurian, atau kebakaran', 'dasar', `${S.bsc}, Bab VIII (hlm. 115)`),
    baris('angsuran', 'gadai sistem angsuran', 'kredit usaha produktif dengan jaminan dikuasai pergadaian dan pelunasan secara cicilan bulanan', 'menengah', `${S.bsc}, Bab VIII (hlm. 116)`),
    baris('fidusia', 'pinjaman berbasis fidusia', 'kredit dengan pengikatan jaminan fidusia atas kendaraan (BPKB diserahkan), sementara kendaraannya tetap dipakai pemilik', 'menengah', `${S.bsc}, Bab VIII (hlm. 116); ${S.ebGadai}, §3.1.13`),
  ],
};

const TRANSAKSI: TabelRelasi = {
  id: 'istilah-transaksi',
  topik: 'istilah transaksi gadai',
  tanyaNilai: (s) => `Dalam transaksi gadai, ${s} adalah ...`,
  tanyaSubjek: (n) => `Dalam transaksi gadai, istilah untuk ${n} adalah ...`,
  alasanSalah: alasanRelasi('adalah'),
  kalimat: kalimatRelasi('adalah'),
  konsep: 'Istilah transaksi gadai: nilai taksiran, uang pinjaman, sewa modal, pelunasan (tebus), perpanjangan (ulang gadai, cicil, minta tambah), uang kelebihan lelang, dan Surat Bukti Gadai.',
  caraCepat: 'Perpanjangan: pinjaman tetap → ulang gadai; bayar sebagian dulu → cicil; pinjaman bertambah → minta tambah; lunas seluruhnya → tebus.',
  baris: [
    baris('nilai-taksiran', 'nilai taksiran', 'perkiraan harga barang jaminan yang menjadi dasar penentuan batas pinjaman', 'dasar', `${S.ebGadai}, §3.1.2, §3.1.14; ${S.buku7}, Bab 3 (hlm. 57–58)`),
    baris('sewa-modal', 'sewa modal', 'biaya atas penggunaan uang pinjaman gadai yang dihitung menurut jangka waktu pinjaman', 'menengah', `${S.buku7}, Bab 3 (hlm. 61–63); ${S.bsc}, Bab VIII (hlm. 119, 121)`, PEGADAIAN),
    baris('tebus', 'pelunasan (tebus)', 'pembayaran seluruh uang pinjaman ditambah sewa modal', 'menengah', `${S.buku7}, Bab 3 (hlm. 61)`, PEGADAIAN),
    baris('ulang-gadai', 'ulang gadai', 'perpanjangan jangka waktu dengan uang pinjaman tetap sebesar pinjaman lama', 'menantang', `${S.buku7}, Bab 3 (hlm. 61)`, PEGADAIAN),
    baris('cicil', 'cicil', 'perpanjangan jangka waktu yang didahului pembayaran sebagian uang pinjaman', 'menantang', `${S.buku7}, Bab 3 (hlm. 61)`, PEGADAIAN),
    baris('minta-tambah', 'minta tambah', 'perpanjangan jangka waktu sekaligus memperbesar uang pinjaman', 'menantang', `${S.buku7}, Bab 3 (hlm. 61)`, PEGADAIAN),
    baris('kelebihan', 'uang kelebihan lelang', 'selisih hasil penjualan barang jaminan setelah dikurangi uang pinjaman, sewa modal, dan biaya lain', 'menengah', `${S.buku7}, Bab 3 (hlm. 64–65); ${S.ebGadai}, §3.1.7`),
    baris('sbg', 'Surat Bukti Gadai (SBG)', 'dokumen perjanjian yang mencatat barang jaminan, uang pinjaman, biaya, dan ketentuan transaksi', 'dasar', `${S.ebGadai}, contoh soal 4.10; ${S.bsc}, Bab VIII (hlm. 119)`),
  ],
};

export const gadaiIstilah = familyRelasi({
  id: 'PSJK-GADAI-ISTILAH', nama: 'Layanan dan istilah pergadaian', chapter: 'pergadaian', label: 'SHL',
  sumber: `${S.bsc}; ${S.buku7}; ${S.ebGadai}`,
  ringkas: 'Relasi dua arah untuk layanan pergadaian (gadai, taksiran, titipan, gadai angsuran, fidusia) dan istilah transaksi (nilai taksiran, sewa modal, tebus, ulang gadai, cicil, minta tambah, uang kelebihan lelang, SBG).',
}, [LAYANAN, TRANSAKSI]);

const ALASAN_LAIN_BOLEH = 'Kegiatan ini termasuk kegiatan usaha lain yang dapat dijalankan perusahaan pergadaian, jadi bukan jawaban.';

export const gadaiKasus = familyKurasi({
  id: 'PSJK-GADAI-KASUS', versi: 2, nama: 'Kasus pergadaian', chapter: 'pergadaian', label: 'VARIASI',
  sumber: `${S.ebGadai}; ${S.bsc}; ${S.buku7}`,
  ringkas: 'Ciri gadai, gadai vs fidusia, barang yang dapat dijaminkan, nilai taksiran vs pinjaman, kelebihan hasil lelang, kegiatan utama dan regulasi (POJK 39/2024), pergadaian syariah, legalitas; termasuk "KECUALI".',
}, [
  butir('ciri-gadai', 'dasar', 'gadai dan fidusia', {
    tanya: 'Ciri kegiatan pinjaman berdasarkan hukum gadai yang paling tepat adalah ...',
    jawab: 'Barang jaminan bergerak dikuasai penerima gadai',
    salah: [
      ['Pinjaman diberikan tanpa agunan barang', 'Gadai justru memakai barang bergerak sebagai jaminan.'],
      ['Besar pinjaman sama dengan harga pasar barang', 'Nilai pinjaman ditentukan dari nilai taksiran dan ketentuan produk, tidak otomatis sama dengan harga pasar.'],
      ['Barang jaminan tidak perlu ditaksir', 'Penaksiran justru tahap penting sebelum uang pinjaman ditentukan.'],
      ['Barang jaminan tetap dipakai pemiliknya', 'Barang yang tetap dipakai pemiliknya adalah ciri fidusia; pada gadai barang diserahkan kepada penerima gadai.'],
    ],
    konsep: 'Konsep hukum gadai', kunci: 'hukum gadai, barang bergerak',
    alasan: 'Pada gadai, benda bergerak yang dijaminkan diserahkan dan berada dalam penguasaan penerima gadai sesuai hukum.',
    cepat: 'Ingat tiga unsur: pinjaman, benda bergerak, dikuasai penerima gadai.',
    sumber: `${S.ebGadai}, §3.1.1 dan contoh soal 4.1; ${S.bsc}, Bab VIII (hlm. 114)`,
  }),
  butir('penguasaan', 'menengah', 'gadai dan fidusia', {
    tanya: 'Perbedaan utama gadai dan fidusia berdasarkan penguasaan barang jaminan adalah ...',
    jawab: 'Pada gadai, barang dikuasai penerima gadai.',
    salah: [
      ['Pada gadai, barang tetap dikuasai debitur.', 'Terbalik: pada gadai, barang diserahkan kepada penerima gadai.'],
      ['Pada fidusia, barang wajib dikuasai kreditur.', 'Pada fidusia, barang umumnya tetap dikuasai pemberi fidusia.'],
      ['Gadai dan fidusia memiliki penguasaan identik.', 'Keduanya mekanisme jaminan yang berbeda, termasuk dalam penguasaan barang.'],
      ['Pada gadai, barang bebas dipakai debitur.', 'Barang gadai berada dalam penguasaan penerima gadai, bukan dipakai debitur.'],
    ],
    konsep: 'Perbedaan gadai dan fidusia', kunci: 'penguasaan barang jaminan',
    alasan: 'Dalam gadai, barang bergerak diserahkan dan dikuasai penerima gadai; dalam fidusia, benda yang dijaminkan umumnya tetap dikuasai pemberi fidusia.',
    cepat: 'Gadai = barang pindah tangan; fidusia = barang tetap di pemilik.',
    sumber: `${S.ebGadai}, §3.1.13, §3.1.19, contoh soal 4.18`,
  }),
  butir('kasus-emas', 'dasar', 'gadai dan fidusia', {
    tanya: 'Seorang pedagang menyerahkan perhiasan emasnya kepada perusahaan pergadaian untuk memperoleh dana sementara. Jenis layanan yang digunakan adalah ...',
    jawab: 'Pinjaman gadai',
    salah: [
      ['Pinjaman berbasis fidusia', 'Pada fidusia, barang jaminan umumnya tetap dikuasai pemiliknya.'],
      ['Jasa titipan', 'Jasa titipan hanya menyimpan barang, tanpa pinjaman.'],
      ['Jasa taksiran', 'Jasa taksiran hanya menilai harga barang, tanpa pinjaman.'],
      ['Pembukaan rekening giro', 'Pergadaian tidak membuka rekening giro.'],
    ],
    konsep: 'Identifikasi layanan pergadaian', kunci: 'menyerahkan emas, dana sementara',
    alasan: 'Menyerahkan barang bergerak sebagai jaminan untuk pendanaan sementara adalah ciri transaksi gadai.',
    cepat: 'Barang diserahkan + dapat pinjaman → gadai.',
    sumber: `${S.ebGadai}, §3.1.19 dan contoh soal 4.25`,
  }),
  butir('kasus-bpkb', 'menengah', 'gadai dan fidusia', {
    tanya: 'Seorang pedagang menjaminkan BPKB sepeda motornya kepada perusahaan pergadaian untuk memperoleh kredit usaha, sementara motornya tetap dipakai untuk berdagang. Layanan ini paling dekat dengan ...',
    jawab: 'Pinjaman berbasis fidusia',
    salah: [
      ['Pinjaman gadai', 'Pada gadai, barang jaminan diserahkan dan dikuasai penerima gadai.'],
      ['Jasa titipan', 'Jasa titipan hanya menyimpan barang berharga.'],
      ['Jasa taksiran', 'Jasa taksiran hanya menilai harga barang.'],
      ['Sewa pembiayaan', 'Sewa pembiayaan adalah cara pembiayaan perusahaan pembiayaan untuk penyediaan barang.'],
    ],
    konsep: 'Produk berbasis fidusia', kunci: 'BPKB, motor tetap dipakai',
    alasan: 'Pada pinjaman dengan pengikatan fidusia atas kendaraan, BPKB diserahkan sebagai jaminan, sedangkan kendaraannya tetap dikuasai dan dipakai debitur; pengikatan jaminannya mengikuti ketentuan fidusia (UU 42/1999).',
    cepat: 'Surat kepemilikan dijaminkan, barang tetap dipakai → fidusia.',
    sumber: `${S.bsc}, Bab VIII (hlm. 116); ${S.ebGadai}, §3.1.19`,
  }),
  butir('barang-dapat', 'menengah', 'barang jaminan', {
    tanya: 'Beberapa barang tidak dapat dijadikan jaminan di pergadaian. Di antara barang berikut, yang justru dapat diterima sebagai jaminan adalah ...',
    jawab: 'Perhiasan emas milik pribadi',
    salah: [
      ['Kendaraan dinas milik pemerintah', 'Barang milik pemerintah tidak dapat dijadikan jaminan.'],
      ['Buah-buahan yang mudah busuk', 'Barang yang mudah busuk tidak dapat dijadikan jaminan.'],
      ['Tabung gas dan barang mudah terbakar', 'Barang berbahaya dan mudah terbakar tidak dapat dijadikan jaminan.'],
      ['Lukisan antik yang sukar ditaksir', 'Barang yang sukar ditaksir nilainya tidak dapat dijadikan jaminan.'],
      ['Narkoba dan barang terlarang', 'Barang yang dilarang peredarannya tidak dapat dijadikan jaminan.'],
    ],
    konsep: 'Barang yang dapat dan tidak dapat dijaminkan', kunci: 'dapat diterima sebagai jaminan',
    alasan: 'Benda bergerak yang dapat dijadikan jaminan antara lain perhiasan emas dan berlian, kendaraan, barang elektronik, dan mesin; barang milik pemerintah, mudah busuk, berbahaya, sukar ditaksir, dan terlarang tidak diterima.',
    cepat: 'Cari barang yang bernilai jelas, tahan lama, dan legal.',
    sumber: `${S.bsc}, Bab VIII (hlm. 117)`,
  }),
  butir('taksir-bukan-pinjaman', 'menengah', 'penaksiran', {
    tanya: 'Seorang nasabah menggadaikan emas dengan nilai taksiran Rp6.000.000. Pernyataan yang paling tepat mengenai jumlah pinjaman yang dapat diperolehnya adalah ...',
    jawab: 'Pinjaman ditentukan menurut ketentuan produk.',
    salah: [
      ['Pinjaman sebesar nilai taksiran emas.', 'Nilai taksiran adalah dasar penilaian, bukan janji dana cair dengan nominal sama.'],
      ['Pinjaman dihitung dari harga beli emas.', 'Dasar perhitungannya nilai taksiran dan ketentuan produk, bukan harga beli.'],
      ['Pinjaman mengikuti harga jual emas di toko.', 'Harga jual di toko bukan dasar; pinjaman mengikuti nilai taksiran dan ketentuan produk.'],
      ['Pinjaman lebih besar daripada nilai taksiran.', 'Uang pinjaman berupa persentase tertentu dari nilai taksiran.'],
    ],
    konsep: 'Nilai taksiran vs uang pinjaman', kunci: 'nilai taksiran Rp6.000.000',
    alasan: 'Nilai taksiran menjadi dasar menetapkan batas pinjaman; besar pinjaman ditentukan oleh persentase dan ketentuan produk perusahaan pergadaian.',
    cepat: 'Nilai taksir ≠ otomatis jumlah pinjaman.',
    sumber: `${S.ebGadai}, §3.1.2, §3.1.14, contoh soal 4.2; ${S.buku7}, Bab 3 (hlm. 58)`,
  }),
  butir('kelebihan-hak', 'menengah', 'lelang', {
    tanya: 'Barang jaminan seorang nasabah dijual melalui prosedur yang berlaku dengan hasil Rp8.000.000, sedangkan total kewajiban sah nasabah termasuk biayanya Rp6.500.000. Perlakuan yang tepat atas selisihnya adalah ...',
    jawab: 'Dikembalikan sebagai hak nasabah',
    salah: [
      ['Dicatat sebagai pendapatan perusahaan', 'Kelebihan hasil penjualan bukan pendapatan perusahaan pergadaian.'],
      ['Dialokasikan untuk biaya operasional', 'Biaya yang sah sudah diperhitungkan dalam total kewajiban.'],
      ['Disimpan sebagai cadangan perusahaan', 'Selisih itu milik nasabah, bukan cadangan perusahaan.'],
      ['Dipakai menaikkan nilai agunan lain', 'Tidak ada dasar untuk memakai kelebihan itu bagi agunan lain.'],
    ],
    konsep: 'Uang kelebihan hasil lelang', kunci: 'hasil penjualan lebih besar dari kewajiban',
    alasan: 'Selisih Rp8.000.000 − Rp6.500.000 = Rp1.500.000 merupakan hak nasabah dan diproses menurut mekanisme serta ketentuan yang berlaku.',
    cepat: 'Hasil jual − kewajiban sah > 0 → hak nasabah.',
    sumber: `${S.ebGadai}, §3.1.5, §3.1.16, contoh soal 4.7; ${S.buku7}, Bab 3 (hlm. 64)`,
  }),
  butir('pojk-39', 'dasar', 'regulasi', {
    tanya: 'Peraturan OJK yang menjadi kerangka utama sektor pergadaian dan menggantikan POJK 31/2016 adalah ...',
    jawab: 'POJK 39 Tahun 2024',
    salah: [
      ['POJK 41 Tahun 2024', 'POJK 41/2024 mengatur lembaga keuangan mikro.'],
      ['POJK 40 Tahun 2024', 'POJK 40/2024 mengatur LPBBTI (pinjaman daring).'],
      ['POJK 25 Tahun 2023', 'POJK 25/2023 mengatur penyelenggaraan usaha perusahaan modal ventura.'],
      ['POJK 22 Tahun 2023', 'POJK 22/2023 mengatur pelindungan konsumen dan masyarakat di sektor jasa keuangan.'],
    ],
    konsep: 'Regulasi pergadaian', kunci: 'menggantikan POJK 31/2016',
    alasan: 'POJK 39 Tahun 2024 mengatur sektor pergadaian dan menggantikan POJK 31/2016; perubahannya dilakukan melalui POJK 29 Tahun 2025 yang berlaku 26 November 2025.',
    cepat: 'Pergadaian → POJK 39/2024 (diubah POJK 29/2025).',
    sumber: `${S.ebGadai}, §3.1.6 dan contoh soal 4.8`, berlaku: POJK_GADAI,
  }),
  butir('kegiatan-utama', 'dasar', 'regulasi', {
    tanya: 'Menurut POJK 39 Tahun 2024, kegiatan usaha utama perusahaan pergadaian adalah ...',
    jawab: 'Menyalurkan pinjaman berdasarkan hukum gadai',
    salah: [
      ['Memberikan layanan penitipan barang berharga', 'Jasa titipan termasuk kegiatan usaha lain, bukan kegiatan utama.'],
      ['Menyalurkan pinjaman dengan jaminan fidusia', 'Pinjaman fidusia termasuk kegiatan usaha lain.'],
      ['Menyediakan layanan penaksiran barang', 'Jasa taksiran termasuk kegiatan usaha lain.'],
      ['Menyelenggarakan layanan berbasis komisi', 'Kegiatan berbasis komisi termasuk kegiatan usaha lain.'],
    ],
    konsep: 'Kegiatan utama dan kegiatan lain perusahaan pergadaian', kunci: 'kegiatan usaha utama',
    alasan: 'Kegiatan usaha utama perusahaan pergadaian adalah pemberian pinjaman dengan benda jaminan berdasarkan hukum gadai; fidusia, titipan, taksiran, dan kegiatan berbasis komisi termasuk kegiatan usaha lainnya.',
    cepat: 'Utama = hukum gadai; selebihnya kegiatan lain.',
    sumber: `${S.ebGadai}, §3.1.3, §3.1.6, contoh soal 4.12`, berlaku: POJK_GADAI,
  }),
  butir('kegiatan-lain-kecuali', 'menantang', 'regulasi', {
    tanya: 'Selain kegiatan utama, perusahaan pergadaian dapat menjalankan kegiatan berikut sesuai izin, KECUALI ...',
    jawab: 'Menerima simpanan giro dan tabungan masyarakat',
    salah: [
      ['Pinjaman berdasarkan jaminan fidusia', ALASAN_LAIN_BOLEH],
      ['Jasa titipan barang berharga', ALASAN_LAIN_BOLEH],
      ['Jasa taksiran barang', ALASAN_LAIN_BOLEH],
      ['Kegiatan berbasis komisi (fee based)', ALASAN_LAIN_BOLEH],
    ],
    konsep: 'Batas kegiatan perusahaan pergadaian', kunci: 'KECUALI, giro dan tabungan',
    alasan: 'Perusahaan pergadaian dapat menjalankan pinjaman fidusia, jasa titipan, jasa taksiran, dan kegiatan berbasis komisi; perusahaan pergadaian tidak otomatis berhak membuka rekening giro atau tabungan.',
    cepat: 'Simpanan giro/tabungan → ranah bank.',
    sumber: `${S.ebGadai}, §3.1.3 dan §3.1.9`, berlaku: POJK_GADAI,
  }),
  butir('tahapan', 'dasar', 'alur transaksi', {
    tanya: 'Urutan layanan gadai yang paling sesuai adalah ...',
    jawab: 'Penaksiran, penentuan pinjaman, kesepakatan, pencairan',
    salah: [
      ['Pencairan, penaksiran, kesepakatan, penentuan pinjaman', 'Dana tidak dapat dicairkan sebelum barang ditaksir dan perjanjian disepakati.'],
      ['Pelelangan, penaksiran, penentuan pinjaman, pencairan', 'Pelelangan baru terjadi bila pinjaman tidak dilunasi.'],
      ['Perpanjangan, pencairan, penaksiran, kesepakatan', 'Perpanjangan dilakukan setelah ada pinjaman berjalan.'],
      ['Kesepakatan, pencairan, penentuan pinjaman, penaksiran', 'Besar pinjaman harus ditentukan dari taksiran sebelum kesepakatan dan pencairan.'],
    ],
    konsep: 'Alur transaksi gadai', kunci: 'urutan layanan',
    alasan: 'Barang dinilai lebih dahulu, uang pinjaman ditentukan, perjanjian (surat bukti gadai) disepakati, lalu dana dicairkan setelah barang disimpan.',
    cepat: 'Nilai barang dulu, dana kemudian.',
    sumber: `${S.ebGadai}, §3.1.2 dan contoh soal 4.3; ${S.bsc}, Bab VIII (hlm. 120)`,
  }),
  butir('rahn-ujrah', 'menengah', 'pergadaian syariah', {
    tanya: 'Dalam pergadaian syariah, akad untuk jaminan dan istilah untuk imbal jasa yang memenuhi syarat secara berturut-turut adalah ...',
    jawab: 'Rahn dan ujrah',
    salah: [
      ['Mudharabah dan nisbah', 'Mudharabah adalah kerja sama bagi hasil, bukan akad jaminan.'],
      ['Murabahah dan margin', 'Murabahah adalah akad jual beli.'],
      ['Wadiah dan bonus', 'Wadiah adalah akad titipan.'],
      ['Kafalah dan imbal jasa kafalah', 'Kafalah adalah akad penjaminan atas kewajiban pihak lain, bukan jaminan barang gadai.'],
    ],
    konsep: 'Akad pergadaian syariah', kunci: 'jaminan, imbal jasa',
    alasan: 'Pada skema syariah, hubungan hukum memakai akad yang sesuai, misalnya rahn untuk jaminan dan ujrah untuk jasa; label syariah tetap menuntut transparansi biaya.',
    cepat: 'Gadai syariah = rahn; biayanya = ujrah.',
    sumber: `${S.ebGadai}, §3.1.17 dan contoh soal 4.22`,
  }),
  butir('pergadaian-syariah', 'dasar', 'pergadaian syariah', {
    tanya: 'Perusahaan pergadaian yang menjalankan seluruh kegiatan usahanya berdasarkan prinsip syariah disebut ...',
    jawab: 'Perusahaan pergadaian syariah',
    salah: [
      ['Perusahaan pergadaian konvensional', 'Perusahaan pergadaian konvensional menjalankan kegiatan usaha secara konvensional.'],
      ['Unit usaha syariah perusahaan pergadaian', 'UUS hanya menjalankan sebagian kegiatan berdasarkan prinsip syariah di dalam perusahaan konvensional.'],
      ['Bank Wakaf Mikro', 'Bank Wakaf Mikro adalah sebutan LKM Syariah dalam program wakaf mikro.'],
      ['BPR Syariah', 'BPR Syariah adalah bank syariah, bukan perusahaan pergadaian.'],
    ],
    konsep: 'Jenis perusahaan pergadaian menurut ruang lingkup usaha', kunci: 'seluruh kegiatan berdasarkan prinsip syariah',
    alasan: 'OJK membagi perusahaan pergadaian menjadi konvensional dan syariah; perusahaan pergadaian syariah menjalankan seluruh kegiatan usaha berdasarkan prinsip syariah.',
    cepat: 'Seluruhnya syariah → perusahaan pergadaian syariah; sebagian → UUS.',
    sumber: `${S.bsc}, Bab VIII (hlm. 113)`,
  }),
  butir('swasta', 'dasar', 'kelembagaan', {
    tanya: 'Pernyataan yang tepat mengenai penyelenggara usaha pergadaian di Indonesia adalah ...',
    jawab: 'Ada perusahaan pergadaian pemerintah dan swasta berizin OJK.',
    salah: [
      ['Usaha pergadaian merupakan monopoli PT Pegadaian (Persero).', 'Selain PT Pegadaian (Persero) sebagai perusahaan pemerintah, ada perusahaan pergadaian swasta.'],
      ['Perusahaan pergadaian swasta diawasi BI.', 'Pergadaian diatur dan diawasi OJK.'],
      ['Pergadaian swasta cukup terdaftar di pemerintah daerah.', 'Perusahaan pergadaian wajib memiliki izin usaha sesuai regulasi OJK.'],
      ['Perusahaan pergadaian wajib berbentuk syariah.', 'Perusahaan pergadaian dapat konvensional maupun syariah.'],
    ],
    konsep: 'Kepemilikan dan perizinan perusahaan pergadaian', kunci: 'pemerintah dan swasta',
    alasan: 'Berdasarkan kepemilikan, perusahaan pergadaian terdiri atas perusahaan pergadaian pemerintah (PT Pegadaian (Persero)) dan perusahaan pergadaian swasta, yang diatur dan diawasi OJK sesuai izin.',
    cepat: 'Pergadaian ≠ hanya satu BUMN.',
    sumber: `${S.bsc}, Bab VIII (hlm. 112–113); ${S.ebGadai}, §3.1.1`,
  }),
  butir('penaksir', 'menengah', 'regulasi', {
    tanya: 'Berdasarkan POJK 39 Tahun 2024, kewajiban perusahaan pergadaian terkait penaksir adalah memiliki ...',
    jawab: 'Paling sedikit satu penaksir di setiap kantor cabang',
    salah: [
      ['Satu penaksir di kantor pusat perusahaan', 'Kewajibannya per kantor cabang, bukan satu penaksir di kantor pusat.'],
      ['Penaksir yang ditunjuk oleh LPS', 'LPS tidak menunjuk penaksir perusahaan pergadaian.'],
      ['Penaksir yang didatangkan saat nasabah memintanya', 'Penaksir adalah kewajiban kelembagaan, bukan layanan atas permintaan.'],
      ['Penaksir dari kantor Bank Indonesia', 'BI tidak menyediakan penaksir bagi perusahaan pergadaian.'],
    ],
    konsep: 'Peran penaksir dalam pergadaian', kunci: 'penaksir, kantor cabang',
    alasan: 'Penaksir berperan penting dalam menetapkan nilai taksiran; POJK 39/2024 mewajibkan paling sedikit satu penaksir pada setiap kantor cabang.',
    cepat: 'Penaksir: minimal satu per kantor cabang.',
    sumber: `${S.ebGadai}, §3.1.2`, berlaku: POJK_GADAI,
  }),
  butir('kuhper', 'menantang', 'gadai dan fidusia', {
    tanya: 'Hak yang diperoleh pihak berpiutang atas barang bergerak yang diserahkan kepadanya oleh pihak berutang, yang memberinya kekuasaan mengambil pelunasan dari barang itu secara didahulukan daripada kreditur lain, menurut Pasal 1150 KUH Perdata disebut ...',
    jawab: 'Gadai',
    salah: [
      ['Fidusia', 'Pada fidusia, barang umumnya tetap dikuasai pemberi fidusia, tidak diserahkan kepada kreditur.'],
      ['Anjak piutang', 'Anjak piutang adalah pembelian piutang usaha.'],
      ['Kafalah', 'Kafalah adalah akad penjaminan syariah atas kewajiban pihak lain.'],
      ['Subrogasi', 'Subrogasi adalah peralihan hak tagih setelah klaim penjaminan dibayar.'],
    ],
    konsep: 'Definisi gadai menurut KUH Perdata', kunci: 'barang bergerak diserahkan, pelunasan didahulukan',
    alasan: 'Pasal 1150 KUH Perdata mendefinisikan gadai sebagai hak berpiutang atas barang bergerak yang diserahkan kepadanya, dengan kekuasaan mengambil pelunasan secara didahulukan.',
    cepat: 'Barang bergerak diserahkan + hak didahulukan → gadai.',
    sumber: `${S.bsc}, Bab VIII (hlm. 111); ${S.buku7}, Bab 2`,
  }),
  butir('jatuh-tempo', 'menengah', 'perpanjangan dan lelang', {
    tanya: 'Seorang nasabah pergadaian kesulitan melunasi pinjamannya menjelang jatuh tempo dan ingin mengetahui kemungkinan perpanjangan. Tindakan yang paling tepat adalah ...',
    jawab: 'Mengonfirmasi pilihan penyelesaian kepada perusahaan',
    salah: [
      ['Menunggu perpanjangan diberikan tanpa mengajukannya', 'Perpanjangan tidak dapat diasumsikan tersedia atau disetujui tanpa pengajuan.'],
      ['Menunggu hingga barang dilelang lebih dulu', 'Menunggu lelang menambah biaya dan risiko kehilangan barang.'],
      ['Mengajukan penaksiran ulang barang jaminan', 'Penaksiran ulang tidak menyelesaikan kewajiban yang jatuh tempo.'],
      ['Mengganti barang jaminan tanpa sepengetahuan perusahaan', 'Perubahan jaminan harus sesuai perjanjian dan persetujuan perusahaan.'],
    ],
    konsep: 'Perpanjangan dan penyelesaian pinjaman gadai', kunci: 'menjelang jatuh tempo',
    alasan: 'Nasabah sebaiknya menghubungi perusahaan melalui kanal resmi untuk mengetahui pilihan sesuai perjanjian, seperti perpanjangan, pelunasan, atau mekanisme lain yang diperbolehkan.',
    cepat: 'Menjelang jatuh tempo → konfirmasi opsi resmi, jangan berasumsi.',
    sumber: `${S.ebGadai}, §3.1.16 dan contoh soal 4.23`,
  }),
  butir('risiko-lelang', 'dasar', 'perpanjangan dan lelang', {
    tanya: 'Nasabah tidak melunasi pinjaman gadai hingga jatuh tempo dan juga tidak memperpanjangnya. Risiko utama yang dihadapinya adalah ...',
    jawab: 'Barang jaminan dapat dilelang',
    salah: [
      ['Simpanan nasabah dibekukan LPS', 'LPS menjamin simpanan bank; tidak berkaitan dengan gadai.'],
      ['Nasabah memperoleh pinjaman baru atas barang yang sama', 'Tanpa pelunasan atau perpanjangan, tidak ada pinjaman baru; barang justru dapat dilelang.'],
      ['Barang dikembalikan tanpa pelunasan', 'Barang hanya dikembalikan setelah kewajiban dilunasi.'],
      ['Hasil lelang menjadi pendapatan perusahaan', 'Kelebihan hasil lelang setelah kewajiban sah merupakan hak nasabah.'],
    ],
    konsep: 'Risiko produk pergadaian', kunci: 'tidak dilunasi hingga jatuh tempo',
    alasan: 'Apabila nasabah tidak melunasi hingga jatuh tempo, barang jaminan akan dilelang; nasabah juga dikenai biaya proses lelang sesuai aturan.',
    cepat: 'Tidak tebus dan tidak perpanjang → lelang.',
    sumber: `${S.bsc}, Bab VIII (hlm. 113, 119)`,
  }),
]);

// ---------------------------------------------------------------- hitung

const tPelunasan: TemplateHitung = {
  id: 'total-pelunasan', tingkat: 'dasar', topik: 'pelunasan gadai',
  sumber: `${S.ebGadai}, §3.1.4, §3.1.15, contoh soal 4.5 dan 4.17`,
  parameter: kombinasi({ pokok: [2e6, 3e6, 4e6, 5e6, 8e6], sewa: [80e3, 120e3, 160e3, 200e3], admin: [20e3, 30e3, 40e3] }),
  pertanyaan: (p) => `Pinjaman gadai ${rp(p.pokok)} dikenai biaya penggunaan dana (sewa modal) ${rp(p.sewa)} dan biaya administrasi ${rp(p.admin)} yang belum dibayar, tanpa biaya lain. Total pelunasannya adalah ...`,
  hitung: (p) => p.pokok + p.sewa + p.admin,
  pengecoh: (p) => [
    { nilai: p.pokok, alasan: 'Itu pokok saja; biaya belum dimasukkan.' },
    { nilai: p.pokok + p.sewa, alasan: 'Biaya administrasi belum dimasukkan.' },
    { nilai: p.pokok + p.admin, alasan: 'Sewa modal belum dimasukkan.' },
    { nilai: p.pokok - p.sewa - p.admin, alasan: 'Biaya justru dikurangkan dari pokok.' },
    { nilai: p.sewa + p.admin, alasan: 'Itu total biaya saja; pokok belum dimasukkan.' },
  ],
  konsep: 'Kewajiban pelunasan = pokok + biaya yang sah sesuai kontrak', kataKunci: 'pokok, sewa modal, administrasi',
  alasan: (p) => [`Total = ${rp(p.pokok)} + ${rp(p.sewa)} + ${rp(p.admin)} = ${rp(p.pokok + p.sewa + p.admin)}.`, 'Angka dalam soal ilustratif, bukan tarif resmi OJK atau perusahaan.'],
  caraCepat: 'Pokok + seluruh biaya yang dinyatakan.',
};

const tKelebihan: TemplateHitung = {
  id: 'kelebihan-lelang', tingkat: 'menengah', topik: 'lelang',
  sumber: `${S.buku7}, Bab 3 (hlm. 64); ${S.ebGadai}, §3.1.7 dan §3.1.16`,
  parameter: kombinasi({ pokok: [4e6, 5e6, 6e6], sewa: [100e3, 150e3, 200e3], biaya: [50e3, 100e3], sisa: [300e3, 450e3, 500e3, 650e3, 800e3, 1.2e6] }).map((p) => ({ pokok: p.pokok, sewa: p.sewa, biaya: p.biaya, hasil: p.pokok + p.sewa + p.biaya + p.sisa })),
  pertanyaan: (p) => `Barang jaminan seorang nasabah terjual melalui lelang seharga ${rp(p.hasil)}. Uang pinjaman ${rp(p.pokok)}, sewa modal ${rp(p.sewa)}, dan biaya lain yang sah ${rp(p.biaya)}. Uang kelebihan lelang yang menjadi hak nasabah adalah ...`,
  hitung: (p) => p.hasil - p.pokok - p.sewa - p.biaya,
  pengecoh: (p) => [
    { nilai: p.hasil - p.pokok, alasan: 'Sewa modal dan biaya lain belum dikurangkan.' },
    { nilai: p.hasil - p.pokok - p.sewa, alasan: 'Biaya lain yang sah belum dikurangkan.' },
    { nilai: p.hasil - p.pokok - p.biaya, alasan: 'Sewa modal belum dikurangkan.' },
    { nilai: p.pokok + p.sewa + p.biaya, alasan: 'Itu total kewajiban nasabah, bukan kelebihannya.' },
    { nilai: p.hasil, alasan: 'Itu seluruh hasil lelang; kewajiban belum dikurangkan.' },
  ],
  konsep: 'Uang kelebihan lelang = hasil lelang − (uang pinjaman + sewa modal + biaya lain)', kataKunci: 'hasil lelang, kewajiban sah',
  alasan: (p) => [`Kelebihan = ${rp(p.hasil)} − ${rp(p.pokok)} − ${rp(p.sewa)} − ${rp(p.biaya)} = ${rp(p.hasil - p.pokok - p.sewa - p.biaya)}.`, 'Selisih positif merupakan hak nasabah.'],
  caraCepat: 'Hasil lelang dikurangi semua kewajiban sah.',
};

const tPlafon: TemplateHitung = {
  id: 'plafon-taksiran', tingkat: 'dasar', topik: 'penaksiran',
  sumber: `${S.ebGadai}, §3.1.14 dan contoh soal 4.16`,
  parameter: kombinasi({ taksiran: [6e6, 8e6, 10e6, 12e6, 15e6], persen: [80, 85, 90, 92] }, (p) => bulat((p.taksiran * p.persen) / 100)),
  pertanyaan: (p) => `Nilai taksiran sebuah barang ${rp(p.taksiran)} dan produk gadai yang dipilih memberikan pinjaman maksimum ${p.persen}% dari nilai taksiran (angka ilustratif). Batas pinjaman maksimumnya adalah ...`,
  hitung: (p) => (p.taksiran * p.persen) / 100,
  pengecoh: (p) => [
    { nilai: p.taksiran, alasan: 'Nilai taksiran dianggap sama dengan pinjaman, padahal pinjaman hanya persentase tertentu darinya.' },
    { nilai: (p.taksiran * (100 - p.persen)) / 100, alasan: 'Yang dihitung justru sisa persentasenya.' },
    { nilai: (p.taksiran * p.persen) / 1000, alasan: 'Salah menempatkan desimal persentase.' },
    { nilai: p.taksiran + (p.taksiran * p.persen) / 100, alasan: 'Persentase ditambahkan ke nilai taksiran.' },
  ],
  konsep: 'Batas pinjaman = persentase × nilai taksiran', kataKunci: 'nilai taksiran, pinjaman maksimum',
  alasan: (p) => [`Batas pinjaman = ${p.persen}% × ${rp(p.taksiran)} = ${rp((p.taksiran * p.persen) / 100)}.`, 'Persentase bersifat asumsi soal, bukan tarif universal.'],
  caraCepat: 'Kalikan nilai taksiran dengan persentase pinjaman.',
};

const EMAS = kombinasi({ harga: [960e3, 1.2e6, 1.44e6], kadar: [18, 20, 22], berat: [2, 5, 10] });
const taksirEmas = (h: number, k: number, b: number) => ((h * k) / 24) * b;

const tTaksirEmas: TemplateHitung = {
  id: 'taksiran-emas', tingkat: 'menengah', topik: 'penaksiran',
  sumber: `${S.buku7}, Bab 3 (hlm. 63, simulasi agunan emas)`, berlakuPer: PEGADAIAN,
  parameter: EMAS,
  pertanyaan: (p) => `Seorang nasabah menggadaikan cincin emas ${p.kadar} karat seberat ${p.berat} gram. Harga emas 24 karat saat itu ${rp(p.harga)} per gram. Dengan rumus nilai taksiran = (harga 24 karat × kadar/24) × berat, nilai taksirannya adalah ...`,
  hitung: (p) => taksirEmas(p.harga, p.kadar, p.berat),
  pengecoh: (p) => [
    { nilai: p.harga * p.berat, alasan: 'Kadar emas diabaikan; emas dihitung seolah 24 karat.' },
    { nilai: (p.harga * p.kadar) / 24, alasan: 'Itu nilai per gram; belum dikalikan berat.' },
    { nilai: ((p.harga * 24) / p.kadar) * p.berat, alasan: 'Perbandingan kadar terbalik (24/kadar).' },
    { nilai: (p.harga * p.kadar * p.berat) / 100, alasan: 'Kadar diperlakukan sebagai persen, bukan dibagi 24.' },
  ],
  konsep: 'Nilai taksiran emas berdasarkan harga 24 karat, kadar, dan berat', kataKunci: 'kadar karat, berat, harga 24 karat',
  alasan: (p) => [`Nilai per gram = ${rp(p.harga)} × ${p.kadar}/24 = ${rp((p.harga * p.kadar) / 24)}.`, `Nilai taksiran = ${rp((p.harga * p.kadar) / 24)} × ${p.berat} gram = ${rp(taksirEmas(p.harga, p.kadar, p.berat))}.`],
  caraCepat: 'Sesuaikan harga dengan kadar (÷24 × kadar), lalu kali berat.',
};

const tPinjamanEmas: TemplateHitung = {
  id: 'pinjaman-emas', tingkat: 'menantang', topik: 'penaksiran',
  sumber: `${S.buku7}, Bab 3 (hlm. 63, simulasi agunan emas)`, berlakuPer: PEGADAIAN,
  parameter: kombinasi({ harga: [960e3, 1.2e6, 1.44e6], kadar: [18, 20, 22], berat: [2, 5, 10], persen: [85, 90, 92] }, (p) => bulat((taksirEmas(p.harga, p.kadar, p.berat) * p.persen) / 100)),
  pertanyaan: (p) => `Nasabah menggadaikan emas ${p.kadar} karat seberat ${p.berat} gram saat harga emas 24 karat ${rp(p.harga)} per gram. Nilai taksiran = (harga 24 karat × kadar/24) × berat, dan uang pinjaman ${p.persen}% dari nilai taksiran (angka ilustratif). Besar uang pinjamannya adalah ...`,
  hitung: (p) => (taksirEmas(p.harga, p.kadar, p.berat) * p.persen) / 100,
  pengecoh: (p) => {
    const t = taksirEmas(p.harga, p.kadar, p.berat);
    return [
      { nilai: t, alasan: 'Itu nilai taksiran; persentase pinjaman belum diterapkan.' },
      { nilai: (p.harga * p.berat * p.persen) / 100, alasan: 'Kadar emas diabaikan.' },
      { nilai: (t * (100 - p.persen)) / 100, alasan: 'Yang dihitung justru sisa persentasenya.' },
      { nilai: (((p.harga * p.kadar) / 24) * p.persen) / 100, alasan: 'Berat emas belum dikalikan.' },
    ];
  },
  konsep: 'Dua langkah: nilai taksiran emas, lalu uang pinjaman = persentase × taksiran', kataKunci: 'kadar, berat, persentase pinjaman',
  alasan: (p) => {
    const t = taksirEmas(p.harga, p.kadar, p.berat);
    return [`Nilai taksiran = (${rp(p.harga)} × ${p.kadar}/24) × ${p.berat} = ${rp(t)}.`, `Uang pinjaman = ${p.persen}% × ${rp(t)} = ${rp((t * p.persen) / 100)}.`];
  },
  caraCepat: 'Hitung taksiran dulu, lalu terapkan persentase pinjaman.',
};

const tSewaModal: TemplateHitung = {
  id: 'sewa-modal-15-hari', tingkat: 'menantang', topik: 'sewa modal',
  sumber: `${S.buku7}, Bab 3 (hlm. 63, simulasi pelunasan)`, berlakuPer: PEGADAIAN,
  parameter: kombinasi({ pinjaman: [2e6, 3e6, 4e6, 5e6, 10e6], tarif: [1, 1.2], hari: [12, 20, 25, 40, 50] }, (p) => bulat((p.pinjaman * p.tarif) / 100)),
  pertanyaan: (p) => `Uang pinjaman gadai ${rp(p.pinjaman)} dikenai sewa modal ilustratif ${desimal(p.tarif)}% per periode 15 hari; sisa hari yang kurang dari 15 dihitung satu periode penuh. Bila pinjaman dilunasi setelah ${p.hari} hari, besar sewa modalnya adalah ...`,
  hitung: (p) => ((p.pinjaman * p.tarif) / 100) * Math.ceil(p.hari / 15),
  pengecoh: (p) => {
    const satu = (p.pinjaman * p.tarif) / 100;
    const n = Math.ceil(p.hari / 15);
    return [
      { nilai: satu, alasan: 'Hanya satu periode yang dihitung.' },
      { nilai: (satu * p.hari) / 15, alasan: 'Hari dibagi 15 tanpa pembulatan ke atas, padahal sisa hari dihitung satu periode penuh.' },
      { nilai: satu * (n + 1), alasan: 'Periode terhitung satu kali terlalu banyak.' },
      { nilai: p.pinjaman + satu * n, alasan: 'Itu total pelunasan (pinjaman + sewa modal), bukan sewa modalnya.' },
      { nilai: (satu * p.hari) / 30, alasan: 'Tarif diperlakukan per 30 hari, padahal tarif per 15 hari.' },
    ];
  },
  konsep: 'Sewa modal dihitung per periode 15 hari dengan pembulatan ke atas', kataKunci: 'per periode 15 hari, pembulatan',
  alasan: (p) => {
    const satu = (p.pinjaman * p.tarif) / 100;
    const n = Math.ceil(p.hari / 15);
    return [`${p.hari} hari = ${n} periode 15 hari (sisa hari dibulatkan ke atas).`, `Sewa modal = ${rp(p.pinjaman)} × ${desimal(p.tarif)}% × ${n} = ${rp(satu * n)}.`];
  },
  caraCepat: 'Hitung jumlah periode (bulatkan ke atas), lalu kalikan sewa modal per periode.',
};

export const gadaiHitung = familyHitung({
  id: 'PSJK-GADAI-HITUNG', nama: 'Hitungan gadai', chapter: 'pergadaian', label: 'VARIASI',
  sumber: `${S.ebGadai}; ${S.buku7}`,
  ringkas: 'Total pelunasan, uang kelebihan lelang, batas pinjaman dari nilai taksiran, taksiran emas berdasarkan kadar dan berat, uang pinjaman emas (dua langkah), sewa modal per periode 15 hari.',
}, [tPelunasan, tKelebihan, tPlafon, tTaksirEmas, tPinjamanEmas, tSewaModal]);

export const FAMILIES_PERGADAIAN = [gadaiIstilah, gadaiKasus, gadaiHitung];
