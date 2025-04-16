import './app-info';
import React from 'react';
import ReactDOM from 'react-dom/client';
// BrowserRouter removed
import App from './App.tsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* BrowserRouter removed */}
    <App />
  </React.StrictMode>,
);
