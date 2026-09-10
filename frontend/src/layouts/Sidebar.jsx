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
import { Dashboard as DashboardIcon, CalendarMonth as CalendarMonthIcon, ListAlt as ListAltIcon, AdminPanelSettings as AdminPanelSettingsIcon, Assessment as AssessmentIcon } from '@mui/icons-material';
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
      <Box
        component={NavLink}
        to="/"
        sx={{
          height: { xs: 56, sm: 64 },
          minHeight: { xs: 56, sm: 64 },
          boxSizing: 'border-box',
          px: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textDecoration: 'none',
          borderBottom: '1px solid',
          borderColor: 'divider',
          cursor: 'pointer',
        }}
      >
        <Box
          component="img"
          src="/nirmaan-logo.png"
          alt="Nirmaan Logo"
          sx={{ height: 38, width: 'auto', maxWidth: '85%', objectFit: 'contain', flexShrink: 0 }}
        />
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
        <NavItem to="/meeting-room/dashboard" label="Dashboard" icon={<DashboardIcon />} onClose={onClose} />
        <NavItem to="/meeting-room/book" label="Book Room" icon={<CalendarMonthIcon />} onClose={onClose} />
        <NavItem to="/meeting-room/my-bookings" label="My Bookings" icon={<ListAltIcon />} onClose={onClose} />

        {(user?.role === 'Super Admin' || user?.role === 'Admin') && (
          <>
            <Divider sx={{ borderColor: 'divider', my: 1 }} />
            <Typography variant="overline" sx={{ px: 2, color: 'text.secondary', fontWeight: 600 }}>
              Administration
            </Typography>
            <NavItem to="/meeting-room/admin" label="Admin Control" icon={<AdminPanelSettingsIcon />} onClose={onClose} />
            <NavItem to="/meeting-room/reports" label="Reports" icon={<AssessmentIcon />} onClose={onClose} />
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

function NavItem({ to, label, icon, nested, onClose }) {
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
      {icon && (
        <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
          {icon}
        </ListItemIcon>
      )}
      <ListItemText primary={label} primaryTypographyProps={{ fontSize: 14, fontWeight: 'inherit' }} />
    </ListItemButton>
  );
}
