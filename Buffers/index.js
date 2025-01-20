import { Buffer } from 'buffer';

const memoryContainer = Buffer.alloc(4);

memoryContainer[0] = 0xf;
memoryContainer[1] = 0xfa;
memoryContainer[2] = 0xfb;
memoryContainer[3] = 0xfc;

console.log(memoryContainer[0], memoryContainer);

const newMemory = Buffer.alloc(3);

newMemory[0] = 0x48;
newMemory[1] = 0x69;
newMemory[2] = 0x21;
console.log(newMemory.toString('utf-8'));

const bengali = Buffer.from('E0A485', 'hex');
console.log(bengali.toString('utf-8'), 'Bengali');

const hexaNumber = (n) => {
  switch (n) {
    case 10:
      return 'A';
    case 11:
      return 'B';
    case 12:
      return 'C';
    case 13:
      return 'D';
    case 14:
      return 'E';
    case 15:
      return 'F';
    default:
      return n.toString();
  }
};

const decimalToBinaryConverter = (n, res = '') => {
  if (n <= 0) return res;
  let rem = n % 16;
  res = hexaNumber(rem) + res;
  n = Math.floor(n / 16);
  return decimalToBinaryConverter(n, res);
};

console.log(decimalToBinaryConverter(34434445), 'convert Decimal');
