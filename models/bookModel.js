const { query } = require("../config/database");

/**
 * Book model - SQL CRUD operations
 */

const create = async (bookData) => {
  const { isbn, title, author, category, total_copies, available_copies } =
    bookData;
  const result = await query(
    `INSERT INTO books (isbn, title, author, category, total_copies, available_copies)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [
      isbn,
      title,
      author,
      category,
      total_copies || 1,
      available_copies || total_copies || 1,
    ]
  );
  return result.rows[0];
};

const findAll = async () => {
  const result = await query("SELECT * FROM books ORDER BY id");
  return result.rows;
};

const findById = async (id) => {
  const result = await query("SELECT * FROM books WHERE id = $1", [id]);
  return result.rows[0] || null;
};

const update = async (id, bookData) => {
  const fields = [];
  const values = [];
  let paramCount = 1;

  Object.keys(bookData).forEach((key) => {
    if (bookData[key] !== undefined) {
      fields.push(`${key} = $${paramCount}`);
      values.push(bookData[key]);
      paramCount++;
    }
  });

  if (fields.length === 0) return findById(id);

  values.push(id);
  const result = await query(
    `UPDATE books SET ${fields.join(
      ", "
    )} WHERE id = $${paramCount} RETURNING *`,
    values
  );
  return result.rows[0] || null;
};

const remove = async (id) => {
  const result = await query("DELETE FROM books WHERE id = $1 RETURNING *", [
    id,
  ]);
  return result.rows[0] || null;
};

const findAvailable = async () => {
  const result = await query(
    "SELECT * FROM books WHERE available_copies > 0 ORDER BY title"
  );
  return result.rows;
};

module.exports = {
  create,
  findAll,
  findById,
  update,
  remove,
  findAvailable,
};
