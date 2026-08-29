import dotenv from 'dotenv';
import app from './app.js';
import db from './models/index.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await db.sequelize.authenticate();
    console.log('✅ Database connection established');

    // Sync models (creates missing tables only)
    await db.sequelize.sync();
    console.log('✅ Models synchronized');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
};

start();
