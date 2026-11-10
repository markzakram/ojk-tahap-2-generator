import type { Family, LangkahPembahasan, Pembahasan } from '../../core/types';
import { chapterById } from '../../data/chapters';
import { NAMA_RUANGAN, daftarKata } from '../../data/nama';
import { semuaAlokasi, teksKendala, type Alokasi, type KendalaRuang, type RoomItem } from './model';

// Blueprint Room Allocations bagian 2 — "Pengelompokan ruangan sama atau berbeda".
// Sumber: deduktif.pdf hlm. 19–20 (Convention Booths). Lima orang, dua ruangan bernama, lima baris petunjuk satu klausa:
// satu penempatan langsung, dua "ruangan sama", dua "ruangan berbeda", ditambah satu kalimat aturan kapasitas.

const KONTEKS = [
  { judul: 'Ruang Pameran', ruang: ['Ruang Riset', 'Ruang Pemasaran'], perintah: 'Tempatkan setiap petugas pameran ke ruangan yang sesuai dengan keterangan pada kartunya.' },
  { judul: 'Pembagian Ruang Kerja', ruang: ['Ruang Riset', 'Ruang Pemasaran'], perintah: 'Tempatkan setiap orang ke ruangan yang sesuai dengan keterangan pada kartunya.' },
  { judul: 'Penempatan Tim Proyek', ruang: ['Ruang Barat', 'Ruang Timur'], perintah: 'Tempatkan setiap anggota tim ke ruangan yang sesuai dengan keterangan pada kartunya.' },
] as const;

const KAPASITAS = 3;

function tersambung(item: RoomItem): boolean {
  const tetangga = new Map<string, string[]>(item.orang.map((o) => [o.id, []]));
  let jangkar: string | undefined;
  for (const k of item.kendala) {
    if (k.jenis === 'di') jangkar = k.orang;
    else if (k.jenis === 'sama' || k.jenis === 'beda') { tetangga.get(k.orang)!.push(k.dengan); tetangga.get(k.dengan)!.push(k.orang); }
  }
  if (!jangkar) return false;
  const lihat = new Set([jangkar]);
  const antre = [jangkar];
  while (antre.length) for (const t of tetangga.get(antre.pop()!)!) if (!lihat.has(t)) { lihat.add(t); antre.push(t); }
  return lihat.size === item.orang.length;
}

function bahas(item: RoomItem, jawaban: Alokasi): Pembahasan | null {
  const nama = (id: string) => item.orang.find((o) => o.id === id)?.nama ?? item.ruang.find((r) => r.id === id)!.nama;
  const lawan = (r: string) => item.ruang.find((x) => x.id !== r)!.id;
  const tahu: Alokasi = {};
  const langkah: LangkahPembahasan[] = [];
  for (const k of item.kendala) if (k.jenis === 'di') {
    tahu[k.orang] = k.ruang;
    langkah.push({ teks: `${nama(k.orang)} harus di ${nama(k.ruang)} (kartu ${nama(k.orang)}).` });
  }
  // Rambatkan relasi sama/berbeda dari orang yang ruangannya sudah pasti. Pada dua ruangan, "berbeda" langsung menunjuk ruangan lawan.
  for (let maju = true; maju;) {
    maju = false;
    for (const k of item.kendala) {
      if (k.jenis !== 'sama' && k.jenis !== 'beda') continue;
      const [a, b] = [k.orang, k.dengan];
      const [dari, ke] = tahu[a] && !tahu[b] ? [a, b] : tahu[b] && !tahu[a] ? [b, a] : [null, null];
      if (!dari || !ke) continue;
      tahu[ke] = k.jenis === 'sama' ? tahu[dari] : lawan(tahu[dari]);
      const relasi = k.jenis === 'sama' ? `satu ruangan dengan ${nama(k.dengan)}` : `berbeda ruangan dari ${nama(k.dengan)}`;
      const alasan = k.jenis === 'sama' ? '' : ', dan hanya ada dua ruangan';
      langkah.push({ teks: `Kartu ${nama(k.orang)}: ${relasi}. Karena ${nama(dari)} di ${nama(tahu[dari])}${alasan}, ${nama(ke)} di ${nama(tahu[ke])}.` });
      maju = true;
    }
  }
  if (item.orang.some((o) => !tahu[o.id])) return null;
  if (item.orang.some((o) => tahu[o.id] !== jawaban[o.id])) return null;
  const isi = item.ruang.map((r) => ({ r, anggota: item.orang.filter((o) => tahu[o.id] === r.id).map((o) => o.nama) }));
  langkah.push({ teks: `Periksa kapasitas: ${isi.map(({ r, anggota }) => `${r.nama} berisi ${anggota.length} orang`).join(', ')}; tidak ada yang melebihi ${KAPASITAS}. Kelima petunjuk terpenuhi.` });
  return {
    jawaban: isi.map(({ r, anggota }) => `${r.nama}: ${daftarKata(anggota)}`).join('; '),
    langkah,
    caraCepat: 'Mulai dari orang yang ruangannya sudah ditetapkan, lalu ikuti rantai "satu ruangan" dan "berbeda ruangan" satu per satu.',
  };
}

/** Sidik kanonik: minimum atas seluruh 120 penamaan ulang orang dan 2 penukaran ruangan. Nama/konteks tidak memengaruhi sidik. */
function sidik(item: RoomItem, jawaban: Alokasi): string {
  const ids = item.orang.map((o) => o.id);
  const rids = item.ruang.map((r) => r.id);
  let terbaik = '';
  const perm = (xs: string[]): string[][] => xs.length <= 1 ? [xs] : xs.flatMap((x, i) => perm([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p]));
  for (const p of perm(ids)) for (const q of [rids, [...rids].reverse()]) {
    const io = (id: string) => p.indexOf(id);
    const ir = (id: string) => q.indexOf(id);
    const k = item.kendala.map((x) => x.jenis === 'di' ? `d${io(x.orang)}${ir(x.ruang)}` : x.jenis === 'sama' || x.jenis === 'beda' ? `${x.jenis[0]}${io(x.orang)}${io(x.dengan)}` : x.jenis).sort().join('');
    const j = ids.map((id) => `${io(id)}${ir(jawaban[id])}`).sort().join('');
    const s = `${k}|${j}`;
    if (!terbaik || s < terbaik) terbaik = s;
  }
  return `room-sama-beda:${terbaik}`;
}

export const roomSamaBeda: Family<RoomItem, Alokasi> = {
  id: 'RA-SAMA-BEDA',
  versi: 2,
  nama: 'Ruangan sama atau berbeda',
  chapter: chapterById('room-allocations'),
  label: 'SHL',
  sumber: 'Blueprint Room Allocations §2 · deduktif.pdf hlm. 19–20 (Convention Booths)',
  ringkas: 'Lima orang, dua ruangan bernama. Satu orang ditetapkan ruangannya, dua kartu "satu ruangan dengan", dua kartu "berbeda ruangan dari". Maksimal tiga orang per ruangan.',

  bangun(r) {
    const konteks = r.pick(KONTEKS);
    const ruangNama = r.shuffle(konteks.ruang);
    const ruang = ruangNama.map((nama, i) => ({ id: `r${i + 1}`, nama }));
    const nama = r.sample(NAMA_RUANGAN, 5);
    const ids = nama.map((_, i) => `o${i + 1}`);
    // Komposisi wajib 2–3 atau 3–2.
    const urut = r.shuffle(ids);
    const isiR1 = r.pick([2, 3]);
    const jawaban: Alokasi = {};
    urut.forEach((id, i) => (jawaban[id] = i < isiR1 ? 'r1' : 'r2'));
    // Jenis petunjuk per kartu: 1 penempatan langsung, 2 sama, 2 berbeda.
    const jenis = r.shuffle(['di', 'sama', 'sama', 'beda', 'beda'] as const);
    const kendala: KendalaRuang[] = [];
    for (let i = 0; i < ids.length; i++) {
      const p = ids[i];
      if (jenis[i] === 'di') { kendala.push({ jenis: 'di', orang: p, ruang: jawaban[p] }); continue; }
      const calon = ids.filter((q) => q !== p && (jenis[i] === 'sama') === (jawaban[q] === jawaban[p]));
      if (!calon.length) return null;
      kendala.push({ jenis: jenis[i] as 'sama' | 'beda', orang: p, dengan: r.pick(calon) });
    }
    const namaDari = (id: string) => (id.startsWith('o') ? nama[ids.indexOf(id)] : ruang.find((x) => x.id === id)!.nama);
    const item: RoomItem = {
      jenis: 'room-allocation',
      judul: konteks.judul,
      instruksi: [konteks.perintah, `Setiap ruangan menampung maksimal ${KAPASITAS === 3 ? 'tiga' : KAPASITAS} orang.`],
      ruang,
      kapasitas: KAPASITAS,
      orang: ids.map((id, i) => ({ id, nama: nama[i], petunjuk: [teksKendala(kendala[i], namaDari)!] })),
      kendala,
    };
    return { item, jawaban };
  },

  pecahkan: (item) => semuaAlokasi(item, item.kendala),
  kunci: (a) => Object.keys(a).sort().map((o) => `${o}=${a[o]}`).join(','),

  periksa(item) {
    const masalah: string[] = [];
    const hitung = (j: string) => item.kendala.filter((k) => k.jenis === j).length;
    if (item.orang.length !== 5) masalah.push('jumlah orang bukan lima');
    if (hitung('di') !== 1 || hitung('sama') !== 2 || hitung('beda') !== 2) masalah.push('komposisi petunjuk bukan 1 langsung/2 sama/2 berbeda');
    // "Semua rantai relasi harus tersambung ke informasi yang menentukan nama ruangan" (§2). Empat relasi yang menyambungkan
    // lima orang berarti strukturnya pohon: tidak ada relasi ganda/berputar, dan setiap kartu dipakai dalam rantai penalaran.
    // Catatan: syarat "tanpa satu petunjuk pun jawaban tidak lagi tunggal" sengaja TIDAK dipakai — contoh sumber pada blueprint
    // sendiri tidak memenuhinya karena batas tiga orang dapat menggantikan satu relasi.
    if (!tersambung(item)) masalah.push('rantai relasi tidak tersambung ke penetapan ruangan');
    return masalah;
  },

  bahas,
  sidik,
};

