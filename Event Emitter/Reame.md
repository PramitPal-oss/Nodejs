<style>
*{
  font-family: 'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif;
}
</style>

### What is Event Emitter ? Why we use it ?

Event Emitter is a class that allows you to create objects that can emit events and listen for those events. It is part of the Node.js events module and is widely used for implementing the observer pattern.

**Key Functions:**

- The main methods you will interact with are:

- **on(eventName, listener):** This method allows you to register a listener function that will be called whenever the specified event is emitted.
- **emit(eventName, [...args]):** This function emits the event with the specified name and can pass arguments to the listeners.

**Why Use EventEmitter?**

Event Emitter simplifies the management of asynchronous events in Node.js applications. It enables decoupling of different parts of the application; for example, one part can emit events while another listens for them. This leads to flexible and maintainable code.
It's essential in various parts of Node.js and in many third-party libraries, providing a consistent way to work with asynchronous operations.

**Use Cases:**

- EventEmitter can be used for various scenarios, such as managing streams, handling HTTP requests, or other tasks where events are naturally emitted and managed.
- In summary, EventEmitter is a powerful tool in Node.js for event management, playing a vital role in writing scalable and maintainable applications. You will encounter its usage throughout the course, as it is foundational to many Node.js API functionalities

**2. Server Request Handling :**

The http module in Node.js uses EventEmitters to handle server events like requests and responses.

```js
const http = require('http');

const server = http.createServer((req, res) => {
  res.end('Hello, World!');
});

// Listen for the 'request' event
server.on('request', (req) => {
  console.log(`Request received for ${req.url}`);
});

server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
```

- **Use Case:** Building web servers where requests and responses are managed via events.

**3. Streaming Data:**

Streams in Node.js, like readable and writable streams, are EventEmitters. They emit events such as data, end, and error.

```js
const fs = require('fs');

const readStream = fs.createReadStream('./example.txt');

// Listen for data chunks
readStream.on('data', (chunk) => {
  console.log(`Received chunk: ${chunk}`);
});

// Listen for the end of the stream
readStream.on('end', () => {
  console.log('Stream finished.');
});
```

- **Use Case:** Reading files, handling file uploads, or streaming data over a network.

**4. Error Handling :**

EventEmitters provide a clean way to handle errors asynchronously.

```js
const EventEmitter = require('events');
const eventEmitter = new EventEmitter();

eventEmitter.on('error', (err) => {
  console.error(`An error occurred: ${err.message}`);
});

// Emit an error event
eventEmitter.emit('error', new Error('Something went wrong'));
```

- **Use Case:** Centralized error handling in an event-driven application.

**5. Inter-Module Communication :**

EventEmitters can facilitate communication between different parts of an application.

```js
const EventEmitter = require('events');
const emitter = new EventEmitter();

// Module A
function moduleA() {
  emitter.emit('data_received', { id: 1, message: 'Hello from Module A' });
}

// Module B
emitter.on('data_received', (data) => {
  console.log('Module B received data:', data);
});

moduleA();
```

- **Use Case:** Sharing data or triggering actions between modules without tight coupling.

**6. Real-Time Chat Applications :**

EventEmitters can handle events like sending and receiving messages in real-time.

```js
const EventEmitter = require('events');
const chat = new EventEmitter();

// Listen for message events
chat.on('message', (user, message) => {
  console.log(`${user}: ${message}`);
});

// Emit message events
chat.emit('message', 'Alice', 'Hello, everyone!');
chat.emit('message', 'Bob', 'Hi, Alice!');
```

- **Use Case:** Building chat rooms or collaborative tools.

**7. Task Scheduling :**

EventEmitters can help coordinate tasks, such as sending
notifications or triggering scheduled jobs.

```js
const EventEmitter = require('events');
const scheduler = new EventEmitter();

// Schedule a task
scheduler.on('task', (task) => {
  console.log(`Executing task: ${task.name}`);
});

// Emit tasks
setTimeout(() => scheduler.emit('task', { name: 'Email Reminder' }), 1000);
setTimeout(() => scheduler.emit('task', { name: 'Data Backup' }), 2000);
```

- **Use Case:** Automating workflows like reminders, backups, or notifications.

**8. Logging and Monitoring :**

EventEmitters can be used to log and monitor application behavior.

```js
const EventEmitter = require('events');
const logger = new EventEmitter();

logger.on('log', (level, message) => {
  console.log(`[${level.toUpperCase()}] - ${message}`);
});

// Emit logs
logger.emit('log', 'info', 'Application started');
logger.emit('log', 'error', 'An unexpected error occurred');
```

- **Use Case:** Implementing custom logging systems for monitoring purposes.
