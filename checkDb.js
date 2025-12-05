const db = require('./config/db');

(async () => {
  let pool;
  try {
    pool = await db.init();
    const [rows] = await pool.query('SELECT DATABASE() AS database_name, USER() AS user_name, VERSION() AS mysql_version, @@socket AS socket_path');
    console.log('connection info:', rows[0]);
  } catch (err) {
    console.error('db check error:', err);
  } finally {
    if (pool) await pool.end().catch(()=>{});
  }
})();