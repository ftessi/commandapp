# Order Management System - Admin Guide

## System Overview

This is a complete order management system with three user roles:

### 1. **Customer** (Main App)
- Browse menu and add items to cart
- Place orders
- Receive ticket number (TI-XXX for tickets, DR-XXXX for drinks)
- Go to payment counter with ticket number

### 2. **Payment Admin** (`/admin/payments`)
- See all pending orders (status: `pending`)
- Search orders by ticket number
- Confirm payment and mark orders as `paid`

### 3. **Bar Admin** (`/admin/bar`)
- See only paid orders ready to be prepared
- Mark orders as `preparing` when starting
- Mark orders as `completed` when delivered

## Order Flow

```
1. Customer places order
   ↓
   Status: PENDING
   Receives: Ticket Number (TI-XXX or DR-XXXX)
   
2. Customer goes to payment counter
   Shows ticket number
   ↓
   Payment Admin marks as PAID
   Status: PAID
   
3. Customer goes to bar
   ↓
   Bar Admin starts preparing
   Status: PREPARING
   
4. Order ready
   Customer receives order
   ↓
   Bar Admin marks as COMPLETED
   Status: COMPLETED
```

## Ticket Number System

### TI-XXX (Tickets)
- **Format**: TI-001 to TI-999
- **Used for**: Food, tickets, non-drink items (Product ID > 20)
- **3 digits** with leading zeros

### DR-XXXX (Drinks)
- **Format**: DR-0001 to DR-9999
- **Used for**: Drinks only (Product ID ≤ 20)
- **4 digits** with leading zeros

The system automatically determines the ticket type based on the products in the order.

## Admin Access

### Login Credentials (Default)

**Payment Admin:**
- URL: `http://localhost:3000/admin`
- Username: `admin`
- Password: `admin123`
- Redirects to: `/admin/payments`

**Bar Admin:**
- URL: `http://localhost:3000/admin`
- Username: `bar`
- Password: `bar123`
- Redirects to: `/admin/bar`

⚠️ **Security Note**: Change these credentials in production!

## Payment Admin Dashboard

**URL**: `/admin/payments`

**Features**:
- View all pending orders
- Search by ticket number
- Real-time order display
- One-click payment confirmation

**Actions**:
1. Customer arrives with ticket number
2. Search for ticket (e.g., "TI-042")
3. Verify order details and total
4. Click "Mark as Paid"
5. Order moves to Bar Admin dashboard

## Bar Admin Dashboard

**URL**: `/admin/bar`

**Features**:
- Two-column layout:
  - **Left**: Paid orders ready to prepare
  - **Right**: Orders currently being prepared
- Auto-refresh every 10 seconds
- Large, easy-to-read ticket numbers

**Actions**:

**Starting an order:**
1. Order appears in "Ready to Prepare" column
2. Click "Start Preparing"
3. Order moves to "In Preparation" column

**Completing an order:**
1. Order is in "In Preparation" column
2. Prepare the items
3. Customer arrives
4. Click "Mark as Completed"
5. Order removed from dashboard

## Database Schema

### Orders Table
```sql
CREATE TABLE orders (
  order_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number VARCHAR(10) UNIQUE NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL, -- 'pending', 'paid', 'preparing', 'completed'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Order Items Table
```sql
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id UUID REFERENCES orders(order_id),
  product_id INTEGER,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL
);
```

### Ticket Counters Table
```sql
CREATE TABLE ticket_counters (
  type VARCHAR(10) PRIMARY KEY, -- 'ticket' or 'drink'
  current_number INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## API Endpoints

### Orders

**Create Order**
```http
POST /api/orders
Content-Type: application/json

{
  "total": 15.50,
  "items": [
    { "productId": 1, "name": "Coffee", "price": 3.50, "quantity": 2 },
    { "productId": 25, "name": "Sandwich", "price": 8.50, "quantity": 1 }
  ]
}
```

**Get Orders (with filters)**
```http
GET /api/orders?status=pending
GET /api/orders?status=paid
GET /api/orders?ticketNumber=TI-042
```

**Update Order Status**
```http
PATCH /api/orders/:orderId
Content-Type: application/json

{
  "status": "paid" | "preparing" | "completed"
}
```

## Setup Instructions

### 1. Run Database Migration

Execute the SQL migration in Supabase SQL Editor:

```sql
-- Run: supabase/migrations/add_ticket_numbers.sql
```

This will:
- Add `ticket_number` column to orders
- Create `ticket_counters` table
- Set up proper indexes and RLS policies

### 2. Start Development Server

```bash
cd nextjs-app
npm run dev
```

### 3. Access Admin Panels

- Payment Admin: http://localhost:3000/admin (login with admin/admin123)
- Bar Admin: http://localhost:3000/admin (login with bar/bar123)

## Troubleshooting

### Orders not appearing in admin dashboards

**Check**:
1. Order status in database
2. Browser console for API errors
3. Supabase RLS policies allow SELECT

**Fix**:
```sql
-- Grant read access to orders
GRANT SELECT ON orders TO anon;
GRANT SELECT ON order_items TO anon;
```

### Ticket numbers not generating

**Check**:
1. `ticket_counters` table exists
2. RLS policies allow UPDATE on ticket_counters

**Fix**:
```sql
-- Grant update access to ticket counters
GRANT SELECT, UPDATE ON ticket_counters TO anon;
```

### Authentication issues

**Check**:
1. localStorage in browser (admin Auth and adminRole)
2. Clear browser cache and try again

**Fix**:
```javascript
// In browser console:
localStorage.clear();
// Then login again
```

## Production Deployment

### 1. Change Admin Credentials

Edit `/src/app/admin/page.tsx`:

```typescript
// Replace hardcoded credentials
if (username === 'YOUR_SECURE_USERNAME' && password === 'YOUR_SECURE_PASSWORD') {
  // ...
}
```

### 2. Use Environment Variables

Create proper auth system with:
- JWT tokens
- Password hashing (bcrypt)
- Session management
- Role-based access control (RBAC)

### 3. Secure API Routes

Add middleware to protect admin endpoints:

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('admin_token');
  if (!token) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }
}

export const config = {
  matcher: ['/admin/payments/:path*', '/admin/bar/:path*']
};
```

### 4. Use HTTPS

Ensure all production traffic uses HTTPS.

### 5. Set up Proper Database Policies

Review and tighten RLS policies in Supabase.

## Support

For issues or questions:
1. Check browser console for errors
2. Check Supabase logs
3. Review this documentation
4. Contact system administrator

---

**Last Updated**: October 2025  
**Version**: 1.0.0
