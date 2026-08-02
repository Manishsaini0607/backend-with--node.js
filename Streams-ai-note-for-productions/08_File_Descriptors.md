# 08. File Descriptors — Low Level File Operations 🗂️

---

## File Descriptor (FD) Kya Hota Hai?

Jab koi file open hoti hai, OS ek **integer number** assign karta hai — yahi **File Descriptor** hai.

```
OS Level:
  FD 0 → stdin  (keyboard)
  FD 1 → stdout (screen)
  FD 2 → stderr (error output)
  FD 3 → your-file.txt  ← User files yahan se start hote hain
  FD 4 → database.db
  FD 5 → log.txt
  ...
```

---

## `fs.open()` — File Descriptor Lena

```js
const fs = require('fs');

// Async version (production mein yahi use karo)
fs.open('./data.txt', 'r', (err, fd) => {
  if (err) throw err;
  
  console.log('File descriptor:', fd); // e.g., 3
  
  // FD se kaam karo...
  
  // IMPORTANT: File band karo!
  fs.close(fd, (err) => {
    if (err) throw err;
    console.log('File closed');
  });
});
```

---

## Opening Files in Different Modes

| Flag | Matlab | Use Case |
|------|--------|---------|
| `'r'` | Read only | File padhna |
| `'r+'` | Read + Write | File padhna aur likhna |
| `'w'` | Write (overwrite) | Naya file banana ya clear karna |
| `'w+'` | Write + Read (overwrite) | Read/Write, clear first |
| `'a'` | Append | File ke end mein likhna |
| `'a+'` | Append + Read | Read + end mein likhna |
| `'wx'` | Exclusive Write | Sirf naya file (exist kare to fail) |

```js
const fs = require('fs');
const { promisify } = require('util');

const open = promisify(fs.open);
const close = promisify(fs.close);

async function openModes() {
  // Log file mein likhna (append mode)
  const logFd = await open('./app.log', 'a');
  
  // Config file padhna (read only)
  const configFd = await open('./config.json', 'r');
  
  // Temp file banana (exclusive — fail if exists)
  const tempFd = await open('./temp-upload.bin', 'wx');

  await close(logFd);
  await close(configFd);
  await close(tempFd);
}
```

---

## `fs.read()` — FD se Data Padhna

```js
const fs = require('fs');

fs.open('./binary-data.bin', 'r', (err, fd) => {
  if (err) throw err;

  const buffer = Buffer.alloc(1024); // 1KB buffer

  // fd se padhna
  fs.read(
    fd,      // File descriptor
    buffer,  // Data yahan store hoga
    0,       // Buffer mein kahan se store karo (offset)
    1024,    // Kitne bytes padhne hain
    0,       // File mein kahan se padhna (position)
    (err, bytesRead, buffer) => {
      console.log(`Read ${bytesRead} bytes`);
      console.log(buffer.slice(0, bytesRead).toString());
      
      fs.close(fd, () => {});
    }
  );
});
```

---

## `fs.write()` — FD se Data Likhna

```js
const fs = require('fs');

fs.open('./output.txt', 'w', (err, fd) => {
  if (err) throw err;

  const data = Buffer.from('Hello from file descriptor!\n');

  fs.write(
    fd,     // File descriptor
    data,   // Likhne wala data
    0,      // Buffer offset
    data.length, // Kitne bytes likhne hain
    0,      // File position
    (err, bytesWritten) => {
      console.log(`Written ${bytesWritten} bytes`);
      fs.close(fd, () => {});
    }
  );
});
```

---

## Promises ke saath FD (Modern Way) ✅

```js
const fs = require('fs/promises');

async function readSpecificBytes(filePath, start, length) {
  let fh; // filehandle
  
  try {
    fh = await fs.open(filePath, 'r');
    
    const buffer = Buffer.alloc(length);
    const { bytesRead } = await fh.read(buffer, 0, length, start);
    
    return buffer.slice(0, bytesRead);
    
  } finally {
    // HAMESHA close karo — finally block mein
    if (fh) await fh.close();
  }
}

// Usage:
const data = await readSpecificBytes('./video.mp4', 1000, 512);
console.log('Bytes read:', data.length);
```

---

## Production Use Case: Range Requests (Video Streaming!)

Jab YouTube/Netflix video ka specific part chahiye hota hai:

```js
const fs = require('fs');
const http = require('http');

const server = http.createServer((req, res) => {
  const filePath = './movie.mp4';
  const stat = fs.statSync(filePath);
  const fileSize = stat.size;

  const range = req.headers.range; // "bytes=1000000-2000000"

  if (range) {
    const [start, end] = range
      .replace('bytes=', '')
      .split('-')
      .map(Number);

    const chunkStart = start || 0;
    const chunkEnd = end || fileSize - 1;
    const chunkSize = chunkEnd - chunkStart + 1;

    res.writeHead(206, { // 206 = Partial Content
      'Content-Range': `bytes ${chunkStart}-${chunkEnd}/${fileSize}`,
      'Content-Length': chunkSize,
      'Content-Type': 'video/mp4',
      'Accept-Ranges': 'bytes',
    });

    // ⭐ FD use karo specific range padhne ke liye
    fs.createReadStream(filePath, {
      start: chunkStart,
      end: chunkEnd
    }).pipe(res);

  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    });
    fs.createReadStream(filePath).pipe(res);
  }
});

server.listen(3000, () => {
  console.log('Video server running!');
});
```

**Yahi Netflix aur YouTube karte hain!** User jo part dekh raha hai, wohi load karo.

---

## FD Leak — Production Ka Biggest Problem

```js
// ❌ WRONG — FD leak!
async function badCode() {
  const fd = await fs.promises.open('./file.txt', 'r');
  const data = await fd.read(/* ... */);
  
  if (someError) {
    return; // ← fd.close() call nahi hua! FD leak!
  }
  
  await fd.close();
}

// ✅ CORRECT — try/finally se guarantee
async function goodCode() {
  const fd = await fs.promises.open('./file.txt', 'r');
  
  try {
    const buffer = Buffer.alloc(1024);
    await fd.read(buffer, 0, 1024, 0);
    return buffer;
  } finally {
    await fd.close(); // Hamesha chalega!
  }
}
```

> **Warning:** OS per process mein limited FDs hote hain (~1024 default Linux mein). FD leak se "Too many open files" error aata hai — production crash!

---

> 💡 **Modern Tip:** Direct `fd` operations ke bajaye `fs.promises.open()` use karo jo `FileHandle` object return karta hai — isme `Symbol.asyncDispose` support hai Node 20+ mein for automatic cleanup.
