import { createTheme } from '@mui/material/styles';
// Avoid next/font google fetches in environments without outbound network.
// Use system fallbacks; you can self-host fonts later if needed.

const LINK_COLOR = 'hsl(210, 100%, 66%)';

const theme = createTheme({
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: `'Rubik','Vazirmatn',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,'Noto Sans','Apple Color Emoji','Segoe UI Emoji','Segoe UI Symbol',sans-serif`
  },
  colorSchemes: {
    light: {
      palette: {
        background: { default: '#ffffff', paper: '#ffffff' },
        text: { primary: '#222222', secondary: 'rgba(0,0,0,0.68)' },
        primary: { main: '#111111', contrastText: '#ffffff' },
        secondary: { main: '#7E57C2' },
        info: { main: '#26C6DA' },
        success: { main: '#2E7D32' },
        warning: { main: '#ED6C02' },
        error: { main: '#D32F2F' },
        divider: 'rgba(0,0,0,0.12)'
      }
    },
    dark: {
      palette: {
        background: { default: '#000000', paper: '#0A0A0A' },
        text: { primary: '#ffffff', secondary: 'rgba(255,255,255,0.72)' },
        primary: { main: '#ffffff', contrastText: '#222222' },
        secondary: { main: '#B39DDB' },
        info: { main: '#4DD0E1' },
        success: { main: '#66BB6A' },
        warning: { main: '#FFB74D' },
        error: { main: '#EF5350' },
        divider: 'rgba(255,255,255,0.15)'
      }
    }
  },
  components: {
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        slotProps: {
          input: {
            sx: {
              py: 2
            }
          }
        }
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-notchedOutline': {
            borderWidth: 1.5
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderWidth: 2
          }
        }
      }
    },
    MuiButton: {
      defaultProps: {
        color: 'inherit'
      }
    },
    MuiIconButton: {
      defaultProps: {
        color: 'inherit'
      }
    },
    MuiCssBaseline: {
      styleOverrides: (theme) => ({
        body: {
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale'
        },
        a: {
          color: LINK_COLOR,
          textDecoration: 'none'
        },
      })
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: LINK_COLOR,
          textDecoration: 'none'
        }
      }
    }
  }
});

export default theme;
