# Node.js Interview Revision — Hour 2
## Async JavaScript, Promises, Express, Middleware, Error Handling, Authentication, Authorization & REST APIs

> Goal: After this hour, you should be able to explain how a real Node.js backend request travels through the application, how async code behaves, how Express middleware works, how errors are handled, and how authentication/authorization are designed.

---

# 1. The Big Picture

A normal backend request often looks like this:

```text
Client
  |
  v
HTTP Request
  |
  v
Express App
  |
  v
Global Middleware
  |
  v
Authentication
  |
  v
Authorization
  |
  v
Validation
  |
  v
Route
  |
  v
Controller
  |
  v
Service
  |
  v
Repository / DB
  |
  v
Response
```

If anything fails:

```text
Error
  |
  v
Central Error Handler
  |
  v
HTTP Error Response
```

This flow is one of the most important things to understand for a Node.js backend interview.

---

# 2. Synchronous vs Asynchronous JavaScript

## Synchronous

```js
console.log("A");
console.log("B");
console.log("C");
```

Output:

```text
A
B
C
```

Each statement completes before the next one starts.

## Asynchronous

```js
console.log("A");

setTimeout(() => {
  console.log("B");
}, 1000);

console.log("C");
```

Output:

```text
A
C
B
```

The timer callback is scheduled for later.

---

# 3. Why Async Is So Important in Backend Development

Backend applications spend a lot of time waiting for:

```text
Database
Redis
External APIs
Files
Queues
Network
```

If Node blocked for every one of these operations, concurrency would collapse.

Instead, Node starts async work and continues processing other requests.

---

# 4. Callbacks

Classic Node style:

```js
fs.readFile("data.txt", "utf8", (err, data) => {
  if (err) {
    console.error(err);
    return;
  }

  console.log(data);
});
```

The function passed as the last argument is a callback.

Important:

> A callback is just a function passed to another function. It is not automatically asynchronous.

Example:

```js
[1, 2, 3].forEach((n) => {
  console.log(n);
});
```

This callback is synchronous.

---

# 5. Callback Hell

Example:

```js
getUser(id, (err, user) => {
  if (err) return handleError(err);

  getOrders(user.id, (err, orders) => {
    if (err) return handleError(err);

    getPayments(orders, (err, payments) => {
      if (err) return handleError(err);

      console.log(payments);
    });
  });
});
```

Problems:

- nested code,
- hard error handling,
- hard debugging,
- poor readability.

Promises and async/await solve this much more cleanly.

---

# 6. What Is a Promise?

A Promise represents the future result of an asynchronous operation.

States:

```text
Pending
  |
  +----> Fulfilled
  |
  +----> Rejected
```

Example:

```js
const promise = new Promise((resolve, reject) => {
  const success = true;

  if (success) {
    resolve("done");
  } else {
    reject(new Error("failed"));
  }
});
```

Consume:

```js
promise
  .then((result) => {
    console.log(result);
  })
  .catch((error) => {
    console.error(error);
  });
```

---

# 7. Promise Chaining

```js
getUser()
  .then((user) => {
    return getOrders(user.id);
  })
  .then((orders) => {
    return getPayments(orders);
  })
  .then((payments) => {
    console.log(payments);
  })
  .catch((error) => {
    console.error(error);
  });
```

Every `.then()` returns another Promise.

That is why chaining works.

---

# 8. Common Promise Mistake: Forgetting `return`

Bad:

```js
getUser()
  .then((user) => {
    getOrders(user.id);
  })
  .then((orders) => {
    console.log(orders);
  });
```

The second `.then()` may receive `undefined`.

Correct:

```js
getUser()
  .then((user) => {
    return getOrders(user.id);
  })
  .then((orders) => {
    console.log(orders);
  });
```

Interview answer:

> Returning the Promise allows the chain to wait for the nested asynchronous operation.

---

# 9. async / await

`async/await` is syntax built on top of Promises.

```js
async function getData() {
  const user = await getUser();
  const orders = await getOrders(user.id);

  return orders;
}
```

An `async` function always returns a Promise.

Example:

```js
async function test() {
  return 10;
}

test().then(console.log);
```

Output:

```text
10
```

Conceptually:

```js
function test() {
  return Promise.resolve(10);
}
```

---

# 10. What Does `await` Actually Do?

```js
const user = await getUser();
```

`await` pauses the current async function until the Promise settles.

It does **not** normally block the entire Node process.

Correct interview answer:

> `await` pauses the current async function, while the event loop remains free to handle other work.

---

# 11. Error Handling With async/await

```js
try {
  const user = await getUser();
  console.log(user);
} catch (error) {
  console.error(error);
}
```

In Express:

```js
async function controller(req, res, next) {
  try {
    const user = await service.getUser(req.params.id);

    res.json(user);
  } catch (error) {
    next(error);
  }
}
```

The error is forwarded to centralized error middleware.

---

# 12. Sequential vs Concurrent Async Operations

Suppose these are independent:

```js
const user = await getUser();
const products = await getProducts();
const notifications = await getNotifications();
```

This runs sequentially.

```text
getUser          █████
                      getProducts       █████
                                             notifications █████
```

Better:

```js
const [user, products, notifications] = await Promise.all([
  getUser(),
  getProducts(),
  getNotifications(),
]);
```

Now they start together.

```text
getUser          █████
getProducts      ███████
notifications    ████
```

---

# 13. When NOT to Use Promise.all()

If one operation depends on another:

```js
const user = await getUser();

const orders = await getOrders(user.id);
```

You cannot start `getOrders()` before you know the user ID.

So this should remain sequential.

---

# 14. Promise.all()

```js
const results = await Promise.all([
  task1(),
  task2(),
  task3(),
]);
```

Behavior:

```text
all succeed
=> resolves with all results

one rejects
=> combined Promise rejects
```

Important interview trap:

> Promise.all does not automatically cancel the other operations.

They may continue running unless explicit cancellation is implemented.

---

# 15. Promise.allSettled()

```js
const results = await Promise.allSettled([
  task1(),
  task2(),
  task3(),
]);
```

Result:

```js
[
  { status: "fulfilled", value: "A" },
  { status: "rejected", reason: Error("failed") },
  { status: "fulfilled", value: "C" }
]
```

Use when you want every result even if some fail.

Example:

```text
Send multiple emails
Process batch jobs
Call multiple independent services
```

---

# 16. Promise.race()

Returns the first settled Promise.

```js
const result = await Promise.race([
  apiCall(),
  timeoutPromise(),
]);
```

Useful for:

```text
timeouts
fastest response
```

---

# 17. Promise.any()

Returns the first fulfilled Promise.

```js
const result = await Promise.any([
  serverA(),
  serverB(),
  serverC(),
]);
```

If all reject:

```text
AggregateError
```

---

# 18. Promise Methods Summary

```text
Promise.all
=> all must succeed

Promise.allSettled
=> wait for all results

Promise.race
=> first settled wins

Promise.any
=> first successful wins
```

---

# 19. async With `forEach` Trap

Bad:

```js
users.forEach(async (user) => {
  await sendEmail(user);
});

console.log("done");
```

`forEach()` does not wait for the Promises.

Better concurrent version:

```js
await Promise.all(
  users.map((user) => sendEmail(user))
);

console.log("done");
```

Sequential version:

```js
for (const user of users) {
  await sendEmail(user);
}
```

Remember:

```text
Promise.all + map
=> concurrent

for...of + await
=> sequential
```

---

# 20. Too Much Concurrency Can Also Be Bad

Suppose:

```js
await Promise.all(
  100000Items.map(processItem)
);
```

This can overload:

- memory,
- DB pool,
- APIs,
- Redis,
- network.

Better:

```text
Controlled concurrency
Batching
Queues
Worker pools
```

Interview point:

> Maximum concurrency is not always maximum performance.

---

# 21. What Is Express?

Express is a web framework for Node.js.

It helps with:

- routing,
- middleware,
- request handling,
- response handling,
- error handling,
- API creation.

Basic example:

```js
const express = require("express");

const app = express();

app.get("/users", (req, res) => {
  res.json([]);
});

app.listen(3000);
```

---

# 22. Express Request Lifecycle

```text
Incoming Request
      |
      v
Global Middleware
      |
      v
Route Middleware
      |
      v
Controller
      |
      v
Response
```

Example:

```js
app.use(logger);
app.use(express.json());
app.use(authenticate);

app.get("/users", getUsers);
```

Execution order:

```text
logger
  |
express.json()
  |
authenticate
  |
getUsers
```

---

# 23. What Is Middleware?

Middleware is a function with access to:

```js
req
res
next
```

Example:

```js
function logger(req, res, next) {
  console.log(req.method, req.url);

  next();
}
```

Middleware can:

- inspect request,
- modify request,
- modify response,
- stop request,
- call next middleware,
- forward error.

---

# 24. What Does `next()` Do?

```js
next();
```

passes control to the next matching middleware or handler.

Example:

```js
function middleware(req, res, next) {
  console.log("before");

  next();
}
```

For errors:

```js
next(error);
```

passes control to error-handling middleware.

---

# 25. What If Middleware Does Not Call `next()`?

Example:

```js
function middleware(req, res, next) {
  console.log("hello");
}
```

If it does not:

```js
next();
```

and does not send a response:

```js
res.send(...)
res.json(...)
res.end()
```

the request may hang.

Interview answer:

> Middleware must either complete the response or pass control to the next middleware.

---

# 26. Middleware Can Stop the Request

Example:

```js
function authenticate(req, res, next) {
  if (!req.headers.authorization) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  next();
}
```

Flow:

```text
Request
  |
authenticate
  |
missing token
  |
  v
401 Response
```

Controller never runs.

---

# 27. Middleware Order Matters

Example:

```js
app.use(authenticate);
app.use("/public", publicRoutes);
```

Now `/public` is also protected.

If public route should remain public:

```js
app.use("/public", publicRoutes);

app.use(authenticate);

app.use("/private", privateRoutes);
```

Order is important in Express.

---

# 28. Built-In Middleware

JSON parser:

```js
app.use(express.json());
```

URL encoded:

```js
app.use(express.urlencoded({
  extended: true,
}));
```

Without JSON parsing middleware, request body may not be parsed as expected.

---

# 29. Request Parameters

Route:

```js
app.get("/users/:id", handler);
```

Request:

```text
GET /users/123
```

Access:

```js
req.params.id
```

---

# 30. Query Parameters

Request:

```text
GET /users?page=2&limit=20
```

Access:

```js
req.query.page
req.query.limit
```

Typically used for:

- pagination,
- filtering,
- sorting,
- search.

---

# 31. Request Body

Example:

```text
POST /users
```

Body:

```json
{
  "name": "Pramit",
  "email": "test@example.com"
}
```

Access:

```js
req.body.name
```

---

# 32. req, res, next

`req`:

```text
Incoming request
```

Contains:

```text
headers
params
query
body
method
url
```

`res`:

```text
Outgoing response
```

Methods:

```js
res.status()
res.json()
res.send()
res.end()
```

`next`:

```text
Move to next middleware or error middleware
```

---

# 33. Controller vs Service vs Repository

Good backend structure:

```text
Controller
= HTTP concerns

Service
= Business logic

Repository
= Database access
```

Example:

```text
Route
  |
  v
Controller
  |
  v
Service
  |
  v
Repository
  |
  v
Database
```

---

# 34. Controller Example

```js
async function createUser(req, res, next) {
  try {
    const user = await userService.create(req.body);

    return res.status(201).json(user);
  } catch (error) {
    next(error);
  }
}
```

Controller should mainly deal with:

```text
req
res
status code
response format
```

---

# 35. Service Example

```js
async function create(data) {
  const existing =
    await userRepository.findByEmail(data.email);

  if (existing) {
    throw new ConflictError(
      "Email already exists"
    );
  }

  return userRepository.create(data);
}
```

Service contains business logic.

---

# 36. Repository Example

```js
async function findByEmail(email) {
  return db.query(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );
}
```

Repository hides persistence details.

---

# 37. Why Separate Layers?

Benefits:

- easier testing,
- cleaner code,
- reusable business logic,
- easier maintenance,
- lower coupling.

Bad:

```text
Route handler contains
validation
SQL
business logic
email sending
logging
authorization
```

This becomes difficult to maintain.

---

# 38. Error Handling

Bad repeated pattern:

```js
app.get("/users", async (req, res) => {
  try {
    // ...
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});
```

Better:

```text
Controller
  |
  v
next(error)
  |
  v
Central Error Handler
```

---

# 39. Express Error Middleware

Signature:

```js
function errorHandler(err, req, res, next) {
  res.status(err.statusCode || 500).json({
    message:
      err.message || "Internal Server Error",
  });
}
```

Important:

> Error middleware has 4 parameters.

```js
(err, req, res, next)
```

Register after routes:

```js
app.use(errorHandler);
```

---

# 40. Custom Error Class

```js
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.isOperational = true;
  }
}
```

Usage:

```js
throw new AppError(
  "User not found",
  404
);
```

---

# 41. Operational vs Programmer Errors

Operational errors:

```text
invalid request
not found
duplicate value
unauthorized
DB temporarily unavailable
```

Programmer errors:

```text
undefined variable
logic bug
incorrect function call
null access
```

Production applications should handle operational errors cleanly and log unexpected programmer errors properly.

---

# 42. Async Wrapper

Common pattern:

```js
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(
      fn(req, res, next)
    ).catch(next);
  };
};
```

Usage:

```js
router.get(
  "/users",
  asyncHandler(async (req, res) => {
    const users =
      await userService.getAll();

    res.json(users);
  })
);
```

This avoids repeated try/catch.

---

# 43. 404 Handler

Usually placed after routes:

```js
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});
```

Then error handler:

```js
app.use(errorHandler);
```

Typical order:

```text
middleware
routes
404 handler
error handler
```

---

# 44. "Cannot Set Headers After They Are Sent"

Common cause:

```js
if (!user) {
  res.status(404).json({
    message: "Not found",
  });
}

res.json(user);
```

Two responses may be sent.

Fix:

```js
if (!user) {
  return res.status(404).json({
    message: "Not found",
  });
}

return res.json(user);
```

---

# 45. Why `return res...`?

Not because Express requires it.

It is used to stop the current function from continuing.

Example:

```js
return res.status(401).json({
  message: "Unauthorized",
});
```

Prevents later code from accidentally running.

---

# 46. HTTP Methods

Know these:

```text
GET
POST
PUT
PATCH
DELETE
```

---

# 47. GET

Retrieve resource.

```text
GET /users
GET /users/123
```

Should normally not change server state.

---

# 48. POST

Usually create a resource.

```text
POST /users
```

Typical status:

```text
201 Created
```

---

# 49. PUT

Usually complete replacement/update.

```text
PUT /users/123
```

Conceptually:

```json
{
  "name": "Pramit",
  "email": "p@example.com",
  "mobile": "9999999999"
}
```

---

# 50. PATCH

Partial update.

```text
PATCH /users/123
```

Body:

```json
{
  "mobile": "8888888888"
}
```

Remember:

```text
PUT
=> generally full replacement/update

PATCH
=> partial modification
```

---

# 51. DELETE

```text
DELETE /users/123
```

Possible statuses:

```text
200 OK
204 No Content
```

---

# 52. Idempotency

Idempotent means repeating the same request produces the same intended final effect.

Commonly:

```text
GET
=> idempotent

PUT
=> idempotent

DELETE
=> intended to be idempotent

POST
=> usually not idempotent

PATCH
=> depends on operation
```

---

# 53. HTTP Status Codes You Must Know

```text
200 OK
201 Created
204 No Content

400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Unprocessable Entity
429 Too Many Requests

500 Internal Server Error
502 Bad Gateway
503 Service Unavailable
```

---

# 54. 401 vs 403

This is asked constantly.

```text
401
= authentication missing or invalid

403
= authenticated, but not permitted
```

Example:

```text
No token
=> 401

Valid token but user not ADMIN
=> 403
```

---

# 55. 400 vs 422

Common convention:

```text
400
=> malformed or invalid request

422
=> request syntax is valid,
   but semantic validation fails
```

Different projects may use different conventions.

Consistency matters.

---

# 56. 409 Conflict

Examples:

```text
duplicate email
duplicate vendor code
resource version conflict
```

Very useful status for uniqueness/business conflicts.

---

# 57. Authentication vs Authorization

Authentication:

```text
Who are you?
```

Authorization:

```text
What are you allowed to do?
```

Flow:

```text
Login
  |
  v
Authentication
  |
  v
Identity established
  |
  v
Authorization
  |
  v
Permission check
```

---

# 58. JWT Authentication Flow

```text
User
 |
 | email + password
 v
POST /login
 |
 v
Server validates credentials
 |
 v
Generate access token
 |
 v
Client stores token
 |
 v
Authorization: Bearer <token>
 |
 v
Protected API
 |
 v
Server verifies token
 |
 v
req.user
```

---

# 59. JWT Structure

JWT:

```text
Header.Payload.Signature
```

Payload example:

```json
{
  "sub": "user-id",
  "role": "ADMIN",
  "exp": 1234567890
}
```

Important:

> JWT payload is encoded, not encrypted by default.

Never put:

```text
password
secret
sensitive credentials
```

inside it.

---

# 60. JWT Signature

The signature protects integrity.

If attacker modifies payload:

```text
signature verification fails
```

Conceptually:

```text
Header + Payload
      |
      v
Signature created using
secret or private key
```

---

# 61. Access Token vs Refresh Token

Access token:

```text
short-lived
used for APIs
sent frequently
```

Refresh token:

```text
longer-lived
used to get new access token
more sensitive
```

Flow:

```text
Login
 |
 v
Access + Refresh Token
 |
 v
Access expires
 |
 v
Refresh endpoint
 |
 v
New Access Token
```

---

# 62. Why Short-Lived Access Tokens?

If stolen:

```text
shorter expiry
=> smaller attack window
```

Typical strategy:

```text
Access token
=> minutes

Refresh token
=> days or weeks
```

Exact values depend on application requirements.

---

# 63. Password Storage

Never store plain-text passwords.

Use password hashing algorithms such as:

```text
bcrypt
Argon2
scrypt
```

Example:

```js
const hash =
  await bcrypt.hash(password, 12);
```

Verify:

```js
const valid =
  await bcrypt.compare(
    password,
    hash
  );
```

---

# 64. Hashing vs Encryption

Hashing:

```text
one-way
```

Encryption:

```text
reversible with a key
```

Passwords should generally be hashed, not encrypted.

---

# 65. Authentication Middleware

Example:

```js
function authenticate(req, res, next) {
  try {
    const header =
      req.headers.authorization;

    if (!header?.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const token =
      header.substring(7);

    const payload =
      verifyToken(token);

    req.user = payload;

    next();
  } catch (error) {
    next(
      new AppError(
        "Unauthorized",
        401
      )
    );
  }
}
```

---

# 66. Authorization Middleware

Role-based example:

```js
function requireRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({
        message: "Forbidden",
      });
    }

    next();
  };
}
```

Usage:

```js
router.delete(
  "/users/:id",
  authenticate,
  requireRole("ADMIN"),
  deleteUser
);
```

---

# 67. RBAC

RBAC:

```text
Role-Based Access Control
```

Model:

```text
User
  |
  v
Role
  |
  v
Permissions
```

Example:

```text
ADMIN
- user:create
- user:update
- user:delete

MANAGER
- user:read
- user:update

USER
- user:read:self
```

---

# 68. Permission-Based Authorization

Instead of only role checks:

```text
ADMIN
MANAGER
USER
```

you can check permissions:

```text
vendor:create
vendor:view
vendor:approve
vendor:suspend
```

This scales better for enterprise systems.

---

# 69. Scoped Authorization

Sometimes role alone is not enough.

Example:

```text
Manager can view employees
only in same branch
```

Authorization may require:

```text
role
+
permission
+
resource scope
```

This is common in enterprise systems.

---

# 70. Never Trust Role From Request Body

Bad:

```json
{
  "userId": 1,
  "role": "ADMIN"
}
```

and server trusts:

```js
req.body.role
```

Wrong.

Authorization data should come from trusted server-side identity:

```text
verified token
session
database
permission store
```

---

# 71. CORS

CORS:

```text
Cross-Origin Resource Sharing
```

Browsers restrict cross-origin requests.

Example:

Frontend:

```text
https://frontend.example.com
```

Backend:

```text
https://api.example.com
```

Backend may allow frontend origin:

```js
app.use(
  cors({
    origin:
      "https://frontend.example.com",
    credentials: true,
  })
);
```

Important:

> CORS is not authentication.

---

# 72. What Is an Origin?

Origin:

```text
scheme + host + port
```

These are different origins:

```text
http://example.com
https://example.com
http://example.com:3000
```

---

# 73. CORS Preflight

Browser may send:

```text
OPTIONS
```

before the real request.

This checks:

```text
origin
method
headers
credentials
```

If allowed, browser sends the actual request.

---

# 74. Rate Limiting

Example:

```text
100 requests per minute
```

Why?

- prevent abuse,
- reduce brute force,
- protect APIs,
- improve stability.

Response:

```text
429 Too Many Requests
```

For multiple app instances, shared stores such as Redis are often used.

---

# 75. Input Validation

Never trust client data.

Example:

```json
{
  "email": "abc",
  "age": -100
}
```

Validate:

```text
required
type
range
format
enum
length
```

Libraries:

```text
Zod
Joi
Yup
class-validator
```

---

# 76. Validation vs Business Rules

Validation:

```text
email must be valid
name required
age must be positive
```

Business rule:

```text
user cannot approve own request
vendor cannot submit after deadline
employee cannot transfer to same department
```

Business rules usually belong in service/domain logic.

---

# 77. SQL Injection

Bad:

```js
const query =
  "SELECT * FROM users WHERE email = '" +
  req.body.email +
  "'";
```

Use parameterized query:

```js
await db.query(
  "SELECT * FROM users WHERE email = $1",
  [req.body.email]
);
```

---

# 78. REST API Naming

Prefer:

```text
GET    /users
POST   /users
GET    /users/:id
PATCH  /users/:id
DELETE /users/:id
```

Avoid unnecessary verb endpoints:

```text
/getUsers
/createUser
/deleteUser
```

REST usually uses nouns for resources.

---

# 79. Nested Resources

Example:

```text
GET /users/:userId/orders
```

Specific order:

```text
GET /users/:userId/orders/:orderId
```

Avoid excessive nesting.

---

# 80. Pagination

Do not return millions of rows.

Example:

```text
GET /users?page=1&limit=20
```

Response:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5000
  }
}
```

---

# 81. Offset Pagination

SQL:

```sql
SELECT *
FROM users
ORDER BY id
LIMIT 20
OFFSET 40;
```

Simple but large offsets can become slow.

---

# 82. Cursor Pagination

Example:

```text
GET /users?after=123&limit=20
```

Query:

```sql
SELECT *
FROM users
WHERE id > 123
ORDER BY id
LIMIT 20;
```

Good for large/changing datasets.

---

# 83. API Filtering

Example:

```text
GET /users?status=ACTIVE&role=ADMIN
```

Validate allowed filter fields.

Do not dynamically inject arbitrary query fields into SQL.

---

# 84. Sorting

Example:

```text
GET /users?sortBy=createdAt&order=desc
```

Validate:

```text
allowed sort columns
allowed directions
```

---

# 85. REST Response Consistency

Success:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Pramit"
  }
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User not found"
  }
}
```

The exact shape is project-specific.

Consistency is the important part.

---

# 86. API Versioning

Example:

```text
/api/v1/users
```

Why version?

Because future breaking changes may affect clients.

Approaches:

```text
URL versioning
Header versioning
```

---

# 87. What Is REST?

REST is an architectural style for designing network APIs around resources and HTTP semantics.

Common ideas:

- resources,
- HTTP methods,
- statelessness,
- representations,
- cacheability where appropriate.

Do not say:

> REST means JSON.

REST is broader than JSON.

---

# 88. Statelessness

REST requests should contain enough context to process them.

Example:

```text
Authorization token
body
query params
path params
```

Stateless does **not** mean:

```text
server stores no database data
```

It means request processing should not depend on arbitrary hidden conversational state between previous HTTP requests.

---

# 89. REST vs RPC

REST:

```text
POST /orders
PATCH /orders/:id
```

RPC:

```text
POST /createOrder
POST /cancelOrder
```

REST is more resource-oriented.

RPC is more action-oriented.

Neither is automatically wrong.

---

# 90. API Contract

An API contract defines:

```text
endpoint
HTTP method
headers
authentication
params
body
response
status codes
validation
errors
```

Example:

```text
POST /api/v1/users
```

Request:

```json
{
  "name": "Pramit",
  "email": "p@example.com"
}
```

Response:

```text
201 Created
```

---

# 91. Logging

Production logs should help answer:

```text
what happened?
when?
which request?
which user?
which service?
which error?
```

Useful fields:

```text
timestamp
requestId
method
route
status
latency
userId
error stack
```

Never log:

```text
passwords
access tokens
refresh tokens
sensitive secrets
```

---

# 92. Request IDs

Example:

```text
X-Request-ID: abc-123
```

Logs:

```text
[abc-123] request received
[abc-123] DB query started
[abc-123] external API failed
```

Very useful in distributed systems.

---

# 93. Timeouts

External services can hang.

Always think about timeouts.

Conceptually:

```text
Node API
  |
  v
External service
  |
  v
No response forever?
```

Bad.

Use sensible timeouts.

---

# 94. Retry Logic

Retries are useful for temporary failures.

But dangerous for non-idempotent operations.

Example:

```text
POST payment
```

If request succeeded but response was lost, retry may charge twice.

Solution may involve:

```text
idempotency key
```

---

# 95. Idempotency Key

Example:

```text
POST /payments
Idempotency-Key: abc123
```

Server can remember the key and avoid processing the same logical request twice.

Common in:

```text
payments
orders
external integrations
```

---

# 96. Access Token Storage

Browser token storage is a security design decision.

Common secure approach:

```text
HttpOnly
Secure
SameSite cookies
```

Why?

JavaScript cannot directly access HttpOnly cookies.

LocalStorage is exposed to JavaScript, so XSS can be more dangerous.

Exact design depends on:

```text
XSS
CSRF
frontend architecture
API architecture
```

---

# 97. CSRF

CSRF:

```text
Cross-Site Request Forgery
```

If credentials are automatically sent by browser cookies, another site may try to trigger requests.

Defenses:

```text
SameSite cookies
CSRF tokens
Origin checks
```

---

# 98. XSS

XSS:

```text
Cross-Site Scripting
```

Attacker causes malicious script to run in another user's browser.

Defenses:

```text
escaping
sanitization
CSP
safe frontend practices
avoid unsafe HTML injection
```

---

# 99. Security Headers

Middleware like Helmet can help configure security-related headers.

```js
app.use(helmet());
```

But:

> Helmet is not a complete security solution.

It is only one layer.

---

# 100. End-to-End Request Example

Suppose:

```text
POST /api/v1/vendors
```

Flow:

```text
Request
  |
  v
CORS
  |
  v
JSON Parser
  |
  v
Authentication
  |
  v
Authorization
  |
  v
Validation
  |
  v
Controller
  |
  v
Service
  |
  +--> duplicate check
  +--> business rules
  |
  v
Repository
  |
  v
Database
  |
  v
201 Created
```

If duplicate:

```text
Duplicate detected
  |
  v
ConflictError
  |
  v
Central Error Handler
  |
  v
409 Conflict
```

---

# 101. Full Route Example

```js
router.post(
  "/vendors",
  authenticate,
  authorize("vendor:create"),
  validate(createVendorSchema),
  vendorController.create
);
```

This line alone demonstrates:

```text
authentication
authorization
validation
controller separation
```

---

# 102. Dependency Injection

Instead of hard-coding dependencies:

```js
class UserService {
  constructor(userRepository) {
    this.userRepository =
      userRepository;
  }
}
```

Benefits:

- easier testing,
- easier mocking,
- lower coupling,
- easier replacement.

---

# 103. N+1 Query Problem

Example:

```js
const users = await getUsers();

for (const user of users) {
  user.orders =
    await getOrders(user.id);
}
```

For 100 users:

```text
1 query for users
+
100 queries for orders
=
101 queries
```

This is the N+1 problem.

Possible fixes:

```text
JOIN
batch query
eager loading
DataLoader
better query design
```

---

# 104. Connection Pool

Instead of opening a DB connection for every request:

```text
Requests
   |
   v
Connection Pool
   |
   v
Database
```

Example:

```text
Pool size = 20
```

Many requests share those connections.

This prevents uncontrolled connection creation.

---

# 105. Why DB Constraints Still Matter

Bad logic:

```text
Check email
If not exists
Insert
```

Race:

```text
Request A checks -> not found
Request B checks -> not found

A inserts
B inserts
```

Without DB unique constraint, duplicate is possible.

Correct:

```text
Application validation
+
DB UNIQUE constraint
```

Then handle conflict properly.

---

# 106. Strong Interview Answer:
## "What Is Middleware?"

> Middleware is a function that runs during the request-response lifecycle and has access to the request, response, and next function. It can inspect or modify the request, perform cross-cutting concerns such as authentication, validation, logging, or rate limiting, terminate the response, or pass control to the next middleware.

---

# 107. Strong Interview Answer:
## "Authentication vs Authorization"

> Authentication verifies who the user is, while authorization determines what the authenticated user is allowed to do. For example, verifying a JWT establishes identity, and checking roles or permissions decides whether that user can access a specific endpoint.

---

# 108. Strong Interview Answer:
## "Promise.all vs Promise.allSettled"

> Promise.all is useful when all operations must succeed. It rejects if any one Promise rejects. Promise.allSettled waits for every Promise and returns the success or failure status of each one, making it useful for batch operations where partial failure is acceptable.

---

# 109. Strong Interview Answer:
## "What Happens With await?"

> Await pauses only the current async function until the Promise settles. It does not block the Node.js event loop, so other requests and asynchronous operations can continue running.

---

# 110. Strong Interview Answer:
## "How Do You Handle Errors in Express?"

> I prefer centralized error handling. Route handlers or services throw or forward typed errors, and a final error middleware maps those errors to consistent HTTP responses. Expected operational errors get appropriate status codes, while unexpected internal errors are logged and returned as safe generic responses.

---

# 111. Strong Interview Answer:
## "PUT vs PATCH"

> PUT generally represents replacing or fully updating the target resource and is expected to be idempotent. PATCH applies partial changes. In real projects, the exact behavior should be documented consistently in the API contract.

---

# 112. Strong Interview Answer:
## "401 vs 403"

> 401 means the client is not properly authenticated, for example because the token is missing, invalid, or expired. 403 means the client is authenticated but does not have permission to perform the action.

---

# 113. Strong Interview Answer:
## "Why Use Service Layer?"

> The controller should mainly deal with HTTP concerns, while the service layer contains business logic. This separation improves testability, reuse, maintainability, and keeps controllers small.

---

# 114. Strong Interview Answer:
## "Why Use Parameterized SQL?"

> Parameterized queries keep user input separate from SQL syntax, which helps prevent SQL injection and also makes queries cleaner and safer.

---

# 115. Strong Interview Answer:
## "How Do You Secure an API?"

> I use layered security: HTTPS, authentication, authorization, input validation, parameterized database queries, rate limiting, secure token handling, password hashing, proper CORS configuration, safe logging, and centralized error handling. Security is not one middleware; it is multiple controls working together.

---

# 116. Common Interview Traps

## Trap 1

> async/await makes code synchronous.

Wrong.

It only gives synchronous-looking syntax over Promises.

---

## Trap 2

> await blocks Node.

Wrong.

It pauses the current async function.

---

## Trap 3

> Promise.all creates threads.

Wrong.

It coordinates Promises.

---

## Trap 4

> 401 means permission denied.

Wrong.

401 = authentication problem.

403 = permission problem.

---

## Trap 5

> CORS protects your API from Postman/curl.

Wrong.

CORS is primarily enforced by browsers.

---

## Trap 6

> JWT payload is encrypted.

Wrong by default.

It is encoded and signed.

---

## Trap 7

> Middleware always calls next.

Wrong.

It may also terminate the response.

---

## Trap 8

> Validation alone guarantees DB integrity.

Wrong.

DB constraints are still essential.

---

# 117. Rapid-Fire Questions

Answer these aloud without looking.

1. What is a Promise?
2. What are Promise states?
3. What does async return?
4. What does await do?
5. Does await block Node?
6. Promise.all vs allSettled?
7. Promise.race vs Promise.any?
8. Why is async forEach dangerous?
9. Sequential vs concurrent await?
10. What is middleware?
11. What does next() do?
12. What happens if middleware neither responds nor calls next?
13. Why does middleware order matter?
14. Controller vs service?
15. Service vs repository?
16. What is centralized error handling?
17. What is error middleware signature?
18. Why use custom error classes?
19. GET vs POST?
20. PUT vs PATCH?
21. What is idempotency?
22. 200 vs 201 vs 204?
23. 400 vs 422?
24. 401 vs 403?
25. When use 409?
26. Authentication vs authorization?
27. What is JWT?
28. What are JWT parts?
29. Is JWT encrypted?
30. Access token vs refresh token?
31. How should passwords be stored?
32. Hashing vs encryption?
33. What is RBAC?
34. What is permission-based access?
35. What is scoped authorization?
36. What is CORS?
37. What is preflight?
38. What is rate limiting?
39. What is SQL injection?
40. Why use parameterized queries?
41. What is pagination?
42. Offset vs cursor pagination?
43. What is API versioning?
44. What is REST?
45. What does stateless mean?
46. What is N+1?
47. What is connection pooling?
48. Why do DB constraints still matter?
49. What is an idempotency key?
50. How do you secure a Node API?

---

# 118. Mock Code Question 1

What is wrong?

```js
app.get("/users/:id", async (req, res) => {
  const user = await getUser(req.params.id);

  if (!user) {
    res.status(404).json({
      message: "Not found",
    });
  }

  res.json(user);
});
```

Problem:

```text
Potential double response
```

Fix:

```js
if (!user) {
  return res.status(404).json({
    message: "Not found",
  });
}

return res.json(user);
```

---

# 119. Mock Code Question 2

What is wrong?

```js
users.forEach(async (user) => {
  await saveUser(user);
});

console.log("done");
```

Problem:

```text
forEach does not await returned Promises
```

Fix:

```js
await Promise.all(
  users.map((user) => saveUser(user))
);

console.log("done");
```

---

# 120. Mock Code Question 3

What is wrong?

```js
app.post("/admin", (req, res) => {
  if (req.body.role === "ADMIN") {
    // allow
  }
});
```

Problem:

```text
Client-controlled role is trusted
```

Correct approach:

```text
verify authenticated identity
load trusted permissions
check authorization server-side
```

---

# 121. Mock Code Question 4

What is wrong?

```js
const sql =
  `SELECT * FROM users WHERE email = '${req.body.email}'`;
```

Problem:

```text
SQL injection
```

Fix:

```js
await db.query(
  "SELECT * FROM users WHERE email = $1",
  [req.body.email]
);
```

---

# 122. Mock Code Question 5

Which is faster if independent?

```js
const a = await getA();
const b = await getB();
```

vs:

```js
const [a, b] = await Promise.all([
  getA(),
  getB(),
]);
```

Usually second one, because operations overlap.

---

# 123. End-to-End Interview Scenario

Question:

> Design a create-user API.

Strong answer:

```text
1. POST /api/v1/users

2. Validate request body

3. Authenticate caller if endpoint is protected

4. Authorize required permission

5. Check business rules

6. Use parameterized query/ORM

7. Enforce DB constraints

8. Create user

9. Return 201 Created

10. On duplicate:
    return 409 Conflict

11. On validation issue:
    return 400/422 based on project convention

12. Log unexpected errors internally

13. Use centralized error middleware
```

---

# 124. The Mental Model You Must Remember

```text
Client
  |
  v
Express
  |
  v
Middleware
  |
  +--> Authentication
  |
  +--> Authorization
  |
  +--> Validation
  |
  v
Controller
  |
  v
Service
  |
  v
Repository
  |
  v
Database
  |
  v
Response
```

For async work:

```text
Start async operation
  |
  v
await pauses current function
  |
  v
event loop handles other work
  |
  v
Promise settles
  |
  v
function continues
```

---

# 125. Final 2-Minute Summary

```text
Promise
= future async result

async
= function always returns Promise

await
= pauses current async function

Promise.all
= all must succeed

Promise.allSettled
= get every result

Express middleware
= request pipeline function

next()
= move to next middleware

Controller
= HTTP layer

Service
= business logic

Repository
= DB layer

Authentication
= who are you?

Authorization
= what can you do?

401
= not authenticated

403
= authenticated but forbidden

JWT
= header.payload.signature

Passwords
= hash, don't encrypt/store plain text

REST
= resource-oriented HTTP API style

PUT
= usually full replacement/update

PATCH
= partial update

409
= conflict

CORS
= browser cross-origin control

Rate limit
= protect API from abuse

Parameterized SQL
= prevent SQL injection

Central error handler
= consistent error responses
```

---

# 126. Before Moving to Hour 3

You should be able to explain these 15 topics without looking:

1. Promise
2. async/await
3. Promise.all
4. Promise.allSettled
5. async forEach trap
6. Express middleware
7. middleware order
8. controller/service/repository separation
9. centralized error handling
10. authentication vs authorization
11. JWT flow
12. access vs refresh token
13. 401 vs 403
14. PUT vs PATCH
15. how one request travels through a Node backend

If these are clear, Hour 2 is complete.
