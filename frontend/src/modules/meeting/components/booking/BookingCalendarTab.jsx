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
  const [participantList, setParticipantList] = useState([]);
  const [department, setDepartment] = useState(user?.department || '');
  const [building, setBuilding] = useState('');
  const [meetingPurpose, setMeetingPurpose] = useState('');

  const handleNumberOfPeopleChange = (val) => {
    setNumberOfPeople(val);
    const count = parseInt(val, 10);
    if (!isNaN(count) && count > 0) {
      const safeCount = Math.min(count, 50);
      setParticipantList((prev) => {
        const next = [...prev];
        if (next.length < safeCount) {
          while (next.length < safeCount) {
            next.push('');
          }
        } else if (next.length > safeCount) {
          next.length = safeCount;
        }
        return next;
      });
    } else {
      setParticipantList([]);
    }
  };

  const handleParticipantNameChange = (index, name) => {
    setParticipantList((prev) => {
      const next = [...prev];
      next[index] = name;
      const formatted = next
        .map((n) => (n || '').trim())
        .filter(Boolean)
        .map((n, i) => `${i + 1}. ${n}`)
        .join('\n');
      setParticipantNames(formatted);
      return next;
    });
  };
  
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

  const isPastTime = (selDate, timeStr) => {
    if (!timeStr) return false;
    const today = new Date();
    if (
      selDate.getDate() === today.getDate() &&
      selDate.getMonth() === today.getMonth() &&
      selDate.getFullYear() === today.getFullYear()
    ) {
      const [time, ampm] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (ampm.toUpperCase() === 'PM' && hours < 12) hours += 12;
      if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
      
      const checkTime = new Date(today);
      checkTime.setHours(hours, minutes, 0, 0);
      return checkTime <= today;
    }
    return false;
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
    if (isPastTime(selectedDate, startTime)) {
      setSnackbar({ open: true, message: 'Cannot book a slot that has already passed today.', severity: 'error' });
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
      
      const isCapacityExceeded = Boolean(selectedRoomData && parseInt(numberOfPeople, 10) > selectedRoomData.capacity);
      if (isCapacityExceeded) {
        setSelectedRoom(null);
        setSelectedRoomData(null);
        setBookingStage('select');
        return;
      }

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
    days.push(i);
  }

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
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
    if (isPastTime(selectedDate, startTime)) {
      setSnackbar({ open: true, message: 'Cannot book a slot that has already passed today.', severity: 'error' });
      return;
    }
    try {
      setLoading(true);
      if (selectedRoomData && parseInt(numberOfPeople, 10) > selectedRoomData.capacity) {
        setSnackbar({
          open: true,
          message: `This room (${selectedRoomData.name}) allows maximum ${selectedRoomData.capacity} members only. In case you need to add more people (${numberOfPeople}), please choose another room with larger capacity.`,
          severity: 'error',
        });
        setLoading(false);
        return;
      }

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
    setParticipantList([]);
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
        <Grid item xs={1} key={`empty-${index}`}>
          <Box sx={{ p: 0.5 }} />
        </Grid>
      );
    }

    const dayBookings = getBookingsForDay(day);
    const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const isSunday = dayDate.getDay() === 0;
    const isSelected = selectedDate.getDate() === day &&
      selectedDate.getMonth() === currentDate.getMonth() &&
      selectedDate.getFullYear() === currentDate.getFullYear();

    const hasBooked = dayBookings.some((b) => ['confirmed', 'approved', 'completed'].includes(b.status));
    const hasPending = dayBookings.some((b) => b.status?.startsWith('pending'));
    const hasAvailable = !isPastDate(day) && !isSunday;

    return (
      <Grid item xs={1} key={day}>
        <Box
          onClick={() => {
            if (isSunday) {
              setSnackbar({ open: true, message: 'Meeting rooms are closed on Sundays.', severity: 'info' });
              return;
            }
            if (!isPastDate(day)) handleDayClick(day);
          }}
          sx={{
            cursor: isPastDate(day) || isSunday ? 'not-allowed' : 'pointer',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            aspectRatio: '1',
            border: isSelected ? '3px solid #2196f3' : '2px solid #e0e0e0',
            borderRadius: '8px',
            backgroundColor: isSunday
              ? '#fafafa'
              : isPastDate(day)
              ? '#f5f5f5'
              : isToday(day)
              ? '#e8f5e9'
              : 'white',
            opacity: isPastDate(day) ? 0.5 : isSunday ? 0.7 : 1,
            transition: 'all 0.2s ease',
            '&:hover': {
              boxShadow: !isPastDate(day) && !isSunday ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
              transform: !isPastDate(day) && !isSunday ? 'scale(1.05)' : 'none',
              borderColor: !isPastDate(day) && !isSunday ? '#2196f3' : '#e0e0e0',
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
              color: isSunday ? '#9e9e9e' : isToday(day) ? '#2e7d32' : 'text.primary',
              textAlign: 'center',
            }}
          >
            {day}
          </Typography>
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

            {/* Week Days Header (7 columns) */}
            <Grid container columns={7} spacing={0.3} sx={{ mb: 0.5 }}>
              {weekDays.map((day) => (
                <Grid item xs={1} key={day}>
                  <Box sx={{ textAlign: 'center', fontWeight: 700, fontSize: '0.75rem', py: 0.3, color: day === 'Sun' ? 'text.secondary' : 'text.primary' }}>
                    {day}
                  </Box>
                </Grid>
              ))}
            </Grid>

            {/* Calendar Days (7 columns) */}
            <Grid container columns={7} spacing={0.3}>
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

            {bookingStage === 'details' && (() => {
              const isCapacityExceeded = Boolean(selectedRoomData && parseInt(numberOfPeople, 10) > selectedRoomData.capacity);

              return (
              <Box>
                {selectedRoomData && !isCapacityExceeded && (
                  <Alert severity="success" sx={{ mb: 2, borderRadius: 1.5 }}>
                    Selected room: <strong>{selectedRoomData.name}</strong> ({selectedRoomData.capacity} seats max capacity)
                  </Alert>
                )}

                {isCapacityExceeded && (
                  <Alert
                    severity="error"
                    variant="filled"
                    sx={{ mb: 2, borderRadius: 1.5, alignItems: 'center' }}
                    action={
                      <Button
                        color="inherit"
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          setSelectedRoom(null);
                          setSelectedRoomData(null);
                          setBookingStage('details');
                        }}
                        sx={{ fontWeight: 800, bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
                      >
                        Choose Another Room
                      </Button>
                    }
                  >
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>
                      ⚠️ Room Capacity Exceeded!
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', mt: 0.2 }}>
                      This room allows <strong>{selectedRoomData.capacity} members</strong> only. In case you need to add more people ({numberOfPeople} participants), please choose another room.
                    </Typography>
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
                      onChange={(e) => handleNumberOfPeopleChange(e.target.value)}
                      fullWidth
                      size="small"
                      inputProps={{ min: 1 }}
                      placeholder="e.g. 4"
                      error={isCapacityExceeded}
                      helperText={isCapacityExceeded ? `Max capacity is ${selectedRoomData.capacity} members. Choose another room.` : undefined}
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

                {/* Dynamic Numbered Participant Names */}
                {participantList.length > 0 ? (
                  <Box
                    sx={{
                      mb: 1.5,
                      p: 1.5,
                      bgcolor: '#F8FAFC',
                      borderRadius: 1.5,
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        color: '#1E293B',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        mb: 1,
                      }}
                    >
                      <PeopleIcon sx={{ fontSize: 15, color: 'primary.main' }} />
                      Participant List ({participantList.length} {participantList.length === 1 ? 'Person' : 'People'}):
                    </Typography>

                    <Grid container spacing={1}>
                      {participantList.map((name, index) => {
                        const exampleNames = ['John', 'Lee', 'Jon', 'Bob', 'Alice', 'David', 'Emma', 'Michael'];
                        const placeholderName = exampleNames[index] || `Person ${index + 1}`;

                        return (
                          <Grid item xs={12} sm={participantList.length > 1 ? 6 : 12} key={index}>
                            <TextField
                              label={`${index + 1}. Participant Name`}
                              value={name}
                              onChange={(e) => handleParticipantNameChange(index, e.target.value)}
                              fullWidth
                              size="small"
                              placeholder={`e.g. ${placeholderName}`}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: 1.5,
                                  bgcolor: '#FFFFFF',
                                },
                              }}
                            />
                          </Grid>
                        );
                      })}
                    </Grid>
                  </Box>
                ) : (
                  /* Fallback single input if number of people is not entered yet */
                  <Grid container spacing={1.2} sx={{ mb: 1.5 }}>
                    <Grid item xs={12}>
                      <TextField
                        label="Participant Names (optional)"
                        value={participantNames}
                        onChange={(e) => setParticipantNames(e.target.value)}
                        fullWidth
                        size="small"
                        placeholder="Enter Number of People above or type names: e.g. 1. John, 2. Lee"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#FAFAFA' } }}
                      />
                    </Grid>
                  </Grid>
                )}

                {/* Building / Floor Filter */}
                <Grid container spacing={1.2} sx={{ mb: 1.5 }}>
                  <Grid item xs={12}>
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
                      : isCapacityExceeded
                      ? 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)'
                      : 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                    boxShadow: (!startTime || !endTime || !numberOfPeople || !meetingPurpose)
                      ? 'none'
                      : isCapacityExceeded
                      ? '0 4px 12px rgba(220,38,38,0.3)'
                      : '0 4px 12px rgba(37,99,235,0.3)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      background: isCapacityExceeded
                        ? 'linear-gradient(135deg, #B91C1C 0%, #991B1B 100%)'
                        : 'linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%)',
                      boxShadow: isCapacityExceeded
                        ? '0 6px 16px rgba(220,38,38,0.4)'
                        : '0 6px 16px rgba(37,99,235,0.4)',
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  {isCapacityExceeded ? `Find Larger Rooms for ${numberOfPeople} People` : 'Book Room'}
                </Button>
              </Box>
              );
            })()}

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
