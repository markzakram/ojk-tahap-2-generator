import { familyKurasi, familyRelasi, type TabelRelasi } from '../umum';
import { alasanRelasi, baris, butir, kalimatRelasi, SUMBER as S } from './bantu';
import { bulat, familyHitung, kombinasi, persen2, rp, type TemplateHitung } from './hitung';

// Chapter Lembaga Keuangan Mikro (kebutuhan 15). Tiga family:
//   PSJK-LKM-ISTILAH  SHL      relasi dua arah: aspek kesehatan LKM dan istilah LKM
//   PSJK-LKM-KASUS    VARIASI  kegiatan dan larangan, badan hukum, kepemilikan, skala, pelaporan, pengawas, transformasi
//   PSJK-LKM-HITUNG   VARIASI  cicilan, sisa/kekurangan kas, porsi pinjaman terlambat

const POJK_LKM = 'UU 1/2013 jo. UU 4/2023; POJK 41/2024';

const KESEHATAN: TabelRelasi = {
  id: 'kesehatan-lkm',
  topik: 'kesehatan LKM',
  tanyaNilai: (s) => `Dalam menilai kesehatan LKM, aspek ${s} melihat ...`,
  tanyaSubjek: (n) => `Dalam menilai kesehatan LKM, aspek yang melihat ${n} adalah ...`,
  alasanSalah: alasanRelasi('melihat'),
  kalimat: kalimatRelasi('melihat'),
  konsep: 'Kesehatan LKM dinilai dari permodalan dan solvabilitas, kualitas aset, rentabilitas, likuiditas, dan manajemen; berbeda dari kualitas satu pinjaman.',
  caraCepat: 'Modal → permodalan; mutu pinjaman → kualitas aset; laba → rentabilitas; kewajiban segera → likuiditas; pengurus → manajemen.',
  baris: [
    baris('permodalan', 'permodalan dan solvabilitas', 'kecukupan modal untuk menghadapi risiko dan mendukung pemenuhan kewajiban jangka panjang', 'menengah', `${S.ebLkm}, §3.1.3 D`, POJK_LKM),
    baris('aset', 'kualitas aset', 'baik-buruknya aset LKM, termasuk pinjaman atau pembiayaan yang disalurkan', 'menengah', `${S.ebLkm}, §3.1.3 D`, POJK_LKM),
    baris('rentabilitas', 'rentabilitas', 'kemampuan kegiatan LKM menghasilkan laba atau hasil usaha yang memadai', 'menengah', `${S.ebLkm}, §3.1.3 D`, POJK_LKM),
    baris('likuiditas', 'likuiditas', 'ketersediaan dana untuk memenuhi kewajiban yang segera jatuh tempo', 'menengah', `${S.ebLkm}, §3.1.3 D`, POJK_LKM),
    baris('manajemen', 'manajemen', 'cara pengurus mengelola kegiatan, risiko, dan kepatuhan', 'menengah', `${S.ebLkm}, §3.1.3 D`, POJK_LKM),
  ],
};

const ISTILAH: TabelRelasi = {
  id: 'istilah-lkm',
  topik: 'istilah LKM',
  tanyaNilai: (s) => `Dalam materi Lembaga Keuangan Mikro, ${s} adalah ...`,
  tanyaSubjek: (n) => `Dalam materi Lembaga Keuangan Mikro, istilah untuk ${n} adalah ...`,
  alasanSalah: alasanRelasi('adalah'),
  kalimat: kalimatRelasi('adalah'),
  konsep: 'Istilah dasar LKM: Bank Wakaf Mikro, BUM Desa, ekuitas, akad, nisbah, portofolio pinjaman, dan kesulitan likuiditas.',
  caraCepat: 'Kenali kata kunci tiap istilah: program wakaf mikro → BWM; aset − kewajiban → ekuitas; perjanjian syariah → akad; porsi bagi hasil → nisbah.',
  baris: [
    baris('bwm', 'Bank Wakaf Mikro', 'sebutan bagi LKM Syariah dalam program pembiayaan dan pemberdayaan masyarakat', 'menengah', `${S.ebLkm}, §3.1.1 D dan §3.1.4`, 'SEOJK 36/SEOJK.06/2025'),
    baris('bumdes', 'BUM Desa', 'badan usaha milik desa yang dapat menjadi pemegang saham LKM berbentuk PT', 'dasar', `${S.ebLkm}, Istilah Dasar dan §3.1.2`, POJK_LKM),
    baris('ekuitas', 'ekuitas', 'selisih antara aset dan kewajiban lembaga', 'dasar', `${S.ebLkm}, Istilah Dasar`),
    baris('akad', 'akad', 'perjanjian yang menetapkan hak dan kewajiban dalam transaksi syariah', 'dasar', `${S.ebLkm}, Istilah Dasar`),
    baris('nisbah', 'nisbah', 'porsi bagi hasil yang disepakati dalam akad mudharabah', 'dasar', `${S.ebLkm}, §3.1.1 D`),
    baris('portofolio', 'portofolio pinjaman', 'kumpulan seluruh kredit yang disalurkan LKM kepada para nasabahnya', 'menengah', `${S.ebLkm}, §3.1.4 F`),
    baris('kesulitan-likuiditas', 'kesulitan likuiditas', 'kesulitan menyediakan dana untuk memenuhi kewajiban jangka pendek', 'menengah', `${S.ebLkm}, §3.1.3 B`),
  ],
};

export const lkmIstilah = familyRelasi({
  id: 'PSJK-LKM-ISTILAH', nama: 'Kesehatan dan istilah LKM', chapter: 'lembaga-keuangan-mikro', label: 'SHL',
  sumber: S.ebLkm,
  ringkas: 'Relasi dua arah untuk lima aspek kesehatan LKM dan istilah dasar LKM (Bank Wakaf Mikro, BUM Desa, ekuitas, akad, nisbah, portofolio pinjaman, kesulitan likuiditas).',
}, [KESEHATAN, ISTILAH]);

const ALASAN_KEGIATAN = 'Kegiatan ini termasuk kegiatan LKM, jadi bukan jawaban.';
const ALASAN_LARANGAN = 'Kegiatan ini justru dilarang bagi LKM, jadi bukan jawaban.';

export const lkmKasus = familyKurasi({
  id: 'PSJK-LKM-KASUS', nama: 'Kasus lembaga keuangan mikro', chapter: 'lembaga-keuangan-mikro', label: 'VARIASI',
  sumber: S.ebLkm,
  ringkas: 'Kegiatan dan larangan LKM, badan hukum dan kepemilikan saham, modal pendirian per wilayah, skala usaha dan pelaporan, pengawas, transformasi ke BPR/BPRS, Bank Wakaf Mikro, kualitas pinjaman; termasuk "KECUALI".',
}, [
  butir('dua-kebutuhan', 'dasar', 'kegiatan LKM', {
    tanya: 'Seorang pedagang membutuhkan dana untuk membeli bahan baku sekaligus bantuan mencatat penjualan. Layanan LKM yang sesuai dengan kedua kebutuhan itu adalah ...',
    jawab: 'Pembiayaan mikro dan konsultasi usaha',
    salah: [
      ['Giro dan pengiriman uang', 'LKM dilarang menerima giro dan ikut serta dalam lalu lintas pembayaran.'],
      ['Penjaminan kredit dan asuransi sebagai penanggung', 'LKM dilarang bertindak sebagai penjamin dan menjalankan usaha asuransi sebagai penanggung.'],
      ['Simpanan dan penjaminan', 'Penjaminan berada di luar kegiatan LKM, dan simpanan tidak menjawab kebutuhan dana.'],
      ['Konsultasi dan penerimaan giro', 'Penerimaan giro dilarang bagi LKM.'],
    ],
    konsep: 'Tiga kegiatan utama LKM', kunci: 'dana bahan baku, bantuan mencatat',
    alasan: 'Pembiayaan memenuhi kebutuhan dana, sedangkan konsultasi pengembangan usaha membantu pedagang mencatat penjualan.',
    cepat: 'Pisahkan kebutuhan dana dari kebutuhan belajar.',
    sumber: `${S.ebLkm}, §3.1.1 dan contoh soal 4.1`, berlaku: POJK_LKM,
  }),
  butir('kegiatan-kecuali', 'menengah', 'kegiatan LKM', {
    tanya: 'Kegiatan berikut dapat dijalankan Lembaga Keuangan Mikro (LKM) sesuai ketentuan, KECUALI ...',
    jawab: 'Menerima simpanan giro untuk pembayaran',
    salah: [
      ['Menyalurkan pinjaman skala mikro', ALASAN_KEGIATAN],
      ['Mengelola simpanan sesuai ketentuan produk', ALASAN_KEGIATAN],
      ['Memberi konsultasi pengembangan usaha', ALASAN_KEGIATAN],
      ['Menyalurkan pembiayaan dengan akad murabahah', ALASAN_KEGIATAN],
    ],
    konsep: 'Kegiatan dan larangan LKM', kunci: 'KECUALI, giro',
    alasan: 'Tiga kegiatan utama LKM: pinjaman atau pembiayaan skala mikro, pengelolaan simpanan, dan konsultasi pengembangan usaha (LKM Syariah memakai akad seperti murabahah). LKM dilarang menerima giro dan ikut lalu lintas pembayaran.',
    cepat: 'Giro dan lalu lintas pembayaran → di luar LKM.',
    sumber: `${S.ebLkm}, §3.1.1 dan §3.1.3 B`, berlaku: POJK_LKM,
  }),
  butir('larangan-kecuali', 'menantang', 'kegiatan LKM', {
    tanya: 'Kegiatan berikut dilarang bagi LKM, KECUALI ...',
    jawab: 'Mengelola simpanan sesuai ketentuan usahanya',
    salah: [
      ['Menerima simpanan berupa giro', ALASAN_LARANGAN],
      ['Ikut serta dalam lalu lintas pembayaran', ALASAN_LARANGAN],
      ['Melakukan usaha valuta asing', ALASAN_LARANGAN],
      ['Bertindak sebagai penjamin', ALASAN_LARANGAN],
      ['Menjalankan usaha asuransi sebagai penanggung', ALASAN_LARANGAN],
    ],
    konsep: 'Larangan LKM', kunci: 'dilarang, KECUALI',
    alasan: 'LKM dilarang menerima giro, ikut lalu lintas pembayaran, melakukan usaha valuta asing, bertindak sebagai penjamin, dan menjalankan usaha asuransi sebagai penanggung; pengelolaan simpanan justru kegiatan LKM.',
    cepat: 'Hafalkan lima larangan; simpanan biasa tetap boleh.',
    sumber: `${S.ebLkm}, §3.1.3 B dan §3.1.9`, berlaku: POJK_LKM,
  }),
  butir('giro-lkm', 'dasar', 'kegiatan LKM', {
    tanya: 'Sebuah LKM yang mengelola simpanan menawarkan rekening giro untuk transaksi pembayaran nasabah. Penilaian yang tepat atas tawaran itu adalah ...',
    jawab: 'Giro berada di luar kegiatan yang diperbolehkan bagi LKM',
    salah: [
      ['Giro dapat diterima oleh semua LKM', 'LKM dilarang menerima giro.'],
      ['Giro merupakan bentuk konsultasi usaha', 'Giro adalah simpanan untuk pembayaran, bukan konsultasi.'],
      ['Giro wajib ditawarkan kepada pedagang', 'Tidak ada kewajiban tersebut; giro justru dilarang bagi LKM.'],
      ['Giro boleh ditawarkan asalkan nominal setiap transaksinya kecil', 'Larangan menerima giro tidak bergantung pada nominal.'],
    ],
    konsep: 'Batas kegiatan simpanan LKM', kunci: 'rekening giro, LKM',
    alasan: 'LKM yang dapat mengelola simpanan tetap dilarang menerima giro dan ikut serta dalam lalu lintas pembayaran.',
    cepat: 'Periksa jenis simpanan yang disebut.',
    sumber: `${S.ebLkm}, §3.1.3 B dan contoh soal 4.3`, berlaku: POJK_LKM,
  }),
  butir('badan-hukum', 'dasar', 'kelembagaan', {
    tanya: 'Bentuk badan hukum LKM menurut ketentuan yang berlaku adalah ...',
    jawab: 'Koperasi atau perseroan terbatas (PT)',
    salah: [
      ['Perseroan terbatas terbuka yang tercatat di bursa', 'LKM dapat berbentuk koperasi atau PT, tidak terbatas pada PT terbuka.'],
      ['Yayasan atau perkumpulan', 'Bentuk yang diatur adalah koperasi atau PT.'],
      ['Firma atau persekutuan komanditer', 'Bentuk yang diatur adalah koperasi atau PT.'],
      ['Perusahaan umum (Perum) saja', 'Bentuk yang diatur adalah koperasi atau PT.'],
    ],
    konsep: 'Kelembagaan LKM', kunci: 'badan hukum LKM',
    alasan: 'LKM dapat berbentuk koperasi atau perseroan terbatas, dan keduanya wajib memperoleh izin usaha dari OJK.',
    cepat: 'LKM = koperasi atau PT + izin OJK.',
    sumber: `${S.ebLkm}, §3.1.2 dan §3.1.3 A`, berlaku: POJK_LKM,
  }),
  butir('saham-pemda', 'menengah', 'kelembagaan', {
    tanya: 'Pada LKM berbentuk perseroan terbatas, sedikitnya 60% saham wajib dimiliki oleh ...',
    jawab: 'Pemerintah daerah dan/atau BUM Desa',
    salah: [
      ['Warga negara asing', 'Sisa saham hanya dapat dimiliki WNI dan/atau koperasi.'],
      ['Bank umum swasta', 'Ketentuan menyebut pemda kabupaten/kota, pemda provinsi, dan/atau BUM Desa.'],
      ['Satu orang warga negara Indonesia sebagai pendiri', 'Setiap WNI paling banyak memiliki 20% saham.'],
      ['Perusahaan pembiayaan', 'Perusahaan pembiayaan tidak disebut sebagai pemegang saham mayoritas wajib.'],
    ],
    konsep: 'Kepemilikan saham LKM berbentuk PT', kunci: 'sedikitnya 60% saham',
    alasan: 'Pada LKM berbentuk PT, sedikitnya 60% saham wajib dimiliki pemerintah daerah kabupaten/kota, pemerintah daerah provinsi, dan/atau BUM Desa; sisanya dapat dimiliki WNI dan/atau koperasi.',
    cepat: 'Mayoritas 60% → pemda/BUM Desa.',
    sumber: `${S.ebLkm}, §3.1.2`, berlaku: POJK_LKM,
  }),
  butir('wni-20', 'menengah', 'kelembagaan', {
    tanya: 'Pada LKM berbentuk perseroan terbatas, batas kepemilikan saham oleh setiap warga negara Indonesia adalah paling banyak ...',
    jawab: '20%',
    salah: [
      ['60%', '60% adalah porsi minimum yang wajib dimiliki pemda dan/atau BUM Desa.'],
      ['40%', 'Batas per WNI yang ditetapkan adalah 20%.'],
      ['10%', 'Batas per WNI yang ditetapkan adalah 20%.'],
      ['51%', 'Batas per WNI yang ditetapkan adalah 20%.'],
    ],
    konsep: 'Kepemilikan saham LKM berbentuk PT', kunci: 'setiap WNI, paling banyak',
    alasan: 'Sisa saham LKM berbentuk PT dapat dimiliki WNI dan/atau koperasi, dengan batas paling banyak 20% untuk setiap WNI.',
    cepat: 'Per WNI maksimal 20%.',
    sumber: `${S.ebLkm}, §3.1.2`, berlaku: POJK_LKM,
  }),
  butir('modal-kecamatan', 'menengah', 'permodalan', {
    tanya: 'Calon LKM mengajukan izin dengan cakupan wilayah usaha satu kecamatan. Modal pendirian minimum yang harus dipenuhi adalah ...',
    jawab: 'Rp500 juta',
    salah: [
      ['Rp300 juta', 'Rp300 juta adalah batas untuk cakupan desa atau kelurahan.'],
      ['Rp1 miliar', 'Rp1 miliar adalah batas untuk cakupan kabupaten atau kota.'],
      ['Rp100 juta', 'Batas terendah yang ditetapkan adalah Rp300 juta untuk desa/kelurahan.'],
      ['Rp10 miliar', 'Rp10 miliar adalah ambang total aset skala besar, bukan modal pendirian.'],
    ],
    konsep: 'Modal pendirian minimum menurut cakupan wilayah', kunci: 'satu kecamatan',
    alasan: 'Modal pendirian minimum mengikuti cakupan wilayah: Rp300 juta (desa/kelurahan), Rp500 juta (kecamatan), dan Rp1 miliar (kabupaten/kota).',
    cepat: 'Desa 300 juta – kecamatan 500 juta – kabupaten/kota 1 miliar.',
    sumber: `${S.ebLkm}, §3.1.2`, berlaku: POJK_LKM,
  }),
  butir('skala-desa', 'dasar', 'skala usaha', {
    tanya: 'Sebuah LKM beroperasi di satu desa dan memiliki total aset Rp800 juta. Menurut kriteria umum dalam materi, skala usaha yang sesuai adalah ...',
    jawab: 'Skala kecil',
    salah: [
      ['Skala menengah', 'Skala menengah berkaitan dengan cakupan kecamatan dan aset mulai Rp1 miliar hingga kurang dari Rp10 miliar.'],
      ['Skala besar', 'Skala besar berkaitan dengan cakupan kabupaten/kota dan aset Rp10 miliar atau lebih.'],
      ['Ditentukan hanya oleh modal pendirian', 'Modal pendirian diperiksa saat pendirian; skala dibaca dari wilayah dan aset.'],
      ['Ditentukan hanya oleh jumlah nasabah', 'Jumlah nasabah bukan kriteria skala usaha.'],
    ],
    konsep: 'Skala usaha LKM', kunci: 'satu desa, aset Rp800 juta',
    alasan: 'Cakupan desa/kelurahan dan total aset di bawah Rp1 miliar sesuai kriteria umum skala kecil; skala yang berlaku tetap mengikuti penetapan resmi OJK.',
    cepat: 'Baca wilayah dan aset bersamaan.',
    sumber: `${S.ebLkm}, §3.1.2 dan contoh soal 4.2`, berlaku: POJK_LKM,
  }),
  butir('lapor-kecil', 'menengah', 'pelaporan dan pengawasan', {
    tanya: 'Sebuah LKM telah ditetapkan sebagai LKM skala usaha kecil. Laporan keuangan berkalanya disampaikan kepada siapa dan seberapa sering?',
    jawab: 'Pemda kabupaten/kota setiap tiga bulan, tembusan OJK',
    salah: [
      ['OJK setiap bulan tanpa tembusan kepada pemerintah daerah', 'Pelaporan bulanan kepada OJK berlaku untuk skala menengah dan besar.'],
      ['LPS setiap tiga bulan', 'LPS tidak menerima laporan keuangan LKM.'],
      ['BUM Desa setiap tahun', 'BUM Desa bukan penerima laporan keuangan berkala LKM.'],
      ['Bank pemberi kredit setiap hari', 'Bank tidak menjadi penerima laporan berkala LKM.'],
    ],
    konsep: 'Pelaporan menurut skala usaha LKM', kunci: 'skala usaha kecil, laporan berkala',
    alasan: 'LKM skala kecil menyampaikan laporan keuangan berkala setiap tiga bulan kepada pemerintah daerah kabupaten/kota dengan tembusan kepada OJK.',
    cepat: 'Mulai dari skala, lalu baca penerima dan frekuensi laporan.',
    sumber: `${S.ebLkm}, §3.1.2, §3.1.6, contoh soal 4.4`, berlaku: POJK_LKM,
  }),
  butir('pengawas-kecil', 'menengah', 'pelaporan dan pengawasan', {
    tanya: 'Pihak yang membina, mengawasi, dan menetapkan status pengawasan LKM skala kecil adalah ...',
    jawab: 'Pemerintah daerah kabupaten atau kota',
    salah: [
      ['Bank Indonesia', 'BI tidak membina dan mengawasi LKM.'],
      ['Lembaga Penjamin Simpanan', 'LPS tidak mengawasi LKM.'],
      ['Pemerintah desa tempat LKM berkedudukan', 'Ketentuan menyebut pemerintah daerah kabupaten atau kota.'],
      ['Asosiasi LKM', 'Asosiasi bukan pihak yang menetapkan status pengawasan.'],
    ],
    konsep: 'Pembinaan dan pengawasan LKM menurut skala', kunci: 'LKM skala kecil',
    alasan: 'Pembinaan dan pengawasan LKM skala kecil dilakukan pemerintah daerah kabupaten/kota (mengacu ketentuan OJK), sedangkan skala menengah dan besar oleh OJK; OJK tetap dapat memeriksa LKM kecil bila diperlukan.',
    cepat: 'Kecil → pemda kabupaten/kota; menengah/besar → OJK.',
    sumber: `${S.ebLkm}, §3.1.2 A dan §3.1.3 C`, berlaku: POJK_LKM,
  }),
  butir('status-pengawasan', 'menengah', 'pelaporan dan pengawasan', {
    tanya: 'Status pengawasan LKM terdiri atas ...',
    jawab: 'Normal, intensif, dan khusus',
    salah: [
      ['Kecil, menengah, dan besar', 'Itu skala usaha LKM, bukan status pengawasan.'],
      ['Lancar, diragukan, dan macet', 'Itu sebagian kategori kualitas pinjaman.'],
      ['Desa, kecamatan, dan kabupaten', 'Itu cakupan wilayah usaha.'],
      ['Optimistis, stabil, dan pesimistis', 'Itu interpretasi indeks persepsi, bukan status pengawasan.'],
    ],
    konsep: 'Status pengawasan LKM', kunci: 'status pengawasan',
    alasan: 'Status pengawasan LKM terdiri atas normal, intensif, dan khusus; status itu berkaitan dengan kondisi lembaga, bukan semata ukuran aset atau wilayah.',
    cepat: 'Status ≠ skala ≠ wilayah.',
    sumber: `${S.ebLkm}, §3.1.3 C`, berlaku: POJK_LKM,
  }),
  butir('transformasi', 'menantang', 'transformasi', {
    tanya: 'LKM wajib bertransformasi menjadi BPR atau BPR Syariah apabila ...',
    jawab: 'Usahanya melampaui satu kabupaten atau kota tempat kedudukannya',
    salah: [
      ['Total asetnya untuk pertama kali melebihi Rp1 miliar pada laporan Desember', 'Aset Rp1 miliar adalah ambang skala menengah, bukan pemicu transformasi.'],
      ['Jumlah nasabahnya melebihi seratus orang', 'Jumlah nasabah bukan pemicu transformasi.'],
      ['LKM mulai mengelola produk simpanan', 'Mengelola simpanan termasuk kegiatan LKM.'],
      ['LKM menyalurkan pembiayaan syariah', 'LKM Syariah dapat menyalurkan pembiayaan syariah tanpa harus menjadi bank.'],
    ],
    konsep: 'Kewajiban transformasi LKM', kunci: 'wajib bertransformasi',
    alasan: 'LKM wajib bertransformasi menjadi BPR/BPRS jika usahanya melampaui satu kabupaten/kota tempat kedudukannya, atau jika ekuitas ≥ 5 kali dan simpanan setahun terakhir ≥ 25 kali modal disetor minimum BPR/BPRS.',
    cepat: 'Melampaui satu kabupaten/kota → menjadi BPR/BPRS.',
    sumber: `${S.ebLkm}, §3.1.2 B`, berlaku: POJK_LKM,
  }),
  butir('wilayah-izin', 'menengah', 'wilayah usaha', {
    tanya: 'Sebuah LKM memiliki izin wilayah satu kecamatan. Calon peminjam yang usahanya berada di luar cakupan izin itu mengajukan pinjaman. Langkah yang tepat adalah ...',
    jawab: 'Menolak penyaluran di luar cakupan dan menjelaskan batas izin',
    salah: [
      ['Menyalurkan pinjaman asalkan nominalnya kecil dan jangka waktunya pendek', 'Besar pinjaman tidak mengubah cakupan izin.'],
      ['Menyalurkan jika peminjam ikut pelatihan', 'Pelatihan tidak memperluas wilayah izin.'],
      ['Menyalurkan dengan meminta setoran simpanan', 'Setoran simpanan tidak memperluas wilayah izin.'],
      ['Menyalurkan karena usahanya berskala mikro', 'Skala usaha peminjam tidak mengubah cakupan izin LKM.'],
    ],
    konsep: 'Cakupan wilayah usaha LKM', kunci: 'di luar cakupan izin',
    alasan: 'Dalam menyalurkan pinjaman atau pembiayaan, LKM wajib mengikuti cakupan wilayah usaha yang diizinkan.',
    cepat: 'Cocokkan lokasi usaha dengan cakupan izin.',
    sumber: `${S.ebLkm}, §3.1.3 B dan contoh soal 4.8`, berlaku: POJK_LKM,
  }),
  butir('arah-dana', 'dasar', 'kegiatan LKM', {
    tanya: 'Rani menyetor Rp150.000 dari hasil penjualannya ke produk LKM yang dapat ditarik sesuai ketentuan. Setoran itu tidak dipakai untuk membayar cicilan. Layanan yang digunakan Rani adalah ...',
    jawab: 'Simpanan',
    salah: [
      ['Pinjaman', 'Pada pinjaman, dana mengalir dari LKM kepada nasabah.'],
      ['Penjaminan', 'Penjaminan berada di luar kegiatan LKM.'],
      ['Pembiayaan', 'Pembiayaan menyalurkan dana kepada pelaku usaha.'],
      ['Konsultasi', 'Konsultasi adalah bantuan mengelola usaha, bukan penempatan dana.'],
    ],
    konsep: 'Membedakan layanan LKM dari arah dana', kunci: 'menyetor, dapat ditarik',
    alasan: 'Dana ditempatkan nasabah pada LKM dan dapat ditarik sesuai ketentuan produk; itu simpanan.',
    cepat: 'Dana ke LKM → simpanan; dana dari LKM → pinjaman/pembiayaan.',
    sumber: `${S.ebLkm}, §3.1.5 dan contoh soal 4.7`,
  }),
  butir('bwm-status', 'menengah', 'LKM syariah', {
    tanya: 'Pernyataan yang tepat mengenai Bank Wakaf Mikro adalah ...',
    jawab: 'Penyelenggaranya berizin usaha LKM dari OJK.',
    salah: [
      ['Bank Wakaf Mikro adalah bank umum syariah.', 'Kata "bank" hanyalah bagian dari sebutan program; statusnya LKM Syariah.'],
      ['Bank Wakaf Mikro dapat menerima simpanan giro.', 'Sebagai LKM, ia dilarang menerima giro.'],
      ['Bank Wakaf Mikro diawasi LPS sebagai bank.', 'Bank Wakaf Mikro bukan bank peserta penjaminan; statusnya LKM.'],
      ['Bank Wakaf Mikro wajib menjadi BPR Syariah.', 'Tidak ada ketentuan bahwa program ini wajib berupa BPR Syariah.'],
    ],
    konsep: 'Bank Wakaf Mikro sebagai LKM Syariah', kunci: 'kata "bank" dalam nama program',
    alasan: 'Bank Wakaf Mikro adalah sebutan LKM Syariah dalam program pembiayaan dan pemberdayaan; status hukum penyelenggaranya mengikuti izin usaha LKM dari OJK.',
    cepat: 'Nama program ≠ jenis lembaga; cek izinnya.',
    sumber: `${S.ebLkm}, §3.1.1 D dan §3.1.4`, berlaku: 'SEOJK 36/SEOJK.06/2025 tentang Penyelenggaraan Program Wakaf Mikro',
  }),
  butir('kualitas-5', 'menengah', 'kualitas pinjaman', {
    tanya: 'Menurut Pasal 106 POJK 41 Tahun 2024, klasifikasi kualitas pinjaman atau pembiayaan LKM terdiri atas ...',
    jawab: 'Lancar, dalam perhatian khusus, kurang lancar, diragukan, macet',
    salah: [
      ['Normal, intensif, dan khusus', 'Itu status pengawasan LKM.'],
      ['Kecil, menengah, dan besar', 'Itu skala usaha LKM.'],
      ['Lancar dan macet saja', 'Klasifikasinya lima kelompok, bukan dua.'],
      ['Permodalan, kualitas aset, rentabilitas, likuiditas, dan manajemen', 'Itu aspek kesehatan lembaga, bukan kualitas pinjaman.'],
    ],
    konsep: 'Kualitas pinjaman vs kesehatan lembaga', kunci: 'kualitas pinjaman atau pembiayaan',
    alasan: 'Kualitas pinjaman diklasifikasikan menjadi lancar, dalam perhatian khusus, kurang lancar, diragukan, dan macet, dengan memperhatikan ketepatan pembayaran pokok dan/atau bunga atau imbal hasil.',
    cepat: 'Kualitas satu pinjaman (5 kelompok) ≠ kesehatan lembaga.',
    sumber: `${S.ebLkm}, §3.1.3 D`, berlaku: POJK_LKM,
  }),
  butir('dasar-hukum', 'dasar', 'regulasi', {
    tanya: 'Landasan undang-undang Lembaga Keuangan Mikro adalah ...',
    jawab: 'UU 1/2013 sebagaimana diubah UU 4/2023',
    salah: [
      ['UU 1/2016 tentang Penjaminan', 'UU 1/2016 mengatur penjaminan.'],
      ['UU 21/2008 tentang Perbankan Syariah', 'UU 21/2008 mengatur perbankan syariah.'],
      ['UU 21/2011 tentang OJK, tanpa undang-undang khusus LKM', 'LKM memiliki undang-undang khusus; UU OJK mengatur kelembagaan OJK.'],
      ['UU 40/2014 tentang Perasuransian', 'UU 40/2014 mengatur perasuransian.'],
    ],
    konsep: 'Dasar hukum LKM', kunci: 'landasan undang-undang LKM',
    alasan: 'UU Nomor 1 Tahun 2013 tentang LKM sebagaimana diubah dengan UU Nomor 4 Tahun 2023 menjadi landasan; POJK 41 Tahun 2024 merinci kelembagaan dan kegiatan usahanya.',
    cepat: 'LKM → UU 1/2013 jo. UU P2SK; POJK 41/2024.',
    sumber: `${S.ebLkm}, §3.1.1 E; ${S.ebJamin}, §3.1.1 C`, berlaku: POJK_LKM,
  }),
]);

// ---------------------------------------------------------------- hitung

const tCicilan: TemplateHitung = {
  id: 'cicilan-sama', tingkat: 'dasar', topik: 'cicilan',
  sumber: `${S.ebLkm}, §3.1.4 C dan contoh soal 4.5`,
  parameter: kombinasi({ pokok: [1e6, 2e6, 3e6, 5e6], bunga: [100e3, 200e3, 300e3, 500e3], kali: [4, 5, 10] }, (p) => bulat((p.pokok + p.bunga) / p.kali) && bulat(p.pokok / p.kali) && bulat(p.bunga / p.kali)),
  pertanyaan: (p) => `Seorang pelaku usaha meminjam ${rp(p.pokok)} dari LKM dengan total bunga ${rp(p.bunga)}. Pinjaman dibayar dalam ${p.kali} cicilan sama besar tanpa biaya lain. Besar satu cicilan adalah ...`,
  hitung: (p) => (p.pokok + p.bunga) / p.kali,
  pengecoh: (p) => [
    { nilai: p.pokok / p.kali, alasan: 'Bunga belum dimasukkan.' },
    { nilai: p.bunga / p.kali, alasan: 'Itu hanya porsi bunga per cicilan.' },
    { nilai: p.pokok + p.bunga, alasan: 'Itu total pembayaran; belum dibagi jumlah cicilan.' },
    { nilai: p.pokok / p.kali + p.bunga, alasan: 'Seluruh bunga ditambahkan ke setiap cicilan.' },
  ],
  konsep: 'Cicilan sama besar = (pokok + total bunga) ÷ jumlah cicilan', kataKunci: 'total bunga, cicilan sama besar',
  alasan: (p) => [`Total pembayaran = ${rp(p.pokok)} + ${rp(p.bunga)} = ${rp(p.pokok + p.bunga)}.`, `Satu cicilan = ${rp(p.pokok + p.bunga)} ÷ ${p.kali} = ${rp((p.pokok + p.bunga) / p.kali)}.`],
  caraCepat: 'Bagi total pembayaran dengan jumlah cicilan.',
};

const tSisa: TemplateHitung = {
  id: 'sisa-setelah-cicilan', tingkat: 'menengah', topik: 'kemampuan bayar',
  sumber: `${S.ebLkm}, §3.1.4 D`,
  parameter: kombinasi({ jual: [1.2e6, 1.5e6, 2e6], biaya: [650e3, 700e3, 900e3], cicilan: [300e3, 440e3, 500e3] }, (p) => p.jual - p.biaya - p.cicilan > 0),
  pertanyaan: (p) => `Setelah membeli alat baru, tambahan penjualan sebuah usaha diperkirakan ${rp(p.jual)} sebulan dengan tambahan biaya ${rp(p.biaya)}. Cicilan pinjaman LKM ${rp(p.cicilan)} per bulan. Sisa uang setelah cicilan dibayar adalah ...`,
  hitung: (p) => p.jual - p.biaya - p.cicilan,
  pengecoh: (p) => [
    { nilai: p.jual - p.biaya, alasan: 'Cicilan belum dikurangkan.' },
    { nilai: p.jual - p.cicilan, alasan: 'Tambahan biaya belum dikurangkan.' },
    { nilai: p.jual - p.biaya + p.cicilan, alasan: 'Cicilan justru ditambahkan.' },
    { nilai: p.biaya + p.cicilan, alasan: 'Itu jumlah pengeluaran, bukan sisa uang.' },
    { nilai: p.jual - p.biaya - 2 * p.cicilan, alasan: 'Cicilan terkurangi dua kali.' },
  ],
  konsep: 'Membandingkan hasil usaha dengan cicilan', kataKunci: 'tambahan penjualan, tambahan biaya, cicilan',
  alasan: (p) => [`Uang tersisa sebelum cicilan = ${rp(p.jual)} − ${rp(p.biaya)} = ${rp(p.jual - p.biaya)}.`, `Setelah cicilan = ${rp(p.jual - p.biaya)} − ${rp(p.cicilan)} = ${rp(p.jual - p.biaya - p.cicilan)}.`],
  caraCepat: 'Penjualan − biaya − cicilan.',
};

const tKurang: TemplateHitung = {
  id: 'kekurangan-kas', tingkat: 'dasar', topik: 'kemampuan bayar',
  sumber: `${S.ebLkm}, §3.1.4 E–F dan contoh soal 4.6`,
  parameter: kombinasi({ cicilan: [440e3, 500e3, 600e3], kas: [300e3, 350e3, 400e3] }),
  pertanyaan: (p) => `Setelah biaya usaha dibayar, seorang nasabah LKM hanya memiliki ${rp(p.kas)} untuk membayar cicilan sebesar ${rp(p.cicilan)}. Kekurangannya adalah ...`,
  hitung: (p) => p.cicilan - p.kas,
  pengecoh: (p) => [
    { nilai: p.kas, alasan: 'Itu uang yang tersedia, bukan kekurangannya.' },
    { nilai: p.cicilan, alasan: 'Itu besar cicilan, bukan kekurangannya.' },
    { nilai: p.cicilan + p.kas, alasan: 'Kas justru ditambahkan ke cicilan.' },
    { nilai: 2 * (p.cicilan - p.kas), alasan: 'Kekurangan terhitung dua kali.' },
    { nilai: 2 * p.cicilan - p.kas, alasan: 'Cicilan terhitung dua kali sebelum dikurangi kas.' },
  ],
  konsep: 'Menilai kemampuan membayar', kataKunci: 'uang tersedia, cicilan',
  alasan: (p) => [`Kekurangan = ${rp(p.cicilan)} − ${rp(p.kas)} = ${rp(p.cicilan - p.kas)}.`, 'Hitungan ini dipakai untuk menilai ulang jumlah pinjaman dan jadwal pembayaran.'],
  caraCepat: 'Cicilan − kas tersedia.',
};

const tTerlambat: TemplateHitung = {
  id: 'porsi-terlambat', tingkat: 'menengah', topik: 'portofolio pinjaman',
  sumber: `${S.ebLkm}, §3.1.4 F`,
  parameter: kombinasi({ aktif: [40, 50, 80, 120], telat: [2, 4, 6, 8, 10] }, (p) => p.telat < p.aktif / 2),
  pertanyaan: (p) => `Sebuah LKM memiliki ${p.aktif} pinjaman aktif kepada pelaku usaha pangan; ${p.telat} pinjaman di antaranya tercatat terlambat. Porsi pinjaman yang terlambat berdasarkan jumlah rekening adalah ...`,
  hitung: (p) => (p.telat / p.aktif) * 100,
  format: persen2,
  pengecoh: (p) => [
    { nilai: ((p.aktif - p.telat) / p.aktif) * 100, alasan: 'Itu porsi pinjaman yang tidak terlambat.' },
    { nilai: (p.telat / p.aktif) * 10, alasan: 'Salah menempatkan desimal.' },
    { nilai: (p.telat / (p.aktif - p.telat)) * 100, alasan: 'Pinjaman terlambat dibagi pinjaman lancar, padahal pembaginya seluruh pinjaman aktif.' },
    { nilai: p.telat, alasan: 'Jumlah rekening terlambat belum dibagi jumlah pinjaman aktif.' },
  ],
  konsep: 'Porsi pinjaman terlambat sebagai indikator awal', kataKunci: 'pinjaman aktif, terlambat, jumlah rekening',
  alasan: (p) => [`Porsi = ${p.telat} ÷ ${p.aktif} × 100% = ${persen2((p.telat / p.aktif) * 100)}.`, 'Angka ini indikator awal; kualitas tiap pinjaman tetap dinilai menurut kriteria yang berlaku.'],
  caraCepat: 'Terlambat ÷ seluruh pinjaman aktif × 100%.',
};

export const lkmHitung = familyHitung({
  id: 'PSJK-LKM-HITUNG', versi: 2, nama: 'Hitungan pinjaman mikro', chapter: 'lembaga-keuangan-mikro', label: 'VARIASI',
  sumber: S.ebLkm,
  ringkas: 'Cicilan sama besar, sisa uang setelah cicilan, kekurangan kas saat jatuh tempo, dan porsi pinjaman terlambat dalam portofolio.',
}, [tCicilan, tSisa, tKurang, tTerlambat]);

export const FAMILIES_LKM = [lkmIstilah, lkmKasus, lkmHitung];
