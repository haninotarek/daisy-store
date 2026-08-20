import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../config/db.js';
import ApiError from '../utils/ApiError.js';
import { asyncHandler } from '../utils/helpers.js';
import { signToken } from '../middleware/auth.js';
import { mergeGuestCart } from '../services/cart.service.js';

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name is too short'),
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().trim().optional(),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role };
}

export const register = asyncHandler(async (req, res) => {
  const data = registerSchema.parse(req.body);
  const exists = await prisma.user.findUnique({ where: { email: data.email } });
  if (exists) throw ApiError.conflict('An account with this email already exists.', 'EMAIL_TAKEN');
  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: { name: data.name, email: data.email, phone: data.phone, passwordHash },
  });
  const token = signToken(user);
  if (req.body.guestCart) await mergeGuestCart(user.id, req.body.guestCart);
  res.status(201).json({ token, user: publicUser(user) });
});

export const login = asyncHandler(async (req, res) => {
  const data = loginSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) {
    throw ApiError.unauthorized('Incorrect email or password.');
  }
  const token = signToken(user);
  if (req.body.guestCart) await mergeGuestCart(user.id, req.body.guestCart);
  res.json({ token, user: publicUser(user) });
});

export const me = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) throw ApiError.unauthorized();
  res.json({ user: publicUser(user) });
});

const updateSchema = z.object({
  name: z.string().trim().min(2).optional(),
  phone: z.string().trim().optional(),
  password: z.string().min(6).optional(),
});

export const updateProfile = asyncHandler(async (req, res) => {
  const data = updateSchema.parse(req.body);
  const patch = {};
  if (data.name) patch.name = data.name;
  if (data.phone !== undefined) patch.phone = data.phone;
  if (data.password) patch.passwordHash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.update({ where: { id: req.user.id }, data: patch });
  res.json({ user: publicUser(user) });
});
