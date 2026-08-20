import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { uploadMiddleware } from '../services/upload.service.js';
import { uploadImages } from '../controllers/upload.controller.js';
import * as products from '../controllers/admin/product.controller.js';
import * as categories from '../controllers/admin/category.controller.js';
import * as fields from '../controllers/admin/field.controller.js';
import * as misc from '../controllers/admin/misc.controller.js';
import * as merch from '../controllers/admin/merchandising.controller.js';

const r = Router();
r.use(requireAdmin); // every admin route requires an admin token

// Uploads
r.post('/upload', uploadMiddleware.array('images', 12), uploadImages);

// Dashboard
r.get('/dashboard', misc.dashboard);

// Products
r.get('/products', products.listAdminProducts);
r.get('/products/:id', products.getAdminProduct);
r.post('/products', products.createProduct);
r.put('/products/:id', products.updateProduct);
r.patch('/products/:id', products.patchProduct);
r.post('/products/:id/duplicate', products.duplicateProduct);
r.delete('/products/:id', products.deleteProduct);

// Categories
r.get('/categories', categories.listAll);
r.post('/categories', categories.create);
r.put('/categories/reorder', categories.reorder);
r.put('/categories/:id', categories.update);
r.delete('/categories/:id', categories.remove);

// Product fields
r.get('/product-fields', fields.list);
r.post('/product-fields', fields.create);
r.put('/product-fields/:id', fields.update);
r.delete('/product-fields/:id', fields.remove);

// Orders
r.get('/orders', misc.listOrders);
r.get('/orders/:id', misc.getOrder);
r.put('/orders/:id/status', misc.updateOrderStatus);

// Customers
r.get('/customers', misc.listCustomers);

// Hero banners
r.get('/hero', merch.listHero);
r.post('/hero', merch.createHero);
r.put('/hero/reorder', merch.reorderHero);
r.put('/hero/:id', merch.updateHero);
r.delete('/hero/:id', merch.deleteHero);

// Homepage sections
r.get('/homepage', merch.listSections);
r.post('/homepage', merch.createSection);
r.put('/homepage/:id', merch.updateSection);
r.delete('/homepage/:id', merch.deleteSection);

// Settings
r.get('/settings', misc.getSettings);
r.put('/settings', misc.updateSettings);

// Governorate delivery fees
r.get('/governorates', misc.listGovernorateFees);
r.put('/governorates', misc.updateGovernorateFees);

// Policies
r.put('/policies/:key', misc.updatePolicy);

export default r;
