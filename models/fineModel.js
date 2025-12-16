const { query } = require("../config/database");

/**
 * Fine model - SQL CRUD operations
 */

const create = async (fineData) => {
  const { member_id, transaction_id, amount } = fineData;
  const result = await query(
    `INSERT INTO fines (member_id, transaction_id, amount)
     VALUES ($1, $2, $3) RETURNING *`,
    [member_id, transaction_id, amount]
  );
  return result.rows[0];
};

const findAll = async () => {
  const result = await query(
    `SELECT f.*, 
            m.name as member_name, m.email as member_email,
            t.book_id, t.borrowed_at, t.due_date, t.returned_at
     FROM fines f
     JOIN members m ON f.member_id = m.id
     JOIN transactions t ON f.transaction_id = t.id
     ORDER BY f.created_at DESC`
  );
  return result.rows;
};

const findById = async (id) => {
  const result = await query(
    `SELECT f.*, 
            m.name as member_name, m.email as member_email,
            t.book_id, t.borrowed_at, t.due_date
     FROM fines f
     JOIN members m ON f.member_id = m.id
     JOIN transactions t ON f.transaction_id = t.id
     WHERE f.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

const update = async (id, fineData) => {
  const fields = [];
  const values = [];
  let paramCount = 1;

  Object.keys(fineData).forEach((key) => {
    if (fineData[key] !== undefined) {
      fields.push(`${key} = $${paramCount}`);
      values.push(fineData[key]);
      paramCount++;
    }
  });

  if (fields.length === 0) return findById(id);

  values.push(id);
  const result = await query(
    `UPDATE fines SET ${fields.join(
      ", "
    )} WHERE id = $${paramCount} RETURNING *`,
    values
  );
  return result.rows[0] || null;
};

const findUnpaidByMember = async (memberId) => {
  const result = await query(
    `SELECT f.*, t.book_id, t.borrowed_at, t.due_date
     FROM fines f
     JOIN transactions t ON f.transaction_id = t.id
     WHERE f.member_id = $1 AND f.paid_at IS NULL
     ORDER BY f.created_at DESC`,
    [memberId]
  );
  return result.rows;
};

const findByMember = async (memberId) => {
  const result = await query(
    `SELECT f.*, t.book_id, t.borrowed_at, t.due_date
     FROM fines f
     JOIN transactions t ON f.transaction_id = t.id
     WHERE f.member_id = $1
     ORDER BY f.created_at DESC`,
    [memberId]
  );
  return result.rows;
};

const countUnpaidByMember = async (memberId) => {
  const result = await query(
    "SELECT COUNT(*) FROM fines WHERE member_id = $1 AND paid_at IS NULL",
    [memberId]
  );
  return parseInt(result.rows[0].count);
};

module.exports = {
  create,
  findAll,
  findById,
  update,
  findUnpaidByMember,
  findByMember,
  countUnpaidByMember,
};
