import type { ButirKurasi, TabelRelasi } from '../umum';
import { familyKurasi, familyRelasi } from '../umum';
import { P, SUMBER, alasanRelasi, kalimatRelasi, pembuatBaris } from './alat';
import { familyHitung, persen, rp, type TemplateHitung } from './hitung';

// Chapter Asuransi (kebutuhan 50 = 4×10 + 2×5). Sumber: e-book tim "Investasi dan Proteksi – Asuransi" (subbab 3.1.1–3.1.9
// dan contoh soal 4.1–4.10) dan OJK Buku 4 Perasuransian bab 3 (prinsip asuransi, insurable risk, ko-asuransi,
// reasuransi, asymmetric information). Ketentuan yang dapat berubah diberi `berlakuPer`.

const EB = SUMBER.ebAsuransi;
const B4 = SUMBER.buku4;

// ─────────────────────────────── SHL: fakta langsung (bentuk contoh soal e-book) ───────────────────────────────
const FAKTA: ButirKurasi[] = [
  {
    id: 'penerima-manfaat', tingkat: 'dasar', topik: 'pihak', sumber: `${EB}, subbab 3.1.1 dan contoh soal 4.4`,
    pertanyaan: 'Pak Dedi membeli polis asuransi jiwa atas dirinya sendiri dan menunjuk istrinya untuk menerima manfaat apabila syarat pembayaran terpenuhi. Kedudukan istri Pak Dedi dalam polis tersebut adalah ....',
    jawaban: 'penerima manfaat',
    pengecoh: [
      P('tertanggung', 'Tertanggung adalah pihak yang risikonya dilindungi, yaitu Pak Dedi sendiri.'),
      P('pemegang polis', 'Pemegang polis adalah pihak yang mengadakan perjanjian, yaitu Pak Dedi.'),
      P('penanggung', 'Penanggung adalah perusahaan asuransi yang memberikan perlindungan.'),
      P('agen asuransi', 'Agen asuransi memasarkan produk atas nama perusahaan asuransi.'),
      P('pialang asuransi', 'Pialang asuransi adalah perantara untuk kepentingan calon pemegang polis atau tertanggung.'),
    ],
    konsep: 'Para pihak dalam polis asuransi jiwa', kataKunci: 'menunjuk istrinya untuk menerima manfaat',
    alasan: ['Penerima manfaat adalah pihak yang berhak menerima manfaat sesuai ketentuan polis.', 'Pak Dedi sekaligus menjadi pemegang polis dan tertanggung; istrinya hanya ditunjuk untuk menerima manfaat.'],
    caraCepat: 'Petakan perannya: siapa yang membuat perjanjian, siapa yang risikonya dilindungi, dan siapa yang menerima uang.',
  },
  {
    id: 'uu-perasuransian', tingkat: 'dasar', topik: 'regulasi', sumber: `${EB}, subbab 3.1.1 A (Dasar Hukum)`, berlakuPer: 'UU 40/2014 jo. UU 4/2023 (P2SK)',
    pertanyaan: 'Undang-undang yang menjadi landasan usaha perasuransian di Indonesia, sebagaimana telah diubah melalui UU Nomor 4 Tahun 2023 (P2SK), adalah ....',
    jawaban: 'UU Nomor 40 Tahun 2014 tentang Perasuransian',
    pengecoh: [
      P('UU Nomor 8 Tahun 1995 tentang Pasar Modal', 'Undang-undang ini menjadi landasan kegiatan pasar modal, bukan perasuransian.'),
      P('UU Nomor 21 Tahun 2008 tentang Perbankan Syariah', 'Undang-undang ini mengatur perbankan syariah.'),
      P('UU Nomor 11 Tahun 1992 tentang Dana Pensiun', 'Undang-undang ini mengatur dana pensiun, bukan usaha perasuransian.'),
      P('UU Nomor 7 Tahun 1992 tentang Perbankan', 'Undang-undang ini mengatur perbankan, bukan usaha perasuransian.'),
    ],
    konsep: 'Dasar hukum perasuransian', kataKunci: 'landasan usaha perasuransian',
    alasan: ['Landasan hukumnya adalah UU Nomor 40 Tahun 2014 tentang Perasuransian sebagaimana diubah melalui UU Nomor 4 Tahun 2023.'],
    caraCepat: 'Perasuransian = UU 40/2014; pasar modal = UU 8/1995; perbankan syariah = UU 21/2008.',
  },
  {
    id: 'pojk-produk', tingkat: 'menengah', topik: 'regulasi', sumber: `${EB}, subbab 3.1.1 A dan 3.1.2 B`, berlakuPer: 'POJK 8/2024',
    pertanyaan: 'Ketentuan OJK yang mengatur produk asuransi dan saluran pemasarannya, termasuk isi minimum polis, adalah ....',
    jawaban: 'POJK Nomor 8 Tahun 2024',
    pengecoh: [
      P('POJK Nomor 17 Tahun 2024', 'POJK 17/2024 mengatur penyelenggaraan kegiatan usaha bulion.'),
      P('POJK Nomor 27 Tahun 2024', 'POJK 27/2024 mengatur penyelenggaraan perdagangan aset keuangan digital termasuk aset kripto.'),
      P('POJK Nomor 35 Tahun 2024', 'POJK 35/2024 mengatur perizinan dan kelembagaan dana pensiun.'),
      P('POJK Nomor 4 Tahun 2026', 'POJK 4/2026 mengatur produk investasi perbankan syariah.'),
      P('POJK Nomor 27 Tahun 2023', 'POJK 27/2023 mengatur penyelenggaraan usaha dana pensiun.'),
    ],
    konsep: 'Pengaturan produk dan pemasaran asuransi', kataKunci: 'produk asuransi dan saluran pemasaran, isi minimum polis',
    alasan: ['POJK 8 Tahun 2024 mengatur produk dan saluran pemasaran, termasuk klausul polis, premi atau kontribusi, dan produk digital; Pasal 12-nya mengatur isi minimum polis.'],
    caraCepat: 'Kaitkan nomor POJK dengan sektornya: 8/2024 produk asuransi, 17/2024 bulion, 27/2024 aset kripto.',
  },
  {
    id: 'kesehatan-lini', tingkat: 'menengah', topik: 'jenis-usaha', sumber: `${EB}, subbab 3.1.1 B dan 3.1.2`,
    pertanyaan: 'Dalam pengelompokan industri perasuransian, asuransi kesehatan paling tepat digolongkan sebagai ....',
    jawaban: 'lini produk yang memberi manfaat terkait layanan atau biaya kesehatan',
    pengecoh: [
      P('jenis usaha keempat di samping asuransi jiwa, asuransi umum, dan reasuransi', 'Jenis usaha perasuransian adalah asuransi jiwa, asuransi umum, dan reasuransi; kesehatan adalah lini produk.'),
      P('bentuk reasuransi atas risiko yang ditanggung rumah sakit', 'Reasuransi adalah penanggungan kembali risiko perusahaan asuransi, bukan produk kesehatan.'),
      P('prinsip penyelenggaraan asuransi berdasarkan syariah', 'Syariah adalah prinsip penyelenggaraan; produk kesehatan dapat konvensional atau syariah.'),
      P('perluasan jaminan pada polis kendaraan bermotor', 'Perluasan jaminan adalah tambahan cakupan risiko tertentu, misalnya banjir.'),
    ],
    konsep: 'Jenis usaha dan lini produk asuransi', kataKunci: 'asuransi kesehatan',
    alasan: ['Jenis usaha menjelaskan kegiatan perusahaan (jiwa, umum, reasuransi), sedangkan lini produk menjelaskan perlindungan yang ditawarkan.', 'Asuransi kesehatan adalah lini produk yang memberi manfaat terkait layanan atau biaya kesehatan.'],
    caraCepat: 'Tanyakan: ini kegiatan perusahaan (jenis usaha) atau perlindungan yang dijual (lini produk)?',
  },
  {
    id: 'paydi', tingkat: 'dasar', topik: 'produk', sumber: `${EB}, Istilah Dasar dan subbab 3.1.2 A`, jugaBenar: ['unit link'],
    pertanyaan: 'Produk asuransi yang memberikan perlindungan sekaligus manfaat yang dikaitkan dengan hasil investasi disebut ....',
    jawaban: 'PAYDI',
    pengecoh: [
      P('reasuransi', 'Reasuransi adalah penanggungan kembali sebagian risiko perusahaan asuransi.'),
      P('ko-asuransi', 'Ko-asuransi adalah penutupan satu risiko oleh beberapa penanggung.'),
      P('perluasan jaminan', 'Perluasan jaminan adalah tambahan cakupan untuk risiko tertentu.'),
      P("dana tabarru'", "Dana tabarru' adalah dana tolong-menolong peserta asuransi syariah."),
      P('retensi sendiri', 'Retensi sendiri adalah bagian risiko yang tetap ditanggung perusahaan asuransi.'),
    ],
    konsep: 'Produk Asuransi yang Dikaitkan dengan Investasi', kataKunci: 'perlindungan sekaligus manfaat yang dikaitkan dengan hasil investasi',
    alasan: ['PAYDI (Produk Asuransi yang Dikaitkan dengan Investasi) memberi manfaat proteksi sekaligus manfaat yang dikaitkan dengan hasil investasi.'],
    caraCepat: 'Proteksi + investasi dalam satu produk = PAYDI (dikenal juga sebagai unit link).',
  },
  {
    id: 'nilai-tunai', tingkat: 'menengah', topik: 'produk', sumber: `${EB}, subbab 3.1.2 A`,
    pertanyaan: 'Pada polis PAYDI, nilai yang terbentuk dalam polis dan dapat dibayarkan sesuai ketentuan, misalnya saat pemegang polis menarik dana atau mengakhiri polis, disebut ....',
    jawaban: 'nilai tunai',
    pengecoh: [
      P('premi', 'Premi adalah pembayaran untuk memperoleh pertanggungan.'),
      P('risiko sendiri', 'Risiko sendiri adalah bagian kerugian yang ditanggung tertanggung.'),
      P('batas manfaat', 'Batas manfaat adalah jumlah maksimum yang dapat dibayar untuk suatu manfaat.'),
      P('ujrah', 'Ujrah adalah imbalan atas jasa pengelolaan pada asuransi syariah.'),
      P('retensi sendiri', 'Retensi sendiri adalah bagian risiko yang ditanggung perusahaan asuransi setelah reasuransi.'),
    ],
    konsep: 'Komponen PAYDI', kataKunci: 'nilai yang terbentuk dalam polis dan dapat dibayarkan',
    alasan: ['Nilai tunai adalah nilai yang terbentuk dalam polis dan dapat dibayarkan sesuai ketentuan; besarnya dipengaruhi kinerja investasi, biaya, dan penarikan sebelumnya.'],
    caraCepat: 'Uang yang “mengendap” di polis dan bisa ditarik = nilai tunai.',
  },
  {
    id: 'retensi-sendiri', tingkat: 'menengah', topik: 'reasuransi', sumber: `${EB}, subbab 3.1.2 E`,
    pertanyaan: 'Bagian risiko yang tetap ditanggung perusahaan asuransi setelah sebagian risikonya dialihkan kepada perusahaan reasuransi disebut ....',
    jawaban: 'retensi sendiri',
    pengecoh: [
      P('risiko sendiri', 'Risiko sendiri adalah bagian kerugian yang ditanggung tertanggung, bukan perusahaan asuransi.'),
      P('ko-asuransi', 'Ko-asuransi adalah penutupan risiko oleh beberapa penanggung dalam polis asli.'),
      P('subrogasi', 'Subrogasi adalah peralihan hak menuntut pihak ketiga kepada penanggung.'),
      P('kontribusi', 'Kontribusi adalah pembagian ganti rugi di antara beberapa penanggung.'),
      P('masa tunggu', 'Masa tunggu adalah periode sebelum manfaat tertentu dapat digunakan.'),
      P('pertanggungan ulang', 'Pertanggungan ulang (reasuransi) adalah bagian risiko yang dialihkan kepada reasuradur, bukan bagian yang ditahan.'),
      P('pembagian risiko', 'Pembagian risiko (misalnya co-payment) adalah bagian biaya yang ditanggung tertanggung pada polis kesehatan.'),
    ],
    konsep: 'Reasuransi dan retensi', kataKunci: 'bagian risiko yang tetap ditanggung perusahaan asuransi',
    alasan: ['Bagian risiko yang tetap ditanggung perusahaan asuransi setelah reasuransi disebut retensi sendiri.'],
    caraCepat: 'Retensi = milik perusahaan asuransi; risiko sendiri = milik tertanggung.',
  },
  {
    id: 'rbc', tingkat: 'menengah', topik: 'kesehatan-keuangan', sumber: `${EB}, subbab 3.1.2 H`,
    pertanyaan: 'Rasio yang membandingkan tingkat solvabilitas perusahaan asuransi dengan Modal Minimum Berbasis Risiko (MMBR) adalah ....',
    jawaban: 'rasio solvabilitas (risk-based capital/RBC)',
    pengecoh: [
      P('loss ratio, yaitu perbandingan klaim dengan premi', 'Loss ratio membandingkan klaim dengan premi, bukan solvabilitas dengan MMBR.'),
      P('nilai tunai polis yang dikaitkan dengan investasi', 'Nilai tunai adalah nilai yang terbentuk dalam polis PAYDI.'),
      P('nisbah bagi hasil dana investasi peserta', 'Nisbah adalah persentase pembagian hasil usaha.'),
      P('batas manfaat per pengajuan klaim kesehatan', 'Batas manfaat adalah jumlah maksimum pembayaran manfaat polis.'),
    ],
    konsep: 'Kesehatan keuangan perusahaan asuransi', kataKunci: 'tingkat solvabilitas dibandingkan dengan MMBR',
    alasan: ['Rasio solvabilitas atau RBC membandingkan tingkat solvabilitas perusahaan dengan Modal Minimum Berbasis Risiko (MMBR).'],
    caraCepat: 'Solvabilitas ÷ MMBR = RBC.',
  },
  {
    id: 'laps-sjk', tingkat: 'dasar', topik: 'pengaduan', sumber: `${EB}, subbab 3.1.3 A`, berlakuPer: 'POJK 22/2023 (Pelindungan Konsumen)',
    pertanyaan: 'Klaim asuransi Rina ditolak dan sengketanya belum selesai setelah ditangani melalui pengaduan ke perusahaan asuransi. Lembaga yang dapat digunakan berikutnya sesuai syarat adalah ....',
    jawaban: 'LAPS Sektor Jasa Keuangan (LAPS SJK)',
    pengecoh: [
      P('Kustodian Sentral Efek Indonesia (KSEI)', 'KSEI adalah lembaga penyimpanan dan penyelesaian di pasar modal.'),
      P('Dewan Pengawas Syariah perusahaan', 'DPS mengawasi kepatuhan syariah, bukan menyelesaikan sengketa konsumen.'),
      P('Bursa Efek Indonesia (BEI)', 'BEI menyelenggarakan perdagangan efek.'),
      P('Kliring Penjaminan Efek Indonesia (KPEI)', 'KPEI menyelenggarakan kliring dan penjaminan transaksi bursa.'),
    ],
    konsep: 'Penanganan pengaduan dan sengketa', kataKunci: 'sengketa belum selesai setelah penanganan di perusahaan',
    alasan: ['Langkah awal adalah meminta alasan tertulis dan mengadu ke perusahaan asuransi; Kontak OJK 157 menyediakan informasi dan kanal pengaduan.', 'Jika sengketa belum selesai, LAPS SJK dapat digunakan sesuai syarat.'],
    caraCepat: 'Sengketa konsumen jasa keuangan yang tidak selesai di perusahaan → LAPS SJK.',
  },
  {
    id: 'reimbursement', tingkat: 'dasar', topik: 'klaim', sumber: `${EB}, subbab 3.1.2 D dan 3.1.3 A`,
    pertanyaan: 'Pada polis kesehatan dengan skema penggantian biaya (reimbursement), mekanisme pembayarannya adalah ....',
    jawaban: 'nasabah membayar fasilitas kesehatan lebih dulu, lalu mengajukan penggantian',
    pengecoh: [
      P('perusahaan membayar langsung fasilitas kesehatan rekanan sesuai prosedur penjaminan', 'Itu skema pembayaran langsung, bukan penggantian biaya.'),
      P('perusahaan reasuransi membayar langsung kepada nasabah', 'Nasabah terikat polis dengan perusahaan asuransi, bukan dengan perusahaan reasuransi.'),
      P('rumah sakit menanggung seluruh biaya tanpa melihat ketentuan polis', 'Pembayaran tetap mengikuti manfaat, batas, dan pengecualian polis.'),
      P('nasabah memperoleh penggantian biaya tanpa perlu menyerahkan bukti pembayaran', 'Pada penggantian biaya, tertanggung mengajukan bukti pembayaran.'),
    ],
    konsep: 'Cara pembayaran klaim kesehatan', kataKunci: 'penggantian biaya',
    alasan: ['Pada skema penggantian biaya, nasabah membayar terlebih dahulu lalu mengajukan penggantian dengan bukti pembayaran.', 'Pada pembayaran langsung, perusahaan membayar fasilitas kesehatan rekanan sesuai prosedur.'],
    caraCepat: 'Reimbursement = bayar dulu, klaim kemudian; cashless = perusahaan bayar langsung ke rekanan.',
  },
  {
    id: 'program-wajib', tingkat: 'dasar', topik: 'program-wajib', sumber: `${EB}, subbab 3.1.2 E; ${SUMBER.buku4Bab1}`,
    pertanyaan: 'Ciri utama program asuransi wajib dibandingkan asuransi komersial adalah ....',
    jawaban: 'kepesertaannya diwajibkan oleh dasar hukum bagi kelompok tertentu',
    pengecoh: [
      P('manfaatnya ditentukan sepenuhnya oleh agen asuransi yang memasarkannya', 'Agen memasarkan produk; manfaat program wajib ditetapkan menurut peraturan.'),
      P('kepesertaannya bergantung sepenuhnya pada pilihan bebas calon pembeli', 'Kepesertaan bebas adalah ciri asuransi komersial.'),
      P('produknya hanya dapat dibeli melalui pialang asuransi', 'Tidak ada ketentuan bahwa program wajib hanya melalui pialang.'),
      P('penyelenggaraannya tidak memerlukan dasar peraturan', 'Justru program wajib berangkat dari dasar hukum yang mewajibkan kepesertaan.'),
    ],
    konsep: 'Program wajib, jaminan sosial, dan asuransi komersial', kataKunci: 'asuransi wajib',
    alasan: ['Program wajib memiliki dasar hukum yang mewajibkan kepesertaan atau pertanggungan bagi kelompok tertentu.', 'Asuransi komersial memberikan manfaat sesuai produk dan polis yang dipilih.'],
    caraCepat: 'Tanya: siapa yang wajib ikut dan atas dasar aturan apa?',
  },
  {
    id: 'hukum-bilangan-besar', tingkat: 'menengah', topik: 'teori', sumber: `${B4} (Law of Large Number)`,
    pertanyaan: 'Perusahaan asuransi berupaya agar suatu produk diikuti banyak tertanggung dengan risiko sejenis supaya besarnya kerugian dapat diprediksi lebih akurat dan premi dapat ditetapkan secara wajar. Dasar pemikiran ini dikenal sebagai ....',
    jawaban: 'hukum bilangan besar (law of large numbers)',
    pengecoh: [
      P('prinsip subrogasi', 'Subrogasi mengatur peralihan hak menuntut pihak ketiga setelah ganti rugi dibayar.'),
      P('prinsip penyebab terdekat (proximate cause)', 'Proximate cause menentukan penyebab utama suatu kerugian.'),
      P('moral hazard', 'Moral hazard adalah perubahan perilaku tertanggung setelah kontrak disetujui.'),
      P('prinsip kontribusi', 'Kontribusi mengatur pembagian ganti rugi antarpenanggung atas objek yang sama.'),
      P('adverse selection', 'Adverse selection adalah masalah informasi sebelum kontrak disetujui.'),
    ],
    konsep: 'Dasar statistik asuransi', kataKunci: 'banyak tertanggung dengan risiko sejenis, prediksi kerugian',
    alasan: ['Menurut hukum bilangan besar, semakin banyak risiko sejenis yang dihimpun, semakin akurat perusahaan memprediksi kerugian sehingga premi dapat ditetapkan secara wajar.'],
    caraCepat: 'Banyak peserta sejenis → prediksi kerugian makin akurat = hukum bilangan besar.',
  },
  {
    id: 'manfaat-reasuransi', tingkat: 'menengah', topik: 'reasuransi', sumber: `${B4} (Ko-Asuransi dan Reasuransi)`,
    pertanyaan: 'Salah satu manfaat reasuransi bagi perusahaan asuransi adalah ....',
    jawaban: 'meningkatkan kapasitas perusahaan dalam menerima risiko',
    pengecoh: [
      P('menghapus kewajiban perusahaan asuransi kepada pemegang polis', 'Perusahaan asuransi tetap menangani klaim sesuai polis.'),
      P('menjadikan perusahaan reasuransi pihak dalam polis nasabah', 'Tertanggung tidak mempunyai hubungan kontraktual dengan perusahaan reasuransi.'),
      P('menjamin premi nasabah tidak pernah mengalami kenaikan', 'Reasuransi tidak menjamin besaran premi nasabah.'),
      P('menggantikan peran agen dalam memasarkan produk asuransi', 'Pemasaran adalah peran agen atau saluran pemasaran lain.'),
    ],
    konsep: 'Manfaat reasuransi', kataKunci: 'manfaat reasuransi bagi perusahaan asuransi',
    alasan: ['Manfaat reasuransi antara lain meningkatkan kapasitas penerimaan risiko, menjaga stabilitas usaha, dan membantu menghadapi risiko katastrofik.'],
    caraCepat: 'Reasuransi menolong perusahaan asuransi, bukan mengubah hubungan nasabah dengan polisnya.',
  },
  {
    id: 'insurable-risk', tingkat: 'menengah', topik: 'risiko', sumber: `${B4} (Risiko-Risiko yang Dapat Diasuransikan)`,
    pertanyaan: 'Agar dapat diasuransikan, suatu risiko harus memenuhi kriteria tertentu. Salah satu kriteria tersebut adalah ....',
    jawaban: 'kerugiannya dapat dinilai atau diukur dengan uang',
    pengecoh: [
      P('kerugiannya timbul karena kesengajaan tertanggung', 'Risiko harus terjadi secara kebetulan dan tidak disengaja.'),
      P('objeknya hanya ada satu sehingga tidak memiliki padanan', 'Risiko harus homogen dan berjumlah besar agar dapat diprediksi.'),
      P('kejadiannya tidak perlu dapat dibuktikan', 'Risiko harus dapat diperkirakan dan dibuktikan kejadiannya.'),
      P('risikonya bersifat spekulatif sehingga dapat menghasilkan untung', 'Risiko yang dapat diasuransikan adalah risiko murni.'),
      P('kerugiannya bersifat emosional, misalnya putus cinta', 'Kerugian harus bersifat finansial, bukan emosional.'),
    ],
    konsep: 'Kriteria insurable risk', kataKunci: 'dapat diasuransikan',
    alasan: ['Kriteria insurable risk: risiko murni, dapat diukur dengan uang, homogen dan berjumlah besar, terjadi secara kebetulan, serta dapat diperkirakan dan dibuktikan.'],
    caraCepat: 'Ingat lima syarat: murni, terukur uang, banyak dan sejenis, tidak disengaja, dapat dibuktikan.',
  },
];

// ─────────────────────────────── VARIASI: kasus, pernyataan majemuk ───────────────────────────────
const KASUS: ButirKurasi[] = [
  {
    id: 'insurable-interest', tingkat: 'menengah', topik: 'prinsip', sumber: `${B4} (Insurable Interest)`,
    pertanyaan: 'Andi, penggemar seorang pesepak bola terkenal, ingin mengasuransikan mobil mewah milik idolanya. Andi tidak memiliki hubungan keuangan apa pun dengan mobil tersebut. Penilaian yang tepat adalah ....',
    jawaban: 'tidak dapat, karena syarat insurable interest atas mobil itu tidak terpenuhi',
    pengecoh: [
      P('dapat, asalkan Andi membayar premi tepat waktu dan mobil itu disurvei penanggung', 'Pembayaran premi dan survei objek tidak menggantikan syarat adanya kepentingan keuangan atas objek.'),
      P('dapat, karena Andi sudah jujur mengungkapkan semua fakta material tentang mobil itu', 'Itikad terbaik tidak menggantikan syarat insurable interest.'),
      P('dapat, karena kerugian atas mobil itu dapat diukur dengan uang', 'Kerugian terukur adalah kriteria risiko, tetapi Andi tetap tidak berkepentingan atas mobil itu.'),
      P('tidak dapat, karena kerusakan mobil termasuk risiko dinamis yang tidak dijamin', 'Alasannya keliru; kerusakan atau kehilangan mobil bukan risiko dinamis.'),
      P('tidak dapat, karena subrogasi tidak berlaku pada asuransi kendaraan bermotor', 'Alasannya keliru; subrogasi justru berlaku pada asuransi umum.'),
    ],
    konsep: 'Prinsip insurable interest', kataKunci: 'tidak memiliki hubungan keuangan dengan mobil',
    alasan: ['Insurable interest mensyaratkan hubungan keuangan yang diakui hukum antara tertanggung dan objek pertanggungan.', 'Jika mobil idolanya rusak, Andi tidak menderita kerugian keuangan, sehingga ia tidak berhak mengasuransikannya.'],
    caraCepat: 'Tanyakan: apakah orang itu rugi secara keuangan bila objeknya rusak? Jika tidak, tidak ada insurable interest.',
  },
  {
    id: 'utmost-good-faith', tingkat: 'menengah', topik: 'prinsip', sumber: `${B4} (Utmost Good Faith)`,
    pertanyaan: 'Saat mengisi formulir asuransi kesehatan, Budi tidak mengungkapkan penyakit yang sudah lama dideritanya beserta riwayat perawatannya. Prinsip asuransi yang dilanggar Budi adalah ....',
    jawaban: 'itikad terbaik (utmost good faith)',
    pengecoh: [
      P('subrogasi', 'Subrogasi mengatur peralihan hak menuntut pihak ketiga setelah ganti rugi dibayar.'),
      P('kontribusi', 'Kontribusi mengatur pembagian ganti rugi di antara beberapa penanggung.'),
      P('indemnity', 'Indemnity mengatur besarnya ganti rugi agar tidak melebihi kerugian.'),
      P('penyebab terdekat (proximate cause)', 'Proximate cause menentukan penyebab utama kerugian.'),
      P('insurable interest', 'Budi berkepentingan atas kesehatannya; masalahnya adalah fakta yang disembunyikan.'),
    ],
    konsep: 'Prinsip utmost good faith', kataKunci: 'tidak mengungkapkan penyakit dan riwayat perawatan',
    alasan: ['Utmost good faith mewajibkan tertanggung menyampaikan seluruh fakta material secara lengkap dan akurat, baik diminta maupun tidak.', 'Riwayat penyakit adalah fakta material bagi penanggung untuk menilai risiko dan menetapkan premi.'],
    caraCepat: 'Ada fakta penting yang disembunyikan saat penutupan = pelanggaran itikad terbaik.',
  },
  {
    id: 'subrogasi', tingkat: 'menengah', topik: 'prinsip', sumber: `${B4} (Subrogation)`,
    pertanyaan: 'Mobil Sari yang diasuransikan ditabrak pihak ketiga, dan perusahaan asuransi telah membayar seluruh ganti rugi sesuai polis. Akibat yang timbul menurut prinsip subrogasi adalah ....',
    jawaban: 'hak Sari untuk menuntut pihak ketiga beralih kepada perusahaan asuransi',
    pengecoh: [
      P('Sari tetap boleh menerima ganti rugi penuh dari pihak ketiga yang menabraknya', 'Sari akan memperoleh penggantian melebihi kerugiannya; subrogasi mencegah hal itu.'),
      P('pihak ketiga terbebas dari tanggung jawab atas kerugian yang ditimbulkannya', 'Tanggung jawab pihak ketiga tetap ada; yang berpindah adalah hak menuntutnya.'),
      P('perusahaan asuransi wajib membagi klaim itu dengan penanggung lain', 'Itu prinsip kontribusi, sedangkan soal tidak menyebut penanggung lain.'),
      P('Sari wajib mengembalikan ganti rugi yang telah diterimanya kepada perusahaan asuransi', 'Ganti rugi tetap menjadi hak Sari; perusahaan menuntut pihak ketiga.'),
    ],
    konsep: 'Prinsip subrogasi', kataKunci: 'ditabrak pihak ketiga, ganti rugi telah dibayar',
    alasan: ['Setelah penanggung membayar ganti rugi, hak tertanggung untuk menuntut pihak ketiga yang menimbulkan kerugian beralih kepada penanggung.', 'Subrogasi mendukung prinsip indemnity agar tertanggung tidak memperoleh penggantian ganda.'],
    caraCepat: 'Ada pihak ketiga yang bersalah dan klaim sudah dibayar → hak menuntut pindah ke asuransi.',
  },
  {
    id: 'kontribusi-jiwa', tingkat: 'menantang', topik: 'prinsip', sumber: `${B4} (Contribution, catatan)`,
    pertanyaan: 'Rudi memiliki dua polis asuransi jiwa dari dua perusahaan berbeda. Jika Rudi meninggal dunia dan syarat kedua polis terpenuhi, ahli warisnya ....',
    jawaban: 'berhak atas manfaat kedua polis sekaligus, sebab asuransi jiwa tidak mengenal kontribusi',
    pengecoh: [
      P('hanya menerima manfaat dari satu polis karena prinsip indemnity melarang ganti rugi ganda', 'Indemnity tidak berlaku pada asuransi jiwa karena jiwa tidak dapat dinilai dengan uang.'),
      P('menerima manfaat yang dibagi rata oleh kedua perusahaan asuransi menurut prinsip kontribusi', 'Pembagian antarpenanggung adalah prinsip kontribusi pada asuransi umum; prinsip ini tidak berlaku pada asuransi jiwa.'),
      P('hanya menerima manfaat dari polis yang preminya paling besar di antara kedua polis', 'Tidak ada ketentuan yang membatasi pembayaran pada polis berpremi terbesar.'),
      P('tidak menerima manfaat karena kepemilikan dua polis melanggar prinsip subrogasi', 'Subrogasi tidak berkaitan dengan kepemilikan dua polis dan tidak berlaku pada asuransi jiwa.'),
    ],
    konsep: 'Penerapan prinsip pada asuransi jiwa', kataKunci: 'dua polis asuransi jiwa',
    alasan: ['Prinsip kontribusi berlaku pada asuransi umum, tetapi tidak pada asuransi jiwa.', 'Pemilik lebih dari satu polis asuransi jiwa menerima manfaat dari setiap polis karena jiwa seseorang tidak dapat ditentukan nilainya.'],
    caraCepat: 'Asuransi jiwa: tidak ada indemnity, subrogasi, dan kontribusi.',
  },
  {
    id: 'proximate-cause', tingkat: 'menantang', topik: 'prinsip', sumber: `${B4} (Proximate Cause)`,
    pertanyaan: 'Saat berkuda, Joko terkena serangan jantung, kehilangan kendali, lalu terjatuh dan meninggal karena benturan di kepala. Joko hanya memiliki asuransi kecelakaan diri yang mengecualikan serangan jantung. Berdasarkan prinsip penyebab terdekat, klaim ahli warisnya ....',
    jawaban: 'tidak dibayar, karena penyebab utama dan efektifnya adalah serangan jantung',
    pengecoh: [
      P('dibayar penuh, karena benturan kepala adalah kejadian terakhir sebelum kematian', 'Penyebab terdekat adalah penyebab utama yang efektif, bukan sekadar kejadian terakhir.'),
      P('dibayar setengah, karena terdapat dua penyebab kematian dalam rangkaian kejadian', 'Tidak ada ketentuan pembayaran separuh; yang dinilai adalah penyebab utamanya.'),
      P('dibayar penuh, karena asuransi kecelakaan diri menjamin semua jenis kematian', 'Polis Joko justru mengecualikan serangan jantung.'),
      P('tidak dibayar, karena Joko tidak berkepentingan atas jiwanya sendiri', 'Alasannya keliru; seseorang jelas berkepentingan atas jiwanya sendiri.'),
    ],
    konsep: 'Prinsip proximate cause', kataKunci: 'serangan jantung memicu rangkaian kejadian',
    alasan: ['Proximate cause adalah penyebab utama yang efektif menimbulkan rangkaian kejadian tanpa intervensi kekuatan baru yang berdiri sendiri.', 'Serangan jantung memicu jatuh dan benturan; karena serangan jantung dikecualikan polis, klaim tidak dapat dibayar.'],
    caraCepat: 'Telusuri rantai kejadian ke awal: penyebab yang memicu semuanya itulah yang dicocokkan dengan polis.',
  },
  {
    id: 'indemnity-mobil', tingkat: 'menengah', topik: 'prinsip', sumber: `${B4} (Contoh Penerapan Prinsip Indemnity)`,
    pertanyaan: 'Mobil Adi diasuransikan sejak dibeli dalam keadaan baru dan hilang pada tahun ketiga. Sesuai prinsip indemnity, ganti rugi yang tepat adalah ....',
    jawaban: 'nilai mobil sesaat sebelum hilang, maksimal sebesar nilai pertanggungan',
    pengecoh: [
      P('mobil baru dengan tipe yang sama seperti saat pertama kali dibeli tiga tahun lalu', 'Mengganti dengan mobil baru memberi keuntungan, bertentangan dengan indemnity.'),
      P('harga mobil baru saat klaim walaupun melebihi nilai pertanggungan polis', 'Ganti rugi paling tinggi sebesar nilai pertanggungan dalam polis.'),
      P('seluruh premi yang telah dibayar selama tiga tahun beserta biaya polis', 'Ganti rugi bukan pengembalian premi.'),
      P('nilai pertanggungan ditambah bunga atas premi yang telah dibayar', 'Tidak ada dasar penambahan bunga; asuransi tidak untuk mencari untung.'),
    ],
    konsep: 'Prinsip indemnity', kataKunci: 'hilang pada tahun ketiga',
    alasan: ['Indemnity menempatkan tertanggung pada posisi keuangan sesaat sebelum kerugian, tanpa unsur keuntungan.', 'Nilai mobil sudah menyusut setelah dipakai, dan ganti rugi paling tinggi sebesar nilai pertanggungan.'],
    caraCepat: 'Indemnity = kembali ke kondisi sesaat sebelum rugi, tidak lebih.',
  },
  {
    id: 'prinsip-majemuk', tingkat: 'menantang', topik: 'prinsip', sumber: `${B4} (Tabel 1 Prinsip-Prinsip Asuransi)`,
    pertanyaan: 'Perhatikan pernyataan berikut.\n(1) Prinsip insurable interest berlaku pada asuransi jiwa dan asuransi umum.\n(2) Prinsip indemnity berlaku pada asuransi jiwa.\n(3) Prinsip subrogasi berlaku pada asuransi umum.\n(4) Prinsip kontribusi berlaku pada asuransi jiwa.\nPernyataan yang benar adalah ....',
    jawaban: '(1) dan (3)',
    pengecoh: [
      P('(1) dan (2)', 'Pernyataan (2) salah: indemnity hanya berlaku pada asuransi umum.'),
      P('(2) dan (4)', 'Keduanya salah: indemnity dan kontribusi tidak berlaku pada asuransi jiwa.'),
      P('(3) dan (4)', 'Pernyataan (4) salah: kontribusi tidak berlaku pada asuransi jiwa.'),
      P('(1), (2), dan (3)', 'Pernyataan (2) salah.'),
      P('(1), (3), dan (4)', 'Pernyataan (4) salah.'),
    ],
    konsep: 'Penerapan prinsip asuransi menurut jenis asuransi', kataKunci: 'asuransi jiwa dan asuransi umum',
    alasan: ['Insurable interest, utmost good faith, dan proximate cause berlaku pada asuransi jiwa dan umum.', 'Indemnity, subrogasi, dan kontribusi hanya berlaku pada asuransi umum.'],
    caraCepat: 'Tiga prinsip “ganti rugi” (indemnity, subrogasi, kontribusi) hanya untuk asuransi umum.',
  },
  {
    id: 'banjir-langkah', tingkat: 'dasar', topik: 'klaim', sumber: `${EB}, subbab 3.1.4 dan contoh soal 4.1`,
    pertanyaan: 'Rumah Lina terendam banjir saat polis asuransi harta bendanya masih berlaku. Langkah pertama untuk menentukan apakah kerusakan itu termasuk risiko yang dijamin adalah ....',
    jawaban: 'mencocokkan penyebab kerusakan dengan cakupan dan pengecualian polis',
    pengecoh: [
      P('menghitung besar risiko sendiri yang harus dibayar Lina untuk kerusakan itu', 'Risiko sendiri diperiksa setelah cakupan dipastikan.'),
      P('memilih kontraktor rekanan perusahaan untuk memperbaiki rumah', 'Rekanan perbaikan tidak menentukan apakah risiko dijamin.'),
      P('menanyakan besar premi pada periode berjalan kepada perusahaan', 'Besar premi tidak menunjukkan risiko yang dijamin.'),
      P('langsung meminta pembayaran penuh karena polis masih aktif saat banjir', 'Polis aktif belum tentu menjamin banjir; cakupan, perluasan jaminan, dan pengecualian harus diperiksa.'),
    ],
    konsep: 'Menilai risiko yang dijamin', kataKunci: 'terendam banjir, apakah dijamin',
    alasan: ['Cakupan, perluasan jaminan, dan pengecualian menentukan apakah kejadian termasuk risiko yang dijamin.', 'Batas manfaat dan risiko sendiri baru diperiksa setelah cakupan dipastikan.'],
    caraCepat: 'Urutannya: cakupan dan pengecualian dulu, baru hitungan.',
  },
  {
    id: 'tenggang-waktu', tingkat: 'menengah', topik: 'premi', sumber: `${EB}, subbab 3.1.2 C dan contoh soal 4.5`,
    pertanyaan: 'Premi polis Tono jatuh tempo pada tanggal 10 dan belum dibayar ketika kejadian yang diklaim terjadi pada tanggal 14. Informasi yang paling menentukan status perlindungan pada tanggal 14 adalah ....',
    jawaban: 'ketentuan tenggang waktu dan akibat keterlambatan premi dalam polis',
    pengecoh: [
      P('besar batas manfaat per kejadian yang tercantum dalam ikhtisar polis', 'Batas manfaat menentukan jumlah pembayaran, bukan status perlindungan.'),
      P('daftar fasilitas atau bengkel rekanan yang bekerja sama dengan penanggung', 'Daftar rekanan tidak menentukan apakah polis masih berlaku.'),
      P('tenggat pelaporan klaim yang dihitung sejak tanggal kejadian', 'Tenggat pelaporan berkaitan dengan prosedur klaim, bukan status premi.'),
      P('besar premi yang harus dibayar untuk periode pertanggungan berikutnya', 'Premi periode berikutnya tidak menjawab status pada tanggal kejadian.'),
    ],
    konsep: 'Premi dan status perlindungan', kataKunci: 'premi belum dibayar setelah jatuh tempo',
    alasan: ['Polis menetapkan jadwal pembayaran, tenggang waktu bila berlaku, dan akibat jika pembayaran melewati tenggang waktu.', 'Tanggal kejadian dicocokkan dengan ketentuan tenggang waktu dan status perlindungan.'],
    caraCepat: 'Premi telat + ada kejadian → cek tenggang waktu.',
  },
  {
    id: 'masa-tunggu', tingkat: 'menengah', topik: 'klaim', sumber: `${EB}, subbab 3.1.2 D dan contoh soal 4.6`,
    pertanyaan: 'Polis kesehatan Dewi aktif sejak 1 Maret. Manfaat rawat inap karena sakit memiliki masa tunggu 30 hari. Dewi dirawat inap karena sakit pada 18 Maret. Hal yang perlu diperhatikan adalah ....',
    jawaban: 'manfaat rawat inap tersebut masih berada dalam masa tunggu',
    pengecoh: [
      P('perusahaan pasti langsung membayar karena polis sudah aktif', 'Tanggal mulai polis dapat berbeda dari tanggal mulai berlakunya manfaat tertentu.'),
      P('batas manfaat rawat inap otomatis dinaikkan', 'Tidak ada ketentuan yang menaikkan batas manfaat.'),
      P('tanggal rawat inap dapat diganti dengan tanggal pengajuan', 'Tanggal kejadian tidak dapat diganti untuk menghindari masa tunggu.'),
      P('Dewi cukup membayar risiko sendiri lalu klaim dibayar', 'Masalahnya adalah masa tunggu, bukan risiko sendiri.'),
    ],
    konsep: 'Masa tunggu', kataKunci: 'aktif 1 Maret, masa tunggu 30 hari, rawat 18 Maret',
    alasan: ['Masa tunggu menunda berlakunya manfaat tertentu; 18 Maret baru 17 hari sejak polis aktif sehingga masih dalam masa tunggu 30 hari.'],
    caraCepat: 'Hitung selisih tanggal mulai polis dan tanggal kejadian, lalu bandingkan dengan masa tunggu.',
  },
  {
    id: 'dua-kejadian', tingkat: 'menantang', topik: 'klaim', sumber: `${EB}, contoh soal 4.9`,
    pertanyaan: 'Polis kendaraan Fajar menjamin kerusakan akibat benturan dan memuat perluasan banjir. Perluasan itu mengecualikan kerusakan mesin akibat kendaraan sengaja dikendarai menerobos genangan. Saat polis aktif, pintu mobil Fajar penyok karena terserempet; pada kejadian lain, mesinnya rusak karena ia sengaja menerobos genangan. Penilaian yang tepat adalah ....',
    jawaban: 'kerusakan pintu dijamin, sedangkan kerusakan mesin termasuk pengecualian',
    pengecoh: [
      P('keduanya dijamin karena polis masih aktif', 'Polis aktif tidak menghapus pengecualian pada perluasan banjir.'),
      P('kerusakan mesin dijamin, sedangkan kerusakan pintu termasuk pengecualian', 'Penilaian terbalik: benturan dijamin, mesin akibat menerobos genangan dikecualikan.'),
      P('keduanya termasuk pengecualian karena terjadi pada mobil yang sama', 'Setiap kejadian dinilai menurut penyebabnya masing-masing.'),
      P('keduanya baru dapat dinilai setelah risiko sendiri diketahui', 'Risiko sendiri memengaruhi jumlah pembayaran, bukan cakupan.'),
    ],
    konsep: 'Cakupan dan pengecualian per kejadian', kataKunci: 'terserempet; sengaja menerobos genangan',
    alasan: ['Kerusakan pintu akibat benturan tercakup polis.', 'Kerusakan mesin terjadi dalam kondisi yang secara khusus dikecualikan perluasan banjir.'],
    caraCepat: 'Pisahkan kejadian, cocokkan penyebab masing-masing dengan cakupan dan pengecualian.',
  },
  {
    id: 'pilih-polis', tingkat: 'menantang', topik: 'memilih-produk', sumber: `${EB}, subbab 3.1.2 D dan contoh soal 4.10`, berlakuPer: 'POJK 36/2025',
    pertanyaan: 'Nia mencari polis rawat inap dengan premi paling tinggi Rp500.000 per bulan, ingin biaya kamar Rp1.000.000 per malam tercakup penuh, dan ingin menghindari co-payment. Polis A: premi Rp450.000, batas kamar Rp800.000, tanpa pembagian risiko. Polis B: premi Rp500.000, batas kamar Rp1.000.000, tanpa pembagian risiko. Polis C: premi Rp480.000, batas kamar Rp1.000.000, co-payment 5%. Manfaat lain dianggap setara. Pilihan yang memenuhi seluruh kriteria Nia adalah ....',
    jawaban: 'Polis B',
    pengecoh: [
      P('Polis A', 'Batas kamar Polis A kurang Rp200.000 per malam dari tarif kamar.'),
      P('Polis C', 'Polis C memenuhi anggaran dan batas kamar, tetapi memiliki co-payment.'),
      P('Polis A dan Polis B', 'Polis A tidak memenuhi kebutuhan biaya kamar.'),
      P('Polis B dan Polis C', 'Polis C memiliki co-payment yang ingin dihindari Nia.'),
      P('Polis A dan Polis C', 'Polis A gagal pada batas kamar, Polis C gagal pada co-payment.'),
    ],
    konsep: 'Membandingkan polis kesehatan', kataKunci: 'anggaran, batas kamar, menghindari co-payment',
    alasan: ['Premi Polis B tepat di batas anggaran, batas kamarnya sama dengan tarif kamar, dan tidak memiliki fitur pembagian risiko.'],
    caraCepat: 'Uji setiap polis terhadap semua kriteria; satu kriteria gagal berarti gugur.',
  },
  {
    id: 'moral-hazard', tingkat: 'menengah', topik: 'informasi-asimetris', sumber: `${B4} (Adverse Selection dan Moral Hazard)`,
    pertanyaan: 'Setelah memiliki asuransi kendaraan, Hadi dengan sengaja sering mengemudi dengan kecepatan tinggi karena merasa kerugiannya akan ditanggung. Perubahan perilaku ini disebut ....',
    jawaban: 'moral hazard',
    pengecoh: [
      P('adverse selection', 'Adverse selection terjadi sebelum kontrak disetujui, bukan perubahan perilaku sesudahnya.'),
      P('subrogasi', 'Subrogasi adalah peralihan hak menuntut pihak ketiga.'),
      P('signaling', 'Signaling adalah pemberian sinyal informasi sebelum kontrak.'),
      P('ko-asuransi', 'Ko-asuransi adalah penutupan risiko oleh beberapa penanggung.'),
      P('screening', 'Screening adalah upaya penanggung menggali informasi calon tertanggung.'),
    ],
    konsep: 'Asymmetric information', kataKunci: 'setelah memiliki asuransi, sengaja lebih ceroboh',
    alasan: ['Moral hazard adalah perubahan perilaku yang disengaja setelah kontrak disetujui, misalnya mengemudi lebih kencang setelah memiliki asuransi kendaraan.'],
    caraCepat: 'Sebelum kontrak = adverse selection; sesudah kontrak = moral hazard.',
  },
  {
    id: 'adverse-selection', tingkat: 'menengah', topik: 'informasi-asimetris', sumber: `${B4} (Adverse Selection dan Moral Hazard)`,
    pertanyaan: 'Calon tertanggung yang berisiko tinggi lebih banyak membeli asuransi, sementara perusahaan asuransi tidak dapat membedakan mereka dari calon berisiko rendah karena kurang informasi sebelum kontrak disetujui. Kondisi ini disebut ....',
    jawaban: 'adverse selection',
    pengecoh: [
      P('moral hazard', 'Moral hazard muncul setelah kontrak disetujui.'),
      P('subrogasi', 'Subrogasi adalah peralihan hak menuntut pihak ketiga.'),
      P('kontribusi', 'Kontribusi adalah pembagian ganti rugi antarpenanggung.'),
      P('retensi sendiri', 'Retensi sendiri adalah bagian risiko yang ditanggung perusahaan asuransi setelah reasuransi.'),
      P('hukum bilangan besar', 'Hukum bilangan besar menjelaskan prediksi kerugian dari banyak risiko sejenis.'),
    ],
    konsep: 'Asymmetric information', kataKunci: 'kurang informasi sebelum kontrak, berisiko tinggi lebih banyak membeli',
    alasan: ['Adverse selection terjadi ketika pihak yang kekurangan informasi tidak dapat membedakan risiko tinggi dan rendah sebelum kontrak disetujui.'],
    caraCepat: 'Masalah informasi sebelum kontrak = adverse selection.',
  },
  {
    id: 'koasuransi-reasuransi', tingkat: 'menantang', topik: 'reasuransi', sumber: `${B4} (Pengertian Ko-Asuransi dan Reasuransi)`,
    pertanyaan: 'Pernyataan yang tepat mengenai perbedaan ko-asuransi dan reasuransi adalah ....',
    jawaban: 'tertanggung berkontrak dengan semua penanggung ko-asuransi, tetapi tidak dengan reasuradur',
    pengecoh: [
      P('pada reasuransi tertanggung dapat menuntut perusahaan reasuransi secara langsung atas klaimnya', 'Dalam reasuransi tertanggung tidak mempunyai hubungan kontraktual dengan reasuradur.'),
      P('ko-asuransi adalah pengalihan sebagian risiko dari perusahaan asuransi kepada perusahaan reasuransi', 'Pengalihan risiko kepada reasuradur adalah reasuransi.'),
      P('pada ko-asuransi hanya leader yang tercantum dalam polis asli, sedangkan anggota lain tidak', 'Bagian setiap penanggung ko-asuransi dicantumkan dalam polis asli; leader biasanya hanya mengurus administrasi dan penerbitan polis.'),
      P('ko-asuransi dan reasuransi sama-sama tidak tercantum dalam polis asli', 'Ko-asuransi justru dicantumkan dalam polis asli.'),
    ],
    konsep: 'Ko-asuransi dan reasuransi', kataKunci: 'hubungan kontraktual tertanggung',
    alasan: ['Pada ko-asuransi, bagian setiap penanggung tercantum dalam polis asli dan tertanggung terikat kontrak dengan semua penanggung.', 'Pada reasuransi, tertanggung tidak mempunyai hubungan kontraktual dengan perusahaan reasuransi.'],
    caraCepat: 'Ko-asuransi = beberapa penanggung di depan nasabah; reasuransi = di belakang perusahaan asuransi.',
  },
  {
    id: 'klaim-reasuransi', tingkat: 'menengah', topik: 'reasuransi', sumber: `${EB}, subbab 3.1.2 E`,
    pertanyaan: 'Banjir besar memicu banyak klaim kendaraan pada sebuah perusahaan asuransi yang memiliki kontrak reasuransi. Pernyataan yang tepat adalah ....',
    jawaban: 'perusahaan asuransi menangani klaim sesuai polis, lalu menagih bagian reasuradur',
    pengecoh: [
      P('nasabah mengajukan klaim langsung kepada perusahaan reasuransi yang menanggung risikonya', 'Nasabah terikat polis dengan perusahaan asuransi, bukan dengan reasuradur.'),
      P('besar manfaat tiap nasabah ditentukan oleh kontrak reasuransi, bukan oleh polisnya', 'Besar manfaat setiap nasabah tetap mengikuti polis masing-masing.'),
      P('perusahaan asuransi bebas dari kewajiban membayar klaim atas risiko yang direasuransikan', 'Perusahaan asuransi tetap wajib menangani klaim sesuai polis.'),
      P('perusahaan reasuransi menanggung seluruh kerugian tanpa melihat isi kontrak', 'Bagian yang dialihkan dan jenis kerugian mengikuti kontrak reasuransi.'),
    ],
    konsep: 'Dua hubungan kontrak dalam reasuransi', kataKunci: 'banyak klaim, kontrak reasuransi',
    alasan: ['Nasabah dan perusahaan asuransi terikat oleh polis; perusahaan asuransi dan perusahaan reasuransi terikat oleh kontrak reasuransi.', 'Perusahaan asuransi menangani klaim, lalu dapat meminta penggantian bagian kerugian yang tercakup kontrak reasuransi.'],
    caraCepat: 'Polis untuk nasabah, kontrak reasuransi untuk perusahaan asuransi.',
  },
  {
    id: 'rbc-110', tingkat: 'menantang', topik: 'kesehatan-keuangan', sumber: `${EB}, subbab 3.1.2 H`, berlakuPer: 'ketentuan solvabilitas OJK sebagaimana dijelaskan e-book 2026',
    pertanyaan: 'Sebuah perusahaan asuransi konvensional memiliki rasio solvabilitas 110% dari MMBR. Berdasarkan ketentuan OJK tentang tingkat solvabilitas, kondisi tersebut berarti perusahaan ....',
    jawaban: 'memenuhi batas minimum 100%, tetapi berada di bawah target internal minimal 120%',
    pengecoh: [
      P('tidak memenuhi batas minimum karena tingkat minimum yang wajib dipenuhi adalah 120%', 'Angka 120% adalah target solvabilitas internal; batas minimum setiap saat 100%.'),
      P('telah melampaui target internal sehingga tidak perlu lagi memantau risiko usahanya', '110% masih di bawah target internal minimal 120%.'),
      P('wajib menghentikan seluruh penjualan polis karena rasionya di bawah 150%', 'Angka 150% hanya ilustrasi perhitungan, bukan batas ketentuan.'),
      P('tidak dapat dinilai karena rasio solvabilitas tidak dibandingkan dengan MMBR', 'Rasio solvabilitas justru membandingkan tingkat solvabilitas dengan MMBR.'),
    ],
    konsep: 'Batas solvabilitas', kataKunci: 'rasio solvabilitas 110%',
    alasan: ['Ketentuan OJK membedakan kewajiban memenuhi tingkat solvabilitas paling rendah 100% dari MMBR setiap saat dan target solvabilitas internal paling rendah 120% dari MMBR.', '110% berada di atas 100% tetapi di bawah 120%.'],
    caraCepat: '100% = batas wajib; 120% = target internal.',
  },
  {
    id: 'tanpa-pembagian-risiko', tingkat: 'menengah', topik: 'regulasi', sumber: `${EB}, subbab 3.1.2 D`, berlakuPer: 'POJK 36/2025',
    pertanyaan: 'Berdasarkan POJK Nomor 36 Tahun 2025, perusahaan yang menyelenggarakan lini usaha asuransi kesehatan wajib ....',
    jawaban: 'menyediakan pilihan produk tanpa fitur pembagian risiko',
    pengecoh: [
      P('menerapkan co-payment pada seluruh produk kesehatannya', 'Produk dengan fitur pembagian risiko hanya pilihan tambahan.'),
      P('membebankan deductible tahunan kepada semua pemegang polis', 'Deductible tahunan hanya dapat dipakai pada produk dengan fitur pembagian risiko sesuai kesepakatan.'),
      P('menjual produk kesehatan hanya melalui pialang asuransi', 'Ketentuan ini tidak membatasi saluran pemasaran pada pialang.'),
      P('menghapus pengecualian dari seluruh polis kesehatan', 'Pengecualian tetap dapat dicantumkan dalam polis.'),
    ],
    konsep: 'Pembagian risiko pada asuransi kesehatan', kataKunci: 'POJK 36/2025, lini usaha asuransi kesehatan',
    alasan: ['POJK 36/2025 mewajibkan perusahaan penyelenggara lini usaha asuransi kesehatan menyediakan pilihan produk tanpa fitur pembagian risiko; produk dengan fitur tersebut boleh menjadi pilihan tambahan.'],
    caraCepat: 'Wajib ada pilihan tanpa co-payment; co-payment hanya pilihan tambahan.',
  },
  {
    id: 'ilustrasi-paydi', tingkat: 'menengah', topik: 'produk', sumber: `${EB}, subbab 3.1.2 A dan 3.1.7 B`,
    pertanyaan: 'Wulan membaca ilustrasi PAYDI yang menunjukkan nilai tunai Rp15 juta pada akhir tahun kelima. Kesimpulan yang tepat adalah ....',
    jawaban: 'nilai sebenarnya dapat berbeda karena bergantung pada hasil investasi dan biaya',
    pengecoh: [
      P('nilai tunai Rp15 juta pasti diterima Wulan pada akhir tahun kelima sesuai ilustrasi', 'Ilustrasi menunjukkan cara kerja produk dengan asumsi, bukan nilai yang dijamin.'),
      P('biaya asuransi dan administrasi polis tidak memengaruhi besar nilai tunai', 'Biaya asuransi, administrasi, dan pengelolaan memengaruhi nilai tunai.'),
      P('penarikan nilai tunai tidak pernah memengaruhi manfaat maupun kelangsungan perlindungan', 'Penarikan dapat memengaruhi manfaat atau kelangsungan perlindungan.'),
      P('PAYDI hanya memberi manfaat investasi tanpa manfaat proteksi', 'PAYDI memberi manfaat proteksi sekaligus manfaat yang dikaitkan dengan investasi.'),
    ],
    konsep: 'Risiko investasi pada PAYDI', kataKunci: 'ilustrasi nilai tunai',
    alasan: ['Nilai bagian investasi dapat naik atau turun mengikuti kinerja aset yang mendasarinya.', 'Sebelum memakai angka ilustrasi, periksa asumsi hasil investasi, biaya, dan ketentuan penarikan.'],
    caraCepat: 'Angka ilustrasi PAYDI = skenario, bukan janji.',
  },
  {
    id: 'pialang', tingkat: 'dasar', topik: 'pemasaran', sumber: `${EB}, subbab 3.1.2 F`,
    pertanyaan: 'Perusahaan milik Raka menggunakan jasa perantara yang bertindak untuk kepentingan perusahaannya dalam mencari penempatan asuransi dan membantu penanganan klaim. Perantara tersebut adalah ....',
    jawaban: 'pialang asuransi',
    pengecoh: [
      P('agen asuransi', 'Agen memasarkan produk atas nama perusahaan asuransi, bukan untuk kepentingan tertanggung.'),
      P('perusahaan reasuransi', 'Perusahaan reasuransi menanggung kembali risiko perusahaan asuransi.'),
      P('Dewan Pengawas Syariah', 'DPS mengawasi kepatuhan syariah perusahaan asuransi syariah.'),
      P('perusahaan asuransi umum', 'Perusahaan asuransi umum adalah penanggung, bukan perantara.'),
    ],
    konsep: 'Agen dan pialang asuransi', kataKunci: 'perantara untuk kepentingan perusahaannya',
    alasan: ['Pialang asuransi memberi jasa perantara untuk kepentingan calon pemegang polis, pemegang polis, atau tertanggung, termasuk penempatan asuransi dan penanganan klaim.'],
    caraCepat: 'Mewakili nasabah = pialang; mewakili perusahaan asuransi = agen.',
  },
];

// ─────────────────────────────── VARIASI: relasi dua arah ───────────────────────────────
const bPrinsip = pembuatBaris(`${B4} (Prinsip-Prinsip Asuransi); ${EB}, subbab 3.1.3`);
const bIstilah = pembuatBaris(`${EB}, Istilah Dasar dan subbab 3.1.1`);
const bPelaku = pembuatBaris(`${EB}, subbab 3.1.1 B dan 3.1.2 F`);
const bSyariah = pembuatBaris(`${EB}, subbab 3.1.2 G`);

const TABEL: TabelRelasi[] = [
  {
    id: 'prinsip', topik: 'prinsip',
    tanyaNilai: (s) => `Dalam perjanjian asuransi, prinsip ${s} bermakna ....`,
    tanyaSubjek: (n) => `Prinsip asuransi yang bermakna ${n} adalah ....`,
    alasanSalah: alasanRelasi, kalimat: kalimatRelasi, konsep: 'Prinsip dasar asuransi',
    caraCepat: 'Hafalkan kata kunci tiap prinsip: hubungan keuangan, fakta material, posisi sebelum rugi, hak menuntut, beberapa penanggung, penyebab utama.',
    baris: [
      bPrinsip('ii', 'insurable interest', 'adanya hubungan keuangan yang diakui hukum antara tertanggung dan objek pertanggungan'),
      bPrinsip('ugf', 'utmost good faith', 'kewajiban mengungkapkan seluruh fakta material secara jujur, lengkap, dan akurat'),
      bPrinsip('ind', 'indemnity', 'penggantian yang mengembalikan tertanggung ke posisi keuangan sesaat sebelum kerugian'),
      bPrinsip('sub', 'subrogasi', 'peralihan hak menuntut pihak ketiga kepada penanggung setelah ganti rugi dibayar', 'menengah'),
      bPrinsip('kon', 'kontribusi', 'pembagian ganti rugi di antara beberapa penanggung sebanding tanggungan masing-masing', 'menengah'),
      bPrinsip('pc', 'proximate cause', 'penentuan penyebab utama dan efektif yang menimbulkan rangkaian kejadian kerugian', 'menengah'),
    ],
  },
  {
    id: 'istilah', topik: 'istilah-polis',
    tanyaNilai: (s) => `Dalam perjanjian asuransi, istilah ${s} berarti ....`,
    tanyaSubjek: (n) => `Dalam perjanjian asuransi, ${n} disebut ....`,
    alasanSalah: alasanRelasi, kalimat: kalimatRelasi, konsep: 'Istilah dasar polis asuransi',
    caraCepat: 'Bedakan pihak (penanggung, tertanggung, pemegang polis, penerima manfaat) dari ketentuan polis (masa tunggu, pengecualian, batas manfaat).',
    baris: [
      bIstilah('penanggung', 'penanggung', 'perusahaan asuransi yang memberikan perlindungan sesuai polis'),
      bIstilah('tertanggung', 'tertanggung', 'orang atau pihak yang risikonya dilindungi sesuai polis'),
      bIstilah('pemegang', 'pemegang polis', 'pihak yang mengadakan perjanjian dengan perusahaan asuransi serta memikul hak dan kewajibannya', 'menengah'),
      bIstilah('penerima', 'penerima manfaat', 'pihak yang ditunjuk untuk memperoleh pembayaran ketika syarat polis terpenuhi', 'menengah'),
      bIstilah('polis', 'polis', 'dokumen perjanjian yang memuat manfaat, syarat, dan batas perlindungan'),
      bIstilah('premi', 'premi', 'pembayaran yang dilakukan untuk memperoleh pertanggungan'),
      bIstilah('klaim', 'klaim', 'permintaan pembayaran manfaat atau ganti rugi kepada perusahaan asuransi'),
      bIstilah('risiko-sendiri', 'risiko sendiri', 'bagian kerugian yang tetap dibayar tertanggung menurut ketentuan polis', 'menengah'),
      bIstilah('masa-tunggu', 'masa tunggu', 'periode sebelum manfaat tertentu mulai dapat digunakan'),
      bIstilah('perluasan', 'perluasan jaminan', 'tambahan cakupan untuk risiko tertentu, misalnya banjir, bila dicantumkan', 'menengah'),
      bIstilah('pengecualian', 'pengecualian', 'risiko atau keadaan yang dinyatakan tidak dijamin oleh polis'),
      bIstilah('batas', 'batas manfaat', 'jumlah maksimum yang dapat dibayarkan perusahaan untuk suatu jenis perlindungan', 'menengah'),
    ],
  },
  {
    id: 'pelaku', topik: 'industri',
    tanyaNilai: (s) => `Dalam industri perasuransian, ${s} adalah ....`,
    tanyaSubjek: (n) => `Dalam industri perasuransian, ${n} disebut ....`,
    alasanSalah: alasanRelasi, kalimat: kalimatRelasi, konsep: 'Jenis usaha dan pelaku perasuransian',
    caraCepat: 'Jiwa = meninggal/hidup; umum = kerugian dan tanggung jawab hukum; reasuransi = menanggung kembali; agen = atas nama perusahaan asuransi; pialang asuransi = untuk nasabah; pialang reasuransi = untuk perusahaan asuransi; penilai kerugian = menilai klaim.',
    // semua nilai berbentuk "pihak yang …" agar pengecoh tidak dapat disingkirkan hanya dari kategorinya (usaha/pihak/mekanisme)
    baris: [
      bPelaku('jiwa', 'perusahaan asuransi jiwa', 'pihak yang memberikan manfaat terkait meninggal dunia atau tetap hidupnya tertanggung'),
      bPelaku('umum', 'perusahaan asuransi umum', 'pihak yang memberikan ganti rugi atas kerugian, kerusakan, biaya, atau tanggung jawab hukum'),
      bPelaku('reas', 'perusahaan reasuransi', 'pihak yang menanggung kembali sebagian risiko yang telah diterima perusahaan asuransi'),
      bPelaku('agen', 'agen asuransi', 'pihak yang memasarkan produk asuransi untuk dan atas nama perusahaan asuransi'),
      bPelaku('pialang', 'pialang asuransi', 'pihak yang memberi jasa perantara penutupan asuransi untuk kepentingan pemegang polis atau tertanggung', 'menengah'),
      bPelaku('pialang-reas', 'pialang reasuransi', 'pihak yang memberi jasa perantara penempatan reasuransi untuk kepentingan perusahaan asuransi', 'menantang', { sumber: 'UU 40/2014 tentang Perasuransian, Pasal 1 (definisi usaha pialang reasuransi)', berlakuPer: 'UU 40/2014 jo. UU 4/2023 (P2SK)' }),
      bPelaku('penilai', 'penilai kerugian asuransi', 'pihak yang memberi jasa penilaian klaim atau konsultasi atas objek asuransi', 'menantang', { sumber: 'UU 40/2014 tentang Perasuransian, Pasal 1 (definisi usaha penilai kerugian asuransi)', berlakuPer: 'UU 40/2014 jo. UU 4/2023 (P2SK)' }),
    ],
  },
  {
    id: 'syariah', topik: 'asuransi-syariah',
    tanyaNilai: (s) => `Dalam asuransi syariah, ${s} adalah ....`,
    tanyaSubjek: (n) => `Dalam asuransi syariah, ${n} disebut ....`,
    alasanSalah: alasanRelasi, kalimat: kalimatRelasi, konsep: 'Cara kerja asuransi syariah',
    caraCepat: "Tabarru' = dana tolong-menolong; wakalah bil ujrah = akad kuasa berimbalan; ujrah = imbalannya; DPS = pengawas kepatuhan syariah.",
    baris: [
      bSyariah('tabarru', "dana tabarru'", 'dana bersama dari kontribusi peserta yang dihibahkan untuk membantu peserta lain'),
      bSyariah('wakalah', 'wakalah bil ujrah', 'akad pemberian kuasa kepada perusahaan untuk mengelola dana peserta dengan imbalan', 'menengah'),
      bSyariah('ujrah', 'ujrah', 'imbalan yang diterima perusahaan atas jasa pengelolaan dana'),
      bSyariah('dip', 'Dana Investasi Peserta', 'dana peserta untuk investasi yang dikelola terpisah dari dana tolong-menolong', 'menengah'),
      bSyariah('dps', 'Dewan Pengawas Syariah', 'organ yang menasihati pengurus dan mengawasi kesesuaian kegiatan dengan prinsip syariah'),
    ],
  },
];

// ─────────────────────────────── VARIASI: hitungan ───────────────────────────────
const JT = 1_000_000;
const M = 1_000_000_000;
const NAMA = ['X', 'Y', 'Z'];

const HITUNG: TemplateHitung[] = [
  {
    id: 'risiko-sendiri', topik: 'klaim', tingkat: 'dasar', sumber: `${EB}, subbab 3.1.4 D dan contoh soal 4.2`,
    set: [{ K: 8 * JT, D: 500_000 }, { K: 12 * JT, D: 300_000 }, { K: 6_500_000, D: 750_000 }, { K: 15 * JT, D: 1 * JT }],
    pertanyaan: (p) => `Kendaraan seorang tertanggung rusak akibat risiko yang dijamin polis. Perusahaan asuransi menyetujui kerugian ${rp(p.K)}, polis menetapkan risiko sendiri ${rp(p.D)} per kejadian, batas manfaat mencukupi, dan tidak ada pengurang lain. Besar pembayaran klaim adalah ....`,
    hitung: (p) => p.K - p.D, format: rp,
    salah: [
      { nilai: (p) => p.K, alasan: () => 'Risiko sendiri belum dikurangkan dari kerugian yang disetujui.' },
      { nilai: (p) => p.K + p.D, alasan: () => 'Risiko sendiri justru ditambahkan, padahal bagian itu ditanggung tertanggung.' },
      { nilai: (p) => p.D, alasan: () => 'Itu besar risiko sendiri yang dibayar tertanggung, bukan pembayaran klaim.' },
      { nilai: (p) => p.K - 2 * p.D, alasan: () => 'Risiko sendiri dikurangkan dua kali, padahal hanya dikenakan sekali per kejadian.' },
    ],
    konsep: 'Pembayaran klaim dengan risiko sendiri', kataKunci: 'kerugian disetujui, risiko sendiri per kejadian',
    langkah: (p) => [`Pembayaran klaim = kerugian yang disetujui − risiko sendiri = ${rp(p.K)} − ${rp(p.D)} = ${rp(p.K - p.D)}.`],
    caraCepat: 'Kerugian disetujui dikurangi risiko sendiri sekali.',
  },
  {
    id: 'batas-kamar', topik: 'batas-manfaat', tingkat: 'menengah', sumber: `${EB}, subbab 3.1.7 A dan contoh soal 4.7`,
    set: [{ T: 950_000, B: 750_000, n: 3 }, { T: 900_000, B: 700_000, n: 2 }, { T: 1_200_000, B: 800_000, n: 4 }, { T: 1_000_000, B: 650_000, n: 5 }],
    pertanyaan: (p) => `Setelah masa tunggu lewat, seorang tertanggung dirawat inap ${p.n} malam dengan tarif kamar ${rp(p.T)} per malam. Polis mengganti biaya kamar paling banyak ${rp(p.B)} per malam, dan klaim memenuhi syarat tanpa pengurang lain. Biaya kamar yang harus dibayar sendiri adalah ....`,
    hitung: (p) => (p.T - p.B) * p.n, format: rp,
    salah: [
      { nilai: (p) => p.T - p.B, alasan: () => 'Itu selisih untuk satu malam; belum dikalikan jumlah malam.' },
      { nilai: (p) => p.B * p.n, alasan: () => 'Itu manfaat kamar yang dibayar perusahaan, bukan bagian tertanggung.' },
      { nilai: (p) => p.T * p.n, alasan: () => 'Itu seluruh biaya kamar sebelum dikurangi manfaat polis.' },
      { nilai: (p) => (p.T - p.B) * (p.n - 1), alasan: () => 'Jumlah malam terhitung kurang satu.' },
      { nilai: (p) => (p.T - p.B) * (p.n + 1), alasan: () => 'Jumlah malam terhitung lebih satu.' },
    ],
    konsep: 'Batas manfaat per malam', kataKunci: 'tarif kamar melebihi batas manfaat',
    langkah: (p) => [`Selisih per malam = ${rp(p.T)} − ${rp(p.B)} = ${rp(p.T - p.B)}.`, `Untuk ${p.n} malam: ${rp(p.T - p.B)} × ${p.n} = ${rp((p.T - p.B) * p.n)}.`],
    caraCepat: 'Kalikan selisih tarif dan batas per malam dengan jumlah malam.',
  },
  {
    id: 'co-payment', topik: 'pembagian-risiko', tingkat: 'menantang', sumber: `${EB}, subbab 3.1.2 D`, berlakuPer: 'POJK 36/2025',
    set: [{ C: 8 * JT, inap: 0 }, { C: 4 * JT, inap: 0 }, { C: 40 * JT, inap: 1 }, { C: 80 * JT, inap: 1 }],
    pertanyaan: (p) => `Polis kesehatan Sinta memiliki fitur co-payment sesuai POJK 36/2025: bagian tertanggung 5% dari total pengajuan klaim, dengan batas Rp300.000 untuk rawat jalan dan Rp3.000.000 untuk rawat inap per pengajuan klaim. Sinta mengajukan klaim ${p.inap ? 'rawat inap' : 'rawat jalan'} sebesar ${rp(p.C)}. Bagian co-payment yang ditanggung Sinta adalah ....`,
    hitung: (p) => Math.min(0.05 * p.C, p.inap ? 3 * JT : 300_000), format: rp,
    salah: [
      { nilai: (p) => 0.05 * p.C, alasan: () => 'Batas co-payment per pengajuan klaim diabaikan.' },
      { nilai: (p) => (p.inap ? 3 * JT : 300_000), alasan: () => 'Batas maksimum dipakai padahal 5% dari klaim lebih kecil daripada batas itu.' },
      { nilai: (p) => 0.1 * p.C, alasan: () => 'Persentase co-payment adalah 5%, bukan 10%.' },
      { nilai: (p) => p.C - Math.min(0.05 * p.C, p.inap ? 3 * JT : 300_000), alasan: () => 'Itu bagian yang dibayar perusahaan, bukan co-payment tertanggung.' },
      { nilai: (p) => (p.inap ? 300_000 : 3 * JT), alasan: (p) => `Batas yang dipakai adalah batas ${p.inap ? 'rawat jalan' : 'rawat inap'}, bukan jenis rawat yang diklaim.` },
      { nilai: (p) => 0.005 * p.C, alasan: () => 'Persentase terbaca 0,5%, bukan 5%.' },
    ],
    konsep: 'Co-payment asuransi kesehatan', kataKunci: '5% dari total pengajuan klaim, dengan batas per jenis rawat',
    langkah: (p) => {
      const lima = 0.05 * p.C;
      const batas = p.inap ? 3 * JT : 300_000;
      return [`5% × ${rp(p.C)} = ${rp(lima)}.`, `Batas ${p.inap ? 'rawat inap' : 'rawat jalan'} ${rp(batas)}; bagian Sinta adalah nilai yang lebih kecil, yaitu ${rp(Math.min(lima, batas))}.`];
    },
    caraCepat: 'Hitung 5% klaim, lalu bandingkan dengan batas jenis rawatnya; ambil yang lebih kecil.',
  },
  {
    id: 'kontribusi', topik: 'prinsip-kontribusi', tingkat: 'menantang', sumber: `${B4} (Pertanggungan Bersama-Sama/Contribution)`,
    set: [
      { a: 500, b: 250, c: 750, L: 600, i: 0 }, { a: 500, b: 250, c: 750, L: 600, i: 2 },
      { a: 400, b: 600, c: 0, L: 250, i: 1 }, { a: 300, b: 200, c: 500, L: 300, i: 1 },
    ],
    pertanyaan: (p) => {
      const np = [p.a, p.b, p.c].filter((x) => x > 0);
      const daftar = np.map((x, k) => `Penanggung ${NAMA[k]} ${rp(x * JT)}`).join(', ');
      return `Sebuah gedung dipertanggungkan pada ${np.length} perusahaan asuransi: ${daftar}. Terjadi kerugian ${rp(p.L * JT)} yang dijamin semua polis. Dengan prinsip kontribusi, bagian ganti rugi yang ditanggung Penanggung ${NAMA[p.i]} adalah ....`;
    },
    hitung: (p) => bagian(p, p.i) * JT, format: rp,
    salah: [
      { nilai: (p) => (p.L / jumlahPenanggung(p)) * JT, alasan: () => 'Kerugian dibagi rata, padahal kontribusi sebanding nilai pertanggungan masing-masing.' },
      { nilai: (p) => np(p)[p.i] * JT, alasan: (p) => `Itu nilai pertanggungan Penanggung ${NAMA[p.i]}, bukan bagian kerugiannya.` },
      { nilai: (p) => p.L * JT, alasan: () => 'Itu seluruh kerugian; penanggung lain ikut menanggung sebanding tanggungannya.' },
      { nilai: (p) => bagian(p, lain(p)[0]) * JT, alasan: (p) => `Itu bagian Penanggung ${NAMA[lain(p)[0]]}.` },
      { nilai: (p) => (lain(p)[1] === undefined ? NaN : bagian(p, lain(p)[1]) * JT), alasan: (p) => `Itu bagian Penanggung ${NAMA[lain(p)[1] ?? 0]}.` },
      { nilai: (p) => (np(p)[p.i] / (total(p) - np(p)[p.i])) * p.L * JT, alasan: () => 'Pembagi seharusnya total nilai pertanggungan seluruh penanggung.' },
    ],
    konsep: 'Prinsip kontribusi', kataKunci: 'satu objek, beberapa penanggung',
    langkah: (p) => [
      `Total nilai pertanggungan = ${rp(total(p) * JT)}.`,
      `Bagian Penanggung ${NAMA[p.i]} = ${rp(np(p)[p.i] * JT)} ÷ ${rp(total(p) * JT)} × ${rp(p.L * JT)} = ${rp(bagian(p, p.i) * JT)}.`,
    ],
    caraCepat: 'Bagian = (nilai pertanggungan sendiri ÷ total nilai pertanggungan) × kerugian.',
  },
  {
    id: 'proporsional', topik: 'prinsip-indemnity', tingkat: 'menantang', sumber: `${B4} (Contoh Penerapan Prinsip Indemnity)`,
    set: [{ V: 100, S: 70, L: 50 }, { V: 200, S: 150, L: 80 }, { V: 500, S: 400, L: 100 }, { V: 80, S: 60, L: 40 }],
    pertanyaan: (p) => `Rumah yang nilai sebenarnya ${rp(p.V * JT)} hanya dipertanggungkan ${rp(p.S * JT)} terhadap risiko kebakaran. Terjadi kebakaran sebagian dengan kerugian ${rp(p.L * JT)}. Polis menerapkan klausul pertanggungan di bawah harga dengan ganti rugi proporsional (nilai pertanggungan ÷ nilai sebenarnya × kerugian); abaikan risiko sendiri dan biaya lain. Pembayaran perusahaan asuransi adalah ....`,
    hitung: (p) => (p.S / p.V) * p.L * JT, format: rp,
    salah: [
      { nilai: (p) => p.L * JT, alasan: () => 'Kerugian diganti penuh, padahal rumah hanya dipertanggungkan sebagian dari nilainya.' },
      { nilai: (p) => p.S * JT, alasan: () => 'Itu nilai pertanggungan; kerugian yang terjadi hanya sebagian.' },
      { nilai: (p) => ((p.V - p.S) / p.V) * p.L * JT, alasan: () => 'Itu bagian kerugian yang menjadi beban tertanggung sendiri.' },
      { nilai: (p) => (p.L - (p.V - p.S)) * JT, alasan: () => 'Selisih nilai dikurangkan langsung; yang benar memakai perbandingan pertanggungan terhadap nilai sebenarnya.' },
      { nilai: (p) => (p.S - p.L) * JT, alasan: () => 'Nilai pertanggungan dikurangi kerugian bukan ganti rugi.' },
    ],
    konsep: 'Indemnity pada pertanggungan di bawah nilai', kataKunci: 'hanya dipertanggungkan sebagian, kebakaran sebagian',
    langkah: (p) => [`Porsi pertanggungan = ${rp(p.S * JT)} ÷ ${rp(p.V * JT)} = ${persen((p.S / p.V) * 100)}.`, `Ganti rugi = ${persen((p.S / p.V) * 100)} × ${rp(p.L * JT)} = ${rp((p.S / p.V) * p.L * JT)}; sisanya ditanggung tertanggung.`],
    caraCepat: 'Ganti rugi = (nilai pertanggungan ÷ nilai sebenarnya) × kerugian.',
  },
  {
    id: 'reasuransi', topik: 'reasuransi', tingkat: 'menengah', sumber: `${EB}, subbab 3.1.2 E`,
    set: [{ K: 10, p: 40, reas: 1 }, { K: 10, p: 40, reas: 0 }, { K: 25, p: 30, reas: 1 }, { K: 8, p: 60, reas: 0 }],
    pertanyaan: (p) => `Total klaim yang disetujui sebuah perusahaan asuransi akibat banjir besar ${rp(p.K * M)}. Kontrak reasuransinya menanggung ${p.p}% dari kerugian yang tercakup, dan seluruh klaim memenuhi syarat kontrak. Bagian yang ${p.reas ? 'diganti perusahaan reasuransi' : 'tetap ditanggung perusahaan asuransi (retensi sendiri)'} adalah ....`,
    hitung: (p) => (p.reas ? p.p : 100 - p.p) / 100 * p.K * M, format: rp,
    salah: [
      { nilai: (p) => (p.reas ? 100 - p.p : p.p) / 100 * p.K * M, alasan: (p) => (p.reas ? 'Itu bagian yang tetap ditanggung perusahaan asuransi.' : 'Itu bagian yang diganti perusahaan reasuransi.') },
      { nilai: (p) => p.K * M, alasan: () => 'Itu seluruh klaim; kontrak hanya mengalihkan sebagian kerugian.' },
      { nilai: (p) => 0.5 * p.K * M, alasan: () => 'Kerugian dibagi dua sama besar, padahal persentase kontrak tidak 50%.' },
      { nilai: (p) => (p.p / 100) * (1 - p.p / 100) * p.K * M, alasan: () => 'Persentase diterapkan dua kali secara keliru.' },
    ],
    konsep: 'Reasuransi dan retensi sendiri', kataKunci: 'persentase kerugian yang ditanggung kontrak reasuransi',
    langkah: (p) => [`Bagian reasuransi = ${p.p}% × ${rp(p.K * M)} = ${rp((p.p / 100) * p.K * M)}.`, `Retensi sendiri = ${rp(p.K * M)} − ${rp((p.p / 100) * p.K * M)} = ${rp(((100 - p.p) / 100) * p.K * M)}.`],
    caraCepat: 'Kalikan total klaim dengan persentase kontrak; sisanya retensi perusahaan.',
  },
  {
    id: 'rasio-solvabilitas', topik: 'kesehatan-keuangan', tingkat: 'menengah', sumber: `${EB}, subbab 3.1.2 H`,
    set: [{ TS: 150, MM: 100 }, { TS: 130, MM: 100 }, { TS: 90, MM: 75 }, { TS: 210, MM: 140 }],
    pertanyaan: (p) => `Tingkat solvabilitas sebuah perusahaan asuransi ${rp(p.TS * M)}, sedangkan Modal Minimum Berbasis Risiko (MMBR)-nya ${rp(p.MM * M)}. Rasio solvabilitas perusahaan tersebut adalah ....`,
    hitung: (p) => (p.TS / p.MM) * 100, format: persen,
    salah: [
      { nilai: (p) => (p.MM / p.TS) * 100, alasan: () => 'Pembilang dan penyebut tertukar; rasio membandingkan tingkat solvabilitas dengan MMBR.' },
      { nilai: (p) => ((p.TS - p.MM) / p.MM) * 100, alasan: () => 'Itu kelebihan di atas MMBR, bukan rasio solvabilitas.' },
      { nilai: (p) => ((p.TS - p.MM) / p.TS) * 100, alasan: () => 'Selisih dibagi tingkat solvabilitas bukan rasio solvabilitas.' },
      { nilai: (p) => (p.TS / (p.TS + p.MM)) * 100, alasan: () => 'Penyebut seharusnya MMBR saja.' },
      { nilai: (p) => p.TS / p.MM, alasan: () => 'Hasil bagi belum dikalikan 100 sehingga belum menjadi persen.' },
    ],
    konsep: 'Rasio solvabilitas (RBC)', kataKunci: 'tingkat solvabilitas dan MMBR',
    langkah: (p) => [`Rasio solvabilitas = ${rp(p.TS * M)} ÷ ${rp(p.MM * M)} × 100% = ${persen((p.TS / p.MM) * 100)}.`],
    caraCepat: 'Solvabilitas ÷ MMBR × 100%.',
  },
];

function np(p: Record<string, number>) { return [p.a, p.b, p.c].filter((x) => x > 0); }
function total(p: Record<string, number>) { return np(p).reduce((s, x) => s + x, 0); }
function jumlahPenanggung(p: Record<string, number>) { return np(p).length; }
function bagian(p: Record<string, number>, i: number) { return (np(p)[i] / total(p)) * p.L; }
function lain(p: Record<string, number>) { return np(p).map((_, k) => k).filter((k) => k !== p.i); }

export const ASURANSI = [
  familyKurasi({
    id: 'PSJK-ASR-FAKTA', nama: 'Asuransi: fakta dan istilah', chapter: 'asuransi', label: 'SHL',
    sumber: `${EB} (contoh soal 4.1–4.10); ${B4}`,
    ringkas: 'Soal fakta langsung seperti contoh soal e-book: para pihak polis, dasar hukum (UU 40/2014 jo. P2SK, POJK 8/2024), lini produk, PAYDI dan nilai tunai, retensi, RBC, LAPS SJK, asuransi sosial/wajib, insurable risk.',
  }, FAKTA),
  familyRelasi({
    id: 'PSJK-ASR-RELASI', nama: 'Asuransi: prinsip, istilah, pelaku (dua arah)', chapter: 'asuransi', label: 'VARIASI',
    sumber: `${B4}; ${EB}, Istilah Dasar dan subbab 3.1.1–3.1.3`,
    ringkas: 'Empat tabel relasi dua arah: enam prinsip asuransi, dua belas istilah polis, jenis usaha dan pelaku (perusahaan asuransi jiwa/umum, reasuransi, agen, pialang asuransi/reasuransi, penilai kerugian), dan istilah asuransi syariah. Pengecoh dari baris lain tabel yang sama.',
  }, TABEL),
  familyKurasi({
    id: 'PSJK-ASR-KASUS', nama: 'Asuransi: penerapan prinsip dan kasus klaim', chapter: 'asuransi', label: 'VARIASI',
    sumber: `${B4}; ${EB}, subbab 3.1.2–3.1.7`,
    ringkas: 'Kasus penerapan enam prinsip, pernyataan majemuk prinsip jiwa/umum, cakupan dan pengecualian klaim, tenggang waktu, masa tunggu, memilih polis, moral hazard/adverse selection, ko-asuransi vs reasuransi, RBC 100%/120%, POJK 36/2025.',
  }, KASUS),
  familyHitung({
    id: 'PSJK-ASR-HITUNG', nama: 'Asuransi: hitungan klaim dan solvabilitas', chapter: 'asuransi', label: 'VARIASI',
    sumber: `${EB}, subbab 3.1.2–3.1.7; ${B4}`,
    ringkas: 'Tujuh template hitung: risiko sendiri, batas manfaat kamar, co-payment POJK 36/2025, kontribusi antarpenanggung, ganti rugi proporsional (pertanggungan di bawah nilai), pembagian reasuransi/retensi, rasio solvabilitas. Pengecoh dari jalur salah hitung.',
  }, HITUNG),
];
