const BookModel = require("../models/bookModel");

/**
 * Book Service - Handles book availability and state management
 * State Machine: available -> borrowed -> available
 *                available -> maintenance -> available
 *                available -> reserved -> borrowed
 */

// Valid state transitions for books
const VALID_TRANSITIONS = {
  available: ["borrowed", "maintenance", "reserved"],
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
const updateBookStatus = async (bookId, newStatus) => {
  const book = await BookModel.findById(bookId);

  if (!book) {
    throw new Error("Book not found");
  }

  if (!canTransitionTo(book.status, newStatus)) {
    throw new Error(
      `Invalid state transition from '${book.status}' to '${newStatus}'`
    );
  }

  return await BookModel.update(bookId, { status: newStatus });
};

/**
 * Decrement available copies when borrowing
 */
const decrementAvailableCopies = async (bookId) => {
  const book = await BookModel.findById(bookId);

  if (!book) {
    throw new Error("Book not found");
  }

  if (book.available_copies <= 0) {
    throw new Error("No available copies");
  }

  const newAvailableCopies = book.available_copies - 1;
  const newStatus = newAvailableCopies === 0 ? "borrowed" : book.status;

  return await BookModel.update(bookId, {
    available_copies: newAvailableCopies,
    status: newStatus,
  });
};

/**
 * Increment available copies when returning
 */
const incrementAvailableCopies = async (bookId) => {
  const book = await BookModel.findById(bookId);

  if (!book) {
    throw new Error("Book not found");
  }

  const newAvailableCopies = book.available_copies + 1;
  const newStatus = newAvailableCopies > 0 ? "available" : book.status;

  return await BookModel.update(bookId, {
    available_copies: newAvailableCopies,
    status: newStatus,
  });
};

/**
 * Get available books
 */
const getAvailableBooks = async () => {
  return await BookModel.findAvailable();
};

module.exports = {
  VALID_TRANSITIONS,
  canTransitionTo,
  updateBookStatus,
  decrementAvailableCopies,
  incrementAvailableCopies,
  getAvailableBooks,
};
