import React from 'react';
import { Box } from '@mui/material';
import AdminManagementPanel from '../modules/meeting/components/admin/AdminManagementPanel.jsx';

export default function Users() {
  return (
    <Box>
      <AdminManagementPanel defaultTab={0} />
    </Box>
  );
}

