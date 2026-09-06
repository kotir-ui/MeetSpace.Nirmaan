import db from '../models/index.js';

const { User, Role, Department, sequelize } = db;

const seedUsersDepartments = async () => {
  try {
    console.log('🌱 Starting seed of users and departments...');

    // Clear existing data
    console.log('🧹 Clearing existing users and departments...');
    await sequelize.query('SET FOREIGN_KEY_CHECKS=0');
    await User.truncate({ cascade: true });
    await Department.truncate({ cascade: true });
    await sequelize.query('SET FOREIGN_KEY_CHECKS=1');

    // Get roles
    const superAdmin = await Role.findOne({ where: { name: 'Super Admin' } });
    const admin = await Role.findOne({ where: { name: 'Admin' } });
    const deptHead = await Role.findOne({ where: { name: 'Department Head' } });
    const employee = await Role.findOne({ where: { name: 'Employee' } });
    const viewer = await Role.findOne({ where: { name: 'Viewer' } });

    if (!superAdmin || !admin || !deptHead || !employee || !viewer) {
      console.error('❌ Required roles not found. Run seedRolesPermissions.js first.');
      process.exit(1);
    }

    // Create departments
    console.log('📝 Creating departments...');
    const departments = await Department.bulkCreate([
      {
        name: 'Human Resources',
        code: 'HR',
        email: 'hr@company.com',
        description: 'Human Resources Department',
        status: 'active',
      },
      {
        name: 'Information Technology',
        code: 'IT',
        email: 'it@company.com',
        description: 'Information Technology Department',
        status: 'active',
      },
      {
        name: 'Sales and Marketing',
        code: 'SM',
        email: 'sales@company.com',
        description: 'Sales and Marketing Department',
        status: 'active',
      },
      {
        name: 'Operations',
        code: 'OPS',
        email: 'ops@company.com',
        description: 'Operations Department',
        status: 'active',
      },
    ]);

    console.log(`✅ Created ${departments.length} departments`);

    // Create super admin user
    console.log('👥 Creating users...');
    const superAdminUser = await User.create({
      employee_id: 'EMP0001',
      name: 'Super Admin',
      email: 'superadmin@nirmaan.org',
      mobile: '+1234567890',
      designation: 'System Administrator',
      password: 'Super@123',
      role_id: superAdmin.id,
      department_id: departments[0].id,
      joining_date: new Date('2024-01-01'),
      status: 'active',
      password_status: 'set',
    });

    // Create admin user
    const adminUser = await User.create({
      employee_id: 'EMP0002',
      name: 'Admin',
      email: 'admin@nirmaan.org',
      mobile: '+1111111111',
      designation: 'Administrator',
      password: 'Admin@123',
      role_id: admin.id,
      department_id: departments[0].id,
      joining_date: new Date('2024-01-15'),
      status: 'active',
      password_status: 'set',
    });

    // Create department head (Manager)
    const managerUser = await User.create({
      employee_id: 'EMP0003',
      name: 'Manager',
      email: 'manager@nirmaan.org',
      mobile: '+2222222222',
      designation: 'Department Head',
      password: 'Manager@123',
      role_id: deptHead.id,
      department_id: departments[1].id,
      joining_date: new Date('2024-01-15'),
      status: 'active',
      password_status: 'set',
    });

    // Update departments with head
    await departments[1].update({ department_head_id: managerUser.id });

    // Create regular employees
    const employees = await User.bulkCreate([
      {
        employee_id: 'EMP0004',
        name: 'Employee 1',
        email: 'emp1@nirmaan.org',
        mobile: '+4444444444',
        designation: 'Software Developer',
        password: 'Employee@123',
        role_id: employee.id,
        department_id: departments[1].id,
        manager_id: managerUser.id,
        joining_date: new Date('2024-02-01'),
        status: 'active',
        password_status: 'set',
      },
      {
        employee_id: 'EMP0005',
        name: 'Employee 2',
        email: 'emp2@nirmaan.org',
        mobile: '+5555555555',
        designation: 'Sales Executive',
        password: 'Employee@123',
        role_id: employee.id,
        department_id: departments[2].id,
        joining_date: new Date('2024-02-15'),
        status: 'active',
        password_status: 'set',
      },
      {
        employee_id: 'EMP0006',
        name: 'Employee 3',
        email: 'emp3@nirmaan.org',
        mobile: '+6666666666',
        designation: 'HR Specialist',
        password: 'Employee@123',
        role_id: employee.id,
        department_id: departments[0].id,
        joining_date: new Date('2024-03-01'),
        status: 'active',
        password_status: 'set',
      },
      {
        employee_id: 'EMP0007',
        name: 'Employee 4',
        email: 'emp4@nirmaan.org',
        mobile: '+7777777777',
        designation: 'Operations Officer',
        password: 'Employee@123',
        role_id: employee.id,
        department_id: departments[3].id,
        joining_date: new Date('2024-03-15'),
        status: 'active',
        password_status: 'set',
      },
      {
        employee_id: 'EMP0008',
        name: 'Employee 5',
        email: 'emp5@nirmaan.org',
        mobile: '+8888888888',
        designation: 'Senior Developer',
        password: 'Employee@123',
        role_id: employee.id,
        department_id: departments[1].id,
        manager_id: managerUser.id,
        joining_date: new Date('2024-04-01'),
        status: 'active',
        password_status: 'set',
      },
    ]);

    // Create a viewer user
    await User.create({
      employee_id: 'EMP0009',
      name: 'Viewer',
      email: 'viewer@nirmaan.org',
      mobile: '+9999999999',
      designation: 'Guest User',
      password: 'Viewer@123',
      role_id: viewer.id,
      department_id: null,
      joining_date: new Date('2024-04-15'),
      status: 'active',
      password_status: 'set',
    });

    console.log(`✅ Created 1 super admin, 1 admin, 1 manager, 5 employees, 1 viewer = 9 users total`);

    // Create deputy for IT department
    console.log('🔗 Assigning deputies...');
    await departments[1].update({ deputy_id: employees[0].id });

    console.log('✅ Assigned deputies to departments');

    console.log('\n✨ Seed completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Departments: ${departments.length}`);
    console.log(`   - Users: 9 (1 super admin, 1 admin, 1 manager, 5 employees, 1 viewer)`);
    console.log('\n🔑 Test Credentials:');
    console.log(`   Super Admin: superadmin@nirmaan.org / Super@123`);
    console.log(`   Admin:       admin@nirmaan.org / Admin@123`);
    console.log(`   Manager:     manager@nirmaan.org / Manager@123`);
    console.log(`   Viewer:      viewer@nirmaan.org / Viewer@123`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    console.error('Full error:', err);
    process.exit(1);
  }
};

seedUsersDepartments();
