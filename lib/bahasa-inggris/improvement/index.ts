import type { Family } from '../../core/types';
import { siGerundPreposisi, siGerundTo } from './gerund';
import { siKomplemenVerb } from './komplemen';
import { siParalel } from './paralel';
import { siAgreement, siTense } from './predikat';

// Sentence Improvement (blueprint Bahasa Inggris bagian 4): satu kalimat, satu rentang miring, A–D pengganti rentang,
// E = "No improvement needed" (kunci hanya bila kalimat awal benar). SHL = gerund setelah preposisi, termasuk to sebagai
// preposisi (teramati); VARIASI = perluasan berbasis buku (gerund/infinitive setelah verb, paralel, agreement, tense).
export const FAMILIES_IMPROVEMENT: Family<any, any>[] = [siGerundPreposisi, siGerundTo, siKomplemenVerb, siParalel, siAgreement, siTense];
