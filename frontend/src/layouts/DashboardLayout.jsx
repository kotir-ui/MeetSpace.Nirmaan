import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';

const DRAWER_WIDTH = 210;

export default function DashboardLayout() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar
        width={DRAWER_WIDTH}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        isDesktop={isDesktop}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
        }}
      >
        <Header onMenuClick={() => setMobileOpen(true)} />
        <Box sx={{ px: { xs: 2, md: 3 }, py: { xs: 1, md: 1.5 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
