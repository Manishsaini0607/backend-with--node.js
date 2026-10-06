import e from 'express';
import express from 'express';
const app = express();
const port = 3000;


app.disable('x-powered-by'); // Disable the 'X-Powered-By' header for security reasons

// Handling Different HTTP Methods in Express

// app.get('/login', (req, res) => {
  
//   res.send('user login!');
// },

// );

// app.post('/register', (req, res) => {
//   res.send('user register!');
// });


// ---------------------global middleware
// app.use((req, res, next) => {
//   console.log('Global middleware executed');
//   //  res.send('Global middleware executed');
//   next();
// });

app.use(express.json()); // Middleware to parse JSON request bodies

app.get('/login', (req, res) => {
  res.send('user login!');
});

app.post('/register', (req, res) => {
  console.log(req.body);
  res.send('user register!');
});


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});