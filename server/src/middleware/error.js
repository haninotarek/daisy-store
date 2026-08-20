import { ZodError } from 'zod';
import ApiError from '../utils/ApiError.js';

export function notFound(req, res) {
  res.status(404).json({ error: 'Route not found', path: req.originalUrl });
}

// Central error handler — never leaks stack traces / internals to clients.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Please check the highlighted fields.',
      code: 'VALIDATION',
      fields: err.errors.map((e) => ({ path: e.path.join('.'), message: e.message })),
    });
  }
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ error: err.message, code: err.code });
  }
  // Prisma unique constraint
  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'That value already exists.', code: 'DUPLICATE' });
  }
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.error(err);
  }
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
}
