# Multi-Ticket Device Session System

## Overview
This system allows one device to purchase multiple tickets for different users while maintaining a permanent device session. Each ticket gets its own session for QR validation, but the device tracks all purchases locally.

## Architecture Changes

### Previous System (Single Session)
- ❌ One session per device
- ❌ Session updated when ticket purchased
- ❌ New users saw all orders

### New System (Device + Ticket Sessions)
- ✅ **Device Session**: Permanent, tied to the device (orders)
- ✅ **Ticket Sessions**: One per ticket purchased (entry validation)
- ✅ **Local Storage**: Device tracks all ticket IDs
- ✅ **Store Access**: Requires at least one paid ticket

## How It Works

### 1. Device Session (Permanent)
```typescript
// localStorage key: 'commandapp_device_session'
// Created on first app load
// NEVER changes, tracks orders for this device
```

**Purpose**: Track which orders belong to this device

### 2. Ticket Sessions (Per Ticket)
```typescript
// Created when purchasing each ticket
// One session per ticket, even if same device
// Used for QR validation and entry redemption
```

**Purpose**: Each ticket has unique QR for entry

### 3. Local Ticket Storage
```typescript
// localStorage key: 'commandapp_ticket_ids'
// Array of ticket IDs: ['uuid1', 'uuid2', 'uuid3']

// Individual tickets stored as:
// localStorage key: 'ticket_{ticket_id}'
{
  ticket_id: string,
  session_token: string,  // Unique per ticket
  first_name: string,
  last_name: string,
  email: string,
  status: 'pending' | 'paid' | 'redeemed',
  qr_data_url?: string,
  created_at: string
}
```

## User Flows

### Flow 1: Person Buys Ticket for Self
```
1. Opens app → Device session created
2. Goes to /tickets
3. Fills form with their info
4. Clicks "Reserve Ticket"
   → New ticket session created (session A)
   → Ticket linked to session A
   → Ticket stored in device localStorage
5. Admin marks as paid
6. User sees ticket in "My Tickets" section
7. User clicks "Show QR Code"
8. QR scanned at entrance → Entry redeemed
```

### Flow 2: Person Buys Tickets for Friends
```
1. Opens app → Device session created
2. Goes to /tickets
3. Fills form with Friend 1's info
4. Clicks "Reserve Ticket"
   → New ticket session created (session B)
   → Ticket stored in device localStorage
5. Sees success message, clicks "Purchase Another Ticket"
6. Fills form with Friend 2's info
7. Clicks "Reserve Ticket"
   → New ticket session created (session C)
   → Ticket stored in device localStorage
8. Now device has 2 tickets in "My Tickets"
9. Admin marks both as paid
10. Device shows both QR codes
11. Friend 1 scans QR with session B token
12. Friend 2 scans QR with session C token
```

### Flow 3: Store Access Validation
```
1. User opens app without tickets
   → Store button shows "🔒 Order (Ticket Required)"
   → Button disabled with message
2. User purchases ticket
   → Ticket in localStorage with status='pending'
   → Store still locked (pending payment)
3. Admin marks ticket as paid
   → User refreshes tickets page
   → Ticket status updates to 'paid'
4. User returns to homepage
   → Store button enabled "🍺 Order"
   → Can now access store
```

## localStorage Keys

### Device Level
```javascript
// Device session (permanent)
'commandapp_device_session' = 'uuid-device-session-token'

// List of all ticket IDs purchased from this device
'commandapp_ticket_ids' = '["ticket-id-1", "ticket-id-2", "ticket-id-3"]'

// Orders tracked by device session
'commandapp_current_orders' = '[...]'
'commandapp_past_orders' = '[...]'
'commandapp_cart' = '[...]'
```

### Ticket Level
```javascript
// Individual ticket sessions
'ticket_uuid-1' = '{
  ticket_id: "uuid-1",
  session_token: "session-token-for-user-1",
  first_name: "John",
  last_name: "Doe",
  email: "john@example.com",
  status: "paid",
  created_at: "2025-10-26T..."
}'

'ticket_uuid-2' = '{
  ticket_id: "uuid-2",
  session_token: "session-token-for-user-2",
  first_name: "Jane",
  last_name: "Smith",
  email: "jane@example.com",
  status: "pending",
  created_at: "2025-10-26T..."
}'
```

## API Changes

### Session Creation Endpoint
```typescript
POST /api/sessions

// Device session (on app load)
Body: { anonymous: true, device: true }
Response: { session: { session_token: "uuid-device" } }

// Ticket session (on ticket purchase)
Body: {
  anonymous: false,
  first_name: "John",
  last_name: "Doe",
  email: "john@example.com"
}
Response: { session: { session_token: "uuid-ticket-specific" } }
```

### Ticket Creation
```typescript
POST /api/tickets
Body: {
  ticketTypeId: 1,
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  sessionToken: "uuid-ticket-specific"  // NOT device session!
}
```

## UI Components

### TicketsPage (`/tickets`)
**Sections:**
1. **My Tickets** (top)
   - Shows all tickets purchased from this device
   - Displays: Name, Email, Status badge, Created date
   - Actions:
     - "Show QR Code" button (if paid/redeemed)
     - "Open QR Link" button (if paid/redeemed)
     - "Refresh Status" button (fetch latest from API)

2. **Purchase Ticket** (bottom)
   - Ticket type selection
   - User info form (firstName, lastName, email)
   - "Reserve Ticket" button
   - Success message after purchase

### LandingPage (`/`)
**Store Button Logic:**
```typescript
if (checking) {
  // Show loading spinner
} else if (hasPaidTicket()) {
  // Show enabled "Order" button
} else {
  // Show disabled "Order (Ticket Required)" button
  // Display helper text: "Get a ticket first"
}
```

### QR Code Modal
- Displayed when clicking "Show QR Code"
- Generated on-demand via API: `https://api.qrserver.com/v1/create-qr-code/`
- QR Data: `https://yourapp.com/qr/{session_token}`
- Actions:
  - "Open in New Tab" → Opens `/qr/{token}` page
  - "Close" → Dismisses modal

## sessionService.ts Functions

### New Functions
```typescript
// Device session management
getStoredSessionToken(): string | null
storeSessionToken(token: string): void
createDeviceSession(): Promise<Session | null>

// Ticket session management
createTicketSession(firstName, lastName, email): Promise<Session | null>
storeTicketSession(ticket: TicketSession): void
updateTicketSession(ticketId: string, updates: Partial<TicketSession>): void

// Ticket tracking
getStoredTicketIds(): string[]
addTicketId(ticketId: string): void
getStoredTicketSessions(): TicketSession[]

// Access validation
hasPaidTicket(): boolean
```

## Security Considerations

### Why Separate Sessions?
1. **Privacy**: Each ticket owner has unique QR
2. **Tracking**: Admin knows exactly who entered
3. **Flexibility**: Friends can share QR independently
4. **Audit Trail**: Each entry redemption tracked separately

### Why Device Session?
1. **Orders**: Device tracks its own orders (bar purchases)
2. **Persistence**: If app closed, orders remain
3. **Separation**: Orders ≠ Tickets (different systems)

### Store Access Control
- **Without ticket**: User can browse but can't order
- **With pending ticket**: Store still locked (payment pending)
- **With paid ticket**: Full store access
- **After entry redeemed**: Store still accessible (can order drinks inside)

## Testing Checklist

### 1. Device Session Creation
- [ ] Open app first time
- [ ] Check localStorage has `commandapp_device_session`
- [ ] Refresh page → Same device token persists

### 2. Single Ticket Purchase
- [ ] Go to /tickets
- [ ] Fill form with User A info
- [ ] Submit → Check localStorage has `ticket_{id}` and ticket in array
- [ ] Check "My Tickets" section shows 1 ticket with "Pending" status

### 3. Multiple Ticket Purchase
- [ ] Purchase ticket for User A
- [ ] Click "Purchase Another Ticket"
- [ ] Fill form with User B info
- [ ] Submit → Check localStorage has 2 different tickets
- [ ] Check "My Tickets" section shows 2 tickets

### 4. Payment Status Update
- [ ] Admin marks ticket as paid
- [ ] Return to /tickets
- [ ] Click "Refresh Status"
- [ ] Check ticket badge changes to "✓ Paid"
- [ ] Check "Show QR Code" button appears

### 5. QR Code Display
- [ ] Click "Show QR Code" on paid ticket
- [ ] Modal opens with QR image
- [ ] QR contains correct URL: `/qr/{session_token}`
- [ ] Click "Open in New Tab" → Opens QR page

### 6. Store Access
- [ ] Fresh device (no tickets) → Store button disabled
- [ ] Purchase ticket (pending) → Store still disabled
- [ ] Ticket marked as paid → Store button enabled
- [ ] Can access /order page and make purchases

### 7. Entry Redemption
- [ ] Admin scans QR code
- [ ] Ticket marked as redeemed
- [ ] Refresh tickets page → Status shows "✓ Redeemed"
- [ ] Store access still works (can order drinks inside)

## Temporary Workaround (No Email)

Since email verification is pending, this system works entirely with localStorage:

1. **Ticket Purchase**: Stores ticket data locally
2. **QR Generation**: API generates QR on-demand
3. **Status Updates**: Manual refresh via "Refresh Status" button
4. **No Email**: QR codes displayed directly in app

**When Email Works Later:**
- Add email sending when ticket marked as paid
- QR code sent automatically via email
- Local storage still tracks everything as backup

## Future Enhancements

### Priority 1 (When Email Ready)
- [ ] Send QR code email when ticket marked as paid
- [ ] Email includes ticket details and QR image
- [ ] Email has recovery link: `/qr/{token}`

### Priority 2
- [ ] Ticket transfer between devices
- [ ] Session sync across devices for same user
- [ ] Offline mode with sync when back online

### Priority 3
- [ ] Push notifications for ticket status changes
- [ ] In-app QR scanner for user-to-user sharing
- [ ] Analytics: Track which device bought most tickets

## Troubleshooting

### Issue: Store button won't enable
**Solution:**
1. Check localStorage: `commandapp_ticket_ids`
2. Check each ticket status
3. At least one must have `status: 'paid'` or `status: 'redeemed'`
4. Try refreshing ticket statuses

### Issue: Tickets not showing in "My Tickets"
**Solution:**
1. Check localStorage: `commandapp_ticket_ids` array exists
2. Check individual ticket keys: `ticket_{id}`
3. Try purchasing new ticket to repopulate

### Issue: QR code not generating
**Solution:**
1. Check ticket has `session_token` field
2. Verify external API: `https://api.qrserver.com/` is accessible
3. Check browser console for errors
4. Try "Open QR Link" button instead

### Issue: Wrong person's ticket shown
**Solution:**
- Each ticket is independent
- Check `first_name`, `last_name`, `email` fields in localStorage
- Device tracks all tickets purchased from it
- This is expected behavior (not a bug)

## Files Modified

### Core Session Logic
- `src/services/sessionService.ts` - Device + ticket session functions
- `src/context/ProductsDataContext.tsx` - Device session initialization

### UI Components
- `src/components/TicketsPage.tsx` - Multi-ticket display + QR modal
- `src/components/LandingPage.tsx` - Store access validation

### API (No changes needed)
- Existing `/api/sessions` handles both device and ticket sessions
- Existing `/api/tickets` works with any session token

## Summary

This system solves the multi-ticket problem by:
1. **Device session** = Orders (bar purchases)
2. **Ticket sessions** = Entry validation (QR codes)
3. **Local storage** = Device tracks all tickets purchased
4. **Access control** = Store requires paid ticket
5. **Flexibility** = Buy tickets for friends, each gets unique QR

The device is the "purchaser" but each ticket is for a specific person with their own QR code for entry.
