import prisma from '../config/db.js';
import ApiError from '../utils/ApiError.js';
import { asyncHandler } from '../utils/helpers.js';
import {
  productInclude,
  serializeProduct,
  variantFields,
} from '../services/product.service.js';

// GET /api/products  — public listing with filters, sort, pagination.
export const listProducts = asyncHandler(async (req, res) => {
  const {
    category, search, sort = 'newest', page = 1, limit = 12,
    minPrice, maxPrice, inStock, featured, isNew, bestSeller, sale,
    attributes, // JSON: { fieldId: [optionId, ...] }
  } = req.query;

  const take = Math.min(Number(limit) || 12, 60);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

  const where = { active: true };
  if (category) where.category = { slug: category };
  if (featured === 'true') where.featured = true;
  if (isNew === 'true') where.isNew = true;
  if (bestSeller === 'true') where.bestSeller = true;
  if (sale === 'true') where.salePrice = { not: null };
  if (search) {
    where.OR = [
      { nameEn: { contains: search } },
      { nameAr: { contains: search } },
      { descEn: { contains: search } },
      { descAr: { contains: search } },
      { category: { is: { OR: [{ nameEn: { contains: search } }, { nameAr: { contains: search } }] } } },
    ];
  }

  // Attribute filters (match products that have the selected field option).
  let attrFilter = null;
  try { attrFilter = attributes ? JSON.parse(attributes) : null; } catch { attrFilter = null; }
  if (attrFilter && typeof attrFilter === 'object') {
    const conditions = [];
    for (const [fieldId, optionIds] of Object.entries(attrFilter)) {
      if (Array.isArray(optionIds) && optionIds.length) {
        conditions.push({
          OR: [
            { fieldValues: { some: { fieldId, optionId: { in: optionIds } } } },
            { variants: { some: { options: { some: { fieldId, optionId: { in: optionIds } } } } } },
          ],
        });
      }
    }
    if (conditions.length) where.AND = [...(where.AND || []), ...conditions];
  }

  const orderBy =
    sort === 'price_asc' ? { price: 'asc' }
    : sort === 'price_desc' ? { price: 'desc' }
    : sort === 'bestselling' ? { soldCount: 'desc' }
    : sort === 'featured' ? { featured: 'desc' }
    : { createdAt: 'desc' };

  let [rows, total] = await Promise.all([
    prisma.product.findMany({ where, include: productInclude, orderBy, skip, take }),
    prisma.product.count({ where }),
  ]);

  let products = rows.map(serializeProduct);

  // Post-filter price/stock (effective price can differ from base price).
  if (minPrice) products = products.filter((p) => p.effectivePrice >= Number(minPrice));
  if (maxPrice) products = products.filter((p) => p.effectivePrice <= Number(maxPrice));
  if (inStock === 'true') products = products.filter((p) => p.inStock);

  res.json({
    products,
    pagination: { page: Number(page), limit: take, total, pages: Math.ceil(total / take) },
  });
});

// GET /api/products/:slug
export const getProduct = asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { slug: req.params.slug },
    include: productInclude,
  });
  if (!product || !product.active) throw ApiError.notFound('Product not found.');

  const fields = await variantFields(product);
  const serialized = serializeProduct(product);

  // Related products: same category, exclude self.
  const relatedRows = await prisma.product.findMany({
    where: { active: true, id: { not: product.id }, categoryId: product.categoryId },
    include: productInclude,
    take: 8,
    orderBy: { createdAt: 'desc' },
  });

  res.json({
    product: serialized,
    variantFields: fields.map((f) => ({
      id: f.id,
      key: f.key,
      type: f.type,
      nameEn: f.nameEn,
      nameAr: f.nameAr,
      options: f.options.map((o) => ({
        id: o.id, valueEn: o.valueEn, valueAr: o.valueAr, colorHex: o.colorHex,
      })),
    })),
    related: relatedRows.map(serializeProduct),
  });
});

// GET /api/products/filters?category=slug — available filter facets.
export const getFilters = asyncHandler(async (req, res) => {
  const { category } = req.query;
  const where = { active: true, filterable: true };
  // Restrict to fields attached to the category when provided.
  let categoryId = null;
  if (category) {
    const cat = await prisma.category.findUnique({ where: { slug: category } });
    categoryId = cat?.id || null;
  }
  const fields = await prisma.productField.findMany({
    where,
    include: {
      options: { orderBy: { displayOrder: 'asc' } },
      categories: true,
    },
    orderBy: { displayOrder: 'asc' },
  });
  const filtered = categoryId
    ? fields.filter((f) => f.categories.length === 0 || f.categories.some((c) => c.categoryId === categoryId))
    : fields;
  res.json({
    filters: filtered.map((f) => ({
      id: f.id, key: f.key, type: f.type, nameEn: f.nameEn, nameAr: f.nameAr,
      options: f.options.map((o) => ({ id: o.id, valueEn: o.valueEn, valueAr: o.valueAr, colorHex: o.colorHex })),
    })),
  });
});
