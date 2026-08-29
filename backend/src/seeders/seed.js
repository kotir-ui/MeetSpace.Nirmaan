import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import db from '../models/index.js';

dotenv.config();

const { sequelize, Role, User, MeetingRoom, Department } = db;

// Ensure the database exists before Sequelize connects.
const ensureDatabase = async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });
  await conn.query(
    `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
  );
  await conn.end();
  console.log(`✅ Database "${process.env.DB_NAME}" ready`);
};

const seed = async () => {
  await ensureDatabase();
  await sequelize.authenticate();
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
  await sequelize.sync({ force: true });
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
  console.log('✅ Tables re-created');

  // Roles
  const [superAdmin, admin, manager, viewer] = await Role.bulkCreate(
    [
      { name: 'Super Admin', description: 'Unrestricted access to every module and setting' },
      { name: 'Admin', description: 'Full access to all features' },
      { name: 'Manager', description: 'Department manager with approval rights' },
      { name: 'Viewer', description: 'Read-only access to portal' },
    ],
    { returning: true }
  );

  // Users
  await User.create({ name: 'Super Admin', email: 'superadmin@nirmaan.org', password: 'Super@123', role_id: superAdmin.id });
  await User.create({ name: 'Nirmaan Admin', email: 'admin@nirmaan.org', password: 'Admin@123', role_id: admin.id });
  await User.create({ name: 'Nirmaan Manager', email: 'manager@nirmaan.org', password: 'Manager@123', role_id: manager.id });
  await User.create({ name: 'Nirmaan Viewer', email: 'viewer@nirmaan.org', password: 'Viewer@123', role_id: viewer.id });
  console.log('✅ Users created');

  await Department.bulkCreate([
    { name: 'Organization HR Department' },
    { name: 'Technology Department' },
    { name: 'ISR Department' },
    { name: 'Partnership Department' },
    { name: 'Project HR Department' },
    { name: 'Finance Department' },
    { name: 'Administration Department' },
    { name: 'IT Department' },
    { name: 'Marketing & Communications Department' },
    { name: 'Operations Department' },
    { name: 'Learning & Development Department' },
    { name: 'Programs Department' },
    { name: 'Career Services Department' },
    { name: 'Management / Leadership' },
    { name: 'Other / External Visitors' },
  ]);
  console.log('✅ Departments created');

  await MeetingRoom.bulkCreate([
    { name: 'Sarvepalli Radhakrishnan', room_number: 'MR-01', location: 'Main Office', capacity: 12, floor: 1, room_status: 'active' },
    { name: 'Ratan Tata', room_number: 'MR-02', location: 'Main Office', capacity: 12, floor: 1, room_status: 'active' },
    { name: 'Dr. Bidhan Chandra Roy', room_number: 'MR-03', location: 'Main Office', capacity: 10, floor: 1, room_status: 'active' },
    { name: 'Sunderlal Bahuguna', room_number: 'MR-04', location: 'Main Office', capacity: 10, floor: 1, room_status: 'active' },
    { name: 'M.S. Swaminathan', room_number: 'MR-05', location: 'Main Office', capacity: 8, floor: 1, room_status: 'active' },
    { name: 'Savitribai Phule', room_number: 'MR-06', location: 'Main Office', capacity: 8, floor: 1, room_status: 'active' },
  ]);
  console.log('✅ Meeting rooms created');

  console.log('\n🎉 Seed complete!');
  console.log('   Super Admin -> superadmin@nirmaan.org / Super@123');
  console.log('   Admin       -> admin@nirmaan.org / Admin@123');
  console.log('   Manager     -> manager@nirmaan.org / Manager@123');
  console.log('   Viewer      -> viewer@nirmaan.org / Viewer@123');
  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
