import { familyKurasi, familyRelasi, type TabelRelasi } from '../umum';
import { alasanRelasi, baris, butir, kalimatRelasi, SUMBER as S } from './bantu';
import { desimal, familyHitung, kombinasi, persen, persen2, rp, type Param, type TemplateHitung } from './hitung';

// Chapter Fintech (kebutuhan 35). Tiga family:
//   PSJK-FINTECH-ISTILAH  SHL      relasi dua arah: peta layanan fintech dan istilah LPBBTI
//   PSJK-FINTECH-KASUS    VARIASI  kewenangan OJK vs BI, LPBBTI vs BNPL vs urun dana, izin ≠ jaminan, batas manfaat
//                                   ekonomi (SEOJK 19/SEOJK.06/2025), penagihan, pinjol ilegal, ITSK
//   PSJK-FINTECH-HITUNG   VARIASI  manfaat ekonomi per hari, kekurangan kas, rasio kemampuan bayar, batas rupiah
//
// Pembagian kewenangan mengikuti e-book Fintech (2026): sistem pembayaran → BI; LPBBTI, bayar nanti oleh perusahaan
// pembiayaan, urun dana efek, perdagangan aset keuangan digital termasuk kripto, dan ITSK → OJK.

const P2SK = 'UU 4/2023 (P2SK)';
const SEOJK_19 = 'SEOJK 19/SEOJK.06/2025, sejak 31 Juli 2025';
const POJK_40 = 'POJK 40/2024';

const LAYANAN: TabelRelasi = {
  id: 'peta-layanan',
  topik: 'peta layanan fintech',
  tanyaNilai: (s) => `Dalam peta layanan fintech, ciri utama ${s} adalah ...`,
  tanyaSubjek: (n) => `Dalam peta layanan fintech, kegiatan dengan ciri ${n} disebut ...`,
  alasanSalah: alasanRelasi('bercirikan'),
  kalimat: kalimatRelasi('bercirikan'),
  konsep: 'Fintech adalah istilah payung; kenali layanan dari aktivitasnya: pembayaran, bayar nanti, pendanaan bersama, urun dana efek, perdagangan aset kripto, dan uji coba inovasi (sandbox).',
  caraCepat: 'Ikuti arus dana dan produk: membayar belanja → pembayaran digital; beli sekarang bayar kemudian → paylater; mempertemukan pemberi dan penerima dana → LPBBTI; menawarkan efek → urun dana.',
  baris: [
    baris('pembayaran', 'pembayaran digital', 'pengguna memindahkan saldo dana untuk melunasi belanja barang atau jasa, misalnya melalui dompet elektronik', 'dasar', `${S.ebFintech}, §3.1.1`),
    baris('paylater', 'bayar nanti (paylater)', 'pengguna membeli barang sekarang dan memenuhi kewajiban pembayaran kemudian sesuai perjanjian', 'dasar', `${S.ebFintech}, §3.1.1`),
    baris('lpbbti', 'LPBBTI (pinjaman daring)', 'penyelenggara mempertemukan pemberi dana dan penerima dana melalui platform digital', 'dasar', `${S.ebFintech}, §3.1.1 dan §3.1.2`, POJK_40),
    baris('scf', 'urun dana efek (securities crowdfunding)', 'penerbit menghimpun dana dengan menawarkan efek kepada pemodal melalui platform', 'menengah', `${S.ebFintech}, §3.1.1`, 'POJK 17/2025'),
    baris('kripto', 'perdagangan aset kripto', 'pengguna membeli atau menjual aset keuangan digital yang nilainya dapat berubah melalui penyelenggara perdagangan', 'menengah', `${S.ebFintech}, §3.1.1`, 'POJK 27/2024 jo. POJK 23/2025'),
    baris('sandbox', 'regulatory sandbox', 'ruang uji coba bagi inovasi teknologi sektor keuangan yang memenuhi kriteria', 'menengah', `${S.ebFintech}, §3.1.1`, 'POJK 3/2024'),
  ],
};

const ISTILAH: TabelRelasi = {
  id: 'istilah-lpbbti',
  topik: 'istilah LPBBTI',
  tanyaNilai: (s) => `Dalam layanan pendanaan bersama berbasis teknologi informasi (LPBBTI), ${s} adalah ...`,
  tanyaSubjek: (n) => `Dalam layanan pendanaan bersama berbasis teknologi informasi (LPBBTI), istilah untuk ${n} adalah ...`,
  alasanSalah: alasanRelasi('adalah'),
  kalimat: kalimatRelasi('adalah'),
  konsep: 'LPBBTI melibatkan tiga pihak: pemberi dana menyediakan uang, penerima dana memakai dan membayar kembali, penyelenggara mengelola platform; biaya diukur dengan manfaat ekonomi dari pokok dan tenor.',
  caraCepat: 'Ikuti arah dana: dari pemberi dana ke penerima dana; penyelenggara hanya mempertemukan.',
  baris: [
    baris('pemberi', 'pemberi dana', 'pihak yang menyediakan uang untuk disalurkan kepada penerima melalui platform', 'dasar', `${S.ebFintech}, §3.1.2`, POJK_40),
    baris('penerima', 'penerima dana', 'pihak yang menggunakan dana dan membayar kembali sesuai perjanjian', 'dasar', `${S.ebFintech}, §3.1.2`, POJK_40),
    baris('penyelenggara', 'penyelenggara', 'pihak yang mengelola platform yang mempertemukan pemberi dan penerima dana', 'dasar', `${S.ebFintech}, §3.1.2 dan contoh soal 4.1`, POJK_40),
    baris('manfaat', 'manfaat ekonomi', 'komponen imbal hasil dan biaya pendanaan yang dibatasi OJK, seperti bunga dan biaya administrasi', 'menengah', `${S.ebFintech}, Istilah Dasar dan §3.1.3`, SEOJK_19),
    baris('tenor', 'tenor', 'jangka waktu pendanaan', 'dasar', `${S.ebFintech}, Istilah Dasar`),
    baris('pokok', 'pokok', 'nilai pendanaan yang tercantum dalam perjanjian', 'dasar', `${S.ebFintech}, Istilah Dasar`),
    baris('wanprestasi', 'wanprestasi', 'tidak dipenuhinya kewajiban dalam perjanjian oleh salah satu pihak', 'menengah', `${S.ebFintech}, §3.1.4 B`),
    baris('piutang', 'piutang', 'hak untuk menerima pembayaran dari pihak lain', 'dasar', `${S.ebFintech}, Istilah Dasar`),
  ],
};

export const fintechIstilah = familyRelasi({
  id: 'PSJK-FINTECH-ISTILAH', nama: 'Peta layanan fintech dan istilah LPBBTI', chapter: 'fintech', label: 'SHL',
  sumber: S.ebFintech,
  ringkas: 'Relasi dua arah untuk enam aktivitas fintech (pembayaran digital, paylater, LPBBTI, urun dana efek, aset kripto, regulatory sandbox) dan istilah LPBBTI (pemberi/penerima dana, penyelenggara, manfaat ekonomi, tenor, pokok, wanprestasi, piutang).',
}, [LAYANAN, ISTILAH]);

const ALASAN_MANFAAT = 'Komponen ini termasuk manfaat ekonomi menurut SEOJK, jadi bukan jawaban.';

export const fintechKasus = familyKurasi({
  id: 'PSJK-FINTECH-KASUS', versi: 2, nama: 'Kasus fintech dan pinjaman daring', chapter: 'fintech', label: 'VARIASI',
  sumber: `${S.ebFintech}; ${S.bsc}`,
  ringkas: 'Kewenangan OJK vs BI per aktivitas, membedakan LPBBTI, BNPL perusahaan pembiayaan, dan urun dana, izin ≠ jaminan bebas risiko, batas manfaat ekonomi harian, rasio kemampuan bayar, aturan penagihan, pinjol tanpa izin, ITSK; termasuk "KECUALI" dan pernyataan majemuk.',
}, [
  butir('dompet-bi', 'dasar', 'kewenangan', {
    tanya: 'Pengguna membayar belanja melalui dompet elektronik yang disediakan penyedia jasa pembayaran. Otoritas yang berwenang atas kegiatan sistem pembayaran ini adalah ...',
    jawab: 'Bank Indonesia',
    salah: [
      ['Otoritas Jasa Keuangan', 'OJK berwenang atas LPBBTI, paylater perusahaan pembiayaan, urun dana, dan aset kripto; kegiatan sistem pembayaran berada pada BI.'],
      ['Lembaga Penjamin Simpanan', 'LPS menjamin simpanan nasabah bank dan menangani resolusi bank.'],
      ['Bappebti', 'Bappebti tidak mengatur sistem pembayaran digital.'],
      ['Satgas PASTI', 'Satgas PASTI memberantas aktivitas keuangan ilegal.'],
    ],
    konsep: 'Pembagian kewenangan OJK–BI dalam fintech', kunci: 'dompet elektronik, sistem pembayaran',
    alasan: 'Bank Indonesia mengatur dan mengawasi kegiatan sistem pembayaran, termasuk layanan pembayaran digital oleh penyedia jasa pembayaran seperti dompet elektronik.',
    cepat: 'Membayar/memindahkan dana → BI.',
    sumber: `${S.ebFintech}, §3.1 (Siapa yang Mengatur Apa) dan §3.1.1`, berlaku: P2SK,
  }),
  butir('paylater-ojk', 'menengah', 'kewenangan', {
    tanya: 'Fasilitas bayar nanti (paylater) di sebuah aplikasi disediakan oleh perusahaan pembiayaan. Otoritas yang berwenang atas fasilitas tersebut adalah ...',
    jawab: 'Otoritas Jasa Keuangan',
    salah: [
      ['Bank Indonesia', 'BI berwenang atas kegiatan sistem pembayaran, bukan pembiayaan oleh perusahaan pembiayaan.'],
      ['Lembaga Penjamin Simpanan', 'LPS menjamin simpanan bank.'],
      ['Kementerian Perdagangan', 'Pembiayaan oleh perusahaan pembiayaan bukan ranah kementerian ini.'],
      ['Asosiasi penyelenggara fintech', 'Asosiasi bukan otoritas yang mengatur dan mengawasi.'],
    ],
    konsep: 'Pembagian kewenangan OJK–BI dalam fintech', kunci: 'paylater, perusahaan pembiayaan',
    alasan: 'Bayar nanti yang disediakan perusahaan pembiayaan berada dalam kewenangan OJK sesuai ketentuan yang berlaku.',
    cepat: 'Penyedia dananya lembaga jasa keuangan (perusahaan pembiayaan) → OJK.',
    sumber: `${S.ebFintech}, §3.1 dan §3.1.1`, berlaku: P2SK,
  }),
  butir('kripto-ojk', 'menengah', 'kewenangan', {
    tanya: 'Seorang pengguna membeli aset kripto melalui penyelenggara perdagangan aset keuangan digital. Menurut kerangka terkini, otoritas yang berwenang atas penyelenggaraan perdagangan tersebut adalah ...',
    jawab: 'Otoritas Jasa Keuangan',
    salah: [
      ['Bappebti', 'Pengawasan aset kripto telah beralih dari Bappebti ke OJK berdasarkan UU P2SK.'],
      ['Bank Indonesia', 'BI berwenang atas sistem pembayaran, bukan perdagangan aset kripto.'],
      ['Lembaga Penjamin Simpanan', 'Aset kripto bukan simpanan bank.'],
      ['Satgas PASTI', 'Satgas PASTI menangani aktivitas keuangan ilegal, bukan otoritas perizinan penyelenggara.'],
    ],
    konsep: 'Perdagangan aset keuangan digital termasuk kripto', kunci: 'aset kripto, penyelenggara perdagangan',
    alasan: 'OJK berwenang atas penyelenggaraan perdagangan aset keuangan digital termasuk aset kripto; kerangkanya POJK 27 Tahun 2024 sebagaimana diubah POJK 23 Tahun 2025.',
    cepat: 'Kripto sekarang → OJK.',
    sumber: `${S.ebFintech}, §3.1.1`, berlaku: `${P2SK}; POJK 27/2024 jo. POJK 23/2025`,
  }),
  butir('pernyataan-ojk-bi', 'menantang', 'kewenangan', {
    tanya: 'Perhatikan pernyataan berikut:\n(1) BI mengatur dan mengawasi layanan pembayaran digital oleh penyedia jasa pembayaran;\n(2) OJK mengatur dan mengawasi penyelenggaraan LPBBTI;\n(3) penawaran efek melalui urun dana diawasi Bank Indonesia;\n(4) OJK menyediakan regulatory sandbox bagi inovasi teknologi sektor keuangan yang memenuhi kriteria.\nSeluruh pernyataan yang benar adalah ...',
    jawab: '(1), (2), dan (4)',
    salah: [
      ['(1), (2), dan (3)', 'Pernyataan (3) salah: penawaran efek melalui urun dana berada dalam kewenangan OJK.'],
      ['(2) dan (3)', 'Pernyataan (3) salah.'],
      ['(3) dan (4)', 'Pernyataan (3) salah.'],
      ['(1), (3), dan (4)', 'Pernyataan (3) salah.'],
      ['(1) dan (3)', 'Pernyataan (3) salah.'],
    ],
    konsep: 'Pembagian kewenangan OJK–BI dalam fintech', kunci: 'pembayaran, LPBBTI, urun dana, sandbox',
    alasan: ['BI: kegiatan sistem pembayaran; OJK: LPBBTI, paylater perusahaan pembiayaan, urun dana efek, aset kripto, dan ITSK termasuk regulatory sandbox.', 'BI memiliki ketentuan tersendiri untuk inovasi di bidang sistem pembayaran.'],
    cepat: 'Cari pernyataan yang menempatkan efek/pasar modal di BI.',
    sumber: `${S.ebFintech}, §3.1 dan §3.1.1`, berlaku: P2SK,
  }),
  butir('urun-dana', 'dasar', 'jenis layanan', {
    tanya: 'Sebuah platform membantu usaha menawarkan saham kepada sejumlah pemodal. Aktivitas yang paling tepat adalah ...',
    jawab: 'Urun dana efek',
    salah: [
      ['Pembayaran digital', 'Pembayaran digital memindahkan dana untuk membayar barang atau jasa.'],
      ['Penjaminan kredit', 'Penjaminan memberi perlindungan atas kewajiban terjamin.'],
      ['Pinjaman daring untuk modal kerja', 'Pinjaman daring adalah pendanaan yang harus dibayar kembali, bukan penawaran saham.'],
      ['Perdagangan aset kripto', 'Aset kripto bukan saham penerbit.'],
    ],
    konsep: 'Membedakan layanan dari produk yang ditawarkan', kunci: 'menawarkan saham, pemodal',
    alasan: 'Pada urun dana efek, penerbit menghimpun dana dengan menawarkan efek melalui platform; jika efeknya saham, pemodal memperoleh bagian kepemilikan.',
    cepat: 'Lihat produk yang ditawarkan: saham/efek → urun dana.',
    sumber: `${S.ebFintech}, §3.1.1 dan contoh soal 4.5`, berlaku: 'POJK 17/2025',
  }),
  butir('lpbbti-vs-bnpl', 'menantang', 'jenis layanan', {
    tanya: 'Dalam satu aplikasi, fitur X mempertemukan Rina dengan pemberi dana untuk modal usahanya, sedangkan pada fitur Y perusahaan pembiayaan membiayai pembelian barang Rina yang dibayar dengan angsuran. Klasifikasi yang tepat adalah ...',
    jawab: 'X adalah LPBBTI dan Y adalah BNPL perusahaan pembiayaan.',
    salah: [
      ['X adalah BNPL dan Y adalah LPBBTI.', 'Terbalik: X mempertemukan pemberi dan penerima dana, ciri LPBBTI.'],
      ['Keduanya LPBBTI karena ada di aplikasi yang sama.', 'Satu aplikasi dapat memuat layanan berbeda; klasifikasi mengikuti aktivitas dan penyedianya.'],
      ['Keduanya BNPL karena dibayar kemudian.', 'Pembayaran kemudian tidak otomatis menjadikan keduanya BNPL.'],
      ['X adalah urun dana efek dan Y pembayaran digital.', 'Tidak ada penawaran efek pada X, dan Y adalah pembiayaan barang.'],
    ],
    konsep: 'Membedakan LPBBTI dan bayar nanti', kunci: 'mempertemukan pemberi dana, perusahaan pembiayaan membiayai',
    alasan: 'Pada X, penyelenggara mempertemukan pemberi dana dengan penerima dana (LPBBTI); pada Y, perusahaan pembiayaan menyediakan pembiayaan pembelian barang (BNPL perusahaan pembiayaan).',
    cepat: 'Ikuti arus dana dan identifikasi penyedia setiap fitur.',
    sumber: `${S.ebFintech}, §3.1.1 dan contoh soal 4.10`,
  }),
  butir('izin-risiko', 'menengah', 'risiko pendanaan', {
    tanya: 'Sebuah platform LPBBTI tercantum dalam direktori OJK. Arti informasi ini bagi pemberi dana adalah ...',
    jawab: 'Status platform terverifikasi, tetapi risiko pendanaan tetap ada',
    salah: [
      ['Platform menanggung gagal bayar penerima dana', 'Izin tidak berarti kerugian pemberi dana akibat gagal bayar diganti platform.'],
      ['Platform menjadi sumber dana utama bagi penerima', 'Platform mempertemukan pihak; dana berasal dari pemberi dana.'],
      ['Penilaian kondisi penerima dana tidak diperlukan', 'Risiko gagal bayar tetap berkaitan dengan penerima dana.'],
      ['Penerima dana terjamin membayar tepat waktu', 'Izin penyelenggara tidak menjamin penerima dana membayar tepat waktu.'],
    ],
    konsep: 'Izin penyelenggara vs risiko gagal bayar', kunci: 'tercantum di direktori OJK',
    alasan: 'Izin OJK menunjukkan penyelenggara memiliki izin usaha yang relevan, tetapi tidak menjamin pendanaan bebas gagal bayar; perlindungan tambahan (asuransi/penjaminan) mengikuti cakupan dan syarat dalam perjanjian.',
    cepat: 'Pisahkan status penyelenggara dari risiko pembayaran.',
    sumber: `${S.ebFintech}, §3.1.4 D dan contoh soal 4.4`, berlaku: POJK_40,
  }),
  butir('batas-35jt', 'menantang', 'manfaat ekonomi', {
    tanya: 'Berdasarkan SEOJK 19/SEOJK.06/2025, suatu pendanaan produktif bernilai Rp35 juta dengan tenor delapan bulan memiliki batas maksimum manfaat ekonomi per hari kalender sebesar ...',
    jawab: '0,1%',
    salah: [
      ['0,275%', '0,275% berlaku untuk produktif sampai Rp50 juta dengan tenor sampai 6 bulan.'],
      ['0,3%', '0,3% berlaku untuk pendanaan konsumtif dengan tenor sampai 6 bulan.'],
      ['0,2%', '0,2% berlaku untuk pendanaan konsumtif dengan tenor lebih dari 6 bulan.'],
      ['0,4%', 'Tidak ada batas 0,4% dalam tabel yang dirujuk.'],
    ],
    konsep: 'Batas maksimum manfaat ekonomi LPBBTI', kunci: 'produktif Rp35 juta, tenor delapan bulan',
    alasan: 'Pendanaan produktif sampai Rp50 juta dengan tenor lebih dari 6 bulan dibatasi 0,1% per hari kalender dari nilai pendanaan dalam perjanjian.',
    cepat: 'Tentukan jenis → nilai → tenor, lalu baca tabel.',
    sumber: `${S.ebFintech}, §3.1.3 dan contoh soal 4.2`, berlaku: SEOJK_19,
  }),
  butir('batas-60jt', 'menantang', 'manfaat ekonomi', {
    tanya: 'Sebuah usaha menyepakati pendanaan produktif Rp60 juta melalui LPBBTI dengan tenor empat bulan. Berdasarkan SEOJK 19/SEOJK.06/2025, batas maksimum manfaat ekonomi per hari kalender adalah ...',
    jawab: '0,1%',
    salah: [
      ['0,275%', '0,275% hanya untuk produktif sampai Rp50 juta dengan tenor sampai 6 bulan; nilai Rp60 juta melebihi Rp50 juta.'],
      ['0,3%', '0,3% berlaku untuk konsumtif tenor sampai 6 bulan.'],
      ['0,2%', '0,2% berlaku untuk konsumtif tenor lebih dari 6 bulan.'],
      ['0,4%', 'Tidak ada batas 0,4% dalam tabel yang dirujuk.'],
    ],
    konsep: 'Batas maksimum manfaat ekonomi LPBBTI', kunci: 'produktif Rp60 juta',
    alasan: 'Pendanaan produktif di atas Rp50 juta dibatasi 0,1% per hari kalender, baik tenor sampai 6 bulan maupun lebih.',
    cepat: 'Produktif > Rp50 juta → 0,1% berapa pun tenornya.',
    sumber: `${S.ebFintech}, §3.1.3 dan contoh soal 4.6`, berlaku: SEOJK_19,
  }),
  butir('batas-20jt', 'menengah', 'manfaat ekonomi', {
    tanya: 'Pendanaan produktif Rp20 juta melalui LPBBTI memiliki tenor tiga bulan. Berdasarkan SEOJK 19/SEOJK.06/2025, batas maksimum manfaat ekonomi per hari kalender adalah ...',
    jawab: '0,275%',
    salah: [
      ['0,1%', '0,1% berlaku untuk produktif di atas Rp50 juta atau produktif tenor lebih dari 6 bulan.'],
      ['0,3%', '0,3% berlaku untuk pendanaan konsumtif tenor sampai 6 bulan.'],
      ['0,2%', '0,2% berlaku untuk pendanaan konsumtif tenor lebih dari 6 bulan.'],
      ['0,4%', 'Tidak ada batas 0,4% dalam tabel yang dirujuk.'],
    ],
    konsep: 'Batas maksimum manfaat ekonomi LPBBTI', kunci: 'produktif Rp20 juta, tenor tiga bulan',
    alasan: 'Pendanaan produktif sampai Rp50 juta dengan tenor sampai 6 bulan dibatasi 0,275% per hari kalender.',
    cepat: 'Produktif kecil dan pendek → 0,275%.',
    sumber: `${S.ebFintech}, §3.1.3`, berlaku: SEOJK_19,
  }),
  butir('batas-konsumtif-pendek', 'menengah', 'manfaat ekonomi', {
    tanya: 'Pendanaan konsumtif melalui LPBBTI memiliki tenor tiga bulan. Berdasarkan SEOJK 19/SEOJK.06/2025, batas maksimum manfaat ekonomi per hari kalender adalah ...',
    jawab: '0,3%',
    salah: [
      ['0,2%', '0,2% berlaku untuk konsumtif dengan tenor lebih dari 6 bulan.'],
      ['0,275%', '0,275% berlaku untuk produktif sampai Rp50 juta tenor sampai 6 bulan.'],
      ['0,1%', '0,1% berlaku untuk produktif di atas Rp50 juta atau tenor panjang.'],
      ['0,4%', 'Tidak ada batas 0,4% dalam tabel yang dirujuk.'],
    ],
    konsep: 'Batas maksimum manfaat ekonomi LPBBTI', kunci: 'konsumtif, tenor tiga bulan',
    alasan: 'Pendanaan konsumtif dengan tenor sampai 6 bulan dibatasi 0,3% per hari kalender; lebih dari 6 bulan 0,2%.',
    cepat: 'Konsumtif: ≤ 6 bulan 0,3%, > 6 bulan 0,2%.',
    sumber: `${S.ebFintech}, §3.1.3`, berlaku: SEOJK_19,
  }),
  butir('batas-konsumtif-panjang', 'menengah', 'manfaat ekonomi', {
    tanya: 'Pendanaan konsumtif melalui LPBBTI memiliki tenor sembilan bulan. Berdasarkan SEOJK 19/SEOJK.06/2025, batas maksimum manfaat ekonomi per hari kalender adalah ...',
    jawab: '0,2%',
    salah: [
      ['0,3%', '0,3% berlaku untuk konsumtif dengan tenor sampai 6 bulan.'],
      ['0,275%', '0,275% berlaku untuk produktif sampai Rp50 juta tenor sampai 6 bulan.'],
      ['0,1%', '0,1% berlaku untuk pendanaan produktif tertentu, bukan konsumtif.'],
      ['0,4%', 'Tidak ada batas 0,4% dalam tabel yang dirujuk.'],
    ],
    konsep: 'Batas maksimum manfaat ekonomi LPBBTI', kunci: 'konsumtif, tenor sembilan bulan',
    alasan: 'Pendanaan konsumtif dengan tenor lebih dari 6 bulan dibatasi 0,2% per hari kalender.',
    cepat: 'Konsumtif: ≤ 6 bulan 0,3%, > 6 bulan 0,2%.',
    sumber: `${S.ebFintech}, §3.1.3`, berlaku: SEOJK_19,
  }),
  butir('manfaat-kecuali', 'menantang', 'manfaat ekonomi', {
    tanya: 'Dalam ketentuan batas manfaat ekonomi LPBBTI, komponen berikut termasuk manfaat ekonomi, KECUALI ...',
    jawab: 'Denda keterlambatan',
    salah: [
      ['Bunga pendanaan', ALASAN_MANFAAT],
      ['Margin atau bagi hasil', ALASAN_MANFAAT],
      ['Biaya administrasi', ALASAN_MANFAAT],
      ['Komisi platform', ALASAN_MANFAAT],
    ],
    konsep: 'Cakupan manfaat ekonomi', kunci: 'KECUALI, manfaat ekonomi',
    alasan: 'Manfaat ekonomi mencakup bunga, margin atau bagi hasil, biaya administrasi atau komisi platform, dan biaya lain yang termasuk cakupan aturan; denda keterlambatan memiliki ketentuan tersendiri.',
    cepat: 'Denda dihitung terpisah dari manfaat ekonomi.',
    sumber: `${S.ebFintech}, §3.1.3`, berlaku: SEOJK_19,
  }),
  butir('rasio-30', 'menengah', 'kemampuan bayar', {
    tanya: 'Untuk pendanaan konsumtif LPBBTI sejak 2026, salah satu ukuran kemampuan bayar adalah rasio pembayaran pokok dan manfaat ekonomi kepada seluruh kreditur terhadap penghasilan penerima dana, dengan batas ...',
    jawab: '30%',
    salah: [
      ['50%', 'Batas untuk pendanaan konsumtif sejak 2026 adalah 30%.'],
      ['40%', 'Batas untuk pendanaan konsumtif sejak 2026 adalah 30%.'],
      ['20%', 'Batas untuk pendanaan konsumtif sejak 2026 adalah 30%.'],
      ['75%', 'Batas untuk pendanaan konsumtif sejak 2026 adalah 30%.'],
    ],
    konsep: 'Rasio kemampuan bayar pendanaan konsumtif', kunci: 'seluruh kreditur, penghasilan',
    alasan: 'Penyelenggara menilai rasio pembayaran pokok dan manfaat ekonomi kepada seluruh kreditur terhadap penghasilan penerima dana; batasnya 30% untuk pendanaan konsumtif sejak 2026.',
    cepat: 'Konsumtif 2026: cicilan ke semua kreditur ≤ 30% penghasilan.',
    sumber: `${S.ebFintech}, §3.1.4 A dan contoh soal 4.7`, berlaku: SEOJK_19,
  }),
  butir('penagihan-jam', 'menengah', 'penagihan', {
    tanya: 'Petugas penagih sebuah platform LPBBTI menelepon penerima dana pada hari Rabu pukul 21.30 waktu setempat tanpa persetujuan sebelumnya. Penilaian yang tepat adalah ...',
    jawab: 'Di luar waktu penagihan umum tanpa persetujuan',
    salah: [
      ['Sesuai aturan karena hari Rabu adalah hari kerja', 'Selain hari, ada batas jam penagihan 08.00–20.00 waktu setempat.'],
      ['Sesuai aturan asalkan tidak ada ancaman', 'Waktu penagihan juga diatur, selain larangan ancaman.'],
      ['Sesuai aturan karena penagihan boleh 24 jam', 'Penagihan dibatasi pukul 08.00–20.00 waktu setempat.'],
      ['Menjadi tanggung jawab petugas, bukan penyelenggara', 'Penyelenggara tetap bertanggung jawab atas penagihan oleh pihak yang ditunjuknya.'],
    ],
    konsep: 'Aturan penagihan LPBBTI', kunci: 'pukul 21.30, tanpa persetujuan',
    alasan: 'Penagihan umumnya dilakukan Senin–Sabtu di luar libur nasional pukul 08.00–20.00 waktu setempat; penagihan di luar waktu atau tempat itu memerlukan persetujuan atau perjanjian lebih dahulu dengan konsumen.',
    cepat: 'Ingat jendela 08.00–20.00, Senin–Sabtu.',
    sumber: `${S.ebFintech}, §3.1.4 C`, berlaku: `${POJK_40}; ${SEOJK_19}`,
  }),
  butir('kontak-darurat', 'menengah', 'penagihan', {
    tanya: 'Dalam penagihan LPBBTI, kontak darurat yang dicantumkan penerima dana hanya boleh digunakan untuk ...',
    jawab: 'Mengonfirmasi keberadaan penerima dana',
    salah: [
      ['Menagih utang kepada pemilik kontak darurat', 'Penagihan harus ditujukan kepada penerima dana.'],
      ['Menyebarkan rincian utang kepada rekan kerja', 'Membuka informasi utang kepada pihak tidak berkepentingan melanggar pelindungan data.'],
      ['Meminta kontak darurat melunasi pokok', 'Kontak darurat bukan pihak yang berutang.'],
      ['Menekan penerima dana agar segera membayar', 'Penagihan dilarang memakai tekanan atau tindakan mempermalukan.'],
    ],
    konsep: 'Batas penggunaan kontak darurat', kunci: 'kontak darurat',
    alasan: 'Penagihan harus ditujukan kepada penerima dana tanpa ancaman, tekanan, atau mempermalukan; kontak darurat hanya digunakan untuk mengonfirmasi keberadaan penerima dana.',
    cepat: 'Kontak darurat ≠ pihak yang ditagih.',
    sumber: `${S.ebFintech}, §3.1.4 C`, berlaku: POJK_40,
  }),
  butir('pihak-ketiga', 'menantang', 'penagihan', {
    tanya: 'Penyelenggara LPBBTI menunjuk pihak ketiga untuk menagih, dan petugas itu mengirim rincian utang penerima dana kepada rekan kerjanya. Pernyataan yang tepat adalah ...',
    jawab: 'Penyelenggara tetap bertanggung jawab atas dampak penagihan itu.',
    salah: [
      ['Tanggung jawabnya beralih kepada petugas penagih.', 'Jika penagihan dilakukan pihak ketiga, penyelenggara tetap bertanggung jawab atas dampaknya.'],
      ['Tindakan itu sah karena utangnya memang ada.', 'Mengungkap informasi utang kepada pihak tidak berkepentingan melanggar pelindungan data.'],
      ['Penerima dana tidak dapat mengadu karena terlambat bayar.', 'Penerima dana tetap dapat mengadu melalui kanal resmi penyelenggara.'],
      ['Pemberi dana bertanggung jawab atas cara penagihan itu.', 'Tanggung jawab cara penagihan ada pada penyelenggara, bukan pemberi dana.'],
    ],
    konsep: 'Tanggung jawab penyelenggara atas penagihan dan data', kunci: 'pihak ketiga, rincian utang ke rekan kerja',
    alasan: 'Penyelenggara wajib menjaga kerahasiaan data pribadi dan melakukan penagihan sesuai ketentuan; jika penagihan oleh pihak ketiga, penyelenggara tetap bertanggung jawab. Simpan bukti dan adukan melalui kanal resmi penyelenggara.',
    cepat: 'Penagih ditunjuk penyelenggara → tanggung jawab tetap di penyelenggara.',
    sumber: `${S.ebFintech}, §3.1.4 C–D dan contoh soal 4.9`, berlaku: POJK_40,
  }),
  butir('cek-izin', 'dasar', 'legalitas', {
    tanya: 'Sebelum memakai sebuah aplikasi pinjaman daring, langkah paling tepat untuk memastikan izin platformnya adalah ...',
    jawab: 'Memeriksa Direktori LPBBTI OJK',
    salah: [
      ['Membaca ulasan pengguna di toko aplikasi', 'Ulasan bukan sumber resmi status izin.'],
      ['Melihat logo OJK pada iklan aplikasi', 'Logo pada iklan tidak membuktikan izin.'],
      ['Bertanya kepada petugas pemasaran aplikasi', 'Keterangan pemasar bukan verifikasi resmi.'],
      ['Membandingkan besar plafon yang ditawarkan', 'Plafon tidak menunjukkan status izin.'],
    ],
    konsep: 'Verifikasi legalitas penyelenggara', kunci: 'izin platform',
    alasan: 'Izin platform LPBBTI dicek melalui Direktori LPBBTI OJK (atau direktori resmi OJK lainnya), bukan dari materi promosi.',
    cepat: 'Legalitas → direktori resmi OJK.',
    sumber: `${S.ebFintech}, §3.1.2; ${S.bsc}, Bab IX (hlm. 133)`, berlaku: POJK_40,
  }),
  butir('pinjol-ilegal', 'dasar', 'legalitas', {
    tanya: 'Seseorang mendapat tawaran pinjaman daring dari aplikasi yang tidak tercantum sebagai penyelenggara berizin OJK. Kanal pelaporan yang paling sesuai untuk dugaan aktivitas ilegal ini adalah ...',
    jawab: 'SIPASTI (Satgas PASTI)',
    salah: [
      ['LAPS SJK', 'LAPS SJK menyelesaikan sengketa dengan pelaku usaha jasa keuangan, bukan laporan aktivitas ilegal.'],
      ['Direktori LPBBTI', 'Direktori dipakai untuk memeriksa izin, bukan menerima laporan.'],
      ['Lembaga Penjamin Simpanan', 'LPS menjamin simpanan bank.'],
      ['Bank Indonesia', 'BI berwenang atas sistem pembayaran, bukan pelaporan pinjaman daring ilegal.'],
    ],
    konsep: 'Pinjaman daring tanpa izin', kunci: 'tidak berizin OJK',
    alasan: 'SIPASTI adalah kanal pelaporan dugaan aktivitas keuangan ilegal, termasuk pinjaman daring tanpa izin; laporan dapat dibuat meskipun belum mengirim uang.',
    cepat: 'Tidak berizin → laporkan ke Satgas PASTI.',
    sumber: `${S.ebDfl}, §3.1.3 B; ${S.ebFintech}, §3.1.2`,
  }),
  butir('itsk', 'menengah', 'inovasi keuangan digital', {
    tanya: 'Peraturan OJK yang memberi kerangka penyelenggaraan Inovasi Teknologi Sektor Keuangan (ITSK), termasuk ruang uji coba (regulatory sandbox), adalah ...',
    jawab: 'POJK 3 Tahun 2024',
    salah: [
      ['POJK 40 Tahun 2024', 'POJK 40/2024 mengatur LPBBTI.'],
      ['POJK 17 Tahun 2025', 'POJK 17/2025 mengatur penawaran efek melalui layanan urun dana.'],
      ['POJK 27 Tahun 2024', 'POJK 27/2024 mengatur perdagangan aset keuangan digital termasuk kripto.'],
      ['POJK 22 Tahun 2023', 'POJK 22/2023 mengatur pelindungan konsumen.'],
    ],
    konsep: 'Regulasi fintech di OJK', kunci: 'ITSK, regulatory sandbox',
    alasan: 'POJK 3 Tahun 2024 memberi kerangka ITSK; OJK menyediakan regulatory sandbox bagi inovasi yang memenuhi kriteria, sedangkan BI punya ketentuan sendiri untuk inovasi sistem pembayaran.',
    cepat: 'ITSK/sandbox → POJK 3/2024.',
    sumber: `${S.ebFintech}, §3.1.1`, berlaku: 'POJK 3/2024',
  }),
  butir('pojk-40', 'dasar', 'regulasi', {
    tanya: 'Peraturan OJK yang mengatur Layanan Pendanaan Bersama Berbasis Teknologi Informasi (LPBBTI) adalah ...',
    jawab: 'POJK 40 Tahun 2024',
    salah: [
      ['POJK 3 Tahun 2024', 'POJK 3/2024 mengatur penyelenggaraan ITSK.'],
      ['POJK 39 Tahun 2024', 'POJK 39/2024 mengatur pergadaian.'],
      ['POJK 41 Tahun 2024', 'POJK 41/2024 mengatur lembaga keuangan mikro.'],
      ['POJK 17 Tahun 2025', 'POJK 17/2025 mengatur urun dana efek.'],
    ],
    konsep: 'Regulasi LPBBTI', kunci: 'LPBBTI',
    alasan: 'LPBBTI diatur dalam POJK 40 Tahun 2024, dengan pelaksanaan teknis antara lain dalam SEOJK 19/SEOJK.06/2025.',
    cepat: 'Pinjaman daring → POJK 40/2024.',
    sumber: `${S.ebFintech}, Daftar Pustaka dan Catatan Sumber`, berlaku: POJK_40,
  }),
  butir('syariah-akad', 'menengah', 'LPBBTI syariah', {
    tanya: 'Dalam fintech pendanaan bersama syariah, perikatan antara pemberi dana dan penerima dana dilakukan dengan ...',
    jawab: 'Akad syariah seperti murabahah atau mudharabah',
    salah: [
      ['Perjanjian kredit berbunga tetap', 'Itu model konvensional; model syariah memakai akad syariah.'],
      ['Polis asuransi jiwa', 'Polis asuransi bukan perikatan pendanaan.'],
      ['Sertifikat penjaminan simpanan', 'Penjaminan simpanan adalah fungsi LPS untuk bank.'],
      ['Penyertaan saham pada platform', 'Pemberi dana tidak menjadi pemegang saham platform.'],
    ],
    konsep: 'Model bisnis konvensional dan syariah fintech pendanaan bersama', kunci: 'pendanaan bersama syariah',
    alasan: 'Pada fintech pendanaan bersama syariah, perikatan pemberi dan penerima dana memakai akad syariah, antara lain murabahah, mudharabah, musyarakah, ijarah, dan wakalah.',
    cepat: 'Syariah → akad, bukan perjanjian berbunga.',
    sumber: `${S.bsc}, Bab IX (hlm. 127)`,
  }),
]);

// ---------------------------------------------------------------- hitung

const tManfaatHarian: TemplateHitung = {
  id: 'manfaat-per-hari', tingkat: 'menantang', topik: 'manfaat ekonomi',
  sumber: `${S.ebFintech}, §3.1.3 dan §3.1.5`, berlakuPer: SEOJK_19,
  // laju sebagian berdesimal tiga agar kunci tidak selalu tampak "rapi" dibanding pengecoh berdesimal tiga
  parameter: kombinasi({ pokok: [1e6, 2e6, 4e6, 5e6], hari: [10, 20, 30], laju: [0.075, 0.08, 0.1, 0.125, 0.15, 0.175, 0.2, 0.225, 0.25] }).map((p) => ({ pokok: p.pokok, hari: p.hari, bayar: p.pokok + Math.round((p.pokok * p.laju * p.hari) / 100) })),
  pertanyaan: (p) => `Sebuah toko menerima pendanaan ${rp(p.pokok)} tanpa potongan dan wajib membayar ${rp(p.bayar)} pada hari ke-${p.hari}. Jika seluruh selisihnya merupakan manfaat ekonomi, besar manfaat ekonomi per hari kalender terhadap nilai pendanaan adalah ...`,
  hitung: (p) => ((p.bayar - p.pokok) / p.pokok / p.hari) * 100,
  format: persen,
  pengecoh: (p) => {
    const biaya = p.bayar - p.pokok;
    return [
      { nilai: (biaya / p.pokok) * 100, alasan: 'Itu persentase biaya untuk seluruh tenor; belum dibagi jumlah hari.' },
      { nilai: (biaya / p.bayar / p.hari) * 100, alasan: 'Pembagi memakai jumlah yang dibayar, padahal batas dihitung dari nilai pendanaan.' },
      { nilai: (biaya / p.pokok / p.hari) * 1000, alasan: 'Salah menempatkan desimal.' },
      { nilai: (biaya / p.pokok / 30) * 100, alasan: 'Dibagi 30 hari, padahal tenornya tidak 30 hari.' },
      { nilai: (p.bayar / p.pokok / p.hari) * 100, alasan: 'Seluruh pembayaran (pokok + manfaat ekonomi) dipakai sebagai pembilang, padahal yang dihitung hanya selisihnya.' },
      { nilai: (biaya / p.pokok / p.hari) * 30 * 100, alasan: 'Itu tingkat per 30 hari, bukan per hari kalender.' },
    ];
  },
  konsep: 'Manfaat ekonomi per hari kalender = (pembayaran − pokok) ÷ pokok ÷ hari', kataKunci: 'tanpa potongan, hari kalender',
  alasan: (p) => {
    const biaya = p.bayar - p.pokok;
    return [`Manfaat ekonomi = ${rp(p.bayar)} − ${rp(p.pokok)} = ${rp(biaya)}.`, `Per hari = ${rp(biaya)} ÷ ${rp(p.pokok)} ÷ ${p.hari} × 100% = ${persen((biaya / p.pokok / p.hari) * 100)}.`];
  },
  caraCepat: 'Biaya ÷ pokok ÷ hari, lalu bandingkan dengan batas sesuai jenis, nilai, dan tenor.',
};

const tKurangKas: TemplateHitung = {
  id: 'kekurangan-kas', tingkat: 'dasar', topik: 'kemampuan bayar',
  sumber: `${S.ebFintech}, §3.1.5 dan contoh soal 4.3`,
  parameter: kombinasi({ pokok: [2e6, 3e6, 5e6], biaya: [120e3, 150e3, 200e3], kas: [1.5e6, 1.8e6, 2.5e6, 4e6] }, (p) => p.kas < p.pokok + p.biaya && p.kas > p.pokok / 2),
  pertanyaan: (p) => `Toko menerima pendanaan ${rp(p.pokok)} tanpa potongan dan harus membayar ${rp(p.pokok + p.biaya)} saat jatuh tempo. Kas toko pada tanggal jatuh tempo ${rp(p.kas)}. Kekurangan kas toko adalah ...`,
  hitung: (p) => p.pokok + p.biaya - p.kas,
  pengecoh: (p) => [
    { nilai: p.biaya, alasan: 'Itu biaya pendanaan (manfaat ekonomi), bukan kekurangan kas.' },
    { nilai: p.pokok - p.kas, alasan: 'Biaya pendanaan belum dimasukkan ke tagihan.' },
    { nilai: p.pokok + p.biaya, alasan: 'Itu total tagihan; kas yang tersedia belum dikurangkan.' },
    { nilai: p.pokok + p.biaya - p.kas + p.biaya, alasan: 'Biaya terhitung dua kali.' },
  ],
  konsep: 'Memisahkan biaya pendanaan dan kecukupan kas', kataKunci: 'tagihan jatuh tempo, kas tersedia',
  alasan: (p) => [`Tagihan = ${rp(p.pokok + p.biaya)}; kas = ${rp(p.kas)}.`, `Kekurangan = ${rp(p.pokok + p.biaya)} − ${rp(p.kas)} = ${rp(p.pokok + p.biaya - p.kas)}. Biaya di bawah batas dan kas yang cukup adalah dua pemeriksaan berbeda.`],
  caraCepat: 'Kekurangan = tagihan − kas saat jatuh tempo.',
};

const tRasioBayar: TemplateHitung = {
  id: 'rasio-kemampuan-bayar', tingkat: 'menengah', topik: 'kemampuan bayar',
  sumber: `${S.ebFintech}, §3.1.4 A dan contoh soal 4.7`, berlakuPer: SEOJK_19,
  parameter: kombinasi({ gaji: [4e6, 5e6, 6e6, 8e6, 10e6], persen: [20, 25, 28, 32, 35, 40] }).map((p) => ({ gaji: p.gaji, bayar: (p.gaji * p.persen) / 100 })),
  pertanyaan: (p) => `Penghasilan seorang penerima dana ${rp(p.gaji)} per bulan. Total pembayaran pokok dan manfaat ekonomi kepada seluruh krediturnya ${rp(p.bayar)} per bulan. Rasio pembayaran terhadap penghasilannya adalah ...`,
  hitung: (p) => (p.bayar / p.gaji) * 100,
  format: persen2,
  pengecoh: (p) => [
    { nilai: (p.gaji / p.bayar) * 100, alasan: 'Pembilang dan penyebut terbalik.' },
    { nilai: ((p.gaji - p.bayar) / p.gaji) * 100, alasan: 'Itu porsi penghasilan yang tersisa.' },
    { nilai: (p.bayar / p.gaji) * 10, alasan: 'Salah menempatkan desimal.' },
    { nilai: (p.bayar / (p.gaji + p.bayar)) * 100, alasan: 'Pembagi seharusnya penghasilan saja.' },
  ],
  konsep: 'Rasio pembayaran ke seluruh kreditur terhadap penghasilan', kataKunci: 'seluruh kreditur, penghasilan per bulan',
  alasan: (p) => [`Rasio = ${rp(p.bayar)} ÷ ${rp(p.gaji)} × 100% = ${persen2((p.bayar / p.gaji) * 100)}.`, 'Untuk pendanaan konsumtif sejak 2026, batas rasio ini 30%.'],
  caraCepat: 'Jumlahkan pembayaran ke semua kreditur, bagi penghasilan pada periode yang sama.',
};

/** Batas manfaat ekonomi per hari kalender (%) menurut tabel SEOJK 19/SEOJK.06/2025 yang dikutip e-book. */
const batasHarian = (konsumtif: number, pokok: number, bulan: number) =>
  konsumtif ? (bulan <= 6 ? 0.3 : 0.2) : pokok > 50e6 ? 0.1 : bulan <= 6 ? 0.275 : 0.1;
const SEMUA_BATAS = [0.3, 0.2, 0.275, 0.1];

const tBatasRupiah: TemplateHitung = {
  id: 'batas-rupiah-30-hari', tingkat: 'menantang', topik: 'manfaat ekonomi',
  sumber: `${S.ebFintech}, §3.1.3 (tabel batas manfaat ekonomi)`, berlakuPer: SEOJK_19,
  parameter: [
    ...kombinasi({ konsumtif: [0], pokok: [10e6, 20e6, 40e6], bulan: [3, 9] }),
    ...kombinasi({ konsumtif: [0], pokok: [60e6, 100e6], bulan: [3, 9] }),
    ...kombinasi({ konsumtif: [1], pokok: [2e6, 4e6, 5e6], bulan: [3, 9] }),
  ],
  pertanyaan: (p: Param) => `Pendanaan ${p.konsumtif ? 'konsumtif' : 'produktif'} melalui LPBBTI bernilai ${rp(p.pokok)} dalam perjanjian dengan tenor ${p.bulan} bulan. Menurut tabel batas maksimum manfaat ekonomi SEOJK 19/SEOJK.06/2025, manfaat ekonomi paling tinggi untuk 30 hari kalender pertama adalah ...`,
  hitung: (p) => (p.pokok * batasHarian(p.konsumtif, p.pokok, p.bulan) * 30) / 100,
  pengecoh: (p) => {
    const benar = batasHarian(p.konsumtif, p.pokok, p.bulan);
    return [
      ...SEMUA_BATAS.filter((b) => b !== benar).map((b) => ({ nilai: (p.pokok * b * 30) / 100, alasan: `Memakai batas ${desimal(b)}% per hari yang berlaku untuk kelompok atau tenor lain.` })),
      { nilai: (p.pokok * benar) / 100, alasan: 'Itu batas satu hari saja; belum dikalikan 30 hari.' },
      { nilai: (p.pokok * benar * 30) / 1000, alasan: 'Salah menempatkan desimal persentase.' },
    ];
  },
  konsep: 'Batas manfaat ekonomi dihitung per hari kalender dari nilai pendanaan dalam perjanjian', kataKunci: 'jenis pendanaan, nilai, tenor, 30 hari',
  alasan: (p) => {
    const b = batasHarian(p.konsumtif, p.pokok, p.bulan);
    const kel = p.konsumtif ? 'konsumtif' : p.pokok > 50e6 ? 'produktif di atas Rp50 juta' : 'produktif sampai Rp50 juta';
    return [`Kelompok ${kel}, tenor ${p.bulan} bulan → batas ${desimal(b)}% per hari kalender.`, `Batas 30 hari = ${rp(p.pokok)} × ${desimal(b)}% × 30 = ${rp((p.pokok * b * 30) / 100)}.`];
  },
  caraCepat: 'Pilih baris (jenis dan nilai) dan kolom (tenor) dulu, baru kalikan pokok × batas × hari.',
};

export const fintechHitung = familyHitung({
  id: 'PSJK-FINTECH-HITUNG', versi: 2, nama: 'Hitungan pinjaman daring', chapter: 'fintech', label: 'VARIASI',
  sumber: S.ebFintech,
  ringkas: 'Manfaat ekonomi per hari kalender, kekurangan kas saat jatuh tempo, rasio pembayaran terhadap penghasilan, dan batas rupiah manfaat ekonomi 30 hari dari tabel SEOJK 19/SEOJK.06/2025.',
}, [tManfaatHarian, tKurangKas, tRasioBayar, tBatasRupiah]);

export const FAMILIES_FINTECH = [fintechIstilah, fintechKasus, fintechHitung];
