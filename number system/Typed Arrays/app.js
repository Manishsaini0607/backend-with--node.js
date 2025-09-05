// 1 --//  const a = new ArrayBuffer(8)
// //  const typedarray = new Int8Array(a)


//2-- // const typedarray = new Int8Array(8)
// typedarray[0] = 42
// console.log(typedarray[0])
// console.log(typedarray.buffer)

//  const typedarray = new Int8Array([1,2,3])
//  console.log(typedarray)
//  console.log(typedarray.buffer)


const a = new ArrayBuffer(16,{maxByteLength:32})
//  a.resize(32)
//  console.log(a.maxByteLength)
//  console.log(a)

const b= a.transfer()
console.log(b)
console.log(a)