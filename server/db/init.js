import fs from 'fs/promises';
import pool from './index.js';
import 'dotenv/config';

async function run() {
  try {
    const schemaPath = new URL('./schema.sql', import.meta.url);
    const sql = await fs.readFile(schemaPath, 'utf8');

    // Execute schema (multipleStatements enabled in pool)
    await pool.query(sql);
    console.log('Schema executed successfully. Database created/updated.');
    process.exit(0);
  } catch (err) {
    console.error('Failed to initialize DB schema:', err);
    process.exit(1);
  }
}

run();
