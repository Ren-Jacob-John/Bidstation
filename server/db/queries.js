import pool from './index.js';

export async function createUser(fullName, email, password, role = 'user') {
  const [result] = await pool.execute(
    'INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)',
    [fullName, email, password, role]
  );
  return result.insertId;
}

export async function getUserByEmail(email) {
  const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0] || null;
}

export async function getUserById(id) {
  const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
  return rows[0] || null;
}

export async function createAuction({ title, description, start_time, end_time, start_price, created_by }) {
  const [result] = await pool.execute(
    'INSERT INTO auctions (title, description, start_time, end_time, start_price, current_price, created_by, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [title, description, start_time, end_time, start_price, start_price, created_by, 'pending']
  );
  return result.insertId;
}

export async function getAuctionById(id) {
  const [rows] = await pool.execute('SELECT * FROM auctions WHERE id = ?', [id]);
  return rows[0] || null;
}

export async function listActiveAuctions() {
  const [rows] = await pool.execute("SELECT * FROM auctions WHERE status = 'active' ORDER BY start_time DESC");
  return rows;
}

export async function placeBid(auctionId, userId, amount) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // insert bid
    await conn.execute('INSERT INTO bids (auction_id, user_id, amount) VALUES (?, ?, ?)', [auctionId, userId, amount]);

    // update current price
    await conn.execute('UPDATE auctions SET current_price = ? WHERE id = ?', [amount, auctionId]);

    await conn.commit();
    return true;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function joinAuction(auctionId, userId) {
  await pool.execute('INSERT IGNORE INTO auction_participants (auction_id, user_id) VALUES (?, ?)', [auctionId, userId]);
}
