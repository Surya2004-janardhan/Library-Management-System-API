const { Transaction, Fine } = require("../models");
const { sequelize } = require("../config/database");
const {
  decrementAvailableCopies,
  incrementAvailableCopies,
} = require("./bookService");
const { checkAndUpdateSuspension } = require("./memberService");
const { validateBorrowing } = require("./validationService");
const {
  calculateDueDate,
  calculateOverdueDays,
  calculateFineAmount,
} = require("../utils/dateUtils");
const { Op } = require("sequelize");

/**
 * Transaction service for borrow/return operations
 */

/**
 * Borrow a book
 */
const borrowBook = async (memberId, bookId) => {
  const t = await sequelize.transaction();

  try {
    // Validate all business rules
    const validation = await validateBorrowing(memberId, bookId);

    if (!validation.valid) {
      throw new Error(validation.message);
    }

    // Create transaction
    const borrowedAt = new Date();
    const dueDate = calculateDueDate(borrowedAt);

    const transaction = await Transaction.create(
      {
        member_id: memberId,
        book_id: bookId,
        borrowed_at: borrowedAt,
        due_date: dueDate,
        status: "active",
      },
      { transaction: t }
    );

    // Update book availability
    await decrementAvailableCopies(bookId, t);

    await t.commit();

    // Return transaction with related data
    return await Transaction.findByPk(transaction.id, {
      include: ["book", "member"],
    });
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

/**
 * Return a book
 */
const returnBook = async (transactionId) => {
  const t = await sequelize.transaction();

  try {
    const transaction = await Transaction.findByPk(transactionId, {
      include: ["book", "member"],
      transaction: t,
    });

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    if (transaction.status === "returned") {
      throw new Error("Book already returned");
    }

    const returnedAt = new Date();
    const overdueDays = calculateOverdueDays(transaction.due_date, returnedAt);

    // Update transaction
    transaction.returned_at = returnedAt;
    transaction.status = "returned";
    await transaction.save({ transaction: t });

    // Create fine if overdue
    let fine = null;
    if (overdueDays > 0) {
      const amount = calculateFineAmount(overdueDays);
      fine = await Fine.create(
        {
          member_id: transaction.member_id,
          transaction_id: transaction.id,
          amount: amount,
        },
        { transaction: t }
      );
    }

    // Increment book availability
    await incrementAvailableCopies(transaction.book_id, t);

    // Check member suspension status
    await checkAndUpdateSuspension(transaction.member_id, t);

    await t.commit();

    return {
      transaction,
      fine,
      overdueDays,
    };
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

/**
 * Get all overdue transactions
 */
const getOverdueTransactions = async () => {
  return await Transaction.findAll({
    where: {
      status: { [Op.in]: ["active", "overdue"] },
      due_date: { [Op.lt]: new Date() },
      returned_at: null,
    },
    include: ["book", "member"],
    order: [["due_date", "ASC"]],
  });
};

/**
 * Update overdue transaction statuses (for scheduled job)
 */
const updateOverdueStatuses = async () => {
  const overdueTransactions = await Transaction.findAll({
    where: {
      status: "active",
      due_date: { [Op.lt]: new Date() },
      returned_at: null,
    },
  });

  const updates = overdueTransactions.map(async (transaction) => {
    transaction.status = "overdue";
    await transaction.save();

    // Check if member should be suspended
    await checkAndUpdateSuspension(transaction.member_id);
  });

  await Promise.all(updates);

  return overdueTransactions.length;
};

module.exports = {
  borrowBook,
  returnBook,
  getOverdueTransactions,
  updateOverdueStatuses,
};
