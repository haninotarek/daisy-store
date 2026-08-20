import { Router } from 'express';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { placeOrder, myOrders, getOrder } from '../controllers/order.controller.js';

const r = Router();
// Guests can place orders (optionalAuth attaches user if logged in).
r.post('/', optionalAuth, placeOrder);
r.get('/', requireAuth, myOrders);
// Order-number lookup: optional auth so guests can view their fresh order.
r.get('/:orderNumber', optionalAuth, getOrder);
export default r;
