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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Divider,
} from '@mui/material';
import {
  MeetingRoom as MeetingRoomIcon,
  CheckCircle as CheckCircleIcon,
  EventNote as EventNoteIcon,
  Pending as PendingIcon,
  CalendarMonth as CalendarMonthIcon,
  People as PeopleIcon,
  LocationOn as LocationOnIcon,
  LocalOffer as LocalOfferIcon,
  AccessTime as AccessTimeIcon,
  Close as CloseIcon,
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

export default function BookingDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [rooms, setRooms] = useState(DEFAULT_ROOMS);
  const [loading, setLoading] = useState(true);
  const [todayBookings, setTodayBookings] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateString = selectedDate.toISOString().split('T')[0];

  // Quick Booking Dialog State
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState(null);
  const [selectedStartSlot, setSelectedStartSlot] = useState('');
  const [selectedEndSlot, setSelectedEndSlot] = useState('');
  const [bookingTitle, setBookingTitle] = useState('');
  const [bookingParticipants, setBookingParticipants] = useState('2');
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchDashboard();
  }, [dateString]);

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
      return h * 60 + m;
    }
    const parts = str.split(':');
    return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
  };

  const getBookingForSlot = (roomId, slot) => {
    return todayBookings.find((booking) => {
      const bookingRoomId = booking.meeting_room_id || booking.room_id || booking.room?.id;
      if (String(bookingRoomId) !== String(roomId)) return false;
      if (['cancelled', 'rejected'].includes(booking.status)) return false;
      const bStart = parseTimeToMinutes(booking.start_time);
      const bEnd = parseTimeToMinutes(booking.end_time);
      return bStart < slot.endMin && bEnd > slot.startMin;
    });
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

  return (
    <Box sx={{ pb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>Room Schedule & Available Slots</Typography>
        <Typography variant="body2" color="text.secondary">
          Check live time slot availability for each meeting room and book instantly.
        </Typography>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Rooms" value={dashboard?.totalRooms || rooms.length || 0} icon={MeetingRoomIcon} color="#2196f3" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Available Now" value={dashboard?.availableNow || 0} icon={CheckCircleIcon} color="#4caf50" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Today's Bookings" value={todayBookings.filter((b) => !['cancelled', 'rejected'].includes(b.status)).length} icon={EventNoteIcon} color="#ff9800" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Pending Approvals" value={dashboard?.pendingApprovals || 0} icon={PendingIcon} color="#f44336" />
        </Grid>
      </Grid>

      <Paper sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }} elevation={0}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1.5} sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 0.75, md: 2 }} alignItems={{ md: 'center' }}>
            <Box>
              <Typography sx={{ fontWeight: 800 }}>Meeting Rooms & Time Slots</Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedDate.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <TextField
              label="Select date"
              type="date"
              value={dateString}
              onChange={(event) => setSelectedDate(new Date(`${event.target.value}T00:00:00`))}
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
                
                // Calculate slot availability counts
                let availableSlotsCount = 0;
                let bookedSlotsCount = 0;
                TIME_SLOTS.forEach((slot) => {
                  const booking = getBookingForSlot(room.id, slot);
                  if (booking) bookedSlotsCount++;
                  else availableSlotsCount++;
                });

                return (
                  <Grid item xs={12} lg={6} key={room.id}>
                    <Card
                      elevation={0}
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        transition: 'all 0.2s ease',
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
                              <Typography variant="h6" sx={{ fontWeight: 800, fontSize: 17, lineHeight: 1.2 }}>
                                {room.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {room.location || room.building || 'Main Building'} • Floor {room.floor || 1}
                              </Typography>
                            </Box>
                          </Box>
                          <Chip
                            label={unavailable ? 'Maintenance' : `${availableSlotsCount} Free Slots`}
                            size="small"
                            sx={{
                              fontWeight: 700,
                              fontSize: 11,
                              bgcolor: unavailable ? '#FEE2E2' : '#DCFCE7',
                              color: unavailable ? '#B91C1C' : '#166534',
                            }}
                          />
                        </Stack>

                        {/* Room Meta Badges */}
                        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 0.5 }}>
                          <Chip icon={<PeopleIcon sx={{ fontSize: '14px !important' }} />} label={`${room.capacity} Seats`} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: 12 }} />
                          <Chip icon={<LocationOnIcon sx={{ fontSize: '14px !important' }} />} label={room.location || room.room_number || 'Floor ' + room.floor} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: 12 }} />
                          {room.room_type && (
                            <Chip icon={<LocalOfferIcon sx={{ fontSize: '13px !important' }} />} label={room.room_type} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: 12 }} />
                          )}
                        </Stack>

                        {room.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13, mb: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {room.description}
                          </Typography>
                        )}

                        <Divider sx={{ my: 1.5 }} />

                        {/* Time Slots Schedule Section */}
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', color: 'text.secondary', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
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
                              const booking = getBookingForSlot(room.id, slot);
                              const isBooked = !!booking;
                              const isPending = booking?.status === 'pending_manager' || booking?.status === 'pending_hr';

                              return (
                                <Tooltip
                                  key={slot.start}
                                  title={
                                    unavailable
                                      ? 'Room is currently unavailable'
                                      : isBooked
                                      ? `Booked: ${booking.title || 'Meeting'} (${booking.user?.name || booking.user?.email || 'User'})`
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
                                      fontWeight: 600,
                                      cursor: unavailable || isBooked ? 'not-allowed' : 'pointer',
                                      border: '1px solid',
                                      borderColor: isBooked
                                        ? isPending ? '#FDE68A' : '#FECACA'
                                        : '#BBF7D0',
                                      bgcolor: isBooked
                                        ? isPending ? '#FEF3C7' : '#FEE2E2'
                                        : '#F0FDF4',
                                      color: isBooked
                                        ? isPending ? '#B45309' : '#DC2626'
                                        : '#166534',
                                      transition: 'all 0.15s ease',
                                      '&:hover': !unavailable && !isBooked ? {
                                        bgcolor: '#DCFCE7',
                                        borderColor: '#4ADE80',
                                        transform: 'scale(1.04)',
                                        boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                                      } : {},
                                    }}
                                  >
                                    <div>{slot.label}</div>
                                    <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>
                                      {isBooked ? (isPending ? 'Pending' : 'Booked') : 'Available'}
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
    </Box>
  );
}



