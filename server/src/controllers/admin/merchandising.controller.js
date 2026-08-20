import prisma from '../../config/db.js';
import ApiError from '../../utils/ApiError.js';
import { asyncHandler } from '../../utils/helpers.js';

// ---------- Hero banners ----------
export const listHero = asyncHandler(async (_req, res) => {
  const banners = await prisma.heroBanner.findMany({ orderBy: { displayOrder: 'asc' } });
  res.json({ banners });
});

const heroData = (b) => ({
  image: b.image, labelEn: b.labelEn || '', labelAr: b.labelAr || '',
  titleEn: b.titleEn || '', titleAr: b.titleAr || '', subtitleEn: b.subtitleEn || '', subtitleAr: b.subtitleAr || '',
  ctaTextEn: b.ctaTextEn || '', ctaTextAr: b.ctaTextAr || '', ctaLink: b.ctaLink || '',
  categoryId: b.categoryId || null, productId: b.productId || null,
  displayOrder: Number(b.displayOrder) || 0, active: b.active ?? true,
});

export const createHero = asyncHandler(async (req, res) => {
  if (!req.body.image) throw ApiError.badRequest('Please upload a banner image.');
  const banner = await prisma.heroBanner.create({ data: heroData(req.body) });
  res.status(201).json({ banner });
});

export const updateHero = asyncHandler(async (req, res) => {
  const banner = await prisma.heroBanner.update({ where: { id: req.params.id }, data: heroData(req.body) });
  res.json({ banner });
});

export const deleteHero = asyncHandler(async (req, res) => {
  await prisma.heroBanner.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export const reorderHero = asyncHandler(async (req, res) => {
  for (const o of req.body.order || []) await prisma.heroBanner.update({ where: { id: o.id }, data: { displayOrder: o.displayOrder } });
  res.json({ ok: true });
});

// ---------- Homepage sections ----------
export const listSections = asyncHandler(async (_req, res) => {
  const sections = await prisma.homepageSection.findMany({ orderBy: { displayOrder: 'asc' } });
  res.json({ sections: sections.map((s) => ({ ...s, config: JSON.parse(s.config || '{}') })) });
});

export const createSection = asyncHandler(async (req, res) => {
  const { key, type } = req.body;
  if (!key || !type) throw ApiError.badRequest('Section key and type are required.');
  const section = await prisma.homepageSection.create({
    data: {
      key, type,
      titleEn: req.body.titleEn || '', titleAr: req.body.titleAr || '',
      subtitleEn: req.body.subtitleEn || '', subtitleAr: req.body.subtitleAr || '',
      config: JSON.stringify(req.body.config || {}),
      visible: req.body.visible ?? true, displayOrder: Number(req.body.displayOrder) || 0,
    },
  });
  res.status(201).json({ section: { ...section, config: JSON.parse(section.config) } });
});

export const updateSection = asyncHandler(async (req, res) => {
  const existing = await prisma.homepageSection.findUnique({ where: { id: req.params.id } });
  if (!existing) throw ApiError.notFound('Section not found.');
  const section = await prisma.homepageSection.update({
    where: { id: existing.id },
    data: {
      titleEn: req.body.titleEn ?? existing.titleEn,
      titleAr: req.body.titleAr ?? existing.titleAr,
      subtitleEn: req.body.subtitleEn ?? existing.subtitleEn,
      subtitleAr: req.body.subtitleAr ?? existing.subtitleAr,
      config: req.body.config != null ? JSON.stringify(req.body.config) : existing.config,
      visible: req.body.visible ?? existing.visible,
      displayOrder: req.body.displayOrder != null ? Number(req.body.displayOrder) : existing.displayOrder,
    },
  });
  res.json({ section: { ...section, config: JSON.parse(section.config) } });
});

export const deleteSection = asyncHandler(async (req, res) => {
  await prisma.homepageSection.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});
