import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#6C63FF',
      light: '#9B95FF',
      dark: '#4A42D6',
      contrastText: '#fff',
    },
    secondary: {
      main: '#FF6584',
      light: '#FF9BAD',
      dark: '#CC3355',
    },
    success: { main: '#4ECDC4' },
    warning: { main: '#FFB347' },
    error: { main: '#FF6584' },
    background: {
      default: '#F0F2FF',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#2D3436',
      secondary: '#636E72',
    },
  },
  typography: {
    fontFamily: '"Pretendard", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h4: { fontWeight: 800, letterSpacing: '-0.5px' },
    h5: { fontWeight: 700, letterSpacing: '-0.3px' },
    h6: { fontWeight: 600 },
    button: { fontWeight: 600, textTransform: 'none' },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: '#F0F2FF',
          scrollbarWidth: 'thin',
          scrollbarColor: '#6C63FF40 transparent',
          '&::-webkit-scrollbar': { width: 6 },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': {
            background: '#6C63FF40',
            borderRadius: 3,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: '0 4px 24px rgba(108, 99, 255, 0.08)',
          border: '1px solid rgba(108, 99, 255, 0.06)',
          transition: 'box-shadow 0.3s ease, transform 0.3s ease',
          '&:hover': {
            boxShadow: '0 8px 32px rgba(108, 99, 255, 0.15)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '10px 24px',
          fontSize: '0.9rem',
        },
        contained: {
          background: 'linear-gradient(135deg, #6C63FF 0%, #9B59B6 100%)',
          boxShadow: '0 4px 16px rgba(108, 99, 255, 0.35)',
          '&:hover': {
            background: 'linear-gradient(135deg, #5A52CC 0%, #8A48A5 100%)',
            boxShadow: '0 8px 24px rgba(108, 99, 255, 0.45)',
          },
        },
        outlined: {
          borderColor: '#6C63FF',
          color: '#6C63FF',
          '&:hover': {
            background: 'rgba(108, 99, 255, 0.06)',
            borderColor: '#5A52CC',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            background: 'rgba(108, 99, 255, 0.03)',
            '& fieldset': { borderColor: 'rgba(108, 99, 255, 0.2)' },
            '&:hover fieldset': { borderColor: '#6C63FF' },
            '&.Mui-focused fieldset': { borderColor: '#6C63FF', borderWidth: 2 },
          },
          '& label.Mui-focused': { color: '#6C63FF' },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #6C63FF 0%, #9B59B6 100%)',
          boxShadow: '0 4px 20px rgba(108, 99, 255, 0.3)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: 'none',
          background: '#fff',
          boxShadow: '4px 0 24px rgba(108, 99, 255, 0.08)',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          margin: '2px 8px',
          width: 'calc(100% - 16px)',
          transition: 'all 0.2s ease',
          '&.Mui-selected': {
            background: 'linear-gradient(135deg, #6C63FF 0%, #9B59B6 100%)',
            color: '#fff',
            boxShadow: '0 4px 16px rgba(108, 99, 255, 0.35)',
            '& .MuiListItemIcon-root': { color: '#fff' },
            '& .MuiListItemText-primary': { fontWeight: 700 },
            '&:hover': {
              background: 'linear-gradient(135deg, #5A52CC 0%, #8A48A5 100%)',
            },
          },
          '&:not(.Mui-selected):hover': {
            background: 'rgba(108, 99, 255, 0.08)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            background: 'rgba(108, 99, 255, 0.06)',
            fontWeight: 700,
            color: '#6C63FF',
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 20 },
      },
    },
  },
});

export default theme;
