# Node.js Interview Revision — Hour 3
## Buffers, Streams, File System, Backpressure, Worker Threads, Child Processes & Cluster

> Goal: After this hour, you should be able to explain how Node handles large data efficiently, why streams matter, what backpressure is, how Buffer works, when filesystem operations block, and when to use Worker Threads, child processes, or multiple Node processes.

---

# 1. The Big Picture

Hour 3 is about this question:

> What happens when your Node application must handle large files, large data, or CPU-heavy work?

There are two major problems:

```text
Problem 1:
Large I/O data
Example:
5 GB file

Solution:
Streams
```

and:

```text
Problem 2:
CPU-heavy JavaScript
Example:
large calculation

Solution:
Worker Threads / multiple processes / separate jobs
```

Keep this distinction clear:

```text
I/O-heavy problem
=> Streams / async I/O

CPU-heavy problem
=> Worker Threads / processes
```

---

# 2. What Is a Buffer?

A Buffer represents raw binary data in Node.js.

JavaScript traditionally works naturally with:

```text
strings
numbers
objects
arrays
```

But files and network packets are fundamentally bytes.

Node provides:

```js
Buffer
```

to work with binary data.

Example:

```js
const buffer = Buffer.from("Hello");

console.log(buffer);
```

You may see something like:

```text
<Buffer 48 65 6c 6c 6f>
```

Those are byte values.

---

# 3. Why Does Node Need Buffers?

Imagine reading:

```text
image
video
PDF
TCP packet
compressed file
```

These are not naturally plain JavaScript strings.

Node receives raw bytes.

Buffer lets JavaScript work with those bytes.

Conceptually:

```text
Disk / Network
     |
     v
Raw Bytes
     |
     v
Buffer
     |
     v
JavaScript
```

---

# 4. Buffer vs String

String:

```js
const text = "Hello";
```

Buffer:

```js
const data = Buffer.from("Hello");
```

Convert Buffer to string:

```js
console.log(data.toString("utf8"));
```

Output:

```text
Hello
```

---

# 5. Creating Buffers

From string:

```js
const buffer = Buffer.from("Hello");
```

Allocate memory:

```js
const buffer = Buffer.alloc(10);
```

This creates 10 bytes initialized to zero.

There is also:

```js
Buffer.allocUnsafe(10);
```

It can be faster because memory is not initialized first.

But contents may contain old memory values until overwritten.

Do not use `allocUnsafe()` carelessly with sensitive data.

---

# 6. Buffer Length

```js
const buffer = Buffer.from("Hello");

console.log(buffer.length);
```

Output:

```text
5
```

But be careful with multibyte UTF-8 characters.

Example:

```js
const text = "😊";

console.log(text.length);
console.log(Buffer.byteLength(text));
```

JavaScript string length and actual UTF-8 byte length can differ.

Interview point:

> Strings work at the JavaScript character/code-unit level, while Buffer represents raw bytes.

---

# 7. What Is a Stream?

A stream lets Node process data incrementally instead of loading everything into memory at once.

Suppose you have:

```text
10 GB file
```

Bad approach:

```js
fs.readFile("huge-file.csv", ...)
```

Conceptually:

```text
10 GB file
   |
   v
LOAD EVERYTHING
   |
   v
RAM
```

This can consume huge memory.

With stream:

```text
10 GB file
   |
   v
small chunk
   |
   v
process
   |
   v
next chunk
```

Much more memory-efficient.

---

# 8. Simple Stream Example

```js
const fs = require("fs");

const stream =
  fs.createReadStream("large.txt");

stream.on("data", (chunk) => {
  console.log(chunk);
});

stream.on("end", () => {
  console.log("finished");
});
```

The file is read incrementally.

---

# 9. Why Streams Matter

Without stream:

```text
Large file
   |
   v
Entire file in RAM
```

With stream:

```text
Large file
   |
   v
Chunk
   |
   v
Chunk
   |
   v
Chunk
```

Benefits:

- lower memory usage,
- begin processing earlier,
- better handling of large files,
- natural handling of network data,
- backpressure support.

---

# 10. Four Main Stream Types

Node has four primary stream categories:

```text
Readable
Writable
Duplex
Transform
```

You must know all four.

---

# 11. Readable Stream

Readable stream produces data.

Examples:

```text
file read stream
HTTP request body
process.stdin
```

Example:

```js
const readable =
  fs.createReadStream("data.txt");
```

You consume data from it.

---

# 12. Writable Stream

Writable stream receives data.

Examples:

```text
file write stream
HTTP response
process.stdout
```

Example:

```js
const writable =
  fs.createWriteStream("output.txt");
```

Write:

```js
writable.write("Hello");
writable.end();
```

---

# 13. Duplex Stream

Duplex stream can both read and write.

Example:

```text
TCP socket
```

Conceptually:

```text
Client
 <-- data -->
Server
```

Both directions are possible.

---

# 14. Transform Stream

A Transform stream is a special Duplex stream where input is transformed into output.

Examples:

```text
gzip compression
encryption
data conversion
```

Example:

```js
const zlib = require("zlib");

const gzip = zlib.createGzip();
```

Data goes in:

```text
original
```

and comes out:

```text
compressed
```

---

# 15. Stream Types Cheat Sheet

```text
Readable
=> read data

Writable
=> write data

Duplex
=> read + write

Transform
=> read + write while transforming data
```

Examples:

```text
fs.createReadStream
=> Readable

fs.createWriteStream
=> Writable

TCP socket
=> Duplex

zlib.createGzip
=> Transform
```

---

# 16. `pipe()`

Streams can be connected using:

```js
readable.pipe(writable);
```

Example:

```js
const fs = require("fs");

fs.createReadStream("input.txt")
  .pipe(
    fs.createWriteStream("output.txt")
  );
```

Conceptually:

```text
input.txt
   |
Readable
   |
   v
Writable
   |
   v
output.txt
```

---

# 17. Why `pipe()` Is Powerful

`pipe()` handles stream flow and backpressure much better than manually listening to `data` and writing everything blindly.

It allows:

```text
Readable
   |
   v
Transform
   |
   v
Transform
   |
   v
Writable
```

Example:

```js
fs.createReadStream("file.txt")
  .pipe(zlib.createGzip())
  .pipe(
    fs.createWriteStream("file.txt.gz")
  );
```

---

# 18. Prefer `pipeline()` for Production

Better error handling:

```js
const { pipeline } =
  require("stream/promises");

await pipeline(
  fs.createReadStream("input.txt"),
  zlib.createGzip(),
  fs.createWriteStream("output.gz")
);
```

Why is `pipeline()` useful?

It helps manage:

- errors,
- stream cleanup,
- closing connected streams.

Strong interview answer:

> `pipeline()` is generally safer than manually chaining `.pipe()` when I need reliable error propagation and cleanup.

---

# 19. What Is a Chunk?

Streams process data in pieces called chunks.

Example:

```js
stream.on("data", (chunk) => {
  console.log(chunk.length);
});
```

A chunk may be:

```text
Buffer
```

or:

```text
string
```

depending on encoding/mode.

---

# 20. `highWaterMark`

Streams maintain an internal buffer.

`highWaterMark` is a threshold related to how much data a stream will buffer before applying flow control.

Example:

```js
fs.createReadStream("file.txt", {
  highWaterMark: 64 * 1024,
});
```

This is:

```text
64 KB
```

Important:

> `highWaterMark` is a buffering threshold, not a strict maximum memory limit.

---

# 21. What Is Backpressure?

This is one of the most important stream interview questions.

Suppose producer is fast:

```text
Producer:
████████████████████
```

Consumer is slow:

```text
Consumer:
████
```

Without control:

```text
Producer generates faster
        |
        v
Memory buffer grows
        |
        v
RAM usage increases
        |
        v
possible crash
```

Backpressure solves this.

---

# 22. Backpressure Mental Model

```text
Readable Stream
     |
     | data
     v
Writable Stream
     |
     | too slow
     v
internal buffer fills
     |
     v
tell producer:
SLOW DOWN
```

When consumer catches up:

```text
resume producer
```

That flow control is backpressure.

---

# 23. Writable `.write()` Return Value

Example:

```js
const canContinue =
  writable.write(chunk);
```

If:

```text
true
```

the internal buffer still has capacity.

If:

```text
false
```

the producer should stop writing temporarily.

Wait for:

```js
writable.once("drain", () => {
  // resume writing
});
```

This is how manual backpressure handling works.

---

# 24. Manual Backpressure Example

```js
function writeMany(
  writable,
  chunks
) {
  let index = 0;

  function write() {
    while (index < chunks.length) {
      const canContinue =
        writable.write(
          chunks[index]
        );

      index++;

      if (!canContinue) {
        writable.once(
          "drain",
          write
        );

        return;
      }
    }

    writable.end();
  }

  write();
}
```

You do not need to memorize this code.

Remember the concept:

```text
write() returns false
=> stop

drain event
=> resume
```

---

# 25. Why `pipe()` Helps Backpressure

`pipe()` automatically manages pause/resume behavior between readable and writable streams.

That's one reason this is safer:

```js
readable.pipe(writable);
```

than this:

```js
readable.on("data", (chunk) => {
  writable.write(chunk);
});
```

The second version can ignore backpressure if written carelessly.

---

# 26. Stream Modes

Readable streams can operate in:

```text
flowing mode
paused mode
```

## Flowing mode

Data is automatically emitted.

Example:

```js
stream.on("data", handler);
```

## Paused mode

You explicitly control reading.

Example:

```js
const chunk = stream.read();
```

For most interviews, knowing that streams can be flowing or paused is enough.

---

# 27. Stream Events

Common readable events:

```text
data
end
error
close
```

Common writable events:

```text
drain
finish
error
close
```

Know these important distinctions:

```text
end
=> readable has no more data

finish
=> writable has received all data and flushed it
```

---

# 28. `end` vs `finish`

Readable:

```js
readable.on("end", () => {});
```

Writable:

```js
writable.on("finish", () => {});
```

Easy interview trap:

```text
Readable completes
=> end

Writable completes
=> finish
```

---

# 29. Stream Error Handling

Bad:

```js
readable.pipe(writable);
```

with no error handling.

Better:

```js
readable.on("error", handleError);
writable.on("error", handleError);
```

Best commonly:

```js
await pipeline(
  readable,
  writable
);
```

with:

```js
try {
  await pipeline(...);
} catch (error) {
  // handle
}
```

---

# 30. Large File Upload Example

Suppose user uploads a 5 GB video.

Bad architecture:

```text
Browser
  |
  v
Node
  |
  v
Load entire 5 GB into RAM
```

Very dangerous.

Better:

```text
Browser
  |
  v
Readable request stream
  |
  v
Streaming upload
  |
  v
Disk / object storage
```

This allows Node to process data incrementally.

---

# 31. HTTP Request and Response Are Streams

This is a strong interview point.

In Node's HTTP server:

```js
http.createServer((req, res) => {
  // req is readable
  // res is writable
});
```

Conceptually:

```text
req
=> Readable Stream

res
=> Writable Stream
```

That's why request bodies can be consumed incrementally.

---

# 32. Streams and Express

Express sits on Node's HTTP primitives.

The request and response objects still ultimately build upon Node's stream behavior.

Middleware like:

```js
express.json()
```

reads the request body and parses it.

This means:

> If you parse a huge request body completely, you are no longer getting the same memory advantage as streaming it directly.

---

# 33. `fs.readFile()` vs `createReadStream()`

You must know this comparison.

## `fs.readFile()`

```js
fs.readFile(
  "large.csv",
  (err, data) => {}
);
```

Behavior:

```text
Read entire file
      |
      v
Buffer entire content
      |
      v
Callback
```

Good for:

```text
small configuration file
small JSON file
small templates
```

## `createReadStream()`

```js
const stream =
  fs.createReadStream(
    "large.csv"
  );
```

Behavior:

```text
chunk
chunk
chunk
```

Good for:

```text
large files
video
CSV
large logs
downloads
```

---

# 34. Does `fs.readFile()` Block the Event Loop?

Important distinction.

```js
fs.readFile()
```

is asynchronous.

It does not synchronously block the JS main thread while waiting for file I/O.

But:

```js
fs.readFileSync()
```

does block the main thread.

However, async `readFile()` can still consume lots of memory because the complete file must be collected before callback resolution.

So:

```text
readFile
=> async but memory-heavy for huge files

readFileSync
=> blocking + memory-heavy

createReadStream
=> async + incremental
```

---

# 35. Sync File APIs

Examples:

```js
fs.readFileSync()
fs.writeFileSync()
fs.statSync()
```

These block the main JS thread.

Avoid them inside hot server request paths unless there is a very specific reason.

Can be acceptable for:

```text
startup
CLI tools
build scripts
one-time initialization
```

---

# 36. File System Promise API

Modern Node supports:

```js
const fs =
  require("fs/promises");

const data =
  await fs.readFile(
    "file.txt",
    "utf8"
  );
```

This is convenient for async/await.

Again:

> Promise-based `readFile` is still whole-file reading, not streaming.

---

# 37. Copying a Large File

Bad for very large file:

```js
const data =
  await fs.readFile(
    "big.iso"
  );

await fs.writeFile(
  "copy.iso",
  data
);
```

Better:

```js
await pipeline(
  fs.createReadStream(
    "big.iso"
  ),
  fs.createWriteStream(
    "copy.iso"
  )
);
```

---

# 38. Processing Huge CSV

Classic interview question:

> You have a 10 GB CSV. How would you process it?

Strong answer:

```text
1. Do not use readFile
2. Use createReadStream
3. Pipe through a CSV parser
4. Process rows incrementally
5. Respect backpressure
6. Batch DB inserts
7. Limit concurrency
8. Handle malformed rows/errors
```

Conceptual flow:

```text
CSV File
   |
Readable Stream
   |
CSV Parser Transform
   |
Rows
   |
Batch Processor
   |
Database
```

---

# 39. Why Batch DB Inserts?

Bad:

```text
10 million rows
= 10 million individual DB insert calls
```

Better:

```text
read rows
   |
collect maybe 500/1000
   |
batch insert
   |
continue
```

This reduces network overhead and database workload.

But batch size should be tested.

---

# 40. Backpressure With Database

Suppose stream reads 100,000 rows/second but DB can insert only 5,000 rows/second.

Without control:

```text
memory queue grows
```

You need to slow reading/processing.

Strategies:

```text
pause/resume stream
await batch insert
Transform streams
pipeline
bounded concurrency
```

---

# 41. Object Mode Streams

Normal streams work with:

```text
Buffer
string
```

But Node streams can operate in object mode.

Example:

```js
const { Transform } =
  require("stream");

const transform =
  new Transform({
    objectMode: true,

    transform(
      object,
      encoding,
      callback
    ) {
      callback(
        null,
        {
          ...object,
          processed: true,
        }
      );
    },
  });
```

Useful for structured items such as parsed CSV rows.

---

# 42. Transform Stream Example

Simple uppercase transform:

```js
const {
  Transform
} = require("stream");

const upper =
  new Transform({
    transform(
      chunk,
      encoding,
      callback
    ) {
      callback(
        null,
        chunk
          .toString()
          .toUpperCase()
      );
    },
  });
```

Pipeline:

```js
await pipeline(
  fs.createReadStream("input.txt"),
  upper,
  fs.createWriteStream("output.txt")
);
```

---

# 43. Compression Stream Example

```js
const zlib =
  require("zlib");

await pipeline(
  fs.createReadStream(
    "large.log"
  ),
  zlib.createGzip(),
  fs.createWriteStream(
    "large.log.gz"
  )
);
```

Memory stays controlled because the entire file does not need to be loaded at once.

---

# 44. What Is CPU-Bound Work?

CPU-bound means most time is spent performing calculations rather than waiting for I/O.

Examples:

```text
large numerical calculations
image manipulation
video encoding
huge JSON transformation
complex parsing
cryptographic computations
machine learning inference
```

CPU-heavy synchronous JavaScript blocks Node's main event loop.

---

# 45. Example of CPU Blocking

```js
app.get(
  "/calculate",
  (req, res) => {
    let result = 0;

    for (
      let i = 0;
      i < 10_000_000_000;
      i++
    ) {
      result += i;
    }

    res.json({ result });
  }
);
```

While loop runs:

```text
Request A
   |
CPU loop
   |
MAIN THREAD BLOCKED

Request B --> waits
Request C --> waits
Request D --> waits
```

---

# 46. What Are Worker Threads?

Worker Threads let Node execute JavaScript on additional threads.

Import:

```js
const {
  Worker
} = require(
  "worker_threads"
);
```

Mental model:

```text
Main JS Thread
      |
      +----> Worker 1
      |
      +----> Worker 2
      |
      +----> Worker 3
```

Each worker has its own JS execution environment.

---

# 47. Why Worker Threads?

Because async I/O does not solve CPU blocking.

Example:

```text
await heavyCalculation()
```

If `heavyCalculation()` performs synchronous CPU-heavy JS before returning/resolving:

```text
event loop still blocked
```

`async` does not magically move CPU work to another thread.

Worker Threads can.

---

# 48. Worker Thread Example

`worker.js`:

```js
const {
  parentPort,
  workerData
} = require(
  "worker_threads"
);

let result = 0;

for (
  let i = 0;
  i < workerData.limit;
  i++
) {
  result += i;
}

parentPort.postMessage(
  result
);
```

Main:

```js
const {
  Worker
} = require(
  "worker_threads"
);

const worker =
  new Worker(
    "./worker.js",
    {
      workerData: {
        limit:
          1_000_000_000,
      },
    }
  );

worker.on(
  "message",
  (result) => {
    console.log(result);
  }
);

worker.on(
  "error",
  console.error
);
```

Now heavy calculation happens in the worker.

---

# 49. Worker Communication

Workers can communicate using messages:

```text
Main
 |
 | postMessage
 v
Worker
 |
 | postMessage
 v
Main
```

APIs:

```js
worker.postMessage(...)
parentPort.postMessage(...)
```

---

# 50. Worker Threads and Memory

Worker Threads have separate JavaScript heaps by default.

But they can share raw memory using:

```text
SharedArrayBuffer
```

This is one key difference from separate processes.

---

# 51. When to Use Worker Threads

Good use cases:

```text
CPU-heavy calculations
image processing
large transformations
compression logic
parsing
cryptography
algorithms
```

Not normally needed for:

```text
DB query
HTTP API call
Redis
network request
normal file read
```

Those are I/O-bound.

---

# 52. Worker Threads Are Not Free

Creating a worker has overhead.

Do not create a new Worker for every tiny task.

For repeated CPU work, consider:

```text
Worker Pool
```

Conceptually:

```text
Tasks
  |
  v
Queue
  |
  v
Fixed Worker Pool
  |
  +--> worker 1
  +--> worker 2
  +--> worker 3
```

---

# 53. Why Worker Pool?

Suppose every request creates a new Worker:

```text
1000 requests
=> 1000 threads
```

This can be disastrous.

Better:

```text
4/8/etc. long-lived workers
```

and distribute jobs among them.

---

# 54. How Many Workers?

No universal magic number.

Usually related to:

```text
CPU cores
task type
latency goals
memory
```

For CPU-bound work, a worker count near available CPU parallelism is often a reasonable starting point, then benchmark.

Do not say:

> Always create number_of_cores workers.

It depends on workload.

---

# 55. What Is `child_process`?

`child_process` lets Node start another operating-system process.

Example:

```js
const {
  spawn
} = require(
  "child_process"
);

const child =
  spawn(
    "node",
    ["script.js"]
  );
```

This creates a separate process.

---

# 56. Why Use a Child Process?

Examples:

```text
run shell command
run Python script
run ffmpeg
run another Node application
isolate risky/heavy work
```

Since it is a separate process:

```text
separate memory space
separate PID
stronger isolation
```

---

# 57. `spawn()` vs `exec()`

Important interview question.

## `spawn`

Streams stdout/stderr.

```js
const child =
  spawn(
    "ls",
    ["-la"]
  );

child.stdout.on(
  "data",
  (chunk) => {
    console.log(
      chunk.toString()
    );
  }
);
```

Good for:

```text
large output
long-running process
streaming
```

## `exec`

Executes a command and buffers output.

```js
exec(
  "ls -la",
  (err, stdout) => {
    console.log(stdout);
  }
);
```

Convenient for small output.

---

# 58. Why `exec()` Can Be Dangerous for Huge Output

`exec()` buffers command output in memory.

Large output can exceed buffer limits.

`spawn()` streams output incrementally.

Remember:

```text
spawn
=> stream

exec
=> buffer
```

---

# 59. Shell Injection Risk

Bad:

```js
exec(
  `convert ${req.body.filename}`
);
```

If user controls the command string, shell injection may be possible.

Safer patterns include:

```js
spawn(
  "convert",
  [validatedFilename]
);
```

with strict input validation and without unnecessary shell interpretation.

---

# 60. `execFile()`

`execFile()` executes a file directly without a shell by default.

This can reduce shell-injection risk compared with composing shell command strings.

Use based on requirements.

---

# 61. `fork()`

`fork()` is a special form of child process designed for spawning Node.js modules with an IPC communication channel.

Example:

```js
const {
  fork
} = require(
  "child_process"
);

const child =
  fork("./worker-process.js");

child.send({
  task: "start"
});

child.on(
  "message",
  (msg) => {
    console.log(msg);
  }
);
```

---

# 62. Worker Threads vs Child Process

This is a must-know comparison.

```text
Worker Threads
-------------------------
Same process
Separate JS threads
Separate JS heaps generally
Can share memory
Lower isolation
Useful for CPU-heavy JS

Child Process
-------------------------
Separate OS process
Separate memory
IPC for communication
Stronger isolation
Can run non-Node programs
```

---

# 63. What Is Cluster?

Cluster is a Node mechanism for running multiple Node processes that can serve the same application workload.

Conceptually:

```text
             Requests
                |
                v
          Primary Process
         /       |       \
        v        v        v
     Worker   Worker   Worker
     Process  Process  Process
```

Each worker is a separate Node process.

---

# 64. Why Cluster Exists

One Node process primarily executes JS on one main thread.

On an 8-core machine:

```text
single process
```

may not fully use all CPU cores for JS execution.

Multiple processes can utilize more cores.

---

# 65. Cluster vs Worker Threads

Cluster:

```text
multiple processes
separate memory
often used to scale server instances
```

Worker Threads:

```text
multiple threads inside process
CPU task parallelism
can share memory
```

Simple interview answer:

> Cluster scales the Node server across multiple processes/CPU cores, while Worker Threads are mainly useful for CPU-intensive JavaScript tasks inside an application.

---

# 66. Do You Always Need Cluster Today?

No.

In modern deployments, process scaling may be handled externally:

```text
Docker
Kubernetes
PM2
cloud platforms
container replicas
load balancers
```

Example:

```text
Load Balancer
    |
    +--> Node Container 1
    +--> Node Container 2
    +--> Node Container 3
```

So cluster is conceptually important, but production scaling may happen outside Node itself.

---

# 67. Horizontal vs Vertical Scaling

Vertical:

```text
bigger server
more CPU
more RAM
```

Horizontal:

```text
more application instances
```

Node production systems often scale horizontally.

Example:

```text
Load Balancer
  |
  +--> Instance A
  +--> Instance B
  +--> Instance C
```

---

# 68. Stateless Apps Scale More Easily

Suppose user session exists only in local memory:

```text
User request 1 -> Server A
Session stored on A

User request 2 -> Server B
B doesn't know session
```

Solutions:

```text
JWT
shared Redis session
sticky sessions
```

This is why stateless/shared-state architectures help horizontal scaling.

---

# 69. CPU Core Misconception

Do not say:

> Node can only use one CPU core.

Better:

> A single Node process normally has one main JavaScript thread, but an application can utilize multiple CPU cores through Worker Threads or multiple Node processes/instances.

---

# 70. Worker Threads vs libuv Thread Pool

Another must-know question.

```text
libuv Thread Pool
--------------------------
Managed internally by libuv
Native operations
fs / crypto / some DNS / zlib
Your normal JS isn't executed there

Worker Threads
--------------------------
Created explicitly by app
Runs JavaScript
Used for CPU-heavy JS work
```

---

# 71. Example: Password Hashing

Libraries such as bcrypt may use native mechanisms/threads depending on implementation.

Important distinction:

If you use a synchronous hash API:

```js
bcrypt.hashSync(...)
```

you block the main JS thread.

If you use async variant:

```js
await bcrypt.hash(...)
```

the implementation can perform expensive work outside the main JS execution path.

Always understand the library implementation when performance matters.

---

# 72. Example: JSON.parse

This is subtle.

```js
JSON.parse(hugeString)
```

is synchronous JavaScript/C++ engine work from the application's perspective.

If JSON is enormous:

```text
event loop can be blocked
```

Even though the data may have arrived asynchronously.

This is why:

```text
Async I/O does not mean all processing is non-blocking.
```

---

# 73. Large JSON Problem

Flow:

```text
Network request async
      |
      v
100 MB JSON arrives
      |
      v
JSON.parse()
      |
      v
CPU work
      |
      v
event loop blocked
```

Possible approaches:

```text
streaming parser
worker thread
smaller payloads
pagination
chunking
```

---

# 74. Compression Can Be CPU-Heavy

Compression involves CPU work.

Node can expose async compression APIs, and some compression work can use libuv's pool/native mechanisms.

But high-volume compression can still consume CPU resources and impact performance.

Always think about:

```text
CPU saturation
thread pool saturation
latency
```

---

# 75. Thread Pool Saturation

Suppose default libuv pool is handling:

```text
many pbkdf2 jobs
many file operations
```

If all workers are busy:

```text
new thread-pool tasks wait
```

This can increase latency.

Important:

> Event loop may be free while thread-pool work is queued.

So not every performance problem is an event-loop-blocking problem.

---

# 76. Event Loop vs Thread Pool Bottleneck

Two different bottlenecks:

## Event loop blocked

```text
CPU-heavy JS
sync filesystem
huge JSON.parse
```

## Thread pool saturated

```text
many fs jobs
many crypto jobs
native work using pool
```

The symptoms can both look like slow requests, but causes differ.

---

# 77. How to Process Image Uploads

Suppose:

```text
User uploads image
Need resize + compress
```

Possible architecture:

```text
Upload
  |
  v
Store original
  |
  v
Queue processing job
  |
  v
Worker process/thread
  |
  v
Resize/Compress
  |
  v
Store processed image
```

Do not necessarily perform heavy image processing synchronously in request handler.

---

# 78. Background Jobs

Long-running work should often not keep HTTP request open.

Example:

```text
POST /reports
```

Instead of:

```text
request waits 5 minutes
```

you may:

```text
create job
return 202 Accepted
process in background worker
client checks status / receives notification
```

Example architecture:

```text
API
 |
 v
Queue
 |
 v
Worker
 |
 v
Result
```

---

# 79. 202 Accepted

Useful when request is accepted but processing is not complete.

Example:

```text
POST /reports
=> 202 Accepted
```

Response:

```json
{
  "jobId": "abc123",
  "status": "queued"
}
```

---

# 80. Streams vs Worker Threads

Do not confuse them.

Streams solve:

```text
large-data memory/flow problem
```

Worker Threads solve:

```text
CPU execution problem
```

Example:

```text
Read 10 GB CSV
=> Stream

Perform expensive calculation per row
=> Maybe worker pool
```

They can be used together.

---

# 81. Streams vs Buffers

Buffer:

```text
chunk of binary data in memory
```

Stream:

```text
mechanism for moving data over time
```

A stream often emits Buffer chunks.

Think:

```text
Stream
  |
  v
Buffer
  |
  v
Buffer
  |
  v
Buffer
```

---

# 82. Interview Question:
## "What Is Backpressure?"

Strong answer:

> Backpressure occurs when a data producer is faster than the consumer. Without flow control, data accumulates in memory. Node streams handle this by signaling the producer to slow or pause when the writable side's buffer fills, and to resume when the consumer drains the buffer.

---

# 83. Interview Question:
## "Why Streams?"

Strong answer:

> Streams let Node process data incrementally instead of buffering the entire dataset in memory. This reduces memory usage, lets processing begin earlier, and provides backpressure, which is especially useful for large files, uploads, downloads, network data, and data pipelines.

---

# 84. Interview Question:
## "`readFile` vs `createReadStream`?"

Strong answer:

> `readFile` reads the entire file before returning the complete contents, so it is convenient for smaller files but can consume large amounts of memory. `createReadStream` reads incrementally in chunks, making it much better for large files and streaming pipelines.

---

# 85. Interview Question:
## "What Is Buffer?"

Strong answer:

> Buffer is Node.js's representation for raw binary data. It is commonly used for files, network packets, streams, images, and other byte-oriented data. Streams often deliver their chunks as Buffer objects.

---

# 86. Interview Question:
## "When Use Worker Threads?"

Strong answer:

> Worker Threads are useful for CPU-intensive JavaScript that would otherwise block the event loop, such as heavy computations or large transformations. I normally would not use them just for database or network I/O because Node's async I/O model already handles those efficiently.

---

# 87. Interview Question:
## "Worker Threads vs Child Process?"

Strong answer:

> Worker Threads run inside the same process and are suitable for CPU-heavy JavaScript, with the ability to share memory. Child processes are separate operating-system processes with isolated memory, can run non-Node programs, and communicate through IPC or streams. Child processes provide stronger isolation but usually have greater overhead.

---

# 88. Interview Question:
## "Cluster vs Worker Threads?"

Strong answer:

> Cluster uses multiple Node processes, commonly to utilize multiple CPU cores for server workloads. Worker Threads create additional JavaScript threads inside one process and are mainly used to parallelize CPU-heavy tasks.

---

# 89. Interview Question:
## "Does async/await Fix CPU Blocking?"

No.

Example:

```js
async function calculate() {
  let sum = 0;

  for (
    let i = 0;
    i < 10_000_000_000;
    i++
  ) {
    sum += i;
  }

  return sum;
}
```

Calling:

```js
await calculate();
```

still performs the huge loop on the main JS thread.

`async` does not automatically create another thread.

---

# 90. Interview Question:
## "How Would You Stream a Download?"

Example:

```js
app.get(
  "/download",
  (req, res, next) => {
    const stream =
      fs.createReadStream(
        "large.zip"
      );

    stream.on(
      "error",
      next
    );

    stream.pipe(res);
  }
);
```

Conceptually:

```text
File
 |
Readable Stream
 |
HTTP Response
 |
Client
```

No need to load entire file first.

---

# 91. Better Download With Pipeline

```js
const {
  pipeline
} = require(
  "stream/promises"
);

app.get(
  "/download",
  async (req, res, next) => {
    try {
      await pipeline(
        fs.createReadStream(
          "large.zip"
        ),
        res
      );
    } catch (error) {
      next(error);
    }
  }
);
```

Be mindful that once response headers/body have begun, error handling must account for partially sent responses.

---

# 92. Upload Streaming to Object Storage

Conceptually:

```text
Client upload
      |
      v
Node request stream
      |
      v
Object-storage upload stream
      |
      v
Blob/S3/Azure/etc.
```

This avoids:

```text
load complete file into RAM
```

before uploading.

---

# 93. Stream Cleanup

Streams are resources.

If one stream errors, downstream/upstream streams may need to close.

This is one reason `pipeline()` is valuable.

It coordinates cleanup.

---

# 94. `stream.finished()`

Node also provides utilities to know when a stream has completed or errored.

You do not need to memorize every API.

Interview focus:

```text
pipeline
errors
cleanup
backpressure
```

---

# 95. File Descriptors

When Node opens a file, the OS provides a file descriptor/handle.

Too many open files can hit operating-system limits.

This can happen if code leaks streams/files.

Always close resources properly.

Streams normally handle closure, but error paths matter.

---

# 96. `EMFILE`

An error such as:

```text
EMFILE: too many open files
```

means the process/system has exceeded available file descriptors.

Possible causes:

```text
opening thousands of files at once
not closing resources
unbounded concurrency
```

Fix architecture before simply raising limits.

---

# 97. Why Unbounded File Processing Is Dangerous

Bad:

```js
await Promise.all(
  100000Files.map(
    processFile
  )
);
```

This can open huge numbers of file descriptors simultaneously.

Use:

```text
batching
concurrency limits
queues
```

---

# 98. Stream + Async Iterator

Readable streams support async iteration.

Example:

```js
const stream =
  fs.createReadStream(
    "file.txt"
  );

for await (
  const chunk of stream
) {
  console.log(chunk);
}
```

This is a clean modern way to consume streams.

---

# 99. Why Async Iteration Is Nice

It gives stream consumption a simple structure:

```js
for await (
  const chunk of readable
) {
  await processChunk(
    chunk
  );
}
```

This can naturally limit processing because each iteration can wait.

---

# 100. Stream Encoding

By default, file stream chunks are Buffers.

Set encoding:

```js
stream.setEncoding(
  "utf8"
);
```

Then chunks become strings.

Be careful with arbitrary binary files.

Do not convert images/videos to strings unnecessarily.

---

# 101. Binary vs Text Files

Text:

```text
JSON
CSV
TXT
```

can be decoded with appropriate encoding.

Binary:

```text
PNG
PDF
ZIP
MP4
```

should generally remain bytes/Buffers.

---

# 102. UTF-8 and Chunk Boundaries

A multi-byte UTF-8 character can conceptually span chunk boundaries.

Node's string decoder mechanisms handle such cases when encoding is configured properly.

This is another reason not to manually perform naive byte-to-string handling for streamed text.

You usually don't need to explain this unless interviewer goes deep.

---

# 103. Graceful Worker Failure

Workers can fail.

Handle:

```js
worker.on(
  "error",
  (error) => {}
);

worker.on(
  "exit",
  (code) => {}
);
```

Production worker pools should handle:

```text
worker crashes
task retries
timeouts
queue state
```

---

# 104. Child Process Failure

Also handle:

```text
error
exit
stderr
timeout
```

Never assume an external process always succeeds.

---

# 105. Process Isolation

Why may a child process be safer than a Worker Thread?

Because:

```text
Child process crash
```

may be isolated from parent process better than code sharing the same process space.

For untrusted or highly failure-prone work, process isolation may be desirable.

---

# 106. IPC

IPC:

```text
Inter-Process Communication
```

Processes can communicate via:

```text
messages
pipes
sockets
shared external stores
```

Node `fork()` provides a built-in message channel.

---

# 107. Shared Memory vs IPC

Worker Thread:

```text
can use SharedArrayBuffer
```

Child process:

```text
separate memory
must communicate through IPC
```

This makes Workers useful when sharing large memory efficiently is important, but shared-memory programming also introduces synchronization complexity.

---

# 108. Race Conditions With Shared Memory

If multiple workers modify the same shared memory:

```text
Worker A reads X
Worker B reads X
A writes
B writes
```

you can have races.

JavaScript provides Atomics for coordinating SharedArrayBuffer access.

For most backend interviews, just know:

> Shared memory is possible, but requires synchronization.

---

# 109. Worker Thread Does Not Mean "No Concurrency Problems"

Parallel work creates new concerns:

```text
race conditions
coordination
worker crashes
message ordering
shared state
```

So use Workers only when their benefits justify complexity.

---

# 110. Cluster and In-Memory State

Each cluster worker is a separate process.

Therefore:

```text
memory is not automatically shared
```

If process A stores:

```js
const sessions = new Map();
```

process B cannot automatically see it.

Use shared systems:

```text
Redis
Database
external cache
```

for shared state.

---

# 111. Load Balancer + Multiple Node Instances

Modern production mental model:

```text
              Internet
                  |
                  v
            Load Balancer
           /      |       \
          v       v        v
       Node 1   Node 2   Node 3
          \       |       /
                  v
             Shared DB
             Shared Redis
```

This architecture is more important in modern backend interviews than memorizing every Cluster API method.

---

# 112. Sticky Sessions

If using in-memory session state:

```text
same user may need same server
```

Load balancer can use sticky sessions.

But shared session storage usually scales better in many designs.

---

# 113. Memory Leak Basics

Even though JavaScript has garbage collection, Node can still leak memory.

Example:

```js
const cache = [];

app.get("/", (req, res) => {
  cache.push(
    req.body
  );

  res.send("ok");
});
```

If `cache` grows forever:

```text
memory leak
```

Garbage collector cannot free objects still referenced.

---

# 114. Stream Memory Leak Examples

Potential problems:

```text
event listeners never removed
streams never closed
huge queues
unbounded buffering
retaining chunks unnecessarily
```

Backpressure helps avoid one class of memory growth.

---

# 115. Garbage Collection and Buffers

Buffers use memory associated with binary data, and large Buffer usage still matters for process memory.

Do not assume:

> Buffers are free because they are outside normal JS strings.

Large Buffers can absolutely consume substantial memory.

---

# 116. `process.memoryUsage()`

Useful API:

```js
console.log(
  process.memoryUsage()
);
```

It can show values such as:

```text
rss
heapTotal
heapUsed
external
arrayBuffers
```

Useful during debugging.

---

# 117. RSS vs Heap

Very simplified:

```text
heapUsed
=> JS heap currently used

rss
=> total resident memory for process
```

RSS can be much larger because process memory includes more than just V8's JS heap.

---

# 118. Streams Do Not Mean Zero Memory

Streams still buffer chunks.

The benefit is:

```text
bounded/incremental memory
```

rather than:

```text
entire dataset at once
```

---

# 119. Common Interview Trap:
## "A stream reads one byte at a time."

Wrong.

Streams read chunks.

Chunk size depends on:

```text
stream implementation
highWaterMark
OS
data source
```

---

# 120. Common Interview Trap:
## "Streams are only for files."

Wrong.

Streams are used for:

```text
HTTP
TCP
files
compression
stdin/stdout
crypto
many data pipelines
```

---

# 121. Common Interview Trap:
## "Worker Threads make every Node app faster."

Wrong.

Workers add:

```text
creation overhead
communication overhead
memory
complexity
```

Use for suitable CPU-heavy tasks.

---

# 122. Common Interview Trap:
## "child_process and Worker Thread are the same."

Wrong.

```text
Worker
=> thread in same process

Child
=> separate OS process
```

---

# 123. Common Interview Trap:
## "Cluster shares normal JavaScript memory."

Wrong.

Cluster workers are separate processes.

---

# 124. Common Interview Trap:
## "Async filesystem means stream."

Wrong.

Example:

```js
await fs.readFile(...)
```

is async but still loads the whole file.

---

# 125. Common Interview Trap:
## "`pipe()` means no error handling is needed."

Wrong.

Production pipelines still need robust error handling.

Prefer:

```js
pipeline()
```

where appropriate.

---

# 126. Interview Scenario:
## "Send a 2 GB File to Client"

Answer:

```text
Use createReadStream
pipe/pipeline into response
set appropriate headers
handle errors
do not read complete file into memory
support range requests if needed for media
```

Basic:

```js
fs.createReadStream(
  path
).pipe(res);
```

---

# 127. Interview Scenario:
## "Process 20 GB CSV and Insert into PostgreSQL"

Strong approach:

```text
1. createReadStream
2. streaming CSV parser
3. validate each row
4. collect bounded batch
5. batch insert
6. apply backpressure
7. limit DB concurrency
8. log failed rows
9. handle stream/parser/DB errors
10. use transaction strategy depending on business requirement
```

---

# 128. Interview Scenario:
## "Generate PDF Takes 30 Seconds"

Do not keep CPU-heavy generation directly on main event-loop thread.

Possible:

```text
Request
  |
  v
Create job
  |
  v
202 Accepted
  |
  v
Queue
  |
  v
Worker Process / Thread
  |
  v
Generate PDF
```

Then notify or expose job status.

---

# 129. Interview Scenario:
## "Run ffmpeg"

Use:

```text
child_process.spawn()
```

Why?

Because ffmpeg is an external executable, and its output/progress may be streamed.

---

# 130. Interview Scenario:
## "Calculate Fibonacci for Huge N"

CPU-bound.

Options:

```text
Worker Thread
worker pool
separate compute service
```

Do not simply make function `async`.

---

# 131. Interview Scenario:
## "Fetch Data From 5 APIs"

I/O-bound.

Use:

```js
await Promise.all(...)
```

if calls are independent.

Do not use Worker Threads just for network waiting.

---

# 132. Interview Scenario:
## "1000 Images Need Resize"

CPU/native-heavy workload.

Good architecture:

```text
Upload/API
  |
  v
Queue
  |
  v
bounded worker pool
  |
  v
process images
```

Avoid spawning 1000 workers simultaneously.

---

# 133. Interview Scenario:
## "Read Config File During Startup"

Using:

```js
fs.readFileSync()
```

during startup can sometimes be acceptable because there are no active user requests yet.

Context matters.

Do not say sync APIs are universally forbidden.

---

# 134. Interview Scenario:
## "Read Same Small Config on Every Request"

Bad:

```js
app.get("/", (req, res) => {
  const config =
    fs.readFileSync(
      "./config.json"
    );

  ...
});
```

This blocks every request.

Better:

```text
load once at startup
cache in memory
```

if config is static.

---

# 135. Node Stream Pipeline Architecture

Example:

```text
File
 |
 v
Readable
 |
 v
Decompress
 |
 v
CSV Parser
 |
 v
Transform
 |
 v
Batch Writer
 |
 v
Database
```

This is an excellent mental model for data engineering-style Node interview questions.

---

# 136. The Core Decision Tree

When faced with a problem:

```text
Is it waiting on I/O?
        |
       YES
        |
        v
Use async I/O

Is data huge?
        |
       YES
        |
        v
Use streams/backpressure

Is it CPU-heavy JS?
        |
       YES
        |
        v
Worker Thread / worker pool

Need external executable?
        |
       YES
        |
        v
child_process

Need multiple Node server processes?
        |
       YES
        |
        v
multiple instances / cluster / containers
```

---

# 137. 30 Rapid-Fire Interview Questions

Answer without reading.

1. What is Buffer?
2. Why does Node need Buffer?
3. Buffer vs string?
4. What is a stream?
5. Why use streams?
6. Name 4 stream types.
7. Readable example?
8. Writable example?
9. Duplex example?
10. Transform example?
11. What is pipe?
12. Why pipeline over pipe?
13. What is a chunk?
14. What is highWaterMark?
15. What is backpressure?
16. What happens when writable.write returns false?
17. What is drain?
18. end vs finish?
19. readFile vs createReadStream?
20. Does readFile block?
21. readFile vs readFileSync?
22. How process 10 GB CSV?
23. What are Worker Threads?
24. When use Worker Threads?
25. Worker Thread vs libuv thread pool?
26. Worker Thread vs child process?
27. spawn vs exec?
28. What is fork?
29. What is Cluster?
30. Cluster vs Worker Threads?

---

# 138. Five Questions You Absolutely Must Nail

## 1. What is backpressure?

Say:

> Backpressure is the mechanism used when the producer generates data faster than the consumer can handle it. Node streams slow or pause the producer when the writable buffer fills and resume it when the consumer drains.

---

## 2. Why use stream instead of readFile?

Say:

> `readFile` buffers the whole file before processing, while streams process it in chunks, reducing memory usage and enabling backpressure. Streams are therefore much better for large files.

---

## 3. Worker Threads vs libuv pool?

Say:

> The libuv pool is internal and handles certain native async tasks like filesystem and crypto operations. Worker Threads are explicitly created by the application to execute CPU-heavy JavaScript in parallel.

---

## 4. Worker Threads vs child process?

Say:

> Worker Threads are threads within the same process and can share memory. Child processes are independent OS processes with isolated memory and communicate through IPC or streams.

---

## 5. How would you process a huge CSV?

Say:

> I would stream the file, parse rows incrementally, validate them, use bounded batches for database inserts, respect backpressure, limit concurrency, and handle malformed rows and failures without loading the whole file into memory.

---

# 139. Final Mental Model

```text
                 LARGE DATA

File / Network
     |
     v
Readable Stream
     |
     v
Buffer Chunks
     |
     v
Transform / Parser
     |
     v
Writable Destination

Backpressure:
consumer slow
=> producer slows
```

And:

```text
              CPU-HEAVY WORK

Main Event Loop
      |
      | DO NOT BLOCK
      v
Worker Pool / Worker Threads
      |
      v
CPU computation
      |
      v
Result back to main thread
```

And:

```text
Need separate executable?
=> child_process

Need many Node server instances?
=> cluster / process manager / containers

Need large I/O?
=> streams

Need CPU parallelism?
=> Worker Threads
```

---

# 140. Final 2-Minute Summary

```text
Buffer
= raw binary bytes

Stream
= data over time in chunks

Readable
= produces data

Writable
= consumes data

Duplex
= read + write

Transform
= transforms input to output

Backpressure
= slow producer when consumer cannot keep up

highWaterMark
= stream buffering threshold

readFile
= whole file, async

readFileSync
= whole file + blocks event loop

createReadStream
= incremental/chunked

pipeline
= safer connected stream handling

Worker Threads
= CPU-heavy JavaScript

libuv thread pool
= internal native async work

child_process
= separate OS process

spawn
= streaming command output

exec
= buffered command output

fork
= Node child process + IPC

Cluster
= multiple Node processes

Most important rule:
Do not block the event loop.
```

---

# 141. Before Moving to Hour 4

You should now be able to explain, without looking:

1. Buffer
2. Streams
3. 4 stream types
4. Backpressure
5. highWaterMark
6. pipe vs pipeline
7. readFile vs stream
8. async fs vs sync fs
9. huge CSV architecture
10. Worker Threads
11. libuv pool vs Worker Threads
12. child_process
13. spawn vs exec
14. Cluster
15. Cluster vs Worker Threads

If these are clear, Hour 3 is complete.
