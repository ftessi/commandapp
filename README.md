# Commandapp - Ticketing and order service

A modern venue ticket/ordering system built.

## 🚀 Features

- **Digital Menu**: Browse products by category
- **Cart Management**: Add/remove items with real-time totals
- **Order Placement**: Submit orders to Supabase database
- **Order History**: View current and past orders
- **Serverless API Routes**: Built-in Next.js API routes for backend
- **Row Level Security**: Secure data access with Supabase RLS policies

## 📁 Project Structure

```
nextjs-app/
├── src/
│   ├── app/
│   │   ├── api/              # Next.js API routes
│   │   │   ├── products/     # GET products endpoint
│   │   │   └── orders/       # POST/GET/PATCH orders endpoints
│   │   ├── layout.tsx        # Root layout with ProductProvider
│   │   ├── page.tsx          # Main page (menu/resume/order history)
│   │   └── globals.css       # Global styles
│   ├── components/           # React components
│   ├── containers/           # Container components
│   ├── context/              # React Context (ProductsDataContext)
│   ├── services/             # Supabase client
│   ├── types/                # TypeScript types
│   └── assets/               # Static assets (products.json, images)
├── scripts/                  # Test and utility scripts
└── public/                   # Public static files
```

## 🛠️ Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account with project set up

### Installation

1. **Clone and navigate to the project**:
   ```bash
   cd nextjs-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

   Copy from `.env.example` and fill in your Supabase credentials.

4. **Set up the database**:
   
   Run the SQL migration to create tables and seed data (see the react-ts-front project for scripts):
   ```bash
   psql postgresql://postgres:your_password@your_db_url -f scripts/supabase/init_tables_and_seed.sql
   psql postgresql://postgres:your_password@your_db_url -f scripts/supabase/rls_policies.sql
   ```

## 🚀 Running the App

### Development Mode

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm start
```

### Test API Integration

Run the integration test to verify the entire order flow:

```bash
npm run test-order-flow
```

This tests:
- ✅ Health check
- ✅ Fetch products
- ✅ Create order
- ✅ Fetch order by ID
- ✅ Update order status
- ✅ List all orders

## 📡 API Routes

All API routes are built into Next.js:

### Products
- `GET /api/products` - Fetch all products grouped by category

### Orders
- `POST /api/orders` - Create a new order
- `GET /api/orders` - List all orders (admin)
- `GET /api/orders/[id]` - Fetch single order by ID
- `PATCH /api/orders/[id]` - Update order status

## 🗄️ Database Schema

### Tables
- **categories**: Product categories
- **products**: Menu items with prices and details
- **orders**: Customer orders with status tracking
- **order_items**: Line items for each order

### RLS Policies
All endpoints use the Supabase anon key with Row Level Security policies:
- Public read access for products and categories
- Anyone can create and read orders (pre-authentication setup)
- Admin operations supported via service_role key (optional)

## 🔐 Security

- **No service_role key required**: Uses RLS policies for secure data access
- **Client-safe**: All API routes use anon key by default
- **Type-safe**: Full TypeScript coverage

## 🎨 Styling

- Custom CSS (no Tailwind)
- Responsive design
- Bootstrap-compatible structure

## 📦 Dependencies

### Core
- **next**: 14.2.0 - React framework
- **react**: 18.3.1 - UI library
- **@supabase/supabase-js**: 2.57.2 - Database client
- **uuid**: 11.1.0 - Unique ID generation

### Dev Dependencies
- **typescript**: 5.0.0
- **@types/node**, **@types/react**, **@types/uuid**
- **eslint** with Next.js config

## 🧪 Testing

The project includes an integration test script that verifies the complete order flow from cart to database.

## 📝 Migration from React App

This Next.js app is a migration from a Create React App. Key changes:

1. **API Routes**: Moved from Vercel serverless functions to Next.js API routes
2. **Routing**: Uses context-based view switching (not Next.js routing)
3. **SSR Ready**: Components marked with 'use client' where needed
4. **Unified Structure**: Single app for frontend and backend

## 🚢 Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

Configure environment variables in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Other Platforms

The app can be deployed to any platform supporting Next.js:
- Netlify
- AWS Amplify
- Railway
- Render

## 📄 License

Private project

## 🤝 Contributing

This is a private project. Contact the owner for contribution guidelines.
