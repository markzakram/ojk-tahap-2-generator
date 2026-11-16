'use strict';
var A=require('assert'),fs=require('fs'),path=require('path'),url=require('url'),Browser=require('./peramban');
var H=require('./siadu-badges'),S=require('./siadu'),Berkas=require('./berkas');
async function utama(){
  var h=H.buatContoh(),out=path.resolve('../hasil-badges-v16');fs.mkdirSync(out,{recursive:true});
  var p=await Browser.buka(url.pathToFileURL(path.resolve('index.html')).href,{lebar:1440,tinggi:1100});A(p);
  try{
    await p.evaluasi('window.fixtureBadges='+JSON.stringify(h)+';AppOjk.state.hasil=fixtureBadges;AppOjk.state.paket=1;AppOjk.tampilkanPaket();');
    var data=await p.evaluasi('('+async function(){
      var bs=fixtureBadges.paket[0].subtes[0].butir;
      document.querySelector('.soal .coba-buka').click();
      await Promise.all(Array.from(document.querySelectorAll('.peringkat-foto')).map(function(im){return im.decode();}));
      var baik=bs.filter(function(b){return b.isian.entitas!=='produk';}).every(function(b){
        var card=document.getElementById('soal-'+b.id),images=card.querySelectorAll('.peringkat-data .peringkat-foto');
        return images.length===b.isian.nama.length&&Array.from(images).every(function(im,i){return im.complete&&im.naturalWidth===256&&im.src===FotoBadges.url(b.isian.profil[i].id)&&im.alt.includes(b.isian.nama[i]);});
      });
      var files=await Ekspor.berkasPaket(fixtureBadges.paket[0],{docx:true}),data=files[0].data,s='';for(var i=0;i<data.length;i+=32768)s+=String.fromCharCode.apply(null,data.subarray(i,i+32768));
      return {baik:baik,docx:btoa(s)};
    }.toString()+')()');
    A(data.baik);var doc=Buffer.from(data.docx,'base64');A.deepStrictEqual(S.periksa(doc,h.paket[0].subtes[0].butir,'latex'),[]);
    var qc=Berkas.periksaDocx(doc);A.strictEqual(qc.gambarDipakai,36+h.paket[0].subtes[0].butir.reduce(function(n,b){return n+(b.gambarPembahasan||[]).length;},0));fs.writeFileSync(path.join(out,'qa-browser-siadu.docx'),doc);
    await p.layar(path.join(out,'contoh-siadu/pratinjau/generator-foto.png'));
    await p.ukuran(390,844);A(await p.evaluasi('document.documentElement.scrollWidth<=innerWidth'));
    A.strictEqual(p.konsol.filter(function(x){return x.jenis==='error';}).length,0);
    console.log('HASIL: foto/nama tampil cocok, 36 gambar di sel Word dari browser, struktur SiAdu lulus, layar 390 px tanpa overflow.');
  }finally{await p.tutup();}
}
utama().catch(function(e){console.error(e.stack);process.exitCode=1;});
