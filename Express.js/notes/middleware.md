# ⚡ Express.js Middleware (Short & Simple Notes)

## 📌 1. What is Middleware?
A **function** that runs **between** receiving a Request (`req`) and sending a Response (`res`).

```
Request ➡️ [ Middleware ] ➡️ [ Route Handler ] ➡️ Response
```

---

## 📌 2. Basic Syntax

```javascript
const myMiddleware = (req, res, next) => {
  console.log("Request received!");
  next(); // 👈 Must call next() to pass to the next step
};
```

* **`req`** : Request data (URL, headers, body)
* **`res`** : Response object (`res.send()`, `res.json()`)
* **`next()`** : Moves to the next middleware or route (Without this, request **hangs**!)

---

## 📌 3. 5 Types of Middleware

| # | Type | Example | What it does |
|---|------|---------|--------------|
| 1 | **Application-Level** | `app.use((req, res, next) => next())` | Runs for all or specific routes |
| 2 | **Router-Level** | `router.use((req, res, next) => next())` | Runs only on a specific router |
| 3 | **Built-In** | `app.use(express.json())` | Parses JSON request body |
| 4 | **Third-Party** | `app.use(cors())`, `app.use(morgan('dev'))` | Installed from npm |
| 5 | **Error-Handling** | `app.use((err, req, res, next) => {})` | Handles errors (Takes **4 arguments**) |

---

## 📌 4. All-in-One Code Example

```javascript
import express from 'express';
const app = express();

// 1. Built-in middleware (Parses JSON)
app.use(express.json());

// 2. Custom Application middleware (Logger)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// 3. Route with specific middleware (Auth check)
const checkAuth = (req, res, next) => {
  const isAuth = true;
  isAuth ? next() : res.status(401).send("Unauthorized");
};

app.get('/dashboard', checkAuth, (req, res) => {
  res.send("Welcome to Dashboard!");
});

// 4. Error-handling middleware (At the very bottom)
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).send("Something broke!");
});

app.listen(3000, () => console.log("Server running on port 3000"));
```

---

## 📌 5. Three Golden Rules
1. **Always call `next()`** OR send a response (`res.send()`). Never do neither.
2. **Order Matters:** Middlewares run top-to-bottom.
3. **Error Handler needs 4 arguments:** `(err, req, res, next)`.
