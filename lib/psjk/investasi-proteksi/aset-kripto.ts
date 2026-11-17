import type { ButirKurasi, TabelRelasi } from '../umum';
import { familyKurasi, familyRelasi } from '../umum';
import { P, SUMBER, alasanRelasi, kalimatRelasi, kapital, pembuatBaris } from './alat';
import { angka, familyHitung, persen, rp, type TemplateHitung } from './hitung';

// Chapter Aset Kripto (kebutuhan 25 = 2×10 + 1×5). Sumber: e-book tim "Investasi dan Proteksi – Aset Kripto" (merangkum
// UU P2SK dan UU 4/2026, POJK 27/2024 jo. POJK 23/2025, PADK 3/2026, siaran pers OJK, dan siaran pers BI 2018 tentang
// virtual currency). Pengawasan mengikuti versi terbaru: OJK sejak 10 Januari 2025 (bukan lagi Bappebti). Potret jumlah
// pelaku berizin per September 2026 tidak dipakai karena berubah sewaktu-waktu.

const EB = SUMBER.ebKripto;
const POJK = 'POJK 27/2024 jo. POJK 23/2025';

const FAKTA: ButirKurasi[] = [
  {
    id: 'pengawas', tingkat: 'dasar', topik: 'pengawasan', sumber: `${EB}, subbab 3.1.4 dan contoh soal 4.1`, berlakuPer: 'UU 4/2023 (P2SK); peralihan 10 Januari 2025',
    pertanyaan: 'Setelah peralihan kewenangan pada 2025, lembaga yang mengatur dan mengawasi perdagangan aset keuangan digital termasuk aset kripto di Indonesia adalah ....',
    jawaban: 'Otoritas Jasa Keuangan (OJK)',
    pengecoh: [
      P('Badan Pengawas Perdagangan Berjangka Komoditi (Bappebti)', 'Bappebti mengawasi pada periode awal; kewenangannya beralih ke OJK sejak 10 Januari 2025.'),
      P('Bank Indonesia (BI)', 'BI berwenang di bidang sistem pembayaran, bukan pengawas perdagangan aset kripto.'),
      P('Kementerian Perdagangan', 'Kementerian Perdagangan bukan pengawas perdagangan AKD setelah peralihan.'),
      P('Bursa Aset Keuangan Digital', 'Bursa adalah penyelenggara yang diawasi, bukan otoritas pengawas.'),
    ],
    konsep: 'Kewenangan pengawasan aset kripto', kataKunci: 'setelah peralihan kewenangan 2025',
    alasan: ['UU P2SK menjadi dasar peralihan pengaturan dan pengawasan AKD termasuk aset kripto dari Bappebti ke OJK; pelaksanaan kewenangan OJK dimulai 10 Januari 2025.'],
    caraCepat: 'Pengawas kripto sekarang = OJK; BI = sistem pembayaran.',
  },
  {
    id: 'tanggal-peralihan', tingkat: 'menengah', topik: 'kronologi', sumber: `${EB}, subbab 3.1.4 dan contoh soal 4.13`, berlakuPer: 'UU 4/2023 (P2SK)',
    pertanyaan: 'Serah terima dan dimulainya pelaksanaan kewenangan OJK dalam mengatur dan mengawasi aset kripto, menggantikan Bappebti, terjadi pada ....',
    jawaban: '10 Januari 2025',
    pengecoh: [
      P('10 November 2025', 'Tanggal itu adalah mulai berlakunya POJK 23/2025.'),
      P('20 Januari 2026', 'Tanggal itu adalah pengakhiran masa transisi kerja sama OJK–Bappebti.'),
      P('17 Juni 2026', 'Tanggal itu adalah mulai berlakunya UU 4/2026.'),
      P('1 September 2026', 'Tanggal itu adalah mulai berlakunya PADK 3/2026.'),
    ],
    konsep: 'Kronologi peralihan pengawasan', kataKunci: 'serah terima kewenangan',
    alasan: ['10 Januari 2025 adalah tanggal peralihan pengawasan dari Bappebti ke OJK sekaligus mulai berlakunya POJK 27/2024.'],
    caraCepat: 'Bedakan: 10 Jan 2025 serah terima; 20 Jan 2026 akhir masa transisi.',
  },
  {
    id: 'dasar-uu', tingkat: 'dasar', topik: 'regulasi', sumber: `${EB}, subbab 3.1.4`, berlakuPer: 'UU 4/2023 (P2SK)',
    pertanyaan: 'Undang-undang yang menjadi dasar peralihan pengaturan dan pengawasan aset keuangan digital termasuk aset kripto dari Bappebti ke OJK adalah ....',
    jawaban: 'UU Nomor 4 Tahun 2023',
    pengecoh: [
      P('UU Nomor 8 Tahun 1995', 'UU 8/1995 tentang Pasar Modal tidak mengatur peralihan pengawasan aset kripto.'),
      P('UU Nomor 21 Tahun 2008', 'UU 21/2008 mengatur perbankan syariah.'),
      P('UU Nomor 40 Tahun 2014', 'UU 40/2014 mengatur perasuransian.'),
      P('UU Nomor 11 Tahun 1992', 'UU 11/1992 mengatur dana pensiun.'),
      P('UU Nomor 4 Tahun 2026', 'UU 4/2026 (berlaku 17 Juni 2026) mengubah UU P2SK dan menambah pengaturan LJK Aset Kripto; peralihan pengawasan sudah berlangsung sejak 10 Januari 2025 berdasarkan UU P2SK.'),
    ],
    konsep: 'Dasar hukum pengawasan aset kripto', kataKunci: 'dasar peralihan dari Bappebti ke OJK',
    alasan: ['UU Nomor 4 Tahun 2023 tentang Pengembangan dan Penguatan Sektor Keuangan (P2SK) menjadi dasar peralihan; UU 4/2026 kemudian mengubah UU P2SK tanpa mengubah fakta peralihan tersebut.'],
    caraCepat: 'Peralihan pengawasan kripto ke OJK = UU P2SK.',
  },
  {
    id: 'pojk-kerangka', tingkat: 'menengah', topik: 'regulasi', sumber: `${EB}, subbab 3.1.4`, berlakuPer: POJK,
    pertanyaan: 'Peraturan OJK yang berlaku mulai 10 Januari 2025 dan menjadi kerangka penyelenggaraan perdagangan aset keuangan digital termasuk aset kripto adalah ....',
    jawaban: 'POJK Nomor 27 Tahun 2024',
    pengecoh: [
      P('POJK Nomor 17 Tahun 2024', 'POJK 17/2024 mengatur kegiatan usaha bulion.'),
      P('POJK Nomor 8 Tahun 2024', 'POJK 8/2024 mengatur produk asuransi.'),
      P('POJK Nomor 35 Tahun 2024', 'POJK 35/2024 mengatur perizinan dan kelembagaan dana pensiun.'),
      P('POJK Nomor 2 Tahun 2026', 'POJK 2/2026 mengatur ETF emas.'),
    ],
    konsep: 'Regulasi perdagangan AKD', kataKunci: 'berlaku mulai 10 Januari 2025',
    alasan: ['POJK Nomor 27 Tahun 2024 berlaku mulai 10 Januari 2025; perubahannya melalui POJK 23/2025 berlaku mulai 10 November 2025.'],
    caraCepat: 'Kripto: POJK 27/2024, diubah POJK 23/2025.',
  },
  {
    id: 'alat-pembayaran', tingkat: 'dasar', topik: 'alat-pembayaran', sumber: `${EB}, subbab 3.1.8 dan contoh soal 4.4 (siaran pers BI 2018)`,
    pertanyaan: 'Pernyataan yang benar mengenai kedudukan aset kripto di Indonesia adalah ....',
    jawaban: 'aset kripto bukan merupakan alat pembayaran yang sah di Indonesia',
    pengecoh: [
      P('aset kripto merupakan mata uang nasional pengganti rupiah', 'Rupiah tetap mata uang yang sah.'),
      P('aset kripto otomatis menjadi alat bayar sah jika nilainya stabil', 'Kestabilan nilai tidak mengubah status alat pembayaran.'),
      P('aset kripto sah sebagai alat bayar setelah masuk daftar aset bursa', 'Daftar aset terkait perdagangan, bukan status alat pembayaran.'),
      P('aset kripto sah untuk membayar semua kewajiban di dalam negeri', 'Bank Indonesia menegaskan virtual currency tidak diakui sebagai alat pembayaran sah.'),
    ],
    konsep: 'Aset kripto dan alat pembayaran', kataKunci: 'alat pembayaran yang sah',
    alasan: ['Bank Indonesia menegaskan virtual currency termasuk bitcoin tidak diakui sebagai alat pembayaran yang sah di Indonesia.', 'Aset kripto dapat menjadi objek perdagangan sesuai regulasi, tetapi tidak sah dipakai sebagai alat pembayaran.'],
    caraCepat: 'Pisahkan legalitas perdagangan dari status alat pembayaran.',
  },
  {
    id: 'definisi-akd', tingkat: 'menengah', topik: 'definisi', sumber: `${EB}, subbab 3.1.1 (Pasal 1 POJK 27/2024 jo. POJK 23/2025)`, berlakuPer: POJK,
    pertanyaan: 'Menurut POJK 27/2024 sebagaimana diubah POJK 23/2025, aset keuangan yang disimpan atau direpresentasikan secara digital, termasuk aset kripto, disebut ....',
    jawaban: 'Aset Keuangan Digital (AKD)',
    pengecoh: [
      P('uang elektronik', 'Saldo uang elektronik tidak otomatis menjadi AKD yang diperdagangkan.'),
      P('Daftar Aset Keuangan Digital (DAKD)', 'DAKD adalah daftar aset yang boleh diperdagangkan, bukan kategori aset.'),
      P('efek beragun aset', 'EBA adalah efek pasar modal berbasis kumpulan aset keuangan.'),
      P('Simpanan Emas', 'Simpanan Emas adalah kegiatan usaha bulion.'),
    ],
    konsep: 'Aset Keuangan Digital', kataKunci: 'disimpan atau direpresentasikan secara digital, termasuk aset kripto',
    alasan: ['AKD adalah aset keuangan yang disimpan atau direpresentasikan secara digital, termasuk aset kripto; Pasal 3A POJK 23/2025 membaginya menjadi aset kripto dan AKD lainnya, termasuk derivatif AKD.'],
    caraCepat: 'AKD = payung; aset kripto salah satu jenisnya.',
  },
  {
    id: 'definisi-kripto', tingkat: 'menengah', topik: 'definisi', sumber: `${EB}, subbab 3.1.1`, berlakuPer: POJK,
    pertanyaan: 'Representasi digital nilai yang dapat disimpan dan ditransfer menggunakan teknologi buku besar terdistribusi, misalnya blockchain, untuk memverifikasi transaksi dan mengamankan informasi disebut ....',
    jawaban: 'aset kripto',
    pengecoh: [
      P('uang elektronik', 'Uang elektronik adalah alat pembayaran yang dicatat penerbitnya, bukan aset kripto.'),
      P('derivatif AKD', 'Derivatif AKD adalah kontrak yang nilainya merujuk pada AKD dasar.'),
      P('saham tanpa warkat', 'Saham adalah tanda penyertaan modal pada perseroan.'),
      P('unit penyertaan reksa dana', 'Unit penyertaan adalah bukti kepemilikan reksa dana.'),
    ],
    konsep: 'Pengertian aset kripto', kataKunci: 'representasi digital nilai, buku besar terdistribusi',
    alasan: ['Aset kripto adalah representasi digital nilai yang dapat disimpan dan ditransfer dengan teknologi yang memungkinkan buku besar terdistribusi untuk memverifikasi transaksi dan mengamankan informasi.'],
    caraCepat: 'Nilai digital + buku besar terdistribusi = aset kripto.',
  },
  {
    id: 'pembagian-akd', tingkat: 'menantang', topik: 'definisi', sumber: `${EB}, subbab 3.1.1 (Pasal 3A POJK 23/2025)`, berlakuPer: 'POJK 23/2025',
    pertanyaan: 'Pasal 3A POJK 23/2025 membagi Aset Keuangan Digital (AKD) menjadi ....',
    jawaban: 'aset kripto dan AKD lainnya, termasuk derivatif AKD',
    pengecoh: [
      P('aset kripto dan uang elektronik yang diterbitkan bank', 'Uang elektronik tidak termasuk pembagian AKD tersebut.'),
      P('saham digital dan obligasi digital yang tercatat di bursa', 'Pembagiannya bukan berdasarkan jenis efek pasar modal.'),
      P('stablecoin dan mata uang rupiah digital', 'Rupiah tidak termasuk AKD; stablecoin adalah salah satu jenis aset kripto.'),
      P('NFT dan saldo rekening bank elektronik', 'Saldo rekening yang hanya dicatat elektronik oleh LJK dikecualikan.'),
    ],
    konsep: 'Cakupan AKD', kataKunci: 'Pasal 3A POJK 23/2025',
    alasan: ['Pasal 3A POJK 23/2025 membagi AKD menjadi aset kripto dan AKD lainnya; kategori AKD lainnya mencakup derivatif AKD.'],
    caraCepat: 'AKD = aset kripto + AKD lainnya (derivatif).',
  },
];

const KASUS: ButirKurasi[] = [
  {
    id: 'di-luar-dakd', tingkat: 'menengah', topik: 'dakd', sumber: `${EB}, subbab 3.1.7 dan contoh soal 4.3`, berlakuPer: 'POJK 23/2025',
    pertanyaan: 'Sebuah token sangat ramai dibahas di media sosial, tetapi tidak tercantum dalam Daftar Aset Keuangan Digital (DAKD) yang ditetapkan bursa. Penilaian yang tepat adalah ....',
    jawaban: 'penyelenggara dilarang memperdagangkan token itu dalam pasar yang diatur OJK',
    pengecoh: [
      P('token itu boleh diperdagangkan karena volume pembicaraannya di media sosial besar', 'Popularitas tidak menggantikan ketentuan daftar aset.'),
      P('token itu otomatis diperbolehkan jika jumlah pendukungnya di komunitas banyak', 'Jumlah pendukung tidak relevan dengan status DAKD.'),
      P('token itu cukup disetujui konsumen tanpa harus mengikuti daftar bursa', 'Persetujuan konsumen tidak menggantikan DAKD.'),
      P('token itu sah diperdagangkan begitu dipromosikan aplikasi keuangan umum', 'Promosi tidak membuat aset layak diperdagangkan.'),
    ],
    konsep: 'Daftar Aset Keuangan Digital', kataKunci: 'tidak tercantum dalam DAKD',
    alasan: ['POJK 23/2025 melarang penyelenggara memperdagangkan AKD di luar DAKD yang ditetapkan bursa.'],
    caraCepat: 'Di luar DAKD = tidak boleh diperdagangkan di pasar yang diatur.',
  },
  {
    id: 'stablecoin', tingkat: 'menengah', topik: 'risiko', sumber: `${EB}, subbab 3.1.3, 3.1.11 dan contoh soal 4.8`,
    pertanyaan: 'Sebuah token dirancang mengikuti nilai acuan tertentu, tetapi kemudian nilainya menyimpang jauh dari acuan tersebut. Kesimpulan yang tepat adalah ....',
    jawaban: 'rancangan nilai stabil tetap dapat gagal menjaga hubungan dengan acuannya',
    pengecoh: [
      P('nama token yang stabil membuktikan nilainya pasti kembali ke acuan', 'Kata “stabil” menunjukkan tujuan desain, bukan jaminan.'),
      P('penyimpangan nilai membuktikan token tersebut telah berubah menjadi rupiah', 'Token tidak berubah menjadi rupiah.'),
      P('perubahan harga token menghapus seluruh kewajiban keterbukaan penerbitnya', 'Kewajiban keterbukaan tidak hilang karena harga berubah.'),
      P('acuan nilai menjamin token bebas dari risiko likuiditas di pasar', 'Desain nilai acuan tidak menghapus risiko likuiditas.'),
    ],
    konsep: 'Risiko mekanisme stabilisasi', kataKunci: 'token mengikuti nilai acuan, lalu menyimpang',
    alasan: ['Stablecoin dirancang menjaga hubungan nilai dengan acuan tertentu, tetapi desain itu tidak menghilangkan kemungkinan penyimpangan nilai atau risiko penjaminan aset.'],
    caraCepat: '“Stable” = tujuan desain, bukan jaminan.',
  },
  {
    id: 'spot-derivatif', tingkat: 'menengah', topik: 'derivatif', sumber: `${EB}, subbab 3.1.13 dan contoh soal 4.9`, berlakuPer: 'POJK 23/2025',
    pertanyaan: 'Pernyataan yang paling tepat untuk membedakan pembelian aset kripto secara langsung (spot) dengan kontrak derivatif AKD adalah ....',
    jawaban: 'derivatif mengacu pada aset dasar tanpa pemegangnya selalu memiliki aset itu',
    pengecoh: [
      P('keduanya selalu memberikan hak kepemilikan yang sama atas aset kripto dasar', 'Pemegang derivatif tidak otomatis memiliki aset dasar.'),
      P('kontrak derivatif tidak memiliki ketentuan margin maupun penyelesaian apa pun', 'Derivatif justru memiliki unsur margin dan persyaratan penyelesaian.'),
      P('pembelian aset kripto secara langsung otomatis berstatus kontrak derivatif', 'Jenis instrumen ditentukan struktur hak dan kewajibannya.'),
      P('kontrak derivatif AKD hanya berlaku untuk transaksi mata uang fisik', 'Derivatif AKD mengacu pada AKD dasar.'),
    ],
    konsep: 'Spot vs derivatif AKD', kataKunci: 'kepemilikan langsung vs kontrak',
    alasan: ['Derivatif AKD adalah kontrak yang nilainya mengacu pada pergerakan AKD tertentu; pemegang kontrak tidak otomatis memiliki aset dasarnya.'],
    caraCepat: 'Cari unsur kontrak yang nilainya terkait aset dasar.',
  },
  {
    id: 'knowledge-test', tingkat: 'menengah', topik: 'derivatif', sumber: `${EB}, subbab 3.1.13 dan contoh soal 4.10`, berlakuPer: 'POJK 23/2025',
    pertanyaan: 'Menurut POJK 23/2025, langkah yang wajib diikuti konsumen sebelum melakukan perdagangan derivatif AKD adalah ....',
    jawaban: 'mengikuti knowledge test yang diselenggarakan pedagang',
    pengecoh: [
      P('menandatangani pernyataan bahwa seluruh risiko ditanggung bursa', 'Risiko tidak dialihkan kepada bursa.'),
      P('memperoleh jaminan pedagang bahwa nilai kontrak tidak turun', 'Tidak ada jaminan nilai kontrak.'),
      P('memberikan persetujuan lisan tanpa pengujian pengetahuan', 'Ketentuan justru mewajibkan uji pengetahuan.'),
      P('mendapat surat rekomendasi dari Bank Indonesia', 'BI tidak terlibat dalam persyaratan konsumen derivatif AKD.'),
    ],
    konsep: 'Pelindungan konsumen derivatif', kataKunci: 'sebelum perdagangan derivatif AKD',
    alasan: ['Konsumen yang akan melakukan perdagangan derivatif AKD wajib mengikuti knowledge test yang diselenggarakan pedagang; hal ini bukan jaminan keuntungan.'],
    caraCepat: 'Derivatif AKD → knowledge test.',
  },
  {
    id: 'whitelist', tingkat: 'dasar', topik: 'legalitas', sumber: `${EB}, subbab 3.1.9 dan contoh soal 4.11`,
    pertanyaan: 'Seseorang menemukan aplikasi kripto berlogo mirip regulator, tetapi identitas badan usahanya belum jelas. Sikap analitis yang tepat untuk memastikan legalitasnya adalah ....',
    jawaban: 'mencocokkan nama entitas dan platform dengan whitelist resmi OJK',
    pengecoh: [
      P('menilai legalitas dari kemiripan logo aplikasi dengan logo pengawas', 'Logo tidak membuktikan status izin.'),
      P('menyimpulkan izin dari komentar pengguna yang tampak asli dan positif', 'Testimoni tidak membuktikan perizinan.'),
      P('mencari status izin dari unggahan media sosial', 'Klaim media sosial bukan sumber resmi.'),
      P('menilai legalitas dari peringkat unduhan aplikasi di toko aplikasi', 'Popularitas aplikasi tidak membuktikan izin.'),
    ],
    konsep: 'Pemeriksaan legalitas', kataKunci: 'logo mirip regulator, identitas belum jelas',
    alasan: ['Whitelist OJK berfungsi memverifikasi entitas dan aplikasi/platform yang memperoleh izin atau penetapan; status dibaca bersama nama badan usaha dan kanal resminya.'],
    caraCepat: 'Legalitas = daftar resmi, bukan tampilan aplikasi.',
  },
  {
    id: 'izin-bukan-jaminan', tingkat: 'dasar', topik: 'legalitas', sumber: `${EB}, subbab 3.1.7, 3.1.9 dan contoh soal 4.15`,
    pertanyaan: 'Seorang peserta menyimpulkan bahwa aset kripto yang diperdagangkan melalui pedagang berizin pasti tidak dapat turun nilainya. Penilaian terbaik adalah ....',
    jawaban: 'izin penyelenggara tidak menjamin harga aset selalu naik',
    pengecoh: [
      P('izin berarti semua produk memiliki imbal hasil tetap', 'Izin tidak menetapkan imbal hasil.'),
      P('OJK menanggung kerugian investasi pada pedagang berizin', 'Pengawasan bukan jaminan atas nilai aset.'),
      P('status berizin membuat analisis risiko tidak diperlukan lagi', 'Risiko pasar tetap harus dianalisis.'),
      P('pencantuman di DAKD memastikan hasil investasi pasti', 'DAKD bukan jaminan harga.'),
    ],
    konsep: 'Perizinan dan risiko pasar', kataKunci: 'pedagang berizin, pasti tidak turun',
    alasan: ['Perizinan dan pengawasan mendukung tata kelola dan pelindungan konsumen, bukan jaminan terhadap perubahan nilai pasar aset.'],
    caraCepat: 'Pisahkan legalitas lembaga dari risiko harga.',
  },
  {
    id: 'kronologi-transisi', tingkat: 'menantang', topik: 'kronologi', sumber: `${EB}, subbab 3.1.4`, berlakuPer: 'UU 4/2023 (P2SK); siaran pers OJK 20 Januari 2026',
    pertanyaan: 'Pernyataan kronologi yang tepat mengenai pengalihan pengawasan aset kripto dari Bappebti ke OJK adalah ....',
    jawaban: 'serah terima 10 Januari 2025, sedangkan masa transisi diakhiri 20 Januari 2026',
    pengecoh: [
      P('serah terima 20 Januari 2026, sedangkan masa transisi diakhiri 10 Januari 2025', 'Tanggalnya tertukar: serah terima 10 Januari 2025, akhir masa transisi 20 Januari 2026.'),
      P('serah terima kewenangan dan pengakhiran masa transisi sama-sama terjadi pada 2023', 'UU P2SK terbit 2023, tetapi serah terima baru dilaksanakan 10 Januari 2025.'),
      P('Bappebti menerima kembali kewenangan pengawasan aset kripto pada akhir 2025', 'Kewenangan tidak dikembalikan kepada Bappebti.'),
      P('Bank Indonesia mengambil alih pengawasan perdagangan aset kripto mulai 2026', 'BI berwenang di sistem pembayaran, bukan perdagangan AKD.'),
      P('OJK baru mulai mengawasi aset kripto untuk pertama kali pada September 2026', 'September 2026 adalah berlakunya PADK 3/2026, bukan awal pengawasan OJK.'),
    ],
    konsep: 'Kronologi kewenangan', kataKunci: 'serah terima dan akhir masa transisi',
    alasan: ['Serah terima dan dimulainya kewenangan OJK berlangsung 10 Januari 2025, sedangkan masa transisi kerja sama secara resmi diakhiri 20 Januari 2026.'],
    caraCepat: 'Dua tanggal berbeda: serah terima (10 Jan 2025) dan akhir transisi (20 Jan 2026).',
  },
  {
    id: 'pelaporan', tingkat: 'menengah', topik: 'pelaporan', sumber: `${EB}, subbab 3.1.14 dan contoh soal 4.14`, berlakuPer: 'PADK 3/2026 (berlaku 1 September 2026)',
    pertanyaan: 'Sebuah pedagang AKD ingin menunda laporan berkala dan hasil evaluasi DAKD karena harga aset sedang turun. Penilaian yang tepat adalah ....',
    jawaban: 'tidak dibenarkan, karena pelaporan adalah bagian dari akuntabilitas dan pengawasan',
    pengecoh: [
      P('penundaan dibenarkan karena laporan berkala hanya wajib disampaikan saat harga naik', 'Kewajiban pelaporan tidak bergantung pada untung atau rugi.'),
      P('laporan berkala dapat diganti dengan unggahan di media sosial perusahaan', 'Pelaporan mengikuti saluran dan ketentuan resmi.'),
      P('kewajiban pelaporan diatur Bank Indonesia sehingga OJK tidak terlibat sama sekali', 'PADK 3/2026 adalah ketentuan OJK.'),
      P('pelaporan cukup dilakukan sekali, yaitu saat izin usaha pertama kali diterbitkan', 'PADK 3/2026 mengatur laporan bulanan, triwulanan, tahunan, dan insidental.'),
    ],
    konsep: 'Kewajiban pelaporan AKD', kataKunci: 'menunda laporan karena harga turun',
    alasan: ['PADK 3/2026 memperbarui pelaporan, antara lain evaluasi DAKD, laporan bulanan, triwulanan, tahunan, dan insidental.', 'Pelaporan adalah fungsi akuntabilitas dan pengawasan, bukan bergantung pada kondisi harga.'],
    caraCepat: 'Kewajiban lapor tidak ikut naik-turun bersama harga.',
  },
  {
    id: 'majemuk', tingkat: 'menantang', topik: 'ringkasan', sumber: `${EB}, subbab 3.1.4–3.1.8`, berlakuPer: POJK,
    pertanyaan: 'Perhatikan pernyataan berikut.\n(1) OJK menjamin harga aset yang tercantum dalam DAKD.\n(2) Aset kripto bukan alat pembayaran yang sah di Indonesia.\n(3) Penyelenggara dilarang memperdagangkan AKD di luar DAKD yang ditetapkan bursa.\n(4) Bappebti tetap menjadi pengawas utama aset kripto setelah 10 Januari 2025.\nPernyataan yang benar adalah ....',
    jawaban: '(2) dan (3)',
    pengecoh: [
      P('(1) dan (2)', 'Pernyataan (1) salah: DAKD bukan jaminan harga.'),
      P('(1) dan (4)', 'Kedua pernyataan salah.'),
      P('(3) dan (4)', 'Pernyataan (4) salah: pengawasan telah beralih ke OJK.'),
      P('(1), (2), dan (3)', 'Pernyataan (1) salah.'),
      P('(2), (3), dan (4)', 'Pernyataan (4) salah.'),
    ],
    konsep: 'Status dan pengawasan aset kripto', kataKunci: 'DAKD, alat pembayaran, pengawas',
    alasan: ['Aset kripto bukan alat pembayaran sah, dan penyelenggara dilarang memperdagangkan AKD di luar DAKD.', 'DAKD bukan jaminan harga, dan pengawas sejak 10 Januari 2025 adalah OJK.'],
    caraCepat: 'Coret pernyataan yang memuat “menjamin harga” dan “Bappebti tetap”.',
  },
  {
    id: 'margin-rekening-khusus', tingkat: 'menantang', topik: 'derivatif', sumber: `${EB}, subbab 3.1.14`, berlakuPer: 'POJK 23/2025',
    pertanyaan: 'Dalam kegiatan derivatif AKD, POJK 23/2025 mengatur penempatan margin pada rekening khusus. Makna pengaturan tersebut adalah ....',
    jawaban: 'kontrol tata kelola atas dana konsumen, bukan penghilang risiko pasar',
    pengecoh: [
      P('jaminan bahwa konsumen derivatif tidak akan mengalami kerugian apa pun', 'Rekening khusus tidak menghapus risiko pasar.'),
      P('penghapusan kewajiban knowledge test bagi konsumen derivatif AKD', 'Knowledge test tetap diwajibkan.'),
      P('pengalihan pengawasan kegiatan derivatif AKD kepada Bank Indonesia', 'Pengawasan AKD berada pada OJK.'),
      P('izin bagi pedagang untuk memakai margin konsumen sebagai modal usahanya', 'Margin ditempatkan pada rekening khusus sebagai bentuk pengendalian.'),
    ],
    konsep: 'Pelindungan dana konsumen', kataKunci: 'margin pada rekening khusus',
    alasan: ['Penempatan margin pada rekening khusus adalah kontrol tata kelola untuk melindungi dana konsumen, bukan mekanisme penghilangan risiko pasar.'],
    caraCepat: 'Rekening khusus = pengendalian, bukan garansi.',
  },
  {
    id: 'ljk-kripto-kecuali', tingkat: 'menantang', topik: 'kelembagaan', sumber: `${EB}, subbab 3.1.4 (UU 4/2026 Pasal 221A–221F)`, berlakuPer: 'UU 4/2026 (berlaku 17 Juni 2026)',
    pertanyaan: 'UU Nomor 4 Tahun 2026 menambahkan pengaturan LJK Aset Kripto. Berikut ini dikelompokkan sebagai LJK Aset Kripto, KECUALI ....',
    jawaban: 'Bank Indonesia',
    pengecoh: [
      P('pedagang', 'Pedagang termasuk LJK Aset Kripto menurut Pasal 221A–221F.'),
      P('bursa', 'Bursa termasuk LJK Aset Kripto.'),
      P('lembaga kliring', 'Lembaga kliring termasuk LJK Aset Kripto.'),
      P('pengelola tempat penyimpanan', 'Pengelola tempat penyimpanan termasuk LJK Aset Kripto.'),
    ],
    konsep: 'LJK Aset Kripto', kataKunci: 'UU 4/2026, KECUALI',
    alasan: ['UU 4/2026 mengelompokkan pedagang, bursa, lembaga kliring, dan pengelola tempat penyimpanan sebagai LJK Aset Kripto yang perizinan dan pengawasannya oleh OJK.', 'Bank Indonesia adalah bank sentral, bukan LJK Aset Kripto.'],
    caraCepat: 'Empat penyelenggara ekosistem = LJK Aset Kripto; otoritas bukan penyelenggara.',
  },
  {
    id: 'kripto-vs-saham', tingkat: 'menengah', topik: 'perbandingan', sumber: `${EB}, subbab 3.1.18`,
    pertanyaan: 'Pernyataan yang tepat untuk membedakan aset kripto dari saham adalah ....',
    jawaban: 'pemilik token tidak otomatis menjadi pemilik perusahaan seperti pemegang saham',
    pengecoh: [
      P('pemilik token otomatis berhak hadir dan memberikan suara dalam RUPS penerbit', 'Hak RUPS melekat pada pemegang saham.'),
      P('aset kripto dan saham sama-sama merupakan bukti penyertaan modal di perusahaan', 'Aset kripto bukan otomatis penyertaan modal.'),
      P('saham adalah alat pembayaran yang sah, sedangkan aset kripto bukan alat pembayaran', 'Saham juga bukan alat pembayaran.'),
      P('aset kripto selalu dijamin memberi dividen tetap oleh penerbit tokennya', 'Aset kripto tidak menjanjikan dividen.'),
    ],
    konsep: 'Aset kripto dibanding produk keuangan lain', kataKunci: 'hak kepemilikan atas perusahaan',
    alasan: ['Kripto bukan saham karena pemilik token tidak otomatis memperoleh hak kepemilikan atas suatu perusahaan seperti pemegang saham.'],
    caraCepat: 'Tanyakan objek dan hak hukumnya: token ≠ kepemilikan perusahaan.',
  },
];

const bP = pembuatBaris(`${EB}, subbab 3.1.5 dan contoh soal 4.2, 4.6`, POJK);
const bI = pembuatBaris(`${EB}, subbab 3.1.1–3.1.13`, POJK);
const bR = pembuatBaris(`${EB}, subbab 3.1.11 (tabel gejala dan risiko)`);

const TABEL: TabelRelasi[] = [
  {
    id: 'pihak', topik: 'ekosistem',
    tanyaNilai: (s) => `Dalam ekosistem perdagangan aset keuangan digital, fungsi inti ${s} adalah ....`,
    tanyaSubjek: (n) => `Dalam ekosistem perdagangan aset keuangan digital, pihak yang fungsi intinya ${n} adalah ....`,
    alasanSalah: alasanRelasi, kalimat: kalimatRelasi, konsep: 'Pelaku ekosistem AKD',
    caraCepat: 'OJK = atur dan awasi; bursa = sarana dan daftar aset; kliring = kliring, penjaminan, penyelesaian; penyimpanan = amankan aset; pedagang = layani jual beli; BI = sistem pembayaran.',
    baris: [
      bP('ojk', 'Otoritas Jasa Keuangan', 'mengatur dan mengawasi perdagangan aset keuangan digital termasuk aset kripto'),
      bP('bursa', 'bursa AKD', 'menyediakan sarana dan aturan perdagangan serta menetapkan daftar aset yang dapat diperdagangkan'),
      bP('kliring', 'lembaga kliring', 'menjalankan kliring, penjaminan, dan penyelesaian transaksi'),
      bP('penyimpanan', 'pengelola tempat penyimpanan', 'menyimpan dan mengamankan aset digital yang menjadi hak konsumen'),
      bP('pedagang', 'pedagang AKD', 'melayani jual dan/atau beli atas amanat konsumen sesuai lingkup izinnya'),
      bP('bi', 'Bank Indonesia', 'berwenang atas sistem pembayaran dan menegaskan virtual currency bukan alat pembayaran sah', 'menengah'),
    ],
  },
  {
    id: 'istilah', topik: 'istilah',
    tanyaNilai: (s) => `Dalam materi aset kripto, istilah ${s} berarti ....`,
    tanyaSubjek: (n) => `Dalam materi aset kripto, ${n} disebut ....`,
    alasanSalah: alasanRelasi, kalimat: kalimatRelasi, konsep: 'Istilah teknologi dan regulasi aset kripto',
    caraCepat: 'Pisahkan istilah teknologi (blockchain, kunci), jenis token (stablecoin, NFT), kontrak (derivatif), dan regulasi (DAKD, whitelist, knowledge test).',
    baris: [
      bI('derivatif', 'derivatif AKD', 'kontrak yang nilainya merujuk pada AKD dasar tanpa pemegangnya otomatis memiliki aset itu', 'menengah'),
      bI('blockchain', 'blockchain', 'catatan transaksi digital berurutan yang diverifikasi menurut mekanisme jaringan'),
      bI('stablecoin', 'stablecoin', 'token yang dirancang mempertahankan hubungan nilai dengan acuan tertentu'),
      bI('nft', 'non-fungible token (NFT)', 'token yang memiliki keunikan identitas digital', 'menengah'),
      bI('dakd', 'Daftar Aset Keuangan Digital (DAKD)', 'daftar yang ditetapkan bursa sebagai rujukan aset yang boleh diperdagangkan'),
      bI('whitelist', 'whitelist OJK', 'daftar resmi entitas dan platform yang memperoleh izin atau penetapan perdagangan AKD'),
      bI('privat', 'kunci privat (private key)', 'informasi rahasia yang dipakai untuk otorisasi', 'menengah'),
      bI('publik', 'kunci publik (public key)', 'identitas yang dapat digunakan untuk verifikasi', 'menengah'),
      bI('knowledge', 'knowledge test', 'uji pengetahuan yang wajib diikuti konsumen sebelum perdagangan derivatif AKD', 'menengah', { berlakuPer: 'POJK 23/2025' }),
    ],
  },
  {
    id: 'risiko', topik: 'risiko',
    tanyaNilai: (s) => `Dalam perdagangan aset kripto, gejala yang paling langsung menunjukkan ${s} adalah ....`,
    tanyaSubjek: (n) => `Sebuah kasus aset kripto menunjukkan gejala: ${n}. Risiko yang paling relevan adalah ....`,
    alasanSalah: (b, s, arah) => arah === 'nilai' ? `Gejala itu menunjukkan ${s.subjek}, bukan ${b.subjek}.` : `${kapital(s.subjek)} bergejala ${s.nilai}; gejala pada soal menunjuk ${b.subjek}.`,
    kalimat: kalimatRelasi, konsep: 'Mengenali sumber risiko aset kripto',
    caraCepat: 'Tanyakan apa yang berubah: harga (volatilitas), kemudahan menjual (likuiditas), sistem (operasional), akses (siber), acuan nilai (stabilisasi), sebaran kepemilikan (konsentrasi), aturan (hukum).',
    baris: [
      bR('volatilitas', 'risiko volatilitas pasar', 'harga berubah sangat cepat dalam waktu singkat walaupun sistem berjalan normal'),
      bR('likuiditas', 'risiko likuiditas', 'aset sulit dijual pada harga yang wajar'),
      bR('operasional', 'risiko operasional', 'layanan terhenti karena gangguan sistem atau proses tanpa adanya serangan'),
      bR('siber', 'risiko keamanan siber', 'terjadi akses tanpa izin akibat serangan pada infrastruktur atau akun', 'menengah'),
      bR('stabilisasi', 'risiko mekanisme stabilisasi', 'nilai token yang didesain stabil menyimpang dari nilai acuannya', 'menengah'),
      bR('konsentrasi', 'risiko konsentrasi', 'kepemilikan sangat terpusat sehingga pihak tertentu dapat menggerakkan pasar', 'menengah'),
      bR('hukum', 'risiko hukum dan kepatuhan', 'perubahan ketentuan, izin, atau batas kegiatan yang memengaruhi penyelenggaraan', 'menengah'),
    ],
  },
];

const HITUNG: TemplateHitung[] = [
  {
    id: 'perubahan-persen', topik: 'perubahan-harga', tingkat: 'menengah', sumber: `${EB}, subbab 3.1.17 dan contoh soal 4.12`, bolehNegatif: true,
    set: [{ a: 200_000, b: 170_000 }, { a: 400_000, b: 460_000 }, { a: 250_000, b: 200_000 }, { a: 80_000, b: 100_000 }],
    pertanyaan: (p) => `Dalam kasus hipotetis, harga satu unit aset kripto berubah dari ${rp(p.a)} menjadi ${rp(p.b)}. Dengan rumus (harga akhir − harga awal) ÷ harga awal × 100% dan tanpa biaya transaksi, perubahan harganya adalah ....`,
    hitung: (p) => ((p.b - p.a) / p.a) * 100,
    format: (v) => (v < 0 ? `turun ${persen(-v)}` : `naik ${persen(v)}`),
    salah: [
      { nilai: (p) => -((p.b - p.a) / p.a) * 100, alasan: () => 'Besarnya benar, tetapi arah perubahannya terbalik.' },
      { nilai: (p) => ((p.b - p.a) / p.b) * 100, alasan: () => 'Selisih dibagi harga akhir, padahal pembaginya harga awal.' },
      { nilai: (p) => -((p.b - p.a) / p.b) * 100, alasan: () => 'Pembagi dan arah perubahan keduanya keliru.' },
      { nilai: (p) => Math.sign(p.b - p.a) * (p.b / p.a) * 100, alasan: () => 'Itu rasio harga akhir terhadap harga awal, bukan besar perubahannya.' },
    ],
    konsep: 'Persentase perubahan harga (ilustrasi, bukan prediksi)', kataKunci: 'harga awal dan harga akhir',
    langkah: (p) => [`Selisih = ${rp(p.b)} − ${rp(p.a)} = ${rp(p.b - p.a)}.`, `Perubahan = ${rp(p.b - p.a)} ÷ ${rp(p.a)} × 100% = ${persen(((p.b - p.a) / p.a) * 100)}; tanda negatif berarti turun.`],
    caraCepat: 'Selisih dibagi harga awal; tanda menentukan naik atau turun.',
  },
  {
    id: 'nilai-kepemilikan', topik: 'perubahan-harga', tingkat: 'dasar', sumber: `${EB}, subbab 3.1.17`, bolehNegatif: true,
    set: [{ u: 3, a: 200_000, b: 170_000 }, { u: 10, a: 50_000, b: 62_000 }, { u: 4, a: 1_250_000, b: 1_100_000 }, { u: 20, a: 15_000, b: 18_500 }],
    pertanyaan: (p) => `Dalam kasus hipotetis, Lia memiliki ${p.u} unit aset kripto. Harga per unit berubah dari ${rp(p.a)} menjadi ${rp(p.b)}. Tanpa biaya transaksi, perubahan nilai kepemilikan Lia adalah ....`,
    hitung: (p) => p.u * (p.b - p.a),
    format: (v) => (v < 0 ? `turun ${rp(-v)}` : `naik ${rp(v)}`),
    salah: [
      { nilai: (p) => p.b - p.a, alasan: () => 'Itu perubahan per unit; belum dikalikan jumlah unit.' },
      { nilai: (p) => -p.u * (p.b - p.a), alasan: () => 'Besarnya benar, tetapi arah perubahannya terbalik.' },
      { nilai: (p) => Math.sign(p.b - p.a) * p.u * p.b, alasan: () => 'Itu nilai kepemilikan akhir, bukan perubahannya.' },
      { nilai: (p) => Math.sign(p.b - p.a) * p.u * p.a, alasan: () => 'Itu nilai kepemilikan awal, bukan perubahannya.' },
      { nilai: (p) => -(p.b - p.a), alasan: () => 'Itu perubahan per unit dengan arah terbalik; belum dikalikan jumlah unit.' },
    ],
    konsep: 'Perubahan nilai kepemilikan', kataKunci: 'jumlah unit, harga awal dan akhir',
    langkah: (p) => [`Perubahan per unit = ${rp(p.b)} − ${rp(p.a)} = ${rp(p.b - p.a)}.`, `Untuk ${p.u} unit: ${rp(p.b - p.a)} × ${angka(p.u)} = ${rp(p.u * (p.b - p.a))}.`],
    caraCepat: 'Perubahan harga per unit × jumlah unit.',
  },
];

export const ASET_KRIPTO = [
  familyKurasi({
    id: 'PSJK-KRIPTO-FAKTA', nama: 'Aset kripto: pengawasan, regulasi, definisi', chapter: 'aset-kripto', label: 'SHL',
    sumber: `${EB} (contoh soal 4.1–4.15)`,
    ringkas: 'Soal fakta langsung: OJK sebagai pengawas sejak 10 Januari 2025 (dari Bappebti), dasar UU P2SK, POJK 27/2024 jo. 23/2025, kripto bukan alat pembayaran sah, definisi AKD dan aset kripto, pembagian AKD (Pasal 3A).',
  }, FAKTA),
  familyRelasi({
    id: 'PSJK-KRIPTO-RELASI', nama: 'Aset kripto: pelaku, istilah, risiko (dua arah)', chapter: 'aset-kripto', label: 'VARIASI',
    sumber: `${EB}, subbab 3.1.1–3.1.13`,
    ringkas: 'Tiga tabel relasi dua arah: fungsi pelaku ekosistem (OJK, bursa, kliring, penyimpanan, pedagang, BI), istilah (derivatif, blockchain, stablecoin, NFT, DAKD, whitelist, kunci privat/publik, knowledge test), dan gejala → jenis risiko.',
  }, TABEL),
  familyKurasi({
    id: 'PSJK-KRIPTO-KASUS', nama: 'Aset kripto: kasus dan pernyataan majemuk', chapter: 'aset-kripto', label: 'VARIASI',
    sumber: `${EB}, subbab 3.1.4–3.1.18`,
    ringkas: 'Kasus token di luar DAKD, stablecoin menyimpang, spot vs derivatif, knowledge test, whitelist, izin bukan jaminan, kronologi serah terima vs akhir transisi, pelaporan PADK 3/2026, margin rekening khusus, LJK Aset Kripto (UU 4/2026), kripto vs saham.',
  }, KASUS),
  familyHitung({
    id: 'PSJK-KRIPTO-HITUNG', nama: 'Aset kripto: perubahan harga ilustratif', chapter: 'aset-kripto', label: 'VARIASI',
    sumber: `${EB}, subbab 3.1.17`,
    ringkas: 'Dua template ilustratif (bukan prediksi): persentase perubahan harga dan perubahan nilai kepemilikan; pengecoh dari arah terbalik, pembagi harga akhir, dan nilai awal/akhir.',
  }, HITUNG),
];
