const FineModel = require("../models/fineModel");

/**
 * Fine Service - Handles fine payment and tracking
 */

/**
 * Pay a fine
 */
const payFine = async (fineId) => {
  const fine = await FineModel.findById(fineId);

  if (!fine) {
    throw new Error("Fine not found");
  }

  if (fine.paid_at) {
    throw new Error("Fine already paid");
  }

  return await FineModel.update(fineId, { paid_at: new Date() });
};

/**
 * Get all unpaid fines for a member
 */
const getUnpaidFines = async (memberId) => {
  return await FineModel.findUnpaidByMember(memberId);
};

/**
 * Get all fines for a member
 */
const getMemberFines = async (memberId) => {
  return await FineModel.findByMember(memberId);
};

module.exports = {
  payFine,
  getUnpaidFines,
  getMemberFines,
};
