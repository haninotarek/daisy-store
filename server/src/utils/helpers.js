import slugify from 'slugify';
import prisma from '../config/db.js';

// Wrap async route handlers so thrown errors reach the error middleware.
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Generate a unique slug for a model given a base string.
export async function uniqueSlug(model, base, ignoreId = null) {
  let slug = slugify(base || 'item', { lower: true, strict: true }) || 'item';
  let candidate = slug;
  let i = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma[model].findUnique({ where: { slug: candidate } });
    if (!existing || existing.id === ignoreId) break;
    candidate = `${slug}-${i++}`;
  }
  return candidate;
}

// Human-readable order number: DAISY-2026-0001
export async function generateOrderNumber() {
  const year = new Date().getFullYear();
  const count = await prisma.order.count({
    where: { orderNumber: { startsWith: `DAISY-${year}-` } },
  });
  const seq = String(count + 1).padStart(4, '0');
  return `DAISY-${year}-${seq}`;
}

export function safeJson(str, fallback) {
  try { return JSON.parse(str); } catch { return fallback; }
}

export function toKey(str) {
  return slugify(str || 'field', { lower: true, strict: true, replacement: '_' }) || 'field';
}
