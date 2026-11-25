'use client';

import { useState } from 'react';
import type { Soal } from '@/lib/core/types';
import type { PilihanGandaItem } from '@/lib/core/pilihan-ganda';
import type { CalendarItem } from '@/lib/deduktif/calendar/model';
import type { Alokasi, RoomItem } from '@/lib/deduktif/room/model';
import type { TimelineItem } from '@/lib/deduktif/timeline/model';
import type { Susunan, TimeslotItem } from '@/lib/deduktif/timeslot/model';
import type { DragLineItem } from '@/lib/induktif/drag-line/pola';
import type { Frame } from '@/lib/induktif/fill-shape/geometri';
import type { FillShapeItem } from '@/lib/induktif/fill-shape/pola';
import { gambarPembahasan, type GambarPembahasan } from '@/lib/visual';
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

/** Satu visual pembahasan; dapat diperbesar karena panel Studio lebih sempit daripada gambarnya. */
function Visual({ g }: { g: GambarPembahasan }) {
  const [besar, setBesar] = useState(false);
  // SVG mandiri buatan generator sendiri (lib/visual); seluruh teksnya sudah di-escape
  const isi = { __html: g.svg };
  return (
    <figure className="visual-pembahasan">
      <figcaption>{g.judul}<button type="button" className="visual-perbesar" onClick={() => setBesar(true)}>Perbesar</button></figcaption>
      <div className="visual-gulir" dangerouslySetInnerHTML={isi} />
      {besar && (
        <div className="visual-lapisan" role="dialog" aria-label={g.judul} onClick={() => setBesar(false)} onKeyDown={(e) => e.key === 'Escape' && setBesar(false)}>
          <div className="visual-kotak" onClick={(e) => e.stopPropagation()}>
            <div className="visual-kepala"><b>{g.judul}</b><button type="button" className="visual-perbesar" autoFocus onClick={() => setBesar(false)}>Tutup</button></div>
            <div className="visual-gulir" dangerouslySetInnerHTML={isi} />
          </div>
        </div>
      )}
    </figure>
  );
}

/** Kunci, konsep, langkah, visual (Induktif dan Deduktif), alasan opsi salah, dan cara cepat satu soal. */
export function Pembahasan({ soal, sidik = true }: { soal: Soal; sidik?: boolean }) {
  const p = soal.pembahasan;
  const gambar = gambarPembahasan(soal);
  return (
    <div className="kunci-blok">
      <p className="kunci-teks">{p.jawaban}</p>
      {p.konsep && <div><b className="subjudul">Konsep</b>{p.konsep}</div>}
      {p.kataKunci && <div><b className="subjudul">Kata kunci</b>{p.kataKunci}</div>}
      <ol>{p.langkah.map((l, i) => <li key={i}>{l.teks}</li>)}</ol>
      {gambar.map((g) => <Visual key={`${soal.uid}-${g.id}`} g={g} />)}
      {p.opsiSalah && (
        <div><b className="subjudul">Alasan opsi salah</b><ul className="opsi-salah">{p.opsiSalah.map((t) => <li key={t}>{t}</li>)}</ul></div>
      )}
      {p.caraCepat && <div className="cepat"><b>Cara cepat:</b> {p.caraCepat}</div>}
      {sidik && <div className="sidik">Lolos pada percobaan ke-{soal.percobaan + 1} · sidik {soal.sidik}</div>}
    </div>
  );
}
