import db from '../models/index.js';

// One-off: add users.department if it doesn't exist yet.
const run = async () => {
  const qi = db.sequelize.getQueryInterface();
  const table = await qi.describeTable('users');
  if (!table.department) {
    await qi.addColumn('users', 'department', {
      type: (await import('sequelize')).DataTypes.STRING(120),
      allowNull: true,
    });
    console.log('✅ Added users.department');
  } else {
    console.log('ℹ️  users.department already exists');
  }
  await db.sequelize.close();
  process.exit(0);
};

run().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
