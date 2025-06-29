import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DocumentProvider } from './contexts/DocumentContext';
import AuthGuard from './components/auth/AuthGuard';
import LoginPage from './components/auth/LoginPage';
import EditorPage from './components/editor/EditorPage';
import SharedDocumentView from './components/sharing/SharedDocumentView';
import ServerWakeupScreen from './components/ui/ServerWakeupScreen';
import './index.css';

function App() {
  const [serverReady, setServerReady] = useState(false);
  const [checkingServer, setCheckingServer] = useState(true);

  useEffect(() => {
    // Always check server in production, skip in development
    if (process.env.NODE_ENV === 'production' && process.env.REACT_APP_API_URL) {
      checkServerHealth();
    } else {
      // In development, assume server is ready
      setServerReady(true);
      setCheckingServer(false);
    }
  }, []);

const checkServerHealth = async () => {
  try {
    console.log('Checking server health at:', process.env.REACT_APP_API_URL);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    const response = await fetch(`${process.env.REACT_APP_API_URL}/health`, {
      method: 'GET',
      mode: 'cors',
      credentials: 'include',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Server is ready:', data);
      setServerReady(true);
    } else {
      console.log('Server not ready, status:', response.status);
      setServerReady(false);
    }
  } catch (error) {
    console.log('Server health check failed:', error.message);
    setServerReady(false);
  } finally {
    setCheckingServer(false);
  }
};

  // Show loading while checking server
  if (checkingServer) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing application...</p>
        </div>
      </div>
    );
  }

  // Show server wakeup screen if server is not ready in production
  if (!serverReady && process.env.NODE_ENV === 'production') {
    return <ServerWakeupScreen onServerReady={() => setServerReady(true)} />;
  }

  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/shared/:shareToken" element={<SharedDocumentView />} />
            <Route 
              path="/editor/:documentId?" 
              element={
                <AuthGuard>
                  <DocumentProvider>
                    <EditorPage />
                  </DocumentProvider>
                </AuthGuard>
              } 
            />
            <Route 
              path="/" 
              element={
                <AuthGuard>
                  <DocumentProvider>
                    <EditorPage />
                  </DocumentProvider>
                </AuthGuard>
              } 
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
