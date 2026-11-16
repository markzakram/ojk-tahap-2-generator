'use strict';
var A=require('assert'),fs=require('fs'),path=require('path'),url=require('url'),Browser=require('./peramban');
var H=require('./peringkat-langkah'),S=require('./siadu'),Berkas=require('./berkas');
async function utama(){
  var h=H.buatContoh(),out=path.resolve('../hasil-badges-v17');fs.mkdirSync(out,{recursive:true});
  var p=await Browser.buka(url.pathToFileURL(path.resolve('index.html')).href,{lebar:1440,tinggi:1100});A(p);
  try{
    await p.evaluasi('window.fixtureLangkah='+JSON.stringify(h)+';AppOjk.state.hasil=fixtureLangkah;AppOjk.state.paket=1;document.getElementById("tampil-kunci").checked=true;AppOjk.tampilkanPaket();');
    var data=await p.evaluasi('('+async function(){
      var baik=fixtureLangkah.paket[0].subtes[0].butir.every(function(b){
        var card=document.getElementById('soal-'+b.id),panels=Array.from(card.querySelectorAll('.langkah-peringkat'));
        return panels.length===b.gambarPembahasan.length&&panels.every(function(w,i){return w.previousElementSibling.textContent===b.gambarPembahasan[i].setelah&&w.querySelector('svg').textContent.includes(b.gambarPembahasan[i].judul);});
      });
      var overflow=[];
      document.querySelectorAll('.langkah-peringkat svg').forEach(function(svg,i){svg.querySelectorAll('text').forEach(function(t){var box=t.getBBox();if(box.x<0||box.y<0||box.x+box.width>svg.viewBox.baseVal.width+1||box.y+box.height>svg.viewBox.baseVal.height+1)overflow.push({i:i,teks:t.textContent});});});
      var files=await Ekspor.berkasPaket(fixtureLangkah.paket[0],{docx:true}),data=files[0].data,s='';for(var i=0;i<data.length;i+=32768)s+=String.fromCharCode.apply(null,data.subarray(i,i+32768));
      return {baik:baik,overflow:overflow,docx:btoa(s)};
    }.toString()+')()');
    A(data.baik);A.deepStrictEqual(data.overflow,[]);
    var doc=Buffer.from(data.docx,'base64');A.deepStrictEqual(S.periksa(doc,h.paket[0].subtes[0].butir,'latex'),[]);A.strictEqual(Berkas.periksaDocx(doc).gambarDipakai,36);
    fs.writeFileSync(path.join(out,'qa-browser-langkah.docx'),doc);
    await p.evaluasi('document.querySelectorAll(".langkah-peringkat")[2].scrollIntoView({block:"center"});');
    await p.layar(path.join(out,'visual-posisi/pratinjau/generator-langkah.png'));
    await p.ukuran(390,844);A(await p.evaluasi('document.documentElement.scrollWidth<=innerWidth'));
    A.strictEqual(p.konsol.filter(function(x){return x.jenis==='error';}).length,0);
    console.log('HASIL: 20 gambar berurutan tepat setelah langkah, teks SVG tidak terpotong, Word 20 visual + 16 foto, mobile tanpa overflow, konsol tanpa error.');
  }finally{await p.tutup();}
}
utama().catch(function(e){console.error(e.stack);process.exitCode=1;});
