console.time()
import fs from  'node:fs/promises'


const a =  await fs.readFile( './index.htm', 'utf-8'  )
console.log(a)
console.timeEnd()