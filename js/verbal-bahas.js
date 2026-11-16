/* Pembahasan verbal: bacaan bernomor, bukti berwarna, penjelasan, dan cara cepat.
 * Warna menghubungkan bukti dengan rujukannya, bukan menandai benar/salah.
 * Struktur ini juga disimpan dalam JSON; baris teks tetap tersedia untuk impor.
 */
(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.VerbalBahas=api;
})(typeof self!=='undefined'?self:this,function(){
  'use strict';
  var WARNA=['0057B8','007B56'];
  function rujukan(nomor){
    return nomor.map(function(n){return '('+n+')';}).join(nomor.length===2?' dan ':', ');
  }
  function buat(kalimat,bukti,alasan,jawaban,caraCepat){
    var nomor=bukti.slice().sort(function(a,b){return a-b;}).filter(function(n,i,a){return i===0||n!==a[i-1];});
    if(!nomor.length||nomor.some(function(n){return n<1||n>kalimat.length;}))throw new Error('Bukti verbal tidak menunjuk kalimat bacaan.');
    return {versi:1,
      kalimat:kalimat.map(function(t,i){var idx=nomor.indexOf(i+1);return {nomor:i+1,teks:t,warna:idx<0?null:WARNA[idx%WARNA.length]};}),
      bukti:nomor,
      penjelasan:'Perhatikan kalimat '+rujukan(nomor)+'. '+alasan.join(' ')+' Jadi, jawabannya '+jawaban+'.',
      caraCepat:caraCepat
    };
  }
  function baris(v){
    return v.kalimat.map(function(k){return '('+k.nomor+') '+k.teks;})
      .concat(['Penjelasan singkat',v.penjelasan,'Cara Cepat: '+v.caraCepat]);
  }
  function runs(v,t){
    if(t==='Penjelasan singkat')return [{teks:t,tebal:true}];
    var kal=/^\((\d+)\) /.exec(t);
    if(kal){
      var k=v.kalimat[Number(kal[1])-1];
      if(k&&t==='('+k.nomor+') '+k.teks)return [{teks:'('+k.nomor+') ',tebal:true,warna:k.warna}, {teks:k.teks,tebal:!!k.warna,warna:k.warna}];
    }
    var out=[],pos=0;
    if(t.indexOf('Cara Cepat: ')===0){out.push({teks:'Cara Cepat: ',tebal:true});pos=12;}
    var re=/\((\d+)\)|Jadi, jawabannya (Benar|Salah|Tidak Diketahui)\./g,m;
    re.lastIndex=pos;
    while((m=re.exec(t))){
      if(m.index>pos)out.push({teks:t.slice(pos,m.index)});
      if(m[1]){
        var no=Number(m[1]),w=v.kalimat[no-1];
        out.push({teks:m[0],tebal:!!(w&&w.warna),warna:w&&w.warna||null});
      }else out.push({teks:'Jadi, jawabannya '},{teks:m[2],tebal:true},{teks:'.'});
      pos=re.lastIndex;
    }
    if(pos<t.length)out.push({teks:t.slice(pos)});
    return out;
  }
  return {WARNA:WARNA,rujukan:rujukan,buat:buat,baris:baris,runs:runs};
});
