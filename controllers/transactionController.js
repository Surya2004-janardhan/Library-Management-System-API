const {
  borrowBook: borrowBookService,
  returnBook: returnBookService,
  getOverdueTransactions: getOverdueTransactionsService,
  updateOverdueStatuses: updateOverdueStatusesService,
} = require("../services/transactionService");

const borrowBook = async (req, res) => {
  try {
    const { member_id, book_id } = req.body;

    if (!member_id || !book_id) {
      return res.status(400).json({
        success: false,
        message: "member_id and book_id are required",
      });
    }

    const transaction = await borrowBookService(member_id, book_id);

    res.status(201).json({
      success: true,
      message: "Book borrowed successfully",
      data: transaction,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const returnBook = async (req, res) => {
  try {
    const result = await returnBookService(req.params.id);

    res.status(200).json({
      success: true,
      message: "Book returned successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getOverdueTransactions = async (req, res) => {
  try {
    const transactions = await getOverdueTransactionsService();

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateOverdueStatuses = async (req, res) => {
  try {
    const count = await updateOverdueStatusesService();

    res.status(200).json({
      success: true,
      message: `Updated ${count} transactions to overdue status`,
      count,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  borrowBook,
  returnBook,
  getOverdueTransactions,
  updateOverdueStatuses,
};
