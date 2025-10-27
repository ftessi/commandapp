# 🎫 Multi-Ticket System - Quick Reference Card

## 📊 System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     MULTI-TICKET ARCHITECTURE                    │
└─────────────────────────────────────────────────────────────────┘

         ┌─────────────────┐
         │   ONE DEVICE    │
         │  (Your Phone)   │
         └────────┬────────┘
                  │
    ┌─────────────┴─────────────┐
    │                           │
    ▼                           ▼
┌────────┐                 ┌──────────┐
│ DEVICE │                 │ TICKETS  │
│SESSION │                 │ SESSIONS │
│(Orders)│                 │ (Entry)  │
└────────┘                 └─────┬────┘
    │                            │
    │                    ┌───────┼───────┐
    │                    │       │       │
    ▼                    ▼       ▼       ▼
┌────────┐         ┌────────┬────────┬────────┐
│ Bar    │         │Ticket A│Ticket B│Ticket C│
│Orders  │         │QR-001  │QR-002  │QR-003  │
│History │         │John    │Jane    │Bob     │
└────────┘         └────────┴────────┴────────┘
```

## 🔑 Key Concepts

### Device Session (Permanent)
```
Purpose:    Track bar orders for THIS device
Created:    On first app load
Storage:    commandapp_device_session
Lifetime:   Never changes
Used For:   Orders, cart, order history
```

### Ticket Sessions (Per Ticket)
```
Purpose:    Entry validation via QR code
Created:    Each time ticket purchased
Storage:    ticket_{ticket_id}
Lifetime:   Until redeemed
Used For:   QR codes, entry tracking
```

## 📱 localStorage Keys

```javascript
// ═══════════════════════════════════════════════════════════
//                    DEVICE LEVEL
// ═══════════════════════════════════════════════════════════
'commandapp_device_session'     → "uuid-device-token"
'commandapp_ticket_ids'         → ["id1", "id2", "id3"]
'commandapp_current_orders'     → [{order1}, {order2}]
'commandapp_past_orders'        → [{order3}, {order4}]
'commandapp_cart'               → [{product1}, {product2}]

// ═══════════════════════════════════════════════════════════
//                    TICKET LEVEL
// ═══════════════════════════════════════════════════════════
'ticket_{id1}' → {
  ticket_id: "uuid",
  session_token: "unique-token-A",
  first_name: "John",
  last_name: "Doe",
  email: "john@example.com",
  status: "paid",              // pending | paid | redeemed
  created_at: "2025-10-26..."
}

'ticket_{id2}' → {
  ticket_id: "uuid",
  session_token: "unique-token-B",
  first_name: "Jane",
  // ... same structure
}
```

## 🎯 Status Flow

```
┌──────────┐    Admin          ┌─────────┐   QR Scanned    ┌──────────┐
│ PENDING  │  marks paid  →    │  PAID   │   at entrance → │ REDEEMED │
│          │                   │         │                 │          │
│ ⏳ Orange│                   │ ✓ Green │                 │ ✓ Blue   │
│          │                   │         │                 │          │
│ No QR    │                   │ Has QR  │                 │ Used QR  │
└──────────┘                   └─────────┘                 └──────────┘
   │                                │                           │
   └────────────────────────────────┴───────────────────────────┘
                        Store Access: NO  │  YES  │  YES
```

## 🔐 Store Access Matrix

| Tickets Owned | Statuses         | Store Access | Why?                    |
|---------------|------------------|--------------|-------------------------|
| 0 tickets     | -                | 🔒 LOCKED    | No tickets purchased    |
| 1 ticket      | Pending          | 🔒 LOCKED    | Not paid yet            |
| 1 ticket      | Paid             | ✅ UNLOCKED  | Payment confirmed       |
| 1 ticket      | Redeemed         | ✅ UNLOCKED  | Already inside          |
| 3 tickets     | All Pending      | 🔒 LOCKED    | None paid               |
| 3 tickets     | 1 Paid, 2 Pending| ✅ UNLOCKED  | At least one paid       |
| 3 tickets     | All Paid         | ✅ UNLOCKED  | All confirmed           |

## 🎨 UI Components Map

```
┌────────────────────────────────────────────────────────────┐
│                      LANDING PAGE (/)                       │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────────────────────────────────────────┐     │
│  │            🎫 Get Tickets                        │     │
│  └──────────────────────────────────────────────────┘     │
│                                                            │
│  ┌──────────────────────────────────────────────────┐     │
│  │  🔒 Order (Ticket Required)  ← NO PAID TICKET   │     │
│  │  Get a ticket first to access                   │     │
│  └──────────────────────────────────────────────────┘     │
│              OR                                            │
│  ┌──────────────────────────────────────────────────┐     │
│  │            🍺 Order              ← HAS PAID TICKET│    │
│  └──────────────────────────────────────────────────┘     │
│                                                            │
│  ┌──────────────────────────────────────────────────┐     │
│  │            ℹ️ Info                              │     │
│  └──────────────────────────────────────────────────┘     │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

```
┌────────────────────────────────────────────────────────────┐
│                   TICKETS PAGE (/tickets)                   │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  📱 My Tickets                    [🔄 Refresh Status]     │
│  ─────────────────────────────────────────────────────     │
│                                                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │ John Doe    │  │ Jane Smith  │  │ Bob Wilson  │       │
│  │ ✓ Paid      │  │ ⏳ Pending   │  │ ✓ Redeemed  │       │
│  │ [Show QR]   │  │ Awaiting... │  │ [Show QR]   │       │
│  │ [Open Link] │  │             │  │ [Open Link] │       │
│  └─────────────┘  └─────────────┘  └─────────────┘       │
│                                                            │
│  ═══════════════════════════════════════════════════       │
│                                                            │
│  🎫 Purchase New Ticket                                    │
│  ─────────────────────────────────────────────────────     │
│                                                            │
│  ┌─────────────────┐     ┌──────────────────────┐         │
│  │ Select Ticket   │     │ Your Information     │         │
│  │                 │     │                      │         │
│  │ ○ VIP - €50    │     │ First Name: [____]  │         │
│  │ ● Regular - €30│     │ Last Name:  [____]  │         │
│  │ ○ Student - €20│     │ Email:      [____]  │         │
│  │                 │     │                      │         │
│  │                 │     │ [Reserve Ticket]     │         │
│  └─────────────────┘     └──────────────────────┘         │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## 🔄 Purchase Flow Diagram

```
USER ACTION                 SYSTEM ACTION               RESULT
═══════════════════════════════════════════════════════════════

Open App            →   Create Device Session    →   Device ID stored
                        localStorage set              Never changes

Click "Get Tickets" →   Load ticket types       →   Show purchase form

Fill Form           →   Validate input          →   Enable submit button
(Friend's info)

Click "Reserve"     →   1. Create TICKET session →  New unique session
                        2. Create ticket record  →  Linked to session
                        3. Store ticket locally  →  Added to device list

Success Message     →   Show ticket details     →   "Awaiting payment"

Go to Counter       →   (Outside app)           →   Pay in person

Admin Marks Paid    →   Update ticket status    →   status = 'paid'
                        Generate QR code         →   QR available

Return to App       →   Click "Refresh Status"  →   Fetch latest data

Status Updated      →   Show "✓ Paid" badge    →   QR button appears

Click "Show QR"     →   Generate QR image       →   Modal opens

Show at Entrance    →   Admin scans QR          →   Entry redeemed

Inside Event        →   Store access granted    →   Can order drinks
```

## 🎯 Common Scenarios

### Scenario 1: Group Purchase
```
Device → Buy 5 tickets → All in "My Tickets"
    ↓
Each friend gets unique QR code
    ↓
All 5 people can enter separately
    ↓
Device has store access after ANY ticket paid
```

### Scenario 2: Lost Phone
```
⚠️ Device cleared → Tickets lost from localStorage
    ↓
Solution (when email works):
    QR codes sent to email
    ↓
Recover from email → Scan QR → Session restored
```

### Scenario 3: Early Bird
```
Device → Buy tickets now (October)
    ↓
Event in December
    ↓
localStorage persists
    ↓
QR codes still accessible (unless browser data cleared)
```

## 🛠️ Developer Functions

```typescript
// ═══════════════════════════════════════════════════════════
//                  DEVICE SESSION
// ═══════════════════════════════════════════════════════════
createDeviceSession()           // On app load
getStoredSessionToken()         // Get device token
storeSessionToken(token)        // Save device token

// ═══════════════════════════════════════════════════════════
//                  TICKET SESSIONS
// ═══════════════════════════════════════════════════════════
createTicketSession(f, l, e)    // Create unique ticket session
storeTicketSession(ticket)      // Save ticket locally
updateTicketSession(id, data)   // Update ticket data
getStoredTicketSessions()       // Get all tickets
getStoredTicketIds()            // Get ticket ID array
addTicketId(id)                 // Add to ticket list

// ═══════════════════════════════════════════════════════════
//                  ACCESS CONTROL
// ═══════════════════════════════════════════════════════════
hasPaidTicket()                 // Check if any ticket paid
    → Returns true if any ticket.status === 'paid' or 'redeemed'
    → Used for store access validation
```

## 📋 Admin Actions

```
┌─────────────────────────────────────────────────────────┐
│              ADMIN DASHBOARD (/admin/tickets)            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Action: Mark as Paid                                  │
│  ────────────────────                                  │
│  1. Customer shows reservation                         │
│  2. Customer pays cash/card                           │
│  3. Click [Mark as Paid] button                       │
│  4. System updates ticket.status = 'paid'             │
│  5. QR code becomes available                         │
│                                                         │
│  Action: Scan QR at Entrance                           │
│  ───────────────────────────                           │
│  1. Click [Scan QR Code] button                       │
│  2. Allow camera access                               │
│  3. Point camera at customer's QR                     │
│  4. System extracts session token                     │
│  5. Finds ticket with that session                    │
│  6. Marks entry_redeemed = true                       │
│  7. Records timestamp + admin ID                      │
│  8. Customer enters event                             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 🚨 Troubleshooting Quick Fixes

| Problem | Quick Fix |
|---------|-----------|
| Store won't unlock | 1. Go to /tickets<br>2. Click "Refresh Status"<br>3. Check badge is "✓ Paid" |
| Tickets disappeared | 1. Check browser didn't clear data<br>2. Check same browser/device<br>3. Inspect localStorage in dev tools |
| QR not showing | 1. Status must be "Paid" (not "Pending")<br>2. Try "Open QR Link" button<br>3. Check internet connection |
| Can't buy multiple | 1. After first ticket, click "Purchase Another"<br>2. Each ticket needs different email |

## 📞 Quick Help

**Check Device Session:**
```javascript
// In browser console:
localStorage.getItem('commandapp_device_session')
// Should return: "uuid-string"
```

**Check Tickets:**
```javascript
// In browser console:
JSON.parse(localStorage.getItem('commandapp_ticket_ids'))
// Should return: ["id1", "id2", ...]
```

**Check Specific Ticket:**
```javascript
// In browser console:
JSON.parse(localStorage.getItem('ticket_<id>'))
// Should return: {ticket_id, session_token, ...}
```

## ✅ System Health Checklist

- [ ] Device session exists in localStorage
- [ ] Ticket IDs array exists
- [ ] Each ticket has corresponding `ticket_{id}` key
- [ ] At least one ticket has status 'paid' for store access
- [ ] QR modal works for paid tickets
- [ ] Refresh status button updates correctly
- [ ] Store button state matches ticket statuses

---

**Version:** 1.0  
**Last Updated:** October 26, 2025  
**Status:** ✅ Production Ready (Pending Email Integration)
