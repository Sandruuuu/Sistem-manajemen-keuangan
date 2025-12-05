const db = require('../config/db');

async function getPool() {
  if (!db.pool || !db.pool()) {
    await db.init();
  }
  return db.pool();
}

function ensureBalanceColumn(conn) {
  // add balance column if not exists (safe)
  const sql = `ALTER TABLE accounts ADD COLUMN IF NOT EXISTS balance DECIMAL(12,2) DEFAULT 0`;
  return conn.query(sql).catch(() => {});
}

module.exports = {
  async createTransaction({ accountName, amount, type, category, note, date }) {
    if (!accountName || amount == null || !type) {
      throw new Error('accountName, amount and type are required');
    }

    const pool = await getPool();
    const conn = await pool.getConnection();
    
    try {
      await conn.beginTransaction();

      // ensure accounts table has balance column (no-op if exists)
      await ensureBalanceColumn(conn);

      // find or create account by name
      const [rows] = await conn.query('SELECT * FROM accounts WHERE name = ? LIMIT 1', [accountName]);
      let account;
      if (rows.length === 0) {
        const [res] = await conn.query('INSERT INTO accounts (name, created_at) VALUES (?, NOW())', [accountName]);
        const [newRow] = await conn.query('SELECT * FROM accounts WHERE id = ?', [res.insertId]);
        account = newRow[0];
      } else {
        account = rows[0];
      }

      const accountId = account.id;

      const insertSql = `INSERT INTO transactions (account_id, account_name, amount, type, category, note, date, created_at)
                         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`;
      const [ins] = await conn.query(insertSql, [accountId, accountName, amount, type, category || null, note || null, date || null]);

      // update account balance
      const delta = (type === 'income') ? parseFloat(amount) : -parseFloat(amount);
      await conn.query('UPDATE accounts SET balance = COALESCE(balance,0) + ? WHERE id = ?', [delta, accountId]);

      // insert into transaction_history
      const payload = JSON.stringify({ account_id: accountId, account_name: accountName, amount, type, category, note, date });
      await conn.query('INSERT INTO transaction_history (transaction_id, action, payload, created_at) VALUES (?, ?, ?, NOW())', [ins.insertId, 'create', payload]);

      await conn.commit();

      const [createdRows] = await conn.query('SELECT * FROM transactions WHERE id = ?', [ins.insertId]);
      return createdRows[0];
    } catch (err) {
      await conn.rollback().catch(()=>{});
      throw err;
    } finally {
      conn.release();
    }
  },

  async getTransactions(filters = {}) {
    // filters: accountName, account_id, from, to, type, category
    const params = [];
    let sql = 'SELECT * FROM transactions WHERE 1=1';

    if (filters.accountName) {
      sql += ' AND account_name = ?';
      params.push(filters.accountName);
    }
    if (filters.account_id) {
      sql += ' AND account_id = ?';
      params.push(filters.account_id);
    }
    if (filters.type) {
      sql += ' AND type = ?';
      params.push(filters.type);
    }
    if (filters.category) {
      sql += ' AND category = ?';
      params.push(filters.category);
    }
    if (filters.from) {
      sql += ' AND date >= ?';
      params.push(filters.from);
    }
    if (filters.to) {
      sql += ' AND date <= ?';
      params.push(filters.to);
    }

    sql += ' ORDER BY date DESC, created_at DESC LIMIT 1000';

    const [rows] = await pool.query(sql, params);
    return rows;
  },

  async updateTransaction(id, updates) {
    if (!id) throw new Error('id required');
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      // fetch old transaction
      const [oldRows] = await conn.query('SELECT * FROM transactions WHERE id = ? LIMIT 1', [id]);
      if (!oldRows.length) throw new Error('transaction not found');
      const old = oldRows[0];

      // apply updates
      const fields = [];
      const params = [];
      ['account_name','amount','type','category','note','date'].forEach(k => {
        if (k in updates) {
          fields.push(`${k} = ?`);
          params.push(updates[k]);
        }
      });
      if (fields.length) {
        params.push(id);
        await conn.query(`UPDATE transactions SET ${fields.join(', ')}, created_at = created_at WHERE id = ?`, params);
      }

      // adjust account balance if amount or type changed
      const newAmount = ('amount' in updates) ? parseFloat(updates.amount) : parseFloat(old.amount);
      const newType = ('type' in updates) ? updates.type : old.type;
      const oldDelta = (old.type === 'income') ? parseFloat(old.amount) : -parseFloat(old.amount);
      const newDelta = (newType === 'income') ? newAmount : -newAmount;
      const diff = newDelta - oldDelta;
      if (diff !== 0) {
        await conn.query('UPDATE accounts SET balance = COALESCE(balance,0) + ? WHERE id = ?', [diff, old.account_id]);
      }

      await conn.query('INSERT INTO transaction_history (transaction_id, action, payload, created_at) VALUES (?, ?, ?, NOW())', [id, 'update', JSON.stringify({ old, updates })]);

      await conn.commit();

      const [updatedRows] = await conn.query('SELECT * FROM transactions WHERE id = ?', [id]);
      return updatedRows[0];
    } catch (err) {
      await conn.rollback().catch(()=>{});
      throw err;
    } finally {
      conn.release();
    }
  },

  async deleteTransaction(id) {
    if (!id) throw new Error('id required');
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [rows] = await conn.query('SELECT * FROM transactions WHERE id = ? LIMIT 1', [id]);
      if (!rows.length) throw new Error('transaction not found');
      const t = rows[0];

      // reverse balance
      const delta = (t.type === 'income') ? -parseFloat(t.amount) : parseFloat(t.amount);
      await conn.query('UPDATE accounts SET balance = COALESCE(balance,0) + ? WHERE id = ?', [delta, t.account_id]);

      await conn.query('DELETE FROM transactions WHERE id = ?', [id]);
      await conn.query('INSERT INTO transaction_history (transaction_id, action, payload, created_at) VALUES (?, ?, ?, NOW())', [id, 'delete', JSON.stringify(t)]);
      await conn.commit();
      return;
    } catch (err) {
      await conn.rollback().catch(()=>{});
      throw err;
    } finally {
      conn.release();
    }
  }
};