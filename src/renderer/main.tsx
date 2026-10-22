import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles/index.css';
import { setupBrowserMockApi } from './mocks/mockElectronApi';

// If running in browser preview mode, initialize mock API
setupBrowserMockApi();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
