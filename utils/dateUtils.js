const { addDays, differenceInDays, isAfter } = require("date-fns");

const calculateDueDate = (borrowedAt, loanPeriodDays = 14) => {
  return addDays(new Date(borrowedAt), loanPeriodDays);
};

const calculateOverdueDays = (dueDate, returnDate = new Date()) => {
  const due = new Date(dueDate);
  const returned = new Date(returnDate);

  if (!isAfter(returned, due)) {
    return 0;
  }

  return differenceInDays(returned, due);
};

const calculateFineAmount = (overdueDays) => {
  const FINE_PER_DAY = 0.5;
  return overdueDays * FINE_PER_DAY;
};

const isOverdue = (dueDate) => {
  return isAfter(new Date(), new Date(dueDate));
};

module.exports = {
  calculateDueDate,
  calculateOverdueDays,
  calculateFineAmount,
  isOverdue,
};
