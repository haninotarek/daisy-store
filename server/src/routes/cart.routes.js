import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getCart, addItem, updateItem, removeItem, mergeCart } from '../controllers/cart.controller.js';

const r = Router();
r.use(requireAuth); // cart is per-user; guests use localStorage on the client
r.get('/', getCart);
r.post('/', addItem);
r.post('/merge', mergeCart);
r.put('/:itemId', updateItem);
r.delete('/:itemId', removeItem);
export default r;
