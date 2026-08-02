# 11. Working with Streams using Promises 🔁

---

## `stream/promises` — Node 15+ ka Gift

```js
const { pipeline, finished } = require('stream/promises');

// pipeline — streams ko connect karo with proper error handling
// finished — stream complete hone ka wait karo
```

---

## `pipeline()` — Complete Guide

```js
const { pipeline } = require('stream/promises');
const fs = require('fs');
const zlib = require('zlib');

// Basic pipeline
async function compressFile(input, output) {
  await pipeline(
    fs.createReadStream(input),
    zlib.createGzip(),
    fs.createWriteStream(output)
  );
}

// Error handling automatic hai:
try {
  await compressFile('./large.log', './large.log.gz');
  console.log('Done!');
} catch (err) {
  // Koi bhi stream fail kare → yahan aa jaayega
  // Saare streams automatically cleanup ho jaate hain
  console.error('Pipeline failed:', err.message);
}
```

---

## `finished()` — Stream Complete Hone Ka Wait

```js
const { finished } = require('stream/promises');
const fs = require('fs');

// Writable stream mein saara data likhne ka wait karo
async function writeAndWait() {
  const writable = fs.createWriteStream('./output.txt');

  writable.write('Line 1\n');
  writable.write('Line 2\n');
  writable.end('Final line\n');

  // Sab kuch flush hone tak wait karo
  await finished(writable);
  console.log('✅ All data written to disk!');
}
```

---

## Production Example 1: HTTP Streaming Response

```js
const express = require('express');
const fs = require('fs');
const zlib = require('zlib');
const { pipeline } = require('stream/promises');

const app = express();

// Large JSON file ko compressed stream se bhejte hain
app.get('/export/users', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Encoding', 'gzip');
  res.setHeader('Transfer-Encoding', 'chunked');

  try {
    await pipeline(
      fs.createReadStream('./users-export.json'),
      zlib.createGzip(),
      res // Express res ek Writable stream hai
    );
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: 'Export failed' });
    }
  }
});

app.listen(3000);
```

---

## Production Example 2: Stream-based ETL Pipeline

```js
const { pipeline } = require('stream/promises');
const { Transform, Writable } = require('stream');
const fs = require('fs');

// ETL: Extract → Transform → Load
async function runETLPipeline() {
  let processedCount = 0;
  let errorCount = 0;

  // Transform: Validate aur clean karo
  const validateTransform = new Transform({
    objectMode: true,
    transform(record, encoding, callback) {
      try {
        // Validate karo
        if (!record.email || !record.name) {
          errorCount++;
          callback(); // Skip this record
          return;
        }

        // Clean karo
        record.email = record.email.toLowerCase().trim();
        record.name = record.name.trim();
        record.processedAt = new Date().toISOString();

        callback(null, record); // Pass karo
      } catch (err) {
        errorCount++;
        callback(); // Error pe skip karo
      }
    }
  });

  // Writable: Database mein load karo (batch)
  const dbLoader = new Writable({
    objectMode: true,
    highWaterMark: 100,
    
    async write(record, encoding, callback) {
      try {
        await db.collection('users').insertOne(record);
        processedCount++;
        callback();
      } catch (err) {
        if (err.code === 11000) { // Duplicate
          callback(); // Skip
        } else {
          callback(err);
        }
      }
    }
  });

  const startTime = Date.now();

  await pipeline(
    fs.createReadStream('./raw-users.json'),    // Extract
    new JSONParseTransform(),                    // Parse
    validateTransform,                           // Validate
    dbLoader                                     // Load
  );

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`ETL Complete:
    - Processed: ${processedCount}
    - Errors: ${errorCount}
    - Time: ${duration}s
    - Rate: ${Math.floor(processedCount / duration)} records/sec
  `);
}
```

---

## Production Example 3: Streaming File Upload to S3

```js
const { pipeline } = require('stream/promises');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const zlib = require('zlib');

const s3 = new S3Client({ region: 'ap-south-1' });

async function uploadLogToS3(logFilePath, s3Key) {
  const fileStream = fs.createReadStream(logFilePath);
  const gzip = zlib.createGzip();

  // AWS SDK ka Upload class streams support karta hai
  const upload = new Upload({
    client: s3,
    params: {
      Bucket: 'my-company-logs',
      Key: s3Key,
      Body: fileStream.pipe(gzip), // Compressed stream bhejo
      ContentEncoding: 'gzip',
      ContentType: 'text/plain'
    },
    queueSize: 4,          // Parallel parts
    partSize: 5 * 1024 * 1024  // 5MB parts
  });

  // Progress track karo
  upload.on('httpUploadProgress', (progress) => {
    const percent = Math.round((progress.loaded / progress.total) * 100);
    console.log(`Upload progress: ${percent}%`);
  });

  const result = await upload.done();
  console.log('Uploaded to S3:', result.Location);
  return result;
}
```

---

## Stream + async/await Pattern

```js
const { Readable } = require('stream');

// Readable stream ko async iterable ki tarah use karo (Node 12+)
async function processStream(readable) {
  let totalBytes = 0;
  
  for await (const chunk of readable) {
    // Har chunk ko await ke saath process karo
    totalBytes += chunk.length;
    await processChunk(chunk); // Async processing
  }
  
  return totalBytes;
}

// Usage:
const fileStream = fs.createReadStream('./data.bin');
const total = await processStream(fileStream);
console.log(`Processed ${total} bytes`);
```

---

## AbortController — Pipeline Cancel Karna

```js
const { pipeline } = require('stream/promises');
const { AbortController } = require('node:abort-controller');

async function cancellableOperation() {
  const ac = new AbortController();
  
  // 30 seconds mein cancel karo
  const timeout = setTimeout(() => ac.abort(), 30000);

  try {
    await pipeline(
      fs.createReadStream('./huge-file.bin'),
      zlib.createGzip(),
      fs.createWriteStream('./output.gz'),
      { signal: ac.signal } // ← Cancel support!
    );
    clearTimeout(timeout);
  } catch (err) {
    if (err.name === 'AbortError') {
      console.log('Pipeline cancelled — timeout!');
    } else {
      throw err;
    }
  }
}
```

import fs from 'fs/promises';
import { pipeline } from 'stream/promises';

const readablefile = await fs.open('./streamswithpromisess/hello.txt');
const writablefile = await fs.open('./streamswithpromisess/hello2.txt', 'w');

const readstream = readablefile.createReadStream();
const writestream = writablefile.createWriteStream();

try {
  await pipeline(readstream, writestream);
  console.log('Copy done');
} catch (err) {
  console.error('Pipeline failed:', err);
} finally {
  await readablefile.close();
  await writablefile.close();
}

---

> 💡 **Summary Table:**

| API | Use When |
|-----|----------|
| `pipeline()` | Streams connect karne hain, error-safe |
| `finished()` | Single stream complete hone ka wait |
| `for await...of` | Readable ko manually iterate karna |
| `AbortController` | Timeout ya cancel support chahiye |
