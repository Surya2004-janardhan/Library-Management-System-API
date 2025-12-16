const { query } = require("../config/database");

/**
 * Member service for status management
 */

/**
 * Suspend member
 */
const suspendMember = async (memberId, client = null) => {
  const queryFn = client ? (text, params) => client.query(text, params) : query;
  
  const result = await queryFn(
    'UPDATE members SET status = $1 WHERE id = $2 RETURNING *',
    ['suspended', memberId]
  );

  if (result.rows.length === 0) {
    throw new Error("Member not found");
  }

  return result.rows[0];
};

/**
 * Activate member
 */
const activateMember = async (memberId, client = null) => {
  const queryFn = client ? (text, params) => client.query(text, params) : query;
  
  const result = await queryFn(
    'UPDATE members SET status = $1 WHERE id = $2 RETURNING *',
    ['active', memberId]
  );

  if (result.rows.length === 0) {
    throw new Error("Member not found");
  }

  return result.rows[0];
};

/**
 * Check and update member suspension status
 */
const checkAndUpdateSuspension = async (memberId, client = null) => {
  const queryFn = client ? (text, params) => client.query(text, params) : query;
  
  const overdueResult = await queryFn(
    'SELECT COUNT(*) FROM transactions WHERE member_id = $1 AND status = $2',
    [memberId, 'overdue']
  );
  const overdueCount = parseInt(overdueResult.rows[0].count);

  const memberResult = await queryFn('SELECT * FROM members WHERE id = $1', [memberId]);

  if (memberResult.rows.length === 0) {
    throw new Error("Member not found");
  }

  let member = memberResult.rows[0];

  // Suspend if 3 or more overdue books
  if (overdueCount >= 3 && member.status === "active") {
    const updated = await queryFn(
      'UPDATE members SET status = $1 WHERE id = $2 RETURNING *',
      ['suspended', memberId]
    );
    member = updated.rows[0];
  }

  // Activate if less than 3 overdue books and no unpaid fines
  if (overdueCount < 3 && member.status === "suspended") {
    const finesResult = await queryFn(
      'SELECT COUNT(*) FROM fines WHERE member_id = $1 AND paid_at IS NULL',
      [memberId]
    );
    const unpaidFines = parseInt(finesResult.rows[0].count);

    if (unpaidFines === 0) {
      const updated = await queryFn(
        'UPDATE members SET status = $1 WHERE id = $2 RETURNING *',
        ['active', memberId]
      );
      member = updated.rows[0];
    }
  }

  return member;
};

/**
 * Get books borrowed by member
 */
const getMemberBorrowedBooks = async (memberId) => {
  const result = await query(
    `SELECT t.*, 
            b.id as book_id, b.isbn, b.title, b.author, b.category, b.status as book_status
     FROM transactions t
     JOIN books b ON t.book_id = b.id
     WHERE t.member_id = $1 AND t.status IN ('active', 'overdue')`,
    [memberId]
  );
  return result.rows;
};

module.exports = {
  suspendMember,
  activateMember,
  checkAndUpdateSuspension,
  getMemberBorrowedBooks,
};
