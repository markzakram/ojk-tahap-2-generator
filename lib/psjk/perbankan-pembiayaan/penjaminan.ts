import { familyKurasi, familyRelasi, type TabelRelasi } from '../umum';
import { alasanRelasi, baris, butir, kalimatRelasi, SUMBER as S } from './bantu';
import { bulat, familyHitung, kali, kombinasi, miliar, rp, type TemplateHitung } from './hitung';

// Chapter Lembaga Penjaminan (kebutuhan 15). Tiga family:
//   PSJK-JAMIN-ISTILAH  SHL      relasi dua arah: istilah penjaminan (terjamin, penerima jaminan, penjamin, klaim, subrogasi, ...)
//   PSJK-JAMIN-KASUS    VARIASI  peran tiga pihak dalam kasus kredit dan pengadaan, klaim dan tenggat, subrogasi, LPS vs
//                                 penjaminan kredit, peran OJK, jenis lembaga penjamin
//   PSJK-JAMIN-HITUNG   VARIASI  pembayaran klaim dari dasar klaim, bagian risiko bank, gearing ratio

const UU_JAMIN = 'UU 1/2016 jo. UU 4/2023; POJK 11/2025';
const POJK_11 = 'POJK 11/2025 (Pasal 33–34)';

const ISTILAH: TabelRelasi = {
  id: 'istilah-penjaminan',
  topik: 'istilah penjaminan',
  tanyaNilai: (s) => `Dalam usaha penjaminan, ${s} adalah ...`,
  tanyaSubjek: (n) => `Dalam usaha penjaminan, istilah untuk ${n} adalah ...`,
  alasanSalah: alasanRelasi('adalah'),
  kalimat: kalimatRelasi('adalah'),
  konsep: 'Penjaminan melibatkan terjamin (pihak yang kewajibannya dijamin), penerima jaminan (pihak yang dilindungi), dan penjamin; klaim, subrogasi, IJP, dan penjaminan ulang menjelaskan arus pembayaran dan risiko.',
  caraCepat: 'Petakan tiga pihak dulu: siapa wajib membayar (terjamin), siapa dilindungi (penerima jaminan), siapa memberi jaminan (penjamin).',
  baris: [
    baris('terjamin', 'terjamin', 'pihak yang kewajibannya dijamin', 'dasar', `${S.ebJamin}, Istilah Dasar dan §3.1.1 A`, UU_JAMIN),
    baris('penerima', 'penerima jaminan', 'pihak yang menerima perlindungan atas kewajiban pihak lain yang dijamin, misalnya bank pemberi kredit', 'dasar', `${S.ebJamin}, Istilah Dasar dan §3.1.1 A`, UU_JAMIN),
    baris('penjamin', 'penjamin', 'lembaga yang memberikan jaminan sesuai perjanjian', 'dasar', `${S.ebJamin}, Istilah Dasar`, UU_JAMIN),
    baris('klaim', 'klaim', 'permintaan pembayaran dari penerima jaminan kepada penjamin atas kewajiban yang dijamin', 'dasar', `${S.ebJamin}, Istilah Dasar dan §3.1.2`, UU_JAMIN),
    baris('subrogasi', 'subrogasi', 'peralihan hak tagih kepada penjamin sejak klaim dibayar', 'menengah', `${S.ebJamin}, §3.1.2 C`, POJK_11),
    baris('hak-tagih', 'hak tagih', 'hak untuk meminta pembayaran kewajiban', 'dasar', `${S.ebJamin}, Istilah Dasar`),
    baris('ijp', 'Imbal Jasa Penjaminan (IJP)', 'imbalan yang diterima perusahaan penjaminan atas jasa yang diberikannya', 'dasar', `${S.ebJamin}, §3.1.2 A`),
    baris('kafalah', 'kafalah', 'akad pemberian jaminan atas kewajiban pihak yang dijamin dalam penjaminan syariah', 'menengah', `${S.ebJamin}, §3.1.3 A`),
    baris('ulang', 'penjaminan ulang', 'perlindungan bagi perusahaan penjaminan atas risiko yang telah diterimanya', 'menengah', `${S.ebJamin}, §3.1.1 A dan §3.1.3`),
    baris('retensi', 'retensi sendiri', 'bagian risiko yang tetap ditanggung penjamin setelah sebagian risikonya dijamin ulang', 'menantang', `${S.ebJamin}, §3.1.3 B`),
    baris('sertifikat', 'sertifikat penjaminan', 'dokumen yang menjadi bukti pemberian jaminan dan memuat nilai, cakupan, serta syarat klaim', 'menengah', `${S.ebJamin}, §3.1.1 B dan §3.1.2 A`),
    baris('gearing', 'gearing ratio', 'perbandingan nilai penjaminan berjalan setelah dikurangi bagian yang dijamin ulang terhadap ekuitas', 'menantang', `${S.ebJamin}, §3.1.3 C`, 'POJK 11/2025'),
    baris('aksesoir', 'aksesoir', 'sifat perjanjian penjaminan yang mengikuti kewajiban dalam perjanjian pokok', 'menengah', `${S.ebJamin}, §3.1.1 B`),
  ],
};

export const jaminIstilah = familyRelasi({
  id: 'PSJK-JAMIN-ISTILAH', nama: 'Istilah penjaminan', chapter: 'lembaga-penjaminan', label: 'SHL',
  sumber: S.ebJamin,
  ringkas: 'Relasi dua arah untuk istilah penjaminan: terjamin, penerima jaminan, penjamin, klaim, subrogasi, hak tagih, IJP, kafalah, penjaminan ulang, retensi sendiri, sertifikat penjaminan, gearing ratio, aksesoir.',
}, [ISTILAH]);

const ALASAN_LEMBAGA = 'Lembaga ini termasuk lembaga penjamin yang memperoleh izin usaha dari OJK, jadi bukan jawaban.';

export const jaminKasus = familyKurasi({
  id: 'PSJK-JAMIN-KASUS', versi: 2, nama: 'Kasus penjaminan', chapter: 'lembaga-penjaminan', label: 'VARIASI',
  sumber: `${S.ebJamin}; ${S.buku7}`,
  ringkas: 'Peran tiga pihak pada kasus kredit dan jaminan pelaksanaan pengadaan, pengajuan dan tenggat klaim (POJK 11/2025), subrogasi dan penagihan, penjaminan kredit vs penjaminan simpanan LPS vs asuransi, peran OJK, jenis lembaga penjamin.',
}, [
  butir('penerima-kredit', 'dasar', 'tiga pihak', {
    tanya: 'Sebuah UMKM menerima kredit dari bank, dan kredit itu dijamin oleh perusahaan penjaminan. Pihak yang berkedudukan sebagai penerima jaminan adalah ...',
    jawab: 'Bank pemberi kredit',
    salah: [
      ['UMKM penerima kredit', 'UMKM adalah terjamin, yaitu pihak yang kewajibannya dijamin.'],
      ['Perusahaan penjaminan', 'Perusahaan penjaminan adalah penjamin.'],
      ['Pemasok bahan baku UMKM', 'Pemasok tidak terlibat dalam hubungan penjaminan kredit ini.'],
      ['OJK sebagai pengawas', 'OJK memberi izin, mengatur, dan mengawasi; bukan pihak dalam perjanjian penjaminan.'],
    ],
    konsep: 'Tiga pihak dalam penjaminan kredit', kunci: 'penerima jaminan',
    alasan: 'Bank adalah pihak yang menerima perlindungan atas bagian kewajiban debitur yang dijamin, sehingga berkedudukan sebagai penerima jaminan.',
    cepat: 'Cari pihak yang berhak menerima pembayaran atas kewajiban yang dijamin.',
    sumber: `${S.ebJamin}, §3.1.1 A dan contoh soal 4.1`, berlaku: UU_JAMIN,
  }),
  butir('terjamin-pengadaan', 'menengah', 'tiga pihak', {
    tanya: 'Dina memperoleh kontrak memasok 50 kursi rotan kepada sebuah hotel. Hotel meminta jaminan pelaksanaan yang diterbitkan perusahaan penjaminan. Dalam hubungan ini, pihak terjamin adalah ...',
    jawab: 'Dina sebagai pemasok kursi',
    salah: [
      ['Hotel sebagai pemesan kursi', 'Hotel berhak atas pelaksanaan kontrak, sehingga berkedudukan sebagai penerima jaminan.'],
      ['Perusahaan penjaminan', 'Perusahaan yang menerbitkan jaminan pelaksanaan adalah penjamin.'],
      ['Bank tempat Dina menabung', 'Bank tidak menjadi pihak dalam jaminan pelaksanaan ini.'],
      ['OJK sebagai pengawas', 'OJK mengawasi industri, bukan pihak yang kewajibannya dijamin.'],
    ],
    konsep: 'Penjaminan di luar kredit: jaminan pelaksanaan pengadaan', kunci: 'kewajiban menyerahkan kursi',
    alasan: 'Dina berkewajiban menyerahkan kursi sesuai kontrak, sehingga kewajibannya yang dijamin; Dina adalah terjamin.',
    cepat: 'Terjamin = pihak yang memikul kewajiban dalam perjanjian pokok.',
    sumber: `${S.ebJamin}, §3.1.3 dan §3.1.4 E`,
  }),
  butir('penerima-pengadaan', 'menengah', 'tiga pihak', {
    tanya: 'Dalam kontrak pengadaan 50 kursi rotan, hotel meminta jaminan pelaksanaan atas kewajiban pemasok. Bila syarat klaim terpenuhi, pihak yang dapat mengajukan klaim kepada penjamin adalah ...',
    jawab: 'Hotel sebagai penerima jaminan',
    salah: [
      ['Pemasok kursi sebagai terjamin', 'Pemasok adalah pihak yang kewajibannya dijamin, bukan pihak yang mengajukan klaim.'],
      ['Perusahaan penjaminan ulang', 'Penjamin ulang berhubungan dengan perusahaan penjaminan, bukan dengan hotel.'],
      ['Lembaga Penjamin Simpanan', 'LPS menjamin simpanan nasabah bank.'],
      ['OJK sebagai pengawas', 'OJK tidak mengajukan klaim; klaim diputus penjamin sesuai ketentuan.'],
    ],
    konsep: 'Pengajuan klaim oleh penerima jaminan', kunci: 'mengajukan klaim',
    alasan: 'Hotel berhak atas pelaksanaan kontrak dan menerima perlindungan, sehingga hotel sebagai penerima jaminan yang mengajukan klaim bila syaratnya terpenuhi.',
    cepat: 'Yang dilindungi → yang mengajukan klaim.',
    sumber: `${S.ebJamin}, §3.1.4 E`,
  }),
  butir('pengaju-klaim', 'dasar', 'klaim', {
    tanya: 'Dina gagal memenuhi kewajiban kreditnya dan syarat pengajuan klaim dalam dokumen penjaminan terpenuhi. Pihak yang mengajukan klaim kepada penjamin adalah ...',
    jawab: 'Bank pemberi kredit',
    salah: [
      ['Dina sebagai debitur', 'Dina adalah terjamin; ia tidak mengajukan klaim atas kewajibannya sendiri.'],
      ['Pelanggan Dina', 'Pelanggan bukan pihak dalam perjanjian kredit maupun penjaminan.'],
      ['Pemasok rotan', 'Pemasok tidak terlibat dalam penjaminan kredit ini.'],
      ['Perusahaan penjaminan ulang', 'Bank tetap mengajukan klaim kepada perusahaan penjaminan, bukan kepada penjamin ulang.'],
    ],
    konsep: 'Klaim dalam penjaminan kredit', kunci: 'gagal memenuhi kewajiban, syarat klaim terpenuhi',
    alasan: 'Bank adalah penerima jaminan; bank mengajukan permintaan pembayaran (klaim) kepada penjamin.',
    cepat: 'Klaim diajukan oleh penerima jaminan.',
    sumber: `${S.ebJamin}, §3.1.2 dan contoh soal 4.5`,
  }),
  butir('tenggat-keputusan', 'menengah', 'klaim', {
    tanya: 'Menurut ketentuan umum POJK 11 Tahun 2025, lembaga penjamin wajib memutuskan persetujuan atau penolakan klaim paling lama ...',
    jawab: '15 hari kerja sejak permohonan diterima lengkap',
    salah: [
      ['15 hari kerja sejak kredit dicairkan', 'Tenggat dihitung sejak permohonan pembayaran klaim diterima lengkap, bukan sejak pencairan kredit.'],
      ['30 hari kalender sejak debitur menunggak', 'Ketentuan menyebut 15 hari kerja sejak permohonan lengkap.'],
      ['15 hari kerja sejak klaim disetujui', 'Itu awal hitungan tenggat pembayaran klaim, bukan keputusan.'],
      ['7 hari kerja sejak dokumen pertama dikirim', 'Hitungan dimulai sejak permohonan lengkap, dengan tenggat 15 hari kerja.'],
    ],
    konsep: 'Tenggat keputusan klaim penjaminan', kunci: 'memutuskan, permohonan lengkap',
    alasan: 'Pasal 33 ayat (2) POJK 11/2025: keputusan klaim paling lama 15 hari kerja sejak permohonan pembayaran klaim diterima secara lengkap, kecuali tenggat lebih singkat tercantum dalam sertifikat atau perjanjian, atau ketentuan khusus program pemerintah.',
    cepat: 'Keputusan: 15 hari kerja sejak lengkap; pembayaran: 15 hari kerja sejak disetujui.',
    sumber: `${S.ebJamin}, §3.1.2 B`, berlaku: POJK_11,
  }),
  butir('tenggat-bayar', 'menengah', 'klaim', {
    tanya: 'Klaim penjaminan sebuah bank telah disetujui. Menurut ketentuan umum POJK 11 Tahun 2025, lembaga penjamin wajib membayar klaim itu paling lama ...',
    jawab: '15 hari kerja sejak persetujuan diberikan',
    salah: [
      ['15 hari kerja sejak kredit jatuh tempo', 'Tenggat pembayaran dihitung sejak persetujuan klaim.'],
      ['15 hari kerja sejak dokumen pertama dikirim', 'Itu bukan awal hitungan; persetujuan klaim yang menjadi dasar.'],
      ['60 hari kalender sejak persetujuan diberikan', 'Ketentuan menyebut 15 hari kerja sejak persetujuan.'],
      ['Kapan saja setelah debitur melunasi', 'Pembayaran klaim tidak menunggu pelunasan debitur.'],
    ],
    konsep: 'Tenggat pembayaran klaim penjaminan', kunci: 'klaim telah disetujui',
    alasan: 'Pasal 33 ayat (3) POJK 11/2025: klaim yang disetujui dibayar paling lama 15 hari kerja sejak persetujuan, kecuali tenggat lebih singkat tercantum dalam dokumen penjaminan atau ketentuan program pemerintah.',
    cepat: 'Setelah disetujui → maksimal 15 hari kerja untuk membayar.',
    sumber: `${S.ebJamin}, §3.1.2 B`, berlaku: POJK_11,
  }),
  butir('awal-hitung', 'menantang', 'klaim', {
    tanya: 'Bank baru mengirim sebagian dokumen klaim kepada penjamin. Menurut ketentuan umum Pasal 33 POJK 11 Tahun 2025, hitungan batas waktu keputusan klaim dimulai ...',
    jawab: 'Sejak permohonan pembayaran diterima lengkap',
    salah: [
      ['Sejak kredit dicairkan kepada debitur', 'Pencairan kredit terjadi pada hubungan kredit, bukan awal tenggat klaim.'],
      ['Sejak cicilan pertama jatuh tempo', 'Jatuh tempo cicilan tidak menjadi dasar tenggat keputusan klaim.'],
      ['Sejak bank pertama kali menghubungi penjamin', 'Dokumen yang belum lengkap belum memulai tenggat.'],
      ['Sejak klaim disetujui penjamin', 'Persetujuan klaim menjadi awal tenggat pembayaran, bukan tenggat keputusan.'],
    ],
    konsep: 'Awal hitungan tenggat klaim', kunci: 'sebagian dokumen, permohonan lengkap',
    alasan: 'Tenggat keputusan dihitung sejak permohonan pembayaran klaim diterima lengkap; tenggat pembayaran dihitung sejak persetujuan.',
    cepat: 'Pisahkan tanggal dokumen lengkap dari tanggal persetujuan.',
    sumber: `${S.ebJamin}, §3.1.2 B dan contoh soal 4.6`, berlaku: POJK_11,
  }),
  butir('penagihan', 'menengah', 'subrogasi', {
    tanya: 'Setelah penjamin membayar klaim dan hak tagih beralih, bank masih menghubungi Dina untuk menagih bagian kewajiban yang telah dibayar penjamin. Dalam kapasitas apa bank melakukannya?',
    jawab: 'Untuk dan atas nama penjamin sesuai perjanjian',
    salah: [
      ['Sebagai terjamin pengganti Dina', 'Bank bukan pihak yang kewajibannya dijamin.'],
      ['Sebagai perusahaan penjaminan ulang', 'Bank bukan penjamin ulang.'],
      ['Sebagai pemilik seluruh hak tagih yang telah beralih', 'Hak tagih atas bagian yang dibayar sudah beralih kepada penjamin (subrogasi).'],
      ['Sebagai pihak yang menerima kredit', 'Bank adalah pemberi kredit, bukan penerima kredit.'],
    ],
    konsep: 'Subrogasi dan penagihan setelah klaim', kunci: 'hak tagih beralih, bank menagih',
    alasan: 'Pasal 34 POJK 11/2025 mewajibkan penjamin membuat perjanjian dengan penerima jaminan agar penerima jaminan menagih untuk dan atas nama penjamin.',
    cepat: 'Bedakan pemegang hak tagih (penjamin) dari pihak yang menagih (bank).',
    sumber: `${S.ebJamin}, §3.1.2 C dan contoh soal 4.8`, berlaku: POJK_11,
  }),
  butir('kewajiban-tetap', 'menengah', 'subrogasi', {
    tanya: 'Penjamin telah membayar klaim kepada bank atas kredit Dina yang macet. Pernyataan yang tepat mengenai kewajiban Dina adalah ...',
    jawab: 'Kewajiban Dina tetap ada meskipun klaim sudah dibayar.',
    salah: [
      ['Kewajiban Dina otomatis lunas karena klaim sudah dibayar penjamin.', 'Pembayaran klaim terjadi antara penjamin dan penerima jaminan; kewajiban terjamin tidak otomatis selesai.'],
      ['Kewajiban Dina beralih menjadi kewajiban bank.', 'Bank adalah penerima jaminan; yang beralih adalah hak tagih kepada penjamin.'],
      ['Dina berhak menerima sisa pembayaran klaim.', 'Klaim dibayarkan kepada penerima jaminan, bukan kepada terjamin.'],
      ['Kewajiban Dina dihapus oleh OJK.', 'OJK tidak menghapus kewajiban debitur.'],
    ],
    konsep: 'Membedakan pembayaran klaim dan pelunasan kredit', kunci: 'klaim sudah dibayar',
    alasan: 'Subrogasi mengalihkan hak tagih kepada penjamin sejak klaim dibayar; terjamin tetap berkewajiban menyelesaikan utangnya.',
    cepat: 'Klaim dibayar ≠ utang debitur lunas.',
    sumber: `${S.ebJamin}, §3.1.2 C dan §3.1.6`, berlaku: POJK_11,
  }),
  butir('lps-vs-kredit', 'dasar', 'jenis penjaminan', {
    tanya: 'Seorang nasabah ingin memastikan tabungannya di bank terlindungi bila bank dilikuidasi. Lembaga yang menjalankan fungsi penjaminan tersebut adalah ...',
    jawab: 'Lembaga Penjamin Simpanan (LPS)',
    salah: [
      ['Perusahaan penjaminan kredit', 'Perusahaan penjaminan melindungi kreditur atas kewajiban debitur, bukan simpanan nasabah bank.'],
      ['Perusahaan penjaminan ulang', 'Penjamin ulang melindungi perusahaan penjaminan atas risiko yang telah diterimanya.'],
      ['Perusahaan asuransi umum', 'Asuransi mengganti kerugian atas risiko dalam polis, bukan menjamin simpanan bank.'],
      ['Lembaga keuangan mikro', 'LKM dilarang bertindak sebagai penjamin.'],
    ],
    konsep: 'Penjaminan simpanan vs penjaminan kredit', kunci: 'tabungan di bank, likuidasi',
    alasan: 'LPS menjamin simpanan nasabah bank sesuai ketentuan; perusahaan penjaminan memberi perlindungan kepada kreditur atas kewajiban debitur yang dijamin.',
    cepat: 'Simpanan bank → LPS; kredit → perusahaan penjaminan.',
    sumber: `${S.ebJamin}, §3.1.3 dan §3.1.8`,
  }),
  butir('peran-ojk', 'menengah', 'kelembagaan', {
    tanya: 'Dalam kasus klaim penjaminan kredit Dina, peran OJK yang tepat adalah ...',
    jawab: 'Memberi izin usaha, mengatur, dan mengawasi lembaga penjamin',
    salah: [
      ['Memutuskan persetujuan setiap klaim penjaminan atas kredit Dina', 'Keputusan atas pengajuan klaim ditangani perusahaan penjaminan sesuai ketentuan.'],
      ['Membayar klaim kepada bank', 'Klaim dibayar oleh penjamin.'],
      ['Menagih utang Dina setelah klaim dibayar', 'Penagihan dilakukan penerima jaminan untuk dan atas nama penjamin.'],
      ['Menjamin simpanan Dina di bank', 'Penjaminan simpanan adalah fungsi LPS.'],
    ],
    konsep: 'Peran OJK di industri penjaminan', kunci: 'peran OJK',
    alasan: 'OJK memberikan izin usaha kepada lembaga penjamin serta mengatur dan mengawasi kegiatan usahanya; keputusan klaim ditangani perusahaan penjaminan.',
    cepat: 'OJK = izin, aturan, pengawasan; bukan pihak dalam klaim.',
    sumber: `${S.ebJamin}, §3.1.1 A dan D`, berlaku: UU_JAMIN,
  }),
  butir('jenis-kecuali', 'menantang', 'kelembagaan', {
    tanya: 'Lembaga berikut termasuk lembaga penjamin yang memperoleh izin usaha dari OJK, KECUALI ...',
    jawab: 'Lembaga Penjamin Simpanan',
    salah: [
      ['Perusahaan Penjaminan', ALASAN_LEMBAGA],
      ['Perusahaan Penjaminan Syariah', ALASAN_LEMBAGA],
      ['Perusahaan Penjaminan Ulang', ALASAN_LEMBAGA],
      ['Perusahaan Penjaminan Ulang Syariah', ALASAN_LEMBAGA],
    ],
    konsep: 'Jenis lembaga penjamin dan perizinannya', kunci: 'KECUALI, izin usaha dari OJK',
    alasan: 'Perusahaan penjaminan, penjaminan syariah, penjaminan ulang, dan penjaminan ulang syariah memperoleh izin usaha dari OJK; LPS adalah lembaga penjamin simpanan nasabah bank, bukan perusahaan penjaminan berizin OJK.',
    cepat: 'LPS ≠ perusahaan penjaminan.',
    sumber: `${S.ebJamin}, §3.1.1 D dan §3.1.3`, berlaku: 'POJK 1/POJK.05/2017 jo. POJK 10/2025',
  }),
  butir('ijk', 'menengah', 'penjaminan syariah', {
    tanya: 'Dalam penjaminan syariah, imbalan atas jasa kafalah disebut ...',
    jawab: 'Imbal Jasa Kafalah (IJK)',
    salah: [
      ['Imbal Jasa Penjaminan (IJP)', 'IJP adalah sebutan imbalan pada penjaminan konvensional.'],
      ['Nisbah mudharabah', 'Nisbah adalah porsi bagi hasil dalam mudharabah.'],
      ['Margin murabahah', 'Margin adalah keuntungan dalam jual beli murabahah.'],
      ['Premi asuransi', 'Premi adalah pembayaran dalam asuransi.'],
    ],
    konsep: 'Kafalah dan imbal jasa dalam penjaminan syariah', kunci: 'jasa kafalah',
    alasan: 'Imbal jasa penjaminan disebut IJP; dalam penjaminan syariah, imbalan atas jasa kafalah disebut Imbal Jasa Kafalah (IJK).',
    cepat: 'Konvensional → IJP; syariah (kafalah) → IJK.',
    sumber: `${S.ebJamin}, §3.1.3 A`,
  }),
  butir('vs-asuransi', 'menengah', 'jenis penjaminan', {
    tanya: 'Pernyataan yang tepat untuk membedakan penjaminan kredit dari asuransi kendaraan adalah ...',
    jawab: 'Penjaminan melindungi kreditur atas kewajiban debitur.',
    salah: [
      ['Penjaminan kredit mengganti kerusakan kendaraan debitur.', 'Penggantian kerugian atas risiko polis adalah fungsi asuransi.'],
      ['Asuransi kendaraan melindungi bank atas gagal bayar.', 'Asuransi kendaraan mengganti kerugian atas risiko yang dicakup polis.'],
      ['Keduanya sama-sama dijamin LPS.', 'LPS menjamin simpanan nasabah bank.'],
      ['Penjaminan kredit menghapus kewajiban debitur.', 'Kewajiban debitur tetap ada walaupun klaim dibayar.'],
    ],
    konsep: 'Penjaminan vs asuransi', kunci: 'penjaminan kredit, asuransi kendaraan',
    alasan: 'Pada penjaminan kredit, bank menerima perlindungan atas kewajiban debitur yang dijamin; pada asuransi kendaraan, perusahaan asuransi mengganti kerugian atas risiko yang dicakup polis.',
    cepat: 'Kenali dulu yang dilindungi: kewajiban (penjaminan) atau risiko kerugian (asuransi).',
    sumber: `${S.ebJamin}, §3.1.1 E`,
  }),
  butir('ulang-alur', 'menantang', 'penjaminan ulang', {
    tanya: 'Perusahaan penjaminan yang menjamin kredit Dina memiliki perjanjian penjaminan ulang. Ketika Dina gagal bayar dan syarat klaim terpenuhi, bank mengajukan klaim kepada ...',
    jawab: 'Perusahaan penjaminan yang menjamin kredit',
    salah: [
      ['Perusahaan penjaminan ulang secara langsung', 'Hubungan dengan penjamin ulang ditangani perusahaan penjaminan, bukan bank.'],
      ['Dina sebagai terjamin', 'Dina adalah pihak yang kewajibannya dijamin.'],
      ['Lembaga Penjamin Simpanan', 'LPS menjamin simpanan nasabah bank.'],
      ['OJK sebagai pengawas', 'OJK tidak menerima atau membayar klaim.'],
    ],
    konsep: 'Alur klaim ketika ada penjaminan ulang', kunci: 'perjanjian penjaminan ulang',
    alasan: 'Bank tetap mengajukan klaim kepada perusahaan penjaminan; perusahaan penjaminan kemudian menangani hubungan dengan penjamin ulang sesuai perjanjian penjaminan ulang.',
    cepat: 'Penjaminan ulang berada "di belakang" penjamin, tidak berhubungan langsung dengan bank.',
    sumber: `${S.ebJamin}, §3.1.1 A dan §3.1.3 B`,
  }),
  butir('konsentrasi', 'menantang', 'risiko portofolio', {
    tanya: 'Sebagian besar penjaminan sebuah perusahaan diberikan kepada perajin rotan di satu daerah. Risiko yang paling perlu diwaspadai dari portofolio ini adalah ...',
    jawab: 'Klaim dapat muncul bersamaan karena risikonya terkonsentrasi',
    salah: [
      ['Risiko hilang karena debitur berada di satu daerah', 'Konsentrasi justru memperbesar risiko, bukan menghilangkannya.'],
      ['Imbal jasa penjaminan otomatis cukup untuk menutup seluruh klaim', 'IJP adalah imbalan jasa; tidak otomatis cukup menutup klaim yang terkumpul.'],
      ['Ekuitas perusahaan tidak berpengaruh pada klaim', 'Ekuitas dan gearing ratio menentukan kemampuan menanggung risiko.'],
      ['Penjaminan ulang dilarang untuk portofolio ini', 'Penjaminan ulang justru dapat dipakai untuk mengelola risiko.'],
    ],
    konsep: 'Risiko konsentrasi portofolio penjaminan', kunci: 'satu sektor, satu daerah',
    alasan: 'Bila banyak jaminan bergantung pada sektor atau wilayah yang sama, penurunan pesanan di daerah itu dapat membuat banyak terjamin gagal bayar berdekatan sehingga klaim terkumpul dalam periode yang sama.',
    cepat: 'Satu sektor/daerah → risiko serentak.',
    sumber: `${S.ebJamin}, §3.1.3 C`,
  }),
  butir('jamkrindo', 'dasar', 'kelembagaan', {
    tanya: 'Jamkrindo dikenal sebagai lembaga yang bergerak di bidang ...',
    jawab: 'Penjaminan kredit',
    salah: [
      ['Penjaminan simpanan nasabah bank', 'Penjaminan simpanan adalah fungsi LPS.'],
      ['Pembiayaan ekspor nasional', 'Pembiayaan ekspor dijalankan Lembaga Pembiayaan Ekspor Indonesia (LPEI).'],
      ['Pembiayaan sekunder perumahan', 'Pembiayaan sekunder perumahan dijalankan PT Sarana Multigriya Finansial (SMF).'],
      ['Pergadaian', 'Pergadaian memberikan pinjaman dengan jaminan barang bergerak.'],
    ],
    konsep: 'Lembaga penjaminan kredit di Indonesia', kunci: 'Jamkrindo',
    alasan: 'Jamkrindo dibahas OJK sebagai pelaku penjaminan kredit, yang memberi perlindungan kepada kreditur atas kewajiban debitur yang dijamin.',
    cepat: 'Jamkrindo = jaminan kredit.',
    sumber: `${S.buku7}, Bab 9 (Sejarah dan Teori Penjaminan Kredit; Tabel 5 Kantor Wilayah Perum Jamkrindo)`,
  }),
  butir('dasar-hukum', 'dasar', 'regulasi', {
    tanya: 'Undang-undang yang menjadi dasar hukum usaha penjaminan adalah ...',
    jawab: 'UU 1/2016 sebagaimana diubah UU 4/2023',
    salah: [
      ['UU 1/2013 tentang LKM', 'UU 1/2013 mengatur lembaga keuangan mikro.'],
      ['UU 40/2014 tentang Perasuransian', 'UU 40/2014 mengatur perasuransian.'],
      ['UU 21/2008 tentang Perbankan Syariah', 'UU 21/2008 mengatur perbankan syariah.'],
      ['UU 11/1992 tentang Dana Pensiun', 'UU 11/1992 mengatur dana pensiun.'],
    ],
    konsep: 'Dasar hukum penjaminan', kunci: 'dasar hukum usaha penjaminan',
    alasan: 'UU Nomor 1 Tahun 2016 tentang Penjaminan telah diubah melalui UU Nomor 4 Tahun 2023; POJK 10/2025 mengubah ketentuan perizinan dan kelembagaan, POJK 11/2025 mengatur penyelenggaraan usaha.',
    cepat: 'Penjaminan → UU 1/2016 jo. UU P2SK.',
    sumber: `${S.ebJamin}, §3.1.1 C`, berlaku: UU_JAMIN,
  }),
]);

// ---------------------------------------------------------------- hitung

const KLAIM = kombinasi({ kredit: [30e6, 40e6, 50e6, 60e6], dasar: [20e6, 25e6, 30e6, 40e6], cakupan: [60, 70, 75, 80] }, (p) => p.dasar < p.kredit && bulat((p.dasar * p.cakupan) / 100));

const tKlaim: TemplateHitung = {
  id: 'pembayaran-klaim', tingkat: 'menengah', topik: 'pembayaran klaim',
  sumber: `${S.ebJamin}, §3.1.4 C, §3.1.7 B, contoh soal 4.7`,
  parameter: KLAIM,
  pertanyaan: (p) => `Bank memberikan kredit awal ${rp(p.kredit)}. Setelah debitur gagal bayar, penjamin menyetujui ${rp(p.dasar)} sebagai dasar perhitungan klaim. Perjanjian penjaminan menetapkan cakupan ${p.cakupan}% dari dasar klaim yang disetujui. Jumlah yang dibayarkan penjamin kepada bank adalah ...`,
  hitung: (p) => (p.dasar * p.cakupan) / 100,
  pengecoh: (p) => [
    { nilai: (p.kredit * p.cakupan) / 100, alasan: 'Persentase dikalikan dengan kredit awal, padahal dasarnya adalah dasar klaim yang disetujui.' },
    { nilai: p.dasar, alasan: 'Itu seluruh dasar klaim; cakupan penjaminan belum diterapkan.' },
    { nilai: (p.dasar * (100 - p.cakupan)) / 100, alasan: 'Itu bagian yang tetap ditanggung bank.' },
    { nilai: (p.kredit * (100 - p.cakupan)) / 100, alasan: 'Memakai kredit awal dan persentase bagian yang tidak dijamin.' },
    { nilai: p.kredit - p.dasar, alasan: 'Itu selisih kredit awal dan dasar klaim, bukan pembayaran klaim.' },
  ],
  konsep: 'Pembayaran klaim = cakupan × dasar klaim yang disetujui', kataKunci: 'dasar klaim disetujui, cakupan',
  alasan: (p) => [`Pembayaran klaim = ${p.cakupan}% × ${rp(p.dasar)} = ${rp((p.dasar * p.cakupan) / 100)}.`, `Nilai ${rp(p.kredit)} hanya menunjukkan kredit awal.`],
  caraCepat: 'Temukan dasar klaim yang disetujui, lalu kalikan persentase cakupan.',
};

const tBagianBank: TemplateHitung = {
  id: 'bagian-tidak-dijamin', tingkat: 'menantang', topik: 'pembagian risiko',
  sumber: `${S.ebJamin}, §3.1.2 D dan §3.1.4 C`,
  parameter: KLAIM,
  pertanyaan: (p) => `Kredit awal ${rp(p.kredit)}; dasar klaim yang disetujui ${rp(p.dasar)}; cakupan penjaminan ${p.cakupan}% dari dasar klaim. Bagian dasar klaim yang tidak tercakup pembayaran penjamin sehingga tetap menjadi risiko bank adalah ...`,
  hitung: (p) => (p.dasar * (100 - p.cakupan)) / 100,
  pengecoh: (p) => [
    { nilai: (p.dasar * p.cakupan) / 100, alasan: 'Itu pembayaran klaim oleh penjamin.' },
    { nilai: (p.kredit * (100 - p.cakupan)) / 100, alasan: 'Memakai kredit awal, padahal dasarnya dasar klaim yang disetujui.' },
    { nilai: p.kredit - (p.dasar * p.cakupan) / 100, alasan: 'Kredit awal dikurangi klaim, padahal pembanding yang tepat adalah dasar klaim.' },
    { nilai: p.dasar, alasan: 'Itu seluruh dasar klaim.' },
    { nilai: p.kredit - p.dasar, alasan: 'Itu selisih kredit awal dan dasar klaim; bagian bank dihitung dari dasar klaim yang tidak dibayar penjamin.' },
  ],
  konsep: 'Pembagian risiko antara penjamin dan penerima jaminan', kataKunci: 'tidak tercakup, risiko bank',
  alasan: (p) => [`Klaim dibayar = ${p.cakupan}% × ${rp(p.dasar)} = ${rp((p.dasar * p.cakupan) / 100)}.`, `Bagian bank = ${rp(p.dasar)} − ${rp((p.dasar * p.cakupan) / 100)} = ${rp((p.dasar * (100 - p.cakupan)) / 100)}.`],
  caraCepat: 'Bagian bank = (100% − cakupan) × dasar klaim.',
};

const tGearing: TemplateHitung = {
  id: 'gearing-ratio', tingkat: 'menantang', topik: 'kecukupan modal penjamin',
  sumber: `${S.ebJamin}, §3.1.3 C`, berlakuPer: 'POJK 11/2025 (definisi; batas maksimum tidak ditanyakan)',
  parameter: kombinasi({ total: [500, 800, 1000, 1200], ulang: [100, 200, 300], ekuitas: [100, 125, 150, 200, 250] }, (p) => bulat(((p.total - p.ulang) / p.ekuitas) * 10)),
  pertanyaan: (p) => `Nilai penjaminan yang masih berjalan pada sebuah perusahaan penjaminan ${miliar(p.total)}, dengan ${miliar(p.ulang)} di antaranya dijamin ulang. Ekuitas perusahaan ${miliar(p.ekuitas)}. Gearing ratio ilustratifnya adalah ...`,
  hitung: (p) => (p.total - p.ulang) / p.ekuitas,
  format: kali,
  pengecoh: (p) => [
    { nilai: p.total / p.ekuitas, alasan: 'Bagian yang dijamin ulang belum dikurangkan.' },
    { nilai: (p.total + p.ulang) / p.ekuitas, alasan: 'Bagian yang dijamin ulang justru ditambahkan.' },
    { nilai: p.ulang / p.ekuitas, alasan: 'Hanya bagian yang dijamin ulang yang dibandingkan dengan ekuitas.' },
    { nilai: p.ekuitas / (p.total - p.ulang), alasan: 'Pembilang dan penyebut terbalik.' },
  ],
  konsep: 'Gearing ratio = (nilai penjaminan berjalan − bagian dijamin ulang) ÷ ekuitas', kataKunci: 'penjaminan berjalan, dijamin ulang, ekuitas',
  alasan: (p) => [`Gearing ratio = (${miliar(p.total)} − ${miliar(p.ulang)}) ÷ ${miliar(p.ekuitas)} = ${kali((p.total - p.ulang) / p.ekuitas)}.`, 'Bila nilai penjaminan tumbuh lebih cepat daripada ekuitas, rasio ini naik.'],
  caraCepat: 'Kurangi bagian yang dijamin ulang dulu, baru bagi ekuitas.',
};

export const jaminHitung = familyHitung({
  id: 'PSJK-JAMIN-HITUNG', versi: 2, nama: 'Hitungan penjaminan', chapter: 'lembaga-penjaminan', label: 'VARIASI',
  sumber: S.ebJamin,
  ringkas: 'Pembayaran klaim dari dasar klaim yang disetujui (pengecoh: memakai kredit awal), bagian risiko yang tetap ditanggung bank, dan gearing ratio ilustratif.',
}, [tKlaim, tBagianBank, tGearing]);

export const FAMILIES_PENJAMINAN = [jaminIstilah, jaminKasus, jaminHitung];
