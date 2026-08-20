import { asyncHandler } from '../utils/helpers.js';
import ApiError from '../utils/ApiError.js';
import * as cartSvc from '../services/cart.service.js';

const messages = {
  PRODUCT_UNAVAILABLE: 'This product is no longer available.',
  VARIANT_REQUIRED: 'Please select the required options.',
  VARIANT_NOT_FOUND: 'The selected option is not available.',
  OUT_OF_STOCK: 'This item is out of stock.',
  ITEM_NOT_FOUND: 'Item not found in your cart.',
};

function mapError(e) {
  if (messages[e.message]) return ApiError.badRequest(messages[e.message], e.message);
  return e;
}

export const getCart = asyncHandler(async (req, res) => {
  res.json(await cartSvc.serializeCart(req.user.id));
});

export const addItem = asyncHandler(async (req, res) => {
  const { productId, variantId, quantity } = req.body;
  if (!productId) throw ApiError.badRequest('Product is required.');
  try {
    await cartSvc.addToCart(req.user.id, { productId, variantId, quantity: Number(quantity) || 1 });
  } catch (e) { throw mapError(e); }
  res.status(201).json(await cartSvc.serializeCart(req.user.id));
});

export const updateItem = asyncHandler(async (req, res) => {
  const quantity = Number(req.body.quantity);
  if (!quantity || quantity < 1) throw ApiError.badRequest('Quantity must be at least 1.');
  try {
    await cartSvc.updateItem(req.user.id, req.params.itemId, quantity);
  } catch (e) { throw mapError(e); }
  res.json(await cartSvc.serializeCart(req.user.id));
});

export const removeItem = asyncHandler(async (req, res) => {
  await cartSvc.removeItem(req.user.id, req.params.itemId);
  res.json(await cartSvc.serializeCart(req.user.id));
});

// POST /api/cart/merge — merge a guest cart after login (client-driven).
export const mergeCart = asyncHandler(async (req, res) => {
  await cartSvc.mergeGuestCart(req.user.id, req.body.items);
  res.json(await cartSvc.serializeCart(req.user.id));
});
