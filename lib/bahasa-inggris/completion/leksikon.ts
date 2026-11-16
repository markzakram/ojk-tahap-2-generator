// Leksikon kecil milik solver Sentence Completion: kelas kata, infleksi, arti ringkas (bahasa Indonesia, sesuai konteks
// soal), dan label CEFR. Label CEFR HANYA diberikan untuk kata pada tabel "Bank kata awal terverifikasi pada daftar"
// (Blueprint Bahasa Inggris bagian 8); kata lain sengaja tanpa label agar tidak menebak tingkat Oxford.
//
// Satu baris: `kelas kata[/v2/v3][+] | arti [| CEFR]`
//   kelas: a = adjective, d = adverb, v = verb, n.c = noun countable (tunggal), n.u = uncountable, n.cu = keduanya,
//          n.p = noun plural.
//   Verb: bentuk -s, V2, V3, dan -ing diturunkan otomatis; V2/V3 tak beraturan ditulis setelah garis miring;
//          `+` = konsonan akhir digandakan (plan → planned, planning).
// Ejaan yang sama boleh muncul pada beberapa baris (mis. clear sebagai adjective dan verb) — solver memeriksa semuanya.

export type Kelas = 'adj' | 'adv' | 'n' | 'v';
/** adj/adv; noun: c (countable tunggal), u (uncountable), p (plural); verb: v1, vs (orang ketiga tunggal), v2, v3, ving. */
export type Bentuk = 'adj' | 'adv' | 'c' | 'u' | 'p' | 'v1' | 'vs' | 'v2' | 'v3' | 'ving';

export interface Analisis {
  kata: string;
  lemma: string;
  kelas: Kelas;
  bentuk: Bentuk;
  arti: string;
  cefr?: string;
}

const DAFTAR = `
a comprehensive | menyeluruh | B2
a controversial | memicu perdebatan | B2
a compulsory | wajib | B2
a excessive | berlebihan atau melampaui batas wajar | B2
a adequate | memadai atau cukup untuk kebutuhan | B2
a inevitable | tidak terelakkan | B2
a consecutive | berturut-turut | C1
a transparent | terbuka sehingga dapat diperiksa | C1
a selective | hanya memilih sebagian
a superficial | dangkal atau hanya di permukaan
a optional | tidak wajib atau boleh dipilih
a voluntary | sukarela
a confidential | rahasia dan terbatas bagi pihak tertentu
a flexible | luwes atau mudah disesuaikan
a efficient | efisien atau hemat sumber daya
a temporary | sementara
a separate | terpisah
a alternate | berselang-seling
a irregular | tidak teratur
a random | acak
a avoidable | dapat dihindari
a unlikely | kecil kemungkinannya
a unnecessary | tidak perlu
a affordable | terjangkau harganya
a convenient | praktis atau mudah digunakan
a punctual | tepat waktu
a reliable | andal atau dapat diandalkan
a comfortable | nyaman
a fragile | rapuh atau mudah rusak
a expensive | mahal
a portable | mudah dibawa
a complicated | rumit
a public | terbuka untuk umum
a visible | dapat dilihat
a accurate | akurat atau tepat
a feasible | dapat dilaksanakan
a obsolete | usang dan tidak lagi layak dipakai
a minimal | sangat sedikit
a reasonable | wajar
a modest | sederhana atau tidak besar
a popular | disukai banyak orang
a profitable | menguntungkan
a insufficient | tidak cukup
a enormous | sangat besar
a outdated | ketinggalan zaman
a spacious | lapang
a innovative | inovatif atau membawa cara baru
a essential | sangat penting dan mutlak diperlukan
a harmful | merugikan atau berbahaya
a irrelevant | tidak berkaitan
a sustainable | berkelanjutan
a wasteful | boros
a eligible | memenuhi syarat
a responsible | bertanggung jawab
a liable | menanggung kewajiban hukum
a grateful | berterima kasih
a famous | terkenal
a aware | sadar atau mengetahui
a capable | mampu
a guilty | bersalah
a proud | bangga
a tired | bosan atau lelah
a relevant | berkaitan langsung
a unknown | tidak diketahui
a superior | lebih unggul
a consistent | konsisten atau sejalan
a familiar | sudah dikenal
a satisfied | puas
a unconnected | tidak berhubungan
a reluctant | enggan
a eager | sangat ingin
a keen | bersemangat atau berminat
a delighted | sangat senang
a willing | bersedia
a vulnerable | rentan
a resistant | tahan terhadap sesuatu
a immune | kebal
a similar | mirip
a decisive | tegas dalam bertindak
a successful | berhasil
a creative | kreatif
a significant | penting atau cukup besar
a persuasive | meyakinkan
a competitive | mampu bersaing
a inaccurate | tidak akurat
a inefficient | tidak efisien
a clear | jelas
a effective | efektif
a ineffective | tidak efektif
a open | terbuka
a final | akhir
a historical | berkaitan dengan sejarah
a shorter | lebih pendek
d decisively | dengan tegas
d successfully | dengan berhasil
d creatively | secara kreatif
d innovatively | secara inovatif
d reliably | secara andal
d consistently | secara konsisten
d significantly | secara signifikan
d persuasively | dengan meyakinkan
d competitively | secara kompetitif
d accurately | secara akurat
d efficiently | secara efisien
d clearly | dengan jelas
d effectively | secara efektif
n.c decision | keputusan
n.cu success | keberhasilan
n.cu creation | penciptaan atau pembentukan
n.cu innovation | inovasi atau cara baru | B2
n.u reliability | keandalan
n.u consistency | konsistensi
n.u significance | arti penting
n.u persuasion | bujukan
n.cu competition | persaingan
n.u accuracy | ketepatan atau keakuratan | B2
n.u efficiency | efisiensi
n.u clarity | kejelasan
n.u effectiveness | keefektifan
n.c incentive | pendorong atau insentif | B2
n.cu forecast | perkiraan atau prakiraan
n.c assumption | anggapan yang dijadikan dasar | B2
n.c guideline | pedoman
n.c deficit | kekurangan dana
n.u proof | bukti yang memastikan
n.u evidence | bukti
n.c fact | fakta
n.c guarantee | jaminan
n.c deadline | tenggat waktu | B2
n.c procedure | prosedur
n.c format | format
n.c fee | biaya
n.c location | lokasi
n.u popularity | tingkat kepopuleran
n.u complexity | kerumitan
n.u importance | tingkat kepentingan
n.u confidentiality | kerahasiaan
n.cu disclosure | pengungkapan | C1
n.u concealment | penyembunyian
n.cu removal | penghapusan atau pemindahan
n.u protection | perlindungan
n.u assistance | bantuan | B2
n.u permission | izin
n.u information | informasi
n.u equipment | peralatan
n.u transport | angkutan
n.c concession | kelonggaran yang diberikan dalam perundingan | C1
n.c complaint | keluhan
n.c demand | tuntutan
n.c threat | ancaman
n.c objection | keberatan
n.cu tradition | tradisi atau kebiasaan lama
n.u reluctance | keengganan
n.cu routine | rutinitas
n.u caution | kehati-hatian
n.u accountability | kewajiban mempertanggungjawabkan tindakan | C1
n.u secrecy | sikap menutup-nutupi
n.u flexibility | keluwesan
n.u hospitality | keramahan dalam menjamu tamu
n.c barrier | penghalang
n.cu contribution | sumbangan
n.c solution | jalan keluar
n.c route | jalur
n.u feedback | umpan balik
n.cu payment | pembayaran
n.u attendance | kehadiran
n.c shortage | kekurangan
n.c surplus | kelebihan
n.cu supply | pasokan
n.c team | tim
n.cu variety | keragaman
n.cu priority | prioritas
n.u part | bagian (take part berarti ikut serta)
n.cu advantage | keuntungan atau keunggulan
n.u notice | perhatian atau pemberitahuan
n.u compliance | kepatuhan
n.u collaboration | kerja sama
n.cu negotiation | perundingan
n.cu partnership | kemitraan
n.p consequences | akibat
n.p benefits | manfaat
n.p advantages | keuntungan
n.p rewards | imbalan
n.p reasons | alasan
n.c reputation | reputasi atau nama baik
n.c budget | anggaran
n.c schedule | jadwal
n.c salary | gaji
n.cu capacity | kapasitas atau daya tampung
n.c arrangement | pengaturan
n.c plan | rencana
n.cu charge | biaya atau tarif
n.cu policy | kebijakan
n.u emphasis | penekanan
n.cu restriction | pembatasan
n.cu limitation | keterbatasan
n.cu doubt | keraguan
n.u blame | kesalahan yang ditimpakan
n.u awareness | kesadaran
n.u funding | pendanaan
n.u spending | pengeluaran
n.u participation | keikutsertaan
n.u ownership | kepemilikan
v comply | mematuhi | C1
v conceal | menyembunyikan | C1
v allocate | mengalokasikan | C1
v consult | berkonsultasi atau meminta pendapat | B2
v anticipate | memperkirakan dan bersiap menghadapi | B2
v convey | menyampaikan | B2
v clarify | memperjelas | B2
v compete | bersaing
v insist | bersikeras
v comment | mengomentari
v consist | terdiri (consist of)
v include | mencakup
v contain | berisi atau memuat
v involve | melibatkan
v approve | menyetujui
v borrow | meminjam
v withdraw/withdrew/withdrawn | menarik kembali
v postpone | menunda
v report | melaporkan
v reveal | mengungkapkan
v explain | menjelaskan
v ignore | mengabaikan
v replace | mengganti
v prescribe | meresepkan
v examine | memeriksa
v prevent | mencegah
v avoid | menghindari
v ban+ | melarang
v discourage | membuat orang enggan melakukan sesuatu
v complicate | memperumit
v cancel | membatalkan
v delay | menunda
v restrict | membatasi
v cope | mampu mengatasi (cope with)
v interfere | mengganggu atau mencampuri
v collaborate | bekerja sama
v contribute | menyumbang atau ikut berperan
v object | berkeberatan
v refer+ | merujuk
v belong | menjadi milik atau bagian dari
v react | bereaksi
v participate | ikut serta
v result | berakibat (result in)
v believe | percaya
v invest | menanamkan modal
v benefit | memperoleh manfaat (benefit from)
v suffer | menderita
v differ | berbeda
v resign | mengundurkan diri
v escape | melarikan diri
v account | menjadi bagian sebesar (account for)
v pay/paid/paid | membayar
v care | peduli atau merawat
v apply | mengajukan permohonan (apply for)
v allow | mengizinkan
v cause | menyebabkan
v reply | membalas
v adapt | menyesuaikan diri
v meet/met/met | memenuhi (meet a deadline)
v miss | melewatkan
v extend | memperpanjang
v handle | menangani
v encourage | mendorong
v permit+ | mengizinkan
v invite | mengundang
v stand/stood/stood | berdiri (stand for berarti mewakili)
v advance | memajukan
v attend | menghadiri
v decide | memutuskan
v succeed | berhasil
v create | menciptakan
v innovate | berinovasi
v rely | bergantung atau mengandalkan
v signify | menandakan
v persuade | membujuk atau meyakinkan
v clear | membersihkan atau mengosongkan
v grow/grew/grown | tumbuh atau menanam
v write/wrote/written | menulis
v return | mengembalikan
v choose/chose/chosen | memilih
v install | memasang
v buy/bought/bought | membeli
v stay | tetap
v attract | menarik
v begin/began/begun+ | dimulai
v place | menempatkan
v review | meninjau
v collect | mengumpulkan
v hold/held/held | mengadakan
v plan+ | merencanakan
v open | membuka
v complete | menyelesaikan
v send/sent/sent | mengirim
v increase | meningkat
`;

const KODE_KELAS: Record<string, { kelas: Kelas; bentuk: Bentuk[] }> = {
  a: { kelas: 'adj', bentuk: ['adj'] },
  d: { kelas: 'adv', bentuk: ['adv'] },
  'n.c': { kelas: 'n', bentuk: ['c'] },
  'n.u': { kelas: 'n', bentuk: ['u'] },
  'n.cu': { kelas: 'n', bentuk: ['c', 'u'] },
  'n.p': { kelas: 'n', bentuk: ['p'] },
};

export function bentukS(l: string): string {
  if (/[^aeiou]y$/.test(l)) return l.slice(0, -1) + 'ies';
  if (/(s|x|z|ch|sh|o)$/.test(l)) return l + 'es';
  return l + 's';
}
export function bentukEd(l: string, ganda = false): string {
  if (ganda) return l + l.slice(-1) + 'ed';
  if (/e$/.test(l)) return l + 'd';
  if (/[^aeiou]y$/.test(l)) return l.slice(0, -1) + 'ied';
  return l + 'ed';
}
export function bentukIng(l: string, ganda = false): string {
  if (ganda) return l + l.slice(-1) + 'ing';
  if (/ie$/.test(l)) return l.slice(0, -2) + 'ying';
  if (/[^e]e$/.test(l)) return l.slice(0, -1) + 'ing';
  return l + 'ing';
}

function bangunLeksikon(): Map<string, Analisis[]> {
  const peta = new Map<string, Analisis[]>();
  const tambah = (a: Analisis) => peta.set(a.kata, [...(peta.get(a.kata) ?? []), a]);
  for (const baris of DAFTAR.split('\n').map((b) => b.trim()).filter(Boolean)) {
    const [kepala, arti, cefr] = baris.split('|').map((s) => s.trim());
    const [kode, entri] = kepala.split(/\s+/);
    if (kode === 'v') {
      const ganda = entri.endsWith('+');
      const [lemma, v2, v3] = entri.replace('+', '').split('/');
      const bentuk: [Bentuk, string][] = [
        ['v1', lemma], ['vs', bentukS(lemma)], ['v2', v2 ?? bentukEd(lemma, ganda)], ['v3', v3 ?? bentukEd(lemma, ganda)], ['ving', bentukIng(lemma, ganda)],
      ];
      for (const [b, kata] of bentuk) tambah({ kata, lemma, kelas: 'v', bentuk: b, arti, cefr: cefr || undefined });
      continue;
    }
    const k = KODE_KELAS[kode];
    if (!k) throw new Error(`Kode kelas tidak dikenal di leksikon: ${baris}`);
    for (const b of k.bentuk) tambah({ kata: entri, lemma: entri, kelas: k.kelas, bentuk: b, arti, cefr: cefr || undefined });
  }
  return peta;
}

const LEKSIKON = bangunLeksikon();

/** Semua analisis untuk satu ejaan (huruf kecil). Kosong = kata tidak dikenal solver. */
export function analisis(kata: string): Analisis[] {
  return LEKSIKON.get(kata.trim().toLowerCase()) ?? [];
}

/** Arti ringkas untuk pembahasan (analisis pertama yang cocok dengan kelas, bila diberikan). */
export function arti(kata: string, kelas?: Kelas): string {
  const a = analisis(kata);
  return (a.find((x) => !kelas || x.kelas === kelas) ?? a[0])?.arti ?? '';
}

export const NAMA_KELAS: Record<Kelas, string> = { adj: 'adjective', adv: 'adverb', n: 'noun', v: 'verb' };

/** Huruf kapital pada awal kata (untuk pembahasan). */
export const kapital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
