# Understanding Streams in Node.js

In **Node.js**, a **stream** is like a pipeline that allows you to process data piece by piece (chunks), instead of waiting for the entire data to be available. It’s helpful for working with large amounts of data (like files or videos) because you don’t have to load everything into memory all at once.

## What is a Stream?

Think of a stream like water flowing through a pipe:

- **Readable Stream**: You can take water (data) from the pipe (source).
- **Writable Stream**: You can pour water (data) into the pipe (destination).
- **Duplex Stream**: You can take water out and pour water in at the same time.
- **Transform Stream**: You can modify the water while it’s flowing, like adding color to it.

### Why Use Streams?

- Efficient for handling large files or real-time data.
- Reduces memory usage by processing data in small chunks.

---

## Examples of Using Streams

### 1. Reading a File Using Streams

Here’s an example of how to use a stream to read a file:

```javascript
const fs = require('fs');

// Create a readable stream to read a large file
const readableStream = fs.createReadStream('largefile.txt', { encoding: 'utf8' });

// Listen for 'data' event to get chunks of the file
readableStream.on('data', (chunk) => {
  console.log('Received chunk:', chunk);
});

// Handle the end of the stream
readableStream.on('end', () => {
  console.log('Finished reading the file.');
});

// Handle errors
readableStream.on('error', (err) => {
  console.error('An error occurred:', err.message);
});
```

---

### 2. Piping a Stream

Let’s copy the contents of one file to another using streams:

```javascript
const fs = require('fs');

// Create a readable stream and a writable stream
const readableStream = fs.createReadStream('source.txt');
const writableStream = fs.createWriteStream('destination.txt');

// Pipe the readable stream into the writable stream
readableStream.pipe(writableStream);

console.log('File is being copied...');
```

---

### 3. Transform Stream

A **transform stream** lets you modify data as it passes through the stream. For example, converting text to uppercase:

```javascript
const { Transform } = require('stream');

// Create a transform stream
const upperCaseTransform = new Transform({
  transform(chunk, encoding, callback) {
    // Convert chunk to uppercase
    this.push(chunk.toString().toUpperCase());
    callback();
  },
});

// Use the transform stream
process.stdin.pipe(upperCaseTransform).pipe(process.stdout);
```

Run this script and type something into your terminal—it will convert your input to uppercase.

---

## Key Takeaways

- **Streams are efficient**: They process data in chunks, reducing memory usage.
- **Types of streams**:
  - **Readable**: To read data.
  - **Writable**: To write data.
  - **Duplex**: To read and write simultaneously.
  - **Transform**: To modify or transform data.
- Streams make Node.js powerful for handling files, network requests, and any large or real-time data sources.

---

## When to Use Streams

- Processing large files (e.g., logs, videos, etc.).
- Reading or writing data to/from a network or database.
- Real-time data transformation (e.g., compression, encryption).

Streams are a core concept in Node.js that enable developers to build efficient, scalable applications.

---

### Key Take Away from Lecture:

1.** Suppose 500 people have gathered at the school for an alumni event. In this case, we have two options:**

- **Create a door large enough for 500 people to exit simultaneously:** While this approach might seem faster, it is highly inefficient and practically impossible to build such a door.

- **Allow smaller groups, such as 10 people at a time, to exit:** This method is more efficient and manageable. Although it may take slightly longer than the first approach, it is far more practical and feasible.

2. **Copy / Pasting a File :**

Suppose you have a 10GB file that you want to paste somewhere. There are two approaches you can consider:

- **Paste the entire file in one go:**
  This approach puts significant pressure on memory, which can lead to serious issues, such as memory leaks. Additionally, this method is highly inefficient because it involves writing to the file a million times in one large operation.

- **Send the file in chunks:**
  This approach streams the file in smaller chunks, significantly reducing memory usage and the risk of memory-related issues. For example, writing to the file in 16KB chunks at a time is much more efficient and manageable.

---

#### Understanding different types of Streams Keytake ways :

- Streams are a way to handle reading/writing data in chunks instead of loading everything into memory.
- Streams improve efficiency, especially for large data sets like files or network requests.

## Writable Streams

### Writable Stream Object

- Created using methods like `fs.createWriteStream()`.
- Contains an **internal buffer**.
  - Default size: **16,384 bytes (16kB)**.
  - Controlled by the `highWaterMark` value.
  - Can be modified if needed.
- Includes **events**, **properties**, and **methods** for interacting with the stream.

### Writing Data to a Writable Stream

1. Use the `.write()` method to push data into the internal buffer.
   - Data can be a **buffer** or a **string** (converted to a buffer internally).
   - Example:
     ```js
     writableStream.write(buffer);
     ```
2. Data is accumulated in the internal buffer until it is full.
3. Once the buffer is full, the stream writes the data to the underlying resource (e.g., file, network).
4. This reduces the number of write operations and enhances performance.

### Benefits of Streams

- Efficiently handle large datasets by minimizing the number of write operations.
  - Example: Writing 1 million small pieces of data:
    - Without streams: 1 million writes to the file.
    - With streams: Data is buffered and written in chunks, significantly reducing the number of writes.

### Handling Overflow

- If data exceeds the buffer size:
  - Extra data is temporarily stored in memory.
  - Once the buffer is emptied, the remaining data is written.
- Risks of continuous writes without allowing the buffer to drain:
  - High memory usage.
  - Potential memory overflow.
- Solution:
  - Use the `drain` event to wait for the buffer to empty before writing more data.
    ```js
    writableStream.on('drain', () => {
      // Safe to write more data
    });
    ```

### Key Concepts

- **Buffering**: Temporary storage of data in memory before writing it to the underlying resource.
- **Draining**: Process of emptying the internal buffer.
- Avoid writing large chunks of data (e.g., 800MB) directly to the stream to prevent memory issues.

## Readable Streams

### Readable Stream Object

- Created using methods like `fs.createReadStream()`.
- Contains an **internal buffer** similar to writable streams.
  - Default size: **16,384 bytes (16kB)**.
- Includes **events**, **properties**, and **methods** for interaction.

### Reading Data from a Readable Stream

1. Use the `.push()` method to push data into the internal buffer.
2. Listen to the `data` event to process chunks as they become available.
   ```js
   readableStream.on('data', (chunk) => {
     console.log(chunk);
   });
   ```
3. The stream emits `data` events for each chunk until the entire data is read.

### Use Case

- Reading large files or network requests:
  - Data is read in chunks (e.g., 16kB).
  - Process each chunk without loading the entire dataset into memory.

## Duplex and Transform Streams

### Duplex Streams

- Combines readable and writable streams.
- Can read from and write to the same stream.
- Example use case: Socket connections.

### Transform Streams

- Similar to duplex streams but includes a transformation step.
- Reads data, processes it, and then writes the transformed data.
- Example use case: Compression or encryption.

## Summary of Stream Types

- **Writable Streams**: Write-only with a single internal buffer.
- **Readable Streams**: Read-only with a single internal buffer.
- **Duplex Streams**: Read and write capabilities with two internal buffers.
- **Transform Streams**: Duplex streams with additional transformation logic.

## Best Practices

1. Use streams to handle large datasets efficiently.
2. Avoid writing large chunks of data directly to streams.
3. Monitor and handle the `drain` event to prevent memory overflow.
4. Process data in manageable chunks to improve performance and reduce memory usage.

## Example Code

### Writable Stream Example

```js
const fs = require('fs');
const writableStream = fs.createWriteStream('output.txt');

for (let i = 0; i < 100; i++) {
  if (!writableStream.write(`Data ${i}\n`)) {
    writableStream.once('drain', () => {
      console.log('Buffer drained, resuming writes');
    });
    break;
  }
}
```

### Readable Stream Example

```js
const fs = require('fs');
const readableStream = fs.createReadStream('input.txt');

readableStream.on('data', (chunk) => {
  console.log('Received chunk:', chunk.toString());
});
```

By following these principles, you can effectively utilize streams in Node.js to handle data efficiently.

## Types of Streams

### 1. **Readable Stream**

- A stream from which data can be read.
- Example: Reading data from a large file or a network request.
- Usage:
  - Open a file (e.g., a 10 GB file) and read its content in chunks.
  - Pass the data to another writable stream to save it elsewhere.

### 2. **Writable Stream**

- A stream where data can be written.
- Example: Writing data to a file or sending a response to a client.
- Usage:
  - Writing data received from a readable stream to a storage device or network.

### 3. **Duplex Stream**

- A stream that is both readable and writable.
- Example: A socket connection where data can be read and written simultaneously.
- Usage:
  - Communication between two endpoints.

### 4. **Transform Stream**

- A type of duplex stream that can modify or transform the data as it is being read or written.
- Example: Encrypting or compressing data.
- Usage:
  - Modify data on the fly as it flows through the stream.

---

## Examples of Stream Usage

### **Readable Stream Example**

- Reading a large file (e.g., 10 GB) chunk by chunk to avoid loading it entirely into memory.
- Data flows from the file to the application.

### **Writable Stream Example**

- Writing incoming data to a file or storage.
- Data flows from the application to the storage device.

### **Duplex Stream Example**

- Data flows in both directions simultaneously, such as in a chat application.

### **Transform Stream Example**

1. **Encryption**

   - Encrypt data by replacing specific patterns with encrypted values.
   - Example:
     - Replace `00` and `11` with `111` and `000` respectively.
     - Decrypt by reversing the operation using the same map.

2. **Compression**
   - Compress data by identifying patterns and condensing them.
   - Example:
     - Replace repetitive patterns in binary data with shorter representations.
     - Decompression reverses the operation to restore the original data.

---

## When to Use Streams?

Streams are ideal whenever you need to process large data flows efficiently, such as:

- Transferring large files.
- Real-time data processing (e.g., video/audio streaming).
- Network communication.
- Transforming data on the fly (e.g., encryption, compression).

---

## Advantages of Using Streams

- **Memory Efficiency**: Streams process data in chunks, reducing memory usage.
- **Speed**: Streams can process data as it arrives, allowing faster handling.
- **Flexibility**: Support for different types of data transformations.

---

## Key Concepts to Remember

- **Data Flow**: Streams handle data in chunks, enabling efficient processing.
- **Binary Data**: Streams often work with raw binary data (e.g., zeros and ones).
- **Transformation**: Transform streams modify data as it passes through.

---

## Conclusion

Streams are a powerful feature of Node.js for handling data flows. Understanding the four types of streams (Readable, Writable, Duplex, and Transform) allows developers to build efficient and scalable applications. Use streams whenever dealing with large datasets, real-time communication, or data transformation.

---

# Understanding and Fixing Memory Issues in Node.js Writable Streams

This document provides a comprehensive and detailed understanding of handling memory issues in Node.js Writable Streams. It is based on an in-depth walkthrough and transcript of a session aimed at solving stream memory pressure problems.

---

## Overview

Node.js provides the `stream` module, which is a powerful API for working with streaming data. When writing large amounts of data to a writable stream (like a file), managing memory usage becomes crucial to avoid performance bottlenecks or crashes.

---

## Writable Stream Buffer Mechanics

### Internal Buffer

- A Writable stream has an **internal buffer** used to temporarily store data before writing it to the destination (e.g., file).
- The size of this buffer is controlled by a property called **`writableHighWaterMark`**, which defaults to **16,384 bytes (16 KB)**.

```js
console.log(stream.writableHighWaterMark); // 16384
```

### Writable Length

- The property **`writableLength`** tells how much of the internal buffer is currently filled.

```js
console.log(stream.writableLength); // Initially 0
```

---

## Writing Data to the Stream

You can write to a stream using:

```js
stream.write(buffer);
```

The `write` method returns a Boolean:

- **`true`**: It's safe to write more.
- **`false`**: The internal buffer is full; you should wait for it to drain.

### Example

```js
const buffer = Buffer.from('hello!');
stream.write(buffer);
console.log(stream.writableLength); // 6 (each char is 1 byte)
```

---

## Buffer Allocation and Memory Impacts

Buffers can be created using:

```js
const bigBuffer = Buffer.alloc(sizeInBytes, fillValue);
```

For instance:

```js
const buffer = Buffer.alloc(100_000_000, 10); // 100MB filled with byte 10
```

### Byte Size Reference

```
8 bits = 1 byte
1000 bytes = 1 KB
1000 KB = 1 MB
```

### Memory Monitoring

Creating large buffers instantly increases memory usage. This can be observed using system tools (like Activity Monitor or Task Manager).

- After creating a 100MB buffer, Node's memory will increase accordingly.
- When no longer in use, garbage collection frees up memory.

---

## The `drain` Event

If `stream.write()` returns `false`, the stream will emit a **`drain`** event once it is ready to accept more data.

### Usage

```js
if (!stream.write(buffer)) {
  stream.once('drain', () => {
    // Safe to write again
  });
}
```

This prevents **backpressure**—a situation where data is pushed to the stream faster than it can be handled.

### Bad Practice Example

If you ignore the `false` return value and keep writing:

```js
while (...) {
  stream.write(buffer); // Potentially unsafe
}
```

You risk memory bloat, which can lead to crashes or performance degradation.

---

## A Smarter Write Loop with Drain Handling

Instead of blindly writing in a loop, refactor the code like this:

### Step-by-step Breakdown

```js
let i = 0;
const total = 1_000_000;

function writeMany() {
  while (i < total) {
    const buffer = Buffer.from(` ${i} `);
    i++;

    if (!stream.write(buffer)) {
      return; // Wait for drain before continuing
    }
  }

  // End the stream once all writes are complete
  stream.end();
}

stream.on('drain', writeMany);
writeMany();
```

### Finalization

Use the `finish` event to clean up:

```js
stream.on('finish', () => {
  console.timeEnd('writeMany');
  fileHandle.close();
});
```

### Prevent Overwriting After End

Ensure you don't write after calling `stream.end()`:

```js
if (i === total - 1) {
  return stream.end(buffer);
}
```

---

## Backpressure Math Validation

Given a file size of \~7.8 MB:

- If each buffer write is \~16KB (16384 bytes)
- Total writes: \~$.8MB / 16KB ≈ 481$ drain events (as each full buffer triggers a drain)

---

## Summary: Key Concepts

### Writable Stream Properties

| Property                | Description                                 |
| ----------------------- | ------------------------------------------- |
| `writableHighWaterMark` | Max size of internal buffer (default: 16KB) |
| `writableLength`        | Current size of buffered data               |

### Stream Methods

| Method          | Purpose                    |
| --------------- | -------------------------- |
| `write(buffer)` | Writes data to the stream  |
| `end(buffer?)`  | Signals the end of writing |

### Important Events

| Event    | When it fires                                     |
| -------- | ------------------------------------------------- |
| `drain`  | When internal buffer is emptied after full        |
| `finish` | When `end()` has been called and all data flushed |

---

## Best Practices

- **Never ignore `stream.write()` return value**.
- **Always wait for `drain` event** when buffer is full.
- **Use `end()` only once at the end of all writes**.
- **Close file handles properly to avoid warnings or leaks**.
- **Use memory-efficient loops with async handling for large writes**.

---

## Additional Notes

- Buffers print in hexadecimal, each hex digit = 4 bits.
- Use a programmer calculator for base conversions.
- Properly monitoring memory and performance is crucial in large-scale streaming tasks.

---

## Conclusion

This walkthrough has demonstrated the critical aspects of managing memory and avoiding backpressure when working with Node.js writable streams. By understanding `writableHighWaterMark`, handling the `drain` event properly, and writing data responsibly, you can prevent performance issues and memory leaks in your Node.js applications.

Further reading and experimentation are encouraged with the official [Node.js Stream Documentation](https://nodejs.org/api/stream.html).

---

> _"Write wisely, drain gracefully."_

---

Here’s the detailed `.md` (Markdown) file based on the transcript you provided. This version is organized, clear, and includes helpful elaborations where appropriate to make it a comprehensive note for studying or reference.

---

````markdown
# 📚 Node.js Writable Streams – Full Recap & Documentation Walkthrough

## 📌 Introduction

In this note, we summarize and expand upon the concepts covered in the video recap of **Writable Streams** in Node.js. The explanation is based on the official [Node.js Stream Documentation](https://nodejs.org/api/stream.html) and includes everything from the video transcript, organized and clarified.

---

## 🔁 Stream APIs in Node.js

Node.js provides two primary APIs for streams:

1. **Stream Consumers**  
   Modules that _use_ streams, such as `fs`, `http`, `net`, etc.

2. **Stream Implementers**  
   Modules that _create_ custom stream classes by extending base stream classes.

This section is focused on **Stream Consumers**, particularly **Writable Streams**.

---

## ✍️ Writable Streams

Writable Streams are used to write data to a destination in chunks. Common modules using Writable Streams include:

- **`fs` module** – Writing to a file
- **`http` module** – Writing response back to client
- **`net` module** – Writing data to network socket
- **`zlib`/`crypto`** – Writing processed/buffered data
- **`child_process`** – Writing to stdin/stdout of subprocess

If you understand streams in the context of `fs`, it will be easy to work with streams in `http`, `net`, and others, because they all inherit from the same base stream classes.

---

## 🧠 Key Concepts Recap

### Example: `http` Writable Stream

```js
res.write('Hello World');
res.end();
```
````

- `res` is a writable stream.
- `res.end()` ends the stream. Optionally, it can take one last chunk to write.

### `fs` Example (from previous video)

```js
const stream = fileHandle.createWriteStream();
stream.write(...);
stream.end();
```

Writable Streams from different modules share the same core methods and behavior.

---

## ⚙️ Writable Stream Events

### 🔒 `close`

Emitted when the stream and its underlying resource (e.g., file descriptor) are closed.

**Example:**

```js
stream.on('close', () => {
  console.log('stream was closed');
});

fileHandle.close(); // triggers the 'close' event
```

### 🔄 `drain`

- Emitted when the internal buffer is emptied and it's safe to write again.
- Important when writing in a loop where `.write()` returns `false`.

### ❗ `error`

- Emitted on stream errors.
- Always handle this event to avoid process crashes.

### ✅ `finish`

- Emitted when `stream.end()` is called, and all data is flushed to the underlying system.
- Especially useful for cleanup tasks after writing is done.

### 🔗 `pipe`, `unpipe`

- Handled in **Readable Stream** section (upcoming).
- Used to connect readable and writable streams.

---

## 🔧 Writable Stream Methods

### `write(chunk[, encoding][, callback])`

- Writes data to the stream.
- Returns `true` if more writes are allowed, otherwise returns `false`.

### `end([chunk][, encoding][, callback])`

- Ends the stream.
- Optional final chunk can be passed.

### `cork()` & `uncork()`

- Buffers all written data in memory.
- Used to optimize performance when writing small chunks rapidly.

**Example usage:**

```js
stream.cork();
stream.write('first');
stream.write('second');
stream.uncork(); // flushes both in one operation
```

**Use Case:** Performance optimization in scenarios like loops or rapid small writes.

### `destroy([error])`

- Destroys the stream, optionally with an error.
- Releases resources and emits `close`.

### `setDefaultEncoding(encoding)`

- Changes default text encoding for stream (e.g., `'utf-8'`, `'ascii'`).
- Only for text data. **Do not use on binary/image data.**

---

## 📐 Writable Stream Properties

| Property                | Description                                                               |
| ----------------------- | ------------------------------------------------------------------------- |
| `writable`              | `true` if it’s safe to call `write()`                                     |
| `writableEnded`         | `true` if `end()` has been called                                         |
| `writableFinished`      | `true` if the stream has finished writing                                 |
| `writableHighWaterMark` | Buffer limit size. Helps determine backpressure                           |
| `writableLength`        | Number of bytes queued in the buffer                                      |
| `writableNeedDrain`     | `true` if internal buffer is full and needs to drain before writing again |
| `writableCorked`        | `true` if cork is active                                                  |
| `writableAborted`       | Indicates whether the stream was destroyed/errored before `finish` event  |
| `closed`                | `true` if the `close` event has been emitted                              |

---

## 💥 Important Caveats

- Calling `write()` after `end()` will throw an error.
- Always **read the docs before using** a method or property.
- Do **not** use `setDefaultEncoding` with non-text data like images or videos.
- Always handle `error` and `close` events to avoid surprises.

---

## 🧪 Practical Use Case Recap

- Writing 1 million lines to a file using stream
- Handling buffer overflow using `drain` event
- Demonstrating `cork()` and `uncork()` for optimizing performance
- Using `close` event to know when underlying resources are released

---

## 🛑 What's Next?

We're done with **Writable Streams**.

Next up:

> 📥 **Readable Streams**

- We'll use readable streams **heavily** in upcoming videos and sections.
- They form the **other half** of the streaming mechanism in Node.js.

---

## 📝 Final Advice

- Don’t memorize everything — just understand the core principles.
- Use Node.js documentation like a reference book.
- Experiment with `fs`, `http`, `net`, etc. using streams for hands-on mastery.

```

---

Let me know if you want a downloadable `.md` file or want this turned into a PDF, Notion document, or GitHub-ready README!
```

# Understanding Readable Streams in Node.js

This document is a detailed and enhanced markdown version of the transcript from a session about understanding Readable Streams in Node.js. This covers how streams work in practice, demonstrates usage with real-world examples, and highlights best practices when handling large files with readable and writable streams.

---

## Introduction to Readable Streams

In Node.js, a **Readable Stream** is a way to read data from a source (e.g., a file) in chunks instead of loading the entire content into memory. This is especially useful for large files and real-time data processing.

- **Writable stream**: We use it to write data chunk by chunk.
- **Readable stream**: We use it to read data chunk by chunk.

---

## Setup and File Structure

1. **Organize project files**:

   - Move write-related files to a folder called `write-many/`.
   - Create a new folder called `read-back/` for reading-related scripts.
   - Move a test file `test.txt` to the appropriate folder.

2. **Create a new file for reading**:

   - File name: `read-back.js`

---

## Creating a Readable Stream

```js
const fs = require('node:fs/promises');

(async () => {
  const fileHandleRead = await fs.open('source.txt', 'r');
  const streamRead = fileHandleRead.createReadStream();

  streamRead.on('data', (chunk) => {
    console.log('----- CHUNK -----');
    console.log(chunk);
  });
})();
```

### Key Details:

- The `data` event provides the stream chunks.
- These chunks do **not** represent the entire file content.
- Each chunk is typically around **64 KB** by default for file streams.

> The default `highWaterMark` value is 64 KB (`64 * 1024`) for `fs.createReadStream`. For other streams (like `stream.Readable`), the default is 16 KB.

```js
const streamRead = fileHandleRead.createReadStream({ highWaterMark: 400 });
```

You can customize the chunk size using the `highWaterMark` option.

---

## Read States

A readable stream can have three states:

1. **Paused**: Not actively reading.
2. **Flowing**: Actively reading and emitting `data` events.
3. **Ended**: The stream has finished reading.

Adding a `data` event listener puts the stream in **flowing mode**.

```js
streamRead.on('end', () => {
  console.log('Finished reading file.');
});
```

---

## Copy File Using Readable and Writable Streams

Goal: Copy `source.txt` to `dest.txt` by piping chunks.

```js
const fileHandleRead = await fs.open('source.txt', 'r');
const fileHandleWrite = await fs.open('dest.txt', 'w');

const streamRead = fileHandleRead.createReadStream();
const streamWrite = fileHandleWrite.createWriteStream();

streamRead.on('data', (chunk) => {
  streamWrite.write(chunk);
});
```

### Problem: Backpressure

Hard drives often have different read and write speeds. Writing faster than the write buffer allows leads to memory pressure.

---

## Experimenting with Large Files

### Generate a Large File

Use a write stream to write to a file multiple times:

```js
const fs = require('fs/promises');

(async () => {
  const fileHandle = await fs.open('test.txt', 'w');
  const stream = fileHandle.createWriteStream();

  const numberOfWrites = 10_000_000;

  for (let i = 0; i < numberOfWrites; i++) {
    const buff = Buffer.from(` ${i} `);
    stream.write(buff);
  }
})();
```

### File Size Results:

- 1 million writes = \~90 MB
- 1 billion writes = \~10 GB

Attempting to read this large file without managing backpressure can freeze your system.

---

## Managing Backpressure Properly

Use `stream.write()` return value to detect buffer saturation:

```js
streamRead.on('data', (chunk) => {
  const shouldContinue = streamWrite.write(chunk);
  if (!shouldContinue) {
    streamRead.pause();
  }
});

streamWrite.on('drain', () => {
  streamRead.resume();
});
```

- **`pause()`**: Temporarily stops `data` events.
- **`resume()`**: Resumes `data` events.
- **`drain`** event: Emitted when buffer is emptied.

This approach allows smooth flow of large file operations with minimal memory usage.

---

## Memory and Performance Observations

- Without `pause`/`drain`: Memory usage skyrocketed to 1GB and system froze.
- With proper backpressure handling: Memory usage stayed around 30MB even while copying a 10GB file.
- Copy process was completed quickly and reliably.

---

## Future Enhancements

### Filtering Data

Instead of copying all data, you can extract specific content from the stream (e.g., even numbers, prime numbers) before writing:

```js
streamRead.on('data', (chunk) => {
  const str = chunk.toString();
  const numbers = str.match(/\d+/g);
  const evenNumbers = numbers.filter((n) => Number(n) % 2 === 0);
  streamWrite.write(evenNumbers.join(' '));
});
```

---

## Conclusion

Readable and Writable Streams in Node.js are incredibly powerful for handling large data volumes. By managing the flow and understanding backpressure, we can work efficiently with files of any size without overloading system memory.

### Key Takeaways:

- Always handle backpressure when using streams.
- Avoid reading/writing large files without streaming.
- Use `pause()`, `resume()`, and `drain` for optimal performance.
- Monitor memory usage and avoid opening large files directly in editors.

---

## Suggested Next Steps

- Learn about **pipe()** method for connecting streams.
- Explore **Transform streams** to manipulate data on the fly.
- Understand **Stream modes**: flowing and paused.
- Build a utility to copy and filter data from large log files.

---

End of Notes.
