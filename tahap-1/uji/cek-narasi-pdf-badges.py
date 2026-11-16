"""Read back actual Word-rendered PDF; narrative may wrap, font must stay 10 pt."""
from pathlib import Path
import argparse
import json
import re
import pymupdf as fitz

parser = argparse.ArgumentParser()
parser.add_argument('folder')
parser.add_argument('--satu-baris', action='store_true')
args = parser.parse_args()
root = Path(args.folder).resolve()
data = json.loads((root / 'paket-003-badges.json').read_text(encoding='utf-8'))
doc = fitz.open(root / 'paket-003-badges-penalaran-numerik.pdf')
issues, toc, audit, kosong = [], [], [], []
headings = {}
flags = fitz.TEXTFLAGS_DICT & ~fitz.TEXT_PRESERVE_IMAGES
cache = {}

def spans(i):
    if i not in cache:
        cache[i] = [s for block in doc[i].get_text('dict', flags=flags)['blocks']
                    for line in block.get('lines', []) for s in line['spans']]
    return cache[i]

for index, page in enumerate(doc):
    for text in page.get_text().splitlines():
        if re.fullmatch(r'Soal \d+', text.strip()):
            headings.setdefault(text.strip(), []).append(index)

for b in data['paket'][0]['subtes'][0]['butir']:
    head = 'Soal ' + str(b['no'])
    pages = headings.get(head, [])
    if len(pages) != 1:
        issues.append([head, 'Heading tidak tunggal', pages])
        continue
    toc.append([1, head + ' - ' + b['keluarga'] + ' / ' + b['model']['kategoriEntitas'], pages[0] + 1])
    jumlah_kosong = sum(not c['petunjuk'][0].strip() for c in b['isian']['kartu'])
    if jumlah_kosong > 2:
        issues.append([head, 'Lebih dari dua deskripsi kosong', jumlah_kosong])
    for card in b['isian']['kartu']:
        clue = card['petunjuk'][0]
        if not clue.strip():
            kosong.append({'soal': b['no'], 'nama': card['nama']})
            continue
        matches = []
        for index in range(pages[0], min(len(doc), pages[0] + 3)):
            rects = doc[index].search_for(clue)
            if rects:
                sizes = [s['size'] for s in spans(index)
                         if any((fitz.Rect(s['bbox']) & r).get_area() > 1 for r in rects)]
                matches.append((index, rects, sizes))
        if not matches:
            issues.append([head, card['nama'], 'Deskripsi lengkap tidak ditemukan', clue])
            continue
        index, rects, sizes = matches[0]
        if args.satu_baris and len(rects) != 1:
            issues.append([head, card['nama'], 'Deskripsi bukan satu baris', len(rects)])
        if not sizes or min(sizes) < 9.9:
            issues.append([head, card['nama'], 'Font tabel dikecilkan', sizes])
        audit.append({'soal': b['no'], 'nama': card['nama'], 'halaman': index + 1,
                      'baris': len(rects), 'fontTerkecil': min(sizes) if sizes else None})

result = {'halaman': len(doc), 'soal': len(toc), 'variabel': len(audit) + len(kosong),
          'deskripsi': len(audit), 'deskripsiKosong': len(kosong), 'selKosong': kosong,
          'deskripsiLebihDariSatuBaris': sum(a['baris'] > 1 for a in audit),
          'masalah': issues, 'kartu': audit, 'toc': toc}
(root / 'qa-narasi-word.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
if issues:
    raise ValueError(json.dumps(issues, ensure_ascii=False))
doc.set_toc(toc)
doc.saveIncr()
doc.close()
print(f"PASS: {len(audit)} deskripsi utuh, {len(kosong)} sel sengaja kosong; font tetap 10 pt; "
      f"{result['deskripsiLebihDariSatuBaris']} narasi turun baris, {len(toc)} bookmark soal.")
