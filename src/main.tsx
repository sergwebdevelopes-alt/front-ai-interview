import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import App from './App.tsx'
import { ErrorBoundary } from './shared/ui/ErrorBoundary.tsx'

const theme = createTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary message="Something went wrong">
        <App />
      </ErrorBoundary>
    </ThemeProvider>
  </StrictMode>,
)
