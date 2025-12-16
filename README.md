# Library Management System API

A comprehensive RESTful API for managing a library system with books, members, borrowing transactions, and fines. Built with Node.js, Express, and PostgreSQL.

## 🎯 Features

- **Book Management**: Full CRUD operations for books with availability tracking
- **Member Management**: Member registration and status management
- **Transaction System**: Borrow and return book operations with due date tracking
- **Fine Management**: Automatic fine calculation for overdue books ($0.50/day)
- **Business Rules Enforcement**:
  - Maximum 3 books per member
  - 14-day loan period
  - Auto-suspension for 3+ overdue books
  - Borrowing blocked for unpaid fines
- **State Machine**: Proper book status transitions (available → borrowed → returned)

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd Library-Management-System
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

Create a PostgreSQL database:

```sql
CREATE DATABASE library_management;
```

### 4. Environment Configuration

Copy `.env.example` to `.env` and update the values:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=library_management
DB_USER=postgres
DB_PASSWORD=your_password

PORT=3000
NODE_ENV=development
```

### 5. Start the Server

Development mode (with auto-restart):

```bash
npm run dev
```

Production mode:

```bash
npm start
```

The API will be available at `http://localhost:3000/api`

## 📊 Database Schema

### Books

```
- id (PK, Auto-increment)
- isbn (Unique, 10-13 chars)
- title
- author
- category
- status (ENUM: available, borrowed, reserved, maintenance)
- total_copies
- available_copies
- created_at, updated_at
```

### Members

```
- id (PK, Auto-increment)
- name
- email (Unique)
- membership_number (Unique)
- status (ENUM: active, suspended)
- created_at, updated_at
```

### Transactions

```
- id (PK, Auto-increment)
- book_id (FK → books)
- member_id (FK → members)
- borrowed_at
- due_date
- returned_at (Nullable)
- status (ENUM: active, returned, overdue)
- created_at, updated_at
```

### Fines

```
- id (PK, Auto-increment)
- member_id (FK → members)
- transaction_id (FK → transactions)
- amount (Decimal)
- paid_at (Nullable)
- created_at, updated_at
```

## 📚 API Endpoints

### Books

#### Create Book

```http
POST /api/books
Content-Type: application/json

{
  "isbn": "9780134685991",
  "title": "Effective Java",
  "author": "Joshua Bloch",
  "category": "Programming",
  "total_copies": 5,
  "available_copies": 5
}
```

#### Get All Books

```http
GET /api/books
```

#### Get Available Books

```http
GET /api/books/available
```

#### Get Book by ID

```http
GET /api/books/{id}
```

#### Update Book

```http
PUT /api/books/{id}
Content-Type: application/json

{
  "title": "Updated Title",
  "available_copies": 3
}
```

#### Delete Book

```http
DELETE /api/books/{id}
```

### Members

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

#### Get All Members

```http
GET /api/members
```

#### Get Member by ID

```http
GET /api/members/{id}
```

#### Get Member's Borrowed Books

```http
GET /api/members/{id}/borrowed
```

#### Update Member

```http
PUT /api/members/{id}
Content-Type: application/json

{
  "name": "John Smith",
  "status": "active"
}
```

#### Delete Member

```http
DELETE /api/members/{id}
```

### Transactions

#### Borrow Book

```http
POST /api/transactions/borrow
Content-Type: application/json

{
  "member_id": 1,
  "book_id": 1
}
```

**Business Rules Checked:**

- Member status must be 'active'
- Member must have < 3 active transactions
- Member must have no unpaid fines
- Book must have available copies

#### Return Book

```http
POST /api/transactions/{id}/return
```

**Actions Performed:**

- Updates transaction status to 'returned'
- Calculates overdue days and creates fine if applicable
- Increments book's available_copies
- Checks if member should be suspended

#### Get Overdue Transactions

```http
GET /api/transactions/overdue
```

#### Update Overdue Statuses (Admin/Scheduled Job)

```http
POST /api/transactions/update-overdue
```

### Fines

#### Get All Fines

```http
GET /api/fines
```

#### Pay Fine

```http
POST /api/fines/{id}/pay
```

#### Get Member's Unpaid Fines

```http
GET /api/fines/member/{memberId}/unpaid
```

#### Get All Member's Fines

```http
GET /api/fines/member/{memberId}
```

## 🔄 State Machine Logic

### Book Status Transitions

```
available → borrowed (when borrowed)
borrowed → available (when returned)
available → maintenance (admin action)
maintenance → available (admin action)
```

### Transaction Status Flow

```
active → overdue (when past due_date)
active → returned (when returned on time)
overdue → returned (when returned late, creates fine)
```

### Member Status Management

```
active → suspended (when 3+ overdue books)
suspended → active (when all fines paid and < 3 overdue books)
```

## 💰 Fine Calculation

- **Rate**: $0.50 per day
- **Trigger**: Book returned after due_date
- **Formula**: `fine_amount = overdue_days × 0.50`
- **Example**: 5 days overdue = $2.50 fine

## 🛡️ Business Rules

1. **Borrowing Limit**: Maximum 3 books per member
2. **Loan Period**: 14 days from borrow date
3. **Overdue Penalty**: $0.50 per day
4. **Borrowing Restrictions**: Members with unpaid fines cannot borrow
5. **Auto-Suspension**: 3+ concurrent overdue books triggers suspension

## 🗂️ Project Structure

```
library-management-system/
├── config/
│   └── database.js          # Database configuration
├── models/
│   ├── Book.js             # Book model
│   ├── Member.js           # Member model
│   ├── Transaction.js      # Transaction model
│   ├── Fine.js             # Fine model
│   └── index.js            # Model associations
├── controllers/
│   ├── bookController.js
│   ├── memberController.js
│   ├── transactionController.js
│   └── fineController.js
├── services/
│   ├── bookService.js          # Book state machine
│   ├── memberService.js        # Member status management
│   ├── transactionService.js   # Transaction logic
│   ├── fineService.js          # Fine operations
│   └── validationService.js    # Business rules validation
├── routes/
│   ├── bookRoutes.js
│   ├── memberRoutes.js
│   ├── transactionRoutes.js
│   └── fineRoutes.js
├── middleware/
│   ├── validator.js        # Input validation
│   └── errorHandler.js     # Error handling
├── utils/
│   └── dateUtils.js        # Date calculations
├── .env                    # Environment variables
├── .env.example            # Environment template
├── package.json
├── server.js               # Application entry point
└── README.md
```

## 🧪 Testing with Postman

A Postman collection is available in the repository for easy API testing. Import it into Postman and update the base URL if needed.

### Example Test Flow:

1. **Create a book**
2. **Create a member**
3. **Borrow the book** (creates active transaction)
4. **Check member's borrowed books**
5. **Return the book** (after due date to test fine creation)
6. **Check overdue transactions**
7. **Pay the fine**

## 🚨 Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Valid email is required"
    }
  ]
}
```

### HTTP Status Codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `404` - Not Found
- `409` - Conflict (duplicate entry)
- `500` - Internal Server Error

## 🔧 Development

### Code Organization

- **Models**: Database schema definitions with Sequelize
- **Controllers**: Request handling and response formatting
- **Services**: Business logic and state management
- **Routes**: API endpoint definitions
- **Middleware**: Validation and error handling
- **Utils**: Helper functions (date calculations, etc.)

### Key Design Decisions

1. **Service Layer Pattern**: Business logic separated from controllers for testability
2. **State Machine**: Centralized book status transition validation
3. **Transaction Management**: Database transactions for data consistency
4. **Validation Layer**: Input validation using express-validator
5. **Error Handling**: Centralized error handler for consistent responses

## 📝 License

ISC

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

---

Built with ❤️ using Node.js, Express, and PostgreSQL
