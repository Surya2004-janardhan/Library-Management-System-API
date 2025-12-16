const { addDays, differenceInDays, isAfter } = require("date-fns");

const calculateDueDate = (borrowedAt) => {
  return addDays(new Date(borrowedAt), 14);
};

const calculateOverdueDays = (dueDate, returnDate = new Date()) => {
  const due = new Date(dueDate);
  const returned = new Date(returnDate);

  if (!isAfter(returned, due)) {
    return 0;
  }

  return differenceInDays(returned, due);
};

/**
 * Calculate fine amount ($0.50 per day)
 */
const calculateFineAmount = (overdueDays) => {
  const FINE_PER_DAY = 0.5;
  return overdueDays * FINE_PER_DAY;
};

/**
 * Check if transaction is overdue
 */
const isOverdue = (dueDate) => {
  return isAfter(new Date(), new Date(dueDate));
};

module.exports = {
  calculateDueDate,
  calculateOverdueDays,
  calculateFineAmount,
  isOverdue,
};
