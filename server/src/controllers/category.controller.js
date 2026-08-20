import prisma from '../config/db.js';
import ApiError from '../utils/ApiError.js';
import { asyncHandler } from '../utils/helpers.js';

function serialize(c) {
  return {
    id: c.id, slug: c.slug, nameEn: c.nameEn, nameAr: c.nameAr,
    descEn: c.descEn, descAr: c.descAr, image: c.image, banner: c.banner,
    displayOrder: c.displayOrder, active: c.active,
    productCount: c._count?.products ?? undefined,
  };
}

// GET /api/categories  — public, active only.
export const listCategories = asyncHandler(async (_req, res) => {
  const cats = await prisma.category.findMany({
    where: { active: true },
    orderBy: { displayOrder: 'asc' },
    include: { _count: { select: { products: { where: { active: true } } } } },
  });
  res.json({ categories: cats.map(serialize) });
});

// GET /api/categories/:slug
export const getCategory = asyncHandler(async (req, res) => {
  const cat = await prisma.category.findUnique({
    where: { slug: req.params.slug },
    include: { _count: { select: { products: { where: { active: true } } } } },
  });
  if (!cat || !cat.active) throw ApiError.notFound('Category not found.');
  res.json({ category: serialize(cat) });
});
