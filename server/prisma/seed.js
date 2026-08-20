import 'dotenv/config';
import bcrypt from 'bcryptjs';
import slugify from 'slugify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const slug = (s) => slugify(s, { lower: true, strict: true });
const key = (s) => slugify(s, { lower: true, strict: true, replacement: '_' });

// Reliable Unsplash fashion photos (editorial women's fashion).
const IMG = {
  blouse1: 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=900&q=80',
  blouse2: 'https://images.unsplash.com/photo-1551803091-e20673f15770?w=900&q=80',
  top1: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=900&q=80',
  top2: 'https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=900&q=80',
  pants1: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=900&q=80',
  pants2: 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=900&q=80',
  dress1: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=900&q=80',
  dress2: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=900&q=80',
  dress3: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=900&q=80',
  skirt1: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=900&q=80',
  skirt2: 'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=900&q=80',
  suit1: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=900&q=80',
  suit2: 'https://images.unsplash.com/photo-1521577352947-9bb58764b69a?w=900&q=80',
  modest1: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900&q=80',
  modest2: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=900&q=80',
  cat_blouse: 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=600&q=80',
  cat_top: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&q=80',
  cat_pants: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&q=80',
  cat_dress: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&q=80',
  cat_skirt: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=600&q=80',
  cat_suit: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&q=80',
  cat_modest: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=80',
  hero1: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&q=80',
  hero2: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600&q=80',
  hero3: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1600&q=80',
  editorial: 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=1200&q=80',
};

async function main() {
  console.log('Seeding Daisy database...');

  // Safety guard: on a database that already has data, skip seeding so that
  // production redeploys never wipe real orders/products. Force with FORCE_SEED=true.
  const existing = await prisma.category.count().catch(() => 0);
  if (existing > 0 && process.env.FORCE_SEED !== 'true') {
    console.log('Database already has data — skipping seed. (Set FORCE_SEED=true to reseed.)');
    return;
  }

  // ---- Reset (safe order) ----
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.variantOption.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.productFieldValue.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.categoryField.deleteMany();
  await prisma.productFieldOption.deleteMany();
  await prisma.productField.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.heroBanner.deleteMany();
  await prisma.homepageSection.deleteMany();
  await prisma.policy.deleteMany();
  await prisma.governorateFee.deleteMany();
  await prisma.storeSetting.deleteMany();
  await prisma.user.deleteMany();

  // ---- Admin ----
  const adminPass = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Daisy@Admin123', 10);
  await prisma.user.create({
    data: {
      name: process.env.ADMIN_NAME || 'Daisy Admin',
      email: (process.env.ADMIN_EMAIL || 'admin@daisy.com').toLowerCase(),
      passwordHash: adminPass, role: 'ADMIN',
    },
  });
  // demo customer
  await prisma.user.create({
    data: { name: 'Sara Ahmed', email: 'sara@example.com', phone: '01000000000', passwordHash: await bcrypt.hash('password123', 10) },
  });

  // ---- Store settings ----
  await prisma.storeSetting.create({
    data: {
      id: 1, storeName: 'Daisy', logo: '/uploads/logo.png',
      whatsapp: '201000000000', instagram: 'daisy.fashion', facebook: 'daisy.fashion',
      phone: '+20 100 000 0000', email: 'hello@daisy.com', address: 'Cairo, Egypt',
      deliveryFee: 50, currency: 'EGP', lowStockThreshold: 5,
    },
  });

  // ---- Categories ----
  const catDefs = [
    ['Blouses', 'بلوزات', IMG.cat_blouse, 'Elegant blouses for every occasion', 'بلوزات أنيقة لكل المناسبات'],
    ['Tops', 'توبات', IMG.cat_top, 'Everyday tops and essentials', 'توبات يومية أساسية'],
    ['Pants', 'بناطيل', IMG.cat_pants, 'Tailored and casual pants', 'بناطيل كاجوال ومفصلة'],
    ['Dresses', 'فساتين', IMG.cat_dress, 'Dresses for day and evening', 'فساتين للنهار والسهرة'],
    ['Skirts', 'جيبات', IMG.cat_skirt, 'Flowing and structured skirts', 'جيبات انسيابية ومنظمة'],
    ['Suits', 'بدل', IMG.cat_suit, 'Refined two-piece suits', 'بدل راقية من قطعتين'],
    ['Modest Wear', 'ملابس محتشمة', IMG.cat_modest, 'Modest, elegant pieces', 'قطع محتشمة وأنيقة'],
  ];
  const categories = {};
  for (let i = 0; i < catDefs.length; i++) {
    const [en, ar, image, dEn, dAr] = catDefs[i];
    categories[en] = await prisma.category.create({
      data: { slug: slug(en), nameEn: en, nameAr: ar, image, descEn: dEn, descAr: dAr, displayOrder: i },
    });
  }

  // ---- Product fields (flexible attributes) ----
  async function createField(nameEn, nameAr, type, opts = [], { required = false, filterable = true, variants = false, order = 0 } = {}) {
    const f = await prisma.productField.create({
      data: { key: key(nameEn), nameEn, nameAr, type, required, filterable, usedForVariants: variants, displayOrder: order },
    });
    const options = {};
    for (let i = 0; i < opts.length; i++) {
      const o = opts[i];
      const created = await prisma.productFieldOption.create({
        data: { fieldId: f.id, valueEn: o.en, valueAr: o.ar, colorHex: o.hex || null, displayOrder: i },
      });
      options[o.en] = created;
    }
    return { field: f, options };
  }

  const size = await createField('Size', 'المقاس', 'SIZE',
    [{ en: 'S', ar: 'S' }, { en: 'M', ar: 'M' }, { en: 'L', ar: 'L' }, { en: 'XL', ar: 'XL' }],
    { required: true, variants: true, order: 1 });
  const color = await createField('Color', 'اللون', 'COLOR',
    [
      { en: 'Beige', ar: 'بيج', hex: '#CBB588' }, { en: 'Black', ar: 'أسود', hex: '#2b2b2b' },
      { en: 'White', ar: 'أبيض', hex: '#F3EFF0' }, { en: 'Brown', ar: 'بني', hex: '#9C6E48' },
      { en: 'Olive', ar: 'زيتي', hex: '#6b6a4b' },
    ],
    { required: true, variants: true, order: 2 });
  const material = await createField('Material', 'الخامة', 'SELECT',
    [{ en: 'Cotton', ar: 'قطن' }, { en: 'Linen', ar: 'كتان' }, { en: 'Silk', ar: 'حرير' }, { en: 'Chiffon', ar: 'شيفون' }, { en: 'Crepe', ar: 'كريب' }],
    { order: 3 });
  const fit = await createField('Fit', 'القَصّة', 'SELECT',
    [{ en: 'Regular', ar: 'عادية' }, { en: 'Slim', ar: 'ضيقة' }, { en: 'Oversized', ar: 'واسعة' }, { en: 'Relaxed', ar: 'مريحة' }],
    { order: 4 });
  const length = await createField('Length', 'الطول', 'SELECT',
    [{ en: 'Short', ar: 'قصير' }, { en: 'Midi', ar: 'ميدي' }, { en: 'Maxi', ar: 'ماكسي' }, { en: 'Full', ar: 'كامل' }],
    { order: 5 });
  const fabric = await createField('Fabric', 'القماش', 'SELECT',
    [{ en: 'Jersey', ar: 'جيرسيه' }, { en: 'Satin', ar: 'ساتان' }, { en: 'Knit', ar: 'تريكو' }],
    { order: 6 });
  const sleeve = await createField('Sleeve Type', 'نوع الكم', 'SELECT',
    [{ en: 'Long Sleeve', ar: 'كم طويل' }, { en: 'Short Sleeve', ar: 'كم قصير' }, { en: 'Sleeveless', ar: 'بدون كم' }, { en: 'Puff Sleeve', ar: 'كم منفوش' }],
    { order: 7 });

  // Attach fields to categories
  async function attach(cat, fields) {
    for (const f of fields) await prisma.categoryField.create({ data: { categoryId: cat.id, fieldId: f.field.id } });
  }
  await attach(categories['Blouses'], [size, color, material, fit, sleeve]);
  await attach(categories['Tops'], [size, color, material, fit]);
  await attach(categories['Pants'], [size, color, length, material, fit]);
  await attach(categories['Dresses'], [size, color, fabric, length, sleeve]);
  await attach(categories['Skirts'], [size, color, length, material]);
  await attach(categories['Suits'], [size, color, material, fit]);
  await attach(categories['Modest Wear'], [size, color, fabric, length, sleeve]);

  // ---- Product creation helper ----
  let seq = 0;
  async function createProduct(cfg) {
    seq++;
    const s = slug(`${cfg.nameEn}-${seq}`);
    const product = await prisma.product.create({
      data: {
        slug: s, nameEn: cfg.nameEn, nameAr: cfg.nameAr, descEn: cfg.descEn, descAr: cfg.descAr,
        categoryId: cfg.category.id, price: cfg.price, salePrice: cfg.salePrice ?? null,
        hasVariants: Boolean(cfg.variants), stock: cfg.variants ? 0 : (cfg.stock ?? 20),
        featured: cfg.featured || false, isNew: cfg.isNew || false, bestSeller: cfg.bestSeller || false,
        soldCount: cfg.soldCount || 0,
      },
    });
    // images
    for (let i = 0; i < cfg.images.length; i++) {
      await prisma.productImage.create({ data: { productId: product.id, url: cfg.images[i], isMain: i === 0, displayOrder: i } });
    }
    // static attributes
    for (const a of cfg.attributes || []) {
      await prisma.productFieldValue.create({ data: { productId: product.id, fieldId: a.field.field.id, optionId: a.option.id } });
    }
    // variants: cartesian of colors x sizes with stock map
    if (cfg.variants) {
      for (const v of cfg.variants) {
        const label = [v.color, v.size].filter(Boolean).join(' / ');
        const variant = await prisma.productVariant.create({
          data: { productId: product.id, stock: v.stock, label, sku: `${s}-${label}`.toUpperCase() },
        });
        if (v.color) await prisma.variantOption.create({ data: { variantId: variant.id, fieldId: color.field.id, optionId: color.options[v.color].id } });
        if (v.size) await prisma.variantOption.create({ data: { variantId: variant.id, fieldId: size.field.id, optionId: size.options[v.size].id } });
      }
    }
    return product;
  }

  // build a color x size variant grid
  const grid = (colors, sizes, stockFn) =>
    colors.flatMap((c) => sizes.map((sz) => ({ color: c, size: sz, stock: stockFn(c, sz) })));

  await createProduct({
    nameEn: 'Silk Bow Blouse', nameAr: 'بلوزة حرير بفيونكة', category: categories['Blouses'],
    descEn: 'A softly draped silk blouse with a delicate bow neckline — effortless elegance for work or evening.',
    descAr: 'بلوزة من الحرير بقصة انسيابية وياقة بفيونكة رقيقة — أناقة سهلة للعمل أو السهرة.',
    price: 890, salePrice: 690, featured: true, isNew: true, images: [IMG.blouse1, IMG.blouse2],
    attributes: [{ field: material, option: material.options['Silk'] }, { field: fit, option: fit.options['Regular'] }, { field: sleeve, option: sleeve.options['Long Sleeve'] }],
    variants: grid(['Beige', 'Black', 'White'], ['S', 'M', 'L', 'XL'], (c, sz) => (c === 'Beige' && sz === 'M' ? 1 : sz === 'XL' ? 0 : 6)),
  });
  await createProduct({
    nameEn: 'Linen Wrap Blouse', nameAr: 'بلوزة كتان لف', category: categories['Blouses'],
    descEn: 'Breathable linen wrap blouse with a flattering tie waist.', descAr: 'بلوزة كتان بقصة لف وخصر مربوط أنيق.',
    price: 650, featured: true, images: [IMG.blouse2, IMG.blouse1],
    attributes: [{ field: material, option: material.options['Linen'] }, { field: fit, option: fit.options['Relaxed'] }, { field: sleeve, option: sleeve.options['Short Sleeve'] }],
    variants: grid(['Beige', 'Olive'], ['S', 'M', 'L'], () => 4),
  });
  await createProduct({
    nameEn: 'Ribbed Knit Top', nameAr: 'توب تريكو مضلع', category: categories['Tops'],
    descEn: 'A fitted ribbed knit top — a wardrobe essential in soft neutrals.', descAr: 'توب تريكو مضلع بقصة ضيقة — قطعة أساسية بألوان هادئة.',
    price: 420, isNew: true, bestSeller: true, soldCount: 40, images: [IMG.top1, IMG.top2],
    attributes: [{ field: material, option: material.options['Cotton'] }, { field: fit, option: fit.options['Slim'] }],
    variants: grid(['Black', 'White', 'Brown'], ['S', 'M', 'L'], () => 8),
  });
  await createProduct({
    nameEn: 'Cotton Poplin Top', nameAr: 'توب قطن بوبلين', category: categories['Tops'],
    descEn: 'Crisp cotton poplin top with a clean, minimal cut.', descAr: 'توب قطن بوبلين بقصة نظيفة وبسيطة.',
    price: 380, salePrice: 300, images: [IMG.top2, IMG.top1],
    attributes: [{ field: material, option: material.options['Cotton'] }, { field: fit, option: fit.options['Regular'] }],
    variants: grid(['White', 'Beige'], ['S', 'M', 'L', 'XL'], () => 5),
  });
  await createProduct({
    nameEn: 'High-Waist Tailored Pants', nameAr: 'بنطلون مفصل بخصر عالي', category: categories['Pants'],
    descEn: 'Tailored high-waist trousers with a straight leg for a polished silhouette.', descAr: 'بنطلون مفصل بخصر عالي وقصة مستقيمة لإطلالة أنيقة.',
    price: 780, featured: true, bestSeller: true, soldCount: 33, images: [IMG.pants1, IMG.pants2],
    attributes: [{ field: material, option: material.options['Crepe'] }, { field: fit, option: fit.options['Slim'] }, { field: length, option: length.options['Full'] }],
    variants: grid(['Black', 'Beige', 'Brown'], ['S', 'M', 'L', 'XL'], (c, sz) => (sz === 'S' ? 2 : 7)),
  });
  await createProduct({
    nameEn: 'Wide-Leg Linen Pants', nameAr: 'بنطلون كتان واسع', category: categories['Pants'],
    descEn: 'Relaxed wide-leg linen pants — cool, elegant and easy to wear.', descAr: 'بنطلون كتان واسع ومريح — أنيق وسهل الارتداء.',
    price: 690, salePrice: 550, isNew: true, images: [IMG.pants2, IMG.pants1],
    attributes: [{ field: material, option: material.options['Linen'] }, { field: fit, option: fit.options['Relaxed'] }, { field: length, option: length.options['Full'] }],
    variants: grid(['Beige', 'Olive'], ['S', 'M', 'L'], () => 6),
  });
  await createProduct({
    nameEn: 'Satin Slip Dress', nameAr: 'فستان ساتان انسيابي', category: categories['Dresses'],
    descEn: 'A bias-cut satin slip dress that catches the light beautifully.', descAr: 'فستان ساتان بقصة مائلة ينساب بجمال مع الضوء.',
    price: 1250, salePrice: 990, featured: true, isNew: true, images: [IMG.dress1, IMG.dress2],
    attributes: [{ field: fabric, option: fabric.options['Satin'] }, { field: length, option: length.options['Maxi'] }, { field: sleeve, option: sleeve.options['Sleeveless'] }],
    variants: grid(['Beige', 'Black'], ['S', 'M', 'L', 'XL'], (c, sz) => (sz === 'M' ? 3 : 5)),
  });
  await createProduct({
    nameEn: 'Midi Wrap Dress', nameAr: 'فستان ميدي لف', category: categories['Dresses'],
    descEn: 'A timeless midi wrap dress with a soft flowing skirt.', descAr: 'فستان ميدي بقصة لف كلاسيكية وتنورة انسيابية.',
    price: 1100, bestSeller: true, soldCount: 28, images: [IMG.dress2, IMG.dress3],
    attributes: [{ field: fabric, option: fabric.options['Jersey'] }, { field: length, option: length.options['Midi'] }, { field: sleeve, option: sleeve.options['Long Sleeve'] }],
    variants: grid(['Black', 'Brown', 'Olive'], ['S', 'M', 'L'], () => 4),
  });
  await createProduct({
    nameEn: 'Pleated Maxi Skirt', nameAr: 'جيبة ماكسي بليسيه', category: categories['Skirts'],
    descEn: 'A fluid pleated maxi skirt that moves with you.', descAr: 'جيبة ماكسي بليسيه انسيابية تتحرك معكِ برشاقة.',
    price: 720, isNew: true, images: [IMG.skirt1, IMG.skirt2],
    attributes: [{ field: material, option: material.options['Chiffon'] }, { field: length, option: length.options['Maxi'] }],
    variants: grid(['Beige', 'Black', 'Olive'], ['S', 'M', 'L'], () => 5),
  });
  await createProduct({
    nameEn: 'A-Line Midi Skirt', nameAr: 'جيبة ميدي كلوش', category: categories['Skirts'],
    descEn: 'A structured A-line midi skirt in a versatile neutral.', descAr: 'جيبة ميدي كلوش منظمة بلون محايد عملي.',
    price: 560, salePrice: 450, images: [IMG.skirt2, IMG.skirt1],
    attributes: [{ field: material, option: material.options['Crepe'] }, { field: length, option: length.options['Midi'] }],
    variants: grid(['Black', 'Brown'], ['S', 'M', 'L', 'XL'], () => 6),
  });
  await createProduct({
    nameEn: 'Two-Piece Blazer Suit', nameAr: 'بدلة بليزر قطعتين', category: categories['Suits'],
    descEn: 'A refined two-piece blazer suit — sharp tailoring, soft palette.', descAr: 'بدلة بليزر من قطعتين — تفصيل دقيق وألوان ناعمة.',
    price: 1890, featured: true, bestSeller: true, soldCount: 15, images: [IMG.suit1, IMG.suit2],
    attributes: [{ field: material, option: material.options['Crepe'] }, { field: fit, option: fit.options['Slim'] }],
    variants: grid(['Beige', 'Black'], ['S', 'M', 'L', 'XL'], () => 3),
  });
  await createProduct({
    nameEn: 'Modest Abaya Dress', nameAr: 'عباية فستان محتشم', category: categories['Modest Wear'],
    descEn: 'A flowing modest maxi dress with full-length sleeves and elegant drape.', descAr: 'فستان محتشم ماكسي بأكمام طويلة وانسيابية أنيقة.',
    price: 1350, isNew: true, featured: true, images: [IMG.modest1, IMG.modest2],
    attributes: [{ field: fabric, option: fabric.options['Satin'] }, { field: length, option: length.options['Maxi'] }, { field: sleeve, option: sleeve.options['Long Sleeve'] }],
    variants: grid(['Beige', 'Black', 'Brown'], ['S', 'M', 'L', 'XL'], () => 5),
  });
  await createProduct({
    nameEn: 'Modest Kimono Set', nameAr: 'طقم كيمونو محتشم', category: categories['Modest Wear'],
    descEn: 'A layered modest kimono set in soft neutral tones.', descAr: 'طقم كيمونو محتشم بطبقات وألوان هادئة.',
    price: 990, salePrice: 790, bestSeller: true, soldCount: 22, images: [IMG.modest2, IMG.modest1],
    attributes: [{ field: fabric, option: fabric.options['Knit'] }, { field: length, option: length.options['Full'] }, { field: sleeve, option: sleeve.options['Long Sleeve'] }],
    variants: grid(['Beige', 'Olive'], ['S', 'M', 'L'], () => 4),
  });

  // ---- Hero banners ----
  const heroBanners = [
    { image: IMG.hero1, labelEn: 'New Collection', labelAr: 'تشكيلة جديدة', titleEn: 'Elegance in Every Detail', titleAr: 'الأناقة في كل التفاصيل', subtitleEn: 'Discover the pieces defining this season', subtitleAr: 'اكتشفي القطع التي تُعرّف هذا الموسم', ctaTextEn: 'Shop Collection', ctaTextAr: 'تسوقي التشكيلة', ctaLink: '/shop', displayOrder: 0 },
    { image: IMG.hero2, labelEn: 'The Daisy Edit', labelAr: 'مختارات ديزي', titleEn: 'Effortless, Timeless, Yours', titleAr: 'بسيطة، خالدة، لكِ', subtitleEn: 'Refined essentials for the modern woman', subtitleAr: 'أساسيات راقية للمرأة العصرية', ctaTextEn: 'Explore Dresses', ctaTextAr: 'اكتشفي الفساتين', ctaLink: '/category/dresses', displayOrder: 1 },
    { image: IMG.hero3, labelEn: 'Modest Edit', labelAr: 'مجموعة الاحتشام', titleEn: 'Grace, Reimagined', titleAr: 'الرقيّ بأسلوب جديد', subtitleEn: 'Modest pieces designed to move with you', subtitleAr: 'قطع محتشمة مصممة لتتحرك معكِ', ctaTextEn: 'Shop Modest', ctaTextAr: 'تسوقي المحتشم', ctaLink: '/category/modest-wear', displayOrder: 2 },
  ];
  for (const b of heroBanners) await prisma.heroBanner.create({ data: b });

  // ---- Homepage sections ----
  const sections = [
    { key: 'categories', type: 'CATEGORIES', titleEn: 'Shop by Category', titleAr: 'تسوقي حسب الفئة', subtitleEn: 'Find your next favourite piece', subtitleAr: 'اعثري على قطعتك المفضلة القادمة', config: JSON.stringify({ limit: 7 }), displayOrder: 0 },
    { key: 'new', type: 'PRODUCTS', titleEn: 'New Arrivals', titleAr: 'وصل حديثاً', subtitleEn: 'Fresh in this week', subtitleAr: 'أحدث ما وصلنا', config: JSON.stringify({ filter: 'new', limit: 8 }), displayOrder: 1 },
    { key: 'editorial', type: 'EDITORIAL', titleEn: 'The Daisy Edit', titleAr: 'مختارات ديزي', subtitleEn: 'Pieces designed for effortless elegance.', subtitleAr: 'قطع مصممة لأناقة سهلة بلا مجهود.', config: JSON.stringify({ image: IMG.editorial, ctaTextEn: 'Explore Collection', ctaTextAr: 'اكتشفي التشكيلة', ctaLink: '/shop' }), displayOrder: 2 },
    { key: 'featured', type: 'PRODUCTS', titleEn: 'Featured', titleAr: 'المميزة', subtitleEn: 'Handpicked by Daisy', subtitleAr: 'اختيار ديزي', config: JSON.stringify({ filter: 'featured', limit: 8 }), displayOrder: 3 },
    { key: 'bestsellers', type: 'PRODUCTS', titleEn: 'Best Sellers', titleAr: 'الأكثر مبيعاً', subtitleEn: 'Loved by our customers', subtitleAr: 'الأكثر رواجاً بين عميلاتنا', config: JSON.stringify({ filter: 'bestsellers', limit: 8 }), displayOrder: 4 },
    { key: 'sale', type: 'PRODUCTS', titleEn: 'On Sale', titleAr: 'تخفيضات', subtitleEn: 'Elegance for less', subtitleAr: 'أناقة بسعر أقل', config: JSON.stringify({ filter: 'sale', limit: 8 }), displayOrder: 5 },
  ];
  for (const s of sections) await prisma.homepageSection.create({ data: s });

  // ---- Policies ----
  const policies = [
    { key: 'shipping', titleEn: 'Shipping Policy', titleAr: 'سياسة الشحن', contentEn: 'We deliver across Egypt within 2–5 business days. Delivery fees are calculated at checkout. You will receive your order number to track your order status.', contentAr: 'نقوم بالتوصيل في جميع أنحاء مصر خلال 2–5 أيام عمل. تُحتسب رسوم التوصيل عند إتمام الطلب. ستحصلين على رقم الطلب لمتابعة حالته.' },
    { key: 'return', titleEn: 'Return Policy', titleAr: 'سياسة الاسترجاع', contentEn: 'Items can be returned within 14 days of delivery in their original condition with tags attached. To start a return, contact us with your order number.', contentAr: 'يمكن استرجاع المنتجات خلال 14 يوماً من الاستلام بحالتها الأصلية مع بقاء البطاقات. لبدء الاسترجاع تواصلي معنا مع رقم الطلب.' },
    { key: 'privacy', titleEn: 'Privacy Policy', titleAr: 'سياسة الخصوصية', contentEn: 'We respect your privacy. Your personal information is used solely to process and deliver your orders and is never sold to third parties.', contentAr: 'نحترم خصوصيتك. تُستخدم بياناتك الشخصية فقط لمعالجة وتوصيل طلباتك ولا تُباع لأي طرف ثالث.' },
    { key: 'terms', titleEn: 'Terms & Conditions', titleAr: 'الشروط والأحكام', contentEn: 'By placing an order with Daisy you agree to our terms of service. Prices are in EGP and payment is Cash on Delivery.', contentAr: 'بإتمام طلبك مع ديزي فإنك توافقين على شروط الخدمة. الأسعار بالجنيه المصري والدفع عند الاستلام.' },
  ];
  for (const p of policies) await prisma.policy.create({ data: p });

  // ---- Governorate delivery fees (all 27 Egyptian governorates) ----
  const governorates = [
    ['Cairo', 'القاهرة', 50], ['Giza', 'الجيزة', 50], ['Qalyubia', 'القليوبية', 55],
    ['Alexandria', 'الإسكندرية', 60], ['Dakahlia', 'الدقهلية', 60], ['Sharqia', 'الشرقية', 60],
    ['Gharbia', 'الغربية', 60], ['Monufia', 'المنوفية', 60], ['Beheira', 'البحيرة', 65],
    ['Kafr El Sheikh', 'كفر الشيخ', 65], ['Damietta', 'دمياط', 65], ['Port Said', 'بورسعيد', 70],
    ['Ismailia', 'الإسماعيلية', 70], ['Suez', 'السويس', 70], ['Faiyum', 'الفيوم', 65],
    ['Beni Suef', 'بني سويف', 70], ['Minya', 'المنيا', 75], ['Asyut', 'أسيوط', 80],
    ['Sohag', 'سوهاج', 85], ['Qena', 'قنا', 90], ['Luxor', 'الأقصر', 95],
    ['Aswan', 'أسوان', 100], ['Red Sea', 'البحر الأحمر', 110], ['New Valley', 'الوادي الجديد', 120],
    ['Matrouh', 'مطروح', 110], ['North Sinai', 'شمال سيناء', 120], ['South Sinai', 'جنوب سيناء', 120],
  ];
  for (let i = 0; i < governorates.length; i++) {
    const [nameEn, nameAr, fee] = governorates[i];
    await prisma.governorateFee.create({ data: { nameEn, nameAr, fee, displayOrder: i } });
  }

  console.log('Seed complete. Admin:', process.env.ADMIN_EMAIL || 'admin@daisy.com');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
