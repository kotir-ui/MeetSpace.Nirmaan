import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Stack,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Typography,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  FormControlLabel,
  FormGroup,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

const BookMeetingRoom = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [rooms, setRooms] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [availabilityChecking, setAvailabilityChecking] = useState(false);
  const [availability, setAvailability] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    purpose: '',
    meetingDate: location.state?.date || new Date().toISOString().split('T')[0],
    startTime: location.state?.startTime || '09:00:00',
    endTime: '10:00:00',
    roomId: location.state?.roomId || '',
    departmentId: '',
    meetingType: 'internal_meeting',
    participantsCount: 1,
    externalParticipantsCount: 0,
    isExternalMeeting: false,
    requiredFacilities: [],
    additionalNotes: '',
    participants: [],
  });

  const meetingTypes = [
    'internal_meeting',
    'client_meeting',
    'team_meeting',
    'board_meeting',
    'training',
    'presentation',
    'interview',
    'other',
  ];

  const facilities = [
    'projector',
    'tv',
    'video_conference',
    'whiteboard',
    'conference_phone',
    'speaker_phone',
    'air_conditioning',
    'hdmi_ports',
    'usb_charging',
  ];

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [roomsRes, depsRes, usersRes] = await Promise.all([
        axios.get('/api/booking/rooms'),
        axios.get('/api/departments'),
        axios.get('/api/users'),
      ]);

      setRooms(roomsRes.data.data);
      setDepartments(depsRes.data.data || []);
      setUsers(usersRes.data.data || []);
    } catch (err) {
      setError('Failed to load form data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const checkAvailability = async () => {
    if (!formData.roomId || !formData.meetingDate || !formData.startTime || !formData.endTime) {
      setError('Please select room, date, and time');
      return;
    }

    try {
      setAvailabilityChecking(true);
      const res = await axios.get('/api/booking/bookings/availability', {
        params: {
          roomId: formData.roomId,
          date: formData.meetingDate,
          startTime: formData.startTime,
          endTime: formData.endTime,
        },
      });

      setAvailability(res.data.data);
      setError(null);
    } catch (err) {
      setError('Failed to check availability');
    } finally {
      setAvailabilityChecking(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFacilityToggle = (facility) => {
    setFormData({
      ...formData,
      requiredFacilities: formData.requiredFacilities.includes(facility)
        ? formData.requiredFacilities.filter((f) => f !== facility)
        : [...formData.requiredFacilities, facility],
    });
  };

  const handleParticipantToggle = (userId) => {
    setFormData({
      ...formData,
      participants: formData.participants.includes(userId)
        ? formData.participants.filter((id) => id !== userId)
        : [...formData.participants, userId],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title) {
      setError('Meeting title is required');
      return;
    }

    if (!formData.roomId) {
      setError('Room selection is required');
      return;
    }

    if (availability && !availability.available) {
      setError('Selected time slot is not available');
      return;
    }

    try {
      setSubmitting(true);
      await axios.post('/api/booking/bookings', {
        title: formData.title,
        purpose: formData.purpose,
        meetingDate: formData.meetingDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        roomId: parseInt(formData.roomId),
        departmentId: formData.departmentId ? parseInt(formData.departmentId) : null,
        meetingType: formData.meetingType,
        participantsCount: parseInt(formData.participantsCount),
        externalParticipantsCount: parseInt(formData.externalParticipantsCount) || 0,
        isExternalMeeting: formData.isExternalMeeting,
        requiredFacilities: formData.requiredFacilities,
        additionalNotes: formData.additionalNotes,
        participants: formData.participants.map((id) => ({ id: parseInt(id), isRequired: true })),
      });

      setSuccess('Booking created successfully! Your request has been submitted for approval.');
      setTimeout(() => {
        navigate('/booking/my-bookings');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Book Meeting Room
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
            Submit a meeting room booking request
          </Typography>
        </Box>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} icon={<CheckCircleIcon />}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            {/* Basic Information */}
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Meeting Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Meeting Title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g., Q4 Planning Session"
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Purpose"
                    name="purpose"
                    value={formData.purpose}
                    onChange={handleChange}
                    multiline
                    rows={3}
                    placeholder="Describe the purpose of this meeting..."
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Meeting Type</InputLabel>
                    <Select
                      name="meetingType"
                      value={formData.meetingType}
                      onChange={handleChange}
                      label="Meeting Type"
                    >
                      {meetingTypes.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type.replace(/_/g, ' ').toUpperCase()}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Department</InputLabel>
                    <Select
                      name="departmentId"
                      value={formData.departmentId}
                      onChange={handleChange}
                      label="Department"
                    >
                      <MenuItem value="">Select Department</MenuItem>
                      {departments.map((dept) => (
                        <MenuItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>

            {/* Date & Time */}
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Schedule
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Meeting Date"
                    name="meetingDate"
                    type="date"
                    value={formData.meetingDate}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="Start Time"
                    name="startTime"
                    type="time"
                    value={formData.startTime.substring(0, 5)}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value + ':00' })}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="End Time"
                    name="endTime"
                    type="time"
                    value={formData.endTime.substring(0, 5)}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value + ':00' })}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Room Selection */}
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Select Room
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Meeting Room</InputLabel>
                    <Select
                      name="roomId"
                      value={formData.roomId}
                      onChange={handleChange}
                      label="Meeting Room"
                      required
                    >
                      <MenuItem value="">Select a Room</MenuItem>
                      {rooms.map((room) => (
                        <MenuItem
                          key={room.id}
                          value={room.id}
                          disabled={room.room_status !== 'active'}
                        >
                          {room.name} - Cap {room.capacity} (Floor {room.floor})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={checkAvailability}
                    disabled={availabilityChecking}
                    size="large"
                  >
                    {availabilityChecking ? 'Checking...' : 'Check Availability'}
                  </Button>
                </Grid>
              </Grid>

              {availability !== null && (
                <Box sx={{ mt: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
                  {availability.available ? (
                    <>
                      <CheckCircleIcon sx={{ color: 'green' }} />
                      <Typography color="green" sx={{ fontWeight: 600 }}>
                        Room is available for the selected time
                      </Typography>
                    </>
                  ) : (
                    <>
                      <CancelIcon sx={{ color: 'red' }} />
                      <Typography color="red" sx={{ fontWeight: 600 }}>
                        Room is not available ({availability.conflicts} conflict(s))
                      </Typography>
                    </>
                  )}
                </Box>
              )}
            </Box>

            {/* Participants */}
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Participants
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Number of Participants"
                    name="participantsCount"
                    type="number"
                    value={formData.participantsCount}
                    onChange={handleChange}
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.isExternalMeeting}
                        onChange={(e) =>
                          setFormData({ ...formData, isExternalMeeting: e.target.checked })
                        }
                      />
                    }
                    label="External Meeting"
                  />
                </Grid>
                {formData.isExternalMeeting && (
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="External Participants"
                      name="externalParticipantsCount"
                      type="number"
                      value={formData.externalParticipantsCount}
                      onChange={handleChange}
                      inputProps={{ min: 0 }}
                    />
                  </Grid>
                )}
              </Grid>

              {users.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Add Participants
                  </Typography>
                  <FormGroup row>
                    {users.slice(0, 5).map((user) => (
                      <FormControlLabel
                        key={user.id}
                        control={
                          <Checkbox
                            checked={formData.participants.includes(user.id)}
                            onChange={() => handleParticipantToggle(user.id)}
                          />
                        }
                        label={user.name}
                      />
                    ))}
                  </FormGroup>
                </Box>
              )}
            </Box>

            {/* Facilities */}
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Required Facilities
              </Typography>
              <FormGroup row>
                {facilities.map((facility) => (
                  <FormControlLabel
                    key={facility}
                    control={
                      <Checkbox
                        checked={formData.requiredFacilities.includes(facility)}
                        onChange={() => handleFacilityToggle(facility)}
                      />
                    }
                    label={facility.replace(/_/g, ' ').toUpperCase()}
                  />
                ))}
              </FormGroup>
            </Box>

            {/* Additional Notes */}
            <Box>
              <TextField
                fullWidth
                label="Additional Notes"
                name="additionalNotes"
                value={formData.additionalNotes}
                onChange={handleChange}
                multiline
                rows={2}
                placeholder="Any special requirements or notes..."
              />
            </Box>

            {/* Actions */}
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button onClick={() => navigate(-1)} variant="outlined">
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Booking Request'}
              </Button>
            </Stack>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
};

export default BookMeetingRoom;
