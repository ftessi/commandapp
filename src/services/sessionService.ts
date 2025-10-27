// Session management utility for ticket-based access
// Each ticket purchase creates a session - no device sessions

const TICKET_SESSION_KEY = 'commandapp_ticket_session';

export interface Session {
    id: string;
    session_token: string;
    first_name: string;
    last_name: string;
    email: string;
    created_at: string;
    last_accessed_at: string;
}

export interface TicketInfo {
    ticket_id: string;
    ticket_number: string;
    ticket_type_name: string;
    status: 'pending' | 'paid';
    entry_redeemed: boolean;
    price: number;
    created_at: string;
}

/**
 * Get current ticket session token from localStorage
 */
export const getStoredSessionToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TICKET_SESSION_KEY);
};

/**
 * Store ticket session token in localStorage
 */
export const storeSessionToken = (token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TICKET_SESSION_KEY, token);
    console.log('💾 [SessionService] Ticket session token stored:', token);
};

/**
 * Clear ticket session token from localStorage
 */
export const clearSessionToken = (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TICKET_SESSION_KEY);
    console.log('🗑️ [SessionService] Ticket session token cleared');
};

/**
 * Check if user has an active session (has ticket)
 */
export const hasActiveSession = (): boolean => {
    return getStoredSessionToken() !== null;
};

/**
 * Create device session (called on app load if none exists)
 * This session is permanent and tied to the device
 */
export const createDeviceSession = async (): Promise<Session | null> => {
    try {
        console.log('🔐 [SessionService] Creating device session...');

        const response = await fetch('/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ anonymous: true, device: true })
        });

        if (!response.ok) {
            console.error('❌ [SessionService] Failed to create device session');
            return null;
        }

        const data = await response.json();
        const session = data.session;

        // Store the device token (never changes)
        storeSessionToken(session.session_token);

        console.log('✅ [SessionService] Created device session:', session.id);
        return session;
    } catch (error) {
        console.error('❌ [SessionService] Error in createDeviceSession:', error);
        return null;
    }
};

/**
 * Create a new ticket session (for each ticket purchase)
 * Does NOT update device session token
 */
export const createTicketSession = async (
    firstName: string,
    lastName: string,
    email: string
): Promise<Session | null> => {
    try {
        console.log('🎫 [SessionService] Creating ticket session for:', email);

        const response = await fetch('/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                anonymous: false,
                firstName: firstName,    // ← Changed from first_name
                lastName: lastName,      // ← Changed from last_name
                email: email
            })
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('❌ [SessionService] Failed to create ticket session:', error);
            return null;
        }

        const data = await response.json();
        console.log('✅ [SessionService] Created ticket session:', data.session.id);
        return data.session;
    } catch (error) {
        console.error('❌ [SessionService] Error in createTicketSession:', error);
        return null;
    }
};

/**
 * Get current session info from API
 */
export const getCurrentSession = async (): Promise<Session | null> => {
    const token = getStoredSessionToken();
    if (!token) return null;

    try {
        const response = await fetch(`/api/sessions?token=${token}`);
        if (!response.ok) return null;
        
        const data = await response.json();
        return data.session;
    } catch (error) {
        console.error('❌ [SessionService] Error getting session:', error);
        return null;
    }
};;

/**
 * Validate and restore session from token (e.g., from QR code link)
 */
export const restoreSessionFromToken = async (token: string): Promise<Session | null> => {
    try {
        console.log('🔄 [SessionService] Restoring session from token...');
        
        const response = await fetch(`/api/sessions?token=${token}`);
        if (!response.ok) return null;
        
        const data = await response.json();
        
        // Store token locally
        storeSessionToken(token);
        console.log('✅ [SessionService] Session restored:', data.session.id);
        
        return data.session;
    } catch (error) {
        console.error('❌ [SessionService] Error restoring session:', error);
        return null;
    }
};

/**
 * Get session link for QR code/email
 */
export const getSessionLink = (sessionToken: string): string => {
    if (typeof window === 'undefined') {
        return `${process.env.NEXT_PUBLIC_APP_URL || 'https://yourapp.com'}/qr/${sessionToken}`;
    }
    return `${window.location.origin}/qr/${sessionToken}`;
};;

/**
 * Parse QR code data to extract QR code and session token
 */
export const parseQRData = (qrData: string): { qrCode: string; sessionToken: string } | null => {
    const parts = qrData.split('|');
    if (parts.length === 2) {
        return {
            qrCode: parts[0],
            sessionToken: parts[1]
        };
    }
    // Fallback for old QR codes without session token
    return {
        qrCode: qrData,
        sessionToken: ''
    };
};
