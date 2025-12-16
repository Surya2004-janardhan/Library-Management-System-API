const express = require("express");
const router = express.Router();
const {
  createMember,
  getAllMembers,
  getMemberById,
  getMemberBorrowedBooks,
  updateMember,
  deleteMember,
} = require("../controllers/memberController");
const {
  memberValidationRules,
  handleValidationErrors,
} = require("../middleware/validator");

// Member routes
router.post(
  "/members",
  memberValidationRules.create,
  handleValidationErrors,
  createMember
);
router.get("/members", getAllMembers);
router.get("/members/:id", getMemberById);
router.get("/members/:id/books", getMemberBorrowedBooks);
router.put(
  "/members/:id",
  memberValidationRules.update,
  handleValidationErrors,
  updateMember
);
router.delete("/members/:id", deleteMember);

module.exports = router;
