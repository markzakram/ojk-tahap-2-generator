import type { Family, LangkahPembahasan } from '../../core/types';
import { chapterById } from '../../data/chapters';
import { NAMA_RUANGAN, daftarKata } from '../../data/nama';
import { durasiOrang, kunciAlokasi, semuaAlokasi, type Alokasi, type KendalaRuang, type RoomItem } from './model';

// Blueprint Room Allocations bagian 4 — "Pembagian ruang berdasarkan durasi rapat".
// Sumber: contoh 2.pdf hlm. 1 (Meeting Room Requirements) berisi empat orang; blueprint menyesuaikannya menjadi lima orang
// dengan mekanisme kapasitas waktu yang sama (PENYESUAIAN — jangan disebut salinan persis SHL).
// Dua ruang Barat/Timur tersedia 08.00–16.00. Tiap kartu: satu keterangan pilihan ruangan + satu durasi.
// Satu orang memerlukan ruang tertentu, lainnya boleh di ruang mana pun. Rapat bergantian tanpa jeda; total ≤ 8 jam
// dan maksimal tiga orang per ruangan. Tidak ada waktu mulai individu, rapat terpecah, atau perjalanan antar-ruang.

// Horizon sama untuk kedua ruangan (sumber: 08.00–16.00). Panjang horizon divariasikan sebagai parameter mekanisme yang sama.
const HORIZON = [
  { mulai: '08.00', selesai: '16.00', jam: 8 },
  { mulai: '09.00', selesai: '16.00', jam: 7 },
  { mulai: '08.00', selesai: '17.00', jam: 9 },
];
const KAPASITAS = 3;
const jamMaks = (item: RoomItem) => (item.kendala.find((k) => k.jenis === 'maks-jam') as { jam: number }).jam;
const RUANG = [{ id: 'r1', nama: 'Ruang Barat' }, { id: 'r2', nama: 'Ruang Timur' }];
const DURASI = [1, 2, 2, 3, 3, 3, 4, 4, 5];
const KONTEKS = ['Jadwal Ruang Rapat', 'Pembagian Ruang Rapat', 'Rapat Evaluasi Proyek'];

const kombinasi = <T,>(xs: T[], k: number): T[][] =>
  k === 0 ? [[]] : xs.flatMap((x, i) => kombinasi(xs.slice(i + 1), k - 1).map((c) => [x, ...c]));

export const roomDurasi: Family<RoomItem, Alokasi> = {
  id: 'RA-DURASI',
  versi: 1,
  nama: 'Pembagian ruang menurut durasi rapat',
  chapter: chapterById('room-allocations'),
  label: 'SHL',
  sumber: 'Blueprint Room Allocations §4 · contoh 2.pdf hlm. 1 (Meeting Room Requirements; disesuaikan menjadi lima orang)',
  ringkas: 'Lima orang dengan durasi rapat masing-masing; Ruang Barat dan Timur tersedia pada jam yang sama (sumber 08.00–16.00; divariasikan 7–9 jam). Satu orang harus di ruang tertentu. Total durasi per ruangan tidak melebihi jam tersedia; maksimal tiga orang.',

  bangun(r) {
    const h = r.pick(HORIZON);
    const nama = r.sample(NAMA_RUANGAN, 5);
    const ids = nama.map((_, i) => `o${i + 1}`);
    // Bangun dari jawaban: kelompok tiga orang dan kelompok dua orang masing-masing berjumlah pas atau kurang satu jam
    // dari jam tersedia, sehingga pembagian lain cenderung melebihi batas. Keunikan tetap dibuktikan solver.
    const isi = (n: number, target: number): number[] | null => {
      const xs = Array.from({ length: n - 1 }, () => r.pick(DURASI));
      const akhir = target - xs.reduce((s, x) => s + x, 0);
      return akhir >= 1 && akhir <= 5 ? [...xs, akhir] : null;
    };
    const trio = isi(3, h.jam - r.pick([0, 0, 1]));
    const duo = isi(2, h.jam - r.pick([0, 0, 1]));
    if (!trio || !duo) return null;
    const urut = r.shuffle(ids);
    const ruangTrio = r.pick(['r1', 'r2']);
    const jawaban: Alokasi = Object.fromEntries(urut.map((id, i) => [id, i < 3 ? ruangTrio : ruangTrio === 'r1' ? 'r2' : 'r1']));
    const jamPer: Record<string, number> = Object.fromEntries(urut.map((id, i) => [id, i < 3 ? trio[i] : duo[i - 3]]));
    const jam = ids.map((id) => jamPer[id]);
    const pemilihRuang = r.pick(ids);
    const kartu: Record<string, KendalaRuang[]> = Object.fromEntries(ids.map((id, i) => [id, [
      id === pemilihRuang ? { jenis: 'di', orang: id, ruang: jawaban[id] } : { jenis: 'bebas', orang: id },
      { jenis: 'durasi', orang: id, jam: jam[i] },
    ] as KendalaRuang[]]));
    const namaRuang = (id: string) => RUANG.find((x) => x.id === id)!.nama;
    const tampil = r.shuffle(ids);
    const item: RoomItem = {
      jenis: 'room-allocation',
      judul: r.pick(KONTEKS),
      instruksi: [
        `Ruang Barat dan Ruang Timur masing-masing tersedia pukul ${h.mulai}–${h.selesai}.`,
        'Rapat dalam satu ruangan berlangsung bergantian tanpa jeda dan harus selesai dalam jam tersebut; setiap ruangan menampung maksimal tiga orang.',
        'Bagilah kelima orang ke ruangan agar semua rapat dapat berlangsung.',
      ],
      ruang: RUANG,
      kapasitas: KAPASITAS,
      orang: tampil.map((id) => {
        const [pilihan, durasi] = kartu[id];
        const teksPilihan = pilihan.jenis === 'di' ? `Harus di ${namaRuang(pilihan.ruang)}.` : 'Boleh di ruang mana pun.';
        const j = (durasi as { jam: number }).jam;
        return { id, nama: nama[ids.indexOf(id)], petunjuk: [teksPilihan, `Rapat berlangsung ${j} jam.`], tag: `${j} jam` };
      }),
      kendala: [...tampil.flatMap((id) => kartu[id]), { jenis: 'maks-jam', jam: h.jam }],
    };
    return { item, jawaban };
  },

  pecahkan: (item) => semuaAlokasi(item),
  kunci: kunciAlokasi,

  periksa(item) {
    const masalah: string[] = [];
    if (item.orang.length !== 5) masalah.push('jumlah orang bukan lima');
    if (item.kendala.filter((k) => k.jenis === 'di').length !== 1) masalah.push('pilihan ruang tertentu bukan satu orang');
    const total = item.orang.reduce((s, o) => s + durasiOrang(item.kendala, o.id), 0);
    // Soal harus menuntut perhitungan durasi: tanpa batas jam, pembagian tidak boleh tunggal.
    if (semuaAlokasi(item, item.kendala.filter((k) => k.jenis !== 'maks-jam')).length < 2) masalah.push('batas jam tidak berfungsi');
    if (total < 13) masalah.push('total durasi terlalu longgar');
    return masalah;
  },

  bahas(item, jawaban) {
    const nama = (id: string) => item.orang.find((o) => o.id === id)!.nama;
    const jam = (id: string) => durasiOrang(item.kendala, id);
    const ids = item.orang.map((o) => o.id);
    const total = ids.reduce((s, id) => s + jam(id), 0);
    const JAM = jamMaks(item);
    const langkah: LangkahPembahasan[] = [];
    langkah.push({ teks: `Total durasi: ${ids.map(jam).join(' + ')} = ${total} jam; dua ruangan menyediakan 2 × ${JAM} = ${2 * JAM} jam.` });
    langkah.push({ teks: 'Dengan maksimal tiga orang per ruangan, satu ruangan berisi tiga orang dan ruangan lainnya dua orang.' });
    const trio = kombinasi(ids, 3).map((t) => {
      const sisa = ids.filter((id) => !t.includes(id));
      return { t, sisa, jt: t.reduce((s, id) => s + jam(id), 0), js: sisa.reduce((s, id) => s + jam(id), 0) };
    }).filter((x) => x.jt <= JAM);
    const sah = trio.filter((x) => x.js <= JAM);
    if (sah.length !== 1) return null;
    const teksTrio = (x: (typeof trio)[number]) => `${daftarKata(x.t.map(nama))} (${x.jt} jam) menyisakan ${daftarKata(x.sisa.map(nama))} (${x.js} jam${x.js > JAM ? `, melebihi ${JAM} jam` : ''})`;
    langkah.push({ teks: `Kelompok tiga orang yang totalnya tidak melebihi ${JAM} jam: ${trio.map(teksTrio).join('; ')}. Jadi satu-satunya pembagian yang sah adalah kelompok ${daftarKata(sah[0].t.map(nama))} serta kelompok ${daftarKata(sah[0].sisa.map(nama))}.` });
    const di = item.kendala.find((k) => k.jenis === 'di') as Extract<KendalaRuang, { jenis: 'di' }>;
    const namaRuang = (id: string) => item.ruang.find((x) => x.id === id)!.nama;
    const kelompok = sah[0].t.includes(di.orang) ? sah[0].t : sah[0].sisa;
    langkah.push({ teks: `${nama(di.orang)} harus di ${namaRuang(di.ruang)}, jadi ${daftarKata(kelompok.map(nama))} di ${namaRuang(di.ruang)}, sedangkan sisanya di ruangan lain.` });
    if (kelompok.some((id) => jawaban[id] !== di.ruang)) return null;
    const isi = item.ruang.map((r) => ({ r, anggota: ids.filter((id) => jawaban[id] === r.id) }));
    langkah.push({ teks: `Periksa: ${isi.map(({ r, anggota }) => `${r.nama} ${anggota.length} orang, ${anggota.reduce((s, id) => s + jam(id), 0)} jam`).join('; ')}. Semua rapat selesai dalam jam tersedia.` });
    return {
      jawaban: isi.map(({ r, anggota }) => `${r.nama}: ${daftarKata(anggota.map(nama))}`).join('; '),
      langkah,
      caraCepat: 'Cari kelompok tiga orang yang totalnya muat dalam jam tersedia dan sisanya juga muat; orang dengan pilihan ruang tetap menentukan ruangannya.',
    };
  },

  sidik(item, jawaban) {
    // Struktur = durasi per ruangan pada jawaban + ruangan dan durasi orang yang ruangnya ditetapkan (nama diabaikan).
    const jam = (id: string) => durasiOrang(item.kendala, id);
    const di = item.kendala.find((k) => k.jenis === 'di') as Extract<KendalaRuang, { jenis: 'di' }>;
    const kel = item.ruang.map((r) => item.orang.filter((o) => jawaban[o.id] === r.id).map((o) => jam(o.id) + (o.id === di.orang ? '*' : '')).sort().join('+')).sort();
    return `room-durasi:${jamMaks(item)}:${kel.join('|')}`;
  },
};
