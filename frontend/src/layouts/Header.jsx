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
import MenuIcon from '@mui/icons-material/Menu';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import LogoutIcon from '@mui/icons-material/Logout';
import LockResetIcon from '@mui/icons-material/LockReset';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useAuth } from '../context/AuthContext.jsx';
import { useColorMode } from '../context/ColorModeContext.jsx';
import api from '../api/client.js';
import ChangePasswordDialog from '../components/ChangePasswordDialog.jsx';

const NOTIF_COLOR = { info: '#2563EB', success: '#16A34A', warning: '#F59E0B', error: '#DC2626' };

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { mode, toggle } = useColorMode();
  const [anchor, setAnchor] = useState(null);
  const [notifAnchor, setNotifAnchor] = useState(null);
  const [pwOpen, setPwOpen] = useState(false);
  const [settings, setSettings] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

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
      sx={{ bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}
    >
      <Toolbar sx={{ gap: 1 }}>
        <IconButton edge="start" onClick={onMenuClick} sx={{ display: { lg: 'none' } }}>
          <MenuIcon />
        </IconButton>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box component="img" src="/nirmaan-logo.png" alt="Nirmaan Logo" sx={{ height: 32 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, display: { xs: 'none', md: 'block' } }}>
            MeetSpace Portal
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
                onClick={() => markOneRead(n.id)}
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
          {settings.change_password_enabled && (
            <MenuItem onClick={() => { setAnchor(null); setPwOpen(true); }}>
              <LockResetIcon fontSize="small" sx={{ mr: 1 }} /> Change Password
            </MenuItem>
          )}
          <MenuItem onClick={logout}>
            <LogoutIcon fontSize="small" sx={{ mr: 1 }} /> Logout
          </MenuItem>
        </Menu>

        <ChangePasswordDialog open={pwOpen} onClose={() => setPwOpen(false)} />
      </Toolbar>
    </AppBar>
  );
}
