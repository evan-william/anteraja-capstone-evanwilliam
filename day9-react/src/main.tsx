import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { ShipmentProvider } from './context/ShipmentContext';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ShipmentProvider><App /></ShipmentProvider>
  </React.StrictMode>,
);
