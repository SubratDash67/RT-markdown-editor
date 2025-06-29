import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { Awareness } from 'y-protocols/awareness';
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

    const newYdoc = new Y.Doc();
    const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:5001';
    const newProvider = new WebsocketProvider(wsUrl, `doc-${documentId}`, newYdoc);
    const newAwareness = newProvider.awareness;

    newAwareness.setLocalStateField('user', {
      id: user.id,
      email: user.email,
      name: user.email.split('@')[0],
      color: getUserColor(),
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email.split('@')[0])}&background=random`
    });

    newProvider.on('status', (event) => {
      setIsConnected(event.status === 'connected');
    });

    newAwareness.on('change', () => {
      const users = new Map();
      newAwareness.getStates().forEach((state, clientId) => {
        if (clientId !== newAwareness.clientID && state.user) {
          users.set(clientId, state.user);
        }
      });
      setConnectedUsers(users);
    });

    setYdoc(newYdoc);
    setProvider(newProvider);
    setAwareness(newAwareness);

    return () => {
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
    if (currentDocument?.id) {
      const cleanup = initializeCollaboration(currentDocument.id);
      return cleanup;
    } else {
      destroyCollaboration();
    }
  }, [currentDocument?.id, user]);

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
