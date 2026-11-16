/* Satu pintu bank figural: tepat enam bentuk pada mapping 22 Oktober 2026.
 * Macam-Macam Transformasi Figural adalah pustaka pola, bukan bab soal ketujuh.
 * Modul lama tetap dapat dibaca untuk kompatibilitas berkas lama, tetapi hanya
 * penyusun yang tercantum di sini yang boleh masuk paket baru.
 */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./rng.js'),require('./figural.js'),require('./serial-ganda.js'),require('./matriks-latin.js'),require('./matriks-isi.js'),require('./matriks-sekat.js'),require('./serial-corak.js'),require('./pola-riset.js'));
  else root.RisetFigural=factory(root.Rng,root.Figural,root.SerialGanda,root.MatriksLatin,root.MatriksIsi,root.MatriksSekat,root.SerialCorak,root.PolaRiset);
})(typeof self!=='undefined'?self:this,function(Rng,F,G,L,I,S,C,P){
  'use strict';
  var DEFINISI=[
    {id:'serial',nama:'Figural Serial - The Next Box',lesson:'Bangun Datar',kolam:'serial',pdf:'01 The Next Box.pdf',halaman:[2,4,6,8,10,12]},
    {id:'serial-ganda',nama:'Figural Serial - The Next Double Box',lesson:'Bangun Datar',kolam:'serial',pdf:'Figural Serial - The Next Double Box.pdf',halaman:[3,5,7]},
    {id:'matriks-3',nama:'Figural Matriks - Kotak 3x3',lesson:'Bangun Datar',kolam:'matriks',pdf:'02 Matriks 3x3.pdf',halaman:[2,4,6]},
    {id:'matriks-sekat',nama:'Figural Matriks - Kotak 2x2 Bersekat',lesson:'Bangun Datar',kolam:'matriks',pdf:'Figural Serial - Kotak 2x2.pdf',halaman:[3,5,7]},
    {id:'matriks-latin',nama:'Figural Matriks - Kotak 5x5',lesson:'Bangun Datar',kolam:'matriks',pdf:'Figural Serial - Kotak 5x5.pdf',halaman:[3,5,7]},
    {id:'matriks-isi',nama:'Figural Matriks - Kotak 5x6',lesson:'Bangun Datar',kolam:'matriks',pdf:'Figural Serial - Kotak 5x6.pdf',halaman:[3,5,7]}
  ];
  var KELUARGA=DEFINISI.map(function(d){return {id:d.id,nama:d.nama,submateri:'figural',kolam:d.kolam};});
  var CORAK={
    putar:{mudah:['tetap-satu'],sedang:['tetap-utuh','lapis-diam'],sulit:['dua-arah','dua-langkah','berarah']},
    ganti:{mudah:['jalar'],sedang:['siklus-satu','jalar'],sulit:['siklus-putar','bentuk-putar','siklus-geser']}
  };
  function definisi(id){return DEFINISI.find(function(d){return d.id===id;});}
  function varian(id,level){
    if(id==='serial')return level==='mudah'?['jumlah-ukuran','corak-putar','corak-ganti']:['atribut','jumlah-ukuran','corak-putar','corak-ganti'];
    if(id==='serial-ganda')return ['kode'];
    if(id==='matriks-3')return level==='mudah'?['distribusi','gabung']:['distribusi','posisi','gabung'];
    if(id==='matriks-latin')return level==='mudah'?['latin']:['geser'];
    if(id==='matriks-isi')return ['distribusi','geser'];
    if(id==='matriks-sekat')return ['antar-kuadran'];
    return [];
  }
  function mapping(d){return {tes:'Tes Potensi Dasar (TPD)',subtes:'Kemampuan Umum',category:'Penalaran Spasial',lesson:d.lesson,chapter:d.nama,subchapter:null};}
  function halaman(id,v){
    if(id==='matriks-3')return v==='distribusi'?[4,5]:v==='posisi'?[2,3]:[6,7];
    if(id==='matriks-latin')return v==='latin'?[5,6]:[7,8];
    if(id==='matriks-isi')return v==='distribusi'?[5,6]:[7,8];
    if(id==='matriks-sekat')return [3,5,6];
    if(id==='serial-ganda')return [3,5,6];
    return definisi(id).halaman.slice();
  }
  function buat(id,level,seed,ops){
    ops=ops||{};var d=definisi(id);if(!d)return null;
    var a=Rng.alat(seed),vs=varian(id,level),v=ops.varianRiset;
    if(v&&vs.indexOf(v)<0)throw new Error('Variasi di luar batas riset: '+id+'/'+v);
    if(!v)v=a.pilih(vs);
    var b;
    if(id==='serial'){
      if(v==='atribut')b=F.buat(id,level,seed,ops);
      else if(v==='jumlah-ukuran')b=P.buat(id,level,seed,ops);
      else {
        var cat=v==='corak-putar'?'putar':'ganti';
        b=C.buat('serial-corak-'+cat,level,seed,Object.assign({},ops,{riset:true,polaBoleh:CORAK[cat][level]}));
      }
    }else if(id==='serial-ganda')b=G.buat(id,level,seed,ops);
    else if(id==='matriks-3')b=P.buat(id,level,seed,ops,v);
    else if(id==='matriks-latin')b=v==='latin'?L.buat(id,level,seed,Object.assign({},ops,{riset:true})):P.buat(id,level,seed,ops);
    else if(id==='matriks-isi')b=v==='distribusi'?I.buat(id,level,seed,ops):P.buat(id,level,seed,ops);
    else b=S.buat(id,level,seed,ops);
    if(!b)return null;
    b.keluarga=id;b.kategoriRiset='acuan';
    delete b.catatanRiset;
    b.riset={versi:1,bentuk:id,varian:v,acuan:d.pdf,halaman:halaman(id,v),pemetaan:mapping(d)};
    if(id==='serial')b.riset.transformasi={acuan:'00 Macam-Macam Transformasi Figural.pdf',halaman:[3,4,5,6,7,8,11,12,14,16,17,18]};
    if(id==='matriks-3'&&v==='gabung')b.riset.transformasi={acuan:'00 Macam-Macam Transformasi Figural.pdf',halaman:[20]};
    var errors=periksa(b);if(errors.length)throw new Error('Batas riset: '+errors.join('; '));
    return b;
  }
  function periksa(b){
    var m=[],d=definisi(b.keluarga),r=b.riset,model=b.model||{};
    if(!d)return ['Bentuk figural tidak termasuk enam bentuk riset.'];
    if(!r||r.versi!==1||r.bentuk!==d.id||r.acuan!==d.pdf||JSON.stringify(r.pemetaan)!==JSON.stringify(mapping(d)))return ['Identitas atau mapping riset figural tidak sesuai.'];
    if(varian(d.id,b.level).indexOf(r.varian)<0)m.push('Variasi atau tingkat berada di luar daftar riset.');
    if(JSON.stringify(r.halaman)!==JSON.stringify(halaman(d.id,r.varian)))m.push('Halaman sumber tidak cocok dengan variasi pola.');
    var allowed={serial:['serial','serial-corak-putar','serial-corak-ganti','pola-riset'],'serial-ganda':['serial-ganda'],'matriks-3':['pola-riset'],'matriks-latin':['matriks-latin','pola-riset'],'matriks-isi':['matriks-isi','pola-riset'],'matriks-sekat':['matriks-sekat']};
    if(allowed[d.id].indexOf(model.tipe)<0)m.push('Model gambar di luar bentuk riset yang dipilih.');
    if(model.tipe==='pola-riset'){
      var map={serial:['ukuran-putaran','jumlah-objek'],'matriks-3':['distribusi-bentuk-warna','posisi-dan-isian','penggabungan-unsur','pengurangan-unsur'],'matriks-latin':['geser-catur-dua-posisi'],'matriks-isi':['geser-kolom']};
      if(!map[d.id]||map[d.id].indexOf(model.varian)<0)m.push('Pola tidak diizinkan untuk bentuk ini.');
      var g=b.stimulus.gambar[0].model;
      if(g.grid){
        var rows=d.id==='matriks-3'?3:5,cols=d.id==='matriks-3'?3:d.id==='matriks-latin'?5:6;
        if(g.grid.length!==rows||g.grid.some(function(row){return row.length!==cols;}))m.push('Ukuran matriks tidak sesuai mapping.');
        if(d.id==='matriks-latin'&&g.lubang.length!==2)m.push('Matriks 5x5 dibatasi dua posisi kosong.');
        if(d.id==='matriks-isi'&&(g.lubang.length!==5||g.lubang.some(function(p,j){return p[0]!==j||p[1]!==g.lubang[0][1];})))m.push('Pola kolom 5x6 harus menutup satu kolom penuh.');
      }else if(!g.kotak||g.kotak.length<3||g.kotak.length>5)m.push('Serial harus memuat 4-6 kotak termasuk jawaban.');
    }
    if(model.tipe.indexOf('serial-corak-')===0){
      var cat=model.tipe==='serial-corak-putar'?'putar':'ganti',p=b.pola.slice(b.pola.indexOf(':')+1);
      if(CORAK[cat][b.level].indexOf(p)<0)m.push('Pola corak belum didukung riset.');
      if(model.kotak.some(function(f){return [4,8].indexOf(f.n)<0;}))m.push('Pembagian corak hanya 4 atau 8 bagian (langkah 90/45 derajat).');
    }
    if(model.tipe==='matriks-latin'){
      var l=model.lubang;if(!l||l.h!==2||l.w!==1||l.sel)m.push('Potongan 5x5 harus dua kotak vertikal.');
    }
    return m;
  }
  return {KELUARGA:KELUARGA,DEFINISI:DEFINISI,buat:buat,periksa:periksa,varian:varian};
});
