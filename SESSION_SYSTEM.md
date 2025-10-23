# Session-Based User Tracking System

## Overview
This system enables **session-based order and ticket tracking** without requiring user authentication. Users get a unique session token stored in localStorage, which links all their orders and tickets.

## Architecture

### Database Schema

#### `sessions` Table
Stores user session information:
- `id` (UUID) - Primary key
- `session_token` (UUID) - Unique token for identifying the session
- `first_name`, `last_name`, `email` - User information
- `created_at`, `last_accessed_at` - Timestamps

#### Updated Tables
- **`orders`** - Added `session_id` foreign key
- **`tickets`** - Added `session_id` foreign key, `entry_redeemed`, `entry_redeemed_at`, `entry_redeemed_by`

### Key Features

1. **Session Creation**
   - When a user places their first order or purchases a ticket, a session is created
   - Session token is stored in localStorage (`commandapp_session_token`)
   - If localStorage is lost, session can be recovered via QR code/email link

2. **Order & Ticket Linking**
   - All orders and tickets are linked to the user's session
   - Users only see their own orders/tickets when they provide their session token
   - Admin can see all orders/tickets

3. **QR Code Integration**
   - QR codes contain: `{qr_code_uuid}|{session_token}`
   - Used for **both** ticket validation AND session recovery
   - If user loses localStorage, scanning QR restores their session

4. **Entry Redemption**
   - `entry_redeemed` tracks if ticket was used to ENTER the party
   - Separate from payment status (`paid`)
   - Once redeemed for entry, cannot be redeemed again
   - QR code still works for session recovery after redemption

## API Endpoints

### Sessions
- `POST /api/sessions` - Create or retrieve session
  - Body: `{ firstName, lastName, email, existingToken? }`
  - Returns: `{ session: {...}, existing: boolean }`

- `GET /api/sessions?token={token}` - Get session by token
  - Returns: `{ session: {...} }` with orders and tickets

### Orders
- `POST /api/orders` - Create order (now accepts `sessionToken`)
- `GET /api/orders?sessionToken={token}` - Get orders for session

### Tickets
- `POST /api/tickets` - Create ticket (now accepts `sessionToken`)
- `GET /api/tickets?sessionToken={token}` - Get tickets for session
- `PATCH /api/tickets/{id}/redeem` - Redeem ticket for entry by ID
- `PATCH /api/tickets/scan/redeem` - Redeem ticket for entry by QR code

## Frontend Components

### Session Service (`src/services/sessionService.ts`)
Utility functions for session management:
- `getStoredSessionToken()` - Get token from localStorage
- `storeSessionToken(token)` - Save token to localStorage
- `getOrCreateSession(firstName, lastName, email)` - Create or retrieve session
- `getSessionByToken(token)` - Fetch session from API
- `generateQRData(qrCode, sessionToken)` - Create QR data with session
- `parseQRData(qrData)` - Parse QR data to extract session

### Session Recovery Page (`src/app/session/[token]/page.tsx`)
- Accepts session token as URL parameter
- Restores session in localStorage
- Redirects to order history

### Updated Components
- **ProductsDataContext** - Includes session token in order creation, filters orders by session
- **TicketsPage** - Includes session token in ticket purchase, stores token after purchase
- **OrderHistory** - Shows only user's orders based on their session

## Admin Features

### Tickets Admin Page (`/admin/tickets`)
- **QR Scanner** - Scan/enter QR code to redeem tickets
- **Manual Redemption** - Click button to redeem specific ticket
- **Filters** - Filter by status (paid, pending, redeemed, ready for entry)
- **Search** - Search by name or email
- **Statistics** - Total tickets, paid, entries used, ready for entry
- **Session Info** - Shows user name from session on each ticket

### Entry Redemption Flow
1. Admin scans QR code or enters it manually
2. System checks:
   - ✅ Ticket exists
   - ✅ Ticket is paid
   - ✅ Ticket not already used for entry
3. If valid, marks `entry_redeemed = true`
4. Records `entry_redeemed_at` timestamp and `entry_redeemed_by` admin name
5. Shows success with user name
6. If already redeemed, shows when and by whom

## User Flows

### First-Time Ticket Purchase
1. User fills out ticket form (firstName, lastName, email)
2. System creates session with user info
3. Session token stored in localStorage
4. Ticket linked to session
5. User sees confirmation

### Subsequent Orders
1. User adds items to cart
2. System includes existing session token in order
3. Order linked to same session
4. User sees all their orders in history

### Session Recovery (Lost localStorage)
1. User receives email with QR code containing session token
2. User scans QR or clicks email link
3. Lands on `/session/{token}` page
4. Session restored in localStorage
5. Redirected to order history with all their orders

### Entry at Party
1. Admin scans QR code at entrance
2. System validates ticket is paid and not redeemed
3. Marks ticket as used for entry
4. User can still access their session via QR code
5. User sees all their orders/tickets in app

## Database Migration

Run the migration file:
```sql
-- Located in: supabase/migrations/create_sessions_system.sql
```

This creates:
- `sessions` table with indexes
- Foreign keys in `orders` and `tickets`
- Entry redemption fields in `tickets`
- Triggers for automatic timestamp updates
- View for session analytics

## Configuration

### Environment Variables
Already configured (uses existing Supabase credentials):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### localStorage Keys
- `commandapp_session_token` - User's session token
- `commandapp_cart` - Cart items (existing)
- `commandapp_current_orders` - Active orders (existing)
- `commandapp_past_orders` - Completed orders (existing)

## Email Integration (Future)

When ticket is marked as PAID:
1. Generate QR code with format: `{qr_code}|{session_token}`
2. Send email with:
   - QR code image
   - Session recovery link: `https://yourapp.com/session/{session_token}`
   - User info (name, ticket type, price)
3. User can save QR or use link to restore session

## Security Considerations

1. **No Authentication Required** - Intentional design for ease of use
2. **Session Tokens** - UUIDs are cryptographically random
3. **Data Isolation** - Users only see their own data when token is provided
4. **Admin Access** - Admins can see all data (controlled by admin login)
5. **Entry Redemption** - One-time use for entry, prevents ticket sharing

## Testing Checklist

- [ ] Run database migration
- [ ] Create test ticket
- [ ] Verify session token in localStorage
- [ ] Create order, verify it's linked to session
- [ ] Clear localStorage, verify session recovery
- [ ] Admin: Mark ticket as paid (generates QR)
- [ ] Admin: Redeem ticket for entry
- [ ] Admin: Try to redeem same ticket again (should fail)
- [ ] Verify user can still see their orders after redemption

## Future Enhancements

1. **Email Service** - Integrate SendGrid/Resend for automated emails
2. **QR Code Generation** - Generate actual QR code images
3. **Session Expiry** - Auto-expire old sessions after event
4. **Multi-Event Support** - Track sessions per event
5. **Analytics** - Session-based analytics and reporting
