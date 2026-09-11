import { useState, useEffect } from 'react';
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
  Link as MuiLink,
  IconButton,
} from '@mui/material';
import {
  MeetingRoomRounded as MeetingRoomRoundedIcon,
  CalendarMonthRounded as CalendarMonthRoundedIcon,
  FactCheckRounded as FactCheckRoundedIcon,
  ManageAccountsRounded as ManageAccountsRoundedIcon,
  ArrowForward as ArrowForwardIcon,
  Login as LoginIcon,
  Email as EmailIcon,
  LocationOn as LocationOnIcon,
  Language as LanguageIcon,
  CheckCircle as CheckCircleIcon,
  Facebook as FacebookIcon,
  LinkedIn as LinkedInIcon,
  Instagram as InstagramIcon,
  X as XIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext.jsx';
import { getPublicRoomCount, getPublicRooms } from '../modules/meeting/api/booking.js';
import { DARK_BLUE } from '../theme.js';

const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'Services', href: '#services' },
  { label: 'About Us', href: '#about' },
  { label: 'Contact', href: '#contact' },
];

const FEATURES = [
  {
    icon: <MeetingRoomRoundedIcon sx={{ fontSize: 28, color: '#2563EB' }} />,
    bg: 'rgba(37, 99, 235, 0.1)',
    border: 'rgba(37, 99, 235, 0.2)',
    title: 'Purpose-Built for NGO Needs',
    desc: 'Perfectly suited for scheduling NGO meetings with donors, internal department gatherings, and other essential events.',
  },
  {
    icon: <CalendarMonthRoundedIcon sx={{ fontSize: 28, color: '#0284C7' }} />,
    bg: 'rgba(2, 132, 199, 0.1)',
    border: 'rgba(2, 132, 199, 0.2)',
    title: 'Interactive Schedule Calendar',
    desc: 'Feel free to easily book meeting rooms using flexible calendar dates. View real-time availability across the organization.',
  },
  {
    icon: <FactCheckRoundedIcon sx={{ fontSize: 28, color: '#059669' }} />,
    bg: 'rgba(5, 150, 105, 0.1)',
    border: 'rgba(5, 150, 105, 0.2)',
    title: '2-Stage Approval System',
    desc: 'Secure 2-stage approval workflow. Users and department admins receive instant automated alert messages for status updates.',
  },
  {
    icon: <ManageAccountsRoundedIcon sx={{ fontSize: 28, color: '#7C3AED' }} />,
    bg: 'rgba(124, 58, 237, 0.1)',
    border: 'rgba(124, 58, 237, 0.2)',
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
  const [roomCount, setRoomCount] = useState(0);
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    getPublicRoomCount()
      .then(res => {
        if (res.data && res.data.count) {
          setRoomCount(res.data.count);
        }
      })
      .catch(err => console.error('Failed to fetch public room count:', err));

    getPublicRooms()
      .then(res => {
        if (res.data && res.data.data) {
          setRooms(res.data.data);
        }
      })
      .catch(err => console.error('Failed to fetch public rooms:', err));
  }, []);

  const handleLaunch = () => navigate(user ? '/meeting-room' : '/login');

  const scrollToSection = (e, href) => {
    e.preventDefault();
    if (href === '#home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const elem = document.querySelector(href);
    if (elem) {
      const navHeight = 65;
      const elementPosition = elem.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - navHeight;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', scrollBehavior: 'smooth' }}>
      {/* Navigation Bar */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{ bgcolor: '#fff', color: DARK_BLUE, borderBottom: '1px solid', borderColor: 'divider', zIndex: 1100 }}
      >
        <Toolbar sx={{ px: { xs: 2, sm: 4 }, py: 0.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Logo & Brand */}
          <Box
            onClick={() => navigate('/')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              cursor: 'pointer',
              textDecoration: 'none',
              userSelect: 'none',
            }}
          >
            <Box
              component="img"
              src="/nirmaan-logo.png"
              alt="Nirmaan Logo"
              sx={{ height: 48, width: 'auto', objectFit: 'contain' }}
            />
            <Typography
              className="brand-bounce-text"
              variant="h6"
              sx={{
                fontWeight: 800,
                color: DARK_BLUE,
                letterSpacing: -0.5,
                fontSize: { xs: '1.1rem', sm: '1.25rem' },
              }}
            >
              MeetSpace<Typography component="span" sx={{ color: 'inherit', fontWeight: 800, fontSize: 'inherit' }}>.Nirmaan</Typography>
            </Typography>
          </Box>

          {/* Primary Navigation Links - Centered in Header */}
          <Stack
            direction="row"
            spacing={4}
            sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              mx: 'auto',
            }}
          >
            {NAV_LINKS.map((link) => (
              <MuiLink
                key={link.label}
                href={link.href}
                onClick={(e) => scrollToSection(e, link.href)}
                sx={{
                  color: 'text.secondary',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  textDecoration: 'none',
                  py: 0.5,
                  transition: 'color 0.2s',
                  '&:hover': {
                    color: DARK_BLUE,
                  },
                }}
              >
                {link.label}
              </MuiLink>
            ))}
          </Stack>

          {/* Sign In CTA */}
          <Button
            variant="contained"
            color="primary"
            onClick={handleLaunch}
            startIcon={user ? <ArrowForwardIcon /> : <LoginIcon />}
            sx={{ fontWeight: 700, px: 3, borderRadius: 2 }}
          >
            {user ? 'Dashboard' : 'Sign In'}
          </Button>
        </Toolbar>
      </AppBar>

      {/* 1. HERO SECTION (1 Full Screen) */}
      <Box
        id="home"
        sx={{
          background: `linear-gradient(135deg, ${DARK_BLUE} 0%, #123B63 60%, #0A2947 100%)`,
          color: '#fff',
          minHeight: 'calc(100vh - 65px)',
          display: 'flex',
          alignItems: 'center',
          py: { xs: 6, md: 4 },
          position: 'relative',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={{ xs: 4, md: 5 }} alignItems="center">
            <Grid item xs={12} md={6.5}>
              <Chip
                label="Nirmaan Workspace Management"
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
                  fontSize: { xs: 30, sm: 38, md: 44 },
                  letterSpacing: -0.5,
                }}
              >
                Streamlining Collaboration for Social Impact
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  mt: 2,
                  color: 'rgba(255,255,255,0.85)',
                  fontWeight: 400,
                  lineHeight: 1.55,
                  fontSize: { xs: '0.95rem', md: '1.05rem' },
                }}
              >
                Seamlessly schedule workspaces for donor meetings, skill development workshops, and internal team gatherings. Manage approvals and eliminate conflicts, empowering your team to focus on creating an equal and knowledge-driven society.
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 3.5 }}>
                <Button
                  size="large"
                  variant="contained"
                  color="secondary"
                  onClick={handleLaunch}
                  startIcon={<MeetingRoomRoundedIcon />}
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    py: 1.3,
                    px: 3.5,
                    fontWeight: 700,
                    fontSize: '1rem',
                    borderRadius: 2,
                    boxShadow: '0 8px 24px rgba(27,78,245,0.3)',
                  }}
                >
                  {user ? 'Enter MeetSpace' : 'Book a Meeting Room'}
                </Button>
              </Stack>
            </Grid>

            <Grid item xs={12} md={5.5} sx={{ display: 'flex', justifyContent: { xs: 'center', md: 'flex-end' } }}>
              <Box
                sx={{
                  bgcolor: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  backdropFilter: 'blur(16px)',
                  borderRadius: 3.5,
                  p: { xs: 2, sm: 2.5 },
                  width: '100%',
                  maxWidth: 460,
                  boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, px: 0.5 }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2 }}>
                    Meeting Rooms Preview
                  </Typography>
                  <Chip
                    label={`${roomCount} Rooms Configured`}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.15)',
                      color: '#fff',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      height: 20,
                    }}
                  />
                </Box>
                <Stack spacing={1.2}>
                  {rooms.map((room) => (
                    <Box
                      key={room.id}
                      sx={{
                        py: 1,
                        px: 1.5,
                        borderRadius: 2,
                        bgcolor: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: 'rgba(255,255,255,0.14)',
                          borderColor: 'rgba(255,255,255,0.2)',
                          transform: 'translateX(2px)',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 700,
                            color: '#fff',
                            fontSize: '0.88rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {room.name}
                        </Typography>
                        <Chip
                          label={room.room_number}
                          size="small"
                          sx={{
                            bgcolor: 'rgba(255,255,255,0.22)',
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            height: 20,
                            minWidth: 52,
                          }}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.73rem', display: 'block', mt: 0.25 }}>
                        Capacity: {room.capacity} people • Floor {room.floor}
                      </Typography>
                      {room.facilities && room.facilities.length > 0 && (
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.68rem', display: 'block', mt: 0.25 }}>
                          {room.facilities.map(f => f.facility_type).join(', ')}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Stack>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* 2. SERVICES SECTION (1 Full Screen) */}
      <Box
        id="services"
        sx={{
          minHeight: 'calc(100vh - 65px)',
          display: 'flex',
          alignItems: 'center',
          py: { xs: 6, md: 4 },
          bgcolor: 'background.paper',
          boxSizing: 'border-box',
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 4.5 }}>
            <Chip label="Portal Services & Capabilities" color="primary" size="small" sx={{ fontWeight: 700, mb: 1.5 }} />
            <Typography variant="h4" sx={{ fontWeight: 800, color: DARK_BLUE, fontSize: { xs: '1.8rem', md: '2.2rem' } }}>
              Engineered for Efficient Collaboration
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1, maxWidth: 620, mx: 'auto', fontSize: { xs: '0.9rem', md: '1rem' } }}>
              Everything teams need to find available spaces, coordinate attendees, and manage booking approvals smoothly.
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
                  <CardContent sx={{ p: 3.5, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', height: '100%' }}>
                    <Box
                      sx={{
                        mb: 2.5,
                        width: 58,
                        height: 58,
                        borderRadius: 3,
                        bgcolor: feat.bg,
                        border: '1px solid',
                        borderColor: feat.border,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        transition: 'transform 0.2s',
                      }}
                    >
                      {feat.icon}
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: DARK_BLUE, textAlign: 'center' }}>
                      {feat.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, textAlign: 'center' }}>
                      {feat.desc}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* 3. ABOUT US SECTION (1 Full Screen) */}
      <Box
        id="about"
        sx={{
          minHeight: 'calc(100vh - 65px)',
          display: 'flex',
          alignItems: 'center',
          py: { xs: 6, md: 4 },
          bgcolor: 'background.default',
          boxSizing: 'border-box',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={5} alignItems="center">
            <Grid item xs={12} md={6}>
              <Chip label="About Nirmaan" color="primary" size="small" sx={{ fontWeight: 700, mb: 1.5 }} />
              <Typography variant="h4" sx={{ fontWeight: 800, color: DARK_BLUE, mb: 2, fontSize: { xs: '1.8rem', md: '2.2rem' } }}>
                Empowering Social Innovation & Productive Workspaces
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.65, mb: 3, fontSize: { xs: '0.9rem', md: '0.98rem' } }}>
                Discover the story of Nirmaan NGO, a nonprofit organization dedicated to creating equal opportunities in India through education, skill training, and social innovation. We empower underprivileged communities by driving impactful social change.
              </Typography>

              <Stack spacing={1.5}>
                {[
                  'Vision: To achieve a knowledge-driven and economically empowered society',
                  'Mission: To promote grassroots social innovations and active citizenship',
                  'Dedicated to creating equal opportunities through education & skill training',
                ].map((item) => (
                  <Box key={item} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <CheckCircleIcon sx={{ color: '#059669', fontSize: 20 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {item}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  bgcolor: '#fff',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 3.5,
                  p: { xs: 3, sm: 4 },
                  boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 800, color: DARK_BLUE, mb: 2.5, fontSize: '1.1rem' }}>
                  Nirmaan Impact & Reach
                </Typography>
                <Grid container spacing={2}>
                  {[
                    { value: '6+ Million', label: 'Beneficiaries Impacted' },
                    { value: '26', label: 'States & UTs in India' },
                    { value: '12,000+', label: 'Individual Volunteers' },
                    { value: '250+', label: 'Corporate Champions' },
                  ].map((stat) => (
                    <Grid item xs={6} key={stat.label}>
                      <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main', mb: 0.5, fontSize: { xs: '1.6rem', md: '2rem' } }}>
                          {stat.value}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                          {stat.label}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* 4. CONTACT & FOOTER SECTION (1 Full Screen Together) */}
      <Box
        id="contact"
        sx={{
          minHeight: 'calc(100vh - 65px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          bgcolor: 'background.paper',
          boxSizing: 'border-box',
        }}
      >
        {/* Contact Content */}
        <Container maxWidth="lg" sx={{ py: { xs: 4, md: 5 }, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Box sx={{ textAlign: 'center', mb: 3.5 }}>
            <Chip label="Get in Touch" color="primary" size="small" sx={{ fontWeight: 700, mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 800, color: DARK_BLUE, fontSize: { xs: '1.6rem', md: '2rem' } }}>
              Contact Us
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 580, mx: 'auto' }}>
              Have questions regarding meeting room allocations, credentials, or facility maintenance? Our operations team is here to assist you.
            </Typography>
          </Box>

          <Grid container spacing={3} justifyContent="center">
            {/* Card 1: Head Office */}
            <Grid item xs={12} sm={6} md={4}>
              <Card
                elevation={0}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 3.5,
                  p: 3,
                  textAlign: 'center',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.25s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.06)',
                    borderColor: 'primary.light',
                  },
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                  <Box
                    sx={{
                      width: 52,
                      height: 52,
                      borderRadius: 2.5,
                      bgcolor: 'rgba(37, 99, 235, 0.1)',
                      border: '1px solid rgba(37, 99, 235, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 1.5,
                    }}
                  >
                    <LocationOnIcon sx={{ fontSize: 26, color: '#2563EB' }} />
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: DARK_BLUE, mb: 0.5 }}>
                    Head Office
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.25 }}>
                    Nirmaan Organization
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4, display: 'block' }}>
                    Hyderabad, Telangana, India
                  </Typography>
                </Box>
                <MuiLink
                  href="https://maps.app.goo.gl/fxmYp59EqtcKVcni9"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    mt: 2,
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    color: 'primary.main',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  View on Map ↗
                </MuiLink>
              </Card>
            </Grid>

            {/* Card 2: Email Us */}
            <Grid item xs={12} sm={6} md={4}>
              <Card
                elevation={0}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 3.5,
                  p: 3,
                  textAlign: 'center',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.25s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.06)',
                    borderColor: '#059669',
                  },
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                  <Box
                    sx={{
                      width: 52,
                      height: 52,
                      borderRadius: 2.5,
                      bgcolor: 'rgba(5, 150, 105, 0.1)',
                      border: '1px solid rgba(5, 150, 105, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 1.5,
                    }}
                  >
                    <EmailIcon sx={{ fontSize: 26, color: '#059669' }} />
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: DARK_BLUE, mb: 0.5 }}>
                    Email Support
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.25 }}>
                    contact@nirmaan.org
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4, display: 'block' }}>
                    Quick response for portal queries
                  </Typography>
                </Box>
                <MuiLink
                  href="mailto:contact@nirmaan.org"
                  sx={{
                    mt: 2,
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    color: '#059669',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  Send an Email →
                </MuiLink>
              </Card>
            </Grid>

            {/* Card 3: Official Website */}
            <Grid item xs={12} sm={6} md={4}>
              <Card
                elevation={0}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 3.5,
                  p: 3,
                  textAlign: 'center',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.25s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.06)',
                    borderColor: '#0284C7',
                  },
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                  <Box
                    sx={{
                      width: 52,
                      height: 52,
                      borderRadius: 2.5,
                      bgcolor: 'rgba(2, 132, 199, 0.1)',
                      border: '1px solid rgba(2, 132, 199, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 1.5,
                    }}
                  >
                    <LanguageIcon sx={{ fontSize: 26, color: '#0284C7' }} />
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: DARK_BLUE, mb: 0.5 }}>
                    Official Portal
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.25 }}>
                    www.nirmaan.org
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4, display: 'block' }}>
                    Discover programs & initiatives
                  </Typography>
                </Box>
                <MuiLink
                  href="https://nirmaan.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    mt: 2,
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    color: '#0284C7',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  Visit Website ↗
                </MuiLink>
              </Card>
            </Grid>
          </Grid>
        </Container>

        {/* Integrated Clean Footer */}
        <Box sx={{ bgcolor: DARK_BLUE, color: 'rgba(255,255,255,0.85)', pt: 4, pb: 3 }}>
          <Container maxWidth="lg">
            <Grid container spacing={4}>
              {/* Column 1: Brand Info */}
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                  <Box
                    component="img"
                    src="/nirmaan-logo.png"
                    alt="Nirmaan Logo"
                    sx={{ height: 38, width: 'auto', bgcolor: '#fff', p: 0.5, borderRadius: 1.5 }}
                  />
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#fff', letterSpacing: -0.5, fontSize: '1.1rem' }}>
                    MeetSpace.Nirmaan
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, display: 'block', maxWidth: 300, mb: 1 }}>
                  Enterprise meeting room reservation and schedule coordination portal for Nirmaan Organization.
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block' }}>
                  © {new Date().getFullYear()} Nirmaan Organization. All rights reserved.
                </Typography>
              </Grid>

              {/* Column 2: Quick Links */}
              <Grid item xs={6} sm={4} md={2.5}>
                <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 700, mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.8rem' }}>
                  Quick Links
                </Typography>
                <Stack spacing={0.8}>
                  {NAV_LINKS.map((link) => (
                    <MuiLink
                      key={link.label}
                      href={link.href}
                      onClick={(e) => scrollToSection(e, link.href)}
                      sx={{
                        color: 'rgba(255,255,255,0.7)',
                        fontSize: '0.82rem',
                        textDecoration: 'none',
                        transition: 'color 0.2s',
                        '&:hover': { color: '#fff' },
                      }}
                    >
                      {link.label}
                    </MuiLink>
                  ))}
                </Stack>
              </Grid>

              {/* Column 3: Resources */}
              <Grid item xs={6} sm={4} md={2.5}>
                <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 700, mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.8rem' }}>
                  Resources
                </Typography>
                <Stack spacing={0.8}>
                  {[
                    { label: 'Help Center', href: '#contact' },
                    { label: 'Room Guidelines', href: '#services' },
                    { label: 'Privacy Policy', href: '#home' },
                    { label: 'Terms of Service', href: '#home' },
                  ].map((item) => (
                    <MuiLink
                      key={item.label}
                      href={item.href}
                      onClick={(e) => scrollToSection(e, item.href)}
                      sx={{
                        color: 'rgba(255,255,255,0.7)',
                        fontSize: '0.82rem',
                        textDecoration: 'none',
                        transition: 'color 0.2s',
                        '&:hover': { color: '#fff' },
                      }}
                    >
                      {item.label}
                    </MuiLink>
                  ))}
                </Stack>
              </Grid>

              {/* Column 4: Contact Details */}
              <Grid item xs={12} sm={4} md={3}>
                <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 700, mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.8rem' }}>
                  Contact & Support
                </Typography>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <LocationOnIcon sx={{ fontSize: 16, color: '#38BDF8', mt: 0.2 }} />
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.78rem' }}>
                      Nirmaan Organization, Hyderabad, India
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailIcon sx={{ fontSize: 16, color: '#38BDF8' }} />
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.78rem' }}>
                      contact@nirmaan.org
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LanguageIcon sx={{ fontSize: 16, color: '#38BDF8' }} />
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.78rem' }}>
                      www.nirmaan.org
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1.5} sx={{ pt: 1.5 }}>
                    <IconButton size="small" component="a" href="#" target="_blank" sx={{ bgcolor: '#fff', width: 32, height: 32, '&:hover': { bgcolor: '#e2e8f0' } }}>
                      <FacebookIcon sx={{ color: '#1877F2', fontSize: 20 }} />
                    </IconButton>
                    <IconButton size="small" component="a" href="#" target="_blank" sx={{ bgcolor: '#fff', width: 32, height: 32, '&:hover': { bgcolor: '#e2e8f0' } }}>
                      <LinkedInIcon sx={{ color: '#0A66C2', fontSize: 20 }} />
                    </IconButton>
                    <IconButton size="small" component="a" href="#" target="_blank" sx={{ bgcolor: '#fff', width: 32, height: 32, '&:hover': { bgcolor: '#e2e8f0' } }}>
                      <InstagramIcon sx={{ color: '#E1306C', fontSize: 20 }} />
                    </IconButton>
                    <IconButton size="small" component="a" href="#" target="_blank" sx={{ bgcolor: '#fff', width: 32, height: 32, '&:hover': { bgcolor: '#e2e8f0' } }}>
                      <XIcon sx={{ color: '#000000', fontSize: 18 }} />
                    </IconButton>
                  </Stack>
                </Stack>
              </Grid>
            </Grid>
          </Container>
        </Box>
      </Box>
    </Box>
  );
}
