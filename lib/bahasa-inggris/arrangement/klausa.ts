import { buatFamily, type Kerangka } from './family';

// VARIASI — perluasan berbasis buku (blueprint bagian 6, "Contoh Arrangement — noun clause (perluasan)"; bagian 7 baris
// "Noun dan adjective clause"; Azar 12-2–12-5). Noun clause sebagai objek atau subjek: kata penghubung (whether, why, how,
// what, where) dikunci bersama subjek klausa bawahan, sehingga yang diuji adalah urutan pernyataan subjek–verb di dalamnya.
// Contoh blueprint (supervisor/whether) hanya dipakai sebagai uji emas; butir bank memakai kalimat baru.

/** Contoh blueprint bagian 6, dipakai kata per kata hanya sebagai uji emas solver (lib/bahasa-inggris/uji-emas.ts). */
export const EMAS_KLAUSA: Kerangka[] = [
  {
    id: 'emas-asked-whether', tingkat: 'menengah', kaidah: 'noun-clause-whether-passive', konteks: 'kantor dan proyek',
    fragmen: ['The supervisor', 'asked', 'whether the documents', 'had been', 'properly signed'],
    fungsi: ['subjek klausa utama', 'verb utama', 'penghubung whether + subjek noun clause', 'auxiliary past perfect', 'adverb + V3 (passive)'],
    kait: [
      'The supervisor adalah subjek dan asked adalah verb utamanya',
      'asked memerlukan objek berupa noun clause yang dibuka whether',
      'dalam noun clause, subjek the documents langsung disambung auxiliary had been (urutan pernyataan, bukan pertanyaan)',
      'had been memerlukan V3 signed untuk membentuk past perfect passive',
    ],
    konsep: 'Urutan noun clause dan past perfect passive',
    kataKunci: 'asked, whether, the documents, had been',
    caraCepat: 'Mulai dari asked whether, lalu sambungkan subjek dan rangkaian had been + V3.',
  },
];

const KERANGKA: Kerangka[] = [
  {
    id: 'asked-whether', tingkat: 'menengah', kaidah: 'noun-clause-whether-passive', konteks: 'kantor dan proyek',
    fragmen: ['The project manager', 'asked', 'whether the safety rules', 'had been', 'properly reviewed'],
    fungsi: ['subjek klausa utama', 'verb utama', 'penghubung whether + subjek noun clause', 'auxiliary past perfect', 'adverb + V3 (passive)'],
    kait: [
      'The project manager adalah subjek dan asked adalah verb utamanya',
      'asked memerlukan objek berupa noun clause yang dibuka whether',
      'dalam noun clause, subjek the safety rules langsung disambung auxiliary had been (urutan pernyataan, bukan pertanyaan)',
      'had been memerlukan V3 reviewed untuk membentuk past perfect passive',
    ],
    konsep: 'Urutan noun clause dan past perfect passive',
    kataKunci: 'asked, whether, the safety rules, had been',
    caraCepat: 'Mulai dari asked whether, lalu sambungkan subjek dan rangkaian had been + V3.',
  },
  {
    id: 'explained-why', tingkat: 'dasar', kaidah: 'noun-clause-why', konteks: 'laporan dan data',
    fragmen: ['The finance team', 'explained', 'why the monthly', 'budget report', 'was submitted late'],
    fungsi: ['subjek klausa utama', 'verb utama', 'penghubung why + awal subjek noun clause', 'noun inti subjek noun clause', 'predikat passive noun clause'],
    kait: [
      'The finance team adalah subjek dan explained adalah verb utamanya',
      'explained memerlukan objek berupa noun clause yang dibuka why',
      'the monthly masih memerlukan noun inti budget report',
      'subjek noun clause the monthly budget report langsung diikuti predikatnya, was submitted',
    ],
    konsep: 'Noun clause dengan why sebagai objek',
    kataKunci: 'explained why, the monthly budget report, was submitted',
    caraCepat: 'Setelah why, susun klausa seperti kalimat pernyataan: subjek lengkap lalu predikat.',
  },
  {
    id: 'what-subject', tingkat: 'menengah', kaidah: 'noun-clause-what-subjek', konteks: 'kegiatan masyarakat',
    fragmen: ['What the residents', 'need most is', 'a safer walking', 'route to the', 'new school'],
    fungsi: ['awal noun clause subjek (what + subjek)', 'verb noun clause + adverb + be utama', 'determiner + adjective + pewatas complement', 'noun inti complement + preposisi to + determiner', 'tujuan'],
    kait: [
      'what the residents memerlukan verb need untuk melengkapi noun clause',
      'is memerlukan complement yang diawali a safer walking',
      'a safer walking masih memerlukan noun inti route',
      'the memerlukan noun new school',
    ],
    konsep: 'Noun clause what sebagai subjek',
    kataKunci: 'What the residents need most, is, route to the',
    caraCepat: 'Kenali What + subjek + verb sebagai satu subjek panjang, lalu cari is sebagai predikat utama.',
  },
  {
    id: 'describes-how', tingkat: 'dasar', kaidah: 'noun-clause-how-modal', konteks: 'teknologi',
    fragmen: ['The new user guide', 'describes how', 'staff members should', 'report a', 'broken device'],
    fungsi: ['subjek klausa utama', 'verb utama + penghubung how', 'subjek noun clause + modal', 'verb dasar + determiner', 'noun phrase objek'],
    kait: [
      'subjek tunggal The new user guide cocok dengan describes',
      'how memperkenalkan noun clause yang diawali subjek staff members',
      'modal should memerlukan bentuk dasar report',
      'determiner a memerlukan noun tunggal broken device',
    ],
    konsep: 'Noun clause dengan how dan modal',
    kataKunci: 'describes how, staff members should, report a',
    caraCepat: 'Setelah how, cari subjek + modal, lalu bentuk dasar verb dan objeknya.',
  },
  {
    id: 'decide-whether-moved', tingkat: 'menengah', kaidah: 'noun-clause-whether-modal-passive', konteks: 'kegiatan masyarakat',
    fragmen: ['The event committee will', 'decide whether', 'the annual festival', 'should be moved', 'to a larger park'],
    fungsi: ['subjek + modal klausa utama', 'verb dasar + penghubung whether', 'subjek noun clause', 'modal passive noun clause', 'tujuan pemindahan'],
    kait: [
      'modal will memerlukan bentuk dasar decide',
      'whether memperkenalkan noun clause yang diawali subjek the annual festival',
      'subjek the annual festival langsung diikuti predikat should be moved',
      'moved memerlukan tujuan yang dibuka preposisi to',
    ],
    konsep: 'Noun clause whether dengan modal passive',
    kataKunci: 'will decide whether, should be moved, to',
    caraCepat: 'Pasangkan will dengan decide whether, lalu susun subjek + should be + V3 di dalam noun clause.',
  },
  {
    id: 'whether-subject', tingkat: 'menantang', kaidah: 'noun-clause-whether-subjek', konteks: 'kebijakan dan kepatuhan',
    fragmen: ['Whether the new', 'rule applies to', 'part-time workers', 'has not been', 'clearly explained'],
    fungsi: ['penghubung whether + awal subjek noun clause', 'noun inti + verb noun clause + preposisi to', 'objek to', 'predikat utama (present perfect negatif)', 'adverb + V3 passive'],
    kait: [
      'the new masih memerlukan noun inti rule',
      'preposisi to pada applies to memerlukan objek part-time workers',
      'noun clause Whether … part-time workers menjadi subjek tunggal bagi has not been',
      'has not been memerlukan V3 explained untuk membentuk passive',
    ],
    konsep: 'Noun clause whether sebagai subjek kalimat',
    kataKunci: 'Whether the new rule applies to, has not been, explained',
    caraCepat: 'Lengkapi noun clause Whether + subjek + verb lebih dulu; seluruh klausa itu menjadi subjek tunggal untuk has.',
  },
  {
    id: 'asked-where', tingkat: 'dasar', kaidah: 'noun-clause-where-passive', konteks: 'pendidikan dan pelatihan',
    fragmen: ['The library volunteers', 'asked where the', "donated children's books", 'should be', 'stored'],
    fungsi: ['subjek klausa utama', 'verb utama + where + determiner', 'subjek noun clause', 'modal + be', 'V3 passive'],
    kait: [
      'The library volunteers adalah subjek dan asked adalah verb utamanya',
      "determiner the memerlukan noun phrase donated children's books",
      "subjek noun clause donated children's books langsung diikuti should be",
      'should be memerlukan V3 stored untuk membentuk passive',
    ],
    konsep: 'Noun clause where dengan modal passive',
    kataKunci: 'asked where, should be stored',
    caraCepat: 'Setelah where, susun subjek lengkap lalu should be + V3, bukan should be di depan subjek.',
  },
  {
    id: 'know-how-collected', tingkat: 'menantang', kaidah: 'infinitive-noun-clause-how', konteks: 'riset',
    fragmen: ['The auditor', 'wanted to know', 'how the survey', 'data had been', 'collected'],
    fungsi: ['subjek', 'verb + to-infinitive know', 'penghubung how + awal subjek noun clause', 'noun inti subjek + auxiliary past perfect', 'V3 passive'],
    kait: [
      'The auditor adalah subjek dan wanted to know adalah predikatnya',
      'know memerlukan objek berupa noun clause yang dibuka how',
      'pewatas survey memerlukan noun inti data',
      'had been memerlukan V3 collected untuk membentuk past perfect passive',
    ],
    konsep: 'Verb + infinitive yang diikuti noun clause how',
    kataKunci: 'wanted to know how, data had been collected',
    caraCepat: 'Pasangkan wanted to know dengan how, lalu urutkan subjek + had been + V3.',
  },
  {
    id: 'asked-whether-offer', tingkat: 'dasar', kaidah: 'noun-clause-whether-modal', konteks: 'layanan pelanggan',
    fragmen: ['Several customers', 'have asked whether', 'the online store', 'will offer free', 'delivery again'],
    fungsi: ['subjek jamak', 'predikat present perfect + whether', 'subjek noun clause', 'modal + verb dasar + adjective', 'noun inti objek + adverb'],
    kait: [
      'subjek jamak Several customers cocok dengan have asked',
      'whether memperkenalkan noun clause yang diawali subjek the online store',
      'subjek the online store langsung diikuti predikat will offer',
      'adjective free memerlukan noun delivery',
    ],
    konsep: 'Noun clause whether sebagai objek',
    kataKunci: 'have asked whether, the online store will offer',
    caraCepat: 'Cocokkan subjek jamak dengan have, lalu susun noun clause sebagai pernyataan biasa.',
  },
  {
    id: 'details-about-how', tingkat: 'menantang', kaidah: 'noun-clause-objek-preposisi', konteks: 'teknologi',
    fragmen: ['The final report includes', 'a short section', 'on how the', 'new water filters', 'were tested'],
    fungsi: ['subjek + verb utama', 'objek includes', 'preposisi on + how + determiner', 'subjek noun clause', 'predikat passive noun clause'],
    kait: [
      'includes memerlukan objek a short section',
      'a short section diterangkan frasa on yang objeknya noun clause how',
      'the memerlukan noun phrase new water filters',
      'subjek jamak new water filters cocok dengan were tested',
    ],
    konsep: 'Noun clause sebagai objek preposisi',
    kataKunci: 'a short section, on how the, water filters were tested',
    caraCepat: 'Lihat preposisi on yang diikuti how, lalu cocokkan subjek jamak dengan were.',
  },
  {
    id: 'not-sure-whether', tingkat: 'menantang', kaidah: 'adjective-noun-clause-whether', konteks: 'kantor dan proyek',
    fragmen: ['The project manager', 'is not sure whether', 'the new software will', 'be ready for the', 'product launch'],
    fungsi: ['subjek', 'predikat (be + not + adjective) + whether', 'subjek noun clause + modal', 'be + adjective + preposisi for + determiner', 'noun phrase objek for'],
    kait: [
      'The project manager adalah subjek dan is not sure adalah predikatnya',
      'sure whether memperkenalkan noun clause yang diawali subjek the new software',
      'modal will memerlukan bentuk dasar be',
      'the memerlukan noun phrase product launch',
    ],
    konsep: 'Adjective + noun clause whether dengan modal',
    kataKunci: 'not sure whether, the new software will, be ready for',
    caraCepat: 'Setelah sure whether, cari subjek + will, lalu bentuk dasar be ready for.',
  },
  {
    id: 'showed-what', tingkat: 'menantang', kaidah: 'noun-clause-what-objek', konteks: 'kebijakan dan kepatuhan',
    fragmen: ['The new safety handbook', 'explains what all', 'employees must', 'do during a', 'fire drill'],
    fungsi: ['subjek', 'verb utama + what + determiner', 'subjek noun clause + modal', 'verb dasar + preposisi during + determiner', 'noun phrase objek during'],
    kait: [
      'subjek tunggal The new safety handbook cocok dengan explains',
      'all memerlukan noun jamak employees, subjek noun clause yang dibuka what',
      'modal must memerlukan bentuk dasar do, dan what menjadi objek do',
      'determiner a memerlukan noun tunggal fire drill',
    ],
    konsep: 'Noun clause what sebagai objek',
    kataKunci: 'explains what, all employees must do, during a',
    caraCepat: 'Setelah what, susun subjek + modal + verb dasar; what sendiri menjadi objek verb itu.',
  },
];

export const familyKlausa = buatFamily({
  id: 'SA-KLAUSA',
  versi: 3,
  nama: 'Noun clause',
  label: 'VARIASI',
  sumber: 'Blueprint Bahasa Inggris §6 (contoh noun clause, perluasan) · §7 Noun dan adjective clause · Azar 12-2–12-5',
  ringkas: 'Klausa utama dengan noun clause whether/why/how/what/where sebagai objek, objek preposisi, atau subjek. Penghubung dikunci bersama subjek klausa bawahan sehingga yang diuji urutan subjek–verb di dalamnya.',
  kerangka: KERANGKA,
});

export const KERANGKA_KLAUSA = KERANGKA;
