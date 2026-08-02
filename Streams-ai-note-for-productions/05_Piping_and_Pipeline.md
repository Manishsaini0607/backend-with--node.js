
# 05. Piping Streams + Pipeline (Production Safe) 🔗

---

## .pipe() Kya Hai?

`pipe()` ek readable stream ko writable se connect karta hai — **automatically backpressure handle** karta hai.

```
[Readable] ─── .pipe() ──→ [Writable]
```

```js
const fs = require('fs');

// File copy karna — 3 lines!
fs.createReadStream('./source.mp4')
  .pipe(fs.createWriteStream('./destination.mp4'));
```

---

## .pipe() Chain Karna

```js
const fs = require('fs');
const zlib = require('zlib');

// File padho → Compress karo → Save karo
fs.createReadStream('./data.txt')
  .pipe(zlib.createGzip())            // Transform stream (compress)
  .pipe(fs.createWriteStream('./data.txt.gz'));

console.log('Compression pipeline started!');
```

---

## .pipe() Ka Problem — Error Handling

```js
// ❌ BAD — Pipe mein error handle nahi hota properly
const readable = fs.createReadStream('./file.txt');
const writable = fs.createWriteStream('./output.txt');

readable.pipe(writable);

// Agar readable stream crash ho → writable band NAHI hota
// File descriptor leak ho jaata hai!
readable.on('error', (err) => {
  console.error(err);
  writable.destroy(); // Manually banana padta hai
});
```

---

## ✅ pipeline() — Production Mein Yahi Use Karo

`stream.pipeline()` automatically:
- Errors propagate karta hai
- Sab streams cleanup karta hai
- Promise version bhi available hai

```js
const { pipeline } = require('stream');
const fs = require('fs');
const zlib = require('zlib');

// Callback version
pipeline(
  fs.createReadStream('./large-file.txt'),
  zlib.createGzip(),
  fs.createWriteStream('./large-file.txt.gz'),
  (err) => {
    if (err) {
      console.error('Pipeline failed:', err);
    } else {
      console.log('Pipeline success!');
    }
  }
);
```

---

## ✅ pipeline() with Async/Await — Best Practice

```js
const { pipeline } = require('stream/promises'); // Node 15+
const fs = require('fs');
const zlib = require('zlib');

async function compressFile(input, output) {
  try {
    await pipeline(
      fs.createReadStream(input),
      zlib.createGzip(),
      fs.createWriteStream(output)
    );
    console.log(`✅ Compressed: ${input} → ${output}`);
  } catch (err) {
    console.error('❌ Compression failed:', err.message);
    throw err;
  }
}

// Usage:
compressFile('./logs/app.log', './logs/app.log.gz');
```

---

## Production Example 1: HTTP File Download Server

```js
const http = require('http');
const fs = require('fs');
const { pipeline } = require('stream/promises');

const server = http.createServer(async (req, res) => {
  if (req.url === '/download') {
    const filePath = './large-report.pdf';
    
    try {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="report.pdf"');

      // File → HTTP Response (pipeline use karo)
      await pipeline(
        fs.createReadStream(filePath),
        res
      );
      
    } catch (err) {
      if (!res.headersSent) {
        res.writeHead(500);
        res.end('Download failed');
      }
    }
  }
});

server.listen(3000, () => {
  console.log('Download server running on :3000');
});
```

---

## Production Example 2: File Compress + Upload Pipeline

```js
const { pipeline } = require('stream/promises');
const fs = require('fs');
const zlib = require('zlib');
const crypto = require('crypto');

async function compressAndEncrypt(inputFile, outputFile, secretKey) {
  await pipeline(
    fs.createReadStream(inputFile),        // Step 1: File padho
    zlib.createGzip(),                      // Step 2: Compress karo
    crypto.createCipheriv(                  // Step 3: Encrypt karo
      'aes-256-cbc',
      Buffer.from(secretKey, 'hex'),
      Buffer.alloc(16, 0)
    ),
    fs.createWriteStream(outputFile)        // Step 4: Save karo
  );
  
  console.log('File compressed and encrypted!');
}
```

---

## Production Example 3: Express File Upload Stream

```js
const express = require('express');
const fs = require('fs');
const { pipeline } = require('stream/promises');
const path = require('path');

const app = express();

app.post('/upload', async (req, res) => {
  const filename = req.headers['x-filename'] || 'upload.bin';
  const savePath = path.join(__dirname, 'uploads', filename);

  try {
    // req (Readable) → File (Writable)
    await pipeline(req, fs.createWriteStream(savePath));
    res.json({ success: true, file: filename });
  } catch (err) {
    res.status(500).json({ error: 'Upload failed' });
  }
});

app.listen(3000);
```

---

## pipe() vs pipeline() — Comparison

| Feature | `.pipe()` | `pipeline()` |
|---------|-----------|-------------|
| Auto backpressure | ✅ | ✅ |
| Error propagation | ❌ (manual) | ✅ Auto |
| Cleanup on error | ❌ (manual) | ✅ Auto |
| Promise support | ❌ | ✅ (`stream/promises`) |
| Production ready | ⚠️ Caution | ✅ Use this! |

---

> 💡 **Rule:** Production mein hamesha `pipeline()` from `stream/promises` use karo. `pipe()` sirf demos ke liye hai.
