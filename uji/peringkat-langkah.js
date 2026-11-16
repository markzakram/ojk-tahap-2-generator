'use strict';
var A=require('assert'),B=require('../js/bank'),P=require('../js/paket'),C=require('../js/cek-peringkat'),V=require('../js/validator');
var L=require('../js/peringkat-langkah'),D=require('../js/peringkat-data'),Profil=require('../js/profil-badges');
var E=require('../js/ekspor'),Doc=require('../js/dokumen'),S=require('./siadu'),Berkas=require('./berkas');
function cp(x){return JSON.parse(JSON.stringify(x));}
function modelContoh(){
  return {tipe:'posisi',nama:['Citra','Budi','Andi','Tiara','Lili','Dewi','Eko','Farhan'],jamPerHari:8,
    petunjuk:[[0,1,4],[1,2,2],[1,3,1],[4,1,3],[5,1,2],[5,6,5],[7,6,4]].reverse().map(function(x){return {jenis:'jarak',orang:x[0],lain:x[1],jarak:x[2]};})};
}
function butirContoh(){
  var b=B.buat('pn','peringkat',1,'sulit',20261027),m=modelContoh(),sol=C.pecahkan(m),jejak=L.susun(m);
  b.model=m;b.stimulus.teks=D.stimulus(m);b.pertanyaan=D.pertanyaan(m);
  b.isian.nama=m.nama.slice();b.isian.kartu=D.kartu(m);b.isian.pengantar=D.pengantar(m);b.isian.kunci.peringkat=sol.peringkat;
  b.kunciTeks=m.nama.map(function(_,i){return i;}).sort(function(a,b){return sol.peringkat[a]-sol.peringkat[b];}).map(function(i){return sol.peringkat[i]+'. '+m.nama[i];}).join('; ')+'.';
  b.pembahasan=['Diketahui'].concat(D.pengantar(m),['Semua petunjuk pada kartu nama digunakan bersama.','Ditanyakan',b.pertanyaan,'Pengerjaan'],jejak.teks,['Kesimpulan',b.kunciTeks,'Jawaban: '+b.kunciTeks]);
  b.gambarPembahasan=jejak.gambar;b.sidik={inti:JSON.stringify(m),param:sol.peringkat,entitas:m.nama.join('|')};
  return Profil.pasang(b);
}
function buatContoh(){
  var h=P.buat({materi:[{id:'pn-peringkat',jumlah:2}],proporsi:{mudah:0,sedang:0,sulit:1},benih:20261027}).hasil,st=h.paket[0].subtes[0];
  st.butir=st.butir.map(function(old,i){var b=i?B.buat('pn','peringkat',1,'sulit',20261027,{ragam:'jarak'}):butirContoh();return Object.assign(b,{no:old.no,id:old.id,paket:old.paket,tingkatNama:'Sulit'});});
  A(V.periksaHasil(h).lulus);return h;
}
async function jalankan(cek){
  async function uji(n,fn){try{await fn();cek(true,n);}catch(e){cek(false,n,e.stack||e.message);}}
  await uji('Visual posisi: contoh pengguna lengkap, urutan tiap langkah benar, final Citra sampai Eko',function(){
    var b=butirContoh(),g=b.gambarPembahasan;
    A.deepStrictEqual(V.periksaButir(b).masalah,[]);A.strictEqual(g.length,10);
    A.deepStrictEqual(g.slice(1,-1).map(function(x){return b.model.nama[x.model.baru];}),['Citra','Budi','Andi','Tiara','Lili','Dewi','Eko','Farhan']);
    A.deepStrictEqual(g[g.length-1].model.peringkat,[1,5,7,6,2,3,8,4]);
    A.deepStrictEqual(g[2].model.posisi,[0,4,null,null,null,null,null,null]);
  });
  await uji('Visual posisi: 90 variasi 4/6/8 orang, posisi negatif, tanpa membocorkan urutan, deterministik',function(){
    var negatif=false;
    for(var lv of ['mudah','sedang','sulit'])for(var seed=0;seed<30;seed++){
      var b=B.buat('pn','peringkat',1,lv,seed+20261027,{ragam:'jarak'}),gs=b.gambarPembahasan;A.deepStrictEqual(V.periksaButir(b).masalah,[]);
      A.deepStrictEqual(gs,L.susun(b.model).gambar);
      gs.slice(0,-1).forEach(function(g,k){A.strictEqual(g.model.posisi.filter(function(x){return x!=null;}).length,k);A(!('peringkat' in g.model));});
      negatif=negatif||gs.some(function(g){return g.model.posisi.some(function(x){return x<0;});});
    }
    A(negatif);
  });
  await uji('Visual posisi: kebocoran jawaban, jarak/arah salah, langkah hilang, posisi berubah, anchor tertukar ditolak',function(){
    var mutasi=[function(g){g[0].model.posisi[0]=0;},function(g){g[2].model.posisi[1]=-4;},function(g){g[3].model.posisi[0]=1;},function(g){g[2].model.jarak++;},function(g){g[2].model.acuan=7;},function(g){g[2].model.peringkat=[1,5,7,6,2,3,8,4];},function(g){g.splice(3,1);},function(g){g[2].setelah=g[3].setelah;},function(g){g[9].model.peringkat.reverse();}];
    mutasi.forEach(function(f){var b=cp(butirContoh());f(b.gambarPembahasan);A(!V.periksaButir(b).lulus);});
  });
  await uji('Visual posisi: Word/PDF menempelkan gambar pada langkah, JSON/Excel menyertakan semua PNG berurutan',async function(){
    var h=buatContoh(),p=h.paket[0],bs=p.subtes[0].butir,files=await E.berkasPaket(p,{docx:true,gambar:true});
    var doc=Buffer.from(files.find(function(f){return f.jenis==='docx';}).data);Berkas.periksaDocx(doc);A.deepStrictEqual(S.periksa(doc,bs,'latex'),[]);
    var js=JSON.parse(E.json(h)),db=js.paket[0].subtes[0].butir;
    db.forEach(function(b,i){b.gambarPembahasan.forEach(function(g,j){A.strictEqual(g.setelah,bs[i].gambarPembahasan[j].setelah);var f=files.find(function(f){return f.nama===g.berkas;});A(f);Berkas.periksaPng(Buffer.from(f.data));});});
    var excel=Buffer.from(await E.xlsx(h));Berkas.periksaXlsx(excel);
    var xml=Berkas.bacaZip(excel).filter(function(f){return f.nama.endsWith('.xml');}).map(function(f){return Berkas.lepasEntitas(f.data.toString());}).join('\n');
    db.forEach(function(b){b.gambarPembahasan.forEach(function(g){A(xml.includes(g.berkas));});});
    var blocks=Doc.dariPaket(p,function(b,g){return {lebar:1600,tinggi:620,skala:2,id:g.id};}).blok;
    bs.forEach(function(b){b.gambarPembahasan.forEach(function(g){var group=blocks.find(function(x){return x.t==='grup'&&x.anak.some(function(y){return y.t==='gambar'&&y.img.id===g.id;})&&x.anak.some(function(y){return (y.runs||[]).map(function(r){return r.teks;}).join('')===g.setelah;});});A(group,'Langkah terpisah dari gambar PDF: '+g.id);});});
  });
}
module.exports={jalankan:jalankan,butirContoh:butirContoh,buatContoh:buatContoh};
if(require.main===module){var gagal=0;jalankan(function(ok,n,d){console.log((ok?'ok ':'GAGAL ')+n+(d?'\n'+d:''));if(!ok)gagal++;}).then(function(){process.exitCode=gagal?1:0;});}
