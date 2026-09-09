import React from 'react';
import { Container } from '@mui/material';
import BookingDashboard from '../components/booking/BookingDashboard';
import MyBookings from '../components/booking/MyBookings';
import BookingCalendarTab from '../components/booking/BookingCalendarTab';
import AdminManagementPanel from '../components/admin/AdminManagementPanel';
import RoomUtilizationReports from '../components/reports/RoomUtilizationReports';
import { useAuth } from '../../../context/AuthContext.jsx';

export default function MeetingRoomBooking({ view = 'dashboard' }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin' || user?.role === 'Super Admin';

  return (
    <Container maxWidth="xl" disableGutters>
      {view === 'dashboard' && <BookingDashboard />}
      {view === 'book' && <BookingCalendarTab />}
      {view === 'my-bookings' && <MyBookings />}
      {isAdmin && view === 'reports' && <RoomUtilizationReports />}
      {isAdmin && view === 'admin' && <AdminManagementPanel />}
    </Container>
  );
}

