import fs from 'fs'
import { pipeline } from 'stream'

// highWaterMark: kitna data ek chunk me buffer/read hoga
// yaha 1MB set kiya hai (default ~64KB hota hai)
const readable = fs.createReadStream('file path', { highWaterMark: 1 * 1024 * 1024 })
const writeable = fs.createWriteStream('filename')

// pipeline() -> pipe() ka safer/better version
pipeline(readable, writeable, (err) => {
  if (err) {
    console.error('Pipeline failed:', err)
  } else {
    console.log('Pipeline succeeded, file copy complete')
  }
})

/*
  NOTES: pipe vs unpipe vs pipeline
  ----------------------------------

  1. pipe()
     readable.pipe(writeable)

     - Data ko readable se writeable me automatically transfer karta hai.
     - Backpressure internally handle karta hai (pause/resume manually
       nahi likhna padta).
     - LIMITATION: Agar readable ya writeable me error aaye, to pipe()
       khud se dusri stream ko destroy/close nahi karta. Matlab error
       ko manually dono streams pe listen karna padta hai, warna
       file handle leak ho sakta hai (memory/fd leak risk).
     - 'end' event khud writeable.end() bhi call kar deta hai
       (jab tak { end: false } option na diya ho).

  2. unpipe()
     readable.unpipe(writeable)

     - Piping ko rok deta hai / disconnect kar deta hai readable
       aur writeable ke beech.
     - Use case: jab multiple destinations ho aur beech me switch
       karna ho, ya kisi condition pe streaming rokni ho bina
       dono streams ko destroy kiye.
     - Readable stream flow me rehta hai lekin ab writeable ko
       data nahi jayega jab tak dobara pipe() na karo.

     Example:
       readable.pipe(writeable)
       // kuch condition pe:
       readable.unpipe(writeable)

  3. pipeline()
     import { pipeline } from 'stream'   // callback version
     import { pipeline } from 'stream/promises'  // promise/async version

     - pipe() ka improved version.
     - Multiple streams ko chain kar sakte ho (e.g. read -> transform
       -> compress -> write) ek hi call me.
     - IMPORTANT: Agar kisi bhi stream me error aaye, pipeline()
       automatically saari streams ko properly destroy/cleanup kar
       deta hai. Yeh pipe() ki sabse badi limitation solve karta hai.
     - Callback/promise se pata chal jata hai ki process complete
       hua ya fail hua.

     Example with multiple streams (chaining):
       import { createGzip } from 'zlib'
       pipeline(
         readable,
         createGzip(),      // transform stream (compression)
         writeable,
         (err) => {
           if (err) console.error('Failed', err)
           else console.log('Done')
         }
       )

  SUMMARY:
  - Chhoti/simple jagah pipe() chal jayega, but error cleanup manual.
  - Production code me hamesha pipeline() prefer karo — safe aur
    error-handling built-in hai.
  - unpipe() sirf tab use hota hai jab piping ko beech me
    dynamically control/stop karna ho.
*/