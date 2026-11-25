import { KOTAK_TL, ambangDi, cekOrang, jamTL, kotakAktif, petugasPerKotak, rangkaian, rentangTL, type AturanTL, type BarisTL, type TimelineItem } from '../deduktif/timeline/model';
import { JUMLAH_KOTAK, WARNA_OPSI, celahKosong, jam, menit, rentang, type KendalaSlot, type Susunan, type TimeslotItem } from '../deduktif/timeslot/model';
import { C, bungkus, dokumen, garis, kotak, penggal, teks, teksBaris, type GambarPembahasan } from './alat';

// Visual pembahasan Timeline (garis waktu sebelum–sesudah; kegiatan yang digeser tetap satu blok utuh) dan Timeslot (blok
// durasi, celah kosong, dan susunan akhir), QC 2 R02.

const KIRI = 128, SEL = 38, W = KIRI + 18 * SEL + 14;
const px = (k: number) => KIRI + k * SEL;

function sumbu(y: number, h: number): string {
  let s = '';
  for (let k = 0; k <= 18; k++) {
    s += garis(px(k), y, px(k), y + h, k % 2 ? '#eef0f3' : C.garis, 1);
    if (k % 2 === 0) s += teks(px(k), y - 6, jam(k), { ukuran: 10, rata: 'middle', warna: C.abu });
  }
  return s;
}

/** Blok kegiatan dengan nama; teks menyesuaikan lebar blok. */
function blokan(m: number, d: number, y: number, h: number, nama: string, g: { isi: string; garis: string; tebal?: number; putus?: string; warna?: string }): string {
  const w = d * SEL;
  let s = kotak(px(m) + 1.5, y + 2, w - 3, h - 4, { isi: g.isi, garis: g.garis, tebal: g.tebal ?? 1, putus: g.putus, sudut: 3 });
  const baris = nama ? penggal(nama, Math.max(6, Math.floor(w / 4.8)), Math.max(1, Math.floor((h - 4) / 9.5))) : [];
  s += teksBaris(px(m) + w / 2, y + h / 2 + 3 - ((baris.length - 1) * 9.5) / 2, baris, 9.5, { ukuran: 8.6, rata: 'middle', warna: g.warna ?? C.teks });
  return s;
}

function barisLabel(b: { nama: string; keterangan?: string }, y: number, h: number): string {
  const n = bungkus(b.nama, 19, 2);
  return teksBaris(8, y + h / 2 + 4 - (n.length - 1) * 6 - (b.keterangan ? 5 : 0), n, 12, { ukuran: 11, tebal: true }) + (b.keterangan ? teks(8, y + h / 2 + 14, b.keterangan, { ukuran: 9.5, warna: C.abu }) : '');
}

const H = 44;

function rapat(item: TimelineItem, jawaban: number[]): GambarPembahasan[] {
  const a = item.aturan as Extract<AturanTL, { jenis: 'rapat' }>;
  const t = item.jawaban.kegiatan.find((k) => k.id === a.target)!;
  const m0 = jawaban[0], d = t.durasi, m1 = m0 + d;
  const semua = [item.jawaban, ...item.baris];
  let s = '';
  let y = 26;
  const panel = (judul: string, sesudah: boolean) => {
    s += teks(8, y, judul, { tebal: true, ukuran: 13 });
    y += 24;
    const tinggi = semua.length * H;
    s += kotak(px(m0), y - 2, d * SEL, tinggi + 4, { isi: C.biruMuda, alpha: 0.55, garis: C.biru, putus: '4 3' });
    s += sumbu(y, tinggi);
    semua.forEach((b, i) => {
      const yy = y + i * H;
      s += garis(4, yy, W - 8, yy, C.garis, 1) + barisLabel(b, yy, H);
      const cek = b === item.jawaban ? null : cekOrang(b, m0, m1);
      const geser = sesudah && cek && cek.ok ? cek.geser : undefined;
      for (const k of b.kegiatan) {
        if (k.id === a.target) {
          s += sesudah
            ? blokan(k.mulai, k.durasi, yy, H, 'waktu semula', { isi: '#ffffff', garis: C.abu, putus: '4 3', warna: C.abu })
            : blokan(k.mulai, k.durasi, yy, H, d === 1 ? 'jadwal semula' : `${k.nama} (semula)`, { isi: C.oranyeMuda, garis: C.oranye, tebal: 1.8 });
          continue;
        }
        if (geser && geser.k.id === k.id) {
          s += blokan(k.mulai, k.durasi, yy, H, '', { isi: '#ffffff', garis: C.abu, putus: '3 3' });
          s += blokan(geser.ke, k.durasi, yy, H, k.nama, { isi: C.oranyeMuda, garis: C.oranye, tebal: 2 });
          const kanan = geser.ke > k.mulai;
          const xa = kanan ? px(k.mulai) + 4 : px(k.mulai + k.durasi) - 4, xb = kanan ? px(geser.ke) + 2 : px(geser.ke + k.durasi) - 2;
          s += garis(xa, yy + H - 6, kanan ? Math.max(xb, xa + 12) + 10 : Math.min(xb, xa - 12) - 10, yy + H - 6, C.oranye, 2, { panah: true, halo: true });
          continue;
        }
        const kunci = !k.bisaGeser;
        s += blokan(k.mulai, k.durasi, yy, H, k.nama, { isi: kunci ? '#d1d5db' : '#f3f4f6', garis: kunci ? C.abu : C.garis });
      }
      if (sesudah && b === item.jawaban) s += blokan(m0, d, yy, H, t.nama, { isi: C.biru, garis: C.biru, warna: '#ffffff' });
      if (sesudah && cek && cek.ok) s += blokan(m0, d, yy, H, 'hadir', { isi: C.hijauMuda, garis: C.hijau, warna: C.hijau });
    });
    s += garis(4, y + tinggi, W - 8, y + tinggi, C.garis, 1);
    y += tinggi + 30;
  };
  panel(`Sebelum: ${t.nama} pukul ${rentangTL(t.mulai, d)}; pita biru = waktu yang diuji`, false);
  panel(`Sesudah: ${t.nama} pukul ${rentangTL(m0, d)}`, true);
  const gs = item.baris.map((b) => ({ b, c: cekOrang(b, m0, m1) })).filter((x) => x.c.ok && x.c.geser);
  const kaki = [
    ...gs.map(({ b, c }) => (c.ok && c.geser ? `${b.nama}: ${c.geser.k.nama} digeser utuh 30 menit, dari ${rentangTL(c.geser.k.mulai, c.geser.k.durasi)} menjadi ${rentangTL(c.geser.ke, c.geser.k.durasi)} (panah).` : '')),
    'Abu-abu tua = tidak boleh dipindah; abu-abu muda = boleh digeser; putus-putus = letak semula.',
  ].flatMap((x) => bungkus(x, 118));
  s += teksBaris(8, y - 8, kaki, 15, { ukuran: 11 });
  const tinggi = y + kaki.length * 15 - 4;
  return [{ id: 'sebelum-sesudah', judul: 'Garis waktu sebelum dan sesudah dipindahkan', alt: `${t.nama} berpindah dari ${rentangTL(t.mulai, d)} ke ${rentangTL(m0, d)}. ${kaki.join(' ')}`, lebar: W, tinggi: Math.ceil(tinggi), svg: dokumen(W, tinggi, s, 'Garis waktu sebelum dan sesudah') }];
}

function ruangan(item: TimelineItem, jawaban: number[]): GambarPembahasan[] {
  const a = item.aturan as Extract<AturanTL, { jenis: 'ruangan' }>;
  const m0 = jawaban[0], L = a.fase.reduce((q, f) => q + f.durasi, 0);
  const semua: BarisTL[] = [item.jawaban, ...item.baris];
  let s = teks(8, 22, `Reservasi ${item.jawaban.nama} pukul ${rentangTL(m0, L)}`, { tebal: true, ukuran: 13 });
  let y = 50;
  const tinggi = semua.length * H;
  let x = m0;
  for (const f of a.fase) { if (f.pelatihan) s += kotak(px(x), y - 2, f.durasi * SEL, tinggi + 4, { isi: C.biruMuda, alpha: 0.6, garis: C.biru, putus: '4 3' }); x += f.durasi; }
  s += sumbu(y, tinggi);
  semua.forEach((b, i) => {
    const yy = y + i * H;
    s += garis(4, yy, W - 8, yy, C.garis, 1) + barisLabel(b.id === a.pendukung ? { nama: b.nama, keterangan: 'harus kosong' } : b, yy, H);
    for (const k of b.kegiatan) s += blokan(k.mulai, k.durasi, yy, H, k.nama, k.nama === a.larangan ? { isi: C.merahMuda, garis: C.merah, tebal: 1.8 } : { isi: '#d1d5db', garis: C.abu });
    if (b === item.jawaban) {
      let q = m0;
      a.fase.forEach((f) => { s += blokan(q, f.durasi, yy, H, f.nama, f.pelatihan ? { isi: C.biru, garis: C.biru, warna: '#ffffff' } : { isi: C.oranyeMuda, garis: C.oranye }); q += f.durasi; });
    }
    if (b.id === a.pendukung) s += blokan(m0, L, yy, H, 'kosong sepanjang reservasi', { isi: C.hijauMuda, garis: C.hijau, warna: C.hijau });
  });
  s += garis(4, y + tinggi, W - 8, y + tinggi, C.garis, 1);
  y += tinggi + 18;
  const kaki = [`Pita biru = dua fase pelatihan; ${a.larangan} (kotak merah) tidak boleh jatuh pada pita biru di ruangan mana pun.`, 'Kuning = persiapan dan pembongkaran; hijau = ruangan pendukung yang harus kosong.'];
  s += teksBaris(8, y, kaki, 15, { ukuran: 11 });
  const h = y + 24;
  return [{ id: 'reservasi', judul: 'Garis waktu reservasi dan pemeriksaannya', alt: `Reservasi ${item.jawaban.nama} pukul ${rentangTL(m0, L)}. ${kaki.join(' ')}`, lebar: W, tinggi: Math.ceil(h), svg: dokumen(W, h, s, 'Garis waktu reservasi') }];
}

function petugas(item: TimelineItem, jawaban: number[]): GambarPembahasan[] {
  const a = item.aturan as Extract<AturanTL, { jenis: 'petugas' }>;
  const n = petugasPerKotak(item);
  const semua = item.baris;
  let s = teks(8, 22, 'Jumlah petugas pada setiap kotak waktu', { tebal: true, ukuran: 13 });
  const y = 50;
  const tinggi = semua.length * H + 3 * 30;
  s += sumbu(y, tinggi);
  semua.forEach((b, i) => {
    const yy = y + i * H;
    s += garis(4, yy, W - 8, yy, C.garis, 1) + barisLabel({ nama: b.nama, keterangan: `${a.anggota[b.id]} orang` }, yy, H);
    for (const k of b.kegiatan) s += blokan(k.mulai, k.durasi, yy, H, k.nama, { isi: '#d1d5db', garis: C.abu });
  });
  const yj = y + semua.length * H;
  s += garis(4, yj, W - 8, yj, C.garis, 1) + teks(8, yj + 19, 'Jumlah', { tebal: true, ukuran: 11 });
  s += garis(4, yj + 30, W - 8, yj + 30, C.garis, 1) + teks(8, yj + 49, 'Minimal', { tebal: true, ukuran: 11 });
  s += garis(4, yj + 60, W - 8, yj + 60, C.garis, 1) + teksBaris(8, yj + 79, bungkus(item.jawaban.nama, 19, 1), 12, { tebal: true, ukuran: 11 });
  for (let k = 0; k < KOTAK_TL; k++) {
    if (!kotakAktif(a, k)) { s += kotak(px(k) + 1, yj + 1, SEL - 2, 88, { isi: '#f3f4f6' }) + teks(px(k) + SEL / 2, yj + 49, 'tutup', { ukuran: 9, rata: 'middle', warna: C.abu }); continue; }
    const min = ambangDi(a, k), kurang = n[k] < min;
    s += teks(px(k) + SEL / 2, yj + 19, String(n[k]), { rata: 'middle', tebal: kurang, ukuran: 12, warna: kurang ? C.merah : C.teks });
    if (kurang) s += kotak(px(k) + 3, yj + 4, SEL - 6, 22, { garis: C.merah, tebal: 1.8, sudut: 4 });
    s += teks(px(k) + SEL / 2, yj + 49, String(min), { rata: 'middle', ukuran: 12 });
    if (jawaban.includes(k)) s += kotak(px(k) + 1.5, yj + 63, SEL - 3, 24, { isi: C.biru, sudut: 3 }) + teks(px(k) + SEL / 2, yj + 79, `+${a.anggotaJawaban}`, { rata: 'middle', tebal: true, ukuran: 11, warna: '#ffffff' });
  }
  s += garis(4, yj + 90, W - 8, yj + 90, C.garis, 1);
  const kaki = [`Angka merah berbingkai = di bawah batas minimal, jadi ${item.jawaban.nama} (${a.anggotaJawaban} orang) ditambahkan; kotak lain sudah cukup.`, `Jadwal ${item.jawaban.nama}: ${rangkaian(jawaban).map(([m, d]) => rentangTL(m, d)).join(' dan ')}.`];
  const h = yj + 90 + 16 + kaki.length * 15;
  s += teksBaris(8, yj + 108, kaki, 15, { ukuran: 11 });
  return [{ id: 'petugas', judul: 'Jumlah petugas dan waktu yang kurang', alt: kaki.join(' '), lebar: W, tinggi: Math.ceil(h), svg: dokumen(W, h, s, 'Jumlah petugas per kotak waktu') }];
}

export function visualTimeline(item: TimelineItem, jawaban: number[]): GambarPembahasan[] {
  return item.aturan.jenis === 'rapat' ? rapat(item, jawaban) : item.aturan.jenis === 'ruangan' ? ruangan(item, jawaban) : petugas(item, jawaban);
}

// ───────────────────────── Timeslot ─────────────────────────

function periksaKendala(item: TimeslotItem, s: Susunan, k: KendalaSlot): string {
  const o = (id: string) => item.opsi.find((x) => x.id === id)!;
  const t = (id: string) => item.tetap.find((x) => x.id === id)!;
  const ak = (id: string) => s[id] + o(id).durasi;
  switch (k.jenis) {
    case 'sebelum': return `${o(k.a).nama} selesai ${jam(ak(k.a))}, ${o(k.b).nama} dimulai ${jam(s[k.b])}`;
    case 'langsung-setelah': return `${o(k.a).nama} selesai ${jam(ak(k.a))} dan ${o(k.b).nama} langsung dimulai ${jam(s[k.b])}`;
    case 'jeda-tepat': return `${o(k.a).nama} selesai ${jam(ak(k.a))}, jeda ${menit(k.jeda)}, ${o(k.b).nama} dimulai ${jam(s[k.b])}`;
    case 'langsung-setelah-tetap': return `${t(k.tetap).nama} selesai ${jam(t(k.tetap).mulai + t(k.tetap).durasi)} dan ${o(k.a).nama} langsung dimulai`;
    case 'langsung-sebelum-tetap': return `${o(k.a).nama} selesai ${jam(ak(k.a))}, tepat saat ${t(k.tetap).nama} dimulai`;
    case 'setelah-tetap': return `${o(k.a).nama} dimulai ${jam(s[k.a])}, setelah ${t(k.tetap).nama} selesai ${jam(t(k.tetap).mulai + t(k.tetap).durasi)}`;
    case 'tenggat': return `semua kegiatan selesai paling lambat ${jam(k.batas)} (terakhir ${jam(Math.max(...item.opsi.map((x) => ak(x.id))))})`;
    case 'jendela': return `${o(k.a).nama} ${rentang(s[k.a], o(k.a).durasi)}, di dalam ${jam(k.mulai)}–${jam(k.selesai)}`;
    case 'terakhir': return `${o(k.a).nama} selesai paling akhir (${jam(ak(k.a))})`;
    case 'pertama': return `${o(k.a).nama} menjadi kegiatan pertama (${jam(s[k.a])})`;
  }
}

export function visualTimeslot(item: TimeslotItem, jawaban: Susunan): GambarPembahasan[] {
  const tenggat = item.kendala.find((k) => k.jenis === 'tenggat') as Extract<KendalaSlot, { jenis: 'tenggat' }> | undefined;
  const celah = celahKosong(item, tenggat?.batas);
  const TB = 52;
  let s = teks(8, 22, 'Jadwal tetap, celah kosong, dan susunan akhir', { tebal: true, ukuran: 13 });
  const y = 50, tinggi = 3 * TB;
  s += sumbu(y, tinggi);
  const baris = (i: number, nama: string, ket: string) => { const yy = y + i * TB; s += garis(4, yy, W - 8, yy, C.garis, 1) + barisLabel({ nama, keterangan: ket }, yy, TB); return yy; };
  const y0 = baris(0, 'Jadwal tetap', 'tidak dipindah');
  for (const t of item.tetap) s += blokan(t.mulai, t.durasi, y0, TB, t.nama, { isi: '#d1d5db', garis: C.abu });
  const y1 = baris(1, 'Celah kosong', tenggat ? `sampai ${jam(tenggat.batas)}` : 'panjang celah');
  for (const c of celah) s += blokan(c.mulai, c.panjang, y1, TB, menit(c.panjang), { isi: '#ffffff', garis: C.hijau, tebal: 1.6, putus: '5 3', warna: C.hijau });
  const y2 = baris(2, 'Susunan akhir', 'jawaban');
  item.opsi.forEach((o, i) => {
    const m = jawaban[o.id];
    s += kotak(px(m) + 1.5, y2 + 2, o.durasi * SEL - 3, TB - 4, { isi: WARNA_OPSI[i % WARNA_OPSI.length], garis: C.tinta, tebal: 1.4, sudut: 3 });
    const w = o.durasi * SEL;
    s += kotak(px(m) + 4, y2 + 5, w - 8, TB - 10, { isi: '#ffffff', alpha: 0.9, sudut: 2 });
    const nb = penggal(`${o.nama} (${menit(o.durasi)})`, Math.max(6, Math.floor((w - 8) / 4.9)), 4);
    s += teksBaris(px(m) + w / 2, y2 + TB / 2 + 3 - ((nb.length - 1) * 9.5) / 2, nb, 9.5, { ukuran: 8.6, rata: 'middle', tebal: true });
  });
  s += garis(4, y + tinggi, W - 8, y + tinggi, C.garis, 1);
  if (tenggat) s += garis(px(tenggat.batas), y - 2, px(tenggat.batas), y + tinggi + 4, C.merah, 2, { putus: '5 3' }) + teks(px(tenggat.batas) + 4, y + 12, 'tenggat', { ukuran: 10, warna: C.merah, tebal: true, halo: true });
  const kaki = [
    ...item.kendala.map((k) => `✓ ${periksaKendala(item, jawaban, k)}.`),
    ...(item.sasaran.jenis === 'tidak-ada' ? [] : ['✓ Susunan ini memenuhi permintaan paling awal setelah semua syarat terpenuhi.']),
  ].flatMap((x) => bungkus(x, 116));
  s += teksBaris(8, y + tinggi + 20, kaki, 15, { ukuran: 11.5 });
  const h = y + tinggi + 28 + kaki.length * 15;
  const urut = [...item.opsi].sort((p, q) => jawaban[p.id] - jawaban[q.id]);
  return [{ id: 'blok-durasi', judul: 'Blok durasi, celah kosong, dan susunan akhir', alt: `Susunan: ${urut.map((o) => `${o.nama} ${rentang(jawaban[o.id], o.durasi)}`).join('; ')}. ${kaki.join(' ')}`, lebar: W, tinggi: Math.ceil(h), svg: dokumen(W, h, s, 'Blok durasi dan celah kosong') }];
}

void JUMLAH_KOTAK;
void jamTL;
