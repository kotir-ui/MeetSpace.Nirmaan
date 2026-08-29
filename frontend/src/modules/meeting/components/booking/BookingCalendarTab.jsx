import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Alert,
  Snackbar,
  CircularProgress,
  Badge,
  Divider,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  People as PeopleIcon,
  Room as RoomIcon,
  Videocam as VideocamIcon,
  Tv as TvIcon,
  Draw as DrawIcon,
  Info as InfoIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import * as bookingApi from '../../api/booking.js';
import api from '../../../../api/client.js';
import { useAuth } from '../../../../context/AuthContext.jsx';

const TimeSlots = [
  '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
];

const ApprovalStatuses = [
  { key: 'draft', label: 'Draft', color: '#757575' },
  { key: 'pending_manager', label: 'Pending Manager Approval', color: '#ff9800' },
  { key: 'manager_approved', label: 'Manager Approved', color: '#2196f3' },
  { key: 'pending_hr', label: 'Pending HR Approval', color: '#ff9800' },
  { key: 'hr_approved', label: 'HR Approved', color: '#2196f3' },
  { key: 'confirmed', label: 'Room Booked', color: '#4caf50' },
  { key: 'rejected', label: 'Rejected', color: '#f44336' },
];

export default function BookingCalendarTab() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Form States
  const [meetingType, setMeetingType] = useState('one-time');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [numberOfPeople, setNumberOfPeople] = useState('');
  const [participantNames, setParticipantNames] = useState('');
  const [department, setDepartment] = useState(user?.department || '');
  const [building, setBuilding] = useState('');
  const [meetingPurpose, setMeetingPurpose] = useState('');
  
  // Recurring fields
  const [recurrenceType, setRecurrenceType] = useState('weekly');
  const [recurrenceDays, setRecurrenceDays] = useState([]);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
  
  // Selected room
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedRoomData, setSelectedRoomData] = useState(null);
  
  // Step/Stage
  const [bookingStage, setBookingStage] = useState('details'); // details, search, select, summary
  const [availableRooms, setAvailableRooms] = useState([]);

  // Approval workflow
  const [approvalStatus, setApprovalStatus] = useState('draft');
  const [showApprovalFlow, setShowApprovalFlow] = useState(false);

  useEffect(() => {
    fetchBookingsForMonth();
    api.get('/api/departments').then((response) => setDepartments(response.data || [])).catch(() => setDepartments([]));
  }, [currentDate]);

  const fetchBookingsForMonth = async () => {
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      const response = await bookingApi.getBookings({
        dateFrom: firstDay.toISOString().split('T')[0],
        dateTo: lastDay.toISOString().split('T')[0],
      });
      setBookings(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const fetchAvailableRooms = async () => {
    if (selectedDate.getDay() === 0) {
      setSnackbar({ open: true, message: 'Meeting rooms are closed on Sundays.', severity: 'info' });
      return;
    }
    if (!startTime || !endTime || !numberOfPeople) {
      setSnackbar({ open: true, message: 'Please fill in all required fields', severity: 'error' });
      return;
    }

    try {
      setLoading(true);
      const response = await bookingApi.getRooms({
        date: selectedDate.toISOString().split('T')[0],
        startTime,
        endTime,
        capacity: numberOfPeople,
        building: building || undefined,
      });
      setAvailableRooms(response.data?.data || []);
      setBookingStage('select');
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setSnackbar({ open: true, message: 'Failed to load available rooms', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDayClick = (day) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    if (newDate.getDay() === 0) return;
    setSelectedDate(newDate);
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getBookingsForDay = (day) => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      .toISOString()
      .split('T')[0];
    return bookings.filter((b) => b.meeting_date === dateStr);
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = (getFirstDayOfMonth(currentDate) + 6) % 7;
  const days = [];

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    if (new Date(currentDate.getFullYear(), currentDate.getMonth(), i).getDay() !== 0) {
      days.push(i);
    }
  }

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const isToday = (day) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const isPastDate = (day) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  const handleSelectRoom = (room) => {
    setSelectedRoom(room.id);
    setSelectedRoomData(room);
    setBookingStage('summary');
  };

  const handleSubmitBooking = async () => {
    try {
      setLoading(true);
      const bookingData = {
        title: meetingPurpose,
        purpose: meetingPurpose,
        meeting_date: selectedDate.toISOString().split('T')[0],
        start_time: startTime,
        end_time: endTime,
        room_id: selectedRoom,
        number_of_participants: parseInt(numberOfPeople),
        participant_names: participantNames,
        organizer_id: user?.id,
        meeting_type: meetingType,
        recurrence_type: meetingType === 'recurring' ? recurrenceType : null,
        recurrence_end_date: meetingType === 'recurring' ? recurrenceEndDate : null,
      };

      await bookingApi.createBooking(bookingData);
      setSnackbar({
        open: true,
        message: 'Meeting room booking request submitted successfully!',
        severity: 'success',
      });
      setApprovalStatus('pending_manager');
      setTimeout(() => resetForm(), 2000);
    } catch (error) {
      console.error('Error creating booking:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to submit booking',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setMeetingType('one-time');
    setStartTime('');
    setEndTime('');
    setNumberOfPeople('');
    setParticipantNames('');
    setBuilding('');
    setMeetingPurpose('');
    setSelectedRoom(null);
    setSelectedRoomData(null);
    setBookingStage('details');
    setApprovalStatus('draft');
    fetchBookingsForMonth();
  };

  // Calendar rendering
  const calendarDays = days.map((day, index) => {
    if (day === null) {
      return (
        <Grid item xs={12 / 6} key={`empty-${index}`}>
          <Box sx={{ p: 0.5 }} />
        </Grid>
      );
    }

    const dayBookings = getBookingsForDay(day);
    const isSelected = selectedDate.getDate() === day &&
      selectedDate.getMonth() === currentDate.getMonth() &&
      selectedDate.getFullYear() === currentDate.getFullYear();

    return (
      <Grid item xs={12 / 6} key={day}>
        <Box
          onClick={() => !isPastDate(day) && handleDayClick(day)}
          sx={{
            cursor: isPastDate(day) ? 'not-allowed' : 'pointer',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            aspectRatio: '1',
            border: isSelected ? '3px solid #2196f3' : '2px solid #e0e0e0',
            borderRadius: '8px',
            backgroundColor: isPastDate(day)
              ? '#f5f5f5'
              : isToday(day)
              ? '#e8f5e9'
              : 'white',
            opacity: isPastDate(day) ? 0.5 : 1,
            transition: 'all 0.2s ease',
            '&:hover': {
              boxShadow: !isPastDate(day) ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
              transform: !isPastDate(day) ? 'scale(1.05)' : 'none',
              borderColor: !isPastDate(day) ? '#2196f3' : '#e0e0e0',
            },
            p: 0.5,
            position: 'relative',
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontWeight: 700,
              fontSize: '0.95rem',
              color: isToday(day) ? '#2e7d32' : 'text.primary',
              textAlign: 'center',
            }}
          >
            {day}
          </Typography>
          {dayBookings.length > 0 && (
            <Box
              sx={{
                position: 'absolute',
                bottom: '2px',
                right: '2px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#ff9800',
              }}
            />
          )}
        </Box>
      </Grid>
    );
  });

  return (
    <Box sx={{ py: 1 }}>
      <Grid container spacing={2}>
        {/* LEFT: Calendar */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 1.5, borderRadius: 2, height: '100%' }}>
            {/* Calendar Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {monthYear}
              </Typography>
              <Box>
                <IconButton onClick={handlePreviousMonth} size="small">
                  <ChevronLeftIcon />
                </IconButton>
                <IconButton onClick={handleNextMonth} size="small">
                  <ChevronRightIcon />
                </IconButton>
              </Box>
            </Box>

            {/* Legend */}
            <Box sx={{ mb: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap', fontSize: '0.65rem' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#4caf50' }} />
                <span>Available</span>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#f44336' }} />
                <span>Booked</span>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#ff9800' }} />
                <span>Pending</span>
              </Box>
            </Box>

            {/* Week Days */}
            <Grid container spacing={0.3} sx={{ mb: 0.5 }}>
              {weekDays.map((day) => (
                <Grid item xs={12 / 6} key={day}>
                  <Box sx={{ textAlign: 'center', fontWeight: 700, fontSize: '0.7rem', py: 0.3, color: 'text.secondary' }}>
                    {day}
                  </Box>
                </Grid>
              ))}
            </Grid>

            {/* Calendar Days */}
            <Grid container spacing={0.3}>
              {calendarDays}
            </Grid>

            {/* Selected Date Display */}
            <Box sx={{ mt: 1.5, p: 1.5, backgroundColor: '#e3f2fd', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ color: '#1565c0', fontWeight: 600 }}>
                📅 Selected: {selectedDate.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* RIGHT: Booking Panel */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, borderRadius: 2, height: '100%' }}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1, fontSize: '1rem' }}>
              <EditIcon sx={{ fontSize: 20 }} /> Book Meeting Room
            </Typography>

            {bookingStage === 'details' && (
              <Box>
                {/* Meeting Type Selection */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.8, fontSize: '0.9rem' }}>
                    Meeting Type
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant={meetingType === 'one-time' ? 'contained' : 'outlined'}
                      onClick={() => setMeetingType('one-time')}
                      sx={{ textTransform: 'none' }}
                    >
                      One-time Meeting
                    </Button>
                    <Button
                      variant={meetingType === 'recurring' ? 'contained' : 'outlined'}
                      onClick={() => setMeetingType('recurring')}
                      sx={{ textTransform: 'none' }}
                    >
                      Recurring Meeting
                    </Button>
                  </Box>
                </Box>

                <Divider sx={{ my: 1.5 }} />

                {/* Time Selection */}
                <Grid container spacing={1.5} sx={{ mb: 2 }}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Start Time</InputLabel>
                      <Select value={startTime} onChange={(e) => setStartTime(e.target.value)} label="Start Time">
                        {TimeSlots.map((time) => (
                          <MenuItem key={time} value={time}>{time}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>End Time</InputLabel>
                      <Select value={endTime} onChange={(e) => setEndTime(e.target.value)} label="End Time">
                        {TimeSlots.map((time) => (
                          <MenuItem key={time} value={time}>{time}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                {/* Number of Participants */}
                <Grid container spacing={1.5} sx={{ mb: 2 }}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Number of People *"
                      type="number"
                      value={numberOfPeople}
                      onChange={(e) => setNumberOfPeople(e.target.value)}
                      fullWidth
                      size="small"
                      inputProps={{ min: 1 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Department</InputLabel>
                      <Select value={department} onChange={(e) => setDepartment(e.target.value)} label="Department">
                        <MenuItem value="">Select Department</MenuItem>
                        {departments.map((dept) => <MenuItem key={dept.id} value={dept.name}>{dept.name}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                {/* Participant Names */}
                <Grid container spacing={1.5} sx={{ mb: 2 }}>
                  <Grid item xs={12}>
                    <TextField
                      label="Participant Names (optional)"
                      value={participantNames}
                      onChange={(e) => setParticipantNames(e.target.value)}
                      fullWidth
                      multiline
                      rows={2}
                      size="small"
                      placeholder="Enter participant names, one per line"
                    />
                  </Grid>
                </Grid>

                {/* Building/Floor Filter */}
                <Grid container spacing={1.5} sx={{ mb: 2 }}>
                  <Grid item xs={12}>
                    <TextField
                      label="Building / Floor (optional)"
                      value={building}
                      onChange={(e) => setBuilding(e.target.value)}
                      fullWidth
                      size="small"
                      placeholder="e.g., Building A - Floor 3"
                    />
                  </Grid>
                </Grid>

                {/* Meeting Purpose */}
                <Grid container spacing={1.5} sx={{ mb: 2 }}>
                  <Grid item xs={12}>
                    <TextField
                      label="Meeting Purpose / Agenda *"
                      value={meetingPurpose}
                      onChange={(e) => setMeetingPurpose(e.target.value)}
                      fullWidth
                      multiline
                      rows={2}
                      size="small"
                    />
                  </Grid>
                </Grid>

                {/* Recurring Options */}
                {meetingType === 'recurring' && (
                  <Box sx={{ mb: 2, p: 1.5, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5, fontSize: '0.9rem' }}>
                      Recurrence Settings
                    </Typography>
                    <Grid container spacing={1.5}>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Recurrence Type</InputLabel>
                          <Select value={recurrenceType} onChange={(e) => setRecurrenceType(e.target.value)} label="Recurrence Type">
                            <MenuItem value="daily">Daily</MenuItem>
                            <MenuItem value="weekly">Weekly</MenuItem>
                            <MenuItem value="monthly">Monthly</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Recurrence End Date"
                          type="date"
                          value={recurrenceEndDate}
                          onChange={(e) => setRecurrenceEndDate(e.target.value)}
                          fullWidth
                          size="small"
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                )}

                {/* Search Button */}
                <Button
                  variant="contained"
                  fullWidth
                  onClick={fetchAvailableRooms}
                  disabled={!startTime || !endTime || !numberOfPeople || !meetingPurpose}
                  sx={{ py: 1, fontWeight: 600, fontSize: '0.95rem' }}
                >
                  Search Available Rooms
                </Button>
              </Box>
            )}

            {bookingStage === 'select' && (
              <Box>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5, fontSize: '0.9rem' }}>
                      Available Rooms for {startTime} - {endTime}
                    </Typography>

                    {availableRooms.length === 0 ? (
                      <Alert severity="warning">No rooms available for the selected date, time, and capacity.</Alert>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxHeight: '350px', overflowY: 'auto' }}>
                        {availableRooms.map((room) => (
                          <Card
                            key={room.id}
                            onClick={() => handleSelectRoom(room)}
                            sx={{
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                transform: 'translateY(-1px)',
                              },
                            }}
                          >
                            <CardContent sx={{ pb: 1, p: 1.5 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.8 }}>
                                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
                                  {room.name}
                                </Typography>
                                <Chip label="Available" color="success" size="small" />
                              </Box>
                              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0.8, mb: 0.8 }}>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                                  📍 Room #{room.room_number}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                                  👥 Capacity: {room.capacity}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                                  🏢 Building: {room.building || 'N/A'}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                                  📊 Floor: {room.floor || 'N/A'}
                                </Typography>
                              </Box>

                              {/* Facilities */}
                              {room.facilities && room.facilities.length > 0 && (
                                <Box sx={{ display: 'flex', gap: 0.4, flexWrap: 'wrap' }}>
                                  {room.facilities.map((facility) => (
                                    <Chip
                                      key={facility.id}
                                      label={facility.facility_type}
                                      size="small"
                                      variant="outlined"
                                      sx={{ fontSize: '0.65rem', height: 20 }}
                                    />
                                  ))}
                                </Box>
                              )}

                              <Button
                                variant="outlined"
                                fullWidth
                                size="small"
                                sx={{ mt: 1, textTransform: 'none', fontSize: '0.85rem' }}
                              >
                                Select Room
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </Box>
                    )}

                    <Button
                      variant="text"
                      fullWidth
                      onClick={() => setBookingStage('details')}
                      sx={{ mt: 1.5, fontSize: '0.9rem' }}
                    >
                      ← Back to Details
                    </Button>
                  </>
                )}
              </Box>
            )}

            {bookingStage === 'summary' && selectedRoomData && (
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5, fontSize: '0.95rem' }}>
                  Booking Summary
                </Typography>

                <Card sx={{ mb: 2, backgroundColor: '#f8f9fa' }}>
                  <CardContent sx={{ p: 1.5 }}>
                    <Grid container spacing={1.5}>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.75rem' }}>
                          Date
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                          {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.75rem' }}>
                          Time
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                          {startTime} – {endTime}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.75rem' }}>
                          Participants
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                          {numberOfPeople} People
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.75rem' }}>
                          Type
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                          {meetingType === 'one-time' ? 'One-time' : 'Recurring'}
                        </Typography>
                      </Grid>
                    </Grid>

                    <Divider sx={{ my: 1.5 }} />

                    <Grid container spacing={1.5}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.75rem' }}>
                          Room
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                          {selectedRoomData.name}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.75rem' }}>
                          Organizer
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                          {user?.name}
                        </Typography>
                      </Grid>
                    </Grid>

                    <Divider sx={{ my: 1.5 }} />

                    <Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.75rem' }}>
                        Purpose
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                        {meetingPurpose}
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 1.5 }} />

                    {/* Approval Workflow */}
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.8, fontSize: '0.75rem' }}>
                      Approval Workflow
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexWrap: 'wrap' }}>
                      {['pending_manager', 'manager_approved', 'pending_hr', 'hr_approved', 'confirmed'].map((status, idx) => (
                        <React.Fragment key={status}>
                          <Chip
                            label={ApprovalStatuses.find((s) => s.key === status)?.label}
                            sx={{
                              backgroundColor: ApprovalStatuses.find((s) => s.key === status)?.color,
                              color: 'white',
                              fontSize: '0.65rem',
                              height: 20,
                            }}
                          />
                          {idx < 4 && <Typography sx={{ fontSize: '1rem', color: 'text.secondary' }}>→</Typography>}
                        </React.Fragment>
                      ))}
                    </Box>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'space-between' }}>
                  <Button
                    variant="outlined"
                    onClick={() => resetForm()}
                    disabled={loading}
                    size="small"
                  >
                    Cancel
                  </Button>
                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Button
                      variant="outlined"
                      onClick={() => setApprovalStatus('draft')}
                      disabled={loading}
                      size="small"
                    >
                      Save Draft
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleSubmitBooking}
                      disabled={loading}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    >
                      {loading ? 'Submitting...' : 'Submit for Approval'}
                    </Button>
                  </Box>
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
