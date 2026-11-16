import type { Family } from '../../core/types';
import { familyFrasa } from './frasa';
import { familyInfinitif } from './infinitif';
import { familyKlausa } from './klausa';

// Sentence Arrangement (5 fragmen A–E, 4 opsi urutan A–D), blueprint Bahasa Inggris bagian 6.
//   SA-FRASA     SHL      frasa noun + predikat + pelengkap (pola teramati; contoh blueprint sebagai uji emas)
//   SA-KLAUSA    VARIASI  noun clause sebagai objek/subjek (perluasan berbasis buku)
//   SA-INFINITIF VARIASI  verb + to-infinitive / objek + to-infinitive / gerund (perluasan berbasis buku)
export const FAMILIES_ARRANGEMENT: Family<any, any>[] = [familyFrasa, familyKlausa, familyInfinitif];
