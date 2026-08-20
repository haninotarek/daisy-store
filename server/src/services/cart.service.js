import prisma from '../config/db.js';
import { effectivePrice } from './product.service.js';

const itemInclude = {
  product: { include: { images: { orderBy: { displayOrder: 'asc' } } } },
  variant: { include: { options: { include: { field: true, option: true } } } },
};

export async function getOrCreateCart(userId) {
  let cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) cart = await prisma.cart.create({ data: { userId } });
  return cart;
}

// Build a display line for a cart item, computing live price and availability.
function serializeItem(item) {
  const p = item.product;
  const variant = item.variant;
  const unitPrice = effectivePrice(p, variant);
  const available = variant ? variant.stock : p.stock;
  const image = p.images.find((i) => i.isMain)?.url || p.images[0]?.url || null;
  return {
    id: item.id,
    productId: p.id,
    slug: p.slug,
    nameEn: p.nameEn,
    nameAr: p.nameAr,
    image,
    variantId: variant?.id || null,
    variantLabel: variant?.label || '',
    attributes: variant
      ? variant.options.map((o) => ({
          fieldNameEn: o.field.nameEn,
          fieldNameAr: o.field.nameAr,
          valueEn: o.option.valueEn,
          valueAr: o.option.valueAr,
        }))
      : [],
    unitPrice,
    quantity: item.quantity,
    available,
    lineTotal: +(unitPrice * item.quantity).toFixed(2),
    outOfStock: available <= 0,
    exceedsStock: item.quantity > available,
  };
}

export async function serializeCart(userId) {
  const cart = await getOrCreateCart(userId);
  const items = await prisma.cartItem.findMany({
    where: { cartId: cart.id },
    include: itemInclude,
    orderBy: { createdAt: 'asc' },
  });
  const lines = items.map(serializeItem);
  const subtotal = +lines.reduce((s, l) => s + (l.outOfStock ? 0 : l.lineTotal), 0).toFixed(2);
  return { items: lines, subtotal, count: lines.reduce((s, l) => s + l.quantity, 0) };
}

// Add or increment an item, clamping to available stock.
export async function addToCart(userId, { productId, variantId, quantity = 1 }) {
  const cart = await getOrCreateCart(userId);
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { variants: true },
  });
  if (!product || !product.active) throw new Error('PRODUCT_UNAVAILABLE');

  let available;
  if (product.hasVariants) {
    if (!variantId) throw new Error('VARIANT_REQUIRED');
    const variant = product.variants.find((v) => v.id === variantId);
    if (!variant) throw new Error('VARIANT_NOT_FOUND');
    available = variant.stock;
  } else {
    variantId = null;
    available = product.stock;
  }
  if (available <= 0) throw new Error('OUT_OF_STOCK');

  const existing = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, productId, variantId },
  });
  const desired = (existing?.quantity || 0) + quantity;
  const qty = Math.min(desired, available);
  if (existing) {
    await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: qty } });
  } else {
    await prisma.cartItem.create({ data: { cartId: cart.id, productId, variantId, quantity: qty } });
  }
}

export async function updateItem(userId, itemId, quantity) {
  const cart = await getOrCreateCart(userId);
  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, cartId: cart.id },
    include: { product: true, variant: true },
  });
  if (!item) throw new Error('ITEM_NOT_FOUND');
  const available = item.variant ? item.variant.stock : item.product.stock;
  const qty = Math.max(1, Math.min(quantity, available));
  await prisma.cartItem.update({ where: { id: item.id }, data: { quantity: qty } });
}

export async function removeItem(userId, itemId) {
  const cart = await getOrCreateCart(userId);
  await prisma.cartItem.deleteMany({ where: { id: itemId, cartId: cart.id } });
}

export async function clearCart(userId, tx = prisma) {
  const cart = await tx.cart.findUnique({ where: { userId } });
  if (cart) await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
}

// Merge a guest's localStorage cart into their DB cart on login/register.
export async function mergeGuestCart(userId, guestItems) {
  if (!Array.isArray(guestItems)) return;
  for (const gi of guestItems) {
    try {
      await addToCart(userId, {
        productId: gi.productId,
        variantId: gi.variantId || null,
        quantity: gi.quantity || 1,
      });
    } catch {
      /* skip invalid/unavailable guest items */
    }
  }
}
