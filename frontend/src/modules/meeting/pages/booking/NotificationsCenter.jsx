import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Stack,
  Chip,
  CircularProgress,
  Typography,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  Divider,
} from '@mui/material';
import axios from 'axios';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import DeleteIcon from '@mui/icons-material/Delete';

const NotificationsCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('unread'); // all, unread, read
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      let url = '/api/booking/notifications';
      if (filter === 'unread') url += '?isRead=false';
      else if (filter === 'read') url += '?isRead=true';

      const res = await axios.get(url);
      setNotifications(res.data.data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const res = await axios.get('/api/booking/notifications/unread-count');
      setUnreadCount(res.data.data?.unreadCount || 0);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await axios.put(`/api/booking/notifications/${id}/read`);
      fetchNotifications();
      fetchUnreadCount();
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axios.put('/api/booking/notifications/read-all');
      fetchNotifications();
      fetchUnreadCount();
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/booking/notifications/${id}`);
      fetchNotifications();
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Are you sure you want to delete all notifications?')) return;
    try {
      await axios.delete('/api/booking/notifications');
      fetchNotifications();
    } catch (err) {
      console.error('Error deleting notifications:', err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
      case 'approved':
      case 'confirmation':
        return <CheckCircleIcon sx={{ color: '#2e7d32' }} />;
      case 'error':
      case 'rejected':
        return <ErrorIcon sx={{ color: '#d32f2f' }} />;
      case 'warning':
      case 'approval_required':
        return <WarningIcon sx={{ color: '#f57c00' }} />;
      default:
        return <InfoIcon sx={{ color: '#1976d2' }} />;
    }
  };

  const getTypeChip = (type) => {
    const colorMap = {
      success: 'success',
      error: 'error',
      warning: 'warning',
      info: 'info',
      approved: 'success',
      rejected: 'error',
      approval_required: 'warning',
      booking_request: 'info',
      confirmation: 'success',
      reminder: 'warning',
      cancellation: 'error',
      modification: 'info',
    };

    return (
      <Chip
        label={type.replace(/_/g, ' ').toUpperCase()}
        size="small"
        color={colorMap[type] || 'default'}
        variant="outlined"
      />
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Notifications
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
            {unreadCount > 0 ? `${unreadCount} unread notifications` : 'No unread notifications'}
          </Typography>
        </Box>
      </Stack>

      {/* Filter Buttons */}
      <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
        <Button
          variant={filter === 'unread' ? 'contained' : 'outlined'}
          onClick={() => setFilter('unread')}
        >
          Unread ({unreadCount})
        </Button>
        <Button
          variant={filter === 'read' ? 'contained' : 'outlined'}
          onClick={() => setFilter('read')}
        >
          Read
        </Button>
        <Button
          variant={filter === 'all' ? 'contained' : 'outlined'}
          onClick={() => setFilter('all')}
        >
          All
        </Button>

        <Box sx={{ flex: 1 }} />

        {filter === 'unread' && unreadCount > 0 && (
          <Button
            size="small"
            onClick={handleMarkAllAsRead}
            variant="outlined"
          >
            Mark All as Read
          </Button>
        )}

        {notifications.length > 0 && (
          <Button
            size="small"
            color="error"
            onClick={handleDeleteAll}
            variant="outlined"
          >
            Delete All
          </Button>
        )}
      </Stack>

      {/* Notifications List */}
      {notifications.length > 0 ? (
        <Paper>
          <List sx={{ width: '100%' }}>
            {notifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  sx={{
                    bgcolor: notification.is_read ? 'transparent' : '#f5f5f5',
                    '&:hover': { bgcolor: '#fafafa' },
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    setSelectedNotification(notification);
                    setDetailsOpen(true);
                  }}
                >
                  <ListItemIcon>
                    {getNotificationIcon(notification.type)}
                  </ListItemIcon>

                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, flex: 1 }}>
                          {notification.title}
                        </Typography>
                        {getTypeChip(notification.type)}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>
                          {new Date(notification.created_at).toLocaleString()}
                        </Typography>
                      </Box>
                    }
                  />

                  <Stack direction="row" spacing={0.5}>
                    {!notification.is_read && (
                      <Button
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notification.id);
                        }}
                        variant="outlined"
                      >
                        Mark Read
                      </Button>
                    )}
                    <Button
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(notification.id);
                      }}
                      startIcon={<DeleteIcon />}
                    >
                      Delete
                    </Button>
                  </Stack>
                </ListItem>
                {index < notifications.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <NotificationsIcon sx={{ fontSize: 48, color: 'textSecondary', mb: 1 }} />
          <Typography color="textSecondary">
            {filter === 'unread'
              ? 'No unread notifications'
              : filter === 'read'
              ? 'No read notifications'
              : 'No notifications'}
          </Typography>
        </Paper>
      )}

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="sm" fullWidth>
        {selectedNotification && (
          <>
            <DialogTitle>{selectedNotification.title}</DialogTitle>
            <DialogContent>
              <Box sx={{ pt: 2 }}>
                <Box sx={{ mb: 2 }}>
                  {getTypeChip(selectedNotification.type)}
                </Box>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {selectedNotification.message}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {new Date(selectedNotification.created_at).toLocaleString()}
                </Typography>
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default NotificationsCenter;
