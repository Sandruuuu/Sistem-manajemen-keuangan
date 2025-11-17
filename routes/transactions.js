const express = require("express");
const router = express.Router();

// transactionsController exports plain functions (object), not a class
const transactionsController = require("../controllers/transactionsController") || {};

// safe helper: if handler missing, return 501
function safe(name) {
  const fn = transactionsController[name];
  if (typeof fn === "function") return fn;
  return (req, res) =>
    res.status(501).json({ error: `${name} not implemented` });
}

// Routes for transactions
router.get("/", safe("getAllTransactions"));
router.post("/", safe("createTransaction"));
router.put("/:id", safe("updateTransaction"));
router.delete("/:id", safe("deleteTransaction"));

module.exports = router;
