# Node.js Interview Revision — Hour 1
## Node Internals: V8, libuv, Event Loop, Microtasks, Thread Pool & Concurrency

> Goal: After studying this note, you should be able to explain **how Node.js actually works internally**, not just repeat definitions.

---

# 1. The Big Picture: What Exactly Is Node.js?

Node.js is a **JavaScript runtime**.

JavaScript itself is just a programming language. By itself, JavaScript does not know how to:

- read a file,
- open a network socket,
- create an HTTP server,
- access the operating system,
- schedule timers,
- create processes.

Node.js gives JavaScript these capabilities.

A useful mental model is:

```text
Your JavaScript
      |
      v
+-------------------+
|        V8         |
| Executes JS code  |
+-------------------+
      |
      v
+-------------------+
|      Node.js      |
| C/C++ bindings    |
| Built-in APIs     |
+-------------------+
      |
      v
+-------------------+
|       libuv       |
| Event loop        |
| Thread pool       |
| Async I/O         |
+-------------------+
      |
      v
+-------------------+
| Operating System  |
| Network / Disk    |
+-------------------+
```

Node.js is therefore **much more than V8**.

V8 executes JavaScript.

Node.js provides runtime APIs.

libuv provides a large part of Node's asynchronous I/O infrastructure.

The operating system performs many low-level operations.

---

# 2. What Is V8?

V8 is the JavaScript engine created by Google.

It is used by Chrome and Node.js.

Its main job is:

> Take JavaScript code and execute it efficiently.

Example:

```js
const a = 10;
const b = 20;

console.log(a + b);
```

V8 is responsible for understanding and executing this JavaScript.

## What V8 does

V8 handles things such as:

- parsing JavaScript,
- compiling JavaScript,
- executing JavaScript,
- managing the JavaScript heap,
- garbage collection,
- optimization of frequently executed code.

A simplified flow:

```text
JavaScript Source
       |
       v
Parser
       |
       v
AST
(Abstract Syntax Tree)
       |
       v
Bytecode
       |
       v
Execution
       |
       v
Optimized Machine Code
when beneficial
```

You do **not** need to describe every compiler component unless the interviewer asks for deeper V8 internals.

For a normal Node.js interview, this answer is enough:

> V8 is the JavaScript engine used by Node.js. It parses, compiles, optimizes, and executes JavaScript and manages JavaScript memory and garbage collection.

---

# 3. Does V8 Handle File I/O and Network I/O?

No.

This distinction is extremely important.

Suppose you write:

```js
const fs = require("fs");

fs.readFile("data.txt", "utf8", (err, data) => {
  console.log(data);
});
```

V8 can execute the JavaScript function calls.

But V8 itself does not directly perform the asynchronous file read.

Node's native code, libuv, and the operating system are involved.

Think:

```text
JavaScript
   |
   v
V8 executes fs.readFile(...)
   |
   v
Node native binding
   |
   v
libuv / OS
   |
   v
file operation finishes
   |
   v
callback becomes ready
   |
   v
event loop eventually runs callback
```

---

# 4. What Is libuv?

libuv is a C library used by Node.js.

Its responsibilities include:

- event loop,
- asynchronous I/O abstractions,
- thread pool,
- filesystem operations,
- DNS-related operations,
- TCP/UDP handling support,
- timers,
- process handling,
- cross-platform OS abstraction.

Node.js runs on:

- Linux,
- Windows,
- macOS.

Operating systems expose different low-level APIs.

libuv gives Node a common interface.

For example, internally the implementation may involve different mechanisms on different operating systems, while Node can expose the same JavaScript API.

## Interview answer

> libuv is a native C library used by Node.js for the event loop and asynchronous I/O infrastructure. It also provides a worker-thread pool for operations that cannot be efficiently handled through the operating system's asynchronous event mechanisms.

---

# 5. Why Is libuv Written in C?

Because libuv needs low-level operating system access.

C is suitable for:

- system calls,
- networking,
- threads,
- memory management,
- OS APIs,
- low-level portability.

But do not explain it as:

> "C has pointers, therefore Node needs libuv."

Pointers are not the primary reason.

A better explanation is:

> libuv is written in C because Node needs a portable, efficient native layer that can communicate directly with operating-system APIs for networking, file handling, timers, threads, and process management.

---

# 6. Is Node.js Single-Threaded?

This question is often answered incorrectly.

The best answer is:

> JavaScript execution in a normal Node.js process primarily happens on one main thread, but Node.js itself is not purely single-threaded.

Node may involve:

- the main JavaScript thread,
- libuv worker-pool threads,
- operating-system threads,
- V8 internal threads,
- Worker Threads if your application creates them.

So when people say:

> Node.js is single-threaded

what they usually mean is:

> Your JavaScript callbacks normally execute one at a time on the main event-loop thread.

---

# 7. Why Can Node Handle Many Requests If JavaScript Is Single-Threaded?

Because most backend work is **I/O-bound**, not CPU-bound.

Imagine 10,000 users call your API.

Each request might perform:

```text
Request
  |
  +--> database query
  +--> Redis query
  +--> another API request
  +--> file read
```

Node does not sit and synchronously wait for each operation.

Instead:

```text
Request A -> start DB operation ----+
                                    |
Request B -> start network call ----|---- Node can continue
                                    |
Request C -> start another I/O -----+
```

When an operation finishes, its callback or Promise continuation becomes eligible to run.

This gives Node excellent concurrency for I/O-heavy applications.

---

# 8. Concurrency vs Parallelism

These terms are different.

## Concurrency

Multiple tasks make progress during overlapping periods.

Example:

```text
Task A starts
Task A waits for DB

Task B starts
Task B waits for API

DB returns
Task A continues

API returns
Task B continues
```

One JavaScript thread can manage this because much of the time tasks are waiting.

## Parallelism

Multiple tasks literally execute at the same time on different CPU cores/threads.

Example:

```text
CPU Core 1 -> Task A
CPU Core 2 -> Task B
```

Node's main event loop mainly gives you **concurrency**.

For true JavaScript CPU parallelism, Node can use:

```text
worker_threads
```

or multiple processes.

---

# 9. Synchronous vs Asynchronous Code

## Synchronous

```js
const fs = require("fs");

const data = fs.readFileSync("large.txt", "utf8");

console.log(data);
console.log("finished");
```

The main thread waits until the file operation completes.

During that period, other JavaScript cannot run on that event-loop thread.

## Asynchronous

```js
const fs = require("fs");

fs.readFile("large.txt", "utf8", (err, data) => {
  console.log(data);
});

console.log("finished");
```

Likely output:

```text
finished
<file contents>
```

Why?

Because Node starts the asynchronous operation and continues executing the remaining JavaScript.

---

# 10. Blocking vs Non-Blocking

Blocking means the main JavaScript thread cannot continue doing useful work.

Example:

```js
const start = Date.now();

while (Date.now() - start < 10000) {
  // block CPU for 10 seconds
}

console.log("finished");
```

During those 10 seconds:

```text
No request callback
No timer callback
No Promise continuation
No event-loop progress
```

can run on the main thread.

This is one of the biggest performance dangers in Node.js.

---

# 11. What Is the Event Loop?

The event loop is the mechanism that allows Node.js to coordinate:

- JavaScript execution,
- callbacks,
- timers,
- network events,
- asynchronous I/O completions.

A simple mental model:

```text
Run JavaScript
      |
      v
Start async operations
      |
      v
Operations complete later
      |
      v
Callbacks become ready
      |
      v
Event loop decides when to execute them
      |
      v
JavaScript callback runs
```

Remember:

> The event loop does not make JavaScript execute multiple callbacks at the same time on the same main thread.

Callbacks still execute one by one.

---

# 12. Event Loop Phases

The commonly taught Node.js event-loop phases are:

```text
┌───────────────────────────────┐
│           timers              │
├───────────────────────────────┤
│      pending callbacks        │
├───────────────────────────────┤
│       idle, prepare           │
├───────────────────────────────┤
│            poll               │
├───────────────────────────────┤
│            check              │
├───────────────────────────────┤
│       close callbacks         │
└───────────────────────────────┘
```

The important interview phases are:

1. Timers
2. Pending callbacks
3. Poll
4. Check
5. Close callbacks

`idle` and `prepare` are mostly internal.

---

# 13. Timers Phase

This phase handles timer callbacks whose threshold has been reached.

Examples:

```js
setTimeout(() => {
  console.log("timeout");
}, 1000);

setInterval(() => {
  console.log("interval");
}, 1000);
```

Important:

```js
setTimeout(fn, 1000);
```

does **not** mean:

> run exactly after 1000 ms.

It means approximately:

> Do not run before the timer threshold; execute when the event loop gets a chance after it becomes eligible.

Example:

```js
setTimeout(() => {
  console.log("timer");
}, 1000);

const start = Date.now();

while (Date.now() - start < 5000) {}

console.log("done");
```

The timer cannot run at the 1-second mark because JavaScript is blocked for 5 seconds.

Output will be roughly:

```text
done
timer
```

---

# 14. Pending Callbacks Phase

This phase executes certain system-level I/O callbacks deferred from previous loop iterations.

For most application-level interviews, you usually do not need a deep implementation-level explanation.

Safe answer:

> The pending-callback phase handles certain I/O callbacks deferred by the system to the next event-loop iteration.

---

# 15. Poll Phase

The poll phase is one of the most important phases.

Its job includes:

- retrieving new I/O events,
- executing I/O callbacks,
- potentially waiting for new I/O if there is nothing else immediately scheduled.

Examples of events that may eventually result in poll callbacks include networking and other I/O.

Conceptually:

```text
Network response arrives
       |
       v
I/O event becomes ready
       |
       v
poll phase
       |
       v
callback executes
```

---

# 16. Check Phase

The check phase executes:

```js
setImmediate(...)
```

callbacks.

Example:

```js
setImmediate(() => {
  console.log("immediate");
});
```

`setImmediate()` is specifically associated with the check phase.

---

# 17. Close Callbacks Phase

This phase handles certain close events.

Example:

```js
socket.on("close", () => {
  console.log("socket closed");
});
```

---

# 18. What Is a Tick / Event Loop Iteration?

One complete movement through the event-loop processing stages is often informally called an event-loop iteration or tick.

Do not over-focus on the word "tick" because `process.nextTick()` has special behavior and is not simply "the next event-loop phase."

---

# 19. Microtasks

This is a critical interview topic.

There are high-priority queues that run outside the normal event-loop phase queues.

In Node.js, pay special attention to:

```text
process.nextTick()
Promise callbacks / queueMicrotask()
```

A useful simplified execution order is:

```text
Current JavaScript finishes
        |
        v
process.nextTick callbacks
        |
        v
Promise microtasks / queueMicrotask
        |
        v
continue event-loop work
```

---

# 20. process.nextTick()

Example:

```js
console.log("A");

process.nextTick(() => {
  console.log("B");
});

console.log("C");
```

Output:

```text
A
C
B
```

Why?

The `nextTick` callback waits until the current JavaScript stack finishes.

Then Node processes the nextTick queue.

---

# 21. Promise Microtasks

Example:

```js
console.log("A");

Promise.resolve().then(() => {
  console.log("B");
});

console.log("C");
```

Output:

```text
A
C
B
```

The Promise callback is scheduled as a microtask.

---

# 22. process.nextTick() vs Promise

Example:

```js
console.log("start");

Promise.resolve().then(() => {
  console.log("promise");
});

process.nextTick(() => {
  console.log("nextTick");
});

console.log("end");
```

Typical Node.js output:

```text
start
end
nextTick
promise
```

Interview point:

> Node gives `process.nextTick()` callbacks priority over normal Promise microtasks when draining these queues after the current operation.

---

# 23. Classic Interview Question

Predict the output:

```js
console.log("1");

setTimeout(() => {
  console.log("2");
}, 0);

Promise.resolve().then(() => {
  console.log("3");
});

process.nextTick(() => {
  console.log("4");
});

console.log("5");
```

Output:

```text
1
5
4
3
2
```

Explanation:

### Step 1

Synchronous code runs:

```text
1
5
```

### Step 2

Current stack becomes empty.

Node processes:

```text
nextTick queue
```

so:

```text
4
```

### Step 3

Promise microtasks run:

```text
3
```

### Step 4

The timer callback executes once the event loop reaches the appropriate timer processing point and the timer is eligible:

```text
2
```

Final:

```text
1
5
4
3
2
```

---

# 24. setTimeout(fn, 0) vs setImmediate(fn)

Many candidates say:

> `setImmediate` always runs before `setTimeout(0)`.

That is wrong.

The order can depend on the context.

At top level:

```js
setTimeout(() => {
  console.log("timeout");
}, 0);

setImmediate(() => {
  console.log("immediate");
});
```

The exact ordering should not be treated as universally guaranteed merely from reading this code.

However, inside an I/O callback, `setImmediate()` is commonly expected to run before a zero-delay timer scheduled from that callback.

Example:

```js
const fs = require("fs");

fs.readFile(__filename, () => {
  setTimeout(() => {
    console.log("timeout");
  }, 0);

  setImmediate(() => {
    console.log("immediate");
  });
});
```

You should expect:

```text
immediate
timeout
```

Reason:

```text
I/O callback
    |
    v
poll phase
    |
    v
check phase
    |
    v
setImmediate
```

The timer waits for later timer processing.

---

# 25. Dangerous process.nextTick() Recursion

Example:

```js
function repeat() {
  process.nextTick(repeat);
}

repeat();
```

This can starve the event loop.

Why?

Each `nextTick()` schedules another `nextTick()`.

Node keeps processing them before moving forward to normal event-loop work.

As a result:

```text
timers
I/O
setImmediate
```

may be delayed badly.

Interview term:

> Event-loop starvation.

---

# 26. What Is the libuv Thread Pool?

libuv has a worker-thread pool.

The default pool size is commonly **4 threads** unless configured otherwise.

It is used for certain operations that cannot simply use the operating system's non-blocking event mechanism in the same way networking can.

Common examples include:

- many filesystem operations,
- some DNS operations such as `dns.lookup`,
- certain crypto operations,
- certain zlib/compression operations.

Mental model:

```text
Main JS Thread
     |
     | fs.readFile()
     v
libuv
     |
     v
Worker Pool
+---------+---------+---------+---------+
| Worker1 | Worker2 | Worker3 | Worker4 |
+---------+---------+---------+---------+
     |
     v
operation finishes
     |
     v
completion becomes available
     |
     v
event loop
     |
     v
JS callback executes
```

---

# 27. Does Every Async Operation Use the Thread Pool?

No.

This is a very common interview trap.

For example, networking usually relies heavily on operating-system asynchronous I/O mechanisms rather than occupying a libuv worker-pool thread for the entire wait.

Conceptually:

```text
HTTP / TCP networking
        |
        v
Operating-system event mechanism
        |
        v
libuv observes readiness
        |
        v
event loop
```

Whereas many filesystem operations may use the worker pool.

So never say:

> Every asynchronous Node operation runs on the thread pool.

Wrong.

---

# 28. Typical Operations Using the Thread Pool

Common categories include:

## File System

```js
fs.readFile()
fs.writeFile()
fs.stat()
```

Many asynchronous filesystem APIs use the pool.

## Crypto

Operations such as:

```js
crypto.pbkdf2()
```

may use the pool.

## Compression

Some zlib operations use the pool.

## DNS

Be careful here.

```js
dns.lookup()
```

may use the thread pool because it can depend on system name resolution.

Other DNS APIs may use different mechanisms.

---

# 29. Why Thread Pool Size Can Matter

Suppose you start many expensive `crypto.pbkdf2()` operations.

If the pool has only a few worker threads:

```text
Task 1 -> Worker 1
Task 2 -> Worker 2
Task 3 -> Worker 3
Task 4 -> Worker 4

Task 5 -> WAIT
Task 6 -> WAIT
Task 7 -> WAIT
```

This can create queueing.

Node supports configuration through:

```bash
UV_THREADPOOL_SIZE=8 node app.js
```

But:

> Increasing the pool size blindly does not automatically improve performance.

More threads can introduce:

- CPU contention,
- memory overhead,
- context switching.

---

# 30. Thread Pool Is NOT the Same as Worker Threads

This is important.

## libuv thread pool

Used internally by Node/libuv for certain native asynchronous operations.

You normally do not execute your JavaScript application logic directly on these pool threads.

## Worker Threads

A Node.js API that lets you run JavaScript in additional threads.

Example:

```js
const { Worker } = require("worker_threads");
```

Worker Threads are useful for CPU-heavy JavaScript.

---

# 31. CPU-Bound vs I/O-Bound Work

## I/O-bound

Most time is spent waiting for external resources.

Examples:

```text
database
Redis
HTTP API
disk
network
```

Node is excellent for these workloads.

## CPU-bound

Most time is spent doing calculations.

Examples:

```text
large loops
image processing
video processing
complex compression
scientific calculations
large data transformation
```

CPU-heavy JavaScript can block the event loop.

---

# 32. Why CPU-Heavy Code Is Bad on the Main Thread

Example:

```js
app.get("/calculate", (req, res) => {
  let result = 0;

  for (let i = 0; i < 10_000_000_000; i++) {
    result += i;
  }

  res.json({ result });
});
```

While this runs:

```text
Request A -> CPU loop
              |
              | MAIN THREAD BLOCKED
              |
Request B ----X waiting
Request C ----X waiting
Request D ----X waiting
```

Even though Node can handle concurrent I/O, synchronous CPU work still blocks JavaScript execution.

Possible solutions include:

- Worker Threads,
- child processes,
- multiple application instances,
- job queues,
- moving heavy processing to separate services.

---

# 33. Worker Threads

Worker Threads allow JavaScript code to run in additional threads.

Conceptually:

```text
Main Thread
    |
    +------> Worker Thread 1
    |
    +------> Worker Thread 2
```

This is useful for CPU-intensive work.

Example use cases:

- image transformations,
- heavy calculations,
- parsing huge data,
- CPU-intensive encryption,
- computational algorithms.

Do **not** use Worker Threads just because you are:

```text
calling an API
querying PostgreSQL
querying MongoDB
waiting for Redis
```

Those are primarily I/O operations.

---

# 34. Worker Threads vs child_process vs Cluster

## Worker Threads

```text
Same Node process
Separate JS execution threads
Can share memory using SharedArrayBuffer
Useful for CPU-heavy tasks
```

## child_process

```text
Separate OS process
Separate memory
Can run another program or Node process
Communication via IPC/stdin/stdout/etc.
```

## Cluster

Historically/common Node mechanism for running multiple Node processes so a server can utilize multiple CPU cores.

Conceptually:

```text
            Incoming requests
                   |
                   v
            Multiple processes
          /        |        \
      Worker 1  Worker 2  Worker 3
```

In modern production systems, multiple Node instances may also be managed externally using:

- containers,
- Kubernetes,
- PM2,
- process managers,
- orchestration platforms.

---

# 35. Event Loop + HTTP Request Example

Suppose:

```js
app.get("/users", async (req, res) => {
  const users = await db.query("SELECT * FROM users");

  res.json(users);
});
```

What happens conceptually?

```text
HTTP Request
     |
     v
event loop runs request callback
     |
     v
db.query()
     |
     v
database/network I/O starts
     |
     v
async function yields
     |
     v
main JS thread can process other requests
     |
     v
DB response arrives
     |
     v
Promise continuation becomes ready
     |
     v
event loop gets chance to run JS
     |
     v
res.json(users)
```

This is the fundamental reason Node can serve many concurrent requests.

---

# 36. What Does `await` Really Do?

Many candidates mistakenly believe:

> await blocks the Node.js thread.

Normally, `await` does **not** synchronously block the entire event loop.

Example:

```js
const users = await db.query(...);
```

Conceptually, the async function pauses.

The main event loop can continue processing other work.

When the Promise settles, continuation of the async function is scheduled through the microtask mechanism.

So:

```text
await
```

means:

> Pause this async function until the Promise settles.

It does **not** normally mean:

> Freeze the entire Node process.

---

# 37. But `await` Can Still Hurt Performance

Example:

```js
const user = await getUser();
const products = await getProducts();
const orders = await getOrders();
```

If all three operations are independent, you are unnecessarily making them sequential.

Better:

```js
const [user, products, orders] = await Promise.all([
  getUser(),
  getProducts(),
  getOrders(),
]);
```

Now the I/O operations can overlap.

Important:

> `Promise.all()` does not create CPU threads.

It coordinates Promises that may represent asynchronous concurrent work.

---

# 38. Call Stack

JavaScript function calls are tracked using a call stack.

Example:

```js
function three() {
  console.log("hello");
}

function two() {
  three();
}

function one() {
  two();
}

one();
```

Conceptually:

```text
one()
  |
  v
two()
  |
  v
three()
  |
  v
console.log()
```

The stack grows as functions call other functions and shrinks as they return.

Callbacks cannot execute on the main JS thread while synchronous JavaScript is still occupying it.

---

# 39. Event Loop Does Not Interrupt Running JavaScript

This is a key idea.

Suppose:

```js
setTimeout(() => {
  console.log("timer");
}, 0);

for (let i = 0; i < 10_000_000_000; i++) {}

console.log("loop finished");
```

The timer may already be eligible, but Node does not suddenly interrupt the running loop to execute the callback.

The synchronous JavaScript must finish first.

Then:

```text
event loop can continue
```

---

# 40. Understanding Callback Queues

A simplified model:

```text
                +-----------------------+
                |   JavaScript Stack    |
                +-----------------------+
                           |
                           v
                stack becomes empty
                           |
                           v
              +--------------------------+
              | process.nextTick queue   |
              +--------------------------+
                           |
                           v
              +--------------------------+
              | Promise microtask queue  |
              +--------------------------+
                           |
                           v
              +--------------------------+
              | Event-loop phase queues  |
              +--------------------------+
```

This model is simplified but excellent for interviews.

---

# 41. Full Example

Predict:

```js
console.log("A");

setTimeout(() => {
  console.log("B");
}, 0);

setImmediate(() => {
  console.log("C");
});

Promise.resolve().then(() => {
  console.log("D");
});

process.nextTick(() => {
  console.log("E");
});

console.log("F");
```

Guaranteed early order:

```text
A
F
E
D
```

For:

```text
B
C
```

do not make a universal top-level guarantee purely based on the source ordering.

The key interview point is:

```text
synchronous
   ->
nextTick
   ->
Promise microtasks
   ->
event-loop callbacks
```

---

# 42. Another Interview Example

```js
setTimeout(() => {
  console.log("timeout 1");

  Promise.resolve().then(() => {
    console.log("promise inside timeout");
  });
}, 0);

setTimeout(() => {
  console.log("timeout 2");
}, 0);
```

The Promise microtask created by the first callback is processed before Node moves too far ahead with subsequent callback work.

The useful interview idea:

> Microtasks are drained after JavaScript callback execution points before normal event-loop work continues.

You do not need to memorize obscure version-specific implementation details unless the interviewer pushes deeply.

---

# 43. Network I/O: Why Node Scales Well

Imagine 5,000 sockets.

A thread-per-request model might conceptually create many threads.

Node's normal networking model can instead look like:

```text
One event-loop thread
        |
        +--> socket A waiting
        +--> socket B waiting
        +--> socket C waiting
        +--> socket D waiting
        +--> ...
```

The operating system reports which sockets are ready.

Then Node processes their callbacks.

This avoids needing one JavaScript thread per connection.

---

# 44. Does Node Process Only One Request at a Time?

No.

This question tests the difference between:

```text
request concurrency
```

and

```text
JavaScript execution
```

Node can have thousands of requests in progress concurrently.

But JavaScript callbacks on one event-loop thread execute one at a time.

Example:

```text
Request A -> waiting for DB
Request B -> waiting for API
Request C -> waiting for Redis
Request D -> executing small JS callback
```

All requests are active concurrently.

Only one main-thread JavaScript callback is executing at that exact moment.

---

# 45. What Happens When 10,000 Requests Arrive?

A strong interview answer:

> Node accepts connections through its networking stack and delegates waiting I/O to the operating system or appropriate native mechanisms. The event loop processes ready events and executes JavaScript callbacks one at a time. Because Node does not synchronously wait for each I/O operation, it can maintain a large number of concurrent connections. The real limits then depend on CPU usage, memory, database capacity, connection pools, downstream services, application design, and OS resource limits.

Do not simply say:

> Event loop handles all 10,000.

That answer is too shallow.

---

# 46. What Happens If All 10,000 Requests Do Heavy CPU Work?

Then Node can perform badly.

Example:

```text
10,000 requests
      |
      v
CPU-heavy JS
      |
      v
main event loop overloaded
      |
      v
latency increases
      |
      v
requests queue up
```

For CPU-heavy work, consider:

- Worker Threads,
- multiple Node processes,
- job queues,
- dedicated compute services.

---

# 47. Event Loop Lag

If JavaScript keeps the main thread busy for too long, the event loop cannot process callbacks on time.

This delay is often referred to as event-loop lag.

Symptoms:

- APIs become slow,
- timers execute late,
- health checks may fail,
- throughput decreases.

Common causes:

- huge loops,
- synchronous filesystem methods,
- expensive JSON parsing,
- CPU-heavy transformations,
- catastrophic regular expressions,
- excessive synchronous crypto.

---

# 48. Sync APIs in Servers

Examples:

```js
fs.readFileSync()
fs.writeFileSync()
crypto.pbkdf2Sync()
```

These can block the event loop.

That does not mean synchronous APIs are always forbidden.

They can be fine in:

- startup scripts,
- CLI applications,
- build scripts,
- one-time initialization.

But inside hot request paths, use them carefully.

---

# 49. EventEmitter Is Not the Event Loop

Another interview trap.

`EventEmitter`:

```js
const EventEmitter = require("events");
```

is a Node API for implementing event-driven application logic.

Example:

```js
emitter.on("order-created", handler);
emitter.emit("order-created", order);
```

This is not the same thing as the libuv event loop.

`emit()` is normally synchronous unless the listener itself starts async work.

Example:

```js
emitter.on("test", () => {
  console.log("listener");
});

console.log("A");
emitter.emit("test");
console.log("B");
```

Output:

```text
A
listener
B
```

---

# 50. Callback Does Not Automatically Mean Async

Example:

```js
[1, 2, 3].forEach((value) => {
  console.log(value);
});
```

The callback here is synchronous.

Likewise:

```js
emitter.emit(...)
```

can synchronously execute listeners.

Therefore:

> callback != asynchronous.

A callback is just a function passed to another function.

Whether it runs synchronously or asynchronously depends on the API.

---

# 51. Node Architecture Summary

Keep this mental diagram:

```text
                   APPLICATION
                       |
                       v
                JavaScript Code
                       |
                       v
                 +-----------+
                 |    V8     |
                 +-----------+
                       |
                       v
                 Node.js APIs
                       |
                Native Bindings
                       |
                       v
                 +-----------+
                 |   libuv   |
                 +-----------+
                 /     |      \
                /      |       \
               v       v        v
         Event Loop  Thread   OS Async
                      Pool     Mechanisms
                       |
                       v
                 File/Crypto/etc.
```

---

# 52. Strong Interview Answer: "How Does Node.js Work?"

A polished answer:

> Node.js is a JavaScript runtime built around the V8 engine. V8 executes the JavaScript code, while Node adds server-side APIs and native bindings. For asynchronous I/O, Node relies heavily on libuv, which provides the event loop, cross-platform I/O abstractions, and a worker pool for certain operations such as many filesystem and crypto tasks. Networking can usually be handled using operating-system asynchronous event mechanisms. When asynchronous work completes, its callback or Promise continuation becomes ready, and the event loop eventually executes the related JavaScript on the main thread. This lets Node handle many concurrent I/O operations efficiently without having one JavaScript thread per request.

Memorize the idea, not every word.

---

# 53. Strong Interview Answer: "Why Is Node Fast?"

Do not say:

> Because it is single-threaded.

Instead:

> Node performs well for I/O-heavy workloads because it uses non-blocking I/O and an event-driven architecture. While one operation waits for a database, network, or filesystem result, the main thread can continue handling other work. V8 is also a highly optimized JavaScript engine. However, CPU-heavy synchronous JavaScript can block the event loop, so Node is not automatically ideal for every workload.

---

# 54. Strong Interview Answer: "Is Node Multithreaded?"

> JavaScript in a normal Node process primarily executes on one event-loop thread, but the Node runtime itself uses multiple threads internally. libuv has a worker pool for certain native operations, V8 uses internal threads, the OS may use its own threads, and developers can explicitly create Worker Threads. So calling the entire Node runtime purely single-threaded is an oversimplification.

---

# 55. Strong Interview Answer: "Event Loop vs Thread Pool"

> The event loop runs on the main Node thread and decides when ready JavaScript callbacks can execute. The libuv thread pool contains native worker threads used for certain asynchronous operations such as many filesystem, crypto, compression, and some DNS operations. When those operations finish, their completion is reported back and the related JavaScript callback eventually runs on the main event-loop thread.

---

# 56. Strong Interview Answer: "Does Async Mean Another Thread?"

No.

> Asynchronous means the caller does not have to block until an operation completes. The implementation might use an OS asynchronous mechanism, a thread pool, another process, hardware, or another service. Async does not automatically mean a new thread.

---

# 57. Strong Interview Answer: "What Happens With an API Call?"

For:

```js
const response = await fetch("https://api.example.com/users");
```

Conceptually:

```text
JS initiates request
       |
       v
networking handled outside normal synchronous JS execution
       |
       v
async function yields
       |
       v
Node handles other work
       |
       v
network response becomes ready
       |
       v
Promise settles
       |
       v
microtask runs continuation
       |
       v
JS continues after await
```

---

# 58. Common Interview Traps

## Trap 1

**"Node.js is single-threaded."**

Better:

```text
Main JavaScript execution is generally single-threaded.
Node runtime itself is not only one thread.
```

---

## Trap 2

**"All async operations use the thread pool."**

Wrong.

Networking commonly uses OS async mechanisms.

---

## Trap 3

**"`setTimeout(fn, 0)` runs immediately."**

Wrong.

It runs only after it becomes eligible and the event loop gets a chance.

---

## Trap 4

**"`await` blocks Node."**

Wrong in the usual asynchronous case.

It pauses the current async function, not the entire event loop.

---

## Trap 5

**"`Promise.all()` creates threads."**

Wrong.

It coordinates concurrent Promises.

---

## Trap 6

**"`setImmediate` always runs before `setTimeout(0)`."**

Wrong as a universal statement.

Context matters.

---

## Trap 7

**"Callbacks are asynchronous."**

Not necessarily.

Callbacks can be synchronous.

---

## Trap 8

**"EventEmitter is the event loop."**

Wrong.

They are separate concepts.

---

# 59. Interview Code Challenge 1

What is the output?

```js
console.log("start");

setTimeout(() => {
  console.log("timeout");
}, 0);

process.nextTick(() => {
  console.log("nextTick");
});

Promise.resolve().then(() => {
  console.log("promise");
});

console.log("end");
```

Answer:

```text
start
end
nextTick
promise
timeout
```

---

# 60. Interview Code Challenge 2

```js
async function test() {
  console.log("A");

  await Promise.resolve();

  console.log("B");
}

console.log("C");

test();

console.log("D");
```

Output:

```text
C
A
D
B
```

Explanation:

`test()` runs synchronously until the `await`.

After the Promise settles, continuation:

```js
console.log("B");
```

is processed as a microtask.

---

# 61. Interview Code Challenge 3

```js
console.log("A");

setTimeout(() => {
  console.log("B");
}, 0);

for (let i = 0; i < 3_000_000_000; i++) {}

console.log("C");
```

Output:

```text
A
C
B
```

The timer cannot interrupt synchronous JavaScript.

---

# 62. Interview Code Challenge 4

```js
Promise.resolve().then(() => {
  console.log("promise 1");

  process.nextTick(() => {
    console.log("nextTick inside promise");
  });
});

Promise.resolve().then(() => {
  console.log("promise 2");
});
```

Do not try to build your entire interview around memorizing extremely tricky nested queue puzzles.

The important conceptual lesson is:

- `nextTick` and Promise jobs have special queue semantics,
- they are processed around JavaScript callback boundaries,
- excessive `nextTick` usage can starve normal event-loop phases.

If an interviewer asks very implementation-specific ordering, reason carefully instead of confidently guessing.

---

# 63. What Is Event-Driven Architecture?

Node heavily uses events.

Instead of:

```text
wait until something happens
```

the architecture is often:

```text
register what should happen
        |
        v
continue working
        |
        v
event occurs
        |
        v
execute handler
```

Example:

```js
server.on("request", (req, res) => {
  // handle request
});
```

This style works naturally with asynchronous I/O.

---

# 64. How HTTP Server Fits In

Example:

```js
const http = require("http");

const server = http.createServer((req, res) => {
  res.end("hello");
});

server.listen(3000);
```

Conceptually:

```text
server.listen()
     |
     v
OS listens on socket
     |
     v
request arrives
     |
     v
libuv/Node observes event
     |
     v
request callback runs on JS thread
```

---

# 65. How Database Calls Fit In

Database clients generally use network sockets.

Example:

```js
await pool.query("SELECT * FROM users");
```

Node sends data through the network.

While PostgreSQL processes the query:

```text
Node is not supposed to spin and wait.
```

The JavaScript async function yields.

Other requests can execute.

When the database result arrives, the relevant Promise resolves and JavaScript continues later.

---

# 66. Node Does Not Make the Database Query Faster

This distinction matters.

Node concurrency means:

```text
Node does not waste the main JS thread while waiting.
```

It does not mean:

```text
PostgreSQL becomes infinitely fast.
```

Your backend still depends on:

- connection-pool size,
- database CPU,
- indexes,
- locks,
- query complexity,
- network latency.

---

# 67. Why Connection Pools Matter

Suppose:

```text
10,000 requests
```

arrive.

You should not necessarily open 10,000 new DB connections.

Instead:

```text
Node requests
     |
     v
Connection Pool
+----+----+----+----+
| C1 | C2 | C3 | C4 |
+----+----+----+----+
     |
     v
PostgreSQL
```

Requests may wait for an available connection.

This shows why Node's concurrency is only one part of system scalability.

---

# 68. Event Loop Is Not a Magical Background Thread

Another useful statement:

> The event loop is not a separate JavaScript worker that runs your callbacks in parallel.

It is the coordination mechanism around the main JavaScript execution thread.

---

# 69. How To Explain Node in One Sentence

If interviewer asks casually:

**"What is Node.js?"**

Say:

> Node.js is a JavaScript runtime built on V8 that provides server-side APIs and uses an event-driven, non-blocking I/O architecture, with libuv powering much of its event-loop and asynchronous I/O infrastructure.

---

# 70. 30-Minute Final Revision Checklist

Before ending Hour 1, make sure you can answer these without looking.

## V8

1. What is V8?
2. What does V8 do?
3. Does V8 perform Node filesystem operations?
4. What is garbage collection?

## libuv

5. What is libuv?
6. Why does Node need libuv?
7. Why is libuv native code?
8. What does the libuv thread pool do?

## Event Loop

9. What is the event loop?
10. Why does Node need it?
11. What are the major event-loop phases?
12. What happens in the timers phase?
13. What happens in poll?
14. What happens in check?
15. Where does `setImmediate()` run?
16. What does `setTimeout(0)` actually mean?

## Microtasks

17. What is a microtask?
18. What is `process.nextTick()`?
19. Promise vs nextTick?
20. Can nextTick starve the event loop?

## Concurrency

21. Node is single-threaded — true or false?
22. How can Node handle many requests?
23. Concurrency vs parallelism?
24. What is CPU-bound work?
25. What is I/O-bound work?
26. Why does CPU-heavy JS hurt Node?

## Thread Pool

27. Which operations may use libuv thread pool?
28. Does networking always use thread pool?
29. What is `UV_THREADPOOL_SIZE`?
30. Thread pool vs Worker Threads?

## Worker Threads

31. When should you use Worker Threads?
32. Should you use them for DB queries?
33. Worker Threads vs child_process?
34. What happens if one request runs a huge synchronous loop?

---

# 71. Rapid Interview Questions

Try answering these aloud.

### Q1. Why doesn't Node block when reading a file asynchronously?

Because the main JavaScript thread initiates the operation and gives control back instead of synchronously waiting. The underlying operation is handled through Node/libuv/native mechanisms, and when it completes the callback becomes eligible to run later.

---

### Q2. If Node has one main JS thread, how does it serve many users?

Because requests spend much of their time waiting for I/O. Node can start the I/O, continue processing other requests, and resume each request when its result becomes ready.

---

### Q3. If the event loop is free, is the application automatically scalable?

No.

Other bottlenecks can be:

- database,
- Redis,
- external APIs,
- connection pools,
- memory,
- CPU,
- network,
- operating-system limits.

---

### Q4. Why is a huge loop dangerous?

Because it occupies the main JavaScript thread, preventing the event loop from executing callbacks for other requests.

---

### Q5. Difference between async I/O and Worker Threads?

Async I/O helps avoid blocking while waiting for external resources.

Worker Threads provide additional JavaScript threads for CPU-heavy work.

---

### Q6. Why isn't every async task done using threads?

Modern operating systems provide efficient asynchronous event mechanisms for resources such as network sockets, allowing large numbers of connections without dedicating one thread to each wait.

---

# 72. The Mental Model You Must Remember Tomorrow

If you forget everything, remember this:

```text
                     NODE.JS

JavaScript
    |
    v
+---------+
|   V8    |
+---------+
    |
    v
Node APIs / Native bindings
    |
    v
+-----------------------+
|         libuv         |
|                       |
| Event Loop            |
| Thread Pool           |
| OS I/O integration    |
+-----------------------+
    |
    +-------------------+
    |                   |
    v                   v
OS async I/O       Worker threads
(network etc.)     (fs/crypto/etc.)
    |                   |
    +---------+---------+
              |
              v
       operation complete
              |
              v
     callback / Promise ready
              |
              v
        JavaScript executes
```

And:

```text
Synchronous JS
      |
      v
process.nextTick
      |
      v
Promise microtasks
      |
      v
Event-loop work
```

And:

```text
I/O-heavy
   -> Node is very good

CPU-heavy on main thread
   -> event loop gets blocked
   -> use appropriate parallel/offloading strategy
```

---

# 73. The 10 Answers You Absolutely Must Know

Before moving to Hour 2, say these aloud without looking:

1. **What is Node.js?**
2. **What is V8?**
3. **What is libuv?**
4. **Is Node really single-threaded?**
5. **How does Node handle concurrent requests?**
6. **What is the event loop?**
7. **What are the event-loop phases?**
8. **nextTick vs Promise vs setTimeout vs setImmediate?**
9. **What uses the libuv thread pool?**
10. **What happens when CPU-heavy code runs on the main thread?**

If you can explain those clearly with examples, your Hour 1 preparation is in good shape.

---

# 74. Final 2-Minute Interview Summary

```text
Node.js
= JavaScript runtime

V8
= executes JavaScript

libuv
= event loop + async I/O infrastructure + native worker pool

Main JS execution
= primarily one thread

Concurrency
= many operations can be in progress while JS waits for I/O

Parallelism
= multiple computations literally execute at once

Event loop
= coordinates ready callbacks/events

nextTick
= very high-priority Node queue

Promise
= microtask

setTimeout
= timer callback when threshold is reached and loop can run it

setImmediate
= check phase

Thread pool
= native worker pool for certain operations

Worker Threads
= extra JS threads for CPU-heavy work

Biggest Node danger
= blocking the event loop
```

---

## Stop Here

Do **not** jump to Hour 2 until you can explain the architecture below from memory:

```text
JavaScript
   ↓
V8
   ↓
Node APIs
   ↓
libuv / OS
   ↓
async operation completes
   ↓
event loop
   ↓
callback / Promise continuation
   ↓
JavaScript executes
```
