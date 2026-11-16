'use strict';
var A=require('assert'),fs=require('fs'),path=require('path'),url=require('url'),Browser=require('./peramban'),H=require('./qc-badges-kosong');
async function utama(){
  var h=H.buatContoh(true),out=path.resolve('../hasil-badges-v23/pratinjau');fs.mkdirSync(out,{recursive:true});
  var p=await Browser.buka(url.pathToFileURL(path.resolve('index.html')).href,{lebar:1600,tinggi:1100});A(p);
  try{
    await p.evaluasi('window.qcBadges='+JSON.stringify(h)+';AppOjk.state.hasil=qcBadges;AppOjk.state.paket=1;document.getElementById("tampil-kunci").checked=true;AppOjk.tampilkanPaket();');
    var result=await p.evaluasi('('+async function(){
      var bs=qcBadges.paket[0].subtes[0].butir,issues=[],clipped=[],kosong={0:0,1:0,2:0};
      bs.forEach(function(b){var card=document.getElementById('soal-'+b.id),rows=Array.from(card.querySelectorAll('.badges-baris'));
        if(rows.length!==b.isian.nama.length)issues.push('Jumlah kartu '+b.id);
        if(rows.length<6||rows.length>8)issues.push('Batas variabel '+b.id);
        var blank=rows.filter(function(row){return !row.querySelector('.badges-deskripsi').textContent;}).length;if(blank>2)issues.push('Lebih dari dua sel kosong '+b.id);else kosong[blank]++;
        rows.forEach(function(row,i){var desc=row.querySelector('.badges-deskripsi'),img=row.querySelector('img');if(desc.textContent!==b.isian.kartu[i].petunjuk[0])issues.push('Isi deskripsi '+b.id+'/'+i);if(desc.scrollWidth>desc.clientWidth+1||desc.scrollHeight>desc.clientHeight+1||getComputedStyle(desc).whiteSpace!=='nowrap'||getComputedStyle(desc).fontSize!=='14px')issues.push('Deskripsi satu baris '+b.id+'/'+i);if(/[=]|Kode nama|\b[JHBWUL]\([A-Z]\)/.test(desc.textContent))issues.push('Kode/persamaan '+b.id+'/'+i);if(img.src!==BankAsetBadges.url(b.isian.profil[i].id)||img.alt!==b.isian.nama[i])issues.push('Identitas '+b.id+'/'+i);});
        var panels=Array.from(card.querySelectorAll('.langkah-peringkat'));if(panels.length!==b.gambarPembahasan.length)issues.push('Jumlah diagram '+b.id);
        panels.forEach(function(panel,j){if(panel.previousElementSibling.textContent!==b.gambarPembahasan[j].setelah)issues.push('Urutan '+b.id+'/'+j);var svg=panel.querySelector('svg'),vb=svg.viewBox.baseVal;svg.querySelectorAll('text').forEach(function(t){var r=t.getBBox();if(r.x<0||r.y<0||r.x+r.width>vb.width+1||r.y+r.height>vb.height+1)clipped.push({id:b.id,j:j,teks:t.textContent,box:[r.x,r.y,r.width,r.height],uk:[vb.width,vb.height]});});var assets=Array.from(svg.querySelectorAll('image[data-aset-badges]'));if(!assets.length)issues.push('Diagram tanpa aset '+b.id+'/'+j);assets.forEach(function(im){var id=im.getAttribute('data-aset-badges');if(!b.isian.profil.some(function(p){return p.id===id;})||im.getAttribute('href')!==BankAsetBadges.url(id))issues.push('Aset diagram '+id);});});
      });
      document.querySelector('.soal .coba-buka').click();var widget=document.querySelector('.wadah-coba');widget.kendaliCoba.kunci();if(!widget.kendaliCoba.periksa().benar)issues.push('Kunci interaktif');
      await Promise.all(Array.from(document.querySelectorAll('.badges-baris img')).map(function(im){return im.decode();}));
      return {issues:issues,clipped:clipped,soal:bs.length,kartu:document.querySelectorAll('.badges-baris').length,kosong:kosong};
    }.toString()+')()');
    fs.writeFileSync(path.join(out,'qa-browser.json'),JSON.stringify(result,null,2));A.deepStrictEqual(result.issues,[]);A.deepStrictEqual(result.clipped,[]);
    A(Object.values(result.kosong).every(function(n){return n>0;}));
    for(var no of [1,3,4,5,6,7,8,10,11,12]){await p.evaluasi('document.getElementById("soal-'+h.paket[0].subtes[0].butir[no-1].id+'").scrollIntoView({block:"start"});');await p.layar(path.join(out,'generator-soal-'+no+'.png'));}
    await p.evaluasi('document.getElementById("soal-'+h.paket[0].subtes[0].butir[4].id+'").querySelectorAll(".langkah-peringkat")[2].scrollIntoView({block:"center"});');await p.layar(path.join(out,'visual-kemungkinan-shl.png'));
    await p.ukuran(390,844);A(await p.evaluasi('document.documentElement.scrollWidth<=innerWidth'));A(!p.konsol.some(function(x){return x.jenis==='error';}),JSON.stringify(p.konsol));
    console.log('HASIL: '+result.soal+' soal / '+result.kartu+' kartu, variasi sel kosong '+JSON.stringify(result.kosong)+'; narasi Indonesia, nama, aset, diagram, interaksi dan mobile lulus.');
  }finally{await p.tutup();}
}
utama().catch(function(e){console.error(e.stack);process.exitCode=1;});
