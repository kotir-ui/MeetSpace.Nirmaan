import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  Link,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useAuth } from '../context/AuthContext.jsx';
import { DARK_BLUE } from '../theme.js';
import api from '../api/client.js';
import ForgotPasswordDialog from '../components/ForgotPasswordDialog.jsx';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const moduleParam = searchParams.get('module');

  const portalTitle =
    moduleParam === 'attendance'
      ? 'Attendance Portal'
      : moduleParam === 'meetspace'
      ? 'MeetSpace Portal'
      : 'Portal Login';

  const destination = moduleParam === 'attendance' ? '/attendance' : '/meeting-room';

  const { login, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEnabled, setForgotEnabled] = useState(false);

  useEffect(() => {
    api.get('/auth/config').then((r) => setForgotEnabled(!!r.data.forgot_password_enabled)).catch(() => {});
  }, []);

  if (user) {
    navigate(destination, { replace: true });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${DARK_BLUE} 0%, #123B63 100%)`,
        p: 2,
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 420 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box
              component="img"
              src="/nirmaan-logo.png"
              alt="Nirmaan.org"
              sx={{ width: '75%', maxWidth: 240, height: 'auto', mx: 'auto', display: 'block' }}
            />
            <Typography variant="h6" sx={{ mt: 1.5, fontWeight: 700 }}>
              {portalTitle}
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Password"
              type={show ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShow((s) => !s)} edge="end">
                      {show ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 3 }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
            {forgotEnabled && (
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Link component="button" type="button" variant="body2" onClick={() => setForgotOpen(true)}>
                  Forgot Password?
                </Link>
              </Box>
            )}
          </form>
        </CardContent>
      </Card>

      <ForgotPasswordDialog open={forgotOpen} onClose={() => setForgotOpen(false)} initialEmail={email} />
    </Box>
  );
}
