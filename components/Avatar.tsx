// Pengganti foto sampai PNG dari folder Asset Generator diunduh: inisial dengan warna tetap per nama.
const WARNA = ['#3b6fb6', '#2f8f6f', '#b5543c', '#7a55b0', '#b08a1e', '#2a8a9a', '#b5476f', '#5a6f2f'];

export default function Avatar({ nama }: { nama: string }) {
  let h = 0;
  for (const c of nama) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return <span className="avatar" style={{ background: WARNA[h % WARNA.length] }} aria-hidden>{nama[0]}</span>;
}
