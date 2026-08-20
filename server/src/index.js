import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.routes.js';
import publicRoutes from './routes/public.routes.js';
import cartRoutes from './routes/cart.routes.js';
import wishlistRoutes from './routes/wishlist.routes.js';
import orderRoutes from './routes/order.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { optionalAuth } from './middleware/auth.js';
import { notFound, errorHandler } from './middleware/error.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.set('trust proxy', 1);
// CORS: if CLIENT_URL is unset or "*", reflect any origin; otherwise allow the
// listed comma-separated origins (trailing slashes tolerated).
const clientUrl = process.env.CLIENT_URL?.trim();
const corsOrigin = !clientUrl || clientUrl === '*'
  ? true
  : clientUrl.split(',').map((s) => s.trim().replace(/\/$/, ''));
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json({ limit: '2mb' }));

// Serve locally-stored uploads (skipped when Cloudinary is used).
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Basic rate limiting on auth + order creation to deter abuse.
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false });
app.use('/api/auth', authLimiter);

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'daisy-api' }));

// Populate req.user (if a valid token is present) for EVERY /api route,
// including /api/auth/me. requireAuth/requireAdmin then read req.user.
app.use('/api', optionalAuth);

app.use('/api/auth', authRoutes);
app.use('/api', publicRoutes); // public reads
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`\n  Daisy API running on http://localhost:${PORT}\n`);
});
