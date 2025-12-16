const { Fine } = require("../models");

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
