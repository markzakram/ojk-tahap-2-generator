"""Read back the actual Word-rendered PDF: each clue must occupy one line at the original table font."""
from pathlib import Path
import argparse, json
import pymupdf as fitz

parser=argparse.ArgumentParser();parser.add_argument('folder');args=parser.parse_args()
root=Path(args.folder).resolve();data=json.loads((root/'paket-003-badges.json').read_text(encoding='utf-8'))
pdf=root/'paket-003-badges-pratinjau-word.pdf';doc=fitz.open(pdf);issues=[];total=0;toc=[];cache={}
def lines(index):
    if index not in cache:
        flags=fitz.TEXTFLAGS_DICT & ~fitz.TEXT_PRESERVE_IMAGES
        cache[index]=[(''.join(s['text'] for s in line['spans']).strip(),[s['size'] for s in line['spans']])
          for block in doc[index].get_text('dict',flags=flags)['blocks'] for line in block.get('lines',[])]
    return cache[index]
heads={}
for index,page in enumerate(doc):
    for text in page.get_text().splitlines():
        text=text.strip()
        if text.startswith('Soal ') and text[5:].isdigit():heads.setdefault(text,[]).append(index)
for b in data['paket'][0]['subtes'][0]['butir']:
    head='Soal '+str(b['no']);pages=heads.get(head,[])
    if len(pages)!=1:issues.append([head,'heading',pages]);continue
    toc.append([1,head+' - '+b['keluarga']+' / '+b['model']['kategoriEntitas'],pages[0]+1])
    for card in b['isian']['kartu']:
        total+=1;clue=card['petunjuk'][0];matches=[sizes for i in range(pages[0],min(len(doc),pages[0]+3)) for text,sizes in lines(i) if text==clue]
        if not matches:issues.append([head,card['nama'],'Deskripsi bukan satu baris',clue])
        elif min(matches[0])<9.9:issues.append([head,card['nama'],'Font tabel dikecilkan',matches[0]])
result={'halaman':len(doc),'deskripsi':total,'masalah':issues,'toc':toc}
(root/'qa-baris-word.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
if issues:raise ValueError(json.dumps(issues,ensure_ascii=False))
doc.set_toc(toc);doc.saveIncr();doc.close()
print(f'PASS: {total} descriptions remain on one line at the original 10 pt table font; {len(toc)} question bookmarks added.')
