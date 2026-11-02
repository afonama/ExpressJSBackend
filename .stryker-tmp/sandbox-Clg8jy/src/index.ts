// @ts-nocheck
import { createApp } from './app.js';
import { env } from './config/env.js';
import { initSocket, closeSocket } from './sockets/manager.js';
import { logger } from './lib/logger.js';
import { createServer } from 'http';

export function startServer(): { server: import('http').Server } {
  const app = createApp();
  const server = createServer(app);
  initSocket(server);
  server.listen(env.port, () => {
    logger.info({ port: env.port, env: env.nodeEnv }, 'Tableflow API listening');
  });
  const shutdown = () => {
    logger.info('Shutting down');
    closeSocket();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 5000).unref();
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  return { server };
}

if (require.main === module) {
  startServer();
}
