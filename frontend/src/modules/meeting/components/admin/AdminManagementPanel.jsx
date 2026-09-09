import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Tabs,
  Tab,
  Paper,
  Typography,
} from '@mui/material';
import {
  AssignmentTurnedIn as ApprovalsIcon,
  People as PeopleIcon,
  CorporateFare as CorporateFareIcon,
  MeetingRoom as MeetingRoomIcon,
} from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import AdminApprovalsManagement from './AdminApprovalsManagement';
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
      {value === index && <Box sx={{ pt: 2.5 }}>{children}</Box>}
    </div>
  );
}

export default function AdminManagementPanel({ defaultTab = 0 }) {
  const location = useLocation();
  const [value, setValue] = useState(defaultTab);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'approvals' || tabParam === 'requests') setValue(0);
    else if (tabParam === 'users') setValue(1);
    else if (tabParam === 'departments') setValue(2);
    else if (tabParam === 'rooms') setValue(3);
  }, [location.search]);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3, px: { xs: 1.5, sm: 3 } }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
          Admin Control Center
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage booking approvals, users & roles, department structure, and meeting rooms.
        </Typography>
      </Box>

      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 1, bgcolor: 'background.paper' }}>
          <Tabs
            value={value}
            onChange={handleChange}
            aria-label="admin management tabs"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontSize: '0.95rem',
                fontWeight: 600,
                minHeight: 48,
                px: 2.5,
              },
            }}
          >
            <Tab icon={<ApprovalsIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Booking Approvals" id="admin-tab-0" />
            <Tab icon={<PeopleIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Users & Roles" id="admin-tab-1" />
            <Tab icon={<CorporateFareIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Departments" id="admin-tab-2" />
            <Tab icon={<MeetingRoomIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Meeting Rooms" id="admin-tab-3" />
          </Tabs>
        </Box>

        <Box sx={{ p: { xs: 1.5, sm: 2.5 } }}>
          <TabPanel value={value} index={0}>
            <AdminApprovalsManagement />
          </TabPanel>

          <TabPanel value={value} index={1}>
            <AdminUsersManagement />
          </TabPanel>

          <TabPanel value={value} index={2}>
            <AdminDepartmentsManagement />
          </TabPanel>

          <TabPanel value={value} index={3}>
            <AdminRoomsManagement />
          </TabPanel>
        </Box>
      </Paper>
    </Container>
  );
}

