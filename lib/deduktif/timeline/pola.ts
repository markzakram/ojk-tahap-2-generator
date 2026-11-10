import type { Rng } from '../../core/rng';
import type { Family, Label, LangkahPembahasan, Pembahasan } from '../../core/types';
import { chapterById } from '../../data/chapters';
import { daftarKata } from '../../data/nama';
import { JANJI_ANDA, KEGIATAN_RUANG, KELOMPOK_PETUGAS, KELOMPOK_RAPAT, NAMA_ORANG_TL, NAMA_RUANG_TL, NAMA_TIM_TL, RAPAT_PENJUALAN } from './konteks';
import {
  KOTAK_TL, ambangDi, blok, cekOrang, cekReservasi, jamTL, kotakAktif, kunciTL, pecahkanTimeline, petugasPerKotak, rangkaian, rentangTL, waktuRapatSah,
  type AturanTL, type BarisTL, type KegiatanTL, type TimelineItem,
} from './model';

// Blueprint Timeline Scheduling. Pola sumber SHL: pemajuan rapat tim (contoh 3.pdf), pelatihan dengan ketergantungan ruangan
// (deduktif.pdf hlm. 15–16; pembongkaran 45 menit disesuaikan menjadi 30/60 menit), dan pemenuhan petugas (hlm. 23–24).
// Pola kemungkinan (VARIASI): rapat paling akhir sebelum batas, petugas dengan ambang berubah, serta variasi durasi/jadwal.

let urutId = 0;
const idBaru = () => `k${++urutId}`;

/** Tempatkan `jumlah` kegiatan 1–3 kotak secara acak di kotak yang masih kosong dalam [lo, hi). */
function isiAcak(r: Rng, terpakai: boolean[], jumlah: number, nama: string[], bisaGeser: boolean, lo = 0, hi = KOTAK_TL): KegiatanTL[] {
  const hasil: KegiatanTL[] = [];
  const pool = r.shuffle(nama);
  for (let n = 0, coba = 0; n < jumlah && coba < 60; coba++) {
    const d = r.int(1, 3);
    const m = r.int(lo, hi - d);
    if (m < lo || m + d > hi) continue;
    let bebas = true;
    for (let i = m; i < m + d; i++) if (terpakai[i]) bebas = false;
    if (!bebas || !pool[n]) continue;
    for (let i = m; i < m + d; i++) terpakai[i] = true;
    hasil.push({ id: idBaru(), nama: pool[n], mulai: m, durasi: d, bisaGeser });
    n++;
  }
  return hasil.sort((a, b) => a.mulai - b.mulai);
}

/** Tutup seluruh kotak kosong dalam [lo, hi) dengan kegiatan 1–3 kotak bernama unik. */
function tutupPenuh(r: Rng, terpakai: boolean[], nama: string[], lo: number, hi: number, bisaGeser: boolean): KegiatanTL[] | null {
  const hasil: KegiatanTL[] = [];
  const pool = r.shuffle(nama);
  let i = lo;
  while (i < hi) {
    if (terpakai[i]) { i++; continue; }
    let j = i;
    while (j < hi && !terpakai[j] && j - i < 3) j++;
    const d = r.int(1, j - i);
    const n = pool.shift();
    if (!n) return null;
    for (let x = i; x < i + d; x++) terpakai[x] = true;
    hasil.push({ id: idBaru(), nama: n, mulai: i, durasi: d, bisaGeser });
    i += d;
  }
  return hasil;
}

const kosong = () => new Array<boolean>(KOTAK_TL).fill(false);
const tandai = (t: boolean[], m: number, d: number) => { for (let i = m; i < m + d; i++) t[i] = true; };
const urutkan = (ks: KegiatanTL[]) => ks.sort((a, b) => a.mulai - b.mulai);
const menitTL = (d: number) => `${d * 30} menit`;
const KATA = ['nol', 'satu', 'dua', 'tiga'];

// ───────────────────────── Pola rapat ─────────────────────────

function bangunRapat(r: Rng, tanya: 'lebih-awal' | 'paling-akhir', pilihanDurasi: number[]): { item: TimelineItem; jawaban: number[] } | null {
  urutId = 0;
  const kel = r.pick(KELOMPOK_RAPAT);
  const namaOrang = r.pick(NAMA_ORANG_TL);
  const d = r.pick(pilihanDurasi);
  let S: number, t: number, batas: number | undefined;
  if (tanya === 'lebih-awal') { S = r.int(9, KOTAK_TL - d); t = r.int(0, S - d); }
  else { batas = r.int(10, 15); S = r.int(batas, KOTAK_TL - d); t = r.int(Math.max(0, batas - d - 6), batas - d); }
  const H = tanya === 'lebih-awal' ? S : batas!;

  // Kalender Anda: kosong hanya pada blok jawaban dan 1–3 blok pengecoh; sisanya sampai H berisi janji tetap.
  const anda = kosong();
  tandai(anda, S, d);
  const bebasAnda = kosong();
  for (let i = t; i < t + d; i++) bebasAnda[i] = true;
  for (let n = r.int(1, 3), coba = 0; n > 0 && coba < 30; coba++) {
    const m = r.int(0, H - d);
    if (m + d > H || Math.abs(m - t) < d + 1) continue;
    for (let i = m; i < m + d; i++) bebasAnda[i] = true;
    n--;
  }
  const jagaAnda = anda.map((x, i) => x || bebasAnda[i]);
  const janji = tutupPenuh(r, jagaAnda, JANJI_ANDA, 0, H, false);
  if (!janji) return null;
  const sesudah = isiAcak(r, jagaAnda, r.int(1, 2), JANJI_ANDA.filter((n) => !janji.some((j) => j.nama === n)), false, S + d, KOTAK_TL);
  const target: KegiatanTL = { id: 'target', nama: kel.target, mulai: S, durasi: d, bisaGeser: false, peran: 'target-semula' };
  const barisAnda: BarisTL = { id: 'anda', nama: 'Kalender Anda', kegiatan: urutkan([...janji, ...sesudah, target]) };

  // Tiga orang: minimal satu harus menggeser satu kegiatan agar blok jawaban sah.
  const mode = r.shuffle(['geser', r.pick(['geser', 'bebas']), 'bebas']);
  const pemegangDemo = kel.demo ? r.int(0, 2) : -1;
  const baris: BarisTL[] = [];
  for (let p = 0; p < 3; p++) {
    const terpakai = kosong();
    const jaga = kosong();
    for (let i = t; i < t + d; i++) jaga[i] = true;
    const kegiatan: KegiatanTL[] = [];
    const nama = r.shuffle(kel.kegiatan);
    if (mode[p] === 'geser') {
      const g = r.int(1, 3);
      const maju = r.next() < 0.5; // geser ke kanan (lebih lambat) atau ke kiri (lebih awal)
      const m = maju ? t + d - 1 : t + 1 - g;
      const tujuan = maju ? m + g : m - 1;
      if (m < 0 || m + g > KOTAK_TL || tujuan < 0 || tujuan >= KOTAK_TL) return null;
      tandai(terpakai, m, g);
      jaga[tujuan] = true;
      kegiatan.push({ id: idBaru(), nama: nama.shift()!, mulai: m, durasi: g, bisaGeser: true });
    }
    const blokir = terpakai.map((x, i) => x || jaga[i]);
    if (p === pemegangDemo) {
      const dd = r.int(1, 3);
      const m = r.int(0, KOTAK_TL - dd);
      let ok = true;
      for (let i = m; i < m + dd; i++) if (blokir[i]) ok = false;
      if (ok) { tandai(blokir, m, dd); kegiatan.push({ id: idBaru(), nama: kel.demo!, mulai: m, durasi: dd, bisaGeser: false }); }
    }
    kegiatan.push(...isiAcak(r, blokir, r.int(4, 6) - kegiatan.length, nama, true));
    if (kegiatan.length < 4) return null;
    baris.push({ id: `p${p}`, nama: namaOrang[p], kegiatan: urutkan(kegiatan) });
  }

  const durasiTeks = d === 1 ? '' : ` dan berlangsung ${menitTL(d)}`;
  const item: TimelineItem = {
    jenis: 'timeline',
    judul: kel.judul,
    paragraf: [
      tanya === 'lebih-awal'
        ? `${kel.target} saat ini dijadwalkan pukul ${rentangTL(S, d)} di Kalender Anda, tetapi perlu dimajukan ke waktu yang lebih awal${durasiTeks}.`
        : `${kel.target} semula dijadwalkan pukul ${rentangTL(S, d)}, tetapi harus dipindahkan agar selesai paling lambat pukul ${jamTL(batas!)}${durasiTeks}.`,
      `${daftarKata(namaOrang)} harus hadir; masing-masing boleh menggeser paling banyak satu kegiatannya sejauh 30 menit (lebih awal atau lebih lambat) sebagai satu blok utuh.`,
      kel.demo ? `${kel.demo} dan semua janji di Kalender Anda tidak boleh dipindah.` : 'Semua janji di Kalender Anda tidak boleh dipindah.',
    ],
    pertanyaan: tanya === 'lebih-awal'
      ? `Pilih waktu yang lebih awal untuk ${kel.target} pada Kalender Anda.`
      : `Pilih waktu mulai paling akhir yang memungkinkan untuk ${kel.target} pada Kalender Anda.`,
    baris,
    jawaban: barisAnda,
    legenda: { abu: 'Kegiatan yang sudah terjadwal', pilihan: `Waktu baru ${kel.target}` },
    pilih: { mode: 'blok', panjang: d },
    aturan: tanya === 'lebih-awal' ? { jenis: 'rapat', target: 'target', tanya } : { jenis: 'rapat', target: 'target', tanya, batas },
  };
  return { item, jawaban: blok(t, d) };
}

function bahasRapat(item: TimelineItem, jawaban: number[]): Pembahasan | null {
  const a = item.aturan as Extract<AturanTL, { jenis: 'rapat' }>;
  const tgt = item.jawaban.kegiatan.find((k) => k.id === a.target)!;
  const d = tgt.durasi;
  const langkah: LangkahPembahasan[] = [];
  const kandidat: number[] = [];
  for (let m = 0; m + d <= KOTAK_TL; m++) {
    if (a.tanya === 'lebih-awal' && m >= tgt.mulai) continue;
    if (a.tanya === 'paling-akhir' && m + d > a.batas!) continue;
    if (item.jawaban.kegiatan.some((k) => k.id !== tgt.id && k.mulai < m + d && m < k.mulai + k.durasi)) continue;
    kandidat.push(m);
  }
  langkah.push({ teks: `Pada Kalender Anda (${tgt.nama} semula ${rentangTL(tgt.mulai, d)} dilepas lebih dulu), blok ${menitTL(d)} yang masih kosong ${a.tanya === 'lebih-awal' ? 'sebelum waktu semula' : `dan selesai paling lambat ${jamTL(a.batas!)}`}: ${kandidat.map((m) => rentangTL(m, d)).join('; ')}.` });
  const urutKandidat = a.tanya === 'paling-akhir' ? [...kandidat].reverse() : kandidat;
  for (const m of urutKandidat) {
    const cek = item.baris.map((b) => ({ b, c: cekOrang(b, m, m + d) }));
    const gagal = cek.find((x) => !x.c.ok);
    if (gagal && !gagal.c.ok) { langkah.push({ teks: `${rentangTL(m, d)} gugur: ${gagal.c.alasan}.` }); continue; }
    const rinci = cek.map(({ b, c }) => c.ok && c.geser ? `${b.nama} menggeser ${c.geser.k.nama} dari ${rentangTL(c.geser.k.mulai, c.geser.k.durasi)} ke ${rentangTL(c.geser.ke, c.geser.k.durasi)}` : `${b.nama} sudah kosong`);
    langkah.push({ teks: `${rentangTL(m, d)} sah: ${daftarKata(rinci)}.` });
    if (a.tanya === 'paling-akhir') break;
  }
  if (kunciTL(blok(urutKandidat.find((m) => item.baris.every((b) => cekOrang(b, m, m + d).ok)) ?? -1, d)) !== kunciTL(jawaban)) return null;
  return {
    jawaban: `${tgt.nama} ${rentangTL(jawaban[0], d)}`,
    langkah,
    caraCepat: 'Cari dulu blok kosong di Kalender Anda, lalu periksa tiap orang: kosong, atau cukup satu kegiatan yang digeser 30 menit tanpa menabrak kegiatan lain.',
  };
}

// ───────────────────────── Pola ruangan ─────────────────────────

const FASE_RUANG = (bongkar: number) => [
  { nama: 'Persiapan Pelatihan Pertama', durasi: 1, pelatihan: false },
  { nama: 'Pelatihan TI Pertama', durasi: 2, pelatihan: true },
  { nama: 'Persiapan Pelatihan Kedua', durasi: 1, pelatihan: false },
  { nama: 'Pelatihan TI Kedua', durasi: 2, pelatihan: true },
  { nama: 'Pembongkaran Peralatan', durasi: bongkar, pelatihan: false },
];

function bangunRuang(r: Rng): { item: TimelineItem; jawaban: number[] } | null {
  urutId = 0;
  const set = r.pick(NAMA_RUANG_TL);
  const bongkar = r.pick([1, 2]);
  const fase = FASE_RUANG(bongkar);
  const L = fase.reduce((s, f) => s + f.durasi, 0);
  const t = r.int(0, KOTAK_TL - L);
  const iPendukung = r.int(0, 2);
  // Ruang jawaban dan ruang pendukung kosong pada jendela yang mencakup jawaban (sedikit lebih lebar), terisi penuh di luarnya.
  const jendela = () => [Math.max(0, t - r.int(0, 2)), Math.min(KOTAK_TL, t + L + r.int(0, 2))] as const;
  const [a4, b4] = jendela();
  if (b4 - a4 <= L) return null;
  const t4 = kosong();
  for (let i = a4; i < b4; i++) t4[i] = true;
  const isi4 = tutupPenuh(r, t4, KEGIATAN_RUANG, 0, KOTAK_TL, false);
  if (!isi4) return null;
  const baris: BarisTL[] = [];
  const jendelaFasePelatihan: [number, number][] = [];
  { let x = t; for (const f of fase) { if (f.pelatihan) jendelaFasePelatihan.push([x, x + f.durasi]); x += f.durasi; } }
  let adaPenjualan = 0;
  for (let i = 0; i < 3; i++) {
    const tp = kosong();
    const kegiatan: KegiatanTL[] = [];
    if (i === iPendukung) {
      const [a3, b3] = jendela();
      for (let x = a3; x < b3; x++) tp[x] = true;
      const isi = tutupPenuh(r, tp, KEGIATAN_RUANG, 0, KOTAK_TL, false);
      if (!isi) return null;
      kegiatan.push(...isi);
    } else {
      // Rapat Penjualan: tidak boleh bertabrakan dengan fase pelatihan jawaban, tetapi boleh bersamaan dengan persiapan/pembongkaran.
      if (r.next() < 0.85 || adaPenjualan === 0) {
        const d = r.int(1, 2);
        const m = r.int(Math.max(0, t - 3), Math.min(KOTAK_TL - d, t + L + 1));
        if (!jendelaFasePelatihan.some(([x0, x1]) => m < x1 && x0 < m + d)) {
          tandai(tp, m, d);
          kegiatan.push({ id: idBaru(), nama: RAPAT_PENJUALAN, mulai: m, durasi: d, bisaGeser: false });
          adaPenjualan++;
        }
      }
      kegiatan.push(...isiAcak(r, tp, r.int(3, 5), KEGIATAN_RUANG, false));
    }
    baris.push({ id: `r${i}`, nama: set.diketahui[i], kegiatan: urutkan(kegiatan) });
  }
  if (!adaPenjualan) return null;
  const R4 = set.jawaban;
  const pendukung = set.diketahui[iPendukung];
  const label = fase.flatMap((f) => Array.from({ length: f.durasi }, () => f.nama.replace('Persiapan Pelatihan', 'Persiapan').replace('Pelatihan TI', 'Pelatihan').replace('Pembongkaran Peralatan', 'Pembongkaran')));
  const item: TimelineItem = {
    jenis: 'timeline',
    judul: 'Reservasi Pelatihan TI',
    paragraf: [
      'Empat ruang kantor dipakai bersama oleh unit TI dan unit penjualan.',
      `Unit TI akan mengadakan dua sesi Pelatihan TI di ${R4}, masing-masing 60 menit, dan setiap pelatihan didahului persiapan 30 menit.`,
      `Setelah pelatihan kedua ada pembongkaran peralatan ${menitTL(bongkar)}; seluruh rangkaian berlangsung berurutan tanpa jeda dalam satu reservasi.`,
      'Selama kedua sesi pelatihan, tidak boleh ada Rapat Penjualan di ruangan mana pun.',
      `${pendukung} juga harus kosong sepanjang reservasi karena dipakai untuk menyiapkan peralatan.`,
    ],
    pertanyaan: `Pilih waktu reservasi ${R4} untuk seluruh rangkaian (${menitTL(L)}).`,
    baris,
    jawaban: { id: 'r4', nama: R4, kegiatan: isi4 },
    legenda: { abu: 'Ruangan sudah terpakai', pilihan: `Reservasi ${R4}` },
    pilih: { mode: 'blok', panjang: L, label },
    aturan: { jenis: 'ruangan', fase, pendukung: `r${iPendukung}`, larangan: RAPAT_PENJUALAN },
  };
  return { item, jawaban: blok(t, L) };
}

function bahasRuang(item: TimelineItem, jawaban: number[]): Pembahasan | null {
  const a = item.aturan as Extract<AturanTL, { jenis: 'ruangan' }>;
  const L = a.fase.reduce((s, f) => s + f.durasi, 0);
  const pendukung = item.baris.find((b) => b.id === a.pendukung)!;
  const langkah: LangkahPembahasan[] = [];
  langkah.push({ teks: `Satu reservasi = ${a.fase.map((f) => `${f.nama} ${menitTL(f.durasi)}`).join(' → ')} = ${menitTL(L)} (${L} kotak berurutan).` });
  const penjualan = item.baris.flatMap((b) => b.kegiatan.filter((k) => k.nama === a.larangan).map((k) => `${b.nama} ${rentangTL(k.mulai, k.durasi)}`));
  langkah.push({ teks: `Rapat Penjualan: ${penjualan.join('; ')}. Larangan hanya berlaku selama fase pelatihan, bukan saat persiapan atau pembongkaran.` });
  const kandidat: number[] = [];
  for (let m = 0; m + L <= KOTAK_TL; m++) if (!item.jawaban.kegiatan.some((k) => k.mulai < m + L && m < k.mulai + k.durasi)) kandidat.push(m);
  langkah.push({ teks: `${item.jawaban.nama} kosong cukup panjang untuk mulai pukul ${kandidat.map(jamTL).join(', ')}.` });
  for (const m of kandidat) {
    const c = cekReservasi(item, m, L, pendukung);
    langkah.push({ teks: c.ok ? `Mulai ${jamTL(m)} sah: ${pendukung.nama} kosong ${rentangTL(m, L)} dan tidak ada Rapat Penjualan selama fase pelatihan.` : `Mulai ${jamTL(m)} gugur: ${c.alasan}.` });
  }
  if (jawaban[0] === undefined) return null;
  let x = jawaban[0];
  const rinci = a.fase.map((f) => { const s = `${f.nama} ${rentangTL(x, f.durasi)}`; x += f.durasi; return s; });
  langkah.push({ teks: `Rincian reservasi: ${rinci.join('; ')}.` });
  return {
    jawaban: `${item.jawaban.nama} ${rentangTL(jawaban[0], L)}`,
    langkah,
    caraCepat: 'Cari waktu ketika ruang tujuan dan ruang pendukung sama-sama kosong sepanjang reservasi, lalu cek Rapat Penjualan hanya terhadap dua fase pelatihan.',
  };
}

// ───────────────────────── Pola petugas ─────────────────────────

const ACARA: [number, number] = [2, 16]; // 10.00–17.00
const TUTUP: [number, number] = [6, 8];  // 12.00–13.00

function bangunPetugas(r: Rng, varian: 'sumber' | 'bebas', ambangBerubah: boolean): { item: TimelineItem; jawaban: number[] } | null {
  urutId = 0;
  const kel = r.pick(KELOMPOK_PETUGAS);
  const set = r.pick(NAMA_TIM_TL);
  const anggota = [4, 6, 8];
  const segmen: [number, number][] = [[ACARA[0], TUTUP[0]], [TUTUP[1], ACARA[1]]];
  const baris: BarisTL[] = [];
  if (varian === 'sumber') {
    // Sumber: setiap tim dua blok kerja masing-masing dua kotak; blok-blok menutup seluruh 12 kotak aktif.
    const blokKerja = r.shuffle([2, 4, 8, 10, 12, 14]);
    for (let i = 0; i < 3; i++) {
      const nama = r.shuffle(kel.kegiatan);
      baris.push({ id: `t${i}`, nama: set.diketahui[i], keterangan: `${anggota[i]} orang`, kegiatan: urutkan(blokKerja.slice(i * 2, i * 2 + 2).map((m, j) => ({ id: idBaru(), nama: nama[j], mulai: m, durasi: 2, bisaGeser: false }))) });
    }
  } else {
    for (let i = 0; i < 3; i++) {
      const tp = kosong();
      const nama = r.shuffle(kel.kegiatan);
      const kegiatan: KegiatanTL[] = [];
      for (let n = r.int(2, 3), coba = 0; n > 0 && coba < 40; coba++) {
        const [lo, hi] = r.pick(segmen);
        const d = r.int(1, 3);
        const m = r.int(lo, hi - d);
        let ok = true;
        for (let x = m; x < m + d; x++) if (tp[x]) ok = false;
        if (!ok) continue;
        tandai(tp, m, d);
        kegiatan.push({ id: idBaru(), nama: nama.shift()!, mulai: m, durasi: d, bisaGeser: false });
        n--;
      }
      baris.push({ id: `t${i}`, nama: set.diketahui[i], keterangan: `${anggota[i]} orang`, kegiatan: urutkan(kegiatan) });
    }
  }
  const ambang = ambangBerubah ? [{ mulai: ACARA[0], selesai: TUTUP[0], min: 6 }, { mulai: TUTUP[1], selesai: ACARA[1], min: 8 }] : [{ mulai: ACARA[0], selesai: ACARA[1], min: 6 }];
  const D = set.jawaban;
  const item: TimelineItem = {
    jenis: 'timeline',
    judul: kel.judul,
    paragraf: [
      `Tiga tim bertugas pada ${kel.acara} pukul 10.00–17.00; kotak abu-abu menunjukkan waktu tim sedang bertugas.`,
      `Jumlah anggota: ${set.diketahui.map((n, i) => `${n} ${anggota[i]} orang`).join(', ')}, dan ${D} 4 orang.`,
      ambangBerubah
        ? 'Sebelum makan siang harus ada minimal 6 petugas yang bertugas, sedangkan setelah makan siang minimal 8 petugas; acara tutup untuk makan siang pukul 12.00–13.00.'
        : 'Pada setiap waktu acara harus ada minimal 6 petugas yang bertugas; acara tutup untuk makan siang pukul 12.00–13.00.',
      `Jadwalkan ${D} hanya pada waktu yang membutuhkan tambahan petugas, dengan total waktu bertugas sesingkat mungkin.`,
    ],
    pertanyaan: `Pilih semua kotak waktu bertugas ${D}.`,
    baris,
    jawaban: { id: 'tD', nama: D, keterangan: '4 orang', kegiatan: [] },
    legenda: { abu: 'Tim sedang bertugas', pilihan: `Jadwal ${D} pilihan Anda` },
    pilih: { mode: 'kotak' },
    penanda: [{ mulai: 0, durasi: 2, nama: 'Di luar jam acara' }, { mulai: TUTUP[0], durasi: 2, nama: 'Istirahat makan siang (acara tutup)' }, { mulai: ACARA[1], durasi: 2, nama: 'Di luar jam acara' }],
    aturan: { jenis: 'petugas', anggota: { t0: 4, t1: 6, t2: 8 }, anggotaJawaban: 4, acara: ACARA, tutup: TUTUP, ambang },
  };
  const sol = pecahkanTimeline(item);
  return sol.length === 1 ? { item, jawaban: sol[0] } : null;
}

function bahasPetugas(item: TimelineItem, jawaban: number[]): Pembahasan | null {
  const a = item.aturan as Extract<AturanTL, { jenis: 'petugas' }>;
  const n = petugasPerKotak(item);
  const langkah: LangkahPembahasan[] = [];
  const tim = (i: number) => item.baris.filter((b) => b.kegiatan.some((k) => i >= k.mulai && i < k.mulai + k.durasi));
  // Kelompokkan kotak aktif berurutan yang susunan timnya sama.
  const bagian: { m: number; d: number; teks: string; kurang: boolean }[] = [];
  for (let i = 0; i < KOTAK_TL; i++) {
    if (!kotakAktif(a, i)) continue;
    const ts = tim(i).map((b) => `${b.nama} (${a.anggota[b.id]})`).join(' + ') || 'tidak ada tim';
    const min = ambangDi(a, i);
    const kurang = n[i] < min;
    const teks = `${ts} = ${n[i]} orang, minimal ${min}`;
    const akhir = bagian[bagian.length - 1];
    if (akhir && akhir.m + akhir.d === i && akhir.teks === teks) akhir.d++;
    else bagian.push({ m: i, d: 1, teks, kurang });
  }
  langkah.push({ teks: 'Hitung petugas pada setiap waktu acara (makan siang 12.00–13.00 tidak dihitung):' });
  for (const b of bagian) langkah.push({ teks: `${rentangTL(b.m, b.d)}: ${b.teks} → ${b.kurang ? `kurang, ${item.jawaban.nama} perlu bertugas (${n[b.m]} + ${a.anggotaJawaban} = ${n[b.m] + a.anggotaJawaban})` : 'cukup'}.` });
  const r = rangkaian(jawaban);
  if (!r.length) return null;
  langkah.push({ teks: `Jadwal ${item.jawaban.nama} hanya pada waktu yang kurang: ${r.map(([m, d]) => rentangTL(m, d)).join(' dan ')} (${jawaban.length} kotak). Menambah kotak lain bukan penugasan minimum; menghilangkan salah satunya membuat petugas kurang.` });
  return {
    jawaban: `${item.jawaban.nama}: ${r.map(([m, d]) => rentangTL(m, d)).join(', ')}`,
    langkah,
    caraCepat: 'Jumlahkan anggota tim yang abu-abu pada setiap kotak; tim jawaban hanya diisi pada kotak yang jumlahnya di bawah batas minimal.',
  };
}

// ───────────────────────── Family ─────────────────────────

function sidik(prefix: string) {
  return (item: TimelineItem, jawaban: number[]) => {
    const baris = (b: BarisTL) => b.kegiatan.map((k) => `${k.mulai}+${k.durasi}${k.bisaGeser ? 'g' : ''}${k.nama === RAPAT_PENJUALAN ? 'P' : ''}${k.peran ? 'T' : ''}`).join(',');
    const known = item.baris.map((b) => `${b.id === (item.aturan as { pendukung?: string }).pendukung ? '*' : ''}${b.keterangan ?? ''}[${baris(b)}]`);
    const urut = item.aturan.jenis === 'petugas' ? known : [...known].sort();
    return `${prefix}:${JSON.stringify(item.aturan.jenis === 'petugas' ? item.aturan.ambang : item.pilih)}:${urut.join('|')}:${baris(item.jawaban)}:${kunciTL(jawaban)}`;
  };
}

interface DefTL {
  id: string; nama: string; label: Label; sumber: string; ringkas: string;
  bangun: (r: Rng) => { item: TimelineItem; jawaban: number[] } | null;
  bahas: (item: TimelineItem, jawaban: number[]) => Pembahasan | null;
  periksa?: (item: TimelineItem, jawaban: number[]) => string[];
}

function family(p: DefTL): Family<TimelineItem, number[]> {
  return {
    id: p.id, versi: 1, nama: p.nama, label: p.label, sumber: p.sumber, ringkas: p.ringkas,
    chapter: chapterById('timeline-scheduling'),
    bangun: p.bangun,
    pecahkan: pecahkanTimeline,
    kunci: kunciTL,
    periksa(item, jawaban) {
      const masalah = p.periksa?.(item, jawaban) ?? [];
      if (item.baris.length !== 3) masalah.push('baris diketahui bukan tiga');
      for (const b of [...item.baris, item.jawaban]) {
        if (b.kegiatan.some((k) => k.durasi < 1 || k.durasi > 3)) masalah.push('ada kegiatan di luar 1–3 kotak');
        if (new Set(b.kegiatan.map((k) => k.nama)).size !== b.kegiatan.length) masalah.push(`nama kegiatan ganda pada ${b.nama}`);
      }
      return masalah;
    },
    bahas: p.bahas,
    sidik: sidik(p.id),
  };
}

const periksaRapat = (item: TimelineItem, jawaban: number[]) => {
  const masalah: string[] = [];
  const d = jawaban.length;
  // Mekanisme pergeseran harus dipakai: minimal satu orang perlu menggeser kegiatan pada jawaban.
  if (!item.baris.some((b) => { const c = cekOrang(b, jawaban[0], jawaban[0] + d); return c.ok && c.geser; })) masalah.push('tidak ada pergeseran yang diperlukan');
  if (item.baris.some((b) => b.kegiatan.length < 4 || b.kegiatan.length > 7)) masalah.push('jumlah kegiatan per orang di luar 4–7');
  return masalah;
};

export const timelineRapat = family({
  id: 'TL-RAPAT', nama: 'Memajukan rapat tim (30 menit)', label: 'SHL',
  sumber: 'Blueprint Timeline §4 · contoh 3.pdf (Team Calendar)',
  ringkas: 'Tiga kalender orang + Kalender Anda. Rapat tim 30 menit dimajukan; tiap orang boleh menggeser satu kegiatan utuh sejauh 30 menit; demo klien dan janji Anda tetap. Tepat satu waktu lebih awal yang sah.',
  bangun: (r) => bangunRapat(r, 'lebih-awal', [1]), bahas: bahasRapat, periksa: periksaRapat,
});

export const timelineRapatPanjang = family({
  id: 'TL-RAPAT-PANJANG', nama: 'Memajukan rapat tim 60–90 menit', label: 'VARIASI',
  sumber: 'Blueprint Timeline §4 (variasi dekat sumber: durasi 60/90 menit) · §9 contoh dua kotak',
  ringkas: 'Seperti pola sumber, tetapi rapat target 60 atau 90 menit sehingga blok jawaban dua–tiga kotak.',
  bangun: (r) => bangunRapat(r, 'lebih-awal', [2, 3]), bahas: bahasRapat, periksa: periksaRapat,
});

export const timelineRapatAkhir = family({
  id: 'TL-RAPAT-AKHIR', nama: 'Rapat paling akhir sebelum batas waktu', label: 'VARIASI',
  sumber: 'Blueprint Timeline §10 (pola kemungkinan: rapat paling akhir sebelum batas waktu)',
  ringkas: 'Rapat harus selesai paling lambat pukul tertentu; pilih waktu mulai paling akhir yang memenuhi semua kalender dan aturan pergeseran.',
  bangun: (r) => bangunRapat(r, 'paling-akhir', [1, 2]), bahas: bahasRapat,
  periksa: (item, jawaban) => {
    const masalah = periksaRapat(item, jawaban);
    // Pengutamaan "paling akhir" harus berfungsi: selain jawaban, ada waktu sah lain yang lebih awal.
    if (waktuRapatSah(item).length < 2) masalah.push('pengutamaan paling akhir tidak berfungsi');
    return masalah;
  },
});

export const timelineRuang = family({
  id: 'TL-RUANG', nama: 'Pelatihan dengan ketergantungan ruangan', label: 'SHL',
  sumber: 'Blueprint Timeline §5 · deduktif.pdf hlm. 15–16 (Meeting Room Schedule; pembongkaran 45 menit disesuaikan menjadi 30/60 menit)',
  ringkas: 'Tiga ruangan diketahui + ruang jawaban. Reservasi tujuh/delapan kotak (persiapan–pelatihan–persiapan–pelatihan–pembongkaran); ruang pendukung kosong sepanjang reservasi; Rapat Penjualan dilarang hanya selama fase pelatihan.',
  bangun: bangunRuang, bahas: bahasRuang,
  periksa(item) {
    // Larangan Rapat Penjualan harus berfungsi: tanpa larangan itu, waktu reservasi tidak lagi tunggal.
    const a = item.aturan as Extract<AturanTL, { jenis: 'ruangan' }>;
    const tanpa = pecahkanTimeline({ ...item, aturan: { ...a, larangan: '—' } });
    return tanpa.length < 2 ? ['larangan Rapat Penjualan tidak berfungsi'] : [];
  },
});

const periksaPetugas = (item: TimelineItem, jawaban: number[]) => {
  const masalah: string[] = [];
  if (!jawaban.length) masalah.push('tim jawaban tidak diperlukan');
  if (rangkaian(jawaban).some(([, d]) => d > 3)) masalah.push('rentang tugas tim jawaban lebih dari tiga kotak');
  if (item.baris.some((b) => b.kegiatan.some((k) => k.mulai < TUTUP[1] && TUTUP[0] < k.mulai + k.durasi))) masalah.push('ada tugas saat acara tutup');
  return masalah;
};

export const timelinePetugas = family({
  id: 'TL-PETUGAS', nama: 'Pemenuhan kebutuhan petugas', label: 'SHL',
  sumber: 'Blueprint Timeline §6 · deduktif.pdf hlm. 23–24 (Community Service Schedule)',
  ringkas: 'Tim 4/6/8 orang masing-masing bertugas dua blok 60 menit; minimal 6 petugas pukul 10.00–17.00, makan siang 12.00–13.00. Tim jawaban (4 orang) hanya pada waktu yang kurang, total minimum.',
  bangun: (r) => bangunPetugas(r, 'sumber', false), bahas: bahasPetugas, periksa: periksaPetugas,
});

export const timelinePetugasBebas = family({
  id: 'TL-PETUGAS-BEBAS', nama: 'Pemenuhan petugas — jadwal tim bervariasi', label: 'VARIASI',
  sumber: 'Blueprint Timeline §6 (variasi dekat sumber: dua–tiga kegiatan 30–90 menit per tim)',
  ringkas: 'Seperti pola sumber, tetapi tiap tim punya dua atau tiga kegiatan 30–90 menit yang dapat saling bertumpuk antartim.',
  bangun: (r) => bangunPetugas(r, 'bebas', false), bahas: bahasPetugas, periksa: periksaPetugas,
});

export const timelinePetugasAmbang = family({
  id: 'TL-PETUGAS-AMBANG', nama: 'Kebutuhan petugas berubah menurut jam', label: 'VARIASI',
  sumber: 'Blueprint Timeline §10 (pola kemungkinan: kebutuhan petugas berubah menurut jam)',
  ringkas: 'Minimal 6 petugas sebelum makan siang dan 8 petugas sesudahnya; tim jawaban hanya pada waktu yang kurang dengan total minimum.',
  bangun: (r) => bangunPetugas(r, r.pick(['sumber', 'bebas']), true), bahas: bahasPetugas, periksa: periksaPetugas,
});

export const TIMELINE_FAMILIES = [timelineRapat, timelineRapatPanjang, timelineRapatAkhir, timelineRuang, timelinePetugas, timelinePetugasBebas, timelinePetugasAmbang];
