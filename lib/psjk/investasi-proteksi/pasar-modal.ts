import type { ButirKurasi, TabelRelasi } from '../umum';
import { familyKurasi, familyRelasi } from '../umum';
import { P, SUMBER, alasanRelasi, kalimatRelasi, pembuatBaris } from './alat';
import { angka, familyHitung, persen, rp, type TemplateHitung } from './hitung';

// Chapter Pasar Modal (kebutuhan 75 = 6×10 + 3×5). Sumber: OJK Buku Saku Pasar Modal 2023 (bab 1 pelaku, bab 2
// instrumen; teks yang terbaca sampai bagian DINFRA) dan e-book tim "Investasi dan Proteksi – Pasar Modal" (subbab
// 3.1.1–3.1.18, contoh soal 4.1–4.15). Angka yang bergantung aturan (komposisi reksa dana 80%/79%, T+2) diberi
// `berlakuPer`. Ketentuan sensitif yang dapat berubah (tarif PPN/pajak transaksi, masa berlaku izin wakil, batas
// pembubaran reksa dana, minimum RDPT) sengaja tidak dipakai.

const EB = SUMBER.ebPasarModal;
const BS = SUMBER.bspm;
const RD_BERLAKU = 'Buku Saku Pasar Modal 2023 (ketentuan reksa dana yang berlaku saat itu)';

// ─────────────────────────────── SHL: fakta langsung ───────────────────────────────
// QC 2: tanpa batas komposisi 80%/79% (R01) dan tanpa klaim risiko mutlak antarjenis (R07).
const RD_CIRI = {
  saham: 'didominasi efek yang menunjukkan kepemilikan atas perusahaan',
  pt: 'didominasi efek bersifat utang',
  campuran: 'memadukan beberapa kelas aset menurut kebijakan investasinya',
  pu: 'berfokus pada instrumen likuid jangka pendek sesuai ketentuan jenisnya',
};
const RD_NAMA: Record<keyof typeof RD_CIRI, string> = {
  saham: 'reksa dana saham', pt: 'reksa dana pendapatan tetap', campuran: 'reksa dana campuran', pu: 'reksa dana pasar uang',
};
function butirRd(k: keyof typeof RD_CIRI, tambahan: string): ButirKurasi {
  return {
    id: `rd-${k}`, tingkat: 'menengah', topik: 'jenis-reksa-dana', sumber: `${EB}, subbab 3.1.9`,
    pertanyaan: `Portofolio sebuah reksa dana ${RD_CIRI[k]}. Jenis reksa dana itu adalah ....`,
    jawaban: RD_NAMA[k],
    pengecoh: [
      ...(Object.keys(RD_CIRI) as (keyof typeof RD_CIRI)[]).filter((x) => x !== k).map((x) => P(RD_NAMA[x], `Portofolio ${RD_NAMA[x]} ${RD_CIRI[x]}.`)),
      P('Exchange Traded Fund (ETF)', 'ETF dibedakan dari unitnya yang dapat diperdagangkan melalui bursa, bukan dari isi portofolio pada soal.'),
    ],
    konsep: 'Jenis reksa dana menurut fokus portofolionya', kataKunci: RD_CIRI[k],
    alasan: [`Portofolio ${RD_NAMA[k]} ${RD_CIRI[k]}.`, tambahan],
    caraCepat: 'Efek kepemilikan → saham; efek utang → pendapatan tetap; perpaduan → campuran; jangka pendek dan likuid → pasar uang.',
  };
}

const FAKTA: ButirKurasi[] = [
  {
    id: 'definisi-pasar-modal', tingkat: 'dasar', topik: 'pengertian', sumber: `${BS}, bab 1.1; ${EB}, subbab 3.1.1 dan contoh soal 4.1`, berlakuPer: 'UU 8/1995 jo. UU 4/2023 (P2SK)',
    pertanyaan: 'Menurut UU Nomor 8 Tahun 1995 tentang Pasar Modal sebagaimana diubah dengan UU Nomor 4 Tahun 2023, pasar modal adalah bagian dari sistem keuangan yang berkaitan dengan kegiatan ....',
    jawaban: 'penawaran umum dan transaksi efek, pengelolaan investasi, emiten, serta lembaga dan profesi terkait efek',
    pengecoh: [
      P('penghimpunan simpanan masyarakat dan penyaluran kredit kepada dunia usaha secara langsung oleh bank umum dan BPR', 'Itu kegiatan utama perbankan, bukan cakupan pasar modal.'),
      P('pengendalian jumlah uang beredar dan penetapan suku bunga acuan oleh otoritas moneter, yaitu Bank Indonesia', 'Itu fungsi moneter, bukan cakupan pasar modal.'),
      P('penjaminan simpanan nasabah bank serta penanganan bank yang mengalami kegagalan', 'Itu bukan kegiatan pasar modal.'),
      P('penyelenggaraan program jaminan hari tua dan jaminan pensiun bagi seluruh pekerja', 'Itu program jaminan sosial ketenagakerjaan.'),
    ],
    konsep: 'Cakupan kegiatan pasar modal', kataKunci: 'Pasal 1 angka 12 UU Pasar Modal',
    alasan: ['Pasar modal berkaitan dengan (a) penawaran umum dan transaksi efek, (b) pengelolaan investasi, (c) emiten dan perusahaan publik terkait efeknya, serta (d) lembaga dan profesi terkait efek.'],
    caraCepat: 'Kenali kata kunci “efek” dan “pengelolaan investasi”.',
  },
  {
    id: 'fungsi-pasar-modal', tingkat: 'dasar', topik: 'fungsi', sumber: `${BS}, bab 1.1; ${EB}, subbab 3.1.2`,
    pertanyaan: 'Dua fungsi pasar modal bagi perekonomian adalah ....',
    jawaban: 'sarana pendanaan usaha bagi perusahaan dan sarana berinvestasi bagi masyarakat',
    pengecoh: [
      P('sarana penjaminan simpanan nasabah bank dan sarana penyaluran kredit perbankan nasional', 'Penjaminan simpanan dan kredit bukan fungsi pasar modal.'),
      P('sarana penetapan harga efek harian oleh OJK dan sarana penjaminan laba investor', 'Harga terbentuk dari transaksi, dan laba investor tidak dijamin.'),
      P('sarana pencetakan uang dan sarana pengendalian inflasi nasional', 'Itu bukan fungsi pasar modal.'),
      P('sarana penyelenggaraan jaminan sosial dan sarana pembayaran pensiun', 'Itu fungsi lembaga jaminan sosial dan dana pensiun.'),
    ],
    konsep: 'Fungsi pasar modal', kataKunci: 'dua fungsi',
    alasan: ['Pasar modal menjadi sarana pendanaan usaha (perusahaan memperoleh dana dari investor) dan sarana bagi masyarakat untuk berinvestasi pada instrumen keuangan.'],
    caraCepat: 'Pasar modal mempertemukan yang butuh dana (pendanaan) dengan yang punya dana (investasi).',
  },
  butirRd('saham', 'Setiap jenis reksa dana mempunyai risiko berbeda dan nilai unitnya dapat naik atau turun.'),
  butirRd('pt', 'Risiko yang perlu diperhatikan adalah perubahan harga obligasi dan risiko kredit penerbitnya.'),
  butirRd('campuran', 'Risikonya adalah fluktuasi gabungan dari beberapa jenis aset dalam portofolio.'),
  butirRd('pu', 'Risiko yang tetap perlu diperhatikan adalah perubahan tingkat imbal hasil dan risiko kredit.'),
  {
    id: 'etf', tingkat: 'dasar', topik: 'produk', sumber: `${BS}, bab 2.1.5; ${EB}, subbab 3.1.10`,
    pertanyaan: 'Reksa dana yang unit penyertaannya diperdagangkan di bursa efek sehingga dapat dibeli atau dijual secara real time seperti saham disebut ....',
    jawaban: 'Exchange Traded Fund (ETF)',
    pengecoh: [
      P('reksa dana terbuka non-ETF', 'Unit reksa dana terbuka non-ETF dijual kembali kepada reksa dana, bukan diperdagangkan di bursa.'),
      P('Efek Beragun Aset (EBA)', 'EBA adalah efek berbasis kumpulan aset keuangan, bukan reksa dana.'),
      P('Dana Investasi Real Estat (DIRE)', 'DIRE adalah wadah investasi pada aset real estat, bukan reksa dana ETF.'),
      P('reksa dana pasar uang', 'Reksa dana pasar uang dibedakan dari portofolionya, bukan dari perdagangan di bursa.'),
      P('reksa dana campuran', 'Reksa dana campuran dibedakan dari perpaduan asetnya, bukan dari perdagangan unit di bursa.'),
    ],
    konsep: 'Exchange Traded Fund', kataKunci: 'unit penyertaan diperdagangkan di bursa',
    alasan: ['ETF adalah reksa dana yang unit penyertaannya diperdagangkan di bursa efek; pembelian dan penjualannya melalui mekanisme bursa secara real time.'],
    caraCepat: 'Reksa dana + diperdagangkan di bursa = ETF.',
  },
  {
    id: 'bentuk-hukum-rd', tingkat: 'menengah', topik: 'reksa-dana', sumber: `${BS}, bab 2.1.4 A`, berlakuPer: 'UU 8/1995 jo. UU 4/2023 (P2SK)',
    pertanyaan: 'Berdasarkan UU Pasar Modal sebagaimana diubah UU Nomor 4 Tahun 2023, bentuk hukum reksa dana di Indonesia adalah ....',
    jawaban: 'perseroan dan kontrak investasi kolektif',
    pengecoh: [
      P('koperasi dan yayasan', 'Koperasi dan yayasan bukan bentuk hukum reksa dana.'),
      P('perseroan dan firma', 'Firma bukan bentuk hukum reksa dana.'),
      P('kontrak investasi kolektif dan dana pensiun', 'Dana pensiun adalah badan hukum tersendiri, bukan bentuk reksa dana.'),
      P('yayasan dan kontrak investasi kolektif', 'Yayasan bukan bentuk hukum reksa dana.'),
    ],
    konsep: 'Bentuk hukum reksa dana', kataKunci: 'bentuk hukum reksa dana',
    alasan: ['Bentuk hukum reksa dana ada dua: reksa dana berbentuk perseroan dan reksa dana berbentuk kontrak investasi kolektif (KIK).'],
    caraCepat: 'Reksa dana: PT atau KIK.',
  },
  {
    id: 'pasar-tunai', tingkat: 'menengah', topik: 'penyelesaian', sumber: `${EB}, subbab 3.1.12`, berlakuPer: 'ketentuan BEI tentang segmen pasar dan waktu penyelesaian',
    pertanyaan: 'Menurut ketentuan Bursa Efek Indonesia tentang segmen pasar, transaksi saham di pasar tunai diselesaikan pada ....',
    jawaban: 'T+0, yaitu pada hari transaksi itu sendiri',
    pengecoh: [
      P('T+1, yaitu satu hari bursa setelah transaksi', 'Penyelesaian pasar tunai bukan T+1.'),
      P('T+2, yaitu dua hari bursa setelah transaksi', 'T+2 adalah penyelesaian pasar reguler.'),
      P('T+3, yaitu tiga hari bursa setelah transaksi', 'Penyelesaian pasar tunai bukan T+3.'),
      P('waktu yang disepakati para pihak transaksi', 'Penyelesaian menurut kesepakatan adalah ciri pasar negosiasi.'),
    ],
    konsep: 'Segmen pasar dan waktu penyelesaian', kataKunci: 'pasar tunai',
    alasan: ['Pasar reguler diselesaikan T+2, pasar tunai T+0, dan pasar negosiasi mengikuti kesepakatan dan ketentuan segmen pasar.'],
    caraCepat: 'Reguler T+2, tunai T+0, negosiasi sesuai kesepakatan.',
  },
  {
    id: 'peringkat-d', tingkat: 'dasar', topik: 'pemeringkatan', sumber: `${BS}, bab 1.4.6 A.4`,
    pertanyaan: 'Dalam sistem peringkat efek, peringkat terendah yang mencerminkan kondisi gagal bayar (default) adalah ....',
    jawaban: 'D',
    pengecoh: [
      P('BBB', 'BBB masih termasuk kategori layak investasi (investment grade).'),
      P('AAA', 'AAA adalah peringkat tertinggi.'),
      P('A', 'A termasuk kategori layak investasi.'),
      P('BB', 'BB berada di bawah layak investasi, tetapi bukan peringkat terendah.'),
      P('AA', 'AA termasuk kategori layak investasi.'),
    ],
    konsep: 'Peringkat efek', kataKunci: 'peringkat terendah, default',
    alasan: ['Empat kategori tertinggi (AAA, AA, A, BBB) umumnya dianggap layak investasi, sedangkan D adalah peringkat terendah yang mencerminkan kondisi default.'],
    caraCepat: 'D = default.',
  },
  {
    id: 'investment-grade', tingkat: 'menengah', topik: 'pemeringkatan', sumber: `${BS}, bab 1.4.6 A.4 dan 2.1.2 A`,
    pertanyaan: 'Empat kategori peringkat tertinggi yang umumnya dianggap layak investasi (investment grade) adalah ....',
    jawaban: 'AAA, AA, A, dan BBB',
    pengecoh: [
      P('AAA, AA, A, dan BB', 'BB tidak termasuk layak investasi; yang benar BBB.'),
      P('AA, A, BBB, dan BB', 'AAA tertinggal dan BB tidak termasuk layak investasi.'),
      P('AAA, AA, BBB, dan D', 'D adalah peringkat terendah (default).'),
      P('A, BBB, BB, dan B', 'BB dan B tidak termasuk layak investasi.'),
    ],
    konsep: 'Investment grade', kataKunci: 'empat kategori tertinggi',
    alasan: ['Empat kategori tertinggi, yaitu AAA, AA, A, dan BBB, umumnya dianggap layak investasi.'],
    caraCepat: 'Investment grade berhenti di BBB.',
  },
  {
    id: 'pengawas-pm', tingkat: 'dasar', topik: 'pengawas', sumber: `${BS}, bab 1.4`, berlakuPer: 'UU 21/2011 jo. UU 4/2023 (P2SK)',
    pertanyaan: 'Lembaga yang berwenang atas pengaturan dan pengawasan seluruh kegiatan di bidang pasar modal Indonesia adalah ....',
    jawaban: 'Otoritas Jasa Keuangan (OJK)',
    pengecoh: [
      P('Bursa Efek Indonesia (BEI)', 'BEI adalah SRO penyelenggara perdagangan dalam lingkupnya, bukan pengawas seluruh kegiatan.'),
      P('Kliring Penjaminan Efek Indonesia (KPEI)', 'KPEI menyelenggarakan kliring dan penjaminan.'),
      P('Kustodian Sentral Efek Indonesia (KSEI)', 'KSEI menyelenggarakan kustodian sentral dan penyelesaian.'),
      P('Bank Indonesia (BI)', 'BI bukan pengatur dan pengawas pasar modal.'),
    ],
    konsep: 'Pengawas pasar modal', kataKunci: 'pengaturan dan pengawasan seluruh kegiatan pasar modal',
    alasan: ['UU OJK sebagaimana ditegaskan UU P2SK menempatkan OJK sebagai lembaga yang berwenang mengatur dan mengawasi seluruh kegiatan di bidang pasar modal.'],
    caraCepat: 'Regulator = OJK; SRO = BEI, KPEI, KSEI.',
  },
  {
    id: 'sro', tingkat: 'menengah', topik: 'pengawas', sumber: `${BS}, bab 1.4.1; ${EB}, subbab 3.1.4`,
    pertanyaan: 'Lembaga yang termasuk Self-Regulatory Organization (SRO) di pasar modal Indonesia adalah ....',
    jawaban: 'BEI, KPEI, dan KSEI',
    pengecoh: [
      P('OJK, BEI, dan KSEI', 'OJK adalah regulator, bukan SRO.'),
      P('BEI, bank kustodian, dan manajer investasi', 'Bank kustodian dan manajer investasi bukan SRO.'),
      P('KPEI, KSEI, dan agen penjual efek reksa dana', 'APERD bukan SRO.'),
      P('BEI, KPEI, dan emiten', 'Emiten adalah pihak yang menawarkan efek kepada masyarakat, bukan SRO.'),
    ],
    konsep: 'Self-Regulatory Organization', kataKunci: 'SRO',
    alasan: ['SRO melaksanakan kewenangan penerapan aturan di industri pasar modal; SRO terdiri atas Bursa Efek (BEI), Lembaga Kliring dan Penjaminan (KPEI), dan Lembaga Penyimpanan dan Penyelesaian (KSEI).'],
    caraCepat: 'SRO = BEI + KPEI + KSEI.',
  },
];

// ─────────────────────────────── VARIASI: kasus ───────────────────────────────
const KASUS: ButirKurasi[] = [
  {
    id: 'perdana-sekunder', tingkat: 'menengah', topik: 'pasar-perdana-sekunder', sumber: `${EB}, subbab 3.1.3 dan contoh soal 4.2; ${BS}, bab 1.3`,
    pertanyaan: 'PT Rona menawarkan saham baru melalui penawaran umum perdana dan memperoleh dana. Sebulan kemudian, investor A menjual saham itu kepada investor B di bursa. Pernyataan yang tepat adalah ....',
    jawaban: 'dana IPO diterima PT Rona, sedangkan dana transaksi kedua berpindah dari B kepada A',
    pengecoh: [
      P('PT Rona kembali menerima dana dari transaksi jual beli saham antara investor A dan B', 'Di pasar sekunder dana berpindah antarinvestor, tidak masuk ke emiten.'),
      P('transaksi antara A dan B terjadi di pasar perdana karena sahamnya masih baru diterbitkan', 'Saham yang sudah tercatat dan diperjualbelikan antarinvestor adalah transaksi pasar sekunder.'),
      P('penawaran perdana hanya memindahkan saham lama antarinvestor tanpa saham baru', 'Penawaran perdana saham baru berkaitan dengan penghimpunan dana emiten.'),
      P('harga saham pada transaksi kedua ditetapkan oleh PT Rona sebagai emiten', 'Harga di pasar sekunder terbentuk dari permintaan dan penawaran.'),
    ],
    konsep: 'Pasar perdana vs pasar sekunder', kataKunci: 'IPO lalu jual beli antarinvestor',
    alasan: ['Pada pasar perdana, dana hasil penerbitan dihimpun emiten.', 'Pada pasar sekunder, transaksi terjadi antarinvestor sehingga dana dari pembeli berpindah ke penjual.'],
    caraCepat: 'Tanyakan: uang mengalir dari siapa ke siapa?',
  },
  {
    id: 'alur-transaksi', tingkat: 'menengah', topik: 'infrastruktur', sumber: `${EB}, subbab 3.1.4 dan contoh soal 4.3; ${BS}, bab 1.3 B`,
    pertanyaan: 'Pada satu transaksi saham di pasar sekunder, urutan lembaga yang mempertemukan pesanan, melakukan kliring dan penjaminan, lalu memindahbukukan efek dan dana adalah ....',
    jawaban: 'BEI, KPEI, lalu KSEI',
    pengecoh: [
      P('KPEI, BEI, lalu KSEI', 'Pesanan dipertemukan lebih dahulu di BEI, baru kemudian kliring di KPEI.'),
      P('KSEI, KPEI, lalu BEI', 'Urutannya terbalik.'),
      P('OJK, KPEI, lalu KSEI', 'OJK berada di luar urutan operasional; pesanan dipertemukan BEI.'),
      P('BEI, KSEI, lalu KPEI', 'Kliring dan penjaminan (KPEI) mendahului penyelesaian (KSEI).'),
    ],
    konsep: 'Alur transaksi bursa', kataKunci: 'mempertemukan, kliring, memindahbukukan',
    alasan: ['BEI mempertemukan order; KPEI menjalankan kliring dan penjaminan; KSEI memfasilitasi pemindahbukuan efek dan dana. OJK mengatur dan mengawasi, bukan menjalankan transaksi harian.'],
    caraCepat: 'Bursa – Kliring – Penyimpanan = BEI – KPEI – KSEI.',
  },
  {
    id: 'saham-obligasi', tingkat: 'dasar', topik: 'instrumen', sumber: `${EB}, subbab 3.1.6–3.1.7 dan contoh soal 4.4`,
    pertanyaan: 'Pak Arif membeli saham PT Delta, sedangkan Bu Rina membeli obligasi yang diterbitkan PT Delta. Perbandingan kedudukan keduanya yang tepat adalah ....',
    jawaban: 'Pak Arif menjadi pemilik sebagian perusahaan, sedangkan Bu Rina menjadi krediturnya',
    pengecoh: [
      P('Pak Arif menjadi kreditur, sedangkan Bu Rina menjadi pemilik sebagian perusahaan', 'Kedudukannya terbalik.'),
      P('Pak Arif dan Bu Rina sama-sama berhak atas kupon tetap dari PT Delta setiap periode', 'Pemegang saham tidak memperoleh kupon tetap; dividen dibagikan bila diputuskan.'),
      P('Pak Arif dan Bu Rina sama-sama memiliki hak suara dalam RUPS PT Delta', 'Hak suara RUPS melekat pada pemegang saham, bukan pemegang obligasi.'),
      P('Bu Rina hanya memperoleh hasil dari kenaikan harga saham PT Delta di bursa', 'Hak pemegang obligasi bersumber dari ketentuan utang (kupon dan pokok).'),
    ],
    konsep: 'Saham vs obligasi', kataKunci: 'saham dan obligasi penerbit yang sama',
    alasan: ['Saham merepresentasikan penyertaan modal atau kepemilikan.', 'Obligasi adalah efek bersifat utang sehingga pemegangnya berkedudukan sebagai kreditur.'],
    caraCepat: 'Kepemilikan = saham; tagihan utang = obligasi.',
  },
  {
    id: 'hak-saham-kecuali', tingkat: 'menengah', topik: 'saham', sumber: `${BS}, bab 2.1.1`,
    pertanyaan: 'Berikut ini termasuk hak investor sebagai pemegang saham, KECUALI ....',
    jawaban: 'menerima kupon tetap seperti pemegang obligasi',
    pengecoh: [
      P('menerima pembayaran dividen yang dibagikan perusahaan', 'Ini termasuk hak pemegang saham.'),
      P('hadir dan memberikan suara dalam RUPS', 'Ini termasuk hak pemegang saham.'),
      P('memindahkan hak atas saham yang dimilikinya', 'Ini termasuk hak pemegang saham.'),
      P('mengklaim sisa kekayaan hasil likuidasi perusahaan', 'Ini termasuk hak pemegang saham.'),
      P('mengajukan gugatan bila dirugikan oleh tindakan perseroan', 'Ini termasuk hak pemegang saham.'),
    ],
    konsep: 'Hak pemegang saham', kataKunci: 'KECUALI',
    alasan: ['Hak pemegang saham antara lain menerima dividen, memindahkan hak atas saham, hadir dan memberi suara dalam RUPS, mengklaim sisa kekayaan hasil likuidasi, dan mengajukan gugatan.', 'Kupon tetap adalah hak pemegang obligasi, bukan pemegang saham.'],
    caraCepat: 'Kupon = obligasi; dividen = saham.',
  },
  {
    id: 'urutan-likuidasi', tingkat: 'menengah', topik: 'saham', sumber: `${BS}, bab 2.1.1 A`,
    pertanyaan: 'Jika perusahaan dilikuidasi, urutan pihak yang berhak atas hasil likuidasi aset adalah ....',
    jawaban: 'kreditur, pemegang saham preferen, lalu pemegang saham biasa',
    pengecoh: [
      P('pemegang saham biasa, pemegang saham preferen, lalu kreditur', 'Urutannya terbalik; pemegang saham biasa berada di urutan terakhir.'),
      P('pemegang saham preferen, kreditur, lalu pemegang saham biasa', 'Saham preferen dibayar setelah kreditur.'),
      P('kreditur, pemegang saham biasa, lalu pemegang saham preferen', 'Saham preferen didahulukan dari saham biasa.'),
      P('pemegang saham biasa, kreditur, lalu pemegang saham preferen', 'Pemegang saham biasa tidak didahulukan dari kreditur.'),
    ],
    konsep: 'Urutan klaim saat likuidasi', kataKunci: 'hasil likuidasi aset',
    alasan: ['Pemegang saham preferen mendapat hasil likuidasi sebelum pemegang saham biasa tetapi setelah kreditur; pemegang saham biasa berada di urutan terakhir.'],
    caraCepat: 'Utang dulu, preferen kedua, saham biasa terakhir.',
  },
  {
    id: 'pernyataan-efektif', tingkat: 'menantang', topik: 'penawaran-umum', sumber: `${BS}, bab 1.4.7`,
    pertanyaan: 'OJK memberikan pernyataan efektif atas pernyataan pendaftaran penawaran umum suatu emiten. Makna pernyataan efektif tersebut adalah ....',
    jawaban: 'persyaratan pendaftaran telah dipenuhi, tanpa menjamin kebenaran informasinya',
    pengecoh: [
      P('OJK menjamin bahwa seluruh informasi dalam prospektus emiten benar dan cukup', 'Pernyataan efektif bukan berarti OJK menyatakan informasi emiten benar atau cukup.'),
      P('OJK menjamin harga saham emiten tidak akan turun setelah dicatatkan di bursa efek', 'OJK tidak menjamin harga efek.'),
      P('OJK menyatakan efek yang ditawarkan pasti memberikan keuntungan bagi investor', 'Pernyataan efektif tidak berkaitan dengan jaminan keuntungan.'),
      P('emiten terbebas dari kewajiban keterbukaan informasi setelah penawaran umum selesai', 'Emiten tetap wajib menyampaikan informasi sesuai peraturan.'),
    ],
    konsep: 'Pernyataan efektif', kataKunci: 'pernyataan efektif atas pernyataan pendaftaran',
    alasan: ['Pernyataan efektif menunjukkan kelengkapan atau dipenuhinya prosedur dan persyaratan pernyataan pendaftaran.', 'Pernyataan efektif bukan izin penawaran umum dan bukan pernyataan bahwa informasi emiten benar atau cukup.'],
    caraCepat: 'Efektif = administrasi lengkap, bukan stempel kebenaran isi.',
  },
  {
    id: 'sipf', tingkat: 'menengah', topik: 'pelindungan-investor', sumber: `${EB}, subbab 3.1.16 dan contoh soal 4.14`,
    pertanyaan: 'Harga saham milik Tari turun karena kondisi pasar, tanpa bukti pelanggaran oleh perantara. Tari menganggap dana perlindungan pemodal (SIPF) wajib mengganti kerugiannya. Penilaian yang tepat adalah ....',
    jawaban: 'penurunan harga pasar tidak otomatis termasuk cakupan ganti rugi skema perlindungan',
    pengecoh: [
      P('seluruh capital loss Tari otomatis diganti oleh bursa pada hari perdagangan berikutnya', 'Bursa tidak mengganti kerugian karena fluktuasi harga.'),
      P('OJK mengembalikan harga beli awal Tari melalui mekanisme penyelesaian di bursa efek', 'OJK tidak menjamin harga beli investor.'),
      P('emiten wajib memberi kupon kompensasi kepada Tari saat harga sahamnya turun', 'Tidak ada kupon kompensasi atas penurunan harga saham.'),
      P('kerugian Tari selalu dialihkan kepada perusahaan efek tanpa perlu pemeriksaan', 'Tanggung jawab harus dinilai berdasarkan jenis pelanggaran dan fakta.'),
    ],
    konsep: 'Batas pelindungan pemodal', kataKunci: 'harga turun karena pasar, tanpa pelanggaran',
    alasan: ['SIPF memiliki cakupan perlindungan tertentu sesuai ketentuan, bukan jaminan atas fluktuasi harga efek.', 'Kerugian harga biasa harus dibedakan dari kehilangan aset atau pelanggaran hukum.'],
    caraCepat: 'Rugi karena harga pasar ≠ hak klaim otomatis.',
  },
  {
    id: 'klaim-pasti-untung', tingkat: 'dasar', topik: 'pelindungan-investor', sumber: `${EB}, subbab 3.1.16 dan contoh soal 4.15`,
    pertanyaan: 'Sebuah akun media sosial mempromosikan “saham pasti untung” dan mengaku diawasi OJK, tetapi tidak menunjukkan dokumen resmi maupun informasi risiko. Sikap yang paling tepat adalah ....',
    jawaban: 'memeriksa dokumen dan status resmi serta menguji klaim keuntungan pasti',
    pengecoh: [
      P('mempercayainya karena pengawasan OJK berarti harga saham itu tidak dapat turun', 'Status pengawasan bukan jaminan keuntungan.'),
      P('menganggap klaim itu sah karena unggahannya disukai banyak pengguna', 'Popularitas tidak membuktikan legalitas atau kebenaran informasi.'),
      P('segera membeli agar tidak kehilangan keuntungan yang telah dijanjikan akun itu', 'Tekanan untuk segera membeli adalah tanda yang patut diwaspadai.'),
      P('memilihnya karena tidak menyebut risiko sehingga dianggap lebih aman', 'Tidak menyebut risiko justru tanda informasi tidak lengkap.'),
    ],
    konsep: 'Literasi informasi pasar modal', kataKunci: 'pasti untung, mengaku diawasi OJK',
    alasan: ['Informasi harus diverifikasi dari dokumen resmi, status pelaku, risiko produk, dan ketentuan yang berlaku; status izin tidak pernah menjadi jaminan keuntungan.'],
    caraCepat: 'Klaim pasti untung → verifikasi, bukan langsung percaya.',
  },
  {
    id: 'diversifikasi', tingkat: 'dasar', topik: 'risiko', sumber: `${EB}, subbab 3.1.14 dan contoh soal 4.13; ${BS}, bab 2.1.4 D`,
    pertanyaan: 'Seluruh dana Yudi ditempatkan pada satu saham. Ia mempertimbangkan menyebarkan dananya ke beberapa efek dari sektor berbeda. Kesimpulan yang tepat adalah ....',
    jawaban: 'penyebaran itu mengurangi risiko konsentrasi, tetapi tidak menghapus risiko pasar',
    pengecoh: [
      P('penyebaran itu menghapus seluruh risiko harga, termasuk ketika pasar sedang melemah', 'Diversifikasi mengurangi, tetapi tidak menghilangkan risiko.'),
      P('penyebaran itu menjamin nilai investasi Yudi kembali ke harga beli awalnya', 'Tidak ada jaminan pemulihan harga beli.'),
      P('penyebaran hanya bermanfaat jika semua efek yang dipilih berasal dari satu penerbit', 'Diversifikasi justru menyebar ke beberapa penerbit.'),
      P('penyebaran tidak memengaruhi risiko apa pun selama efeknya tercatat di bursa', 'Diversifikasi mengurangi risiko konsentrasi.'),
    ],
    konsep: 'Diversifikasi', kataKunci: 'satu saham, sektor berbeda',
    alasan: ['Diversifikasi menyebarkan investasi agar portofolio tidak bergantung pada satu penerbit; risiko konsentrasi berkurang, tetapi risiko pasar tetap ada.'],
    caraCepat: 'Diversifikasi mengurangi konsentrasi, bukan menjamin bebas rugi.',
  },
  {
    id: 'rd-terbuka', tingkat: 'menengah', topik: 'reksa-dana', sumber: `${BS}, bab 2.1.4 B.1`,
    pertanyaan: 'Ani ingin dapat menjual kembali unit penyertaannya langsung kepada reksa dana kapan saja sesuai ketentuan. Jenis reksa dana berdasarkan sifatnya yang sesuai adalah ....',
    jawaban: 'reksa dana terbuka',
    pengecoh: [
      P('reksa dana tertutup', 'Reksa dana tertutup tidak membeli kembali unit yang telah dijual; penjualannya melalui bursa.'),
      P('Efek Beragun Aset (EBA)', 'EBA bukan jenis reksa dana berdasarkan sifatnya.'),
      P('Dana Investasi Real Estat (DIRE)', 'DIRE bukan jenis reksa dana berdasarkan sifat terbuka/tertutup.'),
      P('obligasi zero coupon', 'Obligasi zero coupon adalah efek utang.'),
      P('sukuk', 'Sukuk adalah efek syariah berbasis aset dasar, bukan jenis reksa dana berdasarkan sifatnya.'),
    ],
    konsep: 'Reksa dana terbuka vs tertutup', kataKunci: 'menjual kembali unit kepada reksa dana',
    alasan: ['Reksa dana terbuka dapat menawarkan dan membeli kembali unit penyertaan yang telah dijual, sehingga lebih likuid daripada reksa dana tertutup.'],
    caraCepat: 'Bisa dijual kembali ke reksa dananya = terbuka.',
  },
  {
    id: 'ihsg', tingkat: 'dasar', topik: 'indikator', sumber: `${EB}, subbab 3.1.13`,
    pertanyaan: 'IHSG naik 1% pada suatu hari perdagangan. Kesimpulan yang tepat adalah ....',
    jawaban: 'pergerakan gabungan saham dalam indeks naik, tetapi tidak semua saham naik',
    pengecoh: [
      P('setiap saham yang tercatat di bursa pasti naik tepat 1% pada hari itu', 'Kenaikan IHSG tidak berarti seluruh saham naik sama besar.'),
      P('OJK telah menetapkan kenaikan harga seluruh saham pada hari perdagangan itu', 'OJK tidak menetapkan harga saham harian.'),
      P('nilai seluruh reksa dana saham di Indonesia pasti naik tepat 1% pada hari itu', 'Nilai reksa dana bergantung pada portofolionya masing-masing.'),
      P('dividen yang dibagikan semua emiten otomatis bertambah 1% pada tahun itu', 'Dividen tidak ditentukan oleh pergerakan IHSG.'),
    ],
    konsep: 'Membaca IHSG', kataKunci: 'IHSG naik',
    alasan: ['IHSG menggambarkan pergerakan kelompok saham dalam cakupan indeks; kenaikannya tidak berarti seluruh saham mengalami kenaikan yang sama.'],
    caraCepat: 'Indeks = gambaran kelompok, bukan setiap saham.',
  },
  {
    id: 'prospektus', tingkat: 'dasar', topik: 'penawaran-umum', sumber: `${EB}, subbab 3.1.11 dan contoh soal 4.11`,
    pertanyaan: 'Dalam proses IPO, calon investor menemukan informasi penggunaan dana, risiko usaha, kondisi keuangan, dan struktur penawaran dalam satu dokumen. Fungsi utama dokumen tersebut adalah ....',
    jawaban: 'menyajikan informasi material untuk menilai penawaran umum',
    pengecoh: [
      P('menjamin harga saham emiten tetap stabil setelah tercatat di bursa', 'Prospektus bukan jaminan harga.'),
      P('memastikan setiap investor menerima dividen setiap bulan', 'Prospektus tidak menjanjikan dividen berkala.'),
      P('menetapkan keuntungan yang sama bagi semua investor IPO', 'Keuntungan investor tidak ditetapkan oleh prospektus.'),
      P('membuktikan bahwa laba emiten tidak mungkin turun di masa depan', 'Prospektus justru memuat risiko usaha.'),
    ],
    konsep: 'Prospektus', kataKunci: 'penggunaan dana, risiko, kondisi keuangan',
    alasan: ['Prospektus memuat informasi material yang perlu dipahami sebelum menilai penawaran: karakteristik efek, risiko usaha, informasi keuangan, penggunaan dana, dan pihak terkait.'],
    caraCepat: 'IPO + dokumen informasi risiko dan penerbit = prospektus.',
  },
  {
    id: 'aperd-kasus', tingkat: 'menengah', topik: 'pelaku', sumber: `${BS}, bab 1.4.3`,
    pertanyaan: 'Bank Sentosa memasarkan unit penyertaan produk investasi kolektif yang dikelola PT Prima Investa (manajer investasi) kepada nasabahnya berdasarkan kontrak kerja sama dengan PT Prima Investa. Dalam kegiatan ini, Bank Sentosa berperan sebagai ....',
    jawaban: 'agen penjual efek reksa dana',
    pengecoh: [
      P('perantara pedagang efek', 'Perantara pedagang efek melakukan jual beli efek untuk kepentingan sendiri atau pihak lain di bursa, bukan memasarkan unit penyertaan berdasarkan kontrak dengan MI.'),
      P('bank kustodian', 'Bank kustodian menyimpan dan mengadministrasikan aset, bukan memasarkan produk.'),
      P('penjamin emisi efek', 'Penjamin emisi membantu penawaran umum emiten.'),
      P('lembaga kliring dan penjaminan', 'Lembaga kliring dan penjaminan (KPEI) menjalankan kliring dan penjaminan transaksi bursa.'),
      P('lembaga penyimpanan dan penyelesaian', 'Lembaga penyimpanan dan penyelesaian (KSEI) menyelenggarakan kustodian sentral dan penyelesaian transaksi.'),
      P('biro administrasi efek', 'Biro administrasi efek mencatat kepemilikan efek dan pembagian hak berdasarkan kontrak dengan emiten.'),
    ],
    konsep: 'Peran APERD', kataKunci: 'memasarkan unit penyertaan berdasarkan kontrak kerja sama dengan MI',
    alasan: ['APERD melakukan penjualan efek reksa dana berdasarkan kontrak kerja sama dengan manajer investasi; bank umum termasuk pihak yang dapat menjadi APERD.'],
    caraCepat: 'Memasarkan reksa dana yang dikelola MI lain berdasarkan kontrak = APERD.',
  },
  {
    id: 'wali-amanat', tingkat: 'menengah', topik: 'pelaku', sumber: `${BS}, bab 1.4.6 A.3`,
    pertanyaan: 'Para pemegang obligasi PT Bumi memerlukan pihak yang mewakili kepentingan mereka, termasuk menuntut hak di dalam maupun di luar pengadilan tanpa surat kuasa khusus. Pihak tersebut adalah ....',
    jawaban: 'wali amanat',
    pengecoh: [
      P('biro administrasi efek', 'BAE mencatat kepemilikan efek dan pembagian hak.'),
      P('perusahaan pemeringkat efek', 'Pemeringkat memberi opini kemampuan bayar.'),
      P('penasihat investasi', 'Penasihat investasi memberi nasihat jual beli efek.'),
      P('manajer investasi', 'Manajer investasi mengelola portofolio efek.'),
      P('notaris', 'Notaris membuat akta otentik, bukan mewakili kepentingan pemegang obligasi.'),
      P('penilai', 'Penilai menaksir nilai properti, badan usaha, atau instrumen keuangan.'),
    ],
    konsep: 'Wali amanat', kataKunci: 'mewakili kepentingan pemegang obligasi',
    alasan: ['Wali amanat mewakili kepentingan pemegang efek bersifat utang/sukuk, termasuk menuntut hak di dalam maupun di luar pengadilan tanpa surat kuasa khusus.'],
    caraCepat: 'Wakil para pemegang obligasi = wali amanat.',
  },
  {
    id: 'oversubscribed', tingkat: 'menengah', topik: 'penawaran-umum', sumber: `${BS}, bab 1.3 A`,
    pertanyaan: 'Dalam suatu IPO, saham yang ditawarkan 100 juta lembar, sedangkan total pesanan investor 150 juta lembar. Akibat yang tepat adalah ....',
    jawaban: 'dilakukan penjatahan, lalu dana pesanan yang tidak terpenuhi dikembalikan',
    pengecoh: [
      P('emiten wajib menerbitkan 50 juta saham tambahan pada hari yang sama', 'Jumlah saham yang ditawarkan sudah ditentukan sebelumnya.'),
      P('seluruh pesanan investor tetap dipenuhi secara penuh sesuai jumlah pesanan', 'Saat oversubscribed, tidak semua pesanan dapat dipenuhi.'),
      P('harga saham perdana otomatis dinaikkan OJK sebesar kelebihan permintaan', 'Harga di pasar perdana sudah ditetapkan sebelum penawaran.'),
      P('pesanan yang tidak terpenuhi dialihkan menjadi pembelian obligasi emiten', 'Tidak ada pengalihan menjadi obligasi.'),
    ],
    konsep: 'Oversubscribed dan penjatahan', kataKunci: 'pesanan melebihi saham yang ditawarkan',
    alasan: ['Saat oversubscribed, dilakukan penjatahan; investor yang mendapat lebih sedikit dari pesanannya menerima pengembalian kelebihan dana (refund).'],
    caraCepat: 'Pesanan > penawaran → penjatahan + refund.',
  },
  {
    id: 'majemuk-sro', tingkat: 'menantang', topik: 'infrastruktur', sumber: `${EB}, subbab 3.1.4; ${BS}, bab 1.4.1`,
    pertanyaan: 'Perhatikan pernyataan berikut.\n(1) KPEI menjalankan kliring dan penjaminan penyelesaian transaksi bursa.\n(2) KSEI menyelenggarakan kustodian sentral dan penyelesaian transaksi efek.\n(3) OJK mempertemukan order beli dan jual saham setiap hari.\n(4) BEI menjamin harga saham akan naik.\nPernyataan yang benar adalah ....',
    jawaban: '(1) dan (2)',
    pengecoh: [
      P('(1) dan (3)', 'Pernyataan (3) salah: order dipertemukan oleh sistem BEI.'),
      P('(2) dan (4)', 'Pernyataan (4) salah: BEI tidak menjamin harga saham.'),
      P('(3) dan (4)', 'Kedua pernyataan salah.'),
      P('(1), (2), dan (3)', 'Pernyataan (3) salah.'),
      P('(1), (2), dan (4)', 'Pernyataan (4) salah.'),
    ],
    konsep: 'Fungsi infrastruktur pasar modal', kataKunci: 'KPEI, KSEI, OJK, BEI',
    alasan: ['KPEI = kliring dan penjaminan; KSEI = kustodian sentral dan penyelesaian.', 'OJK mengatur dan mengawasi, dan BEI menyelenggarakan sarana perdagangan tanpa menjamin harga.'],
    caraCepat: 'Uji tiap pernyataan dengan fungsi tiap lembaga; buang yang berisi “menjamin harga”.',
  },
  {
    id: 'non-investment-grade', tingkat: 'menengah', topik: 'obligasi', sumber: `${BS}, bab 2.1.2 A.4`,
    pertanyaan: 'Obligasi berperingkat non-investment grade umumnya menawarkan kupon lebih tinggi. Alasan yang tepat adalah ....',
    jawaban: 'kupon tinggi menjadi kompensasi atas risiko gagal bayar yang lebih tinggi',
    pengecoh: [
      P('peringkat rendah berarti OJK menjamin pembayaran kupon obligasi tersebut', 'OJK tidak menjamin kupon obligasi.'),
      P('kupon tinggi menunjukkan bahwa risiko gagal bayar penerbitnya paling rendah', 'Non-investment grade justru memiliki kemungkinan gagal bayar tinggi.'),
      P('peringkat obligasi sama sekali tidak berkaitan dengan risiko gagal bayar penerbit', 'Peringkat mencerminkan probabilitas pembayaran dan kemungkinan gagal bayar.'),
      P('obligasi non-investment grade bebas dari risiko likuiditas dan risiko pasar', 'Obligasi tetap memiliki risiko likuiditas dan risiko pasar.'),
    ],
    konsep: 'Peringkat dan kupon obligasi', kataKunci: 'non-investment grade, kupon tinggi',
    alasan: ['Obligasi non-investment grade memiliki kemungkinan gagal bayar tinggi; sebagai kompensasi, kuponnya tinggi.'],
    caraCepat: 'Risiko lebih tinggi → kupon lebih tinggi sebagai kompensasi.',
  },
];

// ─────────────────────────────── VARIASI: relasi ───────────────────────────────
const bL = pembuatBaris(`${EB}, subbab 3.1.4–3.1.5`);
const bIn = pembuatBaris(`${EB}, subbab 3.1.6–3.1.10`);
const bIs = pembuatBaris(`${EB}, subbab 3.1.3–3.1.16`);

// QC 2 R01: BAE, wali amanat, perusahaan pemeringkat, penasihat investasi, DINFRA, tipe saham/obligasi, sinking fund, dan
// oversubscribed tidak diajarkan di materi folder, jadi tabel disusun ulang dari subbab 3.1.3–3.1.16.
const TABEL_PELAKU: TabelRelasi[] = [
  {
    id: 'lembaga', topik: 'pelaku',
    tanyaNilai: (s) => `Dalam ekosistem pasar modal Indonesia, ${s} berperan sebagai ....`,
    tanyaSubjek: (n) => `Dalam ekosistem pasar modal Indonesia, pihak yang berperan sebagai ${n} adalah ....`,
    alasanSalah: (b, x, arah) => (arah === 'nilai' ? `Uraian itu adalah peran ${x.subjek}, bukan ${b.subjek}.` : `${x.subjek.charAt(0).toUpperCase() + x.subjek.slice(1)} berperan sebagai ${x.nilai}.`),
    kalimat: (b) => `${b.subjek.charAt(0).toUpperCase() + b.subjek.slice(1)} berperan sebagai ${b.nilai}.`,
    konsep: 'Pengawas (OJK), infrastruktur (BEI, KPEI, KSEI), dan pihak penunjang pasar modal',
    caraCepat: 'Ingat satu fungsi inti per pihak: OJK mengawasi, BEI mempertemukan pesanan, KPEI kliring dan penjaminan, KSEI penyimpanan dan penyelesaian, MI mengelola, bank kustodian menyimpan, APERD menjual.',
    baris: [
      bL('ojk', 'Otoritas Jasa Keuangan (OJK)', 'regulator dan pengawas kegiatan pasar modal'),
      bL('bei', 'Bursa Efek Indonesia (BEI)', 'penyelenggara sistem dan sarana perdagangan efek'),
      bL('kpei', 'Kliring Penjaminan Efek Indonesia (KPEI)', 'pelaksana kliring dan penjaminan penyelesaian transaksi bursa'),
      bL('ksei', 'Kustodian Sentral Efek Indonesia (KSEI)', 'penyedia layanan penyimpanan dan penyelesaian efek secara terpusat'),
      bL('emiten', 'emiten', 'pihak yang melakukan penawaran umum efek'),
      bL('pee', 'penjamin emisi efek', 'pembantu proses penawaran efek emiten berdasarkan perjanjian', 'menengah'),
      bL('ppe', 'perantara pedagang efek', 'pelaku perdagangan efek untuk kepentingan sendiri atau nasabah', 'menengah'),
      bL('mi', 'manajer investasi', 'pengelola portofolio efek untuk nasabah atau investasi kolektif'),
      bL('bk', 'bank kustodian', 'pelaksana penyimpanan dan administrasi aset investasi yang dititipkan', 'menengah'),
      bL('aperd', 'Agen Penjual Efek Reksa Dana (APERD)', 'penyalur penjualan produk reksa dana kepada investor', 'menengah'),
    ],
  },
];

const TABEL_ISTILAH: TabelRelasi[] = [
  {
    id: 'instrumen', topik: 'instrumen',
    tanyaNilai: (s) => `Sebagai instrumen pasar modal, ${s} adalah ....`,
    tanyaSubjek: (n) => `Di pasar modal, ${n} disebut ....`,
    alasanSalah: alasanRelasi, kalimat: kalimatRelasi, konsep: 'Instrumen dan produk investasi pasar modal',
    caraCepat: 'Kenali objek haknya: kepemilikan (saham), utang (obligasi), aset/kegiatan syariah (sukuk), portofolio efek (reksa dana), unit di bursa (ETF), kumpulan aset keuangan (EBA), real estat (DIRE), aset acuan (derivatif).',
    baris: [
      bIn('saham', 'saham', 'bukti penyertaan modal atau kepemilikan pada perusahaan'),
      bIn('obligasi', 'obligasi', 'efek bersifat utang yang menjadikan pemegangnya kreditur penerbit'),
      bIn('sukuk', 'sukuk', 'efek syariah yang mewakili bagian kepentingan atas aset, proyek, atau kegiatan usaha yang mendasari', 'menengah'),
      bIn('rd', 'reksa dana', 'wadah penghimpunan dana pemodal yang diinvestasikan manajer investasi dalam portofolio efek'),
      bIn('etf', 'Exchange Traded Fund (ETF)', 'produk investasi kolektif yang unitnya dapat diperdagangkan melalui bursa', 'menengah'),
      bIn('eba', 'Efek Beragun Aset (EBA)', 'produk berbasis kumpulan aset keuangan yang mendasarinya', 'menengah'),
      bIn('dire', 'Dana Investasi Real Estat (DIRE)', 'wadah investasi kolektif yang terkait aset real estat', 'menengah'),
      bIn('derivatif', 'instrumen derivatif', 'instrumen yang nilainya berkaitan dengan aset atau indikator dasar tertentu', 'menengah'),
    ],
  },
  {
    id: 'istilah', topik: 'istilah',
    tanyaNilai: (s) => `Dalam kegiatan pasar modal, istilah ${s} berarti ....`,
    tanyaSubjek: (n) => `Dalam kegiatan pasar modal, ${n} disebut ....`,
    alasanSalah: alasanRelasi, kalimat: kalimatRelasi, konsep: 'Istilah penawaran, perdagangan, dan imbal hasil',
    caraCepat: 'Pisahkan istilah pasar (perdana/sekunder), penawaran (prospektus, e-IPO), saham (dividen, gain/loss, RUPS, stock split), obligasi (kupon, nominal, jatuh tempo), reksa dana (NAB), dan pelindungan (SIPF).',
    baris: [
      bIs('perdana', 'pasar perdana', 'tahap ketika efek ditawarkan kepada investor dalam proses penerbitan'),
      bIs('sekunder', 'pasar sekunder', 'tempat efek yang telah beredar diperdagangkan antarinvestor'),
      bIs('prospektus', 'prospektus', 'dokumen informasi material penawaran, termasuk risiko usaha dan penggunaan dana'),
      bIs('eipo', 'e-IPO', 'sistem elektronik yang mendukung pelaksanaan penawaran umum tertentu', 'menengah'),
      bIs('nab', 'Nilai Aktiva Bersih (NAB)', 'nilai bersih aset reksa dana setelah dikurangi kewajiban', 'menengah'),
      bIs('cg', 'capital gain', 'selisih positif antara harga jual dan harga beli'),
      bIs('cl', 'capital loss', 'selisih negatif antara harga jual dan harga beli'),
      bIs('dividen', 'dividen', 'bagian laba yang dibagikan kepada pemegang saham sesuai keputusan yang sah'),
      bIs('rups', 'RUPS', 'rapat tempat pemegang saham hadir dan memberikan suara', 'menengah'),
      bIs('split', 'stock split', 'pemecahan nilai nominal saham sebagai aksi korporasi', 'menengah'),
      bIs('kupon', 'kupon', 'bunga obligasi yang dihitung dari nilai nominalnya'),
      bIs('nominal', 'nilai nominal obligasi', 'nilai pokok obligasi yang menjadi dasar perhitungan kupon', 'menengah'),
      bIs('jatuh-tempo', 'jatuh tempo', 'saat pokok obligasi dilunasi menurut syarat efek'),
      bIs('diversifikasi', 'diversifikasi', 'penyebaran investasi ke beberapa instrumen agar tidak bergantung pada satu penerbit'),
      bIs('ihsg', 'Indeks Harga Saham Gabungan (IHSG)', 'ukuran yang menggambarkan pergerakan kelompok saham dalam cakupannya'),
      bIs('sipf', 'Dana Perlindungan Pemodal (SIPF)', 'skema pelindungan pemodal menurut cakupannya yang bukan jaminan atas rugi karena harga turun', 'menengah'),
      bIs('scf', 'securities crowdfunding (SCF)', 'urun dana berbasis penawaran efek melalui penyelenggara sesuai peraturan', 'menengah'),
    ],
  },
];


// ─────────────────────────────── QC 2 R01: butir pengganti dari materi folder (subbab 3.1.2–3.1.17) ───────────────────────────────
const RISIKO_NAMA = ['risiko pasar', 'risiko kredit', 'risiko likuiditas', 'risiko konsentrasi', 'risiko operasional'] as const;
const RISIKO_URAI: Record<(typeof RISIKO_NAMA)[number], string> = {
  'risiko pasar': 'berkaitan dengan perubahan harga efek',
  'risiko kredit': 'berkaitan dengan gagal bayar penerbit',
  'risiko likuiditas': 'berkaitan dengan sulitnya bertransaksi pada harga wajar',
  'risiko konsentrasi': 'berkaitan dengan dana yang bertumpu pada satu penerbit',
  'risiko operasional': 'berkaitan dengan gangguan proses atau sistem',
};
function butirRisiko(id: string, nama: (typeof RISIKO_NAMA)[number], kejadian: string, cepat: string): ButirKurasi {
  return {
    id: `risiko-${id}`, tingkat: 'dasar', topik: 'risiko', sumber: `${EB}, subbab 3.1.14`,
    pertanyaan: `${kejadian} Risiko yang paling langsung tampak pada keadaan itu adalah ....`,
    jawaban: nama,
    pengecoh: RISIKO_NAMA.filter((x) => x !== nama).map((x) => P(x, `${x.charAt(0).toUpperCase() + x.slice(1)} ${RISIKO_URAI[x]}.`)),
    konsep: 'Jenis risiko pasar modal', kataKunci: RISIKO_URAI[nama],
    alasan: [`${nama.charAt(0).toUpperCase() + nama.slice(1)} ${RISIKO_URAI[nama]}, sesuai dengan keadaan pada soal.`],
    caraCepat: cepat,
  };
}

const TAMBAHAN_FAKTA: ButirKurasi[] = [
  {
    id: 'pasar-uang-vs-modal', tingkat: 'dasar', topik: 'fungsi', sumber: `${EB}, subbab 3.1.2`,
    pertanyaan: 'Perbedaan umum antara pasar uang dan pasar modal adalah ....',
    jawaban: 'pasar uang berfokus pada kebutuhan dana jangka pendek, pasar modal pada pendanaan dan investasi lewat efek',
    pengecoh: [
      P('pasar uang hanya memperdagangkan saham, pasar modal hanya memperdagangkan uang kertas', 'Saham adalah instrumen pasar modal, dan pasar modal tidak memperdagangkan uang kertas.'),
      P('pasar uang menjamin keuntungan, sedangkan pasar modal menjamin pengembalian pokok', 'Keduanya tidak menjamin keuntungan maupun pokok.'),
      P('pasar uang diawasi bursa, sedangkan pasar modal tidak memiliki pengawas', 'Kegiatan pasar modal diatur dan diawasi OJK.'),
      P('pasar uang untuk perusahaan besar saja, pasar modal untuk perorangan saja', 'Pembedanya fungsi dan jangka waktu, bukan jenis pelakunya.'),
    ],
    konsep: 'Pasar uang dan pasar modal', kataKunci: 'jangka pendek, pendanaan dan investasi',
    alasan: ['Pasar uang lazim dipakai untuk likuiditas dan pendanaan jangka pendek; pasar modal berkaitan dengan pendanaan dan investasi melalui efek.'],
    caraCepat: 'Dana dekat → pasar uang; pendanaan/investasi lewat efek → pasar modal.',
  },
  {
    id: 'segmen-reguler', tingkat: 'menengah', topik: 'penyelesaian', sumber: `${EB}, subbab 3.1.12`, berlakuPer: 'ketentuan BEI tentang segmen pasar dan waktu penyelesaian',
    pertanyaan: 'Segmen pasar di BEI yang penyelesaiannya dua hari bursa setelah hari transaksi (T+2) adalah ....',
    jawaban: 'pasar reguler',
    pengecoh: [
      P('pasar tunai', 'Pasar tunai diselesaikan pada hari transaksi (T+0).'),
      P('pasar negosiasi', 'Pasar negosiasi diselesaikan menurut kesepakatan dan ketentuan segmen pasarnya.'),
      P('pasar perdana', 'Pasar perdana adalah tahap penawaran efek, bukan segmen perdagangan di bursa.'),
      P('pasar uang', 'Pasar uang bukan segmen perdagangan saham di BEI.'),
    ],
    konsep: 'Penyelesaian menurut segmen pasar', kataKunci: 'T+2',
    alasan: ['Pasar reguler BEI diselesaikan T+2, yakni dua hari bursa setelah transaksi.'],
    caraCepat: 'Reguler T+2; tunai T+0; negosiasi menurut kesepakatan.',
  },
  {
    id: 'segmen-negosiasi', tingkat: 'menengah', topik: 'penyelesaian', sumber: `${EB}, subbab 3.1.12`, berlakuPer: 'ketentuan BEI tentang segmen pasar dan waktu penyelesaian',
    pertanyaan: 'Penyelesaian transaksi di pasar negosiasi BEI dilakukan ....',
    jawaban: 'menurut kesepakatan dan ketentuan segmen pasar tersebut',
    pengecoh: [
      P('selalu pada hari transaksi itu juga', 'T+0 berlaku untuk pasar tunai.'),
      P('selalu dua hari bursa setelah transaksi', 'T+2 berlaku untuk pasar reguler.'),
      P('setelah perusahaan membagikan dividen', 'Pembagian dividen tidak menentukan penyelesaian transaksi.'),
      P('setelah harga saham kembali ke harga beli', 'Penyelesaian transaksi tidak menunggu pergerakan harga.'),
    ],
    konsep: 'Penyelesaian menurut segmen pasar', kataKunci: 'pasar negosiasi',
    alasan: ['Pasar negosiasi mengikuti mekanisme kesepakatan dan ketentuan yang terkait dengan segmen itu.'],
    caraCepat: 'Negosiasi = kesepakatan.',
  },
  {
    id: 'pojk-33', tingkat: 'menengah', topik: 'regulasi', sumber: `${EB}, subbab 3.1.17`, berlakuPer: 'POJK 33 Tahun 2024',
    pertanyaan: 'Peraturan OJK yang menyangkut pengembangan dan penguatan pengelolaan investasi di pasar modal adalah ....',
    jawaban: 'POJK 33 Tahun 2024',
    pengecoh: [
      P('POJK 32 Tahun 2024', 'POJK 32 Tahun 2024 mengatur pengembangan dan penguatan transaksi serta lembaga efek.'),
      P('POJK 39 Tahun 2024', 'POJK 39 Tahun 2024 mengatur sektor pergadaian.'),
      P('POJK 22 Tahun 2023', 'POJK 22 Tahun 2023 mengatur pelindungan konsumen dan masyarakat.'),
      P('POJK 46 Tahun 2024', 'POJK 46 Tahun 2024 mengatur perusahaan pembiayaan.'),
    ],
    konsep: 'Kerangka regulasi pasar modal', kataKunci: 'pengelolaan investasi',
    alasan: ['POJK 33 Tahun 2024 menyangkut pengembangan dan penguatan pengelolaan investasi di pasar modal.'],
    caraCepat: '32 = transaksi dan lembaga efek; 33 = pengelolaan investasi.',
  },
  {
    id: 'pojk-32', tingkat: 'menengah', topik: 'regulasi', sumber: `${EB}, subbab 3.1.17`, berlakuPer: 'POJK 32 Tahun 2024',
    pertanyaan: 'POJK 32 Tahun 2024 mengatur pengembangan dan penguatan ....',
    jawaban: 'transaksi dan lembaga efek',
    pengecoh: [
      P('pengelolaan investasi di pasar modal', 'Pengelolaan investasi diatur POJK 33 Tahun 2024.'),
      P('perusahaan pembiayaan', 'Perusahaan pembiayaan diatur POJK 46 Tahun 2024.'),
      P('kegiatan usaha pergadaian', 'Pergadaian diatur POJK 39 Tahun 2024.'),
      P('pelindungan konsumen jasa keuangan', 'Pelindungan konsumen diatur POJK 22 Tahun 2023.'),
    ],
    konsep: 'Kerangka regulasi pasar modal', kataKunci: 'POJK 32 Tahun 2024',
    alasan: ['POJK 32 Tahun 2024 mengatur pengembangan dan penguatan transaksi serta lembaga efek.'],
    caraCepat: '32 = transaksi dan lembaga efek; 33 = pengelolaan investasi.',
  },
];

const TAMBAHAN_KASUS: ButirKurasi[] = [
  butirRisiko('pasar', 'risiko pasar', 'Sesudah saham dibeli, harganya turun karena kondisi bisnis dan perekonomian berubah.', 'Harga berubah karena kondisi pasar → risiko pasar.'),
  butirRisiko('kredit', 'risiko kredit', 'Penerbit obligasi tidak mampu membayar kupon dan pokok sesuai jadwal.', 'Penerbit tidak membayar → risiko kredit.'),
  butirRisiko('likuiditas', 'risiko likuiditas', 'Investor ingin menjual efeknya, tetapi hampir tidak ada pembeli pada harga yang wajar.', 'Sulit dijual → risiko likuiditas.'),
  butirRisiko('konsentrasi', 'risiko konsentrasi', 'Seluruh dana investor ditempatkan pada saham satu perusahaan.', 'Semua dana di satu penerbit → risiko konsentrasi.'),
  {
    id: 'stock-split', tingkat: 'menengah', topik: 'aksi-korporasi', sumber: `${EB}, subbab 3.1.13`,
    pertanyaan: 'Sebuah emiten melakukan stock split sehingga jumlah lembar saham milik Rani bertambah, sedangkan harga teoretis per lembarnya turun. Kesimpulan yang tepat adalah ....',
    jawaban: 'kekayaan Rani tidak otomatis bertambah hanya karena jumlah lembarnya bertambah',
    pengecoh: [
      P('kekayaan Rani pasti berlipat karena jumlah lembarnya bertambah', 'Harga per lembar ikut menyesuaikan, jadi nilai ekonominya tidak otomatis berlipat.'),
      P('Rani berubah dari pemegang saham menjadi kreditur emiten', 'Stock split tidak mengubah saham menjadi utang.'),
      P('emiten menerima dana baru sebesar tambahan lembar saham', 'Stock split memecah nilai nominal, bukan menjual saham baru.'),
      P('harga saham di bursa sejak saat itu ditetapkan OJK', 'Harga terbentuk dari transaksi; OJK tidak menetapkan harga saham.'),
    ],
    konsep: 'Aksi korporasi dan nilai ekonomi', kataKunci: 'stock split',
    alasan: ['Perubahan jumlah saham atau harga teoretis akibat aksi korporasi tidak otomatis menambah kekayaan investor secara proporsional.'],
    caraCepat: 'Lembar naik, harga per lembar turun → nilai tidak otomatis naik.',
  },
  {
    id: 'mi-bk-aperd', tingkat: 'menengah', topik: 'pelaku', sumber: `${EB}, subbab 3.1.5`,
    pertanyaan: 'Dalam sebuah reksa dana, PT A memutuskan komposisi portofolio, Bank B menyimpan dan mengadministrasikan asetnya, dan PT C memasarkan produknya. Peran A, B, dan C berturut-turut adalah ....',
    jawaban: 'manajer investasi, bank kustodian, dan APERD',
    pengecoh: [
      P('bank kustodian, manajer investasi, dan APERD', 'Yang mengelola portofolio adalah manajer investasi (A), bukan bank kustodian.'),
      P('APERD, bank kustodian, dan manajer investasi', 'Peran A dan C tertukar.'),
      P('manajer investasi, APERD, dan bank kustodian', 'Peran B dan C tertukar.'),
      P('emiten, penjamin emisi efek, dan perantara pedagang efek', 'Ketiganya pihak dalam penawaran dan perdagangan efek, bukan pengelolaan reksa dana.'),
    ],
    konsep: 'Pihak dalam pengelolaan investasi kolektif', kataKunci: 'mengelola, menyimpan, menjual',
    alasan: ['Manajer investasi mengelola portofolio, bank kustodian menyimpan dan mengadministrasikan aset, dan APERD menyalurkan penjualan.'],
    caraCepat: 'Kelola → MI; simpan → bank kustodian; jual → APERD.',
  },
  {
    id: 'pee-ppe', tingkat: 'menengah', topik: 'pelaku', sumber: `${EB}, subbab 3.1.5`,
    pertanyaan: 'Sebuah perusahaan efek membantu PT Laras menawarkan saham perdananya, lalu pada hari lain menjalankan pesanan jual nasabah di bursa. Dua kegiatan itu berturut-turut adalah kegiatan ....',
    jawaban: 'penjamin emisi efek dan perantara pedagang efek',
    pengecoh: [
      P('perantara pedagang efek dan penjamin emisi efek', 'Urutannya tertukar: membantu penawaran adalah penjamin emisi.'),
      P('manajer investasi dan bank kustodian', 'Tidak ada pengelolaan portofolio atau penyimpanan aset pada kasus.'),
      P('penjamin emisi efek dan manajer investasi', 'Menjalankan pesanan nasabah adalah kegiatan perantara pedagang efek.'),
      P('lembaga kliring dan kustodian sentral', 'Kliring dan kustodian sentral adalah infrastruktur pasar, bukan kegiatan perusahaan efek.'),
    ],
    konsep: 'Dua fungsi perusahaan efek', kataKunci: 'membantu penawaran, menjalankan pesanan',
    alasan: ['Penjamin emisi efek membantu proses penawaran; perantara pedagang efek menjalankan perdagangan untuk sendiri atau nasabah.'],
    caraCepat: 'Penawaran → penjamin emisi; jual beli di bursa → perantara.',
  },
  {
    id: 'sukuk-bukan-obligasi', tingkat: 'menengah', topik: 'instrumen', sumber: `${EB}, subbab 3.1.8`,
    pertanyaan: 'Pernyataan yang tepat untuk membedakan sukuk dan obligasi konvensional adalah ....',
    jawaban: 'sukuk mewakili kepentingan atas aset atau kegiatan yang mendasari sesuai akad, obligasi adalah utang penerbit',
    pengecoh: [
      P('sukuk sama dengan obligasi, hanya bunganya diganti nama menjadi margin', 'Sukuk bukan obligasi yang sekadar diganti istilah bunganya.'),
      P('sukuk menjamin keuntungan tetap, sedangkan obligasi tidak menjanjikan apa pun', 'Sukuk tidak menjamin keuntungan; imbalannya bergantung pada akad dan dokumen penerbitan.'),
      P('sukuk menunjukkan kepemilikan atas perusahaan, sedangkan obligasi kepemilikan atas aset', 'Kepemilikan perusahaan adalah saham; obligasi adalah hubungan utang.'),
      P('sukuk tidak memiliki risiko penerbit, sedangkan obligasi memiliki risiko gagal bayar', 'Investor sukuk tetap menghadapi risiko penerbit dan aset yang mendasari.'),
    ],
    konsep: 'Sukuk dan obligasi', kataKunci: 'aset atau kegiatan yang mendasari',
    alasan: ['Sukuk merepresentasikan bagian kepentingan atas aset, proyek, atau kegiatan usaha sesuai akad; obligasi merupakan efek bersifat utang.'],
    caraCepat: 'Ada aset/kegiatan dan akad → sukuk; hubungan utang → obligasi.',
  },
  {
    id: 'scf-bukan-donasi', tingkat: 'dasar', topik: 'produk', sumber: `${EB}, subbab 3.1.15`,
    pertanyaan: 'Pernyataan yang tepat mengenai securities crowdfunding (SCF) adalah ....',
    jawaban: 'urun dana berbasis penawaran efek melalui penyelenggara, bukan sekadar donasi',
    pengecoh: [
      P('pengumpulan donasi tanpa hak apa pun bagi penyumbangnya', 'SCF berbasis penawaran efek, jadi bukan sekadar donasi.'),
      P('pembelian saham emiten yang sudah tercatat di bursa efek', 'SCF tidak dapat disamakan dengan pembelian saham di bursa.'),
      P('simpanan berjangka di bank yang dijamin oleh negara', 'SCF bukan simpanan bank.'),
      P('kredit tanpa agunan dari perusahaan pembiayaan', 'SCF adalah urun dana melalui penawaran efek, bukan kredit.'),
    ],
    konsep: 'Securities crowdfunding', kataKunci: 'urun dana, penawaran efek',
    alasan: ['SCF adalah skema urun dana berbasis penawaran efek melalui penyelenggara; hak dan risikonya mengikuti jenis efek dan dokumen penawaran.'],
    caraCepat: 'SCF = urun dana + efek + penyelenggara.',
  },
  {
    id: 'hak-saham', tingkat: 'dasar', topik: 'saham', sumber: `${EB}, subbab 3.1.6`,
    pertanyaan: 'Hak yang berkaitan dengan kedudukan seseorang sebagai pemegang saham adalah ....',
    jawaban: 'memberikan suara dalam RUPS dan menerima dividen ketika diputuskan',
    pengecoh: [
      P('menerima kupon tetap setiap tahun dari perusahaan', 'Kupon adalah ciri instrumen utang seperti obligasi.'),
      P('menerima pengembalian harga beli ketika harga saham turun', 'Harga saham dapat turun dan tidak ada jaminan pengembalian harga beli.'),
      P('menagih pokok pinjaman kepada perusahaan saat jatuh tempo', 'Pokok pinjaman adalah hak kreditur, bukan pemegang saham.'),
      P('menetapkan harga saham harian di bursa efek', 'Harga terbentuk dari transaksi di pasar.'),
    ],
    konsep: 'Hak pemegang saham', kataKunci: 'RUPS, dividen',
    alasan: ['Hak pemegang saham dapat berupa kehadiran atau suara dalam RUPS dan penerimaan dividen ketika diputuskan.'],
    caraCepat: 'Saham = kepemilikan → suara RUPS dan dividen.',
  },
];

// ─────────────────────────────── VARIASI: hitungan ───────────────────────────────
const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const namaHari = (v: number) => `${HARI[v % 7]}${v >= 7 ? ' pekan berikutnya' : ''}`;
/** Hari bursa ke-k setelah hari t (Senin pekan pertama = 0); Sabtu-Minggu dan `libur` dilewati. */
function hariBursa(t: number, k: number, libur: number, abaikanLibur = false): number {
  let d = t;
  for (let n = 0; n < k;) {
    d++;
    if (d % 7 === 5 || d % 7 === 6 || (!abaikanLibur && d === libur)) continue;
    n++;
  }
  return d;
}
const JT = 1_000_000;
const M = 1_000_000_000;
const pc = (v: number) => String(v).replace('.', ',');

const HITUNG: TemplateHitung[] = [
  {
    id: 'capital-gain', topik: 'saham', tingkat: 'menengah', sumber: `${EB}, subbab 3.1.6 dan contoh soal 4.5`,
    set: [{ B: 2000, J: 2300, D: 100, n: 1000 }, { B: 1500, J: 1800, D: 60, n: 2000 }, { B: 850, J: 1020, D: 30, n: 3000 }, { B: 4000, J: 4600, D: 150, n: 500 }],
    pertanyaan: (p) => `Investor membeli ${angka(p.n)} lembar saham pada harga ${rp(p.B)} per lembar, menerima dividen ${rp(p.D)} per lembar selama memegangnya, lalu menjual seluruhnya pada harga ${rp(p.J)} per lembar. Sebelum biaya transaksi dan pajak, total capital gain yang diperoleh adalah ....`,
    hitung: (p) => (p.J - p.B) * p.n, format: rp,
    salah: [
      { nilai: (p) => p.J - p.B, alasan: () => 'Itu capital gain per lembar; belum dikalikan jumlah lembar.' },
      { nilai: (p) => (p.J - p.B + p.D) * p.n, alasan: () => 'Dividen ikut dijumlahkan, padahal capital gain hanya selisih harga jual dan beli.' },
      { nilai: (p) => p.D * p.n, alasan: () => 'Itu total dividen, bukan capital gain.' },
      { nilai: (p) => p.J * p.n, alasan: () => 'Itu nilai penjualan, belum dikurangi nilai pembelian.' },
      { nilai: (p) => p.B * p.n, alasan: () => 'Itu nilai pembelian.' },
    ],
    konsep: 'Capital gain terpisah dari dividen', kataKunci: 'harga beli, harga jual, dividen',
    langkah: (p) => [`Capital gain per lembar = ${rp(p.J)} − ${rp(p.B)} = ${rp(p.J - p.B)}.`, `Total = ${rp(p.J - p.B)} × ${angka(p.n)} = ${rp((p.J - p.B) * p.n)}. Dividen ${rp(p.D * p.n)} adalah komponen terpisah.`],
    caraCepat: 'Capital gain = (harga jual − harga beli) × jumlah lembar; dividen dihitung terpisah.',
  },
  {
    id: 'imbal-hasil-total', topik: 'saham', tingkat: 'menantang', sumber: `${EB}, subbab 3.1.6 dan contoh soal 4.5`, bolehNegatif: true,
    set: [{ B: 2000, J: 2300, D: 100 }, { B: 1000, J: 1100, D: 30 }, { B: 5000, J: 5400, D: 150 }, { B: 2500, J: 2400, D: 150 }],
    pertanyaan: (p) => `Saham dibeli seharga ${rp(p.B)} per lembar, menghasilkan dividen ${rp(p.D)} per lembar selama dimiliki, lalu dijual ${rp(p.J)} per lembar. Jika imbal hasil total dihitung sebagai (selisih harga jual dan harga beli + dividen) dibagi harga beli, imbal hasil total sebelum biaya dan pajak adalah ....`,
    hitung: (p) => ((p.J - p.B + p.D) / p.B) * 100, format: persen,
    salah: [
      { nilai: (p) => ((p.J - p.B) / p.B) * 100, alasan: () => 'Dividen belum dimasukkan.' },
      { nilai: (p) => (p.D / p.B) * 100, alasan: () => 'Hanya dividen yang dihitung; selisih harga terlewat.' },
      { nilai: (p) => ((p.J - p.B + p.D) / p.J) * 100, alasan: () => 'Pembagi seharusnya harga beli, bukan harga jual.' },
      { nilai: (p) => ((p.J - p.B - p.D) / p.B) * 100, alasan: () => 'Dividen justru dikurangkan, padahal menambah imbal hasil.' },
    ],
    konsep: 'Imbal hasil total saham', kataKunci: 'selisih harga + dividen dibagi harga beli',
    langkah: (p) => [`Selisih harga = ${rp(p.J)} − ${rp(p.B)} = ${rp(p.J - p.B)}; ditambah dividen ${rp(p.D)} = ${rp(p.J - p.B + p.D)}.`, `Imbal hasil total = ${rp(p.J - p.B + p.D)} ÷ ${rp(p.B)} × 100% = ${persen(((p.J - p.B + p.D) / p.B) * 100)}.`],
    caraCepat: 'Jumlahkan selisih harga dan dividen, lalu bagi harga beli.',
  },
  {
    id: 'dividend-yield', topik: 'saham', tingkat: 'dasar', sumber: `${EB}, subbab 3.1.6 (dividen); rumus dinyatakan dalam soal`,
    set: [{ D: 100, H: 2000 }, { D: 120, H: 1500 }, { D: 90, H: 3000 }, { D: 200, H: 2500 }],
    pertanyaan: (p) => `Sebuah emiten membagikan dividen ${rp(p.D)} per lembar, sedangkan harga sahamnya ${rp(p.H)} per lembar. Jika dividend yield dihitung sebagai dividen per lembar dibagi harga saham, besarnya adalah ....`,
    hitung: (p) => (p.D / p.H) * 100, format: persen,
    salah: [
      { nilai: (p) => p.D / p.H, alasan: () => 'Hasil bagi belum dikalikan 100 sehingga belum menjadi persen.' },
      { nilai: (p) => (p.D / (p.H - p.D)) * 100, alasan: () => 'Pembagi dikurangi dividen; yang benar harga saham.' },
      { nilai: (p) => (p.D / (p.H + p.D)) * 100, alasan: () => 'Pembagi ditambah dividen; yang benar harga saham.' },
      { nilai: (p) => ((p.H - p.D) / p.H) * 100, alasan: () => 'Itu porsi harga di luar dividen, bukan dividend yield.' },
    ],
    konsep: 'Dividend yield', kataKunci: 'dividen per lembar dibagi harga saham',
    langkah: (p) => [`Dividend yield = ${rp(p.D)} ÷ ${rp(p.H)} × 100% = ${persen((p.D / p.H) * 100)}.`],
    caraCepat: 'Dividen ÷ harga × 100%.',
  },
  {
    id: 'kupon', topik: 'obligasi', tingkat: 'menengah', sumber: `${EB}, subbab 3.1.7 dan contoh soal 4.6; ${BS}, bab 2.1.2 A.1`,
    set: [{ N: 5 * JT, c: 6, f: 1 }, { N: 10 * JT, c: 7, f: 2 }, { N: 20 * JT, c: 6.5, f: 2 }, { N: 50 * JT, c: 8, f: 4 }],
    pertanyaan: (p) => `Obligasi bernilai nominal ${rp(p.N)} memberikan kupon tetap ${pc(p.c)}% per tahun yang dibayarkan ${p.f === 1 ? 'setahun sekali' : p.f === 2 ? 'setiap enam bulan (semesteran)' : 'setiap tiga bulan (triwulanan)'}. Tanpa memperhitungkan pajak, kupon bruto yang diterima pada setiap pembayaran adalah ....`,
    hitung: (p) => (p.N * p.c) / 100 / p.f, format: rp,
    salah: [
      { nilai: (p) => (p.N * p.c) / 100, alasan: () => 'Itu kupon setahun; belum dibagi frekuensi pembayaran.' },
      { nilai: (p) => (p.N * p.c) / 100 / 2, alasan: () => 'Kupon setahun dibagi dua, padahal frekuensi pembayarannya tidak semesteran.' },
      { nilai: (p) => (p.N * p.c) / 100 / 4, alasan: () => 'Kupon setahun dibagi empat, padahal frekuensi pembayarannya tidak triwulanan.' },
      { nilai: (p) => ((p.N * p.c) / 100) * 2, alasan: () => 'Kupon setahun justru dikalikan dua.' },
      { nilai: (p) => (p.N * p.c) / 1000, alasan: () => 'Persentase salah dikonversi (dibagi 1.000, bukan 100).' },
      { nilai: (p) => ((p.N * p.c) / 100) * p.f, alasan: () => 'Kupon setahun dikalikan frekuensi, padahal seharusnya dibagi.' },
    ],
    konsep: 'Kupon obligasi', kataKunci: 'nominal, tingkat kupon per tahun, frekuensi pembayaran',
    langkah: (p) => [`Kupon setahun = ${pc(p.c)}% × ${rp(p.N)} = ${rp((p.N * p.c) / 100)}.`, `Dibayar ${p.f} kali setahun: ${rp((p.N * p.c) / 100)} ÷ ${p.f} = ${rp((p.N * p.c) / 100 / p.f)} per pembayaran.`],
    caraCepat: 'Nominal × kupon tahunan, lalu bagi jumlah pembayaran per tahun.',
  },
  {
    id: 'nab-per-unit', topik: 'reksa-dana', tingkat: 'menengah', sumber: `${BS}, bab 2.1.4 C; ${EB}, subbab 3.1.9 dan contoh soal 4.9`,
    set: [{ A: 155, K: 5, U: 100 }, { A: 310, K: 10, U: 250 }, { A: 132, K: 2, U: 100 }, { A: 228, K: 3, U: 150 }],
    pertanyaan: (p) => `Pada suatu hari bursa, nilai pasar wajar seluruh efek dan kekayaan sebuah reksa dana ${rp(p.A * M)}, seluruh kewajibannya ${rp(p.K * M)}, dan unit penyertaan yang beredar ${angka(p.U * JT)} unit. NAB per unit penyertaan reksa dana tersebut adalah ....`,
    hitung: (p) => ((p.A - p.K) * M) / (p.U * JT), format: rp,
    salah: [
      { nilai: (p) => (p.A * M) / (p.U * JT), alasan: () => 'Kewajiban belum dikurangkan dari nilai kekayaan.' },
      { nilai: (p) => ((p.A + p.K) * M) / (p.U * JT), alasan: () => 'Kewajiban justru ditambahkan.' },
      { nilai: (p) => (p.K * M) / (p.U * JT), alasan: () => 'Itu kewajiban per unit, bukan NAB per unit.' },
      { nilai: (p) => (p.A - p.K) * M, alasan: () => 'Itu NAB total, belum dibagi jumlah unit beredar.' },
    ],
    konsep: 'NAB per unit penyertaan', kataKunci: 'kekayaan, kewajiban, unit beredar',
    langkah: (p) => [`NAB = ${rp(p.A * M)} − ${rp(p.K * M)} = ${rp((p.A - p.K) * M)}.`, `NAB/UP = ${rp((p.A - p.K) * M)} ÷ ${angka(p.U * JT)} unit = ${rp(((p.A - p.K) * M) / (p.U * JT))}.`],
    caraCepat: '(Kekayaan − kewajiban) ÷ unit beredar.',
  },
  {
    id: 't-plus-2', topik: 'penyelesaian', tingkat: 'menengah', sumber: `${EB}, subbab 3.1.12 dan contoh soal 4.12; ${BS}, bab 1.3 B`, berlakuPer: 'ketentuan BEI: pasar reguler T+2', bolehNegatif: true,
    set: [{ t: 0, libur: -1 }, { t: 3, libur: -1 }, { t: 1, libur: 2 }, { t: 4, libur: 7 }],
    pertanyaan: (p) => `Transaksi saham di pasar reguler BEI terjadi pada hari ${namaHari(p.t)}. ${p.libur >= 0 ? `Hari ${namaHari(p.libur)} adalah hari libur bursa, ` : ''}hari kerja lainnya merupakan hari bursa normal, sedangkan Sabtu dan Minggu bukan hari bursa. Penyelesaian T+2 jatuh pada hari ....`,
    hitung: (p) => hariBursa(p.t, 2, p.libur), format: (v) => namaHari(v),
    salah: [
      { nilai: (p) => p.t, alasan: () => 'Itu T+0, hari transaksi itu sendiri.' },
      { nilai: (p) => hariBursa(p.t, 1, p.libur), alasan: () => 'Itu T+1; penyelesaian pasar reguler dua hari bursa setelah transaksi.' },
      { nilai: (p) => hariBursa(p.t, 3, p.libur), alasan: () => 'Itu T+3; hari transaksi tidak ikut dihitung.' },
      { nilai: (p) => hariBursa(p.t, 4, p.libur), alasan: () => 'Penyelesaian pasar reguler bukan empat hari bursa.' },
      { nilai: (p) => p.t + 2, alasan: () => 'Dua hari kalender dipakai, padahal T+2 dihitung dalam hari bursa.' },
      { nilai: (p) => hariBursa(p.t, 2, p.libur, true), alasan: () => 'Hari libur bursa ikut dihitung sebagai hari bursa.' },
    ],
    konsep: 'Penyelesaian T+2 hari bursa', kataKunci: 'pasar reguler, hari libur bursa',
    langkah: (p) => [`T = ${namaHari(p.t)}; T+1 = ${namaHari(hariBursa(p.t, 1, p.libur))}; T+2 = ${namaHari(hariBursa(p.t, 2, p.libur))}.`, 'Sabtu, Minggu, dan hari libur bursa tidak dihitung.'],
    caraCepat: 'Hitung dua hari bursa sesudah T; lewati akhir pekan dan libur bursa.',
  },
  {
    id: 'capital-loss', topik: 'saham', tingkat: 'menengah', sumber: `${EB}, subbab 3.1.6`,
    set: [{ B: 2000, J: 1850, D: 50, n: 1000 }, { B: 3200, J: 2900, D: 80, n: 500 }, { B: 1250, J: 1100, D: 25, n: 2000 }, { B: 5400, J: 5000, D: 120, n: 300 }],
    pertanyaan: (p) => `Investor membeli ${angka(p.n)} lembar saham pada harga ${rp(p.B)} per lembar, menerima dividen ${rp(p.D)} per lembar, lalu menjual seluruhnya pada harga ${rp(p.J)} per lembar. Sebelum biaya transaksi dan pajak, besar capital loss dari penjualan itu adalah ....`,
    hitung: (p) => (p.B - p.J) * p.n, format: rp,
    salah: [
      { nilai: (p) => p.B - p.J, alasan: () => 'Itu capital loss per lembar; belum dikalikan jumlah lembar.' },
      { nilai: (p) => (p.B - p.J - p.D) * p.n, alasan: () => 'Dividen ikut dikurangkan, padahal dividen terpisah dari selisih harga.' },
      { nilai: (p) => (p.B - p.J + p.D) * p.n, alasan: () => 'Dividen ikut ditambahkan, padahal dividen terpisah dari selisih harga.' },
      { nilai: (p) => p.D * p.n, alasan: () => 'Itu total dividen, bukan capital loss.' },
      { nilai: (p) => p.J * p.n, alasan: () => 'Itu nilai penjualan, bukan selisihnya dengan nilai pembelian.' },
    ],
    konsep: 'Capital loss terpisah dari dividen', kataKunci: 'harga jual lebih rendah dari harga beli',
    langkah: (p) => [`Capital loss per lembar = ${rp(p.B)} − ${rp(p.J)} = ${rp(p.B - p.J)}.`, `Total = ${rp(p.B - p.J)} × ${angka(p.n)} = ${rp((p.B - p.J) * p.n)}. Dividen dihitung terpisah.`],
    caraCepat: 'Capital loss = (harga beli − harga jual) × jumlah lembar.',
  },
  {
    id: 'dana-penerbitan', topik: 'pasar-perdana-sekunder', tingkat: 'menengah', sumber: `${EB}, subbab 3.1.3`,
    set: [{ n: 1000, p: 2000, q: 2200 }, { n: 5000, p: 1500, q: 1750 }, { n: 2000, p: 3000, q: 3300 }, { n: 4000, p: 1200, q: 1450 }],
    pertanyaan: (p) => `PT Rona menerbitkan ${angka(p.n)} saham baru seharga ${rp(p.p)} per lembar dan seluruhnya dibeli Investor A dalam penawaran perdana. Kemudian Investor A menjual seluruh saham itu kepada Investor B di pasar sekunder seharga ${rp(p.q)} per lembar. Sebelum biaya, dana yang diterima PT Rona dari kedua transaksi itu adalah ....`,
    hitung: (p) => p.n * p.p, format: rp,
    salah: [
      { nilai: (p) => p.n * p.q, alasan: () => 'Itu nilai transaksi di pasar sekunder yang diterima Investor A.' },
      { nilai: (p) => p.n * (p.p + p.q), alasan: () => 'Dana pasar sekunder ikut dijumlahkan, padahal berpindah dari Investor B kepada Investor A.' },
      { nilai: (p) => p.n * (p.q - p.p), alasan: () => 'Itu selisih harga yang dinikmati Investor A, bukan dana PT Rona.' },
      { nilai: (p) => (p.n * (p.p + p.q)) / 2, alasan: () => 'Itu rata-rata nilai kedua transaksi; PT Rona hanya menerima dana penawaran perdana.' },
      { nilai: (p) => p.n * p.p - p.n * (p.q - p.p), alasan: () => 'Selisih harga pasar sekunder tidak mengurangi dana penawaran perdana.' },
    ],
    konsep: 'Aliran dana pasar perdana dan sekunder', kataKunci: 'saham baru, pasar sekunder',
    langkah: (p) => [`Penawaran perdana: ${angka(p.n)} × ${rp(p.p)} = ${rp(p.n * p.p)} diterima PT Rona.`, `Pasar sekunder: ${rp(p.n * p.q)} berpindah dari Investor B kepada Investor A; PT Rona tidak menerimanya.`],
    caraCepat: 'Penerbit hanya menerima dana dari penawaran perdana.',
  },
];

export const PASAR_MODAL = [
  familyKurasi({
    id: 'PSJK-PM-FAKTA', nama: 'Pasar modal: fakta dan jenis produk', chapter: 'pasar-modal', label: 'SHL',
    sumber: `${BS}; ${EB} (contoh soal 4.1–4.15)`,
    ringkas: 'Soal fakta langsung: definisi dan fungsi pasar modal (UU PM jo. P2SK), empat jenis reksa dana konvensional, ETF, bentuk hukum reksa dana dan KIK, penyelesaian pasar tunai, peringkat efek, OJK sebagai pengawas, SRO.',
  }, [...FAKTA, ...TAMBAHAN_FAKTA]),
  familyRelasi({
    id: 'PSJK-PM-PELAKU', nama: 'Pasar modal: lembaga dan profesi (dua arah)', chapter: 'pasar-modal', label: 'VARIASI',
    sumber: `${EB}, subbab 3.1.4–3.1.5`,
    ringkas: 'Relasi dua arah sepuluh pihak: OJK, BEI, KPEI, KSEI, emiten, penjamin emisi, perantara pedagang efek, manajer investasi, bank kustodian, dan APERD.',
  }, TABEL_PELAKU),
  familyRelasi({
    id: 'PSJK-PM-ISTILAH', nama: 'Pasar modal: instrumen dan istilah (dua arah)', chapter: 'pasar-modal', label: 'VARIASI',
    sumber: `${EB}, subbab 3.1.3–3.1.16`,
    ringkas: 'Dua tabel relasi dua arah: delapan instrumen (saham, obligasi, sukuk, reksa dana, ETF, EBA, DIRE, derivatif) dan tujuh belas istilah (pasar perdana/sekunder, prospektus, e-IPO, NAB, dividen, RUPS, kupon, IHSG, SIPF, SCF, dll.).',
  }, TABEL_ISTILAH),
  familyKurasi({
    id: 'PSJK-PM-KASUS', nama: 'Pasar modal: kasus dan pernyataan majemuk', chapter: 'pasar-modal', label: 'VARIASI',
    sumber: `${EB}, subbab 3.1.3–3.1.16; ${BS}`,
    ringkas: 'Kasus aliran dana pasar perdana/sekunder, urutan BEI-KPEI-KSEI, saham vs obligasi, hak pemegang saham (KECUALI), SIPF, diversifikasi, IHSG, jenis risiko, stock split, peran MI–kustodian–APERD, sukuk vs obligasi, dan SCF. Butir di luar cakupan materi folder disaring (QC 2 R01).',
  }, [...KASUS, ...TAMBAHAN_KASUS]),
  familyHitung({
    id: 'PSJK-PM-HITUNG', nama: 'Pasar modal: hitungan imbal hasil, kupon, NAB, T+2', chapter: 'pasar-modal', label: 'VARIASI',
    sumber: `${EB}, subbab 3.1.6–3.1.12; ${BS}`,
    ringkas: 'Capital gain dan capital loss (dipisah dari dividen), dana penerbitan, kupon per pembayaran, NAB per unit, dan tanggal penyelesaian T+2 dengan akhir pekan/libur bursa.',
  }, HITUNG),
];
