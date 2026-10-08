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

// app.use(express.json()); // Middleware to parse JSON request bodies

// // app.get('/login', (req, res) => {
// //   res.send('user login!');
// // });


////////////////------   Route-Specific Middleware
// app.use('/register', (req, res, next) => {
//   console.log('Middleware for /register route executed');
//      if (req.body.password ===  'secret') {
//    next();
//   } else {
//     res.send('Password is incorrect');
//   }
  
// } )

// app.post('/register', (req, res) => {
//   console.log(req.body);
//   res.send('user register!');
// });




// app.use(express.static('public')); // Serve static files from the 'public' 

// app.get('/', (req, res) => {
//   res.sendFile(`${import.meta.dirname}/test.webm`);
// });


app.get('/', (req, res) => {
  res.status(201).json({ message: 'Hello, World!' });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});