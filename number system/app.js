import fs from 'node:fs/promises';
const buffer= await fs.readFile('./app.txt')



function bufferToString(buffer){
    let str="";

     buffer.forEach(el => {
         str += String.fromCharCode(el);
     });
   return str;
}

  const str= bufferToString(buffer)
  console.log(str)

