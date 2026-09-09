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
    try {
      if (process.env.FORCE_SYNC === 'true') {
        await db.sequelize.sync({ force: true });
        console.log('✅ Models force-synchronized');
      } else {
        await db.sequelize.sync();
        console.log('✅ Models synchronized');
      }
    } catch (syncErr) {
      console.warn('⚠️ Model synchronization warning (tables exist):', syncErr.message);
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    console.error('Full error:', err);
    process.exit(1);
  }
};

start();
