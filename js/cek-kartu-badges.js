/* Independent reader of visible narrative clues; never calls the clue writer. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.CekKartuBadges=factory();})(typeof self!=='undefined'?self:this,function(){
  'use strict';
  function number(s){return Number(String(s).replace(/\$/g,'').replace(/\./g,'').replace(',','.'));}
  function bacaKendala(s,names){
    function id(n){var i=names.indexOf(n);if(i<0)throw new Error('Nama kendala tidak dikenal: '+n);return i;}
    var q;
    if((q=/^Jika (.+) berada pada peringkat (\d+), (.+) berada di atas (.+)$/.exec(s)))return {jenis:'jika',syarat:{jenis:'tetap',orang:id(q[1]),posisi:Number(q[2])},akibat:{jenis:'banding',orang:id(q[3]),lain:id(q[4])}};
    if((q=/^Jarak peringkat (.+) ke (.+) lebih besar daripada jaraknya ke (.+)$/.exec(s)))return {jenis:'banding-jarak',orang:id(q[1]),lain:id(q[2]),dekat:id(q[3])};
    if((q=/^Ada tepat (\d+) orang di antara (.+) dan (.+)$/.exec(s)))return {jenis:'mutlak',orang:id(q[2]),lain:id(q[3]),jarak:Number(q[1])+1};
    if((q=/^(.+) berada di atas (.+), dengan sedikitnya (\d+) orang di antaranya$/.exec(s)))return {jenis:'minimum',orang:id(q[1]),lain:id(q[2]),jarak:Number(q[3])+1};
    if((q=/^(.+) berada dalam (\d+) peringkat teratas$/.exec(s)))return {jenis:'batas',orang:id(q[1]),maks:Number(q[2])};
    if((q=/^(.+) menempati peringkat bernomor (ganjil|genap)$/.exec(s)))return {jenis:'paritas',orang:id(q[1]),ganjil:q[2]==='ganjil'};
    if((q=/^(.+) berada pada peringkat (\d+)$/.exec(s)))return {jenis:'tetap',orang:id(q[1]),posisi:Number(q[2])};
    if((q=/^(.+) berada (\d+) peringkat di atas (.+)$/.exec(s)))return {jenis:'jarak',orang:id(q[1]),lain:id(q[3]),jarak:Number(q[2])};
    if((q=/^(.+) berada di atas (.+)$/.exec(s)))return {jenis:'banding',orang:id(q[1]),lain:id(q[2])};
    throw new Error('Kalimat kendala tidak terbaca: '+s);
  }
  function bacaRingkas(s,names,owner){
    try{return bacaKendala(s,names);}catch(e){}
    function id(n){if(!n||n==='dirinya'){if(!Number.isInteger(owner))throw new Error('Subjek petunjuk tidak jelas');return owner;}var i=names.indexOf(n);if(i<0)throw new Error('Nama kendala tidak dikenal: '+n);return i;}
    var q;
    if((q=/^Jika (.+) ke-(\d+), (.+) di atas (.+)$/.exec(s)))return {jenis:'jika',syarat:{jenis:'tetap',orang:id(q[1]),posisi:Number(q[2])},akibat:{jenis:'banding',orang:id(q[3]),lain:id(q[4])}};
    if((q=/^(?:(.+) )?[Mm]enempati peringkat (\d+|ganjil|genap)$/.exec(s)))return /^\d+$/.test(q[2])?{jenis:'tetap',orang:id(q[1]),posisi:Number(q[2])}:{jenis:'paritas',orang:id(q[1]),ganjil:q[2]==='ganjil'};
    if((q=/^(?:(.+) )?[Mm]asuk (\d+) besar$/.exec(s)))return {jenis:'batas',orang:id(q[1]),maks:Number(q[2])};
    if((q=/^Ada (\d+) orang di antara (.+) dan (.+)$/.exec(s)))return {jenis:'mutlak',orang:id(q[2]),lain:id(q[3]),jarak:Number(q[1])+1};
    if((q=/^Di atas (.+), minimal (\d+) orang di antaranya$/.exec(s)))return {jenis:'minimum',orang:id(null),lain:id(q[1]),jarak:Number(q[2])+1};
    if((q=/^(?:(.+) )?(\d+) peringkat di (atas|bawah) (.+)$/.exec(s))){var a=id(q[1]),b=id(q[4]);return {jenis:'jarak',orang:q[3]==='atas'?a:b,lain:q[3]==='atas'?b:a,jarak:Number(q[2])};}
    if((q=/^Berada di (atas|bawah) (.+)$/.exec(s))){var a=id(null),b=id(q[2]);return {jenis:'banding',orang:q[1]==='atas'?a:b,lain:q[1]==='atas'?b:a};}
    if((q=/^(.+) di (atas|bawah) (.+)$/.exec(s))){var a=id(q[1]),b=id(q[3]);return {jenis:'banding',orang:q[2]==='atas'?a:b,lain:q[2]==='atas'?b:a};}
    throw new Error('Kalimat ringkas tidak terbaca: '+s);
  }
  function modelDari(b){
    var is=b.isian,names=is.nama.slice(),tipe=b.model.tipe,out={tipe:tipe,nama:names,kategoriEntitas:b.model.kategoriEntitas,petunjuk:[]};
    if(is.kartu.filter(function(k){return !k.petunjuk.join(' ').trim();}).length>2)throw new Error('Maksimal dua deskripsi kosong');
    if(b.model.ragam==='shl'){
      out.ragam='shl';
      is.kartu.forEach(function(card,i){if(card.nama!==names[i]||card.petunjuk.length!==1)throw new Error('Kartu/nama tidak lengkap');var s=card.petunjuk[0];if(!s.trim())return;if(!s.endsWith('.'))throw new Error('Kalimat kendala belum lengkap');s.slice(0,-1).split('. ').forEach(function(t){out.petunjuk.push(bacaRingkas(t,names,i));});});
      var q=/^(?:Petunjuk tambahan: )?(.+) Pasangkan lencana /.exec(b.pertanyaan||'');if(q){if(!q[1].endsWith('.'))throw new Error('Petunjuk pada pertanyaan belum lengkap');q[1].slice(0,-1).split('. ').forEach(function(t){out.petunjuk.push(bacaKendala(t,names));});}else if(!(b.pertanyaan||'').startsWith('Pasangkan lencana '))throw new Error('Petunjuk pada pertanyaan hilang');return out;
    }
    if(tipe==='waktu'){
      var satuan=(is.pengantar||[]).join(' ').match(/Satu hari kerja terdiri atas (\d+) jam\./);
      if(!satuan)throw new Error('Konversi hari kerja tidak tertulis');out.jamPerHari=Number(satuan[1]);
    }
    function baca(s,field,i){
      function ref(n){var j=names.indexOf(n);if(j<0)throw new Error('Nama rujukan tidak dikenal: '+n);return j;}
      if(field==='t'){
        var w=/^Memerlukan ([\d.]+(?:,\d+)?) (jam|hari kerja)$/.exec(s);
        if(w)return {jenis:'nilai',bidang:'t',orang:i,nilai:number(w[1]),hari:w[2]==='hari kerja'};
        if((w=/^([\d.]+(?:,\d+)?) jam lebih (lama|singkat) dari (.+)$/.exec(s)))return {jenis:'turunan',bidang:'t',orang:i,ref:'t_'+ref(w[3]),num:1,den:1,tambah:number(w[1])*(w[2]==='lama'?1:-1)};
        if((w=/^Sama lama dengan (.+)$/.exec(s)))return {jenis:'turunan',bidang:'t',orang:i,ref:'t_'+ref(w[1]),num:1,den:1,tambah:0};
        if((w=/^Waktunya ([\d.]+(?:,\d+)?)% waktu (.+?)(?:, (ditambah|dikurangi) ([\d.]+(?:,\d+)?) jam)?$/.exec(s)))return {jenis:'turunan',bidang:'t',orang:i,ref:'t_'+ref(w[2]),num:number(w[1]),den:100,tambah:w[4]?number(w[4])*(w[3]==='dikurangi'?-1:1):0,persen:true};
      }
      var pola={q:/^Menjual ([\d.]+) unit$/,p:/^Harga jual \$([\d.]+(?:,\d+)?) per unit$/,c:/^Biaya \$([\d.]+(?:,\d+)?) per unit$/,t:/^Waktunya ([\d.]+(?:,\d+)?) (jam|hari kerja)$/};
      var direct=pola[field].exec(s);
      if(direct)return {jenis:'nilai',bidang:field,orang:i,nilai:number(direct[1]),hari:field==='t'&&direct[2]==='hari kerja'};
      var prefix={q:'Menjual ',p:'Harga jual per unit ',c:'Biaya per unit ',t:'Waktunya '}[field];
      if(s.indexOf(prefix)!==0)throw new Error('Narasi bidang tidak terbaca: '+s);s=s.slice(prefix.length);
      var add=0,tambahan=/, kemudian (ditambah|dikurangi) (\$?[\d.]+(?:,\d+)?) (jam|unit|per unit)$/.exec(s);
      if(tambahan){
        var satuan=field==='t'?'jam':field==='q'?'unit':'per unit';
        if(tambahan[3]!==satuan||((field==='p'||field==='c')!==tambahan[2].startsWith('$')))throw new Error('Satuan tambahan salah');
        add=number(tambahan[2])*(tambahan[1]==='dikurangi'?-1:1);s=s.slice(0,tambahan.index);
      }
      var rel=/^(sama dengan|(\d+(?:,\d+)?%|\d+\/\d+|\d+) dari) (.+)$/.exec(s);
      if(!rel)throw new Error('Hubungan narasi tidak terbaca: '+s);
      var ratio=rel[2]||'1',num,den;
      if(ratio.endsWith('%')){num=number(ratio.slice(0,-1));den=100;}else if(ratio.includes('/')){num=Number(ratio.split('/')[0]);den=Number(ratio.split('/')[1]);}else{num=Number(ratio);den=1;}
      var source=rel[3],ref=null,labels={q:'jumlah unit terjual',p:'harga jual per unit',c:'biaya per unit',t:'waktu'};
      Object.keys(labels).forEach(function(f){
        if(source===labels[f]+'nya')ref=f+'_'+i;
        names.forEach(function(n,j){if(source===labels[f]+' '+n)ref=f+'_'+j;});
      });
      if(ref===null)throw new Error('Nama/data rujukan narasi tidak dikenal: '+source);
      return {jenis:'turunan',bidang:field,orang:i,ref:ref,num:num,den:den,tambah:add,persen:ratio.endsWith('%')};
    }
    function ordinal(sentence,owner){
      names.forEach(function(n,j){var prefix=n+' berada ';if(sentence.startsWith(prefix)){owner=j;sentence='Berada '+sentence.slice(prefix.length);}});
      if(sentence==='Berada pada peringkat terakhir'){out.petunjuk.push({jenis:'tetap',orang:owner,posisi:names.length});return;}
      var c=tipe==='posisi'?/^(?:Berada )?(Tepat|tepat|\d+ peringkat) di (atas|bawah) (.+)$/.exec(sentence):/^(Berada) di (atas|bawah) (.+)$/.exec(sentence);
      if(!c)throw new Error('Petunjuk ordinal tidak terbaca: '+sentence);var j=names.indexOf(c[3]);if(j<0||j===owner||!Number.isInteger(owner))throw new Error('Nama rujukan tidak sah');
      var clue={jenis:tipe==='posisi'?'jarak':'banding',orang:c[2]==='atas'?owner:j,lain:c[2]==='atas'?j:owner};if(tipe==='posisi')clue.jarak=c[1].toLowerCase()==='tepat'?1:Number(c[1].split(' ')[0]);out.petunjuk.push(clue);
    }
    function labaRingkas(s,i){
      var p=/^(.+); harga (.+), biaya (.+)\.$/.exec(s);if(!p)throw new Error('Data keuntungan ringkas tidak lengkap');
      var q=/^Menjual ([\d.]+) unit$/.exec(p[1]);
      if(q)out.petunjuk.push({jenis:'nilai',bidang:'q',orang:i,nilai:number(q[1])});
      else{q=/^Menjual ([\d.]+(?:,\d+)?)% penjualan (.+)$/.exec(p[1]);if(!q||names.indexOf(q[2])<0)throw new Error('Jumlah penjualan ringkas tidak terbaca');out.petunjuk.push({jenis:'turunan',bidang:'q',orang:i,ref:'q_'+names.indexOf(q[2]),num:number(q[1]),den:100,tambah:0,persen:true});}
      ['p','c'].forEach(function(f,k){var s=p[k+2],direct=/^\$([\d.]+(?:,\d+)?)$/.exec(s);if(direct){out.petunjuk.push({jenis:'nilai',bidang:f,orang:i,nilai:number(direct[1])});return;}
        var rel=/^([\d.]+(?:,\d+)?)% harga (jual|.+)$/.exec(s);if(!rel)throw new Error('Harga/biaya ringkas tidak terbaca');var j=rel[2]==='jual'?i:names.indexOf(rel[2]);if(j<0)throw new Error('Nama rujukan ringkas tidak dikenal');out.petunjuk.push({jenis:'turunan',bidang:f,orang:i,ref:'p_'+j,num:number(rel[1]),den:100,tambah:0,persen:true});
      });
    }
    if(tipe==='produk')out.produk=[];
    is.kartu.forEach(function(card,i){
      if(card.nama!==names[i]||card.petunjuk.length!==1)throw new Error('Kartu/nama tidak lengkap');var s=card.petunjuk[0];
      if(!s.trim())return;
      if(tipe==='produk'){
        var p=/^Menjual ([\d.]+) unit\/bulan dengan laba \$(\d+(?:,\d+)?)\/unit\.$/.exec(s)||/^([\d.]+), \$(\d+(?:,\d+)?)$/.exec(s);if(!p)throw new Error('Dua angka laba bulanan tidak lengkap');out.produk.push({unit:number(p[1]),labaPerUnitSen:Math.round(number(p[2])*100)});
      }else if(tipe==='laba'||tipe==='waktu'){
        if(tipe==='laba'&&s.includes('; harga ')){labaRingkas(s,i);return;}
        if(!s.endsWith('.'))throw new Error('Kalimat kartu belum lengkap');
        var parts=s.slice(0,-1).split(/\. (?=(?:Menjual|Harga jual|Biaya) )/),fields=tipe==='laba'?['q','p','c']:['t'];if(parts.length!==fields.length)throw new Error('Data dalam narasi tidak lengkap');
        parts.forEach(function(p,j){out.petunjuk.push(baca(p,fields[j],i));});
      }else{
        if(!s.endsWith('.'))throw new Error('Kalimat ordinal belum lengkap');
        s.slice(0,-1).split('. ').forEach(function(sentence){ordinal(sentence,i);});
      }
    });
    if(tipe==='perbandingan'||tipe==='posisi'){var q=/^(.+) Pasangkan lencana /.exec(b.pertanyaan||'');if(q){if(!q[1].endsWith('.'))throw new Error('Petunjuk pertanyaan belum lengkap');q[1].slice(0,-1).split('. ').forEach(function(s){ordinal(s,null);});}}
    return out;
  }
  return {modelDari:modelDari,kendalaDari:bacaKendala};
});
