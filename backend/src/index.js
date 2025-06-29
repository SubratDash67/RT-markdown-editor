require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { createServer } = require('http');
const CollaborationServer = require('./websocket/collaborationServer');

const documentsRouter = require('./routes/documents');
const versionsRouter = require('./routes/versions');
const sharesRouter = require('./routes/shares');
const contributionsRouter = require('./routes/contributions');

const app = express();
const server = createServer(app);

// CORS Configuration - THIS IS THE KEY FIX
const allowedOrigins = [
  'https://rtmd.netlify.app',
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.FRONTEND_URL,
  process.env.NETLIFY_URL
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-Requested-With'
  ],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  maxAge: 86400 // 24 hours
};

// Apply CORS before other middleware
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// Security headers (after CORS)
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false,
}));

app.use(express.json());

// Health check endpoint (must be after CORS)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    rooms: collaborationServer ? collaborationServer.getRoomCount() : 0,
    connections: collaborationServer ? collaborationServer.getConnectionCount() : 0,
    cors: 'enabled',
    origin: req.headers.origin || 'no-origin'
  });
});

// API routes
app.use('/api/documents', documentsRouter);
app.use('/api/versions', versionsRouter);
app.use('/api/shares', sharesRouter);
app.use('/api/contributions', contributionsRouter);

const collaborationServer = new CollaborationServer(server);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Allowed CORS origins:`, allowedOrigins);
  console.log(`WebSocket server ready for collaborative editing`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});
