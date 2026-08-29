import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Tab,
  Tabs,
  Paper,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  Dialog,
  Badge,
} from '@mui/material';
import {
  EventNote as EventNoteIcon,
  MeetingRoom as MeetingRoomIcon,
  Schedule as ScheduleIcon,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
import BookingDashboard from '../components/booking/BookingDashboard';
import MyBookings from '../components/booking/MyBookings';
import BookingCalendarTab from '../components/booking/BookingCalendarTab';
import AdminPanel from '../components/booking/AdminPanel';
import { useAuth } from '../../../context/AuthContext.jsx';

export default function MeetingRoomBooking() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const isAdmin = user?.role === 'Admin' || user?.role === 'Super Admin' || user?.role === 'Department Manager';

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ pt: 0, pb: 1.5, mt: -0.75 }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ mb: 1.5 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, fontSize: { xs: '1.65rem', md: '2rem' } }}>
            Meeting Room Booking
          </Typography>
        </Box>

        {/* Tabs */}
        <Paper sx={{ mb: 1.5, borderRadius: 2 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontSize: '0.9rem',
                fontWeight: 500,
                minHeight: 48,
                py: 0.75,
                px: { xs: 1.25, sm: 2 },
                gap: 0.5,
                '& .MuiSvgIcon-root': { fontSize: 21 },
              },
              '& .MuiTabs-indicator': {
                height: 4,
                borderRadius: 2,
              },
            }}
          >
            <Tab
              icon={<ScheduleIcon />}
              iconPosition="start"
              label="Dashboard"
            />
            <Tab
              icon={<MeetingRoomIcon />}
              iconPosition="start"
              label="Book Room"
            />
            <Tab
              icon={<EventNoteIcon />}
              iconPosition="start"
              label="My Bookings"
            />
            {isAdmin && (
              <Tab
                icon={<AdminIcon />}
                iconPosition="start"
                label="Admin Control"
              />
            )}
          </Tabs>
        </Paper>

        {/* Tab Content */}
        <Box>
          {activeTab === 0 && <BookingDashboard />}
          {activeTab === 1 && <BookingCalendarTab />}
          {activeTab === 2 && <MyBookings />}
          {isAdmin && activeTab === 3 && <AdminPanel />}
        </Box>
      </Container>
    </Box>
  );
}
