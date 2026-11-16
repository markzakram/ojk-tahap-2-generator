import type { Tingkat } from '../model';
import { buatFamily, tetap, varian, type KerangkaGcs } from './kerangka';
import type { Unsur, UnsurSubjek } from './tipe';

// Blueprint §5 "Contoh Correct Sentence — modal dan passive (perluasan)" dan §7 (Passive 11-1–11-4; Modals bab 9–10);
// Materi §6–7. Titik uji: rangkaian verb setelah modal/auxiliary (modal + V1, modal + be + V3, has/have been + V3,
// is/are being + V3, modal + have been + V3), dan pada tingkat menantang ditambah agreement auxiliary pertama.

interface SpekRantai {
  id: string;
  tingkat: Tingkat;
  konteks: string;
  konsep: string;
  kaidah: string;
  subjek: { teks: string; inti: string; penentu?: string; pewatas?: string };
  lema: string;
  peran: 'penerima' | 'pelaku';
  /** `{S}` = subjek, `{0}`/`{1}` = titik verb, teks lain tetap. */
  templat: string;
  /** Varian tiap titik: [teks verb, jumlah kesalahan]; varian pertama = bentuk benar. */
  titik: [string, number][][];
}

const SPEK: SpekRantai[] = [
  // — Dasar: satu rangkaian setelah modal —
  { id: 'applications', tingkat: 'dasar', konteks: 'kebijakan & kepatuhan', konsep: 'Passive dengan modal', kaidah: 'modal-passive', // contoh blueprint §5
    subjek: { teks: 'All applications', inti: 'applications' }, lema: 'submit', peran: 'penerima',
    templat: '{S} {0} through the online portal before the deadline',
    titik: [[['must be submitted', 0], ['must submitted', 1], ['must be submit', 1], ['must been submitted', 1], ['must being submitted', 1], ['must to be submitted', 1], ['must been submit', 2], ['must being submit', 2]]] },
  { id: 'visitor-badges', tingkat: 'dasar', konteks: 'kantor & proyek', konsep: 'Passive dengan modal', kaidah: 'modal-passive',
    subjek: { teks: 'Visitor badges', inti: 'badges' }, lema: 'return', peran: 'penerima',
    templat: '{S} {0} to the reception desk at the end of each day',
    titik: [[['should be returned', 0], ['should returned', 1], ['should be return', 1], ['should been returned', 1], ['should being returned', 1], ['should been return', 2], ['should being return', 2]]] },
  { id: 'lab-checks', tingkat: 'dasar', konteks: 'riset', konsep: 'Passive dengan modal', kaidah: 'modal-passive',
    subjek: { teks: 'The shared laboratory equipment', inti: 'equipment' }, lema: 'check', peran: 'penerima',
    templat: '{S} {0} carefully after every experiment',
    titik: [[['must be checked', 0], ['must checked', 1], ['must be check', 1], ['must been checked', 1], ['must being checked', 1], ['must to be checked', 1], ['must been check', 2], ['must being check', 2]]] },
  { id: 'survey-details', tingkat: 'dasar', konteks: 'teknologi', konsep: 'Passive dengan modal', kaidah: 'modal-passive',
    subjek: { teks: 'Personal details collected in the survey', inti: 'details', pewatas: 'collected in the survey' }, lema: 'share', peran: 'penerima',
    templat: '{S} {0} with other organisations',
    titik: [[['cannot be shared', 0], ['cannot shared', 1], ['cannot be share', 1], ['cannot been shared', 1], ['cannot being shared', 1], ['cannot to be shared', 1], ['cannot been share', 2], ['cannot being share', 2]]] },
  { id: 'participants-register', tingkat: 'dasar', konteks: 'pendidikan & pelatihan', konsep: 'Bentuk dasar setelah modal', kaidah: 'modal-bentuk-dasar',
    subjek: { teks: 'Participants', inti: 'participants' }, lema: 'register', peran: 'pelaku',
    templat: '{S} {0} online at least two days before the workshop',
    titik: [[['must register', 0], ['must registers', 1], ['must to register', 1], ['must registered', 1], ['must registering', 1], ['must to registering', 2], ['must to registered', 2]]] },
  { id: 'staff-glasses', tingkat: 'dasar', konteks: 'kebijakan & kepatuhan', konsep: 'Bentuk dasar setelah modal', kaidah: 'modal-bentuk-dasar',
    subjek: { teks: 'All laboratory staff', inti: 'staff' }, lema: 'wear', peran: 'pelaku',
    templat: '{S} {0} protective glasses during every experiment',
    titik: [[['must wear', 0], ['must wears', 1], ['must to wear', 1], ['must wearing', 1], ['must wore', 1], ['must worn', 1], ['must to wearing', 2], ['must to wears', 2]]] },

  // — Menengah: passive dengan perfect, progressive, atau will pada subjek bermodifier —
  { id: 'safety-guidelines', tingkat: 'menengah', konteks: 'kebijakan & kepatuhan', konsep: 'Present perfect passive', kaidah: 'perfect-passive',
    subjek: { teks: 'The revised safety guidelines for all construction sites', inti: 'guidelines', pewatas: 'for all construction sites' }, lema: 'send', peran: 'penerima',
    templat: '{S} {0} to the site managers',
    titik: [[['have been sent', 0], ['have sent', 1], ['have be sent', 1], ['have being sent', 1], ['have been send', 1], ['have be send', 2], ['have being send', 2]]] },
  { id: 'project-timeline', tingkat: 'menengah', konteks: 'kantor & proyek', konsep: 'Passive progressive', kaidah: 'progressive-passive',
    subjek: { teks: 'The project timeline for next year', inti: 'timeline', pewatas: 'for next year' }, lema: 'review', peran: 'penerima',
    templat: '{S} {0} by the planning committee',
    titik: [[['is being reviewed', 0], ['is been reviewed', 1], ['is reviewing', 1], ['is being review', 1], ['is be reviewed', 1], ['being reviewed', 1], ['is been review', 2], ['is be review', 2]]] },
  { id: 'exam-results', tingkat: 'menengah', konteks: 'pendidikan & pelatihan', konsep: 'Passive dengan will', kaidah: 'modal-passive',
    subjek: { teks: 'The results of the final examination', inti: 'results', pewatas: 'of the final examination' }, lema: 'announce', peran: 'penerima',
    templat: '{S} {0} on the school website next week',
    titik: [[['will be announced', 0], ['will announced', 1], ['will be announce', 1], ['will been announced', 1], ['will being announced', 1], ['will be announcing', 1], ['will been announce', 2], ['will being announce', 2]]] },

  // — Menantang: modal perfect passive, atau agreement auxiliary + bentuk passive (dua titik) —
  { id: 'contract-signed', tingkat: 'menantang', konteks: 'kebijakan & kepatuhan', konsep: 'Passive dengan modal perfect (should have been + V3)', kaidah: 'modal-perfect-passive',
    subjek: { teks: 'The contract', inti: 'contract' }, lema: 'sign', peran: 'penerima',
    templat: '{S} {0} by both parties before the work began',
    titik: [[['should have been signed', 0], ['should have signed', 1], ['should has been signed', 1], ['should have be signed', 1], ['should been signed', 1], ['should have been sign', 1], ['should had been signed', 1], ['should has signed', 2], ['should have be sign', 2]]] },
  { id: 'service-guidelines', tingkat: 'menantang', konteks: 'layanan pelanggan', konsep: 'Subject-verb agreement dan present perfect passive', kaidah: 'agreement-passive',
    subjek: { teks: 'The updated guidelines for the customer service department', inti: 'guidelines', pewatas: 'for the customer service department' }, lema: 'send', peran: 'penerima',
    templat: '{S} {0} {1} to every branch',
    titik: [[['have', 0], ['has', 1]], [['been sent', 0], ['be sent', 1], ['being sent', 1], ['sent', 1], ['been send', 1]]] },
  { id: 'study-findings', tingkat: 'menantang', konteks: 'riset', konsep: 'Subject-verb agreement dan passive', kaidah: 'agreement-passive',
    subjek: { teks: 'The findings of the two-year study on urban air quality', inti: 'findings', pewatas: 'of the two-year study on urban air quality' }, lema: 'publish', peran: 'penerima',
    templat: '{S} {0} {1} in a scientific journal',
    titik: [[['were', 0], ['was', 1]], [['published', 0], ['publish', 1], ['publishing', 1], ['been published', 1], ['be published', 1]]] },
  { id: 'customer-requests', tingkat: 'menantang', konteks: 'teknologi', konsep: 'Subject-verb agreement dan present perfect passive', kaidah: 'agreement-passive',
    subjek: { teks: 'Each of the customer requests', inti: 'requests', penentu: 'Each of the' }, lema: 'record', peran: 'penerima',
    templat: '{S} {0} {1} in the new database',
    titik: [[['has', 0], ['have', 1]], [['been recorded', 0], ['be recorded', 1], ['being recorded', 1], ['recorded', 1], ['been record', 1]]] },
  { id: 'park-benches', tingkat: 'menantang', konteks: 'kegiatan masyarakat', konsep: 'Subject-verb agreement dan passive progressive', kaidah: 'agreement-passive',
    subjek: { teks: 'The new benches for the city park', inti: 'benches', pewatas: 'for the city park' }, lema: 'install', peran: 'penerima',
    templat: '{S} {0} {1} by local volunteers this week',
    titik: [[['are', 0], ['is', 1]], [['being installed', 0], ['been installed', 1], ['being install', 1], ['installing', 1], ['be installed', 1]]] },
];

function wujud(s: SpekRantai): KerangkaGcs {
  const subjek: UnsurSubjek = { teks: s.subjek.teks, peran: 'subjek', klausa: 'u', inti: s.subjek.inti };
  if (s.subjek.penentu) subjek.penentu = s.subjek.penentu;
  if (s.subjek.pewatas) subjek.pewatas = s.subjek.pewatas;
  const pola: (Unsur | number)[] = s.templat.split(/(\{S\}|\{\d\})/).filter((x) => x.trim()).map((x) =>
    x === '{S}' ? subjek : /^\{\d\}$/.test(x) ? Number(x[1]) : tetap(x.trim()));
  const titik = s.titik.map((t) => t.map(([teks, galat]) => varian([{ teks, peran: 'verba', klausa: 'u' }], galat)));
  return {
    id: `rantai-${s.id}`,
    sasaran: s.kaidah,
    tingkat: s.tingkat,
    konteks: s.konteks,
    kaidah: s.kaidah,
    konsep: s.konsep,
    klausa: [{ id: 'u', jenis: 'utama', lema: s.lema, peran: s.peran }],
    pola,
    titik,
    uji: titik.length > 1 ? ['setuju:u', 'rantai:u'] : ['rantai:u'],
  };
}

export const KERANGKA_MODAL_PASIF: KerangkaGcs[][] = SPEK.map((s) => [wujud(s)]);

export const gcsModalPasif = buatFamily({
  id: 'GCS-MODAL-PASIF',
  nama: 'Modal dan passive',
  label: 'VARIASI',
  sumber: 'Blueprint Bahasa Inggris §5 (contoh modal dan passive, perluasan), §7 Passive dan Modals · Materi §6–7 · Azar 11-1–11-4, bab 9–10',
  ringkas: 'Lima kalimat yang hanya berbeda pada rangkaian verb: modal + V1, modal + be + V3, has/have been + V3, is/are being + V3, should have been + V3; tingkat menantang menambah agreement auxiliary pertama. Penilai mengurai rangkaian kata demi kata dan memeriksa voice dari peran subjek.',
  kelompok: KERANGKA_MODAL_PASIF,
  caraCepat: (rel, item) => {
    const r = rel.find((x) => x.jenis === 'rantai');
    const s = rel.find((x) => x.jenis === 'setuju');
    const awal = item.data.klausa[0].peran === 'penerima'
      ? 'Tentukan dulu bahwa subjek menerima tindakan, lalu cari rantai'
      : 'Setelah modal, pakai bentuk dasar tanpa to dan tanpa akhiran:';
    return `${awal} ${r?.ringkas}.${s ? ` Cocokkan juga auxiliary pertama dengan inti subjek: ${s.ringkas}.` : ''}`;
  },
});
