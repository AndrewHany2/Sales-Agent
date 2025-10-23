import 'dotenv/config';
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
  console.log(`  Facebook:  ${config.baseUrl}:${config.port}/webhook/facebook`);
  console.log(`  Instagram: ${config.baseUrl}:${config.port}/webhook/instagram`);
  console.log(`  Telegram:  ${config.baseUrl}:${config.port}/webhook/telegram`);
  console.log(`  WhatsApp:  ${config.baseUrl}:${config.port}/webhook/whatsapp`);
  console.log(`  Slack:     ${config.baseUrl}:${config.port}/webhook/slack`);
  console.log(`  Twitter:   ${config.baseUrl}:${config.port}/webhook/twitter`);
  console.log(`\nAPI endpoints:`);
  console.log(`  Send:      POST ${config.baseUrl}:${config.port}/api/send`);
  console.log(`  Messages:  GET  ${config.baseUrl}:${config.port}/api/messages`);
  console.log(`  Platforms: GET  ${config.baseUrl}:${config.port}/api/platforms`);
  console.log(`\nAuth endpoints:`);
  console.log(`  Auth URLs: GET  ${config.baseUrl}:${config.port}/auth/urls`);
  console.log(`  Status:    GET  ${config.baseUrl}:${config.port}/auth/status`);
  console.log(`  Test:      POST ${config.baseUrl}:${config.port}/auth/test/:platform`);
});

export { app, server, platformManager, messageBus };
