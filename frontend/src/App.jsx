import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { getTheme } from './theme.js';
import { useColorMode } from './context/ColorModeContext.jsx';
import { useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';
import Login from './pages/Login.jsx';
import Users from './pages/Users.jsx';
import LoadingScreen from './components/LoadingScreen.jsx';
import MeetingRoomBooking from './modules/meeting/pages/MeetingRoomBooking.jsx';
import Landing from './pages/Landing.jsx';

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
          <Route path="/dashboard" element={<Navigate to="/meeting-room/dashboard" replace />} />
          <Route path="/meeting-room" element={<Navigate to="/meeting-room/dashboard" replace />} />
          <Route path="/meeting-room/dashboard" element={<MeetingRoomBooking view="dashboard" />} />
          <Route path="/meeting-room/book" element={<MeetingRoomBooking view="book" />} />
          <Route path="/meeting-room/my-bookings" element={<MeetingRoomBooking view="my-bookings" />} />
          <Route
            path="/meeting-room/reports"
            element={
              <ProtectedRoute roles={['Super Admin', 'Admin']}>
                <MeetingRoomBooking view="reports" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/meeting-room/admin"
            element={
              <ProtectedRoute roles={['Super Admin', 'Admin']}>
                <MeetingRoomBooking view="admin" />
              </ProtectedRoute>
            }
          />
          <Route path="/users" element={<Navigate to="/meeting-room/admin" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/meeting-room" replace />} />
      </Routes>
    </ThemeProvider>
  );
}
