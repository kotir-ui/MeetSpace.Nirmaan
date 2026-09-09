import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Chip,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  MeetingRoom as MeetingRoomIcon,
  CheckCircle as CheckCircleIcon,
  EventNote as EventNoteIcon,
  Pending as PendingIcon,
  CalendarMonth as CalendarMonthIcon,
  People as PeopleIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import * as bookingApi from '../../api/booking.js';
import { useAuth } from '../../../../context/AuthContext.jsx';

const TIME_SLOTS = [
  { start: '09:00', end: '09:30', label: '9:00 AM', startMin: 540, endMin: 570 },
  { start: '09:30', end: '10:00', label: '9:30 AM', startMin: 570, endMin: 600 },
  { start: '10:00', end: '10:30', label: '10:00 AM', startMin: 600, endMin: 630 },
  { start: '10:30', end: '11:00', label: '10:30 AM', startMin: 630, endMin: 660 },
  { start: '11:00', end: '11:30', label: '11:00 AM', startMin: 660, endMin: 690 },
  { start: '11:30', end: '12:00', label: '11:30 AM', startMin: 690, endMin: 720 },
  { start: '12:00', end: '12:30', label: '12:00 PM', startMin: 720, endMin: 750 },
  { start: '12:30', end: '13:00', label: '12:30 PM', startMin: 750, endMin: 780 },
  { start: '13:00', end: '13:30', label: '1:00 PM', startMin: 780, endMin: 810 },
  { start: '13:30', end: '14:00', label: '1:30 PM', startMin: 810, endMin: 840 },
  { start: '14:00', end: '14:30', label: '2:00 PM', startMin: 840, endMin: 870 },
  { start: '14:30', end: '15:00', label: '2:30 PM', startMin: 870, endMin: 900 },
  { start: '15:00', end: '15:30', label: '3:00 PM', startMin: 900, endMin: 930 },
  { start: '15:30', end: '16:00', label: '3:30 PM', startMin: 930, endMin: 960 },
  { start: '16:00', end: '16:30', label: '4:00 PM', startMin: 960, endMin: 990 },
  { start: '16:30', end: '17:00', label: '4:30 PM', startMin: 990, endMin: 1020 },
  { start: '17:00', end: '17:30', label: '5:00 PM', startMin: 1020, endMin: 1050 },
  { start: '17:30', end: '18:00', label: '5:30 PM', startMin: 1050, endMin: 1080 },
];

const DEFAULT_ROOMS = [
  { id: 1, name: 'Sarvepalli Radhakrishnan Hall', room_number: 'CR-101', building: 'Main Block', floor: 1, location: '1st Floor - East Wing', capacity: 18, status: 'available' },
  { id: 2, name: 'APJ Abdul Kalam Board Room', room_number: 'BR-201', building: 'Main Block', floor: 2, location: '2nd Floor - Executive Suite', capacity: 24, status: 'available' },
  { id: 3, name: 'Swami Vivekananda Meeting Room', room_number: 'MR-102', building: 'Main Block', floor: 1, location: '1st Floor - West Wing', capacity: 10, status: 'available' },
  { id: 4, name: 'Aryabhata Discussion Suite', room_number: 'DR-301', building: 'Innovation Block', floor: 3, location: '3rd Floor - Tech Wing', capacity: 8, status: 'available' },
  { id: 5, name: 'Sir CV Raman Innovation Lab', room_number: 'TR-302', building: 'Innovation Block', floor: 3, location: '3rd Floor - South Wing', capacity: 30, status: 'available' },
  { id: 6, name: 'Chanakya Strategy Room', room_number: 'MR-202', building: 'Main Block', floor: 2, location: '2nd Floor - North Wing', capacity: 12, status: 'available' },
];

const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function BookingDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [rooms, setRooms] = useState(DEFAULT_ROOMS);
  const [loading, setLoading] = useState(true);
  const [todayBookings, setTodayBookings] = useState([]);
  const [dateString, setDateString] = useState(() => getTodayDateString());

  // 5-Minute Warning & Extension Alert State
  const [activeEndingMeeting, setActiveEndingMeeting] = useState(null);
  const [extensionModalOpen, setExtensionModalOpen] = useState(false);
  const [extending, setExtending] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    fetchDashboard();
  }, [dateString]);

  // Periodic check (every 10s) for meetings ending in <= 5 minutes
  useEffect(() => {
    const checkEndingMeetings = () => {
      const isToday = dateString === getTodayDateString();
      if (!isToday) return;

      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const myBooking = (todayBookings || []).find((b) => {
        if (['cancelled', 'rejected', 'completed'].includes(b.status)) return false;
        const isMyBooking = (b.organizer_id && user && b.organizer_id === user.id) ||
                            (b.organizer?.id && user && b.organizer.id === user.id) ||
                            (b.organizer?.email && user && b.organizer.email === user.email);
        if (!isMyBooking) return false;

        const bStart = parseTimeToMinutes(b.start_time);
        const bEnd = parseTimeToMinutes(b.end_time);
        const minutesLeft = bEnd - currentMinutes;

        return currentMinutes >= bStart && minutesLeft > 0 && minutesLeft <= 5;
      });

      if (myBooking && (!activeEndingMeeting || activeEndingMeeting.id !== myBooking.id)) {
        setActiveEndingMeeting(myBooking);
        setExtensionModalOpen(true);
      }
    };

    checkEndingMeetings();
    const interval = setInterval(checkEndingMeetings, 10000);
    return () => clearInterval(interval);
  }, [todayBookings, user, dateString]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const [summaryResponse, bookingsResponse, roomsResponse] = await Promise.all([
        bookingApi.getDashboardSummary().catch((err) => { console.error('Dashboard summary error:', err); return { data: {} }; }),
        bookingApi.getBookings({ dateFrom: dateString, dateTo: dateString }).catch((err) => { console.error('Bookings error:', err); return { data: {} }; }),
        bookingApi.getRooms().catch((err) => { console.error('Rooms error:', err); return { data: {} }; }),
      ]);
      setDashboard(summaryResponse.data?.data || null);
      setTodayBookings(bookingsResponse.data?.data || []);

      const rawRooms = roomsResponse.data?.data || (Array.isArray(roomsResponse.data) ? roomsResponse.data : []);
      if (rawRooms && rawRooms.length > 0) {
        setRooms(rawRooms);
      } else {
        setRooms(DEFAULT_ROOMS);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      setRooms(DEFAULT_ROOMS);
    } finally {
      setLoading(false);
    }
  };

  const parseTimeToMinutes = (val) => {
    if (!val) return 0;
    const str = String(val).trim();
    const match = str.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?/i);
    if (match) {
      let h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const ampm = match[3]?.toUpperCase();
      if (ampm === 'PM' && h < 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;
      // If hour is 1 to 6 without explicit AM/PM in working schedule (9 AM - 6 PM), treat as PM
      if (!ampm && h >= 1 && h <= 6) h += 12;
      return h * 60 + m;
    }
    const parts = str.split(':');
    let h = parseInt(parts[0], 10) || 0;
    if (h >= 1 && h <= 6) h += 12;
    return h * 60 + (parseInt(parts[1], 10) || 0);
  };

  const getBookingForSlot = (roomId, slot, roomName = null) => {
    const isToday = dateString === getTodayDateString();
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    return todayBookings.find((booking) => {
      const bookingRoomId = booking.meeting_room_id || booking.room_id || booking.room?.id;
      const matchesRoom = (bookingRoomId && String(bookingRoomId) === String(roomId)) ||
                          (booking.room?.name && roomName && booking.room.name.toLowerCase().trim() === roomName.toLowerCase().trim()) ||
                          (booking.room_name && roomName && booking.room_name.toLowerCase().trim() === roomName.toLowerCase().trim());

      if (!matchesRoom) return false;
      if (['cancelled', 'rejected'].includes(booking.status)) return false;

      const bStart = parseTimeToMinutes(booking.start_time);
      const bEnd = parseTimeToMinutes(booking.end_time);

      // Auto-available: if today and meeting ended, freed up
      if (isToday && currentMinutes >= bEnd) {
        return false;
      }

      return bStart < slot.endMin && bEnd > slot.startMin;
    });
  };

  const handleExtendBooking = async (minutes) => {
    if (!activeEndingMeeting) return;
    try {
      setExtending(true);
      const res = await bookingApi.extendBooking(activeEndingMeeting.id, { extensionMinutes: minutes });
      setSnackbar({ open: true, message: res.data?.message || `Meeting extended by ${minutes} minutes!`, severity: 'success' });
      setExtensionModalOpen(false);
      setActiveEndingMeeting(null);
      fetchDashboard();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Cannot extend room: next time slot is already reserved.',
        severity: 'error',
      });
    } finally {
      setExtending(false);
    }
  };

  const handleRedirectToBooking = (room, slot = null) => {
    const start = slot ? slot.start : '09:00';
    const end = slot ? slot.end : '09:30';
    navigate(`/meeting-room/book?date=${dateString}&roomId=${room.id}&startTime=${start}&endTime=${end}`);
  };

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

  // Calculate aggregate slot metrics across all rooms for the selected date
  const totalSlotsCount = (rooms || []).length * TIME_SLOTS.length;
  let totalBookedSlotsCount = 0;
  let totalPendingSlotsCount = 0;

  (todayBookings || []).forEach((b) => {
    if (['pending_manager', 'pending_admin', 'pending_department_head', 'pending_hr', 'pending'].includes(b.approval_status || b.status)) {
      totalPendingSlotsCount++;
    }
  });
  if (totalPendingSlotsCount === 0 && dashboard?.pendingApprovals) {
    totalPendingSlotsCount = dashboard.pendingApprovals;
  }

  (rooms || []).forEach((r) => {
    TIME_SLOTS.forEach((slot) => {
      if (getBookingForSlot(r.id, slot)) {
        totalBookedSlotsCount++;
      }
    });
  });
  const totalAvailableSlotsCount = Math.max(0, totalSlotsCount - totalBookedSlotsCount);

  return (
    <Box sx={{ pb: 4 }}>
      {/* 5-Minute Time Up Alert Banner */}
      {activeEndingMeeting && (
        <Alert
          severity="warning"
          variant="filled"
          icon={<AccessTimeIcon sx={{ fontSize: 24 }} />}
          action={
            <Button
              color="inherit"
              size="small"
              variant="outlined"
              onClick={() => setExtensionModalOpen(true)}
              sx={{ fontWeight: 700, bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
            >
              Extend Time
            </Button>
          }
          sx={{ mb: 3, borderRadius: 2, alignItems: 'center' }}
        >
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            ⏰ Meeting Ending in 5 Minutes!
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', opacity: 0.95 }}>
            Your meeting &quot;{activeEndingMeeting.title || 'Session'}&quot; in {activeEndingMeeting.room?.name || 'Room'} ends at {activeEndingMeeting.end_time?.slice(0, 5)}. Click Extend Time if you need more time.
          </Typography>
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>Room Schedule & Available Slots</Typography>
        <Typography variant="body2" color="text.secondary">
          Check live time slot availability for each meeting room and book instantly.
        </Typography>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard title="Total Rooms" value={dashboard?.totalRooms || rooms.length || 0} icon={MeetingRoomIcon} color="#2196f3" />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard title="Available Now" value={dashboard?.availableNow || rooms.length || 0} icon={CheckCircleIcon} color="#4caf50" />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard title="Total Slots" value={totalSlotsCount} icon={AccessTimeIcon} color="#6366f1" />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard title="Booked Slots" value={totalBookedSlotsCount} icon={EventNoteIcon} color="#ff9800" />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard title="Free Slots" value={totalAvailableSlotsCount} icon={CheckCircleIcon} color="#059669" />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard title="Pending Slots" value={totalPendingSlotsCount} icon={PendingIcon} color="#f44336" />
        </Grid>
      </Grid>

      <Paper sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }} elevation={0}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1.5} sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 0.75, md: 2 }} alignItems={{ md: 'center' }}>
            <Box>
              <Typography sx={{ fontWeight: 800 }}>Meeting Rooms & Time Slots</Typography>
              <Typography variant="body2" color="text.secondary">
                {(() => {
                  try {
                    const [y, m, d] = dateString.split('-').map(Number);
                    const dateObj = new Date(y, m - 1, d);
                    return dateObj.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
                  } catch {
                    return dateString;
                  }
                })()}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <TextField
              label="Select date"
              type="date"
              value={dateString}
              onChange={(event) => {
                if (event.target.value) {
                  setDateString(event.target.value);
                }
              }}
              size="small"
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 170 }}
            />
          </Stack>
        </Stack>

        <Box sx={{ p: 2.5 }}>
          {rooms.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">No meeting rooms available.</Typography>
            </Box>
          ) : (
            <Grid container spacing={2.5}>
              {rooms.map((room) => {
                const unavailable = room.status === 'inactive' || room.status === 'under_maintenance' || room.room_status === 'disabled' || room.room_status === 'maintenance';
                
                // Calculate slot availability counts per room
                let availableSlotsCount = 0;
                let bookedSlotsCount = 0;
                TIME_SLOTS.forEach((slot) => {
                  const booking = getBookingForSlot(room.id, slot, room.name);
                  if (booking) bookedSlotsCount++;
                  else availableSlotsCount++;
                });

                return (
                  <Grid item xs={12} lg={6} key={room.id}>
                    <Card
                      elevation={0}
                      sx={{
                        border: '1px solid',
                        borderColor: unavailable ? 'error.light' : 'divider',
                        borderRadius: 2,
                        bgcolor: unavailable ? 'action.hover' : 'background.paper',
                        transition: 'all 0.2s',
                        '&:hover': {
                          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                          borderColor: 'primary.main',
                        },
                      }}
                    >
                      <CardContent sx={{ p: 2.5 }}>
                        {/* Header */}
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: unavailable ? 'action.hover' : 'primary.50', color: unavailable ? 'text.secondary' : 'primary.main', display: 'flex' }}>
                              <MeetingRoomIcon sx={{ fontSize: 26 }} />
                            </Box>
                            <Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                <Typography variant="h6" sx={{ fontWeight: 800, fontSize: 17, lineHeight: 1.2 }}>
                                  {room.name}
                                </Typography>
                                <Chip
                                  icon={<PeopleIcon sx={{ fontSize: '13px !important' }} />}
                                  label={`${room.capacity} Seats`}
                                  size="small"
                                  variant="outlined"
                                  sx={{ height: 22, fontSize: '0.72rem', fontWeight: 600 }}
                                />
                                {room.location && (
                                  <Chip
                                    label={room.location}
                                    size="small"
                                    variant="outlined"
                                    sx={{ height: 22, fontSize: '0.72rem', color: 'text.secondary' }}
                                  />
                                )}
                              </Box>
                              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.3 }}>
                                {room.room_type ? room.room_type.replace('_', ' ').toUpperCase() : 'MEETING ROOM'}
                              </Typography>
                            </Box>
                          </Box>

                          {/* Room Status Badge */}
                          <Chip
                            label={unavailable ? 'Unavailable' : bookedSlotsCount === TIME_SLOTS.length ? 'Fully Booked' : 'Available'}
                            size="small"
                            color={unavailable ? 'default' : bookedSlotsCount === TIME_SLOTS.length ? 'error' : 'success'}
                            sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                          />
                        </Stack>

                        {/* Room Wise Slot Breakdown: Total vs Booked vs Free */}
                        <Box
                          sx={{
                            p: 1.2,
                            mb: 2,
                            borderRadius: 1.5,
                            bgcolor: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: 1,
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Chip
                              label={`Total: ${TIME_SLOTS.length} Slots`}
                              size="small"
                              sx={{ bgcolor: '#E0E7FF', color: '#3730A3', fontWeight: 700, fontSize: '0.73rem', height: 24 }}
                            />
                            <Chip
                              label={`Booked: ${bookedSlotsCount}`}
                              size="small"
                              sx={{ bgcolor: '#DBEAFE', color: '#1E40AF', fontWeight: 700, fontSize: '0.73rem', height: 24 }}
                            />
                            <Chip
                              label={`Free: ${availableSlotsCount}`}
                              size="small"
                              sx={{ bgcolor: '#DCFCE7', color: '#166534', fontWeight: 700, fontSize: '0.73rem', height: 24 }}
                            />
                          </Box>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                            {bookedSlotsCount}/{TIME_SLOTS.length} Slots Booked
                          </Typography>
                        </Box>

                        {/* Available Slots Grid */}
                        <Box sx={{ mb: 1 }}>
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 700,
                              color: 'text.secondary',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                              mb: 1,
                            }}
                          >
                            <AccessTimeIcon sx={{ fontSize: 14 }} /> Available Time Slots (Click to Book):
                          </Typography>

                          <Box
                            sx={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fill, minmax(85px, 1fr))',
                              gap: 0.75,
                              maxHeight: 180,
                              overflowY: 'auto',
                              pr: 0.5,
                            }}
                          >
                            {TIME_SLOTS.map((slot) => {
                              const booking = getBookingForSlot(room.id, slot, room.name);
                              const isBooked = !!booking;
                              const isPending = booking?.status === 'pending_department_head' || booking?.status === 'pending_hr' || booking?.status === 'pending_manager' || booking?.status === 'pending';
                              const isExtended = booking?.status === 'extended' || booking?.is_extended;

                              return (
                                <Tooltip
                                  key={slot.start}
                                  title={
                                    unavailable
                                      ? 'Room is currently unavailable'
                                      : isBooked
                                      ? `${isPending ? 'Pending Approval' : isExtended ? 'Extended (In Use)' : 'Booked'}: ${booking.title || 'Meeting'} (${booking.user?.name || booking.user?.email || booking.organizer?.name || 'User'})`
                                      : `Click to book ${slot.label} - ${slot.end}`
                                  }
                                >
                                  <Box
                                    onClick={() => {
                                      if (!unavailable && !isBooked) {
                                        handleRedirectToBooking(room, slot);
                                      }
                                    }}
                                    sx={{
                                      py: 0.6,
                                      px: 0.8,
                                      borderRadius: 1,
                                      textAlign: 'center',
                                      fontSize: '0.75rem',
                                      fontWeight: 700,
                                      cursor: unavailable || isBooked ? 'not-allowed' : 'pointer',
                                      border: '1.5px solid',
                                      borderColor: isBooked
                                        ? isPending ? '#3B82F6' : '#2563EB'
                                        : '#86EFAC',
                                      bgcolor: isBooked
                                        ? isPending ? '#EFF6FF' : '#DBEAFE'
                                        : '#F0FDF4',
                                      color: isBooked
                                        ? isPending ? '#1D4ED8' : '#1E40AF'
                                        : '#166534',
                                      transition: 'all 0.15s ease',
                                      '&:hover': !unavailable && !isBooked ? {
                                        bgcolor: '#DCFCE7',
                                        borderColor: '#22C55E',
                                        transform: 'scale(1.04)',
                                        boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                                      } : {},
                                    }}
                                  >
                                    <div>{slot.label}</div>
                                    <div style={{ fontSize: '0.65rem', fontWeight: 800 }}>
                                      {isBooked ? (isPending ? 'Pending' : isExtended ? 'Extended' : 'Booked') : 'Available'}
                                    </div>
                                  </Box>
                                </Tooltip>
                              );
                            })}
                          </Box>
                        </Box>
                      </CardContent>

                      {/* Footer Actions */}
                      <Box sx={{ p: 2, pt: 0, display: 'flex', gap: 1 }}>
                        <Button
                          fullWidth
                          variant="contained"
                          disabled={unavailable}
                          startIcon={!unavailable ? <CalendarMonthIcon /> : undefined}
                          onClick={() => handleRedirectToBooking(room)}
                          sx={{
                            borderRadius: 1.5,
                            fontWeight: 700,
                            textTransform: 'none',
                            py: 1,
                          }}
                        >
                          {unavailable ? 'Currently Unavailable' : 'Book This Room'}
                        </Button>
                      </Box>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Box>
      </Paper>

      {/* Extend Meeting Time Dialog */}
      <Dialog
        open={extensionModalOpen}
        onClose={() => setExtensionModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2.5, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccessTimeIcon color="warning" />
          Extend Meeting Time
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 1.5, color: 'text.secondary' }}>
            Your meeting in <strong>{activeEndingMeeting?.room?.name || 'Meeting Room'}</strong> is scheduled to end at <strong>{activeEndingMeeting?.end_time?.slice(0, 5)}</strong>.
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, fontWeight: 600 }}>
            Choose an extension duration to keep using this room:
          </Typography>

          <Stack spacing={1.5}>
            <Button
              variant="outlined"
              color="primary"
              disabled={extending}
              onClick={() => handleExtendBooking(15)}
              sx={{ justifyContent: 'space-between', py: 1, textTransform: 'none', fontWeight: 700 }}
            >
              <span>Extend +15 Minutes</span>
              <Chip label="+15 min" size="small" color="primary" />
            </Button>
            <Button
              variant="outlined"
              color="primary"
              disabled={extending}
              onClick={() => handleExtendBooking(30)}
              sx={{ justifyContent: 'space-between', py: 1, textTransform: 'none', fontWeight: 700 }}
            >
              <span>Extend +30 Minutes</span>
              <Chip label="+30 min" size="small" color="primary" />
            </Button>
            <Button
              variant="outlined"
              color="primary"
              disabled={extending}
              onClick={() => handleExtendBooking(60)}
              sx={{ justifyContent: 'space-between', py: 1, textTransform: 'none', fontWeight: 700 }}
            >
              <span>Extend +60 Minutes (1 Hour)</span>
              <Chip label="+60 min" size="small" color="primary" />
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1.5 }}>
          <Button onClick={() => setExtensionModalOpen(false)} disabled={extending} sx={{ textTransform: 'none' }}>
            Dismiss / End on Time
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Alerts */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%', borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
