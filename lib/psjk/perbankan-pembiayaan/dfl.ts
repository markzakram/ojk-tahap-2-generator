import { familyKurasi, familyRelasi, type TabelRelasi } from '../umum';
import { alasanRelasi, baris, butir, kalimatRelasi, SUMBER as S } from './bantu';
import { familyHitung, kombinasi, rp, type TemplateHitung } from './hitung';

// Chapter Digital Financial Literacy (kebutuhan 25). Tiga family:
//   PSJK-DFL-ISTILAH  SHL      relasi dua arah: istilah keamanan dan literasi digital; fungsi kanal bantuan (FIND, APPK,
//                               LAPS SJK, SIPASTI, IASC)
//   PSJK-DFL-KASUS    VARIASI  OTP, phishing, rekayasa sosial, APK kurir, QR, izin akses, penipuan transfer, kanal yang
//                               tepat sesuai kejadian, pernyataan majemuk
//   PSJK-DFL-HITUNG   VARIASI  biaya total dua penawaran, dana bersih setelah potongan, total cicilan vs tenor

const POJK_PK = 'POJK 22/2023';

const ISTILAH: TabelRelasi = {
  id: 'istilah-dfl',
  topik: 'istilah keamanan digital',
  tanyaNilai: (s) => `Dalam layanan keuangan digital, yang dimaksud dengan ${s} adalah ...`,
  tanyaSubjek: (n) => `Dalam layanan keuangan digital, istilah untuk ${n} adalah ...`,
  alasanSalah: alasanRelasi('adalah'),
  kalimat: kalimatRelasi('adalah'),
  konsep: 'Literasi keuangan digital: memeriksa penyedia dan biaya total, lalu menjaga kode otorisasi, data, dan akses akun.',
  caraCepat: 'Kode sekali pakai → OTP; lebih dari satu bukti identitas → multifaktor; data/fungsi perangkat untuk aplikasi → izin akses.',
  baris: [
    baris('otp', 'OTP', 'kode sekali pakai untuk mengonfirmasi tindakan tertentu, seperti masuk ke akun atau menyetujui transaksi', 'dasar', `${S.ebDfl}, Istilah Dasar dan §3.1.2`),
    baris('mfa', 'autentikasi multifaktor', 'penggunaan lebih dari satu jenis bukti untuk memverifikasi identitas', 'dasar', `${S.ebDfl}, §3.1.2`),
    baris('izin-akses', 'izin akses aplikasi', 'pengaturan data atau fungsi perangkat yang boleh digunakan oleh aplikasi', 'dasar', `${S.ebDfl}, §3.1.2`),
    baris('data-pribadi', 'data pribadi', 'informasi yang mengidentifikasi seseorang', 'dasar', `${S.ebDfl}, §3.1.2`),
    baris('literasi', 'literasi keuangan digital', 'kemampuan memahami, memilih, dan memakai layanan keuangan berbasis teknologi secara aman', 'dasar', `${S.ebDfl}, Istilah Dasar`),
    baris('biaya-total', 'biaya total', 'seluruh jumlah wajib yang dibayar pengguna, termasuk tambahan yang berlaku', 'dasar', `${S.ebDfl}, Istilah Dasar`),
    baris('legalitas', 'legalitas', 'status izin atau pendaftaran yang relevan bagi penyedia dan aktivitasnya', 'dasar', `${S.ebDfl}, Istilah Dasar`),
    baris('pemulihan', 'pemulihan akun', 'prosedur resmi mengamankan kembali akun yang diduga bocor melalui perangkat aman dan kanal penyedia', 'menengah', `${S.ebDfl}, §3.1.2`),
  ],
};

const KANAL: TabelRelasi = {
  id: 'kanal-bantuan',
  topik: 'kanal bantuan konsumen',
  tanyaNilai: (s) => `Sebagai kanal bantuan sektor jasa keuangan, ${s} berfungsi sebagai ...`,
  tanyaSubjek: (n) => `Kanal yang berfungsi sebagai ${n} adalah ...`,
  alasanSalah: alasanRelasi('berfungsi sebagai'),
  kalimat: kalimatRelasi('berfungsi sebagai'),
  konsep: 'Pilih kanal sesuai kejadian: cek legalitas (FIND), keluhan layanan (penyedia lalu APPK), sengketa (LAPS SJK), aktivitas ilegal (SIPASTI), penipuan transaksi (IASC).',
  caraCepat: 'Belum transfer dan diduga ilegal → SIPASTI; sudah transfer karena penipuan → IASC; sengketa kontrak → LAPS SJK.',
  baris: [
    baris('find', 'FIND OJK', 'direktori untuk memeriksa identitas dan status pelaku usaha jasa keuangan', 'dasar', `${S.ebDfl}, §3.1.3 B`),
    baris('appk', 'APPK', 'portal OJK untuk menyampaikan pengaduan konsumen', 'dasar', `${S.ebDfl}, §3.1.3 B`),
    baris('laps', 'LAPS SJK', 'lembaga yang membantu menyelesaikan sengketa sektor jasa keuangan di luar pengadilan', 'menengah', `${S.ebDfl}, §3.1.3 B`),
    baris('sipasti', 'SIPASTI', 'kanal pelaporan dugaan aktivitas keuangan ilegal, seperti investasi ilegal atau pinjaman daring tanpa izin', 'menengah', `${S.ebDfl}, §3.1.3 B`),
    baris('iasc', 'IASC', 'kanal koordinasi penanganan penipuan transaksi keuangan, termasuk upaya pemblokiran rekening', 'menengah', `${S.ebDfl}, §3.1.3 A–B`),
  ],
};

export const dflIstilah = familyRelasi({
  id: 'PSJK-DFL-ISTILAH', nama: 'Istilah keamanan digital dan kanal bantuan', chapter: 'digital-financial-literacy', label: 'SHL',
  sumber: S.ebDfl,
  ringkas: 'Relasi dua arah untuk istilah literasi dan keamanan digital (OTP, autentikasi multifaktor, izin akses, data pribadi, biaya total, legalitas, pemulihan akun) dan fungsi kanal FIND, APPK, LAPS SJK, SIPASTI, IASC.',
}, [ISTILAH, KANAL]);

export const dflKasus = familyKurasi({
  id: 'PSJK-DFL-KASUS', versi: 2, nama: 'Kasus keamanan dan transaksi digital', chapter: 'digital-financial-literacy', label: 'VARIASI',
  sumber: S.ebDfl,
  ringkas: 'Respons tepat atas permintaan OTP, pesan kurir APK, halaman tiruan, rekayasa sosial, QR berbeda nama, izin akses kontak, penipuan transfer; memilih kanal sesuai kejadian; pernyataan majemuk tentang keamanan akun.',
}, [
  butir('otp-pesan', 'dasar', 'kode otorisasi', {
    tanya: 'Seseorang yang mengaku petugas bank meminta kode OTP Anda melalui pesan singkat. Tindakan yang sebaiknya dilakukan adalah ...',
    jawab: 'Menghentikan percakapan dan menghubungi bank lewat kanal resmi',
    salah: [
      ['Mengirim kode jika ia tahu nama lengkap Anda', 'Mengetahui nama tidak membuktikan identitas; OTP tidak boleh dibagikan.'],
      ['Membalas dengan PIN sebagai ganti OTP', 'PIN juga kredensial rahasia yang tidak boleh dibagikan.'],
      ['Mengirim kode setelah melihat logo bank pada foto profil pengirim', 'Logo mudah ditiru dan bukan bukti identitas resmi.'],
      ['Menelepon nomor pengirim untuk menyerahkan kode', 'Nomor pengirim bukan kanal resmi yang Anda temukan sendiri.'],
    ],
    konsep: 'Kerahasiaan OTP', kunci: 'mengaku petugas, meminta OTP',
    alasan: 'OTP mengonfirmasi tindakan pada akun, seperti masuk atau menyetujui transaksi; jangan berikan kepada siapa pun dan hubungi bank melalui kanal resmi yang dibuka sendiri.',
    cepat: 'Diminta OTP → hentikan percakapan.',
    sumber: `${S.ebDfl}, §3.1.2 dan contoh soal 4.2; ${S.ebBank}, contoh soal 4.8`,
  }),
  butir('apk-kurir', 'dasar', 'rekayasa sosial', {
    tanya: 'Anda menerima pesan dari nomor asing yang mengaku kurir dan meminta Anda memasang berkas APK untuk melihat foto paket, padahal status paket tersedia di aplikasi belanja. Langkah pertama yang tepat adalah ...',
    jawab: 'Memeriksa riwayat pesanan di aplikasi belanja resmi',
    salah: [
      ['Mencocokkan nama dan foto profil pengirim', 'Nama dan foto profil mudah dipalsukan.'],
      ['Meminta pengirim mengulangi nomor resi', 'Tetap mengikuti arahan pengirim yang belum terverifikasi.'],
      ['Membuka berkas tersebut, lalu memeriksa izin aksesnya satu per satu', 'Berkas APK dari sumber tidak dikenal perlu dihindari sejak awal.'],
      ['Menghubungi nomor bantuan yang tertulis di pesan', 'Nomor di pesan berasal dari pengirim yang belum terverifikasi.'],
    ],
    konsep: 'Verifikasi mandiri lewat kanal resmi', kunci: 'nomor asing, berkas APK',
    alasan: 'Aplikasi belanja yang biasa digunakan memberi akses ke informasi pesanan tanpa mengikuti arahan pengirim; berkas APK dari sumber tidak dikenal perlu dihindari.',
    cepat: 'Verifikasi lewat kanal resmi yang Anda buka sendiri.',
    sumber: `${S.ebDfl}, §3.1.4 dan contoh soal 4.3`,
  }),
  butir('phishing', 'dasar', 'rekayasa sosial', {
    tanya: 'Sebuah pesan mengatasnamakan bank dan mengarahkan penerima ke halaman tiruan untuk memasukkan kata sandi. Modus ini disebut ...',
    jawab: 'Phishing',
    salah: [
      ['Autentikasi multifaktor', 'Autentikasi multifaktor adalah pengamanan, bukan modus penipuan.'],
      ['Pembaruan perangkat', 'Pembaruan perangkat memperbaiki celah keamanan.'],
      ['Pemulihan akun', 'Pemulihan akun adalah prosedur resmi mengamankan akun yang bocor.'],
      ['Izin akses aplikasi', 'Izin akses mengatur data atau fungsi perangkat yang boleh dipakai aplikasi.'],
    ],
    konsep: 'Mengenali phishing', kunci: 'halaman tiruan, memancing kata sandi',
    alasan: 'Phishing adalah upaya memancing informasi melalui pesan atau halaman tiruan, misalnya pesan atas nama bank yang meminta kata sandi lewat tautan.',
    cepat: 'Tautan ke halaman tiruan → phishing.',
    sumber: `${S.ebDfl}, §3.1.2`,
  }),
  butir('rekayasa-sosial', 'menengah', 'rekayasa sosial', {
    tanya: 'Penelepon yang mengaku petugas menekan korban dengan ancaman pemblokiran akun agar segera mentransfer dana ke "rekening penampungan". Cara pelaku memengaruhi korban seperti ini disebut ...',
    jawab: 'Rekayasa sosial',
    salah: [
      ['Autentikasi multifaktor', 'Autentikasi multifaktor adalah lapisan pengamanan akun.'],
      ['Pemulihan akun', 'Pemulihan akun adalah langkah resmi setelah akses diduga bocor.'],
      ['Pembaruan perangkat', 'Pembaruan perangkat memperbaiki celah keamanan.'],
      ['Verifikasi tautan resmi', 'Verifikasi tautan adalah langkah pencegahan oleh pengguna.'],
    ],
    konsep: 'Rekayasa sosial', kunci: 'mengaku petugas, menekan, mendesak',
    alasan: 'Rekayasa sosial adalah cara membujuk atau menekan seseorang agar memberikan informasi atau melakukan tindakan tertentu, misalnya dengan menciptakan rasa mendesak.',
    cepat: 'Desakan dan tekanan dari "petugas" → rekayasa sosial.',
    sumber: `${S.ebDfl}, §3.1.2 dan §3.1.2 A`,
  }),
  butir('qr-beda', 'menengah', 'transaksi aman', {
    tanya: 'Saat membayar di kasir dengan memindai kode QR, nama penerima di layar berbeda dari nama yang dikonfirmasi kasir. Tindakan yang paling tepat adalah ...',
    jawab: 'Menunda pembayaran dan meminta kasir memastikan kode yang benar',
    salah: [
      ['Tetap membayar karena nominalnya sudah sesuai', 'Nominal sesuai tidak menjamin dana masuk ke penerima yang benar.'],
      ['Membayar dahulu lalu meminta pengembalian dana bila ternyata keliru', 'Mencegah lebih aman daripada mengupayakan dana kembali setelah terkirim.'],
      ['Membayar dua kali agar salah satunya sampai', 'Ini memperbesar risiko kerugian.'],
      ['Mengirim OTP kepada kasir untuk verifikasi', 'OTP tidak boleh dibagikan kepada siapa pun.'],
    ],
    konsep: 'Periksa sebelum konfirmasi', kunci: 'nama penerima berbeda',
    alasan: 'Sebelum menekan tombol bayar, cocokkan nama penerima dan nominal; bila berbeda, tunda transaksi, minta kode yang benar, atau pilih metode lain.',
    cepat: 'Nama penerima tidak cocok → jangan bayar dulu.',
    sumber: `${S.ebDfl}, §3.1 (situasi 3) dan §3.1.2 B`,
  }),
  butir('izin-kontak', 'menengah', 'data pribadi', {
    tanya: 'Fitur pemindai QR sebuah aplikasi meminta akses kamera dan daftar kontak, tetapi tujuan akses kontak tidak dijelaskan. Sikap yang paling tepat adalah ...',
    jawab: 'Menolak izin kontak sementara sampai tujuannya jelas',
    salah: [
      ['Menyetujui izin kamera dan kontak agar fitur segera berjalan', 'Izin kontak yang tidak jelas tujuannya berisiko menyalahgunakan data.'],
      ['Menolak akses kamera dan menyetujui kontak', 'Akses kamera justru berkaitan dengan fungsi pemindaian.'],
      ['Mengirim daftar kontak secara manual kepada penyedia', 'Memberikan data tanpa kejelasan tujuan tidak sejalan dengan pelindungan data.'],
      ['Mengizinkan akses kontak karena aplikasinya sudah populer', 'Popularitas aplikasi tidak menjelaskan tujuan dan penggunaan data kontak.'],
    ],
    konsep: 'Menilai permintaan izin akses', kunci: 'akses kontak, tujuan tidak jelas',
    alasan: 'Akses kamera berkaitan dengan fungsi pemindai; untuk akses kontak, baca tujuan dan data yang dipakai. Bila belum jelas, izin dapat ditolak sementara atau pilih cara bayar lain.',
    cepat: 'Izin yang tidak terkait fungsi → tanyakan dulu, jangan langsung setujui.',
    sumber: `${S.ebDfl}, §3.1 (situasi 2) dan §3.1.2`,
  }),
  butir('rekening-baru', 'menengah', 'penipuan transaksi', {
    tanya: 'Rina sudah mentransfer uang setelah menerima pesan yang mengaku dari penjual dan meminta pembayaran ke rekening baru. Penjual ternyata tidak pernah meminta perubahan rekening. Langkah pertama yang tepat adalah ...',
    jawab: 'Segera menghubungi bank atau penyedia jasa pembayaran',
    salah: [
      ['Menunggu beberapa hari karena dana mungkin dikembalikan sendiri', 'Pelaporan cepat membantu penelusuran dan pemblokiran.'],
      ['Mengirim transfer kedua ke rekening yang benar saja', 'Itu tidak menangani dana yang sudah terkirim ke pelaku.'],
      ['Mengganti nomor telepon tanpa melapor', 'Mengganti nomor tidak menangani transaksi penipuan.'],
      ['Menghapus percakapan agar tidak dihubungi lagi', 'Percakapan justru bukti penting untuk pelaporan.'],
    ],
    konsep: 'Respons ketika dana sudah berpindah karena penipuan', kunci: 'sudah mentransfer, rekening baru',
    alasan: 'Karena dana sudah berpindah, segera hubungi bank atau penyedia jasa pembayaran, simpan bukti transfer, nomor rekening tujuan, waktu, dan percakapan, lalu laporkan ke IASC.',
    cepat: 'Dana sudah pindah → hubungi bank/PJP sekarang juga.',
    sumber: `${S.ebDfl}, §3.1 (situasi 4) dan §3.1.4 D`,
  }),
  butir('bukti-laporan', 'dasar', 'penipuan transaksi', {
    tanya: 'Dana sudah ditransfer kepada pelaku penipuan. Bukti yang paling membantu laporan awal adalah ...',
    jawab: 'Bukti transfer, waktu transaksi, dan percakapan',
    salah: [
      ['Kata sandi akun perbankan', 'Kata sandi tidak boleh dibagikan, termasuk saat melapor.'],
      ['PIN kartu debit', 'PIN adalah kredensial rahasia.'],
      ['Foto galeri ponsel pelapor', 'Tidak relevan dan berisiko membuka data pribadi.'],
      ['Daftar aplikasi yang terpasang di ponsel', 'Tidak menunjukkan kapan, berapa, dan ke mana dana berpindah.'],
    ],
    konsep: 'Menyiapkan bukti pelaporan', kunci: 'bukti laporan awal',
    alasan: 'Bukti transfer, waktu dan nominal transaksi, rekening tujuan, serta tangkapan layar percakapan menghubungkan transaksi dengan kronologi kejadian.',
    cepat: 'Simpan bukti kapan, berapa, dan ke mana dana berpindah.',
    sumber: `${S.ebDfl}, §3.1.3 A dan contoh soal 4.4`,
  }),
  butir('sengketa', 'menengah', 'kanal bantuan', {
    tanya: 'Nasabah sudah mengadukan masalah pelaksanaan kontrak kepada penyedia, tetapi sengketanya belum selesai dan memenuhi syarat. Kanal penyelesaian sengketa di luar pengadilan yang relevan adalah ...',
    jawab: 'LAPS SJK',
    salah: [
      ['FIND OJK', 'FIND adalah direktori untuk memeriksa identitas dan status pelaku usaha.'],
      ['IASC', 'IASC menangani penipuan transaksi keuangan.'],
      ['SIPASTI', 'SIPASTI menerima laporan dugaan aktivitas keuangan ilegal.'],
      ['Direktori LPBBTI', 'Direktori LPBBTI untuk memeriksa izin platform pinjaman daring.'],
    ],
    konsep: 'Memilih kanal sesuai jenis masalah', kunci: 'sengketa kontrak belum selesai',
    alasan: 'Jika pengaduan kepada penyedia belum menghasilkan penyelesaian dan sengketa memenuhi syarat, permohonan dapat diajukan ke LAPS SJK secara langsung atau melalui APPK.',
    cepat: 'Sengketa produk → penyedia dulu, lalu LAPS SJK.',
    sumber: `${S.ebDfl}, §3.1.3 B dan contoh soal 4.5`,
  }),
  butir('investasi-ilegal', 'dasar', 'kanal bantuan', {
    tanya: 'Seseorang menemukan tawaran investasi yang diduga ilegal dan belum mengirim dana sama sekali. Kanal pelaporan yang paling sesuai adalah ...',
    jawab: 'Portal Satgas PASTI (SIPASTI)',
    salah: [
      ['Portal Indonesia Anti-Scam Centre (IASC)', 'IASC untuk penipuan yang sudah melibatkan transaksi.'],
      ['LAPS SJK', 'LAPS SJK menyelesaikan sengketa dengan pelaku usaha jasa keuangan.'],
      ['Direktori FIND', 'FIND dipakai untuk memeriksa legalitas, bukan menerima laporan.'],
      ['Pusat bantuan kurir', 'Tidak berkaitan dengan aktivitas keuangan ilegal.'],
    ],
    konsep: 'Melaporkan dugaan aktivitas keuangan ilegal', kunci: 'diduga ilegal, belum mengirim dana',
    alasan: 'SIPASTI menerima laporan dugaan aktivitas keuangan ilegal, seperti investasi ilegal atau pinjaman daring tanpa izin; pelaporan dapat dilakukan meskipun belum mengirim uang.',
    cepat: 'Periksa dulu: sudah ada perpindahan dana atau belum.',
    sumber: `${S.ebDfl}, §3.1.3 B dan contoh soal 4.6`,
  }),
  butir('iasc-hasil', 'menengah', 'penipuan transaksi', {
    tanya: 'Pernyataan yang tepat mengenai laporan penipuan transaksi keuangan ke Indonesia Anti-Scam Centre (IASC) adalah ...',
    jawab: 'Pelaporan tidak otomatis menjamin dana kembali.',
    salah: [
      ['Dana pasti kembali penuh setelah laporan diterima.', 'Hasilnya bergantung pada kondisi transaksi dan penanganan kasus.'],
      ['Laporan ke IASC menggantikan laporan kepolisian.', 'Ketiga jalur (penyedia, IASC, kepolisian) saling melengkapi.'],
      ['IASC hanya menerima laporan sebelum ada transfer.', 'IASC justru menangani penipuan yang sudah melibatkan transaksi.'],
      ['IASC menyelesaikan sengketa kontrak di luar pengadilan.', 'Penyelesaian sengketa di luar pengadilan adalah fungsi LAPS SJK.'],
    ],
    konsep: 'Fungsi dan batas IASC', kunci: 'laporan ke IASC',
    alasan: 'IASC mengoordinasikan penanganan penipuan antarpenyedia, termasuk upaya pemblokiran rekening; pengembalian dana bergantung pada apakah dana masih dapat ditelusuri dan diamankan.',
    cepat: 'Lapor cepat membantu, tetapi tidak menjamin dana kembali.',
    sumber: `${S.ebDfl}, §3.1.3 A dan §3.1.4 D`,
  }),
  butir('mfa-tolak', 'menengah', 'keamanan akun', {
    tanya: 'Ponsel Anda menampilkan permintaan persetujuan masuk ke akun keuangan, padahal Anda tidak sedang mencoba masuk. Tindakan yang tepat adalah ...',
    jawab: 'Menolak permintaan dan mengamankan akun lewat kanal resmi',
    salah: [
      ['Menyetujui permintaan itu agar notifikasi tidak terus muncul', 'Menyetujui berarti memberi akses kepada pihak yang mungkin tidak berhak.'],
      ['Menonaktifkan autentikasi multifaktor', 'Autentikasi multifaktor justru perlu tetap aktif.'],
      ['Mengirim kode persetujuan kepada penelepon', 'Kode otorisasi tidak boleh dibagikan.'],
      ['Mengabaikan dan menyetujui bila muncul lagi', 'Permintaan berulang justru tanda percobaan akses tidak sah.'],
    ],
    konsep: 'Autentikasi multifaktor', kunci: 'tidak sedang mencoba masuk',
    alasan: 'Aktifkan autentikasi multifaktor dan tolak permintaan persetujuan masuk jika Anda tidak sedang mencoba masuk; bila akses diduga bocor, ikuti prosedur pemulihan melalui kanal resmi.',
    cepat: 'Tidak sedang login → tolak.',
    sumber: `${S.ebDfl}, §3.1.2`,
  }),
  butir('akun-bocor', 'menengah', 'keamanan akun', {
    tanya: 'Setelah terlanjur memasang berkas dari pesan mencurigakan, Anda menduga akses akun keuangan bocor. Langkah yang paling tepat adalah ...',
    jawab: 'Memakai perangkat lain yang aman dan menghubungi penyedia',
    salah: [
      ['Menunggu sampai ada transaksi yang hilang', 'Pengamanan perlu dilakukan sebelum kerugian terjadi.'],
      ['Membagikan kode OTP kepada teman agar akunnya ikut diperiksa', 'OTP tidak boleh dibagikan kepada siapa pun.'],
      ['Memasang ulang berkas yang sama dari pesan itu', 'Mengulang tindakan berisiko memperparah kebocoran.'],
      ['Mengganti foto profil akun media sosial', 'Tidak berhubungan dengan pengamanan akun keuangan.'],
    ],
    konsep: 'Pemulihan akun', kunci: 'akses diduga bocor',
    alasan: 'Jika akses diduga bocor, gunakan perangkat lain yang aman, segera hubungi penyedia melalui kanal resmi, ikuti prosedur pemulihan, ganti kata sandi, dan periksa perangkat terhubung serta riwayat transaksi.',
    cepat: 'Akses bocor → amankan akun lewat perangkat aman dan kanal resmi.',
    sumber: `${S.ebDfl}, §3.1.2 dan §3.1.4 C`,
  }),
  butir('tagihan-beda', 'dasar', 'kanal bantuan', {
    tanya: 'Tagihan layanan keuangan digital Anda ternyata berbeda dari kesepakatan awal. Langkah pertama yang tepat adalah ...',
    jawab: 'Mengadu ke penyedia lewat kanal resmi dan menyimpan bukti',
    salah: [
      ['Langsung melapor ke IASC sebagai penipuan transaksi keuangan', 'IASC untuk penipuan transaksi; perbedaan tagihan dimulai dengan pengaduan ke penyedia.'],
      ['Melapor ke SIPASTI sebagai aktivitas ilegal', 'SIPASTI untuk dugaan aktivitas ilegal, bukan selisih tagihan penyedia berizin.'],
      ['Mengabaikan tagihan tanpa memberi kabar', 'Mengabaikan tagihan tidak menyelesaikan perbedaan dan dapat menimbulkan denda.'],
      ['Menghapus aplikasi agar tagihan hilang', 'Menghapus aplikasi tidak menghapus kewajiban maupun sengketa.'],
    ],
    konsep: 'Pengaduan produk dan layanan', kunci: 'tagihan berbeda dari kesepakatan',
    alasan: 'Biaya atau layanan yang tidak sesuai diadukan lebih dahulu kepada penyedia melalui kanal resmi; simpan kronologi, bukti, dan nomor pengaduan untuk tindak lanjut melalui APPK bila perlu.',
    cepat: 'Masalah tagihan → penyedia dulu.',
    sumber: `${S.ebDfl}, §3.1.3 dan §3.1.3 B`, berlaku: POJK_PK,
  }),
  butir('pojk-22', 'dasar', 'regulasi', {
    tanya: 'Peraturan OJK yang menjadi rujukan pelindungan konsumen sektor jasa keuangan, termasuk transparansi informasi produk dan penanganan pengaduan, adalah ...',
    jawab: 'POJK 22 Tahun 2023',
    salah: [
      ['POJK 40 Tahun 2024', 'POJK 40/2024 mengatur LPBBTI.'],
      ['POJK 3 Tahun 2024', 'POJK 3/2024 mengatur penyelenggaraan inovasi teknologi sektor keuangan.'],
      ['POJK 39 Tahun 2024', 'POJK 39/2024 mengatur pergadaian.'],
      ['POJK 41 Tahun 2024', 'POJK 41/2024 mengatur lembaga keuangan mikro.'],
    ],
    konsep: 'Regulasi pelindungan konsumen', kunci: 'pelindungan konsumen, pengaduan',
    alasan: 'POJK 22 Tahun 2023 mengatur pelindungan konsumen dan masyarakat di sektor jasa keuangan, termasuk transparansi informasi, pelindungan data, keamanan, dan penanganan pengaduan.',
    cepat: 'Pelindungan konsumen → POJK 22/2023.',
    sumber: `${S.ebDfl}, §3.1 dan §3.1.3`, berlaku: POJK_PK,
  }),
  butir('pernyataan-aman', 'menantang', 'keamanan akun', {
    tanya: 'Perhatikan pernyataan berikut:\n(1) OTP boleh diberikan kepada petugas bank yang menelepon;\n(2) untuk memeriksa pesan atas nama bank, buka aplikasi bank secara mandiri;\n(3) pasang aplikasi dari toko aplikasi resmi dan cocokkan nama pengembangnya;\n(4) pembaruan sistem operasi dan aplikasi dapat memperbaiki celah keamanan.\nSeluruh pernyataan yang benar adalah ...',
    jawab: '(2), (3), dan (4)',
    salah: [
      ['(1), (2), dan (3)', 'Pernyataan (1) salah: OTP tidak boleh diberikan kepada siapa pun, termasuk orang yang mengaku petugas.'],
      ['(1) dan (4)', 'Pernyataan (1) salah.'],
      ['(1), (3), dan (4)', 'Pernyataan (1) salah.'],
      ['(1) dan (2)', 'Pernyataan (1) salah.'],
      ['(1), (2), dan (4)', 'Pernyataan (1) salah.'],
    ],
    konsep: 'Menjaga data dan akses akun', kunci: 'OTP, aplikasi resmi, pembaruan',
    alasan: ['Pernyataan (2), (3), dan (4) sesuai panduan: verifikasi lewat aplikasi yang dibuka sendiri, pasang aplikasi dari toko resmi, dan perbarui perangkat.', 'Pernyataan (1) salah karena OTP bersifat rahasia.'],
    cepat: 'Coret pernyataan yang membolehkan membagikan kode rahasia.',
    sumber: `${S.ebDfl}, §3.1.2`,
  }),
  butir('tautan-bank', 'dasar', 'kode otorisasi', {
    tanya: 'Sebuah pesan mengatasnamakan bank dan mengarahkan pengguna ke tautan untuk memasukkan kode. Cara verifikasi yang tepat adalah ...',
    jawab: 'Membuka aplikasi bank secara mandiri',
    salah: [
      ['Mencocokkan nama pengirim saja', 'Nama pengirim mudah dipalsukan.'],
      ['Memeriksa logo di halaman tautan', 'Halaman tiruan dapat memakai logo yang sama.'],
      ['Menanyakan identitas kepada nomor pengirim', 'Jawaban datang dari kanal yang belum terverifikasi.'],
      ['Menelepon nomor yang tercantum di pesan', 'Nomor di pesan bukan kanal resmi yang Anda temukan sendiri.'],
    ],
    konsep: 'Verifikasi tautan dan aplikasi', kunci: 'tautan dari pesan',
    alasan: 'Aplikasi resmi yang dibuka secara mandiri memungkinkan verifikasi tanpa bergantung pada kanal pengirim.',
    cepat: 'Jangan pakai tautan dari pesan; buka kanal resmi sendiri.',
    sumber: `${S.ebDfl}, §3.1.2 dan contoh soal 4.8`,
  }),
]);

// ---------------------------------------------------------------- hitung

const tBiayaAdmin: TemplateHitung = {
  id: 'biaya-admin-vs-cicilan', tingkat: 'menengah', topik: 'biaya total',
  sumber: `${S.ebDfl}, §3.1 (situasi 1) dan §3.1.1 B`,
  parameter: kombinasi({ a: [100e3, 110e3, 120e3], n: [3, 4, 6], admin: [25e3, 30e3, 50e3], d: [2e3, 3e3, 5e3] }, (p) => p.admin > p.d * p.n),
  pertanyaan: (p) => `Untuk barang yang sama dengan tenor ${p.n} bulan, penawaran A mengenakan cicilan ${rp(p.a)} per bulan ditambah biaya administrasi wajib ${rp(p.admin)} di awal, sedangkan penawaran B mengenakan cicilan ${rp(p.a + p.d)} per bulan tanpa biaya tambahan. Penawaran B lebih murah secara total sebesar ...`,
  hitung: (p) => p.admin - p.d * p.n,
  pengecoh: (p) => [
    { nilai: p.admin, alasan: 'Itu biaya administrasi saja; selisih cicilan belum diperhitungkan.' },
    { nilai: p.d * p.n, alasan: 'Itu selisih cicilan selama tenor; biaya administrasi belum diperhitungkan.' },
    { nilai: p.admin + p.d * p.n, alasan: 'Selisih cicilan justru ditambahkan ke biaya administrasi.' },
    { nilai: p.d, alasan: 'Itu selisih cicilan per bulan.' },
    { nilai: p.admin - p.d, alasan: 'Selisih cicilan hanya dihitung untuk satu bulan, padahal berlaku selama tenor.' },
  ],
  konsep: 'Membandingkan biaya total, bukan nominal cicilan', kataKunci: 'biaya administrasi wajib, cicilan',
  alasan: (p) => [`Total A = ${rp(p.a)} × ${p.n} + ${rp(p.admin)} = ${rp(p.a * p.n + p.admin)}.`, `Total B = ${rp(p.a + p.d)} × ${p.n} = ${rp((p.a + p.d) * p.n)}.`, `B lebih murah ${rp(p.admin - p.d * p.n)} walaupun cicilannya lebih besar.`],
  caraCepat: 'Jumlahkan semua biaya wajib sebelum membandingkan.',
};

const tDanaBersih: TemplateHitung = {
  id: 'dana-bersih', tingkat: 'dasar', topik: 'dana bersih',
  sumber: `${S.ebDfl}, §3.1.1 A–B`,
  parameter: kombinasi({ pokok: [1e6, 2e6, 3e6, 5e6], potong: [5, 8, 10] }).map((p) => ({ pokok: p.pokok, potongan: (p.pokok * p.potong) / 100 })),
  pertanyaan: (p) => `Sebuah pinjaman digital tercatat dengan pokok ${rp(p.pokok)}, tetapi penyedia memotong biaya ${rp(p.potongan)} saat pencairan. Dana bersih yang benar-benar diterima pengguna adalah ...`,
  hitung: (p) => p.pokok - p.potongan,
  pengecoh: (p) => [
    { nilai: p.pokok, alasan: 'Itu pokok dalam perjanjian; potongan saat pencairan belum dikurangkan.' },
    { nilai: p.potongan, alasan: 'Itu besar potongan, bukan dana yang diterima.' },
    { nilai: p.pokok + p.potongan, alasan: 'Potongan justru ditambahkan.' },
    { nilai: p.pokok - 2 * p.potongan, alasan: 'Potongan terhitung dua kali.' },
  ],
  konsep: 'Dana bersih vs pokok kontrak', kataKunci: 'dipotong saat pencairan',
  alasan: (p) => [`Dana bersih = ${rp(p.pokok)} − ${rp(p.potongan)} = ${rp(p.pokok - p.potongan)}.`, 'Biaya yang dipotong saat pencairan mengurangi dana yang bisa digunakan.'],
  caraCepat: 'Pokok − potongan di muka.',
};

const tCicilanTenor: TemplateHitung = {
  id: 'total-cicilan-tenor', tingkat: 'dasar', topik: 'biaya total',
  sumber: `${S.ebDfl}, §3.1.5 dan contoh soal 4.7`,
  parameter: kombinasi({ a: [120e3, 150e3, 200e3], na: [3, 4], b: [90e3, 100e3, 110e3], nb: [5, 6] }, (p) => p.b < p.a && p.b * p.nb > p.a * p.na),
  pertanyaan: (p) => `Dua produk memberikan manfaat yang sama. Produk A ditagih ${rp(p.a)} sebanyak ${p.na} kali, sedangkan produk B ditagih ${rp(p.b)} sebanyak ${p.nb} kali, tanpa biaya lain. Produk A lebih murah secara total sebesar ...`,
  hitung: (p) => p.b * p.nb - p.a * p.na,
  pengecoh: (p) => [
    { nilai: p.a - p.b, alasan: 'Itu selisih tagihan per bulan.' },
    { nilai: (p.a - p.b) * p.na, alasan: 'Selisih tagihan dikalikan tenor A tidak sama dengan selisih total.' },
    { nilai: p.a * p.na, alasan: 'Itu total produk A.' },
    { nilai: p.b * p.nb, alasan: 'Itu total produk B.' },
    { nilai: (p.a - p.b) * p.nb, alasan: 'Selisih tagihan dikalikan jumlah tagihan B tidak sama dengan selisih total.' },
  ],
  konsep: 'Cicilan kecil belum tentu total lebih murah', kataKunci: 'tagihan per bulan, jumlah pembayaran',
  alasan: (p) => [`Total A = ${rp(p.a)} × ${p.na} = ${rp(p.a * p.na)}; total B = ${rp(p.b)} × ${p.nb} = ${rp(p.b * p.nb)}.`, `A lebih murah ${rp(p.b * p.nb - p.a * p.na)}; periksa juga apakah cicilan A sesuai anggaran.`],
  caraCepat: 'Kalikan cicilan dengan jumlah pembayaran.',
};

export const dflHitung = familyHitung({
  id: 'PSJK-DFL-HITUNG', versi: 2, nama: 'Hitungan biaya layanan digital', chapter: 'digital-financial-literacy', label: 'VARIASI',
  sumber: S.ebDfl,
  ringkas: 'Membandingkan biaya total dua penawaran (biaya administrasi vs cicilan, tenor berbeda) dan dana bersih setelah potongan pencairan.',
}, [tBiayaAdmin, tDanaBersih, tCicilanTenor]);

export const FAMILIES_DFL = [dflIstilah, dflKasus, dflHitung];
