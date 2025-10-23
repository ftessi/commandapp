# Routing Structure

## Overview
The app now uses proper Next.js App Router with dedicated pages for each section.

## Routes

### `/` - Landing Page
- **File**: `src/app/page.tsx` → renders `src/components/LandingPage.tsx`
- **Purpose**: Home page with XCEED logo and 3 main navigation buttons
- **Features**:
  - Get Tickets button → navigates to `/tickets`
  - Order button → navigates to `/order`
  - Info button → navigates to `/info`

### `/tickets` - Ticket Purchase
- **File**: `src/app/tickets/page.tsx` → renders `src/components/TicketsPage.tsx`
- **Purpose**: Event ticket purchasing system
- **Features**:
  - Display available ticket types
  - Purchase form (first name, last name, email)
  - Ticket confirmation with pending payment status
  - Back to home button

### `/order` - Food/Drink Ordering
- **File**: `src/app/order/page.tsx`
- **Purpose**: Food and drink ordering system (existing menu)
- **Features**:
  - Shows Navbar with category navigation
  - Shows CartBar with cart total
  - Handles 3 sub-views via context state:
    - `menu` - Product menu (MenuContainer)
    - `resume` - Cart checkout (ResumeContainer)
    - `orderHistory` - Active orders tracking (OrderHistoryContainer)

### `/info` - Venue Information
- **File**: `src/app/info/page.tsx` → renders `src/components/InfoPage.tsx`
- **Purpose**: Contact and venue information page
- **Features**:
  - Venue location and details
  - Event information
  - Opening hours
  - Social media links
  - Map placeholder
  - Back to home button

### `/admin/*` - Admin Dashboards
- **Files**: Existing admin routes remain unchanged
  - `/admin` - Admin login
  - `/admin/payments` - Payment management
  - `/admin/bar` - Bar order management
  - `/admin/tickets` - (To be created) Ticket management

## Navigation System

### Link-based Navigation (New)
- All main navigation between routes uses Next.js `<Link>` components
- Landing page buttons link to `/tickets`, `/order`, `/info`
- Back to home buttons link to `/`

### Context-based Navigation (Existing)
- Still used within the `/order` page for sub-views:
  - `navigateToMenu()` - Show menu
  - `navigateToResume()` - Show cart checkout
  - `navigateToOrderHistory()` - Show order tracking
- Context state: `currentView` manages these sub-views

## Component Structure

### Standalone Pages (Full Screen)
- `LandingPage` - No navbar/cart
- `TicketsPage` - No navbar/cart, has own header
- `InfoPage` - No navbar/cart, has own header

### Order Page (With UI Elements)
- Always shows `Navbar` (top nav with menu categories)
- Always shows `CartBar` (bottom cart summary)
- Content switches between MenuContainer/ResumeContainer/OrderHistoryContainer

## Migration Notes

**Changes from Previous Structure:**
1. ✅ Removed single-page app state management for main navigation
2. ✅ Each main section is now a proper Next.js route
3. ✅ `currentView` state still used for order page sub-navigation
4. ✅ All navigation functions (`navigateToTickets`, `navigateToInfo`, etc.) replaced with Next.js Links
5. ✅ Context provider still manages cart, orders, and order page views

**Benefits:**
- ✅ Proper browser back/forward navigation
- ✅ Bookmarkable URLs for each section
- ✅ Better SEO potential
- ✅ Cleaner separation of concerns
- ✅ Easier to add new top-level pages

## API Routes (Unchanged)

All API routes remain at `/api/*`:
- `/api/products` - Product listing
- `/api/orders` - Order management
- `/api/orders/[id]` - Single order operations
- `/api/tickets` - Ticket management
- `/api/tickets/[id]` - Single ticket operations
- `/api/ticket-types` - Available ticket types
