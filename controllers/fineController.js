const {
  payFine: payFineService,
  getUnpaidFines: getUnpaidFinesService,
  getMemberFines: getMemberFinesService,
} = require("../services/fineService");
const { Fine } = require("../models");

/**
 * Fine controller
 */

/**
 * Pay a fine
 */
const payFine = async (req, res) => {
  try {
    const fine = await payFineService(req.params.id);

    res.status(200).json({
      success: true,
      message: "Fine paid successfully",
      data: fine,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllFines = async (req, res) => {
  try {
    const fines = await Fine.findAll({
      include: ["member", "transaction"],
    });

    res.status(200).json({
      success: true,
      count: fines.length,
      data: fines,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getUnpaidFines = async (req, res) => {
  try {
    const fines = await getUnpaidFinesService(req.params.memberId);

    res.status(200).json({
      success: true,
      count: fines.length,
      data: fines,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get all fines for a member
 */
const getMemberFines = async (req, res) => {
  try {
    const fines = await getMemberFinesService(req.params.memberId);

    res.status(200).json({
      success: true,
      count: fines.length,
      data: fines,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  payFine,
  getAllFines,
  getUnpaidFines,
  getMemberFines,
};
