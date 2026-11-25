import { familyKurasi, familyRelasi, type TabelRelasi } from '../umum';
import { alasanRelasi, baris, butir, kalimatRelasi, SUMBER as S } from './bantu';
import { bulat, familyHitung, kombinasi, persen2, rp, type TemplateHitung } from './hitung';

// Chapter Perusahaan Pembiayaan (kebutuhan 35). Tiga family:
//   PSJK-PP-ISTILAH  SHL      relasi dua arah: cara pembiayaan (sewa pembiayaan, jual dan sewa balik, anjak piutang, ...)
//                              dan kegiatan usaha (investasi, modal kerja, multiguna, pembiayaan lain, sewa operasi)
//   PSJK-PP-KASUS    VARIASI  klasifikasi kasus, anjak piutang with/without recourse, PPI, flat vs efektif, hak konsumen
//   PSJK-PP-HITUNG   VARIASI  pokok = harga − DP, angsuran flat, dua langkah, perbandingan total, rasio cicilan, efektif

const POJK_PP = 'POJK 35/POJK.05/2018 (dikutip Buku 5 OJK 2019; kategori sama pada e-book 2026)';
const POJK_PP_BARU = 'POJK 46/2024 jo. POJK 35/2025';

const CARA: TabelRelasi = {
  id: 'cara-pembiayaan',
  topik: 'cara pembiayaan',
  tanyaNilai: (s) => `Cara pembiayaan ${s} adalah ...`, // QC F03: tanpa nama lembaga yang menjadi kunci soal lain di chapter ini
  tanyaSubjek: (n) => `Cara pembiayaan berupa ${n} disebut ...`, // QC F03: tanpa nama lembaga yang menjadi kunci soal lain di chapter ini
  alasanSalah: alasanRelasi('adalah'),
  kalimat: kalimatRelasi('adalah'),
  konsep: 'Cara pembiayaan perusahaan pembiayaan: sewa pembiayaan (finance lease), jual dan sewa balik (sale and leaseback), anjak piutang (factoring), pembelian dengan pembayaran secara angsuran, dan fasilitas dana.',
  caraCepat: 'Barang disediakan dan disewakan → finance lease; barang milik debitur dijual lalu disewa kembali → sale and leaseback; membeli tagihan → factoring; dibeli lalu dicicil → angsuran; dana langsung untuk konsumsi → fasilitas dana.',
  baris: [
    baris('finance-lease', 'sewa pembiayaan (finance lease)', 'penyediaan barang untuk digunakan debitur selama jangka waktu tertentu dengan pengalihan secara substansial manfaat dan risiko atas barang', 'menengah', `${S.buku5}, Bab 2 (hlm. 50–51)`, POJK_PP),
    baris('leaseback', 'jual dan sewa balik (sale and leaseback)', 'penjualan barang milik debitur kepada perusahaan pembiayaan yang lalu disewakan kembali kepada debitur yang sama', 'menengah', `${S.buku5}, Bab 2 (hlm. 51–52)`, POJK_PP),
    baris('factoring', 'anjak piutang (factoring)', 'pembelian tagihan usaha suatu perusahaan berikut pengurusan penagihannya', 'menengah', `${S.buku5}, Bab 2 (hlm. 52–53)`, POJK_PP),
    baris('angsuran', 'pembelian dengan pembayaran secara angsuran', 'pengadaan barang atau jasa yang dibeli debitur dari penyedia, lalu dilunasi debitur secara bertahap kepada perusahaan pembiayaan', 'dasar', `${S.buku5}, Bab 2 (hlm. 54); ${S.bsc}, Bab VI (hlm. 88)`, POJK_PP),
    baris('fasilitas-dana', 'fasilitas dana', 'penyaluran dana langsung kepada debitur untuk pemakaian atau konsumsi, bukan untuk keperluan usaha', 'menengah', `${S.buku5}, Bab 2 (hlm. 55); ${S.bsc}, Bab VI (hlm. 89)`, POJK_PP),
  ],
};

// QC 2 R01: cara pembiayaan (finance lease, sale and leaseback, factoring, fasilitas dana) dan sewa operasi tidak
// diajarkan di materi folder; tabel CARA disaring otomatis karena sumbernya bukan e-book. Tabel di bawah memakai §3.1.1–3.1.21.
const KEGIATAN: TabelRelasi = {
  id: 'kegiatan-usaha',
  topik: 'kegiatan usaha perusahaan pembiayaan',
  tanyaNilai: (s) => `Dalam kegiatan usaha pembiayaan, ${s} adalah ...`, // QC F03: tanpa nama lembaga yang menjadi kunci soal lain di chapter ini
  tanyaSubjek: (n) => `Kegiatan usaha pembiayaan berupa ${n} disebut ...`, // QC F03: tanpa nama lembaga yang menjadi kunci soal lain di chapter ini
  alasanSalah: alasanRelasi('adalah'),
  kalimat: kalimatRelasi('adalah'),
  konsep: 'Kegiatan usaha perusahaan pembiayaan diklasifikasikan menurut tujuan dana: investasi, modal kerja, multiguna, dan kegiatan lain dengan persetujuan OJK. Pembiayaan infrastruktur dijalankan lembaga yang dibentuk khusus.',
  caraCepat: 'Klasifikasikan dari TUJUAN dana: barang modal usaha → investasi; habis dalam satu siklus usaha → modal kerja; konsumsi → multiguna; proyek jalan, air, energi → infrastruktur.',
  baris: [
    baris('investasi', 'pembiayaan investasi', 'pendanaan barang modal dan jasa pendukung usaha, seperti mesin, modernisasi, ekspansi, atau relokasi', 'dasar', `${S.ebPp}, §3.1.10 dan §3.1.17`, POJK_PP_BARU),
    baris('modal-kerja', 'pembiayaan modal kerja', 'pendanaan pengeluaran yang habis dalam satu siklus usaha, seperti bahan baku', 'dasar', `${S.ebPp}, §3.1.10 dan §3.1.17`, POJK_PP_BARU),
    baris('multiguna', 'pembiayaan multiguna', 'pendanaan barang atau jasa konsumsi yang tidak ditujukan bagi kegiatan usaha produktif', 'dasar', `${S.ebPp}, §3.1.10 dan §3.1.17`, POJK_PP_BARU),
    baris('lain', 'kegiatan pembiayaan lain', 'kegiatan di luar tiga kategori utama yang dijalankan dengan persetujuan OJK', 'menengah', `${S.ebPp}, §3.1.10`, POJK_PP_BARU),
    baris('infrastruktur', 'pembiayaan infrastruktur', 'pendanaan proyek seperti jalan, pengelolaan air, energi, dan telekomunikasi', 'dasar', `${S.ebPp}, §3.1.12 dan §3.1.21`, POJK_PP_BARU),
  ],
};

const LEMBAGA_PP: TabelRelasi = {
  id: 'lembaga',
  topik: 'kelembagaan pembiayaan',
  tanyaNilai: (s) => `Dalam sistem keuangan, ${s} adalah ...`,
  tanyaSubjek: (n) => `Dalam sistem keuangan, ${n} disebut ...`,
  alasanSalah: alasanRelasi('adalah'),
  kalimat: kalimatRelasi('adalah'),
  konsep: 'Lembaga pembiayaan menyediakan dana atau barang modal dan mencakup perusahaan pembiayaan serta perusahaan pembiayaan infrastruktur; keduanya bukan penghimpun giro dan tabungan seperti bank.',
  caraCepat: 'Menghimpun simpanan → bank; barang/jasa tanpa simpanan → perusahaan pembiayaan; proyek infrastruktur → PPI; seluruhnya syariah → perusahaan pembiayaan syariah; unit di dalam perusahaan → UUS.',
  baris: [
    baris('lp', 'lembaga pembiayaan', 'kelompok badan usaha yang menyediakan dana atau barang modal untuk kebutuhan pembiayaan', 'menengah', `${S.ebPp}, §3.1.9 dan §3.1.16`),
    baris('pp', 'perusahaan pembiayaan', 'badan usaha yang membiayai barang dan/atau jasa tanpa menghimpun giro atau tabungan', 'dasar', `${S.ebPp}, §3.1.1 dan §3.1.9`),
    baris('pp-syariah', 'perusahaan pembiayaan syariah', 'badan usaha pembiayaan yang seluruh kegiatannya berdasarkan prinsip syariah', 'dasar', `${S.ebPp}, §3.1.9, §3.1.11, dan §3.1.18`),
    baris('uus', 'UUS perusahaan pembiayaan', 'unit kerja di dalam perusahaan induk konvensional yang mengelola pembiayaan syariah', 'menengah', `${S.ebPp}, §3.1.9, §3.1.11, dan §3.1.18`),
    baris('ppi', 'perusahaan pembiayaan infrastruktur', 'badan usaha yang dibentuk khusus untuk membiayai proyek seperti jalan, air, dan energi', 'dasar', `${S.ebPp}, §3.1.12 dan §3.1.16`),
    baris('bank', 'bank', 'badan usaha yang menghimpun simpanan masyarakat dan menyalurkan kredit atau pembiayaan', 'dasar', `${S.ebPp}, §3.1.1; ${S.ebBank}, §3.1.1`),
  ],
};

const BIAYA: TabelRelasi = {
  id: 'istilah-biaya',
  topik: 'istilah biaya dan akad',
  tanyaNilai: (s) => `Dalam perjanjian pembiayaan, ${s} adalah ...`,
  tanyaSubjek: (n) => `Dalam perjanjian pembiayaan, ${n} disebut ...`,
  alasanSalah: alasanRelasi('adalah'),
  kalimat: kalimatRelasi('adalah'),
  konsep: 'Pokok = harga − uang muka; bunga flat memakai pokok awal, bunga efektif memakai sisa pokok; pada akad syariah imbalannya margin (jual beli) atau ujrah (jasa).',
  caraCepat: 'Harga − DP → pokok; basis pokok awal → flat; basis sisa pokok → efektif; pokok + bunga + biaya → total kewajiban; jual beli → margin; jasa → ujrah.',
  baris: [
    baris('pokok', 'pokok pembiayaan', 'harga barang dikurangi uang muka', 'dasar', `${S.ebPp}, §3.1.3`),
    baris('flat', 'bunga flat', 'bunga setiap periode yang dihitung dari pokok awal', 'dasar', `${S.ebPp}, §3.1.20`),
    baris('efektif', 'bunga efektif', 'bunga periode yang dihitung dari saldo pokok yang belum lunas', 'dasar', `${S.ebPp}, §3.1.3 dan §3.1.20`),
    baris('total', 'total kewajiban konsumen', 'seluruh pokok, bunga atau margin, dan biaya sah yang harus dibayar', 'dasar', `${S.ebPp}, §3.1.3`),
    baris('tenor', 'tenor', 'jangka waktu pembayaran angsuran menurut perjanjian', 'dasar', `${S.ebPp}, §3.1.1, §3.1.3, dan §3.1.7`),
    baris('margin', 'margin', 'keuntungan jual beli yang diketahui dan disepakati kedua pihak', 'menengah', `${S.ebPp}, §3.1.5 dan §3.1.18`),
    baris('ujrah', 'ujrah', 'imbalan jasa sesuai akad terkait', 'menengah', `${S.ebPp}, §3.1.5 dan §3.1.18`),
  ],
};

export const ppIstilah = familyRelasi({
  id: 'PSJK-PP-ISTILAH', nama: 'Kegiatan usaha, kelembagaan, dan istilah biaya', chapter: 'perusahaan-pembiayaan', label: 'SHL',
  sumber: `${S.ebPp}, §3.1.1–3.1.21`,
  ringkas: 'Relasi dua arah untuk kegiatan usaha menurut tujuan dana, kelembagaan pembiayaan, serta istilah biaya dan akad.',
}, [CARA, KEGIATAN, LEMBAGA_PP, BIAYA]);

const ALASAN_PPI_BOLEH = 'Kegiatan ini tercantum sebagai kegiatan perusahaan pembiayaan infrastruktur, jadi bukan jawaban.';
const ALASAN_BIAYA = 'Biaya ini tercantum sebagai biaya dalam produk pembiayaan, jadi bukan jawaban.';

export const ppKasus = familyKurasi({
  id: 'PSJK-PP-KASUS', versi: 2, nama: 'Kasus perusahaan pembiayaan', chapter: 'perusahaan-pembiayaan', label: 'VARIASI',
  sumber: `${S.ebPp}; ${S.buku5}; ${S.bsc}`,
  ringkas: 'Klasifikasi tujuan pembiayaan dari kasus, cara pembiayaan (factoring, leaseback), PPI dan larangannya, flat vs efektif, syariah (murabahah, IMBT), legalitas, hak dan kewajiban konsumen; termasuk "KECUALI" dan pernyataan majemuk.',
}, [
  butir('multifinance', 'dasar', 'kelembagaan', {
    tanya: 'Perusahaan X membiayai pembelian mobil konsumen secara angsuran, tetapi tidak menawarkan simpanan giro maupun tabungan. Berdasarkan kegiatannya, perusahaan X paling tepat dikategorikan sebagai ...',
    jawab: 'Perusahaan pembiayaan',
    salah: [
      ['Bank umum', 'Bank umum menghimpun simpanan seperti giro dan tabungan, sedangkan perusahaan X tidak melakukannya.'],
      ['Lembaga Penjamin Simpanan', 'LPS menjamin simpanan nasabah bank, bukan membiayai pembelian mobil.'],
      ['Dana pensiun', 'Dana pensiun mengelola program yang menjanjikan manfaat pensiun.'],
      ['Perusahaan penjaminan', 'Perusahaan penjaminan memberi jaminan atas kewajiban terjamin, bukan membiayai pembelian barang.'],
    ],
    konsep: 'Pengertian perusahaan pembiayaan (multifinance)', kunci: 'membiayai pembelian secara angsuran, tanpa simpanan',
    alasan: 'Perusahaan pembiayaan melakukan pembiayaan barang dan/atau jasa dan tidak menjalankan fungsi tabungan, giro, atau deposito seperti bank.',
    cepat: 'Membiayai barang + tidak menghimpun simpanan → perusahaan pembiayaan.',
    sumber: `${S.ebPp}, §3.1.1 dan contoh soal 4.1`,
  }),
  butir('bus-armada', 'dasar', 'tujuan pembiayaan', {
    tanya: 'Perusahaan angkutan membiayai pembelian bus melalui perusahaan pembiayaan untuk menambah armada usahanya. Kegiatan pembiayaan ini termasuk ...',
    jawab: 'Pembiayaan investasi',
    salah: [
      ['Pembiayaan modal kerja', 'Modal kerja membiayai pengeluaran yang habis dalam satu siklus usaha, bukan barang modal.'],
      ['Pembiayaan multiguna', 'Multiguna untuk pemakaian atau konsumsi, bukan untuk keperluan usaha.'],
      ['Pembiayaan infrastruktur', 'Pembiayaan infrastruktur ditujukan untuk proyek seperti jalan, air, dan energi.'],
      ['Pembiayaan jasa syariah', 'Pembiayaan jasa menyediakan manfaat barang atau pelayanan sesuai akad, bukan pembelian armada.'],
    ],
    konsep: 'Klasifikasi tujuan pembiayaan', kunci: 'bus, menambah armada usaha',
    alasan: 'Pembiayaan investasi membiayai barang modal untuk usaha atau ekspansi; bus yang menjadi armada usaha termasuk barang modal.',
    cepat: 'Barang modal untuk usaha → investasi.',
    sumber: `${S.buku5}, Bab 2 (hlm. 47); ${S.ebPp}, §3.1.10`, berlaku: POJK_PP,
  }),
  butir('bahan-baku', 'dasar', 'tujuan pembiayaan', {
    tanya: 'Pengusaha konveksi membutuhkan dana untuk membeli kain dan benang yang habis dipakai dalam satu siklus produksi. Jenis pembiayaan yang paling sesuai adalah ...',
    jawab: 'Pembiayaan modal kerja',
    salah: [
      ['Pembiayaan investasi', 'Investasi membiayai barang modal seperti mesin, bukan bahan baku yang habis dalam satu siklus.'],
      ['Pembiayaan multiguna', 'Multiguna untuk konsumsi, bukan kegiatan produksi usaha.'],
      ['Penyertaan saham modal ventura', 'Penyertaan saham adalah kegiatan modal ventura, bukan pembiayaan bahan baku.'],
      ['Penjaminan kredit', 'Penjaminan kredit memberi perlindungan atas kewajiban debitur, bukan menyediakan dana.'],
    ],
    konsep: 'Klasifikasi tujuan pembiayaan', kunci: 'bahan baku, habis dalam satu siklus',
    alasan: 'Pembiayaan modal kerja ditujukan untuk pengeluaran yang habis dalam satu siklus aktivitas usaha, seperti pengadaan bahan baku.',
    cepat: 'Habis dalam satu siklus usaha → modal kerja.',
    sumber: `${S.ebPp}, §3.1.10, §3.1.17, contoh soal 4.14`, berlaku: POJK_PP,
  }),
  butir('perabot', 'dasar', 'tujuan pembiayaan', {
    tanya: 'Seorang karyawan membiayai pembelian perabot rumah tangga untuk dipakai sendiri, tanpa kaitan dengan kegiatan usaha. Kategori pembiayaannya adalah ...',
    jawab: 'Pembiayaan multiguna',
    salah: [
      ['Pembiayaan investasi', 'Investasi membiayai barang modal untuk usaha.'],
      ['Pembiayaan modal kerja', 'Modal kerja membiayai kebutuhan siklus operasional usaha.'],
      ['Pembiayaan infrastruktur', 'Pembiayaan infrastruktur ditujukan untuk proyek seperti jalan, air minum, atau energi.'],
      ['Penyertaan modal', 'Penyertaan modal adalah investasi pada saham perusahaan, bukan pembelian perabot.'],
    ],
    konsep: 'Klasifikasi tujuan pembiayaan', kunci: 'dipakai sendiri, tanpa kaitan usaha',
    alasan: 'Pembiayaan multiguna adalah pembiayaan barang atau jasa untuk pemakaian/konsumsi, bukan untuk keperluan usaha.',
    cepat: 'Konsumsi pribadi → multiguna.',
    sumber: `${S.ebPp}, §3.1.10, §3.1.17, contoh soal 4.15`, berlaku: POJK_PP,
  }),
  butir('utang-dagang', 'menengah', 'tujuan pembiayaan', {
    tanya: 'Sebuah perusahaan memperoleh pembiayaan untuk membayar utang dagang kepada pemasok dan membayar bonus karyawan. Menurut contoh OJK, pembiayaan ini termasuk ...',
    jawab: 'Pembiayaan modal kerja',
    salah: [
      ['Pembiayaan investasi', 'Investasi membiayai barang modal, rehabilitasi, modernisasi, ekspansi, atau relokasi tempat usaha.'],
      ['Pembiayaan multiguna', 'Multiguna ditujukan untuk konsumsi, bukan keperluan usaha.'],
      ['Sewa pembiayaan (finance lease)', 'Sewa pembiayaan adalah penyediaan barang untuk digunakan debitur, bukan pembayaran utang dagang.'],
      ['Sewa operasi (operating lease)', 'Sewa operasi adalah penyewaan barang seperti rental kendaraan.'],
    ],
    konsep: 'Klasifikasi tujuan pembiayaan', kunci: 'utang dagang, bonus karyawan',
    alasan: 'OJK mencontohkan pengeluaran modal kerja antara lain pembayaran utang dagang kepada pemasok barang/jasa dan pembayaran bonus karyawan.',
    cepat: 'Pengeluaran operasional usaha → modal kerja.',
    sumber: `${S.buku5}, Bab 2 (hlm. 47)`, berlaku: POJK_PP,
  }),
  butir('biaya-kuliah', 'dasar', 'tujuan pembiayaan', {
    tanya: 'Seorang nasabah membiayai biaya kuliah anaknya melalui perusahaan pembiayaan. Kategori pembiayaannya adalah ...',
    jawab: 'Pembiayaan multiguna',
    salah: [
      ['Pembiayaan investasi', 'Investasi membiayai barang modal usaha.'],
      ['Pembiayaan modal kerja', 'Modal kerja membiayai pengeluaran dalam siklus usaha.'],
      ['Kegiatan usaha pembiayaan lain', 'Kategori ini untuk pembiayaan yang tidak dapat digolongkan ke investasi, modal kerja, atau multiguna; biaya kuliah sudah termasuk multiguna.'],
      ['Anjak piutang', 'Anjak piutang adalah pembelian piutang usaha.'],
    ],
    konsep: 'Klasifikasi tujuan pembiayaan', kunci: 'biaya kuliah, jasa konsumsi',
    alasan: 'Contoh barang atau jasa pembiayaan multiguna dari OJK antara lain biaya kuliah, biaya operasi di rumah sakit, dan Ongkos Naik Haji.',
    cepat: 'Jasa untuk kebutuhan pribadi → multiguna.',
    sumber: `${S.buku5}, Bab 2 (hlm. 48); ${S.bsc}, Bab VI (hlm. 87)`, berlaku: POJK_PP,
  }),
  butir('factoring-kasus', 'menengah', 'cara pembiayaan', {
    tanya: 'Sebuah produsen menjual tagihan atas penjualan kreditnya kepada perusahaan pembiayaan. Perusahaan pembiayaan membayar sebagian nilai tagihan di muka, lalu menagih pelanggan saat jatuh tempo. Cara pembiayaan ini disebut ...',
    jawab: 'Anjak piutang (factoring)',
    salah: [
      ['Sewa pembiayaan (finance lease)', 'Sewa pembiayaan menyediakan barang untuk digunakan debitur, bukan membeli tagihan.'],
      ['Jual dan sewa balik (sale and leaseback)', 'Jual dan sewa balik melibatkan penjualan barang milik debitur lalu disewa kembali.'],
      ['Fasilitas dana', 'Fasilitas dana menyalurkan dana langsung untuk konsumsi, bukan membeli piutang usaha.'],
      ['Pembelian dengan pembayaran secara angsuran', 'Cara ini untuk membeli barang/jasa yang dilunasi bertahap, bukan membeli tagihan.'],
    ],
    konsep: 'Mekanisme anjak piutang', kunci: 'menjual tagihan, menagih saat jatuh tempo',
    alasan: 'Anjak piutang adalah pembelian piutang usaha suatu perusahaan berikut pengurusannya: perusahaan pembiayaan membayar sebagian nilai tagihan, menagih pelanggan, lalu membayar sisanya.',
    cepat: 'Tagihan/invoice dijual → factoring.',
    sumber: `${S.buku5}, Bab 2 (hlm. 52–53)`, berlaku: POJK_PP,
  }),
  butir('with-recourse', 'menantang', 'cara pembiayaan', {
    tanya: 'Dalam suatu transaksi anjak piutang, penjual piutang tetap menanggung risiko jika sebagian piutang yang dijual tidak tertagih. Jenis anjak piutang ini adalah ...',
    jawab: 'Anjak piutang with recourse',
    salah: [
      ['Anjak piutang without recourse', 'Pada without recourse, perusahaan pembiayaan yang menanggung risiko tidak tertagihnya piutang.'],
      ['Jual dan sewa balik (sale and leaseback)', 'Jual dan sewa balik berkaitan dengan barang, bukan piutang.'],
      ['Sewa operasi (operating lease)', 'Sewa operasi adalah penyewaan barang seperti rental kendaraan.'],
      ['Fasilitas dana', 'Fasilitas dana menyalurkan dana untuk konsumsi.'],
    ],
    konsep: 'Factoring with recourse vs without recourse', kunci: 'penjual piutang menanggung risiko',
    alasan: 'Pada factoring with recourse, penjual piutang menanggung risiko tidak tertagihnya sebagian atau seluruh piutang yang dijual kepada perusahaan pembiayaan.',
    cepat: 'With recourse = risiko kembali ke penjual piutang.',
    sumber: `${S.buku5}, Bab 2 (hlm. 52–53)`, berlaku: POJK_PP,
  }),
  butir('without-recourse', 'menantang', 'cara pembiayaan', {
    tanya: 'Perusahaan pembiayaan membeli piutang usaha dan menanggung sendiri risiko tidak tertagihnya seluruh piutang tersebut. Jenis anjak piutang ini adalah ...',
    jawab: 'Anjak piutang without recourse',
    salah: [
      ['Anjak piutang with recourse', 'Pada with recourse, penjual piutang yang menanggung risiko tidak tertagih.'],
      ['Sewa pembiayaan (finance lease)', 'Sewa pembiayaan berkaitan dengan penyediaan barang.'],
      ['Jual dan sewa balik (sale and leaseback)', 'Jual dan sewa balik berkaitan dengan barang milik debitur.'],
      ['Pembelian dengan pembayaran secara angsuran', 'Cara ini untuk pembelian barang/jasa yang dicicil.'],
    ],
    konsep: 'Factoring with recourse vs without recourse', kunci: 'perusahaan pembiayaan menanggung risiko',
    alasan: 'Pada factoring without recourse, perusahaan pembiayaan menanggung risiko tidak tertagihnya seluruh piutang yang dibelinya.',
    cepat: 'Without recourse = risiko pada perusahaan pembiayaan.',
    sumber: `${S.buku5}, Bab 2 (hlm. 52–53)`, berlaku: POJK_PP,
  }),
  butir('leaseback-kasus', 'menengah', 'cara pembiayaan', {
    tanya: 'Pemilik pabrik menjual mesin miliknya kepada perusahaan pembiayaan, kemudian menyewa kembali mesin itu dengan pembayaran berkala agar tetap dapat dipakai berproduksi. Cara pembiayaan ini adalah ...',
    jawab: 'Jual dan sewa balik (sale and leaseback)',
    salah: [
      ['Sewa pembiayaan langsung (direct finance lease)', 'Pada sewa pembiayaan, barang dibeli perusahaan pembiayaan dari pemasok, bukan dijual oleh debitur sendiri.'],
      ['Anjak piutang (factoring)', 'Anjak piutang adalah pembelian piutang usaha.'],
      ['Fasilitas dana', 'Fasilitas dana menyalurkan dana untuk konsumsi, bukan keperluan usaha.'],
      ['Sewa operasi (operating lease)', 'Sewa operasi adalah penyewaan barang seperti rental kendaraan, tanpa penjualan barang oleh debitur.'],
    ],
    konsep: 'Mekanisme jual dan sewa balik', kunci: 'menjual mesin miliknya, menyewa kembali',
    alasan: 'Jual dan sewa balik adalah penjualan barang oleh debitur kepada perusahaan pembiayaan yang disertai penyewaan kembali barang tersebut kepada debitur yang sama.',
    cepat: 'Barang milik sendiri dijual lalu disewa kembali → sale and leaseback.',
    sumber: `${S.buku5}, Bab 2 (hlm. 51–52)`, berlaku: POJK_PP,
  }),
  butir('finance-lease-milik', 'menengah', 'cara pembiayaan', {
    tanya: 'Dalam cara pembiayaan sewa pembiayaan (finance lease), kepemilikan atas barang objek transaksi berada pada ...',
    jawab: 'Perusahaan pembiayaan',
    salah: [
      ['Debitur sejak awal kontrak', 'Debitur menggunakan barang, tetapi kepemilikannya berada pada perusahaan pembiayaan.'],
      ['Pemasok barang', 'Pemasok sudah menerima pembayaran dari perusahaan pembiayaan atas barang tersebut.'],
      ['OJK sebagai pengawas', 'OJK mengatur dan mengawasi, bukan memiliki barang transaksi.'],
      ['Bank kustodian', 'Bank kustodian berperan dalam penitipan aset investasi, bukan transaksi sewa pembiayaan.'],
    ],
    konsep: 'Ketentuan sewa pembiayaan', kunci: 'kepemilikan barang objek transaksi',
    alasan: 'Dalam sewa pembiayaan, kepemilikan barang berada pada perusahaan pembiayaan, debitur dilarang menyewa-pembiayaankan kembali barang itu, dan perusahaan wajib menempelkan plakat/etiket pada barang.',
    cepat: 'Finance lease: dipakai debitur, dimiliki perusahaan pembiayaan.',
    sumber: `${S.buku5}, Bab 2 (hlm. 50–51)`, berlaku: POJK_PP,
  }),
  butir('efektif-basis', 'dasar', 'bunga flat dan efektif', {
    tanya: 'Pernyataan yang tepat mengenai dasar perhitungan bunga efektif adalah ...',
    jawab: 'Bunga dihitung dari sisa pokok utang',
    salah: [
      ['Bunga selalu dihitung dari pokok awal', 'Bunga yang selalu dihitung dari pokok awal adalah bunga flat.'],
      ['Bunga menjadi nol setelah angsuran pertama', 'Bunga tetap dihitung selama masih ada sisa pokok.'],
      ['Bunga tidak dipengaruhi tenor', 'Lama tenor memengaruhi jumlah periode bunga yang dibayar.'],
      ['Bunga tidak perlu dicantumkan dalam perjanjian', 'Metode dan besaran bunga harus dibaca dalam perjanjian.'],
    ],
    konsep: 'Perbedaan bunga flat dan bunga efektif', kunci: 'bunga efektif',
    alasan: 'Bunga efektif dihitung dari sisa pokok utang, sehingga porsi bunga dan pokok dalam angsuran berubah setiap bulan.',
    cepat: 'Efektif = sisa pokok; flat = pokok awal.',
    sumber: `${S.ebPp}, §3.1.3, §3.1.20, contoh soal 4.6; ${S.bsc}, Bab VI (hlm. 90)`,
  }),
  butir('flat-porsi', 'menengah', 'bunga flat dan efektif', {
    tanya: 'Pada perhitungan bunga flat, porsi pokok dan porsi bunga dalam angsuran bulanan ...',
    jawab: 'Tetap sama sampai akhir periode angsuran',
    salah: [
      ['Berubah setiap bulan mengikuti sisa pokok', 'Porsi yang berubah mengikuti sisa pokok adalah ciri bunga efektif.'],
      ['Selalu nol pada bulan terakhir', 'Pada bunga flat, porsi bunga tetap ada hingga angsuran terakhir.'],
      ['Dihitung dari harga barang sebelum uang muka', 'Bunga flat dihitung dari pokok utang awal, yaitu setelah uang muka.'],
      ['Ditetapkan oleh LPS', 'LPS tidak menetapkan bunga pembiayaan.'],
    ],
    konsep: 'Perbedaan bunga flat dan bunga efektif', kunci: 'bunga flat, porsi pokok dan bunga',
    alasan: 'Bunga flat mengacu pada pokok utang awal, sehingga porsi pokok dan bunga dalam angsuran bulanan tetap sampai akhir periode angsuran.',
    cepat: 'Flat = angsuran dan porsinya tidak berubah.',
    sumber: `${S.bsc}, Bab VI (hlm. 90); ${S.ebPp}, §3.1.20`,
  }),
  butir('ppi-air', 'dasar', 'pembiayaan infrastruktur', {
    tanya: 'Sebuah perusahaan didirikan khusus untuk membiayai pembangunan jaringan pengolahan air minum. Kategori lembaganya yang paling tepat adalah ...',
    jawab: 'Perusahaan pembiayaan infrastruktur',
    salah: [
      ['Bank umum penerima giro dan tabungan', 'Bank umum menghimpun simpanan dan tidak dibentuk khusus untuk pembiayaan infrastruktur.'],
      ['Perusahaan modal ventura', 'Perusahaan modal ventura berfokus pada penyertaan modal atau pembiayaan pasangan usaha.'],
      ['Perusahaan pergadaian', 'Pergadaian memberikan pinjaman dengan jaminan barang bergerak.'],
      ['Lembaga keuangan mikro', 'LKM melayani usaha skala mikro dalam wilayah usaha tertentu.'],
    ],
    konsep: 'Perusahaan pembiayaan infrastruktur (PPI)', kunci: 'didirikan khusus, air minum',
    alasan: 'PPI dibentuk khusus untuk membiayai proyek infrastruktur; air minum termasuk kelompok proyek yang dapat dibiayai.',
    cepat: 'Proyek infrastruktur + dibentuk khusus → PPI.',
    sumber: `${S.ebPp}, §3.1.12, §3.1.16, contoh soal 4.16`,
  }),
  butir('ppi-giro', 'menengah', 'pembiayaan infrastruktur', {
    tanya: 'Sebuah perusahaan pembiayaan infrastruktur menawarkan fasilitas rekening giro kepada masyarakat umum. Penawaran tersebut termasuk kegiatan ...',
    jawab: 'Penghimpunan simpanan yang dilarang',
    salah: [
      ['Pembiayaan investasi yang diizinkan bagi PPI', 'Rekening giro adalah simpanan, bukan pembiayaan investasi.'],
      ['Pendanaan proyek infrastruktur', 'Menawarkan giro adalah menghimpun dana masyarakat, bukan membiayai proyek.'],
      ['Pembiayaan multiguna konsumen', 'Rekening giro bukan pembiayaan konsumsi.'],
      ['Pinjaman subordinasi proyek', 'Pinjaman subordinasi adalah penyaluran dana, bukan penghimpunan simpanan.'],
    ],
    konsep: 'Larangan perusahaan pembiayaan infrastruktur', kunci: 'rekening giro, masyarakat umum',
    alasan: 'PPI dilarang menghimpun dana masyarakat secara langsung dalam bentuk giro, tabungan, atau bentuk sejenis.',
    cepat: 'Giro = simpanan → hanya bank; PPI tidak boleh.',
    sumber: `${S.ebPp}, §3.1.13, §3.1.21, contoh soal 4.17`,
  }),
  butir('ppi-kecuali', 'menantang', 'pembiayaan infrastruktur', {
    tanya: 'Kegiatan berikut merupakan bentuk kegiatan perusahaan pembiayaan infrastruktur, KECUALI ...',
    jawab: 'Menghimpun tabungan dari masyarakat',
    salah: [
      ['Pinjaman langsung (direct lending) untuk proyek', ALASAN_PPI_BOLEH],
      ['Refinancing atas infrastruktur yang dibiayai pihak lain', ALASAN_PPI_BOLEH],
      ['Pinjaman subordinasi terkait infrastruktur', ALASAN_PPI_BOLEH],
      ['Jasa konsultasi (advisory services)', ALASAN_PPI_BOLEH],
      ['Penyertaan modal (equity investment)', ALASAN_PPI_BOLEH],
    ],
    konsep: 'Kegiatan dan larangan PPI', kunci: 'KECUALI, menghimpun tabungan',
    alasan: 'PPI melakukan pinjaman langsung, refinancing, dan pinjaman subordinasi, serta kegiatan pendukung seperti dukungan kredit, konsultasi, dan penyertaan modal; PPI dilarang menghimpun dana masyarakat dalam bentuk giro atau tabungan.',
    cepat: 'Semua kegiatan menyalurkan dana/jasa → boleh; menghimpun simpanan → tidak.',
    sumber: `${S.ebPp}, §3.1.12, §3.1.13, §3.1.21; ${S.buku5}, Bab 2 (hlm. 56)`,
  }),
  butir('find', 'dasar', 'legalitas', {
    tanya: 'Seorang konsumen menerima penawaran pembiayaan kendaraan dari perusahaan multifinance yang mencantumkan nomor izin OJK di brosurnya. Langkah paling tepat untuk memastikan legalitas perusahaan itu adalah ...',
    jawab: 'Mencocokkan nama perusahaan melalui FIND OJK',
    salah: [
      ['Memeriksa nomor izin pada brosur perusahaan', 'Brosur adalah materi promosi dari perusahaan sendiri, bukan sumber verifikasi resmi.'],
      ['Mengonfirmasi identitas kepada petugas pemasaran', 'Keterangan petugas bukan pengganti verifikasi pada direktori resmi.'],
      ['Mencari ulasan konsumen di media sosial', 'Ulasan hanya informasi tambahan, bukan bukti legalitas.'],
      ['Melihat logo OJK pada materi pemasaran', 'Logo pada materi pemasaran tidak membuktikan izin usaha.'],
    ],
    konsep: 'Verifikasi legalitas melalui direktori resmi OJK', kunci: 'memastikan legalitas',
    alasan: 'Legalitas diverifikasi melalui sumber resmi OJK, misalnya Financial Institutions Directory (FIND) OJK, dengan mencocokkan nama badan hukum dan izinnya.',
    cepat: 'Legalitas → direktori resmi OJK, bukan materi promosi.',
    sumber: `${S.ebPp}, §3.1.22 dan contoh soal 4.10`,
  }),
  butir('transparansi', 'menengah', 'hak konsumen', {
    tanya: 'Seorang konsumen akan menandatangani perjanjian pembiayaan kendaraan. Perusahaan baru menjelaskan cicilan bulanan, tetapi belum memberikan informasi total biaya dan denda keterlambatan. Tindakan yang paling tepat sebelum menandatangani adalah ...',
    jawab: 'Meminta rincian biaya dan ketentuan denda secara tertulis',
    salah: [
      ['Membandingkan tenor pembiayaan kendaraan dari beberapa dealer', 'Membandingkan tenor tidak menutup kekurangan informasi biaya yang belum disampaikan.'],
      ['Memeriksa reputasi perusahaan pembiayaan', 'Reputasi tidak menggantikan rincian biaya dan denda dalam perjanjian.'],
      ['Menghitung cicilan berdasarkan penghasilan', 'Kemampuan bayar penting, tetapi tidak menjawab informasi biaya yang belum lengkap.'],
      ['Langsung menandatangani karena cicilannya ringan', 'Cicilan ringan tidak otomatis berarti biaya total paling rendah.'],
    ],
    konsep: 'Hak konsumen atas transparansi biaya', kunci: 'belum ada informasi total biaya dan denda',
    alasan: 'Konsumen berhak memperoleh rincian seluruh biaya, sanksi, atau denda; bila belum lengkap, minta rincian tertulis sebelum menyetujui perjanjian.',
    cepat: 'Informasi biaya belum lengkap → minta rincian tertulis dulu.',
    sumber: `${S.ebPp}, §3.1.4 dan contoh soal 4.7; ${S.bsc}, Bab VI (hlm. 91)`,
  }),
  butir('penagihan', 'menengah', 'hak konsumen', {
    tanya: 'Seorang konsumen terlambat membayar cicilan kendaraan pada perusahaan pembiayaan. Pernyataan yang paling tepat mengenai penanganan tunggakan tersebut adalah ...',
    jawab: 'Penagihan dan penanganan jaminan mengikuti prosedur hukum.',
    salah: [
      ['Penagihan cukup mengikuti keputusan petugas.', 'Keputusan petugas tidak dapat menggantikan ketentuan hukum dan perjanjian.'],
      ['Barang dapat langsung ditarik perusahaan begitu cicilan terlambat.', 'Keterlambatan tidak berarti barang langsung ditarik tanpa prosedur hukum.'],
      ['Penagihan ditentukan oleh nilai pasar kendaraan.', 'Nilai pasar kendaraan bukan dasar prosedur penagihan.'],
      ['Tunggakan dihapus bila konsumen terlambat tiga bulan.', 'Kewajiban konsumen tidak hapus karena keterlambatan.'],
    ],
    konsep: 'Penanganan wanprestasi dan penagihan', kunci: 'terlambat, penagihan',
    alasan: 'Penagihan atas tunggakan dan penanganan jaminan wajib mengikuti prosedur hukum, perjanjian yang sah, dan ketentuan pelindungan konsumen.',
    cepat: 'Penagihan/eksekusi jaminan → harus sesuai hukum dan perjanjian.',
    sumber: `${S.ebPp}, §3.1.4, §3.1.23, contoh soal 4.8`,
  }),
  butir('arus-kas-turun', 'menengah', 'hak konsumen', {
    tanya: 'Cicilan kendaraan Rp2.000.000 jatuh tempo lima hari lagi, sedangkan dana debitur hanya Rp1.200.000 karena pendapatannya turun. Tindakan yang paling tepat untuk mengelola risiko keterlambatan adalah ...',
    jawab: 'Mengonfirmasi opsi pembayaran ke perusahaan sebelum jatuh tempo',
    salah: [
      ['Membayar sebagian cicilan dan menganggap kewajiban bulan itu selesai', 'Pembayaran sebagian belum tentu diperbolehkan dan tidak otomatis mencegah keterlambatan.'],
      ['Mengajukan penjadwalan ulang setelah jatuh tempo', 'Menunggu sampai lewat jatuh tempo justru menambah risiko keterlambatan.'],
      ['Menunda cicilan sambil menunggu pendapatan berikutnya', 'Menunda tanpa komunikasi menambah ketidakpastian dan potensi biaya.'],
      ['Mengalihkan dana untuk kebutuhan bulan depan', 'Mengalihkan dana memperbesar kekurangan pembayaran.'],
    ],
    konsep: 'Mengelola risiko keterlambatan pembiayaan', kunci: 'jatuh tempo lima hari, dana kurang',
    alasan: ['Kekurangan dana Rp2.000.000 − Rp1.200.000 = Rp800.000.', 'Langkah rasional adalah menghubungi perusahaan melalui kanal resmi sebelum jatuh tempo dan mengonfirmasi opsi penanganan sesuai kebijakan dan perjanjian.'],
    cepat: 'Masalah bayar → komunikasikan sebelum jatuh tempo.',
    sumber: `${S.ebPp}, §3.1.23 dan contoh soal 4.12`,
  }),
  butir('murabahah-pp', 'dasar', 'pembiayaan syariah', {
    tanya: 'Konsumen membeli sepeda motor melalui perusahaan pembiayaan syariah. Perusahaan menegaskan harga perolehan barang, lalu konsumen membayar harga yang lebih tinggi sebagai laba yang disepakati. Akad yang digunakan adalah ...',
    jawab: 'Murabahah',
    salah: [
      ['Ijarah', 'Ijarah adalah akad pemanfaatan atau sewa jasa dan manfaat.'],
      ['Mudharabah', 'Mudharabah adalah kerja sama pemilik dana dan pengelola dengan pembagian keuntungan.'],
      ['Musyarakah', 'Musyarakah adalah kerja sama penyertaan modal dari para pihak.'],
      ['Wadiah', 'Wadiah adalah akad titipan.'],
    ],
    konsep: 'Akad pembiayaan jual beli syariah', kunci: 'harga perolehan, laba disepakati',
    alasan: 'Murabahah adalah jual beli barang dengan menegaskan harga perolehan kepada pembeli, dan pembeli membayar dengan harga lebih (margin) sebagai laba sesuai kesepakatan.',
    cepat: 'Harga beli dijelaskan + margin → murabahah.',
    sumber: `${S.bsc}, Bab VI (hlm. 85–88); ${S.ebPp}, §3.1.5`,
  }),
  butir('imbt', 'menengah', 'pembiayaan syariah', {
    tanya: 'Dalam pembiayaan syariah, akad berbasis sewa yang memindahkan hak guna atas barang untuk jangka waktu tertentu dan disertai janji pemindahan kepemilikan setelah masa sewa selesai disebut ...',
    jawab: 'Ijarah muntahiya bittamlik',
    salah: [
      ['Mudharabah dengan nisbah bagi hasil', 'Mudharabah adalah kerja sama dengan pembagian keuntungan, bukan sewa.'],
      ['Musyarakah', 'Musyarakah adalah kerja sama penyertaan modal para pihak.'],
      ['Wadiah', 'Wadiah adalah akad titipan.'],
      ['Murabahah dengan margin tetap', 'Murabahah adalah jual beli dengan margin, bukan sewa dengan janji pemindahan kepemilikan.'],
    ],
    konsep: 'Akad pembiayaan syariah berbasis sewa', kunci: 'sewa, janji pemindahan kepemilikan',
    alasan: 'IMBT adalah akad berbasis jasa (sewa) dengan pembayaran sewa yang disertai janji (wa\'d) pemindahan kepemilikan setelah masa ijarah selesai.',
    cepat: 'Sewa + janji milik di akhir → IMBT.',
    sumber: `${S.bsc}, Bab VI (hlm. 89)`,
  }),
  butir('sumber-dana', 'menengah', 'pendanaan', {
    tanya: 'Perusahaan pembiayaan dilarang menarik atau menghimpun dana dari masyarakat. Karena itu, sumber pendanaannya sebagian besar berasal dari ...',
    jawab: 'Pinjaman bank dan/atau penerbitan obligasi',
    salah: [
      ['Tabungan dan giro yang dihimpun dari masyarakat umum', 'Menghimpun tabungan dan giro justru dilarang bagi perusahaan pembiayaan.'],
      ['Deposito nasabah perorangan', 'Deposito adalah simpanan bank.'],
      ['Premi asuransi tertanggung', 'Premi adalah sumber dana perusahaan asuransi.'],
      ['Iuran peserta dana pensiun', 'Iuran adalah sumber dana program pensiun.'],
    ],
    konsep: 'Sumber pendanaan perusahaan pembiayaan', kunci: 'dilarang menghimpun dana masyarakat',
    alasan: 'Karena dilarang menghimpun dana masyarakat, perusahaan pembiayaan terutama mengandalkan pinjaman bank dan/atau penerbitan obligasi, sehingga kekuatan permodalan menjadi penting.',
    cepat: 'Bukan bank → tidak ada simpanan; dana dari pinjaman dan obligasi.',
    sumber: `${S.buku5}, Bab 3 (hlm. 63)`,
  }),
  butir('biaya-kecuali', 'menengah', 'hak konsumen', {
    tanya: 'Biaya yang lazim dikenakan dalam produk pembiayaan antara lain sebagai berikut, KECUALI ...',
    jawab: 'Premi penjaminan simpanan LPS',
    salah: [
      ['Biaya administrasi', ALASAN_BIAYA],
      ['Biaya fidusia', ALASAN_BIAYA],
      ['Biaya provisi', ALASAN_BIAYA],
      ['Biaya premi asuransi', ALASAN_BIAYA],
      ['Biaya notaris', ALASAN_BIAYA],
      ['Biaya eksekusi barang jaminan', ALASAN_BIAYA],
    ],
    konsep: 'Komponen biaya produk pembiayaan', kunci: 'KECUALI, biaya pembiayaan',
    alasan: 'Biaya produk pembiayaan meliputi biaya administrasi, fidusia, notaris, provisi, premi asuransi, eksekusi barang jaminan, pembayaran angsuran, serta penyimpanan dan pemeliharaan barang jaminan; premi penjaminan LPS berkaitan dengan simpanan bank.',
    cepat: 'Cari biaya yang bukan milik transaksi pembiayaan.',
    sumber: `${S.bsc}, Bab VI (hlm. 93)`,
  }),
  butir('hak-pernyataan', 'menantang', 'hak konsumen', {
    tanya: 'Perhatikan pernyataan tentang konsumen jasa pembiayaan berikut:\n(1) konsumen berhak memperoleh rincian seluruh biaya, sanksi, atau denda;\n(2) konsumen tidak wajib memelihara barang yang dibiayai selama masa angsuran;\n(3) konsumen berhak atas pelindungan kerahasiaan data pribadinya;\n(4) konsumen berhak memperoleh informasi produk yang lengkap, akurat, dan jelas.\nSeluruh pernyataan yang benar adalah ...',
    jawab: '(1), (3), dan (4)',
    salah: [
      ['(1), (2), dan (3)', 'Pernyataan (2) salah: memelihara barang yang dibiayai sampai angsuran selesai termasuk kewajiban konsumen.'],
      ['(2) dan (3)', 'Pernyataan (2) salah.'],
      ['(2) dan (4)', 'Pernyataan (2) salah.'],
      ['(1), (2), dan (4)', 'Pernyataan (2) salah.'],
      ['(3) dan (4)', 'Belum lengkap: pernyataan (1) juga benar karena konsumen berhak atas rincian seluruh biaya, sanksi, atau denda.'],
    ],
    konsep: 'Hak dan kewajiban konsumen jasa pembiayaan', kunci: 'hak konsumen, kewajiban memelihara barang',
    alasan: ['(1), (3), dan (4) benar: hak konsumen antara lain rincian seluruh biaya dan denda, pelindungan kerahasiaan data, serta informasi produk yang lengkap dan jelas.', '(2) salah: memelihara barang yang dibiayai sampai angsuran selesai adalah kewajiban konsumen.'],
    cepat: 'Cari pernyataan yang menghapus kewajiban konsumen.',
    sumber: `${S.bsc}, Bab VI (hlm. 91)`,
  }),
  butir('urutan-analisis', 'menengah', 'hak konsumen', {
    tanya: 'Dalam menilai kasus pembiayaan konsumen, urutan analisis yang paling runtut adalah ...',
    jawab: 'Izin kegiatan, kecocokan produk, transparansi kontrak, risiko, hak konsumen',
    salah: [
      ['Hak konsumen, risiko, transparansi kontrak, izin kegiatan, kecocokan produk', 'Izin kegiatan diperiksa paling awal, sebelum produk dan kontraknya.'],
      ['Risiko, izin kegiatan, hak konsumen, kecocokan produk, transparansi kontrak', 'Risiko dinilai setelah izin, produk, dan kontraknya jelas.'],
      ['Transparansi kontrak, kecocokan produk, izin kegiatan, hak konsumen, risiko', 'Kontrak baru dinilai setelah izin dan kecocokan produk.'],
      ['Kecocokan produk, hak konsumen, izin kegiatan, risiko, transparansi kontrak', 'Produk dinilai setelah izin kegiatan dipastikan.'],
    ],
    konsep: 'Urutan analisis pembiayaan', kunci: 'izin kegiatan lebih dahulu',
    alasan: 'Analisis dimulai dari izin kegiatan, lalu kecocokan produk, transparansi kontrak, risiko, dan terakhir hak konsumen.',
    cepat: 'Mulai dari izin, akhiri dengan hak konsumen.',
    sumber: `${S.ebPp}, §3.1.15`,
  }),
  butir('tertulis-kecuali', 'menengah', 'hak konsumen', {
    tanya: 'Sebelum menyetujui perjanjian pembiayaan, konsumen perlu mengonfirmasi hal berikut secara tertulis, KECUALI ...',
    jawab: 'Daftar nasabah lain yang memakai perusahaan itu',
    salah: [
      ['Total kewajiban dan tanggal jatuh tempo', 'Keduanya perlu dikonfirmasi tertulis, jadi bukan jawaban.'],
      ['Sanksi keterlambatan pembayaran', 'Sanksi keterlambatan perlu dikonfirmasi tertulis, jadi bukan jawaban.'],
      ['Ketentuan pelunasan dipercepat', 'Ketentuan pelunasan dipercepat perlu dikonfirmasi tertulis, jadi bukan jawaban.'],
      ['Agunan dan mekanisme pengaduan', 'Agunan dan mekanisme pengaduan perlu dikonfirmasi tertulis, jadi bukan jawaban.'],
    ],
    konsep: 'Hal yang dikonfirmasi tertulis', kunci: 'KECUALI',
    alasan: 'Yang perlu dikonfirmasi adalah harga, uang muka, biaya, bunga atau margin, total kewajiban, jatuh tempo, sanksi, pelunasan dipercepat, agunan, dan pengaduan; data nasabah lain tidak termasuk.',
    cepat: 'Cari hal yang tidak menyangkut kontrak konsumen sendiri.',
    sumber: `${S.ebPp}, §3.1.4`,
  }),
  butir('direktori-statistik', 'menengah', 'legalitas', {
    tanya: 'Untuk memastikan apakah sebuah perusahaan pembiayaan masih berizin, sumber yang paling tepat adalah ...',
    jawab: 'Direktori atau layanan resmi OJK dengan tanggal pembaruan terbaru',
    salah: [
      ['Statistik industri pembiayaan pada suatu periode', 'Statistik menggambarkan industri secara agregat, bukan izin satu perusahaan.'],
      ['Logo OJK pada brosur pemasaran perusahaan', 'Logo di materi pemasaran bukan bukti izin.'],
      ['Daftar jaringan kantor dari beberapa tahun lalu', 'Daftar lama adalah potret historis, bukan bukti izin terkini.'],
      ['Kerja sama perusahaan dengan dealer kendaraan', 'Kerja sama dengan dealer tidak identik dengan izin usaha.'],
    ],
    konsep: 'Direktori dan statistik', kunci: 'masih berizin',
    alasan: 'Direktori atau layanan OJK bertanggal terbaru dipakai untuk memeriksa status izin; statistik hanya memberi gambaran industri.',
    cepat: 'Status izin → direktori; gambaran industri → statistik.',
    sumber: `${S.ebPp}, §3.1.14 dan §3.1.22`,
  }),
  butir('risiko-reputasi', 'dasar', 'risiko', {
    tanya: 'Keluhan konsumen ditangani buruk sehingga kepercayaan masyarakat kepada perusahaan pembiayaan menurun. Risiko yang paling tepat menggambarkan keadaan itu adalah ...',
    jawab: 'Risiko reputasi',
    salah: [
      ['Risiko kredit', 'Risiko kredit terjadi ketika penerima pembiayaan gagal memenuhi kewajiban.'],
      ['Risiko operasional', 'Risiko operasional berasal dari kegagalan prosedur atau sistem.'],
      ['Risiko hukum', 'Risiko hukum berasal dari ketidaksesuaian kontrak dan pelaksanaannya.'],
      ['Risiko pasar', 'Risiko pasar berkaitan dengan perubahan harga, bukan penanganan keluhan.'],
    ],
    konsep: 'Jenis risiko perusahaan pembiayaan', kunci: 'pengaduan ditangani buruk',
    alasan: 'Risiko reputasi dapat muncul dari penanganan pengaduan yang buruk.',
    cepat: 'Pengaduan buruk → reputasi.',
    sumber: `${S.ebPp}, §3.1.23`,
  }),
  butir('risiko-hukum', 'dasar', 'risiko', {
    tanya: 'Pelaksanaan pembiayaan di lapangan tidak sesuai dengan isi kontrak yang ditandatangani. Risiko yang paling langsung muncul adalah ...',
    jawab: 'Risiko hukum',
    salah: [
      ['Risiko kredit', 'Risiko kredit terjadi ketika penerima pembiayaan gagal memenuhi kewajiban.'],
      ['Risiko operasional', 'Risiko operasional berasal dari kegagalan prosedur atau sistem.'],
      ['Risiko reputasi', 'Risiko reputasi muncul dari penanganan pengaduan yang buruk.'],
      ['Risiko likuiditas', 'Risiko likuiditas berkaitan dengan ketersediaan dana, bukan isi kontrak.'],
    ],
    konsep: 'Jenis risiko perusahaan pembiayaan', kunci: 'tidak sesuai kontrak',
    alasan: 'Risiko hukum berasal dari ketidaksesuaian kontrak dan pelaksanaan.',
    cepat: 'Kontrak vs pelaksanaan → hukum.',
    sumber: `${S.ebPp}, §3.1.23`,
  }),
  butir('risiko-kredit', 'dasar', 'risiko', {
    tanya: 'Seorang debitur tidak mampu lagi membayar angsuran sesuai perjanjian. Bagi perusahaan pembiayaan, keadaan ini merupakan ...',
    jawab: 'Risiko kredit',
    salah: [
      ['Risiko operasional', 'Risiko operasional berasal dari kegagalan prosedur atau sistem.'],
      ['Risiko hukum', 'Risiko hukum berasal dari ketidaksesuaian kontrak dan pelaksanaannya.'],
      ['Risiko reputasi', 'Risiko reputasi muncul dari penanganan pengaduan yang buruk.'],
      ['Risiko konsentrasi', 'Risiko konsentrasi berkaitan dengan pembiayaan yang menumpuk pada satu pihak.'],
    ],
    konsep: 'Jenis risiko perusahaan pembiayaan', kunci: 'tidak mampu membayar angsuran',
    alasan: 'Risiko kredit atau pembiayaan terjadi ketika penerima pembiayaan gagal memenuhi kewajiban.',
    cepat: 'Gagal bayar → kredit.',
    sumber: `${S.ebPp}, §3.1.23`,
  }),
  butir('risiko-operasional', 'dasar', 'risiko', {
    tanya: 'Gangguan sistem membuat tagihan angsuran terkirim dua kali kepada konsumen. Risiko yang paling langsung tampak adalah ...',
    jawab: 'Risiko operasional',
    salah: [
      ['Risiko kredit', 'Risiko kredit terjadi ketika penerima pembiayaan gagal memenuhi kewajiban.'],
      ['Risiko hukum', 'Risiko hukum berasal dari ketidaksesuaian kontrak dan pelaksanaannya.'],
      ['Risiko pasar', 'Risiko pasar berkaitan dengan perubahan harga.'],
      ['Risiko konsentrasi', 'Risiko konsentrasi berkaitan dengan pembiayaan yang menumpuk pada satu pihak.'],
    ],
    konsep: 'Jenis risiko perusahaan pembiayaan', kunci: 'gangguan sistem',
    alasan: 'Risiko operasional dapat berasal dari kegagalan prosedur atau sistem.',
    cepat: 'Prosedur/sistem gagal → operasional.',
    sumber: `${S.ebPp}, §3.1.23`,
  }),
  butir('jual-beli-syariah', 'menengah', 'pembiayaan syariah', {
    tanya: 'Perusahaan pembiayaan syariah menyediakan mesin jahit bagi konsumen dengan harga dan margin yang diperjanjikan. Jenis pembiayaan syariah ini adalah ...',
    jawab: 'Pembiayaan jual beli',
    salah: [
      ['Pembiayaan investasi bagi hasil', 'Pembiayaan investasi memberi modal usaha produktif dengan pembagian keuntungan.'],
      ['Pembiayaan jasa', 'Pembiayaan jasa menyediakan manfaat barang atau pelayanan dengan atau tanpa imbal jasa.'],
      ['Pembiayaan multiguna konvensional', 'Akadnya jual beli syariah, bukan pembiayaan konvensional.'],
      ['Pembiayaan infrastruktur', 'Pembiayaan infrastruktur ditujukan untuk proyek seperti jalan dan energi.'],
    ],
    konsep: 'Jenis pembiayaan syariah', kunci: 'harga dan margin diperjanjikan',
    alasan: 'Pada pembiayaan jual beli, barang disediakan melalui jual beli dengan harga dan margin yang diperjanjikan.',
    cepat: 'Harga + margin → jual beli; bagi keuntungan → investasi; manfaat/pelayanan → jasa.',
    sumber: `${S.ebPp}, §3.1.11 dan §3.1.18`,
  }),
  butir('jasa-syariah', 'menengah', 'pembiayaan syariah', {
    tanya: 'Perusahaan pembiayaan syariah membiayai layanan pendidikan konsumen sebesar Rp12 juta dengan biaya jasa yang disepakati. Jenis pembiayaan syariah ini adalah ...',
    jawab: 'Pembiayaan jasa',
    salah: [
      ['Pembiayaan jual beli', 'Pembiayaan jual beli menyediakan barang dengan harga dan margin yang diperjanjikan.'],
      ['Pembiayaan investasi bagi hasil', 'Pembiayaan investasi memberi modal usaha produktif dengan pembagian keuntungan.'],
      ['Pembiayaan modal kerja', 'Modal kerja membiayai pengeluaran dalam satu siklus usaha, bukan layanan pendidikan.'],
      ['Pembiayaan multijasa bank syariah', 'Multijasa adalah produk bank syariah, sedangkan kasus ini dilakukan perusahaan pembiayaan.'],
    ],
    konsep: 'Jenis pembiayaan syariah', kunci: 'layanan, biaya jasa disepakati',
    alasan: 'Penyediaan manfaat atau layanan dengan imbal jasa yang disepakati termasuk pembiayaan jasa.',
    cepat: 'Layanan + imbal jasa → pembiayaan jasa.',
    sumber: `${S.ebPp}, §3.1.11 dan §3.1.18`,
  }),
  butir('uus-pp', 'dasar', 'pembiayaan syariah', {
    tanya: 'Unit Usaha Syariah (UUS) pada perusahaan pembiayaan adalah ...',
    jawab: 'Bagian organisasi perusahaan pembiayaan yang menjalankan kegiatan syariah',
    salah: [
      ['Bank syariah baru yang berdiri sendiri', 'UUS bukan bank dan tidak berdiri sendiri.'],
      ['Perusahaan pembiayaan syariah penuh yang berdiri sendiri', 'Perusahaan pembiayaan syariah menjalankan seluruh usahanya berdasarkan prinsip syariah sebagai perusahaan tersendiri.'],
      ['Perusahaan pergadaian syariah', 'Pergadaian syariah adalah jenis lembaga lain.'],
      ['Nasabah penyimpan dana syariah', 'UUS adalah unit kerja, bukan nasabah.'],
    ],
    konsep: 'Perusahaan pembiayaan syariah dan UUS', kunci: 'UUS perusahaan pembiayaan',
    alasan: 'UUS menjalankan pembiayaan syariah sebagai unit kerja di perusahaan pembiayaan, sedangkan perusahaan pembiayaan syariah menjalankan seluruh kegiatan usahanya berdasarkan prinsip syariah.',
    cepat: 'Unit di dalam perusahaan induk → UUS.',
    sumber: `${S.ebPp}, §3.1.11, §3.1.18, contoh soal 4.25`,
  }),
  butir('cicilan-kecil', 'menengah', 'biaya total', {
    tanya: 'Dua penawaran pembiayaan untuk barang dan uang muka yang sama memiliki cicilan bulanan berbeda. Kesimpulan yang paling tepat adalah ...',
    jawab: 'Penawaran dibandingkan dari total pembayaran, bukan cicilan bulanan.',
    salah: [
      ['Penawaran dengan cicilan lebih kecil memiliki total pembayaran lebih murah.', 'Tenor yang lebih panjang atau biaya awal dapat membuat total pembayaran lebih besar.'],
      ['Penawaran baru dapat dibandingkan setelah tenornya disamakan.', 'Tenor tidak perlu disamakan; total pembayaran dihitung dari cicilan × tenor ditambah biaya lain.'],
      ['Penawaran dibandingkan dari besar cicilan bulanannya.', 'Perbandingan harus memakai total pembayaran, bukan hanya cicilan bulanan.'],
      ['Penawaran dengan tenor lebih panjang lebih murah secara total.', 'Tenor lebih panjang sering justru menambah total pembayaran.'],
    ],
    konsep: 'Membandingkan penawaran dengan total pembayaran', kunci: 'cicilan bulanan berbeda',
    alasan: 'Istilah "cicilan ringan" tidak otomatis berarti biaya total paling rendah; perbandingan memakai total pembayaran, lalu disesuaikan dengan arus kas.',
    cepat: 'Bandingkan total (cicilan × tenor + biaya), bukan cicilan saja.',
    sumber: `${S.ebPp}, §3.1.2, §3.1.7, §3.1.20`,
  }),
  butir('pojk-pp', 'menengah', 'regulasi', {
    tanya: 'Ketentuan OJK yang mengatur pengembangan dan penguatan perusahaan pembiayaan adalah ...',
    jawab: 'POJK 46/2024 jo. POJK 35/2025',
    salah: [
      ['POJK 39/2024 jo. POJK 29/2025', 'Keduanya mengatur pergadaian.'],
      ['POJK 41 Tahun 2024', 'POJK 41/2024 mengatur lembaga keuangan mikro.'],
      ['POJK 40 Tahun 2024', 'POJK 40/2024 mengatur LPBBTI (pinjaman daring).'],
      ['POJK 22 Tahun 2023', 'POJK 22/2023 mengatur pelindungan konsumen dan masyarakat.'],
    ],
    konsep: 'Regulasi perusahaan pembiayaan', kunci: 'pengembangan dan penguatan perusahaan pembiayaan',
    alasan: 'POJK 46 Tahun 2024 mengatur pengembangan dan penguatan perusahaan pembiayaan (juga PPI dan PMV) dan diubah dengan POJK 35 Tahun 2025.',
    cepat: 'PP/PPI/PMV → POJK 46/2024 jo. 35/2025.',
    sumber: `${S.ebPp}, §3.1.6; ${S.ebMv}, §3.1.1 C`, berlaku: POJK_PP_BARU,
  }),
]);

// ---------------------------------------------------------------- hitung

const bungaFlat = (pokok: number, bunga: number, bulan: number) => (pokok * bunga * bulan) / 1200;

const tPokok: TemplateHitung = {
  id: 'pokok-dp', tingkat: 'dasar', topik: 'pokok pembiayaan',
  sumber: `${S.ebPp}, §3.1.3 dan contoh soal 4.4`,
  parameter: kombinasi({ harga: [15e6, 18e6, 20e6, 24e6, 30e6, 36e6], dp: [10, 15, 20, 25, 30] }, (p) => bulat((p.harga * p.dp) / 100)).map((p) => ({ harga: p.harga, uangMuka: (p.harga * p.dp) / 100 })),
  pertanyaan: (p) => `Harga sebuah barang ${rp(p.harga)} dan konsumen membayar uang muka ${rp(p.uangMuka)}. Pokok pembiayaan sebelum bunga dan biaya lain adalah ...`,
  hitung: (p) => p.harga - p.uangMuka,
  pengecoh: (p) => [
    { nilai: p.harga, alasan: 'Itu harga barang; uang muka belum dikurangkan.' },
    { nilai: p.uangMuka, alasan: 'Itu besarnya uang muka, bukan pokok yang dibiayai.' },
    { nilai: p.harga + p.uangMuka, alasan: 'Uang muka justru ditambahkan, padahal seharusnya dikurangkan.' },
    { nilai: p.harga - 2 * p.uangMuka, alasan: 'Uang muka terkurangi dua kali.' },
  ],
  konsep: 'Pokok pembiayaan = harga − uang muka', kataKunci: 'harga barang, uang muka',
  alasan: (p) => [`Pokok pembiayaan = ${rp(p.harga)} − ${rp(p.uangMuka)} = ${rp(p.harga - p.uangMuka)}.`],
  caraCepat: 'Harga − DP.',
};

const tFlat: TemplateHitung = {
  id: 'flat-angsuran', tingkat: 'menengah', topik: 'bunga flat',
  sumber: `${S.ebPp}, §3.1.3, §3.1.20, contoh soal 4.5`,
  parameter: kombinasi({ pokok: [12e6, 15e6, 18e6, 24e6, 30e6, 36e6], bunga: [8, 10, 12], bulan: [12, 24, 36] }, (p) => bulat(p.pokok / p.bulan) && bulat((p.pokok * p.bunga) / 1200)),
  pertanyaan: (p) => `Pokok pembiayaan kendaraan ${rp(p.pokok)} dikenai bunga flat ${p.bunga}% per tahun dengan tenor ${p.bulan} bulan, tanpa biaya lain. Angsuran per bulan adalah ...`,
  hitung: (p) => (p.pokok + bungaFlat(p.pokok, p.bunga, p.bulan)) / p.bulan,
  pengecoh: (p) => {
    const b = bungaFlat(p.pokok, p.bunga, p.bulan);
    return [
      { nilai: p.pokok / p.bulan, alasan: 'Bunga belum dimasukkan; itu hanya pokok dibagi tenor.' },
      { nilai: (p.pokok + (p.pokok * p.bunga) / 100) / p.bulan, alasan: 'Bunga hanya dihitung satu tahun, padahal tenornya lebih panjang.' },
      { nilai: (p.pokok + b) / 12, alasan: 'Total kewajiban dibagi 12, bukan dibagi jumlah bulan tenor.' },
      { nilai: p.pokok / p.bulan + (p.pokok * p.bunga) / 100, alasan: 'Bunga setahun penuh ditambahkan ke setiap angsuran.' },
      { nilai: b / p.bulan, alasan: 'Itu hanya porsi bunga per bulan.' },
      { nilai: (p.pokok + 2 * b) / p.bulan, alasan: 'Bunga terhitung dua kali.' },
    ];
  },
  konsep: 'Angsuran bunga flat ilustratif', kataKunci: 'bunga flat, tenor',
  alasan: (p) => {
    const b = bungaFlat(p.pokok, p.bunga, p.bulan);
    return [`Bunga total = ${rp(p.pokok)} × ${p.bunga}% × ${p.bulan}/12 = ${rp(b)}.`, `Angsuran = (${rp(p.pokok)} + ${rp(b)}) ÷ ${p.bulan} = ${rp((p.pokok + b) / p.bulan)}.`];
  },
  caraCepat: 'Tambahkan bunga seluruh tenor ke pokok, lalu bagi jumlah bulan.',
};

const tDuaLangkah: TemplateHitung = {
  id: 'dp-flat-angsuran', tingkat: 'menantang', topik: 'bunga flat',
  sumber: `${S.ebPp}, §3.1.3 (ilustrasi harga Rp20 juta, uang muka Rp5 juta)`,
  parameter: kombinasi({ harga: [20e6, 24e6, 30e6, 36e6, 40e6], dp: [20, 25], bunga: [10, 12], bulan: [12, 24] }, (p) => {
    const pokok = p.harga - (p.harga * p.dp) / 100;
    return bulat((pokok + bungaFlat(pokok, p.bunga, p.bulan)) / p.bulan) && bulat((p.harga + bungaFlat(p.harga, p.bunga, p.bulan)) / p.bulan);
  }).map((p) => ({ harga: p.harga, uangMuka: (p.harga * p.dp) / 100, bunga: p.bunga, bulan: p.bulan })),
  pertanyaan: (p) => `Harga sebuah barang ${rp(p.harga)} dengan uang muka ${rp(p.uangMuka)}. Sisa harga dibiayai dengan bunga flat ${p.bunga}% per tahun selama ${p.bulan} bulan, tanpa biaya lain. Angsuran per bulan adalah ...`,
  hitung: (p) => {
    const pokok = p.harga - p.uangMuka;
    return (pokok + bungaFlat(pokok, p.bunga, p.bulan)) / p.bulan;
  },
  pengecoh: (p) => {
    const pokok = p.harga - p.uangMuka;
    return [
      { nilai: (p.harga + bungaFlat(p.harga, p.bunga, p.bulan)) / p.bulan, alasan: 'Uang muka tidak dikurangkan; pokok dan bunga dihitung dari harga barang.' },
      { nilai: pokok / p.bulan, alasan: 'Bunga belum dimasukkan.' },
      { nilai: (pokok + bungaFlat(p.harga, p.bunga, p.bulan)) / p.bulan, alasan: 'Bunga dihitung dari harga barang, padahal seharusnya dari pokok setelah uang muka.' },
      { nilai: (pokok + (pokok * p.bunga) / 100) / p.bulan, alasan: 'Bunga hanya dihitung satu tahun.' },
      { nilai: (pokok + bungaFlat(pokok, p.bunga, p.bulan)) / 12, alasan: 'Total kewajiban dibagi 12, bukan jumlah bulan tenor.' },
      { nilai: (pokok + 2 * bungaFlat(pokok, p.bunga, p.bulan)) / p.bulan, alasan: 'Bunga terhitung dua kali.' },
      { nilai: bungaFlat(pokok, p.bunga, p.bulan) / p.bulan, alasan: 'Itu hanya porsi bunga per bulan; porsi pokok belum dimasukkan.' },
    ];
  },
  konsep: 'Dua langkah: pokok = harga − uang muka, lalu angsuran bunga flat', kataKunci: 'uang muka, bunga flat',
  alasan: (p) => {
    const pokok = p.harga - p.uangMuka;
    const b = bungaFlat(pokok, p.bunga, p.bulan);
    return [`Pokok = ${rp(p.harga)} − ${rp(p.uangMuka)} = ${rp(pokok)}.`, `Bunga = ${rp(pokok)} × ${p.bunga}% × ${p.bulan}/12 = ${rp(b)}.`, `Angsuran = (${rp(pokok)} + ${rp(b)}) ÷ ${p.bulan} = ${rp((pokok + b) / p.bulan)}.`];
  },
  caraCepat: 'Kurangi uang muka dulu, baru hitung bunga dari pokok.',
};

const tSelisihTenor: TemplateHitung = {
  id: 'selisih-total-tenor', tingkat: 'menengah', topik: 'biaya total',
  sumber: `${S.ebPp}, §3.1.7 dan contoh soal 4.9`,
  parameter: kombinasi({ a: [1.5e6, 1.8e6, 2e6], b: [1.1e6, 1.2e6, 1.3e6], nb: [18, 24] }, (p) => p.b * p.nb > p.a * 12),
  pertanyaan: (p) => `Untuk barang dan uang muka yang sama, penawaran A mengenakan angsuran ${rp(p.a)} per bulan selama 12 bulan, sedangkan penawaran B ${rp(p.b)} per bulan selama ${p.nb} bulan, tanpa biaya lain. Penawaran B lebih mahal secara total sebesar ...`,
  hitung: (p) => p.b * p.nb - p.a * 12,
  pengecoh: (p) => [
    { nilai: p.a - p.b, alasan: 'Itu selisih angsuran per bulan, bukan selisih total.' },
    { nilai: (p.a - p.b) * 12, alasan: 'Selisih angsuran dikalikan 12 bulan tidak memperhitungkan tenor B yang lebih panjang.' },
    { nilai: (p.a - p.b) * p.nb, alasan: 'Selisih angsuran dikalikan tenor B tidak sama dengan selisih total.' },
    { nilai: p.a * 12, alasan: 'Itu total pembayaran A.' },
    { nilai: p.b * p.nb, alasan: 'Itu total pembayaran B.' },
  ],
  konsep: 'Membandingkan penawaran dengan total pembayaran', kataKunci: 'cicilan lebih kecil, tenor lebih panjang',
  alasan: (p) => [`Total A = ${rp(p.a)} × 12 = ${rp(p.a * 12)}; total B = ${rp(p.b)} × ${p.nb} = ${rp(p.b * p.nb)}.`, `Selisih = ${rp(p.b * p.nb - p.a * 12)}: cicilan B lebih kecil, tetapi totalnya lebih besar.`],
  caraCepat: 'Kalikan cicilan × tenor masing-masing, lalu kurangkan.',
};

const tBiayaAwal: TemplateHitung = {
  id: 'selisih-biaya-awal', tingkat: 'menantang', topik: 'biaya total',
  sumber: `${S.ebPp}, §3.1.20 dan contoh soal 4.21`,
  parameter: kombinasi({ c1: [2e6, 2.24e6, 2.5e6], d: [40e3, 50e3, 60e3], biaya: [1e6, 1.5e6] }),
  pertanyaan: (p) => `Penawaran A mengenakan angsuran ${rp(p.c1)} per bulan selama 12 bulan tanpa biaya awal. Penawaran B mengenakan angsuran ${rp(p.c1 - p.d)} per bulan selama 12 bulan dengan biaya awal ${rp(p.biaya)}. Penawaran B lebih mahal secara total sebesar ...`,
  hitung: (p) => p.biaya - p.d * 12,
  pengecoh: (p) => [
    { nilai: p.d * 12, alasan: 'Itu penghematan cicilan B selama 12 bulan; biaya awal belum diperhitungkan.' },
    { nilai: p.biaya, alasan: 'Itu biaya awal saja; penghematan cicilan belum diperhitungkan.' },
    { nilai: p.biaya + p.d * 12, alasan: 'Penghematan cicilan justru ditambahkan ke biaya awal.' },
    { nilai: p.d, alasan: 'Itu selisih angsuran per bulan.' },
  ],
  konsep: 'Total pembayaran memasukkan biaya awal', kataKunci: 'biaya awal, cicilan lebih kecil',
  alasan: (p) => [`Total A = ${rp(p.c1)} × 12 = ${rp(p.c1 * 12)}.`, `Total B = ${rp(p.c1 - p.d)} × 12 + ${rp(p.biaya)} = ${rp((p.c1 - p.d) * 12 + p.biaya)}.`, `B lebih mahal ${rp(p.biaya - p.d * 12)}.`],
  caraCepat: 'Selisih = biaya awal − (selisih cicilan × tenor).',
};

const tRasioCicilan: TemplateHitung = {
  id: 'rasio-cicilan', tingkat: 'dasar', topik: 'kemampuan bayar',
  sumber: `${S.ebPp}, §3.1.19 dan contoh soal 4.26`,
  parameter: kombinasi({ gaji: [6e6, 8e6, 10e6, 12e6, 15e6], lama: [10, 15, 20], baru: [20, 25, 30, 40, 50] }, (p) => bulat((p.gaji * p.lama) / 100) && bulat((p.gaji * p.baru) / 100)).map((p) => ({ gaji: p.gaji, lama: (p.gaji * p.lama) / 100, baru: (p.gaji * p.baru) / 100 })),
  pertanyaan: (p) => `Penghasilan bersih seseorang ${rp(p.gaji)} per bulan. Ia sudah memiliki cicilan ${rp(p.lama)} per bulan dan mengajukan pembiayaan baru dengan cicilan ${rp(p.baru)} per bulan. Total cicilan terhadap penghasilan bersihnya menjadi ...`,
  hitung: (p) => ((p.lama + p.baru) / p.gaji) * 100,
  format: persen2,
  pengecoh: (p) => [
    { nilai: (p.baru / p.gaji) * 100, alasan: 'Cicilan lama belum dijumlahkan.' },
    { nilai: (p.lama / p.gaji) * 100, alasan: 'Hanya cicilan lama yang dihitung.' },
    { nilai: ((p.baru - p.lama) / p.gaji) * 100, alasan: 'Cicilan lama dikurangkan, padahal seharusnya dijumlahkan.' },
    { nilai: (p.gaji / (p.lama + p.baru)) * 100, alasan: 'Pembilang dan penyebut terbalik.' },
    { nilai: ((p.lama + p.baru) / (p.gaji - p.lama)) * 100, alasan: 'Penghasilan dikurangi cicilan lama lebih dulu, padahal pembaginya penghasilan bersih seluruhnya.' },
  ],
  konsep: 'Rasio cicilan terhadap penghasilan bersih', kataKunci: 'cicilan lama, cicilan baru, penghasilan bersih',
  alasan: (p) => [`Rasio = (${rp(p.lama)} + ${rp(p.baru)}) ÷ ${rp(p.gaji)} × 100% = ${persen2(((p.lama + p.baru) / p.gaji) * 100)}.`, 'Angka ini menjadi sinyal ruang anggaran untuk kebutuhan pokok, walaupun penilaian akhir memerlukan informasi lengkap.'],
  caraCepat: 'Jumlahkan semua cicilan, bagi penghasilan bersih.',
};

const tEfektif: TemplateHitung = {
  id: 'efektif-bulan-2', tingkat: 'menantang', topik: 'bunga efektif',
  sumber: `${S.ebPp}, §3.1.3 dan §3.1.20; ${S.bsc}, Bab VI (hlm. 90)`,
  parameter: kombinasi({ pokok: [12e6, 24e6, 36e6], bunga: [12, 18, 24] }, (p) => bulat(((p.pokok - p.pokok / 12) * p.bunga) / 1200)),
  pertanyaan: (p) => `Pembiayaan ${rp(p.pokok)} memakai bunga efektif ${p.bunga}% per tahun dengan tenor 12 bulan. Angsuran pokok tetap ${rp(p.pokok / 12)} setiap bulan, sedangkan bunga bulanan ${String(p.bunga / 12).replace('.', ',')}% (${p.bunga}% ÷ 12) dihitung atas sisa pokok awal bulan. Besar bunga pada bulan ke-2 adalah ...`,
  hitung: (p) => ((p.pokok - p.pokok / 12) * p.bunga) / 1200,
  pengecoh: (p) => [
    { nilai: (p.pokok * p.bunga) / 1200, alasan: 'Itu bunga bulan pertama (dari pokok awal); setelah angsuran pertama, sisa pokok sudah berkurang.' },
    { nilai: ((p.pokok / 12) * p.bunga) / 1200, alasan: 'Bunga dihitung dari angsuran pokok, bukan dari sisa pokok.' },
    { nilai: p.pokok / 12 + ((p.pokok - p.pokok / 12) * p.bunga) / 1200, alasan: 'Itu total angsuran bulan ke-2 (pokok + bunga), bukan bunganya saja.' },
    { nilai: (p.pokok * p.bunga) / 100, alasan: 'Itu bunga setahun dari pokok awal.' },
    { nilai: ((p.pokok - (2 * p.pokok) / 12) * p.bunga) / 1200, alasan: 'Itu bunga bulan ke-3.' },
  ],
  konsep: 'Bunga efektif menurun mengikuti sisa pokok', kataKunci: 'sisa pokok, bulan ke-2',
  alasan: (p) => [`Sisa pokok setelah angsuran pertama = ${rp(p.pokok)} − ${rp(p.pokok / 12)} = ${rp(p.pokok - p.pokok / 12)}.`, `Bunga bulan ke-2 = ${rp(p.pokok - p.pokok / 12)} × ${p.bunga}%/12 = ${rp(((p.pokok - p.pokok / 12) * p.bunga) / 1200)}.`],
  caraCepat: 'Kurangi pokok yang sudah dibayar, lalu kalikan bunga per bulan.',
};

export const ppHitung = familyHitung({
  id: 'PSJK-PP-HITUNG', versi: 2, nama: 'Hitungan pembiayaan konsumen', chapter: 'perusahaan-pembiayaan', label: 'VARIASI',
  sumber: `${S.ebPp}; ${S.bsc}`,
  ringkas: 'Pokok = harga − uang muka, angsuran bunga flat (satu dan dua langkah), perbandingan total dua penawaran (tenor berbeda atau biaya awal), rasio cicilan terhadap penghasilan, dan bunga efektif bulan ke-2.',
}, [tPokok, tFlat, tDuaLangkah, tSelisihTenor, tBiayaAwal, tRasioCicilan, tEfektif]);

export const FAMILIES_PERUSAHAAN_PEMBIAYAAN = [ppIstilah, ppKasus, ppHitung];

