import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Grid, Card, CardContent, Typography, CircularProgress, Button, Chip, Paper, ToggleButton, ToggleButtonGroup, Stack,
} from '@mui/material';
import {
  MeetingRoom as MeetingRoomIcon, CheckCircle as CheckCircleIcon, EventNote as EventNoteIcon, Pending as PendingIcon,
  Add as AddIcon, ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import * as bookingApi from '../../api/booking.js';
import { useAuth } from '../../../../context/AuthContext.jsx';

export default function BookingDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [todayBookings, setTodayBookings] = useState([]);
  const [showFilter, setShowFilter] = useState('active');
  const orientation = 'vertical';
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateString = selectedDate.toISOString().split('T')[0];

  useEffect(() => { fetchDashboard(); }, [dateString]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const [summaryResponse, bookingsResponse, roomsResponse] = await Promise.all([
        bookingApi.getDashboardSummary(),
        bookingApi.getBookings({ dateFrom: dateString, dateTo: dateString }),
        bookingApi.getRooms({ status: 'active' }),
      ]);
      setDashboard(summaryResponse.data?.data);
      setTodayBookings(bookingsResponse.data?.data || []);
      setRooms((roomsResponse.data?.data || []).filter((room) => room.room_status === 'active'));
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = useMemo(() => {
    if (showFilter === 'active') return todayBookings.filter((b) => !['cancelled', 'completed', 'rejected'].includes(b.status));
    if (showFilter === 'completed') return todayBookings.filter((b) => b.status === 'completed');
    return todayBookings;
  }, [showFilter, todayBookings]);

  const changeDate = (offset) => setSelectedDate((current) => {
    const next = new Date(current);
    next.setDate(next.getDate() + offset);
    return next;
  });

  const getRoomBookings = (roomId) => filteredBookings.filter((b) => String(b.meeting_room_id || b.room_id || b.room?.id) === String(roomId));

  const toMinutes = (value) => {
    const [hours, minutes] = String(value || '00:00').split(':').map(Number);
    return hours * 60 + minutes;
  };

  const getBookingStyle = (booking) => {
    const start = Math.max(toMinutes(booking.start_time), 9 * 60);
    const end = Math.min(toMinutes(booking.end_time), 18 * 60);
    return {
      left: `${((start - 9 * 60) / 30) * 100 / 18}%`,
      width: `${Math.max(((end - start) / 30) * 100 / 18, 3.5)}%`,
    };
  };

  const statusStyles = {
    confirmed: { label: 'Confirmed', color: '#087F5B', background: '#D3F9D8' },
    pending_department_head: { label: 'Pending', color: '#9A6700', background: '#FFF3BF' },
    pending_hr: { label: 'Pending', color: '#C2410C', background: '#FFEDD5' },
    pending_manager: { label: 'Pending', color: '#C2410C', background: '#FFEDD5' },
    rejected: { label: 'Rejected', color: '#B91C1C', background: '#FEE2E2' },
    cancelled: { label: 'Cancelled', color: '#6B7280', background: '#F3F4F6' },
  };

  // Filter bookings based on showFilter
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <Card
      sx={{
        borderRadius: 1.5,
        background: `linear-gradient(135deg, ${color}10 0%, transparent 100%)`,
        border: `1px solid ${color}30`,
        transition: 'all 0.2s ease',
        boxShadow: 'none',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 4px 12px ${color}20` },
      }}
    >
      <CardContent sx={{ display: 'flex', alignItems: 'center', py: '16px !important', px: 2 }}>
        <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: `${color}15`, display: 'flex', mr: 2 }}>
          <Icon sx={{ fontSize: 24, color }} />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color, lineHeight: 1, mb: 0.25 }}>
            {value}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {title}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  const getStatusColor = (status) => {
    const statusColors = {
      confirmed: '#4caf50',
      pending_department_head: '#ff9800',
      pending_hr: '#2196f3',
      rejected: '#f44336',
      cancelled: '#9e9e9e',
    };
    return statusColors[status] || '#2196f3';
  };

  const getStatusLabel = (status) => {
    const labels = {
      confirmed: 'Confirmed',
      pending_department_head: 'Pending Dept Head',
      pending_hr: 'Pending HR',
      rejected: 'Rejected',
      cancelled: 'Cancelled',
    };
    return labels[status] || status;
  };

  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} spacing={2} sx={{ mb: 3 }}>
        <Box><Typography variant="h5" sx={{ fontWeight: 800 }}>Room schedule</Typography><Typography color="text.secondary" sx={{ mt: 0.5 }}>See every meeting room at a glance and find an open slot fast.</Typography></Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/booking/new')} sx={{ alignSelf: { xs: 'stretch', md: 'auto' } }}>Book a room</Button>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Rooms"
            value={dashboard?.totalRooms || 0}
            icon={MeetingRoomIcon}
            color="#2196f3"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Available Now"
            value={dashboard?.availableNow || 0}
            icon={CheckCircleIcon}
            color="#4caf50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Today's Bookings"
            value={todayBookings.filter((b) => !['cancelled', 'rejected'].includes(b.status)).length}
            icon={EventNoteIcon}
            color="#ff9800"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Approvals"
            value={dashboard?.pendingApprovals || 0}
            icon={PendingIcon}
            color="#f44336"
          />
        </Grid>
      </Grid>

      <Paper sx={{ borderRadius: 1.5, overflow: 'hidden' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1.5} sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 0.75, md: 2 }} alignItems={{ md: 'center' }}>
            <Box><Typography sx={{ fontWeight: 800 }}>Daily room board</Typography><Typography variant="body2" color="text.secondary">{selectedDate.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</Typography></Box>
            <Stack direction="row" spacing={0.75} flexWrap="wrap">
              {[['confirmed', statusStyles.confirmed], ['pending', statusStyles.pending_department_head], ['rejected', statusStyles.rejected], ['cancelled', statusStyles.cancelled]].map(([key, style]) => <Chip key={key} label={style.label} size="small" sx={{ bgcolor: style.background, color: style.color, fontWeight: 700 }} />)}
            </Stack>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap"><Button size="small" variant="outlined" onClick={() => setSelectedDate(new Date())}>Today</Button><Button size="small" onClick={() => changeDate(-1)} sx={{ minWidth: 36, px: 0 }}><ChevronLeftIcon /></Button><Button size="small" onClick={() => changeDate(1)} sx={{ minWidth: 36, px: 0 }}><ChevronRightIcon /></Button><ToggleButtonGroup value={showFilter} exclusive onChange={(event, value) => value && setShowFilter(value)} size="small"><ToggleButton value="active">Active</ToggleButton><ToggleButton value="all">All</ToggleButton></ToggleButtonGroup></Stack>
        </Stack>
        {orientation === 'horizontal' ? <Box sx={{ overflowX: 'auto' }}><Box sx={{ minWidth: 1060 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '220px 1fr', bgcolor: '#F8FAFC', borderBottom: '1px solid', borderColor: 'divider' }}><Box sx={{ p: 1.5, borderRight: '1px solid', borderColor: 'divider' }}><Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>MEETING ROOM</Typography></Box><Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(18, 1fr)' }}>{Array.from({ length: 18 }, (_, index) => <Box key={index} sx={{ p: 1.5, borderRight: '1px solid', borderColor: 'divider', textAlign: 'center' }}><Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', whiteSpace: 'nowrap' }}>{new Date(0, 0, 1, 9 + Math.floor(index / 2), index % 2 ? 30 : 0).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</Typography></Box>)}</Box></Box>
          {rooms.length === 0 ? <Box sx={{ p: 5, textAlign: 'center' }}><MeetingRoomIcon sx={{ color: 'text.disabled', fontSize: 42 }} /><Typography sx={{ mt: 1, fontWeight: 700 }}>No active rooms found</Typography></Box> : rooms.map((room) => <Box key={room.id} sx={{ display: 'grid', gridTemplateColumns: '220px 1fr', minHeight: 82, borderBottom: '1px solid', borderColor: 'divider' }}><Box sx={{ p: 1.5, borderRight: '1px solid', borderColor: 'divider', bgcolor: '#FCFDFE' }}><Typography sx={{ fontWeight: 800, fontSize: 14 }}>{room.name}</Typography><Typography variant="caption" color="text.secondary">Room {room.room_number} · {room.capacity} seats</Typography><Typography variant="caption" display="block" color="text.secondary">{room.location}</Typography></Box><Box sx={{ position: 'relative', backgroundImage: 'linear-gradient(to right, rgba(148,163,184,.18) 1px, transparent 1px)', backgroundSize: `${100 / 18}% 100%` }}>{getRoomBookings(room.id).map((booking) => { const style = statusStyles[booking.status] || statusStyles.confirmed; return <Box key={booking.id} sx={{ position: 'absolute', top: 10, bottom: 10, ...getBookingStyle(booking), px: 1.25, py: 0.75, overflow: 'hidden', borderRadius: 1.25, bgcolor: style.background, borderLeft: `4px solid ${style.color}`, color: style.color, boxShadow: '0 1px 3px rgba(15,23,42,.08)' }}><Typography noWrap sx={{ fontSize: 12, fontWeight: 800 }}>{booking.title}</Typography><Typography noWrap sx={{ fontSize: 11 }}>{booking.start_time?.slice(0, 5)} - {booking.end_time?.slice(0, 5)} · {style.label}</Typography></Box>; })}</Box></Box>)}
        </Box></Box> : <Box sx={{ overflow: 'auto' }}><Box sx={{ minWidth: Math.max(760, 90 + rooms.length * 190) }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: `90px repeat(${Math.max(rooms.length, 1)}, minmax(190px, 1fr))`, bgcolor: '#F8FAFC', borderBottom: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ p: 1.5, borderRight: '1px solid', borderColor: 'divider' }}><Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>TIME</Typography><Typography variant="caption" display="block" color="text.secondary">ROOM</Typography></Box>
            {rooms.map((room) => <Box key={room.id} sx={{ p: 1.5, borderRight: '1px solid', borderColor: 'divider' }}><Typography noWrap sx={{ fontWeight: 800, fontSize: 13 }}>{room.name}</Typography><Typography variant="caption" color="text.secondary">Room {room.room_number} · {room.capacity} seats</Typography></Box>)}
          </Box>
          {Array.from({ length: 18 }, (_, index) => <Box key={index} sx={{ display: 'grid', gridTemplateColumns: `90px repeat(${Math.max(rooms.length, 1)}, minmax(190px, 1fr))`, minHeight: 58, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ p: 1.5, borderRight: '1px solid', borderColor: 'divider', bgcolor: '#FCFDFE' }}><Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', whiteSpace: 'nowrap' }}>{new Date(0, 0, 1, 9 + Math.floor(index / 2), index % 2 ? 30 : 0).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</Typography></Box>
            {rooms.map((room) => <Box key={room.id} sx={{ position: 'relative', borderRight: '1px solid', borderColor: 'divider', backgroundColor: index % 2 ? '#FFFFFF' : '#FCFDFE' }}>{getRoomBookings(room.id).filter((booking) => Math.max(0, Math.floor((toMinutes(booking.start_time) - 9 * 60) / 30)) === index).map((booking) => { const style = statusStyles[booking.status] || statusStyles.confirmed; const span = Math.max(1, Math.ceil((toMinutes(booking.end_time) - toMinutes(booking.start_time)) / 30)); return <Box key={booking.id} sx={{ position: 'absolute', zIndex: 2, top: 4, left: 4, right: 4, height: `${span * 58 - 8}px`, px: 1, py: 0.75, overflow: 'hidden', borderRadius: 1.25, bgcolor: style.background, borderLeft: `4px solid ${style.color}`, color: style.color, boxShadow: '0 1px 3px rgba(15,23,42,.08)' }}><Typography noWrap sx={{ fontSize: 11, fontWeight: 800 }}>{room.name}</Typography><Typography noWrap sx={{ fontSize: 12, fontWeight: 800 }}>{booking.title}</Typography><Typography noWrap sx={{ fontSize: 11 }}>{booking.start_time?.slice(0, 5)} - {booking.end_time?.slice(0, 5)} · {style.label}</Typography></Box>; })}</Box>)}
          </Box>)}
        </Box></Box>}
        <Box sx={{ p: 1, bgcolor: '#FCFDFE', borderTop: '1px solid', borderColor: 'divider' }}><Typography variant="caption" color="text.secondary">Room names remain visible while you scan the timeline.</Typography></Box>
      </Paper>
    </Box>
  );
}

