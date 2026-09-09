import db from '../models/index.js';
import ActivityLog from '../models/ActivityLog.js';

const { Department, User, MeetingRoom } = db;

// Get all departments with optional filtering
export const getAllDepartments = async (req, res) => {
  try {
    const { status, search } = req.query;

    const where = {};
    if (status) where.status = status;

    // Search by name or code
    if (search) {
      const { Op } = await import('sequelize');
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { code: { [Op.like]: `%${search}%` } },
      ];
    }

    let departments = await Department.findAll({
      where,
      include: [
        {
          model: User,
          as: 'head',
          attributes: ['id', 'name', 'email', 'mobile', 'designation'],
        },
        {
          model: User,
          as: 'deputy',
          attributes: ['id', 'name', 'email', 'mobile', 'designation'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    if (departments.length === 0 && !status && !search) {
      const defaultDepts = [
        { name: 'Engineering', code: 'ENG', description: 'Software and hardware engineering', status: 'active' },
        { name: 'Human Resources', code: 'HR', description: 'Human resources and talent management', status: 'active' },
        { name: 'Marketing', code: 'MKT', description: 'Brand and digital marketing', status: 'active' },
        { name: 'Sales & Business', code: 'SALES', description: 'Sales and business development', status: 'active' },
        { name: 'Finance & Accounts', code: 'FIN', description: 'Financial planning and accounts', status: 'active' },
        { name: 'Operations & Facilities', code: 'OPS', description: 'Operations and facility management', status: 'active' },
        { name: 'Information Technology', code: 'IT', description: 'IT infrastructure and support', status: 'active' },
        { name: 'Product Management', code: 'PM', description: 'Product design and strategy', status: 'active' },
        { name: 'Management / Executive', code: 'EXEC', description: 'Executive leadership and management', status: 'active' },
      ];
      try {
        await Department.bulkCreate(defaultDepts, { ignoreDuplicates: true });
        departments = await Department.findAll({
          include: [
            {
              model: User,
              as: 'head',
              attributes: ['id', 'name', 'email', 'mobile', 'designation'],
            },
            {
              model: User,
              as: 'deputy',
              attributes: ['id', 'name', 'email', 'mobile', 'designation'],
            },
          ],
          order: [['id', 'ASC']],
        });
      } catch (seedErr) {
        console.warn('Could not auto-seed departments:', seedErr.message);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Departments retrieved successfully',
      data: departments,
      count: departments.length,
    });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving departments',
      error: error.message,
    });
  }
};

// Get single department by ID
export const getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const department = await Department.findByPk(id, {
      include: [
        {
          model: User,
          as: 'head',
          attributes: ['id', 'name', 'email', 'mobile', 'designation'],
        },
        {
          model: User,
          as: 'deputy',
          attributes: ['id', 'name', 'email', 'mobile', 'designation'],
        },
        {
          model: User,
          as: 'users',
          attributes: ['id', 'name', 'email', 'employee_id', 'status'],
        },
      ],
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    // Get department statistics
    const stats = {
      total_users: department.users?.length || 0,
      active_users: (department.users || []).filter((u) => u.status === 'active').length,
      meeting_rooms: await MeetingRoom.count({ where: { owning_department_id: id } }),
    };

    res.status(200).json({
      success: true,
      message: 'Department retrieved successfully',
      data: {
        ...department.toJSON(),
        stats,
      },
    });
  } catch (error) {
    console.error('Error fetching department:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving department',
      error: error.message,
    });
  }
};

// Create new department
export const createDepartment = async (req, res) => {
  try {
    const { name, code, department_head_id, deputy_id, email, description } = req.body;

    // Validation
    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, code',
      });
    }

    // Check if code already exists
    const existingDept = await Department.findOne({ where: { code } });
    if (existingDept) {
      return res.status(409).json({
        success: false,
        message: 'Department code already exists',
      });
    }

    // Verify department head exists if provided
    if (department_head_id) {
      const head = await User.findByPk(department_head_id);
      if (!head) {
        return res.status(400).json({
          success: false,
          message: 'Invalid department_head_id',
        });
      }
    }

    // Verify deputy exists if provided
    if (deputy_id) {
      const deputy = await User.findByPk(deputy_id);
      if (!deputy) {
        return res.status(400).json({
          success: false,
          message: 'Invalid deputy_id',
        });
      }
    }

    // Create department
    const newDept = await Department.create({
      name,
      code,
      department_head_id: department_head_id || null,
      deputy_id: deputy_id || null,
      email: email || null,
      description: description || null,
      status: 'active',
    });

    // Log activity
    await ActivityLog.create({
      user_id: req.user?.id,
      action: 'DEPARTMENT_CREATE',
      entity_type: 'Department',
      entity_id: newDept.id,
      description: `Created new department: ${newDept.name} (${newDept.code})`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
    });

    const deptResponse = await Department.findByPk(newDept.id, {
      include: [
        {
          model: User,
          as: 'head',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: User,
          as: 'deputy',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: deptResponse,
    });
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating department',
      error: error.message,
    });
  }
};

// Update department
export const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, department_head_id, deputy_id, email, description } = req.body;

    const dept = await Department.findByPk(id);
    if (!dept) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    // If code is being updated, check for uniqueness
    if (code && code !== dept.code) {
      const existingCode = await Department.findOne({ where: { code } });
      if (existingCode) {
        return res.status(409).json({
          success: false,
          message: 'Department code already exists',
        });
      }
    }

    // Verify department head exists if provided
    if (department_head_id && department_head_id !== dept.department_head_id) {
      const head = await User.findByPk(department_head_id);
      if (!head) {
        return res.status(400).json({
          success: false,
          message: 'Invalid department_head_id',
        });
      }
    }

    // Verify deputy exists if provided
    if (deputy_id && deputy_id !== dept.deputy_id) {
      const deputy = await User.findByPk(deputy_id);
      if (!deputy) {
        return res.status(400).json({
          success: false,
          message: 'Invalid deputy_id',
        });
      }
    }

    // Update department
    await dept.update({
      name: name || dept.name,
      code: code || dept.code,
      department_head_id: department_head_id !== undefined ? department_head_id : dept.department_head_id,
      deputy_id: deputy_id !== undefined ? deputy_id : dept.deputy_id,
      email: email !== undefined ? email : dept.email,
      description: description !== undefined ? description : dept.description,
    });

    // Log activity
    await ActivityLog.create({
      user_id: req.user?.id,
      action: 'DEPARTMENT_UPDATE',
      entity_type: 'Department',
      entity_id: dept.id,
      description: `Updated department: ${dept.name} (${dept.code})`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
    });

    const updatedDept = await Department.findByPk(id, {
      include: [
        {
          model: User,
          as: 'head',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: User,
          as: 'deputy',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: 'Department updated successfully',
      data: updatedDept,
    });
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating department',
      error: error.message,
    });
  }
};

// Change department status
export const changeDepartmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: active, inactive',
      });
    }

    const dept = await Department.findByPk(id);
    if (!dept) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    // If deactivating, warn if there are active users or bookings
    if (status === 'inactive') {
      const activeUsers = await User.count({
        where: { department_id: id, status: 'active' },
      });

      if (activeUsers > 0) {
        return res.status(409).json({
          success: false,
          message: `Cannot deactivate department with ${activeUsers} active user(s)`,
          suggestion: 'Deactivate or reassign users before deactivating department',
        });
      }
    }

    const oldStatus = dept.status;
    await dept.update({ status });

    // Log activity
    await ActivityLog.create({
      user_id: req.user?.id,
      action: 'DEPARTMENT_STATUS_CHANGE',
      entity_type: 'Department',
      entity_id: dept.id,
      description: `Changed department status from '${oldStatus}' to '${status}'`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
    });

    res.status(200).json({
      success: true,
      message: `Department status changed to ${status}`,
      data: {
        id: dept.id,
        name: dept.name,
        code: dept.code,
        status: dept.status,
      },
    });
  } catch (error) {
    console.error('Error changing department status:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing department status',
      error: error.message,
    });
  }
};

// Delete department
export const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    const dept = await Department.findByPk(id);
    if (!dept) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    // Check for active dependencies
    const [activeUsers, meetingRooms] = await Promise.all([
      User.count({ where: { department_id: id, status: 'active' } }),
      MeetingRoom.count({ where: { owning_department_id: id, status: 'available' } }),
    ]);

    const dependencies = [];
    if (activeUsers > 0) dependencies.push(`${activeUsers} active user(s)`);
    if (meetingRooms > 0) dependencies.push(`${meetingRooms} active meeting room(s)`);

    if (dependencies.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete department with active dependencies',
        dependencies,
        suggestion: 'Deactivate or reassign resources before deleting department',
      });
    }

    // Log activity before delete
    await ActivityLog.create({
      user_id: req.user?.id,
      action: 'DEPARTMENT_DELETE',
      entity_type: 'Department',
      entity_id: dept.id,
      description: `Deleted department: ${dept.name} (${dept.code})`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
    });

    await dept.destroy();

    res.status(200).json({
      success: true,
      message: 'Department deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting department',
      error: error.message,
    });
  }
};

// Get department members
export const getDepartmentMembers = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.query;

    const dept = await Department.findByPk(id);
    if (!dept) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    const where = { department_id: id };
    if (status) where.status = status;

    const members = await User.findAll({
      where,
      attributes: {
        exclude: ['password'],
      },
      order: [['name', 'ASC']],
    });

    res.status(200).json({
      success: true,
      message: 'Department members retrieved',
      department_name: dept.name,
      data: members,
      count: members.length,
    });
  } catch (error) {
    console.error('Error fetching department members:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving department members',
      error: error.message,
    });
  }
};
