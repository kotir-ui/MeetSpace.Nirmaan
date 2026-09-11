import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext.jsx';
import { DARK_BLUE } from '../theme.js';
import api from '../api/client.js';
import ForgotPasswordDialog from '../components/ForgotPasswordDialog.jsx';
import { GoogleLogin } from '@react-oauth/google';

export default function Login() {
  const navigate = useNavigate();
  const destination = '/meeting-room';

  const { login, googleLogin, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEnabled, setForgotEnabled] = useState(false);

  useEffect(() => {
    api.get('/auth/config').then((r) => setForgotEnabled(!!r.data.forgot_password_enabled)).catch(() => {});
  }, []);

  useEffect(() => {
    if (user) {
      navigate(destination, { replace: true });
    }
  }, [user, navigate, destination]);

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
          <Box
            onClick={() => navigate('/')}
            sx={{
              textAlign: 'center',
              mb: 3,
              cursor: 'pointer',
              userSelect: 'none',
              textDecoration: 'none',
              display: 'block',
            }}
          >
            <Box
              component="img"
              src="/nirmaan-logo.png"
              alt="Nirmaan.org"
              sx={{ width: '85%', maxWidth: 270, height: 'auto', mx: 'auto', display: 'block' }}
            />
            <Box sx={{ mt: 1.5 }}>
              <Typography
                className="brand-bounce-text"
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: DARK_BLUE,
                  letterSpacing: -0.2,
                  fontSize: '1.15rem'
                }}
              >
                MeetSpace
              </Typography>
            </Box>
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
              disabled={loading || googleLoading}
              sx={{ mt: 3 }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>

            <Box sx={{ my: 3, display: 'flex', alignItems: 'center' }}>
              <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
              <Typography variant="body2" sx={{ px: 2, color: 'text.secondary', fontWeight: 500 }}>
                OR
              </Typography>
              <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  try {
                    setGoogleLoading(true);
                    setError('');
                    await googleLogin(credentialResponse.credential);
                    navigate(destination, { replace: true });
                  } catch (err) {
                    setError(err.response?.data?.message || 'Google Login failed');
                  } finally {
                    setGoogleLoading(false);
                  }
                }}
                onError={() => {
                  setError('Google Login was unsuccessful');
                }}
                useOneTap
                theme="outline"
                size="large"
                text="continue_with"
                shape="rectangular"
              />
            </Box>

            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={() => setForgotOpen(true)}
                sx={{
                  fontWeight: 600,
                  color: 'primary.main',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                Forgot Password?
              </Link>
            </Box>
          </form>
        </CardContent>
      </Card>

      {/* Forgot Password Reset Dialog with OTP verification */}
      <ForgotPasswordDialog
        open={forgotOpen}
        onClose={() => setForgotOpen(false)}
        initialEmail={email}
      />
    </Box>
  );
}
