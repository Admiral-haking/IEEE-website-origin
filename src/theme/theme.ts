import { createTheme } from '@mui/material/styles';
// Fonts are provided via next/font in app/fonts.ts and applied on <html>

const LINK_COLOR = 'hsl(210, 100%, 66%)';

const theme = createTheme({
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: `var(--font-fa), var(--font-latin), -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,'Noto Sans','Apple Color Emoji','Segoe UI Emoji','Segoe UI Symbol',sans-serif`
  },
  colorSchemes: {
    light: {
      palette: {
        background: { default: '#ffffff', paper: '#ffffff' },
        text: { primary: '#222222', secondary: 'rgba(0,0,0,0.68)' },
        primary: { main: '#111111', contrastText: '#ffffff' },
        secondary: { main: '#6C63FF' },
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
        secondary: { main: '#B3ABFF' },
        info: { main: '#4DD0E1' },
        success: { main: '#66BB6A' },
        warning: { main: '#FFB74D' },
        error: { main: '#EF5350' },
        divider: 'rgba(255,255,255,0.15)'
      }
    }
  },
  components: {
    MuiInputLabel: {
      styleOverrides: {
        root: {
          left: 14,
          right: 'auto',
          transformOrigin: 'left top',
          textAlign: 'left',
          '&.Mui-focused': { color: 'var(--mui-palette-secondary-main)' }
        },
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          textAlign: 'left',
        },
      },
    },
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
          transition: 'box-shadow .16s ease, border-color .2s ease',
          '& .MuiOutlinedInput-notchedOutline': {
            borderWidth: 1.5
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'var(--mui-palette-secondary-main)'
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderWidth: 2,
            borderColor: 'var(--mui-palette-secondary-main)'
          },
          '&.Mui-focused': {
            boxShadow: '0 0 0 2px rgba(108, 99, 255, 0.14)'
          },
          '&.Mui-disabled': {
            backgroundColor: 'var(--mui-palette-action-disabledBackground)',
            color: 'var(--mui-palette-text-disabled)',
            WebkitTextFillColor: 'var(--mui-palette-text-disabled)'
          },
          '&.Mui-disabled .MuiOutlinedInput-notchedOutline': {
            borderColor: 'var(--mui-palette-divider)'
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
