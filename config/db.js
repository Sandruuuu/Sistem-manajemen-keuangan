require('dotenv').config();
const mysql = require('mysql2/promise');

let pool;

async function init() {
  if (pool) return pool;
  
  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sistem_keuangan',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
  
  // Test connection
  await pool.query('SELECT 1');
  return pool;
}

module.exports = { 
  init, 
  pool: () => pool 
};