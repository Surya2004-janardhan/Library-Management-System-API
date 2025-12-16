const express = require("express");
const router = express.Router();
const {
  borrowBook,
  returnBook,
  getOverdueTransactions,
  updateOverdueStatuses,
} = require("../controllers/transactionController");
const {
  transactionValidationRules,
  handleValidationErrors,
} = require("../middleware/validator");

// Transaction routes
router.post(
  "/transactions/borrow",
  transactionValidationRules.borrow,
  handleValidationErrors,
  borrowBook
);
router.post(
  "/transactions/:id/return",
  transactionValidationRules.return,
  handleValidationErrors,
  returnBook
);
router.get("/transactions/overdue", getOverdueTransactions);
router.post("/transactions/update-overdue", updateOverdueStatuses);

module.exports = router;
