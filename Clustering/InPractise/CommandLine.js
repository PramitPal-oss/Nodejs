import { stdin, stderr, stdout, argv, exit } from 'process'
import fs from 'fs'


const filePath = argv[2];

if (filePath) {
  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(stdout);
  fileStream.on('end', () => {
    exit(0);
  })
}

stdin.on('data', (data) => {
  stdout.write(data.toString('utf-8').toUpperCase())
})