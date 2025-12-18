# Library Management System API - MySQL + Sequelize ORM

A RESTful API for managing library operations using **MySQL database with Sequelize ORM**.

## Tech Stack

- **Runtime**: Node.js v18+
- **Framework**: Express.js v5.2.1
- **Database**: MySQL 8.0+
- **ORM**: Sequelize v6.37+ with mysql2 driver
- **Validation**: express-validator v7.3.1
- **Date Handling**: date-fns v4.1.0

## Why MySQL + Sequelize?

✅ **ORM Benefits**: No raw SQL needed, cleaner code  
✅ **Auto Schema**: Tables created automatically  
✅ **Associations**: Easy JOIN queries with `include`  
✅ **Transactions**: Automatic rollback on errors  
✅ **Validation**: Built-in model validation  
✅ **MySQL Optimized**: Native MySQL performance

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup MySQL Database

```bash
mysql -u root -p
CREATE DATABASE library_management;
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=library_management
DB_USER=root
DB_PASSWORD=your_mysql_password
```

### 4. Start Server

```bash
npm run dev
```

**Sequelize automatically creates all tables!** 🎉

## API Endpoints Documentation

### Books Management

#### Create Book

```http
POST /api/books
Content-Type: application/json

{
  "isbn": "978-0134685991",
  "title": "Effective Java",
  "author": "Joshua Bloch",
  "category": "Programming",
  "total_copies": 5,
  "available_copies": 5
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "isbn": "978-0134685991",
    "title": "Effective Java",
    "author": "Joshua Bloch",
    "category": "Programming",
    "total_copies": 5,
    "available_copies": 5,
    "status": "available",
    "createdAt": "2025-12-18T10:00:00.000Z",
    "updatedAt": "2025-12-18T10:00:00.000Z"
  }
}
```

**Error Response (400 Bad Request):**

```json
{
  "success": false,
  "errors": [
    {
      "type": "field",
      "msg": "ISBN is required",
      "path": "isbn",
      "location": "body"
    }
  ]
}
```

#### Get All Books

```http
GET /api/books
```

**Response (200 OK):**

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": 1,
      "isbn": "978-0134685991",
      "title": "Effective Java",
      "author": "Joshua Bloch",
      "category": "Programming",
      "total_copies": 5,
      "available_copies": 3,
      "status": "available"
    }
  ]
}
```

#### Get Available Books Only

```http
GET /api/books/available
```

**Response (200 OK):**

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": 1,
      "isbn": "978-0134685991",
      "title": "Effective Java",
      "available_copies": 3,
      "status": "available"
    }
  ]
}
```

#### Get Book by ID

```http
GET /api/books/1
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "isbn": "978-0134685991",
    "title": "Effective Java",
    "author": "Joshua Bloch",
    "category": "Programming",
    "total_copies": 5,
    "available_copies": 3,
    "status": "available"
  }
}
```

**Error Response (404 Not Found):**

```json
{
  "success": false,
  "message": "Book not found"
}
```

#### Update Book

```http
PUT /api/books/1
Content-Type: application/json

{
  "title": "Effective Java - 3rd Edition",
  "available_copies": 4
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Effective Java - 3rd Edition",
    "available_copies": 4
  }
}
```

#### Delete Book

```http
DELETE /api/books/1
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Book deleted successfully"
}
```

### Members Management

#### Create Member

```http
POST /api/members
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "membership_number": "MEM001"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "membership_number": "MEM001",
    "status": "active",
    "createdAt": "2025-12-18T10:00:00.000Z"
  }
}
```

#### Get All Members

```http
GET /api/members
```

**Response (200 OK):**

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "membership_number": "MEM001",
      "status": "active"
    }
  ]
}
```

#### Get Member by ID

```http
GET /api/members/1
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "membership_number": "MEM001",
    "status": "active"
  }
}
```

#### Get Member's Borrowed Books

```http
GET /api/members/1/borrowed
```

**Response (200 OK):**

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": 1,
      "member_id": 1,
      "book_id": 1,
      "borrowed_at": "2025-12-04T10:00:00.000Z",
      "due_date": "2025-12-18T10:00:00.000Z",
      "status": "active",
      "book": {
        "id": 1,
        "isbn": "978-0134685991",
        "title": "Effective Java",
        "author": "Joshua Bloch",
        "category": "Programming"
      }
    }
  ]
}
```

#### Update Member

```http
PUT /api/members/1
Content-Type: application/json

{
  "name": "John Smith",
  "status": "active"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Smith",
    "status": "active"
  }
}
```

#### Delete Member

```http
DELETE /api/members/1
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Member deleted successfully"
}
```

### Transactions Management

#### Borrow Book

```http
POST /api/transactions/borrow
Content-Type: application/json

{
  "member_id": 1,
  "book_id": 1
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Book borrowed successfully",
  "data": {
    "id": 1,
    "member_id": 1,
    "book_id": 1,
    "borrowed_at": "2025-12-04T10:00:00.000Z",
    "due_date": "2025-12-18T10:00:00.000Z",
    "status": "active",
    "book": {
      "id": 1,
      "title": "Effective Java",
      "author": "Joshua Bloch"
    },
    "member": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

**Error Responses:**

**3-Book Limit (400 Bad Request):**

```json
{
  "success": false,
  "message": "Member has reached the maximum limit of 3 books"
}
```

**Unpaid Fines (400 Bad Request):**

```json
{
  "success": false,
  "message": "Member has unpaid fines"
}
```

**Member Suspended (400 Bad Request):**

```json
{
  "success": false,
  "message": "Member is not active or does not exist"
}
```

**Book Unavailable (400 Bad Request):**

```json
{
  "success": false,
  "message": "Book is not available"
}
```

#### Return Book

```http
POST /api/transactions/1/return
```

**Response (200 OK - No Fine):**

```json
{
  "success": true,
  "message": "Book returned successfully",
  "data": {
    "transaction": {
      "id": 1,
      "member_id": 1,
      "book_id": 1,
      "borrowed_at": "2025-12-04T10:00:00.000Z",
      "due_date": "2025-12-18T10:00:00.000Z",
      "returned_at": "2025-12-17T10:00:00.000Z",
      "status": "completed"
    },
    "fine": null,
    "overdueDays": 0
  }
}
```

**Response (200 OK - With Fine):**

```json
{
  "success": true,
  "message": "Book returned successfully",
  "data": {
    "transaction": {
      "id": 1,
      "status": "completed",
      "returned_at": "2025-12-25T10:00:00.000Z"
    },
    "fine": {
      "id": 1,
      "member_id": 1,
      "transaction_id": 1,
      "amount": 3.5,
      "paid_at": null
    },
    "overdueDays": 7
  }
}
```

**Error Response (400 Bad Request):**

```json
{
  "success": false,
  "message": "Book already returned"
}
```

#### Get Overdue Transactions

```http
GET /api/transactions/overdue
```

**Response (200 OK):**

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": 1,
      "member_id": 1,
      "book_id": 1,
      "borrowed_at": "2025-11-20T10:00:00.000Z",
      "due_date": "2025-12-04T10:00:00.000Z",
      "status": "overdue",
      "book": {
        "isbn": "978-0134685991",
        "title": "Effective Java",
        "author": "Joshua Bloch"
      },
      "member": {
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  ]
}
```

### Fines Management

#### Get All Fines

```http
GET /api/fines
```

**Response (200 OK):**

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": 1,
      "member_id": 1,
      "transaction_id": 1,
      "amount": 3.5,
      "paid_at": null,
      "member": {
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  ]
}
```

#### Pay Fine

```http
POST /api/fines/1/pay
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Fine paid successfully",
  "data": {
    "id": 1,
    "member_id": 1,
    "transaction_id": 1,
    "amount": 3.5,
    "paid_at": "2025-12-18T10:00:00.000Z"
  }
}
```

**Error Response (400 Bad Request):**

```json
{
  "success": false,
  "message": "Fine already paid"
}
```

#### Get Member's Unpaid Fines

```http
GET /api/fines/member/1/unpaid
```

**Response (200 OK):**

```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "id": 1,
      "member_id": 1,
      "amount": 3.5,
      "paid_at": null
    }
  ]
}
```

## Sequelize Examples

### Create

```javascript
const { Book } = require("../models");

const book = await Book.create({
  isbn: "978-1234567890",
  title: "Example Book",
  author: "John Doe",
  total_copies: 5,
});
```

### Read

```javascript
// Find all
const books = await Book.findAll();

// Find by ID
const book = await Book.findByPk(1);

// With conditions
const available = await Book.findAll({
  where: { available_copies: { [Op.gt]: 0 } },
});

// With relationships (JOIN)
const transaction = await Transaction.findByPk(1, {
  include: ["book", "member"],
});
```

### Update

```javascript
const book = await Book.findByPk(1);
await book.update({ available_copies: 4 });
```

### Delete

```javascript
const book = await Book.findByPk(1);
await book.destroy();
```

## Business Rules Implementation

### Rule 1: Maximum 3 Books Per Member

**Constant:** `MAX_BOOKS_PER_MEMBER = 3`  
**Location:** `services/validationService.js`

**Enforcement:**

```javascript
const canMemberBorrow = async (memberId) => {
  const activeCount = await Transaction.count({
    where: {
      member_id: memberId,
      status: { [Op.in]: ["active", "overdue"] },
    },
  });
  return activeCount < MAX_BOOKS_PER_MEMBER;
};
```

This rule is checked **before** allowing any borrow operation. If a member already has 3 active or overdue books, the system returns:

```json
{
  "success": false,
  "message": "Member has reached the maximum limit of 3 books"
}
```

### Rule 2: 14-Day Loan Period

**Constant:** `LOAN_PERIOD_DAYS = 14`  
**Location:** `services/transactionService.js`

**Enforcement:**

```javascript
const borrowedAt = new Date();
const dueDate = calculateDueDate(borrowedAt, LOAN_PERIOD_DAYS);

await Transaction.create({
  member_id: memberId,
  book_id: bookId,
  borrowed_at: borrowedAt,
  due_date: dueDate,
  status: "active",
});
```

Every transaction is created with `due_date` automatically set to **14 days** from `borrowed_at` timestamp.

### Rule 3: $0.50 Per Day Overdue Fine

**Constant:** `FINE_PER_DAY = 0.5`  
**Location:** `utils/dateUtils.js`

**Enforcement:**

```javascript
const calculateOverdueDays = (dueDate, returnDate = new Date()) => {
  if (!isAfter(returnDate, dueDate)) return 0;
  return differenceInDays(returnDate, dueDate);
};

const calculateFineAmount = (overdueDays) => {
  const FINE_PER_DAY = 0.5;
  return overdueDays * FINE_PER_DAY;
};
```

When a book is returned late, the system:

1. Calculates days overdue: `returned_at - due_date`
2. Multiplies by $0.50
3. Creates a Fine record automatically

**Example:** Book due on Dec 1, returned Dec 8 = 7 days × $0.50 = **$3.50 fine**

### Rule 4: Unpaid Fines Block New Borrowing

**Location:** `services/validationService.js`

**Enforcement:**

```javascript
const hasUnpaidFines = async (memberId) => {
  const count = await Fine.count({
    where: {
      member_id: memberId,
      paid_at: null,
    },
  });
  return count > 0;
};

const validateBorrowing = async (memberId, bookId) => {
  const hasFines = await hasUnpaidFines(memberId);
  if (hasFines) {
    errors.push("Member has unpaid fines");
  }
};
```

**Before** any borrow operation, the system checks for unpaid fines. If found, borrowing is blocked with:

```json
{
  "success": false,
  "message": "Member has unpaid fines"
}
```

### Rule 5: Auto-Suspend at 3+ Overdue Books

**Threshold:** `3 or more overdue transactions`  
**Location:** `services/memberService.js`

**Enforcement:**

```javascript
const checkAndUpdateSuspension = async (memberId) => {
  const overdueCount = await Transaction.count({
    where: {
      member_id: memberId,
      status: "overdue",
    },
  });

  if (overdueCount >= 3) {
    await member.update({ status: "suspended" });
  } else if (overdueCount < 3 && member.status === "suspended") {
    await member.update({ status: "active" });
  }
};
```

**Trigger:** This check runs automatically:

- After every book return
- When updating overdue statuses (scheduled job)

**Effect:** Member status changes to `suspended`, preventing all new borrowing until they return books and reduce overdue count below 3.

### Business Rules Validation Flow

```
Borrow Request
     │
     ▼
┌─────────────────────┐
│ Validate Member     │ → Check if active (not suspended)
│                     │ → Check if < 3 books borrowed
│                     │ → Check no unpaid fines
└─────────────────────┘
     │
     ▼
┌─────────────────────┐
│ Validate Book       │ → Check if available_copies > 0
│                     │ → Check status allows borrowing
└─────────────────────┘
     │
     ▼
┌─────────────────────┐
│ Execute Transaction │ → Decrement available_copies
│ (Atomic)            │ → Create transaction record
│                     │ → Set due_date = +14 days
└─────────────────────┘

Return Request
     │
     ▼
┌─────────────────────┐
│ Calculate Overdue   │ → returned_at - due_date
│                     │ → If > 0: create fine
└─────────────────────┘
     │
     ▼
┌─────────────────────┐
│ Update Records      │ → Increment available_copies
│ (Atomic)            │ → Set transaction.returned_at
│                     │ → Set transaction.status = "completed"
└─────────────────────┘
     │
     ▼
┌─────────────────────┐
│ Check Suspension    │ → Count overdue transactions
│                     │ → If >= 3: suspend member
│                     │ → If < 3: activate if suspended
└─────────────────────┘
```

## Database Schema

### Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│      BOOK       │       │  TRANSACTION    │       │     MEMBER      │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │◄──────│ book_id (FK)    │──────►│ id (PK)         │
│ isbn (UNIQUE)   │       │ member_id (FK)  │       │ membership_no   │
│ title           │       │ borrowed_at     │       │ name            │
│ author          │       │ due_date        │       │ email (UNIQUE)  │
│ category        │       │ returned_at     │       │ status          │
│ total_copies    │       │ status          │       │   - active      │
│ available_copies│       │   - active      │       │   - suspended   │
│ status          │       │   - overdue     │       │ created_at      │
│   - available   │       │   - completed   │       │ updated_at      │
│   - borrowed    │       │ created_at      │       └─────────────────┘
│   - reserved    │       │ updated_at      │                │
│   - maintenance │       └─────────────────┘                │
│ created_at      │                │                         │
│ updated_at      │                │                         │
└─────────────────┘                ▼                         ▼
                           ┌─────────────────┐
                           │      FINE       │
                           ├─────────────────┤
                           │ id (PK)         │
                           │ member_id (FK)  │
                           │ transaction_id  │
                           │ amount          │
                           │ paid_at         │
                           │ created_at      │
                           │ updated_at      │
                           └─────────────────┘
```

### Table Definitions

**Books Table**

```sql
CREATE TABLE books (
  id INT PRIMARY KEY AUTO_INCREMENT,
  isbn VARCHAR(20) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  total_copies INT NOT NULL DEFAULT 1,
  available_copies INT NOT NULL DEFAULT 1,
  status ENUM('available', 'borrowed', 'reserved', 'maintenance') DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Members Table**

```sql
CREATE TABLE members (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  membership_number VARCHAR(50) UNIQUE NOT NULL,
  status ENUM('active', 'suspended') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Transactions Table**

```sql
CREATE TABLE transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  member_id INT NOT NULL,
  book_id INT NOT NULL,
  borrowed_at TIMESTAMP NOT NULL,
  due_date TIMESTAMP NOT NULL,
  returned_at TIMESTAMP NULL,
  status ENUM('active', 'overdue', 'completed') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id),
  FOREIGN KEY (book_id) REFERENCES books(id)
);
```

**Fines Table**

```sql
CREATE TABLE fines (
  id INT PRIMARY KEY AUTO_INCREMENT,
  member_id INT NOT NULL,
  transaction_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  paid_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id),
  FOREIGN KEY (transaction_id) REFERENCES transactions(id)
);
```

## State Machine Implementation

### Book Status State Machine

```
┌─────────────────────────────────────────────────────────┐
│                    Book State Transitions                │
└─────────────────────────────────────────────────────────┘

    ┌──────────────┐
    │  available   │ ◄─────────────────┐
    └──────────────┘                   │
         │   │   │                     │
         │   │   └────────┐            │
         │   │            │            │
         ▼   ▼            ▼            │
    ┌─────────┐    ┌───────────┐  ┌────────┐
    │borrowed │    │ reserved  │  │maintain│
    └─────────┘    └───────────┘  └────────┘
         │              │   │          │
         └──────────────┴───┴──────────┘

Valid Transitions (enforced in bookService.js):
- available → borrowed (when member borrows)
- available → reserved (when member reserves)
- available → maintenance (for repairs)
- borrowed → available (when returned)
- reserved → borrowed (when picked up)
- reserved → available (when cancelled)
- maintenance → available (when repaired)
```

**Implementation in `services/bookService.js`:**

```javascript
const VALID_TRANSITIONS = {
  available: ["borrowed", "maintenance", "reserved"],
  borrowed: ["available"],
  maintenance: ["available"],
  reserved: ["borrowed", "available"],
};

const canTransitionTo = (currentStatus, newStatus) => {
  const validStates = VALID_TRANSITIONS[currentStatus];
  return validStates && validStates.includes(newStatus);
};
```

### Member Status State Machine

```
    ┌──────────┐
    │  active  │ ◄──────────────┐
    └──────────┘                │
         │                      │
         │ (3+ overdue books)   │ (< 3 overdue)
         ▼                      │
    ┌──────────┐                │
    │suspended │ ───────────────┘
    └──────────┘
```

**Auto-Suspension Logic in `services/memberService.js`:**

```javascript
const checkAndUpdateSuspension = async (memberId) => {
  const overdueCount = await Transaction.count({
    where: {
      member_id: memberId,
      status: "overdue",
    },
  });

  if (overdueCount >= 3) {
    return await suspendMember(memberId);
  } else {
    const member = await Member.findByPk(memberId);
    if (member && member.status === "suspended") {
      return await activateMember(memberId);
    }
  }
  return await Member.findByPk(memberId);
};
```

## Example Usage

### Borrow a Book

```bash
curl -X POST http://localhost:3000/api/transactions/borrow \
  -H "Content-Type: application/json" \
  -d '{"member_id": 1, "book_id": 1}'
```

**What Happens**:

1. Validates member is active
2. Checks < 3 books borrowed
3. Verifies no unpaid fines
4. Decrements available copies
5. Creates transaction (14-day due date)
6. All in a database transaction

### Return a Book

```bash
curl -X POST http://localhost:3000/api/transactions/1/return
```

**What Happens**:

1. Increments available copies
2. Calculates overdue days
3. Creates fine if overdue
4. Checks member suspension
5. Atomic transaction

## Project Structure

```
library-management-system/
├── config/
│   └── database.js          # Sequelize MySQL configuration
├── controllers/
│   ├── bookController.js     # Book CRUD endpoints
│   ├── memberController.js   # Member CRUD endpoints
│   ├── transactionController.js  # Borrow/return logic
│   └── fineController.js     # Fine management
├── middleware/
│   ├── errorHandler.js       # Global error handling
│   └── validator.js          # express-validator rules
├── models/
│   ├── index.js              # Model associations
│   ├── Book.js               # Book model with status enum
│   ├── Member.js             # Member model with status enum
│   ├── Transaction.js        # Transaction model
│   └── Fine.js               # Fine model
├── routes/
│   ├── bookRoutes.js         # Book endpoints
│   ├── memberRoutes.js       # Member endpoints
│   ├── transactionRoutes.js  # Transaction endpoints
│   └── fineRoutes.js         # Fine endpoints
├── services/
│   ├── bookService.js        # Book state machine logic
│   ├── memberService.js      # Member suspension logic
│   ├── transactionService.js # Borrow/return workflow
│   ├── fineService.js        # Fine calculations
│   └── validationService.js  # Business rules validation
├── utils/
│   └── dateUtils.js          # Date calculations (due dates, fines)
├── postman/
│   └── Library-Management-System.postman_collection.json
├── .env                      # Environment variables
├── .env.example              # Environment template
├── package.json              # Dependencies
├── server.js                 # Express app entry point
└── README.md                 # This file
```

## Error Handling & HTTP Status Codes

### HTTP Status Codes

| Code    | Usage                                     | Example                               |
| ------- | ----------------------------------------- | ------------------------------------- |
| **200** | Successful GET, PUT, POST (return)        | Book retrieved, updated successfully  |
| **201** | Resource created                          | Book created, Member registered       |
| **400** | Validation error, business rule violation | Invalid ISBN, 3-book limit exceeded   |
| **404** | Resource not found                        | Book/Member/Transaction doesn't exist |
| **500** | Server error                              | Database connection failure           |

### Error Response Formats

All error responses follow consistent formats for easy client-side handling.

## Testing Guide

### Using Postman Collection

1. Import `postman/Library-Management-System.postman_collection.json` into Postman
2. Ensure server is running on `http://localhost:3000`
3. Run requests in order:
   - Create books
   - Create members
   - Test borrow operations
   - Test return operations
   - Verify business rules

### Test Coverage

✅ **CRUD Operations:** All endpoints tested  
✅ **Validation:** Required fields, format checks  
✅ **Business Rules:** All 5 rules enforced and tested  
✅ **State Transitions:** Book status changes validated  
✅ **Error Handling:** All error scenarios covered  
✅ **Database Integrity:** Foreign keys, transactions working

## License

MIT
