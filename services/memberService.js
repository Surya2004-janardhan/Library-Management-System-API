const MemberModel = require("../models/memberModel");
const TransactionModel = require("../models/transactionModel");

/**
 * Member Service - Handles member status management
 */

/**
 * Suspend a member
 */
const suspendMember = async (memberId) => {
  const member = await MemberModel.findById(memberId);

  if (!member) {
    throw new Error("Member not found");
  }

  if (member.status === "suspended") {
    throw new Error("Member is already suspended");
  }

  return await MemberModel.update(memberId, { status: "suspended" });
};

/**
 * Activate a member
 */
const activateMember = async (memberId) => {
  const member = await MemberModel.findById(memberId);

  if (!member) {
    throw new Error("Member not found");
  }

  if (member.status === "active") {
    throw new Error("Member is already active");
  }

  return await MemberModel.update(memberId, { status: "active" });
};

/**
 * Check and update member suspension status based on overdue count
 */
const checkAndUpdateSuspension = async (memberId) => {
  const overdueCount = await TransactionModel.countOverdueByMember(memberId);

  if (overdueCount >= 3) {
    return await suspendMember(memberId);
  } else {
    const member = await MemberModel.findById(memberId);
    if (member && member.status === "suspended") {
      return await activateMember(memberId);
    }
  }

  return await MemberModel.findById(memberId);
};

/**
 * Get member's borrowed books
 */
const getMemberBorrowedBooks = async (memberId) => {
  return await TransactionModel.findActiveByMember(memberId);
};

module.exports = {
  suspendMember,
  activateMember,
  checkAndUpdateSuspension,
  getMemberBorrowedBooks,
};
