const { Member, Book, Transaction, Fine } = require("../models");
const { Op } = require("sequelize");

/**
 * Validation Service - Business rules validation using Sequelize ORM
 */

// Business rules constants
const MAX_BOOKS_PER_MEMBER = 3;

/**
 * Check if member can borrow more books
 */
const canMemberBorrow = async (memberId) => {
  const activeCount = await Transaction.count({
    where: {
      member_id: memberId,
      status: {
        [Op.in]: ["active", "overdue"],
      },
    },
  });
  return activeCount < MAX_BOOKS_PER_MEMBER;
};

/**
 * Check if member has unpaid fines
 */
const hasUnpaidFines = async (memberId) => {
  const count = await Fine.count({
    where: {
      member_id: memberId,
      paid_at: null,
    },
  });
  return count > 0;
};

/**
 * Check if member is active (not suspended)
 */
const isMemberActive = async (memberId) => {
  const member = await Member.findByPk(memberId);
  return member && member.status === "active";
};

/**
 * Check if book is available for borrowing
 */
const isBookAvailable = async (bookId) => {
  const book = await Book.findByPk(bookId);
  return book && book.available_copies > 0;
};

/**
 * Validate borrowing request - comprehensive check
 */
const validateBorrowing = async (memberId, bookId) => {
  const errors = [];

  // Check if member exists and is active
  const isActive = await isMemberActive(memberId);
  if (!isActive) {
    errors.push("Member is not active or does not exist");
  }

  // Check if member can borrow more books
  const canBorrow = await canMemberBorrow(memberId);
  if (!canBorrow) {
    errors.push(
      `Member has reached the maximum limit of ${MAX_BOOKS_PER_MEMBER} books`
    );
  }

  // Check if member has unpaid fines
  const hasFines = await hasUnpaidFines(memberId);
  if (hasFines) {
    errors.push("Member has unpaid fines");
  }

  // Check if book is available
  const bookAvailable = await isBookAvailable(bookId);
  if (!bookAvailable) {
    errors.push("Book is not available");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Check suspension status based on overdue count
 */
const checkSuspensionStatus = async (memberId) => {
  const overdueCount = await Transaction.count({
    where: {
      member_id: memberId,
      status: "overdue",
    },
  });
  return overdueCount >= 3;
};

module.exports = {
  canMemberBorrow,
  hasUnpaidFines,
  isMemberActive,
  isBookAvailable,
  validateBorrowing,
  checkSuspensionStatus,
  MAX_BOOKS_PER_MEMBER,
};
