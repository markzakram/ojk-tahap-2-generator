import type { Rng } from '../../core/rng';
import type { Family, Label, LangkahPembahasan, Pembahasan } from '../../core/types';
import { chapterById } from '../../data/chapters';
import { KONTEKS_SLOT, SET_PENGEMBANGAN, SET_RANTAI, TETAP_UMUM } from './konteks';
import {
  JUMLAH_KOTAK, celahKosong, jam, kunciSusunan, menit, pecahkanTimeslot, rentang, semuaSusunanSah,
  type KendalaSlot, type Sasaran, type Susunan, type Tetap, type TimeslotItem,
} from './model';

// Blueprint Timeslot Scheduling. Pola terverifikasi SHL (60%): P1 urutan + target sedini mungkin (deduktif.pdf hlm. 9),
// P2 tenggat + satu kegiatan terakhir (hlm. 11), P3 menunggu sumber daya (contoh 5.pdf + interaktif.mp4).
// Pola pengembangan (40%): D1 jeda pasti, D2 jendela waktu, D3 pasangan berurutan, D4 mengapit jadwal tetap, D5 selesai secepat mungkin.
//
// Cara membangun: tentukan dulu susunan jawaban (urutan waktu + celah abu-abu di antaranya), lalu tutup kotak lain dengan
// kegiatan tetap bernama sampai batas yang relevan, turunkan ketentuan dari susunan tersebut, dan biarkan solver
// membuktikan bahwa hanya satu susunan lengkap yang memenuhi semua syarat dan sasaran.

const ID = ['a', 'b', 'c', 'd'];

type Blok =
  | { jenis: 'opsi'; i: number; jeda: [number, number] }
  | { jenis: 'jangkar'; kunci: string; panjang: [number, number]; jeda: [number, number] }
  | { jenis: 'jeda-tepat'; panjang: number; putih: boolean };

interface Rancangan {
  judul: string;
  namaOpsi: string[];
  durasi: number[];
  blok: Blok[];
  /** Nama kegiatan tetap yang menjadi rujukan (jangkar). */
  jangkar: Record<string, string>;
  /** Cara menutup papan setelah kegiatan terakhir: 'putih' (sasaran mencegah pemakaian), 'tenggat', atau 'penuh' (abu-abu sampai 18.00). */
  akhir: 'putih' | 'tenggat' | 'penuh';
  poolTetap: string[];
  kendala: (ctx: { mulai: number[]; jangkar: Record<string, string>; batas: number; jeda: number }) => KendalaSlot[];
  sasaran: Sasaran;
  paragraf: (ctx: { nama: (i: number) => string; jangkar: Record<string, string>; batas: number; jeda: number; kendala: KendalaSlot[] }) => string[];
}

function bangunDari(r: Rng, rc: Rancangan): { item: TimeslotItem; jawaban: Susunan } | null {
  const abu: { mulai: number; durasi: number; jangkar?: string }[] = [];
  const mulai: number[] = new Array(4).fill(-1);
  let kursor = 0;
  let jedaTepat = 0;
  const tambahAbu = (n: number) => { if (n > 0) abu.push({ mulai: kursor, durasi: n }); kursor += n; };
  for (const b of rc.blok) {
    if (b.jenis === 'opsi') {
      tambahAbu(r.int(b.jeda[0], b.jeda[1]));
      mulai[b.i] = kursor;
      kursor += rc.durasi[b.i];
    } else if (b.jenis === 'jangkar') {
      tambahAbu(r.int(b.jeda[0], b.jeda[1]));
      const n = r.int(b.panjang[0], b.panjang[1]);
      abu.push({ mulai: kursor, durasi: n, jangkar: b.kunci });
      kursor += n;
    } else {
      jedaTepat = b.panjang;
      if (b.putih) kursor += b.panjang; else tambahAbu(b.panjang);
    }
    if (kursor > JUMLAH_KOTAK) return null;
  }
  let batas = kursor;
  if (rc.akhir === 'tenggat') { batas = Math.min(JUMLAH_KOTAK, kursor + r.pick([0, 0, 1])); tambahAbu(batas - kursor); }
  if (rc.akhir === 'penuh') { batas = JUMLAH_KOTAK; tambahAbu(batas - kursor); }
  // Setelah batas tenggat: boleh ada satu kegiatan tetap sore (seperti Rapat Unit 16.00–16.30 pada sumber); sisanya kosong.
  if (rc.akhir === 'tenggat' && JUMLAH_KOTAK - batas >= 3 && r.next() < 0.6) {
    const m = r.int(batas + 1, JUMLAH_KOTAK - 2);
    abu.push({ mulai: m, durasi: r.int(1, Math.min(2, JUMLAH_KOTAK - m)) });
  }
  // Pecah rangkaian abu-abu bukan jangkar menjadi kegiatan 30–90 menit, masing-masing bernama unik.
  const potongan: { mulai: number; durasi: number; jangkar?: string }[] = [];
  for (const a of abu) {
    if (a.jangkar) { potongan.push(a); continue; }
    let sisa = a.durasi, m = a.mulai;
    while (sisa > 0) { const n = Math.min(sisa, r.int(1, 3)); potongan.push({ mulai: m, durasi: n }); m += n; sisa -= n; }
  }
  const pakaiJangkar = new Set(Object.values(rc.jangkar));
  const pool = r.shuffle([...new Set(rc.poolTetap.filter((n) => !pakaiJangkar.has(n)))]);
  const tanpaJangkar = potongan.filter((p) => !p.jangkar).length;
  if (tanpaJangkar > pool.length) return null;
  let k = 0;
  const tetap: Tetap[] = potongan.sort((x, y) => x.mulai - y.mulai).map((p, i) => ({
    id: p.jangkar ?? `t${i + 1}`,
    nama: p.jangkar ? rc.jangkar[p.jangkar] : pool[k++],
    mulai: p.mulai,
    durasi: p.durasi,
  }));
  const kendala = rc.kendala({ mulai, jangkar: rc.jangkar, batas, jeda: jedaTepat });
  const item: TimeslotItem = {
    jenis: 'timeslot',
    judul: rc.judul,
    paragraf: rc.paragraf({ nama: (i) => rc.namaOpsi[i], jangkar: rc.jangkar, batas, jeda: jedaTepat, kendala }),
    opsi: rc.namaOpsi.map((nama, i) => ({ id: ID[i], nama, durasi: rc.durasi[i] })),
    tetap,
    kendala,
    sasaran: rc.sasaran,
  };
  const jawaban: Susunan = Object.fromEntries(ID.map((id, i) => [id, mulai[i]]));
  // Pengecoh: ubah satu–dua kegiatan tetap 30 menit (bukan jangkar) menjadi kotak kosong bila jawaban tetap tunggal dan sama.
  for (const t of r.shuffle(item.tetap.filter((t) => t.durasi === 1 && t.id.startsWith('t'))).slice(0, 2)) {
    const coba: TimeslotItem = { ...item, tetap: item.tetap.filter((x) => x !== t) };
    const sol = pecahkanTimeslot(coba);
    if (sol.length === 1 && kunciSusunan(sol[0]) === kunciSusunan(jawaban)) item.tetap = coba.tetap;
  }
  return { item, jawaban };
}

const kalimatKendala = (k: KendalaSlot, nama: (id: string) => string, tetap: (id: string) => string): string => {
  switch (k.jenis) {
    case 'sebelum': return `${nama(k.a)} selesai sebelum ${nama(k.b)} dimulai`;
    case 'langsung-setelah': return `${nama(k.b)} dimulai tepat saat ${nama(k.a)} selesai`;
    case 'jeda-tepat': return `${nama(k.b)} dimulai tepat ${menit(k.jeda)} setelah ${nama(k.a)} selesai`;
    case 'langsung-setelah-tetap': return `${nama(k.a)} dimulai tepat saat ${tetap(k.tetap)} selesai`;
    case 'langsung-sebelum-tetap': return `${nama(k.a)} selesai tepat saat ${tetap(k.tetap)} dimulai`;
    case 'setelah-tetap': return `${nama(k.a)} dimulai setelah ${tetap(k.tetap)} selesai`;
    case 'tenggat': return `semua kegiatan selesai paling lambat ${jam(k.batas)}`;
    case 'jendela': return `${nama(k.a)} berada dalam ${jam(k.mulai)}–${jam(k.selesai)}`;
    case 'terakhir': return `${nama(k.a)} selesai paling akhir`;
    case 'pertama': return `${nama(k.a)} menjadi kegiatan pertama`;
  }
};

function bahas(item: TimeslotItem, jawaban: Susunan): Pembahasan | null {
  const o = (id: string) => item.opsi.find((x) => x.id === id)!;
  const nama = (id: string) => o(id).nama;
  const namaTetap = (id: string) => item.tetap.find((t) => t.id === id)!.nama;
  const langkah: LangkahPembahasan[] = [];
  langkah.push({ teks: `Jadwal tetap (abu-abu): ${item.tetap.map((t) => `${t.nama} ${rentang(t.mulai, t.durasi)}`).join('; ')}.` });
  const tenggat = item.kendala.find((k) => k.jenis === 'tenggat') as Extract<KendalaSlot, { jenis: 'tenggat' }> | undefined;
  const celah = celahKosong(item, tenggat?.batas);
  const total = item.opsi.reduce((s, x) => s + x.durasi, 0);
  const totalCelah = celah.reduce((s, c) => s + c.panjang, 0);
  langkah.push({ teks: `Celah kosong${tenggat ? ` sebelum ${jam(tenggat.batas)}` : ''}: ${celah.map((c) => `${rentang(c.mulai, c.panjang)} (${menit(c.panjang)})`).join('; ')}.` });
  if (tenggat) langkah.push({ teks: `Total durasi keempat kegiatan ${menit(total)}; total celah sebelum tenggat ${menit(totalCelah)}${total === totalCelah ? ', jadi setiap celah harus terisi penuh dan pas dengan durasi kegiatan' : ''}.` });
  // Penempatan yang dipaksa oleh hubungan langsung dengan jadwal tetap.
  for (const k of item.kendala) {
    if (k.jenis === 'langsung-setelah-tetap') langkah.push({ teks: `${nama(k.a)} harus dimulai tepat saat ${namaTetap(k.tetap)} selesai, jadi ${nama(k.a)} ${rentang(jawaban[k.a], o(k.a).durasi)}.` });
    if (k.jenis === 'langsung-sebelum-tetap') langkah.push({ teks: `${nama(k.a)} harus selesai tepat saat ${namaTetap(k.tetap)} dimulai, jadi ${nama(k.a)} ${rentang(jawaban[k.a], o(k.a).durasi)}.` });
    if (k.jenis === 'setelah-tetap') langkah.push({ teks: `${nama(k.a)} baru boleh dimulai setelah ${namaTetap(k.tetap)} selesai (${jam(item.tetap.find((t) => t.id === k.tetap)!.mulai + item.tetap.find((t) => t.id === k.tetap)!.durasi)}).` });
    if (k.jenis === 'jendela') langkah.push({ teks: `${nama(k.a)} (${menit(o(k.a).durasi)}) harus berada di antara ${jam(k.mulai)} dan ${jam(k.selesai)}, jadi ${nama(k.a)} ${rentang(jawaban[k.a], o(k.a).durasi)}.` });
  }
  const urut = [...item.opsi].sort((x, y) => jawaban[x.id] - jawaban[y.id]);
  langkah.push({ teks: `Susunan akhir: ${urut.map((x) => `${x.nama} ${rentang(jawaban[x.id], x.durasi)}`).join('; ')}.` });
  langkah.push({ teks: `Pemeriksaan: ${item.kendala.map((k) => kalimatKendala(k, nama, namaTetap)).join('; ')} — semua terpenuhi, dan tidak ada kegiatan yang menumpuk atau menimpa jadwal tetap.` });
  const sah = semuaSusunanSah(item);
  const sa = item.sasaran;
  const teksSasaran = sa.jenis === 'sedini' ? `${nama(sa.a)} paling awal dapat dimulai ${jam(jawaban[sa.a])}, dan hanya susunan ini yang mencapainya`
    : sa.jenis === 'semua-sedini' ? 'hanya susunan ini yang tidak dapat dipercepat tanpa memperlambat kegiatan lain'
    : sa.jenis === 'selesai-sedini' ? `waktu selesai paling awal untuk seluruh rangkaian adalah ${jam(Math.max(...item.opsi.map((x) => jawaban[x.id] + x.durasi)))}, dan hanya susunan ini yang mencapainya`
    : '';
  langkah.push({ teks: sa.jenis === 'tidak-ada'
    ? `Penelusuran seluruh penempatan pada batas 30 menit hanya menyisakan susunan ini.`
    : `Penelusuran seluruh penempatan: ${sah.length} susunan memenuhi semua syarat; ${teksSasaran}.` });
  return {
    jawaban: urut.map((x) => `${x.nama} ${rentang(jawaban[x.id], x.durasi)}`).join('; '),
    langkah,
    caraCepat: tenggat
      ? 'Hitung celah kosong sebelum tenggat; jika totalnya sama dengan total durasi, cocokkan setiap kegiatan dengan celah yang panjangnya pas.'
      : 'Tempatkan dulu kegiatan yang terikat langsung pada jadwal tetap, lalu isi celah yang panjangnya pas dengan durasi kegiatan lain sesuai urutan.',
  };
}

function sidik(polaId: string) {
  return (item: TimeslotItem, jawaban: Susunan) => {
    const tetap = item.tetap.map((t) => `${t.id.startsWith('t') ? 'x' : t.id}${t.mulai}+${t.durasi}`).join(',');
    const kendala = item.kendala.map((k) => JSON.stringify(k)).sort().join(';');
    return `ts:${polaId}:${tetap}:${kendala}:${kunciSusunan(jawaban)}`;
  };
}

interface DefPola {
  id: string;
  nama: string;
  label: Label;
  sumber: string;
  ringkas: string;
  rancang: (r: Rng) => Rancangan | null;
  periksa?: (item: TimeslotItem, jawaban: Susunan) => string[];
}

function family(p: DefPola): Family<TimeslotItem, Susunan> {
  return {
    id: p.id, versi: 1, nama: p.nama, label: p.label, sumber: p.sumber, ringkas: p.ringkas,
    chapter: chapterById('timeslot-scheduling'),
    bangun(r) { const rc = p.rancang(r); return rc ? bangunDari(r, rc) : null; },
    pecahkan: pecahkanTimeslot,
    kunci: kunciSusunan,
    periksa(item, jawaban) {
      const masalah = p.periksa?.(item, jawaban) ?? [];
      if (item.opsi.length !== 4) masalah.push('jumlah opsi bukan empat');
      if (item.opsi.some((o) => o.durasi < 1 || o.durasi > 3)) masalah.push('durasi opsi di luar 30–90 menit');
      if (new Set(item.tetap.map((t) => t.nama)).size !== item.tetap.length) masalah.push('nama kegiatan tetap ganda');
      return masalah;
    },
    bahas,
    sidik: sidik(p.id),
  };
}

const pilihKonteks = (r: Rng, set: 'set1' | 'set2' | 'set3') => r.pick(KONTEKS_SLOT.filter((k) => k[set]));
const opsi = (i: number, jeda: [number, number]): Blok => ({ jenis: 'opsi', i, jeda });
const sisip = <T,>(r: Rng, xs: T[], x: T) => { const i = r.int(0, xs.length); return [...xs.slice(0, i), x, ...xs.slice(i)]; };
const PEMBUKA = 'Jadwalkan keempat kegiatan berikut pada jadwal hari ini.';

export const timeslotP1 = family({
  id: 'TS-P1', nama: 'Urutan kegiatan dan target sedini mungkin', label: 'SHL',
  sumber: 'Blueprint Timeslot §4 Pola 1 · deduktif.pdf hlm. 9',
  ringkas: 'Durasi 60+60+30+60 menit. Dua hubungan sebelum–sesudah, satu kegiatan langsung setelah kegiatan tetap, dan satu kegiatan target dijadwalkan sedini mungkin.',
  rancang(r) {
    const k = pilihKonteks(r, 'set1');
    // Peran: a = target (Demo), b → d → a berantai, c langsung setelah kegiatan tetap jangkar.
    const rantai: Blok[][] = [[opsi(1, [0, 2])], [opsi(3, [1, 2])], [opsi(0, [1, 2])]];
    const blok = sisip(r, rantai, [{ jenis: 'jangkar', kunci: 'koor', panjang: [1, 2], jeda: [0, 1] }, opsi(2, [0, 0])] as Blok[]).flat();
    return {
      judul: k.judul, namaOpsi: k.set1!, durasi: [2, 2, 1, 2], blok, jangkar: { koor: k.tetap[1] }, akhir: 'putih',
      poolTetap: [...k.tetap, ...TETAP_UMUM],
      kendala: () => [{ jenis: 'sebelum', a: 'b', b: 'd' }, { jenis: 'sebelum', a: 'd', b: 'a' }, { jenis: 'langsung-setelah-tetap', a: 'c', tetap: 'koor' }],
      sasaran: { jenis: 'sedini', a: 'a' },
      paragraf: ({ nama, jangkar }) => [
        PEMBUKA,
        `${nama(1)} harus selesai sebelum ${nama(3)} dimulai, dan ${nama(3)} harus selesai sebelum ${nama(0)} dimulai.`,
        `${nama(2)} harus langsung dimulai setelah ${jangkar.koor} selesai.`,
        `Setelah semua syarat terpenuhi, jadwalkan ${nama(0)} sedini mungkin.`,
      ],
    };
  },
});

export const timeslotP2 = family({
  id: 'TS-P2', nama: 'Semua selesai sebelum tenggat, satu kegiatan terakhir', label: 'SHL',
  sumber: 'Blueprint Timeslot §4 Pola 2 · deduktif.pdf hlm. 11',
  ringkas: 'Durasi 60+30+90+90 menit. Semua kegiatan selesai paling lambat pukul tertentu dan satu kegiatan harus selesai paling akhir.',
  rancang(r) {
    const k = pilihKonteks(r, 'set2');
    const awal = r.shuffle([0, 1, 2]);
    const blok = [...awal.map((i, j) => opsi(i, j === 0 ? [0, 2] : [1, 2])), opsi(3, [1, 2])];
    return {
      judul: k.judul, namaOpsi: k.set2!, durasi: [2, 1, 3, 3], blok, jangkar: {}, akhir: 'tenggat',
      poolTetap: [...k.tetap, ...TETAP_UMUM],
      kendala: ({ batas }) => [{ jenis: 'tenggat', batas }, { jenis: 'terakhir', a: 'd' }],
      sasaran: { jenis: 'tidak-ada' },
      paragraf: ({ nama, batas }) => [
        'Jadwalkan keempat pelatihan berikut pada jadwal hari ini.',
        `Semua pelatihan harus selesai paling lambat pukul ${jam(batas)}, dan ${nama(3)} harus selesai paling akhir.`,
      ],
    };
  },
});

export const timeslotP3 = family({
  id: 'TS-P3', nama: 'Sebagian kegiatan menunggu sumber daya', label: 'SHL',
  sumber: 'Blueprint Timeslot §4 Pola 3 · contoh 5.pdf + interaktif.mp4',
  ringkas: 'Durasi 60+60+90+90 menit. Dua kegiatan baru boleh dimulai setelah kegiatan tetap pengambilan sumber daya selesai, dua lainnya tidak bergantung. Semua kegiatan sedini mungkin.',
  rancang(r) {
    const k = pilihKonteks(r, 'set3');
    const bebas = r.shuffle([1, 3]);
    const tergantung = r.shuffle([0, 2]);
    const blok: Blok[] = [
      opsi(bebas[0], [0, 2]), opsi(bebas[1], [1, 2]),
      { jenis: 'jangkar', kunci: 'sumber', panjang: [1, 2], jeda: [0, 1] },
      opsi(tergantung[0], [0, 1]), opsi(tergantung[1], [1, 2]),
    ];
    return {
      judul: k.judul, namaOpsi: k.set3!, durasi: [2, 2, 3, 3], blok, jangkar: { sumber: k.tetap[2] }, akhir: 'putih',
      poolTetap: [...k.tetap, ...TETAP_UMUM],
      kendala: () => [{ jenis: 'setelah-tetap', a: 'a', tetap: 'sumber' }, { jenis: 'setelah-tetap', a: 'c', tetap: 'sumber' }],
      sasaran: { jenis: 'semua-sedini' },
      paragraf: ({ nama, jangkar }) => [
        PEMBUKA,
        `${nama(0)} dan ${nama(2)} baru dapat dimulai setelah ${jangkar.sumber} selesai; ${nama(1)} dan ${nama(3)} tidak bergantung pada kegiatan tersebut.`,
        'Jadwalkan setiap kegiatan sedini mungkin.',
      ],
    };
  },
});

const pengembangan = (r: Rng) => r.pick(SET_PENGEMBANGAN);
const TETAP_PENGEMBANGAN = TETAP_UMUM;
const SUMBER_D = 'Blueprint Timeslot §5 (pola pengembangan, belum terverifikasi di SHL)';

export const timeslotD1 = family({
  id: 'TS-D1', nama: 'Jeda pasti antarkegiatan', label: 'VARIASI', sumber: SUMBER_D + ' · Pengembangan 1',
  ringkas: 'Satu kegiatan dimulai tepat 30 atau 60 menit setelah kegiatan lain selesai, satu hubungan sebelum–sesudah, dan tenggat.',
  rancang(r) {
    const s = pengembangan(r);
    const ab: Blok[] = [opsi(0, [1, 2]), { jenis: 'jeda-tepat', panjang: r.pick([1, 2]), putih: r.next() < 0.5 }, opsi(1, [0, 0])];
    const blok = sisip(r, [[opsi(2, [1, 2])], [opsi(3, [1, 2])]], ab).flat();
    blok[0] = blok[0].jenis === 'opsi' ? { ...blok[0], jeda: [0, 2] } : blok[0];
    return {
      judul: s.judul, namaOpsi: s.opsi, durasi: [2, 1, 3, 3], blok, jangkar: {}, akhir: 'tenggat', poolTetap: TETAP_PENGEMBANGAN,
      kendala: ({ batas, jeda }) => [{ jenis: 'jeda-tepat', a: 'a', b: 'b', jeda }, { jenis: 'sebelum', a: 'c', b: 'd' }, { jenis: 'tenggat', batas }],
      sasaran: { jenis: 'tidak-ada' },
      paragraf: ({ nama, batas, jeda }) => [
        PEMBUKA,
        `${nama(1)} harus dimulai tepat ${menit(jeda)} setelah ${nama(0)} selesai.`,
        `${nama(2)} harus selesai sebelum ${nama(3)} dimulai.`,
        `Semua kegiatan harus selesai paling lambat pukul ${jam(batas)}.`,
      ],
    };
  },
});

export const timeslotD2 = family({
  id: 'TS-D2', nama: 'Kegiatan di dalam jendela waktu', label: 'VARIASI', sumber: SUMBER_D + ' · Pengembangan 2',
  ringkas: 'Satu kegiatan tidak boleh mulai sebelum pukul tertentu dan harus selesai paling lambat pukul tertentu; dua hubungan urutan dan tenggat.',
  rancang(r) {
    const s = pengembangan(r);
    const blok = sisip(r, [[opsi(0, [0, 2])], [opsi(1, [1, 2])], [opsi(3, [1, 2])]], [opsi(2, [1, 2])]).flat();
    return {
      judul: s.judul, namaOpsi: s.opsi, durasi: [2, 1, 3, 3], blok, jangkar: {}, akhir: 'tenggat', poolTetap: TETAP_PENGEMBANGAN,
      kendala: ({ mulai, batas }) => [
        { jenis: 'jendela', a: 'c', mulai: Math.max(0, mulai[2] - r.int(0, 1)), selesai: Math.min(JUMLAH_KOTAK, mulai[2] + 3 + r.int(0, 1)) },
        { jenis: 'sebelum', a: 'a', b: 'b' }, { jenis: 'sebelum', a: 'b', b: 'd' }, { jenis: 'tenggat', batas },
      ],
      sasaran: { jenis: 'tidak-ada' },
      paragraf: ({ nama, batas, kendala }) => {
        const j = kendala[0] as Extract<KendalaSlot, { jenis: 'jendela' }>;
        return [
          PEMBUKA,
          `${nama(2)} tidak boleh dimulai sebelum pukul ${jam(j.mulai)} dan harus selesai paling lambat pukul ${jam(j.selesai)}.`,
          `${nama(0)} harus selesai sebelum ${nama(1)} dimulai, dan ${nama(1)} harus selesai sebelum ${nama(3)} dimulai.`,
          `Semua kegiatan harus selesai paling lambat pukul ${jam(batas)}.`,
        ];
      },
    };
  },
});

export const timeslotD3 = family({
  id: 'TS-D3', nama: 'Sepasang kegiatan berurutan tanpa jeda', label: 'VARIASI', sumber: SUMBER_D + ' · Pengembangan 3',
  ringkas: 'Satu kegiatan menjadi yang pertama di antara keempat opsi dan opsi lain langsung menyusulnya; satu hubungan urutan dan tenggat.',
  rancang(r) {
    const s = pengembangan(r);
    const blok: Blok[] = [opsi(0, [0, 2]), opsi(1, [0, 0]), opsi(2, [1, 2]), opsi(3, [1, 2])];
    return {
      judul: s.judul, namaOpsi: s.opsi, durasi: [2, 1, 3, 3], blok, jangkar: {}, akhir: 'tenggat', poolTetap: TETAP_PENGEMBANGAN,
      kendala: ({ batas }) => [{ jenis: 'pertama', a: 'a' }, { jenis: 'langsung-setelah', a: 'a', b: 'b' }, { jenis: 'sebelum', a: 'c', b: 'd' }, { jenis: 'tenggat', batas }],
      sasaran: { jenis: 'tidak-ada' },
      paragraf: ({ nama, batas }) => [
        PEMBUKA,
        `${nama(0)} harus menjadi kegiatan pertama di antara keempat kegiatan ini, dan ${nama(1)} harus langsung dimulai setelah ${nama(0)} selesai.`,
        `${nama(2)} harus selesai sebelum ${nama(3)} dimulai.`,
        `Semua kegiatan harus selesai paling lambat pukul ${jam(batas)}.`,
      ],
    };
  },
});

export const timeslotD4 = family({
  id: 'TS-D4', nama: 'Dua kegiatan mengapit jadwal tetap', label: 'VARIASI', sumber: SUMBER_D + ' · Pengembangan 4',
  ringkas: 'Satu kegiatan selesai tepat saat kegiatan tetap dimulai, satu lagi dimulai tepat saat kegiatan tetap itu selesai; satu hubungan urutan.',
  rancang(r) {
    const s = pengembangan(r);
    const apit: Blok[] = [opsi(0, [1, 2]), { jenis: 'jangkar', kunci: 'apit', panjang: [1, 2], jeda: [0, 0] }, opsi(1, [0, 0])];
    const blok = sisip(r, [[opsi(2, [1, 2])], [opsi(3, [1, 2])]], apit).flat();
    return {
      judul: s.judul, namaOpsi: s.opsi, durasi: [2, 2, 3, 3], blok, jangkar: { apit: r.pick(['Rapat Data', 'Rapat Unit', 'Rapat Koordinasi']) }, akhir: 'penuh',
      poolTetap: TETAP_PENGEMBANGAN,
      kendala: () => [{ jenis: 'langsung-sebelum-tetap', a: 'a', tetap: 'apit' }, { jenis: 'langsung-setelah-tetap', a: 'b', tetap: 'apit' }, { jenis: 'sebelum', a: 'c', b: 'd' }],
      sasaran: { jenis: 'tidak-ada' },
      paragraf: ({ nama, jangkar }) => [
        PEMBUKA,
        `${nama(0)} harus selesai tepat ketika ${jangkar.apit} dimulai, dan ${nama(1)} harus langsung dimulai setelah ${jangkar.apit} selesai.`,
        `${nama(2)} harus selesai sebelum ${nama(3)} dimulai.`,
      ],
    };
  },
});

export const timeslotD5 = family({
  id: 'TS-D5', nama: 'Seluruh rangkaian selesai secepat mungkin', label: 'VARIASI', sumber: SUMBER_D + ' · Pengembangan 5',
  ringkas: 'Empat kegiatan berantai; susun agar waktu selesai kegiatan terakhir sedini mungkin.',
  rancang(r) {
    const s = r.pick(SET_RANTAI);
    const blok: Blok[] = [opsi(3, [0, 2]), opsi(2, [0, 2]), opsi(1, [0, 2]), opsi(0, [1, 2])];
    return {
      judul: s.judul, namaOpsi: s.opsi, durasi: [2, 1, 3, 3], blok, jangkar: {}, akhir: 'putih', poolTetap: TETAP_PENGEMBANGAN,
      kendala: () => [{ jenis: 'sebelum', a: 'd', b: 'c' }, { jenis: 'sebelum', a: 'c', b: 'b' }, { jenis: 'sebelum', a: 'b', b: 'a' }],
      sasaran: { jenis: 'selesai-sedini' },
      paragraf: ({ nama }) => [
        PEMBUKA,
        `${nama(3)} harus selesai sebelum ${nama(2)} dimulai, ${nama(2)} harus selesai sebelum ${nama(1)} dimulai, dan ${nama(1)} harus selesai sebelum ${nama(0)} dimulai.`,
        'Atur keempat kegiatan agar waktu selesai kegiatan terakhir sedini mungkin.',
      ],
    };
  },
});

export const TIMESLOT_FAMILIES = [timeslotP1, timeslotP2, timeslotP3, timeslotD1, timeslotD2, timeslotD3, timeslotD4, timeslotD5];
