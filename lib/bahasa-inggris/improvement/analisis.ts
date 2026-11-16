import { BE, HAVE, MODAL, VERB, tagVerb, type BentukKata } from './leksikon';

// Analisis frasa verb milik solver: mengurai potongan verb (tanpa ekor objek/keterangan) menjadi semua bacaan yang
// mungkin — finite (kala, aspek, diatesis, persona), to-infinitive, gerund, V1 dasar, partisip, atau cacat beserta
// alasannya. Rujukan: Azar bab 1–4 (tense), 11-1–11-4 (passive), 14-1 (gerund), 15-1 (infinitive); Materi bagian 5, 7, 8.

export type Kala = 'present' | 'past' | 'future' | 'modal';
export type Aspek = 'simple' | 'progressive' | 'perfect' | 'perfect-progressive';
export type Diatesis = 'aktif' | 'pasif';
/** Batas persona subjek: sg3 = he/she/it/noun tunggal; jamak = noun jamak; semua = tidak berubah menurut subjek. */
export type Persona = 'sg3' | 'jamak' | 'semua' | 'sg1';

export type Bacaan =
  | { jenis: 'finit'; kala: Kala; aspek: Aspek; diatesis: Diatesis; persona: Persona; lemma: string; aux: string[] }
  | { jenis: 'to-inf'; aspek: Aspek; diatesis: Diatesis; lemma: string }
  | { jenis: 'gerund'; aspek: Aspek; diatesis: Diatesis; lemma: string }
  | { jenis: 'dasar'; aspek: Aspek; diatesis: Diatesis; lemma: string }
  | { jenis: 'partisip'; bentuk: 'v3'; lemma: string }
  | { jenis: 'to-ing'; lemma: string }
  | { jenis: 'cacat'; alasan: string };

/** Rantai non-finite setelah auxiliary (Inti = aspek tambahan, diatesis, lemma verb utama). */
type Inti = { aspek: Aspek; diatesis: Diatesis; lemma: string } | { cacat: string };

const lemmaBentuk = (w: string, b: BentukKata) => tagVerb(w).filter((t) => t.bentuk === b).map((t) => t.lemma);

/** Satu kata verb leksikal dalam bentuk tertentu (be/have tidak termasuk). */
function satu(t: string[], b: BentukKata): string[] {
  return t.length === 1 ? lemmaBentuk(t[0], b) : [];
}

/** Setelah modal atau to: bentuk dasar (V1 | be + V3/V-ing | have + V3 …). */
function rantaiDasar(t: string[], setelah: string): Inti[] {
  if (!t.length) return [{ cacat: `tidak ada verb setelah ${setelah}` }];
  const [w, ...sisa] = t;
  if (w === 'be') {
    if (!sisa.length) return [{ aspek: 'simple', diatesis: 'aktif', lemma: 'be' }];
    return rantaiBe(sisa, `${setelah} be`);
  }
  if (w === 'have') {
    if (!sisa.length) return [{ aspek: 'simple', diatesis: 'aktif', lemma: 'have' }];
    return rantaiPerfect(sisa, `${setelah} have`);
  }
  if (sisa.length) return [{ cacat: `susunan ${t.join(' ')} tidak membentuk frasa verb` }];
  const l = lemmaBentuk(w, 'dasar');
  if (l.length) return l.map((lemma) => ({ aspek: 'simple' as Aspek, diatesis: 'aktif' as Diatesis, lemma }));
  return [{ cacat: `setelah ${setelah} diperlukan V1 (bentuk dasar), bukan ${w}` }];
}

/** Setelah be/is/are/was/were: V-ing (progressive), V3 (passive), being + V3 (progressive passive). */
function rantaiBe(t: string[], setelah: string): Inti[] {
  if (!t.length) return [{ cacat: `tidak ada verb setelah ${setelah}` }];
  if (t[0] === 'being') {
    const l = satu(t.slice(1), 'v3');
    return l.length ? l.map((lemma) => ({ aspek: 'progressive' as Aspek, diatesis: 'pasif' as Diatesis, lemma })) : [{ cacat: `setelah ${setelah} being diperlukan V3` }];
  }
  const ing = satu(t, 'ing');
  const v3 = satu(t, 'v3');
  const hasil: Inti[] = [
    ...ing.map((lemma) => ({ aspek: 'progressive' as Aspek, diatesis: 'aktif' as Diatesis, lemma })),
    ...v3.map((lemma) => ({ aspek: 'simple' as Aspek, diatesis: 'pasif' as Diatesis, lemma })),
  ];
  if (hasil.length) return hasil;
  if (t.length === 1 && lemmaBentuk(t[0], 'dasar').length) return [{ cacat: `setelah ${setelah} tidak dapat langsung diikuti V1 ${t[0]}; diperlukan V-ing (progressive) atau V3 (passive)` }];
  return [{ cacat: `setelah ${setelah} diperlukan V-ing atau V3, bukan ${t.join(' ')}` }];
}

/** Setelah has/have/had: V3 (perfect), been + V3 (perfect passive), been + V-ing (perfect progressive). */
function rantaiPerfect(t: string[], setelah: string): Inti[] {
  if (!t.length) return [{ cacat: `tidak ada verb setelah ${setelah}` }];
  if (t[0] === 'been') {
    const sisa = t.slice(1);
    if (!sisa.length) return [{ aspek: 'perfect', diatesis: 'aktif', lemma: 'be' }];
    const ing = satu(sisa, 'ing');
    const v3 = satu(sisa, 'v3');
    const hasil: Inti[] = [
      ...ing.map((lemma) => ({ aspek: 'perfect-progressive' as Aspek, diatesis: 'aktif' as Diatesis, lemma })),
      ...v3.map((lemma) => ({ aspek: 'perfect' as Aspek, diatesis: 'pasif' as Diatesis, lemma })),
    ];
    return hasil.length ? hasil : [{ cacat: `setelah ${setelah} been diperlukan V3 atau V-ing, bukan ${sisa.join(' ')}` }];
  }
  const v3 = satu(t, 'v3');
  if (v3.length) return v3.map((lemma) => ({ aspek: 'perfect' as Aspek, diatesis: 'aktif' as Diatesis, lemma }));
  return [{ cacat: `setelah ${setelah} diperlukan V3 (past participle), bukan ${t.join(' ')}` }];
}

const aspekGabung = (dasar: Aspek, tambah: Aspek): Aspek => {
  if (dasar === 'simple') return tambah;
  if (dasar === 'perfect' && tambah === 'progressive') return 'perfect-progressive';
  return tambah === 'simple' ? dasar : tambah;
};

function finit(inti: Inti[], kala: Kala, persona: Persona, aux: string[], aspekAwal: Aspek = 'simple'): Bacaan[] {
  return inti.map((r) => 'cacat' in r
    ? { jenis: 'cacat' as const, alasan: r.cacat }
    : { jenis: 'finit' as const, kala, aspek: aspekGabung(aspekAwal, r.aspek), diatesis: r.diatesis, persona, lemma: r.lemma, aux });
}

const PERSONA_BE: Record<string, { kala: Kala; persona: Persona }> = {
  is: { kala: 'present', persona: 'sg3' }, are: { kala: 'present', persona: 'jamak' }, am: { kala: 'present', persona: 'sg1' },
  was: { kala: 'past', persona: 'sg3' }, were: { kala: 'past', persona: 'jamak' },
};

/** Semua bacaan potongan verb. Kata dipisah spasi; huruf besar diabaikan. */
export function urai(potongan: string): Bacaan[] {
  const t = potongan.toLowerCase().replace(/[.,;:]/g, '').split(/\s+/).filter(Boolean);
  if (!t.length) return [{ jenis: 'cacat', alasan: 'bagian kosong' }];
  const [w, ...sisa] = t;
  const hasil: Bacaan[] = [];

  if (w === 'to') {
    if (sisa.length === 1 && lemmaBentuk(sisa[0], 'ing').length) return lemmaBentuk(sisa[0], 'ing').map((lemma) => ({ jenis: 'to-ing' as const, lemma }));
    if (sisa[0] === 'to') return [{ jenis: 'cacat', alasan: 'to muncul dua kali berturut-turut' }];
    return rantaiDasar(sisa, 'to').map((r) => ('cacat' in r ? { jenis: 'cacat' as const, alasan: r.cacat } : { jenis: 'to-inf' as const, ...r }));
  }
  if (MODAL.has(w)) {
    const kala: Kala = w === 'will' || w === 'shall' ? 'future' : 'modal';
    return finit(rantaiDasar(sisa, w), kala, 'semua', [w]);
  }
  if (w in BE) {
    const b = BE[w];
    if (b === 'ing') {
      // being + V3 = gerund passive; being sendiri = gerund verb be
      if (!sisa.length) return [{ jenis: 'gerund', aspek: 'simple', diatesis: 'aktif', lemma: 'be' }];
      const l = satu(sisa, 'v3');
      return l.length ? l.map((lemma) => ({ jenis: 'gerund' as const, aspek: 'simple' as Aspek, diatesis: 'pasif' as Diatesis, lemma })) : [{ jenis: 'cacat', alasan: `setelah being diperlukan V3, bukan ${sisa.join(' ')}` }];
    }
    if (b === 'v3') {
      if (!sisa.length) return [{ jenis: 'partisip', bentuk: 'v3', lemma: 'be' }];
      return [{ jenis: 'cacat', alasan: 'been tidak dapat berdiri tanpa has/have/had' }];
    }
    if (b === 'dasar') {
      if (!sisa.length) return [{ jenis: 'dasar', aspek: 'simple', diatesis: 'aktif', lemma: 'be' }];
      return rantaiBe(sisa, 'be').map((r) => ('cacat' in r ? { jenis: 'cacat' as const, alasan: r.cacat } : { jenis: 'dasar' as const, ...r }));
    }
    const { kala, persona } = PERSONA_BE[b];
    if (!sisa.length) return [{ jenis: 'finit', kala, aspek: 'simple', diatesis: 'aktif', persona, lemma: 'be', aux: [] }];
    return finit(rantaiBe(sisa, w), kala, persona, [w]);
  }
  if (w in HAVE) {
    const h = HAVE[w];
    if (!sisa.length) {
      // have sebagai verb utama
      if (h === 's') return [{ jenis: 'finit', kala: 'present', aspek: 'simple', diatesis: 'aktif', persona: 'sg3', lemma: 'have', aux: [] }];
      if (h === 'dasar') return [
        { jenis: 'finit', kala: 'present', aspek: 'simple', diatesis: 'aktif', persona: 'jamak', lemma: 'have', aux: [] },
        { jenis: 'dasar', aspek: 'simple', diatesis: 'aktif', lemma: 'have' },
      ];
      if (h === 'had') return [{ jenis: 'finit', kala: 'past', aspek: 'simple', diatesis: 'aktif', persona: 'semua', lemma: 'have', aux: [] }, { jenis: 'partisip', bentuk: 'v3', lemma: 'have' }];
      return [{ jenis: 'gerund', aspek: 'simple', diatesis: 'aktif', lemma: 'have' }];
    }
    const inti = rantaiPerfect(sisa, w);
    if (h === 'ing') return inti.map((r) => ('cacat' in r ? { jenis: 'cacat' as const, alasan: r.cacat } : { jenis: 'gerund' as const, aspek: aspekGabung('perfect', r.aspek), diatesis: r.diatesis, lemma: r.lemma }));
    if (h === 'dasar') return [
      ...finit(inti, 'present', 'jamak', [w], 'perfect'),
      ...inti.filter((r) => !('cacat' in r)).map((r) => ({ jenis: 'dasar' as const, aspek: aspekGabung('perfect', (r as { aspek: Aspek }).aspek), diatesis: (r as { diatesis: Diatesis }).diatesis, lemma: (r as { lemma: string }).lemma })),
    ];
    return finit(inti, h === 's' ? 'present' : 'past', h === 's' ? 'sg3' : 'semua', [w], 'perfect');
  }

  // verb leksikal tunggal
  if (sisa.length) return [{ jenis: 'cacat', alasan: `${t.join(' ')} bukan susunan frasa verb yang lengkap` }];
  const tag = tagVerb(w);
  if (!tag.length) return [{ jenis: 'cacat', alasan: `${w} tidak dikenal sebagai verb` }];
  for (const { lemma, bentuk } of tag) {
    if (bentuk === 'dasar') {
      hasil.push({ jenis: 'finit', kala: 'present', aspek: 'simple', diatesis: 'aktif', persona: 'jamak', lemma, aux: [] });
      hasil.push({ jenis: 'dasar', aspek: 'simple', diatesis: 'aktif', lemma });
    } else if (bentuk === 's') hasil.push({ jenis: 'finit', kala: 'present', aspek: 'simple', diatesis: 'aktif', persona: 'sg3', lemma, aux: [] });
    else if (bentuk === 'v2') hasil.push({ jenis: 'finit', kala: 'past', aspek: 'simple', diatesis: 'aktif', persona: 'semua', lemma, aux: [] });
    else if (bentuk === 'v3') hasil.push({ jenis: 'partisip', bentuk: 'v3', lemma });
    else hasil.push({ jenis: 'gerund', aspek: 'simple', diatesis: 'aktif', lemma });
  }
  return hasil;
}

/** Bentuk morfologis kata tunggal (untuk struktur paralel dan pembahasan): mis. prepared → ['v2','v3']. */
export function bentukKata(kata: string): BentukKata[] {
  return [...new Set(tagVerb(kata).map((t) => t.bentuk))];
}

/** Nama bentuk dalam pembahasan. */
export function namaBentuk(b: BentukKata[]): string {
  const set = new Set(b);
  if (set.has('v2') && set.has('v3')) return 'V2/V3';
  const nama: Record<BentukKata, string> = { dasar: 'V1 (bentuk dasar)', s: 'verb berakhiran -s (orang ketiga tunggal)', v2: 'V2 (bentuk lampau)', v3: 'V3 (past participle)', ing: 'V-ing' };
  return b.map((x) => nama[x]).join('/');
}

/** Nama tense untuk pembahasan. */
export function namaTense(b: Extract<Bacaan, { jenis: 'finit' }>): string {
  if (b.kala === 'modal') return b.diatesis === 'pasif' ? 'modal + passive' : 'modal';
  const k = { present: 'present', past: 'past', future: 'future' }[b.kala];
  const a = { simple: 'simple', progressive: 'progressive', perfect: 'perfect', 'perfect-progressive': 'perfect progressive' }[b.aspek];
  const nama = b.kala === 'future' && b.aspek === 'simple' ? 'future simple (will + V1)' : `${k} ${a}`;
  return b.diatesis === 'pasif' ? `${nama} passive` : nama;
}

export { VERB };
