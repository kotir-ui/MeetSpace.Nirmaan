import {
  AppBar,
  Toolbar,
  IconButton,
  Box,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  Divider,
  Badge,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Chip,
} from '@mui/material';
import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu as MenuIcon, DarkMode as DarkModeIcon, LightMode as LightModeIcon, Logout as LogoutIcon, LockReset as LockResetIcon, Notifications as NotificationsIcon, AccountCircle as AccountCircleIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext.jsx';
import { useColorMode } from '../context/ColorModeContext.jsx';
import api from '../api/client.js';
import ChangePasswordDialog from '../components/ChangePasswordDialog.jsx';
import EditProfileDialog from '../components/EditProfileDialog.jsx';

const NOTIF_COLOR = { info: '#2563EB', success: '#16A34A', warning: '#F59E0B', error: '#DC2626' };

export default function Header({ onMenuClick }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { mode, toggle } = useColorMode();
  const [anchor, setAnchor] = useState(null);
  const [notifAnchor, setNotifAnchor] = useState(null);
  const [pwOpen, setPwOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [settings, setSettings] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);

  const isAdmin = user?.role === 'Admin' || user?.role === 'Super Admin' || user?.role_name === 'Admin' || user?.role_name === 'Super Admin' || user?.role?.name === 'Admin' || user?.role?.name === 'Super Admin';

  const loadNotifications = () =>
    api
      .get('/notifications')
      .then((r) => { setNotifications(r.data.data || []); setUnread(r.data.unread || 0); })
      .catch(() => {});

  useEffect(() => {
    api.get('/settings').then((r) => setSettings(r.data)).catch(() => {});
    loadNotifications();
    const t = setInterval(loadNotifications, 60000);
    return () => clearInterval(t);
  }, []);

  const markOneRead = async (id) => {
    await api.patch(`/notifications/${id}/read`).catch(() => {});
    setNotifications((ns) => ns.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    setUnread((u) => Math.max(0, u - 1));
  };

  const handleNotificationClick = (n) => {
    markOneRead(n.id);
    setNotifAnchor(null);

    const title = (n.title || '').toLowerCase();
    const msg = (n.message || '').toLowerCase();
    const isApprovalRelated = title.includes('request') || title.includes('approval') || msg.includes('approval') || msg.includes('review') || n.type === 'booking_request' || n.type === 'approval_required';

    if (isAdmin && isApprovalRelated) {
      navigate('/meeting-room/admin?tab=approvals');
    } else if (title.includes('confirmed') || title.includes('approved') || title.includes('rejected') || title.includes('booking') || isApprovalRelated) {
      navigate('/meeting-room/my-bookings');
    } else if (n.action_url) {
      navigate(n.action_url);
    }
  };
  const markAllRead = async () => {
    await api.patch('/notifications/read-all').catch(() => {});
    setNotifications((ns) => ns.map((n) => ({ ...n, is_read: true })));
    setUnread(0);
  };
  const clearAll = async () => {
    await api.delete('/notifications').catch(() => {});
    setNotifications([]);
    setUnread(0);
    setNotifAnchor(null);
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      color="inherit"
      sx={{
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        height: { xs: 56, sm: 64 },
        minHeight: { xs: 56, sm: 64 },
        justifyContent: 'center',
        boxSizing: 'border-box',
      }}
    >
      <Toolbar
        sx={{
          height: { xs: 56, sm: 64 },
          minHeight: { xs: '56px !important', sm: '64px !important' },
          gap: 1,
          px: { xs: 2, sm: 3 },
        }}
      >
        <IconButton edge="start" onClick={onMenuClick} sx={{ display: { lg: 'none' } }}>
          <MenuIcon />
        </IconButton>

        <Box
          component={NavLink}
          to="/"
          sx={{
            display: 'flex',
            alignItems: 'center',
            textDecoration: 'none',
            cursor: 'pointer',
            ml: { xs: 0.5, sm: 1 },
          }}
        >
          <Typography
            className="brand-bounce-text"
            variant="h6"
            sx={{
              fontWeight: 800,
              color: 'text.primary',
              letterSpacing: -0.5,
              fontSize: { xs: '1.05rem', sm: '1.2rem' },
              userSelect: 'none',
            }}
          >
            MeetSpace<Typography component="span" sx={{ color: 'inherit', fontWeight: 800, fontSize: 'inherit' }}>.Nirmaan</Typography>
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        <Tooltip title="Notifications">
          <IconButton onClick={(e) => { setNotifAnchor(e.currentTarget); loadNotifications(); }}>
            <Badge badgeContent={unread} color="error" max={99}>
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={notifAnchor}
          open={Boolean(notifAnchor)}
          onClose={() => setNotifAnchor(null)}
          PaperProps={{ sx: { width: 360, maxHeight: 460 } }}
        >
          <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Notifications
            </Typography>
            {unread > 0 && <Chip size="small" color="error" label={`${unread} new`} />}
          </Box>
          <Divider />
          {notifications.length === 0 && (
            <Box sx={{ px: 2, py: 3, textAlign: 'center', color: 'text.secondary' }}>
              <Typography variant="body2">No notifications</Typography>
            </Box>
          )}
          <List dense disablePadding sx={{ maxHeight: 320, overflowY: 'auto' }}>
            {notifications.map((n) => (
              <ListItemButton
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                sx={{ bgcolor: n.is_read ? 'transparent' : 'action.hover' }}
              >
                <ListItemIcon sx={{ minWidth: 28 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: n.is_read ? 'transparent' : NOTIF_COLOR[n.type] || NOTIF_COLOR.info,
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={n.title}
                  secondary={n.message}
                  primaryTypographyProps={{ fontSize: 14, fontWeight: n.is_read ? 500 : 700 }}
                  secondaryTypographyProps={{ fontSize: 12 }}
                />
              </ListItemButton>
            ))}
          </List>
          {notifications.length > 0 && (
            <>
              <Divider />
              <Box sx={{ display: 'flex' }}>
                <MenuItem onClick={markAllRead} sx={{ flex: 1, justifyContent: 'center', fontWeight: 600, color: 'primary.main' }}>
                  Mark all as read
                </MenuItem>
                <MenuItem onClick={clearAll} sx={{ flex: 1, justifyContent: 'center', fontWeight: 600, color: 'text.secondary' }}>
                  Clear all
                </MenuItem>
              </Box>
            </>
          )}
        </Menu>

        <Tooltip title={mode === 'dark' ? 'Light mode' : 'Dark mode'}>
          <IconButton onClick={toggle}>
            {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Tooltip>

        <IconButton onClick={(e) => setAnchor(e.currentTarget)}>
          <Avatar sx={{ width: 34, height: 34, bgcolor: '#2563EB' }}>
            {user?.name?.[0]?.toUpperCase()}
          </Avatar>
        </IconButton>

        <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="subtitle2">{user?.name}</Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.email}
            </Typography>
          </Box>
          <Divider />
          <MenuItem onClick={() => { setAnchor(null); setProfileOpen(true); }}>
            <ListItemIcon><AccountCircleIcon fontSize="small" /></ListItemIcon> My Profile
          </MenuItem>
          {settings.change_password_enabled && (
            <MenuItem onClick={() => { setAnchor(null); setPwOpen(true); }}>
              <ListItemIcon><LockResetIcon fontSize="small" /></ListItemIcon> Change Password
            </MenuItem>
          )}
          <MenuItem onClick={logout}>
            <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon> Logout
          </MenuItem>
        </Menu>

        <ChangePasswordDialog open={pwOpen} onClose={() => setPwOpen(false)} />
        <EditProfileDialog open={profileOpen} onClose={() => setProfileOpen(false)} />
      </Toolbar>
    </AppBar>
  );
}
