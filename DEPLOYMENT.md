# Next.js Commandapp - Deployment Guide

This is the Next.js version of the Commandapp restaurant ordering system with serverless API routes.

## 🚀 Serverless Functions

The app uses Next.js API Routes which automatically become serverless functions when deployed to platforms like Vercel, Netlify, or AWS.

### API Endpoints

All API routes are located in `src/app/api/` and are automatically deployed as serverless functions:

- **GET `/api/products`** - Fetch all products grouped by category
- **POST `/api/orders`** - Create a new order
- **GET `/api/orders`** - Get all orders
- **GET `/api/orders/[id]`** - Get a specific order by ID
- **PATCH `/api/orders/[id]`** - Update order status

### How Serverless Functions Work in Next.js

Next.js API Routes automatically become serverless functions:
- Each file in `src/app/api/` becomes an endpoint
- Functions are stateless and scale automatically
- Cold starts are minimal with modern platforms
- No server management required

## 📦 Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
copy .env.local.example .env.local
```

Edit `.env.local` and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Get these values from your Supabase project:
1. Go to https://app.supabase.com
2. Select your project
3. Go to Settings > API
4. Copy the Project URL and anon/public key

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## 🌐 Deployment

### Deploy to Vercel (Recommended)

Vercel is the easiest way to deploy Next.js apps with serverless functions:

1. **Install Vercel CLI** (optional):
   ```bash
   npm i -g vercel
   ```

2. **Deploy via CLI**:
   ```bash
   vercel
   ```

3. **Or deploy via GitHub**:
   - Push your code to GitHub
   - Go to [vercel.com](https://vercel.com)
   - Import your repository
   - Add environment variables in project settings
   - Deploy!

4. **Add Environment Variables in Vercel**:
   - Go to Project Settings > Environment Variables
   - Add `NEXT_PUBLIC_SUPABASE_URL`
   - Add `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Deploy to Netlify

1. **Install Netlify CLI** (optional):
   ```bash
   npm i -g netlify-cli
   ```

2. **Deploy**:
   ```bash
   netlify deploy --prod
   ```

3. **Or deploy via Git**:
   - Connect your GitHub repo to Netlify
   - Add environment variables in site settings
   - Deploy!

### Deploy to AWS (using SST or Serverless Framework)

For AWS deployment, you'll need additional configuration. Consider using:
- [SST](https://sst.dev/) - Modern serverless framework
- [Serverless Next.js](https://github.com/serverless-nextjs/serverless-next.js)

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test-order-flow` - Test order creation flow

## 📝 Key Differences from React App

1. **API Routes**: Instead of separate backend, API routes are in `src/app/api/`
2. **Environment Variables**: Use `NEXT_PUBLIC_` prefix for client-side variables
3. **Automatic Code Splitting**: Better performance out of the box
4. **Server & Client Components**: Use `'use client'` directive for client components
5. **Serverless by Default**: All API routes are serverless functions

## 🗄️ Database Setup

Make sure your Supabase database has:
- `products` table with columns: id, name, price, image, details, category_id
- `categories` table with columns: id, name
- `orders` table with columns: order_id, total, status, created_at
- `order_items` table with columns: id, order_id, product_id, name, price, quantity, subtotal

RLS (Row Level Security) policies should allow:
- Anyone to read products
- Anyone to insert orders and order_items
- Authenticated users to read their own orders

## 🎨 Styling

The app uses:
- **Bootstrap 5.3.3** - Loaded via CDN in layout.tsx
- **Poppins Font** - Google Fonts
- **Material Symbols** - For icons
- **Custom CSS** - In globals.css and app.css

## 🆘 Troubleshooting

### API Routes Not Working
- Make sure you have environment variables set in `.env.local`
- Check that Supabase URL and key are correct
- Verify RLS policies in Supabase

### Styling Issues
- Ensure Bootstrap is loading (check browser console)
- Verify className usage matches Bootstrap conventions
- Check that globals.css is imported in layout.tsx

### Deployment Issues
- Verify all environment variables are set on hosting platform
- Check build logs for errors
- Ensure database connection works from deployed environment

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Deploy on Vercel](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
