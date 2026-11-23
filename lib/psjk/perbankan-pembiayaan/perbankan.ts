import { familyKurasi, familyRelasi, type TabelRelasi } from '../umum';
import { alasanRelasi, baris, butir, kalimatRelasi, SUMBER as S } from './bantu';
import { bulat, familyHitung, kombinasi, miliar, persen2, rp, type Param, type TemplateHitung } from './hitung';

// Chapter Perbankan (kebutuhan 85). Empat family:
//   PSJK-BANK-ISTILAH  SHL      relasi dua arah: produk/jasa bank, analisis 5C, akad bank syariah, rasio bank
//   PSJK-BANK-LEMBAGA  SHL      relasi dua arah: kewenangan OJK, jenis risiko, peran lembaga
//   PSJK-BANK-KASUS    VARIASI  kasus, "KECUALI", pernyataan majemuk (BPR vs bank umum, LPS, Basel, pengawasan, kredit)
//   PSJK-BANK-HITUNG   VARIASI  hitungan: bunga flat, bunga simpanan, NPL, LDR, CAR, margin murabahah, arus kas

const P2SK = 'UU 4/2023 (P2SK)';
const UU_OJK = 'UU 21/2011 jo. UU 4/2023 (P2SK)';

// ---------------------------------------------------------------- relasi

const PRODUK: TabelRelasi = {
  id: 'produk-jasa',
  topik: 'produk dan jasa bank',
  tanyaNilai: (s) => `${s} dalam layanan perbankan adalah ...`,
  tanyaSubjek: (n) => `Produk atau jasa bank berupa ${n} disebut ...`,
  alasanSalah: alasanRelasi('adalah'),
  kalimat: kalimatRelasi('adalah'),
  konsep: 'Produk simpanan (tabungan, giro, deposito) dan jasa bank (transfer, kliring, inkaso, L/C, bank garansi, penyimpanan barang berharga).',
  caraCepat: 'Cari ciri pembeda: ditarik dengan cek → giro; ATM/mobile banking untuk konsumen → tabungan; jatuh tempo → deposito; menagih warkat di tempat lain → inkaso; jaminan bila wanprestasi → bank garansi; dokumen dagang → L/C.',
  baris: [
    baris('tabungan', 'Tabungan', 'simpanan konsumen yang dapat ditarik setiap saat melalui kartu ATM/debit atau mobile banking sesuai ketentuan bank', 'dasar', `${S.bsc}, Bab III (hlm. 30–32)`),
    baris('giro', 'Giro', 'simpanan untuk kepentingan usaha yang dananya dapat ditarik dengan cek', 'dasar', `${S.bsc}, Bab III (hlm. 33)`),
    baris('deposito', 'Deposito berjangka', 'simpanan yang pencairannya dilakukan setelah jangka waktu tertentu sesuai perjanjian', 'dasar', `${S.buku2}, Bab 5 (hlm. 109–110)`),
    baris('bank-garansi', 'Bank garansi', 'jaminan tertulis dari bank untuk membayar pihak penerima jaminan apabila nasabah yang dijamin wanprestasi', 'menengah', `${S.buku2}, Bab 5 (hlm. 132)`),
    baris('inkaso', 'Inkaso', 'kuasa nasabah kepada bank untuk menagih surat berharga yang pembayarnya berada di tempat lain', 'menengah', `${S.buku2}, Bab 5 (hlm. 132–133)`),
    baris('lc', 'Letter of credit (L/C)', 'janji tertulis bank penerbit untuk membayar penerima apabila dokumen yang diserahkan sesuai syarat', 'menengah', `${S.buku2}, Bab 5 (hlm. 127)`),
    baris('kliring', 'Kliring', 'perhitungan utang piutang antarpeserta secara terpusat dengan saling menyerahkan warkat', 'menengah', `${S.buku2}, Bab 5 (hlm. 133)`),
    baris('sdb', 'Safe deposit box', 'kotak penyimpanan barang berharga yang disewakan bank kepada nasabah', 'dasar', `${S.buku2}, Bab 4 (hlm. 94)`),
    baris('kartu-kredit', 'Kartu kredit', 'pinjaman dari bank yang sekaligus menjadi alat pembayaran pengganti uang tunai di merchant', 'dasar', `${S.bsc}, Bab III (hlm. 36)`),
    baris('pemindahbukuan', 'Pemindahbukuan', 'transfer dana ke rekening penerima di bank yang sama', 'dasar', `${S.bsc}, Bab III (hlm. 39)`),
  ],
};

const LIMA_C: TabelRelasi = {
  id: '5c',
  topik: 'analisis kredit 5C',
  tanyaNilai: (s) => `Dalam analisis kredit 5C, aspek ${s} menilai ...`,
  tanyaSubjek: (n) => `Dalam analisis kredit 5C, penilaian terhadap ${n} termasuk aspek ...`,
  alasanSalah: alasanRelasi('menilai'),
  kalimat: kalimatRelasi('menilai'),
  konsep: 'Kerangka 5C (character, capacity, capital, collateral, condition of economy) untuk menilai kelayakan calon debitur; agunan tidak menggantikan kemampuan bayar.',
  caraCepat: 'Watak/riwayat → character; arus kas untuk membayar → capacity; modal sendiri → capital; agunan → collateral; kondisi usaha/ekonomi → condition.',
  baris: [
    baris('character', 'Character', 'watak, riwayat, dan integritas calon debitur', 'dasar', `${S.ebBank}, §3.1.4; ${S.buku2}, Bab 5`),
    baris('capacity', 'Capacity', 'kemampuan calon debitur membayar dari penghasilan atau arus kas usahanya', 'dasar', `${S.ebBank}, §3.1.4 dan contoh soal 4.6`),
    baris('capital', 'Capital', 'besarnya dana milik sendiri yang ditanamkan calon debitur dalam usahanya', 'dasar', `${S.ebBank}, §3.1.4; ${S.buku2}, Bab 5`),
    baris('collateral', 'Collateral', 'agunan yang diserahkan calon debitur bila dipersyaratkan', 'dasar', `${S.ebBank}, §3.1.4; ${S.buku2}, Bab 5`),
    baris('condition', 'Condition of economy', 'keadaan sektor usaha dan perekonomian yang memengaruhi kegiatan calon debitur', 'dasar', `${S.ebBank}, §3.1.4`),
  ],
};

const AKAD: TabelRelasi = {
  id: 'akad-bank-syariah',
  topik: 'akad bank syariah',
  tanyaNilai: (s) => `Dalam perbankan syariah, akad ${s} pada intinya merupakan ...`,
  tanyaSubjek: (n) => `Dalam perbankan syariah, akad yang pada intinya merupakan ${n} adalah akad ...`,
  alasanSalah: alasanRelasi('merupakan', 'akad'),
  kalimat: kalimatRelasi('merupakan', 'akad'),
  konsep: 'Akad bank syariah: titipan (wadiah), bagi hasil (mudharabah, musyarakah), jual beli (murabahah), sewa (ijarah), pengambilalihan utang (hawalah), pinjaman (qardh).',
  caraCepat: 'Titip → wadiah; pemilik dana + pengelola → mudharabah; sama-sama menyetor modal → musyarakah; jual beli dengan margin → murabahah; sewa/ujrah → ijarah; ambil alih utang → hawalah; pinjam kembali pokok → qardh.',
  baris: [
    baris('wadiah', 'wadiah', 'titipan dana atau barang dari nasabah', 'dasar', `${S.ebBank}, §3.1.2 dan §3.1.19`),
    baris('mudharabah', 'mudharabah', 'kerja sama pemilik dana dan pengelola dengan pembagian keuntungan sesuai nisbah', 'dasar', `${S.ebBank}, §3.1.10 dan §3.1.19`),
    baris('musyarakah', 'musyarakah', 'kerja sama usaha dengan penyertaan modal dari para pihak', 'menengah', `${S.ebBank}, §3.1.10 dan §3.1.19`),
    baris('murabahah', 'murabahah', 'jual beli dengan harga perolehan dan margin yang disepakati', 'dasar', `${S.ebBank}, §3.1.10 dan §3.1.19`),
    baris('ijarah', 'ijarah', 'pemanfaatan jasa atau aset dengan imbalan sewa (ujrah)', 'dasar', `${S.ebBank}, §3.1.10 dan §3.1.19`),
    baris('hawalah', 'hawalah', 'pengambilalihan utang', 'menengah', `${S.bpi}, Bab I (Kegiatan Usaha BUS dan UUS)`),
    baris('qardh', 'qardh', 'pinjaman yang pokoknya wajib dikembalikan sesuai kesepakatan', 'menengah', `${S.bpi}, Bab I (Kegiatan Usaha BUS dan UUS); ${S.ebLkm}, §3.1.1 D`),
  ],
};

const RASIO: TabelRelasi = {
  id: 'rasio-bank',
  topik: 'rasio dan indikator bank',
  tanyaNilai: (s) => `Dalam menilai kondisi bank, ${s} mengukur ...`,
  tanyaSubjek: (n) => `Indikator bank yang mengukur ${n} adalah ...`,
  alasanSalah: alasanRelasi('mengukur'),
  kalimat: kalimatRelasi('mengukur'),
  konsep: 'Rasio bank menilai sisi berbeda: permodalan (CAR, leverage), kualitas aset (NPL), efisiensi (BOPO), dan likuiditas (LDR, LCR, NSFR).',
  caraCepat: 'Modal/ATMR → CAR; kredit bermasalah → NPL; biaya/pendapatan operasional → BOPO; kredit/DPK → LDR; aset likuid 30 hari → LCR; pendanaan stabil jangka panjang → NSFR; modal inti/eksposur tanpa bobot → leverage.',
  baris: [
    baris('car', 'CAR (KPMM)', 'kecukupan modal dibandingkan aset tertimbang menurut risiko (ATMR)', 'dasar', `${S.ebBank}, §3.1.22 dan §3.1.23`),
    baris('npl', 'NPL', 'porsi kredit bermasalah terhadap total kredit', 'dasar', `${S.ebBank}, §3.1.22 dan contoh soal 4.18`),
    baris('bopo', 'BOPO', 'perbandingan biaya operasional terhadap pendapatan operasional', 'menengah', `${S.ebBank}, §3.1.22; ${S.buku2}, Bab 6 (hlm. 198)`),
    baris('ldr', 'LDR', 'perbandingan kredit yang disalurkan terhadap dana pihak ketiga', 'menengah', `${S.buku2}, Bab 6 (hlm. 198); ${S.ebBank}, §3.1.17`),
    baris('leverage', 'rasio pengungkit (leverage ratio)', 'modal inti relatif terhadap total eksposur tanpa pembobotan risiko', 'menantang', `${S.bpi}, Bab III.B (Kerangka Leverage)`),
  ],
};

const KEWENANGAN: TabelRelasi = {
  id: 'kewenangan-ojk',
  topik: 'kewenangan OJK di perbankan',
  tanyaNilai: (s) => `Kewenangan OJK terhadap industri perbankan yang disebut ${s} adalah kewenangan untuk ...`,
  tanyaSubjek: (n) => `Kewenangan OJK terhadap industri perbankan untuk ${n} disebut ...`,
  alasanSalah: alasanRelasi('adalah kewenangan untuk'),
  kalimat: kalimatRelasi('adalah kewenangan untuk'),
  konsep: 'Enam kewenangan OJK terhadap perbankan: perizinan, pengaturan, pengawasan, pengenaan sanksi, penyidikan, dan pelindungan konsumen.',
  caraCepat: 'License → izin; regulate → aturan; supervise → on-site/off-site; impose sanction → sanksi; investigate → penyidikan; protect → pelindungan konsumen.',
  baris: [
    baris('license', 'right to license', 'menetapkan tata cara perizinan dan pendirian bank, termasuk memberi dan mencabut izin usaha', 'dasar', `${S.bpi}, Bab II.A`, UU_OJK),
    baris('regulate', 'right to regulate', 'menetapkan ketentuan yang menyangkut aspek usaha dan kegiatan perbankan', 'dasar', `${S.bpi}, Bab II.A`, UU_OJK),
    baris('supervise', 'right to supervise', 'mengawasi bank secara langsung (on-site) dan tidak langsung (off-site)', 'dasar', `${S.bpi}, Bab II.A`, UU_OJK),
    baris('sanction', 'right to impose sanction', 'menjatuhkan sanksi kepada bank yang kurang atau tidak memenuhi ketentuan', 'dasar', `${S.bpi}, Bab II.A`, UU_OJK),
    baris('investigate', 'right to investigate', 'melakukan penyidikan di sektor jasa keuangan, termasuk perbankan', 'dasar', `${S.bpi}, Bab II.A`, UU_OJK),
    baris('protect', 'right to protect', 'melindungi konsumen melalui pencegahan kerugian, pelayanan pengaduan, dan pembelaan hukum', 'dasar', `${S.bpi}, Bab II.A`, UU_OJK),
  ],
};

const RISIKO: TabelRelasi = {
  id: 'jenis-risiko',
  topik: 'jenis risiko bank',
  tanyaNilai: (s) => `Dalam pengawasan bank berbasis risiko, ${s} adalah risiko yang disebabkan oleh ...`,
  tanyaSubjek: (n) => `Dalam pengawasan bank berbasis risiko, risiko yang disebabkan oleh ${n} disebut ...`,
  alasanSalah: alasanRelasi('disebabkan oleh'),
  kalimat: kalimatRelasi('disebabkan oleh'),
  konsep: 'Jenis risiko dalam Risk Based Supervision perbankan: kredit, pasar, likuiditas, operasional, hukum, reputasi, stratejik, dan kepatuhan.',
  caraCepat: 'Pihak lawan gagal bayar → kredit; suku bunga/kurs → pasar; tak mampu bayar kewajiban jatuh tempo → likuiditas; proses/orang/sistem → operasional; yuridis → hukum; publikasi negatif → reputasi; keputusan strategis → stratejik; tidak patuh aturan → kepatuhan.',
  baris: [
    baris('kredit', 'risiko kredit', 'kegagalan pihak lawan (counterparty) memenuhi kewajibannya', 'dasar', `${S.bpi}, Bab II.B (Gambar 2.1)`),
    baris('pasar', 'risiko pasar', 'pergerakan suku bunga, nilai tukar, atau variabel lain yang merugikan portofolio bank', 'dasar', `${S.bpi}, Bab II.B (Gambar 2.1)`),
    baris('likuiditas', 'risiko likuiditas', 'ketidakmampuan bank memenuhi kewajiban yang telah jatuh tempo', 'dasar', `${S.bpi}, Bab II.B (Gambar 2.1)`),
    baris('operasional', 'risiko operasional', 'proses internal yang tidak memadai, kesalahan manusia, kegagalan sistem, atau masalah eksternal', 'menengah', `${S.bpi}, Bab II.B (Gambar 2.1)`),
    baris('hukum', 'risiko hukum', 'kelemahan aspek yuridis, seperti adanya tuntutan atau lemahnya perikatan', 'menengah', `${S.bpi}, Bab II.B (Gambar 2.1)`),
    baris('reputasi', 'risiko reputasi', 'publikasi negatif terkait kegiatan usaha bank atau persepsi negatif terhadap bank', 'menengah', `${S.bpi}, Bab II.B (Gambar 2.1)`),
    baris('stratejik', 'risiko stratejik', 'ketidaktepatan keputusan arah usaha bank dan kegagalan mengantisipasi perubahan lingkungan bisnis', 'menengah', `${S.bpi}, Bab II.B (Gambar 2.1)`),
    baris('kepatuhan', 'risiko kepatuhan', 'bank tidak mematuhi atau tidak melaksanakan peraturan perundang-undangan dan ketentuan yang berlaku', 'menengah', `${S.bpi}, Bab II.B (Gambar 2.1)`),
  ],
};

const LEMBAGA: TabelRelasi = {
  id: 'peran-lembaga',
  topik: 'OJK, BI, LPS, dan kanal terkait',
  tanyaNilai: (s) => `Dalam sistem keuangan Indonesia, ${s} terutama berperan dalam ...`,
  tanyaSubjek: (n) => `Lembaga yang terutama berperan dalam ${n} adalah ...`,
  alasanSalah: alasanRelasi('terutama berperan dalam'),
  kalimat: kalimatRelasi('terutama berperan dalam'),
  konsep: 'Pembagian mandat: OJK (pengaturan dan pengawasan mikroprudensial), BI (moneter, makroprudensial, sistem pembayaran), LPS (penjaminan simpanan dan resolusi bank); LAPS SJK dan Satgas PASTI untuk sengketa dan aktivitas ilegal.',
  caraCepat: 'Bedakan tiga kata kunci: mengawasi bank → OJK; moneter dan pembayaran → BI; menjamin simpanan → LPS.',
  baris: [
    baris('ojk', 'OJK', 'pengaturan dan pengawasan mikroprudensial perbankan', 'dasar', `${S.ebBank}, §3.1.5 dan §3.1.21`, P2SK),
    baris('bi', 'Bank Indonesia', 'kebijakan moneter, makroprudensial, dan sistem pembayaran', 'dasar', `${S.ebBank}, §3.1.5 dan §3.1.21`, P2SK),
    baris('lps', 'LPS', 'penjaminan simpanan nasabah bank dan resolusi bank', 'dasar', `${S.ebBank}, §3.1.5 dan contoh soal 4.3`, P2SK),
    baris('laps', 'LAPS SJK', 'penyelesaian sengketa sektor jasa keuangan di luar pengadilan', 'menengah', `${S.ebDfl}, §3.1.3`),
    baris('pasti', 'Satgas PASTI', 'pemberantasan aktivitas keuangan ilegal', 'menengah', `${S.bpi}, Bab III.A; ${S.ebDfl}, §3.1.3`),
  ],
};

// Tidak dipakai sejak QC T09 (soal SJK tidak menanyakan isi/nama publikasi); disimpan sebagai catatan materi.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const PUBLIKASI: TabelRelasi = {
  id: 'publikasi-perbankan',
  topik: 'publikasi perbankan OJK',
  tanyaNilai: (s) => `Di antara publikasi perbankan, ${s} terutama berisi ...`,
  tanyaSubjek: (n) => `Publikasi perbankan yang terutama berisi ${n} adalah ...`,
  alasanSalah: alasanRelasi('terutama berisi'),
  kalimat: kalimatRelasi('terutama berisi'),
  konsep: 'Setiap publikasi perbankan punya tujuan berbeda: direktori = profil institusi, LSPI = kondisi dan risiko industri, SBPO/IBP = ekspektasi bisnis, Booklet = kebijakan, laporan publikasi = kondisi keuangan bank.',
  caraCepat: 'DPI = profil; LSPI = telaah kinerja dan risiko; SBPO = persepsi/prospek; Booklet = kebijakan; laporan publikasi = keuangan tiap bank.',
  baris: [
    baris('dpi', 'Direktori Perbankan Indonesia', 'profil kelembagaan dan kepengurusan bank', 'menengah', `${S.ebBank}, §3.1.13`),
    baris('lspi', 'Laporan Surveillance Perbankan Indonesia (LSPI)', 'telaah berkala atas kinerja, risiko, serta penyaluran kredit dan pembiayaan perbankan', 'menengah', `${S.ebBank}, §3.1.13`),
    baris('sbpo', 'Survei Orientasi Bisnis Perbankan (SBPO)', 'persepsi bank mengenai kondisi makro, risiko, dan prospek bisnis', 'menengah', `${S.ebBank}, §3.1.13 dan §3.1.24`),
    baris('booklet', 'Booklet Perbankan Indonesia', 'gambaran kebijakan dan ketentuan utama perbankan', 'menengah', `${S.ebBank}, §3.1.13`),
    baris('lap-publikasi', 'laporan publikasi keuangan bank', 'informasi kondisi keuangan masing-masing bank', 'menengah', `${S.ebBank}, §3.1.13`),
  ],
};

export const bankIstilah = familyRelasi({
  id: 'PSJK-BANK-ISTILAH', versi: 2, nama: 'Istilah perbankan (produk, 5C, akad, rasio)', chapter: 'perbankan', label: 'SHL',
  sumber: `${S.ebBank}; ${S.bpi}; ${S.buku2}; ${S.bsc}`,
  ringkas: 'Definisi → istilah dan istilah → definisi untuk produk dan jasa bank, aspek 5C, akad bank syariah, serta rasio bank. Pengecoh adalah istilah atau uraian lain dari tabel yang sama.',
}, [PRODUK, LIMA_C, AKAD, RASIO]);

export const bankLembaga = familyRelasi({
  id: 'PSJK-BANK-LEMBAGA', versi: 2, nama: 'Kewenangan, risiko, dan lembaga perbankan', chapter: 'perbankan', label: 'SHL',
  sumber: `${S.bpi}; ${S.ebBank}; ${S.ebDfl}`,
  ringkas: 'Relasi dua arah untuk enam kewenangan OJK, delapan jenis risiko bank, peran OJK/BI/LPS/LAPS SJK/Satgas PASTI, dan jenis publikasi perbankan.',
}, [KEWENANGAN, RISIKO, LEMBAGA]); // PUBLIKASI dikeluarkan: QC T09 melarang soal tentang isi/nama publikasi

// ---------------------------------------------------------------- kasus

const ALASAN_BOLEH_BPR = 'Kegiatan ini termasuk kegiatan usaha BPR menurut UU P2SK, jadi bukan jawaban.';
const ALASAN_BOLEH_BU = 'Kegiatan ini boleh dilakukan bank umum, jadi bukan jawaban.';

export const bankKasus = familyKurasi({
  id: 'PSJK-BANK-KASUS', versi: 2, nama: 'Kasus dan penerapan perbankan', chapter: 'perbankan', label: 'VARIASI',
  sumber: `${S.ebBank}; ${S.bpi}; ${S.buku2}; ${S.bsc}`,
  ringkas: 'Kasus jenis bank (bank umum vs BPR, UUS), penjaminan LPS, jenis kredit, pengawasan on-site/off-site, IBP, Basel, SLIK, kualitas kredit, peran bank; termasuk bentuk "KECUALI" dan pernyataan majemuk.',
}, [
  butir('giro-umkm', 'dasar', 'bank umum vs BPR', {
    tanya: 'Sebuah usaha kecil membutuhkan rekening giro agar dapat membayar pemasok dengan cek dan bilyet giro. Lembaga yang dapat menyediakan rekening tersebut adalah ...',
    jawab: 'Bank umum',
    salah: [
      ['Bank Perekonomian Rakyat (BPR)', 'BPR dilarang menerima simpanan berupa giro dan tidak memberikan jasa lalu lintas giral secara langsung.'],
      ['BPR Syariah', 'BPR Syariah juga dilarang menerima simpanan berupa giro.'],
      ['Lembaga keuangan mikro', 'LKM dilarang menerima giro dan ikut serta dalam lalu lintas pembayaran.'],
      ['Perusahaan pembiayaan', 'Perusahaan pembiayaan menyalurkan pembiayaan barang/jasa dan tidak menghimpun simpanan seperti giro.'],
      ['Perusahaan pergadaian', 'Pergadaian memberikan pinjaman dengan jaminan barang, bukan membuka rekening giro.'],
    ],
    konsep: 'Perbedaan kegiatan bank umum dan BPR', kunci: 'rekening giro, cek, bilyet giro',
    alasan: ['Bank umum memberikan jasa dalam lalu lintas pembayaran dan dapat menghimpun simpanan berupa giro.', 'BPR dan BPR Syariah tidak menerima giro; lembaga nonbank tidak menghimpun simpanan giro.'],
    cepat: 'Kata kunci "giro" → bank umum (konvensional atau syariah).',
    sumber: `${S.ebBank}, §3.1.1, §3.1.9, contoh soal 4.1; ${S.bpi}, Bab I (Kegiatan Usaha Bank)`, berlaku: P2SK,
  }),
  butir('bpr-transfer', 'menengah', 'bank umum vs BPR', {
    tanya: 'Setelah berlakunya UU P2SK, pernyataan yang tepat mengenai kegiatan usaha Bank Perekonomian Rakyat (BPR) adalah ...',
    jawab: 'BPR dapat melakukan transfer dana, tetapi tidak menerima giro.',
    salah: [
      ['BPR dapat menerima giro dan melakukan transfer dana.', 'BPR tetap dilarang menerima simpanan berupa giro.'],
      ['BPR dapat menerima giro, tetapi tidak boleh transfer dana.', 'Terbalik: giro dilarang, sedangkan transfer dana diperbolehkan.'],
      ['BPR dilarang menerima giro dan melakukan transfer dana.', 'Terlalu luas: UU P2SK membolehkan BPR melakukan transfer dana.'],
      ['BPR hanya boleh mentransfer dana untuk kepentingan sendiri.', 'Transfer dana BPR dapat dilakukan untuk kepentingan sendiri maupun kepentingan nasabah.'],
    ],
    konsep: 'Kegiatan usaha BPR setelah UU P2SK', kunci: 'transfer dana, giro',
    alasan: ['BPR dapat melakukan kegiatan transfer dana untuk kepentingan sendiri maupun nasabah.', 'BPR tetap dilarang menerima simpanan berupa giro dan tidak memberikan jasa lalu lintas giral secara langsung.'],
    cepat: 'BPR: transfer boleh, giro tidak.',
    sumber: `${S.bpi}, Bab I (Kegiatan Usaha BPR); ${S.ebBank}, §3.1.8 dan contoh soal 4.13`, berlaku: P2SK,
  }),
  butir('bpr-kecuali', 'menengah', 'kegiatan BPR', {
    tanya: 'Kegiatan berikut dapat dilakukan Bank Perekonomian Rakyat (BPR) menurut UU P2SK, KECUALI ...',
    jawab: 'Menerima simpanan berupa giro',
    salah: [
      ['Menghimpun tabungan dan deposito berjangka', ALASAN_BOLEH_BPR],
      ['Melakukan usaha penukaran valuta asing', ALASAN_BOLEH_BPR],
      ['Melakukan transfer dana untuk nasabah', ALASAN_BOLEH_BPR],
      ['Menempatkan dana pada bank lain', ALASAN_BOLEH_BPR],
      ['Melakukan kegiatan pengalihan piutang', ALASAN_BOLEH_BPR],
      ['Bekerja sama dengan lembaga jasa keuangan lain', ALASAN_BOLEH_BPR],
    ],
    konsep: 'Kegiatan usaha dan larangan BPR', kunci: 'KECUALI, giro',
    alasan: 'Menerima simpanan berupa giro termasuk larangan kegiatan usaha BPR; kegiatan lainnya tercantum sebagai kegiatan usaha BPR.',
    cepat: 'Larangan khas BPR: giro, usaha valas selain penukaran, penyertaan modal selain pada lembaga penunjang BPR.',
    sumber: `${S.bpi}, Bab I (Kegiatan dan Larangan Kegiatan Usaha BPR)`, berlaku: P2SK,
  }),
  butir('bpr-valas', 'menengah', 'kegiatan BPR', {
    tanya: 'Menurut ketentuan kegiatan usaha BPR, pernyataan yang tepat mengenai valuta asing adalah ...',
    jawab: 'BPR hanya boleh melakukan usaha penukaran valuta asing.',
    salah: [
      ['BPR boleh melakukan semua kegiatan usaha valuta asing.', 'BPR dilarang melakukan kegiatan usaha dalam valuta asing, kecuali penukaran valuta asing.'],
      ['BPR sama sekali dilarang menukar valuta asing.', 'Penukaran valuta asing justru termasuk kegiatan usaha BPR.'],
      ['BPR boleh menerima giro dalam valuta asing.', 'BPR dilarang menerima simpanan berupa giro.'],
      ['Kegiatan valuta asing BPR diizinkan oleh LPS.', 'LPS menjalankan penjaminan simpanan dan resolusi bank, bukan pemberian izin kegiatan usaha bank.'],
    ],
    konsep: 'Batas kegiatan valuta asing BPR', kunci: 'valuta asing, penukaran',
    alasan: 'Larangan BPR mencakup kegiatan usaha dalam valuta asing, dengan pengecualian kegiatan usaha penukaran valuta asing.',
    cepat: 'BPR + valas → hanya penukaran.',
    sumber: `${S.bpi}, Bab I (Kegiatan dan Larangan Kegiatan Usaha BPR)`, berlaku: P2SK,
  }),
  butir('bpr-pernyataan', 'menantang', 'kegiatan BPR', {
    tanya: 'Perhatikan pernyataan tentang Bank Perekonomian Rakyat (BPR) berikut:\n(1) BPR dapat menghimpun dana dalam bentuk tabungan dan deposito berjangka;\n(2) BPR dapat menerima simpanan berupa giro;\n(3) BPR dapat melakukan penawaran umum di bursa efek sesuai ketentuan OJK;\n(4) BPR boleh membeli surat berharga apa pun tanpa pembatasan.\nPernyataan yang benar adalah ...',
    jawab: '(1) dan (3)',
    salah: [
      ['(1) dan (2)', 'Pernyataan (2) salah: BPR dilarang menerima simpanan berupa giro.'],
      ['(2) dan (4)', 'Keduanya salah: BPR dilarang menerima giro dan hanya boleh membeli surat berharga terbitan BI, Pemerintah, atau Pemerintah Daerah.'],
      ['(1), (2), dan (3)', 'Pernyataan (2) salah: BPR dilarang menerima giro.'],
      ['(3) dan (4)', 'Pernyataan (4) salah: pembelian surat berharga oleh BPR dibatasi pada terbitan BI, Pemerintah, atau Pemerintah Daerah.'],
      ['(1), (3), dan (4)', 'Pernyataan (4) salah: BPR tidak boleh membeli sembarang surat berharga.'],
    ],
    konsep: 'Kegiatan, larangan, dan kepemilikan BPR', kunci: 'tabungan, deposito, penawaran umum',
    alasan: ['(1) benar: BPR menghimpun tabungan dan deposito berjangka.', '(3) benar: BPR dapat melakukan penawaran umum di bursa efek dengan syarat dari OJK.', '(2) dan (4) salah karena termasuk larangan BPR.'],
    cepat: 'Coret dulu pernyataan yang memuat larangan BPR (giro, surat berharga bebas).',
    sumber: `${S.bpi}, Bab I (Kegiatan dan Larangan Kegiatan Usaha BPR)`, berlaku: P2SK,
  }),
  butir('uus', 'dasar', 'bank syariah', {
    tanya: 'Sebuah bank umum konvensional memiliki satuan kerja di kantor pusatnya yang menjadi kantor induk bagi kantor-kantor yang beroperasi berdasarkan prinsip syariah. Satuan kerja itu disebut ...',
    jawab: 'Unit Usaha Syariah (UUS)',
    salah: [
      ['Bank Umum Syariah (BUS)', 'BUS adalah bank syariah tersendiri, bukan unit kerja di dalam bank umum konvensional.'],
      ['BPR Syariah', 'BPR Syariah adalah bank syariah tersendiri yang tidak memberikan jasa lalu lintas giral secara langsung.'],
      ['Lembaga Keuangan Mikro Syariah', 'LKM Syariah adalah lembaga berizin usaha LKM, bukan unit kerja bank.'],
      ['Perusahaan Modal Ventura Syariah', 'PMV Syariah adalah perusahaan modal ventura, bukan unit kerja bank umum.'],
    ],
    konsep: 'Perbedaan BUS, UUS, dan BPR Syariah', kunci: 'unit kerja kantor pusat bank umum konvensional',
    alasan: 'UUS adalah unit kerja dari kantor pusat bank umum konvensional yang berfungsi sebagai kantor induk kegiatan berdasarkan prinsip syariah; UUS bukan bank yang berdiri sendiri.',
    cepat: 'Unit di dalam bank konvensional → UUS; bank syariah tersendiri → BUS/BPRS.',
    sumber: `${S.bpi}, Bab I (Definisi); ${S.ebBank}, §3.1.10 dan contoh soal 4.14`, berlaku: P2SK,
  }),
  butir('reksadana-lps', 'menengah', 'penjaminan simpanan', {
    tanya: 'Seorang nasabah membeli reksa dana melalui bank dan mengira produk itu dijamin LPS seperti deposito. Penilaian yang tepat atas anggapan tersebut adalah ...',
    jawab: 'Reksa dana bukan simpanan yang dijamin LPS.',
    salah: [
      ['Reksa dana dijamin LPS karena dibeli di bank.', 'Penjaminan mengikuti jenis produk, bukan tempat membelinya; bank hanya menjadi penjual.'],
      ['Reksa dana dijamin OJK karena bank diawasi OJK.', 'OJK mengatur dan mengawasi, tetapi tidak menjamin produk investasi.'],
      ['Reksa dana dijamin penuh oleh bank penjualnya.', 'Bank penjual tidak menjamin nilai reksa dana; risikonya mengikuti karakter produk investasi.'],
      ['Reksa dana otomatis berubah menjadi deposito.', 'Produk investasi yang dipasarkan bank tidak berubah menjadi deposito.'],
    ],
    konsep: 'Batas penjaminan LPS: simpanan bank vs produk investasi yang dipasarkan bank', kunci: 'reksa dana, dibeli melalui bank',
    alasan: ['LPS menjamin simpanan bank (giro, tabungan, deposito) yang memenuhi syarat.', 'Reksa dana adalah produk investasi pasar modal; dibeli melalui bank tidak menjadikannya simpanan.'],
    cepat: 'Tentukan jenis produknya dulu, bukan tempat membelinya.',
    sumber: `${S.ebBank}, §3.1.3, §3.1.8, contoh soal 4.7; ${S.bsc}, Bab III (hlm. 34, 39)`,
  }),
  butir('lps-3t', 'menengah', 'penjaminan simpanan', {
    tanya: 'Simpanan nasabah layak dibayar LPS ketika bank dilikuidasi bila memenuhi kriteria 3T. Salah satu unsur kriteria itu adalah ...',
    jawab: 'Bunga simpanan tidak melebihi tingkat bunga penjaminan LPS',
    salah: [
      ['Simpanan berbentuk deposito dengan tenor minimal satu tahun', 'Kriteria 3T tidak mensyaratkan jenis atau tenor simpanan tertentu.'],
      ['Bunga simpanan melebihi tingkat bunga penjaminan LPS', 'Terbalik: simpanan dengan bunga di atas tingkat bunga penjaminan LPS justru tidak dijamin.'],
      ['Simpanan juga diasuransikan pada perusahaan asuransi', 'Asuransi tidak termasuk kriteria 3T.'],
      ['Simpanan ditempatkan melalui perusahaan pembiayaan', 'Perusahaan pembiayaan tidak menghimpun simpanan; penjaminan LPS berlaku untuk simpanan di bank.'],
    ],
    konsep: 'Kriteria 3T simpanan layak bayar LPS', kunci: 'kriteria 3T',
    alasan: '3T: simpanan tercatat di bank, tidak melebihi tingkat bunga penjaminan LPS (khusus bank konvensional), dan tidak menyebabkan bank menjadi tidak sehat.',
    cepat: 'Ingat 3T: Tercatat, Tidak melebihi bunga penjaminan, Tidak membuat bank tidak sehat.',
    sumber: `${S.bsc}, Bab III (hlm. 34)`, berlaku: 'ketentuan penjaminan LPS sebagaimana dikutip OJK (2021)',
  }),
  butir('lps-bunga-tinggi', 'menengah', 'penjaminan simpanan', {
    tanya: 'Sebuah bank konvensional menawarkan bunga deposito di atas tingkat bunga penjaminan LPS. Akibatnya bagi deposan adalah ...',
    jawab: 'Simpanan itu tidak memenuhi syarat dijamin LPS.',
    salah: [
      ['Simpanan itu dijamin LPS hingga dua kali lipat.', 'Tidak ada penjaminan berlipat; bunga di atas tingkat penjaminan justru membuat simpanan tidak dijamin.'],
      ['Simpanan itu dijamin OJK sebagai gantinya.', 'OJK tidak menjamin simpanan; fungsi penjaminan simpanan ada pada LPS.'],
      ['Simpanan itu dialihkan menjadi reksa dana.', 'Simpanan tidak berubah menjadi reksa dana; yang terdampak adalah status penjaminannya.'],
      ['Bunga yang tinggi menambah nilai penjaminan LPS.', 'Bunga di atas tingkat bunga penjaminan membuat simpanan tidak dijamin, bukan menambah penjaminan.'],
    ],
    konsep: 'Tingkat bunga penjaminan LPS (LPS rate)', kunci: 'bunga di atas tingkat bunga penjaminan LPS',
    alasan: 'Pada bank konvensional, simpanan yang bunganya melebihi tingkat bunga penjaminan LPS tidak mendapat jaminan; karena itu nasabah perlu memeriksa suku bunga terhadap ketentuan LPS.',
    cepat: 'Bunga > LPS rate → tidak dijamin.',
    sumber: `${S.bsc}, Bab III (hlm. 31–34); ${S.buku2}, Bab 5 (hlm. 110)`, berlaku: 'ketentuan penjaminan LPS sebagaimana dikutip OJK (2021)',
  }),
  butir('lps-batas', 'dasar', 'penjaminan simpanan', {
    tanya: 'Nilai simpanan per nasabah per bank yang dijamin LPS paling tinggi sebesar ...',
    jawab: 'Rp2 miliar per nasabah per bank',
    salah: [
      ['Rp2 miliar per nasabah untuk seluruh bank', 'Batas penjaminan dihitung per nasabah per bank, bukan gabungan seluruh bank.'],
      ['Rp500 juta per nasabah per bank', 'Batas yang disebut sumber adalah Rp2 miliar.'],
      ['Rp1 miliar per nasabah per bank', 'Batas yang disebut sumber adalah Rp2 miliar.'],
      ['Seluruh simpanan tanpa batas nilai', 'Penjaminan LPS memiliki batas maksimum yang ditetapkan pemerintah.'],
      ['Rp2 miliar per rekening tanpa batas rekening', 'Batas berlaku per nasabah per bank, bukan per rekening.'],
    ],
    konsep: 'Batas nilai simpanan yang dijamin LPS', kunci: 'paling tinggi, per nasabah per bank',
    alasan: 'Nilai simpanan yang dijamin LPS paling tinggi Rp2.000.000.000,00 per nasabah per bank; besarannya ditentukan pemerintah.',
    cepat: 'Rp2 miliar, per nasabah, per bank.',
    sumber: `${S.bsc}, Bab III (hlm. 34)`, berlaku: 'ketentuan penjaminan LPS sebagaimana dikutip OJK (2021)',
  }),
  butir('dana-darurat', 'dasar', 'produk simpanan', {
    tanya: 'Seseorang ingin menyimpan dana darurat yang mungkin dipakai dalam beberapa hari ke depan. Produk yang paling sesuai dengan kebutuhan itu adalah ...',
    jawab: 'Tabungan yang dapat ditarik sesuai ketentuan',
    salah: [
      ['Deposito berjangka 12 bulan', 'Deposito dicairkan setelah jatuh tempo; pencairan lebih awal umumnya dikenai penalti.'],
      ['Tabungan berencana yang tidak dapat dicairkan', 'Tabungan berencana disiapkan untuk tujuan jangka tertentu dan tidak dapat dicairkan sebelum jangka waktunya.'],
      ['Reksa dana saham', 'Reksa dana saham adalah produk investasi yang nilainya berfluktuasi, bukan simpanan.'],
      ['Penyertaan saham pada usaha rintisan', 'Penyertaan saham adalah investasi berisiko yang sulit dicairkan dengan cepat.'],
    ],
    konsep: 'Likuiditas produk simpanan', kunci: 'dana darurat, beberapa hari',
    alasan: 'Tabungan memudahkan penarikan setiap saat sesuai ketentuan bank, sehingga cocok untuk kebutuhan dana yang segera.',
    cepat: 'Butuh cepat → produk paling likuid.',
    sumber: `${S.bsc}, Bab III (hlm. 30–33); ${S.ebBank}, §3.1.7 dan contoh soal 4.11`,
  }),
  butir('kredit-modal-kerja', 'dasar', 'jenis kredit', {
    tanya: 'Pemilik toko meminjam dana bank untuk membeli persediaan barang dagangan dan membiayai piutang dagang. Jenis kredit yang paling sesuai adalah ...',
    jawab: 'Kredit modal kerja',
    salah: [
      ['Kredit investasi', 'Kredit investasi membiayai kebutuhan jangka panjang seperti mesin, ruko, atau pabrik.'],
      ['Kredit konsumsi', 'Kredit konsumsi membiayai keperluan konsumtif seperti rumah atau kendaraan pribadi.'],
      ['Kartu kredit', 'Kartu kredit adalah pinjaman yang berfungsi sebagai alat pembayaran pengganti uang tunai.'],
      ['Bank garansi', 'Bank garansi adalah jaminan bank bila nasabah wanprestasi, bukan penyediaan dana usaha.'],
    ],
    konsep: 'Tujuan kredit usaha: modal kerja vs investasi', kunci: 'persediaan, piutang dagang',
    alasan: 'Kredit modal kerja membiayai kebutuhan jangka pendek seperti pembelian persediaan, piutang dagang, dan biaya operasional.',
    cepat: 'Persediaan/operasional → modal kerja; mesin/bangunan → investasi.',
    sumber: `${S.bsc}, Bab III (hlm. 35); ${S.buku2}, Bab 5 (hlm. 112)`,
  }),
  butir('kredit-investasi', 'dasar', 'jenis kredit', {
    tanya: 'Seorang pengusaha meminjam dana jangka panjang untuk membeli mesin dan membangun pabrik baru. Jenis kredit yang paling sesuai adalah ...',
    jawab: 'Kredit investasi',
    salah: [
      ['Kredit modal kerja', 'Kredit modal kerja membiayai kebutuhan jangka pendek seperti persediaan dan piutang dagang.'],
      ['Kredit konsumsi', 'Kredit konsumsi untuk keperluan konsumtif, bukan barang modal usaha.'],
      ['Kartu kredit', 'Kartu kredit adalah alat pembayaran berbasis pinjaman, bukan pembiayaan pabrik.'],
      ['Inkaso', 'Inkaso adalah jasa penagihan surat berharga, bukan pinjaman.'],
    ],
    konsep: 'Tujuan kredit usaha: modal kerja vs investasi', kunci: 'mesin, pabrik, jangka panjang',
    alasan: 'Kredit investasi mendukung kebutuhan dana jangka panjang seperti pembelian mesin, kios, ruko, atau pembangunan pabrik; jangka waktunya umumnya lebih dari tiga tahun.',
    cepat: 'Barang modal jangka panjang → kredit investasi.',
    sumber: `${S.bsc}, Bab III (hlm. 35); ${S.buku2}, Bab 5 (hlm. 112)`,
  }),
  butir('kredit-konsumsi', 'dasar', 'jenis kredit', {
    tanya: 'Kredit Pemilikan Rumah (KPR) untuk rumah yang akan ditempati sendiri termasuk jenis ...',
    jawab: 'Kredit konsumsi',
    salah: [
      ['Kredit modal kerja', 'Kredit modal kerja membiayai operasional usaha, bukan rumah tinggal.'],
      ['Kredit investasi usaha', 'Kredit investasi membiayai barang modal usaha, bukan rumah tinggal pribadi.'],
      ['Bank garansi', 'Bank garansi adalah jaminan bank, bukan kredit pembelian rumah.'],
      ['Letter of credit (L/C)', 'L/C dipakai dalam transaksi dagang berdokumen, bukan kredit rumah.'],
    ],
    konsep: 'Kredit konsumsi', kunci: 'KPR, ditempati sendiri',
    alasan: 'Kredit konsumsi digunakan untuk membeli sesuatu yang sifatnya konsumtif, seperti rumah, kendaraan pribadi, dan keperluan lain; KPR termasuk contohnya.',
    cepat: 'Untuk dipakai sendiri, bukan untuk usaha → konsumsi.',
    sumber: `${S.bsc}, Bab III (hlm. 36)`,
  }),
  butir('onsite', 'dasar', 'pengawasan bank', {
    tanya: 'Tim pengawas OJK mendatangi kantor sebuah bank untuk memeriksa dokumen kredit dan kepatuhan transaksi. Bentuk pengawasan ini adalah ...',
    jawab: 'Pengawasan langsung (on-site)',
    salah: [
      ['Pengawasan tidak langsung (off-site)', 'Off-site dilakukan melalui laporan berkala dan informasi lain tanpa datang ke kantor bank.'],
      ['Kebijakan makroprudensial', 'Kebijakan makroprudensial adalah ranah Bank Indonesia, bukan pemeriksaan di kantor bank.'],
      ['Penjaminan simpanan', 'Penjaminan simpanan adalah fungsi LPS.'],
      ['Penyelesaian sengketa di luar pengadilan', 'Penyelesaian sengketa di luar pengadilan adalah fungsi LAPS SJK.'],
    ],
    konsep: 'Pengawasan on-site dan off-site', kunci: 'mendatangi kantor bank',
    alasan: 'Pengawasan langsung (on-site) berupa pemeriksaan umum atau khusus di bank untuk melihat keadaan keuangan, kepatuhan, dan praktik yang tidak sehat.',
    cepat: 'Datang ke lokasi → on-site; membaca laporan → off-site.',
    sumber: `${S.bpi}, Bab II.A (right to supervise); ${S.ebBank}, contoh soal 4.16`, berlaku: UU_OJK,
  }),
  butir('offsite', 'dasar', 'pengawasan bank', {
    tanya: 'Pengawas OJK memantau kondisi bank dengan menganalisis laporan berkala dan laporan hasil pemeriksaan tanpa datang ke kantor bank. Bentuk pengawasan ini adalah ...',
    jawab: 'Pengawasan tidak langsung (off-site)',
    salah: [
      ['Pengawasan langsung (on-site)', 'On-site berupa pemeriksaan di lokasi bank.'],
      ['Pemeriksaan khusus di kantor bank', 'Pemeriksaan khusus termasuk pengawasan langsung di lokasi.'],
      ['Penjaminan simpanan', 'Penjaminan simpanan adalah fungsi LPS.'],
      ['Penyidikan tindak pidana', 'Penyidikan adalah penegakan hukum, bukan pemantauan laporan berkala.'],
    ],
    konsep: 'Pengawasan on-site dan off-site', kunci: 'laporan berkala, tanpa datang',
    alasan: 'Pengawasan tidak langsung (off-site) memakai alat pemantauan seperti laporan berkala bank, laporan hasil pemeriksaan, dan informasi lainnya.',
    cepat: 'Membaca laporan dari kantor pengawas → off-site.',
    sumber: `${S.bpi}, Bab II.A (right to supervise); ${S.ebBank}, contoh soal 4.20`, berlaku: UU_OJK,
  }),
  butir('ibp-47', 'menengah', 'publikasi perbankan', {
    tanya: 'Hasil Survei Orientasi Bisnis Perbankan (SBPO) menunjukkan Indeks Orientasi Bisnis Perbankan (IBP) sebesar 47. Nilai itu paling tepat ditafsirkan sebagai ...',
    jawab: 'Persepsi bank cenderung pesimistis',
    salah: [
      ['Persepsi bank cenderung optimistis', 'Persepsi optimistis ditunjukkan oleh IBP lebih dari 50.'],
      ['Persepsi bank stabil', 'Persepsi stabil ditunjukkan oleh IBP sama dengan 50.'],
      ['Kredit perbankan tumbuh 47%', 'IBP adalah ukuran persepsi, bukan angka realisasi pertumbuhan kredit.'],
      ['Laba perbankan turun 47%', 'IBP bukan angka realisasi laba perbankan.'],
    ],
    konsep: 'Interpretasi IBP pada SBPO', kunci: 'IBP 47, di bawah 50',
    alasan: 'IBP berkisar 1–100: lebih dari 50 optimistis, sama dengan 50 stabil, dan di bawah 50 pesimistis.',
    cepat: 'Bandingkan dengan 50.',
    sumber: `${S.ebBank}, §3.1.13, §3.1.24, contoh soal 4.22`,
  }),
  butir('ibp-58', 'dasar', 'publikasi perbankan', {
    tanya: 'Indeks Orientasi Bisnis Perbankan (IBP) pada SBPO tercatat 58. Makna nilai tersebut adalah ...',
    jawab: 'Persepsi bank cenderung optimistis',
    salah: [
      ['Persepsi bank cenderung pesimistis', 'Persepsi pesimistis ditunjukkan oleh IBP di bawah 50.'],
      ['Persepsi bank stabil', 'Persepsi stabil ditunjukkan oleh IBP tepat 50.'],
      ['Pertumbuhan kredit pasti 58%', 'IBP mengukur persepsi, bukan menjamin realisasi pertumbuhan.'],
      ['Bank bebas dari risiko', 'IBP tidak menyatakan ketiadaan risiko.'],
    ],
    konsep: 'Interpretasi IBP pada SBPO', kunci: 'IBP 58, di atas 50',
    alasan: 'IBP lebih dari 50 merepresentasikan persepsi optimistis; nilai itu ukuran persepsi, bukan jaminan pertumbuhan.',
    cepat: 'Di atas 50 → optimistis.',
    sumber: `${S.ebBank}, §3.1.13, §3.1.24, contoh soal 4.15`,
  }),
  butir('basel-atmr', 'menengah', 'Basel dan permodalan', {
    tanya: 'Bank A dan Bank B memiliki modal dengan nominal yang sama, tetapi Bank A menempatkan dananya pada aset yang lebih berisiko. Penjelasan yang paling tepat adalah ...',
    jawab: 'Rasio modal terhadap ATMR kedua bank dapat berbeda',
    salah: [
      ['CAR kedua bank sama karena modalnya sama', 'CAR dihitung terhadap ATMR; aset yang lebih berisiko memperbesar ATMR sehingga rasionya bisa lebih kecil.'],
      ['Modal nominal cukup untuk menilai daya serap rugi', 'Besar modal rupiah saja tidak cukup; modal perlu dinilai relatif terhadap ATMR.'],
      ['Aset berisiko tidak memengaruhi kebutuhan modal', 'Kerangka Basel justru menghubungkan kebutuhan modal dengan bobot risiko aset.'],
      ['Bank A lebih kuat karena asetnya memberi imbal hasil lebih tinggi', 'Aset berisiko tinggi memperbesar ATMR; imbal hasil tidak menambah kecukupan modal.'],
    ],
    konsep: 'Modal relatif terhadap aset tertimbang menurut risiko (ATMR)', kunci: 'modal sama, aset lebih berisiko',
    alasan: 'Ukuran modal relatif terhadap ATMR dapat berbeda walaupun modal nominal sama, karena bobot risiko aset kedua bank berbeda.',
    cepat: 'Basel = modal dibandingkan risiko aset, bukan modal rupiah saja.',
    sumber: `${S.ebBank}, §3.1.15, §3.1.23, contoh soal 4.25`,
  }),
  butir('cet1', 'menengah', 'Basel dan permodalan', {
    tanya: 'Dalam kerangka permodalan Basel III yang diadopsi OJK, rasio modal inti utama (CET 1) paling rendah sebesar ... dari ATMR.',
    jawab: '4,5%',
    salah: [
      ['6%', '6% adalah batas paling rendah rasio modal inti (Tier 1).'],
      ['8%', '8% adalah rasio kecukupan modal (CAR) minimum dalam kerangka Basel.'],
      ['3%', '3% adalah batas minimum rasio pengungkit (leverage ratio).'],
      ['2,5%', '2,5% adalah besaran penuh capital conservation buffer, bukan batas CET 1.'],
    ],
    konsep: 'Rasio permodalan Basel III di Indonesia', kunci: 'modal inti utama (CET 1)',
    alasan: 'Ketentuan KPMM bank umum mewajibkan rasio modal inti paling rendah 6% dari ATMR dan rasio modal inti utama paling rendah 4,5% dari ATMR, ditambah buffer sesuai profil risiko.',
    cepat: 'CET 1 = 4,5%; Tier 1 = 6%.',
    sumber: `${S.bpi}, Bab III.B (Kerangka Permodalan); ${S.ebBank}, §3.1.15`, berlaku: 'POJK 11/POJK.03/2016 jo. POJK 27/2022',
  }),
  butir('tier1', 'menengah', 'Basel dan permodalan', {
    tanya: 'Dalam kerangka permodalan Basel III yang diadopsi OJK, rasio modal inti (Tier 1) paling rendah sebesar ... dari ATMR.',
    jawab: '6%',
    salah: [
      ['4,5%', '4,5% adalah batas rasio modal inti utama (CET 1).'],
      ['8%', '8% adalah rasio kecukupan modal (CAR) minimum dalam kerangka Basel.'],
      ['3%', '3% adalah batas minimum rasio pengungkit (leverage ratio).'],
      ['2,5%', '2,5% adalah besaran penuh capital conservation buffer.'],
    ],
    konsep: 'Rasio permodalan Basel III di Indonesia', kunci: 'modal inti (Tier 1)',
    alasan: 'Rasio modal inti (Tier 1) paling rendah 6% dari ATMR, sedangkan modal inti utama (CET 1) paling rendah 4,5%.',
    cepat: 'CET 1 = 4,5%; Tier 1 = 6%.',
    sumber: `${S.bpi}, Bab III.B (Kerangka Permodalan); ${S.ebBank}, §3.1.15`, berlaku: 'POJK 11/POJK.03/2016 jo. POJK 27/2022',
  }),
  butir('basel-pilar', 'menengah', 'Basel dan permodalan', {
    tanya: 'Basel II (2004) memperkenalkan tiga pilar kerangka Basel, yaitu ...',
    jawab: 'Modal minimum, proses reviu pengawasan, dan disiplin pasar',
    salah: [
      ['Risiko kredit, risiko pasar, dan risiko operasional', 'Ketiganya jenis risiko yang diperhitungkan dalam ATMR, bukan tiga pilar Basel.'],
      ['Perizinan, pengaturan, dan penyidikan', 'Ketiganya termasuk kewenangan OJK, bukan pilar Basel.'],
      ['Moneter, makroprudensial, dan sistem pembayaran', 'Ketiganya bidang kewenangan Bank Indonesia.'],
      ['Likuiditas, leverage, dan buffer modal', 'Ketiganya tambahan dalam Basel III, bukan tiga pilar Basel II.'],
    ],
    konsep: 'Tiga pilar Basel', kunci: 'tiga pilar, Basel II',
    alasan: 'BCBS memperkenalkan tiga pilar Basel: Minimum Capital Requirement, Supervisory Review Process, dan Market Discipline.',
    cepat: 'Pilar 1 modal, Pilar 2 pengawasan, Pilar 3 keterbukaan (disiplin pasar).',
    sumber: `${S.bpi}, Bab III.B (Evolusi Kerangka Permodalan Basel); ${S.ebBank}, §3.1.23`,
  }),
  butir('slik', 'dasar', 'informasi debitur', {
    tanya: 'Sejak 2 Januari 2018, layanan informasi debitur yang sebelumnya dikenal sebagai BI Checking dilaksanakan OJK melalui ...',
    jawab: 'Sistem Layanan Informasi Keuangan (SLIK)',
    salah: [
      ['Sistem Informasi Debitur (SID)', 'SID (BI Checking) adalah layanan sebelumnya yang diselenggarakan Bank Indonesia.'],
      ['Direktori Perbankan Indonesia', 'Direktori Perbankan Indonesia memuat profil kelembagaan bank, bukan informasi debitur.'],
      ['Indonesia Anti-Scam Centre (IASC)', 'IASC mengoordinasikan penanganan penipuan transaksi keuangan.'],
      ['Financial Institutions Directory (FIND)', 'FIND adalah direktori pelaku sektor jasa keuangan, bukan informasi debitur.'],
    ],
    konsep: 'Pemantauan kredit melalui SLIK', kunci: '2 Januari 2018, BI Checking',
    alasan: 'Sejak 2 Januari 2018 pemantauan kredit debitur dilakukan OJK melalui SLIK; sebelumnya dilakukan Bank Indonesia melalui BI Checking/SID.',
    cepat: 'Era OJK → SLIK; era BI → SID/BI Checking.',
    sumber: `${S.buku2}, Bab 5 (hlm. 125)`,
  }),
  butir('kolektibilitas', 'menengah', 'kualitas kredit', {
    tanya: 'Urutan kelompok kualitas kredit bank dari yang terbaik hingga yang terburuk adalah ...',
    jawab: 'Lancar, dalam perhatian khusus, kurang lancar, diragukan, macet',
    salah: [
      ['Lancar, kurang lancar, dalam perhatian khusus, diragukan, macet', '"Dalam perhatian khusus" berada tepat setelah lancar, sebelum kurang lancar.'],
      ['Lancar, dalam perhatian khusus, diragukan, kurang lancar, macet', '"Kurang lancar" lebih baik daripada "diragukan".'],
      ['Dalam perhatian khusus, lancar, kurang lancar, diragukan, macet', 'Kategori terbaik adalah lancar.'],
      ['Lancar, diragukan, kurang lancar, dalam perhatian khusus, macet', 'Urutan tengahnya terbalik.'],
    ],
    konsep: 'Lima kategori kualitas kredit', kunci: 'terbaik hingga terburuk',
    alasan: 'Bank mengelompokkan kualitas kredit debitur ke dalam kategori lancar, dalam perhatian khusus, kurang lancar, diragukan, dan macet, lalu membentuk cadangan kerugian (PPAP) sesuai kategori.',
    cepat: 'L–DPK–KL–D–M.',
    sumber: `${S.buku2}, Bab 5 (hlm. 125)`,
  }),
  butir('agent-trust', 'dasar', 'peran bank', {
    tanya: 'Masyarakat bersedia menitipkan dana di bank karena yakin dananya dikelola dengan baik dan dapat ditarik pada waktu yang dijanjikan. Peran bank yang tercermin dari hal ini adalah ...',
    jawab: 'Agent of trust',
    salah: [
      ['Agent of development', 'Agent of development menekankan peran bank mendukung kegiatan ekonomi dan pembangunan.'],
      ['Agent of services', 'Agent of services menekankan jasa bank seperti pengiriman uang dan penitipan barang berharga.'],
      ['Penjaminan simpanan', 'Penjaminan simpanan adalah fungsi LPS, bukan peran bank.'],
      ['Pengawasan mikroprudensial', 'Pengawasan mikroprudensial adalah fungsi OJK.'],
    ],
    konsep: 'Tiga peran bank: agent of trust, agent of development, agent of services', kunci: 'kepercayaan, menitipkan dana',
    alasan: 'Dasar utama kegiatan perbankan adalah kepercayaan, baik dalam menghimpun maupun menyalurkan dana; peran ini disebut agent of trust.',
    cepat: 'Percaya → trust; pembangunan → development; jasa → services.',
    sumber: `${S.buku2}, Bab 1 (hlm. 32–34)`,
  }),
  butir('agent-development', 'dasar', 'peran bank', {
    tanya: 'Bank pemerintah menyalurkan kredit kepada petani untuk ketahanan pangan dan Kredit Usaha Rakyat bagi usaha kecil. Peran bank yang paling tergambar adalah ...',
    jawab: 'Agent of development',
    salah: [
      ['Agent of trust', 'Agent of trust menekankan kepercayaan dalam menghimpun dan menyalurkan dana.'],
      ['Agent of services', 'Agent of services menekankan jasa seperti pengiriman uang dan penitipan barang.'],
      ['Penjaminan simpanan', 'Penjaminan simpanan adalah fungsi LPS.'],
      ['Kebijakan moneter', 'Kebijakan moneter adalah kewenangan Bank Indonesia.'],
    ],
    konsep: 'Tiga peran bank: agent of trust, agent of development, agent of services', kunci: 'kredit petani, KUR, pembangunan',
    alasan: 'Bank disebut agent of development ketika penghimpunan dan penyaluran dananya mendukung pembangunan, misalnya kredit ketahanan pangan, infrastruktur, dan KUR.',
    cepat: 'Mendukung program pembangunan → development.',
    sumber: `${S.buku2}, Bab 1 (hlm. 33–34)`,
  }),
  butir('agent-services', 'dasar', 'peran bank', {
    tanya: 'Selain menghimpun dan menyalurkan dana, bank menawarkan jasa pengiriman uang, penitipan barang berharga, dan pemberian jaminan bank. Peran ini disebut ...',
    jawab: 'Agent of services',
    salah: [
      ['Agent of trust', 'Agent of trust menekankan kepercayaan dalam menghimpun dan menyalurkan dana.'],
      ['Agent of development', 'Agent of development menekankan dukungan bank pada pembangunan ekonomi.'],
      ['Penjaminan simpanan', 'Penjaminan simpanan adalah fungsi LPS.'],
      ['Pengawasan mikroprudensial', 'Pengawasan mikroprudensial adalah fungsi OJK.'],
    ],
    konsep: 'Tiga peran bank: agent of trust, agent of development, agent of services', kunci: 'jasa pengiriman uang, penitipan',
    alasan: 'Agent of services adalah peran bank memberikan jasa perbankan lain, seperti pengiriman uang, penitipan barang berharga, pemberian jaminan bank, dan penyelesaian tagihan.',
    cepat: 'Jasa di luar simpan-pinjam → services.',
    sumber: `${S.buku2}, Bab 1 (hlm. 34)`,
  }),
  butir('laku-pandai', 'dasar', 'layanan digital', {
    tanya: 'Layanan bank melalui agen seperti warung, toko, atau agen keliling dengan dukungan telepon seluler untuk menjangkau masyarakat di luar kantor cabang disebut ...',
    jawab: 'Laku Pandai',
    salah: [
      ['Safe deposit box', 'Safe deposit box adalah kotak penyimpanan barang berharga yang disewakan bank.'],
      ['Kliring', 'Kliring adalah perhitungan utang piutang antarbank secara terpusat.'],
      ['Letter of credit (L/C)', 'L/C adalah janji pembayaran bank dalam transaksi berdokumen.'],
      ['Inkaso', 'Inkaso adalah jasa penagihan surat berharga di tempat lain.'],
    ],
    konsep: 'Layanan Keuangan Tanpa Kantor dalam rangka Keuangan Inklusif (Laku Pandai)', kunci: 'agen, di luar kantor cabang',
    alasan: 'Laku Pandai adalah bentuk branchless banking yang menggabungkan agent banking dan mobile banking untuk memperluas akses layanan keuangan.',
    cepat: 'Agen bank + ponsel → Laku Pandai.',
    sumber: `${S.buku2}, Bab 3 (hlm. 90–91)`,
  }),
  butir('perbankan-digital', 'dasar', 'layanan digital', {
    tanya: 'Layanan bank yang memanfaatkan media elektronik sehingga nasabah dapat bertransaksi secara mandiri, mulai dari pembukaan hingga penutupan rekening, disebut ...',
    jawab: 'Perbankan digital',
    salah: [
      ['Kliring manual', 'Kliring manual adalah tukar-menukar warkat antarpetugas bank, bukan transaksi mandiri nasabah.'],
      ['Inkaso', 'Inkaso adalah jasa penagihan surat berharga.'],
      ['Bank garansi', 'Bank garansi adalah jaminan bank bila nasabah wanprestasi.'],
      ['Safe deposit box', 'Safe deposit box adalah jasa penyimpanan barang berharga.'],
    ],
    konsep: 'Perbankan digital', kunci: 'media elektronik, mandiri',
    alasan: 'Perbankan digital adalah layanan perbankan dengan memanfaatkan media elektronik (electronic delivery channel) yang memungkinkan nasabah bertransaksi secara mandiri.',
    cepat: 'Elektronik + mandiri → perbankan digital.',
    sumber: `${S.bsc}, Bab III (hlm. 44–45)`,
  }),
  butir('lembaga-pernyataan', 'menantang', 'OJK, BI, dan LPS', {
    tanya: 'Perhatikan pernyataan berikut:\n(1) OJK mengatur dan mengawasi bank dari sisi mikroprudensial;\n(2) Bank Indonesia berwenang di bidang sistem pembayaran;\n(3) LPS menjamin simpanan nasabah bank sesuai syarat;\n(4) LPS menetapkan suku bunga kebijakan moneter.\nSeluruh pernyataan yang benar adalah ...',
    jawab: '(1), (2), dan (3)',
    salah: [
      ['(1), (2), dan (4)', 'Pernyataan (4) salah: kebijakan moneter adalah ranah Bank Indonesia, bukan LPS.'],
      ['(1) dan (4)', 'Pernyataan (4) salah: LPS tidak menetapkan suku bunga kebijakan moneter.'],
      ['(2), (3), dan (4)', 'Pernyataan (4) salah; pernyataan (1) justru benar.'],
      ['(3) dan (4)', 'Pernyataan (4) salah; pernyataan (1) dan (2) justru benar.'],
      ['(1) dan (2)', 'Belum lengkap: pernyataan (3) juga benar karena LPS menjamin simpanan nasabah bank sesuai syarat.'],
    ],
    konsep: 'Pembagian kewenangan OJK, BI, dan LPS', kunci: 'mikroprudensial, sistem pembayaran, penjaminan simpanan',
    alasan: ['OJK: pengaturan dan pengawasan mikroprudensial; BI: moneter, makroprudensial, sistem pembayaran; LPS: penjaminan simpanan dan resolusi bank.', 'Hanya pernyataan (4) yang keliru.'],
    cepat: 'Cari pernyataan yang menukar lembaga dengan kewenangan lembaga lain.',
    sumber: `${S.ebBank}, §3.1.5, §3.1.12, §3.1.21`, berlaku: P2SK,
  }),
  butir('deposito-pernyataan', 'menantang', 'produk simpanan', {
    tanya: 'Perhatikan pernyataan tentang deposito berjangka berikut:\n(1) reksa dana yang dijual bank ikut dijamin LPS seperti deposito;\n(2) deposito dapat dijadikan jaminan kredit;\n(3) pencairan sebelum jatuh tempo umumnya dikenai penalti;\n(4) deposito yang jatuh tempo dapat diperpanjang otomatis (automatic roll over).\nSeluruh pernyataan yang benar adalah ...',
    jawab: '(2), (3), dan (4)',
    salah: [
      ['(1), (2), dan (3)', 'Pernyataan (1) salah: reksa dana adalah produk investasi, bukan simpanan yang dijamin LPS.'],
      ['(1) dan (4)', 'Pernyataan (1) salah.'],
      ['(1), (3), dan (4)', 'Pernyataan (1) salah.'],
      ['(2) dan (3)', 'Belum lengkap: pernyataan (4) juga benar karena deposito dapat diperpanjang otomatis.'],
      ['(1), (2), dan (4)', 'Pernyataan (1) salah.'],
    ],
    konsep: 'Karakteristik deposito', kunci: 'jaminan kredit, penalti, roll over',
    alasan: ['(2), (3), dan (4) benar: deposito dapat dijadikan jaminan kredit, dikenai penalti bila ditarik sebelum jangka waktu berakhir, dan dapat diperpanjang otomatis.', '(1) salah: penjaminan LPS berlaku bagi simpanan, bukan produk investasi seperti reksa dana yang dijual melalui bank.'],
    cepat: 'Pisahkan produk simpanan (deposito) dari produk investasi yang hanya dipasarkan melalui bank.',
    sumber: `${S.bsc}, Bab III (hlm. 32–34); ${S.buku2}, Bab 5 (hlm. 109–110); ${S.ebBank}, §3.1.3`,
  }),
  butir('bank-umum-kecuali', 'menantang', 'kegiatan bank umum', {
    tanya: 'Kegiatan berikut dapat dilakukan bank umum, KECUALI ...',
    jawab: 'Menjalankan usaha perasuransian sendiri',
    salah: [
      ['Menerbitkan dan melaksanakan transaksi surat berharga', ALASAN_BOLEH_BU],
      ['Melakukan kegiatan usaha dalam valuta asing', ALASAN_BOLEH_BU],
      ['Bertindak sebagai pendiri dan pengurus dana pensiun', ALASAN_BOLEH_BU],
      ['Memasarkan produk asuransi melalui kerja sama dengan LJK lain', ALASAN_BOLEH_BU],
      ['Menyediakan tempat untuk menyimpan barang dan surat berharga', ALASAN_BOLEH_BU],
    ],
    konsep: 'Kegiatan dan larangan bank umum', kunci: 'KECUALI, usaha perasuransian',
    alasan: 'Bank umum dilarang melakukan usaha perasuransian, kecuali memasarkan produk asuransi dalam rangka kerja sama dengan LJK lain.',
    cepat: 'Bank boleh memasarkan asuransi, tetapi tidak menjadi perusahaan asuransi.',
    sumber: `${S.bpi}, Bab I (Kegiatan dan Larangan Kegiatan Usaha Bank Umum)`, berlaku: P2SK,
  }),
  butir('multijasa', 'menengah', 'bank syariah', {
    tanya: 'Bank syariah membiayai kebutuhan layanan pendidikan seorang nasabah dengan imbalan jasa (ujrah) yang disepakati. Produk ini termasuk ...',
    jawab: 'Pembiayaan multijasa',
    salah: [
      ['Simpanan giro wadiah', 'Giro wadiah adalah simpanan titipan, bukan pembiayaan kebutuhan jasa.'],
      ['Pembiayaan multiguna perusahaan pembiayaan', 'Kasus terjadi di bank syariah; multiguna perusahaan pembiayaan berada pada lembaga dan kerangka usaha berbeda.'],
      ['Penyertaan modal ventura', 'Penyertaan modal ventura adalah kegiatan perusahaan modal ventura.'],
      ['Gadai syariah', 'Gadai syariah memakai jaminan barang, bukan pembiayaan jasa dengan ujrah.'],
    ],
    konsep: 'Pedoman Produk Pembiayaan Multijasa Perbankan Syariah', kunci: 'bank syariah, layanan pendidikan, ujrah',
    alasan: 'Pembiayaan multijasa menyediakan pendanaan untuk kebutuhan jasa tertentu (pendidikan, kesehatan, pariwisata, umrah) dengan ujrah yang disepakati.',
    cepat: 'Bank syariah + jasa + ujrah → multijasa.',
    sumber: `${S.ebBank}, §3.1.11, §3.1.19, contoh soal 4.17`, berlaku: 'Pedoman Produk Pembiayaan Multijasa Perbankan Syariah (OJK, 4 November 2025)',
  }),
  butir('murabahah-margin', 'dasar', 'bank syariah', {
    tanya: 'Bank syariah membeli barang seharga Rp80 juta lalu menjualnya kepada nasabah seharga Rp92 juta yang dibayar bertahap. Selisih Rp12 juta dalam akad ini disebut ...',
    jawab: 'Margin murabahah',
    salah: [
      ['Bunga pinjaman', 'Selisih dalam akad jual beli syariah tidak tepat disebut bunga; karakter kontrak dinilai dari akadnya.'],
      ['Ujrah ijarah', 'Ujrah adalah imbalan sewa atau jasa, bukan keuntungan jual beli.'],
      ['Nisbah mudharabah', 'Nisbah adalah porsi pembagian keuntungan usaha dalam mudharabah.'],
      ['Denda keterlambatan', 'Denda berkaitan dengan keterlambatan pembayaran, bukan selisih harga jual.'],
    ],
    konsep: 'Murabahah: jual beli dengan harga perolehan dan margin', kunci: 'membeli lalu menjual, selisih harga',
    alasan: 'Murabahah adalah jual beli dengan harga perolehan dan margin yang diketahui; harga jual Rp92 juta = harga perolehan Rp80 juta + margin Rp12 juta.',
    cepat: 'Beli–jual + selisih disepakati → margin murabahah.',
    sumber: `${S.ebBank}, §3.1.19 dan contoh soal 4.23`,
  }),
  butir('syariah-imbalan', 'menengah', 'bank syariah', {
    tanya: 'Pernyataan yang tepat mengenai simpanan di bank syariah adalah ...',
    jawab: 'Imbalan simpanan bergantung pada akad yang digunakan.',
    salah: [
      ['Simpanan wadiah memberi bagi hasil sesuai nisbah.', 'Bagi hasil sesuai nisbah adalah ciri mudharabah; wadiah adalah akad titipan.'],
      ['Simpanan syariah memberi imbalan berupa bunga tetap.', 'Bank syariah tidak memakai bunga; imbalan mengikuti akad.'],
      ['Simpanan di bank syariah tidak diawasi OJK.', 'Bank syariah juga diatur dan diawasi OJK.'],
      ['Bank syariah tidak boleh menghimpun simpanan.', 'BUS dan UUS menghimpun simpanan seperti giro, tabungan, dan deposito berdasarkan akad.'],
    ],
    konsep: 'Simpanan bank syariah berbasis akad', kunci: 'imbalan, akad',
    alasan: 'Bentuk manfaat simpanan syariah bergantung pada akad: titipan dapat memakai wadiah, investasi dana nasabah dapat memakai mudharabah.',
    cepat: 'Syariah → lihat akadnya dulu.',
    sumber: `${S.ebBank}, §3.1.2; ${S.bpi}, Bab I (Kegiatan Usaha BUS dan UUS)`,
  }),
  butir('dpk', 'dasar', 'intermediasi', {
    tanya: 'Dana pihak ketiga (DPK) yang dihimpun bank dari masyarakat terutama terdiri atas ...',
    jawab: 'Giro, tabungan, dan deposito',
    salah: [
      ['Modal disetor dan laba ditahan', 'Modal adalah sumber dana dari pemilik, bukan dana pihak ketiga.'],
      ['Kredit dan pembiayaan yang disalurkan', 'Kredit adalah penyaluran dana, bukan penghimpunan.'],
      ['Gedung, mesin, dan kendaraan', 'Itu aset tetap, bukan dana yang dihimpun.'],
      ['Kredit macet dan cadangan kerugian', 'Itu berkaitan dengan kualitas aset, bukan sumber dana.'],
    ],
    konsep: 'Fungsi intermediasi dan dana pihak ketiga', kunci: 'dana pihak ketiga',
    alasan: 'Bank menjalankan intermediasi dengan menerima DPK, terutama giro, tabungan, dan deposito, lalu menyalurkannya sebagai kredit atau pembiayaan.',
    cepat: 'DPK = simpanan masyarakat.',
    sumber: `${S.ebBank}, §3.1.17 dan contoh soal 4.21`,
  }),
  // Butir 'status-pengawasan' (normal/intensif/khusus, Buku 2 OJK 2019) dikeluarkan pada QC Nov 2026: setelah UU P2SK,
  // POJK 28/2023 (BPR/BPRS) dan POJK 5/2024 (bank umum) memakai status "bank dalam penyehatan"; perlu ditulis ulang
  // editor dari sumber terkini sebelum dipakai lagi. Status LKM (POJK 41/2024) tetap ada di PSJK-LKM-KASUS.
  butir('rbs', 'menengah', 'pengawasan bank', {
    tanya: 'Pendekatan pengawasan bank yang memakai strategi dan metodologi berbasis risiko agar pengawas dapat mendeteksi risiko signifikan secara dini disebut ...',
    jawab: 'Risk Based Supervision',
    salah: [
      ['Compliance Based Supervision', 'Pendekatan ini memantau kepatuhan bank terhadap ketentuan atas operasi di masa lalu.'],
      ['Market discipline', 'Market discipline adalah salah satu pilar Basel (keterbukaan), bukan pendekatan pengawasan OJK.'],
      ['Right to regulate', 'Right to regulate adalah kewenangan menetapkan ketentuan.'],
      ['Penjaminan simpanan', 'Penjaminan simpanan adalah fungsi LPS.'],
    ],
    konsep: 'Dua pendekatan pengawasan bank', kunci: 'berbasis risiko, deteksi dini',
    alasan: 'OJK memakai pengawasan berdasarkan kepatuhan dan pengawasan berdasarkan risiko; yang mendeteksi risiko signifikan secara dini adalah Risk Based Supervision.',
    cepat: 'Deteksi dini risiko → RBS; cek kepatuhan masa lalu → CBS.',
    sumber: `${S.bpi}, Bab II.B (Pengawasan Bank)`,
  }),
  butir('penyidikan', 'menengah', 'kewenangan OJK', {
    tanya: 'Menurut Booklet Perbankan Indonesia 2024, penyidikan di sektor jasa keuangan, termasuk perbankan, dilakukan oleh ...',
    jawab: 'Penyidik Polri dan pejabat PNS di lingkungan OJK',
    salah: [
      ['Pejabat LPS bersama pegawai Bank Indonesia', 'LPS dan BI tidak menjalankan fungsi penyidikan sektor jasa keuangan.'],
      ['Anggota Satgas PASTI tanpa melibatkan Polri', 'Satgas PASTI berfokus pada pemberantasan aktivitas keuangan ilegal; penyidikan melibatkan penyidik Polri dan PNS OJK.'],
      ['Hakim pada pengadilan negeri setempat', 'Hakim mengadili perkara, bukan menyidik.'],
      ['Mediator pada LAPS SJK', 'LAPS SJK menyelesaikan sengketa di luar pengadilan, bukan menyidik tindak pidana.'],
    ],
    konsep: 'Kewenangan penyidikan (right to investigate)', kunci: 'penyidikan',
    alasan: 'Penyidikan dilakukan oleh penyidik Kepolisian Negara RI dan pejabat Pegawai Negeri Sipil di lingkungan OJK; hasilnya disampaikan kepada Jaksa untuk penuntutan.',
    cepat: 'Penyidik SJK = Polri + PNS OJK.',
    sumber: `${S.bpi}, Bab II.A (right to investigate)`, berlaku: UU_OJK,
  }),
]);

// ---------------------------------------------------------------- hitung

const FLAT = kombinasi(
  { pokok: [6e6, 9e6, 12e6, 18e6, 24e6, 30e6, 36e6], bunga: [6, 8, 10, 12], bulan: [12, 24] },
  (p) => bulat(p.pokok / p.bulan) && bulat((p.pokok * p.bunga) / 1200),
);
const bungaFlat = (p: Param) => (p.pokok * p.bunga * p.bulan) / 1200;

const tFlatCicilan: TemplateHitung = {
  id: 'flat-cicilan', tingkat: 'menengah', topik: 'bunga flat',
  sumber: `${S.ebBank}, §3.1.4 dan contoh soal 4.5`,
  parameter: FLAT,
  pertanyaan: (p) => `Pinjaman ${rp(p.pokok)} dikenai bunga flat ${p.bunga}% per tahun dengan tenor ${p.bulan} bulan, tanpa biaya lain. Besar angsuran per bulan adalah ...`,
  hitung: (p) => (p.pokok + bungaFlat(p)) / p.bulan,
  pengecoh: (p) => {
    const b = bungaFlat(p);
    return [
      { nilai: p.pokok / p.bulan, alasan: `${rp(p.pokok / p.bulan)} hanya pokok dibagi tenor; bunga belum dimasukkan.` },
      { nilai: (p.pokok + (p.pokok * p.bunga) / 100) / p.bulan, alasan: 'Bunga hanya dihitung untuk satu tahun, padahal tenornya lebih panjang.' },
      { nilai: (p.pokok + b) / 12, alasan: 'Total kewajiban dibagi 12, bukan dibagi jumlah bulan tenor.' },
      { nilai: p.pokok / p.bulan + (p.pokok * p.bunga) / 100, alasan: 'Bunga setahun penuh ditambahkan ke setiap angsuran bulanan.' },
      { nilai: (p.pokok + 2 * b) / p.bulan, alasan: 'Bunga terhitung dua kali.' },
      { nilai: b / p.bulan, alasan: 'Itu hanya porsi bunga per bulan; porsi pokok belum dimasukkan.' },
    ];
  },
  konsep: 'Angsuran dengan bunga flat (bunga dihitung dari pokok awal)', kataKunci: 'bunga flat, tenor, angsuran per bulan',
  alasan: (p) => {
    const b = bungaFlat(p);
    return [`Bunga total = ${rp(p.pokok)} × ${p.bunga}% × ${p.bulan}/12 = ${rp(b)}.`, `Total kewajiban = ${rp(p.pokok + b)}; dibagi ${p.bulan} bulan = ${rp((p.pokok + b) / p.bulan)}.`];
  },
  caraCepat: 'Angsuran flat = pokok/tenor + pokok × bunga tahunan/12.',
};

const tFlatBunga: TemplateHitung = {
  id: 'flat-total-bunga', tingkat: 'dasar', topik: 'bunga flat',
  sumber: `${S.ebBank}, §3.1.4; ${S.ebPp}, §3.1.20`,
  parameter: kombinasi({ pokok: [6e6, 10e6, 12e6, 20e6, 24e6, 30e6], bunga: [6, 8, 10, 12], bulan: [12, 24, 36] }, (p) => bulat((p.pokok * p.bunga) / 1200)),
  pertanyaan: (p) => `Pinjaman ${rp(p.pokok)} dengan bunga flat ${p.bunga}% per tahun selama ${p.bulan} bulan, tanpa biaya lain. Total bunga yang dibayar selama tenor adalah ...`,
  hitung: (p) => bungaFlat(p),
  pengecoh: (p) => {
    const b = bungaFlat(p);
    return [
      { nilai: (p.pokok * p.bunga) / 100, alasan: 'Itu bunga satu tahun saja.' },
      { nilai: (p.pokok * p.bunga) / 1200, alasan: 'Itu bunga satu bulan saja.' },
      { nilai: p.pokok + b, alasan: 'Itu total kewajiban (pokok + bunga), bukan total bunga.' },
      { nilai: (p.pokok * p.bunga * p.bulan) / 100, alasan: 'Tenor dalam bulan tidak dibagi 12 sehingga bunga membengkak.' },
      { nilai: 2 * b, alasan: 'Bunga terhitung dua kali.' },
    ];
  },
  konsep: 'Total bunga flat = pokok × bunga tahunan × waktu (tahun)', kataKunci: 'bunga flat, total bunga',
  alasan: (p) => [`Total bunga = ${rp(p.pokok)} × ${p.bunga}% × ${p.bulan}/12 = ${rp(bungaFlat(p))}.`],
  caraCepat: 'Ubah bulan menjadi tahun (bagi 12), lalu kalikan dengan pokok dan bunga tahunan.',
};

const tBungaSimpanan: TemplateHitung = {
  id: 'bunga-simpanan', tingkat: 'dasar', topik: 'bunga sederhana simpanan',
  sumber: `${S.ebBank}, §3.1.7 dan contoh soal 4.9`,
  parameter: kombinasi({ pokok: [5e6, 10e6, 20e6, 40e6], bunga: [2, 3, 4, 6], bulan: [3, 6, 9] }, (p) => bulat((p.pokok * p.bunga * p.bulan) / 1200)),
  pertanyaan: (p) => `Tabungan ilustratif ${rp(p.pokok)} memperoleh bunga sederhana bruto ${p.bunga}% per tahun selama ${p.bulan} bulan, tanpa perubahan saldo dan sebelum pajak atau biaya. Besar bunganya adalah ...`,
  hitung: (p) => (p.pokok * p.bunga * p.bulan) / 1200,
  pengecoh: (p) => [
    { nilai: (p.pokok * p.bunga) / 100, alasan: 'Itu bunga setahun penuh; waktunya belum disesuaikan dengan jumlah bulan.' },
    { nilai: (p.pokok * p.bunga) / 1200, alasan: 'Itu bunga satu bulan saja.' },
    { nilai: (p.pokok * p.bunga * p.bulan) / 100, alasan: 'Jumlah bulan tidak dikonversi ke tahun (lupa dibagi 12).' },
    { nilai: p.pokok + (p.pokok * p.bunga * p.bulan) / 1200, alasan: 'Itu saldo akhir (pokok + bunga), bukan bunganya.' },
    { nilai: (p.pokok * p.bunga * p.bulan) / 600, alasan: 'Bunga terhitung dua kali.' },
  ],
  konsep: 'Bunga sederhana = pokok × tingkat tahunan × waktu dalam tahun', kataKunci: 'bunga sederhana, per tahun, bulan',
  alasan: (p) => [`Bunga = ${rp(p.pokok)} × ${p.bunga}% × ${p.bulan}/12 = ${rp((p.pokok * p.bunga * p.bulan) / 1200)}.`],
  caraCepat: 'Persentase tahunan dikonversi dulu ke periode bulan yang ditanya.',
};

const tBungaDeposito: TemplateHitung = {
  id: 'bunga-deposito-harian', tingkat: 'menengah', topik: 'bunga deposito',
  sumber: `${S.buku2}, Bab 5 (hlm. 110–111)`,
  parameter: kombinasi({ k: [5, 10, 20, 40], bunga: [3, 4, 5, 6], hari: [30, 60, 90] }),
  pertanyaan: (p) => `Deposito berjangka ${rp(p.k * 3_650_000)} dengan bunga ${p.bunga}% per tahun disimpan selama ${p.hari} hari. Dengan rumus bunga = nominal × tingkat bunga × hari/365 dan sebelum pajak, bunga yang diterima adalah ...`,
  hitung: (p) => (p.k * 3_650_000 * p.bunga * p.hari) / 36_500,
  pengecoh: (p) => {
    const n = p.k * 3_650_000;
    return [
      { nilai: (n * p.bunga * p.hari) / 36_000, alasan: 'Hari bunga dibagi 360, padahal rumus dalam soal memakai 365.' },
      { nilai: (n * p.bunga) / 100, alasan: 'Itu bunga setahun penuh.' },
      { nilai: (n * p.bunga) / 1200, alasan: 'Itu bunga sebulan yang dihitung dengan membagi 12, bukan rumus harian.' },
      { nilai: n + (n * p.bunga * p.hari) / 36_500, alasan: 'Itu nominal ditambah bunga, bukan bunganya saja.' },
      { nilai: (n * p.bunga * p.hari) / 18_250, alasan: 'Bunga terhitung dua kali.' },
    ];
  },
  konsep: 'Bunga deposito metode simple interest harian', kataKunci: 'hari/365',
  alasan: (p) => [`Bunga = ${rp(p.k * 3_650_000)} × ${p.bunga}% × ${p.hari}/365 = ${rp((p.k * 3_650_000 * p.bunga * p.hari) / 36_500)}.`],
  caraCepat: 'Hitung bunga per hari (nominal × bunga ÷ 365), lalu kalikan jumlah hari.',
};

const tNpl: TemplateHitung = {
  id: 'npl', tingkat: 'dasar', topik: 'rasio NPL',
  sumber: `${S.ebBank}, §3.1.22 dan contoh soal 4.18`,
  // rasio beragam (bulat dan berdesimal) agar kunci tidak selalu tampak "rapi" di antara pengecoh berdesimal
  parameter: kombinasi({ total: [200, 300, 400, 500, 600, 800], rasio: [1.25, 1.5, 2.2, 2.75, 3, 3.6, 4.5] }).map((p) => ({ total: p.total, macet: +((p.total * p.rasio) / 100).toFixed(2) })),
  pertanyaan: (p) => `Total kredit sebuah bank ${miliar(p.total)} dan kredit bermasalahnya ${miliar(p.macet)}. NPL bruto ilustratif bank tersebut adalah ...`,
  hitung: (p) => (p.macet / p.total) * 100,
  format: persen2,
  pengecoh: (p) => {
    const b = p.macet;
    const q = (p.macet / p.total) * 100;
    return [
      { nilai: q / 10, alasan: 'Salah menempatkan desimal; hasil bagi belum dikalikan 100% dengan benar.' },
      { nilai: q * 10, alasan: 'Salah menempatkan desimal.' },
      { nilai: (b / (p.total - b)) * 100, alasan: 'Kredit bermasalah dibagi kredit yang lancar, padahal pembaginya total kredit.' },
      { nilai: 100 - q, alasan: 'Itu porsi kredit yang tidak bermasalah.' },
      { nilai: p.total / b, alasan: 'Pembilang dan penyebut terbalik (total kredit ÷ kredit bermasalah) dan hasilnya tidak dikalikan 100%.' },
    ];
  },
  konsep: 'NPL = kredit bermasalah ÷ total kredit × 100%', kataKunci: 'kredit bermasalah, total kredit',
  alasan: (p) => [`NPL = ${miliar(p.macet)} ÷ ${miliar(p.total)} × 100% = ${persen2((p.macet / p.total) * 100)}.`, 'Rasio ini tetap perlu ditafsirkan bersama tren, pencadangan, dan modal.'],
  caraCepat: 'Bermasalah dibagi total, lalu kali 100%.',
};

const tLdr: TemplateHitung = {
  id: 'ldr', tingkat: 'menengah', topik: 'rasio LDR',
  sumber: `${S.buku2}, Bab 6 (hlm. 198); ${S.ebBank}, §3.1.17`,
  parameter: kombinasi({ dpk: [400, 500, 600, 800, 1000], rasio: [72.5, 78, 83.5, 87.5, 92] }).map((p) => ({ dpk: p.dpk, kredit: +((p.dpk * p.rasio) / 100).toFixed(2) })),
  pertanyaan: (p) => `Sebuah bank menyalurkan kredit ${miliar(p.kredit)} dan menghimpun dana pihak ketiga ${miliar(p.dpk)}. Loan to deposit ratio (LDR) ilustratif bank tersebut adalah ...`,
  hitung: (p) => (p.kredit / p.dpk) * 100,
  format: persen2,
  pengecoh: (p) => {
    const k = p.kredit;
    const q = (p.kredit / p.dpk) * 100;
    return [
      { nilai: (p.dpk / k) * 100, alasan: 'Pembilang dan penyebut terbalik: LDR membagi kredit dengan DPK.' },
      { nilai: 100 - q, alasan: 'Itu porsi DPK yang belum disalurkan sebagai kredit.' },
      { nilai: (k / (p.dpk + k)) * 100, alasan: 'Kredit dibagi jumlah kredit dan DPK; pembaginya seharusnya DPK saja.' },
      { nilai: q / 10, alasan: 'Salah menempatkan desimal.' },
    ];
  },
  konsep: 'LDR = kredit yang disalurkan ÷ dana pihak ketiga × 100%', kataKunci: 'kredit, dana pihak ketiga',
  alasan: (p) => [`LDR = ${miliar(p.kredit)} ÷ ${miliar(p.dpk)} × 100% = ${persen2((p.kredit / p.dpk) * 100)}.`, 'LDR termasuk indikator likuiditas: makin tinggi, makin besar porsi DPK yang disalurkan sebagai kredit.'],
  caraCepat: 'Loan (kredit) di atas, deposit (DPK) di bawah.',
};

const tCar: TemplateHitung = {
  id: 'car', tingkat: 'menengah', topik: 'rasio kecukupan modal',
  sumber: `${S.ebBank}, §3.1.15 dan §3.1.23; ${S.bpi}, Bab III.B`,
  parameter: kombinasi({ atmr: [400, 500, 800, 1000, 1200], rasio: [9.5, 10.8, 12.5, 14.2, 16.75, 20] }).map((p) => ({ atmr: p.atmr, modal: +((p.atmr * p.rasio) / 100).toFixed(2) })),
  pertanyaan: (p) => `Sebuah bank memiliki modal ${miliar(p.modal)} dan aset tertimbang menurut risiko (ATMR) ${miliar(p.atmr)}. Rasio kecukupan modal (CAR) ilustratif bank tersebut adalah ...`,
  hitung: (p) => (p.modal / p.atmr) * 100,
  format: persen2,
  pengecoh: (p) => {
    const m = p.modal;
    const q = (p.modal / p.atmr) * 100;
    return [
      { nilai: (p.atmr / m) * 100, alasan: 'Pembilang dan penyebut terbalik: CAR membagi modal dengan ATMR.' },
      { nilai: (m / (p.atmr + m)) * 100, alasan: 'Modal dibagi jumlah ATMR dan modal; pembaginya seharusnya ATMR saja.' },
      { nilai: (m / (p.atmr - m)) * 100, alasan: 'Modal dibagi ATMR yang dikurangi modal; pembaginya seharusnya ATMR saja.' },
      { nilai: q / 10, alasan: 'Salah menempatkan desimal.' },
      { nilai: q * 10, alasan: 'Salah menempatkan desimal.' },
    ];
  },
  konsep: 'CAR = modal ÷ ATMR × 100%', kataKunci: 'modal, ATMR',
  alasan: (p) => [`CAR = ${miliar(p.modal)} ÷ ${miliar(p.atmr)} × 100% = ${persen2((p.modal / p.atmr) * 100)}.`, 'Modal dinilai relatif terhadap aset yang sudah dibobot menurut risikonya.'],
  caraCepat: 'Modal di atas, ATMR di bawah.',
};

const MURABAHAH = kombinasi({ harga: [60e6, 80e6, 100e6, 120e6, 150e6], margin: [10, 12, 15, 20] });

const tMurabahahJual: TemplateHitung = {
  id: 'murabahah-harga-jual', tingkat: 'dasar', topik: 'margin murabahah',
  sumber: `${S.ebBank}, §3.1.19 dan contoh soal 4.23`,
  parameter: MURABAHAH,
  pertanyaan: (p) => `Bank syariah membeli barang yang dibutuhkan nasabah seharga ${rp(p.harga)} dan menjualnya dengan akad murabahah dengan margin ${p.margin}% dari harga perolehan. Harga jual akad adalah ...`,
  hitung: (p) => p.harga + (p.harga * p.margin) / 100,
  pengecoh: (p) => {
    const m = (p.harga * p.margin) / 100;
    return [
      { nilai: m, alasan: 'Itu besarnya margin saja, belum ditambah harga perolehan.' },
      { nilai: p.harga - m, alasan: 'Margin dikurangkan, padahal harga jual = harga perolehan + margin.' },
      { nilai: p.harga, alasan: 'Itu harga perolehan; margin belum ditambahkan.' },
      { nilai: p.harga + 2 * m, alasan: 'Margin terhitung dua kali.' },
    ];
  },
  konsep: 'Harga jual murabahah = harga perolehan + margin yang disepakati', kataKunci: 'harga perolehan, margin',
  alasan: (p) => [`Margin = ${p.margin}% × ${rp(p.harga)} = ${rp((p.harga * p.margin) / 100)}.`, `Harga jual = ${rp(p.harga)} + ${rp((p.harga * p.margin) / 100)} = ${rp(p.harga + (p.harga * p.margin) / 100)}.`],
  caraCepat: 'Harga jual = harga beli × (1 + persentase margin).',
};

const tMurabahahAngsuran: TemplateHitung = {
  id: 'murabahah-angsuran', tingkat: 'menantang', topik: 'margin murabahah',
  sumber: `${S.ebBank}, §3.1.19`,
  parameter: kombinasi({ harga: [60e6, 80e6, 100e6, 120e6, 150e6], margin: [10, 12, 15, 20], bulan: [12, 24] }, (p) => bulat((p.harga + (p.harga * p.margin) / 100) / p.bulan) && bulat(p.harga / p.bulan)),
  pertanyaan: (p) => `Bank syariah membeli barang seharga ${rp(p.harga)} dan menjualnya kepada nasabah dengan akad murabahah dengan margin ${p.margin}% dari harga perolehan. Harga jual dibayar dalam ${p.bulan} angsuran bulanan yang sama besar tanpa biaya lain. Besar angsuran per bulan adalah ...`,
  hitung: (p) => (p.harga + (p.harga * p.margin) / 100) / p.bulan,
  pengecoh: (p) => {
    const m = (p.harga * p.margin) / 100;
    return [
      { nilai: p.harga / p.bulan, alasan: 'Hanya harga perolehan yang dibagi; margin belum dimasukkan.' },
      { nilai: m / p.bulan, alasan: 'Hanya margin yang dibagi; harga perolehan belum dimasukkan.' },
      { nilai: (p.harga + m) / 12, alasan: 'Harga jual dibagi 12, bukan dibagi jumlah angsuran.' },
      { nilai: (p.harga + (m * p.bulan) / 12) / p.bulan, alasan: 'Margin diperlakukan seperti bunga tahunan, padahal margin disepakati sekali dalam harga jual.' },
      { nilai: (p.harga - m) / p.bulan, alasan: 'Margin dikurangkan dari harga perolehan.' },
      { nilai: (p.harga + 2 * m) / p.bulan, alasan: 'Margin terhitung dua kali.' },
    ];
  },
  konsep: 'Murabahah: harga jual (harga perolehan + margin) dibayar bertahap', kataKunci: 'harga perolehan, margin, angsuran',
  alasan: (p) => [`Harga jual = ${rp(p.harga)} + ${p.margin}% × ${rp(p.harga)} = ${rp(p.harga + (p.harga * p.margin) / 100)}.`, `Angsuran = ${rp(p.harga + (p.harga * p.margin) / 100)} ÷ ${p.bulan} = ${rp((p.harga + (p.harga * p.margin) / 100) / p.bulan)}.`],
  caraCepat: 'Hitung harga jual dulu, baru bagi jumlah angsuran.',
};

const tArusKas: TemplateHitung = {
  id: 'capacity-arus-kas', tingkat: 'dasar', topik: 'analisis capacity',
  sumber: `${S.ebBank}, §3.1.20 dan contoh soal 4.24`,
  parameter: kombinasi({ omzet: [40e6, 50e6, 60e6], biaya: [60, 65, 70], hidup: [5e6, 7e6, 8e6] }, (p) => p.omzet - (p.omzet * p.biaya) / 100 - p.hidup > 0),
  pertanyaan: (p) => `Usaha seorang calon debitur memiliki penjualan ${rp(p.omzet)} per bulan, biaya usaha ${rp((p.omzet * p.biaya) / 100)}, dan kebutuhan rumah tangga ${rp(p.hidup)}. Sisa arus kas kasar sebelum kewajiban lain adalah ...`,
  hitung: (p) => p.omzet - (p.omzet * p.biaya) / 100 - p.hidup,
  pengecoh: (p) => {
    const b = (p.omzet * p.biaya) / 100;
    return [
      { nilai: p.omzet - b, alasan: 'Kebutuhan rumah tangga belum dikurangkan.' },
      { nilai: p.omzet - p.hidup, alasan: 'Biaya usaha belum dikurangkan.' },
      { nilai: p.omzet, alasan: 'Itu omzet bruto; analisis capacity berangkat dari arus kas tersedia, bukan omzet.' },
      { nilai: b + p.hidup, alasan: 'Itu jumlah pengeluaran, bukan sisa arus kas.' },
      { nilai: p.omzet - b + p.hidup, alasan: 'Kebutuhan rumah tangga justru ditambahkan.' },
    ];
  },
  konsep: 'Analisis capacity berbasis arus kas tersedia', kataKunci: 'sisa arus kas, sebelum kewajiban lain',
  alasan: (p) => [`Sisa = ${rp(p.omzet)} − ${rp((p.omzet * p.biaya) / 100)} − ${rp(p.hidup)} = ${rp(p.omzet - (p.omzet * p.biaya) / 100 - p.hidup)}.`, 'Angsuran yang melebihi sisa ini akan menekan likuiditas walaupun omzetnya besar.'],
  caraCepat: 'Omzet − biaya usaha − kebutuhan rumah tangga.',
};

export const bankHitung = familyHitung({
  id: 'PSJK-BANK-HITUNG', versi: 2, nama: 'Hitungan perbankan sederhana', chapter: 'perbankan', label: 'VARIASI',
  sumber: `${S.ebBank}; ${S.buku2}; ${S.bpi}`,
  ringkas: 'Bunga flat (angsuran dan total bunga), bunga sederhana tabungan, bunga deposito harian, NPL, LDR, CAR, harga jual dan angsuran murabahah, sisa arus kas (capacity). Pengecoh dari jalur salah hitung.',
}, [tFlatCicilan, tFlatBunga, tBungaSimpanan, tBungaDeposito, tNpl, tLdr, tCar, tMurabahahJual, tMurabahahAngsuran, tArusKas]);

export const FAMILIES_PERBANKAN = [bankIstilah, bankLembaga, bankKasus, bankHitung];
