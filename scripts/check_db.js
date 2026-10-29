// scripts/check_db.js
// Simple Node.js script to verify that PostgreSQL is reachable and list tables.
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

(async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL');
    const res = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public';`);
    console.log('Tables in public schema:');
    res.rows.forEach(row => console.log(' -', row.table_name));
    client.release();
  } catch (err) {
    console.error('❌ Connection error:', err.message);
  } finally {
    await pool.end();
  }
})();

