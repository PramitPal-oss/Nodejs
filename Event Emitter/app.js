// Using Native events from nodejs
const EventEmitter = require("events");

class Emiter extends EventEmitter { }

const myE = new Emiter();

myE.on("foo", () => {
  console.log("My event emitter is firing !!");
});

myE.once("bar", (a, b) => {
  return a + b;
});

myE.emit("bar", 4, 10);

myE.emit("foo");


// Making my own event emitter class

class EventEmitter {
  constructor() {
    this.listners = {};
  }

  #addEventListner(eventName, fn) {
    this.listners[eventName] = this.listners[eventName] || [];
    this.listners[eventName].push(fn);
    return this;
  }

  on(eventName, fn) {
    return this.#addEventListner(eventName, fn);
  }

  emit(eventName, ...args) {
    const allListners = this.listners[eventName];
    if (!allListners) return false;
    allListners.forEach((fn) => {
      fn(...args);
    });
  }

  once(eventName, listener) {
    const wrapper = (...args) => {
      listener(...args);
      this.#off(eventName, wrapper);
    };
    this.on(eventName, wrapper);
  }

  #off(eventName, listner) {
    if (!this.listners[eventName]) return false;
    this.listners[eventName] = this.listners[eventName].filter(
      (l) => l !== listner,
    );
    delete this.listners[eventName];
  }

  listenerCount(eventName) {
    let fns = this.listners[eventName] || [];
    return fns.length;
  }

  rawListeners(eventName) {
    return this.listners[eventName];
  }
}

const data = new EventEmitter();
data.on("click", (s) => {
  console.log("clicked here " + s);
});

data.on("click", (s) => {
  console.log("clicked here 2 " + s);
});

data.on("chunk", () => {
  console.log("chunk here 2");
});

data.once("add", (a, b) => {
  console.log(a + b);
});

data.emit("click", "Test");
data.emit("add", 4, 10);
console.log(data);
