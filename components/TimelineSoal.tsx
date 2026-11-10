'use client';

import { useState } from 'react';
import { KOTAK_TL, jamTL, rentangTL, type BarisTL, type KegiatanTL, type TimelineItem } from '@/lib/deduktif/timeline/model';

// Interaksi sesuai Blueprint Timeline §11: empat baris × 18 kotak; baris diketahui hanya-baca dengan hover per kegiatan utuh;
// rapat/reservasi = satu blok lengkap sesuai durasi (klik kotak mulai), petugas = pilih kotak satu per satu (boleh terpisah).
// Warna pilihan bukan umpan balik benar/salah; ada reset; pilihan kosong tidak dapat diperiksa.
export default function TimelineSoal({ item, kunci, tampilKunci }: { item: TimelineItem; kunci: number[]; tampilKunci: boolean }) {
  const [pilih, setPilih] = useState<number[]>([]);
  const [sorot, setSorot] = useState<string | null>(null);
  const [hasil, setHasil] = useState<boolean | null>(null);
  const [pesan, setPesan] = useState('');

  const klik = (i: number) => {
    setHasil(null); setPesan('');
    if (item.pilih.mode === 'kotak') { setPilih(pilih.includes(i) ? pilih.filter((x) => x !== i) : [...pilih, i]); return; }
    const L = item.pilih.panjang;
    if (i + L > KOTAK_TL) { setPesan('Blok tidak boleh melewati pukul 18.00.'); return; }
    setPilih(pilih[0] === i ? [] : Array.from({ length: L }, (_, k) => i + k));
  };
  const periksa = () => setHasil([...pilih].sort((a, b) => a - b).join(',') === [...kunci].sort((a, b) => a - b).join(','));
  const keterangan = (k: KegiatanTL) => `${k.nama} · ${rentangTL(k.mulai, k.durasi)} · ${k.durasi * 30} menit${k.peran === 'target-semula' ? ' · jadwal semula' : item.aturan.jenis === 'rapat' ? (k.bisaGeser ? ' · boleh digeser 30 menit' : ' · tetap') : ''}`;

  const barisDiketahui = (b: BarisTL) => {
    const sel: React.ReactNode[] = [];
    for (let i = 0; i < KOTAK_TL;) {
      const k = b.kegiatan.find((x) => x.mulai === i);
      if (k) {
        sel.push(<div key={k.id} className={`tl-keg${sorot === k.id ? ' sorot' : ''}`} style={{ gridColumn: `span ${k.durasi}` }} title={keterangan(k)}
          onMouseEnter={() => setSorot(k.id)} onMouseLeave={() => setSorot(null)}><span>{k.nama}</span></div>);
        i += k.durasi;
      } else { sel.push(<div key={'kosong-' + i} className={`tl-kosong${penandaDi(i) ? ' penanda' : ''}`} title={penandaDi(i)?.nama} />); i++; }
    }
    return sel;
  };
  const penandaDi = (i: number) => item.penanda?.find((p) => i >= p.mulai && i < p.mulai + p.durasi);
  const kegiatanJawabanDi = (i: number) => item.jawaban.kegiatan.find((k) => i >= k.mulai && i < k.mulai + k.durasi);
  const labelBlok = (i: number) => item.pilih.mode === 'blok' && item.pilih.label && pilih.includes(i) ? item.pilih.label[i - pilih[0]] : null;

  return (
    <div>
      <h2>{item.judul}</h2>
      {item.paragraf.map((s) => <p className="instruksi" key={s}>{s}</p>)}
      <p className="instruksi"><b>{item.pertanyaan}</b></p>
      <div className="tl-legenda">
        <span><i className="tl-ikon abu" /> {item.legenda.abu}</span>
        <span><i className="tl-ikon pilih" /> {item.legenda.pilihan}</span>
        {item.aturan.jenis === 'rapat' && <span><i className="tl-ikon semula" /> Jadwal semula (dilepas)</span>}
        {item.penanda && <span><i className="tl-ikon tanda" /> Di luar jam acara / acara tutup</span>}
      </div>
      <p className="petunjuk-ui">{item.pilih.mode === 'blok'
        ? `Klik kotak mulai pada baris ${item.jawaban.nama}; ${item.pilih.panjang} kotak akan terpilih sekaligus. Klik kotak yang sama untuk membatalkan.`
        : `Klik kotak pada baris ${item.jawaban.nama} untuk memilih atau membatalkan; pilihan boleh terpisah.`} Arahkan kursor ke kegiatan untuk melihat keterangannya.</p>
      <div className="tl-papan">
        <div className="tl-baris tl-kepala">
          <div className="tl-nama" />
          <div className="tl-jam">{Array.from({ length: KOTAK_TL / 2 + 1 }, (_, h) => <span key={h} style={{ left: `${(h * 2 * 100) / KOTAK_TL}%` }}>{jamTL(h * 2)}</span>)}</div>
        </div>
        {item.baris.map((b) => (
          <div className="tl-baris" key={b.id}>
            <div className="tl-nama"><b>{b.nama}</b>{b.keterangan && <small>{b.keterangan}</small>}</div>
            <div className="tl-sel">{barisDiketahui(b)}</div>
          </div>
        ))}
        <div className="tl-baris tl-jawab">
          <div className="tl-nama"><b>{item.jawaban.nama}</b>{item.jawaban.keterangan && <small>{item.jawaban.keterangan}</small>}</div>
          <div className="tl-sel">
            {Array.from({ length: KOTAK_TL }, (_, i) => {
              const k = kegiatanJawabanDi(i);
              const kelas = ['tl-kotak', k ? (k.peran ? 'semula' : 'abu') : '', k && sorot === k.id ? 'sorot' : '', penandaDi(i) ? 'penanda' : '',
                pilih.includes(i) ? 'dipilih' : '', tampilKunci && kunci.includes(i) ? 'kunci' : '', k && k.mulai === i ? 'awal' : ''].filter(Boolean).join(' ');
              return (
                <button key={i} data-kotak={i} className={kelas} onClick={() => klik(i)} title={k ? keterangan(k) : penandaDi(i)?.nama ?? rentangTL(i, 1)}
                  onMouseEnter={() => k && setSorot(k.id)} onMouseLeave={() => setSorot(null)}>
                  {labelBlok(i) ?? (k && k.mulai === i ? k.nama : '')}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="aksi">
        <button className="btn" onClick={() => { setPilih([]); setHasil(null); setPesan(''); }}>Reset</button>
        <button className="btn utama" onClick={periksa} disabled={!pilih.length}>Periksa jawaban</button>
        <span className="status">{pesan || (pilih.length ? `${pilih.length} kotak dipilih` : 'Belum ada pilihan')}</span>
        {hasil !== null && <span className={`hasil ${hasil ? 'ok' : 'bad'}`}>{hasil ? 'Jawaban tepat' : 'Jawaban belum tepat'}</span>}
      </div>
    </div>
  );
}
