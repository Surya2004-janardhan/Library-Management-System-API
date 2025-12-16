const { Book } = require("../models");
const { sequelize } = require("../config/database");

/**
 * Book service with state machine logic
 */

/**
 * Valid state transitions for books
 */
const VALID_TRANSITIONS = {
  available: ["borrowed", "maintenance"],
  borrowed: ["available"],
  maintenance: ["available"],
  reserved: ["borrowed", "available"],
};

/**
 * Check if state transition is valid
 */
const canTransitionTo = (currentStatus, newStatus) => {
  const validStates = VALID_TRANSITIONS[currentStatus];
  return validStates && validStates.includes(newStatus);
};

/**
 * Update book status with validation
 */
const updateBookStatus = async (bookId, newStatus, transaction = null) => {
  const book = await Book.findByPk(bookId, { transaction });

  if (!book) {
    throw new Error("Book not found");
  }

  if (!canTransitionTo(book.status, newStatus)) {
    throw new Error(
      `Invalid state transition from '${book.status}' to '${newStatus}'`
    );
  }

  book.status = newStatus;
  await book.save({ transaction });

  return book;
};

/**
 * Decrement available copies when borrowing
 */
const decrementAvailableCopies = async (bookId, transaction = null) => {
  const book = await Book.findByPk(bookId, { transaction });

  if (!book) {
    throw new Error("Book not found");
  }

  if (book.available_copies <= 0) {
    throw new Error("No available copies");
  }

  book.available_copies -= 1;

  // Update status to borrowed if no more copies available
  if (book.available_copies === 0) {
    book.status = "borrowed";
  }

  await book.save({ transaction });
  return book;
};

/**
 * Increment available copies when returning
 */
const incrementAvailableCopies = async (bookId, transaction = null) => {
  const book = await Book.findByPk(bookId, { transaction });

  if (!book) {
    throw new Error("Book not found");
  }

  book.available_copies += 1;

  // Update status to available if copies are now available
  if (book.available_copies > 0 && book.status === "borrowed") {
    book.status = "available";
  }

  await book.save({ transaction });
  return book;
};

/**
 * Get all available books
 */
const getAvailableBooks = async () => {
  return await Book.findAll({
    where: {
      available_copies: { [sequelize.Sequelize.Op.gt]: 0 },
    },
  });
};

module.exports = {
  VALID_TRANSITIONS,
  canTransitionTo,
  updateBookStatus,
  decrementAvailableCopies,
  incrementAvailableCopies,
  getAvailableBooks,
};
