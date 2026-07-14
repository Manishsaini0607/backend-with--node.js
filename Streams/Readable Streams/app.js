import fs   from "fs/promises"


 // first way 
 const contant = await fs.readFile("C:\\Users\\DELL\\Videos\\Captures\\Create Next App - Google Chrome 2025-06-04 17-00-47.mp4")
//  fs.writeFile("video.mp4", contant )
console.log(contant)

// using strems

// const  stremsdata =  fs.createReadStream("C:\\Users\\DELL\\Videos\\Captures\\Create Next App - Google Chrome 2025-06-04 17-00-47.mp4", {highWaterMark: 1*1024*1024})

// stremsdata.on('data' ,(chunk)=>{
//  fs.appendFileSync("stream.mp4" , chunk)
// })