const WebSocket = require('ws');
const { setupWSConnection } = require('y-websocket/bin/utils');
const { supabase } = require('../utils/supabase');

class CollaborationServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ 
      server,
      verifyClient: (info) => {
        // Allow connections from any origin for now
        console.log('WebSocket connection from:', info.origin);
        return true;
      }
    });
    this.rooms = new Map();
    this.setupWebSocketServer();
  }

  setupWebSocketServer() {
    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });

    this.wss.on('error', (error) => {
      console.error('WebSocket server error:', error);
    });

    console.log('Collaboration WebSocket server initialized');
  }

  handleConnection(ws, req) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const roomName = url.searchParams.get('room') || url.pathname.replace('/', '') || 'default';
    
    console.log(`New connection to room: ${roomName} from ${req.headers.origin || 'unknown origin'}`);

    if (!this.rooms.has(roomName)) {
      this.rooms.set(roomName, new Set());
    }
    
    this.rooms.get(roomName).add(ws);

    ws.on('close', () => {
      const room = this.rooms.get(roomName);
      if (room) {
        room.delete(ws);
        if (room.size === 0) {
          this.rooms.delete(roomName);
        }
      }
      console.log(`Connection closed for room: ${roomName}`);
    });

    ws.on('error', (error) => {
      console.error(`WebSocket error in room ${roomName}:`, error);
    });

    // Setup Y.js WebSocket connection with better error handling
    try {
      setupWSConnection(ws, req, {
        docName: roomName,
        gc: true,
        gcFilter: () => false, // Keep all history for now
      });
    } catch (error) {
      console.error('Failed to setup WebSocket connection:', error);
      ws.close(1011, 'Server error during setup');
    }
  }

  getRoomCount() {
    return this.rooms.size;
  }

  getConnectionCount() {
    let total = 0;
    this.rooms.forEach(room => {
      total += room.size;
    });
    return total;
  }

  getRoomInfo(roomName) {
    const room = this.rooms.get(roomName);
    return {
      exists: !!room,
      connections: room ? room.size : 0,
    };
  }
}

module.exports = CollaborationServer;
