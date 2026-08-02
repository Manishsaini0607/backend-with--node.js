# 04. Writable Streams + Backpressure 📝

---

## Writable Stream Kya Hai?

Data **likhne** ke liye — destination pe data bhejta hai.

```js
const fs = require('fs');

const writable = fs.createWriteStream('./output.log', {
  flags: 'a',           // 'a' = append, 'w' = overwrite
  highWaterMark: 16384  // 16KB internal buffer (default)
});

// Data likhna
writable.write('Log entry 1\n');
writable.write('Log entry 2\n');
writable.end('Last entry\n'); // Stream band karo
```

---

## Important Events

```js
const writable = fs.createWriteStream('./file.txt');

writable.on('drain', () => {
  // Buffer khali hua — ab safe hai likhna
  console.log('Buffer drained, writing resumed');
});

writable.on('finish', () => {
  // .end() ke baad saara data flush hua
  console.log('All data written!');
});

writable.on('error', (err) => {
  console.error('Write error:', err);
});

writable.on('close', () => {
  console.log('File closed');
});
```

---

## ⚠️ Backpressure — Sabse Important Production Concept

### Problem Kya Hai?

```
Fast Readable ──────────────────→ Slow Writable
(Network: 1Gbps)                  (Disk: 100MBps)

Buffer FULL ho jaata hai → Memory crash!
```

### Backpressure Handle Karna

`write()` method ek **boolean return** karta hai:
- `true` → Buffer mein space hai, continue likho
- `false` → Buffer full! Ruko, 'drain' event ka intezaar karo

```js
const fs = require('fs');

const readable = fs.createReadStream('./huge-file.txt');
const writable = fs.createWriteStream('./output.txt');

readable.on('data', (chunk) => {
  // write() ka return value check karo!
  const canContinue = writable.write(chunk);

  if (!canContinue) {
    // Buffer full — readable stream ko pause karo
    readable.pause();
    console.log('Backpressure! Pausing readable...');
  }
});

// Writable ka buffer khali hua — resume karo
writable.on('drain', () => {
  readable.resume();
  console.log('Buffer drained, resuming...');
});

readable.on('end', () => {
  writable.end();
});
```

> **Note:** Production mein ye manually nahi karte — `pipe()` ya `pipeline()` use karte hain jo automatically backpressure handle karta hai!

---

## Writable Stream Ka Internal Buffer

```
writable.write(chunk1) → [Buffer: chunk1]           → Disk write
writable.write(chunk2) → [Buffer: chunk1 + chunk2]  → Disk write
writable.write(chunk3) → [Buffer: FULL!]             → false return karo
                               ↓
                    Disk write complete (drain)
                               ↓
                    [Buffer: empty] → resume!
```

---

## States of Writable Stream

```
        writable.write()
              ↓
    [WRITABLE] ←──────── drain event
         |
         | Buffer full?
         ↓
    [BUFFERING]
         |
         | .end() called
         ↓
    [FINISHING]
         |
         | All flushed
         ↓
    [FINISHED] → 'finish' event fire
```

---

## Writable Stream Close Karna

```js
const writable = fs.createWriteStream('./log.txt');

// Data likhte raho...
writable.write('Entry 1\n');
writable.write('Entry 2\n');

// .end() se stream band karo — buffered data flush hoga pehle
writable.end('Final entry\n', () => {
  console.log('Stream closed, sab kuch likh gaya!');
});

// Ya events se:
writable.on('finish', () => {
  console.log('✅ All written and closed');
});
```

---

## Production Example: Logging System

```js
const fs = require('fs');
const path = require('path');

class ProductionLogger {
  constructor() {
    this.logFile = path.join(__dirname, 'app.log');
    this.stream = fs.createWriteStream(this.logFile, { flags: 'a' });
    this.buffer = [];
    this.isWriting = false;
  }

  log(message) {
    const entry = `[${new Date().toISOString()}] ${message}\n`;

    // Buffer check karo
    const ok = this.stream.write(entry);

    if (!ok) {
      // Backpressure — in-memory queue mein daalo
      this.buffer.push(entry);
      
      if (!this.isWriting) {
        this.isWriting = true;
        this.stream.once('drain', () => {
          this.isWriting = false;
          this.flushBuffer();
        });
      }
    }
  }

  flushBuffer() {
    while (this.buffer.length > 0) {
      const entry = this.buffer.shift();
      const ok = this.stream.write(entry);
      if (!ok) {
        this.stream.once('drain', () => this.flushBuffer());
        return;
      }
    }
  }

  close() {
    this.stream.end();
  }
}

// Usage:
const logger = new ProductionLogger();
logger.log('Server started');
logger.log('User logged in: user123');
```

---

> 💡 **Interview Question:** "Backpressure kya hota hai?"
> **Answer:** "Jab writer, reader se slow ho aur buffer overflow ho jaye. `write()` false return karta hai aur hume readable ko pause karna chahiye jab tak `drain` event na aaye."
