/* Foto lokal dibundel agar unduhan Word juga bekerja dari index.html tanpa server. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./foto-badges-data.js'));
  else root.FotoBadges=factory(root.FotoBadgesData);
})(typeof self!=='undefined'?self:this,function(DATA){
  'use strict';
  var cache={};
  function ambil(id){if(!DATA[id])throw new Error('Foto Badges tidak tersedia: '+id);return DATA[id];}
  function bytes(s){
    if(typeof Buffer!=='undefined')return new Uint8Array(Buffer.from(s,'base64'));
    var t=atob(s),u=new Uint8Array(t.length);for(var i=0;i<t.length;i++)u[i]=t.charCodeAt(i);return u;
  }
  function url(id){return 'data:image/png;base64,'+ambil(id).png;}
  function gambar(id){
    if(!cache[id]){var d=ambil(id);cache[id]={lebar:d.lebar,tinggi:d.tinggi,kanal:3,png:bytes(d.png),raw:bytes(d.rgb),skala:1};}
    return cache[id];
  }
  return {url:url,gambar:gambar};
});
