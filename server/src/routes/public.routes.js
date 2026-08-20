import { Router } from 'express';
import { listProducts, getProduct, getFilters } from '../controllers/product.controller.js';
import { listCategories, getCategory } from '../controllers/category.controller.js';
import {
  getSettings, getHero, getHomepage, listPolicies, getPolicy, listGovernorates,
} from '../controllers/storefront.controller.js';
import { listPublic as listFields } from '../controllers/admin/field.controller.js';

const r = Router();

// Products
r.get('/products/filters', getFilters);
r.get('/products', listProducts);
r.get('/products/:slug', getProduct);

// Categories
r.get('/categories', listCategories);
r.get('/categories/:slug', getCategory);

// Fields (read-only, for filters + product display)
r.get('/product-fields', listFields);

// Storefront
r.get('/settings', getSettings);
r.get('/governorates', listGovernorates);
r.get('/hero', getHero);
r.get('/homepage', getHomepage);
r.get('/policies', listPolicies);
r.get('/policies/:key', getPolicy);

export default r;
