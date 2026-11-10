import type { Rng } from '../../core/rng';
import type { Family, LangkahPembahasan } from '../../core/types';
import { chapterById } from '../../data/chapters';
import { NAMA_RUANGAN, daftarKata } from '../../data/nama';
import {
  divisiOrang, kunciAlokasi, memenuhiSemua, ruangSebelah, semuaAlokasi,
  type Alokasi, type KendalaRuang, type PosisiDenah, type RoomItem,
} from './model';

// Blueprint Room Allocations bagian 3 — "Alokasi kantor berdasarkan divisi dan denah".
// Sumber: deduktif.pdf hlm. 13–14 (Office Requirements). Lima orang, tiga divisi (2–2–1). Denah: Ruang 1–3 berderet,
// Mesin Fotokopi tepat di sebelah Ruang 3, Koridor, dan Ruang Pertemuan terpisah. Tujuan: Ruang 1–3 + Ruang Pertemuan;
// Mesin Fotokopi dan Koridor fasilitas berlabel yang tidak menerima orang. Ketentuan per orang: sendirian, ruangan tertentu,
// tidak di sebelah Mesin Fotokopi, atau tanpa pembatas (maks. dua klausa per kartu). Aturan umum: divisi berbeda tidak
// berbagi ruangan; Ruang Pertemuan hanya untuk satu divisi dan hanya bila tidak ada ruangan biasa yang memenuhi.

const DIVISI = ['SDM', 'Penjualan', 'TI'];
const KAPASITAS = 3;
const RUANG = [
  { id: 'r1', nama: 'Ruang 1' }, { id: 'r2', nama: 'Ruang 2' }, { id: 'r3', nama: 'Ruang 3' }, { id: 'rp', nama: 'Ruang Pertemuan' },
];
const FASILITAS = [{ id: 'fk', nama: 'Mesin Fotokopi' }, { id: 'kor', nama: 'Koridor' }];

/** Dua orientasi denah: Mesin Fotokopi di kanan Ruang 3 (sumber) atau di kiri Ruang 1 (denah dicerminkan). */
function denah(cermin: boolean): { posisi: PosisiDenah[]; sebelah: [string, string][] } {
  const baris = cermin ? ['fk', 'r1', 'r2', 'r3'] : ['r1', 'r2', 'r3', 'fk'];
  const posisi: PosisiDenah[] = [
    ...baris.map((id, x) => ({ id, x, y: 0, w: 1, h: 1 })),
    { id: 'kor', x: 0, y: 1, w: 4, h: 1 },
    { id: 'rp', x: cermin ? 2 : 0, y: 2, w: 2, h: 1 },
  ];
  const sebelah = baris.slice(1).map((id, i) => [baris[i], id] as [string, string]);
  return { posisi, sebelah };
}

type Klausa = 'sendirian' | 'di' | 'tidak-sebelah' | 'bebas';
const TEMPLATE: Klausa[][][] = [
  [['sendirian', 'di'], ['di'], ['tidak-sebelah'], ['bebas'], ['bebas']], // susunan sumber
  [['sendirian'], ['di'], ['di'], ['tidak-sebelah'], ['bebas']],
  [['sendirian', 'di'], ['tidak-sebelah'], ['tidak-sebelah'], ['bebas'], ['bebas']],
  [['sendirian', 'di'], ['di'], ['sendirian'], ['bebas'], ['bebas']],
];

function bangun(r: Rng): { item: RoomItem; jawaban: Alokasi } | null {
  const nama = r.sample(NAMA_RUANGAN, 5);
  const ids = nama.map((_, i) => `o${i + 1}`);
  const [dA, dB, dC] = r.shuffle(DIVISI);
  const divisi = Object.fromEntries(r.shuffle(ids).map((id, i) => [id, i < 2 ? dA : i < 4 ? dB : dC]));
  const cadangan = r.pick([dA, dB]); // divisi dua orang, seperti SDM pada sumber
  const { posisi, sebelah } = denah(r.next() < 0.5);
  // Komposisi sumber 2–1–1–1: satu pasangan sedivisi berbagi ruangan, tiga orang lain masing-masing satu ruangan.
  const divPasangan = r.pick([dA, dB]);
  const pasangan = ids.filter((id) => divisi[id] === divPasangan);
  const tunggal = r.shuffle(ids.filter((id) => divisi[id] !== divPasangan));
  const ruangAcak = r.shuffle(RUANG.map((x) => x.id));
  const jawaban: Alokasi = {};
  pasangan.forEach((id) => (jawaban[id] = ruangAcak[0]));
  tunggal.forEach((id, i) => (jawaban[id] = ruangAcak[i + 1]));
  // Ruang Pertemuan hanya boleh berisi divisi cadangan.
  if (ids.some((id) => jawaban[id] === 'rp' && divisi[id] !== cadangan)) return null;

  const tetangga = (a: string) => sebelah.flatMap(([x, y]) => (x === a ? [y] : y === a ? [x] : []));
  const template = r.pick(TEMPLATE);
  const urutan = r.shuffle(ids);
  const kartu: Record<string, KendalaRuang[]> = {};
  for (let i = 0; i < ids.length; i++) {
    const p = urutan[i];
    kartu[p] = [];
    for (const k of template[i]) {
      if (k === 'di') kartu[p].push({ jenis: 'di', orang: p, ruang: jawaban[p] });
      if (k === 'sendirian') {
        if (ids.some((q) => q !== p && jawaban[q] === jawaban[p])) return null;
        kartu[p].push({ jenis: 'sendirian', orang: p });
      }
      if (k === 'tidak-sebelah') {
        if (tetangga('fk').includes(jawaban[p])) return null;
        kartu[p].push({ jenis: 'tidak-sebelah', orang: p, fasilitas: 'fk' });
      }
      if (k === 'bebas') kartu[p].push({ jenis: 'bebas', orang: p });
    }
    kartu[p].push({ jenis: 'divisi', orang: p, divisi: divisi[p] });
  }
  const namaArea = (id: string) => [...RUANG, ...FASILITAS].find((x) => x.id === id)?.nama ?? nama[ids.indexOf(id)];
  const tampil = r.shuffle(ids);
  const item: RoomItem = {
    jenis: 'room-allocation',
    judul: r.pick(['Penataan Ruang Kantor', 'Alokasi Ruang Kerja', 'Ruang Kantor Baru']),
    instruksi: [
      'Tempatkan kelima karyawan ke ruangan sesuai denah dan keterangan pada kartu.',
      'Karyawan dari divisi berbeda tidak boleh berbagi ruangan.',
      `Ruang Pertemuan hanya boleh dipakai divisi ${cadangan}, dan hanya jika tidak ada Ruang 1–3 yang memenuhi seluruh ketentuan untuk orang tersebut.`,
      'Mesin Fotokopi dan Koridor bukan tempat penempatan; setiap ruangan menampung maksimal tiga orang.',
    ],
    ruang: RUANG,
    fasilitas: FASILITAS,
    denah: posisi,
    sebelah,
    kapasitas: KAPASITAS,
    orang: tampil.map((id) => {
      const k = kartu[id];
      const di = k.find((x) => x.jenis === 'di') as Extract<KendalaRuang, { jenis: 'di' }> | undefined;
      const sendiri = k.some((x) => x.jenis === 'sendirian');
      const baris: string[] = [];
      if (sendiri && di) baris.push(`Harus sendirian di ${namaArea(di.ruang)}.`);
      else {
        if (sendiri) baris.push('Harus sendirian di ruangannya.');
        if (di) baris.push(`Harus di ${namaArea(di.ruang)}.`);
      }
      if (k.some((x) => x.jenis === 'tidak-sebelah')) baris.push('Tidak boleh di ruangan yang tepat bersebelahan dengan Mesin Fotokopi.');
      if (k.some((x) => x.jenis === 'bebas')) baris.push('Tidak memiliki ketentuan khusus.');
      return { id, nama: nama[ids.indexOf(id)], petunjuk: baris, tag: divisi[id] };
    }),
    kendala: [...tampil.flatMap((id) => kartu[id]), { jenis: 'tanpa-campur' }, { jenis: 'ruang-cadangan', ruang: 'rp', divisi: cadangan }],
  };
  return { item, jawaban };
}

/** Pembahasan dengan penyaringan ruangan per orang; setiap orang yang tersisa satu ruangan dicatat beserta alasannya. */
function bahas(item: RoomItem, jawaban: Alokasi) {
  const ids = item.orang.map((o) => o.id);
  const nama = (id: string) => item.orang.find((o) => o.id === id)!.nama;
  const namaR = (id: string) => [...item.ruang, ...(item.fasilitas ?? [])].find((x) => x.id === id)!.nama;
  const div = (id: string) => divisiOrang(item.kendala, id)!;
  const cad = item.kendala.find((k) => k.jenis === 'ruang-cadangan') as Extract<KendalaRuang, { jenis: 'ruang-cadangan' }>;
  const punya = (id: string, j: KendalaRuang['jenis']) => item.kendala.some((k) => k.jenis === j && 'orang' in k && k.orang === id);
  const dom = new Map(ids.map((id) => [id, new Set(item.ruang.map((r) => r.id))]));
  const alasan = new Map(ids.map((id) => [id, [] as string[]]));
  const tetap = new Map<string, string>();
  const langkah: LangkahPembahasan[] = [];
  const buang = (id: string, rid: string, why: string) => { if (dom.get(id)!.delete(rid)) alasan.get(id)!.push(`${namaR(rid)} ${why}`); };
  const kunci = (id: string, rid: string, teks: string) => { dom.set(id, new Set([rid])); tetap.set(id, rid); langkah.push({ teks }); };

  for (const k of item.kendala) if (k.jenis === 'di') {
    kunci(k.orang, k.ruang, `${nama(k.orang)} ${punya(k.orang, 'sendirian') ? 'harus sendirian' : 'harus berada'} di ${namaR(k.ruang)} (kartu ${nama(k.orang)}).`);
  }
  for (const id of ids) {
    if (tetap.has(id)) continue;
    if (div(id) !== cad.divisi) buang(id, cad.ruang, `hanya untuk divisi ${cad.divisi}`);
    if (punya(id, 'tidak-sebelah')) for (const rid of ruangSebelah(item, 'fk')) buang(id, rid, 'tepat bersebelahan dengan Mesin Fotokopi');
  }
  for (let maju = true, putaran = 0; maju && putaran < 20; putaran++) {
    maju = false;
    for (const id of ids) {
      if (tetap.has(id)) continue;
      for (const [q, rq] of tetap) {
        if (punya(q, 'sendirian')) buang(id, rq, `sudah dipakai ${nama(q)} yang harus sendirian`);
        else if (div(q) !== div(id)) buang(id, rq, `berisi ${nama(q)} dari divisi ${div(q)}`);
        else if (punya(id, 'sendirian')) buang(id, rq, `sudah berisi ${nama(q)}`);
      }
      const d = dom.get(id)!;
      const biasa = [...d].filter((rid) => rid !== cad.ruang);
      if (d.size === 1) {
        const [rid] = [...d];
        kunci(id, rid, `${nama(id)} (${div(id)}): ${alasan.get(id)!.join('; ')}. Jadi ${nama(id)} di ${namaR(rid)}.`);
        maju = true;
      } else if (biasa.length === 0 && d.has(cad.ruang)) {
        kunci(id, cad.ruang, `${nama(id)} (${div(id)}): ${alasan.get(id)!.join('; ')}. Tidak ada Ruang 1–3 yang memenuhi, jadi ${nama(id)} memakai ${namaR(cad.ruang)}.`);
        maju = true;
      } else if (biasa.length === 1 && d.has(cad.ruang) && tetap.size === ids.length - 1
        && memenuhiSemua(item, item.kendala.filter((k) => k.jenis !== 'ruang-cadangan'), { ...Object.fromEntries(tetap), [id]: biasa[0] })) {
        const sebab = alasan.get(id)!.length ? `${alasan.get(id)!.join('; ')}. ` : '';
        kunci(id, biasa[0], `${nama(id)} (${div(id)}): ${sebab}${namaR(biasa[0])} masih memenuhi seluruh ketentuan, sehingga Ruang Pertemuan tidak boleh dipakai. Jadi ${nama(id)} di ${namaR(biasa[0])}.`);
        maju = true;
      }
    }
  }
  if (tetap.size !== ids.length || ids.some((id) => tetap.get(id) !== jawaban[id])) return null;
  if (!memenuhiSemua(item, item.kendala, Object.fromEntries(tetap))) return null;
  const isi = item.ruang.map((r) => ({ r, anggota: ids.filter((id) => jawaban[id] === r.id).map(nama) }));
  langkah.push({ teks: `Periksa: ${isi.map(({ r, anggota }) => `${r.nama} ${anggota.length ? daftarKata(anggota) : 'kosong'}`).join('; ')}. Tidak ada divisi yang bercampur, tidak ada ruangan melebihi tiga orang, dan Mesin Fotokopi serta Koridor tidak ditempati.` });
  return {
    jawaban: isi.filter((x) => x.anggota.length).map(({ r, anggota }) => `${r.nama}: ${daftarKata(anggota)}`).join('; '),
    langkah,
    caraCepat: 'Kunci dulu orang dengan ruangan tetap, lalu coret ruangan yang dipakai orang "sendirian" atau divisi lain. Ruang Pertemuan baru dipakai setelah semua ruang biasa gugur.',
  };
}

export const roomKantor: Family<RoomItem, Alokasi> = {
  id: 'RA-KANTOR',
  versi: 1,
  nama: 'Alokasi kantor menurut divisi dan denah',
  chapter: chapterById('room-allocations'),
  label: 'SHL',
  sumber: 'Blueprint Room Allocations §3 · deduktif.pdf hlm. 13–14 (Office Requirements)',
  ringkas: 'Lima karyawan dari tiga divisi (2–2–1). Denah Ruang 1–3, Mesin Fotokopi, Koridor, dan Ruang Pertemuan. Kartu: sendirian, ruangan tertentu, tidak bersebelahan dengan Mesin Fotokopi, atau tanpa ketentuan. Divisi tidak boleh bercampur; Ruang Pertemuan bersyarat.',
  bangun,
  pecahkan: (item) => semuaAlokasi(item),
  kunci: kunciAlokasi,
  periksa(item, jawaban) {
    const masalah: string[] = [];
    if (item.orang.length !== 5) masalah.push('jumlah orang bukan lima');
    if (item.orang.some((o) => o.petunjuk.length > 2)) masalah.push('kartu lebih dari dua klausa');
    if (new Set(Object.values(jawaban)).size !== 4) masalah.push('komposisi bukan 2–1–1–1');
    return masalah;
  },
  bahas,
  sidik(item, jawaban) {
    // Struktur = per orang: (ruang jawaban, divisi relatif, jenis klausa) + orientasi denah; nama orang dan nama divisi diabaikan.
    const cad = (item.kendala.find((k) => k.jenis === 'ruang-cadangan') as { divisi: string }).divisi;
    const kodeDiv = (d: string | undefined) => (d === cad ? 'C' : item.orang.filter((o) => divisiOrang(item.kendala, o.id) === d).length === 1 ? 'T' : 'L');
    const baris = item.orang.map((o) => {
      const klausa = item.kendala.filter((k) => 'orang' in k && k.orang === o.id && k.jenis !== 'divisi').map((k) => k.jenis).sort().join('+');
      return `${jawaban[o.id]}:${kodeDiv(divisiOrang(item.kendala, o.id))}:${klausa}`;
    }).sort();
    return `room-kantor:${item.sebelah?.map((p) => p.join('-')).join(',')}:${baris.join('|')}`;
  },
};
