import React from 'react';
import { Box, Chip } from '@mui/material';
import { getStatusConfig } from '../../utils/bookingStatusHelper.js';

export default function BookingStatusChip({ booking, status, size = 'small', sx = {} }) {
  const config = getStatusConfig(booking || status);

  return (
    <Chip
      size={size}
      label={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
          {config.isPulsing && (
            <Box
              component="span"
              sx={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                bgcolor: config.color,
                display: 'inline-block',
                boxShadow: `0 0 0 0 ${config.color}`,
                animation: 'pulseDot 1.8s infinite cubic-bezier(0.66, 0, 0, 1)',
                '@keyframes pulseDot': {
                  '0%': {
                    transform: 'scale(0.95)',
                    boxShadow: `0 0 0 0 ${config.color}B3`,
                  },
                  '70%': {
                    transform: 'scale(1)',
                    boxShadow: `0 0 0 6px ${config.color}00`,
                  },
                  '100%': {
                    transform: 'scale(0.95)',
                    boxShadow: `0 0 0 0 ${config.color}00`,
                  },
                },
              }}
            />
          )}
          <span>{config.label}</span>
        </Box>
      }
      sx={{
        bgcolor: config.bgColor,
        color: config.color,
        border: `1px solid ${config.borderColor}`,
        fontWeight: 700,
        fontSize: size === 'small' ? '0.75rem' : '0.85rem',
        height: size === 'small' ? 24 : 28,
        borderRadius: '12px',
        px: 0.5,
        ...sx,
      }}
    />
  );
}
