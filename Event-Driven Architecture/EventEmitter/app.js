import EventEmitter from "node:events";

const events = new EventEmitter

events.on("man" , ()=>{
    console.log("man is working ")
})

events.emit("man")