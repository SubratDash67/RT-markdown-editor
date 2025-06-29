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

const corsOptions = {
  origin: [
    process.env.FRONTEND_URL,
    process.env.NETLIFY_URL,
    'http://localhost:3000'
  ].filter(Boolean),
  credentials: true,
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    rooms: collaborationServer.getRoomCount(),
    connections: collaborationServer.getConnectionCount()
  });
});

app.use('/api/documents', documentsRouter);
app.use('/api/versions', versionsRouter);
app.use('/api/shares', sharesRouter);
app.use('/api/contributions', contributionsRouter);

const collaborationServer = new CollaborationServer(server);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server ready for collaborative editing`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});
