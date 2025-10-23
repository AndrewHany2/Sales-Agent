# Social Media Unified Backend

A TypeScript-based backend service that unifies multiple social media messaging platforms into a single API.

## Features

✅ **Multi-Platform Support**

- Facebook Messenger
- Instagram DMs
- WhatsApp Business
- Telegram
- Slack
- Twitter DMs

✅ **Core Functionality**

- Receive messages via webhooks
- Send messages via unified API
- Real-time updates with Socket.IO
- Event-driven architecture
- Type-safe with TypeScript

## Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your credentials
```

## Available Scripts

```bash
# Development
npm run dev              # Start dev server with ts-node-dev
npm run dev:watch        # Start dev server with nodemon

# Building
npm run build            # Compile TypeScript to JavaScript
npm run clean            # Remove dist folder
npm run type-check       # Check types without emitting

# Production
npm start                # Run compiled code
npm run start:prod       # Run with NODE_ENV=production

# Code Quality
npm run lint             # Lint TypeScript files
npm run lint:fix         # Lint and fix issues
npm run format           # Format code with Prettier
npm run format:check     # Check code formatting

# Testing
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report
```

## Project Structure

```
project-root/
├── src/
│   ├── config/           # Configuration files
│   ├── types/            # TypeScript type definitions
│   ├── adapters/         # Platform-specific adapters
│   ├── services/         # Business logic services
│   ├── routes/           # Express routes
│   ├── middleware/       # Express middleware
│   ├── utils/            # Utility functions
│   ├── app.ts            # Express app setup
│   └── server.ts         # Server entry point
├── dist/                 # Compiled JavaScript
├── .env                  # Environment variables
├── tsconfig.json         # TypeScript config
├── package.json          # Dependencies and scripts
└── README.md             # Documentation
```

## API Usage

### Send Message

```bash
curl -X POST http://localhost:3000/api/send \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "telegram",
    "recipient": "123456789",
    "text": "Hello!"
  }'
```

### Get Messages

```bash
curl http://localhost:3000/api/messages?limit=20&platform=telegram
```

### Health Check

```bash
curl http://localhost:3000/health
```

## WebSocket

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000');

socket.on('message', (message) => {
  console.log('New message:', message);
});
```

## License

MIT
