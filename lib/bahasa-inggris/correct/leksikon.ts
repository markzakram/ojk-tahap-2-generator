// Leksikon kecil untuk penilai (solver) Grammatically Correct Sentence. Isinya hanya kata yang dipakai kerangka. Kata yang
// tidak ada di sini membuat penilai menolak kalimat (gagal aman), bukan menebak bentuknya dari ejaan.

export type Jumlah = 'tunggal' | 'jamak';

// ——— Noun ———
// `hitung` = countable. Bentuk jamak uncountable (informations, equipments, ...) dicatat dengan `baku: false` agar penilai
// dapat menunjuk kesalahannya; kata itu tidak pernah dianggap benar.
export interface EntriNoun { lema: string; hitung: boolean; jumlah: Jumlah; baku: boolean; jamak?: string }

const NOUN = new Map<string, EntriNoun>();

function hitung(tunggal: string, jamak = `${tunggal}s`) {
  NOUN.set(tunggal, { lema: tunggal, hitung: true, jumlah: 'tunggal', baku: true, jamak });
  NOUN.set(jamak, { lema: tunggal, hitung: true, jumlah: 'jamak', baku: true, jamak });
}
function takHitung(lema: string, jamakTakBaku = `${lema}s`) {
  NOUN.set(lema, { lema, hitung: false, jumlah: 'tunggal', baku: true });
  NOUN.set(jamakTakBaku, { lema, hitung: false, jumlah: 'jamak', baku: false });
}

[
  'application', 'badge', 'cabinet', 'candidate', 'complaint', 'contract', 'coordinator', 'desk', 'detail', 'document',
  'employee', 'error', 'examination', 'finding', 'form', 'group', 'guideline', 'invoice', 'laptop', 'list', 'meeting',
  'module', 'office', 'participant', 'payment', 'printer', 'proposal', 'report', 'request', 'resident', 'result', 'room',
  'sample', 'schedule', 'session', 'supplier', 'target', 'technician', 'test', 'timeline', 'trainee', 'volunteer',
  'workshop',
].forEach((k) => hitung(k));
hitung('bench', 'benches');
hitung('quality', 'qualities');
hitung('laboratory', 'laboratories');
hitung('branch', 'branches');
hitung('bus', 'buses');
['information', 'advice', 'equipment', 'feedback', 'furniture', 'software'].forEach((k) => takHitung(k));

export const noun = (kata: string): EntriNoun | undefined => NOUN.get(kata.toLowerCase());

// ——— Verb ———
export interface EntriVerba { lema: string; s: string; v2: string; v3: string; ing: string }

const VERBA = new Map<string, EntriVerba>();
([
  ['announce', 'announces', 'announced', 'announced', 'announcing'],
  ['approve', 'approves', 'approved', 'approved', 'approving'],
  ['calculate', 'calculates', 'calculated', 'calculated', 'calculating'],
  ['check', 'checks', 'checked', 'checked', 'checking'],
  ['collect', 'collects', 'collected', 'collected', 'collecting'],
  ['delay', 'delays', 'delayed', 'delayed', 'delaying'],
  ['deliver', 'delivers', 'delivered', 'delivered', 'delivering'],
  ['install', 'installs', 'installed', 'installed', 'installing'],
  ['interview', 'interviews', 'interviewed', 'interviewed', 'interviewing'],
  ['introduce', 'introduces', 'introduced', 'introduced', 'introducing'],
  ['leave', 'leaves', 'left', 'left', 'leaving'],
  ['locate', 'locates', 'located', 'located', 'locating'],
  ['postpone', 'postpones', 'postponed', 'postponed', 'postponing'],
  ['process', 'processes', 'processed', 'processed', 'processing'],
  ['publish', 'publishes', 'published', 'published', 'publishing'],
  ['record', 'records', 'recorded', 'recorded', 'recording'],
  ['register', 'registers', 'registered', 'registered', 'registering'],
  ['repair', 'repairs', 'repaired', 'repaired', 'repairing'],
  ['return', 'returns', 'returned', 'returned', 'returning'],
  ['review', 'reviews', 'reviewed', 'reviewed', 'reviewing'],
  ['send', 'sends', 'sent', 'sent', 'sending'],
  ['share', 'shares', 'shared', 'shared', 'sharing'],
  ['sign', 'signs', 'signed', 'signed', 'signing'],
  ['start', 'starts', 'started', 'started', 'starting'],
  ['store', 'stores', 'stored', 'stored', 'storing'],
  ['submit', 'submits', 'submitted', 'submitted', 'submitting'],
  ['update', 'updates', 'updated', 'updated', 'updating'],
  ['wear', 'wears', 'wore', 'worn', 'wearing'],
  ['work', 'works', 'worked', 'worked', 'working'],
] as const).forEach(([lema, s, v2, v3, ing]) => VERBA.set(lema, { lema, s, v2, v3, ing }));

export const verba = (lema: string): EntriVerba | undefined => VERBA.get(lema);

// ——— Pronoun ———
export type KasusPronomina = 'subjek' | 'objek' | 'penentu' | 'milik' | 'refleksif';

/** Bentuk baku per persona (Azar 8-1, 8-4). `its` sebagai possessive pronoun berdiri sendiri tidak dipakai. */
export const PRONOMINA: Record<string, Partial<Record<KasusPronomina, string>>> = {
  I: { subjek: 'I', objek: 'me', penentu: 'my', milik: 'mine', refleksif: 'myself' },
  we: { subjek: 'we', objek: 'us', penentu: 'our', milik: 'ours', refleksif: 'ourselves' },
  he: { subjek: 'he', objek: 'him', penentu: 'his', milik: 'his', refleksif: 'himself' },
  she: { subjek: 'she', objek: 'her', penentu: 'her', milik: 'hers', refleksif: 'herself' },
  they: { subjek: 'they', objek: 'them', penentu: 'their', milik: 'theirs', refleksif: 'themselves' },
  it: { subjek: 'it', objek: 'it', penentu: 'its', refleksif: 'itself' },
};

/** Bentuk tak baku yang sengaja dipakai sebagai kesalahan, beserta persona dan kasus yang dimaksud penulisnya. */
export const PRONOMINA_TAK_BAKU: Record<string, { persona: string; kasus: KasusPronomina; catatan: string }> = {
  theirselves: { persona: 'they', kasus: 'refleksif', catatan: 'Theirselves bukan bentuk baku; reflexive pronoun untuk they adalah themselves.' },
  hisself: { persona: 'he', kasus: 'refleksif', catatan: 'Hisself bukan bentuk baku; reflexive pronoun untuk he adalah himself.' },
  "it's": { persona: 'it', kasus: 'penentu', catatan: "It's adalah singkatan it is atau it has; kepemilikan dinyatakan dengan its." },
};
