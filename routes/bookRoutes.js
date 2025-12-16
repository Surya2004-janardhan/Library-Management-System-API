const express = require("express");
const router = express.Router();
const {
  createBook,
  getAllBooks,
  getAvailableBooks,
  getBookById,
  updateBook,
  deleteBook,
} = require("../controllers/bookController");
const {
  bookValidationRules,
  handleValidationErrors,
} = require("../middleware/validator");

// Book routes
router.post(
  "/books",
  bookValidationRules.create,
  handleValidationErrors,
  createBook
);
router.get("/books", getAllBooks);
router.get("/books/available", getAvailableBooks);
router.get("/books/:id", getBookById);
router.put(
  "/books/:id",
  bookValidationRules.update,
  handleValidationErrors,
  updateBook
);
router.delete("/books/:id", deleteBook);

module.exports = router;
