'use strict';
var A=require('assert'),B=require('../js/bank'),P=require('../js/paket'),V=require('../js/validator'),E=require('../js/ekspor');
var Aset=require('../js/bank-aset-badges');
var S=require('./siadu'),F=require('../js/foto-badges'),Profil=require('../js/profil-badges'),Berkas=require('./berkas');
function buatContoh(){
  var h=P.buat({materi:[{id:'pn-peringkat',jumlah:6}],proporsi:{mudah:1,sedang:4,sulit:1},benih:20261027}).hasil,st=h.paket[0].subtes[0];
  var plan=[[0,'sulit'],[1,'sedang'],[2,'sedang'],[3,'sedang'],[4,'sedang'],[3,'mudah']];
  st.butir=st.butir.map(function(old,i){var b=B.buat('pn','peringkat',plan[i][0],plan[i][1],20261027+i*1000);return Object.assign(b,{no:old.no,id:old.id,paket:old.paket,tingkatNama:plan[i][1][0].toUpperCase()+plan[i][1].slice(1)});});
  A(V.periksaHasil(h).lulus,JSON.stringify(V.periksaHasil(h)));return h;
}
async function jalankan(cek){
  async function uji(n,fn){try{await fn();cek(true,n);}catch(e){cek(false,n,e.stack||e.message);}}
  await uji('SiAdu Badges: 8 foto berbeda, nama/gender tetap, deskripsi terisi, pasangan tertukar ditolak',function(){
    var identitas={Andi:'laki-laki',Budi:'laki-laki',Eko:'laki-laki',Farhan:'laki-laki',Citra:'perempuan',Dewi:'perempuan',Lili:'perempuan',Tiara:'perempuan'},foto=new Set();
    Profil.DAFTAR.forEach(function(p){A.strictEqual(p.gender,identitas[p.nama]);var img=F.gambar(p.id);Berkas.periksaPng(Buffer.from(img.png));A.strictEqual(img.raw.length,img.lebar*img.tinggi*3);foto.add(Buffer.from(img.png).toString('base64'));});A.strictEqual(foto.size,8);
    for(var fam=0;fam<4;fam++)for(var lv of ['mudah','sedang','sulit'])for(var seed=0;seed<10;seed++){
      var b=B.buat('pn','peringkat',fam,lv,20261027+seed);A(V.periksaButir(b).lulus);A.strictEqual(new Set(b.isian.profil.map(function(p){return p.id;})).size,b.isian.nama.length);
      A(b.isian.kartu.filter(function(k){return !k.petunjuk.join(' ').trim();}).length<=2);
      b.isian.profil.forEach(function(p,i){A.strictEqual(p.nama,b.isian.nama[i]);A.deepStrictEqual(p,Aset.cari(p.nama,b.model.kategoriEntitas));});
      var bad=JSON.parse(JSON.stringify(b));bad.isian.profil[0].gender='tidak sesuai';A(!V.periksaButir(bad).lulus);
      bad=JSON.parse(JSON.stringify(b));bad.isian.gambar[0].model.id=bad.isian.gambar[1].model.id;A(!V.periksaButir(bad).lulus);
    }
  });
  await uji('SiAdu Badges: enam contoh / lima keluarga, foto tertanam pada sel yang benar dan metadata ekspor cocok',async function(){
    var h=buatContoh(),bs=h.paket[0].subtes[0].butir,files=await E.berkasPaket(h.paket[0],{docx:true,gambar:true});
    var doc=Buffer.from(files.find(function(f){return f.jenis==='docx';}).data);Berkas.periksaDocx(doc);A.deepStrictEqual(S.periksa(doc,bs,'latex'),[]);
    var zip=Berkas.bacaZip(doc),xml=zip.find(function(f){return f.nama==='word/document.xml';}).data.toString('utf8'),rels=zip.find(function(f){return f.nama==='word/_rels/document.xml.rels';}).data.toString('utf8');
    var images={};rels.replace(/<Relationship\b[^>]*Id="([^"]+)"[^>]*Target="media\/([^"]+)"[^>]*\/>/g,function(_,rid,file){images[rid]=zip.find(function(f){return f.nama==='word/media/'+file;}).data;});
    var tables=xml.match(/<w:tbl>[\s\S]*?<\/w:tbl>/g)||[];A.strictEqual(tables.length,bs.length);
    tables.forEach(function(t,i){var rows=(t.match(/<w:tr>[\s\S]*?<\/w:tr>/g)||[]).slice(1);rows.forEach(function(row,j){var cells=row.match(/<w:tc>[\s\S]*?<\/w:tc>/g);A.strictEqual(cells.length,4);var rid=cells[2].match(/r:embed="([^"]+)"/)[1];A(images[rid]);A.deepStrictEqual(images[rid],Buffer.from(Aset.gambar(bs[i].isian.profil[j].id).png));});});
    var js=JSON.parse(E.json(h)).paket[0].subtes[0].butir;
    js.forEach(function(b,i){A.deepStrictEqual(b.isian,bs[i].isian);A.strictEqual(b.gambarIsian.length,b.isian.nama.length);b.gambarIsian.forEach(function(g){A(files.some(function(f){return f.nama===g.berkas;}));});});
  });
}
module.exports={jalankan:jalankan,buatContoh:buatContoh};
if(require.main===module){var gagal=0;jalankan(function(ok,n,d){console.log((ok?'ok ':'GAGAL ')+n+(d?'\n'+d:''));if(!ok)gagal++;}).then(function(){process.exitCode=gagal?1:0;});}
