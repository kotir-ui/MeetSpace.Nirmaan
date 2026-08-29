import { Navigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h5" color="error">
          Access Denied
        </Typography>
        <Typography color="text.secondary">
          You do not have permission to view this page.
        </Typography>
      </Box>
    );
  }

  return children;
}
