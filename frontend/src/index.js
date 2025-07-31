import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));

// Remove StrictMode to prevent double effect execution which causes issues with WebSocket connections
root.render(<App />);
