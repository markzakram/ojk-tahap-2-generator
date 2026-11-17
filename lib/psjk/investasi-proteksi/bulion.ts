import type { ButirKurasi, TabelRelasi } from '../umum';
import { familyKurasi, familyRelasi } from '../umum';
import { P, SUMBER, alasanRelasi, kalimatRelasi, pembuatBaris } from './alat';
import { angka, familyHitung, rp, type TemplateHitung } from './hitung';

// Chapter Bulion (kebutuhan 15 = 1×10 + 1×5). Sumber tunggal yang cukup rinci: e-book tim "Investasi dan Proteksi –
// Bulion" (merangkum Pasal 132 UU P2SK, POJK 17/2024 beserta FAQ pertanyaan 1–10, Roadmap Bulion 2026–2031, POJK 2/2026
// tentang ETF Emas). Bahan resmi OJK di folder "Materi by OJK Official" belum memuat bulion, sehingga semua butir merujuk
// e-book dan regulasi yang dikutipnya. Contoh nama pelaku (Pegadaian, BSI) tidak dipakai karena status izin dapat berubah.

const EB = SUMBER.ebBulion;
const POJK = 'POJK 17/2024';

const FAKTA: ButirKurasi[] = [
  {
    id: 'definisi', tingkat: 'dasar', topik: 'pengertian', sumber: `${EB}, subbab 3.1.1 dan contoh soal 4.1`, berlakuPer: POJK,
    pertanyaan: 'Sebuah lembaga jasa keuangan berizin menyelenggarakan layanan simpanan, pembiayaan, perdagangan, dan penitipan emas. Kelompok layanan tersebut paling tepat disebut ....',
    jawaban: 'kegiatan usaha bulion oleh lembaga jasa keuangan',
    pengecoh: [
      P('usaha pemurnian logam mulia bagi industri tambang', 'Pemurnian bukan bentuk kegiatan usaha bulion menurut POJK 17/2024.'),
      P('perdagangan komoditas emas oleh semua toko perhiasan', 'Toko emas tidak otomatis menyelenggarakan kegiatan usaha bulion.'),
      P('layanan penjaminan aset pada pasar perdagangan emas', 'Penjaminan bukan bentuk kegiatan usaha bulion yang disebutkan.'),
      P('transaksi efek berbasis kontrak di pasar modal', 'Itu mengarah ke instrumen pasar modal, bukan usaha bulion.'),
    ],
    konsep: 'Definisi kegiatan usaha bulion', kataKunci: 'simpanan, pembiayaan, perdagangan, penitipan emas',
    alasan: ['POJK 17/2024 mendefinisikan kegiatan usaha bulion sebagai kegiatan usaha terkait emas yang dilakukan LJK, mencakup Simpanan, Pembiayaan, Perdagangan, dan/atau Penitipan Emas.'],
    caraCepat: 'Empat kata kunci emas di LJK → kegiatan usaha bulion.',
  },
  {
    id: 'pojk-bulion', tingkat: 'dasar', topik: 'regulasi', sumber: `${EB}, subbab 3.1.1 dan Daftar Rujukan`, berlakuPer: 'UU 4/2023 (P2SK) Pasal 132; POJK 17/2024',
    pertanyaan: 'Selain Pasal 132 UU Nomor 4 Tahun 2023 (P2SK), ketentuan OJK yang mengatur penyelenggaraan kegiatan usaha bulion adalah ....',
    jawaban: 'POJK Nomor 17 Tahun 2024',
    pengecoh: [
      P('POJK Nomor 2 Tahun 2026', 'POJK 2/2026 mengatur ETF emas di pasar modal, bukan kegiatan usaha bulion.'),
      P('POJK Nomor 27 Tahun 2024', 'POJK 27/2024 mengatur perdagangan aset keuangan digital termasuk aset kripto.'),
      P('POJK Nomor 8 Tahun 2024', 'POJK 8/2024 mengatur produk dan pemasaran asuransi.'),
      P('POJK Nomor 27 Tahun 2023', 'POJK 27/2023 mengatur penyelenggaraan usaha dana pensiun.'),
      P('POJK Nomor 4 Tahun 2026', 'POJK 4/2026 mengatur produk investasi perbankan syariah.'),
    ],
    konsep: 'Dasar hukum bulion', kataKunci: 'penyelenggaraan kegiatan usaha bulion',
    alasan: ['Landasan pokok kegiatan usaha bulion adalah Pasal 132 UU P2SK dan POJK Nomor 17 Tahun 2024 tentang Penyelenggaraan Kegiatan Usaha Bulion.'],
    caraCepat: 'Bulion = POJK 17/2024; ETF emas = POJK 2/2026.',
  },
  {
    id: 'kadar', tingkat: 'dasar', topik: 'standar-emas', sumber: `${EB}, subbab 3.1.3`, berlakuPer: POJK,
    pertanyaan: 'Menurut POJK 17/2024, emas untuk kegiatan usaha bulion berupa logam mulia batangan atau lempengan, bukan mata uang, dengan kandungan aurum (Au) paling rendah ....',
    jawaban: '99,9%',
    pengecoh: ['95%', '99%', '99,5%', '91,6%', '99,99%'].map((t) => P(t, `Ambang minimum kadar Au dalam definisi adalah 99,9%, bukan ${t}.`)),
    konsep: 'Standar emas bulion', kataKunci: 'kandungan aurum paling rendah',
    alasan: ['Emas bulion berupa batangan atau lempengan, bukan mata uang, berkadar Au paling rendah 99,9%, dan memenuhi SNI dan/atau standar internasional.'],
    caraCepat: 'Bulion: batangan/lempengan, bukan uang, Au ≥ 99,9%.',
  },
  {
    id: 'minimum-gramasi', tingkat: 'dasar', topik: 'perdagangan', sumber: `${EB}, subbab 3.1.8 dan contoh soal 4.4 (FAQ POJK 17/2024 pertanyaan 6)`, berlakuPer: POJK,
    pertanyaan: 'Batas minimum emas dalam satu transaksi Perdagangan Emas oleh LJK penyelenggara kegiatan usaha bulion adalah ....',
    jawaban: '500 gram per transaksi',
    pengecoh: ['100 gram per transaksi', '250 gram per transaksi', '750 gram per transaksi', '1.000 gram per transaksi', '50 gram per transaksi'].map((t) => P(t, `FAQ POJK 17/2024 menyebut minimum 500 gram per transaksi, bukan ${t.replace(' per transaksi', '')}.`)),
    konsep: 'Minimum perdagangan emas bulion', kataKunci: 'Perdagangan Emas oleh LJK bulion',
    alasan: ['Batas minimum gramasi Perdagangan Emas oleh LJK penyelenggara bulion paling sedikit 500 gram per transaksi; ketentuan ini bukan minimum pembelian emas ritel.'],
    caraCepat: 'Perdagangan bulion: minimal 500 gram dan serah fisik.',
  },
  {
    id: 'bukan-kegiatan', tingkat: 'menengah', topik: 'pengertian', sumber: `${EB}, subbab 3.1.4`, berlakuPer: POJK,
    pertanyaan: 'Berikut ini termasuk empat jenis utama kegiatan usaha bulion, KECUALI ....',
    jawaban: 'Pemurnian Emas',
    pengecoh: [
      P('Simpanan Emas', 'Simpanan Emas termasuk kegiatan usaha bulion.'),
      P('Pembiayaan Emas', 'Pembiayaan Emas termasuk kegiatan usaha bulion.'),
      P('Perdagangan Emas', 'Perdagangan Emas termasuk kegiatan usaha bulion.'),
      P('Penitipan Emas', 'Penitipan Emas termasuk kegiatan usaha bulion.'),
    ],
    konsep: 'Empat kegiatan usaha bulion', kataKunci: 'KECUALI',
    alasan: ['Empat kegiatan utama bulion: Simpanan, Pembiayaan, Perdagangan, dan Penitipan Emas oleh LJK.', 'Pemurnian emas (pengolahan bijih hasil tambang) adalah kegiatan industri hulu, bukan kegiatan usaha bulion LJK.'],
    caraCepat: 'Simpan, biayai, dagang, titip — selain itu bukan kegiatan utama bulion.',
  },
  {
    id: 'penyelenggara', tingkat: 'menengah', topik: 'kelembagaan', sumber: `${EB}, subbab 3.1.10 dan contoh soal 4.6`, berlakuPer: POJK,
    pertanyaan: 'Terkait pihak yang dapat menyelenggarakan kegiatan usaha bulion, pernyataan yang tepat adalah ....',
    jawaban: 'hanya LJK berusaha utama penyaluran kredit/pembiayaan yang memenuhi perizinan',
    pengecoh: [
      P('semua toko emas boleh menawarkan kegiatan bulion walaupun tanpa izin dari OJK', 'Kegiatan usaha bulion tidak terbuka otomatis bagi toko emas.'),
      P('seluruh LJK boleh menyelenggarakannya tanpa melihat jenis usaha utamanya', 'Penyelenggara dibatasi pada LJK dengan usaha utama penyaluran kredit/pembiayaan.'),
      P('setiap lembaga keuangan mikro dapat langsung membuka layanan bulion tanpa izin', 'LKM justru dikecualikan.'),
      P('semua BPR dan BPR Syariah otomatis memperoleh persetujuan kegiatan usaha bulion', 'Bank Perekonomian Rakyat dan BPR Syariah justru dikecualikan.'),
    ],
    konsep: 'Penyelenggara kegiatan usaha bulion', kataKunci: 'pihak yang dapat menyelenggarakan',
    alasan: ['Penyelenggara dibatasi pada LJK dengan kegiatan usaha utama penyaluran kredit atau pembiayaan, dengan pengecualian bank perekonomian rakyat, BPR syariah, dan lembaga keuangan mikro, serta wajib memenuhi perizinan OJK.'],
    caraCepat: 'Cari frasa “LJK yang memenuhi kriteria dan izin”, bukan “semua lembaga”.',
  },
  {
    id: 'fatwa-syariah', tingkat: 'menengah', topik: 'syariah', sumber: `${EB}, subbab 3.1.14 (rilis Roadmap Bulion 2026–2031)`, berlakuPer: 'Fatwa DSN-MUI 166/DSN-MUI/II/2026',
    pertanyaan: 'Menurut rilis OJK mengenai Roadmap Bulion 2026–2031, fatwa yang telah diterbitkan untuk kegiatan usaha bulion berdasarkan prinsip syariah adalah ....',
    jawaban: 'Fatwa Nomor 166/DSN-MUI/II/2026 dari DSN-MUI',
    pengecoh: [
      P('Fatwa Nomor 166/DSN-MUI/II/2026 dari OJK', 'Fatwa diterbitkan DSN-MUI, bukan OJK.'),
      P('Fatwa Nomor 17/DSN-MUI/2024 dari Bank Indonesia', 'Nomor dan lembaganya keliru; 17/2024 adalah nomor POJK bulion.'),
      P('Fatwa Nomor 2/DSN-MUI/2026 dari Bursa Efek Indonesia', 'BEI tidak menerbitkan fatwa; 2/2026 adalah nomor POJK ETF emas.'),
      P('Fatwa Nomor 166/DPS/II/2026 dari Dewan Pengawas Syariah', 'DPS mengawasi kepatuhan di lembaga, bukan menerbitkan fatwa nasional.'),
    ],
    konsep: 'Bulion berdasarkan prinsip syariah', kataKunci: 'fatwa kegiatan usaha bulion syariah',
    alasan: ['Rilis Roadmap Bulion 2026–2031 menyebut DSN-MUI telah menerbitkan Fatwa Nomor 166/DSN-MUI/II/2026 tentang Kegiatan Usaha Bulion Berdasarkan Prinsip Syariah.'],
    caraCepat: 'Fatwa keuangan syariah selalu dari DSN-MUI.',
  },
  {
    id: 'roadmap', tingkat: 'menengah', topik: 'kebijakan', sumber: `${EB}, subbab 3.1.15 dan contoh soal 4.10`, berlakuPer: 'Roadmap Bulion 2026–2031 (13 Mei 2026)',
    pertanyaan: 'Salah satu fokus Roadmap Pengembangan dan Penguatan Kegiatan Usaha dan Ekosistem Bulion 2026–2031 pada jalur industri jasa keuangan adalah ....',
    jawaban: 'menguatkan tata kelola, pengawasan, dan pelindungan konsumen',
    pengecoh: [
      P('meningkatkan produksi emas melalui hilirisasi pertambangan', 'Itu aspek hulu produksi, bukan jalur industri jasa keuangan.'),
      P('memperkuat koordinasi tata niaga hasil tambang antarkementerian', 'Itu bukan fokus jalur industri jasa keuangan.'),
      P('mengembangkan teknologi pemurnian bijih emas nasional', 'Pemurnian adalah aspek industri pengolahan.'),
      P('menghapus kewajiban pelaporan LJK penyelenggara bulion', 'Roadmap menguatkan, bukan melonggarkan, pengawasan.'),
    ],
    konsep: 'Roadmap bulion', kataKunci: 'jalur industri jasa keuangan',
    alasan: ['Pada jalur industri jasa keuangan, strategi roadmap meliputi manajemen risiko dan tata kelola, pengembangan produk, pengaturan/pengawasan/perizinan, pelindungan konsumen, dan pengembangan elemen ekosistem.'],
    caraCepat: 'Roadmap bulion di IJK = penguatan, bukan penghapusan kontrol.',
  },
];

const KASUS: ButirKurasi[] = [
  {
    id: 'simpanan-vs-penitipan', tingkat: 'menengah', topik: 'simpanan-penitipan', sumber: `${EB}, subbab 3.1.5–3.1.6 dan contoh soal 4.2`, berlakuPer: POJK,
    pertanyaan: 'Dua nasabah menempatkan emas di LJK penyelenggara bulion yang sama. Nasabah pertama memilih Simpanan Emas, sedangkan nasabah kedua memilih Penitipan Emas. Pernyataan yang tepat adalah ....',
    jawaban: 'emas simpanan dapat dikelola sesuai kesepakatan, emas titipan tidak boleh diputar',
    pengecoh: [
      P('emas titipan dapat disalurkan sebagai pembiayaan, sedangkan emas simpanan tidak boleh dikelola', 'Hubungannya terbalik.'),
      P('kedua jenis emas bebas dipakai lembaga untuk pembiayaan tanpa kesepakatan nasabah', 'Penggunaan emas simpanan pun harus sesuai ketentuan dan kesepakatan; emas titipan dilarang dipakai.'),
      P('kedua skema selalu mensyaratkan jual beli emas antara nasabah dan LJK sejak awal', 'Simpanan dan penitipan bukan transaksi jual beli.'),
      P('emas simpanan dan emas titipan selalu memberi hak penggunaan yang sama kepada LJK', 'Hak penggunaan emas pada keduanya berbeda.'),
    ],
    konsep: 'Hak penggunaan emas', kataKunci: 'Simpanan Emas vs Penitipan Emas',
    alasan: ['Emas simpanan dapat menjadi sumber pembiayaan dan/atau perdagangan sesuai ketentuan dan kesepakatan.', 'FAQ POJK 17/2024: emas titipan tidak boleh digunakan untuk pembiayaan atau perdagangan.'],
    caraCepat: 'Simpanan = mungkin dikelola; penitipan = dijaga tanpa diputar.',
  },
  {
    id: 'larangan-titipan', tingkat: 'menengah', topik: 'simpanan-penitipan', sumber: `${EB}, subbab 3.1.6 dan contoh soal 4.7`, berlakuPer: POJK,
    pertanyaan: 'Seorang petugas LJK menyarankan agar emas yang dititipkan nasabah dipakai sementara untuk pembiayaan kepada pihak lain dan dikembalikan sebelum nasabah mengambilnya. Keputusan yang tepat adalah ....',
    jawaban: 'menolak, karena emas titipan tidak boleh digunakan untuk pembiayaan',
    pengecoh: [
      P('mengizinkan karena nasabah sudah membayar imbal jasa penitipan emasnya', 'Imbal jasa penitipan tidak mengubah larangan penggunaan.'),
      P('mengizinkan asalkan pembiayaan itu selesai dan emas kembali pada hari yang sama', 'Tidak ada pengecualian waktu bagi emas titipan.'),
      P('mengalihkan emas titipan menjadi barang jaminan secara otomatis', 'Hubungan hukum tidak dapat diubah tanpa dasar.'),
      P('memakai sebagian emas tersebut selama pemiliknya belum menagih', 'Emas titipan wajib disimpan dan dikembalikan sesuai kondisi semula.'),
    ],
    konsep: 'Larangan pemanfaatan emas titipan', kataKunci: 'emas titipan dipakai untuk pembiayaan',
    alasan: ['Dalam Penitipan Emas, LJK wajib menyimpan emas dan mengembalikannya sesuai kondisi ketika dititipkan; emas titipan tidak boleh digunakan untuk pembiayaan maupun perdagangan.'],
    caraCepat: 'Ada kata “titipan”? Uji larangan penggunaannya.',
  },
  {
    id: 'gold-to-gold', tingkat: 'menengah', topik: 'pembiayaan', sumber: `${EB}, subbab 3.1.7 dan contoh soal 4.3`, berlakuPer: POJK,
    pertanyaan: 'Sebuah LJK menyediakan emas terstandardisasi kepada pelaku usaha untuk jangka waktu tertentu dalam skema Pembiayaan Emas. Setelah jangka waktu berakhir, kewajiban pokok pelaku usaha adalah ....',
    jawaban: 'mengembalikan sejumlah emas sesuai jumlah yang diperjanjikan',
    pengecoh: [
      P('mengganti emas yang diterima dengan unit penyertaan reksa dana', 'Kewajiban pokok pembiayaan bulion berbentuk emas.'),
      P('menyerahkan saham perusahaan dengan nilai yang sebanding', 'Saham tidak menggantikan kewajiban pengembalian emas.'),
      P('membayar nilai emas menurut kurs dolar saat kontrak berakhir', 'Kewajiban pokok tidak otomatis diganti pembayaran uang.'),
      P('melunasi cicilan rupiah tanpa perlu mengembalikan emas', 'Pembiayaan bulion bukan sekadar membeli emas secara mencicil.'),
    ],
    konsep: 'Pembiayaan Emas (gold-to-gold)', kataKunci: 'menyediakan emas, setelah jangka waktu berakhir',
    alasan: ['Pembiayaan Emas adalah penyediaan emas yang mewajibkan penerima mengembalikan sejumlah emas setelah jangka waktu tertentu dengan imbalan atau bagi hasil.'],
    caraCepat: 'Pinjam emas dalam skema bulion → kembalikan emas.',
  },
  {
    id: 'daring-serah-fisik', tingkat: 'menengah', topik: 'perdagangan', sumber: `${EB}, subbab 3.1.8 dan contoh soal 4.5 (FAQ POJK 17/2024 pertanyaan 7)`, berlakuPer: POJK,
    pertanyaan: 'Sebuah penyelenggara bulion memasarkan emas melalui situs web. Setiap transaksi memenuhi batas gramasi, dan emasnya diserahkan kepada pembeli secara fisik. Penilaian yang paling sesuai adalah ....',
    jawaban: 'pemasaran daring dimungkinkan, dan serah fisik tetap wajib dipenuhi',
    pengecoh: [
      P('tidak sah karena seluruh tahap transaksi harus dilakukan secara tatap muka', 'Pemasaran daring tidak otomatis dilarang.'),
      P('selalu dilarang karena pemasaran emas secara digital melanggar hukum', 'FAQ membedakan pemasaran daring dari penyerahan fisik.'),
      P('cukup menyerahkan bukti kepemilikan digital tanpa memberikan emas fisik', 'Perdagangan emas bulion wajib dilaksanakan secara fisik.'),
      P('emas fisik boleh diganti dengan poin loyalitas perusahaan', 'Poin loyalitas tidak menggantikan penyerahan emas.'),
    ],
    konsep: 'Pemasaran daring dan penyerahan fisik', kataKunci: 'situs web, diserahkan secara fisik',
    alasan: ['Pemasaran melalui kanal daring tidak otomatis dilarang, tetapi Perdagangan Emas bulion wajib dilaksanakan secara fisik.'],
    caraCepat: 'Promosi online boleh; penyelesaian tetap serah fisik.',
  },
  {
    id: 'bentuk-emas', tingkat: 'menengah', topik: 'standar-emas', sumber: `${EB}, subbab 3.1.3 dan contoh soal 4.8`, berlakuPer: POJK,
    pertanyaan: 'Dari bentuk emas berikut, yang paling sesuai dengan definisi emas untuk kegiatan usaha bulion menurut POJK 17/2024 adalah ....',
    jawaban: 'lempengan emas berkadar Au 99,9% yang telah memenuhi SNI',
    pengecoh: [
      P('perhiasan 22 karat yang bernilai tinggi di pasar ritel', 'Perhiasan bukan bentuk yang dimaksud definisi.'),
      P('koin emas berkadar 99,9% yang berfungsi sebagai mata uang', 'Definisi mengecualikan emas berbentuk mata uang.'),
      P('batangan berkadar Au 95% yang baru selesai dicetak', 'Kadarnya di bawah 99,9%.'),
      P('perhiasan 24 karat yang belum diperiksa standarnya', 'Perhiasan bukan bentuk yang dimaksud, dan standar harus dipenuhi.'),
    ],
    konsep: 'Bentuk, kadar, dan standar emas bulion', kataKunci: 'definisi emas bulion',
    alasan: ['Emas bulion harus berbentuk batangan atau lempengan, bukan mata uang, berkadar Au paling rendah 99,9%, serta memenuhi SNI dan/atau standar internasional.'],
    caraCepat: 'Saring tiga unsur: batangan/lempengan, bukan uang, Au ≥ 99,9% dan berstandar.',
  },
  {
    id: 'etf-vs-penitipan', tingkat: 'menengah', topik: 'produk-emas', sumber: `${EB}, subbab 3.1.16 dan contoh soal 4.9`, berlakuPer: 'POJK 2/2026; POJK 17/2024',
    pertanyaan: 'Seorang peserta menyamakan ETF emas dengan Penitipan Emas karena keduanya berhubungan dengan emas. Perbaikan konsep yang paling tepat adalah ....',
    jawaban: 'ETF emas adalah reksa dana di bursa; Penitipan Emas adalah layanan bulion',
    pengecoh: [
      P('ETF emas adalah bentuk penitipan seluruh emas milik nasabah di LJK bulion', 'ETF emas berupa unit penyertaan reksa dana, bukan titipan emas nasabah.'),
      P('ETF emas selalu membayar hasil dalam bentuk emas batangan pribadi investor', 'Hak investor ETF adalah atas unit penyertaan reksa dana.'),
      P('ETF emas diatur sebagai kegiatan pergadaian berbasis agunan emas', 'ETF emas adalah produk pasar modal, bukan pergadaian.'),
      P('ETF emas adalah nama lain dari Pembiayaan Emas fisik', 'Pembiayaan Emas adalah layanan bulion yang berbeda.'),
    ],
    konsep: 'Usaha bulion vs ETF emas', kataKunci: 'ETF emas, Penitipan Emas',
    alasan: ['POJK 2/2026 mengatur ETF emas sebagai reksa dana KIK yang unitnya diperdagangkan di bursa dengan aset dasar emas.', 'Penitipan Emas adalah layanan bulion yang diatur POJK 17/2024.'],
    caraCepat: 'ETF = unit reksa dana di bursa; penitipan = jasa simpan emas milik nasabah.',
  },
  {
    id: 'cicilan-vs-pembiayaan', tingkat: 'menantang', topik: 'pembiayaan', sumber: `${EB}, subbab 3.1.7 dan 3.1.18`, berlakuPer: POJK,
    pertanyaan: 'Pernyataan yang tepat mengenai perbedaan Pembiayaan Emas dalam POJK 17/2024 dan cicilan pembelian emas oleh konsumen adalah ....',
    jawaban: 'Pembiayaan Emas wajib dikembalikan dalam bentuk emas, bukan pembelian emas secara angsuran',
    pengecoh: [
      P('Pembiayaan Emas selalu berupa pembelian emas oleh konsumen secara mencicil dalam rupiah', 'Pembiayaan bulion bukan semata pembelian emas secara mencicil.'),
      P('cicilan emas dan Pembiayaan Emas sama-sama wajib dikembalikan kepada LJK dalam bentuk emas', 'Pada cicilan pembelian, konsumen memperoleh emas, bukan mengembalikannya.'),
      P('Pembiayaan Emas tidak mengenal imbalan maupun bagi hasil apa pun bagi penyelenggara', 'Pembiayaan Emas disertai imbalan atau bagi hasil sesuai kesepakatan.'),
      P('Pembiayaan Emas hanya boleh dilakukan oleh toko perhiasan yang terdaftar di asosiasi', 'Penyelenggaranya LJK yang memenuhi kriteria dan izin.'),
    ],
    konsep: 'Pembiayaan Emas vs cicilan emas', kataKunci: 'penyediaan emas, pengembalian emas',
    alasan: ['Cicilan berfokus pada akuisisi aset oleh pembeli, sedangkan Pembiayaan Emas menekankan penyediaan emas kepada pihak yang dibiayai dan pengembalian dalam bentuk emas.'],
    caraCepat: 'Arah emasnya: dibiayai lalu dikembalikan (bulion) vs dibeli untuk dimiliki (cicilan).',
  },
  {
    id: 'bank-emas-iklan', tingkat: 'dasar', topik: 'kelembagaan', sumber: `${EB}, subbab 3.1.1 dan 3.1.10`, berlakuPer: POJK,
    pertanyaan: 'Sebuah perusahaan mengiklankan dirinya sebagai “bank emas”. Kesimpulan yang tepat adalah ....',
    jawaban: 'sebutan itu tidak membuktikan izin; kegiatannya harus sesuai izin dari OJK',
    pengecoh: [
      P('perusahaan itu pasti berizin menjalankan seluruh jenis kegiatan usaha bulion', 'Sebutan dalam iklan tidak membuktikan cakupan izin.'),
      P('semua simpanan emasnya otomatis dijamin seperti simpanan uang di bank umum', 'Tidak tepat menganggap simpanan emas otomatis mendapat perlakuan penjaminan yang sama.'),
      P('perusahaan itu bebas dari kewajiban pelaporan berkala kepada OJK', 'Penyelenggara bulion tetap tunduk pada pelaporan dan pengawasan.'),
      P('istilah itu menandakan produk emasnya bebas dari risiko perubahan harga', 'Emas tetap memiliki risiko perubahan harga.'),
    ],
    konsep: 'Legalitas penyelenggara bulion', kataKunci: 'iklan “bank emas”',
    alasan: ['Istilah “bank emas” dipakai dalam komunikasi publik, tetapi tidak berarti setiap pihak otomatis berizin menyelenggarakan kegiatan usaha bulion; status dan cakupan izin harus diverifikasi.'],
    caraCepat: 'Nama di iklan ≠ izin; cek legalitas dan jenis kegiatannya.',
  },
  {
    id: 'majemuk', tingkat: 'menantang', topik: 'ringkasan', sumber: `${EB}, subbab 3.1.3–3.1.8 dan 3.1.18`, berlakuPer: POJK,
    pertanyaan: 'Perhatikan pernyataan berikut.\n(1) Emas titipan boleh dipakai LJK untuk perdagangan emas.\n(2) Perdagangan Emas bulion paling sedikit 500 gram per transaksi.\n(3) Koin emas yang berfungsi sebagai mata uang memenuhi definisi emas bulion.\n(4) Dalam Pembiayaan Emas, pengembalian kepada penyelenggara berupa emas.\nPernyataan yang benar adalah ....',
    jawaban: '(2) dan (4)',
    pengecoh: [
      P('(1) dan (2)', 'Pernyataan (1) salah: emas titipan dilarang dipakai untuk perdagangan.'),
      P('(1) dan (3)', 'Kedua pernyataan salah.'),
      P('(3) dan (4)', 'Pernyataan (3) salah: emas berbentuk mata uang dikecualikan.'),
      P('(1), (2), dan (4)', 'Pernyataan (1) salah.'),
      P('(2), (3), dan (4)', 'Pernyataan (3) salah.'),
    ],
    konsep: 'Pembeda yang sering tertukar', kataKunci: 'titipan, 500 gram, mata uang, gold-to-gold',
    alasan: ['Perdagangan bulion minimal 500 gram per transaksi dan Pembiayaan Emas dikembalikan dalam bentuk emas.', 'Emas titipan tidak boleh diputar, dan emas berbentuk mata uang tidak memenuhi definisi.'],
    caraCepat: 'Uji tiap pernyataan dengan tabel pembeda bulion.',
  },
  {
    id: 'harga-vs-berat', tingkat: 'dasar', topik: 'risiko', sumber: `${EB}, subbab 3.1.11 dan 3.1.13`,
    pertanyaan: 'Harga emas per gram turun sehingga nilai rupiah simpanan emas Rudi berkurang. Kesimpulan yang tepat adalah ....',
    jawaban: 'nilai rupiahnya turun karena risiko harga, tetapi berat emasnya tetap',
    pengecoh: [
      P('berat emas Rudi otomatis berkurang sebanding dengan penurunan harga per gram', 'Besaran fisik (gram) terpisah dari nilai rupiah.'),
      P('penurunan itu pasti disebabkan kesalahan pencatatan saldo emas oleh LJK', 'Penurunan harga pasar adalah risiko harga, bukan otomatis risiko operasional.'),
      P('LJK wajib mengganti selisih harga emas kepada Rudi pada akhir bulan', 'Tidak ada ketentuan bahwa LJK menanggung perubahan harga pasar.'),
      P('nilai emas dalam rupiah seharusnya selalu tetap selama disimpan di LJK', 'Nilai rupiah emas dapat naik atau turun.'),
    ],
    konsep: 'Risiko harga emas', kataKunci: 'harga per gram turun',
    alasan: ['Risiko harga: nilai rupiah emas dapat berubah ketika harga pasar naik atau turun. Fakta bahwa nilai rupiah turun tidak berarti berat emas berkurang.'],
    caraCepat: 'Pisahkan gram (fisik) dari rupiah (nilai).',
  },
];

const b = pembuatBaris(`${EB}, subbab 3.1.4–3.1.9 dan 3.1.16`, POJK);
const TABEL: TabelRelasi[] = [
  {
    id: 'skema', topik: 'skema-emas',
    tanyaNilai: (s) => `Di antara produk dan layanan berbasis emas, ciri utama ${s} adalah ....`,
    tanyaSubjek: (n) => `Skema berbasis emas yang bercirikan ${n} adalah ....`,
    alasanSalah: alasanRelasi, kalimat: kalimatRelasi, konsep: 'Membedakan skema berbasis emas',
    caraCepat: 'Tanyakan hak atas emasnya: boleh dikelola (simpanan), dijaga saja (penitipan), dipinjamkan dan kembali emas (pembiayaan), dijual-beli fisik minimal 500 g (perdagangan), jaminan pinjaman (gadai), unit reksa dana di bursa (ETF).',
    baris: [
      b('simpanan', 'Simpanan Emas', 'emas terstandardisasi dipercayakan kepada LJK dan dapat dimanfaatkan sebagai sumber pembiayaan atau perdagangan sesuai kesepakatan', 'menengah'),
      b('penitipan', 'Penitipan Emas', 'emas milik nasabah dijaga dengan imbal jasa dan dikembalikan sesuai kondisi semula tanpa boleh diputar', 'menengah'),
      b('pembiayaan', 'Pembiayaan Emas', 'penyediaan emas kepada pihak lain yang wajib dikembalikan dalam bentuk emas dengan imbalan atau bagi hasil'),
      b('perdagangan', 'Perdagangan Emas oleh LJK bulion', 'jual beli emas terstandardisasi paling sedikit 500 gram per transaksi dengan penyerahan fisik'),
      b('gadai', 'gadai emas', 'penyerahan emas sebagai jaminan atas suatu pinjaman'),
      b('etf', 'ETF emas', 'unit penyertaan reksa dana beraset dasar emas yang diperdagangkan di bursa efek', 'menengah', { berlakuPer: 'POJK 2/2026' }),
    ],
  },
];

const HITUNG: TemplateHitung[] = [
  {
    id: 'nilai-emas', topik: 'konversi', tingkat: 'dasar', sumber: `${EB}, subbab 3.1.13 (Contoh 1)`,
    set: [{ kg: 2.4, h: 1_500_000 }, { kg: 1.5, h: 1_400_000 }, { kg: 0.8, h: 1_600_000 }, { kg: 3, h: 1_450_000 }],
    pertanyaan: (p) => `Sebuah LJK mencatat ${String(p.kg).replace('.', ',')} kilogram emas. Dengan harga asumsi ${rp(p.h)} per gram (bukan harga pasar resmi), nilai ilustratif emas tersebut dalam rupiah adalah ....`,
    hitung: (p) => Math.round(p.kg * 1000) * p.h, format: rp,
    salah: [
      { nilai: (p) => p.kg * p.h, alasan: () => 'Kilogram belum dikonversi menjadi gram (1 kg = 1.000 gram).' },
      { nilai: (p) => Math.round(p.kg * 100) * p.h, alasan: () => 'Konversi keliru: 1 kg dianggap 100 gram.' },
      { nilai: (p) => Math.round(p.kg * 10_000) * p.h, alasan: () => 'Konversi keliru: 1 kg dianggap 10.000 gram.' },
      { nilai: (p) => 1000 * p.h, alasan: () => 'Itu nilai 1 kg saja; berat emas belum dikalikan.' },
    ],
    konsep: 'Memisahkan besaran fisik dan nilai rupiah', kataKunci: 'kilogram, harga per gram',
    langkah: (p) => [`${String(p.kg).replace('.', ',')} kg = ${angka(p.kg * 1000)} gram.`, `Nilai = ${angka(p.kg * 1000)} × ${rp(p.h)} = ${rp(Math.round(p.kg * 1000) * p.h)}; ini nilai ilustratif, bukan laba atau hak penarikan.`],
    caraCepat: 'Ubah kg ke gram (×1.000), lalu kalikan harga per gram.',
  },
  {
    id: 'perubahan-nilai', topik: 'risiko-harga', tingkat: 'menengah', sumber: `${EB}, subbab 3.1.13 (Contoh 3) dan contoh soal 4.11`,
    set: [{ g: 10, h1: 1_500_000, h2: 1_350_000 }, { g: 25, h1: 1_400_000, h2: 1_320_000 }, { g: 50, h1: 1_600_000, h2: 1_540_000 }, { g: 100, h1: 1_450_000, h2: 1_380_000 }],
    pertanyaan: (p) => `Nilai ${p.g} gram emas dihitung memakai harga asumsi ${rp(p.h1)} per gram, lalu harga asumsi turun menjadi ${rp(p.h2)} per gram. Tanpa memperhitungkan selisih jual-beli dan biaya, penurunan nilai rupiahnya adalah ....`,
    hitung: (p) => p.g * (p.h1 - p.h2), format: rp,
    salah: [
      { nilai: (p) => p.h1 - p.h2, alasan: () => 'Itu penurunan per gram; belum dikalikan jumlah gram.' },
      { nilai: (p) => p.g * p.h2, alasan: () => 'Itu nilai akhir, bukan penurunannya.' },
      { nilai: (p) => p.g * p.h1, alasan: () => 'Itu nilai awal, bukan penurunannya.' },
      { nilai: (p) => p.h2, alasan: () => 'Itu harga baru per gram.' },
    ],
    konsep: 'Risiko harga emas', kataKunci: 'harga per gram turun',
    langkah: (p) => [`Selisih harga per gram = ${rp(p.h1)} − ${rp(p.h2)} = ${rp(p.h1 - p.h2)}.`, `Penurunan nilai = ${rp(p.h1 - p.h2)} × ${p.g} gram = ${rp(p.g * (p.h1 - p.h2))}; berat emas tetap ${p.g} gram.`],
    caraCepat: 'Hitung selisih harga per gram, lalu kalikan jumlah gram.',
  },
  {
    id: 'jumlah-keping', topik: 'perdagangan', tingkat: 'dasar', sumber: `${EB}, subbab 3.1.13 (Contoh 2) dan contoh soal 4.12`, berlakuPer: POJK,
    set: [{ w: 250 }, { w: 100 }, { w: 50 }, { w: 200 }],
    pertanyaan: (p) => `Sebuah LJK menyiapkan batangan emas ${p.w} gram per keping untuk transaksi Perdagangan Emas bulion. Agar memenuhi batas minimum 500 gram dalam satu transaksi, jumlah keping paling sedikit adalah ....`,
    hitung: (p) => Math.ceil(500 / p.w), format: (v) => `${angka(v)} keping`,
    salah: [
      { nilai: (p) => Math.ceil(500 / p.w) - 1, alasan: () => 'Jumlah itu belum mencapai 500 gram.' },
      { nilai: (p) => Math.ceil(500 / p.w) + 1, alasan: () => 'Jumlah itu melebihi jumlah minimum yang diperlukan.' },
      { nilai: (p) => Math.ceil(500 / p.w) + 2, alasan: () => 'Jumlah itu melebihi jumlah minimum yang diperlukan.' },
      { nilai: (p) => Math.ceil(500 / p.w) + 3, alasan: () => 'Jumlah itu melebihi jumlah minimum yang diperlukan.' },
      { nilai: (p) => Math.ceil(1000 / p.w), alasan: () => 'Ambang yang dipakai 1.000 gram, padahal minimumnya 500 gram.' },
      { nilai: (p) => Math.floor(500 / p.w) === 500 / p.w ? NaN : Math.floor(500 / p.w), alasan: () => 'Hasil bagi dibulatkan ke bawah sehingga belum mencapai 500 gram.' },
    ],
    konsep: 'Penerapan batas minimum gramasi', kataKunci: 'minimum 500 gram per transaksi',
    langkah: (p) => [`500 ÷ ${p.w} = ${angka(500 / p.w)}; dibulatkan ke atas menjadi ${Math.ceil(500 / p.w)} keping (${Math.ceil(500 / p.w) * p.w} gram).`],
    caraCepat: 'Minimum keping = 500 ÷ berat per keping, bulatkan ke atas.',
  },
];

export const BULION = [
  familyKurasi({
    id: 'PSJK-BULION-FAKTA', nama: 'Bulion: definisi, regulasi, standar emas', chapter: 'bulion', label: 'SHL',
    sumber: `${EB} (contoh soal 4.1–4.12)`,
    ringkas: 'Soal fakta langsung: definisi kegiatan usaha bulion, POJK 17/2024 dan Pasal 132 UU P2SK, kadar Au 99,9%, minimum 500 gram, empat kegiatan (KECUALI), penyelenggara, fatwa DSN-MUI 166/2026, roadmap 2026–2031.',
  }, FAKTA),
  familyRelasi({
    id: 'PSJK-BULION-RELASI', nama: 'Bulion: membedakan skema berbasis emas (dua arah)', chapter: 'bulion', label: 'VARIASI',
    sumber: `${EB}, subbab 3.1.4–3.1.9 dan 3.1.16`,
    ringkas: 'Tabel relasi dua arah enam skema emas: Simpanan, Penitipan, Pembiayaan, Perdagangan Emas, gadai emas, dan ETF emas, dibedakan dari hak penggunaan dan kewajiban pengembaliannya.',
  }, TABEL),
  familyKurasi({
    id: 'PSJK-BULION-KASUS', nama: 'Bulion: kasus dan pernyataan majemuk', chapter: 'bulion', label: 'VARIASI',
    sumber: `${EB}, subbab 3.1.3–3.1.18`,
    ringkas: 'Kasus simpanan vs penitipan, larangan memakai emas titipan, gold-to-gold, pemasaran daring dan serah fisik, bentuk emas yang memenuhi definisi, ETF emas vs penitipan, cicilan vs pembiayaan, iklan “bank emas”, risiko harga, pernyataan majemuk.',
  }, KASUS),
  familyHitung({
    id: 'PSJK-BULION-HITUNG', nama: 'Bulion: hitungan gram dan nilai rupiah', chapter: 'bulion', label: 'VARIASI',
    sumber: `${EB}, subbab 3.1.13`,
    ringkas: 'Tiga template: nilai ilustratif emas (kg → gram × harga), penurunan nilai karena harga turun, dan jumlah keping minimum untuk transaksi 500 gram.',
  }, HITUNG),
];
