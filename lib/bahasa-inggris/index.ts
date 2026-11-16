import type { Family } from '../core/types';
import { FAMILIES_ARRANGEMENT } from './arrangement';
import { FAMILIES_COMPLETION } from './completion';
import { FAMILIES_CORRECT } from './correct';
import { FAMILIES_IMPROVEMENT } from './improvement';

// Tes Bahasa Inggris (blueprint Bahasa Inggris): empat bentuk non-reading. Reading Comprehension belum punya blueprint.
export const BAHASA_INGGRIS_FAMILIES: Family<any, any>[] = [
  ...FAMILIES_COMPLETION,
  ...FAMILIES_IMPROVEMENT,
  ...FAMILIES_CORRECT,
  ...FAMILIES_ARRANGEMENT,
];
