/* Visual pembahasan Badges: dibangun dari petunjuk, bukan dari kunci peringkat. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./svg'),require('./peringkat-data'),require('./rumus'),require('./badges-visual-qc'),require('./badges-shl'));
  else root.BadgesLangkah=factory(root.Svg,root.PeringkatData,root.Rumus,root.BadgesVisualQc,root.BadgesShl);
})(typeof self!=='undefined'?self:this,function(S,D,R,Qc,Shl){
  'use strict';
  var LABEL={t:'Waktu (jam)',q:'Jumlah terjual',p:'Harga per produk',c:'Biaya per produk',l:'Keuntungan',u:'Unit per bulan',s:'Laba per unit'};
  function salin(x){return JSON.parse(JSON.stringify(x));}
  function r(v){return D.angka(v).replace(',', '{,}');}
  function format(v,f){return v==null?'?':['p','c','l','s'].indexOf(f)>=0?D.uang(v):D.angka(v);}
  function rumusKolom(o,nama){
    if(o.jenis==='nilai')return 'Diketahui: '+D.angka(o.hasil);
    var sumber=o.acuan?nama[Number(o.acuan.split('_')[1])]+' ('+D.angka(o.masukan)+')':D.angka(o.masukan);
    return (o.persen?D.angka(o.num*100/o.den)+'%':o.den===1?String(o.num):o.num+'/'+o.den)+' × '+sumber+(o.tambah?' '+(o.tambah>0?'+':'-')+' '+D.angka(Math.abs(o.tambah)):'')+' = '+D.angka(o.hasil);
  }
  function rantai(m,terpakai){
    var maju={},masuk={},ada={};
    terpakai.forEach(function(j){var c=m.petunjuk[j];if(c.jenis==='tetap')return;maju[c.orang]=c.lain;masuk[c.lain]=c.orang;ada[c.orang]=ada[c.lain]=true;});
    return Object.keys(ada).map(Number).filter(function(i){return masuk[i]==null;}).map(function(i){var out=[i];while(maju[i]!=null){i=maju[i];if(out.indexOf(i)>=0)throw new Error('Rantai berputar');out.push(i);}return out;});
  }
  function susun(m){
    if(m.ragam==='shl')return Shl.susun(m);
    var teks=[],gambar=[],nilai={},langkah=0;
    function keluaran(){
      if(m.kategoriEntitas){var ringkas=function(t){return t.replace(/\borang\b/g,'nama').replace(/\bproduk\b/g,'unit');};teks=teks.map(ringkas);gambar.forEach(function(g){g.setelah=ringkas(g.setelah);if(g.mulai)g.mulai=ringkas(g.mulai);g.judul=ringkas(g.judul);});}
      return {teks:teks,gambar:gambar};
    }
    function simpan(tahap,judul,baris,extra){
      Array.prototype.push.apply(teks,baris);
      var v=Object.assign({tipe:m.tipe,nama:m.nama.slice(),tahap:tahap,nilai:salin(nilai)},extra||{});
      if(m.kategoriEntitas)v.kategoriEntitas=m.kategoriEntitas;
      var g={id:'badges-langkah-'+gambar.length,jenis:m.tipe==='perbandingan'?'badges-rantai':tahap==='akhir'?'badges-akhir':'badges-hitung',judul:judul,setelah:baris[baris.length-1],model:v};
      if(baris.length>1)g.mulai=baris[0];
      gambar.push(g);
    }
    function akhir(urutan){
      var peringkat=m.nama.map(function(_,i){return urutan.indexOf(i)+1;});
      simpan('akhir','Urutan final: pasangkan lencana',[
        m.tipe==='perbandingan'?(m.kategoriEntitas?'Semua nama tersambung. Beri lencana dari kiri ke kanan sesuai arah ranking pada pertanyaan.':'Seluruh nama sudah tersambung. Beri Peringkat 1 pada penjualan terbesar, lalu lanjutkan sepanjang rantai.'):m.tipe==='waktu'?'Semua waktu sudah dalam jam. Urutkan dari waktu paling singkat hingga paling lama, lalu pasangkan lencana 1 sampai '+m.nama.length+'.':'Semua '+(m.tipe==='produk'?'laba bulanan produk':'keuntungan bersih mingguan')+' sudah dihitung. Urutkan dari nilai terbesar hingga terkecil, lalu pasangkan lencana 1 sampai '+m.nama.length+'.'
      ],{urutan:urutan,peringkat:peringkat});
    }
    if(m.tipe==='perbandingan'){
      var terpakai=[];
      teks.push(m.kategoriEntitas?'Tanda > berarti ditempatkan di atas (nomor peringkat lebih kecil). Sambungkan hubungan yang memiliki nama sama.':'Tanda > berarti menjual lebih banyak. Rantai yang belum tersambung belum dapat dibandingkan satu sama lain.');
      simpan('awal','Kondisi awal: perbandingan belum dirangkai',['Mulai dari nama-nama yang belum diurutkan. Gunakan satu petunjuk setiap langkah.'],{terpakai:[],rantai:[]});
      m.petunjuk.forEach(function(c,j){
        terpakai.push(j);var rs=rantai(m,terpakai);langkah++;
        simpan('relasi','Langkah '+langkah+': hubungkan perbandingan',[
          'Langkah '+langkah+': '+D.teks(m,c)+(c.jenis==='tetap'?' Petunjuk ini cocok dengan ujung rantai.':' Artinya '+m.nama[c.orang]+' > '+m.nama[c.lain]+'. Sambungkan rantai yang memiliki nama sama.')
        ],{petunjuk:j,terpakai:terpakai.slice(),rantai:rs,sorot:c.jenis==='tetap'?[c.orang]:[c.orang,c.lain]});
      });
      var rs=rantai(m,terpakai);if(rs.length!==1||rs[0].length!==m.nama.length)throw new Error('Rantai perbandingan belum lengkap');
      akhir(rs[0]);return keluaran();
    }
    if(m.tipe==='laba'){
      teks.push('Hitung seluruh kolom satu orang dalam satu langkah. Dahulukan orang yang datanya menjadi rujukan, lalu gunakan hasilnya untuk orang berikutnya.');
      teks.push(R.baris('\\text{keuntungan bersih} = \\text{jumlah produk} \\times (\\text{harga jual per produk} - \\text{biaya per produk})'));
      teks.push('Biaya mencakup seluruh biaya produksi per produk. Semua nominal dalam dolar AS ($).');
      simpan('awal','Kondisi awal: keuntungan belum dihitung',['Setiap langkah akan mengisi satu baris nama sekaligus: jumlah terjual, harga, biaya, dan keuntungan.']);
      var orangSisa=m.nama.map(function(_,i){return i;});
      while(orangSisa.length){
        var maju=false;
        for(var z=0;z<orangSisa.length;){
          var i=orangSisa[z],data=m.petunjuk.map(function(c,j){return {c:c,j:j};}).filter(function(x){return x.c.orang===i;});
          if(data.some(function(x){return x.c.jenis==='turunan'&&Number(x.c.ref.split('_')[1])!==i&&nilai[x.c.ref]==null;})){z++;continue;}
          var hitung=[],pending=data.slice(),sementara=Object.assign({},nilai);
          while(pending.length){
            var bergerak=false;
            for(var a=0;a<pending.length;){
              var x=pending[a],c=x.c;if(c.jenis==='turunan'&&sementara[c.ref]==null){a++;continue;}
              var masukan=c.jenis==='turunan'?sementara[c.ref]:c.nilai,hasil=c.jenis==='turunan'?masukan*c.num/c.den+c.tambah:c.nilai;
              sementara[c.bidang+'_'+i]=hasil;
              hitung.push({jenis:c.jenis,orang:i,bidang:c.bidang,hasil:hasil,petunjuk:x.j,acuan:c.jenis==='turunan'?c.ref:null,masukan:masukan,num:c.num||1,den:c.den||1,tambah:c.tambah||0,persen:!!c.persen,hari:false,jamPerHari:m.jamPerHari});
              pending.splice(a,1);bergerak=true;
            }
            if(!bergerak)throw new Error('Rujukan kolom orang melingkar');
          }
          var q=sementara['q_'+i],p=sementara['p_'+i],biaya=sementara['c_'+i],margin=p-biaya,laba=q*margin;
          var biayaOp=hitung.find(function(o){return o.bidang==='c';}),biayaRumus=biayaOp.persen?r(biayaOp.num*100/biayaOp.den)+'\\% \\times '+r(biayaOp.masukan):r(biaya);
          ['q','p','c'].forEach(function(f){nilai[f+'_'+i]=sementara[f+'_'+i];});nilai['l_'+i]=laba;langkah++;
          simpan('orang','Langkah '+langkah+': hitung semua kolom '+m.nama[i],[
            'Langkah '+langkah+': hitung jumlah terjual, harga, biaya, dan keuntungan '+m.nama[i]+' sekaligus.',
            R.baris('\\text{keuntungan bersih} = '+r(q)+' \\times ('+r(p)+' - '+biayaRumus+') = '+r(laba)),
            'Hasil '+m.nama[i]+': $'+D.angka(laba)+'.'
          ],{baru:'l_'+i,kolomBaru:['q_'+i,'p_'+i,'c_'+i,'l_'+i],operasi:{jenis:'orang',orang:i,hitung:hitung,jumlah:q,harga:p,biaya:biaya,margin:margin,hasil:laba}});
          orangSisa.splice(z,1);maju=true;
        }
        if(!maju)throw new Error('Rujukan antarorang tidak dapat diurutkan');
      }
    }else if(m.tipe==='produk'){
      m.produk.forEach(function(p,i){nilai['u_'+i]=p.unit;nilai['s_'+i]=p.labaPerUnitSen/100;});
      teks.push('Hitung laba bulanan setiap produk dengan mengalikan jumlah unit terjual per bulan dan laba per unit.');
      teks.push(R.baris('\\text{laba bulanan} = \\text{unit terjual per bulan} \\times \\text{laba per unit}'));
      simpan('awal','Kondisi awal: laba bulanan belum dihitung',['Jumlah unit dan laba per unit sudah diketahui. Kolom laba bulanan masih kosong.']);
      m.produk.forEach(function(p,i){
        var hasil=p.unit*p.labaPerUnitSen/100;nilai['l_'+i]=hasil;langkah++;
        simpan('hasil','Langkah '+langkah+': hitung '+m.nama[i],[
          'Langkah '+langkah+': kalikan '+D.angka(p.unit)+' unit per bulan dengan laba '+D.uang(p.labaPerUnitSen/100)+' per unit untuk '+m.nama[i]+'.',
          R.baris('\\text{laba bulanan} = '+r(p.unit)+' \\times \\$'+r(p.labaPerUnitSen/100)+' = \\$'+r(hasil)),
          'Hasil '+m.nama[i]+': '+D.uang(hasil)+'.'
        ],{baru:'l_'+i,operasi:{jenis:'produk',orang:i,hasil:hasil}});
      });
    }else{
      var waktu=m.tipe==='waktu';if(!waktu&&m.tipe!=='laba')throw new Error('Jenis Badges belum didukung');
      teks.push(waktu?'Samakan seluruh waktu ke jam. Kerjakan nilai rujukan sebelum menghitung orang yang bergantung padanya.':'Tentukan jumlah terjual, harga jual, dan biaya per produk. Kerjakan data rujukan lebih dahulu, kemudian hitung keuntungan bersih.');
      teks.push(waktu?R.baris('\\text{waktu dalam jam} = \\text{hari kerja} \\times \\text{jam per hari}'):R.baris('\\text{keuntungan bersih} = \\text{jumlah produk} \\times (\\text{harga jual per produk} - \\text{biaya per produk})'));
      if(!waktu)teks.push('Biaya pada rumus adalah biaya produksi per produk yang mencakup seluruh biaya. Semua nominal dalam dolar AS ($).');
      simpan('awal',waktu?'Kondisi awal: waktu belum disamakan':'Kondisi awal: keuntungan belum dihitung',[waktu?'Isi waktu setiap orang setelah membaca petunjuknya. Semua batang akan memakai satuan jam.':'Isi data satu per satu dari petunjuk. Tanda ? berarti nilainya belum dihitung pada langkah ini.']);
      var sisa=m.petunjuk.map(function(_,i){return i;});
      while(sisa.length){
        var maju=false;
        for(var z=0;z<sisa.length;){
          var j=sisa[z],c=m.petunjuk[j],key=c.bidang+'_'+c.orang;
          if(c.jenis==='turunan'&&nilai[c.ref]==null){z++;continue;}
          var hasil,expr;
          if(c.jenis==='nilai'){
            hasil=c.nilai*(c.hari?m.jamPerHari:1);expr=c.hari?r(c.nilai)+' \\times '+m.jamPerHari:r(c.nilai);
          }else{
            hasil=nilai[c.ref]*c.num/c.den+c.tambah;
            expr=(c.persen?r(c.num*100/c.den)+'\\%':c.den===1?r(c.num):'\\frac{'+c.num+'}{'+c.den+'}')+' \\times '+r(nilai[c.ref])+(c.tambah?' '+(c.tambah>0?'+':'-')+' '+r(Math.abs(c.tambah)):'');
          }
          nilai[key]=hasil;langkah++;
          var result=waktu?'Hasil '+m.nama[c.orang]+': '+D.angka(hasil)+' jam.':LABEL[c.bidang]+' '+m.nama[c.orang]+': '+D.nilai(hasil,c.bidang)+'.';
          simpan('data','Langkah '+langkah+': '+LABEL[c.bidang]+' '+m.nama[c.orang],[
            'Langkah '+langkah+': '+D.teks(m,c)+(c.jenis==='turunan'?' Gunakan nilai '+D.bidang(m,c.ref.split('_')[0])+' '+m.nama[Number(c.ref.split('_')[1])]+' yang sudah dihitung.':''),
            R.baris('\\text{'+D.bidang(m,c.bidang)+'} = '+expr+(expr===r(hasil)?'':' = '+r(hasil))),result
          ],{baru:key,petunjuk:j,operasi:{jenis:c.jenis,orang:c.orang,bidang:c.bidang,hasil:hasil,petunjuk:j,acuan:c.jenis==='turunan'?c.ref:null,masukan:c.jenis==='turunan'?nilai[c.ref]:c.nilai,num:c.num||1,den:c.den||1,tambah:c.tambah||0,persen:!!c.persen,hari:!!c.hari,jamPerHari:m.jamPerHari}});
          if(!waktu&&['q','p','c'].every(function(f){return nilai[f+'_'+c.orang]!=null;})&&nilai['l_'+c.orang]==null){
            var i=c.orang,q=nilai['q_'+i],p=nilai['p_'+i],biaya=nilai['c_'+i],margin=p-biaya,laba=q*margin;
            nilai['l_'+i]=laba;langkah++;
            simpan('hasil','Langkah '+langkah+': keuntungan '+m.nama[i],[
              'Langkah '+langkah+': data '+m.nama[i]+' sudah lengkap. Kurangi harga jual dengan biaya per produk, lalu kalikan dengan jumlah terjual.',
              R.baris('\\text{keuntungan bersih} = '+r(q)+' \\times ('+r(p)+' - '+r(biaya)+') = '+r(laba)),
              'Hasil '+m.nama[i]+': $'+D.angka(laba)+'.'
            ],{baru:'l_'+i,operasi:{jenis:'laba',orang:i,jumlah:q,harga:p,biaya:biaya,margin:margin,hasil:laba}});
          }
          sisa.splice(z,1);maju=true;
        }
        if(!maju)throw new Error('Rujukan hitungan terputus');
      }
    }
    var f=m.tipe==='waktu'?'t':'l',urutan=m.nama.map(function(_,i){return i;}).sort(function(a,b){return (nilai[f+'_'+a]-nilai[f+'_'+b])*(m.tipe==='waktu'?1:-1);});
    akhir(urutan);return keluaran();
  }
  function kanvas(judul,h){
    var out='',C=S.BAHAS;
    function t(s,x,y,o){out+=S.teks(s,x,y,Object.assign({ukuran:18,isi:C.teks},o||{}));}
    function rect(x,y,w,h,o){out+=S.rect(x,y,w,h,o);}
    function panah(x1,y1,x2,y2,o){out+=S.panah(x1,y1,x2,y2,o);}
    function cercle(x,y,r,o){out+=S.lingkaran(x,y,r,o);}
    rect(1,1,798,h-2,{isi:'#ffffff',garis:'#cbd3df',tebal:1,rx:10});t(judul,24,32,{ukuran:22,tebal:true});
    return {t:t,rect:rect,panah:panah,cercle:cercle,fini:function(){return {svg:S.doc(out,800,h),lebar:800,tinggi:h};}};
  }
  function svgRantai(m,judul){
    if(m.kategoriEntitas)return Qc.gambar('rantai',m,judul);
    var rs=m.rantai||[m.urutan],final=m.tahap==='akhir',initial=m.tahap==='awal',h=initial?300:170+rs.length*88,C=S.BAHAS,K=kanvas(judul,h);
    K.t(final?'Terbanyak di kiri; paling sedikit di kanan.':'Tanda > berarti menjual lebih banyak. Tiap baris adalah rantai tersendiri.',24,62,{ukuran:18});
    if(initial){
      m.nama.forEach(function(n,i){var x=24+(i%4)*190,y=88+Math.floor(i/4)*75;K.rect(x,y,180,60,{isi:'#f4f6fa',garis:'#cbd3df',rx:7});K.t(n,x+90,y+27,{rata:'middle',tebal:true,ukuran:21});K.t('Belum diurutkan',x+90,y+48,{rata:'middle',ukuran:16});});
      K.t('Rangkai petunjuk tanpa memberi nomor peringkat terlebih dahulu.',24,280,{ukuran:18});
    }else{
      rs.forEach(function(row,j){var y=87+j*88,step=94,x0=(800-step*row.length)/2;
        row.forEach(function(i,k){var x=x0+k*step+4,baru=!final&&(m.terpakai.length&&m.petunjuk!=null)&&m.sorot&&m.sorot.indexOf(i)>=0;
          var warna=final?C.jawab:baru?C.sorot:C.panah;
          K.rect(x,y,78,62,{isi:final?C.latarJawab:baru?C.latarSorot:C.latarPanah,garis:warna,tebal:2,rx:6});
          K.t(m.nama[i],x+39,y+26,{rata:'middle',tebal:true,ukuran:20});
          if(final){K.cercle(x+39,y+47,12,{isi:C.jawab});K.t(m.peringkat[i],x+39,y+53,{rata:'middle',tebal:true,ukuran:18,isi:'#ffffff'});}
          else K.t('Penjualan',x+39,y+47,{rata:'middle',ukuran:14});
          if(k<row.length-1)K.t('>',x+86,y+37,{rata:'middle',tebal:true,ukuran:24,isi:C.panah});
        });
      });
      var belum=m.nama.filter(function(_,i){return !rs.some(function(r){return r.indexOf(i)>=0;});});
      K.t(final?'Lencana 1 = penjualan terbesar.':belum.length?'Belum dirangkai: '+belum.join(', ')+'.':rs.length>1?'Rantai yang berbeda belum dapat dibandingkan satu sama lain.':'Semua nama tersambung; berikutnya pasangkan lencana.',24,h-28,{ukuran:17,isi:final?C.jawab:C.teksRedup});
    }
    return K.fini();
  }
  function operasi(K,m){
    var o=m.operasi,C=S.BAHAS,v=m.nilai,i=o.orang,source,head,act,result,label;
    if(o.jenis==='laba'){
      head='Jumlah terjual';source=D.angka(o.jumlah)+' produk';act=D.uang(o.harga)+' - '+D.uang(o.biaya);label='Laba per produk';result=D.uang(o.margin);
      K.t('Harga jual - biaya = laba per produk; jumlah terjual × laba per produk = keuntungan.',24,64,{ukuran:17});
      [[24,225],[278,235],[542,234]].forEach(function(a,k){K.rect(a[0],84,a[1],91,{isi:k===2?C.latarSorot:'#f4f6fa',garis:k===2?C.sorot:'#cbd3df',rx:7});});
      K.t(head,136,109,{rata:'middle',ukuran:17});K.t(source,136,143,{rata:'middle',tebal:true,ukuran:22});
      K.t(label,395,108,{rata:'middle',ukuran:17});K.t(act,395,135,{rata:'middle',ukuran:18});K.t('= '+result,395,161,{rata:'middle',tebal:true,ukuran:22});
      K.t(m.nama[i]+' / minggu',659,109,{rata:'middle',ukuran:17});K.t(D.uang(o.hasil),659,145,{rata:'middle',tebal:true,ukuran:24,isi:C.sorot});
      K.t('×',263,139,{rata:'middle',tebal:true,ukuran:25});K.panah(518,132,536,132,{warna:C.panah,kepala:6});return;
    }
    if(o.jenis==='produk'){
      head='Unit per bulan';source=D.angka(v['u_'+i]);act='× '+D.uang(v['s_'+i]);label='Laba per unit';result=D.uang(o.hasil);
    }else{
      var ref=o.acuan?o.acuan.split('_'):null;head=ref?({q:'Terjual',p:'Harga/unit',c:'Biaya/unit',t:'Waktu'}[ref[0]])+': '+m.nama[Number(ref[1])]:'Diketahui';
      source=format(o.masukan,o.hari?'q':o.bidang)+(o.hari?' hari':o.bidang==='t'?' jam':o.bidang==='q'?' produk':'');
      act=o.jenis==='nilai'?(o.hari?'× '+o.jamPerHari+' jam/hari':'Nilai langsung'):'× '+(o.persen?D.angka(o.num*100/o.den)+'%':o.den===1?o.num:o.num+'/'+o.den);
      label=o.jenis==='nilai'?(o.hari?'Ubah ke jam':'Salin data'):o.tambah?(o.tambah>0?'+ ':'- ')+format(Math.abs(o.tambah),o.bidang):'Gunakan perbandingan';
      result=format(o.hasil,o.bidang)+(o.bidang==='t'?' jam':o.bidang==='q'?' produk':'');
    }
    K.t(o.jenis==='produk'?'Jumlah unit × laba per unit = laba bulanan.':LABEL[o.bidang]+' '+m.nama[i]+(o.acuan?' dihitung dari nilai rujukan.':' diperoleh dari petunjuk.'),24,64,{ukuran:18});
    [[24,220],[276,210],[518,258]].forEach(function(a,k){K.rect(a[0],84,a[1],91,{isi:k===2?C.latarSorot:k===0?C.latarPanah:'#f4f6fa',garis:k===2?C.sorot:k===0?C.panah:'#cbd3df',rx:7});});
    K.t(head,134,111,{rata:'middle',ukuran:18});K.t(source,134,147,{rata:'middle',tebal:true,ukuran:23});
    K.t(act,381,118,{rata:'middle',tebal:true,ukuran:23});K.t(label,381,150,{rata:'middle',ukuran:17});
    K.t(m.nama[i],647,111,{rata:'middle',tebal:true,ukuran:20});K.t(result,647,147,{rata:'middle',tebal:true,ukuran:24,isi:C.sorot});
    K.panah(249,130,270,130,{warna:C.panah,kepala:7});K.panah(490,130,512,130,{warna:C.panah,kepala:7});
  }
  function tabel(K,m,y){
    var C=S.BAHAS,produk=m.tipe==='produk',fields=produk?['u','s','l']:['q','p','c','l'];
    var labels=produk?['Unit/bulan','Laba/unit','Laba/bulan']:['Terjual','Harga/unit','Biaya/unit','Keuntungan'];
    var left=24,nw=112,cw=(752-nw)/fields.length;
    K.rect(left,y,752,28,{isi:'#e9eef7'});K.t('Nama',left+12,y+20,{ukuran:17,tebal:true});
    fields.forEach(function(f,j){K.t(labels[j],left+nw+cw*(j+0.5),y+20,{rata:'middle',ukuran:17,tebal:true});});
    m.nama.forEach(function(n,i){var yy=y+28+i*29;K.rect(left,yy,752,29,{isi:i%2?'#f8fafc':'#ffffff',garis:'#e2e7ef',tebal:0.5});K.t(n,left+12,yy+21,{ukuran:18,tebal:true});
      fields.forEach(function(f,j){var key=f+'_'+i,x=left+nw+cw*j,val=m.nilai[key],isNew=m.baru===key||(m.kolomBaru||[]).indexOf(key)>=0,ref=m.operasi&&(m.operasi.acuan===key||(m.operasi.hitung||[]).some(function(o){return o.acuan===key;}));
        if(isNew||ref)K.rect(x+2,yy+1,cw-4,27,{isi:isNew?C.latarSorot:C.latarPanah,garis:isNew?C.sorot:C.panah});
        K.t(format(val,f),x+cw/2,yy+21,{rata:'middle',ukuran:18,tebal:isNew||f==='l'&&val!=null,isi:isNew?C.sorot:ref?C.panah:f==='l'&&val!=null?C.jawab:C.teks});
      });
    });
  }
  function svgHitung(m,judul){
    if(m.kategoriEntitas)return Qc.gambar('hitung',m,judul);
    if(m.tahap==='orang')return svgOrang(m,judul);
    var C=S.BAHAS,initial=m.tahap==='awal',waktu=m.tipe==='waktu',y=initial?98:220;
    var h=y+28+m.nama.length*(waktu?32:29)+58,K=kanvas(judul,h);
    if(initial)K.t(waktu?'Waktu yang belum dihitung ditandai ?. Semua hasil memakai jam.':'Data bertanda ? akan diisi langkah demi langkah.',24,65,{ukuran:18});
    else operasi(K,m);
    if(waktu){
      var known=m.nama.map(function(_,i){return m.nilai['t_'+i];}).filter(function(x){return x!=null;}),max=Math.max.apply(null,[1].concat(known));
      K.t('Waktu kerja dalam jam — susunan nama belum diurutkan',24,y,{ukuran:17,tebal:true});
      m.nama.forEach(function(n,i){var yy=y+17+i*32,key='t_'+i,val=m.nilai[key],baru=m.baru===key;
        K.t(n,24,yy+18,{ukuran:18,tebal:baru});K.rect(138,yy,506,23,{isi:'#f1f4f8',rx:3});
        if(val!=null)K.rect(138,yy,506*val/max,23,{isi:baru?C.sorot:'#9db7d9',rx:3});
        K.t(val==null?'?':D.angka(val)+' jam',660,yy+18,{ukuran:18,tebal:baru,isi:baru?C.sorot:C.teks});
      });
    }else{
      if(!initial)K.t('Kemajuan hitungan — susunan nama belum diurutkan',24,y-12,{ukuran:17,tebal:true});
      tabel(K,m,y);
    }
    K.t(initial?'Baca petunjuk, lalu mulai dari data yang sudah diketahui.':'Jingga = hasil baru; biru = data rujukan; ? = belum dihitung.',24,h-23,{ukuran:17,isi:C.teksRedup});
    return K.fini();
  }
  function svgOrang(m,judul){
    var o=m.operasi,C=S.BAHAS,y=310,h=y+28+m.nama.length*29+50,K=kanvas(judul,h);
    K.t('Selesaikan jumlah, harga, biaya, lalu keuntungan dalam satu langkah.',24,62,{ukuran:18});
    ['q','p','c'].forEach(function(f,j){var yy=77+j*40,op=o.hitung.find(function(x){return x.bidang===f;});
      K.rect(24,yy,752,36,{isi:C.latarSorot,garis:'#eed8c5',rx:4});
      K.t({q:'Terjual (produk)',p:'Harga/unit ($)',c:'Biaya/unit ($)'}[f],36,yy+25,{ukuran:18,tebal:true});
      K.t(rumusKolom(op,m.nama),218,yy+25,{ukuran:20,isi:C.teks});
    });
    [[24,225],[278,235],[542,234]].forEach(function(a,k){K.rect(a[0],210,a[1],70,{isi:k===2?C.latarSorot:'#f4f6fa',garis:k===2?C.sorot:'#cbd3df',rx:7});});
    K.t('Jumlah terjual',136,234,{rata:'middle',ukuran:17});K.t(D.angka(o.jumlah)+' produk',136,263,{rata:'middle',tebal:true,ukuran:22});
    K.t('Laba per produk',395,230,{rata:'middle',ukuran:16});K.t(D.uang(o.harga)+' - '+D.uang(o.biaya),395,252,{rata:'middle',ukuran:18});K.t('= '+D.uang(o.margin),395,274,{rata:'middle',tebal:true,ukuran:20});
    K.t(m.nama[o.orang]+' / minggu',659,234,{rata:'middle',ukuran:17});K.t(D.uang(o.hasil),659,263,{rata:'middle',tebal:true,ukuran:24,isi:C.sorot});
    K.t('×',263,253,{rata:'middle',tebal:true,ukuran:25});K.panah(518,249,536,249,{warna:C.panah,kepala:6});
    K.t('Kemajuan hitungan — satu baris selesai setiap langkah',24,y-7,{ukuran:17,tebal:true});tabel(K,m,y);
    K.t('Jingga = baris yang baru selesai; biru = rujukan; ? = belum dihitung.',24,h-20,{ukuran:17,isi:C.teksRedup});return K.fini();
  }
  function svgAkhir(m,judul){
    if(m.kategoriEntitas)return Qc.gambar('akhir',m,judul);
    var C=S.BAHAS,waktu=m.tipe==='waktu',f=waktu?'t':'l',h=126+m.nama.length*43,K=kanvas(judul,h);
    K.t(waktu?'Waktu paling singkat mendapat Peringkat 1.':'Nilai terbesar mendapat Peringkat 1; gunakan total '+(m.tipe==='produk'?'laba bulanan.':'keuntungan mingguan.'),24,65,{ukuran:18});
    var max=Math.max.apply(null,m.urutan.map(function(i){return m.nilai[f+'_'+i];}));
    m.urutan.forEach(function(i,k){var y=87+k*43,val=m.nilai[f+'_'+i];K.cercle(41,y+15,15,{isi:C.jawab});K.t(m.peringkat[i],41,y+22,{rata:'middle',tebal:true,ukuran:22,isi:'#ffffff'});
      K.t(m.nama[i],68,y+22,{tebal:true,ukuran:19});K.rect(184,y+2,418,29,{isi:'#f1f4f8',rx:3});K.rect(184,y+2,418*val/max,29,{isi:k===0?C.jawab:'#9db7d9',rx:3});K.t(waktu?D.angka(val)+' jam':D.uang(val),620,y+23,{ukuran:21,tebal:true,isi:k===0?C.jawab:C.teks});
    });
    K.t('Urutan akhir memakai seluruh hasil perhitungan.',24,h-18,{ukuran:17,isi:C.jawab});return K.fini();
  }
  return {susun:susun,GAMBAR:{'badges-rantai':svgRantai,'badges-hitung':svgHitung,'badges-akhir':svgAkhir,'badges-kendala':Shl.gambar}};
});
