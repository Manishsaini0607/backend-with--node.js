# 09. Custom Stream with Internal Buffer ⚙️

---

## Custom Stream Kyun Banate Hain?

Production mein kab banana padta hai:
- Apna data source hai (DB, API, Queue)
- Data ko special way se process karna hai
- SDK ya library bana rahe ho
- Built-in streams kaam nahi aate

---

## Custom Readable Stream

```js
const { Readable } = require('stream');

// Database se data stream karne wala custom readable
class DatabaseReadStream extends Readable {
  constructor(query, options = {}) {
    super({
      objectMode: true,          // Objects stream karo
      highWaterMark: 50          // Buffer mein max 50 objects
    });
    
    this.query = query;
    this.db = options.db;
    this.cursor = null;
    this.isPushing = false;
  }

  // Ye method automatically call hota hai jab buffer empty ho
  async _read(size) {
    if (this.isPushing) return;
    this.isPushing = true;

    try {
      if (!this.cursor) {
        // DB cursor initialize karo
        this.cursor = await this.db.collection('users').find(this.query).cursor();
      }

      let count = 0;
      
      while (count < size) {
        const doc = await this.cursor.next();
        
        if (doc === null) {
          // Data khatam
          this.push(null); // Stream end signal
          break;
        }
        
        const canContinue = this.push(doc); // Object push karo
        count++;
        
        if (!canContinue) {
          // Buffer full — ruko
          break;
        }
      }
      
    } catch (err) {
      this.destroy(err); // Error emit karo
    } finally {
      this.isPushing = false;
    }
  }
}

// Usage:
const userStream = new DatabaseReadStream(
  { age: { $gt: 18 } }, // MongoDB query
  { db: mongoDatabase }
);

userStream.on('data', (user) => {
  console.log('Processing user:', user._id);
});
```

---

## Custom Writable Stream

```js
const { Writable } = require('stream');

// Batch database writer — performance ke liye batch insert
class BatchDatabaseWriter extends Writable {
  constructor(db, options = {}) {
    super({
      objectMode: true,
      highWaterMark: 100  // 100 objects tak buffer
    });
    
    this.db = db;
    this.batchSize = options.batchSize || 100;
    this.batch = [];
    this.totalWritten = 0;
  }

  // Har object ke liye call hota hai
  async _write(obj, encoding, callback) {
    this.batch.push(obj);

    if (this.batch.length >= this.batchSize) {
      await this.flushBatch();
    }

    callback(); // "Done, next object bhejo"
  }

  // Stream end hone pe bache hue objects flush karo
  async _final(callback) {
    if (this.batch.length > 0) {
      await this.flushBatch();
    }
    console.log(`Total written: ${this.totalWritten}`);
    callback();
  }

  async flushBatch() {
    try {
      await this.db.collection('users').insertMany(this.batch);
      this.totalWritten += this.batch.length;
      this.batch = [];
    } catch (err) {
      this.destroy(err);
    }
  }
}

// Usage:
const { pipeline } = require('stream/promises');

await pipeline(
  new DatabaseReadStream(query, { db }),
  new BatchDatabaseWriter(db, { batchSize: 500 })
);
```

---

## Implementing Internal Buffer Properly

```js
const { Readable } = require('stream');

class RateLimitedStream extends Readable {
  constructor(source, rateLimit) {
    super({ highWaterMark: rateLimit });
    
    this.source = source;
    this.rateLimit = rateLimit; // Bytes per second
    this.bytesRead = 0;
    this.startTime = Date.now();
  }

  _read(size) {
    const elapsed = (Date.now() - this.startTime) / 1000; // seconds
    const allowedBytes = this.rateLimit * elapsed;
    const remaining = allowedBytes - this.bytesRead;

    if (remaining <= 0) {
      // Rate limit hit — thoda wait karo
      setTimeout(() => this._read(size), 100);
      return;
    }

    const chunk = this.source.read(Math.min(size, remaining));
    
    if (chunk) {
      this.bytesRead += chunk.length;
      this.push(chunk);
    } else {
      this.push(null); // Done
    }
  }
}
```

---

## Production Example: API Rate Limited Stream

```js
const { Readable } = require('stream');
const https = require('https');

// External API se paginated data stream karo
class APIStream extends Readable {
  constructor(apiUrl, options = {}) {
    super({ objectMode: true, highWaterMark: 10 });
    
    this.apiUrl = apiUrl;
    this.page = 1;
    this.pageSize = options.pageSize || 100;
    this.hasMore = true;
    this.fetching = false;
  }

  async _read() {
    if (this.fetching || !this.hasMore) return;
    this.fetching = true;

    try {
      const response = await fetch(
        `${this.apiUrl}?page=${this.page}&limit=${this.pageSize}`
      );
      const data = await response.json();

      if (!data.items || data.items.length === 0) {
        this.push(null); // Stream khatam
        return;
      }

      // Har item ko push karo
      for (const item of data.items) {
        const canContinue = this.push(item);
        if (!canContinue) break; // Backpressure
      }

      this.page++;
      this.hasMore = data.hasNextPage;
      
      if (!this.hasMore) {
        this.push(null);
      }

    } catch (err) {
      this.destroy(err);
    } finally {
      this.fetching = false;
    }
  }
}

// Usage: 1 lakh API records efficiently process karo
const { pipeline } = require('stream/promises');
const { Writable } = require('stream');

const processor = new Writable({
  objectMode: true,
  write(item, encoding, callback) {
    // Process each item
    callback();
  }
});

await pipeline(
  new APIStream('https://api.example.com/users'),
  processor
);
```

---

## highWaterMark — Buffer Tune Karna

```js
// HighWaterMark = Internal buffer size

// Readable mein:
const readStream = new Readable({
  highWaterMark: 64 * 1024  // Default: 16KB, increase for performance
});

// Writable mein:
const writeStream = new Writable({
  highWaterMark: 16 * 1024  // Default: 16KB
});

// objectMode mein (objects count):
const objectStream = new Readable({
  objectMode: true,
  highWaterMark: 50  // 50 objects buffer mein rakhta hai
});
```

**Rule:**
- `highWaterMark` badha doge → More memory, less I/O calls, more throughput
- `highWaterMark` chota rakhoge → Less memory, more I/O calls

---

> 💡 **Production Rule:** Hamesha `_read()` mein async operations ke baad proper state management karo. Warna duplicate reads ya missed data ho sakta hai.
