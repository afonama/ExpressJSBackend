import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { logger } from '../lib/logger.js';
import { verifyAccessToken } from '../lib/jwt.js';
import { env } from '../config/env.js';

let io: SocketIOServer | null = null;

export const CH = {
  orders: 'orders',
  tables: 'tables',
  assistance: 'assistance',
  bills: 'bills'
} as const;

export type Channel = (typeof CH)[keyof typeof CH];

export function initSocket(server: HttpServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: env.corsOrigins,
      credentials: true
    }
  });

  io.use((socket, next) => {
    const auth = socket.handshake.auth;
    const token =
      (auth && typeof auth === 'object' && typeof auth.token === 'string' ? auth.token : undefined) ??
      (socket.handshake.headers.authorization?.startsWith('Bearer ')
        ? socket.handshake.headers.authorization.slice(7)
        : undefined);
    if (!token) {
      next();
      return;
    }
    try {
      const payload = verifyAccessToken(token);
      socket.data.user = { id: payload.sub, role: payload.role };
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user;
    const role: string | undefined =
      user && typeof user === 'object' && 'role' in user && typeof user.role === 'string'
        ? user.role
        : undefined;
    if (role === 'admin' || role === 'waiter') {
      socket.join([CH.orders, CH.tables, CH.assistance, CH.bills]);
    }
    socket.on('join:table', (tableId: unknown) => {
      if (typeof tableId === 'string') socket.join(`table:${tableId}`);
    });
    socket.on('disconnect', () => {
      logger.debug({ socketId: socket.id }, 'socket disconnected');
    });
  });

  logger.info('Socket.IO initialized');
  return io;
}

export function getIo(): SocketIOServer | null {
  return io;
}

export function broadcast(channel: Channel | `table:${string}`, event: string, payload: unknown): void {
  if (!io) {
    if (!env.isTest) logger.warn({ channel, event }, 'broadcast called before socket server initialized');
    return;
  }
  io.to(channel).emit(event, payload);
}

export function closeSocket(): void {
  if (io) {
    io.close();
    io = null;
  }
}
