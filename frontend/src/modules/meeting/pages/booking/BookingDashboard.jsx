import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Paper,
  Stack,
  Typography,
  Chip,
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import EventIcon from '@mui/icons-material/Event';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import CancelIcon from '@mui/icons-material/Cancel';

const BookingDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRooms: 0,
    availableRooms: 0,
    todayBookings: 0,
    upcomingMeetings: 0,
    pendingApprovals: 0,
    pendingHrApprovals: 0,
    cancelledMeetings: 0,
  });
  const [todayMeetings, setTodayMeetings] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Get rooms stats
      const roomsRes = await axios.get('/api/booking/rooms/stats');
      const roomsData = roomsRes.data.data;

      // Get bookings for today
      const today = new Date().toISOString().split('T')[0];
      const bookingsRes = await axios.get(`/api/booking/bookings?dateFrom=${today}&dateTo=${today}`);
      const todayBookingsList = bookingsRes.data.data;

      // Get upcoming bookings
      const upcomingRes = await axios.get('/api/booking/bookings');
      const upcomingBookings = upcomingRes.data.data.filter(b => b.status === 'confirmed');

      // Get approval stats
      const approvalRes = await axios.get('/api/booking/approvals/stats');
      const approvalStats = approvalRes.data.data;

      setStats({
        totalRooms: roomsData.totalRooms || 0,
        availableRooms: roomsData.activeRooms || 0,
        todayBookings: todayBookingsList.length || 0,
        upcomingMeetings: upcomingBookings.length || 0,
        pendingApprovals: approvalStats.pending || 0,
        pendingHrApprovals: approvalStats.pending || 0,
        cancelledMeetings: approvalStats.rejected || 0,
      });

      setTodayMeetings(todayBookingsList);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, color, onClick }) => (
    <Card
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        '&:hover': onClick ? { boxShadow: 4, transform: 'translateY(-4px)' } : {},
      }}
      onClick={onClick}
    >
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: `${color}22`,
            }}
          >
            <Icon sx={{ color, fontSize: 32 }} />
          </Box>
          <Box flex={1}>
            <Typography color="textSecondary" variant="caption" sx={{ fontWeight: 600 }}>
              {title}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>
              {value}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Meeting Room Booking Dashboard
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
            Manage office meeting room bookings and approvals
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={() => navigate('/booking/new')}
        >
          + Book Meeting Room
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={MeetingRoomIcon}
            title="Total Rooms"
            value={stats.totalRooms}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={EventAvailableIcon}
            title="Available Now"
            value={stats.availableRooms}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={EventIcon}
            title="Today's Bookings"
            value={stats.todayBookings}
            color="#f57c00"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={CheckCircleIcon}
            title="Upcoming Meetings"
            value={stats.upcomingMeetings}
            color="#7b1fa2"
          />
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={HourglassTopIcon}
            title="Pending Approvals"
            value={stats.pendingApprovals}
            color="#d32f2f"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={CancelIcon}
            title="Cancelled"
            value={stats.cancelledMeetings}
            color="#c62828"
          />
        </Grid>
      </Grid>

      {/* Today's Meetings Timeline */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          Today's Meetings Timeline
        </Typography>

        {todayMeetings.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Time</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Meeting</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Room</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Organizer</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {todayMeetings.map((meeting) => (
                  <TableRow
                    key={meeting.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/booking/details/${meeting.id}`)}
                  >
                    <TableCell>
                      {meeting.start_time} - {meeting.end_time}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{meeting.title}</TableCell>
                    <TableCell>{meeting.room?.name}</TableCell>
                    <TableCell>{meeting.organizer?.name}</TableCell>
                    <TableCell>
                      <Chip
                        label={meeting.status.replace(/_/g, ' ').toUpperCase()}
                        size="small"
                        color={
                          meeting.status === 'confirmed'
                            ? 'success'
                            : meeting.status === 'rejected'
                            ? 'error'
                            : 'warning'
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography color="textSecondary" sx={{ textAlign: 'center', py: 3 }}>
            No meetings scheduled for today
          </Typography>
        )}
      </Paper>

      {/* Quick Actions */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          Quick Actions
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Button
            variant="outlined"
            onClick={() => navigate('/booking/calendar')}
          >
            View Calendar
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/booking/my-bookings')}
          >
            My Bookings
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/booking/approvals')}
          >
            Approvals
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/booking/rooms')}
          >
            Room Management
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export default BookingDashboard;
