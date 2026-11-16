(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./bank-aset-badges-data'));
  else root.BankAsetBadges=factory(root.BankAsetBadgesData);
})(typeof self!=='undefined'?self:this,function(DATA){
  'use strict';
  var KATEGORI=['orang','produk','kendaraan','hewan','tumbuhan','perusahaan'],cache={};
  function daftar(kategori){return Object.keys(DATA).map(function(id){return DATA[id];}).filter(function(p){return !kategori||p.kategori===kategori;}).map(function(p){return {id:p.asset_id,nama:p.nama,kategori:p.kategori,awalan:p.awalan,berkas:'bank_aset_badges/'+p.file,buatanAI:true,sha256:p.sha256};});}
  var SEMUA=daftar();
  function cari(nama,kategori){return SEMUA.find(function(p){return p.nama===nama&&(!kategori||p.kategori===kategori);});}
  function ambil(id){if(!DATA[id])throw new Error('Aset Badges tidak ditemukan: '+id);return DATA[id];}
  function bytes(s){if(typeof Buffer!=='undefined')return new Uint8Array(Buffer.from(s,'base64'));var t=atob(s),u=new Uint8Array(t.length);for(var i=0;i<t.length;i++)u[i]=t.charCodeAt(i);return u;}
  function url(id){return 'data:image/png;base64,'+ambil(id).png;}
  function gambar(id){if(!cache[id]){var d=ambil(id);cache[id]={lebar:d.lebar,tinggi:d.tinggi,kanal:3,png:bytes(d.png),raw:bytes(d.rgb),skala:1};}return cache[id];}
  function svg(id,x,y,w,h){return '<image data-aset-badges="'+ambil(id).asset_id+'" x="'+x+'" y="'+y+'" width="'+w+'" height="'+(h||w)+'" href="'+url(id)+'"/>';}
  function svgNama(nama,x,y,w,h){var p=cari(nama);return p?svg(p.id,x,y,w,h):'';}
  function deskriptor(nama,i,kategori){var p=cari(nama,kategori);if(!p)throw new Error('Nama tidak sesuai manifest Badges: '+nama);return {id:'badge-'+(i+1),jenis:'aset-badges',model:{id:p.id},judul:p.nama};}
  return {KATEGORI:KATEGORI,SEMUA:SEMUA,daftar:daftar,cari:cari,url:url,gambar:gambar,svg:svg,svgNama:svgNama,deskriptor:deskriptor,GAMBAR:{'aset-badges':function(m){return {svg:'<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128">'+svg(m.id,0,0,128,128)+'</svg>',lebar:128,tinggi:128};}}};
});
