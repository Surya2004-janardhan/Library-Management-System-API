const { Book } = require("../models");

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

const updateBookStatus = async (bookId, newStatus) => {
  const book = await Book.findByPk(bookId);

  if (!book) {
    throw new Error("Book not found");
  }

  if (!canTransitionTo(book.status, newStatus)) {
    throw new Error(
      `Invalid state transition from '${book.status}' to '${newStatus}'`
    );
  }

  await book.update({ status: newStatus });
  return book;
};

const decrementAvailableCopies = async (bookId) => {
  const book = await Book.findByPk(bookId);

  if (!book) {
    throw new Error("Book not found");
  }

  if (book.available_copies <= 0) {
    throw new Error("No available copies");
  }

  const newAvailableCopies = book.available_copies - 1;
  const newStatus = newAvailableCopies === 0 ? "borrowed" : book.status;

  await book.update({
    available_copies: newAvailableCopies,
    status: newStatus,
  });

  return book;
};

const incrementAvailableCopies = async (bookId) => {
  const book = await Book.findByPk(bookId);

  if (!book) {
    throw new Error("Book not found");
  }

  const newAvailableCopies = book.available_copies + 1;
  const newStatus = newAvailableCopies > 0 ? "available" : book.status;

  await book.update({
    available_copies: newAvailableCopies,
    status: newStatus,
  });

  return book;
};

const getAvailableBooks = async () => {
  return await Book.findAll({
    where: {
      available_copies: {
        [require("sequelize").Op.gt]: 0,
      },
    },
    order: [["title", "ASC"]],
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
