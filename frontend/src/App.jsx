import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { getTheme } from './theme.js';
import { useColorMode } from './context/ColorModeContext.jsx';
import { useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';
import Login from './pages/Login.jsx';
import Landing from './pages/Landing.jsx';
import Users from './pages/Users.jsx';
import AttendanceView from './pages/AttendanceView.jsx';
import LoadingScreen from './components/LoadingScreen.jsx';
// Booking System Pages
import MeetingRoomBooking from './modules/meeting/pages/MeetingRoomBooking.jsx';

export default function App() {
  const { mode } = useColorMode();
  const { loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <ThemeProvider theme={getTheme(mode)}>
      <CssBaseline />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/welcome" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Navigate to="/meeting-room" replace />} />
          <Route path="/meeting-room" element={<MeetingRoomBooking />} />
          <Route path="/attendance" element={<AttendanceView />} />
          <Route
            path="/users"
            element={
              <ProtectedRoute roles={['Super Admin', 'Admin', 'Manager']}>
                <Users />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/meeting-room" replace />} />
      </Routes>
    </ThemeProvider>
  );
}
