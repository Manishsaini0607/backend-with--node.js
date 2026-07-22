/**
 * Node.js Writable Streams & Backpressure Example
 * ===============================================
 * 
 * KEY CONCEPTS:
 * 1. highWaterMark: The internal buffer size threshold (in bytes). Here set to 4 bytes
 *    (default for file writable streams is 64 KB) so the buffer fills up quickly.
 * 2. Backpressure: When writeStream.write() returns false, the internal buffer is full.
 *    We must temporarily pause writing to prevent memory bloat/OOM errors.
 * 3. writableLength: Property showing the current number of bytes waiting in the buffer.
 * 4. 'drain' Event: Emitted when the buffered data has been flushed to disk and the stream
 *    is ready to accept more data again.
 */

import fs from 'fs'

// Create a writable stream targeting 'file.txt' with a tiny 4-byte buffer threshold
const writeStream = fs.createWriteStream('file.txt', { highWaterMark: 4 })

let i = 1

/**
 * Writes data in chunks, checking for backpressure on each write.
 */
function write1to100() {
  while (i <= 1000000000000) {
    // Show current buffer size before writing
    console.log(writeStream.writableLength)

    // writeStream.write() returns:
    // - true: Buffer is below highWaterMark (can keep writing)
    // - false: Buffer is at/above highWaterMark (backpressure triggered! Pause writing)
    const canWriteMore = writeStream.write('a')
    i++

    // If backpressure is triggered (canWriteMore is false), pause the loop
    if (!canWriteMore) {
      break
    }
  }
}

// When the internal buffer flushes data to disk, 'drain' is emitted.
// We resume writing data where we left off.
writeStream.on('drain', () => {
  write1to100()
})

// Initial call to start writing
write1to100()