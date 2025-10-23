import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createApp } from './app';
import { config } from './config';
import { Logger } from './utils/logger';

const { app, messageBus, platformManager } = createApp();

// Create HTTP server
const server = http.createServer(app);

// Setup Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  Logger.info('Client connected', { socketId: socket.id });

  socket.on('disconnect', () => {
    Logger.info('Client disconnected', { socketId: socket.id });
  });
});

// Broadcast messages to all connected clients
messageBus.on('message', (message) => {
  io.emit('message', message);
});

// Start server
server.listen(config.port, () => {
  Logger.info(`🚀 Social Media Unified Backend running on port ${config.port}`);
  Logger.info(`Enabled platforms: ${platformManager.getEnabledPlatforms().join(', ')}`);
  console.log(`\nWebhook endpoints:`);
  console.log(`  Facebook:  http://localhost:${config.port}/webhook/facebook`);
  console.log(`  Instagram: http://localhost:${config.port}/webhook/instagram`);
  console.log(`  Telegram:  http://localhost:${config.port}/webhook/telegram`);
  console.log(`  WhatsApp:  http://localhost:${config.port}/webhook/whatsapp`);
  console.log(`  Slack:     http://localhost:${config.port}/webhook/slack`);
  console.log(`  Twitter:   http://localhost:${config.port}/webhook/twitter`);
  console.log(`\nAPI endpoints:`);
  console.log(`  Send:      POST http://localhost:${config.port}/api/send`);
  console.log(`  Messages:  GET  http://localhost:${config.port}/api/messages`);
  console.log(`  Platforms: GET  http://localhost:${config.port}/api/platforms`);
});

export { app, server, platformManager, messageBus };
