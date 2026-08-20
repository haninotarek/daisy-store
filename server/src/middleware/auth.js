import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
import ApiError from '../utils/ApiError.js';

export function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
}

// Attaches req.user if a valid token is present. Does NOT reject when absent
// (used for optional-auth routes like cart, which support guests).
export async function optionalAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({ where: { id: payload.id } });
      if (user) req.user = { id: user.id, role: user.role, name: user.name, email: user.email };
    } catch {
      /* ignore invalid token for optional routes */
    }
  }
  next();
}

export function requireAuth(req, _res, next) {
  if (!req.user) return next(ApiError.unauthorized('Please sign in to continue.'));
  next();
}

export function requireAdmin(req, _res, next) {
  if (!req.user) return next(ApiError.unauthorized('Please sign in to continue.'));
  if (req.user.role !== 'ADMIN') return next(ApiError.forbidden('Admin access required.'));
  next();
}
