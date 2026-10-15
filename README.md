# 🌾 Benue Market

**Buy. Sell. Connect.** — A direct farm-produce marketplace connecting buyers with verified farmers, grain cooperatives, and livestock rearers across all 23 Local Government Areas of Benue State, Nigeria.

![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-6-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4-38bdf8?logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?logo=supabase)
![Paystack](https://img.shields.io/badge/Paystack-Payments-00C3F7)

---

## ✨ Features

### For Buyers
- **Browse Products** — Search and filter farm produce by category, LGA, price range, and availability
- **Farmer Directory** — Discover verified farmers and cooperatives with ratings and reviews
- **Direct Contact** — Reach sellers via phone call or WhatsApp — no middleman
- **Save Favorites** — Bookmark products for quick access later

### For Sellers (Farmers & Cooperatives)
- **List Products** — Upload produce with images, pricing, quantities, and quality grades
- **Farmer Dashboard** — Manage listings, track views, and update availability status
- **Advertise Products** — Promote listings with Paystack-powered sponsored placement (₦1,000/30 days)
- **Profile Management** — Cover photos, gallery, bio, and verification badges

### For Administrators
- **User Management** — Verify farmers, suspend accounts, manage roles (buyer/seller/admin/super_admin)
- **Product Moderation** — Review and remove listings; handle reports and complaints
- **Advertising Management** — Approve, disable, and trash advertisements with full audit trail
- **Audit Logs** — Complete activity trail with filtering, multi-select pruning, and bulk operations
- **Reports & Analytics** — Review user reports with status tracking

### Security
- **Supabase Auth** — Email/password authentication with secure session management
- **Row Level Security (RLS)** — PostgreSQL policies enforce data access at the database level
- **OTP Password Reset** — Secure OTP generation with SHA-256 hashing and attempt limits
- **Rate Limiting** — Complaint submission and login attempt throttling
- **Account Lockout** — Progressive lockout (5-min → permanent) after failed login attempts

---

## 🏗️ Architecture

```
benue-market/
├── src/
│   ├── components/
│   │   ├── admin/          # Admin dashboard tabs & modals
│   │   ├── common/         # Navbar, Footer, ProtectedRoute, Modals
│   │   ├── farmer/         # Farmer-specific components
│   │   └── marketplace/    # ProductCard, CategoryCard, SponsoredProducts
│   ├── context/
│   │   ├── AuthContext.tsx  # Authentication, users, reviews, reports, admin ops
│   │   └── ProductContext.tsx
│   ├── pages/              # Route-level page components
│   ├── services/
│   │   ├── supabaseClient.ts
│   │   ├── profileService.ts
│   │   ├── productService.ts
│   │   ├── advertisingService.ts
│   │   └── emailService.ts
│   ├── types/              # TypeScript type definitions
│   ├── constants/          # Benue LGAs, produce categories
│   ├── data/               # Mock/seed data
│   └── utils/              # Formatters, validators, OTP security
├── supabase/
│   └── fix_supabase_backend.sql  # Complete database schema & RLS policies
├── vercel.json             # Vercel deployment config (SPA routing)
└── .env.example            # Environment variable template
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript 6, Vite 8 |
| **Styling** | Tailwind CSS 4 |
| **Icons** | Lucide React |
| **Backend** | Supabase (PostgreSQL 15+, Auth, Storage) |
| **Payments** | Paystack (test & live modes) |
| **Email** | EmailJS / Resend API |
| **Hosting** | Vercel |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- npm 10+
- A [Supabase](https://supabase.com) project
- A [Paystack](https://paystack.com) account (optional, for advertising payments)

### Installation

```bash
# Clone the repository
git clone https://github.com/keghtorterhemba19-star/benue-market.git
cd benue-market

# Install dependencies
npm install

# Copy environment template and configure
cp .env.example .env
# Edit .env with your Supabase URL, anon key, and Paystack keys
```

### Database Setup

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Paste and run the contents of `supabase/fix_supabase_backend.sql`

This script creates/repairs:
- `profiles` table with all required columns
- `products` table indexes
- `advertisements` table with payment & trash management
- `password_reset_otps` table
- Auth trigger for automatic profile creation
- Row Level Security (RLS) policies
- Storage bucket with access policies
- Performance indexes

### Development

```bash
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # Run Oxlint
```

---

## 🔐 Environment Variables

See [`.env.example`](.env.example) for the full list. Key variables:

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `VITE_PAYSTACK_PUBLIC_KEY` | Paystack public key for payments |
| `VITE_SUPER_ADMIN_EMAIL` | Super admin email address |
| `VITE_EMAILJS_*` | EmailJS credentials for password reset emails |

---

## 📦 Deployment

The project is configured for **Vercel** deployment:

```bash
# Build and deploy
vercel --prod
```

The `vercel.json` handles SPA routing — all routes are rewritten to `index.html`.

---

## 🗂️ Produce Categories

| Category | Examples |
|----------|---------|
| 🌾 Grains | Rice, Maize, Millet, Sorghum, Guinea Corn |
| 🥔 Tubers | Yam, Cassava, Sweet Potato, Cocoyam |
| 🫘 Legumes | Soybeans, Groundnuts, Bambaranuts, Cowpeas |
| 🥬 Vegetables | Tomatoes, Peppers, Spinach, Okra |
| 🍊 Fruits | Oranges, Mangoes, Pineapple, Guava |
| 🐄 Livestock | Cattle, Goats, Sheep, Pigs |
| 🐔 Poultry | Chickens, Turkeys, Guinea Fowl |
| 🐟 Fish | Catfish, Tilapia, Crayfish |

---

## 👥 User Roles

| Role | Capabilities |
|------|-------------|
| **Buyer** | Browse, search, save, contact sellers, submit reports |
| **Seller** | All buyer features + list products, manage dashboard, advertise |
| **Admin** | All seller features + moderate content, verify farmers, manage users |
| **Super Admin** | All admin features + add/remove admins, system-level control |

---

## 📄 License

This project is proprietary. All rights reserved.

---

<p align="center">
  <strong>🌿 Benue Market — Empowering Benue State's Agricultural Economy</strong><br>
  <em>Direct farm-gate pricing with zero middleman markups</em>
</p>
