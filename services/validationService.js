const MemberModel = require("../models/memberModel");
const BookModel = require("../models/bookModel");
const TransactionModel = require("../models/transactionModel");
const FineModel = require("../models/fineModel");

/**
 * Validation Service - Business rules validation
 */

// Business rules constants
const MAX_BOOKS_PER_MEMBER = 3;

/**
 * Check if member can borrow more books
 */
const canMemberBorrow = async (memberId) => {
  const activeCount = await TransactionModel.countActiveByMember(memberId);
  return activeCount < MAX_BOOKS_PER_MEMBER;
};

/**
 * Check if member has unpaid fines
 */
const hasUnpaidFines = async (memberId) => {
  const count = await FineModel.countUnpaidByMember(memberId);
  return count > 0;
};

/**
 * Check if member is active (not suspended)
 */
const isMemberActive = async (memberId) => {
  const member = await MemberModel.findById(memberId);
  return member && member.status === "active";
};

/**
 * Check if book is available for borrowing
 */
const isBookAvailable = async (bookId) => {
  const book = await BookModel.findById(bookId);
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
  const overdueCount = await TransactionModel.countOverdueByMember(memberId);
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
