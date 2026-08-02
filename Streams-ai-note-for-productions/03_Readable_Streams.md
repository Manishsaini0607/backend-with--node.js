# 03. Readable Streams — Deep Dive 📖

---

## Readable Stream Create Karna

```js
const { Readable } = require('stream');
const fs = require('fs');

// Method 1: Built-in se — File read
const fileStream = fs.createReadStream('./data.csv', {
  highWaterMark: 64 * 1024, // 64KB chunks (default)
  encoding: 'utf8'
});

// Method 2: Custom Readable Stream banana
const customReadable = new Readable({
  read(size) {
    // Yahan se data push karo
    this.push('Hello ');
    this.push('World!');
    this.push(null); // null = stream khatam
  }
});
```

---

## Data Consume Karne Ke 2 Modes

### Mode 1: Flowing Mode (Events)

Stream automatically data push karta hai jab available ho.

```js
const stream = fs.createReadStream('./big-file.txt');

// 'data' event attach karne se flowing mode start
stream.on('data', (chunk) => {
  console.log(`Chunk received: ${chunk.length} bytes`);
  // Production mein: process karo — DB mein save, compress, etc.
});

stream.on('end', () => {
  console.log('Sab data aa gaya!');
});

stream.on('error', (err) => {
  console.error('Stream error:', err.message);
  // Production mein: error log karo, client ko response bhejo
});
```

### Mode 2: Paused Mode (Manual Read)

Tum control karte ho kab data lena hai.

```js
const stream = fs.createReadStream('./big-file.txt');

// Pause mode mein manually read karo
stream.on('readable', () => {
  let chunk;
  while ((chunk = stream.read(1024)) !== null) {
    // 1024 bytes ek saath leke process karo
    processData(chunk);
  }
});
```

> **Production mein kab use karein?**
> - **Flowing** — jab simply pipe karna ho ya event-driven processing
> - **Paused** — jab backpressure control chahiye (advanced use case)

---

## Internal Buffer

Readable stream apna ek **internal buffer** maintain karta hai.

```
[File/Source]
      ↓ (data aata rehta hai)
[Internal Buffer: 64KB default]
      ↓ (aapka code consume karta hai)
[Your Processing Logic]
```

```js
// highWaterMark se buffer size set karo
const stream = fs.createReadStream('./video.mp4', {
  highWaterMark: 256 * 1024 // 256KB buffer (video ke liye bada buffer)
});
```

**Rule:**
- Buffer full? → Source se data lena **band** ho jaata hai (backpressure)
- Buffer empty? → Source se data dobara aana shuru

---

## Important Events

```js
const stream = fs.createReadStream('./file.txt');

stream.on('data', (chunk) => { /* Data aa raha hai */ });
stream.on('end', () => { /* Saara data aa gaya */ });
stream.on('error', (err) => { /* Kuch galat hua */ });
stream.on('close', () => { /* File descriptor band hua */ });
stream.on('pause', () => { /* Stream pause hua */ });
stream.on('resume', () => { /* Stream resume hua */ });
```

---

## Production Example: Large CSV File Process Karna

```js
const fs = require('fs');
const readline = require('readline');

async function processLargeCSV(filePath) {
  const fileStream = fs.createReadStream(filePath);

  // readline — line-by-line padhne ka efficient tarika
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let rowCount = 0;

  for await (const line of rl) {
    const row = line.split(',');
    // DB mein save karo, validate karo, etc.
    rowCount++;

    // Agar 10 lakh rows bhi ho — memory safe rahegi!
  }

  console.log(`Total rows processed: ${rowCount}`);
}

processLargeCSV('./10million-users.csv');
```

---

## Production Example: HTTP Request Body Stream

```js
const http = require('http');

const server = http.createServer((req, res) => {
  if (req.method === 'POST') {
    let body = '';

    // req ek Readable stream hai
    req.on('data', (chunk) => {
      body += chunk.toString();

      // Security: Body size limit lagao
      if (body.length > 1e6) { // 1MB limit
        req.destroy(); // Connection tod do
        res.writeHead(413); // Payload Too Large
        res.end('Request too large');
      }
    });

    req.on('end', () => {
      const parsedBody = JSON.parse(body);
      res.end(JSON.stringify({ received: true }));
    });
  }
});
```

---

> 💡 **Production Tip:** Hamesha `error` event handle karo. Bina error handler ke, ek unhandled error poore Node.js process ko crash kar deta hai!
