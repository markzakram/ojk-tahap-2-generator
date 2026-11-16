/* Ilustrasi pembeda Produk A–F; data dan urutan ditentukan oleh label produk. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.IkonProduk=factory();
})(typeof self!=='undefined'?self:this,function(){
  'use strict';
  var gambar=[
    '<g transform="rotate(35 24 24)"><path d="M10 8h6v28l-3 7-3-7z" fill="#eb5599"/><path d="M21 3h6v31l-3 7-3-7z" fill="#56b7d4"/><path d="M32 6h6v28l-3 7-3-7z" fill="#a2be45"/><path d="m10 36 3 7 3-7m5-2 3 7 3-7m5 0 3 7 3-7" fill="#f3d4ab"/></g>',
    '<g fill="none" stroke="#bd8847" stroke-width="2.5"><ellipse cx="23" cy="23" rx="16" ry="8" transform="rotate(30 23 23)"/><ellipse cx="24" cy="22" rx="16" ry="9" transform="rotate(-30 24 22)"/><ellipse cx="22" cy="27" rx="16" ry="8"/><ellipse cx="25" cy="24" rx="8" ry="16" transform="rotate(30 25 24)"/></g>',
    '<path d="m5 13 13-6 17 8-13 6z" fill="#f685b5"/><path d="m5 13 17 8v10L5 23z" fill="#df4e88"/><path d="m22 21 13-6v10l-13 6z" fill="#fbb6d4"/><path d="m16 29 13-6 14 7-13 7z" fill="#ffe66b"/><path d="m16 29 14 8v8l-14-8z" fill="#52b6e3"/><path d="m30 37 13-7v8l-13 7z" fill="#2782b9"/>',
    '<g transform="rotate(35 24 24)"><path d="M8 6h6v28l-3 8-3-8z" fill="#e85d44"/><path d="M19 5h6v28l-3 8-3-8z" fill="#e9c446"/><path d="M30 7h6v28l-3 8-3-8z" fill="#68ab5d"/><path d="m8 34 3 8 3-8m5-1 3 8 3-8m5 2 3 8 3-8" fill="#e8c496"/></g>',
    '<path d="m6 29 30-5 7 9-30 7-7-4z" fill="#52616d"/><path d="m8 26 27-7 4 8-28 7z" fill="#aab7c0"/><path d="m8 13 28-5 5 6-29 7z" fill="#46535d"/><path d="m12 21 29-7-3 7-27 7z" fill="#80909b"/><path d="m13 34 23-6" stroke="#dce4e8" stroke-width="2"/>',
    '<path d="m6 9 17-3 3 17-17 3z" fill="#b5e36c"/><path d="m28 8 15 4-4 16-15-4z" fill="#f9df62"/><path d="m6 29 17-4 3 17-17 3z" fill="#63c8e4"/><path d="m28 29 15-3 3 17-15 3z" fill="#e17cc8"/>'
  ];
  return {svg:function(i){return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="44" height="44" aria-hidden="true"><rect width="48" height="48" rx="6" fill="#f4f6f8"/>'+gambar[i%6]+'</svg>';}};
});
