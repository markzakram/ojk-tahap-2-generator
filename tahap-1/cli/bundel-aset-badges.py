"""Build the offline bundle from the user-supplied Badges manifest (Pillow required only here)."""
from pathlib import Path
from PIL import Image, ImageOps
from io import BytesIO
import base64, hashlib, json

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'bank_aset_badges'
rows = json.loads((SOURCE / 'manifest.json').read_text(encoding='utf-8-sig'))
data = {}
for row in rows:
    path = (SOURCE / row['file']).resolve()
    if not path.is_relative_to(SOURCE.resolve()):
        raise ValueError('Asset outside supplied bank: ' + row['file'])
    if row['asset_id'] in data:
        raise ValueError('Duplicate asset ID')
    im = Image.open(path).convert('RGBA')
    im.thumbnail((128, 128), Image.Resampling.LANCZOS)
    square = Image.new('RGB', (128, 128), 'white')
    square.paste(im, ((128-im.width)//2, (128-im.height)//2), im)
    buf = BytesIO(); square.save(buf, format='PNG', optimize=True)
    data[row['asset_id']] = dict(row, lebar=128, tinggi=128,
        sha256=hashlib.sha256(path.read_bytes()).hexdigest(),
        png=base64.b64encode(buf.getvalue()).decode('ascii'),
        rgb=base64.b64encode(square.tobytes()).decode('ascii'))
target = ROOT / 'js/bank-aset-badges-data.js'
target.write_text('/* Generated from bank_aset_badges/manifest.json. Do not edit by hand. */\n'
    '(function(r){var d='+json.dumps(data,ensure_ascii=False,separators=(',', ':'))+';'
    'if(typeof module==="object"&&module.exports)module.exports=d;else r.BankAsetBadgesData=d;'
    '})(typeof self!=="undefined"?self:this);\n', encoding='utf-8')
print(f'Bundled {len(rows)} fixed name/image pairs: {target.stat().st_size} bytes')
