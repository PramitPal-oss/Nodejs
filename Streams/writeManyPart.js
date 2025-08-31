import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const writeManyFile = async () => {
  try {
    console.time('writeManyFile');
    const timestamp = Date.now();
    const fileName = `test-${timestamp}.txt`;
    const filePath = path.join(__dirname, fileName);

    const fileHandler = await fs.open(filePath, 'w+');
    const stream = fileHandler.createWriteStream();
    let i = 0;
    const numberofWrites = 10000000

    const continueWrites = () => {
      while (i < numberofWrites) {
        const buffer = Buffer.from(` ${i} `)
        if (i === numberofWrites - 1) return stream.end(buffer);
        if (!stream.write(buffer)) break;
        i++;
      }
    }

    continueWrites();

    stream.on('drain', continueWrites)

    stream.on('finish', () => {
      fileHandler.close();
      console.timeEnd('writeManyFile');
    })

  } catch (error) {
    console.log(error)
  }
}

writeManyFile();