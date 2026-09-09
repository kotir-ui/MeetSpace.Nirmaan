import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Snackbar,
  Stack,
  Tooltip,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  CorporateFare as DeptIcon,
  Person as PersonIcon,
  MeetingRoom as RoomIcon,
  Refresh as RefreshIcon,
  SwapHoriz as SwapIcon,
  InfoOutlined as InfoIcon,
} from '@mui/icons-material';
import * as bookingApi from '../../api/booking.js';

export default function AdminApprovalsManagement() {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionDialog, setActionDialog] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [actionType, setActionType] = useState('approve'); // 'approve' or 'reject'
  const [comments, setComments] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [alternateRooms, setAlternateRooms] = useState([]);
  const [loadingAlternates, setLoadingAlternates] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'approved', 'rejected'

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const res = await bookingApi.getPendingApprovals();
      setApprovals(res.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch approvals:', err);
      setSnackbar({ open: true, message: 'Failed to load pending approvals', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const hasConflict = (app) => {
    if (app.status !== 'pending') return false;
    const b1 = app.booking || {};
    if (!b1.meeting_room_id || !b1.meeting_date) return false;

    return approvals.some((other) => {
      if (other.id === app.id || other.status !== 'pending') return false;
      const b2 = other.booking || {};
      if (b2.meeting_room_id !== b1.meeting_room_id) return false;
      if (b2.meeting_date !== b1.meeting_date) return false;
      
      return b1.start_time < b2.end_time && b1.end_time > b2.start_time;
    });
  };

  const handleOpenAction = async (approval, type) => {
    setSelectedApproval(approval);
    setActionType(type);
    setComments('');
    const origRoomId = approval.booking?.meeting_room_id || '';
    setSelectedRoomId(origRoomId);
    setActionDialog(true);
    setAlternateRooms([]);

    if (type === 'approve' && approval.booking?.meeting_date && approval.booking?.start_time && approval.booking?.end_time) {
      try {
        setLoadingAlternates(true);
        const res = await bookingApi.getAvailableAlternates({
          date: approval.booking.meeting_date,
          startTime: approval.booking.start_time,
          endTime: approval.booking.end_time,
        });
        setAlternateRooms(res.data?.data || []);
      } catch (err) {
        console.warn('Failed to load alternate rooms:', err);
        setAlternateRooms([]);
      } finally {
        setLoadingAlternates(false);
      }
    }
  };

  const handleSubmitAction = async () => {
    if (!selectedApproval) return;
    try {
      setSubmitting(true);
      if (actionType === 'approve') {
        const isReallocated = selectedRoomId && selectedRoomId !== selectedApproval.booking?.meeting_room_id;
        await bookingApi.approveBooking(selectedApproval.id, {
          comments,
          alternateRoomId: isReallocated ? selectedRoomId : undefined,
        });
        setSnackbar({
          open: true,
          message: isReallocated
            ? 'Booking approved with alternate room allocated! Confirmation sent to User & Manager.'
            : 'Booking approved successfully! Email sent to User & Manager.',
          severity: 'success',
        });
      } else {
        await bookingApi.rejectBooking(selectedApproval.id, { comments });
        setSnackbar({ open: true, message: 'Booking rejected. Notification sent to User & Manager.', severity: 'info' });
      }
      setActionDialog(false);
      setSelectedApproval(null);
      fetchApprovals();
    } catch (err) {
      console.error('Error submitting approval action:', err);
      setSnackbar({ open: true, message: err.response?.data?.error || err.response?.data?.message || 'Action failed', severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredApprovals = approvals.filter((app) => {
    if (filter === 'all') return true;
    return app.status === filter;
  });

  const getStatusChip = (status) => {
    switch (status) {
      case 'approved':
      case 'confirmed':
        return <Chip label="Approved" size="small" color="success" sx={{ fontWeight: 600 }} />;
      case 'rejected':
        return <Chip label="Rejected" size="small" color="error" sx={{ fontWeight: 600 }} />;
      case 'pending':
      default:
        return <Chip label="Pending Action" size="small" color="warning" sx={{ fontWeight: 600 }} />;
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header bar with filters and refresh */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            size="small"
            variant={filter === 'all' ? 'contained' : 'outlined'}
            onClick={() => setFilter('all')}
            sx={{ borderRadius: 2 }}
          >
            All Requests ({approvals.length})
          </Button>
          <Button
            size="small"
            variant={filter === 'pending' ? 'contained' : 'outlined'}
            color="warning"
            onClick={() => setFilter('pending')}
            sx={{ borderRadius: 2 }}
          >
            Pending ({approvals.filter(a => a.status === 'pending').length})
          </Button>
        </Box>

        <Button
          size="small"
          startIcon={<RefreshIcon />}
          onClick={fetchApprovals}
          disabled={loading}
          variant="outlined"
        >
          Refresh
        </Button>
      </Box>

      {/* Main Table */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <TableContainer component={Paper} elevation={0}>
          <Table sx={{ minWidth: 700 }} size="medium">
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.85rem' }}>Booking Details</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.85rem' }}>Room & Time</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.85rem' }}>Requester</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.85rem' }}>Approval Stage</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.85rem' }} align="center">Actions & Allocation</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} />
                    <Typography variant="body2" sx={{ mt: 1.5, color: 'text.secondary' }}>Loading pending approvals...</Typography>
                  </TableCell>
                </TableRow>
              ) : filteredApprovals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>No Pending Approvals</Typography>
                    <Typography variant="body2" color="text.secondary">All room booking requests have been reviewed and processed.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredApprovals.map((app) => {
                  const b = app.booking || {};
                  const organizer = b.organizer || {};
                  const dept = b.department || {};
                  const conflict = hasConflict(app);

                  return (
                    <TableRow key={app.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                          {b.booking_number || `BK-#${app.id}`}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                          {b.title || 'Meeting Session'}
                        </Typography>
                        {b.purpose && (
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                            Purpose: {b.purpose}
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3 }}>
                          <RoomIcon fontSize="small" sx={{ color: 'primary.main', fontSize: 16 }} />
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {b.room?.name || 'Meeting Room'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <ScheduleIcon fontSize="small" sx={{ color: 'text.secondary', fontSize: 16 }} />
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {b.meeting_date} ({b.start_time} - {b.end_time})
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3 }}>
                          <PersonIcon fontSize="small" sx={{ color: 'text.secondary', fontSize: 16 }} />
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {organizer.name || 'User'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <DeptIcon fontSize="small" sx={{ color: 'text.secondary', fontSize: 16 }} />
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {dept.name || 'General Dept'}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Stack spacing={0.5} alignItems="flex-start">
                          {getStatusChip(app.status)}
                          {conflict && (
                            <Chip
                              label="⚠️ Slot Contested (Same Time)"
                              size="small"
                              color="error"
                              variant="outlined"
                              sx={{ fontWeight: 700, fontSize: '0.68rem', height: 20 }}
                            />
                          )}
                          <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'capitalize' }}>
                            Type: {app.approver_type === 'department_head' ? 'Manager Review' : 'Admin / HR Final'}
                          </Typography>
                        </Stack>
                      </TableCell>

                      <TableCell align="center">
                        {app.status === 'pending' ? (
                          <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
                            <Button
                              variant="contained"
                              color={conflict ? 'warning' : 'success'}
                              size="small"
                              startIcon={conflict ? <SwapIcon /> : <CheckCircleIcon />}
                              onClick={() => handleOpenAction(app, 'approve')}
                              sx={{ textTransform: 'none', fontWeight: 600, px: 1.5 }}
                            >
                              {conflict ? 'Allocate & Approve' : 'Approve'}
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              startIcon={<CancelIcon />}
                              onClick={() => handleOpenAction(app, 'reject')}
                              sx={{ textTransform: 'none', fontWeight: 600, px: 1.5 }}
                            >
                              Reject
                            </Button>
                          </Stack>
                        ) : (
                          <Chip label={app.status} size="small" variant="outlined" />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Action Dialog (Approve with Alternate Room Selection & Rejection) */}
      <Dialog open={actionDialog} onClose={() => setActionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: actionType === 'approve' ? 'primary.main' : 'error.main' }}>
          {actionType === 'approve' ? 'Approve & Allocate Room' : 'Reject Room Booking'}
        </DialogTitle>
        <DialogContent sx={{ pt: 1.5 }}>
          {selectedApproval && (
            <Box sx={{ p: 2, mb: 2, bgcolor: 'background.default', borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {selectedApproval.booking?.booking_number} - {selectedApproval.booking?.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Requested by <strong>{selectedApproval.booking?.organizer?.name}</strong> on <strong>{selectedApproval.booking?.meeting_date} ({selectedApproval.booking?.start_time} - {selectedApproval.booking?.end_time})</strong>
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                Originally Requested Room: <strong>{selectedApproval.booking?.room?.name || 'Room'}</strong>
              </Typography>
            </Box>
          )}

          {actionType === 'approve' && (
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <RoomIcon fontSize="small" color="primary" /> Allocate Room:
              </Typography>

              {loadingAlternates ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
                  <CircularProgress size={20} />
                  <Typography variant="caption" color="text.secondary">Checking room availability for this slot...</Typography>
                </Box>
              ) : (
                <FormControl fullWidth size="small">
                  <InputLabel id="alternate-room-select-label">Select Room for Session *</InputLabel>
                  <Select
                    labelId="alternate-room-select-label"
                    value={selectedRoomId}
                    onChange={(e) => setSelectedRoomId(e.target.value)}
                    label="Select Room for Session *"
                  >
                    {/* Originally requested room */}
                    {selectedApproval?.booking?.room && (
                      <MenuItem value={selectedApproval.booking.meeting_room_id}>
                        📌 Original: {selectedApproval.booking.room.name} (Cap: {selectedApproval.booking.room.capacity || 'N/A'})
                      </MenuItem>
                    )}

                    {/* Available alternate rooms */}
                    {alternateRooms
                      .filter((r) => r.id !== selectedApproval?.booking?.meeting_room_id)
                      .map((room) => (
                        <MenuItem key={room.id} value={room.id}>
                          ✨ Alternate: {room.name} (Cap: {room.capacity || 'N/A'} | {room.location || `Floor ${room.floor}`})
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              )}

              {selectedRoomId && selectedRoomId !== selectedApproval?.booking?.meeting_room_id && (
                <Alert severity="info" sx={{ mt: 1.5, py: 0.5, fontSize: '0.8rem' }}>
                  The booking will be reallocated to this alternate room, and confirmation will be sent to the user and manager.
                </Alert>
              )}
            </Box>
          )}

          <TextField
            label={actionType === 'approve' ? 'Approval / Allocation Comments (optional)' : 'Rejection Reason *'}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            fullWidth
            multiline
            rows={3}
            required={actionType === 'reject'}
            placeholder={actionType === 'approve' ? 'e.g., Allocated to alternate room due to high demand.' : 'e.g., Schedule conflict or maintenance scheduled.'}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setActionDialog(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={actionType === 'approve' ? 'success' : 'error'}
            onClick={handleSubmitAction}
            disabled={submitting || (actionType === 'reject' && !comments.trim())}
          >
            {submitting ? 'Processing...' : actionType === 'approve' ? 'Confirm & Allocate' : 'Confirm Rejection'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar alerts */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
