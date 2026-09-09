import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Stack,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Tooltip,
  IconButton,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  MeetingRoom as MeetingRoomIcon,
  AccessTime as AccessTimeIcon,
  People as PeopleIcon,
  FileDownload as FileDownloadIcon,
  FilterList as FilterListIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  ShowChart as ShowChartIcon,
  DateRange as DateRangeIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import Chart from 'react-apexcharts';
import * as bookingApi from '../../api/booking.js';
import api from '../../../../api/client.js';

export default function RoomUtilizationReports() {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month'); // 'today', 'week', 'month', 'custom'
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedRoomFilter, setSelectedRoomFilter] = useState('all');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');

  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    fetchData();
  }, [dateFrom, dateTo]);

  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
    const today = new Date();
    const toStr = today.toISOString().split('T')[0];
    setDateTo(toStr);

    if (range === 'today') {
      setDateFrom(toStr);
    } else if (range === 'week') {
      const past = new Date();
      past.setDate(past.getDate() - 7);
      setDateFrom(past.toISOString().split('T')[0]);
    } else if (range === 'month') {
      const past = new Date();
      past.setDate(past.getDate() - 30);
      setDateFrom(past.toISOString().split('T')[0]);
    } else if (range === 'quarter') {
      const past = new Date();
      past.setDate(past.getDate() - 90);
      setDateFrom(past.toISOString().split('T')[0]);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bookingsRes, roomsRes, deptsRes] = await Promise.all([
        bookingApi.getBookings({ dateFrom, dateTo }).catch(() => ({ data: { data: [] } })),
        bookingApi.getRooms().catch(() => ({ data: { data: [] } })),
        api.get('/departments').catch(() => ({ data: { data: [] } })),
      ]);

      setBookings(bookingsRes.data?.data || []);
      setRooms(roomsRes.data?.data || []);
      setDepartments(deptsRes.data?.data || (Array.isArray(deptsRes.data) ? deptsRes.data : []));
    } catch (err) {
      console.error('Failed to load reports data:', err);
    } finally {
      setLoading(false);
    }
  };

  const parseTimeToMinutes = (val) => {
    if (!val) return 0;
    const str = String(val).trim();
    const match = str.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?/i);
    if (match) {
      let h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const ampm = match[3]?.toUpperCase();
      if (ampm === 'PM' && h < 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;
      return h * 60 + m;
    }
    const parts = str.split(':');
    return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
  };

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (['cancelled', 'rejected'].includes(b.status)) return false;
      const rId = b.meeting_room_id || b.room_id || b.room?.id;
      if (selectedRoomFilter !== 'all' && String(rId) !== String(selectedRoomFilter)) return false;
      if (selectedDeptFilter !== 'all') {
        const bDept = b.department?.name || b.department_name || b.department;
        if (bDept !== selectedDeptFilter) return false;
      }
      return true;
    });
  }, [bookings, selectedRoomFilter, selectedDeptFilter]);

  // Total Business Days in selected period
  const totalDays = useMemo(() => {
    const start = new Date(dateFrom);
    const end = new Date(dateTo);
    const diffTime = Math.abs(end - start);
    return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
  }, [dateFrom, dateTo]);

  const workingHoursPerDay = 9; // 9 AM to 6 PM = 9 hours
  const totalAvailableHoursPerRoom = totalDays * workingHoursPerDay;

  // Compute Per-Room Analytics
  const roomStats = useMemo(() => {
    return rooms.map((room) => {
      const roomBookings = filteredBookings.filter((b) => {
        const bRoomId = b.meeting_room_id || b.room_id || b.room?.id;
        return String(bRoomId) === String(room.id);
      });

      let totalMinutes = 0;
      let totalAttendees = 0;
      const deptCounts = {};

      roomBookings.forEach((b) => {
        const startMin = parseTimeToMinutes(b.start_time);
        const endMin = parseTimeToMinutes(b.end_time);
        const duration = Math.max(30, endMin - startMin);
        totalMinutes += duration;
        totalAttendees += b.participants_count || b.number_of_participants || 2;

        const deptName = b.department?.name || b.department_name || (typeof b.department === 'string' ? b.department : 'General');
        deptCounts[deptName] = (deptCounts[deptName] || 0) + 1;
      });

      const totalHours = Number((totalMinutes / 60).toFixed(1));
      const utilizationRate = Math.min(100, Math.round((totalHours / totalAvailableHoursPerRoom) * 100));
      const avgAttendees = roomBookings.length > 0 ? (totalAttendees / roomBookings.length).toFixed(1) : 0;
      const capacityOccupancy = room.capacity ? Math.round((avgAttendees / room.capacity) * 100) : 0;

      // Top Department
      let topDept = 'N/A';
      let maxDeptCount = 0;
      Object.entries(deptCounts).forEach(([dept, count]) => {
        if (count > maxDeptCount) {
          maxDeptCount = count;
          topDept = dept;
        }
      });

      return {
        ...room,
        totalBookings: roomBookings.length,
        totalHours,
        utilizationRate,
        avgAttendees,
        capacityOccupancy,
        topDept,
      };
    });
  }, [rooms, filteredBookings, totalAvailableHoursPerRoom]);

  // Overall KPIs
  const totalBookingsCount = filteredBookings.length;
  const totalBookedHoursOverall = roomStats.reduce((acc, r) => acc + r.totalHours, 0);
  const avgUtilizationOverall = roomStats.length > 0
    ? Math.round(roomStats.reduce((acc, r) => acc + r.utilizationRate, 0) / roomStats.length)
    : 0;
  
  const mostUtilizedRoom = useMemo(() => {
    if (roomStats.length === 0) return null;
    return [...roomStats].sort((a, b) => b.utilizationRate - a.utilizationRate)[0];
  }, [roomStats]);

  // Chart 1: Room Utilization Rate & Hours Comparison
  const roomComparisonChart = useMemo(() => {
    const categories = roomStats.map((r) => r.name);
    const utilizationData = roomStats.map((r) => r.utilizationRate);
    const hoursData = roomStats.map((r) => r.totalHours);

    return {
      series: [
        { name: 'Utilization Rate (%)', type: 'column', data: utilizationData },
        { name: 'Total Booked Hours', type: 'line', data: hoursData },
      ],
      options: {
        chart: {
          height: 340,
          toolbar: { show: false },
          fontFamily: 'Inter, sans-serif',
        },
        colors: ['#003366', '#009688'],
        stroke: { width: [0, 3], curve: 'smooth' },
        plotOptions: {
          bar: {
            borderRadius: 6,
            columnWidth: '45%',
            dataLabels: { position: 'top' },
          },
        },
        dataLabels: {
          enabled: true,
          enabledOnSeries: [0],
          formatter: (val) => `${val}%`,
          style: { fontSize: '11px', fontWeight: 'bold' },
        },
        xaxis: {
          categories,
          labels: { style: { fontSize: '12px', fontWeight: 600 } },
        },
        yaxis: [
          {
            title: { text: 'Utilization %', style: { color: '#003366', fontWeight: 600 } },
            max: 100,
            labels: { formatter: (val) => `${Math.round(val)}%` },
          },
          {
            opposite: true,
            title: { text: 'Hours Booked', style: { color: '#009688', fontWeight: 600 } },
            labels: { formatter: (val) => `${val}h` },
          },
        ],
        tooltip: {
          shared: true,
          intersect: false,
        },
        legend: { position: 'top', horizontalAlign: 'right' },
      },
    };
  }, [roomStats]);

  // Chart 2: Peak Hours Distribution (9 AM to 6 PM)
  const peakHoursChart = useMemo(() => {
    const hourLabels = ['9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM'];
    const hourCounts = Array(9).fill(0);

    filteredBookings.forEach((b) => {
      const startMin = parseTimeToMinutes(b.start_time);
      const endMin = parseTimeToMinutes(b.end_time);
      
      for (let h = 9; h < 18; h++) {
        const slotStart = h * 60;
        const slotEnd = (h + 1) * 60;
        if (startMin < slotEnd && endMin > slotStart) {
          hourCounts[h - 9]++;
        }
      }
    });

    return {
      series: [{ name: 'Meetings Count', data: hourCounts }],
      options: {
        chart: { type: 'area', height: 280, toolbar: { show: false }, fontFamily: 'Inter, sans-serif' },
        colors: ['#FF9800'],
        fill: {
          type: 'gradient',
          gradient: { shadeIntensity: 1, opacityFrom: 0.5, opacityTo: 0.05, stops: [0, 90, 100] },
        },
        stroke: { curve: 'smooth', width: 3 },
        dataLabels: { enabled: false },
        xaxis: { categories: hourLabels, labels: { style: { fontSize: '11px', fontWeight: 600 } } },
        yaxis: { labels: { formatter: (val) => Math.round(val) } },
        tooltip: { y: { formatter: (val) => `${val} meetings` } },
      },
    };
  }, [filteredBookings]);

  // Chart 3: Department Breakdown
  const deptBreakdownChart = useMemo(() => {
    const deptTotals = {};
    filteredBookings.forEach((b) => {
      const deptName = b.department?.name || b.department_name || (typeof b.department === 'string' ? b.department : 'General');
      deptTotals[deptName] = (deptTotals[deptName] || 0) + 1;
    });

    const labels = Object.keys(deptTotals);
    const series = Object.values(deptTotals);

    return {
      series: series.length > 0 ? series : [1],
      options: {
        chart: { type: 'donut', height: 280, fontFamily: 'Inter, sans-serif' },
        labels: labels.length > 0 ? labels : ['No Bookings'],
        colors: ['#003366', '#009688', '#FF9800', '#E91E63', '#9C27B0', '#3F51B5', '#4CAF50'],
        legend: { position: 'bottom', fontSize: '12px' },
        dataLabels: { enabled: true },
        plotOptions: {
          pie: {
            donut: {
              size: '65%',
              labels: {
                show: true,
                total: {
                  show: true,
                  label: 'Total Meetings',
                  formatter: () => filteredBookings.length,
                },
              },
            },
          },
        },
      },
    };
  }, [filteredBookings]);

  // CSV Export Handler
  const handleExportCSV = () => {
    const headers = ['Room Name', 'Type', 'Capacity', 'Total Bookings', 'Total Hours Booked', 'Utilization Rate (%)', 'Avg Attendees', 'Top Department'];
    const rows = roomStats.map((r) => [
      `"${r.name}"`,
      `"${r.room_type || 'Standard'}"`,
      r.capacity || 0,
      r.totalBookings,
      r.totalHours,
      `${r.utilizationRate}%`,
      r.avgAttendees,
      `"${r.topDept}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Room_Utilization_Report_${dateFrom}_to_${dateTo}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3, px: { xs: 1.5, sm: 3 } }}>
      {/* Top Header */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { md: 'center' }, gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
            <AssessmentIcon color="primary" sx={{ fontSize: 28 }} /> Room Utilization & Comparative Reports
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Analyze meeting room occupancy rates, booking hours, peak usage times, and department breakdowns.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={handleExportCSV}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1.5 }}
          >
            Export CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={fetchData}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1.5 }}
          >
            Refresh
          </Button>
        </Stack>
      </Box>

      {/* Filter Bar */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.5 }}>
              Time Range Preset:
            </Typography>
            <ToggleButtonGroup
              value={timeRange}
              exclusive
              onChange={(e, val) => val && handleTimeRangeChange(val)}
              size="small"
              sx={{ width: '100%' }}
            >
              <ToggleButton value="today" sx={{ flex: 1, textTransform: 'none', fontWeight: 600 }}>Today</ToggleButton>
              <ToggleButton value="week" sx={{ flex: 1, textTransform: 'none', fontWeight: 600 }}>7 Days</ToggleButton>
              <ToggleButton value="month" sx={{ flex: 1, textTransform: 'none', fontWeight: 600 }}>30 Days</ToggleButton>
              <ToggleButton value="quarter" sx={{ flex: 1, textTransform: 'none', fontWeight: 600 }}>90 Days</ToggleButton>
            </ToggleButtonGroup>
          </Grid>

          <Grid item xs={12} sm={6} md={2.5}>
            <TextField
              label="From Date"
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setTimeRange('custom');
              }}
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2.5}>
            <TextField
              label="To Date"
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setTimeRange('custom');
              }}
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={1.5}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter Room</InputLabel>
              <Select
                value={selectedRoomFilter}
                onChange={(e) => setSelectedRoomFilter(e.target.value)}
                label="Filter Room"
              >
                <MenuItem value="all">All Rooms</MenuItem>
                {rooms.map((r) => (
                  <MenuItem key={r.id} value={String(r.id)}>{r.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={1.5}>
            <FormControl fullWidth size="small">
              <InputLabel>Department</InputLabel>
              <Select
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                label="Department"
              >
                <MenuItem value="all">All Depts</MenuItem>
                {departments.map((d) => (
                  <MenuItem key={d.id} value={d.name}>{d.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Top Metric Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#E0F2FE', color: '#0284C7', display: 'flex' }}>
                <TrendingUpIcon sx={{ fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>
                  {avgUtilizationOverall}%
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Avg Room Utilization
                </Typography>
              </Box>
            </Stack>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#DCFCE7', color: '#16A34A', display: 'flex' }}>
                <AccessTimeIcon sx={{ fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>
                  {totalBookedHoursOverall} hrs
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Total Hours Booked
                </Typography>
              </Box>
            </Stack>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#FEF3C7', color: '#D97706', display: 'flex' }}>
                <MeetingRoomIcon sx={{ fontSize: 28 }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {mostUtilizedRoom ? mostUtilizedRoom.name : 'N/A'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Most Utilized ({mostUtilizedRoom ? `${mostUtilizedRoom.utilizationRate}%` : '0%'})
                </Typography>
              </Box>
            </Stack>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#F3E8FF', color: '#9333EA', display: 'flex' }}>
                <PeopleIcon sx={{ fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>
                  {totalBookingsCount}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Total Meetings Held
                </Typography>
              </Box>
            </Stack>
          </Card>
        </Grid>
      </Grid>

      {/* Main Charts Section */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {/* Chart 1: Room Utilization Comparison */}
        <Grid item xs={12} lg={8}>
          <Paper elevation={0} sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2, height: '100%' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <BarChartIcon color="primary" /> Room Utilization % & Booked Hours Comparison
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
              Compares utilization rate against total available operating hours for each room.
            </Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                <CircularProgress size={32} />
              </Box>
            ) : roomStats.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                <Typography color="text.secondary">No room data available for selected period.</Typography>
              </Box>
            ) : (
              <Chart options={roomComparisonChart.options} series={roomComparisonChart.series} type="line" height={320} />
            )}
          </Paper>
        </Grid>

        {/* Chart 2: Department Breakdown */}
        <Grid item xs={12} lg={4}>
          <Paper elevation={0} sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2, height: '100%' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <PieChartIcon color="primary" /> Department Usage Share
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
              Distribution of bookings by department.
            </Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                <CircularProgress size={32} />
              </Box>
            ) : (
              <Chart options={deptBreakdownChart.options} series={deptBreakdownChart.series} type="donut" height={290} />
            )}
          </Paper>
        </Grid>

        {/* Chart 3: Peak Hours Heatmap / Distribution */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <ShowChartIcon color="primary" /> Peak Booking Hours Distribution (9:00 AM – 6:00 PM)
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
              Identify highest demand hours to optimize scheduling and prevent room crunches.
            </Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 220 }}>
                <CircularProgress size={32} />
              </Box>
            ) : (
              <Chart options={peakHoursChart.options} series={peakHoursChart.series} type="area" height={240} />
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Side-by-Side Room Comparison Table */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Meeting Room Utilization Matrix
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Granular breakdown of capacity, total bookings, utilization rate, and primary user department per room.
          </Typography>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 700 }}>Meeting Room</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Type & Capacity</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Total Meetings</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Hours Booked</TableCell>
                <TableCell sx={{ fontWeight: 700 }} sx={{ minWidth: 180 }}>Utilization %</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Avg Attendees</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Top Department</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {roomStats.map((room) => {
                const isHigh = room.utilizationRate >= 60;
                const isNormal = room.utilizationRate >= 25 && room.utilizationRate < 60;

                return (
                  <TableRow key={room.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {room.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {room.location || room.building || 'Main'} • Floor {room.floor || 1}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2">
                        {room.room_type || 'Standard'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {room.capacity} seats
                      </Typography>
                    </TableCell>

                    <TableCell align="center">
                      <Chip label={room.totalBookings} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                    </TableCell>

                    <TableCell align="center">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {room.totalHours} hrs
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ width: '100%', mr: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(100, room.utilizationRate)}
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              bgcolor: '#E2E8F0',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: isHigh ? '#0284C7' : isNormal ? '#10B981' : '#F59E0B',
                              },
                            }}
                          />
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 35 }}>
                          {room.utilizationRate}%
                        </Typography>
                      </Box>
                    </TableCell>

                    <TableCell align="center">
                      <Typography variant="body2">
                        {room.avgAttendees} / {room.capacity || 10}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {room.topDept}
                      </Typography>
                    </TableCell>

                    <TableCell align="center">
                      <Chip
                        label={isHigh ? 'High Demand' : isNormal ? 'Optimal' : 'Low Usage'}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          fontSize: 11,
                          bgcolor: isHigh ? '#E0F2FE' : isNormal ? '#DCFCE7' : '#FEF3C7',
                          color: isHigh ? '#0369A1' : isNormal ? '#15803D' : '#B45309',
                        }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
}
