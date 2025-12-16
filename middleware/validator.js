const { body, param, validationResult } = require("express-validator");

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }
  next();
};

const bookValidationRules = {
  create: [
    body("isbn")
      .notEmpty()
      .withMessage("ISBN is required")
      .isLength({ min: 10, max: 20 })
      .withMessage("ISBN must be 10-20 characters"),
    body("title").notEmpty().withMessage("Title is required"),
    body("author").notEmpty().withMessage("Author is required"),
    body("category").optional(),
    body("total_copies")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Total copies must be at least 1"),
    body("available_copies")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Available copies must be 0 or more"),
  ],
  update: [
    param("id").isInt().withMessage("Invalid book ID"),
    body("isbn")
      .optional()
      .isLength({ min: 10, max: 20 })
      .withMessage("ISBN must be 10-20 characters"),
    body("title").optional().notEmpty().withMessage("Title cannot be empty"),
    body("author").optional().notEmpty().withMessage("Author cannot be empty"),
    body("category").optional(),
    body("status")
      .optional()
      .isIn(["available", "borrowed", "reserved", "maintenance"])
      .withMessage("Invalid status"),
    body("total_copies")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Total copies must be at least 1"),
    body("available_copies")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Available copies must be 0 or more"),
  ],
};

const memberValidationRules = {
  create: [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("membership_number")
      .notEmpty()
      .withMessage("Membership number is required"),
  ],
  update: [
    param("id").isInt().withMessage("Invalid member ID"),
    body("name").optional().notEmpty().withMessage("Name cannot be empty"),
    body("email").optional().isEmail().withMessage("Valid email is required"),
    body("membership_number")
      .optional()
      .notEmpty()
      .withMessage("Membership number cannot be empty"),
    body("status")
      .optional()
      .isIn(["active", "suspended"])
      .withMessage("Invalid status"),
  ],
};

const transactionValidationRules = {
  borrow: [
    body("member_id").isInt().withMessage("Valid member ID is required"),
    body("book_id").isInt().withMessage("Valid book ID is required"),
  ],
  return: [param("id").isInt().withMessage("Invalid transaction ID")],
};

const fineValidationRules = {
  pay: [param("id").isInt().withMessage("Invalid fine ID")],
};

module.exports = {
  handleValidationErrors,
  bookValidationRules,
  memberValidationRules,
  transactionValidationRules,
  fineValidationRules,
};
