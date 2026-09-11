import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ColorModeProvider } from './context/ColorModeContext.jsx';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID_HERE';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <GoogleOAuthProvider clientId={clientId}>
        <ColorModeProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ColorModeProvider>
      </GoogleOAuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
