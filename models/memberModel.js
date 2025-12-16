const { query } = require("../config/database");

/**
 * Member model - SQL CRUD operations
 */

const create = async (memberData) => {
  const { name, email, membership_number } = memberData;
  const result = await query(
    `INSERT INTO members (name, email, membership_number, status)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [name, email, membership_number, "active"]
  );
  return result.rows[0];
};

const findAll = async () => {
  const result = await query("SELECT * FROM members ORDER BY id");
  return result.rows;
};

const findById = async (id) => {
  const result = await query("SELECT * FROM members WHERE id = $1", [id]);
  return result.rows[0] || null;
};

const update = async (id, memberData) => {
  const fields = [];
  const values = [];
  let paramCount = 1;

  Object.keys(memberData).forEach((key) => {
    if (memberData[key] !== undefined) {
      fields.push(`${key} = $${paramCount}`);
      values.push(memberData[key]);
      paramCount++;
    }
  });

  if (fields.length === 0) return findById(id);

  values.push(id);
  const result = await query(
    `UPDATE members SET ${fields.join(
      ", "
    )} WHERE id = $${paramCount} RETURNING *`,
    values
  );
  return result.rows[0] || null;
};

const remove = async (id) => {
  const result = await query("DELETE FROM members WHERE id = $1 RETURNING *", [
    id,
  ]);
  return result.rows[0] || null;
};

module.exports = {
  create,
  findAll,
  findById,
  update,
  remove,
};
