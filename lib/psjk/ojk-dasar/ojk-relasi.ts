import type { BarisRelasi } from '../umum';
import { kapital, type TabelKalimat } from './relasi';
import { BSC, BS_OJK, EB_OJK, MPSJKI, P2SK, P2SK_2026, POJK22, SLK1, UU_OJK } from './sumber';

// Pengenalan OJK — tabel relasi dua arah (VARIASI). Setiap tabel satu-satu (subjek unik, nilai unik); pengecoh diambil
// dari baris lain tabel yang sama sehingga selalu salah menurut tabel.

/** `jenis`: nama rumusan (arah nilai); `awal` + `kata`: kalimat makna opsi subjek, mis. `Asas "x" adalah asas yang ...`. */
const salahUmum = (jenis: string, awal: string, kata: string) => (benar: BarisRelasi, salah: BarisRelasi, arah: 'nilai' | 'subjek') =>
  arah === 'nilai'
    ? `Rumusan itu adalah ${jenis} "${salah.subjek}", bukan "${benar.subjek}".`
    : `${awal} "${salah.subjek}" ${kata} ${salah.nilai}.`;

/** Tabel kelembagaan: nilai strategis, asas, kepala eksekutif, mandat lembaga, kronologi. */
export const TABEL_OJK_LEMBAGA: TabelKalimat[] = [
  {
    id: 'nilai-strategis', topik: 'nilai-strategis',
    kalimat: (b) => `Nilai strategis ${b.subjek} bermakna ${b.nilai}.`,
    tanyaNilai: (s) => `Nilai strategis OJK "${s}" bermakna ....`,
    tanyaSubjek: (n) => `Nilai strategis OJK yang bermakna "${n}" adalah ....`,
    alasanSalah: salahUmum('makna nilai strategis', 'Nilai strategis', 'bermakna'),
    konsep: 'Lima nilai strategis OJK: Integritas, Profesionalisme, Sinergi, Inklusif, Visioner.',
    caraCepat: 'Cocokkan kata kunci makna: jujur/konsisten → Integritas; kompetensi → Profesionalisme; kolaborasi → Sinergi; akses masyarakat → Inklusif; berpikir ke depan → Visioner.',
    baris: [
      { id: 'integritas', subjek: 'Integritas', nilai: 'bertindak objektif, adil, dan konsisten sesuai kode etik dengan menjunjung kejujuran', tingkat: 'dasar', sumber: `${BS_OJK}, Bab 1 A.5; ${EB_OJK}, subbab 3.1.6` },
      { id: 'profesionalisme', subjek: 'Profesionalisme', nilai: 'bekerja penuh tanggung jawab berdasarkan kompetensi tinggi untuk kinerja terbaik', tingkat: 'dasar', sumber: `${BS_OJK}, Bab 1 A.5; ${EB_OJK}, subbab 3.1.6` },
      { id: 'sinergi', subjek: 'Sinergi', nilai: 'berkolaborasi dengan seluruh pemangku kepentingan internal dan eksternal secara produktif', tingkat: 'dasar', sumber: `${BS_OJK}, Bab 1 A.5; ${EB_OJK}, subbab 3.1.6` },
      { id: 'inklusif', subjek: 'Inklusif', nilai: 'terbuka terhadap keberagaman serta memperluas akses masyarakat terhadap industri keuangan', tingkat: 'menengah', sumber: `${BS_OJK}, Bab 1 A.5; ${EB_OJK}, subbab 3.1.6` },
      { id: 'visioner', subjek: 'Visioner', nilai: 'berwawasan luas, berpikir ke depan, dan mampu berpikir di luar kebiasaan', tingkat: 'dasar', sumber: `${BS_OJK}, Bab 1 A.5; ${EB_OJK}, subbab 3.1.6` },
    ],
  },
  {
    id: 'asas', topik: 'asas',
    kalimat: (b) => `Asas ${b.subjek} adalah asas yang ${b.nilai}.`,
    tanyaNilai: (s) => `Dalam menjalankan tugasnya, OJK berlandaskan asas ${s}, yaitu asas yang ....`,
    tanyaSubjek: (n) => `Asas OJK yang ${n} disebut asas ....`,
    alasanSalah: salahUmum('rumusan asas', 'Asas', 'adalah asas yang'),
    konsep: 'Asas OJK: independensi, kepastian hukum, kepentingan umum, keterbukaan, profesionalitas, integritas, dan akuntabilitas.',
    caraCepat: 'Cari kata kunci: keputusan mandiri → independensi; landasan peraturan → kepastian hukum; kepentingan konsumen → kepentingan umum; hak atas informasi → keterbukaan; keahlian → profesionalitas; nilai moral → integritas; dipertanggungjawabkan → akuntabilitas.',
    baris: [
      { id: 'independensi', subjek: 'independensi', nilai: 'menjaga kemandirian dalam pengambilan keputusan dengan tetap sesuai peraturan', tingkat: 'menengah', sumber: `${BS_OJK}, Bab 1 A.5 (Asas OJK)`, berlakuPer: UU_OJK },
      { id: 'kepastian-hukum', subjek: 'kepastian hukum', nilai: 'mengutamakan landasan peraturan perundang-undangan dan keadilan dalam setiap kebijakan', tingkat: 'menengah', sumber: `${BS_OJK}, Bab 1 A.5 (Asas OJK)`, berlakuPer: UU_OJK },
      { id: 'kepentingan-umum', subjek: 'kepentingan umum', nilai: 'membela dan melindungi kepentingan konsumen dan masyarakat serta memajukan kesejahteraan umum', tingkat: 'menengah', sumber: `${BS_OJK}, Bab 1 A.5 (Asas OJK)`, berlakuPer: UU_OJK },
      { id: 'keterbukaan', subjek: 'keterbukaan', nilai: 'membuka diri terhadap hak masyarakat memperoleh informasi yang benar, jujur, dan tidak diskriminatif', tingkat: 'menengah', sumber: `${BS_OJK}, Bab 1 A.5 (Asas OJK)`, berlakuPer: UU_OJK },
      { id: 'profesionalitas', subjek: 'profesionalitas', nilai: 'mengutamakan keahlian dalam pelaksanaan tugas dengan berlandaskan kode etik', tingkat: 'menengah', sumber: `${BS_OJK}, Bab 1 A.5 (Asas OJK)`, berlakuPer: UU_OJK },
      { id: 'integritas', subjek: 'integritas', nilai: 'berpegang teguh pada nilai-nilai moral dalam setiap tindakan dan keputusan', tingkat: 'menengah', sumber: `${BS_OJK}, Bab 1 A.5 (Asas OJK)`, berlakuPer: UU_OJK },
      { id: 'akuntabilitas', subjek: 'akuntabilitas', nilai: 'menentukan bahwa setiap kegiatan dan hasil akhirnya dapat dipertanggungjawabkan kepada publik', tingkat: 'menengah', sumber: `${BS_OJK}, Bab 1 A.5 (Asas OJK)`, berlakuPer: UU_OJK },
    ],
  },
  {
    id: 'kepala-eksekutif', topik: 'struktur',
    kalimat: (b) => `${b.subjek} memimpin bidang pengawasan yang antara lain mengawasi ${b.nilai}.`,
    tanyaNilai: (s) => `Dalam struktur OJK terkini, ${s} memimpin bidang pengawasan yang antara lain mengawasi ....`,
    tanyaSubjek: (n) => `Pengawasan atas ${n} berada pada bidang yang dipimpin oleh ....`,
    alasanSalah: (benar, salah, arah) => arah === 'nilai'
      ? `${salah.nilai[0].toUpperCase()}${salah.nilai.slice(1)} diawasi bidang ${salah.subjek}, bukan ${benar.subjek}.`
      : `${salah.subjek} memimpin pengawasan atas ${salah.nilai}.`,
    konsep: 'Tujuh Kepala Eksekutif OJK memimpin bidang pengawasan sektoral: Perbankan; Pasar Modal, Keuangan Derivatif, dan Bursa Karbon; PPDP; PVML; ITSK, AKD, dan Aset Kripto; PEPK; Bursa Mineral dan Komoditas Strategis.',
    caraCepat: 'Cocokkan jenis lembaga dengan nama bidang Kepala Eksekutif.',
    baris: [
      { id: 'perbankan', subjek: 'Kepala Eksekutif Pengawas Perbankan', nilai: 'bank umum konvensional dan bank umum syariah', tingkat: 'dasar', sumber: `${EB_OJK}, subbab 3.1.4`, berlakuPer: P2SK_2026 },
      { id: 'pmdk', subjek: 'Kepala Eksekutif Pengawas Pasar Modal, Keuangan Derivatif, dan Bursa Karbon', nilai: 'emiten, perusahaan efek, dan penyelenggara bursa karbon', tingkat: 'menengah', sumber: `${EB_OJK}, subbab 3.1.4`, berlakuPer: P2SK_2026 },
      { id: 'ppdp', subjek: 'Kepala Eksekutif Pengawas Perasuransian, Penjaminan, dan Dana Pensiun', nilai: 'perusahaan asuransi, perusahaan penjaminan, dan dana pensiun', tingkat: 'menengah', sumber: `${EB_OJK}, subbab 3.1.4`, berlakuPer: P2SK_2026 },
      { id: 'pvml', subjek: 'Kepala Eksekutif Pengawas Lembaga Pembiayaan, Perusahaan Modal Ventura, Lembaga Keuangan Mikro, dan Lembaga Jasa Keuangan Lainnya', nilai: 'perusahaan pembiayaan, perusahaan modal ventura, dan lembaga keuangan mikro', tingkat: 'menengah', sumber: `${EB_OJK}, subbab 3.1.4`, berlakuPer: P2SK_2026 },
      { id: 'itsk', subjek: 'Kepala Eksekutif Pengawas Inovasi Teknologi Sektor Keuangan, Aset Keuangan Digital, dan Aset Kripto', nilai: 'penyelenggara inovasi teknologi sektor keuangan dan perdagangan aset kripto', tingkat: 'menengah', sumber: `${EB_OJK}, subbab 3.1.4 dan 3.1.16`, berlakuPer: P2SK_2026 },
      { id: 'pepk', subjek: 'Kepala Eksekutif Pengawas Perilaku Pelaku Usaha Jasa Keuangan, Edukasi, dan Pelindungan Konsumen', nilai: 'perilaku pelaku usaha jasa keuangan terhadap konsumen', tingkat: 'menengah', sumber: `${EB_OJK}, subbab 3.1.4`, berlakuPer: P2SK_2026 },
      { id: 'bmks', subjek: 'Kepala Eksekutif Pengawas Bursa Mineral dan Komoditas Strategis', nilai: 'bursa mineral dan komoditas strategis', tingkat: 'dasar', sumber: `${EB_OJK}, subbab 3.1.1 dan 3.1.4`, berlakuPer: P2SK_2026 },
    ],
  },
  {
    id: 'mandat-lembaga', topik: 'ojk-bi-lps',
    kalimat: (b) => `Peran utama ${b.subjek} adalah ${b.nilai}.`,
    tanyaNilai: (s) => `Dalam sistem keuangan Indonesia, peran utama ${s} adalah ....`,
    tanyaSubjek: (n) => `Pihak yang peran utamanya ${n} adalah ....`,
    alasanSalah: (benar, salah, arah) => arah === 'nilai'
      ? `Itu peran ${salah.subjek}, bukan ${benar.subjek}.`
      : `Peran utama ${salah.subjek} adalah ${salah.nilai}.`,
    konsep: 'Pilih pihak berdasarkan objek tindakan: OJK mengatur dan mengawasi sektor jasa keuangan; BI moneter, sistem pembayaran, makroprudensial; LPS penjaminan simpanan dan resolusi; Satgas PASTI aktivitas ilegal; PUJK penyedia produk dan penerima pertama pengaduan.',
    caraCepat: 'Kata kunci: moneter → BI; simpanan → LPS; ilegal → Satgas PASTI; pengawasan sektor → OJK; produk dan keluhan pertama → PUJK.',
    baris: [
      { id: 'ojk', subjek: 'Otoritas Jasa Keuangan', nilai: 'pengaturan dan pengawasan sektor jasa keuangan, termasuk perilaku pelaku usahanya', tingkat: 'dasar', sumber: `${EB_OJK}, subbab 3.1.9`, berlakuPer: P2SK },
      { id: 'bi', subjek: 'Bank Indonesia', nilai: 'kebijakan moneter, sistem pembayaran, dan makroprudensial', tingkat: 'dasar', sumber: `${EB_OJK}, subbab 3.1.9`, berlakuPer: P2SK },
      { id: 'pujk', subjek: 'Pelaku Usaha Jasa Keuangan (PUJK)', nilai: 'penyediaan produk keuangan dan penerimaan pertama pengaduan konsumennya', tingkat: 'menengah', sumber: `${EB_OJK}, subbab 3.1.11 dan 3.1.15`, berlakuPer: POJK22 },
      { id: 'lps', subjek: 'Lembaga Penjamin Simpanan', nilai: 'penjaminan simpanan serta penanganan atau resolusi bank', tingkat: 'dasar', sumber: `${EB_OJK}, subbab 3.1.9`, berlakuPer: P2SK },
      { id: 'kemenkeu', subjek: 'Kementerian Keuangan', nilai: 'kebijakan fiskal yang berdampak pada sistem keuangan', tingkat: 'dasar', sumber: `${SLK1}, Bab 3; ${MPSJKI}, bagian Kolaborasi` },
      { id: 'bei', subjek: 'Bursa Efek Indonesia', nilai: 'penyelenggaraan perdagangan efek sebagai self regulatory organization', tingkat: 'menengah', sumber: `${BSC}, Bab IV (Apa itu Pasar Modal?)` },
      { id: 'satgas', subjek: 'Satgas PASTI', nilai: 'koordinasi pencegahan dan penanganan aktivitas keuangan ilegal', tingkat: 'dasar', sumber: `${EB_OJK}, subbab 3.1.14`, berlakuPer: 'nomenklatur Satgas PASTI sejak 2023' },
    ],
  },
  {
    id: 'kronologi', topik: 'sejarah',
    kalimat: (b) => `${kapital(b.subjek)} pada ${b.nilai}.`,
    tanyaNilai: (s) => `Kapan ${s}?`,
    tanyaSubjek: (n) => `Peristiwa yang terjadi pada ${n} adalah ....`,
    alasanSalah: (benar, salah, arah) => arah === 'nilai'
      ? `${kapital(salah.nilai)} adalah waktu ketika ${salah.subjek}.`
      : `Peristiwa itu (${salah.subjek}) terjadi pada ${salah.nilai}, bukan ${benar.nilai}.`,
    konsep: 'Kronologi: Satgas WI dibentuk Juni 2007; PM dan IKNB beralih 31 Desember 2012; perbankan 31 Desember 2013; LKM 2015; SLIK 2 Januari 2018; aset kripto Januari 2025; UU 4/2026 berlaku 17 Juni 2026.',
    caraCepat: 'Urutkan: 2007 → 2012 → 2013 → 2015 → 2018 → 2025 → 2026.',
    baris: [
      { id: 'satgas-2007', subjek: 'Satgas Waspada Investasi dibentuk melalui keputusan Ketua Bapepam-LK', nilai: 'Juni 2007', tingkat: 'menantang', sumber: `${BS_OJK}, Bab 1 E.4` },
      { id: 'pm-iknb-2012', subjek: 'pengawasan pasar modal dan IKNB beralih dari Bapepam-LK ke OJK', nilai: '31 Desember 2012', tingkat: 'menengah', sumber: `${SLK1}, Bab 1 dan Bab 4; ${BS_OJK}, Bab 1 A.1` },
      { id: 'bank-2013', subjek: 'pengawasan perbankan beralih dari Bank Indonesia ke OJK', nilai: '31 Desember 2013', tingkat: 'menengah', sumber: `${SLK1}, Bab 1 dan Bab 4; ${BS_OJK}, Bab 1 A.1` },
      { id: 'lkm-2015', subjek: 'pengawasan lembaga keuangan mikro mulai dilakukan OJK', nilai: 'tahun 2015', tingkat: 'menengah', sumber: `${SLK1}, Bab 1 (Pasal 28 UU 1/2013 tentang LKM)` },
      { id: 'slik-2018', subjek: 'pengelolaan informasi debitur beralih dari BI ke OJK sebagai SLIK', nilai: '2 Januari 2018', tingkat: 'menantang', sumber: `${SLK1}, Bab 6` },
      { id: 'kripto-2025', subjek: 'pengawasan aset keuangan digital termasuk aset kripto beralih dari Bappebti ke OJK', nilai: 'Januari 2025', tingkat: 'menengah', sumber: `${EB_OJK}, subbab 3.1.16`, berlakuPer: P2SK },
      { id: 'uu-2026', subjek: 'UU 4/2026 tentang perubahan UU P2SK mulai berlaku', nilai: '17 Juni 2026', tingkat: 'menantang', sumber: `${EB_OJK}, subbab 3.1.1`, berlakuPer: P2SK_2026 },
    ],
  },
  // ---- QC 2 R01: tabel pengganti dari materi folder (subbab 3.1.2, 3.1.6, 3.1.8) ----
  {
    id: 'istilah-lembaga', topik: 'tujuan-fungsi-tugas',
    kalimat: (b) => `Istilah "${b.subjek}" menunjuk pada ${b.nilai}.`,
    tanyaNilai: (s) => `Dalam penjelasan kelembagaan OJK, istilah "${s}" menunjuk pada ....`,
    tanyaSubjek: (n) => `Dalam penjelasan kelembagaan OJK, istilah yang menunjuk pada ${n} adalah ....`,
    alasanSalah: salahUmum('pengertian istilah', 'Istilah', 'menunjuk pada'),
    konsep: 'Tujuan = hasil yang ingin dicapai; fungsi = sistem yang diselenggarakan; tugas = bidang kegiatan; kewenangan = tindakan hukum atau administratif; kode etik = norma kepatutan.',
    caraCepat: 'Hasil → tujuan; sistem → fungsi; bidang kegiatan → tugas; tindakan hukum → kewenangan; norma kepatutan → kode etik; pengawas norma → Komite Etik.',
    baris: [
      { id: 'tujuan', subjek: 'tujuan', nilai: 'hasil yang ingin dicapai', tingkat: 'menengah', sumber: `${EB_OJK}, subbab 3.1.2` },
      { id: 'fungsi', subjek: 'fungsi', nilai: 'sistem yang diselenggarakan', tingkat: 'menengah', sumber: `${EB_OJK}, subbab 3.1.2` },
      { id: 'tugas', subjek: 'tugas', nilai: 'bidang kegiatan yang dilaksanakan', tingkat: 'menengah', sumber: `${EB_OJK}, subbab 3.1.2` },
      { id: 'kewenangan', subjek: 'kewenangan', nilai: 'tindakan hukum atau administratif yang dapat dilakukan', tingkat: 'menengah', sumber: `${EB_OJK}, subbab 3.1.2` },
      { id: 'kode-etik', subjek: 'kode etik', nilai: 'norma kepatutan dan kepantasan yang wajib dipatuhi', tingkat: 'dasar', sumber: `${EB_OJK}, subbab 3.1.6` },
      { id: 'komite-etik', subjek: 'Komite Etik', nilai: 'organ pendukung Dewan Komisioner yang mengawasi kepatuhan pegawai', tingkat: 'menengah', sumber: `${EB_OJK}, subbab 3.1.6` },
    ],
  },
  {
    id: 'sektor-jasa', topik: 'produk-sektor',
    kalimat: (b) => `Kegiatan ${b.subjek} ${b.nilai}.`,
    tanyaNilai: (s) => `Karakter kegiatan ${s} adalah ....`,
    tanyaSubjek: (n) => `Kegiatan jasa keuangan yang ${n} adalah ....`,
    alasanSalah: (benar, salah, arah) => arah === 'nilai'
      ? `Itu karakter kegiatan ${salah.subjek}, bukan ${benar.subjek}.`
      : `Kegiatan ${salah.subjek} ${salah.nilai}.`,
    konsep: 'Produk jasa keuangan sama-sama diawasi, tetapi karakter hak, kewajiban, risiko, dan regulasinya berbeda menurut sektor.',
    caraCepat: 'Himpun dan salurkan dana → bank; efek → pasar modal; risiko menurut polis → asuransi; membiayai kebutuhan tertentu → pembiayaan; manfaat pensiun → dana pensiun.',
    baris: [
      { id: 'bank', subjek: 'perbankan', nilai: 'menghimpun dana dan menyalurkan kredit atau pembiayaan', tingkat: 'dasar', sumber: `${EB_OJK}, subbab 3.1.8` },
      { id: 'pm', subjek: 'pasar modal', nilai: 'mempertemukan penerbit efek dan investor', tingkat: 'dasar', sumber: `${EB_OJK}, subbab 3.1.8` },
      { id: 'asuransi', subjek: 'perasuransian', nilai: 'mengalihkan atau membagi risiko sesuai polis', tingkat: 'dasar', sumber: `${EB_OJK}, subbab 3.1.8` },
      { id: 'pembiayaan', subjek: 'perusahaan pembiayaan', nilai: 'menyediakan dana untuk kebutuhan tertentu tanpa menghimpun simpanan', tingkat: 'dasar', sumber: `${EB_OJK}, subbab 3.1.8` },
      { id: 'dapen', subjek: 'dana pensiun', nilai: 'menyelenggarakan program manfaat hari tua bagi pesertanya', tingkat: 'dasar', sumber: `${EB_OJK}, subbab 3.1.8` },
    ],
  },
];

/** Tabel pelindungan konsumen, layanan, dan istilah pengawasan. */
export const TABEL_OJK_KONSUMEN: TabelKalimat[] = [
  {
    id: 'prinsip-pojk22', topik: 'pelindungan-konsumen',
    kalimat: (b) => `Kejadian "${b.nilai}" paling langsung mencerminkan prinsip ${b.subjek}.`,
    tanyaNilai: (s) => `Contoh penerapan prinsip pelindungan konsumen "${s}" (POJK 22/2023) yang paling langsung adalah ....`,
    tanyaSubjek: (n) => `Kejadian berikut paling langsung mencerminkan prinsip pelindungan konsumen dalam POJK 22/2023: ${n}. Prinsip tersebut adalah ....`,
    alasanSalah: (benar, salah, arah) => arah === 'nilai'
      ? `Contoh itu paling langsung mencerminkan prinsip "${salah.subjek}".`
      : `Prinsip "${salah.subjek}" paling langsung tecermin pada contoh lain: ${salah.nilai}.`,
    konsep: 'Tujuh prinsip POJK 22/2023 bekerja sepanjang daur hubungan konsumen: sebelum membeli (edukasi, transparansi), saat memakai (perlakuan adil, pelindungan data), setelah masalah (pengaduan), didukung penegakan kepatuhan dan persaingan sehat.',
    caraCepat: 'Cari prinsip yang paling langsung menjawab kejadian, bukan yang sekadar berkaitan.',
    baris: [
      { id: 'edukasi', subjek: 'edukasi yang memadai', nilai: 'PUJK menyelenggarakan kegiatan untuk meningkatkan pemahaman konsumen tentang produk keuangan', tingkat: 'menengah', sumber: `${EB_OJK}, subbab 3.1.10`, berlakuPer: POJK22 },
      { id: 'transparansi', subjek: 'keterbukaan dan transparansi informasi produk/layanan', nilai: 'PUJK menjelaskan manfaat, biaya, dan risiko produk sebelum perjanjian ditandatangani', tingkat: 'dasar', sumber: `${EB_OJK}, subbab 3.1.10 dan contoh soal 4.10`, berlakuPer: POJK22 },
      { id: 'adil', subjek: 'perlakuan yang adil dan perilaku bisnis yang bertanggung jawab', nilai: 'PUJK tidak membeda-bedakan konsumen dan tidak memaksakan produk yang tidak sesuai kebutuhan', tingkat: 'menengah', sumber: `${EB_OJK}, subbab 3.1.10–3.1.11`, berlakuPer: POJK22 },
      { id: 'data', subjek: 'pelindungan aset, privasi, dan data konsumen', nilai: 'PUJK tidak memberikan data pribadi konsumen kepada pihak lain tanpa persetujuannya', tingkat: 'dasar', sumber: `${EB_OJK}, subbab 3.1.10`, berlakuPer: POJK22 },
      { id: 'pengaduan', subjek: 'penanganan pengaduan dan penyelesaian sengketa yang efektif dan efisien', nilai: 'PUJK menyediakan kanal pengaduan dan menindaklanjuti keluhan dalam waktu yang ditetapkan', tingkat: 'dasar', sumber: `${EB_OJK}, subbab 3.1.10`, berlakuPer: POJK22 },
      { id: 'kepatuhan', subjek: 'penegakan kepatuhan', nilai: 'pelanggaran ketentuan pelindungan konsumen oleh PUJK ditindak dengan sanksi sesuai peraturan', tingkat: 'menengah', sumber: `${EB_OJK}, subbab 3.1.10`, berlakuPer: POJK22 },
      { id: 'persaingan', subjek: 'persaingan yang sehat', nilai: 'PUJK tidak bersekongkol dengan pesaing untuk menetapkan harga produk bersama-sama', tingkat: 'menengah', sumber: `${EB_OJK}, subbab 3.1.10`, berlakuPer: POJK22 },
    ],
  },
  {
    id: 'layanan', topik: 'layanan',
    kalimat: (b) => `${b.subjek} adalah ${b.nilai}.`,
    tanyaNilai: (s) => `${s} adalah ....`,
    tanyaSubjek: (n) => `Nama yang tepat untuk ${n} adalah ....`,
    alasanSalah: (benar, salah, arah) => arah === 'nilai'
      ? `Itu adalah ${salah.subjek}, bukan ${benar.subjek}.`
      : `${salah.subjek} adalah ${salah.nilai}.`,
    konsep: 'Layanan terkait konsumen: APPK (portal layanan konsumen OJK), SLIK (informasi debitur), Sikapi Uangmu (edukasi), Laku Pandai (layanan keuangan tanpa kantor), dan AFPI (asosiasi fintech yang menerima pengaduan).',
    caraCepat: 'Portal pengaduan OJK → APPK; riwayat kredit → SLIK; materi edukasi → Sikapi Uangmu; agen tanpa kantor → Laku Pandai; asosiasi fintech → AFPI.',
    baris: [
      { id: 'appk', subjek: 'Aplikasi Portal Perlindungan Konsumen (APPK)', nilai: 'sistem layanan konsumen terintegrasi OJK untuk pertanyaan, informasi, dan pengaduan', tingkat: 'menengah', sumber: `${BSC}, Bab I` },
      { id: 'slik', subjek: 'Sistem Layanan Informasi Keuangan (SLIK)', nilai: 'sistem yang melayani permintaan informasi debitur perbankan dan layanan jasa keuangan lainnya', tingkat: 'menengah', sumber: `${SLK1}, Bab 6` },
      { id: 'sikapiuangmu', subjek: 'Sikapi Uangmu (sikapiuangmu.ojk.go.id)', nilai: 'minisite edukasi OJK berisi materi literasi keuangan yang dapat diunduh gratis', tingkat: 'menengah', sumber: `${SLK1}, Bab 6; ${BSC}, Nasihat dari OJK` },
      { id: 'afpi', subjek: 'Asosiasi Fintech Pendanaan Bersama Indonesia (AFPI)', nilai: 'asosiasi penyelenggara fintech pendanaan bersama yang juga menerima pengaduan konsumen', tingkat: 'menengah', sumber: `${BSC}, Bab IX` },
      { id: 'lakupandai', subjek: 'Laku Pandai', nilai: 'layanan keuangan tanpa kantor melalui agen dalam rangka keuangan inklusif', tingkat: 'menengah', sumber: `${BSC}, Bab III; ${BS_OJK}, Bab 2 C` },
    ],
  },
  {
    id: 'istilah-pengawasan', topik: 'pengawasan',
    kalimat: (b) => `Istilah "${b.subjek}" berarti ${b.nilai}.`,
    tanyaNilai: (s) => `Dalam pengawasan sektor jasa keuangan, istilah "${s}" berarti ....`,
    tanyaSubjek: (n) => `Istilah untuk ${n} adalah ....`,
    alasanSalah: salahUmum('pengertian istilah', 'Istilah', 'berarti'),
    konsep: 'Latar pengawasan terintegrasi OJK: konglomerasi keuangan, supermarket keuangan, hybrid products, dan arbitrase peraturan; jenis pengawasan: mikroprudensial, makroprudensial, dan market conduct.',
    caraCepat: 'Cocokkan kata kunci: grup lintas sektor → konglomerasi; satu atap → supermarket; lintas industri berbasis TI → hybrid; dua aturan bertolak belakang → arbitrase; individu LJK → mikro; agregat → makro; perilaku PUJK → market conduct.',
    baris: [
      { id: 'konglomerasi', subjek: 'konglomerasi keuangan', nilai: 'LJK yang memiliki anak perusahaan LJK di berbagai sektor jasa keuangan', tingkat: 'menengah', sumber: `${SLK1}, Bab 1 dan Bab 4` },
      { id: 'supermarket', subjek: 'supermarket keuangan', nilai: 'tersedianya berbagai produk jasa keuangan bagi konsumen dalam satu atap', tingkat: 'menengah', sumber: `${SLK1}, Bab 1` },
      { id: 'hybrid', subjek: 'hybrid products', nilai: 'produk berbasis teknologi yang terkait dengan produk industri jasa keuangan lain', tingkat: 'menengah', sumber: `${SLK1}, Bab 1` },
      { id: 'arbitrase', subjek: 'arbitrase peraturan', nilai: 'potensi ketentuan dua otoritas atas satu lembaga saling berbeda atau bertolak belakang', tingkat: 'menantang', sumber: `${SLK1}, Bab 1` },
      { id: 'mikro', subjek: 'pengawasan mikroprudensial', nilai: 'pengawasan yang berfokus pada kesehatan dan kinerja setiap individu LJK', tingkat: 'menengah', sumber: `${SLK1}, Bab 3` },
      { id: 'makro', subjek: 'pengawasan makroprudensial', nilai: 'pengawasan stabilitas sistem keuangan secara agregat yang dikaitkan dengan variabel makroekonomi', tingkat: 'menengah', sumber: `${SLK1}, Bab 3` },
      { id: 'market-conduct', subjek: 'market conduct', nilai: 'perilaku PUJK dalam mendesain, menawarkan, dan memperjanjikan produk serta menangani pengaduan', tingkat: 'menengah', sumber: `${SLK1}, Bab 5 (penjelasan POJK 1/POJK.07/2013)` },
    ],
  },
  {
    id: 'product-life-cycle', topik: 'pelindungan-konsumen',
    kalimat: (b) => `Tahap ${b.subjek} mencakup ${b.nilai}.`,
    tanyaNilai: (s) => `Dalam cakupan pengawasan market conduct OJK (product life cycle), tahap "${s}" mencakup ....`,
    tanyaSubjek: (n) => `Dalam pengawasan market conduct OJK, cakupan "${n}" termasuk tahap ....`,
    alasanSalah: salahUmum('cakupan tahap', 'Tahap', 'mencakup'),
    konsep: 'Cakupan market conduct mengikuti product life cycle: desain produk, penawaran produk, penjualan produk, layanan pasca jual, dan penyelesaian pengaduan atau sengketa.',
    caraCepat: 'Urutkan daur hidup produk: dirancang → ditawarkan → dijual → dilayani → diselesaikan bila bermasalah.',
    baris: [
      { id: 'desain', subjek: 'desain produk', nilai: 'penyesuaian produk dengan kebutuhan dan kemampuan segmen konsumen', tingkat: 'menengah', sumber: `${SLK1}, Bab 5` },
      { id: 'penawaran', subjek: 'penawaran produk', nilai: 'ringkasan informasi produk berisi manfaat, risiko, biaya, hak, dan kewajiban', tingkat: 'menantang', sumber: `${SLK1}, Bab 5` },
      { id: 'penjualan', subjek: 'penjualan produk', nilai: 'proses dan media pemasaran, kapabilitas pemasar, serta perjanjian baku', tingkat: 'menantang', sumber: `${SLK1}, Bab 5` },
      { id: 'pasca-jual', subjek: 'layanan pasca jual', nilai: 'aksesibilitas dan kemudahan konsumen memakai layanan setelah pembelian', tingkat: 'menengah', sumber: `${SLK1}, Bab 5` },
      { id: 'sengketa', subjek: 'penyelesaian pengaduan atau sengketa', nilai: 'penyelesaian keluhan melalui internal dan external dispute resolution', tingkat: 'menengah', sumber: `${SLK1}, Bab 5` },
    ],
  },
  // ---- QC 2 R01: tabel pengganti dari materi folder (subbab 3.1.12–3.1.17) ----
  {
    id: 'modus', topik: 'waspada-penipuan',
    kalimat: (b) => `Modus ${b.subjek} tampak ketika ${b.nilai}.`,
    tanyaNilai: (s) => `Dalam penipuan keuangan, modus ${s} tampak ketika ....`,
    tanyaSubjek: (n) => `Dalam sebuah penipuan keuangan, ${n}. Modus yang paling langsung tampak adalah ....`,
    alasanSalah: (benar, salah, arah) => arah === 'nilai'
      ? `Itu contoh modus ${salah.subjek}, bukan ${benar.subjek}.`
      : `Modus ${salah.subjek} tampak ketika ${salah.nilai}.`,
    konsep: 'Modus penipuan keuangan: penyamaran identitas pejabat, pemalsuan logo, tautan tiruan, rasa mendesak, bukti keuntungan yang tidak terverifikasi, dan aplikasi tidak resmi. Periksa melalui kanal resmi yang diakses sendiri.',
    caraCepat: 'Cari alat tipuannya: orang (menyamar), gambar (logo), alamat (tautan), waktu (mendesak), tangkapan layar (bukti keuntungan), atau aplikasi.',
    baris: [
      { id: 'menyamar', subjek: 'penyamaran identitas', nilai: 'pelaku mengaku sebagai pejabat atau petugas lembaga resmi', tingkat: 'dasar', sumber: `${EB_OJK}, subbab 3.1.13` },
      { id: 'logo', subjek: 'pemalsuan logo', nilai: 'lambang lembaga resmi dipasang pada brosur agar tampak berizin', tingkat: 'dasar', sumber: `${EB_OJK}, subbab 3.1.13` },
      { id: 'tautan', subjek: 'tautan tiruan', nilai: 'alamat situs dibuat mirip situs resmi untuk mencuri data', tingkat: 'dasar', sumber: `${EB_OJK}, subbab 3.1.13` },
      { id: 'mendesak', subjek: 'penciptaan rasa mendesak', nilai: 'korban diburu waktu agar tidak sempat memeriksa', tingkat: 'dasar', sumber: `${EB_OJK}, subbab 3.1.13` },
      { id: 'bukti', subjek: 'bukti keuntungan yang tidak terverifikasi', nilai: 'tangkapan layar saldo dan laba disebar untuk meyakinkan calon korban', tingkat: 'menengah', sumber: `${EB_OJK}, subbab 3.1.13` },
      { id: 'aplikasi', subjek: 'aplikasi tidak resmi', nilai: 'korban diminta memasang berkas yang dikirim lewat pesan pribadi', tingkat: 'dasar', sumber: `${EB_OJK}, subbab 3.1.13` },
    ],
  },
  {
    id: 'tanda-bahaya', topik: 'waspada-investasi',
    kalimat: (b) => `Tanda bahaya berupa ${b.subjek} tampak ketika ${b.nilai}.`,
    tanyaNilai: (s) => `Tanda bahaya penawaran investasi berupa ${s} tampak ketika ....`,
    tanyaSubjek: (n) => `Pada sebuah penawaran investasi, ${n}. Tanda bahaya yang paling langsung tampak adalah ....`,
    alasanSalah: (benar, salah, arah) => arah === 'nilai'
      ? `Itu contoh ${salah.subjek}, bukan ${benar.subjek}.`
      : `Tanda bahaya berupa ${salah.subjek} tampak ketika ${salah.nilai}.`,
    konsep: 'Tanda bahaya penawaran investasi: jaminan hasil tinggi dan pasti, tekanan merekrut anggota, transfer ke rekening pribadi, identitas pengelola tidak jelas, dan penolakan memberi dokumen resmi.',
    caraCepat: 'Cocokkan kejadian: janji pasti → jaminan hasil; ajak orang → perekrutan; rekening perorangan → transfer pribadi; pengelola tak dikenal → identitas; menghindari berkas → dokumen.',
    baris: [
      { id: 'hasil-pasti', subjek: 'jaminan imbal hasil tinggi dan pasti', nilai: 'penawar menjanjikan untung besar setiap pekan tanpa kemungkinan rugi', tingkat: 'dasar', sumber: `${EB_OJK}, subbab 3.1.12` },
      { id: 'rekrut', subjek: 'tekanan merekrut anggota baru', nilai: 'komisi hanya diberikan bila peserta mengajak orang lain bergabung', tingkat: 'dasar', sumber: `${EB_OJK}, subbab 3.1.12` },
      { id: 'rekening', subjek: 'permintaan transfer ke rekening pribadi', nilai: 'dana diminta dikirim ke rekening atas nama perorangan', tingkat: 'dasar', sumber: `${EB_OJK}, subbab 3.1.12` },
      { id: 'identitas', subjek: 'identitas pengelola yang tidak jelas', nilai: 'nama badan usaha dan penanggung jawabnya tidak dapat ditemukan', tingkat: 'dasar', sumber: `${EB_OJK}, subbab 3.1.12` },
      { id: 'dokumen', subjek: 'penolakan memberikan dokumen resmi', nilai: 'permintaan salinan izin dan perjanjian selalu dihindari', tingkat: 'dasar', sumber: `${EB_OJK}, subbab 3.1.12` },
    ],
  },
  {
    id: 'anggapan-keliru', topik: 'kesalahan-konsep',
    kalimat: (b) => `Anggapan "${b.subjek}" keliru karena ${b.nilai}.`,
    tanyaNilai: (s) => `Anggapan "${s}" keliru karena ....`,
    alasanSalah: (benar, salah) => `Alasan itu membantah anggapan lain, yaitu "${salah.subjek}".`,
    konsep: 'Kesalahan konseptual yang sering muncul: menyamakan izin dengan jaminan untung, pengawasan dengan penjaminan, dan pelaporan dengan pengembalian dana.',
    caraCepat: 'Cari alasan yang membantah kata kunci anggapan itu sendiri.',
    baris: [
      { id: 'pasti-untung', subjek: 'setiap investasi melalui entitas berizin pasti untung', nilai: 'status kegiatan tidak menghapus risiko pasar', tingkat: 'dasar', sumber: `${EB_OJK}, subbab 3.1.17` },
      { id: 'hanya-ojk', subjek: 'semua layanan keuangan hanya diawasi OJK', nilai: 'terdapat kewenangan BI dan otoritas lain', tingkat: 'menengah', sumber: `${EB_OJK}, subbab 3.1.17` },
      { id: 'semua-lps', subjek: 'seluruh simpanan dan investasi dijamin LPS', nilai: 'penjaminan simpanan mempunyai syarat dan lingkup khusus', tingkat: 'dasar', sumber: `${EB_OJK}, subbab 3.1.9 dan 3.1.17` },
      { id: 'lima-prinsip', subjek: 'prinsip pelindungan konsumen masih hanya lima', nilai: 'ketentuan terbaru memuat tujuh prinsip', tingkat: 'menengah', sumber: `${EB_OJK}, subbab 3.1.10 dan 3.1.17`, berlakuPer: POJK22 },
      { id: 'kebal', subjek: 'OJK tidak dapat dimintai pertanggungjawaban karena independen', nilai: 'independensi harus dipasangkan dengan akuntabilitas', tingkat: 'menengah', sumber: `${EB_OJK}, subbab 3.1.3` },
      { id: 'semua-kegiatan', subjek: 'tercatat dalam daftar OJK berarti boleh menjalankan semua kegiatan', nilai: 'legalitas harus sesuai badan hukum, produk, kegiatan, dan status terbaru', tingkat: 'menengah', sumber: `${EB_OJK}, subbab 3.1.8` },
      { id: 'dana-kembali', subjek: 'melapor kepada Satgas PASTI menjamin dana kembali', nilai: 'pengembalian dana bergantung pada fakta, proses, dan mekanisme hukum', tingkat: 'menengah', sumber: `${EB_OJK}, subbab 3.1.14` },
    ],
  },
];
