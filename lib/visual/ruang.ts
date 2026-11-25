import { divisiOrang, durasiOrang, ruangSebelah, type Alokasi, type RoomItem } from '../deduktif/room/model';
import { C, bungkus, dokumen, kotak, teks, teksBaris, type GambarPembahasan } from './alat';

// Visual pembahasan Room (QC 2 R02): denah dengan penempatan akhir, lalu tabel penyaringan orang × ruangan beserta alasan
// gugurnya. Batas hunian ruangan adalah kendali internal (QC T05), jadi tidak pernah ditulis di sini.

const namaArea = (it: RoomItem, id: string) => [...it.ruang, ...(it.fasilitas ?? [])].find((x) => x.id === id)?.nama ?? id;
const keterangan = (it: RoomItem, id: string) => {
  const jam = durasiOrang(it.kendala, id), div = divisiOrang(it.kendala, id);
  return jam ? `${jam} jam` : div ?? '';
};

function denah(it: RoomItem, a: Alokasi): GambarPembahasan {
  const W = 700;
  const area = it.denah ?? it.ruang.map((r, i) => ({ id: r.id, x: i, y: 0, w: 1, h: 1 }));
  const mx = Math.max(...area.map((d) => d.x + d.w)), my = Math.max(...area.map((d) => d.y + d.h));
  const sx = (W - 20) / mx;
  const isiMaks = Math.max(1, ...it.ruang.map((r) => it.orang.filter((o) => a[o.id] === r.id).length));
  const sy = it.denah ? Math.max(92, 46 + isiMaks * 26) : 46 + isiMaks * 26 + (it.kendala.some((k) => k.jenis === 'maks-jam') ? 22 : 0);
  const maksJam = it.kendala.find((k) => k.jenis === 'maks-jam') as { jam: number } | undefined;
  let s = '';
  for (const d of area) {
    const x = 10 + d.x * sx, y = 10 + d.y * sy, w = d.w * sx, h = d.h * sy;
    const ruang = it.ruang.some((r) => r.id === d.id);
    const orang = it.orang.filter((o) => a[o.id] === d.id);
    s += kotak(x + 3, y + 3, w - 6, h - 6, { isi: !ruang ? '#f3f4f6' : orang.length ? '#ffffff' : '#fafbfe', garis: ruang ? C.tinta : C.abu, tebal: ruang ? 1.8 : 1, sudut: 6, ...(ruang ? {} : { putus: '5 4' }) });
    s += teks(x + w / 2, y + 24, namaArea(it, d.id), { rata: 'middle', tebal: true, ukuran: 13, warna: ruang ? C.teks : C.abu });
    orang.forEach((o, i) => {
      const tetap = it.kendala.some((k) => k.jenis === 'di' && k.orang === o.id && k.ruang === d.id);
      const ket = keterangan(it, o.id);
      s += kotak(x + 14, y + 34 + i * 26, w - 28, 22, { isi: tetap ? C.oranyeMuda : C.biruMuda, garis: tetap ? C.oranye : C.biru, sudut: 4 });
      s += teks(x + w / 2, y + 49 + i * 26, `${o.nama}${ket ? ` (${ket})` : ''}`, { rata: 'middle', ukuran: 12, tebal: true });
    });
    if (ruang && !orang.length) s += teks(x + w / 2, y + 52, 'kosong', { rata: 'middle', ukuran: 11, warna: C.abu });
    if (ruang && maksJam) {
      const total = orang.reduce((q, o) => q + durasiOrang(it.kendala, o.id), 0);
      s += teks(x + w / 2, y + h - 12, `Total ${total} jam dari ${maksJam.jam} jam`, { rata: 'middle', ukuran: 11.5, tebal: true, warna: C.hijau });
    }
  }
  const h = 20 + my * sy + 20;
  s += teks(12, h - 8, 'Kotak bergaris cokelat = orang yang ruangannya ditetapkan kartu; kotak biru = ditempatkan dari petunjuk lain.', { ukuran: 11, warna: C.abu });
  const uraian = it.ruang.map((r) => `${r.nama}: ${it.orang.filter((o) => a[o.id] === r.id).map((o) => o.nama).join(', ') || 'kosong'}`).join('; ');
  return { id: 'denah', judul: 'Denah penempatan akhir', alt: `${uraian}.`, lebar: W, tinggi: Math.ceil(h), svg: dokumen(W, h, s, 'Denah penempatan akhir') };
}

/** Alasan singkat orang `o` tidak berada di ruangan `r`, dibaca dari petunjuk dan penempatan akhir. */
function alasan(it: RoomItem, a: Alokasi, o: string, r: string): string {
  const nama = (id: string) => it.orang.find((x) => x.id === id)!.nama;
  const isi = it.orang.filter((x) => x.id !== o && a[x.id] === r).map((x) => x.id);
  for (const k of it.kendala) {
    if (k.jenis === 'di' && k.orang === o) return `ditetapkan di ${namaArea(it, k.ruang)}`;
    if (k.jenis === 'tidak-sebelah' && k.orang === o && ruangSebelah(it, k.fasilitas).includes(r)) return `sebelah ${namaArea(it, k.fasilitas)}`;
  }
  for (const k of it.kendala) {
    if (k.jenis === 'ruang-cadangan' && k.ruang === r && divisiOrang(it.kendala, o) !== k.divisi) return `hanya divisi ${k.divisi}`;
    if (k.jenis === 'sama' && (k.orang === o || k.dengan === o)) { const q = k.orang === o ? k.dengan : k.orang; if (a[q] !== r) return `satu ruangan dengan ${nama(q)}`; }
    if (k.jenis === 'beda' && (k.orang === o || k.dengan === o)) { const q = k.orang === o ? k.dengan : k.orang; if (a[q] === r) return `berbeda dari ${nama(q)}`; }
  }
  for (const k of it.kendala) {
    if (k.jenis === 'sendirian' && isi.includes(k.orang)) return `${nama(k.orang)} harus sendirian`;
    if (k.jenis === 'sendirian' && k.orang === o && isi.length) return `sudah berisi ${nama(isi[0])}`;
    if (k.jenis === 'tanpa-campur') { const q = isi.find((x) => divisiOrang(it.kendala, x) !== divisiOrang(it.kendala, o)); if (q) return `berisi divisi ${divisiOrang(it.kendala, q)}`; }
    if (k.jenis === 'maks-jam') {
      const total = isi.reduce((s, x) => s + durasiOrang(it.kendala, x), 0) + durasiOrang(it.kendala, o);
      if (total > k.jam) return `total menjadi ${total} jam`;
      return 'pembagian jam lain tidak muat';
    }
  }
  if (it.kendala.some((k) => k.jenis === 'ruang-cadangan' && k.ruang === r)) return 'masih ada ruang biasa';
  return 'tidak memenuhi semua petunjuk';
}

function tabel(it: RoomItem, a: Alokasi): GambarPembahasan {
  const kiri = 232, kolom = Math.max(112, Math.floor((720 - kiri - 12) / it.ruang.length));
  const W = kiri + kolom * it.ruang.length + 12, A = 30, B = 50;
  let s = teks(10, 20, 'Orang dan petunjuk', { tebal: true });
  it.ruang.forEach((r, i) => { s += teks(kiri + i * kolom + kolom / 2, 20, r.nama, { tebal: true, rata: 'middle', ukuran: 11.5 }); });
  it.orang.forEach((o, i) => {
    const y = A + i * B;
    const ket = keterangan(it, o.id);
    s += kotak(6, y, W - 12, B, { isi: i % 2 ? '#ffffff' : C.redup, garis: C.garis });
    s += teks(12, y + 17, `${o.nama}${ket ? ` (${ket})` : ''}`, { tebal: true });
    s += teksBaris(12, y + 31, bungkus(o.petunjuk.join(' '), 44, 2), 12, { ukuran: 9.5, warna: C.abu });
    it.ruang.forEach((r, j) => {
      const x = kiri + j * kolom + kolom / 2;
      if (a[o.id] === r.id) { s += kotak(x - kolom / 2 + 6, y + 7, kolom - 12, B - 14, { isi: C.biruMuda, garis: C.biru, tebal: 2, sudut: 5 }) + teks(x, y + 30, '✓ di sini', { rata: 'middle', tebal: true, warna: C.biru }); return; }
      s += teks(x, y + 18, '×', { rata: 'middle', tebal: true, ukuran: 14, warna: C.merah });
      s += teksBaris(x, y + 31, bungkus(alasan(it, a, o.id, r.id), Math.floor(kolom / 5.6), 2), 11, { rata: 'middle', ukuran: 9.5, warna: C.teks });
    });
  });
  const h = A + it.orang.length * B + 8;
  return { id: 'penyaringan', judul: 'Tabel penyaringan ruangan', alt: `${it.orang.map((o) => `${o.nama} di ${namaArea(it, a[o.id])}`).join('; ')}.`, lebar: W, tinggi: h, svg: dokumen(W, h, s, 'Tabel penyaringan ruangan') };
}

export function visualRuang(it: RoomItem, a: Alokasi): GambarPembahasan[] {
  return [denah(it, a), tabel(it, a)];
}
