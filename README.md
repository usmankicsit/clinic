# Bait Al Shifa Natural Herbs — Clinic POS

Single-shop point-of-sale and online store for **Bait Al Shifa Natural Herbs** (herbal wellness clinic).

## Stack

- **Backend:** NestJS + TypeORM + PostgreSQL + JWT
- **Frontend:** Next.js (App Router) + TypeScript

## Roles

| Capability | Super Admin | Staff |
|---|---|---|
| POS checkout | yes | yes |
| Update order status | yes | yes |
| Today's orders/sales | yes | yes |
| Catalog / inventory / users / reports / settings | yes | no |

## Setup

### 1. Database

Using Docker (if available):

```bash
docker compose up -d
```

Or local Postgres — create DB/user matching `backend/.env`. This repo defaults to port **5434**:

```bash
# example with Homebrew postgresql@14 listening on 5434
createdb -p 5434 clinic_pos
# user/password: clinic / clinic (see backend/.env)
```

### 2. Backend

```bash
cd backend
cp .env.example .env   # edit if needed
npm install
npm run start:dev
```

API: `http://localhost:3001/api`

### 3. Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

App: `http://localhost:3000`

## Seed accounts

| Role | Email | Password |
|---|---|---|
| Super Admin | `admin@clinic.health` | `Admin123!` |
| Staff | `staff@clinic.health` | `Cashier123!` |
| Patient / Customer | `patient@clinic.health` | `Customer123!` |

Herbal catalog (Honey, Joint Care, Fertility, Wellness, Premium Ingredients) is seeded on first backend start when `SEED_ON_START=true`.

## Customer website

- Landing: `http://localhost:3000`
- Order online: `http://localhost:3000/shop/login`
- Staff receives online orders at **Online Orders** in the staff app
- **Print invoice** is available on POS (after sale), Orders, Online Orders, and customer My Orders

## Brand

- **Name:** Bait Al Shifa Natural Herbs
- **Tagline:** Nature's Premium Choice
- **Colors:** `#027e01` / `#017101`
- **Address:** 1103A, Mall of Islamabad, Blue Area, Islamabad
- **Phone / WhatsApp:** +92 336 3887222

## Install as PWA (phone & desktop)

PWA install works with a **production** frontend build (service worker is disabled in `npm run dev`):

```bash
cd frontend
npm run build
npm run start
```

Then open the app in Chrome/Edge/Safari and install **Bait Al Shifa**.
