import React from 'react';
import { Container } from '@mui/material';
import BookingDashboard from '../components/booking/BookingDashboard';
import MyBookings from '../components/booking/MyBookings';
import BookingCalendarTab from '../components/booking/BookingCalendarTab';
import AdminPanel from '../components/booking/AdminPanel';
import { useAuth } from '../../../context/AuthContext.jsx';

export default function MeetingRoomBooking({ view = 'dashboard' }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin' || user?.role === 'Super Admin' || user?.role === 'Department Manager';

  return (
    <Container maxWidth="xl" disableGutters>
      {view === 'dashboard' && <BookingDashboard />}
      {view === 'book' && <BookingCalendarTab />}
      {view === 'my-bookings' && <MyBookings />}
      {isAdmin && view === 'admin' && <AdminPanel />}
    </Container>
  );
}
