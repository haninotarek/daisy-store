import prisma from '../../config/db.js';
import ApiError from '../../utils/ApiError.js';
import { asyncHandler, toKey } from '../../utils/helpers.js';

const TYPES = ['TEXT', 'NUMBER', 'SELECT', 'MULTISELECT', 'BOOLEAN', 'COLOR', 'SIZE', 'IMAGE'];

function serialize(f) {
  return {
    id: f.id, key: f.key, nameEn: f.nameEn, nameAr: f.nameAr, type: f.type,
    required: f.required, filterable: f.filterable, usedForVariants: f.usedForVariants,
    displayOrder: f.displayOrder, active: f.active,
    options: (f.options || []).sort((a, b) => a.displayOrder - b.displayOrder).map((o) => ({
      id: o.id, valueEn: o.valueEn, valueAr: o.valueAr, colorHex: o.colorHex, displayOrder: o.displayOrder,
    })),
    categoryIds: (f.categories || []).map((c) => c.categoryId),
  };
}

export const list = asyncHandler(async (_req, res) => {
  const fields = await prisma.productField.findMany({
    orderBy: { displayOrder: 'asc' },
    include: { options: true, categories: true },
  });
  res.json({ fields: fields.map(serialize) });
});

// Public list used by admin product form + storefront filters.
export const listPublic = asyncHandler(async (_req, res) => {
  const fields = await prisma.productField.findMany({
    where: { active: true },
    orderBy: { displayOrder: 'asc' },
    include: { options: true, categories: true },
  });
  res.json({ fields: fields.map(serialize) });
});

async function writeOptions(fieldId, options = []) {
  const keepIds = options.filter((o) => o.id).map((o) => o.id);
  await prisma.productFieldOption.deleteMany({
    where: { fieldId, ...(keepIds.length ? { id: { notIn: keepIds } } : {}) },
  });
  for (let i = 0; i < options.length; i++) {
    const o = options[i];
    if (o.id) {
      await prisma.productFieldOption.update({
        where: { id: o.id },
        data: { valueEn: o.valueEn, valueAr: o.valueAr, colorHex: o.colorHex || null, displayOrder: o.displayOrder ?? i },
      });
    } else {
      await prisma.productFieldOption.create({
        data: { fieldId, valueEn: o.valueEn, valueAr: o.valueAr, colorHex: o.colorHex || null, displayOrder: o.displayOrder ?? i },
      });
    }
  }
}

async function setCategories(fieldId, categoryIds) {
  await prisma.categoryField.deleteMany({ where: { fieldId } });
  for (const categoryId of categoryIds) {
    await prisma.categoryField.create({ data: { fieldId, categoryId } }).catch(() => {});
  }
}

export const create = asyncHandler(async (req, res) => {
  const { nameEn, nameAr, type } = req.body;
  if (!nameEn || !nameAr) throw ApiError.badRequest('Field name (Arabic & English) is required.');
  if (!TYPES.includes(type)) throw ApiError.badRequest('Invalid field type.');
  let key = toKey(req.body.key || nameEn);
  const exists = await prisma.productField.findUnique({ where: { key } });
  if (exists) key = `${key}_${Date.now().toString().slice(-4)}`;
  const field = await prisma.productField.create({
    data: {
      key, nameEn, nameAr, type,
      required: Boolean(req.body.required), filterable: Boolean(req.body.filterable),
      usedForVariants: Boolean(req.body.usedForVariants),
      displayOrder: Number(req.body.displayOrder) || 0, active: req.body.active ?? true,
    },
  });
  if (Array.isArray(req.body.options)) await writeOptions(field.id, req.body.options);
  if (Array.isArray(req.body.categoryIds)) await setCategories(field.id, req.body.categoryIds);
  const full = await prisma.productField.findUnique({ where: { id: field.id }, include: { options: true, categories: true } });
  res.status(201).json({ field: serialize(full) });
});

export const update = asyncHandler(async (req, res) => {
  const existing = await prisma.productField.findUnique({ where: { id: req.params.id } });
  if (!existing) throw ApiError.notFound('Field not found.');
  if (req.body.type && !TYPES.includes(req.body.type)) throw ApiError.badRequest('Invalid field type.');
  await prisma.productField.update({
    where: { id: existing.id },
    data: {
      nameEn: req.body.nameEn ?? existing.nameEn,
      nameAr: req.body.nameAr ?? existing.nameAr,
      type: req.body.type ?? existing.type,
      required: req.body.required ?? existing.required,
      filterable: req.body.filterable ?? existing.filterable,
      usedForVariants: req.body.usedForVariants ?? existing.usedForVariants,
      displayOrder: req.body.displayOrder != null ? Number(req.body.displayOrder) : existing.displayOrder,
      active: req.body.active ?? existing.active,
    },
  });
  if (Array.isArray(req.body.options)) await writeOptions(existing.id, req.body.options);
  if (Array.isArray(req.body.categoryIds)) await setCategories(existing.id, req.body.categoryIds);
  const full = await prisma.productField.findUnique({ where: { id: existing.id }, include: { options: true, categories: true } });
  res.json({ field: serialize(full) });
});

export const remove = asyncHandler(async (req, res) => {
  const inUse = await prisma.productFieldValue.count({ where: { fieldId: req.params.id } });
  if (inUse > 0 && req.query.force !== 'true') {
    throw ApiError.conflict(`This field is used by ${inUse} product value(s). Confirm to delete.`, 'FIELD_IN_USE');
  }
  await prisma.productField.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});
