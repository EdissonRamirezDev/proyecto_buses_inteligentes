import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3'
import { MsalProvider } from '@azure/msal-react'
import { PublicClientApplication } from '@azure/msal-browser'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { GOOGLE_CLIENT_ID, RECAPTCHA_SITE_KEY } from './utils/constants'
import { msalConfig } from './config/msalConfig'
import App from './App'
import './index.css'

// Instancia de MSAL — se crea una sola vez fuera del componente
const msalInstance = new PublicClientApplication(msalConfig)

const AppWithProviders = () => (
  <ThemeProvider>
    <AuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </ThemeProvider>
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleReCaptchaProvider reCaptchaKey={RECAPTCHA_SITE_KEY}>
      {/* MsalProvider habilita el login con Microsoft en toda la app */}
      <MsalProvider instance={msalInstance}>
        {GOOGLE_CLIENT_ID ? (
          <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <AppWithProviders />
          </GoogleOAuthProvider>
        ) : (
          <AppWithProviders />
        )}
      </MsalProvider>
    </GoogleReCaptchaProvider>
  </StrictMode>
)