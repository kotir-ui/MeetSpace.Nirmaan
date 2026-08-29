import { NavLink, Link } from 'react-router-dom';
import {
  Drawer,
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import HistoryIcon from '@mui/icons-material/History';
import SettingsIcon from '@mui/icons-material/Settings';
import HubIcon from '@mui/icons-material/Hub';
import AssessmentIcon from '@mui/icons-material/Assessment';
import VisibilityIcon from '@mui/icons-material/Visibility';
import TuneIcon from '@mui/icons-material/Tune';
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import EventIcon from '@mui/icons-material/Event';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useAuth } from '../context/AuthContext.jsx';

export default function Sidebar({ width, mobileOpen, onClose, isDesktop }) {
  const { user } = useAuth();

  const content = (
    <Box
      sx={{
        height: '100%',
        bgcolor: '#1A3D64',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
      }}
    >


      <List
        sx={{
          px: 1.5,
          py: 1,
          flexGrow: 1,
          minHeight: 0,
          overflowY: 'auto',
          '&::-webkit-scrollbar': { width: 6 },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 3 },
          '&::-webkit-scrollbar-thumb:hover': { bgcolor: 'rgba(255,255,255,0.35)' },
        }}
      >
        <Typography variant="overline" sx={{ px: 2, color: 'rgba(255,255,255,0.5)' }}>
          Meetspace
        </Typography>
        <NavItem to="/meeting-room" icon={<MeetingRoomIcon />} label="Meeting Room Booking" onClose={onClose} />

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 1 }} />
        <Typography variant="overline" sx={{ px: 2, color: 'rgba(255,255,255,0.5)' }}>
          Attendance
        </Typography>
        <NavItem to="/attendance" icon={<EventIcon />} label="Attendance Portal" onClose={onClose} />

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 1 }} />
        <Typography variant="overline" sx={{ px: 2, color: 'rgba(255,255,255,0.5)' }}>
          Administration
        </Typography>
        {(user?.role === 'Super Admin' || user?.role === 'Admin' || user?.role === 'Manager') && (
          <NavItem to="/users" icon={<PeopleIcon />} label="Users" onClose={onClose} />
        )}
        {user?.role === 'Super Admin' && (
          <NavItem to="/settings" icon={<SettingsIcon />} label="Settings" onClose={onClose} />
        )}
      </List>

      <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
          Signed in as
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {user?.name}
        </Typography>
        <Typography variant="caption" sx={{ color: '#60A5FA' }}>
          {user?.role}
        </Typography>
      </Box>
    </Box>
  );

  if (isDesktop) {
    return (
      <Drawer
        variant="permanent"
        sx={{
          width,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width, border: 'none' },
        }}
        open
      >
        {content}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="temporary"
      open={mobileOpen}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width } }}
    >
      {content}
    </Drawer>
  );
}

function NavItem({ to, icon, label, nested, onClose }) {
  return (
    <ListItemButton
      component={NavLink}
      to={to}
      end={to === '/dashboard'}
      onClick={onClose}
      sx={{
        borderRadius: 2,
        mb: 0.5,
        pl: nested ? 4 : 2,
        color: 'rgba(255,255,255,0.85)',
        '&.active': {
          bgcolor: '#1B4EF5',
          color: '#fff',
          fontWeight: 700,
          '& .MuiListItemIcon-root': { color: '#fff' },
          '&:hover': { bgcolor: '#1B4EF5' },
        },
        '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
      }}
    >
      <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>{icon}</ListItemIcon>
      <ListItemText primary={label} primaryTypographyProps={{ fontSize: 14 }} />
    </ListItemButton>
  );
}
