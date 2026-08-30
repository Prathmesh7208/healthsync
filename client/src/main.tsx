import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import App from './App';
import './styles/index.css';
import './styles/components.css';
import './i18n/config';

export const getApiBaseUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined' && window.location.origin.includes('onrender.com')) {
    return 'https://healthsync-api-1h37.onrender.com';
  }
  return '';
};

axios.defaults.baseURL = getApiBaseUrl();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
