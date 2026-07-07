import fs  from  "fs/promises"

const  filecontent = await fs.readFile("../1.io&cpuOprations","utf-8")
console.log(filecontent)