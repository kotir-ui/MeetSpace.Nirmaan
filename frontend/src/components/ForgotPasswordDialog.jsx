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
  Typography,
  LinearProgress,
} from '@mui/material';
import api from '../api/client.js';

export default function ForgotPasswordDialog({ open, onClose, initialEmail = '' }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setStep(1);
      setEmail(initialEmail);
      setOtp('');
      setNewPassword('');
      setConfirm('');
      setError('');
      setInfo('');
    }
  }, [open, initialEmail]);

  const sendOtp = async () => {
    setError('');
    setInfo('');
    if (!email) {
      setError('Enter your registered email');
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setStep(2);
      // Dev mode: the OTP is returned so it can be used without email delivery.
      if (data.devOtp) {
        setOtp(data.devOtp);
        setInfo(`Dev mode — your OTP is ${data.devOtp} (also logged on the server).`);
      } else {
        setInfo(data.message || 'If that email is registered, an OTP has been sent.');
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to send OTP');
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async () => {
    setError('');
    if (!otp || !newPassword) {
      setError('OTP and new password are required');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.post('/auth/reset-password', { email, otp, newPassword });
      setInfo(data.message || 'Password reset successfully.');
      setStep(3);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to reset password');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Forgot Password</DialogTitle>
      {busy && <LinearProgress />}
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          {error && <Alert severity="error">{error}</Alert>}
          {info && <Alert severity={step === 3 ? 'success' : 'info'}>{info}</Alert>}

          {step === 1 && (
            <>
              <Typography variant="body2" color="text.secondary">
                Enter your registered email and we&apos;ll send a one-time password (OTP).
              </Typography>
              <TextField
                label="Registered Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                autoFocus
              />
            </>
          )}

          {step === 2 && (
            <>
              <TextField label="OTP" value={otp} onChange={(e) => setOtp(e.target.value)} fullWidth />
              <TextField
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                fullWidth
              />
              <TextField
                label="Confirm New Password"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                fullWidth
              />
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>
          {step === 3 ? 'Done' : 'Cancel'}
        </Button>
        {step === 1 && (
          <Button variant="contained" onClick={sendOtp} disabled={busy}>
            Send OTP
          </Button>
        )}
        {step === 2 && (
          <Button variant="contained" onClick={resetPassword} disabled={busy}>
            Reset Password
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
