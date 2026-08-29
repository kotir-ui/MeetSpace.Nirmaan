import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Stack,
  Chip,
  AppBar,
  Toolbar,
} from '@mui/material';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import EventIcon from '@mui/icons-material/Event';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useAuth } from '../context/AuthContext.jsx';
import { DARK_BLUE } from '../theme.js';

const FEATURES = [
  { icon: <MeetingRoomIcon />, title: 'Meeting Room Booking', desc: 'Book meeting rooms, manage facilities, view calendar availability, and invite team members.' },
  { icon: <CheckCircleOutlineIcon />, title: 'Multi-Stage Approvals', desc: 'Department Head and HR approval workflows to manage room allocations efficiently.' },
  { icon: <EventIcon />, title: 'Attendance Tracking', desc: 'Track employee presence, daily check-ins/check-outs, and export attendance reports.' },
  { icon: <HowToRegIcon />, title: 'User & Role Management', desc: 'Role-based access control for Admins, Managers, and Employees across departments.' },
];

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const openMeetSpace = () => navigate(user ? '/meeting-room' : '/login?module=meetspace');
  const openAttendance = () => navigate(user ? '/attendance' : '/login?module=attendance');

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Top bar */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{ bgcolor: '#fff', color: DARK_BLUE, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <Toolbar sx={{ gap: 2 }}>
          <Box component="img" src="/nirmaan-logo.png" alt="Nirmaan Logo" sx={{ height: 36 }} />
          <Box sx={{ flexGrow: 1 }} />
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<MeetingRoomIcon />}
              onClick={openMeetSpace}
              sx={{ fontWeight: 600 }}
            >
              MeetSpace
            </Button>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<EventIcon />}
              onClick={openAttendance}
              sx={{ fontWeight: 600 }}
            >
              Attendance
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Hero */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${DARK_BLUE} 0%, #123B63 100%)`,
          color: '#fff',
          py: { xs: 8, md: 10 },
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Chip label="Nirmaan Organization" sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', mb: 2 }} />
              <Typography variant="h2" sx={{ fontWeight: 800, lineHeight: 1.1, fontSize: { xs: 32, md: 46 } }}>
                Smart Meeting Room Booking & Attendance Management
              </Typography>
              <Typography variant="h6" sx={{ mt: 2, color: 'rgba(255,255,255,0.8)', fontWeight: 400 }}>
                Select a service below to access room reservations, approval workflows, or daily employee attendance tracking.
              </Typography>

              {/* 2 Main Buttons */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 4 }}>
                <Button
                  size="large"
                  variant="contained"
                  color="secondary"
                  startIcon={<MeetingRoomIcon />}
                  endIcon={<ArrowForwardIcon />}
                  onClick={openMeetSpace}
                  sx={{ py: 1.5, px: 3, fontWeight: 700, fontSize: '1.05rem' }}
                >
                  MeetSpace
                </Button>
                <Button
                  size="large"
                  variant="contained"
                  sx={{
                    py: 1.5,
                    px: 3,
                    fontWeight: 700,
                    fontSize: '1.05rem',
                    bgcolor: '#10B981',
                    color: '#fff',
                    '&:hover': { bgcolor: '#059669' },
                  }}
                  startIcon={<EventIcon />}
                  endIcon={<ArrowForwardIcon />}
                  onClick={openAttendance}
                >
                  Attendance
                </Button>
              </Stack>
            </Grid>

            <Grid item xs={12} md={5} sx={{ display: 'flex', justifyContent: 'center' }}>
              <Box
                sx={{
                  bgcolor: '#fff',
                  borderRadius: 4,
                  p: 2,
                  boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  maxWidth: 380,
                  width: '100%',
                }}
              >
                <Box
                  component="img"
                  src="/meeting-illustration.png"
                  alt="Meeting Collaboration"
                  sx={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: 320,
                    objectFit: 'contain',
                    borderRadius: 2,
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Core Services */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, textAlign: 'center', mb: 1 }}>
          Select Service
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 6 }}>
          Click on any service to view details and launch the module
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Card
              elevation={0}
              sx={{
                height: '100%',
                border: '2px solid',
                borderColor: 'primary.main',
                borderRadius: 3,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 },
              }}
            >
              <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Box sx={{ color: 'primary.main', mb: 2, '& svg': { fontSize: 48 } }}>
                  <MeetingRoomIcon />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                  MeetSpace — Meeting Room Booking
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1, mb: 3, lineHeight: 1.6 }}>
                  Reserve conference rooms, manage equipment & facilities, view interactive room calendar availability, and handle multi-stage Department Head & HR approval workflows.
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<MeetingRoomIcon />}
                  endIcon={<ArrowForwardIcon />}
                  onClick={openMeetSpace}
                  fullWidth
                  sx={{ py: 1.2, fontWeight: 700 }}
                >
                  Open MeetSpace Details
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card
              elevation={0}
              sx={{
                height: '100%',
                border: '2px solid',
                borderColor: '#10B981',
                borderRadius: 3,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 },
              }}
            >
              <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Box sx={{ color: '#10B981', mb: 2, '& svg': { fontSize: 48 } }}>
                  <EventIcon />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                  Attendance — Employee Tracking
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1, mb: 3, lineHeight: 1.6 }}>
                  Track real-time employee check-ins and check-outs, monitor daily team presence, view presence stats, and generate/export presence reports.
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<EventIcon />}
                  endIcon={<ArrowForwardIcon />}
                  onClick={openAttendance}
                  fullWidth
                  sx={{
                    py: 1.2,
                    fontWeight: 700,
                    bgcolor: '#10B981',
                    color: '#fff',
                    '&:hover': { bgcolor: '#059669' },
                  }}
                >
                  Open Attendance Details
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
