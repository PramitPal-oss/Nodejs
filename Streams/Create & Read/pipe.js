import fs from 'fs/promises';
import { pipeline } from 'stream/promises';
import { Transform } from 'stream';

const readLargeFile = async () => {
  console.time('Read');

  const fileHandler = await fs.open('./write.txt', 'r');
  const writeableHandler = await fs.open('./again.txt', 'w');

  // Custom Transform stream to filter even numbers

  const filterEvenNumbers = new Transform({
    transform(chunk, encoding, callback) {
      const data = chunk.toString('utf-8');
      const makeArr = data.split(' ');
      let pushedData = '';

      for (let i = 0; i < makeArr.length; i++) {
        if (Number(makeArr[i]) % 2 === 0) pushedData += makeArr[i] + ' ';
      }
      callback(null, pushedData);
    }
  });

  await pipeline(fileHandler.createReadStream(), filterEvenNumbers, writeableHandler.createWriteStream());

  await fileHandler.close();
  await writeableHandler.close();

  console.timeEnd('Read');
};

(async () => await readLargeFile())();
