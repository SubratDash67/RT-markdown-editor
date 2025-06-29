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
    // Only show wakeup screen in production
    if (process.env.NODE_ENV === 'production') {
      checkServerHealth();
    } else {
      setServerReady(true);
      setCheckingServer(false);
    }
  }, []);

  const checkServerHealth = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/health`, {
        method: 'GET',
        timeout: 5000,
      });
      
      if (response.ok) {
        setServerReady(true);
      }
    } catch (error) {
      // Server needs wakeup
      setServerReady(false);
    } finally {
      setCheckingServer(false);
    }
  };

  if (checkingServer) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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
