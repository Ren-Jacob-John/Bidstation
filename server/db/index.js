/**
 * Database Connection Pool for Bidstation
 * 
 * This module creates and exports a MySQL connection pool using mysql2/promise.
 * Configuration is loaded from environment variables with sensible defaults.
 * 
 * Environment Variables:
 * - DB_HOST: Database host (default: 127.0.0.1)
 * - DB_USER: Database user (default: root)
 * - DB_PASSWORD: Database password (default: empty)
 * - DB_NAME: Database name (default: bidstation)
 * - DB_PORT: Database port (default: 3306)
 * - DB_CONNECTION_LIMIT: Max connections in pool (default: 10)
 */

import mysql from 'mysql2/promise';
import 'dotenv/config';

// Create connection pool with configuration
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'bidstation',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: process.env.DB_CONNECTION_LIMIT ? Number(process.env.DB_CONNECTION_LIMIT) : 10,
  queueLimit: 0,
  multipleStatements: true,
  // Enable timezone handling
  timezone: '+00:00',
  // Enable JSON parsing
  typeCast: function (field, next) {
    if (field.type === 'JSON') {
      const value = field.string();
      return value ? JSON.parse(value) : null;
    }
    return next();
  }
});

/**
 * Test database connection
 * @returns {Promise<boolean>} True if connection successful
 */
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connection successful');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

/**
 * Get database statistics
 * @returns {Promise<Object>} Pool statistics
 */
export async function getPoolStats() {
  return {
    totalConnections: pool.pool._allConnections.length,
    freeConnections: pool.pool._freeConnections.length,
    connectionQueue: pool.pool._connectionQueue.length
  };
}

/**
 * Close all connections in the pool
 * @returns {Promise<void>}
 */
export async function closePool() {
  await pool.end();
  console.log('Database pool closed');
}

/**
 * Execute a raw SQL query
 * @param {string} sql - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} Query results
 */
export async function query(sql, params = []) {
  const [results] = await pool.execute(sql, params);
  return results;
}

/**
 * Execute a transaction with multiple queries
 * @param {Function} callback - Async function receiving connection
 * @returns {Promise<any>} Transaction result
 */
export async function transaction(callback) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// Export pool as default and named export
export default pool;
export { pool };
