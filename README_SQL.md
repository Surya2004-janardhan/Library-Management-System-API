# Library Management System API - SQL-Based Implementation

A RESTful API for managing library operations using **pure SQL with PostgreSQL** and the `pg` library.

## Architecture

- **Pure SQL**: Direct PostgreSQL queries using the `pg` library (no ORM)
- **Functional Programming**: All services and controllers use pure functions
- **Service Layer Pattern**: Business logic separated into dedicated services
- **State Machine**: Book status transitions with validation
- **Transaction Support**: Database transactions for complex operations

## Tech Stack

- **Runtime**: Node.js v18+
- **Framework**: Express.js v5.2.1
- **Database**: PostgreSQL with `pg` client library
- **Validation**: express-validator v7.3.1
- **Date Handling**: date-fns v4.1.0

## Project Structure

```
├── config/
│   ├── database.js          # PostgreSQL connection pool
│   └── schema.sql            # Database schema (tables, indexes, triggers)
├── models/                   # SQL-based models (CRUD operations)
│   ├── bookModel.js
│   ├── memberModel.js
│   ├── transactionModel.js
│   └── fineModel.js
├── services/                 # Business logic layer
│   ├── bookService.js        # Book state machine
│   ├── memberService.js      # Member status management
│   ├── validationService.js  # Business rules validation
│   ├── transactionService.js # Borrow/return workflow
│   └── fineService.js        # Fine calculations
├── controllers/              # HTTP request handlers
├── routes/                   # API endpoint definitions
├── middleware/               # Validation & error handling
└── utils/                    # Date utilities
```

## Database Schema

The system uses PostgreSQL with the following tables:

### Books
- `id`, `isbn`, `title`, `author`, `category`
- `total_copies`, `available_copies`, `status`
- **State Machine**: available → borrowed → available
- **Indexes**: isbn, title, status

### Members
- `id`, `name`, `email`, `membership_number`, `status`
- **Auto-suspension**: At 3+ overdue books
- **Index**: email (unique)

### Transactions
- `id`, `member_id`, `book_id`, `borrowed_at`, `due_date`, `returned_at`, `status`
- **Loan Period**: 14 days
- **Statuses**: active, overdue, completed
- **Indexes**: member_id, book_id, status, due_date

### Fines
- `id`, `member_id`, `transaction_id`, `amount`, `paid_at`
- **Rate**: $0.50 per day overdue
- **Index**: member_id, paid_at

## SQL-Based Models

Each model provides clean CRUD operations:

```javascript
// Example: bookModel.js
const create = async (bookData) => {
  const result = await query(
    'INSERT INTO books (isbn, title, author) VALUES ($1, $2, $3) RETURNING *',
    [bookData.isbn, bookData.title, bookData.author]
  );
  return result.rows[0];
};

const findById = async (id) => {
  const result = await query('SELECT * FROM books WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const update = async (id, bookData) => {
  // Dynamic field building
  const fields = Object.keys(bookData).map((key, i) => `${key} = $${i + 1}`);
  const values = [...Object.values(bookData), id];
  const result = await query(
    `UPDATE books SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING *`,
    values
  );
  return result.rows[0];
};
```

## Setup Instructions

### 1. Prerequisites
- Node.js v18+
- PostgreSQL 12+

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Setup
```bash
# Create PostgreSQL database
createdb library_management

# Or using psql
psql -U postgres
CREATE DATABASE library_management;
```

### 4. Configure Environment
```bash
cp .env.example .env
# Edit .env with your database credentials
```

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=library_management
DB_USER=postgres
DB_PASSWORD=your_password

# Set to true for initial setup to run schema.sql
INIT_DB=true
```

### 5. Initialize Database Schema
```bash
# Option 1: Automatic (on first run)
# Set INIT_DB=true in .env
npm start

# Option 2: Manual
psql -U postgres -d library_management -f config/schema.sql
```

### 6. Run the Server
```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

Server runs on: `http://localhost:3000`

## API Endpoints

### Books
- `POST /api/books` - Create book
- `GET /api/books` - Get all books
- `GET /api/books/available` - Get available books
- `GET /api/books/:id` - Get book by ID
- `PUT /api/books/:id` - Update book
- `DELETE /api/books/:id` - Delete book

### Members
- `POST /api/members` - Create member
- `GET /api/members` - Get all members
- `GET /api/members/:id` - Get member by ID
- `GET /api/members/:id/books` - Get member's borrowed books
- `PUT /api/members/:id` - Update member
- `DELETE /api/members/:id` - Delete member

### Transactions
- `POST /api/transactions/borrow` - Borrow a book
- `PUT /api/transactions/:id/return` - Return a book
- `GET /api/transactions/overdue` - Get overdue transactions
- `PUT /api/transactions/update-overdue` - Update overdue statuses

### Fines
- `GET /api/fines` - Get all fines
- `GET /api/fines/members/:memberId` - Get member's fines
- `PUT /api/fines/:id/pay` - Pay a fine

## Business Rules

1. **Borrowing Limits**: Max 3 books per member
2. **Loan Period**: 14 days
3. **Overdue Fines**: $0.50 per day
4. **Auto-Suspension**: Member suspended at 3+ overdue books
5. **Fine Restriction**: Cannot borrow with unpaid fines
6. **Book State Machine**: Validated status transitions

## Example Requests

### Borrow a Book
```bash
POST /api/transactions/borrow
Content-Type: application/json

{
  "member_id": 1,
  "book_id": 1
}
```

**Validation Checks**:
- Member is active (not suspended)
- Member has < 3 active borrows
- Member has no unpaid fines
- Book is available

### Return a Book
```bash
PUT /api/transactions/1/return
```

**Automatic Processing**:
- Increments available book copies
- Calculates overdue days
- Creates fine if overdue ($0.50/day)
- Updates member suspension status
- Returns transaction with fine details

## SQL Query Examples

```javascript
// Complex JOIN query (transactionModel.js)
const findByIdWithDetails = async (id) => {
  const result = await query(
    `SELECT t.*, 
            b.isbn, b.title, b.author,
            m.name as member_name, m.email
     FROM transactions t
     JOIN books b ON t.book_id = b.id
     JOIN members m ON t.member_id = m.id
     WHERE t.id = $1`,
    [id]
  );
  return result.rows[0];
};

// Transaction support (transactionService.js)
const borrowBook = async (memberId, bookId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Multiple queries within transaction
    await client.query('UPDATE books SET available_copies = available_copies - 1...');
    await client.query('INSERT INTO transactions...');
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
```

## Testing

```bash
# Health check
curl http://localhost:3000/health

# Create a book
curl -X POST http://localhost:3000/api/books \
  -H "Content-Type: application/json" \
  -d '{"isbn":"978-1234567890","title":"Test Book","author":"Test Author","total_copies":5}'

# Get all books
curl http://localhost:3000/api/books
```

## Error Handling

All errors return consistent JSON format:

```json
{
  "success": false,
  "message": "Error description"
}
```

## Database Connection

```javascript
// config/database.js
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const query = async (text, params) => pool.query(text, params);

module.exports = { pool, query };
```

## Benefits of SQL-Based Approach

1. **Performance**: Direct SQL queries, no ORM overhead
2. **Clarity**: Clear visibility into database operations
3. **Control**: Full control over query optimization
4. **Flexibility**: Easy to write complex JOINs and aggregations
5. **Simplicity**: No ORM configuration or model definitions
6. **Debugging**: SQL queries are visible and easy to debug

## Development

- All functions are pure and testable
- Services contain business logic
- Models handle database operations
- Controllers manage HTTP requests
- Clear separation of concerns

## Future Enhancements

- [ ] Add pagination for list endpoints
- [ ] Implement full-text search for books
- [ ] Add reservation system
- [ ] Email notifications for due dates
- [ ] Member activity history
- [ ] Analytics dashboard

## License

MIT
