import type { Family } from '../../core/types';
import { gcsKuantifier } from './kuantifier';
import { gcsModalPasif } from './modal-pasif';
import { gcsNounClause } from './noun-clause';
import { gcsPronomina } from './pronomina';
import { gcsSvaWaktu } from './sva-waktu';
import { gcsWaktu } from './waktu';

// Grammatically Correct Sentence (5 kalimat A–E, blueprint Bahasa Inggris bagian 5).
// SHL: agreement + preposisi waktu (pola teramati), preposisi waktu dasar. VARIASI: modal/passive, noun clause,
// countable/quantifier, pronoun (perluasan berbasis buku).
export const FAMILIES_CORRECT: Family<any, any>[] = [gcsSvaWaktu, gcsWaktu, gcsModalPasif, gcsNounClause, gcsKuantifier, gcsPronomina];
