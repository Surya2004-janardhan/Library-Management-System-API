const { Member, Transaction } = require("../models");
const { Op } = require("sequelize");

/**
 * Member Service - Handles member status management using Sequelize ORM
 */

/**
 * Suspend a member
 */
const suspendMember = async (memberId) => {
  const member = await Member.findByPk(memberId);

  if (!member) {
    throw new Error("Member not found");
  }

  if (member.status === "suspended") {
    throw new Error("Member is already suspended");
  }

  await member.update({ status: "suspended" });
  return member;
};

/**
 * Activate a member
 */
const activateMember = async (memberId) => {
  const member = await Member.findByPk(memberId);

  if (!member) {
    throw new Error("Member not found");
  }

  if (member.status === "active") {
    throw new Error("Member is already active");
  }

  await member.update({ status: "active" });
  return member;
};

/**
 * Check and update member suspension status based on overdue count
 */
const checkAndUpdateSuspension = async (memberId) => {
  const overdueCount = await Transaction.count({
    where: {
      member_id: memberId,
      status: "overdue",
    },
  });

  if (overdueCount >= 3) {
    return await suspendMember(memberId);
  } else {
    const member = await Member.findByPk(memberId);
    if (member && member.status === "suspended") {
      return await activateMember(memberId);
    }
  }

  return await Member.findByPk(memberId);
};

/**
 * Get member's borrowed books
 */
const getMemberBorrowedBooks = async (memberId) => {
  return await Transaction.findAll({
    where: {
      member_id: memberId,
      status: {
        [Op.in]: ["active", "overdue"],
      },
    },
    include: [
      {
        association: "book",
        attributes: ["id", "isbn", "title", "author", "category"],
      },
    ],
    order: [["borrowed_at", "DESC"]],
  });
};

module.exports = {
  suspendMember,
  activateMember,
  checkAndUpdateSuspension,
  getMemberBorrowedBooks,
};
