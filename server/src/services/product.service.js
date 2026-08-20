import prisma from '../config/db.js';

// Full include for a product with everything needed to render a detail page.
export const productInclude = {
  images: { orderBy: { displayOrder: 'asc' } },
  category: true,
  fieldValues: {
    include: { field: { include: { options: true } }, option: true },
  },
  variants: {
    include: {
      options: { include: { field: true, option: true } },
    },
  },
};

// Effective unit price for a product (sale price if set & lower).
export function effectivePrice(product, variant = null) {
  if (variant?.priceOverride != null) return variant.priceOverride;
  if (product.salePrice != null && product.salePrice < product.price) return product.salePrice;
  return product.price;
}

// Total available stock across a product (variant-aware).
export function totalStock(product) {
  if (product.hasVariants) return product.variants.reduce((s, v) => s + v.stock, 0);
  return product.stock;
}

// Shape a product for API responses.
export function serializeProduct(p) {
  const stock = totalStock(p);
  const onSale = p.salePrice != null && p.salePrice < p.price;
  return {
    id: p.id,
    slug: p.slug,
    nameEn: p.nameEn,
    nameAr: p.nameAr,
    descEn: p.descEn,
    descAr: p.descAr,
    price: p.price,
    salePrice: p.salePrice,
    effectivePrice: effectivePrice(p),
    onSale,
    discountPercent: onSale ? Math.round((1 - p.salePrice / p.price) * 100) : 0,
    hasVariants: p.hasVariants,
    stock,
    inStock: stock > 0,
    active: p.active,
    featured: p.featured,
    isNew: p.isNew,
    bestSeller: p.bestSeller,
    soldCount: p.soldCount,
    createdAt: p.createdAt,
    category: p.category
      ? { id: p.category.id, slug: p.category.slug, nameEn: p.category.nameEn, nameAr: p.category.nameAr }
      : null,
    images: (p.images || []).map((im) => ({ id: im.id, url: im.url, isMain: im.isMain, displayOrder: im.displayOrder })),
    mainImage:
      (p.images || []).find((im) => im.isMain)?.url || (p.images || [])[0]?.url || null,
    attributes: (p.fieldValues || []).map((fv) => ({
      fieldId: fv.fieldId,
      key: fv.field.key,
      type: fv.field.type,
      nameEn: fv.field.nameEn,
      nameAr: fv.field.nameAr,
      optionId: fv.optionId,
      valueEn: fv.option?.valueEn ?? fv.valueText,
      valueAr: fv.option?.valueAr ?? fv.valueText,
      colorHex: fv.option?.colorHex ?? null,
    })),
    variants: (p.variants || []).map((v) => ({
      id: v.id,
      sku: v.sku,
      stock: v.stock,
      label: v.label,
      price: effectivePrice(p, v),
      inStock: v.stock > 0,
      options: v.options.map((o) => ({
        fieldId: o.fieldId,
        fieldKey: o.field.key,
        fieldNameEn: o.field.nameEn,
        fieldNameAr: o.field.nameAr,
        optionId: o.optionId,
      })),
    })),
  };
}

// Resolve the fields that drive variant selection for a product (distinct
// fields present on its variants). Each field's options are limited to those
// that actually appear in this product's variants, so the selector never
// offers a combination the product doesn't carry.
export async function variantFields(product) {
  if (!product.hasVariants || product.variants.length === 0) return [];
  const fieldIds = [...new Set(product.variants.flatMap((v) => v.options.map((o) => o.fieldId)))];
  const usedOptionIds = new Set(product.variants.flatMap((v) => v.options.map((o) => o.optionId)));
  const fields = await prisma.productField.findMany({
    where: { id: { in: fieldIds } },
    include: { options: { orderBy: { displayOrder: 'asc' } } },
    orderBy: { displayOrder: 'asc' },
  });
  return fields.map((f) => ({ ...f, options: f.options.filter((o) => usedOptionIds.has(o.id)) }));
}
