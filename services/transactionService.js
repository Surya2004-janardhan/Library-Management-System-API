const { pool } = require("../config/database");
const TransactionModel = require("../models/transactionModel");
const BookModel = require("../models/bookModel");
const MemberModel = require("../models/memberModel");
const FineModel = require("../models/fineModel");
const { calculateDueDate, calculateOverdueDays } = require("../utils/dateUtils");
const { validateBorrowing } = require("./validationService");
const { suspendMember, checkAndUpdateSuspension } = require("./memberService");

/**
 * Transaction Service - Handles borrowing and return operations
 */

// Business rules
const LOAN_PERIOD_DAYS = 14;
const FINE_PER_DAY = 0.5;

/**
 * Borrow a book - handles the complete borrowing workflow
 */
const borrowBook = async (memberId, bookId) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Validate borrowing request
    const validation = await validateBorrowing(memberId, bookId);
    if (!validation.valid) {
      throw new Error(validation.errors.join("; "));
    }

    // Get book and member details
    const book = await BookModel.findById(bookId);
    const member = await MemberModel.findById(memberId);

    if (!book || !member) {
      throw new Error("Book or member not found");
    }

    // Decrement available copies
    await client.query(
      "UPDATE books SET available_copies = available_copies - 1 WHERE id = $1",
      [bookId]
    );

    // Update book status if no copies left
    if (book.available_copies - 1 === 0) {
      await client.query("UPDATE books SET status = $1 WHERE id = $2", [
        "borrowed",
        bookId,
      ]);
    }

    // Create transaction record
    const borrowedAt = new Date();
    const dueDate = calculateDueDate(borrowedAt, LOAN_PERIOD_DAYS);

    const result = await client.query(
      `INSERT INTO transactions (member_id, book_id, borrowed_at, due_date, status)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [memberId, bookId, borrowedAt, dueDate, "active"]
    );

    await client.query("COMMIT");

    return await TransactionModel.findByIdWithDetails(result.rows[0].id);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Return a book - handles the complete return workflow
 */
const returnBook = async (transactionId) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Get transaction details
    const transaction = await TransactionModel.findById(transactionId);

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    if (transaction.returned_at) {
      throw new Error("Book already returned");
    }

    const returnedAt = new Date();
    const overdueDays = calculateOverdueDays(transaction.due_date, returnedAt);

    // Update transaction
    await client.query(
      "UPDATE transactions SET returned_at = $1, status = $2 WHERE id = $3",
      [returnedAt, "completed", transactionId]
    );

    // Increment available copies
    await client.query(
      "UPDATE books SET available_copies = available_copies + 1 WHERE id = $1",
      [transaction.book_id]
    );

    // Update book status to available
    await client.query("UPDATE books SET status = $1 WHERE id = $2", [
      "available",
      transaction.book_id,
    ]);

    // Calculate and create fine if overdue
    let fine = null;
    if (overdueDays > 0) {
      const fineAmount = overdueDays * FINE_PER_DAY;

      const fineResult = await client.query(
        `INSERT INTO fines (member_id, transaction_id, amount)
         VALUES ($1, $2, $3) RETURNING *`,
        [transaction.member_id, transactionId, fineAmount]
      );

      fine = fineResult.rows[0];
    }

    // Check and update member suspension status
    await checkAndUpdateSuspension(transaction.member_id);

    await client.query("COMMIT");

    return {
      transaction: await TransactionModel.findById(transactionId),
      fine,
      overdueDays,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Get all overdue transactions
 */
const getOverdueTransactions = async () => {
  return await TransactionModel.findOverdue();
};

/**
 * Update overdue transaction statuses
 */
const updateOverdueStatuses = async () => {
  const overdueTransactions = await TransactionModel.findActiveOverdue();

  for (const transaction of overdueTransactions) {
    await TransactionModel.update(transaction.id, { status: "overdue" });
  }

  return overdueTransactions.length;
};

module.exports = {
  borrowBook,
  returnBook,
  getOverdueTransactions,
  updateOverdueStatuses,
  LOAN_PERIOD_DAYS,
  FINE_PER_DAY,
};
