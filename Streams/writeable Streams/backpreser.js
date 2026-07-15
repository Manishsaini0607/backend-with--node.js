import fs from 'fs'

// Readable stream: file ko chunks me read karega (default highWaterMark ~64KB)
const readable = fs.createReadStream('source-file-path')

// Writeable stream: destination file me chunks likhega
const writeable = fs.createWriteStream('dest-file-path')

readable.on('data', (chunk) => {
  // write() return karta hai true/false
  // true  -> internal buffer highWaterMark se neeche hai, likhte raho
  // false -> buffer full ho gaya, ruk jao warna memory bhar jayegi
  const canContinue = writeable.write(chunk)

  if (!canContinue) {
    // Read rok do jab tak writeable buffer khali na ho
    // (backpressure handle karne ka core step)
    readable.pause()
  }
})

// Jab writeable ka buffer khali ho jaye (drain ho jaye)
// tab hi readable ko dobara resume karo
writeable.on('drain', () => {
  readable.resume()
})

// Read complete hone ke baad write stream ko close karo
// warna file handle open reh jayega, process hang ho sakta hai
readable.on('end', () => {
  writeable.end()
})

// Dono streams pe error listener zaroori hai
// warna unhandled error se process crash ho sakta hai silently
readable.on('error', (err) => console.error('Read error:', err))
writeable.on('error', (err) => console.error('Write error:', err))

/*
  NOTES:

  1. Backpressure kya hota hai?
     Jab readable stream data produce karne me fast ho aur writeable
     stream (disk/network) usko consume karne me slow ho, tab data
     RAM me buffer hone lagta hai. Agar control na kiya jaye to
     memory usage bahut badh sakta hai (large files/streams me).
     pause()/resume() + drain event isi problem ko solve karte hain.

  2. write() ka return value:
     - true  => aur data bhej sakte ho
     - false => ruko, buffer highWaterMark cross kar chuka hai

  3. highWaterMark:
     Default readable/writeable dono ke liye ~64KB (files ke case me).
     Custom set kar sakte ho:
     fs.createReadStream(path, { highWaterMark: 16 * 1024 })

  4. Production shortcut:
     Yehi sab logic Node internally handle karta hai agar .pipe() use karo:
       readable.pipe(writeable)
     Ya better error handling ke sath:
       import { pipeline } from 'stream/promises'
       await pipeline(readable, writeable)

     Manual pause/resume seekhne ke liye achha hai, lekin real projects
     me pipeline() zyada safe aur clean hota hai.
*/