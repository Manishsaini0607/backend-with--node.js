# 02. Types of Streams in Node.js 🔄

---

## Node.js Mein 4 Types Ke Streams Hote Hain

```
┌─────────────────────────────────────────────────────┐
│                  NODE.JS STREAMS                     │
│                                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ READABLE │  │ WRITABLE │  │  DUPLEX  │  │TRANSFORM │ │
│  │          │  │          │  │          │  │          │ │
│  │ Data IN  │  │ Data OUT │  │ IN + OUT │  │IN→modify │ │
│  │ from src │  │ to dest  │  │ (both)   │  │   →OUT   │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## 1. Readable Stream

**Data sirf padhne ke liye** — source se data nikalta hai.

```js
const fs = require('fs');

// File padhna — Readable Stream
const readable = fs.createReadStream('./video.mp4');

// HTTP request bhi ek Readable stream hai!
// req.on('data', ...) — yahi kaam karta hai
```

**Real Examples:**
- `fs.createReadStream()` — file read
- `http.IncomingMessage` (req object) — request body
- `process.stdin` — terminal input
- Database cursor (MongoDB `find().cursor()`)

---

## 2. Writable Stream

**Data sirf likhne ke liye** — destination mein data bhejta hai.

```js
const fs = require('fs');

// File likhna — Writable Stream
const writable = fs.createWriteStream('./output.txt');

writable.write('Hello Production!');
writable.end();

// HTTP response bhi ek Writable stream hai!
// res.write('data') — yahi kaam karta hai
```

**Real Examples:**
- `fs.createWriteStream()` — file write
- `http.ServerResponse` (res object) — response bhejni
- `process.stdout` — terminal output
- AWS S3 upload stream

---

## 3. Duplex Stream

**Dono kaam — padhna aur likhna** — ek hi stream mein.

```js
const net = require('net');

// TCP Socket — Duplex stream hai
const server = net.createServer((socket) => {
  // socket se data padh bhi sakte ho, likh bhi sakte ho
  socket.on('data', (data) => {
    socket.write(`Echo: ${data}`); // Read kiya, write kar diya
  });
});
```

**Real Examples:**
- `net.Socket` — TCP connections
- WebSocket connections
- SSH connections

---

## 4. Transform Stream ⭐ (Most Used in Production)

**Data ko modify karke pass karo** — read + transform + write.

```js
const { Transform } = require('stream');
const zlib = require('zlib');

// Gzip Compression — Transform Stream hai
const gzip = zlib.createGzip();

// Input → compress → Output
fs.createReadStream('file.txt')
  .pipe(gzip)                          // Transform!
  .pipe(fs.createWriteStream('file.txt.gz'));
```

**Real Examples:**
- `zlib.createGzip()` — compression
- `crypto.createCipher()` — encryption
- CSV parser streams
- JSON stringify/parse streams

---

## Quick Reference Table

| Stream Type | Direction | Real Example | `require` se |
|-------------|-----------|-------------|--------------|
| Readable | Source → You | `fs.createReadStream` | `stream.Readable` |
| Writable | You → Destination | `fs.createWriteStream` | `stream.Writable` |
| Duplex | Both ways | `net.Socket` | `stream.Duplex` |
| Transform | In → modify → Out | `zlib.createGzip()` | `stream.Transform` |

---

## HTTP Request/Response — Sabse Important Production Example

```js
const http = require('http');

const server = http.createServer((req, res) => {
  // req = Readable Stream (incoming data)
  // res = Writable Stream (outgoing data)

  req.pipe(res); // Jo aaya, wahi wapas bhej do (echo server)
});

server.listen(3000);
```

> 💡 **Key Insight:** Node.js mein `req` aur `res` dono streams hain. Yahi reason hai ki Node.js itna fast hai — kabhi bhi poora request body RAM mein load nahi hota jab tak tum explicitly `body-parser` use nahi karte.
