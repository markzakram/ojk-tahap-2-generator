// Leksikon milik solver Sentence Improvement: bentuk verb (V1, -s, V2, V3, V-ing), pola complement verb, jumlah noun
// inti subjek. Pembangun memakai daftar yang sama hanya untuk MENULIS bentuk; keputusan benar/salah diturunkan solver
// (analisis.ts, solver.ts) dari fitur kata ini, bukan dari kunci yang disimpan pembangun.

/** Bentuk morfologis satu kata verb. `dasar` = V1 (juga present non-orang-ketiga-tunggal). */
export type BentukKata = 'dasar' | 's' | 'v2' | 'v3' | 'ing';

/**
 * Pola complement verb (Azar 14-3–14-6, 14-10; Materi bagian 8):
 * gerund = hanya diikuti V-ing (avoid, consider, finish); inf = hanya to + V1 (decide, plan, agree);
 * keduanya = menerima dua bentuk (begin, prefer, remember …) — solver menilai keduanya meragukan sehingga tidak dipakai.
 */
export type PolaKomplemen = 'gerund' | 'inf' | 'keduanya';

export interface EntriVerb {
  dasar: string;
  s: string;
  v2: string;
  v3: string;
  ing: string;
  pola?: PolaKomplemen;
  /** verb + objek + to-infinitive (require/allow/remind sb to do). */
  objInf?: boolean;
  /** "to" sesudah verb ini juga dapat berupa preposisi (agree to + V-ing, admit to + V-ing). */
  prepTo?: boolean;
  /** verb keadaan; tidak lazim dalam progressive. */
  statif?: boolean;
}

// Format: dasar s v2 v3 ing [G|I|B] [O] [P] [T]. Verb yang V1-nya sama dengan V2/V3 (put, set, cut, read …) tidak dimuat
// karena membuat bentuk opsi ambigu; verb dengan ejaan BrE/AmE berbeda (cancel, travel, organise …) juga tidak dimuat.
const DAFTAR = `
prepare prepares prepared prepared preparing
check checks checked checked checking
update updates updated updated updating
join joins joined joined joining
enter enters entered entered entering
use uses used used using
review reviews reviewed reviewed reviewing
lock locks locked locked locking
share shares shared shared sharing
wait waits waited waited waiting
send sends sent sent sending
process processes processed processed processing
handle handles handled handled handling
secure secures secured secured securing
book books booked booked booking
lose loses lost lost losing
complete completes completed completed completing
collect collects collected collected collecting
repeat repeats repeated repeated repeating
explain explains explained explained explaining
persuade persuades persuaded persuaded persuading
provide provides provided provided providing
submit submits submitted submitted submitting
ask asks asked asked asking O
switch switches switched switched switching
test tests tested tested testing
exclude excludes excluded excluded excluding
sign signs signed signed signing
choose chooses chose chosen choosing I
contact contacts contacted contacted contacting
approve approves approved approved approving
meet meets met met meeting
welcome welcomes welcomed welcomed welcoming
receive receives received received receiving
reduce reduces reduced reduced reducing
lower lowers lowered lowered lowering
extend extends extended extended extending
improve improves improved improved improving
manage manages managed managed managing I
help helps helped helped helping B
build builds built built building
train trains trained trained training
answer answers answered answered answering
protect protects protected protected protecting
win wins won won winning
discuss discusses discussed discussed discussing G
finish finishes finished finished finishing G
open opens opened opened opening
keep keeps kept kept keeping G
hold holds held held holding
mind minds minded minded minding G
risk risks risked risked risking G
delay delays delayed delayed delaying G
postpone postpones postponed postponed postponing G
avoid avoids avoided avoided avoiding G
consider considers considered considered considering G
suggest suggests suggested suggested suggesting G
enjoy enjoys enjoyed enjoyed enjoying G
deny denies denied denied denying G
appreciate appreciates appreciated appreciated appreciating G
admit admits admitted admitted admitting G P
work works worked worked working
decide decides decided decided deciding I
plan plans planned planned planning I
agree agrees agreed agreed agreeing I P
refuse refuses refused refused refusing I
replace replaces replaced replaced replacing
hope hopes hoped hoped hoping I
fail fails failed failed failing I
identify identifies identified identified identifying
promise promises promised promised promising I
respond responds responded responded responding
afford affords afforded afforded affording I
hire hires hired hired hiring
expect expects expected expected expecting I O
offer offers offered offered offering I
expand expands expanded expanded expanding
develop develops developed developed developing
upgrade upgrades upgraded upgraded upgrading
recruit recruits recruited recruited recruiting
require requires required required requiring O
allow allows allowed allowed allowing O
remind reminds reminded reminded reminding O
encourage encourages encouraged encouraged encouraging O
advise advises advised advised advising O
save saves saved saved saving
wear wears wore worn wearing
record records recorded recorded recording
generate generates generated generated generating
feed feeds fed fed feeding
clean cleans cleaned cleaned cleaning
report reports reported reported reporting
track tracks tracked tracked tracking
schedule schedules scheduled scheduled scheduling
reschedule reschedules rescheduled rescheduled rescheduling
file files filed filed filing
write writes wrote written writing
give gives gave given giving
lead leads led led leading
plant plants planted planted planting
repair repairs repaired repaired repairing
visit visits visited visited visiting
take takes took taken taking
support supports supported supported supporting
deliver delivers delivered delivered delivering
store stores stored stored storing
walk walks walked walked walking
unlock unlocks unlocked unlocked unlocking
show shows showed shown showing
need needs needed needed needing B
increase increases increased increased increasing
complain complains complained complained complaining
contain contains contained contained containing T
announce announces announced announced announcing
publish publishes published published publishing
interview interviews interviewed interviewed interviewing
install installs installed installed installing
present presents presented presented presenting
object objects objected objected objecting
contribute contributes contributed contributed contributing
insist insists insisted insisted insisting
succeed succeeds succeeded succeeded succeeding
thank thanks thanked thanked thanking
prevent prevents prevented prevented preventing
look looks looked looked looking
arrive arrives arrived arrived arriving
attend attends attended attended attending
offer offers offered offered offering I
begin begins began begun beginning B
start starts started started starting B
continue continues continued continued continuing B
prefer prefers preferred preferred preferring B
try tries tried tried trying B
remember remembers remembered remembered remembering B
forget forgets forgot forgotten forgetting B
stop stops stopped stopped stopping B
regret regrets regretted regretted regretting B
propose proposes proposed proposed proposing B
intend intends intended intended intending B
attempt attempts attempted attempted attempting B
like likes liked liked liking B
`;

export const VERB = new Map<string, EntriVerb>();
for (const baris of DAFTAR.trim().split('\n')) {
  const [dasar, s, v2, v3, ing, ...flag] = baris.trim().split(/\s+/);
  if (VERB.has(dasar)) continue;
  if (dasar === v2 || dasar === v3) throw new Error(`Leksikon: ${dasar} ambigu (V1 = V2/V3)`);
  VERB.set(dasar, {
    dasar, s, v2, v3, ing,
    pola: flag.includes('G') ? 'gerund' : flag.includes('I') ? 'inf' : flag.includes('B') ? 'keduanya' : undefined,
    objInf: flag.includes('O') || undefined,
    prepTo: flag.includes('P') || undefined,
    statif: flag.includes('T') || undefined,
  });
}

/** Satu bacaan morfologis kata: lemma + bentuk. */
export interface Tag { lemma: string; bentuk: BentukKata }

const INDEKS = new Map<string, Tag[]>();
for (const e of VERB.values()) {
  for (const bentuk of ['dasar', 's', 'v2', 'v3', 'ing'] as const) {
    const w = e[bentuk];
    const ada = INDEKS.get(w) ?? [];
    if (!ada.some((t) => t.lemma === e.dasar && t.bentuk === bentuk)) ada.push({ lemma: e.dasar, bentuk });
    INDEKS.set(w, ada);
  }
}

/** Semua bacaan kata sebagai verb leksikal (bukan auxiliary). Kosong bila kata tidak dikenal. */
export function tagVerb(kata: string): Tag[] {
  return INDEKS.get(kata.toLowerCase()) ?? [];
}

/** Bentuk be dan have sebagai kata tersendiri (auxiliary atau verb utama). */
export const BE: Record<string, 'dasar' | 'is' | 'are' | 'am' | 'was' | 'were' | 'v3' | 'ing'> = {
  be: 'dasar', is: 'is', are: 'are', am: 'am', was: 'was', were: 'were', been: 'v3', being: 'ing',
};
export const HAVE: Record<string, 'dasar' | 's' | 'had' | 'ing'> = { have: 'dasar', has: 's', had: 'had', having: 'ing' };
export const MODAL = new Set(['will', 'would', 'can', 'could', 'must', 'should', 'may', 'might', 'shall']);

/** Jumlah noun inti subjek: tunggal, jamak, atau kolektif (team/committee: ragam BrE/AmE berbeda, keduanya diterima). */
export type Jumlah = 'tunggal' | 'jamak' | 'kolektif';

const BENDA: Record<string, Jumlah> = {
  list: 'tunggal', report: 'tunggal', result: 'tunggal', manager: 'tunggal', room: 'tunggal', information: 'tunggal',
  quality: 'tunggal', head: 'tunggal', coordinator: 'tunggal', wing: 'tunggal', library: 'tunggal', principal: 'tunggal',
  city: 'tunggal', analyst: 'tunggal', policy: 'tunggal', system: 'tunggal', software: 'tunggal', director: 'tunggal',
  equipment: 'tunggal', feedback: 'tunggal', market: 'tunggal', schedule: 'tunggal', supervisor: 'tunggal', officer: 'tunggal',
  applicants: 'jamak', results: 'jamak', printers: 'jamak', volunteers: 'jamak', residents: 'jamak', guidelines: 'jamak',
  students: 'jamak', reports: 'jamak', findings: 'jamak', laboratories: 'jamak', engineers: 'jamak', technicians: 'jamak',
  bins: 'jamak', researchers: 'jamak', candidates: 'jamak', forms: 'jamak', documents: 'jamak', lists: 'jamak',
  members: 'jamak', instructions: 'jamak', recommendations: 'jamak', coordinators: 'jamak', inspectors: 'jamak',
  team: 'kolektif', committee: 'kolektif', panel: 'kolektif', staff: 'kolektif', board: 'kolektif', council: 'kolektif',
};

/** Ungkapan kuantitas yang menentukan jumlah (Azar 5-4): each/every/one of → tunggal; a number of → jamak. */
const KUANTOR: Record<string, Jumlah> = {
  each: 'tunggal', every: 'tunggal', one: 'tunggal', 'the number of': 'tunggal', 'a number of': 'jamak',
};

/**
 * Jumlah inti subjek menurut leksikon solver. `inti` = kata inti seperti tercetak (list, each, a number of) atau gerund
 * pembuka subjek (checking → aktivitas tunggal, Materi bagian 4). `undefined` = tidak dikenal (solver menolak menilai).
 */
export function jumlahInti(inti: string): Jumlah | undefined {
  const k = inti.toLowerCase().trim().replace(/\s+/g, ' ');
  if (KUANTOR[k]) return KUANTOR[k];
  // "each of the applicants", "every room", "one of the printers", "a number of residents": kuantor menentukan jumlah.
  for (const kw of Object.keys(KUANTOR).sort((a, b) => b.length - a.length)) if (k.startsWith(`${kw} `)) return KUANTOR[kw];
  if (BENDA[k]) return BENDA[k];
  if (tagVerb(k.split(' ')[0]).some((t) => t.bentuk === 'ing')) return 'tunggal';
  return undefined;
}

/** Tulis bentuk verb untuk pembangun dari templat seperti "has-v3", "to-dasar", "being-v3", "ing" atau kata literal. */
export function wujud(lemma: string, templat: string): string {
  const e = VERB.get(lemma);
  return templat.split('-').map((bagian) => {
    if (bagian === 'dasar' || bagian === 's' || bagian === 'v2' || bagian === 'v3' || bagian === 'ing') {
      if (!e) throw new Error(`Leksikon tidak memuat verb "${lemma}"`);
      return e[bagian];
    }
    return bagian;
  }).join(' ');
}

/**
 * Kata yang ejaannya berbeda antara BrE dan AmE (organise/organize, colour/color, travelled/traveled, centre/center …):
 * dihindari di seluruh soal agar tidak ada penilaian ragam (blueprint bagian 10). Kedua ejaan sama-sama ditolak.
 */
export const RAGAM_EJAAN = new RegExp(String.raw`\b(?:` + [
  String.raw`(?:organi|reali|recogni|prioriti|summari|authori|minimi|maximi|standardi|apologi|emphasi|critici|utili|digiti|customi|finali|categori|speciali|moderni|optimi|computeri|memori|symboli|visuali|familiari|stabili|mobili|centrali|itemi|publici|sympathi|harmoni|capitali|sociali|characteri|legali|neutrali|normali|personali|subsidi|minimi|globali|jeopardi)[sz](?:e|es|ed|ing|ation|ations|er|ers)`,
  String.raw`(?:ana|para|cata)ly[sz](?:e|es|ed|ing)`,
  String.raw`(?:colo|behavio|labo|favo|hono|neighbo|harbo|humo|rumo|vapo|endeavo|savo|flavo|vigo|rigo|armo|odo|valo|tumo)u?r(?:s|ed|ing|able|ite|ites|hood|hoods)?`,
  String.raw`(?:cent|theat|met|lit|fib|calib|sombr|spect)(?:re|er)s?`,
  String.raw`(?:travel|cancel|label|model|signal|total|fuel|level|channel|counsel|marshal|dial|quarrel|tunnel|pedal|equal|rival|shovel)l?(?:ed|ing|er|ers|ation)`,
  String.raw`program(?:me)?s?`, String.raw`licen[cs]e[sd]?`, String.raw`defen[cs]es?`, String.raw`offen[cs]es?`, String.raw`practi[cs]e[sd]?`,
  String.raw`catalog(?:ue)?s?`, String.raw`dialog(?:ue)?s?`, String.raw`enrol(?:l|ls|led|ling|ment|ments|s)?`, String.raw`fulfil(?:l|s|ment)?`,
  String.raw`advis[eo]rs?`, String.raw`judge?ments?`, String.raw`age?ing`, String.raw`gr[ae]y`, String.raw`ty?res?`, String.raw`skeptical|sceptical`,
  String.raw`focus(?:s?ed|s?ing)`, String.raw`benefit(?:t?ed|t?ing)`, String.raw`(?:learn|spel|dream|burn|leap|spil|smel)t`, String.raw`cheques?`,
].join('|') + String.raw`)\b`, 'i');
