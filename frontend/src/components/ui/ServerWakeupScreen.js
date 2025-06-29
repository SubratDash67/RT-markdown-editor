import React, { useState, useEffect } from 'react';
import { Server, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { apiClient } from '../../utils/apiClient';

const ServerWakeupScreen = ({ onServerReady }) => {
  const [status, setStatus] = useState('checking'); // checking, waking, ready, error
  const [attempt, setAttempt] = useState(0);
  const [message, setMessage] = useState('Checking server status...');

  useEffect(() => {
    checkServerStatus();
  }, []);

  const checkServerStatus = async () => {
    try {
      setStatus('checking');
      setMessage('Connecting to server...');
      
      const response = await fetch(`${process.env.REACT_APP_API_URL}/health`, {
        method: 'GET',
        timeout: 10000,
      });
      
      if (response.ok) {
        setStatus('ready');
        setMessage('Server is ready!');
        setTimeout(() => onServerReady(), 1000);
      } else {
        throw new Error('Server not ready');
      }
    } catch (error) {
      setStatus('waking');
      setAttempt(prev => prev + 1);
      setMessage('Server is starting up... This may take up to 60 seconds.');
      
      // Retry every 5 seconds
      setTimeout(() => {
        if (attempt < 20) { // Max 20 attempts (100 seconds)
          checkServerStatus();
        } else {
          setStatus('error');
          setMessage('Server failed to start. Please try refreshing the page.');
        }
      }, 5000);
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
    return `${Math.min((attempt / 20) * 100, 95)}%`;
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
                  Attempt {attempt} of 20
                </p>
              )}
            </div>
          )}
          
          {status === 'waking' && (
            <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded-lg">
              <p className="mb-1">🚀 <strong>Free tier servers sleep when inactive</strong></p>
              <p>The server is waking up and will be ready shortly.</p>
            </div>
          )}
          
          {status === 'error' && (
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServerWakeupScreen;
