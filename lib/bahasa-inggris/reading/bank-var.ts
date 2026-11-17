import type { BacaanBank } from './model';

// Bank RC-VAR (VARIASI): bacaan panjang dengan tipe pertanyaan tambahan yang belum teramati pada contoh riset OJK:
// NOT/EXCEPT, sikap/nada penulis, dan kosakata dalam konteks, dipadukan dengan tipe teramati. Bacaan ditulis baru.
// Paling banyak satu soal global (sikap penulis/gagasan utama) per bacaan; pengecoh sikap berupa sikap wajar lain yang
// berbeda arah atau berbeda objek. Opsi tidak diakhiri titik (aturan satu bacaan, satu tanda akhir).
// opsi[0] = kunci (pada soal NOT: satu-satunya opsi yang tidak didukung bacaan).

const T_MAKNA = 'What is the meaning of the following sentence from the passage?';
const kosakata = (kata: string, p: number) => `The word "${kata}" in paragraph ${p} is closest in meaning to`;

export const BANK_VAR: BacaanBank[] = [
  {
    id: 'kantor-hibrida', judul: 'The Office as a Meeting Place', konteks: 'kantor & organisasi',
    paragraf: [
      `Since remote work became common, many companies have discovered that their offices sit half empty on most days. Rather than simply giving up space, some firms are redesigning their workplaces around the activities that are difficult to do from home. Rows of identical desks are being replaced with meeting rooms, quiet booths for concentrated work and open areas where teams can plan projects together.`,
      `The change reflects a shift in what employees expect from the office. Surveys suggest that staff are willing to commute when they know colleagues will be there and when the day includes collaboration they cannot easily arrange online. They are far less willing to travel simply to answer emails at a desk they could have used at home.`,
      `Redesigning an office is not cheap, and managers face difficult choices. If too few desks remain, employees who prefer to work on site may struggle to find a seat on busy days. To avoid this, several firms now ask teams to agree on shared office days and use booking systems to track how space is actually used.`,
      `These experiments deserve to succeed. An office designed for teamwork gives people a reason to come in that a desk at home cannot offer, and that makes it well worth the cost.`,
    ],
    soal: [
      {
        id: 'not-fitur', tipe: 'not', tingkat: 'menengah', tanya: 'According to the passage, which of the following is NOT mentioned as a feature of the redesigned workplaces?',
        opsi: [
          { t: 'Private gyms for staff fitness', j: 'tidak-disebut', a: 'Paragraf 1 menyebut ruang rapat, bilik tenang, dan area terbuka; pusat kebugaran tidak disebut.' },
          { t: 'Rooms for holding meetings', j: 'didukung', b: ['replaced with meeting rooms'], f: [['Rooms for holding meetings', 'meeting rooms']], a: 'Ruang rapat disebut sebagai pengganti deretan meja.' },
          { t: 'Quiet spaces for focused work', j: 'didukung', b: ['quiet booths for concentrated work'], f: [['Quiet spaces', 'quiet booths'], ['focused work', 'concentrated work']], a: 'Bilik tenang untuk kerja yang membutuhkan konsentrasi disebut.' },
          { t: 'Open areas where teams plan together', j: 'didukung', b: ['open areas where teams can plan projects together'], f: [['Open areas', 'open areas'], ['teams plan together', 'teams can plan projects together']], a: 'Area terbuka untuk merencanakan proyek bersama disebut.' },
        ],
      },
      {
        id: 'kata-reflects', tipe: 'kosakata', tingkat: 'menantang', tanya: kosakata('reflects', 2), sasaran: 'reflects',
        opsi: [
          { t: 'shows', j: 'didukung', b: ['The change reflects a shift in what employees expect'], f: [['shows', 'reflects']],
            a: 'Subjeknya adalah perubahan desain kantor, dan yang dicerminkannya adalah pergeseran harapan karyawan yang dijelaskan kalimat-kalimat berikutnya. Reflects di sini berarti menunjukkan atau menjadi tanda.' },
          { t: 'causes', j: 'salah-tafsir', b: ['The change reflects a shift in what employees expect'],
            a: 'Arahnya terbalik: perubahan desain kantor adalah tanda dari pergeseran harapan karyawan, bukan penyebabnya; survei menunjukkan harapan itulah yang mendorong perubahan.' },
          { t: 'thinks about', j: 'salah-tafsir', b: ['The change reflects a shift in what employees expect'],
            a: 'Reflect on berarti merenungkan, tetapi subjeknya harus orang; sebuah perubahan tidak dapat merenung.' },
          { t: 'throws back', j: 'salah-tafsir', b: ['The change reflects a shift in what employees expect'],
            a: 'Reflect dapat berarti memantulkan cahaya atau bunyi, makna harfiah yang tidak cocok untuk perubahan dan harapan karyawan.' },
        ],
      },
      {
        id: 'sikap', tipe: 'sikap-penulis', tingkat: 'menantang', tanya: "Which of the following best describes the author's attitude toward redesigned offices?",
        opsi: [
          { t: 'Strongly supportive of offices built around teamwork', j: 'didukung',
            b: ['These experiments deserve to succeed', 'An office designed for teamwork gives people a reason to come in'],
            f: [['Strongly supportive', 'These experiments deserve to succeed'], ['offices built around teamwork', 'An office designed for teamwork']],
            a: 'Paragraf 1–3 menjelaskan perubahan beserta biayanya secara netral, tetapi paragraf 4 memuat penilaian penulis yang tegas: percobaan ini layak berhasil, dan kantor untuk kerja bersama sepadan dengan biayanya. Kata strongly didukung oleh penilaian tanpa syarat itu.' },
          { t: 'Doubtful that staff will come in just to see colleagues', j: 'bertentangan', b: ['staff are willing to commute when they know colleagues will be there'],
            a: 'Survei di paragraf 2 menyebut staf bersedia datang bila tahu rekan kerja ada di kantor, dan penulis menilai kantor untuk kerja bersama memberi alasan untuk datang.' },
          { t: 'Supportive of the redesign, though unsure it is worth the cost', j: 'bertentangan', b: ['that makes it well worth the cost'],
            a: 'Bagian pertamanya benar, tetapi bagian keduanya salah: penulis justru menyatakan kantor seperti itu sangat sepadan dengan biayanya.' },
          { t: 'Cautious until booking systems show how space is used', j: 'bertentangan',
            b: ['use booking systems to track how space is actually used', 'These experiments deserve to succeed'],
            a: 'Sistem pemesanan disebut sebagai cara perusahaan memantau pemakaian ruang, bukan syarat penulis sebelum mendukung; penulis sudah menyatakan percobaan ini layak berhasil.' },
        ],
      },
      {
        id: 'hari-bersama', tipe: 'hubungan', tingkat: 'menengah', tanya: 'According to the passage, why do some firms ask teams to agree on shared office days?',
        opsi: [
          { t: 'To prevent a shortage of seats on crowded days', j: 'didukung',
            b: ['may struggle to find a seat on busy days', 'To avoid this, several firms now ask teams'],
            f: [['shortage of seats', 'struggle to find a seat'], ['crowded days', 'busy days']],
            a: 'To avoid this merujuk pada masalah di kalimat sebelumnya: bila meja terlalu sedikit, karyawan sulit mendapat tempat duduk pada hari ramai.' },
          { t: 'To reduce the cost of commuting for employees', j: 'detail-salah', b: ['staff are willing to commute'],
            a: 'Perjalanan ke kantor disebut di paragraf 2, tetapi biaya perjalanan tidak dikaitkan dengan hari kantor bersama.' },
          { t: 'To give managers more time to answer emails', j: 'tidak-disebut', a: 'Waktu manajer untuk membalas email tidak disebut.' },
          { t: 'To cut the number of meeting rooms they need', j: 'detail-salah', b: ['replaced with meeting rooms'],
            a: 'Ruang rapat justru ditambahkan dalam desain baru; bacaan tidak mengaitkan hari kantor bersama dengan pengurangan ruang rapat.' },
        ],
      },
    ],
  },
  {
    id: 'bising-kota', judul: 'The Overlooked Pollutant', konteks: 'kesehatan masyarakat',
    paragraf: [
      `When people think about pollution, they usually imagine dirty air or contaminated water. Noise is rarely given the same attention, partly because it leaves no visible trace. Yet health researchers increasingly treat persistent traffic noise as an environmental hazard rather than a mere annoyance.`,
      `The concern is not that noise damages hearing, which usually requires far louder sounds. Instead, studies suggest that constant background noise disturbs sleep and keeps the body in a mild state of stress. Over many years, this has been linked to higher blood pressure and a greater risk of heart disease. Children who attend schools near busy roads or airports have also been found to perform less well on reading tests.`,
      `Reducing noise is technically possible but rarely simple. Quieter road surfaces, lower speed limits and noise barriers can all help, and well-insulated windows protect people indoors. However, these measures cost money, and their benefits are spread thinly across many households, which makes them easy for local governments to postpone.`,
      `Some researchers believe the issue will receive more attention only when noise is measured as routinely as air quality. Until then, they fear, its effects on health will continue to be underestimated.`,
    ],
    soal: [
      {
        id: 'not-cara', tipe: 'not', tingkat: 'menengah', tanya: 'Which of the following is NOT mentioned in the passage as a way to reduce noise?',
        opsi: [
          { t: 'Banning night flights at airports', j: 'tidak-disebut', a: 'Bandara hanya disebut sebagai lokasi sekolah yang bising; larangan penerbangan malam tidak disebut.' },
          { t: 'Laying quieter surfaces on roads', j: 'didukung', b: ['Quieter road surfaces'], f: [['quieter surfaces on roads', 'Quieter road surfaces']], a: 'Permukaan jalan yang lebih senyap disebut.' },
          { t: 'Reducing the speed at which cars may travel', j: 'didukung', b: ['lower speed limits'], f: [['Reducing the speed', 'lower speed limits']], a: 'Batas kecepatan yang lebih rendah disebut.' },
          { t: 'Fitting homes with better-insulated windows', j: 'didukung', b: ['well-insulated windows protect people indoors'], f: [['better-insulated windows', 'well-insulated windows']], a: 'Jendela berinsulasi baik disebut melindungi orang di dalam ruangan.' },
        ],
      },
      {
        id: 'dampak', tipe: 'hubungan', tingkat: 'menengah', tanya: 'According to the passage, how does constant background noise affect people?',
        opsi: [
          { t: 'By disturbing sleep and keeping the body under mild stress', j: 'didukung',
            b: ['constant background noise disturbs sleep and keeps the body in a mild state of stress'],
            f: [['disturbing sleep', 'disturbs sleep'], ['under mild stress', 'in a mild state of stress']],
            a: 'Instead di paragraf 2 mengoreksi anggapan umum: masalahnya bukan pendengaran, melainkan tidur yang terganggu dan tubuh yang terus berada dalam keadaan stres ringan; dalam jangka panjang hal ini dikaitkan dengan tekanan darah tinggi dan penyakit jantung.' },
          { t: 'By slowly damaging the hearing of people who live nearby', j: 'bertentangan', b: ['The concern is not that noise damages hearing'],
            a: 'Jawaban ini sesuai anggapan umum, tetapi paragraf 2 menegaskan kerusakan pendengaran biasanya memerlukan suara yang jauh lebih keras dan bukan kekhawatiran utamanya.' },
          { t: 'By causing headaches and sore eyes in people near busy roads', j: 'tidak-disebut',
            a: 'Sakit kepala dan mata perih tidak disebut; yang disebut adalah gangguan tidur, stres ringan, tekanan darah, dan penyakit jantung.' },
          { t: "By lowering children's scores on science tests at school", j: 'detail-salah', b: ['perform less well on reading tests'],
            a: 'Bacaan menyebut nilai tes membaca, bukan tes sains; itu pun dampak pada belajar, bukan cara kebisingan merusak kesehatan.' },
        ],
      },
      {
        id: 'sikap', tipe: 'sikap-penulis', tingkat: 'menantang', tanya: "The author's attitude toward the way noise is currently treated can best be described as",
        opsi: [
          { t: 'worried that the health risks of noise are overlooked', j: 'didukung',
            b: ['Noise is rarely given the same attention', 'its effects on health will continue to be underestimated'],
            f: [['health risks of noise', 'its effects on health'], ['overlooked', 'underestimated']],
            a: 'Penulis menyoroti bahwa kebisingan jarang diperhatikan seperti polusi lain (paragraf 1), langkah penanganannya mudah ditunda (paragraf 3), dan dampaknya pada kesehatan akan terus diremehkan (paragraf 4). Sikapnya satu arah: khawatir bahwa risiko kesehatannya terabaikan.' },
          { t: "worried that noise is slowly damaging people's hearing", j: 'bertentangan', b: ['The concern is not that noise damages hearing'],
            a: 'Arah sikapnya sama (khawatir), tetapi objeknya salah: paragraf 2 menegaskan kekhawatirannya bukan kerusakan pendengaran, melainkan gangguan tidur, stres, dan kesehatan jantung.' },
          { t: 'hopeful that cities will soon measure noise like air quality', j: 'salah-tafsir',
            b: ['when noise is measured as routinely as air quality', 'Until then, they fear, its effects on health'],
            a: 'Pengukuran kebisingan seperti mutu udara disebut sebagai syarat agar masalah ini diperhatikan, bukan sesuatu yang segera terjadi; sampai saat itu para peneliti justru khawatir.' },
          { t: 'concerned about noise, but sure quieter roads will fix it', j: 'bertentangan', b: ['Reducing noise is technically possible but rarely simple'],
            a: 'Bagian pertamanya benar, tetapi bagian keduanya salah: penulis menyebut pengurangan bising jarang sederhana, mahal, dan mudah ditunda pemerintah daerah.' },
        ],
      },
      {
        id: 'kata-persistent', tipe: 'kosakata', tingkat: 'menantang', tanya: kosakata('persistent', 1), sasaran: 'persistent',
        opsi: [
          { t: 'continuing', j: 'didukung', b: ['persistent traffic noise'], f: [['continuing', 'persistent']],
            a: 'Persistent traffic noise adalah kebisingan lalu lintas yang berlangsung terus; paragraf 2 menyebutnya constant background noise.' },
          { t: 'determined', j: 'salah-tafsir', b: ['persistent traffic noise'], a: 'Determined (gigih) adalah makna persistent untuk orang, tidak cocok untuk kebisingan lalu lintas.' },
          { t: 'extremely loud', j: 'salah-tafsir', b: ['persistent traffic noise'], a: 'Kalimat tidak menekankan kerasnya suara; paragraf 2 bahkan menyebut masalahnya bukan suara yang sangat keras.' },
          { t: 'occasional', j: 'salah-tafsir', b: ['persistent traffic noise'], a: 'Occasional (sesekali) berlawanan dengan persistent.' },
        ],
      },
    ],
  },
  {
    id: 'penilaian-ai', judul: 'Machines That Mark Essays', konteks: 'pendidikan & teknologi',
    paragraf: [
      `Marking essays is one of the most time-consuming parts of a teacher's job. A secondary school teacher with five classes may spend an entire weekend marking a single assignment, leaving less time to plan lessons or give individual feedback. It is therefore not surprising that software which scores written work automatically has attracted considerable interest.`,
      `Supporters argue that such programs are fast and consistent. Unlike a tired teacher, a computer applies the same criteria to the first essay and the hundredth, and it can return results within seconds. Some systems also highlight common errors, allowing students to revise their work before submitting a final version.`,
      `Critics, however, question what these programs actually measure. Because the software learns from patterns in previously marked essays, it may reward length, complex vocabulary and familiar structures rather than original thinking. In one widely reported test, a deliberately meaningless essay filled with sophisticated words received a high score.`,
      `A sensible approach may be to treat automated scoring as an assistant rather than a judge. Used for practice drafts, it can give students quick guidance; for final grades, a human reader still seems essential.`,
    ],
    soal: [
      {
        id: 'kata-interest', tipe: 'kosakata', tingkat: 'menantang', tanya: kosakata('interest', 1), sasaran: 'interest',
        opsi: [
          { t: 'attention', j: 'didukung', b: ['has attracted considerable interest'], f: [['attention', 'interest']],
            a: 'Subjeknya perangkat lunak penilai esai, dan therefore not surprising menghubungkannya dengan beban guru: program itu banyak menarik perhatian. Interest di sini berarti perhatian atau minat.' },
          { t: 'borrowing cost', j: 'salah-tafsir', b: ['has attracted considerable interest'],
            a: 'Dalam keuangan interest berarti bunga pinjaman, tetapi kalimat ini membicarakan tanggapan terhadap perangkat lunak, bukan uang.' },
          { t: 'pastime', j: 'salah-tafsir', b: ['has attracted considerable interest'],
            a: 'Interest dapat berarti kegemaran atau hobi seseorang, tetapi perangkat lunak tidak "menarik kegemaran".' },
          { t: 'personal gain', j: 'salah-tafsir', b: ['has attracted considerable interest'],
            a: 'Self-interest berarti kepentingan pribadi; makna itu tidak cocok dengan perangkat lunak yang menarik perhatian banyak orang.' },
        ],
      },
      {
        id: 'not-kelebihan', tipe: 'not', tingkat: 'menengah', tanya: 'According to the passage, which of the following is NOT given as an advantage of automated scoring?',
        opsi: [
          { t: 'It rewards original thinking more than length', j: 'bertentangan', b: ['it may reward length, complex vocabulary and familiar structures rather than original thinking'],
            a: 'Paragraf 3 menyatakan kebalikannya: perangkat lunak mungkin lebih menghargai panjang tulisan daripada pemikiran orisinal.' },
          { t: 'It gives students their scores almost instantly', j: 'didukung', b: ['it can return results within seconds'], f: [['almost instantly', 'within seconds']], a: 'Hasil dapat dikembalikan dalam hitungan detik.' },
          { t: 'It uses the same standard for every essay', j: 'didukung', b: ['applies the same criteria to the first essay and the hundredth'], f: [['the same standard for every essay', 'the same criteria to the first essay and the hundredth']], a: 'Kriteria yang sama dipakai dari esai pertama sampai keseratus.' },
          { t: 'It points out frequent mistakes before final submission', j: 'didukung', b: ['Some systems also highlight common errors'], f: [['points out frequent mistakes', 'highlight common errors']], a: 'Sebagian sistem menandai kesalahan umum sebelum versi akhir dikumpulkan.' },
        ],
      },
      {
        // batang soal sengaja tidak menyebut "panjang dan kosakata rumit" agar tidak membocorkan soal NOT kelebihan
        id: 'sebab-pola', tipe: 'detail', tingkat: 'menengah', tanya: 'According to the passage, how does the software decide what score to give an essay?',
        opsi: [
          { t: 'It copies patterns from essays marked before', j: 'didukung', b: ['Because the software learns from patterns in previously marked essays'],
            f: [['copies patterns from essays marked before', 'learns from patterns in previously marked essays']],
            a: 'Paragraf 3 menyebut cara kerjanya: perangkat lunak belajar dari pola esai yang sudah dinilai sebelumnya.' },
          { t: 'It follows rules written by its designers', j: 'tidak-disebut', a: 'Jawaban ini terdengar masuk akal, tetapi aturan buatan perancang tidak disebut.' },
          { t: 'It checks spelling before it checks meaning', j: 'tidak-disebut', a: 'Urutan pemeriksaan ejaan dan makna tidak disebut.' },
          { t: "It compares each essay with a teacher's answer", j: 'tidak-disebut', a: 'Jawaban model dari guru tidak disebut; guru hanya disebut sebagai pihak yang terbebani penilaian.' },
        ],
      },
      {
        id: 'sikap', tipe: 'sikap-penulis', tingkat: 'menantang', tanya: "Which of the following best describes the author's view of automated essay scoring?",
        opsi: [
          { t: 'Useful for practice, but no replacement for human readers', j: 'didukung',
            b: ['treat automated scoring as an assistant rather than a judge', 'Used for practice drafts, it can give students quick guidance', 'a human reader still seems essential'],
            f: [['Useful for practice', 'Used for practice drafts'], ['no replacement for human readers', 'a human reader still seems essential']],
            a: 'Paragraf 4 memuat pendapat penulis: penilaian otomatis sebaiknya menjadi asisten, bukan hakim; berguna untuk draf latihan, sedangkan nilai akhir tetap memerlukan pembaca manusia.' },
          { t: 'Opposed to it, even though it is fast and consistent', j: 'bertentangan',
            b: ['Supporters argue that such programs are fast and consistent', 'Used for practice drafts, it can give students quick guidance'],
            a: 'Pendapat pengkritik di paragraf 3 bukan pendapat penulis; di paragraf 4 penulis menilai perangkat lunak itu berguna untuk draf latihan.' },
          { t: 'Hopeful it will soon be fair enough for final grades', j: 'bertentangan', b: ['a human reader still seems essential'],
            a: 'Untuk nilai akhir, penulis menyatakan pembaca manusia tetap penting; tidak ada harapan bahwa perangkat lunak segera layak menggantikannya.' },
          { t: 'Keen to use it for final grades, but worried about its price', j: 'bertentangan', b: ['a human reader still seems essential'],
            a: 'Harga perangkat lunak tidak dibahas, dan penulis justru tidak ingin memakainya untuk nilai akhir.' },
        ],
      },
    ],
  },
  {
    id: 'bus-listrik', judul: 'Switching to Electric Buses', konteks: 'lingkungan & energi',
    paragraf: [
      `A growing number of cities are replacing diesel buses with electric ones. Electric buses produce no exhaust fumes on the street, which improves air quality along busy routes, and they are considerably quieter. Their motors also recover energy each time the bus brakes, which suits routes with frequent stops. Over their lifetime they can be cheaper to run, because electricity usually costs less than diesel and electric motors need less maintenance. Whether they also cut carbon emissions depends on how the local electricity is produced.`,
      `The initial investment, however, is substantial. An electric bus can cost significantly more to purchase than a diesel model, and depots must be fitted with charging equipment and stronger connections to the power grid. Transport authorities with limited budgets often spread the transition over a decade or more, replacing older buses only when they reach the end of their working lives.`,
      `Operators have also had to adjust their schedules. Early electric buses could not always complete a full day of service on one charge, especially in cold weather, when heating the passenger area drains the battery. Some cities solved this by installing fast chargers at the end of certain routes, allowing buses to top up during short breaks.`,
      `Battery technology continues to improve, and newer models can travel considerably further than those bought only a few years ago.`,
    ],
    soal: [
      {
        id: 'not-manfaat', tipe: 'not', tingkat: 'menengah', tanya: 'Which of the following is NOT given in the passage as a benefit of electric buses?',
        opsi: [
          { t: "They lower a city's carbon emissions", j: 'bertentangan', b: ['Whether they also cut carbon emissions depends on how the local electricity is produced'],
            a: 'Jawaban ini sesuai anggapan umum, tetapi paragraf 1 tidak menyebutnya sebagai manfaat: apakah bus listrik juga mengurangi emisi karbon bergantung pada cara listrik setempat dihasilkan.' },
          { t: 'They recover energy when braking', j: 'didukung', b: ['Their motors also recover energy each time the bus brakes'],
            f: [['recover energy', 'recover energy'], ['when braking', 'each time the bus brakes']], a: 'Motornya memulihkan energi setiap kali bus mengerem.' },
          { t: 'They are much quieter than diesel buses', j: 'didukung', b: ['they are considerably quieter'], f: [['much quieter', 'considerably quieter']], a: 'Bus listrik jauh lebih senyap.' },
          { t: 'They usually cost less to maintain', j: 'didukung', b: ['electric motors need less maintenance'], f: [['cost less to maintain', 'need less maintenance']], a: 'Motor listrik memerlukan perawatan yang lebih sedikit.' },
        ],
      },
      {
        id: 'bertahap', tipe: 'hubungan', tingkat: 'menengah', tanya: 'According to the passage, why do some transport authorities replace their buses gradually?',
        opsi: [
          { t: 'They cannot afford the high upfront costs all at once', j: 'didukung',
            b: ['The initial investment, however, is substantial', 'Transport authorities with limited budgets often spread the transition'],
            f: [['high upfront costs', 'initial investment'], ['cannot afford', 'limited budgets']],
            a: 'Investasi awal bus listrik dan depo sangat besar, sehingga otoritas dengan anggaran terbatas menyebar peralihan selama satu dekade atau lebih.' },
          { t: 'Older buses must be kept until their batteries wear out', j: 'detail-salah', b: ['replacing older buses only when they reach the end of their working lives'],
            a: 'Bus lama diganti ketika masa pakainya habis; baterai tidak disebut untuk bus lama (bus diesel).' },
          { t: 'Drivers need several years of training', j: 'tidak-disebut', a: 'Pelatihan pengemudi tidak disebut.' },
          { t: 'Electric buses are more expensive to run each year', j: 'bertentangan', b: ['they can be cheaper to run'],
            a: 'Biaya operasional bus listrik justru bisa lebih murah sepanjang masa pakainya.' },
        ],
      },
      {
        id: 'kata-drains', tipe: 'kosakata', tingkat: 'menantang', tanya: kosakata('drains', 3), sasaran: 'drains',
        opsi: [
          { t: 'uses up', j: 'didukung', b: ['heating the passenger area drains the battery'], f: [['uses up', 'drains']],
            a: 'Pemanas ruang penumpang menghabiskan daya baterai, itulah sebabnya bus tidak selalu mampu beroperasi sehari penuh.' },
          { t: 'lets water out', j: 'salah-tafsir', b: ['heating the passenger area drains the battery'], a: 'Drain secara harfiah berarti mengalirkan air keluar, tetapi yang dikenai di sini adalah baterai, jadi maknanya menghabiskan.' },
          { t: 'cools down', j: 'salah-tafsir', b: ['heating the passenger area drains the battery'], a: 'Cuaca dingin disebut, tetapi drains menjelaskan apa yang terjadi pada daya baterai, bukan suhunya.' },
          { t: 'charges', j: 'salah-tafsir', b: ['heating the passenger area drains the battery'], a: 'Charge berarti mengisi daya, berlawanan dengan menghabiskan.' },
        ],
      },
      {
        id: 'inferensi-baterai', tipe: 'inferensi', tingkat: 'menantang', tanya: 'What can be inferred from the final paragraph about the problem described in paragraph 3?',
        opsi: [
          { t: 'It is likely to become less of a problem as batteries improve', j: 'didukung',
            b: ['could not always complete a full day of service on one charge', 'Battery technology continues to improve'],
            f: [['as batteries improve', 'Battery technology continues to improve'], ['less of a problem', 'newer models can travel considerably further']],
            a: 'Masalah di paragraf 3 adalah jarak tempuh satu kali pengisian yang terbatas. Karena model baru dapat menempuh jarak jauh lebih panjang, masalah itu kemungkinan makin berkurang.' },
          { t: 'It will remain unless every route gets a fast charger', j: 'salah-tafsir', b: ['installing fast chargers at the end of certain routes'],
            a: 'Pengisi daya cepat dipasang hanya di ujung rute tertentu, dan paragraf terakhir menunjukkan baterai baru menempuh jarak lebih jauh; jadi pengisi daya di setiap rute bukan satu-satunya jalan keluar.' },
          { t: 'It mostly affects buses on short city routes', j: 'tidak-disebut', a: 'Bacaan tidak menyebut rute pendek lebih terdampak; masalahnya menyelesaikan layanan sehari penuh, terutama saat cuaca dingin.' },
          { t: 'It affects diesel buses more than electric ones', j: 'detail-salah', b: ['replacing diesel buses with electric ones'],
            a: 'Masalah daya baterai hanya dialami bus listrik, bukan bus diesel.' },
        ],
      },
    ],
  },
  {
    id: 'replikasi', judul: 'Repeating the Experiment', konteks: 'riset',
    paragraf: [
      `A basic principle of science is that a result should hold up when other researchers repeat the experiment. In the past decade, however, large projects that attempted to repeat published studies in psychology, medicine and economics have reported worrying findings. In some fields, fewer than half of the original results could be reproduced with the same strength.`,
      `Researchers have identified several reasons. Many studies rely on small samples, which makes chance results more likely. Journals have traditionally preferred to publish surprising, positive findings, so studies that find no effect often remain unpublished. And because careers depend on publications, scientists may feel pressure to analyse their data in many ways until something appears significant.`,
      `The response has been encouraging. A growing number of journals now ask researchers to register their methods and planned analyses before collecting data, which makes it harder to change the question after seeing the results. Others publish replication studies regardless of their outcome, and funding bodies have started to support projects that repeat important experiments.`,
      `None of this means that science is broken. If anything, the willingness to examine its own failures shows that the system of checking and correction is working, if more slowly than many would like.`,
    ],
    soal: [
      {
        id: 'not-sebab', tipe: 'not', tingkat: 'menengah', tanya: 'Which of the following is NOT mentioned as a cause of results that cannot be reproduced?',
        opsi: [
          { t: 'Fraudulent data invented by researchers', j: 'tidak-disebut', a: 'Paragraf 2 menyebut sampel kecil, bias penerbitan, dan tekanan analisis; pemalsuan data tidak disebut.' },
          { t: 'Studies based on too few participants', j: 'didukung', b: ['Many studies rely on small samples'], f: [['too few participants', 'small samples']], a: 'Sampel kecil disebut membuat hasil kebetulan lebih mungkin.' },
          { t: 'A preference for publishing positive results', j: 'didukung', b: ['preferred to publish surprising, positive findings'], f: [['preference for publishing positive results', 'preferred to publish surprising, positive findings']], a: 'Jurnal cenderung menerbitkan temuan positif yang mengejutkan.' },
          { t: 'Pressure to keep testing data until it looks significant', j: 'didukung', b: ['scientists may feel pressure to analyse their data'], f: [['Pressure', 'feel pressure'], ['until it looks significant', 'until something appears significant']], a: 'Ilmuwan dapat merasa tertekan menganalisis data berkali-kali sampai muncul hasil signifikan.' },
        ],
      },
      {
        id: 'kata-register', tipe: 'kosakata', tingkat: 'menantang', tanya: kosakata('register', 3), sasaran: 'register',
        opsi: [
          { t: 'formally record', j: 'didukung', b: ['ask researchers to register their methods'], f: [['formally record', 'register']],
            a: 'Peneliti diminta mencatatkan metode dan rencana analisis secara resmi sebelum mengumpulkan data, agar pertanyaan tidak dapat diubah setelah hasil terlihat.' },
          { t: 'become aware of', j: 'salah-tafsir', b: ['ask researchers to register their methods'], a: 'Register dapat berarti menyadari (it did not register), tetapi di sini peneliti diminta melakukan sesuatu terhadap metode mereka sebelum mengumpulkan data.' },
          { t: 'sign up for', j: 'salah-tafsir', b: ['ask researchers to register their methods'], a: 'Register for berarti mendaftar untuk ikut sesuatu; yang dicatatkan di sini adalah metode, bukan peneliti yang ikut serta.' },
          { t: 'measure', j: 'salah-tafsir', b: ['ask researchers to register their methods'], a: 'Register dapat berarti menunjukkan angka pada alat ukur, makna yang tidak cocok untuk metode penelitian.' },
        ],
      },
      {
        id: 'makna-separuh', tipe: 'makna-kalimat', tingkat: 'menantang', tanya: T_MAKNA, kalimat: 'fewer than half of the original results could be reproduced',
        opsi: [
          { t: 'Only a minority of results held up as strongly when repeated in some fields', j: 'didukung', b: ['fewer than half of the original results could be reproduced'],
            f: [['in some fields', 'In some fields'], ['Only a minority of results', 'fewer than half of the original results'], ['held up as strongly when repeated', 'could be reproduced with the same strength']],
            a: 'Bila kurang dari separuh hasil asli dapat diulang dengan kekuatan yang sama, hanya sebagian kecil (minoritas) hasil yang bertahan sekuat semula. Pernyataan ini terbatas pada sebagian bidang, bukan semua bidang.' },
          { t: 'In some fields, fewer than half of all the studies have ever been repeated', j: 'salah-tafsir', b: ['fewer than half of the original results could be reproduced'],
            a: 'Bentuknya meniru kalimat asli, tetapi maknanya bergeser: fewer than half merujuk pada hasil yang berhasil diulang dengan kekuatan sama, bukan pada studi yang pernah dicoba diulang.' },
          { t: 'Repeated results came out only half as strong as the originals in some fields', j: 'salah-tafsir', b: ['fewer than half of the original results could be reproduced'],
            a: 'Separuh dalam kalimat adalah bagian dari jumlah hasil, bukan ukuran kekuatan setiap hasil yang diulang.' },
          { t: 'Original results grew stronger each time they were repeated', j: 'bertentangan', b: ['fewer than half of the original results could be reproduced'],
            a: 'Kalimat menyatakan sebagian besar hasil tidak dapat diulang dengan kekuatan yang sama, bukan makin kuat.' },
        ],
      },
      {
        id: 'sikap', tipe: 'sikap-penulis', tingkat: 'menantang', tanya: "Which of the following best describes the author's attitude toward the problem of unreproducible results?",
        opsi: [
          { t: 'Worried by the findings, yet encouraged by the reforms', j: 'didukung',
            b: ['have reported worrying findings', 'The response has been encouraging', 'None of this means that science is broken'],
            f: [['Worried by the findings', 'worrying findings'], ['encouraged by the reforms', 'The response has been encouraging']],
            a: 'Penulis menyebut temuannya mengkhawatirkan (paragraf 1), tetapi menilai tanggapannya menggembirakan (paragraf 3) dan menegaskan ilmu pengetahuan tidak rusak (paragraf 4).' },
          { t: 'Doubtful that the response will make much difference', j: 'bertentangan', b: ['The response has been encouraging'],
            a: 'Penulis justru menilai tanggapan itu menggembirakan dan menunjukkan sistem pemeriksaan ilmu pengetahuan berjalan.' },
          { t: 'Alarmed that science can no longer be trusted', j: 'bertentangan', b: ['None of this means that science is broken'],
            a: 'Arahnya terlalu jauh: penulis prihatin, tetapi menegaskan ilmu pengetahuan tidak rusak.' },
          { t: 'Hopeful that a few reforms will end the problem quickly', j: 'salah-tafsir', b: ['if more slowly than many would like'],
            a: 'Penulis memang menilai tanggapannya menggembirakan, tetapi menyebut sistem koreksi bekerja lebih lambat daripada yang diharapkan banyak orang; ia tidak berharap masalahnya cepat selesai.' },
        ],
      },
    ],
  },
  {
    id: 'langganan', judul: 'The Hidden Cost of Subscriptions', konteks: 'ekonomi umum',
    paragraf: [
      `Subscriptions have become a normal part of household spending. Music, films, software, meal kits and even razors can now be paid for automatically each month. For companies, the model provides predictable income; for customers, it offers convenience and often a lower price than buying items one at a time.`,
      `However, consumer researchers have found that people frequently underestimate how much they spend on such services. Small monthly charges attract little attention, especially when they are taken directly from a bank card. Many customers also sign up for free trials and forget to cancel before the first payment is due. In one survey, participants guessed that they spent about half of what their statements later showed.`,
      `Several simple habits can help. Financial advisers suggest listing every subscription and its annual, rather than monthly, cost, which makes the total easier to judge. Setting a calendar reminder a few days before a trial ends allows people to decide deliberately instead of by default.`,
      `Some governments are also considering rules that would require companies to make cancelling as easy as signing up. Consumer groups argue that such rules would reward businesses that keep customers through good service rather than through forgotten payments.`,
    ],
    soal: [
      {
        id: 'survei', tipe: 'detail', tingkat: 'dasar', tanya: 'According to the passage, what did participants in one survey do?',
        opsi: [
          { t: 'They guessed their spending at roughly half of the real amount', j: 'didukung', b: ['participants guessed that they spent about half'],
            f: [['roughly half', 'about half'], ['the real amount', 'what their statements later showed']],
            a: 'Peserta survei memperkirakan pengeluarannya hanya sekitar separuh dari angka yang kemudian tercantum di laporan tagihan mereka.' },
          { t: 'They underestimated it by only about a tenth', j: 'tidak-disebut',
            a: 'Peserta memang menebak terlalu rendah, tetapi selisihnya sekitar separuh, bukan sepersepuluh.' },
          { t: 'They stopped most of their subscriptions as soon as the survey ended', j: 'tidak-disebut', a: 'Tidak ada keterangan peserta menghentikan langganan.' },
          { t: 'They forgot to cancel their free trials', j: 'detail-salah', b: ['sign up for free trials and forget to cancel'],
            a: 'Lupa membatalkan uji coba gratis disebut tentang banyak pelanggan pada umumnya, bukan hasil survei tersebut.' },
        ],
      },
      {
        id: 'not-alasan', tipe: 'not', tingkat: 'menengah', tanya: 'Which of the following is NOT given as a reason why people underestimate their subscription spending?',
        opsi: [
          { t: 'Companies hide charges in complicated contracts', j: 'tidak-disebut', a: 'Kontrak yang rumit atau biaya tersembunyi tidak disebut.' },
          { t: 'Small monthly fees are easy to overlook', j: 'didukung', b: ['Small monthly charges attract little attention'], f: [['Small monthly fees', 'Small monthly charges'], ['easy to overlook', 'attract little attention']], a: 'Tagihan bulanan yang kecil kurang menarik perhatian.' },
          { t: 'Payments come straight from a bank card', j: 'didukung', b: ['taken directly from a bank card'], f: [['straight from a bank card', 'directly from a bank card']], a: 'Pembayaran diambil langsung dari kartu bank.' },
          { t: 'Free trials turn into paid plans unnoticed', j: 'didukung', b: ['sign up for free trials and forget to cancel'], f: [['Free trials', 'free trials'], ['unnoticed', 'forget to cancel']], a: 'Pelanggan lupa membatalkan uji coba gratis sebelum pembayaran pertama.' },
        ],
      },
      {
        id: 'penerapan', tipe: 'penerapan', tingkat: 'menengah', tanya: 'Based on the passage, which action would best help someone judge their total subscription costs?',
        opsi: [
          { t: 'Writing down each service with its yearly price', j: 'didukung', b: ['listing every subscription and its annual, rather than monthly, cost'],
            f: [['Writing down each service', 'listing every subscription'], ['yearly price', 'annual, rather than monthly, cost']],
            a: 'Paragraf 3 menyarankan mendaftar setiap langganan beserta biaya tahunannya karena cara itu membuat totalnya lebih mudah dinilai.' },
          { t: 'Checking only the monthly charge for each service', j: 'bertentangan', b: ['listing every subscription and its annual, rather than monthly, cost'],
            a: 'Saran bacaan justru memakai biaya tahunan, bukan bulanan.' },
          { t: 'Switching every service to a cheaper provider', j: 'tidak-disebut', a: 'Berganti penyedia tidak disarankan dalam bacaan.' },
          { t: 'Setting a reminder after each payment is taken', j: 'detail-salah', b: ['Setting a calendar reminder a few days before a trial ends'],
            a: 'Pengingat disarankan beberapa hari sebelum uji coba berakhir, bukan setelah pembayaran; itu pun untuk memutuskan, bukan menghitung total.' },
        ],
      },
      {
        id: 'kata-statements', tipe: 'kosakata', tingkat: 'menantang', tanya: kosakata('statements', 2), sasaran: 'statements',
        opsi: [
          { t: 'bank records', j: 'didukung', b: ['what their statements later showed'], f: [['bank records', 'statements']],
            a: 'Peserta menebak pengeluarannya, lalu dibandingkan dengan angka yang "kemudian ditunjukkan" statements mereka. Karena tagihan diambil dari kartu bank (kalimat sebelumnya), statements di sini berarti laporan rekening atau tagihan bank.' },
          { t: 'spoken claims', j: 'salah-tafsir', b: ['what their statements later showed'],
            a: 'Statement dapat berarti pernyataan lisan, tetapi pernyataan tidak "menunjukkan" jumlah pengeluaran secara tertulis di kemudian hari.' },
          { t: 'public announcements', j: 'salah-tafsir', b: ['what their statements later showed'],
            a: 'Pengumuman resmi tidak cocok; yang dibandingkan adalah catatan pengeluaran milik peserta sendiri.' },
          { t: 'written opinions', j: 'salah-tafsir', b: ['what their statements later showed'],
            a: 'Pendapat tertulis tidak memuat angka pengeluaran; konteksnya catatan tagihan.' },
        ],
      },
    ],
  },
  {
    id: 'label-tanggal', judul: 'Reading the Date Label', konteks: 'kebijakan publik',
    paragraf: [
      `Households throw away a large share of the food they buy, and much of it is still safe to eat. One reason is confusion over date labels. Many shoppers do not know the difference between a use-by date, which concerns safety, and a best-before date, which refers only to quality.`,
      `Foods with a use-by date, such as fresh meat and fish, can become unsafe soon after that date and should not be eaten once it has passed. By contrast, products with a best-before date, such as pasta, biscuits or tinned vegetables, are usually safe for some time afterwards, although their taste or texture may slowly decline.`,
      `To reduce waste, several supermarket chains have removed best-before dates from fresh fruit and vegetables altogether, encouraging customers to judge freshness by looking at and smelling the produce. Some food banks now accept tinned and dried goods for up to three months after their best-before date, although they still refuse anything past a use-by date.`,
      `Campaigners welcome these steps but warn that labels alone will not solve the problem. They argue that clearer information should be combined with practical advice on storing food and planning meals, since buying more than a household needs remains the main cause of waste.`,
    ],
    soal: [
      {
        id: 'bank-makanan', tipe: 'detail', tingkat: 'menengah', tanya: 'According to the passage, what do some food banks now accept?',
        opsi: [
          { t: 'Tins and dried goods up to three months past best-before', j: 'didukung', b: ['Some food banks now accept tinned and dried goods for up to three months after their best-before date'],
            f: [['Tins and dried goods', 'tinned and dried goods'], ['up to three months past', 'for up to three months after']],
            a: 'Paragraf 3 menyebut sebagian bank makanan kini menerima makanan kaleng dan kering hingga tiga bulan setelah tanggal best-before, tetapi tetap menolak apa pun yang melewati tanggal use-by.' },
          { t: 'Fresh meat for up to a day after its use-by date', j: 'bertentangan', b: ['although they still refuse anything past a use-by date'],
            a: 'Bank makanan justru menolak apa pun yang melewati tanggal use-by, dan daging segar disebut tidak aman setelah tanggal itu.' },
          { t: 'Fresh fruit and vegetables that are sold without any dates', j: 'detail-salah', b: ['removed best-before dates from fresh fruit and vegetables'],
            a: 'Buah dan sayur tanpa tanggal disebut dalam kebijakan supermarket, bukan sebagai barang yang diterima bank makanan.' },
          { t: 'Any packaged food as long as it is still unopened', j: 'tidak-disebut',
            a: 'Jawaban ini terdengar masuk akal, tetapi syarat kemasan belum dibuka tidak disebut; yang menentukan adalah jenis makanan dan tanggalnya.' },
        ],
      },
      {
        id: 'not-langkah', tipe: 'not', tingkat: 'menengah', tanya: 'Which of the following is NOT mentioned as a step taken or proposed to reduce food waste?',
        opsi: [
          { t: 'Lowering the price of food close to its date', j: 'tidak-disebut', a: 'Jawaban ini terdengar seperti langkah yang lazim, tetapi potongan harga untuk makanan yang mendekati tanggalnya tidak disebut.' },
          { t: 'Removing dates from fresh fruit and vegetables', j: 'didukung', b: ['removed best-before dates from fresh fruit and vegetables'], f: [['Removing dates', 'removed best-before dates']], a: 'Beberapa jaringan supermarket menghapus tanggal best-before dari buah dan sayur segar.' },
          { t: 'Letting shoppers judge freshness by sight and smell', j: 'didukung', b: ['encouraging customers to judge freshness by looking at and smelling the produce'],
            f: [['shoppers', 'customers'], ['judge freshness', 'judge freshness'], ['by sight and smell', 'by looking at and smelling']], a: 'Supermarket mendorong pembeli menilai kesegaran dengan melihat dan mencium produk.' },
          { t: 'Making the information on labels clearer', j: 'didukung', b: ['clearer information should be combined with practical advice'],
            f: [['information on labels clearer', 'clearer information']], a: 'Para pegiat mengusulkan informasi yang lebih jelas, dipadukan dengan saran praktis.' },
        ],
      },
      {
        id: 'inferensi-pegiat', tipe: 'inferensi', tingkat: 'menantang', tanya: 'What can be inferred about the campaigners mentioned in paragraph 4?',
        opsi: [
          { t: 'They think overbuying matters more than label confusion', j: 'didukung', b: ['labels alone will not solve the problem', 'remains the main cause of waste'],
            f: [['overbuying', 'buying more than a household needs'], ['matters more', 'remains the main cause of waste']],
            a: 'Para pegiat menyatakan label saja tidak cukup karena membeli melebihi kebutuhan tetap menjadi penyebab utama pemborosan. Jadi, mereka menilai pembelian berlebih lebih menentukan daripada kebingungan label.' },
          { t: 'They oppose removing dates from fresh produce', j: 'bertentangan', b: ['Campaigners welcome these steps', 'removed best-before dates from fresh fruit and vegetables'],
            a: 'Para pegiat menyambut baik langkah-langkah itu.' },
          { t: 'They want supermarkets to remove dates from all food', j: 'tidak-disebut',
            a: 'Para pegiat menyambut penghapusan tanggal pada buah dan sayur, tetapi tidak mengusulkan penghapusan tanggal dari semua makanan; tanggal use-by tetap penting untuk keamanan.' },
          { t: 'They believe clearer labels are the main answer to food waste', j: 'bertentangan', b: ['labels alone will not solve the problem'],
            a: 'Para pegiat justru memperingatkan bahwa label saja tidak akan menyelesaikan masalah.' },
        ],
      },
      {
        id: 'kata-decline', tipe: 'kosakata', tingkat: 'menantang', tanya: kosakata('decline', 2), sasaran: 'decline',
        opsi: [
          { t: 'get worse', j: 'didukung', b: ['may slowly decline'], f: [['get worse', 'decline']],
            a: 'Subjeknya adalah rasa atau tekstur makanan yang perlahan menurun mutunya; decline berarti memburuk.' },
          { t: 'refuse', j: 'salah-tafsir', b: ['may slowly decline'], a: 'Decline dapat berarti menolak (decline an offer), tetapi rasa dan tekstur tidak dapat menolak sesuatu.' },
          { t: 'improve', j: 'salah-tafsir', b: ['may slowly decline'], a: 'Improve berlawanan maknanya; kalimat memakai although untuk menyatakan kekurangan setelah tanggal lewat.' },
          { t: 'stay the same', j: 'salah-tafsir', b: ['may slowly decline'], a: 'Kalimat menyatakan adanya perubahan secara perlahan, bukan keadaan tetap.' },
        ],
      },
    ],
  },
];
