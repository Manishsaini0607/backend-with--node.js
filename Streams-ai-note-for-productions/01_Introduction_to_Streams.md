# 01. Introduction to Streams 🌊

---

## Streams Kya Hote Hain?

**Stream** ek aisa mechanism hai jisme **data pieces (chunks) mein travel karta hai** — poora data ek saath memory mein load kiye bina.

### Bina Stream ke kya hota hai?

```js
// ❌ BAD APPROACH — Poori file ek saath memory mein aati hai
const fs = require('fs');
const data = fs.readFileSync('bigfile.txt'); // 2GB file? → RAM crash!
console.log(data.toString());
```

**Problem:**
- 2GB file = 2GB RAM chahiye ek saath
- Production mein 1000 users = 2000GB RAM 💀

---

### Stream ke saath kya hota hai?

```js
// ✅ GOOD APPROACH — Chunks mein process karo
const fs = require('fs');
const readStream = fs.createReadStream('bigfile.txt');

readStream.on('data', (chunk) => {
  console.log(`Received ${chunk.length} bytes`);
  // Chunk process karo, RAM free ho jaati hai
});

readStream.on('end', () => {
  console.log('File reading complete!');
});
```

**Benefit:**
- 2GB file bhi sirf **64KB RAM** use karti hai at a time
- 1000 users simultaneously serve kar sakte ho

---

## Real Companies Mein Kahan Use Hota Hai?

| Company / Use Case | Stream Ka Role |
|---|---|
| **Netflix / YouTube** | Video file ko chunks mein bhejte hain (HTTP Streaming) |
| **AWS S3 Upload** | Large files ko multipart stream karke upload |
| **MongoDB / MySQL** | DB query results ko cursor stream se padhte hain |
| **Zomato/Swiggy Logs** | Millions of logs ko stream karke process karte hain |
| **Payment Gateway** | Transaction CSV export — stream se generate |
| **Node.js HTTP Server** | `req` aur `res` dono streams hain! |

---

## Key Concept: Event Emitter ke Upar Bana Hai

Node.js streams `EventEmitter` extend karte hain.

```
Stream
  ├── Readable
  ├── Writable
  ├── Duplex (Readable + Writable)
  └── Transform (Duplex + data modify)
```

---

## Memory Comparison

```
Without Streams:
[File: 500MB] → [RAM: 500MB] → Process

With Streams:
[File: 500MB] → [Chunk: 64KB] → Process → [Chunk: 64KB] → Process → ...
                                 ↑ RAM sirf 64KB use hoti hai!
```

---

> 💡 **Interview Answer:** "Streams allow processing data piece-by-piece without loading entire content into memory, which prevents memory overflow and enables high-throughput systems."
