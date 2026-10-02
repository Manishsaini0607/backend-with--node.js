import express from 'express';
const app = express();
const port = 3000;


app.disable('x-powered-by'); // Disable the 'X-Powered-By' header for security reasons

app.get('/', (req, res) => {
  console.log(dfaa);
  res.send('Hello World!');
},

(err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
}

);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});