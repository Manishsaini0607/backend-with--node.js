# 🛡️ Route-Specific Middleware in Express.js (Short & Simple Notes)

## 📌 1. Route-Specific Middleware Kya Hai?

**Global Middleware** = Har route pe chalti hai (`app.use(fn)`)
**Route-Specific Middleware** = Sirf **ek specific route** pe chalti hai (`app.use('/path', fn)`)

```
Global:              HAR request pe chalti hai
Route-Specific:      Sirf matching route pe chalti hai
```

---

## 📌 2. Syntax

```javascript
app.use('/route-path', (req, res, next) => {
  // Ye sirf tab chalega jab URL '/route-path' se match kare
  next();   // ✅ Aage bhejo
});
```

| Part | Meaning |
|------|---------|
| `'/route-path'` | Kis route pe middleware chalegi |
| `(req, res, next)` | Middleware function |
| `next()` | Agle middleware ya route handler pe bhejo |

---

## 📌 3. Tumhare app.js Ka Example

```javascript
app.use(express.json());  // ← Pehle body parse hogi

// 🛡️ Route-Specific Middleware — Sirf /register pe chalegi
app.use('/register', (req, res, next) => {
  console.log('Middleware for /register route executed');

  if (req.body.password === 'secret') {
    next();   // ✅ Password sahi hai → aage jaao
  } else {
    res.send('Password is incorrect');  // ❌ Yahi rok do
  }
});

// Final Route Handler
app.post('/register', (req, res) => {
  console.log(req.body);
  res.send('user register!');
});
```

### 🔍 Flow Diagram:

```
Client POST /register  { password: "secret" }
        │
        ▼
  express.json()             ← Body parse
        │
        ▼
  app.use('/register', fn)   ← Password check middleware
        │
  password === 'secret'?
   YES ✅      NO ❌
    │           │
    ▼           ▼
  next()    res.send('Password is incorrect')
    │           (request yahi ruk jaata hai)
    ▼
  app.post('/register')      ← 'user register!' response
```

---

## 📌 4. Global vs Route-Specific Middleware — Fark

```javascript
// 🌍 Global — HAR route pe chalegi
app.use((req, res, next) => {
  console.log('Ye har request pe chalega');
  next();
});

// 🎯 Route-Specific — Sirf /register pe chalegi
app.use('/register', (req, res, next) => {
  console.log('Ye sirf /register pe chalega');
  next();
});
```

| Feature | Global Middleware | Route-Specific Middleware |
|---------|-------------------|--------------------------|
| Syntax | `app.use(fn)` | `app.use('/path', fn)` |
| Kab chalti hai | **Har** request pe | Sirf **matching route** pe |
| Use case | Logging, CORS, JSON parsing | Auth check, validation |
| Example | `express.json()` | Password check on `/register` |

---

## 📌 5. Route-Specific Middleware Ke 3 Tarike

### Tarika 1: `app.use('/path', fn)` — Alag se likho
```javascript
app.use('/register', (req, res, next) => {
  // Validation logic
  next();
});

app.post('/register', (req, res) => {
  res.send('Registered!');
});
```

### Tarika 2: Inline middleware — Route ke andar likho
```javascript
app.post('/register', (req, res, next) => {
  // Middleware + handler ek saath
  if (req.body.password === 'secret') {
    res.send('Registered!');
  } else {
    res.send('Wrong password');
  }
});
```

### Tarika 3: Named function — Reusable middleware ⭐ (Best)
```javascript
const checkPassword = (req, res, next) => {
  if (req.body.password === 'secret') {
    next();
  } else {
    res.send('Wrong password');
  }
};

// Ab isse kahi bhi use kar sakte ho:
app.post('/register', checkPassword, (req, res) => {
  res.send('Registered!');
});

app.post('/update', checkPassword, (req, res) => {
  res.send('Updated!');
});
```

> 💡 **Tarika 3 (Named Function)** sabse best hai — **reusable** aur **clean code**!

---

## 📌 6. Multiple Middleware Ek Route Pe

```javascript
const logRequest = (req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
};

const checkAuth = (req, res, next) => {
  if (req.body.token === 'valid') next();
  else res.status(401).send('Unauthorized');
};

const checkPassword = (req, res, next) => {
  if (req.body.password === 'secret') next();
  else res.send('Wrong password');
};

// 3 middleware ek ke baad ek chalegi ➡️➡️➡️
app.post('/register', logRequest, checkAuth, checkPassword, (req, res) => {
  res.send('Registered!');
});
```

```
Request → logRequest → checkAuth → checkPassword → Route Handler → Response
            (log)        (token)     (password)       (register)
```

---

## 📌 7. `next()` Ka Role — Bahut Important!

| Situation | Kya hoga |
|-----------|----------|
| `next()` call kiya | Agle middleware/route pe jaayega ✅ |
| `res.send()` call kiya | Response bhej dega, aage nahi jaayega ✅ |
| Dono nahi kiya | Request **hang** ho jaayega ❌ (client wait karta rahega) |
| Dono kar diya | ⚠️ Error — `Cannot set headers after they are sent` |

### ❌ Common Mistake:
```javascript
app.use('/register', (req, res, next) => {
  res.send('Password incorrect');
  next();  // ❌ GALAT! Response ke baad next() mat karo!
});
```

### ✅ Correct Way:
```javascript
app.use('/register', (req, res, next) => {
  if (req.body.password === 'secret') {
    next();                           // ✅ Ya toh next()
  } else {
    res.send('Password incorrect');   // ✅ Ya toh res.send()
  }
});
```

---

## 📌 8. Key Points
1. **`app.use('/path', fn)`** = Sirf us path pe middleware chalegi.
2. **`next()` ya `res.send()`** — dono mein se ek zaroori hai, dono ek saath mat karo.
3. **Named functions** bana ke middleware reusable banao.
4. **Order matters** — middleware route handler se **pehle** likho.
5. **Multiple middleware** ek route pe comma se laga sakte ho.
