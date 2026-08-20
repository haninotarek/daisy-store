import prisma from '../../config/db.js';
import ApiError from '../../utils/ApiError.js';
import { asyncHandler, uniqueSlug } from '../../utils/helpers.js';

export const listAll = asyncHandler(async (_req, res) => {
  const cats = await prisma.category.findMany({
    orderBy: { displayOrder: 'asc' },
    include: {
      _count: { select: { products: true } },
      fields: { include: { field: true } },
    },
  });
  res.json({
    categories: cats.map((c) => ({
      id: c.id, slug: c.slug, nameEn: c.nameEn, nameAr: c.nameAr, descEn: c.descEn, descAr: c.descAr,
      image: c.image, banner: c.banner, displayOrder: c.displayOrder, active: c.active,
      productCount: c._count.products, fieldIds: c.fields.map((f) => f.fieldId),
    })),
  });
});

export const create = asyncHandler(async (req, res) => {
  const { nameEn, nameAr } = req.body;
  if (!nameEn || !nameAr) throw ApiError.badRequest('Category name (Arabic & English) is required.');
  const slug = await uniqueSlug('category', req.body.slug || nameEn);
  const cat = await prisma.category.create({
    data: {
      slug, nameEn, nameAr, descEn: req.body.descEn || '', descAr: req.body.descAr || '',
      image: req.body.image || null, banner: req.body.banner || null,
      displayOrder: Number(req.body.displayOrder) || 0, active: req.body.active ?? true,
    },
  });
  if (Array.isArray(req.body.fieldIds)) await setCategoryFields(cat.id, req.body.fieldIds);
  res.status(201).json({ category: cat });
});

export const update = asyncHandler(async (req, res) => {
  const existing = await prisma.category.findUnique({ where: { id: req.params.id } });
  if (!existing) throw ApiError.notFound('Category not found.');
  const slug = req.body.slug && req.body.slug !== existing.slug
    ? await uniqueSlug('category', req.body.slug, existing.id) : existing.slug;
  const cat = await prisma.category.update({
    where: { id: existing.id },
    data: {
      slug,
      nameEn: req.body.nameEn ?? existing.nameEn,
      nameAr: req.body.nameAr ?? existing.nameAr,
      descEn: req.body.descEn ?? existing.descEn,
      descAr: req.body.descAr ?? existing.descAr,
      image: req.body.image ?? existing.image,
      banner: req.body.banner ?? existing.banner,
      displayOrder: req.body.displayOrder != null ? Number(req.body.displayOrder) : existing.displayOrder,
      active: req.body.active ?? existing.active,
    },
  });
  if (Array.isArray(req.body.fieldIds)) await setCategoryFields(cat.id, req.body.fieldIds);
  res.json({ category: cat });
});

async function setCategoryFields(categoryId, fieldIds) {
  await prisma.categoryField.deleteMany({ where: { categoryId } });
  for (const fieldId of fieldIds) {
    await prisma.categoryField.create({ data: { categoryId, fieldId } }).catch(() => {});
  }
}

export const remove = asyncHandler(async (req, res) => {
  const count = await prisma.product.count({ where: { categoryId: req.params.id } });
  if (count > 0 && req.query.force !== 'true') {
    throw ApiError.conflict(
      `This category has ${count} product(s). Confirm to detach them and delete.`,
      'CATEGORY_HAS_PRODUCTS'
    );
  }
  await prisma.category.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export const reorder = asyncHandler(async (req, res) => {
  const { order } = req.body; // [{id, displayOrder}]
  for (const o of order || []) {
    await prisma.category.update({ where: { id: o.id }, data: { displayOrder: o.displayOrder } });
  }
  res.json({ ok: true });
});
