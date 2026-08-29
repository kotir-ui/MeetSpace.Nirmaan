import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Stack,
  CircularProgress,
  Typography,
  Alert,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import axios from 'axios';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

const ApprovalDashboard = () => {
  const [tab, setTab] = useState(0);
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionDialog, setActionDialog] = useState(null);
  const [comments, setComments] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/booking/approvals/pending');
      setApprovals(res.data.data || []);
    } catch (err) {
      setError('Failed to load approval requests');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setProcessing(true);
      await axios.post(`/api/booking/approvals/${actionDialog.id}/approve`, {
        comments,
      });
      setActionDialog(null);
      setComments('');
      fetchApprovals();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to approve');
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    try {
      setProcessing(true);
      await axios.post(`/api/booking/approvals/${actionDialog.id}/reject`, {
        comments,
      });
      setActionDialog(null);
      setComments('');
      fetchApprovals();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reject');
      setProcessing(false);
    }
  };

  const pendingApprovals = approvals.filter((a) => a.status === 'pending');
  const approvedApprovals = approvals.filter((a) => a.status === 'approved');
  const rejectedApprovals = approvals.filter((a) => a.status === 'rejected');

  const renderTable = (data, showActions = true) => {
    if (data.length === 0) {
      return (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="textSecondary">
            {tab === 0 ? 'No pending approvals' : tab === 1 ? 'No approved requests' : 'No rejected requests'}
          </Typography>
        </Paper>
      );
    }

    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell sx={{ fontWeight: 700 }}>Requester</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Meeting</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Date & Time</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Room</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              {showActions && <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((approval) => (
              <TableRow key={approval.id} hover>
                <TableCell>{approval.booking?.organizer?.name}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{approval.booking?.title}</TableCell>
                <TableCell>
                  {new Date(approval.booking?.meeting_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })} {approval.booking?.start_time}
                </TableCell>
                <TableCell>{approval.booking?.room?.name}</TableCell>
                <TableCell>{approval.approver_type.replace(/_/g, ' ').toUpperCase()}</TableCell>
                <TableCell>
                  <Chip
                    label={approval.status.toUpperCase()}
                    color={
                      approval.status === 'approved'
                        ? 'success'
                        : approval.status === 'rejected'
                        ? 'error'
                        : 'warning'
                    }
                    size="small"
                  />
                </TableCell>
                {showActions && (
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => setActionDialog({ id: approval.id, action: 'approve' })}
                      >
                        Approve
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        color="error"
                        startIcon={<CancelIcon />}
                        onClick={() => setActionDialog({ id: approval.id, action: 'reject' })}
                      >
                        Reject
                      </Button>
                    </Stack>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Approval Dashboard
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
          Review and approve meeting room booking requests
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 2, mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Stack direction="row" spacing={2} sx={{ my: 3 }}>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 600 }}>
            Pending Approvals
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, color: '#f57c00' }}>
            {pendingApprovals.length}
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 600 }}>
            Approved
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, color: '#2e7d32' }}>
            {approvedApprovals.length}
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 600 }}>
            Rejected
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, color: '#d32f2f' }}>
            {rejectedApprovals.length}
          </Typography>
        </Paper>
      </Stack>

      {/* Tabs */}
      <Box>
        <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)}>
          <Tab label="Pending Approvals" value={0} />
          <Tab label="Approved" value={1} />
          <Tab label="Rejected" value={2} />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Box sx={{ mt: 2 }}>
        {tab === 0 && renderTable(pendingApprovals, true)}
        {tab === 1 && renderTable(approvedApprovals, false)}
        {tab === 2 && renderTable(rejectedApprovals, false)}
      </Box>

      {/* Action Dialog */}
      <Dialog open={!!actionDialog} onClose={() => setActionDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {actionDialog?.action === 'approve' ? 'Approve Request' : 'Reject Request'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              multiline
              rows={4}
              placeholder="Add comments for the requester..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialog(null)}>Cancel</Button>
          {actionDialog?.action === 'approve' ? (
            <Button
              onClick={handleApprove}
              variant="contained"
              color="success"
              disabled={processing}
            >
              {processing ? 'Approving...' : 'Approve'}
            </Button>
          ) : (
            <Button
              onClick={handleReject}
              variant="contained"
              color="error"
              disabled={processing}
            >
              {processing ? 'Rejecting...' : 'Reject'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApprovalDashboard;
