require('dotenv').config();
const express = require('express');
const db = require('./config/db');

const app = express();

// Init database SEBELUM load routes
(async () => {
  try {
    await db.init();
    console.log('✅ Database connected');
    
    app.use(express.json());
    
    // HANYA endpoint transaksi dan analytics
    app.use('/transactions', require('./routes/transactions'));
    
    // 404 handler
    app.use((req, res) => {
      res.status(404).json({
        status: 'fail',
        message: 'Endpoint tidak ditemukan',
        data: null
      });
    });
    
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Endpoints tersedia:`);
      console.log(`   - POST   /transactions (Buat transaksi)`);
      console.log(`   - GET    /transactions (List semua transaksi)`);
      console.log(`   - GET    /transactions/:id (Detail transaksi)`);
      console.log(`   - PUT    /transactions/:id (Update transaksi)`);
      console.log(`   - DELETE /transactions/:id (Hapus transaksi)`);
      console.log(`   - GET    /transactions/analytics (Analisis keuangan)`);
    });
  } catch (err) {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  }
})();