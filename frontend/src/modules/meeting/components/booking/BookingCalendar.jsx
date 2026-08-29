import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  IconButton,
  Chip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Divider,
  Stack,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  MeetingRoom as MeetingRoomIcon,
  People as PeopleIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  PendingActions as PendingActionsIcon,
  Videocam as VideocamIcon,
  Tv as TvIcon,
  Draw as DrawIcon,
  VideoCall as VideoCallIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import * as bookingApi from '../../api/booking.js';
import { useAuth } from '../../../../context/AuthContext.jsx';


export default function BookingCalendar() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dayBookings, setDayBookings] = useState([]);
  const [showBookingPanel, setShowBookingPanel] = useState(false);
  const [loading, setLoading] = useState(false);

  // Booking Form State
  const [meetingType, setMeetingType] = useState('one-time'); // one-time or recurring
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [numberOfPeople, setNumberOfPeople] = useState('');
  const [participantNames, setParticipantNames] = useState('');
  const [department, setDepartment] = useState(user?.department || '');
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingPurpose, setMeetingPurpose] = useState('');
  const [building, setBuilding] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [bookingStep, setBookingStep] = useState(0); // 0: Details, 1: Select Room, 2: Confirm
  const [bookingStatus, setBookingStatus] = useState('draft');

  // Recurring meeting state
  const [recurrenceType, setRecurrenceType] = useState('daily');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
  const [recurringDays, setRecurringDays] = useState([]);

  useEffect(() => {
    fetchBookings();
    fetchRooms();
  }, [currentDate]);

  const fetchBookings = async () => {
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

  const fetchRooms = async () => {
    try {
      const response = await bookingApi.getRooms();
      setRooms(response.data?.data || response.data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const searchAvailableRooms = async () => {
    if (!selectedDate || !startTime || !endTime || !numberOfPeople) {
      alert('Please fill in date, time, and number of people');
      return;
    }

    try {
      setLoading(true);
      const response = await bookingApi.checkAvailability({
        date: selectedDate,
        start_time: startTime,
        end_time: endTime,
        capacity: numberOfPeople,
        building: building || undefined,
      });

      // Filter rooms based on availability and capacity
      const filtered = (rooms || []).filter((room) => {
        const hasCapacity = room.capacity >= parseInt(numberOfPeople);
        const isAvailable = !dayBookings.some(
          (booking) =>
            booking.room_id === room.id &&
            booking.status !== 'cancelled' &&
            booking.status !== 'rejected'
        );
        return hasCapacity && isAvailable;
      });

      setAvailableRooms(filtered);
      setBookingStep(1);
    } catch (error) {
      console.error('Error searching rooms:', error);
      setAvailableRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDayClick = (day) => {
    const selectedDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateStr = selectedDay.toISOString().split('T')[0];
    setSelectedDate(dateStr);
    const bookingsForDay = bookings.filter((b) => b.meeting_date === dateStr);
    setDayBookings(bookingsForDay);
    setShowBookingPanel(true);
    setBookingStep(0);
  };

  const handleCreateBooking = async () => {
    if (!selectedRoom || !meetingTitle) {
      alert('Please select a room and enter a meeting title');
      return;
    }

    try {
      setLoading(true);
      const bookingData = {
        room_id: selectedRoom.id,
        meeting_date: selectedDate,
        start_time: startTime,
        end_time: endTime,
        title: meetingTitle,
        purpose: meetingPurpose,
        number_of_participants: numberOfPeople,
        participant_names: participantNames,
        department: department,
        organizer_id: user.id,
      };

      await bookingApi.createBooking(bookingData);
      setBookingStatus('pending_department_head');
      setBookingStep(2);
      setLoading(false);
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Failed to create booking');
      setLoading(false);
    }
  };

  const handleCloseBooking = () => {
    setShowBookingPanel(false);
    setSelectedRoom(null);
    setMeetingTitle('');
    setMeetingPurpose('');
    setNumberOfPeople('');
    setParticipantNames('');
    setBuilding('');
    setBookingStep(0);
    setBookingStatus('draft');
    fetchBookings();
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const hasBookingOnDay = (day) => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      .toISOString()
      .split('T')[0];
    return bookings.some((b) => b.meeting_date === dateStr);
  };

  const getBookingCountForDay = (day) => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      .toISOString()
      .split('T')[0];
    return bookings.filter((b) => b.meeting_date === dateStr).length;
  };

  const getBookingStatusIndicators = (day) => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      .toISOString()
      .split('T')[0];
    const dayBookings = bookings.filter((b) => b.meeting_date === dateStr);
    
    const statuses = {
      confirmed: 0,
      pending: 0,
      myBooking: 0,
    };

    dayBookings.forEach((b) => {
      if (b.status === 'confirmed') statuses.confirmed++;
      else if (b.status.includes('pending')) statuses.pending++;
      if (b.organizer_id === user?.id) statuses.myBooking++;
    });

    return statuses;
  };

  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
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

  const getStatusColor = (status) => {
    const colors = {
      confirmed: '#4caf50',
      pending_department_head: '#ff9800',
      pending_hr: '#2196f3',
      rejected: '#f44336',
      cancelled: '#9e9e9e',
      draft: '#9e9e9e',
    };
    return colors[status] || '#2196f3';
  };

  const getStatusLabel = (status) => {
    const labels = {
      confirmed: 'Confirmed',
      pending_department_head: 'Pending Dept Head',
      pending_hr: 'Pending HR',
      rejected: 'Rejected',
      cancelled: 'Cancelled',
      draft: 'Draft',
    };
    return labels[status] || status;
  };

  const facilitiesConfig = [
    { id: 'projector', label: 'Projector', icon: TvIcon },
    { id: 'tv', label: 'TV', icon: TvIcon },
    { id: 'whiteboard', label: 'Whiteboard', icon: DrawIcon },
    { id: 'video_conference', label: 'Video Conference', icon: VideoCallIcon },
  ];

  return (
    <Box sx={{ display: 'flex', gap: 2, height: '100%' }}>
      {/* Calendar Section */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Paper sx={{ p: 2, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
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
          <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap', fontSize: '0.85rem' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#4caf50' }} />
              <span>Confirmed</span>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ff9800' }} />
              <span>Pending</span>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#2196f3' }} />
              <span>My Booking</span>
            </Box>
          </Box>

          {/* Week Days Header */}
          <Grid container spacing={0.5} sx={{ mb: 1 }}>
            {weekDays.map((day) => (
              <Grid item xs={12 / 6} key={day}>
                <Box sx={{ textAlign: 'center', fontWeight: 700, color: 'text.secondary', fontSize: '0.9rem', py: 1 }}>
                  {day}
                </Box>
              </Grid>
            ))}
          </Grid>

          {/* Calendar Days */}
          <Grid container spacing={0.5}>
            {days.map((day, index) => {
              const indicators = day ? getBookingStatusIndicators(day) : null;
              return (
                <Grid item xs={12 / 6} key={index}>
                  {day === null ? (
                    <Box sx={{ p: 1 }} />
                  ) : (
                    <Card
                      onClick={() => handleDayClick(day)}
                      sx={{
                        cursor: 'pointer',
                        borderRadius: 1,
                        border:
                          selectedDate ===
                          new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
                            .toISOString()
                            .split('T')[0]
                            ? '2px solid #2196f3'
                            : '1px solid #e0e0e0',
                        backgroundColor: hasBookingOnDay(day) ? '#f0f7ff' : 'white',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          transform: 'translateY(-1px)',
                        },
                        minHeight: 80,
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      <CardContent sx={{ p: 1, pb: 0.5, flex: 1 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 700,
                            color: hasBookingOnDay(day) ? 'primary.main' : 'text.primary',
                            fontSize: '0.95rem',
                          }}
                        >
                          {day}
                        </Typography>
                        {indicators && (indicators.confirmed > 0 || indicators.pending > 0) && (
                          <Box sx={{ display: 'flex', gap: 0.3, mt: 0.5, flexWrap: 'wrap' }}>
                            {indicators.confirmed > 0 && (
                              <Tooltip title={`${indicators.confirmed} confirmed`}>
                                <Box
                                  sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    backgroundColor: '#4caf50',
                                  }}
                                />
                              </Tooltip>
                            )}
                            {indicators.pending > 0 && (
                              <Tooltip title={`${indicators.pending} pending`}>
                                <Box
                                  sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    backgroundColor: '#ff9800',
                                  }}
                                />
                              </Tooltip>
                            )}
                            {indicators.myBooking > 0 && (
                              <Tooltip title={`${indicators.myBooking} your bookings`}>
                                <Box
                                  sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    backgroundColor: '#2196f3',
                                  }}
                                />
                              </Tooltip>
                            )}
                          </Box>
                        )}
                        {hasBookingOnDay(day) && (
                          <Chip
                            label={`${getBookingCountForDay(day)}`}
                            size="small"
                            sx={{
                              backgroundColor: '#2196f3',
                              color: 'white',
                              height: 20,
                              fontSize: '0.75rem',
                              mt: 0.5,
                            }}
                          />
                        )}
                      </CardContent>
                    </Card>
                  )}
                </Grid>
              );
            })}
          </Grid>
        </Paper>
      </Box>

      {/* Right Panel - Selected Day & Booking Panel */}
      <Box sx={{ width: { xs: '100%', lg: 400 } }}>
        <Paper sx={{ p: 2, borderRadius: 2, maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }}>
          {/* Selected Date Info */}
          <Box sx={{ mb: 2, pb: 2, borderBottom: '1px solid #e0e0e0' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              {selectedDate
                ? new Date(selectedDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                  })
                : 'Select a date to book'}
            </Typography>

            {selectedDate && (
              <Button
                variant="contained"
                fullWidth
                onClick={() => setShowBookingPanel(true)}
                sx={{ py: 1 }}
              >
                Create Booking
              </Button>
            )}
          </Box>

          {/* Today's Bookings */}
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, fontSize: '0.95rem' }}>
            Bookings ({dayBookings.length})
          </Typography>

          {dayBookings.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {dayBookings.map((booking) => (
                <Card key={booking.id} sx={{ borderRadius: 1, border: '1px solid #e0e0e0' }}>
                  <CardContent sx={{ p: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                        {booking.title}
                      </Typography>
                      <Chip
                        label={getStatusLabel(booking.status)}
                        size="small"
                        sx={{
                          backgroundColor: `${getStatusColor(booking.status)}20`,
                          color: getStatusColor(booking.status),
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          height: 20,
                        }}
                      />
                    </Box>
                    <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mb: 0.3 }}>
                      🕐 {booking.start_time} - {booking.end_time}
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mb: 0.3 }}>
                      🏢 {booking.room?.name}
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                      👤 {booking.organizer?.name}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : (
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', textAlign: 'center', py: 2 }}>
              No bookings for this date
            </Typography>
          )}
        </Paper>
      </Box>

      {/* Booking Panel Dialog */}
      <Dialog
        open={showBookingPanel}
        onClose={handleCloseBooking}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          Create Room Booking
          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontWeight: 400 }}>
            {selectedDate && new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          {/* Stepper */}
          <Stepper activeStep={bookingStep} sx={{ mb: 2 }}>
            <Step completed={bookingStep > 0}>
              <StepLabel>Details</StepLabel>
            </Step>
            <Step completed={bookingStep > 1}>
              <StepLabel>Select Room</StepLabel>
            </Step>
            <Step>
              <StepLabel>Confirm</StepLabel>
            </Step>
          </Stepper>

          {/* Step 1: Booking Details */}
          {bookingStep === 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <TextField
                label="Meeting Title"
                fullWidth
                size="small"
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                placeholder="e.g., Project Review"
              />

              <TextField
                label="Meeting Purpose / Agenda"
                fullWidth
                size="small"
                multiline
                rows={2}
                value={meetingPurpose}
                onChange={(e) => setMeetingPurpose(e.target.value)}
                placeholder="Brief description of the meeting"
              />

              <FormControl fullWidth size="small">
                <InputLabel>Meeting Type</InputLabel>
                <Select value={meetingType} label="Meeting Type" onChange={(e) => setMeetingType(e.target.value)}>
                  <MenuItem value="one-time">One-time Meeting</MenuItem>
                  <MenuItem value="recurring">Recurring Meeting</MenuItem>
                </Select>
              </FormControl>

              {meetingType === 'one-time' && (
                <>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                    <TextField
                      label="Start Time"
                      type="time"
                      size="small"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      label="End Time"
                      type="time"
                      size="small"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Box>
                </>
              )}

              {meetingType === 'recurring' && (
                <>
                  <FormControl fullWidth size="small">
                    <InputLabel>Recurrence</InputLabel>
                    <Select value={recurrenceType} label="Recurrence" onChange={(e) => setRecurrenceType(e.target.value)}>
                      <MenuItem value="daily">Daily</MenuItem>
                      <MenuItem value="weekly">Weekly</MenuItem>
                      <MenuItem value="monthly">Monthly</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    label="End Date"
                    type="date"
                    size="small"
                    value={recurrenceEndDate}
                    onChange={(e) => setRecurrenceEndDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                    <TextField
                      label="Start Time"
                      type="time"
                      size="small"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      label="End Time"
                      type="time"
                      size="small"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Box>
                </>
              )}

              <Divider sx={{ my: 1 }} />

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                <TextField
                  label="Number of People"
                  type="number"
                  size="small"
                  value={numberOfPeople}
                  onChange={(e) => setNumberOfPeople(e.target.value)}
                  inputProps={{ min: 1 }}
                />
                <TextField
                  label="Department"
                  size="small"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
              </Box>

              <TextField
                label="Participant Names (optional)"
                fullWidth
                size="small"
                multiline
                rows={2}
                value={participantNames}
                onChange={(e) => setParticipantNames(e.target.value)}
                placeholder="Add participant names, separated by commas"
              />

              <TextField
                label="Building / Floor (optional)"
                size="small"
                fullWidth
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
              />

              {/* Organizer Info */}
              <Box sx={{ p: 1.5, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                  Organizer Details
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                  👤 {user?.name}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                  🏢 {user?.department || 'N/A'}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Step 2: Select Room */}
          {bookingStep === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Alert severity="info" icon={<InfoIcon />} sx={{ fontSize: '0.9rem' }}>
                {availableRooms.length > 0
                  ? `Found ${availableRooms.length} available room(s)`
                  : 'No available rooms for selected time slot'}
              </Alert>

              {availableRooms.length > 0 ? (
                availableRooms.map((room) => (
                  <Card
                    key={room.id}
                    onClick={() => setSelectedRoom(room)}
                    sx={{
                      cursor: 'pointer',
                      border: selectedRoom?.id === room.id ? '2px solid #2196f3' : '1px solid #e0e0e0',
                      backgroundColor: selectedRoom?.id === room.id ? '#f0f7ff' : 'white',
                      transition: 'all 0.2s',
                      '&:hover': {
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      },
                    }}
                  >
                    <CardContent sx={{ p: 1.5, pb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {room.name}
                        </Typography>
                        <Chip
                          label={`Capacity: ${room.capacity}`}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.75rem' }}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mb: 0.5 }}>
                        {room.floor || 'Floor N/A'} • {room.building || 'Building N/A'}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          color: '#4caf50',
                          fontWeight: 600,
                          mb: 0.5,
                        }}
                      >
                        ✓ {startTime} - {endTime}
                      </Typography>

                      {/* Facilities */}
                      {room.facilities && room.facilities.length > 0 && (
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {facilitiesConfig.map((fac) => (
                            room.facilities?.includes(fac.id) && (
                              <Chip
                                key={fac.id}
                                size="small"
                                icon={<fac.icon sx={{ fontSize: '1rem !important' }} />}
                                label={fac.label}
                                variant="outlined"
                                sx={{ fontSize: '0.75rem', height: 24 }}
                              />
                            )
                          ))}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Alert severity="warning">No rooms available for the selected time slot and capacity</Alert>
              )}
            </Box>
          )}

          {/* Step 3: Confirmation */}
          {bookingStep === 2 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Alert severity="success">Booking submitted successfully!</Alert>

              <Card sx={{ p: 2, backgroundColor: '#f9f9f9' }}>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      Meeting Date:
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      {selectedDate && new Date(selectedDate).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      Time:
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      {startTime} - {endTime}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      Room:
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      {selectedRoom?.name}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      Participants:
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      {numberOfPeople}
                    </Typography>
                  </Box>
                </Stack>
              </Card>

              {/* Approval Workflow */}
              <Box sx={{ p: 1.5, backgroundColor: '#f0f7ff', borderRadius: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                  📋 Approval Status
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#ff9800' }} />
                  <Typography variant="caption">Pending Manager Approval</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#ccc' }} />
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Manager Approved
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#ccc' }} />
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    HR Approved
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1 }}>
          {bookingStep === 0 && (
            <>
              <Button onClick={handleCloseBooking} variant="outlined">
                Cancel
              </Button>
              <Button
                onClick={searchAvailableRooms}
                variant="contained"
                disabled={loading || !startTime || !endTime || !numberOfPeople || !meetingTitle}
              >
                {loading ? <CircularProgress size={20} /> : 'Find Rooms'}
              </Button>
            </>
          )}

          {bookingStep === 1 && (
            <>
              <Button
                onClick={() => setBookingStep(0)}
                variant="outlined"
              >
                Back
              </Button>
              <Button
                onClick={handleCreateBooking}
                variant="contained"
                disabled={!selectedRoom || loading}
              >
                {loading ? <CircularProgress size={20} /> : 'Confirm Booking'}
              </Button>
            </>
          )}

          {bookingStep === 2 && (
            <Button onClick={handleCloseBooking} variant="contained" fullWidth>
              Done
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
