import { NavLink } from 'react-router-dom';
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
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import ScheduleIcon from '@mui/icons-material/Schedule';
import EventNoteIcon from '@mui/icons-material/EventNote';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { useAuth } from '../context/AuthContext.jsx';

export default function Sidebar({ width, mobileOpen, onClose, isDesktop }) {
  const { user } = useAuth();

  const content = (
    <Box
      sx={{
        height: '100%',
        bgcolor: 'background.paper',
        color: 'text.primary',
        borderRight: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box component="img" src="/nirmaan-logo.png" alt="Nirmaan Logo" sx={{ height: 32, p: 0.5, borderRadius: 1 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
          MeetSpace
        </Typography>
      </Box>

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
        <Typography variant="overline" sx={{ px: 2, color: 'text.secondary', fontWeight: 600 }}>
          Workspace
        </Typography>
        <NavItem to="/meeting-room/dashboard" icon={<ScheduleIcon />} label="Dashboard" onClose={onClose} />
        <NavItem to="/meeting-room/book" icon={<MeetingRoomIcon />} label="Book Room" onClose={onClose} />
        <NavItem to="/meeting-room/my-bookings" icon={<EventNoteIcon />} label="My Bookings" onClose={onClose} />

        {(user?.role === 'Super Admin' || user?.role === 'Admin' || user?.role === 'Manager' || user?.role === 'Department Manager') && (
          <>
            <Divider sx={{ borderColor: 'divider', my: 1 }} />
            <Typography variant="overline" sx={{ px: 2, color: 'text.secondary', fontWeight: 600 }}>
              Administration
            </Typography>
            <NavItem to="/meeting-room/admin" icon={<AdminPanelSettingsIcon />} label="Admin Control" onClose={onClose} />
            <NavItem to="/users" icon={<PeopleIcon />} label="Users & Roles" onClose={onClose} />
          </>
        )}
      </List>

      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Signed in as
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {user?.name}
        </Typography>
        <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }}>
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
        color: 'text.secondary',
        '&.active': {
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          fontWeight: 700,
          '& .MuiListItemIcon-root': { color: 'inherit' },
          '&:hover': { bgcolor: 'primary.dark' },
        },
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>{icon}</ListItemIcon>
      <ListItemText primary={label} primaryTypographyProps={{ fontSize: 14, fontWeight: 'inherit' }} />
    </ListItemButton>
  );
}
