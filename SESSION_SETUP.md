# Session System Setup Guide

## Quick Start

### 1. Run Database Migration

Go to your Supabase SQL Editor and run:
```sql
-- File: supabase/migrations/create_sessions_system.sql
```

This will create:
- ✅ `sessions` table
- ✅ Add `session_id` to `orders` and `tickets` tables
- ✅ Add entry redemption tracking to `tickets`
- ✅ Create indexes and triggers
- ✅ Set up permissions

### 2. Test the System

#### A. Purchase a Ticket
1. Go to `/tickets` page
2. Fill out form with your name and email
3. Purchase a ticket
4. ✅ Session token is automatically created and stored in localStorage
5. Check browser console: You should see `Session token stored`

#### B. Place an Order
1. Go to menu, add items to cart
2. Checkout
3. ✅ Order is linked to your session
4. View order history - you'll see only YOUR orders

#### C. Test Session Persistence
1. Open DevTools → Application → Local Storage
2. Find `commandapp_session_token` - copy this value
3. Clear localStorage
4. Navigate to `/session/{your-token-here}`
5. ✅ Session is restored, you can see your orders again

### 3. Admin Access

#### Tickets Admin
- **URL**: `/admin/tickets`
- **Login**: `tickets / tickets123`

Features:
- 🔍 QR Scanner for entry redemption
- 📋 View all tickets with filtering
- ✅ Redeem tickets for entry
- 🚫 Prevent double redemption
- 📊 Statistics dashboard

#### Test Entry Redemption Flow
1. Login to tickets admin
2. First, go to `/admin/payments` and mark a ticket as PAID
   - This generates the QR code
3. Go back to `/admin/tickets`
4. In the QR scanner, enter the ticket's `qr_code` value
5. Click "Redeem"
6. ✅ Ticket is marked as used for entry
7. Try scanning again → ❌ Should show "already used"

### 4. How It Works

#### For Users
```
Ticket Purchase / First Order
    ↓
Session Created (UUID token)
    ↓
Token Stored in localStorage
    ↓
All future orders/tickets link to this session
    ↓
User sees only THEIR data
```

#### Session Recovery
```
User loses localStorage
    ↓
Scans QR code or clicks email link
    ↓
Lands on /session/{token}
    ↓
Token restored in localStorage
    ↓
User sees all their orders again
```

#### Entry Flow
```
User arrives at party
    ↓
Admin scans QR code
    ↓
System checks:
  - Ticket exists? ✓
  - Ticket paid? ✓
  - Already used? ✗
    ↓
Mark entry_redeemed = true
    ↓
Grant entry ✅
    ↓
QR still works for session access
BUT cannot be used for entry again
```

## Verification Checklist

- [ x ] Database migration completed
- [ x ] Can purchase ticket
- [ x ] Session token appears in localStorage
- [ x ] Can place order
- [ x ] Order appears in history
- [ x ] Can clear localStorage and recover via `/session/{token}`
- [ ] Admin can see all tickets
- [ ] Admin can mark ticket as paid
- [ ] Admin can redeem ticket for entry
- [ ] Cannot redeem same ticket twice
- [ ] User info from session appears on admin ticket cards

## Next Steps

### Email Integration
To send QR codes via email when ticket is paid:

1. Install email service (e.g., Resend):
   ```bash
   npm install resend
   ```

2. Add to ticket PATCH endpoint (when marking as paid):
   ```typescript
   // Generate QR code data
   const qrData = `${ticket.qr_code}|${session.session_token}`;
   
   // Generate QR image (use qrcode library)
   // Send email with QR and session link
   ```

3. Email template should include:
   - QR code image
   - Session link: `https://yourapp.com/session/{session_token}`
   - Ticket details

### QR Code Images
To generate actual QR code images:

1. Install QR library:
   ```bash
   npm install qrcode
   ```

2. Use in ticket payment handler:
   ```typescript
   import QRCode from 'qrcode';
   
   const qrData = `${qrCode}|${sessionToken}`;
   const qrImage = await QRCode.toDataURL(qrData);
   ```

## Troubleshooting

### Orders not filtered by session
- Check that `sessionToken` is in localStorage
- Verify API is including `?sessionToken=` in requests
- Check browser console for errors

### Session not recovering
- Verify session token is valid in database
- Check `/api/sessions?token={token}` directly
- Ensure migration added `session_id` columns

### Entry redemption failing
- Verify ticket status is `paid` (not `pending`)
- Check `entry_redeemed` field exists in tickets table
- Verify admin has correct permissions

## Database Queries (Debugging)

```sql
-- View all sessions
SELECT * FROM sessions ORDER BY created_at DESC;

-- View session with orders and tickets
SELECT 
  s.*,
  COUNT(DISTINCT o.order_id) as order_count,
  COUNT(DISTINCT t.id) as ticket_count
FROM sessions s
LEFT JOIN orders o ON o.session_id = s.id
LEFT JOIN tickets t ON t.session_id = s.id
GROUP BY s.id;

-- Find tickets ready for entry
SELECT * FROM tickets 
WHERE status = 'paid' 
AND entry_redeemed = false;

-- Find tickets already redeemed
SELECT * FROM tickets 
WHERE entry_redeemed = true
ORDER BY entry_redeemed_at DESC;
```

## Support

For issues or questions, check:
1. Browser console for errors
2. Network tab for API responses
3. Supabase logs for database errors
4. SESSION_SYSTEM.md for detailed documentation
