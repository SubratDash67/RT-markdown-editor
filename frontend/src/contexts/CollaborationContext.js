import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as Y from 'yjs'; // Correct import
import { WebsocketProvider } from 'y-websocket';
import { useAuth } from './AuthContext';
import { useDocument } from './DocumentContext';

const CollaborationContext = createContext();

export const useCollaboration = () => {
  const context = useContext(CollaborationContext);
  if (!context) {
    throw new Error('useCollaboration must be used within a CollaborationProvider');
  }
  return context;
};

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
];

export const CollaborationProvider = ({ children }) => {
  const { user } = useAuth();
  const { currentDocument } = useDocument();
  const [ydoc, setYdoc] = useState(null);
  const [provider, setProvider] = useState(null);
  const [awareness, setAwareness] = useState(null);
  const [connectedUsers, setConnectedUsers] = useState(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const userColorRef = useRef(null);

  const getUserColor = () => {
    if (!userColorRef.current && user) {
      const colorIndex = Math.abs(user.id.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0)) % COLORS.length;
      userColorRef.current = COLORS[colorIndex];
    }
    return userColorRef.current || COLORS[0];
  };

  const initializeCollaboration = (documentId) => {
    if (!user || !documentId) return;

    console.log('Initializing collaboration for document:', documentId);

    const newYdoc = new Y.Doc(); // Use Y.Doc correctly
    
    // Fix WebSocket URL configuration
    const wsUrl = process.env.REACT_APP_WS_URL || 
                  (process.env.NODE_ENV === 'production' 
                    ? 'wss://rtmd-backend.onrender.com' 
                    : 'ws://localhost:5000');
    
    console.log('Connecting to WebSocket:', wsUrl);
    
    const newProvider = new WebsocketProvider(wsUrl, `doc-${documentId}`, newYdoc, {
      connect: true,
      resyncInterval: 5000,
      maxBackoffTime: 30000,
    });
    const newAwareness = newProvider.awareness;

    newAwareness.setLocalStateField('user', {
      id: user.id,
      email: user.email,
      name: user.email.split('@')[0],
      color: getUserColor(),
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email.split('@')[0])}&background=random`
    });

    newProvider.on('status', (event) => {
      console.log('WebSocket status:', event.status);
      setIsConnected(event.status === 'connected');
      
      if (event.status === 'disconnected' || event.status === 'connecting') {
        console.log('WebSocket attempting to reconnect...');
      }
    });

    newProvider.on('connection-error', (error) => {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
    });

    newProvider.on('sync', (isSynced) => {
      console.log('Document sync status:', isSynced);
    });

    newAwareness.on('change', () => {
      const users = new Map();
      newAwareness.getStates().forEach((state, clientId) => {
        if (clientId !== newAwareness.clientID && state.user) {
          users.set(clientId, state.user);
        }
      });
      setConnectedUsers(users);
      console.log('Connected users:', users.size);
    });

    setYdoc(newYdoc);
    setProvider(newProvider);
    setAwareness(newAwareness);

    return () => {
      console.log('Cleaning up collaboration for document:', documentId);
      newProvider.destroy();
      newYdoc.destroy();
    };
  };

  const destroyCollaboration = () => {
    if (provider) {
      provider.destroy();
      setProvider(null);
    }
    if (ydoc) {
      ydoc.destroy();
      setYdoc(null);
    }
    setAwareness(null);
    setConnectedUsers(new Map());
    setIsConnected(false);
  };

  useEffect(() => {
    if (currentDocument?.id && user) {
      const cleanup = initializeCollaboration(currentDocument.id);
      return cleanup;
    } else {
      destroyCollaboration();
    }
  }, [currentDocument?.id, user?.id]); // Only depend on IDs to prevent unnecessary reinitializations

  useEffect(() => {
    return () => {
      destroyCollaboration();
    };
  }, []);

  const value = {
    ydoc,
    provider,
    awareness,
    connectedUsers,
    isConnected,
    userColor: getUserColor(),
    initializeCollaboration,
    destroyCollaboration,
  };

  return (
    <CollaborationContext.Provider value={value}>
      {children}
    </CollaborationContext.Provider>
  );
};
