const express = require('express');
const router = express.Router();
const TransactionsController = require('../controllers/transactionsController');

const transactionsController = new TransactionsController();

// Admin routes for managing transactions
router.get('/transactions', transactionsController.getAllTransactions.bind(transactionsController));
router.delete('/transactions/:id', transactionsController.deleteTransaction.bind(transactionsController));

module.exports = router;