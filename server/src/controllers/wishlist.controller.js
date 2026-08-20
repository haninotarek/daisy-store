import prisma from '../config/db.js';
import { asyncHandler } from '../utils/helpers.js';
import { productInclude, serializeProduct } from '../services/product.service.js';

export const getWishlist = asyncHandler(async (req, res) => {
  const items = await prisma.wishlistItem.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
  });
  const ids = items.map((i) => i.productId);
  const products = ids.length
    ? await prisma.product.findMany({ where: { id: { in: ids }, active: true }, include: productInclude })
    : [];
  // preserve wishlist order
  const byId = Object.fromEntries(products.map((p) => [p.id, p]));
  const ordered = ids.map((id) => byId[id]).filter(Boolean).map(serializeProduct);
  res.json({ items: ordered, productIds: ids });
});

export const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  await prisma.wishlistItem.upsert({
    where: { userId_productId: { userId: req.user.id, productId } },
    create: { userId: req.user.id, productId },
    update: {},
  });
  res.status(201).json({ ok: true });
});

export const removeFromWishlist = asyncHandler(async (req, res) => {
  await prisma.wishlistItem.deleteMany({
    where: { userId: req.user.id, productId: req.params.productId },
  });
  res.json({ ok: true });
});
