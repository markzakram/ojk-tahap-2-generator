import type { Rng } from '../../core/rng';
import type { Tingkat } from '../model';
import { wujud } from './leksikon';
import type { Pembuka } from './solver';
import { buatFamily, type ItemSI, type Rancangan } from './umum';

// Blueprint Bahasa Inggris bagian 4 (contoh perluasan "struktur paralel") dan Materi bagian 12: unsur rangkaian
// (daftar tiga tindakan, both … and, either … or, not only … but also) harus sejajar bentuknya. Rentang = satu unsur;
// solver membaca bentuk unsur LAIN yang tercetak (dicatat di slot.unsur) dan pembuka bersama (to, modal, were …).
// Pengulangan to pada satu unsur ("to record, to check, and generate") tidak dipakai sebagai pengecoh karena tidak
// otomatis salah (Materi §12).

type Bentuk = 'dasar' | 'ing' | 'v2' | 'v3' | 's' | 'to-dasar';

interface KerangkaParalel {
  id: string;
  tingkat: Tingkat;
  konteks: string;
  kiri: string;
  anggota: [string, string][];
  /** penghubung antarunsur; panjang = anggota.length − 1. */
  sambung: string[];
  kanan: string;
  bentuk: Bentuk;
  pembuka: Pembuka;
  pemicu: string;
  /** indeks unsur yang boleh menjadi rentang. */
  sasaran: number[];
}

const TIGA = [', ', ', and '];

const KERANGKA: KerangkaParalel[] = [
  // Contoh blueprint bagian 4 (uji emas): The new system allows employees to record transactions, checking balances, and generate reports.
  { id: 'allows-to-record', tingkat: 'menengah', konteks: 'teknologi', kiri: 'The new system allows employees to ', kanan: '.', sambung: TIGA, bentuk: 'dasar', pembuka: 'to', pemicu: 'allows employees to', sasaran: [1, 2],
    anggota: [['record', 'transactions'], ['check', 'balances'], ['generate', 'reports']] },
  { id: 'asked-to-feed', tingkat: 'menengah', konteks: 'masyarakat', kiri: 'Volunteers at the animal shelter are asked to ', kanan: ' before leaving.', sambung: TIGA, bentuk: 'dasar', pembuka: 'to', pemicu: 'are asked to', sasaran: [1, 2],
    anggota: [['feed', 'the animals'], ['clean', 'the cages'], ['record', 'any health problems']] },
  { id: 'app-can-report', tingkat: 'dasar', konteks: 'teknologi', kiri: 'With the new app, residents can ', kanan: ' directly.', sambung: TIGA, bentuk: 'dasar', pembuka: 'modal', pemicu: 'can', sasaran: [1, 2],
    anggota: [['report', 'broken streetlights'], ['track', 'repair requests'], ['contact', 'the city office']] },
  { id: 'students-should', tingkat: 'dasar', konteks: 'pendidikan', kiri: 'During the test, students should ', kanan: '.', sambung: TIGA, bentuk: 'dasar', pembuka: 'modal', pemicu: 'should', sasaran: [1, 2],
    anggota: [['answer', 'every question'], ['check', 'their answers carefully'], ['submit', 'the paper before noon']] },
  { id: 'job-involves', tingkat: 'dasar', konteks: 'layanan', kiri: "The assistant's job involves ", kanan: ' every day.', sambung: TIGA, bentuk: 'ing', pembuka: 'gerund', pemicu: 'involves', sasaran: [1, 2],
    anggota: [['answer', 'phone calls'], ['schedule', 'meetings'], ['update', 'the visitor log']] },
  { id: 'enjoy-walking', tingkat: 'dasar', konteks: 'masyarakat', kiri: 'Many retired residents enjoy ', kanan: '.', sambung: TIGA, bentuk: 'ing', pembuka: 'gerund', pemicu: 'enjoy', sasaran: [1, 2],
    anggota: [['walk', 'in the park'], ['meet', 'old friends'], ['join', 'community classes']] },
  { id: 'course-focuses-on', tingkat: 'menengah', konteks: 'pendidikan', kiri: 'The training course focuses on ', kanan: '.', sambung: TIGA, bentuk: 'ing', pembuka: 'gerund', pemicu: 'focuses on', sasaran: [1, 2],
    anggota: [['write', 'clear emails'], ['give', 'short presentations'], ['lead', 'team meetings']] },
  { id: 'volunteers-last-weekend', tingkat: 'menengah', konteks: 'lingkungan', kiri: 'Last weekend, the volunteers ', kanan: '.', sambung: TIGA, bentuk: 'v2', pembuka: 'lampau', pemicu: 'Last weekend, the volunteers', sasaran: [1, 2],
    anggota: [['collect', 'litter from the park'], ['plant', 'fifty young trees'], ['repair', 'the old playground']] },
  { id: 'inspectors-audit', tingkat: 'menengah', konteks: 'kebijakan', kiri: 'During the audit, the inspectors ', kanan: '.', sambung: TIGA, bentuk: 'v2', pembuka: 'lampau', pemicu: 'During the audit, the inspectors', sasaran: [1, 2],
    anggota: [['visit', 'three warehouses'], ['take', 'photographs of the equipment'], ['write', 'a detailed report']] },
  { id: 'officer-each-morning', tingkat: 'menengah', konteks: 'kebijakan', kiri: 'Each morning, the security officer ', kanan: '.', sambung: TIGA, bentuk: 's', pembuka: 'kini', pemicu: 'Each morning, the security officer', sasaran: [1, 2],
    anggota: [['check', 'the cameras'], ['unlock', 'the main doors'], ['test', 'the fire alarms']] },
  { id: 'either-or', tingkat: 'menengah', konteks: 'layanan', kiri: 'Applicants may either ', kanan: '.', sambung: [' or '], bentuk: 'dasar', pembuka: 'korelatif', pemicu: 'either … or', sasaran: [0, 1],
    anggota: [['submit', 'the form online'], ['deliver', 'it in person at the main office']] },
  { id: 'not-only-but-also', tingkat: 'menantang', konteks: 'lingkungan', kiri: 'The new heating system not only ', kanan: ' during winter.', sambung: [' but also '], bentuk: 's', pembuka: 'korelatif', pemicu: 'not only … but also', sasaran: [0, 1],
    anggota: [['reduce', 'energy costs'], ['keep', 'the building warmer']] },
  { id: 'both-to-and', tingkat: 'menantang', konteks: 'pendidikan', kiri: 'The workshop is designed both ', kanan: '.', sambung: [' and '], bentuk: 'to-dasar', pembuka: 'korelatif', pemicu: 'both … and', sasaran: [1],
    anggota: [['train', 'new volunteers'], ['support', 'experienced members of the team']] },
  { id: 'forms-were', tingkat: 'menantang', konteks: 'riset', kiri: 'All the survey forms were ', kanan: '.', sambung: TIGA, bentuk: 'v3', pembuka: 'pasif', pemicu: 'were', sasaran: [1, 2],
    anggota: [['collect', ''], ['check', 'for missing answers'], ['store', 'in a locked cabinet']] },
  { id: 'minutes-were', tingkat: 'menantang', konteks: 'kebijakan', kiri: 'Before the meeting, the minutes were ', kanan: '.', sambung: TIGA, bentuk: 'v3', pembuka: 'pasif', pemicu: 'were', sasaran: [1, 2],
    anggota: [['write', 'by the secretary'], ['check', 'by the chair'], ['send', 'to all members']] },
];

/** Bentuk salah per bentuk sejajar: kesalahan khas bentuk verb pada unsur rangkaian. */
const SALAH: Record<Bentuk, { salah: string[]; awal: string[] }> = {
  dasar: { salah: ['ing', 's', 'v2', 'v3', 'to-ing', 'to-dasar'], awal: ['ing', 'ing', 's'] },
  ing: { salah: ['dasar', 's', 'v2', 'v3', 'to-dasar'], awal: ['dasar', 'dasar', 'to-dasar'] },
  v2: { salah: ['dasar', 's', 'ing', 'to-dasar', 'v3'], awal: ['dasar', 's', 'ing'] },
  v3: { salah: ['dasar', 's', 'ing', 'to-dasar', 'v2'], awal: ['dasar', 'ing'] },
  s: { salah: ['dasar', 'ing', 'to-dasar', 'v2'], awal: ['dasar', 'ing'] },
  'to-dasar': { salah: ['ing', 's', 'v2', 'to-ing'], awal: ['ing', 'ing'] },
};

function rancang(k: KerangkaParalel, iSasaran: number): Rancangan {
  const render = ([lemma, ekor]: [string, string]) => `${wujud(lemma, k.bentuk)}${ekor ? ` ${ekor}` : ''}`;
  let kiri = k.kiri;
  for (let i = 0; i < iSasaran; i++) kiri += render(k.anggota[i]) + k.sambung[i];
  let kanan = '';
  for (let i = iSasaran + 1; i < k.anggota.length; i++) kanan += k.sambung[i - 1] + render(k.anggota[i]);
  kanan += k.kanan;
  const [lemma, ekor] = k.anggota[iSasaran];
  const w = (t: string) => wujud(lemma, t);
  const pola = SALAH[k.bentuk];
  // Dalam rangkaian yang berbagi to, "to + V1" pada satu unsur tidak otomatis salah → tidak dipakai.
  const salah = pola.salah.filter((t) => !(k.pembuka === 'to' && t === 'to-dasar') && !(k.pembuka === 'modal' && t === 'to-ing'));
  return {
    kerangka: k.id, sasaran: lemma, kiri, kanan, ekor,
    slot: { jenis: 'paralel', pemicu: k.pemicu, pembuka: k.pembuka, unsur: k.anggota.filter((_, i) => i !== iSasaran).map(([l]) => wujud(l, k.bentuk)) },
    kunci: w(k.bentuk),
    salah: salah.map(w),
    awal: pola.awal.map(w),
    tingkat: k.tingkat,
    kaidah: k.pembuka === 'korelatif' ? 'paralel-korelatif' : 'paralel-daftar',
    konteks: k.konteks,
  };
}

function teks(item: ItemSI) {
  const s = item.data.slot;
  const pembuka = s.jenis === 'paralel' ? s.pembuka : 'to';
  const cepat: Record<Pembuka, string> = {
    to: 'Tandai semua unsur rangkaian. To di depan unsur pertama berlaku untuk semua unsur, jadi setiap unsur cukup berbentuk V1.',
    modal: 'Modal di depan unsur pertama berlaku untuk semua unsur rangkaian, jadi setiap unsur berbentuk V1.',
    gerund: 'Tandai semua unsur rangkaian. Bila unsur yang tidak ditandai berbentuk V-ing, rentang juga harus V-ing.',
    lampau: 'Rangkaian tindakan dengan satu subjek memakai bentuk yang sama; bila unsur lain V2, rentang juga V2.',
    kini: 'Rangkaian tindakan dengan satu subjek tunggal dalam present memakai verb berakhiran -s pada setiap unsur.',
    pasif: 'Were di depan unsur pertama berlaku untuk semua unsur, jadi setiap unsur berbentuk V3.',
    korelatif: 'Bandingkan unsur setelah both/either/not only dengan unsur setelah and/or/but also; keduanya harus berbentuk sama.',
  };
  return {
    konsep: pembuka === 'korelatif' ? 'Parallel structure dengan pasangan conjunction' : 'Parallel structure dalam rangkaian',
    caraCepat: cepat[pembuka],
  };
}

export const siParalel = buatFamily({
  id: 'SI-PARALEL',
  nama: 'Struktur paralel',
  label: 'VARIASI',
  sumber: 'Blueprint Bahasa Inggris §4 (contoh perluasan "record, checking, generate"), §7 · Azar 16-1, 16-4 · Materi §12',
  ringkas: 'Rentang miring adalah satu unsur rangkaian (daftar tiga tindakan atau both/either/not only). Pengganti yang benar menyamakan bentuk dengan unsur lain: V1 berbagi to/modal, V-ing, V2, V3 berbagi were, atau verb -s.',
  rancang: (r: Rng) => {
    const k = r.pick(KERANGKA);
    return rancang(k, r.pick(k.sasaran));
  },
  teks,
});

export const KERANGKA_PARALEL = { KERANGKA, rancang };
