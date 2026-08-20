import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getWishlist, addToWishlist, removeFromWishlist } from '../controllers/wishlist.controller.js';

const r = Router();
r.use(requireAuth);
r.get('/', getWishlist);
r.post('/', addToWishlist);
r.delete('/:productId', removeFromWishlist);
export default r;
