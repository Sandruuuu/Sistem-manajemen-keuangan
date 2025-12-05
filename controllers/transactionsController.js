/**
 * transactionsController
 * - Exports plain functions so routes can require them directly.
 * - If a services/transactionService exists it will be used, otherwise
 *   the controller falls back to simple responses so the server won't crash.
 */

const transactionService = (() => {
  try { return require('../services/transactionService'); } catch { return null; }
})();
const db = require('../config/db');

const hasServiceMethod = (name) => transactionService && typeof transactionService[name] === 'function';

const RESPONSE_STATUS = { SUCCESS: 'success', FAIL: 'fail' };

const respondSuccess = (res, message, data = null, code = 200) =>
  res.status(code).json({ status: RESPONSE_STATUS.SUCCESS, message, data });

const respondFail = (res, code, message) =>
  res.status(code).json({ status: RESPONSE_STATUS.FAIL, message, data: null });

function sanitizeTransactionInput(raw = {}) {
  const sanitized = {};
  const accountName = raw.accountName ?? raw.account_name;
  if (accountName !== undefined) sanitized.accountName = String(accountName).trim();
  if (raw.amount !== undefined) sanitized.amount = parseAmount(raw.amount);
  if (raw.type !== undefined) sanitized.type = String(raw.type).toLowerCase();
  if (raw.category !== undefined) sanitized.category = normalizeOptionalText(raw.category);
  if (raw.note !== undefined) sanitized.note = normalizeOptionalText(raw.note);
  if (raw.date !== undefined) {
    if (raw.date === null) sanitized.date = null;
    else {
      const trimmed = String(raw.date).trim();
      if (trimmed.length) sanitized.date = trimmed;
    }
  }
  return sanitized;
}

const normalizeOptionalText = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = String(value).trim();
  return trimmed.length ? trimmed : null;
};

const parseAmount = (value) => {
  if (value === undefined || value === null || value === '') return NaN;
  const num = Number(value);
  return Number.isFinite(num) ? num : NaN;
};

function validateTransactionInput(payload, { partial = false } = {}) {
  const errors = [];
  const has = (field) => Object.prototype.hasOwnProperty.call(payload, field);

  if (!partial || has('accountName')) {
    const name = payload.accountName;
    if (!name || typeof name !== 'string' || !name.trim()) errors.push('accountName wajib diisi');
    else payload.accountName = name.trim();
  }

  if (!partial || has('amount')) {
    if (payload.amount === undefined || Number.isNaN(payload.amount)) errors.push('amount wajib berupa angka');
    else if (payload.amount <= 0) errors.push('amount harus lebih besar dari 0');
  }

  if (!partial || has('type')) {
    if (!payload.type || !['income', 'expense'].includes(payload.type)) {
      errors.push("type harus bernilai 'income' atau 'expense'");
    }
  }

  if (has('date') && payload.date && Number.isNaN(Date.parse(payload.date))) {
    errors.push('format date tidak valid');
  }

  return errors;
}

function normalizeFilters(query = {}) {
  const filters = {};
  const accountName = query.accountName ?? query.account_name;
  if (accountName !== undefined) {
    const value = String(accountName).trim();
    if (value) filters.accountName = value;
  }
  const accountId = query.accountId ?? query.account_id;
  if (accountId !== undefined) {
    const parsed = Number(accountId);
    filters.accountId = Number.isFinite(parsed) ? parsed : NaN;
  }
  if (query.type) filters.type = String(query.type).toLowerCase();
  if (query.category) {
    const cat = String(query.category).trim();
    if (cat) filters.category = cat;
  }
  const fromDate = query.fromDate ?? query.from;
  if (fromDate) filters.fromDate = String(fromDate).trim();
  const toDate = query.toDate ?? query.to;
  if (toDate) filters.toDate = String(toDate).trim();
  return filters;
}

function validateFilterQuery(filters = {}) {
  const errors = [];
  if (filters.accountId !== undefined && filters.accountId !== null && Number.isNaN(filters.accountId)) {
    errors.push('accountId tidak valid');
  }
  if (filters.type && !['income', 'expense'].includes(filters.type)) {
    errors.push("type filter harus 'income' atau 'expense'");
  }
  if (filters.fromDate && Number.isNaN(Date.parse(filters.fromDate))) errors.push('fromDate tidak valid');
  if (filters.toDate && Number.isNaN(Date.parse(filters.toDate))) errors.push('toDate tidak valid');
  if (filters.fromDate && filters.toDate && new Date(filters.fromDate) > new Date(filters.toDate)) {
    errors.push('fromDate tidak boleh lebih besar dari toDate');
  }
  return errors;
}

const cleanFilterObject = (filters = {}) =>
  Object.keys(filters).reduce((acc, key) => {
    const value = filters[key];
    if (value === undefined || value === null || value === '' || Number.isNaN(value)) return acc;
    acc[key] = value;
    return acc;
  }, {});

function buildWhereClause(rawFilters = {}, alias = 't') {
  const filters = cleanFilterObject(rawFilters);
  const clauses = [];
  const params = [];
  const col = (field) => `${alias}.${field}`;

  if (filters.accountId !== undefined) { clauses.push(`${col('account_id')} = ?`); params.push(filters.accountId); }
  if (filters.accountName) { clauses.push(`${col('account_name')} = ?`); params.push(filters.accountName); }
  if (filters.type) { clauses.push(`${col('type')} = ?`); params.push(filters.type); }
  if (filters.category) { clauses.push(`${col('category')} = ?`); params.push(filters.category); }
  if (filters.fromDate) { clauses.push(`${col('date')} >= ?`); params.push(filters.fromDate); }
  if (filters.toDate) { clauses.push(`${col('date')} <= ?`); params.push(filters.toDate); }

  return { clause: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '', params };
}

async function computeAnalyticsWithDb(filters = {}) {
  const pool = await db.init();
  const { clause, params } = buildWhereClause(filters);
  const summaryParams = [...params];
  const [summaryRows] = await pool.query(`
    SELECT
      COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount END), 0) AS total_income,
      COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount END), 0) AS total_expense,
      COUNT(*) AS total_transactions
    FROM transactions t
    ${clause}
  `, summaryParams);

  const summary = (summaryRows && summaryRows[0]) || {};
  const income = Number(summary.total_income || 0);
  const expense = Number(summary.total_expense || 0);
  const txCount = Number(summary.total_transactions || 0);
  const net = income - expense;
  const avg = txCount ? (income + expense) / txCount : 0;
  const ratio = income > 0 ? (expense / income) * 100 : null;

  const categoryClause = clause ? `${clause} AND t.category IS NOT NULL` : 'WHERE t.category IS NOT NULL';
  const categoryParams = [...params];
  const [categoryRows] = await pool.query(`
    SELECT
      t.category,
      SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) AS total_income,
      SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) AS total_expense,
      SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END) AS net_amount
    FROM transactions t
    ${categoryClause}
    GROUP BY t.category
    ORDER BY net_amount DESC
    LIMIT 5
  `, categoryParams);

  const trendParams = [...params];
  const [trendRows] = await pool.query(`
    SELECT
      DATE_FORMAT(COALESCE(t.date, t.created_at), '%Y-%m') AS period,
      SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) AS income,
      SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) AS expense
    FROM transactions t
    ${clause}
    GROUP BY period
    ORDER BY period ASC
  `, trendParams);

  return {
    totals: {
      income: Number(income.toFixed(2)),
      expense: Number(expense.toFixed(2)),
      net: Number(net.toFixed(2))
    },
    metrics: {
      transactionCount: txCount,
      averageTransaction: Number(avg.toFixed(2)),
      expenseToIncomeRatio: ratio !== null ? Number(ratio.toFixed(2)) : null
    },
    topCategories: categoryRows.map((row) => ({
      category: row.category,
      total_income: Number(row.total_income || 0),
      total_expense: Number(row.total_expense || 0),
      net_amount: Number(row.net_amount || 0)
    })),
    monthlyTrend: trendRows.map((row) => ({
      period: row.period,
      income: Number(row.income || 0),
      expense: Number(row.expense || 0),
      net: Number((Number(row.income || 0) - Number(row.expense || 0)).toFixed(2))
    }))
  };
}

module.exports = {
  async getAllTransactions(req, res) {
    const filters = normalizeFilters(req.query || {});
    const filterErrors = validateFilterQuery(filters);
    if (filterErrors.length) return respondFail(res, 400, filterErrors[0]);
    const cleanedFilters = cleanFilterObject(filters);

    try {
      let rows;
      if (hasServiceMethod('getTransactions')) {
        rows = await transactionService.getTransactions(cleanedFilters);
      } else {
        const pool = await db.init();
        const { clause, params } = buildWhereClause(cleanedFilters);
        const [result] = await pool.query(`
          SELECT t.*, a.name AS account_name
          FROM transactions t
          LEFT JOIN accounts a ON a.id = t.account_id
          ${clause}
          ORDER BY t.date DESC, t.created_at DESC
        `, params);
        rows = result;
      }
      return respondSuccess(res, 'Daftar transaksi berhasil diambil', rows || []);
    } catch (err) {
      console.error('getAllTransactions error:', err);
      return respondFail(res, 500, 'Gagal mengambil daftar transaksi');
    }
  },

  async getTransactionById(req, res) {
    try {
      const { id } = req.params;
      const pool = await db.init();
      const [rows] = await pool.query(`
        SELECT t.*, a.name AS account_name
        FROM transactions t
        LEFT JOIN accounts a ON a.id = t.account_id
        WHERE t.id = ?
      `, [id]);
      if (!rows.length) return respondFail(res, 404, 'Transaksi tidak ditemukan');
      return respondSuccess(res, 'Detail transaksi berhasil diambil', rows[0]);
    } catch (err) {
      console.error('getTransactionById error:', err);
      return respondFail(res, 500, 'Gagal mengambil detail transaksi');
    }
  },

  async createTransaction(req, res) {
    const payload = sanitizeTransactionInput(req.body || {});
    const errors = validateTransactionInput(payload);
    if (errors.length) return respondFail(res, 400, errors[0]);

    try {
      let created;
      if (hasServiceMethod('createTransaction')) {
        created = await transactionService.createTransaction({
          accountName: payload.accountName,
          amount: payload.amount,
          type: payload.type,
          category: payload.category ?? null,
          note: payload.note ?? null,
          date: payload.date ?? null
        });
      } else {
        const pool = await db.init();
        const [acctRows] = await pool.query('SELECT * FROM accounts WHERE name = ? LIMIT 1', [payload.accountName]);
        let account = acctRows[0];
        if (!account) {
          const [insertResult] = await pool.query('INSERT INTO accounts (name, created_at) VALUES (?, NOW())', [payload.accountName]);
          const [newAccount] = await pool.query('SELECT * FROM accounts WHERE id = ?', [insertResult.insertId]);
          account = newAccount[0];
        }
        const txDate = payload.date || new Date().toISOString().slice(0, 10);
        const [result] = await pool.query(
          `INSERT INTO transactions (account_id, account_name, amount, type, category, note, date, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
          [account.id, account.name, payload.amount, payload.type, payload.category || null, payload.note || null, txDate]
        );
        await pool.query('UPDATE accounts SET balance = COALESCE(balance,0) + ? WHERE id = ?', [
          payload.type === 'income' ? payload.amount : -payload.amount,
          account.id
        ]);
        const [createdRows] = await pool.query('SELECT * FROM transactions WHERE id = ?', [result.insertId]);
        created = createdRows[0];
      }
      return respondSuccess(res, 'Transaksi berhasil dibuat', created, 201);
    } catch (err) {
      console.error('createTransaction error:', err);
      return respondFail(res, 400, err.message || 'Gagal membuat transaksi');
    }
  },

  async updateTransaction(req, res) {
    const { id } = req.params;
    const updates = sanitizeTransactionInput(req.body || {});
    if (!Object.keys(updates).length) {
      return respondFail(res, 400, 'Tidak ada data yang perlu diperbarui');
    }
    const errors = validateTransactionInput(updates, { partial: true });
    if (errors.length) return respondFail(res, 400, errors[0]);

    try {
      if (hasServiceMethod('updateTransaction')) {
        const payload = { ...updates };
        if (payload.accountName !== undefined) {
          payload.account_name = payload.accountName;
          delete payload.accountName;
        }
        const updated = await transactionService.updateTransaction(id, payload);
        return respondSuccess(res, 'Transaksi berhasil diperbarui', updated);
      }

      const allowedFields = ['category', 'note', 'date'];
      const fields = [];
      const params = [];
      allowedFields.forEach((field) => {
        if (updates[field] !== undefined) {
          fields.push(`${field} = ?`);
          params.push(updates[field]);
        }
      });
      if (!fields.length) {
        return respondFail(res, 400, 'Bidang yang dapat diperbarui tanpa service hanya category, note, atau date');
      }
      const pool = await db.init();
      params.push(id);
      const [result] = await pool.query(`UPDATE transactions SET ${fields.join(', ')} WHERE id = ?`, params);
      if (!result.affectedRows) return respondFail(res, 404, 'Transaksi tidak ditemukan');
      const [rows] = await pool.query('SELECT * FROM transactions WHERE id = ?', [id]);
      return respondSuccess(res, 'Transaksi berhasil diperbarui', rows[0]);
    } catch (err) {
      console.error('updateTransaction error:', err);
      const statusCode = err.message === 'transaction not found' ? 404 : 400;
      return respondFail(res, statusCode, err.message || 'Gagal memperbarui transaksi');
    }
  },

  async deleteTransaction(req, res) {
    const { id } = req.params;
    try {
      if (hasServiceMethod('deleteTransaction')) {
        await transactionService.deleteTransaction(id);
        return respondSuccess(res, 'Transaksi berhasil dihapus', { id: Number(id) || id });
      }
      const pool = await db.init();
      const [rows] = await pool.query('SELECT * FROM transactions WHERE id = ?', [id]);
      if (!rows.length) return respondFail(res, 404, 'Transaksi tidak ditemukan');
      const tx = rows[0];
      await pool.query('DELETE FROM transactions WHERE id = ?', [id]);
      await pool.query(
        'INSERT INTO transaction_history (transaction_id, action, payload, created_at) VALUES (?, ?, ?, NOW())',
        [id, 'delete', JSON.stringify(tx)]
      );
      return respondSuccess(res, 'Transaksi berhasil dihapus', tx);
    } catch (err) {
      console.error('deleteTransaction error:', err);
      const statusCode = err.message === 'transaction not found' ? 404 : 500;
      return respondFail(res, statusCode, err.message || 'Gagal menghapus transaksi');
    }
  },

  async getTransactionAnalytics(req, res) {
    const filters = normalizeFilters(req.query || {});
    const filterErrors = validateFilterQuery(filters);
    if (filterErrors.length) return respondFail(res, 400, filterErrors[0]);
    const cleanedFilters = cleanFilterObject(filters);

    try {
      const analytics = hasServiceMethod('getTransactionAnalytics')
        ? await transactionService.getTransactionAnalytics(cleanedFilters)
        : await computeAnalyticsWithDb(cleanedFilters);
      return respondSuccess(res, 'Analisis transaksi berhasil diambil', analytics);
    } catch (err) {
      console.error('getTransactionAnalytics error:', err);
      return respondFail(res, 500, 'Gagal mengambil analisis transaksi');
    }
  }
};