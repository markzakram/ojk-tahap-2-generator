import { familyKurasi, familyRelasi, type TabelRelasi } from '../umum';
import { alasanRelasi, baris, butir, kalimatRelasi, SUMBER as S } from './bantu';
import { bulat, familyHitung, kombinasi, persen2, rp, type TemplateHitung } from './hitung';

// Chapter Perusahaan Modal Ventura (kebutuhan 15). Tiga family:
//   PSJK-MV-ISTILAH  SHL      relasi dua arah: istilah modal ventura (pasangan usaha, divestasi, Dana Ventura, VCC/VDC, ...)
//   PSJK-MV-KASUS    VARIASI  penyertaan vs pembiayaan, instrumen konversi, arus uang penerbitan vs divestasi, POJK 25/2023
//   PSJK-MV-HITUNG   VARIASI  porsi kepemilikan, valuasi post/pre-money, hasil divestasi, dilusi

const POJK_MV = 'POJK 25/2023';

const ISTILAH: TabelRelasi = {
  id: 'istilah-modal-ventura',
  topik: 'istilah modal ventura',
  tanyaNilai: (s) => `Dalam kegiatan modal ventura, ${s} adalah ...`,
  tanyaSubjek: (n) => `Dalam kegiatan modal ventura, istilah untuk ${n} adalah ...`,
  alasanSalah: alasanRelasi('adalah'),
  kalimat: kalimatRelasi('adalah'),
  konsep: 'Modal ventura: PMV mendanai pasangan usaha melalui penyertaan saham, instrumen konversi, atau pembiayaan; Dana Ventura dikelola VCC bersama bank kustodian; penyertaan diakhiri dengan divestasi.',
  caraCepat: 'Ikuti hak yang diperoleh PMV: saham → penyertaan (diakhiri divestasi); hak bayar → pembiayaan (diakhiri pelunasan).',
  baris: [
    baris('pasangan', 'pasangan usaha', 'perusahaan tempat PMV menanamkan modal atau menyediakan pendanaan', 'dasar', `${S.ebMv}, Istilah Dasar dan §3.1.1 A`),
    baris('divestasi', 'divestasi', 'pelepasan penyertaan, misalnya melalui penjualan saham yang dimiliki', 'dasar', `${S.ebMv}, Istilah Dasar dan §3.1.3 A`),
    baris('konversi', 'konversi', 'perubahan instrumen menjadi saham sesuai syarat yang disepakati', 'dasar', `${S.ebMv}, Istilah Dasar dan §3.1.2 A`),
    baris('dana-ventura', 'Dana Ventura', 'dana yang dihimpun dari investor untuk dikelola dan ditempatkan pada pasangan usaha sesuai perjanjian', 'menengah', `${S.ebMv}, Istilah Dasar dan §3.1.2 B`, POJK_MV),
    baris('unit', 'unit penyertaan', 'bukti bagian investor dalam Dana Ventura', 'menengah', `${S.ebMv}, Istilah Dasar dan §3.1.2 B`, POJK_MV),
    baris('kustodian', 'bank kustodian', 'bank yang menjalankan penitipan kolektif aset Dana Ventura dan menghitung nilai aset bersihnya', 'menengah', `${S.ebMv}, §3.1.2 B`, POJK_MV),
    baris('pelunasan', 'pelunasan', 'penyelesaian kewajiban pembayaran pembiayaan sesuai perjanjian', 'dasar', `${S.ebMv}, Istilah Dasar dan §3.1.3 A`),
    baris('dilusi', 'dilusi', 'turunnya porsi kepemilikan pemegang saham lama karena jumlah seluruh saham bertambah', 'menengah', `${S.ebMv}, §3.1.4 B`),
    baris('post', 'valuasi setelah investasi (post-money)', 'nilai perusahaan yang tercermin dari transaksi setelah dana baru masuk', 'menantang', `${S.ebMv}, §3.1.4 B`),
    baris('pre', 'valuasi sebelum investasi (pre-money)', 'nilai perusahaan yang tercermin dari transaksi sebelum dana baru masuk', 'menantang', `${S.ebMv}, §3.1.4 B`),
    baris('vcc', 'Venture Capital Corporation (VCC)', 'kategori PMV yang berfokus pada penyertaan modal, pembelian obligasi atau sukuk konversi, dan/atau pengelolaan Dana Ventura', 'menantang', `${S.ebMv}, §3.1.2`, POJK_MV),
    baris('vdc', 'Venture Debt Corporation (VDC)', 'kategori PMV yang berfokus pada pembelian surat utang pasangan usaha tahap rintisan atau pengembangan dan/atau pembiayaan', 'menantang', `${S.ebMv}, §3.1.2`, POJK_MV),
    baris('kib', 'Kontrak Investasi Bersama', 'kontrak antara VCC dan bank kustodian yang membentuk Dana Ventura dan mengikat para pemegang unit penyertaan', 'menantang', `${S.ebMv}, §3.1.2 B`, POJK_MV),
  ],
};

export const mvIstilah = familyRelasi({
  id: 'PSJK-MV-ISTILAH', nama: 'Istilah modal ventura', chapter: 'modal-ventura', label: 'SHL',
  sumber: S.ebMv,
  ringkas: 'Relasi dua arah untuk istilah modal ventura: pasangan usaha, divestasi, konversi, Dana Ventura, unit penyertaan, bank kustodian, pelunasan, dilusi, valuasi post/pre-money, VCC, VDC, Kontrak Investasi Bersama.',
}, [ISTILAH]);

const ALASAN_JALUR = 'Ini termasuk jalur divestasi, jadi bukan jawaban.';

export const mvKasus = familyKurasi({
  id: 'PSJK-MV-KASUS', versi: 2, nama: 'Kasus modal ventura', chapter: 'modal-ventura', label: 'VARIASI',
  sumber: `${S.ebMv}; ${S.buku5}`,
  ringkas: 'Penyertaan saham vs pembiayaan, hak sebelum dan sesudah konversi, arus uang saat penerbitan vs divestasi, jangka waktu penyertaan VCC, jalur divestasi, Dana Ventura, modal ventura syariah, risiko likuiditas; termasuk "KECUALI".',
}, [
  butir('penyertaan-20', 'dasar', 'penyertaan saham', {
    tanya: 'Perusahaan modal ventura menyetor dana dan memperoleh 20 dari 100 saham pasangan usaha setelah penerbitan saham baru. Bentuk transaksi dan porsi kepemilikannya adalah ...',
    jawab: 'Penyertaan saham dengan porsi 20%',
    salah: [
      ['Pembiayaan dengan porsi 20%', 'PMV memperoleh saham, sehingga transaksinya penyertaan, bukan pembiayaan.'],
      ['Penyertaan saham dengan porsi 80%', '80% adalah porsi pemegang saham lama.'],
      ['Penjaminan dengan porsi 80%', 'Tidak ada penjaminan dalam transaksi ini.'],
      ['Divestasi dengan porsi 20%', 'Divestasi adalah pelepasan saham, bukan perolehan.'],
    ],
    konsep: 'Penyertaan saham dan porsi kepemilikan', kunci: '20 dari 100 saham',
    alasan: 'PMV memperoleh saham sehingga transaksinya penyertaan; porsinya 20 ÷ 100 = 20%.',
    cepat: 'Cari hak yang diperoleh; gunakan jumlah saham setelah penerbitan.',
    sumber: `${S.ebMv}, §3.1.4 B dan contoh soal 4.1`,
  }),
  butir('dana-penerbitan', 'dasar', 'arus uang', {
    tanya: 'PMV membayar Rp200 juta untuk memperoleh saham baru yang diterbitkan PT Pangan Nisa. Pihak yang menerima dana tersebut adalah ...',
    jawab: 'PT Pangan Nisa sebagai penerbit saham',
    salah: [
      ['Nisa sebagai pendiri secara pribadi', 'Saham baru diterbitkan perusahaan, sehingga dana masuk ke perusahaan, bukan ke pendiri pribadi.'],
      ['Investor yang membeli saham saat divestasi', 'Investor itu baru terlibat kemudian sebagai pembeli.'],
      ['Bank kustodian sebagai pemilik usaha', 'Bank kustodian menjalankan penitipan aset Dana Ventura, bukan pemilik usaha.'],
      ['Pelanggan produk pangan', 'Pelanggan tidak terlibat dalam transaksi saham.'],
    ],
    konsep: 'Arus uang saat penerbitan saham baru', kunci: 'saham baru',
    alasan: 'Ketika saham baru diterbitkan dan dibayar, perusahaan penerbit menerima modal dan mencatat perubahan susunan pemegang saham.',
    cepat: 'Saham baru → uang masuk ke perusahaan yang menerbitkan.',
    sumber: `${S.ebMv}, §3.1.4 A dan contoh soal 4.5`,
  }),
  butir('arus-divestasi', 'menengah', 'arus uang', {
    tanya: 'Investor baru membeli 20 saham PT Pangan Nisa yang sudah dimiliki PMV seharga Rp300 juta. Pernyataan yang tepat mengenai transaksi ini adalah ...',
    jawab: 'PMV menerima pembayaran; investor baru memiliki saham itu.',
    salah: [
      ['Perusahaan menerbitkan 20 saham tambahan.', 'Saham yang dijual adalah saham lama milik PMV; jumlah saham tetap.'],
      ['Nisa menerima pembayaran karena ia pendiri dan pemegang saham terbesar.', 'Pembayaran diterima PMV sebagai penjual saham.'],
      ['Perusahaan melunasi pinjaman Rp300 juta.', 'Ini jual beli saham, bukan pelunasan pinjaman.'],
      ['Jumlah saham perusahaan naik menjadi 120.', 'Pengalihan saham lama tidak menambah jumlah saham.'],
    ],
    konsep: 'Divestasi: pengalihan saham yang sudah ada', kunci: 'saham yang sudah dimiliki PMV',
    alasan: 'Pada divestasi, investor baru membayar PMV dan mengambil porsinya; jumlah saham tetap karena saham yang sudah ada hanya dialihkan.',
    cepat: 'Penjualan saham lama → uang ke penjual (PMV).',
    sumber: `${S.ebMv}, §3.1.4 D dan contoh soal 4.7`,
  }),
  butir('sebelum-konversi', 'menengah', 'instrumen konversi', {
    tanya: 'PMV membeli obligasi konversi yang diterbitkan pasangan usaha, tetapi syarat konversinya belum terpenuhi. Yang menentukan hak PMV saat ini adalah ...',
    jawab: 'Ketentuan dalam obligasi konversi',
    salah: [
      ['Persentase saham yang diasumsikan', 'PMV belum menjadi pemegang saham sebelum konversi dilaksanakan.'],
      ['Sertifikat polis asuransi', 'Polis tidak berkaitan dengan instrumen konversi.'],
      ['Jaminan simpanan LPS', 'LPS menjamin simpanan bank.'],
      ['Jadwal divestasi saham yang belum ada', 'Divestasi baru relevan setelah saham diperoleh.'],
    ],
    konsep: 'Hak sebelum dan sesudah konversi', kunci: 'syarat konversi belum terpenuhi',
    alasan: 'Sebelum konversi, hak PMV mengikuti ketentuan instrumen; hak sebagai pemegang saham baru timbul setelah konversi dilaksanakan sesuai syarat.',
    cepat: 'Tentukan tahap transaksi sebelum menilai haknya.',
    sumber: `${S.ebMv}, §3.1.2 A, §3.1.6, contoh soal 4.3`,
  }),
  butir('tanpa-saham', 'dasar', 'penyertaan vs pembiayaan', {
    tanya: 'Sebuah usaha menerima dana dari PMV tanpa memberikan saham maupun hak konversi, dan perjanjiannya mengatur jadwal pembayaran. Hal yang paling perlu diperiksa pemilik usaha adalah ...',
    jawab: 'Jadwal pembayaran dan kemampuan kas usaha',
    salah: [
      ['Jumlah saham yang pasti akan diambil PMV di kemudian hari', 'Tidak ada saham yang diberikan dalam transaksi ini.'],
      ['Jadwal divestasi saham PMV', 'Tanpa saham, tidak ada divestasi.'],
      ['Nilai klaim polis asuransi', 'Polis tidak berkaitan dengan pembiayaan ini.'],
      ['Porsi dilusi pemegang saham lama', 'Dilusi terjadi bila saham baru diterbitkan.'],
    ],
    konsep: 'Pembiayaan oleh PMV', kunci: 'tanpa saham, jadwal pembayaran',
    alasan: 'Pada pembiayaan tanpa saham atau hak konversi, hak PMV mengikuti kewajiban pembayaran; pemilik usaha perlu menguji kemampuan membayar sesuai jadwal.',
    cepat: 'Tidak ada saham → baca kewajiban bayar.',
    sumber: `${S.ebMv}, §3.1.5, §3.1.7 A, contoh soal 4.4`,
  }),
  butir('vcc-10-tahun', 'menengah', 'regulasi', {
    tanya: 'Menurut Pasal 17 POJK 25 Tahun 2023, jangka waktu penyertaan langsung oleh Venture Capital Corporation (VCC) pada pasangan usaha adalah ...',
    jawab: 'Disepakati para pihak, paling lama 10 tahun',
    salah: [
      ['Tanpa batas waktu selama usaha berjalan', 'Ada batas maksimum dan kewajiban divestasi.'],
      ['Paling lama 3 tahun tanpa perpanjangan', 'Batas yang diatur adalah paling lama 10 tahun.'],
      ['Ditentukan sepihak oleh OJK untuk setiap transaksi', 'Jangka waktu disepakati dengan pasangan usaha dalam batas maksimum.'],
      ['Paling singkat 20 tahun agar menjadi pengendali', 'VCC justru wajib divestasi agar tidak menjadi pengendali pasangan usaha.'],
    ],
    konsep: 'Jangka waktu penyertaan langsung dan kewajiban divestasi', kunci: 'penyertaan langsung VCC',
    alasan: 'Jangka waktu penyertaan langsung VCC disepakati dengan pasangan usaha dan paling lama 10 tahun; VCC wajib divestasi paling lambat saat batas itu jatuh tempo agar tidak menjadi pengendali pasangan usaha.',
    cepat: 'VCC: maksimal 10 tahun, lalu wajib divestasi.',
    sumber: `${S.ebMv}, §3.1.3 A`, berlaku: POJK_MV,
  }),
  butir('jalur-kecuali', 'menantang', 'divestasi', {
    tanya: 'Berikut cara PMV melepas penyertaan sahamnya pada pasangan usaha, KECUALI ...',
    jawab: 'Mengonversi obligasi menjadi saham',
    salah: [
      ['Penawaran umum di pasar modal', ALASAN_JALUR],
      ['Pengambilalihan oleh investor lain', ALASAN_JALUR],
      ['Pembelian kembali saham oleh pasangan usaha', ALASAN_JALUR],
      ['Penjualan kepada PMV lain melalui penawaran terbatas', ALASAN_JALUR],
    ],
    konsep: 'Jalur divestasi', kunci: 'melepas penyertaan, KECUALI',
    alasan: 'Jalur divestasi antara lain penawaran umum, pengambilalihan oleh investor lain (termasuk PMV lain), dan pembelian kembali saham oleh pasangan usaha; konversi obligasi justru cara memperoleh saham.',
    cepat: 'Divestasi = melepas; konversi = memperoleh.',
    sumber: `${S.ebMv}, §3.1.3 A (Pasal 18 POJK 25/2023); ${S.buku5}, Bab 2 (hlm. 58)`, berlaku: POJK_MV,
  }),
  butir('dana-ventura', 'menengah', 'Dana Ventura', {
    tanya: 'Pernyataan yang tepat mengenai Dana Ventura adalah ...',
    jawab: 'Dibentuk VCC dan bank kustodian melalui kontrak investasi bersama.',
    salah: [
      ['Dibentuk bank umum bersama LPS melalui perjanjian kredit.', 'Dana Ventura dibentuk VCC bersama bank kustodian.'],
      ['Dikelola tanpa izin OJK karena berupa kontrak antarinvestor.', 'Pengelola Dana Ventura wajib memperoleh izin pengelolaan dari OJK.'],
      ['Investor memperoleh polis sebagai bukti kepemilikan.', 'Bukti bagian investor adalah unit penyertaan.'],
      ['Nilai investasinya dijamin LPS seperti simpanan bank.', 'LPS menjamin simpanan bank, bukan Dana Ventura; nilainya dapat turun bila kinerja pasangan usaha memburuk.'],
    ],
    konsep: 'Pembentukan dan pengelolaan Dana Ventura', kunci: 'Dana Ventura',
    alasan: 'Dana Ventura dibentuk VCC bersama bank kustodian melalui Kontrak Investasi Bersama yang mengikat pemegang unit penyertaan; pengelolanya wajib memperoleh izin dari OJK.',
    cepat: 'Dana Ventura = VCC + bank kustodian + KIB + izin OJK.',
    sumber: `${S.ebMv}, §3.1.2 B`, berlaku: POJK_MV,
  }),
  butir('vdc-syariah', 'menantang', 'modal ventura syariah', {
    tanya: 'Untuk PMV syariah dalam kategori Venture Debt Corporation (VDC), kegiatan yang sesuai adalah ...',
    jawab: 'Pembelian sukuk pasangan usaha atau pembiayaan bagi hasil',
    salah: [
      ['Penerimaan simpanan giro dari masyarakat', 'PMV tidak menghimpun simpanan giro.'],
      ['Pembelian obligasi berbunga tetap yang diterbitkan pasangan usaha', 'Instrumen berbunga tidak sesuai prinsip syariah; kegiatan syariah memakai sukuk.'],
      ['Penjaminan kredit pasangan usaha', 'Penjaminan adalah kegiatan lembaga penjamin.'],
      ['Pengelolaan Dana Ventura sebagai fokus utama', 'Pengelolaan Dana Ventura termasuk fokus kategori VCC.'],
    ],
    konsep: 'Kegiatan PMV syariah menurut kategori', kunci: 'syariah, VDC',
    alasan: 'Pada kategori VDC syariah, kegiatannya berupa pembelian sukuk pasangan usaha tahap rintisan atau pengembangan dan/atau pembiayaan berdasarkan prinsip bagi hasil.',
    cepat: 'VDC syariah → sukuk dan bagi hasil.',
    sumber: `${S.ebMv}, §3.1.2`, berlaku: POJK_MV,
  }),
  butir('likuiditas', 'menantang', 'risiko', {
    tanya: 'PT Pangan Nisa masih beroperasi baik, tetapi PMV belum menemukan pembeli yang bersedia membayar harga yang disepakati, padahal PMV mengandalkan hasil penjualan itu untuk kewajiban yang segera jatuh tempo. Risiko yang paling relevan bagi PMV adalah ...',
    jawab: 'Risiko likuiditas karena divestasi tertunda',
    salah: [
      ['Risiko gagal bayar cicilan pasangan usaha', 'PMV memegang saham, bukan hak tagih cicilan.'],
      ['Risiko dilusi karena saham baru diterbitkan', 'Tidak ada penerbitan saham baru dalam kasus ini.'],
      ['Risiko klaim penjaminan ditolak', 'Tidak ada penjaminan dalam kasus ini.'],
      ['Risiko simpanan tidak dijamin LPS', 'Kasus ini tidak berkaitan dengan simpanan bank.'],
    ],
    konsep: 'Risiko likuiditas dalam divestasi', kunci: 'belum ada pembeli, kewajiban segera jatuh tempo',
    alasan: 'Saham bisa sulit dijual; bila PMV mengandalkan hasil penjualan untuk kewajiban yang segera jatuh tempo, tertundanya divestasi menimbulkan risiko likuiditas meski nilai saham masih tercatat sebagai aset.',
    cepat: 'Aset ada tetapi uang belum cair → risiko likuiditas.',
    sumber: `${S.ebMv}, §3.1.3 A`,
  }),
  butir('dampak-gagal', 'menengah', 'risiko', {
    tanya: 'PMV memegang saham pasangan usaha yang penjualannya terus turun hingga usahanya berhenti. Dampak yang paling tepat bagi PMV adalah ...',
    jawab: 'Nilai saham turun dan hasil divestasi bisa tak menutup modal',
    salah: [
      ['PMV tetap berhak atas cicilan tetap dari pasangan usaha setiap bulan', 'Hak cicilan berlaku pada pembiayaan, bukan penyertaan saham.'],
      ['Kerugian PMV dijamin LPS', 'LPS menjamin simpanan bank, bukan investasi PMV.'],
      ['Saham PMV berubah menjadi piutang kepada pasangan usaha', 'Saham tidak berubah menjadi piutang; PMV tetap pemegang saham yang menanggung turunnya nilai.'],
      ['Modal PMV kembali penuh saat divestasi', 'Hasil divestasi bergantung pada harga jual saham, yang dapat lebih rendah dari modal.'],
    ],
    konsep: 'Dampak kegagalan usaha: penyertaan vs pembiayaan', kunci: 'memegang saham, usaha berhenti',
    alasan: 'Bila PMV memegang saham dan usaha melemah, nilai saham dapat turun dan hasil divestasi mungkin hanya menutup sebagian modal; pada pembiayaan, dampaknya berupa pembayaran terlambat atau gagal.',
    cepat: 'Saham → risiko nilai; pembiayaan → risiko gagal bayar.',
    sumber: `${S.ebMv}, §3.1.3 A`,
  }),
  butir('pojk-25', 'dasar', 'regulasi', {
    tanya: 'Peraturan OJK yang mengatur penyelenggaraan usaha Perusahaan Modal Ventura dan Perusahaan Modal Ventura Syariah adalah ...',
    jawab: 'POJK 25 Tahun 2023',
    salah: [
      ['POJK 39 Tahun 2024', 'POJK 39/2024 mengatur pergadaian.'],
      ['POJK 41 Tahun 2024', 'POJK 41/2024 mengatur lembaga keuangan mikro.'],
      ['POJK 40 Tahun 2024', 'POJK 40/2024 mengatur LPBBTI.'],
      ['POJK 11 Tahun 2025', 'POJK 11/2025 mengatur penyelenggaraan usaha lembaga penjamin.'],
    ],
    konsep: 'Regulasi modal ventura', kunci: 'penyelenggaraan usaha PMV',
    alasan: 'POJK 25 Tahun 2023 mengatur penyelenggaraan usaha PMV dan PMV Syariah; POJK 46/2024 jo. POJK 35/2025 mengatur pengembangan dan penguatannya tanpa otomatis mengubah seluruh POJK 25/2023.',
    cepat: 'PMV → POJK 25/2023.',
    sumber: `${S.ebMv}, §3.1.1 C`, berlaku: POJK_MV,
  }),
]);

// ---------------------------------------------------------------- hitung

// Pasangan (saham lama, saham baru) dengan porsi bulat yang beragam: 10%, 15%, 20%, 25%, 30%, 40%. Jumlah saham setelah
// penerbitan sengaja bukan 100, agar angka saham di soal tidak langsung sama dengan persentase kunci.
const SAHAM = [[450, 50], [270, 30], [170, 30], [340, 60], [160, 40], [240, 60], [300, 100], [150, 50], [140, 60], [210, 90], [120, 80], [180, 120]]
  .map(([lama, baru]) => ({ lama, baru }))
  .filter((p) => bulat((p.baru / (p.lama + p.baru)) * 100) && p.baru < p.lama);

const tPorsiPmv: TemplateHitung = {
  id: 'porsi-pmv', tingkat: 'dasar', topik: 'porsi kepemilikan',
  sumber: `${S.ebMv}, §3.1.4 B dan §3.1.5`,
  parameter: SAHAM,
  pertanyaan: (p) => `Sebelum investasi, seluruh ${p.lama} saham sebuah perusahaan dimiliki pendirinya. Perusahaan kemudian menerbitkan ${p.baru} saham baru untuk PMV. Porsi kepemilikan PMV setelah penerbitan adalah ...`,
  hitung: (p) => (p.baru / (p.lama + p.baru)) * 100,
  format: persen2,
  pengecoh: (p) => [
    { nilai: (p.baru / p.lama) * 100, alasan: 'Saham baru dibagi saham lama, padahal pembaginya seluruh saham setelah penerbitan.' },
    { nilai: (p.lama / (p.lama + p.baru)) * 100, alasan: 'Itu porsi pendiri setelah penerbitan.' },
    { nilai: (p.baru / (p.lama + p.baru)) * 10, alasan: 'Salah menempatkan desimal.' },
    { nilai: 100 - (p.baru / p.lama) * 100, alasan: 'Porsi pendiri dihitung dari pembagi yang salah.' },
  ],
  konsep: 'Porsi kepemilikan = saham dimiliki ÷ seluruh saham setelah penerbitan', kataKunci: 'saham baru, seluruh saham setelah penerbitan',
  alasan: (p) => [`Jumlah saham setelah penerbitan = ${p.lama} + ${p.baru} = ${p.lama + p.baru}.`, `Porsi PMV = ${p.baru} ÷ ${p.lama + p.baru} × 100% = ${persen2((p.baru / (p.lama + p.baru)) * 100)}.`],
  caraCepat: 'Pakai jumlah saham SETELAH penerbitan sebagai pembagi.',
};

const tDilusi: TemplateHitung = {
  id: 'porsi-pendiri', tingkat: 'menengah', topik: 'dilusi',
  sumber: `${S.ebMv}, §3.1.4 B dan contoh soal 4.6`,
  parameter: SAHAM,
  pertanyaan: (p) => `Pendiri memegang ${p.lama} saham, yaitu seluruh saham perusahaan. Perusahaan menerbitkan ${p.baru} saham baru kepada PMV. Porsi kepemilikan pendiri setelah penerbitan menjadi ...`,
  hitung: (p) => (p.lama / (p.lama + p.baru)) * 100,
  format: persen2,
  pengecoh: (p) => [
    { nilai: 100, alasan: 'Porsi pendiri turun karena jumlah seluruh saham bertambah (dilusi).' },
    { nilai: (p.baru / (p.lama + p.baru)) * 100, alasan: 'Itu porsi PMV.' },
    { nilai: 100 - (p.baru / p.lama) * 100, alasan: 'Saham baru dibagi saham lama; pembaginya seharusnya seluruh saham setelah penerbitan.' },
    { nilai: (p.lama / (p.lama + p.baru)) * 10, alasan: 'Salah menempatkan desimal.' },
  ],
  konsep: 'Dilusi: jumlah saham pendiri tetap, porsinya turun', kataKunci: 'saham baru, porsi pendiri',
  alasan: (p) => [`Pendiri tetap memegang ${p.lama} saham dari ${p.lama + p.baru} saham.`, `Porsi pendiri = ${p.lama} ÷ ${p.lama + p.baru} × 100% = ${persen2((p.lama / (p.lama + p.baru)) * 100)}.`],
  caraCepat: 'Saham pendiri ÷ seluruh saham setelah penerbitan.',
};

const VALUASI = kombinasi({ investasi: [100e6, 200e6, 300e6, 500e6], porsi: [10, 20, 25, 40] });

const tPost: TemplateHitung = {
  id: 'valuasi-post', tingkat: 'menengah', topik: 'valuasi',
  sumber: `${S.ebMv}, §3.1.4 B (tabel valuasi)`,
  parameter: VALUASI,
  pertanyaan: (p) => `PMV menyetor ${rp(p.investasi)} seluruhnya ke perusahaan dan memperoleh ${p.porsi}% saham setelah penerbitan. Dengan asumsi semua saham berhak ekonomi sama dan tanpa biaya transaksi, valuasi setelah investasi (post-money) yang tercermin dari transaksi itu adalah ...`,
  hitung: (p) => p.investasi / (p.porsi / 100),
  pengecoh: (p) => {
    const post = p.investasi / (p.porsi / 100);
    return [
      { nilai: post - p.investasi, alasan: 'Itu valuasi sebelum investasi (pre-money).' },
      { nilai: p.investasi, alasan: 'Itu besar dana yang disetor, bukan nilai perusahaan.' },
      { nilai: (p.investasi * p.porsi) / 100, alasan: 'Investasi dikalikan porsi, padahal seharusnya dibagi porsi.' },
      { nilai: post + p.investasi, alasan: 'Dana investasi terhitung dua kali.' },
    ];
  },
  konsep: 'Valuasi post-money = dana investasi ÷ porsi kepemilikan', kataKunci: 'post-money, porsi setelah penerbitan',
  alasan: (p) => [`Post-money = ${rp(p.investasi)} ÷ ${p.porsi}% = ${rp(p.investasi / (p.porsi / 100))}.`],
  caraCepat: 'Bagi dana dengan persentase saham yang diperoleh.',
};

const tPre: TemplateHitung = {
  id: 'valuasi-pre', tingkat: 'menantang', topik: 'valuasi',
  sumber: `${S.ebMv}, §3.1.4 B (tabel valuasi)`,
  parameter: VALUASI,
  pertanyaan: (p) => `PMV menyetor ${rp(p.investasi)} seluruhnya ke perusahaan dan memperoleh ${p.porsi}% saham setelah penerbitan. Dengan asumsi semua saham berhak ekonomi sama dan tanpa biaya transaksi, valuasi sebelum investasi (pre-money) yang tercermin dari transaksi itu adalah ...`,
  hitung: (p) => p.investasi / (p.porsi / 100) - p.investasi,
  pengecoh: (p) => {
    const post = p.investasi / (p.porsi / 100);
    return [
      { nilai: post, alasan: 'Itu valuasi setelah investasi (post-money); dana baru belum dikurangkan.' },
      { nilai: p.investasi, alasan: 'Itu besar dana yang disetor.' },
      { nilai: (p.investasi * (100 - p.porsi)) / 100, alasan: 'Investasi dikalikan porsi pendiri; cara itu tidak menghasilkan valuasi.' },
      { nilai: post + p.investasi, alasan: 'Dana investasi justru ditambahkan.' },
    ];
  },
  konsep: 'Pre-money = post-money − dana baru', kataKunci: 'pre-money, dana baru',
  alasan: (p) => {
    const post = p.investasi / (p.porsi / 100);
    return [`Post-money = ${rp(p.investasi)} ÷ ${p.porsi}% = ${rp(post)}.`, `Pre-money = ${rp(post)} − ${rp(p.investasi)} = ${rp(post - p.investasi)}.`];
  },
  caraCepat: 'Hitung post-money dulu, lalu kurangi dana baru.',
};

const tUntung: TemplateHitung = {
  id: 'divestasi-untung', tingkat: 'dasar', topik: 'hasil divestasi',
  sumber: `${S.ebMv}, §3.1.4 D`,
  parameter: kombinasi({ beli: [100e6, 150e6, 200e6, 250e6], naik: [40e6, 50e6, 75e6, 80e6, 100e6, 120e6, 150e6] }, (p) => p.naik !== p.beli).map((p) => ({ beli: p.beli, jual: p.beli + p.naik })),
  pertanyaan: (p) => `PMV memperoleh saham pasangan usaha seharga ${rp(p.beli)}, lalu beberapa tahun kemudian menjualnya kepada investor baru seharga ${rp(p.jual)}. Selisih kotor hasil divestasi sebelum biaya dan pajak adalah ...`,
  hitung: (p) => p.jual - p.beli,
  pengecoh: (p) => [
    { nilai: p.jual, alasan: 'Itu harga jual, bukan selisihnya.' },
    { nilai: p.beli, alasan: 'Itu harga perolehan.' },
    { nilai: p.jual + p.beli, alasan: 'Harga jual justru ditambah harga perolehan.' },
    { nilai: (p.jual - p.beli) / 2, alasan: 'Selisih dibagi dua tanpa dasar.' },
  ],
  konsep: 'Hasil divestasi = harga jual − harga perolehan', kataKunci: 'harga perolehan, harga jual',
  alasan: (p) => [`Selisih = ${rp(p.jual)} − ${rp(p.beli)} = ${rp(p.jual - p.beli)} (untung kotor).`],
  caraCepat: 'Harga jual − harga perolehan.',
};

const tRugi: TemplateHitung = {
  id: 'divestasi-rugi', tingkat: 'menengah', topik: 'hasil divestasi',
  sumber: `${S.ebMv}, §3.1.4 D dan contoh soal 4.8`,
  parameter: kombinasi({ beli: [150e6, 200e6, 250e6, 300e6], turun: [20e6, 30e6, 45e6, 50e6, 60e6, 80e6] }).map((p) => ({ beli: p.beli, jual: p.beli - p.turun })),
  pertanyaan: (p) => `PMV membeli saham pasangan usaha seharga ${rp(p.beli)} dan kemudian menjualnya seharga ${rp(p.jual)} karena kinerja usaha melemah. Kerugian kotor PMV sebelum biaya dan pajak adalah ...`,
  hitung: (p) => p.beli - p.jual,
  pengecoh: (p) => [
    { nilai: p.jual, alasan: 'Itu harga jual, bukan kerugiannya.' },
    { nilai: p.beli, alasan: 'Itu harga perolehan; seluruh modal tidak hilang karena saham masih terjual.' },
    { nilai: p.beli + p.jual, alasan: 'Harga jual justru ditambah harga perolehan.' },
    { nilai: (p.beli - p.jual) / 2, alasan: 'Selisih dibagi dua tanpa dasar.' },
  ],
  konsep: 'Hasil divestasi dapat negatif', kataKunci: 'harga jual lebih rendah',
  alasan: (p) => [`Selisih = ${rp(p.jual)} − ${rp(p.beli)} = −${rp(p.beli - p.jual)}, jadi rugi kotor ${rp(p.beli - p.jual)}.`],
  caraCepat: 'Harga jual − harga perolehan; tanda negatif berarti rugi.',
};

export const mvHitung = familyHitung({
  id: 'PSJK-MV-HITUNG', versi: 2, nama: 'Hitungan modal ventura', chapter: 'modal-ventura', label: 'VARIASI',
  sumber: S.ebMv,
  ringkas: 'Porsi kepemilikan PMV dan pendiri (dilusi), valuasi post-money dan pre-money, serta selisih untung atau rugi divestasi.',
}, [tPorsiPmv, tDilusi, tPost, tPre, tUntung, tRugi]);

export const FAMILIES_MODAL_VENTURA = [mvIstilah, mvKasus, mvHitung];
