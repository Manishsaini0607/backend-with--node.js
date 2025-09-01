import fs from 'node:fs/promises'

try{
    const text =  await fs.readFile('/input.txt', )
}catch(err){
    console.log('! error full error in ./error.log file ')
    fs.appendFile('./error.log', ` \n\n${new Date().toLocaleDateString()} \n  ${err.stack}` )
}

