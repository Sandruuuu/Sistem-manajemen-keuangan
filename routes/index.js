const express = require('express');
const router = express.Router();

const accountsRoutes = require('./accounts');
const adminRoutes = require('./admin');
const transactionsRoutes = require('./transactions');

// Aggregate routes
router.use('/accounts', accountsRoutes);
router.use('/admin', adminRoutes);
router.use('/transactions', transactionsRoutes);

module.exports = router;