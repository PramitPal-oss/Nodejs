<style>
*{
  font-family: 'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif;
}
</style>

# Understanding `fs.writeFile` Overwriting Issue in JavaScript

## Issue in the Code

Your function is not writing `'w'` to the file 9 times because of the incorrect usage of `fs.writeFile`. Here are the main issues:

### 1. **Incorrect `fs` Import**

- The code is missing the required `fs` import.
- If you are using the `fs` module in a modern JavaScript environment, you should use `fs.promises`.

### 2. **Incorrect `fs.writeFile` Syntax**

- `fs.writeFile` expects a string or buffer to write, but your second argument is `'w'`, which is correct in principle.
- However, the correct syntax for writing data is:
  ```js
  await fs.promises.writeFile('./text.txt', 'w');
  ```

### 3. **Each Iteration Overwrites the File**

- In each iteration, `fs.writeFile` **overwrites** the entire content of the file.
- Instead of appending `'w'` to the file multiple times, it keeps **replacing** the content with `'w'`, meaning after the last iteration, the file will contain only **one** `'w'`.

## Correcting the Code

### ✅ **Solution 1: Append the Text**

If you want to write `'w'` 10 times (instead of overwriting each time), use `fs.appendFile`:

```javascript
const fs = require('fs').promises;

(async () => {
  for (let index = 0; index < 10; index++) {
    console.log('running');
    await fs.appendFile('./text.txt', 'w'); // Append 'w' instead of overwriting
  }
})();
```

👉 This ensures that the file contains `wwwwwwwwww` after 10 iterations.

---

### ✅ **Solution 2: Write Everything at Once**

If you want to write `'w'` 10 times but in a single operation, you can generate the string and write it once:

```javascript
const fs = require('fs').promises;

(async () => {
  await fs.writeFile('./text.txt', 'w'.repeat(10)); // Writes 'wwwwwwwwww'
})();
```

👉 This is more efficient because it avoids multiple I/O operations.

---

## Summary

| Issue                              | Solution                                          |
| ---------------------------------- | ------------------------------------------------- |
| Missing `fs` import                | Use `const fs = require('fs').promises;`          |
| `fs.writeFile` overwrites the file | Use `fs.appendFile` instead                       |
| Inefficient multiple writes        | Use `fs.writeFile('./text.txt', 'w'.repeat(10));` |

Would you like further optimizations? 🚀
