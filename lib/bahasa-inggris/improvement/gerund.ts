import type { Rng } from '../../core/rng';
import type { Tingkat } from '../model';
import { wujud } from './leksikon';
import { buatFamily, type ItemSI, type Rancangan } from './umum';

// Blueprint Bahasa Inggris bagian 4 — pola TERAMATI: gerund setelah preposisi, termasuk to yang berfungsi sebagai
// preposisi (Azar 14-2, 14-6, 14-12; Materi bagian 8). Rentang = verb sasaran + objek/keterangannya; opsi berbeda hanya
// pada bentuk verb (V-ing, to + V1, V1, V2/V3, verb -s) sehingga panjang opsi tidak membocorkan kunci.

interface KerangkaPrep {
  id: string;
  tingkat: Tingkat;
  konteks: string;
  kiri: string;
  kanan: string;
  /** kata/ungkapan pemicu tepat sebelum rentang, mis. "responsible for". */
  pemicu: string;
  preposisi: string;
  /** subjek menerima tindakan → being + V3 (tingkat menantang). */
  pasif?: boolean;
  /** pasangan [lemma, ekor] yang cocok maknanya dengan kerangka. */
  isi: [string, string][];
}

// Preposisi selain to. Tingkat dasar: kalimat pendek, preposisi tepat sebelum rentang. Menengah: pemicu dua kata atau
// klausa/infinitive lain di kalimat. Menantang: gerund pasif (being + V3) yang menuntut dua keputusan (preposisi + diatesis).
const PREP: KerangkaPrep[] = [
  // Contoh blueprint bagian 4 (uji emas): The analyst is responsible for prepare the monthly report before Friday.
  { id: 'responsible-for', tingkat: 'dasar', konteks: 'laporan', kiri: 'The analyst is responsible for ', kanan: ' before Friday.', pemicu: 'responsible for', preposisi: 'for',
    isi: [['prepare', 'the monthly report'], ['check', 'the attendance records'], ['update', 'the project schedule']] },
  { id: 'interested-in', tingkat: 'dasar', konteks: 'masyarakat', kiri: 'Many residents are interested in ', kanan: ' next month.', pemicu: 'interested in', preposisi: 'in',
    isi: [['join', 'the community recycling project'], ['attend', 'the free first aid course']] },
  { id: 'before-entering', tingkat: 'dasar', konteks: 'pendidikan', kiri: 'Please read the safety guidelines carefully before ', kanan: ' for the first time.', pemicu: 'before', preposisi: 'before',
    isi: [['enter', 'the laboratory'], ['use', 'the new equipment']] },
  { id: 'after-reviewing', tingkat: 'dasar', konteks: 'proyek', kiri: 'The committee approved the budget after ', kanan: ' from each department.', pemicu: 'after', preposisi: 'after',
    isi: [['review', 'the cost estimates'], ['collect', 'detailed cost estimates']] },
  { id: 'without-locking', tingkat: 'dasar', konteks: 'teknologi', kiri: 'Staff members should not leave the office without ', kanan: ' first.', pemicu: 'without', preposisi: 'without',
    isi: [['lock', 'their computer screens'], ['switch', 'off their monitors']] },
  { id: 'by-sharing', tingkat: 'dasar', konteks: 'lingkungan', kiri: 'The office reduced its paper use by ', kanan: ' instead of printing them.', pemicu: 'by', preposisi: 'by',
    isi: [['share', 'digital copies of reports'], ['send', 'documents by email']] },
  { id: 'capable-of', tingkat: 'dasar', konteks: 'teknologi', kiri: 'The new booking software is capable of ', kanan: ' in a single hour.', pemicu: 'capable of', preposisi: 'of',
    isi: [['process', 'thousands of requests'], ['handle', 'thousands of requests']] },
  { id: 'thanked-for', tingkat: 'dasar', konteks: 'pendidikan', kiri: 'The trainer thanked the participants for ', kanan: ' before the session ended.', pemicu: 'thanked the participants for', preposisi: 'for',
    isi: [['complete', 'the feedback survey'], ['submit', 'their assignments on time']] },
  { id: 'tired-of', tingkat: 'dasar', konteks: 'pendidikan', kiri: 'Most participants were tired of ', kanan: ' during every training session.', pemicu: 'tired of', preposisi: 'of',
    isi: [['repeat', 'the same exercises']] },
  { id: 'known-for', tingkat: 'dasar', konteks: 'pendidikan', kiri: 'The community school is known for ', kanan: ' to students from low-income families.', pemicu: 'known for', preposisi: 'for',
    isi: [['provide', 'free tutoring'], ['offer', 'free evening classes']] },
  { id: 'instead-of', tingkat: 'menengah', konteks: 'layanan', kiri: 'The team contacted the suppliers directly instead of ', kanan: ' from the head office.', pemicu: 'instead of', preposisi: 'of',
    isi: [['wait', 'for an official reply']] },
  { id: 'succeeded-in', tingkat: 'menengah', konteks: 'masyarakat', kiri: 'After months of planning, the coordinator succeeded in ', kanan: ' for the annual festival.', pemicu: 'succeeded in', preposisi: 'in',
    isi: [['secure', 'additional funding'], ['book', 'a larger venue']] },
  { id: 'worried-about', tingkat: 'menengah', konteks: 'teknologi', kiri: 'Employees who are worried about ', kanan: ' should contact the IT help desk.', pemicu: 'worried about', preposisi: 'about',
    isi: [['lose', 'important files']] },
  { id: 'prevent-from', tingkat: 'menengah', konteks: 'kebijakan', kiri: 'The new guidelines prevent staff from ', kanan: ' with anyone outside the department.', pemicu: 'prevent staff from', preposisi: 'from',
    isi: [['share', 'customer details'], ['discuss', 'confidential cases']] },
  { id: 'insisted-on', tingkat: 'menengah', konteks: 'riset', kiri: 'The research team insisted on ', kanan: ' before publishing any conclusions about the trend.', pemicu: 'insisted on', preposisi: 'on',
    isi: [['collect', 'fresh data'], ['repeat', 'the experiment']] },
  { id: 'advantage-of', tingkat: 'menengah', konteks: 'teknologi', kiri: 'The main advantage of ', kanan: ' is that staff can open files from any location.', pemicu: 'advantage of', preposisi: 'of',
    isi: [['use', 'cloud storage'], ['store', 'documents online']] },
  { id: 'skilled-at', tingkat: 'menengah', konteks: 'layanan', kiri: 'We need volunteers who are skilled at ', kanan: ' to members of the public.', pemicu: 'skilled at', preposisi: 'at',
    isi: [['explain', 'technical information'], ['present', 'complex data']] },
  { id: 'successful-in', tingkat: 'menengah', konteks: 'lingkungan', kiri: 'The environmental group has been successful in ', kanan: ' to reduce plastic waste.', pemicu: 'successful in', preposisi: 'in',
    isi: [['persuade', 'local businesses'], ['encourage', 'local shops']] },
  { id: 'before-submitting', tingkat: 'menengah', konteks: 'laporan', kiri: 'Before ', kanan: ', each author must check all figures and references.', pemicu: 'Before', preposisi: 'before',
    isi: [['submit', 'the final version of the proposal'], ['send', 'the final draft to the editor']] },
  { id: 'no-point-in', tingkat: 'menengah', konteks: 'ekonomi', kiri: 'There is no point in ', kanan: ' after the contract has been signed.', pemicu: 'no point in', preposisi: 'in',
    isi: [['ask', 'the supplier for a discount']] },
  // Gerund pasif: preposisi + being + V3.
  { id: 'without-being-checked', tingkat: 'menantang', konteks: 'kebijakan', kiri: 'New suppliers should not be approved without ', kanan: ' first.', pemicu: 'without', preposisi: 'without', pasif: true,
    isi: [['check', 'by the procurement team'], ['review', 'by the procurement team']] },
  { id: 'about-being-excluded', tingkat: 'menantang', konteks: 'proyek', kiri: 'Several staff members complained about ', kanan: ' last month.', pemicu: 'complained about', preposisi: 'about', pasif: true,
    isi: [['exclude', 'from the planning meetings']] },
  { id: 'despite-being-reviewed', tingkat: 'menantang', konteks: 'laporan', kiri: 'Despite ', kanan: ', the final report still contained several calculation errors.', pemicu: 'Despite', preposisi: 'despite', pasif: true,
    isi: [['review', 'by two senior editors'], ['check', 'by two senior editors']] },
  { id: 'proud-of-being-chosen', tingkat: 'menantang', konteks: 'pendidikan', kiri: 'The students were proud of ', kanan: ' to present their project at the national science fair.', pemicu: 'proud of', preposisi: 'of', pasif: true,
    isi: [['choose', 'by the judges']] },
  { id: 'without-being-signed', tingkat: 'menantang', konteks: 'kebijakan', kiri: 'No application form will be processed without ', kanan: '.', pemicu: 'without', preposisi: 'without', pasif: true,
    isi: [['sign', 'by the applicant'], ['check', 'by a second officer']] },
];

// to sebagai preposisi (pola teramati). Dasar: look forward to dalam kalimat pendek. Menengah: adjective/verb + to lain.
// Menantang: ada to penanda infinitive lain di kalimat yang sama, ungkapan beberapa kata, atau gerund pasif.
const TO: KerangkaPrep[] = [
  { id: 'look-forward-to', tingkat: 'dasar', konteks: 'pendidikan', kiri: 'We look forward to ', kanan: ' at the orientation session next week.', pemicu: 'look forward to', preposisi: 'to',
    isi: [['meet', 'all the new trainees'], ['welcome', 'all the new trainees']] },
  { id: 'looks-forward-to', tingkat: 'dasar', konteks: 'proyek', kiri: 'The project team looks forward to ', kanan: ' next month.', pemicu: 'looks forward to', preposisi: 'to',
    isi: [['receive', 'feedback from the regional offices'], ['present', 'its findings to the regional offices']] },
  { id: 'committed-to', tingkat: 'menengah', konteks: 'lingkungan', kiri: 'The company is committed to ', kanan: ' by twenty percent over the next five years.', pemicu: 'committed to', preposisi: 'to',
    isi: [['reduce', 'its energy consumption'], ['lower', 'its carbon emissions']] },
  { id: 'objected-to', tingkat: 'menengah', konteks: 'pendidikan', kiri: 'Several teachers objected to ', kanan: ' without additional pay or support.', pemicu: 'objected to', preposisi: 'to',
    isi: [['extend', 'the school day'], ['increase', 'their teaching hours']] },
  { id: 'contributed-to', tingkat: 'menengah', konteks: 'teknologi', kiri: 'Regular feedback from users has contributed to ', kanan: ' over the past year.', pemicu: 'contributed to', preposisi: 'to',
    isi: [['improve', 'the design of the website']] },
  { id: 'accustomed-to', tingkat: 'menengah', konteks: 'proyek', kiri: 'The new coordinator is not yet accustomed to ', kanan: ' on her own.', pemicu: 'accustomed to', preposisi: 'to',
    isi: [['manage', 'such a large team'], ['lead', 'such a large team']] },
  { id: 'dedicated-to', tingkat: 'menengah', konteks: 'masyarakat', kiri: 'The foundation is dedicated to ', kanan: ' in rural areas.', pemicu: 'dedicated to', preposisi: 'to',
    isi: [['help', 'young people develop practical job skills'], ['train', 'young people for skilled jobs']] },
  { id: 'opposed-to', tingkat: 'menengah', konteks: 'lingkungan', kiri: 'Many residents are strongly opposed to ', kanan: ' near the river.', pemicu: 'opposed to', preposisi: 'to',
    isi: [['build', 'a new factory']] },
  { id: 'key-to', tingkat: 'menengah', konteks: 'kebijakan', kiri: 'The key to ', kanan: ' for the new policy is clear and regular communication.', pemicu: 'The key to', preposisi: 'to',
    isi: [['win', 'public support']] },
  { id: 'devoted-to', tingkat: 'menengah', konteks: 'riset', kiri: 'The new laboratory will be devoted to ', kanan: ' for local farmers.', pemicu: 'devoted to', preposisi: 'to',
    isi: [['develop', 'drought-resistant crops'], ['test', 'drought-resistant crops']] },
  { id: 'plans-to-committed-to', tingkat: 'menantang', konteks: 'proyek', kiri: 'The agency plans to hire more staff and is committed to ', kanan: ' within the first month.', pemicu: 'committed to', preposisi: 'to',
    isi: [['train', 'every new employee'], ['support', 'every new employee']] },
  { id: 'in-addition-to', tingkat: 'menantang', konteks: 'layanan', kiri: 'In addition to ', kanan: ', the support team now responds to messages on social media.', pemicu: 'In addition to', preposisi: 'to',
    isi: [['answer', 'customer questions by phone']] },
  { id: 'prior-to', tingkat: 'menantang', konteks: 'kebijakan', kiri: 'Prior to ', kanan: ', both parties agreed to review the terms with their lawyers.', pemicu: 'Prior to', preposisi: 'to',
    isi: [['sign', 'the agreement']] },
  { id: 'when-it-comes-to', tingkat: 'menantang', konteks: 'teknologi', kiri: 'When it comes to ', kanan: ', every department must follow the same strict procedures.', pemicu: 'When it comes to', preposisi: 'to',
    isi: [['protect', 'personal data'], ['store', 'personal data']] },
  { id: 'look-forward-to-being-contacted', tingkat: 'menantang', konteks: 'layanan', kiri: 'All shortlisted applicants look forward to ', kanan: ' after the interviews.', pemicu: 'look forward to', preposisi: 'to', pasif: true,
    isi: [['contact', 'by the selection panel']] },
];

function rancang(k: KerangkaPrep, isi: [string, string]): Rancangan {
  const [lemma, ekor] = isi;
  const w = (t: string) => wujud(lemma, t);
  const aktif = !k.pasif;
  const salah = aktif ? ['to-dasar', 'dasar', 'v2', 'v3', 's'].map(w) : ['ing', 'be-v3', 'been-v3', 'to-be-v3', 'v3'].map(w);
  // Bentuk awal yang lazim salah: V1 paling sering; to + V1 hanya bila preposisinya bukan to (agar tidak muncul "to to").
  const awal = aktif
    ? [w('dasar'), w('dasar'), w('v2'), w('s'), ...(k.preposisi === 'to' ? [] : [w('to-dasar')])]
    : [w('v3'), w('ing'), w('be-v3'), ...(k.preposisi === 'to' ? [] : [w('to-be-v3')])];
  return {
    kerangka: k.id, sasaran: lemma, kiri: k.kiri, kanan: k.kanan, ekor,
    slot: { jenis: 'preposisi', pemicu: k.pemicu, preposisi: k.preposisi, diatesis: aktif ? 'aktif' : 'pasif' },
    kunci: aktif ? w('ing') : w('being-v3'),
    salah, awal,
    tingkat: k.tingkat,
    kaidah: k.pasif ? 'gerund-pasif-setelah-preposisi' : k.preposisi === 'to' ? 'gerund-setelah-to-preposisi' : 'gerund-setelah-preposisi',
    konteks: k.konteks,
  };
}

function teks(item: ItemSI) {
  const s = item.data.slot;
  const pasif = s.jenis === 'preposisi' && s.diatesis === 'pasif';
  const to = s.jenis === 'preposisi' && s.preposisi === 'to';
  return {
    konsep: pasif ? 'Gerund pasif (being + V3) setelah preposisi' : to ? 'Gerund setelah to yang berfungsi sebagai preposisi' : 'Gerund setelah preposisi',
    caraCepat: pasif
      ? 'Periksa kata sebelum rentang: preposisi menuntut bentuk -ing. Lalu tanyakan siapa pelakunya; bila subjek menerima tindakan, pilih being + V3.'
      : to
        ? 'Uji to dengan noun: bila ungkapan itu dapat diikuti noun (look forward to the meeting, committed to quality), to adalah preposisi sehingga kegiatan sesudahnya berbentuk V-ing.'
        : 'Periksa kata tepat sebelum rentang. Bila kata itu preposisi (for, in, of, about, before, without, by …), kegiatan sesudahnya ditulis dalam bentuk V-ing.',
  };
}

const pilih = (daftar: KerangkaPrep[]) => (r: Rng) => {
  const k = r.pick(daftar);
  return rancang(k, r.pick(k.isi));
};

export const siGerundPreposisi = buatFamily({
  id: 'SI-GER-PREP',
  nama: 'Gerund setelah preposisi',
  label: 'SHL',
  sumber: 'Blueprint Bahasa Inggris §4 (contoh "responsible for prepare"), §7 · Azar 14-2, 14-12 · Materi §8',
  ringkas: 'Rentang miring berisi kegiatan sesudah preposisi (responsible for, interested in, before, without, by …). Pengganti yang benar memakai V-ing; tingkat menantang memakai gerund pasif being + V3.',
  rancang: pilih(PREP),
  teks,
});

export const siGerundTo = buatFamily({
  id: 'SI-GER-TO',
  nama: 'Gerund setelah to sebagai preposisi',
  label: 'SHL',
  sumber: 'Blueprint Bahasa Inggris §4 ("gerund setelah to yang berfungsi sebagai preposisi"), §7 · Azar 14-6, 14-12 · Materi §8',
  ringkas: 'Rentang miring mengikuti to yang berupa preposisi (look forward to, committed to, objected to, in addition to …). V-ing benar; to + V1 menggandakan to dan V1 keliru membaca to sebagai infinitive.',
  rancang: pilih(TO),
  teks,
});

/** Untuk pengujian: seluruh kerangka family gerund. */
export const KERANGKA_GERUND = { PREP, TO, rancang };
