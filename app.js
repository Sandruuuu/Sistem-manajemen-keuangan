require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const db = require('./config/db');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Initialize the database
(async () => {
  try {
    await db.init();
    console.log('Server connected');
  } catch (err) {
    console.error('Failed to initialize DB:', err);
    process.exit(1);
  }
})();

// API routes
app.get('/', (req, res) => res.json({ status: 'ok', message: 'API ready' }));
app.use('/transactions', require('./routes/transactions'));
app.use('/accounts', require('./routes/accounts'));
app.use('/admin', require('./routes/admin'));

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Server error' });
});

module.exports = app;