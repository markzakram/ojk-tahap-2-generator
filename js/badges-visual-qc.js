(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./svg'),require('./peringkat-data'),require('./bank-aset-badges'),require('./metrik'));
  else root.BadgesVisualQc=factory(root.Svg,root.PeringkatData,root.BankAsetBadges,root.Metrik);
})(typeof self!=='undefined'?self:this,function(S,D,A,M){
  'use strict';
  var W=1100,C=S.BAHAS;
  function kanvas(judul,h){
    var out=S.rect(1,1,W-2,h-2,{isi:'#ffffff',garis:'#cbd3df',tebal:1,rx:10});
    function t(s,x,y,o){out+=S.teks(s,x,y,Object.assign({ukuran:24,isi:C.teks},o||{}));}
    function wrap(s,x,y,max,o){o=o||{};var words=String(s).split(' '),line='',k=0,fs=o.ukuran||22;
      words.forEach(function(w){var next=line?line+' '+w:w;if(line&&M.lebar(next,fs,!!o.tebal)>max){t(line,x,y+k*(fs+5),o);k++;line=w;}else line=next;});if(line)t(line,x,y+k*(fs+5),o);return k+1;
    }
    function foto(n,x,y,w){out+=A.svgNama(n,x,y,w,w);}
    function name(n,x,y,o){o=Object.assign({rata:'middle',ukuran:24,tebal:true},o||{});if(n.indexOf('Perusahaan ')===0){t('Perusahaan',x,y-12,Object.assign({},o,{ukuran:20}));t(n.slice(11),x,y+13,o);}else t(n,x,y,o);}
    t(judul,24,37,{ukuran:29,tebal:true});
    return {t:t,wrap:wrap,foto:foto,name:name,rect:function(){out+=S.rect.apply(null,arguments);},panah:function(){out+=S.panah.apply(null,arguments);},circle:function(){out+=S.lingkaran.apply(null,arguments);},fini:function(){return {svg:S.doc(out,W,h),lebar:W,tinggi:h};}};
  }
  function montant(x,f){return x==null?'?':['p','c','s','l'].indexOf(f)>=0?D.uang(x):D.angka(x);}
  function expression(m,o){
    if(o.jenis==='nilai')return 'Diketahui: '+D.angka(o.masukan)+(o.hari?' hari × '+o.jamPerHari+' = '+D.angka(o.hasil)+' jam':'');
    var source=D.angka(o.masukan);
    return (o.persen?D.angka(o.num*100/o.den)+'%':o.den===1?o.num:o.num+'/'+o.den)+' × '+source+(o.tambah?' '+(o.tambah>0?'+':'-')+' '+D.angka(Math.abs(o.tambah)):'')+' = '+D.angka(o.hasil);
  }
  function tableau(K,m,y){
    var prod=m.tipe==='produk',fields=prod?['u','s','l']:m.tipe==='waktu'?['t']:['q','p','c','l'],labels={u:'Unit/bulan',s:'Laba/unit',l:prod?'Laba/bulan':'Keuntungan',q:'Terjual',p:'Harga/unit',c:'Biaya/unit',t:'Waktu (jam)'};
    var nw=m.kategoriEntitas==='perusahaan'?320:230,cw=(W-48-nw)/fields.length;
    K.rect(24,y,W-48,34,{isi:'#e9eef7'});K.t('Nama',68,y+25,{ukuran:22,tebal:true});
    fields.forEach(function(f,j){K.t(labels[f],24+nw+cw*(j+.5),y+25,{rata:'middle',ukuran:22,tebal:true});});
    m.nama.forEach(function(n,i){var yy=y+34+i*36;K.rect(24,yy,W-48,36,{isi:i%2?'#f6f8fb':'#ffffff',garis:'#e0e6ef',tebal:.5});K.foto(n,29,yy+3,30);K.t(n,68,yy+26,{ukuran:m.kategoriEntitas==='perusahaan'?20:22,tebal:true});
      fields.forEach(function(f,j){var key=f+'_'+i,x=24+nw+cw*j,newv=key===m.baru||(m.kolomBaru||[]).indexOf(key)>=0,ref=m.operasi&&(m.operasi.acuan===key||(m.operasi.hitung||[]).some(function(o){return o.acuan===key;}));
        if(newv||ref)K.rect(x+2,yy+1,cw-4,34,{isi:newv?C.latarSorot:C.latarPanah,garis:newv?C.sorot:C.panah});
        K.t(montant(m.nilai[key],f),x+cw/2,yy+26,{rata:'middle',ukuran:22,tebal:newv||f==='l'&&m.nilai[key]!=null,isi:newv?C.sorot:ref?C.panah:C.teks});
      });
    });
  }
  function hitung(m,judul){
    var initial=m.tahap==='awal',person=m.tahap==='orang',y=initial?120:person?338:246,h=y+34+m.nama.length*36+48,K=kanvas(judul,h),o=m.operasi;
    if(initial)K.t('Tanda ? berarti nilai belum dihitung. Lengkapi data sebelum mengurutkan.',24,78,{ukuran:22});
    else if(person){
      ['q','p','c'].forEach(function(f,j){var yy=74+j*43,op=o.hitung.find(function(c){return c.bidang===f;});K.rect(24,yy,W-48,38,{isi:C.latarSorot,garis:'#eed8c5',rx:4});K.t({q:'Terjual (unit)',p:'Harga/unit ($)',c:'Biaya/unit ($)'}[f],36,yy+27,{ukuran:23,tebal:true});K.t(expression(m,op),270,yy+27,{ukuran:25});});
      [[24,300],[355,340],[726,350]].forEach(function(a,k){K.rect(a[0],218,a[1],78,{isi:k===2?C.latarSorot:'#f4f6fa',garis:k===2?C.sorot:'#cbd3df',rx:6});});
      K.t('Jumlah terjual',174,245,{rata:'middle',ukuran:22});K.t(D.angka(o.jumlah)+' unit',174,281,{rata:'middle',ukuran:30,tebal:true});
      K.t('Laba per unit',525,240,{rata:'middle',ukuran:21});K.t(D.uang(o.harga)+' - '+D.uang(o.biaya)+' = '+D.uang(o.margin),525,276,{rata:'middle',ukuran:25,tebal:true});
      K.foto(m.nama[o.orang],734,228,54);K.wrap(m.nama[o.orang],800,239,265,{ukuran:18,tebal:true});K.t(D.uang(o.hasil),900,293,{rata:'middle',ukuran:28,tebal:true,isi:C.sorot});K.t('×',340,267,{rata:'middle',ukuran:30,tebal:true});K.panah(700,261,721,261,{warna:C.panah,kepala:7});
    }else{
      K.rect(24,83,625,123,{isi:C.latarPanah,garis:C.panah,rx:6});K.rect(687,83,389,123,{isi:C.latarSorot,garis:C.sorot,rx:6});
      K.t(o.jenis==='produk'?'Unit bulanan × laba per unit':'Gunakan data/rangkaian rujukan',40,118,{ukuran:23,tebal:true});
      K.wrap(o.jenis==='produk'?D.angka(m.nilai['u_'+o.orang])+' × '+D.uang(m.nilai['s_'+o.orang])+' = '+D.uang(o.hasil):expression(m,o),40,161,590,{ukuran:29,tebal:true});
      K.foto(m.nama[o.orang],698,92,60);K.wrap(m.nama[o.orang],772,113,290,{ukuran:22,tebal:true});K.t(m.tipe==='waktu'?D.angka(o.hasil)+' jam':D.uang(o.hasil),881,185,{rata:'middle',ukuran:33,tebal:true,isi:C.sorot});K.panah(654,145,681,145,{warna:C.panah,kepala:8});
    }
    if(!initial)K.t('Kemajuan hitungan — susunan nama belum diurutkan',24,y-10,{ukuran:22,tebal:true});
    tableau(K,m,y);K.t('Jingga: hasil baru. Biru: rujukan. Gambar hanya menandai identitas.',24,h-18,{ukuran:21,isi:C.teksRedup});return K.fini();
  }
  function akhir(m,judul){
    var waktu=m.tipe==='waktu',f=waktu?'t':'l',h=133+m.nama.length*48,K=kanvas(judul,h),max=Math.max.apply(null,m.urutan.map(function(i){return m.nilai[f+'_'+i];}));
    K.t(waktu?'Lencana 1: waktu terkecil. Semua hasil sudah dalam jam.':'Lencana 1: total laba terbesar. Bandingkan seluruh hasil yang dihitung.',24,78,{ukuran:23});
    m.urutan.forEach(function(i,k){var y=102+k*48,value=m.nilai[f+'_'+i];K.circle(42,y+18,17,{isi:C.jawab});K.t(m.peringkat[i],42,y+26,{rata:'middle',ukuran:26,tebal:true,isi:'#ffffff'});K.foto(m.nama[i],70,y+1,36);K.t(m.nama[i],120,y+27,{ukuran:23,tebal:true});K.rect(445,y+3,440,30,{isi:'#f1f4f8',rx:3});K.rect(445,y+3,440*value/max,30,{isi:k===0?C.jawab:'#9db7d9',rx:3});K.t(waktu?D.angka(value)+' jam':D.uang(value),909,y+28,{ukuran:25,tebal:true});});
    K.t('Setiap nomor peringkat digunakan tepat sekali.',24,h-14,{ukuran:21,isi:C.jawab});return K.fini();
  }
  function chain(m,judul){
    var initial=m.tahap==='awal',final=m.tahap==='akhir',rows=initial?[m.nama.map(function(_,i){return i;}).slice(0,4),m.nama.map(function(_,i){return i;}).slice(4)]:m.rantai||[m.urutan];rows=rows.filter(function(r){return r.length;});
    var h=122+rows.length*143+80,K=kanvas(judul,h);K.t(initial?'Susunan kartu belum menunjukkan peringkat.':'Tanda > berarti di atas: nomor peringkat lebih kecil.',24,78,{ukuran:23});
    rows.forEach(function(row,j){var y=103+j*143,step=132,start=(W-step*row.length)/2;
      row.forEach(function(i,k){var cx=start+(k+.5)*step,hl=!final&&!initial&&(m.sorot||[]).indexOf(i)>=0,color=final?C.jawab:hl?C.sorot:C.panah;
        K.rect(cx-59,y,118,122,{isi:final?C.latarJawab:hl?C.latarSorot:'#f4f6fa',garis:color,tebal:2,rx:6});K.foto(m.nama[i],cx-20,y+5,40);K.name(m.nama[i],cx,y+79,{ukuran:23});
        if(final){K.circle(cx,y+108,13,{isi:C.jawab});K.t(m.peringkat[i],cx,y+116,{rata:'middle',tebal:true,ukuran:23,isi:'#ffffff'});}else if(initial)K.t('?',cx,y+114,{rata:'middle',ukuran:23,tebal:true});
        if(!initial&&k<row.length-1)K.t('>',cx+66,y+81,{rata:'middle',ukuran:28,tebal:true,isi:C.panah});
      });
    });
    var unknown=m.nama.filter(function(_,i){return !rows.some(function(row){return row.indexOf(i)>=0;});});
    K.wrap(initial?'Gunakan satu petunjuk setiap langkah.':final?'Nama pertama mendapat lencana 1.':unknown.length?'Belum dirangkai: '+unknown.join(', ')+'.':rows.length>1?'Rantai yang terpisah belum dapat dibandingkan satu sama lain.':'Seluruh nama tersambung; urutan mengikuti petunjuk dan arah pada pertanyaan.',24,h-55,W-48,{ukuran:21,isi:final?C.jawab:C.teksRedup});return K.fini();
  }
  function posisi(m,judul){
    var initial=m.tahap==='awal',final=m.tahap==='akhir',K=kanvas(judul,456);
    K.t(initial?'Semua nama belum diurutkan. Mulai dengan satu titik acuan.':final?'Ubah posisi relatif menjadi nomor peringkat 1 sampai '+m.nama.length+'.':'Posisi relatif di kiri lebih kecil; nomor peringkat ditentukan pada tahap akhir.',24,78,{ukuran:23});
    if(initial){m.nama.forEach(function(n,i){var x=24+(i%4)*270,y=112+Math.floor(i/4)*145;K.rect(x,y,250,126,{isi:'#f4f6fa',garis:'#cbd3df',rx:6});K.foto(n,x+8,y+15,66);K.wrap(n,x+87,y+42,153,{ukuran:24,tebal:true});K.t('Posisi: ?',x+87,y+106,{ukuran:22});});return K.fini();}
    var known=m.posisi.filter(function(p){return p!=null;}),min=Math.min.apply(null,known),max=Math.max.apply(null,known),count=max-min+1,step=132,start=(W-count*step)/2;
    function center(p){return start+(p-min+.5)*step;}
    if(m.tahap==='petunjuk'){K.t(m.jarak+' langkah = '+(m.jarak-1)+' nama di antara + 1',W/2,112,{rata:'middle',ukuran:23,tebal:true});K.panah(center(m.posisi[m.acuan]),137,center(m.posisi[m.baru]),137,{warna:C.panah,tebal:3,kepala:10});}
    else K.t(final?'Lencana 1 berasal dari posisi relatif terkecil.':'Angka 0 adalah titik acuan, belum nomor peringkat.',W/2,120,{rata:'middle',ukuran:22});
    for(var p=min;p<=max;p++){var i=m.posisi.indexOf(p),cx=center(p),fresh=!final&&i===m.baru,ref=!final&&i===m.acuan,color=final?C.jawab:fresh?C.sorot:ref?C.panah:'#8490a4';K.rect(cx-59,158,118,164,{isi:final?C.latarJawab:fresh?C.latarSorot:ref?C.latarPanah:'#f4f6fa',garis:color,tebal:2,rx:6});if(i>=0){K.foto(m.nama[i],cx-20,166,40);K.name(m.nama[i],cx,240,{ukuran:23});}else K.t('?',cx,240,{rata:'middle',ukuran:27,tebal:true});K.t(final?'Peringkat':'Relatif',cx,280,{rata:'middle',ukuran:19});if(final)K.circle(cx,304,14,{isi:C.jawab});K.t(final?m.peringkat[i]:p,cx,313,{rata:'middle',ukuran:25,tebal:true,isi:final?'#ffffff':color});if(fresh||ref)K.t(fresh?'BARU':'RUJUKAN',cx,349,{rata:'middle',ukuran:19,isi:color,tebal:true});if(final)K.t('Relatif '+p,cx,349,{rata:'middle',ukuran:19});}
    if(m.tahap==='petunjuk')K.t(m.posisi[m.acuan]+(m.posisi[m.baru]>m.posisi[m.acuan]?' + ':' - ')+m.jarak+' = '+m.posisi[m.baru],W/2,382,{rata:'middle',ukuran:26,tebal:true});
    var unknown=m.nama.filter(function(_,i){return m.posisi[i]==null;});K.wrap(final?'Semua petunjuk terpenuhi.':unknown.length?'Belum ditempatkan: '+unknown.join(', ')+'.':'Semua nama tersambung; selanjutnya tentukan lencana.',24,417,W-48,{ukuran:21,isi:final?C.jawab:C.teksRedup});return K.fini();
  }
  return {gambar:function(jenis,m,judul){return jenis==='posisi'?posisi(m,judul):jenis==='rantai'?chain(m,judul):jenis==='akhir'?akhir(m,judul):hitung(m,judul);}};
});
