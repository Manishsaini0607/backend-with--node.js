import fs from 'fs'

const writeStream = fs.createWriteStream('file.txt' , {highWaterMark: 4})

let i = 1 


function  write1to100  () {
while(i<=1000000000000){
console.log(writeStream.writableLength)
const isEmty = writeStream.write('a')
i++
if(!isEmty){
break
}
}}

writeStream.on('drain',()=>{
write1to100()
})


write1to100()