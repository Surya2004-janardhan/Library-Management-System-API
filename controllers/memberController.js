const MemberModel = require("../models/memberModel");
const {
  getMemberBorrowedBooks: getMemberBorrowedBooksService,
} = require("../services/memberService");

const createMember = async (req, res) => {
  try {
    const member = await MemberModel.create(req.body);
    res.status(201).json({
      success: true,
      data: member,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get all members
 */
const getAllMembers = async (req, res) => {
  try {
    const members = await MemberModel.findAll();
    res.status(200).json({
      success: true,
      count: members.length,
      data: members,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get member by ID
 */
const getMemberById = async (req, res) => {
  try {
    const member = await MemberModel.findById(req.params.id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    res.status(200).json({
      success: true,
      data: member,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get books borrowed by member
 */
const getMemberBorrowedBooks = async (req, res) => {
  try {
    const transactions = await getMemberBorrowedBooksService(req.params.id);

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

/**
 * Update member
 */
const updateMember = async (req, res) => {
  try {
    const member = await MemberModel.findById(req.params.id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    const updatedMember = await MemberModel.update(req.params.id, req.body);

    res.status(200).json({
      success: true,
      data: updatedMember,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Delete member
 */
const deleteMember = async (req, res) => {
  try {
    const member = await MemberModel.remove(req.params.id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Member deleted successfully",
      data: member,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createMember,
  getAllMembers,
  getMemberById,
  getMemberBorrowedBooks,
  updateMember,
  deleteMember,
};
