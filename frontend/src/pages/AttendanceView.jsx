import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import PageHeader from '../components/PageHeader.jsx';

export default function AttendanceView() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch from attendance API endpoint (standalone module or proxy)
    const attendanceApiUrl = import.meta.env.VITE_ATTENDANCE_API_URL || 'http://localhost:5001';
    fetch(`${attendanceApiUrl}/api/attendance`)
      .then((res) => {
        if (!res.ok) throw new Error('Could not connect to Attendance module API');
        return res.json();
      })
      .then((data) => {
        setRecords(data.records || []);
      })
      .catch((err) => {
        // Fallback demo data if attendance service is offline
        setError(err.message);
        setRecords([
          { id: 1, employee: 'Rajesh Kumar', checkIn: '09:05 AM', checkOut: '06:10 PM', status: 'Present' },
          { id: 2, employee: 'Priya Sharma', checkIn: '09:15 AM', checkOut: '06:00 PM', status: 'Present' },
          { id: 3, employee: 'Amit Patel', checkIn: '—', checkOut: '—', status: 'Absent' },
          { id: 4, employee: 'Sunita Verma', checkIn: '09:30 AM', checkOut: '—', status: 'On Leave' },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  const presentCount = records.filter((r) => r.status === 'Present').length;
  const attendanceRate = records.length ? Math.round((presentCount / records.length) * 100) : 0;

  return (
    <Box>
      <PageHeader title="Attendance" subtitle="Daily team attendance and presence tracking" />

      {error && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Operating in standalone attendance mode ({error})
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Present Today
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: 'success.main' }}>
                {presentCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Total Records
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 1 }}>
                {records.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Attendance Rate
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: 'primary.main' }}>
                {attendanceRate}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <Table>
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Employee</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Check In</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Check Out</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            ) : (
              records.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{row.employee}</TableCell>
                  <TableCell>{row.checkIn || '—'}</TableCell>
                  <TableCell>{row.checkOut || '—'}</TableCell>
                  <TableCell>
                    <Chip
                      label={row.status}
                      size="small"
                      color={
                        row.status === 'Present'
                          ? 'success'
                          : row.status === 'Absent'
                          ? 'error'
                          : 'warning'
                      }
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
