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
  const goApp = () => navigate(user ? '/meeting-room' : '/login');

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Top bar */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{ bgcolor: '#fff', color: DARK_BLUE, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <Toolbar sx={{ gap: 2 }}>
          <Typography variant="h6" sx={{ color: DARK_BLUE, fontWeight: 700 }}>
            MeetSpace & Attendance Portal
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" color="primary" onClick={goApp}>
            {user ? 'Open Portal' : 'Sign In'}
          </Button>
        </Toolbar>
      </AppBar>

      {/* Hero */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${DARK_BLUE} 0%, #123B63 100%)`,
          color: '#fff',
          py: { xs: 8, md: 12 },
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Chip label="Nirmaan Organization" sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', mb: 2 }} />
              <Typography variant="h2" sx={{ fontWeight: 800, lineHeight: 1.1, fontSize: { xs: 34, md: 52 } }}>
                Smart Meeting Room Booking & Attendance Management
              </Typography>
              <Typography variant="h6" sx={{ mt: 2, color: 'rgba(255,255,255,0.8)', fontWeight: 400 }}>
                Streamline meeting room reservations, approval workflows, and employee attendance tracking in one unified modular platform.
              </Typography>
              <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
                <Button size="large" variant="contained" color="secondary" endIcon={<ArrowForwardIcon />} onClick={goApp}>
                  {user ? 'Go to MeetSpace' : 'Get Started'}
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features */}
      <Container maxWidth="lg" sx={{ py: 8 }} id="features">
        <Typography variant="h4" sx={{ fontWeight: 700, textAlign: 'center', mb: 6 }}>
          Core Modules
        </Typography>
        <Grid container spacing={3}>
          {FEATURES.map((f, i) => (
            <Grid item xs={12} sm={6} key={i}>
              <Card elevation={0} sx={{ height: '100%', border: '1px solid', borderColor: 'divider' }}>
                <CardContent>
                  <Box sx={{ color: 'primary.main', mb: 1, '& svg': { fontSize: 36 } }}>{f.icon}</Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                    {f.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {f.desc}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
