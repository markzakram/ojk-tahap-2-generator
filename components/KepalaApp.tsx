import Link from 'next/link';

/** Kepala aplikasi bersama untuk Ringkasan dan Studio. `children` = isi tambahan (mis. kotak cari di Studio). */
export default function KepalaApp({ aktif, kanan, children }: { aktif: 'ringkasan' | 'studio'; kanan?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <header className="kepala-app">
      <Link href="/" className="merek" aria-label="TKU Studio, ke Ringkasan">
        <span className="merek-logo" aria-hidden="true">TK</span>
        <span className="merek-nama"><b>TKU Studio</b><small>PCAM 10 OJK 2026</small></span>
      </Link>
      <nav className="nav-app" aria-label="Menu utama">
        <Link href="/" aria-current={aktif === 'ringkasan' ? 'page' : undefined}>Ringkasan</Link>
        <Link href="/studio" aria-current={aktif === 'studio' ? 'page' : undefined}>Studio</Link>
      </nav>
      {children}
      {kanan && <div className="kepala-kanan">{kanan}</div>}
    </header>
  );
}
