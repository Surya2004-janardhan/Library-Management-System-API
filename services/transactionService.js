const { sequelize, Transaction, Book, Member, Fine } = require("../models");
const { Op } = require("sequelize");
const { calculateDueDate, calculateOverdueDays } = require("../utils/dateUtils");
const { validateBorrowing } = require("./validationService");
const { checkAndUpdateSuspension } = require("./memberService");

/**
 * Transaction Service - Handles borrowing and return operations using Sequelize ORM
 */

// Business rules
const LOAN_PERIOD_DAYS = 14;
const FINE_PER_DAY = 0.5;

/**
 * Borrow a book - handles the complete borrowing workflow with transaction
 */
const borrowBook = async (memberId, bookId) => {
  const t = await sequelize.transaction();

  try {
    // Validate borrowing request
    const validation = await validateBorrowing(memberId, bookId);
    if (!validation.valid) {
      throw new Error(validation.errors.join("; "));
    }

    // Get book and check availability
    const book = await Book.findByPk(bookId, { transaction: t });
    if (!book) {
      throw new Error("Book not found");
    }

    if (book.available_copies <= 0) {
      throw new Error("No available copies");
    }

    // Decrement available copies
    const newAvailableCopies = book.available_copies - 1;
    const newStatus = newAvailableCopies === 0 ? "borrowed" : book.status;

    await book.update(
      {
        available_copies: newAvailableCopies,
        status: newStatus,
      },
      { transaction: t }
    );

    // Create transaction record
    const borrowedAt = new Date();
    const dueDate = calculateDueDate(borrowedAt, LOAN_PERIOD_DAYS);

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

    await t.commit();

    // Fetch with associations
    return await Transaction.findByPk(transaction.id, {
      include: [
        {
          association: "book",
          attributes: ["id", "isbn", "title", "author", "category"],
        },
        {
          association: "member",
          attributes: ["id", "name", "email", "membership_number"],
        },
      ],
    });
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

/**
 * Return a book - handles the complete return workflow with transaction
 */
const returnBook = async (transactionId) => {
  const t = await sequelize.transaction();

  try {
    // Get transaction details
    const transaction = await Transaction.findByPk(transactionId, {
      transaction: t,
    });

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    if (transaction.returned_at) {
      throw new Error("Book already returned");
    }

    const returnedAt = new Date();
    const overdueDays = calculateOverdueDays(transaction.due_date, returnedAt);

    // Update transaction
    await transaction.update(
      {
        returned_at: returnedAt,
        status: "completed",
      },
      { transaction: t }
    );

    // Increment available copies
    const book = await Book.findByPk(transaction.book_id, { transaction: t });
    if (book) {
      await book.update(
        {
          available_copies: book.available_copies + 1,
          status: "available",
        },
        { transaction: t }
      );
    }

    // Calculate and create fine if overdue
    let fine = null;
    if (overdueDays > 0) {
      const fineAmount = overdueDays * FINE_PER_DAY;

      fine = await Fine.create(
        {
          member_id: transaction.member_id,
          transaction_id: transactionId,
          amount: fineAmount,
        },
        { transaction: t }
      );
    }

    await t.commit();

    // Check and update member suspension status
    await checkAndUpdateSuspension(transaction.member_id);

    return {
      transaction: await Transaction.findByPk(transactionId),
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
      status: {
        [Op.in]: ["active", "overdue"],
      },
      due_date: {
        [Op.lt]: new Date(),
      },
      returned_at: null,
    },
    include: [
      {
        association: "book",
        attributes: ["isbn", "title", "author"],
      },
      {
        association: "member",
        attributes: ["name", "email"],
      },
    ],
    order: [["due_date", "ASC"]],
  });
};

/**
 * Update overdue transaction statuses
 */
const updateOverdueStatuses = async () => {
  const [updatedCount] = await Transaction.update(
    { status: "overdue" },
    {
      where: {
        status: "active",
        due_date: {
          [Op.lt]: new Date(),
        },
        returned_at: null,
      },
    }
  );

  return updatedCount;
};

module.exports = {
  borrowBook,
  returnBook,
  getOverdueTransactions,
  updateOverdueStatuses,
  LOAN_PERIOD_DAYS,
  FINE_PER_DAY,
};
