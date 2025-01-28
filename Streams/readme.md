<style>
*{
  font-family: 'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif;
}
</style>

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
