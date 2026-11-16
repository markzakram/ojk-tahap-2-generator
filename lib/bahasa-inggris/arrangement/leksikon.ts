import { KATA_TANYA, PREPOSISI } from './tata-bahasa';

// Leksikon bacaan kelas kata untuk anotasi fragmen Sentence Arrangement. Setiap kata menyimpan SEMUA bacaan yang wajar
// (mis. "reports" = noun jamak dan verb bentuk -s), karena bacaan yang terlewat dapat menyembunyikan urutan alternatif.
//
// Kode bacaan: KATEGORI[.fitur]*[>subkategori,...]
//   N.s|p[.m].h|n[.pg][.inf][.to]  noun tunggal/jamak; m = dapat tanpa determiner (uncountable); h = orang/lembaga,
//                             n = lainnya; pg = menerima preposisi + gerund (a procedure for checking), inf = menerima
//                             to-infinitive (a plan to expand), to = menerima PP to (a guide to, a route to)
//                             kol = bacaan jamak collective noun (the team are): tidak boleh tanpa determiner
//   NM                        noun sebagai pewatas (compliance officer)
//   A[.attr][.h|n]>…          adjective; attr = hanya atributif; h/n = kelas subjek; subkategori pp:<prep>, inf, wh, that
//   D.s|p|x  NUM  GEN.s|p     determiner tunggal/jamak/bebas; bilangan; noun posesif (company's = GEN.s, children's = GEN.p)
//   V.<bentuk>[.h|n]>…        bentuk: base, pl, 3s, past, en (perfect), ing, pas (passive); h/n = kelas subjek;
//                             subkategori: 0, np, np_np, np_inf, inf, wh, np_wh, ger, that, adj, pp:<prep>, np_pp:<prep>,
//                             to_wh/to_that (verb komunikasi: explain to the team why/that …);
//                             akhiran /h atau /n pada subkategori berobjek = kelas objek (np/n: "explain the rules")
//   BE.base|3s|pl|pastS|pastP|en|ing   HAVE.base|3s|pl|past|ing   MOD   NOT   TO   ADV
//   P.<prep>   WH.<kata>   REL.who|which|that   COMP (that)

export const LEKSIKON: Record<string, string[]> = {};

function k(kata: string, ...bacaan: string[]) {
  const x = (LEKSIKON[kata] ??= []);
  for (const b of bacaan) if (!x.includes(b)) x.push(b);
}

type Kls = 'h' | 'n';

/** Noun beraturan atau tidak: tunggal, jamak (null = tidak dipakai), kelas, lisensi. */
function noun(tunggal: string, jamak: string | null, kls: Kls, op: { m?: boolean; pg?: boolean; inf?: boolean; to?: boolean; nm?: boolean; kolektif?: boolean } = {}) {
  const lis = `${op.pg ? '.pg' : ''}${op.inf ? '.inf' : ''}${op.to ? '.to' : ''}`;
  k(tunggal, `N.s${op.m ? '.m' : ''}.${kls}${lis}`);
  // Collective noun (team, staff, committee) dapat diikuti verb jamak dalam BrE: terima keduanya agar tidak ada kunci semu.
  if (op.kolektif) k(tunggal, `N.p.${kls}.kol${lis}`);
  if (jamak) k(jamak, `N.p.${kls}${lis}`);
  if (op.nm) k(tunggal, 'NM');
}

/** Kata benda yang hanya dipakai sebagai pewatas noun lain (expense claims, safety rules). */
function pewatas(...kata: string[]) { for (const x of kata) k(x, 'NM'); }

function adj(kata: string, op: { attr?: boolean; kls?: Kls; sub?: string[] } = {}) {
  k(kata, `A${op.attr ? '.attr' : ''}${op.kls ? '.' + op.kls : ''}${op.sub?.length ? '>' + op.sub.join(',') : ''}`);
}

function adv(...kata: string[]) { for (const x of kata) k(x, 'ADV'); }

/**
 * Verb beserta seluruh bentuknya. `akt` = subkategori aktif; `pas` = subkategori passive (tanpa = tidak dipakai passive).
 * `kls` = kelas subjek aktif; `klsPas` = kelas subjek passive (= objek aktif).
 */
function verba(o: { dasar: string; s3: string; lampau: string; v3?: string; ing: string; kls?: Kls; akt: string[]; pas?: string[]; klsPas?: Kls }) {
  const sel = o.kls ? '.' + o.kls : '';
  const sub = '>' + o.akt.join(',');
  k(o.dasar, `V.base${sel}${sub}`, `V.pl${sel}${sub}`);
  k(o.s3, `V.3s${sel}${sub}`);
  k(o.lampau, `V.past${sel}${sub}`);
  const v3 = o.v3 ?? o.lampau;
  k(v3, `V.en${sel}${sub}`);
  if (o.pas) k(v3, `V.pas${o.klsPas ? '.' + o.klsPas : ''}>${o.pas.join(',')}`);
  k(o.ing, `V.ing${sel}${sub}`);
}

// ---- Kata fungsi ----
for (const d of ['the', 'their', 'its', 'our', 'his', 'her', 'some', 'any', 'no', 'your']) k(d, 'D.x');
for (const d of ['a', 'an', 'each', 'every', 'this', 'another', 'one']) k(d, 'D.s');
for (const d of ['all', 'these', 'those', 'several', 'many', 'both', 'few', 'most', 'other']) k(d, 'D.p');
for (const d of ['two', 'three', 'four', 'five']) k(d, 'NUM');
k('that', 'D.s', 'REL.that', 'COMP');
k('which', 'REL.which');
k('who', 'REL.who');
for (const p of PREPOSISI) k(p, `P.${p}`);
k('to', 'TO');
for (const w of KATA_TANYA) k(w, `WH.${w}`);
k('be', 'BE.base'); k('is', 'BE.3s'); k('are', 'BE.pl'); k('was', 'BE.pastS'); k('were', 'BE.pastP'); k('been', 'BE.en'); k('being', 'BE.ing');
k('have', 'HAVE.base', 'HAVE.pl'); k('has', 'HAVE.3s'); k('had', 'HAVE.past'); k('having', 'HAVE.ing');
for (const m of ['must', 'should', 'will', 'would', 'can', 'could', 'may', 'might']) k(m, 'MOD');
k('not', 'NOT');

// ---- Noun: orang dan lembaga (h) ----
for (const [t, j] of [['agent', 'agents'], ['assistant', 'assistants'], ['auditor', 'auditors'], ['customer', 'customers'], ['director', 'directors'],
  ['engineer', 'engineers'], ['leader', 'leaders'], ['manager', 'managers'], ['member', 'members'], ['participant', 'participants'],
  ['researcher', 'researchers'], ['resident', 'residents'], ['student', 'students'], ['teacher', 'teachers'], ['volunteer', 'volunteers'],
  ['worker', 'workers'], ['family', 'families'], ['company', 'companies'], ['business', 'businesses'], ['laboratory', 'laboratories'],
  ['principal', 'principals'], ['user', 'users'], ['officer', 'officers'], ['supervisor', 'supervisors'], ['employee', 'employees'],
  ['supplier', 'suppliers'], ['librarian', 'librarians']] as const) noun(t, j, 'h');
for (const t of ['team', 'committee', 'council', 'government']) noun(t, `${t}s`, 'h', { kolektif: true });
noun('staff', null, 'h'); k('staff', 'N.p.h');
noun('management', null, 'h', { m: true, kolektif: true });
noun('public', null, 'h', { kolektif: true });
pewatas('compliance', 'customer', 'user', 'staff', 'management', 'library', 'city', 'class', 'school', 'research', 'survey', 'finance',
  'health', 'emergency', 'water', 'safety', 'street', 'study', 'product', 'project', 'refund', 'permission', 'budget', 'branch',
  'service', 'energy', 'household', 'office', 'training', 'drinking', 'team', 'review', 'policy', 'expense', 'claim', 'event',
  'plastic', 'maintenance', 'walking', 'fire', 'science', 'help');
k("company's", 'GEN.s'); k("laboratory's", 'GEN.s'); k("department's", 'GEN.s'); k("children's", 'GEN.p'); k("city's", 'GEN.s'); k("school's", 'GEN.s');

// ---- Noun: benda, dokumen, gagasan, peristiwa (n) ----
for (const [t, j] of [['application', 'applications'], ['bag', 'bags'], ['book', 'books'], ['bridge', 'bridges'], ['contract', 'contracts'],
  ['course', 'courses'], ['delivery', 'deliveries'], ['detail', 'details'], ['device', 'devices'], ['facility', 'facilities'],
  ['factory', 'factories'], ['festival', 'festivals'], ['filter', 'filters'], ['form', 'forms'], ['library', 'libraries'],
  ['light', 'lights'], ['office', 'offices'], ['park', 'parks'], ['price', 'prices'], ['procedure', 'procedures'], ['product', 'products'],
  ['project', 'projects'], ['request', 'requests'], ['result', 'results'], ['room', 'rooms'], ['sample', 'samples'],
  ['school', 'schools'], ['season', 'seasons'], ['store', 'stores'], ['street', 'streets'], ['summary', 'summaries'], ['survey', 'surveys'],
  ['task', 'tasks'], ['workshop', 'workshops'], ['meeting', 'meetings'], ['opening', 'openings'], ['launch', 'launches'], ['start', 'starts'],
  ['delay', 'delays'], ['cause', 'causes'], ['increase', 'increases'], ['lack', 'lacks'], ['study', 'studies'], ['finding', 'findings'],
  ['budget', 'budgets'], ['branch', 'branches'], ['city', 'cities'], ['class', 'classes'], ['refund', 'refunds'], ['service', 'services'],
  ['present', 'presents'], ['building', 'buildings'], ['document', 'documents'], ['review', 'reviews'], ['expense', 'expenses'],
  ['claim', 'claims'], ['event', 'events'], ['handbook', 'handbooks'], ['club', 'clubs'], ['desk', 'desks'], ['password', 'passwords'], ['drill', 'drills'], ['fire', 'fires'], ['complaint', 'complaints'], ['section', 'sections'], ['fee', 'fees'], ['site', 'sites']] as const)
  noun(t, j, 'n');
noun('report', 'reports', 'n', { pg: true });
noun('policy', 'policies', 'n', { pg: true });
noun('rule', 'rules', 'n', { pg: true });
noun('cost', 'costs', 'n', { pg: true });
noun('plan', 'plans', 'n', { inf: true, pg: true });
noun('guide', 'guides', 'n', { to: true, pg: true });
noun('route', 'routes', 'n', { to: true });
noun('use', null, 'n', { m: true, pg: true });
noun('delivery', null, 'n', { m: true });
noun('maintenance', null, 'n', { m: true });
for (const t of ['construction', 'electricity', 'energy', 'feedback', 'housing', 'packaging', 'permission', 'research', 'safety', 'software',
  'training', 'waste', 'water', 'health', 'finance', 'emergency', 'handling', 'data', 'plastic', 'compliance', 'science']) noun(t, null, 'n', { m: true, pg: ['handling', 'training'].includes(t) });
k('data', 'N.p.n');
noun('emergency', 'emergencies', 'n');

// ---- Adjective ----
for (const a of ['affordable', 'broken', 'experienced', 'free', 'gradual', 'independent', 'larger', 'late', 'local', 'mobile', 'new',
  'old', 'older', 'online', 'part-time', 'public', 'quiet', 'rainy', 'regular', 'serious', 'short', 'urgent', 'young', 'chemical', 'present',
  'plastic', 'revised', 'safer', 'strict'])
  adj(a);
for (const a of ['final', 'legal', 'main', 'recent', 'weekly', 'first', 'principal', 'annual', 'financial', 'monthly', 'default']) adj(a, { attr: true });
noun('default', 'defaults', 'n');
adj('responsible', { sub: ['pp:for'] });
adj('aware', { kls: 'h', sub: ['pp:of', 'wh', 'that'] });
adj('familiar', { kls: 'h', sub: ['pp:with'] });
adj('likely', { sub: ['inf'] });
adj('interested', { kls: 'h', sub: ['pp:in'] });
adj('ready', { sub: ['pp:for', 'inf'] });
adj('sure', { kls: 'h', sub: ['wh', 'pp:of', 'pp:about', 'inf', 'that'] });

adv('again', 'clearly', 'late', 'yet', 'online', 'most', 'weekly', 'near', 'properly');

// ---- Verb ----
// Kelas subjek (kls) hanya diberikan bila verb jelas menuntut pelaku manusia/lembaga; kelas objek (/h, /n) hanya bila objek
// jelas terbatas. Tanpa tanda = bebas (lebih aman: hanya dapat menambah urutan yang dianggap sah).
const V = verba;
V({ dasar: 'achieve', s3: 'achieves', lampau: 'achieved', ing: 'achieving', akt: ['np/n'], pas: ['0'], klsPas: 'n' });
V({ dasar: 'advise', s3: 'advises', lampau: 'advised', ing: 'advising', kls: 'h', akt: ['np/h', 'np_inf/h', 'that', 'pp:on', 'np_pp:on/h'], pas: ['0', 'inf', 'pp:on'], klsPas: 'h' });
V({ dasar: 'agree', s3: 'agrees', lampau: 'agreed', ing: 'agreeing', kls: 'h', akt: ['0', 'inf', 'that', 'pp:to', 'pp:with', 'pp:on'], pas: ['0'] });
V({ dasar: 'allow', s3: 'allows', lampau: 'allowed', ing: 'allowing', akt: ['np', 'np_inf', 'ger'], pas: ['0', 'inf'] });
V({ dasar: 'announce', s3: 'announces', lampau: 'announced', ing: 'announcing', kls: 'h', akt: ['to_wh', 'to_that', 'np/n', 'that', 'np_pp:to/n'], pas: ['0'], klsPas: 'n' });
V({ dasar: 'apply', s3: 'applies', lampau: 'applied', ing: 'applying', akt: ['0', 'pp:to', 'pp:for', 'np/n', 'np_pp:to/n'], pas: ['0', 'pp:to'] });
V({ dasar: 'ask', s3: 'asks', lampau: 'asked', ing: 'asking', kls: 'h', akt: ['0', 'np', 'np_inf/h', 'inf', 'wh', 'np_wh/h', 'pp:for', 'pp:about', 'np_pp:for/h', 'np_pp:about/h'], pas: ['0', 'inf', 'wh', 'pp:for', 'pp:about'], klsPas: 'h' });
V({ dasar: 'assign', s3: 'assigns', lampau: 'assigned', ing: 'assigning', kls: 'h', akt: ['np', 'np_pp:to', 'np_np/h', 'np_inf/h'], pas: ['0', 'pp:to', 'np', 'inf'] });
V({ dasar: 'attend', s3: 'attends', lampau: 'attended', ing: 'attending', kls: 'h', akt: ['np/n', '0', 'pp:to'], pas: ['0'], klsPas: 'n' });
V({ dasar: 'boil', s3: 'boils', lampau: 'boiled', ing: 'boiling', akt: ['np/n', '0'], pas: ['0'], klsPas: 'n' });
V({ dasar: 'book', s3: 'books', lampau: 'booked', ing: 'booking', kls: 'h', akt: ['np/n', 'np_np/h', 'np_pp:for/n'], pas: ['0'] });
V({ dasar: 'break', s3: 'breaks', lampau: 'broke', v3: 'broken', ing: 'breaking', akt: ['np/n', '0'], pas: ['0'], klsPas: 'n' });
V({ dasar: 'build', s3: 'builds', lampau: 'built', ing: 'building', akt: ['np/n', '0'], pas: ['0'], klsPas: 'n' });
V({ dasar: 'cause', s3: 'causes', lampau: 'caused', ing: 'causing', akt: ['np/n', 'np_inf'], pas: ['0', 'inf'] });
V({ dasar: 'claim', s3: 'claims', lampau: 'claimed', ing: 'claiming', akt: ['np/n', 'that', 'inf'], pas: ['0'], klsPas: 'n' });
V({ dasar: 'collect', s3: 'collects', lampau: 'collected', ing: 'collecting', akt: ['np', 'np_pp:from'], pas: ['0', 'pp:from'], klsPas: 'n' });
V({ dasar: 'complete', s3: 'completes', lampau: 'completed', ing: 'completing', akt: ['np/n'], pas: ['0'], klsPas: 'n' });
V({ dasar: 'comply', s3: 'complies', lampau: 'complied', ing: 'complying', akt: ['0', 'pp:with'] });
V({ dasar: 'consider', s3: 'considers', lampau: 'considered', ing: 'considering', kls: 'h', akt: ['np', 'ger', 'wh', 'that'], pas: ['0', 'inf'] });
V({ dasar: 'cost', s3: 'costs', lampau: 'cost', ing: 'costing', kls: 'n', akt: ['np', 'np_np'] });
V({ dasar: 'decide', s3: 'decides', lampau: 'decided', ing: 'deciding', kls: 'h', akt: ['0', 'inf', 'wh', 'that', 'pp:on', 'pp:against'], pas: ['0'], klsPas: 'n' });
V({ dasar: 'delay', s3: 'delays', lampau: 'delayed', ing: 'delaying', akt: ['np', 'ger'], pas: ['0'] });
V({ dasar: 'describe', s3: 'describes', lampau: 'described', ing: 'describing', akt: ['to_wh', 'to_that', 'np', 'wh', 'np_pp:to', 'np_pp:as'], pas: ['0', 'pp:as'] });
V({ dasar: 'design', s3: 'designs', lampau: 'designed', ing: 'designing', kls: 'h', akt: ['np/n', 'np_inf/n', 'np_pp:for/n'], pas: ['0', 'inf', 'pp:for'], klsPas: 'n' });
V({ dasar: 'donate', s3: 'donates', lampau: 'donated', ing: 'donating', kls: 'h', akt: ['np/n', 'np_pp:to/n', 'pp:to'], pas: ['0', 'pp:to'], klsPas: 'n' });
V({ dasar: 'do', s3: 'does', lampau: 'did', v3: 'done', ing: 'doing', akt: ['np', '0'], pas: ['0'] });
V({ dasar: 'drink', s3: 'drinks', lampau: 'drank', v3: 'drunk', ing: 'drinking', kls: 'h', akt: ['np/n', '0'] });
V({ dasar: 'encourage', s3: 'encourages', lampau: 'encouraged', ing: 'encouraging', akt: ['np', 'np_inf', 'ger'], pas: ['0', 'inf'] });
V({ dasar: 'expect', s3: 'expects', lampau: 'expected', ing: 'expecting', kls: 'h', akt: ['np', 'inf', 'np_inf', 'that'], pas: ['0', 'inf', 'that'] });
V({ dasar: 'experience', s3: 'experiences', lampau: 'experienced', ing: 'experiencing', akt: ['np/n'], pas: ['0'], klsPas: 'n' });
V({ dasar: 'explain', s3: 'explains', lampau: 'explained', ing: 'explaining', akt: ['to_wh', 'to_that', '0', 'np/n', 'wh', 'that', 'np_pp:to/n', 'pp:to'], pas: ['0', 'pp:to'], klsPas: 'n' });
V({ dasar: 'filter', s3: 'filters', lampau: 'filtered', ing: 'filtering', akt: ['np/n'], pas: ['0'], klsPas: 'n' });
V({ dasar: 'focus', s3: 'focuses', lampau: 'focused', ing: 'focusing', akt: ['pp:on', 'np_pp:on/n'], pas: ['pp:on'] });
V({ dasar: 'form', s3: 'forms', lampau: 'formed', ing: 'forming', akt: ['np', '0'], pas: ['0'] });
V({ dasar: 'guide', s3: 'guides', lampau: 'guided', ing: 'guiding', akt: ['np', 'np_pp:to', 'np_pp:through'], pas: ['0', 'pp:to'] });
V({ dasar: 'handle', s3: 'handles', lampau: 'handled', ing: 'handling', akt: ['np'], pas: ['0'] });
V({ dasar: 'identify', s3: 'identifies', lampau: 'identified', ing: 'identifying', akt: ['np', 'wh', 'np_pp:as'], pas: ['0', 'pp:as'] });
V({ dasar: 'include', s3: 'includes', lampau: 'included', ing: 'including', akt: ['np', 'ger'], pas: ['0', 'pp:in'] });
V({ dasar: 'increase', s3: 'increases', lampau: 'increased', ing: 'increasing', akt: ['np/n', '0', 'pp:by'], pas: ['0'], klsPas: 'n' });
V({ dasar: 'join', s3: 'joins', lampau: 'joined', ing: 'joining', kls: 'h', akt: ['np', '0'], pas: ['0'] });
V({ dasar: 'know', s3: 'knows', lampau: 'knew', v3: 'known', ing: 'knowing', kls: 'h', akt: ['np', 'wh', 'that', '0', 'pp:about'], pas: ['0', 'pp:as', 'inf'] });
V({ dasar: 'lack', s3: 'lacks', lampau: 'lacked', ing: 'lacking', akt: ['np/n'] });
V({ dasar: 'launch', s3: 'launches', lampau: 'launched', ing: 'launching', akt: ['np/n'], pas: ['0'], klsPas: 'n' });
V({ dasar: 'light', s3: 'lights', lampau: 'lit', ing: 'lighting', akt: ['np/n'], pas: ['0'], klsPas: 'n' });
V({ dasar: 'list', s3: 'lists', lampau: 'listed', ing: 'listing', akt: ['np/n'], pas: ['0', 'pp:in', 'pp:as'], klsPas: 'n' });
V({ dasar: 'meet', s3: 'meets', lampau: 'met', ing: 'meeting', akt: ['np', '0', 'pp:with'], pas: ['0'] });
V({ dasar: 'move', s3: 'moves', lampau: 'moved', ing: 'moving', akt: ['np', '0', 'np_pp:to', 'pp:to'], pas: ['0', 'pp:to'] });
V({ dasar: 'need', s3: 'needs', lampau: 'needed', ing: 'needing', akt: ['np', 'inf', 'np_inf', 'ger'], pas: ['0', 'inf'] });
V({ dasar: 'offer', s3: 'offers', lampau: 'offered', ing: 'offering', akt: ['np/n', 'np_np/h', 'inf', 'np_pp:to/n'], pas: ['0', 'np', 'pp:to'] });
V({ dasar: 'open', s3: 'opens', lampau: 'opened', ing: 'opening', akt: ['np/n', '0'], pas: ['0'], klsPas: 'n' });
V({ dasar: 'plan', s3: 'plans', lampau: 'planned', ing: 'planning', kls: 'h', akt: ['np/n', 'inf', 'pp:for'], pas: ['0', 'pp:for'], klsPas: 'n' });
V({ dasar: 'postpone', s3: 'postpones', lampau: 'postponed', ing: 'postponing', kls: 'h', akt: ['np/n', 'ger'], pas: ['0'], klsPas: 'n' });
V({ dasar: 'present', s3: 'presents', lampau: 'presented', ing: 'presenting', kls: 'h', akt: ['np/n', 'np_pp:to/n', 'np_pp:with/h'], pas: ['0', 'pp:to', 'pp:with'] });
V({ dasar: 'provide', s3: 'provides', lampau: 'provided', ing: 'providing', akt: ['np/n', 'np_pp:with/h', 'np_pp:for/n', 'np_pp:to/n'], pas: ['0', 'pp:for', 'pp:to', 'pp:with'] });
V({ dasar: 'publish', s3: 'publishes', lampau: 'published', ing: 'publishing', akt: ['np/n'], pas: ['0'], klsPas: 'n' });
V({ dasar: 'change', s3: 'changes', lampau: 'changed', ing: 'changing', akt: ['np', '0', 'np_pp:to'], pas: ['0', 'pp:to'] });
V({ dasar: 'remind', s3: 'reminds', lampau: 'reminded', ing: 'reminding', akt: ['np/h', 'np_inf/h', 'np_pp:of/h', 'np_pp:about/h', 'np_wh/h'], pas: ['0', 'inf', 'pp:of', 'pp:about'], klsPas: 'h' });
V({ dasar: 'reduce', s3: 'reduces', lampau: 'reduced', ing: 'reducing', akt: ['np/n'], pas: ['0'], klsPas: 'n' });
V({ dasar: 'refund', s3: 'refunds', lampau: 'refunded', ing: 'refunding', akt: ['np/n'], pas: ['0'], klsPas: 'n' });
V({ dasar: 'report', s3: 'reports', lampau: 'reported', ing: 'reporting', akt: ['to_wh', 'to_that', 'np/n', '0', 'pp:to', 'that', 'np_pp:to/n'], pas: ['0', 'pp:to'] });
V({ dasar: 'request', s3: 'requests', lampau: 'requested', ing: 'requesting', kls: 'h', akt: ['np/n', 'np_inf/h', 'that', 'np_pp:from/n'], pas: ['0', 'inf'] });
V({ dasar: 'require', s3: 'requires', lampau: 'required', ing: 'requiring', akt: ['np', 'np_inf', 'ger', 'that'], pas: ['0', 'inf', 'pp:for'] });
V({ dasar: 'research', s3: 'researches', lampau: 'researched', ing: 'researching', kls: 'h', akt: ['np/n'], pas: ['0'], klsPas: 'n' });
V({ dasar: 'result', s3: 'results', lampau: 'resulted', ing: 'resulting', kls: 'n', akt: ['pp:in', 'pp:from'] });
V({ dasar: 'return', s3: 'returns', lampau: 'returned', ing: 'returning', akt: ['np/n', '0', 'np_pp:to/n', 'pp:to'], pas: ['0', 'pp:to'] });
V({ dasar: 'reveal', s3: 'reveals', lampau: 'revealed', ing: 'revealing', akt: ['np/n', 'wh', 'that'], pas: ['0'], klsPas: 'n' });
V({ dasar: 'review', s3: 'reviews', lampau: 'reviewed', ing: 'reviewing', kls: 'h', akt: ['np'], pas: ['0'] });
V({ dasar: 'revise', s3: 'revises', lampau: 'revised', ing: 'revising', kls: 'h', akt: ['np/n'], pas: ['0'], klsPas: 'n' });
V({ dasar: 'rule', s3: 'rules', lampau: 'ruled', ing: 'ruling', kls: 'h', akt: ['np', 'that', 'pp:on'], pas: ['0'] });
V({ dasar: 'sample', s3: 'samples', lampau: 'sampled', ing: 'sampling', kls: 'h', akt: ['np/n'], pas: ['0'], klsPas: 'n' });
V({ dasar: 'share', s3: 'shares', lampau: 'shared', ing: 'sharing', akt: ['np/n', 'np_pp:with/n'], pas: ['0', 'pp:with'], klsPas: 'n' });
V({ dasar: 'show', s3: 'shows', lampau: 'showed', v3: 'shown', ing: 'showing', akt: ['np', 'np_np/h', 'np_wh/h', 'wh', 'that', 'np_pp:to/n'], pas: ['0', 'np', 'pp:to', 'that'] });
V({ dasar: 'sign', s3: 'signs', lampau: 'signed', ing: 'signing', kls: 'h', akt: ['0', 'np/n'], pas: ['0'], klsPas: 'n' });
V({ dasar: 'start', s3: 'starts', lampau: 'started', ing: 'starting', akt: ['np/n', 'inf', 'ger', '0'], pas: ['0'] });
V({ dasar: 'store', s3: 'stores', lampau: 'stored', ing: 'storing', akt: ['np/n'], pas: ['0'], klsPas: 'n' });
V({ dasar: 'study', s3: 'studies', lampau: 'studied', ing: 'studying', kls: 'h', akt: ['np', '0'], pas: ['0'] });
V({ dasar: 'submit', s3: 'submits', lampau: 'submitted', ing: 'submitting', kls: 'h', akt: ['np/n', 'np_pp:to/n'], pas: ['0', 'pp:to', 'pp:by'], klsPas: 'n' });
V({ dasar: 'survey', s3: 'surveys', lampau: 'surveyed', ing: 'surveying', kls: 'h', akt: ['np'], pas: ['0'] });
V({ dasar: 'test', s3: 'tests', lampau: 'tested', ing: 'testing', akt: ['np', 'np_pp:for'], pas: ['0', 'pp:for'] });
V({ dasar: 'train', s3: 'trains', lampau: 'trained', ing: 'training', akt: ['np/h', 'np_inf/h', '0'], pas: ['0', 'inf'], klsPas: 'h' });
V({ dasar: 'use', s3: 'uses', lampau: 'used', ing: 'using', akt: ['np', 'np_inf', 'np_pp:for'], pas: ['0', 'inf', 'pp:for'] });
V({ dasar: 'volunteer', s3: 'volunteers', lampau: 'volunteered', ing: 'volunteering', kls: 'h', akt: ['0', 'inf', 'pp:for'] });
V({ dasar: 'walk', s3: 'walks', lampau: 'walked', ing: 'walking', kls: 'h', akt: ['0', 'pp:to', 'np'] });
V({ dasar: 'want', s3: 'wants', lampau: 'wanted', ing: 'wanting', kls: 'h', akt: ['np', 'inf', 'np_inf'] });
V({ dasar: 'waste', s3: 'wastes', lampau: 'wasted', ing: 'wasting', akt: ['np/n'], pas: ['0'], klsPas: 'n' });

export function bacaanKata(kata: string): string[] | undefined {
  return LEKSIKON[kata.toLowerCase()];
}
