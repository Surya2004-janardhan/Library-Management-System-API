const { Fine } = require("../models");
const { checkAndUpdateSuspension } = require("./memberService");

const payFine = async (fineId) => {
  const fine = await Fine.findByPk(fineId, {
    include: ["member", "transaction"],
  });

  if (!fine) {
    throw new Error("Fine not found");
  }

  if (fine.paid_at) {
    throw new Error("Fine already paid");
  }

  fine.paid_at = new Date();
  await fine.save();

  // Check if member can be reactivated
  await checkAndUpdateSuspension(fine.member_id);

  return fine;
};

/**
 * Get unpaid fines for a member
 */
const getUnpaidFines = async (memberId) => {
  return await Fine.findAll({
    where: {
      member_id: memberId,
      paid_at: null,
    },
    include: ["transaction"],
  });
};

//  */
const getMemberFines = async (memberId) => {
  return await Fine.findAll({
    where: {
      member_id: memberId,
    },
    include: ["transaction"],
    order: [["created_at", "DESC"]],
  });
};

module.exports = {
  payFine,
  getUnpaidFines,
  getMemberFines,
};
