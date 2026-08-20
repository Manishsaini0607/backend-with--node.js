import http from "node:http"

const clientreq = http.request({method:'post', port:'4000'})

clientreq.end("hi i am client")

clientreq.on('response', (res) => {
  res.on('data', (chunk) => {
      console.log(chunk.toString())
    })
})