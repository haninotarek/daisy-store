# Daisy — Women's Fashion E-commerce

A complete, real full-stack online store for the **Daisy** women's fashion brand.

**Stack:** React + Vite + React Router (client) · Node.js + Express (server) · Prisma + SQLite (database, swappable to Postgres) · JWT auth · Cloudinary-or-local image uploads.

Everything is wired to a real backend and database — dynamic categories, a flexible
product-attribute/variant system, per-variant inventory with atomic stock transactions,
cart, wishlist, guest & member checkout (Cash on Delivery), orders, and a full admin
dashboard. Bilingual **Arabic + English** with **RTL/LTR**, plus **light/dark** mode.

---

## Project structure

```
daisy/
├── server/            # Node + Express + Prisma API
│   ├── prisma/
│   │   ├── schema.prisma   # database schema
│   │   └── seed.js         # demo data + admin account
│   ├── src/
│   │   ├── config/         # prisma client
│   │   ├── controllers/    # route handlers (+ controllers/admin)
│   │   ├── middleware/     # auth, error handling
│   │   ├── routes/         # express routers
│   │   ├── services/       # product / cart / order / upload logic
│   │   └── index.js        # app entry
│   └── uploads/            # local image storage (when Cloudinary is off)
├── client/            # React app (Vite)
│   ├── public/logo.png     # Daisy logo (replaceable in Admin → Settings)
│   └── src/
│       ├── components/     # Navbar, Footer, ProductCard, ImageUploader, …
│       ├── context/        # Auth, Cart, Wishlist, UI (theme/lang/toasts)
│       ├── layouts/        # StoreLayout, AdminLayout
│       ├── pages/          # storefront pages (+ pages/admin)
│       ├── services/api.js # centralized API layer
│       └── i18n/           # AR/EN translations
└── README.md
```

---

## Quick start

You need **Node.js 18+**. Open two terminals.

### 1) Backend

```bash
cd server
npm install
cp .env.example .env        # then edit values (a working .env is already included for dev)
npm run setup               # generates client, creates DB schema, seeds demo data
npm run dev                 # starts API on http://localhost:5000
```

`npm run setup` runs: `prisma generate` → `prisma db push` → `node prisma/seed.js`.

### 2) Frontend

```bash
cd client
npm install
npm run dev                 # starts the store on http://localhost:5173
```

Open **http://localhost:5173**. The Vite dev server proxies `/api` and `/uploads`
to the backend on port 5000.

---

## Accounts (from seed)

| Role     | Email             | Password         |
|----------|-------------------|------------------|
| Admin    | `admin@daisy.com` | `Daisy@Admin123` |
| Customer | `sara@example.com`| `password123`    |

Admin dashboard: **http://localhost:5173/admin**
Change the admin credentials via `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `server/.env`
before running the seed (never ship the default password to production).

---

## Environment variables (`server/.env`)

| Variable | Purpose |
|----------|---------|
| `PORT` | API port (default 5000) |
| `CLIENT_URL` | Allowed CORS origin(s), comma-separated |
| `DATABASE_URL` | DB connection. Default `file:./dev.db` (SQLite) |
| `JWT_SECRET` | Secret for signing auth tokens — **change in production** |
| `JWT_EXPIRES_IN` | Token lifetime (default `30d`) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | Seed admin account |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Optional. If all three are set, uploads go to Cloudinary; otherwise they're saved to `server/uploads/` and served by the API. |

---

## The flexible product system

Products are **not** hardcoded to fixed fields like size/color. Instead:

1. **Product Fields** (Admin → Product Fields) define reusable attributes —
   Size, Color, Material, Fit, Length, Sleeve Type, or anything the owner adds.
   Each field has a type (Text, Number, Select, Multi-select, Boolean, Color, Size),
   options, and flags: *filterable*, *required*, *used for variants*.
2. **Categories** choose which fields apply to them (Admin → Categories).
3. When adding a product, the form shows exactly the fields configured for the
   chosen category. Fields marked *used for variants* (e.g. Size, Color) drive the
   **variant matrix**, where each combination (e.g. `Beige / M`) has its own stock.
4. Storefront **filters** are generated automatically from filterable fields.

## Inventory safety

Orders are created inside a database transaction. Each stock decrement is a guarded
conditional update (`WHERE stock >= quantity`); if any line can't be satisfied the whole
order is rolled back. Stock can never go negative, and two shoppers can't buy the last
unit of the same variant.

## Switching to PostgreSQL

1. In `server/prisma/schema.prisma`, set `datasource db { provider = "postgresql" }`.
2. Set `DATABASE_URL` to your Postgres connection string.
3. `npx prisma migrate deploy` (or `npx prisma db push`) then `npm run seed`.

The schema avoids SQLite-only features, so no model changes are needed.

---

## Production build

```bash
cd client && npm run build      # outputs client/dist
cd ../server && npm start       # serves the API
```

Serve `client/dist` from any static host (or add a static handler to Express) and point
it at the API. Set real `JWT_SECRET`, admin credentials, `CLIENT_URL`, and Cloudinary keys.
