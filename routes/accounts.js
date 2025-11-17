const express = require('express');
const router = express.Router();

// require controller (bisa diekspor sebagai class/constructor atau sebagai object)
const TransactionsControllerExport = require('../controllers/transactionsController');

let transactionsController;
if (typeof TransactionsControllerExport === 'function') {
  // exported a constructor/class
  transactionsController = new TransactionsControllerExport();
} else {
  // exported an object (plain functions)
  transactionsController = TransactionsControllerExport || {};
}

// helper untuk bind handler jika ada, atau fallback error handler
function handler(name) {
  const fn = transactionsController[name];
  if (typeof fn === 'function') return fn.bind(transactionsController);
  return (req, res) => res.status(500).json({ error: `${name} not implemented` });
}

// Contoh route (sesuaikan nama handler/route sesuai isi file asli)
router.get('/', handler('getAllAccounts'));
router.post('/', handler('createAccount'));
router.get('/:id', handler('getAccountById'));
router.put('/:id', handler('updateAccount'));
router.delete('/:id', handler('deleteAccount'));

module.exports = router;