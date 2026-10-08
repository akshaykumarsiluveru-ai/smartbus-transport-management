import jwt from 'jsonwebtoken';

/**
 * Socket.IO Handshake Authentication Middleware
 * Authenticates socket connection via JWT provided in handshake auth or headers
 */
export const socketAuthMiddleware = (socket, next) => {
  try {
    let token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;

    if (!token) {
      const err = new Error('SOCKET_AUTH_REQUIRED: Authentication token missing.');
      err.data = { code: 'SOCKET_AUTH_REQUIRED', message: 'Authentication token missing.' };
      return next(err);
    }

    // Strip "Bearer " prefix if present
    if (typeof token === 'string' && token.startsWith('Bearer ')) {
      token = token.slice(7).trim();
    }

    const secret = process.env.JWT_SECRET || 'smartbus_development_jwt_secret_key_2026';
    const decoded = jwt.verify(token, secret);

    if (!decoded || !decoded.id || !decoded.role) {
      const err = new Error('SOCKET_AUTH_INVALID: Invalid token claims.');
      err.data = { code: 'SOCKET_AUTH_INVALID', message: 'Invalid token claims.' };
      return next(err);
    }

    // Attach verified identity to socket (Never trust arbitrary client event payloads)
    socket.user = {
      id: decoded.id,
      email: decoded.email || '',
      role: decoded.role.toLowerCase(),
      name: decoded.name || '',
    };

    next();
  } catch (error) {
    const err = new Error('SOCKET_AUTH_INVALID: Invalid or expired token.');
    err.data = { code: 'SOCKET_AUTH_INVALID', message: 'Invalid or expired token.' };
    return next(err);
  }
};
