import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Stepper,
  Step,
  StepLabel,
  Button,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  CircularProgress,
  Chip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
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
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Videocam as VideocamIcon,
  Tv as TvIcon,
  Draw as DrawIcon,
  VideoCall as VideocallIcon,
} from '@mui/icons-material';
import * as bookingApi from '../../api/booking.js';

const TimeSlots = [
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '01:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '05:00 PM',
];

export default function BookingInterface({ onBookingComplete }) {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedStartTime, setSelectedStartTime] = useState(null);
  const [selectedEndTime, setSelectedEndTime] = useState(null);
  const [numberOfPeople, setNumberOfPeople] = useState('');
  const [building, setBuilding] = useState('');
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingPurpose, setMeetingPurpose] = useState('');
  const [participantNames, setParticipantNames] = useState('');
  const [requiredFacilities, setRequiredFacilities] = useState([]);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, [selectedDate]);

  const fetchRooms = async () => {
    try {
      setAvailabilityLoading(true);
      const response = await bookingApi.getRooms({
        date: selectedDate,
      });
      setRooms(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setSnackbar({ open: true, message: 'Failed to load rooms', severity: 'error' });
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const checkRoomAvailability = async (roomId, startTime, endTime) => {
    try {
      const response = await bookingApi.checkAvailability({
        room_id: roomId,
        date: selectedDate,
        start_time: startTime,
        end_time: endTime,
      });
      return response.data?.available || false;
    } catch (error) {
      console.error('Error checking availability:', error);
      return false;
    }
  };

  const getRoomStatus = (room) => {
    // Placeholder - in real implementation, check against bookings
    return 'available';
  };

  const getStatusIcon = (status) => {
    if (status === 'available') return <CheckCircleIcon sx={{ color: '#4caf50' }} />;
    if (status === 'booked') return <CancelIcon sx={{ color: '#f44336' }} />;
    return <ScheduleIcon sx={{ color: '#ff9800' }} />;
  };

  const facilities = [
    { id: 'projector', label: 'Projector', icon: TvIcon },
    { id: 'tv', label: 'TV', icon: TvIcon },
    { id: 'whiteboard', label: 'Whiteboard', icon: DrawIcon },
    { id: 'video_conference', label: 'Video Conference', icon: VideocallIcon },
  ];

  const handleFacilityToggle = (facilityId) => {
    setRequiredFacilities((prev) =>
      prev.includes(facilityId) ? prev.filter((f) => f !== facilityId) : [...prev, facilityId]
    );
  };

  const handleNext = () => {
    if (activeStep === 0 && !selectedDate) {
      setSnackbar({ open: true, message: 'Please select a date', severity: 'error' });
      return;
    }
    if (activeStep === 1 && !selectedRoom) {
      setSnackbar({ open: true, message: 'Please select a room', severity: 'error' });
      return;
    }
    if (activeStep === 2 && (!selectedStartTime || !selectedEndTime)) {
      setSnackbar({ open: true, message: 'Please select time slots', severity: 'error' });
      return;
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmitBooking = async () => {
    if (!meetingTitle.trim()) {
      setSnackbar({ open: true, message: 'Please enter meeting title', severity: 'error' });
      return;
    }

    try {
      setLoading(true);
      const bookingData = {
        title: meetingTitle,
        purpose: meetingPurpose,
        meetingDate: selectedDate,
        startTime: selectedStartTime,
        endTime: selectedEndTime,
        roomId: selectedRoom,
        participantsCount: parseInt(numberOfPeople) || 1,
        requiredFacilities: requiredFacilities,
        additionalNotes: additionalNotes,
        meetingType: 'internal_meeting',
      };

      const response = await bookingApi.createBooking(bookingData);
      setSnackbar({
        open: true,
        message: 'Booking request submitted successfully!',
        severity: 'success',
      });
      setTimeout(() => {
        onBookingComplete();
      }, 2000);
    } catch (error) {
      console.error('Error creating booking:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || error.response?.data?.error || 'Failed to submit booking',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const getUniqueBuildingsAndFloors = () => {
    const unique = {};
    rooms.forEach((room) => {
      if (!unique[room.floor]) {
        unique[room.floor] = [];
      }
      if (!unique[room.floor].includes(room.building)) {
        unique[room.floor].push(room.building);
      }
    });
    return unique;
  };

  const groupedRooms = {};
  rooms.forEach((room) => {
    const floor = room.floor || 'Unknown Floor';
    if (!groupedRooms[floor]) {
      groupedRooms[floor] = [];
    }
    groupedRooms[floor].push(room);
  });

  return (
    <Box sx={{ py: 3 }}>
      <Container maxWidth="lg">
        {/* Stepper */}
        <Stepper
          activeStep={activeStep}
          sx={{
            mb: 4,
            '& .MuiStepLabel-label': { fontSize: '0.95rem', fontWeight: 500 },
          }}
        >
          <Step>
            <StepLabel>Select Date & Filters</StepLabel>
          </Step>
          <Step>
            <StepLabel>Choose Room</StepLabel>
          </Step>
          <Step>
            <StepLabel>Select Time</StepLabel>
          </Step>
          <Step>
            <StepLabel>Meeting Details</StepLabel>
          </Step>
        </Stepper>

        {/* Step Content */}
        <Box sx={{ minHeight: '600px' }}>
          {activeStep === 0 && (
            <Paper sx={{ p: 4, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Select Date & Filters
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ min: new Date().toISOString().split('T')[0] }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Number of People"
                    type="number"
                    value={numberOfPeople}
                    onChange={(e) => setNumberOfPeople(e.target.value)}
                    fullWidth
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Building/Floor"
                    value={building}
                    onChange={(e) => setBuilding(e.target.value)}
                    fullWidth
                    placeholder="Optional"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Search"
                    fullWidth
                    placeholder="Search rooms..."
                  />
                </Grid>
              </Grid>
            </Paper>
          )}

          {activeStep === 1 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Select Meeting Room (Movie Ticket Style)
              </Typography>
              {availabilityLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box>
                  {Object.entries(groupedRooms).map(([floor, floorRooms]) => (
                    <Box key={floor} sx={{ mb: 4 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          mb: 2,
                          p: 2,
                          backgroundColor: '#f0f0f0',
                          borderRadius: 1,
                          fontWeight: 600,
                        }}
                      >
                        {floor}
                      </Typography>
                      <Grid container spacing={2}>
                        {floorRooms.map((room) => (
                          <Grid item xs={12} sm={6} md={4} lg={3} key={room.id}>
                            <Card
                              onClick={() => setSelectedRoom(room.id)}
                              sx={{
                                cursor: 'pointer',
                                border:
                                  selectedRoom === room.id ? '3px solid #2196f3' : '2px solid #e0e0e0',
                                borderRadius: 2,
                                transition: 'all 0.3s ease',
                                backgroundColor:
                                  selectedRoom === room.id ? '#e3f2fd' : 'white',
                                transform: selectedRoom === room.id ? 'scale(1.02)' : 'scale(1)',
                                '&:hover': {
                                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                  transform: 'scale(1.02)',
                                },
                                opacity: getRoomStatus(room) === 'booked' ? 0.6 : 1,
                                pointerEvents: getRoomStatus(room) === 'booked' ? 'none' : 'auto',
                              }}
                            >
                              <CardContent>
                                <Box sx={{ textAlign: 'center', mb: 2 }}>
                                  {getStatusIcon(getRoomStatus(room))}
                                </Box>
                                <Typography
                                  variant="subtitle1"
                                  sx={{ fontWeight: 700, mb: 0.5 }}
                                >
                                  {room.name}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                                  Room #{room.room_number} | Floor {room.floor}
                                </Typography>

                                {/* Capacity */}
                                <Box sx={{ mb: 2 }}>
                                  <Chip
                                    label={`Capacity: ${room.capacity}`}
                                    size="small"
                                    variant="outlined"
                                    sx={{ mr: 1 }}
                                  />
                                </Box>

                                {/* Facilities */}
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                  {room.facilities?.map((facility) => (
                                    <Chip
                                      key={facility.id}
                                      label={facility.facility_type}
                                      size="small"
                                      variant="filled"
                                      sx={{
                                        fontSize: '0.7rem',
                                        height: 20,
                                        backgroundColor: '#e8f5e9',
                                      }}
                                    />
                                  ))}
                                </Box>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          )}

          {activeStep === 2 && (
            <Paper sx={{ p: 4, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Select Time Slot
              </Typography>
              <Box sx={{ mb: 4 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                  Start Time
                </Typography>
                <Grid container spacing={1}>
                  {TimeSlots.map((time) => (
                    <Grid item xs={6} sm={4} md={3} lg={2} key={`start-${time}`}>
                      <Button
                        fullWidth
                        variant={selectedStartTime === time ? 'contained' : 'outlined'}
                        onClick={() => setSelectedStartTime(time)}
                        sx={{
                          py: 1.5,
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          textTransform: 'none',
                        }}
                      >
                        {time}
                      </Button>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              <Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                  End Time
                </Typography>
                <Grid container spacing={1}>
                  {TimeSlots.map((time) => (
                    <Grid item xs={6} sm={4} md={3} lg={2} key={`end-${time}`}>
                      <Button
                        fullWidth
                        variant={selectedEndTime === time ? 'contained' : 'outlined'}
                        onClick={() => setSelectedEndTime(time)}
                        disabled={!selectedStartTime}
                        sx={{
                          py: 1.5,
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          textTransform: 'none',
                        }}
                      >
                        {time}
                      </Button>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Paper>
          )}

          {activeStep === 3 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Paper sx={{ p: 4, borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Meeting Details
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        label="Meeting Title *"
                        value={meetingTitle}
                        onChange={(e) => setMeetingTitle(e.target.value)}
                        fullWidth
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Meeting Purpose"
                        value={meetingPurpose}
                        onChange={(e) => setMeetingPurpose(e.target.value)}
                        fullWidth
                        multiline
                        rows={3}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Participant Names"
                        value={participantNames}
                        onChange={(e) => setParticipantNames(e.target.value)}
                        fullWidth
                        multiline
                        rows={3}
                        helperText="Enter one name per line"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                        Required Facilities
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {facilities.map((facility) => (
                          <Chip
                            key={facility.id}
                            label={facility.label}
                            onClick={() => handleFacilityToggle(facility.id)}
                            variant={
                              requiredFacilities.includes(facility.id) ? 'filled' : 'outlined'
                            }
                            color={
                              requiredFacilities.includes(facility.id) ? 'primary' : 'default'
                            }
                            sx={{ cursor: 'pointer' }}
                          />
                        ))}
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Additional Notes"
                        value={additionalNotes}
                        onChange={(e) => setAdditionalNotes(e.target.value)}
                        fullWidth
                        multiline
                        rows={3}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Booking Summary */}
              <Grid item xs={12} md={4}>
                <Card sx={{ borderRadius: 2, backgroundColor: '#f8f9fa', position: 'sticky', top: 20 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                      Booking Summary
                    </Typography>

                    <Box sx={{ mb: 2, pb: 2, borderBottom: '2px solid #e0e0e0' }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Room
                      </Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {rooms.find((r) => r.id === selectedRoom)?.name || 'N/A'}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2, pb: 2, borderBottom: '2px solid #e0e0e0' }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Date
                      </Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {new Date(selectedDate).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2, pb: 2, borderBottom: '2px solid #e0e0e0' }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Time
                      </Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {selectedStartTime} – {selectedEndTime}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2, pb: 2, borderBottom: '2px solid #e0e0e0' }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Capacity
                      </Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {numberOfPeople} People
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                        Facilities
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {requiredFacilities.length > 0 ? (
                          requiredFacilities.map((f) => (
                            <Chip
                              key={f}
                              label={f.replace(/_/g, ' ')}
                              size="small"
                              variant="filled"
                              sx={{ backgroundColor: '#e3f2fd', color: '#1976d2' }}
                            />
                          ))
                        ) : (
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            None
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      onClick={handleSubmitBooking}
                      disabled={loading}
                      sx={{ fontWeight: 600, py: 1.5 }}
                    >
                      {loading ? 'Submitting...' : 'Request Booking'}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </Box>

        {/* Navigation Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            size="large"
            sx={{ textTransform: 'none', fontSize: '1rem' }}
          >
            Back
          </Button>
          {activeStep < 3 && (
            <Button
              variant="contained"
              onClick={handleNext}
              size="large"
              sx={{ textTransform: 'none', fontSize: '1rem' }}
            >
              Next
            </Button>
          )}
        </Box>
      </Container>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
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
