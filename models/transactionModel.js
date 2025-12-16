const { query } = require("../config/database");

/**
 * Transaction model - SQL CRUD operations
 */

const create = async (transactionData) => {
  const { member_id, book_id, borrowed_at, due_date } = transactionData;
  const result = await query(
    `INSERT INTO transactions (member_id, book_id, borrowed_at, due_date, status)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [member_id, book_id, borrowed_at, due_date, "active"]
  );
  return result.rows[0];
};

const findById = async (id) => {
  const result = await query("SELECT * FROM transactions WHERE id = $1", [id]);
  return result.rows[0] || null;
};

const findByIdWithDetails = async (id) => {
  const result = await query(
    `SELECT t.*, 
            b.isbn, b.title, b.author, b.category,
            m.name as member_name, m.email as member_email, m.membership_number
     FROM transactions t
     JOIN books b ON t.book_id = b.id
     JOIN members m ON t.member_id = m.id
     WHERE t.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

const update = async (id, transactionData) => {
  const fields = [];
  const values = [];
  let paramCount = 1;

  Object.keys(transactionData).forEach((key) => {
    if (transactionData[key] !== undefined) {
      fields.push(`${key} = $${paramCount}`);
      values.push(transactionData[key]);
      paramCount++;
    }
  });

  if (fields.length === 0) return findById(id);

  values.push(id);
  const result = await query(
    `UPDATE transactions SET ${fields.join(
      ", "
    )} WHERE id = $${paramCount} RETURNING *`,
    values
  );
  return result.rows[0] || null;
};

const findOverdue = async () => {
  const result = await query(
    `SELECT t.*, 
            b.isbn, b.title, b.author,
            m.name as member_name, m.email as member_email
     FROM transactions t
     JOIN books b ON t.book_id = b.id
     JOIN members m ON t.member_id = m.id
     WHERE t.status IN ('active', 'overdue') 
       AND t.due_date < NOW() 
       AND t.returned_at IS NULL
     ORDER BY t.due_date ASC`
  );
  return result.rows;
};

const findActiveByMember = async (memberId) => {
  const result = await query(
    `SELECT t.*, 
            b.isbn, b.title, b.author, b.category
     FROM transactions t
     JOIN books b ON t.book_id = b.id
     WHERE t.member_id = $1 AND t.status IN ('active', 'overdue')
     ORDER BY t.borrowed_at DESC`,
    [memberId]
  );
  return result.rows;
};

const countActiveByMember = async (memberId) => {
  const result = await query(
    "SELECT COUNT(*) FROM transactions WHERE member_id = $1 AND status IN ($2, $3)",
    [memberId, "active", "overdue"]
  );
  return parseInt(result.rows[0].count);
};

const countOverdueByMember = async (memberId) => {
  const result = await query(
    "SELECT COUNT(*) FROM transactions WHERE member_id = $1 AND status = $2",
    [memberId, "overdue"]
  );
  return parseInt(result.rows[0].count);
};

const findActiveOverdue = async () => {
  const result = await query(
    `SELECT * FROM transactions 
     WHERE status = 'active' AND due_date < NOW() AND returned_at IS NULL`
  );
  return result.rows;
};

module.exports = {
  create,
  findById,
  findByIdWithDetails,
  update,
  findOverdue,
  findActiveByMember,
  countActiveByMember,
  countOverdueByMember,
  findActiveOverdue,
};
