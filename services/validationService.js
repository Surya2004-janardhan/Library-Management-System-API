const { query } = require("../config/database");

/**
 * Validation service for business rules
 */

/**
 * Check if member can borrow books (max 3 books)
 */
const canMemberBorrow = async (memberId) => {
  const result = await query(
    'SELECT COUNT(*) FROM transactions WHERE member_id = $1 AND status IN ($2, $3)',
    [memberId, 'active', 'overdue']
  );

  const activeTransactions = parseInt(result.rows[0].count);

  if (activeTransactions >= 3) {
    return {
      valid: false,
      message: "Member has reached maximum borrowing limit of 3 books",
    };
  }

  return { valid: true };
};

/**
 * Check if member has unpaid fines
 */
const hasUnpaidFines = async (memberId) => {
  const unpaidFines = await Fine.count({
    where: {
      member_id: memberId,
      paid_at: null,
    },
  });

  if (unpaidFines > 0) {
    return {
      hasFines: true,
      message: "Member has unpaid fines and cannot borrow books",
    };
  }

  return { hasFines: false };
};

/**
 * Check if member status is active
 */
const isMemberActive = async (memberId) => {
  const member = await Member.findByPk(memberId);

  if (!member) {
    return {
      valid: false,
      message: "Member not found",
    };
  }

  if (member.status !== "active") {
    return {
      valid: false,
      message: "Member account is suspended",
    };
  }

  return { valid: true, member };
};

/**
 * Check if book is available for borrowing
 */
const isBookAvailable = async (bookId) => {
  const book = await Book.findByPk(bookId);

  if (!book) {
    return {
      valid: false,
      message: "Book not found",
    };
  }

  if (book.available_copies <= 0) {
    return {
      valid: false,
      message: "No copies available for this book",
    };
  }

  return { valid: true, book };
};

/**
 * Validate all borrowing rules
 */
const validateBorrowing = async (memberId, bookId) => {
  // Check member status
  const memberCheck = await isMemberActive(memberId);
  if (!memberCheck.valid) {
    return memberCheck;
  }

  // Check unpaid fines
  const fineCheck = await hasUnpaidFines(memberId);
  if (fineCheck.hasFines) {
    return {
      valid: false,
      message: fineCheck.message,
    };
  }

  // Check borrowing limit
  const borrowCheck = await canMemberBorrow(memberId);
  if (!borrowCheck.valid) {
    return borrowCheck;
  }

  // Check book availability
  const bookCheck = await isBookAvailable(bookId);
  if (!bookCheck.valid) {
    return bookCheck;
  }

  return {
    valid: true,
    member: memberCheck.member,
    book: bookCheck.book,
  };
};

/**
 * Check if member should be suspended (3+ overdue books)
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
};
