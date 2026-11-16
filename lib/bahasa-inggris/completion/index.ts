import type { Family } from '../../core/types';
import { KERANGKA_ADJECTIVE } from './kerangka-adjective';
import { KERANGKA_NOUN } from './kerangka-noun';
import { KERANGKA_VERB } from './kerangka-verb';
import { familyMakna } from './makna';
import { familyBentuk } from './bentuk';
import { familyVerba } from './verba';
import { familyKonektor } from './konektor';
import { KERANGKA_BENTUK } from './kerangka-bentuk';
import { KERANGKA_VERBA } from './kerangka-verba';
import { KERANGKA_KONEKTOR } from './kerangka-konektor';

// Sentence Completion (4 opsi A–D). Blueprint Bahasa Inggris bagian 3: tiga family SHL (pola teramati: makna kata dan
// kolokasi) dan tiga family VARIASI (perluasan grammar berbasis buku: bentuk kata, bentuk verb, connective).

export const scAdjective = familyMakna({
  id: 'SC-ADJ',
  nama: 'Adjective dalam konteks',
  sumber: 'Blueprint Bahasa Inggris §3 (contoh adjective dalam konteks), §8 · Azar App. A-4/A-5',
  ringkas: 'Satu kalimat dengan petunjuk makna (cakupan, akibat, pertentangan, syarat). Empat adjective; hanya satu yang diterima matriks keterterimaan kerangka, sinonim dekat tidak pernah menjadi pengecoh.',
  kerangka: KERANGKA_ADJECTIVE,
  caraCepat: 'Temukan petunjuk makna di kalimat (cakupan, akibat, pertentangan), tentukan gagasan yang dibutuhkan, lalu pilih adjective yang menyatakan gagasan itu.',
});

export const scNoun = familyMakna({
  id: 'SC-NOUN',
  nama: 'Noun dan hubungan abstrak',
  sumber: 'Blueprint Bahasa Inggris §3 (contoh noun dan tujuan tindakan), §8 · Azar App. A-4/A-5',
  ringkas: 'Noun yang ditentukan oleh tujuan tindakan, akibat, status informasi, atau kolokasi (raise awareness, take priority over). Keempat opsi sama bentuknya sehingga artikel dan agreement tidak membocorkan kunci.',
  kerangka: KERANGKA_NOUN,
  caraCepat: 'Cari frasa tujuan atau akibat, lalu baca noun bersama kata pasangannya (adjective sebelumnya dan preposisi sesudahnya).',
});

export const scVerb = familyMakna({
  id: 'SC-VERB',
  nama: 'Verb dan preposisi/kolokasi',
  sumber: 'Blueprint Bahasa Inggris §3 (contoh verb dan preposisi), §7 makna dan kolokasi · Azar App. A-4/A-5, 14-12',
  ringkas: 'Verb yang harus cocok dengan preposisi/objek sesudahnya dan dengan konteks (comply with, consist of, rely on, result in). Keempat opsi berbentuk sama; pengecoh berupa makna keliru, kolokasi keliru, atau arah tindakan terbalik.',
  kerangka: KERANGKA_VERB,
  caraCepat: 'Baca bagian kosong bersama preposisi dan objek sesudahnya sebagai satu unit, lalu uji apakah unit itu masuk akal dalam kalimat.',
});

export const scBentuk = familyBentuk(KERANGKA_BENTUK);
export const scVerba = familyVerba(KERANGKA_VERBA);
export const scKonektor = familyKonektor(KERANGKA_KONEKTOR);

export const FAMILIES_COMPLETION: Family<any, any>[] = [scAdjective, scNoun, scVerb, scBentuk, scVerba, scKonektor];
