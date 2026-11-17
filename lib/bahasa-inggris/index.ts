import type { Family } from '../core/types';
import { FAMILIES_ARRANGEMENT } from './arrangement';
import { FAMILIES_COMPLETION } from './completion';
import { FAMILIES_CORRECT } from './correct';
import { FAMILIES_IMPROVEMENT } from './improvement';
import { FAMILIES_READING } from './reading';

// Tes Bahasa Inggris: empat bentuk non-reading (blueprint Bahasa Inggris) dan Reading Comprehension (lib/bahasa-inggris/reading).
export const BAHASA_INGGRIS_FAMILIES: Family<any, any>[] = [
  ...FAMILIES_COMPLETION,
  ...FAMILIES_IMPROVEMENT,
  ...FAMILIES_CORRECT,
  ...FAMILIES_ARRANGEMENT,
  ...FAMILIES_READING,
];
