import React, { useState } from 'react';
import {
  Box,
  Container,
  Tabs,
  Tab,
  Paper,
  Typography,
  Alert,
} from '@mui/material';
import AdminUsersManagement from './AdminUsersManagement';
import AdminDepartmentsManagement from './AdminDepartmentsManagement';
import AdminRoomsManagement from './AdminRoomsManagement';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function AdminManagementPanel() {
  const [value, setValue] = useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 1 }}>
          ⚙️ Administration Panel
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Manage users, departments, and meeting rooms
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 2 }}>
        You are viewing the administration panel. Use the tabs below to create, edit, and delete users, departments, and meeting rooms.
      </Alert>

      <Paper>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="admin management tabs"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              textTransform: 'capitalize',
              fontSize: '1rem',
              minWidth: 150,
            },
          }}
        >
          <Tab label="👥 Users" id="admin-tab-0" />
          <Tab label="🏢 Departments" id="admin-tab-1" />
          <Tab label="🏛️ Meeting Rooms" id="admin-tab-2" />
        </Tabs>

        <TabPanel value={value} index={0}>
          <AdminUsersManagement />
        </TabPanel>

        <TabPanel value={value} index={1}>
          <AdminDepartmentsManagement />
        </TabPanel>

        <TabPanel value={value} index={2}>
          <AdminRoomsManagement />
        </TabPanel>
      </Paper>

      {/* Sample Data Section */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
          📋 Quick Reference
        </Typography>
        <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
          <Typography variant="body2" component="div">
            <strong>Available Roles:</strong> Super Admin (57 permissions), Admin (39),
            Manager (22), Employee (20), Viewer (7)
          </Typography>
          <Typography variant="body2" component="div" sx={{ mt: 1 }}>
            <strong>Room Types:</strong> Standard, Conference, Board, Training,
            Huddle, Executive
          </Typography>
          <Typography variant="body2" component="div" sx={{ mt: 1 }}>
            <strong>Default Password:</strong> Test@123 (minimum 6 characters required)
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}
