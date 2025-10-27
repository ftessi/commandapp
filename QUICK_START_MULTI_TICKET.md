# Quick Start Guide - Multi-Ticket System

## 🚀 Quick Overview

**One Device → Multiple Tickets → Each Person Gets Unique QR**

## 📱 How to Use

### For Customers

#### First Time Opening App
```
1. Open app → Device session auto-created
2. See 3 buttons: Get Tickets | Order (🔒) | Info
3. Store is LOCKED until you have a paid ticket
```

#### Buying Ticket for Yourself
```
1. Click "Get Tickets"
2. Select ticket type
3. Fill YOUR info (name, email)
4. Click "Reserve Ticket"
5. See success message
6. Go to payment counter
7. Staff marks as paid
8. Return to app → Click "Refresh Status"
9. Your ticket now shows "✓ Paid"
10. Click "Show QR Code"
11. Store button is now UNLOCKED 🍺
```

#### Buying Tickets for Friends
```
1. Click "Get Tickets"
2. Select ticket type
3. Fill FRIEND 1's info
4. Click "Reserve Ticket"
5. Click "Purchase Another Ticket"
6. Fill FRIEND 2's info
7. Click "Reserve Ticket"
8. Now you see 2 tickets in "My Tickets"
9. Each friend gets their own QR code
10. You can access store after ANY ticket is paid
```

### For Admin Staff

#### Marking Tickets as Paid
```
1. Customer shows reservation
2. Customer pays
3. Go to Admin → Tickets
4. Find customer's ticket
5. Click "Mark as Paid"
6. Done! (Customer will see status update)
```

#### Scanning QR at Entrance
```
1. Customer shows QR code
2. Open Admin → Tickets
3. Click "Scan QR Code"
4. Allow camera access
5. Point camera at QR code
6. Ticket automatically marked as redeemed
7. Customer can enter event
```

## 🎫 Ticket Statuses

### ⏳ Pending
- Ticket reserved but not paid yet
- QR code NOT available
- Store access: NO

### ✓ Paid
- Payment confirmed
- QR code available
- Store access: YES
- Can enter event

### ✓ Redeemed
- Entry scanned at door
- Already inside event
- Store access: YES (can order drinks)

## 🔐 Store Access Rules

### Locked 🔒
- No tickets purchased
- All tickets are "Pending"

### Unlocked 🍺
- At least ONE ticket is "Paid" or "Redeemed"
- Doesn't matter if it's your ticket or friend's
- Device has access as long as any ticket paid

## 💾 What's Stored Locally

```
Your Device Tracks:
✓ Your device session (for orders)
✓ ALL tickets purchased from this device
✓ Each ticket's status (pending/paid/redeemed)
✓ Each ticket's QR code (when paid)
```

## 🎯 Common Scenarios

### Scenario 1: Solo Event Goer
```
Device → Buy 1 ticket (your info) → Paid → Show QR → Enter → Order drinks
```

### Scenario 2: Group Organizer
```
Device → Buy 3 tickets (3 friends) → All paid → Share 3 QR codes → All enter
You have store access immediately after ANY ticket paid
```

### Scenario 3: Lost Phone Recovery
```
⚠️ WARNING: Tickets stored in browser localStorage
If you:
- Clear browser data
- Use different browser
- Use different device
→ You lose access to tickets

Workaround (when email works):
- QR code sent to ticket owner's email
- Can recover from email
```

## 🆘 Troubleshooting

### "Store button still locked after payment"
1. Go to /tickets
2. Click "Refresh Status" button
3. Check ticket shows "✓ Paid"
4. Return to homepage
5. Should be unlocked now

### "My tickets disappeared"
1. Check you're on same browser
2. Don't clear browser data
3. Check localStorage keys in dev tools:
   - `commandapp_device_session`
   - `commandapp_ticket_ids`
   - `ticket_{id}` for each ticket

### "QR code not showing"
1. Check ticket status is "Paid" (not "Pending")
2. Try refreshing ticket status
3. Try "Open QR Link" button instead
4. Check internet connection (QR generated via API)

## 📊 User Journey Map

```
┌─────────────────────────────────────────────────────────────┐
│                      CUSTOMER JOURNEY                        │
└─────────────────────────────────────────────────────────────┘

1. [OPEN APP]
   ↓
   Device Session Created
   ↓
2. [LANDING PAGE]
   - Get Tickets ✓
   - Order 🔒 (locked)
   - Info ✓
   ↓
3. [CLICK: Get Tickets]
   ↓
4. [TICKETS PAGE]
   - No tickets yet (empty)
   - Ticket type selection
   - Info form
   ↓
5. [FILL FORM & SUBMIT]
   ↓
   Ticket Session Created
   Ticket stored in localStorage
   ↓
6. [SUCCESS MESSAGE]
   "Ticket Reserved - Go to payment counter"
   ↓
7. [GO TO PAYMENT COUNTER] 💰
   ↓
   Admin marks as paid
   ↓
8. [RETURN TO APP]
   ↓
9. [TICKETS PAGE]
   Click "Refresh Status"
   ↓
   Ticket: ⏳ Pending → ✓ Paid
   ↓
10. [LANDING PAGE]
    Order button: 🔒 → 🍺 (unlocked)
    ↓
11. [AT EVENT ENTRANCE]
    Click "Show QR Code"
    Staff scans QR
    ↓
    Status: ✓ Paid → ✓ Redeemed
    ↓
12. [INSIDE EVENT]
    Can order drinks from store
    Can show order history
    ↓
13. [ORDER DRINKS] 🍺
    Access /order page
    Add items to cart
    Submit order
    ↓
    Orders tracked by device session
```

## 🔄 Multi-Ticket Flow

```
┌─────────────────────────────────────────────────────────────┐
│              BUYING TICKETS FOR 3 FRIENDS                    │
└─────────────────────────────────────────────────────────────┘

[DEVICE]
   ↓
Buy Ticket #1 → Session A → Friend 1's info → QR Code A
   ↓
Buy Ticket #2 → Session B → Friend 2's info → QR Code B
   ↓
Buy Ticket #3 → Session C → Friend 3's info → QR Code C
   ↓
[ALL 3 TICKETS IN "MY TICKETS"]
   ↓
Admin marks all as paid
   ↓
Friend 1: Shows QR Code A → Enters
Friend 2: Shows QR Code B → Enters
Friend 3: Shows QR Code C → Enters
   ↓
[YOU: Device has store access]
You can order drinks for the group
```

## ⚡ Key Features

### 1. Instant Ticket Purchase
- No registration required
- Just name and email
- Reserve in seconds

### 2. Multi-Ticket Support
- Buy tickets for entire group
- Each person gets unique QR
- All tracked on your device

### 3. QR Code Validation
- Unique QR per ticket
- Secure entry validation
- Prevents duplicate entry

### 4. Store Access Control
- Must have paid ticket
- Can't browse and order without ticket
- Fair for event organizers

### 5. Offline-First
- All tickets stored locally
- Works without internet
- QR generation needs internet

## 🎨 Visual Guide

### My Tickets Section
```
┌──────────────────────────────────────────┐
│  📱 My Tickets          [Refresh Status] │
├──────────────────────────────────────────┤
│ ┌────────────────────────────────────┐   │
│ │ John Doe              ✓ Paid      │   │
│ │ john@example.com                  │   │
│ │ 📅 Oct 26, 2025                   │   │
│ │ [Show QR Code] [Open QR Link]    │   │
│ └────────────────────────────────────┘   │
│                                          │
│ ┌────────────────────────────────────┐   │
│ │ Jane Smith            ⏳ Pending   │   │
│ │ jane@example.com                  │   │
│ │ 📅 Oct 26, 2025                   │   │
│ │ Awaiting payment confirmation     │   │
│ └────────────────────────────────────┘   │
└──────────────────────────────────────────┘
```

### Store Button States
```
┌─────────────────────────────────┐
│ 🔒 Order (Ticket Required)      │  ← No tickets or pending only
│ Get a ticket first to access   │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ 🍺 Order                        │  ← At least one paid ticket
└─────────────────────────────────┘
```

## 📝 Important Notes

1. **Device Tied**: Tickets stored in browser localStorage
2. **Clear Data**: Clearing browser data = losing tickets
3. **Temporary**: Until email system working (then backup via email)
4. **Store Access**: Any paid ticket gives store access
5. **Independent QRs**: Each ticket has unique QR for entry
6. **Admin Control**: Only admin can mark as paid/redeemed

## 🔜 Coming Soon (When Email Works)

- ✉️ QR code sent to email when paid
- 🔗 Recovery link in email
- 📧 Payment confirmation emails
- 📱 Ticket transfer between devices
