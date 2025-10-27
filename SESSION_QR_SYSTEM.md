# Session & QR Code System - Implementation Guide

## Overview
Complete session-based ticketing system with anonymous user tracking, QR code generation, email notifications, and camera-based entry validation.

## Architecture

### Session Flow
```
1. User opens app (homepage) → Anonymous session created
   - localStorage: session_token (UUID)
   - Database: sessions table with placeholder email

2. User purchases ticket → Session updated with real info
   - Session updated: firstName, lastName, email
   - Ticket linked to session via session_id

3. Admin marks ticket as paid → QR & Email sent
   - QR generated: https://app.com/qr/{session_token}
   - Email sent with QR code image
   
4. User scans QR → Session restored
   - QR endpoint extracts token
   - Token stored in localStorage
   - User redirected to /order page

5. Admin scans QR at entry → Entry redeemed
   - Camera scanner reads QR
   - Entry marked as redeemed
```

## Database Schema

### Sessions Table
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Orders & Tickets
Both tables have `session_id UUID REFERENCES sessions(id)` foreign key.

### Entry Redemption Fields
- `entry_redeemed BOOLEAN DEFAULT false`
- `entry_redeemed_at TIMESTAMPTZ`
- `entry_redeemed_by TEXT`

## Implementation Details

### 1. Anonymous Session Creation

**File:** `src/context/ProductsDataContext.tsx`
```typescript
useEffect(() => {
  const initSession = async () => {
    const existing = localStorage.getItem('session_token');
    if (!existing) {
      await createAnonymousSession();
    }
  };
  initSession();
}, []);
```

**Service:** `src/services/sessionService.ts`
```typescript
export async function createAnonymousSession() {
  const response = await fetch('/api/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ anonymous: true })
  });
  const data = await response.json();
  localStorage.setItem('session_token', data.session.session_token);
  return data.session;
}
```

**API:** `src/app/api/sessions/route.ts`
- POST with `{anonymous: true}` → creates session with `anon_{timestamp}@temp.local` email
- PATCH with user info → updates firstName, lastName, email

### 2. QR Code Generation

**Service:** `src/services/qrService.ts`
```typescript
import QRCode from 'qrcode';

// Returns data URL for img src
export async function generateSessionQR(sessionToken: string): Promise<string> {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/qr/${sessionToken}`;
  return await QRCode.toDataURL(url);
}

// Returns buffer for email attachment
export async function generateSessionQRBuffer(sessionToken: string): Promise<Buffer> {
  const url = getSessionQRUrl(sessionToken);
  return await QRCode.toBuffer(url);
}
```

### 3. Email Service

**Service:** `src/services/emailService.ts`
```typescript
import { Resend } from 'resend';
import { generateSessionQRBuffer } from './qrService';

export async function sendTicketEmail(email: string, sessionToken: string) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const qrBuffer = await generateSessionQRBuffer(sessionToken);
  
  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: email,
    subject: 'Your Event Ticket - QR Code Inside',
    html: `<!-- HTML template with QR and recovery link -->`,
    attachments: [{
      filename: 'ticket-qr.png',
      content: qrBuffer
    }]
  });
}
```

### 4. Payment Status Change

**API:** `src/app/api/tickets/[id]/route.ts`
```typescript
// PATCH handler
if (status === 'paid') {
  // Get session token from ticket
  const { data: ticket } = await supabase
    .from('tickets')
    .select('*, sessions!inner(session_token, email)')
    .eq('id', ticketId)
    .single();
  
  // Generate QR and send email
  await sendTicketEmail(ticket.sessions.email, ticket.sessions.session_token);
}
```

### 5. QR Scan Endpoint

**Page:** `src/app/qr/[token]/page.tsx`
```typescript
'use client';

export default function QRScanPage({ params }: { params: { token: string } }) {
  useEffect(() => {
    // Validate token (optional API call)
    // Store in localStorage
    localStorage.setItem('session_token', params.token);
    // Redirect to order page
    window.location.href = '/order';
  }, [params.token]);
  
  return <div>Restoring your session...</div>;
}
```

### 6. Camera-Based QR Scanner

**Admin Page:** `src/app/admin/tickets/page.tsx`
```typescript
import { Html5Qrcode } from 'html5-qrcode';

const [scanner, setScanner] = useState<Html5Qrcode | null>(null);

async function startScanner() {
  const html5QrCode = new Html5Qrcode("qr-reader");
  setScanner(html5QrCode);
  
  await html5QrCode.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 250 },
    async (decodedText) => {
      // Extract token from URL
      const match = decodedText.match(/\/qr\/([a-f0-9-]+)/);
      if (match) {
        const sessionToken = match[1];
        // Find ticket with this session and redeem entry
      }
    },
    (errorMessage) => { /* ignore frame errors */ }
  );
}
```

**UI Element:**
```tsx
<div id="qr-reader" style={{ width: '100%', maxWidth: '500px' }}></div>
<button onClick={scannerActive ? stopScanner : startScanner}>
  {scannerActive ? 'Close Scanner' : 'Scan QR Code'}
</button>
```

## Environment Variables

Required in `.env.local`:

```env
# Resend API Key (get from resend.com)
RESEND_API_KEY=re_xxxxxxxxxxxx

# Verified sender email
EMAIL_FROM=noreply@yourdomain.com

# App URL for QR codes (no trailing slash)
NEXT_PUBLIC_APP_URL=https://yourapp.com
```

## NPM Packages Installed

```bash
npm install qrcode resend html5-qrcode
npm install --save-dev @types/qrcode
```

## Testing Checklist

### 1. Session Initialization
- [ ] Open homepage → Check localStorage has `session_token`
- [ ] Check database: session exists with `anon_*@temp.local` email
- [ ] Refresh page → Same token persists

### 2. Order Fetching
- [ ] New session → My Orders shows empty list (not all orders)
- [ ] After purchase → Orders filtered by session

### 3. Ticket Purchase
- [ ] Fill ticket form → Session updated with real email
- [ ] Check database: session has firstName, lastName, email
- [ ] Ticket created with correct session_id

### 4. Payment & Email
- [ ] Admin marks ticket as paid
- [ ] Email received with QR code image
- [ ] QR URL format: `https://app.com/qr/{token}`

### 5. QR Scan (URL)
- [ ] Click QR link → Redirects to /qr/{token} page
- [ ] Session token stored in localStorage
- [ ] Redirects to /order page
- [ ] Orders loaded correctly

### 6. Camera Scanner
- [ ] Admin clicks "Scan QR Code"
- [ ] Camera permission granted
- [ ] Scanner reads QR from phone screen
- [ ] Ticket found and entry redeemed

### 7. Entry Redemption
- [ ] `entry_redeemed` set to true
- [ ] `entry_redeemed_at` timestamp recorded
- [ ] `entry_redeemed_by` admin identifier saved
- [ ] UI updates showing entry status

## Troubleshooting

### Session Not Created
- Check console for API errors
- Verify `/api/sessions` POST accepts `{anonymous: true}`
- Check Supabase connection

### Orders Show for Wrong User
- Verify `session_token` in localStorage matches database
- Check API filters by `session_id` not email
- Clear localStorage and create new session

### QR Not Generated
- Check environment variable `NEXT_PUBLIC_APP_URL`
- Verify qrcode package installed
- Check API response when marking as paid

### Email Not Sent
- Verify `RESEND_API_KEY` is valid
- Check `EMAIL_FROM` is verified in Resend
- Test with resend.com dashboard

### Camera Scanner Not Working
- Grant browser camera permissions
- Use HTTPS (camera requires secure context)
- Check `html5-qrcode` library loaded
- Test with phone camera at different distances

### QR Scan Doesn't Restore Session
- Verify `/qr/[token]` route exists
- Check token extraction regex
- Verify localStorage write completes before redirect

## Security Considerations

1. **Session Token Storage**: UUID tokens stored in localStorage (client-side)
2. **Anonymous Sessions**: Placeholder emails prevent null values
3. **Email Validation**: Ensure email format validated before sending
4. **QR URL Format**: Use HTTPS in production
5. **Camera Permissions**: Request only when scanner activated
6. **Entry Redemption**: Track who redeemed and when for audit

## Future Enhancements

- [ ] Session expiration (7 days?)
- [ ] Session merge when user logs in
- [ ] Multiple tickets per session support
- [ ] Offline QR scanning with sync
- [ ] Push notifications for ticket updates
- [ ] SMS fallback if email fails

## Files Modified

### Core Session System
- `supabase/migrations/create_sessions_system.sql` - Database schema
- `src/app/api/sessions/route.ts` - Session CRUD
- `src/services/sessionService.ts` - Client-side utilities
- `src/context/ProductsDataContext.tsx` - Session initialization

### QR & Email Integration
- `src/services/qrService.ts` - QR generation
- `src/services/emailService.ts` - Email with Resend
- `src/app/qr/[token]/page.tsx` - QR scan endpoint
- `src/app/api/tickets/[id]/route.ts` - Payment status change

### Admin Interface
- `src/app/admin/tickets/page.tsx` - Camera scanner & mark as paid
- `src/components/TicketsPage.tsx` - Session update on purchase

## Support

For issues or questions:
1. Check browser console for errors
2. Verify environment variables
3. Test database migration ran successfully
4. Check Supabase logs for API errors
