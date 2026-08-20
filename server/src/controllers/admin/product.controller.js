import prisma from '../../config/db.js';
import ApiError from '../../utils/ApiError.js';
import { asyncHandler, uniqueSlug } from '../../utils/helpers.js';
import { productInclude, serializeProduct, totalStock } from '../../services/product.service.js';

// Build a readable variant label like "Beige / M" from its option ids.
async function buildVariantLabel(optionPairs) {
  if (!optionPairs.length) return '';
  const ids = optionPairs.map((o) => o.optionId);
  const opts = await prisma.productFieldOption.findMany({ where: { id: { in: ids } } });
  const byId = Object.fromEntries(opts.map((o) => [o.id, o]));
  // keep the order given by the client
  return optionPairs.map((o) => byId[o.optionId]?.valueEn || '').filter(Boolean).join(' / ');
}

// Replace a product's attributes + variants transactionally.
async function writeAttributesAndVariants(tx, productId, { attributes = [], variants = [], hasVariants }) {
  await tx.productFieldValue.deleteMany({ where: { productId } });
  for (const a of attributes) {
    if (!a.fieldId) continue;
    await tx.productFieldValue.create({
      data: {
        productId,
        fieldId: a.fieldId,
        optionId: a.optionId || null,
        valueText: a.valueText != null ? String(a.valueText) : null,
      },
    });
  }

  // wipe existing variants (cascade removes their options)
  await tx.productVariant.deleteMany({ where: { productId } });
  if (hasVariants) {
    for (const v of variants) {
      const pairs = (v.options || []).filter((o) => o.fieldId && o.optionId);
      const label = v.label || (await buildVariantLabel(pairs));
      await tx.productVariant.create({
        data: {
          productId,
          sku: v.sku || null,
          stock: Math.max(0, Number(v.stock) || 0),
          priceOverride: v.priceOverride != null && v.priceOverride !== '' ? Number(v.priceOverride) : null,
          label,
          options: { create: pairs.map((o) => ({ fieldId: o.fieldId, optionId: o.optionId })) },
        },
      });
    }
  }
}

async function writeImages(tx, productId, images = []) {
  await tx.productImage.deleteMany({ where: { productId } });
  const hasMain = images.some((i) => i.isMain);
  for (let i = 0; i < images.length; i++) {
    const im = images[i];
    await tx.productImage.create({
      data: {
        productId,
        url: im.url,
        displayOrder: im.displayOrder ?? i,
        isMain: im.isMain ?? (!hasMain && i === 0),
      },
    });
  }
}

function basicData(body) {
  return {
    nameEn: body.nameEn?.trim(),
    nameAr: body.nameAr?.trim(),
    descEn: body.descEn || '',
    descAr: body.descAr || '',
    categoryId: body.categoryId || null,
    price: Number(body.price) || 0,
    salePrice: body.salePrice != null && body.salePrice !== '' ? Number(body.salePrice) : null,
    hasVariants: Boolean(body.hasVariants),
    stock: body.hasVariants ? 0 : Math.max(0, Number(body.stock) || 0),
    active: body.active ?? true,
    featured: Boolean(body.featured),
    isNew: Boolean(body.isNew),
    bestSeller: Boolean(body.bestSeller),
  };
}

export const listAdminProducts = asyncHandler(async (req, res) => {
  const { search, category, status, page = 1, limit = 20 } = req.query;
  const take = Math.min(Number(limit) || 20, 100);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;
  const where = {};
  if (search) where.OR = [{ nameEn: { contains: search } }, { nameAr: { contains: search } }];
  if (category) where.category = { slug: category };
  if (status === 'active') where.active = true;
  if (status === 'hidden') where.active = false;
  const [rows, total] = await Promise.all([
    prisma.product.findMany({ where, include: productInclude, orderBy: { createdAt: 'desc' }, skip, take }),
    prisma.product.count({ where }),
  ]);
  res.json({
    products: rows.map(serializeProduct),
    pagination: { page: Number(page), limit: take, total, pages: Math.ceil(total / take) },
  });
});

export const getAdminProduct = asyncHandler(async (req, res) => {
  const p = await prisma.product.findUnique({ where: { id: req.params.id }, include: productInclude });
  if (!p) throw ApiError.notFound('Product not found.');
  // include raw variant/attribute structure for editing
  res.json({
    product: serializeProduct(p),
    raw: {
      attributes: p.fieldValues.map((fv) => ({ fieldId: fv.fieldId, optionId: fv.optionId, valueText: fv.valueText })),
      variants: p.variants.map((v) => ({
        id: v.id, sku: v.sku, stock: v.stock, priceOverride: v.priceOverride, label: v.label,
        options: v.options.map((o) => ({ fieldId: o.fieldId, optionId: o.optionId })),
      })),
    },
  });
});

export const createProduct = asyncHandler(async (req, res) => {
  const data = basicData(req.body);
  if (!data.nameEn || !data.nameAr) throw ApiError.badRequest('Product name (Arabic & English) is required.');
  const slug = await uniqueSlug('product', req.body.slug || data.nameEn);

  const product = await prisma.$transaction(async (tx) => {
    const created = await tx.product.create({ data: { ...data, slug } });
    await writeImages(tx, created.id, req.body.images || []);
    await writeAttributesAndVariants(tx, created.id, {
      attributes: req.body.attributes, variants: req.body.variants, hasVariants: data.hasVariants,
    });
    return created;
  });

  const full = await prisma.product.findUnique({ where: { id: product.id }, include: productInclude });
  res.status(201).json({ product: serializeProduct(full) });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!existing) throw ApiError.notFound('Product not found.');
  const data = basicData(req.body);
  const slug = req.body.slug && req.body.slug !== existing.slug
    ? await uniqueSlug('product', req.body.slug, existing.id)
    : existing.slug;

  await prisma.$transaction(async (tx) => {
    await tx.product.update({ where: { id: existing.id }, data: { ...data, slug } });
    if (req.body.images) await writeImages(tx, existing.id, req.body.images);
    await writeAttributesAndVariants(tx, existing.id, {
      attributes: req.body.attributes || [], variants: req.body.variants || [], hasVariants: data.hasVariants,
    });
  });

  const full = await prisma.product.findUnique({ where: { id: existing.id }, include: productInclude });
  res.json({ product: serializeProduct(full) });
});

// PATCH quick toggles (active/featured/etc.)
export const patchProduct = asyncHandler(async (req, res) => {
  const allowed = ['active', 'featured', 'isNew', 'bestSeller'];
  const data = {};
  for (const k of allowed) if (k in req.body) data[k] = Boolean(req.body[k]);
  if ('stock' in req.body) data.stock = Math.max(0, Number(req.body.stock) || 0);
  const p = await prisma.product.update({ where: { id: req.params.id }, data, include: productInclude });
  res.json({ product: serializeProduct(p) });
});

export const duplicateProduct = asyncHandler(async (req, res) => {
  const src = await prisma.product.findUnique({ where: { id: req.params.id }, include: productInclude });
  if (!src) throw ApiError.notFound('Product not found.');
  const slug = await uniqueSlug('product', `${src.nameEn}-copy`);
  const product = await prisma.$transaction(async (tx) => {
    const created = await tx.product.create({
      data: {
        slug, nameEn: `${src.nameEn} (Copy)`, nameAr: `${src.nameAr} (نسخة)`,
        descEn: src.descEn, descAr: src.descAr, categoryId: src.categoryId,
        price: src.price, salePrice: src.salePrice, hasVariants: src.hasVariants,
        stock: src.stock, active: false, featured: src.featured, isNew: src.isNew, bestSeller: src.bestSeller,
      },
    });
    await writeImages(tx, created.id, src.images.map((i) => ({ url: i.url, isMain: i.isMain, displayOrder: i.displayOrder })));
    await writeAttributesAndVariants(tx, created.id, {
      attributes: src.fieldValues.map((fv) => ({ fieldId: fv.fieldId, optionId: fv.optionId, valueText: fv.valueText })),
      variants: src.variants.map((v) => ({
        sku: v.sku, stock: v.stock, priceOverride: v.priceOverride, label: v.label,
        options: v.options.map((o) => ({ fieldId: o.fieldId, optionId: o.optionId })),
      })),
      hasVariants: src.hasVariants,
    });
    return created;
  });
  const full = await prisma.product.findUnique({ where: { id: product.id }, include: productInclude });
  res.status(201).json({ product: serializeProduct(full) });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  await prisma.product.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});
