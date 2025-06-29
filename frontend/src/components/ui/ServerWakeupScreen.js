import React, { useState, useEffect } from 'react';
import { Server, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const ServerWakeupScreen = ({ onServerReady }) => {
  const [status, setStatus] = useState('checking');
  const [attempt, setAttempt] = useState(0);
  const [message, setMessage] = useState('Checking server status...');

  useEffect(() => {
    checkServerStatus();
  }, []);

const checkServerStatus = async () => {
  try {
    setStatus('checking');
    setMessage('Connecting to server...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(`${process.env.REACT_APP_API_URL}/health`, {
      method: 'GET',
      mode: 'cors', // Explicitly set CORS mode
      credentials: 'include', // Include credentials
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Server health check successful:', data);
      setStatus('ready');
      setMessage('Server is ready!');
      setTimeout(() => onServerReady(), 1000);
      return;
    } else {
      throw new Error(`Server responded with status: ${response.status}`);
    }
  }  catch (error) {
      console.log('Server health check failed:', error.message);
      
      if (error.name === 'AbortError') {
        setMessage('Connection timeout. Server is starting up...');
      } else {
        setMessage('Server is starting up... This may take up to 60 seconds.');
      }
      
      setStatus('waking');
      setAttempt(prev => prev + 1);
      
      // Retry with exponential backoff
      const retryDelay = Math.min(5000 + (attempt * 2000), 15000); // Max 15 seconds
      
      setTimeout(() => {
        if (attempt < 15) { // Max 15 attempts
          checkServerStatus();
        } else {
          setStatus('error');
          setMessage('Server failed to start. Please try refreshing the page.');
        }
      }, retryDelay);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'checking':
        return <Loader2 className="w-8 h-8 animate-spin text-blue-600" />;
      case 'waking':
        return <Server className="w-8 h-8 text-orange-600 animate-pulse" />;
      case 'ready':
        return <CheckCircle className="w-8 h-8 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-8 h-8 text-red-600" />;
      default:
        return <Loader2 className="w-8 h-8 animate-spin text-blue-600" />;
    }
  };

  const getProgressWidth = () => {
    if (status === 'ready') return '100%';
    if (status === 'error') return '100%';
    return `${Math.min((attempt / 15) * 100, 95)}%`;
  };

  return (
    <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="mb-6">
            {getStatusIcon()}
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {status === 'checking' && 'Connecting...'}
            {status === 'waking' && 'Starting Server'}
            {status === 'ready' && 'Ready!'}
            {status === 'error' && 'Connection Failed'}
          </h2>
          
          <p className="text-gray-600 mb-6">{message}</p>
          
          {(status === 'checking' || status === 'waking') && (
            <div className="mb-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: getProgressWidth() }}
                />
              </div>
              {status === 'waking' && (
                <p className="text-sm text-gray-500 mt-2">
                  Attempt {attempt} of 15 • Estimated time: {Math.ceil(attempt * 2)} seconds
                </p>
              )}
            </div>
          )}
          
          {status === 'waking' && (
            <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded-lg mb-4">
              <p className="mb-1">🚀 <strong>Free tier servers sleep when inactive</strong></p>
              <p>The server is waking up and will be ready shortly.</p>
            </div>
          )}
          
          {status === 'error' && (
            <div className="space-y-3">
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                <p>Unable to connect to the server. This could be due to:</p>
                <ul className="list-disc list-inside mt-2 text-left">
                  <li>Server is taking longer than usual to start</li>
                  <li>Network connectivity issues</li>
                  <li>Server configuration problems</li>
                </ul>
              </div>
              <button
                onClick={() => {
                  setAttempt(0);
                  setStatus('checking');
                  checkServerStatus();
                }}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors mr-2"
              >
                Retry
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServerWakeupScreen;
