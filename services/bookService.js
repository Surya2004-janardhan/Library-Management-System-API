const { query, pool } = require("../config/database");

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
const updateBookStatus = async (bookId, newStatus, client = null) => {
  const queryFn = client ? (text, params) => client.query(text, params) : query;

  const result = await queryFn("SELECT * FROM books WHERE id = $1", [bookId]);

  if (result.rows.length === 0) {
    throw new Error("Book not found");
  }

  const book = result.rows[0];

  if (!canTransitionTo(book.status, newStatus)) {
    throw new Error(
      `Invalid state transition from '${book.status}' to '${newStatus}'`
    );
  }

  const updated = await queryFn(
    "UPDATE books SET status = $1 WHERE id = $2 RETURNING *",
    [newStatus, bookId]
  );

  return updated.rows[0];
};

/**
 * Decrement available copies when borrowing
 */
const decrementAvailableCopies = async (bookId, client = null) => {
  const queryFn = client ? (text, params) => client.query(text, params) : query;

  const result = await queryFn("SELECT * FROM books WHERE id = $1", [bookId]);

  if (result.rows.length === 0) {
    throw new Error("Book not found");
  }

  const book = result.rows[0];

  if (book.available_copies <= 0) {
    throw new Error("No available copies");
  }

  const newAvailableCopies = book.available_copies - 1;
  const newStatus = newAvailableCopies === 0 ? "borrowed" : book.status;

  const updated = await queryFn(
    "UPDATE books SET available_copies = $1, status = $2 WHERE id = $3 RETURNING *",
    [newAvailableCopies, newStatus, bookId]
  );

  return updated.rows[0];
};

/**
 * Increment available copies when returning
 */
const incrementAvailableCopies = async (bookId, client = null) => {
  const queryFn = client ? (text, params) => client.query(text, params) : query;

  const result = await queryFn("SELECT * FROM books WHERE id = $1", [bookId]);

  if (result.rows.length === 0) {
    throw new Error("Book not found");
  }

  const book = result.rows[0];
  const newAvailableCopies = book.available_copies + 1;
  const newStatus =
    newAvailableCopies > 0 && book.status === "borrowed"
      ? "available"
      : book.status;

  const updated = await queryFn(
    "UPDATE books SET available_copies = $1, status = $2 WHERE id = $3 RETURNING *",
    [newAvailableCopies, newStatus, bookId]
  );

  return updated.rows[0];
};

/**
 * Get all available books
 */
const getAvailableBooks = async () => {
  const result = await query("SELECT * FROM books WHERE available_copies > 0");
  return result.rows;
};

module.exports = {
  VALID_TRANSITIONS,
  canTransitionTo,
  updateBookStatus,
  decrementAvailableCopies,
  incrementAvailableCopies,
  getAvailableBooks,
};
