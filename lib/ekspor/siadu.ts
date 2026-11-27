import { bangkitkan } from '../core/engine';
import { familyById } from '../core/registry';
import type { Soal } from '../core/types';
import type { PilihanGandaItem } from '../core/pilihan-ganda';
import { chapterById, NAMA_SUBTES, TES } from '../data/chapters';
import type { BadgesItem, Peringkat } from '../deduktif/badges/model';
import type { CalendarItem } from '../deduktif/calendar/model';
import type { Alokasi, RoomItem } from '../deduktif/room/model';
import { jamTL, type TimelineItem } from '../deduktif/timeline/model';
import { jam as jamTS, type Susunan, type TimeslotItem } from '../deduktif/timeslot/model';
import { TAMPILAN_DL, geometriTampilan, type DragLineItem } from '../induktif/drag-line/pola';
import { geometri, NAMA_WARNA, type Frame } from '../induktif/fill-shape/geometri';
import type { FillShapeItem } from '../induktif/fill-shape/pola';
import type { HasilSusun, Paket, SlotPaket } from '../paket/susun';
import { gambarPembahasan } from '../visual';

// Naskah Word input SiAdu (Auto Input). Format mengikuti template SiAdu yang dipakai Tahap 1, SKD, dan UTBK:
//   Soal N · Category · Lesson · Chapter (tebal) · Tingkat Kesulitan · Bentuk Soal · teks soal · A.–E. · Jawaban · Pembahasan
// Nama Category/Lesson/Chapter/Bentuk Soal diambil dari Mapping (lib/data/chapters.ts).
//
// Bentuk yang punya template importir: Option New (Bahasa Inggris, PSJK) dan Logical Ranking (Badges, tabel Nama | Deskripsi |
// Gambar | Posisi Urut). Enam bentuk interaktif lain (Fill Shape, Node Arrow Navigation, Calendar Date Selection, Place and
// Room Allocations, Timeline Scheduling, Timeslot Scheduling) belum punya template, jadi ditulis ke berkas "usulan" terpisah:
// struktur yang sama dengan tabel data dan kunci, untuk input manual atau sampai format resmi SiAdu-nya diketahui.
// Importir membaca semua teks setelah "Pembahasan:" sampai "Soal N" berikutnya, jadi satu berkas = satu paket × satu subtes.

export const BENTUK_SIADU_DIDUKUNG = ['Option New', 'Logical Ranking'];
const TINGKAT_SIADU: Record<string, string> = { dasar: 'Mudah', menengah: 'Sedang', menantang: 'Sulit' };
const HURUF = 'ABCDE';

export type Run = { teks: string; tebal?: boolean; miring?: boolean };
export type Sel = { teks?: string; gambar?: string; tengah?: boolean };
export type Blok =
  /** `gantung`: paragraf berawalan nomor/huruf ("1. ", "A. ") dengan indentasi gantung, tampil sebagai butir daftar. */
  | { t: 'p'; runs: Run[]; ukuran?: number; warna?: string; gantung?: boolean }
  | { t: 'tabel'; kepala: string[]; baris: Sel[][]; lebar?: number[] }
  /** Visual pembahasan (SVG); diubah ke PNG saat berkas Word disusun. `alt` dipakai bila gambar tidak dapat dibuat. */
  | { t: 'gambar'; svg: string; lebar: number; tinggi: number; alt: string };

export interface DokumenSiadu {
  nama: string;
  judul: string;
  paket: string;
  subtes: string;
  usulan: boolean;
  jumlahSoal: number;
  blok: Blok[];
}

const p = (teks: string, o: Omit<Run, 'teks'> = {}): Blok => ({ t: 'p', runs: [{ teks, ...o }] });
const slug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function bangun(s: SlotPaket): Soal | null {
  if (!s.uid || !s.familyId || !s.seed) return null;
  try { return bangkitkan(familyById(s.familyId), s.seed); } catch { return null; }
}

/**
 * Pembahasan peserta dengan urutan yang sama seperti di aplikasi (komponen Pembahasan): jawaban, Konsep, Kata kunci, langkah
 * bernomor, visual, alasan opsi salah, cara cepat. Nomor langkah ditulis sebagai teks ("1. ", "2. ") agar tetap terbaca oleh
 * importir yang hanya mengambil teks; paragrafnya diberi indentasi gantung supaya tampil sebagai daftar poin di Word.
 * Sumber penyusunan tidak dicetak. Kelengkapannya diperiksa `periksaPembahasanWord` pada `npm run verify`.
 */
export function blokPembahasan(soal: Soal): Blok[] {
  const b = soal.pembahasan;
  const out: Blok[] = [p(b.jawaban, { tebal: true })];
  if (b.konsep) out.push({ t: 'p', runs: [{ teks: 'Konsep: ', tebal: true }, { teks: b.konsep }] });
  if (b.kataKunci) out.push({ t: 'p', runs: [{ teks: 'Kata kunci: ', tebal: true }, { teks: b.kataKunci }] });
  b.langkah.forEach((l, i) => out.push({ t: 'p', runs: [{ teks: `${i + 1}. ${l.teks}` }], gantung: true }));
  for (const g of gambarPembahasan(soal)) { out.push(p(`Gambar: ${g.judul}`, { miring: true })); out.push({ t: 'gambar', svg: g.svg, lebar: g.lebar, tinggi: g.tinggi, alt: g.alt }); }
  if (b.opsiSalah?.length) { out.push(p('Alasan opsi salah:', { tebal: true })); for (const t of b.opsiSalah) out.push({ t: 'p', runs: [{ teks: t }], gantung: true }); }
  if (b.caraCepat) out.push({ t: 'p', runs: [{ teks: 'Cara cepat: ', tebal: true }, { teks: b.caraCepat }] });
  return out;
}

/** Bagian pembahasan yang sudah ditulis ke Word. Bagian baru pada tipe Pembahasan harus ditambahkan di sini dan di blokPembahasan. */
const BAGIAN_WORD = ['jawaban', 'konsep', 'kataKunci', 'langkah', 'opsiSalah', 'caraCepat'];

/**
 * Pemeriksaan kelengkapan pembahasan Word terhadap isi pembahasan yang tampil di aplikasi: setiap bagian yang terisi harus
 * muncul (Konsep, Kata kunci, setiap langkah bernomor berurutan dengan indentasi gantung, setiap alasan opsi salah, cara cepat,
 * dan setiap visual). Bagian pembahasan yang belum dikenal Word ikut dilaporkan, supaya bagian baru tidak hilang dari unduhan.
 * Kosong bila lengkap. `blok` dapat diganti untuk menguji pemeriksaan ini sendiri.
 */
export function periksaPembahasanWord(soal: Soal, blok: Blok[] = blokPembahasan(soal)): string[] {
  const b = soal.pembahasan;
  const m: string[] = [];
  const paragraf = blok.flatMap((x) => (x.t === 'p' ? [{ teks: x.runs.map((r) => r.teks).join(''), gantung: !!x.gantung, tebal: !!x.runs[0]?.tebal }] : []));
  const ada = (teks: string, o: { gantung?: boolean } = {}) => paragraf.some((x) => x.teks === teks && (!o.gantung || x.gantung));
  for (const [k, v] of Object.entries(b)) {
    if (v === undefined || v === '' || (Array.isArray(v) && !v.length)) continue;
    if (!BAGIAN_WORD.includes(k)) m.push(`bagian pembahasan "${k}" tidak ditulis ke Word`);
  }
  if (paragraf[0]?.teks !== b.jawaban || !paragraf[0]?.tebal) m.push('jawaban tidak menjadi baris pertama yang tebal');
  if (b.konsep && !ada(`Konsep: ${b.konsep}`)) m.push('Konsep tidak ada di Word');
  if (b.kataKunci && !ada(`Kata kunci: ${b.kataKunci}`)) m.push('Kata kunci tidak ada di Word');
  b.langkah.forEach((l, i) => { if (!ada(`${i + 1}. ${l.teks}`, { gantung: true })) m.push(`langkah ${i + 1} tidak bernomor atau tidak ada di Word`); });
  for (const t of b.opsiSalah ?? []) if (!ada(t, { gantung: true })) m.push(`alasan opsi salah "${t.slice(0, 40)}" tidak ada di Word`);
  if (b.caraCepat && !ada(`Cara cepat: ${b.caraCepat}`)) m.push('Cara cepat tidak ada di Word');
  const nGambar = gambarPembahasan(soal).length;
  if (blok.filter((x) => x.t === 'gambar').length !== nGambar) m.push(`visual di Word tidak sama dengan aplikasi (${nGambar} gambar)`);
  return m;
}

function badanPg(it: PilihanGandaItem, kunci: string): Blok[] {
  const out: Blok[] = [];
  if (it.instruksi) out.push(p(it.instruksi, { miring: true }));
  if (it.bacaan) {
    if (it.bacaan.judul) out.push(p(it.bacaan.judul, { tebal: true }));
    for (const t of it.bacaan.paragraf) out.push(p(t));
  }
  if (it.pertanyaan) out.push(p(it.pertanyaan));
  if (it.stimulus.length) {
    out.push({ t: 'p', runs: it.stimulus.map((x) => (x.gaya === 'kosong' ? { teks: '______' } : x.gaya === 'miring' ? { teks: x.teks, miring: true } : { teks: x.teks })) });
  }
  // fragmen Arrangement memakai "(A)" agar tidak terbaca sebagai pilihan jawaban "A."
  for (const f of it.fragmen ?? []) out.push(p(`(${f.label}) ${f.teks}`));
  for (const o of it.opsi) out.push(p(`${o.label}. ${o.teks}`));
  out.push(p(`Jawaban: ${kunci}`));
  return out;
}

function badanBadges(it: BadgesItem, kunci: Peringkat, fotoDasar: string): Blok[] {
  const out: Blok[] = it.instruksi.map((t) => p(t));
  out.push({
    t: 'tabel', kepala: ['Nama', 'Deskripsi', 'Gambar', 'Posisi Urut'], lebar: [1.1, 4.6, 1.1, 1.2],
    baris: it.orang.map((o) => [
      { teks: o.nama },
      // SiAdu menolak opsi tanpa deskripsi; kartu tanpa petunjuk diberi kalimat netral
      { teks: o.petunjuk.length ? o.petunjuk.join(' ') : `Tidak ada petunjuk tentang ${o.nama}.` },
      o.foto ? { gambar: `${fotoDasar}/tahap-1/bank_aset_badges/${o.foto}` } : { teks: '' },
      { teks: String(kunci[o.id]), tengah: true },
    ]),
  });
  out.push(p('Jawaban:'));
  return out;
}

// ─────────── usulan untuk bentuk interaktif tanpa template importir ───────────
const warna = (w: number) => NAMA_WARNA[w] ?? String(w);

function badanFillShape(it: FillShapeItem, kunci: Frame): Blok[] {
  const g = geometri(it.geometri);
  return [
    p('Amati perubahan warna dari Gambar 1 sampai Gambar 4, lalu tentukan warna setiap bidang pada Gambar 5.'),
    p(`Pengaturan: Bentuk ${g.nama}; ${g.bidang.length} bidang; warna putih, hijau, ungu`),
    { t: 'tabel', kepala: ['Bidang', 'Gambar 1', 'Gambar 2', 'Gambar 3', 'Gambar 4', 'Kunci Gambar 5'],
      baris: g.bidang.map((b, i) => [{ teks: `${i + 1}. ${b.nama}` }, ...it.frame.map((f) => ({ teks: warna(f[i]) })), { teks: warna(kunci[i]), tengah: true }]) },
    p(`Jawaban: ${kunci.map((w, i) => `${i + 1} ${warna(w)}`).join('; ')}`),
  ];
}

function badanDragLine(it: DragLineItem, kunci: string[]): Blok[] {
  const kode = (id: string) => it.simpul.find((s) => s.id === id)!.kode;
  return [
    p('Tarik garis dari simpul terakhir yang tersambung ke simpul berikutnya sampai semua simpul terpakai tepat sekali. Garis awalan sudah dikunci.'),
    p(`Pengaturan: Kanvas ${it.lebar} × ${it.tinggi}; awalan dikunci ${it.awalan.map(kode).join(' → ')}`),
    p(`Geometri: jari-jari simpul ${TAMPILAN_DL.jariJariSimpul}; tebal garis ${TAMPILAN_DL.tebalGaris}; area sentuh ${TAMPILAN_DL.areaSentuh}; jarak ruas terdekat ke simpul lain ${geometriTampilan(it, kunci).jarakRuasMinimum}`),
    { t: 'tabel', kepala: ['Simpul', 'Kode', 'X', 'Y', 'Urutan Kunci'],
      baris: it.simpul.map((s) => [{ teks: s.id }, { teks: s.kode }, { teks: String(s.x) }, { teks: String(s.y) }, { teks: String(kunci.indexOf(s.id) + 1), tengah: true }]) },
    p(`Jawaban: ${kunci.map(kode).join(' → ')}`),
  ];
}

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
function badanCalendar(it: CalendarItem, kunci: number[]): Blok[] {
  return [
    ...it.paragraf.map((t) => p(t)),
    p(it.pertanyaan),
    p(`Pengaturan: ${it.kalender.jumlahHari} hari; tanggal 1 jatuh pada hari ${HARI[it.kalender.hariPertama]}; maksimal ${it.maksPilihan} tanggal dipilih`),
    { t: 'tabel', kepala: ['Nama', 'Petunjuk'], baris: it.orang.map((o) => [{ teks: o.nama }, { teks: o.petunjuk.join(' ') }]) },
    p(`Jawaban: ${kunci.join(', ')}`),
  ];
}

function badanRoom(it: RoomItem, kunci: Alokasi): Blok[] {
  const ruang = (id: string) => it.ruang.find((r) => r.id === id)?.nama ?? id;
  return [
    ...it.instruksi.map((t) => p(t)),
    p(`Pengaturan: Ruangan ${it.ruang.map((r) => r.nama).join(', ')}${it.fasilitas?.length ? `; area lain ${it.fasilitas.map((f) => f.nama).join(', ')}` : ''}`),
    { t: 'tabel', kepala: ['Nama', 'Petunjuk', 'Kunci Ruangan'], baris: it.orang.map((o) => [{ teks: o.nama + (o.tag ? ` (${o.tag})` : '') }, { teks: o.petunjuk.join(' ') }, { teks: ruang(kunci[o.id]), tengah: true }]) },
    p(`Jawaban: ${it.ruang.map((r) => `${r.nama}: ${it.orang.filter((o) => kunci[o.id] === r.id).map((o) => o.nama).join(', ') || '-'}`).join('; ')}`),
  ];
}

function badanTimeline(it: TimelineItem, kunci: number[]): Blok[] {
  const urut = [...kunci].sort((a, b) => a - b);
  const waktu = (m: number, d: number) => `${jamTL(m)}–${jamTL(m + d)}`;
  return [
    ...it.paragraf.map((t) => p(t)),
    p(it.pertanyaan),
    p('Pengaturan: 18 kotak setengah jam, pukul 09.00–18.00'),
    { t: 'tabel', kepala: ['Baris', 'Kegiatan', 'Waktu', 'Dapat Digeser'],
      baris: it.baris.flatMap((b) => b.kegiatan.map((k) => [{ teks: b.nama }, { teks: k.nama }, { teks: waktu(k.mulai, k.durasi) }, { teks: k.bisaGeser ? 'Ya' : 'Tidak', tengah: true }])) },
    p(`Jawaban: ${urut.length ? `${jamTL(urut[0])}–${jamTL(urut[urut.length - 1] + 1)} (kotak ${urut.map((k) => k + 1).join(', ')})` : '-'}`),
  ];
}

function badanTimeslot(it: TimeslotItem, kunci: Susunan): Blok[] {
  return [
    ...it.paragraf.map((t) => p(t)),
    p('Pengaturan: kotak setengah jam mulai pukul 09.00'),
    { t: 'tabel', kepala: ['Kegiatan', 'Durasi', 'Jenis', 'Kunci Waktu'],
      baris: [
        ...it.opsi.map((o) => [{ teks: o.nama }, { teks: `${o.durasi * 30} menit` }, { teks: 'opsi' }, { teks: `${jamTS(kunci[o.id])}–${jamTS(kunci[o.id] + o.durasi)}`, tengah: true }]),
        ...it.tetap.map((t) => [{ teks: t.nama }, { teks: `${t.durasi * 30} menit` }, { teks: 'tetap' }, { teks: `${jamTS(t.mulai)}–${jamTS(t.mulai + t.durasi)}`, tengah: true }]),
      ] },
    p(`Jawaban: ${it.opsi.map((o) => `${o.nama} ${jamTS(kunci[o.id])}`).join('; ')}`),
  ];
}

/** Badan soal sesuai jenis item; null bila jenis belum dikenal. */
function badanSoal(soal: Soal, fotoDasar: string): Blok[] | null {
  const it = soal.item as { jenis: string };
  switch (it.jenis) {
    case 'pilihan-ganda': return badanPg(soal.item as PilihanGandaItem, soal.jawaban as string);
    case 'logical-ranking': return badanBadges(soal.item as BadgesItem, soal.jawaban as Peringkat, fotoDasar);
    case 'fill-shape': return badanFillShape(soal.item as FillShapeItem, soal.jawaban as Frame);
    case 'drag-line': return badanDragLine(soal.item as DragLineItem, soal.jawaban as string[]);
    case 'calendar-date': return badanCalendar(soal.item as CalendarItem, soal.jawaban as number[]);
    case 'room-allocation': return badanRoom(soal.item as RoomItem, soal.jawaban as Alokasi);
    case 'timeline': return badanTimeline(soal.item as TimelineItem, soal.jawaban as number[]);
    case 'timeslot': return badanTimeslot(soal.item as TimeslotItem, soal.jawaban as Susunan);
    default: return null;
  }
}

function blokSoal(no: number, s: SlotPaket, soal: Soal, fotoDasar: string): Blok[] | null {
  const c = chapterById(s.chapterId);
  const badan = badanSoal(soal, fotoDasar);
  if (!badan) return null;
  return [
    p(`Soal ${no}`, { tebal: true }),
    p(`Category: ${c.category}`, { tebal: true }),
    p(`Lesson: ${c.lesson}`, { tebal: true }),
    p(`Chapter: ${c.chapter}`, { tebal: true }),
    p(`Tingkat Kesulitan: ${TINGKAT_SIADU[s.tingkat ?? ''] ?? 'Sedang'}`),
    p(`Bentuk Soal: ${c.bentuk}`),
    p(''),
    ...badan,
    p('Pembahasan:', { tebal: true }),
    ...blokPembahasan(soal),
    p(''),
  ];
}

/**
 * Naskah SiAdu untuk paket terpilih: satu berkas per paket × subtes untuk bentuk yang punya template importir, ditambah
 * berkas "usulan" bila subtes itu memuat bentuk interaktif lain. `fotoDasar` = alamat dasar situs (basePath) untuk foto Badges.
 */
export function dokumenSiadu(h: HasilSusun, paketIds: string[] | null, fotoDasar = ''): DokumenSiadu[] {
  const hasil: DokumenSiadu[] = [];
  for (const pk of h.paket.filter((x: Paket) => !paketIds || paketIds.includes(x.id))) {
    for (const b of pk.bagian) {
      const kelompok = { siadu: [] as SlotPaket[], usulan: [] as SlotPaket[] };
      for (const s of b.slot) (BENTUK_SIADU_DIDUKUNG.includes(chapterById(s.chapterId).bentuk) ? kelompok.siadu : kelompok.usulan).push(s);
      for (const jenis of ['siadu', 'usulan'] as const) {
        const slot = kelompok[jenis].filter((s) => s.uid);
        if (!slot.length) continue;
        const usulan = jenis === 'usulan';
        const judul = `${pk.nama} · ${NAMA_SUBTES[b.subtes]}`;
        const blok: Blok[] = [
          { t: 'p', runs: [{ teks: `${TES} — ${judul}`, tebal: true }], ukuran: 15 },
          { t: 'p', runs: [{ teks: usulan
            ? 'USULAN FORMAT — bentuk soal interaktif ini belum punya template Auto Input SiAdu. Data dan kunci ditulis dalam tabel untuk input manual; jangan diunggah ke importir sebelum format resminya ditetapkan.'
            : `Format input Word SiAdu (Auto Input) · ${slot.length} soal · benih ${h.benih}. Bentuk Soal: ${[...new Set(slot.map((s) => chapterById(s.chapterId).bentuk))].join(', ')}.`, miring: true }], warna: usulan ? 'A33A2D' : '667089' },
          p(''),
        ];
        let no = 0;
        for (const s of slot) {
          const soal = bangun(s);
          if (!soal) continue;
          const isi = blokSoal(no + 1, s, soal, fotoDasar);
          if (!isi) continue;
          no++;
          blok.push(...isi);
        }
        hasil.push({
          nama: `${slug(pk.id)}-${slug(b.subtes)}-${usulan ? 'usulan' : 'siadu'}.docx`,
          judul, paket: pk.nama, subtes: NAMA_SUBTES[b.subtes], usulan, jumlahSoal: no, blok,
        });
      }
    }
  }
  return hasil;
}

/** Ubah satu dokumen menjadi berkas .docx (Times New Roman 12 pt, spasi 1,5, seperti dokumen SiAdu SKD/UTBK). */
export async function docxSiadu(
  d: DokumenSiadu,
  muatGambar: (src: string) => Promise<Uint8Array | null>,
  /** Ubah SVG visual pembahasan menjadi PNG (browser: canvas; Node: sharp). */
  svgKePng?: (svg: string, lebar: number, tinggi: number) => Promise<Uint8Array | null>,
): Promise<Uint8Array> {
  const D = await import('docx');
  const runs = (rs: Run[], ukuran?: number, warna?: string) => rs.map((r) => new D.TextRun({ text: r.teks, bold: r.tebal, italics: r.miring, size: ukuran ? ukuran * 2 : undefined, color: warna }));
  const anak: (InstanceType<typeof D.Paragraph> | InstanceType<typeof D.Table>)[] = [];
  for (const b of d.blok) {
    if (b.t === 'p') { anak.push(new D.Paragraph({ children: runs(b.runs, b.ukuran, b.warna), ...(b.gantung ? { indent: { left: 360, hanging: 360 } } : {}) })); continue; }
    if (b.t === 'gambar') {
      const png = svgKePng ? await svgKePng(b.svg, b.lebar, b.tinggi) : null;
      const w = Math.min(600, b.lebar);
      anak.push(new D.Paragraph({ children: png
        ? [new D.ImageRun({ type: 'png', data: png, transformation: { width: Math.round(w), height: Math.round((w * b.tinggi) / b.lebar) }, altText: { name: 'Visual pembahasan', title: 'Visual pembahasan', description: b.alt } })]
        : [new D.TextRun({ text: b.alt, italics: true })] }));
      continue;
    }
    const total = (b.lebar ?? b.kepala.map(() => 1)).reduce((a, x) => a + x, 0);
    const lebar = (i: number) => Math.round(((b.lebar?.[i] ?? 1) / total) * 9000);
    const sel = async (s: Sel, i: number, kepala = false) => {
      const isi: (InstanceType<typeof D.TextRun> | InstanceType<typeof D.ImageRun>)[] = [];
      if (s.gambar) {
        const data = await muatGambar(s.gambar);
        if (data) isi.push(new D.ImageRun({ type: 'png', data, transformation: { width: 48, height: 48 } }));
        else isi.push(new D.TextRun({ text: s.gambar }));
      } else isi.push(new D.TextRun({ text: s.teks ?? '', bold: kepala }));
      return new D.TableCell({ width: { size: lebar(i), type: D.WidthType.DXA }, children: [new D.Paragraph({ children: isi, alignment: s.tengah || kepala ? D.AlignmentType.CENTER : undefined })] });
    };
    const baris = [
      new D.TableRow({ tableHeader: true, children: await Promise.all(b.kepala.map((k, i) => sel({ teks: k }, i, true))) }),
      ...(await Promise.all(b.baris.map(async (r) => new D.TableRow({ cantSplit: true, children: await Promise.all(r.map((s, i) => sel(s, i))) })))),
    ];
    anak.push(new D.Table({ rows: baris, width: { size: 9000, type: D.WidthType.DXA } }));
  }
  const doc = new D.Document({
    creator: 'Generator Soal OJK PCAM Tahap 2',
    title: d.judul,
    styles: { default: { document: { run: { font: 'Times New Roman', size: 24 }, paragraph: { spacing: { line: 360, after: 60 } } } } },
    sections: [{ children: anak }],
  });
  const blob = await D.Packer.toBlob(doc);
  return new Uint8Array(await blob.arrayBuffer());
}
