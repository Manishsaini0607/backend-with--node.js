# 10. Handling Files with Promises (fs.promises) 📁

---

## `fs.promises` — Modern Way (Node 10+)

```js
// Old way (callback hell):
fs.readFile('./config.json', (err, data) => {
  if (err) throw err;
  JSON.parse(data);
});

// ✅ Modern way:
const fs = require('fs/promises'); // ya fs.promises

const data = await fs.readFile('./config.json', 'utf8');
const config = JSON.parse(data);
```

---

## All Important `fs.promises` Methods

### Read Operations

```js
const fs = require('fs/promises');

// File content padhna
const content = await fs.readFile('./file.txt', 'utf8');

// File stats (size, modified time, etc.)
const stats = await fs.stat('./video.mp4');
console.log('Size:', stats.size);
console.log('Is file:', stats.isFile());
console.log('Is directory:', stats.isDirectory());
console.log('Last modified:', stats.mtime);

// Directory contents list karna
const files = await fs.readdir('./uploads');
console.log('Files:', files);

// Directory ka pura structure:
const entries = await fs.readdir('./uploads', { withFileTypes: true });
entries.forEach(entry => {
  if (entry.isFile()) console.log('File:', entry.name);
  if (entry.isDirectory()) console.log('Dir:', entry.name);
});
```

### Write Operations

```js
const fs = require('fs/promises');

// File likhna (overwrite)
await fs.writeFile('./output.txt', 'Hello World!', 'utf8');

// File mein append karna
await fs.appendFile('./log.txt', `[${new Date().toISOString()}] Log entry\n`);

// Directory banana
await fs.mkdir('./uploads/2024', { recursive: true }); // recursive = parent dirs bhi bana do

// File copy karna
await fs.copyFile('./source.txt', './destination.txt');

// File rename / move karna
await fs.rename('./old-name.txt', './new-name.txt');

// File delete karna
await fs.unlink('./temp-file.txt');

// Directory delete karna
await fs.rm('./temp-dir', { recursive: true, force: true });
```

---

## Production Example: File Upload Handler

```js
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

async function handleFileUpload(fileBuffer, originalName) {
  // Unique filename generate karo
  const ext = path.extname(originalName);
  const uniqueName = crypto.randomUUID() + ext;
  
  const uploadDir = path.join(__dirname, 'uploads', 
    new Date().toISOString().slice(0, 10)); // 2024-01-15/
  
  // Directory ensure karo
  await fs.mkdir(uploadDir, { recursive: true });
  
  const filePath = path.join(uploadDir, uniqueName);
  
  // File save karo
  await fs.writeFile(filePath, fileBuffer);
  
  // File verify karo
  const stats = await fs.stat(filePath);
  
  return {
    filename: uniqueName,
    path: filePath,
    size: stats.size,
    uploadedAt: stats.birthtime
  };
}
```

---

## Production Example: Config File Manager

```js
const fs = require('fs/promises');
const path = require('path');

class ConfigManager {
  constructor(configPath) {
    this.configPath = configPath;
    this.config = null;
  }

  async load() {
    try {
      const data = await fs.readFile(this.configPath, 'utf8');
      this.config = JSON.parse(data);
      return this.config;
    } catch (err) {
      if (err.code === 'ENOENT') {
        // File nahi hai — default config use karo
        this.config = this.getDefaults();
        await this.save();
        return this.config;
      }
      throw err;
    }
  }

  async save() {
    const dir = path.dirname(this.configPath);
    await fs.mkdir(dir, { recursive: true });
    
    // Atomic write — temp file mein likho, phir rename karo
    const tempPath = this.configPath + '.tmp';
    await fs.writeFile(tempPath, JSON.stringify(this.config, null, 2));
    await fs.rename(tempPath, this.configPath);
  }

  async update(key, value) {
    if (!this.config) await this.load();
    this.config[key] = value;
    await this.save();
  }

  getDefaults() {
    return {
      port: 3000,
      logLevel: 'info',
      maxConnections: 100
    };
  }
}

// Usage:
const config = new ConfigManager('./config/app.json');
await config.load();
await config.update('port', 8080);
```

---

## File Watching — Real-time Changes Detect karna

```js
const fs = require('fs/promises');
const fsSync = require('fs');

// Config file change detect karo
async function watchConfig(configPath, onChange) {
  const watcher = fsSync.watch(configPath, async (eventType) => {
    if (eventType === 'change') {
      try {
        const data = await fs.readFile(configPath, 'utf8');
        const config = JSON.parse(data);
        await onChange(config);
        console.log('Config reloaded!');
      } catch (err) {
        console.error('Config reload failed:', err.message);
      }
    }
  });

  // Cleanup function return karo
  return () => watcher.close();
}

// Usage:
const stopWatching = await watchConfig('./config.json', async (newConfig) => {
  // Hot reload karo
  app.set('config', newConfig);
});

// Baad mein:
process.on('SIGTERM', () => {
  stopWatching();
  process.exit(0);
});
```

---

## Error Handling — Common File Errors

```js
const fs = require('fs/promises');

async function safeReadFile(filePath) {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (err) {
    switch (err.code) {
      case 'ENOENT':
        throw new Error(`File not found: ${filePath}`);
      case 'EACCES':
        throw new Error(`Permission denied: ${filePath}`);
      case 'EISDIR':
        throw new Error(`Path is a directory: ${filePath}`);
      case 'EMFILE':
        // Too many open files — wait karo aur retry
        await new Promise(resolve => setTimeout(resolve, 100));
        return safeReadFile(filePath);
      default:
        throw err;
    }
  }
}
```

---

## fs.promises vs fs (Callback) vs fs (Sync)

| Method | Use Case | Thread Block? |
|--------|----------|---------------|
| `fs.readFileSync()` | Startup only (config load) | ✅ Yes (avoid in server) |
| `fs.readFile()` callback | Legacy code | ❌ No |
| `fs.promises.readFile()` | ✅ Production standard | ❌ No |
| `fs/promises` (module) | ✅ Same as above, cleaner | ❌ No |

---

> 💡 **Rule:** Server code mein kabhi `Sync` methods use mat karo — ye entire Event Loop block kar dete hain! Sirf app startup mein (config padhne ke liye) sync use karo.
