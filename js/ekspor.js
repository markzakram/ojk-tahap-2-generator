/*
 * ekspor.js — perakit berkas keluaran: gambar PNG, Word, PDF, Excel, JSON.
 *
 * Satu alur untuk CLI dan peramban:
 *
 *   1. setiap gambar butir (stimulus, opsi, kondisi kunci) dibuat SVG lalu dirasterkan
 *      sekali (`Raster`) menjadi piksel mentah dan PNG,
 *   2. `Dokumen` menyusun naskah dari gambar itu, `Docx` dan `Pdf` menulisnya,
 *   3. `Xlsx` dan JSON ditulis dari data hasil (satu berkas untuk semua paket).
 *
 * Nama berkas gambar tetap dan dapat ditebak: `paket-007/gambar/P007-KU-05-tabel.png`.
 * Kolom `berkas_gambar` pada Excel dan JSON memuat nama yang sama persis.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./gambar.js'), require('./dokumen.js'), require('./docx.js'), require('./pdf.js'),
      require('./xlsx.js'), require('./zip.js'), require('./raster.js'), require('./png.js'), require('./rumus.js'), require('./foto-badges.js'), require('./ikon-produk.js'),require('./bank-aset-badges.js'));
    module.exports = api;
  } else {
    api = factory(root.Gambar, root.Dokumen, root.Docx, root.Pdf, root.Xlsx, root.Zip, root.Raster, root.Png, root.Rumus, root.FotoBadges, root.IkonProduk,root.BankAsetBadges);
    root.Ekspor = api;
  }
})(typeof self !== 'undefined' ? self : this, function (Gambar, Dokumen, Docx, Pdf, Xlsx, Zip, Raster, Png, Rumus, FotoBadges, IkonProduk,Aset) {
  'use strict';

  var enc = new TextEncoder();

  function nomor(n, lebar) { var s = String(n); while (s.length < lebar) s = '0' + s; return s; }

  function folderPaket(paket) { return 'paket-' + nomor(paket.no, 3); }

  var SLUG_SUBTES = { ku: 'kemampuan-umum', pn: 'penalaran-numerik' };
  /** Nama berkas Word (format input SiAdu) satu subtes, mis. paket-001-kemampuan-umum.docx. */
  function namaWord(paket, subtes) { return 'paket-' + nomor(paket.no, 3) + '-' + (SLUG_SUBTES[subtes] || subtes) + '.docx'; }

  /** Nama berkas PNG sebuah gambar butir, relatif terhadap folder keluaran. */
  function namaGambar(paket, butir, desc) {
    return folderPaket(paket) + '/gambar/' + butir.id + '-' + desc.id + '.png';
  }

  // ---------------------------------------------------------------- gambar

  /** SVG -> { lebar, tinggi, kanal, raw, png, skala }. Hasil disimpan di `cache` menurut teks SVG. */
  function rasterGambar(desc, skala, cache) {
    if(desc.jenis==='aset-badges')return Promise.resolve(Aset.gambar(desc.model.id));
    if(desc.jenis==='foto-badges')return Promise.resolve(FotoBadges.gambar(desc.model.id));
    var svg = desc.jenis==='ikon-produk'?IkonProduk.svg(desc.model.indeks):Gambar.svg(desc).svg;
    var ada = cache && cache.get(svg);
    if (ada) return ada;
    var janji = Raster.svgKePiksel(svg, skala).then(function (raw) {
      return Png.kode(raw).then(function (png) {
        return { lebar: raw.lebar, tinggi: raw.tinggi, kanal: raw.kanal, raw: raw.data, png: png, skala: skala };
      });
    });
    if (cache) cache.set(svg, janji);
    return janji;
  }

  /**
   * Rasterkan seluruh gambar sebuah paket (soal dan pembahasan).
   * @returns {Promise<Map<string, object>>} kunci "idButir|idGambar"
   */
  function siapkanGambarPaket(paket, skala, cache, kemajuan) {
    var peta = new Map(), tugas = [];
    paket.subtes.forEach(function (st) {
      st.butir.forEach(function (b) {
        Gambar.daftarSoal(b).concat(Gambar.daftarPembahasan(b),Gambar.daftarLampiran(b)).forEach(function (d) { tugas.push({ b: b, d: d }); });
      });
    });
    var rantai = Promise.resolve(), selesai = 0;
    tugas.forEach(function (t) {
      rantai = rantai.then(function () { return rasterGambar(t.d, skala, cache); }).then(function (img) {
        peta.set(t.b.id + '|' + t.d.id, img);
        selesai++;
        if (kemajuan) kemajuan(selesai, tugas.length);
      });
    });
    return rantai.then(function () { return peta; });
  }

  // ------------------------------------------------------------ per paket

  /**
   * Berkas satu paket: Word, PDF, dan gambar PNG.
   * @param {object} paket
   * @param {object} opsi { docx:bool, pdf:bool, gambar:bool, skala:number, benih:number, cache:Map, kemajuan:fn }
   * @returns {Promise<Array<{nama:string, data:Uint8Array, jenis:string}>>}
   */
  function berkasPaket(paket, opsi) {
    opsi = opsi || {};
    var skala = opsi.skala || 2, cache = opsi.cache || new Map(), folder = folderPaket(paket), hasil = [];
    return siapkanGambarPaket(paket, skala, cache, opsi.kemajuan).then(function (peta) {
      var img = function (b, d) { return peta.get(b.id + '|' + d.id); };
      var model = Dokumen.dariPaket(paket, img, { benih: opsi.benih });
      var rantai = Promise.resolve();
      if (opsi.docx) {
        // Word mengikuti template input SiAdu, satu berkas per subtes; PDF tetap naskah baca satu paket
        Dokumen.siaduPaket(paket, img, { benih: opsi.benih, rumus: opsi.rumus }).forEach(function (m) {
          rantai = rantai.then(function () { return Docx.buat(m); }).then(function (u8) {
            hasil.push({ nama: folder + '/' + namaWord(paket, m.subtes), data: u8, jenis: 'docx', subtes: m.subtes });
          });
        });
      }
      if (opsi.pdf) {
        rantai = rantai.then(function () { return Pdf.buat(model); }).then(function (u8) {
          hasil.push({ nama: folder + '/paket-' + nomor(paket.no, 3) + '.pdf', data: u8, jenis: 'pdf' });
        });
      }
      return rantai.then(function () {
        if (opsi.gambar) {
          paket.subtes.forEach(function (st) {
            st.butir.forEach(function (b) {
              Gambar.daftarSoal(b).concat(Gambar.daftarPembahasan(b),Gambar.daftarLampiran(b)).forEach(function (d) {
                var im = img(b, d);
                if (im) hasil.push({ nama: namaGambar(paket, b, d), data: im.png, jenis: 'png' });
              });
            });
          });
        }
        if (!opsi.simpanCache && cache.clear && !opsi.cache) cache.clear();
        return hasil;
      });
    });
  }

  // ---------------------------------------------------------------- Excel

  var KOLOM = [
    ['no', 6], ['paket', 9], ['subtes', 18], ['submateri', 26], ['level', 9], ['soal', 72],
    ['opsi_a', 26], ['opsi_b', 26], ['opsi_c', 26], ['opsi_d', 26], ['opsi_e', 26],
    ['jawaban_benar', 22], ['pembahasan', 86], ['berkas_gambar', 44],
    ['id', 14], ['benih', 12], ['keluarga', 20], ['bentuk_isian', 48], ['kunci_isian', 40], ['berkas_gambar_pembahasan', 40],
    ['pola', 22], ['kategori_riset', 14], ['catatan_riset', 60],
    ['category', 24], ['lesson', 26], ['chapter', 48], ['subchapter', 38], ['naskah_lengkap', 100], ['acuan_figural', 48], ['mapping_figural', 90], ['bentuk_soal', 22]
  ];

  function barisExcel(paket, st, b) {
    var gSoal = Gambar.daftarSoal(b).concat(Gambar.daftarLampiran(b)).map(function (d) { return namaGambar(paket, b, d); });
    var gPem = Gambar.daftarPembahasan(b).map(function (d) { return namaGambar(paket, b, d); });
    var opsi = [];
    for (var i = 0; i < 5; i++) {
      opsi.push(b.opsi[i] ? Dokumen.teksOpsi(b, i, function (d) { return namaGambar(paket, b, d); }) : '');
    }
    var pembahasan = b.pembahasan.map(function (t) { return Rumus.barisLatex(t); }).join('\n');
    if (b.submateri === 'verbal' && b.pembahasanVerbal) {
      var runs = [];
      b.pembahasan.forEach(function(t,j){
        if(j) runs.push({teks:'\n'});
        runs = runs.concat(Dokumen.runsPembahasan(b,t));
      });
      pembahasan = { runs: runs };
    }
    return [
      b.no, paket.id, st.nama, b.submateriLabel || b.submateri, b.tingkatNama || b.level,
      Dokumen.teksSoal(b), opsi[0], opsi[1], opsi[2], opsi[3], opsi[4],
      Dokumen.jawabanBenar(b), pembahasan, gSoal.join('; '),
      b.id, b.benih, b.keluarga, Dokumen.bentukIsian(b), b.jenis === 'isian' ? JSON.stringify(b.isian.kunci) : '', gPem.join('; '),
      b.pola || '', b.kategoriRiset || '', b.catatanRiset || '',
      (b.klasifikasi || {}).category || '', (b.klasifikasi || {}).lesson || '', (b.klasifikasi || {}).chapter || '', (b.klasifikasi || {}).subchapter || '', Dokumen.naskahLengkap(b),
      b.riset ? b.riset.acuan + ' (halaman ' + b.riset.halaman.join(', ') + ')' : '', b.riset ? JSON.stringify(b.riset.pemetaan) : '', Dokumen.bentukSiadu(b)
    ];
  }

  function lembarRingkasan(hasil) {
    var baris = [];
    hasil.paket.forEach(function (p) {
      p.subtes.forEach(function (st) {
        var per = {};
        st.butir.forEach(function (b) {
          var k = b.submateriLabel || b.submateri;
          per[k] = per[k] || { mudah: 0, sedang: 0, sulit: 0 };
          per[k][b.level]++;
        });
        Object.keys(per).forEach(function (k) {
          baris.push([p.id, st.nama, k, per[k].mudah, per[k].sedang, per[k].sulit, per[k].mudah + per[k].sedang + per[k].sulit]);
        });
      });
    });
    return { nama: 'Ringkasan', kolom: [{ judul: 'paket', lebar: 10 }, { judul: 'subtes', lebar: 20 }, { judul: 'submateri', lebar: 28 }, { judul: 'mudah', lebar: 9 }, { judul: 'sedang', lebar: 9 }, { judul: 'sulit', lebar: 9 }, { judul: 'jumlah', lebar: 9 }], baris: baris };
  }

  /** @returns {Promise<Uint8Array>} satu berkas .xlsx untuk seluruh paket */
  function xlsx(hasil) {
    var baris = [];
    hasil.paket.forEach(function (p) {
      p.subtes.forEach(function (st) { st.butir.forEach(function (b) { baris.push(barisExcel(p, st, b)); }); });
    });
    var soal = { nama: 'Soal', kolom: KOLOM.map(function (k) { return { judul: k[0], lebar: k[1] }; }), baris: baris };
    return Xlsx.buat([soal, lembarRingkasan(hasil)]);
  }

  // ----------------------------------------------------------------- JSON

  /**
   * Seluruh hasil sebagai JSON. Gambar dicatat dengan nama berkas dan modelnya;
   * SVG-nya hanya ikut bila `opsi.svg` benar (ukurannya besar).
   */
  function json(hasil, opsi, validasi) {
    opsi = opsi || {};
    function desk(paket, b, d) {
      var o = { id: d.id, jenis: d.jenis, judul: d.judul || null, berkas: namaGambar(paket, b, d), model: d.model };
      if (d.state) o.state = d.state;
      if (d.setelah) o.setelah = d.setelah;
      if (d.mulai) o.mulai = d.mulai;
      if (opsi.svg) o.svg = d.jenis==='foto-badges'?'<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><image width="256" height="256" href="'+FotoBadges.url(d.model.id)+'"/></svg>':d.jenis==='ikon-produk'?IkonProduk.svg(d.model.indeks):Gambar.svg(d).svg;
      return o;
    }
    var keluaran = {
      meta: Object.assign({ pembuat: 'Generator Soal OJK PCAM Tahap 1' }, hasil.meta),
      validator: validasi ? { lulus: validasi.lulus, butir: validasi.butir, butirLulus: validasi.butirLulus, kembar: validasi.kembar.length, sebaran: validasi.sebaran } : null,
      paket: hasil.paket.map(function (p) {
        return {
          no: p.no, id: p.id, benih: p.benih, mode: p.mode || 'tryout',
          subtes: p.subtes.map(function (st) {
            return {
              kode: st.kode, nama: st.nama, jumlah: st.jumlah, menit: st.menit, komposisi: st.komposisi,
              butir: st.butir.map(function (b) {
                return {
                  id: b.id, no: b.no, paket: b.paket, subtes: b.subtes, submateri: b.submateri, submateriNama: b.submateriNama,
                  komposisi: b.submateriKomposisi, keluarga: b.keluarga, level: b.level, tingkat: b.tingkatNama, benih: b.benih, jenis: b.jenis,
                  pola: b.pola || null, kategoriRiset: b.kategoriRiset || null, catatanRiset: b.catatanRiset || null, klasifikasi: b.klasifikasi || null, riset: b.riset || null,
                  soal: Dokumen.teksSoal(b),
                  bentukSoal: Dokumen.bentukSiadu(b),
                  naskah_lengkap: Dokumen.naskahLengkap(b),
                  stimulus: { judul: b.stimulus.judul, teks: b.stimulus.teks, kartu: b.stimulus.kartu || null, gambar: (b.stimulus.gambar || []).map(function (d) { return desk(p, b, d); }) },
                  pertanyaan: b.pertanyaan, perintah: b.perintah,
                  opsi: b.opsi.map(function (o) { return { huruf: o.huruf, teks: o.teks, alasan: o.alasan, gambar: o.gambar ? desk(p, b, o.gambar) : null }; }),
                  kunci: b.jenis === 'pg' ? Dokumen.HURUF[b.kunci] : null,
                  jawabanBenar: Dokumen.jawabanBenar(b),
                  isian: b.isian || null, gambarIsian: Gambar.daftarLampiran(b).map(function(d){return desk(p,b,d);}), bentukIsian: b.jenis === 'isian' ? Dokumen.bentukIsian(b) : null,
                  langkah: b.langkah, pembahasan: b.pembahasan.map(function (t) { return Rumus.barisLatex(t); }), pembahasanVerbal: b.pembahasanVerbal || null,
                  gambarPembahasan: (b.gambarPembahasan || []).map(function (d) { return desk(p, b, d); }),
                  model: b.model, sidik: b.sidik
                };
              })
            };
          })
        };
      })
    };
    return JSON.stringify(keluaran, null, opsi.rapi === false ? 0 : 1);
  }

  /** Ringkasan teks hasil + validator, satu baris per hal. */
  function ringkasan(hasil, validasi) {
    var jml = validasi.butir, per = validasi.sebaran;
    var sub = Object.keys(per.submateri).sort().map(function (k) { return k + '=' + per.submateri[k]; }).join(', ');
    var lv = ['mudah', 'sedang', 'sulit'].map(function (l) { return l + '=' + (per.level[l] || 0); }).join(', ');
    var kunci = ['A', 'B', 'C', 'D', 'E'].map(function (h) { return h + '=' + (per.kunci[h] || 0); }).join(', ');
    return [
      hasil.paket.length + ' paket, ' + jml + ' butir, validator lulus ' + validasi.butirLulus + '/' + jml + (validasi.kembar.length ? ', kembar ' + validasi.kembar.length : ', 0 kembar'),
      'submateri: ' + sub, 'tingkat: ' + lv, 'kunci A-E: ' + kunci
    ];
  }

  return {
    nomor: nomor, folderPaket: folderPaket, namaGambar: namaGambar, namaWord: namaWord, rasterGambar: rasterGambar,
    siapkanGambarPaket: siapkanGambarPaket, berkasPaket: berkasPaket, xlsx: xlsx, json: json, ringkasan: ringkasan,
    barisExcel: barisExcel, KOLOM: KOLOM, enc: enc
  };
});
