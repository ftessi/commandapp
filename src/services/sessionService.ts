// Session management utility for localStorage and API integration
// Handles session creation, retrieval, and persistence

const SESSION_KEY = 'commandapp_session_token';

export interface Session {
    id: string;
    session_token: string;
    first_name: string;
    last_name: string;
    email: string;
    created_at: string;
    last_accessed_at: string;
}

/**
 * Get session token from localStorage
 */
export const getStoredSessionToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(SESSION_KEY);
};

/**
 * Store session token in localStorage
 */
export const storeSessionToken = (token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SESSION_KEY, token);
    console.log('💾 [SessionService] Session token stored:', token);
};

/**
 * Clear session token from localStorage
 */
export const clearSessionToken = (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(SESSION_KEY);
    console.log('🗑️ [SessionService] Session token cleared');
};

/**
 * Create or retrieve session
 * If user has a stored token, validates it
 * Otherwise creates new session with user info
 */
export const getOrCreateSession = async (
    firstName: string,
    lastName: string,
    email: string
): Promise<Session | null> => {
    try {
        const existingToken = getStoredSessionToken();
        
        console.log('🔐 [SessionService] Getting or creating session...');
        console.log('   Existing token:', existingToken ? 'Found' : 'None');
        console.log('   User:', firstName, lastName, email);

        const response = await fetch('/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                firstName,
                lastName,
                email,
                existingToken
            })
        });

        if (!response.ok) {
            console.error('❌ [SessionService] Failed to create/get session');
            return null;
        }

        const data = await response.json();
        const session = data.session;

        // Store the token
        storeSessionToken(session.session_token);

        if (data.existing) {
            console.log('✅ [SessionService] Retrieved existing session:', session.id);
        } else {
            console.log('✅ [SessionService] Created new session:', session.id);
        }

        return session;
    } catch (error) {
        console.error('❌ [SessionService] Error in getOrCreateSession:', error);
        return null;
    }
};

/**
 * Retrieve session from API by token
 */
export const getSessionByToken = async (token: string): Promise<Session | null> => {
    try {
        console.log('🔍 [SessionService] Fetching session by token:', token);
        
        const response = await fetch(`/api/sessions?token=${token}`);

        if (!response.ok) {
            console.error('❌ [SessionService] Session not found');
            return null;
        }

        const data = await response.json();
        console.log('✅ [SessionService] Session retrieved:', data.session.id);
        
        // Update stored token
        storeSessionToken(token);
        
        return data.session;
    } catch (error) {
        console.error('❌ [SessionService] Error fetching session:', error);
        return null;
    }
};

/**
 * Validate current session token
 */
export const validateSession = async (): Promise<Session | null> => {
    const token = getStoredSessionToken();
    
    if (!token) {
        console.log('ℹ️ [SessionService] No session token found');
        return null;
    }

    return await getSessionByToken(token);
};

/**
 * Get app link with session token for sharing (e.g., in QR code)
 */
export const getSessionLink = (sessionToken: string): string => {
    if (typeof window === 'undefined') {
        return `https://yourapp.com/session/${sessionToken}`;
    }
    return `${window.location.origin}/session/${sessionToken}`;
};

/**
 * Generate QR code data that includes session token
 * This will be used in ticket QR codes
 */
export const generateQRData = (qrCode: string, sessionToken: string): string => {
    // QR data format: QR_CODE|SESSION_TOKEN
    // This allows both ticket validation AND session recovery
    return `${qrCode}|${sessionToken}`;
};

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
