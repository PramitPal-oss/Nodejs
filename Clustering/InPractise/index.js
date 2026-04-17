import { spawn } from 'node:child_process';
import { stdin, stderr, stdout } from 'process'

stdin.on('data', (chunk) => {
  stdout.write(`Got data from stdin: ${chunk.toString()} \n`)
});

// write to stdout/stderr (writable)
stdout.write('This is some text I want\n');
stderr.write('This is some text I may not want\n');