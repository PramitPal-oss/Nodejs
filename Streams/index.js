import fs from 'fs/promises';
// import fs from 'fs'

// (async () => {
//   for (let index = 0; index < 10; index++) {
//     console.log('running')
//     await fs.writeFile('./text.txt', 'w')
//   }
// })()

// (async () => {
//   console.time('writeFile')

//   const fileHandler = await fs.open('./text.txt', 'w')

//   for (let index = 0; index < 1000000; index++) {
//     await fileHandler.write(` ${index} `)
//   }

//   console.timeEnd('writeFile');

//   console.time('flush');

//   await fileHandler.close();

//   console.timeEnd('flush');

// })()

// Call back Action

// (async () => {
//   console.time('writeFile')
//   fs.open('./text.txt', 'w', (err, fd) => {
//     for (let index = 0; index < 1000000; index++) {
//       fs.writeFileSync(fd, ` ${index} `)
//     }
//     console.timeEnd('writeFile')
//   })
// })()

(async () => {
  console.time('writeFile')

  const fileHandler = await fs.open('./text.txt', 'w')
  const stream = fileHandler.createWriteStream()

  for (let index = 0; index < 1000000; index++) {
    const buff = Buffer.from(` ${index} `, 'utf-8')
    stream.write(buff)
  }

  console.timeEnd('writeFile');

  console.time('flush');

  await fileHandler.close();

  console.timeEnd('flush');

})()