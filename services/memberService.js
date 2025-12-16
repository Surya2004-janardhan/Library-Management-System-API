const { Member, Transaction, Fine } = require("../models");
const { Op } = require("sequelize");


const suspendMember = async (memberId, transaction = null) => {
  const member = await Member.findByPk(memberId, { transaction });

  if (!member) {
    throw new Error("Member not found");
  }

  member.status = "suspended";
  await member.save({ transaction });

  return member;
};

/**
 * Activate member
 */
const activateMember = async (memberId, transaction = null) => {
  const member = await Member.findByPk(memberId, { transaction });

  if (!member) {
    throw new Error("Member not found");
  }

  member.status = "active";
  await member.save({ transaction });

  return member;
};

/**
 * Check and update member suspension status
 */
const checkAndUpdateSuspension = async (memberId, transaction = null) => {
  const overdueCount = await Transaction.count({
    where: {
      member_id: memberId,
      status: "overdue",
    },
    transaction,
  });

  const member = await Member.findByPk(memberId, { transaction });

  if (!member) {
    throw new Error("Member not found");
  }

  // Suspend if 3 or more overdue books
  if (overdueCount >= 3 && member.status === "active") {
    member.status = "suspended";
    await member.save({ transaction });
  }

  // Activate if less than 3 overdue books and no unpaid fines
  if (overdueCount < 3 && member.status === "suspended") {
    const unpaidFines = await Fine.count({
      where: {
        member_id: memberId,
        paid_at: null,
      },
      transaction,
    });

    if (unpaidFines === 0) {
      member.status = "active";
      await member.save({ transaction });
    }
  }

  return member;
};

/**
 * Get books borrowed by member
 */
const getMemberBorrowedBooks = async (memberId) => {
  return await Transaction.findAll({
    where: {
      member_id: memberId,
      status: { [Op.in]: ["active", "overdue"] },
    },
    include: ["book"],
  });
};

module.exports = {
  suspendMember,
  activateMember,
  checkAndUpdateSuspension,
  getMemberBorrowedBooks,
};
