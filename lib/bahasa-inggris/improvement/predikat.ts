import type { Rng } from '../../core/rng';
import type { Tingkat } from '../model';
import type { Diatesis } from './analisis';
import { wujud } from './leksikon';
import { buatFamily, type ItemSI, type Rancangan } from './umum';

// Rentang = predikat finite. Solver menurunkan jumlah inti subjek dari leksikon noun/kuantor, aturan tense dari leksikon
// penanda waktu (since, by the time, ago, last …), dan diatesis dari anotasi (subjek pelaku/penerima tindakan).
// Agreement: blueprint §4 (contoh "Each of the applicants has submitted", kalimat awal benar), §7; Azar 5-2, 5-4, 5-5;
// Materi §4. Tense: blueprint §4/§7 (perluasan); Azar bab 1–4; Materi §5. Pengecoh tidak memuat bentuk tense lain yang
// juga sah (mis. past progressive dengan yesterday); solver menilai bentuk semacam itu 'ragu' sehingga soal ditolak.

interface KerangkaPredikat {
  id: string;
  tingkat: Tingkat;
  konteks: string;
  kaidah: string;
  kiri: string;
  kanan: string;
  /** kata/frasa inti subjek (each of the applicants, list, a number of …). */
  inti: string;
  /** subjek seperti tercetak, untuk kata kunci. */
  pemicu: string;
  penanda: string | null;
  diatesis: Diatesis;
  lemma: string;
  ekor: string;
  kunci: string;
  salah: string[];
  awal?: string[];
}

const P = (k: Omit<KerangkaPredikat, 'diatesis' | 'penanda'> & { diatesis?: Diatesis; penanda?: string | null }): KerangkaPredikat =>
  ({ diatesis: 'aktif', penanda: null, ...k });

// Kumpulan pengecoh agreement: agreement terbalik, auxiliary + bentuk salah, dan bentuk non-finite.
const HAS_V3 = ['have-v3', 'has-dasar', 'have-dasar', 'has-ing', 'have-ing', 'having-v3'];
const HAVE_V3 = ['has-v3', 'have-dasar', 'has-dasar', 'have-ing', 'having-v3'];
const IS = ['are', 'were', 'be', 'being', 'been'];
const ARE = ['is', 'was', 'be', 'being', 'been'];
const S = ['dasar', 'ing', 'to-dasar', 'have-v3', 'are-ing'];
const DASAR = ['s', 'ing', 'to-dasar', 'has-v3', 'is-ing'];

const AGREEMENT: KerangkaPredikat[] = [
  // Contoh blueprint bagian 4 (uji emas, kalimat awal benar): Each of the applicants has submitted the required documents.
  P({ id: 'each-of-applicants', tingkat: 'dasar', konteks: 'kebijakan', kaidah: 'agreement-kuantitas', kiri: 'Each of the applicants ', kanan: ' the required documents.', inti: 'each of the applicants', pemicu: 'Each of the applicants', lemma: 'submit', ekor: '', kunci: 'has-v3', salah: HAS_V3, awal: ['have-v3', 'have-v3', 'has-dasar'] }),
  P({ id: 'every-room', tingkat: 'dasar', konteks: 'pendidikan', kaidah: 'agreement-kuantitas', kiri: 'Every room in the new building ', kanan: ' a projector and a whiteboard.', inti: 'every room', pemicu: 'Every room in the new building', lemma: 'have', ekor: '', kunci: 'has', salah: ['have', 'having', 'to-have', 'are-having'], awal: ['have'] }),
  P({ id: 'students-in-class', tingkat: 'dasar', konteks: 'pendidikan', kaidah: 'agreement-modifier', kiri: 'The students in this class ', kanan: ' about renewable energy.', inti: 'students', pemicu: 'The students in this class', lemma: 'prepare', ekor: 'a short presentation', kunci: 'are-ing', salah: ['is-ing', 'are-dasar', 'is-dasar', 'be-ing', 'ing'], awal: ['is-ing', 'is-ing', 'are-dasar'] }),
  P({ id: 'list-of-suppliers', tingkat: 'dasar', konteks: 'kebijakan', kaidah: 'agreement-modifier', kiri: 'The list of approved suppliers ', kanan: ' at the start of every month.', inti: 'list', pemicu: 'The list of approved suppliers', lemma: 'update', ekor: '', kunci: 'is-v3', diatesis: 'pasif', salah: ['are-v3', 'is-dasar', 'be-v3', 'being-v3', 'were-v3'], awal: ['are-v3', 'are-v3', 'is-dasar'] }),
  P({ id: 'results-of-survey', tingkat: 'menengah', konteks: 'layanan', kaidah: 'agreement-modifier', kiri: 'The results of the customer satisfaction survey ', kanan: ' in response times.', inti: 'results', pemicu: 'The results of the customer satisfaction survey', lemma: 'show', ekor: 'a clear improvement', kunci: 'dasar', salah: DASAR, awal: ['s', 's', 'has-v3'] }),
  P({ id: 'one-of-printers', tingkat: 'menengah', konteks: 'teknologi', kaidah: 'agreement-kuantitas', kiri: 'One of the new printers on the third floor ', kanan: '.', inti: 'one of the new printers', pemicu: 'One of the new printers', lemma: 'need', ekor: 'a replacement cartridge', kunci: 's', salah: ['dasar', 'ing', 'to-dasar', 'have-v3', 'are-ing'], awal: ['dasar', 'dasar', 'have-v3'] }),
  P({ id: 'number-of-volunteers', tingkat: 'menengah', konteks: 'masyarakat', kaidah: 'agreement-kuantitas', kiri: 'The number of volunteers at the annual beach event ', kanan: ' every year since 2019.', inti: 'the number of volunteers', pemicu: 'The number of volunteers', penanda: 'since 2019', lemma: 'increase', ekor: '', kunci: 'has-v3', salah: HAS_V3, awal: ['have-v3', 'have-v3', 'has-dasar'] }),
  P({ id: 'gerund-subject', tingkat: 'menengah', konteks: 'laporan', kaidah: 'agreement-gerund', kiri: 'Checking all the survey forms by hand ', kanan: ' than using the scanner.', inti: 'checking', pemicu: 'Checking all the survey forms by hand', lemma: 'take', ekor: 'far more time', kunci: 's', salah: S, awal: ['dasar', 'dasar', 'have-v3'] }),
  P({ id: 'information-in-brochures', tingkat: 'menengah', konteks: 'layanan', kaidah: 'agreement-modifier', kiri: 'The information in these brochures ', kanan: ' in four languages at the front desk.', inti: 'information', pemicu: 'The information in these brochures', lemma: 'be', ekor: 'available', kunci: 'is', salah: IS, awal: ['are', 'are', 'were'] }),
  P({ id: 'reports-submitted-by', tingkat: 'menengah', konteks: 'laporan', kaidah: 'agreement-modifier', kiri: 'The reports submitted by the regional office ', kanan: ' in the final totals.', inti: 'reports', pemicu: 'The reports submitted by the regional office', lemma: 'contain', ekor: 'several errors', kunci: 'dasar', salah: ['s', 'ing', 'to-dasar', 'has-v3', 'is-ing'], awal: ['s', 's'] }),
  P({ id: 'members-of-committee', tingkat: 'menengah', konteks: 'kebijakan', kaidah: 'agreement-modifier', kiri: 'The members of the planning committee ', kanan: ' to vote on the proposal.', inti: 'members', pemicu: 'The members of the planning committee', lemma: 'be', ekor: 'ready', kunci: 'are', salah: ARE, awal: ['is', 'is', 'was'] }),
  P({ id: 'a-number-of-residents', tingkat: 'menantang', konteks: 'lingkungan', kaidah: 'agreement-kuantitas', kiri: 'A number of residents living near the new factory ', kanan: ' about the noise at night.', inti: 'a number of residents', pemicu: 'A number of residents', lemma: 'complain', ekor: '', kunci: 'have-v3', salah: HAVE_V3, awal: ['has-v3', 'has-v3', 'have-dasar'] }),
  P({ id: 'along-with', tingkat: 'menantang', konteks: 'proyek', kaidah: 'agreement-modifier', kiri: 'The manager, along with three senior engineers, ', kanan: ' this week.', inti: 'manager', pemicu: 'The manager, along with three senior engineers,', lemma: 'review', ekor: 'the safety report', kunci: 'is-ing', salah: ['are-ing', 'is-dasar', 'are-dasar', 'be-ing', 'ing'], awal: ['are-ing', 'are-ing', 'is-dasar'] }),
  P({ id: 'guidelines-that', tingkat: 'menantang', konteks: 'kebijakan', kaidah: 'agreement-modifier', kiri: 'The guidelines that the committee approved last month ', kanan: ' to sign in at reception.', inti: 'guidelines', pemicu: 'The guidelines that the committee approved last month', lemma: 'require', ekor: 'every visitor', kunci: 'dasar', salah: DASAR, awal: ['s', 's', 'has-v3'] }),
  P({ id: 'quality-of-photos', tingkat: 'menantang', konteks: 'teknologi', kaidah: 'agreement-modifier', kiri: 'The quality of the photos taken by the new cameras ', kanan: ' than we expected.', inti: 'quality', pemicu: 'The quality of the photos taken by the new cameras', lemma: 'be', ekor: 'much better', kunci: 'is', salah: IS, awal: ['are', 'are', 'were'] }),
  P({ id: 'head-of-laboratories', tingkat: 'menantang', konteks: 'riset', kaidah: 'agreement-modifier', kiri: 'The head of the two research laboratories ', kanan: ' for visitors.', inti: 'head', pemicu: 'The head of the two research laboratories', lemma: 'approve', ekor: 'the new safety rules', kunci: 'has-v3', salah: HAS_V3, awal: ['have-v3', 'have-v3', 'has-dasar'] }),
  P({ id: 'findings-yesterday', tingkat: 'menantang', konteks: 'riset', kaidah: 'agreement-modifier', kiri: 'The findings of the independent review ', kanan: " yesterday on the council's website.", inti: 'findings', pemicu: 'The findings of the independent review', penanda: 'yesterday', diatesis: 'pasif', lemma: 'publish', ekor: '', kunci: 'were-v3', salah: ['was-v3', 'were-dasar', 'have-been-v3', 'were-ing', 'being-v3'], awal: ['was-v3', 'was-v3'] }),
];

// Tense dengan penanda eksplisit. Pengecoh: present perfect dengan waktu lampau selesai, past simple dengan since,
// present perfect dengan titik lampau/masa depan, bentuk rusak (has + V1, will + V3), dan non-finite.
const LAMPAU_TUNGGAL = ['has-v3', 'have-v3', 'has-dasar', 'ing', 'will-dasar', 's'];
const LAMPAU_JAMAK = ['have-v3', 'has-v3', 'have-dasar', 'ing', 'will-dasar', 'dasar'];

const TENSE: KerangkaPredikat[] = [
  P({ id: 'two-days-ago', tingkat: 'dasar', konteks: 'layanan', kaidah: 'tense-lampau', kiri: 'Two days ago, the coordinator ', kanan: ' to all workshop participants.', inti: 'coordinator', pemicu: 'the coordinator', penanda: 'Two days ago', lemma: 'send', ekor: 'the final schedule', kunci: 'v2', salah: LAMPAU_TUNGGAL, awal: ['has-v3', 'has-v3', 's'] }),
  P({ id: 'last-year-city', tingkat: 'dasar', konteks: 'masyarakat', kaidah: 'tense-lampau', kiri: 'Last year, the city ', kanan: ' in the northern districts.', inti: 'city', pemicu: 'the city', penanda: 'Last year', lemma: 'open', ekor: 'three new public libraries', kunci: 'v2', salah: LAMPAU_TUNGGAL, awal: ['has-v3', 'has-v3', 's'] }),
  P({ id: 'last-monday-principal', tingkat: 'dasar', konteks: 'pendidikan', kaidah: 'tense-lampau', kiri: 'Last Monday, the school principal ', kanan: ' for the final examinations.', inti: 'principal', pemicu: 'the school principal', penanda: 'Last Monday', lemma: 'announce', ekor: 'a new schedule', kunci: 'v2', salah: LAMPAU_TUNGGAL, awal: ['has-v3', 'has-v3', 's'] }),
  P({ id: 'library-since-2018', tingkat: 'dasar', konteks: 'pendidikan', kaidah: 'tense-since', kiri: 'The public library in our town ', kanan: ' for adults since 2018.', inti: 'library', pemicu: 'The public library', penanda: 'since 2018', lemma: 'offer', ekor: 'free English classes', kunci: 'has-v3', salah: ['v2', 's', 'is-ing', 'has-dasar', 'was-ing'], awal: ['v2', 'v2', 's'] }),
  P({ id: 'researchers-ago', tingkat: 'menengah', konteks: 'riset', kaidah: 'tense-lampau', kiri: 'The researchers ', kanan: ' about local air quality three years ago.', inti: 'researchers', pemicu: 'The researchers', penanda: 'three years ago', lemma: 'publish', ekor: 'their first findings', kunci: 'v2', salah: LAMPAU_JAMAK, awal: ['have-v3', 'have-v3', 'dasar'] }),
  P({ id: 'market-in-2019', tingkat: 'menengah', konteks: 'ekonomi', kaidah: 'tense-lampau', kiri: 'The town market ', kanan: ' in 2019 after years of planning.', inti: 'market', pemicu: 'The town market', penanda: 'in 2019', lemma: 'open', ekor: 'its first indoor hall', kunci: 'v2', salah: LAMPAU_TUNGGAL, awal: ['has-v3', 'has-v3', 's'] }),
  P({ id: 'coordinator-since-opened', tingkat: 'menengah', konteks: 'proyek', kaidah: 'tense-since', kiri: 'Our training coordinator ', kanan: ' since the new office opened in 2021.', inti: 'coordinator', pemicu: 'Our training coordinator', penanda: 'since the new office opened in 2021', lemma: 'work', ekor: 'here', kunci: 'has-v3', salah: ['v2', 's', 'is-ing', 'has-dasar', 'was-ing'], awal: ['v2', 'v2', 's', 'is-ing'] }),
  P({ id: 'laboratories-since', tingkat: 'menengah', konteks: 'riset', kaidah: 'tense-since', kiri: 'The two laboratories ', kanan: ' since the beginning of the project.', inti: 'laboratories', pemicu: 'The two laboratories', penanda: 'since the beginning of the project', lemma: 'share', ekor: 'the same equipment', kunci: 'have-v3', salah: ['v2', 'dasar', 'are-ing', 'has-v3', 'have-dasar'], awal: ['v2', 'v2', 'dasar'] }),
  P({ id: 'at-the-moment', tingkat: 'menengah', konteks: 'teknologi', kaidah: 'tense-kini-progresif', kiri: 'At the moment, two technicians ', kanan: ' in the basement.', inti: 'technicians', pemicu: 'two technicians', penanda: 'At the moment', lemma: 'repair', ekor: 'the main server', kunci: 'are-ing', salah: ['v2', 'were-ing', 'will-dasar', 'are-dasar', 'ing', 'is-ing'], awal: ['v2', 'is-ing', 'are-dasar'] }),
  P({ id: 'bins-last-tuesday', tingkat: 'menengah', konteks: 'lingkungan', kaidah: 'tense-lampau', kiri: 'The new recycling bins ', kanan: ' to every household in the district last Tuesday.', inti: 'bins', pemicu: 'The new recycling bins', penanda: 'last Tuesday', diatesis: 'pasif', lemma: 'deliver', ekor: '', kunci: 'were-v3', salah: ['have-been-v3', 'are-v3', 'were-dasar', 'was-v3', 'will-be-v3'], awal: ['have-been-v3', 'are-v3', 'was-v3'] }),
  P({ id: 'wing-used-since', tingkat: 'menantang', konteks: 'layanan', kaidah: 'tense-since', kiri: 'The east wing of the hospital ', kanan: ' since the new building opened.', inti: 'wing', pemicu: 'The east wing of the hospital', penanda: 'since the new building opened', diatesis: 'pasif', lemma: 'use', ekor: 'as a storage area', kunci: 'has-been-v3', salah: ['was-v3', 'is-v3', 'has-v3', 'has-been-dasar', 'have-been-v3'], awal: ['was-v3', 'is-v3', 'has-v3'] }),
  P({ id: 'by-the-time-arrived', tingkat: 'menantang', konteks: 'kebijakan', kaidah: 'tense-by-lampau', kiri: 'By the time the auditors arrived, the office manager ', kanan: ' all the requested documents.', inti: 'manager', pemicu: 'the office manager', penanda: 'By the time the auditors arrived', lemma: 'prepare', ekor: '', kunci: 'had-v3', salah: ['has-v3', 'will-have-v3', 's', 'is-ing', 'had-dasar', 'have-v3'], awal: ['has-v3', 's', 'have-v3'] }),
  P({ id: 'by-end-next-month', tingkat: 'menantang', konteks: 'lingkungan', kaidah: 'tense-by-depan', kiri: 'By the end of next month, the engineers ', kanan: ' on every school roof.', inti: 'engineers', pemicu: 'the engineers', penanda: 'By the end of next month', lemma: 'install', ekor: 'solar panels', kunci: 'will-have-v3', salah: ['have-v3', 'had-v3', 'v2', 'will-v3', 'will-have-dasar'], awal: ['have-v3', 'v2', 'will-v3'] }),
  P({ id: 'by-the-time-arrives', tingkat: 'menantang', konteks: 'proyek', kaidah: 'tense-by-depan', kiri: 'By the time the new director arrives in June, the hiring panel ', kanan: ' all the candidates.', inti: 'panel', pemicu: 'the hiring panel', penanda: 'By the time the new director arrives in June', lemma: 'interview', ekor: '', kunci: 'will-have-v3', salah: ['has-v3', 'had-v3', 'v2', 'will-have-dasar', 'will-v3'], awal: ['has-v3', 'v2', 'will-v3'] }),
];

function rancang(k: KerangkaPredikat): Rancangan {
  const w = (t: string) => wujud(k.lemma, t);
  return {
    kerangka: k.id, sasaran: k.lemma, kiri: k.kiri, kanan: k.kanan, ekor: k.ekor,
    slot: { jenis: 'predikat', pemicu: k.pemicu, inti: k.inti, penanda: k.penanda, diatesis: k.diatesis },
    kunci: w(k.kunci),
    salah: k.salah.map(w),
    awal: k.awal?.map(w),
    tingkat: k.tingkat,
    kaidah: k.kaidah,
    konteks: k.konteks,
  };
}

const TEKS: Record<string, { konsep: string; caraCepat: string }> = {
  'agreement-modifier': {
    konsep: 'Subject–verb agreement: inti subjek dipisahkan modifier',
    caraCepat: 'Tutup sementara modifier di antara subjek dan verb (frasa of/in, along with, participle, klausa that), temukan kata intinya, lalu cocokkan is/are, has/have, atau verb -s.',
  },
  'agreement-kuantitas': {
    konsep: 'Subject–verb agreement dengan expression of quantity',
    caraCepat: 'Each, every, one of, dan the number of memakai verb singular; a number of + noun jamak memakai verb plural. Setelah itu periksa bentuk verb sesudah auxiliary.',
  },
  'agreement-gerund': {
    konsep: 'Gerund phrase sebagai subjek tunggal',
    caraCepat: 'Bila subjek diawali V-ing (Checking …, Reviewing …), subjek itu satu kegiatan sehingga verb-nya singular, walaupun ada noun jamak di dalamnya.',
  },
  'tense-lampau': {
    konsep: 'Simple past dengan penanda waktu lampau yang selesai',
    caraCepat: 'Penanda seperti yesterday, last week, two days ago, atau in 2019 menunjuk waktu lampau yang selesai: pilih V2 (atau was/were + V3 untuk passive), bukan has/have + V3.',
  },
  'tense-since': {
    konsep: 'Present perfect dengan since',
    caraCepat: 'Since menandai titik awal yang berlanjut sampai sekarang: pilih has/have + V3 (passive: has/have been + V3). Verb di dalam klausa since sendiri tetap V2.',
  },
  'tense-kini-progresif': {
    konsep: 'Present progressive untuk kegiatan yang sedang berlangsung',
    caraCepat: 'At the moment/right now menunjuk proses yang sedang berlangsung: am/is/are + V-ing sesuai jumlah subjek.',
  },
  'tense-by-lampau': {
    konsep: 'Past perfect dengan by the time + klausa lampau',
    caraCepat: 'Bila klausa by the time memakai V2, tindakan yang sudah selesai sebelum titik itu memakai had + V3.',
  },
  'tense-by-depan': {
    konsep: 'Future perfect dengan by + waktu mendatang',
    caraCepat: 'By + waktu mendatang (by the end of next month, by the time … arrives) menandai tindakan yang sudah selesai sebelum titik itu: will have + V3.',
  },
};

const teks = (item: ItemSI) => TEKS[item.kaidah];

export const siAgreement = buatFamily({
  id: 'SI-AGREEMENT',
  nama: 'Subject–verb agreement',
  label: 'VARIASI',
  sumber: 'Blueprint Bahasa Inggris §4 (contoh "Each of the applicants has submitted"), §7 · Azar 5-2, 5-4, 5-5 · Materi §4',
  ringkas: 'Rentang miring adalah predikat yang dipisahkan dari inti subjeknya oleh modifier panjang atau ditentukan oleh ungkapan jumlah (each of, one of, the number of, a number of, gerund). Pengganti benar mengikuti jumlah inti subjek dan bentuk auxiliary yang utuh.',
  rancang: (r: Rng) => rancang(r.pick(AGREEMENT)),
  teks,
});

export const siTense = buatFamily({
  id: 'SI-TENSE',
  nama: 'Tense dengan penanda waktu',
  label: 'VARIASI',
  sumber: 'Blueprint Bahasa Inggris §4 (perluasan tense), §7 · Azar bab 1–4 · Materi §5',
  ringkas: 'Rentang miring adalah predikat yang tense-nya diikat penanda waktu eksplisit: ago/last/in 2019 (past simple), since (present perfect), by the time + V2 (past perfect), by + waktu mendatang (future perfect), at the moment (present progressive).',
  rancang: (r: Rng) => rancang(r.pick(TENSE)),
  teks,
});

export const KERANGKA_PREDIKAT = { AGREEMENT, TENSE, rancang };
