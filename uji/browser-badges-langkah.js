'use strict';
var A=require('assert'),fs=require('fs'),path=require('path'),url=require('url'),Browser=require('./peramban');
var H=require('./badges-langkah'),S=require('./siadu'),Berkas=require('./berkas');
async function utama(){
  var h=H.buatContoh(),out=path.resolve('../hasil-badges-v19'),preview=path.join(out,'semua-fam-visual/pratinjau');fs.mkdirSync(preview,{recursive:true});
  var p=await Browser.buka(url.pathToFileURL(path.resolve('index.html')).href,{lebar:1440,tinggi:1100});A(p);
  try{
    await p.evaluasi('window.fixtureBadgesVis='+JSON.stringify(h)+';AppOjk.state.hasil=fixtureBadgesVis;AppOjk.state.paket=1;document.getElementById("tampil-kunci").checked=true;AppOjk.tampilkanPaket();');
    var data=await p.evaluasi('('+async function(){
      var bs=fixtureBadgesVis.paket[0].subtes[0].butir,baik=bs.every(function(b){
        var panels=Array.from(document.getElementById('soal-'+b.id).querySelectorAll('.langkah-peringkat'));
        return panels.length===b.gambarPembahasan.length&&panels.every(function(w,i){return w.previousElementSibling.textContent===b.gambarPembahasan[i].setelah&&w.querySelector('svg').textContent.includes(b.gambarPembahasan[i].judul);});
      });
      var overflow=[];
      document.querySelectorAll('.langkah-peringkat svg').forEach(function(svg,i){var vw=svg.viewBox.baseVal;svg.querySelectorAll('text').forEach(function(t){var box=t.getBBox();if(box.x<0||box.y<0||box.x+box.width>vw.width+1||box.y+box.height>vw.height+1)overflow.push({i:i,teks:t.textContent,box:[box.x,box.y,box.width,box.height],vw:[vw.width,vw.height]});});});
      var files=await Ekspor.berkasPaket(fixtureBadgesVis.paket[0],{docx:true}),data=files[0].data,s='';for(var i=0;i<data.length;i+=32768)s+=String.fromCharCode.apply(null,data.subarray(i,i+32768));
      return {baik:baik,overflow:overflow,docx:btoa(s)};
    }.toString()+')()');
    A(data.baik);A.deepStrictEqual(data.overflow,[]);
    var bs=h.paket[0].subtes[0].butir,doc=Buffer.from(data.docx,'base64');A.deepStrictEqual(S.periksa(doc,bs,'latex'),[]);
    var expected=bs.reduce(function(n,b){return n+b.isian.nama.length+b.gambarPembahasan.length;},0);A.strictEqual(Berkas.periksaDocx(doc).gambarDipakai,expected);fs.writeFileSync(path.join(out,'qa-browser-semua-fam.docx'),doc);
    for(var i=0;i<5;i++){
      var b=bs[i],idx=i===3?b.gambarPembahasan.findIndex(function(g){return g.model.tahap==='orang';}):Math.min(2,b.gambarPembahasan.length-1);
      await p.evaluasi('document.getElementById("soal-'+b.id+'").querySelectorAll(".langkah-peringkat")['+idx+'].scrollIntoView({block:"center"});');await p.layar(path.join(preview,'generator-'+b.keluarga+'.png'));
    }
    await p.ukuran(390,844);A(await p.evaluasi('document.documentElement.scrollWidth<=innerWidth'));A.strictEqual(p.konsol.filter(function(x){return x.jenis==='error';}).length,0);
    console.log('HASIL: kelima keluarga tampil; '+bs.reduce(function(n,b){return n+b.gambarPembahasan.length;},0)+' visual tepat setelah langkah, teks SVG utuh, Word '+expected+' gambar, mobile tanpa overflow, konsol tanpa error.');
  }finally{await p.tutup();}
}
utama().catch(function(e){console.error(e.stack);process.exitCode=1;});
