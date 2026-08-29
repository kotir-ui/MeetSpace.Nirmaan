import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  Alert,
  InputAdornment,
  IconButton,
  LinearProgress,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import api from '../api/client.js';

const BLANK = { currentPassword: '', newPassword: '', confirmPassword: '' };

export default function ChangePasswordDialog({ open, onClose }) {
  const [form, setForm] = useState(BLANK);
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(BLANK);
      setError('');
      setSuccess('');
      setShow(false);
    }
  }, [open]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setError('');
    setSuccess('');
    if (!form.currentPassword || !form.newPassword) {
      setError('All fields are required');
      return;
    }
    if (form.newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    setSaving(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setSuccess('Password changed successfully');
      setForm(BLANK);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Change Password</DialogTitle>
      {saving && <LinearProgress />}
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}
          <TextField
            label="Current Password"
            type={show ? 'text' : 'password'}
            value={form.currentPassword}
            onChange={set('currentPassword')}
            fullWidth
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShow((s) => !s)} edge="end" size="small">
                    {show ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            label="New Password"
            type={show ? 'text' : 'password'}
            value={form.newPassword}
            onChange={set('newPassword')}
            fullWidth
          />
          <TextField
            label="Confirm New Password"
            type={show ? 'text' : 'password'}
            value={form.confirmPassword}
            onChange={set('confirmPassword')}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Close
        </Button>
        <Button variant="contained" onClick={submit} disabled={saving}>
          Change Password
        </Button>
      </DialogActions>
    </Dialog>
  );
}
