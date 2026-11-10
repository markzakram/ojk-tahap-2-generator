import { rng } from './rng';
import type { Family, Soal } from './types';

export const MAKS_PERCOBAAN = 400;

export class GagalBangun extends Error {
  constructor(public familyId: string, public seed: string, public alasan: Record<string, number>, batas = MAKS_PERCOBAAN) {
    super(`Family ${familyId} gagal membangun soal untuk seed "${seed}" setelah ${batas} percobaan.`);
  }
}

/**
 * Bangkitkan satu soal dari family + seed. Deterministik: family, versi, dan seed yang sama selalu menghasilkan soal yang sama.
 * Setiap percobaan memakai pengacak turunannya sendiri (`…#k`), sehingga penolakan kandidat tidak menggeser hasil seed lain.
 */
export function bangkitkan<I, A>(family: Family<I, A>, seed: string): Soal<I, A> {
  const alasan: Record<string, number> = {};
  const tolak = (k: string) => (alasan[k] = (alasan[k] ?? 0) + 1);
  const batas = family.maksPercobaan ?? MAKS_PERCOBAAN;
  for (let k = 0; k < batas; k++) {
    const r = rng(`${family.id}@v${family.versi}|${seed}#${k}`);
    const kandidat = family.bangun(r);
    if (!kandidat) { tolak('bangun'); continue; }
    const hasil = periksaKandidat(family, kandidat.item, kandidat.jawaban);
    if (!hasil.ok) { tolak(hasil.alasan); continue; }
    return {
      uid: `${family.id}@v${family.versi}:${seed}`,
      familyId: family.id,
      versi: family.versi,
      seed,
      percobaan: k,
      chapterId: family.chapter.id,
      label: family.label,
      item: kandidat.item,
      jawaban: kandidat.jawaban,
      kunci: family.kunci(kandidat.jawaban),
      pembahasan: hasil.pembahasan,
      sidik: family.sidik(kandidat.item, kandidat.jawaban),
    };
  }
  throw new GagalBangun(family.id, seed, alasan, batas);
}

type HasilPeriksa = { ok: true; pembahasan: NonNullable<ReturnType<Family['bahas']>> } | { ok: false; alasan: string };

/** Validator independen: dipakai saat membangkitkan dan dipakai ulang oleh skrip verifikasi untuk soal tersimpan. */
export function periksaKandidat<I, A>(family: Family<I, A>, item: I, jawaban: A): HasilPeriksa {
  const solusi = new Set(family.pecahkan(item).map((a) => family.kunci(a)));
  if (solusi.size === 0) return { ok: false, alasan: 'tanpa solusi' };
  if (solusi.size > 1) return { ok: false, alasan: 'jawaban ganda' };
  if (!solusi.has(family.kunci(jawaban))) return { ok: false, alasan: 'kunci tidak cocok dengan solver' };
  const masalah = family.periksa?.(item, jawaban) ?? [];
  if (masalah.length) return { ok: false, alasan: masalah[0] };
  const pembahasan = family.bahas(item, jawaban);
  if (!pembahasan) return { ok: false, alasan: 'pembahasan tidak dapat diturunkan' };
  return { ok: true, pembahasan };
}

/** Seed acak yang mudah dibaca dan diketik ulang (8 karakter tanpa huruf/angka yang mirip). */
export function seedBaru(): string {
  const abjad = 'abcdefghjkmnpqrstuvwxyz23456789';
  let s = '';
  for (let i = 0; i < 8; i++) s += abjad[Math.floor(Math.random() * abjad.length)];
  return s;
}
