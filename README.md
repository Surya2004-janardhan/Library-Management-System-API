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

## API Endpoints

### Books

- `POST /api/books` - Create book
- `GET /api/books` - Get all books
- `GET /api/books/available` - Available books only
- `GET /api/books/:id` - Get book
- `PUT /api/books/:id` - Update book
- `DELETE /api/books/:id` - Delete book

### Members

- `POST /api/members` - Register member
- `GET /api/members` - All members
- `GET /api/members/:id` - Get member
- `GET /api/members/:id/books` - Member's borrowed books
- `PUT /api/members/:id` - Update member
- `DELETE /api/members/:id` - Delete member

### Transactions

- `POST /api/transactions/borrow` - Borrow book
- `PUT /api/transactions/:id/return` - Return book
- `GET /api/transactions/overdue` - Overdue transactions

### Fines

- `GET /api/fines` - All fines
- `GET /api/fines/members/:id` - Member's fines
- `PUT /api/fines/:id/pay` - Pay fine

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

## Business Rules

- **Max Books**: 3 per member
- **Loan Period**: 14 days
- **Fine Rate**: $0.50/day overdue
- **Auto-Suspend**: At 3+ overdue books
- **No Borrowing**: With unpaid fines

## Database Models

### Book

- ISBN, Title, Author, Category
- Total & Available Copies
- Status: available | borrowed | maintenance | reserved

### Member

- Name, Email, Membership Number
- Status: active | suspended

### Transaction

- Member, Book, Dates
- Status: active | overdue | completed

### Fine

- Amount, Transaction, Paid Date

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
curl -X PUT http://localhost:3000/api/transactions/1/return
```

**What Happens**:

1. Increments available copies
2. Calculates overdue days
3. Creates fine if overdue
4. Checks member suspension
5. Atomic transaction

## Project Structure

```
├── models/          # Sequelize ORM models
├── services/        # Business logic
├── controllers/     # HTTP handlers
├── routes/          # API routes
├── middleware/      # Validation
└── config/          # Database config
```

## License

MIT
