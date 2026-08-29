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
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DevicesIcon from '@mui/icons-material/Devices';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import { useAuth } from '../context/AuthContext.jsx';
import { DARK_BLUE } from '../theme.js';

const FEATURES = [
  {
    icon: <MeetingRoomIcon sx={{ fontSize: 32, color: '#1B4EF5' }} />,
    title: 'Meeting Room Booking',
    desc: 'Reserve conference rooms, inspect capacity, facilities (Projector, VC, Whiteboard), and book time slots with live conflict checking.',
  },
  {
    icon: <CalendarMonthIcon sx={{ fontSize: 32, color: '#10B981' }} />,
    title: 'Interactive Schedule Calendar',
    desc: 'View real-time room availability across the entire organization with day and week calendar schedules.',
  },
  {
    icon: <CheckCircleOutlineIcon sx={{ fontSize: 32, color: '#F59E0B' }} />,
    title: 'Multi-Stage Approvals',
    desc: 'Automated workflow with Department Head and HR approvals to manage and approve room allocations effortlessly.',
  },
  {
    icon: <HowToRegIcon sx={{ fontSize: 32, color: '#8B5CF6' }} />,
    title: 'User & Role Management',
    desc: 'Role-based access control for Super Admins, Admins, Managers, and Viewers across all Nirmaan departments.',
  },
];

const ROOMS_PREVIEW = [
  { name: 'Sarvepalli Radhakrishnan', code: 'MR-01', cap: 12, floor: 'Floor 1', facilities: ['Projector', 'VC Setup', 'AC'] },
  { name: 'Ratan Tata', code: 'MR-02', cap: 12, floor: 'Floor 1', facilities: ['TV Screen', 'Whiteboard', 'AC'] },
  { name: 'Dr. Bidhan Chandra Roy', code: 'MR-03', cap: 10, floor: 'Floor 1', facilities: ['Projector', 'Conference Mic'] },
  { name: 'Sunderlal Bahuguna', code: 'MR-04', cap: 10, floor: 'Floor 1', facilities: ['VC Setup', 'Whiteboard'] },
];

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLaunch = () => navigate(user ? '/meeting-room' : '/login');

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Navigation Bar */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{ bgcolor: '#fff', color: DARK_BLUE, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <Toolbar sx={{ gap: 2, px: { xs: 2, sm: 4 } }}>
          <Box component="img" src="/nirmaan-logo.png" alt="Nirmaan Logo" sx={{ height: 38 }} />
          <Typography variant="h6" sx={{ fontWeight: 800, color: DARK_BLUE, letterSpacing: -0.5 }}>
            MeetSpace<Typography component="span" sx={{ color: '#1B4EF5', fontWeight: 800, fontSize: 'inherit' }}>.Nirmaan</Typography>
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Button
            variant="contained"
            color="primary"
            startIcon={<MeetingRoomIcon />}
            onClick={handleLaunch}
            sx={{ fontWeight: 700, px: 3, borderRadius: 2 }}
          >
            {user ? 'Open Dashboard' : 'Sign In'}
          </Button>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${DARK_BLUE} 0%, #123B63 60%, #0A2947 100%)`,
          color: '#fff',
          py: { xs: 8, md: 11 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={5} alignItems="center">
            <Grid item xs={12} md={7}>
              <Chip
                label="Enterprise Meeting Management"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.15)',
                  color: '#fff',
                  mb: 2.5,
                  fontWeight: 600,
                  backdropFilter: 'blur(6px)',
                }}
              />
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 800,
                  lineHeight: 1.15,
                  fontSize: { xs: 32, md: 48 },
                  letterSpacing: -0.5,
                }}
              >
                Smart Meeting Room Booking for Nirmaan
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  mt: 2.5,
                  color: 'rgba(255,255,255,0.85)',
                  fontWeight: 400,
                  lineHeight: 1.6,
                  fontSize: { xs: '1rem', md: '1.15rem' },
                }}
              >
                Seamlessly schedule conference rooms, coordinate multi-stage manager & HR approvals, prevent meeting conflicts, and manage organizational facilities in one central platform.
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 4 }}>
                <Button
                  size="large"
                  variant="contained"
                  color="secondary"
                  startIcon={<MeetingRoomIcon />}
                  endIcon={<ArrowForwardIcon />}
                  onClick={handleLaunch}
                  sx={{
                    py: 1.5,
                    px: 3.5,
                    fontWeight: 700,
                    fontSize: '1.05rem',
                    borderRadius: 2,
                    boxShadow: '0 8px 24px rgba(27,78,245,0.3)',
                  }}
                >
                  {user ? 'Enter MeetSpace' : 'Book a Meeting Room'}
                </Button>
              </Stack>
            </Grid>

            <Grid item xs={12} md={5} sx={{ display: 'flex', justifyContent: 'center' }}>
              <Box
                sx={{
                  bgcolor: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(12px)',
                  borderRadius: 4,
                  p: 3,
                  width: '100%',
                  maxWidth: 420,
                  boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                }}
              >
                <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 2, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Meeting Rooms Preview
                </Typography>
                <Stack spacing={1.5}>
                  {ROOMS_PREVIEW.map((room) => (
                    <Box
                      key={room.code}
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#fff' }}>
                          {room.name}
                        </Typography>
                        <Chip label={room.code} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600, height: 20 }} />
                      </Box>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                        Capacity: {room.cap} people • {room.floor}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Core Features */}
      <Container maxWidth="lg" sx={{ py: 9 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Chip label="Portal Capabilities" color="primary" size="small" sx={{ fontWeight: 700, mb: 1.5 }} />
          <Typography variant="h4" sx={{ fontWeight: 800, color: DARK_BLUE }}>
            Engineered for Efficient Collaboration
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1, maxWidth: 600, mx: 'auto' }}>
            Everything teams need to find available spaces, coordinate attendees, and manage booking approvals.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {FEATURES.map((feat) => (
            <Grid item xs={12} sm={6} md={3} key={feat.title}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 3,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 },
                }}
              >
                <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <Box sx={{ mb: 2 }}>{feat.icon}</Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: DARK_BLUE }}>
                    {feat.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {feat.desc}
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
