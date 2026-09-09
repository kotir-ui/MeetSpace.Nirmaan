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
  Search as SearchIcon,
  LocationOn as LocationOnIcon,
} from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import * as bookingApi from '../../api/booking.js';
import api from '../../../../api/client.js';
import { useAuth } from '../../../../context/AuthContext.jsx';

const TimeSlots = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
  '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
];

const ApprovalStatuses = [
  { key: 'draft', label: 'Draft', color: '#757575' },
  { key: 'pending_approval', label: 'Booking Request', color: '#ff9800' },
  { key: 'admin_approved', label: 'Admin Approval', color: '#2196f3' },
  { key: 'confirmed', label: 'Booking Confirmation', color: '#4caf50' },
  { key: 'rejected', label: 'Rejected', color: '#f44336' },
];

const DEFAULT_DEPARTMENTS = [
  { id: 1, name: 'Engineering', code: 'ENG' },
  { id: 2, name: 'Human Resources', code: 'HR' },
  { id: 3, name: 'Marketing', code: 'MKT' },
  { id: 4, name: 'Sales & Business', code: 'SALES' },
  { id: 5, name: 'Finance & Accounts', code: 'FIN' },
  { id: 6, name: 'Operations & Facilities', code: 'OPS' },
  { id: 7, name: 'Information Technology', code: 'IT' },
  { id: 8, name: 'Product Management', code: 'PM' },
  { id: 9, name: 'Management / Executive', code: 'EXEC' },
];

export default function BookingCalendarTab() {
  const { user } = useAuth();
  const location = useLocation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [departments, setDepartments] = useState(DEFAULT_DEPARTMENTS);
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
    if (user?.department && !department) {
      setDepartment(user.department);
    }
  }, [user]);

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const response = await api.get('/departments');
        const list = response.data?.data || (Array.isArray(response.data) ? response.data : []);
        if (list && list.length > 0) {
          setDepartments(list);
        } else {
          setDepartments(DEFAULT_DEPARTMENTS);
        }
      } catch (err) {
        console.warn('Using default departments list:', err);
        setDepartments(DEFAULT_DEPARTMENTS);
      }
    };
    fetchDepts();
  }, []);

  const formatTo12HourSlot = (timeStr) => {
    if (!timeStr) return '';
    const clean = String(timeStr).trim();
    if (/^\d{1,2}:\d{2}\s+(AM|PM)$/i.test(clean)) {
      const parts = clean.split(' ');
      const [h, m] = parts[0].split(':');
      return `${String(parseInt(h, 10)).padStart(2, '0')}:${m} ${parts[1].toUpperCase()}`;
    }
    const [hStr, mStr] = clean.split(':');
    let h = parseInt(hStr, 10) || 9;
    const m = mStr ? mStr.slice(0, 2) : '00';
    const ampm = h >= 12 ? 'PM' : 'AM';
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
  };

  useEffect(() => {
    const parameters = new URLSearchParams(location.search);
    const date = parameters.get('date');
    const start = parameters.get('startTime');
    const end = parameters.get('endTime');
    const roomId = parameters.get('roomId');

    if (date) {
      const bookingDate = new Date(`${date}T00:00:00`);
      if (!Number.isNaN(bookingDate.getTime())) {
        setSelectedDate(bookingDate);
        setCurrentDate(bookingDate);
      }
    }
    if (start) {
      const formattedStart = formatTo12HourSlot(start);
      if (TimeSlots.includes(formattedStart)) {
        setStartTime(formattedStart);
      }
    }
    if (end) {
      const formattedEnd = formatTo12HourSlot(end);
      if (TimeSlots.includes(formattedEnd)) {
        setEndTime(formattedEnd);
      }
    }
    if (roomId) {
      bookingApi.getRoomDetails(roomId)
        .then((response) => {
          const room = response.data?.data;
          if (room) {
            setSelectedRoom(room.id);
            setSelectedRoomData(room);
            if (room.capacity) {
              setNumberOfPeople(String(Math.min(2, room.capacity)));
            }
          }
        })
        .catch(() => {});
    }
  }, [location.search]);

  useEffect(() => {
    fetchBookingsForMonth();
  }, [currentDate]);

  const formatLocalDateString = (d) => {
    if (!d) return '';
    const dateObj = new Date(d);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchBookingsForMonth = async () => {
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      const response = await bookingApi.getBookings({
        dateFrom: formatLocalDateString(firstDay),
        dateTo: formatLocalDateString(lastDay),
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
        date: formatLocalDateString(selectedDate),
        startTime,
        endTime,
        capacity: numberOfPeople,
        building: building || undefined,
      });
      const matchingRooms = response.data?.data || [];
      setAvailableRooms(matchingRooms);
      if (selectedRoom) {
        const selectedAvailableRoom = matchingRooms.find((room) => String(room.id) === String(selectedRoom));
        if (selectedAvailableRoom) {
          handleSelectRoom(selectedAvailableRoom);
          return;
        }
      }
      setBookingStage('select');
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setSnackbar({ open: true, message: 'Failed to load available rooms', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDayClick = (day) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day, 12, 0, 0);
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
      const selectedDeptObj = departments.find((d) => d.name === department || d.id === department || d.department_name === department);
      const resolvedDeptId = selectedDeptObj?.id || user?.department_id || null;

      const bookingData = {
        title: meetingPurpose || 'Meeting',
        purpose: meetingPurpose,
        meetingDate: selectedDate.getFullYear() + '-' + String(selectedDate.getMonth() + 1).padStart(2, '0') + '-' + String(selectedDate.getDate()).padStart(2, '0'),
        meeting_date: selectedDate.getFullYear() + '-' + String(selectedDate.getMonth() + 1).padStart(2, '0') + '-' + String(selectedDate.getDate()).padStart(2, '0'),
        startTime: startTime,
        start_time: startTime,
        endTime: endTime,
        end_time: endTime,
        roomId: selectedRoom,
        room_id: selectedRoom,
        departmentId: resolvedDeptId,
        department_id: resolvedDeptId,
        department_name: department || selectedDeptObj?.name || '',
        number_of_participants: parseInt(numberOfPeople) || 1,
        participantsCount: parseInt(numberOfPeople) || 1,
        participant_names: participantNames,
        organizer_id: user?.id,
        meetingType: meetingType,
        meeting_type: meetingType,
        recurrence_type: meetingType === 'recurring' ? recurrenceType : null,
        recurrence_end_date: meetingType === 'recurring' ? recurrenceEndDate : null,
      };

      await bookingApi.createBooking(bookingData);
      setSnackbar({
        open: true,
        message: 'Booking request submitted! Sent to Admin & alerted your Manager for approval.',
        severity: 'success',
      });
      setApprovalStatus('pending_manager');
      setTimeout(() => resetForm(), 2500);
    } catch (error) {
      console.error('Error creating booking:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || error.response?.data?.message || 'Failed to submit booking',
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
                Selected: {selectedDate.toLocaleDateString('en-US', {
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
                {selectedRoomData && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    Selected room: {selectedRoomData.name} ({selectedRoomData.capacity} seats)
                  </Alert>
                )}
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

                {/* Time Selection Dropdowns */}
                <Grid container spacing={1.2} sx={{ mb: 1.5 }}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Start Time</InputLabel>
                      <Select
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        label="Start Time"
                        sx={{ borderRadius: 1.5, bgcolor: '#FAFAFA' }}
                      >
                        {TimeSlots.map((time) => (
                          <MenuItem key={time} value={time}>{time}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>End Time</InputLabel>
                      <Select
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        label="End Time"
                        sx={{ borderRadius: 1.5, bgcolor: '#FAFAFA' }}
                      >
                        {TimeSlots.map((time) => (
                          <MenuItem key={time} value={time}>{time}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                {/* Number of Participants & Department */}
                <Grid container spacing={1.2} sx={{ mb: 1.5 }}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Number of People *"
                      type="number"
                      value={numberOfPeople}
                      onChange={(e) => setNumberOfPeople(e.target.value)}
                      fullWidth
                      size="small"
                      inputProps={{ min: 1 }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#FAFAFA' } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel id="booking-department-select-label">Department *</InputLabel>
                      <Select
                        labelId="booking-department-select-label"
                        id="booking-department-select"
                        value={department || ''}
                        onChange={(e) => setDepartment(e.target.value)}
                        label="Department *"
                        sx={{ borderRadius: 1.5, bgcolor: '#FAFAFA' }}
                      >
                        <MenuItem value="">
                          <em>Select Department</em>
                        </MenuItem>
                        {departments.map((dept) => {
                          const deptName = typeof dept === 'string' ? dept : (dept.name || dept.department_name || '');
                          const deptKey = (dept && dept.id) ? dept.id : deptName;
                          if (!deptName) return null;
                          return (
                            <MenuItem key={deptKey} value={deptName}>
                              {deptName}
                            </MenuItem>
                          );
                        })}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                {/* Participant Names & Building/Floor in Compact 2-Column Grid */}
                <Grid container spacing={1.2} sx={{ mb: 1.5 }}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Participant Names (optional)"
                      value={participantNames}
                      onChange={(e) => setParticipantNames(e.target.value)}
                      fullWidth
                      size="small"
                      placeholder="e.g. John, Sarah"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#FAFAFA' } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Building / Floor (optional)"
                      value={building}
                      onChange={(e) => setBuilding(e.target.value)}
                      fullWidth
                      size="small"
                      placeholder="e.g. Main Block - 2nd Floor"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#FAFAFA' } }}
                    />
                  </Grid>
                </Grid>

                {/* Meeting Purpose */}
                <Box sx={{ mb: 2 }}>
                  <TextField
                    label="Meeting Purpose / Agenda *"
                    value={meetingPurpose}
                    onChange={(e) => setMeetingPurpose(e.target.value)}
                    fullWidth
                    size="small"
                    placeholder="Enter meeting title or agenda..."
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#FAFAFA' } }}
                  />
                </Box>

                {/* Recurring Options */}
                {meetingType === 'recurring' && (
                  <Box sx={{ mb: 2, p: 1.5, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 1.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, mb: 1.2, fontSize: '0.85rem', color: '#1E293B' }}>
                      Recurrence Settings
                    </Typography>
                    <Grid container spacing={1.2}>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Recurrence Type</InputLabel>
                          <Select
                            value={recurrenceType}
                            onChange={(e) => setRecurrenceType(e.target.value)}
                            label="Recurrence Type"
                            sx={{ borderRadius: 1.5, bgcolor: '#FFF' }}
                          >
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
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#FFF' } }}
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
                  startIcon={<SearchIcon />}
                  sx={{
                    py: 1,
                    height: 42,
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    textTransform: 'none',
                    borderRadius: 1.5,
                    background: (!startTime || !endTime || !numberOfPeople || !meetingPurpose)
                      ? undefined
                      : 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                    boxShadow: (!startTime || !endTime || !numberOfPeople || !meetingPurpose)
                      ? 'none'
                      : '0 4px 12px rgba(37,99,235,0.3)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%)',
                      boxShadow: '0 6px 16px rgba(37,99,235,0.4)',
                      transform: 'translateY(-1px)',
                    },
                  }}
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
                                  Room #{room.room_number}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                                  Capacity: {room.capacity}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                                  Building: {room.building || 'N/A'}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                                  Floor: {room.floor || 'N/A'}
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

                <Card sx={{ mb: 2.5, backgroundColor: '#f8fafc', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                  <CardContent sx={{ p: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.3 }}>
                          Date
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.9rem', color: 'text.primary' }}>
                          {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.3 }}>
                          Time
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.9rem', color: 'text.primary' }}>
                          {startTime} – {endTime}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.3 }}>
                          Participants
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.9rem', color: 'text.primary' }}>
                          {numberOfPeople} People
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.3 }}>
                          Type
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.9rem', color: 'text.primary' }}>
                          {meetingType === 'one-time' ? 'One-time' : 'Recurring'}
                        </Typography>
                      </Grid>
                    </Grid>

                    <Divider sx={{ my: 1.75 }} />

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.3 }}>
                          Room
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.9rem', color: 'text.primary' }}>
                          {selectedRoomData.name}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.3 }}>
                          Organizer
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.9rem', color: 'text.primary' }}>
                          {user?.name}
                        </Typography>
                      </Grid>
                    </Grid>

                    <Divider sx={{ my: 1.75 }} />

                    <Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.3 }}>
                        Purpose
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.9rem', color: 'text.primary' }}>
                        {meetingPurpose}
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 1.75 }} />

                    {/* Approval Workflow */}
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.8, fontSize: '0.75rem' }}>
                      Approval Workflow
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexWrap: 'wrap' }}>
                      {[
                        { label: 'Booking Request', color: '#ff9800' },
                        { label: 'Admin Approval', color: '#2196f3' },
                        { label: 'Booking Confirmation', color: '#4caf50' },
                      ].map((step, idx) => (
                        <React.Fragment key={step.label}>
                          <Chip
                            label={step.label}
                            sx={{
                              backgroundColor: step.color,
                              color: 'white',
                              fontWeight: 600,
                              fontSize: '0.72rem',
                              height: 24,
                            }}
                          />
                          {idx < 2 && <Typography sx={{ fontSize: '1rem', color: 'text.secondary', fontWeight: 700 }}>→</Typography>}
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
