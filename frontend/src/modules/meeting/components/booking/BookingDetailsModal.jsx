import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Alert,
  CircularProgress,
} from '@mui/material';
import axios from 'axios';

const BookingDetailsModal = ({ open, booking, onClose, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  if (!booking) return null;

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;

    try {
      setCancelling(true);
      await axios.delete(`/api/booking/bookings/${booking.id}`, {
        data: { reason: 'User cancelled' },
      });
      setCancelling(false);
      onUpdate?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cancel booking');
      setCancelling(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending_department_head':
      case 'pending_hr':
        return 'warning';
      case 'cancelled':
        return 'default';
      default:
        return 'info';
    }
  };

  const getStatusLabel = (status) => {
    return status.replace(/_/g, ' ').toUpperCase();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, fontSize: 20 }}>
        Meeting Details
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Stack spacing={2} sx={{ mt: 1 }}>
          {/* Title */}
          <Box>
            <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>
              MEETING TITLE
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5 }}>
              {booking.title}
            </Typography>
          </Box>

          {/* Status */}
          <Box>
            <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>
              STATUS
            </Typography>
            <Box sx={{ mt: 0.5 }}>
              <Chip
                label={getStatusLabel(booking.status)}
                color={getStatusColor(booking.status)}
              />
            </Box>
          </Box>

          {/* Details Table */}
          <TableContainer>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, width: '40%' }}>Date</TableCell>
                  <TableCell>
                    {new Date(booking.meeting_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Time</TableCell>
                  <TableCell>
                    {booking.start_time} - {booking.end_time}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Room</TableCell>
                  <TableCell>
                    {booking.room?.name} (Floor {booking.room?.floor})
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Capacity</TableCell>
                  <TableCell>{booking.room?.capacity} people</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Organizer</TableCell>
                  <TableCell>{booking.organizer?.name}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                  <TableCell>{booking.department?.name || 'N/A'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Meeting Type</TableCell>
                  <TableCell>{booking.meeting_type?.replace(/_/g, ' ')}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Participants</TableCell>
                  <TableCell>
                    {booking.participants_count}
                    {booking.is_external_meeting && ` (+${booking.external_participants_count} external)`}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          {/* Purpose */}
          {booking.purpose && (
            <Box>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>
                PURPOSE
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {booking.purpose}
              </Typography>
            </Box>
          )}

          {/* Facilities */}
          {booking.required_facilities && booking.required_facilities.length > 0 && (
            <Box>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>
                REQUIRED FACILITIES
              </Typography>
              <Box sx={{ mt: 0.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {booking.required_facilities.map((facility) => (
                  <Chip
                    key={facility}
                    label={facility.replace(/_/g, ' ')}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Additional Notes */}
          {booking.additional_notes && (
            <Box>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>
                ADDITIONAL NOTES
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {booking.additional_notes}
              </Typography>
            </Box>
          )}

          {/* Participants */}
          {booking.participants && booking.participants.length > 0 && (
            <Box>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>
                PARTICIPANTS ({booking.participants.length})
              </Typography>
              <Box sx={{ mt: 0.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {booking.participants.map((p) => (
                  <Chip
                    key={p.id}
                    label={p.participant?.name}
                    size="small"
                    variant={p.is_required ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Close</Button>
        {['pending_department_head', 'pending_hr'].includes(booking.status) && (
          <Button
            onClick={handleCancel}
            color="error"
            disabled={cancelling || loading}
            startIcon={cancelling ? <CircularProgress size={20} /> : undefined}
          >
            {cancelling ? 'Cancelling...' : 'Cancel Booking'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default BookingDetailsModal;
