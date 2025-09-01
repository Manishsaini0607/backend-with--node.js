#!/usr/bin/env node


import fs from 'node:fs/promises'

const filePath = process.argv[2]
const oneWord = process.argv[3]

 const text = await fs.readFile( filePath, 'utf-8' )
 

const wordsArray = text.match(/[a-zA-Z0-9]+/g) || [];
const wordCount = {}

wordsArray.forEach(word => {
    if(word in wordCount) {
        wordCount[word] += 1
    } else {
        wordCount[word] = 1
    }
})

if(oneWord) {
    if(wordCount[oneWord] === undefined) {
        console.log(oneWord + '-0')
    } else {
        console.log(oneWord + '-' + wordCount[oneWord])
    }
} else {
    console.log(wordCount)
}