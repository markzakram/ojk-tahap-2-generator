import { buatFamily, type Kerangka } from './family';

// SHL — pola teramati (blueprint bagian 6, "Contoh Arrangement — noun phrase dan complement"): subjek noun phrase +
// predikat + pelengkap/objek, dengan sambungan yang dikunci determiner–noun, adjective–preposisi, preposisi–objeknya,
// dan subjek–predikat. Contoh blueprint (compliance officer) hanya dipakai sebagai uji emas; butir bank memakai kalimat
// baru dengan mekanisme yang sama.

/** Contoh blueprint bagian 6, dipakai kata per kata hanya sebagai uji emas solver (lib/bahasa-inggris/uji-emas.ts). */
export const EMAS_FRASA: Kerangka[] = [
  {
    id: 'emas-responsible-for', tingkat: 'dasar', kaidah: 'adjective-preposisi-gerund', konteks: 'kebijakan dan kepatuhan',
    fragmen: ['The compliance officer', 'is responsible', 'for reviewing', "the company's annual", 'financial reports'],
    fungsi: ['subjek', 'predikat (be + adjective)', 'preposisi for + gerund', 'awal objek (posesif + adjective)', 'noun inti objek'],
    kait: [
      'The compliance officer adalah subjek dan is responsible adalah predikatnya',
      'adjective responsible berpasangan dengan preposisi for',
      "gerund reviewing memerlukan objek yang diawali the company's annual",
      "the company's annual masih memerlukan noun inti financial reports",
    ],
    konsep: 'Urutan pelengkap dan frasa noun',
    kataKunci: "is responsible, for reviewing, the company's annual",
    caraCepat: 'Pasangkan is responsible dengan for reviewing, lalu cari objek yang ditinjau.',
  },
];

const KERANGKA: Kerangka[] = [
  {
    id: 'responsible-for', tingkat: 'dasar', kaidah: 'adjective-preposisi-gerund', konteks: 'pendidikan dan pelatihan',
    fragmen: ['The new librarian', 'is responsible', 'for reviewing', "the school's annual", 'budget reports'],
    fungsi: ['subjek', 'predikat (be + adjective)', 'preposisi for + gerund', 'awal objek (posesif + adjective)', 'noun inti objek'],
    kait: [
      'The new librarian adalah subjek dan is responsible adalah predikatnya',
      'adjective responsible berpasangan dengan preposisi for',
      "gerund reviewing memerlukan objek yang diawali the school's annual",
      "the school's annual masih memerlukan noun inti budget reports",
    ],
    konsep: 'Urutan pelengkap dan frasa noun',
    kataKunci: "is responsible, for reviewing, the school's annual",
    caraCepat: 'Pasangkan is responsible dengan for reviewing, lalu cari objek yang ditinjau.',
  },
  {
    id: 'familiar-with', tingkat: 'dasar', kaidah: 'adjective-preposisi-posesif', konteks: 'riset',
    fragmen: ['All new research assistants', 'must be familiar with', "the laboratory's", 'safety rules for', 'handling chemical waste'],
    fungsi: ['subjek', 'predikat (modal + be + adjective + with)', 'penanda kepemilikan (awal objek with)', 'noun inti objek + preposisi for', 'gerund beserta objeknya'],
    kait: [
      'All new research assistants adalah subjek dan must be familiar with adalah predikatnya',
      "preposisi with memerlukan objek yang diawali the laboratory's",
      "penanda kepemilikan the laboratory's memerlukan noun yang dimilikinya, yaitu safety rules",
      'preposisi for memerlukan gerund handling beserta objeknya',
    ],
    konsep: 'Adjective + preposisi dan frasa noun posesif',
    kataKunci: "familiar with, the laboratory's, rules for handling",
    caraCepat: "Pasangkan familiar with dengan objeknya, lalu sambungkan penanda 's dengan noun yang dimilikinya.",
  },
  {
    id: 'interested-in', tingkat: 'dasar', kaidah: 'adjective-preposisi-gerund', konteks: 'pendidikan dan pelatihan',
    fragmen: ['Many local students', 'are interested in', 'joining the', "school's new", 'science club'],
    fungsi: ['subjek jamak', 'predikat (be + adjective + in)', 'gerund + determiner', 'penanda kepemilikan + adjective', 'noun inti objek joining'],
    kait: [
      'subjek jamak Many local students cocok dengan are interested',
      'preposisi in pada interested in diikuti gerund joining',
      "the pada joining the memerlukan noun dan bersama school's membentuk penanda kepemilikan the school's",
      "school's new masih memerlukan noun inti science club",
    ],
    konsep: 'Adjective + preposisi + gerund dan frasa noun posesif',
    kataKunci: "are interested in, joining the, school's new",
    caraCepat: "Setelah interested in pakai V-ing, lalu sambungkan the + school's + noun yang dimiliki.",
  },
  {
    id: 'provide-with', tingkat: 'menengah', kaidah: 'verb-objek-preposisi', konteks: 'kegiatan masyarakat',
    fragmen: ['The training team', 'provides all new', 'volunteers with a', 'short guide to', 'emergency procedures'],
    fungsi: ['subjek', 'predikat + awal objek orang', 'noun inti objek + preposisi with + determiner', 'noun yang diberikan + preposisi to', 'objek to'],
    kait: [
      'The training team adalah subjek dan provides adalah verb utamanya',
      'all new memerlukan noun jamak volunteers',
      'determiner a memerlukan noun tunggal short guide',
      'preposisi to memerlukan objek emergency procedures',
    ],
    konsep: 'Pola verb + objek + preposisi (provide someone with something)',
    kataKunci: 'provides all new volunteers, with a, guide to',
    caraCepat: 'Ingat pola provide + orang + with + benda, lalu lengkapi a dengan noun tunggal.',
  },
  {
    id: 'reduced-passive-by', tingkat: 'menengah', kaidah: 'reduced-relative-passive', konteks: 'lingkungan dan energi',
    fragmen: ['The water samples', 'collected near the', 'old factory', 'were tested by', 'an independent laboratory'],
    fungsi: ['inti subjek', 'participle collected + preposisi near + determiner', 'noun inti tempat', 'predikat passive + by', 'pelaku pengujian'],
    kait: [
      'participle collected menerangkan water samples',
      'determiner the memerlukan noun inti old factory',
      'subjek jamak the water samples baru lengkap setelah keterangan near the old factory, lalu disambung predikat were tested',
      'preposisi by memerlukan pelaku an independent laboratory',
    ],
    konsep: 'Reduced relative clause dalam subjek dan passive dengan by',
    kataKunci: 'collected near the, were tested by',
    caraCepat: 'Lengkapi dulu subjek beserta keterangan collected near …, baru pasang predikat passive dan pelakunya.',
  },
  {
    id: 'returned-to', tingkat: 'menengah', kaidah: 'modal-passive-posesif', konteks: 'kantor dan proyek',
    fragmen: ['All signed', 'contracts must be', 'returned to the', "legal department's", 'main office'],
    fungsi: ['determiner + participle (awal subjek)', 'noun inti subjek + modal + be', 'V3 passive + preposisi to + determiner', 'penanda kepemilikan', 'noun inti tujuan'],
    kait: [
      'All signed masih memerlukan noun inti jamak contracts',
      'must be memerlukan V3 returned untuk membentuk passive',
      "the pada returned to the memerlukan noun dan bersama legal department's membentuk penanda kepemilikan",
      "legal department's memerlukan noun yang dimilikinya, yaitu main office",
    ],
    konsep: 'Modal passive dan frasa noun posesif',
    kataKunci: "all signed contracts, must be returned, the legal department's",
    caraCepat: "Satukan must be dengan V3, lalu sambungkan penanda 's dengan noun sesudahnya.",
  },
  {
    id: 'causes-of', tingkat: 'menengah', kaidah: 'rangkaian-frasa-preposisi', konteks: 'laporan dan data',
    fragmen: ['The final report', 'identifies two main', 'causes of the', 'delay in', 'product deliveries'],
    fungsi: ['subjek', 'predikat + bilangan + adjective', 'noun inti objek + preposisi of + determiner', 'noun tunggal + preposisi in', 'objek in'],
    kait: [
      'subjek tunggal The final report cocok dengan verb identifies',
      'two main memerlukan noun jamak causes',
      'the memerlukan noun tunggal delay',
      'preposisi in memerlukan objek product deliveries',
    ],
    konsep: 'Noun phrase dengan rangkaian frasa preposisi',
    kataKunci: 'identifies two main, causes of the, delay in',
    caraCepat: 'Cocokkan bilangan dengan noun jamak, lalu ikuti rantai preposisi sampai tidak ada fragmen yang menggantung.',
  },
  {
    id: 'relative-who', tingkat: 'menantang', kaidah: 'relative-clause-subjek', konteks: 'riset',
    fragmen: ['The researcher', 'who designed the', 'online survey has', 'published a summary of', 'the main findings'],
    fungsi: ['inti subjek', 'relative pronoun who + verb + determiner', 'objek designed + auxiliary has', 'V3 + objek + preposisi of', 'objek of'],
    kait: [
      'relative clause who designed menerangkan the researcher',
      'determiner the memerlukan noun online survey',
      'has memerlukan V3 published untuk membentuk present perfect',
      'preposisi of memerlukan objek the main findings',
    ],
    konsep: 'Relative clause pada subjek dan present perfect',
    kataKunci: 'who designed the, survey has, published a summary of',
    caraCepat: 'Selesaikan relative clause who + verb + objek, lalu cari auxiliary predikat utama.',
  },
  {
    id: 'increase-in-price', tingkat: 'dasar', kaidah: 'verb-objek-frasa-preposisi', konteks: 'ekonomi umum',
    fragmen: ['The local government', 'has announced a', 'gradual increase in', 'the price of', 'household electricity'],
    fungsi: ['subjek', 'predikat (present perfect) + determiner', 'noun inti objek + preposisi in', 'objek in + preposisi of', 'objek of'],
    kait: [
      'subjek tunggal The local government cocok dengan has announced',
      'determiner a memerlukan noun gradual increase',
      'preposisi in memerlukan objek the price',
      'preposisi of memerlukan objek household electricity',
    ],
    konsep: 'Objek noun phrase dengan frasa preposisi berlapis',
    kataKunci: 'has announced a, increase in, the price of',
    caraCepat: 'Mulai dari has announced a + noun, lalu pasangkan setiap preposisi dengan objeknya.',
  },
  {
    id: 'aware-of', tingkat: 'dasar', kaidah: 'adjective-preposisi-gerund', konteks: 'layanan pelanggan',
    fragmen: ['Customer service agents', 'should be aware of the', 'new rules for', 'handling complaints about', 'late deliveries'],
    fungsi: ['subjek', 'predikat (modal + be + adjective + of) + determiner', 'noun inti objek of + preposisi for', 'gerund + objek + preposisi about', 'objek about'],
    kait: [
      'Customer service agents adalah subjek dan should be aware of adalah predikatnya',
      'determiner the memerlukan noun phrase new rules',
      'preposisi for memerlukan gerund handling',
      'preposisi about memerlukan objek late deliveries',
    ],
    konsep: 'Adjective + preposisi dan preposisi + gerund',
    kataKunci: 'aware of the, new rules for, handling complaints about',
    caraCepat: 'Pasangkan aware of the dengan noun rules, lalu lanjutkan rules for + gerund.',
  },
  {
    id: 'assign-to', tingkat: 'menengah', kaidah: 'verb-objek-preposisi-superlatif', konteks: 'kantor dan proyek',
    fragmen: ['The project leader', 'has assigned the', 'most urgent tasks', 'to the most', 'experienced engineers'],
    fungsi: ['subjek', 'predikat (present perfect) + determiner', 'objek (superlatif)', 'preposisi to + awal superlatif', 'penerima tugas'],
    kait: [
      'subjek tunggal The project leader cocok dengan has assigned',
      'determiner the memerlukan noun phrase most urgent tasks',
      'pola assign + tugas + to + orang menempatkan to sesudah objek tugas',
      'the most memerlukan adjective dan noun experienced engineers',
    ],
    konsep: 'Pola verb + objek + to dan frasa superlatif',
    kataKunci: 'has assigned the, tasks, to the most',
    caraCepat: 'Ingat pola assign something to someone; the most harus langsung diikuti adjective.',
  },
  {
    id: 'construction-of', tingkat: 'menantang', kaidah: 'subjek-of-passive-infinitive', konteks: 'kegiatan masyarakat',
    fragmen: ['Construction of the two new', 'bridges is likely to', 'be completed before', 'the start of the', 'rainy season'],
    fungsi: ['awal subjek (noun + of + determiner + bilangan + adjective)', 'noun inti objek of + predikat is likely to', 'passive infinitive + preposisi before', 'objek before + preposisi of + determiner', 'objek of'],
    kait: [
      'the two new memerlukan noun jamak bridges',
      'to pada likely to memerlukan bentuk dasar be',
      'preposisi before memerlukan objek the start',
      'the memerlukan noun tunggal rainy season',
    ],
    konsep: 'Subjek dengan frasa of, likely + to-infinitive, dan passive infinitive',
    kataKunci: 'construction of, is likely to, be completed before',
    caraCepat: 'Kenali subjek tunggal construction (bukan bridges) sehingga verbnya is, lalu pasangkan likely to dengan be completed.',
  },
];

export const familyFrasa = buatFamily({
  id: 'SA-FRASA',
  versi: 3,
  nama: 'Frasa noun dan pelengkap',
  label: 'SHL',
  sumber: 'Blueprint Bahasa Inggris §6 (contoh noun phrase dan complement, teramati) · §7 Frasa dan urutan dasar · Azar Appendix A-1–A-4, bab 6–7, 14-12',
  ringkas: 'Lima fragmen membentuk subjek + predikat + pelengkap/objek. Sambungan dikunci determiner–noun, adjective–preposisi, preposisi–objek, dan subjek–predikat; solver menguji seluruh 120 urutan.',
  kerangka: KERANGKA,
});

export const KERANGKA_FRASA = KERANGKA;
