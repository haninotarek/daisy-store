import { z } from 'zod';
import prisma from '../config/db.js';
import ApiError from '../utils/ApiError.js';
import { asyncHandler } from '../utils/helpers.js';
import { createOrder, serializeOrder } from '../services/order.service.js';

const customerSchema = z.object({
  customerName: z.string().trim().min(2, 'Please enter your full name'),
  phone: z.string().trim().min(6, 'Please enter a valid phone number'),
  governorate: z.string().trim().min(2, 'Please select your governorate'),
  governorateId: z.string().trim().optional(),
  city: z.string().trim().min(2, 'Please enter your city'),
  address: z.string().trim().min(5, 'Please enter your full address'),
  notes: z.string().trim().optional(),
});

// POST /api/orders  — works for guests (items in body) and logged-in users (DB cart).
export const placeOrder = asyncHandler(async (req, res) => {
  const customer = customerSchema.parse(req.body);
  const order = await createOrder({
    userId: req.user?.id || null,
    customer,
    bodyItems: req.body.items,
  });
  res.status(201).json({ order: serializeOrder(order) });
});

// GET /api/orders  — current user's order history.
export const myOrders = asyncHandler(async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user.id },
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ orders: orders.map(serializeOrder) });
});

// GET /api/orders/:orderNumber — a user's own order, or public lookup for guests.
export const getOrder = asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { orderNumber: req.params.orderNumber },
    include: { items: true },
  });
  if (!order) throw ApiError.notFound('Order not found.');
  // Logged-in users can only see their own; guests can view by order number
  // (used for the confirmation page right after checkout).
  if (order.userId && req.user?.id !== order.userId && req.user?.role !== 'ADMIN') {
    throw ApiError.forbidden('You cannot view this order.');
  }
  res.json({ order: serializeOrder(order) });
});
