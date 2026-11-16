"""Verify actual question text in DOCX/JSON, excluding the solution section."""
from pathlib import Path
import argparse
import json
import re
import zipfile
import xml.etree.ElementTree as ET

parser = argparse.ArgumentParser()
parser.add_argument('folder')
args = parser.parse_args()
d = Path(args.folder).resolve()
forbidden = re.compile(r'Jika suatu petunjuk|Di atas berarti|Tidak ada nilai yang sama|'
                       r'Deskripsi kosong tidak berarti|Dua angka pada setiap|Kalikan kedua|'
                       r'Lencana 1 berarti|Akhiran "nya"|hitung bagian pecahan|kerjakan perkalian', re.I)
data = json.loads((d / 'paket-003-badges.json').read_text(encoding='utf-8'))
bs = data['paket'][0]['subtes'][0]['butir']
for b in bs:
    assert not forbidden.search(b['soal']), b['id']
with zipfile.ZipFile(d / 'paket-003-badges-penalaran-numerik.docx') as z:
    xml = ET.fromstring(z.read('word/document.xml'))
ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
body = xml.find('w:body', ns)
inside = False
number = 0
heads = 0
for node in body:
    text = ''.join(t.text or '' for t in node.findall('.//w:t', ns)).strip()
    if re.fullmatch(r'Soal \d+', text):
        inside = True
        number = int(text[5:])
        heads += 1
    if text == 'Pembahasan:':
        inside = False
    if inside:
        assert not forbidden.search(text), (number, text)
assert heads == len(bs), (heads, len(bs))
result = {'soal': len(bs), 'wordTanpaPetunjukMetode': True, 'jsonTanpaPetunjukMetode': True}
(d / 'qa-naskah-ekspor.json').write_text(json.dumps(result, indent=2), encoding='utf-8')
print('PASS:', len(bs), 'soal Word/JSON tanpa petunjuk metode; pembahasan diperbolehkan memuat penjelasan.')
