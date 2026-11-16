/* Pemeriksa independen: menyimpulkan jawaban hanya dari gambar yang ditampilkan.
 * Tidak mengimpor penyusun, tidak memakai jawaban/pola/aturan tersimpan untuk inferensi.
 */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();else root.CekPolaRiset=factory();
})(typeof self!=='undefined'?self:this,function(){
  'use strict';
  function js(x){return JSON.stringify(x);}
  function cp(x){return JSON.parse(js(x));}
  function mod(x,n){return (x%n+n)%n;}
  function unique(a){var o=[];a.forEach(function(x){if(!o.some(function(y){return js(x)===js(y);}))o.push(x);});return o;}
  function only(a){a=unique(a);if(a.length!==1)throw new Error('Pola gambar tidak menentukan satu jawaban ('+a.length+' kemungkinan).');return a[0];}
  function linear(values,n){
    var d=n?mod(values[1]-values[0],n):values[1]-values[0];
    if(!values.every(function(v,i){return v===(n?mod(values[0]+i*d,n):values[0]+i*d);}))throw new Error('Deret tidak konsisten.');
    return n?mod(values[0]+values.length*d,n):values[0]+values.length*d;
  }
  function sequence(d){
    var cells=d.kotak,last=cp(cells[cells.length-1]);
    if(cells.length<3||cells.length>5)throw new Error('The Next Box harus berisi 4, 5, atau 6 kotak termasuk tanda tanya.');
    if(last.mode==='jumlah'){
      last.jumlah=last.jumlah.map(function(_,j){return linear(cells.map(function(f){return f.jumlah[j];}));});
      if(last.jumlah.some(function(n){return n<0||n>10;}))throw new Error('Jumlah objek di luar batas.');
      if(last.arah!=null)last.arah=linear(cells.map(function(f){return f.arah;}),8);
    }else if(last.mode==='ukuran'){
      last.ukuran=linear(cells.map(function(f){return f.ukuran;}));
      last.arah=linear(cells.map(function(f){return f.arah;}),8);
      var fill=cells.map(function(f){return f.isi;});
      if(fill.every(function(v){return v===fill[0];}))last.isi=fill[0];
      else if(fill.every(function(v,i){return v===fill[i%2];}))last.isi=fill[cells.length%2];
      else throw new Error('Isian deret tidak konsisten.');
    }else throw new Error('Mode deret di luar riset.');
    return [last];
  }
  function shifted(d){
    var g=d.grid,n=g[0].length,poss=[];
    for(var step=1;step<n;step++){
      var base=new Array(n),ok=true;
      g.forEach(function(row,r){row.forEach(function(f,c){if(!f)return;var j=(c+step*r)%n;if(base[j]&&base[j]!==f.b)ok=false;base[j]=f.b;});});
      if(!ok||base.filter(Boolean).length!==n||unique(base).length!==n)continue;
      poss.push(d.lubang.map(function(p){return base[(p[1]+step*p[0])%n];}));
    }
    var names=only(poss),fills={};
    if(n===5){
      var phases=[];
      for(var ph=0;ph<2;ph++)if(g.every(function(row,r){return row.every(function(f,c){return !f||f.i===2*((r+c+ph)%2);});}))phases.push(ph);
      var phase=only(phases);
      return d.lubang.map(function(p,j){return {mode:'simbol',b:names[j],i:2*((p[0]+p[1]+phase)%2)};});
    }
    g.forEach(function(row){row.forEach(function(f){if(!f)return;if(fills[f.b]!=null&&fills[f.b]!==f.i)throw new Error('Warna bentuk berubah pada matriks 5x6.');fills[f.b]=f.i;});});
    return names.map(function(b){if(fills[b]==null)throw new Error('Isian bentuk tidak diketahui.');return {mode:'simbol',b:b,i:fills[b]};});
  }
  function attribute(d){
    var g=d.grid,p=d.lubang[0],seen=g.flat().filter(Boolean),result={mode:'atribut',unsur:[]};
    for(var j=0;j<seen[0].unsur.length;j++){
      var obj={};
      ['b','i'].forEach(function(field){
        var all=unique(seen.map(function(f){return f.unsur[j][field];}));
        if(all.length===1&&field==='i'){obj[field]=all[0];return;}
        if(all.length!==3)throw new Error('Distribusi harus terdiri dari tiga nilai berbeda.');
        for(var r=0;r<3;r++){
          var row=g[r].filter(Boolean).map(function(f){return f.unsur[j][field];});
          var col=g.map(function(b){return b[r];}).filter(Boolean).map(function(f){return f.unsur[j][field];});
          if(unique(row).length!==row.length||unique(col).length!==col.length)throw new Error('Nilai berulang pada distribusi baris/kolom.');
        }
        var used=g[p[0]].filter(Boolean).concat(g.map(function(b){return b[p[1]];}).filter(Boolean)).map(function(f){return f.unsur[j][field];});
        obj[field]=only(all.filter(function(v){return used.indexOf(v)<0;}));
      });result.unsur.push(obj);
    }
    return [result];
  }
  function orbital(d){
    var answer={mode:'orbit'},g=d.grid,p=d.lubang[0];
    ['pos','hitam'].forEach(function(field){var possible=[];
      for(var a=0;a<5;a++)for(var dr=0;dr<5;dr++)for(var dc=0;dc<5;dc++){
        if(g.every(function(row,r){return row.every(function(f,c){return !f||f[field]===(a+r*dr+c*dc)%5;});}))possible.push((a+p[0]*dr+p[1]*dc)%5);
      }answer[field]=only(possible);
    });return [answer];
  }
  function overlay(d){
    var g=d.grid,p=d.lubang[0];if(p[1]!==2)throw new Error('Kotak hasil harus berada pada kolom ketiga.');
    var operations=[function(a,b){return a|b;},function(a,b){return a&~b;},function(a,b){return b&~a;}];
    var result=[];operations.forEach(function(op){
      if(g.filter(function(row){return row.every(Boolean);}).every(function(row){return op(row[0].mask,row[1].mask)===row[2].mask;}))result.push(op(g[p[0]][0].mask,g[p[0]][1].mask));
    });return [{mode:'gabung',mask:only(result)}];
  }
  function infer(d){
    if(d.kotak)return sequence(d);
    var cell=d.grid.flat().filter(Boolean)[0];
    if(cell.mode==='simbol')return shifted(d);
    if(cell.mode==='atribut')return attribute(d);
    if(cell.mode==='orbit')return orbital(d);
    if(cell.mode==='gabung')return overlay(d);
    throw new Error('Bentuk riset tidak dikenal.');
  }
  function check(b,m,A){
    var gd=(b.stimulus.gambar||[])[0],d=gd&&gd.model;
    if(!d){m.push('Gambar soal riset tidak ada.');return;}
    if(!A.bacaTampilan(b,m,d.kotak?'riset-deret':'riset-grid','riset-opsi',function(x){return x.fig;}))return;
    if(js(d)!==js(b.model.data))m.push('Model berbeda dari gambar soal yang tampil.');
    if(d.jawaban)m.push('Jawaban tersisip dalam gambar soal.');
    var key=infer(d),matches=[];
    b.opsi.forEach(function(o,i){
      if(!o.gambar||o.gambar.jenis!=='riset-opsi'){m.push('Pilihan riset harus bergambar.');return;}
      if(js(o.gambar.model.cfg)!==js(d.cfg))m.push('Daftar bentuk pada opsi berbeda dari soal.');
      if(js(o.gambar.model.fig)!==js(b.model.pilihan[i]))m.push('Model pilihan berbeda dari gambar opsi.');
      if(js(o.gambar.model.fig)===js(key))matches.push(i);
    });
    A.tepatSatu(b,m,matches,'pola visual riset');
  }
  function fingerprint(b){
    var d=b.stimulus.gambar[0].model,key=b.opsi[b.kunci].gambar.model.fig;
    if(d.kotak)return d.kotak.concat(key).map(function(f){return js([d.cfg,f]);});
    return d.grid.flatMap(function(row,r){return row.map(function(f,c){var j=d.lubang.findIndex(function(p){return p[0]===r&&p[1]===c;});return js([d.cfg,f||key[j]]);});});
  }
  return {TIPE:{'pola-riset':{periksa:check,sidik:fingerprint,batas:1}},infer:infer};
});
