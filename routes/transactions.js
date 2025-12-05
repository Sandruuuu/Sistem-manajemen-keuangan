const express = require("express");
const router = express.Router();
const transactionsController = require("../controllers/transactionsController") || {};

// safe helper: if handler missing, return 501
function safe(name) {
  const fn = transactionsController[name];
  if (typeof fn === "function") return fn;
  return (req, res) =>
    res.status(501).json({
      status: "fail",
      message: `${name} belum diimplementasikan`,
      data: null
    });
}

// PENTING: Analytics HARUS di atas /:id
router.get("/analytics", safe("getTransactionAnalytics"));

// CRUD Transactions
router.get("/", safe("getAllTransactions"));
router.post("/", safe("createTransaction"));
router.get("/:id", safe("getTransactionById"));
router.put("/:id", safe("updateTransaction"));
router.delete("/:id", safe("deleteTransaction"));

module.exports = router;
