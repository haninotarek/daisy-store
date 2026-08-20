import prisma from '../../config/db.js';
import ApiError from '../../utils/ApiError.js';
import { asyncHandler } from '../../utils/helpers.js';
import { serializeOrder, ORDER_STATUSES } from '../../services/order.service.js';

// ---------- Dashboard ----------
export const dashboard = asyncHandler(async (_req, res) => {
  const settings = await prisma.storeSetting.findUnique({ where: { id: 1 } });
  const threshold = settings?.lowStockThreshold ?? 5;

  const [totalProducts, totalOrders, statusGroups, products, variants] = await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
    prisma.order.groupBy({ by: ['status'], _count: true }),
    prisma.product.findMany({ where: { hasVariants: false }, select: { id: true, nameEn: true, nameAr: true, stock: true, slug: true } }),
    prisma.productVariant.findMany({ include: { product: { select: { nameEn: true, nameAr: true, slug: true } } } }),
  ]);

  const byStatus = Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0]));
  statusGroups.forEach((g) => { byStatus[g.status] = g._count; });

  const lowStock = [];
  const outOfStock = [];
  products.forEach((p) => {
    if (p.stock === 0) outOfStock.push({ ...p, type: 'product' });
    else if (p.stock <= threshold) lowStock.push({ ...p, type: 'product' });
  });
  variants.forEach((v) => {
    const entry = { id: v.id, nameEn: v.product.nameEn, nameAr: v.product.nameAr, slug: v.product.slug, label: v.label, stock: v.stock, type: 'variant' };
    if (v.stock === 0) outOfStock.push(entry);
    else if (v.stock <= threshold) lowStock.push(entry);
  });

  const revenueAgg = await prisma.order.aggregate({
    _sum: { total: true }, where: { status: { in: ['CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED'] } },
  });

  const recentOrders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' }, take: 8, include: { items: true },
  });

  res.json({
    stats: {
      totalProducts, totalOrders,
      pending: byStatus.PENDING, confirmed: byStatus.CONFIRMED, preparing: byStatus.PREPARING,
      shipped: byStatus.SHIPPED, delivered: byStatus.DELIVERED, cancelled: byStatus.CANCELLED,
      lowStock: lowStock.length, outOfStock: outOfStock.length,
      revenue: revenueAgg._sum.total || 0, currency: settings?.currency || 'EGP',
    },
    lowStockItems: lowStock.slice(0, 20),
    outOfStockItems: outOfStock.slice(0, 20),
    recentOrders: recentOrders.map(serializeOrder),
  });
});

// ---------- Orders ----------
export const listOrders = asyncHandler(async (req, res) => {
  const { search, status, page = 1, limit = 20 } = req.query;
  const take = Math.min(Number(limit) || 20, 100);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;
  const where = {};
  if (status && ORDER_STATUSES.includes(status)) where.status = status;
  if (search) where.OR = [
    { orderNumber: { contains: search } },
    { customerName: { contains: search } },
    { phone: { contains: search } },
  ];
  const [rows, total] = await Promise.all([
    prisma.order.findMany({ where, include: { items: true }, orderBy: { createdAt: 'desc' }, skip, take }),
    prisma.order.count({ where }),
  ]);
  res.json({ orders: rows.map(serializeOrder), pagination: { page: Number(page), limit: take, total, pages: Math.ceil(total / take) } });
});

export const getOrder = asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id }, include: { items: true, user: true } });
  if (!order) throw ApiError.notFound('Order not found.');
  res.json({ order: { ...serializeOrder(order), userEmail: order.user?.email || null } });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!ORDER_STATUSES.includes(status)) throw ApiError.badRequest('Invalid status.');
  const existing = await prisma.order.findUnique({ where: { id: req.params.id }, include: { items: true } });
  if (!existing) throw ApiError.notFound('Order not found.');

  // Restock when cancelling an order that was not already cancelled.
  if (status === 'CANCELLED' && existing.status !== 'CANCELLED') {
    await prisma.$transaction(async (tx) => {
      for (const it of existing.items) {
        if (it.variantId) await tx.productVariant.updateMany({ where: { id: it.variantId }, data: { stock: { increment: it.quantity } } });
        else if (it.productId) await tx.product.updateMany({ where: { id: it.productId, hasVariants: false }, data: { stock: { increment: it.quantity } } });
        if (it.productId) await tx.product.updateMany({ where: { id: it.productId }, data: { soldCount: { decrement: it.quantity } } });
      }
      await tx.order.update({ where: { id: existing.id }, data: { status } });
    });
  } else {
    await prisma.order.update({ where: { id: existing.id }, data: { status } });
  }
  const updated = await prisma.order.findUnique({ where: { id: existing.id }, include: { items: true } });
  res.json({ order: serializeOrder(updated) });
});

// ---------- Customers ----------
export const listCustomers = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;
  const take = Math.min(Number(limit) || 20, 100);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;
  const where = { role: 'CUSTOMER' };
  if (search) where.OR = [{ name: { contains: search } }, { email: { contains: search } }, { phone: { contains: search } }];
  const [rows, total] = await Promise.all([
    prisma.user.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take, include: { _count: { select: { orders: true } } } }),
    prisma.user.count({ where }),
  ]);
  res.json({
    customers: rows.map((u) => ({ id: u.id, name: u.name, email: u.email, phone: u.phone, orders: u._count.orders, createdAt: u.createdAt })),
    pagination: { page: Number(page), limit: take, total, pages: Math.ceil(total / take) },
  });
});

// ---------- Settings ----------
export const getSettings = asyncHandler(async (_req, res) => {
  const s = await prisma.storeSetting.findUnique({ where: { id: 1 } });
  res.json({ settings: s });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const fields = ['storeName', 'logo', 'whatsapp', 'instagram', 'facebook', 'phone', 'email', 'address', 'currency'];
  const data = {};
  for (const f of fields) if (f in req.body) data[f] = req.body[f];
  if ('deliveryFee' in req.body) data.deliveryFee = Number(req.body.deliveryFee) || 0;
  if ('lowStockThreshold' in req.body) data.lowStockThreshold = Number(req.body.lowStockThreshold) || 0;
  const s = await prisma.storeSetting.update({ where: { id: 1 }, data });
  res.json({ settings: s });
});

// ---------- Governorate delivery fees ----------
export const listGovernorateFees = asyncHandler(async (_req, res) => {
  const rows = await prisma.governorateFee.findMany({ orderBy: { displayOrder: 'asc' } });
  res.json({ governorates: rows });
});

// Bulk-save fees/active flags. Body: { governorates: [{ id, fee, active }] }
export const updateGovernorateFees = asyncHandler(async (req, res) => {
  const list = Array.isArray(req.body.governorates) ? req.body.governorates : [];
  for (const g of list) {
    if (!g.id) continue;
    await prisma.governorateFee.update({
      where: { id: g.id },
      data: {
        fee: g.fee != null ? Math.max(0, Number(g.fee) || 0) : undefined,
        active: g.active != null ? Boolean(g.active) : undefined,
      },
    });
  }
  const rows = await prisma.governorateFee.findMany({ orderBy: { displayOrder: 'asc' } });
  res.json({ governorates: rows });
});

// ---------- Policies ----------
export const updatePolicy = asyncHandler(async (req, res) => {
  const { key } = req.params;
  const policy = await prisma.policy.upsert({
    where: { key },
    create: { key, titleEn: req.body.titleEn || key, titleAr: req.body.titleAr || key, contentEn: req.body.contentEn || '', contentAr: req.body.contentAr || '' },
    update: {
      titleEn: req.body.titleEn, titleAr: req.body.titleAr,
      contentEn: req.body.contentEn, contentAr: req.body.contentAr,
    },
  });
  res.json({ policy });
});
