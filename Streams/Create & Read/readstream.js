import fs from 'fs/promises';

const readLargeFile = async () => {
  console.time('Read')
  const fileHandler = await fs.open('./write.txt', 'r');
  const writeableHandler = await fs.open('./again.txt', 'w');
  const readableStream = fileHandler.createReadStream();
  const writeStream = writeableHandler.createWriteStream()

  readableStream.on('data', (chunk) => {
    const data = chunk.toString('utf-8')
    const makeArr = data.split(' ')
    let pushedData = '';

    for (let i = 0; i < makeArr.length; i++) {
      if (Number(makeArr[i]) % 2 === 0) {
        pushedData += makeArr[i];
        pushedData += ' ';
      }
    }

    if (!writeStream.write(pushedData)) readableStream.pause();
  })

  writeStream.on('drain', () => {
    readableStream.resume();
  })

  readableStream.on('end', async () => {
    await fileHandler.close();
    await writeableHandler.close();
    console.timeEnd('Read')
  })
}

(async () => await readLargeFile())()