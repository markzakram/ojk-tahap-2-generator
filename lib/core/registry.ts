import type { Family } from './types';
import { roomSamaBeda } from '../deduktif/room/sama-beda';
import { roomDurasi } from '../deduktif/room/durasi';
import { roomKantor } from '../deduktif/room/kantor';
import { TIMESLOT_FAMILIES } from '../deduktif/timeslot/pola';
import { TIMELINE_FAMILIES } from '../deduktif/timeline/pola';
import { calendarIrisanA0, calendarIrisanA1, calendarIrisanA2, calendarIrisanA3 } from '../deduktif/calendar/irisan';
import { calendarGiliranB0, calendarGiliranB1, calendarGiliranB2, calendarGiliranB3 } from '../deduktif/calendar/giliran';
import { FILL_SHAPE_FAMILIES } from '../induktif/fill-shape/pola';
import { DRAG_LINE_FAMILIES } from '../induktif/drag-line/pola';
import { calendarSesiC0, calendarSesiC1, calendarSesiC2, calendarSesiC3 } from '../deduktif/calendar/sesi';

/** Seluruh family yang tersedia. Tambahkan family baru di sini; id harus unik dan tidak boleh diganti setelah dipakai. */
export const FAMILIES: Family<any, any>[] = [
  ...FILL_SHAPE_FAMILIES,
  ...DRAG_LINE_FAMILIES,
  calendarIrisanA0,
  calendarIrisanA1,
  calendarIrisanA2,
  calendarIrisanA3,
  calendarGiliranB0,
  calendarGiliranB1,
  calendarGiliranB2,
  calendarGiliranB3,
  calendarSesiC0,
  calendarSesiC1,
  calendarSesiC2,
  calendarSesiC3,
  roomSamaBeda,
  roomKantor,
  roomDurasi,
  ...TIMELINE_FAMILIES,
  ...TIMESLOT_FAMILIES,
];

export function familyById(id: string): Family<any, any> {
  const f = FAMILIES.find((x) => x.id === id);
  if (!f) throw new Error(`Family tidak dikenal: ${id}`);
  return f;
}

/** Ringkasan tanpa fungsi, aman dikirim ke komponen klien. */
export const daftarFamily = () => FAMILIES.map(({ id, versi, nama, chapter, label, sumber, ringkas }) => ({ id, versi, nama, chapter, label, sumber, ringkas }));
