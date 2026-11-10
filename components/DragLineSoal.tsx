'use client';

import { useRef, useState } from 'react';
import { JARI_JARI, type DragLineItem } from '@/lib/induktif/drag-line/pola';

// Drag the Line (SIADU: Node Arrow Navigation). Simpul berkoordinat (x, y) dengan jari-jari 0,5 satuan.
// Garis awalan dikunci. Tarik dari simpul ujung ke simpul lain (atau klik simpul tujuan) untuk menyambung;
// klik simpul ujung terakhir untuk melepasnya. Setiap simpul dipakai tepat sekali.
const SATUAN = 64;

export default function DragLineSoal({ item, kunci, tampilKunci }: { item: DragLineItem; kunci: string[]; tampilKunci: boolean }) {
  const [jalur, setJalur] = useState<string[]>(item.awalan);
  const [tarik, setTarik] = useState<{ x: number; y: number } | null>(null);
  const [hasil, setHasil] = useState<boolean | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  const simpul = new Map(item.simpul.map((s) => [s.id, s]));
  const ujung = simpul.get(jalur[jalur.length - 1])!;
  const lengkap = jalur.length === item.simpul.length;

  const sambung = (id: string) => {
    setHasil(null);
    if (id === ujung.id && jalur.length > item.awalan.length) { setJalur(jalur.slice(0, -1)); return; }
    if (!jalur.includes(id)) setJalur([...jalur, id]);
  };
  const titik = (e: React.PointerEvent) => {
    const r = svg.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * item.lebar, y: ((e.clientY - r.top) / r.height) * item.tinggi };
  };
  const lepas = (e: React.PointerEvent) => {
    if (!tarik) return;
    const p = titik(e);
    const kena = item.simpul.find((s) => Math.hypot(s.x - p.x, s.y - p.y) <= JARI_JARI);
    if (kena && kena.id !== ujung.id) sambung(kena.id);
    setTarik(null);
  };
  // Garis antarsimpul dipotong di tepi lingkaran supaya ujung panah terlihat.
  const garis = (a: string, b: string, k: number, kunciGaris = false) => {
    const p = simpul.get(a)!, q = simpul.get(b)!;
    const d = Math.hypot(q.x - p.x, q.y - p.y);
    const ux = (q.x - p.x) / d, uy = (q.y - p.y) / d;
    return (
      <line key={`${a}-${b}-${k}`} x1={p.x + ux * JARI_JARI} y1={p.y + uy * JARI_JARI} x2={q.x - ux * (JARI_JARI + 0.04)} y2={q.y - uy * (JARI_JARI + 0.04)}
        className={kunciGaris ? 'dl-garis kunci' : k < item.awalan.length - 1 ? 'dl-garis awalan' : 'dl-garis'} markerEnd={kunciGaris ? 'url(#dl-panah-kunci)' : 'url(#dl-panah)'} />
    );
  };

  return (
    <div>
      <h2>Drag the Line</h2>
      <p className="instruksi">Tarik garis dari simpul terakhir yang tersambung ke simpul berikutnya sampai semua simpul terpakai tepat sekali. Garis awalan sudah dikunci.</p>
      <svg
        ref={svg}
        className="dl-kanvas"
        viewBox={`0 0 ${item.lebar} ${item.tinggi}`}
        style={{ width: item.lebar * SATUAN, maxWidth: '100%' }}
        onPointerMove={(e) => tarik && setTarik(titik(e))}
        onPointerUp={lepas}
        onPointerLeave={() => setTarik(null)}
      >
        <defs>
          <marker id="dl-panah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" className="dl-mata" />
          </marker>
          <marker id="dl-panah-kunci" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" className="dl-mata kunci" />
          </marker>
        </defs>
        {tampilKunci && kunci.slice(1).map((b, k) => garis(kunci[k], b, 100 + k, true))}
        {jalur.slice(1).map((b, k) => garis(jalur[k], b, k))}
        {tarik && <line x1={ujung.x} y1={ujung.y} x2={tarik.x} y2={tarik.y} className="dl-garis tarik" />}
        {item.simpul.map((s) => {
          const urutan = jalur.indexOf(s.id);
          const kelas = ['dl-simpul', urutan >= 0 ? 'terpakai' : '', s.id === ujung.id ? 'ujung' : '', item.awalan.includes(s.id) ? 'awalan' : ''].filter(Boolean).join(' ');
          return (
            <g key={s.id} className={kelas} data-simpul={s.kode}
              onPointerDown={(e) => { if (s.id === ujung.id) { (e.target as Element).releasePointerCapture?.(e.pointerId); setTarik({ x: s.x, y: s.y }); } }}
              onClick={() => !tarik && s.id !== ujung.id && sambung(s.id)}
              onDoubleClick={() => s.id === ujung.id && sambung(s.id)}>
              <circle cx={s.x} cy={s.y} r={JARI_JARI} />
              <text x={s.x} y={s.y} dominantBaseline="central" textAnchor="middle" style={{ fontSize: s.kode.length > 4 ? 0.24 : 0.3 }}>{s.kode}</text>
              {tampilKunci && <text x={s.x + 0.42} y={s.y - 0.42} className="dl-nomor">{kunci.indexOf(s.id) + 1}</text>}
            </g>
          );
        })}
      </svg>
      <p className="petunjuk-ui">Tarik dari simpul bergaris tebal (ujung rantai) atau klik simpul tujuan. Klik ganda simpul ujung, atau tekan Urungkan, untuk melepas sambungan terakhir.</p>
      <div className="aksi">
        <button className="btn" onClick={() => { setJalur(jalur.length > item.awalan.length ? jalur.slice(0, -1) : jalur); setHasil(null); }}>Urungkan</button>
        <button className="btn" onClick={() => { setJalur(item.awalan); setHasil(null); }}>Reset</button>
        <button className="btn utama" disabled={!lengkap} onClick={() => setHasil(jalur.join('>') === kunci.join('>'))}>Periksa jawaban</button>
        <span className="status">{lengkap ? 'Semua simpul tersambung' : `${jalur.length}/${item.simpul.length} simpul tersambung`}</span>
        {hasil !== null && <span className={`hasil ${hasil ? 'ok' : 'bad'}`}>{hasil ? 'Jawaban tepat' : 'Jawaban belum tepat'}</span>}
      </div>
    </div>
  );
}
