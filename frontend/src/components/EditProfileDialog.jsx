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
  LinearProgress,
} from '@mui/material';
import { useAuth } from '../context/AuthContext.jsx';

export default function EditProfileDialog({ open, onClose }) {
  const { user, updateProfile } = useAuth();
  
  const [form, setForm] = useState({ name: '', mobile: '', designation: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && user) {
      setForm({
        name: user.name || '',
        mobile: user.mobile || '',
        designation: user.designation || ''
      });
      setError('');
      setSuccess('');
    }
  }, [open, user]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setError('');
    setSuccess('');
    
    if (!form.name.trim()) {
      setError('Name is required');
      return;
    }
    
    setSaving(true);
    try {
      await updateProfile(form);
      setSuccess('Profile updated successfully');
      setTimeout(() => {
        if (onClose) onClose();
      }, 1500);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Edit Profile</DialogTitle>
      {saving && <LinearProgress />}
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}
          <TextField
            label="Name"
            value={form.name}
            onChange={set('name')}
            fullWidth
            required
          />
          <TextField
            label="Mobile"
            value={form.mobile}
            onChange={set('mobile')}
            fullWidth
          />
          <TextField
            label="Designation"
            value={form.designation}
            onChange={set('designation')}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={submit} disabled={saving}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
