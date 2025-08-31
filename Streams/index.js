import fs from 'fs/promises';
// import fs from 'fs'

// Write file using fs promise

/**
 * Memory Usage : 73.3 MB
 * Time Taken : WriteFile : 411.038s and flush :0.339ms , total : 413s
 * CPU Usage : 25%
 */

const millionWrites = async () => {
  console.time('writeFile');

  const fileHandler = await fs.open('./text.txt', 'w');

  for (let index = 0; index < 1000000; index++) {
    await fileHandler.write(` ${index} `);
  }

  console.timeEnd('writeFile');

  console.time('flush');

  await fileHandler.close();

  console.timeEnd('flush');
};

// millionWrites()

// Call back Action
/**
 * Memory Usage : 20 MB
 * Time Taken : 6.214s
 * CPU Usage : 20%
 */
const callBackMillionTimes = async () => {
  console.time('writeFile');
  fs.open('./text.txt', 'w', (err, fd) => {
    for (let index = 0; index < 1000000; index++) {
      fs.writeFileSync(fd, ` ${index} `);
    }
    console.timeEnd('writeFile');
  });
};

// callBackMillionTimes()

// Using Streams :
/**
 * Memory Usage : 231 MB
 * Time Taken :  308.961ms
 * CPU Usage : 4%
 */
/* 
!DON't DO THIS WAY! 
*/

const streamsFile = async () => {
  console.time('writeFile');

  const fileHandler = await fs.open('./text.txt', 'w');
  const stream = fileHandler.createWriteStream();

  for (let index = 0; index < 1000000; index++) {
    const buff = Buffer.from(` ${index} `, 'utf-8');
    stream.write(buff);
  }

  console.timeEnd('writeFile');

  console.time('flush');

  await fileHandler.close();

  console.timeEnd('flush');
};

streamsFile();

// Using Streams :
/**
 * Memory Usage : 231 MB
 * Time Taken : 4s
 * CPU Usage : 4%
 */

const streamsFileCorrect = async () => {
  // console.time('writeFile')

  const fileHandler = await fs.open('./text.txt', 'w');
  const stream = fileHandler.createWriteStream();

  console.log(stream.writableHighWaterMark);

  console.log(stream.writableLength);

  const buff = Buffer.from(
    'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged.It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout.The point of using Lorem Ipsum is that it has a more - or - less normal distribution of letters, as opposed to using Content here, content here, making it look like readable English.Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for lorem ipsum will uncover many web sites still in their infancy.Various versions have evolved over the years, sometimes by accident, sometimes on purpose injected humour and the like.'
  );

  // console.log(buff.toString('utf-8'))

  stream.write(buff);
  stream.write(buff);
  stream.write(buff);
  stream.write(buff);
  stream.write(buff);
  stream.write(buff);
  stream.write(buff);
  stream.write(buff);
  stream.write(buff);
  stream.write(buff);
  stream.write(buff);
  stream.write(buff);
  stream.write(buff);
  stream.write(buff);

  stream.write(buff);
  stream.write(buff);
  stream.write(buff);
  stream.write(buff);
  stream.write(buff);

  stream.write(buff);
  stream.write(buff);
  stream.write(buff);
  stream.write(buff);
  stream.write(buff);

  console.log(stream.writableLength);

  // for (let index = 0; index < 1000000; index++) {
  //   const buff = Buffer.from(` ${index} `, 'utf-8')
  //   stream.write(buff)
  // }

  // console.timeEnd('writeFile');

  // console.time('flush');

  await fileHandler.close();

  // console.timeEnd('flush');
};

// streamsFileCorrect()
