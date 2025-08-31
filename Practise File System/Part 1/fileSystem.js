const fs = require('node:fs/promises');
const path = require('node:path')

const createFile = async () => {
  try {
    const timestamp = Date.now(); // or use new Date().toISOString() for formatted date
    const fileName = `test-${timestamp}.txt`;
    const filePath = path.join(__dirname, fileName);

    const fileHandler = await fs.open(filePath, 'w+');

    const bufferWrite = await Buffer.from(`Hello from file ${fileName}. This file is created at ${new Date(timestamp)}`)
    const writesize = (await fileHandler.stat()).size;
    const writelength = bufferWrite.byteLength;

    await fileHandler.write(bufferWrite, 0, writelength, 0)

    const size = (await fileHandler.stat()).size;
    const buffer = Buffer.alloc(size);
    const length = buffer.byteLength;

    await fileHandler.read(buffer, 0, length, 0);
    console.log(buffer.toString('utf-8'));
    await fileHandler.close();
  }
  catch (error) {
    console.log(error);
  }
}

createFile()