# Library Management System API — Complete Explanation

A **Node.js + Express + Sequelize (MySQL)** RESTful API for managing library operations: books, members, borrowing/returning books, and fines.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Project Structure](#2-project-structure)
3. [Data Model & Relationships](#3-data-model--relationships)
4. [Request / Response Flow](#4-request--response-flow)
5. [File-by-File Explanation](#5-file-by-file-explanation)
   - [server.js](#serverjs)
   - [config/database.js](#configdatabasejs)
   - [models/](#models)
   - [middleware/](#middleware)
   - [services/](#services)
   - [controllers/](#controllers)
   - [routes/](#routes)
   - [utils/](#utils)
6. [Business Rules Summary](#6-business-rules-summary)
7. [API Endpoint Quick Reference](#7-api-endpoint-quick-reference)

---

## 1. Architecture Overview

The project uses a **clean layered architecture**:

```
HTTP Request
     │
     ▼
┌──────────┐
│  Routes  │  ← Defines URL → handler mapping + applies validation middleware
└──────────┘
     │
     ▼
┌────────────┐
│ Middleware │  ← Input validation (express-validator), error handler
└────────────┘
     │
     ▼
┌─────────────┐
│ Controllers │  ← Parses req, calls service, sends res
└─────────────┘
     │
     ▼
┌──────────┐
│ Services │  ← Core business logic (borrow/return, fines, validation)
└──────────┘
     │
     ▼
┌────────┐
│ Models │  ← Sequelize ORM → MySQL database tables
└────────┘
```

Each layer has a **single responsibility**:
- **Routes**: wire URLs to handlers.
- **Middleware**: validate input before reaching controllers.
- **Controllers**: thin—parse request, delegate to services, format response.
- **Services**: fat—contain all business logic (transactions, fine calculations, suspension logic).
- **Models**: define DB schema and associations.

---

## 2. Project Structure

```
Library-Management-System/
├── server.js                  # App bootstrap & entry point
├── .env                       # Environment variables (DB credentials, PORT)
├── package.json               # Dependencies & scripts
│
├── config/
│   └── database.js            # Sequelize instance + connection test
│
├── models/
│   ├── index.js               # Loads all models, declares associations
│   ├── Book.js                # Books table schema
│   ├── Member.js              # Members table schema
│   ├── Transaction.js         # Borrow records table schema
│   └── Fine.js                # Fines table schema
│
├── middleware/
│   ├── validator.js           # express-validator rule sets + error handler
│   └── errorHandler.js        # Global Express error handler + 404 handler
│
├── services/
│   ├── bookService.js         # Book state machine + copy counter logic
│   ├── memberService.js       # Suspend/activate member, get borrowed books
│   ├── transactionService.js  # borrowBook(), returnBook(), overdue logic
│   ├── fineService.js         # payFine(), getUnpaidFines(), getMemberFines()
│   └── validationService.js   # Pre-borrow business rule checks
│
├── controllers/
│   ├── bookController.js      # CRUD handlers for books
│   ├── memberController.js    # CRUD handlers for members
│   ├── transactionController.js # Borrow/return/overdue handlers
│   └── fineController.js      # Pay fine / get fines handlers
│
├── routes/
│   ├── bookRoutes.js          # /api/books routes
│   ├── memberRoutes.js        # /api/members routes
│   ├── transactionRoutes.js   # /api/transactions routes
│   └── fineRoutes.js          # /api/fines routes
│
└── utils/
    └── dateUtils.js           # Date calculation helpers (due date, overdue days, fine)
```

---

## 3. Data Model & Relationships

### Entity Relationship Diagram

```
┌──────────┐         ┌─────────────────┐         ┌──────────┐
│  Member  │ 1 ───── M│   Transaction   │M ─────── 1│   Book   │
│          │         │  (borrow record) │         │          │
│ id (PK)  │         │ id (PK)          │         │ id (PK)  │
│ name     │         │ member_id (FK)   │         │ isbn     │
│ email    │         │ book_id (FK)     │         │ title    │
│ memb_no  │         │ borrowed_at      │         │ author   │
│ status   │         │ due_date         │         │ category │
└──────────┘         │ returned_at      │         │ total_   │
     │               │ status           │         │  copies  │
     │               └─────────────────┘         │ avail_   │
     │                        │ 1                │  copies  │
     │                        │                  │ status   │
     │ 1               M ─────┘                  └──────────┘
     │               ┌──────┐
     └──────────── M │ Fine │
                     │ id (PK)          │
                     │ member_id (FK)   │
                     │ transaction_id(FK│
                     │ amount           │
                     │ paid_at          │
                     └──────────────────┘
```

### Associations (defined in `models/index.js`)

| From        | Relationship | To          | Foreign Key      | Alias          |
|-------------|--------------|-------------|------------------|----------------|
| Book        | hasMany      | Transaction | `book_id`        | `transactions` |
| Transaction | belongsTo    | Book        | `book_id`        | `book`         |
| Member      | hasMany      | Transaction | `member_id`      | `transactions` |
| Transaction | belongsTo    | Member      | `member_id`      | `member`       |
| Member      | hasMany      | Fine        | `member_id`      | `fines`        |
| Fine        | belongsTo    | Member      | `member_id`      | `member`       |
| Transaction | hasOne       | Fine        | `transaction_id` | `fine`         |
| Fine        | belongsTo    | Transaction | `transaction_id` | `transaction`  |

---

## 4. Request / Response Flow

### Example: Borrow a Book (`POST /api/transactions/borrow`)

```
Client → POST /api/transactions/borrow { member_id, book_id }
   │
   ▼
transactionRoutes.js
   → runs transactionValidationRules.borrow (validate IDs are integers)
   → runs handleValidationErrors (abort with 400 if invalid)
   → calls borrowBook controller
   │
   ▼
transactionController.js :: borrowBook()
   → checks member_id & book_id are present
   → calls borrowBookService(member_id, book_id)
   │
   ▼
transactionService.js :: borrowBook()
   → starts a DB transaction (t)
   → calls validateBorrowing(memberId, bookId)
      │ validationService.js checks:
      │   1. Is member active?
      │   2. Does member have < 3 active/overdue books?
      │   3. Does member have unpaid fines?
      │   4. Does the book have available copies?
      └─ throws if any check fails (rolls back t)
   → decrement book.available_copies
   → if available_copies reaches 0 → set book.status = "borrowed"
   → create Transaction record (borrowed_at = now, due_date = now + 14 days)
   → commit DB transaction
   → return Transaction with nested Book + Member data
   │
   ▼
transactionController.js
   → res.status(201).json({ success: true, data: transaction })
   │
   ▼
Client receives borrow record
```

### Example: Return a Book (`POST /api/transactions/:id/return`)

```
transactionService.js :: returnBook()
   → start DB transaction
   → find Transaction by ID
   → if already returned → throw error
   → calculate overdueDays = returnDate - due_date (via dateUtils)
   → update Transaction: returned_at = now, status = "completed"
   → increment book.available_copies; set book.status = "available"
   → if overdueDays > 0:
       fine_amount = overdueDays × $0.50
       create Fine record
   → commit
   → call checkAndUpdateSuspension(member_id)
      → if member has ≥ 3 overdue transactions → suspend member
      → else if member was suspended → reactivate
   → return { transaction, fine, overdueDays }
```

---

## 5. File-by-File Explanation

---

### `server.js`

**Purpose:** Entry point. Bootstraps Express app, mounts routes and middleware, syncs DB, starts listening.

| Function / Code Block | What it does |
|-----------------------|--------------|
| `require("dotenv").config()` | Loads `.env` variables into `process.env` |
| `require("./models")` | Side-effect import: triggers Sequelize model definitions and association setup |
| `app.use(express.json())` | Parses JSON request bodies |
| `app.use(express.urlencoded())` | Parses URL-encoded bodies (form data) |
| Logging middleware (anonymous) | Logs `TIMESTAMP - METHOD /path` for every request |
| `GET /health` | Health-check endpoint; returns `{ success: true }` |
| `app.use("/api", ...)` | Mounts all 4 route files under `/api` prefix |
| `app.use(notFoundHandler)` | Catches any unmatched route → 404 JSON |
| `app.use(errorHandler)` | Global error handler (must be last middleware) |
| `startServer()` | `async` function: tests DB connection → syncs Sequelize schema (`alter` in dev) → starts HTTP server |

---

### `config/database.js`

**Purpose:** Creates and exports a configured Sequelize instance.

| Export | Description |
|--------|-------------|
| `sequelize` | The Sequelize instance connected to MySQL using `.env` credentials. Pool: max 10 connections, 30s acquire timeout, 10s idle timeout. SQL logging enabled only in `development`. |
| `testConnection()` | `async` – calls `sequelize.authenticate()` to verify the DB is reachable. Throws on failure (crashes server startup). |

---

### `models/`

#### `models/Book.js`

Sequelize model for the `books` table.

| Column | Type | Constraints | Note |
|--------|------|-------------|------|
| `id` | INTEGER | PK, auto-increment | |
| `isbn` | STRING(20) | NOT NULL, UNIQUE | |
| `title` | STRING(255) | NOT NULL | |
| `author` | STRING(255) | NOT NULL | |
| `category` | STRING(100) | nullable | |
| `total_copies` | INTEGER | NOT NULL, default 1 | Physical copies owned |
| `available_copies` | INTEGER | NOT NULL, default 1 | Currently loanable copies |
| `status` | ENUM | `available/borrowed/maintenance/reserved` | Auto-set based on copies |

Indexes: `isbn`, `title`, `status`.

#### `models/Member.js`

Sequelize model for the `members` table.

| Column | Type | Constraints | Note |
|--------|------|-------------|------|
| `id` | INTEGER | PK, auto-increment | |
| `name` | STRING(255) | NOT NULL | |
| `email` | STRING(255) | NOT NULL, UNIQUE, isEmail | |
| `membership_number` | STRING(50) | NOT NULL, UNIQUE | |
| `status` | ENUM | `active/suspended` | default `active` |

Indexes: `email`, `membership_number`.

#### `models/Transaction.js`

Sequelize model for the `transactions` table (one record per borrow).

| Column | Type | Constraints | Note |
|--------|------|-------------|------|
| `id` | INTEGER | PK, auto-increment | |
| `member_id` | INTEGER | NOT NULL, FK → members | |
| `book_id` | INTEGER | NOT NULL, FK → books | |
| `borrowed_at` | DATE | NOT NULL, default NOW | |
| `due_date` | DATE | NOT NULL | borrowed_at + 14 days |
| `returned_at` | DATE | nullable | null = still borrowed |
| `status` | ENUM | `active/overdue/completed` | default `active` |

Indexes: `member_id`, `book_id`, `status`, `due_date`.

#### `models/Fine.js`

Sequelize model for the `fines` table.

| Column | Type | Constraints | Note |
|--------|------|-------------|------|
| `id` | INTEGER | PK, auto-increment | |
| `member_id` | INTEGER | NOT NULL, FK → members | |
| `transaction_id` | INTEGER | NOT NULL, FK → transactions | |
| `amount` | DECIMAL(10,2) | NOT NULL | overdueDays × 0.50 |
| `paid_at` | DATE | nullable | null = unpaid |

Indexes: `member_id`, `paid_at`.

#### `models/index.js`

**Purpose:** Imports all models, declares Sequelize associations, and re-exports everything from one place. This is the single import point used by services/controllers (e.g., `require("../models")`).

---

### `middleware/`

#### `middleware/validator.js`

Uses `express-validator` to define input rules and a shared error-response handler.

| Export | Description |
|--------|-------------|
| `handleValidationErrors(req, res, next)` | Collects validation errors via `validationResult(req)`. If any, returns `400 { success: false, errors: [...] }` and stops the chain. Otherwise calls `next()`. |
| `bookValidationRules.create` | Array of rules: `isbn` (required, 10–20 chars), `title` (required), `author` (required), `total_copies`/`available_copies` (optional integers ≥ 0). |
| `bookValidationRules.update` | All fields optional; validates `id` param is integer. |
| `memberValidationRules.create` | `name` (required), `email` (valid email), `membership_number` (required). |
| `memberValidationRules.update` | All fields optional; validates `id` param is integer; `status` must be `active` or `suspended`. |
| `transactionValidationRules.borrow` | `member_id` and `book_id` must be integers. |
| `transactionValidationRules.return` | `id` param must be an integer. |
| `fineValidationRules.pay` | `id` param must be an integer. |

#### `middleware/errorHandler.js`

Global Express error-handling middleware. **Must be registered last.**

| Export | Params | What it does |
|--------|--------|--------------|
| `errorHandler(err, req, res, next)` | 4-arg Express error handler | Checks `err.name` for Sequelize-specific errors and returns structured JSON: `SequelizeValidationError` → 400, `SequelizeUniqueConstraintError` → 409, `SequelizeForeignKeyConstraintError` → 400. Falls back to `err.status || 500`. |
| `notFoundHandler(req, res)` | Standard middleware | Returns `404 { success: false, message: "Route not found" }` for any unregistered routes. |

---

### `services/`

#### `services/bookService.js`

Manages book **state machine** and **copy counters**.

| Constant / Function | Signature | Description |
|--------------------|-----------|-------------|
| `VALID_TRANSITIONS` | Object | Defines allowed status transitions: `available→[borrowed,maintenance,reserved]`, `borrowed→[available]`, `maintenance→[available]`, `reserved→[borrowed,available]`. |
| `canTransitionTo(currentStatus, newStatus)` | `(string, string) → boolean` | Returns true only if the transition is in `VALID_TRANSITIONS`. |
| `updateBookStatus(bookId, newStatus)` | `async (int, string) → Book` | Finds book by PK, validates transition, calls `book.update()`. Throws if book not found or invalid transition. |
| `decrementAvailableCopies(bookId)` | `async (int) → Book` | Decrements `available_copies` by 1. If reaches 0, sets `status = "borrowed"`. Throws if no copies available. Called when a book is borrowed. |
| `incrementAvailableCopies(bookId)` | `async (int) → Book` | Increments `available_copies` by 1. If result > 0, sets `status = "available"`. Called when a book is returned. |
| `getAvailableBooks()` | `async () → Book[]` | Finds all books where `available_copies > 0`, ordered by `title ASC`. |

#### `services/memberService.js`

Manages member **status** and retrieves **borrowed books**.

| Function | Signature | Description |
|----------|-----------|-------------|
| `suspendMember(memberId)` | `async (int) → Member` | Sets member's `status = "suspended"`. Throws if already suspended. |
| `activateMember(memberId)` | `async (int) → Member` | Sets member's `status = "active"`. Throws if already active. |
| `checkAndUpdateSuspension(memberId)` | `async (int) → Member` | Counts `overdue` transactions. If ≥ 3 → suspends the member. If < 3 and member is currently suspended → reactivates. Called automatically after every book return. |
| `getMemberBorrowedBooks(memberId)` | `async (int) → Transaction[]` | Finds all `active` or `overdue` transactions for the member. Eagerly loads `book` association (id, isbn, title, author, category). Ordered by `borrowed_at DESC`. |

#### `services/transactionService.js`

The **core orchestration layer** for borrow and return operations. Uses **Sequelize DB transactions** to ensure atomicity.

| Constant | Value | Description |
|----------|-------|-------------|
| `LOAN_PERIOD_DAYS` | `14` | Books are due 14 days after borrowing. |
| `FINE_PER_DAY` | `0.5` | $0.50 charged per overdue day. |

| Function | Signature | Description |
|----------|-----------|-------------|
| `borrowBook(memberId, bookId)` | `async (int, int) → Transaction` | **Full borrow flow** inside a DB transaction: (1) run `validateBorrowing`, (2) decrement `available_copies`, (3) set book status to `"borrowed"` if no copies left, (4) create `Transaction` with `due_date = now + 14 days`, (5) commit. Returns transaction with book + member nested. Rolls back on any error. |
| `returnBook(transactionId)` | `async (int) → {transaction, fine, overdueDays}` | **Full return flow** inside a DB transaction: (1) find transaction, (2) check not already returned, (3) calculate `overdueDays`, (4) mark transaction `completed`, (5) increment `available_copies` + set book `"available"`, (6) if overdue → create `Fine` record, (7) commit, (8) call `checkAndUpdateSuspension`. |
| `getOverdueTransactions()` | `async () → Transaction[]` | Queries all transactions that are `active` or `overdue` AND `due_date < now` AND `returned_at IS NULL`. Includes nested book/member data. Ordered by `due_date ASC`. |
| `updateOverdueStatuses()` | `async () → number` | Bulk updates: sets all `active` transactions where `due_date < now` to `status = "overdue"`. Returns count of updated rows. |

#### `services/fineService.js`

Manages fine **payment** and **retrieval**.

| Function | Signature | Description |
|----------|-----------|-------------|
| `payFine(fineId)` | `async (int) → Fine` | Finds fine by PK (with member + transaction). Throws if not found or already paid. Sets `paid_at = new Date()`. |
| `getUnpaidFines(memberId)` | `async (int) → Fine[]` | All fines for the member where `paid_at IS NULL`. Includes transaction details. Ordered by `created_at DESC`. |
| `getMemberFines(memberId)` | `async (int) → Fine[]` | All fines (paid + unpaid) for the member. Includes transaction details. Ordered by `created_at DESC`. |

#### `services/validationService.js`

Pre-borrow **business rule enforcement**. Called by `transactionService.borrowBook()` before any DB writes.

| Constant | Value | Description |
|----------|-------|-------------|
| `MAX_BOOKS_PER_MEMBER` | `3` | A member can borrow at most 3 books at a time. |

| Function | Signature | Returns | Description |
|----------|-----------|---------|-------------|
| `canMemberBorrow(memberId)` | `async (int)` | `boolean` | Counts member's `active` + `overdue` transactions. Returns true if count < 3. |
| `hasUnpaidFines(memberId)` | `async (int)` | `boolean` | Returns true if member has any fine with `paid_at IS NULL`. |
| `isMemberActive(memberId)` | `async (int)` | `boolean` | Returns true if member exists and `status = "active"`. |
| `isBookAvailable(bookId)` | `async (int)` | `boolean` | Returns true if book exists and `available_copies > 0`. |
| `validateBorrowing(memberId, bookId)` | `async (int, int)` | `{ valid: boolean, errors: string[] }` | Runs all 4 checks above. Returns aggregated result. All errors are collected (not short-circuit). |
| `checkSuspensionStatus(memberId)` | `async (int)` | `boolean` | Returns true if member has ≥ 3 overdue transactions (i.e., should be suspended). |

---

### `controllers/`

Controllers are **thin**. They parse `req`, delegate to a service, and format `res`. No business logic lives here.

#### `controllers/bookController.js`

| Function | Method | Route | Description |
|----------|--------|-------|-------------|
| `createBook(req, res)` | POST | `/api/books` | Calls `Book.create(req.body)`. Auto-sets `available_copies = total_copies` if omitted. Returns 201. |
| `getAllBooks(req, res)` | GET | `/api/books` | `Book.findAll()`. Returns 200 with count + array. |
| `getAvailableBooksController(req, res)` | GET | `/api/books/available` | Calls `bookService.getAvailableBooks()`. Returns 200 with filtered books. |
| `getBookById(req, res)` | GET | `/api/books/:id` | `Book.findByPk(req.params.id)`. Returns 404 if not found. |
| `updateBook(req, res)` | PUT | `/api/books/:id` | Finds book, calls `book.update(req.body)`. Returns 404 if not found. |
| `deleteBook(req, res)` | DELETE | `/api/books/:id` | Finds book, calls `book.destroy()`. Returns 404 if not found. |

#### `controllers/memberController.js`

| Function | Method | Route | Description |
|----------|--------|-------|-------------|
| `createMember(req, res)` | POST | `/api/members` | `Member.create(req.body)`. Returns 201. |
| `getAllMembers(req, res)` | GET | `/api/members` | `Member.findAll()`. Returns 200 with count + array. |
| `getMemberById(req, res)` | GET | `/api/members/:id` | `Member.findByPk`. Returns 404 if not found. |
| `getMemberBorrowedBooks(req, res)` | GET | `/api/members/:id/borrowed` | Calls `memberService.getMemberBorrowedBooks(req.params.id)`. Returns active/overdue transactions with nested book data. |
| `updateMember(req, res)` | PUT | `/api/members/:id` | Finds member, calls `member.update(req.body)`. Returns 404 if not found. |
| `deleteMember(req, res)` | DELETE | `/api/members/:id` | Finds member, calls `member.destroy()`. Returns 404 if not found. |

#### `controllers/transactionController.js`

| Function | Method | Route | Description |
|----------|--------|-------|-------------|
| `borrowBook(req, res)` | POST | `/api/transactions/borrow` | Validates `member_id` + `book_id` are present, calls `transactionService.borrowBook()`. Returns 201 on success, 400 on business rule violation. |
| `returnBook(req, res)` | POST | `/api/transactions/:id/return` | Calls `transactionService.returnBook(req.params.id)`. Returns 200 with `{ transaction, fine, overdueDays }`. |
| `getOverdueTransactions(req, res)` | GET | `/api/transactions/overdue` | Calls `transactionService.getOverdueTransactions()`. Returns 200 with count + array. |
| `updateOverdueStatuses(req, res)` | PUT | `/api/transactions/update-overdue` | Calls `transactionService.updateOverdueStatuses()`. Returns count of rows updated. |

#### `controllers/fineController.js`

| Function | Method | Route | Description |
|----------|--------|-------|-------------|
| `payFine(req, res)` | POST | `/api/fines/:id/pay` | Calls `fineService.payFine(req.params.id)`. Returns 200 on success, 400 if already paid or not found. |
| `getAllFines(req, res)` | GET | `/api/fines` | `Fine.findAll({ include: ["member", "transaction"] })`. Returns 200 with count + array. |
| `getUnpaidFines(req, res)` | GET | `/api/fines/member/:memberId/unpaid` | Calls `fineService.getUnpaidFines(req.params.memberId)`. Returns unpaid fines. |
| `getMemberFines(req, res)` | GET | `/api/fines/member/:memberId` | Calls `fineService.getMemberFines(req.params.memberId)`. Returns all fines (paid + unpaid). |

---

### `routes/`

Each routes file creates an `express.Router()`, applies validation middleware for write operations, then maps URLs to controllers. All files are mounted under `/api` in `server.js`.

| Route File | Prefix | Routes Defined |
|------------|--------|----------------|
| `bookRoutes.js` | `/api` | POST `/books`, GET `/books`, GET `/books/available`, GET `/books/:id`, PUT `/books/:id`, DELETE `/books/:id` |
| `memberRoutes.js` | `/api` | POST `/members`, GET `/members`, GET `/members/:id`, GET `/members/:id/borrowed`, PUT `/members/:id`, DELETE `/members/:id` |
| `transactionRoutes.js` | `/api` | POST `/transactions/borrow`, POST `/transactions/:id/return`, GET `/transactions/overdue`, PUT `/transactions/update-overdue` |
| `fineRoutes.js` | `/api` | GET `/fines`, POST `/fines/:id/pay`, GET `/fines/member/:memberId/unpaid`, GET `/fines/member/:memberId` |

---

### `utils/`

#### `utils/dateUtils.js`

Pure date calculation helpers. Uses the `date-fns` library.

| Function | Signature | Returns | Description |
|----------|-----------|---------|-------------|
| `calculateDueDate(borrowedAt, loanPeriodDays=14)` | `(Date, number) → Date` | Due date | Adds `loanPeriodDays` days to `borrowedAt` using `addDays`. Default loan period is 14 days. |
| `calculateOverdueDays(dueDate, returnDate=new Date())` | `(Date, Date) → number` | Days overdue (0 if not overdue) | Uses `isAfter` to check if `returnDate > dueDate`. If so, returns `differenceInDays(returnDate, dueDate)`. Otherwise returns 0. |
| `calculateFineAmount(overdueDays)` | `(number) → number` | Fine in dollars | Multiplies `overdueDays` by `FINE_PER_DAY = 0.50`. |
| `isOverdue(dueDate)` | `(Date) → boolean` | `true` if overdue | Returns `isAfter(now, dueDate)`. Convenience check. |

---

## 6. Business Rules Summary

| Rule | Value | Enforced In |
|------|-------|-------------|
| Max books per member | **3** | `validationService.canMemberBorrow()` |
| Loan period | **14 days** | `transactionService.LOAN_PERIOD_DAYS`, `dateUtils.calculateDueDate()` |
| Late fine rate | **$0.50 / day** | `transactionService.FINE_PER_DAY`, `dateUtils.calculateFineAmount()` |
| Unpaid fines block borrowing | yes | `validationService.hasUnpaidFines()` |
| Suspended member cannot borrow | yes | `validationService.isMemberActive()` |
| Auto-suspend on 3+ overdue books | yes | `memberService.checkAndUpdateSuspension()` (called after every return) |
| Auto-reactivate when overdue < 3 | yes | `memberService.checkAndUpdateSuspension()` |
| Fine created on late return | yes | `transactionService.returnBook()` |

---

## 7. API Endpoint Quick Reference

### Books (`/api/books`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/books` | Create a new book |
| GET | `/api/books` | Get all books |
| GET | `/api/books/available` | Get only available books |
| GET | `/api/books/:id` | Get book by ID |
| PUT | `/api/books/:id` | Update book |
| DELETE | `/api/books/:id` | Delete book |

### Members (`/api/members`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/members` | Register a new member |
| GET | `/api/members` | Get all members |
| GET | `/api/members/:id` | Get member by ID |
| GET | `/api/members/:id/borrowed` | Get active/overdue borrowed books |
| PUT | `/api/members/:id` | Update member |
| DELETE | `/api/members/:id` | Delete member |

### Transactions (`/api/transactions`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/transactions/borrow` | Borrow a book |
| POST | `/api/transactions/:id/return` | Return a book |
| GET | `/api/transactions/overdue` | List all overdue transactions |
| PUT | `/api/transactions/update-overdue` | Batch mark expired actives as overdue |

### Fines (`/api/fines`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/fines` | Get all fines |
| POST | `/api/fines/:id/pay` | Pay a fine |
| GET | `/api/fines/member/:memberId/unpaid` | Get member's unpaid fines |
| GET | `/api/fines/member/:memberId` | Get all member's fines |
