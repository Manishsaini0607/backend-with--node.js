import http from 'node:http';



const server = http.createServer((req, res) => {
    console.log('Request received');
    console.log('URL:', req.url);
    // res.setHeader('Content-Length' , '13')
    res.end('Hello, World from server!\n');
    req.on('data', (chunk) => {
        console.log('Received data chunk:', chunk.toString());
    });
})

// server.on('request', (req, res) => {
//     console.log('Request received');
//     res.setHeader('Content-Length' , '13')
//     res.write('Hello, World!\n');
// });



server.listen(4000, "0.0.0.0", () => {
  console.log("Server is running on port 4000");
});