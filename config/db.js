const mongoose = require('mongoose');

const dbURI = process.env.DB_URI || 'mongodb://localhost:27017/sistem-keuangan';

const init = async () => {
  try {
    await mongoose.connect(dbURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
};

module.exports = {
  init,
};