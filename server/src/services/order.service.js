import prisma from '../config/db.js';
import ApiError from '../utils/ApiError.js';
import { effectivePrice } from './product.service.js';
import { generateOrderNumber, clearCartTx } from './order.helpers.js';

export const ORDER_STATUSES = [
  'PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED',
];

// Resolve the buyable line items from either the DB cart (logged in) or the
// request body (guest). Returns [{ product, variant, quantity }].
async function resolveLines({ userId, bodyItems }) {
  if (userId) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    const items = cart
      ? await prisma.cartItem.findMany({
          where: { cartId: cart.id },
          include: { product: { include: { images: true } }, variant: true },
        })
      : [];
    return items.map((i) => ({ product: i.product, variant: i.variant, quantity: i.quantity }));
  }
  // guest: validate each referenced product/variant fresh from DB
  const lines = [];
  for (const bi of bodyItems || []) {
    const product = await prisma.product.findUnique({
      where: { id: bi.productId },
      include: { images: true },
    });
    if (!product || !product.active) continue;
    let variant = null;
    if (product.hasVariants) {
      variant = await prisma.productVariant.findFirst({
        where: { id: bi.variantId, productId: product.id },
      });
      if (!variant) continue;
    }
    lines.push({ product, variant, quantity: Math.max(1, Number(bi.quantity) || 1) });
  }
  return lines;
}

// Snapshot the attributes of a variant for the order record.
async function variantAttributes(variantId) {
  if (!variantId) return [];
  const opts = await prisma.variantOption.findMany({
    where: { variantId },
    include: { field: true, option: true },
  });
  return opts.map((o) => ({
    fieldEn: o.field.nameEn,
    fieldAr: o.field.nameAr,
    valueEn: o.option.valueEn,
    valueAr: o.option.valueAr,
  }));
}

export async function createOrder({ userId, customer, bodyItems }) {
  const lines = await resolveLines({ userId, bodyItems });
  if (lines.length === 0) throw ApiError.badRequest('Your cart is empty.', 'EMPTY_CART');

  const settings = await prisma.storeSetting.findUnique({ where: { id: 1 } });
  const currency = settings?.currency ?? 'EGP';

  // Delivery fee is resolved SERVER-SIDE from the chosen governorate (never the
  // client). Prefer the governorate row by id, else match by name, else fall
  // back to the global default fee.
  let governorateRow = null;
  if (customer.governorateId) {
    governorateRow = await prisma.governorateFee.findUnique({ where: { id: customer.governorateId } });
  }
  if (!governorateRow && customer.governorate) {
    governorateRow = await prisma.governorateFee.findFirst({
      where: { OR: [{ nameEn: customer.governorate }, { nameAr: customer.governorate }] },
    });
  }
  const deliveryFee = governorateRow ? governorateRow.fee : (settings?.deliveryFee ?? 0);
  // canonical governorate name stored on the order
  const governorateName = governorateRow ? governorateRow.nameEn : customer.governorate;

  // Pre-compute snapshots (prices always come from the DB, never the client).
  const prepared = [];
  for (const line of lines) {
    const { product, variant, quantity } = line;
    const available = product.hasVariants ? variant?.stock ?? 0 : product.stock;
    if (available < quantity) {
      throw ApiError.conflict(
        `Sorry, "${product.nameEn}" no longer has enough stock.`,
        'INSUFFICIENT_STOCK'
      );
    }
    const unitPrice = effectivePrice(product, variant);
    const image = product.images.find((i) => i.isMain)?.url || product.images[0]?.url || null;
    const attributes = await variantAttributes(variant?.id);
    prepared.push({
      productId: product.id,
      variantId: variant?.id || null,
      nameEn: product.nameEn,
      nameAr: product.nameAr,
      image,
      variantLabel: variant?.label || '',
      attributes,
      unitPrice,
      quantity,
      lineTotal: +(unitPrice * quantity).toFixed(2),
    });
  }

  const subtotal = +prepared.reduce((s, l) => s + l.lineTotal, 0).toFixed(2);
  const total = +(subtotal + deliveryFee).toFixed(2);
  const orderNumber = await generateOrderNumber();

  // Atomic: decrement each stock with a guarded conditional update. If any
  // update affects 0 rows, another buyer took the last unit — abort the whole
  // transaction so stock can never go negative.
  const order = await prisma.$transaction(async (tx) => {
    for (const l of prepared) {
      if (l.variantId) {
        const r = await tx.productVariant.updateMany({
          where: { id: l.variantId, stock: { gte: l.quantity } },
          data: { stock: { decrement: l.quantity } },
        });
        if (r.count === 0) throw ApiError.conflict(`Sorry, "${l.nameEn}" is no longer available.`, 'INSUFFICIENT_STOCK');
      } else {
        const r = await tx.product.updateMany({
          where: { id: l.productId, hasVariants: false, stock: { gte: l.quantity } },
          data: { stock: { decrement: l.quantity } },
        });
        if (r.count === 0) throw ApiError.conflict(`Sorry, "${l.nameEn}" is no longer available.`, 'INSUFFICIENT_STOCK');
      }
      await tx.product.update({
        where: { id: l.productId },
        data: { soldCount: { increment: l.quantity } },
      });
    }

    const created = await tx.order.create({
      data: {
        orderNumber,
        userId: userId || null,
        customerName: customer.customerName,
        phone: customer.phone,
        governorate: governorateName,
        city: customer.city,
        address: customer.address,
        notes: customer.notes || '',
        subtotal,
        deliveryFee,
        total,
        currency,
        status: 'PENDING',
        items: {
          create: prepared.map((l) => ({
            productId: l.productId,
            variantId: l.variantId,
            nameEn: l.nameEn,
            nameAr: l.nameAr,
            image: l.image,
            variantLabel: l.variantLabel,
            attributes: JSON.stringify(l.attributes),
            unitPrice: l.unitPrice,
            quantity: l.quantity,
            lineTotal: l.lineTotal,
          })),
        },
      },
      include: { items: true },
    });

    if (userId) await clearCartTx(tx, userId);
    return created;
  });

  return order;
}

export function serializeOrder(o) {
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    customerName: o.customerName,
    phone: o.phone,
    governorate: o.governorate,
    city: o.city,
    address: o.address,
    notes: o.notes,
    subtotal: o.subtotal,
    deliveryFee: o.deliveryFee,
    total: o.total,
    currency: o.currency,
    createdAt: o.createdAt,
    userId: o.userId,
    items: (o.items || []).map((it) => ({
      id: it.id,
      productId: it.productId,
      nameEn: it.nameEn,
      nameAr: it.nameAr,
      image: it.image,
      variantLabel: it.variantLabel,
      attributes: JSON.parse(it.attributes || '[]'),
      unitPrice: it.unitPrice,
      quantity: it.quantity,
      lineTotal: it.lineTotal,
    })),
  };
}
