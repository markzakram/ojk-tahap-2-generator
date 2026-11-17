'use client';

import type { Soal } from '@/lib/core/types';
import type { PilihanGandaItem } from '@/lib/core/pilihan-ganda';
import type { CalendarItem } from '@/lib/deduktif/calendar/model';
import type { Alokasi, RoomItem } from '@/lib/deduktif/room/model';
import type { TimelineItem } from '@/lib/deduktif/timeline/model';
import type { Susunan, TimeslotItem } from '@/lib/deduktif/timeslot/model';
import type { DragLineItem } from '@/lib/induktif/drag-line/pola';
import type { Frame } from '@/lib/induktif/fill-shape/geometri';
import type { FillShapeItem } from '@/lib/induktif/fill-shape/pola';
import BadgesSoal from './BadgesSoal';
import CalendarSoal from './CalendarSoal';
import DragLineSoal from './DragLineSoal';
import FillShapeSoal from './FillShapeSoal';
import PilihanGandaSoal from './PilihanGandaSoal';
import RoomSoal from './RoomSoal';
import TimelineSoal from './TimelineSoal';
import TimeslotSoal from './TimeslotSoal';

// Satu soal interaktif menurut jenis item-nya; dipakai Studio (satu soal) dan Paket (daftar soal satu bagian).
// `tanpaBacaan`: soal Reading lanjutan di paket tidak mengulang bacaan yang sama.
export default function TampilSoal({ soal, tampilKunci, tanpaBacaan }: { soal: Soal; tampilKunci: boolean; tanpaBacaan?: string }) {
  const jenis = (soal.item as { jenis: string }).jenis;
  const k = soal.uid;
  switch (jenis) {
    case 'fill-shape': return <FillShapeSoal key={k} item={soal.item as FillShapeItem} kunci={soal.jawaban as Frame} tampilKunci={tampilKunci} />;
    case 'drag-line': return <DragLineSoal key={k} item={soal.item as DragLineItem} kunci={soal.jawaban as string[]} tampilKunci={tampilKunci} />;
    case 'calendar-date': return <CalendarSoal key={k} item={soal.item as CalendarItem} kunci={soal.jawaban as number[]} tampilKunci={tampilKunci} />;
    case 'timeline': return <TimelineSoal key={k} item={soal.item as TimelineItem} kunci={soal.jawaban as number[]} tampilKunci={tampilKunci} />;
    case 'timeslot': return <TimeslotSoal key={k} item={soal.item as TimeslotItem} kunci={soal.jawaban as Susunan} tampilKunci={tampilKunci} />;
    case 'room-allocation': return <RoomSoal key={k} item={soal.item as RoomItem} kunci={soal.jawaban as Alokasi} tampilKunci={tampilKunci} />;
    case 'logical-ranking': return <BadgesSoal key={k} item={soal.item} kunci={soal.jawaban} tampilKunci={tampilKunci} />;
    case 'pilihan-ganda': return <PilihanGandaSoal key={k} item={soal.item as PilihanGandaItem} kunci={soal.jawaban as string} tampilKunci={tampilKunci} tanpaBacaan={tanpaBacaan} />;
    default: return <div className="galat">Jenis soal “{jenis}” belum punya tampilan.</div>;
  }
}

/** Kunci, konsep, langkah, alasan opsi salah, dan cara cepat satu soal. */
export function Pembahasan({ soal, sidik = true }: { soal: Soal; sidik?: boolean }) {
  const p = soal.pembahasan;
  return (
    <div className="kunci-blok">
      <p className="kunci-teks">{p.jawaban}</p>
      {p.konsep && <div><b className="subjudul">Konsep</b>{p.konsep}</div>}
      {p.kataKunci && <div><b className="subjudul">Kata kunci</b>{p.kataKunci}</div>}
      <ol>{p.langkah.map((l, i) => <li key={i}>{l.teks}</li>)}</ol>
      {p.opsiSalah && (
        <div><b className="subjudul">Alasan opsi salah</b><ul className="opsi-salah">{p.opsiSalah.map((t) => <li key={t}>{t}</li>)}</ul></div>
      )}
      {p.caraCepat && <div className="cepat"><b>Cara cepat:</b> {p.caraCepat}</div>}
      {sidik && <div className="sidik">Lolos pada percobaan ke-{soal.percobaan + 1} · sidik {soal.sidik}</div>}
    </div>
  );
}
