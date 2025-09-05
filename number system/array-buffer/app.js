 const a =  new ArrayBuffer(1.99*1024*1024*1024);
 const view = new DataView(a)

 for (let i = 0; i < view.byteLength; i += 4) {
   view.setInt8(i, Math.random() * 100, true);
 }


 console.log(a)