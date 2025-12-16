const { Fine } = require("../models");

/**
 * Fine Service - Handles fine payment and tracking using Sequelize ORM
 */

/**
 * Pay a fine
 */
const payFine = async (fineId) => {
  const fine = await Fine.findByPk(fineId, {
    include: [
      {
        association: "member",
        attributes: ["name", "email"],
      },
      {
        association: "transaction",
      },
    ],
  });

  if (!fine) {
    throw new Error("Fine not found");
  }

  if (fine.paid_at) {
    throw new Error("Fine already paid");
  }

  await fine.update({ paid_at: new Date() });
  return fine;
};

/**
 * Get all unpaid fines for a member
 */
const getUnpaidFines = async (memberId) => {
  return await Fine.findAll({
    where: {
      member_id: memberId,
      paid_at: null,
    },
    include: [
      {
        association: "transaction",
        attributes: ["book_id", "borrowed_at", "due_date"],
      },
    ],
    order: [["created_at", "DESC"]],
  });
};

/**
 * Get all fines for a member
 */
const getMemberFines = async (memberId) => {
  return await Fine.findAll({
    where: {
      member_id: memberId,
    },
    include: [
      {
        association: "transaction",
        attributes: ["book_id", "borrowed_at", "due_date"],
      },
    ],
    order: [["created_at", "DESC"]],
  });
};

module.exports = {
  payFine,
  getUnpaidFines,
  getMemberFines,
};
