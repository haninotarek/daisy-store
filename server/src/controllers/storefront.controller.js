import prisma from '../config/db.js';
import ApiError from '../utils/ApiError.js';
import { asyncHandler, safeJson } from '../utils/helpers.js';
import { productInclude, serializeProduct } from '../services/product.service.js';

export const getSettings = asyncHandler(async (_req, res) => {
  const s = await prisma.storeSetting.findUnique({ where: { id: 1 } });
  res.json({ settings: s });
});

export const getHero = asyncHandler(async (_req, res) => {
  const banners = await prisma.heroBanner.findMany({
    where: { active: true },
    orderBy: { displayOrder: 'asc' },
    include: { category: true, product: true },
  });
  res.json({
    banners: banners.map((b) => ({
      id: b.id, image: b.image,
      labelEn: b.labelEn, labelAr: b.labelAr,
      titleEn: b.titleEn, titleAr: b.titleAr,
      subtitleEn: b.subtitleEn, subtitleAr: b.subtitleAr,
      ctaTextEn: b.ctaTextEn, ctaTextAr: b.ctaTextAr,
      ctaLink: b.ctaLink
        || (b.product ? `/products/${b.product.slug}` : b.category ? `/category/${b.category.slug}` : '/shop'),
    })),
  });
});

// GET /api/homepage — assembled homepage: hero + ordered visible sections
// with their products/categories resolved.
export const getHomepage = asyncHandler(async (_req, res) => {
  const sections = await prisma.homepageSection.findMany({
    where: { visible: true },
    orderBy: { displayOrder: 'asc' },
  });

  const resolved = [];
  for (const s of sections) {
    const cfg = safeJson(s.config, {});
    if (s.type === 'CATEGORIES') {
      const categories = await prisma.category.findMany({
        where: { active: true },
        orderBy: { displayOrder: 'asc' },
        take: cfg.limit || 8,
      });
      resolved.push({
        key: s.key, type: s.type, titleEn: s.titleEn, titleAr: s.titleAr,
        subtitleEn: s.subtitleEn, subtitleAr: s.subtitleAr,
        categories: categories.map((c) => ({
          id: c.id, slug: c.slug, nameEn: c.nameEn, nameAr: c.nameAr, image: c.image,
        })),
      });
    } else if (s.type === 'EDITORIAL') {
      resolved.push({
        key: s.key, type: s.type, titleEn: s.titleEn, titleAr: s.titleAr,
        subtitleEn: s.subtitleEn, subtitleAr: s.subtitleAr, config: cfg,
      });
    } else {
      // PRODUCTS — filter by config.filter (featured/new/bestsellers/sale/category)
      const where = { active: true };
      if (cfg.filter === 'featured') where.featured = true;
      else if (cfg.filter === 'new') where.isNew = true;
      else if (cfg.filter === 'bestsellers') where.bestSeller = true;
      else if (cfg.filter === 'sale') where.salePrice = { not: null };
      if (cfg.category) where.category = { slug: cfg.category };
      const orderBy = cfg.filter === 'bestsellers' ? { soldCount: 'desc' } : { createdAt: 'desc' };
      const rows = await prisma.product.findMany({
        where, include: productInclude, orderBy, take: cfg.limit || 8,
      });
      resolved.push({
        key: s.key, type: s.type, titleEn: s.titleEn, titleAr: s.titleAr,
        subtitleEn: s.subtitleEn, subtitleAr: s.subtitleAr, filter: cfg.filter,
        products: rows.map(serializeProduct),
      });
    }
  }
  res.json({ sections: resolved });
});

// Active governorates with their delivery fee, for the checkout dropdown.
export const listGovernorates = asyncHandler(async (_req, res) => {
  const rows = await prisma.governorateFee.findMany({
    where: { active: true },
    orderBy: { displayOrder: 'asc' },
  });
  res.json({ governorates: rows.map((g) => ({ id: g.id, nameEn: g.nameEn, nameAr: g.nameAr, fee: g.fee })) });
});

export const listPolicies = asyncHandler(async (_req, res) => {
  const policies = await prisma.policy.findMany();
  res.json({ policies });
});

export const getPolicy = asyncHandler(async (req, res) => {
  const policy = await prisma.policy.findUnique({ where: { key: req.params.key } });
  if (!policy) throw ApiError.notFound('Policy not found.');
  res.json({ policy });
});
