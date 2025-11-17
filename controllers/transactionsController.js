/**
 * transactionsController
 * - Exports plain functions so routes can require them directly.
 * - If a services/transactionService exists it will be used, otherwise
 *   the controller falls back to simple responses so the server won't crash.
 */

const transactionService = (() => {
  try {
    return require('../services/transactionService');
  } catch (err) {
    return null;
  }
})();

function hasService() {
  return transactionService && typeof transactionService.getTransactions === 'function';
}

module.exports = {
  async getAllTransactions(req, res) {
    try {
      if (hasService()) {
        const transactions = await transactionService.getTransactions(req.query);
        return res.json({ data: transactions });
      }
      // fallback: return empty list if service not implemented yet
      return res.json({ data: [] });
    } catch (err) {
      return res.status(500).json({ error: 'Server error' });
    }
  },

  async createTransaction(req, res) {
    try {
      const { accountName, amount, type, category, note, date } = req.body;
      if (!accountName || amount == null || !type) {
        return res.status(400).json({ error: 'accountName, amount and type are required' });
      }

      if (hasService()) {
        const created = await transactionService.createTransaction({
          accountName,
          amount,
          type,
          category,
          note,
          date,
        });
        return res.status(201).json({ data: created });
      }

      // fallback: echo back created object (temporary)
      return res.status(201).json({
        data: { id: null, accountName, amount, type, category, note, date, created_at: new Date() },
      });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },

  async updateTransaction(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      if (!id) return res.status(400).json({ error: 'id is required' });

      if (hasService()) {
        const updated = await transactionService.updateTransaction(id, updates);
        return res.json({ data: updated });
      }

      // fallback: return updates
      return res.json({ data: { id, ...updates } });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },

  async deleteTransaction(req, res) {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ error: 'id is required' });

      if (hasService()) {
        await transactionService.deleteTransaction(id);
        return res.status(204).send();
      }

      // fallback: pretend deleted
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
};