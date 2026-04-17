import fs from 'fs/promises';

const writeManyTimes = async () => {
  console.time('WriteMany')
  const fileHandler = await fs.open('./write.txt', 'w');
  const stream = fileHandler.createWriteStream();
  let i = 0;
  let numofTimesWrite = 10000000;

  const WriteMany = () => {
    while (i < numofTimesWrite) {
      const conditionsofWrite = stream.write(` ${i} `);
      i++;
      if (i === numofTimesWrite - 1) return stream.end();
      else if (!conditionsofWrite) break;
    }
  }

  WriteMany();

  stream.on('drain', () => WriteMany());

  stream.on('finish', async () => {
    await fileHandler.close()
    console.timeEnd('WriteMany');
  })
}

(async () => await writeManyTimes())()