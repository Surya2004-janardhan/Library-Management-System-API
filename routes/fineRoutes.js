const express = require("express");
const router = express.Router();
const {
  getAllFines,
  payFine,
  getUnpaidFines,
  getMemberFines,
} = require("../controllers/fineController");
const {
  fineValidationRules,
  handleValidationErrors,
} = require("../middleware/validator");

// Fine routes
router.get("/fines", getAllFines);
router.post(
  "/fines/:id/pay",
  fineValidationRules.pay,
  handleValidationErrors,
  payFine
);
router.get("/fines/member/:memberId/unpaid", getUnpaidFines);
router.get("/fines/member/:memberId", getMemberFines);

module.exports = router;
