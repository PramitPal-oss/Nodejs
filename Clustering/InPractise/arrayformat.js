'use strict'

const reverseArr = (arr) => {
  let start = 0, end = arr.length - 1;

  while (start < end) {
    [arr[start], arr[end]] = [arr[end], arr[start]];
    start++;
    end--;
  }

  return arr;
}

console.log(reverseArr([1, 2, 3, 4, 99, 56, 7]))