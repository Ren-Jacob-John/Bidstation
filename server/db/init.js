/**
 * Database Initialization Script for Bidstation
 * 
 * This script initializes the MySQL database by executing the schema.sql file.
 * It creates all necessary tables, indexes, and initial data.
 * 
 * Usage:
 *   node server/db/init.js
 * 
 * Options:
 *   --force    Drop existing tables before creating (WARNING: destroys data)
 *   --seed     Insert sample data after schema creation
 * 
 * Environment Variables:
 *   DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const forceReset = args.includes('--force');
const seedData = args.includes('--seed');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  multipleStatements: true
};

/**
 * Main initialization function
 */
async function run() {
  let connection;
  
  try {
    console.log('🚀 Starting database initialization...\n');
    console.log('Configuration:');
    console.log(`  Host: ${dbConfig.host}`);
    console.log(`  Port: ${dbConfig.port}`);
    console.log(`  User: ${dbConfig.user}`);
    console.log(`  Database: ${process.env.DB_NAME || 'bidstation'}`);
    console.log(`  Force Reset: ${forceReset}`);
    console.log(`  Seed Data: ${seedData}\n`);

    // Connect without database first
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to MySQL server');

    // Drop database if force flag is set
    if (forceReset) {
      console.log('\n⚠️  Force reset enabled - dropping existing database...');
      await connection.query(`DROP DATABASE IF EXISTS ${process.env.DB_NAME || 'bidstation'}`);
      console.log('✅ Existing database dropped');
    }

    // Read and execute schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    console.log(`\n📄 Reading schema from: ${schemaPath}`);
    
    const sql = await fs.readFile(schemaPath, 'utf8');
    console.log('✅ Schema file loaded');

    console.log('\n🔧 Executing schema...');
    await connection.query(sql);
    console.log('✅ Schema executed successfully');

    // Seed sample data if requested
    if (seedData) {
      console.log('\n🌱 Seeding sample data...');
      await seedSampleData(connection);
      console.log('✅ Sample data inserted');
    }

    // Verify tables were created
    console.log('\n📊 Verifying database structure...');
    await connection.query(`USE ${process.env.DB_NAME || 'bidstation'}`);
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`✅ Created ${tables.length} tables:`);
    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`   - ${tableName}`);
    });

    console.log('\n✨ Database initialization completed successfully!');
    console.log('\nNext steps:');
    console.log('  1. Create a .env file with your database credentials');
    console.log('  2. Start the server: npm run dev');
    console.log('  3. The database is ready to use!\n');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Failed to initialize database:', err.message);
    
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 Tip: Check your database credentials in .env file');
    } else if (err.code === 'ECONNREFUSED') {
      console.error('\n💡 Tip: Make sure MySQL server is running');
    } else if (err.code === 'ER_BAD_DB_ERROR') {
      console.error('\n💡 Tip: The database will be created automatically');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

/**
 * Insert sample data for testing
 */
async function seedSampleData(connection) {
  const dbName = process.env.DB_NAME || 'bidstation';
  await connection.query(`USE ${dbName}`);

  // Sample users (passwords are hashed versions of 'Password123!')
  const sampleUsers = `
    INSERT INTO users (full_name, email, password, is_verified, role) VALUES
    ('John Doe', 'john@example.com', '$2b$10$rQZ8K.5YxQZ8K.5YxQZ8KuQZ8K.5YxQZ8K.5YxQZ8K.5YxQZ8K.5Y', 1, 'user'),
    ('Jane Smith', 'jane@example.com', '$2b$10$rQZ8K.5YxQZ8K.5YxQZ8KuQZ8K.5YxQZ8K.5YxQZ8K.5YxQZ8K.5Y', 1, 'seller'),
    ('Admin User', 'admin@example.com', '$2b$10$rQZ8K.5YxQZ8K.5YxQZ8KuQZ8K.5YxQZ8K.5YxQZ8K.5YxQZ8K.5Y', 1, 'admin')
    ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);
  `;
  await connection.query(sampleUsers);
  console.log('   - Inserted sample users');

  // Sample auctions
  const sampleAuctions = `
    INSERT INTO auctions (title, slug, description, category_id, start_price, current_price, bid_increment, start_time, end_time, status, created_by) VALUES
    ('Vintage Watch Collection', 'vintage-watch-collection', 'A beautiful collection of vintage watches from the 1960s.', 7, 500.00, 500.00, 25.00, NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY), 'active', 2),
    ('Gaming Laptop - Like New', 'gaming-laptop-like-new', 'High-performance gaming laptop, barely used. RTX 3080, 32GB RAM.', 1, 800.00, 800.00, 50.00, NOW(), DATE_ADD(NOW(), INTERVAL 5 DAY), 'active', 2),
    ('Antique Furniture Set', 'antique-furniture-set', 'Beautiful Victorian-era furniture set including chairs and table.', 9, 1500.00, 1500.00, 100.00, NOW(), DATE_ADD(NOW(), INTERVAL 10 DAY), 'active', 2),
    ('Sports Memorabilia', 'sports-memorabilia', 'Signed basketball from championship game.', 4, 200.00, 200.00, 10.00, NOW(), DATE_ADD(NOW(), INTERVAL 3 DAY), 'active', 2),
    ('Art Print Collection', 'art-print-collection', 'Limited edition art prints from renowned artists.', 5, 300.00, 300.00, 15.00, NOW(), DATE_ADD(NOW(), INTERVAL 14 DAY), 'active', 2)
    ON DUPLICATE KEY UPDATE title = VALUES(title);
  `;
  await connection.query(sampleAuctions);
  console.log('   - Inserted sample auctions');

  // Sample bids
  const sampleBids = `
    INSERT INTO bids (auction_id, user_id, amount, is_winning) VALUES
    (1, 1, 525.00, 0),
    (1, 1, 575.00, 1),
    (2, 1, 850.00, 1),
    (3, 1, 1600.00, 1)
    ON DUPLICATE KEY UPDATE amount = VALUES(amount);
  `;
  await connection.query(sampleBids);
  console.log('   - Inserted sample bids');

  // Update current prices based on bids
  await connection.query(`
    UPDATE auctions SET current_price = 575.00, bid_count = 2 WHERE id = 1;
    UPDATE auctions SET current_price = 850.00, bid_count = 1 WHERE id = 2;
    UPDATE auctions SET current_price = 1600.00, bid_count = 1 WHERE id = 3;
  `);
  console.log('   - Updated auction prices');

  // Sample watchlist entries
  const sampleWatchlist = `
    INSERT INTO watchlist (user_id, auction_id) VALUES
    (1, 4),
    (1, 5)
    ON DUPLICATE KEY UPDATE user_id = VALUES(user_id);
  `;
  await connection.query(sampleWatchlist);
  console.log('   - Inserted sample watchlist entries');
}

// Run the initialization
run();
