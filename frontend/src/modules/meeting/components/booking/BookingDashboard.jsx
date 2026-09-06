import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid, Card, CardContent, Typography, CircularProgress, Chip, Paper, Stack, TextField, Tooltip, Button,
} from '@mui/material';
import {
  MeetingRoom as MeetingRoomIcon, CheckCircle as CheckCircleIcon, EventNote as EventNoteIcon, Pending as PendingIcon,
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
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateString = selectedDate.toISOString().split('T')[0];

  useEffect(() => { fetchDashboard(); }, [dateString]);

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
      setRooms(roomsResponse.data?.data || []);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const toMinutes = (value) => {
    const [hours, minutes] = String(value || '00:00').split(':').map(Number);
    return hours * 60 + minutes;
  };

  const timeSlots = Array.from({ length: 18 }, (_, index) => 9 * 60 + index * 30);
  const formatTime = (minutes) => new Date(0, 0, 1, Math.floor(minutes / 60), minutes % 60).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const getBookingForSlot = (roomId, slotStart) => todayBookings.find((booking) => {
    const bookingRoomId = booking.meeting_room_id || booking.room_id || booking.room?.id;
    return String(bookingRoomId) === String(roomId)
      && !['cancelled', 'rejected'].includes(booking.status)
      && toMinutes(booking.start_time) < slotStart + 30
      && toMinutes(booking.end_time) > slotStart;
  });
  const openBooking = (room, slotStart) => {
    const startTime = `${String(Math.floor(slotStart / 60)).padStart(2, '0')}:${String(slotStart % 60).padStart(2, '0')}`;
    const endMinutes = slotStart + 30;
    const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;
    navigate(`/meeting-room/book?date=${dateString}&roomId=${room.id}&startTime=${startTime}&endTime=${endTime}`);
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

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>Room schedule</Typography>
      </Box>

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
            <Box><Typography sx={{ fontWeight: 800 }}>Available Meeting Rooms</Typography><Typography variant="body2" color="text.secondary">{selectedDate.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</Typography></Box>
          </Stack>
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
        <Box sx={{ p: 2.5 }}>
          {rooms.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">No meeting rooms available.</Typography>
            </Box>
          ) : (
            <Grid container spacing={2.5}>
              {rooms.map((room) => {
                const unavailable = room.status === 'inactive' || room.status === 'under_maintenance' || room.room_status === 'disabled';
                return (
                  <Grid item xs={12} sm={6} md={4} key={room.id}>
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
                          transform: 'translateY(-2px)',
                        },
                      }}
                    >
                      <CardContent sx={{ p: 2.5 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: 'primary.50', color: 'primary.main', display: 'flex' }}>
                              <MeetingRoomIcon sx={{ fontSize: 24 }} />
                            </Box>
                            <Box>
                              <Typography variant="h6" sx={{ fontWeight: 800, fontSize: 16, lineHeight: 1.2 }}>
                                {room.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {room.building || 'Main Building'} • Floor {room.floor || 1}
                              </Typography>
                            </Box>
                          </Box>
                          <Chip
                            label={unavailable ? 'Unavailable' : 'Available'}
                            size="small"
                            sx={{
                              fontWeight: 700,
                              fontSize: 11,
                              bgcolor: unavailable ? '#FEE2E2' : '#DCFCE7',
                              color: unavailable ? '#B91C1C' : '#166534',
                            }}
                          />
                        </Stack>

                        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 0.5 }}>
                          <Chip label={`👥 ${room.capacity} Seats`} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: 12 }} />
                          <Chip label={`📍 ${room.location || room.room_number || 'Floor ' + room.floor}`} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: 12 }} />
                          {room.room_type && (
                            <Chip label={`🏷️ ${room.room_type}`} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: 12 }} />
                          )}
                        </Stack>

                        {room.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13, mb: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {room.description}
                          </Typography>
                        )}
                      </CardContent>

                      <Box sx={{ p: 2, pt: 0 }}>
                        <Button
                          fullWidth
                          variant="contained"
                          disabled={unavailable}
                          onClick={() => openBooking(room, 9 * 60)}
                          sx={{
                            borderRadius: 1.5,
                            fontWeight: 700,
                            textTransform: 'none',
                            py: 1,
                          }}
                        >
                          {unavailable ? 'Currently Unavailable' : '📅 Book Room'}
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

