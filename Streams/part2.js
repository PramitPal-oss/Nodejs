import fs from 'fs/promises';


// const totalWrites = 1000000

// const writeFile = async (i, stream) => {
//   while (i < totalWrites) {
//     const buff = Buffer.from(` ${i} `, 'utf-8');
//     if (i === totalWrites - 1) return stream.end(buff);
//     if (!stream.write(buff)) break;
//     i++;
//   }
// }

// const writeFileManytimes = async () => {
//   console.time('WriteMany')
//   try {
//     const fileHandler = await fs.open('./millions.txt', 'w');
//     let i = 0;
//     const stream = fileHandler.createWriteStream();

//     writeFile(i, stream);

//     stream.on('drain', () => {
//       writeFile(i, stream);
//     })

//     stream.on('finish', () => {
//       fileHandler.close();
//       console.timeEnd('WriteMany')
//     })

//   } catch (error) {
//     console.log(error)
//   }
// };

// writeFileManytimes();

// (async () => {
//   console.time("writeMany");
//   const fileHandle = await fs.open("test.txt", "w");

//   const stream = fileHandle.createWriteStream();

//   console.log(stream.writableHighWaterMark);

//   let i = 0;

//   const numberOfWrites = 1000000;

//   const writeMany = () => {
//     while (i < numberOfWrites) {
//       const buff = Buffer.from(` ${i} `, "utf-8");

//       // this is our last write
//       if (i === numberOfWrites - 1) {
//         return stream.end(buff);
//       }

//       // if stream.write returns false, stop the loop
//       if (!stream.write(buff)) break;

//       i++;
//     }
//   };

//   writeMany();

//   // resume our loop once our stream's internal buffer is emptied
//   stream.on("drain", () => {
//     // console.log("Drained!!!");
//     writeMany();
//   });

//   stream.on("finish", () => {
//     console.timeEnd("writeMany");
//     fileHandle.close();
//   });
// })();



(async () => {
  console.time("writeMany");
  const fileHandle = await fs.open("test.txt", "w");
  const stream = fileHandle.createWriteStream();

  const numberOfWrites = 1000000;
  let i = 0;
  let lastLoggedPercent = 0;

  const writeMany = () => {
    while (i < numberOfWrites) {
      const buff = Buffer.from(` ${i} `, "utf-8");

      const percentComplete = Math.floor((i / numberOfWrites) * 100);

      if (percentComplete >= lastLoggedPercent + 5) {
        lastLoggedPercent = percentComplete;
        console.log(`${percentComplete}%`);
      }

      if (i === numberOfWrites - 1) {
        return stream.end(buff);
      }

      if (!stream.write(buff)) break;

      i++;
    }
  };

  writeMany();

  stream.on("drain", () => {
    writeMany();
  });

  stream.on("finish", async () => {
    console.timeEnd("writeMany");
    await fileHandle.close();
  });
})();
