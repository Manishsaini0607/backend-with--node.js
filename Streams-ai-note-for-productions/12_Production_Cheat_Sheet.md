# 12. Production Cheat Sheet — Streams 🚀

> Ye file daily reference ke liye hai. Har pattern yahan se copy karo.

---

## Quick Reference — Kab Kya Use Karein

```
File padhna (small file < 50MB)?     → fs.promises.readFile()
File padhna (large file > 50MB)?     → fs.createReadStream()
File likhna?                          → fs.createWriteStream()
HTTP response mein file bhejni?       → createReadStream().pipe(res)
File compress karna?                  → pipeline(readStream, gzip, writeStream)
Multiple streams connect karna?       → pipeline() from stream/promises
Error-safe piping?                    → pipeline() — HAMESHA
Streams cancel karna?                 → AbortController + pipeline signal
Data transform karna?                 → Transform stream
DB se stream karna?                   → Custom Readable stream
Batch DB write?                       → Custom Writable stream
```

---

## Copy-Paste Ready Patterns

### Pattern 1: File Compress karo

```js
const { pipeline } = require('stream/promises');
const fs = require('fs');
const zlib = require('zlib');

await pipeline(
  fs.createReadStream('./input.txt'),
  zlib.createGzip(),
  fs.createWriteStream('./input.txt.gz')
);
```

---

### Pattern 2: HTTP File Download (Express)

```js
app.get('/download/:file', async (req, res) => {
  const filePath = path.join(UPLOADS_DIR, req.params.file);
  
  try {
    const stat = await fs.promises.stat(filePath);
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Content-Disposition', `attachment; filename="${req.params.file}"`);
    
    await pipeline(
      fs.createReadStream(filePath),
      res
    );
  } catch (err) {
    if (err.code === 'ENOENT') res.status(404).send('Not found');
    else res.status(500).send('Error');
  }
});
```

---

### Pattern 3: Video Streaming (Range Requests)

```js
app.get('/video/:file', (req, res) => {
  const filePath = path.join(VIDEOS_DIR, req.params.file);
  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const [startStr, endStr] = range.replace('bytes=', '').split('-');
    const start = parseInt(startStr);
    const end = endStr ? parseInt(endStr) : fileSize - 1;
    const chunkSize = end - start + 1;

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'video/mp4',
    });
    
    fs.createReadStream(filePath, { start, end }).pipe(res);
  } else {
    res.writeHead(200, { 'Content-Length': fileSize, 'Content-Type': 'video/mp4' });
    fs.createReadStream(filePath).pipe(res);
  }
});
```

---

### Pattern 4: File Upload Save karo (Streaming)

```js
app.post('/upload', async (req, res) => {
  const filename = `${crypto.randomUUID()}.bin`;
  const savePath = path.join(UPLOADS_DIR, filename);
  
  await pipeline(req, fs.createWriteStream(savePath));
  
  const stats = await fs.promises.stat(savePath);
  res.json({ filename, size: stats.size });
});
```

---

### Pattern 5: Large CSV Export

```js
app.get('/export/csv', async (req, res) => {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="users.csv"');

  const cursor = db.collection('users').find({}).cursor();
  
  // CSV header
  res.write('id,name,email,createdAt\n');

  for await (const user of cursor) {
    res.write(`${user._id},${user.name},${user.email},${user.createdAt}\n`);
  }

  res.end();
});
```

---

### Pattern 6: Custom Transform Stream

```js
const { Transform } = require('stream');

class MyTransform extends Transform {
  constructor() {
    super({ objectMode: true }); // objectMode if needed
  }

  _transform(chunk, encoding, callback) {
    try {
      const result = this.process(chunk);
      this.push(result);
      callback();
    } catch (err) {
      callback(err);
    }
  }

  _flush(callback) {
    // Cleanup / flush bache hue data
    callback();
  }

  process(data) {
    // Apna logic yahan
    return data;
  }
}
```

---

## Common Mistakes & Fixes

```js
// ❌ WRONG: pipe() with no error handling
readable.pipe(writable);

// ✅ RIGHT: pipeline() always
await pipeline(readable, writable);

// ❌ WRONG: readFileSync in request handler
app.get('/data', (req, res) => {
  const data = fs.readFileSync('./huge.json'); // Blocks Event Loop!
  res.json(JSON.parse(data));
});

// ✅ RIGHT: Stream karo
app.get('/data', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  fs.createReadStream('./huge.json').pipe(res);
});

// ❌ WRONG: FD leak
const fd = await fs.promises.open('./file.txt', 'r');
const data = await fd.read(/* ... */);
// fd.close() bhool gaye!

// ✅ RIGHT: try/finally
const fd = await fs.promises.open('./file.txt', 'r');
try {
  const buffer = Buffer.alloc(1024);
  await fd.read(buffer, 0, 1024, 0);
  return buffer;
} finally {
  await fd.close(); // Always runs
}

// ❌ WRONG: No backpressure handling
readable.on('data', (chunk) => {
  writable.write(chunk); // Return value ignore kiya!
});

// ✅ RIGHT: pipeline() ya manual backpressure
readable.on('data', (chunk) => {
  const ok = writable.write(chunk);
  if (!ok) {
    readable.pause();
    writable.once('drain', () => readable.resume());
  }
});
```

---

## Production Checklist ✅

- [ ] `pipeline()` use kiya (not `pipe()`)
- [ ] `error` event handle kiya har stream pe
- [ ] File descriptors properly close kiye (`finally` block)
- [ ] `Sync` methods server code mein nahi hain
- [ ] `highWaterMark` appropriately set kiya (default often fine)
- [ ] Streaming responses mein `Content-Type` set kiya
- [ ] Backpressure handle hota hai (via pipeline ya manual)
- [ ] Memory leak test kiya (no FD leaks)

---

## Interview Questions & Answers

**Q: Backpressure kya hai?**
A: Jab writer, reader se slow ho. `write()` false return karta hai → readable pause karo → `drain` event aane pe resume karo. `pipeline()` ye automatically karta hai.

**Q: `pipe()` vs `pipeline()` difference?**
A: `pipe()` errors propagate nahi karta, manual cleanup chahiye. `pipeline()` auto error propagation + cleanup karta hai. Production mein hamesha `pipeline()`.

**Q: Stream fast kyun hai?**
A: Time-to-first-byte kam hai, memory footprint low hai (sirf buffer), aur Event Loop ke saath non-blocking integrate hota hai.

**Q: Transform stream real example?**
A: `zlib.createGzip()` — input data compress karke output mein bhejta hai. Custom example: CSV to JSON converter stream.

**Q: objectMode kab use karte hain?**
A: Jab stream mein Buffers/Strings ki jagah JavaScript objects pass karne hain — jaise database records ya parsed JSON.
