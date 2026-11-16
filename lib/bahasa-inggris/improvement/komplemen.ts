import type { Rng } from '../../core/rng';
import type { Tingkat } from '../model';
import { VERB, wujud } from './leksikon';
import { buatFamily, type ItemSI, type Rancangan } from './umum';

// Blueprint Bahasa Inggris bagian 4 (perluasan "pemilihan gerund/infinitive") dan Materi bagian 8: verb yang HANYA
// menerima gerund (avoid, consider, finish …) atau HANYA to-infinitive (decide, plan, agree …), verb + objek + to-infinitive,
// serta rentang sesudah to penanda infinitive (plans to ___). Verb yang menerima keduanya (begin, prefer, remember, stop …)
// dikecualikan: leksikon solver menandainya 'keduanya' sehingga soal semacam itu selalu ditolak.

type Jenis = 'komplemen' | 'objek' | 'setelah-to';

interface KerangkaKomp {
  id: string;
  tingkat: Tingkat;
  konteks: string;
  kiri: string;
  kanan: string;
  /** lemma verb yang menentukan bentuk complement. */
  verb: string;
  pemicu: string;
  jenis: Jenis;
  isi: [string, string][];
}

const K = (id: string, tingkat: Tingkat, konteks: string, jenis: Jenis, verb: string, pemicu: string, kiri: string, kanan: string, isi: [string, string][]): KerangkaKomp =>
  ({ id, tingkat, konteks, jenis, verb, pemicu, kiri, kanan, isi });

const KERANGKA: KerangkaKomp[] = [
  // verb + gerund
  K('avoided', 'dasar', 'proyek', 'komplemen', 'avoid', 'avoided', 'The manager avoided ', ' during the team meeting on Monday.', [['discuss', 'the budget cuts'], ['share', 'the survey results']]),
  K('finished', 'dasar', 'teknologi', 'komplemen', 'finish', 'finished', 'The engineers finished ', ' late on Friday, just before the deadline.', [['test', 'the new software'], ['install', 'the security updates']]),
  K('enjoy', 'dasar', 'pendidikan', 'komplemen', 'enjoy', 'enjoy', 'Most students enjoy ', ' with classmates from other schools during the summer camp.', [['work', 'on group projects'], ['share', 'ideas']]),
  K('considering', 'menengah', 'masyarakat', 'komplemen', 'consider', 'is considering', 'After the survey, the city council is considering ', ' on Sunday mornings.', [['open', 'the public library'], ['extend', 'bus services']]),
  K('suggested', 'menengah', 'laporan', 'komplemen', 'suggest', 'suggested', 'The auditor suggested ', ' of all equipment borrowed by staff this year.', [['keep', 'a separate record']]),
  K('postponed', 'menengah', 'masyarakat', 'komplemen', 'postpone', 'postponed', 'Because of the heavy rain, the committee postponed ', ' until next month.', [['hold', 'the outdoor event'], ['open', 'the new sports field']]),
  K('discussed', 'menengah', 'riset', 'komplemen', 'discuss', 'have discussed', 'The two research teams have discussed ', ' to reduce costs.', [['share', 'their laboratory equipment']]),
  K('kept', 'menengah', 'laporan', 'komplemen', 'keep', 'kept', 'The supervisor kept ', ' until she found the error.', [['check', 'the figures in the spreadsheet']]),
  K('would-not-mind', 'menantang', 'layanan', 'komplemen', 'mind', 'would not mind', 'Many customers would not mind ', ' if the service were more reliable.', [['wait', 'a few extra days']]),
  K('could-not-risk', 'menantang', 'proyek', 'komplemen', 'risk', 'could not risk', 'The director could not risk ', ' again, so she approved the extra budget.', [['delay', 'the product launch'], ['postpone', 'the product launch']]),
  K('denied', 'menantang', 'layanan', 'komplemen', 'deny', 'denied', 'The spokesperson denied ', ' about the new recycling schedule before Monday.', [['receive', 'any complaints']]),
  K('appreciate', 'menantang', 'layanan', 'komplemen', 'appreciate', 'appreciate', 'Our customers appreciate ', ' when there is a delay.', [['receive', 'clear updates by email']]),
  // verb + to-infinitive
  K('decided', 'dasar', 'teknologi', 'komplemen', 'decide', 'decided', 'The board decided ', ' until the safety review is complete.', [['postpone', 'the launch'], ['delay', 'the launch']]),
  K('plans', 'dasar', 'pendidikan', 'komplemen', 'plan', 'plans', 'The school plans ', ' in the eastern district next year.', [['open', 'a second library'], ['build', 'a second library']]),
  K('offered', 'dasar', 'masyarakat', 'komplemen', 'offer', 'offered', 'The volunteers offered ', ' after the community festival on Sunday.', [['collect', 'all the litter'], ['clean', 'the main square']]),
  K('agreed', 'menengah', 'proyek', 'komplemen', 'agree', 'agreed', 'After a long discussion, the committee agreed ', ' for project proposals by two weeks.', [['extend', 'the deadline']]),
  K('refused', 'menengah', 'layanan', 'komplemen', 'refuse', 'refused', 'The supplier refused ', ' without an official receipt from the store.', [['replace', 'the damaged printers']]),
  K('hopes', 'menengah', 'lingkungan', 'komplemen', 'hope', 'hopes', 'The city hopes ', ' near schools by offering free bus passes to students.', [['reduce', 'traffic'], ['lower', 'traffic levels']]),
  K('afford', 'menengah', 'ekonomi', 'komplemen', 'afford', 'could not afford', 'The small business could not afford ', ' during the busy season.', [['hire', 'additional staff']]),
  K('failed', 'menantang', 'teknologi', 'komplemen', 'fail', 'failed', 'Despite several attempts, the technicians failed ', ' of the network outage last week.', [['identify', 'the cause']]),
  K('promised', 'menantang', 'layanan', 'komplemen', 'promise', 'has promised', 'The new manager has promised ', ' within two working days.', [['respond', 'to every complaint'], ['answer', 'every complaint']]),
  K('expects', 'menantang', 'teknologi', 'komplemen', 'expect', 'expects', 'The team expects ', ' before the old servers are switched off in March.', [['complete', 'the migration']]),
  K('managed', 'menantang', 'proyek', 'komplemen', 'manage', 'managed', 'Although the budget was small, the team managed ', ' on time.', [['complete', 'the renovation'], ['finish', 'the renovation']]),
  // verb + objek + to-infinitive
  K('allows', 'dasar', 'teknologi', 'objek', 'allow', 'allows users', 'The system allows users ', ' without calling the help desk.', [['update', 'their contact details'], ['check', 'their booking status']]),
  K('encourage', 'dasar', 'pendidikan', 'objek', 'encourage', 'encourage students', 'Our teachers always encourage students ', ' during and after every lesson.', [['ask', 'questions']]),
  K('requires', 'menengah', 'kebijakan', 'objek', 'require', 'requires all employees', 'The new policy requires all employees ', ' by the end of March.', [['complete', 'the online safety course'], ['attend', 'a short safety briefing']]),
  K('advise', 'menengah', 'riset', 'objek', 'advise', 'advise visitors', 'The guidelines advise visitors ', ' in all areas of the laboratory.', [['wear', 'protective glasses']]),
  K('reminded', 'menantang', 'teknologi', 'objek', 'remind', 'reminded the new interns', 'The supervisor reminded the new interns ', ' regularly while the network was unstable.', [['save', 'their work']]),
  // to penanda infinitive sudah di luar rentang
  K('plans-to', 'menengah', 'pendidikan', 'setelah-to', 'plan', 'plans to', 'The library plans to ', ' over the next two years.', [['expand', 'its digital collection']]),
  K('hopes-to', 'menengah', 'riset', 'setelah-to', 'hope', 'hopes to', 'Our department hopes to ', ' before the start of the new year.', [['recruit', 'two more data analysts'], ['hire', 'two more data analysts']]),
  K('refused-to', 'menengah', 'kebijakan', 'setelah-to', 'refuse', 'refused to', 'Several tenants refused to ', ' until the repairs were finished.', [['sign', 'the new contract']]),
  K('decided-to', 'menantang', 'layanan', 'setelah-to', 'decide', 'has decided to', 'The hospital has decided to ', ' after receiving many complaints from patients.', [['upgrade', 'its booking system'], ['replace', 'its booking system']]),
  K('promised-to', 'menantang', 'proyek', 'setelah-to', 'promise', 'has promised to', 'Although the project is behind schedule, the contractor has promised to ', ' before the end of May.', [['finish', 'the work'], ['complete', 'the work']]),
];

function rancang(k: KerangkaKomp, [lemma, ekor]: [string, string]): Rancangan {
  const w = (t: string) => wujud(lemma, t);
  const pola = VERB.get(k.verb)?.pola;
  let kunci: string;
  let salah: string[];
  let awal: string[];
  if (k.jenis === 'setelah-to') {
    kunci = w('dasar');
    salah = ['ing', 'to-dasar', 'v2', 'v3', 's'].map(w);
    awal = [w('ing'), w('ing'), w('v2')];
  } else if (k.jenis === 'objek' || pola === 'inf') {
    kunci = w('to-dasar');
    // agree to + V-ing dapat dibaca to sebagai preposisi, jadi to + V-ing tidak dipakai sebagai pengecoh untuk verb itu.
    salah = ['ing', 'dasar', 'v2', 's', ...(VERB.get(k.verb)?.prepTo ? [] : ['to-ing'])].map(w);
    awal = k.jenis === 'objek' ? [w('dasar'), w('ing')] : [w('ing'), w('ing'), w('dasar')];
  } else {
    kunci = w('ing');
    salah = ['to-dasar', 'dasar', 'v2', 's', 'to-ing'].map(w);
    awal = [w('to-dasar'), w('to-dasar'), w('dasar')];
  }
  return {
    kerangka: k.id, sasaran: lemma, kiri: k.kiri, kanan: k.kanan, ekor,
    slot: k.jenis === 'setelah-to'
      ? { jenis: 'setelah-to', pemicu: k.pemicu, verb: k.verb, diatesis: 'aktif' }
      : { jenis: 'komplemen', pemicu: k.pemicu, verb: k.verb, objek: k.jenis === 'objek', diatesis: 'aktif' },
    kunci, salah, awal,
    tingkat: k.tingkat,
    kaidah: k.jenis === 'setelah-to' ? 'infinitive-setelah-to' : k.jenis === 'objek' ? 'verb-objek-infinitive' : pola === 'gerund' ? 'verb-gerund' : 'verb-infinitive',
    konteks: k.konteks,
  };
}

function teks(item: ItemSI) {
  const k = item.kaidah;
  if (k === 'verb-gerund') return {
    konsep: 'Verb yang hanya diikuti gerund (V-ing)',
    caraCepat: 'Kenali verb yang langsung diikuti V-ing (avoid, consider, finish, postpone, suggest, enjoy, mind, risk, deny, keep). Setelah verb itu tidak ada to.',
  };
  if (k === 'verb-infinitive') return {
    konsep: 'Verb yang hanya diikuti to-infinitive',
    caraCepat: 'Kelompok decide, plan, agree, refuse, hope, fail, promise, afford, offer, manage, expect diikuti to + V1. Pastikan to ada dan verb sesudahnya V1.',
  };
  if (k === 'verb-objek-infinitive') return {
    konsep: 'Verb + objek + to-infinitive',
    caraCepat: 'Setelah require, allow, remind, encourage, atau advise + objek, kegiatan yang diminta ditulis to + V1.',
  };
  return {
    konsep: 'To sebagai penanda infinitive (to + V1)',
    caraCepat: 'Bila to di luar rentang adalah bagian dari verb + to-infinitive (plan to, decide to, hope to), rentang cukup berisi V1 tanpa to tambahan.',
  };
}

export const siKomplemenVerb = buatFamily({
  id: 'SI-KOMPLEMEN',
  nama: 'Gerund atau to-infinitive setelah verb',
  label: 'VARIASI',
  sumber: 'Blueprint Bahasa Inggris §4 (perluasan gerund/infinitive), §7 · Azar 14-3–14-6, 14-10, 15-1 · Materi §8',
  ringkas: 'Rentang miring adalah complement verb: verb yang hanya menerima V-ing (avoid, consider, finish), hanya to + V1 (decide, plan, agree), verb + objek + to-infinitive, atau V1 setelah to penanda infinitive. Verb yang menerima keduanya dikecualikan.',
  rancang: (r: Rng) => {
    const k = r.pick(KERANGKA);
    return rancang(k, r.pick(k.isi));
  },
  teks,
});

export const KERANGKA_KOMPLEMEN = { KERANGKA, rancang };
