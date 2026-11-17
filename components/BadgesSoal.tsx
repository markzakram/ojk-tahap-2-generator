'use client';

import { useId, useRef, useState } from 'react';
import type { BadgesItem, Peringkat } from '@/lib/deduktif/badges/model';
import Avatar from './Avatar';

// Badges (Logical Ranking). Lencana 1..n di baki diseret ke kartu orang (atau klik lencana lalu klik kartu), seperti SHL:
// lingkaran lencana ikut terlihat di bawah kursor selama diseret (Rancangan Fitur TKU, bagian Badges). Lencana di kartu
// dapat dipindah ke kartu lain (bertukar bila kartu tujuan sudah berlencana) atau dikembalikan ke baki. Penempatan tidak
// pernah ditolak dan tidak memberi umpan balik benar/salah; jawaban baru dapat diperiksa setelah semua lencana terpasang.
// Papan ketik: Tab ke lencana → Enter/Spasi memilih; Tab ke kartu atau baki → Enter/Spasi memasang/mengembalikan.
const DASAR = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const AMBANG_SERET = 4;

type Sasaran = string; // id orang atau 'baki'

/** Foto bank aset Badges Tahap 1 (disalin ke public/tahap-1 saat dev/build); bila tidak tersedia, pakai Avatar biasa. */
function Foto({ nama, foto }: { nama: string; foto?: string }) {
  const [gagal, setGagal] = useState(false);
  if (!foto || gagal) return <Avatar nama={nama} />;
  return <img className="avatar foto" src={`${DASAR}/tahap-1/bank_aset_badges/${foto}`} alt="" aria-hidden width={40} height={40} onError={() => setGagal(true)} />;
}

/** Enter/Spasi pada elemen ber-role button memanggil aksi yang sama dengan klik (hanya bila fokus pada elemen itu sendiri). */
const tombolKetik = (aksi: () => void) => (e: React.KeyboardEvent<HTMLElement>) => {
  if (e.target !== e.currentTarget) return;
  if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); aksi(); }
};

export default function BadgesSoal(props: { item: unknown; kunci: unknown; tampilKunci: boolean }) {
  const item = props.item as BadgesItem;
  const kunci = props.kunci as Peringkat;
  const { tampilKunci } = props;
  const n = item.lencana;
  const awalanId = useId();
  const kosong = () => Object.fromEntries(item.orang.map((o) => [o.id, null])) as Record<string, number | null>;
  const [pasang, setPasang] = useState<Record<string, number | null>>(kosong);
  const [aktif, setAktif] = useState<number | null>(null);
  const [hasil, setHasil] = useState<boolean | null>(null);
  const [seret, setSeret] = useState<{ lencana: number; x: number; y: number; sasaran: Sasaran | null } | null>(null);
  const tekan = useRef<{ lencana: number; x: number; y: number; gerak: boolean } | null>(null);
  const abaikanKlik = useRef(false);

  const pemegang = (l: number) => item.orang.find((o) => pasang[o.id] === l)?.id ?? null;
  const terpasang = item.orang.filter((o) => pasang[o.id] !== null).length;
  const semuaTerpasang = terpasang === n;
  const namaOrang = (id: string) => item.orang.find((o) => o.id === id)?.nama ?? id;

  const taruh = (l: number, ke: Sasaran) => {
    const dari = pemegang(l);
    const baru = { ...pasang };
    if (ke === 'baki') { if (dari) baru[dari] = null; }
    else {
      if (dari === ke) { setAktif(null); return; }
      // Bertukar bila lencana datang dari kartu lain; bila dari baki, lencana lama di kartu tujuan kembali ke baki.
      if (dari) baru[dari] = baru[ke];
      baru[ke] = l;
    }
    setPasang(baru); setAktif(null); setHasil(null);
  };

  const sasaranDi = (x: number, y: number): Sasaran | null => {
    const el = document.elementFromPoint(x, y)?.closest('[data-bdg-sasaran]');
    return el?.getAttribute('data-bdg-sasaran') ?? null;
  };

  // Seret dengan pointer (tetikus dan sentuh). Lencana yang diseret digambar ulang sebagai lingkaran di bawah kursor.
  const lencanaProps = (l: number) => ({
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
      if (e.button !== 0) return;
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* penunjuk tanpa capture tetap dapat diseret di atas lencana */ }
      tekan.current = { lencana: l, x: e.clientX, y: e.clientY, gerak: false };
    },
    onPointerMove: (e: React.PointerEvent<HTMLButtonElement>) => {
      const t = tekan.current;
      if (!t || t.lencana !== l) return;
      if (!t.gerak && Math.hypot(e.clientX - t.x, e.clientY - t.y) < AMBANG_SERET) return;
      t.gerak = true;
      setSeret({ lencana: l, x: e.clientX, y: e.clientY, sasaran: sasaranDi(e.clientX, e.clientY) });
    },
    onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => {
      const t = tekan.current;
      tekan.current = null;
      if (!t || !t.gerak) return;
      abaikanKlik.current = true;
      setTimeout(() => (abaikanKlik.current = false), 0);
      setSeret(null);
      const ke = sasaranDi(e.clientX, e.clientY);
      if (ke) taruh(l, ke);
    },
    onPointerCancel: () => { tekan.current = null; setSeret(null); },
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation();
      if (abaikanKlik.current) { abaikanKlik.current = false; return; }
      // Lencana lain sedang dipilih dan lencana ini sudah terpasang di kartu: pasang/tukar ke kartu itu.
      const pemilik = pemegang(l);
      if (aktif !== null && aktif !== l && pemilik) { taruh(aktif, pemilik); return; }
      setAktif(aktif === l ? null : l);
    },
  });

  const klikSasaran = (ke: Sasaran) => () => {
    if (abaikanKlik.current) return;
    if (aktif !== null) taruh(aktif, ke);
  };

  const lencana = (l: number, label = `Lencana ${l}`) => (
    <button key={l} type="button" className={`bdg-lencana${aktif === l ? ' aktif' : ''}${seret?.lencana === l ? ' bayang' : ''}`}
      aria-label={label} aria-pressed={aktif === l} {...lencanaProps(l)}>{l}</button>
  );

  const status = aktif !== null
    ? `Lencana ${aktif} dipilih${pemegang(aktif) ? ` (di kartu ${namaOrang(pemegang(aktif)!)})` : ''}: pilih kartu tujuan${pemegang(aktif) ? ' atau baki' : ''}`
    : semuaTerpasang ? 'Semua lencana sudah dipasang' : `${n - terpasang} lencana belum dipasang`;

  return (
    <div>
      <h2>{item.judul} <span className="pg-tingkat">{item.tingkat}</span></h2>
      {item.instruksi.map((s) => <p className="instruksi" key={s}>{s}</p>)}
      <div className={`bdg-baki${aktif !== null && pemegang(aktif) ? ' siap' : ''}${seret?.sasaran === 'baki' ? ' sasaran' : ''}`}
        data-bdg-sasaran="baki" onClick={klikSasaran('baki')}
        role="button" tabIndex={0} aria-label={`Baki lencana, ${n - terpasang} belum dipasang${aktif !== null && pemegang(aktif) ? `; tekan untuk mengembalikan lencana ${aktif}` : ''}`}
        onKeyDown={tombolKetik(klikSasaran('baki'))}>
        <div className="area-judul"><span>Lencana</span><span>{n - terpasang} belum dipasang</span></div>
        <div className="bdg-baris">
          {Array.from({ length: n }, (_, i) => i + 1).map((l) =>
            pemegang(l) ? <span key={l} className="bdg-lencana kosong" aria-hidden>{l}</span> : lencana(l))}
        </div>
      </div>
      <div className="orang-grid bdg-grid">
        {item.orang.map((o) => {
          const l = pasang[o.id];
          const idIsi = `${awalanId}-isi-${o.id}`;
          return (
            <div key={o.id} data-bdg-sasaran={o.id} onClick={klikSasaran(o.id)}
              role="button" tabIndex={0} aria-label={`Kartu ${o.nama}, lencana ${l ?? 'kosong'}`} aria-describedby={idIsi}
              onKeyDown={tombolKetik(klikSasaran(o.id))}
              className={`orang bdg-kartu${aktif !== null && pasang[o.id] !== aktif ? ' siap' : ''}${seret?.sasaran === o.id ? ' sasaran' : ''}`}>
              <Foto nama={o.nama} foto={o.foto} />
              <div className="bdg-isi" id={idIsi}>
                <b>{o.nama}</b>
                {o.petunjuk.length ? o.petunjuk.map((t) => <span key={t}>{t}</span>) : <span className="bdg-tanpa">—</span>}
              </div>
              <div className="bdg-kanan">
                <div className={`bdg-slot${l !== null ? ' isi' : ''}`}>{l !== null && lencana(l, `Lencana ${l} di kartu ${o.nama}`)}</div>
                {tampilKunci && <span className="bdg-kunci" title="Kunci">Kunci {kunci[o.id]}</span>}
              </div>
            </div>
          );
        })}
      </div>
      <p className="petunjuk-ui">Seret lencana ke kartu orang, atau klik lencana lalu klik kartu. Lencana di kartu dapat diseret ke kartu lain (bertukar) atau dikembalikan ke baki; bila sebuah lencana sedang dipilih, klik lencana di kartu lain untuk menukarnya. Papan ketik: Tab ke lencana lalu Enter, kemudian Tab ke kartu atau baki lalu Enter.</p>
      <div className="aksi">
        <button className="btn" type="button" onClick={() => { setPasang(kosong()); setAktif(null); setHasil(null); }}>Reset</button>
        <button className="btn utama" type="button" onClick={() => setHasil(item.orang.every((o) => pasang[o.id] === kunci[o.id]))} disabled={!semuaTerpasang}>Periksa jawaban</button>
        <span className="status" aria-live="polite">{status}</span>
        <span className={`hasil bdg-hasil${hasil === null ? '' : hasil ? ' ok' : ' bad'}`} aria-live="polite">{hasil === null ? '' : hasil ? 'Jawaban tepat' : 'Jawaban belum tepat'}</span>
      </div>
      {seret && <span className="bdg-lencana bdg-seret" style={{ left: seret.x, top: seret.y }} aria-hidden>{seret.lencana}</span>}
    </div>
  );
}
