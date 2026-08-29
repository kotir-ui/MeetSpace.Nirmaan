import { createTheme } from '@mui/material/styles';

const PRIMARY = '#0A2947';
const ACCENT = '#2563EB';

export const getTheme = (mode) =>
  createTheme({
    palette: {
      mode,
      primary: { main: mode === 'dark' ? ACCENT : PRIMARY },
      secondary: { main: ACCENT },
      background: {
        default: mode === 'dark' ? '#0B1220' : '#F4F6FB',
        paper: mode === 'dark' ? '#111C33' : '#FFFFFF',
      },
      success: { main: '#22C55E' },
      error: { main: '#EF4444' },
      warning: { main: '#F59E0B' },
      info: { main: '#0EA5E9' },
    },
    typography: {
      fontFamily: 'Inter, Roboto, Helvetica, Arial, sans-serif',
      h4: { fontWeight: 700 },
      h5: { fontWeight: 700 },
      h6: { fontWeight: 600 },
      subtitle2: { fontWeight: 600 },
    },
    shape: { borderRadius: 12 },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow:
              mode === 'dark'
                ? '0 2px 12px rgba(0,0,0,0.4)'
                : '0 2px 12px rgba(10,41,71,0.08)',
            borderRadius: 14,
          },
        },
      },
      MuiButton: {
        styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } },
      },
    },
  });

export const DARK_BLUE = PRIMARY;
