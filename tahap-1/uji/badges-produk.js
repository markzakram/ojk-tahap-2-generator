'use strict';
var A=require('assert'),B=require('../js/bank'),C=require('../js/cek-peringkat'),V=require('../js/validator');
var E=require('../js/ekspor'),P=require('../js/paket'),S=require('./siadu'),Berkas=require('./berkas');
function cp(x){return JSON.parse(JSON.stringify(x));}
function buatContoh(){
  var h=P.buat({materi:[{id:'pn-peringkat',jumlah:4}],proporsi:{mudah:1,sedang:1,sulit:0},benih:20261026}).hasil;
  var st=h.paket[0].subtes[0];
  st.butir=st.butir.map(function(old,i){
    var level=i%2===0?'sedang':'mudah',b=B.buat('pn','peringkat',4,level,20261026+i*100,{acuanAkademik:i===0});
    return Object.assign(b,{no:old.no,id:old.id,paket:old.paket,tingkatNama:level==='mudah'?'Mudah':'Sedang'});
  });
  A(V.periksaHasil(h).lulus,JSON.stringify(V.periksaHasil(h)));return h;
}
async function jalankan(cek){
  async function uji(n,fn){try{await fn();cek(true,n);}catch(e){cek(false,n,e.stack||e.message);}}
  await uji('Badges produk: data akademik tepat, laba bulanan E/A/D/F/C/B; jumlah dan laba per unit bukan kunci',function(){
    var b=B.buat('pn','peringkat',4,'sedang',1,{acuanAkademik:true});
    A.deepStrictEqual(b.isian.kartu.map(function(k){return k.petunjuk[0];}),['10.500|1,60','5.000|3,00','6.500|2,50','9.500|1,75','8.500|2,50','11.000|1,50'].map(function(x){var a=x.split('|');return 'Menjual '+a[0]+' unit/bulan dengan laba $'+a[1]+'/unit.';}));
    A.deepStrictEqual(C.pecahkan(b.model),{peringkat:[2,6,5,3,1,4],nilai:[16800,15000,16250,16625,21250,16500]});
    A.deepStrictEqual(b.isian.kunci.peringkat,[2,6,5,3,1,4]);A(V.periksaButir(b).lulus);
    A(!B.tingkatBoleh('pn','peringkat',4,'sulit'));A.strictEqual(B.buat('pn','peringkat',4,'sulit',1),null);
  });
  await uji('Badges produk: 200 variasi 6–8 entitas, kunci dari data tertulis, laba berbeda, tidak bocor dan mutasi ditolak',function(){
    for(var lv of ['mudah','sedang'])for(var seed=0;seed<100;seed++){
      var b=B.buat('pn','peringkat',4,lv,seed+1900);A(b);A.deepStrictEqual(V.periksaButir(b).masalah,[]);
      var nilai=b.isian.kartu.map(function(k){var m=k.petunjuk[0].match(/^Menjual ([\d.]+) unit\/bulan dengan laba \$(\d+),(\d{2})\/unit\.$/);A(m);return Number(m[1].replace(/\./g,''))*(Number(m[2])*100+Number(m[3]));});
      A(nilai.length>=6&&nilai.length<=8);A.strictEqual(new Set(nilai).size,nilai.length);var urut=nilai.slice().sort(function(a,b){return b-a;});
      A.deepStrictEqual(b.isian.kunci.peringkat,nilai.map(function(n){return urut.indexOf(n)+1;}));
      A(b.isian.awal.peringkat.every(function(n){return n===null;}));
      var wrong=cp(b);wrong.isian.kunci.peringkat.reverse();A(!V.periksaButir(wrong).lulus);
      wrong=cp(b);wrong.model.produk[0].unit++;A(!V.periksaButir(wrong).lulus);
      wrong=cp(b);wrong.isian.kartu[0].petunjuk[0]+=' tambahan';A(!V.periksaButir(wrong).lulus);
      wrong=cp(b);wrong.model.produk[0].labaPerUnitSen=0;A.throws(function(){C.pecahkan(wrong.model);});
      wrong=cp(b);wrong.model.produk[0]=cp(wrong.model.produk[1]);A.throws(function(){C.pecahkan(wrong.model);},/seri/);
      wrong=cp(b);wrong.pembahasan=wrong.pembahasan.map(function(t){return t.startsWith('Hasil '+b.model.nama[0]+':')?'Hasil '+b.model.nama[0]+': $0,00.':t;});A(!V.periksaButir(wrong).lulus);
    }
  });
  await uji('Badges produk: Word tabel SiAdu dengan gambar, Excel dan JSON mempertahankan angka, mapping serta seluruh kunci',async function(){
    var h=buatContoh(),bs=h.paket[0].subtes[0].butir,files=await E.berkasPaket(h.paket[0],{docx:true});
    files.forEach(function(f){A.deepStrictEqual(S.periksa(Buffer.from(f.data),bs,'latex'),[]);});
    var sheet=Berkas.periksaXlsx(Buffer.from(await E.xlsx(h))).Soal,head=sheet[0],json=JSON.parse(E.json(h)).paket[0].subtes[0].butir;
    bs.forEach(function(b,i){
      A.strictEqual(sheet[i+1][head.indexOf('chapter')],'Badges');A.strictEqual(sheet[i+1][head.indexOf('bentuk_soal')],'Logical Ranking');
      A.strictEqual(sheet[i+1][head.indexOf('category')],'Numerik/ Kuantitatif');A.strictEqual(sheet[i+1][head.indexOf('lesson')],'SHL Interaktif');
      A.strictEqual(sheet[i+1][head.indexOf('subchapter')],'');A.deepStrictEqual(json[i].isian,b.isian);A.deepStrictEqual(json[i].model,b.model);
      b.stimulus.teks.forEach(function(t){A(sheet[i+1][head.indexOf('soal')].includes(t));A(json[i].soal.includes(t));});
    });
  });
}
module.exports={jalankan:jalankan,buatContoh:buatContoh};
if(require.main===module){var gagal=0;jalankan(function(ok,n,d){console.log((ok?'ok ':'GAGAL ')+n+(d?'\n'+d:''));if(!ok)gagal++;}).then(function(){process.exitCode=gagal?1:0;});}
