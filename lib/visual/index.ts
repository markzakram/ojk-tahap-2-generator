import type { Soal } from '../core/types';
import type { BadgesItem, Peringkat } from '../deduktif/badges/model';
import type { CalendarItem } from '../deduktif/calendar/model';
import type { GiliranItem } from '../deduktif/calendar/giliran';
import type { SesiItem } from '../deduktif/calendar/sesi';
import type { Alokasi, RoomItem } from '../deduktif/room/model';
import type { TimelineItem } from '../deduktif/timeline/model';
import type { Susunan, TimeslotItem } from '../deduktif/timeslot/model';
import type { DragLineItem } from '../induktif/drag-line/pola';
import type { Frame } from '../induktif/fill-shape/geometri';
import type { FillShapeItem } from '../induktif/fill-shape/pola';
import { hash, type GambarPembahasan } from './alat';
import { visualDragLine } from './drag-line';
import { visualFillShape } from './fill-shape';
import { visualTimeline, visualTimeslot } from './jadwal';
import { visualKalender } from './kalender';
import { visualPeringkat } from './peringkat';
import { visualRuang } from './ruang';

export type { GambarPembahasan } from './alat';

const cache = new Map<string, GambarPembahasan[]>();

/**
 * Visual pembahasan satu soal (QC 2 R02): diturunkan dari isi soal, kunci, dan aturan pembahasan; tidak mengubah soal. Induktif
 * dan Deduktif selalu punya gambar; Bahasa Inggris dan Pengetahuan Sektor Jasa Keuangan tidak memakai gambar.
 */
export function gambarPembahasan(soal: Soal): GambarPembahasan[] {
  const ada = cache.get(soal.uid);
  if (ada) return ada;
  const hasil = buat(soal);
  if (cache.size > 400) cache.clear();
  cache.set(soal.uid, hasil);
  return hasil;
}

function buat(soal: Soal): GambarPembahasan[] {
  switch ((soal.item as { jenis: string }).jenis) {
    case 'fill-shape': return visualFillShape(soal.familyId, soal.item as FillShapeItem, soal.jawaban as Frame, hash(soal.uid));
    case 'drag-line': return visualDragLine(soal.familyId, soal.item as DragLineItem, soal.jawaban as string[]);
    case 'calendar-date': return visualKalender(soal.item as CalendarItem | GiliranItem | SesiItem, soal.jawaban as number[]);
    case 'room-allocation': return visualRuang(soal.item as RoomItem, soal.jawaban as Alokasi);
    case 'timeline': return visualTimeline(soal.item as TimelineItem, soal.jawaban as number[]);
    case 'timeslot': return visualTimeslot(soal.item as TimeslotItem, soal.jawaban as Susunan);
    case 'logical-ranking': return visualPeringkat(soal.item as BadgesItem, soal.jawaban as Peringkat);
    default: return [];
  }
}

/** Jenis soal yang wajib punya visual pembahasan. */
export const WAJIB_VISUAL = ['fill-shape', 'drag-line', 'calendar-date', 'room-allocation', 'timeline', 'timeslot', 'logical-ranking'];
