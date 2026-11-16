'use strict';
var A=require('assert'),B=require('../js/bank'),P=require('../js/paket'),V=require('../js/validator'),C=require('../js/cek-peringkat'),K=require('../js/cek-kartu-badges'),Bank=require('../js/bank-aset-badges');
function cp(x){return JSON.parse(JSON.stringify(x));}
function buatContoh(ringkas){
  var plan=[[0,'mudah','orang',0],[0,'sedang','produk',1],[0,'sulit','tumbuhan',2],[1,'mudah','kendaraan',2],[1,'mudah','orang',2,0],[1,'sedang','orang',2,1],[1,'sulit','orang',2,2],[1,'sedang','orang',0,0],[2,'sedang','perusahaan',0],[3,'sedang','hewan',0],[4,'mudah','produk',0],[4,'sedang','tumbuhan',0]];
  if(!ringkas)for(var i=12;i<50;i++){var f=i%5,lv=['mudah','sedang','sulit'][Math.floor(i/5)%3];if(f===4&&lv==='sulit')lv='sedang';plan.push([f,lv,Bank.KATEGORI[i%6],f<2?i%3:0]);}
  var counts={mudah:0,sedang:0,sulit:0};plan.forEach(function(x){counts[x[1]]++;});
  var h=P.buat({materi:[{id:'pn-peringkat',jumlah:plan.length}],proporsi:counts,benih:20261029}).hasil,p=h.paket[0],st=p.subtes[0];p.no=3;p.id='P003';
  st.butir=plan.map(function(x,i){var o={kategoriEntitas:x[2],deskripsiKosong:x[3],ragam:'jarak'};if(x[4]!=null){delete o.ragam;o.acuanShl=x[4];}var b=B.buat('pn','peringkat',x[0],x[1],20261029+i*1009,o);A(b);return Object.assign(b,{no:i+1,id:'P003-PN-'+String(i+1).padStart(2,'0'),paket:3,tingkatNama:x[1][0].toUpperCase()+x[1].slice(1)});});
  A(V.periksaHasil(h).lulus,JSON.stringify(V.periksaHasil(h)));return h;
}
async function jalankan(cek){
  async function uji(n,fn){try{await fn();cek(true,n);}catch(e){cek(false,n,e.stack||e.message);}}
  await uji('QC v22: 0/1/2 sel kosong pada logika 6–8 nama, petunjuk tetap lengkap dan solusi tunggal',function(){
    var seen=new Set();for(var f of [0,1])for(var lv of ['mudah','sedang','sulit'])for(var k of [0,1,2])for(var seed=0;seed<3;seed++){
      var b=B.buat('pn','peringkat',f,lv,20261029+seed,{kategoriEntitas:'orang',deskripsiKosong:k,ragam:'jarak'});
      A.deepStrictEqual(V.periksaButir(b).masalah,[]);A.strictEqual(b.isian.kartu.filter(function(c){return c.petunjuk[0]==='';}).length,k);seen.add(k);
      A.deepStrictEqual(C.pecahkan(K.modelDari(b)).peringkat,b.isian.kunci.peringkat);A.strictEqual(K.modelDari(b).petunjuk.length,b.model.petunjuk.length);
    }A.strictEqual(seen.size,3);
  });
  await uji('QC v22: 81 pola SHL Indonesia, tiga acuan/tingkat/kuota kosong; seluruh visual diaudit independen',function(){
    var n=0;for(var t=0;t<3;t++)for(var lv of ['mudah','sedang','sulit'])for(var k of [0,1,2])for(var seed=0;seed<3;seed++){
      var b=B.buat('pn','peringkat',1,lv,20261029+seed,{kategoriEntitas:'orang',acuanShl:t,deskripsiKosong:k});
      A.deepStrictEqual(V.periksaButir(b).masalah,[]);A.strictEqual(b.model.ragam,'shl');A.strictEqual(b.isian.kartu.filter(function(c){return !c.petunjuk[0];}).length,k);
      A.deepStrictEqual(C.pecahkan(K.modelDari(b)).peringkat,b.isian.kunci.peringkat);A(b.pertanyaan.includes('Pasangkan lencana '));A(!/higher|lower|employees|salary|arrival|\btop\b/i.test(b.stimulus.teks.join(' ')+b.pertanyaan));n++;
    }A.strictEqual(n,81);
  });
  await uji('QC v22: contoh gaji/kedatangan dihitung ulang; contoh kantor asli ambigu, relasi tambahan memberi satu jawaban',function(){
    function m(cs){return {tipe:'posisi',ragam:'shl',kategoriEntitas:'orang',nama:['Ali','Bagas','Cinta','Dika','Elvi','Farhan'],petunjuk:cs};}
    var salary=m([{jenis:'batas',orang:0,maks:3},{jenis:'batas',orang:3,maks:3},{jenis:'banding',orang:4,lain:2},{jenis:'banding',orang:2,lain:1},{jenis:'jika',syarat:{jenis:'tetap',orang:5,posisi:4},akibat:{jenis:'banding',orang:3,lain:4}},{jenis:'jarak',orang:4,lain:5,jarak:2},{jenis:'banding-jarak',orang:2,lain:0,dekat:3}]);
    A.deepStrictEqual(C.pecahkan(salary).peringkat,[1,6,4,2,3,5]);
    var arrival=m([{jenis:'paritas',orang:1,ganjil:true},{jenis:'banding',orang:0,lain:2},{jenis:'banding',orang:3,lain:4},{jenis:'banding',orang:4,lain:0},{jenis:'batas',orang:5,maks:3},{jenis:'mutlak',orang:5,lain:1,jarak:3}]);A.deepStrictEqual(C.pecahkan(arrival).peringkat,[4,5,6,1,3,2]);
    var office=m([{jenis:'mutlak',orang:0,lain:5,jarak:3},{jenis:'mutlak',orang:1,lain:3,jarak:3},{jenis:'banding',orang:5,lain:4},{jenis:'banding',orang:4,lain:1},{jenis:'minimum',orang:5,lain:3,jarak:2}]);A.throws(function(){C.pecahkan(office);},/lebih dari satu/);office.petunjuk.push({jenis:'banding',orang:2,lain:4});A.deepStrictEqual(C.pecahkan(office).peringkat,[4,6,2,3,5,1]);
    var conditional=m([0,1,2,3,4,5].map(function(i){return {jenis:'tetap',orang:i,posisi:i+1};}));conditional.petunjuk.push({jenis:'jika',syarat:{jenis:'tetap',orang:0,posisi:2},akibat:{jenis:'banding',orang:4,lain:1}});A.deepStrictEqual(C.pecahkan(conditional).peringkat,[1,2,3,4,5,6]);conditional.petunjuk.at(-1).syarat.posisi=1;A.throws(function(){C.pecahkan(conditional);},/bertentangan/);
  });
  await uji('QC v22: tiga sel kosong, petunjuk pertanyaan hilang, visual bocor dan kemungkinan palsu ditolak',function(){
    var b=B.buat('pn','peringkat',1,'sulit',20261029,{kategoriEntitas:'orang',acuanShl:1,deskripsiKosong:2});
    var x=cp(b),filled=x.isian.kartu.find(function(c){return c.petunjuk[0];});filled.petunjuk=[''];A.throws(function(){K.modelDari(x);},/dua/);A(!V.periksaButir(x).lulus);
    x=cp(b);x.pertanyaan='Pasangkan semua lencana.';A.throws(function(){K.modelDari(x);},/pertanyaan/);A(!V.periksaButir(x).lulus);
    [function(g){g[0].model.peringkat=b.isian.kunci.peringkat;},function(g){g[1].model.jumlah++;},function(g){g[1].model.kemungkinan[0]=[1];},function(g){g.splice(2,1);},function(g){g.at(-1).model.peringkat.reverse();}].forEach(function(f){x=cp(b);f(x.gambarPembahasan);A(!V.periksaButir(x).lulus);});
    var logis=B.buat('pn','peringkat',0,'mudah',20261029,{deskripsiKosong:0}),parsed=K.modelDari(logis);parsed.petunjuk=parsed.petunjuk.filter(function(c){return c.jenis!=='tetap';});parsed.petunjuk.pop();A.throws(function(){C.pecahkan(parsed);},/lebih dari satu/);
  });
}
module.exports={jalankan:jalankan,buatContoh:buatContoh};
if(require.main===module){var gagal=0;jalankan(function(ok,n,d){console.log((ok?'ok ':'GAGAL ')+n+(d?'\n'+d:''));if(!ok)gagal++;}).then(function(){process.exitCode=gagal?1:0;});}
