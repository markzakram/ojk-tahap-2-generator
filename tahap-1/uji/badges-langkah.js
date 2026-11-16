'use strict';
var A=require('assert'),B=require('../js/bank'),P=require('../js/paket'),V=require('../js/validator'),L=require('../js/badges-langkah');
var E=require('../js/ekspor'),D=require('../js/dokumen'),S=require('./siadu'),Berkas=require('./berkas');
function cp(x){return JSON.parse(JSON.stringify(x));}
function buatContoh(){
  var h=P.buat({materi:[{id:'pn-peringkat',jumlah:5}],proporsi:{mudah:0,sedang:4,sulit:1},benih:20261027}).hasil,st=h.paket[0].subtes[0];
  st.butir=st.butir.map(function(old,i){var lv=i===1?'sulit':'sedang',b=i===1?require('./peringkat-langkah').butirContoh():B.buat('pn','peringkat',i,lv,20261027+i*1000,{acuanAkademik:i===4});return Object.assign(b,{no:old.no,id:old.id,paket:old.paket,tingkatNama:i===1?'Sulit':'Sedang'});});
  A(V.periksaHasil(h).lulus,JSON.stringify(V.periksaHasil(h)));return h;
}
async function jalankan(cek){
  async function uji(n,fn){try{await fn();cek(true,n);}catch(e){cek(false,n,e.stack||e.message);}}
  await uji('Visual semua Badges: 280 variasi, seluruh keluarga/tingkat, tahap awal sampai final dan rujukan sah',function(){
    var jumlah=0;
    for(var fam=0;fam<5;fam++)for(var lv of ['mudah','sedang','sulit'])if(fam!==4||lv!=='sulit')for(var seed=0;seed<20;seed++){
      var b=B.buat('pn','peringkat',fam,lv,20261027+seed);A.deepStrictEqual(V.periksaButir(b).masalah,[]);jumlah++;
      var gs=b.gambarPembahasan;A.strictEqual(gs[0].model.tahap,'awal');A.strictEqual(gs[gs.length-1].model.tahap,'akhir');A.deepStrictEqual(gs[gs.length-1].model.peringkat,b.isian.kunci.peringkat);
      gs.slice(0,-1).forEach(function(g){A(!('peringkat' in g.model));A(!('urutan' in g.model));});
    }
    A.strictEqual(jumlah,280);
  });
  await uji('Visual perbandingan: dua rantai terpisah tetap terpisah hingga ada petunjuk penghubung',function(){
    var m={tipe:'perbandingan',nama:['Andi','Budi','Citra','Dewi'],petunjuk:[[0,1],[2,3],[1,2]].map(function(x){return {jenis:'banding',orang:x[0],lain:x[1],balik:false};})};
    var gs=L.susun(m).gambar;A.deepStrictEqual(gs[2].model.rantai,[[0,1],[2,3]]);A.deepStrictEqual(gs[3].model.rantai,[[0,1,2,3]]);A.deepStrictEqual(gs[4].model.peringkat,[1,2,3,4]);
  });
  await uji('Keuntungan mingguan: satu langkah per orang mengisi empat kolom sekaligus, rujukan mendahului pemakai',function(){
    for(var lv of ['mudah','sedang','sulit'])for(var seed=0;seed<15;seed++){
      var b=B.buat('pn','peringkat',3,lv,20261027+seed),gs=b.gambarPembahasan,n=b.model.nama.length,done=new Set();
      A.strictEqual(gs.length,n+2);A.strictEqual(gs.filter(function(g){return g.model.tahap==='orang';}).length,n);
      gs.slice(1,-1).forEach(function(g,k){var o=g.model.operasi,i=o.orang;A(!done.has(i));A.strictEqual(o.hitung.length,3);A.strictEqual(Object.keys(g.model.nilai).length,4*(k+1));
        o.hitung.forEach(function(op){if(op.acuan){var ref=Number(op.acuan.split('_')[1]);A(ref===i||done.has(ref),'Rujukan orang belum selesai');}});done.add(i);
        for(var j=0;j<n;j++)for(var f of ['q','p','c','l'])A.strictEqual(g.model.nilai[f+'_'+j]!=null,done.has(j),'Baris orang terisi sebagian');
      });A.strictEqual(done.size,n);
      [function(g){g[1].model.operasi.hitung.pop();},function(g){g[1].model.kolomBaru.pop();},function(g){g[1].model.operasi.hitung[0].hasil++;},function(g){g[1].model.nilai['p_'+g[1].model.operasi.orang]++;}].forEach(function(mutasi){var wrong=cp(b);mutasi(wrong.gambarPembahasan);A(!V.periksaButir(wrong).lulus);});
    }
  });
  await uji('Visual hitungan: contoh waktu dan keuntungan pengguna serta produk akademik memberi nilai eksak',function(){
    var nama=['Andi','Budi','Lili','Eko','Tiara','Farhan'],pet=[{jenis:'nilai',bidang:'t',orang:5,nilai:40},{jenis:'nilai',bidang:'t',orang:2,nilai:3,hari:true}];
    [[3,'t_2',1,1,12],[4,'t_5',3,5,8],[1,'t_4',7,8,5],[0,'t_5',1,1,-6]].forEach(function(x){pet.push({jenis:'turunan',orang:x[0],bidang:'t',ref:x[1],num:x[2],den:x[3],tambah:x[4]});});
    var gs=L.susun({tipe:'waktu',nama:nama,jamPerHari:8,petunjuk:pet}).gambar,v=gs[gs.length-1].model;
    A.deepStrictEqual(nama.map(function(_,i){return v.nilai['t_'+i];}),[34,33,24,36,32,40]);A.deepStrictEqual(v.peringkat,[4,3,1,5,2,6]);
    var m={tipe:'laba',nama:nama,jamPerHari:8,petunjuk:[]};
    function nilai(i,f,v){m.petunjuk.push({jenis:'nilai',orang:i,bidang:f,nilai:v});}
    function rel(i,f,ref,num,den,persen){m.petunjuk.push({jenis:'turunan',orang:i,bidang:f,ref:ref,num:num,den:den,tambah:0,persen:!!persen});}
    rel(0,'q','q_5',3,5);rel(0,'p','p_5',4,5);nilai(0,'c',18);
    nilai(1,'q',120);nilai(1,'p',35);rel(1,'c','p_1',80,100,true);
    rel(2,'q','q_4',4,5);rel(2,'p','p_4',80,100,true);nilai(2,'c',22);
    nilai(3,'q',90);nilai(3,'p',30);rel(3,'c','p_3',3,5);
    nilai(4,'q',150);nilai(4,'p',30);nilai(4,'c',20);
    rel(5,'q','q_1',5,4);nilai(5,'p',40);rel(5,'c','p_5',5,8,true);
    gs=L.susun(m).gambar;v=gs[gs.length-1].model;
    A.deepStrictEqual(nama.map(function(_,i){return v.nilai['l_'+i];}),[1260,840,240,1080,1500,2250]);A.deepStrictEqual(v.peringkat,[3,5,6,4,2,1]);
    var selesai={};gs.forEach(function(g){var o=g.model.operasi;if(!o)return;(o.hitung||[o]).forEach(function(op){if(op.acuan)A.strictEqual(op.masukan,selesai[op.acuan]);if(op.bidang)selesai[op.bidang+'_'+op.orang]=op.hasil;});selesai[g.model.baru]=o.hasil;});
    var b=B.buat('pn','peringkat',4,'sedang',1,{acuanAkademik:true}),last=b.gambarPembahasan.at(-1).model;
    A.deepStrictEqual(b.model.nama.map(function(_,i){return last.nilai['l_'+i];}),[16800,15000,16250,16625,21250,16500]);A.deepStrictEqual(last.peringkat,[2,6,5,3,1,4]);
  });
  await uji('Visual semua Badges: gambar hilang, bocor, operasi salah, hasil lama berubah dan urutan salah ditolak',function(){
    for(var fam of [0,2,3,4]){
      var src=B.buat('pn','peringkat',fam,'sedang',20261027);
      var mutasi=[function(g){g.splice(2,1);},function(g){g[0].model.nilai['l_0']=99;},function(g){g[1].model.peringkat=[1,2,3,4,5,6];},function(g){g[2].setelah=g[1].setelah;},function(g){g.at(-1).model.peringkat.reverse();}];
      if(fam===0)mutasi.push(function(g){g[1].model.rantai.reverse();g[1].model.rantai[0].reverse();});
      else mutasi.push(function(g){g[1].model.operasi.hasil++;},function(g){g[2].model.nilai[g[1].model.baru]++;});
      mutasi.forEach(function(f){var b=cp(src);f(b.gambarPembahasan);A(!V.periksaButir(b).lulus,'Mutasi lolos '+fam);});
    }
  });
  await uji('Visual semua Badges: Word dua mode, PDF, Excel, JSON dan PNG mempertahankan setiap langkah',async function(){
    var h=buatContoh(),p=h.paket[0],bs=p.subtes[0].butir,js=JSON.parse(E.json(h));
    var files=await E.berkasPaket(p,{docx:true,gambar:true});
    A.deepStrictEqual(S.periksa(Buffer.from(files.find(function(f){return f.jenis==='docx';}).data),bs,'latex'),[]);
    var equation=await E.berkasPaket(p,{docx:true,rumus:'equation'});A.deepStrictEqual(S.periksa(Buffer.from(equation[0].data),bs,'equation'),[]);
    var xml=Berkas.bacaZip(Buffer.from(equation[0].data)).find(function(f){return f.nama==='word/document.xml';}).data.toString('utf8');
    var mulai=new Set(bs.flatMap(function(b){return b.gambarPembahasan.filter(function(g){return g.mulai;}).map(function(g){return g.mulai;});}));
    var selesai=new Set(bs.flatMap(function(b){return b.gambarPembahasan.filter(function(g){return g.mulai;}).map(function(g){return g.setelah;});})),aktif=false,terjaga=0;
    (xml.match(/<w:p[ >][\s\S]*?<\/w:p>/g)||[]).forEach(function(par){var t='';par.replace(/<[wm]:t(?: [^>]*)?>([^<]*)<\/[wm]:t>/g,function(_,s){t+=Berkas.lepasEntitas(s);});if(mulai.has(t))aktif=true;if(aktif)A(/<w:keepNext\/>/.test(par),'Teks/Equation langkah terpisah dari gambar: '+t);if(aktif&&selesai.has(t)){aktif=false;terjaga++;}});
    A(!aktif);A.strictEqual(terjaga,mulai.size);
    js.paket[0].subtes[0].butir.forEach(function(b,i){b.gambarPembahasan.forEach(function(g,j){A.strictEqual(g.setelah,bs[i].gambarPembahasan[j].setelah);A.strictEqual(g.mulai,bs[i].gambarPembahasan[j].mulai);var f=files.find(function(f){return f.nama===g.berkas;});A(f);Berkas.periksaPng(Buffer.from(f.data));});});
    var sheet=Berkas.periksaXlsx(Buffer.from(await E.xlsx(h))).Soal,idx=sheet[0].indexOf('berkas_gambar_pembahasan');
    js.paket[0].subtes[0].butir.forEach(function(b,i){b.gambarPembahasan.forEach(function(g){A(sheet[i+1][idx].includes(g.berkas));});});
    var blocks=D.dariPaket(p,function(b,g){return {lebar:1600,tinggi:1000,skala:2,id:b.id+'|'+g.id};}).blok;
    bs.forEach(function(b){b.gambarPembahasan.forEach(function(g){var group=blocks.find(function(x){return x.t==='grup'&&x.anak.some(function(y){return y.t==='gambar'&&y.img.id===b.id+'|'+g.id;});});A(group);var texts=group.anak.map(function(y){return (y.runs||[]).map(function(r){return r.teks;}).join('');});A(texts.includes(g.setelah));if(g.mulai)A(texts.includes(g.mulai));});});
  });
}
module.exports={jalankan:jalankan,buatContoh:buatContoh};
if(require.main===module){var gagal=0;jalankan(function(ok,n,d){console.log((ok?'ok ':'GAGAL ')+n+(d?'\n'+d:''));if(!ok)gagal++;}).then(function(){process.exitCode=gagal?1:0;});}
