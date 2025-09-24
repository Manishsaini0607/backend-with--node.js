import { Buffer } from 'buffer';

// Create a buffer from a string
// const buf = Buffer.alloc(8).fill(32);
// console.log(buf, buf.buffer);


// const buf1 = Buffer.from('Hello, World!');
// console.log(buf1, buf1.buffer);



const buf2 = Buffer.allocUnsafe(4100)
console.log( buf2.toString());