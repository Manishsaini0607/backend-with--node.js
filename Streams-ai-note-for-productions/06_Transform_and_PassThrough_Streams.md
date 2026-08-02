# 06. Transform Streams — Data Ko Modify Karo ⚙️

---

## Transform Stream Kya Hai?

Transform = **Duplex stream** jisme data **modify** hota hai.

```
[Input Data] → [Transform: modify/convert] → [Output Data]
```

Built-in examples:
- `zlib.createGzip()` — compress karta hai
- `zlib.createGunzip()` — decompress karta hai  
- `crypto.createCipher()` — encrypt karta hai
- `readline` — lines mein todhta hai

---

## Custom Transform Stream Banana

```js
const { Transform } = require('stream');

// Example: Text ko uppercase karne wala transform
const uppercaseTransform = new Transform({
  transform(chunk, encoding, callback) {
    // chunk = incoming data (Buffer ya string)
    const upperData = chunk.toString().toUpperCase();
    
    // Processed data push karo
    this.push(upperData);
    
    // callback() = "main done hun, agla chunk bhejo"
    callback();
  }
});

// Use karo:
process.stdin
  .pipe(uppercaseTransform)
  .pipe(process.stdout);
```

---

## Production Example 1: JSON Transform Stream

Real companies mein data format convert karna padta hai:

```js
const { Transform } = require('stream');

class JSONParseTransform extends Transform {
  constructor() {
    super({ objectMode: true }); // Objects pass karo strings nahi
    this.buffer = '';
  }

  _transform(chunk, encoding, callback) {
    this.buffer += chunk.toString();
    
    // Line-by-line JSON parse karo (NDJSON format)
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop(); // Incomplete last line rakho

    for (const line of lines) {
      if (line.trim()) {
        try {
          const parsed = JSON.parse(line);
          this.push(parsed); // Object push karo
        } catch (err) {
          this.emit('error', new Error(`Invalid JSON: ${line}`));
        }
      }
    }
    
    callback();
  }

  _flush(callback) {
    // Stream end pe bache hue data ko process karo
    if (this.buffer.trim()) {
      try {
        this.push(JSON.parse(this.buffer));
      } catch (err) {
        this.emit('error', err);
      }
    }
    callback();
  }
}

// Usage — 1 crore JSON records file stream se parse karo
const { pipeline } = require('stream/promises');
const fs = require('fs');
const { Writable } = require('stream');

async function processJSONFile(filePath) {
  let count = 0;
  
  const processor = new Writable({
    objectMode: true,
    write(obj, encoding, callback) {
      // DB mein save karo ya process karo
      count++;
      callback();
    }
  });

  await pipeline(
    fs.createReadStream(filePath),
    new JSONParseTransform(),
    processor
  );

  console.log(`Processed ${count} records`);
}
```

---

## Production Example 2: CSV to JSON Transform

```js
const { Transform } = require('stream');

class CSVToJSONTransform extends Transform {
  constructor(headers) {
    super({ objectMode: true });
    this.headers = headers;
    this.isFirstLine = true;
    this.remainder = '';
  }

  _transform(chunk, encoding, callback) {
    const data = this.remainder + chunk.toString();
    const lines = data.split('\n');
    this.remainder = lines.pop();

    for (const line of lines) {
      if (this.isFirstLine) {
        this.headers = line.split(',').map(h => h.trim());
        this.isFirstLine = false;
        continue;
      }
      
      if (!line.trim()) continue;
      
      const values = line.split(',');
      const obj = {};
      this.headers.forEach((header, i) => {
        obj[header] = values[i]?.trim();
      });
      
      this.push(obj);
    }
    
    callback();
  }

  _flush(callback) {
    if (this.remainder.trim()) {
      const values = this.remainder.split(',');
      const obj = {};
      this.headers.forEach((header, i) => {
        obj[header] = values[i]?.trim();
      });
      this.push(obj);
    }
    callback();
  }
}

// Usage:
const csvTransform = new CSVToJSONTransform();
// name,age,email
// John,25,john@example.com  → { name: 'John', age: '25', email: '...' }
```

---

## Production Example 3: Compression Pipeline (Used Everywhere)

```js
const { pipeline } = require('stream/promises');
const fs = require('fs');
const zlib = require('zlib');

// File Compress karna (Netflix, YouTube, AWS use karte hain)
async function gzipFile(inputPath, outputPath) {
  const gzip = zlib.createGzip({
    level: zlib.constants.Z_BEST_COMPRESSION // Maximum compression
  });

  await pipeline(
    fs.createReadStream(inputPath),
    gzip,          // Transform Stream — compress karo
    fs.createWriteStream(outputPath)
  );
  
  const inputSize = fs.statSync(inputPath).size;
  const outputSize = fs.statSync(outputPath).size;
  const ratio = ((1 - outputSize/inputSize) * 100).toFixed(1);
  
  console.log(`Compressed: ${ratio}% smaller`);
}

// Express mein on-the-fly compression:
const express = require('express');
const zlib = require('zlib');
const app = express();

app.get('/compressed-file', (req, res) => {
  res.setHeader('Content-Encoding', 'gzip');
  
  const gzip = zlib.createGzip();
  
  fs.createReadStream('./large-data.json')
    .pipe(gzip)     // Transform karo
    .pipe(res);     // Client ko bhejo
});
```

---

## PassThrough Stream — Monitoring ke liye

Data ko bina modify kiye pass karo, lekin measure karo:

```js
const { PassThrough } = require('stream');
const { pipeline } = require('stream/promises');
const fs = require('fs');

async function copyWithProgress(src, dest) {
  const fileSize = fs.statSync(src).size;
  let bytesTransferred = 0;

  const monitor = new PassThrough();
  
  monitor.on('data', (chunk) => {
    bytesTransferred += chunk.length;
    const progress = ((bytesTransferred / fileSize) * 100).toFixed(1);
    process.stdout.write(`\rProgress: ${progress}%`);
  });

  await pipeline(
    fs.createReadStream(src),
    monitor,    // Passthrough — data nahi badla, sirf measure kiya
    fs.createWriteStream(dest)
  );
  
  console.log('\n✅ Copy complete!');
}

copyWithProgress('./bigfile.zip', './backup.zip');
```

---

## objectMode — Important Concept

Default mein streams **Buffers** ya **Strings** handle karte hain.
`objectMode: true` se koi bhi JavaScript object pass kar sakte ho.

```js
const { Transform } = require('stream');

// objectMode se objects pass karo
const dbWriter = new Transform({
  objectMode: true, // Objects accept karega
  
  transform(user, encoding, callback) {
    // DB mein save karo
    db.users.insert(user)
      .then(() => callback())
      .catch(callback);
  }
});
```

---

> 💡 **Key Insight:** Transform streams production mein ETL (Extract-Transform-Load) pipelines banane ke kaam aate hain — Data Engineering mein bhi Node.js streams use hote hain!
