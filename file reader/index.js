import { readFile } from 'fs';
import fs from 'fs/promises';

const readFileComment = async (path) => {
  try {
    const res = await fs.open(path, 'r');
    res.close();
    console.log(`File ${path} already been created !!`);
  } catch (error) {
    const res = await fs.open(path, 'w');
    res.close();
    console.log('File has been created !!');
  }
};

const deletFile = async (path) => {
  try {
    await fs.unlink(path)
    console.log('File has been deleted')
  } catch (error) {
    console.log('File not Found!')
  }
}

const CREATE_FILE = 'create a file';

const DELETE_FILE = 'delete a file';

(async () => {
  try {
    // Open the file for reading the file
    const fileHandler = await fs.open('./comment.txt', 'r');

    fileHandler.on('change', async () => {
      const fileStats = await fs.stat('./comment.txt');

      // Allocation buffer from start.
      const bufferAllocation = Buffer.alloc(fileStats.size);

      //Read whole content from beginin to end!
      await fileHandler.read(bufferAllocation, 0, bufferAllocation.byteLength, 0);

      // Reading file data
      const readData = bufferAllocation.toString('utf-8');

      // Reading from file if it is releated to create file
      if (readData.includes(CREATE_FILE)) {
        const path = readData.substring(CREATE_FILE.length + 1);
        readFileComment(path);
      } else if (readData.includes(DELETE_FILE)) {
        const path = readData.substring(CREATE_FILE.length + 1);
        deletFile(path);
      }
    });

    const watcher = fs.watch('./comment.txt');

    for await (const watch of watcher) {
      if (watch.eventType === 'change') {
        fileHandler.emit('change');
      }
    }
  } catch (error) {
    console.log(error);
  }
})();
